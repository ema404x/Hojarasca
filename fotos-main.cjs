// 3.8.4: las fotos del álbum en archivos aparte, en la carpeta de cada partida (preparando la nube de Steam: lo que
// queda en el localStorage de Chromium no se puede sincronizar archivo por archivo).
//   <datos del usuario>/partidas/<partida>/fotos/<id>.jpg
// `<partida>` sale de la clave de las fotos de guardado.js (`hojarasca-fotos-v1` → `hojarasca`, `hojarasca-desafio-p2-fotos-v1`
// → `hojarasca-desafio-p2`). Cada foto, un archivo con su id de nombre (si el id trae algo raro, en hexadecimal con `_`
// adelante). La página las pide por preload.cjs (`hojarasca.fotos`), de forma sincrónica como el localStorage de antes.
const fs = require('fs');
const path = require('path');

const CLAVE = /^hojarasca[a-z0-9-]{0,40}-fotos-v1$/;
const ID_SIMPLE = /^[a-z0-9-]{1,60}$/i;
const TIPOS = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const TOPE_FOTO = 8 * 1024 * 1024;   // una miniatura pesa decenas de KB: más que esto no es una foto del álbum
const TOPE_FOTOS = 400;

function carpetaFotos(base, clave) {
  if (typeof base !== 'string' || !base || typeof clave !== 'string' || !CLAVE.test(clave)) return null;
  return path.join(base, 'partidas', clave.slice(0, -'-fotos-v1'.length), 'fotos');
}
const nombreDeId = (id) => (ID_SIMPLE.test(id) ? id : `_${Buffer.from(String(id), 'utf8').toString('hex')}`);
function idDeNombre(nombre) {
  if (nombre.startsWith('_')) { try { return Buffer.from(nombre.slice(1), 'hex').toString('utf8') || null; } catch { return null; } }
  return ID_SIMPLE.test(nombre) ? nombre : null;
}
// '{ mime, datos (Buffer) }' de un data URL de imagen, o null
function deDataUrl(url) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(typeof url === 'string' ? url : '');
  if (!m) return null;
  const datos = Buffer.from(m[2], 'base64');
  return datos.length && datos.length <= TOPE_FOTO ? { mime: m[1], datos } : null;
}

// Todas las fotos de una partida: { id: dataURL }. Sin carpeta, {}; con una clave inválida, null.
function leerFotos(base, clave) {
  const dir = carpetaFotos(base, clave);
  if (!dir) return null;
  const salida = {};
  let nombres = [];
  try { nombres = fs.readdirSync(dir); } catch { return salida; }
  for (const archivo of nombres.slice(0, TOPE_FOTOS * 2)) {
    const m = /^(.+)\.(jpg|png|webp)$/.exec(archivo);
    if (!m) continue;
    const id = idDeNombre(m[1]);
    if (!id || id === '__proto__') continue;
    try {
      const datos = fs.readFileSync(path.join(dir, archivo));
      if (datos.length && datos.length <= TOPE_FOTO) salida[id] = `data:${TIPOS[m[2]]};base64,${datos.toString('base64')}`;
    } catch { /* la que no se puede leer, no está */ }
  }
  return salida;
}
// Deja en la carpeta exactamente estas fotos ({ id: dataURL }): escribe las nuevas o cambiadas (por un archivo
// temporal, así una a medio escribir nunca pisa la buena) y borra las que ya no están. true si quedó todo.
function escribirFotos(base, clave, fotos) {
  const dir = carpetaFotos(base, clave);
  if (!dir || !fotos || typeof fotos !== 'object' || Array.isArray(fotos)) return false;
  try { fs.mkdirSync(dir, { recursive: true }); } catch { return false; }
  let ok = true;
  const quedan = new Set();
  for (const [id, url] of Object.entries(fotos).slice(0, TOPE_FOTOS)) {
    const img = deDataUrl(url);
    if (!img || id === '__proto__') continue;
    const archivo = `${nombreDeId(id)}.${EXT[img.mime]}`;
    quedan.add(archivo);
    const destino = path.join(dir, archivo);
    try {
      if (fs.existsSync(destino) && fs.readFileSync(destino).equals(img.datos)) continue;
      const tmp = `${destino}.tmp`;
      fs.writeFileSync(tmp, img.datos);
      fs.renameSync(tmp, destino);
    } catch { ok = false; }
  }
  try { for (const archivo of fs.readdirSync(dir)) if (/\.(jpg|png|webp)$/.test(archivo) && !quedan.has(archivo)) fs.rmSync(path.join(dir, archivo), { force: true }); } catch { ok = false; }
  return ok;
}
function borrarFotos(base, clave) {
  const dir = carpetaFotos(base, clave);
  if (!dir) return false;
  try { fs.rmSync(dir, { recursive: true, force: true }); return true; } catch { return false; }
}

function registrarFotos({ ipcMain, app, alError = () => {} }) {
  const base = () => app.getPath('userData');
  const atender = (fn) => (evento, ...args) => { try { evento.returnValue = fn(...args); } catch (err) { alError(String(err?.stack || err)); evento.returnValue = null; } };
  ipcMain.on('fotos-leer', atender((clave) => leerFotos(base(), String(clave || ''))));
  ipcMain.on('fotos-escribir', atender((clave, fotos) => escribirFotos(base(), String(clave || ''), fotos)));
  ipcMain.on('fotos-borrar', atender((clave) => borrarFotos(base(), String(clave || ''))));
}

module.exports = { registrarFotos, carpetaFotos, leerFotos, escribirFotos, borrarFotos, nombreDeId, idDeNombre };
