// 4.10 partidas: lo de ENTRE partidas y las formas de jugar del Desafío (módulo puro: sin THREE ni DOM; se prueba en Node).
//
// Qué hay acá:
//   · las semillas del Coihue (la moneda de entre partidas): una por partida terminada, ganada o perdida, con un
//     mínimo de noches resistidas; se guardan aparte de cada partida (`hojarasca-meta-v1`, con copia de respaldo);
//   · las ventajas (12, de cuatro tipos; 1 o 2 por partida) y las reglas a elección (5), con su multiplicador de puntos;
//   · los modos: campaña (20 noches), partida corta (7) y pesadilla (se desbloquea al ganar una vez);
//   · los puntos y los récords propios de cada modo;
//   · los finales (cuatro) según cómo jugaste.
// El Relax queda afuera: nada de esto se pasa al Relax.
//
// CONTRATO DE BONOS (lo define y lo sube la rama «guardian», `desafio-bonos.js`): las ventajas de personaje llegan al
// juego como `sumarBono(d, 'ventaja', clave, valor)` con las claves de `CLAVES_BONO`. Acá sólo se calculan los valores
// (`efectosDe(meta).bonos`); quien los aplica es `desafio-meta-mundo.js`.
import { normalizarCodigo } from './semilla.js';

// ---------------------------------------------------------------- las semillas del Coihue
// No son las «semillas doradas» que se juntan en el bosque (el material `cristal`): estas se ganan por partida y se
// gastan antes de empezar la siguiente.
export const SEMILLAS = {
  porPartida: 1,        // una por partida
  minNoches: 3,         // y sólo si resististe al menos tres noches (empezar y abandonar no regala nada)
  tope: 99,             // lo máximo que se guarda
};
export const NOMBRE_MONEDA = ['semilla del Coihue', 'semillas del Coihue'];
export const textoSemillas = (n) => `${n} ${n === 1 ? NOMBRE_MONEDA[0] : NOMBRE_MONEDA[1]}`;

// ¿Esta partida terminada da su semilla? `termino`: se ganó, se terminó la corrida o se la dejó para empezar otra.
export function semillaPorPartida({ noches = 0, yaDada = false } = {}) {
  if (yaDada) return 0;
  return Math.floor(Number(noches) || 0) >= SEMILLAS.minNoches ? SEMILLAS.porPartida : 0;
}

// ---------------------------------------------------------------- los modos
export const MODOS = {
  normal: { nombre: 'Campaña', noches: 20, texto: 'Veinte noches hasta el Coihue Viejo, y después la cueva.' },
  corta: { nombre: 'Partida corta', noches: 7, texto: 'Siete noches y el mandamás en la última: para una tarde. Tiene su propio récord.',
    mult: { cantidad: 0.95, dano: 1, vida: 0.95 }, nocheFinal: 7 },
  pesadilla: { nombre: 'Pesadilla', noches: 20, texto: 'Más duendes y más duros, niebla más seguido y sin cofre del alba. Se desbloquea al ganar la campaña una vez.',
    mult: { cantidad: 1.3, dano: 1.15, vida: 1.1 }, sinCaja: true, nieblaTope: 0.7, requiere: 'pesadilla' },
  sinfin: { nombre: 'Sin fin', noches: 0, texto: 'Una sola vida y ninguna noche final.' },
};
export const CLAVES_MODO = Object.keys(MODOS);
export const NOCHE_DEL_MANDAMAS_CORTA = 7;
export const esModo = (m) => typeof m === 'string' && Object.hasOwn(MODOS, m);

