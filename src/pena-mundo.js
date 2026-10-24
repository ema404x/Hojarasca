// 3.9.1 · LA PEÑA, lo que se oye y se ve: la guitarra del Cholo y el bombo de Anselmo en el rincón de la cantina, tocados por código (nada grabado ni
// bajado: la guitarra es la cuerda pulsada del banco de sonido, el bombo, un golpe grave con su soplo de aro), el tango y el chamamé de la peña, y los instrumentos en
// las manos de los que tocan. La música (la misma notación de las fiestas: `eventosMusica` de fiestas.js) suena en el bus de la música, sólo con los que tocan
// en su lugar (si falta el bombo, no hay bombo), más fuerte adentro y casi nada afuera, y baja cuando estás hablando con la moza o con alguien de tu mesa.
// Barato: nada por cuadro más que mirar si suena; un solo dibujo por instrumento (el material de las estructuras); sin luces ni sombras propias.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { eventosMusica } from './fiestas.js';
import { geoGuitarra } from './fiestas-mundo.js';

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const PI = Math.PI;
const OIR = 34;   // hasta dónde se oye (metros): afuera, apagada por las paredes

// El bombo legüero, colgado a la cadera: el cuerpo de madera, los dos parches y los aros
function geoBombo() {
  const c = new Constructor();
  const cil = (pos, r, alto, color, rot = [0, 0, 0], lados = 14) => c.agregar(new THREE.CylinderGeometry(r, r, alto, lados), { color, tipo: 0, matriz: matriz(pos, rot), variar: 0.05 });
  cil([0, 0, 0], 0.2, 0.17, '#6a3f22', [PI / 2, 0, 0]);
  cil([0, 0, 0.086], 0.205, 0.012, '#e8e0c8', [PI / 2, 0, 0]);
  cil([0, 0, -0.086], 0.205, 0.012, '#e8e0c8', [PI / 2, 0, 0]);
  cil([0, 0, 0.074], 0.214, 0.016, '#3a2418', [PI / 2, 0, 0]);
  cil([0, 0, -0.074], 0.214, 0.016, '#3a2418', [PI / 2, 0, 0]);
  return c.geometria();
}

