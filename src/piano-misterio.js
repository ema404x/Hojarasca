// 3.8.5: el piano de misterio de La noche de los duendes (módulo puro: sin WebAudio, se prueba en Node).
// Suena una vez por noche, cuando los duendes empiezan a salir. Se midió contra un piano de referencia
// (que no entra al juego: sólo se escuchó y se midió con `herramientas/analizar-audio.cjs`):
//
//   · Un ostinato en corcheas, una nota cada 200 ms (unas 300 por minuto), en el registro medio
//     (C4 a D#4: 260 a 310 Hz), dando vueltas por semitonos sin resolver nunca.
//   · Un crescendo de unos 18 dB a lo largo de seis segundos y medio, con un golpe grave cada cuatro.
//   · Notas secas, sin pedal (entre nota y nota el sonido se corta), y un final de golpe: la cola cae
//     30 dB en medio segundo.
//
// La frase es propia: en re menor (el dron de la música del Desafío está en re) y con otras figuras —
// la vuelta alrededor del re, un lamento que baja en el bajo y una escalera de terceras menores—,
// pero con el mismo pulso, el mismo registro, el mismo crescendo y el mismo corte seco.
//
// El piano es de síntesis aditiva con lo que hace sonar a piano y no a órgano:
//   · parciales inarmónicos (la cuerda tiesa: f_n = n·f0·√(1 + B·n²));
//   · el martillo: cuanto más fuerte, más agudos; y el punto donde pega (a 1/8 de la cuerda) apaga los
//     parciales que caen en ese nodo; más el golpe de la mecánica (un toc grave y un chasquido de fieltro);
//   · cada parcial con su caída (los agudos se apagan antes) y dos etapas: el golpe que se va rápido y la
//     resonancia que queda;
//   · dos o tres cuerdas por nota, desafinadas un cent, que laten entre sí;
//   · los apagadores cuando se suelta la tecla, el pedal que los levanta, y la caja: unas resonancias
//     graves de madera y una sala chica (una reverberación de cuatro líneas, sin grabar nada).
import { crearAzar, Biquad } from './sonido-sintesis.js';

export const TASA_PIANO = 32000;

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Las frases. `ioi`: segundos entre corcheas. Cada compás: [notas de la mano derecha], [bajo] (o null).
// `fin`: el último golpe ([notas], pedal) y `cola`: cuánto se deja sonar después.
export const FRASES_PIANO = [
  {
    id: 'ronda', ioi: 0.205,
    // la vuelta alrededor del re (re, mi bemol, re, do sostenido), que se corre medio tono para arriba
    compases: [
      [[62, 63, 62, 61], null], [[62, 63, 62, 61], [38]], [[62, 63, 62, 61], [38]], [[62, 63, 62, 61], [26, 38]],
      [[63, 64, 63, 62], [26, 38]], [[63, 64, 63, 62], [27, 39]], [[64, 65, 66, 67], [26, 38]],
    ],
    fin: { notas: [26, 38, 56], pedal: true, vel: 0.85 }, cola: 1.7,
  },
  {
    id: 'lamento', ioi: 0.19,
    // arriba la segunda menor que no se decide (la, si bemol) y abajo el bajo que baja por semitonos
    compases: [
      [[57, 58, 57, 58], [38]], [[57, 58, 57, 58], [37]], [[57, 58, 57, 58], [36]], [[57, 58, 57, 58], [35]],
      [[57, 58, 57, 58], [34]], [[58, 59, 58, 59], [33]], [[57, 58, 59, 60], [33, 45]],
    ],
    fin: { notas: [34, 52], pedal: false, vel: 0.95 }, cola: 0.9,
  },
  {
    id: 'escalera', ioi: 0.225,
    // de a tres (fa, mi, re) y subiendo por terceras menores: cada escalón más arriba y más inquieto
    compases: [
      [[65, 64, 62], [38]], [[65, 64, 62], null], [[68, 67, 65], [41]], [[68, 67, 65], null],
      [[71, 70, 68], [44]], [[71, 70, 68], null], [[74, 73, 71], [26, 38]], [[74, 73, 71, 70], [26, 38]],
    ],
    fin: { notas: [26, 38, 62, 68], pedal: true, vel: 0.8 }, cola: 1.5,
  },
];

