// 3.5.1: el juego vuelve solo cuando se cae. Lo usa main.cjs (proceso principal de Electron).
//
// - Se cae el proceso de la página (render-process-gone: memoria, driver, lo que sea): se anota
//   en el registro de caídas (como siempre) y se vuelve a abrir la ventana con
//   `?recuperado=caida`: el juego carga la última partida guardada (cada 20 s) y lo avisa.
//   Más de MAX caídas en VENTANA_MS ya es un bucle de caídas: se pregunta antes de seguir.
// - La página no responde (unresponsive) y sigue así ESPERA_COLGADA_MS: se la reinicia
//   (forcefullyCrashRenderer), y eso es una caída más.
// - Se cae el proceso de la GPU (child-process-gone, tipo GPU): Chromium lo relanza solo y la
//   página recupera el contexto 3D (ver "caídas" en src/main.js). Si se cae UMBRAL_GPU veces en
//   VENTANA_MS, se pasa a la próxima forma de iniciar los gráficos de 2.7.3 (INTENTOS_GRAFICOS,
//   la próxima con otro `use-angle`): se pide guardar, y el juego se reinicia con ella.

const MAX_CAIDAS = 3;
const UMBRAL_GPU = 2;
const VENTANA_MS = 5 * 60 * 1000;
const ESPERA_COLGADA_MS = 20000;

// Cuenta caídas en una ventana de tiempo (pura: el reloj se le pasa, para las pruebas)
function crearVigia({ ventanaMs = VENTANA_MS, ahora = Date.now } = {}) {
  const marcas = [];
  const limpiar = (t) => { while (marcas.length && t - marcas[0] > ventanaMs) marcas.shift(); };
  return {
    anotar() { const t = ahora(); marcas.push(t); limpiar(t); return marcas.length; },
    recientes() { limpiar(ahora()); return marcas.length; },
    olvidar() { marcas.length = 0; },
  };
}

// Qué hacer con una caída de la página: 'nada' (cerró bien), 'recargar' o 'preguntar'
function decidirCaida(motivo, recientes, max = MAX_CAIDAS) {
  if (motivo === 'clean-exit') return 'nada';
  return recientes > max ? 'preguntar' : 'recargar';
}

// La próxima forma de iniciar los gráficos que cambia de verdad cómo se habla con la placa
// (otro `use-angle`); -1 si no queda ninguna. Se saltea d3d9: ANGLE sobre Direct3D 9 sólo da
// WebGL 1 y three r186 pide WebGL 2 (con d3d9 el 3D no arranca y la cadena de 2.7.3 pasa a la
// siguiente: un reinicio de más para el jugador).
function siguienteGraficosPorCaidas(intentos, actual) {
  const angle = (i) => (intentos[i] && intentos[i]['use-angle']) || 'por defecto';
  for (let j = actual + 1; j < intentos.length; j++) if (angle(j) !== angle(actual) && angle(j) !== 'd3d9') return j;
  return -1;
}
function decidirGpu(motivo, recientes, umbral = UMBRAL_GPU, hayOtra = true) {
  if (motivo === 'clean-exit') return 'nada';
  return recientes >= umbral && hayOtra ? 'cambiar-graficos' : 'esperar';
}

