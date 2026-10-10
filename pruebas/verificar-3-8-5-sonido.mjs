// 3.8.5 (sonido): la risa de los duendes y el piano de misterio, sintetizados por código.
//   · Las recetas existen y dan variantes distintas (seis por garganta, tres frases de piano).
//   · El tono de cada garganta: los traviesos agudos y rápidos, los viejos oscuros graves y lentos, el
//     Mandamás más grave y más lento todavía.
//   · Nunca la misma risa dos veces seguidas, y como mucho tres a la vez.
//   · En el Relax no suenan (los duendes son leyenda).
//   · El piano, una sola vez por noche, cuando salen.
//   · Y lo más importante: NADA grabado entra al juego (ni archivos de audio en el repo ni audio
//     escondido en base64 en src/). Las referencias que pasó el usuario sólo se midieron.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import * as RD from '../src/risa-duende.js';
import * as PM from '../src/piano-misterio.js';
import { completar, medir } from '../src/sonido-sintesis.js';
import { Sonido } from '../src/sonido.js';
import { crearBanco } from '../src/desafio-sonidos.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const raiz = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const huella = (d) => { let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + Math.round(d[i] * 1e4)) | 0; return h; };
// el brillo (centroide del espectro) de un pedazo, con una DFT chiquita: alcanza para ordenar las gargantas
function brillo(d, tasa) {
  const N = 512;
  let num = 0, den = 0;
  for (let o = 0; o + N < d.length; o += 2048) {
    for (let k = 1; k < N / 2; k++) {
      let re = 0, im = 0; const w = 2 * Math.PI * k / N;
      for (let i = 0; i < N; i++) { const x = d[o + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); re += x * Math.cos(w * i); im -= x * Math.sin(w * i); }
      const m = Math.hypot(re, im); num += m * k * tasa / N; den += m;
    }
  }
  return num / (den || 1);
}

