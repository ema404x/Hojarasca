// 3.8.0: las reglas de los duendes del Desafío (módulo puro: sin THREE ni DOM; se prueba en Node).
// Los invasores pasan a ser duendes que salen del bosque. Los números de juego (vida, daño, alcance,
// cajas de golpe) son los de siempre (desafio-reglas.js); acá está sólo lo nuevo:
//   · quién viene de travieso y quién de viejo (traviesos al anochecer, los viejos oscuros en las
//     noches grandes);
//   · cómo crecen (la "evolución": de chiquitos a viejos grandotes);
//   · el robo: una travesura sin perder nada.
// Los valores marcados "propuesta" son decisiones del usuario todavía abiertas (se proponen; están acá).
import { esNocheDeJefe } from './desafio-reglas.js';

// Cada tipo de invasor, de duende (sólo para leer el código y las pruebas: los nombres que se ven los
// pone el equipo de textos).
export const DUENDE_DE = {
  rastreador: 'pillo', saltador: 'saltarín', tirador: 'hondero', escupidor: 'panzón',
  bruto: 'grandote', excavador: 'topo', volador: 'jinete de lechuza', jefe: 'Viejo del Nido',
};
// Los que siempre son viejos (no tienen pinta de travieso).
export const SIEMPRE_VIEJOS = new Set(['bruto', 'jefe']);

// ---------------------------------------------------------------- las noches grandes (los viejos)
// Propuesta: es noche grande la del jefe, una especial (roja, eclipse, silenciosa...) y, desde la
// noche 12, todas. Esas noches una parte de los duendes viene de viejo; las noches después del nido
// (los mutados) son siempre de viejos.
export const NOCHES_GRANDES = { desde: 12, porcionViejos: 0.6 };
export function esNocheGrande({ noche = 1, especial = null, sinFin = false } = {}) {
  const n = Math.floor(Number(noche) || 1);
  return esNocheDeJefe(n) || !!especial || n >= NOCHES_GRANDES.desde || (!!sinFin && n >= NOCHES_GRANDES.desde / 2);
}
// ¿Este duende viene de viejo? `azar` de 0 a 1.
export function vieneDeViejo(tipo, { grande = false, mutado = false, azar = 0.5 } = {}) {
  if (SIEMPRE_VIEJOS.has(tipo) || mutado) return true;
  if (!grande) return false;
  return azar < NOCHES_GRANDES.porcionViejos;
}

// ---------------------------------------------------------------- crecer (la evolución)
// Propuesta: tres etapas. Los chiquitos las primeras noches, los medianos después, y los grandotes
// (los viejos y los que aprendieron, con costra de corteza y musgo). Sólo cambia lo que se ve: la caja
// de golpe es la del tipo (no cambia el juego).
export const ETAPAS = [
  { nombre: 'chiquito', escala: 0.9 },
  { nombre: 'mediano', escala: 1 },
  { nombre: 'grandote', escala: 1.1 },
];
export const ETAPA_DESDE_NOCHE = [1, 4, 10];   // la noche desde la que vienen de cada etapa
export function etapaDe({ noche = 1, viejo = false, nivelAdaptado = 0 } = {}) {
  const n = Math.floor(Number(noche) || 1);
  let e = 0;
  for (let i = 0; i < ETAPA_DESDE_NOCHE.length; i++) if (n >= ETAPA_DESDE_NOCHE[i]) e = i;
  if (viejo) e = ETAPAS.length - 1;
  // el que aprendió de cómo te defendés viene un poco más grande
  e = Math.min(ETAPAS.length - 1, e + (nivelAdaptado > 0 ? 1 : 0));
  return e;
}

// ---------------------------------------------------------------- el robo (la travesura)
// Propuesta: los pillos y los saltarines traviesos, al pegarte, a veces se llevan algo chico y salen
// corriendo riéndose. Si les pegás, lo sueltan y lo recuperás; si se escapan, lo dejan tirado (brilla:
// lo levantás pasando cerca); y lo que quede sin levantar al amanecer te lo devuelven. Nunca rompen ni
// se llevan nada de lo construido, y nunca se pierde nada.
export const ROBO = {
  tipos: ['rastreador', 'saltador'],
  prob: 0.3,            // al pegarte, la chance de llevarse algo
  cuanto: 1,            // de a uno
  porNoche: 4,          // como mucho, tantos robos por noche
  huida: 9,             // segundos que corre con lo robado antes de soltarlo
  velHuida: 1.2,        // corre más rápido que cuando viene
  levantar: 1.6,        // a esta distancia, lo tirado se levanta solo
  // qué se llevan, en orden: la primera cosa que tengas (una semilla, una ramita, una tabla, una piedra)
  cosas: ['cristal', 'ramita', 'tabla', 'piedra'],
};
export function puedeRobar(tipo, { viejo = false, roboEnCurso = false, robosNoche = 0 } = {}) {
  return ROBO.tipos.includes(tipo) && !viejo && !roboEnCurso && robosNoche < ROBO.porNoche;
}
// Qué se lleva: la primera de la lista que tengas. `cuanto(k)` dice cuánto hay de cada cosa.
export function queSeLleva(cuanto) {
  for (const k of ROBO.cosas) {
    const n = Number(cuanto?.(k)) || 0;
    if (n >= ROBO.cuanto) return { cosa: k, n: ROBO.cuanto };
  }
  return null;
}
