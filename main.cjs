const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// 2.7.3: si el 3D no arranca, se prueba otra forma antes de rendirse. Casi siempre es el
// driver de una placa integrada vieja (bloqueada por Chromium, o que falla con Direct3D 11),
// no la falta de placa. Lo que anduvo queda guardado para las próximas veces.
const INTENTOS_GRAFICOS = [
  {},                                                   // lo de siempre
  { 'ignore-gpu-blocklist': true },                     // placas viejas bloqueadas
  { 'ignore-gpu-blocklist': true, 'use-angle': 'd3d9' },
  { 'ignore-gpu-blocklist': true, 'use-angle': 'gl' },
];
const archivoGraficos = () => path.join(app.getPath('userData'), 'graficos.json');
function intentoGraficos() {
  try { const n = JSON.parse(fs.readFileSync(archivoGraficos(), 'utf8')).intento; return Number.isInteger(n) && n >= 0 && n < INTENTOS_GRAFICOS.length ? n : 0; }
  catch { return 0; }
}
for (const [clave, valor] of Object.entries(INTENTOS_GRAFICOS[intentoGraficos()])) {
  if (valor === true) app.commandLine.appendSwitch(clave); else app.commandLine.appendSwitch(clave, valor);
}
ipcMain.handle('graficos-fallaron', () => {
  const siguiente = intentoGraficos() + 1;
  if (siguiente >= INTENTOS_GRAFICOS.length) return false;
  try { fs.writeFileSync(archivoGraficos(), JSON.stringify({ intento: siguiente })); } catch { return false; }
  app.relaunch(); app.exit(0);
  return true;
});
if (process.platform === 'win32') app.setAppUserModelId('ar.hojarasca.juego');

// 3.5.4: con el juego ya abierto, abrirlo otra vez sólo trae al frente la ventana que hay. Antes
// la segunda copia igual llegaba a abrir su ventana (app.quit() antes de estar listo no frena
// whenReady) y cargaba el juego con el mismo perfil un par de segundos.
const primeraInstancia = app.requestSingleInstanceLock();
if (!primeraInstancia) app.quit();
let ventanaPrincipal = null;
app.on('second-instance', () => {
  if (!ventanaPrincipal || ventanaPrincipal.isDestroyed()) return;
  if (ventanaPrincipal.isMinimized()) ventanaPrincipal.restore();
  ventanaPrincipal.show(); ventanaPrincipal.focus();
});

function archivosRecursivos(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...archivosRecursivos(p));
    else out.push(p);
  }
  return out;
}

// En desarrollo nunca abrimos silenciosamente un bundle viejo.
// Cualquier cambio en src/, armar.mjs o package.json invalida index.html.
// En una distribución final src/ no existe y se usa el index precompilado.
function reconstruirBundleSiHaceFalta() {
  const src = path.join(__dirname, 'src');
  const armador = path.join(__dirname, 'armar.mjs');
  const pkg = path.join(__dirname, 'package.json');
  const salida = path.join(__dirname, 'index.html');
  if (!fs.existsSync(src) || !fs.existsSync(armador)) return { ok: true, distribuido: true };

  // 2.6.1: un archivo que desaparece entre el listado y el stat (el editor o OneDrive
  // guardando) tiraba adentro de whenReady: promesa rechazada y ninguna ventana.
  let bundleViejo;
  try {
    const candidatos = [...archivosRecursivos(src), armador, pkg].filter(fs.existsSync);
    const ultimaFuente = Math.max(...candidatos.map((f) => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } }));
    bundleViejo = !fs.existsSync(salida) || fs.statSync(salida).mtimeMs < ultimaFuente;
  } catch (e) { return { ok: false, error: String(e?.message || e) }; }
  if (!bundleViejo) return { ok: true, reconstruido: false };

  console.log('[Hojarasca] Fuentes más nuevas que index.html; reconstruyendo bundle completo…');
  const resultado = spawnSync(process.execPath, [armador], {
    cwd: __dirname,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
  });
  if (resultado.error || resultado.status !== 0) {
    const detalle = resultado.error ? String(resultado.error.message || resultado.error) : `código ${resultado.status}`;
    return { ok: false, error: detalle };
  }
  return { ok: true, reconstruido: true };
}

