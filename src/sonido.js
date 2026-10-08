// Sonido 100% sintetizado: ambiente, aves posicionales, pasos, lluvia, fuego y una música muy espaciada
// 2.7: casi nada sale ya de un oscilador pelado. Hojas, agua, lluvia, grillos, fuego,
// pisadas, cantos y cuerdas se sintetizan de antemano muestra por muestra (ver
// `sonido-sintesis.js`) y acá sólo se reproducen, afinan y ubican.
import { modos, capas, ronda } from './impactos.js';
import { espacioDe, lluviaQueSuena, camaDeTecho, gotasEnCuadro, gota, crujidosPorSegundo } from './techo-lluvia.js';
import { voz, lejania } from './voz-alien.js';
import { silbatoDe } from './personal-trochita.js';
import { actualizarTocadiscos, tocadiscosSuena } from './personal-musica.js';
import { TASA_PREVIA, completar, susurroHojas, burbujeo, borboteo, lluviaEstereo, coroGrillos, enjambre, crepitar, estallido, retumbo, pisada, SUELOS, chapoteo, chirrido, cuerdaPulsada, canto } from './sonido-sintesis.js';

const azar = (a, b) => a + Math.random() * (b - a);
// 2.7: para los sonidos de ambiente que, si su banco todavía no está, no suenan
const nada = () => {};

// 2.7: las cuerdas de la música se sintetizan cada cuatro semitonos y el resto se
// afina con la velocidad de reproducción (dos semitonos para cada lado no se notan).
const CUERDA_DESDE = 38, CUERDA_HASTA = 86, CUERDA_PASO = 4;
// Qué tan fuerte suena cada ave con su frase normalizada (pico 0.9). Medido contra las
// notas sueltas de antes: la misma energía (RMS), apenas un diez por ciento más. Los
// picos quedan por debajo de los de antes, porque las notas nuevas sostienen el tono.
const NIVEL_CANTO = {
  zorzal: 0.034, rayadito: 0.033, fiofio: 0.035, chucao: 0.12, carpintero: 0.2, cachanas: 0.04, concon: 0.084,
  ranita: 0.03, bandurrias: 0.031, picaflor: 0.06, cisnes: 0.028, martin: 0.05, cauquen: 0.022, chillido: 0.011, ave: 0.015,
};

export class Sonido {
  constructor() {
    this.ctx = null;
    this.volumen = 0.8;
    this.musicaActiva = true;
    this.mezcla = { ambiente: 1, efectos: 1, musica: 1 };
    this.paleta = null;
    this.proxMusica = 40;
    this.silbatoElegido = 'clasico';   // 2.8: el silbato de la trochita (ver `personal-trochita.js`)
  }

  // `ctxExterno` es para el banco de sonidos: se le pasa un OfflineAudioContext y el
  // motor entero se arma adentro, así lo que se renderiza a un archivo es exactamente
  // lo mismo que suena en el juego y no una maqueta aparte.
  iniciar(ctxExterno) {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC && !ctxExterno) return;
    const ctx = this.ctx = ctxExterno || new AC();
    this.offline = !!ctxExterno;

    this.master = ctx.createGain(); this.master.gain.value = this.volumen;
    // cadena de salida: corte de retumbe, algo de aire, compresión suave y limitador
    const corte = ctx.createBiquadFilter(); corte.type = 'highpass'; corte.frequency.value = 32; corte.Q.value = 0.5;
    const aire = ctx.createBiquadFilter(); aire.type = 'highshelf'; aire.frequency.value = 5200; aire.gain.value = 2.2;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 2.6; comp.knee.value = 24; comp.attack.value = 0.012; comp.release.value = 0.28;
    const limite = ctx.createDynamicsCompressor();
    limite.threshold.value = -2.5; limite.ratio.value = 20; limite.knee.value = 0; limite.attack.value = 0.002; limite.release.value = 0.12;
    this.master.connect(corte); corte.connect(aire); aire.connect(comp); comp.connect(limite); limite.connect(ctx.destination);

    // Tres espacios distintos, con su propia respuesta al impulso:
    // el bosque abierto, el interior de una casa de madera y la cueva.
    const impulso = (segundos, caida, brillo, ecos) => {
      const largo = Math.floor(ctx.sampleRate * segundos);
      const ir = ctx.createBuffer(2, largo, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        let lp = 0;
        for (let i = 0; i < largo; i++) {
          const t = i / largo;
          const env = Math.pow(1 - t, caida) * (i < 500 ? i / 500 : 1);
          // el aire se come los agudos con el tiempo: filtro pasabajos que se cierra
          const w = Math.random() * 2 - 1;
          lp += (w - lp) * (brillo * (1 - t * 0.85));
          d[i] = lp * env;
        }
        // reflexiones tempranas, que son las que dan la sensación de tamaño
        for (const [retardo, nivel] of ecos) {
          const k = Math.floor(ctx.sampleRate * retardo * (1 + c * 0.07));
          if (k < largo) d[k] += nivel * (c ? -1 : 1);
        }
      }
      const conv = ctx.createConvolver(); conv.buffer = ir; conv.normalize = true;
      return conv;
    };
    this.espacios = {
      // bosque: cola media, muy apagada de agudos, casi sin reflexiones limpias
      bosque: impulso(2.6, 3.4, 0.45, [[0.019, 0.22], [0.041, 0.15], [0.077, 0.09]]),
      // adentro: cola corta y seca, reflexiones cercanas de las paredes de tabla
      adentro: impulso(0.85, 5.5, 0.72, [[0.006, 0.5], [0.013, 0.36], [0.023, 0.24], [0.037, 0.15]]),
      // cueva: cola larga y grave, con eco marcado
      cueva: impulso(4.2, 2.2, 0.3, [[0.028, 0.45], [0.062, 0.34], [0.115, 0.26], [0.19, 0.18]]),
    };
    this.mezclaEspacio = {};
    for (const n of Object.keys(this.espacios)) {
      const g = ctx.createGain();
      g.gain.value = n === 'bosque' ? 1 : 0;
      this.espacios[n].connect(g); g.connect(this.master);
      this.mezclaEspacio[n] = g;
    }
    this.reverb = this.espacios.bosque;
    this.envioReverb = ctx.createGain(); this.envioReverb.gain.value = 0.5;
    for (const n of Object.keys(this.espacios)) this.envioReverb.connect(this.espacios[n]);

    this.bus = {};
    this.filtroAmbiente = ctx.createBiquadFilter();
    this.filtroAmbiente.type = 'lowpass';
    this.filtroAmbiente.frequency.value = 19000;
    this.filtroAmbiente.Q.value = 0.5;
    this.filtroAmbiente.connect(this.master);
    // 2.0: el ambiente y la música pasan por una ganancia propia que se agacha cuando algo
    // grita al lado (ver `agachar`). Va aparte de los buses para no pelearse con las
    // perillas del jugador ni con la mezcla por hora.
    this.agaches = { ambiente: ctx.createGain(), musica: ctx.createGain(), techo: ctx.createGain() };
    this.agaches.ambiente.connect(this.filtroAmbiente);
    this.agaches.musica.connect(this.master);
    this.agaches.techo.connect(this.master);
    for (const n of ['ambiente', 'efectos', 'musica']) { this.bus[n] = ctx.createGain(); this.bus[n].connect(n === 'efectos' ? this.master : this.agaches[n]); }
    this.bus.musica.gain.value = this.musicaActiva ? 0.5 : 0;

