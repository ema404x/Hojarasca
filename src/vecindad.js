// 3.6: la vecindad. Los vecinos con un poco más de vida, "tipo Sims sin exagerar" (pedido del
// usuario, PLAN_ALDEA.md, sección 13): cada uno sigue cumpliendo su función (abre su local en
// hora: eso lo fija `rutinaAldea` y manda siempre), pero en el tiempo libre elige qué hacer según
// sus ganas y su forma de ser, tiene gustos y amigos, se acuerda de lo que hacés y te va tomando
// cariño.
//
// Lo que hay acá (reglas y datos; los textos están en vecindad-voces.js):
//   · PERFILES_VECINOS: rasgos, gustos (3 que le encantan, 2 que le gustan, 1 que no) y amigos;
//   · la autonomía: `elegirActividad` (fuera del trabajo) y `cumplirActividad` (las ganas);
//   · la charla: `abrirCharla`, `temasDeCharla`, `elegirTema` (cómo andás, novedades, su historia);
//   · regalar, invitar a tomar algo y dar una mano: `regalar`, `invitar`, `ayudas`, `ayudar`;
//   · la amistad: tres niveles visibles (conocido, amigo, compadre), sin números a la vista;
//     `saludoDeAmistad`, `visitaDeAmistad`, `regaloDeAmistad`;
//   · la memoria: `anotarHecho` (lo que hace el jugador) y `comentarioSobreVos`;
//   · el guardado (`progreso.vecindad`): `vecindadNueva`, `sanearVecindad`, `pasarDiaVecindad`.
//
// `estado`, en todas las funciones: la partida (`progreso`, con `vecindad` y `aldea`) o la
// vecindad sola. Las que cambian algo crean `progreso.vecindad` si falta.
//
// Sin economía (rechazada) ni nada religioso (pedido del usuario). Módulo puro: sin three ni DOM.
import { ENTRADAS } from './cuaderno.js';
import { VECINOS_ALDEA, POBLADORES_ALDEA, EDIFICIOS_ALDEA, LOTE_DE, ORDEN_PERSONAS_ALDEA, esPersonaAldea, esEdificioAldea, personaAldea, rutinaAldea, puntosDe, localAbierto, obraEnCurso, etapaDe, desfaseDe, aldeaNueva, obrerosDe, pobladorDeLote, diaSemanaDe, num, azar } from './aldea.js';
import { VOCES, AYUDAS, COMENTARIOS, CHISMOSOS, FRASES } from './vecindad-voces.js';

