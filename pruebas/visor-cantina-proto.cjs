// 3.9: el visor de la moza de la cantina ('aldea-moza'): el cuerpo, la ropa y las poses del juego de verdad (src/gente-cuerpo.js,
// src/gente-ropa.js) en un rincón de cantina (pruebas/estudio/cantina.js, con `?debug=1&cantina=proto`). Empaqueta la escena como
// el estudio de personajes (sin cargar el valle) y saca las tomas de la moza: de frente, de 3/4, de espalda, de costado, con la
// bandeja en alto (quieta y caminando), apoyada en la barra, dejando la bandeja en la mesa, y de cerca (rostro, escote, cintura,
// piernas). Perfil propio; nunca un cartel de error en la pantalla.
// Uso: npx electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/visor-cantina-proto.cjs salida=<carpeta> [solo=a,b]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const salida = arg('salida', process.env.HOJ_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'proto-cantina'));
const solo = arg('solo', process.env.HOJ_SOLO || '').split(',').filter(Boolean);
const quien = arg('quien', 'aldea-moza');   // 3.9.2: otra persona en el mismo rincón (las tomas de bandeja son de la moza)
const anotarError = (tipo, e) => {
  const texto = `[visor-cantina] ${tipo}: ${e && e.stack ? e.stack : e}\n`;
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

// las tomas: nombre -> opciones de window.cantina.toma
const TOMAS = {
  'frente': { vista: 'frente', quietud: 'cintura' },
  'tres-cuartos': { vista: 'tres-cuartos', quietud: 'cintura' },
  'espalda': { vista: 'espalda', quietud: 'cintura' },
  'lado': { vista: 'lado', quietud: 'cintura' },
  'atras-frente': { vista: 'frente', quietud: 'atras' },
  'bandeja-frente': { vista: 'frente', pose: 'bandeja', bandeja: true, vasos: 3 },
  'bandeja-tres-cuartos': { vista: 'tres-cuartos', pose: 'bandeja', bandeja: true, vasos: 3 },
  'bandeja-espalda': { vista: 'espalda', pose: 'bandeja', bandeja: true, vasos: 3 },
  'bandeja-lado': { vista: 'lado', pose: 'bandeja', bandeja: true, vasos: 3 },
  'bandeja-medio': { vista: 'medio', pose: 'bandeja', bandeja: true, vasos: 3 },
  'camina-1': { vista: 'frente', pose: 'bandeja', bandeja: true, vasos: 4, andando: true, t: 0.7 },
  'camina-2': { vista: 'frente', pose: 'bandeja', bandeja: true, vasos: 4, andando: true, t: 2.3 },
  'camina-3-4': { vista: 'tres-cuartos', pose: 'bandeja', bandeja: true, vasos: 4, andando: true, t: 1.4 },
  'camina-lado': { vista: 'lado', pose: 'bandeja', bandeja: true, vasos: 4, andando: true, t: 4.0 },
  'barra-frente': { vista: 'frente', pose: 'barra' },
  'barra-tres-cuartos': { vista: 'tres-cuartos', pose: 'barra' },
  'barra-lado': { vista: 'lado2', pose: 'barra' },
  'barra-medio': { vista: 'medio', pose: 'barra' },
  'dejar-lado': { vista: 'lado2', pose: 'dejar', bandeja: true, vasos: 2 },
  'dejar-tres-cuartos': { vista: 'mesa', pose: 'dejar', bandeja: true, vasos: 2 },
  'rostro': { vista: 'rostro', quietud: 'cintura' },
  'escote': { vista: 'escote', quietud: 'cintura' },
  'cintura': { vista: 'cintura', quietud: 'cintura' },
  'piernas': { vista: 'piernas', quietud: 'cintura' },
  'piernas-camina': { vista: 'piernas', andando: true, t: 0.6 },
  'invierno': { vista: 'frente', invierno: true },
};

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const html = path.join(salida, 'cantina.html');
  fs.writeFileSync(html, empaquetar(path.join(raiz, 'pruebas', 'estudio', 'cantina.js')));
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { if (e.level === 'error' || e.level === 'warning') errores.push(String(e.message).slice(0, 400)); });
  await w.loadFile(html, { search: '?debug=1&cantina=proto&quien=' + encodeURIComponent(quien) });
  const js = (c) => w.webContents.executeJavaScript(c);
  for (let i = 0; i < 80 && !(await js('!!window.estudioListo').catch(() => false)); i++) await new Promise((r) => setTimeout(r, 200));
  if (!(await js('!!window.estudioListo'))) { console.log('no cargó:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('info', JSON.stringify(await js('window.cantina.info()')));
  const guardar = (nombre, d) => fs.writeFileSync(path.join(salida, nombre), Buffer.from(d.split(',')[1], 'base64'));
  for (const [nombre, o] of Object.entries(TOMAS)) {
    if (solo.length && !solo.some((s) => nombre.startsWith(s))) continue;
    guardar(`${nombre}.png`, await js(`window.cantina.toma(${JSON.stringify({ ...o, rotulo: nombre })})`));
    console.log('toma', nombre);
  }
  if (errores.length) console.log('consola:\n' + [...new Set(errores)].slice(0, 15).join('\n'));
  console.log('listo', salida);
  app.exit(0);
});
