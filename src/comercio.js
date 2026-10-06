// 2.9: el comercio entre pueblos por la trochita, y los fletes del maquinista.
//
// Cada parada tiene su puesto de cargas: compra y vende lo que se hace en el valle
// (madera, piedra, lana, lo de la huerta, las conservas, el pescado) a precios que
// cambian de una parada a otra y con la estación del año. Lo barato en un pueblo es
// caro en otro: se compra en uno, se sube al tren y se vende en el otro. La carga es
// lo que llevás encima, así que viaja con vos en un asiento o en la cabina.
//
// No hay plata en el valle: se paga en yerba, como en el almacén de Ercilia, en la
// feria y en la revista de las fotos. Cada cosa va de a lotes (una docena de huevos no
// vale lo mismo que un poncho) y cada puesto compra y vende unos pocos lotes por día:
// después de cada lote el precio se corre, así que no hay vuelta gratis en el mismo
// andén. Todo sale de la fecha y del nombre de la parada: dos partidas el mismo día ven
// los mismos precios, y vuelven a ser los mismos si recargás.
//
// Los fletes: cada parada ofrece por día un viaje con pasajeros y uno con carga hasta
// otra parada. Se toman en el puesto y se cobran sólo si llegás manejando la trochita.
//
// Módulo puro (se prueba en Node). Sólo en el Relax.

// `donde`: de dónde sale y adónde va lo que tenés. 'material' → progreso.materiales,
// 'entrada' → progreso.entradas[id].cantidad (lo del cuaderno), 'cosa' → progreso.cosas.
// `lote`: cuántos van juntos; `valor`: lo que vale el lote, en yerba, en un pueblo cualquiera.
export const BIENES = {
  tronco: { nombre: 'Troncos', donde: 'material', lote: 2, valor: 3 },
  tabla: { nombre: 'Tablas', donde: 'material', lote: 4, valor: 4 },
  piedra: { nombre: 'Piedras', donde: 'material', lote: 4, valor: 4 },
  cristal: { nombre: 'Cristales', donde: 'material', lote: 1, valor: 8 },
  lana: { nombre: 'Vellones de lana', donde: 'material', lote: 2, valor: 6 },
  huevo: { nombre: 'Huevos', donde: 'entrada', lote: 6, valor: 5 },
  haba: { nombre: 'Habas', donde: 'entrada', lote: 4, valor: 4 },
  papa: { nombre: 'Papas', donde: 'entrada', lote: 4, valor: 4 },
  frutilla: { nombre: 'Frutillas', donde: 'entrada', lote: 5, valor: 4 },
  miel: { nombre: 'Frascos de miel', donde: 'entrada', lote: 1, valor: 6 },
  'trucha-fresca': { nombre: 'Truchas frescas', donde: 'entrada', lote: 2, valor: 5 },
  'trucha-ahumada': { nombre: 'Truchas ahumadas', donde: 'entrada', lote: 1, valor: 6 },
  'frasco-frutilla': { nombre: 'Frascos de dulce', donde: 'entrada', lote: 1, valor: 7 },
  'calafate-seco': { nombre: 'Calafates secos', donde: 'entrada', lote: 1, valor: 5 },
  'hongos-secos': { nombre: 'Llao llao seco', donde: 'entrada', lote: 1, valor: 6 },
  'pan-casero': { nombre: 'Panes caseros', donde: 'entrada', lote: 3, valor: 6 },
  empanadas: { nombre: 'Empanadas', donde: 'entrada', lote: 4, valor: 7 },
  harina: { nombre: 'Medidas de harina', donde: 'cosa', lote: 4, valor: 5 },
  poncho: { nombre: 'Ponchos', donde: 'cosa', lote: 1, valor: 20 },
};
export const ID_BIENES = Object.keys(BIENES);
export const esBien = (id) => typeof id === 'string' && Object.hasOwn(BIENES, id);