// ============================================================ las recetas de la risa
{
  ok(RD.VARIANTES_RISA >= 6, 'al menos seis risas por garganta');
  ok(['chico', 'viejo', 'mandamas'].every((c) => RD.CLASES_RISA[c]), 'las tres gargantas: chico, viejo y Mandamás');
  ok(RD.TOPE_RISAS >= 2 && RD.TOPE_RISAS <= 3, 'el tope de risas a la vez es 2 o 3');
  const brillos = {};
  for (const c of Object.keys(RD.CLASES_RISA)) {
    const huellas = new Set(), planes = [];
    let suma = 0;
    for (let k = 0; k < RD.VARIANTES_RISA; k++) {
      const plan = RD.planRisa(c, RD.semillaRisa(c, k));
      planes.push(plan);
      ok(plan.silabas.length >= 4 && plan.dur > 0.8 && plan.dur < 4, `${c} ${k + 1}: una risa de verdad (${plan.silabas.length} sílabas, ${plan.dur.toFixed(2)} s)`);
      const d = completar(RD.sintetizarRisa(plan, RD.TASA_RISA));
      const m = medir(d);
      ok(m.nan === 0 && m.pico > 0.5 && m.pico <= 0.91 && m.rms > 0.02, `${c} ${k + 1}: suena, sin NaN ni recorte (pico ${m.pico.toFixed(2)}, rms ${m.rms.toFixed(3)})`);
      huellas.add(huella(d));
      if (k < 2) suma += brillo(d, RD.TASA_RISA);
    }
    brillos[c] = suma / 2;
    ok(huellas.size === RD.VARIANTES_RISA, `${c}: las ${RD.VARIANTES_RISA} variantes son distintas`);
    ok(new Set(planes.map((p) => `${p.silabas.length}|${Math.round(p.base)}|${p.vocal}`)).size >= 4, `${c}: varían en sílabas, tono o vocal`);
    // la semilla manda: la misma semilla da la misma risa
    ok(huella(completar(RD.sintetizarRisa(RD.planRisa(c, RD.semillaRisa(c, 0)), RD.TASA_RISA))) === huella(completar(RD.sintetizarRisa(planes[0], RD.TASA_RISA))), `${c}: la misma semilla, la misma risa`);
  }
  // el tono de cada garganta (el de las sílabas abiertas: sin el «jm» con la boca cerrada)
  const tonos = (c) => { const t = []; for (let k = 0; k < RD.VARIANTES_RISA; k++) for (const s of RD.planRisa(c, RD.semillaRisa(c, k)).silabas) if (s.vocal !== 'm') t.push(s.f0); return t; };
  const ritmo = (c) => { let s = 0; for (let k = 0; k < RD.VARIANTES_RISA; k++) s += RD.planRisa(c, RD.semillaRisa(c, k)).ioi; return s / RD.VARIANTES_RISA; };
  const ch = tonos('chico'), vj = tonos('viejo'), md = tonos('mandamas');
  if (process.env.DETALLE) console.log(brillos);
  ok(Math.min(...ch) > 380 && Math.max(...ch) < 1000, `los traviesos, agudos: ${Math.round(Math.min(...ch))} a ${Math.round(Math.max(...ch))} Hz (las referencias van de 425 a 830)`);
  ok(Math.min(...vj) > 120 && Math.max(...vj) < 300, `los viejos oscuros, graves: ${Math.round(Math.min(...vj))} a ${Math.round(Math.max(...vj))} Hz`);
  ok(Math.min(...md) > 60 && Math.max(...md) < 140, `el Mandamás, más grave: ${Math.round(Math.min(...md))} a ${Math.round(Math.max(...md))} Hz`);
  ok(ritmo('chico') < ritmo('viejo') && ritmo('viejo') < ritmo('mandamas'), `los chicos rápidos, los viejos lentos, el Mandamás más lento (${[ritmo('chico'), ritmo('viejo'), ritmo('mandamas')].map((x) => Math.round(x * 1000)).join(' < ')} ms entre sílabas)`);
  ok(brillos.chico > brillos.viejo && brillos.viejo > brillos.mandamas, `y el brillo baja con el tamaño (${Object.values(brillos).map(Math.round).join(' > ')} Hz)`);
  ok(brillos.chico > 2400 && brillos.chico < 4200, `el brillo del travieso, entre 2,5 y 4 kHz como las referencias (${Math.round(brillos.chico)} Hz)`);
  // el ritmo de una risa: se acelera y se apaga (la última sílaba más floja y más espaciada que las del medio)
  for (const c of ['chico', 'viejo']) {
    const p = RD.planRisa(c, RD.semillaRisa(c, 2)), s = p.silabas.filter((x) => x.vocal !== 'm');
    const ioiMedio = s[Math.floor(s.length / 2)].t - s[Math.floor(s.length / 2) - 1].t, ioiFin = s[s.length - 1].t - s[s.length - 2].t;
    ok(s[s.length - 1].vol < s[1].vol && ioiFin > ioiMedio * 0.95, `${c}: al final se frena y se apaga`);
    ok(s[1].f0 > s[s.length - 1].f0, `${c}: el tono baja de sílaba en sílaba`);
  }
  ok(Object.keys(RD.CLASES_RISA).some((c) => [0, 1, 2, 3, 4, 5].some((k) => RD.planRisa(c, RD.semillaRisa(c, k)).gorjeo)), 'alguna termina en gorjeo con vibrato');
  const g = [0, 1, 2, 3, 4, 5].map((k) => RD.planRisa('chico', RD.semillaRisa('chico', k)).gorjeo).find(Boolean);
  ok(g && g.vibrato >= 5.5 && g.vibrato <= 8.5 && g.hondo >= 1, `el gorjeo: vibrato de ${g?.vibrato.toFixed(1)} Hz, ±${g?.hondo.toFixed(1)} semitonos`);
  // quién se ríe cómo
  ok(RD.claseDeRisa('rastreador') === 'chico' && RD.claseDeRisa('saltador', false) === 'chico', 'los traviesos: risa de chico');
  ok(RD.claseDeRisa('rastreador', true) === 'viejo' && RD.claseDeRisa('bruto') === 'viejo', 'los viejos oscuros y el grandote: risa de viejo');
  ok(RD.claseDeRisa('jefe') === 'mandamas' && RD.claseDeRisa('rey') === 'mandamas', 'el Mandamás y el Rey: la grave');
}

