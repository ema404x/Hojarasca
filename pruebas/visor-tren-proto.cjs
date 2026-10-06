// 3.7.3 (prototipo): capturas de "La trochita" mejorada en el juego real (src/tren-proto.js, detrás de
// `?debug=1&tren=proto`): el tren entero, la locomotora, de noche con el farol, con nieve, los
// interiores de los coches nuevos y el taller ferroviario junto a la estación de la aldea. Mide los
// dibujos y triángulos de cada toma y los del tren solo. Las fotos quedan en
// pruebas/salidas/proto-tren/ (no van al repositorio). Perfil propio (no toca el de las pruebas).
//
// Uso (después de `node armar.mjs`):
//   npx electron --no-sandbox -r ./herramientas/al-monitor.cjs pruebas/visor-tren-proto.cjs [toma,toma,...] [viejo]
//   (`viejo`: sin ?tren=proto, para medir el tren de siempre con la misma toma)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'proto-tren');
// nunca un cartel en la pantalla del usuario: el error va a la consola y a un archivo, y se cierra
const anotarError = (tipo, e) => {
  const texto = `[visor-tren-proto] ${tipo}: ${e && e.stack ? e.stack : e}\n`;
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
const viejo = process.argv.includes('viejo');

// Cada toma: `s` dónde para la locomotora (metros a lo largo de la vía; 'aldea' = en el andén de la
// aldea, con `ds` de corrimiento); `ojo` y `a` en el marco de un vagón (`vagon`: loco, tender, 0..5)
// [x al costado, y sobre el riel, z hacia adelante] o en el marco de la aldea (`aldea: true`, como
// visor-aldea-mundo: x a lo largo de la vía, z alejándose). `hora`, `estacion`, `fov`.
const TOMAS = {
  explorar: { explorar: true },
  'tren-completo': { s: 950, vagon: 'loco', ojo: [13, 3.3, 9], a: [0, 1.5, -22], hora: 17.6, fov: 56 },
  'locomotora-cerca': { s: 'valle', vagon: 'loco', ojo: [-4.6, 1.9, 7.6], a: [0, 1.5, -0.4], hora: 16.8, fov: 52 },
  'noche-farol': { s: 950, vagon: 'loco', ojo: [-3.6, 1.8, 12.5], a: [0, 1.1, -1], hora: 22.4, fov: 60 },
  'nieve-quitanieves': { s: 'valle', vagon: 'loco', ojo: [-3.1, 1.5, 8.2], a: [0, 1.0, 1.0], hora: 12.5, estacion: 'invierno', fov: 56 },
  'salamandra-adentro': { s: 'valle', vagon: 'primera', ojo: [-0.25, 2.6, -2.5], a: [0.5, 1.55, 0.4], hora: 18.6, fov: 70, adentro: true },
  'comedor-adentro': { s: 'valle', vagon: 'comedor', ojo: [0, 2.6, 3.9], a: [0.35, 1.75, -0.4], hora: 13, fov: 70, adentro: true },
  'dormitorio-adentro': { s: 'valle', vagon: 'dormitorio', ojo: [-0.7, 2.45, 1.8], a: [0.45, 1.7, -0.8], hora: 21.5, fov: 76, adentro: true },
  mirador: { s: 'valle', vagon: 'mirador', ojo: [-0.7, 2.55, 3.6], a: [-6, 1.6, -3], hora: 16.5, fov: 72, adentro: true },
  'carga-caballo': { s: 'valle', vagon: 'jaula', ojo: [4.4, 2.0, 2.6], a: [0, 1.5, 5.8], hora: 11, fov: 72 },
  'aerea-150': { s: 150, vagon: 'primera', ojo: [0.01, 110, 0], a: [0, 0, 0.1], hora: 12, fov: 70, extra: true },
  'aerea-600': { s: 600, vagon: 'primera', ojo: [0.01, 110, 0], a: [0, 0, 0.1], hora: 12, fov: 70, extra: true },
  'aerea-950': { s: 950, vagon: 'primera', ojo: [0.01, 110, 0], a: [0, 0, 0.1], hora: 12, fov: 70, extra: true },
  'aerea-1250': { s: 1250, vagon: 'primera', ojo: [0.01, 110, 0], a: [0, 0, 0.1], hora: 12, fov: 70, extra: true },
  'aerea-1500': { s: 1500, vagon: 'primera', ojo: [0.01, 110, 0], a: [0, 0, 0.1], hora: 12, fov: 70, extra: true },
  'aerea-1800': { s: 1800, vagon: 'primera', ojo: [0.01, 110, 0], a: [0, 0, 0.1], hora: 12, fov: 70, extra: true },
  'aerea-2120': { s: 2120, vagon: 'primera', ojo: [0.01, 110, 0], a: [0, 0, 0.1], hora: 12, fov: 70, extra: true },
  'tren-completo-b': { s: 950, vagon: 'jaula', ojo: [30, 5.5, 4], a: [0, 1.2, -1], hora: 17.6, fov: 64, extra: true },
  taller: { s: 'aldea', ds: 220, aldea: true, adentro: true, ojo: [13.4, 2.15, -6.8], a: [18.5, 0.9, -8.7], hora: 10.5, fov: 72 },
  'taller-fuera': { s: 'aldea', ds: 220, aldea: true, ojo: [2, 3.2, 2.5], a: [18, 2.2, -9], hora: 10.5, fov: 66 },
};

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const arg = process.argv.find((a) => /^[a-z0-9-]+(,[a-z0-9-]+)*$/.test(a) && a.split(',').every((t) => TOMAS[t]));
  const pedidas = (arg || Object.keys(TOMAS).filter((t) => !TOMAS[t].explorar && !TOMAS[t].extra).join(',')).split(',');
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon/.test(m)) { errores.push(m.slice(0, 400)); console.log('[página]', m.slice(0, 600)); } if (/tren-proto/.test(m)) console.log('[página]', m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  const search = viejo ? '?debug=1' : '?debug=1&tren=proto';
  await w.loadFile(url, { search });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; // si la carga falla (un error en la consola o el cartel de "No se pudo..."), se cierra enseguida:
    // la ventana sale en el monitor del usuario y no tiene que quedar abierta con el cartel
    const cartel = await js(`/No se pudo/.test(document.body?.innerText || '')`).catch(() => false);
    if (errores.length || cartel) { console.log('la página no arrancó:', errores[0] || 'cartel de error'); try { w.destroy(); } catch { /* ya */ } app.exit(1); return; } }
  if (!(await js('!!window.__hojarasca').catch(() => false))) { console.log('la página no arrancó (tiempo)'); try { w.destroy(); } catch { /* ya */ } app.exit(1); return; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  await js(`window.__hojarasca.__aldeaMundo().listo().then(() => 1)`);
  await js(`(() => { window.__hojarasca.__aldeaMundo().montarCola(); return 1 })()`);
  const informe = [];
  for (const nombre of pedidas) {
    const t = TOMAS[nombre];
    if (t.explorar) {
      const r = await js(`(() => { const H = window.__hojarasca, T = H.T, tr = H.tren, M = H.__aldeaMundo();
        const par = tr.paradas.map((p) => ({ n: p.nombre, s: +p.s.toFixed(1), x: +p.x.toFixed(1), z: +p.z.toFixed(1), y: +p.y.toFixed(2), ang: +p.ang.toFixed(3), aldea: !!p.aldea }));
        const perfil = [];
        for (let lz = -24; lz <= 4; lz += 2) { const fila = []; for (let lx = -40; lx <= 30; lx += 5) { const w = M.aMundo(lx, lz); fila.push((T.altura(w.x, w.z) - 25.24).toFixed(1)); } perfil.push(lz + ': ' + fila.join(' ')); }
        return JSON.stringify({ largo: tr.largo, par, perfil, proto: !!tr.tren.proto }, null, 1) })()`);
      console.log(r);
      fs.writeFileSync(path.join(salida, 'explorar.txt'), r);
      continue;
    }
    const poner = `(() => { const H = window.__hojarasca, T = H.T, tr = H.tren, js = H.jugador.estado, t = ${JSON.stringify(t)};
      H.progreso.horas = t.hora; H.clima.estado.nublado = 0.1;
      H.ajustes.estacion = t.estacion || 'verano';
      H.__U().uInvierno.value = t.estacion === 'invierno' ? 1 : 0;
      // el tren, parado donde va la toma
      const aldea = tr.paradas.find((p) => p.aldea);
      let s = t.s === 'aldea' ? aldea.s + (t.ds || 0) : t.s === 'valle' ? (window.__sValle ?? 0) : t.s;
      tr.est.s = ((s % tr.largo) + tr.largo) % tr.largo; tr.est.vel = 0; tr.est.parado = 1e6; tr.est.subido = false;
      H.__bucle && H.__bucle();
      let o, a;
      if (t.aldea) {
        const M = H.__aldeaMundo();
        const wo = M.aMundo(t.ojo[0], t.ojo[2]), wa = M.aMundo(t.a[0], t.a[2]);
        o = { x: wo.x, z: wo.z, y: T.altura(wo.x, wo.z) + t.ojo[1] };
        a = { x: wa.x, z: wa.z, y: T.altura(wa.x, wa.z) + t.a[1] };
        if (t.adentro) { o.y = aldea.y + t.ojo[1]; a.y = aldea.y + t.a[1]; }
      } else {
        const V = tr.tren.vagon ? tr.tren.vagon(t.vagon) : t.vagon === 'loco' ? tr.tren.loco : t.vagon === 'tender' ? tr.tren.tender : (tr.tren.coches[{ primera: 0, comedor: 1 }[t.vagon] ?? 1] || tr.tren.coches[0]);
        V.updateMatrixWorld(true);
        const v = new H.THREE.Vector3();
        const wo = v.set(...t.ojo).applyMatrix4(V.matrixWorld).clone(), wa = v.set(...t.a).applyMatrix4(V.matrixWorld).clone();
        o = { x: wo.x, y: wo.y, z: wo.z }; a = { x: wa.x, y: wa.y, z: wa.z };
        if (!t.adentro) o.y = Math.max(o.y, T.altura(o.x, o.z) + 0.6);
      }
      const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
      js.pos.set(o.x, o.y - 1.65, o.z); js.vel.set(0, 0, 0); js.vy = 0; js.yaw = yaw; js.pitch = pitch;
      const c = H.camara; c.position.set(o.x, o.y, o.z); c.rotation.order = 'YXZ'; c.rotation.set(pitch, yaw, 0);
      const fov = t.fov || 70; if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
      for (const k of c.children) k.visible = false;
      return 1 })()`;
    // dónde para el tren "en el valle": la vía con más desnivel al costado (el valle de fondo)
    if (t.s === 'valle') await js(`(() => { window.__sValle = ${process.env.S_VALLE || 'null'} ?? window.__hojarasca.tren.paradas.find((p) => p.aldea).s - 260; return 1 })()`);
    await js(poner);
    await esperar(3500);
    await js(poner);
    await esperar(2500);
    await js(poner);
    if (process.env.VISOR_JS) await js(`(() => { const H = window.__hojarasca; ${process.env.VISOR_JS}; return 1 })()`);
    await esperar(300);
    await js(poner);
    // (a veces la placa contesta UnknownVizError: se reintenta)
    let img = null;
    for (let k = 0; k < 4 && !img; k++) { try { img = await w.webContents.capturePage(); } catch (e) { console.log('captura falló, reintento', String(e).slice(0, 80)); await esperar(1500); } }
    if (!img) continue;
    fs.writeFileSync(path.join(salida, `${nombre}${viejo ? '-viejo' : ''}.png`), img.toPNG());
    const info = await js(`(() => { const H = window.__hojarasca, R = H.renderer; R.info.autoReset = false;
      R.info.reset(); R.render(H.escena, H.camara); const d = { dibujos: R.info.render.calls, tri: R.info.render.triangles };
      // el tren solo: todo lo demás oculto (y sin sombras: lo que dibuja la cámara)
      const g = H.tren.grupoLuces, ocultos = [];
      for (const k of H.escena.children) if (k !== g && k.visible && !k.isLight) { ocultos.push(k); k.visible = false; }
      R.info.reset(); R.render(H.escena, H.camara); const solo = { dibujos: R.info.render.calls, tri: R.info.render.triangles };
      for (const k of ocultos) k.visible = true;
      let tren = { mallas: 0, tri: 0 };
      g.traverse((o) => { if (o.isMesh) { tren.mallas++; const gg = o.geometry; tren.tri += (gg.index ? gg.index.count : gg.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); } });
      R.info.autoReset = true;
      return JSON.stringify({ ...d, trenSolo: solo, trenMallas: tren.mallas, trenTri: Math.round(tren.tri), taller: H.tren.tren.taller ? H.tren.tren.taller.medir() : null }) })()`);
    informe.push(`${nombre}${viejo ? ' (viejo)' : ''}: ${info}`);
    console.log('foto', nombre, info.slice(0, 300));
  }
  await js(`(() => { for (const k of window.__hojarasca.camara.children) k.visible = true; return 1; })()`);
  fs.writeFileSync(path.join(salida, viejo ? 'informe-viejo.txt' : 'informe.txt'), informe.join('\n') + (errores.length ? `\nerrores:\n${errores.join('\n')}` : ''));
  if (errores.length) console.log('errores de la página:\n' + errores.join('\n'));
  console.log('listo:', salida);
  app.exit(0);
});
