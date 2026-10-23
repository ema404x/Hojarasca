// 4.8.1: lo que se oye del aro de hongos donde salen los duendes (antes: el zumbido de la nave). Todo
// generado por código, muestra por muestra, con las primitivas de `sonido-sintesis.js` (el azar repetible, los
// filtros de dos polos y el acabado): nada grabado.
//   · el viento grave: ruido filtrado por un pasabajos que se abre y se cierra despacio, más la resonancia
//     de un hueco (como soplar sobre la boca de una botella grande), a ~110 Hz;
//   · el crujido de las raíces: madera que se frota y se suelta (pulsos irregulares de 14 a 40 por segundo
//     que hacen sonar dos resonancias de madera entre 150 y 520 Hz), con algún «tac» seco;
//   · la tierra que se desmorona: granitos de ruido, de a miles, más graves cuanto más grande el terrón;
//   · el retumbo de abajo, un seno de 40 a 70 Hz que sube y baja.
// Cuatro sonidos: `brota` (4,2 s: el aro sale de la tierra), `crujido` (2,6 s, el que se repite mientras
// acecha; tres variantes), `sale` (1,8 s: un duende sube de la boca; tres variantes) y `cierra` (5,2 s: se
// hunde y se tapa con tierra y hojas). Módulo puro hasta `crearSonidosAro` (que sólo usa lo público del
// motor de audio): se prueba en Node.
import { TASA_PREVIA, crearAzar, Biquad, quitarContinua, medir, aPico, suavizarPicos } from './sonido-sintesis.js';

const DOS_PI = Math.PI * 2;
export const TASA_ARO = TASA_PREVIA;
export const SONIDOS_ARO = {
  brota: { dur: 4.2, variantes: 1 },
  crujido: { dur: 2.6, variantes: 3 },
  sale: { dur: 1.8, variantes: 3 },
  cierra: { dur: 5.2, variantes: 1 },
};
// el nivel de cada uno al reproducirlo (el pico del buffer queda en PICO_ARO, bien abajo de 1)
export const PICO_ARO = 0.7;
const NIVEL = { brota: 0.55, crujido: 0.32, sale: 0.3, cierra: 0.5 };

const env = (t, a, b, c, d) => (t < a ? 0 : t < b ? (t - a) / (b - a) : t < c ? 1 : t < d ? 1 - (t - c) / (d - c) : 0);
const suavizar = (x) => x * x * (3 - 2 * x);