// ---------------------------------------------------------------- utilidades
// (3.6 (optimizar): `num` y `azar` son los de aldea.js)
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, d = 0) => (Number.isFinite(num(v)) ? Math.floor(num(v)) : d);
const TOPE_DIA = 1e6;
const diaValido = (v, d = 1) => Math.max(1, Math.min(TOPE_DIA, entero(v, d)));
const diaOCero = (v) => Math.max(0, Math.min(TOPE_DIA, entero(v, 0)));
const acotar = (x, a, b) => Math.max(a, Math.min(b, x));
const horaNorm = (h) => ((((Number.isFinite(num(h)) ? num(h) : 12) % 24) + 24) % 24);
const cap = (s) => (typeof s === 'string' && s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const tieneDe = (o, k) => objeto(o) && Object.hasOwn(o, k);
function hashTexto(s) {
  let h = 2166136261;
  for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
// Reemplaza las marcas {x} con `datos`; {Xyz} pone la primera en mayúscula. Si falta alguna,
// devuelve null (y quien llama prueba con otra línea).
function llenar(texto, datos = {}) {
  if (typeof texto !== 'string') return null;
  let falta = false;
  const r = texto.replace(/\{(\w+)\}/g, (_t, k) => {
    let v = tieneDe(datos, k) ? datos[k] : undefined;
    if (v === undefined || v === null) {
      const k0 = k.charAt(0).toLowerCase() + k.slice(1);
      if (k0 !== k && tieneDe(datos, k0) && datos[k0] !== null && datos[k0] !== undefined) v = cap(String(datos[k0]));
    }
    if (v === undefined || v === null) { falta = true; return ''; }
    return String(v);
  });
  return falta ? null : cap(r);
}
const primeraQueSirva = (lineas, datos, desde = 0) => {
  const l = Array.isArray(lineas) ? lineas : [lineas];
  for (let i = 0; i < l.length; i++) { const t = llenar(l[(desde + i) % l.length], datos); if (t) return t; }
  return null;
};

// ---------------------------------------------------------------- quiénes
// Los del valle que no viven en la aldea: siguen en su lugar (autonomía mínima).
export const VALLE_VECINDAD = ['ramon', 'nicanor', 'ema', 'guarda'];
export const PERSONAS_VECINDAD = [...ORDEN_PERSONAS_ALDEA, ...VALLE_VECINDAD];
const NOMBRES_VALLE = { ramon: 'Don Ramón', nicanor: 'Nicanor', ema: 'Ema', guarda: 'Elsa', ercilia: 'Ercilia' };
const OFICIOS_VALLE = { ramon: 'puestero', nicanor: 'pescador', ema: 'guardaparque', guarda: 'guarda del tren', ercilia: 'del almacén' };
export const esPersonaVecindad = (k) => typeof k === 'string' && Object.hasOwn(PERFILES_VECINOS, k);
// "Ernesto", "Nélida", "Don Ramón": como lo nombran los demás.
export function nombreCorto(k) {
  if (Object.hasOwn(NOMBRES_VALLE, k)) return NOMBRES_VALLE[k];
  const p = personaAldea(k);
  return p?.nombre ? p.nombre.split(' ')[0] : null;
}
const nombreCompleto = (k) => (Object.hasOwn(NOMBRES_VALLE, k) ? NOMBRES_VALLE[k] : personaAldea(k)?.nombre || null);
const oficioDe = (k) => (Object.hasOwn(OFICIOS_VALLE, k) ? OFICIOS_VALLE[k] : personaAldea(k)?.oficio || null);
// Cómo te dice cada uno cuando el juego no sabe tu nombre.
const TRATO = {
  jefe: 'vecino', nelida: 'corazón', abuela: 'tesoro', padre: 'compañero', madre: 'vecino', nene: 'amigo', nena: 'amigo',
  galesa: 'cariad', ercilia: 'querido', carpintero: 'vecino', panadera: 'vecino', herrero: 'vecino', pescador: 'vecino',
  maestra: 'vecino', enfermera: 'vecino', telegrafista: 'colega', tejedora: 'vecino', apicultor: 'amico', guardaparque: 'colega',
  musico: 'hermano', ramon: 'm\'hijo', nicanor: 'vecino', ema: 'vecino', guarda: 'pasajero',
};

// ---------------------------------------------------------------- lo que se puede regalar
// Sólo cosas que el jugador lleva encima (como en comercio.js: 'material' → progreso.materiales,
// 'cosa' → progreso.cosas, 'entrada' → progreso.entradas[id].cantidad). `n`: cuánto se da de una
// vez. `nombre`/`el`: cómo se dice ("un frasco de miel", "la miel").
export const REGALABLES = {
  tronco: { tipo: 'material', n: 1, nombre: 'un tronco', el: 'el tronco' },
  tabla: { tipo: 'material', n: 2, nombre: 'unas tablas', el: 'las tablas' },
  piedra: { tipo: 'material', n: 2, nombre: 'unas piedras', el: 'las piedras' },
  lana: { tipo: 'material', n: 1, nombre: 'un vellón de lana', el: 'el vellón' },
  yerba: { tipo: 'cosa', n: 1, nombre: 'yerba', el: 'la yerba' },
  harina: { tipo: 'cosa', n: 1, nombre: 'una medida de harina', el: 'la harina' },
  poncho: { tipo: 'cosa', n: 1, nombre: 'un poncho', el: 'el poncho' },
  calafate: { tipo: 'entrada', n: 3, nombre: 'un puñado de calafate', el: 'el calafate' },
  'calafate-seco': { tipo: 'entrada', n: 1, nombre: 'unos calafates secos', el: 'los calafates secos' },
  frutilla: { tipo: 'entrada', n: 3, nombre: 'unas frutillas', el: 'las frutillas' },
  'frasco-frutilla': { tipo: 'entrada', n: 1, nombre: 'un frasco de dulce de frutilla', el: 'el dulce de frutilla' },
  miel: { tipo: 'entrada', n: 1, nombre: 'un frasco de miel', el: 'la miel' },
  'pan-casero': { tipo: 'entrada', n: 1, nombre: 'un pan casero', el: 'el pan casero' },
  empanadas: { tipo: 'entrada', n: 2, nombre: 'unas empanadas', el: 'las empanadas' },
  'trucha-fresca': { tipo: 'entrada', n: 1, nombre: 'una trucha fresca', el: 'la trucha' },
  'trucha-ahumada': { tipo: 'entrada', n: 1, nombre: 'una trucha ahumada', el: 'la trucha ahumada' },
  huevo: { tipo: 'entrada', n: 2, nombre: 'un par de huevos', el: 'los huevos' },
  papa: { tipo: 'entrada', n: 3, nombre: 'unas papas', el: 'las papas' },
  haba: { tipo: 'entrada', n: 3, nombre: 'unas habas', el: 'las habas' },
  'hongos-secos': { tipo: 'entrada', n: 1, nombre: 'llao llao seco', el: 'el llao llao' },
  llaollao: { tipo: 'entrada', n: 2, nombre: 'unos llao llao', el: 'el llao llao' },
  pinon: { tipo: 'entrada', n: 3, nombre: 'unos piñones', el: 'los piñones' },
  pluma: { tipo: 'entrada', n: 1, nombre: 'una pluma de cachaña', el: 'la pluma' },
  canto: { tipo: 'entrada', n: 1, nombre: 'un canto rodado', el: 'el canto rodado' },
};
export const esRegalable = (k) => typeof k === 'string' && Object.hasOwn(REGALABLES, k);

// ---------------------------------------------------------------- los perfiles
// rasgos: dos o tres (ver RASGOS). gustos: encanta (3), gusta (2), noGusta (1). amigos: con
// quién se visita y charla. regala: lo que deja de regalo cuando ya sos compadre.
export const RASGOS = ['madrugador', 'trasnochador', 'charlatan', 'solitario', 'curioso', 'trabajador', 'goloso', 'casero', 'andariego', 'lector', 'jardinero', 'jugueton'];
const P = (rasgos, encanta, gusta, noGusta, amigos, regala) => ({ rasgos, gustos: { encanta, gusta, noGusta }, amigos, regala });
export const PERFILES_VECINOS = {
  jefe: P(['madrugador', 'charlatan', 'trabajador'], ['yerba', 'pan-casero', 'trucha-ahumada'], ['empanadas', 'huevo'], 'hongos-secos', ['abuela', 'telegrafista', 'padre'], { tipo: 'cosa', k: 'yerba', n: 2 }),
  nelida: P(['charlatan', 'trabajador', 'goloso'], ['frasco-frutilla', 'calafate-seco', 'miel'], ['huevo', 'harina'], 'canto', ['ercilia', 'madre', 'panadera'], { tipo: 'cosa', k: 'harina', n: 1 }),
  abuela: P(['madrugador', 'casero', 'charlatan'], ['calafate', 'calafate-seco', 'frasco-frutilla'], ['miel', 'yerba'], 'trucha-fresca', ['jefe', 'nena', 'enfermera'], { tipo: 'entrada', k: 'calafate-seco', n: 1 }),
  padre: P(['trabajador', 'madrugador', 'goloso'], ['trucha-ahumada', 'empanadas', 'yerba'], ['pan-casero', 'papa'], 'tronco', ['carpintero', 'herrero', 'jefe'], { tipo: 'material', k: 'tronco', n: 4 }),
  madre: P(['jardinero', 'charlatan', 'trabajador'], ['frutilla', 'calafate', 'miel'], ['huevo', 'harina'], 'pluma', ['nelida', 'apicultor', 'panadera'], { tipo: 'entrada', k: 'frasco-frutilla', n: 1 }),
  nene: P(['jugueton', 'curioso', 'andariego'], ['frutilla', 'miel', 'canto'], ['pluma', 'empanadas'], 'haba', ['nena', 'pescador', 'guardaparque'], { tipo: 'entrada', k: 'canto', n: 2 }),
  nena: P(['lector', 'curioso', 'jugueton'], ['frutilla', 'miel', 'pluma'], ['calafate', 'pan-casero'], 'papa', ['abuela', 'maestra', 'nene'], { tipo: 'entrada', k: 'pluma', n: 1 }),
  galesa: P(['madrugador', 'trabajador', 'goloso'], ['miel', 'frasco-frutilla', 'harina'], ['huevo', 'frutilla'], 'yerba', ['panadera', 'enfermera', 'nelida'], { tipo: 'entrada', k: 'pan-casero', n: 2 }),
  ercilia: P(['charlatan', 'trabajador', 'casero'], ['frasco-frutilla', 'miel', 'empanadas'], ['huevo', 'calafate-seco'], 'tronco', ['nelida', 'guarda', 'galesa'], { tipo: 'cosa', k: 'harina', n: 2 }),
  carpintero: P(['trabajador', 'madrugador', 'solitario'], ['yerba', 'empanadas', 'pan-casero'], ['tabla', 'huevo'], 'piedra', ['padre', 'herrero', 'musico'], { tipo: 'material', k: 'tabla', n: 4 }),
  panadera: P(['madrugador', 'trabajador', 'charlatan'], ['harina', 'huevo', 'miel'], ['frasco-frutilla', 'yerba'], 'pan-casero', ['madre', 'nelida', 'galesa'], { tipo: 'entrada', k: 'pan-casero', n: 3 }),
  herrero: P(['trabajador', 'solitario', 'goloso'], ['trucha-ahumada', 'empanadas', 'yerba'], ['canto', 'pan-casero'], 'frutilla', ['carpintero', 'padre', 'pescador'], { tipo: 'material', k: 'piedra', n: 4 }),
  pescador: P(['madrugador', 'solitario', 'curioso'], ['pan-casero', 'yerba', 'papa'], ['huevo', 'empanadas'], 'trucha-fresca', ['nicanor', 'herrero', 'nene'], { tipo: 'entrada', k: 'trucha-fresca', n: 2 }),
  maestra: P(['lector', 'curioso', 'trabajador'], ['pluma', 'miel', 'calafate-seco'], ['yerba', 'frutilla'], 'tronco', ['nena', 'enfermera', 'tejedora'], { tipo: 'cosa', k: 'yerba', n: 2 }),
  enfermera: P(['madrugador', 'trabajador', 'casero'], ['miel', 'harina', 'frasco-frutilla'], ['huevo', 'frutilla'], 'yerba', ['abuela', 'maestra', 'galesa'], { tipo: 'entrada', k: 'miel', n: 1 }),
  telegrafista: P(['charlatan', 'curioso', 'trasnochador'], ['yerba', 'empanadas', 'trucha-ahumada'], ['pan-casero', 'huevo'], 'miel', ['jefe', 'guarda', 'musico'], { tipo: 'cosa', k: 'yerba', n: 2 }),
  tejedora: P(['casero', 'trabajador', 'solitario'], ['lana', 'calafate', 'yerba'], ['miel', 'pan-casero'], 'canto', ['maestra', 'apicultor', 'ramon'], { tipo: 'material', k: 'lana', n: 2 }),
  apicultor: P(['madrugador', 'jardinero', 'andariego'], ['frasco-frutilla', 'frutilla', 'harina'], ['yerba', 'pan-casero'], 'miel', ['madre', 'tejedora', 'guardaparque'], { tipo: 'entrada', k: 'miel', n: 2 }),
  guardaparque: P(['andariego', 'curioso', 'madrugador'], ['yerba', 'calafate-seco', 'pinon'], ['empanadas', 'frutilla'], 'hongos-secos', ['ema', 'apicultor', 'nene'], { tipo: 'entrada', k: 'pinon', n: 3 }),
  musico: P(['trasnochador', 'charlatan', 'goloso'], ['empanadas', 'yerba', 'pan-casero'], ['miel', 'huevo'], 'haba', ['carpintero', 'telegrafista', 'abuela'], { tipo: 'entrada', k: 'empanadas', n: 2 }),
  ramon: P(['madrugador', 'solitario', 'trabajador'], ['yerba', 'calafate', 'trucha-ahumada'], ['pan-casero', 'pinon'], 'haba', ['tejedora', 'nicanor'], { tipo: 'cosa', k: 'yerba', n: 3 }),
  nicanor: P(['madrugador', 'solitario', 'curioso'], ['yerba', 'pan-casero', 'empanadas'], ['papa', 'tronco'], 'trucha-fresca', ['pescador', 'ramon'], { tipo: 'material', k: 'tronco', n: 4 }),
  ema: P(['andariego', 'curioso', 'madrugador'], ['frutilla', 'calafate-seco', 'yerba'], ['miel', 'pan-casero'], 'pluma', ['guardaparque', 'ramon'], { tipo: 'cosa', k: 'semillas-habas', n: 3 }),
  guarda: P(['charlatan', 'trabajador', 'curioso'], ['yerba', 'empanadas', 'calafate-seco'], ['pan-casero', 'frasco-frutilla'], 'piedra', ['telegrafista', 'ercilia', 'jefe'], { tipo: 'entrada', k: 'pan-casero', n: 2 }),
};
// Qué le parece una cosa: 'encanta' | 'gusta' | 'noGusta' | 'neutro'.
export function gustoDe(persona, cosa) {
  if (!esPersonaVecindad(persona)) return 'neutro';
  const g = PERFILES_VECINOS[persona].gustos;
  if (g.encanta.includes(cosa)) return 'encanta';
  if (g.gusta.includes(cosa)) return 'gusta';
  if (g.noGusta === cosa) return 'noGusta';
  return 'neutro';
}

// ---------------------------------------------------------------- la amistad
export const NIVELES_AMISTAD = ['conocido', 'amigo', 'compadre'];
// Puntos internos (nunca se muestran). Charlar suma poco y una vez por día; regalar lo que le
// encanta, invitarlo y darle una mano suman más; aportar a la obra de su local también. Si
// pasan unos días sin verse, baja de a poco, pero el que llegó a amigo no vuelve a conocido.
export const AMISTAD = {
  umbral: { amigo: 50, compadre: 140 }, tope: 200,
  charla: 2, encanta: 10, gusta: 5, neutro: 3, noGusta: 0, invitar: 6, ayudar: 6, obraDueno: 5, obraObrero: 2,
  sinContacto: 4, baja: 1,
};
const nivelPorPuntos = (p) => (p >= AMISTAD.umbral.compadre ? 2 : p >= AMISTAD.umbral.amigo ? 1 : 0);
const pisoDe = (f) => (f && f.max >= 1 ? AMISTAD.umbral.amigo : 0);

// ---------------------------------------------------------------- las ganas y lo que hacen
export const GANAS = ['social', 'descanso', 'aire', 'hacer'];
// Lo que hacen en el tiempo libre. `ganas`: qué ganas satisface (y cuánto). `afuera`: si se
// hace al aire libre (con lluvia, de noche, no).
export const ACTIVIDADES = {
  te: { nombre: 'tomar el té', ganas: { social: 0.5, descanso: 0.5 }, afuera: false },
  plaza: { nombre: 'sentarse en la plaza', ganas: { social: 0.5, aire: 0.5 }, afuera: true },
  visitar: { nombre: 'visitar a un amigo', ganas: { social: 1 }, afuera: false },
  compras: { nombre: 'hacer los mandados en el almacén', ganas: { hacer: 0.5, social: 0.5 }, afuera: false },
  lena: { nombre: 'cortar y apilar leña', ganas: { hacer: 0.8, aire: 0.2 }, afuera: true },
  regar: { nombre: 'regar las plantas', ganas: { hacer: 0.5, aire: 0.5 }, afuera: true },
  palear: { nombre: 'palear la nieve de la vereda', ganas: { hacer: 1 }, afuera: true },
  paseo: { nombre: 'caminar hasta la estación a mirar la cordillera', ganas: { aire: 1 }, afuera: true },
  leer: { nombre: 'leer', ganas: { descanso: 0.7, social: 0.1 }, afuera: false },
  jugar: { nombre: 'jugar', ganas: { aire: 0.6, social: 0.4 }, afuera: true },
  galeria: { nombre: 'mirar la lluvia desde la galería', ganas: { descanso: 0.6, aire: 0.4 }, afuera: false },
  descansar: { nombre: 'descansar en casa', ganas: { descanso: 1 }, afuera: false },
};
const RASGO_PESO = {
  charlatan: { plaza: 1.5, visitar: 1.6, te: 1.3, compras: 1.3 },
  solitario: { plaza: 0.6, visitar: 0.5, paseo: 1.5, leer: 1.4 },
  curioso: { paseo: 1.4, leer: 1.3, compras: 1.2 },
  trabajador: { lena: 1.7, regar: 1.4, palear: 1.8, descansar: 0.6 },
  goloso: { te: 1.7, compras: 1.4 },
  casero: { descansar: 1.5, paseo: 0.6, galeria: 1.3 },
  andariego: { paseo: 1.9, visitar: 1.2, descansar: 0.7 },
  lector: { leer: 2.2 },
  jardinero: { regar: 2.2 },
  jugueton: { jugar: 2 },
};
const CLIMA_PESO = {
  sol: { plaza: 1.8, paseo: 1.6, regar: 1.3, jugar: 1.3, descansar: 0.8 },
  nublado: {},
  viento: { paseo: 0.5, plaza: 0.7, regar: 0.6 },
  lluvia: { te: 1.6, leer: 1.3, visitar: 1.2, descansar: 1.2 },
  nieve: { plaza: 0.3, paseo: 0.3, jugar: 1.4, lena: 0.8, te: 1.3 },
};
export const CLIMAS = ['sol', 'nublado', 'viento', 'lluvia', 'nieve'];
// El clima como lo entiende la vecindad: una palabra, o el estado del mundo
// ({ lluvia, invierno, viento, nublado }: con invierno, la lluvia es nieve).
export function climaDe(c) {
  if (typeof c === 'string') return CLIMAS.includes(c) ? c : 'nublado';
  if (objeto(c)) {
    const ll = num(c.lluvia) || 0, inv = num(c.invierno) || 0, vi = num(c.viento) || 0, nu = num(c.nublado) || 0;
    if (ll > 0.45) return inv >= 0.5 ? 'nieve' : 'lluvia';
    if (vi > 0.7) return 'viento';
    if (nu > 0.6) return 'nublado';
    return 'sol';
  }
  return 'nublado';
}
function ganasIniciales(persona) {
  const r = PERFILES_VECINOS[persona]?.rasgos || [];
  const t = (k) => (r.includes(k) ? 1 : 0);
  return {
    social: acotar(0.5 + 0.2 * t('charlatan') - 0.2 * t('solitario'), 0, 1),
    descanso: acotar(0.4 + 0.1 * t('casero'), 0, 1),
    aire: acotar(0.5 + 0.2 * t('andariego') + 0.1 * t('jugueton'), 0, 1),
    hacer: acotar(0.5 + 0.2 * t('trabajador'), 0, 1),
  };
}

// ---------------------------------------------------------------- el estado
const TOPE_HECHOS = 40, GUARDA_HECHOS = 7, RECIENTE = 2, TOPE_DICHOS = 24, TOPE_COMENT = 16, TOPE_CONOCE = 24;
const COMENT_POR_DIA = 4;   // 3.6.1: (RECIENTE + 1) × 4 ≤ TOPE_COMENT
export const TRUCHA_GRANDE_CM = 50;
export const TALA_MUCHA = 8;
export function vecindadNueva() {
  return { personas: {}, hechos: [], visita: { ultima: 0, cuenta: 0 }, dia: 0, cita: null };
}
// 3.6.1: la invitación a tomar algo que todavía no se tomó ({ clave, que: 'mate'|'te', desde: horas
// absolutas }), para que no se pierda al recargar la partida (ver vecindad-juego.js)
export function sanearCita(c) {
  if (!objeto(c) || !esPersonaVecindad(c.clave) || (c.que !== 'mate' && c.que !== 'te')) return null;
  const desde = num(c.desde);
  return Number.isFinite(desde) && desde >= 0 && desde < TOPE_DIA * 24 ? { clave: c.clave, que: c.que, desde } : null;
}
function fichaNueva(persona) {
  return {
    p: 0, max: 0, desde: 0, contacto: 0,
    charla: 0, regalo: 0, invito: 0, ayuda: 0, visito: 0, dejo: 0,
    hist: 0, ayudas: 0, regalos: 0, cd: 0, cn: 0,
    hizo: null, con: null, ultimoRegalo: null,
    ganas: ganasIniciales(persona), dichos: [], coment: [],
    conoce: [],   // 3.6: lo que ya le regalaste (el cuaderno muestra qué le gusta, sin números)
  };
}
const esVecindad = (x) => objeto(x) && objeto(x.personas) && Array.isArray(x.hechos);
// De `estado` saca la vecindad, la aldea y la partida. `crear`: si falta, la arma (en la
// partida, como `progreso.vecindad`).
function partes(estado, crear = false) {
  const e = objeto(estado) ? estado : null;
  let v = null, aldea = null, progreso = null;
  if (e && esVecindad(e)) v = e;
  else if (e) {
    progreso = e;
    if (esVecindad(e.vecindad)) v = e.vecindad;
    else if (crear) { e.vecindad = vecindadNueva(); v = e.vecindad; }
    if (objeto(e.aldea)) aldea = e.aldea;
  }
  if (!v && crear) v = vecindadNueva();
  return { v, aldea: aldea || aldeaNueva(), progreso };
}
const fichaSi = (v, persona) => (v && tieneDe(v.personas, persona) ? v.personas[persona] : null);
function ficha(v, persona) {
  if (!tieneDe(v.personas, persona)) v.personas[persona] = fichaNueva(persona);
  return v.personas[persona];
}
const recordar = (lista, clave, tope) => { const i = lista.indexOf(clave); if (i >= 0) lista.splice(i, 1); lista.push(clave); while (lista.length > tope) lista.shift(); };
function sumarAmistad(v, persona, n, dia) {
  const f = ficha(v, persona);
  const antes = nivelPorPuntos(f.p);
  f.p = acotar(f.p + n, pisoDe(f), AMISTAD.tope);
  const despues = Math.max(nivelPorPuntos(f.p), f.max >= 1 ? 1 : 0);
  if (despues > f.max) f.max = despues;
  if (despues === 2 && !f.desde) f.desde = diaValido(dia, 1);
  f.contacto = Math.max(f.contacto, diaValido(dia, 1));
  return { cambio: n, nivel: NIVELES_AMISTAD[despues], subio: despues > antes };
}
// El nivel de amistad: 'conocido' | 'amigo' | 'compadre' (lo único que se muestra).
export function nivelDe(persona, estado) {
  const f = fichaSi(partes(estado).v, persona);
  if (!f) return 'conocido';
  return NIVELES_AMISTAD[Math.max(nivelPorPuntos(f.p), f.max >= 1 ? 1 : 0)];
}
const indiceNivel = (persona, v) => NIVELES_AMISTAD.indexOf(nivelDe(persona, v));
// Para el cuaderno: { persona: nivel } de los que ya conociste.
export function amistades(estado) {
  const { v } = partes(estado);
  const r = {};
  if (v) for (const k of PERSONAS_VECINDAD) if (tieneDe(v.personas, k) && v.personas[k].contacto) r[k] = nivelDe(k, v);
  return r;
}

// 3.6: lo que ya le regalaste, con lo que le pareció ([{ cosa, gusto }]), para el cuaderno.
export function gustosConocidos(persona, estado) {
  const f = fichaSi(partes(estado).v, persona);
  return f && Array.isArray(f.conoce) ? f.conoce.filter(esRegalable).map((cosa) => ({ cosa, gusto: gustoDe(persona, cosa) })) : [];
}

// ---------------------------------------------------------------- la autonomía
// Lo que la rutina obliga (y entonces manda): dormir, almorzar, trabajar, la música del sábado,
// los cuentos del domingo, la leyenda de la abuela. Devuelve el motivo o null (tiempo libre).
const OBLIGA = new Set(['trabajo', 'local', 'escuela', 'obra', 'estacion', 'biblioteca', 'almacen']);
function obligacion(persona, hora, ds, aldea, r = null) {
  const ru = r || rutinaAldea(persona, hora, ds, aldea);
  if (!ru.lugar) return 'ausente';
  const t = horaNorm(hora) - desfaseDe(persona);
  const chico = !!VECINOS_ALDEA[persona]?.chico;
  if (ru.punto === 'cama' || ru.punto === 'cama-chicos') return 'dormir';
  if (ds === 6 && t >= 10 && t < 11 && (ru.lugar === 'biblioteca' || persona === 'abuela')) return 'cuentos';
  if (OBLIGA.has(ru.lugar)) return 'trabajo';
  if (ru.punto === 'soga') return 'trabajo';   // 3.6 (mecánicas): el jefe iza o arría la bandera
  if (ds === 5 && localAbierto(aldea, 'salon') && t >= 17 && t < 19) return 'musica';
  if (ru.lugar === 'casa' && (chico ? t >= 13 && t < 14 : t >= 12.5 && t < 13.5)) return 'almuerzo';
  if (persona === 'abuela' && ru.lugar === 'plaza' && ds !== 6 && t >= 15.5 && t < 18) return 'leyenda';   // (3.6.2: desde las 15:30)
  if ((persona === 'padre' || persona === 'madre') && ru.lugar === 'casa' && ru.punto === 'trabajo' && ds !== 6 && t < 18) return 'trabajo';
  return null;
}
// ¿Está libre ahora? (sólo la gente de la aldea; los del valle siempre "en lo suyo").
export function estaLibre(persona, hora, diaSemana, estado) {
  if (!esPersonaAldea(persona)) return false;
  const ds = ((entero(diaSemana) % 7) + 7) % 7;
  return obligacion(persona, horaNorm(hora), ds, partes(estado).aldea) === null;
}
// Cuánto dura todavía la situación (libre u obligada), hasta 3 h: la rutina sólo cambia en los
// cuartos de hora del horario de cada uno (corridas por su desfase; 3.6.2: antes, las medias horas: la
// siesta de Ercilia termina a las 15:15) y, la del jefe, en las horas (y en las de la bandera).
function hastaQueCambie(persona, hora, ds, aldea, libre) {
  const des = desfaseDe(persona);
  const ref = rutinaAldea(persona, hora, ds, aldea);
  const marcas = [];
  for (let k = Math.floor((hora - des) * 4) + 1; (k / 4 + des) <= hora + 3; k++) marcas.push(k / 4 + des);
  for (let k = Math.floor(hora) + 1; k <= hora + 3; k++) marcas.push(k);
  // 3.6 (mecánicas): y la del jefe, también cuando va a izar o a arriar la bandera (ver rutinaAldea)
  // (3.6.2: y cuando abre y cierra la estación, que también va por la hora del reloj)
  if (persona === 'jefe') for (const b of [7.5, 8.25, 8.75, 18, 18.5, 19.25]) for (const d of [0, 24]) if (b + d > hora && b + d <= hora + 3) marcas.push(b + d);
  marcas.sort((a, b) => a - b);
  for (const b of marcas) {
    if (b <= hora + 1e-9) continue;
    const h2 = b + 1e-6, dia2 = h2 >= 24 ? (ds + 1) % 7 : ds, hh = h2 % 24;
    const r2 = rutinaAldea(persona, hh, dia2, aldea);
    const cambia = libre ? obligacion(persona, hh, dia2, aldea, r2) !== null
      : r2.edificio !== ref.edificio || r2.punto !== ref.punto || obligacion(persona, hh, dia2, aldea, r2) === null;
    if (cambia) return Math.max(0, b - hora);
  }
  return 3;
}
const casaDe = (persona, aldea) => {
  if (VECINOS_ALDEA[persona]) return VECINOS_ALDEA[persona].casa;
  if (persona === 'ercilia') return 'casa-ercilia';
  const lote = LOTE_DE[persona];
  return lote && localAbierto(aldea, lote) ? lote : null;
};
const elPunto = (edificio, opciones) => {
  const p = puntosDe(edificio);
  return opciones.find((k) => Object.hasOwn(p, k)) || null;
};
const casaTeAbierta = (aldea, hora, ds) => {
  const r = rutinaAldea('galesa', hora, ds, aldea);
  return r.lugar === 'trabajo' && r.edificio === 'casa-te' && r.punto === 'adentro';
};
const almacenAbierto = (aldea, hora, ds) => {
  const e = rutinaAldea('ercilia', hora, ds, aldea), n = rutinaAldea('nelida', hora, ds, aldea);
  return (e.lugar === 'trabajo' && e.punto === 'adentro') || (n.lugar === 'trabajo' && n.punto === 'adentro');
};
// 3.6.1: a qué hora (de cada uno, con su corrimiento) ya es de noche para estar afuera, y cuánto rato
// tiene que quedar antes para empezar algo afuera
export const NOCHE_AFUERA = 20.5;
const MINIMO_AFUERA = 0.5;
function candidatas(persona, hora, ds, c, aldea, sem) {
  const t = hora - desfaseDe(persona);
  const perfil = PERFILES_VECINOS[persona];
  const chico = !!VECINOS_ALDEA[persona]?.chico;
  const noche = t >= 20.5 || t < 7;
  // 3.6.1: lo de afuera, sólo con luz y con tiempo de hacerlo antes de que oscurezca (a las 20:30):
  // elegido a las 20:10, el chico seguía jugando en la nieve hasta las 22 (ver NOCHE_AFUERA)
  const deDia = !noche && t < NOCHE_AFUERA - MINIMO_AFUERA;
  const lluvia = c === 'lluvia', nieve = c === 'nieve';
  const casa = casaDe(persona, aldea);
  const vivienda = casa || 'estacion-aldea';   // el que espera su local duerme en la estación
  const i = Math.max(0, PERSONAS_VECINDAD.indexOf(persona));
  const lista = [];
  const sumar = (actividad, base, edificio, punto, extra = {}) => {
    if (!edificio || !punto || !Object.hasOwn(puntosDe(edificio), punto)) return;
    lista.push({ actividad, base, edificio, punto, ...extra });
  };
  sumar('descansar', 0.6, vivienda, 'adentro');
  if (!noche && t >= 9 && t < 20) sumar('leer', chico ? 1 : 0.8, 'biblioteca', `lectura-${((i + Math.floor(sem * 16)) % 16) + 1}`);
  else sumar('leer', 0.5, vivienda, 'adentro');
  if (!noche && persona !== 'galesa' && casaTeAbierta(aldea, hora, ds)) sumar('te', 1, 'casa-te', `mesa-${((i + Math.floor(sem * 4)) % 4) + 1}`);
  else if (!chico) sumar('te', 0.45, vivienda, 'adentro');
  // visitar a un amigo: a su casa (o su local, o la plaza, si anda por ahí)
  const amigos = perfil.amigos.filter((a) => esPersonaAldea(a));
  for (const a of amigos) {
    const ra = rutinaAldea(a, hora, ds, aldea);
    if (!ra.lugar || ra.punto === 'cama' || ra.punto === 'cama-chicos') continue;
    const tarde = t >= (perfil.rasgos.includes('trasnochador') ? 21.75 : 21.25);
    const peso = 1.2 / Math.max(1, amigos.length);
    if (ra.lugar === 'casa') {
      if (tarde) continue;
      sumar('visitar', peso, ra.edificio, noche || lluvia || nieve ? 'adentro' : (elPunto(ra.edificio, ['puerta']) || 'adentro'), { con: a });
    } else if (!noche && (ra.lugar === 'local' || ra.lugar === 'trabajo') && ra.edificio !== 'casa-familia') {
      const punto = elPunto(ra.edificio, ['cliente', 'cliente-2', 'mesa-3', 'espera', 'puerta']);
      sumar('visitar', peso, ra.edificio, punto, { con: a });
    } else if (deDia && !lluvia && !nieve && ra.lugar === 'plaza') {   // 3.6.1: con nieve, tampoco en el banco de la plaza
      const k = Number(String(ra.punto).replace(/\D/g, '')) || 1;
      sumar('visitar', peso, 'plaza', ra.punto?.startsWith('estar-') ? `estar-${(k % 20) + 1}` : `estar-${(i % 20) + 1}`, { con: a });
    }
  }
  if (!noche && !chico && persona !== 'ercilia' && persona !== 'nelida' && almacenAbierto(aldea, hora, ds)) sumar('compras', 0.7, 'almacen', `cliente-${((i + Math.floor(sem * 3)) % 3) + 1}`);
  if (deDia && !lluvia) {
    if (!nieve) sumar('plaza', 1, 'plaza', `estar-${((i + Math.floor(sem * 20)) % 20) + 1}`);   // 3.6.1: sentado en la plaza con nieve, no
    const destino = [['estacion-aldea', 'anden'], ['estacion-aldea', 'salida'], ['plaza', 'duende']][(i + Math.floor(sem * 3)) % 3];
    sumar('paseo', 0.8, destino[0], destino[1]);
    if (chico) sumar('jugar', 2.5, 'plaza', `juego-${((i + Math.floor(sem * 4)) % 4) + 1}`);
  }
  if (deDia && !lluvia && casa && !chico) sumar('lena', 0.6, casa, 'trabajo');
  if (deDia && !lluvia && !nieve && casa && !chico) sumar('regar', 0.4, casa, 'trabajo');
  if (deDia && nieve && casa && !chico) sumar('palear', 1.4, casa, elPunto(casa, ['vereda', 'puerta']));
  if (!noche && (lluvia || nieve)) sumar('galeria', 0.7, vivienda, elPunto(vivienda, ['puerta', 'vereda', 'adentro']));
  return lista;
}
// Lo que hacen los del valle: siguen en su lugar, con variantes chicas.
const VARIANTES_VALLE = {
  ramon: ['tomar mate junto al fuego del puesto', 'recorrer el alambrado', 'mirar la majada'],
  nicanor: ['mirar el agua', 'remendar la red', 'tirar la línea desde la orilla'],
  ema: ['hacer la recorrida del sendero', 'anotar en la planilla', 'mirar con los prismáticos'],
  guarda: ['revisar los boletos', 'cargar la salamandra del coche', 'mirar por la ventanilla'],
};
// Elige qué hace una persona ahora. Dentro del horario de trabajo (o de lo que la rutina obliga)
// devuelve la rutina tal cual (`actividad: 'rutina'`); en el tiempo libre, una actividad según
// sus ganas, sus rasgos, sus amigos, el clima y la hora. Devuelve
// { actividad, nombre, lugar, edificio, punto, duracion (horas), libre, con? }: `edificio`/
// `punto` son de aldea.js (`puntosDe`); `con`, el amigo al que visita. Los del valle devuelven
// `lugar: 'suyo'` y sin edificio (siguen donde están). `semilla`: la misma da lo mismo.
export function elegirActividad(persona, hora, diaSemana, clima, estado, semilla = 0) {
  const nada = { actividad: null, nombre: null, lugar: null, edificio: null, punto: null, duracion: 1, libre: false };
  if (!esPersonaVecindad(persona)) return nada;
  const h = horaNorm(hora);
  const ds = ((entero(diaSemana) % 7) + 7) % 7;
  const c = climaDe(clima);
  const sem = azar(hashTexto(persona) ^ entero(semilla) ^ Math.floor(h * 4));
  if (!esPersonaAldea(persona)) {
    const v = VARIANTES_VALLE[persona] || ['quedarse en lo suyo'];
    const noche = h >= 21 || h < 6.5;
    const nombre = noche ? 'quedarse adentro' : c === 'lluvia' || c === 'nieve' ? 'quedarse bajo techo' : v[Math.floor(sem * v.length) % v.length];
    return { actividad: 'suyo', nombre, lugar: 'suyo', edificio: null, punto: null, duracion: 1, libre: true };
  }
  const { v, aldea } = partes(estado);
  const r = rutinaAldea(persona, h, ds, aldea);
  if (!r.lugar) return nada;
  const motivo = obligacion(persona, h, ds, aldea, r);
  if (motivo) {
    return { actividad: 'rutina', nombre: motivo, lugar: r.lugar, edificio: r.edificio, punto: r.punto, duracion: Math.max(0.05, Math.floor(hastaQueCambie(persona, h, ds, aldea, false) * 100) / 100), libre: false };
  }
  const disponible = hastaQueCambie(persona, h, ds, aldea, true);
  const ganas = fichaSi(v, persona)?.ganas || ganasIniciales(persona);
  const rasgos = PERFILES_VECINOS[persona].rasgos;
  const t = h - desfaseDe(persona);
  const lista = candidatas(persona, h, ds, c, aldea, sem);
  const pesos = lista.map((x) => {
    const a = ACTIVIDADES[x.actividad];
    let w = x.base * (0.3 + Object.entries(a.ganas).reduce((s, [g, k]) => s + (ganas[g] || 0) * k, 0));
    for (const rg of rasgos) w *= RASGO_PESO[rg]?.[x.actividad] ?? 1;
    w *= CLIMA_PESO[c]?.[x.actividad] ?? 1;
    if (a.afuera && rasgos.includes('madrugador') && t < 10) w *= 1.3;
    return Math.max(0.001, w);
  });
  let q = azar(hashTexto(`${persona}:${entero(semilla)}:${Math.round(h * 100)}:${ds}`)) * pesos.reduce((s, x) => s + x, 0);
  let elegida = lista[lista.length - 1];
  for (let k = 0; k < lista.length; k++) { q -= pesos[k]; if (q < 0) { elegida = lista[k]; break; } }
  const quiere = 0.75 + Math.floor(sem * 6) * 0.25;
  // 3.6.1: lo de afuera termina antes de que oscurezca
  const tope = ACTIVIDADES[elegida.actividad].afuera ? Math.max(0, NOCHE_AFUERA - t) : Infinity;
  const duracion = Math.max(0, Math.floor(Math.min(quiere, disponible, tope) * 100) / 100);
  const lugar = elegida.edificio === 'plaza' ? 'plaza' : elegida.edificio === 'biblioteca' ? 'biblioteca' : elegida.edificio === 'almacen' ? 'almacen'
    : elegida.edificio === 'casa-te' && persona !== 'galesa' ? 'casa-te' : elegida.edificio === 'estacion-aldea' && elegida.actividad === 'paseo' ? 'paseo'
      : elegida.con ? 'visita' : 'casa';
  const salida = { actividad: elegida.actividad, nombre: ACTIVIDADES[elegida.actividad].nombre, lugar, edificio: elegida.edificio, punto: elegida.punto, duracion, libre: true };
  if (elegida.con) salida.con = elegida.con;
  return salida;
}
// Lo que pasa con las ganas al hacer algo: bajan las que la actividad satisface y las demás
// suben despacio. Llamarla cuando la persona empieza lo elegido.
export function cumplirActividad(estado, persona, eleccion) {
  if (!esPersonaVecindad(persona) || !objeto(eleccion) || !Object.hasOwn(ACTIVIDADES, eleccion.actividad)) return false;
  const { v } = partes(estado, true);
  const f = ficha(v, persona);
  const a = ACTIVIDADES[eleccion.actividad];
  const dur = acotar(Number.isFinite(num(eleccion.duracion)) ? num(eleccion.duracion) : 1, 0, 4);
  for (const g of GANAS) f.ganas[g] = Math.round(acotar(f.ganas[g] + 0.06 * dur - (a.ganas[g] || 0) * 0.4 * dur, 0, 1) * 100) / 100;
  f.hizo = eleccion.actividad;
  f.con = esPersonaVecindad(eleccion.con) ? eleccion.con : null;
  return true;
}

// ---------------------------------------------------------------- la memoria
// Lo que hace el jugador y los vecinos comentan (sólo lo reciente, 2 o 3 días, y cada uno lo
// que tiene sentido para él). `donde`: dónde llamar a `anotarHecho` en main.js.
export const HECHOS = {
  'trucha-grande': { que: 'pescó una trucha de 50 cm o más', donde: 'atrapar(pez), con { cm: pez.cm, especie: pez.def.nombre } (se ignora si es más chica)' },
  'pez-nativo': { que: 'pescó una perca o un pejerrey', donde: 'atrapar(pez), si pez.id es perca o pejerrey, con { especie }' },
  talar: { que: 'taló mucho en un día (8 árboles o más)', donde: 'anotarTalado(arbol): uno por árbol, se suman en el día' },
  renoval: { que: 'plantó un renoval', donde: 'donde se anota el diario «renoval»' },
  'aporte-obra': { que: 'aportó material a una obra del pueblo', donde: 'después de aportar() en la aldea, con { lote }' },
  capitulo: { que: 'terminó un capítulo de la historia', donde: 'al cerrar un capítulo (historia.js), con { capitulo: titulo }' },
  poncho: { que: 'se tejió o se consiguió un poncho', donde: 'diario «tejido» con poncho, el servicio de la tejedora o la feria' },
  'durmio-afuera': { que: 'durmió afuera (carpa o al raso)', donde: 'dormir(): diario «carpa», o de noche lejos de una casa' },
  cosecha: { que: 'cosechó en la huerta', donde: 'diario «cosecha»' },
  horneada: { que: 'horneó en su horno de barro', donde: 'diario «horno»' },
  miel: { que: 'sacó miel de su colmena', donde: 'diario «miel»' },
  esquila: { que: 'esquiló una oveja', donde: 'diario «esquila»' },
  tren: { que: 'viajó en la trochita', donde: 'al subir al tren (diario «tren»)' },
  'obra-propia': { que: 'terminó una construcción suya', donde: 'diario «obra», con { obra: nombre en minúscula }' },
  'foto-fauna': { que: 'sacó una foto de un animal', donde: 'al registrar una foto de fauna, con { especie }' },
  regalo: { que: 'le regaló algo a alguien', donde: 'lo anota regalar() sola' },
  ayuda: { que: 'le dio una mano a alguien', donde: 'lo anota ayudar() sola' },
  invitacion: { que: 'invitó a alguien a tomar algo', donde: 'lo anota invitar() sola' },
};
const DE_PERSONA = new Set(['regalo', 'ayuda', 'invitacion']);
const textoSano = (s, tope = 60) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f<>]/g, '').slice(0, tope) : null);
function sanearDato(d) {
  const x = objeto(d) ? d : {};
  const o = {};
  if (Number.isFinite(num(x.cm))) o.cm = acotar(Math.round(num(x.cm)), 0, 200);
  if (textoSano(x.especie, 40)) o.especie = textoSano(x.especie, 40).toLowerCase();
  if (esEdificioAldea(x.lote)) o.lote = x.lote;
  if (esRegalable(x.cosa)) o.cosa = x.cosa;
  if (esPersonaVecindad(x.persona)) o.persona = x.persona;
  if (textoSano(x.capitulo)) o.capitulo = textoSano(x.capitulo);
  if (textoSano(x.obra)) o.obra = textoSano(x.obra).toLowerCase();
  if (Number.isFinite(num(x.n))) o.n = acotar(entero(x.n), 0, 9999);
  if (x.que === 'mate' || x.que === 'te') o.que = x.que;
  return o;
}
const podarHechos = (v, dia) => {
  v.hechos = v.hechos.filter((h) => dia - h.dia <= GUARDA_HECHOS && h.dia <= dia + 1);
  while (v.hechos.length > TOPE_HECHOS) v.hechos.shift();
};
// Anota algo que hizo el jugador. `hecho`: un id de HECHOS (o { id, ...dato }); `dato`: lo que
// haga falta para el comentario (cm, especie, lote, capitulo, obra…). Devuelve true si quedó.
// Aportar a una obra suma amistad con el dueño del lote y los que trabajan en ella (una vez
// por día y por obra).
export function anotarHecho(estado, hecho, dia, dato = null) {
  const id = typeof hecho === 'string' ? hecho : objeto(hecho) ? hecho.id : null;
  if (typeof id !== 'string' || !Object.hasOwn(HECHOS, id)) return false;
  const d = diaValido(dia, 1);
  const datos = sanearDato(dato || (objeto(hecho) ? hecho : {}));
  if (id === 'trucha-grande' && Number.isFinite(datos.cm) && datos.cm < TRUCHA_GRANDE_CM) return false;
  if (DE_PERSONA.has(id) && !datos.persona) return false;
  if (id === 'aporte-obra' && !datos.lote) return false;
  const { v, aldea } = partes(estado, true);
  const igual = v.hechos.find((h) => h.id === id && h.dia === d && (!DE_PERSONA.has(id) || h.dato.persona === datos.persona) && (id !== 'aporte-obra' || h.dato.lote === datos.lote));
  if (igual) {
    if (id === 'talar') igual.dato.n = Math.min(9999, (igual.dato.n || 1) + 1);
    else Object.assign(igual.dato, datos);
    return true;
  }
  if (id === 'talar') datos.n = 1;
  v.hechos.push({ id, dia: d, dato: datos });
  if (id === 'aporte-obra') {
    const dueno = pobladorDeLote(datos.lote);
    if (dueno && esPersonaVecindad(dueno)) sumarAmistad(v, dueno, AMISTAD.obraDueno, d);
    for (const k of obrerosDe(aldea, datos.lote)) if (k !== dueno && esPersonaVecindad(k)) sumarAmistad(v, k, AMISTAD.obraObrero, d);
  }
  podarHechos(v, d);
  return true;
}
const nombreLugar = (lote) => (esEdificioAldea(lote) ? EDIFICIOS_ALDEA[lote].nombre.charAt(0).toLowerCase() + EDIFICIOS_ALDEA[lote].nombre.slice(1) : null);
function datosDeHecho(h) {
  const d = h.dato || {};
  const r = REGALABLES[d.cosa];
  return {
    cm: d.cm, especie: d.especie, capitulo: d.capitulo, obra: d.obra, lugar: nombreLugar(d.lote),
    cosa: r?.nombre, lacosa: r?.el, quien: d.persona ? nombreCorto(d.persona) : null, que: d.que === 'te' ? 'té' : d.que === 'mate' ? 'mate' : null,
  };
}
// Lo que esta persona comenta de lo que hiciste (o null): lo más reciente que tenga sentido para
// ella y que todavía no haya comentado. Lo marca como dicho.
export function comentarioSobreVos(persona, estado, dia) {
  if (!esPersonaVecindad(persona)) return null;
  const { v } = partes(estado);
  if (!v) return null;
  const d = diaValido(dia, 1);
  const f = fichaSi(v, persona);
  const ya = f ? f.coment : [];
  const recientes = v.hechos.filter((h) => d - h.dia >= 0 && d - h.dia <= RECIENTE).sort((a, b) => b.dia - a.dia);
  // 3.6.1: lo ya comentado de días que no se comentan más se olvida (si no, con la lista llena, lo
  // primero que se dijo se borraba y el chismoso lo volvía a contar)
  if (f) f.coment = f.coment.filter((k) => { const m = /@(d+)$/.exec(k); return !m || d - Number(m[1]) <= RECIENTE; });
  // y comenta hasta cuatro cosas por día: con eso lo comentado de los días que cuentan (tres) entra en
  // la lista (16) y nada se dice dos veces (antes, con veinte regalos en un día, la chismosa repetía)
  if (f && f.cd === d && f.cn >= COMENT_POR_DIA) return null;
  for (const h of recientes) {
    const clave = `${h.id}${h.dato?.persona ? ':' + h.dato.persona : ''}${h.dato?.lote ? ':' + h.dato.lote : ''}@${h.dia}`;
    if (ya.includes(clave)) continue;
    const tabla = COMENTARIOS[h.id];
    if (!tabla) continue;
    let lineas = null;
    if (DE_PERSONA.has(h.id)) {
      if (h.dato.persona === persona) lineas = d > h.dia ? tabla._recibe : null;
      else if (CHISMOSOS.includes(persona)) lineas = tabla._chisme;
    } else if (h.id === 'aporte-obra' && pobladorDeLote(h.dato.lote) === persona) lineas = tabla._dueno;
    else if (h.id === 'talar' && (h.dato.n || 0) < TALA_MUCHA) lineas = null;
    else lineas = tieneDe(tabla, persona) ? tabla[persona] : null;
    if (!lineas) continue;
    const texto = primeraQueSirva(lineas, datosDeHecho(h), (f?.coment.length || 0) % lineas.length);
    if (!texto) continue;
    const fc = ficha(v, persona);
    recordar(fc.coment, clave, TOPE_COMENT);
    if (fc.cd !== d) { fc.cd = d; fc.cn = 0; }
    fc.cn++;
    return { texto, hecho: h.id };
  }
  return null;
}

