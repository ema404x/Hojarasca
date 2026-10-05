// 3.6 (mecánicas): lo que se puede hacer en cada lugar de la Aldea de los Duendes, y lo que la
// hace sentirse viva (PLAN_ALDEA §14). Sin economía nueva: todo usa lo que ya existe (el
// cuaderno, el descanso y el entumecido, el correo, el tren, la música, las charlas).
//
// Módulo puro (se prueba en Node): las reglas, los textos y el guardado (`progreso.mecanicas`).
// Lo que usa three, el DOM y el sonido está en aldea-mecanicas-mundo.js; main.js lo engancha en
// bloques «3.6 (mecánicas)».
//
// Lo que hay:
//   · sentarse en los bancos y sillas de la aldea (los `asiento-k` de aldea-arquitectura.js pasan a
//     ser sentaderos, como los de siempre, con el nombre de dónde te sentás);
//   · plaza: el aljibe (un trago de agua fresca: un rato descansado, una vez por día), la bandera
//     (la iza el jefe de estación a las 8 y la arría a las 19) y la plaquita del duende tallado;
//   · biblioteca: un libro en cada mesa de lectura, el préstamo en el mostrador (se lee en el
//     refugio) y los cuentos del domingo con la abuela (escuchados sentados, dejan un recuerdo);
//   · escuela: el pizarrón con lo que enseñó la maestra y los dibujos de los chicos (de lo que
//     anotaste en el cuaderno);
//   · estación: la campana del andén cuando llega el tren y el horario de trenes;
//   · casa de té: sentado a la mesa, la galesa trae el té (el `servir` de siempre);
//   · el gesto de cada oficio mientras su dueño trabaja (fragua, horno, rueca, colmenas, sierra);
//   · el salón: el baile del sábado de 17 a 19 con el músico;
//   · el puesto sanitario: la camilla (el mismo descanso que da la enfermera, una vez por día);
//   · la estafeta: tus casillas (las cartas, como el correo); la seccional: el mapa del valle con
//     lo que te falta ver;
//   · las estufas a leña: el entumecido (el frío de la 2.3) se va junto a ellas.
//   · 3.7.0 (integración), en la calle de la Loma: el telescopio del observatorio (de noche, con la cúpula
//     abierta), las cartas del cielo, el mapa de las cumbres del refugio andinista y el espejo de la costurería; el
//     gesto de las nuevas mientras trabajan (el torno de Malena y el humo de su horno, el pedal de la máquina de
//     Pocha, la cúpula y el telescopio de Valentina, que se abren de noche) y sus bancos y sillas para sentarse.
// Nada religioso, como en toda la aldea (pedido del usuario).
import { ENTRADAS } from './cuaderno.js';
import { LIBROS_ALDEA, LIBRO_ALDEA, PLACA_DUENDE } from './aldea-lecturas.js';
import { VECINOS_ALDEA, POBLADORES_ALDEA, localAbierto, rutinaAldea, diaSemanaDe, aldeaNueva, aplicarAlAldea, SERVICIO, suave01 as suave } from './aldea.js';

// ---------------------------------------------------------------- medidas
export const CERCA_GESTOS = 40;      // los gestos de los oficios, sólo a menos de esto (y apagados lejos)
export const LEJOS_MECANICAS = 220;  // más lejos de la aldea no se calcula nada
export const RADIO_ESTUFA = 2.3;     // a esta distancia de una estufa encendida se te va el entumecido
// El orden de prioridad de lo que se hace con E (y del aviso: es la misma lista y la misma función).
// Lo que se hace sentado va primero (sentado no hay otra cosa a mano); después la camilla, la
// estufa y lo que se mira o se usa parado.
export const ORDEN_MECANICAS = ['libro', 'libro-prestado', 'estufa', 'camilla', 'prestamo', 'aljibe', 'duende', 'pizarron', 'dibujos', 'horario', 'casillas', 'mapa',
  'telescopio', 'cartas-cielo', 'mapa-cumbres', 'espejo'];   // 3.7.0 (integración): las de la calle de la Loma
