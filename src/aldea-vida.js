// 3.7.0: la vida de la Aldea de los Duendes, la que pasa alrededor de la gente (PLAN_3_7.md): el
// calendario del año con los cumpleaños (y las fiestas, que suma la 3.7.3), los visitantes que bajan del
// tren y preguntan por un lugar del valle, los animales de la aldea y el cachorro de la Chola que podés
// adoptar, el apodo que te ganás según lo que más hacés, la visita de tu familia, las cartas de la aldea
// cuando pasás muchos días sin ir y el ajuste «ritmo de la aldea» (tranquilo, normal o animado), que dice
// cuánto de todo eso pasa.
//
// Los chicos que crecen y los cumpleaños de cada uno son de aldea.js (los usan los horarios); lo de acá se
// guarda en `progreso.vidaAldea` (`sanearVidaAldea`), sólo en el Relax.
//
// Sin economía nueva (nadie cobra ni vende) y nada religioso (pedido del usuario). Módulo puro: sin three
// ni DOM (se prueba en Node). Lo conectan aldea-gente.js (la gente, los visitantes, la familia, el
// cuaderno) y aldea-animales-mundo.js (los perros, los caballos, las gallinas y el cachorro).
import { DIAS_ANIO, diaDelAnio, CUMPLES_ALDEA, cumpleDe, fiestaDeCumple, festejaCumple, noventaDeLaAbuela, ORDEN_PERSONAS_ALDEA, ORDEN_VECINOS_ALDEA, VECINOS_DEL_VALLE, personaAldea, esVecinoAldea, esPobladorAldea, POBLADORES_ALDEA, NOMBRE_ALDEA, obraEnCurso, etapaDe, EDIFICIOS_ALDEA, LOTE_DE, localAbierto, num, azar, quienLlega } from './aldea.js';

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, d = 0) => (Number.isFinite(num(v)) ? Math.floor(num(v)) : d);
const TOPE_DIA = 1e6;
const diaValido = (v, d = 1) => Math.max(1, Math.min(TOPE_DIA, entero(v, d)));
const diaOCero = (v, tope = TOPE_DIA) => Math.max(0, Math.min(tope, entero(v, 0)));
const minus = (s) => (typeof s === 'string' && s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
const mayus = (s) => (typeof s === 'string' && s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const textoSano = (s, tope = 60) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f<>]/g, '').slice(0, tope) : null);
const unir = (l) => (l.length < 2 ? l[0] || '' : `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}`);

// ---------------------------------------------------------------- quiénes
// Los del valle también cumplen años (y te los cuenta el calendario). Ema pasó a llamarse Josefina (el id
// interno sigue siendo `ema`).
const NOMBRES_VALLE = { ramon: 'Don Ramón', nicanor: 'Nicanor', ema: 'Josefina', guarda: 'Elsa', ercilia: 'Ercilia' };
export const VALLE_CALENDARIO = ['ramon', 'nicanor', 'ema', 'guarda'];
export function nombreDe(k) {
  if (Object.hasOwn(NOMBRES_VALLE, k)) return NOMBRES_VALLE[k];
  const p = personaAldea(k);
  return p?.nombre || null;
}
export const nombreCortoDe = (k) => (Object.hasOwn(NOMBRES_VALLE, k) ? NOMBRES_VALLE[k] : nombreDe(k)?.split(' ')[0] || null);
// Los que el calendario cuenta: los vecinos de la aldea (con Ercilia), los pobladores que ya llegaron y los
// del valle.
export function personasDelCalendario(aldea) {
  const a = objeto(aldea) ? aldea : {};
  const llegaron = new Set((Array.isArray(a.pobladores) ? a.pobladores : []).map((p) => p?.clave));
  return [...ORDEN_PERSONAS_ALDEA.filter((k) => esVecinoAldea(k) || (esPobladorAldea(k) && llegaron.has(k))), ...VALLE_CALENDARIO];
}