// ---------------------------------------------------------------- la charla
const diaDeEstado = (progreso, contexto) => diaValido(contexto?.dia ?? progreso?.dia, 1);
// Charlar suma un poquito, una vez por día.
export function charlar(persona, estado, dia) {
  if (!esPersonaVecindad(persona)) return null;
  const { v } = partes(estado, true);
  const f = ficha(v, persona);
  const d = diaValido(dia, 1);
  if (f.charla === d) return { cambio: 0, nivel: nivelDe(persona, v), subio: false };
  f.charla = d;
  return sumarAmistad(v, persona, AMISTAD.charla, d);
}
// El saludo de alguien que ya te tiene confianza (o null si todavía sos un conocido: entonces
// vale el saludo de siempre). Con amigo, te saluda por tu nombre (`contexto.nombre`; el juego
// todavía no le pone nombre al jugador, así que usa su trato cariñoso).
export function saludoDeAmistad(persona, estado, contexto = {}) {
  if (!esPersonaVecindad(persona)) return null;
  const n = indiceNivel(persona, partes(estado).v);
  if (n < 1) return null;
  const voz = VOCES[persona];
  const nombre = textoSano(contexto?.nombre, 30) || TRATO[persona] || 'vecino';
  return llenar(n >= 2 ? voz.saludoCompadre : voz.saludoAmigo, { nombre });
}
function tipoDeAnimo(f, hora) {
  const g = f?.ganas;
  if (horaNorm(hora) >= 20.5 || horaNorm(hora) < 6) return 'cansado';
  if (!g) return 'bien';
  if (g.descanso >= 0.75) return 'cansado';
  if (g.social >= 0.7) return 'charla';
  if (g.aire >= 0.7) return 'inquieto';
  return 'bien';
}
const SECCIONES_NOVEDAD = {
  guardaparque: ['fauna', 'rastros'], ema: ['fauna', 'rastros'], pescador: ['peces', 'fauna'], nicanor: ['peces', 'fauna'],
  apicultor: ['fauna', 'flora'], madre: ['flora', 'fauna'], abuela: ['fauna', 'flora'], tejedora: ['flora', 'fauna'],
};
const NO_SE_VEN = new Set(['perro', 'oveja', 'gallina', 'caballo', 'rastreo']);
const HABLAN_DEL_TREN = ['jefe', 'guarda', 'telegrafista', 'nelida', 'ercilia'];
const FEMENINOS = new Set(['liebre']);
function unBicho(e) {
  const n = e.nombre.charAt(0).toLowerCase() + e.nombre.slice(1);
  const w = n.split(' ')[0];
  if (w === 'huellas') return `unas ${n}`;
  return `${w.endsWith('a') || FEMENINOS.has(w) ? 'una' : 'un'} ${n}`;
}
// Lo que no anotaste y esta persona vio (o null).
function faunaPendiente(persona, entradas, dichos) {
  const secs = SECCIONES_NOVEDAD[persona] || ['fauna'];
  const lista = ENTRADAS.filter((e) => secs.includes(e.seccion) && !NO_SE_VEN.has(e.id) && !tieneDe(entradas, e.id) && !dichos.includes(`fauna:${e.id}`));
  if (!lista.length) return null;
  lista.sort((a, b) => hashTexto(persona + a.id) - hashTexto(persona + b.id));
  return lista[0];
}
function novedades(persona, v, aldea, progreso, contexto) {
  const f = fichaSi(v, persona);
  const dichos = f ? f.dichos : [];
  const d = diaDeEstado(progreso, contexto);
  const voz = VOCES[persona];
  const items = [];
  const entradas = objeto(progreso?.entradas) ? progreso.entradas : objeto(contexto?.entradas) ? contexto.entradas : {};
  const bicho = faunaPendiente(persona, entradas, dichos);
  if (bicho) {
    const r1 = llenar(voz.fauna, { unbicho: unBicho(bicho) }) || llenar(FRASES.faunaGenerica, { unbicho: unBicho(bicho) });
    items.push({ clave: `fauna:${bicho.id}`, renglones: [r1, llenar(FRASES.pista, { pista: bicho.pista.charAt(0).toLowerCase() + bicho.pista.slice(1) })] });
  }
  const sol = [];
  if (aldea.llegando?.clave && aldea.llegando.clave !== persona && !dichos.includes(`llego:${aldea.llegando.clave}`)) {
    const k = aldea.llegando.clave;
    sol.push({ clave: `llego:${k}`, texto: primeraQueSirva(FRASES.llego, { quien: nombreCompleto(k), oficio: oficioDe(k) }, hashTexto(persona) % 2) });
  }
  for (const [lote, desde] of Object.entries(objeto(aldea.locales) ? aldea.locales : {})) {
    if (d - entero(desde) <= 3 && pobladorDeLote(lote) !== persona && !dichos.includes(`abrio:${lote}`)) sol.push({ clave: `abrio:${lote}`, texto: primeraQueSirva(FRASES.abrio, { lugar: nombreLugar(lote) }, hashTexto(persona) % 2) });
  }
  const obra = obraEnCurso(aldea);
  if (obra) {
    const et = etapaDe(aldea, obra);
    const clave = `obra:${obra}:${et.hechas}`;
    if (!dichos.includes(clave)) sol.push({ clave, texto: primeraQueSirva(et.hechas ? FRASES.obra : FRASES.obraEmpieza, { lugar: nombreLugar(obra), hechas: et.hechas, total: et.total }, hashTexto(persona) % 2) });
  }
  const pron = textoSano(contexto?.pronostico, 120);
  if (pron && !dichos.includes(`pron:${d}`)) sol.push({ clave: `pron:${d}`, texto: llenar(voz.pronostico || FRASES.pronostico, { pronostico: pron }) });
  if (HABLAN_DEL_TREN.includes(persona)) {
    const hora = num(contexto?.tren?.hora ?? contexto?.tren);
    if (Number.isFinite(hora) && !dichos.includes(`tren:${d}`)) {
      const hh = Math.floor(horaNorm(hora)), mm = Math.round((horaNorm(hora) - hh) * 60);
      sol.push({ clave: `tren:${d}`, texto: llenar(FRASES.trenHora, { hora: mm ? `${hh}:${String(mm).padStart(2, '0')}` : `${hh}` }) });
    } else {
      const i = FRASES.tren.findIndex((_x, k) => !dichos.includes(`trenx:${k}`));
      if (i >= 0) sol.push({ clave: `trenx:${i}`, texto: FRASES.tren[i] });
    }
  }
  const urgente = (s) => s.clave.startsWith('llego:') || s.clave.startsWith('pron:');
  for (const s of sol) if (s.texto && urgente(s)) items.unshift({ clave: s.clave, renglones: [s.texto] });
  for (const s of sol) if (s.texto && !urgente(s)) items.push({ clave: s.clave, renglones: [s.texto] });
  // hasta tres renglones: primero el que llegó y el tiempo de mañana, después el avistaje (dos
  // renglones) y lo del pueblo
  const elegidos = [];
  let n = 0;
  for (const it of items) {
    if (n + it.renglones.length > 3) continue;
    elegidos.push(it);
    n += it.renglones.length;
  }
  if (!elegidos.length) return { renglones: [FRASES.sinNovedades[(d + hashTexto(persona)) % FRASES.sinNovedades.length]], claves: [] };
  return { renglones: elegidos.flatMap((x) => x.renglones), claves: elegidos.map((x) => x.clave) };
}
// 3.6.1: lo ya contado que no se puede volver a contar se olvida (el pronóstico y el tren de otro día, el
// que ya no está llegando, el local que abrió hace días, la etapa de obra que ya pasó, el animal que ya
// anotaste): así la lista (24) no se llena de cosas viejas y no se borra lo que sí importa, que se
// volvía a contar (la misma novedad dos veces)
// Con la lista llena se olvida primero un avistaje viejo (vuelve a contarlo más adelante, como pista)
// o la sobremesa: nunca lo del pueblo que todavía vale.
function recordarDicho(lista, clave) {
  const i = lista.indexOf(clave);
  if (i >= 0) lista.splice(i, 1);
  lista.push(clave);
  while (lista.length > TOPE_DICHOS) {
    const j = lista.findIndex((k) => /^(fauna|sob|trenx):/.test(k));
    lista.splice(j >= 0 ? j : 0, 1);
  }
}
function podarDichos(f, aldea, entradas, d) {
  const obra = obraEnCurso(aldea), hechas = obra ? etapaDe(aldea, obra).hechas : -1;
  f.dichos = f.dichos.filter((k) => {
    const [tipo, a, b] = k.split(':');
    if (tipo === 'fauna') return !tieneDe(entradas, a);
    if (tipo === 'llego') return aldea.llegando?.clave === a;
    if (tipo === 'abrio') return objeto(aldea.locales) && Object.hasOwn(aldea.locales, a) && d - entero(aldea.locales[a]) <= 3;
    if (tipo === 'obra') return a === obra && Number(b) === hechas;
    if (tipo === 'pron' || tipo === 'tren') return Number(a) === d;
    return true;
  });
}
function historiaDe(persona, v) {
  const f = fichaSi(v, persona);
  const hist = f ? f.hist : 0;
  const voz = VOCES[persona];
  const nivel = indiceNivel(persona, v);
  if (hist >= voz.historia.partes.length) return { renglones: [FRASES.historiaFin[hashTexto(persona) % FRASES.historiaFin.length]], parte: hist, bloqueada: false, termino: true };
  if (nivel < hist) {
    const pool = hist >= 2 ? FRASES.historiaCompadre : FRASES.historiaAmigo;
    return { renglones: [pool[hashTexto(persona) % pool.length]], parte: hist, bloqueada: true, pide: NIVELES_AMISTAD[hist] };
  }
  return { renglones: [voz.historia.partes[hist]], parte: hist + 1, bloqueada: false };
}
// Los temas para elegir al hablarle (cada uno con 1 a 3 renglones). No cambia nada: lo que se
// elige se confirma con `elegirTema`. `contexto`: { dia, hora, clima, pronostico, tren, nombre }.
export function temasDeCharla(persona, estado, contexto = {}) {
  if (!esPersonaVecindad(persona)) return [];
  const { v, aldea, progreso } = partes(estado);
  const f = fichaSi(v, persona);
  const voz = VOCES[persona];
  const d = diaDeEstado(progreso, contexto);
  const c = climaDe(contexto?.clima);
  const como = [voz.animo[tipoDeAnimo(f, contexto?.hora ?? progreso?.horas ?? 12)]];
  const hizo = f?.hizo && FRASES.hizo[f.hizo] ? llenar(FRASES.hizo[f.hizo], { amigo: f.con ? nombreCorto(f.con) : null }) : null;
  como.push(hizo || FRASES.clima[c][(d + hashTexto(persona)) % FRASES.clima[c].length]);
  const nov = novedades(persona, v, aldea, progreso, contexto);
  const his = historiaDe(persona, v);
  return [
    { id: 'como-andas', titulo: '¿Cómo andás?', renglones: como },
    { id: 'novedades', titulo: 'Novedades', renglones: nov.renglones },
    { id: 'historia', titulo: his.termino ? 'Tu historia' : `Tu historia · ${voz.historia.titulo}`, renglones: his.renglones, bloqueada: his.bloqueada },
  ];
}
// Elige un tema: devuelve sus renglones y lo deja en la memoria (las novedades no se repiten, la
// historia avanza una parte). Charlar suma amistad una vez por día.
export function elegirTema(persona, tema, estado, contexto = {}) {
  if (!esPersonaVecindad(persona)) return { renglones: [] };
  const { v, aldea, progreso } = partes(estado, true);
  const d = diaDeEstado(progreso, contexto);
  const lista = temasDeCharla(persona, progreso || v, contexto);
  const t = lista.find((x) => x.id === tema);
  if (!t) return { renglones: [] };
  const f = ficha(v, persona);
  if (tema === 'novedades') {
    podarDichos(f, aldea, objeto(progreso?.entradas) ? progreso.entradas : objeto(contexto?.entradas) ? contexto.entradas : {}, d);
    for (const k of novedades(persona, v, aldea, progreso, contexto).claves) recordarDicho(f.dichos, k);
  }
  if (tema === 'historia') { const h = historiaDe(persona, v); if (!h.bloqueada && !h.termino) f.hist = h.parte; }
  const amistad = charlar(persona, progreso || v, d);
  return { renglones: t.renglones, amistad };
}
// Todo junto, para cuando empezás a hablarle: el saludo de amistad (o null), lo que comenta de
// vos (o null), los temas y qué más se puede hacer hoy. Cuenta como charla del día.
export function abrirCharla(persona, estado, contexto = {}) {
  if (!esPersonaVecindad(persona)) return null;
  const { v, progreso } = partes(estado, true);
  const base = progreso || v;
  const d = diaDeEstado(progreso, contexto);
  const saludo = saludoDeAmistad(persona, base, contexto);
  const comentario = comentarioSobreVos(persona, base, d);
  const temas = temasDeCharla(persona, base, contexto);
  const f = ficha(v, persona);
  const amistad = charlar(persona, base, d);
  return {
    saludo, comentario: comentario?.texto || null, temas, amistad, nivel: nivelDe(persona, v),
    puede: { regalar: f.regalo !== d, invitar: f.invito !== d, ayudar: ayudas(persona, base, d).length > 0 },
  };
}