// Para cada una: hace falta estar sentado (true), parado (false) o da igual (null), el radio y el
// punto con nombre de aldea-arquitectura.js (en su edificio) de donde sale.
export const MECANICAS = {
  libro: { sentado: true, radio: 0.75, edificio: 'biblioteca' },
  'libro-prestado': { sentado: true, radio: 0, edificio: null },
  estufa: { sentado: null, radio: RADIO_ESTUFA, edificio: '*', punto: /^estufa(-\d+)?$/ },
  camilla: { sentado: false, radio: 1.5, edificio: 'puesto-sanitario', punto: 'camilla' },
  prestamo: { sentado: false, radio: 1.4, edificio: 'biblioteca', punto: 'adentro' },
  aljibe: { sentado: false, radio: 1.8, edificio: 'plaza', punto: 'aljibe' },
  duende: { sentado: false, radio: 2.0, edificio: 'plaza', punto: 'duende' },
  pizarron: { sentado: false, radio: 2.2, edificio: 'escuela', punto: 'pizarron' },
  dibujos: { sentado: false, radio: 1.8, edificio: 'escuela', punto: 'dibujos' },
  horario: { sentado: false, radio: 2.0, edificio: 'estacion', punto: 'horario-trenes' },
  casillas: { sentado: false, radio: 1.6, edificio: 'estafeta', punto: 'casillas' },
  mapa: { sentado: false, radio: 1.8, edificio: 'seccional', punto: 'mapa-valle' },
  // 3.7.0 (integración)
  telescopio: { sentado: null, radio: 1.3, edificio: 'observatorio', punto: 'telescopio' },
  'cartas-cielo': { sentado: false, radio: 1.8, edificio: 'observatorio', punto: 'cartas-cielo' },
  'mapa-cumbres': { sentado: false, radio: 1.8, edificio: 'refugio-andinista', punto: 'mapa-cumbres' },
  espejo: { sentado: false, radio: 1.5, edificio: 'costureria', punto: 'espejo' },
};
// Lo que dice el aviso de cada una (los de texto fijo; el préstamo dice qué libro).
export const AVISOS_MECANICAS = {
  libro: 'Leer un libro',
  estufa: 'Calentarte junto a la estufa',
  camilla: 'Recostarte en la camilla',
  prestamo: 'Pedir un libro prestado',
  aljibe: 'Sacar agua del aljibe',
  duende: 'Leer la plaquita del duende',
  pizarron: 'Mirar el pizarrón',
  dibujos: 'Mirar los dibujos de los chicos',
  horario: 'Mirar el horario de trenes',
  casillas: 'Abrir tu casilla de correo',
  mapa: 'Mirar el mapa del valle',
  telescopio: 'Mirar por el telescopio', 'cartas-cielo': 'Mirar las cartas del cielo', 'mapa-cumbres': 'Mirar el mapa de las cumbres', espejo: 'Mirarte en el espejo',   // 3.7.0 (integración)
};
export const avisoPrestado = (libro) => `Leer «${libro.titulo}», el libro prestado`;
export const avisoDevolver = (libro) => `Devolver «${libro.titulo}»`;

// 3.6.2: lo del lugar que, con alguien al lado, le gana a la charla (para hablarle hay que mirarlo de frente: el
// mostrador de la biblioteca con la abuela atendiendo). Leer el libro prestado sentado en tu casa no: la visita
// en tu mesa gana, como antes de la 3.6, y leer queda para cuando no hay visita o en el menú de la charla
// (3.7.0 (integración): el telescopio tampoco: Valentina trabaja parada al lado y hablarle va primero; mirar por el
// telescopio queda en el menú de su charla)
export const lugarTapaVecino = (tipo) => typeof tipo === 'string' && Object.hasOwn(MECANICAS, tipo) && tipo !== 'libro-prestado' && tipo !== 'telescopio';
// Lo del lugar que también está en el menú de la charla (con alguien al lado no te tapa lo que viniste a hacer)
export const MECANICAS_EN_LA_CHARLA = ['prestamo', 'casillas', 'horario', 'mapa', 'camilla', 'libro-prestado', 'telescopio'];

// Elegir, entre las que están a mano, la de más prioridad (y entre iguales, la más cercana).
// `cands`: [{ tipo, d }]. La usan el aviso y la tecla E: por eso tienen siempre el mismo orden.
export function elegirMecanica(cands) {
  let mejor = null, pm = Infinity, dm = Infinity;
  for (const c of cands || []) {
    const p = ORDEN_MECANICAS.indexOf(c?.tipo);
    if (p < 0) continue;
    if (p < pm || (p === pm && c.d < dm)) { mejor = c; pm = p; dm = c.d; }
  }
  return mejor;
}