// ---------------------------------------------------------------- ventajas y reglas
// `costo`: semillas que se gastan al empezar. `mult`: lo que suma al multiplicador de puntos (las que tienen costo en el
// juego devuelven puntos, no semillas). `efecto`: ver `efectosDe`.
export const TIPOS_VENTAJA = {
  arranque: 'Arranque', aliados: 'Aliados', personaje: 'Personaje', costo: 'Con costo',
};
export const VENTAJAS = {
  tablas: { tipo: 'arranque', nombre: 'Provisiones', texto: 'Empezás con 10 tablas y 4 troncos.', costo: 1, efecto: { inicio: { tabla: 10, tronco: 4 } } },
  flechas: { tipo: 'arranque', nombre: 'Carcaj lleno', texto: 'Empezás con 20 flechas.', costo: 1, efecto: { inicio: { flechas: 20 } } },
  trampa: { tipo: 'arranque', nombre: 'Trampa de miel lista', texto: 'Una trampa de miel ya armada cerca de la base, y dos frascos de miel.', costo: 1, efecto: { inicio: { trampa: 1, miel: 2 } } },
  perro: { tipo: 'aliados', nombre: 'Perro de pelea', texto: 'El perro muerde un 50 % más fuerte.', costo: 1, efecto: { perro: 1.5 } },
  vecino: { tipo: 'aliados', nombre: 'Anselmo ya te conoce', texto: 'Anselmo arranca ayudando (nivel 1) desde la primera noche grande.', costo: 1, efecto: { ayuda: { anselmo: 1 } } },
  herrero: { tipo: 'aliados', nombre: 'Manos livianas', texto: 'Anselmo repara más ligero: hace menos pausa entre arreglo y arreglo.', costo: 1, efecto: { anselmoPausa: 0.7 } },
  chicos: { tipo: 'aliados', nombre: 'Buena puntería', texto: 'Los chicos tiran con la honda más seguido y pegan más fuerte.', costo: 1, efecto: { chicos: { cadencia: 0.8, dano: 1.4 } } },
  salud: { tipo: 'personaje', nombre: 'Buen estado', texto: '+15 de salud máxima.', costo: 1, efecto: { bonos: { saludMax: 15 } } },
  correr: { tipo: 'personaje', nombre: 'Piernas de monte', texto: 'Corrés un 8 % más rápido.', costo: 1, efecto: { bonos: { correr: 0.08 } } },
  recarga: { tipo: 'personaje', nombre: 'Manos ligeras', texto: 'Recargás y volvés a golpear un 10 % más rápido.', costo: 1, efecto: { bonos: { recarga: 0.1 } } },
  filo: { tipo: 'costo', nombre: 'Filo de riesgo', texto: '+25 % de daño, pero 30 de salud máxima menos.', costo: 0, mult: 0.2, efecto: { bonos: { dano: 0.25, saludMax: -30 } } },
  avaro: { tipo: 'costo', nombre: 'Manos llenas', texto: 'Juntás la mitad más de troncos y piedras, pero las noches duran un tercio más.', costo: 0, mult: 0.15, efecto: { materiales: 1.5, nochesLargas: true } },
};
export const CLAVES_VENTAJA = Object.keys(VENTAJAS);
export const MAX_VENTAJAS = 2;

export const REGLAS = {
  soloArco: { nombre: 'Sólo arco', texto: 'No se pueden usar otras armas que el arco (el martillo sigue sirviendo para reparar).', mult: 0.3 },
  sinAliados: { nombre: 'Sin aliados', texto: 'Ni vecinos, ni Don Ramón, ni Josefina, ni el perro: estás solo.', mult: 0.25 },
  nochesLargas: { nombre: 'Noches más largas', texto: 'Cada noche dura un tercio más antes del alba.', mult: 0.2 },
  sinReparar: { nombre: 'Sin reparar', texto: 'Nada se arregla: ni vos con el martillo y el taller, ni Anselmo. Lo que cae, cae.', mult: 0.2 },
  sinEmplastos: { nombre: 'Sin emplastos', texto: 'No se pueden usar emplastos: sólo te cura dormir.', mult: 0.1 },
};
export const CLAVES_REGLA = Object.keys(REGLAS);

// Cosas que no se llevan bien juntas: [[ventaja o regla, ventaja o regla, por qué]].
export const INCOMPATIBLES = [
  ['sinAliados', 'perro', 'Sin aliados no hay perro'],
  ['sinAliados', 'vecino', 'Sin aliados no ayuda ningún vecino'],
  ['sinAliados', 'herrero', 'Sin aliados no hay Anselmo'],
  ['sinAliados', 'chicos', 'Sin aliados no hay chicos'],
  ['sinReparar', 'herrero', 'Sin reparar, Anselmo no arregla nada'],
  // 4.10.1: las dos alargan la noche un tercio, pero no se suman (sólo una vez): juntas pagaban puntos de más por nada
  ['nochesLargas', 'avaro', 'Las dos alargan la noche un tercio, pero no se suman: elegí una'],
];
// 4.11.0: con «Hora de tu reloj» la hora de la partida es la del reloj de verdad y no hay cómo alargar la noche: las dos cosas que la
// alargan (la regla y «Manos llenas») quedan apagadas en la pantalla de Nueva partida. Es sólo al empezar: una partida ya guardada con la
// combinación se carga igual (sanearMeta y efectosDe no la miran) y, con el reloj, la noche corre como siempre a la hora del reloj.
export const ALARGAN_LA_NOCHE = ['nochesLargas', 'avaro'];
export const MOTIVO_RELOJ = 'Con la hora de tu reloj no se pueden alargar las noches';
const motivoDeChoque = (a, b) => {
  for (const [x, y, m] of INCOMPATIBLES) if ((a === x && b === y) || (a === y && b === x)) return m;
  return null;
};

