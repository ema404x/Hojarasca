// 3.7.5 (noticias): el calendario completo (PLAN_3_7.md, «Detalles y extras elegidos»: cumpleaños, fiestas, fechas,
// aniversario, día de la aldea, con aviso el día antes). Los cumpleaños, las fiestas que se cargan en FIESTAS_ALDEA y el
// aviso de mañana ya los tenía aldea-vida.js (3.7.0): esto suma lo demás, como `extras` de su calendario
// ({ dia, tipo, id, nombre, texto }):
//   · las fechas de fiestas.js (`FECHAS`) que no estén ya en FIESTAS_ALDEA (las fiestas, el día de la aldea…);
//   · el aniversario de tu llegada al valle (desde el segundo año) y el de cuando conociste la aldea;
//   · el concurso de cada fiesta (concursos.js);
//   · el club de lectura de la biblioteca (una vez por semana) y la noche de estrellas abierta con Valentina (una vez
//     por semana, con el observatorio abierto).
// Y el aviso del día antes de todo eso (`avisoMananaExtra`), que se suma al de los cumpleaños.
// Módulo puro (sin three ni DOM).
import { DIAS_ANIO, diaDelAnio, diaSemanaDe, SEMANA, localAbierto, fiestaDeCumple, esVecinoAldea, esPobladorAldea, ORDEN_PERSONAS_ALDEA } from './aldea.js';
import { concursoDeFecha, CONCURSOS, HORAS_CONCURSO } from './concursos.js';
import { hashTexto, generador } from './semilla.js';

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const TOPE_DIA = 1e6;
const diaValido = (v, d = 1) => Math.max(1, Math.min(TOPE_DIA, Math.floor(num(v, d))));
const minus = (s) => (typeof s === 'string' && s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
// «la fiesta de la cosecha», «el día de la aldea»
export const conArticulo = (nombre) => `${/^(d[ií]a|aniversario|concurso)\s/i.test(nombre || '') ? 'el' : 'la'} ${minus(nombre)}`;
const horaTexto = (h) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return mm ? `${hh}:${String(mm).padStart(2, '0')}` : `${hh}`; };

// ---------------------------------------------------------------- las constantes (para decidir)
// El aniversario de tu llegada: el primer día de cada año, desde el segundo.
export const ANIVERSARIO = { diaDelAnio: 1, desdeAnio: 2 };
// El club de lectura: en la biblioteca, una vez por semana; lo lleva la abuela Herminia. `asisten`: cuántos vecinos van.
export const CLUB_LECTURA = { diaSemana: 2, desde: 18, hasta: 19.5, edificio: 'biblioteca', quien: 'abuela', asisten: 5 };
// La noche de estrellas abierta: Valentina baja el telescopio a la plaza, una vez por semana (con el observatorio abierto).
export const NOCHE_ESTRELLAS = { diaSemana: 5, desde: 21, hasta: 23, edificio: 'plaza', quien: 'astronoma', lote: 'observatorio', asisten: 7 };
// Los libros del club (uno por semana, en orden). Clásicos viejos del país y del sur; lo que dicen es de los vecinos.
export const LIBROS_CLUB = [
  { id: 'martin-fierro', titulo: 'Martín Fierro', autor: 'José Hernández', dicen: ['La abuela se sabe las estrofas de memoria y las dice antes que nadie.', 'Ernesto dice que el gaucho tenía razón en todo, menos en irse.'] },
  { id: 'cuentos-selva', titulo: 'Cuentos de la selva', autor: 'Horacio Quiroga', dicen: ['Los chicos piden el de las medias de los flamencos. Otra vez.', 'Gladys dice que acá la selva es el bosque de lengas, y que los cuentos andan igual.'] },
  { id: 'alla-lejos', titulo: 'Allá lejos y hace tiempo', autor: 'Guillermo Enrique Hudson', dicen: ['Lo de los pájaros de la llanura les gusta a todos. Ernesto anota los nombres.', 'La abuela dice que así era el campo cuando ella era chica, pero con más viento.'] },
  { id: 'juvenilia', titulo: 'Juvenilia', autor: 'Miguel Cané', dicen: ['Se ríen de las travesuras del colegio. La maestra se ríe más fuerte que nadie.', 'Ceinwen trae torta y nadie lee la última página porque se termina la torta.'] },
  { id: 'viaje-patagonia', titulo: 'Viaje a la Patagonia austral', autor: 'Francisco P. Moreno', dicen: ['Ernesto marca en el mapa de la estación por dónde pasó el perito.', 'Nadie puede creer que cruzaran todo esto a caballo y sin trochita.'] },
  { id: 'facundo', titulo: 'Facundo', autor: 'Domingo F. Sarmiento', dicen: ['Se arma discusión, como todos los años. La abuela pone orden con la campanita.', 'Gladys dice que es largo; la abuela dice que la vida también.'] },
];

