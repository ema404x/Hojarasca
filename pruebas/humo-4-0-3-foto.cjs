// Partida real 4.0.3 (Electron + WebGL): el modo foto (F2, F3, G6 y G7 de las zonas F y G).
//  · G7: F2 con la «Billetera y movimientos» abierta tapa también la billetera, y al salir la pausa no queda dibujada sobre el juego;
//  · G6: la Exposición del modo foto cambia la imagen (también en calidad Mínima, sin posproceso) y los controles del posproceso se apagan sin él;
//  · F2: en el Desafío, el deslizador de hora del modo foto no dispara la oleada ni suma una noche al volver a una hora de día.
// Uso (después de `node armar.mjs`): npx electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/humo-4-0-3-foto.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', '_perfil-humo-foto-403')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let fallas = 0;
const ok = (c, t) => { if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const errores = [];
setTimeout(() => { console.log('✗ se pasó del tiempo (8 minutos)'); app.exit(1); }, 8 * 60 * 1000).unref();

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 240)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  const cargar = async (search) => {
    await w.loadFile(url, { search });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.__bucle').catch(() => false)) return true; }
    return false;
  };
  const ajustes = (o) => js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'muybaja', clima: 'despejado', musica: false, autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre' }, ${JSON.stringify(o)}))); 1`);
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(code)}, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: ${JSON.stringify(code)}, bubbles: true })); 1`);
  const cuadros = (n) => js(`(() => { for (let i = 0; i < ${n}; i++) window.__hojarasca.__bucle(); return 1; })()`);
  const oculto = (id) => js(`document.getElementById(${JSON.stringify(id)}).classList.contains('oculto')`);
  const brillo = async () => {
    await cuadros(3); await esperar(300);
    const b = (await w.webContents.capturePage()).toBitmap();
    let s = 0, n = 0; for (let i = 0; i < b.length; i += 4 * 97) { s += b[i] + b[i + 1] + b[i + 2]; n += 3; }
    return s / n;
  };
  const ponerControl = (id, v) => js(`(() => { const r = document.querySelector('#foto-controles [data-foto="${id}"]'); r.value = ${v}; r.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);

  // ================================================================= Relax
  await w.loadURL('about:blank');
  await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
  await cargar('?debug=1');
  await ajustes({ modo: 'relax', estacion: 'verano' });
  ok(await cargar('?debug=1'), 'cargó el Relax (calidad Mínima)');
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
  await cuadros(3);
  // G7: pausa → billetera → F2
  await tecla('Escape'); await esperar(700); await cuadros(2);
  ok(!(await oculto('pausa')), 'la pausa está abierta');
  await js(`document.getElementById('btn-billetera').click(); 1`);
  ok(!(await oculto('billetera')), 'la billetera está abierta');
  await tecla('F2'); await esperar(300); await cuadros(2);
  ok(!(await oculto('foto-panel')), 'F2 arranca el modo foto');
  ok(await oculto('billetera'), 'G7: y la billetera ya no está encima');
  ok(await oculto('pausa'), 'y la pausa tampoco');
  await tecla('F2'); await esperar(300); await cuadros(2);
  ok(await oculto('foto-panel'), 'F2 sale del modo foto');
  ok(await oculto('pausa') && await oculto('billetera'), 'G7: al salir no queda ni la pausa ni la billetera dibujadas sobre el juego');
  ok(await js(`window.__hojarasca.modoJuego === 'relax'`), 'seguimos en el Relax');
  // G6: exposición y controles apagados sin posproceso
  await tecla('F2'); await esperar(300); await cuadros(2);
  ok(await js(`['bloom', 'vineta', 'grano'].every((id) => document.querySelector('#foto-controles [data-foto="' + id + '"]').disabled)`), 'G6: sin posproceso (calidad Mínima) el brillo, la viñeta y el grano están apagados');
  ok(await js(`!document.querySelector('#foto-controles [data-foto="exposicion"]').disabled && !document.querySelector('#foto-controles [data-foto="hora"]').disabled`), 'y la exposición y la hora siguen activas');
  await ponerControl('exposicion', 0.6); const oscuro = await brillo();
  await ponerControl('exposicion', 1.7); const claro = await brillo();
  ok(claro > oscuro * 1.15, `G6: la exposición cambia la imagen (brillo ${oscuro.toFixed(1)} → ${claro.toFixed(1)})`);
  await ponerControl('exposicion', 1); await tecla('F2'); await esperar(300); await cuadros(2);
  const normal = await brillo();
  ok(Math.abs(normal - 118.2) < 12 || (normal > oscuro && normal < claro), `al salir se restaura la exposición (brillo ${normal.toFixed(1)}, entre ${oscuro.toFixed(1)} y ${claro.toFixed(1)})`);
  // y con posproceso (calidad Alta) también se nota y no hay controles apagados
  await ajustes({ modo: 'relax', estacion: 'verano', calidad: 'alta' });
  ok(await cargar('?debug=1'), 'cargó el Relax (calidad Alta)');
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
  await cuadros(3);
  await tecla('F2'); await esperar(300); await cuadros(2);
  ok(await js(`['bloom', 'vineta', 'grano'].every((id) => !document.querySelector('#foto-controles [data-foto="' + id + '"]').disabled)`), 'con posproceso (calidad Alta) los tres controles están activos');
  await ponerControl('exposicion', 0.6);
  for (let i = 0; i < 25; i++) { await cuadros(2); await esperar(60); }   // la exposición del posproceso se acomoda de a poco
  const oscuroA = await brillo();
  await ponerControl('exposicion', 1.7);
  for (let i = 0; i < 25; i++) { await cuadros(2); await esperar(60); }
  const claroA = await brillo();
  console.log('  (exposición suavizada ' + JSON.stringify(await js('JSON.stringify(window.__hojarasca.__foto())')).slice(0, 120) + ')');
  ok(claroA > oscuroA * 1.1, `G6: también con posproceso (brillo ${oscuroA.toFixed(1)} → ${claroA.toFixed(1)})`);
  await tecla('F2'); await esperar(300);

  // ================================================================= Desafío: F2 y la hora del deslizador
  await ajustes({ modo: 'desafio' });
  ok(await cargar('?debug=1'), 'cargó el Desafío');
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
  await js(`(() => { const H = window.__hojarasca; H.progreso.horas = 10; return 1; })()`);
  await cuadros(4);
  const antes = await js(`(() => { const D = window.__hojarasca.progreso.desafio; return JSON.stringify({ noches: D.noches, oleadaNoche: D.oleadaNoche, oleadas: D.oleadas, dia: window.__hojarasca.progreso.dia, bajas: D.abatidos }); })()`);
  await tecla('F2'); await esperar(300); await cuadros(3);
  ok(!(await oculto('foto-panel')), 'modo foto en el Desafío');
  await ponerControl('hora', 21); await cuadros(40);
  const noche = await js(`(() => { const D = window.__hojarasca.progreso.desafio; return JSON.stringify({ noches: D.noches, oleadaNoche: D.oleadaNoche, oleadas: D.oleadas, dia: window.__hojarasca.progreso.dia, bajas: D.abatidos }); })()`);
  ok(noche === antes, `F2: el deslizador a las 21:00 no empieza la oleada (${antes} → ${noche})`);
  await ponerControl('hora', 10); await cuadros(40);
  const manana = await js(`(() => { const D = window.__hojarasca.progreso.desafio; return JSON.stringify({ noches: D.noches, oleadaNoche: D.oleadaNoche, oleadas: D.oleadas, dia: window.__hojarasca.progreso.dia, bajas: D.abatidos }); })()`);
  ok(manana === antes, `F2: y volver a las 10:00 no suma una noche resistida (${manana})`);
  await tecla('F2'); await esperar(300); await cuadros(3);
  ok(await js(`window.__hojarasca.progreso.horas > 9.5 && window.__hojarasca.progreso.horas < 10.5`), 'al salir se restaura la hora');
  ok(errores.length === 0, `sin errores en la consola (${errores.slice(0, 3).join(' | ')})`);
  console.log(fallas ? `FALLARON ${fallas}` : 'TODO OK');
  app.exit(fallas ? 1 : 0);
}).catch((e) => { console.log('✗ excepción', e); app.exit(1); });
