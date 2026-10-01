// 2.9: el tiempo que viene, escrito de antemano.
//
// Hasta la 2.8 el clima tiraba los dados cada tres a ocho minutos y el que venía se
// sabía con un solo cambio de anticipación (ver `pronostico.js`). Para que la estación
// meteorológica pueda decir qué pasa mañana y pasado —y acertar— el tiempo sale ahora
// de una semilla guardada en la partida: el día se parte en tramos de tres horas de
// juego y cada tramo tiene su tiempo (despejado, nublado o lluvia, que en invierno es
// nieve) y su viento. `clima.js` sigue ese programa; los vecinos lo siguen anunciando
// igual que antes, porque el «próximo» del clima ahora es el tramo que viene.
//
// Cada día tiene un carácter —bueno, variable, ventoso o de temporal— que reparte los
// tramos: así el pronóstico se puede decir en palabras («temporal del oeste, lluvia a la
// tarde») y la proporción de lluvia, nublado y sol queda como la de siempre.
//
// En el Desafío, además, la estación anuncia las noches: la del jefe, la final y las
// especiales (roja, eclipse, silenciosa, sin luces), que salen del mismo azar que usa
// `desafio.js` (ver `azarEspecial`).
//
// Puro, sin THREE.
import { hashTexto, generador } from './semilla.js';
import { ESPECIALES, NOCHE_FINAL, nocheEspecial, esNocheDeJefe, HORA_ATAQUE, HORA_AMANECER } from './desafio-reglas.js';
import { siguenLasNoches } from './desafio-nido.js';
import { especialSinFin } from './desafio-supervivencia.js';

export const TRAMO = 3;                  // horas de juego por tramo
export const TRAMOS_DIA = 24 / TRAMO;
export const VIENTO_FUERTE = 0.28;       // desde acá, el pronóstico dice «viento fuerte»

// La semilla del tiempo: se crea una vez por partida y se guarda (`progreso.meteo`).
export function sanearMeteo(m, azar = Math.random) {
  const x = m && typeof m === 'object' && !Array.isArray(m) ? m : {};
  const s = Math.floor(Number(x.semilla));
  return { semilla: Number.isFinite(s) && s > 0 && s < 2 ** 31 ? s : 1 + Math.floor(azar() * (2 ** 31 - 2)) };
}

const tirar = (semilla, ...claves) => generador(hashTexto(`meteo-${semilla}|${claves.join('|')}`))();

export const horaAbsoluta = (dia, horas) => dia * 24 + horas;
export const tramoDe = (horaAbs) => Math.floor(horaAbs / TRAMO);
export const diaDeTramo = (k) => Math.floor((k * TRAMO) / 24);

// El carácter del día. Los porcentajes están hechos para que, sumados, la lluvia, el
// nublado y el sol salgan como en el clima de antes (la mitad despejado, un quinto con
// agua).
export const CARACTERES = {
  bueno: { nombre: 'Buen tiempo', prob: 0.35, lluvia: 0, nublado: 0.2, viento: 0 },
  variable: { nombre: 'Variable', prob: 0.33, lluvia: 0.18, nublado: 0.4, viento: 0.08 },
  ventoso: { nombre: 'Ventoso', prob: 0.16, lluvia: 0.1, nublado: 0.4, viento: 0.36 },
  temporal: { nombre: 'Temporal del oeste', prob: 0.16, lluvia: 0.72, nublado: 0.26, viento: 0.3 },
};
const ORDEN_CARACTER = ['bueno', 'variable', 'ventoso', 'temporal'];

export function caracterDelDia(semilla, dia, modo = 'variable') {
  if (modo === 'despejado') return 'bueno';
  if (modo === 'lluvioso') return 'temporal';
  let u = tirar(semilla, 'dia', dia);
  for (const k of ORDEN_CARACTER) { if (u < CARACTERES[k].prob) return k; u -= CARACTERES[k].prob; }
  return 'variable';
}

// El tiempo de un tramo: 'despejado', 'nublado' o 'lluvia'. `modo` es el ajuste del
// clima: con «despejado» no llueve nunca; con «lluvioso», como antes, siete de cada diez.
export function tipoEnTramo(semilla, k, modo = 'variable') {
  if (modo === 'despejado') return 'despejado';
  const u = tirar(semilla, 'tramo', k);
  if (modo === 'lluvioso') return u < 0.7 ? 'lluvia' : 'nublado';
  const c = CARACTERES[caracterDelDia(semilla, diaDeTramo(k), modo)];
  return u < c.lluvia ? 'lluvia' : u < c.lluvia + c.nublado ? 'nublado' : 'despejado';
}

