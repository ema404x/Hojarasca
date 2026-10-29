// 4.17.0 (B): ayudas PURAS para las escenas del ACTO III de la Historia (capítulos 9 a 13). Se apoyan en historia-escenas-util.js (los
// constructores del acto I) y en historia-escenas-acto2-util.js (personajes del acto II, apagon, hora, con, no…) y le suman lo que el acto III
// necesita: los personajes nuevos (Marta, Martín, Anselmo, Guido, Elvira y «tu pareja»), las CONDICIONES nuevas (el trato, la noche, el nivel
// del ramal, la deuda, si convidaste, si estás en pareja con el amor prendido…) y los EFECTOS nuevos (`duendes:`, `noche:`, `armas:`,
// `perfil:`) con su propio parser (el de historia-escenas-util.js no los conoce y no se tocó). Sin three ni DOM.
import { PERSONAJES_HISTORIA, parsearEfecto, CONDICIONES_HISTORIA } from './historia-escenas-util.js';
import { PERSONAJES_ACTO2, pj } from './historia-escenas-acto2-util.js';

// Los que el acto III suma. `clave`: la que tienen en el juego (aldea.js). `pareja` no es nadie fijo: es la persona con quien estás en pareja
// (la resuelve el mundo de las escenas al disparar; si no hay pareja la escena de la pareja no se dispara, ver `amor`).
export const PERSONAJES_ACTO3 = {
  marta: { clave: 'enfermera', nombre: 'Marta', color: '#8fc4b0' },
  martin: { clave: 'martin', nombre: 'Martín', color: '#8aa0c9' },
  anselmo: { clave: 'herrero', nombre: 'Anselmo', color: '#c98a6a' },
  guido: { clave: 'apicultor', nombre: 'Guido', color: '#d9c25f' },
  elvira: { clave: 'tejedora', nombre: 'Elvira', color: '#b98ac9' },
  pareja: { clave: 'pareja', nombre: 'Tu pareja', color: '#e0a0a8' },
};

// Personajes de una escena del acto III: mezcla los de los actos I y II (pj) con los nuevos. Un nombre desconocido se ignora (la prueba lo atrapa).
export function pj3(...nombres) {
  const r = pj(...nombres.filter((n) => !Object.hasOwn(PERSONAJES_ACTO3, n)));
  for (const n of nombres) if (Object.hasOwn(PERSONAJES_ACTO3, n)) r[n] = { ...PERSONAJES_ACTO3[n] };
  return r;
}
export const esPersonaje3 = (n) => Object.hasOwn(PERSONAJES_HISTORIA, n) || Object.hasOwn(PERSONAJES_ACTO2, n) || Object.hasOwn(PERSONAJES_ACTO3, n);

// ---------------------------------------------------------------- condiciones nuevas (`si: { cond, args }`)
//   trato { es }          'trato' (hubo trato, también el fuerte) | 'fuerte' (devolviste la bolsa) | 'pelea'
//   noche { es }          'ganada' | 'perdida'
//   ramal-nivel { es }    'salvado' (cuenta del ramal ≥ 10) | 'prueba' (6 a 9) | 'traslado' (< 6: queda a prueba y Elsa manda el papel)
//   deuda { es }          'pendiente' (queda deuda del trato por pagar)
//   convidado {}          convidaste al valle (al menos dos de tres: D1 = a, D3 = c, D2 = a o c)
//   devolver-bolsa {}     podés devolver la bolsa en el umbral (D1 = a o D3 = c): la opción «trato fuerte» del encuentro
//   perdon {}             pediste perdón después de la pelea (`duendes.perdon`)
//   amor {}               tenés pareja (o salís con alguien) y el amor está prendido en los ajustes
//   perro {}              tenés perro
export const CONDICIONES_ACTO3 = [...CONDICIONES_HISTORIA, 'trato', 'noche', 'ramal-nivel', 'deuda', 'convidado', 'devolver-bolsa', 'perdon', 'amor', 'perro'];
export const siTrato = (es) => ({ cond: 'trato', args: { es } });
export const siNoche = (es) => ({ cond: 'noche', args: { es } });
export const siRamal = (es) => ({ cond: 'ramal-nivel', args: { es } });
export const siDeuda = () => ({ cond: 'deuda', args: { es: 'pendiente' } });
export const siConvidado = () => ({ cond: 'convidado', args: {} });
export const siDevolver = () => ({ cond: 'devolver-bolsa', args: {} });
export const siPerdon = () => ({ cond: 'perdon', args: {} });
export const siAmor = () => ({ cond: 'amor', args: {} });
export const siPerro = () => ({ cond: 'perro', args: {} });
// los valores que cada condición puede tomar (para que la prueba corra todas las variantes)
export const VALORES_CONDICION = {
  trato: ['trato', 'fuerte', 'pelea'],
  noche: ['ganada', 'perdida'],
  'ramal-nivel': ['salvado', 'prueba', 'traslado'],
  deuda: ['pendiente', 'ninguna'],
};
export const CONDICIONES_BOOLEANAS = ['convidado', 'devolver-bolsa', 'perdon', 'amor', 'perro'];

// ---------------------------------------------------------------- efectos nuevos (`tipo:id`)
//   duendes:trato            hubo trato (duendes.trato = 'trato')                 duendes:trato-fuerte   trato + devolviste la bolsa (convidado)
//   duendes:pelea            los echaste (duendes.trato = 'pelea')                duendes:perdon         pediste perdón (duendes.perdon = true)
//   duendes:deuda-bolsa      el trato pide una bolsa de harina (D1 = b)           duendes:deuda-tablas   el trato pide seis tablas de coihue (D2 = b)
//   duendes:deuda-pagada     pagaste lo que se debía (duendes.deuda = 0)          duendes:vistos         los viste en el galpón (para el cuaderno)
//   noche:reintentar         «Otra vez»: la noche vuelve a las 22:00 sin castigo  noche:perdida         «Que amanezca»: duendes.noche = 'perdida'
//   armas:arco | armas:honda el arma ya conseguida                                perfil:del-valle       el título de perfil «Del valle»
export const TIPOS_EFECTO_ACTO3 = ['duendes', 'noche', 'armas', 'perfil'];
export const IDS_EFECTO_ACTO3 = {
  duendes: ['trato', 'trato-fuerte', 'pelea', 'perdon', 'deuda-bolsa', 'deuda-tablas', 'deuda-pagada', 'vistos'],
  noche: ['reintentar', 'perdida'],
  armas: ['arco', 'honda'],
  perfil: ['del-valle'],
};
// Como `parsearEfecto` pero también entiende los de arriba. null si no sigue la convención.
export function parsearEfectoActo3(nombre) {
  const r = parsearEfecto(nombre);
  if (r) return r;
  if (typeof nombre !== 'string') return null;
  const p = nombre.split(':');
  if (p.length !== 2 || !TIPOS_EFECTO_ACTO3.includes(p[0])) return null;
  return IDS_EFECTO_ACTO3[p[0]].includes(p[1]) ? { tipo: p[0], id: p[1] } : null;
}

// un plano en primer plano de `a` mirando desde el jugador, para una línea de diálogo
export const primerDe = (a, o = {}) => ({ plano: 'primer', a, desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true, ...o });
