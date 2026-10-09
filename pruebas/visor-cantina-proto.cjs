// proto-cantina: el visor de la moza y la bailarina (pruebas/estudio/cantina.js), con `?debug=1&cantina=proto`.
// Empaqueta la escena como el estudio de personajes (sin cargar el valle), saca cada variante de frente y de 3/4
// y arma la hoja `comparar-cantina.png`. Perfil propio; nunca un cartel de error en la pantalla.
// Uso: npx electron --no-sandbox pruebas/visor-cantina-proto.cjs [salida=<carpeta>]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const salida = arg('salida', path.join(raiz, 'pruebas', 'salidas', 'proto-cantina'));
const anotarError = (tipo, e) => {
  const texto = `[visor-cantina-proto] ${tipo}: ${e && e.stack ? e.stack : e}\n`;
  try { console.error(texto); fs.mkdirSync(salida, { recursive: true }); fs.appendFileSync(path.join(salida, 'errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
setTimeout(() => anotarError('tiempo', 'más de 5 minutos'), 5 * 60 * 1000).unref();
app.commandLine.appendSwitch('disable-gpu-sandbox');
// el empaquetado: el mismo del estudio de personajes
const fuente = fs.readFileSync(path.join(__dirname, 'estudio-personajes.cjs'), 'utf8');
const empaquetar = new Function('fs', 'path', 'raiz', fuente.slice(fuente.indexOf('function empaquetar'), fuente.indexOf('app.whenReady')) + '\nreturn empaquetar;')(fs, path, raiz);

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const html = path.join(salida, 'cantina.html');
  fs.writeFileSync(html, empaquetar(path.join(raiz, 'pruebas', 'estudio', 'cantina.js')));
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { if (e.level === 'error' || e.level === 'warning') errores.push(String(e.message).slice(0, 400)); });
  await w.loadFile(html, { search: '?debug=1&cantina=proto' });
  const js = (c) => w.webContents.executeJavaScript(c);
  for (let i = 0; i < 80 && !(await js('!!window.estudioListo').catch(() => false)); i++) await new Promise((r) => setTimeout(r, 200));
  if (!(await js('!!window.estudioListo'))) { console.log('no cargó:\n' + errores.join('\n')); app.exit(1); return; }
  const claves = await js('window.cantina.claves');
  const guardar = (nombre, d) => fs.writeFileSync(path.join(salida, nombre), Buffer.from(d.split(',')[1], 'base64'));
  for (const k of claves) for (const vista of ['frente', 'tres-cuartos']) {
    guardar(`${k.replace('cantina-', '')}-${vista}.png`, await js(`window.cantina.toma(${JSON.stringify(k)}, '${vista}')`));
    console.log('toma', k, vista);
  }
  // la hoja de comparación: las cuatro, de frente y de 3/4, rotuladas
  const hoja = await js(`(async () => {
    const carga = (n) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = n; });
    const claves = window.cantina.claves, W = 620, H = 900, s = 8, cab = 70, pie = 46;
    const cv = document.createElement('canvas'); cv.width = 4 * (2 * W + s) + 3 * 24; cv.height = cab + H + pie;
    const x = cv.getContext('2d'); x.fillStyle = '#1a1310'; x.fillRect(0, 0, cv.width, cv.height);
    x.fillStyle = '#f2e6d0'; x.font = 'bold 40px Georgia, serif'; x.fillText('La cantina (prototipo): la moza y la bailarina de los sábados', 20, 50);
    for (let i = 0; i < claves.length; i++) {
      const ox = i * (2 * W + s + 24);
      for (const [j, vista] of [[0, 'frente'], [1, 'tres-cuartos']]) x.drawImage(await carga(window.cantina.toma(claves[i], vista)), ox + j * (W + s), cab);
      x.fillStyle = '#f2e6d0'; x.font = 'bold 26px Georgia, serif'; x.fillText(window.cantina.titulo(claves[i]), ox + 10, cab + H + 34);
    }
    return cv.toDataURL('image/png');
  })()`);
  guardar('comparar-cantina.png', hoja);
  console.log('hoja comparar-cantina.png');
  if (errores.length) console.log('consola:\n' + [...new Set(errores)].slice(0, 15).join('\n'));
  console.log('listo', salida);
  app.exit(0);
});
