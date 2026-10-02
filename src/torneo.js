// 3.1: el torneo de la semana. Toda la semana (ISO) hay un torneo, el mismo para todos:
// sale del código de la semana del Desafío (semilla.js). Tres pruebas:
//   · pesca: el pez más grande de una especie (la elige la semana);
//   · carrera: el mejor tiempo en un circuito (lo elige la semana);
//   · defensa: las noches resistidas en el Desafío jugado con el código de la semana.
// No hay servidor: cada computadora deja sus puntajes en un archivo propio dentro de la
// carpeta sincronizada (hojarasca-torneo-<pc>.json), que sólo ella escribe y que sólo
// crece; la tabla junta los archivos de todas. Y hay un código corto para pasarle a un
// amigo por chat, que se pega del otro lado.
//
// Todo lo que viene de afuera (archivos de la carpeta, códigos pegados) se sanea al leer:
// números acotados, nombres cortos sin marcas raras, nada de claves heredadas.
// Puro, sin three ni DOM.
import { hashTexto, generador, semanaIso, codigoDeLaSemana, normalizarCodigo } from './semilla.js';
import { circuitoDe, puntosCarrera } from './carreras.js';

export const PECES_TORNEO = [['arcoiris', 'trucha arcoíris'], ['marron', 'trucha marrón'], ['perca', 'perca criolla'], ['pejerrey', 'pejerrey patagónico']];
export const CIRCUITOS_TORNEO = ['mirador', 'faro', 'lago'];
export const TORNEO = {
  maxEntradasArchivo: 400,   // por archivo
  maxArchivos: 40,
  maxTexto: 256 * 1024,
  semanasGuardadas: 12,
  maxAmigos: 60,
};
export const NOMBRE_ARCHIVO_TORNEO = /^hojarasca-torneo-[a-z0-9]{4,16}\.json$/;

// '2026-S40'
export function semanaClave(fecha = new Date()) {
  const { anio, semana } = semanaIso(fecha);
  return `${anio}-S${String(semana).padStart(2, '0')}`;
}
const SEMANA = /^(\d{4})-S(\d{2})$/;
export const semanaValida = (s) => typeof s === 'string' && SEMANA.test(s) && +SEMANA.exec(s)[2] >= 1 && +SEMANA.exec(s)[2] <= 53;

export function torneoDeLaSemana(fecha = new Date()) {
  const codigo = codigoDeLaSemana(fecha);
  const r = generador(hashTexto(`hojarasca-torneo|${codigo}`));
  const [pez, pezNombre] = PECES_TORNEO[Math.floor(r() * PECES_TORNEO.length)];
  const circuito = CIRCUITOS_TORNEO[Math.floor(r() * CIRCUITOS_TORNEO.length)];
  return { semana: semanaClave(fecha), codigo, pez, pezNombre, circuito, circuitoNombre: circuitoDe(circuito).nombre };
}

// ---------------------------------------------------------------- saneo
// Un nombre para la tabla: letras (con acentos), números, espacio, guion y guion bajo.
export function sanearNombre(s) {
  if (typeof s !== 'string') return '';
  return s.normalize('NFC').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 18);
}
export function sanearPc(s) {
  return typeof s === 'string' && /^[a-z0-9]{4,16}$/.test(s) ? s : '';
}
const entero = (v, min, max) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : 0; };
const MS_MIN = 5000, MS_MAX = 3600000;
export function sanearEntrada(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const semana = semanaValida(v.semana) ? v.semana : null;
  const nombre = sanearNombre(v.nombre);
  if (!semana || !nombre) return null;
  const ms = entero(v.carreraMs, 0, MS_MAX);
  const e = {
    semana, nombre, pc: sanearPc(v.pc),
    pesca: entero(v.pesca, 0, 120),                 // cm
    carreraMs: ms >= MS_MIN ? ms : 0,               // 0: sin tiempo
    noches: entero(v.noches, 0, 999),
    abatidos: entero(v.abatidos, 0, 99999),
    t: entero(v.t, 0, 8.64e15),
  };
  return e;
}
// Lo mejor de dos entradas del mismo jugador y la misma semana
export function mejorDe(a, b) {
  if (!a) return b ? { ...b } : null;
  if (!b) return { ...a };
  const def = (x) => x.noches * 100000 + x.abatidos;
  const carreras = [a.carreraMs, b.carreraMs].filter((n) => n > 0);
  return {
    ...a,
    pc: a.pc || b.pc,
    pesca: Math.max(a.pesca, b.pesca),
    carreraMs: carreras.length ? Math.min(...carreras) : 0,
    noches: def(a) >= def(b) ? a.noches : b.noches,
    abatidos: def(a) >= def(b) ? a.abatidos : b.abatidos,
    t: Math.max(a.t, b.t),
  };
}
const claveJugador = (e) => `${e.semana}|${e.nombre.toLocaleLowerCase('es')}`;
// Junta listas de entradas (de varios archivos y códigos): una por jugador y semana.
export function fundirEntradas(...listas) {
  const m = new Map();
  for (const lista of listas) {
    for (const v of Array.isArray(lista) ? lista : []) {
      const e = sanearEntrada(v);
      if (!e) continue;
      const k = claveJugador(e);
      m.set(k, mejorDe(m.get(k), e));
    }
  }
  return [...m.values()];
}
export function puntosDe(e, torneo = null) {
  const ref = circuitoDe(torneo?.circuito || 'mirador')?.ref || 60;
  const pesca = e.pesca * 10;
  const carrera = e.carreraMs > 0 ? puntosCarrera(e.carreraMs, ref) : 0;
  const defensa = e.noches * 100 + Math.min(500, e.abatidos);
  return { pesca, carrera, defensa, total: pesca + carrera + defensa };
}
// La tabla de una semana, de mayor a menor
export function tablaSemana(entradas, torneo) {
  return fundirEntradas(entradas)
    .filter((e) => e.semana === torneo.semana)
    .map((e) => ({ ...e, puntos: puntosDe(e, torneo) }))
    .sort((a, b) => b.puntos.total - a.puntos.total || a.nombre.localeCompare(b.nombre));
}

