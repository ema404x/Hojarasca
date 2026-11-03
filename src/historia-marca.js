// 4.24.0 (A): «No te pierdas». Módulo PURO (sin three ni DOM; se prueba en Node).
//
// Tres cosas que la Historia le debía al jugador que se queda sin saber adónde ir:
//   1. la marca del objetivo en el mapa: lo que el objetivo ya nombra (el Puesto Alto, el galpón de esquila, la plaza de la aldea…) se dibuja en el papel y la
//      brújula puede llevar hasta ahí con un clic en la marca. SIN SPOILERS: sólo si el texto del objetivo, tal como lo lee el jugador, nombra el lugar (o si ya
//      conocés a la persona que vive ahí); lo que el objetivo no dice («seguí las huellas», «mostrale el cuaderno a Josefina» sin conocerla) no se marca.
//   2. los lugares que el mapa no nombraba (el molino viejo, el coihue grande, la panadería, la carpintería, el estudio de fotos, la raíz de Ramón): se escriben
//      sólo cuando el jugador ya los conoce.
//   3. el panel de objetivos del capítulo 11 (12 contra una mediana de 6): las cadenas del arco y de la honda bajo un título con contador.
//
// De dónde sale cada punto: el objetivo se cumple con una escena (ver `escenaDeObjetivo` de historia-espera.js) y su disparador trae `lugar` (22 objetivos), o la
// escena es de un vecino de casa conocida (`HOGARES`), o está en la tabla `EXTRAS` (los que no se cumplen con una escena y nombran el lugar a las claras).
// Los puntos con coordenadas los arma el juego (`puntosDeHistoria` de main.js) y llegan por `puntos`.
import { CAPITULOS, textoObjetivo, panelHistoria } from './historia.js';
import { escenaDeObjetivo, disparadoresDe } from './historia-espera.js';

// ---------------------------------------------------------------- los lugares con nombre
// `palabras`: cómo lo nombra el texto del objetivo (sin tildes ni mayúsculas); alcanza con una.
export const PUNTOS_MARCA = {
  refugio: { nombre: 'Refugio del Arroyo', palabras: ['refugio'] },
  estacion: { nombre: 'Estación del Valle', palabras: ['estacion'] },
  plaza: { nombre: 'Plaza de la aldea', palabras: ['plaza', 'aldea', 'predio'] },
  ramos: { nombre: 'Almacén de Ercilia', palabras: ['almacen'] },
  'molino-viejo': { nombre: 'Molino viejo', palabras: ['molino viejo'] },
  coihue: { nombre: 'Coihue grande', palabras: ['coihue'] },
  galpon: { nombre: 'Galpón de Esquila', palabras: ['galpon de esquila'] },
  'galpon-propio': { nombre: 'Tu galpón', palabras: ['galpon'] },
  'galpon-noche': { nombre: 'Tu galpón', palabras: ['galpon'] },
  puesto: { nombre: 'Puesto Alto', palabras: ['puesto alto'] },
  'puesto-paso': { nombre: 'Puesto del Paso', palabras: ['puesto del paso'] },
  mirador: { nombre: 'Mirador del Pehuén', palabras: ['mirador'] },
  faro: { nombre: 'Faro del Lago', palabras: ['faro'] },
  muelle: { nombre: 'Muelle del Lago', palabras: ['muelle'] },
  cantera: { nombre: 'Cantera', palabras: ['cantera'] },
  carpinteria: { nombre: 'Carpintería de Tito', palabras: ['carpinteria'] },
  panaderia: { nombre: 'Panadería de Rosa', palabras: ['panaderia'] },
  seccional: { nombre: 'Seccional', palabras: ['seccional'] },
  'casa-herminia': { nombre: 'Casa de Herminia', palabras: ['casa de herminia'] },
  'estudio-fotos': { nombre: 'Estudio de fotos', palabras: ['estudio de fotos'] },
  'raiz-ramon': { nombre: 'Raíz de Ramón', palabras: ['raiz de ramon'] },
};
// los nombres del juego que son el mismo lugar que otro
const ALIAS = { 'refugio-puerta': 'refugio', 'puesto-alto': 'puesto', 'molino-historia': 'molino-viejo' };
const puntoCanonico = (k) => (typeof k === 'string' && Object.hasOwn(ALIAS, k) ? ALIAS[k] : k);