// Viento de más sobre el de cada tiempo (0 a ~0.45): los días ventosos y los temporales.
export function vientoEnTramo(semilla, k, modo = 'variable') {
  if (modo === 'despejado') return 0;
  const c = CARACTERES[caracterDelDia(semilla, diaDeTramo(k), modo)];
  return c.viento * (0.75 + tirar(semilla, 'viento', k) * 0.5);
}

// El programa que sigue `clima.js`. `ahora()` da la hora absoluta del juego (día·24 +
// horas), `segundosPorHora()` cuánto dura una hora de juego en segundos de reloj,
// `semilla()` y `modo()` lo guardado y el ajuste.
export function crearPrograma({ ahora, segundosPorHora, semilla, modo }) {
  return {
    tramo: () => tramoDe(ahora()),
    tipo: (k) => tipoEnTramo(semilla(), k, modo()),
    viento: (k) => vientoEnTramo(semilla(), k, modo()),
    // si cambia la partida, el clima se vuelve a poner al día (un cambio del ajuste lo
    // aplica main.js como siempre: el tramo que viene ya es con el ajuste nuevo)
    firma: () => `${semilla()}`,
    // segundos de reloj hasta que empiece el tramo `k`
    segundosHasta: (k) => Math.max(1, (k * TRAMO - ahora()) * segundosPorHora()),
  };
}

// ¿Es invierno ese día? Lo mismo que hace main.js con las estaciones en «auto»: el
// año dura doce días y el invierno ocupa, más o menos, del noveno al duodécimo.
export const DIAS_ANIO = 12;
export function inviernoDelDia(dia, estacion, horas = 12) {
  if (estacion === 'invierno') return true;
  if (estacion !== 'auto') return false;
  const fase = (((dia - 1 + horas / 24) % DIAS_ANIO) + DIAS_ANIO) % DIAS_ANIO / DIAS_ANIO;
  return fase > 0.68 && fase < 0.98;
}

// ---------------------------------------------------------------- el pronóstico
const PARTES = ['a la madrugada', 'a la mañana', 'a la tarde', 'a la noche'];
function partesTexto(partes) {
  if (partes.length >= 4) return 'todo el día';
  const t = partes.map((p) => PARTES[p]);
  return t.length <= 1 ? t.join('') : `${t.slice(0, -1).join(', ')} y ${t[t.length - 1]}`;
}

// Un día del pronóstico, desde la hora `desde` (0 a 24). Devuelve los tramos, lo que
// trae y el texto que se lee en la estación.
export function pronosticoDia(semilla, dia, { modo = 'variable', estacion = 'verano', desde = 0 } = {}) {
  const tramos = [];
  const lluvia = new Set(), nublado = new Set();
  let viento = 0;
  for (let i = 0; i < TRAMOS_DIA; i++) {
    const k = dia * TRAMOS_DIA + i;
    if ((i + 1) * TRAMO <= desde) continue;
    const tipo = tipoEnTramo(semilla, k, modo), v = vientoEnTramo(semilla, k, modo);
    tramos.push({ k, desde: i * TRAMO, tipo, viento: v });
    const parte = Math.floor((i * TRAMO) / 6);
    if (tipo === 'lluvia') lluvia.add(parte);
    if (tipo === 'nublado') nublado.add(parte);
    viento = Math.max(viento, v + (tipo === 'lluvia' ? 0.1 : 0));
  }
  const caracter = caracterDelDia(semilla, dia, modo);
  const invierno = inviernoDelDia(dia, estacion);
  const partesLluvia = [...lluvia].sort();
  // con la lluvia fuerte y el cielo cerrado viene la tormenta (ver `clima.js`)
  const hayAgua = partesLluvia.length > 0;
  const fuerte = viento >= VIENTO_FUERTE;
  const frases = [];
  if (hayAgua) frases.push(invierno ? `Nevada ${partesTexto(partesLluvia)}` : `Lluvia con tormenta ${partesTexto(partesLluvia)}`);
  else if (nublado.size >= 2) frases.push('Nublado, sin agua');
  else frases.push(invierno ? 'Despejado y frío' : 'Despejado');
  if (fuerte) frases.push('viento fuerte del oeste');
  else if (viento > 0.12) frases.push('algo de viento');
  if (invierno && !hayAgua) frases.push('helada a la madrugada');
  const texto = frases.map((f, i) => (i ? f : f[0].toUpperCase() + f.slice(1))).join(', ');
  return {
    dia, caracter, nombre: CARACTERES[caracter].nombre, tramos,
    lluvia: hayAgua, nieve: hayAgua && invierno, tormenta: hayAgua && !invierno,
    partesLluvia, viento: fuerte ? 'fuerte' : viento > 0.12 ? 'moderado' : 'calmo',
    texto,
  };
}