const redondear = (n) => Math.round(n * 100) / 100;
const lista = (v, validos, max) => (Array.isArray(v) ? [...new Set(v.filter((k) => typeof k === 'string' && Object.hasOwn(validos, k)))].slice(0, max) : []);

// Multiplicador de puntos de lo elegido: 1 más lo que suma cada regla y cada ventaja con costo.
export function multiplicadorDe(ventajas, reglas) {
  let m = 1;
  for (const k of lista(ventajas, VENTAJAS, MAX_VENTAJAS)) m += VENTAJAS[k].mult || 0;
  for (const k of lista(reglas, REGLAS, CLAVES_REGLA.length)) m += REGLAS[k].mult || 0;
  return redondear(m);
}

// ¿Se puede empezar con esta elección? `meta`: lo guardado entre partidas (semillas y desbloqueos).
// Devuelve { ok, motivo, costo, mult, ventajas, reglas, modo }.
export function validarEleccion(meta, eleccion = {}, entorno = {}) {
  const m = sanearMeta(meta);
  const modo = esModo(eleccion.modo) ? eleccion.modo : 'normal';
  const ventajas = lista(eleccion.ventajas, VENTAJAS, 99);
  const reglas = lista(eleccion.reglas, REGLAS, 99);
  const costo = ventajas.reduce((n, k) => n + VENTAJAS[k].costo, 0);
  const sal = { ok: false, motivo: '', costo, mult: multiplicadorDe(ventajas.slice(0, MAX_VENTAJAS), reglas), ventajas, reglas, modo };
  if (modo === 'pesadilla' && !m.desbloqueos.pesadilla) return { ...sal, motivo: 'La pesadilla se desbloquea al ganar la campaña una vez' };
  if (ventajas.length > MAX_VENTAJAS) return { ...sal, motivo: `Sólo se pueden elegir ${MAX_VENTAJAS} ventajas` };
  if (costo > m.semillas) return { ...sal, motivo: `Te faltan ${textoSemillas(costo - m.semillas)}` };
  const todas = [...ventajas, ...reglas];
  if (entorno?.relojReal && todas.some((k) => ALARGAN_LA_NOCHE.includes(k))) return { ...sal, motivo: MOTIVO_RELOJ };   // 4.11.0
  for (let i = 0; i < todas.length; i++) for (let j = i + 1; j < todas.length; j++) {
    const choque = motivoDeChoque(todas[i], todas[j]);
    if (choque) return { ...sal, motivo: choque };
  }
  return { ...sal, ok: true };
}

// 4.10.1: el número de la partida. Las semillas del Coihue se cobran una sola vez por número y se anota en lo guardado aparte
// (`cobradas`): con el flag `semillaDada` adentro de la partida, cada copia importada de la misma partida volvía a dar una.
export function idDePartida() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
const ID_OK = /^[a-z0-9]{6,24}$/;
export const TOPE_COBRADAS = 300;
// Lo que la partida se lleva de lo elegido: lo que se guarda en `d.meta`.
export function metaDePartida(eleccion = {}, modoFijo = null) {
  const modo = modoFijo && esModo(modoFijo) ? modoFijo : esModo(eleccion.modo) ? eleccion.modo : 'normal';
  const ventajas = lista(eleccion.ventajas, VENTAJAS, MAX_VENTAJAS);
  const reglas = lista(eleccion.reglas, REGLAS, CLAVES_REGLA.length);
  return { modo, ventajas, reglas, mult: multiplicadorDe(ventajas, reglas), aplicado: false, semillaDada: false, limpias: 0, lugaresCaidos: 0, final: null, id: idDePartida() };
}
const entero = (v, def, max) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && v !== null && v !== '' && typeof v !== 'boolean' ? Math.max(0, Math.min(max, n)) : def;
};
// Lo que carga una partida guardada: una vieja (sin `meta`) queda en null, que es el modo normal sin ventajas ni reglas.
export function sanearMetaPartida(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const base = metaDePartida({ modo: esModo(v.modo) ? v.modo : 'normal', ventajas: v.ventajas, reglas: v.reglas });
  return { ...base, id: typeof v.id === 'string' && ID_OK.test(v.id) ? v.id : '', aplicado: !!v.aplicado, semillaDada: !!v.semillaDada, limpias: entero(v.limpias, 0, 999), lugaresCaidos: entero(v.lugaresCaidos, 0, 99),
    final: typeof v.final === 'string' && Object.hasOwn(FINALES, v.final) ? v.final : null };
}
export const modoDe = (meta) => (meta && esModo(meta.modo) ? meta.modo : 'normal');
export const tieneRegla = (meta, k) => !!meta && Array.isArray(meta.reglas) && meta.reglas.includes(k);
export const tieneVentaja = (meta, k) => !!meta && Array.isArray(meta.ventajas) && meta.ventajas.includes(k);

