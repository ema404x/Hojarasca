// Partida real 4.12.3 (Electron + WebGL): sombras que llegan más lejos. En Media y Alta comprueba con la placa de verdad: el sol proyecta con la caja de la calidad,
// el bosque entra a la pasada de sombras (más dibujos al rehacer el mapa que sin siluetas), la cámara vuelve a la capa 0, ningún programa de shader nuevo en
// 120 cuadros de día, tarde y ocaso con rehaceres forzados, y sin errores de consola. En Baja y Mínima no hay sombras.
// Uso: powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-12-3-sombras.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
const { app, BrowserWindow } = require('electron');
const path = require('path');
const pagina = path.resolve(process.env.HUMO_PAGINA || path.join(__dirname, '..', 'index.html'));
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox'); app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const visible = process.env.HUMO_OCULTO === '0';
setTimeout(() => { console.log('ERROR: tardó más de 14 minutos'); app.exit(2); }, 14 * 60 * 1000).unref?.();
let pasos = 0, fallas = 0;
const ok = (c, t) => { pasos++; if (c) console.log('OK ' + t); else { fallas++; console.log('FALLA ' + t); } };
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: visible, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught|shader error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  for (const q of ['muybaja', 'baja', 'media', 'alta']) {
    const conSombras = q === 'media' || q === 'alta';
    await w.loadFile(pagina, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${q}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false})); 1`);
    await w.loadFile(pagina, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T && ${H}.renderer)`).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
    const info = await js(`(() => { const H = ${H}, c = H.calidad, s = H.__cielo().sol; return { cast: s.castShadow, caja: s.shadow.camera.right, mapa: s.shadow.mapSize.width, cfgCaja: c.sombraCaja ?? null, sil: !!c.sombraSiluetas, capas: H.camara.layers.mask } })()`);
    console.log(`-- ${q}: ${JSON.stringify(info)}`);
    ok(info.cast === conSombras, `${q}: ${conSombras ? 'el sol proyecta' : 'sin sombras'}`);
    ok(info.capas === 1, `${q}: la cámara del juego mira sólo la capa 0`);
    if (conSombras) {
      ok(info.caja === info.cfgCaja && info.sil, `${q}: la caja del mapa es la de la calidad (±${info.caja})`);
      const dib = await js(`(() => { const H = ${H}, R = H.renderer, sm = R.shadowMap; const cuenta = () => { R.info.autoReset = false; R.info.reset(); const rs = R.info.reset; R.info.reset = () => {}; sm.needsUpdate = true; H.__bucle(); const n = R.info.render.calls; R.info.reset = rs; R.info.autoReset = true; return n; };
        for (let i = 0; i < 20; i++) H.__bucle(); sm.__siluetasActivas = true; const con = cuenta(); sm.__siluetasActivas = false; const sin = cuenta(); sm.__siluetasActivas = true; return { con, sin, capas: H.camara.layers.mask } })()`);
      console.log(`   dibujos al rehacer: con bosque ${dib.con}, sin bosque ${dib.sin}`);
      ok(dib.con > dib.sin + 10, `${q}: el bosque entra a la pasada de sombras (+${dib.con - dib.sin} dibujos al rehacer el mapa)`);
      ok(dib.capas === 1, `${q}: tras rehacer el mapa la cámara vuelve a la capa 0`);
    }
    const correr = (n, h) => js(`(async () => { for (let i = 0; i < ${n}; i++) { ${H}.progreso.horas = ${h}; if (i % 7 === 0) ${H}.renderer.shadowMap.needsUpdate = true; ${H}.__bucle(); if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0)); } return 1 })()`);
    await correr(60, 12);
    const antes = await js(`${H}.renderer.info.programs.length`);
    await correr(40, 12); await correr(40, 16.5); await correr(40, 18.8);
    const despues = await js(`${H}.renderer.info.programs.length`);
    ok(despues === antes, `${q}: ningún programa de shader nuevo en 120 cuadros con rehaceres (${antes} → ${despues})`);
  }
  ok(errores.length === 0, 'sin errores de consola ni de shaders' + (errores.length ? ': ' + errores.join(' | ') : ''));
  console.log(fallas ? `FALLARON ${fallas} de ${pasos}` : `TODO BIEN: ${pasos} pasos OK`);
  app.exit(fallas ? 1 : 0);
});
