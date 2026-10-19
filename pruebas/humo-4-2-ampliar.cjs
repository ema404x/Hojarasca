// Partida real 4.2 (Electron + WebGL): ampliar el refugio y las casas, con las teclas y el motor de verdad.
//   · cada ampliación y pieza de planos-ampliar.js, levantada etapa por etapa en un lugar llano, con capturas por fuera y por dentro;
//   · lo que se hace con las teclas (menú con el precio, Y que cobra cada etapa, el aviso de «falta plata», el fuego del gran hogar con F).
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-2-ampliar.cjs -Espera 900 -Arg1 --salida=C:\carpeta
//   (--solo=id1,id2 para ver sólo algunas; --sin-teclas salta la parte que usa el teclado)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'ampliar')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
const solo = arg('solo', '').split(',').filter(Boolean);
const sinTeclas = process.argv.includes('--sin-teclas');
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Las tomas de cada pieza: [nombre, cámara local [x, y, z], mira local [x, y, z]] (locales a la obra; el frente mira a -z)
const TOMAS = {
  'dormitorio-anexo': [['ext-frente', [-6.5, 3.4, -7.5], [0, 1.4, 0]], ['ext-fondo', [6.0, 3.4, 7.0], [0, 1.4, 0]], ['int-camas', [1.9, 1.9, -1.5], [-1.0, 0.9, 1.2]], ['int-ropero', [-1.9, 1.9, -1.2], [1.6, 1.0, 1.4]]],
  'despensa-anexa': [['ext-frente', [-5.5, 3, -6.5], [0, 1.4, 0]], ['ext-fondo', [5, 3, 6], [0, 1.4, 0]], ['int-estantes', [1.3, 1.8, -1.2], [-0.5, 1.0, 1.4]], ['int-sacos', [-1.3, 1.8, -1.2], [1.2, 1.0, 0.8]]],
  'taller-anexo': [['ext-frente', [-7, 3.3, -7], [0, 1.4, 0]], ['ext-fondo', [7, 3.5, 6.5], [0, 1.4, 0]], ['int-herramientas', [2.0, 1.9, -1.4], [-1.0, 1.0, 1.2]], ['int-caballetes', [-2.0, 1.9, -1.4], [1.6, 1.0, 1.2]]],
  'quincho': [['ext-frente', [-8, 3.5, -9], [0, 1.4, 0]], ['ext-fondo', [8, 3.5, 8], [0, 1.4, 0]], ['int-asador', [2.5, 1.9, -1.8], [-0.5, 1.0, 1.5]], ['int-mesa', [-2.8, 1.9, -1.8], [1.8, 1.0, 1.8]]],
  'galeria-cerrada': [['ext-frente', [-8, 3, -6], [0, 1.2, 0]], ['ext-fondo', [7, 3, 5], [0, 1.2, 0]], ['int-mate', [-3, 1.8, -0.6], [2.4, 1.0, 0.5]], ['int-macetas', [3, 1.8, -0.6], [-2.6, 1.0, 0.4]]],
  'cocina-ampliada': [['ext-frente', [-7, 3.4, -7.5], [0, 1.4, 0]], ['ext-fondo', [7, 3.4, 7], [0, 1.4, 0]], ['int-mesada', [2.1, 1.9, -1.8], [-1.2, 1.0, 1.8]], ['int-hogar', [-2.2, 1.9, -1.8], [1.8, 1.0, 0.8]]],
  'bodega-piedra': [['ext-frente', [-7, 3.4, -8], [0, 1.4, 0]], ['ext-fondo', [7, 3.4, 7.5], [0, 1.4, 0]], ['int-barriles', [2.2, 1.9, -1.8], [-0.2, 1.0, 1.8]], ['int-botellero', [-2.3, 1.9, -1.6], [1.8, 1.0, 1.5]]],
  'buhardilla': [['ext-frente', [-6, 4, -9], [0, 2.4, 0]], ['ext-fondo', [6, 4, 9], [0, 2.4, 0]], ['int-abajo', [1.0, 1.9, -2.2], [-0.8, 1.0, 1.4]], ['int-altillo', [0.9, 4.3, 0.9], [-1.5, 3.4, 1.8]]],
  'salon-grande': [['ext-frente', [-11, 4, -11], [0, 1.8, 0]], ['ext-fondo', [11, 4, 11], [0, 1.8, 0]], ['int-este', [3.5, 1.9, -2.6], [-2.0, 1.1, 1.0]], ['int-oeste', [-3.6, 1.9, -2.6], [2.4, 1.1, 1.0]]],
  'planta-alta': [['ext-frente', [-9, 5, -11], [0, 3, 0]], ['ext-fondo', [9, 5, 10], [0, 3, 0]], ['int-abajo', [2, 1.9, -1.9], [-1.5, 1.0, 1.0]], ['int-arriba', [1.8, 4.9, -1.6], [-0.4, 3.9, 1.6]], ['balcon', [0, 4.4, -9], [0, 3.7, -2]]],
  'torreon-piedra': [['ext-frente', [-7, 5, -9], [0, 3.5, 0]], ['ext-fondo', [7, 5, 9], [0, 3.5, 0]], ['int-abajo', [1.2, 1.9, -1.7], [-0.7, 1.0, 1.2]], ['int-arriba', [0.8, 4.7, -1.4], [0.3, 3.7, 1.4]]],
  'hogar-grande': [['ext-frente', [-3.5, 1.9, -4.5], [0, 1.9, 0]], ['ext-lado', [4.6, 2.4, -3.2], [0, 2.0, 0]]],
  'pared-piedra': [['ext-frente', [-3.2, 1.6, -4], [0, 1.1, 0]], ['ext-lado', [3.6, 1.6, 3.0], [0, 1.1, 0]]],
};
const ORDEN = Object.keys(TOMAS);