// Todo lo que cambia en el juego por la elección. Una partida sin `meta` no cambia nada.
export function efectosDe(meta) {
  const e = { modo: modoDe(meta), cantidad: 1, dano: 1, vida: 1, nocheFinal: null, sinCaja: false, nieblaTope: 0,
    inicio: { tabla: 0, tronco: 0, flechas: 0, miel: 0, trampa: 0 }, ayuda: {}, perro: 1, anselmoPausa: 1, chicos: { cadencia: 1, dano: 1 },
    bonos: { saludMax: 0, correr: 0, recarga: 0, dano: 0, reparar: 0, alcance: 0 }, materiales: 1,
    nochesLargas: false, soloArco: false, sinAliados: false, sinReparar: false, sinEmplastos: false, mult: 1 };
  if (!meta) return e;
  const modo = MODOS[e.modo];
  if (modo.mult) { e.cantidad *= modo.mult.cantidad; e.dano *= modo.mult.dano; e.vida *= modo.mult.vida; }
  if (modo.nocheFinal) e.nocheFinal = modo.nocheFinal;
  if (modo.sinCaja) e.sinCaja = true;
  if (modo.nieblaTope) e.nieblaTope = modo.nieblaTope;
  for (const k of lista(meta.ventajas, VENTAJAS, MAX_VENTAJAS)) {
    const f = VENTAJAS[k].efecto;
    if (f.inicio) for (const [c, n] of Object.entries(f.inicio)) e.inicio[c] += n;
    if (f.ayuda) for (const [c, n] of Object.entries(f.ayuda)) e.ayuda[c] = Math.max(e.ayuda[c] || 0, n);
    if (f.perro) e.perro *= f.perro;
    if (f.anselmoPausa) e.anselmoPausa *= f.anselmoPausa;
    if (f.chicos) { e.chicos.cadencia *= f.chicos.cadencia; e.chicos.dano *= f.chicos.dano; }
    if (f.bonos) for (const [c, n] of Object.entries(f.bonos)) e.bonos[c] += n;
    if (f.materiales) e.materiales *= f.materiales;
    if (f.nochesLargas) e.nochesLargas = true;
  }
  for (const k of lista(meta.reglas, REGLAS, CLAVES_REGLA.length)) {
    if (k === 'soloArco') e.soloArco = true;
    else if (k === 'sinAliados') e.sinAliados = true;
    else if (k === 'nochesLargas') e.nochesLargas = true;
    else if (k === 'sinReparar') e.sinReparar = true;
    else if (k === 'sinEmplastos') e.sinEmplastos = true;
  }
  // sin aliados no hay ayuda inicial de nadie
  if (e.sinAliados) e.ayuda = {};
  e.cantidad = redondear(e.cantidad); e.dano = redondear(e.dano); e.vida = redondear(e.vida);
  e.mult = multiplicadorDe(meta.ventajas, meta.reglas);
  return e;
}
// Cuánto más lenta corre la hora de noche con «noches más largas» (un tercio más de noche).
export const FACTOR_NOCHE_LARGA = 0.75;

// La noche especial de la pesadilla: más niebla. Se pide después de la tirada de siempre (`nocheEspecial`): con el mismo azar
// (así el pronóstico y la noche coinciden), lo que en la campaña caía en «sin especial» entre `base` y `nieblaTope` es niebla.
export function nieblaDePesadilla(meta, azar, baseTotal, yaEspecial) {
  if (yaEspecial || modoDe(meta) !== 'pesadilla') return yaEspecial || null;
  const tope = MODOS.pesadilla.nieblaTope;
  const a = Number.isFinite(Number(azar)) ? Number(azar) : 1;
  return a > baseTotal && a <= tope ? 'niebla' : null;
}