// ---------------------------------------------------------------- el guardado
const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN);
const entero = (v, d = 0) => (Number.isFinite(num(v)) ? Math.floor(num(v)) : d);
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const TOPE_DIA = 1e6;
// Lo de una vez por día (el aljibe; la camilla usa el día de la enfermera, en la aldea).
export const USOS_DIARIOS = ['aljibe', 'prestamo'];
export function mecanicasNuevas() { return { usos: {}, prestado: null, prestamos: 0 }; }
export function sanearMecanicas(v) {
  const x = objeto(v) ? v : {};
  const usos = {};
  if (objeto(x.usos)) for (const k of USOS_DIARIOS) if (Object.hasOwn(x.usos, k) && entero(x.usos[k]) > 0) usos[k] = Math.min(TOPE_DIA, entero(x.usos[k]));
  const p = objeto(x.prestado) && typeof x.prestado.id === 'string' && Object.hasOwn(LIBRO_ALDEA, x.prestado.id)
    ? { id: x.prestado.id, dia: Math.max(1, Math.min(TOPE_DIA, entero(x.prestado.dia, 1))) } : null;
  return { usos, prestado: p, prestamos: Math.max(0, Math.min(TOPE_DIA, entero(x.prestamos))) };
}
export const yaHoy = (m, clave, dia) => !!m?.usos && Object.hasOwn(m.usos, clave) && m.usos[clave] === entero(dia, -1);
function usarHoy(m, clave, dia) { m.usos = objeto(m.usos) ? m.usos : {}; m.usos[clave] = entero(dia, 1); }

// ---------------------------------------------------------------- la plaza
// La bandera: se iza a las 8 y se arría a las 19, despacio (un cuarto de hora). 1 = arriba.
export const BANDERA = { iza: 8, arria: 19, dura: 0.25 };
// (3.6 (optimizar): `suave` es el suave01 de aldea.js)
export function izadaA(hora) {
  const h = ((num(hora) % 24) + 24) % 24;
  if (!Number.isFinite(h)) return 0;
  if (h < BANDERA.iza || h >= BANDERA.arria + BANDERA.dura) return 0;
  if (h < BANDERA.iza + BANDERA.dura) return suave((h - BANDERA.iza) / BANDERA.dura);
  if (h < BANDERA.arria) return 1;
  return 1 - suave((h - BANDERA.arria) / BANDERA.dura);
}
// ¿Se está moviendo ahora? (para el gesto del jefe en la soga)
export const banderaEnMovimiento = (hora) => { const f = izadaA(hora); return f > 0.001 && f < 0.999; };

// El aljibe: no hay cantimplora ni balde en el juego, y tampoco sed: es un trago de agua fresca
// que te deja un rato descansado (como un pedazo de pan), una vez por día. Después, sólo el trago.
export const ALJIBE = { descanso: 1 };
export function sacarAgua(m, dia) {
  if (yaHoy(m, 'aljibe', dia)) return { titulo: 'Agua fresca del aljibe', sub: 'Un trago, nada más: hoy ya te refrescaste', efectos: [] };
  usarHoy(m, 'aljibe', dia);
  return { titulo: 'Agua fresca del aljibe', sub: 'Subís el balde de la roldana y tomás un trago helado: caminás un rato más liviano', efectos: [{ campo: 'descansado', valor: ALJIBE.descanso }] };
}