// El vecino de cada escena `hablar` y dónde vive: se marca su casa si ya lo conocés (hablaste con él, el lazo se movió)
// o si el objetivo nombra el lugar. Tejedora, herrero, apicultor y Martín andan por la plaza: sin casa propia, sin marca.
export const HOGARES = {
  ramon: { punto: 'puesto', lazo: 'ramon' }, ercilia: { punto: 'ramos', lazo: 'ercilia' }, ema: { punto: 'seccional', lazo: 'ema' },
  fermin: { punto: 'galpon', lazo: 'fermin' }, nicanor: { punto: 'muelle', lazo: 'nicanor' }, tobias: { punto: 'cantera', lazo: 'tobias' },
  belisario: { punto: 'puesto-paso', lazo: 'belisario' }, carpintero: { punto: 'carpinteria', lazo: 'tito' }, panadera: { punto: 'panaderia', lazo: 'rosa' },
  abuela: { punto: 'casa-herminia', lazo: 'herminia' }, fotografa: { punto: 'estudio-fotos', lazo: 'sofia' },
};

// Los objetivos que no se cumplen con una escena y nombran el lugar a las claras: `capitulo:objetivo` → los puntos
export const EXTRAS = {
  'llave:refugio': ['refugio'],
  'bolsa:hacha': ['ramos'],
  'perdido:faro': ['faro'],
  'golpea:golpe': ['galpon-propio'],
  'arco:tito': ['carpinteria'],
  'arco:blancos-paso': ['puesto-paso'],
  'arco:blancos-esquila': ['galpon'],
};

export const MAX_MARCAS = 4;   // las que se dibujan a la vez (un capítulo trae hasta 12 objetivos)

const sinTildes = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function nombraElLugar(texto, punto) {
  const p = Object.hasOwn(PUNTOS_MARCA, punto) ? PUNTOS_MARCA[punto] : null;
  if (!p) return false;
  const t = sinTildes(texto);
  return p.palabras.some((w) => t.includes(w));
}
const obj = (v) => (v && typeof v === 'object' ? v : {});
// ¿Conocés a esa persona? Hablaste con ella (los cinco de siempre) o algo se movió entre los dos
export function conoceA(h, s, clave) {
  if (!Object.hasOwn(HOGARES, clave)) return false;
  if (Array.isArray(s?.hablados) && s.hablados.includes(clave)) return true;
  if (obj(h?.hablados)[clave] === true) return true;
  const lazo = HOGARES[clave].lazo;
  return Number(obj(s?.lazos)[lazo]) !== 0 && Number.isFinite(Number(obj(s?.lazos)[lazo]));
}

// Los puntos de un objetivo: [{ punto, via: 'extra' | 'lugar' | 'hogar', clave? }] (sin mirar el texto ni si se conoce)
export function puntosDeObjetivo(capId, o) {
  const r = [];
  const sumar = (punto, via, clave) => {
    const k = puntoCanonico(punto);
    if (!Object.hasOwn(PUNTOS_MARCA, k) || r.some((x) => x.punto === k)) return;
    r.push(clave ? { punto: k, via, clave } : { punto: k, via });
  };
  const extra = Object.hasOwn(EXTRAS, `${capId}:${o?.id}`) ? EXTRAS[`${capId}:${o.id}`] : null;
  if (extra) { for (const p of extra) sumar(p, 'extra'); return r; }
  const id = escenaDeObjetivo(o);
  if (!id) return r;
  const ds = disparadoresDe(id, capId);
  for (const d of ds) if (Array.isArray(d.lugar)) sumar(d.lugar[0], 'lugar');
  if (r.length) return r;
  for (const d of ds) if (typeof d.clave === 'string' && Object.hasOwn(HOGARES, d.clave)) sumar(HOGARES[d.clave].punto, 'hogar', d.clave);
  return r;
}

// ¿Se puede marcar? El texto nombra el lugar, o es la casa de alguien a quien ya conocés
export function sePuedeMarcar(h, s, p, texto) {
  if (nombraElLugar(texto, p.punto)) return true;
  return p.via === 'hogar' && conoceA(h, s, p.clave);
}

