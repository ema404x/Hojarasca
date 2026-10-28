// Diagnóstico de trabajo (no va al gate): qué objeto compila un programa de shader nuevo después de asentarse.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const pagina = path.resolve(process.env.HUMO_PAGINA || path.join(raiz, 'index.html'));
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => app.exit(2), 10 * 60 * 1000).unref?.();
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: process.env.HUMO_OCULTO === '0', width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const q = process.env.CALIDAD || 'media';
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${q}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false})); 1`;
  await w.loadFile(pagina, { search: '?debug=1' });
  await js(ajustes);
  await w.loadFile(pagina, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T && ${H}.renderer)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  const correr = (n) => js(`(async () => { for (let i = 0; i < ${n}; i++) { ${H}.__bucle(); if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0)); } return 1 })()`);
  await correr(120);
  // engancha el dibujo de cada malla: si crece la lista de programas, anota quién fue
  await js(`(() => { const R = ${H}.renderer; window.__culpables = []; const orig = R.renderBufferDirect.bind(R);
    R.renderBufferDirect = function (camera, scene, geometry, material, object, group) {
      const n = R.info.programs.length; const r = orig(camera, scene, geometry, material, object, group);
      if (R.info.programs.length > n) { const sombra = material && material.isMeshDepthMaterial; let p = object, ruta = []; while (p && ruta.length < 6) { ruta.push((p.name || p.type) + (p.isSkinnedMesh ? '[piel]' : '')); p = p.parent; }
        window.__culpables.push({ n: R.info.programs.length, material: material.type + ':' + (material.name || ''), esDepth: !!sombra, objeto: object.type, ruta: ruta.join(' < '), capas: object.layers.mask, atrib: Object.keys(geometry.attributes).join(','), instanciado: !!object.isInstancedMesh, piel: !!object.isSkinnedMesh, camaraCapas: camera.layers.mask,
          fase: window.__fase || '' }); }
      return r; };
    return 1 })()`);
  const fases = [['dia12', 12, 0, 0], ['noche22', 22, 0, 0], ['giro7', 7, 2.4, 0.5], ['dia12b', 12, 0, -0.05]];
  for (const [nombre, h, dy, pitch] of fases) {
    await js(`(() => { window.__fase = '${nombre}'; ${H}.progreso.horas = ${h}; const J = ${H}.jugador.estado; J.yaw += ${dy}; ${dy || pitch ? `J.pitch = ${pitch};` : ''} return 1 })()`);
    await correr(40);
  }
  console.log('CULPABLES: ' + JSON.stringify(await js('window.__culpables'), null, 1));
  app.exit(0);
});