// ---------------------------------------------------------------- la biblioteca
// El libro de cada mesa: el primero que no leíste; con todos leídos, uno distinto cada día.
export function libroParaLeer(entradas = {}, dia = 1) {
  const sin = LIBROS_ALDEA.filter((l) => !Object.hasOwn(entradas || {}, l.id));
  if (sin.length) return sin[0];
  return LIBROS_ALDEA[((entero(dia, 1) % LIBROS_ALDEA.length) + LIBROS_ALDEA.length) % LIBROS_ALDEA.length];
}
export const librosLeidos = (entradas = {}) => LIBROS_ALDEA.filter((l) => Object.hasOwn(entradas || {}, l.id)).length;
// El préstamo: uno por vez y uno por día; se lee sentado en el refugio (o en tu casa) y se devuelve
// en el mismo mostrador.
export function textoPrestamo(m, dia) {
  if (m?.prestado) return avisoDevolver(LIBRO_ALDEA[m.prestado.id]);
  if (yaHoy(m, 'prestamo', dia)) return null;
  return AVISOS_MECANICAS.prestamo;
}
export function pedirPrestado(m, entradas, dia) {
  if (m.prestado) return { ok: false, titulo: 'Ya tenés uno', sub: `Primero devolvé «${LIBRO_ALDEA[m.prestado.id].titulo}»` };
  if (yaHoy(m, 'prestamo', dia)) return { ok: false, titulo: 'Por hoy ya está', sub: 'Mañana te llevás otro' };
  const sin = LIBROS_ALDEA.filter((l) => !Object.hasOwn(entradas || {}, l.id));
  const l = sin.length ? sin[sin.length - 1] : LIBROS_ALDEA[(entero(dia, 1) * 5) % LIBROS_ALDEA.length];
  m.prestado = { id: l.id, dia: entero(dia, 1) };
  m.prestamos = entero(m.prestamos) + 1;
  usarHoy(m, 'prestamo', dia);
  return { ok: true, libro: l, titulo: `Te llevás «${l.titulo}»`, sub: 'Lo anotás en la libreta del mostrador. Se lee sentado, en el refugio' };
}
export function devolverLibro(m) {
  if (!m.prestado) return { ok: false };
  const l = LIBRO_ALDEA[m.prestado.id];
  m.prestado = null;
  return { ok: true, libro: l, titulo: `Devolviste «${l.titulo}»`, sub: 'Queda en el estante, para el que venga' };
}
// Los cuentos del domingo: la charla de la abuela, escuchada entera y sentado en la biblioteca, el
// domingo a la mañana, deja el recuerdo en el cuaderno.
export function cuentoEscuchado({ diaSemana, hora, sentado, enBiblioteca, completa, personas } = {}) {
  const h = num(hora);
  return diaSemana === 6 && h >= 9.5 && h < 12 && !!sentado && !!enBiblioteca && !!completa && Array.isArray(personas) && personas.includes('abuela');
}

// ---------------------------------------------------------------- la escuela
// Lo que se ve y se anota en el valle (lo que la maestra puede enseñar y los chicos dibujar).
const SECCIONES_DEL_VALLE = ['flora', 'frutos', 'fauna', 'peces', 'lugares', 'cielo'];
const anotadas = (entradas) => ENTRADAS.filter((e) => SECCIONES_DEL_VALLE.includes(e.seccion) && Object.hasOwn(entradas || {}, e.id));
const mezcla = (dia, k) => { let h = (entero(dia, 1) * 2654435761 + k * 40503) >>> 0; h ^= h >>> 13; return h >>> 0; };
const primeraOracion = (t) => { const s = String(t || ''); const i = s.indexOf('. '); return i > 0 ? s.slice(0, i + 1) : s; };
export function pizarronDelDia(entradas = {}, dia = 1) {
  const lista = anotadas(entradas);
  const maestra = POBLADORES_ALDEA.maestra?.nombre || 'la maestra';
  if (!lista.length) return ['En el pizarrón, con tiza: «Las plantas y los animales del valle». Abajo, una lista que todavía está en blanco.', `${maestra} la va llenando con lo que le cuentan los chicos. Si anotás algo en tu cuaderno, quizás mañana aparezca acá.`];
  const e = lista[mezcla(dia, 1) % lista.length];
  return [`En el pizarrón, con tiza y letra prolija: «Hoy aprendimos: ${e.nombre}».`, primeraOracion(e.texto), `Abajo, con otra letra: «Lo trajo anotado alguien que anda por el valle».`];
}
export function dibujosDeLosChicos(entradas = {}, dia = 1) {
  const lista = anotadas(entradas);
  const nene = VECINOS_ALDEA.nene?.nombre?.split(' ')[0] || 'el nene', nena = VECINOS_ALDEA.nena?.nombre?.split(' ')[0] || 'la nena';
  if (!lista.length) return ['En la pared, con chinches: un tren con mucho humo, la plaza con el duende y un sol con anteojos.', `Firman ${nene} y ${nena}. Hay lugar para más: dibujan lo que oyen contar del valle.`];
  const elegidos = [];
  for (let k = 0; elegidos.length < Math.min(3, lista.length) && k < 12; k++) { const e = lista[mezcla(dia, 10 + k) % lista.length]; if (!elegidos.includes(e)) elegidos.push(e); }
  const como = ['con crayones y mucho verde', 'con lápiz negro y las patas muy largas', 'pintado con acuarela que se corrió un poco'];
  return [
    'En la pared, con chinches, los dibujos de los chicos:',
    ...elegidos.map((e, i) => `«${e.nombre}», ${como[i % como.length]}. Firma ${i % 2 ? nena : nene}.`),
    'Dibujan lo que vos anotaste: alguien les contó.',
  ];
}

