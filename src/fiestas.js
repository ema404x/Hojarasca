// 3.7.5 (fiestas): las tradiciones de la aldea (PLAN_3_7.md, «3.7.5 — Tradiciones»): el calendario de fechas, lo que
// pasa en cada una y lo que queda guardado. Módulo puro (sin three ni DOM: se prueba en Node). Lo pone en el juego
// fiestas-juego.js y lo dibuja fiestas-mundo.js.
//
// El año del juego tiene doce días (aldea.js, `DIAS_ANIO`): cuatro de verano (1 a 4), cuatro de otoño (5 a 8) y cuatro
// de invierno (9 a 12). En él caen:
//   · las fiestas de cada estación (la Fruta Fina en verano, la Cosecha en otoño, la Nieve en invierno), con mesa
//     larga, juegos, jineteada y baile, cada una con su música (chamamé, loncomeo, folklore del sur), invitados de
//     otras paradas que llegan en un tren de fiesta y un recuerdo para colgar;
//   · el Día de la Aldea (el día que paró el primer tren), las dos fechas patrias (25 de Mayo y 9 de Julio, con
//     locro y peña), la minga (trabajo de todos que deja algo hecho), la noche de la leyenda (un fogón con una
//     leyenda patagónica; nada religioso);
//   · y las que no son de calendario fijo: la gran nevada (la nevada solidaria), tu cumpleaños (fiesta sorpresa) y
//     los 90 de la abuela Herminia (aldea.js ya los festeja: acá se suma la mesa y el recuerdo).
// Nada religioso (ni Navidad, ni santos patronos, ni misas), sin economía nueva, sólo en el Relax.
//
// Todo lo que el usuario puede querer cambiar está en constantes (FECHAS, PROGRAMAS, MUSICA_DE, INVITADOS,
// RECUERDOS, MINGAS, LEYENDAS, JINETEADA, BAILES, CUMPLE_JUGADOR, DIAS_NEVADA, INVITADOS_POR_RITMO).
//
// Para los otros equipos de la 3.7.5:
//   · `FECHAS` (las del calendario fijo) y `fechaDe(dia, opciones)` → { id, nombre, tipo } | null (la principal del
//     día; `fechasDelDia` las da todas);
//   · `actividadesDeFiesta(id)` → lo que se hace en esa fiesta (las propias y las registradas), y
//     `actividadesDeFiesta.registrar(fiesta, actividad)` (o `registrarActividad`): «noticias» suma ahí los concursos;
//   · `cargarFiestasEnCalendario(lista)`: las pone en FIESTAS_ALDEA de aldea-vida.js (el calendario del cuaderno, el
//     aviso del día antes). Lo llama fiestas-juego.js una vez: no hace falta sumarlas de nuevo.
import { DIAS_ANIO, diaDelAnio, num, azar } from './aldea.js';
import { estacionDelAnio } from './aldea-vida.js';

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, d = 0) => (Number.isFinite(num(v)) ? Math.floor(num(v)) : d);
const diaValido = (v, d = 1) => Math.max(1, entero(v, d));
const horaNorm = (h) => ((((Number.isFinite(num(h)) ? num(h) : 12) % 24) + 24) % 24);
export const anioDe = (dia) => Math.floor((diaValido(dia) - 1) / DIAS_ANIO) + 1;

export const VERSION_FIESTAS = 1;

// ---------------------------------------------------------------- el calendario fijo
// `diaDelAnio`: 1 a 12. `programa`: las fases del día (PROGRAMAS). `musica`: la de la fiesta (MUSICAS). `lugar`: el
// predio de la fiesta (al lado de la estación, del otro lado de la calle de la vía) o la plaza. `invitados`: llegan en
// el tren de fiesta. `actividades`: lo que se hace (ACTIVIDADES). `concursos`: «noticias» puede sumar los suyos.
export const FECHAS = [
  { id: 'fruta-fina', nombre: 'Fiesta de la Fruta Fina', tipo: 'estacion', estacion: 'verano', diaDelAnio: 2, programa: 'estacion', musica: 'chamame', lugar: 'predio', invitados: true, concursos: true,
    actividades: ['mesa-larga', 'juegos', 'jineteada', 'baile', 'truco', 'taba'],
    texto: 'La fiesta del verano: frambuesas, cerezas y grosellas, cordero al asador, jineteada y baile con chamamé hasta la noche.' },
  { id: 'dia-aldea', nombre: 'Día de la Aldea', tipo: 'aldea', diaDelAnio: 4, programa: 'aldea', musica: 'sur', lugar: 'predio', invitados: true,
    actividades: ['acto', 'mesa-larga', 'juegos', 'baile', 'truco', 'taba'],
    texto: 'El día que paró el primer tren en la aldea: Ernesto iza la bandera, hay torta para todos y baile a la noche.' },
  { id: 'cosecha', nombre: 'Fiesta de la Cosecha', tipo: 'estacion', estacion: 'otono', diaDelAnio: 6, programa: 'estacion', musica: 'loncomeo', lugar: 'predio', invitados: true, concursos: true,
    actividades: ['mesa-larga', 'juegos', 'jineteada', 'baile', 'truco', 'taba'],
    texto: 'La fiesta del otoño: lo juntado en el año sobre la mesa larga, curanto, jineteada y loncomeo al caer la tarde.' },
  { id: 'minga', nombre: 'La minga', tipo: 'minga', diaDelAnio: 7, programa: 'minga', musica: 'chamame', lugar: 'predio',
    actividades: ['minga', 'mesa-larga'],
    texto: 'Trabajo de todos antes del invierno: a la mañana se hace la obra del año y después se come juntos.' },
  { id: '25-mayo', nombre: '25 de Mayo', tipo: 'patria', diaDelAnio: 8, programa: 'patria', musica: 'chacarera', lugar: 'predio',
    actividades: ['acto', 'mesa-larga', 'baile', 'truco'],
    texto: 'Escarapelas, el acto en el mástil de la plaza, locro y pastelitos al mediodía y peña con chacarera a la tarde.' },
  { id: 'leyenda', nombre: 'Noche de la Leyenda', tipo: 'leyenda', diaDelAnio: 9, programa: 'leyenda', musica: null, lugar: 'predio',
    actividades: ['leyenda'],
    texto: 'La noche más larga, alrededor del fogón del predio: alguien de la aldea cuenta una leyenda del sur.' },
  { id: '9-julio', nombre: '9 de Julio', tipo: 'patria', diaDelAnio: 11, programa: 'patria', musica: 'chacarera', lugar: 'predio',
    actividades: ['acto', 'mesa-larga', 'baile', 'truco'],
    texto: 'El Día de la Independencia: el acto en la plaza, locro y chocolate caliente, y peña a la tarde.' },
  { id: 'nieve', nombre: 'Fiesta de la Nieve', tipo: 'estacion', estacion: 'invierno', diaDelAnio: 12, programa: 'estacion', musica: 'sur', lugar: 'predio', invitados: true, concursos: true,
    actividades: ['mesa-larga', 'juegos', 'baile', 'truco', 'taba'],
    texto: 'La fiesta del invierno: chocolate y locro en la mesa larga, juegos en la nieve y folklore del sur al lado del fogón.' },
];
export const IDS_FECHAS = FECHAS.map((f) => f.id);
const FECHA = Object.fromEntries(FECHAS.map((f) => [f.id, f]));
export const fechaPorId = (id) => (typeof id === 'string' && Object.hasOwn(FECHA, id) ? FECHA[id] : Object.hasOwn(DINAMICAS, id || '') ? DINAMICAS[id] : null);

// Las que no caen siempre el mismo día (o no todos los años)
export const DINAMICAS = {
  nevada: { id: 'nevada', nombre: 'La gran nevada', tipo: 'nevada', programa: 'nevada', musica: null, lugar: 'aldea', actividades: ['nevada'],
    texto: 'Nevó como hace años no nevaba: la aldea sale con palas y leña para los que viven solos.' },
  'cumple-jugador': { id: 'cumple-jugador', nombre: 'Tu cumpleaños', tipo: 'cumple-jugador', programa: 'cumple-jugador', musica: 'chamame', lugar: 'predio', actividades: ['sorpresa', 'mesa-larga', 'baile'],
    texto: 'Tus amigos de la aldea te preparan algo. No digas que te contamos.' },
  noventa: { id: 'noventa', nombre: 'Los 90 de la abuela Herminia', tipo: 'noventa', programa: 'noventa', musica: 'sur', lugar: 'plaza', actividades: ['mesa-larga'],
    texto: 'Toda la aldea en la plaza: torta con noventa velitas (que no entran) y la abuela contando cómo era todo antes.' },
};
// Tu cumpleaños: qué día del año (de 1 a 12). Se puede cambiar en el cuaderno (fiestas-juego.js, `elegirCumple`).
export const CUMPLE_JUGADOR = 3;
// Para la fiesta sorpresa hacen falta amigos: si todavía no tenés, ese día te llega una carta de tu mamá.
export const AMIGOS_PARA_SORPRESA = 2;
// La gran nevada: un día de invierno por año (sale de la semilla de la partida), y sólo si es invierno de verdad
// (con la estación fija en verano no nieva).
export const DIAS_NEVADA = [9, 10];
export function diaNevada(anio, semilla = 1) {
  return DIAS_NEVADA[Math.floor(azar(entero(semilla, 1) * 31 + entero(anio, 1) * 977) * DIAS_NEVADA.length) % DIAS_NEVADA.length];
}

