// Partida real 3.9.2 · LAS MEJORAS: el banco del pueblo, la casa de té con la galesa y la cantina más viva, en el juego de verdad, con capturas.
//   HOJ_SOLO=banco,te,cantina elige las partes (por defecto, todas). HOJ_SALIDA: la carpeta de las capturas.
// Uso (después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-3-9-2-mejoras.cjs
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/Documents/Hojarasca/salida-cantina/mejoras/partida';
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa): ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 25 minutos'); salir(2); }, 25 * 60 * 1000).unref?.();
const solo = (process.env.HOJ_SOLO || '').split(',').filter(Boolean);
const quiero = (k) => !solo.length || solo.includes(k);

app.whenReady().then(async () => {
  const errores = [];
  const calidad = process.env.HOJ_CALIDAD || 'alta';
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 400));
  });
  w.focus();
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 120 s')), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push('FALLÓ: ' + texto); };
  const H = 'window.__hojarasca';
  const url = path.join(raiz, 'index.html');
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true })); 1`);
  const sinHud = `(() => { let s = document.getElementById('sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'sin-hud'; document.head.appendChild(s); } s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; return 1 })()`;
  const conHud = `(() => { const s = document.getElementById('sin-hud'); if (s) s.textContent = ''; return 1 })()`;
  const foto = async (nombre, hud = false) => {
    await js(`${H}.volverAlJuego?.(); 1`);
    await js(hud ? conHud : sinHud); await esperar(120);
    await js(`new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(1))))`); await esperar(150);   // (la captura iba un cuadro atrasada: se espera a que se componga el último)
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log(`  (captura ${nombre}.png)`);
  };
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) { ${H}.__bucle(); } return 1 })()`);
  // una vista en el marco de un edificio de la aldea (x a lo ancho, z hacia la puerta, y sobre el piso o, con `suelo`, sobre el terreno)
  const vista = (id, ojo, a, extra = {}) => `(() => { const H = ${H}, T = H.T, js = H.jugador.estado;
    const e = H.__aldea.edificio('${id}'), c = Math.cos(e.rot), s = Math.sin(e.rot), piso = e.y + 0.32;
    const w = (lx, lz) => ({ x: e.x + lx * c + lz * s, z: e.z - lx * s + lz * c });
    const wo = w(${ojo[0]}, ${ojo[2]}), wa = w(${a[0]}, ${a[2]});
    const oy = ${extra.suelo ? `T.altura(wo.x, wo.z) + ${ojo[1]}` : `piso + ${ojo[1]}`}, ay = ${extra.suelo ? `T.altura(wa.x, wa.z) + ${a[1]}` : `piso + ${a[1]}`};
    const o = { x: wo.x, z: wo.z, y: oy }, a = { x: wa.x, z: wa.z, y: ay };
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    if (!${!!extra.sinJugador}) { js.pos.set(o.x, o.y - 1.65, o.z); js.vel.set(0, 0, 0); js.vy = 0; js.yaw = yaw; js.pitch = pitch; }
    H.__camaraFija = ${!!extra.sinJugador} ? { x: o.x, y: o.y, z: o.z, yaw, pitch } : null;
    const cam = H.camara; cam.position.set(o.x, o.y, o.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0);
    if (cam.fov !== ${extra.fov || 70}) { cam.fov = ${extra.fov || 70}; cam.updateProjectionMatrix(); }
    for (const k of cam.children) k.visible = false;
    return 1 })()`;
  const mirar = async (nombre, id, ojo, a, extra = {}, n = 8) => {
    for (let k = 0; k < n; k++) { await js(vista(id, ojo, a, extra)); await js(`(() => { ${H}.__aldea.actualizar(0.1); ${H}.__bucle(); return 1 })()`); await esperar(50); }
    if (process.env.HOJ_DEBUG) console.log('   ', nombre, await js(`(() => { const H = ${H}, e = H.__aldea.edificio('${id}'), p = H.jugador.estado.pos, c = Math.cos(e.rot), s = Math.sin(e.rot), dx = p.x - e.x, dz = p.z - e.z; return JSON.stringify({ lx: +(dx * c - dz * s).toFixed(2), lz: +(dx * s + dz * c).toFixed(2), yaw: +H.jugador.estado.yaw.toFixed(2) }) })()`));
    await foto(nombre, !!extra.hud);
  };
  const armarMundo = async (n = 4) => { for (let k = 0; k < n; k++) { await js(`(async () => { const M = ${H}.__aldeaMundo(); M.actualizar(4, ${H}.camara.position); await M.listo(); M.montarCola(); return 1 })()`); await esperar(150); } };
  const aLaHora = async (dia, h) => { await js(`(() => { ${H}.progreso.dia = ${dia}; ${H}.progreso.horas = ${h}; for (let i = 0; i < 6; i++) { ${H}.__aldea.actualizar(0.6); ${H}.__aldea.mundo().prearmar(1e6); } return 1 })()`); };
  const estarEn = (id) => js(`(() => { const H = ${H}, e = H.__aldea.edificio('${id}'); H.jugador.ubicar(e.x + 2, e.z + 9, 0); return 1 })()`);
  const pasar = async (n, dt = 0.4, ms = 40) => { for (let k = 0; k < n; k++) { await js(`(() => { ${H}.__aldea.actualizar(${dt}); ${H}.__aldea.mundo().prearmar(1e6); ${H}.__bucle(); return 1 })()`); await esperar(ms); } };
  const ctx = { js, ok, H, foto, cuadro, mirar, armarMundo, aLaHora, estarEn, pasar, tecla, vista, errores, esperar, salida, w };

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'otono'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.__cantina && ${H}.__banco)`).catch(() => false)) break; }
    ok(await js(`!!${H}.__banco`), 'el juego cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; 1`);
    await js(`(() => { const P = ${H}.progreso; P.aldea.descubierta = 1; P.economia.pesos = 9000; ${H}.clima.estado.nublado = 0.1;
      P.aldea.pobladores = ['musico', 'herrero', 'carpintero', 'pescador', 'modista', 'telegrafista', 'panadera', 'maestra', 'galesa'].map((clave) => ({ clave, dia: 1 })); return 1 })()`);
    await js(`(async () => { await ${H}.__aldeaMundo().listo(); ${H}.__aldeaMundo().montarCola(); return 1 })()`);
    if (quiero('banco')) await require('./partes-3-9-2-banco.cjs')(ctx);
    if (quiero('economia')) await require('./partes-3-9-2-economia.cjs')(ctx);
  } catch (e) {
    errores.push('EXCEPCIÓN ' + (e && e.stack ? e.stack : e));
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n` + errores.join('\n') : '\nOK humo-3-9-2-mejoras');
  salir(errores.length ? 1 : 0);
});
