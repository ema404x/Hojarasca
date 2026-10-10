// 3.8.4: capturas del alero del arriero en el juego real (decisión 32): de frente y por dentro, de día y al atardecer
// (la pirca, el fogón renegrido, la pared tallada con el nombre del abuelo de Martín y la herradura). Quedan en
// pruebas/salidas/alero-384/ (no van al repositorio). Perfil propio (no toca el de las pruebas ni el del juego).
// Uso (después de `node armar.mjs`): npx electron --no-sandbox pruebas/fotos-alero-384.cjs [toma,toma] [calidad=alta]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'alero-384');
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.error('[fotos-alero] ', e && e.stack ? e.stack : e); salir(1); });
process.on('unhandledRejection', (e) => { console.error('[fotos-alero] ', e && e.stack ? e.stack : e); salir(1); });
const perfil = path.join(salida, '_perfil');
try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* que quede */ }
app.setPath('userData', perfil);
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('[fotos-alero] tardó más de 10 minutos'); salir(2); }, 10 * 60 * 1000).unref?.();

// en el marco del alero (x a lo ancho, z hacia afuera; la pared tallada en z = -3,55; y sobre el piso del alero)
const TOMAS = {
  'dia-frente': { ojo: [4.2, 1.7, 8.5], a: [-0.3, 1.3, -2.2], hora: 11 },
  'dia-pared': { ojo: [0.3, 1.62, -0.2], a: [-0.7, 1.45, -3.55], hora: 11.5 },
  'dia-fogon-herradura': { ojo: [-0.9, 1.65, -0.3], a: [2.0, 0.9, -3.1], hora: 12 },
  'dia-pirca': { ojo: [3.1, 1.65, 1.0], a: [-1.2, 0.6, -1.4], hora: 10.5, cornisa: true },
  'atardecer-pirca': { ojo: [3.1, 1.65, 1.0], a: [-1.2, 0.6, -1.4], hora: 19.6, cornisa: true },
  'atardecer-frente': { ojo: [4.2, 1.7, 8.5], a: [-0.3, 1.3, -2.2], hora: 19.6 },
  'atardecer-pared': { ojo: [0.3, 1.62, -0.2], a: [-0.7, 1.45, -3.55], hora: 19.6 },
  'atardecer-lejos': { ojo: [9, 2.2, 22], a: [0, 1.8, -1], hora: 19.9 },
};

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const arg = process.argv.find((a) => /^[a-z-]+(,[a-z-]+)*$/.test(a) && a.split(',').every((t) => TOMAS[t]));
  const pedidas = (arg || Object.keys(TOMAS).join(',')).split(',');
  const calidad = (process.argv.find((a) => /^calidad=/.test(a)) || 'calidad=alta').split('=')[1];
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.T && window.__hojarasca.T.lugares)').catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  const hay = await js(`(() => { const c = window.__hojarasca.T.lugares.cueva; return c ? { x: c.x, z: c.z, y: c.y, rot: c.rot, nombre: c.nombre } : null })()`);
  if (!hay) { console.log('este valle no tiene alero'); salir(1); return; }
  console.log('alero:', JSON.stringify(hay));
  const estilo = `(() => { let s = document.getElementById('sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'sin-hud'; document.head.appendChild(s); } s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; return 1 })()`;
  await js(estilo);
  const informe = [];
  for (const nombre of pedidas) {
    const t = TOMAS[nombre];
    const poner = `(() => { const H = window.__hojarasca, T = H.T, js = H.jugador.estado, t = ${JSON.stringify(t)};
      H.clima.estado.nublado = 0.12; H.progreso.horas = t.hora;
      const e = T.lugares.cueva, c = Math.cos(e.rot), s = Math.sin(e.rot), piso = e.y + 0.34;
      const w = (lx, lz) => ({ x: e.x + lx * c + lz * s, z: e.z - lx * s + lz * c });
      const wo = w(t.ojo[0], t.ojo[2]), wa = w(t.a[0], t.a[2]);
      const dentro = Math.abs(t.ojo[0]) < 3.6 && t.ojo[2] < 0.4;
      const o = { x: wo.x, z: wo.z, y: (t.cornisa ? e.y + 0.1 : dentro ? piso : T.altura(wo.x, wo.z)) + t.ojo[1] }, a = { x: wa.x, z: wa.z, y: piso + t.a[1] };
      const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
      js.pos.set(o.x, o.y - 1.65, o.z); js.vel.set(0, 0, 0); js.vy = 0;
      js.yaw = yaw; js.pitch = pitch;
      const cam = H.camara; cam.position.set(o.x, o.y, o.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0);
      if (cam.fov !== 70) { cam.fov = 70; cam.updateProjectionMatrix(); }
      for (const k of cam.children) k.visible = false;
      return 1 })()`;
    await js(`(() => { const H = window.__hojarasca, e = H.T.lugares.cueva; H.jugador.ubicar(e.x, e.z, 0); return 1 })()`);
    for (let k = 0; k < 50; k++) { await js(`(() => { window.__hojarasca.__bucle(); return 1 })()`); await js(poner); await esperar(40); }
    await esperar(600);
    await js(`(() => { window.__hojarasca.__bucle(); return 1 })()`);
    await js(poner);
    // (si la ventana no se puede capturar —tapada, la pantalla bloqueada—, el lienzo mismo, recién dibujado)
    let png = null;
    try { png = (await w.webContents.capturePage()).toPNG(); } catch {
      const url64 = await js(`(() => { const H = window.__hojarasca; H.__bucle(); return H.renderer.domElement.toDataURL('image/png') })()`);
      png = Buffer.from(String(url64).split(',')[1] || '', 'base64');
    }
    fs.writeFileSync(path.join(salida, `${nombre}.png`), png);
    const m = await js(`(() => { const H = window.__hojarasca, r = H.renderer?.info?.render; return { dibujos: r?.calls ?? null, tris: r?.triangles ?? null, hora: H.progreso.horas } })()`);
    informe.push(`${nombre}: ${JSON.stringify(m)}`);
  }
  fs.writeFileSync(path.join(salida, 'informe.txt'), [`alero: ${JSON.stringify(hay)}`, ...informe, ...(errores.length ? ['errores:', ...errores] : [])].join('\n') + '\n');
  console.log(informe.join('\n'));
  if (errores.length) console.log('errores:\n' + errores.join('\n'));
  salir(0);
});