// ---------------------------------------------------------------- el calendario
// El año del juego (el de main.js: doce días, con las estaciones que se ven): cuatro de verano, cuatro de
// otoño y cuatro de invierno.
export const ESTACIONES_ANIO = [
  { id: 'verano', nombre: 'Verano', desde: 1, hasta: 4 },
  { id: 'otono', nombre: 'Otoño', desde: 5, hasta: 8 },
  { id: 'invierno', nombre: 'Invierno', desde: 9, hasta: 12 },
];
export const estacionDelAnio = (dda) => ESTACIONES_ANIO.find((e) => dda >= e.desde && dda <= e.hasta) || ESTACIONES_ANIO[0];
// La fecha de un día de la partida: { dia, anio, diaDelAnio, estacion, nombreEstacion, diaDeEstacion, texto }.
export function fechaDe(dia) {
  const d = diaValido(dia, 1);
  const dda = diaDelAnio(d);
  const e = estacionDelAnio(dda);
  const de = dda - e.desde + 1;
  return { dia: d, anio: Math.floor((d - 1) / DIAS_ANIO) + 1, diaDelAnio: dda, estacion: e.id, nombreEstacion: e.nombre, diaDeEstacion: de, texto: `${de}.º día del ${minus(e.nombre)}, año ${Math.floor((d - 1) / DIAS_ANIO) + 1}` };
}
// Las fiestas del año. Las suma la 3.7.3 (fiestas por estación, día de la aldea, fechas patrias…), con
// esta forma: { id, nombre, diaDelAnio (1 a 12), texto, desdeAnio? (desde qué año de la partida) }.
export const FIESTAS_ALDEA = [];
export function sanearFiesta(f) {
  if (!objeto(f) || typeof f.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(f.id) || typeof f.nombre !== 'string' || !f.nombre) return null;
  const dda = entero(f.diaDelAnio, 0);
  if (dda < 1 || dda > DIAS_ANIO) return null;
  return { id: f.id, nombre: textoSano(f.nombre, 60), diaDelAnio: dda, texto: textoSano(f.texto, 200) || '', desdeAnio: Math.max(1, entero(f.desdeAnio, 1)) };
}
// Lo que pasa un día: los cumpleaños y las fiestas. `aldea`: para saber quién vive ya en la aldea;
// `fiestas`: las del año (FIESTAS_ALDEA si no se pasan).
export function eventosDelDia(dia, { aldea = null, fiestas = FIESTAS_ALDEA } = {}) {
  const d = diaValido(dia, 1), f = fechaDe(d);
  const lista = [];
  for (const k of personasDelCalendario(aldea)) if (cumpleDe(k) === f.diaDelAnio) lista.push({ tipo: 'cumple', clave: k, nombre: nombreDe(k), texto: `Cumpleaños de ${nombreDe(k)}` });
  for (const x of Array.isArray(fiestas) ? fiestas : []) {
    const s = sanearFiesta(x);
    if (s && s.diaDelAnio === f.diaDelAnio && f.anio >= s.desdeAnio) lista.push({ tipo: 'fiesta', id: s.id, nombre: s.nombre, texto: s.texto || s.nombre });
  }
  return lista;
}
// El aviso del día antes: { titulo, texto } o null.
// 3.7.0 (integración), decisión del usuario: se avisa sólo lo que se festeja (los cumpleaños de los más cercanos, los
// 90 de la abuela y las fiestas); los demás cumpleaños, el mismo día y sin fiesta (`avisoDelDia`).
export function avisoDiaAntes(dia, opciones = {}) {
  const manana = diaValido(dia, 1) + 1;
  const ev = eventosDelDia(manana, opciones).filter((e) => e.tipo !== 'cumple' || festejaCumple(opciones.aldea, e.clave, manana));
  if (!ev.length) return null;
  const cumples = ev.filter((e) => e.tipo === 'cumple');
  const fiestas = ev.filter((e) => e.tipo === 'fiesta');
  const fiesta = fiestaDeCumple(manana, opciones.aldea);
  if (fiesta?.noventa && !fiestas.length) return { titulo: 'Mañana la abuela Herminia cumple 90 años', texto: 'A la tardecita la festeja toda la aldea en la plaza. Un regalo que le guste vale el doble.' };
  const partes = [];
  if (cumples.length) partes.push(`${cumples.length === 1 ? 'cumple años' : 'cumplen años'} ${unir(cumples.map((e) => nombreCortoDe(e.clave)))}`);
  for (const x of fiestas) partes.push(minus(x.nombre));
  const donde = fiesta ? (fiesta.donde === 'plaza' ? 'A la tardecita festejan juntos en la plaza de la aldea. Un regalo que les guste vale el doble.' : `A la tardecita festeja en ${minus(EDIFICIOS_ALDEA[fiesta.edificio]?.nombre || 'su casa')}. Un regalo que le guste vale el doble.`) : 'Si lo ves, un regalo que le guste vale el doble.';
  return { titulo: `Mañana ${unir(partes)}`, texto: donde };
}
// 3.7.0 (integración): los que cumplen hoy sin fiesta (los que no son de los más cercanos): te enterás por una nota
// (cuando haya radio y diario, en la 3.7.3, por ahí). { titulo, texto } o null.
export function avisoDelDia(dia, opciones = {}) {
  const hoy = diaValido(dia, 1);
  const sin = eventosDelDia(hoy, opciones).filter((e) => e.tipo === 'cumple' && !festejaCumple(opciones.aldea, e.clave, hoy));
  if (!sin.length) return null;
  const uno = sin.length === 1;
  return { titulo: `Hoy ${uno ? 'cumple' : 'cumplen'} años ${unir(sin.map((e) => nombreCortoDe(e.clave)))}`, texto: uno ? 'No hace fiesta. Si lo cruzás, saludalo: un regalo que le guste vale el doble.' : 'No hacen fiesta. Si los cruzás, saludalos: un regalo que les guste vale el doble.' };
}
// El año en el cuaderno: los doce días con lo que pasa en cada uno. `dia`: hoy (marca el día y el año).
export function calendarioDelAnio(dia, opciones = {}) {
  const hoy = fechaDe(dia);
  const inicio = (hoy.anio - 1) * DIAS_ANIO;
  const filas = [];
  for (let k = 1; k <= DIAS_ANIO; k++) {
    const d = inicio + k;
    const e = estacionDelAnio(k);
    filas.push({ diaDelAnio: k, dia: d, estacion: e.id, nombreEstacion: e.nombre, hoy: d === hoy.dia, manana: d === hoy.dia + 1, eventos: eventosDelDia(d, opciones) });
  }
  return { anio: hoy.anio, hoy, filas };
}

// ---------------------------------------------------------------- el ritmo de la aldea
// El ajuste (en «Ajustes»: tranquilo, normal o animado): cuántos visitantes bajan del tren (la chance de
// cada día), cada cuántos días viene tu familia, a los cuántos días sin ir llega una carta de la aldea y
// cuánto esperan los vecinos entre una charla y otra (los chismes que escuchás al pasar).
export const ORDEN_RITMOS = ['tranquilo', 'normal', 'animado'];
export const RITMOS = {
  tranquilo: { visitante: 0.15, familia: 30, carta: 6, esperaCharla: 24, texto: 'Pocas visitas y pocos chismes: la aldea va a su paso.' },
  normal: { visitante: 0.3, familia: 20, carta: 4, esperaCharla: 12, texto: 'Lo de todos los días: alguna visita, alguna carta, la charla de la vereda.' },
  animado: { visitante: 0.55, familia: 12, carta: 3, esperaCharla: 6, texto: 'Mucha gente en el tren, cartas seguidas y vecinos que no paran de hablar.' },
};
export const sanearRitmo = (r) => (ORDEN_RITMOS.includes(r) ? r : 'normal');
export const ritmoDe = (r) => RITMOS[sanearRitmo(r)];

