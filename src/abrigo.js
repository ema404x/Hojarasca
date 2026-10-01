// 2.4: la casa abriga y el confort se nota.
//
// construccion.js ya sabía de cada casa que armás si está cubierta y cerrada, cuánto
// la protege de la lluvia y del viento, su confort y hasta dónde llega el calor del
// fuego por los ambientes conectados. Nada de eso cambiaba cómo pasabas la noche: la
// helada de la 2.3 sólo miraba si había un fuego a menos de siete metros.
//
//   · Con el calor del fuego llegando a tu cuarto (una estufa o un hogar en la casa),
//     dormís calentito aunque el fuego esté en otro ambiente.
//   · Una casa cerrada sin fuego no es la intemperie: amanecés fresco, no helado; con
//     la manta, bien.
//   · La carpa queda en el medio: fresco.
//   · Una noche buena en una casa con confort alto (catre, alfombra, farol, estufa) te
//     deja descansado: unas horas caminando un poco más rápido. Es el espejo del
//     entumecido de la 2.3.
//
// Puro, sin THREE. `casa` es lo que devuelve obras.estadoHabitat() donde dormís, o null.

import { comoDormiste as comoDormisteAfuera, LENA } from './lena.js';

export const ABRIGO = {
  calorQueLlega: 0.12,     // el mismo umbral con que construccion.js dice que hay calor en el cuarto
  confortDescanso: 6,      // desde este confort (de la casa) amanecés descansado
  horasDescanso: 3,        // cuánto dura
  horasDescansoPleno: 4.5, // con catre y confort 8 o más
  velocidadDescanso: 0.08, // +8 % al caminar
};

// ¿La casa te cubre de verdad? Techo y al menos tres lados cerrados.
export const casaCerrada = (casa) => !!casa && !!casa.cubierta && (!!casa.habitable || !!casa.protegido);

// Cómo pasaste la noche: 'normal' · 'calentito' · 'fresco' · 'frio'.
export function comoDormiste({ invierno = 0, distanciaAlFuego = Infinity, manta = false, casa = null, carpa = false } = {}) {
  if (invierno < 0.5) return 'normal';
  if (distanciaAlFuego <= LENA.calorFuego) return 'calentito';
  if (casaCerrada(casa) && (Number(casa.calorFactor) || 0) >= ABRIGO.calorQueLlega) return 'calentito';
  if (casaCerrada(casa)) return manta ? 'normal' : 'fresco';
  if (carpa) return 'fresco';
  return comoDormisteAfuera({ invierno, distanciaAlFuego, manta });
}

// Horas descansado al despertar. Sólo si la noche fue buena y la casa es casa.
export function horasDescansado({ como = 'normal', casa = null } = {}) {
  if (como === 'frio' || como === 'fresco') return 0;
  if (!casaCerrada(casa)) return 0;
  const confort = Number(casa.confortCasa ?? casa.confort) || 0;
  if (confort < ABRIGO.confortDescanso) return 0;
  return casa.cama && confort >= 8 ? ABRIGO.horasDescansoPleno : ABRIGO.horasDescanso;
}
// Se pasa con las horas del día.
export function gastarDescanso(d, horas) {
  if (!(d > 0)) return 0;
  return Math.max(0, d - Math.max(0, Number(horas) || 0));
}
// Cuánto más rápido se camina (1 = normal).
export const factorDescanso = (d) => (d > 0 ? 1 + ABRIGO.velocidadDescanso : 1);
