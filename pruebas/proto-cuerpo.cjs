// PROTOTIPO (cuerpo), rama proto-cuerpo (no va al juego): una mujer cualquiera ('proto-malla' en
// gente-ropa.js) con malla de baño de dos piezas, parada en la orilla del lago con la luz de la tarde,
// para ver cómo queda la piel pintada del estilo P sin ropa encima. Saca:
//   · proto-cuerpo-34.png: cuerpo entero, 3/4 de frente, cámara a la altura de los ojos (1600x900);
//   · proto-cuerpo-perfil.png: la misma, de perfil;
//   · proto-cuerpo-costo.txt: vértices, triángulos y dibujos frente a una vecina vestida.
// Uso (después de `node armar.mjs`), con HOJ_PERFIL=<carpeta propia>:
//   npx electron --no-sandbox -r <proy>\herramientas\al-monitor.cjs -r <proy>\herramientas\perfil-propio.cjs
//     <proy>\pruebas\proto-cuerpo.cjs <salida> [hora=17.2]
const { app, BrowserWindow, dialog, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
dialog.showErrorBox = () => {};
const raiz = path.resolve(__dirname, '..');
const args = process.argv.slice(process.argv.findIndex((a) => /proto-cuerpo\.cjs$/.test(a)) + 1);
const salida = path.resolve(args.find((a) => !a.includes('=')) || path.join(raiz, 'pruebas', 'salidas', 'proto-cuerpo'));
const arg = (n, d) => { const a = args.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const HORA = Number(arg('hora', '17.2'));
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 8 minutos'); app.exit(2); }, 8 * 60 * 1000).unref?.();
process.on('uncaughtException', (e) => { console.log('ERROR', e && e.stack); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log('ERROR', e && e.stack); app.exit(1); });

const AYUDA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T;
  const F = window.__fotos = {};
  F.hora = (h) => { H.progreso.horas = h; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0; };
  F.parar = (n, x, z, r) => {
    n.deVisita = true; n.camino = null; n.ruta = null; n.pose = null; n.dormido = false; n.soloCerca = 0; n.espera = 0; n.vel = 0; n.asiento = undefined;
    n.pos.set(x, T.altura(x, z), z); n.rumbo = n.rumboObjetivo = r; n.g.rotation.y = r; n.miraFinal = r; n.__gesto = null;
  };
  F.sinMano = () => { for (const k of H.camara.children) k.visible = false; };
  F.camara = (o, a, fov) => {
    const c = H.camara, js = H.jugador.estado;
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    js.yaw = yaw; js.pitch = pitch; js.pos.set(o.x, T.altura(o.x, o.z), o.z);
    c.position.set(o.x, o.y, o.z); c.rotation.order = 'YXZ'; c.rotation.set(pitch, yaw, 0);
    if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
    F.sinMano();
  };
  F.foto = () => { F.hora(F.h); F.sinMano(); H.__bucle(); return H.renderer.domElement.toDataURL('image/png'); };
  F.sol = () => { let s = null; H.escena.traverse((o) => { if (!s && o.isDirectionalLight && o.castShadow) s = o; });
    s.updateMatrixWorld(); s.target.updateMatrixWorld();
    return Math.atan2(s.position.x - s.target.position.x, s.position.z - s.target.position.z); };
  F.despejado = (o, puntos, sin) => {
    const rc = new H.THREE.Raycaster(), V = H.THREE.Vector3, objetos = [];
    H.escena.traverse((x) => { if (x.isMesh && !x.isInstancedMesh && x.visible && !sin.has(x)) objetos.push(x); });
    for (const p of puntos) { const a = new V(o.x, o.y, o.z), b = new V(p.x, p.y, p.z), d = b.clone().sub(a); const L = d.length(); rc.set(a, d.normalize()); rc.far = L; if (rc.intersectObjects(objetos, false).some((h) => h.distance < L - 0.05)) return false; }
    return true;
  };
  F.cuadros = (n = 30) => { const js = H.jugador.estado; H.__bucle(); for (let i = 0; i < n; i++) { F.hora(F.h); H.gente.actualizar(1 / 30, js, H.camara, null, 0); } H.__bucle(); F.sinMano(); H.__bucle(); F.sinMano(); return 1; };
  // lo que cuesta una persona: vértices, triángulos y dibujos (mallas visibles), cerca y lejos
  F.costo = (n) => { let v = 0, t = 0, d = 0, vr = 0, tr = 0; n.g.traverse((o) => { if (!o.isMesh) return; const g = o.geometry, tri = (g.index ? g.index.count : g.attributes.position.count) / 3;
      if (o === n.cara) { vr += g.attributes.position.count; tr += tri; return; } v += g.attributes.position.count; t += tri; d++; });
    const m = []; n.g.traverse((o) => { if (o.isSkinnedMesh) m.push(o); }); const u = m[0]?.userData || {};
    return { vertices: v, triangulos: Math.round(t), dibujos: d, rostroVertices: vr, rostroTriangulos: Math.round(tr), triangulosLejos: Math.round((u.indicesSinFino || 0) / 3) }; };
  return 1;
})()`;

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = async (c) => { const r = await w.webContents.executeJavaScript(c.trim().startsWith('(') ? `(() => { try { return (${c}); } catch (e) { return 'EXC ' + (e && e.stack); } })()` : c); if (typeof r === 'string' && r.startsWith('EXC ')) throw new Error(r + ' <- ' + c.slice(0, 200)); return r; };
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon|AudioContext/.test(m)) errores.push(m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano', limiteFps:'libre'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.gente').catch(() => false)) break; }
  await esperar(3000);
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(2500);
  await js(`window.__hojarasca.volverAlJuego?.(); window.__hojarasca.ajustes.limiteFps = 'libre'; 1`);
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  await js(AYUDA);
  await js(`window.__fotos.h = ${HORA}; window.__fotos.hora(${HORA}); 1`);
  await js(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F4', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'F4', bubbles: true })); return 1 })()`);
  for (let i = 0; i < 20; i++) await js(`(() => { window.__hojarasca.__bucle(); return 1 })()`);

  // las dos: la de la malla y, lejos (no se ve), una vecina vestida para comparar el costo
  const costo = await js(`(() => { const H = window.__hojarasca, F = window.__fotos;
    const nueva = (clave) => { const t0 = performance.now(); const n = H.gente.agregarPoblador({ clave, colores: {}, pos: { x: 0, z: 0 }, nombre: clave, oficio: '', saludo: '', despedida: '', camino: [] }); return [n, performance.now() - t0]; };
    const [m, tm] = nueva('proto-malla'), [v, tv] = nueva('poblador-veterinaria');
    window.__malla = m; window.__vestida = v;
    return JSON.stringify({ malla: { ...F.costo(m), armadoMs: +tm.toFixed(1) }, vestida: { ...F.costo(v), armadoMs: +tv.toFixed(1) } }, null, 2); })()`);
  console.log(costo);
  fs.writeFileSync(path.join(salida, 'proto-cuerpo-costo.txt'), costo + '\n');

  // la orilla: del lado del sol (la luz de la tarde de frente, un poco de costado), en tierra firme y
  // con la cámara despejada; ella a 1,2 m del agua, la cámara tierra adentro mirando al lago
  const lugar = await js(`(() => { const H = window.__hojarasca, F = window.__fotos, T = H.T, L = H.LAGO || { x: 150, z: 110 };
    F.hora(F.h); H.__bucle();
    const az = F.sol(), sin = new Set(); window.__malla.g.traverse((o) => sin.add(o)); window.__vestida.g.traverse((o) => sin.add(o));
    const a0 = Math.atan2(Math.cos(az - 0.5), Math.sin(az - 0.5));
    const agua = (x, z) => { const q = T.agua(x, z); return !!q && q.prof > 0.02; };
    const motivo = {}, no = (m) => { motivo[m] = (motivo[m] || 0) + 1; }; let plan = null;
    for (let k = 0; k < 90; k++) {
      const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.07, ox = Math.cos(a), oz = Math.sin(a), R0 = T.radioLago(a);
      let r = R0 * 0.8; while (r < R0 * 1.4 && agua(L.x + ox * r, L.z + oz * r)) r += 0.2;
      if (r >= R0 * 1.4) { no('sinOrilla'); continue; }
      const fx = L.x + ox * (r + 1.3), fz = L.z + oz * (r + 1.3), fy = T.altura(fx, fz);
      if (agua(fx, fz)) { no('ellaEnAgua'); continue; }
      // la cámara: tierra adentro, corrida de costado para el 3/4 (el lago queda en diagonal atrás)
      const ca = a + 0.32, d = 3.5, cx = fx + Math.cos(ca) * d, cz = fz + Math.sin(ca) * d, cy = T.altura(cx, cz);
      if (Math.abs(cy - fy) > 0.7 || agua(cx, cz)) { no('camara'); continue; }
      const pend = Math.abs(T.altura(fx + 0.5, fz) - T.altura(fx - 0.5, fz)) + Math.abs(T.altura(fx, fz + 0.5) - T.altura(fx, fz - 0.5));
      if (pend > 0.35) { no('pendiente'); continue; }
      const o = { x: cx, y: fy + 1.55, z: cz };
      const pts = [0.15, 0.9, 1.6].flatMap((h) => [-0.3, 0, 0.3].map((s) => ({ x: fx - oz * s, y: fy + h, z: fz + ox * s })));
      const cand = { fx, fz, fy, cx, cz, a, ca, az, k, pend: +pend.toFixed(2), R0, r };
      if (!F.despejado(o, pts, sin)) { no('tapado'); plan = plan || { ...cand, tapado: true }; continue; }
      return cand;
    }
    return plan || { nada: motivo, R0: T.radioLago(a0), L, aguaCentro: T.agua(L.x, L.z) }; })()`);
  console.log('lugar', JSON.stringify(lugar));
  if (!lugar || lugar.nada) { console.log('ERROR: sin lugar en la orilla'); app.exit(1); return; }

  const tomar = async (nombre, { dist, giro, fov, alto, miraY }) => {
    await js(`(() => { const H = window.__hojarasca, F = window.__fotos, T = H.T, m = window.__malla, v = window.__vestida, P = ${JSON.stringify(lugar)};
      F.parar(v, P.fx + 400, P.fz + 400, 0);
      // de frente a la cámara, girada ${giro} rad (el 3/4)
      const hacia = Math.atan2(P.cx - P.fx, P.cz - P.fz);
      F.parar(m, P.fx, P.fz, hacia + ${giro}); m.__quietud = 'cadera'; m.__gesto = 'neutral';
      const o = { x: P.fx + Math.cos(P.ca) * ${dist}, z: P.fz + Math.sin(P.ca) * ${dist} }; o.y = T.altura(o.x, o.z) * 0 + P.fy + ${alto};
      window.__toma = { o, a: { x: P.fx, y: P.fy + ${miraY}, z: P.fz }, fov: ${fov} };
      F.camara(o, window.__toma.a, ${fov}); F.cuadros(90); F.camara(o, window.__toma.a, ${fov}); F.cuadros(4); return 1 })()`);
    const img = nativeImage.createFromDataURL(await js('window.__fotos.foto()'));
    const s = img.getSize();
    const fin = s.width === 1600 ? img : img.resize({ width: 1600, height: Math.round(s.height * 1600 / s.width), quality: 'best' });
    fs.writeFileSync(path.join(salida, nombre), fin.toPNG());
    console.log('foto', nombre, JSON.stringify(s), '->', JSON.stringify(fin.getSize()));
  };
  await tomar('proto-cuerpo-34.png', { dist: 3.5, giro: 0.62, fov: 40, alto: 1.55, miraY: 0.92 });
  // de perfil: la cámara en el mismo lugar, ella girada 90°
  await tomar('proto-cuerpo-perfil.png', { dist: 3.5, giro: 1.57, fov: 40, alto: 1.55, miraY: 0.92 });
  if (errores.length) console.log('consola:\n' + [...new Set(errores)].slice(0, 12).join('\n'));
  console.log('listo', salida);
  app.exit(0);
});
