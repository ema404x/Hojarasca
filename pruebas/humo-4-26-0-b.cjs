// Partida real 4.26.0 (B) (Electron + WebGL): la campana del andén. Con el tren lejos, la E en el andén la toca: fundido, la trochita aparece fuera de la
// vista y para en el andén en unos 20 s. Con el tren parado en otra parada no se lo saca de ahí; con el tren que ya viene sólo se avisa; en la Historia,
// mientras la escena de Elsa no se vio, la soga está atada (y la escena sigue saliendo de día); y que no se sume ningún programa de shader.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-26-0-b.ps1
//   HUMO_CAPTURAS=0 sin capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-26-0-b'));
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
  N.alAnden = (p, dx = 2, dz = 1) => { H.jugador.ubicar(p.anden.x + dx, p.anden.z + dz, 0); H.jugador.estado.sentado = false; return 1; };
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

    // ---------------------------------------------------------------- 1. la campana en la Estación del Valle (capítulo 3: la campana es tuya)
    donde = 'campana';
    console.log('— 1. la campana en la Estación del Valle, con el tren que acaba de salir');
    await prep(2, { horas: 11, viaje: true, vistas: ['elsa-anden', 'elsa-anden-vuelta'] });
    await N('N.tren({ parada: t.estacion, metros: 60 })');
    await N('N.alAnden(t.estacion)'); await N('N.tick(1.2)');
    const antes = await N('t.esperaEnAnden(t.estacion)');
    console.log(`  espera sin la campana: ${antes} s · cartel: «${await N('N.estado()')}»`);
    ok(antes > 300, `con el tren que acaba de salir, la espera es de más de 5 minutos (${antes} s)`);
    const av = await N('N.aviso()');
    ok(/Tocar la campana del andén/.test(av), `el aviso ofrece la campana («${av}»)`);
    await foto('1-anden-aviso');
    await N('N.tecla("KeyE")'); await N('N.tick(0.3)');
    const enFundido = await N('N.fundido()');
    ok(enFundido, 'la E toca la campana y la pantalla se va a negro');
    await N('N.tick(1.8)');
    ok(!(await N('N.fundido()')), 'y vuelve');
    const notas1 = await N('N.notas()');
    ok(notas1.some((x) => /^Tocaste la campana del andén/.test(x)), `lo dice (${JSON.stringify(notas1.slice(-2))})`);
    const despues = await N('t.esperaEnAnden(t.estacion)');
    console.log(`  espera después de la campana: ${despues} s · cartel: «${await N('N.estado()')}»`);
    ok(despues > 0 && despues <= 25, `la trochita llega en ${despues} s`);
    ok(!(await N('!!P.entradas.viaje && P.entradas.viaje.dia === 30')), 'la campana no anota un viaje');
    // el tren viene por la vía y para en el andén (reloj de verdad)
    const t0 = Date.now();
    let llego = false;
    for (let i = 0; i < 80 && !llego; i++) { await N('N.tick(0.5)'); llego = await N('t.est.parado > 0 && t.esperaEnAnden(t.estacion) === 0'); }   // (a menos de medio metro la espera ya redondea a 0: se espera a que pare de verdad)
    const seg = Math.round((Date.now() - t0) / 100) / 10;
    ok(llego, `la trochita para en el andén a los ${seg} s de terminar el fundido`);
    const dur = await N('t.est.parado');
    ok(dur >= 40 && dur <= 70, `y se queda su parada de siempre (${Math.round(dur)} s de 45 a 70)`);
    const est1 = await N('N.estado()'), av1 = await N('N.aviso()');
    ok(/el tren está en el andén/.test(est1) && !/campana/.test(av1), `con el tren en el andén ya no se ofrece la campana: el cartel dice «${est1}» y el aviso «${av1}»`);
    await foto('1-tren-en-el-anden');

    // ---------------------------------------------------------------- 2. parado en otra parada, o que ya viene
    donde = 'otra';
    console.log('— 2. con el tren parado en otra parada y con el tren que ya viene');
    const otra = await N('(() => { const o = t.paradas.find((p) => p !== t.estacion); N.tren({ parada: o, parado: 50 }); return o.nombre })()');
    await N('N.alAnden(t.estacion)'); await N('N.tick(0.6)');
    const s0 = await N('t.est.s');
    await N('N.tecla("KeyE")'); await N('N.tick(0.5)');
    const n2 = await N('N.notas()');
    ok(!(await N('N.fundido()')) && Math.abs((await N('t.est.s')) - s0) < 0.01, `parado en ${otra}: no hay fundido y el tren no se mueve`);
    ok(n2.some((x) => x.includes(`parada en ${otra}`) && /Sale en unos/.test(x)), `y lo dice (${JSON.stringify(n2.slice(-1))})`);
    await N('N.tren({ parada: t.paradas[(t.paradas.indexOf(t.estacion) - 1 + t.paradas.length) % t.paradas.length], metros: 0 })');
    await N('(() => { t.est.s = (t.poste(t.estacion) - 120 + t.largo) % t.largo; t.est.proxima = t.estacion; return 1 })()');
    await N('N.tick(0.3)');
    const s1 = await N('t.est.s');
    await N('N.tecla("KeyE")'); await N('N.tick(0.5)');
    const n3 = await N('N.notas()');
    ok(!(await N('N.fundido()')) && n3.some((x) => /^La trochita ya viene/.test(x)), `a 120 m: «ya viene», sin fundido (${JSON.stringify(n3.slice(-1))})`);
    ok((await N('t.est.s')) >= s1 - 0.01, 'y el tren sigue su marcha');

    // ---------------------------------------------------------------- 3. la Historia: la soga atada y la escena de Elsa
    donde = 'historia';
    console.log('— 3. la Historia, capítulo 2: de noche la soga está atada; de día sale la escena de Elsa');
    await N('N.despejar(4)');
    await prep(1, { horas: 23 });
    await N('N.tren({ parada: t.estacion, metros: 60 })');
    await N('N.alAnden(t.estacion)'); await N('N.tick(1.5)');
    ok(!(await N('H.__escenas.activa()')), 'a las 23 la escena de Elsa no sale');
    const s2 = await N('t.est.s');
    await N('N.tecla("KeyE")'); await N('N.tick(0.5)');
    const n4 = await N('N.notas()');
    ok(!(await N('N.fundido()')) && Math.abs((await N('t.est.s')) - s2) < 8, 'la campana no trae el tren');
    ok(n4.some((x) => /soga de la campana/.test(x)), `la soga está atada (${JSON.stringify(n4.slice(-1))})`);
    await foto('3-soga-atada');
    // de día, la escena de siempre (la campana no la saltea)
    await N('(() => { H.jugador.ubicar(t.estacion.anden.x + 60, t.estacion.anden.z + 60, 0); return 1 })()'); await N('N.tick(0.5)');
    await prep(1, { horas: 10 });
    await N('N.tren({ parada: t.estacion, metros: 60 })');
    await N('N.alAnden(t.estacion, 6, 4)');
    let escena = false;
    for (let i = 0; i < 16 && !escena; i++) { await N('N.tick(0.5)'); escena = await N('H.__escenas.activa()'); }
    ok(escena, 'a las 10, la escena de Elsa sale sola como siempre');
    await N('N.despejar(10)');
    ok(await N('Object.hasOwn(P.historia.escenas.vistas, "elsa-anden")'), 'y queda vista');
    await N('N.tren({ parada: t.estacion, metros: 60 })'); await N('N.alAnden(t.estacion)'); await N('N.tick(0.8)');
    ok(/Tocar la campana del andén/.test(await N('N.aviso()')), 'después de la escena, la campana es tuya');

    donde = 'cierre';
    const prog = await js('window.__hojarasca.renderer.info.programs.length').catch(() => prog0);
    ok(prog <= prog0, `programas de shader: ${prog0} → ${prog} (esta versión no suma ninguno)`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
