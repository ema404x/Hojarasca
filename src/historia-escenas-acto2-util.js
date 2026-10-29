// 4.16.0 (B): ayudas PURAS para las escenas del ACTO II de la Historia (capítulos 5 a 8). Se apoyan en historia-escenas-util.js (los
// constructores del acto I) y le suman lo que el acto II necesita: personajes que el acto I no usaba (Tito, Tobías, Belisario, Nahuel,
// Lucía, Sofía y el cuaderno de Eusebio como «voz»), un fundido, un cambio de hora, una forma corta de poner una condición a un paso
// y las referencias de cámara que se repiten. Sin three ni DOM.
import { PERSONAJES_HISTORIA, personajesDe } from './historia-escenas-util.js';

// Los que el acto II suma. `clave`: la que tienen en el juego (aldea.js / gente-campo.js). El cuaderno y la libreta no son nadie: hablan como la nota.
export const PERSONAJES_ACTO2 = {
  tito: { clave: 'carpintero', nombre: 'Tito', color: '#b98a5c' },
  tobias: { clave: 'tobias', nombre: 'Tobías', color: '#9aa39a' },
  belisario: { clave: 'belisario', nombre: 'Belisario', color: '#c28f5a' },
  nahuel: { clave: 'nene', nombre: 'Nahuel', color: '#e0c06a' },
  lucia: { clave: 'nena', nombre: 'Lucía', color: '#d99ab0' },
  sofia: { clave: 'fotografa', nombre: 'Sofía', color: '#b59ad9' },
  cuaderno: { clave: null, nombre: 'El cuaderno', color: '#e8d9b0' },
  libreta: { clave: null, nombre: 'La libreta', color: '#e8d9b0' },
};

// Personajes de una escena del acto II: mezcla los del acto I (personajesDe) con los nuevos. Un nombre desconocido se ignora (la prueba lo atrapa).
export function pj(...nombres) {
  const r = personajesDe(...nombres.filter((n) => Object.hasOwn(PERSONAJES_HISTORIA, n)));
  for (const n of nombres) if (Object.hasOwn(PERSONAJES_ACTO2, n)) r[n] = { ...PERSONAJES_ACTO2[n] };
  return r;
}

export const FRENTE = (dist, lado = 0) => ({ frente: 'jugador', dist, lado });
// un fundido a negro (dura `dur` y la escena espera) y la vuelta
export const fundido = (a, o = {}) => ({ tipo: 'fundido', a, dur: 1.2, ...o });
// Un apagón: se va a negro, corren los pasos `medio` (cambiar la hora, poner un prop, hacer aparecer a alguien) y se vuelve. Es una LISTA de
// pasos (se usa con `...apagon([...])`). A propósito NO es un fundido «cruzado»: si el jugador saltea la escena en medio de un cruzado, el
// director descarta los pasos que iban a correr a mitad de camino; así, en cambio, los pasos son pasos comunes y el salto los aplica todos.
export const apagon = (medio, o = {}) => [fundido('negro', { dur: o.dur ?? 1 }), ...medio, fundido('claro', { dur: o.dur ?? 1 })];
export const hora = (a, o = {}) => ({ tipo: 'hora', a, dur: 3, ...o });
export const horaMas = (mas, o = {}) => ({ tipo: 'hora', mas, dur: 3, ...o });
// le pone una condición `si` a un paso ya armado
export const con = (paso, si) => ({ ...paso, si });
// la condición contraria
export const no = (si) => ({ ...si, no: true });
// la lazo de un personaje (para ramas según cómo te llevás)
export const lazoAl = (quien, min, max) => ({ cond: 'lazo', args: { quien, min, max } });