// ---------------------------------------------------------------- la estación
// El horario: con lo que expone trochita.js (`proximoTrenA`: metros y segundos hasta la parada) y
// cuántos minutos reales dura un día del juego.
const horaTexto = (h) => { const x = ((h % 24) + 24) % 24; const hh = Math.floor(x), mm = Math.floor((x - hh) * 60); return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; };
// Cuánto falta, dicho como lo diría el jefe de estación.
export function cuantoFalta(min) {
  const m = Math.max(1, Math.round(num(min) || 0));
  if (m < 60) return m === 1 ? 'un minuto' : `unos ${m} minutos`;
  const h = Math.floor(m / 60), r = Math.round((m % 60) / 10) * 10;
  const hs = h === 1 ? 'una hora' : `${h} horas`;
  return r === 0 ? `unas ${hs}`.replace('unas una', 'una') : r === 60 ? `unas ${h + 1} horas` : `${h === 1 ? 'una hora' : `unas ${h} horas`} y ${r} minutos`;
}
export function minutosDeJuego(segundos, duracionDia) { const d = num(duracionDia) > 0 ? num(duracionDia) : 24; return (Math.max(0, num(segundos) || 0) * 24) / d; }
export function horarioTrenes({ segundos = null, metros = null, enAnden = false, hora = 12, duracionDia = 24, parada = 'Aldea de los Duendes', vuelta = null } = {}) {
  const partes = [`Estación ${parada}. En el pizarrón, con tiza: «Pasa la trochita, para todas las estaciones del anillo».`];
  if (enAnden) partes.push('Ahora mismo el tren está en el andén. Si te apurás, lo alcanzás.');
  else if (Number.isFinite(num(segundos))) {
    const min = minutosDeJuego(segundos, duracionDia);
    const llega = horaTexto(num(hora) + min / 60);
    partes.push(min < 1.5 ? `El próximo tren está llegando: se oye el silbato. Llega a las ${llega}.` : `El próximo tren llega a las ${llega}: falta${/^un[oa]s /.test(cuantoFalta(min)) ? 'n' : ''} ${cuantoFalta(min)}.`);
    if (Number.isFinite(num(metros))) partes[partes.length - 1] += ` Viene a ${Math.round(num(metros))} metros de vía.`;
  } else partes.push('Hoy el horario está borrado: el tren viene cuando viene.');
  if (Number.isFinite(num(vuelta)) && num(vuelta) > 0) partes.push(`Da la vuelta entera al valle en ${cuantoFalta(minutosDeJuego(vuelta, duracionDia))}.`);
  return partes;
}

// ---------------------------------------------------------------- el puesto sanitario
// La camilla: el mismo descanso que da la enfermera (descansado y sin entumecido), gratis, una vez
// por día, y el mismo día de ella: si ya te revisó, la camilla sólo es un rato de descanso.
export function descansarEnCamilla(aldea, dia) {
  const a = aldea || aldeaNueva();
  const ya = !!a.usos && Object.hasOwn(a.usos, 'enfermera') && a.usos.enfermera === entero(dia, -1);
  if (ya) return { ok: false, titulo: 'Te recostás un rato', sub: 'Por hoy ya descansaste: la enfermera dice que mañana más', efectos: [] };
  const efectos = [{ tipo: 'jugador', campo: 'descansado', valor: SERVICIO.descanso }, { tipo: 'jugador', campo: 'entumecido', valor: 0 }, { tipo: 'aldea', campo: 'uso', valor: 'enfermera' }];
  aplicarAlAldea(a, efectos, dia);
  return { ok: true, titulo: 'Descansaste en la camilla', sub: `Te tapan con una frazada: vas a andar descansado unas ${SERVICIO.descanso} horas`, efectos: efectos.filter((f) => f.tipo === 'jugador') };
}

