// 3.8.5: la risa de los duendes, sintetizada muestra por muestra (módulo puro: sin WebAudio, se prueba
// en Node). Antes la risita era la voz de `voz-alien.js` cortada en sílabas por un triángulo: sonaba a
// gruñido con hipo. Una risa de verdad es otra cosa, y se midió contra dos risas de referencia (que no
// entran al juego: sólo se escucharon y se midieron con `herramientas/analizar-audio.cjs`):
//
//   · Carcajadas cortas, de 85 a 165 ms, que se repiten cada 90 a 250 ms: unas siete por segundo, más
//     rápidas al principio y más lentas y flojas al final, hasta apagarse.
//   · Cada sílaba arranca con aire (la «j» o la «h»: 25 a 45 ms de soplo antes de la vocal), sube en 40
//     a 60 ms y cae en 40 a 80. El tono dibuja una Λ: sube un 10 a 20 % y vuelve a caer.
//   · De sílaba en sílaba el tono baja: el duende chico arranca cerca de los 800 Hz y termina por los 450.
//   · La energía está entre 700 y 2600 Hz y el brillo entre 2,5 y 4 kHz: vocales «e» e «i» de una boca
//     chica (formantes un 20 % más arriba que los de una persona grande) y mucho aire.
//   · A veces termina en un gorjeo: la voz se sostiene medio segundo con un vibrato hondo de 6 a 8 Hz.
//
// Lo propio de los duendes: algo de nariz (un polo nasal y un cero que se come la zona de 1,2 kHz), el
// «jm-jm» con la boca cerrada antes de largar la carcajada (la malicia) y, en los viejos, voz rasposa:
// períodos que se alargan sin aviso y se alternan fuerte-flojo (el subarmónico de una garganta gastada).
//
// La síntesis es la de un sintetizador de formantes en cascada (Klatt): una glotis con su pulso
// (Rosenberg) que tiembla período a período, el aire que sale con ella, cinco resonancias de la boca más
// la nariz, y la radiación de los labios. El motor (`sonido.js`) arma seis variantes por clase en la cola
// de síntesis al empezar La noche de los duendes y después sólo las reproduce.
import { crearAzar, aPico, quitarContinua, Biquad } from './sonido-sintesis.js';

export const TASA_RISA = 32000;
export const VARIANTES_RISA = 6;
// como mucho tres duendes riéndose a la vez (la cuarta risa se calla: un coro de risas es ruido)
export const TOPE_RISAS = 3;

// Las tres gargantas. tono: Hz al empezar la risa (la primera sílaba) · ioi: ms entre sílabas ·
// formantes: cuánto más chica (>1) o más grande (<1) es la boca que la de una persona grande ·
// aire, nariz y ronco de 0 a 1 · gorjeo: chance de terminar con vibrato (Hz y semitonos).
export const CLASES_RISA = {
  // los traviesos del anochecer: agudos, rápidos, con nariz y mucho aire
  chico: { tono: [690, 830], cae: 0.42, brillo: 5200, oq: 0.5, niveles: [0.85, 1.7, 0.5, 0.16, 0.03], soplo: 3800, pasaAltos: 640, anchos: 2.4, ioi: [100, 140], silabas: [8, 11], formantes: 1.2, vocales: ['e', 'e', 'i', 'a'], sube: [0.1, 0.2],
    aire: 0.34, nariz: 0.45, ronco: 0.04, jm: 0.55, gorjeo: 0.5, vibrato: [6, 7.6], hondo: [1.6, 2.2], ataque: [0.042, 0.058] },
  // los viejos oscuros de las noches grandes: graves, lentos y roncos («je… je… jo»)
  viejo: { tono: [205, 255], cae: 0.3, brillo: 6500, oq: 0.48, niveles: [0.9, 1.6, 1.1, 0.3, 0.06], soplo: 3000, pasaAltos: 220, anchos: 1.5, ioi: [175, 240], silabas: [6, 8], formantes: 1.0, vocales: ['e', 'a', 'o'], sube: [0.07, 0.13],
    aire: 0.5, nariz: 0.3, ronco: 0.5, jm: 0.35, gorjeo: 0.3, vibrato: [4.4, 5.6], hondo: [0.6, 1.0], ataque: [0.04, 0.06] },
  // el Mandamás y el Rey: el pecho entero, despacio, «jo… jo… jo»
  mandamas: { tono: [96, 120], cae: 0.24, brillo: 5500, oq: 0.5, niveles: [0.9, 1.6, 1.1, 0.3, 0.05], soplo: 2400, pasaAltos: 150, anchos: 1.25, ioi: [270, 340], silabas: [4, 6], formantes: 0.8, vocales: ['o', 'a', 'o'], sube: [0.06, 0.1],
    aire: 0.4, nariz: 0.2, ronco: 0.5, jm: 0.2, gorjeo: 0.15, vibrato: [3.6, 4.6], hondo: [0.5, 0.8], ataque: [0.05, 0.075] },
};

