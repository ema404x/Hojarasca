// Manda toda ventana que abra una prueba o herramienta al monitor externo (no a la pantalla de la
// notebook). Se carga sin tocar cada prueba: NODE_OPTIONS="--require <este archivo>" antes de
// `npx electron ...`. Si no hay monitor externo, no hace nada. Las ventanas ocultas siguen ocultas.
// Para elegir otro: HOJ_PANTALLA=<parte del nombre> (p. ej. LS22D300G); HOJ_PANTALLA=no lo apaga.
let electron;
try { electron = require('electron'); } catch { electron = null; }
// (3.9.0: `screen` no se puede pedir antes de que la app esté lista: destructurarlo acá tiraba un error en el proceso principal y la ventana de
// error dejaba todo colgado. Se pide al usar, y siempre después de `ready`)
const app = electron && typeof electron === 'object' ? electron.app : null;
if (app && process.env.HOJ_PANTALLA !== 'no') {
  const pantalla = () => electron.screen;
  const elegir = () => {
    const screen = pantalla(), todas = screen.getAllDisplays();
    const nombre = process.env.HOJ_PANTALLA;
    return (nombre && todas.find((d) => (d.label || '').includes(nombre)))
      || todas.find((d) => d.internal === false)
      || todas.find((d) => d.id !== pantalla().getPrimaryDisplay().id) || null;
  };
  const mover = (w) => {
    try {
      const d = elegir();
      if (!d || w.isDestroyed()) return;
      const b = w.getBounds(), a = d.workArea;
      const ancho = Math.min(b.width, a.width), alto = Math.min(b.height, a.height);
      const destino = { x: a.x + Math.round((a.width - ancho) / 2), y: a.y + Math.round((a.height - alto) / 2), width: ancho, height: alto };
      // (dos veces: al cruzar a una pantalla con otra escala, Windows reescala la primera)
      w.setBounds(destino); w.setBounds(destino);
    } catch {}
  };
  app.on('browser-window-created', (_e, w) => {
    mover(w);
    // algunas pruebas o el juego reacomodan la ventana al mostrarla: se vuelve a mandar una vez
    w.once('ready-to-show', () => mover(w));
    w.once('show', () => mover(w));
  });
}
