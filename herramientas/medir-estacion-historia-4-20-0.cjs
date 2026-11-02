// 4.20.0 (auditoría B): ¿cómo se ve el capítulo 9 (invierno) de la Historia con los ajustes de fábrica (Estación «Verano») y con «Que pasen solas»? Dos capturas del mismo lugar y la misma hora.
// No juega nada: pone la historia en el capítulo 9 a las 12, espera a que la estación se asiente, mira y guarda la captura. Uso con el candado (ver medir-puntos-historia-4-20-0.ps1).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'herramientas', 'datos-4-20-0-b'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HOJ_PERFIL) app.setPath('userData', path.resolve(process.env.HOJ_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 8 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 8 * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 60 s')), 60000))]);
  const url = path.join(raiz, 'index.html');
  const IDS = ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha', 'cuaderno', 'frios', 'golpea', 'arco', 'nevada', 'deshielo'];
  let codigo = 0;
  try {
    for (const estacion of ['verano', 'auto']) {
      await w.loadFile(url, { search: '?debug=1' });
      await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', musica: false, modo: 'relax', relaxTipo: 'historia', autoCalidad: false, guiaPrimerDia: false, estacion: '${estacion}' })); 1`);
      await w.loadFile(url, { search: '?debug=1' });
      await js('window.__sinPausaPorBlur = true; 1');
      let listo = false;
      for (let i = 0; i < 120 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
      if (!listo) throw new Error('el juego no cargó');
      await js(`document.getElementById('btn-entrar').click(); 1`);
      await esperar(4000);
      // el capítulo 9 (índice 8), jugando, lo anterior cerrado, a las 12, y el jugador en el refugio mirando el valle
      await js(`(() => { const H = window.__hojarasca, P = H.progreso, h = P.historia;
        const cerrar = (b) => { const t = document.querySelector('#valle-tarjeta button[data-valle-opcion]'); if (t) t.click(); };
        h.activa = true; h.empezada = 1; h.version = 2; h.capitulo = 8; h.fase = 'jugando'; h.base = { dia: P.dia, talados: 0, cocinadas: 0, cantos: 0 }; h.hechos = {}; h.momentos = {};
        ${JSON.stringify(IDS)}.slice(0, 8).forEach((k) => { h.cerrados[k] = P.dia - 1; });
        P.horas = 12; cerrar(); const L = H.T.lugares.refugio; H.jugador.ubicar(L.x + 6, L.z + 9, 0); return 1 })()`);
      for (let i = 0; i < 4; i++) { await js(`(() => { const t = document.querySelector('#valle-tarjeta button[data-valle-opcion]'); if (t) t.click(); return 1 })()`); await esperar(500); }
      // deja correr cuadros (la estación se acerca de a poco: 1,5 por segundo) y mira
      await js(`(async () => { const H = window.__hojarasca; H.ajustes.limiteFps = 'libre'; const t0 = performance.now(); while (performance.now() - t0 < 9000) { H.__bucle(); await new Promise((r) => setTimeout(r, 14)); } return 1 })()`);
      const dato = await js(`(() => { const H = window.__hojarasca; return { estacion: H.ajustes.estacion, capitulo: H.progreso.historia.capitulo, forzada: H.__valle && H.__valle.estacionForzada ? H.__valle.estacionForzada() : 'sin __valle', hora: H.progreso.horas } })()`);
      console.log(estacion, JSON.stringify(dato));
      await esperar(300);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, `capitulo9-${estacion}.png`), img.toPNG());
    }
    console.log('listo');
  } catch (e) { console.log('ERROR:', e && e.stack || e); codigo = 1; }
  try { app.exit(codigo); } catch { process.exit(codigo); }
});