// Las vocales (F1, F2, F3 de una persona grande; F4 y F5 casi no se mueven). La «m» es la boca cerrada:
// el sonido sale por la nariz.
const VOCALES = {
  i: [380, 2100, 2850], e: [600, 1900, 2650], a: [800, 1300, 2600], o: [560, 950, 2500], u: [380, 850, 2350], m: [270, 1150, 2350],
};
const ANCHOS = [70, 95, 150, 220, 280];
// cuánto aire y cuánta «j» al lado de la voz (medido contra las referencias: ver la cabecera)
const AIRE = 0.45, JOTA = 0.08, AIRE_ARRIBA = 1.2;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const hashTexto = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// Qué risa le toca a cada duende: el Mandamás (y el Rey) la grave; los viejos oscuros y el grandote
// (que siempre viene de viejo) la ronca; el resto, los traviesos, la aguda.
export function claseDeRisa(tipo, viejo = false) {
  if (tipo === 'jefe' || tipo === 'rey') return 'mandamas';
  if (viejo || tipo === 'bruto') return 'viejo';
  return 'chico';
}
// La semilla de cada variante: fija, así el banco suena igual en cada partida y las pruebas la conocen.
export const semillaRisa = (clase, k) => (hashTexto(clase) % 9973) * 31 + k * 101 + 7;

// Cuál variante sigue: nunca la misma dos veces seguidas (con una sola, esa). `listas` son los
// índices que ya están hechos; `azar` de 0 a 1.
export function elegirVariante(listas, ultima = -1, azar = Math.random()) {
  if (!listas || !listas.length) return -1;
  const opciones = listas.length > 1 ? listas.filter((k) => k !== ultima) : listas;
  return opciones[Math.min(opciones.length - 1, Math.floor(clamp(azar, 0, 0.999999) * opciones.length))];
}
// ¿Cabe otra risa? `finales` son los momentos en que terminan las que suenan; devuelve la lista sin las
// que ya terminaron y si hay lugar.
export function cabeOtraRisa(finales, ahora, tope = TOPE_RISAS) {
  const vivas = (finales || []).filter((f) => f > ahora);
  return { vivas, cabe: vivas.length < tope };
}

