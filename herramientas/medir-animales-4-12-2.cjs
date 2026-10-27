// 4.12.2: mide el costo de los animales con huesos, antes y después, en la misma máquina y en el mismo proceso. Alterna dos (o tres) versiones del
// juego, ronda tras ronda (A B A B ...), cargando cada una en la misma ventana: así el ruido de la máquina (otros programas, la temperatura) cae parejo
// sobre las dos. En cada carga se arma una vista con varios animales cerca (el caballo, el perro, los ciervos y los huemules a 6–32 m delante de la
// cámara, en marcha) y otra con los mismos lejos (45–70 m: la piel no corre), y se miden N cuadros a mano (`__bucle`) con `gl.finish()` después de
// cada uno: el tiempo es CPU + placa de todo el cuadro, sin vsync ni límite. Dibujos y triángulos son los de un cuadro entero.
//
// Uso (siempre en el monitor externo, con perfil propio, tomando el candado de Electron):
//   HTML_ANTES=<index.html de main> HTML_DESPUES=<index.html de la rama> SALIDA=<archivo.json> CALIDAD=media|alta|baja RONDAS=7 CUADROS=200
//   [RIGIDO=1: suma una tercera versión, la de después con ?piel=0 (la piel apagada)]
//   npx electron herramientas/medir-animales-4-12-2.cjs --user-data-dir=<carpeta propia>
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { PAGINA } = require('./ayuda-animales-4-12-2.cjs');
const HTML_ANTES = path.resolve(process.env.HTML_ANTES || '');
const HTML_DESPUES = path.resolve(process.env.HTML_DESPUES || path.join(process.cwd(), 'index.html'));
const SALIDA = path.resolve(process.env.SALIDA || './medir-animales.json');
const CALIDAD = process.env.CALIDAD || 'media';
const RONDAS = Number(process.env.RONDAS || 7);
const CUADROS = Number(process.env.CUADROS || 200);
const ASIENTO = Number(process.env.ASIENTO || 150);
const RIGIDO = process.env.RIGIDO === '1';
const SIN_ANTES = process.env.SIN_ANTES === '1';
const perfil = (process.argv.find((a) => a.startsWith('--user-data-dir=')) || '').slice(16);
if (!perfil) { console.error('falta --user-data-dir=<carpeta propia>'); process.exit(2); }
app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
process.on('unhandledRejection', (e) => { console.log('RECHAZO', e && e.message); try { app.exit(3); } catch {} });

// la escena: los animales alrededor, en marcha, delante del jugador (que mira al norte)
const ESCENA = String.raw`(() => {
  const A = window.__A, H = window.__hojarasca, T = H.T;
  A.B = A.llano(); H.progreso.horas = 12; H.progreso.cosas = Object.assign(H.progreso.cosas || {}, { caballo: 1 });
  const todos = [];
  A.ciervos().forEach((c) => todos.push({ tipo: 'ciervo', a: c }));
  A.huemules().forEach((c) => todos.push({ tipo: 'huemul', a: c }));
  A.todos = todos;
  A.poner = (cerca) => {
    const B = A.B;
    todos.forEach((o, i) => {
      const ang = -0.9 + 1.8 * ((i + 0.5) / todos.length), d = cerca ? 6 + (i % 5) * 6.5 : 45 + (i % 4) * 8;
      const x = B.x + Math.sin(ang) * d, z = B.z - Math.cos(ang) * d;
      o.a.pos.set(x, T.altura(x, z), z); o.a.rumbo = 3 * i; o.a.g.rotation.y = o.a.rumbo; o.a.vel = 0; o.x0 = x; o.z0 = z;
    });
    // el caballo (sin montar) y el perro, cerca
    const cab = H.progreso.caballo || (H.progreso.caballo = {});
    cab.x = B.x - 3; cab.z = B.z - (cerca ? 8 : 55); cab.yaw = 0.7;
    const e = H.perro.est; e.pos.set(B.x + 2, T.altura(B.x + 2, B.z - (cerca ? 6 : 50)), B.z - (cerca ? 6 : 50)); e.rumbo = 1.5; e.vel = 0;
    A.cerca = cerca;
  };
  // en cada cuadro: los animales caminan (sin huir ni pastar) y, si se alejan de su lugar, vuelven a él
  A.mover = () => {
    const B = A.B;
    A.jugadorEn(B.x, B.z, 0);
    for (const o of todos) {
      const a = o.a;
      if (Math.hypot(a.pos.x - o.x0, a.pos.z - o.z0) > 14) { a.pos.set(o.x0, T.altura(o.x0, o.z0), o.z0); a.rumbo += 2.4; }
      a.estado = 'caminar'; a.t = 99; a.obj = { x: a.pos.x + Math.sin(a.rumbo) * 30, z: a.pos.z + Math.cos(a.rumbo) * 30 };
    }
    const e = H.perro.est; e.estado = 'adelante'; e.t = 9; e.objetivo.set(e.pos.x + Math.sin(e.rumbo) * 30, 0, e.pos.z + Math.cos(e.rumbo) * 30);
    if (Math.hypot(e.pos.x - B.x, e.pos.z - (B.z - (A.cerca ? 6 : 50))) > 14) { e.pos.set(B.x + 2, T.altura(B.x + 2, B.z), B.z - (A.cerca ? 6 : 50)); e.rumbo += 2.4; }
  };
  return todos.length;
})()`;