export const COMERCIO = {
  lotesPorDia: 6,        // lo que cada puesto compra (y vende) de cada cosa por día
  corrimiento: 0.08,     // cuánto se corre el precio después de cada lote
  margen: 0.12,          // lo que el puesto se queda entre lo que paga y lo que cobra
  barato: 0.62,          // lo que se hace en el pueblo
  caro: 1.5,             // lo que el pueblo necesita
  fletesPorDia: 2,
  fletesALaVez: 3,
  fletesConFurgon: 5,    // 3.7.3: con el furgón de carga del tren se llevan más a la vez (ver tren-viaje.js)
};

// Lo que hace y lo que pide cada pueblo, por el nombre de su parada (ver `trochita.js`:
// los nombres salen de lo que queda cerca de cada parada). `quien` atiende el puesto.
const PERFILES = {
  'Estación del Valle': { quien: 'Don Aurelio, el jefe de estación', produce: ['harina', 'tabla'], pide: ['huevo', 'poncho', 'pan-casero'], otros: ['piedra', 'miel', 'trucha-ahumada'] },
  'Parada del Mallín': { quien: 'La acopiadora del mallín', produce: ['lana', 'huevo', 'haba'], pide: ['tabla', 'harina', 'frasco-frutilla'], otros: ['papa', 'tronco'] },
  'Apeadero del Faro': { quien: 'La hija del farero', produce: ['trucha-fresca', 'trucha-ahumada'], pide: ['lana', 'poncho', 'tronco', 'pan-casero'], otros: ['miel', 'papa'] },
  'Parada Arrayanes': { quien: 'El apicultor de los arrayanes', produce: ['miel', 'frutilla', 'calafate-seco'], pide: ['piedra', 'tabla', 'trucha-ahumada'], otros: ['huevo', 'harina'] },
  'Parada Alta': { quien: 'El capataz de la cantera', produce: ['piedra', 'cristal'], pide: ['empanadas', 'pan-casero', 'lana', 'tronco'], otros: ['harina', 'hongos-secos'] },
  'Parada del Molino': { quien: 'La molinera', produce: ['harina', 'pan-casero'], pide: ['tronco', 'haba', 'papa', 'miel'], otros: ['huevo', 'piedra'] },
  'Apeadero de la Casa de Té': { quien: 'Las galesas de la casa de té', produce: ['pan-casero', 'empanadas'], pide: ['miel', 'frasco-frutilla', 'frutilla', 'huevo'], otros: ['calafate-seco', 'harina'] },
  'Parada del Mirador': { quien: 'El baqueano del mirador', produce: ['piedra', 'hongos-secos'], pide: ['frasco-frutilla', 'empanadas', 'poncho'], otros: ['tronco', 'lana', 'cristal'] },
  'Apeadero del Pescador': { quien: 'El pescador del apeadero', produce: ['trucha-fresca', 'trucha-ahumada'], pide: ['tronco', 'pan-casero', 'empanadas'], otros: ['papa', 'lana'] },
  'Parada del Bosque': { quien: 'El hachero de la parada', produce: ['tronco', 'tabla', 'hongos-secos'], pide: ['piedra', 'lana', 'miel'], otros: ['huevo', 'harina'] },
  // 3.6: la parada del sur en el Relax (ver aldea.js): atiende Ernesto, el jefe de estación. La aldea
  // crece y necesita material de obra; hace dulce de rosa mosqueta y tiene huevos de sobra.
  'Aldea de los Duendes': { quien: 'Ernesto, el jefe de estación de la aldea', produce: ['frasco-frutilla', 'huevo', 'calafate-seco'], pide: ['tabla', 'piedra', 'tronco', 'lana'], otros: ['harina', 'pan-casero'] },
};