    const N = ctx.sampleRate * 4;
    this.ruido = ctx.createBuffer(1, N, ctx.sampleRate);
    const r = this.ruido.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < N; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526;
      r[i] = (b0 + b1 + b2 + w * 0.1848) * 0.22;
    }
    this.blanco = ctx.createBuffer(1, N, ctx.sampleRate);
    const bl = this.blanco.getChannelData(0);
    for (let i = 0; i < N; i++) bl[i] = Math.random() * 2 - 1;

    // 2.7: lo que se sintetiza de antemano (ver `sonido-sintesis.js`) entra por una cola
    // que se trabaja de a pedazos entre cuadros. Mientras tanto los bucles están armados
    // y mudos; cada uno arranca cuando su buffer está listo.
    this.previo = new Map(); this.pendientes = new Map(); this.cola = []; this.bancos = new Map();
    // Las formas de onda. Una sierra o una cuadrada pelada tienen armónicos hasta el
    // techo y suenan a consola vieja; éstas se apagan hacia arriba como cualquier cosa
    // que vibra de verdad. `tono` las usa cuando le piden sierra o cuadrada.
    const onda = (arm) => {
      const re = new Float32Array(arm.length + 1), im = new Float32Array(arm.length + 1);
      for (let i = 0; i < arm.length; i++) im[i + 1] = arm[i];
      return ctx.createPeriodicWave(re, im);
    };
    const serie = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
    this.ondas = {
      sawtooth: onda(serie(40, (h) => (1 / h) / (1 + (h / 10) ** 2))),
      square: onda(serie(40, (h) => (h % 2 ? (1 / h) / (1 + (h / 9) ** 2) : 0))),
      // el pulso de una glotis: cae parejo, con un valle suave que le da color de garganta
      glotal: onda(serie(48, (h) => Math.pow(h, -1.35) * (1 + 0.35 * Math.sin(h * 0.9)))),
      // una cuerda frotada: el arco deja todos los armónicos, más el segundo y el tercero
      cuerda: onda(serie(32, (h) => (1 / h) * (h === 2 || h === 3 ? 1.3 : 1) / (1 + (h / 14) ** 2))),
      // la quena: casi un seno, con un poco de segundo y tercer armónico
      quena: onda([1, 0.2, 0.08, 0.03, 0.012]),
    };

    const bucle = (buffer, filtros, destino) => {
      const s = ctx.createBufferSource(); s.buffer = buffer; s.loop = true;
      s.loopStart = 0; s.loopEnd = buffer.duration;
      let nodo = s;
      for (const f of filtros) { nodo.connect(f); nodo = f; }
      const g = ctx.createGain(); g.gain.value = 0;
      nodo.connect(g); g.connect(destino);
      s.start(0, Math.random() * 3);
      return g;
    };
    const filtro = (tipo, frec, q = 0.7) => { const f = ctx.createBiquadFilter(); f.type = tipo; f.frequency.value = frec; f.Q.value = q; return f; };
    // 2.7: un bucle cuyo buffer se sintetiza en la cola. La cadena (filtros y ganancia)
    // existe desde ya, así `actualizar` puede mover sus perillas; la fuente se engancha
    // cuando el buffer está listo, en un punto al azar del bucle.
    const bucleDe = (nombre, crear, filtros, destino, tasa = TASA_PREVIA) => {
      const g = ctx.createGain(); g.gain.value = 0;
      let entrada = g;
      for (let i = filtros.length - 1; i >= 0; i--) { filtros[i].connect(entrada); entrada = filtros[i]; }
      g.connect(destino);
      this.preparar(nombre, crear, (buf) => {
        const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
        s.connect(entrada); s.start(ctx.currentTime, Math.random() * buf.duration);
      }, tasa);
      return g;
    };

    this.fVientoGrave = filtro('lowpass', 420, 0.5);
    this.gViento = bucle(this.ruido, [this.fVientoGrave], this.bus.ambiente);
    // el silbido del viento entre las ramas: una resonancia que se corre
    // (2.7: menos angosta; con Q 6 sonaba a silbato)
    this.fSilbido = filtro('bandpass', 700, 4.5);
    this.gSilbido = bucle(this.blanco, [this.fSilbido], this.bus.ambiente);
    // 2.7: las hojas ya no son ruido blanco filtrado: son miles de tics sintetizados
    this.fHojas = filtro('bandpass', 2600, 0.4);
    this.gHojas = bucleDe('hojas', () => susurroHojas(TASA_PREVIA, 6.3), [this.fHojas], this.bus.ambiente);
    this.gArroyo = bucle(this.ruido, [filtro('lowpass', 1300, 0.4), filtro('highshelf', 3000)], this.bus.ambiente);
    // el agua corriendo no es una sola banda: abajo el caudal, en el medio el
    // roce sobre las piedras y arriba el chispeo de la superficie
    this.fArroyoMedio = filtro('bandpass', 900, 1.1);
    this.gArroyoMedio = bucle(this.blanco, [this.fArroyoMedio], this.bus.ambiente);
    this.fArroyoAgudo = filtro('bandpass', 3400, 2.2);
    this.gArroyoAgudo = bucle(this.blanco, [this.fArroyoAgudo], this.bus.ambiente);
    // 2.7: y lo que hace que suene a agua: burbujas de verdad, de todos los tamaños
    // (antes era un pasabanda que saltaba de tono en cada cuadro)
    this.gBurbuja = bucleDe('burbujeo', () => burbujeo(TASA_PREVIA, 6.7), [filtro('highpass', 280, 0.5)], this.bus.ambiente);
    this.gOrilla = bucle(this.ruido, [filtro('lowpass', 700, 0.4)], this.bus.ambiente);
    // 2.7: la lluvia son gotas sueltas sobre las hojas, en estéreo, no un siseo
    this.gLluvia = bucleDe('lluvia', () => lluviaEstereo(TASA_PREVIA, 5.3), [filtro('highpass', 420), filtro('lowpass', 9000)], this.bus.ambiente);
    this.gLluviaGrave = bucle(this.ruido, [filtro('lowpass', 500)], this.bus.ambiente);

    // 2.0: el techo. Va por su propio bus, que NO pasa por el filtro de adentro: el
    // techo está arriba de tu cabeza, no del otro lado de una pared. Un poco va a la
    // sala, para que la chapa suene a la pieza donde estás.
    this.bus.techo = ctx.createGain(); this.bus.techo.gain.value = 1;
    this.bus.techo.connect(this.agaches.techo);
    const techoSala = ctx.createGain(); techoSala.gain.value = 0.28;
    this.bus.techo.connect(techoSala); techoSala.connect(this.envioReverb);
    this.fTechoCama = filtro('bandpass', 1500, 0.6);
    this.gTechoCama = bucle(this.blanco, [this.fTechoCama], this.bus.techo);
    this.fTechoGrave = filtro('lowpass', 150, 0.7);
    this.gTechoGrave = bucle(this.ruido, [this.fTechoGrave], this.bus.techo);
    // cada gota cae en un lugar distinto del techo: un paneo por gota sale caro, así
    // que hay tres lugares fijos —izquierda, arriba, derecha— y cada gota elige uno
    this.ladosTecho = [-0.7, 0, 0.7].map((p) => {
      const pan = ctx.createStereoPanner(); pan.pan.value = p; pan.connect(this.bus.techo); return pan;
    });

    // 2.7: los grillos. Antes era un seno a 4400 Hz cortado por una cuadrada: un solo
    // grillo de juguete. Ahora son dos coros en estéreo, de largos que no se dividen
    // entre sí (el ciclo entero tarda más de un minuto y medio), y en cada coro cada
    // grillo tiene su tono, su ritmo, su lugar y sus silencios.
    this.gGrillos = ctx.createGain(); this.gGrillos.gain.value = 0;
    this.gGrillos.connect(this.bus.ambiente);
    for (const [nombre, seg, cuantos] of [['grillos-a', 7.37, 4], ['grillos-b', 10.91, 5]]) {
      // (a 24 kHz: el canto no pasa de los 11 kHz y el coro largo ocupa un cuarto menos)
      this.preparar(nombre, () => coroGrillos(24000, seg, cuantos), (buf) => {
        const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
        s.connect(this.gGrillos); s.start(ctx.currentTime, Math.random() * buf.duration);
      }, 24000);
    }

    // cascada (bucle posicional)
    this.panCascada = this.panner();
    this.gCascada = bucle(this.blanco, [filtro('lowpass', 1400, 0.7), filtro('highpass', 160, 0.6)], this.panCascada);
    this.panCascada.connect(this.bus.ambiente);

    // panal (bucle posicional)
    // 2.7: el zumbido era una sierra a 172 Hz con un LFO, que se oía como un
    // transformador. Ahora es un enjambre: once abejas, cada una con su aleteo.
    this.panPanal = this.panner();
    this.gPanal = bucle(this.blanco, [filtro('bandpass', 1400, 1.2)], this.panPanal);
    this.gPanalTono = bucleDe('enjambre', () => enjambre(24000, 4.3), [], this.panPanal, 24000);
    this.panPanal.connect(this.bus.efectos);

    // fuego (bucle posicional)
    this.panFuego = this.panner();
    this.gFuego = bucle(this.ruido, [filtro('lowpass', 380, 0.6)], this.panFuego);
    // 2.7: el crepitar va sintetizado (chasquidos de todos los tamaños, en racimos);
    // antes era un pasabanda sobre ruido blanco y un chasquido nuevo con su panner
    // nueve veces por segundo
    this.gFuegoMedio = bucleDe('crepitar', () => crepitar(TASA_PREVIA, 6.1), [filtro('highpass', 240, 0.5)], this.panFuego);
    this.proxChasquido = 0;
    this.panFuego.connect(this.bus.efectos);

    // 2.7: lo que no es bucle se prepara también, en orden de urgencia: los pasos (el
    // jugador camina enseguida), las aves, la música. Nada de esto traba: va en la cola.
    for (const sup of ['hojarasca', 'tierra', 'pasto', 'madera']) this.variantes(`paso-${sup}-p`, 4, () => pisada(sup, TASA_PREVIA, Math.random, false));
    for (const e of ['zorzal', 'rayadito', 'fiofio']) this.variantes(`canto-${e}`, 3, () => canto(e, TASA_PREVIA));
    for (let m = CUERDA_DESDE; m <= CUERDA_HASTA; m += CUERDA_PASO) this.preparar(`cuerda-${m}`, () => this.recetaCuerda(m));
    this.variantes('estallido', 4, () => estallido(TASA_PREVIA));
    this.variantes('borboteo', 4, () => borboteo(TASA_PREVIA));
    this.preparar('retumbo', () => retumbo(24000, 3.2), null, 24000);

    this.rafaga = 0.5; this.rafagaObj = 0.5; this.proxRafaga = 0;
    this.proxAve = 3; this.proxNoche = 10;
  }

  panner(pos) {
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 5; p.rolloffFactor = 1.1; p.maxDistance = 400;
    if (pos) this.ubicar(p, pos);
    return p;
  }
  ubicar(p, pos) {
    const t = this.ctx.currentTime;
    p.positionX.setValueAtTime(pos.x, t); p.positionY.setValueAtTime(pos.y, t); p.positionZ.setValueAtTime(pos.z, t);
  }

  // ------------------------------------------------------------------ 2.7: la cola de síntesis
  // Las recetas de `sonido-sintesis.js` son generadores que ceden cada tanto. Se corren
  // de a pedazos de pocos milisegundos cuando el navegador está ocioso, así el arranque
  // del audio no se come un cuadro. En el banco que renderiza a archivo (contexto
  // offline) se corren enteras al pedirlas, para que el archivo tenga todo.
  encolar(crear, alListo, tasa = TASA_PREVIA) {
    if (!this.ctx) return;
    const tarea = { gen: crear(), esperan: [alListo], tasa };
    if (this.offline) { this.terminar(tarea, completar(tarea.gen)); return; }
    this.cola.push(tarea);
    this.programarCola();
  }
  terminar(tarea, datos) {
    if (tarea.nombre) this.pendientes.delete(tarea.nombre);
    if (!datos) return;
    const buf = this.aBuffer(datos, tarea.tasa);
    if (tarea.nombre) this.previo.set(tarea.nombre, buf);
    for (const f of tarea.esperan) f?.(buf);
  }
  // Un buffer con nombre, que se hace una sola vez. Si ya está, `alListo` corre ahora.
  preparar(nombre, crear, alListo = null, tasa = TASA_PREVIA) {
    if (!this.ctx) return;
    const hecho = this.previo.get(nombre);
    if (hecho) { alListo?.(hecho); return; }
    const pendiente = this.pendientes.get(nombre);
    if (pendiente) { if (alListo) pendiente.esperan.push(alListo); return; }
    const tarea = { nombre, gen: crear(), esperan: alListo ? [alListo] : [], tasa };
    if (this.offline) { this.terminar(tarea, completar(tarea.gen)); return; }
    this.pendientes.set(nombre, tarea);
    this.cola.push(tarea);
    this.programarCola();
  }
  // Lo que hace falta ya y todavía está en la cola se termina en el momento (es chico).
  yaMismo(nombre) {
    const hecho = this.previo.get(nombre);
    if (hecho) return hecho;
    const tarea = this.pendientes.get(nombre);
    if (!tarea) return null;
    const i = this.cola.indexOf(tarea);
    if (i >= 0) this.cola.splice(i, 1);
    this.terminar(tarea, completar(tarea.gen));
    return this.previo.get(nombre) || null;
  }
  programarCola() {
    if (this.colaProgramada || !this.cola.length) return;
    this.colaProgramada = true;
    const correr = (plazo) => { this.colaProgramada = false; this.trabajarCola(plazo); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback((d) => correr(Math.max(1, Math.min(3, d.timeRemaining() - 1))), { timeout: 120 });
    else setTimeout(() => correr(3), 16);
  }
  trabajarCola(plazo = 3) {
    const t0 = performance.now();
    while (this.cola.length && performance.now() - t0 < plazo) {
      const tarea = this.cola[0];
      const r = tarea.gen.next();
      if (r.done) { this.cola.shift(); this.terminar(tarea, r.value); }
    }
    this.programarCola();
  }
  aBuffer(datos, tasa = TASA_PREVIA) {
    const canales = Array.isArray(datos) ? datos : [datos];
    const b = this.ctx.createBuffer(canales.length, canales[0].length, tasa);
    for (let c = 0; c < canales.length; c++) b.copyToChannel(canales[c], c);
    return b;
  }
  // Un banco de variantes del mismo sonido (pisadas, cantos, chasquidos). `variantes`
  // lo arma y lo encola; `variante` devuelve una ya hecha al azar, sin repetir la
  // última, y de vez en cuando (`renovar`) encarga una nueva para que la variedad no se
  // agote. Si todavía no hay ninguna: lo urgente (una pisada, un chapoteo) se hace en el
  // momento; lo que puede esperar (`alListo`) suena cuando sale de la cola, y un sonido
  // de ambiente que no importa perderse pasa `alListo` vacío y ese se lo saltea.
  variantes(clave, cuantas, crear) {
    let B = this.bancos.get(clave);
    if (B || !this.ctx) return B || null;
    B = { hechas: [], ultima: -1, cuantas, crear, renovando: false, esperan: [] };
    this.bancos.set(clave, B);
    for (let k = 0; k < cuantas; k++) this.encolar(crear, (buf) => this.guardarVariante(B, buf));
    return B;
  }
  guardarVariante(B, buf) {
    if (B.hechas.length < B.cuantas) B.hechas.push(buf);
    else B.hechas[Math.floor(Math.random() * B.hechas.length)] = buf;
    if (B.esperan.length) { const lista = B.esperan; B.esperan = []; for (const f of lista) f(buf); }
  }
  variante(clave, cuantas, crear, renovar = 0, alListo = null) {
    const B = this.variantes(clave, cuantas, crear);
    if (!B) return null;
    if (!B.hechas.length) {
      if (alListo) { if (B.esperan.length < 4) B.esperan.push(alListo); return null; }
      B.hechas.push(this.aBuffer(completar(crear())));
    }
    let k = Math.floor(Math.random() * B.hechas.length);
    if (k === B.ultima && B.hechas.length > 1) k = (k + 1) % B.hechas.length;
    B.ultima = k;
    if (renovar && !B.renovando && B.hechas.length >= B.cuantas && Math.random() < renovar) {
      B.renovando = true;
      this.encolar(crear, (buf) => { this.guardarVariante(B, buf); B.renovando = false; });
    }
    return B.hechas[k];
  }
  // Suena un buffer ya hecho: una fuente y una ganancia, nada más.
  sonarBuffer(buf, destino, vol = 1, cuando = 0, velocidad = 1) {
    if (!buf || !destino || !this.puedeSonar(1, cuando)) return null;
    const ctx = this.ctx, t = ctx.currentTime + cuando;
    const s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = velocidad;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(destino);
    s.start(t);
    this.soltarAlTerminar(s, g);
    return s;
  }
  // La receta de una cuerda de la música: abajo, guitarra criolla (cuerda de nylon,
  // pulsada lejos del puente); arriba, más brillante y con el orden doble del charango.
  recetaCuerda(m) {
    const agudo = m >= 66;
    const seg = Math.max(2.4, Math.min(4.6, 4.6 - (m - CUERDA_DESDE) * 0.05));
    return cuerdaPulsada(TASA_PREVIA, 440 * Math.pow(2, (m - 69) / 12), seg, agudo
      ? { brillo: 0.62, posicion: 0.13, doble: 1.5, amortiguar: 0.42 }
      : { brillo: 0.42, posicion: 0.19, doble: 0.8, amortiguar: 0.5 });
  }

  setVolumen(v) { this.volumen = v; if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }
  setMusica(on) { this.musicaActiva = on; if (this.ctx) this.bus.musica.gain.setTargetAtTime(on ? 0.5 * this.mezcla.musica : 0, this.ctx.currentTime, 0.5); }
  // 1.8: cada bus tiene su volumen. `mezcla` son las perillas del jugador; `hora`
  // es lo que el juego acomoda solo (de noche el bosque baja, la música sube).
  setMezcla({ ambiente, efectos, musica } = {}, hora = {}) {
    if (ambiente !== undefined) this.mezcla.ambiente = ambiente;
    if (efectos !== undefined) this.mezcla.efectos = efectos;
    if (musica !== undefined) this.mezcla.musica = musica;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.bus.ambiente.gain.setTargetAtTime(this.mezcla.ambiente * (hora.ambiente ?? 1), t, 0.6);
    // el techo es ambiente, con su misma perilla
    this.bus.techo?.gain.setTargetAtTime(this.mezcla.ambiente * (hora.ambiente ?? 1), t, 0.6);
    this.bus.efectos.gain.setTargetAtTime(this.mezcla.efectos * (hora.efectos ?? 1), t, 0.4);
    this.bus.musica.gain.setTargetAtTime(this.musicaActiva ? 0.5 * this.mezcla.musica * (hora.musica ?? 1) : 0, t, 0.8);
  }
  // 2.0: la mezcla se agacha. Cuando algo chilla al lado, el bosque y la música bajan
  // de golpe y vuelven despacio, para que el grito se escuche entero (ver
  // `desafio-sentidos.js`). Si llega otro más fuerte mientras tanto, manda el más fuerte.
  agachar(profundidad = 0.5, sostener = 0.6) {
    if (!this.ctx || !this.agaches) return;
    const t = this.ctx.currentTime;
    const p = Math.max(0, Math.min(0.85, profundidad));
    if (t < (this.agachadoHasta || 0) && p <= (this.agachadoCuanto || 0)) return;
    this.agachadoHasta = t + sostener; this.agachadoCuanto = p;
    this.agachadas = (this.agachadas || 0) + 1;
    for (const [n, g] of Object.entries(this.agaches)) {
      const k = n === 'musica' ? Math.min(0.9, p * 1.2) : p;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.setTargetAtTime(1 - k, t, 0.025);
      g.gain.setTargetAtTime(1, t + sostener, 0.5);
    }
  }
  pausar(p) { if (!this.ctx) return; if (p) this.ctx.suspend(); else this.ctx.resume(); }

  // ------------------------------------------------------------------ actualización por cuadro
  actualizar(dt, e) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx, t = ctx.currentTime;
    const L = ctx.listener;
    this.oyente = e.cam;
    // el espacio: bosque abierto, un alero, la carpa, adentro de una construcción o la
    // cueva (2.0: cada uno con lo que deja pasar, ver `techo-lluvia.js`)
    const E = espacioDe(e.espacio);
    this.espacioActual = e.espacio || 'bosque';
    // 2.8: el tocadiscos del refugio (ver `personal-musica.js`)
    actualizarTocadiscos(this, dt, e);
    if (L.positionX) {
      L.positionX.setValueAtTime(e.cam.x, t); L.positionY.setValueAtTime(e.cam.y, t); L.positionZ.setValueAtTime(e.cam.z, t);
      L.forwardX.setValueAtTime(e.adelante.x, t); L.forwardY.setValueAtTime(e.adelante.y, t); L.forwardZ.setValueAtTime(e.adelante.z, t);
      L.upX.setValueAtTime(0, t); L.upY.setValueAtTime(1, t); L.upZ.setValueAtTime(0, t);
    }

    this.proxRafaga -= dt;
    if (this.proxRafaga <= 0) { this.rafagaObj = azar(0.15, 1); this.proxRafaga = azar(2, 7); }
    this.rafaga += (this.rafagaObj - this.rafaga) * Math.min(1, dt * 0.6);
    // el viento no es parejo: llega en rachas que crecen y bajan
    if (!Number.isFinite(this.rafagaFina)) this.rafagaFina = 0;
    const objetivoFino = Math.sin(t * 0.37) * 0.5 + Math.sin(t * 1.13 + 1.7) * 0.3;
    this.rafagaFina += (objetivoFino - this.rafagaFina) * Math.min(1, dt * 1.4);
    const viento = e.viento * (0.4 + this.rafaga * 0.75 + this.rafagaFina * 0.25);
    const racha = Math.max(0, this.rafaga + this.rafagaFina * 0.5);
    // 2.0: con las rachas la estructura trabaja. Adentro cruje una tabla, en la carpa
    // la lona flamea. Es lo que dice que afuera sopla, aunque el viento no se oiga.
    if (Math.random() < crujidosPorSegundo(this.espacioActual, viento * (0.6 + racha * 0.5)) * dt) this.crujido(this.espacioActual);

    // 2.7: las perillas del ambiente se mueven diez veces por segundo, no en cada
    // cuadro: todas tienen constantes de tiempo de un tercio de segundo o más, así que
    // no se nota, y son treinta automatizaciones menos por cuadro para el hilo de audio.
    this.acumPerillas = (this.acumPerillas ?? 1) + dt;
    if (this.acumPerillas >= 0.1) {
      this.acumPerillas = 0;
      this.perillas(e, E, t, viento, racha);
    }

    // borboteos sueltos donde el agua salta una piedra
    // (2.7: burbujas de verdad, del banco; antes un seno que subía)
    if (e.arroyo > 0.25) {
      this.proxBorboteo = (this.proxBorboteo ?? 1) - dt;
      if (this.proxBorboteo <= 0) {
        this.proxBorboteo = azar(0.25, 1.3) / Math.max(0.3, e.arroyo);
        this.sonarBuffer(this.variante('borboteo', 4, () => borboteo(TASA_PREVIA), 0.1, nada), this.bus.ambiente, azar(0.03, 0.08) * e.arroyo, 0, azar(0.85, 1.2));
      }
    }
    // 2.7: en la orilla del lago, cada tanto una ola chica que lame las piedras
    if (e.orilla > 0.3) {
      this.proxOla = (this.proxOla ?? 2) - dt;
      if (this.proxOla <= 0) {
        this.proxOla = azar(2.2, 6);
        this.sonarBuffer(this.variante('ola', 3, () => chapoteo(TASA_PREVIA, Math.random, 0.6, 'remo'), 0.2, nada), this.bus.ambiente, azar(0.05, 0.1) * e.orilla, 0, azar(0.8, 1));
      }
    }
    // 2.0: el techo: encima de la cama, las gotas una por una
    const nGotas = gotasEnCuadro(e.techo, e.techo ? lluviaQueSuena(e.lluvia, e.invierno) : 0, dt);
    for (let i = 0; i < nGotas; i++) this.gotaEnTecho(e.techo, azar(0, Math.min(dt, 0.1)));
    // los chasquidos de la leña: el crepitar va en el bucle; acá, cada tanto, un
    // estallido más fuerte encima (2.7: un buffer del banco, sin panner propio)
    if (e.fuego) {
      this.ubicar(this.panFuego, e.fuego);
      this.proxChasquido -= dt;
      if (this.proxChasquido <= 0) {
        this.proxChasquido = azar(0.2, 1.4);
        this.sonarBuffer(this.variante('estallido', 4, () => estallido(TASA_PREVIA), 0.15, nada), this.panFuego, azar(0.04, 0.16), 0, azar(0.8, 1.25));
      }
    }
    if (e.cascada) this.ubicar(this.panCascada, e.cascada.pos);
    if (e.panal) this.ubicar(this.panPanal, e.panal.pos);

    // aves de día, bosque nocturno de noche
    this.proxAve -= dt;
    if (this.proxAve <= 0 && e.lluvia < 0.6) {
      const dia = 1 - e.noche;
      if (dia > 0.4) {
        const tirada = Math.random();
        const pos = e.puntoCercano(12, 55);
        if (tirada < 0.45) this.zorzal(pos);
        else if (tirada < 0.8) this.rayadito(pos);
        else this.fiofio(pos);
      } else if (e.noche > 0.6 && e.cercaMallin && Math.random() < 0.6) {
        this.ranita(e.puntoCercano(15, 40));
      }
      this.proxAve = dia > 0.4 ? azar(2.5, 9) * (e.invierno > 0.5 ? 2.5 : 1) : azar(6, 16);
    }

    // música espaciada: la paleta la arma el juego según estación, hora y lluvia
    this.proxMusica -= dt;
    if (this.proxMusica <= 0) {
      // 2.8: mientras suena un disco en el refugio, el piano del valle no se le encima
      if (this.musicaActiva && !tocadiscosSuena()) this.frase(e.noche, this.paleta);
      this.proxMusica = this.paleta?.espera ?? azar(70, 160);
    }
  }

  // 2.7: una perilla del ambiente hacia su valor
  perilla(g, v, t, tc = 0.4) { if (g && Number.isFinite(v)) g.gain.setTargetAtTime(v, t, tc); }

  // Los niveles del ambiente (ver `actualizar`). Todo lo que acá se mueve es lento.
  perillas(e, E, t, viento, racha) {
    if (this.mezclaEspacio) {
      for (const n in this.mezclaEspacio) this.mezclaEspacio[n].gain.setTargetAtTime(n === E.reverb ? 1 : 0, t, 0.35);
      // las paredes se comen los agudos de afuera
      if (this.filtroAmbiente) this.filtroAmbiente.frequency.setTargetAtTime(E.filtro, t, 0.4);
    }
    const altura = Math.min(1, Math.max(0, (e.cam.y - 20) / 60));
    this.perilla(this.gViento, 0.16 * viento * (1 + altura * 1.5) * E.viento, t, 0.5);
    // el silbido entre las ramas: aparece con las rachas y se corre de tono
    this.perilla(this.gSilbido, 0.048 * viento * viento * racha * (0.4 + altura) * E.viento, t, 0.5);
    this.fSilbido.frequency.setTargetAtTime(620 + racha * 520 + Math.sin(t * 0.21) * 120, t, 0.8);
    this.fVientoGrave.frequency.setTargetAtTime(260 + viento * 400, t, 0.5);
    this.perilla(this.gHojas, 0.075 * viento * e.bosque * (1 - e.invierno * 0.7) * E.hojas, t, 0.5);
    this.fHojas.frequency.setTargetAtTime(1800 + this.rafaga * 1800, t, 0.6);
    this.perilla(this.gArroyo, 0.42 * e.arroyo, t, 0.3);
    // las tres bandas respiran a distinto ritmo: el agua nunca suena pareja
    const respira1 = 0.72 + 0.28 * Math.sin(t * 0.31) * Math.sin(t * 0.13 + 1.1);
    const respira2 = 0.65 + 0.35 * Math.sin(t * 0.47 + 2.2) * Math.sin(t * 0.19);
    this.perilla(this.gArroyoMedio, 0.17 * e.arroyo * respira1, t, 0.35);
    this.perilla(this.gArroyoAgudo, 0.07 * e.arroyo * respira2, t, 0.4);
    this.fArroyoMedio.frequency.setTargetAtTime(760 + Math.sin(t * 0.23) * 180, t, 0.6);
    this.fArroyoAgudo.frequency.setTargetAtTime(3100 + Math.sin(t * 0.37 + 1.4) * 700, t, 0.5);
    this.perilla(this.gBurbuja, 0.12 * e.arroyo * (0.8 + 0.2 * respira2), t, 0.3);
    this.perilla(this.gOrilla, 0.22 * e.orilla * (0.6 + 0.4 * Math.sin(t * 0.7) * Math.sin(t * 0.23)), t, 0.5);
    const lluviaVol = e.lluvia * E.lluvia * (e.invierno > 0.5 ? 0.15 : 1);
    this.perilla(this.gLluvia, 0.2 * lluviaVol, t, 1); this.perilla(this.gLluviaGrave, 0.25 * lluviaVol, t, 1);
    // 2.0: el techo. La cama según el material.
    const cama = camaDeTecho(e.techo, e.techo ? lluviaQueSuena(e.lluvia, e.invierno) : 0);
    this.perilla(this.gTechoCama, cama.vol, t, 0.8); this.perilla(this.gTechoGrave, cama.grave, t, 0.8);
    if (cama.vol > 0) {
      this.fTechoCama.frequency.setTargetAtTime(cama.frec, t, 0.3); this.fTechoCama.Q.setTargetAtTime(cama.q, t, 0.3);
      this.fTechoGrave.frequency.setTargetAtTime(cama.frecGrave, t, 0.3);
    }
    this.perilla(this.gGrillos, 0.085 * e.noche * (1 - e.invierno) * (1 - e.lluvia) * (1 - e.otono * 0.6), t, 2);
    this.perilla(this.gFuego, e.fuego ? 0.5 : 0, t, 0.5);
    this.perilla(this.gFuegoMedio, e.fuego ? 0.42 * (0.7 + 0.3 * Math.sin(t * 2.3) * Math.sin(t * 0.9)) : 0, t, 0.5);
    this.perilla(this.gCascada, e.cascada ? 0.5 * e.cascada.fuerza : 0, t, 0.8);
    this.perilla(this.gPanal, e.panal ? 0.045 * e.panal.fuerza : 0, t, 0.6);
    this.perilla(this.gPanalTono, e.panal ? 0.15 * e.panal.fuerza : 0, t, 0.6);
  }

  // ------------------------------------------------------------------ utilidades de síntesis
  tono({ frec, fin, dur, tipo = 'sine', vol = 0.2, ataque = 0.01, destino, cuando = 0, vibrato = 0 }) {
    if (!destino || !this.puedeSonar(1, cuando)) return;
    const ctx = this.ctx, t = ctx.currentTime + cuando;
    const o = ctx.createOscillator();
    // 2.7: la sierra y la cuadrada salen de las formas de onda suaves (ver `iniciar`)
    const forma = this.ondas?.[tipo];
    if (forma) o.setPeriodicWave(forma); else o.type = tipo;
    o.frequency.setValueAtTime(frec, t);
    if (fin) o.frequency.exponentialRampToValueAtTime(fin, t + dur);
    if (vibrato) {
      const l = ctx.createOscillator(); l.frequency.value = vibrato;
      const lg = ctx.createGain(); lg.gain.value = frec * 0.03;
      l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05);
      l.onended = () => { try { l.disconnect(); lg.disconnect(); } catch {} };
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(destino);
    o.start(t); o.stop(t + dur + 0.05);
    // 2.6.1: al terminar se suelta del bus: si no, la ganancia quedaba colgada del destino
    o.onended = () => { try { o.disconnect(); g.disconnect(); } catch {} };
    return o;
  }

  // Tope de sonidos que pueden sonar a la vez. Evita picos cuando coinciden pasos,
  // fuego, tren y bichos.
  //
  // 1.9: antes contaba por llamada, no por momento. Con los sonidos de una sola capa
  // daba igual, pero un árbol cayéndose son casi veinte golpes repartidos a lo largo
  // de dos segundos, y se pedían todos juntos en un cuadro: el tope se comía la mitad
  // y el sonido salía mocho. Ahora cada ventana de 50 ms lleva su propia cuenta, así
  // que lo que se programa para más adelante no le gasta el presupuesto a lo de ahora.
  puedeSonar(costo = 1, cuando = 0) {
    const ahora = this.ctx ? this.ctx.currentTime : 0;
    const clave = Math.round((ahora + Math.max(0, cuando)) / 0.05);
    if (!this.ventanas) this.ventanas = new Map();
    // se limpian las ventanas que ya pasaron, para que el mapa no crezca
    if (clave !== this.ultimaClave) {
      this.ultimaClave = clave;
      for (const k of this.ventanas.keys()) if (k < Math.round(ahora / 0.05) - 2) this.ventanas.delete(k);
    }
    const usado = this.ventanas.get(clave) || 0;
    if (usado + costo > 26) return false;
    this.ventanas.set(clave, usado + costo);
    return true;
  }

  // 2.6.1: desconecta los nodos de un sonido suelto cuando termina su fuente. Los que
  // van a un bus fijo (efectos, techo, ambiente) quedaban colgados de él para siempre.
  soltarAlTerminar(fuente, ...nodos) {
    fuente.addEventListener('ended', () => { try { fuente.disconnect(); for (const n of nodos) n?.disconnect(); } catch {} });
  }

  // 2.7: `fin` barre el filtro hasta esa frecuencia (un zumbido que cae, un chorro que
  // se abre). Y un golpe grave y largo sin buffer propio —una explosión, un derrumbe—
  // usa el retumbo sintetizado: el estallido y las rodadas que vuelven del valle, en vez
  // de ruido blanco que se apaga parejo.
  golpeRuido({ dur, frec, q = 1, tipo = 'bandpass', vol = 0.3, destino, cuando = 0, buffer, fin }) {
    if (!destino || !this.puedeSonar(1, cuando)) return;
    const ctx = this.ctx, t = ctx.currentTime + cuando;
    const retumbo = !buffer && tipo === 'lowpass' && frec <= 220 && dur >= 0.6 ? this.previo.get('retumbo') : null;
    const s = ctx.createBufferSource(); s.buffer = retumbo || buffer || this.blanco;
    const f = ctx.createBiquadFilter(); f.type = tipo; f.frequency.value = frec; f.Q.value = q;
    if (fin) f.frequency.exponentialRampToValueAtTime(fin, t + dur);
    const g = ctx.createGain();
    if (retumbo) {
      // el retumbo ya trae su caída: acá sólo se sostiene y se cierra al final
      // (el ruido marrón deja pasar mucho más por un pasabajos grave que el blanco:
      // este factor lo empareja con lo que sonaba antes, un poco más fuerte)
      g.gain.setValueAtTime(vol * 0.13 * Math.pow(frec / 150, 0.65), t);
      g.gain.setTargetAtTime(0, t + dur * 0.55, dur * 0.2);
    } else {
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    s.connect(f); f.connect(g); g.connect(destino);
    if (retumbo) s.start(t, 0, Math.min(retumbo.duration, dur * 1.6)); else s.start(t, Math.random() * 3, dur + 0.05);
    // 2.6.1: igual que `tono`: filtro y ganancia se desconectan cuando termina el golpe
    s.onended = () => { try { s.disconnect(); f.disconnect(); g.disconnect(); } catch {} };
  }

  // Una fuente en el espacio. Devuelve null si todavía no hay motor de audio: el
  // contexto recién existe después del primer clic del jugador, y hasta entonces el
  // juego puede pedir sonidos igual (un invasor que muere en el primer cuadro).
  fuente(pos, vol = 1, reverb = 0.6) {
    if (!this.ctx) return null;
    const p = this.panner(pos);
    const g = this.ctx.createGain(); g.gain.value = vol;
    // el aire se come los agudos: cuanto más lejos, más apagado
    const d = this.oyente && pos ? Math.hypot(pos.x - this.oyente.x, (pos.y || 0) - this.oyente.y, pos.z - this.oyente.z) : 0;
    const aire = this.ctx.createBiquadFilter();
    aire.type = 'lowpass';
    aire.frequency.value = Math.max(700, 18000 - d * 210);
    aire.Q.value = 0.4;
    g.connect(aire); aire.connect(p); p.connect(this.bus.efectos);
    const r = this.ctx.createGain(); r.gain.value = reverb;
    g.connect(r); r.connect(this.envioReverb);
    setTimeout(() => { try { p.disconnect(); g.disconnect(); r.disconnect(); aire.disconnect(); } catch {} }, 8000);
    return g;
  }

  // ------------------------------------------------------------------ golpes con cuerpo
  // La curva de un saturador suave. No recorta como una pared: dobla, que es lo que
  // hace un parlante exigido o una garganta forzada.
  curva(cantidad) {
    const k = 1 + cantidad * 34;
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
    return c;
  }

  // Un golpe de verdad: transitorio + los modos propios del objeto + la cola.
  // `material` sale de `impactos.js`; `tamaño` agranda el objeto (más grave y más
  // largo) y `fuerza` decide cuánto se excitan los modos agudos, que es lo que
  // distingue un roce de un hachazo.
  // `capasMax` es para los golpes de relleno —los veinte crujidos de un árbol que cae,
  // las tablas de un derrumbe—: con dos modos ya se reconoce el material y cada modo de
  // más son dos nodos de audio. Un golpe solo, el que se escucha de verdad, los usa todos.
  impacto(material, { pos, tamaño = 1, dureza = 1, fuerza = 1, vol = 1, destino, cuando = 0, reverb = 0.5, capasMax = 99 } = {}) {
    if (!this.ctx || !this.puedeSonar(capasMax <= 2 ? 1 : 3, cuando)) return;
    const ctx = this.ctx, t = ctx.currentTime + cuando;
    const d = destino || (pos ? this.fuente(pos, 1, reverb) : this.bus.efectos);
    if (!d) return;
    const semilla = Math.random() * 1000;
    const f = Math.max(0.05, Math.min(2, fuerza));
    const ms = modos(material, { tamaño, dureza, azar: semilla, cuantos: capasMax });
    const cp = capas(material, { tamaño, dureza, azar: semilla });
    if (!cp) return;

    // 1. el contacto: dos milisegundos sin tono
    const s = ctx.createBufferSource(); s.buffer = this.blanco;
    const fg = ctx.createBiquadFilter(); fg.type = 'bandpass'; fg.frequency.value = cp.golpe.frec; fg.Q.value = cp.golpe.q;
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(cp.golpe.vol * vol * f, t);
    gg.gain.exponentialRampToValueAtTime(0.0001, t + cp.golpe.dur);
    s.connect(fg); fg.connect(gg); gg.connect(d);
    s.start(t, Math.random() * 3, cp.golpe.dur + 0.02);
    this.soltarAlTerminar(s, fg, gg);

    // 2. el cuerpo: cada modo es un seno que se apaga solo. Cuanto más fuerte el
    //    golpe, más se despiertan los modos de arriba (la madera "chasquea" más).
    ms.forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(m.frec, t);
      // los cuerpos reales bajan un pelo de tono mientras se apagan
      o.frequency.exponentialRampToValueAtTime(m.frec * 0.985, t + m.dur);
      const g = ctx.createGain();
      const nivel = m.vol * vol * 0.32 * Math.pow(f, 1 + i * 0.4);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, nivel), t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + m.dur);
      o.connect(g); g.connect(d);
      o.start(t); o.stop(t + m.dur + 0.03);
      this.soltarAlTerminar(o, g);
    });

    // 3. la cola: el aire y la fibra trabajando después. Los golpes de relleno se la
    //    saltean: no se escucha debajo de los otros y cuesta tres nodos.
    if (capasMax <= 2) return d;
    const s2 = ctx.createBufferSource(); s2.buffer = this.ruido;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = cp.cola.frec; f2.Q.value = cp.cola.q;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(cp.cola.vol * vol * f * 0.8, t + 0.004);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + cp.cola.dur);
    s2.connect(f2); f2.connect(g2); g2.connect(d);
    s2.start(t + 0.004, Math.random() * 3, cp.cola.dur + 0.02);
    this.soltarAlTerminar(s2, f2, g2);
    return d;
  }

  // 2.0: una gota sobre el techo. Es un golpe de relleno —dos modos, sin cola—: con
  // treinta por segundo sobre la chapa, el oído no pide más y el presupuesto tampoco.
  gotaEnTecho(techo, cuando = 0) {
    const g = gota(techo);
    if (!g || !this.ladosTecho) return;
    const lado = this.ladosTecho[g.lado < -0.33 ? 0 : g.lado > 0.33 ? 2 : 1];
    this.impacto(g.material, { tamaño: g.tamaño, dureza: g.dureza, fuerza: g.fuerza, vol: g.vol, destino: lado, cuando, capasMax: 2 });
    this.gotasTocadas = (this.gotasTocadas || 0) + 1;
    this.ultimaGota = g.material;
  }

  // 2.0: la estructura trabajando con una racha. En la carpa, la lona que flamea
  // (dos golpes graves de tela, uno atrás del otro); adentro, una tabla que cruje.
  crujido(espacio) {
    if (!this.ctx) return;
    const d = this.bus.techo || this.bus.ambiente;
    if (espacio === 'carpa') {
      this.golpeRuido({ dur: azar(0.08, 0.16), frec: azar(160, 260), q: 0.8, tipo: 'lowpass', vol: azar(0.22, 0.4), destino: d, buffer: this.ruido });
      this.golpeRuido({ dur: azar(0.06, 0.12), frec: azar(200, 320), q: 0.8, tipo: 'lowpass', vol: azar(0.14, 0.28), destino: d, buffer: this.ruido, cuando: azar(0.09, 0.2) });
    } else {
      // un tirante que se acomoda: grave, largo y apenas tonal
      this.impacto('tabla', { tamaño: azar(2.6, 4.2), dureza: 0.15, fuerza: azar(0.3, 0.55), vol: 0.5, destino: d, capasMax: 2 });
      if (Math.random() < 0.4) this.tono({ frec: azar(90, 140), fin: azar(70, 110), dur: azar(0.25, 0.5), tipo: 'triangle', vol: 0.02, destino: d, ataque: 0.06 });
    }
    this.crujidos = (this.crujidos || 0) + 1;
  }

  // El aire cortado: una flecha, una piedra, un brazo. El filtro se abre y se cierra
  // al pasar, que es el efecto Doppler del pobre y funciona igual de bien.
  silbido({ pos, dur = 0.3, frec = 1800, vol = 0.2, destino, cuando = 0 } = {}) {
    if (!this.ctx || !this.puedeSonar(1, cuando)) return;
    const ctx = this.ctx, t = ctx.currentTime + cuando;
    const d = destino || (pos ? this.fuente(pos, 1, 0.35) : this.bus.efectos);
    if (!d) return;
    const s = ctx.createBufferSource(); s.buffer = this.blanco;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3.2;
    f.frequency.setValueAtTime(frec * 0.55, t);
    f.frequency.exponentialRampToValueAtTime(frec * 1.35, t + dur * 0.45);
    f.frequency.exponentialRampToValueAtTime(frec * 0.5, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(d);
    s.start(t, Math.random() * 3, dur + 0.05);
    this.soltarAlTerminar(s, f, g);
  }

  // ------------------------------------------------------------------ la voz de los invasores
  // Tren de pulsos + subarmónico + modulación en anillo + formantes + saturación.
  // Cada cosa está explicada en `voz-alien.js`; esto lo arma.
  vozAlien(tipo, estado, { pos, distancia = 0, intensidad = 0.7, escala = 1, vol = 1, cuando = 0 } = {}) {
    if (!this.ctx || !this.puedeSonar(5, cuando)) return null;
    const ctx = this.ctx;
    // si no se pasa la distancia, se saca de dónde está parado el que escucha
    if (!distancia && pos && this.oyente) distancia = Math.hypot(pos.x - this.oyente.x, (pos.y || 0) - this.oyente.y, pos.z - this.oyente.z);
    const L = lejania(distancia);
    const v = voz(tipo, estado, { intensidad, azar: Math.random() * 1000, escala });
    const t = ctx.currentTime + cuando + (this.offline ? 0 : L.retardo);
    const dur = v.dur;
    const d = pos ? this.fuente(pos, L.volumen, Math.min(1.4, v.cola * L.reverb)) : this.bus.efectos;
    if (!d) return null;

    // la garganta: el tono real y el subarmónico una octava abajo
    const mezcla = ctx.createGain(); mezcla.gain.value = 1;
    // 2.7: la garganta vibra con un pulso glotal (ver `ondas`), no con una sierra: la
    // sierra tiene todos los armónicos iguales hasta el techo y suena a sintetizador
    const laringe = (frec, tipoOnda, nivel, detune = 0) => {
      const o = ctx.createOscillator(); o.detune.value = detune;
      if (tipoOnda === 'glotal') o.setPeriodicWave(this.ondas.glotal); else o.type = tipoOnda;
      o.frequency.setValueAtTime(frec, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(16, frec * (v.fin / v.base)), t + dur);
      const g = ctx.createGain(); g.gain.value = nivel;
      o.connect(g); g.connect(mezcla);
      o.start(t); o.stop(t + dur + 0.1);
      return o;
    };
    const principal = laringe(v.base, 'glotal', 1);
    // el subarmónico va con el mismo pulso apenas desafinado: late contra el principal
    if (v.sub > 0.02) laringe(v.base / 2, 'glotal', v.sub * 0.85, 7);
    if (v.sub > 0.5) laringe(v.base / 4, 'sine', (v.sub - 0.5) * 0.9, -5);

    // el temblor: nadie sostiene el tono, y menos un animal
    const tl = ctx.createOscillator(); tl.type = 'triangle'; tl.frequency.value = v.temblor;
    const tg = ctx.createGain(); tg.gain.value = v.base * 0.03;
    tl.connect(tg); tg.connect(principal.frequency); tl.start(t); tl.stop(t + dur + 0.1);
    // 2.7: y encima un temblor sin ritmo (ruido lento en el tono): el triángulo solo
    // repetía el mismo vaivén y delataba la máquina
    const jt = ctx.createBufferSource(); jt.buffer = this.ruido;
    const jl = ctx.createBiquadFilter(); jl.type = 'lowpass'; jl.frequency.value = 9 + v.temblor;
    const jg = ctx.createGain(); jg.gain.value = v.base * 0.09;
    jt.connect(jl); jl.connect(jg); jg.connect(principal.frequency);
    jt.start(t, Math.random() * 3, dur + 0.1);
    this.soltarAlTerminar(jt, jl, jg);

    // la aspereza: modulación en anillo. Esto es el grano del gruñido.
    // (2.7: un poco menos honda; la sacudida pareja era lo más sintético de la voz)
    const anillo = ctx.createGain(); anillo.gain.value = 1 - 0.36;
    const am = ctx.createOscillator(); am.type = 'sine'; am.frequency.setValueAtTime(v.aspereza, t);
    am.frequency.linearRampToValueAtTime(v.aspereza * 0.72, t + dur);
    const amg = ctx.createGain(); amg.gain.value = 0.36;
    am.connect(amg); amg.connect(anillo.gain); am.start(t); am.stop(t + dur + 0.1);
    mezcla.connect(anillo);

    // la saturación: una garganta forzada dobla, no recorta
    const sat = ctx.createWaveShaper(); sat.curve = this.curva(v.distorsion); sat.oversample = '2x';
    anillo.connect(sat);

    // los formantes: tres resonancias en paralelo. Sin esto no hay cuerpo ni tamaño.
    const cuerpo = ctx.createGain(); cuerpo.gain.value = 1;
    for (const [frec, q, nivel] of v.formantes) {
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = frec; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = nivel;
      sat.connect(f); f.connect(g); g.connect(cuerpo);
    }
    // algo del tono sin filtrar, para que no quede todo nasal
    const directo = ctx.createGain(); directo.gain.value = 0.22;
    sat.connect(directo); directo.connect(cuerpo);

    // el aire de la garganta, con su propia envolvente: entra después y se va después
    let aliento = null;
    if (v.aliento > 0.05) {
      const n = aliento = ctx.createBufferSource(); n.buffer = this.ruido;
      const nf = ctx.createBiquadFilter(); nf.type = 'bandpass';
      nf.frequency.setValueAtTime(v.formantes[1][0] * 0.9, t);
      nf.frequency.exponentialRampToValueAtTime(v.formantes[0][0] * 1.1, t + dur);
      nf.Q.value = 1.4;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.06 * v.aliento * v.vol, t + Math.max(0.02, v.ataque * 1.6));
      ng.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.15);
      n.connect(nf); nf.connect(ng); ng.connect(cuerpo);
      n.start(t, Math.random() * 3, dur * 1.2 + 0.05);
    }

    // 3.8.0: la risita de los duendes. Un vaivén lento corta la voz en sílabas («ji-ji-ji»)
    // y a cada sílaba el tono se quiebra un poco para arriba. Los viejos, «jo… jo».
    let cuerpoSalida = cuerpo;
    if (v.risa > 0 && v.risaHondura > 0.05) {
      const silabas = ctx.createGain(); silabas.gain.value = 1 - v.risaHondura * 0.5;
      const rl = ctx.createOscillator(); rl.type = 'triangle'; rl.frequency.value = v.risa;
      const rg = ctx.createGain(); rg.gain.value = v.risaHondura * 0.5;
      const rt = ctx.createGain(); rt.gain.value = v.base * 0.1 * v.risaHondura;
      rl.connect(rg); rg.connect(silabas.gain); rl.connect(rt); rt.connect(principal.frequency);
      rl.start(t); rl.stop(t + dur + 0.1);
      this.soltarAlTerminar(rl, rg, rt);
      cuerpo.connect(silabas);
      cuerpoSalida = silabas;
    }
    // la envolvente de la frase
    const env = ctx.createGain();
    const pico = Math.max(0.0002, 0.3 * v.vol * vol * L.volumen);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(pico, t + Math.max(0.005, v.ataque));
    // al morir la voz se desarma antes de apagarse
    if (v.desarma) env.gain.exponentialRampToValueAtTime(pico * 0.35, t + dur * 0.55);
    // 3.8.0: la risita se sostiene un rato antes de apagarse, si no son dos sílabas y nada
    else if (cuerpoSalida !== cuerpo && v.risaHondura > 0.3) env.gain.setValueAtTime(pico, t + Math.max(0.006, v.ataque) + dur * 0.5);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.1);
    cuerpoSalida.connect(env);

    // de lejos el aire se come los agudos y queda el retumbe
    const aire = ctx.createBiquadFilter(); aire.type = 'lowpass'; aire.frequency.value = L.corte; aire.Q.value = 0.5;
    env.connect(aire);
    let grave = null;
    if (L.sub > 1.05) {
      // y lo grave se agranda, que es lo único que cruza un valle
      grave = ctx.createBiquadFilter(); grave.type = 'lowshelf'; grave.frequency.value = 160;
      grave.gain.value = Math.min(11, (L.sub - 1) * 9);
      aire.connect(grave); grave.connect(d);
    } else aire.connect(d);
    // 2.6.1: cuando callan la garganta y el aliento, la cadena se suelta del destino
    let vivas = aliento ? 2 : 1;
    const soltarVoz = () => { if (--vivas > 0) return; try { aire.disconnect(); grave?.disconnect(); } catch {} };
    principal.addEventListener('ended', soltarVoz);
    aliento?.addEventListener('ended', soltarVoz);
    return { dur, base: v.base, formantes: v.formantes, aspereza: v.aspereza, lejania: L };
  }

  // ------------------------------------------------------------------ aves y animales
  // 2.7: cada ave canta una frase sintetizada nota por nota (ver `CANTOS` en
  // `sonido-sintesis.js`): silbidos con su curva de tono, armónicos, trinos y asperezas,
  // según la especie. Hay tres frases hechas por especie que se van renovando; cada vez
  // suena una al azar, apenas corrida de tono. Es una fuente por canto, no veinte notas.
  // Si la especie todavía no tiene frases hechas, canta apenas sale la primera de la cola.
  cantar(especie, pos, volFuente = 1, reverb = 0.6) {
    if (!this.ctx) return null;
    const sonar = (buf) => this.sonarBuffer(buf, this.fuente(pos, volFuente, reverb), (NIVEL_CANTO[especie] ?? 0.08) / 0.9, 0, azar(0.97, 1.03));
    const buf = this.variante(`canto-${especie}`, 3, () => canto(especie, TASA_PREVIA), 0.35, sonar);
    return buf ? sonar(buf) : null;
  }
  zorzal(pos) { this.cantar('zorzal', pos, 0.9); }
  rayadito(pos) { this.cantar('rayadito', pos, 0.7); }
  fiofio(pos) { this.cantar('fiofio', pos, 0.8); }
  chucao(pos) { this.cantar('chucao', pos, 1.4, 0.8); }
  // el carpintero negro no canta: golpea dos veces el tronco hueco
  carpintero(pos) { this.cantar('carpintero', pos, 1.6, 0.9); }
  cachanas(pos) { this.cantar('cachanas', pos, 1.2, 0.5); }
  concon(pos) { this.cantar('concon', pos, 1.5, 1); }
  ranita(pos) { this.cantar('ranita', pos, 0.6); }
  chasquido(pos) {
    const d = this.fuente(pos, 0.6, 0.2);
    this.sonarBuffer(this.variante('estallido', 4, () => estallido(TASA_PREVIA), 0.15), d, azar(0.05, 0.16), 0, azar(0.8, 1.3));
  }

  // El hacha mordiendo el tronco. Cuatro cosas pasan en cien milisegundos: el filo de
  // acero entra (agudo y cortísimo), el tronco entero resuena en sus modos, la fibra
  // se abre, y el cabo de lenga devuelve el golpe a la mano.
  hachazo(pos, hondura = 0.5) {
    if (!this.ctx) return;
    if (!this.turnoHacha) this.turnoHacha = ronda(7);
    const r = this.turnoHacha();
    const d = this.fuente(pos, 1.25, 0.55);
    const f = 0.85 + r * 0.3;
    // el filo: metal contra madera, dos milisegundos
    this.golpeRuido({ dur: 0.016 + r * 0.008, frec: 5200 + r * 2400, q: 1.1, vol: 0.3 * f, destino: d });
    // 2.7: y la cabeza de acero, que canta un instante con sus modos agudos
    this.impacto('metal', { tamaño: 0.32 + r * 0.1, dureza: 1, fuerza: 0.4, vol: 0.1, destino: d, capasMax: 2 });
    // el tronco: cuanto más honda la muesca, más grave y más sordo suena
    this.impacto('tronco', { tamaño: 1.5 + hondura * 1.4, dureza: 0.85, fuerza: 1.05 * f, vol: 1.15, destino: d });
    // la fibra abriéndose
    this.golpeRuido({ dur: 0.07 + r * 0.05, frec: 1500 + r * 900, q: 0.9, vol: 0.13 * f, destino: d, cuando: 0.012, buffer: this.ruido });
    // 2.7: las astillas que saltan, secas, un poco después del golpe
    const astilla = this.variante('estallido', 4, () => estallido(TASA_PREVIA), 0.15, nada);
    this.sonarBuffer(astilla, d, azar(0.05, 0.1) * f, azar(0.02, 0.05), azar(1.1, 1.5));
    if (r > 0.5) this.sonarBuffer(astilla, d, azar(0.03, 0.07), azar(0.06, 0.12), azar(1.2, 1.6));
    // el cabo, que vibra después del golpe (2.7: un seno; el triángulo zumbaba)
    this.tono({ frec: 128 + r * 24, fin: 96, dur: 0.14, tipo: 'sine', vol: 0.05, destino: d, ataque: 0.004, cuando: 0.008 });
  }

  // El árbol que se viene abajo. Es el sonido más largo del juego y el que más se
  // acuerda la gente, así que tiene las tres etapas completas: la fibra que se rompe
  // de a poco, el arrastre entre las ramas de los vecinos, y el golpe contra el suelo,
  // que no es un golpe sino tres (copa, tronco y tierra) con unos milisegundos entre sí.
  arbolCae(pos, demora = 1.5) {
    if (!this.ctx) return;
    const d = this.fuente(pos, 1.6, 0.95);
    // La fibra rompiéndose: crujidos sueltos que se aceleran. Van con dos modos y sin
    // cola —son relleno, uno encima del otro— y con tope: sin tope, un árbol largo
    // pedía más de veinte y armaba un pico de cuatrocientos nodos en un solo cuadro.
    let c = 0;
    for (let i = 0; c < demora * 0.92 && i < 9; i++) {
      this.impacto('tronco', { tamaño: azar(2.2, 3.4), dureza: 1, fuerza: azar(0.25, 0.7) * (0.5 + c / demora), vol: 0.5, destino: d, cuando: c, capasMax: 2 });
      c += azar(0.06, 0.26) * Math.max(0.25, 1 - c / demora) + demora * 0.06;
    }
    // el desgarro grave, continuo, abajo de todo
    this.golpeRuido({ dur: demora, frec: 220, q: 0.7, tipo: 'lowpass', vol: 0.18, destino: d, buffer: this.ruido });
    // el arrastre entre las ramas mientras cae
    this.golpeRuido({ dur: 0.75, frec: 3600, q: 0.5, vol: 0.2, destino: d, cuando: demora - 0.7 });
    // el impacto: copa primero, después el tronco, y la tierra al final
    this.impacto('tierra', { tamaño: 2.2, dureza: 0.2, fuerza: 1.1, vol: 0.7, destino: d, cuando: demora - 0.04 });
    this.impacto('tronco', { tamaño: 5.5, dureza: 0.7, fuerza: 1.4, vol: 0.75, destino: d, cuando: demora });
    this.impacto('tierra', { tamaño: 4, dureza: 0.35, fuerza: 1.3, vol: 0.7, destino: d, cuando: demora + 0.03 });
    // las ramas que se parten contra el suelo, después del golpe
    for (let i = 0; i < 5; i++) {
      this.impacto('tabla', { tamaño: azar(0.6, 1.8), dureza: 1, fuerza: azar(0.3, 0.9), vol: 0.45, destino: d, cuando: demora + azar(0.04, 0.55), capasMax: 2 });
    }
    // y el polvo y las hojas cayendo un rato largo
    this.golpeRuido({ dur: 1.6, frec: 2400, q: 0.4, vol: 0.1, destino: d, cuando: demora + 0.08 });
  }

  // 2.7: una garganta de animal (el ciervo, el jabalí, el perro). Un pulso glotal —no una
  // sierra— por tres formantes de boca, con aspereza irregular (ruido lento que mueve la
  // amplitud: un gruñido real no tiene un ritmo parejo) y el aire que sale con la voz.
  garganta({ destino, frec, fin = frec, dur, vol = 0.1, ataque = 0.02, formantes = [[500, 5, 1], [1500, 7, 0.5]], aspereza = 0.3, aliento = 0.2, temblor = 0, cuando = 0 }) {
    if (!destino || !this.ctx || !this.puedeSonar(3, cuando)) return null;
    const ctx = this.ctx, t = ctx.currentTime + cuando;
    const o = ctx.createOscillator(); o.setPeriodicWave(this.ondas.glotal);
    o.frequency.setValueAtTime(frec, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, fin), t + dur);
    if (temblor) {
      const l = ctx.createOscillator(); l.frequency.value = temblor;
      const lg = ctx.createGain(); lg.gain.value = frec * 0.025;
      l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05);
      this.soltarAlTerminar(l, lg);
    }
    // la aspereza: ruido rosado muy grave moviendo la amplitud de la glotis
    const am = ctx.createGain(); am.gain.value = 1 - aspereza * 0.4;
    const rs = ctx.createBufferSource(); rs.buffer = this.ruido;
    const rl = ctx.createBiquadFilter(); rl.type = 'lowpass'; rl.frequency.value = 30 + aspereza * 45;
    const rg = ctx.createGain(); rg.gain.value = aspereza * 1.4;
    rs.connect(rl); rl.connect(rg); rg.connect(am.gain);
    o.connect(am);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol, t + ataque);
    env.gain.setValueAtTime(vol, t + Math.max(ataque, dur * 0.55));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const nodos = [am, env];
    for (const [f, q, n] of formantes) {
      const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q;
      const g = ctx.createGain(); g.gain.value = n * 2.4;
      am.connect(b); b.connect(g); g.connect(env); nodos.push(b, g);
    }
    // algo del pulso sin filtrar, para que no quede todo nasal
    const directo = ctx.createGain(); directo.gain.value = 0.2;
    am.connect(directo); directo.connect(env); nodos.push(directo);
    env.connect(destino);
    o.start(t); o.stop(t + dur + 0.05);
    rs.start(t, Math.random() * 3, dur + 0.1);
    this.soltarAlTerminar(o, ...nodos);
    this.soltarAlTerminar(rs, rl, rg);
    // el aire: ruido en la banda del primer formante, que entra un poco antes
    if (aliento > 0) {
      const n = ctx.createBufferSource(); n.buffer = this.ruido;
      const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = formantes[0][0] * 1.4; nf.Q.value = 1.2;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(vol * aliento * 3, t + Math.max(0.01, ataque * 0.7));
      ng.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.05);
      n.connect(nf); nf.connect(ng); ng.connect(destino);
      n.start(t, Math.random() * 3, dur * 1.1 + 0.05);
      this.soltarAlTerminar(n, nf, ng);
    }
    return o;
  }

  // 3.7.4: el balbuceo tipo Los Sims (el plan de las sílabas sale de social-voz.js: la voz de cada uno). Barato: un solo
  // pulso glotal para todo el renglón, con el tono, los dos formantes de la vocal y la envolvente movidos sílaba por
  // sílaba, y un ruido para las consonantes; todo por un pasabajos (nada estridente) al bus de los efectos (su volumen).
  // `pos`: de dónde sale (con la distancia y el lado); sin `pos`, enfrente tuyo. Devuelve cuánto dura (o 0).
  balbuceo(plan, { pos = null, vol = 0.06, cuando = 0 } = {}) {
    if (!this.ctx || !plan?.silabas?.length || !this.puedeSonar(4, cuando)) return 0;
    const ctx = this.ctx, t0 = ctx.currentTime + 0.02 + cuando, v = plan.voz || {};
    const destino = pos ? this.fuente(pos, 1, 0.25) : this.bus.efectos;
    if (!destino) return 0;
    const fin = t0 + plan.dur + 0.15;
    const o = ctx.createOscillator();
    if (this.ondas?.glotal) o.setPeriodicWave(this.ondas.glotal); else o.type = 'triangle';
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 4.5;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 6;
    const g1 = ctx.createGain(); g1.gain.value = 2.2;
    const g2 = ctx.createGain(); g2.gain.value = 1.3;
    const directo = ctx.createGain(); directo.gain.value = 0.12;
    const env = ctx.createGain(); env.gain.setValueAtTime(0.0001, t0);
    const suave = ctx.createBiquadFilter(); suave.type = 'lowpass'; suave.frequency.value = 3400; suave.Q.value = 0.5;
    o.connect(f1); o.connect(f2); o.connect(directo);
    f1.connect(g1); f2.connect(g2); g1.connect(env); g2.connect(env); directo.connect(env);
    env.connect(suave); suave.connect(destino);
    // las consonantes: un solo ruido, con su banda y su golpe en cada sílaba
    const ns = ctx.createBufferSource(); ns.buffer = this.blanco;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.Q.value = 1.2; nf.frequency.setValueAtTime(3000, t0);
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t0);
    ns.connect(nf); nf.connect(ng); ng.connect(suave);
    const pico = Math.max(0.005, Math.min(0.12, vol));
    for (const s of plan.silabas) {
      const t = t0 + s.t, a = Math.max(0.012, Math.min(0.04, s.dur * 0.18));
      const c = s.cons ? { p: [900, 0.018, 1], t: [3200, 0.02, 1], k: [2100, 0.024, 1], s: [5200, 0.07, 0], f: [3800, 0.05, 0], ch: [3600, 0.06, 1], b: [600, 0.012, 1] }[s.cons] : null;
      const nasal = s.cons === 'm' || s.cons === 'n';
      const arranca = c ? t + c[1] * (c[2] ? 1 : 0.6) : t;
      o.frequency.setTargetAtTime(Math.max(60, s.f0), t, 0.03);
      f1.frequency.setTargetAtTime(nasal ? 280 : s.f1, t, 0.02);
      f2.frequency.setTargetAtTime(s.f2, t, 0.025);
      if (nasal) f1.frequency.setTargetAtTime(s.f1, t + 0.05, 0.03);
      // la vocal: sube, se sostiene y baja un poco antes de la siguiente
      env.gain.setTargetAtTime(pico * s.vol * (nasal ? 0.55 : 1), arranca, a / 2.5);
      env.gain.setTargetAtTime(pico * s.vol * 0.12, t + s.dur * 0.78, s.dur * 0.08);
      if (c) {
        nf.frequency.setValueAtTime(c[0], t);
        ng.gain.setTargetAtTime(pico * (c[2] ? 0.9 : 0.55), t, 0.004);
        ng.gain.setTargetAtTime(0.0001, t + c[1], 0.01);
      }
    }
    env.gain.setTargetAtTime(0.0001, t0 + plan.dur, 0.04);
    if (v.temblor) {
      const l = ctx.createOscillator(); l.frequency.value = v.temblor;
      const lg = ctx.createGain(); lg.gain.value = (v.f0 || 120) * 0.025;
      l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(fin);
      this.soltarAlTerminar(l, lg);
    }
    o.start(t0); o.stop(fin);
    ns.start(t0, Math.random() * 2, plan.dur + 0.2);
    this.soltarAlTerminar(o, f1, f2, g1, g2, directo, env, suave);
    this.soltarAlTerminar(ns, nf, ng);
    return plan.dur;
  }

  bramido(pos) {
    if (!this.ctx) return;
    const d = this.fuente(pos, 2.2, 1);
    // 2.7: el ciervo brama con el pecho: garganta grave, formantes bajos y temblor
    this.garganta({ destino: d, frec: azar(120, 135), fin: 94, dur: 2.4, vol: 0.11, ataque: 0.35, formantes: [[330, 5, 1], [880, 6, 0.6], [2100, 8, 0.2]], aspereza: 0.45, aliento: 0.3, temblor: 5.5 });
    this.golpeRuido({ dur: 2.0, frec: 500, q: 0.7, vol: 0.07, destino: d, buffer: this.ruido, cuando: 0.2 });
  }
  gruñido(pos) {
    if (!this.ctx) return;
    const d = this.fuente(pos, 1.1, 0.5);
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
      // 2.7: un resoplido con voz, no una sierra
      this.garganta({ destino: d, frec: azar(150, 230), fin: azar(90, 140), dur: azar(0.11, 0.16), vol: 0.075, ataque: 0.012, formantes: [[420, 4, 1], [1100, 6, 0.5], [2400, 8, 0.15]], aspereza: 0.65, aliento: 0.5, cuando: i * azar(0.16, 0.3) });
      this.golpeRuido({ dur: 0.1, frec: 700, q: 1.2, vol: 0.08, destino: d, cuando: i * 0.2, buffer: this.ruido });
    }
  }
  cauquen(pos) { this.cantar('cauquen', pos, 1.2, 0.6); }
  chillido(pos) { this.cantar('chillido', pos, 0.5, 0.3); }
  zumbido(pos, largo = 0.7) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const d = this.fuente(pos, 0.8, 0.2);
    // 2.7: el aleteo de un bicho: la forma de onda suave y un vuelo que no es parejo
    const o = ctx.createOscillator(); o.setPeriodicWave(this.ondas.sawtooth);
    const f0 = azar(130, 165);
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f0 * azar(0.92, 1.08), t + largo * 0.5);
    o.frequency.linearRampToValueAtTime(f0 * azar(0.9, 1.1), t + largo);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.12);
    g.gain.setValueAtTime(0.07, t + largo * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + largo);
    o.connect(f); f.connect(g); g.connect(d);
    o.start(t); o.stop(t + largo + 0.05);
    this.soltarAlTerminar(o, f, g);
  }

  silbato(pos, tipo = this.silbatoElegido) {
    if (!this.ctx) return;
    // 2.8: sin lugar (la muestra del panel) suena de cerca, sin ubicarlo
    const d = pos ? this.fuente(pos, 3.2, 1) : this.bus.efectos;
    // 2.7: tres caños de vapor: casi senos, con su poco de armónicos y el soplo encima.
    // 2.8: cuáles caños y cuántas pitadas los elige el jugador (el clásico es el de antes)
    // 3.7.3 (tren): o el del taller, que viene con sus caños y toques (ver tren-viaje.js: el de pájaro)
    const S = tipo && typeof tipo === 'object' && Array.isArray(tipo.canos) ? tipo : silbatoDe(tipo);
    for (const [cuando, largo] of S.toques) {
      for (const [f, v] of S.canos) {
        this.tono({ frec: f * 0.97, fin: f, dur: largo, tipo: 'quena', vol: v, destino: d, ataque: Math.min(0.16, largo * 0.25), vibrato: S.vibrato, cuando });
      }
      this.golpeRuido({ dur: largo, frec: S.soplo, q: 0.8, vol: 0.05, destino: d, buffer: this.ruido, cuando: cuando + 0.05 });
      this.golpeRuido({ dur: largo * 0.8, frec: 2600, q: 1.2, vol: 0.03, destino: d, cuando: cuando + 0.08 });
    }
  }
  trueno(lejos = 0.5) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    // cuanto más lejos, más grave y más largo: el aire se come los agudos
    f.frequency.value = 220 + (1 - lejos) * 1400;
    f.Q.value = 0.6;
    const dur = 1.6 + lejos * 3.4;
    const fuente = ctx.createBufferSource();
    // 2.7: el trueno rueda: el retumbo sintetizado trae el estallido y las rodadas que
    // vuelven del valle. De lejos suena más lento y más grave.
    const retumbo = this.previo.get('retumbo');
    const vol = 0.42 * (1 - lejos * 0.65);
    if (retumbo) {
      fuente.buffer = retumbo; fuente.playbackRate.value = 1 - lejos * 0.3;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * (0.66 - 0.29 * lejos), t + 0.02 + lejos * 0.4);
      g.gain.setTargetAtTime(0.0001, t + dur * 0.5, dur * 0.18);
    } else {
      fuente.buffer = this.blanco;
      fuente.loop = true;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.04 + lejos * 0.5);
      g.gain.exponentialRampToValueAtTime(vol * 0.35, t + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    fuente.connect(f); f.connect(g); g.connect(this.bus.ambiente);
    fuente.start(t); fuente.stop(t + dur + 0.1);
    this.soltarAlTerminar(fuente, f, g);
    if (lejos < 0.45) {
      // el chasquido seco del rayo cerca
      this.golpeRuido({ dur: 0.35, frec: 1800, q: 0.9, vol: 0.3 * (1 - lejos), destino: this.bus.ambiente });
    }
  }
  riel(pos) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const d = this.fuente(pos, 1.2, 0.5);
    // el rodar del portón: ruido filtrado que sube y baja, con traqueteo
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 2.4;
    const g = ctx.createGain();
    const fuente = ctx.createBufferSource();
    fuente.buffer = this.blanco; fuente.loop = true;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.055, t + 0.1);
    g.gain.setValueAtTime(0.055, t + 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    fuente.connect(f); f.connect(g); g.connect(d);
    fuente.start(t); fuente.stop(t + 0.9);
    for (let i = 0; i < 5; i++) this.golpeRuido({ dur: 0.03, frec: azar(700, 1400), q: 3, vol: 0.05, destino: d, cuando: 0.08 + i * 0.14 });
    // 2.7: el tope del portón es un golpe de fierro de verdad
    this.impacto('metal', { tamaño: 1.6, dureza: 0.8, fuerza: 0.5, vol: 0.09, destino: d, cuando: 0.8, capasMax: 3 });
  }
  // 2.7: la bisagra. Antes era una sierra barriendo por un filtro; ahora es fricción que
  // se pega y se suelta cientos de veces por segundo y hace sonar la hoja de la puerta.
  bisagra(pos) {
    if (!this.ctx) return;
    const d = this.fuente(pos, 1.1, 0.55);
    const buf = this.variante('chirrido', 3, () => chirrido(TASA_PREVIA, Math.random, azar(0.38, 0.5)), 0.3);
    this.sonarBuffer(buf, d, 0.0065, 0, azar(0.85, 1.15));
    this.golpeRuido({ dur: 0.05, frec: 2200, q: 1.4, vol: 0.05, destino: d });
  }
  portazo(pos) {
    if (!this.ctx) return;
    const d = this.fuente(pos, 1.2, 0.5);
    // 2.7: la hoja de madera contra el marco (hueca, grave) y el pestillo que traba
    this.impacto('hueco', { tamaño: azar(2.4, 2.9), dureza: 0.6, fuerza: 1, vol: 0.2, destino: d });
    this.impacto('metal', { tamaño: 0.4, dureza: 1, fuerza: 0.45, vol: 0.05, destino: d, cuando: 0.012, capasMax: 2 });
    this.golpeRuido({ dur: 0.1, frec: 620, q: 1.1, vol: 0.07, destino: d, buffer: this.ruido });
  }
  ladrido(pos) {
    if (!this.ctx) return;
    const d = this.fuente(pos, 1.3, 0.5);
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const c = i * 0.24;
      // 2.7: el ladrido es una garganta que se abre de golpe y se cierra bajando
      this.garganta({ destino: d, frec: azar(420, 520), fin: azar(190, 250), dur: azar(0.13, 0.17), vol: 0.016, ataque: 0.006, formantes: [[650, 4, 1], [1700, 6, 0.6], [2900, 8, 0.25]], aspereza: 0.5, aliento: 0.4, cuando: c });
      this.golpeRuido({ dur: 0.1, frec: 900, q: 1.1, vol: 0.03, destino: d, cuando: c, buffer: this.ruido });
    }
  }
  ave(pos) { this.cantar('ave', pos, 1.1, 0.4); }
  // 2.7: una campana de verdad no es un acorde: sus parciales (el zumbido, la
  // fundamental, la tercera menor, la quinta, la nominal) no son armónicos, y los graves
  // duran más. Cada golpe pisa la cola del anterior.
  campana(pos) {
    if (!this.ctx) return;
    const d = this.fuente(pos, 1.8, 0.9);
    const PARCIALES = [[0.5, 0.008, 1.6], [1, 0.028, 1.2], [1.19, 0.013, 0.9], [1.5, 0.008, 0.7], [2, 0.017, 0.6], [2.52, 0.005, 0.35]];
    for (let i = 0; i < 6; i++) {
      for (const [r, v, dur] of PARCIALES) {
        this.tono({ frec: 1180 * r * azar(0.998, 1.002), dur, tipo: 'sine', vol: v, destino: d, cuando: i * 0.42, ataque: 0.003 });
      }
    }
  }
  frenos(pos, fuerza = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const d = this.fuente(pos, 1.4, 0.6);
    const o = ctx.createOscillator(); o.setPeriodicWave(this.ondas.sawtooth);
    o.frequency.setValueAtTime(1900 + Math.random() * 600, t);
    o.frequency.linearRampToValueAtTime(1200, t + 0.7);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 12;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045 * fuerza, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    o.connect(f); f.connect(g); g.connect(d);
    o.start(t); o.stop(t + 0.8);
    this.soltarAlTerminar(o, f, g);
    this.golpeRuido({ dur: 0.6, frec: 3200, q: 2, vol: 0.06 * fuerza, destino: d });
  }
  traqueteo(pos, fuerza = 1, hueco = false) {
    if (!this.ctx) return;
    const d = this.fuente(pos, 1.6, 0.5);
    // El bufido del vapor: dos golpes por vuelta de rueda, con su sibilancia
    // y el golpe de la biela. Es lo que hace que una locomotora suene a vapor.
    for (let k = 0; k < 2; k++) {
      const c = k * 0.13;
      this.golpeRuido({ dur: 0.2 * (1.2 - fuerza * 0.4), frec: azar(950, 1350), q: 0.75, vol: 0.3 * fuerza * (k ? 0.7 : 1), destino: d, buffer: this.ruido, cuando: c });
      this.tono({ frec: azar(84, 96), fin: 52, dur: 0.15, tipo: 'sine', vol: 0.1 * fuerza * (k ? 0.65 : 1), destino: d, ataque: 0.005, cuando: c });
    }
    // el vapor que escapa por los costados, más agudo y sostenido
    this.golpeRuido({ dur: azar(0.3, 0.55), frec: azar(2600, 4200), q: 0.6, vol: 0.06 * fuerza, destino: d, cuando: azar(0.02, 0.2) });
    // los cuatro ejes pisando las juntas del riel, de a pares y desfasados
    for (let i = 0; i < 4; i++) {
      const par = Math.floor(i / 2);
      this.golpeRuido({
        dur: hueco ? 0.12 : 0.045,
        frec: hueco ? azar(120, 190) : azar(230, 460),
        q: hueco ? 6 : 3.2,
        vol: (hueco ? 0.2 : 0.11) * fuerza * azar(0.75, 1.15),
        destino: d,
        cuando: 0.08 + par * 0.19 + (i % 2) * azar(0.03, 0.05),
      });
    }
    // el chirrido metálico de las pestañas en la curva
    if (Math.random() < 0.35) {
      this.golpeRuido({ dur: azar(0.15, 0.35), frec: azar(2200, 3600), q: 9, vol: 0.05 * fuerza, destino: d, cuando: azar(0.05, 0.3) });
    }
    // el balanceo de los enganches entre coches
    if (Math.random() < 0.25) {
      this.golpeRuido({ dur: 0.06, frec: azar(320, 520), q: 4, vol: 0.09 * fuerza, destino: d, cuando: azar(0.25, 0.5) });
    }
    if (hueco) this.tono({ frec: 78, fin: 62, dur: 0.3, tipo: 'sine', vol: 0.08 * fuerza, destino: d, ataque: 0.01 });
  }

  // ------------------------------------------------------------------ jugador
  // 1.10: los cascos del caballo. Un golpe grave y seco —el vaso del casco— más la
  // superficie, como un paso pero más pesado.
  casco(superficie, fuerza = 0.8) {
    if (!this.ctx) return;
    const d = this.bus.efectos, v = 0.42 * fuerza * azar(0.85, 1.15);
    this.tono({ frec: azar(92, 124), fin: 58, dur: 0.09, tipo: 'sine', vol: v * 0.6, destino: d, ataque: 0.002 });
    // 2.7: el vaso del casco es duro como hueso: un golpe con modos, no un soplo de ruido
    this.impacto('hueso', { tamaño: azar(0.9, 1.2), dureza: 1, fuerza: 0.7, vol: v * 0.45, destino: d, capasMax: 2 });
    this.paso(superficie, fuerza * 0.7, false);
  }

  // 2.7: cada pisada sale de un banco de pisadas sintetizadas por suelo (ver `SUELOS` en
  // `sonido-sintesis.js`): talón y punta, el golpe del peso, la textura del suelo y el
  // roce. Cuatro variantes caminando y tres corriendo, al azar y sin repetir la última,
  // con un pelo de cambio de tono: una fuente por paso en vez de doce golpes de ruido.
  bufferPaso(superficie, correr) {
    const sup = superficie === 'agua' || SUELOS[superficie] ? superficie : 'hojarasca';
    return this.variante(`paso-${sup}-${correr ? 'c' : 'p'}`, correr ? 3 : 4, () => pisada(sup, TASA_PREVIA, Math.random, correr));
  }
  paso(superficie, fuerza = 0.6, correr = false) {
    if (!this.ctx) return;
    const d = this.bus.efectos;
    // corriendo el pie cae más fuerte y más seco; caminando es más suave
    const golpeExtra = correr ? 1.55 : 1;
    const v = 0.35 * fuerza * azar(0.82, 1.18) * golpeExtra;
    // la ropa y la mochila también hacen ruido, y más cuanto más rápido vas
    if (correr) this.golpeRuido({ dur: azar(0.05, 0.1), frec: azar(2600, 4200), q: 0.7, vol: v * 0.2, destino: d, cuando: azar(0.01, 0.05) });
    if (correr) {
      // el peso del cuerpo al caer: un golpe grave que no está al caminar
      this.tono({ frec: azar(58, 78), fin: 42, dur: 0.1, tipo: 'sine', vol: v * 0.3, destino: d, ataque: 0.003 });
    }
    // cuánto suena cada suelo, con la pisada normalizada
    let nivel = 0.3;
    switch (superficie) {
      case 'pasto': nivel = 0.22; break;
      case 'hojas': nivel = 0.34; break;
      case 'hojarasca': nivel = 0.3; break;
      case 'tierra': nivel = 0.26; break;
      case 'nieve': nivel = 0.2; break;
      case 'escarcha':
        // 2.0: el pasto helado. Más fino que la nieve: no es un colchón que se aprieta,
        // son hojitas duras que se quiebran (ver `SUELOS.escarcha`)
        nivel = 0.3;
        break;
      case 'piedra': nivel = 0.3; break;
      case 'madera':
        // 2.0: el tablón es un golpe de verdad (ver `impactos.js`): el taco contra la
        // tabla y, abajo, el aire del hueco entre el piso y la tierra, que es lo que
        // hace que un piso de madera suene a piso y no a tronco. Corriendo pega más
        // y despierta los modos de arriba.
        this.impacto('tabla', { tamaño: azar(1.5, 2.1), dureza: correr ? 0.7 : 0.45, fuerza: 0.5 + v * 1.2, vol: v * 1.1, destino: d, capasMax: 3 });
        this.impacto('hueco', { tamaño: azar(1.6, 2.2), dureza: 0.3, fuerza: 0.4 + v * 0.8, vol: v * 0.55, destino: d, capasMax: 2, cuando: 0.004 });
        nivel = 0.12;
        break;
      case 'agua':
        // el pie que entra, la salpicadura que se abre y el goteo al salir
        nivel = 0.4;
        break;
    }
    this.sonarBuffer(this.bufferPaso(superficie, correr), d, v * nivel, 0, azar(0.94, 1.06));
  }
  // 2.7: una pisada del banco en cualquier lugar (los pasos que se acercan de noche)
  pisadaEn(destino, superficie = 'hojarasca', vol = 0.3, cuando = 0, correr = true) {
    if (!this.ctx || !destino) return null;
    return this.sonarBuffer(this.bufferPaso(superficie, correr), destino, vol, cuando, azar(0.9, 1.08));
  }
  // 2.7: la cuerda de un arma: Karplus-Strong corto y tenso, pulsado al medio (por eso
  // suena hueco, sólo armónicos impares). El arco, grave y seco; la ballesta, más
  // tirante y con más brillo de acero.
  cuerdaArma(tipo, destino, vol = 0.12, cuando = 0) {
    if (!this.ctx || !destino) return null;
    const arco = tipo !== 'ballesta';
    const buf = this.variante(`cuerda-${arco ? 'arco' : 'ballesta'}`, 2, () => cuerdaPulsada(TASA_PREVIA, arco ? azar(125, 150) : azar(205, 240), 0.5,
      { brillo: 0.9, posicion: 0.5, doble: 0, caida: arco ? 0.3 : 0.22, amortiguar: arco ? 0.5 : 0.32, cuerpo: false }));
    return this.sonarBuffer(buf, destino, vol, cuando, azar(0.96, 1.04));
  }
  // 2.7: el agua: chapoteos sintetizados (el golpe, la nube de burbujas, las gotas)
  bufferAgua(clave, tamaño, tipo = 'golpe') {
    return this.variante(clave, 3, () => chapoteo(TASA_PREVIA, Math.random, tamaño, tipo), 0.2);
  }
  // 2.7: un líquido que borbotea (la glándula del escupidor, algo que hierve)
  borbotear(destino, vol = 0.1, cuando = 0) {
    if (!this.ctx || !destino) return null;
    return this.sonarBuffer(this.variante('borboteo', 4, () => borboteo(TASA_PREVIA), 0.1, nada), destino, vol, cuando, azar(0.6, 0.9));
  }
  // 2.7: chisporroteo: estallidos chicos del banco, repartidos en un rato
  chisporrotear(destino, cuantos = 6, vol = 0.1, largo = 0.6, velocidad = 1.4) {
    if (!this.ctx || !destino) return;
    const buf = this.variante('estallido', 4, () => estallido(TASA_PREVIA), 0.15, nada);
    if (!buf) return;
    for (let i = 0; i < cuantos; i++) this.sonarBuffer(buf, destino, vol * azar(0.4, 1), azar(0, largo), velocidad * azar(0.8, 1.3));
  }
  chapuzon() {
    if (!this.ctx) return;
    this.sonarBuffer(this.bufferAgua('chapuzon', 2), this.bus.efectos, 0.042, 0, azar(0.9, 1.05));
  }
  anotar() {
    if (!this.ctx) return;
    // el lápiz sobre el papel
    for (let i = 0; i < 5; i++) this.golpeRuido({ dur: 0.05, frec: azar(3000, 5000), q: 2, vol: 0.08, destino: this.bus.efectos, cuando: i * 0.07 });
    // 2.7: y dos notas de la guitarra de la música, en vez de dos senos
    this.pulsar(79, { cuando: 0.1, dur: 1.4, vol: 0.125, destino: this.bus.efectos });
    this.pulsar(86, { cuando: 0.25, dur: 1.6, vol: 0.09, destino: this.bus.efectos });
  }
  juntar() {
    if (!this.ctx) return;
    this.golpeRuido({ dur: 0.15, frec: 2500, q: 0.8, vol: 0.18, destino: this.bus.efectos });
    // 2.7: la quinta que subía como un «bip» ahora son dos cuerdas pulsadas
    this.pulsar(76, { cuando: 0.04, dur: 0.9, vol: 0.042, destino: this.bus.efectos });
    this.pulsar(83, { cuando: 0.1, dur: 1.1, vol: 0.036, destino: this.bus.efectos });
  }
  encender() {
    if (!this.ctx) return;
    // 2.7: el fósforo que raspa, la llama que agarra y las primeras chispas
    this.golpeRuido({ dur: 0.08, frec: 3400, q: 0.9, vol: 0.12, destino: this.bus.efectos });
    this.golpeRuido({ dur: 1.2, frec: 600, q: 0.5, tipo: 'lowpass', vol: 0.45, destino: this.bus.efectos, buffer: this.ruido, cuando: 0.05, fin: 1100 });
    this.chisporrotear(this.bus.efectos, 4, 0.1, 0.9, 1.2);
  }
  obturador() {
    if (!this.ctx) return;
    this.golpeRuido({ dur: 0.03, frec: 3000, q: 1, vol: 0.4, destino: this.bus.efectos });
    this.golpeRuido({ dur: 0.05, frec: 1800, q: 1, vol: 0.3, destino: this.bus.efectos, cuando: 0.09 });
  }

  // ------------------------------------------------------------------ pesca y kayak
  lanzar() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.blanco;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.35);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    s.connect(f); f.connect(g); g.connect(this.bus.efectos); s.start(t, Math.random() * 3, 0.5);
    this.soltarAlTerminar(s, f, g);
  }
  chapoteo(pos, fuerza = 1) {
    if (!this.ctx) return;
    const d = pos ? this.fuente(pos, 1.2 * fuerza, 0.4) : this.bus.efectos;
    // 2.7: un chapoteo sintetizado (golpe, burbujas, gotas); con más fuerza, más grave
    this.sonarBuffer(this.bufferAgua('chapoteo', 1), d, 0.048 * Math.min(1.5, fuerza), 0, azar(0.9, 1.1) / Math.sqrt(Math.max(0.5, fuerza)));
  }
  carrete() {
    if (!this.ctx) return;
    this.golpeRuido({ dur: 0.012, frec: 4200, q: 4, vol: 0.12, destino: this.bus.efectos });
  }
  tension(nivel) {
    if (!this.ctx) return;
    this.tono({ frec: 180 + nivel * 400, dur: 0.08, tipo: 'sawtooth', vol: 0.012 + nivel * 0.02, destino: this.bus.efectos, ataque: 0.01 });
  }
  corte() {
    if (!this.ctx) return;
    // 2.7: la tanza que se corta: un chasquido seco y el látigo que se afloja
    this.golpeRuido({ dur: 0.03, frec: 2600, q: 1, vol: 0.12, destino: this.bus.efectos });
    this.tono({ frec: 900, fin: 200, dur: 0.18, tipo: 'sine', vol: 0.09, destino: this.bus.efectos, ataque: 0.002 });
  }
  remada(fuerza = 1) {
    if (!this.ctx) return;
    // 2.7: la pala que entra, arrastra el agua y sale goteando
    this.sonarBuffer(this.bufferAgua('remo', 1, 'remo'), this.bus.efectos, 0.06 * fuerza, 0, azar(0.9, 1.1));
  }
  golpeKayak() {
    if (!this.ctx) return;
    // 2.7: el casco hueco del kayak contra algo, y el agua que salta
    this.impacto('hueco', { tamaño: 2.2, dureza: 0.5, fuerza: 0.9, vol: 0.18, destino: this.bus.efectos });
    this.sonarBuffer(this.bufferAgua('chapoteo', 1), this.bus.efectos, 0.03, 0.01, azar(1, 1.2));
  }

  // ------------------------------------------------------------------ más aves
  bandurrias(pos) { this.cantar('bandurrias', pos, 1.6, 0.7); }
  picaflor(pos, zumbido = true) {
    if (!this.ctx) return;
    const d = this.fuente(pos, 0.9, 0.2);
    if (zumbido) {
      const ctx = this.ctx, t = ctx.currentTime;
      const s = ctx.createBufferSource(); s.buffer = this.ruido;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 180; f.Q.value = 3;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      s.connect(f); f.connect(g); g.connect(d); s.start(t, Math.random() * 3, 1);
      this.soltarAlTerminar(s, f, g);
    }
    const sonar = (buf) => this.sonarBuffer(buf, d, NIVEL_CANTO.picaflor / 0.9, 0.2, azar(0.97, 1.03));
    const buf = this.variante('canto-picaflor', 3, () => canto('picaflor', TASA_PREVIA), 0.35, sonar);
    if (buf) sonar(buf);
  }
  cisnes(pos) { this.cantar('cisnes', pos, 1.2, 0.8); }
  martin(pos) { this.cantar('martin', pos, 1.3, 0.6); }

  // ------------------------------------------------------------------ 2.7: los instrumentos
  // Una cuerda pulsada del banco (Karplus-Strong, ver `sonido-sintesis.js`), afinada a
  // la nota con la velocidad de reproducción. Se apaga sola; `dur` la corta antes.
  pulsar(midi, { cuando = 0, dur = 3, vol = 0.06, destino } = {}) {
    if (!this.ctx || !destino || !this.puedeSonar(1, cuando)) return null;
    const base = Math.max(CUERDA_DESDE, Math.min(CUERDA_HASTA, CUERDA_DESDE + Math.round((midi - CUERDA_DESDE) / CUERDA_PASO) * CUERDA_PASO));
    let buf = this.previo.get(`cuerda-${base}`) || this.yaMismo(`cuerda-${base}`);
    if (!buf) { this.preparar(`cuerda-${base}`, () => this.recetaCuerda(base)); buf = this.yaMismo(`cuerda-${base}`); }
    if (!buf) return null;
    const ctx = this.ctx, t = ctx.currentTime + cuando;
    const s = ctx.createBufferSource(); s.buffer = buf;
    const velocidad = Math.pow(2, (midi - base) / 12);
    s.playbackRate.value = velocidad;
    const largo = Math.min(dur, buf.duration / velocidad);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.setTargetAtTime(0, t + largo * 0.75, largo * 0.08);
    s.connect(g); g.connect(destino);
    s.start(t); s.stop(t + largo + 0.05);
    this.soltarAlTerminar(s, g);
    return s;
  }
  // La quena: casi un seno, con el soplo en la banda de la nota (más fuerte al atacar,
  // que es el «chiff» de cualquier flauta), la nota que se acomoda al soplar y un
  // vibrato que entra tarde, como el de un quenista.
  quena(frec, { cuando = 0, dur = 1.5, vol = 0.04, destino } = {}) {
    if (!this.ctx || !destino || !this.puedeSonar(2, cuando)) return null;
    const ctx = this.ctx, t = ctx.currentTime + cuando, fin = t + dur;
    const o = ctx.createOscillator(); o.setPeriodicWave(this.ondas.quena);
    o.frequency.setValueAtTime(frec * 0.985, t);
    o.frequency.exponentialRampToValueAtTime(frec, t + 0.08);
    const vib = ctx.createOscillator(); vib.frequency.value = azar(4.6, 5.6);
    const vg = ctx.createGain();
    vg.gain.setValueAtTime(0, t);
    vg.gain.linearRampToValueAtTime(0, t + Math.min(0.35, dur * 0.3));
    vg.gain.linearRampToValueAtTime(frec * 0.0065, t + Math.min(dur * 0.7, 1.1));
    vib.connect(vg); vg.connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.07);
    g.gain.linearRampToValueAtTime(vol * 1.08, t + dur * 0.5);
    g.gain.setTargetAtTime(0, fin - Math.min(0.25, dur * 0.3), 0.07);
    o.connect(g); g.connect(destino);
    // el soplo
    const n = ctx.createBufferSource(); n.buffer = this.ruido;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = frec * 2; nf.Q.value = 2.5;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(vol * 1.6, t + 0.025);
    ng.gain.linearRampToValueAtTime(vol * 0.45, t + 0.14);
    ng.gain.setTargetAtTime(0, fin - Math.min(0.25, dur * 0.3), 0.06);
    n.connect(nf); nf.connect(ng); ng.connect(destino);
    o.start(t); o.stop(fin + 0.4); vib.start(t); vib.stop(fin + 0.4);
    n.start(t, Math.random() * 3, dur + 0.45);
    this.soltarAlTerminar(o, g); this.soltarAlTerminar(vib, vg); this.soltarAlTerminar(n, nf, ng);
    return o;
  }
  // Un colchón: dos senos apenas desafinados que baten despacio y un triángulo una
  // octava arriba, todo por un pasabajos. Entra y se va sin ataque.
  colchon(frec, { cuando = 0, dur = 4, vol = 0.03, destino } = {}) {
    if (!this.ctx || !destino || !this.puedeSonar(2, cuando)) return null;
    const ctx = this.ctx, t = ctx.currentTime + cuando;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(1600, frec * 5); lp.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.35);
    g.gain.setTargetAtTime(0, t + dur * 0.6, dur * 0.12);
    lp.connect(g); g.connect(destino);
    let ultimo = null;
    for (const [mult, cents, tipo, nivel] of [[1, -5, 'sine', 0.55], [1, 6, 'sine', 0.55], [2, 2, 'triangle', 0.15]]) {
      const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = frec * mult; o.detune.value = cents;
      const og = ctx.createGain(); og.gain.value = nivel;
      o.connect(og); og.connect(lp);
      o.start(t); o.stop(t + dur + 0.1);
      this.soltarAlTerminar(o, og);
      ultimo = o;
    }
    ultimo.addEventListener('ended', () => { try { lp.disconnect(); g.disconnect(); } catch {} });
    return ultimo;
  }

  // La música del Relax (2.7: ya no es un piano de senos). Cada frase elige instrumento:
  // casi siempre la guitarra —cuerdas pulsadas, con el brillo del charango arriba—, a
  // veces la quena, y abajo, de vez en cuando, un colchón suave que sostiene la nota.
  frase(noche, paleta = null) {
    if (!this.ctx) return;
    const escala = paleta?.escala || [62, 64, 66, 69, 71, 74, 76, 78, 81];
    const vol = paleta?.vol ?? 1;
    const espacio = paleta?.espacio || [0.6, 1.6];
    const duracion = paleta?.duracion || [2.5, 4.5];
    const cuantas = paleta?.notas || [5, 10];
    const destino = this.ctx.createGain(); destino.gain.value = 0.8;
    destino.connect(this.bus.musica);
    const rv = this.ctx.createGain(); rv.gain.value = 1.4; destino.connect(rv); rv.connect(this.envioReverb);
    let c = 0, idx = Math.floor(Math.random() * 5) + 2;
    // 2.6.1: la mezcla de cada frase se desconecta cuando termina su última nota;
    // antes quedaban dos ganancias colgadas del bus de música por cada frase.
    let ultima = null, finUltima = -1;
    const anotar = (o, fin) => { if (o && fin > finUltima) { ultima = o; finUltima = fin; } };
    const quena = Math.random() < (noche > 0.5 ? 0.22 : 0.36);
    this.ultimoInstrumento = quena ? 'quena' : 'guitarra';
    const n = cuantas[0] + Math.floor(Math.random() * Math.max(1, cuantas[1] - cuantas[0] + 1));
    for (let i = 0; i < n; i++) {
      idx = Math.max(0, Math.min(escala.length - 1, idx + Math.floor(azar(-2, 3))));
      // si la paleta ya bajó de octava, la noche no vuelve a bajarla
      const m = escala[idx] - (!paleta && noche > 0.5 ? 12 : 0);
      const f = 440 * Math.pow(2, (m - 69) / 12);
      const dur = azar(duracion[0], duracion[1]);
      const paso = azar(espacio[0], espacio[1]) * (quena ? 1.2 : 1);
      if (quena) {
        // la quena es una sola voz: la nota dura hasta la siguiente, no se pisan
        const largo = Math.max(0.4, Math.min(2.6, i === n - 1 ? dur * 0.6 : paso * 0.94));
        anotar(this.quena(f, { cuando: c, dur: largo, vol: 0.026 * vol, destino }), c + largo + 0.4);
      } else {
        // la cuerda aguda se apaga antes: se la pulsa un poco más fuerte
        anotar(this.pulsar(m, { cuando: c, dur, vol: 0.14 * Math.pow(2, (m - 57) / 24) * vol, destino }), c + dur);
      }
      if (Math.random() < 0.3) anotar(this.colchon(f / 2, { cuando: c, dur: dur * 1.2, vol: 0.016 * vol, destino }), c + dur * 1.2);
      c += paso;
    }
    const soltar = () => { try { destino.disconnect(); rv.disconnect(); } catch {} };
    if (ultima) ultima.addEventListener('ended', soltar); else soltar();
  }
}