// ============================================================ sin repetir y con tope
{
  let seguidas = 0, ultima = -1;
  const vistas = new Set();
  for (let i = 0; i < 2000; i++) {
    const k = RD.elegirVariante([0, 1, 2, 3, 4, 5], ultima, Math.random());
    if (k === ultima) seguidas++;
    vistas.add(k); ultima = k;
  }
  ok(seguidas === 0 && vistas.size === 6, 'nunca la misma risa dos veces seguidas, y salen todas');
  ok(RD.elegirVariante([3], 3, 0.5) === 3 && RD.elegirVariante([], -1) === -1, 'con una sola, esa; sin ninguna, nada');
  ok(RD.cabeOtraRisa([5, 6], 1).cabe && !RD.cabeOtraRisa([5, 6, 7], 1).cabe && RD.cabeOtraRisa([0.5, 6, 7], 1).cabe, 'el tope cuenta sólo las que siguen sonando');

  // el motor de verdad, con un contexto de audio de mentira: cinco risas juntas, suenan tres
  const nodo = () => ({ connect() {}, disconnect() {}, start() {}, stop() {}, addEventListener() {}, gain: { value: 1, setTargetAtTime() {}, setValueAtTime() {}, cancelScheduledValues() {} }, frequency: { value: 0 }, Q: { value: 0 }, playbackRate: { value: 1 }, buffer: null });
  const S = new Sonido();
  S.ctx = { currentTime: 10, createBufferSource: nodo, createGain: nodo, createBiquadFilter: nodo };
  S.bus = { efectos: nodo(), piano: nodo(), musica: nodo() };
  S.previo = new Map(); S.pendientes = new Map(); S.cola = [];
  for (const c of Object.keys(RD.CLASES_RISA)) for (let k = 0; k < RD.VARIANTES_RISA; k++) S.previo.set(`risa-${c}-${k}`, { duration: 2 });
  const r = [0, 1, 2, 3, 4].map(() => S.risaDuende('chico', { intensidad: 0.8 }));
  ok(r.filter((x) => x && x.dur).length === RD.TOPE_RISAS && r.slice(RD.TOPE_RISAS).every((x) => x === 0), `cinco duendes que se ríen juntos: suenan ${RD.TOPE_RISAS} (${r.map((x) => (x ? 'sí' : 'no')).join(' ')})`);
  ok(r[0].variante !== r[1].variante && r[1].variante !== r[2].variante, 'y no repiten la misma risa seguida');
  S.ctx.currentTime = 13;   // ya terminaron
  ok(S.risaDuende('viejo')?.clase === 'viejo', 'cuando terminan, hay lugar otra vez');
  // en el Relax no suena nada
  S.ctx.currentTime = 30; S.relax = true;
  ok(S.risaDuende('chico') === 0 && S.pianoMisterio(0) === 0, 'en el Relax ni risas ni piano');
  S.relax = false;
}