// ---------------------------------------------------------------- regalar
const cuantoHay = (inv, tipo, k) => {
  if (typeof inv === 'function') return entero(inv(k, tipo));
  if (!objeto(inv)) return Infinity;
  if (tipo === 'material') return entero(inv.materiales?.[k]);
  if (tipo === 'cosa') return entero(inv.cosas?.[k]);
  return entero(inv.entradas?.[k]?.cantidad);
};
// Le das algo. Una vez por persona por día. Devuelve { ok, reaccion ('encanta'|'gusta'|'noGusta'|
// 'neutro'|'ya-hoy'|'no-tenes'|'no-se'), renglones, efectos (lo que se descuenta: { tipo, k, n }),
// amistad }. Si `estado` es la partida, mira que lo tengas (o pasale `inventario`).
export function regalar(persona, cosa, estado, dia, inventario = null) {
  if (!esPersonaVecindad(persona) || !esRegalable(cosa)) return { ok: false, reaccion: 'no-se', renglones: [FRASES.noSe], efectos: [] };
  const { v, progreso } = partes(estado, true);
  const d = diaValido(dia ?? progreso?.dia, 1);
  const f = ficha(v, persona);
  const r = REGALABLES[cosa];
  if (f.regalo === d) return { ok: false, reaccion: 'ya-hoy', renglones: [FRASES.yaHoy[(d + hashTexto(persona)) % FRASES.yaHoy.length]], efectos: [] };
  const inv = inventario ?? progreso;
  if (inv && cuantoHay(inv, r.tipo, cosa) < r.n) return { ok: false, reaccion: 'no-tenes', renglones: [llenar(FRASES.noTenes, { cosa: r.nombre })], efectos: [] };
  const reaccion = gustoDe(persona, cosa);
  const voz = VOCES[persona];
  const datos = { cosa: r.nombre, lacosa: r.el };
  let texto;
  if (reaccion === 'encanta') texto = voz.encanta[cosa];
  else if (reaccion === 'gusta') texto = llenar(voz.gusta, datos);
  else if (reaccion === 'noGusta') texto = voz.noGusta;
  else texto = FRASES.neutro[(d + hashTexto(persona + cosa)) % FRASES.neutro.length];
  f.regalo = d;
  f.regalos = Math.min(TOPE_DIA, f.regalos + 1);
  f.ultimoRegalo = cosa;
  if (!Array.isArray(f.conoce)) f.conoce = [];
  recordar(f.conoce, cosa, TOPE_CONOCE);
  const amistad = sumarAmistad(v, persona, AMISTAD[reaccion], d);
  anotarHecho(progreso || v, 'regalo', d, { persona, cosa });
  return { ok: true, reaccion, renglones: [texto], efectos: [{ tipo: r.tipo, k: cosa, n: -r.n }], amistad };
}