// ------------------------------------------------------------------ el plan de una risa
// Devuelve las sílabas (cuándo, cuánto, qué tono y qué vocal), el gorjeo si hay y la duración.
// `llamado`: la risa larga con la que el duende avisa a los otros (dos sílabas más y más fuerte).
export function planRisa(clase = 'chico', semilla = 1, { llamado = false } = {}) {
  const C = CLASES_RISA[clase] || CLASES_RISA.chico;
  const az = crearAzar((semilla * 2654435761 + hashTexto(clase)) >>> 0);
  const entre = (a, b) => a + (b - a) * az();
  const elegir = (l) => l[Math.floor(az() * l.length) % l.length];
  const N = Math.floor(entre(C.silabas[0], C.silabas[1] + 0.999)) + (llamado ? 2 : 0);
  const base = entre(C.tono[0], C.tono[1]);
  const ioiBase = entre(C.ioi[0], C.ioi[1]) / 1000;
  const vocal = elegir(C.vocales);
  // qué tan pegadas van las sílabas: 0 bien cortadas (con silencio entre medio), 1 casi una sola tira
  const legato = entre(0.15, 0.75);
  const silabas = [];
  let t = 0.03;
  // la malicia: un «jm-jm» con la boca cerrada antes de largar (el que se aguanta la risa)
  if (az() < C.jm) {
    const n = az() < 0.5 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      const d = ioiBase * entre(0.75, 0.95);
      silabas.push({ t, dur: d * 0.8, f0: base * entre(0.62, 0.72), sube: entre(0.03, 0.07), vocal: 'm', cons: 'h', vol: entre(0.5, 0.65), aire: C.aire * 1.6, nariz: 1 });
      t += d * entre(1.0, 1.2);
    }
    t += ioiBase * entre(0.1, 0.4);
  }
  for (let k = 0; k < N; k++) {
    const u = N > 1 ? k / (N - 1) : 0;
    // el ritmo: las primeras dos un poco más largas, el medio corre y al final se frena
    let ioi = ioiBase * (k < 2 ? entre(1.05, 1.2) : 1) * (1 + 0.5 * Math.pow(u, 2.2)) * entre(0.84, 1.16);
    // de vez en cuando dos se pegan («jeje»)
    if (k > 1 && k < N - 2 && az() < 0.18) ioi *= 0.72;
    const dur = ioi * entre(0.66, 0.84) * (0.9 + legato * 0.2);
    const vol = (k === 0 ? entre(0.7, 0.92) : 1) * (1 - 0.48 * Math.pow(u, 1.5)) * entre(0.82, 1.05) * (llamado && k < 3 ? 1.12 : 1);
    const f0 = base * (1 - C.cae * Math.pow(u, 1.15)) * entre(0.95, 1.05);
    const v = az() < 0.22 ? (vocal === 'e' ? 'i' : vocal === 'i' ? 'e' : vocal === 'o' ? 'a' : 'e') : vocal;
    silabas.push({ t, dur, f0, sube: entre(C.sube[0], C.sube[1]), vocal: v, cons: clase === 'chico' && az() < 0.7 ? 'h' : 'x', vol, aire: C.aire * (1 + 0.5 * u), nariz: C.nariz });
    t += ioi;
  }
  let gorjeo = null;
  if (az() < C.gorjeo) {
    const ult = silabas[silabas.length - 1];
    // el gorjeo sale de la última sílaba: la voz se queda y tiembla
    const tg = ult.t + ult.dur * entre(0.35, 0.6);
    const dur = entre(0.42, 0.7) * (clase === 'chico' ? 1 : 1.3);
    gorjeo = { t: tg, dur, f0: ult.f0 * entre(0.96, 1.08), vibrato: entre(C.vibrato[0], C.vibrato[1]), hondo: entre(C.hondo[0], C.hondo[1]), vocal: vocal === 'i' ? 'e' : vocal === 'e' ? 'a' : vocal, vol: entre(0.85, 1) * Math.max(0.7, ult.vol * 1.6) };
    ult.dur = tg - ult.t + 0.03;
    t = tg + dur;
  }
  // el último aire: los viejos y el Mandamás largan el resto por la nariz
  const resoplido = clase !== 'chico' && az() < 0.5 ? { t: t + 0.04, dur: entre(0.18, 0.3), vol: entre(0.18, 0.28) } : null;
  const fin = Math.max(t, resoplido ? resoplido.t + resoplido.dur : 0) + 0.12;
  return { clase, semilla, llamado, base, ioi: ioiBase, legato, vocal, silabas, gorjeo, resoplido, dur: fin,
    formantes: C.formantes * entre(0.96, 1.04), ronco: C.ronco, nariz: C.nariz, aire: C.aire, brillo: C.brillo, oq: C.oq, niveles: C.niveles, soplo: C.soplo, pasaAltos: C.pasaAltos, anchos: C.anchos, ataque: entre(C.ataque[0], C.ataque[1]) };
}

