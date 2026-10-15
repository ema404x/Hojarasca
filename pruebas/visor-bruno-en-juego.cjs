// (variante `espejo=1`: en vez de las tomas de Bruno, el espejo de fábrica cerca del refugio, de lejos, de cerca y con Bruno parado enfrente)
// 4.1 (F2): a Bruno Castellanos DENTRO del juego real (Electron + WebGL): abre el valle, lo crea con `__personal.cambiar('bruno', ...)` y lo muestra con el cuerpo del
// modo foto (cuerpoJugador.mostrarEnCamara), con la luz de la tarde, para ver el aspecto del genoma y la ropa de abrigo de «Tu personaje» juntos.
// Uso (después de `node armar.mjs`):
//   electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/visor-bruno-en-juego.cjs [salida=pruebas/salidas/bruno-en-juego] [hora=17.2]
// (sin dos puntos en los argumentos: el lanzador de Electron se los traga en silencio)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const salida = path.resolve(raiz, arg('salida', 'pruebas/salidas/bruno-en-juego'));
const HORA = Number(arg('hora', '17.2'));
const ESPEJO = arg('espejo', '0') === '1';
const errores = [];
const anotarError = (tipo, e) => {
  const texto = `[visor-bruno] ${tipo}: ${e && e.stack ? e.stack : e}\n${errores.slice(-8).join('\n')}\n`;
  try { console.error(texto); fs.mkdirSync(salida, { recursive: true }); fs.appendFileSync(path.join(salida, 'errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
setTimeout(() => anotarError('tiempo', 'más de 6 minutos'), 6 * 60 * 1000).unref();
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const BARBUDO = { cara: 'fuerte', ojos: 'miel', piel: 'trigena', pelo: 'colorado', peinado: 'corto', barba: 'barba', contextura: 'robusta', estatura: 'alta', accesorio: 'ninguno' };
const LENTES = { cara: 'angulosa', ojos: 'verdes', piel: 'clara', pelo: 'negro', peinado: 'coleta', barba: 'bigote', contextura: 'delgada', estatura: 'media', accesorio: 'anteojos' };
const MORENO = { cara: 'redonda', ojos: 'marrones', piel: 'oscura', pelo: 'negro', peinado: 'melena', barba: 'ninguna', contextura: 'media', estatura: 'baja', accesorio: 'ninguno' };
// cada toma: el genoma de Bruno, la ropa de «Tu personaje», el giro del cuerpo respecto de la cámara y la distancia
const TOMAS = [
  ['1-barbudo-gorro-y-bufanda', BARBUDO, { campera: 'musgo', gorro: true, colorGorro: 'ocre', bufanda: true, colorBufanda: 'crudo', poncho: false, guantes: false, botas: 'cuero' }, 0.35, 3.2, 1.25, 0.95, 40],
  ['2-lentes-poncho', LENTES, { campera: 'gris', gorro: false, bufanda: false, poncho: true, colorPoncho: 'marron', guantes: false, botas: 'goma' }, -0.5, 3.2, 1.25, 0.95, 40],
  ['3-moreno-sin-abrigo', MORENO, { campera: 'indigo', gorro: false, bufanda: false, poncho: false, guantes: false, botas: 'cuero' }, 0.1, 3.2, 1.25, 0.95, 40],
  ['4-barbudo-de-cerca', BARBUDO, { campera: 'musgo', gorro: false, bufanda: false, poncho: false, guantes: false, botas: 'cuero' }, 0.3, 1.2, 1.55, 1.55, 30],
];

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.__personal').catch(() => false)) break; }
  if (!(await js('!!window.__hojarasca && !!window.__hojarasca.__personal').catch(() => false))) { console.log('no cargó:\n' + errores.join('\n')); app.exit(1); return; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  console.log('secciones', await js(`JSON.stringify(window.__hojarasca.__personal.secciones())`));
  // la cámara libre (F4, sólo en depuración): la cámara no sigue al cuerpo
  await js(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F4', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'F4', bubbles: true })); return 1 })()`);
  await esperar(500);
  const poner = (g, ropa, giro, dist, altoCam, miraY, fov) => `(() => {
    const H = window.__hojarasca, P = H.__personal, js = H.jugador.estado;
    H.progreso.horas = ${HORA}; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0;
    P.cambiar('bruno', { ...${JSON.stringify(g)}, creado: true });
    P.cambiar('personaje', ${JSON.stringify(ropa)});
    const c = P.cuerpo(); c.mostrarEnCamara(true);
    c.raiz.rotation.y = ${giro};
    const x = js.pos.x, y = js.pos.y, z = js.pos.z, r = ${giro};
    const o = { x: x + Math.sin(r) * ${dist}, z: z + Math.cos(r) * ${dist}, y: y + ${altoCam} }, a = { x, z, y: y + ${miraY} };
    const cam = H.camara;
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    js.yaw = yaw; js.pitch = pitch;
    cam.position.set(o.x, o.y, o.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0);
    if (cam.fov !== ${fov}) { cam.fov = ${fov}; cam.updateProjectionMatrix(); }
    for (const k of cam.children) k.visible = false;
    return 1; })()`;
  if (ESPEJO) {
    await js(`(() => { const P = window.__hojarasca.__personal; P.cambiar('bruno', { creado: true, piel: 'trigena', cara: 'fuerte', pelo: 'colorado', barba: 'barba', peinado: 'corto' }); P.colocarEspejo(); return 1; })()`);
    await esperar(1500);
    console.log('espejo', await js(`JSON.stringify(window.__hojarasca.__personal.obras().obras.filter((o) => o.plano.id === 'espejo').map((o) => ({ x: +o.datos.x.toFixed(1), z: +o.datos.z.toFixed(1), rot: +o.datos.rot.toFixed(2) })))`));
    const mirar = (dx, dz, altoCam, miraY, fov, nombre) => `(() => { const H = window.__hojarasca, O = H.__personal.obras().obras.find((o) => o.plano.id === 'espejo'), cam = H.camara, js = H.jugador.estado;
      H.progreso.horas = ${HORA}; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0;
      const ang = O.datos.rot, fx = -Math.sin(ang), fz = -Math.cos(ang);   // el frente del espejo mira a -z local
      const a = { x: O.datos.x, z: O.datos.z, y: O.datos.y + ${miraY} }, o = { x: a.x + fx * ${dx} + Math.cos(ang) * ${dz}, z: a.z + fz * ${dx} - Math.sin(ang) * ${dz}, y: O.datos.y + ${altoCam} };
      const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
      js.yaw = yaw; js.pitch = pitch; cam.position.set(o.x, o.y, o.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0);
      if (cam.fov !== ${fov}) { cam.fov = ${fov}; cam.updateProjectionMatrix(); } for (const k of cam.children) k.visible = false; return 1; })()`;
    for (const [n, dx, dz, alto, mira, fov] of [['e1-de-lejos', 6.5, 0.8, 1.8, 0.9, 50], ['e2-de-cerca', 2.6, 0.3, 1.5, 1.0, 45], ['e3-de-costado', 3.2, 2.4, 1.3, 1.0, 45]]) {
      await js(mirar(dx, dz, alto, mira, fov, n)); await esperar(2500); await js(mirar(dx, dz, alto, mira, fov, n)); await esperar(800);
      await w.webContents.capturePage(); await esperar(400);
      fs.writeFileSync(path.join(salida, n + '.png'), (await w.webContents.capturePage()).toPNG()); console.log('foto', n);
    }
    console.log('listo', salida); app.exit(0); return;
  }
  for (const [nombre, g, ropa, giro, dist, altoCam, miraY, fov] of TOMAS) {
    await js(poner(g, ropa, giro, dist, altoCam, miraY, fov)); await esperar(2500);
    await js(poner(g, ropa, giro, dist, altoCam, miraY, fov)); await esperar(800);
    await w.webContents.capturePage(); await esperar(400);   // (en una ventana oculta la primera captura devuelve el cuadro anterior)
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log('foto', nombre);
  }
  if (errores.length) console.log('consola:\n' + [...new Set(errores)].slice(0, 12).join('\n'));
  console.log('listo', salida);
  app.exit(0);
});
