// Partida real 4.11.4 (Electron, Relax): el BANCO DE SONIDOS de la pausa.
// OJO: acá no se oye nada. Se abre el banco como lo abre el jugador (Escape, clic en «Banco de sonidos»), se recorre la lista con el teclado (Inicio,
// flecha de abajo, Enter, Espacio) y se lee el grafo de audio REAL del motor: se espía `AudioNode.connect` para saber por dónde sale cada fuente.
//  · se dispara TODO el catálogo uno por uno: cada sonido crea fuentes, llegan al bus que dice el catálogo (y a ningún otro) y a la salida;
//  · los bucles del ambiente (viento, lluvia, arroyo, fuego…) suben las perillas del motor real y se apagan con un segundo Enter;
//  · los volúmenes del panel son los de verdad: «El bosque» en 0 calla a los pájaros, «Música» a la mitad baja la gramola a la mitad;
//  · «Detener todo» (Espacio) corta las fuentes, la gramola, la radio y los bucles;
//  · Escape vuelve a la pausa y deja el motor como estaba (el Relax, `actualizar`, el contexto de audio);
//  · la partida queda intacta: el progreso y el almacenamiento (menos los volúmenes, que son de Ajustes) no cambian;
//  · sin errores de consola. Capturas del banco a tamaño completo en la carpeta de salida.
// Uso (después de `node armar.mjs`, por PowerShell): herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-11-4-banco-sonidos.cjs -Espera 900 -Perfil <carpeta> [-Visible]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/AppData/Local/Temp/hx/salida4114';
dialog.showErrorBox = () => {};
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || process.env.HOJ_PERFIL || path.join(raiz, 'pruebas', 'salidas', '_perfil-humo-banco-sonidos-4114')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let fallas = 0;
const ok = (c, t) => { if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const errores = [];
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa): ${e && e.stack ? e.stack : e}`); salir(1); });
setTimeout(() => { console.log('✗ se pasó del tiempo (13 minutos)'); salir(1); }, 13 * 60 * 1000).unref();

// Se inyecta apenas se arma el DOM, antes de que el juego cree el contexto de audio. Las aristas del grafo se guardan para siempre
// (las fuentes se desconectan al terminar y el sonido más corto dura unos milisegundos).
const ESPIA = String.raw`(() => {
  if (window.__R) return 1;
  const R = window.__R = { sal: new WeakMap(), vivo: new WeakMap(), mod: new WeakSet() };
  const con = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (d, ...resto) {
    if (d instanceof AudioParam) R.mod.add(this);   // un oscilador que sólo modula una perilla (vibrato, temblor) no va a ningún bus
    if (d && !(d instanceof AudioParam)) {
      let s = R.sal.get(this); if (!s) { s = new Set(); R.sal.set(this, s); } s.add(d);
      let v = R.vivo.get(this); if (!v) { v = new Set(); R.vivo.set(this, v); } v.add(d);
    }
    return con.call(this, d, ...resto);
  };
  const dis = AudioNode.prototype.disconnect;
  AudioNode.prototype.disconnect = function (...a) { R.vivo.delete(this); return dis.apply(this, a); };
  const st = AudioScheduledSourceNode.prototype.stop;
  AudioScheduledSourceNode.prototype.stop = function (t) { this.__parada = t === undefined ? 0 : t; return st.call(this, t); };
  for (const k of ['createBufferSource', 'createOscillator']) { const o = BaseAudioContext.prototype[k]; BaseAudioContext.prototype[k] = function (...a) { const n = o.apply(this, a); n.__pila = new Error().stack.split(String.fromCharCode(10)).slice(2, 7).map((l) => l.trim().replace(/[(].*[/]/, '(')).join(' < '); return n; }; }
  const sal = (n) => R.sal.get(n) || new Set();
  const vivo = (n) => R.vivo.get(n) || new Set();
  R.llega = (origen, meta, vistos = new Set()) => { if (origen === meta) return true; if (vistos.has(origen)) return false; vistos.add(origen); for (const d of sal(origen)) if (R.llega(d, meta, vistos)) return true; return false; };
  // la mejor ganancia de un camino de origen a meta por las conexiones vivas (producto de los GainNode, con el valor vivo)
  R.gan = (origen, meta) => {
    let mejor = 0;
    const ir = (n, g, vistos) => {
      if (n === meta) { mejor = Math.max(mejor, g); return; }
      for (const d of vivo(n)) { if (vistos.has(d)) continue; const v = new Set(vistos); v.add(d); ir(d, g * (d instanceof GainNode ? d.gain.value : 1), v); }
    };
    ir(origen, 1, new Set([origen]));
    return mejor;
  };
  // Chrome no procesa un GainNode sin entradas activas y su gain.value queda viejo: se les enchufa una fuente constante en 0 para leerlos vivos
  R.vivos = () => {
    const S = window.__hojarasca.sonido;
    if (R.fuenteViva) return 1;
    R.fuenteViva = S.ctx.createConstantSource(); R.fuenteViva.offset.value = 0;
    for (const n of [S.bus.ambiente, S.bus.efectos, S.bus.musica, S.bus.piano, S.bus.techo, S.envioReverb, S.envioReverbMusica, S.envioReverbAmbiente]) if (n) R.fuenteViva.connect(n);
    R.fuenteViva.start();
    return 1;
  };
  R.busesDe = (b) => { const S = window.__hojarasca.sonido; return ({ ambiente: [S.bus.ambiente, S.bus.techo], efectos: [S.bus.efectos], musica: [S.bus.musica, S.bus.piano] })[b]; };
  // ¿las fuentes de lo último que sonó llegan a su bus (y a ningún otro) y a la salida?
  R.revisar = (u) => {
    const S = window.__hojarasca.sonido;
    const propios = R.busesDe(u.bus), ajenos = ['ambiente', 'efectos', 'musica'].filter((x) => x !== u.bus).flatMap(R.busesDe);
    const r = { fuentes: u.fuentes.length, alBus: 0, aOtro: 0, aSalida: 0 };
    // ¿esta fuente sólo modula una perilla? (el vibrato, el temblor o la aspereza de una garganta: el oscilador o el ruido lento va, por una ganancia
    // o directo, a un AudioParam y no a un bus): no es un sonido que tenga que llegar a la salida
    const modula = (f) => { const vistos = new Set([f]); const cola = [f]; while (cola.length) { const n = cola.pop(); if (R.mod.has(n)) return true; for (const d of sal(n)) if (!vistos.has(d)) { vistos.add(d); cola.push(d); } } return false; };
    for (const f of u.fuentes) {
      if (!propios.some((b) => R.llega(f, b)) && !R.llega(f, S.master) && modula(f)) { r.moduladoras = (r.moduladoras || 0) + 1; r.fuentes--; continue; }
      if (propios.some((b) => R.llega(f, b))) r.alBus++;
      if (ajenos.some((b) => R.llega(f, b))) r.aOtro++;
      if (R.llega(f, S.master)) r.aSalida++;
    }
    return r;
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon/.test(m)) { errores.push(m.slice(0, 300)); console.log('[página]', m.slice(0, 240)); } });
  w.webContents.on('dom-ready', () => { w.webContents.executeJavaScript(ESPIA).catch(() => {}); });
  const js = (c, limite = 60000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${limite / 1000} s: ${String(c).slice(0, 80)}`)), limite))]);
  const url = path.join(raiz, 'index.html');
  const cargar = async (search) => {
    await w.loadFile(url, { search });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.__bucle').catch(() => false)) return true; }
    return false;
  };
  const cuadros = (n) => js(`(() => { for (let i = 0; i < ${n}; i++) { window.__hojarasca.jugador.actualizar(0.05); window.__hojarasca.__bucle(); } return 1; })()`);
  const tecla = (code, sobre = 'document') => js(`(() => { const o = ${sobre}; o.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(code)}, bubbles: true, cancelable: true })); o.dispatchEvent(new KeyboardEvent('keyup', { code: ${JSON.stringify(code)}, bubbles: true })); return 1; })()`);
  const enLista = (code) => tecla(code, "document.getElementById('bs-lista')");
  // (el cuadro que devuelve capturePage llega un paso tarde: se pide una vez para descartarlo y después la buena)
  const foto = async (nombre) => {
    await esperar(900);
    try { await w.webContents.capturePage(); } catch { /* sigue */ }
    await esperar(700);
    let img = null;
    for (let k = 0; k < 3 && !img; k++) { try { img = await w.webContents.capturePage(); } catch { await esperar(800); } }
    if (img && !img.isEmpty()) { fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG()); console.log(`  (captura ${nombre}.png, ${img.getSize().width}×${img.getSize().height})`); }
    else console.log(`  (sin captura ${nombre}: ventana oculta)`);
  };
  const UI = 'window.__hojarasca.__bancoSonidosUI()';
  const visible = (id) => js(`!document.getElementById('${id}').classList.contains('oculto')`);

  await w.loadURL('about:blank');
  await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
  await cargar('?debug=1');
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: true, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano', volumen: 0.8, volumenAmbiente: 1, volumenEfectos: 1, volumenMusica: 1 })); 1`);
  ok(await cargar('?debug=1'), 'cargó el juego (Relax)');
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3500);
  await cuadros(6);
  ok(await js(`(() => { const S = window.__hojarasca.sonido; return !!S.ctx && S.ctx.state === 'running' && !!S.bus; })()`), 'el motor de audio está andando');
  await js('window.__R.vivos()');
  ok(await js('window.__hojarasca.sonido.relax === true'), 'el Relax tiene los sonidos del Desafío apagados (relax = true)');
  await js(`(() => { const H = window.__hojarasca; H.ajustes.limiteFps = 'libre'; H.progreso.horas = 12; H.sonido.proxAve = 1e9; H.sonido.proxMusica = 1e9; return 1; })()`);   // (el juego, sin pájaros ni música propios: sus fuentes caerían en la ventana de lo que dispara el banco)
  await cuadros(4);

  // ---- lo que no se puede tocar: la partida
  const instantanea = () => js(`(() => { const H = window.__hojarasca; const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k !== 'hojarasca-ajustes-v1') ls[k] = localStorage.getItem(k); } return JSON.stringify({ progreso: H.progreso, ls }); })()`);
  // ---- abrir el banco como el jugador: Escape, clic en «Banco de sonidos»
  await tecla('Escape'); await esperar(1500); await cuadros(3);
  ok(await visible('pausa'), 'la pausa se abre con Escape');
  await esperar(2500); await cuadros(3);
  const antes = await instantanea();   // con la pausa abierta y asentada
  console.log(`  partida antes: progreso de ${antes.length} caracteres`);
  await esperar(3000); await cuadros(3);
  ok((await instantanea()) === antes, 'control: con la pausa quieta la partida no cambia sola');
  ok(await js(`document.getElementById('btn-banco-sonidos').textContent.trim() === 'Banco de sonidos' && document.getElementById('btn-banco').nextElementSibling === document.getElementById('btn-banco-sonidos')`), 'el botón «Banco de sonidos» está en la pausa, junto al «Banco de pruebas»');
  await js(`document.getElementById('btn-banco-sonidos').click(); 1`); await esperar(1200); await cuadros(3);
  ok(await visible('banco-sonidos') && !(await visible('pausa')), 'el clic abre el banco de sonidos y esconde la pausa');
  ok(await js(`document.activeElement === document.getElementById('bs-lista')`), 'la lista toma el foco (el teclado anda sin tocar el mouse)');
  ok(await js(`window.__hojarasca.sonido.relax === false && Object.hasOwn(window.__hojarasca.sonido, 'actualizar')`), 'abierto: el Relax deja sonar al Desafío y `actualizar` está enganchado');
  const N = await js(`${UI}.orden.length`);
  ok(N >= 140, `la lista tiene ${N} sonidos`);
  ok(await js(`document.querySelectorAll('#bs-lista .bs-item').length === ${N} && document.querySelectorAll('#bs-lista .bs-grupo').length >= 17`), 'la lista dibuja todos los sonidos y sus grupos');
  for (let i = 0; i < 400; i++) { const resto = await js('(() => { const S = window.__hojarasca.sonido; S.trabajarCola(60); return S.cola.length; })()'); if (!resto) break; await esperar(15); }
  await cuadros(2); await esperar(400);
  await foto('1-banco-abierto');

  // ---- todo el catálogo, con el teclado
  await enLista('Home'); await esperar(100);
  const grupos = {};
  const malos = [];
  let disparados = 0;
  const BUCLES = { viento: ['gViento', 'gHojas'], lluvia: ['gLluvia', 'gLluviaGrave'], arroyo: ['gArroyo', 'gArroyoMedio'], orilla: ['gOrilla'], cascada: ['gCascada'], fuego: ['gFuego', 'gFuegoMedio'], panal: ['gPanal', 'gPanalTono'], grillos: ['gGrillos'], 'techo-lluvia': ['gTechoCama'] };
  const perillas = (nombres) => js(`${JSON.stringify(nombres)}.map((n) => window.__hojarasca.sonido[n].gain.value)`);
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const e = await js(`(() => { const x = ${UI}.actual(); return { id: x.id, grupo: x.grupo, bus: x.bus, bucle: x.bucle, sinFuentes: x.sinFuentes, nombre: x.nombre }; })()`);
    const esperado = await js(`${UI}.orden[${i}].id`);
    if (e.id !== esperado) { malos.push(`${e.id}: el teclado no llegó al sonido ${i} (${esperado})`); }
    let base = null;
    if (e.bucle) { for (let k = 0; k < 4; k++) { await cuadros(2); await esperar(250); } base = await perillas(BUCLES[e.id] || []); }
    await enLista('Enter');
    // espera a que el banco haya disparado (la primera vez sintetiza lo que falte)
    let u = null;
    for (let k = 0; k < 120; k++) {
      await esperar(60);
      u = await js(`(() => { const s = ${UI}.banco.estado(); const x = s.ultimo; return x && x.id === ${JSON.stringify(e.id)} ? { creadas: x.creadas, preparando: s.preparando, bucles: s.bucles, bus: x.bus, busNombre: x.busNombre } : null; })()`);
      if (u && (u.creadas > 0 || e.bucle || e.sinFuentes) && !u.preparando) break;
    }
    if (!u) { malos.push(`${e.id}: no se disparó`); await enLista('ArrowDown'); continue; }
    disparados++;
    grupos[e.grupo] = (grupos[e.grupo] || 0) + 1;
    if (u.bus !== e.bus) malos.push(`${e.id}: el estado dice el bus ${u.bus} y el catálogo ${e.bus}`);
    if (e.bucle) {
      for (let k = 0; k < 4; k++) { await cuadros(2); await esperar(300); }
      const durante = await perillas(BUCLES[e.id] || []);
      if (!u.bucles.includes(e.id)) malos.push(`${e.id}: el bucle no quedó prendido`);
      if (!durante.some((v, k) => v > base[k] + 0.004)) malos.push(`${e.id}: las perillas del motor no subieron (${base.map((v) => v.toFixed(3))} → ${durante.map((v) => v.toFixed(3))})`);
    } else if (!e.sinFuentes) {
      const r = await js(`window.__R.revisar(${UI}.banco.estado().ultimo)`);
      if (!r.fuentes) malos.push(`${e.id}: no creó fuentes de audio`);
      else {
        if (r.alBus !== r.fuentes) malos.push(`${e.id}: ${r.fuentes - r.alBus} de ${r.fuentes} fuentes no llegan al bus ${e.bus}`);
        if (r.aOtro) malos.push(`${e.id}: ${r.aOtro} fuentes llegan también a otro bus`);
        if (r.aSalida !== r.fuentes) malos.push(`${e.id}: ${r.fuentes - r.aSalida} fuentes no llegan a la salida`);
      }
    }
    // el cartel dice qué suena y por dónde sale
    const cartel = await js(`(() => { ${UI}.pintarEstado(); return document.getElementById('bs-sonando').textContent; })()`);
    if (!cartel.includes(e.nombre) || !cartel.includes(u.busNombre)) malos.push(`${e.id}: el cartel no dice el nombre y el bus («${cartel.slice(0, 80)}»)`);
    if (i === Math.floor(N * 0.45) || (e.id === 'viento')) { /* captura con algo sonando, más abajo */ }
    await enLista('Space'); await esperar(60);
    await enLista('ArrowDown');
  }
  console.log(`  ${disparados} de ${N} sonidos disparados con Enter en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  console.log('  por grupo: ' + Object.entries(grupos).map(([g, n]) => `${g} ${n}`).join(' · '));
  ok(disparados === N, `se disparó todo el catálogo con el teclado (${disparados} de ${N})`);
  ok(malos.length === 0, 'cada sonido crea fuentes, las manda por su bus y llega a la salida' + (malos.length ? ':\n   ' + malos.slice(0, 25).join('\n   ') : ''));

  // ---- los volúmenes del panel son los de verdad
  const ave = async () => {
    await js(`(() => { const U = ${UI}; U.elegir(U.orden.findIndex((e) => e.id === 'ave-zorzal')); return 1; })()`);
    await enLista('Enter'); await esperar(500);
    return js(`(() => { const S = window.__hojarasca.sonido, u = ${UI}.banco.estado().ultimo; return u.id === 'ave-zorzal' ? Math.max(0, ...u.fuentes.map((f) => window.__R.gan(f, S.master))) : -1; })()`);
  };
  const mover = (clave, v) => js(`(() => { const r = document.querySelector('#banco-sonidos [data-ajuste-rango="${clave}"]'); r.value = ${v}; r.dispatchEvent(new Event('input', { bubbles: true })); const H = window.__hojarasca; return JSON.stringify({ ajuste: H.ajustes.${clave}, mezcla: H.sonido.mezcla }); })()`);
  const asentar = async () => { for (let i = 0; i < 5; i++) { await cuadros(3); await esperar(1000); } };
  await enLista('Space'); await asentar();
  const g1 = await ave();
  console.log('  pájaro: ' + (await js(`(() => { const S = window.__hojarasca.sonido, u = ${UI}.banco.estado().ultimo; return JSON.stringify({ id: u.id, bus: S.bus.ambiente.gain.value, master: S.master.gain.value, fuentes: u.fuentes.map((f) => [f.constructor.name, f.buffer ? +f.buffer.duration.toFixed(2) : null, +window.__R.gan(f, S.master).toFixed(4)]), pilas: u.fuentes.filter((f) => window.__R.gan(f, S.master) > 0.5).slice(0, 3).map((f) => f.__pila) }); })()`)));
  ok(g1 > 0, `con todo al máximo el pájaro llega a la salida (${g1.toFixed(4)})`);
  const m0 = JSON.parse(await mover('volumenAmbiente', 0));
  ok(m0.ajuste === 0 && m0.mezcla.ambiente === 0, 'el volumen «El bosque» del panel mueve el ajuste real y la mezcla del motor');
  await asentar();
  const g0 = await ave();
  ok(g0 < g1 * 0.02, `con «El bosque» en 0 el pájaro no suena (${g0.toExponential(1)} contra ${g1.toFixed(4)})`);
  await mover('volumenAmbiente', 1); await asentar();
  // (la campana: su ganancia es pareja mientras suena; la de un golpe corto ya cayó a cero cuando se mide)
  const efecto = async () => {
    await js(`(() => { const U = ${UI}; U.elegir(U.orden.findIndex((e) => e.id === 'campana-tanido')); return 1; })()`);
    await enLista('Enter'); await esperar(600);
    const v = await js(`(() => { const S = window.__hojarasca.sonido, u = ${UI}.banco.estado().ultimo; return u.id === 'campana-tanido' ? Math.max(0, ...u.fuentes.map((f) => window.__R.gan(f, S.master))) : -1; })()`);
    await enLista('Space'); await esperar(300);
    return v;
  };
  const e1 = await efecto();
  await mover('volumenEfectos', 0); await asentar();
  const e0 = await efecto();
  ok(e1 > 0 && e0 < e1 * 0.02, `con «Efectos» en 0 la campana no suena (${e0.toExponential(1)} contra ${e1.toFixed(4)})`);
  await mover('volumenEfectos', 1); await asentar();
  // la música: la gramola al máximo y a la mitad
  const gramola = async () => {
    await js(`(() => { const U = ${UI}; U.elegir(U.orden.findIndex((e) => e.id === 'gramola')); return 1; })()`);
    await enLista('Enter'); await esperar(900);
    const v = await js(`(() => { const S = window.__hojarasca.sonido, u = ${UI}.banco.estado().ultimo; return Math.max(0, ...u.fuentes.map((f) => window.__R.gan(f, S.master))); })()`);
    await enLista('Space'); await esperar(600);
    return v;
  };
  const gm1 = await gramola();
  await mover('volumenMusica', 0.5); await asentar();
  const gm5 = await gramola();
  await mover('volumenMusica', 0); await asentar();
  const gm0 = await gramola();
  ok(gm1 > 0 && Math.abs(gm5 / gm1 - 0.5) < 0.08, `con «Música» a la mitad la gramola baja a la mitad (${(gm5 / gm1).toFixed(3)})`);
  ok(gm0 < gm1 * 0.02, `con «Música» en 0 la gramola no se oye (${gm0.toExponential(1)})`);
  await mover('volumenMusica', 1); await asentar();
  ok(await js(`document.querySelector('#banco-sonidos [data-ajuste-rango="volumen"]') !== null && document.querySelector('#banco-sonidos [data-ajuste="musica"]') !== null`), 'el panel también tiene el volumen general y «Con piano / Solo el bosque»');

  // ---- una captura con cosas sonando, otra en el medio de la lista
  await js(`(() => { const U = ${UI}; U.elegir(U.orden.findIndex((e) => e.id === 'lluvia')); return 1; })()`);
  await enLista('Enter'); await esperar(300);
  await js(`(() => { const U = ${UI}; U.elegir(U.orden.findIndex((e) => e.id === 'techo-lluvia')); U.poner('distancia', 'media'); return 1; })()`);
  await enLista('ArrowRight');
  await enLista('Enter');
  for (let k = 0; k < 3; k++) { await cuadros(2); await esperar(300); }
  await foto('2-lluvia-sonando');
  await enLista('Space'); await esperar(300);
  await js(`(() => { const U = ${UI}; U.elegir(U.orden.findIndex((e) => e.id === 'martillo-anselmo')); U.poner('distancia', 'lejos'); U.poner('lado', 'derecha'); return 1; })()`);
  await enLista('Enter'); await esperar(400);
  await foto('3-aliados-martillo');
  await enLista('Space'); await esperar(200);
  await js(`(() => { const U = ${UI}; U.elegir(U.orden.findIndex((e) => e.id === 'gramola')); return 1; })()`);
  await foto('4-gramola-elegida');

  // ---- «Detener todo»
  await js(`(() => { const U = ${UI}; U.poner('distancia', 'cerca'); U.poner('lado', 'frente'); return 1; })()`);
  const arrancar = async (id, variante) => {
    await js(`(() => { const U = ${UI}; U.elegir(U.orden.findIndex((e) => e.id === '${id}')); ${variante ? `const s = document.getElementById('bs-variante'); s.value = '${variante}'; s.dispatchEvent(new Event('change'));` : ''} return 1; })()`);
    await enLista('Enter'); await esperar(500);
  };
  await arrancar('arbol-cae', '2.5'); await arrancar('viento'); await arrancar('gramola', 'vals'); await arrancar('radio-tango'); await arrancar('campana-tanido');
  const vivo = await js(`${UI}.banco.estado()`);
  ok(vivo.sonando && vivo.bucles.includes('viento') && vivo.gramola && vivo.emisoras === 1, `sonando todo junto: ${vivo.fuentesVivas} fuentes, bucles ${vivo.bucles}, gramola ${vivo.gramola}, radio ${vivo.emisoras}`);
  const fuentesPrevias = await js(`(() => { const U = ${UI}; return 1; })()`);
  await enLista('Space'); await esperar(500); await cuadros(2);
  const corto = await js(`${UI}.banco.estado()`);
  ok(!corto.sonando && corto.fuentesVivas === 0 && !corto.gramola && corto.emisoras === 0 && corto.bucles.length === 0, `Espacio detiene todo: fuentes ${corto.fuentesVivas}, gramola ${corto.gramola}, radio ${corto.emisoras}, bucles ${corto.bucles}`);
  ok(await js(`(() => { const S = window.__hojarasca.sonido; return S.master.gain.value > 0.5; })()`), 'y la salida general vuelve a su volumen (no queda en silencio)');
  ok(/detenido|Todo detenido/i.test(await js(`document.getElementById('bs-sonando').textContent`)), 'el cartel lo dice');
  await foto('5-detenido');
  // una ventana más chica (una notebook de 1366×768 deja unos 1280×650 útiles): el panel tiene que seguir entero
  w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: 1280, height: 650 }, viewPosition: { x: 0, y: 0 }, viewSize: { width: 1280, height: 650 }, deviceScaleFactor: 0, scale: 1 });
  await esperar(1500); await cuadros(3);
  await js(`(() => { const U = ${UI}; U.elegir(U.orden.findIndex((e) => e.id === 'techo-lluvia')); return 1; })()`);
  await enLista('Enter'); await esperar(500);
  await foto('6-banco-1280x650');
  const cabe = await js(`(() => { const p = document.querySelector('#banco-sonidos .panel-modal'); const r = p.getBoundingClientRect(); return { alto: Math.round(r.height), ventana: window.innerHeight, scroll: p.scrollHeight > p.clientHeight + 1, ayuda: (() => { const a = document.querySelector('#banco-sonidos .seguir').getBoundingClientRect(); return Math.round(a.bottom); })() }; })()`);
  ok(!cabe.scroll && cabe.ayuda <= cabe.ventana, `en una ventana de 1280×650 el panel entra entero, con su ayuda al pie (${JSON.stringify(cabe)})`);
  await enLista('Space');
  w.webContents.disableDeviceEmulation(); await esperar(1000); await cuadros(3);

  // ---- Escape: vuelve a la pausa y deja todo como estaba
  await mover('volumenAmbiente', 0.35);   // un volumen movido en el banco se ve en la pausa al volver
  await arrancar('lluvia'); await arrancar('gramola', 'polca');
  await tecla('Escape'); await esperar(1500); await cuadros(3);
  const despues = await instantanea();   // con la pausa abierta otra vez, antes de volver al juego
  ok(!(await visible('banco-sonidos')) && (await visible('pausa')), 'Escape cierra el banco y vuelve a la pausa');
  ok(await js(`(() => { const S = window.__hojarasca.sonido; return S.relax === true && !Object.hasOwn(S, 'actualizar') && !Object.hasOwn(S.ctx, 'createBufferSource') && !Object.hasOwn(S.ctx, 'createOscillator'); })()`), 'cerrado: el Relax, `actualizar` y el contexto de audio quedan como estaban');
  const cerrado = await js(`${UI}.banco.estado()`);
  ok(!cerrado.sonando && cerrado.bucles.length === 0 && !cerrado.gramola, 'cerrado no queda nada sonando (ni la lluvia ni la gramola)');
  ok(await js(`[...document.querySelectorAll('[data-ajuste-rango="volumenAmbiente"]')].every((r) => Math.abs(Number(r.value) - 0.35) < 1e-9) && Math.abs(window.__hojarasca.ajustes.volumenAmbiente - 0.35) < 1e-9`), 'el volumen movido en el banco se ve en Ajustes de la pausa (es el mismo, no una copia)');
  // se puede volver a abrir
  await js(`document.getElementById('btn-banco-sonidos').click(); 1`); await esperar(800);
  ok(await visible('banco-sonidos'), 'se vuelve a abrir');
  ok(await js(`Math.abs(Number(document.querySelector('#banco-sonidos [data-ajuste-rango="volumenAmbiente"]').value) - 0.35) < 1e-9`), 'y el panel muestra el volumen que quedó');
  await mover('volumenAmbiente', 1);
  await tecla('Escape'); await esperar(700);
  await tecla('Escape'); await esperar(900); await cuadros(3);
  ok(!(await visible('pausa')), 'otro Escape vuelve al juego');
  ok(await js(`window.__hojarasca.sonido.relax === true`), 'en el juego sigue el Relax');

  // ---- la partida
  ok(despues === antes, 'la partida quedó intacta: el progreso y el almacenamiento (menos los volúmenes) son los mismos' + (despues === antes ? '' : ' (distinto)'));
  if (despues !== antes) {
    const a = JSON.parse(antes), d = JSON.parse(despues);
    for (const k of Object.keys(a.progreso)) if (JSON.stringify(a.progreso[k]) !== JSON.stringify(d.progreso[k])) console.log(`   cambió progreso.${k}: ${JSON.stringify(a.progreso[k]).slice(0, 100)} → ${JSON.stringify(d.progreso[k]).slice(0, 100)}`);
    for (const k of new Set([...Object.keys(a.ls), ...Object.keys(d.ls)])) if (a.ls[k] !== d.ls[k]) console.log(`   cambió localStorage.${k}`);
  }
  ok(errores.length === 0, 'la consola quedó sin errores' + (errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''));
  console.log(fallas ? `\nFALLARON ${fallas} comprobaciones` : '\nTodo en orden (se midieron los buses; no se pudo escuchar nada).');
  salir(fallas ? 1 : 0);
});