// ---------------------------------------------------------------- la seccional
// El mapa del valle: cuánto te falta ver de la fauna y de los lugares, con pistas generales.
export function faltanDelValle(entradas = {}, dia = 1) {
  const guarda = POBLADORES_ALDEA.guardaparque?.nombre?.split(' ')[0] || 'La guardaparque';
  const faltan = (sec) => ENTRADAS.filter((e) => e.seccion === sec && !Object.hasOwn(entradas || {}, e.id));
  const fauna = faltan('fauna'), lugares = faltan('lugares');
  const partes = [`En el mapa del valle, con alfileres de colores, están marcados los avistajes. ${guarda} se acerca con el cuaderno de la seccional.`];
  if (!fauna.length && !lugares.length) { partes.push('«No te falta nada: viste todos los animales y llegaste a todos los lugares. Ya podrías trabajar acá».'); return partes; }
  partes.push(`«Te faltan ${fauna.length} ${fauna.length === 1 ? 'animal' : 'animales'} y ${lugares.length} ${lugares.length === 1 ? 'lugar' : 'lugares'}».`);
  const pista = (lista, k) => (lista.length ? lista[mezcla(dia, k) % lista.length] : null);
  const a = pista(fauna, 3), l = pista(lugares, 4);
  if (a) partes.push(`Señala una zona del mapa: «De la fauna, por ejemplo: ${a.pista}»`);
  if (l) partes.push(`Y otra: «De los lugares: ${l.pista}»`);
  return partes;
}

// ---------------------------------------------------------------- el salón
// El baile del sábado de 17 a 19, con el salón abierto (llegó el músico). Ver rutinaAldea.
export function hayBaile(aldea, dia, hora) {
  const h = num(hora);
  return diaSemanaDe(dia) === 5 && localAbierto(aldea || aldeaNueva(), 'salon') && h >= 17 && h < 19;
}
// Lo que toca el músico: las melodías de siempre (personal-musica.js), una distinta por tanda.
export const TANDA_BAILE = ['zamba', 'milonga', 'huella', 'refugio'];
export const melodiaDelBaile = (dia, tanda = 0) => TANDA_BAILE[(entero(dia, 1) + entero(tanda)) % TANDA_BAILE.length];

// ---------------------------------------------------------------- los oficios
// El gesto de cada local, mientras su dueño trabaja: el emisor o la pieza que se mueve y quién.
export const GESTOS_OFICIO = {
  herreria: { quien: 'herrero', piezas: ['fuelle'], emisor: 'chispas', sonido: 'fragua' },
  panaderia: { quien: 'panadera', piezas: [], emisor: 'humo', sonido: null, desde: 6.5, hasta: 11.5 },
  hilanderia: { quien: 'tejedora', piezas: ['rueda-rueca'], emisor: null, sonido: null },
  'sala-miel': { quien: 'apicultor', piezas: [], emisor: 'abejas', sonido: 'colmenas', siempre: true },
  carpinteria: { quien: 'carpintero', piezas: [], emisor: null, sonido: 'sierra' },
  pescaderia: { quien: 'pescador', piezas: ['redes'], emisor: null, sonido: null },   // 3.6.2 (visual): la red que se mece
  // 3.7.0 (integración): Malena en el torno (y el horno de barro humea), Pocha con el pedal de la máquina de coser y
  // Valentina de noche, con la cúpula abierta y el telescopio apuntando por la ranura
  ceramica: { quien: 'ceramista', piezas: ['torno'], emisor: 'humo', sonido: null },
  costureria: { quien: 'modista', piezas: ['pedal'], emisor: null, sonido: null },
  observatorio: { quien: 'astronoma', piezas: ['cupula', 'telescopio'], emisor: null, sonido: null },
};
// ¿Está trabajando el dueño en su local (o en la puerta)? Con la rutina de la aldea.
export function trabajando(aldea, edificio, dia, hora) {
  const g = GESTOS_OFICIO[edificio];
  const a = aldea || aldeaNueva();
  if (!g || !localAbierto(a, edificio)) return false;
  const h = ((num(hora) % 24) + 24) % 24;
  if (g.siempre) return h >= 9 && h < 19;   // las abejas trabajan solas, de día
  if (Number.isFinite(g.desde) && (h < g.desde || h >= g.hasta)) return false;
  const r = rutinaAldea(g.quien, h, diaSemanaDe(dia), a);
  if (r.edificio !== edificio) return false;
  // la panadera prende el horno antes de abrir: a la mañana, aunque todavía esté adentro
  return r.lugar === 'local' || r.lugar === 'trabajo' || (edificio === 'panaderia' && r.lugar === 'casa');
}

