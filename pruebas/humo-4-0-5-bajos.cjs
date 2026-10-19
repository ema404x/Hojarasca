// Partida real 4.0.5 (Electron + WebGL): dos bajos que sólo se ven andando el juego.
//  · F7: una partida en invierno, con la estación en «auto», arranca ya en invierno (antes arrancaba en verano y pasaba al invierno a la vista);
//  · G15: en el banco de pruebas la rueda, el clic derecho y el clic izquierdo no hacen nada (antes cambiaban de ranura y usaban lo que tenías en la mano).
// Uso (después de `node armar.mjs`): npx electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/humo-4-0-5-bajos.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-4-0-5-bajos')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let fallas = 0;
const ok = (c, t) => { if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const errores = [];
setTimeout(() => { console.log('✗ se pasó del tiempo (6 minutos)'); app.exit(1); }, 6 * 60 * 1000).unref();

// (F7) lee la estación en el primer pedido de cuadro después de armarse el juego (antes de que corra el primero)
const precarga = path.join(os.tmpdir(), 'hojarasca-precarga-405.js');
fs.writeFileSync(precarga, `const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => { try { if (!window.__estacionAlCargar && window.__hojarasca && window.__hojarasca.__U) { const U = window.__hojarasca.__U(); window.__estacionAlCargar = { oto: U.uOtono.value, inv: U.uInvierno.value }; } } catch (e) { window.__estacionAlCargar = { error: String(e) }; } return raf(cb); };
`);

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: precarga, contextIsolation: false, sandbox: false } });
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 240)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.__bucle').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const cuadros = (n) => js(`(() => { for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1; })()`);

  await w.loadURL('about:blank');
  await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
  await w.loadFile(url, { search: '?debug=1' });
  await esperar(500);
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, estacion: 'auto', limiteFps: 'libre' })); 1`);
  ok(await cargar(), 'cargó el juego');
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
  await js(`${H}.volverAlJuego?.(); 1`);
  await cuadros(3);

  // ---- G15: en el banco de pruebas el mouse no es tuyo
  await js(`${H}.progreso.ranura = 0; 1`);
  await js(`${H}.empezarBanco(); 1`);
  ok(await js(`${H}.banco.activa`), 'el banco de pruebas está corriendo');
  await js(`window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 })); 1`);
  ok((await js(`${H}.progreso.ranura`)) === 0, 'G15: la rueda no cambia de ranura en el banco');
  const derecho = await js(`(() => { const ev = new MouseEvent('mousedown', { button: 2, cancelable: true }); window.dispatchEvent(ev); return ev.defaultPrevented; })()`);
  ok(derecho === false, 'G15: el clic derecho no usa nada en el banco');
  // terminarlo (Escape) y comprobar que, ya fuera del banco, la rueda sí cambia de ranura (el control de la prueba)
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })); 1`);
  await esperar(500); await cuadros(3);
  ok(!(await js(`${H}.banco.activa`)), 'Escape corta el banco');
  await js(`${H}.volverAlJuego?.(); 1`); await cuadros(2);
  await js(`window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 })); 1`);
  ok((await js(`${H}.progreso.ranura`)) === 1, 'G15 (control): fuera del banco la rueda cambia de ranura');
  const derecho2 = await js(`(() => { const ev = new MouseEvent('mousedown', { button: 2, cancelable: true }); window.dispatchEvent(ev); return ev.defaultPrevented; })()`);
  ok(derecho2 === true, 'G15 (control): fuera del banco el clic derecho sí lo atiende el juego');

  // ---- F7: la partida en invierno, con la estación en «auto», arranca en invierno
  await js(`${H}.progreso.dia = 10; ${H}.progreso.horas = 12; ${H}.guardar(); 1`);
  await esperar(500);
  ok(await cargar(), 'cargó de nuevo (día 10, invierno)');
  const e = await js(`window.__estacionAlCargar`);
  ok(e && !e.error && e.inv > 0.9 && e.oto < 0.1, `F7: al terminar de armarse ya es invierno (otoño ${e && e.oto}, invierno ${e && e.inv})`);
  // y una partida de verano sigue arrancando en verano
  await js(`${H}.progreso.dia = 1; ${H}.progreso.horas = 9; ${H}.guardar(); 1`);
  await esperar(500);
  ok(await cargar(), 'cargó de nuevo (día 1, verano)');
  const v = await js(`window.__estacionAlCargar`);
  ok(v && !v.error && v.inv < 0.05 && v.oto < 0.05, `F7: en verano arranca en verano (otoño ${v && v.oto}, invierno ${v && v.inv})`);

  ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.join(' / ') : ''}`);
  console.log(fallas ? `FALLÓ (${fallas})` : 'OK humo 4.0.5 bajos');
  app.exit(fallas ? 1 : 0);
});