// ---------------------------------------------------------------- el estado (progreso.vidaAldea)
export const TOPE_GUIADOS = 30, TOPE_CARTAS = 12;
export function vidaNueva(dia = 1) {
  const d = diaValido(dia, 1);
  return {
    avisado: 0,                                       // el último día en que se avisó lo de mañana
    visitante: null, visitantesDia: 0, guiados: [],   // el que bajó del tren hoy y los que guiaste
    mascota: { estado: 'nada', desde: 0, nombre: null, ofrecido: 0, nacieron: 0 },
    apodo: null,                                      // el último apodo que se avisó
    familia: { proxima: d + 8, ultima: 0, quien: 'mama', cuenta: 0, aviso: 0, charlo: 0 },
    ultimaVisita: d, cartas: [], ultimaCarta: 0,      // la última vez que fuiste a la aldea y las cartas
  };
}
const NOMBRE_LUGAR = /^[a-z0-9-]{1,24}$/;
function sanearVisitante(v, tope) {
  if (!objeto(v) || !VISITANTES.some((x) => x.id === v.id) || typeof v.lugar !== 'string' || !Object.hasOwn(LUGARES_VISITA, v.lugar)) return null;
  const estado = ['anden', 'guiando', 'llego'].includes(v.estado) ? v.estado : 'anden';
  return { id: v.id, lugar: v.lugar, dia: Math.min(tope, diaValido(v.dia, 1)), estado };
}
// Todo saneado (un guardado roto o retocado no deja nada imposible). `hoy`: el día de la partida (ninguna
// fecha puede ser del futuro).
export function sanearVidaAldea(v0, hoy = null) {
  const tope = Number.isFinite(num(hoy)) ? diaValido(hoy, 1) : TOPE_DIA;
  const base = vidaNueva(Number.isFinite(num(hoy)) ? tope : 1);
  if (!objeto(v0)) return base;
  const x = v0;
  const m = objeto(x.mascota) ? x.mascota : {};
  const estadoM = ['nada', 'cachorros', 'adoptado'].includes(m.estado) ? m.estado : 'nada';
  const nombreM = textoSano(m.nombre, 20);
  const fam = objeto(x.familia) ? x.familia : {};
  const guiados = [];
  for (const g of Array.isArray(x.guiados) ? x.guiados : []) {
    if (!objeto(g) || !VISITANTES.some((q) => q.id === g.id) || typeof g.lugar !== 'string' || !Object.hasOwn(LUGARES_VISITA, g.lugar)) continue;
    guiados.push({ id: g.id, lugar: g.lugar, dia: Math.min(tope, diaValido(g.dia, 1)) });
  }
  const cartas = [];
  for (const c of Array.isArray(x.cartas) ? x.cartas : []) {
    if (!objeto(c) || !esCorresponsal(c.de) || !Array.isArray(c.texto)) continue;
    const texto = c.texto.map((s) => textoSano(s, 240)).filter(Boolean).slice(0, 6);
    if (texto.length) cartas.push({ de: c.de, dia: Math.min(tope, diaValido(c.dia, 1)), texto, leida: c.leida === true });
  }
  const visitante = sanearVisitante(x.visitante, tope);
  return {
    avisado: diaOCero(x.avisado, tope),
    visitante: visitante && visitante.dia === tope ? visitante : (Number.isFinite(num(hoy)) ? null : visitante),   // (el de otro día ya se fue)
    visitantesDia: diaOCero(x.visitantesDia, tope),
    guiados: guiados.slice(-TOPE_GUIADOS),
    mascota: {
      estado: estadoM,
      desde: estadoM === 'adoptado' ? Math.min(tope, diaValido(m.desde, tope)) : 0,
      nombre: estadoM === 'adoptado' ? (nombreM || MASCOTA.nombres[0]) : null,
      ofrecido: diaOCero(m.ofrecido, tope), nacieron: estadoM === 'nada' ? 0 : Math.min(tope, diaValido(m.nacieron, tope)),
    },
    apodo: APODOS.some((a) => a.id === x.apodo) ? x.apodo : null,
    familia: {
      proxima: Math.max(1, Math.min(tope + 60, entero(fam.proxima, base.familia.proxima))),
      ultima: diaOCero(fam.ultima, tope), quien: fam.quien === 'hermano' ? 'hermano' : 'mama',
      cuenta: diaOCero(fam.cuenta), aviso: diaOCero(fam.aviso, tope), charlo: diaOCero(fam.charlo, tope),
    },
    ultimaVisita: Math.min(tope, diaValido(x.ultimaVisita, base.ultimaVisita)),
    cartas: cartas.slice(-TOPE_CARTAS), ultimaCarta: diaOCero(x.ultimaCarta, tope),
  };
}