export function crearPenaMundo(ctx) {
  const musica = { s: null, id: null, proxima: 0 };
  const instrumentos = new Map();   // npc → { cual, malla }
  const geos = { guitarra: null, bombo: null };
  const info = { sonando: null, golpes: 0, ultimo: 0 };

  // ---------------------------------------------------------------- los instrumentos en las manos
  function darInstrumento(npc, cual) {
    const ya = instrumentos.get(npc);
    if (ya && ya.cual === cual) { ya.malla.visible = true; return; }
    if (ya) { ya.malla.parent?.remove(ya.malla); instrumentos.delete(npc); }
    if (!cual || !npc?.torso || !ctx.mat) return;
    geos[cual] = geos[cual] || (cual === 'bombo' ? geoBombo() : geoGuitarra());
    const m = new THREE.Mesh(geos[cual], ctx.mat);
    if (cual === 'bombo') { m.position.set(0.1, -0.08, 0.2); m.rotation.set(0, -0.35, 0); }
    else { m.position.set(0.02, -0.05, 0.22); m.rotation.set(0, 0, -1.05); }
    npc.torso.add(m);
    instrumentos.set(npc, { cual, malla: m });
  }
  const quitarInstrumento = (npc) => { const ya = instrumentos.get(npc); if (ya) { ya.malla.parent?.remove(ya.malla); instrumentos.delete(npc); } };
  function sincronizar(guitarra, bombo) {
    for (const n of [...instrumentos.keys()]) if (n !== guitarra && n !== bombo) quitarInstrumento(n);
    if (guitarra) darInstrumento(guitarra, 'guitarra');
    if (bombo) darInstrumento(bombo, 'bombo');
  }

  // ---------------------------------------------------------------- los golpes
  // La guitarra: la melodía pulsada, el bajo y el rasgueo (la raíz, la quinta y la octava: ni mayor ni menor, vale para los dos); el bombo: el golpe grave con un
  // poco de soplo, y el golpe de aro (el parche)
  function tocar(s, e, cuando, destino, hay) {
    if (e.voz === 'melodia' && hay.guitarra) s.pulsar?.(e.midi, { cuando, dur: Math.max(1.2, e.dur * 2), vol: 0.13 * Math.pow(2, (e.midi - 57) / 24), destino });
    else if (e.voz === 'bajo' && hay.guitarra) s.pulsar?.(e.midi, { cuando, dur: Math.max(1.2, e.dur * 1.3), vol: 0.085, destino });
    else if (e.voz === 'rasgueo' && hay.guitarra) { [0, 7, 12].forEach((a, i) => s.pulsar?.(e.midi + a, { cuando: cuando + i * 0.014, dur: 0.55, vol: 0.04, destino })); }
    else if (e.voz === 'bombo' && hay.bombo) { s.tono?.({ frec: 92, fin: 50, dur: 0.34, tipo: 'sine', vol: 0.25, ataque: 0.004, destino, cuando }); s.golpeRuido?.({ dur: 0.12, frec: 210, tipo: 'lowpass', vol: 0.1, destino, cuando }); }
    else if (e.voz === 'parche' && hay.bombo) s.golpeRuido?.({ dur: 0.07, frec: 1800, q: 1.4, tipo: 'bandpass', vol: 0.08, destino, cuando });
  }
  function callar() {
    const s = ctx.sonido?.();
    if (musica.s && s?.ctx) {
      try { musica.s.destino.gain.setTargetAtTime(0, s.ctx.currentTime, 0.4); } catch { /* ya */ }
      const d = musica.s.destino;
      setTimeout(() => { try { d.disconnect(); } catch { /* ya */ } }, 2500);
    }
    musica.s = null; musica.id = null; info.sonando = null;
  }

  // ---------------------------------------------------------------- cada cuadro
  // `i`: { tanda: 'tango' | 'chamame' | null, guitarra: npc|null, bombo: npc|null, distancia (a la cantina), adentro, baja (0 a 1) }
  function actualizar(dt, i) {
    sincronizar(i.guitarra, i.bombo);
    const s = ctx.sonido?.();
    const hay = { guitarra: !!i.guitarra, bombo: !!i.bombo };
    if (!s?.ctx || !s.bus?.musica || !i.tanda || (!hay.guitarra && !hay.bombo) || i.distancia > OIR || s.musicaActiva === false) { if (musica.s) callar(); return; }
    s.proxMusica = Math.max(s.proxMusica || 0, 20);   // (que no se le encime una frase del piano del valle)
    const lejos = i.adentro ? 1 : Math.max(0, 1 - (i.distancia - 6) / (OIR - 6)) * 0.42;
    const vol = Math.max(0, Math.min(1, lejos)) * (1 - 0.6 * (i.baja || 0));
    const id = i.tanda;
    if (musica.s && musica.id !== id) callar();
    if (!musica.s) {
      if (s.ctx.currentTime < musica.proxima) return;
      const ev = eventosMusica(id);
      if (!ev) return;
      const destino = s.ctx.createGain(); destino.gain.value = 0.9 * vol; destino.connect(s.bus.musica);
      if (s.envioReverb) { const rv = s.ctx.createGain(); rv.gain.value = 0.5; destino.connect(rv); rv.connect((s.envioReverbMusica || s.envioReverb)); }
      musica.s = { destino, t0: s.ctx.currentTime + 0.2, i: 0, ev, fin: s.ctx.currentTime + 0.2 + ev.duracion + 1 };
      musica.id = id; info.sonando = id;
    }
    const m = musica.s, ahora = s.ctx.currentTime, hasta = ahora + 1.2 - m.t0;
    try { m.destino.gain.setTargetAtTime(0.9 * vol, ahora, 0.35); } catch { /* ya */ }
    while (m.i < m.ev.eventos.length && m.ev.eventos[m.i].cuando <= hasta) {
      const e = m.ev.eventos[m.i++];
      tocar(s, e, Math.max(0, m.t0 + e.cuando - ahora), m.destino, hay);
      info.golpes++;
    }
    if (m.i >= m.ev.eventos.length && ahora > m.fin) {
      const dd = m.destino; setTimeout(() => { try { dd.disconnect(); } catch { /* ya */ } }, 2000);
      musica.s = null; musica.proxima = ahora + 2.5;
    }
  }
  return { actualizar, callar, sincronizar, estado: () => ({ sonando: info.sonando, golpes: info.golpes, instrumentos: [...instrumentos.values()].map((x) => x.cual) }), geoBombo };
}