// ---------------------------------------------------------------- invitar
// A qué horas no se puede sacar a los del valle de lo suyo.
const TRABAJO_VALLE = { ramon: [[7, 12], [14, 18]], nicanor: [[5, 10], [17, 21]], ema: [[8, 12.5], [14, 18]], guarda: [[7, 20]] };
// Lo invitás a tomar algo: `que` = 'mate' (en tu mesa del refugio) o 'te' (en la casa de té).
// Devuelve { ok, motivo, renglones } si dice que no ('no-le-gusta', 'noche', 'ya-tomo',
// 'trabajando', 'cerrado', 'anfitriona') o, si acepta, { ok: true, acepta, secuencia: [ir,
// sentarse, charla], renglones, amistad }: la secuencia la camina quien maneje la gente. Suma
// amistad una vez por día (la segunda invitación del día, la rechaza).
export function invitar(persona, que, estado, hora, extra = {}) {
  if (!esPersonaVecindad(persona) || (que !== 'mate' && que !== 'te')) return { ok: false, motivo: 'no-se', renglones: [] };
  const { v, aldea, progreso } = partes(estado, true);
  const d = diaValido(extra?.dia ?? progreso?.dia, 1);
  const h = horaNorm(hora ?? progreso?.horas);
  const ds = Number.isFinite(num(extra?.diaSemana)) ? ((entero(extra.diaSemana) % 7) + 7) % 7 : diaSemanaDe(d);
  const voz = VOCES[persona];
  const f = ficha(v, persona);
  const no = (motivo, texto) => ({ ok: false, motivo, renglones: [texto] });
  if (que === 'te' && persona === 'galesa') return no('anfitriona', FRASES.teAnfitriona);
  if (voz.noToma && Object.hasOwn(voz.noToma, que)) return no('no-le-gusta', voz.noToma[que]);
  if (h >= 21 || h < 7) return no('noche', FRASES.noche[(d + hashTexto(persona)) % FRASES.noche.length]);
  if (f.invito === d) return no('ya-tomo', FRASES.yaTomo[(d + hashTexto(persona)) % FRASES.yaTomo.length]);
  if (esPersonaAldea(persona)) {
    const m = obligacion(persona, h, ds, aldea);
    if (m === 'ausente') return no('ausente', 'Todavía no vive en la aldea.');
    if (m) return no('trabajando', voz.ocupado);
  } else if ((TRABAJO_VALLE[persona] || []).some(([a, b]) => h >= a && h < b)) return no('trabajando', voz.ocupado);
  if (que === 'te' && !casaTeAbierta(aldea, h, ds)) return no('cerrado', FRASES.teCerrado);
  const destino = que === 'mate' ? { lugar: 'mesa-refugio', edificio: null, punto: null, tuPunto: null }
    : { lugar: 'casa-te', edificio: 'casa-te', punto: 'mesa-2', tuPunto: 'mesa-1' };
  // la charla de la mesa: una de apertura y una o dos de sobremesa que no haya dicho hace poco
  const abre = que === 'mate' ? FRASES.abreMate : FRASES.abreTe;
  const renglones = [abre[(d + hashTexto(persona)) % abre.length]];
  let libres = voz.sobremesa.map((_x, i) => i).filter((i) => !f.dichos.includes(`sob:${i}`));
  if (!libres.length) { f.dichos = f.dichos.filter((k) => !k.startsWith('sob:')); libres = voz.sobremesa.map((_x, i) => i); }
  const cuantas = indiceNivel(persona, v) >= 1 ? 2 : 1;
  for (const i of libres.slice(0, cuantas)) { renglones.push(voz.sobremesa[i]); recordarDicho(f.dichos, `sob:${i}`); }
  f.invito = d;
  const amistad = sumarAmistad(v, persona, AMISTAD.invitar, d);
  anotarHecho(progreso || v, 'invitacion', d, { persona, que });
  return {
    ok: true, motivo: null,
    acepta: llenar(voz.acepta, { lugar: que === 'mate' ? 'tu mesa' : 'la casa de té' }),
    secuencia: [{ paso: 'ir', ...destino }, { paso: 'sentarse', ...destino }, { paso: 'charla', renglones }],
    renglones, amistad,
  };
}

