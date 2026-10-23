// 4.8 ambiente: los sonidos nuevos del ambiente de la noche, sintetizados por código (sin audio descargado).
//
//   · crujidoRama   una rama que se dobla y cede: el quejido de la madera (pulsos irregulares de unos 60 a 110 por segundo que
//                   resuenan entre 700 y 1400 Hz), el chasquido seco con los modos de una rama fina (420 a 2700 Hz), a veces un
//                   segundo chasquido más flojo y, abajo, la hojarasca donde cae. Un segundo y medio. De lejos queda el chasquido.
//   · gritoTero     el tero alarmado: una serie de «ter-ó» ásperos y nasales (la primera sílaba corta y alta, 1750 a 1350 Hz; la
//                   segunda larga y más grave, 1450 a 950 Hz), que se aceleran y se afinan un poco más arriba en el medio.
//                   Entre 1,7 y 2,5 segundos.
//   · mugidoVaca    el mugido de una vaca: una «m» con la boca cerrada, el «uuu-ooo» que sube de 105 a 150 Hz y baja a 115, con
//                   vibrato lento y la garganta (formantes) abriéndose de «u» a «o». Entre 1,6 y 2,2 segundos.
//
// Módulo puro: las recetas devuelven Float32Array (como `sonido-sintesis.js`) y se prueban en Node. `crearSonidosAmbiente(sonido)`
// los reproduce con el motor del juego: un buffer por sonido, ubicado en el valle y alejado como las risas de los duendes (el
// aire se come los agudos, y el sonido tarda lo que tarda en cruzar la distancia). Nada de esto se crea por cuadro: se
// sintetiza de a pedazos en la cola del motor y sólo suena cuando el cronograma de la noche (`desafio-ambiente.js`) lo pide.
import { Biquad, TASA_PREVIA, terminar, nota } from './sonido-sintesis.js';
import { lejania } from './voz-alien.js';

const DOS_PI = Math.PI * 2;
const az = (azar, a, b) => a + azar() * (b - a);

// ------------------------------------------------------------------ la rama que cruje
function* crujidoRama(tasa, azar = Math.random) {
  const n = Math.floor(tasa * 1.5);
  const d = new Float32Array(n);
  // el quejido: madera que se dobla. Cada pulso es un golpecito amortiguado a la frecuencia de resonancia de la rama
  const quejido = az(azar, 0.16, 0.4), ritmo = az(azar, 60, 110), resonancia = az(azar, 700, 1400);
  for (let t = 0, i = 0; t < quejido; i++) {
    const subida = Math.sin(Math.PI * Math.min(1, t / quejido));
    const amp = (0.12 + azar() * 0.5) * (0.25 + subida * 0.75), i0 = Math.floor(t * tasa);
    const L = Math.floor(tasa * 0.005), f = resonancia * (0.9 + azar() * 0.2);
    for (let k = 0; k < L && i0 + k < n; k++) d[i0 + k] += amp * Math.sin(DOS_PI * f * k / tasa) * Math.exp(-k / (tasa * 0.0013));
    t += (1 / ritmo) * (0.55 + azar() * 0.9);
    if ((i & 15) === 15) yield;
  }
  yield;
  // el chasquido: un golpe seco y los modos de una rama fina que se rompe
  const chasquido = (t0, amp) => {
    const i0 = Math.floor(t0 * tasa);
    let lp = 0;
    const Lr = Math.floor(tasa * 0.012);
    for (let k = 0; k < Lr && i0 + k < n; k++) { lp += ((azar() * 2 - 1) - lp) * 0.7; d[i0 + k] += lp * amp * 0.9 * Math.exp(-k / (tasa * 0.0022)); }
    for (const [f, tau, a] of [[420, 0.034, 0.5], [900, 0.024, 0.7], [1650, 0.016, 0.5], [2700, 0.01, 0.28]]) {
      const ff = f * (0.88 + azar() * 0.24);
      const L = Math.floor(tau * 6 * tasa);
      for (let k = 0; k < L && i0 + k < n; k++) d[i0 + k] += a * amp * Math.sin(DOS_PI * ff * k / tasa) * Math.exp(-k / (tau * tasa));
    }
  };
  chasquido(quejido, 1);
  if (azar() < 0.6) chasquido(quejido + az(azar, 0.07, 0.3), az(azar, 0.3, 0.55));
  yield;
  // la hojarasca donde cae: ruido sin agudos que se apaga
  const i1 = Math.floor((quejido + 0.04) * tasa), Lh = Math.floor(tasa * az(azar, 0.25, 0.45));
  let lp = 0, lp2 = 0;
  for (let k = 0; k < Lh && i1 + k < n; k++) {
    lp += ((azar() * 2 - 1) - lp) * 0.35; lp2 += (lp - lp2) * 0.35;
    const env = Math.exp(-k / (Lh * 0.38)) * (azar() < 0.2 ? 1.6 : 0.7);
    d[i1 + k] += lp2 * 0.1 * env;
    if ((k & 2047) === 2047) yield;
  }
  yield;
  return yield* terminar(d, tasa, { corte: 90, pico: 0.9 });
}

