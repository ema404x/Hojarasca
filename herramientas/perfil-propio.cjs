// 3.7.1: cada partida real con su propio perfil de Electron, para poder correr varias a la vez
// (antes compartían el perfil por defecto y había que correrlas de a una). Se carga con
// `npx electron --no-sandbox -r herramientas/perfil-propio.cjs <prueba>` y HOJ_PERFIL=<carpeta>.
// Las pruebas que ya fijan su perfil (HUMO_PERFIL o setPath propio) lo siguen haciendo después.
let electron;
try { electron = require('electron'); } catch { electron = null; }
const app = electron && typeof electron === 'object' ? electron.app : null;
if (app && process.env.HOJ_PERFIL) {
  const path = require('path');
  const dir = path.resolve(process.env.HOJ_PERFIL);
  app.setPath('userData', dir);
  if (!process.env.HUMO_PERFIL) process.env.HUMO_PERFIL = dir;
}
