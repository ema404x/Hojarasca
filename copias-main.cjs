// 4.15.0: la copia previa de una partida que la Historia nueva reinicia (ver src/historia-reinicio.js). Un archivo aparte, recuperable, en la
// carpeta de datos del usuario:  <datos del usuario>/partidas/<partida>/copias/<nombre>.json
// `<partida>` es la misma de las fotos (`hojarasca`, `hojarasca-p2`…). Nunca pisa una copia que ya existe: si el nombre está ocupado, le suma
// un número. La página la pide por preload.cjs (`hojarasca.copias.escribir`), de forma sincrónica.
const fs = require('fs');
const path = require('path');

const PARTIDA = /^hojarasca[a-z0-9-]{0,40}$/;
const NOMBRE = /^copia-previa-historia-[a-z0-9.-]{1,80}\.json$/;
const TOPE = 64 * 1024 * 1024;   // una partida pesa decenas de KB: más que esto no es una partida

function carpetaCopias(base, partida) {
  if (typeof base !== 'string' || !base || typeof partida !== 'string' || !PARTIDA.test(partida)) return null;
  return path.join(base, 'partidas', partida, 'copias');
}
// Devuelve el nombre con que quedó escrita, o null
function escribirCopia(base, partida, nombre, texto) {
  const dir = carpetaCopias(base, partida);
  if (!dir || typeof nombre !== 'string' || !NOMBRE.test(nombre) || typeof texto !== 'string' || !texto.length || texto.length > TOPE) return null;
  fs.mkdirSync(dir, { recursive: true });
  let final = nombre, n = 1;
  while (fs.existsSync(path.join(dir, final))) { n += 1; final = nombre.replace(/\.json$/, `-${n}.json`); if (n > 99) return null; }
  fs.writeFileSync(path.join(dir, final), texto, 'utf8');
  return final;
}
function registrarCopias({ ipcMain, app, alError = () => {} }) {
  ipcMain.on('copia-escribir', (evento, partida, nombre, texto) => {
    try { evento.returnValue = escribirCopia(app.getPath('userData'), String(partida || ''), String(nombre || ''), String(texto || '')); }
    catch (err) { alError(String(err?.stack || err)); evento.returnValue = null; }
  });
}

module.exports = { registrarCopias, carpetaCopias, escribirCopia };