// ------------------------------------------------------------------ la síntesis
// Resonador de Klatt: pasa la banda F con ancho BW y ganancia 1 en continua.
function coefRes(F, BW, T) {
  const C = -Math.exp(-2 * Math.PI * BW * T), B = 2 * Math.exp(-Math.PI * BW * T) * Math.cos(2 * Math.PI * F * T);
  return [1 - B - C, B, C];
}
const sCurva = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// Las pistas de control, una por milisegundo: tono, voz, aire, «j», vocal (F1..F3) y nariz.
function pistas(plan) {
  const P = 1000, n = Math.ceil(plan.dur * P) + 2;
  const f0 = new Float32Array(n), av = new Float32Array(n), ah = new Float32Array(n), ax = new Float32Array(n);
  const F = [new Float32Array(n), new Float32Array(n), new Float32Array(n)], nar = new Float32Array(n), boca = new Float32Array(n);
  const s = plan.formantes;
  // el tono y la vocal donde no hay sílaba: los de la más cercana
  const sil = plan.silabas;
  for (let i = 0; i < n; i++) {
    const t = i / P;
    // la sílaba que manda en este momento
    let k = 0; while (k + 1 < sil.length && sil[k + 1].t - 0.02 <= t) k++;
    const S = sil[k];
    const x = (t - S.t) / S.dur;
    // el tono: una Λ (sube hasta el 35 % y baja más de lo que subió)
    const xc = clamp(x, 0, 1);
    const lam = xc < 0.35 ? -0.06 + (S.sube + 0.06) * sCurva(xc / 0.35) : S.sube - (S.sube * 1.9 + 0.04) * sCurva((xc - 0.35) / 0.65);
    f0[i] = S.f0 * (1 + lam);
    // la voz: sube en `ataque` (con la forma de una s) y se apaga antes del final
    const at = Math.min(0.45, plan.ataque / S.dur);
    let e = 0;
    if (x >= 0 && x < 1) e = x < at ? Math.pow(Math.sin((Math.PI / 2) * x / at), 2) : Math.pow(1 - (x - at) / (1 - at), 1.3);
    // entre sílaba y sílaba no se corta del todo (más o menos según `legato`)
    const piso = plan.legato * 0.18 * S.vol * (x >= 1 && k + 1 < sil.length ? 1 : 0);
    av[i] = Math.max(e * S.vol, piso);
    // la «j»/«h»: aire antes de la vocal, que se mete en la vocal
    const pre = (S.cons === 'x' ? 0.04 : 0.03) / S.dur;
    const xa = x + pre;
    let eh = 0;
    if (xa >= 0 && x < 0.15) eh = Math.sin(Math.PI * clamp(xa / (pre + 0.15), 0, 1));
    // el aire de la vocal: sólo mientras dura la sílaba (y un poquito después), no se queda colgado
    const dentro = x > -0.05 && x < 1.15 ? Math.min(1, (1.15 - x) / 0.25) : 0;
    const aire = S.aire * (0.25 + 0.75 * e) * S.vol * dentro;
    ah[i] = Math.max(aire * 0.55, eh * S.vol * (S.cons === 'h' ? 0.75 : 0.5));
    ax[i] = S.cons === 'x' ? eh * S.vol * 0.55 : 0;
    // la vocal (y al abrir la boca en el pico, la F1 sube un poco)
    const V = VOCALES[S.vocal] || VOCALES.e;
    const abre = 1 + 0.1 * e;
    F[0][i] = V[0] * s * abre; F[1][i] = V[1] * s; F[2][i] = V[2] * s;
    nar[i] = S.nariz;
    boca[i] = S.vocal === 'm' ? 0 : 1;
  }
  // el gorjeo: la voz se sostiene con vibrato hondo; la amplitud late con el vibrato
  const G = plan.gorjeo;
  if (G) {
    const V = VOCALES[G.vocal] || VOCALES.e;
    for (let i = Math.floor(G.t * P); i < n && i < (G.t + G.dur) * P; i++) {
      const tg = Math.max(0, i / P - G.t), u = Math.min(1, tg / G.dur);
      const fase = 2 * Math.PI * G.vibrato * tg;
      const ent = sCurva(tg / 0.05), sal = Math.pow(1 - u, 1.4);
      f0[i] = G.f0 * Math.pow(2, (G.hondo * Math.sin(fase - 0.6)) / 12) * (1 - 0.12 * u);
      av[i] = Math.max(av[i], G.vol * ent * sal * (0.68 + 0.32 * Math.cos(fase - 0.6)));
      ah[i] = G.vol * plan.aire * 0.16 * ent * sal * (0.7 + 0.3 * Math.cos(fase - 0.6));
      const mez = sCurva(u * 1.4);
      const D = VOCALES.e;   // arranca en «e» y se va a la vocal de la risa
      F[0][i] = (D[0] * (1 - mez) + V[0] * mez) * s; F[1][i] = (D[1] * (1 - mez) + V[1] * mez) * s; F[2][i] = (D[2] * (1 - mez) + V[2] * mez) * s;
      boca[i] = 1;
    }
  }
  // el resoplido final: aire por la nariz, sin voz
  const R = plan.resoplido;
  if (R) {
    for (let i = Math.floor(R.t * P); i < n && i < (R.t + R.dur) * P; i++) {
      const u = clamp((i / P - R.t) / R.dur, 0, 1);
      ah[i] = Math.max(ah[i], R.vol * Math.sin(Math.PI * Math.pow(u, 0.6)));
      F[0][i] = VOCALES.m[0] * s; F[1][i] = VOCALES.m[1] * s; F[2][i] = VOCALES.m[2] * s; nar[i] = 1; boca[i] = 0;
    }
  }
  return { P, n, f0, av, ah, ax, F, nar, boca };
}

