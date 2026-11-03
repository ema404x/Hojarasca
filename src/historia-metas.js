// 4.23.0 (B): los contadores de la guía de la Historia («Lo raro: 31 de 118», «De paso: 12 de 34», «Vecinos de la casa», «Escenas vividas»). Hasta hoy la guía no decía cuánto
// llevabas. Todo sale de datos que ya se guardan; nunca se muestra un número de lazo (sólo cuántos vecinos son «de la casa», que la guía ya dice en palabras).
// Los topes que se muestran son los POSIBLES, no el total:
//   · De paso: 34 optativas, pero en una misma partida entran como mucho 29: tres pares se excluyen por lo que decidís (D1: trigo-abuelo y masa-crece; D2: tablas-tito y
//     veta-vuelve; la pelea o el trato: pedir-perdon y llave-79) y dos más dependen de algo que no todos tienen (una pareja, un cumpleaños en la aldea).
//   · Vecinos de la casa: 13 con lazo, pero Tobías (D2 = C) y Tito (D2 = B) se excluyen: como mucho 12.
// Módulo puro (se prueba en Node).
import { LAZOS_TODOS, RAROS, lazoDe } from './historia.js';
import { OPTATIVAS } from './historia-optativas.js';
import { MAXIMO_CASA } from './logros-historia.js';
import { TOTAL_ESCENAS, escenasVividas } from './historia-vivido.js';

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
export const OPTATIVAS_EXCLUYENTES = [['trigo-abuelo', 'masa-crece'], ['tablas-tito', 'veta-vuelve'], ['llave-79', 'pedir-perdon']];
export const OPTATIVAS_DE_AZAR = ['alguien-te-espera', 'cumple-nevada'];
const IDS_OPTATIVAS = new Set(OPTATIVAS.map((o) => o.id));
export const TOTAL_OPTATIVAS = OPTATIVAS.length;
export const TOTAL_RAROS = Object.keys(RAROS).length;
export const maximoOptativas = () => TOTAL_OPTATIVAS - OPTATIVAS_EXCLUYENTES.length - OPTATIVAS_DE_AZAR.length;

// { raro: { n, total }, optativas: { n, total, max }, casa: { n, max }, escenas: { n, total } }
export function metasHistoria(h) {
  const raros = new Set((Array.isArray(h?.raro) ? h.raro : []).filter((x) => x && Object.hasOwn(RAROS, x.id)).map((x) => x.id));
  return {
    raro: { n: raros.size, total: TOTAL_RAROS },
    optativas: { n: Object.keys(obj(h?.optativas)).filter((k) => IDS_OPTATIVAS.has(k)).length, total: TOTAL_OPTATIVAS, max: maximoOptativas() },
    casa: { n: LAZOS_TODOS.filter((q) => lazoDe(h, q) >= 3).length, max: MAXIMO_CASA },
    escenas: { n: escenasVividas(h).length, total: TOTAL_ESCENAS },
  };
}

// Las líneas de la guía, en este orden
export function lineasMetas(h) {
  const m = metasHistoria(h);
  return [
    `Lo raro: ${m.raro.n} de ${m.raro.total}`,
    `De paso: ${m.optativas.n} de ${m.optativas.total} (en una misma partida entran hasta ${m.optativas.max})`,
    `Vecinos de la casa: ${m.casa.n} (hasta ${m.casa.max} en una misma partida)`,
    `Escenas vividas: ${m.escenas.n} de ${m.escenas.total}`,
  ];
}
