// Cuándo se le prenden los ojos a un invasor.
//
// La idea es vieja y funciona siempre: lo que asusta no es ver al bicho, es que el
// bicho te vea. Así que los ojos no brillan todo el tiempo —eso sería una linterna—,
// brillan cuando te tiene de frente y cerca, y se apagan cuando gira la cabeza para
// otro lado. De día casi no se nota; de noche es lo único que se ve de él.
//
// Módulo puro: entra geometría, sale un número de 0 a 1. Sin THREE y sin shader, así
// que se puede probar de verdad.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// El cono de la cara, en radianes a cada lado. Más angosto que esto no se llega a ver
// nunca; más ancho, los ojos quedan prendidos siempre y deja de dar miedo.
export const CONO = 0.75;
export const ALCANCE = 46;      // metros hasta donde te reconoce
export const CERCA = 6;         // de más cerca que esto, ya te tiene

// `dif` es el ángulo entre hacia dónde apunta el invasor y hacia dónde estás vos.
export function mirada({ dif = 0, distancia = 0, noche = 0, ataca = false } = {}) {
  const frente = Math.max(0, 1 - Math.abs(anguloCorto(dif)) / CONO);
  const cerca = clamp(1 - (distancia - CERCA) / (ALCANCE - CERCA), 0, 1);
  return clamp(frente * cerca * (0.35 + clamp(noche, 0, 1) * 0.65) * (ataca ? 1.4 : 1), 0, 1.4);
}

// Cuánto se apaga el cuerpo por la distancia: de lejos queda la silueta y los ojos.
export function silueta(distancia, noche = 1) {
  return clamp((distancia - 26) / 26, 0, 1) * (0.35 + clamp(noche, 0, 1) * 0.65);
}

// La brasa: sube rápido cuando te encuentra y baja despacio cuando te perdió. Si
// subiera y bajara igual de rápido, parpadearía; y un parpadeo no da miedo.
export const SUBE = 4.5, BAJA = 1.2;
export function acercar(actual, objetivo, dt) {
  return objetivo > actual
    ? Math.min(objetivo, actual + dt * SUBE)
    : Math.max(objetivo, actual - dt * BAJA);
}

// Un ángulo cualquiera llevado al rango -π..π, que es el que se puede comparar.
export function anguloCorto(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}