// ---------------------------------------------------------------- sentarse
// Los asientos de la aldea que pasan a ser sentaderos: los de los lugares públicos y los bancos de
// afuera de las casas (adentro de una casa ajena no se sienta uno). La silla del escenario es del
// músico. El nombre dice dónde te sentás.
const DE_EDIFICIO = {
  plaza: 'de la plaza', biblioteca: 'de la biblioteca', escuela: 'de la escuela', salon: 'del salón', 'puesto-sanitario': 'del puesto sanitario',
  estafeta: 'de la estafeta', hilanderia: 'de la hilandería', seccional: 'de la seccional', carpinteria: 'de la carpintería', panaderia: 'de la panadería',
  herreria: 'de la herrería', pescaderia: 'de la pescadería', 'sala-miel': 'de la sala de miel',
  // 3.7.0 (integración): los de la calle de la Loma
  veterinaria: 'de la veterinaria', 'estudio-fotos': 'del estudio de fotos', 'refugio-andinista': 'del refugio andinista', herboristeria: 'de la herboristería',
  'taller-arte': 'del taller de arte', ceramica: 'de la cerámica', varadero: 'del varadero', observatorio: 'del observatorio', costureria: 'de la costurería',
};
const CASAS = new Set(['casa-jefe', 'casa-ercilia', 'casa-nelida', 'casa-abuela', 'casa-familia']);
export function asientoValido(nombre, edificio) {
  const n = String(nombre || '');
  if (!n || n === 'el músico' || /vivienda/.test(n)) return false;
  if (CASAS.has(edificio)) return /^el banco/.test(n);
  return true;
}
export function nombreAsiento(nombre, edificio) {
  const n = String(nombre || 'un asiento');
  if (/ de | del /.test(n) || !DE_EDIFICIO[edificio]) return n;
  return `${n} ${DE_EDIFICIO[edificio]}`;
}

// ---------------------------------------------------------------- el ambiente
// El murmullo de la plaza: de día y con gente.
export const hayMurmullo = (hora, enLaPlaza) => { const h = num(hora); return h >= 8.5 && h < 21 && entero(enLaPlaza) >= 2; };
// Los perros a lo lejos: de día y al atardecer.
export const hayPerros = (hora) => { const h = num(hora); return h >= 7 && h < 22; };
// Las abejas no salen en invierno ni con lluvia.
export const hayAbejas = (hora, invierno, lluvia) => { const h = num(hora); return h >= 9 && h < 19 && !(num(invierno) > 0.5) && !(num(lluvia) > 0.35); };