// ---------------------------------------------------------------- dar una mano
// Las ayudas chicas de su oficio que se pueden hacer hoy ([] si ya lo ayudaste hoy):
// [{ id, titulo, pide?: { tipo, k, n }, hace? }].
export function ayudas(persona, estado, dia = null) {
  if (!esPersonaVecindad(persona) || !Object.hasOwn(AYUDAS, persona)) return [];
  const { v, progreso } = partes(estado);
  const d = diaValido(dia ?? progreso?.dia, 1);
  if (fichaSi(v, persona)?.ayuda === d) return [];
  return AYUDAS[persona].map((a) => ({ id: a.id, titulo: a.titulo, ...(a.pide ? { pide: { ...a.pide } } : { hace: true }) }));
}
// Le das la mano. `inventario`: la partida (o { materiales, cosas, entradas }, o una función
// (k, tipo) → cantidad) para ver que tengas lo que pide. Devuelve { ok, motivo?, renglones,
// efectos (lo que se descuenta y, a veces, lo que te da), amistad }. Una por persona por día.
export function ayudar(persona, ayuda, estado, inventario = null, dia = null) {
  if (!esPersonaVecindad(persona) || !Object.hasOwn(AYUDAS, persona)) return { ok: false, motivo: 'no-se', renglones: [], efectos: [] };
  const a = AYUDAS[persona].find((x) => x.id === ayuda);
  if (!a) return { ok: false, motivo: 'no-se', renglones: [], efectos: [] };
  const { v, progreso } = partes(estado, true);
  const d = diaValido(dia ?? progreso?.dia, 1);
  const f = ficha(v, persona);
  if (f.ayuda === d) return { ok: false, motivo: 'ya-hoy', renglones: ['Por hoy ya me diste una mano. Mañana, si querés, seguimos.'], efectos: [] };
  const inv = inventario ?? progreso;
  if (a.pide && inv && cuantoHay(inv, a.pide.tipo, a.pide.k) < a.pide.n) {
    const r = REGALABLES[a.pide.k];
    return { ok: false, motivo: 'no-tenes', renglones: [llenar(FRASES.noTenes, { cosa: r ? r.nombre : a.pide.k })], efectos: [] };
  }
  const efectos = a.pide ? [{ tipo: a.pide.tipo, k: a.pide.k, n: -a.pide.n }] : [];
  const renglones = [...a.gracias];
  // una vez sí, otra no: lo chico que te da, o el consejo
  if (a.devuelve && f.ayudas % 2 === 0) { efectos.push({ tipo: a.devuelve.tipo, k: a.devuelve.k, n: a.devuelve.n }); renglones.push(a.devuelve.texto); }
  else renglones.push(a.consejo);
  f.ayuda = d;
  f.ayudas = Math.min(TOPE_DIA, f.ayudas + 1);
  const amistad = sumarAmistad(v, persona, AMISTAD.ayudar, d);
  anotarHecho(progreso || v, 'ayuda', d, { persona });
  return { ok: true, renglones: renglones.slice(0, 3), efectos, amistad };
}

