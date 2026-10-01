// 2.7: texturas procedurales de detalle. Se generan UNA vez (la primera vez que un
// material las pide), a partir de ruido con semilla, y quedan en caché. No hay archivos
// ni descargas: todo sale de este módulo.
//
// Son texturas de DETALLE, no de color: el color sigue saliendo del vértice (especie,
// estación, variación por árbol), y la textura sólo lo modula y le da relieve. Por eso
// guardan valores en escala de grises, empaquetados por canal:
//   texturaVegetal (256²)  R corteza · G tablas/madera · B roca · A follaje
//   texturaVegetalRelieve  pendiente de la corteza (RG) y de la roca (BA)
//   texturaSuelo   (512²)  R tierra  · G pasto/hojarasca · B roca · A variación grande
//   texturaMontana (256²)  R altura de crestas · GB pendiente (x, z) · A manchas de nieve
//   texturaManchas (512², todo el valle) R pasto seco · G bajo húmedo · B tono
//   texturaHojas   (512×256, con alfa) mitad izquierda: ramito de hojas anchas ·
//                  mitad derecha: ramito de agujas/escamas (coníferas)
// Todas son repetibles (el ruido es periódico), con mipmaps y filtrado anisotrópico.
//
// 2.7.4: los DATOS (los bytes) salen de `texturas-datos.js`. Al arrancar, main.js llama a
// `prepararTexturas()`: los lee de la caché de la carga o los calcula en un Worker, en
// paralelo con el terreno y el bosque, y los deja listos acá. Cada textura se sigue
// creando cuando un material la pide, igual que antes, con esos bytes; si todavía no
// llegaron (o el Worker no pudo), se calculan en el momento como siempre. Los bytes son
// los mismos por cualquiera de los caminos.
import * as THREE from 'three';
import { TEXTURAS, GENERADORES, generarDatos, fuenteGenerador } from './texturas-datos.js';
import { GENERADORES_EN_USO } from './texturas-datos.js';
import { claveCarga, versionDelBuild, armarRegistro, leerCache, guardarCache } from './cache-carga.js';

// 2.7: nivel de detalle material. 0 = como antes (sin texturas ni hojas en tarjetas),
// 1 = texturas + follaje en tarjetas. Lo fija main.js según la calidad al arrancar.
// 3.2: con el estilo pintado los materiales del mundo ya no piden la corteza, el suelo, la
// montaña ni las hojas: sólo las manchas del prado (suelo y pasto) y, en la mano, la de
// madera (enmano.js). Las demás se siguen generando igual (la caché de la carga y su prueba
// esperan los mismos bytes), pero nunca se suben a la placa.
// 3.3: ya no: la carga sólo calcula (y guarda en la caché) las de GENERADORES_EN_USO. Las
// otras siguen disponibles, con los mismos bytes, calculadas en el momento si alguien las pide.
const estado = { nivel: 1, anisotropia: 4 };
const cache = {};
// 2.7.4: bytes ya calculados que esperan su textura, y cómo se consiguieron
const listos = {};
const origen = {};

export function configurarTexturas(calidad, renderer = null) {
  estado.nivel = calidad && calidad.texturas !== undefined ? (calidad.texturas ? 1 : 0) : 1;
  const maxAniso = renderer?.capabilities?.getMaxAnisotropy?.() || 1;
  estado.anisotropia = Math.max(1, Math.min(calidad?.anisotropia || 4, maxAniso));
  return estado.nivel;
}
export const nivelTexturas = () => estado.nivel;

// Regiones del atlas de hojas: [u0, v0, ancho, alto]
export const REGION_HOJA = { ancha: [0.0, 0.0, 0.5, 1.0], aguja: [0.5, 0.0, 0.5, 1.0] };

// El runtime de three incluido no exporta todas las constantes de textura: se usan sus
// valores (los mismos de three: RepeatWrapping 1000, ClampToEdgeWrapping 1001,
// LinearMipmapLinearFilter 1008).
const REPETIR = 1000, BORDE = 1001, MIPMAP_LINEAL = 1008;

