// 3.8 (prototipo de imágenes): capturas de los duendes del Desafío en el juego real (src/duendes-proto.js,
// detrás de `?debug=1&duendes=proto`): las opciones de estilo para elegir (duendes A-D, el Rey 1-3, el
// Coihue Viejo 1-3, las semillas 1-2), las láminas para comparar y las escenas (travieso, viejo de noche,
// lechuza, rey, coihue afuera y adentro, nido y madriguera, ataque). Mide el costo con 30 duendes.
// Las fotos quedan en pruebas/salidas/proto-duendes/ (no van al repositorio). Perfil propio.
//
// Uso (después de `node armar.mjs`):
//   npx electron --no-sandbox -r ./herramientas/al-monitor.cjs pruebas/visor-duendes-proto.cjs [toma,toma,...] [estilo=A]
//   (sin tomas: todas; `laminas`: sólo arma las láminas con las fotos que ya estén)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'proto-duendes');
// nunca un cartel en la pantalla del usuario: el error va a la consola y a un archivo, y se cierra
const anotarError = (tipo, e) => {
  const texto = `[visor-duendes-proto] ${tipo}: ${e && e.stack ? e.stack : e}\n`;
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
// todo el visor tiene un tope: si algo se cuelga, se cierra solo
setTimeout(() => anotarError('tiempo', 'el visor tardó más de 25 minutos'), 25 * 60 * 1000).unref();
const elegido = ((process.argv.find((a) => /^estilo=/.test(a)) || 'estilo=C').split('=')[1] || 'C').toUpperCase();

const TOMAS = {
  'opcion-A-duendes': ['opcion-duendes', { estilo: 'A' }],
  'opcion-B-duendes': ['opcion-duendes', { estilo: 'B' }],
  'opcion-C-duendes': ['opcion-duendes', { estilo: 'C' }],
  'opcion-D-duendes': ['opcion-duendes', { estilo: 'D' }],
  'opcion-rey-1': ['opcion-rey', { n: 1 }],
  'opcion-rey-2': ['opcion-rey', { n: 2 }],
  'opcion-rey-3': ['opcion-rey', { n: 3 }],
  'opcion-coihue-1': ['opcion-coihue', { n: 1 }],
  'opcion-coihue-2': ['opcion-coihue', { n: 2 }],
  'opcion-coihue-3': ['opcion-coihue', { n: 3 }],
  'opcion-semillas-1': ['opcion-semillas', { n: 1 }],
  'opcion-semillas-2': ['opcion-semillas', { n: 2 }],
  travieso: ['travieso', { estilo: elegido }],
  'viejo-noche': ['viejo-noche', { estilo: elegido }],
  lechuza: ['lechuza', { estilo: elegido }],
  rey: ['rey', { n: 1 }],
  'coihue-afuera': ['coihue-afuera', { n: 1, estilo: elegido }],
  'coihue-adentro': ['coihue-adentro', { n: 1 }],
  'nido-madriguera': ['nido-madriguera', {}],
  ataque: ['ataque', { estilo: elegido, cuantos: 30, medir: true }],
};
const LAMINAS = {
  'comparar-duendes': { titulo: 'Duendes: elegí el estilo (el travieso y el viejo de las noches grandes)', cols: 2, items: [['A', 'Tallado rústico', 'opcion-A-duendes'], ['B', 'Cuento ilustrado', 'opcion-B-duendes'], ['C', 'Bosque y musgo', 'opcion-C-duendes'], ['D', 'Oscuro de leyenda', 'opcion-D-duendes']] },
  'comparar-rey': { titulo: 'El Rey Duende', cols: 3, items: [['1', 'Viejo y sabio, corona de ramas', 'opcion-rey-1'], ['2', 'Gigante de corteza, cuernos de ámbar', 'opcion-rey-2'], ['3', 'Flaco y astuto, capa de hojas y bastón', 'opcion-rey-3']] },
  'comparar-coihue': { titulo: 'El Coihue Viejo (de noche, desde el fortín)', cols: 3, items: [['1', 'Cara tallada, camina con las raíces', 'opcion-coihue-1'], ['2', 'Encorvado, brazos de ramas y faroles de hongos', 'opcion-coihue-2'], ['3', 'Musgo, puertitas y ventanas encendidas', 'opcion-coihue-3']] },
  'comparar-semillas': { titulo: 'Lo que juntás', cols: 2, items: [['1', 'Semillas doradas', 'opcion-semillas-1'], ['2', 'Piedras de luz verde', 'opcion-semillas-2']] },
};

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const arg = process.argv.find((a) => /^[a-zA-Z0-9-]+(,[a-zA-Z0-9-]+)*$/.test(a) && a.split(',').every((t) => TOMAS[t] || t === 'laminas'));
  const pedidas = (arg || Object.keys(TOMAS).join(',')).split(',').filter((t) => TOMAS[t]);
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon/.test(m)) { errores.push(m.slice(0, 400)); console.log('[página]', m.slice(0, 600)); } });
  w.webContents.on('render-process-gone', (_e, d) => anotarError('la página se cayó', JSON.stringify(d)));
  const url = path.join(raiz, 'index.html');
  const search = '?debug=1&duendes=proto';
  await w.loadFile(url, { search });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search });
  for (let i = 0; i < 300; i++) {
    await esperar(1000);
    if (await js('!!window.__hojarasca').catch(() => false)) break;
    // si la carga falla (un error en la consola o el cartel de "No se pudo..."), se cierra enseguida
    const cartel = await js(`/No se pudo/.test(document.body?.innerText || '')`).catch(() => false);
    if (errores.length || cartel) { console.log('la página no arrancó:', errores[0] || 'cartel de error'); try { w.destroy(); } catch { /* ya */ } app.exit(1); return; }
  }
  if (!(await js('!!window.__hojarasca && !!window.__hojarasca.__duendes').catch(() => false))) { console.log('la página no arrancó (tiempo o sin __duendes)'); try { w.destroy(); } catch { /* ya */ } app.exit(1); return; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  const lugar = await js(`JSON.stringify(window.__hojarasca.__duendes.lugar())`);
  console.log('claro:', lugar);
  const informe = [`claro: ${lugar}`, `estilo de las escenas: ${elegido}`];
  for (const nombre of pedidas) {
    const [esc, op] = TOMAS[nombre];
    // primero la hora (la luz del sol o de la luna decide hacia dónde mira la cámara), después la escena
    const h0 = await js(`(() => { const H = window.__hojarasca; const c = H.__duendes.armar(${JSON.stringify(esc)}, ${JSON.stringify(op)}); H.progreso.horas = c.hora; return c.hora; })()`).catch(() => null);
    if (h0 == null) { console.log('falló', nombre); continue; }
    await esperar(1500);
    const r = await js(`(() => { const H = window.__hojarasca; const c = H.__duendes.armar(${JSON.stringify(esc)}, ${JSON.stringify(op)}); window.__tomaD = c; return JSON.stringify(c); })()`).catch((e) => { console.log('falló', nombre, String(e).slice(0, 300)); return null; });
    if (!r) continue;
    const poner = `(() => { const H = window.__hojarasca, js = H.jugador.estado, t = window.__tomaD;
      H.__duendes.repintar();
      // sin las luciérnagas del juego (de cerca son manchas grandes delante de la cámara)
      { const pm = H.perro && H.perro.malla; const pg = pm && (pm.isObject3D ? pm : pm.g); if (pg) pg.traverse((o) => o.layers.set(7)); }   // (y sin el perro, que sigue al jugador)
      H.escena.traverse((o) => { if (o.isPoints && o.geometry.attributes.aAzar && o.material.uniforms && o.material.uniforms.uOpacidad && o.geometry.attributes.position.count === 160) o.layers.set(7); });
      H.progreso.horas = t.hora; H.clima.estado.nublado = 0.05; H.ajustes.estacion = 'verano';
      const o = t.o, a = t.a;
      const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
      // los ojos bajos: agachado (1 m); si no, de pie (1,65 m). El juego pone la cámara desde el jugador
      const piso = H.T.altura(o.x, o.z), agachado = o.y - piso < 1.35, alto = agachado ? 1.0 : 1.65;
      js.agachado = agachado; js.alturaOjos = alto; H.ajustes.fov = t.fov || 60;
      js.pos.set(o.x, Math.max(piso, o.y - alto), o.z); js.vel.set(0, 0, 0); js.vy = 0; js.yaw = yaw; js.pitch = pitch;
      const c = H.camara; c.position.set(o.x, o.y, o.z); c.rotation.order = 'YXZ'; c.rotation.set(pitch, yaw, 0);
      const fov = t.fov || 60; if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
      for (const k of c.children) k.visible = false;
      // la cámara queda fija en cada cuadro (el jugador se resbala en la pendiente o lo empuja el juego):
      // antes de cada dibujo se vuelve a poner donde va la toma
      const pose = { p: [o.x, o.y, o.z], r: [pitch, yaw], fov, pie: [o.x, Math.max(piso, o.y - alto), o.z] };
      window.__poseD = pose;
      if (!H.renderer.__fijo) {
        const R = H.renderer, orig = R.render.bind(R); R.__fijo = true;
        R.render = (esc, cam) => {
          const q = window.__poseD;
          if (q && cam === H.camara) {
            cam.position.set(...q.p); cam.rotation.order = 'YXZ'; cam.rotation.set(q.r[0], q.r[1], 0);
            if (cam.fov !== q.fov) { cam.fov = q.fov; cam.updateProjectionMatrix(); }
            cam.updateMatrixWorld(); H.jugador.estado.pos.set(...q.pie); H.jugador.estado.vel.set(0, 0, 0); H.jugador.estado.vy = 0;
          }
          return orig(esc, cam);
        };
      }
      return 1 })()`;
    await js(poner); await esperar(3000);
    await js(poner); await esperar(2500);
    await js(poner); await esperar(400);
    await js(poner);
    let img = null;
    for (let k = 0; k < 4 && !img; k++) { try { img = await w.webContents.capturePage(); } catch (e) { console.log('captura falló, reintento', String(e).slice(0, 80)); await esperar(1500); } }
    if (!img) continue;
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    const info = await js(`(() => { const H = window.__hojarasca, R = H.renderer, D = H.__duendes; R.info.autoReset = false;
      R.info.reset(); R.render(H.escena, H.camara); const todo = { dibujos: R.info.render.calls, tri: R.info.render.triangles };
      D.raiz.visible = false; R.info.reset(); R.render(H.escena, H.camara); const sin = { dibujos: R.info.render.calls, tri: R.info.render.triangles }; D.raiz.visible = true;
      R.info.autoReset = true;
      const c = H.camara, t = window.__tomaD; return JSON.stringify({ todo, sinDuendes: sin, proto: D.medir(), armado_ms: t.ms, cam: [c.position.x - t.o.x, c.position.y - t.o.y, c.position.z - t.o.z, c.fov].map((v) => +v.toFixed(2)) }) })()`);
    let linea = `${nombre}: ${info}`;
    // (pruebas a mano: VISOR_JS se evalúa con H = window.__hojarasca y D = H.__duendes, y se anota)
    if (process.env.VISOR_JS) linea += '\n  VISOR_JS: ' + await js(`(() => { const H = window.__hojarasca, D = H.__duendes; return JSON.stringify(${process.env.VISOR_JS}); })()`).catch((e) => String(e));
    // el costo de verdad: cuánto tarda el cuadro, con y sin los duendes (el juego andando)
    if (op.medir) {
      const medir = (vis) => js(`new Promise((res) => { const H = window.__hojarasca; H.__duendes.raiz.visible = ${vis}; let n = 0, t0 = 0; const ts = [];
        const f = (t) => { if (n === 20) t0 = t; if (n > 20) ts.push(t); n++; if (n < 200) requestAnimationFrame(f); else { const d = ts.map((x, i) => i ? x - ts[i - 1] : 0).slice(1).sort((a, b) => a - b); res(JSON.stringify({ medio: +(d.reduce((s, x) => s + x, 0) / d.length).toFixed(2), p95: +d[Math.floor(d.length * 0.95)].toFixed(2) })); } };
        requestAnimationFrame(f); })`);
      await js(poner);
      const con = await medir(true); await js(poner);
      const sin = await medir(false); await js(poner);
      const con2 = await medir(true);
      await js(`(() => { window.__hojarasca.__duendes.raiz.visible = true; return 1 })()`);
      // el dibujo solo, sincronizado con la placa (render + readPixels de un píxel): con y sin los duendes
      const gpu = (vis) => js(`(() => { const H = window.__hojarasca, R = H.renderer, gl = R.getContext(), px = new Uint8Array(4); H.__duendes.raiz.visible = ${vis};
        const t = []; for (let i = 0; i < 40; i++) { const t0 = performance.now(); R.render(H.escena, H.camara); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); t.push(performance.now() - t0); }
        t.sort((a, b) => a - b); H.__duendes.raiz.visible = true; return JSON.stringify({ mediana: +t[20].toFixed(2), p90: +t[36].toFixed(2) }); })()`);
      const gCon = await gpu(true), gSin = await gpu(false), gCon2 = await gpu(true);
      linea += `\n  cuadro (ms, rAF, con vsync) con 30 duendes: ${con} / ${con2}; sin: ${sin}\n  dibujo sincronizado (ms, render + readPixels) con: ${gCon} / ${gCon2}; sin: ${gSin}`;
    }
    informe.push(linea);
    console.log('foto', nombre, linea.slice(0, 400));
  }
  await js(`(() => { for (const k of window.__hojarasca.camara.children) k.visible = true; return 1; })()`);
  // las láminas para votar: las opciones lado a lado, con su letra o número grande
  for (const [nombre, L] of Object.entries(LAMINAS)) {
    const fotos = L.items.map(([, , f]) => path.join(salida, f + '.png'));
    if (!fotos.every((f) => fs.existsSync(f))) { console.log('lámina sin todas las fotos:', nombre); continue; }
    const datos = fotos.map((f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'));
    const png = await js(`(async () => {
      const L = ${JSON.stringify(L)}, datos = ${JSON.stringify(datos)};
      const imgs = await Promise.all(datos.map((d) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = d; })));
      const cols = L.cols, filas = Math.ceil(imgs.length / cols);
      const cw = cols === 3 ? 1066 : 1200, ch = Math.round(cw * imgs[0].height / imgs[0].width), pie = 74, cab = 96, m = 16;
      const c = document.createElement('canvas'); c.width = cols * cw + (cols + 1) * m; c.height = cab + filas * (ch + pie + m) + m;
      const x = c.getContext('2d');
      x.fillStyle = '#efe6d2'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#3a2a1c'; x.font = '600 46px Spectral, Georgia, serif'; x.textBaseline = 'middle'; x.fillText(L.titulo, m + 8, cab / 2 + 4);
      L.items.forEach(([letra, texto], i) => {
        const cx = m + (i % cols) * (cw + m), cy = cab + Math.floor(i / cols) * (ch + pie + m);
        x.drawImage(imgs[i], cx, cy, cw, ch);
        x.strokeStyle = '#3a2a1c'; x.lineWidth = 3; x.strokeRect(cx, cy, cw, ch);
        // la letra grande en un disco, arriba a la izquierda
        x.fillStyle = 'rgba(239,230,210,0.92)'; x.beginPath(); x.arc(cx + 62, cy + 62, 50, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#7a2e2e'; x.lineWidth = 5; x.stroke();
        x.fillStyle = '#7a2e2e'; x.font = '700 66px Spectral, Georgia, serif'; x.textAlign = 'center'; x.fillText(letra, cx + 62, cy + 66); x.textAlign = 'left';
        x.fillStyle = '#3a2a1c'; x.font = '600 38px Spectral, Georgia, serif'; x.fillText(letra + ' · ' + texto, cx + 6, cy + ch + pie / 2 + 2);
      });
      return c.toDataURL('image/png').split(',')[1]; })()`);
    fs.writeFileSync(path.join(salida, nombre + '.png'), Buffer.from(png, 'base64'));
    console.log('lámina', nombre);
  }
  fs.writeFileSync(path.join(salida, 'informe.txt'), informe.join('\n') + (errores.length ? `\nerrores:\n${errores.join('\n')}` : ''));
  if (errores.length) console.log('errores de la página:\n' + errores.join('\n'));
  console.log('listo:', salida);
  app.exit(0);
});