// ---------------------------------------------------------------- lo que abre la amistad
export const VISITA_AMISTAD = { cada: 4 };
// Un compadre que viene a visitarte al refugio (para quien maneje visitas.js: llamarla cuando
// toca una visita; si devuelve a alguien, viene él en vez del turno de siempre). Devuelve
// { clave, partes: [2 renglones], regalo: { tipo, k, n }, textoRegalo } o null. La marca hecha.
// 3.6.1: `puede(clave)`: si ése puede venir ahora (no está en el tren, ni de visita, ni charlando con vos).
// Antes se marcaba la visita aunque no pudiera venir: se perdía (y volvía a los cuatro días).
export function visitaDeAmistad(estado, dia, puede = null) {
  const { v } = partes(estado, true);
  const d = diaValido(dia, 1);
  if (v.visita.ultima && d - v.visita.ultima < VISITA_AMISTAD.cada) return null;
  const compadres = PERSONAS_VECINDAD.filter((k) => indiceNivel(k, v) >= 2 && (typeof puede !== 'function' || puede(k)));
  if (!compadres.length) return null;
  compadres.sort((a, b) => (v.personas[a].visito - v.personas[b].visito) || (PERSONAS_VECINDAD.indexOf(a) - PERSONAS_VECINDAD.indexOf(b)));
  const clave = compadres[0];
  v.visita.ultima = d;
  v.visita.cuenta = Math.min(TOPE_DIA, v.visita.cuenta + 1);
  v.personas[clave].visito = d;
  return { clave, partes: [...VOCES[clave].visita], regalo: { ...PERFILES_VECINOS[clave].regala }, textoRegalo: VOCES[clave].regalo };
}
// Cada cuántos días deja un regalo un compadre (5 a 8, distinto para cada uno).
const intervaloRegalo = (persona, n) => 5 + ((hashTexto(persona) + n) % 4);
// A veces un compadre te deja un regalo (de sus gustos o de su oficio): uno por día como mucho.
// Devuelve { clave, efectos: [{ tipo, k, n }], texto } o null. Lo marca dado.
export function regaloDeAmistad(estado, dia) {
  const { v } = partes(estado, true);
  const d = diaValido(dia, 1);
  for (const k of PERSONAS_VECINDAD) {
    if (indiceNivel(k, v) < 2) continue;
    const f = v.personas[k];
    const desde = f.dejo || f.desde || d;
    if (d - desde < intervaloRegalo(k, f.dejo)) continue;
    f.dejo = d;
    const r = PERFILES_VECINOS[k].regala;
    return { clave: k, efectos: [{ tipo: r.tipo, k: r.k, n: r.n }], texto: VOCES[k].regalo };
  }
  return null;
}

