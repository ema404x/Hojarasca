// Partida real 4.26.4 (B): la vuelta en trochita. En la Historia, antes de la primera vuelta (subirse en la Aldea), la campanita del andén llama al tren con más de 25 s;
// después, los 45 s de siempre. El objetivo dice «Tocá la campanita del andén para llamar a la trochita.» hasta esa vuelta; y que no se sume ningún programa de shader.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientascorrer-humo-4-26-4-b.ps1
//   HUMO_CAPTURAS=0 sin capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-26-4-b'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 15 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 15 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  N.despejar = async (maxSeg = 6) => {
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (es && es.activa()) { if (es.director.fase() === 'corriendo') N.tecla('Escape'); await N.tick(0.4); continue; }
      await N.tick(0.3);
      if (!(es && es.activa())) break;
    }
    return 1;
  };
  N.aviso = () => { const a = document.getElementById('aviso'); return a && !a.classList.contains('oculto') ? a.innerText.replace(/\s+/g, ' ') : ''; };
  N.estado = () => { const a = document.getElementById('estado'); return a && !a.classList.contains('oculto') ? a.innerText.replace(/\s+/g, ' ') : ''; };
  N.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => (n.__titulo || '') + ' / ' + (n.__sub || ''));
  N.fundido = () => document.getElementById('fundido').classList.contains('activo');
  // el tren en un lugar de la vuelta: «metros» después del poste de «parada» (en marcha), o parado en «parada» con «parado» segundos
  N.tren = (o) => { const t = H.tren, e = t.est; e.subido = false; e.conduce = false; e.varado = false; e.esperaNieve = 0;
    if (o.parado) { e.s = t.poste(o.parada) % t.largo; e.parado = o.parado; e.vel = 0; e.proxima = o.parada; }
    else { e.s = (t.poste(o.parada) + o.metros) % t.largo; e.parado = 0; e.vel = 7; const i = t.paradas.indexOf(o.parada); e.proxima = t.paradas[(i + 1) % t.paradas.length]; }
    return 1; };
  // (4.26.1: la E ofrece la campana sólo mirándola a 3 m o menos: sin desplazamiento a mano, parado a 2 m de la campanita del poste, mirándola)
  N.alAnden = (p, dx, dz) => { const b = p.campana; if (dx === undefined && b) { const l = Math.hypot(p.anden.x - b.x, p.anden.z - b.z) || 1, x = b.x + (p.anden.x - b.x) / l * 2, z = b.z + (p.anden.z - b.z) / l * 2; H.jugador.ubicar(x, z, Math.atan2(-(b.x - x), -(b.z - z))); } else H.jugador.ubicar(p.anden.x + (dx ?? 2), p.anden.z + (dz ?? 1), 0); H.jugador.estado.sentado = false; return 1; };
  N.campanaAldea = () => { const M = H.__mecanicas && H.__mecanicas(); return M && M.dondeCampana ? M.dondeCampana() : null; };
  N.frenteAldea = () => { const p = H.tren.paradas.find((q) => q.aldea), b = N.campanaAldea(); if (!b) return 0; const a0 = Math.atan2(p.anden.x - b.x, p.anden.z - b.z); let x = p.anden.x, z = p.anden.z; for (let k = 0; k < 16; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 8; x = b.x + Math.sin(a) * 2, z = b.z + Math.cos(a) * 2; if (!(H.col && H.col.paredEntre && H.col.paredEntre(b.x, b.z, x, z, b.y - 1.2))) break; } H.jugador.ubicar(x, z, Math.atan2(-(b.x - x), -(b.z - z))); H.jugador.estado.sentado = false; return 1; };
  N.panel = () => { const el = [...document.querySelectorAll('p')].find((e) => /Talá un árbol seco/.test(e.textContent) && e.textContent.length < 400); return el ? el.textContent.replace(/s+/g, ' ') : ''; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 120000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, t = H.tren; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false})); 1`;
  const foto = async (nombre) => {
    if (!CAPTURAS) return;
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(900 + intento * 600);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const IDS = ['llave', 'bolsa', 'mesa', 'ramal'];
  const prep = (cap, o = {}) => N(`(() => {
    const h = P.historia, ids = ${JSON.stringify(IDS)};
    h.activa = ${o.activa === false ? 'false' : 'true'}; h.empezada = 1; h.capitulo = ${cap}; h.fase = 'jugando'; h.terminada = 0;
    ids.slice(0, ${cap}).forEach((k) => { h.cerrados[k] = P.dia - 1; });
    for (const k of Object.keys(h.escenas.vistas)) if (/^elsa-anden/.test(k)) delete h.escenas.vistas[k];
    ${JSON.stringify(o.vistas || [])}.forEach((e) => { h.escenas.vistas[e] = 1; h.aplicadas[e] = 1; });
    if (${!!o.viaje}) P.entradas.viaje = { dia: 1, hora: 9, cantidad: 0 }; else delete P.entradas.viaje;
    P.horas = ${o.horas ?? 12};
    return 1 })()`);
  try {
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)');
    for (let i = 0; i < 20 && !(await N('N.tarjeta()')); i++) await N('N.tick(0.6)');
    await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion=\\"empezar\\"]"); if (b) b.click(); return 1 })()');
    await N('N.tick(1.5)'); await N('N.despejar(15)');
    for (let k = 0; k < 4 && (await N('N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; return 1 })()');
    const prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);

    // ---------------------------------------------------------------- 1. la Aldea, Historia capítulo 2, antes de la primera vuelta
    donde = 'vuelta';
    console.log('— 1. de vuelta en el andén de la Aldea, con el tren que acaba de salir (Historia, sin la primera vuelta)');
    await prep(1, { horas: 11, viaje: true, vistas: ['elsa-anden', 'elsa-anden-vuelta'] });
    await N('(() => { P.cosas.hacha = 1; delete P.historia.temas["mundo:vuelta-trochita"]; return 1 })()');
    await N('N.tren({ parada: t.paradas.find((q) => q.aldea), metros: 60 })');
    await N('N.frenteAldea()'); await N('N.tick(1.5)');
    const espera0 = await N('t.esperaEnAnden(t.paradas.find((q) => q.aldea))');
    ok(espera0 > 300, `con el tren que acaba de salir, la espera es de más de 5 minutos (${espera0} s)`);
    const pan = await N('N.panel()');
    console.log(`  objetivo en el panel: «${pan}»`);
    ok(/Tocá la campanita del andén para llamar a la trochita\./.test(pan), 'el objetivo dice «Tocá la campanita del andén para llamar a la trochita.»');
    const av = await N('N.aviso()');
    ok(/Tocar la campana del andén/.test(av), `el aviso ofrece la campana («${av}»)`);
    await foto('1-aldea-aviso');
    await N('N.tecla("KeyE")'); await N('N.tick(0.3)');
    ok(await N('N.fundido()'), 'la E toca la campana y la pantalla se va a negro');
    await N('N.tick(1.8)');
    const despues = await N('t.esperaEnAnden(t.paradas.find((q) => q.aldea))');
    ok(despues > 0 && despues <= 25, `la trochita llega en ${despues} s`);
    const t0 = Date.now();
    let llego = false;
    for (let i = 0; i < 80 && !llego; i++) { await N('N.tick(0.5)'); llego = await N('t.est.parado > 0 && t.esperaEnAnden(t.paradas.find((q) => q.aldea)) === 0'); }
    ok(llego, `la trochita para en el andén a los ${Math.round((Date.now() - t0) / 100) / 10} s de terminar el fundido`);
    await foto('1-tren-en-la-aldea');
    // subir y viajar (el hook de verdad marca la vuelta)
    ok(!(await N('Object.hasOwn(P.historia.temas, "mundo:vuelta-trochita")')), 'antes de subir, la vuelta no está marcada');
    await N('(() => { H.jugador.ubicar(t.paradas.find((q) => q.aldea).anden.x, t.paradas.find((q) => q.aldea).anden.z, 0); t.subir(H.jugador); H.jugador.estado.enTren = true; return 1 })()');
    await N('N.tick(1.2)');
    ok(await N('Object.hasOwn(P.historia.temas, "mundo:vuelta-trochita")'), 'al subirse en la Aldea queda marcada la primera vuelta');
    await N('(() => { t.est.parado = 0; t.est.vel = 7; return 1 })()'); await N('N.tick(6)');
    ok(await N('H.tren.est.s !== undefined && t.est.subido'), 'y se viaja');
    await foto('1-viajando');

    // ---------------------------------------------------------------- 2. después de la vuelta: la campana vuelve a los 45 s
    donde = 'despues';
    console.log('— 2. después de la primera vuelta: con 30 s de espera la campana sólo avisa');
    await N('(() => { t.soltar(H.jugador); return 1 })()');
    await N('N.tren({ parada: t.paradas.find((q) => q.aldea), metros: 60 })');
    await N('(() => { const p = t.paradas.find((q) => q.aldea), e = t.est; e.s = (t.poste(p) - 35 * e.objetivo + t.largo) % t.largo; e.vel = e.objetivo; e.parado = 0; e.proxima = p; return 1 })()');
    await N('N.frenteAldea()'); await N('N.tick(0.4)');
    const e30 = await N('t.esperaEnAnden(t.paradas.find((q) => q.aldea))');
    console.log(`  espera: ${e30} s`);
    ok(e30 > 26 && e30 <= 45, `el tren viene en ${e30} s (entre 26 y 45)`);
    await N('N.tecla("KeyE")'); await N('N.tick(0.5)');
    const nn = await N('N.notas()');
    ok(!(await N('N.fundido()')) && nn.some((x) => /^La trochita ya viene/.test(x)), `con la vuelta hecha, a ${e30} s sólo avisa (${JSON.stringify(nn.slice(-1))})`);
    { const p2 = await N('N.panel()'); ok(/rbol/.test(p2) && !/campanita/.test(p2), `y el objetivo ya no dice nada de la campanita («${p2}»)`); }

    // ---------------------------------------------------------------- 3. el Relax: 45 s (sin la Historia)
    donde = 'relax';
    console.log('— 3. fuera de la Historia, antes de la vuelta, con 30 s de espera la campana sólo avisa');
    await N('(() => { delete P.historia.temas["mundo:vuelta-trochita"]; P.historia.activa = false; return 1 })()');
    await N('N.frenteAldea()'); await N('N.tick(0.4)');
    await N('N.tecla("KeyE")'); await N('N.tick(0.5)');
    const nr = await N('N.notas()');
    ok(!(await N('N.fundido()')) && nr.some((x) => /^La trochita ya viene/.test(x)), 'sólo avisa (45 s de siempre)');

    donde = 'cierre';
    const prog = await js('window.__hojarasca.renderer.info.programs.length').catch(() => prog0);
    ok(prog <= prog0 + 1, `programas de shader: ${prog0} → ${prog} (esta versión no suma ninguno; +1 posible al ir arriba de la trochita)`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
