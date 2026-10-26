// 1.11: la partida en una carpeta sincronizada (ver src/sincronia.js), del lado de
// Electron. El juego sólo escribe y lee archivos con nombre fijo
// (hojarasca-relax-p1.hojarasca.json y parecidos) adentro de <carpeta elegida>/Hojarasca:
// nunca otra ruta que venga del renderer. Está aparte de main.cjs para que la prueba de
// humo pueda registrar los mismos manejadores.
const path = require('path');
const fs = require('fs');

const NOMBRE_SYNC = /^hojarasca-(relax|desafio)-p[1-3]\.hojarasca\.json$/;
const MAX_SYNC = 64 * 1024 * 1024;   // 3.8.6: como MAX_BYTES de transferir.js (antes 12 MB: unas 400 fotos)
// 4.5.1: se sacó el torneo de la semana: los archivos hojarasca-torneo-<pc>.json que hayan quedado en la carpeta no se
// leen, no se escriben y no se borran (no tienen el nombre de una partida: NOMBRE_SYNC no los toma).

// Cuándo se guardó la partida que hay en un archivo de la carpeta (0 si no se sabe).
function guardadoEnDe(texto) {
  try { const g = Number(JSON.parse(texto)?.cuerpo?.progreso?.guardadoEn); return Number.isFinite(g) && g > 0 ? g : 0; } catch { return 0; }   // 4.10.4 (M9): un `Infinity` (1e400) trababa para siempre las escrituras
}
// ¿Se puede pisar lo que hay? Sólo si no es más nuevo que la última versión de la carpeta
// que esta computadora conoce (`base`): si no, lo dejó la otra computadora mientras esta
// seguía abierta, y pisarlo sería perder lo jugado allá.
function puedePisar(textoViejo, base) {
  const viejo = guardadoEnDe(textoViejo);
  return !viejo || viejo <= (Number(base) || 0);
}

// 3.8.6: las «copias en conflicto» que deja el programa de sincronización cuando las dos computadoras cambiaron el archivo a
// la vez («hojarasca-relax-p1 (1).hojarasca.json», «… (conflicted copy …).json», «….sync-conflict-….json», «…-PC.json»).
// El juego nunca las lee ni las pisa: sólo avisa que están (ver mirarCarpetaSync en main.js).
function copiasEnConflicto(nombres, nombre) {
  const n = String(nombre || '');
  if (!NOMBRE_SYNC.test(n)) return [];
  const raiz = n.slice(0, -'.hojarasca.json'.length);
  return (Array.isArray(nombres) ? nombres : [])
    .filter((x) => typeof x === 'string' && x !== n && x.startsWith(raiz) && /\.json$/i.test(x) && !NOMBRE_SYNC.test(x) && !/\.tmp$/i.test(x)
      && !/^[0-9]/.test(x.slice(raiz.length)))   // (la partida 1 no se confunde con otra que empiece igual)
    .sort().slice(0, 10);
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
      // 4.11.3 (M8): si el `rename` falla (el sincronizador suele tener el archivo tomado) NO se escribe directo sobre la copia buena: una
      // escritura a medias la dejaba rota. Se tira el temporal, queda la copia anterior y se devuelve false; el juego reintenta en el próximo guardado.
      try { fs.renameSync(tmp, d.ruta); } catch (e) { try { fs.rmSync(tmp, { force: true }); } catch {} alError(String(e?.message || e)); return false; }
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
  ipcMain.handle('sync-conflictos', (_evento, nombre) => {   // 3.8.6
    const d = destinoSync(nombre);
    if (!d) return [];
    try { return copiasEnConflicto(fs.readdirSync(d.dir), nombre); } catch { return []; }
  });
  ipcMain.handle('sync-leer', (_evento, nombre) => {
    const d = destinoSync(nombre);
    if (!d || !fs.existsSync(d.ruta)) return null;
    try { return fs.statSync(d.ruta).size > MAX_SYNC ? null : fs.readFileSync(d.ruta, 'utf8'); } catch { return null; }
  });
  return { carpetaSync, destinoSync, escribirSync, elegirCarpeta };
}

module.exports = { registrarSincronia, copiasEnConflicto, puedePisar, guardadoEnDe, NOMBRE_SYNC, MAX_SYNC };
