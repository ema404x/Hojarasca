// 4.9 defensas: los sonidos de la pala de brasas, sintetizados por código (sin audio descargado). Archivo propio: no toca
// desafio-sonidos.js.
//
//   · abanico   la pala que tira las brasas en abanico: un soplido grave que se abre y un racimo de chasquidos que se apaga
//               (0,75 s). Cada brasa que sale es un tic de ceniza y alguna chispa más aguda.
//   · cargar    la pala raspando las brasas de un fogón: metal sobre piedra y ceniza que se desmorona, con el siseo del
//               rescoldo (0,6 s).
//   · prender   la miel que agarra fuego: un «fum» bajo que sube y el chisporroteo del azúcar quemándose (0,8 s).
//
// Módulo puro: las recetas son generadores que devuelven Float32Array (como `sonido-sintesis.js`) y se prueban en Node.
// `crearSonidoBrasas(sonido)` los reproduce con el motor del juego: se preparan de a pedazos en la cola (una vez) y suenan donde
// está la pala, con el aire y la reverb del valle.
import { Biquad, TASA_PREVIA, terminar } from './sonido-sintesis.js';

const DOS_PI = Math.PI * 2;
const az = (azar, a, b) => a + azar() * (b - a);

// Un tic de ruido que se apaga en un suspiro (`brillo`: de sordo a filoso)
function tic(d, i0, largo, amp, brillo, azar) {
  const a = 0.05 + brillo * 0.9, tau = largo / 4.6;
  let lp = 0;
  for (let k = 0; k < largo; k++) {
    const idx = i0 + k;
    if (idx >= d.length) break;
    lp += ((azar() * 2 - 1) - lp) * a;
    d[idx] += lp * amp * Math.exp(-k / tau);
  }
}
// Una chispa: un seno agudo cortito que cae de tono
function chispa(d, i0, f, amp, tasa) {
  const L = Math.floor(tasa * 0.012);
  let fase = 0;
  for (let k = 0; k < L && i0 + k < d.length; k++) { fase += DOS_PI * f * (1 - 0.25 * k / L) / tasa; d[i0 + k] += Math.sin(fase) * amp * Math.exp(-k / (L / 4)); }
}

// ------------------------------------------------------------------ el abanico
function* abanicoBrasas(tasa, azar = Math.random) {
  const n = Math.floor(tasa * 0.75), d = new Float32Array(n);
  // el soplido: ruido que pasa por un filtro que se abre (de 500 a 2000 Hz) y se apaga
  const f = new Biquad('bp', 500, 0.8, tasa);
  for (let i = 0; i < n; i++) {
    const t = i / tasa, env = Math.min(1, t / 0.05) * Math.exp(-t / 0.2);
    if ((i & 255) === 0) f.poner('bp', 500 + 1500 * Math.min(1, t / 0.3), 0.8, tasa);
    d[i] += f.paso(azar() * 2 - 1) * env * 0.55;
    if ((i & 4095) === 4095) yield;
  }
  yield;
  // las brasas: un racimo de tics que va espaciándose, con alguna chispa aguda
  let t = 0.01;
  while (t < 0.62) {
    const amp = Math.pow(azar(), 2) * 0.75 + 0.06, i0 = Math.floor(t * tasa);
    tic(d, i0, Math.floor(tasa * az(azar, 0.0006, 0.003)), amp * (1 - t * 0.8), az(azar, 0.3, 1), azar);
    if (azar() < 0.22) chispa(d, i0, az(azar, 2400, 5200), amp * 0.28, tasa);
    t += (0.004 + azar() * 0.018) * (1 + t * 3);
  }
  yield;
  return yield* terminar(d, tasa, { corte: 70, pico: 0.9 });
}