// Las notas de una frase, con el crescendo, los acentos y algo de mano humana (no hay dos iguales).
export function planPiano(variante = 0, semilla = 1) {
  const F = FRASES_PIANO[((variante % FRASES_PIANO.length) + FRASES_PIANO.length) % FRASES_PIANO.length];
  const az = crearAzar((semilla * 7717 + variante * 131 + 5) >>> 0);
  const notas = [];
  let t = 0.06;
  const total = F.compases.reduce((s, c) => s + c[0].length, 0);
  let k = 0;
  for (const [mano, bajo] of F.compases) {
    for (let j = 0; j < mano.length; j++) {
      const u = k / Math.max(1, total - 1);
      // de pianissimo a forte: unos 18 dB (la velocidad del martillo mueve el volumen y el brillo)
      const vel = clamp(0.2 + 0.68 * Math.pow(u, 1.1) + (j === 0 ? 0.08 : 0) + (az() - 0.5) * 0.06, 0.12, 1);
      const tt = t + (az() - 0.5) * 0.012;
      notas.push({ t: tt, midi: mano[j], vel, dur: F.ioi * 0.82, pedal: false });
      if (j === 0 && bajo) for (const b of bajo) notas.push({ t: tt + 0.004, midi: b, vel: clamp(vel * 0.5, 0.1, 0.6), dur: F.ioi * 0.95, pedal: false });
      t += F.ioi * (1 + (az() - 0.5) * 0.03);
      k++;
    }
  }
  const tf = t + F.ioi * 0.15;
  for (const m of F.fin.notas) notas.push({ t: tf + (az() - 0.5) * 0.006, midi: m, vel: F.fin.vel * (m < 45 ? 0.7 : 1), dur: F.fin.pedal ? F.cola : 0.32, pedal: F.fin.pedal });
  return { id: F.id, variante, ioi: F.ioi, notas, dur: tf + F.cola + 0.4 };
}

// Cuál frase toca esta noche: una por noche, rotando, y nunca la misma que anoche.
export function frasePianoDeNoche(noche, anterior = -1) {
  const n = FRASES_PIANO.length;
  let k = ((Math.floor(Number(noche) || 1) - 1) % n + n) % n;
  if (k === anterior) k = (k + 1) % n;
  return k;
}
// ¿Toca el piano? Sólo en La noche de los duendes (en el Relax los duendes son leyenda) y una sola vez por
// noche: `registro.noche` es la última noche en que sonó.
export function tocaElPiano(registro, noche, { relax = false } = {}) {
  if (relax || !registro) return false;
  const n = Math.floor(Number(noche) || 0);
  return n > 0 && registro.noche !== n;
}

// ------------------------------------------------------------------ la síntesis
// La cuerda: inarmonicidad (más en los graves entorchados y en los agudos), cuántas cuerdas y cuánto dura.
function cuerda(midi) {
  const B = midi < 40 ? 1.6e-4 + (40 - midi) * 1.5e-5 : 1.2e-4 * Math.pow(2, (midi - 48) / 12 * 1.1);
  return { B, cuerdas: midi < 30 ? 1 : midi < 45 ? 2 : 3, tau: clamp(9 - (midi - 30) * 0.12, 1.6, 10) };
}

// Una nota, sumada en `L` y `R` desde la muestra `i0`. Cede después de cada parcial (cada uno es menos de
// un milisegundo de cálculo): así la cola del motor nunca se come un cuadro.
function* nota(L, R, n, tasa, az) {
  const f0 = hz(n.midi), { B, cuerdas, tau } = cuerda(n.midi);
  const i0 = Math.max(0, Math.round(n.t * tasa));
  const iSuelta = i0 + Math.round(n.dur * tasa);
  // con el pedal o al soltar: los apagadores caen y la cuerda se calla en un décimo de segundo
  // (con pedal la nota dura lo que dura el pedal; al soltarlo los apagadores caen igual, un poco más lento)
  const iFin = Math.min(L.length, iSuelta + Math.round((n.pedal ? 0.6 : 0.35) * tasa));
  const v = n.vel;
  const nivel = 0.05 + 0.95 * Math.pow(v, 1.6);              // ~18 dB entre 0,2 y 0,9
  const brillo = 2.0 - 0.85 * v;                              // pendiente de los parciales
  const pan = clamp((n.midi - 50) / 40, -0.45, 0.45);
  const gl = Math.sqrt(0.5 - pan * 0.5) * 1.2, gr = Math.sqrt(0.5 + pan * 0.5) * 1.2;
  const fmax = Math.min(tasa * 0.42, 7500);
  const desafine = [0, 0.9 + az() * 0.5, -(0.7 + az() * 0.5)];   // cents
  for (let p = 1; p < 60; p++) {
    const fp = p * f0 * Math.sqrt(1 + B * p * p);
    if (fp > fmax) break;
    // el martillo: más agudos cuanto más fuerte, y el nodo donde pega (1/8 de la cuerda)
    let a = Math.pow(p, -brillo) * (0.25 + Math.abs(Math.sin(Math.PI * p / 8.2)));
    // los primeros parciales de los graves casi no los da la caja (la tabla no mueve tanto aire tan grave)
    if (fp < 90) a *= fp / 90;
    a *= nivel;
    if (a < 2e-4 * nivel) continue;
    // cada parcial cae a su ritmo: los agudos antes
    const tp = tau / (1 + Math.pow(fp / 900, 1.25));
    for (let c = 0; c < cuerdas; c++) {
      const fc = fp * Math.pow(2, desafine[c] / 1200);
      // la primera cuerda es el golpe (cae rápido), las otras la resonancia que queda
      const t60 = c === 0 && cuerdas > 1 ? tp * 0.3 : tp;
      const amp = a * (c === 0 && cuerdas > 1 ? 0.55 : 0.45 / Math.max(1, cuerdas - 1)) * (cuerdas === 1 ? 2 : 1);
      const w = 2 * Math.PI * fc / tasa;
      let decae = Math.exp(-6.9 / (t60 * tasa));
      const apaga = Math.exp(-6.9 / (((n.pedal ? 0.35 : 0.09) / (1 + fp / 1500)) * tasa));
      const cr = Math.cos(w), sr = Math.sin(w);
      const fase = az() * 6.283;
      let re = amp * Math.cos(fase), im = amp * Math.sin(fase), x;
      for (let i = i0; i < iFin; i++) {
        if (i === iSuelta) decae = apaga;
        x = re * cr - im * sr; im = re * sr + im * cr; re = x;
        re *= decae; im *= decae;
        L[i] += im * gl; R[i] += im * gr;
        if ((i & 255) === 0 && Math.abs(re) + Math.abs(im) < 1e-6) break;
      }
      yield;
    }
  }
  // la mecánica: el fieltro contra la cuerda (un chasquido corto) y el toc grave de la tecla en el fondo
  const lp = new Biquad('lp', 1200 + 2500 * v, 0.7, tasa), toc = new Biquad('bp', 70 + az() * 30, 3, tasa);
  const largo = Math.round(0.03 * tasa);
  for (let i = 0; i < largo && i0 + i < L.length; i++) {
    const e = Math.exp(-i / (0.004 * tasa)), e2 = Math.exp(-i / (0.012 * tasa));
    const r = az() * 2 - 1;
    const y = lp.paso(r) * e * 0.05 * nivel + toc.paso(r) * e2 * 0.35 * nivel;
    L[i0 + i] += y * gl; R[i0 + i] += y * gr;
  }
}