// ---------------------------------------------------------------- las fechas de fiestas.js
// `fechas`: FECHAS de fiestas.js ({ id, nombre, tipo, diaDelAnio, texto }) o, mejor, su `fechaDe(dia)` → { id, nombre,
// tipo } | null (así no depende de cómo guarde las fechas); `ya`: ids que ya están en FIESTAS_ALDEA (no se repiten).
function fechasDelDia(dia, fechas, ya) {
  if (typeof fechas === 'function') { const f = fechas(diaValido(dia, 1)); return objeto(f) && typeof f.id === 'string' && !(ya || []).includes(f.id) ? [f] : []; }
  const dda = diaDelAnio(dia);
  return (Array.isArray(fechas) ? fechas : []).filter((f) => objeto(f) && typeof f.id === 'string' && Math.floor(num(f.diaDelAnio)) === dda && !(ya || []).includes(f.id));
}
// La fecha especial del día (la primera de `fechas` ese día, sin filtrar), para los concursos.
export function fechaDelDia(dia, fechas) {
  if (typeof fechas === 'function') { const f = fechas(diaValido(dia, 1)); return objeto(f) && typeof f.id === 'string' ? { id: f.id, nombre: f.nombre, tipo: f.tipo } : null; }
  const dda = diaDelAnio(dia);
  const f = (Array.isArray(fechas) ? fechas : []).find((x) => objeto(x) && Math.floor(num(x.diaDelAnio)) === dda);
  return f ? { id: f.id, nombre: f.nombre, tipo: f.tipo } : null;
}

// ---------------------------------------------------------------- el club y las estrellas
const hayFiestaOCumple = (dia, aldea, fechas) => !!fechaDelDia(dia, fechas) || !!fiestaDeCumple(dia, aldea);
export const libroDeLaSemana = (dia) => LIBROS_CLUB[Math.floor((diaValido(dia, 1) - 1) / 7) % LIBROS_CLUB.length];
// ¿Hay club hoy? (no en día de fiesta ni de cumpleaños festejado: ese día, todos van a la fiesta)
export const hayClub = (dia, aldea = null, fechas = []) => diaSemanaDe(diaValido(dia, 1)) === CLUB_LECTURA.diaSemana && !hayFiestaOCumple(dia, aldea, fechas);
export const clubAhora = (dia, hora, aldea = null, fechas = []) => hayClub(dia, aldea, fechas) && num(hora) >= CLUB_LECTURA.desde && num(hora) < CLUB_LECTURA.hasta;
export const hayEstrellas = (dia, aldea = null, fechas = []) => diaSemanaDe(diaValido(dia, 1)) === NOCHE_ESTRELLAS.diaSemana && localAbierto(aldea, NOCHE_ESTRELLAS.lote) && !hayFiestaOCumple(dia, aldea, fechas);
export const estrellasAhora = (dia, hora, aldea = null, fechas = []) => hayEstrellas(dia, aldea, fechas) && num(hora) >= NOCHE_ESTRELLAS.desde && num(hora) < NOCHE_ESTRELLAS.hasta;
// Quiénes van (sin el que la lleva): de los que viven en la aldea, unos cuantos, distintos cada semana.
export function asistentes(cual, dia, aldea = null) {
  const def = cual === 'club' ? CLUB_LECTURA : NOCHE_ESTRELLAS;
  const a = objeto(aldea) ? aldea : {};
  const llegaron = new Set((Array.isArray(a.pobladores) ? a.pobladores : []).map((p) => p?.clave));
  const lista = ORDEN_PERSONAS_ALDEA.filter((k) => k !== def.quien && k !== 'ercilia' && (esVecinoAldea(k) || (esPobladorAldea(k) && llegaron.has(k))));
  const r = generador(hashTexto(`${cual}-${Math.floor((diaValido(dia, 1) - 1) / 7)}`));
  const elegidos = [];
  while (lista.length && elegidos.length < def.asisten) elegidos.push(lista.splice(Math.floor(r() * lista.length) % lista.length, 1)[0]);
  return elegidos;
}

