// Partida real 4.26.5 (B): cacería de bugs en el pueblo construido (la Aldea: casas, puestos, andén, plaza). Entra a la Historia (o al Desafío con HUMO_MODO=desafio), con el reloj
// determinista, y corre el guion que se le pase en HUMO_GUION (un .cjs que exporta `async ({ N, js, foto, ok, w, sal }) => {...}`); sin guion corre los controles de la versión (verificados
// a ojo en las capturas). Las comprobaciones de la página están en `PAGINA` (window.__N).
// Uso (después de `node armar.mjs`, con el candado de Electron): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-26-5-b.ps1
//   HUMO_GUION=<guion.cjs> · HUMO_ALTA=1 (calidad alta) · HUMO_CAL=baja|media|alta · HUMO_MODO=desafio · HUMO_CAPTURAS=0 · HTML=<otro index.html>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const { DETERMINISTA } = require(path.join(raiz, 'pruebas', 'ayuda-determinista.cjs'));
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-26-5-b'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HOJ_PERFIL) app.setPath('userData', path.resolve(process.env.HOJ_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';
const DESAFIO = process.env.HUMO_MODO === 'desafio';

// (sin comillas invertidas adentro: el guion de la página va entero en un String.raw)
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, P = H.progreso;
  const N = window.__N = {};
  const r2 = (v) => Math.round(v * 100) / 100;
  N.r2 = r2;
  N.cuadros = (n, ms = 50) => window.__cuadros(n, ms);
  N.programas = () => H.renderer.info.programs.length;
  N.tarjetas = () => { for (let i = 0; i < 4; i++) { const b = document.querySelector('#valle-tarjeta:not(.oculto) button[data-valle-opcion]'); if (!b) break; b.click(); N.cuadros(8); } return 1; };
  N.despejar = () => { const d = H.__escenas && H.__escenas.director; for (let i = 0; i < 8 && d && d.activa(); i++) { d.saltar(); N.cuadros(10); } N.tarjetas(); return 1; };
  N.sinUi = (si) => { let s = document.getElementById('sin-ui'); if (si && !s) { s = document.createElement('style'); s.id = 'sin-ui'; s.textContent = 'body > *:not(#mundo){visibility:hidden !important}'; document.head.appendChild(s); } if (!si && s) s.remove(); return 1; };
  N.aldea = () => H.__aldeaMundo();
  // el jugador a (x, z) mirando hacia (mx, mz)
  N.ir = (x, z, mx, mz) => { const j = H.jugador; j.ubicar(x, z, mx === undefined ? 0 : Math.atan2(-(mx - x), -(mz - z))); j.estado.sentado = false; N.cuadros(2); return 1; };
  // caminar con el jugador de verdad (la tecla W y el giro hacia la meta) hasta llegar a menos de 0,5 m o pasar el tiempo; devuelve el recorrido
  N.caminar = (mx, mz, maxSeg = 8, corre = false) => {
    const j = H.jugador, e = j.estado, t0 = { x: e.pos.x, z: e.pos.z };
    let ult = { x: e.pos.x, z: e.pos.z }, quieto = 0, minY = e.pos.y, maxY = e.pos.y, saltos = 0, yPrev = e.pos.y;
    j.teclas.add('KeyW'); if (corre) j.teclas.add('ShiftLeft');
    let n = 0;
    for (; n < maxSeg * 20; n++) {
      e.yaw = Math.atan2(-(mx - e.pos.x), -(mz - e.pos.z)); e.pitch = 0;
      N.cuadros(1, 50);
      if (Math.hypot(mx - e.pos.x, mz - e.pos.z) < 0.5) break;
      if (n % 10 === 9) { if (Math.hypot(e.pos.x - ult.x, e.pos.z - ult.z) < 0.15) quieto++; else quieto = 0; ult = { x: e.pos.x, z: e.pos.z }; if (quieto >= 2) break; }
      minY = Math.min(minY, e.pos.y); maxY = Math.max(maxY, e.pos.y); if (Math.abs(e.pos.y - yPrev) > 0.5) saltos++; yPrev = e.pos.y;
    }
    j.teclas.delete('KeyW'); j.teclas.delete('ShiftLeft'); N.cuadros(1, 50);
    const d = Math.hypot(mx - e.pos.x, mz - e.pos.z);
    return { llego: d < 0.6, falta: r2(d), seg: r2(n / 20), trabado: quieto >= 2, x: r2(e.pos.x), y: r2(e.pos.y), z: r2(e.pos.z), saltosY: saltos };
  };
  N.hora = (h) => { P.horas = h; N.cuadros(3); return 1; };
  // caminar con el jugador de verdad y su física (sin dibujar): más rápido que N.caminar; empuja las puertas como el bucle. Sin escena activa (si no, el jugador no se mueve).
  N.pasos = (mx, mz, maxSeg = 10, corre = false) => {
    const j = H.jugador, e = j.estado, dt = 1 / 30;
    let ult = { x: e.pos.x, z: e.pos.z }, quieto = 0, n = 0, minY = e.pos.y, maxY = e.pos.y;
    const y0 = e.pos.y;
    j.teclas.add('KeyW'); if (corre) j.teclas.add('ShiftLeft');
    for (; n < maxSeg * 30; n++) {
      e.yaw = Math.atan2(-(mx - e.pos.x), -(mz - e.pos.z)); e.pitch = 0;
      j.actualizar(dt); H.puertas.actualizar(dt);
      const p = H.puertas.cerca(e.pos, 1.7);
      if (p && !p.postigo && p.objetivo < 0.5 && e.velocidadActual > 0.6) { const hacia = Math.atan2(-(p.x - e.pos.x), -(p.z - e.pos.z)); if (Math.abs(Math.atan2(Math.sin(hacia - e.yaw), Math.cos(hacia - e.yaw))) < 0.7) H.puertas.accionar(p); }
      if (Math.hypot(mx - e.pos.x, mz - e.pos.z) < 0.4) break;
      if (n % 15 === 14) { if (Math.hypot(e.pos.x - ult.x, e.pos.z - ult.z) < 0.12) quieto++; else quieto = 0; ult = { x: e.pos.x, z: e.pos.z }; if (quieto >= 3) break; }
      minY = Math.min(minY, e.pos.y); maxY = Math.max(maxY, e.pos.y);
    }
    j.teclas.delete('KeyW'); j.teclas.delete('ShiftLeft'); j.actualizar(dt);
    const d = Math.hypot(mx - e.pos.x, mz - e.pos.z);
    return { llego: d < 0.6, falta: r2(d), seg: r2(n / 30), trabado: quieto >= 3, x: r2(e.pos.x), y: r2(e.pos.y), z: r2(e.pos.z), sube: r2(maxY - y0), baja: r2(y0 - minY) };
  };
  N.quieto = (x, z, yaw = 0) => { H.jugador.ubicar(x, z, yaw); H.jugador.estado.sentado = false; H.jugador.estado.vel.set(0, 0, 0); H.jugador.actualizar(1 / 30); return 1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 150000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, T = H.T; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${process.env.HUMO_CAL || (process.env.HUMO_ALTA ? 'alta' : 'media')}', clima:'despejado', musica:false, modo:'${DESAFIO ? 'desafio' : 'relax'}', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false})); 1`;
  const foto = async (nombre) => {
    if (!CAPTURAS) return;
    for (let k = 0; k < 4; k++) {
      try { await esperar(500 + k * 400); const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG()); console.log(`  (captura ${nombre}.png)`); return; } catch (e) { if (k === 3) console.log(`  (captura ${nombre} no se pudo)`); }
    }
  };
  try {
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js('window.__sinPausaPorBlur = true; 1');
    await js(DETERMINISTA(42651));
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.cuadros(60)'); await N('N.despejar()');
    await N('(() => { H.ajustes.limiteFps = "libre"; H.clima.estado.lluvia = 0; return 1 })()');
    console.log('  programas al empezar:', await N('N.programas()'));
    const guion = process.env.HUMO_GUION ? require(path.resolve(process.env.HUMO_GUION)) : null;
    donde = 'guion';
    if (guion) await guion({ N, js, foto, ok, w, salida, esperar });
    else console.log('  (sin guion)');
  } catch (e) { console.log('ERROR:', e && e.stack || e); errores.push('excepción'); }
  if (consola.length) { console.log('— errores de la consola:'); [...new Set(consola)].slice(0, 15).forEach((m) => console.log('  ' + m)); }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'LISTO');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(1); }
});