// ---------------------------------------------------------------- los puntos y los récords
// (noches * 100 + abatidos + 1000 si se ganó) * multiplicador. El multiplicador sale de las reglas y las ventajas con costo.
export function puntosDe({ noches = 0, abatidos = 0, victoria = false, mult = 1 } = {}) {
  const n = Math.max(0, Math.min(1e6, Math.floor(Number(noches) || 0))), a = Math.max(0, Math.min(1e6, Math.floor(Number(abatidos) || 0)));
  const m = Number.isFinite(Number(mult)) ? Math.max(1, Math.min(10, Number(mult))) : 1;
  return Math.round((n * 100 + a + (victoria ? 1000 : 0)) * m);
}
export const TOPE_RECORDS = 10;
function sanearEntrada(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(r.fecha || '')) ? String(r.fecha) : '';
  return { puntos: entero(r.puntos, 0, 1e9), noches: entero(r.noches, 0, 1e6), abatidos: entero(r.abatidos, 0, 1e6), victoria: !!r.victoria,
    mult: Math.max(1, Math.min(10, Number.isFinite(Number(r.mult)) ? redondear(Number(r.mult)) : 1)), fecha, codigo: normalizarCodigo(r.codigo) };
}
const mejorQue = (a, b) => b.puntos - a.puntos || b.noches - a.noches || (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);
const ordenar = (v) => (Array.isArray(v) ? v : []).slice(0, 200).map(sanearEntrada).filter(Boolean).sort(mejorQue).slice(0, TOPE_RECORDS);

// ---------------------------------------------------------------- lo que se guarda entre partidas
export function metaNueva() {
  return { v: 1, semillas: 0, ganadas: 0, partidas: 0, victorias: 0, desbloqueos: { pesadilla: false }, finales: [], cobradas: [],
    records: Object.fromEntries(CLAVES_MODO.map((k) => [k, []])) };
}
export function sanearMeta(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const base = metaNueva();
  const rec = x.records && typeof x.records === 'object' && !Array.isArray(x.records) ? x.records : {};
  const ganadas = entero(x.ganadas, 0, 1e6);
  const victorias = entero(x.victorias, 0, 1e6);
  return {
    ...base,
    semillas: Math.min(entero(x.semillas, 0, SEMILLAS.tope), SEMILLAS.tope),
    ganadas, partidas: entero(x.partidas, 0, 1e6), victorias,
    // ganar la campaña una vez desbloquea la pesadilla (anotarVictoria) y ya no se pierde
    desbloqueos: { pesadilla: !!(x.desbloqueos && x.desbloqueos.pesadilla) },
    finales: lista(x.finales, FINALES, 99),
    cobradas: Array.isArray(x.cobradas) ? [...new Set(x.cobradas.filter((s) => typeof s === 'string' && ID_OK.test(s)))].slice(-TOPE_COBRADAS) : [],   // 4.10.1
    records: Object.fromEntries(CLAVES_MODO.map((k) => [k, ordenar(Object.hasOwn(rec, k) ? rec[k] : [])])),
  };
}
// Gana la semilla de la partida que terminó (si corresponde) y la cuenta. Devuelve { meta, semilla } sin tocar el original.
export function terminarPartida(meta, { noches = 0, yaDada = false } = {}) {
  const m = sanearMeta(meta);
  const gana = semillaPorPartida({ noches, yaDada });
  if (!yaDada) m.partidas = Math.min(1e6, m.partidas + 1);
  if (gana) { m.semillas = Math.min(SEMILLAS.tope, m.semillas + gana); m.ganadas += gana; }
  return { meta: m, semilla: gana };
}
// Ganar la campaña (o la pesadilla) desbloquea la pesadilla. Se anota aparte porque la partida corta no cuenta.
export function anotarVictoria(meta, modo) {
  const m = sanearMeta(meta);
  m.victorias = Math.min(1e6, m.victorias + 1);
  if (modo === 'normal' || modo === 'pesadilla') m.desbloqueos = { ...m.desbloqueos, pesadilla: true };
  return m;
}
// Gasta las semillas de la elección ya validada. Devuelve la meta nueva (o null si no alcanza).
export function gastarSemillas(meta, costo) {
  const m = sanearMeta(meta);
  const c = Math.max(0, Math.floor(Number(costo) || 0));
  if (c > m.semillas) return null;
  m.semillas -= c;
  return m;
}
// Anota los puntos de una partida en el récord de su modo. Devuelve { meta, puesto } (0 si no entró entre los diez).
export function registrarPuntos(meta, modo, entrada) {
  const m = sanearMeta(meta);
  const k = esModo(modo) ? modo : 'normal';
  const e = sanearEntrada(entrada);
  if (!e) return { meta: m, puesto: 0 };
  const l = [...m.records[k], e].sort(mejorQue);
  const puesto = l.indexOf(e);
  m.records[k] = l.slice(0, TOPE_RECORDS);
  return { meta: m, puesto: puesto < TOPE_RECORDS ? puesto + 1 : 0 };
}
export function anotarFinal(meta, id) {
  const m = sanearMeta(meta);
  if (Object.hasOwn(FINALES, id) && !m.finales.includes(id)) m.finales.push(id);
  return m;
}