// ============================================================ el piano
{
  ok(PM.FRASES_PIANO.length >= 2 && PM.FRASES_PIANO.length <= 3, 'dos o tres frases de piano');
  const huellas = new Set();
  for (let k = 0; k < PM.FRASES_PIANO.length; k++) {
    const p = PM.planPiano(k);
    const mano = p.notas.filter((x) => x.midi >= 52 && !x.pedal);
    const ioi = (mano[mano.length - 1].t - mano[0].t) / (mano.length - 1);
    ok(ioi > 0.17 && ioi < 0.25, `${p.id}: el pulso de la referencia (una corchea cada ${Math.round(ioi * 1000)} ms)`);
    const midis = mano.map((x) => x.midi);
    ok(Math.min(...midis) >= 52 && Math.max(...midis) <= 76, `${p.id}: registro medio (${Math.min(...midis)} a ${Math.max(...midis)})`);
    const vel = mano.map((x) => x.vel);
    ok(vel.slice(-4).reduce((a, b) => a + b) > 2.5 * vel.slice(0, 4).reduce((a, b) => a + b), `${p.id}: crece de pianissimo a forte`);
    ok(p.dur > 5 && p.dur < 10, `${p.id}: dura ${p.dur.toFixed(1)} s`);
    const [L, R] = completar(PM.sintetizarPiano(p, PM.TASA_PIANO));
    const m = medir(L), mr = medir(R);
    ok(m.nan === 0 && mr.nan === 0 && Math.max(m.pico, mr.pico) > 0.85 && Math.max(m.pico, mr.pico) <= 0.91, `${p.id}: suena en estéreo, sin NaN ni recorte`);
    let dif = 0; for (let i = 0; i < L.length; i += 7) dif += Math.abs(L[i] - R[i]);
    ok(dif > 1, `${p.id}: los dos canales no son iguales (la sala y las cuerdas a los lados)`);
    huellas.add(huella(L));
    // nunca la misma melodía que la referencia (do, do#, re, re# en vueltas)
    const ref = [60, 61, 62, 63];
    let iguales = 0; for (let i = 0; i + 4 <= midis.length; i++) if (ref.every((r, j) => midis[i + j] === r)) iguales++;
    ok(iguales === 0, `${p.id}: una frase propia, no la de la referencia`);
  }
  ok(huellas.size === PM.FRASES_PIANO.length, 'las frases suenan distintas');
  // una vez por noche
  const reg = { noche: -1, frase: -1 };
  ok(PM.tocaElPiano(reg, 3) && !PM.tocaElPiano({ noche: 3 }, 3) && PM.tocaElPiano({ noche: 3 }, 4), 'el piano: una vez por noche');
  ok(!PM.tocaElPiano(reg, 3, { relax: true }), 'en el Relax no');
  ok(PM.frasePianoDeNoche(5, PM.frasePianoDeNoche(4)) !== PM.frasePianoDeNoche(4), 'nunca la misma frase que anoche');
  // y el banco del Desafío lo respeta
  let tocadas = 0;
  const falso = { pianoMisterio: () => { tocadas++; return 7; }, prepararPiano: () => 'ok', relax: false };
  const B = crearBanco(falso);
  B.piano(3); B.piano(3); B.piano(3);
  ok(tocadas === 1, `tres veces la misma noche: suena una (${tocadas})`);
  B.piano(4);
  ok(tocadas === 2 && B.pianoTocado().noche === 4, 'la noche siguiente vuelve a sonar');
  falso.relax = true; B.piano(5);
  ok(tocadas === 2, 'en el Relax no suena');
}

