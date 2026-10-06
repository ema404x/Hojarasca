// 3.7.3 (tren): capturas de la trochita mejorada en el juego real (Relax), con perfil propio (no toca el de las
// pruebas): el tren sin mejoras (el de siempre: la locomotora vieja con los dos coches de segunda), el tren
// completo (todo lo del taller y 4 vagones), de noche con el farol y en la nieve con el quitanieves. Mide los
// dibujos, los triángulos y los ms de cada toma (y los del tren solo). Las fotos quedan en
// pruebas/salidas/tren-373/ (no van al repositorio).
//
// Uso (después de `node armar.mjs`):
//   npx electron --no-sandbox -r ./herramientas/al-monitor.cjs pruebas/fotos-tren-373.cjs [toma,toma,...]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'tren-373');
const anotarError = (tipo, e) => {
  const texto = `[fotos-tren-373] ${tipo}: ${e && e.stack ? e.stack : e}\n`;
  try { console.error(texto); fs.mkdirSync(salida, { recursive: true }); fs.appendFileSync(path.join(salida, 'errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
const perfil = path.join(salida, '_perfil');
try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* que quede */ }
app.setPath('userData', perfil);
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const COMPLETO = {
  loco: { caldera: 3, freno: 3, farol: true, silbato: 'doble', quitanieves: true, arenero: true, pintura: { cuerpo: '#2f5a3a', franja: '#e8c870', ruedas: '#c8402a' }, nombre: 'La Hojarasca', banderines: true },
  vagones: { pasajeros: true, comedor: true, carga: true, caballo: true, mirador: true, dormitorio: true },
  composicion: ['pasajeros', 'comedor', 'caballo', 'mirador'],
};
const NOCHE = { ...COMPLETO, loco: { ...COMPLETO.loco, pintura: { cuerpo: null, franja: null, ruedas: null } }, composicion: ['pasajeros', 'dormitorio', 'carga', 'mirador'] };
// Cada toma: `s` dónde para la locomotora ('valle': un tramo con el valle de fondo); `ojo` y `a` en el marco de un
// vagón [x al costado, y sobre el riel, z hacia adelante]; `estado`: lo del taller; `hora`, `estacion`, `fov`;
// `nieve`: tramos de vía tapados (metros adelante de la locomotora); `adentro`: la cámara dentro de un coche.
const TOMAS = {
  'sin-mejoras': { s: 'valle', vagon: 'loco', ojo: [12, 3.6, 10], a: [0, 1.4, -14], hora: 16.8, fov: 58, estado: null },
  completo: { s: 'valle', vagon: 'loco', ojo: [13, 3.8, 11], a: [0, 1.4, -22], hora: 16.8, fov: 60, estado: COMPLETO },
  'noche-farol': { s: 'valle', vagon: 'loco', ojo: [-3.4, 2.0, 11.5], a: [0, 1.2, -2], hora: 22.4, fov: 62, estado: NOCHE },
  'nieve-quitanieves': { s: 'valle', vagon: 'loco', ojo: [-3.6, 1.8, 10.5], a: [0, 0.9, 2], hora: 12.5, fov: 58, estacion: 'invierno', estado: COMPLETO, nieve: [{ desde: 4.6, hasta: 40 }] },
  'salamandra': { s: 'valle', vagon: 'pasajeros', ojo: [-0.25, 2.55, -2.8], a: [0.3, 1.6, 0.6], hora: 18.6, fov: 72, adentro: true, estado: COMPLETO },
  'comedor': { s: 'valle', vagon: 'comedor', ojo: [-0.3, 2.5, 0.2], a: [0.4, 1.8, -3.6], hora: 13, fov: 72, adentro: true, estado: COMPLETO, cocinar: true },
  'dormitorio-noche': { s: 'valle', vagon: 'dormitorio', ojo: [-0.7, 2.45, 1.8], a: [0.45, 1.7, -0.8], hora: 22, fov: 76, adentro: true, estado: NOCHE },
  'jaula-caballo': { s: 'valle', vagon: 'caballo', ojo: [4.2, 2.1, 2.4], a: [0, 1.5, 0.2], hora: 11, fov: 66, estado: COMPLETO, caballo: true },
  'noche-curva': { s: 'curva', vagon: 'loco', ojo: [0.01, 34, -6], a: [0, 0, 18], hora: 22.6, fov: 70, estado: NOCHE },
};

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const arg = process.argv.find((a) => /^[a-z0-9-]+(,[a-z0-9-]+)*$/.test(a) && a.split(',').every((t) => TOMAS[t]));
  const pedidas = (arg || Object.keys(TOMAS).join(',')).split(',');
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon|AudioContext/.test(m)) { errores.push(m.slice(0, 400)); console.log('[página]', m.slice(0, 600)); } if (/\[tren\]/.test(m)) console.log('[página]', m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  const search = '?debug=1';
  await w.loadFile(url, { search });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search });
  for (let i = 0; i < 300; i++) {
    await esperar(1000);
    if (await js('!!window.__hojarasca').catch(() => false)) break;
    const cartel = await js(`/No se pudo/.test(document.body?.innerText || '')`).catch(() => false);
    if (errores.length || cartel) { console.log('la página no arrancó:', errores[0] || 'cartel de error'); try { w.destroy(); } catch { /* ya */ } app.exit(1); return; }
  }
  if (!(await js('!!window.__hojarasca').catch(() => false))) { console.log('la página no arrancó (tiempo)'); try { w.destroy(); } catch { /* ya */ } app.exit(1); return; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  // (los programas de shader: cuáles aparecen en cada toma, para ver que el tren no compile nada a mitad del juego)
  const listaProgramas = () => js(`window.__hojarasca.renderer.info.programs.map((p) => p.name + ' · ' + String(p.cacheKey).replace(/\\s+/g, ' ').slice(0, 160))`);
  await esperar(4000);
  let antes = new Set(await listaProgramas());
  const informe = [`programas al empezar: ${antes.size}`];
  for (const nombre of pedidas) {
    const t = TOMAS[nombre];
    const poner = `(() => { const H = window.__hojarasca, T = H.T, tr = H.tren, js = H.jugador.estado, t = ${JSON.stringify(t)};
      H.progreso.horas = t.hora; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0;
      H.ajustes.estacion = t.estacion || 'verano';
      H.__U().uInvierno.value = t.estacion === 'invierno' ? 1 : 0;
      let s = t.s === 'valle' ? (window.__sValle ?? 0) : t.s === 'curva' ? (window.__sCurva ?? 0) : t.s;
      tr.est.s = ((s % tr.largo) + tr.largo) % tr.largo; tr.est.vel = t.nieve ? 2.5 : 0; tr.est.parado = 1e6; tr.est.subido = false;
      H.__bucle && H.__bucle();
      const V = tr.tren.vagon(t.vagon);
      V.updateMatrixWorld(true);
      const v = new H.THREE.Vector3();
      const wo = v.set(...t.ojo).applyMatrix4(V.matrixWorld).clone(), wa = v.set(...t.a).applyMatrix4(V.matrixWorld).clone();
      const o = { x: wo.x, y: wo.y, z: wo.z }, a = { x: wa.x, y: wa.y, z: wa.z };
      if (!t.adentro) o.y = Math.max(o.y, T.altura(o.x, o.z) + 0.6);
      const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
      js.pos.set(o.x, o.y - 1.65, o.z); js.vel.set(0, 0, 0); js.vy = 0; js.yaw = yaw; js.pitch = pitch;
      const c = H.camara; c.position.set(o.x, o.y, o.z); c.rotation.order = 'YXZ'; c.rotation.set(pitch, yaw, 0);
      const fov = t.fov || 70; if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
      for (const k of c.children) k.visible = false;
      return 1 })()`;
    // dónde para el tren "en el valle": antes de la aldea, con el valle de fondo; "en la curva": la más cerrada
    await js(`(() => { const H = window.__hojarasca, tr = H.tren;
      window.__sValle = ${process.env.S_VALLE || 'null'} ?? tr.paradas.find((p) => p.aldea).s - 260;
      if (window.__sCurva == null) { let mejor = 0, giro = 0; for (let s = 0; s < tr.largo; s += 10) { const a = tr.enVia(s).ang, b = tr.enVia(s + 24).ang; let d = Math.abs(b - a); if (d > Math.PI) d = 2 * Math.PI - d; if (d > giro) { giro = d; mejor = s; } } window.__sCurva = mejor - 6; }
      return 1 })()`);
    // lo del taller, la nieve, la cocina y el caballo
    await js(`(() => { const H = window.__hojarasca, t = ${JSON.stringify(t)}, tr = H.tren;
      H.progreso.tren = t.estado ? JSON.parse(JSON.stringify(t.estado)) : undefined;
      tr.tren.aplicarMejoras(H.progreso.tren);
      tr.taparVia(null);
      H.progreso.trenViaje = { caballo: !!t.caballo };
      tr.tren.ponerCaballo(H.__caballo()?.apariencia?.() || null); tr.tren.subirCaballo(!!t.caballo);
      if (t.cocinar && H.__cocinaComedor()) { H.progreso.cocina.moviles['tren-comedor'] = { receta: 'locro', paso: 2, falta: 1, dia: H.progreso.dia }; }
      else if (H.progreso.cocina) delete H.progreso.cocina.moviles['tren-comedor'];
      return 1 })()`);
    await js(poner);
    if (t.nieve) await js(`(() => { const tr = window.__hojarasca.tren; tr.taparVia(${JSON.stringify(t.nieve)}.map((x) => ({ desde: tr.est.s + x.desde, hasta: tr.est.s + x.hasta }))); return 1 })()`);
    await esperar(3500);
    await js(poner);
    await esperar(2500);
    await js(poner);
    if (process.env.VISOR_JS) await js(`(() => { const H = window.__hojarasca; ${process.env.VISOR_JS}; return 1 })()`);
    await esperar(300);
    await js(poner);
    let img = null;
    for (let k = 0; k < 4 && !img; k++) { try { img = await w.webContents.capturePage(); } catch (e) { console.log('captura falló, reintento', String(e).slice(0, 80)); await esperar(1500); } }
    if (!img) continue;
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    const info = await js(`(() => { const H = window.__hojarasca, R = H.renderer; R.info.autoReset = false;
      R.info.reset(); R.render(H.escena, H.camara); const d = { dibujos: R.info.render.calls, tri: R.info.render.triangles };
      // los ms del cuadro entero (diez cuadros, el promedio)
      const t0 = performance.now(); for (let i = 0; i < 10; i++) H.__bucle(); const ms = +((performance.now() - t0) / 10).toFixed(2);
      // el tren solo: todo lo demás oculto (lo que dibuja la cámara)
      const g = H.tren.grupoLuces, ocultos = [];
      for (const k of H.escena.children) if (k !== g && k.visible && !k.isLight) { ocultos.push(k); k.visible = false; }
      R.info.reset(); R.render(H.escena, H.camara); const solo = { dibujos: R.info.render.calls, tri: R.info.render.triangles };
      for (const k of ocultos) k.visible = true;
      R.info.autoReset = true;
      return JSON.stringify({ ...d, ms, trenSolo: solo, tren: H.tren.tren.medir(), programas: R.info.programs.length }) })()`);
    informe.push(`${nombre}: ${info}`);
    console.log('foto', nombre, info.slice(0, 400));
    const ahora = await listaProgramas();
    const nuevos = ahora.filter((p) => !antes.has(p));
    if (nuevos.length) { informe.push(`  programas nuevos en ${nombre}:\n    ${nuevos.join('\n    ')}`); console.log(`  programas nuevos (${nuevos.length}):`, nuevos.map((p) => p.slice(0, 120)).join(' | ')); }
    antes = new Set(ahora);
  }
  await js(`(() => { for (const k of window.__hojarasca.camara.children) k.visible = true; return 1; })()`);
  fs.writeFileSync(path.join(salida, 'informe.txt'), informe.join('\n') + (errores.length ? `\nerrores:\n${errores.join('\n')}` : ''));
  if (errores.length) console.log('errores de la página:\n' + errores.join('\n'));
  console.log('listo:', salida);
  app.exit(0);
});