// La risa entera. Generador: cede cada tanto para que el motor la haga de a pedazos entre cuadros.
function* sintetizarRisa(plan, tasa = TASA_RISA) {
  const T = 1 / tasa, N = Math.ceil(plan.dur * tasa);
  const out = new Float32Array(N);
  const p = pistas(plan);
  yield;
  const az = crearAzar((plan.semilla * 40503 + 17) >>> 0);
  const ruido = () => az() * 2 - 1;
  const s = plan.formantes;
  // la glotis
  let fase = 0, f0Per = p.f0[0], ampPer = 1, oq = plan.oq || 0.55, alterna = 1, Uant = 0, ret = 0, deriva = 0, derivaV = 0;
  // la fase de retorno: el pulso se cierra suave (más rápido en las gargantas chicas: más brillo)
  const reloj = 1 - Math.exp(-2 * Math.PI * (plan.brillo || 4000) * T);
  // la boca: cinco resonancias en paralelo, cada una con su nivel (así se decide dónde está la energía,
  // que en una risa chica está entre 1 y 4 kHz y no en la fundamental), y la nariz (un polo y un cero)
  const bocas = [0, 1, 2, 3, 4].map(() => new Biquad('bp', 1000, 4, tasa));
  const NIV = plan.niveles || [1, 0.8, 0.5, 0.3, 0.15];
  const nariz = new Biquad('bp', 280 * s, 2.5, tasa);
  let cNZ = null; const zx = [0, 0];
  const pasaAltos = new Biquad('hp', plan.pasaAltos || 120, 0.7, tasa), pasaAltos2 = new Biquad('hp', (plan.pasaAltos || 120) * 0.85, 0.6, tasa);
  // el aire de la garganta: ruido sin graves (el soplo vive arriba de los 600 Hz)
  const pasaAire = new Biquad('hp', 600, 0.6, tasa), sinAgudos = new Biquad('lp', plan.soplo || 3800, 0.6, tasa);
  // el «jota»: ruido por una banda alta (el paladar), aparte de la boca
  const jota = new Biquad('bp', 2300 * s, 1.4, tasa);
  // y arriba de los 5 kHz casi nada: una risa no silba
  const techo = new Biquad('lp', 5000, 0.6, tasa), techo2 = new Biquad('lp', 5000, 0.6, tasa);
  let nivBoca = 1, hondoNariz = 0.5, x0ant = 0;
  const cada = Math.max(8, Math.round(tasa / 1000));
  for (let i = 0; i < N; i++) {
    const tc = i / tasa * p.P, k0 = Math.min(p.n - 2, Math.floor(tc)), fr = tc - k0;
    const lerp = (a) => a[k0] + (a[k0 + 1] - a[k0]) * fr;
    if (i % cada === 0) {
      const nar = p.nar[k0], boca = p.boca[k0];
      nivBoca = boca ? 1 : 0.18;   // con la boca cerrada casi todo sale por la nariz
      for (let f = 0; f < 5; f++) {
        const F = f < 3 ? p.F[f][k0] : (f === 3 ? 3500 : 4500) * s;
        const bw = ANCHOS[f] * (plan.anchos || 1) * (f === 0 ? 1 + 0.6 * nar : 1) * (1 + plan.ronco * 0.3);
        bocas[f].poner('bp', F, F / bw, tasa);
      }
      // el cero de la nariz cava entre 1 y 1,5 kHz (más hondo con más nariz)
      cNZ = coefRes((900 + 300 * (1 - nar)) * s, 160 + 300 * (1 - nar), T);
      hondoNariz = 0.25 + 0.6 * nar;
      jota.poner('bp', (1700 + 0.35 * p.F[1][k0]) * s, 1.4, tasa);
    }
    // ---- la glotis: un período por vez, cada uno un poco distinto (temblor, brillo y ronquera)
    const f0obj = lerp(p.f0);
    fase += f0Per * T;
    if (fase >= 1) {
      fase -= 1;
      // el temblor de cada período (jitter 0,8 %) y una deriva lenta, como de quien se ríe sin aire
      derivaV += (ruido() * 0.004 - deriva * 0.02); deriva = clamp(deriva + derivaV, -0.03, 0.03);
      f0Per = f0obj * (1 + deriva + ruido() * 0.008);
      ampPer = 1 + ruido() * 0.08;
      oq = clamp((plan.oq || 0.55) + ruido() * 0.04, 0.35, 0.8);
      // la ronquera: a veces un período se alarga y se alternan fuerte y flojo (el subarmónico)
      if (plan.ronco > 0) {
        alterna = alterna > 0.99 ? 1 - plan.ronco * 0.55 : 1;
        if (az() < plan.ronco * 0.08) f0Per *= 0.78 + az() * 0.15;
      }
    }
    const tp = oq * 0.62, tn = oq - tp;
    const U = fase < tp ? 0.5 * (1 - Math.cos(Math.PI * fase / tp)) : fase < oq ? Math.cos((Math.PI / 2) * (fase - tp) / tn) : 0;
    // la derivada del caudal, con el pico de cierre en 1
    const dU = (U - Uant) * (tasa / Math.max(60, f0Per)) * (2 * tn / Math.PI); Uant = U;
    ret += (dU - ret) * reloj;
    const av = lerp(p.av), ah = lerp(p.ah), ax = lerp(p.ax);
    const voz = ret * av * ampPer * alterna;
    // el aire: ruido que pasa más fuerte con la glotis abierta
    const asp = pasaAire.paso(sinAgudos.paso(ruido())) * ah * (0.5 + 0.5 * U) * AIRE;
    // ---- la boca: las resonancias en paralelo, con signos alternados (si no, entre dos se cancelan)
    // (como en el Klatt en paralelo: de la segunda resonancia para arriba entra la fuente realzada, +6 dB por octava)
    // (el aire no: el ruido ya trae sus agudos)
    const x0 = voz + asp, x0r = (voz - x0ant * 0.92) * 2.2 + asp * AIRE_ARRIBA; x0ant = voz;
    let x = 0;
    for (let f = 0; f < 5; f++) x += (f & 1 ? -1 : 1) * NIV[f] * bocas[f].paso(f ? x0r : x0);
    x = x * nivBoca + nariz.paso(x0) * (0.25 + 0.75 * p.nar[k0]) * 0.8;
    // y el cero de la nariz
    { const [Az, Bz, Cz] = cNZ; const y = (x - Bz * zx[0] - Cz * zx[1]) / Az; zx[1] = zx[0]; zx[0] = x; x += (y - x) * hondoNariz; }
    x = techo.paso(pasaAltos.paso(x));
    if (plan.pasaAltos > 400) x = pasaAltos2.paso(x);   // la garganta chica casi no tiene fundamental
    // (la radiación de los labios ya va en la fuente: la derivada del caudal)
    const salida = x;
    // la «j»: ruido por la banda del paladar, aparte de la boca
    out[i] = salida + techo2.paso(jota.paso(ruido())) * ax * JOTA;
    if ((i & 511) === 511) yield;
  }
  quitarContinua(out, tasa, 60);
  // entrada y salida sin chasquido
  const borde = Math.round(tasa * 0.004);
  for (let i = 0; i < borde && i < N; i++) { out[i] *= i / borde; out[N - 1 - i] *= i / borde; }
  return aPico(out, 0.9);
}

export { sintetizarRisa };
