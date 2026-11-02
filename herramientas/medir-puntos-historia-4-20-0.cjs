// 4.20.0 (auditoría B): saca de una partida real de la Historia los datos que Node no puede armar solo (los lugares con nombre que mira la
// Historia, las paradas y el largo de la vía de la trochita, el sendero) y lo que se ve en pantalla en el primer minuto (los dos paneles de
// objetivos). No cambia el juego ni juega nada: carga, empieza el capítulo 1, mira, guarda un JSON y una captura y sale.
// Uso (con el candado de Electron tomado): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\medir-puntos-historia-4-20-0.ps1
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
setTimeout(() => { console.log('ERROR: tardó más de 6 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 6 * 60 * 1000).unref?.();

const LEER = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, P = H.progreso, J = H.jugador;
  const r1 = (v) => Math.round(v * 10) / 10;
  const lug = {};
  for (const [k, l] of Object.entries(T.lugares)) if (l && Number.isFinite(l.x)) lug[k] = { x: r1(l.x), z: r1(l.z) };
  const est = T.lugares.estacion;
  if (est && est.espera) lug['estacion-espera'] = { x: r1(est.espera.x), z: r1(est.espera.z) };
  const pts = {};
  try { for (const [k, q] of Object.entries(H.__puntosHistoria())) if (q && Number.isFinite(q.x)) pts[k] = { x: r1(q.x), z: r1(q.z) }; } catch (e) { pts.__error = String(e); }
  const tren = H.tren;
  let t = null;
  try {
    t = { largo: tren.largo, objetivo: tren.est && tren.est.objetivo, paradas: (tren.paradas || []).map((p) => ({ nombre: p.nombre, aldea: !!p.aldea, metros: p.metros, x: p.x && r1(p.x), z: p.z && r1(p.z) })) };
  } catch (e) { t = { error: String(e) }; }
  const sendero = (T.sendero || []).map((p) => [r1(p.x !== undefined ? p.x : p[0]), r1(p.z !== undefined ? p.z : p[1])]);
  const riel = (T.riel || []).map((p) => [r1(p.x !== undefined ? p.x : p[0]), r1(p.z !== undefined ? p.z : p[1])]);
  const txt = (id) => { const e = document.getElementById(id); return e && !e.classList.contains('oculto') ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
  const tar = document.getElementById('valle-tarjeta');
  return {
    dia: P.dia, horas: P.horas, pos: { x: r1(J.estado.pos.x), z: r1(J.estado.pos.z) }, enTren: !!J.estado.enTren, duracion: H.ajustes.duracion,
    lugares: lug, puntos: pts, tren: t, sendero, riel,
    tutorial: txt('tutorial'), historiaHud: txt('historia-hud'),
    tarjeta: tar && !tar.classList.contains('oculto') ? tar.textContent.replace(/\s+/g, ' ').trim().slice(0, 900) : null,
    hudOtros: ['ramas', 'objetivo', 'brujula', 'mapa-mini', 'notas'].map((id) => { const e = document.getElementById(id); return [id, !!e, e ? !e.classList.contains('oculto') : false]; }),
    teclas: [...document.querySelectorAll('#hud kbd')].length,
  };
})()`;

app.whenReady().then(async () => {
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 60 s')), 60000))]);
  const url = path.join(raiz, 'index.html');
  let codigo = 0;
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', musica: false, modo: 'relax', relaxTipo: 'historia', autoCalidad: false })); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    let listo = false;
    for (let i = 0; i < 120 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(5000);
    // la tarjeta de entrada del capítulo 1 y los paneles tal como los ve quien recién empieza
    const primera = await js(LEER);
    await js(`(() => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="empezar"]'); if (b) b.click(); return 1 })()`);
    await esperar(2500);
    const despues = await js(LEER);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, 'primer-minuto.png'), img.toPNG());
    const datos = { primera: { dia: primera.dia, horas: primera.horas, pos: primera.pos, enTren: primera.enTren, tarjeta: primera.tarjeta, tutorial: primera.tutorial, historiaHud: primera.historiaHud }, despues };
    fs.writeFileSync(path.join(salida, 'puntos-historia.json'), JSON.stringify(datos));
    console.log('guardado', path.join(salida, 'puntos-historia.json'));
    console.log('hora de partida', primera.dia, primera.horas, 'enTren', primera.enTren, 'duración', primera.duracion);
    console.log('tarjeta:', primera.tarjeta);
    console.log('paneles tras empezar:', 'tutorial=', despues.tutorial, '| historia=', despues.historiaHud);
    console.log('puntos:', Object.keys(despues.puntos).length, 'tren:', JSON.stringify(despues.tren));
  } catch (e) { console.log('ERROR:', e && e.stack || e); codigo = 1; }
  try { app.exit(codigo); } catch { process.exit(codigo); }
});
