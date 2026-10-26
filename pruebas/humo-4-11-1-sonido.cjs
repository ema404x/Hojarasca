// Partida real 4.11.1 (Electron, Relax): el sonido que se decidió en DECISIONES_DISENO_4_10.md (Q4, Q5, Q7, Q12).
// OJO: acá no se oye nada. Se miden los buses y el grafo de audio REAL del motor: se espía `AudioNode.connect` para saber por dónde sale cada
// fuente, se leen las ganancias vivas de los GainNode (`gain.value`) y se multiplican a lo largo del camino hasta la salida.
//  · Q4: los pájaros salen por el bus de «El bosque»: con el bosque en 0 no suenan (ni su reverberación); con Efectos en 0, sí;
//  · Q5: adentro de la cabaña (puerta cerrada) se atenúan a 0,3 de lo de afuera, como el viento;
//  · Q7: la gramola sale por el bus de la música: Música en 0 o «Solo el bosque» la callan; El bosque y Efectos en 0, no;
//  · Q12: la radio de la madrugada se apaga, y si la síntesis llega tarde (apagada, o lejos de la radio) no suena.
// Uso (después de `node armar.mjs`, por PowerShell): herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-11-1-sonido.cjs -Espera 900 -Perfil <carpeta>
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', '_perfil-humo-sonido-4111')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let fallas = 0;
const ok = (c, t) => { if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const errores = [];
setTimeout(() => { console.log('✗ se pasó del tiempo (12 minutos)'); app.exit(1); }, 12 * 60 * 1000).unref();

// Se inyecta apenas se arma el DOM, antes de que el juego cree el contexto de audio.
const ESPIA = String.raw`(() => {
  if (window.__R) return 1;
  const R = window.__R = { sal: new WeakMap(), espiar: false, fuentes: [], biquads: [] };
  const con = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (d, ...resto) {
    if (d && !(d instanceof AudioParam)) { let s = R.sal.get(this); if (!s) { s = new Set(); R.sal.set(this, s); } s.add(d); }
    return con.call(this, d, ...resto);
  };
  const dis = AudioNode.prototype.disconnect;
  AudioNode.prototype.disconnect = function (...a) { R.sal.delete(this); return dis.apply(this, a); };
  const cbs = BaseAudioContext.prototype.createBufferSource;
  BaseAudioContext.prototype.createBufferSource = function () {
    const s = cbs.call(this);
    if (R.espiar) { R.fuentes.push(s); const st = s.start.bind(s); s.arrancada = false; s.start = (...a) => { s.arrancada = true; return st(...a); }; const sp = s.stop.bind(s); s.parada = false; s.stop = (...a) => { s.parada = true; return sp(...a); }; }
    return s;
  };
  const cbq = BaseAudioContext.prototype.createBiquadFilter;
  BaseAudioContext.prototype.createBiquadFilter = function () { const b = cbq.call(this); if (R.espiar) R.biquads.push(b); return b; };
  const sal = (n) => R.sal.get(n) || new Set();
  // la mejor ganancia de un camino de origen a meta (producto de los GainNode, con el valor vivo; la de meta cuenta)
  R.gan = (origen, meta) => {
    let mejor = 0;
    const ir = (n, g, vistos) => {
      if (n === meta) { mejor = Math.max(mejor, g); return; }
      for (const d of sal(n)) { if (vistos.has(d)) continue; const v = new Set(vistos); v.add(d); ir(d, g * (d instanceof GainNode ? d.gain.value : 1), v); }
    };
    ir(origen, 1, new Set([origen]));
    return mejor;
  };
  R.llega = (origen, meta, vistos = new Set()) => { if (origen === meta) return true; if (vistos.has(origen)) return false; vistos.add(origen); for (const d of sal(origen)) if (R.llega(d, meta, vistos)) return true; return false; };
  // Chrome no procesa un GainNode sin entradas activas y su gain.value queda viejo: se les enchufa una fuente constante en 0 para que sus perillas se lean vivas
  R.vivos = () => {
    const S = window.__hojarasca.sonido;
    if (R.fuenteViva) return 1;
    R.fuenteViva = S.ctx.createConstantSource(); R.fuenteViva.offset.value = 0;
    for (const n of [S.bus.ambiente, S.bus.efectos, S.bus.musica, S.bus.piano, S.bus.techo, S.envioReverb, S.envioReverbMusica, S.envioReverbAmbiente]) if (n) R.fuenteViva.connect(n);
    R.fuenteViva.start();
    return 1;
  };
  R.bus = () => { const S = window.__hojarasca.sonido; return { bosque: S.bus.ambiente.gain.value, efectos: S.bus.efectos.gain.value, musica: S.bus.musica.gain.value, piano: S.bus.piano.gain.value, master: S.master.gain.value }; };
  // un pájaro: cuánto llega a la salida por el camino seco y por el de la reverberación, y por qué bus sale
  R.ave = (nombre) => {
    const H = window.__hojarasca, S = H.sonido, p = H.jugador.estado.pos;
    const pos = { x: p.x + 8, y: p.y, z: p.z + 8 };
    R.fuentes = []; R.espiar = true;
    S[nombre](pos);
    R.espiar = false;
    const fs = R.fuentes;
    const porBus = (f, bus) => R.gan(f, bus) * R.gan(bus, S.master);
    const seco = Math.max(0, ...fs.flatMap((f) => [porBus(f, S.bus.ambiente), porBus(f, S.bus.efectos)]));
    const reverb = Math.max(0, ...fs.flatMap((f) => [porBus(f, S.envioReverb), porBus(f, S.envioReverbAmbiente)]));
    return { fuentes: fs.length, seco, reverb, alBosque: fs.some((f) => R.llega(f, S.bus.ambiente)), aEfectos: fs.some((f) => R.llega(f, S.bus.efectos)), espacio: S.espacioActual };
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon/.test(m)) errores.push(m.slice(0, 240)); });
  w.webContents.on('dom-ready', () => { w.webContents.executeJavaScript(ESPIA).catch(() => {}); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  const cargar = async (search) => {
    await w.loadFile(url, { search });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.__bucle').catch(() => false)) return true; }
    return false;
  };
  const cuadros = (n) => js(`(() => { for (let i = 0; i < ${n}; i++) { window.__hojarasca.jugador.actualizar(0.05); window.__hojarasca.__bucle(); } return 1; })()`);
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(code)}, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: ${JSON.stringify(code)}, bubbles: true })); 1`);
  const R = (expr) => js(`window.__R.${expr}`);
  const cerca = (a, b, t = 0.03) => Math.abs(a - b) <= t * Math.max(Math.abs(b), 1e-9) + 1e-9;

  await w.loadURL('about:blank');
  await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
  await cargar('?debug=1');
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: true, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano', volumen: 0.8, volumenAmbiente: 1, volumenEfectos: 1, volumenMusica: 1 })); 1`);
  ok(await cargar('?debug=1'), 'cargó el juego');
  ok(await js('!!window.__R'), 'el espía de audio quedó puesto antes de crear el motor');
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3500);
  await cuadros(4);
  ok(await js(`(() => { const S = window.__hojarasca.sonido; return !!S.ctx && S.ctx.state === 'running' && !!S.bus; })()`), 'el motor de audio está andando (contexto «running»)');
  ok(await js(`(() => { const S = window.__hojarasca.sonido; return window.__R.llega(S.bus.ambiente, S.master) && window.__R.llega(S.bus.efectos, S.master) && window.__R.llega(S.bus.piano, S.master); })()`), 'el espía conoce el grafo de los buses (llegan a la salida)');
  await R('vivos()');
  await js(`(() => { const H = window.__hojarasca; H.progreso.horas = 12; H.ajustes.limiteFps = 'libre'; return 1; })()`);

  // las perillas, por la interfaz de Ajustes (como las toca el jugador)
  // el reloj del audio sólo avanza mientras el juego da cuadros: se lo deja correr de a un segundo con unos cuadros
  const correr = async (seg) => { for (let i = 0; i < seg; i++) { await esperar(1000); await cuadros(3); } };
  const pausa = async () => { await tecla('Escape'); await esperar(700); await cuadros(2); };
  const mover = (clave, v) => js(`(() => { const r = document.querySelector('[data-ajuste-rango="${clave}"]'); r.value = ${v}; r.dispatchEvent(new Event('input', { bubbles: true })); return JSON.stringify(window.__hojarasca.sonido.mezcla); })()`);
  const poner = async (bosque, efectos, musica) => {
    await pausa();
    await mover('volumenAmbiente', bosque); await mover('volumenEfectos', efectos); await mover('volumenMusica', musica);
    await tecla('Escape'); await esperar(500);
    await cuadros(2);
    await correr(6);   // las perillas se deslizan (hasta 0,8 s de constante de tiempo)
    return js('window.__R.bus()');
  };
  const dichos = (b) => `bosque ${b.bosque.toFixed(3)}, efectos ${b.efectos.toFixed(3)}, música ${b.musica.toFixed(3)}, piano ${b.piano.toFixed(3)}`;
  const AVES = ['zorzal', 'rayadito', 'fiofio'];
  // los pájaros que no están pre-sintetizados se arman al primer pedido: se piden una vez y se espera a la cola
  const calentar = async () => { for (const a of ['zorzal', 'rayadito', 'fiofio', 'chucao', 'cachanas', 'ave', 'picaflor']) await R(`ave(${JSON.stringify(a)})`);
    // la cola de síntesis corre cuando el navegador está ocioso y con la ventana oculta casi no avanza: se la empuja a mano
    for (let i = 0; i < 600; i++) { const resto = await js('(() => { const S = window.__hojarasca.sonido; S.trabajarCola(120); return S.cola.length; })()'); if (!resto) break; await esperar(15); }
    await cuadros(2);
  };
  await calentar();

  // ---- Q4: los pájaros y las perillas (afuera, en el claro del refugio)
  await js(`(() => { const H = window.__hojarasca, r = H.T.lugares.refugio; H.jugador.ubicar(r.x + 30, r.z + 30, 0); return 1; })()`);
  await cuadros(8);
  ok((await js('window.__hojarasca.sonido.espacioActual')) === 'bosque', 'el jugador está afuera (espacio «bosque»)');
  let b = await poner(1, 1, 1);
  console.log('  buses con todo al máximo: ' + dichos(b));
  const base = {};
  for (const a of ['zorzal', 'rayadito', 'fiofio', 'chucao', 'cachanas', 'ave', 'picaflor']) {
    base[a] = await R(`ave(${JSON.stringify(a)})`);
    ok(base[a].fuentes > 0 && base[a].alBosque && !base[a].aEfectos, `Q4: ${a} sale por el bus del bosque y no por Efectos (fuentes ${base[a].fuentes})`);
    ok(base[a].seco > 0 && base[a].reverb > 0, `Q4: ${a} con todo al máximo llega a la salida (seco ${base[a].seco.toFixed(4)}, reverb ${base[a].reverb.toFixed(4)})`);
    await esperar(150);
  }
  b = await poner(0, 1, 1);
  console.log('  «El bosque» en 0: ' + dichos(b));
  ok(b.bosque < 0.001 && cerca(b.efectos, 1, 0.01), 'Q4: con «El bosque» en 0 el bus del bosque está en 0 y el de efectos sigue en 1');
  for (const a of ['zorzal', 'rayadito', 'fiofio', 'chucao', 'cachanas', 'ave', 'picaflor']) {
    const r = await R(`ave(${JSON.stringify(a)})`);
    // (el bus no llega a 0 exacto: la perilla se acerca por una curva; se pide menos del 1 % de lo normal)
    ok(r.fuentes > 0 && r.seco < base[a].seco * 0.01 && r.reverb < base[a].reverb * 0.01, `Q4: ${a} con «El bosque» en 0 no suena, ni su reverberación (seco ${r.seco.toExponential(1)} contra ${base[a].seco.toExponential(1)}, reverb ${r.reverb.toExponential(1)} contra ${base[a].reverb.toExponential(1)})`);
  }
  // una fuente común (un golpe de hacha) sigue con Efectos aunque el bosque esté en 0
  ok(await js(`(() => { const S = window.__hojarasca.sonido; const g = S.fuente({ x: 1, y: 1, z: 1 }, 1, 0.6); const f = S.ctx.createBufferSource(); f.connect(g); return window.__R.gan(f, S.master) > 0; })()`), 'Q4: lo que no es un pájaro sigue sonando con «El bosque» en 0');
  b = await poner(1, 0, 1);
  console.log('  «Efectos» en 0: ' + dichos(b));
  ok(b.efectos < 0.001 && cerca(b.bosque, 1, 0.01), 'Q4: con «Efectos» en 0 el bus de efectos está en 0 y el del bosque en 1');
  for (const a of ['zorzal', 'chucao', 'picaflor']) {
    const r = await R(`ave(${JSON.stringify(a)})`);
    ok(r.seco > 0 && cerca(r.seco, base[a].seco, 0.05) && cerca(r.reverb, base[a].reverb, 0.05), `Q4: ${a} con «Efectos» en 0 suena igual que antes (seco ${r.seco.toFixed(4)} contra ${base[a].seco.toFixed(4)})`);
  }
  b = await poner(0.5, 1, 1);
  { const r = await R('ave("zorzal")'); ok(cerca(r.seco / base.zorzal.seco, 0.5, 0.05), `Q4: con «El bosque» a la mitad, el pájaro a la mitad (${(r.seco / base.zorzal.seco).toFixed(3)})`); }

  // ---- Q5: adentro de la cabaña
  b = await poner(1, 1, 1);
  const afuera = {};
  for (const a of ['zorzal', 'chucao', 'picaflor']) afuera[a] = await R(`ave(${JSON.stringify(a)})`);
  await js(`(() => { const H = window.__hojarasca, c = H.T.lugares.cabana || H.T.lugares.refugio; H.jugador.ubicar(c.x, c.z, 0); return 1; })()`);
  await cuadros(10); await esperar(2500); await cuadros(4);
  const esp = await js('window.__hojarasca.sonido.espacioActual');
  ok(esp === 'adentro', `adentro de la casa el espacio de audio es «adentro» (${esp})`);
  for (const a of ['zorzal', 'chucao', 'picaflor']) {
    const r = await R(`ave(${JSON.stringify(a)})`);
    ok(r.alBosque && !r.aEfectos, `Q5: ${a} adentro sigue saliendo por el bosque`);
    ok(cerca(r.seco / afuera[a].seco, 0.3, 0.06) && cerca(r.reverb / afuera[a].reverb, 0.3, 0.06), `Q5: ${a} adentro suena ${(r.seco / afuera[a].seco).toFixed(3)} de lo de afuera (esperado 0,3, como el viento)`);
  }
  await js(`(() => { const H = window.__hojarasca, r = H.T.lugares.refugio; H.jugador.ubicar(r.x + 30, r.z + 30, 0); return 1; })()`);
  await cuadros(10); await esperar(2500); await cuadros(4);
  { const r = await R('ave("zorzal")'); ok(r.espacio === 'bosque' && cerca(r.seco, afuera.zorzal.seco, 0.06), `Q5: al salir, el pájaro vuelve a sonar entero (${r.seco.toFixed(4)} contra ${afuera.zorzal.seco.toFixed(4)})`); }

  // ---- Q7: la gramola (se construye una de verdad y se le da cuerda con E)
  const armada = await js(`(() => {
    const H = window.__hojarasca, O = H.obras, T = H.T;
    const pl = H.PLANOS.find((p) => p.id === 'gramola'); if (!pl) return 'sin plano';
    const r0 = T.lugares.refugio; let sitio = null;
    for (let r = 26; r < 200 && !sitio; r += 3.1) for (let i = 0; i < 24 && !sitio; i++) {
      const a = i / 24 * Math.PI * 2, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
      if (O.revisarSitio(x, z, pl, 0).ok) sitio = { x, z };
    }
    if (!sitio) return 'sin sitio';
    H.progreso.economia.pesos = 30000; Object.assign(H.progreso.materiales, { tronco: 99, tabla: 99, piedra: 99, lana: 99 });
    O.elegir(pl);
    const f = O.fundar(sitio.x, sitio.z, 0, T.altura(sitio.x, sitio.z));
    if (!f.ok) return 'no fundó: ' + f.motivo;
    const ob = O.obraCerca(sitio, 2, 'gramola'); if (!ob) return 'no quedó la obra';
    O.avanzar(ob, { tronco: 99, tabla: 99, piedra: 99, lana: 99 });
    H.progreso.obras = O.obras.map((o) => o.datos);
    O.elegir(null);
    window.__gramola = ob; window.__gramolaSitio = sitio;
    return O.obras.some((o) => o.plano.id === 'gramola') ? 'ok' : 'no se terminó';
  })()`);
  ok(armada === 'ok', `se construyó una gramola (${armada})`);
  if (armada === 'ok') {
    const junto = () => js(`(() => { const H = window.__hojarasca, o = window.__gramola, r = o.datos.rot || 0; H.jugador.ubicar(o.datos.x - 1.3 * Math.sin(r), o.datos.z - 1.3 * Math.cos(r), r + Math.PI); for (let i = 0; i < 8; i++) { H.jugador.actualizar(0.05); H.__bucle(); } return 1; })()`);
    const E = async () => { await js('window.__R.biquads = []; window.__R.espiar = true; 1'); await tecla('KeyE'); await esperar(500); await js('window.__R.espiar = false; 1'); };
    // la cadena de la gramola: el filtro pasabajos de 2600 Hz que arma `alternarGramola`; da su ganancia hasta la salida
    const nivel = () => js(`(() => { const S = window.__hojarasca.sonido, b = window.__R.biquads.find((x) => x.type === 'lowpass' && Math.abs(x.frequency.value - 2600) < 1); return b ? window.__R.gan(b, S.master) : -1; })()`);
    const alBus = () => js(`(() => { const S = window.__hojarasca.sonido, b = window.__R.biquads.find((x) => x.type === 'lowpass' && Math.abs(x.frequency.value - 2600) < 1); return b ? { musica: window.__R.llega(b, S.bus.piano) || window.__R.llega(b, S.bus.musica), efectos: window.__R.llega(b, S.bus.efectos), ambiente: window.__R.llega(b, S.bus.ambiente) } : null; })()`);
    const notas = () => js(`[...document.querySelectorAll('#notas .nota')].map((n) => n.textContent.replace(/\\s+/g, ' ').trim()).join(' | ')`);
    const darCuerda = async (bosque, efectos, musica, soloBosque = false) => {
      b = await poner(bosque, efectos, musica);
      await js(`(() => { const H = window.__hojarasca; H.ajustes.musica = ${!soloBosque}; H.sonido.setMusica(${!soloBosque}); return 1; })()`);
      await correr(5);
      await junto();
      await E();
      const n = await nivel(), bus = await alBus(), nt = await notas();
      console.log('  gramola con (' + [bosque, efectos, musica].join(', ') + (soloBosque ? ', solo el bosque' : '') + '): ' + dichos(await js('window.__R.bus()')) + ', agache de la música ' + (await js('window.__hojarasca.sonido.agaches.musica.gain.value')).toFixed(3) + ', mezcla ' + (await js('JSON.stringify(window.__hojarasca.sonido.mezcla)')));
      const suena = /Le diste cuerda a la gramola/.test(nt);
      if (suena) { await E(); }   // la para
      await correr(2);
      return { n, bus, suena, b };
    };
    const normal = await darCuerda(1, 1, 1);
    ok(normal.suena, 'Q7: E le da cuerda a la gramola');
    ok(normal.bus && normal.bus.musica && !normal.bus.efectos, 'Q7: la gramola sale por el bus de la música y no por Efectos');
    const esperado = 0.9 * normal.b.master * 1;   // su volumen propio (0,9 · 2) por el bus de la música (0,5) · el volumen general; igual que cuando salía por Efectos
    ok(normal.n > 0 && cerca(normal.n, esperado, 0.06), `Q7: con todo al máximo llega a la salida lo mismo que antes (${normal.n.toFixed(4)} contra ${esperado.toFixed(4)})`);
    const sinMusica = await darCuerda(1, 1, 0);
    ok(sinMusica.suena && sinMusica.n >= 0 && sinMusica.n < normal.n * 0.01, `Q7: con «Música» en 0 la gramola no se oye (${sinMusica.n.toExponential(1)})`);
    const mitad = await darCuerda(1, 1, 0.5);
    ok(cerca(mitad.n, normal.n * 0.5, 0.06), `Q7: con «Música» a la mitad, la mitad (${mitad.n.toFixed(4)} contra ${(normal.n * 0.5).toFixed(4)})`);
    const sinBosque = await darCuerda(0, 0, 1);
    ok(cerca(sinBosque.n, normal.n, 0.06), `Q7: con «El bosque» y «Efectos» en 0 suena igual (${sinBosque.n.toFixed(4)})`);
    const solo = await darCuerda(1, 1, 1, true);
    ok(solo.n >= 0 && solo.n < normal.n * 0.01, `Q7: con «Solo el bosque» no se oye (${solo.n.toExponential(1)})`);
    await js(`(() => { const H = window.__hojarasca; H.ajustes.musica = true; H.sonido.setMusica(true); return 1; })()`);
  }
  b = await poner(1, 1, 1);

  // ---- Q12: la radio de la madrugada (por el enganche del juego; la E sobre la radio se prueba por texto en el gate)
  {
    const HU = await import(require('url').pathToFileURL(path.join(raiz, 'src', 'huevos.js')).href);
    const noches = []; for (let n = 900; noches.length < 4; n++) if (HU.hayEmisoraMadrugada(n)) noches.push(n);
    const lugarRadio = await js(`(() => { const r = window.__hojarasca.T.lugares.refugio; return { x: r.x, z: r.z }; })()`);
    const drenar = async () => { for (let i = 0; i < 600; i++) { const resto = await js('(() => { const S = window.__hojarasca.sonido; S.trabajarCola(120); return S.cola.length; })()'); if (!resto) break; await esperar(15); } await cuadros(2); await esperar(500); };
    const olvidar = () => js("(() => { const S = window.__hojarasca.sonido; for (const k of [...S.previo.keys()]) if (k.startsWith('radio-mad')) S.previo.delete(k); return 1; })()");
    const vivas16 = () => js(`window.__R.fuentes.filter((f) => f.arrancada && !f.parada && f.buffer && f.buffer.sampleRate === 16000).length`);
    const cerca16 = () => js(`window.__R.fuentes.filter((f) => f.arrancada && f.buffer && f.buffer.sampleRate === 16000).length`);
    const noche = async (n) => js(`(() => { const p = window.__hojarasca.progreso; p.dia = ${n + 1}; p.horas = 3; p.huevos.radio = { ultima: 0, oidos: 0 }; return 1; })()`);
    const junto = () => js(`(() => { window.__hojarasca.jugador.ubicar(${lugarRadio.x} + 2, ${lugarRadio.z} + 2, 0); return 1; })()`);
    const lejos = () => js(`(() => { window.__hojarasca.jugador.ubicar(${lugarRadio.x} + 90, ${lugarRadio.z} + 90, 0); return 1; })()`);
    const huevos = (e) => js(`window.__hojarasca.__huevos.juego().${e}`);
    // 1) suena y se apaga
    await js('window.__R.fuentes = []; window.__R.espiar = true; 1');
    await junto(); await noche(noches[0]);
    ok((await huevos(`radioMadrugada({ x: ${lugarRadio.x}, z: ${lugarRadio.z} })`)) === true, 'Q12: esa noche hay emisora');
    ok((await huevos('radioSuena()')) === true, 'Q12: queda el pedido vigente mientras se sintetiza');
    let n1 = 0; for (let i = 0; i < 80 && !n1; i++) { await esperar(500); await cuadros(1); n1 = await cerca16(); }
    ok(n1 === 1, `Q12: llegó la síntesis y suena una sola emisora (${n1})`);
    ok((await huevos('radioSuena()')) === true, 'Q12: la emisora figura sonando');
    const antes = await js(`(() => { const S = window.__hojarasca.sonido, f = window.__R.fuentes.find((x) => x.arrancada && x.buffer && x.buffer.sampleRate === 16000); return window.__R.gan(f, S.bus.efectos); })()`);
    ok(antes > 0, `Q12: sonando llega al bus de efectos (${antes.toFixed(3)})`);
    ok((await huevos('apagarRadio()')) === true, 'Q12: se apaga');
    await esperar(900);
    const despues = await js(`(() => { const S = window.__hojarasca.sonido, f = window.__R.fuentes.find((x) => x.arrancada && x.buffer && x.buffer.sampleRate === 16000); return { gan: window.__R.gan(f, S.bus.efectos), parada: f.parada }; })()`);
    ok(despues.parada && despues.gan < 0.001, `Q12: la fuente se cortó y se fue a cero (parada ${despues.parada}, ganancia ${despues.gan.toExponential(1)})`);
    ok((await huevos('radioSuena()')) === false, 'Q12: ya no figura sonando');
    // 2) apagada antes de que llegue la síntesis: el audio atrasado se descarta
    await js('window.__R.fuentes = []; 1');
    await olvidar(); await noche(noches[1]);
    ok((await huevos(`radioMadrugada({ x: ${lugarRadio.x}, z: ${lugarRadio.z} })`)) === true, 'Q12: otra noche con emisora');
    ok((await huevos('apagarRadio()')) === true, 'Q12: se apaga antes de que llegue la síntesis');
    await drenar();
    ok((await vivas16()) === 0 && (await js('window.__hojarasca.sonido.cola.length')) === 0, `Q12: la síntesis llegó tarde y no suena (${await vivas16()} fuentes de la radio)`);
    // 3) te fuiste de la radio antes de que llegue: tampoco
    await js('window.__R.fuentes = []; 1');
    await olvidar(); await noche(noches[2]);
    ok((await huevos(`radioMadrugada({ x: ${lugarRadio.x}, z: ${lugarRadio.z} })`)) === true, 'Q12: una tercera noche con emisora');
    await lejos(); await cuadros(2);
    await drenar();
    ok((await vivas16()) === 0, `Q12: si te alejaste de la radio, el audio atrasado no suena (${await vivas16()})`);
    await huevos('actualizar(2.1)');
    ok((await huevos('radioSuena()')) === false, 'Q12: la revisión de cada 2 segundos suelta el pedido de quien se alejó');
    // 4) cerca y sin apagar: suena entera
    await js('window.__R.fuentes = []; 1');
    await junto(); await noche(noches[3]);
    await huevos(`radioMadrugada({ x: ${lugarRadio.x}, z: ${lugarRadio.z} })`);
    let n4 = 0; for (let i = 0; i < 80 && !n4; i++) { await esperar(500); await cuadros(1); n4 = await cerca16(); }
    ok(n4 === 1, `Q12: cerca de la radio y sin apagar, suena (${n4})`);
    await huevos('apagarRadio()');
    await js('window.__R.espiar = false; 1');
  }

  ok(errores.length === 0, 'la consola quedó sin errores' + (errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''));
  console.log(fallas ? `\nFALLARON ${fallas} comprobaciones` : '\nTodo en orden (se midieron los buses; no se pudo escuchar nada).');
  app.exit(fallas ? 1 : 0);
});