// El viento grave: `v(t)` es cuánto sopla a cada instante (0 a 1).
function viento(d, tasa, azar, v, vol, fase = 0) {
  const n = d.length;
  const bajo = new Biquad('lp', 200, 0.7, tasa), hueco = new Biquad('bp', 112, 5, tasa), hueco2 = new Biquad('bp', 176, 7, tasa);
  for (let i = 0; i < n; i++) {
    const t = i / tasa;
    if ((i & 127) === 0) {
      bajo.poner('lp', 150 + 130 * (0.5 + 0.5 * Math.sin(DOS_PI * 0.33 * t + fase)) + 60 * Math.sin(DOS_PI * 0.11 * t + 2 * fase), 0.7, tasa);
      hueco.poner('bp', 108 + 9 * Math.sin(DOS_PI * 0.21 * t + fase), 5, tasa);
    }
    const ruido = azar() * 2 - 1;
    d[i] += vol * v(t) * (bajo.paso(ruido) * 1.2 + hueco.paso(ruido) * 1.6 + hueco2.paso(ruido) * 0.8);
  }
}
// Un crujido de raíz: madera que se frota. Empieza en `t0` y dura `dur`; `f` es la resonancia principal.
function crujido(d, tasa, azar, t0, dur, f, amp) {
  const i0 = Math.round(t0 * tasa), n = Math.round(dur * tasa);
  const a = new Biquad('bp', f, 14, tasa), b = new Biquad('bp', f * 1.93, 9, tasa), c = new Biquad('bp', f * 0.52, 6, tasa);
  let prox = 0;
  const desliz = (azar() < 0.5 ? -1 : 1) * (0.05 + azar() * 0.12);
  for (let j = 0; j < n; j++) {
    const i = i0 + j;
    if (i >= d.length) break;
    const k = j / n, e = Math.sin(Math.PI * k) ** 1.3;
    if ((j & 63) === 0) { const ff = f * (1 + desliz * k); a.poner('bp', ff, 14, tasa); b.poner('bp', ff * 1.93, 9, tasa); c.poner('bp', ff * 0.52, 6, tasa); }
    let imp = 0;
    if (j >= prox) {
      const ritmo = 14 + 26 * (0.5 + 0.5 * Math.sin(DOS_PI * (1.3 + 3 * azar()) * k)) * (0.6 + 0.4 * e);
      imp = (0.5 + azar()) * e;
      prox = j + Math.round(tasa / ritmo * (0.65 + 0.7 * azar()));
    }
    d[i] += amp * (a.paso(imp) * 2.2 + b.paso(imp) * 1.3 + c.paso(imp) * 1.0);
  }
}
// Un «tac» seco: una rama que se rompe un poquito.
function tac(d, tasa, azar, t0, amp, f = 1100) {
  const i0 = Math.round(t0 * tasa), n = Math.round(0.03 * tasa);
  const b = new Biquad('bp', f * (0.8 + 0.5 * azar()), 3, tasa);
  for (let j = 0; j < n && i0 + j < d.length; j++) d[i0 + j] += amp * b.paso(azar() * 2 - 1) * Math.exp(-j / (0.0045 * tasa)) * 3;
}
// La tierra que se desmorona entre `t0` y `t1`: granitos sueltos (`dens` por segundo al principio, cada vez menos si `cae`).
function tierra(d, tasa, azar, t0, t1, amp, dens, cae = 1, grave = 1) {
  const a = Math.round(t0 * tasa), b = Math.min(d.length, Math.round(t1 * tasa));
  const lp = new Biquad('lp', 900 * grave, 0.8, tasa), bp = new Biquad('bp', 380 * grave, 1.6, tasa);
  let grano = 0, resta = 0, g = 0;
  for (let i = a; i < b; i++) {
    const k = (i - a) / Math.max(1, b - a), p = dens * (1 - cae * k * 0.8) / tasa;
    if (resta <= 0 && azar() < p) { grano = 0.4 + azar() * 0.9; resta = Math.round((0.002 + azar() * 0.01) * tasa); g = grano; }
    const x = resta > 0 ? (azar() * 2 - 1) * g * (resta / tasa / 0.012) : 0;
    if (resta > 0) resta--;
    d[i] += amp * (lp.paso(x) * 1.4 + bp.paso(x) * 1.8);
  }
}
// El retumbo de abajo: un seno que sube y baja entre f0 y f1 con la envolvente `e(t)`.
function retumbo(d, tasa, f0, f1, e, amp) {
  let ph = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / tasa, k = i / d.length;
    ph += DOS_PI * (f0 + (f1 - f0) * k + 4 * Math.sin(DOS_PI * 0.8 * t)) / tasa;
    d[i] += amp * e(t) * (Math.sin(ph) + 0.3 * Math.sin(2 * ph + 1));
  }
}
// El ruidito de las hojas secas que se acomodan (agudo y bajo).
function hojas(d, tasa, azar, t0, t1, amp, dens) {
  const a = Math.round(t0 * tasa), b = Math.min(d.length, Math.round(t1 * tasa));
  const bp = new Biquad('bp', 2600, 1.2, tasa), alto = new Biquad('hp', 1400, 0.7, tasa);
  let resta = 0;
  for (let i = a; i < b; i++) {
    const k = (i - a) / Math.max(1, b - a);
    if (resta <= 0 && azar() < dens * (1 - 0.6 * k) / tasa) resta = Math.round((0.004 + azar() * 0.012) * tasa);
    const x = resta > 0 ? (azar() * 2 - 1) * (resta / tasa / 0.016) : 0;
    if (resta > 0) resta--;
    d[i] += amp * (bp.paso(x) + 0.6 * alto.paso(x));
  }
}