// ---------------------------------------------------------------- los visitantes del tren
// Mochileros y turistas que bajan en la aldea y preguntan por un lugar del valle. Si les decís que sí, te
// siguen; al llegar te dan las gracias y el lugar queda anotado en el cuaderno («Visitantes que guiaste»).
// Uno por vez, y como mucho uno por día (la chance de cada día la da el ritmo de la aldea).
export const VISITANTES = [
  { id: 'lena', nombre: 'Lena', de: 'una mochilera de Hamburgo', tipo: 'mochilera',
    colores: { ropa: '#c85a3a', abrigo: '#3a5a7a', gorro: 'gorro', pelo: '#d8b878', bufanda: '#e8d8b0' },
    saludo: 'Hola. Perdón mi castellano: lo aprendí en un libro y en tres colectivos.', despedida: 'Danke! Gracias, digo.' },
  { id: 'tomas', nombre: 'Tomás', de: 'un mochilero de Rosario', tipo: 'mochilero',
    colores: { ropa: '#4a6a3a', abrigo: '#2a3a2a', gorro: 'sombrero', pelo: '#3a2a1e', barba: '#4a3a2a' },
    saludo: '¡Buenas! ¿Esto es la Aldea de los Duendes? Pensé que era un chiste del guarda.', despedida: '¡Gracias, loco! Digo, vecino.' },
  { id: 'kenji', nombre: 'Kenji', de: 'un fotógrafo de Osaka', tipo: 'turista',
    colores: { ropa: '#2e2e3a', abrigo: '#8a8a7a', gorro: 'gorro', pelo: '#1a1614' },
    saludo: 'Buenas tardes. Muy lindo valle. Muy lindo tren pequeño.', despedida: 'Muchas gracias. Arigatō.' },
  { id: 'chela', nombre: 'Chela y Rubén', de: 'un matrimonio de jubilados de Mar del Plata', tipo: 'turistas',
    colores: { ropa: '#a87a9a', abrigo: '#5a4a6a', gorro: 'sombrero', pelo: '#c8c0b8', bufanda: '#e0d0c0' },
    saludo: 'Hola, querido. Rubén se quedó en el tren discutiendo con el guarda. Yo me adelanto.', despedida: 'Gracias, querido. Rubén te manda saludos, aunque no te conoce.' },
  { id: 'mateo', nombre: 'Mateo', de: 'un estudiante de geología de Córdoba', tipo: 'mochilero',
    colores: { ropa: '#7a6a3a', abrigo: '#4a3a2a', gorro: 'boina', pelo: '#5a3a22' },
    saludo: 'Hola. ¿Sabías que estas piedras tienen como diez millones de años? Perdón, me emociono.', despedida: 'Gracias. Te debo una piedra linda.' },
  { id: 'ana', nombre: 'Ana', de: 'una maestra de Neuquén de vacaciones', tipo: 'turista',
    colores: { ropa: '#5a7a8a', abrigo: '#3a4a5a', gorro: null, pelo: '#4a2e1e', bufanda: '#c8a868' },
    saludo: 'Buen día. Les voy a mostrar fotos de esto a mis alumnos y no me lo van a creer.', despedida: 'Gracias. Les voy a contar a los chicos que me guió un vecino del valle.' },
];
// Lo que preguntan (los lugares del valle que tienen dónde: el juego elige entre los que existen).
export const LUGARES_VISITA = {
  mirador: { nombre: 'el Mirador del Pehuén', pide: 'Me dijeron que desde el mirador se ve todo el lago y la cordillera entera.' },
  arrayanes: { nombre: 'el bosque de arrayanes', pide: 'Quiero ver los arrayanes: dicen que la corteza parece de canela.' },
  cascada: { nombre: 'el salto del arroyo', pide: 'En el tren me hablaron de un salto de agua que se escucha antes de verse.' },
  cueva: { nombre: 'la Cueva de las Manos', pide: 'Me contaron de una cueva con manos pintadas hace miles de años. ¿Es verdad?' },
  molino: { nombre: 'el molino de viento', pide: 'Desde el tren vi un molino con aspas. ¿Se puede llegar caminando?' },
  faro: { nombre: 'el faro del lago', pide: 'Un faro en un lago de montaña. Eso lo tengo que ver.' },
  puente: { nombre: 'el puente de troncos', pide: 'Busco el puente de troncos del sendero, el de la foto de la postal.' },
  mallin: { nombre: 'el mallín', pide: 'Quiero ver el mallín, donde dicen que bajan los huemules a la tarde.' },
  torre: { nombre: 'la torre de los guardaparques', pide: 'Dicen que hay una torre de madera en el bosque, con una escalera larguísima.' },
  muelle: { nombre: 'el muelle del lago', pide: 'Me dijeron que en el muelle del lago pescan truchas así de grandes.' },
  galpon: { nombre: 'el galpón de esquila', pide: 'Quiero conocer un galpón de esquila de verdad. En la ciudad no hay.' },
  puesto: { nombre: 'el Puesto Alto', pide: 'Un señor del tren me dijo que en el Puesto Alto hay un puestero que sabe todo.' },
};
export const RADIO_GUIADO = 14;   // a cuántos metros del lugar ya llegaron
export const esVisitante = (id) => typeof id === 'string' && VISITANTES.some((v) => v.id === id);
export const visitanteDef = (id) => VISITANTES.find((v) => v.id === id) || null;
// ¿Baja alguien hoy? Se decide una vez por día (cuando el tren para en la aldea). `lugares`: los ids de
// LUGARES_VISITA que tienen dónde en este valle; `semilla`: la misma da lo mismo. Devuelve el visitante
// ({ id, lugar, dia, estado: 'anden' }) y lo deja en `vida.visitante`, o null.
export function visitanteDelDia(vida, dia, { ritmo = 'normal', lugares = Object.keys(LUGARES_VISITA), semilla = 0 } = {}) {
  if (!objeto(vida)) return null;
  const d = diaValido(dia, 1);
  if (vida.visitante || vida.visitantesDia >= d) return null;
  vida.visitantesDia = d;
  const posibles = (Array.isArray(lugares) ? lugares : []).filter((k) => Object.hasOwn(LUGARES_VISITA, k));
  if (!posibles.length) return null;
  const r = azar(d * 7919 + entero(semilla) * 31);
  if (r >= ritmoDe(ritmo).visitante) return null;
  const v = VISITANTES[Math.floor(azar(d * 104729 + 17) * VISITANTES.length) % VISITANTES.length];
  // (un lugar al que todavía no llevaste a nadie, si hay)
  const ya = new Set((vida.guiados || []).map((g) => g.lugar));
  const nuevos = posibles.filter((k) => !ya.has(k));
  const lista = nuevos.length ? nuevos : posibles;
  const lugar = lista[Math.floor(azar(d * 13 + 5) * lista.length) % lista.length];
  vida.visitante = { id: v.id, lugar, dia: d, estado: 'anden' };
  return vida.visitante;
}
// Lo que dice: al hablarle en el andén (y lo que pide), al aceptar, al llegar y al irse.
export function textosVisitante(v) {
  const def = visitanteDef(v?.id), l = LUGARES_VISITA[v?.lugar];
  if (!def || !l) return null;
  return {
    nombre: def.nombre, de: def.de, saludo: def.saludo, despedida: def.despedida,
    // (el saludo lo dice al hablarle, como todos: acá, lo que pide)
    pide: [l.pide, `¿Me llevarías hasta ${l.nombre}? Te sigo, prometo no perderme.`],
    seguir: 'E: vamos · Escape: ahora no',
    acepta: `¡Genial! Voy detrás tuyo. Avisame si camino muy despacio.`,
    yendo: `Te sigo. ${mayus(l.nombre)}, ¿falta mucho?`,
    gracias: [`¡Llegamos! ${mayus(l.nombre)}… es más lindo que en la postal.`, `Muchas gracias. Lo anoto en mi libreta: «Me trajo un vecino del valle». ${def.despedida}`],
  };
}
export function empezarGuia(vida) {
  if (!objeto(vida?.visitante) || vida.visitante.estado !== 'anden') return false;
  vida.visitante.estado = 'guiando';
  return true;
}
// Llegaron: queda anotado (`guiados`) y el visitante se queda un rato y se va. Devuelve lo anotado.
export function guiado(vida, dia) {
  const v = vida?.visitante;
  if (!objeto(v) || v.estado !== 'guiando') return null;
  v.estado = 'llego';
  const g = { id: v.id, lugar: v.lugar, dia: diaValido(dia, 1) };
  vida.guiados = [...(Array.isArray(vida.guiados) ? vida.guiados : []), g].slice(-TOPE_GUIADOS);
  return g;
}
export function visitanteSeVa(vida) { if (objeto(vida)) vida.visitante = null; }
// Para el cuaderno: «Lena, una mochilera de Hamburgo: el Mirador del Pehuén (día 12)».
export const lineaGuiado = (g) => { const d = visitanteDef(g.id), l = LUGARES_VISITA[g.lugar]; return d && l ? `${d.nombre}, ${d.de}: ${l.nombre} (día ${g.dia}).` : ''; };

