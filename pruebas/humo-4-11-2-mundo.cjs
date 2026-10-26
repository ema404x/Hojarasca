// 4.11.2 — partida real (Electron + WebGL) de la geometría y el aspecto del mundo (A), con capturas a tamaño completo.
//   modo=relax   (por defecto):
//     · G-7: los ocho edificios de oficio propios, levantados de verdad: lo grande que se atravesaba (horno, mesas, barriles, bloques...) ahora choca,
//       y caminando con la W desde afuera se llega al centro del edificio (donde se usa con E) con el aviso puesto;
//     · G-8: el torreón de piedra: se camina (con el motor de verdad) entre la mesa y el hogar hasta el fondo de la planta baja.
//   modo=desafio:
//     · V13: el tablero de trofeos en una ladera de costado (los postes llegan al suelo) y en llano (igual que siempre);
//     · V7: cuatro madrigueras en laderas reales: cada una con el suelo siguiendo el terreno; dibujos y memoria antes/después;
//     · V10: las sombras largas de las antorchas con su opacidad (una cerca de la llama y otra lejos) y las llamadas de dibujo que suman.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`), por PowerShell:
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-11-2-mundo.cjs -Espera 900 -Perfil <carpeta> [-Visible] -Arg1 --modo=desafio
//   (--salida=<carpeta> para las capturas; --solo=oficios,torreon,tablero,madrigueras,sombras)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const MODO = arg('modo', process.env.HUMO_MODO || 'relax');
const salida = path.resolve(arg('salida', process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'mundo-4-11-2')));
const [ANCHO, ALTO] = arg('tam', '1600x900').split('x').map(Number);
const solo = (arg('solo', '') || process.env.HUMO_SOLO || '').split(',').filter(Boolean);
const toca = (e) => !solo.length || solo.includes(e);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- lo que corre en la página
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, O = H.obras, T = H.T, J = H.jugador, P = H.progreso;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  A.cuadros = (n = 3) => { for (let i = 0; i < n; i++) H.__bucle(); return 1; };
  A.materiales = () => { Object.assign(P.materiales, { tronco: 9999, tabla: 9999, piedra: 9999, lana: 9999, cuero: 9999, cristal: 99, hierro: 999 }); if (P.economia) P.economia.pesos = 9000000; return 1; };
  A.ocupados = [];
  const pend = (x, z) => Math.acos(Math.max(-1, Math.min(1, T.normal(x, z).y)));
  // un lugar llano de radio R, sin agua, lejos de lo ya construido, donde el plano se puede fundar
  A.sitioGrande = (id, R = 4, lejos = 14, tol = 0.12) => {
    const pl = H.PLANOS.find((p) => p.id === id), r0 = T.lugares.refugio;
    const llano = (x, z) => { const y0 = T.altura(x, z); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283, qx = x + Math.cos(a) * R, qz = z + Math.sin(a) * R; if (T.agua(qx, qz) || Math.abs(T.altura(qx, qz) - y0) > tol) return false; } return !T.agua(x, z); };
    for (let r = 26; r < 300; r += 3.3) {
      const k = Math.max(8, Math.round(2 * Math.PI * r / 3.3));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + r * 0.37, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 460 || Math.abs(z) > 460) continue;
        if (A.ocupados.some((q) => Math.hypot(q.x - x, q.z - z) < lejos)) continue;
        if (!llano(x, z)) continue;
        if (O.revisarSitio(x, z, pl, 0).ok) return { x, z };
      }
    }
    return null;
  };
  // un lugar donde el terreno baja de costado (a lo largo de x) entre dmin y dmax metros en los 3,3 m del ancho del tablero, y se puede fundar
  A.sitioLateral = (id, dmin, dmax) => {
    const pl = H.PLANOS.find((p) => p.id === id), r0 = T.lugares.refugio;
    for (let r = 26; r < 320; r += 2.2) {
      const k = Math.max(8, Math.round(2 * Math.PI * r / 2.2));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + r * 0.41, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 460 || Math.abs(z) > 460 || T.agua(x, z) || A.ocupados.some((q) => Math.hypot(q.x - x, q.z - z) < 14)) continue;
        const dif = Math.abs(T.altura(x + 1.64, z) - T.altura(x - 1.64, z));
        if (dif < dmin || dif > dmax) continue;
        if (Math.abs(T.altura(x, z + 1) - T.altura(x, z - 1)) > 0.25) continue;
        if (O.revisarSitio(x, z, pl, 0).ok) return { x, z, dif };
      }
    }
    return null;
  };
  // levanta un plano entero (todas sus etapas) con materiales de sobra y plata de sobra
  A.levantar = (id, s, rot = 0) => {
    const pl = H.PLANOS.find((p) => p.id === id);
    H.veg.despejar(s.x, s.z, 9);
    A.materiales();
    O.elegir(pl);
    const f = O.fundar(s.x, s.z, rot, T.altura(s.x, s.z));
    if (!f.ok) return 'no funda: ' + f.motivo;
    while (f.obra.datos.etapas < pl.etapas.length) { const r = O.avanzar(f.obra, P.materiales); if (!r.ok) return 'no avanza: ' + r.motivo; }
    O.elegir(null);
    P.obras = O.obras.map((o) => o.datos);
    A.ocupados.push({ x: s.x, z: s.z });
    return 'ok';
  };
  A.obra = (id) => O.obras.find((q) => q.plano.id === id);
  A.mundo = (o, lx, lz) => { const r = o.datos.rot || 0, c = Math.cos(r), s = Math.sin(r); return { x: o.datos.x + lx * c + lz * s, z: o.datos.z - lx * s + lz * c }; };
  // cuánto lo empuja el choque desde ese punto local, parado sobre el piso del edificio (0: se atraviesa)
  A.empuje = (o, lx, lz) => { const m = A.mundo(o, lx, lz), q = { x: m.x, z: m.z, y: o.datos.y + 0.18 }; H.col.resolver(q, 0.35, 1.65); return Math.hypot(q.x - m.x, q.z - m.z); };
  // camina con la W apretada (el motor de verdad) hasta el punto local; devuelve dónde quedó (local) y cuánto le faltó
  A.caminar = (o, lx, lz, tope = 400) => {
    const s = J.estado, g = A.mundo(o, lx, lz);
    J.teclas.add('KeyW');
    let n = 0;
    for (; n < tope; n++) {
      const dx = g.x - s.pos.x, dz = g.z - s.pos.z;
      if (Math.hypot(dx, dz) < 0.25) break;
      s.yaw = Math.atan2(-dx, -dz); s.pitch = 0;
      J.actualizar(0.04);
    }
    J.teclas.delete('KeyW');
    const r = o.datos.rot || 0, c = Math.cos(r), sn = Math.sin(r), px = s.pos.x - o.datos.x, pz = s.pos.z - o.datos.z;
    return { lx: px * c - pz * sn, lz: px * sn + pz * c, falta: Math.hypot(g.x - s.pos.x, g.z - s.pos.z), pasos: n };
  };
  A.estar = (o, lx, lz, mirarLx = null, mirarLz = null) => { const m = A.mundo(o, lx, lz), s = J.estado; J.ubicar(m.x, m.z, 0); for (let i = 0; i < 10; i++) { J.actualizar(0.04); } if (mirarLx !== null) { const g = A.mundo(o, mirarLx, mirarLz); s.yaw = Math.atan2(-(g.x - s.pos.x), -(g.z - s.pos.z)); } return 1; };
  A.aviso = (id) => H.__avisoObraQueTrabaja(A.obra(id));
  // la cámara quieta en un punto local de la obra, mirando a otro punto local (alturas desde el pie de la obra)
  A.camLocal = (o, cam, mira) => {
    const r = o.datos.rot || 0, c = Math.cos(r), s = Math.sin(r), y0 = Number.isFinite(o.datos.y) ? o.datos.y : T.altura(o.datos.x, o.datos.z);
    const mundo = ([lx, ly, lz]) => ({ x: o.datos.x + lx * c + lz * s, y: y0 + ly, z: o.datos.z - lx * s + lz * c });
    const a = mundo(cam), b = mundo(mira), fx = b.x - a.x, fy = b.y - a.y, fz = b.z - a.z, h = Math.hypot(fx, fz);
    H.__camaraFija = { x: a.x, y: a.y, z: a.z, pitch: Math.atan2(fy, h), yaw: Math.atan2(-fx, -fz) };
    for (let i = 0; i < 4; i++) H.__bucle();
    return 1;
  };
  // la cámara quieta en un punto del mundo (alturas desde el terreno de ese punto) mirando a otro
  A.camMundo = (cx, cy, cz, mx, my, mz) => {
    const a = { x: cx, y: T.altura(cx, cz) + cy, z: cz }, b = { x: mx, y: T.altura(mx, mz) + my, z: mz }, fx = b.x - a.x, fy = b.y - a.y, fz = b.z - a.z, h = Math.hypot(fx, fz);
    H.__camaraFija = { x: a.x, y: a.y, z: a.z, pitch: Math.atan2(fy, h), yaw: Math.atan2(-fx, -fz) };
    for (let i = 0; i < 4; i++) H.__bucle();
    return 1;
  };
  A.sinCamara = () => { delete H.__camaraFija; return 1; };
  A.sinHud = () => { if (!document.getElementById('fx-hud')) { const e = document.createElement('style'); e.id = 'fx-hud'; e.textContent = '#hud, #notas { display: none !important }'; document.head.appendChild(e); } return 1; };
  A.llamadas = () => { const R = H.renderer; R.info.autoReset = false; R.info.reset(); H.__bucle(); const r = { calls: R.info.render.calls, tris: R.info.render.triangles }; R.info.autoReset = true; return r; };
  // un dibujo directo de la escena, sin correr el cuadro del juego (que volvería a prender o apagar lo que se toca a mano)
  A.llamadasDirecto = () => { const R = H.renderer; R.info.autoReset = false; R.info.reset(); R.render(H.escena, H.camara); const r = { calls: R.info.render.calls, tris: R.info.render.triangles }; R.info.autoReset = true; return r; };
  return 1;
})()`;

// [id del plano, x local, z local, descripción]: lo que ahora choca (las mismas cosas que verificar-4-11-2-mundo.mjs)
const COSAS = [
  ['herreria-propia', 1.35, 0.95, 'el barril de agua de la herrería'],
  ['herreria-propia', 0.35, 1.05, 'la mesita de las tenazas de la herrería'],
  ['carpinteria', 1.0, -0.4, 'el caballete con el tronco de la carpintería'],
  ['carpinteria', 1.25, 1.0, 'la pila de tablones de la carpintería'],
  ['panaderia-horno', 1.05, 0.45, 'la mesa de amasar de la panadería'],
  ['panaderia-horno', -0.5, 0.75, 'el horno de barro de la panadería'],
  ['cerveceria', 0.4, -0.7, 'la mesa de degustación de la cervecería'],
  ['cerveceria', 1.55, 0.25, 'el barril suelto de la cervecería'],
  ['telar-grande', -1.2, -0.45, 'el cesto de lana del telar'],
  ['queseria', 0.7, -0.5, 'la mesa de la prensa de la quesería'],
  ['queseria', 0.95, 0.5, 'los tarros de leche de la quesería'],
  ['tienda-campo', -1.4, 0.75, 'el primer barril de la tienda de campo'],
  ['tienda-campo', -0.9, 0.75, 'el segundo barril de la tienda de campo'],
  ['canteria', 1.15, 0.0, 'los bloques apilados de la cantería'],
  ['canteria', 0.95, 1.0, 'las lajas de la cantería'],
  ['canteria', -1.3, -0.7, 'la grúa de mano de la cantería'],
];
const OFICIOS = ['herreria-propia', 'carpinteria', 'panaderia-horno', 'cerveceria', 'telar-grande', 'queseria', 'tienda-campo', 'canteria'];
const FONDO = { 'herreria-propia': 3.0, carpinteria: 3.0, 'panaderia-horno': 3.2, cerveceria: 3.2, 'telar-grande': 3.0, queseria: 3.0, 'tienda-campo': 3.0, canteria: 3.0 };
// las tomas de captura por edificio: [nombre, cámara local, mira local]
const TOMAS = {
  'panaderia-horno': [['frente', [-1.2, 1.7, -5.0], [0, 0.9, 0.3]], ['lado', [4.4, 1.5, -2.2], [0, 0.8, 0.3]]],
  queseria: [['frente', [0.3, 1.7, -4.6], [0, 0.8, 0.3]], ['lado', [-4.2, 1.5, -2.4], [0, 0.8, 0.2]]],
  canteria: [['frente', [-0.4, 1.7, -4.8], [0.2, 0.8, 0.3]], ['lado', [4.4, 1.5, -2.4], [0, 0.8, 0.3]]],
};

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon|toNonIndexed/.test(m)) { errores.push(m.slice(0, 300)); console.log('[página]', m.slice(0, 300)); }
  });
  let donde = 'carga';
  const js = (c, limite = 180000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${limite / 1000} s (${donde})`)), limite))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, O = H.obras, P = H.progreso, T = H.T; return (${c}) })()`);
  const foto = async (nombre) => {
    await A('A.cuadros(2)'); await esperar(500);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
    const s = img.getSize();
    const png = (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG();
    const archivo = path.join(salida, `${MODO}-${nombre}.png`);
    fs.writeFileSync(archivo, png);
    console.log(`  captura ${path.basename(archivo)} (${s.width}×${s.height})`);
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, viewPosition: { x: 0, y: 0 }, scale: 1 }));
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = process.env.HUMO_INDEX ? path.resolve(process.env.HUMO_INDEX) : path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';

  // ================================================================ relax: G-7 los oficios
  async function oficios() {
    seccion('G-7: los edificios de oficio propios, con choque');
    await A('A.sinCamara()');
    const hechos = {};
    for (const id of OFICIOS) {
      const s = await A(`A.sitioGrande(${JSON.stringify(id)}, 4, 14)`);
      ok(!!s, `${id}: hay un lugar llano`);
      if (!s) continue;
      const r = await A(`A.levantar(${JSON.stringify(id)}, ${JSON.stringify(s)})`);
      ok(r === 'ok', `${id}: se levanta entero (${r})`);
      hechos[id] = r === 'ok';
    }
    await A('A.cuadros(3)');
    for (const [id, lx, lz, que] of COSAS) {
      if (!hechos[id]) continue;
      const e = await A(`A.empuje(A.obra(${JSON.stringify(id)}), ${lx}, ${lz})`);
      ok(e > 0.3, `${que} choca (el motor lo saca ${e.toFixed(2)} m)`);
    }
    // caminando con la W desde 3 m del frente: se llega al centro (donde se usa con E) y el aviso está puesto
    for (const id of OFICIOS) {
      if (!hechos[id]) continue;
      const D = FONDO[id];
      await A(`A.estar(A.obra(${JSON.stringify(id)}), 0, ${-D / 2 - 3}, 0, 0)`);
      const c = await A(`A.caminar(A.obra(${JSON.stringify(id)}), 0, 0)`);
      const dist = Math.hypot(c.lx, c.lz);
      // (la E llega a 2,6 m del centro: se pide entrar a menos de 2 m; el camino es una recta con la W, sin rodear nada)
      ok(dist < 2.0, `${id}: caminando con la W se llega a ${dist.toFixed(2)} m del centro (${c.pasos} pasos)`);
      const av = await js(`(() => { for (let i = 0; i < 4; i++) ${H}.__bucle(); return ${H}.__avisoYa() })()`);
      ok(!!av, `${id}: parado ahí, el aviso de E está puesto (¿${String(av && av.texto || av).slice(0, 70)}?)`);
    }
    // capturas de tres edificios
    await A('A.sinHud()');
    for (const id of Object.keys(TOMAS)) {
      if (!hechos[id]) continue;
      for (const [nombre, cam, mira] of TOMAS[id]) {
        await A(`A.camLocal(A.obra(${JSON.stringify(id)}), ${JSON.stringify(cam)}, ${JSON.stringify(mira)})`);
        await foto(`oficio-${id}-${nombre}`);
      }
    }
    await A('A.sinCamara()');
  }

  // ================================================================ relax: G-8 el torreón
  async function torreon() {
    seccion('G-8: el torreón de piedra, se camina entre la mesa y el hogar');
    const s = await A('A.sitioGrande("torreon-piedra", 7, 22, 0.14)');
    ok(!!s, 'torreón: hay un lugar llano');
    if (!s) return;
    const r = await A(`A.levantar("torreon-piedra", ${JSON.stringify(s)})`);
    ok(r === 'ok', `el torreón se levanta entero (${r})`);
    if (r !== 'ok') return;
    await A('A.cuadros(3)');
    // de afuera, por la puerta del frente (z local -2,1), por el pasaje entre la mesa y el hogar (x local 1,3) hasta el fondo
    await A('A.estar(A.obra("torreon-piedra"), 0, -5.2, 0, -2.1)');
    const ruta = [[0, -2.5], [0, -1.3], [1.3, -0.9], [1.3, 0.2], [1.3, 1.2]];
    let ult = null, bien = true;
    for (const [lx, lz] of ruta) {
      ult = await A(`A.caminar(A.obra("torreon-piedra"), ${lx}, ${lz})`);
      if (ult.falta > 0.5) { bien = false; break; }
    }
    ok(bien, `se camina por la puerta, entre la mesa y el hogar, hasta el fondo (último punto: x ${ult.lx.toFixed(2)}, z ${ult.lz.toFixed(2)}; falta ${ult.falta.toFixed(2)} m)`);
    ok(ult.lz > 1.0, `y se llega a z local ${ult.lz.toFixed(2)} (> 1,0: pasado el hogar)`);
    await A('A.sinHud()');
    for (const [nombre, cam, mira] of [['planta-baja', [-0.9, 1.75, -1.6], [0.9, 0.9, 1.0]], ['pasaje', [1.3, 1.7, -1.5], [1.3, 0.9, 1.5]], ['fuera', [-7, 3.5, -9], [0, 3.5, 0]]]) {
      await A(`A.camLocal(A.obra("torreon-piedra"), ${JSON.stringify(cam)}, ${JSON.stringify(mira)})`);
      await foto(`torreon-${nombre}`);
    }
    await A('A.sinCamara()');
  }

  // ================================================================ desafio: V13 el tablero de trofeos
  async function tablero() {
    seccion('V13: el tablero de trofeos en una ladera de costado');
    const s = await A('A.sitioLateral("tablero-trofeos", 0.45, 0.9)');
    ok(!!s, 'hay una ladera de costado donde se puede fundar el tablero');
    const llano = await A('A.sitioGrande("tablero-trofeos", 3, 14, 0.1)');
    ok(!!llano, 'y un lugar llano para el control');
    if (!s || !llano) return;
    ok(await A(`A.levantar("tablero-trofeos", ${JSON.stringify(s)})`) === 'ok', `el tablero se levanta en la ladera (desnivel ${s.dif.toFixed(2)} m en 3,3 m)`);
    ok(await A(`A.levantar("tablero-trofeos", ${JSON.stringify(llano)})`) === 'ok', 'y en el llano');
    const medida = (idx) => A(`(() => { const o = O.obras.filter((q) => q.plano.id === "tablero-trofeos")[${idx}], g = o.malla.geometry; g.computeBoundingBox();
      const bajo = (x) => { let m = 1e9; for (const dx of [-0.06, 0.06]) for (const dz of [-0.07, 0.07]) { const p = A.mundo(o, x + dx, dz); m = Math.min(m, T.altura(p.x, p.z)); } return m; };
      return { minY: o.datos.y + g.boundingBox.min.y, pie: o.datos.y, izq: bajo(-1.58), der: bajo(1.58) } })()`);
    const L = await medida(0), N = await medida(1);
    const terrenoMin = Math.min(L.izq, L.der);
    ok(L.minY <= terrenoMin + 0.005, `ladera: el poste de abajo llega al suelo (baja a ${L.minY.toFixed(2)}; el terreno más bajo bajo los postes está en ${terrenoMin.toFixed(2)})`);
    ok(L.minY >= terrenoMin - 0.4, `y no se pasa de largo (${(terrenoMin - L.minY).toFixed(2)} m enterrado de más)`);
    ok(Math.abs(N.minY - N.pie) < 0.02, `llano: los postes arrancan en el pie (${(N.minY - N.pie).toFixed(3)})`);
    await A('A.sinHud()');
    const o0 = 'O.obras.filter((q) => q.plano.id === "tablero-trofeos")[0]';
    for (const [nombre, cam, mira] of [['frente', [0.8, 1.3, -6.2], [0, 1.0, 0]]]) {
      await A(`A.camLocal(${o0}, ${JSON.stringify(cam)}, ${JSON.stringify(mira)})`);
      await foto(`tablero-ladera-${nombre}`);
    }
    // el poste de abajo, de cerca y rasante (las alturas de la cámara son sobre el terreno de donde está)
    await A(`(() => { const o = ${o0}, lado = T.altura(A.mundo(o, -4, -3).x, A.mundo(o, -4, -3).z) < T.altura(A.mundo(o, 4, -3).x, A.mundo(o, 4, -3).z) ? -1 : 1;
      const c = A.mundo(o, lado * 3.3, -2.6), p = A.mundo(o, lado * 1.58, 0); return A.camMundo(c.x, 0.55, c.z, p.x, 0.3, p.z) })()`);
    await foto('tablero-ladera-poste-de-abajo');
    await A('A.camLocal(O.obras.filter((q) => q.plano.id === "tablero-trofeos")[1], [0.8, 1.3, -6.2], [0, 1.0, 0])');
    await foto('tablero-llano-frente');
    await A('A.sinCamara()');
  }

  // ================================================================ desafio: V7 las madrigueras en ladera
  async function madrigueras() {
    seccion('V7: el suelo de las madrigueras sigue el terreno');
    const pag = await A(`(() => {
      const r0 = T.lugares.refugio, sitios = [];
      const desnivel = (x, z) => { let m = 0; const y = T.altura(x, z); for (let a = 0; a < 8; a++) m = Math.max(m, Math.abs(T.altura(x + Math.cos(a * 0.785) * 7, z + Math.sin(a * 0.785) * 7) - y)); return m; };
      for (let r = 70; r < 330 && sitios.length < 4; r += 3.7) {
        const k = Math.max(8, Math.round(2 * Math.PI * r / 3.7));
        for (let i = 0; i < k && sitios.length < 4; i++) {
          const a = (i / k) * Math.PI * 2 + r * 0.29, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
          if (Math.abs(x) > 440 || Math.abs(z) > 440 || T.agua(x, z) || T.altura(x, z) < 1) continue;
          if (sitios.some((q) => Math.hypot(q.x - x, q.z - z) < 40)) continue;
          const d = desnivel(x, z);
          if (d > 1.5 && d < 3.2) sitios.push({ x, z, d });
        }
      }
      return sitios })()`);
    ok(pag.length === 4, `hay cuatro laderas reales (${pag.map((q) => q.d.toFixed(1)).join(', ')} m de desnivel a 7 m)`);
    if (pag.length < 4) return;
    // antes de crear ninguna: lo que ya hay en la escena
    await A(`(() => { const d = H.progreso.desafio; d.puestos.lista.length = 0; ${JSON.stringify(pag)}.forEach((q, i) => d.puestos.lista.push({ id: 90 + i, x: q.x, z: q.z, nivel: 1, nacio: 3, crecio: 3, estructuras: [{ tipo: 'aguja', dx: 0, dz: 0, vida: 150, max: 150 }, { tipo: 'vaina', dx: 3.2, dz: 2.0, vida: 60, max: 60 }], guardias: 0, visto: true, roto: false })); H.desafio.puestosMundo.sincronizar(); return 1 })()`);
    await A('A.cuadros(3)');
    const m = await A(`(() => {
      const R = H.renderer, grupos = []; H.escena.traverse((o) => { if (o.name === 'puesto-invasor') grupos.push(o); });
      const suelos = grupos.map((g) => g.children[0].children);
      const propias = suelos.map((ms) => ms.filter((x) => x.geometry.userData.propia).length);
      let bytes = 0; for (const ms of suelos) for (const x of ms) if (x.geometry.userData.propia) bytes += x.geometry.attributes.position.array.byteLength + x.geometry.attributes.normal.array.byteLength;
      const desvio = suelos.map((ms, i) => { const g = grupos[i], base = g.position.y + g.children[0].position.y; let peor = 0;
        for (const x of ms) { const Pp = x.geometry.attributes.position; for (let v = 0; v < Pp.count; v++) peor = Math.max(peor, Math.abs(base + Pp.getY(v) - T.altura(g.position.x + Pp.getX(v), g.position.z + Pp.getZ(v)))); } return peor; });
      return { n: grupos.length, propias, bytes, desvio, } })()`);
    ok(m.n === 4, `se ven las cuatro madrigueras (${m.n})`);
    ok(m.propias.every((p) => p === 2), `cada una con la copia propia de sus dos mallas de suelo (${m.propias.join(', ')})`);
    ok(m.desvio.every((d) => d < 0.6), `y el suelo nunca se aleja del terreno más de 0,6 m (peor: ${m.desvio.map((d) => d.toFixed(2)).join(', ')})`);
    console.log(`  memoria: la copia de los cuatro suelos pesa ${(m.bytes / 1024).toFixed(0)} KB (posición y normal; el color y los índices se comparten) (en la GPU se suben al dibujarlas: sólo las de las madrigueras que se ven)`);
    // la primera ladera: claro de árboles, y la cámara de costado (perpendicular a la bajada)
    await A('A.sinHud()');
    const q = pag[0];
    await A(`H.veg.despejar(${q.x}, ${q.z}, 11)`);
    await A('A.cuadros(60)'); await esperar(800);   // (la vegetación se entera del claro unos cuadros después)
    const dir = await A(`(() => { const x = ${q.x}, z = ${q.z}; const gx = T.altura(x + 3, z) - T.altura(x - 3, z), gz = T.altura(x, z + 3) - T.altura(x, z - 3), l = Math.hypot(gx, gz) || 1; return { bx: -gx / l, bz: -gz / l } })()`);
    const lado = { x: q.x - dir.bz * 9, z: q.z + dir.bx * 9 };
    const abajo = { x: q.x + dir.bx * 9, z: q.z + dir.bz * 9 };
    const alto = { x: q.x - dir.bx * 8, z: q.z - dir.bz * 8 };
    const vista = async (nombre, c) => { await A(`A.camMundo(${c.x}, 1.4, ${c.z}, ${q.x}, 0.5, ${q.z})`); await foto(nombre); };
    // lo que dibujan las madrigueras a la vista (un dibujo directo con la cámara quieta, con ellas escondidas y a la vista: sin que el cuadro del juego cambie nada entre medio)
    const dibujan = async () => { await A(`A.camMundo(${lado.x}, 1.4, ${lado.z}, ${q.x}, 0.5, ${q.z})`);
      return A(`(() => { const gs = []; H.escena.traverse((o) => { if (o.name === 'puesto-invasor') gs.push(o); }); const con = A.llamadasDirecto(); gs.forEach((g) => { g.visible = false; }); const sin = A.llamadasDirecto(); gs.forEach((g) => { g.visible = true; }); return { con: con.calls, sin: sin.calls, delta: con.calls - sin.calls, tris: con.tris - sin.tris } })()`); };
    const despues = await dibujan();
    for (const [nom, c] of [['costado', lado], ['desde-abajo', abajo], ['desde-arriba', alto]]) await vista(`madriguera-despues-${nom}`, c);
    // «antes»: la primera madriguera con el suelo compartido (sus mismas geometrías sin el desnivel del terreno)
    await A(`(() => { const grupos = []; H.escena.traverse((o) => { if (o.name === 'puesto-invasor') grupos.push(o); });
      const g0 = grupos.sort((a, b) => Math.hypot(a.position.x - ${q.x}, a.position.z - ${q.z}) - Math.hypot(b.position.x - ${q.x}, b.position.z - ${q.z}))[0].children[0].children;
      window.__guardadas = g0.map((x) => x.geometry);
      const y0 = T.altura(grupos[0].position.x, grupos[0].position.z);
      g0.forEach((x, i) => { const g = x.geometry, Pp = g.attributes.position, ng = new g.constructor(); for (const k of Object.keys(g.attributes)) ng.setAttribute(k, g.attributes[k]); if (g.index) ng.setIndex(g.index);
        const pos = new Float32Array(Pp.array); for (let v = 0; v < Pp.count; v++) pos[v * 3 + 1] -= T.altura(grupos[0].position.x + Pp.getX(v), grupos[0].position.z + Pp.getZ(v)) - y0;
        ng.setAttribute('position', new Pp.constructor(pos, 3)); x.geometry = ng; });
      window.__grupo0 = g0; return 1 })()`);
    const antes = await dibujan();
    for (const [nom, c] of [['costado', lado], ['desde-abajo', abajo], ['desde-arriba', alto]]) await vista(`madriguera-antes-${nom}`, c);
    await A('(() => { window.__grupo0.forEach((x, i) => { x.geometry = window.__guardadas[i]; }); return 1 })()');
    await A('A.sinCamara()');
    console.log(`  dibujos que suma la madriguera a la vista: con el suelo compartido (antes) ${antes.delta} (${antes.tris} triángulos); con la copia propia (después) ${despues.delta} (${despues.tris} triángulos)`);
    ok(antes.delta === despues.delta && antes.tris === despues.tris, 'las llamadas de dibujo y los triángulos no cambian: sigue habiendo dos mallas de suelo por madriguera');
    // el puesto sale de la lista: se sueltan las copias
    const geoAntes = await A('H.renderer.info.memory.geometries');
    await A('(() => { const d = H.progreso.desafio; d.puestos.lista.length = 0; H.desafio.puestosMundo.sincronizar(); A.cuadros(3); return 1 })()');
    const geoDespues = await A('H.renderer.info.memory.geometries');
    ok(geoDespues <= geoAntes - 8, `al salir las cuatro de la lista se liberan sus geometrías (${geoAntes} → ${geoDespues})`);
  }

  // ================================================================ desafio: V10 las sombras largas de las antorchas
  async function sombras() {
    seccion('V10: cada sombra larga con su opacidad');
    const L = await A(`(() => { const r = T.lugares.refugio; let mejor = null;
      for (let a = 0; a < 24; a++) for (const d of [30, 45, 60, 80]) { const x = r.x + Math.cos(a / 24 * 6.283) * d, z = r.z + Math.sin(a / 24 * 6.283) * d, y = T.altura(x, z); if (T.agua(x, z)) continue;
        let des = 0; for (let k = 0; k < 8; k++) for (const e of [4, 14]) des = Math.max(des, Math.abs(T.altura(x + Math.cos(k) * e, z + Math.sin(k) * e) - y));
        if (!mejor || -des > mejor.pts) mejor = { x, z, pts: -des }; }
      return mejor })()`);
    await A(`(() => { H.veg.despejar(${L.x}, ${L.z}, 18); H.jugador.ubicar(${L.x}, ${L.z}, 0); for (let i = 0; i < 6; i++) H.jugador.actualizar(0.04); return 1 })()`);
    // la antorcha: una obra del Desafío, a 5 m
    const an = await A(`(() => { A.materiales(); const js = H.jugador.estado, p = H.PLANOS.find((q) => q.id === 'antorcha'); O.elegir(p);
      for (const d of [5, 7, 9]) for (const a of [0, 0.9, -0.9, 1.8, -1.8]) { const ang = js.yaw + a, x = js.pos.x - Math.sin(ang) * d, z = js.pos.z - Math.cos(ang) * d; const r = O.fundar(x, z, js.yaw, T.altura(x, z)); if (!r.ok) continue;
        while (r.obra.datos.etapas < r.obra.plano.etapas.length) if (!O.avanzar(r.obra, P.materiales).ok) break; O.elegir(null); P.obras = O.obras.map((o) => o.datos); return { ok: true, x: r.obra.datos.x, z: r.obra.datos.z }; }
      O.elegir(null); return { ok: false } })()`);
    ok(an.ok, 'se arma la antorcha');
    if (!an.ok) return;
    // de noche cerrada, la antorcha prendida; tres duendes quietos a 2,5, 5 y 11 m de la llama (en la misma dirección)
    await A(`(() => { P.horas = 22.5; P.desafio.especial = null; H.desafio.defensas.refrescar(); return 1 })()`);
    const u = { x: Math.cos(0.6), z: Math.sin(0.6) };
    await A(`(() => { for (const a of H.desafio.aliens) { a.estado = 'irse'; a.t = 9; } window.__pins = [];
      for (const d of [2.5, 5, 11]) { const x = ${an.x} + ${u.x} * d, z = ${an.z} + ${u.z} * d; const a = H.desafio.invocar(d === 5 ? 'bruto' : 'rastreador', x, z); if (a) { a.velMult = 0; a.vida = a.vidaMax = 9999; window.__pins.push({ a, x, z }); } } return window.__pins.length })()`);
    const avanzar = (seg) => A(`(() => { const pins = () => { for (const p of window.__pins || []) { p.a.m.g.position.x = p.x; p.a.m.g.position.z = p.z; } }; for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) { pins(); P.desafio.salud = Math.max(P.desafio.salud, 85); H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); } return 1 })()`);
    // tu sombra también cuenta: te parás a 4 m de la antorcha, del otro lado
    await A(`(() => { const x = ${an.x} - ${u.x} * 4, z = ${an.z} - ${u.z} * 4; H.jugador.ubicar(x, z, 0); for (let i = 0; i < 6; i++) H.jugador.actualizar(0.04); return 1 })()`);
    await avanzar(2.5);
    const e = await A(`(() => { const am = H.desafio.ambiente, g = am._sombras; const mallas = g.children.map((m) => ({ visible: m.visible, count: m.count, op: m.material.opacity }));
      return { vivas: am.sombrasVivas, grupo: g.visible, mallas } })()`);
    console.log('  sombras:', JSON.stringify(e));
    ok(e.vivas >= 3 && e.grupo, `hay sombras: la tuya y las de los duendes (${e.vivas})`);
    const vis = e.mallas.filter((m) => m.visible && m.count > 0);
    ok(vis.length >= 2 && new Set(vis.map((m) => m.op)).size === vis.length, `las sombras cercanas y lejanas van a mallas con opacidades distintas (${vis.map((m) => `${m.count}×${m.op}`).join(' · ')})`);
    // el costo en dibujos: con el grupo de sombras escondido y a la vista
    await A('A.sinHud()');
    const lado = { x: an.x - u.z * 8 + u.x * 4, z: an.z + u.x * 8 + u.z * 4 };
    await A(`A.camMundo(${lado.x}, 4.5, ${lado.z}, ${an.x + u.x * 4}, 0.2, ${an.z + u.z * 4})`);
    const costo = await A(`(() => { const g = H.desafio.ambiente._sombras; const ver = g.visible; g.visible = false; const sin = A.llamadasDirecto(); g.visible = ver; const con = A.llamadasDirecto();
      const n = g.children.filter((m) => m.visible && m.count > 0).length; return { sin: sin.calls, con: con.calls, mallas: n, trisCon: con.tris, trisSin: sin.tris } })()`);
    console.log('  dibujos con las sombras:', JSON.stringify(costo));
    ok(costo.con - costo.sin === costo.mallas && costo.mallas <= 3, `las sombras suman ${costo.con - costo.sin} llamadas de dibujo (una por nivel con sombras; antes era 1 en total): ${costo.sin} → ${costo.con}`);
    await avanzar(0.5); await esperar(400);
    await foto('sombras-de-costado');
    const atras = { x: an.x + u.x * 17, z: an.z + u.z * 17 };
    await A(`A.camMundo(${atras.x}, 1.7, ${atras.z}, ${an.x + u.x * 4}, 1.0, ${an.z + u.z * 4})`);
    await avanzar(0.5); await esperar(400);
    await foto('sombras-desde-atras');
    await A('A.sinCamara()');
    await A('(() => { window.__pins = []; for (const a of H.desafio.aliens) { a.estado = "irse"; a.t = 9; } return 1 })()');
  }

  try {
    seccion('carga');
    await abrir();
    const modo = MODO === 'desafio' ? 'desafio' : 'relax';
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'alta', clima: 'despejado', estacion: 'verano', musica: false, modo: ${JSON.stringify(modo)}, relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', limiteFps: 'libre' })); 1`);
    await abrir();
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) { listo = true; break; } }
    ok(listo, `carga el ${modo === 'desafio' ? 'Desafío' : 'Relax'}`);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(`window.addEventListener('blur', (e) => e.stopImmediatePropagation(), true); try { ${H}.volverAlJuego(); } catch {} 1`);
    await js(PAGINA);
    await A('(P.horas = 12, P.dia = 4, H.clima.estado.lluvia = 0, A.cuadros(3), 1)');
    if (modo === 'relax') {
      ok(await A('!!P.economia && P.modo !== "desafio"'), 'la partida es del Relax y trae economía');
      if (toca('oficios')) await oficios();
      if (toca('torreon')) await torreon();
    } else {
      ok(await A('!!H.desafio && !!H.desafio.puestosMundo && !!H.desafio.ambiente'), 'la partida es del Desafío (puestos y ambiente)');
      await A('(P.desafio.tutorial = 99, 1)');
      if (toca('tablero')) await tablero();
      if (toca('madrigueras')) await madrigueras();
      if (toca('sombras')) await sombras();
    }
    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});