// ---------------------------------------------------------------- guardar y leer (con respaldo)
export const CLAVE_META = 'hojarasca-meta-v1';
export const CLAVE_META_COPIA = 'hojarasca-meta-v1-copia';
// `almacen`: algo con getItem/setItem (localStorage). Si el principal está roto, se usa la copia; si no hay nada, meta nueva.
export function leerMeta(almacen) {
  for (const clave of [CLAVE_META, CLAVE_META_COPIA]) {
    try {
      const crudo = almacen?.getItem?.(clave);
      if (!crudo) continue;
      const v = JSON.parse(crudo);
      if (v && typeof v === 'object' && !Array.isArray(v)) return sanearMeta(v);
    } catch { /* se prueba con la copia */ }
  }
  return metaNueva();
}
// Escribe la copia primero y después el principal: si algo falla a la mitad, una de las dos sigue entera. Devuelve si pudo.
export function guardarMeta(almacen, meta) {
  let texto;
  try { texto = JSON.stringify(sanearMeta(meta)); } catch { return false; }
  let ok = false;
  try { almacen.setItem(CLAVE_META_COPIA, texto); ok = true; } catch { /* sigue */ }
  try { almacen.setItem(CLAVE_META, texto); ok = true; } catch { /* sigue */ }
  return ok;
}

// ---------------------------------------------------------------- los finales
// Cuatro, según cómo jugaste. Prioridad: si la base cayó, «ceniza»; si ayudó casi toda la aldea y no se perdió ningún
// lugar, «aldea»; si casi nadie ayudó, «solitario»; el resto, «valle» (con una línea más si las noches fueron limpias).
export const FINALES = {
  ceniza: { nombre: 'Entre las cenizas' },
  aldea: { nombre: 'La aldea entera' },
  solitario: { nombre: 'El guardián solo' },
  valle: { nombre: 'El valle respira' },
};
export const CLAVES_FINAL = Object.keys(FINALES);
export const AYUDARON_PARA_ALDEA = 3;
export const AYUDARON_SOLO = 1;
// `estado`: { ayudaron (vecinos con nivel > 0), baseCayo, lugaresCaidos, limpias, noches }
export function elegirFinal(estado = {}) {
  const ayudaron = Math.max(0, Math.floor(Number(estado.ayudaron) || 0));
  if (estado.baseCayo) return 'ceniza';
  if (ayudaron >= AYUDARON_PARA_ALDEA && !(Number(estado.lugaresCaidos) > 0)) return 'aldea';
  if (ayudaron <= AYUDARON_SOLO) return 'solitario';
  return 'valle';
}
// ¿Las noches fueron limpias (sin perder defensas) casi siempre?
export function nochesLimpias(estado = {}) {
  const noches = Math.max(0, Math.floor(Number(estado.noches) || 0));
  return noches >= 5 && Math.floor(Number(estado.limpias) || 0) >= Math.ceil(noches * 0.7);
}
// Cuántos vecinos ayudan (nivel mayor a 0), leídos de la aldea de la 4.9 (`d.aldea.ayuda`).
export function vecinosQueAyudaron(d) {
  const a = d?.aldea?.ayuda;
  if (!a || typeof a !== 'object') return 0;
  if (tieneRegla(d?.meta, 'sinAliados')) return 0;   // 4.10.1: con «sin aliados» nadie ayudó (y el final no puede ser «La aldea entera»)
  return ['anselmo', 'herminia', 'martin', 'chicos'].filter((k) => Object.hasOwn(a, k) && Number(a[k]) > 0).length;
}
export function estadoDeFinal(d) {
  const meta = d?.meta || null;
  return { ayudaron: vecinosQueAyudaron(d), baseCayo: (Number(d?.derrotas) || 0) > 0, lugaresCaidos: meta?.lugaresCaidos || 0, limpias: meta?.limpias || 0, noches: Number(d?.noches) || 0 };
}