// ---------------------------------------------------------------- los animales de la aldea
// Perros con nombre (te siguen un rato si pasás cerca), dos caballos atados al palenque de la plaza y
// gallinas en los patios. Dónde, en el plano de la aldea (aldea.js); los dibuja aldea-animales-mundo.js
// con las mallas de siempre (perro.js, caballo-mundo.js, gallinero-mundo.js). `requiere`: el que tiene que
// vivir ya en la aldea para que esté su animal.
export const ANIMALES_ALDEA = {
  perros: [
    { id: 'chola', nombre: 'Chola', de: 'jefe', casa: 'casa-jefe', pelo: '#a8804f', dibujo: 'pecho', collar: '#7c2f22' },
    { id: 'tango', nombre: 'Tango', de: 'padre', casa: 'casa-familia', pelo: '#2a2521', dibujo: 'manchado', collar: '#2f5a74' },
    { id: 'pampa', nombre: 'Pampa', de: 'guardaparque', casa: 'seccional', pelo: '#c9b89a', dibujo: 'liso', collar: '#5a6a3a', requiere: 'guardaparque' },
    { id: 'tizon', nombre: 'Tizón', de: 'herrero', casa: 'herreria', pelo: '#4a4038', dibujo: 'antifaz', collar: '#8a3a2a', requiere: 'herrero' },
  ],
  // los caballos atados al palenque, del lado de la calle Norte de la plaza (mirando al palenque)
  caballos: [
    { id: 'moro', nombre: 'el Moro', x: 1.5, z: 48.2, rot: 0, pelaje: 'moro' },
    { id: 'tostado', nombre: 'el Tostado', x: 6, z: 48.2, rot: 0, pelaje: 'tostado' },
  ],
  // las gallinas, en el patio de atrás de cada casa
  gallinas: [{ casa: 'casa-familia', n: 4 }, { casa: 'casa-abuela', n: 3 }, { casa: 'casa-nelida', n: 3 }],
};
// Cuánto te sigue un perro: si pasás a menos de `radio` m, te sigue unos `segundos` y vuelve a su casa; no
// te vuelve a seguir hasta `cada` segundos después.
export const SEGUIR_PERRO = { radio: 4.5, segundos: 45, cada: 90, lejos: 70 };
export function perrosPresentes(aldea) {
  const a = objeto(aldea) ? aldea : {};
  return ANIMALES_ALDEA.perros.filter((p) => !p.requiere || ((a.pobladores || []).some((x) => x.clave === p.requiere) && localAbierto(a, LOTE_DE[p.requiere])));
}

