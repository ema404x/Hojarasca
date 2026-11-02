// 4.18.4 (C): corrida larga con el tiempo acelerado en la Historia (Electron + WebGL real, ventana visible, el bucle y los cuadros de verdad: requestAnimationFrame sin tocar).
// Durante LARGO_MINUTOS (20 por defecto) un jugador recorre el valle a los saltos (lugares con nombre y puntos de la Historia), pasa las horas y los días (día y noche, las tres
// estaciones), cambia de capítulo con el código «historia capitulo N» y deja que las escenas se disparen solas donde corresponda (las lee con Enter, contesta las preguntas al azar,
// contesta las tarjetas), pasa la noche de la nevada, guarda y mira. Cada CADA segundos (con un GC forzado) anota: fps medio del tramo, memoria JS, geometrías, texturas y programas de
// three, nodos del DOM, la escena que corre y el capítulo. Al final: la pendiente por hora de cada cosa en la segunda mitad (lo que sólo crece), los programas (base 111: sólo se avisa) y los errores.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-18-4-largo.cjs -Espera 2400 -Perfil <carpeta propia> -Visible
//   LARGO_MINUTOS=20 · LARGO_CADA=30 · LARGO_SALIDA=<archivo jsonl> · LARGO_SEMILLA=n
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('enable-precise-memory-info');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const MINUTOS = Number(process.env.LARGO_MINUTOS || 20);
const CADA = Number(process.env.LARGO_CADA || 30) * 1000;
const SALIDA = process.env.LARGO_SALIDA || path.join(process.env.TEMP || raiz, 'largo-4-18-4.jsonl');
let s = Number(process.env.LARGO_SEMILLA || 4184) >>> 0;
const azar = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };
setTimeout(() => { console.log('ERROR: la prueba tardó de más'); try { app.exit(2); } catch { process.exit(2); } }, (MINUTOS + 12) * 60 * 1000).unref?.();

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, P = H.progreso;
  const L = window.__L = { cuadros: 0, t0: performance.now(), escenas: [], tarjetas: 0, saltos: 0, malas: [] };
  const raf = () => { L.cuadros++; requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  const dir = () => H.__escenas.director;
  L.muestra = () => {
    if (window.gc) window.gc();
    const ahora = performance.now(), seg = (ahora - L.t0) / 1000, fps = L.cuadros / Math.max(0.001, seg);
    L.cuadros = 0; L.t0 = ahora;
    const m = performance.memory || {};
    return { fps: +fps.toFixed(1), heapMB: +((m.usedJSHeapSize || 0) / 1048576).toFixed(1), geo: H.renderer.info.memory.geometries, tex: H.renderer.info.memory.textures, prog: H.renderer.info.programs.length,
      dom: document.getElementsByTagName('*').length, escena: H.__escenas.activa() ? dir().idActual() : null, cap: P.historia.capitulo + 1, fase: P.historia.fase, dia: P.dia, horas: +P.horas.toFixed(1),
      escenasVistas: Object.keys(P.historia.escenas.vistas).length, modo: H.__caidas.modo(), fallas: H.__caidas.fallas().length, ult: L.ult || null, noche: !!(H.__noche && H.__noche() && H.__noche().activa()), arreo: !!(H.__arreo && H.__arreo() && H.__arreo().activo && H.__arreo().activo()), obj: H.objetos && H.objetos.obras ? H.objetos.obras.length : null };
  };
  L.malas = () => {
    const mal = [], js = H.jugador.estado, p = js.pos;
    if (![p.x, p.y, p.z, js.yaw, js.pitch].every(Number.isFinite)) mal.push('jugador no finito');
    else if (!js.enTren && !js.nadando && !js.enKayak && !js.enVela && p.y < T.altura(p.x, p.z) - 1.5) mal.push('jugador bajo el suelo ' + (p.y - T.altura(p.x, p.z)).toFixed(2));
    if (!Number.isFinite(P.horas) || !Number.isFinite(P.dia)) mal.push('hora o día no finitos');
    for (const [k, n] of Object.entries(P.materiales || {})) if (!Number.isFinite(n) || n < 0) mal.push('material ' + k + ' = ' + n);
    if (!Number.isFinite(P.ramitas) || P.ramitas < 0) mal.push('ramitas = ' + P.ramitas);
    for (const [k, n] of Object.entries(P.historia.lazos || {})) if (!Number.isFinite(n) || n < -2 || n > 3) mal.push('lazo ' + k + ' = ' + n);
    const fal = H.__caidas.fallas(); if (fal.length) mal.push('fallas de sistema: ' + JSON.stringify(fal).slice(0, 160));
    return mal;
  };
  // un paso del jugador: a los saltos por el valle, pasa horas y días, contesta lo que salga
  L.lugares = () => { const o = H.__puntosHistoria(), q = [], l = T.lugares; for (const k of Object.keys(o)) if (o[k] && Number.isFinite(o[k].x)) q.push([k, o[k].x, o[k].z]); for (const k of Object.keys(l)) if (l[k] && Number.isFinite(l[k].x)) q.push([k, l[k].x, l[k].z]); return q; };
  L.ir = (i) => { const q = L.lugares(); if (!q.length) return 'nada'; const [k, x, z] = q[i % q.length]; const a = (i * 2.399) % 6.283; if (H.jugador.estado.enKayak || H.jugador.estado.enTren || H.jugador.estado.montado) return 'en vehículo'; H.jugador.ubicar(x + Math.cos(a) * 4, z + Math.sin(a) * 4, a); L.saltos++; L.ult = k; return k; };
  L.avanzarTiempo = (horas) => { P.horas += horas; while (P.horas >= 24) { P.horas -= 24; P.dia += 1; } return 1; };
  L.atender = () => {
    const d = dir();
    if (H.__escenas.activa()) {
      const dat = d.datos();
      if (dat && dat.eleccion) { if (d.eleccionLista()) d.elegir(Math.floor(Math.random() * dat.eleccion.opciones.length)); }
      else if (dat && dat.dialogo) d.avanzar();
      if (!L.escenas.includes(d.idActual())) L.escenas.push(d.idActual());
      return 'escena';
    }
    const v = document.getElementById('valle-tarjeta');
    if (v && !v.classList.contains('oculto')) {
      const bs = [...v.querySelectorAll('button[data-valle-opcion]')];
      const e = bs.find((b) => b.dataset.valleOpcion === 'empezar') || bs.find((b) => b.dataset.valleOpcion === 'seguir') || bs[Math.floor(Math.random() * bs.length)];
      if (e) { e.click(); L.tarjetas++; }
      return 'tarjeta';
    }
    if (H.__noche() && H.__noche().activa()) { const s = H.__noche().sim; if (s && Math.random() < 0.02) s.t += 30; return 'noche'; }
    return null;
  };
  L.truco = (txt) => { const t = H.__trucos(); t.abrir(); const r = t.ejecutar(txt); t.cerrar(); return r; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const consola = [], problemas = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  let donde = 'carga';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push({ en: donde, m: m.slice(0, 300) }); console.log('  ✗ consola [' + donde + ']: ' + m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => { console.log('PROCESO DE LA PÁGINA CAÍDO en ' + donde + ':', JSON.stringify(d)); problemas.push('el proceso de la página se cayó: ' + JSON.stringify(d)); });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 90 s (${donde})`)), 90000))]);
  const L = (c) => js(`(async () => { const H = window.__hojarasca, L = window.__L, P = H.progreso; return (${c}); })()`);
  const url = path.join(raiz, 'index.html');
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false, estacion:'auto'})); 1`;
  fs.writeFileSync(SALIDA, '');
  try {
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes); await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0, listo = false; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js('window.__sinPausaPorBlur = true; 1');
    await js(PAGINA);
    await esperar(4000);
    const muestras = [];
    const t0 = Date.now(), fin = t0 + MINUTOS * 60000;
    let ultimaMuestra = t0, paso = 0, capitulo = 0, ultimoCapitulo = Date.now(), ultimoSalto = 0, ultimaHora = 0, ultimoGuardar = Date.now();
    if (process.env.LARGO_CAP) { const r0 = await L(`L.truco('historia capitulo ${Number(process.env.LARGO_CAP)}')`); console.log('  arranca en el capítulo ' + process.env.LARGO_CAP + ' → ' + String(JSON.stringify((r0 && r0.texto) || r0 || '')).slice(0, 80)); capitulo = Number(process.env.LARGO_CAP); ultimoCapitulo = Date.now() + 99999999; }
    const base = await L('L.muestra()');
    console.log(`inicio: ${JSON.stringify(base)}`);
    muestras.push({ t: 0, ...base });
    fs.appendFileSync(SALIDA, JSON.stringify({ t: 0, ...base }) + '\n');
    while (Date.now() < fin) {
      donde = `paso ${paso}`;
      const q = await L('L.atender()');
      const ahora = Date.now();
      if (!q) {
        if (ahora - ultimoSalto > 3500) { ultimoSalto = ahora; const k = await L(`L.ir(${paso})`); paso++; if (paso % 8 === 0) console.log(`  salto ${paso}: ${k}`); }
        if (ahora - ultimaHora > 2500) { ultimaHora = ahora; await L('L.avanzarTiempo(' + (0.5 + azar() * 2.5).toFixed(2) + ')'); }
        // cada 100 s, un capítulo nuevo con el código (con lo de antes dado por hecho)
        if (ahora - ultimoCapitulo > 100000) { ultimoCapitulo = ahora; capitulo = (capitulo % 13) + 1; const r = await L(`L.truco('historia capitulo ${capitulo}')`); console.log(`  código «historia capitulo ${capitulo}» → ${String(JSON.stringify((r && r.texto) || r || "")).slice(0, 100)}`); }
        if (ahora - ultimoGuardar > 45000) { ultimoGuardar = ahora; await L('H.guardar()'); }
      }
      const mal = await L('L.malas()'); for (const m of mal) { const k = `[${donde}] ${m}`; if (!problemas.includes(k)) { problemas.push(k); console.log('  ✗ ' + k); } }
      if (ahora - ultimaMuestra >= CADA) {
        ultimaMuestra = ahora;
        const m = await L('L.muestra()'); const reg = { t: Math.round((ahora - t0) / 1000), ...m };
        muestras.push(reg); fs.appendFileSync(SALIDA, JSON.stringify(reg) + '\n');
        console.log(`  t ${reg.t} s · fps ${m.fps} · heap ${m.heapMB} MB · geo ${m.geo} · tex ${m.tex} · prog ${m.prog} · dom ${m.dom} · cap ${m.cap}${m.escena ? ' · escena ' + m.escena : ''} · día ${m.dia} ${m.horas} h`);
      }
      await esperar(120);
    }
    // resumen: valor al inicio, a la mitad y al final, y pendiente por hora en la segunda mitad
    const pend = (k) => { const b = muestras.slice(Math.floor(muestras.length / 2)); if (b.length < 3) return 0; const n = b.length, mx = b.reduce((a, x) => a + x.t, 0) / n, my = b.reduce((a, x) => a + x[k], 0) / n; let num = 0, den = 0; for (const x of b) { num += (x.t - mx) * (x[k] - my); den += (x.t - mx) ** 2; } return den ? num / den * 3600 : 0; };
    const prim = muestras[0], ult = muestras[muestras.length - 1], med = muestras[Math.floor(muestras.length / 2)];
    console.log('\nresumen (inicio · mitad · final · pendiente por hora en la segunda mitad):');
    for (const k of ['fps', 'heapMB', 'geo', 'tex', 'prog', 'dom']) console.log(`  ${k}: ${prim[k]} · ${med[k]} · ${ult[k]} · ${pend(k).toFixed(1)}/h`);
    const fps = muestras.slice(1).map((x) => x.fps); console.log(`  fps mínimo ${Math.min(...fps)}, medio ${(fps.reduce((a, b) => a + b, 0) / fps.length).toFixed(1)}`);
    const escenas = await L('L.escenas'); const stats = await L('({ saltos: L.saltos, tarjetas: L.tarjetas, vistas: Object.keys(P.historia.escenas.vistas).length })');
    console.log(`  escenas vistas durante la corrida (disparadas solas): ${escenas.length}: ${escenas.join(', ')}`);
    console.log(`  saltos de lugar ${stats.saltos} · tarjetas contestadas ${stats.tarjetas} · escenas marcadas en la partida ${stats.vistas}`);
    if (ult.prog !== prim.prog) console.log(`  (programas de shader: ${prim.prog} → ${ult.prog}: se avisa, no es un bug a arreglar acá; base 111)`);
  } catch (e) { console.log('ERROR:', e && e.stack || e); problemas.push('excepción: ' + (e && e.message)); }
  console.log(`\nerrores de consola: ${consola.length} · problemas: ${problemas.length}`);
  for (const p of problemas.slice(0, 20)) console.log('  ' + p);
  try { app.exit(problemas.length || consola.length ? 1 : 0); } catch { process.exit(1); }
});
