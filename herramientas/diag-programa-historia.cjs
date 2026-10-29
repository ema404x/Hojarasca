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
  // VARIANTES=1: qué geometría hace falta para que el programa de profundidad de una instanciada sin color sea el de los álamos (máscara 8388609)
  if (process.env.VARIANTES) {
    const r = await js(`(async () => { const R = ${H}.renderer, T0 = ${H}.THREE, esc = ${H}.escena, cam = ${H}.camara; const sal = []; const dormir = (ms) => new Promise((x) => setTimeout(x, ms));
      let im0 = null, ms0 = null; esc.traverse((o) => { if (!im0 && o.isInstancedMesh && o.geometry && o.geometry.attributes.position) im0 = o; if (!ms0 && o.isMesh && !o.isInstancedMesh && o.geometry && o.geometry.attributes.position) ms0 = o; });
      const THREE = { Vector3: T0.Vector3, MeshLambertMaterial: T0.MeshLambertMaterial, FrontSide: 0, InstancedMesh: im0.constructor, BufferGeometry: ms0.geometry.constructor, BufferAttribute: ms0.geometry.attributes.position.constructor, Matrix4: im0.matrixWorld.constructor };
      const clave = () => R.info.programs.filter((p) => /^depth/.test(String(p.cacheKey))).map((p) => String(p.cacheKey).split(',').slice(-4, -2).join('/'));
      const antes = clave().length; const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
      const variantes = { pos: ['position'], posNormal: ['position', 'normal'], posNormalColor: ['position', 'normal', 'color'], todo: ['position', 'normal', 'color', 'aTipo', 'aSuperficie', 'aLocal'] };
      for (const [nombre, attrs] of Object.entries(variantes)) { const g = new THREE.BufferGeometry(); for (const a of attrs) g.setAttribute(a, new THREE.BufferAttribute(new Float32Array(a === 'aTipo' || a === 'aSuperficie' ? [0, 0, 0] : [0, 0, 0, 0.02, 0, 0, 0, 0.02, 0]), a === 'aTipo' || a === 'aSuperficie' ? 1 : 3));
        const m = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ side: THREE.FrontSide }), 1); m.setMatrixAt(0, new THREE.Matrix4()); m.castShadow = true; m.frustumCulled = false; m.position.set(cam.position.x + dir.x * 3, cam.position.y - 1.2, cam.position.z + dir.z * 3); esc.add(m);
        for (let k = 0; k < 6; k++) { ${H}.__bucle(); await dormir(20); } sal.push([nombre, clave().join(' | ')]); esc.remove(m); }
      return JSON.stringify(sal); })()`).catch((e) => 'error ' + e.message);
    console.log('VARIANTES: ' + r);
  }
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
  console.log('PROGRAMAS: ' + JSON.stringify(await js(`(() => { const R = ${H}.renderer; const c = {}; for (const p of R.info.programs) c[p.name] = (c[p.name] || 0) + 1; return c })()`)));
  console.log('ULTIMOS-3: ' + JSON.stringify(await js(`(() => { const R = ${H}.renderer; return R.info.programs.slice(-3).map((p) => ({ nombre: p.name, clave: String(p.cacheKey).slice(0, 900) })) })()`), null, 1));
  console.log('PROFUNDIDAD-OTRAS: ' + JSON.stringify(await js(`(() => { const R = ${H}.renderer; return R.info.programs.filter((p) => /depth/i.test(String(p.name)) || /depth/i.test(String(p.cacheKey).slice(0, 200))).map((p) => String(p.cacheKey).slice(0, 900)) })()`), null, 1));
  console.log('ALAMOS: ' + JSON.stringify(await js(`(() => { let r = null; ${H}.escena.traverse((o) => { if (!r && o.name === 'estructura:aldea-alamos') r = o.children.map((m) => ({ instanciado: !!m.isInstancedMesh, conColorInstancia: !!m.instanceColor, capas: m.layers.mask, sombra: m.castShadow, cantidad: m.count, customDepth: !!m.customDepthMaterial, mat: m.material && m.material.type, atrib: Object.keys(m.geometry.attributes), indexado: !!m.geometry.index })); }); return r })()`), null, 1));
  app.exit(0);
});