// ------------------------------------------------------------------ el tero
function* gritoTero(tasa, azar = Math.random) {
  const golpes = 5 + Math.floor(azar() * 4);
  const d = new Float32Array(Math.floor(tasa * (golpes * 0.3 + 0.5)));
  let c = 0.04, periodo = az(azar, 0.28, 0.33);
  const altura = az(azar, 0.96, 1.06);
  for (let g = 0; g < golpes; g++) {
    // el medio de la serie es el más fuerte y el más agudo; el final se afloja
    const x = golpes > 1 ? g / (golpes - 1) : 0, fuerza = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, x * 0.9 + 0.1));
    const sube = 1 + 0.07 * Math.sin(Math.PI * x), f = altura * sube * (0.97 + azar() * 0.06);
    // «ter»: corta y alta
    yield* nota(d, tasa, { t0: c, dur: az(azar, 0.045, 0.06), curva: [[0, 1750 * f], [1, 1350 * f]], amp: fuerza * 0.85,
      arm: [1, 0.85, 0.6, 0.3, 0.14], aspero: { frec: az(azar, 70, 110), prof: 0.55 }, soplo: 0.05, ataque: 0.08, caida: 0.45 }, azar);
    // «ó»: larga, más grave y que cae
    yield* nota(d, tasa, { t0: c + 0.055, dur: az(azar, 0.1, 0.14), curva: [[0, 1450 * f], [0.5, 1300 * f], [1, 950 * f]], amp: fuerza,
      arm: [1, 0.8, 0.5, 0.24, 0.1], aspero: { frec: az(azar, 80, 120), prof: 0.5 }, soplo: 0.04, ataque: 0.12, caida: 0.5 }, azar);
    c += periodo;
    periodo = Math.max(0.2, periodo * az(azar, 0.95, 0.99));
  }
  return yield* terminar(d.subarray(0, Math.min(d.length, Math.floor((c + 0.25) * tasa))), tasa, { corte: 400, pico: 0.9 });
}

// ------------------------------------------------------------------ la vaca
function* mugidoVaca(tasa, azar = Math.random) {
  const dur = az(azar, 1.6, 2.2), n = Math.floor(tasa * (dur + 0.35));
  const d = new Float32Array(n);
  const f1 = [new Biquad('bp', 300, 5, tasa), new Biquad('bp', 700, 7, tasa), new Biquad('bp', 2300, 9, tasa)];
  const base = az(azar, 100, 112), tope = az(azar, 142, 156), fin = az(azar, 108, 122);
  const vibrato = az(azar, 4.2, 5.2), fVib = az(azar, 0, DOS_PI);
  let fase = 0, ruido = 0, suave = 0, fasev = fVib;
  for (let i = 0; i < n; i++) {
    const t = i / tasa, x = Math.min(1, t / dur);
    // la «m» de la boca cerrada, el «uu» que se abre en «oo» y el cierre
    const cerrada = Math.max(0, 1 - t / 0.2), abierta = Math.min(1, Math.max(0, (x - 0.12) / 0.35)), cierra = x > 0.82 ? (x - 0.82) / 0.18 : 0;
    let f0;
    if (x < 0.25) f0 = base + (tope - base) * Math.sin((x / 0.25) * Math.PI / 2) * 0.9;
    else f0 = tope - (tope - fin) * Math.pow((x - 0.25) / 0.75, 1.4);
    fasev += DOS_PI * vibrato / tasa;
    f0 *= 1 + 0.028 * Math.sin(fasev) * Math.min(1, x * 5) + (azar() - 0.5) * 0.004;
    fase += f0 / tasa; if (fase >= 1) fase -= 1;
    // un diente de sierra suavizado: la glotis de un animal grande, rica en armónicos graves
    const fuente = (1 - 2 * fase) * 0.9 + (azar() * 2 - 1) * 0.07;
    if ((i & 31) === 0) {
      const F1 = 250 + abierta * 250 - cierra * 110 + cerrada * -40, F2 = 480 + abierta * 340 - cierra * 200;
      f1[0].poner('bp', F1, 5, tasa); f1[1].poner('bp', F2, 7, tasa);
    }
    ruido += ((azar() * 2 - 1) - ruido) * 0.2;
    suave += (fuente - suave) * 0.45;
    const y = f1[0].paso(suave) * 1.0 + f1[1].paso(suave) * 0.6 + f1[2].paso(suave) * 0.05 + ruido * 0.008;
    // la envolvente: sube despacio, se sostiene y baja larga; la «m» es más bajita
    const sube = Math.min(1, t / 0.22), baja = Math.min(1, Math.max(0, (dur + 0.3 - t) / 0.6));
    d[i] = y * sube * baja * (0.45 + 0.55 * abierta);
    if ((i & 4095) === 4095) yield;
  }
  return yield* terminar(d, tasa, { corte: 38, pico: 0.9 });
}

