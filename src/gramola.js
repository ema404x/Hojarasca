// 4.2: la música de la gramola (planos-lujo-2.js). Tres temas propios, escritos como notas y sintetizados en el momento con osciladores:
// nada de audios grabados. Un vals, una polca y una habanera, todos en re (como la música del valle, ver musica-relax.js), con un timbre
// de caja de música vieja (triángulo más su octava, pasado por un filtro grave) y un crujido de púa muy bajito.
// Costo: ninguno si no suena. Mientras suena, un temporizador cada 0,5 s programa los próximos 1,5 s de notas (unas pocas por segundo).
// Módulo con la parte pura (los temas y sus eventos, que se prueban en Node) y la parte que toca el audio (que recibe el motor `sonido`).
import { leerNotas } from './personal-musica.js';

// Los acordes: la nota del bajo (MIDI) y las tres del acompañamiento
const ACORDES = {
  D: { bajo: 50, tonos: [57, 62, 66] }, Dm: { bajo: 50, tonos: [57, 62, 65] },
  G: { bajo: 55, tonos: [59, 62, 67] }, Gm: { bajo: 55, tonos: [58, 62, 67] },
  A: { bajo: 45, tonos: [61, 64, 69] }, F: { bajo: 53, tonos: [57, 60, 65] },
};

// `pulso`: negras por minuto; `compas`: negras por compás; `estilo`: cómo acompaña el bajo; `acordes`: uno por compás
export const TEMAS = [
  {
    id: 'vals', nombre: 'Vals de la gramola', estilo: 'vals', pulso: 126, compas: 3, vueltas: 2,
    notas: 'D5:1 F#5:1 A5:1 A5:2 G5:1 F#5:1 E5:1 D5:1 E5:3 C#5:1 E5:1 A5:1 A5:2 F#5:1 E5:1 D5:1 C#5:1 D5:3 B4:1 D5:1 G5:1 G5:2 F#5:1 E5:1 D5:1 B4:1 A4:3 A4:1 C#5:1 E5:1 D5:1 E5:1 F#5:1 E5:1 C#5:1 A4:1 D5:3',
    acordes: ['D', 'D', 'D', 'A', 'A', 'A', 'A', 'D', 'G', 'G', 'G', 'D', 'A', 'D', 'A', 'D'],
  },
  {
    id: 'polca', nombre: 'Polca del domingo', estilo: 'polca', pulso: 160, compas: 2, vueltas: 3,
    notas: 'D5:0.5 F#5:0.5 A5:0.5 F#5:0.5 D5:1 A4:1 B4:0.5 D5:0.5 G5:0.5 D5:0.5 C#5:1 E5:1 D5:0.5 F#5:0.5 A5:0.5 F#5:0.5 E5:0.5 G5:0.5 A5:0.5 E5:0.5 C#5:0.5 E5:0.5 A4:0.5 C#5:0.5 D5:2 B5:1 G5:1 A5:1 F#5:1 G5:0.5 F#5:0.5 E5:0.5 C#5:0.5 D5:1 A4:1 D5:0.5 F#5:0.5 A5:0.5 F#5:0.5 D5:1 A4:1 E5:0.5 D5:0.5 C#5:0.5 B4:0.5 D5:2',
    acordes: ['D', 'D', 'G', 'A', 'D', 'A', 'A', 'D', 'G', 'D', 'A', 'D', 'D', 'D', 'A', 'D'],
  },
  {
    id: 'habanera', nombre: 'Habanera de la tarde', estilo: 'habanera', pulso: 92, compas: 4, vueltas: 1,
    notas: 'A4:1.5 D5:0.5 F5:1 E5:1 D5:2 A4:1 F4:1 C#5:1.5 E5:0.5 G5:1 F5:1 E5:3 R:1 D5:1.5 F5:0.5 A5:1 G5:1 F5:2 D5:1 Bb4:1 A4:1.5 C#5:0.5 E5:1 G5:1 D5:4 A4:1 C5:1 F5:2 E5:1 F5:1 G5:2 Bb4:1 D5:1 G5:2 F5:1 E5:1 C#5:2 D5:1.5 F5:0.5 A5:2 G5:1 F5:1 D5:2 E5:1.5 C#5:0.5 A4:2 D5:3 R:1',
    acordes: ['Dm', 'Dm', 'A', 'A', 'Dm', 'Gm', 'A', 'Dm', 'F', 'F', 'Gm', 'A', 'Dm', 'Gm', 'A', 'Dm'],
  },
];

