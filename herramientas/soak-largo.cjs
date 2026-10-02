// 3.5.4: soak LARGO de memoria. Como soak-memoria.cjs (3.5.1), pero por tiempo (minutos reales) y
// con lo que un jugador hace en una tarde entera y el soak de antes no: días y noches seguidos,
// las estaciones del año completas (el atlas de invierno de los árboles lejanos se hornea a mitad
// de juego), la calidad automática que baja y sube (rehace el mapa de sombras), la distancia de
// dibujo, construir y desarmar obras (en el Desafío, torres de vigía con su banderita), cambiar
// el personaje y la bandera, muchas fotos y el modo foto, talar y que rebrote, perder el contexto
// 3D y recuperarlo varias veces seguidas, vehículos, menús, guardar. Al final, una fase que
// alterna Relax y Desafío recargando la partida guardada (lo mismo que hace el juego al cambiar
// de modo o cargar una partida) y mide la memoria de los procesos entre recargas.
//
// Mide, cada CADA segundos (después de forzar un GC): heap de JS, geometrías/texturas/programas
// de three, objetos de la escena, nodos del DOM y oyentes (CDP), nodos de audio y lienzos vivos
// (FinalizationRegistry), procesos y su memoria (app.getAppMetrics: página, placa y el resto).
// Una línea por muestra en <SALIDA>/muestras.jsonl; al final <SALIDA>/resumen.txt con el valor al
// inicio/medio/final de cada métrica y su pendiente por hora en la segunda mitad.
//
// Perfil propio en <SALIDA>/perfil (NUNCA el del jugador).
// Uso (PowerShell, desde la carpeta del juego, después de `node armar.mjs`):
//   $env:SALIDA='C:\ruta\fuera\del\repo'; $env:MINUTOS='40'; npx electron herramientas/soak-largo.cjs
// Opciones (variables de entorno):
//   PROY=.  SALIDA=./soak-largo-salida  MINUTOS=40 (por modo)  MODOS=relax,desafio
//   CALIDAD=alta  CADA=60 (segundos entre muestras)  ALTERNAR=6 (recargas Relax/Desafío al final; 0 = sin)
//   SOLO=talar,contexto (sólo esas actividades)  SNAP=10 (heap snapshots al minuto 10 y al final de cada modo)
//   VENTANA=1 (ventana real visible en vez de offscreen: el bucle y la placa como los del jugador)
//   AUTO=1 (deja la calidad automática prendida todo el tiempo; si no, sólo en su actividad)
//   DIAG_GEO=1 (anota cada geometría que three sube a la placa; en cada muestra lista las que siguen
//     subidas sin estar en la escena, agrupadas por tipo y tamaño: así se encuentra la que se fuga)
// En la PC de escritorio del usuario (unos 90 minutos; no hace falta tocar nada mientras corre):
//   node armar.mjs
//   $env:SALIDA="$env:USERPROFILE\Documents\soak-hojarasca"; $env:VENTANA='1'; npx electron herramientas/soak-largo.cjs
//   y mandar <SALIDA>\resumen.txt, log.txt y errores.txt. (Con VENTANA=1 se ve la ventana del juego: es
//   el bucle y la placa de verdad. En la notebook de trabajo, para que salga en el monitor externo:
//   npx electron --no-sandbox -r C:\Users\Andres\Documents\Hojarasca\src\herramientas-34\al-monitor.cjs herramientas/soak-largo.cjs)
const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const PROY = path.resolve(process.env.PROY || '.');
const SALIDA = path.resolve(process.env.SALIDA || './soak-largo-salida');
const MINUTOS = Number(process.env.MINUTOS || 40);
const MODOS = (process.env.MODOS || 'relax,desafio').split(',').filter(Boolean);
const CALIDAD = process.env.CALIDAD || 'alta';
const CADA = Number(process.env.CADA || 60) * 1000;
const ALTERNAR = Number(process.env.ALTERNAR ?? 6);
const SOLO = process.env.SOLO ? process.env.SOLO.split(',') : null;
const SNAP = process.env.SNAP ? Number(process.env.SNAP) : 0;
const VENTANA = !!process.env.VENTANA;
fs.mkdirSync(SALIDA, { recursive: true });
app.setPath('userData', path.join(SALIDA, 'perfil'));
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('enable-precise-memory-info');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
// (con VENTANA=1, que Windows no pare el bucle si la ventana queda tapada por otra)
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
const _log = console.log; console.log = (...a) => { _log(...a); try { fs.appendFileSync(path.join(SALIDA, 'log.txt'), a.join(' ') + '\n'); } catch {} };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let s = 20260930;
const azar = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };

