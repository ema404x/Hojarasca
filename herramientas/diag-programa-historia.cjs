// Diagnóstico de trabajo (no va al gate): qué objeto compila un programa de shader nuevo al ir de día al molino viejo o al faro (4.17.0, C).
// Igual que diag-programa-tardio.cjs, pero en una partida de Historia y yendo a los lugares. Uso:
//   HUMO_PERFIL=<carpeta> HUMO_OCULTO=0 electron -r herramientas\al-monitor.cjs herramientas\diag-programa-historia.cjs   (o con lanzar-electron.ps1)
// Variables: CALIDAD (media), HUMO_PAGINA (otro index.html), TIPO (historia | libre).
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
  const tipo = process.env.TIPO || 'historia';
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${q}', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false, estacion:'otono'})); 1`;
  await w.loadFile(pagina, { search: '?debug=1' });
  await js(ajustes);
  await w.loadFile(pagina, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T && ${H}.renderer)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  const correr = (n) => js(`(async () => { for (let i = 0; i < ${n}; i++) { ${H}.__bucle(); if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0)); } return 1 })()`);
  await correr(120);
  // cierra la tarjeta de entrada de la historia si salió
  await js(`(() => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="empezar"]'); if (b) b.click(); return 1 })()`);
  await correr(60);
  await js(`(() => { const R = ${H}.renderer; window.__culpables = []; const orig = R.renderBufferDirect.bind(R);
    R.renderBufferDirect = function (camera, scene, geometry, material, object, group) {
      const n = R.info.programs.length; const r = orig(camera, scene, geometry, material, object, group);
      if (R.info.programs.length > n) { const sombra = material && material.isMeshDepthMaterial; let p = object, ruta = []; while (p && ruta.length < 6) { ruta.push((p.name || p.type) + (p.isSkinnedMesh ? '[piel]' : '')); p = p.parent; }
        window.__culpables.push({ n: R.info.programs.length, material: material.type + ':' + (material.name || ''), esDepth: !!sombra, objeto: object.type, ruta: ruta.join(' < '), capas: object.layers.mask, atrib: Object.keys(geometry.attributes).join(','), instanciado: !!object.isInstancedMesh, piel: !!object.isSkinnedMesh, camaraCapas: camera.layers.mask,
          fase: window.__fase || '', hijos: object.children ? object.children.length : 0, nombre: object.name || '', mat: { color: !!material.color, map: !!material.map, vertexColors: !!material.vertexColors, side: material.side, transparent: material.transparent, alphaTest: material.alphaTest, tipoMat: material.type } }); }
      return r; };
    return 1 })()`);
  console.log('programas al empezar: ' + await js(`${H}.renderer.info.programs.length`));
  const ir = async (nombre, punto, dx, dz, hora) => {
    await js(`(() => { window.__fase = '${nombre}'; ${H}.progreso.horas = ${hora}; const p = ${H}.__puntosHistoria ? ${H}.__puntosHistoria()['${punto}'] : null; const l = p || ${H}.T.lugares['${punto}']; if (!l) return 0; ${H}.jugador.ubicar(l.x + ${dx}, l.z + ${dz}, 0); return 1 })()`);
    await correr(50);
    console.log(`[${nombre}] programas: ` + await js(`${H}.renderer.info.programs.length`));
  };
  await ir('molino-viejo-dia', 'molino-viejo', 5, 5, 12);
  await ir('molino-viejo-giro', 'molino-viejo', 3, 8, 12);
  await ir('faro-dia', 'faro', 5, 3, 12);
  await ir('plaza-dia', 'plaza', 5, 3, 12);
  await ir('estacion-dia', 'estacion', 4, 2, 12);
  await ir('molino-viejo-dia-2', 'molino-viejo', 5, 5, 12);
  console.log('CULPABLES: ' + JSON.stringify(await js('window.__culpables'), null, 1));
  // las claves de los programas de profundidad (sombras): qué parámetro distingue al último de los demás
  console.log('PROFUNDIDAD: ' + JSON.stringify(await js(`(() => { const R = ${H}.renderer; return R.info.programs.filter((p) => /depth/i.test(p.name || '')).map((p) => String(p.cacheKey).slice(0, 1500)) })()`), null, 1));
  console.log('PRIMER-ALAMOS: ' + JSON.stringify(await js(`(() => { let r = null; ${H}.escena && ${H}.escena.traverse((o) => { if (!r && o.name === 'estructura:aldea-alamos') r = { instanciado: !!o.isInstancedMesh, conColor: !!o.instanceColor, capas: o.layers.mask, sombra: o.castShadow, cantidad: o.count, tieneCustomDepth: !!o.customDepthMaterial, mat: o.material && o.material.type, atrib: Object.keys(o.geometry.attributes), indexado: !!o.geometry.index }; }); return r })()`), null, 1));
  app.exit(0);
});
