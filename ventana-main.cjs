// 3.5.4: la ventana del juego no se va a ningún lado. Lo usa main.cjs (proceso principal).
//
// - Sólo navega al juego mismo (index.html, con o sin ?recuperado=…): antes pasaba cualquier
//   file://, y un `location.href` a un archivo de la compu (o un archivo soltado sobre la ventana)
//   la llevaba a ese archivo: el juego desaparecía sin guardar ni dejar registro.
// - Sin historial: cada recuperación (recuperacion-main.cjs) cargaba otra entrada, y un "atrás"
//   volvía a abrir el juego de antes (sin la partida de los últimos segundos).
// - Si Windows cierra la sesión, se apaga o la compu se suspende, se pide guardar ya y se baja a
//   disco lo guardado (al apagar no llega el cierre normal de la ventana). Al suspender o
//   bloquear la pantalla, además, el juego se pausa: al volver no sigue la noche del Desafío.

const path = require('path');
const { fileURLToPath } = require('url');

// ¿La dirección es la del juego? (el mismo index.html, sin importar ?búsqueda ni #)
function esElJuego(url, index) {
  try {
    const u = new URL(String(url));
    if (u.protocol !== 'file:') return false;
    const ruta = path.normalize(fileURLToPath(u));
    const juego = path.normalize(index);
    return process.platform === 'win32' ? ruta.toLowerCase() === juego.toLowerCase() : ruta === juego;
  } catch { return false; }
}

// opciones: { ventana, index, escribirCrash, powerMonitor }
function cuidarVentana({ ventana, index, escribirCrash = () => {}, powerMonitor = null }) {
  const wc = ventana.webContents;
  wc.on('will-navigate', (evento, url) => {
    if (esElJuego(url, index)) return;
    evento.preventDefault();
    escribirCrash('ventana', `navegación bloqueada: ${String(url).slice(0, 300)}`);
  });
  wc.on('did-finish-load', () => { try { wc.navigationHistory.clear(); } catch { /* sin historial que borrar */ } });

  const vivo = () => !ventana.isDestroyed() && !wc.isDestroyed();
  const bajarADisco = () => { try { if (vivo()) wc.session.flushStorageData(); } catch { /* ya no está */ } };
  const pedirGuardar = (pausar) => {
    if (!vivo()) return;
    try { if (pausar) wc.send('pausar-ya'); wc.send('guardar-ya'); } catch { /* ya no está */ }
    // lo que el juego escribe en localStorage llega al proceso principal un momento después
    setTimeout(bajarADisco, 400);
  };
  // Windows: cerrar sesión, reiniciar o apagar (no llega el beforeunload de la página)
  ventana.on('query-session-end', () => { escribirCrash('ventana', 'Windows cierra la sesión: se guarda'); pedirGuardar(false); });
  ventana.on('session-end', bajarADisco);
  const alSuspender = () => pedirGuardar(true);
  if (powerMonitor) {
    powerMonitor.on('suspend', alSuspender);
    powerMonitor.on('lock-screen', alSuspender);
    ventana.on('closed', () => { powerMonitor.removeListener('suspend', alSuspender); powerMonitor.removeListener('lock-screen', alSuspender); });
  }
  return { esElJuego: (url) => esElJuego(url, index), pedirGuardar };
}

module.exports = { esElJuego, cuidarVentana };