// ============================================================ el cableado
{
  const son = leer('src/sonido.js'), banco = leer('src/desafio-sonidos.js'), des = leer('src/desafio.js'), main = leer('src/main.js');
  ok(/import \{ CLASES_RISA, VARIANTES_RISA, TASA_RISA, planRisa, sintetizarRisa, semillaRisa, elegirVariante, cabeOtraRisa \} from '\.\/risa-duende\.js';/.test(son), 'el motor usa las recetas de la risa');
  ok(/if \(!this\.relax && !this\.offline\) this\.prepararDuendes\(\);/.test(son), 'las risas se sintetizan en la cola al empezar (y en el Relax no)');
  ok(/const L = lejania\(distancia\);/.test(son.slice(son.indexOf('risaDuende(clase'))) && /this\.fuente\(pos, L\.volumen/.test(son.slice(son.indexOf('risaDuende(clase'))), 'la risa se aleja como las voces (lejania y fuente: bus de efectos y su volumen)');
  ok(/this\.bus\.musica\.connect\(this\.bajaMusica\)/.test(son) && /this\.bajaMusica\?\.gain\.setTargetAtTime\(BAJA_MUSICA, t, 0\.4\)/.test(son), 'la música baja un poco mientras suena el piano');
  ok(/chillido: \(pos, tipo = 'rastreador', viejo = false\) => reir\(/.test(banco) && /llamado: \(pos, tipo = 'rastreador', viejo = false\) => reir\(/.test(banco), 'la alerta y el llamado son risas');
  ok((des.match(/S\.chillido\([^)]*!!a\.m\.viejo\)/g) || []).length >= 4, 'el duende que viene de viejo se ríe de viejo');
  ok(/empezarOleada\(tipos, true\);\n[^\n]*\n\s*S\.piano\?\.\(d\.oleadas\);/.test(des), 'el piano suena cuando empiezan a salir');
  ok(/S\.prepararPiano\?\.\(d\.oleadas \+ 1\);/.test(des), 'y se prepara en el aviso de la hora previa');
  ok(/sonido\.relax = !esDesafio;/.test(main), 'main.js le avisa al motor si es el Relax');
  ok(/vozAlien\(tipo, estado, \{/.test(son) && /v\.risa > 0 && v\.risaHondura > 0\.05/.test(son), 'la risita de antes queda (si las risas nuevas todavía no están)');
}

// ============================================================ nada grabado
{
  const AUDIO = /\.(wav|mp3|ogg|oga|flac|m4a|aac|opus|webm|aiff?)$/i;
  let enGit = null;
  try { enGit = execFileSync('git', ['ls-files'], { cwd: raiz, encoding: 'utf8' }).split('\n').filter(Boolean); } catch { enGit = null; }
  if (enGit) {
    const audio = enGit.filter((f) => AUDIO.test(f));
    ok(audio.length === 0, `ningún archivo de audio en el repo (${audio.join(', ') || 'ninguno'})`);
    let ignorada = false;
    try { execFileSync('git', ['check-ignore', '-q', 'pruebas/salidas/referencias-385/ref-risa-3.wav'], { cwd: raiz }); ignorada = true; } catch { ignorada = false; }
    ok(ignorada, 'la carpeta de las referencias la ignora git');
  }
  // y en lo que se arma (src/): ni archivos de audio ni audio escondido en base64
  const archivos = [];
  const recorrer = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) recorrer(p); else archivos.push(p); } };
  recorrer(path.join(raiz, 'src'));
  ok(!archivos.some((f) => AUDIO.test(f)), 'ni un archivo de audio en src/');
  const sospechas = [];
  for (const f of archivos) {
    if (!/\.(js|mjs|cjs|json|html|css)$/.test(f)) continue;
    const t = fs.readFileSync(f, 'utf8');
    // data:audio, y las cabeceras en base64 de RIFF/WAVE («UklGR»), ID3 («SUQz»), Ogg («T2dnUw»), FLAC («ZkxhQw»)
    if (/data:audio\//i.test(t) || /UklGR|SUQzB|T2dnUw|ZkxhQw/.test(t)) sospechas.push(path.basename(f) + ' (cabecera de audio)');
    // y cualquier tira de base64 larguísima (un audio de un segundo son decenas de miles de caracteres)
    if (/[A-Za-z0-9+/]{3000,}={0,2}/.test(t)) sospechas.push(path.basename(f) + ' (base64 larguísimo)');
  }
  ok(sospechas.length === 0, `nada de audio en base64 en src/ (${sospechas.join(', ') || 'limpio'})`);
}

console.log(`verificar-3-8-5-sonido: ${n} comprobaciones OK`);