// ---------------------------------------------------------------- la mascota
// La Chola, la perra del jefe de estación, tiene cachorros (cuando ya conocés la aldea y, si llegó, después
// de que Ayelén, la veterinaria, se dio cuenta; si no, igual, al mes). Ernesto te ofrece uno al hablarle
// (una vez por día, hasta que digas que sí). El cachorro vive en tu refugio y crece: cachorro, joven,
// adulto.
export const MASCOTA = { desdeDescubierta: 3, sinVeterinaria: 30, conVeterinaria: 2, diasCachorro: 12, diasJoven: 24, nombres: ['Pichi', 'Lucero', 'Chispa', 'Tizón'], pelo: '#a8804f', dibujo: 'pecho' };
export function cachorrosNacen(vida, aldea, dia) {
  if (!objeto(vida) || vida.mascota?.estado !== 'nada') return false;
  const a = objeto(aldea) ? aldea : {};
  const d = diaValido(dia, 1);
  if (!a.descubierta || d < a.descubierta + MASCOTA.desdeDescubierta) return false;
  const vet = (a.pobladores || []).find((p) => p.clave === 'veterinaria');
  return d >= MASCOTA.sinVeterinaria || (!!vet && d >= vet.dia + MASCOTA.conVeterinaria);
}
export function nacenCachorros(vida, dia) {
  if (!objeto(vida) || vida.mascota?.estado !== 'nada') return false;
  vida.mascota = { ...vida.mascota, estado: 'cachorros', nacieron: diaValido(dia, 1) };
  return true;
}
// Lo que dice Ernesto al ofrecerte uno (o null si hoy ya te lo ofreció o no hay cachorros).
export function ofertaCachorro(vida, dia) {
  if (!objeto(vida) || vida.mascota?.estado !== 'cachorros' || vida.mascota.ofrecido >= diaValido(dia, 1)) return null;
  return {
    partes: [
      'La Chola tuvo cuatro cachorros en la boletería, al lado de la estufa. Tres ya tienen casa.',
      'Queda uno, barcino, con una mancha blanca en el pecho, el más curioso de todos. ¿Lo querés? En tu refugio va a estar mejor que entre los boletos.',
    ],
    seguir: 'E: me lo llevo · Escape: todavía no',
  };
}
export function ofrecido(vida, dia) { if (objeto(vida?.mascota)) vida.mascota.ofrecido = diaValido(dia, 1); }
export function adoptarMascota(vida, dia, nombre = null) {
  if (!objeto(vida) || vida.mascota?.estado !== 'cachorros') return null;
  const d = diaValido(dia, 1);
  const n = textoSano(nombre, 20) || MASCOTA.nombres[d % MASCOTA.nombres.length];
  vida.mascota = { ...vida.mascota, estado: 'adoptado', desde: d, nombre: n };
  return vida.mascota;
}
export function etapaMascota(m, dia) {
  if (!objeto(m) || m.estado !== 'adoptado') return null;
  const dias = diaValido(dia, 1) - diaValido(m.desde, 1);
  return dias < MASCOTA.diasCachorro ? 'cachorro' : dias < MASCOTA.diasJoven ? 'joven' : 'adulto';
}
// La talla (del perro grande = 1): crece de a poco, no de golpe.
export function tallaMascota(m, dia) {
  if (!objeto(m) || m.estado !== 'adoptado') return 0;
  const dias = Math.max(0, diaValido(dia, 1) - diaValido(m.desde, 1));
  return Math.round(Math.min(1, 0.45 + 0.55 * dias / MASCOTA.diasJoven) * 100) / 100;
}

// ---------------------------------------------------------------- el apodo
// Según lo que más hacés, en la aldea te ponen un apodo (el personaje del jugador es hombre). Cada uno se
// gana pasando un mínimo; si pasás varios, el que más (en proporción). Lo usan los vecinos al saludarte.
export const APODOS = [
  { id: 'pescador', texto: 'el pescador del valle', mide: (p) => Object.values(objeto(p?.peces) ? p.peces : {}).reduce((s, v) => s + (num(v?.cantidad ?? v) || 0), 0), minimo: 12 },
  { id: 'plantador', texto: 'el que planta árboles', mide: (p) => (Array.isArray(p?.renovales) ? p.renovales.length : 0), minimo: 8 },
  { id: 'fotografo', texto: 'el fotógrafo', mide: (p) => num(p?.fotos) || 0, minimo: 15 },
  { id: 'hachero', texto: 'el hachero del refugio', mide: (p) => Math.max(Array.isArray(p?.talados) ? p.talados.length : 0, num(p?.taladosTotal) || 0), minimo: 40 },
  { id: 'constructor', texto: 'el que levanta casas', mide: (p) => (Array.isArray(p?.obras) ? p.obras.length : 0), minimo: 25 },
  { id: 'naturalista', texto: 'el del cuaderno', mide: (p) => Object.keys(objeto(p?.entradas) ? p.entradas : {}).length, minimo: 110 },
  { id: 'viajero', texto: 'el de la trochita', mide: (p) => num(p?.vueltas) || 0, minimo: 10 },
];
export function apodoDe(progreso) {
  let mejor = null, puntaje = 1;
  for (const a of APODOS) {
    const n = a.mide(progreso);
    const s = Number.isFinite(n) ? n / a.minimo : 0;
    if (s >= puntaje) { mejor = a; puntaje = s; }
  }
  return mejor ? { id: mejor.id, texto: mejor.texto } : null;
}
export const apodoPorId = (id) => APODOS.find((a) => a.id === id) || null;
// Lo que dice un vecino cuando te ve, con el apodo (para el comentario de la charla).
export function fraseApodo(apodo, quien = '') {
  if (!apodo?.texto) return null;
  const a = apodo.texto;
  const lineas = [`¡Mirá quién vino: ${a}!`, `En la aldea ya todos te dicen ${a}. Te lo ganaste.`, `Ahí viene ${a}. ¿Qué nos traés hoy?`];
  return lineas[(quien.length + a.length) % lineas.length];
}