// ---------------------------------------------------------------- lo de esta compu
// En localStorage: quién sos (pc y nombre), tus entradas, las de amigos pegadas a mano y
// lo último que se leyó de la carpeta.
export function torneoLocalNuevo(pc = '') { return { pc: sanearPc(pc), nombre: '', propias: [], amigos: [], carpeta: [] }; }
function recortarSemanas(lista, n = TORNEO.semanasGuardadas) {
  const semanas = [...new Set(lista.map((e) => e.semana))].sort().slice(-n);
  return lista.filter((e) => semanas.includes(e.semana));
}
export function sanearTorneoLocal(v) {
  const b = torneoLocalNuevo();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return b;
  b.pc = sanearPc(v.pc);
  b.nombre = sanearNombre(v.nombre);
  b.propias = recortarSemanas(fundirEntradas(Array.isArray(v.propias) ? v.propias.slice(0, TORNEO.maxEntradasArchivo) : []));
  b.amigos = recortarSemanas(fundirEntradas(Array.isArray(v.amigos) ? v.amigos.slice(0, TORNEO.maxEntradasArchivo) : [])).slice(-TORNEO.maxAmigos);
  b.carpeta = recortarSemanas(fundirEntradas(Array.isArray(v.carpeta) ? v.carpeta.slice(0, TORNEO.maxEntradasArchivo * 2) : []));
  return b;
}
export function nombreVisible(local) {
  return local.nombre || (local.pc ? `Compu ${local.pc.slice(0, 4).toUpperCase()}` : 'Sin nombre');
}
// Anota un resultado propio de esta semana. Devuelve true si mejoró algo.
export function anotarPropio(local, torneo, { pesca = 0, carreraMs = 0, noches = 0, abatidos = 0 } = {}) {
  const nombre = nombreVisible(local);
  const nueva = sanearEntrada({ semana: torneo.semana, nombre, pc: local.pc, pesca, carreraMs, noches, abatidos, t: Date.now() });
  if (!nueva) return false;
  const i = local.propias.findIndex((e) => e.semana === torneo.semana);
  const antes = i >= 0 ? local.propias[i] : null;
  const junta = mejorDe(antes ? { ...antes, nombre } : null, nueva);
  const mejoro = !antes || junta.pesca !== antes.pesca || junta.carreraMs !== antes.carreraMs || junta.noches !== antes.noches || junta.abatidos !== antes.abatidos;
  if (!mejoro) return false;
  junta.t = nueva.t;
  if (i >= 0) local.propias[i] = junta; else local.propias.push(junta);
  local.propias = recortarSemanas(local.propias);
  return true;
}
// Todas las entradas conocidas (propias, de la carpeta y de amigos), ya fundidas
export function todasLasEntradas(local) {
  return fundirEntradas(local.propias, local.carpeta, local.amigos);
}

