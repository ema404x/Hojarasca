// Manda toda ventana que abra una prueba o herramienta al monitor externo (no a la pantalla de la
// notebook). Se carga sin tocar cada prueba: NODE_OPTIONS="--require <este archivo>" antes de
// `npx electron ...`. Si no hay monitor externo, no hace nada. Las ventanas ocultas siguen ocultas.
// Para elegir otro: HOJ_PANTALLA=<parte del nombre> (p. ej. LS22D300G); HOJ_PANTALLA=no lo apaga.
let electron;
try { electron = require('electron'); } catch { electron = null; }
const { app, screen } = electron && typeof electron === 'object' ? electron : {};
if (app && screen && process.env.HOJ_PANTALLA !== 'no') {
  const elegir = () => {
    const todas = screen.getAllDisplays();
    const nombre = process.env.HOJ_PANTALLA;
    return (nombre && todas.find((d) => (d.label || '').includes(nombre)))
      || todas.find((d) => d.internal === false)
      || todas.find((d) => d.id !== screen.getPrimaryDisplay().id) || null;
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
