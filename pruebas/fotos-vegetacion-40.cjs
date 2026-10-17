// 4.0 (prototipo de vegetación y suelo): tomas fijas en el juego real (Relax, calidad alta), verano y otoño.
// Los puntos se buscan en el valle con reglas fijas (terreno y matas no cambian): son los mismos antes y después.
// Uso: npx electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/fotos-vegetacion-40.cjs salida=<carpeta relativa> [solo=a,b] [estaciones=verano,otono] [calidad=alta] [caminar=1]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const salida = path.resolve(raiz, arg('salida', path.join('pruebas', 'salidas', 'vegetacion-40')));
const solo = arg('solo', '').split(',').filter(Boolean);
const estaciones = arg('estaciones', 'verano,otono').split(',').filter(Boolean);
const calidad = arg('calidad', 'alta');
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 12 minutos'); salir(2); }, 12 * 60 * 1000).unref?.();

// busca los puntos de las tomas (en la página: tiene el terreno y las matas)
const BUSCAR = `(() => {
  const H = window.__hojarasca, T = H.T, ref = T.lugares.refugio;
  const fract = (v) => v - Math.floor(v);
  const hash = (x, y) => { let a = fract(x * 0.1031), b = fract(y * 0.1031), c = fract(x * 0.1031); const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33); a += d; b += d; c += d; return fract((a + b) * c); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const vn = (px, py) => { const ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const m1 = hash(ix, iy) * (1 - ux) + hash(ix + 1, iy) * ux, m2 = hash(ix, iy + 1) * (1 - ux) + hash(ix + 1, iy + 1) * ux; return m1 * (1 - uy) + m2 * uy; };
  const campo = (x, z) => Math.max(sm(0.64, 0.8, vn(x * 0.071 + 13.1, z * 0.071 * 0 + z * 0.071 + 7.7)), sm(0.66, 0.82, vn(x * 0.059 - 4.3, z * 0.059 - 21.9)));
  const dRef = (x, z) => Math.hypot(x - ref.x, z - ref.z);
  const salida = {};
  // flores: el punto con más flores en 5x5, cerca del refugio, en el prado abierto y llano
  let mejor = null;
  for (let z = -480; z < 480; z += 4) for (let x = -480; x < 480; x += 4) {
    const k = T.indice(x, z); if (T.agua(x, z) || T.bosque[k] > 0.12 || T.distSendero[k] < 5 || T.pendiente[k] > 0.2) continue;
    let s = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const kk = T.indice(x + i * 3, z + j * 3); s += campo(x + i * 3, z + j * 3) * sm(0.35, 0.75, T.pasto[kk]); }
    const puntaje = s - dRef(x, z) * 0.012;
    if (!mejor || puntaje > mejor.p) mejor = { p: puntaje, x, z };
  }
  salida.flores = mejor;
  // orilla del lago: sin agua, y agua a 3-4 m
  let orilla = null;
  for (let z = -480; z < 480; z += 3) for (let x = -480; x < 480; x += 3) {
    if (T.agua(x, z) || T.bosque[T.indice(x, z)] > 0.5 || T.distSendero[T.indice(x, z)] < 3) continue;
    for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4, wx = x + Math.cos(an) * 5, wz = z + Math.sin(an) * 5;
      if (T.agua(wx, wz) && T.agua(x + Math.cos(an) * 9, z + Math.sin(an) * 9) && !T.agua(x - Math.cos(an) * 3, z - Math.sin(an) * 3)) { const p = -dRef(x, z); if (!orilla || p > orilla.p) orilla = { p, x, z, ang: an }; } }
  }
  salida.orilla = orilla;
  // camino: bosque tupido, a 2-3 m del sendero; mira a lo largo del sendero
  let cam = null;
  for (let z = -480; z < 480; z += 3) for (let x = -480; x < 480; x += 3) {
    const k = T.indice(x, z); if (T.agua(x, z) || T.bosque[k] < 0.3 || T.pendiente[k] > 0.25) continue;
    const d = T.distSendero[k]; if (d < 2.0 || d > 4.0) continue;
    const gx = T.distSendero[T.indice(x + 2, z)] - T.distSendero[T.indice(x - 2, z)], gz = T.distSendero[T.indice(x, z + 2)] - T.distSendero[T.indice(x, z - 2)];
    const gl = Math.hypot(gx, gz); if (gl < 0.5) continue;
    const p = -dRef(x, z); if (!cam || p > cam.p) cam = { p, x, z, tx: -gz / gl, tz: gx / gl, nx: -gx / gl, nz: -gz / gl };
  }
  salida.camino = cam;
  // piedras: la roca con más rocas a 7 m
  const rocas = H.veg.matas.filter((m) => m.tipo === 'roca');
  let pied = null;
  for (const m of rocas) { const k = T.indice(m.x, m.z); if (T.agua(m.x, m.z) || T.pendiente[k] > 0.3 || T.distSendero[k] < 3) continue;
    const vec = rocas.filter((n) => Math.hypot(n.x - m.x, n.z - m.z) < 7).length; const p = vec * 10 - dRef(m.x, m.z) * 0.02 - T.pasto[k] * 40; if (!pied || p > pied.p) pied = { p, x: m.x, z: m.z, vec }; }
  salida.piedras = pied;
  // piedra de bosque (a la sombra de los árboles) y un tronco caído, de la misma manera
  let pb = null;
  for (const m of rocas) { const k = T.indice(m.x, m.z); if (T.agua(m.x, m.z) || T.pendiente[k] > 0.3 || T.distSendero[k] < 2.5 || T.bosque[k] < 0.5) continue;
    const p = -dRef(m.x, m.z) * 0.02 - T.pasto[k] * 40 + T.bosque[k] * 5; if (!pb || p > pb.p) pb = { p, x: m.x, z: m.z }; }
  salida.piedraBosque = pb;
  let tr = null;
  salida.nTroncos = H.veg.matas.filter((q) => q.tipo === 'tronco').length;
  try { for (const m of H.veg.matas.filter((q) => q.tipo === 'tronco')) { const k = T.indice(m.x, m.z); if (T.agua(m.x, m.z) || T.pendiente[k] > 0.3 || T.distSendero[k] < 2.5) continue;
    const M = [0, 0, 0, 0, 0, 0, 0, 0, 0.7071, 0, 0.7071], la = 1;   // (el chunk ya no guarda la matriz: la toma va en diagonal, sin saber hacia dónde mira el tronco)
    const p = -dRef(m.x, m.z) * 0.02 - T.pasto[k] * 40 + T.bosque[k] * 3; if (!tr || p > tr.p) tr = { p, x: m.x, z: m.z, ax: M[8] / la, az: M[10] / la }; } } catch (e) { salida.errTronco = String(e); }
  salida.tronco = tr;
  salida.rocas = rocas.length;
  salida.mirador = { x: T.lugares.mirador.x, z: T.lugares.mirador.z };
  return JSON.stringify(salida);
})()`;

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.focus();
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const url = path.resolve(raiz, arg('pagina', 'index.html'));   // pagina=<ruta> para sacar el «antes» de una versión armada aparte
  const sinHud = `(() => { let s = document.getElementById('sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'sin-hud'; document.head.appendChild(s); } s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; return 1 })()`;
  for (const est of estaciones) {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'${est}'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.est)`).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
    await js(sinHud);
    await js(`(() => { for (const o of ${H}.escena.children) if (o.isPoints) Object.defineProperty(o, 'visible', { get: () => false, set: () => {} }); return 1 })()`);
    const P = JSON.parse(await js(BUSCAR));
    console.log('puntos', JSON.stringify(P));
    const L = P.mirador;
    const TOMAS = {
      'valle-mirador': { ojo: [L.x, 2.0, L.z], mira: [150, 3, 110], fov: 70, horas: 11.5 },
      'valle-prado': { ojo: [P.flores.x - 30, 6, P.flores.z - 30], mira: [P.flores.x, 0.5, P.flores.z], fov: 66, horas: 11.5 },
      'flores-ojos': { ojo: [P.flores.x - 3.2, 1.25, P.flores.z - 3.2], mira: [P.flores.x + 4, 0.55, P.flores.z + 4], fov: 62, horas: 11.5 },
      'flores-cerca': { ojo: [P.flores.x - 1.4, 0.7, P.flores.z - 1.4], mira: [P.flores.x + 3, 0.5, P.flores.z + 3], fov: 58, horas: 16.5 },
      'orilla-lago': { ojo: [P.orilla.x, 1.7, P.orilla.z], mira: [P.orilla.x + Math.cos(P.orilla.ang) * 14, 0.5, P.orilla.z + Math.sin(P.orilla.ang) * 14], fov: 66, horas: 11.5 },
      'camino-hojas': { ojo: [P.camino.x, 1.7, P.camino.z], mira: [P.camino.x + P.camino.tx * 12 + P.camino.nx * 1.5, 0.3, P.camino.z + P.camino.tz * 12 + P.camino.nz * 1.5], fov: 64, horas: 12 },
      'piso-bosque': { ojo: [P.camino.x - P.camino.nx * 2, 1.5, P.camino.z - P.camino.nz * 2], mira: [P.camino.x - P.camino.nx * 5, 0.0, P.camino.z - P.camino.nz * 5], fov: 60, horas: 12 },
      'piedras-cerca': { ojo: [P.piedraBosque.x - 1.7, 0.9, P.piedraBosque.z - 1.7], mira: [P.piedraBosque.x, 0.3, P.piedraBosque.z], fov: 58, horas: 12 },
      'piedras-lejos': { ojo: [P.piedraBosque.x - 12, 2.0, P.piedraBosque.z - 12], mira: [P.piedraBosque.x, 0.4, P.piedraBosque.z], fov: 55, horas: 12 },
      'piedras-tarde': { ojo: [P.piedraBosque.x + 2.6, 1.2, P.piedraBosque.z + 2.6], mira: [P.piedraBosque.x, 0.4, P.piedraBosque.z], fov: 58, horas: 17.5 },
      'piedras-sur': { ojo: [P.piedraBosque.x, 1.2, P.piedraBosque.z + 3.0], mira: [P.piedraBosque.x, 0.4, P.piedraBosque.z], fov: 58, horas: 9.5 },
      'piedra-bosque': { ojo: [P.piedraBosque.x - 2.6, 1.2, P.piedraBosque.z - 2.6], mira: [P.piedraBosque.x, 0.4, P.piedraBosque.z], fov: 58, horas: 12 },
      'tronco-n': { ojo: [P.tronco.x, 1.1, P.tronco.z + 4.2], mira: [P.tronco.x, 0.3, P.tronco.z], fov: 62, horas: 12 },
      'tronco-e': { ojo: [P.tronco.x + 4.2, 1.1, P.tronco.z], mira: [P.tronco.x, 0.3, P.tronco.z], fov: 62, horas: 12 },
      'tronco-o': { ojo: [P.tronco.x - 4.2, 1.1, P.tronco.z], mira: [P.tronco.x, 0.3, P.tronco.z], fov: 62, horas: 12 },
      'tronco-s': { ojo: [P.tronco.x, 1.1, P.tronco.z - 4.2], mira: [P.tronco.x, 0.3, P.tronco.z], fov: 62, horas: 12 },
      'tronco': { ojo: [P.tronco.x - P.tronco.az * 3.4, 1.1, P.tronco.z + P.tronco.ax * 3.4], mira: [P.tronco.x, 0.3, P.tronco.z], fov: 60, horas: 12 },
      'piedras': { ojo: [P.piedras.x - 3.2, 1.35, P.piedras.z - 3.2], mira: [P.piedras.x, 0.5, P.piedras.z], fov: 58, horas: 12 },
    };
    const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
    const poner = (t) => js(`(() => { const H = ${H}, T = H.T;
      const o = { x: ${t.ojo[0]}, z: ${t.ojo[2]} }; o.y = T.altura(o.x, o.z) + ${t.ojo[1]};
      const b = { x: ${t.mira[0]}, z: ${t.mira[2]} }; b.y = T.altura(b.x, b.z) + ${t.mira[1]};
      const dx = b.x - o.x, dz = b.z - o.z, d = Math.hypot(dx, dz);
      const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(b.y - o.y, d);
      H.jugador.ubicar(o.x, o.z, 0);
      H.__camaraFija = { x: o.x, y: o.y, z: o.z, yaw, pitch }; H.camara.fov = ${t.fov}; H.camara.updateProjectionMatrix();
      H.progreso.horas = ${t.horas}; H.camara.children.forEach((q) => { q.visible = false; }); return 1 })()`);
    for (const [nombre, t] of Object.entries(TOMAS)) {
      if (solo.length && !solo.includes(nombre)) continue;
      await poner(t);
      for (let i = 0; i < 150; i++) { await js(`${H}.progreso.horas = ${t.horas}; 1`); await cuadro(1); await esperar(25); }
      await esperar(400);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, `${nombre}-${est}.png`), img.toPNG());
      console.log('  ' + nombre + '-' + est + '.png');
    }
  }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  salir(0);
});
