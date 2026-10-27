// 4.12.3 (sombras lejanas): mide el costo de varias configuraciones de las sombras en los MISMOS encuadres de las capturas
// (herramientas/fotos-sombras-4-12-3.json), todas dentro de UNA misma página y alternadas en ciclos cortos (A, B, C, A, B, C...). Así el ruido de la PC
// (otros programas que usan la CPU y la placa entre un cuadro y otro) le toca por igual a todas, y no hace falta recargar el juego entre una y otra:
// la caja, el tamaño del mapa y las siluetas de los árboles se cambian en vivo (cielo.reponerSombras, ver cielo.js; sólo con ?debug=1).
//
// Por encuadre y configuración mide DOS cosas, porque el mapa de sombras sólo se rehace de vez en cuando (ver main.js: cuando el sol se movió o te
// fuiste a más de 6 m, y nunca más de 3 a 6 veces por segundo):
//   · «fijo»: el cuadro común, con el mapa ya hecho (lo que cuesta MUESTREAR las sombras en el suelo y los edificios);
//   · «rehacer»: el cuadro en que se rehace el mapa (renderer.shadowMap.needsUpdate = true antes de cada cuadro): la diferencia con el fijo es lo que
//     cuesta ARMAR el mapa, y es el tirón que se siente cuando ocurre. Se rehace de 2 a 6 veces por segundo al caminar; de promedio se paga esa
//     diferencia por (rehechos / cuadros por segundo).
// También cuenta dibujos y triángulos de un cuadro fijo y de uno que rehace (la diferencia son los de la pasada de sombras: el diag:dibujo de esa pasada).
//
// Uso: HOJ_HTML=<index.html> HOJ_SALIDA=<json> HOJ_CALIDAD=media|alta HOJ_CONFIGS=nada,base,sil,c70 [HOJ_VISTAS=ladera,plaza-ocaso] [HOJ_CICLOS=10]
//   herramientas\lanzar-electron.ps1 -Script herramientas\medir-sombras-4-12-3.cjs -Visible -Espera 900 -Perfil <carpeta propia>
// Las configuraciones están en herramientas/sombras-variantes-4-12-3.json: { nombre: { tam, caja, siluetas } } o { nada: true } (sin sombras).
// (con ventana visible, siempre por el lanzador: monitor externo, perfil propio, y con el candado de Electron tomado)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const env = (n, d) => process.env['HOJ_' + n] || d;
const pagina = path.resolve(env('HTML', 'index.html'));
const salida = path.resolve(env('SALIDA', path.join(process.env.TEMP || '.', 'medir-sombras.json')));
const calidad = env('CALIDAD', 'media');
const ciclos = Number(env('CICLOS', '10'));
const cuadros = Number(env('CUADROS', '20'));
const solo = env('VISTAS', '') ? env('VISTAS', '').split(',') : null;
const tablaConfigs = JSON.parse(fs.readFileSync(path.resolve(env('VARIANTES', path.join(__dirname, 'sombras-variantes-4-12-3.json'))), 'utf8'));
const nombres = env('CONFIGS', 'base,sil').split(',');
for (const n of nombres) if (!Object.hasOwn(tablaConfigs, n)) { console.log('ERROR: no existe la configuración ' + n); process.exit(2); }
fs.mkdirSync(path.dirname(salida), { recursive: true });
dialog.showErrorBox = (t, c) => { try { fs.writeFileSync(salida + '.error.txt', t + String.fromCharCode(10) + c); } catch { /* sin carpeta */ } };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
setTimeout(() => { console.log('ERROR: tardó más de 14 minutos'); salir(2); }, 14 * 60 * 1000).unref?.();
const mediana = (a) => { const o = a.slice().sort((x, y) => x - y); const n = o.length; return n ? (n % 2 ? o[(n - 1) / 2] : (o[n / 2 - 1] + o[n / 2]) / 2) : NaN; };
const cuartil = (a, f) => { const o = a.slice().sort((x, y) => x - y); return o[Math.min(o.length - 1, Math.floor(o.length * f))]; };
const r2 = (x) => +x.toFixed(2);

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false, estacion:'verano'})); 1`;
  const busqueda = '?debug=1';
  await w.loadFile(pagina, { search: busqueda });
  await js(ajustes);
  await w.loadFile(pagina, { search: busqueda });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3500);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  await js(`(async () => { const H = ${H}, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0;
    for (let i = 0; i < 100 && A.medir().fabrica.pendientes > 0; i++) await new Promise((ok) => setTimeout(ok, 100));
    for (let n = 0; n < 3000 && (A.medir().cola > 0 || A.medir().listas < A.medir().manzanas); n++) { H.__bucle(); if (n % 50 === 49) await new Promise((ok) => setTimeout(ok, 0)); }
    return 1 })()`);
  const inicio = await js(`(() => { const H = ${H}, c = H.calidad; return { sombras: c.sombras, caja: c.sombraCaja ?? null, siluetas: !!c.sombraSiluetas, programas: H.renderer.info.programs.length } })()`);
  const tomas = JSON.parse(fs.readFileSync(path.resolve(env('TOMAS', path.join(__dirname, 'fotos-sombras-4-12-3.json'))), 'utf8'));
  // aplica una configuración en vivo
  const aplicar = (n) => {
    const c = tablaConfigs[n];
    return js(`(() => { const H = ${H}, c = H.calidad, R = H.renderer, cielo = H.__cielo(), cfg = ${JSON.stringify(c)};
      if (cfg.nada) { R.shadowMap.enabled = false; cielo.sol.castShadow = false; return 1; }
      R.shadowMap.enabled = true; c.sombras = cfg.tam; c.sombraCaja = cfg.caja || undefined; c.sombraArboles = cfg.arboles || undefined; cielo.sol.castShadow = true; cielo.reponerSombras();
      R.shadowMap.__siluetasActivas = cfg.siluetas !== false; R.shadowMap.needsUpdate = true; return 1 })()`);
  };
  // por cuadro: c = lo que tardó la CPU en armar y mandar el cuadro (gl.finish() en esta Electron no espera a la placa: «w» es lo mismo), g = lo que midió
  // la placa para ese cuadro entero (consulta de tiempo EXT_disjoint_timer_query_webgl2, leída después de unos milisegundos; -1 si no la hay),
  // s = lo que tardó la CPU sólo en la pasada del mapa de sombras (la suma de las llamadas de ese cuadro; sólo las hay cuando se rehace)
  const medir = (rehacer) => js(`(async () => { const H = ${H}, R = H.renderer, gl = R.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2'); const filas = [], qs = [];
    if (!R.shadowMap.__medida) { const sm = R.shadowMap, orig = sm.render; R.shadowMap.__medida = { cpu: 0 };
      sm.render = function () { const t0 = performance.now(); const o = orig.apply(this, arguments); R.shadowMap.__medida.cpu += performance.now() - t0; return o; }; }
    for (let i = 0; i < ${cuadros}; i++) { H.progreso.horas = window.__hora; if (${rehacer}) R.shadowMap.needsUpdate = true; R.shadowMap.__medida.cpu = 0;
      const q = ext ? gl.createQuery() : null; if (q) gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      const t0 = performance.now(); H.__bucle(); const t1 = performance.now(); if (q) gl.endQuery(ext.TIME_ELAPSED_EXT);
      filas.push({ c: t1 - t0, s: R.shadowMap.__medida.cpu, g: -1 }); qs.push(q); }
    for (let k = 0; k < 40 && ext; k++) { if (qs.every((q, i) => !q || filas[i].g >= 0)) break; await new Promise((ok) => setTimeout(ok, 15));
      const disj = gl.getParameter(ext.GPU_DISJOINT_EXT);
      qs.forEach((q, i) => { if (q && filas[i].g < 0 && gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) filas[i].g = disj ? -2 : gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; }); }
    qs.forEach((q) => { if (q) gl.deleteQuery(q); });
    return filas })()`);
  const dibujos = (rehacer) => js(`(() => { const H = ${H}, R = H.renderer; H.progreso.horas = window.__hora; if (${rehacer}) R.shadowMap.needsUpdate = true;
    R.info.autoReset = false; R.info.reset(); const rs = R.info.reset; R.info.reset = () => {}; H.__bucle();
    const o = { llamadas: R.info.render.calls, triangulos: R.info.render.triangles }; R.info.reset = rs; R.info.autoReset = true; return o })()`);
  const calentar = (n) => js(`(() => { const H = ${H}; for (let i = 0; i < ${n}; i++) { H.progreso.horas = window.__hora; if (i === 0) H.renderer.shadowMap.needsUpdate = true; H.__bucle(); } return 1 })()`);
  if (env('DEPURAR', '') === '2') {
    console.log(await js(`(() => { const H = ${H}, R = H.renderer, gl = R.getContext(); const sm = R.shadowMap; const salida = [];
      const orig = sm.render; let llamadas = 0, ms = 0; sm.render = function () { llamadas++; const t0 = performance.now(); const o = orig.apply(this, arguments); ms += performance.now() - t0; return o; };
      for (let i = 0; i < 5; i++) { sm.needsUpdate = true; const a = llamadas; const t1 = performance.now(); H.__bucle(); salida.push({ llamadasEnElCuadro: llamadas - a, msCuadro: +(performance.now() - t1).toFixed(2), msSombra: +ms.toFixed(2), needsDespues: sm.needsUpdate, enabled: sm.enabled, auto: sm.autoUpdate }); ms = 0; }
      sm.render = orig; const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2'); return JSON.stringify({ salida, ext: !!ext, finishMs: (() => { const t = performance.now(); gl.finish(); return performance.now() - t; })() }) })()`));
  }
  const r = { pagina, calidad, nombres, inicio, ciclos, cuadros, vistas: {}, errores };
  for (const t of tomas) {
    if (solo && !solo.some((s) => t.id.includes(s))) continue;
    const lugar = await js(`(() => { const H = ${H}, T = H.T; const p = ${t.donde}; if (!p) return null;
      const y = p.y ?? T.altura(p.x, p.z) + 1.65;
      H.jugador.ubicar(p.x, p.z, 0);
      H.__camaraFija = { x: p.x, y, z: p.z, yaw: p.yaw, pitch: ${t.pitch ?? -0.03} };
      H.camara.fov = ${t.fov || 60}; H.camara.updateProjectionMatrix(); H.progreso.horas = p.horas; window.__hora = p.horas;
      H.camara.children.forEach((q) => { q.visible = false; }); return { x: +p.x.toFixed(1), z: +p.z.toFixed(1), horas: p.horas } })()`);
    if (!lugar) { r.vistas[t.id] = null; continue; }
    await calentar(120);
    await esperar(800);
    const datos = Object.fromEntries(nombres.map((n) => [n, { fijo: [], rehacer: [], dib: null }]));
    const apilar = (dest, filas) => { for (const f of filas) dest.push(f); };
    // la primera pasada por cada configuración sólo calienta (programas nuevos, memoria del mapa) y no cuenta
    for (const n of nombres) { await aplicar(n); await calentar(40); }
    for (let k = 0; k < ciclos; k++) {
      for (const n of nombres) {
        await aplicar(n); await calentar(8);
        apilar(datos[n].fijo, await medir(false));
        apilar(datos[n].rehacer, await medir(true));
        if (env('DEPURAR', '') && k === 0) console.log('   [depurar] ' + n + ' ' + JSON.stringify(datos[n].rehacer.slice(0, 3)) + ' ' + JSON.stringify(datos[n].fijo.slice(0, 3)));
        if (k === ciclos - 1) datos[n].dib = { fijo: await dibujos(false), rehacer: await dibujos(true) };
      }
    }
    const fila = {};
    const est = (filas, k) => { const v = filas.map((f) => f[k]).filter((x) => x >= 0 && !(k === 's' && x === 0)); return v.length ? { p10: r2(cuartil(v, 0.1)), p25: r2(cuartil(v, 0.25)), p50: r2(mediana(v)) } : null; };
    for (const n of nombres) {
      const d = datos[n];
      fila[n] = { fijo: { c: est(d.fijo, 'c'), g: est(d.fijo, 'g') }, rehacer: { c: est(d.rehacer, 'c'), g: est(d.rehacer, 'g'), s: est(d.rehacer, 's') },
        dibujosFijo: d.dib.fijo.llamadas, dibujosRehacer: d.dib.rehacer.llamadas, dibujosSombra: d.dib.rehacer.llamadas - d.dib.fijo.llamadas,
        trianguloSombra: d.dib.rehacer.triangulos - d.dib.fijo.triangulos };
    }
    r.vistas[t.id] = { donde: lugar, configs: fila };
    console.log(`-- ${t.id}`);
    for (const n of nombres) { const f = fila[n], p = (o, k) => (o && o[k] !== undefined ? String(o[k]).padStart(6) : '   n/d'); console.log(`   ${n.padEnd(10)} cuadro fijo: CPU p25 ${p(f.fijo.c, 'p25')} p50 ${p(f.fijo.c, 'p50')} placa p25 ${p(f.fijo.g, 'p25')} p50 ${p(f.fijo.g, 'p50')} || al rehacer: CPU p25 ${p(f.rehacer.c, 'p25')} placa p25 ${p(f.rehacer.g, 'p25')} · pasada CPU p25 ${p(f.rehacer.s, 'p25')} p50 ${p(f.rehacer.s, 'p50')} · ${f.dibujosSombra} dibujos ${f.trianguloSombra} tri`); }
  }
  r.errores = errores;
  fs.writeFileSync(salida, JSON.stringify(r, null, 2));
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  await esperar(500);
  salir(0);
}).catch((e) => { console.log('ERROR: ' + (e && e.stack ? e.stack : e)); salir(1); });