// ---------------------------------------------------------------- lo que corre en la página
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, O = H.obras, T = H.T, J = H.jugador, P = H.progreso;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  A.tecla = (code, extra = {}) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, ...extra })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true, ...extra })); return 1; };
  A.cuadros = (n = 3) => { for (let i = 0; i < n; i++) H.__bucle(); return 1; };
  A.plata = (n) => { P.economia.pesos = n; return P.economia.pesos; };
  A.materiales = (m) => { Object.assign(P.materiales, m); return 1; };
  A.pesos = () => P.economia.pesos;
  A.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent.replace(/\s+/g, ' ').trim());
  A.limpiarNotas = () => { document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); return 1; };
  A.n = () => O.obras.length;
  A.limpiar = () => { if (O.editando) O.cancelarEdicion(); for (const o of [...O.obras]) O.destruir(o); O.elegir(null); P.obras = []; A.ocupados = []; return 1; };
  A.ocupados = [];
  // un lugar llano de radio R (sin agua, sin pendiente), lejos de lo ya construido, donde el plano se puede fundar
  A.sitioGrande = (id, R = 7, lejos = 22) => {
    const pl = H.PLANOS.find((p) => p.id === id), r0 = T.lugares.refugio;
    const llano = (x, z) => { const y0 = T.altura(x, z); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283, q = T.altura(x + Math.cos(a) * R, z + Math.sin(a) * R); if (Math.abs(q - y0) > 0.14 || T.agua(x + Math.cos(a) * R, z + Math.sin(a) * R)) return false; } return true; };
    for (let r = 26; r < 300; r += 3.3) {
      const k = Math.max(8, Math.round(2 * Math.PI * r / 3.3));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + r * 0.37, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 460 || Math.abs(z) > 460) continue;
        if ((A.ocupados || []).some((q) => Math.hypot(q.x - x, q.z - z) < lejos)) continue;
        if (!llano(x, z)) continue;
        if (O.revisarSitio(x, z, pl, 0).ok) return { x, z };
      }
    }
    return null;
  };
  // levanta un plano entero (todas sus etapas) con materiales de sobra, sin cobrar: para ver cómo queda
  A.levantar = (id, s) => {
    const pl = H.PLANOS.find((p) => p.id === id);
    O.elegir(pl);
    const f = O.fundar(s.x, s.z, 0, T.altura(s.x, s.z));
    if (!f.ok) return 'no funda: ' + f.motivo;
    const m = { tronco: 9999, tabla: 9999, piedra: 9999, lana: 9999, cristal: 99 };
    let r;
    while (f.obra.datos.etapas < pl.etapas.length) { r = O.avanzar(f.obra, m); if (!r.ok) return 'no avanza: ' + r.motivo; }
    P.obras = O.obras.map((o) => o.datos);
    A.ocupados.push({ x: s.x, z: s.z });
    return 'ok';
  };
  A.ultima = () => O.obras.at(-1);
  // la cámara quieta en un punto local de la obra, mirando a otro punto local
  A.camLocal = (cam, mira) => {
    const o = O.obras.at(-1), r = o.datos.rot || 0, c = Math.cos(r), s = Math.sin(r), y0 = Number.isFinite(o.datos.y) ? o.datos.y : T.altura(o.datos.x, o.datos.z);
    const mundo = ([lx, ly, lz]) => ({ x: o.datos.x + lx * c + lz * s, y: y0 + ly, z: o.datos.z - lx * s + lz * c });
    const a = mundo(cam), b = mundo(mira), fx = b.x - a.x, fy = b.y - a.y, fz = b.z - a.z, h = Math.hypot(fx, fz);
    H.__camaraFija = { x: a.x, y: a.y, z: a.z, pitch: Math.atan2(fy, h), yaw: Math.atan2(-fx, -fz) };
    for (let i = 0; i < 4; i++) H.__bucle();
    return 1;
  };
  A.sinCamara = () => { delete H.__camaraFija; return 1; };
  A.triangulos = () => { const o = O.obras.at(-1); return o && o.malla ? (o.malla.geometry.index ? o.malla.geometry.index.count / 3 : o.malla.geometry.attributes.position.count / 3) : -1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 180 s (${donde})`)), 180000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, O = H.obras, P = H.progreso; return (${c}) })()`);
  const foto = async (nombre, notas = false) => {
    if (notas) await js(`(() => { const e = document.createElement('style'); e.id = 'fx-notas'; e.textContent = '.nota { animation: none !important; opacity: 1 !important; }'; document.head.appendChild(e); return 1 })()`);
    await A('A.cuadros(2)'); await esperar(400);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
    const s = img.getSize();
    const png = (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG();
    const archivo = path.join(salida, `${nombre}.png`);
    fs.writeFileSync(archivo, png);
    console.log(`  captura ${path.basename(archivo)} (${s.width}×${s.height})`);
    if (notas) await js(`document.getElementById('fx-notas')?.remove(); 1`);
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, viewPosition: { x: 0, y: 0 }, scale: 1 }));
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';

  try {
    seccion('carga');
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', estacion: 'verano', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', limiteFps: 'libre' })); 1`);
    await abrir();
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el Relax');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA);
    await A(`(P.horas = 11, P.dia = 4, A.cuadros(3), 1)`);
    ok(await A('!!P.economia && P.modo !== "desafio"'), 'la partida es del Relax y trae economía');

    // ---------------------------------------------------------------- 1. cada pieza, entera, por fuera y por dentro
    seccion('cada ampliación, levantada y fotografiada');
    for (const id of ORDEN) {
      if (solo.length && !solo.includes(id)) continue;
      const R = id === 'salon-grande' ? 9 : id === 'planta-alta' || id === 'quincho' || id === 'torreon-piedra' ? 7 : id === 'pared-piedra' || id === 'hogar-grande' ? 4 : 6;
      const s = await A(`A.sitioGrande(${JSON.stringify(id)}, ${R})`);
      ok(!!s, `${id}: hay un lugar llano`);
      if (!s) continue;
      const r = await A(`A.levantar(${JSON.stringify(id)}, ${JSON.stringify(s)})`);
      ok(r === 'ok', `${id}: se levanta entero (${r})`);
      if (r !== 'ok') continue;
      await A('(P.horas = 11.5, 1)');
      for (const [nombre, cam, mira] of TOMAS[id]) {
        await A(`A.camLocal(${JSON.stringify(cam)}, ${JSON.stringify(mira)})`);
        await foto(`${id}-${nombre}`);
      }
      await A('A.sinCamara()');
    }
    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});