// El texto de cada final. `modo`: 'corta' tiene los suyos (el mandamás, sin cueva); los demás, los de la campaña.
const TEXTO_FINAL = {
  campana: {
    ceniza: 'Ganaste, pero a costa de mucho: la base se vino abajo más de una vez y cada vez la levantaste a mano, entre cenizas y astillas. El Coihue cayó con vos todavía de pie, y eso ya es bastante.',
    aldea: 'Cuando el Coihue se vino abajo, el valle entero estaba con vos: Anselmo, la abuela Herminia, Martín y los chicos habían estado en cada noche grande, y ninguna casa quedó sin su luz. Eso no se gana solo.',
    solitario: 'Lo hiciste casi solo. Los vecinos miraban desde lejos, con las luces apagadas, y vos aguantaste noche tras noche con lo que tenías. Cuando cayó el Coihue no había nadie para festejar, pero el bosque lo vio.',
    valle: 'El Coihue cayó y el valle respira. Algunos vecinos te dieron una mano, otros no se animaron: así es la gente. La base quedó en pie y vos también.',
  },
  corta: {
    ceniza: 'Cayó el mandamás, pero la base casi no lo cuenta: se vino abajo y la levantaste con lo que quedaba. Siete noches largas que se sintieron como veinte.',
    aldea: 'Cayó el mandamás y el valle salió a las puertas: en sólo siete noches la aldea entera se juntó alrededor de tu fuego. Pocas veces un valle se une tan rápido.',
    solitario: 'Cayó el mandamás y no hubo a quién contárselo: nadie salió a ayudarte en estas siete noches. Te quedó la base entera y el silencio del bosque, que no es poco.',
    valle: 'Cayó el mandamás al alba de la séptima noche. Quedó la base en pie y una tarde bien aprovechada.',
  },
};
const CIERRE_NOCHES_LIMPIAS = ' Y las noches fueron limpias: casi ninguna se llevó una sola defensa.';
export function textoFinal(id, modo = 'normal', limpias = false) {
  const tabla = modo === 'corta' ? TEXTO_FINAL.corta : TEXTO_FINAL.campana;
  const t = tabla[Object.hasOwn(tabla, id) ? id : 'valle'];
  return limpias && id !== 'ceniza' ? t + CIERRE_NOCHES_LIMPIAS : t;
}
// La línea de epílogo del cierre de la cueva (la pantalla de «Se derrumbó la cueva»).
const EPILOGO = {
  ceniza: 'Lo que se quemó se reconstruye; lo que aprendiste, no se pierde.',
  aldea: 'En la aldea ya cuentan que el valle se defendió entero.',
  solitario: 'Quizás la próxima vez alguien se anime a salir con vos.',
  valle: 'El bosque se encarga del resto.',
};
export const epilogoFinal = (id) => EPILOGO[Object.hasOwn(EPILOGO, id) ? id : 'valle'];

// Cuaderno: «Finales vistos 2 de 4» y cuáles.
export function resumenFinales(meta) {
  const m = sanearMeta(meta);
  return { vistos: m.finales.length, total: CLAVES_FINAL.length, lista: CLAVES_FINAL.map((k) => ({ id: k, nombre: FINALES[k].nombre, visto: m.finales.includes(k) })) };
}

// ---------------------------------------------------------------- textos para las pantallas
export const textoMult = (m) => `×${String(redondear(m)).replace('.', ',')}`;
export function lineaRecordMeta(r, i) {
  return `${i + 1}. ${r.puntos} puntos · ${r.noches} ${r.noches === 1 ? 'noche' : 'noches'} · ${r.abatidos} abatidos${r.victoria ? ' · ganada' : ''}${r.mult > 1 ? ` · ${textoMult(r.mult)}` : ''}${r.fecha ? ` · ${r.fecha}` : ''}`;
}