function aTextura(datos, ancho, alto, repetir = true, aniso = 1) {
  const t = new THREE.DataTexture(datos, ancho, alto, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = repetir ? REPETIR : BORDE;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = MIPMAP_LINEAL;
  t.generateMipmaps = true;
  // el filtrado anisotrópico se reserva al suelo (se mira de canto); en la vegetación
  // cuesta más de lo que se ve
  t.anisotropy = aniso;
  // colorSpace queda en el de fábrica (sin espacio de color): son datos, no color
  t.needsUpdate = true;
  return t;
}

// 2.7.4: los bytes de una textura: los que ya llegaron o, si no, se calculan ahora
function datosDe(nombre) {
  if (!listos[nombre]) {
    const gen = TEXTURAS[nombre].gen;
    for (const [n, d] of Object.entries(generarDatos(gen))) if (!listos[n]) { listos[n] = d; origen[n] = 'en el momento'; }
  }
  return listos[nombre];
}
function crear(nombre) {
  const t = TEXTURAS[nombre];
  return aTextura(datosDe(nombre), t.ancho, t.alto, t.repetir, t.aniso ? estado.anisotropia : 1);
}

// (el orden de creación es el de siempre: el relieve vegetal nace junto con el vegetal,
// y antes que él)
export function texturaManchas() { return cache.manchas || (cache.manchas = crear('manchas')); }
export function texturaMontana() { return cache.montana || (cache.montana = crear('montana')); }
export function texturaVegetal() {
  if (!cache.vegetal) { cache.vegetalRelieve = crear('vegetalRelieve'); cache.vegetal = crear('vegetal'); }
  return cache.vegetal;
}
// pendientes de corteza (RG) y roca (BA), codificadas alrededor de 0,5
export function texturaVegetalRelieve() { texturaVegetal(); return cache.vegetalRelieve; }
export function texturaSuelo() { return cache.suelo || (cache.suelo = crear('suelo')); }
export function texturaHojas() { return cache.hojas || (cache.hojas = crear('hojas')); }

// ---------------------------------------------------------------- 2.7.4: preparar antes
const esperando = {};   // generador → { promesa, listo }
function esperaDe(gen) {
  if (!esperando[gen]) { let listo; const promesa = new Promise((r) => { listo = r; }); esperando[gen] = { promesa, listo }; }
  return esperando[gen];
}
const soltarTodo = () => { for (const gen of GENERADORES_EN_USO) esperaDe(gen).listo(); };   // 3.3: sólo las que se usan

const esperadoCache = () => {
  const e = {};
  for (const [n, t] of Object.entries(TEXTURAS)) if (GENERADORES_EN_USO.includes(t.gen)) e[n] = { tipo: 'Uint8Array', bytes: t.ancho * t.alto * 4 };
  return e;
};
export function claveTexturas(version = versionDelBuild()) {
  return claveCarga({ que: 'texturas', version, fuente: fuenteGenerador() });
}

// Consigue los bytes de todas las texturas sin trabar la carga: de la caché o de un
// Worker. Devuelve una promesa que se cumple cuando terminó (bien o mal: si algo falla,
// las texturas se calculan en el momento, como siempre). Con el detalle apagado no hace
// nada (ninguna textura se va a pedir).
let preparando = null;
export function prepararTexturas() {
  if (preparando) return preparando;
  if (estado.nivel === 0) { soltarTodo(); return (preparando = Promise.resolve('sin texturas')); }
  for (const gen of GENERADORES_EN_USO) esperaDe(gen);
  preparando = (async () => {
    let clave = null;
    try {
      clave = claveTexturas();
      const leido = await leerCache('texturas', clave, esperadoCache());
      if (leido) {
        for (const [n, d] of Object.entries(leido.partes)) if (!listos[n]) { listos[n] = d; origen[n] = 'caché'; }
        soltarTodo();
        return 'caché';
      }
    } catch { /* se calcula */ }
    const res = await calcularEnWorker();
    soltarTodo();
    // lo recién calculado queda para la próxima vez (sólo si llegó todo del Worker)
    if (res === 'worker' && clave) {
      const partes = {};
      for (const n of Object.keys(esperadoCache())) partes[n] = listos[n];
      guardarCache('texturas', armarRegistro(clave, partes));
    }
    return res;
  })().catch(() => { soltarTodo(); return 'error'; });
  return preparando;
}

// Espera a que estén (o a que se sepa que no van a venir) los datos de estas texturas.
export function esperarTexturas(...nombres) {
  if (!preparando) return Promise.resolve();
  // 3.3: las que no se calculan al cargar no se esperan (si alguien las pide, salen en el momento)
  const gens = new Set((nombres.length ? nombres.map((n) => TEXTURAS[n].gen) : GENERADORES).filter((g) => GENERADORES_EN_USO.includes(g)));
  return Promise.all([...gens].map((g) => esperaDe(g).promesa));
}

// Para las pruebas y el modo de depuración: de dónde salió cada textura
export const origenTexturas = () => ({ ...origen });

function calcularEnWorker() {
  return new Promise((resolver) => {
    let w = null, url = null, quedan = GENERADORES_EN_USO.length, fallo = false;
    const terminar = (r) => {
      clearTimeout(plazo);
      try { w?.terminate(); } catch { /* ya está */ }
      try { if (url) URL.revokeObjectURL(url); } catch { /* ya está */ }
      resolver(r);
    };
    // si el Worker no contesta en un tiempo razonable, las texturas se hacen en el momento
    const plazo = setTimeout(() => terminar('plazo'), 20000);
    try {
      url = URL.createObjectURL(new Blob([fuenteGenerador()], { type: 'text/javascript' }));
      w = new Worker(url);
      w.onmessage = (e) => {
        const { gen, datos, error } = e.data || {};
        if (error || !datos) fallo = true;
        else for (const [n, d] of Object.entries(datos)) {
          const t = TEXTURAS[n];
          if (!listos[n] && d instanceof Uint8Array && d.length === t.ancho * t.alto * 4) { listos[n] = d; origen[n] = 'worker'; }
        }
        if (gen) esperaDe(gen).listo();
        if (--quedan === 0) terminar(fallo ? 'worker incompleto' : 'worker');
      };
      w.onerror = (e) => { e?.preventDefault?.(); terminar('worker con error'); };
      w.postMessage({ generadores: GENERADORES_EN_USO });
    } catch {
      terminar('sin worker');
    }
  });
}
