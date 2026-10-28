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
const { intentoVigente, relanzar, cuidarErroresMain } = require('./recuperacion-main.cjs');
const archivoGraficos = () => path.join(app.getPath('userData'), 'graficos.json');
function intentoGraficos() {
  // 4.10.3 (P3): lo guardado por caídas de la placa vence a la semana (ver `intentoVigente`); la edad es la del archivo
  try {
    const a = archivoGraficos();
    return intentoVigente(JSON.parse(fs.readFileSync(a, 'utf8')), Date.now() - fs.statSync(a).mtimeMs, INTENTOS_GRAFICOS.length);
  } catch { return 0; }
}
for (const [clave, valor] of Object.entries(INTENTOS_GRAFICOS[intentoGraficos()])) {
  if (valor === true) app.commandLine.appendSwitch(clave); else app.commandLine.appendSwitch(clave, valor);
}
ipcMain.handle('graficos-fallaron', () => {
  // 4.10.4 (M7): se saltea d3d9 (sólo da WebGL 1 y el juego pide WebGL 2: era un reinicio de más que seguro fallaba; ver recuperacion-main.cjs)
  let siguiente = intentoGraficos() + 1;
  while (siguiente < INTENTOS_GRAFICOS.length && INTENTOS_GRAFICOS[siguiente]['use-angle'] === 'd3d9') siguiente++;
  if (siguiente >= INTENTOS_GRAFICOS.length) return false;
  try { fs.writeFileSync(archivoGraficos(), JSON.stringify({ intento: siguiente })); } catch { return false; }
  relanzar(app); app.exit(0);   // 4.10.4 (M2/M3): el portable vuelve por su exe, y se suelta el candado de instancia única
  return true;
});
if (process.platform === 'win32') app.setAppUserModelId('ar.hojarasca.juego');

// 3.5.4: con el juego ya abierto, abrirlo otra vez sólo trae al frente la ventana que hay. Antes
// la segunda copia igual llegaba a abrir su ventana (app.quit() antes de estar listo no frena
// whenReady) y cargaba el juego con el mismo perfil un par de segundos.
const primeraInstancia = app.requestSingleInstanceLock();
if (!primeraInstancia) app.quit();
// 3.8.9: antes la segunda copia se cerraba sin decir nada y se veía el juego que ya estaba abierto: con un Hojarasca viejo minimizado o
// colgado en segundo plano, abrir el instalado nuevo mostraba el viejo con el mismo número de versión. Ahora avisa.
if (!primeraInstancia) {
  try {
    dialog.showErrorBox('Hojarasca ya está abierto · Hojarasca is already running',
      `Ya hay un Hojarasca abierto y se muestra esa ventana (esta copia es la versión ${app.getVersion()}).\n\nSi ves una versión vieja del juego, cerrá todos los "Hojarasca.exe" desde el Administrador de tareas y abrilo de nuevo.\n\nHojarasca is already open (this copy is version ${app.getVersion()}). If the game on screen is an older version, close every "Hojarasca.exe" in Task Manager and start it again.`);
  } catch { /* sin cuadro: se cierra igual */ }
}
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
    const archivo = path.join(carpeta, 'hojarasca-crash.log');
    // 4.10.3 (P8): el registro tiene tope (1 MB): al pasarse se guarda como .1 (pisando el anterior) y se empieza de nuevo
    try { if (fs.statSync(archivo).size > 1024 * 1024) fs.renameSync(archivo, archivo + '.1'); } catch {}
    fs.appendFileSync(archivo, linea);
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
      // 4.10.4 (M1): en producción, el valor por defecto de Electron: minimizado o detrás de otro juego ya no dibuja el 3D ni le roba GPU
      // (y la página pasa a `hidden`: el guardado del visibilitychange corre). Las herramientas de medición lo apagan con HOJ_SIN_ESTRANGULAR=1 o HUMO_OCULTO=1.
      backgroundThrottling: !(process.env.HOJ_SIN_ESTRANGULAR === '1' || process.env.HUMO_OCULTO === '1'),
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
  cuidarPermisos(ventana.webContents.session);   // 3.8.6: sólo los permisos que usa el juego (ver ventana-main.cjs)
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
      // 3.8.6: mantenerla apretada repite la tecla: sólo cuenta la primera (prendía y apagaba la pantalla completa sin parar)
      if (!tecla.isAutoRepeat) ventana.setFullScreen(!ventana.isFullScreen());
      evento.preventDefault();
    }
  });
}

// Las fotos van a Imágenes/Hojarasca
const fotosEscribiendo = new Set();   // 3.8.6: los nombres que se están escribiendo (dos fotos seguidas)
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
  // 3.8.6: dos fotos en el mismo segundo no se pisan (la segunda reemplazaba a la primera: «Foto guardada» dos veces y
  // quedaba una): si el nombre ya está (o se está escribiendo), «-2», «-3»…
  let ruta = path.join(carpeta, `${base}.png`);
  for (let n = 2; (fs.existsSync(ruta) || fotosEscribiendo.has(ruta)) && n < 1000; n++) ruta = path.join(carpeta, `${base}-${n}.png`);
  fotosEscribiendo.add(ruta);
  // 2.6.1: asincrónico (una captura grande trababa el proceso principal) y por un
  // temporal: si falla a mitad no queda un PNG cortado.
  const tmp = `${ruta}.tmp`;
  try {
    await fs.promises.writeFile(tmp, buffer);
    await fs.promises.rename(tmp, ruta);
  } catch (e) { await fs.promises.rm(tmp, { force: true }).catch(() => {}); throw e; }
  finally { fotosEscribiendo.delete(ruta); }
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
// 3.8.4: las fotos del álbum, en archivos en la carpeta de la partida (ver fotos-main.cjs)
require('./fotos-main.cjs').registrarFotos({ ipcMain, app, alError: (m) => escribirCrash('fotos', m) });
// 4.15.0: la copia previa de las partidas que la Historia nueva reinicia (ver copias-main.cjs)
require('./copias-main.cjs').registrarCopias({ ipcMain, app, alError: (m) => escribirCrash('copias', m) });

const { cuidarVentana, cuidarPermisos } = require('./ventana-main.cjs');
// 4.10.4 (M3): los errores sin atrapar del proceso principal quedan en hojarasca-crash.log (antes: el cuadro de Electron y nada anotado)
cuidarErroresMain({ proceso: process, app, escribirCrash, ventanaActual: () => ventanaPrincipal });

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