// ---------------------------------------------------------------- el archivo de la carpeta
export function nombreArchivoTorneo(pc) {
  const p = sanearPc(pc);
  return p ? `hojarasca-torneo-${p}.json` : null;
}
// Lo que esta compu deja en la carpeta: lo suyo y los amigos que pegó. `anterior`: lo que
// ya había en su archivo (se funde: el archivo sólo crece, nunca pierde un puntaje).
export function armarArchivo(local, anterior = null) {
  const previo = anterior ? leerArchivoTorneo(anterior) : null;
  // (lo propio del archivo, con el nombre de ahora: si te cambiaste el nombre, no quedás dos veces)
  const nombre = nombreVisible(local);
  const propias = recortarSemanas(fundirEntradas(previo && previo.pc === local.pc ? previo.entradas.map((e) => ({ ...e, nombre })) : [], local.propias.map((e) => ({ ...e, nombre }))));
  const amigos = recortarSemanas(fundirEntradas(previo && previo.pc === local.pc ? previo.amigos : [], local.amigos)).slice(-TORNEO.maxAmigos);
  return JSON.stringify({ formato: 'hojarasca-torneo', version: 1, pc: local.pc, nombre, entradas: propias, amigos });
}
// Lee el archivo de otra compu (o el propio). Hostil hasta que se demuestre lo contrario.
export function leerArchivoTorneo(texto, nombreArchivo = null) {
  if (typeof texto !== 'string' || !texto || texto.length > TORNEO.maxTexto) return null;
  let v;
  try { v = JSON.parse(texto); } catch { return null; }
  if (!v || typeof v !== 'object' || Array.isArray(v) || v.formato !== 'hojarasca-torneo') return null;
  const pc = sanearPc(v.pc);
  if (!pc) return null;
  // el archivo de una compu tiene que llamarse como ella: nadie escribe en nombre de otro
  if (nombreArchivo !== null && nombreArchivo !== nombreArchivoTorneo(pc)) return null;
  const tomar = (l) => (Array.isArray(l) ? l.slice(0, TORNEO.maxEntradasArchivo) : []);
  const entradas = fundirEntradas(tomar(v.entradas)).map((e) => ({ ...e, pc }));
  const amigos = fundirEntradas(tomar(v.amigos)).map((e) => ({ ...e, pc: '' })).slice(-TORNEO.maxAmigos);
  return { pc, nombre: sanearNombre(v.nombre), entradas, amigos };
}
// Varias lecturas de la carpeta ([{ nombre, texto }]) → todas las entradas, saneadas
export function leerCarpetaTorneo(archivos) {
  const lista = Array.isArray(archivos) ? archivos.slice(0, TORNEO.maxArchivos) : [];
  const todas = [];
  for (const a of lista) {
    if (!a || typeof a !== 'object' || typeof a.nombre !== 'string' || !NOMBRE_ARCHIVO_TORNEO.test(a.nombre)) continue;
    const r = leerArchivoTorneo(a.texto, a.nombre);
    if (r) todas.push(...r.entradas, ...r.amigos);
  }
  return fundirEntradas(todas);
}

// ---------------------------------------------------------------- el código para amigos
// HT1.2026S40.Nombre.52.61234.3.17.firma — la semana, el nombre (sin espacios ni acentos),
// el pez en cm, la carrera en ms, noches, abatidos y una firma corta (para los errores de
// tipeo, no es seguridad: el que quiere trampear, trampea).
function firma(texto) { return hashTexto(`ht1|${texto}`).toString(36).slice(0, 5); }
const nombreCodigo = (s) => sanearNombre(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 18);
export function codigoPuntaje(e) {
  const x = sanearEntrada(e);
  if (!x) return '';
  const cuerpo = ['HT1', x.semana.replace('-', ''), nombreCodigo(x.nombre) || 'x', x.pesca, x.carreraMs, x.noches, x.abatidos].join('.');
  return `${cuerpo}.${firma(cuerpo)}`;
}
export function leerCodigoPuntaje(texto) {
  if (typeof texto !== 'string') return null;
  const s = texto.trim().replace(/\s+/g, '');
  if (s.length > 120) return null;
  const m = /^HT1\.(\d{4})S(\d{2})\.([A-Za-z0-9_-]{1,18})\.(\d{1,3})\.(\d{1,7})\.(\d{1,3})\.(\d{1,5})\.([a-z0-9]{1,5})$/.exec(s);
  if (!m) return null;
  const cuerpo = s.slice(0, s.lastIndexOf('.'));
  if (firma(cuerpo) !== m[8]) return null;
  return sanearEntrada({ semana: `${m[1]}-S${m[2]}`, nombre: m[3].replace(/_/g, ' '), pesca: +m[4], carreraMs: +m[5], noches: +m[6], abatidos: +m[7], t: 0 });
}
// Un amigo pegó su código: queda en la lista (lo mejor, si ya estaba)
export function sumarAmigo(local, entrada) {
  const e = sanearEntrada(entrada);
  if (!e) return false;
  // 3.5.1: el código lleva el nombre sin acentos ni signos: se compara igual ("José" pegando su propio código no se suma dos veces)
  const comoCodigo = (s) => nombreCodigo(s).replace(/_/g, ' ').trim().toLocaleLowerCase('es');
  if (e.nombre.toLocaleLowerCase('es') === nombreVisible(local).toLocaleLowerCase('es') || comoCodigo(e.nombre) === comoCodigo(nombreVisible(local))) return false;
  local.amigos = recortarSemanas(fundirEntradas(local.amigos, [{ ...e, pc: '' }])).slice(-TORNEO.maxAmigos);
  return true;
}
// La defensa: el récord del Desafío con el código de la semana (desafio.js lo guarda por código)
export function defensaDeRecords(records, torneo) {
  const c = normalizarCodigo(torneo?.codigo);
  const r = c && records && typeof records === 'object' && Object.hasOwn(records, c) ? records[c] : null;
  return r ? { noches: entero(r.noches, 0, 999), abatidos: entero(r.abatidos, 0, 99999) } : { noches: 0, abatidos: 0 };
}