// ---------------------------------------------------------------- la visita de tu familia
// Tu mamá o tu hermano llegan en el tren de la mañana, pasan el día en el refugio y opinan de todo. Se
// turnan; cada cuántos días, según el ritmo de la aldea. El día antes te avisan.
export const FAMILIA = {
  mama: {
    nombre: 'Susana', llamada: 'tu mamá', oficio: 'tu mamá', mano: 'mate',
    colores: { ropa: '#7a5a6a', abrigo: '#4a3a4a', gorro: null, pelo: '#a89a8a', bufanda: '#d8b8a8' },
    saludo: '¡Hijo! Vení que te abrazo. Estás flaco. ¿Comés? Decime la verdad.', despedida: 'Abrigate, y escribí más seguido, que el tren trae cartas.',
    aviso: 'Mañana llega tu mamá en el tren de la mañana. Escribió: «Voy a ver cómo vivís. Ordená un poco».',
  },
  hermano: {
    nombre: 'Facundo', llamada: 'tu hermano', oficio: 'tu hermano', mano: null,
    colores: { ropa: '#3a5a4a', abrigo: '#2a3a3a', gorro: 'gorro', pelo: '#3a2a1e', barba: '#3a2a1e' },
    saludo: '¡Hermano! Mamá me mandó a ver si seguís vivo. Le voy a decir que sí, más o menos.', despedida: 'Me vuelvo antes de que me pongas a hachar. Abrazo.',
    aviso: 'Mañana viene tu hermano en el tren. Mandó un telegrama: «Llego mañana. Tené mate».',
  },
};
export const esFamilia = (k) => k === 'mama' || k === 'hermano';
export const HORAS_FAMILIA = [9, 19];   // llegan con el tren de la mañana y se vuelven a la tardecita
// ¿Viene hoy? (quien | null). Viene si llegó el día y es de día; no viene en el Desafío (eso lo ve quien llama).
export const familiaDeHoy = (vida, dia) => (objeto(vida?.familia) && diaValido(dia, 1) >= vida.familia.proxima && vida.familia.ultima < diaValido(dia, 1) ? vida.familia.quien : null);
export function avisoFamilia(vida, dia) {
  const f = vida?.familia;
  if (!objeto(f) || f.aviso >= diaValido(dia, 1) || diaValido(dia, 1) + 1 !== f.proxima) return null;
  f.aviso = diaValido(dia, 1);
  const q = FAMILIA[f.quien];
  return { titulo: `Mañana viene ${q.llamada}`, texto: q.aviso };
}
// Se fue: la próxima es del otro, a los días que diga el ritmo.
export function terminarVisitaFamilia(vida, dia, ritmo = 'normal') {
  const f = vida?.familia;
  if (!objeto(f)) return false;
  const d = diaValido(dia, 1);
  f.ultima = d; f.cuenta = Math.min(TOPE_DIA, (f.cuenta || 0) + 1);
  f.quien = f.quien === 'mama' ? 'hermano' : 'mama';
  f.proxima = d + ritmoDe(ritmo).familia;
  return true;
}
// Lo que opina de todo (4 renglones, según la partida). `extra`: { perro (su nombre), clima ('lluvia'…),
// amigos (cuántos compadres) }.
export function opinionesFamilia(quien, progreso, vida, extra = {}) {
  const mama = quien !== 'hermano';
  const p = objeto(progreso) ? progreso : {};
  const aldea = objeto(p.aldea) ? p.aldea : {};
  const lineas = [];
  const obras = Array.isArray(p.obras) ? p.obras.length : 0;
  if (obras < 3) lineas.push(mama ? '¿Y la casa? ¿Esto es todo? Hijo, con el frío que hace acá, por favor.' : 'Lindo el refugio. Chiquito, pero lindo. Bueno, chiquito.');
  else if (obras < 20) lineas.push(mama ? 'La casa está linda. Le falta una cortina, pero está linda.' : 'Esto ya parece una casa de verdad. Mamá no lo va a creer.');
  else lineas.push(mama ? '¡Pero esto es una estancia! ¿Lo hiciste vos solo? Tu padre no clavaba ni un cuadro.' : '¿Todo esto lo levantaste vos? Me voy a mudar. Es una amenaza.');
  const n = Array.isArray(aldea.pobladores) ? aldea.pobladores.length : 0;
  if (n >= 10) lineas.push(mama ? `En la aldea me saludó todo el mundo. ${n} vecinos nuevos, me dijo la del almacén. Y todos te conocen.` : `Me bajé en la aldea y parecía que llegaba el intendente: todos preguntaban por vos.`);
  else if (aldea.descubierta) lineas.push(mama ? 'La aldea es divina. La señora del almacén me regaló un caramelo, como si tuviera diez años.' : 'Pasé por la aldea. Tienen un duende tallado en la plaza. Le saqué una foto para mamá.');
  else lineas.push(mama ? 'El tren para en un pueblito al sur. ¿No fuiste nunca? Andá, que conocer gente hace bien.' : 'En el tren dicen que hay un pueblo escondido al sur. ¿Vos sabías? Típico: vivís acá y no sabés nada.');
  const ap = apodoDe(p);
  if (ap) lineas.push(mama ? `Un señor en el tren me dijo que acá te dicen «${ap.texto}». ¿Vos? ¡Si de chico no hacías nada!` : `Me enteré de que te dicen «${ap.texto}». Lo voy a contar en todos los asados.`);
  if (vida?.mascota?.estado === 'adoptado') lineas.push(mama ? `¿Y este cachorro? ¡Qué divino ${vida.mascota.nombre}! Dale de comer, que está flaco como vos.` : `${vida.mascota.nombre} me mordió el cordón. Me cae bien.`);
  else if (typeof extra?.perro === 'string' && extra.perro) lineas.push(mama ? `${extra.perro} está enorme. Ese perro te cuida más que vos.` : `${extra.perro} me reconoció. O me olió el sándwich, no sé.`);
  if (extra?.clima === 'lluvia' || extra?.clima === 'nieve') lineas.push(mama ? 'Y con este tiempo, vos sin bufanda. Tomá, te traje una.' : 'Qué clima, eh. Ahora entiendo por qué tenés tanta leña.');
  else lineas.push(mama ? 'Qué aire, hijo. Ahora entiendo por qué no volvés nunca.' : 'Te envidio, ¿sabés? Pero no le digas a mamá.');
  return lineas.slice(0, 4);
}