// Los eventos de un tema, en segundos desde el principio: { cuando, dur, midi, vol, voz } (voz: 'mel' | 'bajo' | 'acorde')
const cache = new Map();
export function eventosDeTema(tema) {
  if (cache.has(tema.id)) return cache.get(tema.id);
  const seg = 60 / tema.pulso;
  const notas = leerNotas(tema.notas);
  const ev = [];
  let t = 0;
  for (const n of notas) { if (n.midi !== null) ev.push({ cuando: t * seg, dur: Math.max(0.25, n.t * seg * 1.5), midi: n.midi, vol: 0.1, voz: 'mel' }); t += n.t; }
  const largoBeats = t;
  // el acompañamiento, compás por compás (si el tema tiene menos compases que acordes, se corta; si tiene más, se vuelve a empezar)
  const compases = Math.round(largoBeats / tema.compas);
  for (let k = 0; k < compases; k++) {
    const ac = ACORDES[tema.acordes[k % tema.acordes.length]];
    if (!ac) continue;
    const b0 = k * tema.compas;
    const pone = (beat, midi, voz, vol, dur) => ev.push({ cuando: (b0 + beat) * seg, dur: dur * seg, midi, vol, voz });
    if (tema.estilo === 'vals') { pone(0, ac.bajo, 'bajo', 0.1, 1.6); pone(1, ac.tonos[1], 'acorde', 0.035, 0.8); pone(2, ac.tonos[2], 'acorde', 0.035, 0.8); }
    else if (tema.estilo === 'polca') { pone(0, ac.bajo, 'bajo', 0.1, 0.9); pone(1, ac.tonos[1], 'acorde', 0.04, 0.6); pone(1, ac.tonos[2], 'acorde', 0.03, 0.6); }
    else { pone(0, ac.bajo, 'bajo', 0.1, 1.2); pone(1.5, ac.tonos[1], 'acorde', 0.035, 0.7); pone(2, ac.bajo + 7, 'bajo', 0.07, 1.0); pone(3.5, ac.tonos[2], 'acorde', 0.035, 0.7); }
  }
  ev.sort((a, b) => a.cuando - b.cuando);
  const unaVuelta = largoBeats * seg;
  const todo = [];
  for (let v = 0; v < tema.vueltas; v++) for (const e of ev) todo.push({ ...e, cuando: e.cuando + v * unaVuelta });
  const r = { eventos: todo, duracion: unaVuelta * tema.vueltas };
  cache.set(tema.id, r);
  return r;
}

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const ADELANTO = 1.5;    // cuánto se programa por adelantado (s)
const TIC = 500;         // cada cuánto mira el temporizador (ms)
export const DISTANCIA_GRAMOLA = 18;    // más lejos que esto, la gramola se calla (main.js lo usa en la función `cerca`)

// Lo que suena ahora (uno solo a la vez en todo el juego)
const G = { suena: false, indice: 0, tema: null, ev: null, i: 0, t0: 0, fin: 0, salida: null, timer: null, sonido: null, cerca: null };
export const gramolaSuena = () => G.suena;
export const temaDeGramola = () => G.tema;

// Una nota: triángulo más su octava (más suave), con ataque corto y caída
function sonarNota(ctx, destino, e, cuando) {
  const f = hz(e.midi), dur = e.dur;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, cuando);
  g.gain.linearRampToValueAtTime(e.vol, cuando + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, cuando + dur);
  g.connect(destino);
  const o1 = ctx.createOscillator(); o1.type = e.voz === 'mel' ? 'triangle' : 'sine'; o1.frequency.value = f;
  o1.connect(g); o1.start(cuando); o1.stop(cuando + dur + 0.05);
  if (e.voz === 'mel') {
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.3;
    o2.connect(g2); g2.connect(g); o2.start(cuando); o2.stop(cuando + dur + 0.05);
  }
  o1.onended = () => { try { g.disconnect(); } catch { /* ya está */ } };
}

