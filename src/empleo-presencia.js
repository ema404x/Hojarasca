// 4.4.2 · ¿Dónde está el jefe de un puesto a una hora de un día? Lo usa el empleo para no ofrecer turno cuando el vecino «que te dice qué hacer» no está en su
// local (día de fiesta, minga, baile del sábado con el salón abierto, su cumpleaños, una cita o un casamiento). Módulo sin DOM ni three: se prueba en Node.
// Mira lo mismo que mira la aldea, en el mismo orden: la cita y el casamiento (amor.js) primero, después la fiesta (`fiestaEn`, que pone fiestas-juego.js) y,
// por último, el horario de siempre (`rutinaAldea`, que ya sabe del baile y de los cumpleaños). No cambia nada: sólo mira.
import { rutinaAldea, diaSemanaDe, esCumpleanos, HORA_FIESTA } from './aldea.js';
import { rutinaPareja } from './amor.js';

const hora24 = (h) => ((Number(h) || 0) % 24 + 24) % 24;

// → { en: el edificio donde está (o null si anda por la plaza, el predio, la calle…), razon: por qué no está en su local (texto corto, «está en la minga») }
//   `fiestaEn(clave, dia, hora)` → la fecha de la fiesta a la que va a esa hora, o null.
export function dondeEstaElJefe(progreso, clave, dia, hora, fiestaEn = null) {
  const h = hora24(hora), d = Math.max(1, Math.floor(Number(dia) || 1)), ds = diaSemanaDe(d), aldea = progreso?.aldea || null;
  const r = rutinaPareja(progreso, clave, h, ds, d, aldea);
  if (r.lugar === 'cita') return { en: r.edificio || null, razon: 'tiene una cita' };
  if (r.lugar === 'boda') return { en: r.edificio || null, razon: 'se casa hoy' };
  let f = null;
  try { f = typeof fiestaEn === 'function' ? fiestaEn(clave, d, h) : null; } catch { f = null; }
  if (f) return { en: 'predio', razon: f.tipo === 'minga' ? 'está en la minga' : f.tipo === 'nevada' ? 'anda con la nevada' : 'está en la fiesta' };
  let razon = '';
  if (r.lugar === 'salon' || r.lugar === 'plaza') razon = diaSemanaDe(d) === 5 ? 'está en el baile del salón' : '';
  else if (esCumpleanos(clave, d) && h >= HORA_FIESTA[0] && h < HORA_FIESTA[1]) razon = 'está de cumpleaños';
  else razon = '';
  return { en: r.edificio || null, razon };
}