// El nombre en el papel: lo mismo que el juego llama a ese lugar. El galpón de la noche es tu galponcito o, si no armaste uno, la puerta del refugio.
export function nombreDeMarca(punto, puntos) {
  const p = Object.hasOwn(PUNTOS_MARCA, punto) ? PUNTOS_MARCA[punto] : null;
  if (!p) return '';
  if (punto === 'galpon-noche') {
    const a = obj(puntos)['galpon-noche'], b = obj(puntos)['galpon-propio'];
    if (!(a && b && a.x === b.x && a.z === b.z)) return PUNTOS_MARCA.refugio.nombre;
  }
  return p.nombre;
}

// ---------------------------------------------------------------- 1. la marca del objetivo
// Lo que el mapa dibuja y la brújula sigue: [{ x, z, nombre, punto, objetivo, capitulo }] de los objetivos sin cumplir y a la vista del capítulo en curso.
// `h`: la historia; `s`: el estado (estadoHistoria); `puntos`: { [nombre]: { x, z } } (los que arma el juego). Sin Historia en curso, nada.
export function marcasDeObjetivos(h, s, puntos) {
  if (!h?.activa || h.fase !== 'jugando' || !s) return [];
  const c = CAPITULOS[Number(h.capitulo) || 0];
  if (!c) return [];
  const P = obj(puntos), salida = [];
  for (const o of c.objetivos) {
    if (salida.length >= MAX_MARCAS) break;
    if (o.visible && !o.visible(s)) continue;
    if (obj(h.hechos)[`${c.id}:${o.id}`] !== undefined) continue;
    let texto = '';
    try { texto = textoObjetivo(o, s); } catch { continue; }
    for (const p of puntosDeObjetivo(c.id, o)) {
      if (salida.length >= MAX_MARCAS) break;
      if (!sePuedeMarcar(h, s, p, texto)) continue;
      const q = Object.hasOwn(P, p.punto) ? P[p.punto] : null;
      if (!q || !Number.isFinite(Number(q.x)) || !Number.isFinite(Number(q.z))) continue;
      if (salida.some((m) => m.punto === p.punto)) continue;
      salida.push({ x: Number(q.x), z: Number(q.z), nombre: nombreDeMarca(p.punto, P), punto: p.punto, objetivo: o.id, capitulo: c.id });
    }
  }
  return salida;
}

// Un renglón corto para el panel: «En el mapa: Puesto Alto, Galpón de Esquila» (vacío si no hay marcas)
export function lineaDeMarcas(marcas) {
  if (!Array.isArray(marcas) || !marcas.length) return '';
  const nombres = [...new Set(marcas.map((m) => m.nombre).filter(Boolean))];
  return nombres.length ? `En el mapa: ${nombres.join(', ')}` : '';
}

// ---------------------------------------------------------------- 2. los lugares que el mapa no nombraba
const indiceCap = (id) => CAPITULOS.findIndex((c) => c.id === id);
const vio = (s, ...ids) => ids.some((i) => s.escenas?.has?.(i));
export const CONOCIDOS = {
  // desde el capítulo 5 el primer objetivo manda a las piedras del molino viejo, junto al coihue grande
  'molino-viejo': (h, s) => (Number(h.capitulo) || 0) >= indiceCap('rueda') || vio(s, 'piedras-molino', 'bolsa-coihue'),
  coihue: (h, s) => (Number(h.capitulo) || 0) >= indiceCap('rueda') || vio(s, 'piedras-molino', 'bolsa-coihue'),
  panaderia: (h, s) => s.pobladores?.has?.('panadera') && (conoceA(h, s, 'panadera') || vio(s, 'bolsa-rosa', 'frasco-rosa', 'masa-crece')),
  // desde el capítulo 11 un objetivo manda a Tito, «en la carpintería»
  carpinteria: (h, s) => s.pobladores?.has?.('carpintero') && ((Number(h.capitulo) || 0) >= indiceCap('arco') || conoceA(h, s, 'carpintero') || vio(s, 'tito-arco', 'tablas-tito', 'flechas-de-mas')),
  'estudio-fotos': (h, s) => s.pobladores?.has?.('fotografa') && (conoceA(h, s, 'fotografa') || vio(s, 'foto-sofia')),
  'raiz-ramon': (h, s) => vio(s, 'ramon-raiz'),
};
// [{ x, z, nombre, punto }] de los que ya conocés (con la Historia empezada); la raíz de Ramón se escribe sólo cuando la viste
export function lugaresConocidos(h, s, puntos) {
  if (!h?.empezada || !s) return [];
  const P = obj(puntos), salida = [];
  for (const [punto, conoce] of Object.entries(CONOCIDOS)) {
    let sabe = false;
    try { sabe = !!conoce(h, s); } catch { sabe = false; }
    if (!sabe) continue;
    const q = Object.hasOwn(P, punto) ? P[punto] : null;
    if (!q || !Number.isFinite(Number(q.x)) || !Number.isFinite(Number(q.z))) continue;
    salida.push({ x: Number(q.x), z: Number(q.z), nombre: PUNTOS_MARCA[punto].nombre, punto });
  }
  return salida;
}