// opciones: { app, dialog, escribirCrash, index, ventanaActual, cambiarGraficos }
// cambiarGraficos(): guarda la próxima forma de iniciar los gráficos y devuelve si había
function registrarRecuperacion(op) {
  const { app, dialog, escribirCrash, index } = op;
  const caidas = crearVigia({ ventanaMs: op.ventanaMs || VENTANA_MS });
  const gpu = crearVigia({ ventanaMs: op.ventanaMs || VENTANA_MS });
  const max = op.max || MAX_CAIDAS, umbralGpu = op.umbralGpu || UMBRAL_GPU;
  const esperaColgada = op.esperaColgadaMs || ESPERA_COLGADA_MS;
  let saliendo = false, reiniciando = false;
  app.on('before-quit', () => { saliendo = true; });

  function recargar(ventana, motivo) {
    if (saliendo || !ventana || ventana.isDestroyed()) return;
    Promise.resolve(ventana.loadFile(index, { query: { recuperado: motivo } }))
      .catch((e) => escribirCrash('recuperacion', `no se pudo volver a abrir: ${e && e.message ? e.message : e}`));
  }

  function vigilar(ventana) {
    const wc = ventana.webContents;
    let colgada = null;
    const soltarColgada = () => { if (colgada) clearTimeout(colgada); colgada = null; };
    wc.on('render-process-gone', async (_e, d) => {
      soltarColgada();
      if (saliendo || reiniciando) return;
      const motivo = (d && d.reason) || 'desconocido';
      const n = motivo === 'clean-exit' ? 0 : caidas.anotar();
      const que = decidirCaida(motivo, n, max);
      if (que === 'nada') return;
      escribirCrash('recuperacion', `caída ${n} en ${Math.round((op.ventanaMs || VENTANA_MS) / 60000)} min (${motivo}) → ${que}`);
      if (que === 'recargar') { recargar(ventana, 'caida'); return; }
      let respuesta = 1;
      try {
        ({ response: respuesta } = await dialog.showMessageBox(ventana, {
          type: 'error', title: 'Hojarasca', buttons: ['Volver a abrir', 'Salir'], defaultId: 0, cancelId: 1, noLink: true,
          message: 'Hojarasca se cerró varias veces seguidas',
          detail: 'Tu partida está guardada. Si vuelve a pasar, probá bajar la calidad gráfica o actualizar el controlador de video. El detalle quedó en logs/hojarasca-crash.log.',
        }));
      } catch { respuesta = 1; }
      if (respuesta === 0) { caidas.olvidar(); recargar(ventana, 'caida'); } else app.quit();
    });
    wc.on('unresponsive', () => {
      if (saliendo || colgada) return;
      escribirCrash('recuperacion', 'la página dejó de responder');
      colgada = setTimeout(() => {
        colgada = null;
        if (ventana.isDestroyed()) return;
        escribirCrash('recuperacion', `sigue sin responder después de ${esperaColgada / 1000} s: se reinicia la página`);
        try { wc.forcefullyCrashRenderer(); } catch { recargar(ventana, 'caida'); }
      }, esperaColgada);
    });
    wc.on('responsive', soltarColgada);
  }

  app.on('child-process-gone', (_e, d) => {
    if (!d || d.type !== 'GPU' || saliendo || reiniciando) return;
    escribirCrash('gpu', `${d.reason || '?'} exitCode=${d.exitCode ?? '?'}`);
    const n = d.reason === 'clean-exit' ? 0 : gpu.anotar();
    if (decidirGpu(d.reason, n, umbralGpu, true) !== 'cambiar-graficos') return;
    if (!op.cambiarGraficos()) { escribirCrash('gpu', `se cayó ${n} veces y no quedan otras formas de iniciar los gráficos`); return; }
    reiniciando = true;
    escribirCrash('gpu', `se cayó ${n} veces: el juego se reinicia con la próxima forma de iniciar los gráficos`);
    const v = op.ventanaActual();
    try { if (v && !v.isDestroyed()) v.webContents.send('guardar-ya'); } catch { /* ya no está */ }
    setTimeout(() => {
      const args = process.argv.slice(1).filter((a) => !a.startsWith('--hojarasca-recuperado'));
      app.relaunch({ args: [...args, '--hojarasca-recuperado=graficos'] });
      app.quit();
    }, op.retrasoReinicioMs ?? 1500);
  });

  return { vigilar, caidas, gpu };
}

module.exports = { registrarRecuperacion, crearVigia, decidirCaida, decidirGpu, siguienteGraficosPorCaidas, MAX_CAIDAS, UMBRAL_GPU, VENTANA_MS, ESPERA_COLGADA_MS };