// La sala: cuatro líneas de retardo realimentadas (Hadamard), con los agudos que se van apagando.
function* sala(L, R, tasa, { t60 = 1.1, mezcla = 0.22 } = {}) {
  const largos = [1031, 1327, 1523, 1871].map((x) => Math.round(x * tasa / 32000));
  const lineas = largos.map((n) => new Float32Array(n)), pos = [0, 0, 0, 0], lp = [0, 0, 0, 0];
  const g = largos.map((n) => Math.pow(10, (-3 * n / tasa) / t60));
  const amort = 0.35;
  for (let i = 0; i < L.length; i++) {
    const ent = (L[i] + R[i]) * 0.5;
    const o = lineas.map((l, k) => l[pos[k]]);
    // Hadamard 4x4 normalizado
    const h0 = (o[0] + o[1] + o[2] + o[3]) * 0.5, h1 = (o[0] - o[1] + o[2] - o[3]) * 0.5, h2 = (o[0] + o[1] - o[2] - o[3]) * 0.5, h3 = (o[0] - o[1] - o[2] + o[3]) * 0.5;
    const h = [h0, h1, h2, h3];
    for (let k = 0; k < 4; k++) {
      lp[k] += (h[k] - lp[k]) * (1 - amort);
      lineas[k][pos[k]] = ent + lp[k] * g[k];
      pos[k] = (pos[k] + 1) % largos[k];
    }
    L[i] += (o[0] + o[2]) * mezcla; R[i] += (o[1] + o[3]) * mezcla;
    if ((i & 4095) === 4095) yield;
  }
}

// La frase entera, en estéreo. Generador: cede nota por nota (el motor la hace de a pedazos).
function* sintetizarPiano(plan, tasa = TASA_PIANO) {
  const N = Math.ceil(plan.dur * tasa);
  const L = new Float32Array(N), R = new Float32Array(N);
  const az = crearAzar((plan.variante * 977 + 31) >>> 0);
  for (const n of plan.notas) yield* nota(L, R, n, tasa, az);
  // la caja: la madera resuena un poco en los graves (tres modos) y se le saca el retumbe de abajo
  const modos = [[105, 6, 0.18], [215, 8, 0.12], [470, 9, 0.07]].map(([f, q, g]) => [new Biquad('bp', f, q, tasa), new Biquad('bp', f * 1.03, q, tasa), g]);
  const hpL = new Biquad('hp', 45, 0.7, tasa), hpR = new Biquad('hp', 45, 0.7, tasa);
  for (let i = 0; i < N; i++) {
    let l = L[i], r = R[i];
    for (const [bl, br, g] of modos) { l += bl.paso(L[i]) * g; r += br.paso(R[i]) * g; }
    L[i] = hpL.paso(l); R[i] = hpR.paso(r);
    if ((i & 4095) === 4095) yield;
  }
  yield* sala(L, R, tasa);
  // al tope 0,9 y sin chasquido al final
  let pico = 0; for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
  const k = pico > 0 ? 0.9 / pico : 1, borde = Math.round(0.05 * tasa);
  for (let i = 0; i < N; i++) { const f = i > N - borde ? (N - i) / borde : 1; L[i] *= k * f; R[i] *= k * f; }
  return [L, R];
}

export { sintetizarPiano };