// ---------------------------------------------------------------- el paso de los días
// Llamarla al empezar cada día (al despertar): la amistad baja apenas con los que no ves hace
// días (nunca de amigo a conocido), las ganas vuelven despacio a lo de cada uno y se olvidan
// los hechos viejos.
export function pasarDiaVecindad(estado, dia) {
  const { v } = partes(estado, true);
  const d = diaValido(dia, 1);
  const desde = Math.max(v.dia || d - 1, d - 60);
  for (let x = desde + 1; x <= d; x++) {
    for (const k of Object.keys(v.personas)) {
      const f = v.personas[k];
      if (f.contacto && x - f.contacto > AMISTAD.sinContacto) f.p = Math.max(pisoDe(f), f.p - AMISTAD.baja);
      const ini = ganasIniciales(k);
      for (const g of GANAS) f.ganas[g] = Math.round((f.ganas[g] + (ini[g] - f.ganas[g]) * 0.2) * 100) / 100;
    }
  }
  v.dia = Math.max(v.dia, d);
  podarHechos(v, d);
  return true;
}

// ---------------------------------------------------------------- el guardado
const CLAVE_DICHO = /^[a-z0-9:._@-]{1,48}$/i;
function sanearFicha(persona, x0) {
  const x = objeto(x0) ? x0 : {};
  const b = fichaNueva(persona);
  const p = acotar(Number.isFinite(num(x.p)) ? Math.round(num(x.p)) : 0, 0, AMISTAD.tope);
  const max = Math.max(acotar(entero(x.max), 0, 2), nivelPorPuntos(p));
  const ganas = {};
  for (const g of GANAS) {
    const n = objeto(x.ganas) && Object.hasOwn(x.ganas, g) ? num(x.ganas[g]) : NaN;
    ganas[g] = Number.isFinite(n) ? Math.round(acotar(n, 0, 1) * 100) / 100 : b.ganas[g];
  }
  const lista = (l, tope) => (Array.isArray(l) ? [...new Set(l.filter((s) => typeof s === 'string' && CLAVE_DICHO.test(s)))].slice(-tope) : []);
  return {
    p: max >= 1 ? Math.max(p, AMISTAD.umbral.amigo) : p, max, desde: diaOCero(x.desde), contacto: diaOCero(x.contacto),
    charla: diaOCero(x.charla), regalo: diaOCero(x.regalo), invito: diaOCero(x.invito), ayuda: diaOCero(x.ayuda), visito: diaOCero(x.visito), dejo: diaOCero(x.dejo),
    hist: acotar(entero(x.hist), 0, VOCES[persona].historia.partes.length), ayudas: diaOCero(x.ayudas), regalos: diaOCero(x.regalos),
    cd: diaOCero(x.cd), cn: acotar(entero(x.cn), 0, COMENT_POR_DIA),   // 3.6.1: lo comentado hoy
    hizo: typeof x.hizo === 'string' && Object.hasOwn(ACTIVIDADES, x.hizo) ? x.hizo : null,
    con: esPersonaVecindad(x.con) ? x.con : null,
    ultimoRegalo: esRegalable(x.ultimoRegalo) ? x.ultimoRegalo : null,
    ganas, dichos: lista(x.dichos, TOPE_DICHOS), coment: lista(x.coment, TOPE_COMENT),
    conoce: Array.isArray(x.conoce) ? [...new Set(x.conoce.filter(esRegalable))].slice(-TOPE_CONOCE) : [],
  };
}
// Todo saneado (un guardado retocado o roto no rompe nada): sólo personas conocidas, números
// acotados, listas cortas y los hechos de la última semana.
export function sanearVecindad(v0) {
  const x = objeto(v0) ? v0 : {};
  const personas = {};
  if (objeto(x.personas)) for (const k of PERSONAS_VECINDAD) if (Object.hasOwn(x.personas, k)) personas[k] = sanearFicha(k, x.personas[k]);
  const dia = diaOCero(x.dia);
  const hechos = [];
  for (const h of Array.isArray(x.hechos) ? x.hechos : []) {
    if (!objeto(h) || typeof h.id !== 'string' || !Object.hasOwn(HECHOS, h.id)) continue;
    const dato = sanearDato(h.dato);
    if (DE_PERSONA.has(h.id) && !dato.persona) continue;
    if (h.id === 'aporte-obra' && !dato.lote) continue;
    hechos.push({ id: h.id, dia: diaValido(h.dia, 1), dato });
  }
  const recientes = dia ? hechos.filter((h) => dia - h.dia <= GUARDA_HECHOS && h.dia <= dia + 1) : hechos;
  const visita = objeto(x.visita) ? x.visita : {};
  return { personas, hechos: recientes.slice(-TOPE_HECHOS), visita: { ultima: diaOCero(visita.ultima), cuenta: diaOCero(visita.cuenta) }, dia, cita: sanearCita(x.cita) };
}