// Cómo cambia cada cosa con la estación: en invierno no hay fruta fresca y la leña y la
// lana valen oro; en otoño se cosecha la papa y salen los hongos; en verano sobra fruta.
const TEMPORADA = {
  verano: { frutilla: 0.75, lana: 0.85, poncho: 0.75, haba: 0.9, 'trucha-fresca': 0.9, tronco: 0.85, miel: 1.1 },
  otono: { papa: 0.8, 'hongos-secos': 0.8, miel: 1.15, tronco: 1.15, frutilla: 1.2, 'calafate-seco': 0.9 },
  invierno: { tronco: 1.5, tabla: 1.2, lana: 1.4, poncho: 1.45, frutilla: 1.7, 'frasco-frutilla': 1.35, 'calafate-seco': 1.3, 'hongos-secos': 1.25, 'trucha-ahumada': 1.2, huevo: 1.2, haba: 1.25, papa: 1.15 },
};
export const TEMPORADAS = Object.keys(TEMPORADA);
const temporadaValida = (t) => (typeof t === 'string' && Object.hasOwn(TEMPORADA, t) ? t : 'verano');

// ---------------------------------------------------------------- el azar con semilla
function hashTexto(t) {
  let h = 2166136261 >>> 0;
  const s = String(t);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function azarDe(semilla) {
  let s = ((semilla >>> 0) * 2654435761 + 0x9e3779b9) >>> 0;
  if (!s) s = 0x1234567;
  return () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };
}
const dia1 = (d) => Math.max(1, Math.floor(Number(d) || 1));

// ---------------------------------------------------------------- los pueblos
// Una parada que no está en la lista (un mundo con otro nombre) arma su perfil del nombre.
export function perfilDe(nombre) {
  const n = String(nombre || '');
  if (Object.hasOwn(PERFILES, n)) return PERFILES[n];
  const r = azarDe(hashTexto(n));
  const pool = [...ID_BIENES];
  const saca = () => pool.splice(Math.floor(r() * pool.length), 1)[0];
  return { quien: 'El encargado del puesto', produce: [saca(), saca()], pide: [saca(), saca(), saca()], otros: [saca(), saca()] };
}
// Lo que se compra y se vende en el puesto: nueve cosas como mucho (una por número).
export function bienesDe(nombre) {
  const p = perfilDe(nombre);
  return [...new Set([...p.produce, ...p.pide, ...p.otros])].filter(esBien).slice(0, 9);
}

// Lo que vale un lote hoy en ese pueblo, sin el margen del puesto.
export function valorDe(nombre, bien, dia, temporada) {
  if (!esBien(bien)) return 0;
  const p = perfilDe(nombre);
  const t = TEMPORADA[temporadaValida(temporada)];
  let v = BIENES[bien].valor;
  if (p.produce.includes(bien)) v *= COMERCIO.barato;
  else if (p.pide.includes(bien)) v *= COMERCIO.caro;
  if (Object.hasOwn(t, bien)) v *= t[bien];
  // lo del día: ±12%, el mismo para el mismo pueblo, la misma cosa y la misma fecha
  const r = azarDe(hashTexto(`${nombre}|${bien}|${dia1(dia)}`));
  v *= 0.88 + r() * 0.24;
  return v;
}

