// 2.7.4: la caché de la carga. Lo que el arranque calcula siempre igual (las texturas
// procedurales y los datos del valle) se guarda en IndexedDB la primera vez y en los
// arranques siguientes se lee en vez de recalcularse. Es sólo un atajo: los datos
// guardados son los mismos bytes que se calcularían, y ante cualquier duda (otra versión,
// otro código, tamaño o suma de control que no dan, IndexedDB que no está o falla) se
// vuelven a calcular como siempre. Nunca puede impedir que el juego arranque.
//
// Cada registro lleva una CLAVE que junta la versión del juego, `GENERACION_CACHE`, la
// semilla y la huella del texto del código que genera los datos (ver `fuenteTerreno` y
// `fuenteGenerador`): si cambia cualquier cosa de eso, lo guardado no se lee. Borrar el
// localStorage (como hacen las pruebas) no borra IndexedDB; por eso la clave, y no la
// memoria de "ya lo guardé", decide si sirve.
//
// Lo de acá arriba (huellas, sumas, claves) es puro y se prueba en Node
// (`pruebas/verificar-2-7-4-carga.mjs`); lo de IndexedDB sólo corre en el juego.

// Subirlo si cambia algo que decide los datos y que la huella del código no ve.
export const GENERACION_CACHE = 1;
const BASE = 'hojarasca-carga', ALMACEN = 'datos';
// Si IndexedDB tarda más que esto en abrir o en leer, se calcula (leer tarda ~20–70 ms):
// una caché lenta nunca puede hacer la carga más lenta que no tenerla, salvo este rato.
const PLAZO_MS = 1500;

// FNV-1a de 32 bits sobre un texto (dos pasadas con distinto comienzo: 64 bits en hexa)
export function huellaTexto(texto) {
  let a = 0x811c9dc5, b = 0x01000193 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x01000193) ^ (b >>> 13);
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

// Suma de control de los bytes de un arreglo tipado (FNV-1a de a palabras de 32 bits).
export function sumaBytes(vista) {
  const bytes = new Uint8Array(vista.buffer, vista.byteOffset, vista.byteLength);
  const n = bytes.length, palabras = n >>> 2;
  let h = 0x811c9dc5 ^ n;
  if ((bytes.byteOffset & 3) === 0) {
    const w = new Uint32Array(bytes.buffer, bytes.byteOffset, palabras);
    for (let i = 0; i < palabras; i++) h = Math.imul(h ^ w[i], 0x01000193);
  } else {
    for (let i = 0; i < palabras; i++) {
      const k = i * 4;
      h = Math.imul(h ^ (bytes[k] | (bytes[k + 1] << 8) | (bytes[k + 2] << 16) | (bytes[k + 3] << 24)), 0x01000193);
    }
  }
  for (let i = palabras * 4; i < n; i++) h = Math.imul(h ^ bytes[i], 0x01000193);
  return h >>> 0;
}

// La versión del juego, del comentario que deja armar.mjs en el <head>
// (`<!-- HOJARASCA BUILD 2.7.4 -->`); sin build (o sin documento), 'dev'.
export function versionDelBuild(doc = globalThis.document) {
  try {
    for (const n of doc?.head?.childNodes || []) {
      const m = n.nodeType === 8 && /HOJARASCA BUILD (\S+)/.exec(n.data);
      if (m) return m[1];
    }
  } catch { /* sin documento */ }
  return 'dev';
}

// La clave de un registro: todo lo que, si cambia, tiene que invalidar lo guardado.
export function claveCarga({ que, version, semilla = '', fuente, extra = '' }) {
  return [que, `v${version}`, `g${GENERACION_CACHE}`, `s${semilla}`, `f${huellaTexto(fuente)}`, extra].join('|');
}

