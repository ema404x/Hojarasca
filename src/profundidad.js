// Profundidad escénica RC30: funciones baratas y deterministas para coordinar
// perspectiva aérea y luz rasante sin añadir geometría ni pases de render.
import { clamp, smoothstep } from './ruido.js';

export function factorLuzRasante(solY, nublado = 0) {
  const y = Math.abs(Number.isFinite(solY) ? solY : 1);
  const cielo = 1 - clamp(nublado, 0, 1) * 0.72;
  return clamp((1 - smoothstep(0.055, 0.34, y)) * cielo, 0, 1);
}

export function factorPerspectivaAerea(distancia, alturaRelativa = 0, humedad = 0) {
  const d = Math.max(0, distancia || 0);
  const h = Math.max(-120, Math.min(600, alturaRelativa || 0));
  const hum = clamp(humedad, 0, 1);
  const base = smoothstep(65, 330, d);
  const capaBaja = 1 - smoothstep(55, 310, Math.max(0, h));
  return clamp(base * (0.34 + capaBaja * (0.22 + hum * 0.32)), 0, 0.82);
}

export function contrasteEscenico(distancia, humedad = 0) {
  const aire = factorPerspectivaAerea(distancia, 0, humedad);
  return clamp(1 - aire * 0.42, 0.66, 1);
}
