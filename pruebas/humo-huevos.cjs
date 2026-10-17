// 4.2 (huevos de pascua): humo en el juego real (Electron, Relax) de los easter eggs que dependen del mundo:
//  · la estrella fugaz con deseo: el cartel de tres deseos, la tecla 1/2/3, y a los 2 a 4 días la nota y el regalo chico;
//  · (se suman las demás secciones a medida que entran) y la consola sin errores.
// Uso: npx electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/humo-huevos.cjs [salida=pruebas/salidas/huevos]
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
app.setPath('userData', path.join(require('os').tmpdir(), 'hojarasca-humo-huevos'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 8 minutos'); salir(2); }, 8 * 60 * 1000).unref?.();
const arg = process.argv.find((a) => a.startsWith('salida='));
const salida = path.resolve(raiz, arg ? arg.slice(7) : 'pruebas/salidas/huevos');
fs.mkdirSync(salida, { recursive: true });

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const url = path.join(raiz, 'index.html');
  const foto = async (nombre) => { const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG()); };
  const out = [];
  const ok = (nombre, cond, dato) => { out.push({ nombre, ok: !!cond, dato }); };
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.est && ${H}.__huevos)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  const tecla = (c) => js(`window.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(c)}, bubbles: true, cancelable: true })); 1`);

  // ------------------------------------------------------------ 1) la estrella fugaz con deseo
  {
    const q = await js(`(() => { const hj = ${H}.__huevos.juego(), p = ${H}.progreso; hj.estado(); p.dia = 60; p.horas = 23;
      let n = 0; for (n = 1; n < 500; n++) { if (hj.fugazVista(60, n)) break; } return { n, abierto: hj.deseoAbierto(), visible: !document.getElementById('huevo-deseo').classList.contains('oculto'), filas: document.querySelectorAll('#huevo-deseo .huevo-deseo-fila').length, ultima: p.huevos.estrella.ultimaNoche }; })()`);
    ok('una fugaz de la noche trae el cartel con tres deseos', q.n < 500 && q.abierto && q.visible && q.filas === 3 && q.ultima === 60, q);
    await esperar(400);
    await foto('estrella-cartel');
    const q2 = await js(`${H}.__huevos.juego().fugazVista(60, 9999)`);
    ok('con el cartel abierto no se abre otro', q2 === false);
    await tecla('Digit3');
    const q3 = await js(`({ abierto: ${H}.__huevos.juego().deseoAbierto(), deseo: ${H}.progreso.huevos.estrella.deseo })`);
    ok('la tecla 3 pide «Que la tierra dé» y cierra el cartel', !q3.abierto && q3.deseo && q3.deseo.id === 'tierra' && q3.deseo.cumple >= 62 && q3.deseo.cumple <= 64, q3);
    // pasan los días: antes de tiempo no pasa nada
    const antes = await js(`(() => { const p = ${H}.progreso; return p.materiales ? Object.assign({}, p.materiales) : null; })()`);
    const q4 = await js(`(async () => { const hj = ${H}.__huevos.juego(), p = ${H}.progreso; p.dia = 61; p.horas = 10; for (let i = 0; i < 3; i++) { hj.actualizar(2.1); } return !!p.huevos.estrella.deseo; })()`);
    ok('al día siguiente el deseo sigue esperando', q4 === true);
    const q5 = await js(`(async () => { const hj = ${H}.__huevos.juego(), p = ${H}.progreso; const d = p.huevos.estrella.deseo; const cal0 = ${H}.progreso.materiales?.calafate ?? ${H}.progreso.cosas?.calafate ?? 0;
      p.dia = d.cumple; p.horas = 9; hj.actualizar(2.1); const cal1 = ${H}.progreso.materiales?.calafate ?? ${H}.progreso.cosas?.calafate ?? 0;
      return { deseo: p.huevos.estrella.deseo, cumplidos: p.huevos.estrella.cumplidos, cal0, cal1, nota: [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent).join(' | ') }; })()`);
    ok('a los 2 a 4 días llega la nota y el regalo chico (4 calafates)', q5.deseo === null && q5.cumplidos === 1 && q5.cal1 - q5.cal0 === 4 && /canastita de calafates/.test(q5.nota), q5);
    await esperar(300);
    await foto('estrella-nota');
  }

  let mal = 0;
  for (const r of out) { console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre} ${JSON.stringify(r.dato ?? '')}`); if (!r.ok) mal++; }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  console.log(mal || errores.length ? `HUMO HUEVOS: ${mal} fallas` : 'HUMO HUEVOS: todo OK');
  salir(mal || errores.length ? 1 : 0);
});
