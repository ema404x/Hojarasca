// 4.1 (borrador, F2): saca capturas del PROTOTIPO de la pantalla de creación de Bruno (pruebas/estudio/creador-pantalla.js): la figura real del juego
// girando con luz de atardecer y el panel de papel, en las dos pantallas del plan. No carga el juego ni el valle. Perfil propio.
// Uso: npx electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/visor-creador-pantalla.cjs [salida=pruebas/salidas/creador-pantalla]
// (sin dos puntos en los argumentos: el lanzador de Electron se los traga en silencio)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const salida = path.resolve(raiz, arg('salida', 'pruebas/salidas/creador-pantalla'));
const anotarError = (tipo, e) => {
  const texto = `[visor-creador-pantalla] ${tipo}: ${e && e.stack ? e.stack : e}\n`;
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
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// las tomas: nombre -> qué se pide a la página
const GENOMA_BARBUDO = { cara: 'fuerte', ojos: 'miel', piel: 'trigena', pelo: 'colorado', peinado: 'corto', barba: 'barba', contextura: 'robusta', estatura: 'alta', campera: 'musgo', accesorio: 'gorro',
  personalidad: 'sociable', oficio: 'docente', gustos: ['mate', 'folklore'], hobby: 'guitarra', virtud: 'simpatico', defecto: 'distraido' };
const GENOMA_LENTES = { cara: 'angulosa', ojos: 'verdes', piel: 'clara', pelo: 'negro', peinado: 'coleta', barba: 'bigote', contextura: 'delgada', estatura: 'media', campera: 'gris', accesorio: 'anteojos',
  personalidad: 'curioso', oficio: 'tecnico-sonido', gustos: ['libros', 'lluvia'], hobby: 'aves', virtud: 'madrugador', defecto: 'friolero' };
const TOMAS = [
  ['1-aspecto', null, 1, 0.55],
  ['2-aspecto-barbudo', GENOMA_BARBUDO, 1, 0.3],
  ['3-aspecto-tres-cuartos-lentes', GENOMA_LENTES, 1, -0.45],
  ['4-historia', null, 2, 0.55],
  ['5-historia-sociable-al-maximo', GENOMA_BARBUDO, 2, 0.3],
  ['6-historia-curioso', GENOMA_LENTES, 2, -0.45],
];

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const html = path.join(salida, 'creador.html');
  fs.writeFileSync(html, empaquetar(path.join(raiz, 'pruebas', 'estudio', 'creador-pantalla.js')));
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { if (e.level === 'error' || e.level === 'warning') errores.push(String(e.message).slice(0, 400)); });
  await w.loadFile(html);
  const js = (c) => w.webContents.executeJavaScript(c);
  for (let i = 0; i < 80 && !(await js('!!window.estudioListo').catch(() => false)); i++) await esperar(200);
  if (!(await js('!!window.estudioListo'))) { console.log('no cargó:\n' + [...new Set(errores)].join('\n')); app.exit(1); return; }
  for (const [nombre, genoma, pantalla, giro] of TOMAS) {
    await js(`window.creador.genoma(${JSON.stringify(genoma || {})}); window.creador.pantalla(${pantalla}); window.creador.giro(${giro}); 1`);
    await esperar(700);
    console.log('genoma', nombre, await js('JSON.stringify(window.creador.actual())').then((t) => t.slice(0, 160)));
    await w.webContents.capturePage();   // (en una ventana oculta la primera devuelve el cuadro anterior)
    await esperar(400);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log('toma', nombre);
  }
  if (errores.length) console.log('consola:\n' + [...new Set(errores)].filter((m) => !/Security|Autofill/.test(m)).slice(0, 12).join('\n'));
  console.log('listo', salida);
  app.exit(0);
});