// Lo que se inyecta antes que el juego (el mismo de soak-memoria.cjs): nodos de audio y lienzos
// vivos (FinalizationRegistry: después de un GC, lo que sigue vivo) y addEventListener por tipo.
const INSTRUMENTO = `(() => {
  const V = { audio: 0, audioTot: 0, canvas: 0, canvasTot: 0, offscreen: 0, offscreenTot: 0, lis: {}, porTipo: {} };
  const fr = new FinalizationRegistry((k) => { V[k]--; });
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
  const pre = path.join(SALIDA, 'instrumento-preload.js');
  fs.writeFileSync(pre, `const { webFrame } = require('electron'); webFrame.executeJavaScript(${JSON.stringify(INSTRUMENTO)});
require(${JSON.stringify(path.join(PROY, 'preload.cjs'))});`);
  // lo mínimo del proceso principal que usa el preload del juego (las fotos se cuentan y se tiran)
  let fotosGuardadas = 0;
  ipcMain.handle('guardar-foto', (_e, datos, nombre) => { fotosGuardadas++; fs.writeFileSync(path.join(SALIDA, 'ultima-foto.txt'), String(nombre) + ' ' + String(datos).length); return path.join(SALIDA, String(nombre)); });
  ipcMain.handle('pantalla-refresco', () => 60); ipcMain.handle('app-version', () => '3.5.4'); ipcMain.handle('app-platform', () => process.platform);
  ipcMain.handle('steam-disponible', () => false); ipcMain.handle('steam-logro', () => false); ipcMain.handle('graficos-fallaron', () => false);
  for (const k of ['sync-carpeta', 'sync-elegir', 'sync-olvidar', 'sync-escribir', 'sync-leer', 'torneo-leer', 'torneo-escribir']) ipcMain.handle(k, () => null);
  ipcMain.on('sync-escribir-ya', (e) => { e.returnValue = null; });
  const reportes = [];
  ipcMain.on('reportar-error', (_e, d) => { reportes.push(String(d).slice(0, 300)); console.log('  reportar-error ' + String(d).slice(0, 200)); });

  const w = new BrowserWindow({ show: VENTANA, width: 1280, height: 720, webPreferences: { backgroundThrottling: false, preload: pre, sandbox: false, contextIsolation: true, offscreen: !VENTANA } });
  if (!VENTANA) { w.webContents.setFrameRate(60); w.webContents.on('paint', () => {}); }
  const errores = [];
  let donde = 'carga';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon|CONTEXT_LOST/.test(m)) { errores.push(`[${donde}] ${m.slice(0, 300)}`); console.log('  consola: ' + m.slice(0, 200)); }
  });
  let caido = false;
  w.webContents.on('render-process-gone', (_e, d) => { caido = true; console.log('!!! renderer caído', JSON.stringify(d)); errores.push('renderer caído ' + JSON.stringify(d)); });
  app.on('child-process-gone', (_e, d) => { console.log('!!! proceso caído', JSON.stringify(d)); errores.push('proceso caído ' + JSON.stringify(d)); });
  const dbg = w.webContents.debugger;
  dbg.attach('1.3');
  const js = (c, lim = 180000) => Promise.race([w.webContents.executeJavaScript(c, true),
    new Promise((_, no) => setTimeout(() => no(new Error('sin respuesta en ' + donde)), lim))]);
  const H = 'window.__hojarasca';
  const url = path.join(PROY, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const ajustesDe = (modo) => JSON.stringify({ calidad: CALIDAD, clima: 'variable', musica: true, modo, autoCalidad: !!process.env.AUTO, guiaPrimerDia: false, limiteFps: 'auto' });
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!document.getElementById("btn-entrar") && document.getElementById("carga")?.classList.contains("oculto")', 5000).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(`(async()=>{ const H=${H}; const s = H.sonido; try { if (!s.ctx) s.iniciar?.(); await s.ctx?.resume?.(); } catch {} return 1 })()`);
    if (process.env.DIAG_GEO) await js(DIAG_GEO);
  };
  // three le pone a cada geometría un oyente de 'dispose' la primera vez que la sube a la placa:
  // con eso se sabe cuáles están subidas (las de antes de entrar no se ven: sólo las nuevas)
  const DIAG_GEO = `(()=>{ const H=${H}; const BG = new H.THREE.Mesh().geometry.constructor; if (BG.prototype.__soak) return 0;
    const subidas = new Set(); window.__geoSubidas = subidas; BG.prototype.__soak = 1;
    const ael = BG.prototype.addEventListener, dsp = BG.prototype.dispose;
    BG.prototype.addEventListener = function (t, f) { if (t === 'dispose') subidas.add(this); return ael.call(this, t, f); };
    BG.prototype.dispose = function () { subidas.delete(this); return dsp.call(this); };
    return 1 })()`;
  const geoHuerfanas = () => js(`(()=>{ const H=${H}, S=window.__geoSubidas; if (!S) return null; const enEscena = new Set();
    H.escena.traverse((o) => { if (o.geometry) enEscena.add(o.geometry); });
    const grupos = {}; let n = 0;
    for (const g of S) { if (enEscena.has(g)) continue; n++; const p = g.parameters ? Object.values(g.parameters).map((v) => typeof v === 'number' ? +v.toFixed(2) : '').join('/') : '';
      const k = g.type + ' ' + (g.attributes.position?.count ?? 0) + 'v ' + p + (g.name ? ' ' + g.name : ''); grupos[k] = (grupos[k] || 0) + 1; }
    return { subidas: S.size, huerfanas: n, top: Object.entries(grupos).sort((a, b) => b[1] - a[1]).slice(0, 12) } })()`);
  // partida nueva de cero en `modo`
  const cargarNuevo = async (modo) => {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(ajustesDe(modo))}); 1`);
    await abrir(); await entrar();
  };
  // guardar, cambiar de modo y recargar con lo guardado (lo que hace el menú del juego)
  const recargarEn = async (modo) => {
    await js(`(()=>{ try { ${H}.guardar(); } catch {} localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(ajustesDe(modo))}); return 1 })()`);
    await abrir(); await entrar();
  };
  const tecla = (c) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{code:'${c}',bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{code:'${c}',bubbles:true})); return 1 })()`);
  const bajar = (c) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${c}',bubbles:true})); 1`);
  const subir = (c) => js(`document.dispatchEvent(new KeyboardEvent('keyup',{code:'${c}',bubbles:true})); 1`);
  const cuadros = (n) => esperar(n * 17);   // el bucle corre solo (requestAnimationFrame de verdad)
  const volver = () => js(`(()=>{ const H=${H}; try { H.volverAlJuego(); } catch {} return 1 })()`);

  // ------------------------------------------------------------ la muestra
  const gc = async () => { for (let i = 0; i < 3; i++) { await dbg.sendCommand('HeapProfiler.collectGarbage'); await esperar(150); } };
  const t0 = Date.now();
  let tMuestra = 0;
  const muestras = [];
  const muestra = async (etiqueta, modo, extra = {}) => {
    await gc();
    const p = await js(`(()=>{ const H = ${H}, R = H.renderer; let obj = 0; H.escena.traverse(() => obj++);
      const V = window.__vivos || {}; const lis = Object.entries(V.lis || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const imp = H.veg?.impostoresListos?.(); const atlas = imp?.atlas?.();
      return { heap: performance.memory.usedJSHeapSize, geo: R.info.memory.geometries, tex: R.info.memory.textures,
        prog: R.info.programs ? R.info.programs.length : -1, fr: R.info.render.frame, cal: H.ajustes.calidad, obj, dom: document.getElementsByTagName('*').length,
        notas: document.getElementById('notas')?.childElementCount ?? -1,
        audio: V.audio, canvas: V.canvas, offscreen: V.offscreen, porTipo: V.porTipo, lis,
        inv: !!atlas?.invierno, obras: H.obras?.obras?.length ?? -1, talados: H.progreso.talados?.length ?? -1, fotos: H.progreso.fotos, ctx: H.__caidas?.graficos?.recuperados ?? -1,
        aliens: H.desafio?.aliens?.length ?? null, horas: +H.progreso.horas.toFixed(2), dia: H.progreso.dia } })()`);
    const dc = await dbg.sendCommand('Memory.getDOMCounters').catch(() => ({}));
    const pidR = w.webContents.getOSProcessId();
    const met = app.getAppMetrics();
    const r = met.find((m) => m.pid === pidR), g = met.find((m) => m.type === 'GPU');
    const kb = (x) => (x ? Math.round(x / 1024) : null);   // getAppMetrics da KB: esto queda en MB
    const total = met.reduce((a, m) => a + (m.memory.privateBytes || 0), 0);
    const ahora = Date.now();
    const m = { t: Math.round((ahora - t0) / 1000), etiqueta, modo, ...extra,
      heapMB: +(p.heap / 1048576).toFixed(1), geo: p.geo, tex: p.tex, prog: p.prog, obj: p.obj,
      domNodos: dc.nodes, docs: dc.documents, listeners: dc.jsEventListeners, notas: p.notas,
      audio: p.audio, canvas: p.canvas, offscreen: p.offscreen,
      rWS: kb(r?.memory.workingSetSize), rPriv: kb(r?.memory.privateBytes), gWS: kb(g?.memory.workingSetSize), gPriv: kb(g?.memory.privateBytes),
      procesos: met.length, totPriv: kb(total), tipos: met.map((x) => x.type).join(','),
      fps: tMuestra && p.fr >= (muestras.at(-1)?.fr ?? 0) ? Math.round((p.fr - (muestras.at(-1)?.fr ?? p.fr)) / ((ahora - tMuestra) / 1000)) : null, fr: p.fr,
      cal: p.cal, inv: p.inv, obras: p.obras, talados: p.talados, fotos: p.fotos, fotosGuardadas, ctx: p.ctx, aliens: p.aliens, dia: p.dia, horas: p.horas, porTipo: p.porTipo, lis: p.lis };
    tMuestra = ahora;
    if (process.env.DIAG_GEO) { const d = await geoHuerfanas().catch(() => null); if (d) { m.geoHuerfanas = d.huerfanas; m.geoTop = d.top; console.log(`    geometrías subidas ${d.subidas}, fuera de la escena ${d.huerfanas}: ${d.top.map(([k, n]) => n + '× ' + k).join(' | ')}`); } }
    muestras.push(m);
    fs.appendFileSync(path.join(SALIDA, 'muestras.jsonl'), JSON.stringify(m) + '\n');
    console.log(`${String(Math.round(m.t / 6) / 10).padStart(6)}min ${modo.padEnd(7)} ${etiqueta.padEnd(10)} heap ${String(m.heapMB).padStart(6)} geo ${String(m.geo).padStart(5)} tex ${String(m.tex).padStart(4)} prog ${String(m.prog).padStart(3)} obj ${String(m.obj).padStart(6)} dom ${String(m.domNodos).padStart(6)} lis ${String(m.listeners).padStart(5)} audio ${String(m.audio).padStart(4)} canvas ${String(m.canvas).padStart(3)} rPriv ${m.rPriv} gPriv ${m.gPriv} tot ${m.totPriv} proc ${m.procesos} fps ${m.fps} cal ${m.cal} dia ${m.dia}`);
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
    for (let k = 0; k < 5; k++) {
      await js(`(()=>{ const H=${H}, js=H.jugador.estado; if (js.enKayak||js.enTren||js.montado) return 0; const a=${azar()}*6.283, d=${azar()}; H.jugador.ubicar(Math.cos(a)*420*d, Math.sin(a)*420*d, a); return 1 })()`);
      await bajar('KeyW'); if (k % 2) await bajar('ShiftLeft');
      for (let i = 0; i < 4; i++) { await js(`${H}.jugador.estado.yaw += ${(azar() - 0.5) * 1.5}; 1`); await cuadros(40); }
      await subir('KeyW'); await subir('ShiftLeft');
    }
  };
  // un día entero con su noche, hora por hora, con el clima cambiando
  A.diaNoche = async () => {
    const climas = [['despejado', 0, 0.1], ['nublado', 0, 0.7], ['lluvia', 1, 0.95], ['despejado', 0, 0.2]];
    for (let h = 0; h < 24; h++) {
      const c = climas[Math.floor(h / 6) % 4];
      await js(`(()=>{ const H=${H}; H.progreso.horas=${h}.5; if (${h} % 6 === 0) { const E=H.clima.estado; E.objetivo='${c[0]}'; E.lluvia=${c[1]}; E.nublado=${c[2]}; } return 1 })()`);
      await cuadros(25);
    }
    await js(`(()=>{ const H=${H}; H.progreso.dia++; H.progreso.horas=12; return 1 })()`);
  };
  // el año entero: primero con las estaciones automáticas (los días pasan) y después a mano
  A.estaciones = async () => {
    for (let k = 0; k < 8; k++) {
      await js(`(()=>{ const H=${H}; H.ajustes.estacion='auto'; H.progreso.dia += 4; H.revisarRebrote?.(); return 1 })()`);
      await cuadros(150);
    }
    for (const e of ['otono', 'invierno', 'verano', 'invierno', 'auto']) { await js(`(()=>{ ${H}.ajustes.estacion='${e}'; return 1 })()`); await cuadros(200); }
  };
  // la calidad automática baja y sube (las sombras se rehacen); al final, la elegida de nuevo
  A.autoCalidad = async () => {
    const forzar = (bajarla) => js(`(()=>{ const H=${H}, E=H.autoCalidad; H.ajustes.autoCalidad=true; E.activa=true; E.calentando=0; E.desdeCambio=999; E.bajadas=0; E.rebotes=0;
      E.muestras.fill(${bajarla ? 0.1 : 1 / 200}); E.llenas=E.muestras.length; E.rojo=${bajarla ? 999 : 0}; E.verde=${bajarla ? 0 : 999}; return E.calidad })()`);
    for (let k = 0; k < 2; k++) {
      await forzar(true); await cuadros(60);
      await forzar(true); await cuadros(60);
      await forzar(false); await cuadros(60);
      await forzar(false); await cuadros(60);
    }
    await js(`(()=>{ const H=${H}; H.ajustes.autoCalidad=${process.env.AUTO ? 'true' : 'false'}; return H.ajustes.calidad })()`);
  };
  A.distancia = async () => {
    const ds = [2, 10, 'calidad', 6, 3, 9], ps = ['cerca', 'muylejos', 'normal', 'lejos'];
    for (let i = 0; i < ds.length; i++) {
      await js(`(()=>{ const H=${H}; H.ajustes.distancia=${JSON.stringify(ds[i])}; H.ajustes.distanciaPlantas='${ps[i % 4]}'; H.aplicarDistancias(${i % 2 === 0}); return 1 })()`);
      await cuadros(60);
    }
    await js(`(()=>{ const H=${H}; H.ajustes.distancia='calidad'; H.ajustes.distanciaPlantas='normal'; H.aplicarDistancias(true); return 1 })()`);
  };
  // levantar obras enteras y desarmarlas (en el Desafío, además, torres de vigía con su banderita)
  A.construir = async () => {
    const ids = ['mirador', 'empalizada', 'antorcha', 'torre-vigia', 'cantero', 'banco-trabajo', 'lenera', 'pozo'];
    for (let k = 0; k < 2; k++) {
      const r = await js(`(()=>{ const H=${H}, P=H.progreso, js=H.jugador.estado, O=H.obras; const r = { hechas: [], fallas: [] };
        const L=H.T.lugares.refugio; H.jugador.ubicar(L.x + 30 + ${k * 6}, L.z + 26, 0.3);
        Object.assign(P.materiales, { tronco: 400, tabla: 400, piedra: 400, cuerda: 200, lana: 200, cristal: 200, resina: 200, hierro: 200, vidrio: 200 });
        const ids = ${JSON.stringify(ids)};
        const hechas = [];
        for (let i = 0; i < ids.length; i++) {
          const p = H.PLANOS.find(q => q.id === ids[i]); if (!p) continue;
          O.elegir(p);
          // (el primer lugar parejo que se encuentre: el mirador y la torre piden suelo llano)
          let f = null;
          for (let t = 0; t < 40 && !f?.ok; t++) {
            const d = 6 + (i % 4) * 4.5 + (t % 5) * 7, l = (Math.floor(i / 4) - 0.5) * 9 + (Math.floor(t / 5) - 4) * 6;
            const x = js.pos.x - Math.sin(js.yaw) * d + Math.cos(js.yaw) * l, z = js.pos.z - Math.cos(js.yaw) * d - Math.sin(js.yaw) * l;
            f = O.fundar(x, z, js.yaw, H.T.altura(x, z));
          }
          if (!f.ok) { r.fallas.push(ids[i] + ':' + f.motivo); continue; }
          let a; do { a = O.avanzar(f.obra, P.materiales); } while (a.ok && !a.terminada);
          hechas.push(f.obra); r.hechas.push(ids[i]);
        }
        O.elegir(null);
        P.obras = O.obras.map(o => o.datos); H.desafio?.defensas?.refrescar?.();
        window.__obrasSoak = hechas; return r })()`);
      if (k === 0 && !A.construir.dicho) { A.construir.dicho = true; console.log('    obras ' + JSON.stringify(r)); }
      await cuadros(200);   // (la banderita de la torre aparece a los 2 s)
      await js(`(()=>{ const H=${H}, O=H.obras; for (const o of (window.__obrasSoak || []).reverse()) O.destruir(o); window.__obrasSoak = null;
        H.progreso.obras = O.obras.map(o => o.datos); H.desafio?.defensas?.refrescar?.(); return O.obras.length })()`);
      await cuadros(200);
    }
  };
  // cambiar el personaje (rearma su malla) y la bandera, con el panel abierto y cerrado
  A.personal = async () => {
    const vs = [{ peinado: 'largo', gorro: false, poncho: false, campera: 'rojo' }, { peinado: 'trenza', gorro: true, poncho: true }, { peinado: 'rodete', gorro: false, poncho: false, campera: 'azul' }, { peinado: 'corto', gorro: true, poncho: false, campera: 'marron' }];
    await js(`(()=>{ try { ${H}.__personal.abrir('pausa'); } catch {} return 1 })()`); await cuadros(10);
    for (const v of vs) { await js(`(()=>{ try { ${H}.__personal.cambiar('personaje', ${JSON.stringify(v)}); } catch (e) { return String(e) } return 1 })()`); await cuadros(15); }
    for (const b of [{ fondo: 'azul' }, { fondo: 'verde' }]) { await js(`(()=>{ try { ${H}.__personal.cambiar('bandera', ${JSON.stringify(b)}); } catch (e) { return String(e) } return 1 })()`); await cuadros(10); }
    await js(`(()=>{ try { ${H}.__personal.cerrar(); } catch {} return 1 })()`); await volver(); await cuadros(10);
  };
  A.fotos = async () => {
    for (let k = 0; k < 6; k++) { await tecla('KeyP'); await cuadros(6); await esperar(250); }
    for (let k = 0; k < 2; k++) {
      await tecla('F2'); await cuadros(20);
      await js(`(()=>{ try { ${H}.guardarFotoArchivo(); } catch {} return 1 })()`); await esperar(400); await cuadros(6);
      await tecla('F2'); await cuadros(6);
    }
  };
  A.paneles = async () => {
    for (let k = 0; k < 2; k++) {
      for (const t of ['KeyI', 'F5', 'KeyJ', 'KeyM', 'KeyO']) { await tecla(t); await cuadros(6); await tecla(t); await cuadros(3); }
      await tecla('Escape'); await cuadros(6); await esperar(450); await tecla('Escape'); await volver(); await cuadros(3);
      await js(`(()=>{ const H=${H}; if (H.desafio) H.desafio.abrirTaller(true); return 1 })()`); await cuadros(6);
      await js(`(()=>{ const H=${H}; if (H.desafio) H.desafio.abrirTaller(false); return 1 })()`); await cuadros(3);
      await js(`(()=>{ const H=${H}, a=H.T.lugares.almacen; if (!a || H.desafio) return 0; H.jugador.ubicar(a.x+Math.sin(a.rot||0)*1.5, a.z+Math.cos(a.rot||0)*1.5, (a.rot||0)); return 1 })()`);
      await cuadros(8); await tecla('KeyE'); await cuadros(6); await tecla('Escape'); await cuadros(3); await volver();
    }
  };
  A.vehiculos = async () => {
    await js(`(()=>{ const H=${H}; try { H.progreso.cosas.caballo=1; H.montar(); } catch(e) {} return 1 })()`);
    await bajar('KeyW'); await bajar('ShiftLeft'); await cuadros(120); await subir('KeyW'); await subir('ShiftLeft');
    await js(`(()=>{ const H=${H}; try { H.desmontar(); } catch(e) {} return 1 })()`); await cuadros(6);
    await js(`(()=>{ const H=${H}; try { if (!H.desafio) H.kayak.subir(H.jugador); } catch(e) {} return 1 })()`);
    await bajar('KeyW'); await cuadros(100); await subir('KeyW');
    await js(`(()=>{ const H=${H}; try { if (H.jugador.estado.enKayak) H.kayak.bajar(H.jugador); } catch(e) {} return 1 })()`); await cuadros(6);
    await js(`(()=>{ const H=${H}; try { if (!H.desafio) H.__subirALaCabina(); } catch(e) {} return 1 })()`);
    await bajar('KeyW'); await cuadros(120); await subir('KeyW'); await bajar('KeyS'); await cuadros(60); await subir('KeyS');
    await js(`(()=>{ const H=${H}; try { if (H.jugador.estado.enTren) { H.tren.est.vel = 0; H.__bajarDeLaCabina(); } } catch(e) {} H.jugador.estado.enTren=false; return 1 })()`); await cuadros(6);
    await js(`(()=>{ const H=${H}, L=H.T.lugares, p=L.pueblo||L.estacion||L.almacen; if (p) H.jugador.ubicar(p.x+3, p.z+3, 0); return 1 })()`);
    await cuadros(80);
  };
  // talar tres árboles a hachazos, que caigan, y que rebroten con los días
  A.talar = async () => {
    for (let k = 0; k < 3; k++) {
      const n = await js(`(()=>{ const H=${H}, V=H.veg, js=H.jugador.estado; H.progreso.cosas.hacha=1;
        const a=V.arboles.filter(q=>!q.sacado&&!q.caido&&q.especie!=='pehuen').sort((p,q)=>Math.hypot(p.x-js.pos.x,p.z-js.pos.z)-Math.hypot(q.x-js.pos.x,q.z-js.pos.z))[${k * 3}];
        if (!a) return 0; H.jugador.ubicar(a.x+(a.r||0.4)+1.1, a.z, Math.PI/2); return 1 })()`);
      if (!n) continue;
      await cuadros(4);
      for (let g = 0; g < 8; g++) { await js(`(()=>{ try { ${H}.usarHacha(); } catch {} return 1 })()`); await cuadros(12); }
      await cuadros(60);
    }
    await cuadros(400);   // la caída y el reposo (la malla de la caída se va a los ~7 s)
    for (const dd of [3, 6, 30]) { await js(`(()=>{ const H=${H}; H.progreso.dia += ${dd}; H.revisarRebrote(); return H.veg.arbolesAnimados() })()`); await cuadros(40); }
  };
  // el contexto 3D perdido y devuelto, dos veces seguidas
  A.contexto = async () => {
    const ext = `(${H}.__ctxSoak || (${H}.__ctxSoak = ${H}.renderer.getContext().getExtension('WEBGL_lose_context')))`;
    for (let k = 0; k < 2; k++) {
      await js(`(()=>{ ${ext}.loseContext(); return 1 })()`);
      await esperar(700);
      await js(`(()=>{ ${ext}.restoreContext(); return 1 })()`);
      let vuelto = false;
      for (let i = 0; i < 80 && !vuelto; i++) { await esperar(250); vuelto = await js(`!${H}.__caidas.graficos.perdidos`).catch(() => false); }
      if (!vuelto) console.log('    el contexto no volvió');
      await cuadros(120);
    }
  };
  A.guardar = async () => { for (let k = 0; k < 4; k++) { await js(`(()=>{ ${H}.guardar(); return 1 })()`); await cuadros(5); } };
  A.dormir = async () => {
    await js(`(()=>{ const H=${H}, r=H.T.lugares.refugio; H.jugador.ubicar(r.x+2, r.z+2, 0); H.progreso.horas=22.5; try { H.__dormir(); } catch(e) {} return 1 })()`);
    await esperar(1500); await cuadros(40); await volver();
  };
  A.caos = async () => {
    const T = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyE', 'KeyF', 'KeyG', 'KeyR', 'KeyQ', 'KeyL', 'KeyB', 'Digit1', 'Digit2', 'Digit3', 'KeyC'];
    for (let k = 0; k < 40; k++) { const t = T[Math.floor(azar() * T.length)]; await bajar(t); await cuadros(4); await subir(t); }
    await tecla('Escape'); await volver(); await js(`(()=>{ const H=${H}; if (H.pesca?.est?.equipada) H.pesca.equipar(false); return 1 })()`);
  };
  A.quieto = async () => { for (let k = 0; k < 4; k++) { await js(`${H}.jugador.estado.yaw += 0.4; 1`); await cuadros(200); } };
  // Desafío
  A.noche = async () => {
    await js(`(()=>{ const H=${H}; H.progreso.desafio.salud=100; H.progreso.dia++; H.progreso.horas=19.4; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; return 1 })()`);
    for (let k = 0; k < 14; k++) {
      await js(`(()=>{ const H=${H}; for(let i=0;i<40;i++){ H.progreso.desafio.salud=100; H.progreso.horas += 0.05*24/(30*60)*6; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } return 1 })()`);
      await cuadros(15);
      await js(`(()=>{ const H=${H}, D=H.desafio; try { D.atacar(['granada','ballesta','facon','bengala','humo','jabalina'][${k}%6]); } catch(e) {} return 1 })()`);
      await cuadros(8);
    }
    await js(`(()=>{ const H=${H}; H.progreso.dia++; H.progreso.horas=5.98; for(let i=0;i<80;i++){ H.progreso.horas += 0.002; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); } for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); H.progreso.horas=10; return H.desafio.aliens.length })()`);
    await cuadros(30);
  };
  A.arsenal = async () => {
    await js(`(()=>{ const P=${H}.progreso; for (const k of ['arco','lanza','honda','boleadoras','ballesta','ballestaRepeticion','facon','maza','arpon','hachuela','jabalina','granada','humo','bengala','cuerno','rodela','chaleco','placasCristal','carcaj']) P.cosas[k]=1;
      Object.assign(P.desafio, { flechas: 40, flechasFuego: 20, flechasCristal: 20, virotes: 30, hachuelas: 10, jabalinas: 10, granadas: 10, humos: 8, bengalas: 8, boleadoras: 10 }); return 1 })()`);
    for (const a of ['ballesta', 'facon', 'maza', 'arpon', 'hachuela', 'jabalina', 'granada', 'humo', 'bengala', 'cuerno', 'arco', 'boleadoras', 'lanza', 'honda']) { await js(`(()=>{ try { ${H}.desafio.atacar('${a}'); } catch(e) {} return 1 })()`); await cuadros(10); }
  };
  const PLAN = {
    relax: ['caminar', 'diaNoche', 'fotos', 'construir', 'talar', 'personal', 'estaciones', 'distancia', 'autoCalidad', 'paneles', 'vehiculos', 'contexto', 'guardar', 'dormir', 'caos', 'quieto'],
    desafio: ['quieto', 'noche', 'arsenal', 'construir', 'caminar', 'diaNoche', 'paneles', 'contexto', 'distancia', 'autoCalidad', 'personal', 'fotos', 'guardar'],
  };

  // ------------------------------------------------------------ el resumen
  const METRICAS = ['heapMB', 'geo', 'tex', 'prog', 'obj', 'domNodos', 'listeners', 'audio', 'canvas', 'rPriv', 'rWS', 'gPriv', 'gWS', 'totPriv', 'procesos'];
  const pendiente = (xs, ys) => { const n = xs.length; if (n < 3) return null; const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; } return sxx ? sxy / sxx : null; };
  const resumir = () => {
    const lineas = [], json = {};
    for (const modo of [...new Set(muestras.map((m) => m.fase || m.modo))]) {
      const ms = muestras.filter((m) => (m.fase || m.modo) === modo);
      if (!ms.length) continue;
      const min = (m) => +((m.t - ms[0].t) / 60).toFixed(1);
      const mitad = ms.slice(Math.floor(ms.length / 2));
      lineas.push(`== ${modo}: ${ms.length} muestras, ${min(ms.at(-1))} min`);
      lineas.push('metrica     inicio      medio      final   pendiente/h (2a mitad)');
      json[modo] = {};
      for (const k of METRICAS) {
        const v = (m) => (typeof m[k] === 'number' ? m[k] : null);
        const ini = v(ms[0]), med = v(ms[Math.floor(ms.length / 2)]), fin = v(ms.at(-1));
        const xs = [], ys = []; for (const m of mitad) if (v(m) !== null) { xs.push(m.t / 3600); ys.push(v(m)); }
        const p = pendiente(xs, ys);
        json[modo][k] = { ini, med, fin, pendienteHora: p === null ? null : +p.toFixed(2) };
        lineas.push(`${k.padEnd(10)} ${String(ini).padStart(7)} ${String(med).padStart(10)} ${String(fin).padStart(10)}   ${p === null ? '-' : p.toFixed(1)}`);
      }
    }
    fs.writeFileSync(path.join(SALIDA, 'resumen.txt'), lineas.join('\n') + '\n');
    fs.writeFileSync(path.join(SALIDA, 'resumen.json'), JSON.stringify(json, null, 1));
    console.log(lineas.join('\n'));
  };

  try {
    for (const modo of MODOS) {
      donde = modo + ' carga';
      await cargarNuevo(modo);
      if (modo === 'desafio') await A.arsenal();
      await cuadros(120);
      await muestra('inicio', modo);
      const tModo = Date.now();
      let ultima = Date.now(), vuelta = 0, snap = false;
      while (Date.now() - tModo < MINUTOS * 60000 && !caido) {
        vuelta++;
        for (const act of PLAN[modo]) {
          if (SOLO && !SOLO.includes(act)) continue;
          if (Date.now() - tModo >= MINUTOS * 60000 || caido) break;
          donde = `${modo} v${vuelta} ${act}`;
          try { await A[act](); } catch (e) { console.log('  falla en ' + act + ': ' + e.message); errores.push(`${donde}: ${e.message}`); }
          if (SNAP && !snap && Date.now() - tModo >= SNAP * 60000) { snap = true; await snapshot(`${modo}-min${SNAP}`); }
          if (Date.now() - ultima >= CADA) { ultima = Date.now(); await muestra(act, modo, { vuelta }); }
        }
      }
      if (!caido) await muestra('fin', modo, { vuelta });
      if (SNAP && !caido) await snapshot(`${modo}-fin`);
    }
    // alternar Relax y Desafío recargando lo guardado (cambiar de modo / cargar partida)
    for (let k = 0; k < ALTERNAR && !caido; k++) {
      const modo = k % 2 ? MODOS[0] || 'relax' : (MODOS[1] || MODOS[0] || 'desafio');
      donde = `alternar ${k} ${modo}`;
      await recargarEn(modo);
      await A.caminar(); await A.quieto(); await A.guardar();
      await muestra('recarga', modo, { fase: 'alternar', recarga: k + 1 });
    }
  } catch (e) { console.log('EXCEPCIÓN ' + e.stack); errores.push('EXCEPCIÓN ' + e.message); }
  resumir();
  fs.writeFileSync(path.join(SALIDA, 'errores.txt'), errores.join('\n') + (reportes.length ? '\n-- reportar-error --\n' + reportes.join('\n') : ''));
  console.log(`errores: ${errores.length} · reportes: ${reportes.length} · total ${Math.round((Date.now() - t0) / 60000)} min`);
  app.exit(0);
});