app.whenReady().then(async () => {
  const r = { calidad: CALIDAD, rondas: RONDAS, cuadros: CUADROS, versiones: {}, errores: [] };
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon/.test(m)) r.errores.push(m.slice(0, 300));
  });
  w.webContents.on('render-process-gone', (_e, d) => { r.errores.push('renderer caído ' + JSON.stringify(d)); });
  const js = (c, lim = 240000) => Promise.race([w.webContents.executeJavaScript(c, true), esperar(lim).then(() => { throw new Error('sin respuesta'); })]);
  const ajustes = JSON.stringify({ calidad: CALIDAD, clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', modoFluido: false, estacion: 'verano' });
  const versiones = [];
  if (!SIN_ANTES) versiones.push({ id: 'antes', html: HTML_ANTES, search: '?debug=1' });
  versiones.push({ id: 'despues', html: HTML_DESPUES, search: '?debug=1' });
  if (RIGIDO) versiones.push({ id: 'despues-rigido', html: HTML_DESPUES, search: '?debug=1&piel=0' });
  const cargar = async (v) => {
    await w.loadFile(v.html, { search: v.search });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(ajustes)}); 1`);
    await w.loadFile(v.html, { search: v.search });
    for (let i = 0; i < 1200; i++) { await esperar(250); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador', 5000).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(PAGINA);
    return js(ESCENA);
  };
  const medir = async (cerca) => js(`(async () => {
    const A = window.__A, H = window.__hojarasca, R = H.renderer, gl = R.getContext();
    A.poner(${cerca}); H.volverAlJuego && H.volverAlJuego();
    for (let i = 0; i < ${ASIENTO}; i++) { A.mover(); H.__bucle(); }
    await new Promise((ok) => setTimeout(ok, 800));
    const ms = []; let llamadas = 0, triangulos = 0;
    for (let i = 0; i < ${CUADROS}; i++) {
      A.mover();
      const ultimo = i === ${CUADROS} - 1; let reset = null;
      if (ultimo) { R.info.autoReset = false; R.info.reset(); reset = R.info.reset; R.info.reset = () => {}; }
      const t0 = performance.now(); H.__bucle(); gl.finish(); ms.push(performance.now() - t0);
      if (ultimo) { llamadas = R.info.render.calls; triangulos = R.info.render.triangles; R.info.reset = reset; R.info.autoReset = true; }
    }
    const o = ms.slice().sort((a, b) => a - b), q = (f) => +o[Math.min(o.length - 1, Math.floor(o.length * f))].toFixed(2);
    const conPiel = A.todos.filter((t) => t.a.piel && t.a.piel.activa).length + (H.perro.malla.piel && H.perro.malla.piel.activa ? 1 : 0);
    return { p50: q(0.5), p95: q(0.95), medio: +(ms.reduce((s, x) => s + x, 0) / ms.length).toFixed(2), llamadas, triangulos, programas: R.info.programs.length, conPiel, animales: A.todos.length + 2 };
  })()`);
  try {
    for (const v of versiones) r.versiones[v.id] = { cerca: [], lejos: [], progs: [], carga: [] };
    for (let ronda = 0; ronda < RONDAS; ronda++) {
      for (const v of versiones) {
        const t0 = Date.now();
        const n = await cargar(v);
        const progsCarga = await js('window.__hojarasca.renderer.info.programs.length');
        const cerca = await medir(true);
        const lejos = await medir(false);
        const progsFin = await js('window.__hojarasca.renderer.info.programs.length');
        r.versiones[v.id].cerca.push(cerca); r.versiones[v.id].lejos.push(lejos); r.versiones[v.id].progs.push([progsCarga, progsFin]);
        console.log(`ronda ${ronda + 1} ${v.id.padEnd(14)} cerca p50 ${cerca.p50} p95 ${cerca.p95} · ${cerca.llamadas} dibujos · ${cerca.triangulos} tris · piel ${cerca.conPiel}/${cerca.animales} | lejos p50 ${lejos.p50} · ${lejos.llamadas} dibujos | programas ${progsCarga}→${progsFin} (${Math.round((Date.now() - t0) / 1000)} s)`);
      }
    }
  } catch (e) { r.errores.push('excepcion: ' + (e && e.message ? e.message : e)); console.log('EXCEPCIÓN', e && e.message); }
  // resumen: medianas de las medianas
  const med = (a) => { const o = a.slice().sort((x, y) => x - y); return o[Math.floor(o.length / 2)]; };
  const dif = (a) => { const o = a.slice().sort((x, y) => x - y); return +(o[o.length - 1] - o[0]).toFixed(2); };
  r.resumen = {};
  for (const [id, d] of Object.entries(r.versiones)) {
    r.resumen[id] = {};
    for (const vista of ['cerca', 'lejos']) {
      const p50 = d[vista].map((x) => x.p50), medio = d[vista].map((x) => x.medio), p95 = d[vista].map((x) => x.p95);
      r.resumen[id][vista] = { p50: med(p50), medio: med(medio), p95: med(p95), rangoP50: dif(p50), llamadas: med(d[vista].map((x) => x.llamadas)), triangulos: med(d[vista].map((x) => x.triangulos)), conPiel: med(d[vista].map((x) => x.conPiel)) };
    }
  }
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(r, null, 2));
  console.log(JSON.stringify(r.resumen, null, 1));
  console.log(`errores ${r.errores.length}${r.errores.length ? ': ' + r.errores.slice(0, 3).join(' | ') : ''}`);
  app.exit(0);
});