// ------------------------------------------------------------------ cargar la pala
function* cargarBrasas(tasa, azar = Math.random) {
  const n = Math.floor(tasa * 0.6), d = new Float32Array(n);
  // el raspado: pulsos de ruido filtrado a 1800-3400 Hz, cada uno más flojo
  const f = new Biquad('bp', 2400, 1.6, tasa);
  const pulsos = 3 + Math.floor(azar() * 2);
  for (let p = 0; p < pulsos; p++) {
    const t0 = p * 0.13 + az(azar, 0, 0.03), L = Math.floor(tasa * az(azar, 0.07, 0.11));
    f.poner('bp', az(azar, 1800, 3400), az(azar, 1.2, 2.2), tasa);
    for (let k = 0, i0 = Math.floor(t0 * tasa); k < L && i0 + k < n; k++) {
      const env = Math.sin(Math.PI * k / L) * Math.exp(-p * 0.28);
      d[i0 + k] += f.paso(azar() * 2 - 1) * env * 0.4;
    }
    yield;
  }
  // la ceniza que se desmorona y el siseo del rescoldo
  for (let r = 0; r < 14; r++) tic(d, Math.floor(tasa * az(azar, 0.05, 0.5)), Math.floor(tasa * az(azar, 0.001, 0.005)), az(azar, 0.06, 0.28), az(azar, 0.1, 0.6), azar);
  const hp = new Biquad('hp', 3600, 0.6, tasa);
  for (let i = 0; i < n; i++) {
    const t = i / tasa;
    d[i] += hp.paso(azar() * 2 - 1) * 0.05 * Math.exp(-Math.pow(t - 0.25, 2) / 0.05);
    if ((i & 4095) === 4095) yield;
  }
  return yield* terminar(d, tasa, { corte: 90, pico: 0.9 });
}

// ------------------------------------------------------------------ la miel que prende
function* prenderMiel(tasa, azar = Math.random) {
  const n = Math.floor(tasa * 0.8), d = new Float32Array(n);
  // el «fum»: un seno grave que sube y se apaga, con un golpe de ruido bajo
  let fase = 0;
  for (let i = 0; i < Math.floor(tasa * 0.4); i++) {
    const t = i / tasa, fr = 70 + 60 * Math.min(1, t / 0.12);
    fase += DOS_PI * fr / tasa;
    d[i] += Math.sin(fase) * 0.7 * Math.min(1, t / 0.015) * Math.exp(-t / 0.11);
    if ((i & 4095) === 4095) yield;
  }
  const lp = new Biquad('lp', 600, 0.7, tasa);
  for (let i = 0; i < Math.floor(tasa * 0.3); i++) { const t = i / tasa; d[i] += lp.paso(azar() * 2 - 1) * 0.5 * Math.exp(-t / 0.08); if ((i & 4095) === 4095) yield; }
  yield;
  // el azúcar que se quema: chisporroteo que se espesa y se apaga
  let t = 0.08;
  while (t < 0.7) {
    tic(d, Math.floor(t * tasa), Math.floor(tasa * az(azar, 0.0008, 0.004)), Math.pow(azar(), 2.2) * 0.4 + 0.03, az(azar, 0.3, 0.9), azar);
    t += (0.006 + azar() * 0.03) * (1 + t);
  }
  yield;
  return yield* terminar(d, tasa, { corte: 50, pico: 0.9 });
}

// ------------------------------------------------------------------ el banco
// `nivel`: cuánto sube cada uno al sonar (el buffer sale con pico 0,9).
export const SONIDOS_BRASAS = {
  abanico: { receta: abanicoBrasas, variantes: 3, nivel: 0.5, reverb: 0.5 },
  cargar: { receta: cargarBrasas, variantes: 2, nivel: 0.4, reverb: 0.4 },
  prender: { receta: prenderMiel, variantes: 2, nivel: 0.55, reverb: 0.6 },
};

export function crearSonidoBrasas(sonido) {
  const listo = () => !!(sonido && sonido.ctx && sonido.bus && !sonido.relax);
  function sonar(clave, pos, vol = 1) {
    const S = SONIDOS_BRASAS[clave];
    if (!S || !listo()) return null;
    const reproducir = (buf) => {
      const destino = pos ? sonido.fuente?.(pos, S.nivel * vol, S.reverb) : sonido.bus.efectos;
      return buf && destino ? sonido.sonarBuffer?.(buf, destino, 1, 0, 0.96 + Math.random() * 0.08) : null;
    };
    const buf = sonido.variante(`brasas-${clave}`, S.variantes, () => S.receta(TASA_PREVIA, Math.random), 0.2, reproducir);
    return buf ? reproducir(buf) : null;
  }
  // las prepara en la cola del motor (una vez): para cuando se use la pala ya están hechas
  function preparar() {
    if (!listo()) return false;
    for (const [clave, S] of Object.entries(SONIDOS_BRASAS)) sonido.variantes(`brasas-${clave}`, S.variantes, () => S.receta(TASA_PREVIA, Math.random));
    return true;
  }
  return {
    preparar, sonar,
    abanico: (pos, vol) => sonar('abanico', pos, vol),
    cargar: (pos, vol) => sonar('cargar', pos, vol),
    prender: (pos, vol) => sonar('prender', pos, vol),
  };
}

// Las recetas se exportan acá, en una línea: el empaquetador (armar.mjs) no reconoce `export function*`.
export { abanicoBrasas, cargarBrasas, prenderMiel };