// ---------------------------------------------------------------- el estado guardado
// `hoy`: lo que se movió hoy en cada puesto ("parada|bien" → lotes) y los fletes que ya
// se tomaron hoy. `fletes`: los que llevás. `ganado` y `entregas`: para el cuaderno.
export function comercioNuevo() {
  return { hoy: { dia: 0, vendidos: {}, comprados: {}, tomados: [] }, fletes: [], ganado: 0, entregas: 0, km: 0 };
}
const entero = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
const texto = (v, max = 48) => (typeof v === 'string' ? v.slice(0, max) : '');
function sanearCuentas(v) {
  const limpio = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return limpio;
  for (const [k, n] of Object.entries(v)) {
    const [parada, bien] = String(k).split('|');
    if (!parada || !esBien(bien) || k.length > 80) continue;
    const c = entero(n, 99);
    if (c > 0) limpio[k] = c;
  }
  return limpio;
}
function sanearFlete(f) {
  if (!f || typeof f !== 'object' || Array.isArray(f)) return null;
  const tipo = f.tipo === 'carga' ? 'carga' : f.tipo === 'pasajeros' ? 'pasajeros' : null;
  const desde = texto(f.desde), hasta = texto(f.hasta), id = texto(f.id, 80);
  if (!tipo || !desde || !hasta || !id || desde === hasta) return null;
  const premio = { yerba: entero(f.premio?.yerba, 99) };
  const mat = f.premio?.material;
  if (mat && typeof mat === 'object' && esBien(mat.k) && BIENES[mat.k].donde === 'material') premio.material = { k: mat.k, n: Math.max(1, entero(mat.n, 20)) };
  return { id, tipo, desde, hasta, cuantos: Math.max(1, entero(f.cuantos, 30)), que: texto(f.que, 60), premio, dia: entero(f.dia, 1e6) };
}
export function sanearComercio(v) {
  const base = comercioNuevo();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return base;
  const h = v.hoy && typeof v.hoy === 'object' && !Array.isArray(v.hoy) ? v.hoy : {};
  const fletes = (Array.isArray(v.fletes) ? v.fletes : []).map(sanearFlete).filter(Boolean);
  const vistos = new Set();
  return {
    hoy: {
      dia: entero(h.dia, 1e6),
      vendidos: sanearCuentas(h.vendidos), comprados: sanearCuentas(h.comprados),
      tomados: (Array.isArray(h.tomados) ? h.tomados : []).filter((x) => typeof x === 'string' && x.length <= 80).slice(0, 40),
    },
    fletes: fletes.filter((f) => !vistos.has(f.id) && vistos.add(f.id)).slice(0, COMERCIO.fletesConFurgon),
    ganado: entero(v.ganado, 1e7), entregas: entero(v.entregas, 1e6), km: Math.max(0, Math.min(1e6, Number(v.km) || 0)),
  };
}
// El de hoy: si lo guardado es de otro día, las cuentas de los puestos arrancan de cero
// (los fletes que llevás siguen con vos).
export function comercioDeHoy(c, dia) {
  const x = c && typeof c === 'object' && c.hoy ? c : sanearComercio(c);
  if (x.hoy.dia !== dia1(dia)) x.hoy = { dia: dia1(dia), vendidos: {}, comprados: {}, tomados: [] };
  return x;
}

// 3.6: una parada que cambió de nombre (la del sur pasó a ser la Aldea de los Duendes en el
// Relax): lo guardado con el nombre viejo (los fletes que llevás y lo movido hoy en el puesto)
// pasa al nuevo, así no queda un flete imposible de entregar. Devuelve cuántas cosas cambió.
export function renombrarParada(c, viejo, nuevo) {
  if (!c || typeof c !== 'object' || typeof viejo !== 'string' || typeof nuevo !== 'string' || !viejo || !nuevo || viejo === nuevo) return 0;
  let n = 0;
  for (const f of Array.isArray(c.fletes) ? c.fletes : []) {
    if (!f || typeof f !== 'object') continue;
    if (f.desde === viejo) { f.desde = nuevo; n++; }
    if (f.hasta === viejo) { f.hasta = nuevo; n++; }
    // (el id lleva la parada de donde sale: 'día|parada|k')
    if (typeof f.id === 'string') { const p = f.id.split('|'); if (p[1] === viejo) { p[1] = nuevo; f.id = p.join('|'); } }
  }
  for (const cuenta of ['vendidos', 'comprados']) {
    const v = c.hoy?.[cuenta];
    if (!v || typeof v !== 'object') continue;
    for (const k of Object.keys(v)) {
      const [parada, bien] = k.split('|');
      if (parada !== viejo) continue;
      const k2 = `${nuevo}|${bien}`;
      v[k2] = (v[k2] || 0) + v[k]; delete v[k]; n++;
    }
  }
  if (Array.isArray(c.hoy?.tomados)) c.hoy.tomados = c.hoy.tomados.map((id) => { const p = String(id).split('|'); if (p[1] === viejo) { p[1] = nuevo; n++; return p.join('|'); } return id; });
  return n;
}