// ------------------------------------------------------------------ el banco
// `nivel` es cuánto sube cada uno al sonar (el buffer sale con pico 0,9). Medido contra la risa de los duendes (nivel 0,3 y RMS 0,10:
// 0,030), que es la referencia del valle de noche: el tero (RMS 0,15) y la vaca (0,22) quedan en 0,033; la rama, un chasquido con
// mucho pico y poco RMS (0,04), va más alta para que el chasquido se oiga.
export const SONIDOS_AMBIENTE = {
  crujido: { receta: crujidoRama, variantes: 4, nivel: 0.45, reverb: 1.1 },
  tero: { receta: gritoTero, variantes: 3, nivel: 0.22, reverb: 0.9 },
  vaca: { receta: mugidoVaca, variantes: 3, nivel: 0.15, reverb: 1.2 },
};

export function crearSonidosAmbiente(sonido) {
  const listo = () => !!(sonido && sonido.ctx && sonido.bus && !sonido.relax);
  // suena un buffer en el valle, alejado como las risas: filtro del aire, retardo de la velocidad del sonido y cola de reverb
  function sonarLejos(buf, pos, nivel, reverb, vol = 1) {
    if (!buf || !listo() || !sonido.puedeSonar(2)) return null;
    const ctx = sonido.ctx;
    let dist = 0;
    if (pos && sonido.oyente) dist = Math.hypot(pos.x - sonido.oyente.x, (pos.y || 0) - sonido.oyente.y, pos.z - sonido.oyente.z);
    const L = lejania(dist);
    const destino = pos ? sonido.fuente(pos, L.volumen, Math.min(1.4, reverb * L.reverb)) : sonido.bus.efectos;
    if (!destino) return null;
    const s = ctx.createBufferSource(); s.buffer = buf;
    const velocidad = 0.97 + Math.random() * 0.06;
    s.playbackRate.value = velocidad;
    const g = ctx.createGain(); g.gain.value = nivel * vol * L.volumen;
    const aire = ctx.createBiquadFilter(); aire.type = 'lowpass'; aire.frequency.value = L.corte; aire.Q.value = 0.5;
    s.connect(g); g.connect(aire); aire.connect(destino);
    s.start(ctx.currentTime + (sonido.offline ? 0 : L.retardo));
    sonido.soltarAlTerminar(s, g, aire);
    return { dur: buf.duration / velocidad, distancia: dist };
  }
  const bancos = new Set();
  function sonar(clave, pos, o = {}) {
    const S = SONIDOS_AMBIENTE[clave];
    if (!S || !listo()) return null;
    bancos.add(clave);
    const reproducir = (buf) => sonarLejos(buf, pos, S.nivel, S.reverb, o.vol ?? 1);
    // si todavía no hay ninguna hecha, suena cuando salga de la cola (los sonidos del ambiente no importan perderse)
    const buf = sonido.variante(`ambiente-${clave}`, S.variantes, () => S.receta(TASA_PREVIA, Math.random), 0.2, reproducir);
    return buf ? reproducir(buf) : null;
  }
  // las prepara en la cola del motor (una vez): para cuando la noche las pida ya están hechas
  function preparar() {
    if (!listo()) return false;
    for (const [clave, S] of Object.entries(SONIDOS_AMBIENTE)) sonido.variantes(`ambiente-${clave}`, S.variantes, () => S.receta(TASA_PREVIA, Math.random));
    return true;
  }
  return {
    preparar, sonar,
    crujido: (pos, o) => sonar('crujido', pos, o),
    tero: (pos, o) => sonar('tero', pos, o),
    vaca: (pos, o) => sonar('vaca', pos, o),
    get usados() { return [...bancos]; },
  };
}

// Las recetas se exportan acá, en una línea: el empaquetador (armar.mjs) no reconoce `export function*`.
export { crujidoRama, gritoTero, mugidoVaca };
