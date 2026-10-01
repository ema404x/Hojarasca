// El perro que te lleva.
//
// El perro ovejero ya «marcaba»: se quedaba duro mirando un animal y ladraba corto.
// Pero marcaba cualquier cosa, a veintiséis metros, y lo más probable era que fuera
// algo que ya tenías anotado. Esto le da una intención: el perro huele más lejos que
// vos, y cuando encuentra algo que todavía no está en tu cuaderno, va hacia ahí. Se
// adelanta, se frena, mira para atrás a ver si venís, y cuando está cerca se queda
// duro señalando. Si lo seguís, te lleva.
//
// Módulo puro: sin three ni DOM.

// Hasta dónde olfatea: más lejos que lo que marca de pasada (26 m) y más que lo que
// ve un jugador distraído en el bosque cerrado.
export const OLFATO = 55;
// A esta distancia del animal deja de guiar y se pone a marcar, como siempre.
export const MARCAR_DESDE = 13;
// Si quedaste más atrás que esto, te espera.
export const ESPERAR_SI_LEJOS = 14;

// Los nombres con que la fauna se anuncia no siempre son los del cuaderno.
const ALIAS = { pato: 'patotorrente' };
export function idCuaderno(tipo) {
  return ALIAS[tipo] || tipo;
}

// Lo que no se guía: el propio perro, y lo que no está en el cuaderno como fauna.
const NO_GUIA = new Set(['perro']);

// De todo lo que huele, lo más cercano que te falta anotar. `candidatos` son los
// sujetos de la fauna: { tipo, pos: { x, z } }. `existe(id)` dice si es una ficha
// del cuaderno; `anotado[id]` si ya la tenés.
export function presaParaGuiar(candidatos, desde, anotado, existe = () => true, alcance = OLFATO) {
  let mejor = null, mejorD = alcance;
  for (const s of candidatos || []) {
    if (!s || !s.pos) continue;
    const id = idCuaderno(s.tipo);
    if (NO_GUIA.has(id) || !existe(id) || anotado?.[id]) continue;
    const d = Math.hypot(s.pos.x - desde.x, s.pos.z - desde.z);
    if (d > 3 && d < mejorD) { mejorD = d; mejor = s; }
  }
  return mejor ? { sujeto: mejor, id: idCuaderno(mejor.tipo), d: mejorD } : null;
}

// Hacia dónde va el perro cuando guía: no derecho al animal —lo espantaría—, sino a
// un punto a unos metros de él, del lado de donde viene el perro.
export function puntoDeGuia(perro, presa, margen = MARCAR_DESDE - 2) {
  const dx = presa.x - perro.x, dz = presa.z - perro.z;
  const d = Math.hypot(dx, dz) || 1;
  if (d <= margen) return { x: perro.x, z: perro.z };
  return { x: presa.x - (dx / d) * margen, z: presa.z - (dz / d) * margen };
}

// Qué hace el perro mientras guía, según dónde estás vos y dónde está el animal.
//   'marcar'  — llegó: se queda duro señalando
//   'esperar' — te quedaste atrás: se frena y mira para atrás
//   'guiar'   — sigue adelante
export function pasoDeGuia({ dPerroPresa, dPerroJugador, dJugadorPresa }) {
  if (dPerroPresa <= MARCAR_DESDE) return 'marcar';
  // si vos ya estás más cerca del animal que él, no tiene sentido esperarte
  if (dPerroJugador > ESPERAR_SI_LEJOS && dJugadorPresa > dPerroPresa) return 'esperar';
  return 'guiar';
}
