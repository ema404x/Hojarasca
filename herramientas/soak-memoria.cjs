// 3.5.1: soak de memoria. Juega de verdad (Relax y Desafío) muchas vueltas y mide qué crece:
// heap de JS (tras un GC), geometrías/texturas/programas de three, objetos de la escena, nodos del
// DOM y oyentes (CDP), nodos de audio y lienzos vivos (contados con FinalizationRegistry), y la
// memoria de los procesos de la página y de la placa (app.getAppMetrics). Una línea por muestra
// en <SALIDA>/muestras.jsonl. Perfil propio en <SALIDA>/perfil.
// Uso: npx electron herramientas/soak-memoria.cjs   con PROY=. SALIDA=<carpeta> CICLOS=20
//   MODOS=relax,desafio · SOLO=fotoP,paneles (sólo esas actividades) · CADA_ACT=1 (muestra por
//   actividad) · SNAP=4 (heap snapshots al empezar la vuelta 4 y al final) · PRELOAD_REAL=1 (el
//   preload del juego, con el proceso principal simulado) · REAL_LOOP=1 (ventana offscreen: corre
//   el bucle de verdad con requestAnimationFrame, límite auto y calidad automática).
const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const PROY = path.resolve(process.env.PROY || '.');
const SALIDA = path.resolve(process.env.SALIDA || './soak-salida');
const CICLOS = Number(process.env.CICLOS || 6);
const MODOS = (process.env.MODOS || 'relax,desafio').split(',');
const SOLO = process.env.SOLO ? process.env.SOLO.split(',') : null;   // actividades a correr
const SNAP = process.env.SNAP || '';   // 'antes,despues' de un ciclo: heap snapshots
fs.mkdirSync(SALIDA, { recursive: true });
app.setPath('userData', path.join(SALIDA, 'perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('enable-precise-memory-info');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const _log = console.log; console.log = (...a) => { _log(...a); try { fs.appendFileSync(path.join(SALIDA, 'log.txt'), a.join(' ') + '\n'); } catch {} };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let s = 12345;
const azar = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };

// Lo que se inyecta antes que el juego: cuenta nodos de audio y lienzos vivos (con
// FinalizationRegistry: después de un GC, lo que sigue vivo) y los addEventListener por tipo.
const INSTRUMENTO = `(() => {
  const V = { audio: 0, audioTot: 0, canvas: 0, canvasTot: 0, offscreen: 0, offscreenTot: 0, lis: {}, porTipo: {} };
  const fr = new FinalizationRegistry((k) => { V[k]--; if (k === 'audio') {} });
  const frT = new FinalizationRegistry((t) => { V.porTipo[t]--; });
  const reg = (o, k, t) => { if (!o) return o; V[k]++; V[k + 'Tot']++; fr.register(o, k); if (t) { V.porTipo[t] = (V.porTipo[t] || 0) + 1; frT.register(o, t); } return o; };
  const BAC = window.BaseAudioContext && BaseAudioContext.prototype;
  if (BAC) for (const n of Object.getOwnPropertyNames(BAC)) {
    if (!/^create/.test(n) || n === 'createBuffer' || n === 'createPeriodicWave') continue;
    const d = Object.getOwnPropertyDescriptor(BAC, n); if (!d || typeof d.value !== 'function') continue;
    const o = d.value; BAC[n] = function (...a) { return reg(o.apply(this, a), 'audio', n.slice(6)); };
  }
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, ...r) { const e = ce.call(this, t, ...r); if (String(t).toLowerCase() === 'canvas') reg(e, 'canvas', 'lienzo'); return e; };
  if (window.OffscreenCanvas) { const OC = window.OffscreenCanvas; window.OffscreenCanvas = function (w, h) { return reg(new OC(w, h), 'offscreen'); }; window.OffscreenCanvas.prototype = OC.prototype; }
  const ael = EventTarget.prototype.addEventListener, rel = EventTarget.prototype.removeEventListener;
  const clave = (t, ty) => (t === window ? 'window' : t === document ? 'document' : (t && t.constructor && t.constructor.name) || '?') + ':' + ty;
  EventTarget.prototype.addEventListener = function (ty, f, o) { const k = clave(this, ty); V.lis[k] = (V.lis[k] || 0) + 1; return ael.call(this, ty, f, o); };
  EventTarget.prototype.removeEventListener = function (ty, f, o) { const k = clave(this, ty); V.lis[k] = (V.lis[k] || 0) - 1; return rel.call(this, ty, f, o); };
  window.__vivos = V;
})();`;

app.whenReady().then(async () => {
  session.defaultSession.on('will-download', (_e, item) => { item.setSavePath(path.join(SALIDA, 'bajadas', item.getFilename())); });
  // el instrumento entra por un preload en el mundo de la página (antes que el juego)
  const pre = path.join(SALIDA, 'instrumento-preload.js');
  fs.writeFileSync(pre, `const { webFrame } = require('electron'); webFrame.executeJavaScript(${JSON.stringify(INSTRUMENTO)});` + (process.env.PRELOAD_REAL ? `
require(${JSON.stringify(path.join(PROY, 'preload.cjs'))});` : ''));
  // lo mínimo del proceso principal del juego que usa el preload (las fotos se tiran)
  if (process.env.PRELOAD_REAL) { ipcMain.handle('guardar-foto', (_e, datos, nombre) => { fs.writeFileSync(path.join(SALIDA, 'ultima-foto.txt'), String(nombre) + ' ' + String(datos).length); return path.join(SALIDA, nombre); }); ipcMain.handle('pantalla-refresco', () => 60); ipcMain.handle('app-version', () => '3.5.1'); ipcMain.handle('app-platform', () => process.platform); ipcMain.handle('steam-disponible', () => false); ipcMain.handle('steam-logro', () => false); ipcMain.handle('graficos-fallaron', () => false); for (const k of ['sync-carpeta', 'sync-elegir', 'sync-olvidar', 'sync-escribir', 'sync-leer', 'torneo-leer', 'torneo-escribir']) ipcMain.handle(k, () => null); ipcMain.on('sync-escribir-ya', (e) => { e.returnValue = null; }); ipcMain.on('reportar-error', (_e, d) => console.log('  reportar-error ' + String(d).slice(0, 200))); }
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false, preload: process.env.SIN_INSTRUMENTO ? undefined : pre, sandbox: false, contextIsolation: true, offscreen: !!process.env.REAL_LOOP } });
  if (process.env.REAL_LOOP) { w.webContents.setFrameRate(60); w.webContents.on('paint', () => {}); }
  const errores = [];
  let donde = 'carga';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon/.test(m)) { errores.push(`[${donde}] ${m.slice(0, 300)}`); console.log('  consola: ' + m.slice(0, 200)); }
  });
  let caido = false;
  w.webContents.on('render-process-gone', (_e, d) => { caido = true; console.log('!!! renderer caído', JSON.stringify(d)); errores.push('renderer caído ' + JSON.stringify(d)); });
  const dbg = w.webContents.debugger;
  dbg.attach('1.3');
  console.log('  arranca');
  const js = (c, lim = 180000) => Promise.race([w.webContents.executeJavaScript(c, true),
    new Promise((_, no) => setTimeout(() => no(new Error('sin respuesta en ' + donde)), lim))]);
  const H = 'window.__hojarasca';
  const url = path.join(PROY, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca', 5000).catch((e) => { if (i % 10 === 0) console.log('  esperando ' + e.message); return false; })) break; if (i % 15 === 14) console.log('  cargando ' + i + 's ' + await js(`document.getElementById('carga-texto')?.textContent || document.title`, 5000).catch(() => '?')); }
    console.log('  cargado, entrando'); await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500); console.log('  adentro');
    await js(`(async()=>{ const H=${H}; H.ajustes.limiteFps = ${process.env.REAL_LOOP ? 1 : 0} ? 'auto' : 'libre'; const s = H.sonido; try { if (!s.ctx) s.iniciar?.(); await s.ctx?.resume?.(); } catch {} return 1 })()`);
  };
  const cargar = async (modo) => {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${process.env.CALIDAD || 'media'}', clima:'variable', musica:true, modo:'${modo}', autoCalidad:${process.env.REAL_LOOP ? 'true' : 'false'}, guiaPrimerDia:false, limiteFps:'${process.env.REAL_LOOP ? 'auto' : 'libre'}'})); 1`);
    await abrir(); await entrar();
  };
  const tecla = (c, extra = '') => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{code:'${c}',bubbles:true${extra}})); document.dispatchEvent(new KeyboardEvent('keyup',{code:'${c}',bubbles:true})); return 1 })()`);
  const bajar = (c) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${c}',bubbles:true})); 1`);
  const subir = (c) => js(`document.dispatchEvent(new KeyboardEvent('keyup',{code:'${c}',bubbles:true})); 1`);
  let cuadrosTot = 0;
  const cuadros = async (n) => { cuadrosTot += n; if (process.env.REAL_LOOP) return esperar(n * 17); return js(`(async ()=>{ const H = ${H}; for (let i = 0; i < ${n}; i++) { H.__bucle(); if (i % 4 === 3) await new Promise(r => setTimeout(r, 0)); } return 1 })()`); };
  const volver = () => js(`(()=>{ const H=${H}; try { H.volverAlJuego(); } catch {} return 1 })()`);

  // ------------------------------------------------------------ la muestra
  const gc = async () => { for (let i = 0; i < 3; i++) { await dbg.sendCommand('HeapProfiler.collectGarbage'); await esperar(150); } };
  const t0 = Date.now();
  const muestras = [];
  const muestra = async (etiqueta, modo, ciclo) => {
    await gc();
    const p = await js(`(()=>{ const H = ${H}, R = H.renderer; let obj = 0; H.escena.traverse(() => obj++);
      const V = window.__vivos || {}; const lis = Object.entries(V.lis || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 12);
      let notas = document.getElementById('notas')?.childElementCount ?? -1;
      return { heap: performance.memory.usedJSHeapSize, heapTot: performance.memory.totalJSHeapSize, geo: R.info.memory.geometries, tex: R.info.memory.textures,
        prog: R.info.programs ? R.info.programs.length : -1, fr: R.info.render.frame, cal: H.ajustes.calidad, obj, dom: document.getElementsByTagName('*').length, notas,
        audio: V.audio, audioTot: V.audioTot, canvas: V.canvas, canvasTot: V.canvasTot, porTipo: V.porTipo, lis,
        aliens: H.desafio?.aliens?.length ?? null, horas: +H.progreso.horas.toFixed(2), dia: H.progreso.dia } })()`);
    const dc = await dbg.sendCommand('Memory.getDOMCounters').catch(() => ({})); const hu = await dbg.sendCommand('Runtime.getHeapUsage').catch(() => ({}));
    const pidR = w.webContents.getOSProcessId();
    const met = app.getAppMetrics();
    const r = met.find((m) => m.pid === pidR), g = met.find((m) => m.type === 'GPU');
    const m = { t: Math.round((Date.now() - t0) / 1000), etiqueta, modo, ciclo, cuadros: cuadrosTot,
      heapMB: +(p.heap / 1048576).toFixed(1), heapTotMB: +(p.heapTot / 1048576).toFixed(1), geo: p.geo, tex: p.tex, prog: p.prog, obj: p.obj,
      dom: p.dom, domNodos: dc.nodes, docs: dc.documents, listeners: dc.jsEventListeners, notas: p.notas,
      audio: p.audio, audioTot: p.audioTot, canvas: p.canvas, canvasTot: p.canvasTot,
      rWS: r ? Math.round(r.memory.workingSetSize / 1024) : null, rPriv: r ? Math.round((r.memory.privateBytes || 0) / 1024) : null,
      gWS: g ? Math.round(g.memory.workingSetSize / 1024) : null, gPriv: g ? Math.round((g.memory.privateBytes || 0) / 1024) : null,
      extMB: hu.backingStorageSize != null ? +(hu.backingStorageSize / 1048576).toFixed(1) : null, embMB: hu.embedderHeapUsedSize != null ? +(hu.embedderHeapUsedSize / 1048576).toFixed(1) : null, fr: p.fr, cal: p.cal, aliens: p.aliens, dia: p.dia, horas: p.horas, porTipo: p.porTipo, lis: p.lis };
    muestras.push(m);
    fs.appendFileSync(path.join(SALIDA, 'muestras.jsonl'), JSON.stringify(m) + '\n');
    console.log(`${String(m.t).padStart(5)}s ${modo.padEnd(7)} c${ciclo} ${etiqueta.padEnd(12)} heap ${String(m.heapMB).padStart(6)} geo ${String(m.geo).padStart(5)} tex ${String(m.tex).padStart(4)} prog ${String(m.prog).padStart(3)} obj ${String(m.obj).padStart(6)} dom ${String(m.domNodos).padStart(6)} lis ${String(m.listeners).padStart(5)} audio ${String(m.audio).padStart(5)} canvas ${String(m.canvas).padStart(4)} rWS ${m.rWS} gWS ${m.gWS}`);
    return m;
  };
  const snapshot = async (nombre) => {
    const partes = [];
    const f = (_e, metodo, params) => { if (metodo === 'HeapProfiler.addHeapSnapshotChunk') partes.push(params.chunk); };
    dbg.on('message', f);
    await gc();
    await dbg.sendCommand('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
    dbg.removeListener('message', f);
    fs.writeFileSync(path.join(SALIDA, nombre + '.heapsnapshot'), partes.join(''));
    console.log('  snapshot ' + nombre);
  };

  // ------------------------------------------------------------ actividades
  const A = {};
  A.caminar = async () => {
    for (let k = 0; k < 6; k++) {
      await js(`(()=>{ const H=${H}, js=H.jugador.estado; if (js.enKayak||js.enTren||js.montado) return 0; const a=${azar()}*6.283, d=${azar()}; H.jugador.ubicar(Math.cos(a)*420*d, Math.sin(a)*420*d, a); return 1 })()`);
      await bajar('KeyW'); if (k % 2) await bajar('ShiftLeft');
      for (let i = 0; i < 4; i++) { await js(`${H}.jugador.estado.yaw += ${(azar() - 0.5) * 1.5}; 1`); await cuadros(25); }
      await subir('KeyW'); await subir('ShiftLeft');
    }
  };
  A.horaClima = async () => {
    const climas = [['despejado', 0, 0.1], ['nublado', 0, 0.7], ['lluvia', 1, 0.95], ['tormenta', 1, 1]];
    const estaciones = ['verano', 'otono', 'invierno', 'auto'];
    for (let h = 0; h < 24; h += 3) {
      const c = climas[(h / 3) % 4], e = estaciones[Math.floor(h / 6) % 4];
      await js(`(()=>{ const H=${H}; H.progreso.horas=${h}; H.ajustes.estacion='${e}'; const E=H.clima.estado; E.objetivo='${c[0] === 'tormenta' ? 'lluvia' : c[0]}'; E.lluvia=${c[1]}; E.nublado=${c[2]}; ${c[0] === 'tormenta' ? 'try { H.caerRayo(); } catch(e) {}' : ''} return 1 })()`);
      await cuadros(30);
    }
    await js(`(()=>{ const H=${H}; H.ajustes.estacion='auto'; H.progreso.horas=12; return 1 })()`);
  };
  A.distancia = async () => {
    const ds = [2, 10, 'calidad', 6, 3, 9], ps = ['cerca', 'muylejos', 'normal', 'lejos'];
    for (let i = 0; i < ds.length; i++) {
      await js(`(()=>{ const H=${H}; H.ajustes.distancia=${JSON.stringify(ds[i])}; H.ajustes.distanciaPlantas='${ps[i % 4]}'; H.aplicarDistancias(${i % 2 === 0}); return 1 })()`);
      await cuadros(40);
    }
    await js(`(()=>{ const H=${H}; H.ajustes.distancia='calidad'; H.ajustes.distanciaPlantas='normal'; H.aplicarDistancias(true); return 1 })()`);
  };
  A.paneles = async () => {
    for (let k = 0; k < 3; k++) {
      await tecla('KeyI'); await cuadros(4); await tecla('KeyI'); await cuadros(2);
      await tecla('F5'); await cuadros(4); await tecla('F5'); await cuadros(2);
      await tecla('KeyJ'); await cuadros(4); await tecla('KeyJ'); await cuadros(2);
      await tecla('KeyM'); await cuadros(4); await tecla('KeyM'); await cuadros(2);
      await tecla('Escape'); await cuadros(4); await esperar(450); await tecla('Escape'); await volver(); await cuadros(2);
      await js(`(()=>{ const H=${H}; if (H.desafio) { H.desafio.abrirTaller(true); } return 1 })()`); await cuadros(4);
      await js(`(()=>{ const H=${H}; if (H.desafio) { H.desafio.abrirTaller(false); } return 1 })()`); await cuadros(2);
      // el almacén: ir y apretar E
      await js(`(()=>{ const H=${H}, a=H.T.lugares.almacen; if (!a || H.desafio) return 0; H.jugador.ubicar(a.x+Math.sin(a.rot||0)*1.5, a.z+Math.cos(a.rot||0)*1.5, (a.rot||0)); return 1 })()`);
      await cuadros(6); await tecla('KeyE'); await cuadros(4); await tecla('Escape'); await cuadros(2); await volver();
    }
  };
  A.fotos = async () => {
    for (let k = 0; k < 4; k++) { await tecla('KeyP'); await cuadros(4); await esperar(200); }
    await tecla('F2'); await cuadros(10); await js(`(()=>{ try { ${H}.guardarFotoArchivo(); } catch {} return 1 })()`); await esperar(300); await cuadros(4); await tecla('F2'); await cuadros(4);
  };
  A.fotoP = async () => { for (let k = 0; k < 4; k++) { await tecla('KeyP'); await cuadros(4); await esperar(200); } };
  A.fotoModo = async () => { await tecla('F2'); await cuadros(10); await js(`(()=>{ try { ${H}.guardarFotoArchivo(); } catch {} return 1 })()`); await esperar(300); await cuadros(4); await tecla('F2'); await cuadros(4); };
  A.guardar = async () => {
    for (let k = 0; k < 3; k++) { await js(`(()=>{ ${H}.guardar(); return 1 })()`); await cuadros(3); }
  };
  A.vehiculos = async () => {
    // caballo
    await js(`(()=>{ const H=${H}; try { H.montar(); } catch(e) { return String(e) } return 1 })()`);
    await bajar('KeyW'); await bajar('ShiftLeft'); await cuadros(100); await subir('KeyW'); await subir('ShiftLeft');
    await js(`(()=>{ const H=${H}; try { H.desmontar(); } catch(e) {} return 1 })()`); await cuadros(4);
    // kayak
    await js(`(()=>{ const H=${H}; try { if (!H.desafio) H.kayak.subir(H.jugador); } catch(e) {} return 1 })()`);
    await bajar('KeyW'); await cuadros(80); await subir('KeyW');
    await js(`(()=>{ const H=${H}; try { if (H.jugador.estado.enKayak) H.kayak.bajar(H.jugador); } catch(e) {} return 1 })()`); await cuadros(4);
    // tren, de maquinista
    await js(`(()=>{ const H=${H}; try { if (!H.desafio) H.__subirALaCabina(); } catch(e) {} return 1 })()`);
    await bajar('KeyW'); await cuadros(100); await subir('KeyW'); await bajar('KeyS'); await cuadros(60); await subir('KeyS');
    await js(`(()=>{ const H=${H}; try { if (H.jugador.estado.enTren) { H.tren.est.vel = 0; H.__bajarDeLaCabina(); } } catch(e) {} const js=H.jugador.estado; js.enTren=false; return 1 })()`); await cuadros(4);
    // el pueblo
    await js(`(()=>{ const H=${H}, L=H.T.lugares, p=L.pueblo||L.estacion||L.almacen; if (p) H.jugador.ubicar(p.x+3, p.z+3, 0); return 1 })()`);
    await cuadros(60);
  };
  A.dormir = async () => {
    await js(`(()=>{ const H=${H}, r=H.T.lugares.refugio; H.jugador.ubicar(r.x+2, r.z+2, 0); H.progreso.horas=22.5; try { H.__dormir(); } catch(e) {} return 1 })()`);
    await esperar(1500); await cuadros(30); await volver();
  };
  A.diaPasa = async () => {
    // horas de juego: el reloj sigue solo, a saltos (tramos de clima, días nuevos)
    for (let k = 0; k < 8; k++) { await js(`(()=>{ const H=${H}; H.progreso.horas += 3; if (H.progreso.horas >= 24) { H.progreso.horas -= 24; H.progreso.dia++; } return 1 })()`); await cuadros(25); }
  };
  A.caos = async () => {
    const T = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyE', 'KeyF', 'KeyG', 'KeyR', 'KeyQ', 'KeyL', 'KeyH', 'KeyB', 'Digit1', 'Digit2', 'Digit3'];
    for (let k = 0; k < 40; k++) { const t = T[Math.floor(azar() * T.length)]; await bajar(t); await cuadros(3); await subir(t); }
    await tecla('Escape'); await volver(); await js(`(()=>{ const H=${H}; if (H.pesca?.est?.equipada) H.pesca.equipar(false); return 1 })()`);
  };
  // Desafío
  A.noche = async () => {
    await js(`(()=>{ const H=${H}; H.progreso.desafio.salud=100; H.progreso.dia++; H.progreso.horas=19.4; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; return 1 })()`);
    for (let k = 0; k < 12; k++) {
      await js(`(()=>{ const H=${H}; for(let i=0;i<40;i++){ H.progreso.desafio.salud=100; H.progreso.horas += 0.05*24/(30*60)*6; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } return 1 })()`);
      await cuadros(10);
      await js(`(()=>{ const H=${H}, D=H.desafio; try { D.atacar(['granada','ballesta','facon','bengala','humo','jabalina'][${k}%6]); } catch(e) {} return 1 })()`);
      await cuadros(6);
    }
    await js(`(()=>{ const H=${H}; H.progreso.dia++; H.progreso.horas=5.98; for(let i=0;i<80;i++){ H.progreso.horas += 0.002; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); } for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); H.progreso.horas=10; return H.desafio.aliens.length })()`);
    await cuadros(20);
  };
  A.arsenal = async () => {
    await js(`(()=>{ const P=${H}.progreso; for (const k of ['arco','lanza','honda','boleadoras','ballesta','ballestaRepeticion','facon','maza','arpon','hachuela','jabalina','granada','humo','bengala','cuerno','rodela','chaleco','placasCristal','carcaj']) P.cosas[k]=1;
      Object.assign(P.desafio, { flechas: 40, flechasFuego: 20, flechasCristal: 20, virotes: 30, hachuelas: 10, jabalinas: 10, granadas: 10, humos: 8, bengalas: 8, boleadoras: 10 }); return 1 })()`);
    const armas = ['ballesta', 'facon', 'maza', 'arpon', 'hachuela', 'jabalina', 'granada', 'humo', 'bengala', 'cuerno', 'arco', 'boleadoras', 'lanza', 'honda'];
    for (const a of armas) { await js(`(()=>{ try { ${H}.desafio.atacar('${a}'); } catch(e) {} return 1 })()`); await cuadros(8); }
  };
  A.quieto = async () => { for (let k = 0; k < 6; k++) { await js(`${H}.jugador.estado.yaw += 0.4; 1`); await cuadros(150); } };
  const PLAN = {
    relax: ['fotoP', 'fotoModo', 'quieto', 'caminar', 'horaClima', 'distancia', 'paneles', 'fotos', 'guardar', 'vehiculos', 'dormir', 'diaPasa', 'caos'],
    desafio: ['quieto', 'noche', 'arsenal', 'caminar', 'paneles', 'distancia', 'guardar'],
  };
  try {
    for (const modo of MODOS) {
      donde = modo + ' carga';
      await cargar(modo);
      if (modo === 'desafio') await A.arsenal();
      await cuadros(60);
      await muestra('inicio', modo, 0);
      for (let c = 1; c <= CICLOS && !caido; c++) {
        if (SNAP && c === Number(SNAP.split(',')[0])) await snapshot(`${modo}-c${c}`);
        for (const act of PLAN[modo]) { console.log('  > ' + act);
          if (SOLO && !SOLO.includes(act)) continue;
          donde = `${modo} c${c} ${act}`;
          try { await A[act](); } catch (e) { console.log('  falla en ' + act + ': ' + e.message); errores.push(`${donde}: ${e.message}`); }
          if (caido) break;
          if (process.env.CADA_ACT) await muestra(act, modo, c);
        }
        if (!process.env.CADA_ACT) await muestra('ciclo', modo, c);
      }
      if (SNAP) await snapshot(`${modo}-fin`);
    }
  } catch (e) { console.log('EXCEPCIÓN ' + e.stack); }
  fs.writeFileSync(path.join(SALIDA, 'errores.txt'), errores.join('\n'));
  console.log(`errores: ${errores.length}`);
  app.exit(0);
});