// ---------------------------------------------------------------- precios
// `compra`: lo que pagás por un lote; `venta`: lo que te dan. El puesto nunca paga más de
// lo que cobra, así que comprar y vender en el mismo andén siempre pierde.
export function precios(c, nombre, bien, dia, temporada) {
  if (!esBien(bien)) return null;
  const clave = `${nombre}|${bien}`;
  const comprados = c?.hoy?.comprados?.[clave] || 0, vendidos = c?.hoy?.vendidos?.[clave] || 0;
  const v = valorDe(nombre, bien, dia, temporada);
  const venta = Math.max(1, Math.floor(v * (1 - COMERCIO.margen) * Math.max(0.3, 1 - COMERCIO.corrimiento * vendidos)));
  const compra = Math.max(venta + 1, Math.ceil(v * (1 + COMERCIO.margen) * (1 + COMERCIO.corrimiento * comprados)));
  return {
    compra, venta, lote: BIENES[bien].lote,
    quedanCompra: Math.max(0, COMERCIO.lotesPorDia - comprados),
    quedanVenta: Math.max(0, COMERCIO.lotesPorDia - vendidos),
  };
}

// Comprar un lote: `yerba` es lo que tenés. Anota el lote en el puesto y dice cuánto se
// paga; lo que tenés lo cambia el juego (la yerba baja, la cosa sube).
export function comprar(c, nombre, bien, dia, temporada, yerba) {
  if (!esBien(bien) || !bienesDe(nombre).includes(bien)) return { ok: false, motivo: 'no hay' };
  const p = precios(c, nombre, bien, dia, temporada);
  if (p.quedanCompra <= 0) return { ok: false, motivo: 'agotado' };
  if ((Number(yerba) || 0) < p.compra) return { ok: false, motivo: 'yerba', precio: p.compra };
  const clave = `${nombre}|${bien}`;
  c.hoy.comprados[clave] = (c.hoy.comprados[clave] || 0) + 1;
  return { ok: true, precio: p.compra, cantidad: p.lote };
}
// Vender un lote: `tengo` es cuánto tenés de eso.
export function vender(c, nombre, bien, dia, temporada, tengo) {
  if (!esBien(bien) || !bienesDe(nombre).includes(bien)) return { ok: false, motivo: 'no hay' };
  const p = precios(c, nombre, bien, dia, temporada);
  if (p.quedanVenta <= 0) return { ok: false, motivo: 'lleno' };
  if ((Number(tengo) || 0) < p.lote) return { ok: false, motivo: 'falta', lote: p.lote };
  const clave = `${nombre}|${bien}`;
  c.hoy.vendidos[clave] = (c.hoy.vendidos[clave] || 0) + 1;
  c.ganado = (c.ganado || 0) + p.venta;
  return { ok: true, precio: p.venta, cantidad: p.lote };
}