// ---------------------------------------------------------------- las cartas de la aldea
// Si pasás varios días sin ir (los que diga el ritmo), te escribe alguien de la aldea con las novedades:
// un amigo (el de más confianza que viva ahí) o Nélida, que escribe a todo el mundo. Quedan en el cuaderno.
const esCorresponsal = (k) => typeof k === 'string' && (esVecinoAldea(k) || esPobladorAldea(k));
export function cartaDeLaAldea(vida, progreso, dia, ritmo = 'normal') {
  if (!objeto(vida)) return null;
  const d = diaValido(dia, 1);
  const r = ritmoDe(ritmo);
  if (d - vida.ultimaVisita < r.carta || d - vida.ultimaCarta < r.carta) return null;
  const p = objeto(progreso) ? progreso : {};
  const a = objeto(p.aldea) ? p.aldea : {};
  if (!a.descubierta) return null;   // (todavía no la conocés: no tienen a quién escribirle)
  const fichas = objeto(p.vecindad?.personas) ? p.vecindad.personas : {};
  const viven = ORDEN_PERSONAS_ALDEA.filter((k) => esVecinoAldea(k) || (a.pobladores || []).some((x) => x.clave === k));
  const amigo = viven.filter((k) => Object.hasOwn(fichas, k) && (num(fichas[k]?.p) || 0) >= 50 && !['nene', 'nena'].includes(k)).sort((x, y) => (num(fichas[y]?.p) || 0) - (num(fichas[x]?.p) || 0))[0];
  const de = amigo || 'nelida';
  const novedades = [];
  if (a.llegando) novedades.push(`Bajó del tren ${nombreDe(a.llegando.clave)} y espera en el andén a que alguien le diga que se quede.`);
  const obra = obraEnCurso(a);
  if (obra) { const et = etapaDe(a, obra); novedades.push(`La obra de ${minus(EDIFICIOS_ALDEA[obra].nombre)} va por la etapa ${et.hechas + 1} de ${et.total}${et.lista ? ': los vecinos están trabajando' : ', y falta material'}.`); }
  for (const [lote, desde] of Object.entries(objeto(a.locales) ? a.locales : {})) if (d - entero(desde) <= r.carta) novedades.push(`Abrió ${minus(EDIFICIOS_ALDEA[lote]?.nombre || lote)}. Ya hay cola en la puerta.`);
  const manana = eventosDelDia(d + 1, { aldea: a }).filter((e) => e.tipo === 'cumple' && e.clave !== de);
  if (manana.length) novedades.push(`Mañana cumple años ${unir(manana.map((e) => nombreCortoDe(e.clave)))}. Si venís, traé algo rico.`);
  if (vida.mascota?.estado === 'cachorros') novedades.push('La Chola tuvo cachorros en la boletería. Ernesto anda repartiendo.');
  if (!novedades.length) novedades.push(quienLlega(a) ? 'Acá todo tranquilo. Dicen que pronto baja alguien más del tren.' : 'Acá todo tranquilo: la aldea está completa y el pan sale a horario.');
  const saludo = de === 'nelida' ? 'Querido vecino: le escribo de parte de toda la aldea, que pregunta por usted.' : `Querido amigo: hace días que no te vemos por la ${NOMBRE_ALDEA}.`;
  const firma = de === 'nelida' ? 'Nélida, la del almacén (Ercilia manda saludos y dice que le debés una visita).' : `${nombreCortoDe(de)}, que te espera.`;
  const carta = { de, dia: d, texto: [saludo, ...novedades.slice(0, 3), firma], leida: false };
  vida.cartas = [...(Array.isArray(vida.cartas) ? vida.cartas : []), carta].slice(-TOPE_CARTAS);
  vida.ultimaCarta = d;
  return carta;
}
// Fuiste a la aldea: se cuenta para las cartas.
export function fuisteALaAldea(vida, dia) { if (objeto(vida)) vida.ultimaVisita = Math.max(vida.ultimaVisita || 0, diaValido(dia, 1)); }

// ---------------------------------------------------------------- todos los cumpleaños, para el cuaderno
export function listaCumples(aldea) {
  return personasDelCalendario(aldea).map((k) => ({ clave: k, nombre: nombreDe(k), diaDelAnio: CUMPLES_ALDEA[k] })).filter((x) => x.diaDelAnio).sort((x, y) => x.diaDelAnio - y.diaDelAnio);
}
// (para las pruebas y el cuaderno: los que viven en la aldea, con Ercilia)
export const VECINOS_CALENDARIO = [...ORDEN_VECINOS_ALDEA, ...Object.keys(VECINOS_DEL_VALLE)];
export const POBLADORES_CALENDARIO = Object.keys(POBLADORES_ALDEA);