// ---------------------------------------------------------------- 3.7.0 (integración): la calle de la Loma
// El telescopio de Valentina: de día está tapado (al sol no se lo mira nunca); de noche, con la cúpula abierta, lo
// que muestra cambia con la noche: la Luna, Saturno, la Cruz del Sur, las Nubes de Magallanes, las Pléyades…
const CIELOS = [
  ['La Luna, tan cerca que parece que se le puede tocar el borde: los cráteres tienen sombra, como pozos de un camino de ripio.', 'Valentina dice que el mar de la Tranquilidad no tiene una gota de agua: le pusieron nombres de mar por las dudas.'],
  ['Saturno, chiquito y amarillento, con el anillo de costado como el ala de un sombrero.', '«La primera vez que lo vi me reí sola», dice Valentina. «No podía creer que fuera de verdad».'],
  ['La Cruz del Sur, y al lado el Saco de Carbón: una mancha negra donde no hay estrellas, porque el polvo las tapa.', '«Con la Cruz y los dos punteros se encuentra el sur sin brújula», te explica, y te muestra cómo.'],
  ['Las Nubes de Magallanes: dos manchones de luz que parecen nubes y son galaxias enteras, vecinas de la nuestra.', '«Desde el hemisferio norte no se ven», dice Valentina. «Son nuestras».'],
  ['Las Pléyades, siete hermanas muy juntas que en el ocular se vuelven decenas, azuladas, como escarcha en un vidrio.', 'Valentina las llama «las cabrillas», como les decía su abuela en el campo.'],
  ['Júpiter con sus cuatro lunas en fila, como cuentas de un collar. Una noche hay tres; otra, cuatro: se esconden detrás.', '«Galileo vio lo mismo con un telescopio peor que este», dice Valentina, orgullosa del suyo.'],
];
export function cieloDelTelescopio({ noche = false, abierta = 0, dia = 1, nublado = 0 } = {}) {
  if (!noche) return ['El telescopio está tapado con su funda. Una tarjeta, con la letra de Valentina: «De día no. Al sol no se lo mira nunca, ni de reojo».', 'Volvé de noche, cuando abre la cúpula.'];
  if (!(num(abierta) > 0.6)) return ['La cúpula todavía está cerrada: el telescopio apunta a la chapa.', 'Valentina la abre cuando sube a trabajar, a eso de las nueve.'];
  if (num(nublado) > 0.7) return ['Por el ocular, sólo nubes: grises, quietas, como algodón sucio.', '«Hay noches así», dice Valentina. «Se anota que estuvo nublado y se espera la próxima».'];
  return CIELOS[((entero(dia, 1) % CIELOS.length) + CIELOS.length) % CIELOS.length];
}
// Las cartas del cielo de las paredes del observatorio
export function cartasDelCielo() {
  return ['En la pared, la carta del cielo del sur, dibujada a mano: la Cruz, los punteros, Escorpio con su estrella roja y las Tres Marías, que acá se ven al revés.',
    'Al lado, el mapa de la Luna con los nombres de sus mares, y un planisferio de cartón que se gira para saber qué se ve cada noche del año.',
    'Abajo, con la letra de Valentina: «Primero se aprende a mirar sin aparatos. El telescopio viene después».'];
}
// El mapa de las cumbres de Rocío, en el refugio andinista
export function mapaDeLasCumbres() {
  return ['Un mapa de las cumbres del valle, con las sendas en rojo y los refugios marcados con un triangulito. Al lado de cada cerro, la altura y una fecha: cuándo subió Rocío.',
    'Hay cumbres con una cruz de lápiz: «no se sube en invierno». Otras, con un número de horas: lo que tarda una persona caminando tranquila, con descansos.',
    'Abajo, con chinches, una regla del refugio: «Avisar siempre adónde vas y a qué hora pensás volver. La montaña no apura; el que apura es uno».'];
}
// El espejo de la costurería, y lo que te dice Pocha (si está)
const DICHOS_ESPEJO = [
  '«Esa campera tiene más remiendos que un mapa», dice Pocha desde la máquina. «Traémela un día y te la dejo como nueva».',
  '«Parate derecho, que el espejo no cobra», te dice Pocha sin levantar la vista de la costura.',
  '«Te queda bien el gorro», dice Pocha. «Ahora, la bufanda… la bufanda es otro tema».',
];
export function espejoDeLaCosturera(dia = 1, conPocha = true) {
  const partes = ['En el espejo de pie te ves de cuerpo entero, con la ropa del valle, el barro de las botas y algo de pasto en el pelo.'];
  partes.push(conPocha ? DICHOS_ESPEJO[((entero(dia, 1) % DICHOS_ESPEJO.length) + DICHOS_ESPEJO.length) % DICHOS_ESPEJO.length] : 'Desde la pared, un cartel bordado: «Se hacen arreglos. Se toman medidas. Se cuentan chismes».');
  return partes;
}

// Todos los textos que se muestran (para la prueba: sin nada religioso).
export function textosMecanicas() {
  const t = [...Object.values(AVISOS_MECANICAS), ...PLACA_DUENDE.partes];
  for (const l of LIBROS_ALDEA) t.push(l.titulo, l.de, ...l.partes);
  t.push(...pizarronDelDia({}, 1), ...dibujosDeLosChicos({}, 1), ...horarioTrenes({ segundos: 120, metros: 300, hora: 10, vuelta: 900 }), ...faltanDelValle({}, 1));
  const m = mecanicasNuevas();
  const s = sacarAgua(m, 1), s2 = sacarAgua(m, 1);
  t.push(s.titulo, s.sub, s2.sub);
  const p = pedirPrestado(m, {}, 1); t.push(p.titulo, p.sub);
  const d = devolverLibro(m); t.push(d.titulo, d.sub);
  const c = descansarEnCamilla(aldeaNueva(), 1); t.push(c.titulo, c.sub);
  // 3.7.0 (integración)
  for (const x of CIELOS) t.push(...x);
  t.push(...cieloDelTelescopio({}), ...cieloDelTelescopio({ noche: true }), ...cieloDelTelescopio({ noche: true, abierta: 1, nublado: 1 }), ...cartasDelCielo(), ...mapaDeLasCumbres(), ...DICHOS_ESPEJO, ...espejoDeLaCosturera(1, false));
  return t;
}