// ---------------------------------------------------------------- los extras de un día
// `opciones`: { aldea, fechas (FECHAS de fiestas.js), ya (ids que ya están en FIESTAS_ALDEA), llegada (el día en que
// llegaste: 1) }. Devuelve [{ dia, tipo, id, nombre, texto }].
export function extrasDelDia(dia, opciones = {}) {
  const d = diaValido(dia, 1);
  const a = objeto(opciones.aldea) ? opciones.aldea : null;
  const anio = Math.floor((d - 1) / DIAS_ANIO) + 1, dda = diaDelAnio(d);
  const lista = [];
  for (const f of fechasDelDia(d, opciones.fechas, opciones.ya)) lista.push({ dia: d, tipo: f.tipo === 'aldea' ? 'aldea' : 'fiesta', id: f.id, nombre: f.nombre, texto: f.texto || f.nombre });
  if (dda === ANIVERSARIO.diaDelAnio && anio >= ANIVERSARIO.desdeAnio) {
    const n = anio - 1;
    lista.push({ dia: d, tipo: 'aniversario', id: 'aniversario', nombre: `Aniversario de tu llegada (${n === 1 ? 'un año' : `${n} años`})`, texto: `Hace ${n === 1 ? 'un año' : `${n} años`} que llegaste al refugio.` });
  }
  const desc = Math.floor(num(a?.descubierta));
  if (desc > 0 && d > desc && (d - desc) % DIAS_ANIO === 0) {
    const n = (d - desc) / DIAS_ANIO;
    lista.push({ dia: d, tipo: 'aniversario', id: 'aniversario-aldea', nombre: `${n === 1 ? 'Un año' : `${n} años`} de que conociste la aldea`, texto: 'El día que bajaste por primera vez en la parada del sur.' });
  }
  const fecha = fechaDelDia(d, opciones.fechas);
  const conc = concursoDeFecha(fecha, d);
  if (conc) lista.push({ dia: d, tipo: 'concurso', id: `concurso-${conc}`, nombre: CONCURSOS[conc].nombre, texto: `En ${conArticulo(fecha.nombre)}: ${CONCURSOS[conc].trae}. Anota Nélida; el fallo, a las ${HORAS_CONCURSO.fallo}.` });
  if (hayClub(d, a, opciones.fechas)) { const l = libroDeLaSemana(d); lista.push({ dia: d, tipo: 'club', id: 'club-lectura', nombre: 'Club de lectura', texto: `En la biblioteca, de ${horaTexto(CLUB_LECTURA.desde)} a ${horaTexto(CLUB_LECTURA.hasta)}: «${l.titulo}», de ${l.autor}.` }); }
  if (hayEstrellas(d, a, opciones.fechas)) lista.push({ dia: d, tipo: 'estrellas', id: 'noche-estrellas', nombre: 'Noche de estrellas', texto: `Valentina baja el telescopio a la plaza, de ${horaTexto(NOCHE_ESTRELLAS.desde)} a ${horaTexto(NOCHE_ESTRELLAS.hasta)}. Abierta a todos.` });
  return lista;
}
// Los del año del día `dia` (los doce días), para el calendario del cuaderno.
export function extrasDelAnio(dia, opciones = {}) {
  const d = diaValido(dia, 1);
  const inicio = Math.floor((d - 1) / DIAS_ANIO) * DIAS_ANIO;
  const lista = [];
  for (let k = 1; k <= DIAS_ANIO; k++) lista.push(...extrasDelDia(inicio + k, opciones));
  return lista;
}
// Cómo se nombra un extra en la lista del calendario
export function etiquetaExtra(e) {
  if (!objeto(e)) return '';
  if (e.tipo === 'club') return 'club de lectura';
  if (e.tipo === 'estrellas') return 'noche de estrellas';
  if (e.tipo === 'concurso') return minus(e.nombre);
  return e.nombre;
}

// ---------------------------------------------------------------- el aviso del día antes
// Lo de mañana que no avisa aldea-vida.js (los cumpleaños y FIESTAS_ALDEA ya los avisa): las fechas, el aniversario, el
// concurso y la noche de estrellas (el club es de todas las semanas: lo dice la radio). { titulo, texto } o null.
export function avisoMananaExtra(dia, opciones = {}) {
  const manana = diaValido(dia, 1) + 1;
  const ev = extrasDelDia(manana, opciones).filter((e) => e.tipo !== 'club');
  if (!ev.length) return null;
  const nombres = ev.map((e) => (e.tipo === 'concurso' ? `el ${minus(e.nombre)}` : e.tipo === 'estrellas' ? 'noche de estrellas con Valentina' : minus(e.nombre)));
  const unir = (l) => (l.length < 2 ? l[0] : `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}`);
  const conc = ev.find((e) => e.tipo === 'concurso');
  const texto = conc ? `${conc.texto}` : ev[0].texto;
  return { titulo: `Mañana: ${unir(nombres)}`, texto };
}
// El nombre del día de la semana (para la radio y el diario)
export const nombreDiaSemana = (dia) => SEMANA[diaSemanaDe(diaValido(dia, 1))];
