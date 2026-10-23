// 4.9 aliados: el sonido de la campana de alarma tocada a mano (sintetizado por código, sin audio descargado).
//
// Es el toque de aviso de la base: una campana grande de bronce, golpeada seguido (el que la toca no espera a que se apague). Cada golpe
// es el chasquido del badajo (un soplido corto y seco) y los parciales de una campana de verdad, que no son armónicos: el zumbido
// grave (0,5), la fundamental (1), la tercera menor (1,19), la quinta (1,5), la octava (2), la décima (2,5) y los agudos de la
// corona (3 y 4,2). Los graves duran más y los agudos se apagan enseguida; cada parcial va en pareja desafinada por una fracción de
// hertz, y eso es lo que hace que la campana «bata» (el latido lento de las campanas grandes). Seis golpes seguidos, cada vez un poco
// más suaves, y la cola larga del último.
//
// Módulo puro: las recetas devuelven Float32Array (como `sonido-sintesis.js`) y se prueban en Node. `crearSonidoCampana(sonido)` la
// reproduce con el motor del juego: un buffer, ubicado donde está la campana (el aire se come los agudos con la distancia).
// NO se toca desafio-sonidos.js (la 4.8.0 lo cambió otro agente): esto es aparte.
import { terminar } from './sonido-sintesis.js';

const DOS_PI = Math.PI * 2;
const az = (azar, a, b) => a + azar() * (b - a);

// [razón, amplitud, segundos que tarda en caer a un tercio, desafinación en Hz de la pareja]
export const PARCIALES = [
  [0.5, 0.55, 1.5, 0.6], [1, 1, 1.15, 0.9], [1.19, 0.62, 0.9, 1.1], [1.5, 0.4, 0.55, 1.4],
  [2, 0.5, 0.42, 1.7], [2.5, 0.28, 0.26, 2.1], [3, 0.2, 0.18, 2.6], [4.2, 0.12, 0.1, 3.4],
];
export const GOLPES = 6;
export const SEPARACION = 0.36;   // segundos entre golpe y golpe

function* tanidoCampana(tasa, azar = Math.random) {
  const cola = 3.4;
  const n = Math.floor(tasa * (SEPARACION * (GOLPES - 1) + cola));
  const d = new Float32Array(n);
  const base = az(azar, 520, 590);   // la nota de esta campana
  for (let g = 0; g < GOLPES; g++) {
    const t0 = g * SEPARACION * (1 + (azar() - 0.5) * 0.06);
    const i0 = Math.floor(t0 * tasa);
    const fuerza = g === GOLPES - 1 ? 1 : 0.95 - g * 0.06;   // el último, el más firme
    // el badajo contra el bronce: un chasquido corto, sin graves
    let lp = 0;
    const Lc = Math.floor(tasa * 0.012);
    for (let k = 0; k < Lc && i0 + k < n; k++) { lp += ((azar() * 2 - 1) - lp) * 0.8; d[i0 + k] += (azar() * 2 - 1 - lp * 0.5) * 0.35 * fuerza * Math.exp(-k / (tasa * 0.0025)); }
    yield;
    for (const [r, amp, tau, bate] of PARCIALES) {
      const f = base * r * az(azar, 0.998, 1.002);
      const L = Math.min(n - i0, Math.floor(tasa * tau * 4.5));
      const fase = azar() * DOS_PI;
      for (let k = 0; k < L; k++) {
        const t = k / tasa;
        const env = Math.exp(-t / tau) * Math.min(1, t / 0.0025);
        // la pareja desafinada: dos senos que se suman y se restan despacio
        d[i0 + k] += amp * fuerza * env * (Math.sin(DOS_PI * f * t + fase) + 0.6 * Math.sin(DOS_PI * (f + bate) * t + fase * 1.7)) * 0.5;
      }
      yield;
    }
  }
  return yield* terminar(d, tasa, { corte: 70, pico: 0.9 });
}

export const NIVEL_CAMPANA = 0.5;

export function crearSonidoCampana(sonido) {
  const listo = () => !!(sonido && sonido.ctx && sonido.bus && !sonido.relax);
  // las prepara en la cola del motor (una vez): para cuando se toque ya está hecha
  function preparar() {
    if (!listo()) return false;
    sonido.variantes('campana-aldea', 1, () => tanidoCampana(32000, Math.random));
    return true;
  }
  // suena en `pos` ({ x, y, z }); si todavía no está hecha, suena la campana de siempre (sonido.campana)
  function sonar(pos) {
    if (!listo()) return null;
    const buf = sonido.variante('campana-aldea', 1, () => tanidoCampana(32000, Math.random), 0, () => sonido.campana?.(pos));
    if (!buf) return null;
    const destino = pos ? sonido.fuente(pos, 1.6, 1) : sonido.bus.efectos;
    if (!destino) return null;
    return sonido.sonarBuffer(buf, destino, NIVEL_CAMPANA);
  }
  return { preparar, sonar };
}

export { tanidoCampana };