// El pronóstico de la estación: lo que queda de hoy, mañana y pasado.
export function pronostico(semilla, dia, horas, opciones = {}) {
  const dias = opciones.dias ?? 3;
  const salida = [];
  for (let i = 0; i < dias; i++) {
    const d = pronosticoDia(semilla, dia + i, { ...opciones, desde: i === 0 ? horas : 0 });
    if (d.tramos.length) salida.push({ ...d, cuando: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : 'Pasado mañana' });
  }
  return salida;
}

// ---------------------------------------------------------------- las noches del Desafío
// El azar de la noche especial. Con código de partida es el mismo de siempre (el de
// `semilla.js`); sin código, sale de la semilla del tiempo, así la estación lo sabe.
// `desafio.js` lo usa al decidir la noche.
export function azarEspecial(d, meteo, n) {
  if (d?.semilla) return generador(hashTexto(`${d.semilla}|${n}|especial`))();
  const s = Math.floor(Number(meteo?.semilla));
  if (Number.isFinite(s) && s > 0) return tirar(s, 'especial', n);
  return Math.random();
}

// Qué trae cada una de las próximas dos noches. `d` es el estado del Desafío.
export function nochesQueVienen(d, meteo, dia, horas, cuantas = 2) {
  if (!d) return [];
  const salida = [];
  // la noche de hoy empieza a las 20:30 (su clave es el día); de madrugada sigue la de ayer
  const enCurso = horas >= HORA_ATAQUE || horas < HORA_AMANECER;
  const claveHoy = horas < HORA_AMANECER ? dia - 1 : dia;
  let n = d.oleadas + 1, anterior = d.especial ?? d.especialAnterior ?? null;
  let clave = claveHoy;
  // si la de esta noche ya bajó, la que viene es la de mañana
  const yaBajo = enCurso && d.oleadaNoche === claveHoy;
  if (yaBajo) { clave = claveHoy + 1; anterior = d.especial ?? null; }
  else if (d.especial && d.oleadaNoche !== claveHoy) anterior = d.especialAnterior ?? null;
  const cuandoEs = (c) => (c < dia || c === dia ? 'Esta noche' : c === dia + 1 ? 'Mañana a la noche' : 'Pasado mañana a la noche');
  for (let i = 0; i < cuantas; i++, n++, clave++) {
    const cuando = cuandoEs(clave);
    if (!siguenLasNoches(d)) { salida.push({ clave, n, cuando, tipo: 'calma', texto: 'Noche tranquila: ya no baja nadie' }); continue; }
    const final = !d.victoria && !d.sinFin && !d.asedio && n >= NOCHE_FINAL;   // 3.0: la corrida sin fin no tiene noche final (ni el asedio: la nodriza ya bajó)
    const jefe = esNocheDeJefe(n);
    // la de esta noche puede estar ya decidida (una hora antes del ataque)
    const yaDecidida = i === 0 && !yaBajo && d.especial && d.oleadaNoche !== clave;
    const especial = final ? null : yaDecidida ? d.especial : (d.sinFin ? especialSinFin : nocheEspecial)(n, azarEspecial(d, meteo, n), anterior);
    const tipo = final ? 'final' : jefe ? 'jefe' : especial || 'comun';
    const texto = final ? 'Baja la nave nodriza'
      : jefe ? 'Baja un jefe de nido'
      : especial ? `${ESPECIALES[especial].nombre}: ${ESPECIALES[especial].aviso.toLowerCase()}`
      : 'Ataque de siempre';
    salida.push({ clave, n, cuando, tipo, especial, texto });
    anterior = especial;
  }
  return salida;
}

// El texto que se lee en la estación (y en el aviso de la radio).
export function textoPronostico(dias, noches = []) {
  const partes = dias.map((d) => `${d.cuando}: ${d.texto}.`);
  for (const n of noches) partes.push(`${n.cuando}: ${n.texto}.`);
  return partes.join(' ');
}
