// 4.25.0 (A): partida larga con el jugador de mentira, con la economía, el mapa y el guardado metidos en el medio (Electron + WebGL real, ventana visible, los cuadros de verdad).
// Sobre la corrida larga de la 4.18.4 (pruebas/humo-4-18-4-largo.cjs): durante LARGO_MINUTOS el jugador recorre el valle a los saltos, pasa horas y días, cambia de capítulo con el
// código y contesta las escenas y las tarjetas; además, cada tanto:
//   · comercia en un puesto de la trochita (compra, vende, toma y entrega fletes) y mira que la plata y las existencias sigan sanas;
//   · abre el mapa, toca marcas y chinches, lo cierra;
//   · pausa y retoma la Historia;
//   · GUARDA Y VUELVE A ABRIR la partida (recarga la página sin tocar el almacenamiento) y compara lo que importa antes y después (día, plata, comercio, materiales,
//     capítulo, escenas vistas, chinches, logros); con una escena en curso no se guarda (el juego lo dice) y la comparación se salta.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-25-0-a.ps1 -Script pruebas\humo-4-25-0-a-largo.cjs -Espera 1800
//   LARGO_MINUTOS=8 · LARGO_SEMILLA=n · LARGO_REABRIR=70 (segundos entre cada guardar y volver a abrir) · LARGO_CAP=12 (arranca ahí con el código y no cambia de capítulo: para jugar la noche de la nevada)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const MINUTOS = Number(process.env.LARGO_MINUTOS || 8);
const REABRIR = Number(process.env.LARGO_REABRIR || 70) * 1000;
let s = Number(process.env.LARGO_SEMILLA || 4250) >>> 0;
const azar = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };
setTimeout(() => { console.log('ERROR: la prueba tardó de más'); try { app.exit(2); } catch { process.exit(2); } }, (MINUTOS + 14) * 60 * 1000).unref?.();

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, P = H.progreso;
  const L = window.__L = { cuadros: 0, t0: performance.now(), escenas: [], tarjetas: 0, saltos: 0, comercio: { compras: 0, ventas: 0, tomados: 0, entregados: 0 }, mapas: 0 };
  const raf = () => { L.cuadros++; requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  const dir = () => H.__escenas.director;
  L.fps = () => { const ahora = performance.now(), seg = (ahora - L.t0) / 1000, fps = L.cuadros / Math.max(0.001, seg); L.cuadros = 0; L.t0 = ahora; return +fps.toFixed(1); };
  L.muestra = () => {
    const m = performance.memory || {};
    return { fps: L.fps(), heapMB: +((m.usedJSHeapSize || 0) / 1048576).toFixed(1), geo: H.renderer.info.memory.geometries, tex: H.renderer.info.memory.textures, prog: H.renderer.info.programs.length, llamadas: H.renderer.info.render.calls,
      dom: document.getElementsByTagName('*').length, escena: H.__escenas.activa() ? dir().idActual() : null, cap: P.historia.capitulo + 1, fase: P.historia.fase, dia: P.dia, horas: +P.horas.toFixed(1),
      pesos: P.economia.pesos, modo: H.__caidas.modo(), fallas: H.__caidas.fallas().length };
  };
  L.foto = () => JSON.parse(JSON.stringify({ dia: P.dia, pesos: P.economia.pesos, ganado: P.economia.ganado, gastado: P.economia.gastado, libro: P.economia.libro.length, comercio: P.comercio, materiales: P.materiales, cosas: P.cosas,
    hist: { cap: P.historia.capitulo, fase: P.historia.fase, activa: P.historia.activa, cerrados: P.historia.cerrados, vistas: Object.keys(P.historia.escenas.vistas).length, hechos: Object.keys(P.historia.hechos).length, lazos: P.historia.lazos, decisiones: P.historia.decisiones },
    chinches: P.chinches, logros: Object.keys(H.__logrosRelax().estado().logros) }));
  L.malas = () => {
    const mal = [], js = H.jugador.estado, p = js.pos;
    if (![p.x, p.y, p.z, js.yaw, js.pitch].every(Number.isFinite)) mal.push('jugador no finito');
    if (!Number.isFinite(P.horas) || !Number.isFinite(P.dia)) mal.push('hora o día no finitos');
    if (!Number.isInteger(P.economia.pesos) || P.economia.pesos < 0) mal.push('pesos = ' + P.economia.pesos);
    for (const [k, n] of Object.entries(P.materiales || {})) if (!Number.isFinite(n) || n < 0) mal.push('material ' + k + ' = ' + n);
    for (const [nom, t] of Object.entries(P.comercio.mercado || {})) { if (!(t.caja >= 0)) mal.push('caja ' + nom + ' = ' + t.caja); for (const [b, q] of Object.entries(t.stock)) if (!Number.isInteger(q) || q < 0 || q > 30) mal.push('existencia ' + nom + '/' + b + ' = ' + q); }
    for (const [k, n] of Object.entries(P.historia.lazos || {})) if (!Number.isFinite(n) || n < -2 || n > 3) mal.push('lazo ' + k + ' = ' + n);
    const fal = H.__caidas.fallas(); if (fal.length) mal.push('fallas de sistema: ' + JSON.stringify(fal).slice(0, 200));
    return mal;
  };
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
  // comerciar: un puesto de la trochita, varias operaciones al azar
  L.comerciar = () => {
    const c = H.__cargas(), ps = H.tren.paradas.filter((p) => p.cargas && !p.sinFletes);
    if (!ps.length) return 'sin puestos';
    const dar = () => { P.materiales.tronco = (P.materiales.tronco || 0) + 4; P.materiales.tabla = (P.materiales.tabla || 0) + 4; P.cosas.poncho = (P.cosas.poncho || 0) + 1; if (P.economia.pesos < 1500) P.economia.pesos += 3000; };
    dar();
    const p = ps[Math.floor(Math.random() * ps.length)];
    for (const modo of ['comprar', 'vender', 'fletes']) {
      c.abrir(p, modo);
      for (let k = 0; k < 3; k++) {
        const f = c.filas(); if (!f.length) break;
        const antes = P.economia.pesos, n0 = P.comercio.fletes.length;
        c.elegir(Math.floor(Math.random() * f.length));
        if (modo === 'comprar' && P.economia.pesos < antes) L.comercio.compras++;
        if (modo === 'vender' && P.economia.pesos > antes) L.comercio.ventas++;
        if (modo === 'fletes' && P.comercio.fletes.length > n0) L.comercio.tomados++;
      }
      c.cerrar();
    }
    L.comercio.entregados += c.llegar(ps[Math.floor(Math.random() * ps.length)]).length;
    return p.nombre;
  };
  // el mapa: abrirlo, tocar una marca o un lugar cualquiera, cerrarlo
  L.mapa = () => {
    if (H.__escenas.activa() || H.__caidas.modo() !== 'jugando') return 'ocupado';
    H.abrir('mapa');
    const cv = document.getElementById('lienzo-mapa'), r = cv.getBoundingClientRect();
    const ms = H.__valle ? H.__valle.marcasObjetivo() : [];
    let x, z;
    if (ms.length && Math.random() < 0.6) { x = ms[0].x; z = ms[0].z; } else { x = (Math.random() - 0.5) * 900; z = (Math.random() - 0.5) * 900; }
    const px = ((x + 512) / 1024) * cv.width, py = ((z + 512) / 1024) * cv.height;
    cv.dispatchEvent(new MouseEvent(Math.random() < 0.2 ? 'contextmenu' : 'click', { clientX: r.left + (px / cv.width) * r.width, clientY: r.top + (py / cv.height) * r.height, bubbles: true, cancelable: true }));
    H.volverAlJuego(); L.mapas++;
    return ms.length ? 'con marcas' : 'sin marcas';
  };
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
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram|falló "/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push({ en: donde, m: m.slice(0, 300) }); console.log('  ✗ consola [' + donde + ']: ' + m.slice(0, 220)); }
  });
  w.webContents.on('render-process-gone', (e, d) => { console.log('PROCESO DE LA PÁGINA CAÍDO en ' + donde + ':', JSON.stringify(d)); problemas.push('el proceso de la página se cayó: ' + JSON.stringify(d)); });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 90 s (${donde})`)), 90000))]);
  const L = (c) => js(`(async () => { const H = window.__hojarasca, L = window.__L, P = H.progreso; return (${c}); })()`);
  const url = path.join(raiz, 'index.html');
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false, estacion:'auto'})); 1`;
  const esperarJuego = async () => { for (let i = 0, listo = false; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); } };
  try {
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes); await w.loadFile(url, { search: '?debug=1' });
    await esperarJuego();
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js('window.__sinPausaPorBlur = true; 1');
    await js(PAGINA);
    await esperar(4000);
    const t0 = Date.now(), fin = t0 + MINUTOS * 60000;
    const sumas = { reaperturas: 0, iguales: 0, saltadas: 0 };
    const fpsMuestras = [];
    let ultimaMuestra = t0, paso = 0, capitulo = 0, ultimoCapitulo = Date.now(), ultimoSalto = 0, ultimaHora = 0, ultimoComercio = Date.now(), ultimoMapa = Date.now(), ultimoReabrir = Date.now(), ultimoPausa = Date.now();
    const capFijo = Number(process.env.LARGO_CAP || 0);
    if (capFijo) { const r0 = await L(`L.truco('historia capitulo ${capFijo}')`); console.log('  arranca en el capítulo ' + capFijo + ' → ' + String(JSON.stringify((r0 && r0.texto) || r0 || '')).slice(0, 80)); capitulo = capFijo; }
    const base = await L('L.muestra()');
    console.log(`inicio: ${JSON.stringify(base)}`);
    while (Date.now() < fin) {
      donde = `paso ${paso}`;
      const q = await L('L.atender()');
      const ahora = Date.now();
      if (!q) {
        if (ahora - ultimoSalto > 3500) { ultimoSalto = ahora; await L(`L.ir(${paso})`); paso++; }
        if (ahora - ultimaHora > 2500) { ultimaHora = ahora; await L('L.avanzarTiempo(' + (0.5 + azar() * 2.5).toFixed(2) + ')'); }
        if (!capFijo && ahora - ultimoCapitulo > 90000) { ultimoCapitulo = ahora; capitulo = (capitulo % 13) + 1; const r = await L(`L.truco('historia capitulo ${capitulo}')`); console.log(`  código «historia capitulo ${capitulo}» → ${String(JSON.stringify((r && r.texto) || r || '')).slice(0, 90)}`); }
        if (ahora - ultimoComercio > 9000) { ultimoComercio = ahora; await L('L.comerciar()'); }
        if (ahora - ultimoMapa > 11000) { ultimoMapa = ahora; await L('L.mapa()'); }
        if (ahora - ultimoPausa > 40000) { ultimoPausa = ahora; await L('(() => { P.historia.activa = !P.historia.activa; return P.historia.activa })()'); await esperar(1500); }
        // guardar y volver a abrir (sin tocar el almacenamiento)
        if (ahora - ultimoReabrir > REABRIR) {
          ultimoReabrir = ahora; donde = 'reabrir';
          await L('(() => { if (!P.historia.activa) P.historia.activa = true; return 1 })()');
          const antes = await L('L.foto()');
          const g = await L('H.guardar()');
          if (g === false) { sumas.saltadas++; console.log('  (guardar() dijo que no: escena en curso u otra cosa; se salta la comparación)'); }
          else {
            await w.loadFile(url, { search: '?debug=1' }); await esperarJuego();
            await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
            await js('window.__sinPausaPorBlur = true; 1'); await js(PAGINA); await esperar(2500);
            const despues = await L('L.foto()');
            sumas.reaperturas++;
            const diffs = [];
            // (el guardado no conserva los materiales en cero y los logros se revisan unos segundos después de abrir: sólo pueden crecer)
            const sinCeros = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== 0));
            antes.materiales = sinCeros(antes.materiales); despues.materiales = sinCeros(despues.materiales);
            if (antes.logros.every((x) => despues.logros.includes(x))) despues.logros = antes.logros;
            for (const k of Object.keys(antes)) if (JSON.stringify(antes[k]) !== JSON.stringify(despues[k])) diffs.push(k);
            if (diffs.length) { const k = `[reabrir ${sumas.reaperturas}] cambió al volver a abrir: ${diffs.join(', ')} · antes ${JSON.stringify(diffs.map((d) => antes[d])).slice(0, 300)} · después ${JSON.stringify(diffs.map((d) => despues[d])).slice(0, 300)}`; problemas.push(k); console.log('  ✗ ' + k); }
            else sumas.iguales++;
          }
          donde = `paso ${paso}`;
        }
      }
      const mal = await L('L.malas()'); for (const m of mal) { const k = `[${donde}] ${m}`; if (!problemas.includes(k)) { problemas.push(k); console.log('  ✗ ' + k); } }
      if (ahora - ultimaMuestra >= 30000) {
        ultimaMuestra = ahora;
        const m = await L('L.muestra()'); fpsMuestras.push(m.fps);
        console.log(`  t ${Math.round((ahora - t0) / 1000)} s · fps ${m.fps} · heap ${m.heapMB} MB · geo ${m.geo} · prog ${m.prog} · llamadas ${m.llamadas} · dom ${m.dom} · cap ${m.cap}${m.escena ? ' · escena ' + m.escena : ''} · día ${m.dia} ${m.horas} h · $${m.pesos}`);
      }
      await esperar(120);
    }
    const st = await L('({ saltos: L.saltos, tarjetas: L.tarjetas, comercio: L.comercio, mapas: L.mapas, escenas: L.escenas.length })');
    console.log(`\nresumen: ${JSON.stringify(st)} · reaperturas ${sumas.reaperturas} (iguales ${sumas.iguales}, saltadas ${sumas.saltadas})`);
    if (fpsMuestras.length) console.log(`  fps mínimo ${Math.min(...fpsMuestras)}, medio ${(fpsMuestras.reduce((a, b) => a + b, 0) / fpsMuestras.length).toFixed(1)}`);
  } catch (e) { console.log('ERROR:', e && e.stack || e); problemas.push('excepción: ' + (e && e.message)); }
  console.log(`\nerrores de consola: ${consola.length} · problemas: ${problemas.length}`);
  for (const p of problemas.slice(0, 20)) console.log('  ' + p);
  try { app.exit(problemas.length || consola.length ? 1 : 0); } catch { process.exit(1); }
});
