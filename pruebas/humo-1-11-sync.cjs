// Prueba de la carpeta sincronizada de punta a punta: el preload de verdad y los mismos
// manejadores que usa main.cjs (sincronia-main.cjs), con una carpeta temporal haciendo de
// OneDrive. Simula las dos computadoras: una deja la copia, la otra la encuentra.
// Uso: npx electron pruebas/humo-1-11-sync.cjs   → pruebas/salidas/1-11-sync/
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', '1-11-sync');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// una "computadora" nueva: datos de usuario y carpeta sincronizada en un temporal
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hojarasca-sync-'));
app.setPath('userData', path.join(tmp, 'datos'));
const nube = path.join(tmp, 'OneDrive');
fs.mkdirSync(nube, { recursive: true });

// la misma firma que src/transferir.js
function firmar(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

const { registrarSincronia } = require(path.join(raiz, 'sincronia-main.cjs'));
let elegida = nube;
const sync = registrarSincronia({ ipcMain, app, dialog: { showOpenDialog: async () => ({ canceled: false, filePaths: [elegida] }) } });
void dialog;
// lo demás que pide el preload, sin Steam ni nada
ipcMain.handle('app-version', () => 'prueba');
ipcMain.handle('app-platform', () => process.platform);
ipcMain.handle('steam-disponible', () => false);
ipcMain.handle('steam-logro', () => false);
ipcMain.handle('guardar-foto', () => path.join(salida, 'foto.png'));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: {
    preload: path.join(raiz, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  const preguntadas = [];
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if (m.startsWith('PREGUNTA: ')) preguntadas.push(m.slice(10));
    if ((e.level === 'error' || /Error|Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = '';
  const js = (c, limite = 60000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  // el confirm de la oferta se contesta solo: se registra qué preguntó
  const cargar = async (contestar = true) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`window.__preguntas=[]; window.confirm=(t)=>{window.__preguntas.push(String(t)); console.log('PREGUNTA: '+String(t).split(String.fromCharCode(10))[0]); return ${contestar};}; 1`).catch(() => {});
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  const archivo = path.join(nube, 'Hojarasca', 'hojarasca-relax-p1.hojarasca.json');

  try {
    donde = 'cargar';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', guiaPrimerDia:false})); 1`);
    ok(await cargar(), 'el Relax carga con el preload de escritorio');
    ok(await js(`!!window.hojarasca?.sync`), 'el juego ve la carpeta sincronizada (sólo en escritorio)');
    await esperar(1500);
    const panel = await js(`(()=>{const p=document.getElementById('partidas-sync'); return {visible:!p.classList.contains('oculto'), carpeta:document.getElementById('sync-carpeta').textContent}})()`);
    ok(panel.visible && /ninguna/.test(panel.carpeta), `en Partidas aparece la opción, sin carpeta todavía (${JSON.stringify(panel)})`);

    // ================================================================ elegir la carpeta: se copia enseguida
    donde = 'elegir';
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
    await js(`(()=>{const P=window.__hojarasca.progreso; P.dia=6; window.__hojarasca.guardar(); return 1})()`);
    await js(`document.getElementById('btn-sync-elegir').click(); 1`);
    let hay = false;
    for (let i = 0; i < 20 && !hay; i++) { await esperar(250); hay = fs.existsSync(archivo); }
    ok(hay, 'al elegir la carpeta se deja la primera copia en <carpeta>/Hojarasca');
    const copia = hay ? JSON.parse(fs.readFileSync(archivo, 'utf8')) : null;
    ok(copia?.formato === 'hojarasca-partida' && copia.cuerpo.progreso.dia === 6 && copia.firma === firmar(JSON.stringify(copia.cuerpo)), 'es una partida exportada, firmada, del día 6');
    ok(!fs.readdirSync(path.join(nube, 'Hojarasca')).some((f) => f.endsWith('.tmp')), 'sin temporales a medio escribir');
    const etiqueta = await js(`document.getElementById('sync-carpeta').textContent`);
    ok(etiqueta === nube, `el panel muestra la carpeta ("${etiqueta}")`);

    // ================================================================ el día pasa: dormir deja otra copia
    donde = 'dormir';
    await js(`(()=>{const H=window.__hojarasca; H.progreso.dia=7; H.guardar(); return H.__sync.copiarASync(true)})()`);
    await esperar(600);
    ok(JSON.parse(fs.readFileSync(archivo, 'utf8')).cuerpo.progreso.dia === 7, 'al dormir (copia forzada) la carpeta queda al día');
    const sinCambios = await js(`window.__hojarasca.__sync.copiarASync(true)`);
    ok(sinCambios === false, 'si no cambió nada, no se vuelve a escribir');
    const rechazo = await js(`window.hojarasca.sync.escribir('../afuera.json', '{}')`);
    ok(rechazo === false && !fs.existsSync(path.join(nube, 'afuera.json')), 'un nombre raro desde la página no escribe nada');

    // ================================================================ la otra computadora jugó más
    // (y esta quedó abierta: no tiene que pisar lo de allá, ni ahora ni al cerrarse)
    donde = 'otra máquina';
    const remota = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    remota.cuerpo.progreso.dia = 12;
    remota.cuerpo.progreso.guardadoEn = Date.now() + 3600e3;
    remota.firma = firmar(JSON.stringify(remota.cuerpo));
    remota.dia = 12;
    fs.writeFileSync(archivo, JSON.stringify(remota));
    await js(`(()=>{const H=window.__hojarasca; H.progreso.dia=8; H.guardar(); return H.__sync.copiarASync(true)})()`);
    await esperar(800);
    ok(JSON.parse(fs.readFileSync(archivo, 'utf8')).cuerpo.progreso.dia === 12, 'con la carpeta más nueva, esta computadora no la pisa');
    const avisoConflicto = await js(`[...document.querySelectorAll('.nota')].map(n=>n.textContent).join(' | ')`);
    ok(/tiene una partida más nueva/.test(avisoConflicto), 'y lo avisa');
    ok(await cargar(true), 'se cierra y se abre el juego de nuevo');
    const intacta = JSON.parse(fs.readFileSync(archivo, 'utf8')).cuerpo.progreso.dia;
    ok(intacta === 12 || intacta === undefined, `al cerrarse tampoco la pisó (día ${intacta})`);
    let dia = 0, preguntas = [];
    for (let i = 0; i < 40 && dia !== 12; i++) {
      await esperar(1000);
      dia = await js(`window.__hojarasca?.progreso?.dia||0`).catch(() => 0);
      if (preguntadas.length) preguntas = [...preguntadas];
    }
    ok(preguntas.some((q) => /partida más nueva: día 12/.test(q)), `pregunta si seguir con la de la carpeta ("${(preguntas[0] || '').slice(0, 90)}")`);
    // aceptada, se importa y el juego se recarga con la del día 12
    if (dia !== 12) { await esperar(3000); for (let i = 0; i < 60 && dia !== 12; i++) { await esperar(1000); dia = await js(`window.__hojarasca?.progreso?.dia||0`).catch(() => 0); } }
    ok(dia === 12, `con un sí, sigue con la del día 12 (${dia})`);

    // ================================================================ y si la de acá es más nueva, no pregunta
    donde = 'no molestar';
    const antesDeAbrir = preguntadas.length;
    ok(await cargar(true), 'se abre otra vez');
    await esperar(4000);
    const otra = preguntadas.length - antesDeAbrir;
    ok(otra === 0, `con la copia al día (aunque tenga la hora adelantada), no pregunta nada (${otra})`);

    // ================================================================ dejar de usarla
    donde = 'olvidar';
    await js(`document.getElementById('btn-sync-olvidar').click(); 1`); await esperar(800);
    const sinCarpeta = await js(`document.getElementById('sync-carpeta').textContent`);
    ok(/ninguna/.test(sinCarpeta) && sync.carpetaSync() === null, 'dejar de usarla olvida la carpeta');
    ok(fs.existsSync(archivo), 'y lo que quedó en la carpeta sigue ahí');
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  app.exit(errores.length ? 1 : 0);
});
