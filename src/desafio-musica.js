// Música de tensión del modo Desafío: nada de melodías, solo clima.
// Un dron grave en re, dos "cuerdas frotadas" (sierras desafinadas bajo un pasabajos)
// que respiran y se corren de nota muy despacio, un latido grave que se acelera con
// la cercanía de los duendes y, de vez en cuando, un silbido lejano que delata su
// presencia (3.8.0: antes era un tono vítreo de otro mundo; ahora los duendes se llaman
// silbando entre los árboles). Al alba, las cuerdas resuelven a re mayor y entra un acorde cálido.
// Todo entra por sonido.bus.musica, así el interruptor y el volumen de la música aplican.
// 2.7: las sierras son ahora la forma de onda de cuerda frotada del motor, con el roce
// del arco encima; el latido tiene golpe de parche y al alba entra una guitarra.
const azar = (a, b) => a + Math.random() * (b - a);
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

// Pares de notas (midi) para las dos cuerdas. Sin progresión fija: se eligen al azar
// y se deslizan de una a otra, así no hay un bucle reconocible.
const ACORDES = {
  // la hora previa: re menor insinuado, quieto
  previa: [[45, 53], [45, 52], [46, 53]],
  // ataque con pocos enemigos: menor con segundas que rozan
  baja: [[45, 53], [46, 53], [45, 52], [43, 53]],
  // ataque encima: tritonos y disminuidos, más inestable
  alta: [[44, 53], [46, 52], [44, 51], [46, 51]],
  // luna roja: más grave y oscura, semitonos contra el dron
  roja: [[44, 51], [46, 51], [44, 52], [39, 46]],
  // eclipse: cuartas y quintas vacías, suena hueco
  eclipse: [[45, 50], [43, 50], [45, 52], [38, 45]],
};
// 3.8.0: los silbidos de los duendes. Motivos cortos en re menor pentatónico (re, fa, sol,
// la, do), de pillo; algunos terminan en el tritono (sol#) y quedan colgados.
const SILBIDOS = [[81, 77], [84, 81, 79], [79, 81, 77], [86, 84, 81], [74, 77, 74], [81, 80], [77, 79, 80]];