// ---------------------------------------------------------------- el programa de cada día
// Cada fase: { fase, desde, hasta } (horas del juego). Lo que hace cada uno en cada fase lo dice fiestas-juego.js.
export const PROGRAMAS = {
  estacion: [
    { fase: 'llegada', desde: 10, hasta: 12 },   // el tren de fiesta trae a los invitados; se prende el fuego
    { fase: 'mesa', desde: 12, hasta: 14.5 },     // la mesa larga
    { fase: 'juegos', desde: 14.5, hasta: 17.5 }, // la jineteada, la taba, el truco
    { fase: 'baile', desde: 17.5, hasta: 21.5 },  // la música y el baile
  ],
  aldea: [
    { fase: 'acto', desde: 10.5, hasta: 11.5 }, { fase: 'mesa', desde: 12, hasta: 14.5 },
    { fase: 'juegos', desde: 14.5, hasta: 17 }, { fase: 'baile', desde: 18, hasta: 21 },
  ],
  patria: [{ fase: 'acto', desde: 10, hasta: 11 }, { fase: 'mesa', desde: 12, hasta: 14.5 }, { fase: 'baile', desde: 17, hasta: 20 }],
  minga: [{ fase: 'trabajo', desde: 9, hasta: 13 }, { fase: 'mesa', desde: 13, hasta: 15 }],
  leyenda: [{ fase: 'fogon', desde: 20, hasta: 23 }],
  nevada: [{ fase: 'palear', desde: 8, hasta: 16 }],
  'cumple-jugador': [{ fase: 'sorpresa', desde: 18, hasta: 21 }],
  noventa: [{ fase: 'mesa', desde: 18, hasta: 20 }],
};
export function programaDe(fecha) {
  const f = typeof fecha === 'string' ? fechaPorId(fecha) : fecha;
  return f && Object.hasOwn(PROGRAMAS, f.programa || '') ? PROGRAMAS[f.programa] : [];
}
// La fase de ahora (o null): { fase, desde, hasta }
export function faseDe(fecha, hora) {
  const h = horaNorm(hora);
  return programaDe(fecha).find((p) => h >= p.desde && h < p.hasta) || null;
}
// De cuándo a cuándo dura (para el aviso y el calendario)
export function horarioDe(fecha) {
  const p = programaDe(fecha);
  return p.length ? { desde: p[0].desde, hasta: p[p.length - 1].hasta } : null;
}
export const textoHora = (h) => { const x = horaNorm(h); const m = Math.round((x % 1) * 60); return `${Math.floor(x)}${m ? `:${String(m).padStart(2, '0')}` : ''}`; };

// ---------------------------------------------------------------- las fechas de un día
// `opciones`: { estado (progreso.fiestas), aldea (para los 90 de la abuela: `noventa` ya resuelto, o una función),
// semilla (la de la partida, para la nevada), invierno (¿es invierno de verdad ese día?), amigos (cuántos amigos
// tenés en la aldea), noventa (bool) }. Devuelve las fechas del día con su año: [{ ...fecha, anio, dia }], la grande
// primero.
const PRIORIDAD = { estacion: 0, aldea: 1, patria: 2, noventa: 3, 'cumple-jugador': 4, minga: 5, leyenda: 6, nevada: 7 };
export function fechasDelDia(dia, opciones = {}) {
  const d = diaValido(dia), dda = diaDelAnio(d), anio = anioDe(d);
  const lista = [];
  for (const f of FECHAS) if (f.diaDelAnio === dda && anio >= (f.desdeAnio || 1)) lista.push({ ...f, anio, dia: d });
  if (opciones.invierno && diaNevada(anio, opciones.semilla) === dda) lista.push({ ...DINAMICAS.nevada, diaDelAnio: dda, anio, dia: d });
  const est = objeto(opciones.estado) ? opciones.estado : null;
  const cumple = cumpleDelJugador(est);
  if (cumple === dda) {
    // (sin amigos no hay sorpresa: queda la fecha, sin fiesta; ver `hayFiestaSorpresa`)
    lista.push({ ...DINAMICAS['cumple-jugador'], diaDelAnio: dda, anio, dia: d, sorpresa: (entero(opciones.amigos) >= AMIGOS_PARA_SORPRESA) });
  }
  if (opciones.noventa === true) lista.push({ ...DINAMICAS.noventa, diaDelAnio: dda, anio, dia: d });
  return lista.sort((a, b) => (PRIORIDAD[a.tipo] ?? 9) - (PRIORIDAD[b.tipo] ?? 9));
}
// La fecha principal del día: { id, nombre, tipo } (y el resto de la fecha) o null.
export function fechaDe(dia, opciones = {}) {
  const l = fechasDelDia(dia, opciones);
  return l.length ? l[0] : null;
}
// La que manda a esta hora (la que tiene una fase ahora, la grande primero): { fecha, fase } o null
export function fiestaDeAhora(dia, hora, opciones = {}) {
  for (const f of fechasDelDia(dia, opciones)) {
    if (f.tipo === 'cumple-jugador' && !f.sorpresa) continue;
    const fase = faseDe(f, hora);
    if (fase) return { fecha: f, fase };
  }
  return null;
}
export const cumpleDelJugador = (estado) => { const c = entero(estado?.cumple, CUMPLE_JUGADOR); return c >= 1 && c <= DIAS_ANIO ? c : CUMPLE_JUGADOR; };
export const hayFiestaSorpresa = (dia, opciones = {}) => fechasDelDia(dia, opciones).some((f) => f.tipo === 'cumple-jugador' && f.sorpresa);

// Las del calendario del cuaderno (la forma de FIESTAS_ALDEA de aldea-vida.js: { id, nombre, diaDelAnio, texto }).
// Tu cumpleaños también va (el día que elegiste). La nevada no: es el tiempo.
export function fiestasDelCalendario(estado = null) {
  const lista = FECHAS.map((f) => ({ id: f.id, nombre: f.nombre, diaDelAnio: f.diaDelAnio, texto: `${f.nombre}. ${f.texto}` }));
  lista.push({ id: 'cumple-jugador', nombre: 'Tu cumpleaños', diaDelAnio: cumpleDelJugador(estado), texto: 'Tu cumpleaños' });
  return lista;
}
// Las pone en la lista del calendario (FIESTAS_ALDEA): reemplaza las que ya estaban con el mismo id (si cambiaste
// tu cumpleaños, se mueve). Devuelve cuántas quedaron.
export function cargarFiestasEnCalendario(lista, estado = null) {
  if (!Array.isArray(lista)) return 0;
  const nuevas = fiestasDelCalendario(estado);
  const ids = new Set(nuevas.map((f) => f.id));
  for (let i = lista.length - 1; i >= 0; i--) if (ids.has(lista[i]?.id)) lista.splice(i, 1);
  lista.push(...nuevas);
  return nuevas.length;
}

// ---------------------------------------------------------------- lo que se hace (y lo que suman otros equipos)
export const ACTIVIDADES = {
  'mesa-larga': { id: 'mesa-larga', nombre: 'La mesa larga', fase: 'mesa', lugar: 'predio', texto: 'Sentarse a comer con toda la aldea.' },
  juegos: { id: 'juegos', nombre: 'Los juegos', fase: 'juegos', lugar: 'predio', texto: 'La taba, el truco, el chinchón y las damas.' },
  jineteada: { id: 'jineteada', nombre: 'La jineteada', fase: 'juegos', lugar: 'predio', texto: 'Aguantar el tiempo arriba de un redomón, con los apadrinadores al lado.' },
  baile: { id: 'baile', nombre: 'El baile', fase: 'baile', lugar: 'predio', texto: 'La música en la tarima y el baile en la pista de tablas.' },
  truco: { id: 'truco', nombre: 'Un truco', fase: null, lugar: 'predio', texto: 'Un partido de truco con un vecino (a 15 puntos).' },
  taba: { id: 'taba', nombre: 'La taba', fase: 'juegos', lugar: 'predio', texto: 'Tirar la taba: suerte gana, culo pierde.' },
  acto: { id: 'acto', nombre: 'El acto', fase: 'acto', lugar: 'plaza', texto: 'Ernesto iza la bandera en el mástil de la plaza.' },
  minga: { id: 'minga', nombre: 'La minga', fase: 'trabajo', lugar: 'predio', texto: 'Dar una mano en la obra del año.' },
  leyenda: { id: 'leyenda', nombre: 'La leyenda', fase: 'fogon', lugar: 'predio', texto: 'Escuchar la leyenda al lado del fogón.' },
  nevada: { id: 'nevada', nombre: 'La nevada solidaria', fase: 'palear', lugar: 'aldea', texto: 'Palear la nieve de las puertas y llevar leña a los que viven solos.' },
  sorpresa: { id: 'sorpresa', nombre: 'La sorpresa', fase: 'sorpresa', lugar: 'predio', texto: 'Tu fiesta de cumpleaños.' },
};
// Las registradas por otros módulos (los concursos de «noticias»): { fiesta: id | tipo | '*', actividad }
const REGISTRADAS = [];
// Suma una actividad a una fiesta (por id: 'fruta-fina'; por tipo: 'estacion'; o '*' a todas). `actividad`: { id,
// nombre, texto?, fase? ('mesa' | 'juegos' | 'baile' | …), lugar?, hora? [desde, hasta], quien? }. Si ya había una con
// el mismo id para la misma fiesta, la reemplaza. Devuelve true si quedó.
export function registrarActividad(fiesta, actividad) {
  if (typeof fiesta !== 'string' || !fiesta || !objeto(actividad) || typeof actividad.id !== 'string' || !actividad.id) return false;
  const a = { ...actividad, nombre: typeof actividad.nombre === 'string' && actividad.nombre ? actividad.nombre : actividad.id, registrada: true };
  const i = REGISTRADAS.findIndex((r) => r.fiesta === fiesta && r.actividad.id === a.id);
  if (i >= 0) REGISTRADAS[i] = { fiesta, actividad: a }; else REGISTRADAS.push({ fiesta, actividad: a });
  return true;
}
export function quitarActividad(fiesta, id) {
  const i = REGISTRADAS.findIndex((r) => r.fiesta === fiesta && r.actividad.id === id);
  if (i >= 0) REGISTRADAS.splice(i, 1);
  return i >= 0;
}
// Lo que se hace en una fiesta (id o fecha): las propias (de ACTIVIDADES) y las registradas que le tocan.
export function actividadesDeFiesta(fiesta) {
  const f = typeof fiesta === 'string' ? fechaPorId(fiesta) : objeto(fiesta) ? fiesta : null;
  if (!f) return [];
  const propias = (f.actividades || []).filter((id) => Object.hasOwn(ACTIVIDADES, id)).map((id) => ({ ...ACTIVIDADES[id] }));
  const otras = REGISTRADAS.filter((r) => r.fiesta === '*' || r.fiesta === f.id || r.fiesta === f.tipo).map((r) => ({ ...r.actividad }));
  // (una registrada con el id de una propia la reemplaza)
  const ids = new Set(otras.map((a) => a.id));
  return [...propias.filter((a) => !ids.has(a.id)), ...otras];
}
actividadesDeFiesta.registrar = registrarActividad;
actividadesDeFiesta.quitar = quitarActividad;