// Arma un registro para guardar: cada parte con su tamaño y su suma de control. Todo se
// COPIA acá, en el momento: el juego puede seguir usando (y cambiando) sus arreglos y
// objetos, y lo que se guarda es cómo estaban al calcularse.
export function armarRegistro(clave, partes, meta = null) {
  const copiaMeta = meta === null ? null : structuredClone(meta);
  const r = { clave, partes: {}, meta: copiaMeta, sumaMeta: copiaMeta === null ? 0 : huellaTexto(JSON.stringify(copiaMeta)) };
  for (const [nombre, datos] of Object.entries(partes)) {
    const copia = datos.slice();
    r.partes[nombre] = { datos: copia, tipo: copia.constructor.name, bytes: copia.byteLength, suma: sumaBytes(copia) };
  }
  return r;
}

// Revisa un registro leído. `esperado` = { nombre: { tipo, bytes } }. Devuelve
// { partes, meta } si todo da, o null.
export function validarRegistro(r, clave, esperado) {
  if (!r || typeof r !== 'object' || r.clave !== clave || !r.partes) return null;
  const partes = {};
  for (const [nombre, e] of Object.entries(esperado)) {
    const p = r.partes[nombre];
    if (!p || !ArrayBuffer.isView(p.datos)) return null;
    if (p.datos.constructor.name !== e.tipo || p.tipo !== e.tipo) return null;
    if (p.datos.byteLength !== e.bytes || p.bytes !== e.bytes) return null;
    if (sumaBytes(p.datos) !== p.suma) return null;
    partes[nombre] = p.datos;
  }
  if (r.meta !== null && r.meta !== undefined) {
    if (huellaTexto(JSON.stringify(r.meta)) !== r.sumaMeta) return null;
  } else if (r.sumaMeta) return null;
  return { partes, meta: r.meta ?? null };
}

// ---------------------------------------------------------------- IndexedDB
const conPlazo = (promesa, ms) => new Promise((ok, mal) => {
  const t = setTimeout(() => mal(new Error('plazo')), ms);
  promesa.then((v) => { clearTimeout(t); ok(v); }, (e) => { clearTimeout(t); mal(e); });
});

let base = null;
function abrirBase() {
  if (base) return base;
  base = conPlazo(new Promise((ok, mal) => {
    const idb = globalThis.indexedDB;
    if (!idb) { mal(new Error('sin IndexedDB')); return; }
    const pedido = idb.open(BASE, 1);
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains(ALMACEN)) db.createObjectStore(ALMACEN);
    };
    pedido.onsuccess = () => ok(pedido.result);
    pedido.onerror = () => mal(pedido.error || new Error('no abre'));
    pedido.onblocked = () => mal(new Error('bloqueada'));
  }), PLAZO_MS);
  base.catch(() => {});
  return base;
}

// Lee y valida. Cualquier problema: null (y el que llama calcula como siempre).
// (armar.mjs no reconoce `export async function`: va como constante)
export const leerCache = async (id, clave, esperado, plazoMs = PLAZO_MS) => {
  try {
    const db = await abrirBase();
    const r = await conPlazo(new Promise((ok, mal) => {
      const tx = db.transaction(ALMACEN, 'readonly');
      const pedido = tx.objectStore(ALMACEN).get(id);
      pedido.onsuccess = () => ok(pedido.result);
      pedido.onerror = () => mal(pedido.error || new Error('no lee'));
    }), plazoMs);
    return validarRegistro(r, clave, esperado);
  } catch {
    return null;
  }
};

// Guarda un registro de `armarRegistro` (pisando lo que hubiera con ese id). Si falla,
// no pasa nada: la próxima vez se calcula de nuevo.
export function guardarCache(id, registro) {
  return abrirBase().then((db) => new Promise((ok) => {
    try {
      const tx = db.transaction(ALMACEN, 'readwrite');
      tx.objectStore(ALMACEN).put(registro, id);
      tx.oncomplete = () => ok(true);
      tx.onerror = tx.onabort = () => ok(false);
    } catch { ok(false); }
  })).catch(() => false);
}
