// 3.9.2 (prototipo): la anfitriona de la casa de té ('aldea-anfitriona', gente-ropa.js) en el juego de verdad: abre el valle,
// arma la aldea, la pone en la plaza con la luz de la tarde (como visor-personajes.cjs) y saca las tomas: cuerpo entero de frente,
// de tres cuartos, de espalda, de cerca (busto) y el rostro. No toca el núcleo: la crea con `gente.agregarPoblador`, como el visor
// hace con Inés. Perfil propio; nunca un cartel de error en la pantalla.
// Uso (después de `node armar.mjs`):
//   npx electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/visor-anfitriona.cjs [salida=<carpeta>] [hora=17.2] [calidad=alta]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
// (quien=<clave> nombre=<nombre>: otra persona del vestuario en el mismo lugar, p. ej. quien=aldea-bailarina nombre=Dalia)
const QUIEN = arg('quien', 'aldea-anfitriona'), NOMBRE = arg('nombre', 'Greta'), QUIETUD = arg('quietud', 'juntas');
const salida = arg('salida', path.join(raiz, 'pruebas', 'salidas', QUIEN.replace(/^aldea-/, '') + '-valle'));
const HORA = Number(arg('hora', '17.2')), CALIDAD = arg('calidad', 'alta');
const errores = [];
const anotarError = (tipo, e) => {
  const texto = `[visor-anfitriona] ${tipo}: ${e && e.stack ? e.stack : e}\n${errores.slice(-8).join('\n')}\n`;
  try { console.error(texto); fs.mkdirSync(salida, { recursive: true }); fs.appendFileSync(path.join(salida, 'errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
setTimeout(() => anotarError('tiempo', 'más de 8 minutos'), 8 * 60 * 1000).unref();
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const AYUDA = String.raw`(() => {
  const H = window.__hojarasca, M = H.__aldeaMundo(), T = H.T;
  const P = window.__proto = {};
  P.deAldea = () => (H.gente.gente || []).filter((n) => n.claveAldea);
  P.sol = () => { let s = null; H.escena.traverse((o) => { if (!s && o.isDirectionalLight && o.castShadow) s = o; });
    if (!s) H.escena.traverse((o) => { if (!s && o.isDirectionalLight) s = o; });
    s.updateMatrixWorld(); s.target.updateMatrixWorld();
    const dx = s.position.x - s.target.position.x, dy = s.position.y - s.target.position.y, dz = s.position.z - s.target.position.z;
    return { az: Math.atan2(dx, dz), alto: Math.atan2(dy, Math.hypot(dx, dz)) }; };
  P.parar = (n, x, z, r) => {
    n.deVisita = true; n.camino = null; n.ruta = null; n.pose = null; n.dormido = false; n.soloCerca = 0; n.espera = 0; n.vel = 0;
    n.pos.set(x, T.altura(x, z), z); n.rumbo = n.rumboObjetivo = r; n.g.rotation.y = r; n.miraFinal = r;
  };
  P.camara = (o, a, fov) => {
    const c = H.camara, js = H.jugador.estado;
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    js.yaw = yaw; js.pitch = pitch;
    c.position.set(o.x, o.y, o.z); c.rotation.order = 'YXZ'; c.rotation.set(pitch, yaw, 0);
    if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
    for (const k of c.children) k.visible = false;
  };
  P.despejado = (o, puntos) => {
    const rc = new H.THREE.Raycaster(), V = H.THREE.Vector3, gente = new Set((H.gente.gente || []).map((n) => n.g));
    const objetos = []; H.escena.traverse((x) => { if (x.isMesh && !x.isInstancedMesh && x.visible) { let q = x, de = false; while (q) { if (gente.has(q)) { de = true; break; } q = q.parent; } if (!de) objetos.push(x); } });
    for (const p of puntos) { const a = new V(o.x, o.y, o.z), b = new V(p.x, p.y, p.z), d = b.clone().sub(a); const L = d.length(); rc.set(a, d.normalize()); rc.far = L; if (rc.intersectObjects(objetos, false).some((h) => h.distance < L - 0.05)) return false; }
    return true;
  };
  P.hora = (h) => { H.progreso.horas = h; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0; };
  // un lugar despejado de la plaza, mirando con el sol de costado y adelante
  P.lugar = () => {
    if (P.centro) return P.centro;
    const s = P.sol(), r = s.az - 0.55;
    const fx0 = Math.sin(r), fz0 = Math.cos(r), lx0 = Math.cos(r), lz0 = -Math.sin(r);
    for (const lz of [41, 42.5, 39.5, 44, 38, 36.5, 35]) { for (const lx of [3, 4.5, 1.5, 7.5, 9, 10.5, 0, 12]) {
      const w = M.aMundo(lx, lz), y0 = T.altura(w.x, w.z);
      const puntos = [-0.9, 0, 0.8].flatMap((k) => [{ x: w.x + lx0 * k, z: w.z + lz0 * k, y: y0 + 0.9 }, { x: w.x + lx0 * k, z: w.z + lz0 * k, y: y0 + 1.5 }, { x: w.x + lx0 * k, z: w.z + lz0 * k, y: y0 + 0.2 }]);
      const o1 = { x: w.x + fx0 * 3, z: w.z + fz0 * 3, y: y0 + 0.95 }, o2 = { x: w.x + fx0 * 3.5 - lx0 * 0.4, z: w.z + fz0 * 3.5 - lz0 * 0.4, y: y0 + 1.65 };
      if (Math.abs(T.altura(o1.x, o1.z) - y0) < 0.4 && P.despejado(o1, puntos) && P.despejado(o2, puntos)) { P.centro = { lx, lz, r }; return P.centro; }
    } }
    P.centro = { lx: 2.2, lz: 39.5, r }; return P.centro;
  };
  return 1;
})()`;

// las tomas: la cámara respecto de ella (adelante positivo, a su derecha positivo), altura a la que mira, lente
const TOMAS = {
  'cuerpo': { d: 3.0, lado: 0, alto: 0.95, mira: 0.85, fov: 45, quietud: QUIETUD, gesto: 'sonrisa' },
  'tres-cuartos': { d: 2.8, lado: 1.9, alto: 1.0, mira: 0.85, fov: 45, quietud: QUIETUD, gesto: 'sonrisa' },
  'espalda': { d: -3.0, lado: 0.3, alto: 1.0, mira: 0.85, fov: 45, quietud: QUIETUD, gesto: null },
  'cerca': { d: 1.7, lado: 0.5, alto: 1.35, mira: 1.2, fov: 35, quietud: QUIETUD, gesto: 'sonrisa' },
  'rostro': { d: 1.0, lado: 0.25, alto: 1.52, mira: 1.5, fov: 30, quietud: QUIETUD, gesto: 'sonrisa' },
  'delantal': { d: 2.4, lado: -1.2, alto: 0.9, mira: 0.7, fov: 40, quietud: 'delantal', gesto: 'sonrisa' },
};

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: arg('ver', '0') === '1', width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${CALIDAD}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.gente').catch(() => false)) break; }
  if (!(await js('!!window.__hojarasca && !!window.__hojarasca.gente').catch(() => false))) { console.log('no cargó:\n' + errores.join('\n')); app.exit(1); return; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  await js(`window.__hojarasca.__aldeaMundo().listo().then(() => 1)`);
  await js(AYUDA);
  // la aldea completa, con la gente despierta en la plaza
  await js(`(() => { const H = window.__hojarasca, a = H.progreso.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
    a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); return 1 })()`);
  await js(`(() => { const H = window.__hojarasca, M = H.__aldeaMundo(), js = H.jugador.estado, p = M.aMundo(-2, 33);
    js.pos.set(p.x, H.T.altura(p.x, p.z), p.z); js.vel.set(0, 0, 0); window.__proto.hora(${HORA}); return 1 })()`);
  await js(`(async () => { const M = window.__hojarasca.__aldeaMundo(); M.actualizar(4, window.__hojarasca.camara.position); await M.listo(); M.montarCola(); return 1 })()`);
  let cuantos = 0;
  for (let i = 0; i < 80; i++) { await esperar(500); cuantos = await js(`(() => { window.__proto.hora(${HORA}); return window.__proto.deAldea().length })()`); if (cuantos >= 8) break; }
  console.log('gente de la aldea', cuantos);
  await js(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F4', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'F4', bubbles: true })); return 1 })()`);
  await esperar(500);
  // Greta, en la plaza
  console.log('lugar', await js(`(() => { const H = window.__hojarasca, P = window.__proto, M = H.__aldeaMundo(); const c = P.lugar(), w = M.aMundo(c.lx, c.lz);
    P.greta = H.gente.agregarPoblador({ clave: '${QUIEN}', colores: {}, pos: { x: w.x, z: w.z }, nombre: '${NOMBRE}', oficio: '', saludo: '', despedida: '', camino: [] });
    return JSON.stringify(c) })()`));
  const montar = (t) => `(() => { const H = window.__hojarasca, P = window.__proto, M = H.__aldeaMundo(), T = H.T, o = ${JSON.stringify(t)};
    P.hora(${HORA});
    const c0 = P.lugar(), c = M.aMundo(c0.lx, c0.lz), r = c0.r;
    const fx = Math.sin(r), fz = Math.cos(r), lx = Math.cos(r), lz = -Math.sin(r);
    P.parar(P.greta, c.x, c.z, r);
    P.greta.__gesto = o.gesto; P.greta.__quietud = o.quietud; P.greta.dormido = false;
    for (const n of P.deAldea()) n.dormido = true;   // nadie que tape
    const y0 = T.altura(c.x, c.z);
    const cam = { x: c.x + fx * o.d + lx * o.lado, z: c.z + fz * o.d + lz * o.lado, y: y0 + o.alto };
    P.camara(cam, { x: c.x, z: c.z, y: y0 + o.mira }, o.fov);
    return 1 })()`;
  const congelar = `(() => { window.__proto.hora(${HORA}); return 1 })()`;
  for (const [nombre, t] of Object.entries(TOMAS)) {
    await js(montar(t)); await esperar(2500); await js(montar(t)); await esperar(800); await js(congelar); await js(montar(t)); await esperar(600);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log('foto', nombre);
  }
  if (errores.length) console.log('consola:\n' + [...new Set(errores)].slice(0, 12).join('\n'));
  console.log('listo', salida);
  app.exit(0);
});
