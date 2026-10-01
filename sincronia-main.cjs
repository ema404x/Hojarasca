// 1.11: la partida en una carpeta sincronizada (ver src/sincronia.js), del lado de
// Electron. El juego sólo escribe y lee archivos con nombre fijo
// (hojarasca-relax-p1.hojarasca.json y parecidos) adentro de <carpeta elegida>/Hojarasca:
// nunca otra ruta que venga del renderer. Está aparte de main.cjs para que la prueba de
// humo pueda registrar los mismos manejadores.
const path = require('path');
const fs = require('fs');

const NOMBRE_SYNC = /^hojarasca-(relax|desafio)-p[1-3]\.hojarasca\.json$/;
const MAX_SYNC = 12 * 1024 * 1024;
// 3.1: el torneo de la semana (ver src/torneo.js y src/torneo-sync.js). Cada compu escribe
// sólo su archivo, con nombre fijo; se leen todos los que tengan ese formato de nombre.
const NOMBRE_TORNEO = /^hojarasca-torneo-[a-z0-9]{4,16}\.json$/;
const MAX_TORNEO = 256 * 1024;
const MAX_ARCHIVOS_TORNEO = 40;

// Cuándo se guardó la partida que hay en un archivo de la carpeta (0 si no se sabe).
function guardadoEnDe(texto) {
  try { return Number(JSON.parse(texto)?.cuerpo?.progreso?.guardadoEn) || 0; } catch { return 0; }
}
// ¿Se puede pisar lo que hay? Sólo si no es más nuevo que la última versión de la carpeta
// que esta computadora conoce (`base`): si no, lo dejó la otra computadora mientras esta
// seguía abierta, y pisarlo sería perder lo jugado allá.
function puedePisar(textoViejo, base) {
  const viejo = guardadoEnDe(textoViejo);
  return !viejo || viejo <= (Number(base) || 0);
}

function registrarSincronia({ ipcMain, dialog, app, ventana = () => null, alError = () => {} }) {
  const configSync = () => path.join(app.getPath('userData'), 'carpeta-sincronizada.json');
  function carpetaSync() {
    try {
      const c = JSON.parse(fs.readFileSync(configSync(), 'utf8')).carpeta;
      return typeof c === 'string' && c && fs.existsSync(c) ? c : null;
    } catch { return null; }
  }
  function destinoSync(nombre) {
    const c = carpetaSync();
    if (!c || !NOMBRE_SYNC.test(String(nombre || ''))) return null;
    const dir = path.join(c, 'Hojarasca');
    return { dir, ruta: path.join(dir, String(nombre)) };
  }
  // Devuelve true, false (no se pudo) o 'conflicto' (la carpeta tiene algo más nuevo).
  function escribirSync(nombre, texto, base = 0) {
    const d = destinoSync(nombre);
    const t = String(texto || '');
    if (!d || !t || t.length > MAX_SYNC) return false;
    try {
      if (fs.existsSync(d.ruta) && !puedePisar(fs.readFileSync(d.ruta, 'utf8'), base)) return 'conflicto';
      fs.mkdirSync(d.dir, { recursive: true });
      // primero a un temporal y después se renombra: el sincronizador nunca ve medio archivo
      const tmp = `${d.ruta}.tmp`;
      fs.writeFileSync(tmp, t, 'utf8');
      try { fs.renameSync(tmp, d.ruta); } catch { fs.writeFileSync(d.ruta, t, 'utf8'); fs.rmSync(tmp, { force: true }); }
      return true;
    } catch (e) {
      // 2.6.1: si falló a mitad (disco lleno), no se deja el temporal cortado en la carpeta
      try { fs.rmSync(`${d.ruta}.tmp`, { force: true }); } catch {}
      alError(String(e?.message || e)); return false;
    }
  }
  function elegirCarpeta(carpeta) {
    try {
      fs.mkdirSync(app.getPath('userData'), { recursive: true });
      // 2.6.1: por un temporal, así un corte a mitad no deja la configuración ilegible
      const tmp = `${configSync()}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ carpeta }));
      fs.renameSync(tmp, configSync());
    } catch (e) { alError(String(e?.message || e)); }
    return carpetaSync();
  }

  ipcMain.handle('sync-carpeta', () => carpetaSync());
  ipcMain.handle('sync-elegir', async () => {
    const r = await dialog.showOpenDialog(ventana(), { title: 'Carpeta sincronizada para Hojarasca', properties: ['openDirectory', 'createDirectory'] });
    if (r.canceled || !r.filePaths?.[0]) return carpetaSync();
    return elegirCarpeta(r.filePaths[0]);
  });
  ipcMain.handle('sync-olvidar', () => { try { fs.rmSync(configSync(), { force: true }); } catch {} return null; });
  ipcMain.handle('sync-escribir', (_evento, nombre, texto, base) => escribirSync(nombre, texto, base));
  // al cerrar la ventana no hay tiempo para una promesa: esta va sincrónica
  ipcMain.on('sync-escribir-ya', (evento, nombre, texto, base) => { evento.returnValue = escribirSync(nombre, texto, base); });
  // 3.1: el torneo. Escribir: sólo un nombre de torneo, por un temporal (el sincronizador
  // nunca ve medio archivo). Leer: todos los archivos del torneo que haya, chicos.
  function escribirTorneo(nombre, texto) {
    const c = carpetaSync();
    const n = String(nombre || ''), t = String(texto || '');
    if (!c || !NOMBRE_TORNEO.test(n) || !t || t.length > MAX_TORNEO) return false;
    const dir = path.join(c, 'Hojarasca'), ruta = path.join(dir, n), tmp = `${ruta}.tmp`;
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(tmp, t, 'utf8');
      try { fs.renameSync(tmp, ruta); } catch { fs.writeFileSync(ruta, t, 'utf8'); fs.rmSync(tmp, { force: true }); }
      return true;
    } catch (e) {
      try { fs.rmSync(tmp, { force: true }); } catch {}
      alError(String(e?.message || e)); return false;
    }
  }
  function leerTorneos() {
    const c = carpetaSync();
    if (!c) return null;
    const dir = path.join(c, 'Hojarasca');
    let nombres = [];
    try { nombres = fs.readdirSync(dir).filter((n) => NOMBRE_TORNEO.test(n)).sort().slice(0, MAX_ARCHIVOS_TORNEO); } catch { return []; }
    const salida = [];
    for (const n of nombres) {
      try {
        const ruta = path.join(dir, n);
        const st = fs.statSync(ruta);
        if (!st.isFile() || st.size > MAX_TORNEO) continue;
        salida.push({ nombre: n, texto: fs.readFileSync(ruta, 'utf8') });
      } catch {}
    }
    return salida;
  }
  ipcMain.handle('torneo-escribir', (_evento, nombre, texto) => escribirTorneo(nombre, texto));
  ipcMain.handle('torneo-leer', () => leerTorneos());
  ipcMain.handle('sync-leer', (_evento, nombre) => {
    const d = destinoSync(nombre);
    if (!d || !fs.existsSync(d.ruta)) return null;
    try { return fs.statSync(d.ruta).size > MAX_SYNC ? null : fs.readFileSync(d.ruta, 'utf8'); } catch { return null; }
  });
  return { carpetaSync, destinoSync, escribirSync, elegirCarpeta, escribirTorneo, leerTorneos };
}

module.exports = { registrarSincronia, puedePisar, guardadoEnDe, NOMBRE_SYNC, MAX_SYNC, NOMBRE_TORNEO, MAX_TORNEO };