// ---------------------------------------------------------------- 3. el panel: las cadenas del capítulo 11
// capítulo → [{ id, titulo, objetivos: [ids] }]. Una cadena con un solo objetivo a la vista no lleva título (su línea ya trae la cuenta: «3 de 3»).
export const GRUPOS_PANEL = {
  arco: [
    { id: 'arco', titulo: 'El arco', objetivos: ['lenga', 'tito', 'cuerda', 'puntas', 'plumas', 'blancos-paso'] },
    { id: 'honda', titulo: 'La honda', objetivos: ['fermin', 'cantos', 'blancos-esquila'] },
    { id: 'prestado', titulo: 'Lo prestado', objetivos: ['prestado'], contador: 'cuenta' },   // (4.24.1: un solo objetivo, pero su cuenta («2 de 3») va en el título como las otras dos cadenas)
  ],
};
export const PASOS_COMPACTOS = 1;   // con poco lugar, de cada cadena se ve el próximo paso y cuántos más hay

// Las filas del panel: [{ tipo: 'objetivo', o } | { tipo: 'cadena', id, titulo, hechos, total, items: [o], resto }].
// `objetivos`: lo que devuelve panelHistoria (id, texto, tecla, hecho). Los hechos de una cadena se cuentan y no se listan; una cadena terminada queda en una línea.
// `compacto`: sólo el próximo paso de cada cadena (el resto se cuenta). Nunca se esconde un objetivo suelto ni se pierde uno sin cumplir en el modo normal.
export function filasDelPanel(capId, objetivos, { compacto = false } = {}) {
  const lista = Array.isArray(objetivos) ? objetivos : [];
  const grupos = Object.hasOwn(GRUPOS_PANEL, capId) ? GRUPOS_PANEL[capId] : [];
  const filas = [], yaPuestos = new Set();
  for (const o of lista) {
    if (yaPuestos.has(o.id)) continue;
    const g = grupos.find((x) => x.objetivos.includes(o.id));
    const miembros = g ? lista.filter((x) => g.objetivos.includes(x.id)) : [];
    // 4.24.1: una cadena de un solo objetivo con cuenta: el título lleva el contador y la línea, sin su «(2/3)»; con poco lugar vuelve a ser la línea suelta con su cuenta
    if (g && g.contador === 'cuenta' && miembros.length === 1 && !compacto) {
      const o = miembros[0], total = Math.max(1, Math.floor(Number(o.meta) || Number(o.avance?.[1]) || 1));
      const hechos = o.hecho ? total : Math.max(0, Math.min(total, Math.floor(Number(o.avance?.[0]) || 0)));
      yaPuestos.add(o.id);
      filas.push({ tipo: 'cadena', id: g.id, titulo: g.titulo, hechos, total, items: o.hecho ? [] : [{ ...o, texto: String(o.texto).replace(/ \(\d+\/\d+\)/, '') }], resto: 0 });
      continue;
    }
    if (!g || miembros.length < 2) { filas.push({ tipo: 'objetivo', o }); yaPuestos.add(o.id); continue; }
    for (const m of miembros) yaPuestos.add(m.id);
    const pendientes = miembros.filter((m) => !m.hecho);
    const items = compacto ? pendientes.slice(0, PASOS_COMPACTOS) : pendientes;
    filas.push({ tipo: 'cadena', id: g.id, titulo: g.titulo, hechos: miembros.length - pendientes.length, total: miembros.length, items, resto: pendientes.length - items.length });
  }
  return filas;
}

// El panel ya armado (para las pruebas y para historia-ui.js): lo de panelHistoria más las filas
export function panelConFilas(h, s, opc = {}) {
  const p = panelHistoria(h, s);
  if (!p) return null;
  const c = CAPITULOS[Number(h.capitulo) || 0];
  return { ...p, filas: filasDelPanel(c?.id, p.objetivos, opc) };
}
