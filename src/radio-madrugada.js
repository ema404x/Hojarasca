// 4.2 (huevos de pascua): lo que suena en la radio a la madrugada (módulo puro: sin WebAudio, devuelve Float32Array, se prueba en Node).
// Todo es de síntesis propia (nada grabado, nada de terceros):
//   · un tango viejo: una frase de cuatro compases COMPUESTA para esto (la menor, 66 por minuto, el bajo marcado a 1 y 3, los acordes
//     en el segundo y el cuarto tiempo, la melodía en un instrumento de lengüeta que respira) que se corta antes del final, como una
//     emisora lejana que se pierde;
//   · un mensaje en código Morse (ITU) con un tono de 650 Hz;
//   · y encima, la radio: un pasabanda de parlante chico, un poco de saturación, soplido, chasquidos y la señal que sube y baja.
// Usa los sintetizadores de sonido-sintesis.js (la cuerda pulsada de la música, los filtros y el azar repetible).
import { crearAzar, Biquad, cuerdaPulsada, completar } from './sonido-sintesis.js';

export const TASA_RADIO = 16000;
const DOS_PI = Math.PI * 2;
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// ---------------------------------------------------------------- la frase (la menor, en negras: 1 = un tiempo)
export const TANGO = {
  bpm: 66,
  // [midi, tiempos]: bar 1 y 2 sobre la menor, el 3 pasa por re menor y mi 7, el 4 baja al la
  melodia: [
    [76, 1.5], [74, 0.5], [72, 1], [71, 1],
    [69, 2], [72, 1], [76, 1],
    [77, 1.5], [76, 0.5], [74, 1], [72, 1],
    [71, 1], [68, 1], [69, 2],
  ],
  // [midi del bajo, en qué tiempo (0 a 15)]
  bajo: [[45, 0], [52, 2], [45, 4], [52, 6], [50, 8], [52, 10], [52, 12], [45, 14]],
  // [notas del acorde, en qué tiempo]: a contratiempo (2.º y 4.º de cada compás)
  acordes: [
    [[57, 60, 64], 1], [[57, 60, 64], 3], [[57, 60, 64], 5], [[57, 60, 64], 7],
    [[62, 65, 69], 9], [[64, 68, 71, 74], 11], [[64, 68, 71, 74], 13], [[57, 60, 64], 15],
  ],
  corteEn: 14.4,   // tiempos: la señal se pierde a poco de terminar
};
export const duracionTango = () => ((TANGO.corteEn + 0.9) * 60) / TANGO.bpm;

// ---------------------------------------------------------------- el código Morse
export const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
  N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
};
// «SOS» → '... --- ...' (una letra tras otra separadas por un espacio; las palabras, por « / »)
export function aMorse(texto) {
  return String(texto || '').toUpperCase().split(/\s+/).filter(Boolean)
    .map((p) => [...p].filter((c) => Object.hasOwn(MORSE, c)).map((c) => MORSE[c]).join(' ')).filter(Boolean).join(' / ');
}
// Los tramos: [{ suena, u }] en unidades (punto = 1, raya = 3, entre signos 1, entre letras 3, entre palabras 7)
export function tramosMorse(texto) {
  const t = [];
  const palabras = aMorse(texto).split(' / ');
  palabras.forEach((p, i) => {
    if (i) t.push({ suena: false, u: 7 });
    p.split(' ').forEach((letra, j) => {
      if (j) t.push({ suena: false, u: 3 });
      [...letra].forEach((s, k) => { if (k) t.push({ suena: false, u: 1 }); t.push({ suena: true, u: s === '-' ? 3 : 1 }); });
    });
  });
  return t;
}
export const UNIDAD_MORSE = 0.1;   // s (unas 12 palabras por minuto)
export const duracionMorse = (texto) => tramosMorse(texto).reduce((a, x) => a + x.u, 0) * UNIDAD_MORSE + 1.2;

// ---------------------------------------------------------------- la radio vieja (se aplica a lo que suena)
function* radioVieja(d, tasa, azar, { soplido = 0.035, chasquidos = 7, entrada = 0.7, salida = 0.5 } = {}) {
  const n = d.length;
  const alto = new Biquad('hp', 340, 0.7, tasa), bajo = new Biquad('lp', 3100, 0.9, tasa), bajo2 = new Biquad('lp', 3600, 0.7, tasa);
  const ruidoBanda = new Biquad('bp', 1800, 0.6, tasa);
  const clics = [];
  for (let i = 0; i < chasquidos * (n / tasa); i++) clics.push(Math.floor(azar() * n));
  clics.sort((a, b) => a - b);
  let c = 0, fase = azar() * 6;
  const TROZO = 2048;
  for (let i = 0; i < n; i++) {
    const t = i / tasa;
    // la señal sube y baja despacio (una antena lejana) y con el viento se ahoga un poco
    const señal = 0.8 + 0.2 * Math.sin(DOS_PI * 0.13 * t + fase) + 0.08 * Math.sin(DOS_PI * 0.47 * t);
    let x = bajo2.paso(bajo.paso(alto.paso(d[i]))) * señal;
    x = Math.tanh(x * 1.7) / 1.25;                                         // la saturación del parlante
    x += ruidoBanda.paso(azar() * 2 - 1) * soplido * (1.4 - señal * 0.7);   // el soplido, más fuerte cuando la señal es floja
    while (c < clics.length && clics[c] <= i) { x += (azar() * 2 - 1) * 0.35; c++; }   // chasquidos
    // se sintoniza al empezar (el silbido que baja) y se pierde al final
    const a = Math.min(1, t / entrada), b = Math.min(1, (n / tasa - t) / salida);
    d[i] = x * a * a * b;
    if ((i % TROZO) === TROZO - 1) yield;
  }
  // el silbido de la sintonía, arriba de todo, que baja de 1900 a 520 Hz en los primeros 0,6 s
  const largo = Math.min(n, Math.floor(0.6 * tasa));
  let ph = 0;
  for (let i = 0; i < largo; i++) {
    const k = i / largo, f = 1900 - 1380 * k * k;
    ph += DOS_PI * f / tasa;
    d[i] += Math.sin(ph) * 0.07 * (1 - k) * Math.sin(Math.PI * Math.min(1, k * 4));
  }
  return d;
}

