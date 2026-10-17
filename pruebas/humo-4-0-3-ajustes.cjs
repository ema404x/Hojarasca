// Partida real 4.0.3 (Electron + WebGL): ajustes y pantallas de la zona G.
//  · G9: «Duración del día» tiene el botón de 30 minutos (el valor de fábrica) marcado, y se puede volver a él;
//  · G5: las barras «El bosque», «Efectos» y «Música» se oyen al moverlas (la mezcla se aplica en el momento);
//  · G12: los consejos de primera vez no se «gastan» con el HUD escondido (modo foto y banco de pruebas);
//  · G14: el banco de pruebas lanzado desde la portada esconde la portada mientras mide y la devuelve con el informe.
// Uso (después de `node armar.mjs`): npx electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/humo-4-0-3-ajustes.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', '_perfil-humo-ajustes-403')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let fallas = 0;
const ok = (c, t) => { if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const errores = [];
setTimeout(() => { console.log('✗ se pasó del tiempo (6 minutos)'); app.exit(1); }, 6 * 60 * 1000).unref();

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
  const cuadros = (n) => js(`(() => { for (let i = 0; i < ${n}; i++) window.__hojarasca.__bucle(); return 1; })()`);
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(code)}, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: ${JSON.stringify(code)}, bubbles: true })); 1`);
  const oculto = (id) => js(`document.getElementById(${JSON.stringify(id)}).classList.contains('oculto')`);

  await w.loadURL('about:blank');
  await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
  await cargar('?debug=1');
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, estacion: 'verano', limiteFps: 'libre' })); 1`);
  ok(await cargar('?debug=1'), 'cargó el juego');

  // ---- G9: la duración del día
  const marcado = () => js(`[...document.querySelectorAll('[data-ajuste="duracion"] button')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.valor).join(',')`);
  ok((await marcado()) === '30', `con el valor de fábrica queda marcado «30 minutos» (${await marcado()})`);
  await js(`document.querySelector('[data-ajuste="duracion"] button[data-valor="45"]').click(); 1`);
  ok((await marcado()) === '45' && (await js(`window.__hojarasca.__ajustes ? window.__hojarasca.__ajustes().duracion : 45`)) === 45, 'se elige 45');
  await js(`document.querySelector('[data-ajuste="duracion"] button[data-valor="30"]').click(); 1`);
  ok((await marcado()) === '30', 'y se puede volver a 30');
  ok((await js(`JSON.parse(localStorage.getItem('hojarasca-ajustes-v1')).duracion`)) === 30, 'queda guardado como 30');

  // ---- G5: la mezcla al moverla
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
  await cuadros(3);
  await tecla('Escape'); await esperar(700); await cuadros(2);
  ok(!(await oculto('pausa')), 'la pausa está abierta');
  const mover = (clave, v) => js(`(() => { const r = document.querySelector('[data-ajuste-rango="${clave}"]'); r.value = ${v}; r.dispatchEvent(new Event('input', { bubbles: true })); const m = window.__hojarasca.__sonido().mezcla; return m; })()`);
  const antes = await js(`JSON.stringify(window.__hojarasca.__sonido().mezcla)`);
  const m1 = await mover('volumenMusica', 0.2);
  ok(Math.abs(m1.musica - 0.2) < 1e-9, `G5: «Música» se aplica en el momento (${antes} → ${JSON.stringify(m1)})`);
  const m2 = await mover('volumenAmbiente', 0.35);
  ok(Math.abs(m2.ambiente - 0.35) < 1e-9, 'G5: «El bosque» también');
  const m3 = await mover('volumenEfectos', 0.1);
  ok(Math.abs(m3.efectos - 0.1) < 1e-9, 'G5: «Efectos» también');
  await tecla('Escape'); await esperar(700); await cuadros(2);

  // ---- G12: los consejos con el HUD escondido
  await js(`(() => { const H = window.__hojarasca; H.progreso.pistas = {}; H.progreso.horas = 22; return 1; })()`);
  await tecla('F2'); await esperar(300); await cuadros(2);
  ok(!(await oculto('foto-panel')), 'modo foto abierto');
  await js(`document.querySelector('[data-foto-congelar="0"]').click(); 1`);   // en movimiento: el tiempo corre
  await cuadros(70); await esperar(200); await cuadros(30);
  const dichasFoto = await js(`JSON.stringify(window.__hojarasca.progreso.pistas || {})`);
  ok(dichasFoto === '{}', `G12: con el modo foto no se gasta ningún consejo (${dichasFoto})`);
  await tecla('F2'); await esperar(300);
  await js(`(() => { window.__hojarasca.progreso.horas = 22; return 1; })()`);
  for (let i = 0; i < 20; i++) { await cuadros(10); await esperar(100); }
  const dichasDespues = await js(`JSON.stringify(window.__hojarasca.progreso.pistas || {})`);
  ok(dichasDespues !== '{}' && dichasDespues.includes('p-guia'), `al salir, los consejos vuelven a salir (${dichasDespues})`);

  // ---- G14: el banco de pruebas desde la portada
  await js(`(() => { window.__hojarasca.guardar(); document.getElementById('btn-inicio').click(); return 1; })()`).catch(() => 0);
  await esperar(1500);
  ok(await cargar('?debug=1'), 'de vuelta en la portada (recargada)');
  ok(!(await oculto('inicio')), 'se ve la portada');
  await js(`window.__hojarasca.progreso.pistas = {}; 1`);
  await js(`window.__hojarasca.empezarBanco([{ id: 'a', nombre: 'Prueba corta', dur: 3, hora: 11, alto: 2, desde: { lugar: 'refugio' }, hasta: { lugar: 'refugio', dx: 6 }, texto: 'un recorrido de tres segundos' }]); 1`);
  await cuadros(2);
  ok(await oculto('inicio'), 'G14: mientras mide, la portada no está encima');
  ok(!(await oculto('banco-corriendo')), 'y se ve el cartel de la medición');
  let fin = false;
  for (let i = 0; i < 80 && !fin; i++) { await cuadros(3); await esperar(150); fin = !(await oculto('banco')); }
  ok(fin, 'el banco terminó y muestra su informe');
  ok(!(await oculto('inicio')), 'G14: al terminar, la portada vuelve');
  ok((await js(`window.__hojarasca.modoJuego`)) === 'relax' && !(await js(`document.getElementById('inicio').classList.contains('oculto')`)), 'seguimos en la portada del Relax');
  const pistasBanco = await js(`JSON.stringify(window.__hojarasca.progreso.pistas || {})`);
  ok(pistasBanco === '{}', `G12: el banco tampoco gastó consejos (${pistasBanco})`);
  ok(errores.length === 0, `sin errores en la consola (${errores.slice(0, 3).join(' | ')})`);
  console.log(fallas ? `FALLARON ${fallas}` : 'TODO OK');
  app.exit(fallas ? 1 : 0);
}).catch((e) => { console.log('✗ excepción', e); app.exit(1); });