function escribirCrash(tipo, detalle) {
  try {
    const carpeta = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(carpeta, { recursive: true });
    const linea = `[${new Date().toISOString()}] ${tipo}: ${detalle}\n`;
    fs.appendFileSync(path.join(carpeta, 'hojarasca-crash.log'), linea);
  } catch {}
}

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'Hojarasca',
    backgroundColor: '#0e1410',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false,
      devTools: !app.isPackaged,
      spellcheck: false,
      navigateOnDragDrop: false,   // 3.5.4: soltar un archivo sobre la ventana no la lleva a ese archivo
    },
  });

  ventanaPrincipal = ventana;
  ventana.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  // 3.5.4: sólo navega al juego mismo (antes pasaba cualquier file://), sin historial para
  // "atrás", y guarda si Windows cierra la sesión o la compu se suspende (ver ventana-main.cjs)
  cuidarVentana({ ventana, index: path.join(__dirname, 'index.html'), escribirCrash, powerMonitor: require('electron').powerMonitor });
  ventana.on('closed', () => { if (ventanaPrincipal === ventana) ventanaPrincipal = null; });
  ventana.once('ready-to-show', () => ventana.show());
  ventana.webContents.on('render-process-gone', (_e, d) => {
    escribirCrash('renderer', `${d.reason || 'unknown'} exitCode=${d.exitCode ?? '?'}`);
  });
  ventana.webContents.on('did-fail-load', (_e, code, desc, url) => {
    escribirCrash('load', `${code} ${desc} ${url}`);
  });
  // 3.5.1: si la página se cae o se cuelga, vuelve sola con la última partida guardada
  recuperacion.vigilar(ventana);
  // (reiniciado por caídas de la placa: el juego lo avisa en la portada)
  const recuperado = process.argv.includes('--hojarasca-recuperado=graficos');
  ventana.loadFile(path.join(__dirname, 'index.html'), recuperado ? { query: { recuperado: 'graficos' } } : undefined);

  // F11: pantalla completa
  ventana.webContents.on('before-input-event', (evento, tecla) => {
    if (tecla.type === 'keyDown' && tecla.key === 'F11') {
      ventana.setFullScreen(!ventana.isFullScreen());
      evento.preventDefault();
    }
  });
}

// Las fotos van a Imágenes/Hojarasca
ipcMain.handle('guardar-foto', async (_evento, datos, nombre) => {
  const texto = String(datos || '');
  const prefijo = 'data:image/png;base64,';
  if (!texto.startsWith(prefijo)) throw new Error('Formato de captura inválido');
  if (texto.length > 40 * 1024 * 1024) throw new Error('La captura excede el tamaño permitido');
  const buffer = Buffer.from(texto.slice(prefijo.length), 'base64');
  if (!buffer.length || buffer.length > 30 * 1024 * 1024 || buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) throw new Error('PNG inválido');
  const carpeta = path.join(app.getPath('pictures'), 'Hojarasca');
  fs.mkdirSync(carpeta, { recursive: true });
  const base = path.basename(String(nombre || 'captura.png')).replace(/[^\w.-]/g, '_').replace(/\.png$/i, '') || 'captura';
  const ruta = path.join(carpeta, `${base}.png`);
  // 2.6.1: asincrónico (una captura grande trababa el proceso principal) y por un
  // temporal: si falla a mitad no queda un PNG cortado.
  const tmp = `${ruta}.tmp`;
  try {
    await fs.promises.writeFile(tmp, buffer);
    await fs.promises.rename(tmp, ruta);
  } catch (e) { await fs.promises.rm(tmp, { force: true }).catch(() => {}); throw e; }
  return ruta;
});
ipcMain.handle('app-version', () => app.getVersion());
ipcMain.handle('app-platform', () => process.platform);
// 3.2: el refresco del monitor donde está la ventana, para el ritmo parejo del juego (el juego
// también lo mide solo; esto es una pista para no confundir 72 con 144 Hz)
ipcMain.handle('pantalla-refresco', (evento) => {
  try {
    const { screen } = require('electron');
    const v = BrowserWindow.fromWebContents(evento.sender);
    const d = v ? screen.getDisplayMatching(v.getBounds()) : screen.getPrimaryDisplay();
    return Number(d?.displayFrequency) || 0;
  } catch { return 0; }
});
ipcMain.on('salir-juego', () => app.quit());
ipcMain.on('reportar-error', (_evento, detalle) => escribirCrash('javascript', String(detalle || '').slice(0, 12000)));

