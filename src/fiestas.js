// 3.7.5 (noticias): STUB de fiestas.js. El de verdad lo hace el equipo «fiestas» (las fiestas por estación, el día
// de la aldea, las fechas, la minga, el truco, la leyenda, la nevada solidaria). Esto es sólo la forma que usan
// las noticias, el calendario y los concursos mientras no se junten las ramas:
//   · FECHAS: [{ id, nombre, tipo, diaDelAnio (1 a 12), texto }];
//   · fechaDe(dia) → { id, nombre, tipo } | null: la fecha especial de un día de la partida;
//   · actividadesDeFiesta(fecha) → [{ id, tipo, nombre, texto, ... }]: lo que se hace en la fiesta. Los concursos
//     se suman acá (`actividadesDeConcurso`, de concursos.js): AL JUNTAR, el fiestas.js de verdad tiene que sumar
//     esa línea a su `actividadesDeFiesta`.
// Módulo puro.
import { actividadesDeConcurso } from './concursos.js';

const DIAS_ANIO = 12;
export const FECHAS = [
  { id: 'fiesta-verano', nombre: 'Fiesta del verano', tipo: 'fiesta', diaDelAnio: 3, texto: 'Baile, juegos y mesa larga en la plaza.' },
  { id: 'dia-aldea', nombre: 'Día de la aldea', tipo: 'aldea', diaDelAnio: 6, texto: 'El cumpleaños del pueblo.' },
  { id: 'fiesta-otono', nombre: 'Fiesta de la cosecha', tipo: 'fiesta', diaDelAnio: 7, texto: 'Lo de la huerta y los dulces, en la plaza.' },
  { id: 'fiesta-invierno', nombre: 'Fiesta de la nieve', tipo: 'fiesta', diaDelAnio: 11, texto: 'Fogón grande y chocolate.' },
];
const diaDelAnio = (dia) => ((Math.max(1, Math.floor(Number(dia) || 1)) - 1) % DIAS_ANIO) + 1;
export function fechaDe(dia) {
  const f = FECHAS.find((x) => x.diaDelAnio === diaDelAnio(dia));
  return f ? { id: f.id, nombre: f.nombre, tipo: f.tipo } : null;
}
export function actividadesDeFiesta(fecha, dia = null) {
  if (!fecha) return [];
  return [...actividadesDeConcurso(fecha, dia)];
}
