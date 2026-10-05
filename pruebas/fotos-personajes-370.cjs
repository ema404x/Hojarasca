// 3.7.0 (personajes): las capturas de la gente en el juego real, para mirarlas. Abre el juego
// (?debug=1, calidad media, Relax, verano), pone la aldea completa, suma las nueve pobladoras de la
// 3.7.0 (si el núcleo todavía no las dio de alta) y saca, con la luz de la tarde:
//   · plaza-todos.png: todos en la plaza (unas 30 personas), como los ve el jugador;
//   · caras-6.png: seis caras de cerca (a 1 m, lente de 30°);
//   · chicos.png: Nahuel y Lucía con sus padres;
//   · nuevas.png: las nueve pobladoras de la 3.7.0, de cuerpo entero;
//   · sentados-mate.png: la gente sentada en los bancos de la plaza, con el mate a la boca;
//   · invierno.png: la plaza nevada, todos con la ropa de abrigo.
// Ventana oculta (con la pantalla apagada una ventana a la vista no dibuja), perfil propio, sin
// cuadros de error. Todo queda en pruebas/salidas/personajes-370/ (no va al repositorio).
// Uso (después de `node armar.mjs`): npx electron pruebas/fotos-personajes-370.cjs [tomas=plaza,caras,...]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'personajes-370');
const errores = [];
const anotarError = (tipo, e) => {
  const texto = `[fotos-personajes] ${tipo}: ${e && e.stack ? e.stack : e}\n${errores.slice(-8).join('\n')}\n`;
  try { console.error(texto); fs.mkdirSync(salida, { recursive: true }); fs.appendFileSync(path.join(salida, 'errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
const perfil = path.join(salida, '_perfil-fotos');
try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* que quede */ }
app.setPath('userData', perfil);
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const TOMAS = arg('tomas', 'plaza,caras,chicos,nuevas,sentados,invierno').split(',').filter(Boolean);
const HORA = Number(arg('hora', '16.6'));

// lo que corre en la página
const AYUDA = String.raw`(() => {
  const H = window.__hojarasca, M = H.__aldeaMundo(), T = H.T;
  const F = window.__fotos = {};
  F.deAldea = () => (H.gente.gente || []).filter((n) => n.claveAldea || n.nueva);
  F.npc = (k) => (H.gente.gente || []).find((n) => n.claveAldea === k || n.nueva === k);
  F.hora = (h) => { H.progreso.horas = h; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0; };
  F.parar = (n, x, z, r) => {
    n.deVisita = true; n.camino = null; n.ruta = null; n.pose = null; n.dormido = false; n.soloCerca = 0; n.espera = 0; n.vel = 0; n.asiento = undefined;
    n.pos.set(x, T.altura(x, z), z); n.rumbo = n.rumboObjetivo = r; n.g.rotation.y = r; n.miraFinal = r; n.__gesto = null; n.__quietud = undefined;
  };
  F.camara = (o, a, fov) => {
    const c = H.camara, js = H.jugador.estado;
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    // (la cámara libre, F4; el cuerpo del jugador abajo, donde la cámara: la gente lo mira)
    js.yaw = yaw; js.pitch = pitch; js.pos.set(o.x, T.altura(o.x, o.z), o.z);
    c.position.set(o.x, o.y, o.z); c.rotation.order = 'YXZ'; c.rotation.set(pitch, yaw, 0);
    if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
    F.sinMano();
  };
  // un cuadro del juego y la imagen en el acto (el lienzo todavía tiene lo dibujado)
  F.foto = () => { F.hora(F.h); F.sinMano(); H.__bucle(); return H.renderer.domElement.toDataURL('image/png'); };
  F.sinMano = () => { for (const k of H.camara.children) k.visible = false; };
  // ¿se ve de o a cada punto sin que nada se cruce? (sin contar la gente, el pasto ni lo invisible)
  F.despejado = (o, puntos) => {
    const rc = new H.THREE.Raycaster(), V = H.THREE.Vector3, gente = new Set((H.gente.gente || []).map((n) => n.g));
    const objetos = []; H.escena.traverse((x) => { if (x.isMesh && !x.isInstancedMesh && x.visible) { let q = x, de = false; while (q) { if (gente.has(q)) { de = true; break; } q = q.parent; } if (!de) objetos.push(x); } });
    for (const p of puntos) { const a = new V(o.x, o.y, o.z), b = new V(p.x, p.y, p.z), d = b.clone().sub(a); const L = d.length(); rc.set(a, d.normalize()); rc.far = L; if (rc.intersectObjects(objetos, false).some((h) => h.distance < L - 0.05)) return false; }
    return true;
  };
  F.sol = () => { let s = null; H.escena.traverse((o) => { if (!s && o.isDirectionalLight && o.castShadow) s = o; });
    s.updateMatrixWorld(); s.target.updateMatrixWorld();
    return Math.atan2(s.position.x - s.target.position.x, s.position.z - s.target.position.z); };
  // n cuadros de la gente y uno del juego (la pose, la mirada y los gestos se acomodan)
  F.cuadros = (n = 30) => { const js = H.jugador.estado; H.__bucle(); for (let i = 0; i < n; i++) { F.hora(F.h); H.gente.actualizar(1 / 30, js, H.camara, null, 0); } H.__bucle(); F.sinMano(); H.__bucle(); F.sinMano(); return 1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano', limiteFps:'libre'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.gente').catch(() => false)) break; }
  await esperar(3000);   // (el atlas de la gente se pinta en la portada)
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(2500);
  await js(`window.__hojarasca.volverAlJuego?.(); window.__hojarasca.ajustes.limiteFps = 'libre'; 1`);
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  await js(`window.__hojarasca.__aldeaMundo().listo().then(() => 1)`);
  await js(AYUDA);
  await js(`window.__fotos.h = ${HORA}; 1`);
  // la aldea completa, y el jugador en la plaza
  await js(`(() => { const H = window.__hojarasca, a = H.progreso.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
    a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1]));
    const M = H.__aldeaMundo(), p = M.aMundo(-2, 33); H.jugador.ubicar(p.x, p.z, 0); window.__fotos.hora(${HORA}); return 1 })()`);
  await js(`(async () => { const M = window.__hojarasca.__aldeaMundo(); M.actualizar(4, window.__hojarasca.camara.position); await M.listo(); M.montarCola(); return 1 })()`);
  for (let i = 0; i < 40; i++) { await js(`(() => { for (let i = 0; i < 6; i++) window.__hojarasca.__aldea.actualizar(0.6); window.__hojarasca.__bucle(); return 1 })()`); if (Number(await js('window.__fotos.deAldea().length')) >= 20) break; }
  // las nueve de la 3.7.0 (las que el núcleo todavía no haya dado de alta) e Inés
  const nuevas = ['veterinaria', 'fotografa', 'andinista', 'herbolaria', 'pintora', 'ceramista', 'botera', 'astronoma', 'modista'];
  await js(`(() => { const H = window.__hojarasca, F = window.__fotos, M = H.__aldeaMundo(); const c = M.aMundo(0, 0);
    for (const k of ${JSON.stringify(nuevas)}) { if (F.npc(k)) continue; const n = H.gente.agregarPoblador({ clave: 'poblador-' + k, colores: {}, pos: { x: c.x, z: c.z }, nombre: k, oficio: '', saludo: '', despedida: '', camino: [] }); n.nueva = k; }
    return F.deAldea().length })()`);
  // la cámara libre (F4, sólo en depuración): la cámara no sigue al cuerpo
  await js(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F4', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'F4', bubbles: true })); return 1 })()`);
  const lado = (await js('JSON.stringify(window.__fotos.deAldea().map((n) => n.claveAldea || n.nueva))'));
  console.log('gente', lado);

  // ---- las tomas
  const { nativeImage } = require('electron');
  const imagen = async () => nativeImage.createFromDataURL(await js('window.__fotos.foto()'));
  const foto = async (nombre) => { const img = await imagen(); fs.writeFileSync(path.join(salida, nombre), img.toPNG()); console.log('foto', nombre); return img; };
  const recorte = async (x0, y0, ancho, alto) => { const img = await imagen(); const s = img.getSize(); return img.crop({ x: Math.round(s.width * x0), y: Math.round(s.height * y0), width: Math.round(s.width * ancho), height: Math.round(s.height * alto) }).toDataURL(); };
  // un grupo en la plaza (en filas, mirando a la cámara) y la cámara a la altura de los ojos
  const enFilas = (claves, { porFila = 8, sep = 1.05, fondo = 1.5, lz0 = 41, lx0 = 3, dist = 7, alto = 1.62, fov = 60, miraY = 0.95, gesto = null } = {}) => `(() => {
    const H = window.__hojarasca, F = window.__fotos, M = H.__aldeaMundo(), T = H.T; F.hora(F.h);
    const todos = F.deAldea(); const quienes = ${JSON.stringify(claves)}.map(F.npc).filter(Boolean);
    for (const n of todos) if (!quienes.includes(n)) { F.parar(n, n.pos.x + 400, n.pos.z + 400, 0); }   // (los demás, lejos: no se ven)
    const az = F.sol() - 0.6, fx = Math.sin(az), fz = Math.cos(az), lx = Math.cos(az), lz = -Math.sin(az);
    // un lugar de la plaza donde la cámara no tenga nada delante (como visor-personajes.cjs)
    let c = null;
    for (const [qx, qz] of [[${lx0}, ${lz0}], [9, 41], [10.5, 42.5], [7.5, 44], [3, 41], [4.5, 41], [1.5, 41], [3, 42.5], [6, 41], [3, 39.5], [7.5, 42.5], [0, 41], [9, 41]]) {
      const w = M.aMundo(qx, qz), y0 = T.altura(w.x, w.z), o1 = { x: w.x + fx * ${dist}, z: w.z + fz * ${dist}, y: y0 + 1.6 };
      const pts = [-3, -1.5, 0, 1.5, 3].flatMap((k) => [{ x: w.x + lx * k, z: w.z + lz * k, y: y0 + 1.5 }, { x: w.x + lx * k, z: w.z + lz * k, y: y0 + 0.9 }, { x: w.x + lx * k, z: w.z + lz * k, y: y0 + 0.3 }]);
      if (Math.abs(T.altura(o1.x, o1.z) - y0) < 0.5 && F.despejado(o1, pts)) { c = w; break; }
    }
    if (!c) c = M.aMundo(${lx0}, ${lz0});
    quienes.forEach((n, i) => { const fila = Math.floor(i / ${porFila}), col = i % ${porFila}, enFila = Math.min(${porFila}, quienes.length - fila * ${porFila});
      const u = (col - (enFila - 1) / 2) * ${sep} + (fila % 2 ? ${sep} * 0.5 : 0), v = -fila * ${fondo};
      const x = c.x + lx * u + fx * v, z = c.z + lz * u + fz * v; F.parar(n, x, z, az + (Math.random() - 0.5) * 0.3);
      ${gesto ? `n.__gesto = '${gesto}';` : ''} });
    const o = { x: c.x + fx * ${dist}, z: c.z + fz * ${dist} }; o.y = T.altura(o.x, o.z) + ${alto};
    F.camara(o, { x: c.x - fx * 1.2, z: c.z - fz * 1.2, y: T.altura(c.x, c.z) + ${miraY} }, ${fov});
    F.cuadros(60); F.camara(o, { x: c.x - fx * 1.2, z: c.z - fz * 1.2, y: T.altura(c.x, c.z) + ${miraY} }, ${fov}); F.cuadros(5);
    return quienes.length })()`;
  const claves = JSON.parse(lado);
  if (TOMAS.includes('plaza')) {
    const n = await js(enFilas(claves, { porFila: 8, sep: 0.9, fondo: 1.15, dist: 4.6, fov: 72, miraY: 0.8, lx0: 9, lz0: 41 }));
    await foto('plaza-todos.png'); console.log('en la plaza', n);
  }
  if (TOMAS.includes('caras')) {
    const seis = ['panadera', 'herrero', 'abuela', 'andinista', 'fotografa', 'botera'];
    const recortes = [];
    for (const k of seis) {
      await js(enFilas([k], { dist: 3 }));
      await js(`(() => { const H = window.__hojarasca, F = window.__fotos, n = F.npc('${k}'); n.__gesto = 'neutral'; n.g.updateMatrixWorld(true);
        const c = new H.THREE.Vector3(); n.cabeza.getWorldPosition(c); c.y += 0.045 * n.g.scale.y; const r = n.g.rotation.y + 0.18;
        const o = { x: c.x + Math.sin(r) * 1.0, z: c.z + Math.cos(r) * 1.0, y: c.y + 0.02 }; F.camara(o, { x: c.x, y: c.y, z: c.z }, 30); F.cuadros(40); F.camara(o, { x: c.x, y: c.y, z: c.z }, 30); F.cuadros(3); return 1 })()`);
      recortes.push(await recorte(0.33, 0.12, 0.34, 0.76));
    }
    fs.writeFileSync(path.join(salida, 'caras-6.png'), await componer(recortes, 6));
    console.log('foto caras-6.png');
  }
  if (TOMAS.includes('chicos')) {
    await js(enFilas(['padre', 'nene', 'nena', 'madre'], { sep: 0.85, dist: 4.2, fov: 50, miraY: 0.75 }));
    await foto('chicos.png');
  }
  if (TOMAS.includes('nuevas')) {
    await js(enFilas(nuevas, { porFila: 9, sep: 0.82, dist: 6.2, fov: 55, miraY: 0.85 }));
    await foto('nuevas.png');
  }
  if (TOMAS.includes('sentados')) {
    // los bancos de la plaza: la gente sentada, uno con el mate a la boca (Rosa) y otro charlando
    const r = await js(`(() => { const H = window.__hojarasca, F = window.__fotos, M = H.__aldeaMundo(), T = H.T; F.hora(F.h);
      const pl = M.aMundo(0, 38); const bancos = (H.est.sentaderos || []).filter((s) => !s.cama && Math.hypot(s.x - pl.x, s.z - pl.z) < 16);
      if (!bancos.length) return 'sin bancos';
      // el banco con más lugares juntos
      bancos.sort((a, b) => Math.hypot(a.x - pl.x, a.z - pl.z) - Math.hypot(b.x - pl.x, b.z - pl.z));
      const b0 = bancos[0], juntos = bancos.filter((s) => Math.hypot(s.x - b0.x, s.z - b0.z) < 2.2).slice(0, 3);
      const quienes = ['panadera', 'abuela'].map(F.npc).filter(Boolean);
      for (const n of F.deAldea()) if (!quienes.includes(n)) F.parar(n, n.pos.x + 400, n.pos.z + 400, 0);
      const mira = (Number.isFinite(b0.mira) ? b0.mira : Number.isFinite(b0.rot) ? b0.rot : 0) + Math.PI;   // (el mira del asiento es el del jugador: la cámara mira hacia -z)
      quienes.forEach((n, i) => { const s = juntos[i] || juntos[0]; F.parar(n, s.x, s.z, mira); n.pose = 'sentado'; n.asiento = Math.max(0, s.y - 0.02 - T.altura(s.x, s.z)); });
      const fx = Math.sin(mira), fz = Math.cos(mira), o = { x: b0.x + fx * 2.6 + Math.cos(mira) * 0.6, z: b0.z + fz * 2.6 - Math.sin(mira) * 0.6 }; o.y = T.altura(o.x, o.z) + 1.25;
      F.camara(o, { x: b0.x, y: T.altura(b0.x, b0.z) + 0.75, z: b0.z }, 48);
      quienes[1].__gesto = 'sonrisa';
      F.cuadros(60);
      // Rosa: el mate a la boca (el ciclo del mate de gente.js, en lo alto del sorbo)
      const rosa = quienes[0]; rosa.fase = 9 * 0.66 + 9 * Math.ceil(rosa.fase / 9);
      F.cuadros(1); F.camara(o, { x: b0.x, y: T.altura(b0.x, b0.z) + 0.75, z: b0.z }, 48); H.__bucle();
      return JSON.stringify({ mira, juntos: juntos.length, s: Object.keys(b0) }); })()`);
    console.log('bancos', r);
    await foto('sentados-mate.png');
  }
  if (TOMAS.includes('invierno')) {
    await js(`(() => { const H = window.__hojarasca; H.ajustes.estacion = 'invierno'; H.gente.abrigar(true); for (const n of window.__fotos.deAldea()) if (!n.__invierno) H.gente.vestir(n, true); return 1 })()`);
    console.log('sin poncho', await js(`JSON.stringify(window.__fotos.deAldea().filter((n) => !n.conPoncho).map((n) => (n.claveAldea || n.nueva) + ':' + n.__invierno))`));
    for (let i = 0; i < 60; i++) await js(`(() => { window.__hojarasca.__bucle(); return 1 })()`);
    // (mientras la estación se acomoda, el juego pudo volver a vestir de verano a alguien que no se veía)
    await js(`(() => { const H = window.__hojarasca; H.gente.abrigar(true); for (const n of window.__fotos.deAldea()) if (!n.__invierno) H.gente.vestir(n, true); return 1 })()`);
    await js(enFilas(claves.slice(0, 16), { porFila: 8, sep: 0.95, fondo: 1.25, dist: 6, fov: 60, miraY: 0.7, lx0: 9, lz0: 41 }));
    await foto('invierno.png');
  }
  if (errores.length) console.log('consola:\n' + [...new Set(errores)].slice(0, 12).join('\n'));
  console.log('listo', salida);
  app.exit(0);

  // varias imágenes (dataURL) en una lámina, de a `columnas`
  async function componer(imgs, columnas) {
    const c = new BrowserWindow({ show: false, width: 400, height: 300, webPreferences: { backgroundThrottling: false } });
    await c.loadURL('about:blank');
    const datos = await c.webContents.executeJavaScript(`(async () => {
      const src = ${JSON.stringify(imgs)}, cols = ${columnas};
      const im = await Promise.all(src.map((s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = s; })));
      const W = im[0].width, Hh = im[0].height, sep = 6, filas = Math.ceil(im.length / cols);
      const cv = document.createElement('canvas'); cv.width = cols * (W + sep) - sep; cv.height = filas * (Hh + sep) - sep;
      const x = cv.getContext('2d'); x.fillStyle = '#1d1a17'; x.fillRect(0, 0, cv.width, cv.height);
      im.forEach((i, k) => x.drawImage(i, (k % cols) * (W + sep), Math.floor(k / cols) * (Hh + sep)));
      return cv.toDataURL('image/png'); })()`);
    c.destroy();
    return Buffer.from(datos.split(',')[1], 'base64');
  }
});