// 1.10: logros de Steam. Opcional del todo: si steamworks.js no está instalado, si no
// hay App ID o si el cliente de Steam no está abierto, el juego sigue igual y los logros
// quedan sólo adentro del juego. El App ID sale de steam_appid.txt (al lado del
// ejecutable o del proyecto) o de la variable STEAM_APP_ID.
let steam = null, steamProbado = false;
function conectarSteam() {
  if (steamProbado) return steam;
  steamProbado = true;
  try {
    const candidatos = [path.join(path.dirname(process.execPath), 'steam_appid.txt'), path.join(__dirname, 'steam_appid.txt')];
    const archivo = candidatos.find((f) => fs.existsSync(f));
    const appId = Number(process.env.STEAM_APP_ID || (archivo ? fs.readFileSync(archivo, 'utf8').trim() : ''));
    if (!Number.isInteger(appId) || appId <= 0) return null;
    // eslint-disable-next-line global-require
    steam = require('steamworks.js').init(appId);
  } catch (e) { steam = null; escribirCrash('steam', String(e?.message || e)); }
  return steam;
}
ipcMain.handle('steam-disponible', () => !!conectarSteam());
ipcMain.handle('steam-logro', (_evento, api) => {
  const s = conectarSteam();
  if (!s || typeof api !== 'string' || !/^[A-Z0-9_]{3,64}$/.test(api)) return false;
  try { return s.achievement.activate(api) !== false; } catch { return false; }
});

// 3.5.1: el juego vuelve solo después de una caída (ver recuperacion-main.cjs). Con caídas
// repetidas de la placa, la próxima forma de iniciar los gráficos de INTENTOS_GRAFICOS.
const { registrarRecuperacion, siguienteGraficosPorCaidas } = require('./recuperacion-main.cjs');
const recuperacion = registrarRecuperacion({
  app, dialog, escribirCrash, index: path.join(__dirname, 'index.html'), ventanaActual: () => ventanaPrincipal,
  cambiarGraficos: () => {
    const siguiente = siguienteGraficosPorCaidas(INTENTOS_GRAFICOS, intentoGraficos());
    if (siguiente < 0) return false;
    try { fs.writeFileSync(archivoGraficos(), JSON.stringify({ intento: siguiente, porCaidas: true })); } catch { return false; }
    return true;
  },
});

// 1.11: la partida en una carpeta sincronizada (ver sincronia-main.cjs y src/sincronia.js)
require('./sincronia-main.cjs').registrarSincronia({ ipcMain, dialog, app, ventana: () => ventanaPrincipal, alError: (m) => escribirCrash('sync', m) });

const { cuidarVentana } = require('./ventana-main.cjs');

app.whenReady().then(() => {
  if (!primeraInstancia) return;   // 3.5.4: la segunda copia no abre nada (ver arriba)
  const build = reconstruirBundleSiHaceFalta();
  if (!build.ok) {
    dialog.showErrorBox(
      'Hojarasca no pudo actualizarse',
      `Hay archivos fuente más nuevos que index.html, pero la recompilación falló (${build.error}).\n\nEjecutá npm install y luego npm run armar. Para evitar confusiones, no se abrirá un build antiguo.`
    );
    app.quit();
    return;
  }
  // 3.5.3: sin el menú oculto que Electron pone por defecto. Sus atajos le ganaban al juego:
  // agachado con Ctrl y caminando con W (Ctrl+W) cerraba la ventana como si fuera un crash;
  // Ctrl+R recargaba y Ctrl+M minimizaba. F11 (pantalla completa) lo maneja crearVentana.
  Menu.setApplicationMenu(null);
  crearVentana();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) crearVentana(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