// ---------------------------------------------------------------- los fletes
// Cuántas paradas hay que pasar, siempre para adelante (el tren da la vuelta al anillo).
export function tramos(estaciones, desde, hasta) {
  const i = estaciones.indexOf(desde), j = estaciones.indexOf(hasta);
  if (i < 0 || j < 0 || i === j) return 0;
  return ((j - i) % estaciones.length + estaciones.length) % estaciones.length;
}
const PASAJEROS = ['vecinos que van a visitar parientes', 'chicos que vuelven de la escuela', 'turistas con mochila', 'peones de una estancia', 'señoras que van a la feria', 'una banda de música'];
const CARGAS = [
  { que: 'bolsas de harina', material: 'tabla' }, { que: 'fardos de lana', material: 'piedra' },
  { que: 'cajones de manzanas', material: 'tronco' }, { que: 'rollizos de ciprés', material: 'tabla' },
  { que: 'tambores de kerosene', material: 'piedra' }, { que: 'bolsas de correo', material: null },
  { que: 'barriles de sidra', material: 'tronco' },
];
// Los fletes que ofrece `desde` el día `dia`: uno con pasajeros y uno con carga, a otras
// paradas. `estaciones`: los nombres, en el orden en que las recorre el tren.
// 3.7.3 (tren): `extra`: fletes de carga de más por día (con el furgón de carga enganchado: ver tren-viaje.js)
export function fletesDelDia(dia, estaciones, desde, extra = 0) {
  const lista = Array.isArray(estaciones) ? estaciones.filter((x) => typeof x === 'string') : [];
  if (lista.length < 2 || !lista.includes(desde)) return [];
  const d = dia1(dia);
  const r = azarDe(hashTexto(`fletes|${desde}|${d}`));
  const otras = lista.filter((x) => x !== desde);
  const salida = [];
  const cuantosHoy = COMERCIO.fletesPorDia + Math.max(0, Math.min(4, Math.floor(Number(extra) || 0)));
  for (let k = 0; k < cuantosHoy; k++) {
    const tipo = k < COMERCIO.fletesPorDia ? (k % 2 === 0 ? 'pasajeros' : 'carga') : 'carga';
    const hasta = otras[Math.floor(r() * otras.length)];
    const t = Math.max(1, tramos(lista, desde, hasta));
    let f;
    if (tipo === 'pasajeros') {
      const cuantos = 2 + Math.floor(r() * 5);
      f = { tipo, cuantos, que: PASAJEROS[Math.floor(r() * PASAJEROS.length)], premio: { yerba: 2 + Math.ceil(cuantos * 0.8) + t * 2 } };
    } else {
      const c = CARGAS[Math.floor(r() * CARGAS.length)];
      const cuantos = 3 + Math.floor(r() * 6);
      f = { tipo, cuantos, que: c.que, premio: { yerba: 3 + t * 3 } };
      if (c.material) f.premio.material = { k: c.material, n: BIENES[c.material].lote };
    }
    salida.push({ id: `${d}|${desde}|${k}`, desde, hasta, dia: d, ...f });
  }
  return salida;
}
// (3.7.3: `aLaVez`, cuántos se llevan juntos: con el furgón de carga, más)
export function tomarFlete(c, flete, aLaVez = COMERCIO.fletesALaVez) {
  const f = sanearFlete(flete);
  if (!f) return { ok: false, motivo: 'no hay' };
  if (c.hoy.tomados.includes(f.id) || c.fletes.some((x) => x.id === f.id)) return { ok: false, motivo: 'tomado' };
  if (c.fletes.length >= Math.max(1, Math.floor(Number(aLaVez) || COMERCIO.fletesALaVez))) return { ok: false, motivo: 'lleno' };
  c.fletes.push(f);
  c.hoy.tomados.push(f.id);
  return { ok: true, flete: f };
}
export function soltarFlete(c, id) {
  const i = c.fletes.findIndex((f) => f.id === id);
  if (i < 0) return false;
  c.fletes.splice(i, 1);
  return true;
}
// Al parar en `parada` manejando: se entregan los fletes que iban ahí. Devuelve cuáles.
export function entregarFletes(c, parada) {
  const listos = c.fletes.filter((f) => f.hasta === parada);
  if (!listos.length) return [];
  c.fletes = c.fletes.filter((f) => f.hasta !== parada);
  c.entregas = (c.entregas || 0) + listos.length;
  for (const f of listos) c.ganado = (c.ganado || 0) + (f.premio?.yerba || 0);
  return listos;
}
export function textoFlete(f) {
  const quien = f.tipo === 'pasajeros' ? `${f.cuantos} pasajeros (${f.que})` : `${f.cuantos} ${f.que}`;
  const extra = f.premio?.material ? ` y ${f.premio.material.n} ${BIENES[f.premio.material.k].nombre.toLowerCase()}` : '';
  return { quien, hasta: f.hasta, paga: `${f.premio?.yerba || 0} de yerba${extra}` };
}
