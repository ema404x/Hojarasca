const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hojarasca', {
  guardarFoto: (datos, nombre) => ipcRenderer.invoke('guardar-foto', datos, nombre),
  version: () => ipcRenderer.invoke('app-version'),
  plataforma: () => ipcRenderer.invoke('app-platform'),
  // 3.2: el refresco del monitor de la ventana (Hz), para el ritmo parejo
  refresco: () => ipcRenderer.invoke('pantalla-refresco'),
  salir: () => ipcRenderer.send('salir-juego'),
  // 2.7.3: el 3D no arrancó: el juego se reinicia probando otra forma (devuelve false si no quedan)
  fallaronGraficos: () => ipcRenderer.invoke('graficos-fallaron'),
  reportarError: (detalle) => ipcRenderer.send('reportar-error', String(detalle || '').slice(0, 12000)),
  // 3.5.1: el proceso principal pide guardar ya (antes de reiniciar por caídas de la placa)
  alPedirGuardar: (fn) => { if (typeof fn === 'function') ipcRenderer.on('guardar-ya', () => { try { fn(); } catch { /* el juego sigue */ } }); },
  // 3.5.4: la compu se suspende o se bloquea la pantalla: el juego se pausa (ver ventana-main.cjs)
  alPedirPausa: (fn) => { if (typeof fn === 'function') ipcRenderer.on('pausar-ya', () => { try { fn(); } catch { /* el juego sigue */ } }); },
  // 1.11: la partida en una carpeta sincronizada
  sync: {
    carpeta: () => ipcRenderer.invoke('sync-carpeta'),
    elegir: () => ipcRenderer.invoke('sync-elegir'),
    olvidar: () => ipcRenderer.invoke('sync-olvidar'),
    escribir: (nombre, texto, base) => ipcRenderer.invoke('sync-escribir', String(nombre || ''), String(texto || ''), Number(base) || 0),
    escribirYa: (nombre, texto, base) => ipcRenderer.sendSync('sync-escribir-ya', String(nombre || ''), String(texto || ''), Number(base) || 0),
    leer: (nombre) => ipcRenderer.invoke('sync-leer', String(nombre || '')),
    // 3.1: el torneo de la semana (un archivo por compu en la misma carpeta)
    torneoLeer: () => ipcRenderer.invoke('torneo-leer'),
    torneoEscribir: (nombre, texto) => ipcRenderer.invoke('torneo-escribir', String(nombre || ''), String(texto || '')),
  },
  // 1.10: logros de Steam (no hace nada si Steam no está)
  steam: {
    activar: (api) => ipcRenderer.invoke('steam-logro', String(api || '').slice(0, 64)),
    disponible: () => ipcRenderer.invoke('steam-disponible'),
  },
});

// 3.5.4: lo de la ventana que no es del juego. Va acá (antes que la página) para que valga
// también en la pantalla de carga.
// - Un archivo o una carpeta arrastrados sobre la ventana no se pueden soltar (main.cjs además
//   bloquea cualquier navegación que no sea al juego).
window.addEventListener('dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'; }, true);
window.addEventListener('drop', (e) => e.preventDefault(), true);
// - Alt+Espacio abre el menú de la ventana de Windows (Restaurar, Mover… Cerrar) y con ese menú
//   abierto la C (agacharse) elige "Cerrar": el juego se cerraba. La tecla igual le llega al
//   juego (saltar); sólo se le saca a Windows.
window.addEventListener('keydown', (e) => { if (e.altKey && e.code === 'Space') e.preventDefault(); }, true);