// El acabado: sin continua, los picos doblados, el pico en PICO_ARO y los bordes sin clic.
function* terminarAro(d, tasa) {
  yield;
  quitarContinua(d, tasa, 24);
  yield;
  suavizarPicos(d, 3.2);
  aPico(d, PICO_ARO);
  const f = Math.round(0.02 * tasa);
  for (let i = 0; i < f && i < d.length; i++) { const k = i / f; d[i] *= k; d[d.length - 1 - i] *= k; }
  return d;
}

// `nombre`: 'brota' | 'crujido' | 'sale' | 'cierra'; `variante`: 0 a variantes - 1. Devuelve el Float32Array.
function* sintetizarAro(nombre, variante = 0, tasa = TASA_ARO) {
  const def = SONIDOS_ARO[nombre];
  if (!def) throw new Error(`sonido del aro desconocido: ${nombre}`);
  const azar = crearAzar(4810 + variante * 97 + nombre.length * 1013 + nombre.charCodeAt(0));
  const d = new Float32Array(Math.round(def.dur * tasa));
  const D = def.dur;
  yield;
  if (nombre === 'brota') {
    viento(d, tasa, azar, (t) => env(t, 0.2, 2.2, 3.0, D) ** 1.2 * 0.8 + 0.1, 0.5, 0.4);
    retumbo(d, tasa, 38, 66, (t) => env(t, 0.1, 1.8, 3.2, D), 0.34);
    tierra(d, tasa, azar, 0.3, 3.6, 0.5, 900, 0.7, 0.8);
    yield;
    crujido(d, tasa, azar, 0.5, 1.1, 190, 0.5);
    crujido(d, tasa, azar, 1.3, 0.9, 260, 0.45);
    crujido(d, tasa, azar, 2.0, 1.3, 150, 0.55);
    crujido(d, tasa, azar, 2.9, 0.8, 340, 0.35);
    for (const t of [0.9, 1.6, 2.4, 3.3]) tac(d, tasa, azar, t + azar() * 0.2, 0.5, 900 + azar() * 500);
    hojas(d, tasa, azar, 1.6, 3.8, 0.12, 60);
  } else if (nombre === 'crujido') {
    viento(d, tasa, azar, (t) => env(t, 0.1, 1.0, 1.8, D) * 0.9 + 0.05, 0.42, variante * 1.3);
    retumbo(d, tasa, 44 + variante * 5, 52 + variante * 4, (t) => env(t, 0.3, 1.0, 1.7, 2.5), 0.12);
    yield;
    const f1 = [170, 230, 310][variante % 3] * (0.9 + azar() * 0.2);
    crujido(d, tasa, azar, 0.25 + azar() * 0.3, 0.8 + azar() * 0.4, f1, 0.5);
    if (variante !== 1) crujido(d, tasa, azar, 1.2 + azar() * 0.4, 0.6 + azar() * 0.4, f1 * (1.3 + azar() * 0.5), 0.4);
    if (azar() < 0.7) tac(d, tasa, azar, 0.9 + azar() * 1.2, 0.5, 800 + azar() * 700);
  } else if (nombre === 'sale') {
    tierra(d, tasa, azar, 0.0, 1.5, 0.55, 600, 0.9, 0.9 + variante * 0.15);
    viento(d, tasa, azar, (t) => env(t, 0.0, 0.5, 0.9, D), 0.3, variante);
    yield;
    crujido(d, tasa, azar, 0.1, 0.7, [200, 260, 175][variante % 3], 0.45);
    // el terrón que se abre y el duende que asoma: un golpe hueco de tierra
    retumbo(d, tasa, 78, 44, (t) => (t > 0.95 && t < 1.35 ? Math.sin(Math.PI * (t - 0.95) / 0.4) : 0), 0.5);
    hojas(d, tasa, azar, 0.9, 1.7, 0.1, 40);
    tac(d, tasa, azar, 0.5 + azar() * 0.3, 0.4);
  } else {
    // cierra: la tierra cae y las hojas se acomodan encima, el aro se hunde con un retumbo que se apaga
    viento(d, tasa, azar, (t) => env(t, 0, 0.6, 1.6, 4.6) * 0.8, 0.4, 2);
    retumbo(d, tasa, 72, 34, (t) => env(t, 0.0, 0.4, 2.4, 4.4), 0.38);
    tierra(d, tasa, azar, 0.1, 4.2, 0.55, 1100, 1, 0.8);
    yield;
    crujido(d, tasa, azar, 0.2, 1.4, 160, 0.5);
    crujido(d, tasa, azar, 1.2, 1.1, 215, 0.4);
    hojas(d, tasa, azar, 1.4, 4.6, 0.22, 90);
    retumbo(d, tasa, 62, 40, (t) => (t > 3.9 && t < 4.6 ? Math.sin(Math.PI * (t - 3.9) / 0.7) : 0), 0.45);
  }
  return yield* terminarAro(d, tasa);
}