// ---------------------------------------------------------------- el tango
// Una nota de lengüeta (aditiva, con el vibrato que entra tarde y la nota que respira) sumada a `d` desde la muestra `i0`
function lengueta(d, tasa, i0, midi, seg, vol) {
  const f0 = hz(midi), n = Math.min(d.length - i0, Math.floor(seg * tasa));
  const parciales = [1, 0.55, 0.42, 0.26, 0.18, 0.1];
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / tasa;
    const vib = 1 + 0.006 * Math.min(1, t / 0.35) * Math.sin(DOS_PI * 5.4 * t);
    fase += DOS_PI * f0 * vib / tasa;
    let v = 0;
    for (let k = 0; k < parciales.length; k++) v += parciales[k] * Math.sin(fase * (k + 1));
    // ataque de lengüeta (rápido, con un poco de aire), una hinchada hacia la mitad y la caída
    const ataque = Math.min(1, t / 0.04), suelta = Math.min(1, (seg - t) / 0.09);
    const hincha = 0.82 + 0.18 * Math.sin(Math.PI * Math.min(1, t / seg));
    d[i0 + i] += v * vol * ataque * Math.max(0, suelta) * hincha;
  }
}
function* sintetizarTango(tasa = TASA_RADIO, semilla = 7) {
  const azar = crearAzar(semilla), tiempo = 60 / TANGO.bpm;
  const n = Math.floor(duracionTango() * tasa), d = new Float32Array(n);
  // el bajo marcado (cuerda grave, seca) y los acordes a contratiempo (la guitarra, rasgueando de abajo para arriba)
  for (const [midi, t] of TANGO.bajo) {
    const nota = completar(cuerdaPulsada(tasa, hz(midi), 1.0, { brillo: 0.3, posicion: 0.2, doble: 0.5, amortiguar: 0.55, caida: 0.9 }, azar));
    const i0 = Math.floor(t * tiempo * tasa);
    for (let i = 0; i < nota.length && i0 + i < n; i++) d[i0 + i] += nota[i] * 1.5;
    yield;
  }
  for (const [notas, t] of TANGO.acordes) {
    notas.forEach((midi, k) => {
      const nota = completar(cuerdaPulsada(tasa, hz(midi), 0.55, { brillo: 0.55, posicion: 0.14, doble: 0.8, amortiguar: 0.45, caida: 0.6 }, azar));
      const i0 = Math.floor((t * tiempo + k * 0.022) * tasa);
      for (let i = 0; i < nota.length && i0 + i < n; i++) d[i0 + i] += nota[i] * 0.85;
    });
    yield;
  }
  // la melodía (en la lengüeta)
  let t = 0;
  for (const [midi, tiempos] of TANGO.melodia) {
    const seg = tiempos * tiempo;
    lengueta(d, tasa, Math.floor(t * tasa), midi, seg * 0.96, 0.17);
    t += seg;
    yield;
  }
  // se pierde: lo que pasa de «corteEn» se va a cero
  const corte = TANGO.corteEn * tiempo;
  for (let i = Math.floor(corte * tasa); i < n; i++) d[i] *= Math.max(0, 1 - (i / tasa - corte) / (duracionTango() - corte));
  // nivel parejo antes de pasarlo por la radio
  let pico = 0; for (let i = 0; i < n; i++) pico = Math.max(pico, Math.abs(d[i]));
  if (pico > 0) for (let i = 0; i < n; i++) d[i] *= 0.8 / pico;
  yield;
  return yield* radioVieja(d, tasa, azar, { soplido: 0.03, chasquidos: 8 });
}

// ---------------------------------------------------------------- el Morse
function* sintetizarMorse(texto, tasa = TASA_RADIO, semilla = 11) {
  const azar = crearAzar(semilla), u = UNIDAD_MORSE;
  const n = Math.floor(duracionMorse(texto) * tasa), d = new Float32Array(n);
  let t = 0.5, fase = 0;
  const rampa = Math.floor(0.006 * tasa);
  for (const tramo of tramosMorse(texto)) {
    const i0 = Math.floor(t * tasa), i1 = Math.min(n, Math.floor((t + tramo.u * u) * tasa));
    if (tramo.suena) {
      for (let i = i0; i < i1; i++) {
        fase += DOS_PI * 650 / tasa;
        const k = Math.min(1, (i - i0) / rampa, (i1 - i) / rampa);   // sin clic al abrir y cerrar la clave
        d[i] = Math.sin(fase) * 0.6 * k;
      }
    }
    t += tramo.u * u;
    yield;
  }
  return yield* radioVieja(d, tasa, azar, { soplido: 0.05, chasquidos: 5, entrada: 0.5, salida: 0.6 });
}

// (armar.mjs no entiende `export function*`: se exportan acá, como en sonido-sintesis.js)
export { sintetizarTango, sintetizarMorse };