// Un crujido de púa: una ráfaga de ruido de unos milisegundos
function crujido(ctx, destino, ruido, cuando) {
  const s = ctx.createBufferSource(); s.buffer = ruido;
  const g = ctx.createGain(); g.gain.value = 0.012 + Math.random() * 0.012;
  s.connect(g); g.connect(destino);
  s.start(cuando, Math.random() * 0.3, 0.006);
}

function programar() {
  const s = G.sonido, ctx = s?.ctx;
  if (!G.suena || !ctx) return detenerGramola();
  if (G.cerca && !G.cerca()) return detenerGramola();
  const ahora = ctx.currentTime;
  const hasta = ahora + ADELANTO - G.t0;
  while (G.i < G.ev.eventos.length && G.ev.eventos[G.i].cuando <= hasta) {
    const e = G.ev.eventos[G.i++];
    sonarNota(ctx, G.salida.entrada, e, Math.max(ahora, G.t0 + e.cuando));
  }
  // el crujido: uno cada tanto
  if (Math.random() < 0.6) crujido(ctx, G.salida.entrada, G.salida.ruido, ahora + Math.random() * 0.4);
  if (G.i >= G.ev.eventos.length && ahora > G.fin) detenerGramola();
}

// E sobre la gramola: si suena, la para; si no, le da cuerda con el tema que sigue. Devuelve { suena, titulo } o { sinSonido: true }.
// `cerca` es una función que dice si el jugador sigue cerca (y si la gramola sigue en pie): si da falso, se calla sola.
export function alternarGramola(sonido, cerca) {
  if (G.suena) { const titulo = G.tema?.nombre; detenerGramola(); return { suena: false, titulo }; }
  const ctx = sonido?.ctx;
  if (!ctx || !sonido.bus?.efectos) return { sinSonido: true };
  try { if (ctx.state === 'suspended') ctx.resume(); } catch { /* sigue */ }
  const tema = TEMAS[G.indice % TEMAS.length];
  G.indice = (G.indice + 1) % TEMAS.length;
  // la cadena de salida: filtro grave (caja vieja) → volumen → bus de efectos
  const entrada = ctx.createBiquadFilter(); entrada.type = 'lowpass'; entrada.frequency.value = 2600; entrada.Q.value = 0.7;
  const volumen = ctx.createGain(); volumen.gain.value = 0.9;
  entrada.connect(volumen); volumen.connect(sonido.bus.efectos);
  const ruido = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
  const d = ruido.getChannelData(0);
  for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
  const ev = eventosDeTema(tema);
  Object.assign(G, { suena: true, tema, ev, i: 0, t0: ctx.currentTime + 0.25, fin: ctx.currentTime + 0.25 + ev.duracion + 1.5, salida: { entrada, volumen, ruido }, sonido, cerca });
  // la música de fondo se corre mientras suena
  try { sonido.bajaMusica?.gain.setTargetAtTime(0.3, ctx.currentTime, 0.4); } catch { /* sigue */ }
  programar();
  G.timer = setInterval(() => { try { programar(); } catch (e) { detenerGramola(); console.warn('gramola:', e); } }, TIC);
  return { suena: true, titulo: tema.nombre };
}

export function detenerGramola() {
  if (G.timer) { clearInterval(G.timer); G.timer = null; }
  const salida = G.salida, s = G.sonido, ctx = s?.ctx;
  G.suena = false; G.salida = null; G.ev = null; G.cerca = null;
  if (!salida || !ctx) return;
  try {
    const t = ctx.currentTime;
    salida.volumen.gain.cancelScheduledValues(t);
    salida.volumen.gain.setTargetAtTime(0, t, 0.15);
    s.bajaMusica?.gain.setTargetAtTime(1, t, 0.8);
    setTimeout(() => { try { salida.entrada.disconnect(); salida.volumen.disconnect(); } catch { /* ya está */ } }, 1500);
  } catch { /* sigue */ }
}