// Lo que mide la prueba: duración (s), pico, RMS y continua, más cuánta energía hay abajo de 400 Hz
// (el viento y el retumbo) y en la banda de las raíces (150 a 600 Hz).
function analizarAro(d, tasa = TASA_ARO) {
  const m = medir(d);
  const bajo = new Biquad('lp', 400, 0.7, tasa), grave = new Biquad('lp', 400, 0.7, tasa);
  let eT = 0, eB = 0;
  for (let i = 0; i < d.length; i++) { const x = d[i]; eT += x * x; const y = grave.paso(bajo.paso(x)); eB += y * y; }
  return { dur: d.length / tasa, ...m, graves: eB / (eT || 1) };
}

// El motor de audio del juego (`Sonido`, sonido.js): sólo se usa lo público (`preparar`, `previo`, `fuente`...).
export function crearSonidosAro(sonido) {
  const nombres = [];
  for (const [n, def] of Object.entries(SONIDOS_ARO)) for (let k = 0; k < def.variantes; k++) nombres.push([n, k, `aro-${n}-${k}`]);
  let ultima = {};
  function preparar() {
    if (!sonido?.ctx) return false;
    for (const [n, k, clave] of nombres) sonido.preparar(clave, () => sintetizarAro(n, k), null, TASA_ARO);
    return true;
  }
  // Suena `nombre` en `pos` (o parejo si no hay): una variante al azar, sin repetir la última. Devuelve la duración
  // o 0 si no tocaba (sin motor de audio todavía, o el Relax, o demasiados sonidos a la vez).
  function sonar(nombre, pos, { vol = 1, urgente = false, reverb = 0.55 } = {}) {
    if (!sonido?.ctx || sonido.relax) return 0;
    const def = SONIDOS_ARO[nombre];
    const listas = [];
    for (let k = 0; k < def.variantes; k++) {
      const clave = `aro-${nombre}-${k}`;
      let b = sonido.previo?.get(clave);
      if (!b) { sonido.preparar(clave, () => sintetizarAro(nombre, k), null, TASA_ARO); b = sonido.previo?.get(clave) || (urgente ? sonido.yaMismo?.(clave) : null); }
      if (b) listas.push([k, b]);
    }
    if (!listas.length) return 0;
    if (sonido.puedeSonar && !sonido.puedeSonar(2, 0)) return 0;
    let i = Math.floor(Math.random() * listas.length);
    if (listas.length > 1 && listas[i][0] === ultima[nombre]) i = (i + 1) % listas.length;
    ultima[nombre] = listas[i][0];
    const buf = listas[i][1];
    const d = pos ? sonido.fuente(pos, 1, reverb) : sonido.bus?.efectos;
    if (!d) return 0;
    const ctx = sonido.ctx, s = ctx.createBufferSource();
    s.buffer = buf;
    const velocidad = 0.95 + Math.random() * 0.1;
    s.playbackRate.value = velocidad;
    const g = ctx.createGain(); g.gain.value = NIVEL[nombre] * vol;
    s.connect(g); g.connect(d);
    s.start(ctx.currentTime);
    sonido.soltarAlTerminar?.(s, g);
    return buf.duration / velocidad;
  }
  return {
    preparar,
    brota: (pos) => sonar('brota', pos, { urgente: true, vol: 1 }),
    crujir: (pos) => sonar('crujido', pos),
    sale: (pos) => sonar('sale', pos, { vol: 0.9 }),
    cierra: (pos) => sonar('cierra', pos, { urgente: true }),
  };
}

export { sintetizarAro, analizarAro };