// ---------------------------------------------------------------- la música
// Cada una: una melodía en la notación de personal-musica.js ("nota:tiempos"), los bajos por compás y lo que
// la acompaña (fiestas-mundo.js la toca con el motor de sonido: acordeón, guitarra, bombo legüero, quena).
// Son todas propias.
export const MUSICAS = {
  chamame: { nombre: 'chamamé', instrumento: 'acordeon', pulso: 168, compas: 3, ritmo: 'chamame', vueltas: 3,
    notas: 'A4:1 C#5:1 E5:1 F#5:2 E5:1 D5:1 C#5:1 B4:1 A4:3 B4:1 C#5:1 D5:1 E5:2 D5:1 C#5:1 B4:1 G#4:1 A4:3 E5:1 F#5:1 G#5:1 A5:2 G#5:1 F#5:1 E5:1 D5:1 C#5:3 D5:1 B4:1 G#4:1 E4:2 F#4:1 G#4:1 B4:1 G#4:1 A4:3',
    bajos: [45, 52, 45, 40, 45, 52, 40, 45, 45, 45, 50, 52, 50, 52, 40, 45] },
  loncomeo: { nombre: 'loncomeo', instrumento: 'guitarra', pulso: 132, compas: 4, ritmo: 'loncomeo', vueltas: 3,
    notas: 'D5:2 C5:1 A4:1 G4:2 A4:2 C5:1 D5:1 F5:2 E5:1 D5:1 C5:4 D5:2 C5:1 A4:1 G4:2 F4:2 G4:1 A4:1 C5:2 A4:1 G4:1 D4:4',
    bajos: [50, 48, 50, 45, 50, 53, 48, 50] },
  chacarera: { nombre: 'chacarera', instrumento: 'violin', pulso: 200, compas: 6, ritmo: 'chacarera', vueltas: 2,
    notas: 'A4:1 D5:1 E5:1 F5:2 E5:1 D5:2 C5:1 A4:3 G4:1 A4:1 C5:1 D5:2 C5:1 A4:2 G4:1 F4:3 A4:1 D5:1 E5:1 F5:2 G5:1 A5:2 G5:1 F5:3 E5:1 D5:1 C5:1 A4:2 C5:1 D5:6',
    bajos: [50, 45, 48, 50, 50, 45, 48, 50] },
  sur: { nombre: 'folklore del sur', instrumento: 'quena', pulso: 150, compas: 6, ritmo: 'sur', vueltas: 2,
    notas: 'D5:2 E5:1 F#5:2 A5:1 G5:2 F#5:1 E5:3 D5:2 E5:1 F#5:2 D5:1 B4:3 A4:3 A4:2 B4:1 D5:2 E5:1 F#5:2 G5:1 F#5:3 E5:2 D5:1 B4:2 A4:1 D5:6',
    bajos: [50, 43, 45, 50, 43, 45, 45, 50] },
};
export const ORDEN_MUSICAS = Object.keys(MUSICAS);
// La música de una fiesta (o null: la noche de la leyenda no tiene, es el fuego y la voz)
export const musicaDe = (fecha) => { const f = typeof fecha === 'string' ? fechaPorId(fecha) : fecha; return f?.musica && Object.hasOwn(MUSICAS, f.musica) ? f.musica : null; };
const SEMITONO = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// Los golpes de una música, en segundos desde que empieza: la melodía, los bajos y la percusión de cada ritmo.
// { eventos: [{ cuando, midi, dur, voz: 'melodia' | 'bajo' | 'bombo' | 'parche' | 'rasgueo' }], duracion, instrumento }
const cacheEventos = new Map();
export function eventosMusica(id) {
  if (cacheEventos.has(id)) return cacheEventos.get(id);
  const m = Object.hasOwn(MUSICAS, id) ? MUSICAS[id] : null;
  if (!m) return null;
  const seg = 60 / m.pulso;
  const notas = [];
  for (const parte of m.notas.trim().split(/\s+/)) {
    const x = /^(?:(R)|([A-G])(#|b)?(\d)):(\d+(?:\.\d+)?)$/.exec(parte);
    if (!x) continue;
    const t = Number(x[5]);
    notas.push({ midi: x[1] ? null : 12 * (Number(x[4]) + 1) + SEMITONO[x[2]] + (x[3] === '#' ? 1 : x[3] === 'b' ? -1 : 0), t });
  }
  const largo = notas.reduce((a, n) => a + n.t, 0) * seg;
  const compases = Math.ceil(notas.reduce((a, n) => a + n.t, 0) / m.compas);
  const ev = [];
  for (let v = 0; v < m.vueltas; v++) {
    const base = v * largo;
    let c = 0;
    for (const n of notas) { if (n.midi !== null) ev.push({ cuando: base + c * seg, midi: n.midi, dur: n.t * seg, voz: 'melodia' }); c += n.t; }
    for (let k = 0; k < compases; k++) {
      const b = m.bajos[k % m.bajos.length], t0 = base + k * m.compas * seg;
      if (b > 0) ev.push({ cuando: t0, midi: b, dur: m.compas * seg, voz: 'bajo' });
      // la percusión y el rasgueo de cada ritmo (en tiempos del compás)
      const golpes = RITMOS[m.ritmo] || [];
      for (const [t, voz] of golpes) if (t < m.compas) ev.push({ cuando: t0 + t * seg, midi: voz === 'rasgueo' ? b + 12 : 0, dur: seg * 0.5, voz });
    }
  }
  ev.sort((a, b) => a.cuando - b.cuando);
  const r = { eventos: ev, duracion: largo * m.vueltas, instrumento: m.instrumento, pulso: m.pulso };
  cacheEventos.set(id, r);
  return r;
}
// [tiempo dentro del compás, voz]: el bombo legüero (parche y aro), el rasgueo de la guitarra
const RITMOS = {
  chamame: [[0, 'rasgueo'], [1, 'rasgueo'], [1.5, 'rasgueo'], [2, 'rasgueo']],
  loncomeo: [[0, 'bombo'], [1, 'parche'], [2, 'bombo'], [2.5, 'bombo'], [3, 'parche']],
  chacarera: [[0, 'bombo'], [1, 'parche'], [2, 'bombo'], [3, 'bombo'], [4, 'parche'], [5, 'parche'], [0, 'rasgueo'], [3, 'rasgueo']],
  sur: [[0, 'rasgueo'], [2, 'rasgueo'], [3, 'rasgueo'], [5, 'rasgueo'], [0, 'bombo'], [3, 'parche']],
};

// ---------------------------------------------------------------- los invitados de otras paradas
// Llegan en el tren de fiesta a la mañana (fiestas con `invitados`), van al predio y se vuelven en el último tren.
// Cuántos, según el ritmo de la aldea (el ajuste de la 3.7.0).
export const INVITADOS_POR_RITMO = { tranquilo: 2, normal: 3, animado: 5 };
export const INVITADOS = [
  { clave: 'inv-domador', nombre: 'Ceferino Painemal', de: 'la Parada Alta', oficio: 'domador', jinete: true, mano: null,
    colores: { ropa: '#5a3a2a', abrigo: '#2a2420', gorro: 'boina', pelo: '#2a2220', barba: '#3a2e26', bufanda: '#c8b070' },
    saludo: 'Buenas. Vine para la jineteada: me dijeron que acá hay redomones que no los aguanta nadie.', despedida: 'Hasta la próxima fiesta, paisano.' },
  { clave: 'inv-cantora', nombre: 'Ramona Cayumil', de: 'el Mallín', oficio: 'cantora', mano: null,
    colores: { ropa: '#7a3a4a', abrigo: '#4a2a34', gorro: null, pelo: '#1e1a18', bufanda: '#e0c890' },
    saludo: '¡Qué lindo está el predio! Traje la guitarra por si el Cholo me deja una tanda.', despedida: 'Chau, querido. Que no se apague el fogón.' },
  { clave: 'inv-pescador', nombre: 'Lorenzo Gallardo', de: 'el Apeadero del Pescador', oficio: 'pescador', mano: 'mate',
    colores: { ropa: '#3a4a5a', abrigo: '#2a3440', gorro: 'gorro', pelo: '#6a5a4a', barba: '#8a7a6a' },
    saludo: 'Traje unas truchas ahumadas para la mesa. Las de acá son más flacas, no se ofendan.', despedida: 'Me vuelvo con el tren. Gracias por la mesa.' },
  { clave: 'inv-tejedora', nombre: 'Doña Flora Quintriqueo', de: 'Nahuel Pan', oficio: 'tejedora', mano: null,
    colores: { ropa: '#6a4a3a', abrigo: '#8a3a2a', gorro: null, pelo: '#a8a090', bufanda: '#d8c0a0' },
    saludo: 'Hace treinta años que no me pierdo una fiesta del sur. Los pies ya no bailan, pero miran.', despedida: 'Que les vaya lindo, y hasta la próxima fiesta.' },
  { clave: 'inv-maquinista', nombre: 'Tránsito Huichaqueo', de: 'El Maitén', oficio: 'foguista del tren de fiesta', mano: null,
    colores: { ropa: '#2a2e36', abrigo: '#1e2228', gorro: 'gorra', pelo: '#2a2220', barba: null },
    saludo: 'Traje el tren de fiesta con banderines y todo. Me quedo hasta el último; después hay que volver.', despedida: '¡Pasajeros al tren! Bueno, yo nomás.' },
];
export function invitadosDe(fecha, ritmo = 'normal', anio = 1) {
  const f = typeof fecha === 'string' ? fechaPorId(fecha) : fecha;
  if (!f?.invitados) return [];
  const n = INVITADOS_POR_RITMO[ritmo] ?? INVITADOS_POR_RITMO.normal;
  // (el domador siempre que hay jineteada; el foguista siempre: trae el tren)
  const fijos = INVITADOS.filter((x) => x.clave === 'inv-maquinista' || (x.jinete && (f.actividades || []).includes('jineteada')));
  const otros = INVITADOS.filter((x) => !fijos.includes(x));
  const k = entero(anio, 1) + IDS_FECHAS.indexOf(f.id);
  const rotados = otros.map((x, i) => otros[(i + k) % otros.length]);
  return [...fijos, ...rotados].slice(0, Math.max(0, n));
}

// ---------------------------------------------------------------- los recuerdos para colgar
// Uno por fiesta (el primer año que vas) y algunos por lo que hiciste (aguantar la jineteada). Se cuelgan en la
// pared del refugio (fiestas-mundo.js). `forma`: cómo se dibuja.
export const RECUERDOS = {
  'fruta-fina': { nombre: 'La cinta de la Fruta Fina', forma: 'cinta', color: '#b83a52', texto: 'Una cinta bordó con un ramito de frambuesas bordado.' },
  'dia-aldea': { nombre: 'El banderín del Día de la Aldea', forma: 'banderin', color: '#3a6a8a', texto: 'Un banderín con el duende de la plaza pintado a mano.' },
  cosecha: { nombre: 'La trenza de la Cosecha', forma: 'trenza', color: '#c8a050', texto: 'Una trenza de pasto seco con tres manzanas chiquitas.' },
  minga: { nombre: 'La cuña de la minga', forma: 'cuna', color: '#7a5a3a', texto: 'Una cuña de lenga con las iniciales de todos los que trabajaron.' },
  '25-mayo': { nombre: 'La escarapela del 25 de Mayo', forma: 'escarapela', color: '#78b0d8', texto: 'Una escarapela celeste y blanca que te prendió Delia.' },
  leyenda: { nombre: 'El farolito de la Noche de la Leyenda', forma: 'farolito', color: '#e0a040', texto: 'Un farolito de lata con una vela adentro.' },
  '9-julio': { nombre: 'El pañuelo del 9 de Julio', forma: 'panuelo', color: '#9ac8e8', texto: 'Un pañuelo celeste para la chacarera.' },
  nieve: { nombre: 'El copo tallado de la Fiesta de la Nieve', forma: 'copo', color: '#e8eef4', texto: 'Un copo de nieve tallado en ciprés por Tito.' },
  nevada: { nombre: 'La pala chica de la nevada', forma: 'pala', color: '#8a8a8a', texto: 'Una pala de juguete: «Al que paleó por todos», dice.' },
  'cumple-jugador': { nombre: 'La tarjeta de tu cumpleaños', forma: 'tarjeta', color: '#e8d8b0', texto: 'Una tarjeta firmada por toda la aldea (Lucía dibujó un perro).' },
  noventa: { nombre: 'La foto de los 90 de la abuela', forma: 'cuadro', color: '#6a4a30', texto: 'Toda la aldea alrededor de la abuela Herminia y su torta.' },
  jineteada: { nombre: 'La cinta del jinete', forma: 'cinta', color: '#2a6a3a', texto: 'Aguantaste el tiempo arriba del redomón. Ceferino te la prendió en el pecho.' },
};
export const IDS_RECUERDOS = Object.keys(RECUERDOS);
export const MAX_COLGADOS = IDS_RECUERDOS.length;

// ---------------------------------------------------------------- la minga
// Cada año la minga deja una obra (la primera vez que se hace cada una). Después de la lista, arreglos (no queda nada
// nuevo). `camino`: el camino del refugio a la aldea es de otro equipo (rincones): acá sólo queda anotado que se hizo
// (`mingaHecha(estado, 'camino')`) para que lo dibuje el que lo dibuja.
export const MINGAS = [
  { id: 'lenera', nombre: 'La leñera de la aldea', texto: 'Un tinglado de troncos al lado del predio, lleno de leña para el invierno de todos.', cargas: 6 },
  { id: 'camino', nombre: 'El camino del refugio a la aldea', texto: 'Desmalezar y emparejar el camino del refugio a la aldea.', cargas: 6 },
  { id: 'bancos', nombre: 'Los bancos del fogón', texto: 'Bancos de troncos partidos alrededor del fogón del predio.', cargas: 5 },
];
export const MINGA_ARREGLOS = { id: 'arreglos', nombre: 'Los arreglos del año', texto: 'Arreglar cercos, techos y la leñera: lo de todos los años.', cargas: 4 };
export function mingaDelAnio(anio) {
  const i = entero(anio, 1) - 1;
  return i >= 0 && i < MINGAS.length ? MINGAS[i] : MINGA_ARREGLOS;
}
export const mingaHecha = (estado, id) => Array.isArray(estado?.minga) && estado.minga.some((m) => m.obra === id);

// ---------------------------------------------------------------- la noche de la leyenda
// Una por año (y vuelven a empezar). Leyendas del sur contadas a nuestro modo; nada religioso.
export const LEYENDAS = [
  { id: 'calafate', titulo: 'La leyenda del calafate', quien: 'abuela', partes: [
    'Esto me lo contó mi abuela, que lo sabía de los tehuelches de la meseta. Arrímense, que el fuego no muerde.',
    'Había una anciana, Koonek, que no podía seguir a su gente cuando se iban al norte a pasar el invierno. Las piernas no le daban.',
    'Se quedó sola, mirando cómo se iban los pájaros también. Y el invierno la fue cubriendo, despacito, con su manta blanca.',
    'Cuando volvió la primavera, donde estaba ella había una mata llena de espinas y de flores amarillas. Los pájaros se posaron a descansar.',
    'En el verano la mata dio unos frutos morados, dulces. Los pájaros comieron y ya no se quisieron ir más.',
    'Por eso dicen: el que come calafate, vuelve a la Patagonia. Y miren que acá todos comimos.',
  ] },
  { id: 'cuero', titulo: 'El cuero del lago', quien: 'pescador', partes: [
    'Les voy a contar la del cuero, que es de los lagos de acá. Yo no la creo, pero de noche no saco el bote.',
    'Dicen que en el fondo del lago vive un cuero, como un cuero de vaca estirado, con bordes llenos de ojitos.',
    'Cuando hace calor sube a la orilla a tomar sol, y se queda chato sobre las piedras. Parece un cuero que alguien dejó secando.',
    'El que lo pisa o se agacha a juntarlo… se enrolla, plaf, y se lo lleva al fondo. Por eso los viejos tiraban piedras antes de bajar al agua.',
    'Una vez mi padre vio uno. O un cuero de verdad, no sé. Tiró una piedra y el cuero se fue nadando. Y esa noche no comimos trucha.',
  ] },
  { id: 'nahuelito', titulo: 'El bicho del lago grande', quien: 'martin', partes: [
    'Esta la sabemos todos los de la trochita: la del Nahuelito. En los viajes de noche siempre había uno que lo había visto.',
    'Dicen que en el lago grande vive un bicho largo, de cuello de ganso y lomo de piedra. Sale cuando el agua está quieta como un espejo.',
    'Un foguista de Jacobacci juraba que lo vio cruzar el lago al lado del tren, a la par, como queriendo una carrera.',
    'Yo le pregunté qué cara tenía. «Cara de que me ganaba», me dijo. Y nunca más lo volvió a ver.',
    'Así que si esta noche ven un lomo en el lago, no le saquen foto con flash. Es tímido. Y es de acá.',
  ] },
];
export const leyendaDelAnio = (anio) => LEYENDAS[((entero(anio, 1) - 1) % LEYENDAS.length + LEYENDAS.length) % LEYENDAS.length];

// ---------------------------------------------------------------- la mesa larga
// Lo que hay en la mesa según la fiesta (para el aviso, la nota y lo que se dibuja) y lo que da comer: descanso y
// sacar el frío (como la comida de la cocina de la 3.7.2: no se compra nada).
export const MENUS = {
  'fruta-fina': { platos: ['cordero al asador', 'ensalada de la huerta', 'frambuesas con crema'], buenPaso: 3 },
  'dia-aldea': { platos: ['empanadas', 'torta de la aldea', 'mate cocido'], buenPaso: 2 },
  cosecha: { platos: ['curanto', 'pan casero', 'manzanas asadas'], buenPaso: 3 },
  minga: { platos: ['guiso de la minga', 'pan casero'], buenPaso: 2 },
  '25-mayo': { platos: ['locro', 'pastelitos', 'chocolate caliente'], buenPaso: 3 },
  '9-julio': { platos: ['locro', 'pastelitos', 'chocolate caliente'], buenPaso: 3 },
  nieve: { platos: ['locro', 'chocolate caliente', 'torta negra'], buenPaso: 3 },
  'cumple-jugador': { platos: ['torta de cumpleaños', 'empanadas', 'sanguchitos'], buenPaso: 2 },
  noventa: { platos: ['torta con noventa velitas', 'scones', 'té'], buenPaso: 1 },
};
export const menuDe = (fecha) => { const f = typeof fecha === 'string' ? fechaPorId(fecha) : fecha; return f && Object.hasOwn(MENUS, f.id) ? MENUS[f.id] : null; };

// ---------------------------------------------------------------- la jineteada
// La reglamentaria del sur, simplificada a lo jugable: aguantar `tiempo` segundos arriba de un redomón que corcovea.
// El equilibrio va de −1 a 1: los corcovos lo empujan para un lado; vos lo compensás (A y D, las flechas o el palito).
// Si pasa de 1 (o de −1), te caés (sin lastimarte: los apadrinadores te agarran). Los vecinos y los invitados que se
// anotan, montan por su cuenta (`montaDeJinete`).
export const JINETEADA = {
  tiempo: 8,            // segundos (la crina limpia)
  corcovo: [0.55, 1.1], // cada cuánto corcovea (s)
  fuerza: [1.4, 2.4],   // cuánto empuja cada corcovo
  deriva: 1.0,          // lo que se va solo para el lado que se va (hay que adelantarse, no alcanza con corregir)
  compensa: 2.8,        // lo que corregís a fondo
  jinetes: ['padre', 'andinista', 'inv-domador'],   // los que se anotan (los chicos no)
  porDia: 1,            // cuántas veces podés montar por fiesta
};
export function jineteadaNueva(semilla = 1, dificultad = 1) {
  return { t: 0, eq: 0, vel: 0, prox: 0.4, empuje: 0, semilla: entero(semilla, 1), n: 0, dificultad: Math.max(0.5, Math.min(2, num(dificultad) || 1)), cayo: false, aguanto: false };
}
// Un paso: `entrada` de −1 (izquierda) a 1 (derecha). Devuelve el mismo estado.
export function pasoJineteada(j, dt, entrada = 0) {
  if (!j || j.cayo || j.aguanto) return j;
  const d = Math.max(0, Math.min(0.1, num(dt) || 0));
  j.t += d;
  j.prox -= d;
  if (j.prox <= 0) {
    j.n++;
    const r1 = azar(j.semilla * 7919 + j.n * 104729), r2 = azar(j.semilla * 6007 + j.n * 15485863), r3 = azar(j.semilla * 3001 + j.n * 7);
    const lado = r1 < 0.5 ? -1 : 1;
    j.empuje = lado * (JINETEADA.fuerza[0] + (JINETEADA.fuerza[1] - JINETEADA.fuerza[0]) * r2) * j.dificultad;
    j.prox = JINETEADA.corcovo[0] + (JINETEADA.corcovo[1] - JINETEADA.corcovo[0]) * r3;
  }
  const e = Math.max(-1, Math.min(1, num(entrada) || 0));
  j.vel += (j.empuje + j.eq * JINETEADA.deriva - e * JINETEADA.compensa) * d;
  j.vel *= Math.exp(-2.2 * d);
  j.empuje *= Math.exp(-3 * d);
  j.eq += j.vel * d * 2;
  if (Math.abs(j.eq) >= 1) { j.cayo = true; j.eq = Math.sign(j.eq); }
  else if (j.t >= JINETEADA.tiempo) j.aguanto = true;
  return j;
}
// Lo que aguanta un jinete de la aldea (o un invitado): segundos (≥ tiempo: aguantó)
export function montaDeJinete(clave, semilla = 1) {
  const base = clave === 'inv-domador' ? 0.85 : clave === 'padre' ? 0.6 : 0.5;
  const r = azar(entero(semilla, 1) * 131 + String(clave).length * 977);
  return r < base ? JINETEADA.tiempo : Math.round((2 + r * (JINETEADA.tiempo - 2.5)) * 10) / 10;
}

// ---------------------------------------------------------------- el baile y las clases de Pocha
// Pocha enseña chamamé y chacarera, tres niveles cada uno. Una clase: ella hace una secuencia de pasos y vos la
// repetís (con los números o un clic). Bien hecha, subís un nivel (una clase por día). Con nivel, bailar en la fiesta
// suma más (amistad con tu pareja de baile y buen ánimo).
export const BAILES = {
  chamame: { nombre: 'chamamé', pasos: ['paso al costado', 'balanceo', 'vuelta', 'abrazo'], musica: 'chamame' },
  chacarera: { nombre: 'chacarera', pasos: ['avance', 'vuelta entera', 'zapateo', 'zarandeo', 'giro'], musica: 'chacarera' },
};
export const IDS_BAILES = Object.keys(BAILES);
export const NIVEL_BAILE_MAX = 3;
export const largoClase = (nivel) => 3 + Math.max(0, Math.min(NIVEL_BAILE_MAX, entero(nivel))) ;
export function claseNueva(baile, nivel, semilla = 1) {
  if (!Object.hasOwn(BAILES, baile)) return null;
  const pasos = BAILES[baile].pasos, n = largoClase(nivel);
  const secuencia = [];
  for (let i = 0; i < n; i++) secuencia.push(Math.floor(azar(entero(semilla, 1) * 53 + i * 7577) * pasos.length) % pasos.length);
  return { baile, nivel: entero(nivel), secuencia, i: 0, errores: 0, fin: false, aprobada: false };
}
// Repetir un paso (índice en BAILES[baile].pasos). { ok, fin, aprobada }
export function responderPaso(clase, paso) {
  if (!clase || clase.fin) return { ok: false, fin: true, aprobada: !!clase?.aprobada };
  const ok = entero(paso, -1) === clase.secuencia[clase.i];
  if (ok) clase.i++; else clase.errores++;
  if (clase.i >= clase.secuencia.length) { clase.fin = true; clase.aprobada = clase.errores <= 1; }
  else if (clase.errores > 2) { clase.fin = true; clase.aprobada = false; }
  return { ok, fin: clase.fin, aprobada: clase.aprobada };
}

// ---------------------------------------------------------------- la nevada solidaria
// Las casas de los que viven solos o son grandes: hay que palearles la puerta y llevarles leña (de la leñera de la
// minga si ya está; si no, de tus troncos).
export const NEVADA = {
  casas: [
    { clave: 'abuela', edificio: 'casa-abuela' }, { clave: 'nelida', edificio: 'casa-nelida' },
    { clave: 'ercilia', edificio: 'casa-ercilia' }, { clave: 'jefe', edificio: 'casa-jefe' },
  ],
  paladas: 3,       // E por puerta
  lena: 2,          // troncos por casa (si no está la leñera)
  amistad: 6,       // con el dueño de casa, por cada cosa
};

// ---------------------------------------------------------------- lo guardado (progreso.fiestas)
// { version, vistas: { id: [años] }, recuerdos: [{ id, dia }], colgados: [id], minga: [{ anio, obra }], nevada:
// { anio, paleadas: [clave], lena: [clave] }, cumple (día del año), cumples: [años festejados], baile: { chamame,
// chacarera }, clase: día de la última clase, juegos: { truco|chinchon|damas|taba: { g, p } }, jineteada: { montas,
// aguantadas, mejor, dia }, comio: [ 'id|año' ], fotos: [ 'id|año' ], leyendas: [id] }
export const TOPE_LISTA = 60;
export function fiestasNuevas() {
  return {
    version: VERSION_FIESTAS, vistas: {}, recuerdos: [], colgados: [], minga: [], nevada: { anio: 0, paleadas: [], lena: [] },
    cumple: CUMPLE_JUGADOR, cumples: [], baile: { chamame: 0, chacarera: 0 }, clase: 0,
    juegos: { truco: { g: 0, p: 0 }, chinchon: { g: 0, p: 0 }, damas: { g: 0, p: 0 }, taba: { g: 0, p: 0 } },
    jineteada: { montas: 0, aguantadas: 0, mejor: 0, dia: 0 }, comio: [], fotos: [], leyendas: [], mingaHoy: { dia: 0, cargas: 0 },
  };
}
const listaDe = (v, ok, tope = TOPE_LISTA) => (Array.isArray(v) ? [...new Set(v.filter(ok))].slice(-tope) : []);
const claveValida = (x) => typeof x === 'string' && /^[a-z0-9-]{1,40}$/.test(x);
const idAnio = (x) => typeof x === 'string' && /^[a-z0-9-]{1,40}\|[0-9]{1,5}$/.test(x);
// Saneado (y migración: una partida sin `fiestas`, o de una versión vieja, arranca de cero con lo que sirva).
// `dia`: el de la partida (nada del futuro).
export function sanearFiestas(v, dia = 1) {
  const b = fiestasNuevas();
  if (!objeto(v)) return b;
  const hoy = diaValido(dia), anioHoy = anioDe(hoy);
  if (objeto(v.vistas)) for (const [id, anios] of Object.entries(v.vistas)) {
    if (!fechaPorId(id) || !Array.isArray(anios)) continue;
    const l = listaDe(anios.map((a) => entero(a, 0)), (a) => a >= 1 && a <= anioHoy);
    if (l.length) b.vistas[id] = l;
  }
  const ids = new Set();
  if (Array.isArray(v.recuerdos)) for (const r of v.recuerdos) {
    if (!objeto(r) || !Object.hasOwn(RECUERDOS, r.id) || ids.has(r.id)) continue;
    ids.add(r.id); b.recuerdos.push({ id: r.id, dia: Math.min(hoy, diaValido(r.dia)) });
  }
  b.colgados = listaDe(v.colgados, (x) => ids.has(x), MAX_COLGADOS);
  if (Array.isArray(v.minga)) for (const m of v.minga) {
    if (!objeto(m)) continue;
    const anio = entero(m.anio, 0), obra = m.obra;
    if (anio < 1 || anio > anioHoy || ![...MINGAS, MINGA_ARREGLOS].some((x) => x.id === obra) || b.minga.some((x) => x.anio === anio)) continue;
    b.minga.push({ anio, obra });
  }
  b.minga = b.minga.slice(-TOPE_LISTA);
  if (objeto(v.nevada)) {
    const casas = NEVADA.casas.map((c) => c.clave);
    b.nevada = { anio: Math.min(anioHoy, Math.max(0, entero(v.nevada.anio, 0))), paleadas: listaDe(v.nevada.paleadas, (x) => casas.includes(x)), lena: listaDe(v.nevada.lena, (x) => casas.includes(x)) };
  }
  const c = entero(v.cumple, CUMPLE_JUGADOR);
  b.cumple = c >= 1 && c <= DIAS_ANIO ? c : CUMPLE_JUGADOR;
  b.cumples = listaDe((Array.isArray(v.cumples) ? v.cumples : []).map((a) => entero(a, 0)), (a) => a >= 1 && a <= anioHoy);
  if (objeto(v.baile)) for (const k of IDS_BAILES) b.baile[k] = Math.max(0, Math.min(NIVEL_BAILE_MAX, entero(v.baile[k], 0)));
  b.clase = Math.min(hoy, Math.max(0, entero(v.clase, 0)));
  if (objeto(v.juegos)) for (const k of Object.keys(b.juegos)) if (objeto(v.juegos[k])) b.juegos[k] = { g: Math.max(0, Math.min(99999, entero(v.juegos[k].g))), p: Math.max(0, Math.min(99999, entero(v.juegos[k].p))) };
  if (objeto(v.jineteada)) {
    const j = v.jineteada, montas = Math.max(0, Math.min(99999, entero(j.montas)));
    b.jineteada = { montas, aguantadas: Math.min(montas, Math.max(0, entero(j.aguantadas))), mejor: Math.max(0, Math.min(JINETEADA.tiempo, Number.isFinite(num(j.mejor)) ? Math.round(num(j.mejor) * 10) / 10 : 0)), dia: Math.min(hoy, Math.max(0, entero(j.dia))) };
  }
  b.comio = listaDe(v.comio, idAnio);
  b.fotos = listaDe(v.fotos, idAnio);
  b.leyendas = listaDe(v.leyendas, (x) => LEYENDAS.some((l) => l.id === x));
  if (objeto(v.mingaHoy)) { const d = Math.min(hoy, Math.max(0, entero(v.mingaHoy.dia))); b.mingaHoy = { dia: d, cargas: d ? Math.max(0, Math.min(20, entero(v.mingaHoy.cargas))) : 0 }; }
  return b;
}

// ---------------------------------------------------------------- lo que pasa en el estado
const asegurar = (e) => (objeto(e) ? e : fiestasNuevas());
// Estuviste en la fiesta (este año). Devuelve true si es la primera vez este año.
export function marcarVista(estado, id, anio) {
  const e = asegurar(estado);
  if (!fechaPorId(id)) return false;
  const l = Array.isArray(e.vistas[id]) ? e.vistas[id] : (e.vistas[id] = []);
  const a = entero(anio, 1);
  if (l.includes(a)) return false;
  l.push(a); if (l.length > TOPE_LISTA) l.shift();
  return true;
}
export const fueA = (estado, id, anio = null) => Array.isArray(estado?.vistas?.[id]) && (anio === null ? estado.vistas[id].length > 0 : estado.vistas[id].includes(entero(anio)));
// El recuerdo de una fiesta (o de la jineteada): si no lo tenías, queda para colgar. Devuelve el recuerdo o null.
export function darRecuerdo(estado, id, dia) {
  const e = asegurar(estado);
  if (!Object.hasOwn(RECUERDOS, id) || e.recuerdos.some((r) => r.id === id)) return null;
  e.recuerdos.push({ id, dia: diaValido(dia) });
  return { id, ...RECUERDOS[id] };
}
export const porColgar = (estado) => (Array.isArray(estado?.recuerdos) ? estado.recuerdos.filter((r) => !(estado.colgados || []).includes(r.id)).map((r) => r.id) : []);
export function colgarRecuerdos(estado) {
  const e = asegurar(estado);
  const nuevos = porColgar(e);
  for (const id of nuevos) if (e.colgados.length < MAX_COLGADOS) e.colgados.push(id);
  return nuevos;
}
// Comer en la mesa larga: una vez por fiesta y año. Devuelve el menú (o null si ya comiste)
export function comerEnLaMesa(estado, fecha, anio) {
  const e = asegurar(estado);
  const f = typeof fecha === 'string' ? fechaPorId(fecha) : fecha;
  const m = menuDe(f);
  if (!m) return null;
  const k = `${f.id}|${entero(anio, 1)}`;
  if (e.comio.includes(k)) return null;
  e.comio.push(k); if (e.comio.length > TOPE_LISTA) e.comio.shift();
  return m;
}
export const yaComio = (estado, fecha, anio) => Array.isArray(estado?.comio) && estado.comio.includes(`${typeof fecha === 'string' ? fecha : fecha?.id}|${entero(anio, 1)}`);
// Una foto sacada en la fiesta (para el álbum): una por fiesta y año. Devuelve el id del álbum o null.
export function fotoDeFiesta(estado, fecha, anio) {
  const e = asegurar(estado);
  const f = typeof fecha === 'string' ? fechaPorId(fecha) : fecha;
  if (!f) return null;
  const k = `${f.id}|${entero(anio, 1)}`;
  if (e.fotos.includes(k)) return null;
  e.fotos.push(k); if (e.fotos.length > TOPE_LISTA) e.fotos.shift();
  return idFotoAlbum(f.id, anio);
}
export const idFotoAlbum = (id, anio) => `fiesta-${id}-${entero(anio, 1)}`;
// Lo que el álbum (album.js) necesita para mostrar las fotos de las fiestas: [{ id, nombre, texto }]
export function fotosParaAlbum(estado) {
  return (Array.isArray(estado?.fotos) ? estado.fotos : []).map((k) => {
    const [id, a] = k.split('|');
    const f = fechaPorId(id);
    return f ? { id: idFotoAlbum(id, a), nombre: `${f.nombre}, año ${entero(a, 1)}`, texto: f.texto } : null;
  }).filter(Boolean);
}
// La minga: una carga más (E en la obra). { cargas, faltan, hecha }
export function cargarMinga(estado, dia) {
  const e = asegurar(estado);
  const d = diaValido(dia), anio = anioDe(d), m = mingaDelAnio(anio);
  if (e.mingaHoy.dia !== d) e.mingaHoy = { dia: d, cargas: 0 };
  if (e.minga.some((x) => x.anio === anio)) return { cargas: e.mingaHoy.cargas, faltan: 0, hecha: true, obra: m };
  e.mingaHoy.cargas++;
  return { cargas: e.mingaHoy.cargas, faltan: Math.max(0, m.cargas - e.mingaHoy.cargas), hecha: false, obra: m };
}
// Al terminar la fase de trabajo, la obra queda hecha (con o sin tu ayuda: es de todos). Devuelve la obra si es nueva.
export function terminarMinga(estado, dia) {
  const e = asegurar(estado);
  const anio = anioDe(dia), m = mingaDelAnio(anio);
  if (e.minga.some((x) => x.anio === anio)) return null;
  e.minga.push({ anio, obra: m.id });
  return m;
}
export const ayudasteEnLaMinga = (estado, dia) => estado?.mingaHoy?.dia === diaValido(dia) && entero(estado.mingaHoy.cargas) > 0;
// La nevada solidaria: palear o llevar leña a una casa. { ok, motivo, hecho: 'pala'|'lena', todas }
export function ayudarEnLaNevada(estado, anio, clave, que) {
  const e = asegurar(estado);
  if (!NEVADA.casas.some((c) => c.clave === clave) || (que !== 'pala' && que !== 'lena')) return { ok: false, motivo: 'no' };
  if (e.nevada.anio !== entero(anio, 1)) e.nevada = { anio: entero(anio, 1), paleadas: [], lena: [] };
  const l = que === 'pala' ? e.nevada.paleadas : e.nevada.lena;
  if (l.includes(clave)) return { ok: false, motivo: 'hecho' };
  l.push(clave);
  const todas = NEVADA.casas.every((c) => e.nevada.paleadas.includes(c.clave) && e.nevada.lena.includes(c.clave));
  return { ok: true, hecho: que, todas };
}
export const nevadaHecha = (estado, anio, clave, que) => estado?.nevada?.anio === entero(anio, 1) && (que === 'pala' ? estado.nevada.paleadas : estado.nevada.lena)?.includes(clave);
// Un partido terminado: suma al registro.
export function anotarPartido(estado, juego, gano) {
  const e = asegurar(estado);
  if (!Object.hasOwn(e.juegos, juego)) return null;
  if (gano) e.juegos[juego].g++; else e.juegos[juego].p++;
  return e.juegos[juego];
}
// Una monta en la jineteada (tuya). Devuelve si fue la primera vez que aguantaste.
export function anotarMonta(estado, segundos, dia) {
  const e = asegurar(estado);
  const s = Math.max(0, Math.min(JINETEADA.tiempo, Number.isFinite(num(segundos)) ? num(segundos) : 0));
  const j = e.jineteada;
  j.montas++; j.dia = diaValido(dia);
  j.mejor = Math.max(j.mejor, Math.round(s * 10) / 10);
  const aguanto = s >= JINETEADA.tiempo;
  if (aguanto) j.aguantadas++;
  return aguanto && j.aguantadas === 1;
}
export const puedeMontar = (estado, dia) => !(estado?.jineteada?.dia === diaValido(dia));
// Una clase de baile aprobada: sube un nivel (una por día)
export function aprobarClase(estado, baile, dia) {
  const e = asegurar(estado);
  if (!Object.hasOwn(e.baile, baile)) return null;
  e.clase = diaValido(dia);
  e.baile[baile] = Math.min(NIVEL_BAILE_MAX, e.baile[baile] + 1);
  return e.baile[baile];
}
export const puedeTomarClase = (estado, dia) => entero(estado?.clase) !== diaValido(dia);
export function elegirCumple(estado, dda) {
  const e = asegurar(estado);
  const d = entero(dda, 0);
  if (d < 1 || d > DIAS_ANIO) return false;
  e.cumple = d;
  return true;
}
// El nombre de la estación de un día (para los textos)
export const estacionDe = (dia) => estacionDelAnio(diaDelAnio(dia)).id;

// ---------------------------------------------------------------- el predio de la fiesta
// Del otro lado de la calle de la vía, entre la calle de la estación y el taller (en el plano de la aldea: x hacia el
// este, z hacia la plaza). Lo arma fiestas-mundo.js y queda siempre (el ruedo, la tarima, la pista de tablas, la mesa
// larga con sus bancos, el fogón con troncos para sentarse, la mesita de los juegos y la cancha de la taba). Los
// adornos, la comida y el fuego, sólo en las fiestas.
export const PREDIO = {
  centro: { x: 22, z: 15 },
  mesa: { x: 15.2, z: 20.8, largo: 8, ancho: 0.9, banco: 0.72, sitios: 11 },
  pista: { x: 14.6, z: 13.6, largo: 6.4, ancho: 5 },
  tarima: { x: 14.6, z: 9.3, largo: 3.2, ancho: 2 },
  fogon: { x: 23.6, z: 19.6, radio: 2.25, troncos: 10 },
  ruedo: { x: 29.8, z: 12.8, radio: 5.4, postes: 28, tranquera: Math.PI * 1.5 },   // (la tranquera, del lado de la pista)
  juegos: { x: 20.6, z: 11.0 },
  taba: { x: 20.8, z: 15.4, largo: 3.2 },
  lenera: { x: 33.6, z: 21.4, largo: 4, ancho: 1.6 },
  // a cuántos metros del centro se está «en la fiesta» (para la foto, el recuerdo, la música)
  radio: 22,
};
// Los puntos con nombre, en el plano: { x, z, rot } (rot: hacia dónde mira el que está ahí: (sin rot, cos rot))
let cachePredio = null;
export function puntosPredio() {
  if (cachePredio) return cachePredio;
  const P = {};
  const { mesa, pista, tarima, fogon, ruedo, juegos, taba, lenera } = PREDIO;
  const paso = (mesa.largo - 1) / (mesa.sitios - 1);
  for (let i = 0; i < mesa.sitios; i++) {
    const x = mesa.x - (mesa.largo - 1) / 2 + i * paso;
    P[`mesa-n-${i}`] = { x, z: mesa.z + mesa.banco, rot: Math.PI };
    P[`mesa-s-${i}`] = { x, z: mesa.z - mesa.banco, rot: 0 };
  }
  for (let i = 0; i < fogon.troncos; i++) {
    const a = (i / fogon.troncos) * Math.PI * 2 + 0.31;
    P[`fogon-${i}`] = { x: fogon.x + Math.sin(a) * fogon.radio, z: fogon.z + Math.cos(a) * fogon.radio, rot: a + Math.PI };
  }
  // el que cuenta, parado del lado de la calle, mirando al fuego; el asador (la cruz), del otro lado
  P.narrador = { x: fogon.x + 0.15, z: fogon.z + 1.5, rot: Math.PI };
  P.asador = { x: fogon.x - 0.95, z: fogon.z - 0.55, rot: 0.9 };
  P['asador-gente'] = { x: fogon.x - 1.7, z: fogon.z - 1.25, rot: 0.9 };
  // la pista: cuatro parejas
  const parejas = [[-1.6, -1.1], [1.6, -1.1], [-1.6, 1.1], [1.6, 1.1]];
  parejas.forEach(([dx, dz], k) => {
    P[`pista-${2 * k}`] = { x: pista.x + dx - 0.3, z: pista.z + dz, rot: Math.PI / 2 };
    P[`pista-${2 * k + 1}`] = { x: pista.x + dx + 0.3, z: pista.z + dz, rot: -Math.PI / 2 };
    // (la chacarera se baila suelta, frente a frente: más separados)
    P[`suelta-${2 * k}`] = { x: pista.x + dx - 0.8, z: pista.z + dz, rot: Math.PI / 2 };
    P[`suelta-${2 * k + 1}`] = { x: pista.x + dx + 0.8, z: pista.z + dz, rot: -Math.PI / 2 };
  });
  // los que miran el baile: la fila de la mesa y los dos costados
  let m = 0;
  for (let i = 0; i < 7; i++) P[`mira-baile-${m++}`] = { x: pista.x - 3 + i, z: pista.z + pista.ancho / 2 + 1.0, rot: Math.PI };
  for (const lado of [-1, 1]) for (let i = 0; i < 4; i++) P[`mira-baile-${m++}`] = { x: pista.x + lado * (pista.largo / 2 + 0.95), z: pista.z - 1.6 + i * 1.05, rot: -lado * Math.PI / 2 };
  P.tarima = { x: tarima.x, z: tarima.z + 0.1, rot: 0 };
  P['tarima-2'] = { x: tarima.x - 0.95, z: tarima.z + 0.1, rot: 0 };
  // el ruedo: los que miran de afuera, del lado de la pista y de la calle (no del lado del bosque)
  // (al oeste y al norte: del lado del bosque hay una mata grande y los árboles; la tranquera, libre)
  for (let i = 0; i < 12; i++) {
    let a = Math.PI * 1.25 + (i / 11) * Math.PI * 1.05;
    if (Math.abs(a - ruedo.tranquera) < 0.32) a += a < ruedo.tranquera ? -0.3 : 0.3;
    P[`ruedo-mira-${i}`] = { x: ruedo.x + Math.sin(a) * (ruedo.radio + 0.75), z: ruedo.z + Math.cos(a) * (ruedo.radio + 0.75), rot: a + Math.PI };
  }
  P.palenque = { x: ruedo.x, z: ruedo.z, rot: 0 };
  P.tranquera = { x: ruedo.x + Math.sin(ruedo.tranquera) * (ruedo.radio + 1.0), z: ruedo.z + Math.cos(ruedo.tranquera) * (ruedo.radio + 1.0), rot: ruedo.tranquera + Math.PI };
  P.mesita = { x: juegos.x, z: juegos.z, rot: 0 };
  P['juegos-0'] = { x: juegos.x - 0.62, z: juegos.z, rot: Math.PI / 2 };
  P['juegos-1'] = { x: juegos.x + 0.62, z: juegos.z, rot: -Math.PI / 2 };
  P['juegos-mira'] = { x: juegos.x, z: juegos.z - 1.1, rot: 0 };
  P['taba-tira'] = { x: taba.x - taba.largo / 2 - 0.3, z: taba.z, rot: Math.PI / 2 };
  P['taba-mira'] = { x: taba.x - taba.largo / 2 - 0.2, z: taba.z + 1.0, rot: Math.PI / 2 + 0.5 };
  P['taba-raya'] = { x: taba.x - 0.2, z: taba.z, rot: 0 };
  P['taba-queso'] = { x: taba.x + taba.largo / 2 - 0.5, z: taba.z, rot: 0 };
  P.lenera = { x: lenera.x, z: lenera.z, rot: Math.PI };
  // los invitados de otras paradas: parados entre la mesa y la pista (comen parados al lado de la mesa, miran el baile)
  for (let i = 0; i < 6; i++) P[`invitado-${i}`] = { x: mesa.x - 3 + i * 1.2, z: mesa.z - mesa.banco - 1.35, rot: i % 2 ? Math.PI : 0 };
  const minga = [[-2.6, -1.4], [-1.2, -1.7], [0.2, -1.8], [1.6, -1.7], [2.8, -1.2], [-3.4, 0.2]];
  minga.forEach(([dx, dz], i) => { P[`minga-${i}`] = { x: lenera.x + dx, z: lenera.z + dz, rot: Math.atan2(-dx, -dz) }; });
  cachePredio = P;
  return P;
}
// ¿Está en el predio? (el punto del plano, a menos de `radio` del centro)
export const enElPredio = (x, z, radio = PREDIO.radio) => Math.hypot(x - PREDIO.centro.x, z - PREDIO.centro.z) < radio;

// Quién va a dónde en cada fase. `claves`: los de la aldea que están (en orden: el de siempre). `opciones`: { leyenda
// (la del año), musica (la de la fiesta), clase (Pocha da una clase: se queda en la pista) }. Devuelve un Map clave →
// destino (en el plano: { lugar: 'fiesta', edificio: 'predio', punto, plano, rotPlano, pose, sentado }, o un punto de
// un edificio de la aldea: { lugar, edificio, punto, pose, sentado }). El que no está en el Map, sigue con lo suyo.
export const CHICOS = ['nene', 'nena'];
export const PAREJAS_DE_BAILE = [['herrero', 'modista'], ['padre', 'madre'], ['jefe', 'nelida'], ['carpintero', 'panadera'], ['pescador', 'tejedora'], ['apicultor', 'galesa'], ['telegrafista', 'enfermera'], ['martin', 'abuela']];
const POSE_BAILE = { chamame: 'chamame', chacarera: 'chacarera', loncomeo: 'bailar', sur: 'bailar' };
export const poseDeBaile = (musica) => POSE_BAILE[musica] || 'bailar';
export function repartoFiesta(fecha, fase, claves = [], opciones = {}) {
  const salida = new Map();
  const f = typeof fecha === 'string' ? fechaPorId(fecha) : fecha;
  const fs = typeof fase === 'string' ? fase : fase?.fase;
  if (!f || !fs) return salida;
  const P = puntosPredio();
  const hay = claves.filter((k) => typeof k === 'string');
  const libres = new Set(hay);
  const en = (k, punto, extra = {}) => {
    if (!libres.has(k)) return false;
    const q = P[punto];
    if (!q) return false;
    salida.set(k, { lugar: 'fiesta', edificio: 'predio', punto, plano: { x: q.x, z: q.z }, rotPlano: q.rot, pose: null, sentado: false, ...extra });
    libres.delete(k);
    return true;
  };
  const enAldea = (k, edificio, punto, extra = {}) => { if (!libres.has(k)) return false; salida.set(k, { lugar: 'fiesta', edificio, punto, pose: null, sentado: false, ...extra }); libres.delete(k); return true; };
  const resto = () => hay.filter((k) => libres.has(k));
  const sentarALaMesa = (lista, pose = 'comer') => {
    let i = 0;
    for (const k of lista) {
      while (i < PREDIO.mesa.sitios * 2) { const p = i % 2 ? `mesa-s-${i >> 1}` : `mesa-n-${i >> 1}`; i++; if (en(k, p, { pose, sentado: true })) break; }
    }
  };
  const mirarDesde = (lista, prefijo, cuantos, poses = ['aplaudir', 'mirar']) => {
    let i = 0;
    for (const k of lista) { if (i >= cuantos) break; while (i < cuantos && salidaUsa(`${prefijo}-${i}`)) i++; if (i < cuantos && en(k, `${prefijo}-${i}`, { pose: CHICOS.includes(k) ? 'jugar' : poses[i % poses.length] })) i++; }
  };
  const salidaUsa = (punto) => [...salida.values()].some((d) => d.punto === punto);
  if (fs === 'llegada') {
    en('padre', 'asador-gente', { pose: 'hachar' });
    en('musico', 'tarima', { pose: 'mirar' });
    en('madre', 'mesa-n-5', { pose: 'amasar' });
    en('panadera', 'mesa-n-6', { pose: 'amasar' });
    return salida;
  }
  if (fs === 'acto') {
    enAldea('jefe', 'plaza', 'soga', { pose: 'izar' });
    let i = 1;
    for (const k of resto()) { if (i > 20) break; enAldea(k, 'plaza', `estar-${i++}`, { pose: CHICOS.includes(k) ? 'jugar' : 'mirar', sentado: false }); }
    return salida;
  }
  if (fs === 'mesa' || fs === 'sorpresa') {
    if (fs === 'sorpresa') en('musico', 'tarima', { pose: 'tocar' });
    sentarALaMesa(resto());
    mirarDesde(resto(), 'mira-baile', 15, ['mirar']);
    return salida;
  }
  if (fs === 'juegos') {
    en('jefe', 'juegos-1', { pose: 'sentado', sentado: true });
    en('herrero', 'juegos-mira', { pose: 'mirar' });
    en('padre', 'taba-tira', { pose: 'tirar' });
    en('carpintero', 'taba-mira', { pose: 'aplaudir' });
    CHICOS.forEach((k, i) => en(k, `mira-baile-${i + 2}`, { pose: 'jugar' }));
    const espectadores = resto().filter((k) => !['abuela', 'galesa', 'modista'].includes(k));
    mirarDesde(espectadores, 'ruedo-mira', 12);
    // los grandes, de sobremesa
    sentarALaMesa(resto(), 'sentado');
    return salida;
  }
  if (fs === 'baile') {
    en('musico', 'tarima', { pose: 'tocar' });
    const pose = poseDeBaile(opciones.musica || f.musica);
    const prefijo = pose === 'chacarera' ? 'suelta' : 'pista';
    let i = 0;
    // (Pocha, si da una clase, baila con vos: queda en la pista y deja lugar)
    if (opciones.clase) en('modista', `${prefijo}-7`, { pose });
    for (const [a, b] of PAREJAS_DE_BAILE) {
      if (i >= (opciones.clase ? 6 : 8)) break;
      if (!libres.has(a) || !libres.has(b)) continue;
      en(a, `${prefijo}-${i}`, { pose }); en(b, `${prefijo}-${i + 1}`, { pose }); i += 2;
    }
    mirarDesde(resto(), 'mira-baile', 15, ['aplaudir', 'aplaudir', 'mirar']);
    sentarALaMesa(resto(), 'sentado');
    return salida;
  }
  if (fs === 'fogon') {
    const ley = opciones.leyenda || leyendaDelAnio(1);
    const narrador = libres.has(ley.quien) ? ley.quien : libres.has('abuela') ? 'abuela' : null;
    if (narrador) en(narrador, 'narrador', { pose: 'contar' });
    let i = 0;
    for (const k of resto()) { if (i >= PREDIO.fogon.troncos) break; if (en(k, `fogon-${i}`, { pose: 'sentado', sentado: true })) i++; }
    mirarDesde(resto(), 'mira-baile', 15, ['mirar']);
    return salida;
  }
  if (fs === 'trabajo') {
    en('abuela', 'mesa-n-4', { pose: 'sentado', sentado: true });
    en('panadera', 'asador-gente', { pose: 'amasar' });
    en('galesa', 'mesa-n-6', { pose: 'amasar' });
    CHICOS.forEach((k, i) => en(k, `mira-baile-${i}`, { pose: 'jugar' }));
    let i = 0;
    for (const k of resto()) { if (i >= 6) break; if (en(k, `minga-${i}`, { pose: i % 2 ? 'palear' : 'hachar' })) i++; }
    return salida;
  }
  if (fs === 'palear') {
    // los dueños de casa, en su puerta; los demás, con la pala en las puertas de los que viven solos
    for (const c of NEVADA.casas) enAldea(c.clave, c.edificio, 'puerta', { pose: 'mirar' });
    let i = 0;
    for (const k of resto()) { if (i >= 8) break; if (CHICOS.includes(k)) continue; const c = NEVADA.casas[i % NEVADA.casas.length]; if (enAldea(k, c.edificio, 'puerta', { pose: 'palear' })) i++; }
    return salida;
  }
  return salida;
}