export function crearMusicaTension(sonido) {
  let n = null;             // nodos de larga vida, se crean al hacer falta y se reciclan
  let nivel = 0;            // intensidad suavizada 0..1
  let proxLatido = 0, proxSilbido = 6, proxAcorde = 0, acorde = null;
  let albaHecha = false, albaHasta = 0, agacheHasta = 0, ultimoGolpe = -9;
  let quieto = 0, acumulado = 1;

  const listo = () => !!(sonido && sonido.ctx && sonido.bus && sonido.bus.musica);
  const corriendo = () => listo() && (!sonido.ctx.state || sonido.ctx.state === 'running');
  const puede = () => typeof sonido.puedeSonar !== 'function' || sonido.puedeSonar();

  function montar() {
    if (n && n.ctx === sonido.ctx) return n;
    n = null;
    const ctx = sonido.ctx, t = ctx.currentTime;
    const salida = ctx.createGain(); salida.gain.value = 0;
    salida.connect(sonido.bus.musica);
    // un poco de la reverb del lugar: la música "está" en el bosque, no en la cabeza
    let envio = null;
    if (sonido.envioReverb) { envio = ctx.createGain(); envio.gain.value = 0.55; salida.connect(envio); envio.connect(sonido.envioReverb); }
    // 2.7: las «sierras» son cuerdas frotadas: la forma de onda del motor (`ondas.cuerda`),
    // que se apaga hacia arriba como una cuerda de verdad, en vez de la sierra pelada
    const osc = (tipo, f, det = 0) => {
      const o = ctx.createOscillator();
      const forma = tipo === 'sawtooth' ? sonido.ondas?.cuerda : null;
      if (forma) o.setPeriodicWave(forma); else o.type = tipo;
      o.frequency.value = f; o.detune.value = det; o.start(t); return o;
    };
    const filtro = (f, q) => { const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = f; b.Q.value = q; return b; };
    const ganancia = () => { const g = ctx.createGain(); g.gain.value = 0; return g; };

    // dron: dos sierras en re2 apenas desafinadas (el batido lento da inquietud) + sub en re1
    const fDron = filtro(160, 0.8), gDron = ganancia();
    const dA = osc('sawtooth', hz(38), -4), dB = osc('sawtooth', hz(38), 5);
    dA.connect(fDron); dB.connect(fDron); fDron.connect(gDron); gDron.connect(salida);
    const sub = osc('sine', hz(26)), gSub = ganancia();
    sub.connect(gSub); gSub.connect(salida);

    // cuerdas frotadas: dos sierras bajo un pasabajos que un LFO lentísimo abre y cierra
    const fCuerda = filtro(500, 1.2), gCuerda = ganancia();
    const c1 = osc('sawtooth', hz(45), -7), c2 = osc('sawtooth', hz(53), 6);
    c1.connect(fCuerda); c2.connect(fCuerda); fCuerda.connect(gCuerda); gCuerda.connect(salida);
    const lfo = osc('sine', 0.05), gLfo = ctx.createGain(); gLfo.gain.value = 80;
    lfo.connect(gLfo); gLfo.connect(fCuerda.frequency);
    const oscs = [dA, dB, sub, c1, c2, lfo];
    // 2.7: el arco sobre la cuerda: un roce de ruido que pasa por el mismo filtro y la
    // misma ganancia que las cuerdas, así respira con ellas
    if (sonido.ruido) {
      const arco = ctx.createBufferSource(); arco.buffer = sonido.ruido; arco.loop = true;
      const fArco = ctx.createBiquadFilter(); fArco.type = 'bandpass'; fArco.frequency.value = 900; fArco.Q.value = 0.7;
      const gArco = ctx.createGain(); gArco.gain.value = 0.35;
      arco.connect(fArco); fArco.connect(gArco); gArco.connect(fCuerda);
      arco.start(t, Math.random() * 3);
      oscs.push(arco);
    }

    n = { ctx, salida, envio, fDron, gDron, dB, gSub, fCuerda, gCuerda, c1, c2, gLfo, oscs };
    acorde = null; proxAcorde = 0;
    return n;
  }

  // tras un rato de silencio se apagan los osciladores: no gastan CPU de día
  function desmontar() {
    if (!n) return;
    const viejo = n; n = null;
    try {
      const t = viejo.ctx.currentTime;
      viejo.salida.gain.setTargetAtTime(0, t, 0.05);
      for (const o of viejo.oscs) o.stop(t + 0.3);
    } catch {}
    setTimeout(() => { try { viejo.salida.disconnect(); if (viejo.envio) viejo.envio.disconnect(); } catch {} }, 600);
  }

  // nota sostenida de vida corta (subida, meseta, caída) que se apaga y se desconecta sola
  function pad({ frec, fin, cuando = 0, ataque = 1, sosten = 1, caida = 2, vol = 0.02, tipo = 'sine', corte = 0 }) {
    if (!n || !puede()) return;
    const ctx = sonido.ctx, t0 = ctx.currentTime + cuando, t1 = t0 + ataque, t2 = t1 + sosten, t3 = t2 + caida;
    const o = ctx.createOscillator(); o.type = tipo;
    o.frequency.setValueAtTime(frec, t0);
    if (fin) o.frequency.exponentialRampToValueAtTime(fin, t3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t1);
    g.gain.setValueAtTime(vol, t2);
    g.gain.exponentialRampToValueAtTime(0.0001, t3);
    let f = null;
    if (corte) { f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = corte; f.Q.value = 0.5; o.connect(f); f.connect(g); } else o.connect(g);
    g.connect(n.salida);
    o.start(t0); o.stop(t3 + 0.05);
    o.onended = () => { try { o.disconnect(); g.disconnect(); if (f) f.disconnect(); } catch {} };
  }

  // 3.8.0: la presencia de los duendes: un silbido lejano, dos o tres notas que se arrastran
  // un poco (como silba la gente, no un instrumento) y una que a veces se cae al final.
  // Con eclipse, una octava abajo y más lento: los viejos.
  function silbido(tension, eclipse) {
    const motivo = SILBIDOS[Math.floor(Math.random() * SILBIDOS.length)];
    const vol = 0.008 + tension * 0.007, paso = (eclipse ? 0.55 : 0.32) * azar(0.9, 1.15);
    motivo.forEach((m, i) => {
      const f = hz(m - (eclipse ? 12 : 0)), ultima = i === motivo.length - 1;
      const cae = ultima && Math.random() < 0.4 ? f * azar(0.93, 0.97) : f * azar(0.995, 1.005);
      pad({ frec: f * azar(0.985, 0.995), fin: cae, cuando: i * paso, ataque: 0.05, sosten: paso * (ultima ? 1.6 : 0.7), caida: ultima ? azar(1.2, 2.2) : 0.25, vol });
    });
  }

  function alba() {
    albaHecha = true;
    if (!corriendo() || !sonido.musicaActiva) return;
    montar();
    const t = sonido.ctx.currentTime;
    albaHasta = t + 9;
    proxLatido = 0; agacheHasta = 0;
    n.salida.gain.setTargetAtTime(1, t, 0.3);
    // las cuerdas resuelven por movimiento mínimo: la2 -> re3, fa3 -> fa#3
    n.c1.frequency.setTargetAtTime(hz(50), t, 0.9);
    n.c2.frequency.setTargetAtTime(hz(54), t, 0.9);
    n.fCuerda.frequency.setTargetAtTime(1100, t, 1.5);
    n.fCuerda.Q.setTargetAtTime(0.7, t, 1.5);
    n.dB.detune.setTargetAtTime(1, t, 1.2);  // el dron deja de batir: calma
    // acorde cálido de re mayor con novena, abierto y entrando de abajo hacia arriba
    const notas = [[38, 'triangle', 0.05, 0], [50, 'triangle', 0.032, 0.3], [57, 'sine', 0.028, 0.8], [62, 'sine', 0.02, 1.3], [66, 'sine', 0.016, 1.9], [64, 'sine', 0.009, 2.7], [74, 'sine', 0.005, 3.4]];
    for (const [m, tipo, vol, cuando] of notas) pad({ frec: hz(m), cuando, ataque: 1.8, sosten: 2.4, caida: 5, vol, tipo, corte: 1800 });
    // 2.7: y una guitarra que arpegia el mismo re mayor, despacio, como quien se sienta
    // a tocar cuando termina la noche (las cuerdas pulsadas del Relax)
    if (typeof sonido.pulsar === 'function') {
      [50, 57, 62, 66, 69, 74].forEach((m, i) => sonido.pulsar(m, { cuando: 1.6 + i * 0.16 + Math.random() * 0.03, dur: 4.5, vol: 0.05 - i * 0.004, destino: n.salida }));
    }
    acorde = null; proxAcorde = 0;
  }

  function golpeFinal() {
    if (!corriendo() || !sonido.musicaActiva) return;
    const t = sonido.ctx.currentTime;
    if (t - ultimoGolpe < 1.5) return;
    ultimoGolpe = t;
    montar();
    n.salida.gain.setTargetAtTime(1, t, 0.05);
    // todo se hunde de golpe: el silencio después del impacto es parte del efecto
    agacheHasta = t + 2.8;
    n.gDron.gain.setTargetAtTime(0.002, t, 0.06);
    n.gCuerda.gain.setTargetAtTime(0.001, t, 0.06);
    n.gSub.gain.setTargetAtTime(0.002, t, 0.06);
    const d = n.salida;
    if (typeof sonido.tono === 'function') {
      sonido.tono({ frec: 96, fin: 30, dur: 2.4, tipo: 'sine', vol: 0.22, ataque: 0.004, destino: d });
      sonido.tono({ frec: 190, fin: 60, dur: 0.5, tipo: 'triangle', vol: 0.06, ataque: 0.003, destino: d });
    }
    if (typeof sonido.golpeRuido === 'function' && sonido.ruido) sonido.golpeRuido({ dur: 1.6, frec: 220, q: 0.7, tipo: 'lowpass', vol: 0.18, destino: d, buffer: sonido.ruido });
    // brillo dorado suspendido (re6 contra mi bemol6) que queda flotando en la cámara lenta
    pad({ frec: hz(86), fin: hz(85.7), ataque: 0.02, sosten: 0.3, caida: 3.8, vol: 0.01 });
    pad({ frec: hz(87), fin: hz(86.6), ataque: 0.03, sosten: 0.3, caida: 3.2, vol: 0.007 });
  }

  function detener() {
    nivel = 0; albaHasta = 0; proxLatido = 0; agacheHasta = 0;
    if (!n || !listo()) return;
    const t = sonido.ctx.currentTime;
    n.salida.gain.setTargetAtTime(0, t, 0.7);
    n.gDron.gain.setTargetAtTime(0, t, 0.7);
    n.gCuerda.gain.setTargetAtTime(0, t, 0.7);
    n.gSub.gain.setTargetAtTime(0, t, 0.7);
  }

  function actualizar(dt, estado = {}) {
    dt = Number.isFinite(dt) ? limitar(dt, 0, 0.25) : 0;
    const e = estado || {};
    const activo = !!e.activo;
    const fase = e.fase || 'calma';
    const tension = limitar(Number(e.tension) || 0, 0, 1);
    const roja = e.especial === 'roja', eclipse = e.especial === 'eclipse', silenciosa = e.especial === 'silenciosa';
    const musica = !!(sonido && sonido.musicaActiva);

    if (fase === 'previa' || fase === 'ataque') albaHecha = false;
    if (activo && fase === 'alba' && !albaHecha) alba();

    // intensidad objetivo: la previa crece muy lento, el ataque sigue a la tensión
    let obj = 0, rapidez = 1;
    if (activo && musica) {
      if (fase === 'calma') { obj = tension * 0.1; rapidez = 0.15; }
      else if (fase === 'previa') { obj = 0.2 + tension * 0.2; rapidez = 0.08; }
      else if (fase === 'ataque') { obj = 0.45 + tension * 0.55; rapidez = 0.35; }
      else { obj = 0; rapidez = 0.25; }
      if (silenciosa) obj *= 0.6;
    }
    nivel += (obj - nivel) * Math.min(1, dt * rapidez);
    if (nivel < 1e-4) nivel = 0;

    if (!corriendo()) return;
    const t = sonido.ctx.currentTime;
    const necesita = musica && (nivel > 0.002 || obj > 0 || t < albaHasta || t < agacheHasta);
    if (!n) { if (!necesita) return; montar(); }
    if (n.ctx !== sonido.ctx) montar();
    if (!necesita) {
      quieto += dt;
      n.salida.gain.setTargetAtTime(0, t, 0.6);
      if (quieto > 8) desmontar();
      return;
    }
    quieto = 0;

    const enAlba = t < albaHasta;
    const conCuerdas = fase === 'previa' || fase === 'ataque';

    // las cuerdas cambian de par cada tanto, deslizándose (nunca un corte)
    if (conCuerdas && !enAlba) {
      proxAcorde -= dt;
      if (proxAcorde <= 0) {
        const lista = fase === 'previa' ? ACORDES.previa : roja ? ACORDES.roja : eclipse ? ACORDES.eclipse : tension > 0.55 ? ACORDES.alta : ACORDES.baja;
        let nuevo = lista[Math.floor(Math.random() * lista.length)];
        if (nuevo === acorde && lista.length > 1) nuevo = lista[(lista.indexOf(nuevo) + 1) % lista.length];
        const primero = acorde === null;
        acorde = nuevo;
        const tc = primero ? 0.05 : azar(1.4, 2.4);
        n.c1.frequency.setTargetAtTime(hz(acorde[0]), t, tc);
        n.c2.frequency.setTargetAtTime(hz(acorde[1]), t, tc * 1.3);
        proxAcorde = azar(14, 26) * (roja ? 0.7 : 1);
      }
    }

    // parámetros continuos, unas diez veces por segundo alcanza
    acumulado += dt;
    if (acumulado >= 0.1) {
      acumulado = 0;
      const agache = t < agacheHasta ? 0.05 : 1;
      const respira = 0.8 + 0.2 * Math.sin(t * 0.11) * Math.sin(t * 0.037 + 1);
      const oleaje = 0.5 + 0.5 * Math.sin(t * 0.13 + 0.7) * Math.sin(t * 0.047);
      n.salida.gain.setTargetAtTime(1, t, 0.8);
      n.gDron.gain.setTargetAtTime(nivel * 0.075 * respira * agache * (eclipse ? 0.6 : 1), t, 1.2);
      n.gSub.gain.setTargetAtTime(nivel * (eclipse ? 0.16 : 0.1) * agache, t, 1.2);
      if (!enAlba) {
        // roja: más cerrado y con más batido; eclipse: resonancia hueca
        const corte = eclipse ? 150 + nivel * 180 : roja ? 110 + nivel * 380 : 130 + nivel * 650;
        n.fDron.frequency.setTargetAtTime(corte, t, 2);
        n.fDron.Q.setTargetAtTime(eclipse ? 7 : 0.9, t, 2);
        n.dB.detune.setTargetAtTime(roja ? 22 : 5 + tension * 8, t, 3);
        n.fCuerda.frequency.setTargetAtTime(eclipse ? 480 : roja ? 300 + nivel * 600 : 380 + nivel * 900, t, 2);
        n.fCuerda.Q.setTargetAtTime(eclipse ? 4 : 1.2, t, 2);
      }
      n.gLfo.gain.setTargetAtTime(60 + nivel * 160, t, 2);
      let gc = 0;
      if (enAlba) gc = 0.035 * limitar((albaHasta - t) / 5, 0, 1);
      else if (conCuerdas) gc = nivel * 0.045 * (0.3 + 0.7 * oleaje) * (silenciosa ? 0.35 : 1) * agache;
      n.gCuerda.gain.setTargetAtTime(gc, t, enAlba ? 1.5 : 1.2);
    }

    // latido: grave, dos golpes (lub-dub), el tempo sigue a la tensión
    const conLatido = !enAlba && typeof sonido.tono === 'function' && (fase === 'ataque' || (fase === 'previa' && nivel > 0.28));
    if (conLatido) {
      let periodo = fase === 'previa' ? 1.9 : 1.45 - tension * 0.8;
      if (roja) periodo *= 0.78;
      if (silenciosa) periodo *= 1.25;
      if (proxLatido < t - 0.3) proxLatido = t + 0.05;
      let tope = 4;
      while (proxLatido < t + 0.15 && tope-- > 0) {
        const c = Math.max(0, proxLatido - t);
        const v = (fase === 'previa' ? 0.05 : 0.08 + tension * 0.08) * (silenciosa ? 0.55 : 1) * (t < agacheHasta ? 0.1 : 1);
        if (v > 0.002) {
          const d = n.salida;
          sonido.tono({ frec: 62, fin: 38, dur: eclipse ? 0.6 : 0.32, tipo: 'sine', vol: v, ataque: 0.012, destino: d, cuando: c });
          // un poco de armónicos para que se oiga en parlantes chicos
          // (2.7: un golpe sordo de parche, no un triángulo: se oye igual y suena a cuero)
          if (typeof sonido.golpeRuido === 'function' && sonido.ruido) sonido.golpeRuido({ dur: 0.08, frec: 190, q: 1.2, tipo: 'lowpass', vol: v * 0.9, destino: d, cuando: c, buffer: sonido.ruido });
          else sonido.tono({ frec: 118, fin: 70, dur: 0.09, tipo: 'triangle', vol: v * 0.22, ataque: 0.004, destino: d, cuando: c });
          if (!eclipse) sonido.tono({ frec: 56, fin: 36, dur: 0.26, tipo: 'sine', vol: v * 0.6, ataque: 0.012, destino: d, cuando: c + 0.24 + tension * -0.05 });
        }
        proxLatido += periodo * azar(0.96, 1.04);
      }
    } else proxLatido = 0;

    // silbidos esporádicos (3.8.0; antes, tonos vítreos): más seguidos cuanto más cerca están
    if (conCuerdas && !enAlba) {
      proxSilbido -= dt;
      if (proxSilbido <= 0) {
        silbido(tension, eclipse);
        let espera = fase === 'previa' ? azar(14, 30) : azar(8, 20) / (0.6 + tension);
        if (eclipse) espera *= 0.5;
        if (silenciosa) espera *= 0.7;
        proxSilbido = espera;
      }
    }
  }

  return {
    actualizar,
    alba,
    golpeFinal,
    detener,
    get nivel() { return nivel; },
  };
}
