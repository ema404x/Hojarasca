// 4.12.3 (sombras lejanas): de dónde salen los dibujos del mapa de sombras (la pasada «[sombra]») en una vista, y cuántas
// mallas del mundo pueden proyectar sombra. Es el `diag:dibujo` pero sólo de la pasada de sombras y con la calidad por variable.
// Uso (siempre por el lanzador, monitor externo, perfil propio):
//   $env:HOJ_PAGINA='<index.html>'; $env:HOJ_CALIDAD='media|alta'; $env:HOJ_VISTA='refugio'; $env:HOJ_HORA='12'
//   powershell -File herramientas\lanzar-electron.ps1 -Script herramientas\diag-sombras-4-12-3.cjs -Perfil <carpeta propia>
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => process.env['HOJ_' + n.toUpperCase()] || d;
const pagina = path.resolve(arg('pagina', path.join(raiz, 'index.html')));
const calidad = arg('calidad', 'media');
const vista = arg('vista', 'refugio');
const hora = Number(arg('hora', '12'));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  await w.loadFile(pagina, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false, estacion:'verano'})); 1`);
  await w.loadFile(pagina, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.T && window.__hojarasca.renderer)').catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  const r = await js(`(()=>{
    const H = window.__hojarasca, js = H.jugador.estado, L = H.T.lugares;
    const p = L['${vista}'] || L.refugio;
    js.pos.set(p.x + 26, H.T.altura(p.x + 26, p.z + 26) + 1.65, p.z + 26);
    js.yaw = Math.PI * 0.25; js.pitch = -0.05; H.progreso.horas = ${hora};
    for (let i = 0; i < 80; i++) { H.progreso.horas = ${hora}; H.__bucle(); }
    const R = H.renderer, original = R.renderBufferDirect.bind(R);
    const raiz = (o) => { let x = o; while (x.parent && x.parent !== H.escena) x = x.parent; return x; };
    const firma = (o) => o.name || (o.type + ':' + (o.geometry ? o.geometry.type.replace('Geometry', '') : '') + ':' + (o.material?.type || '') + (o.isInstancedMesh ? ':x' + o.count : '') + ':capa' + o.layers.mask);
    const cuenta = new Map();
    let triS = 0;
    R.renderBufferDirect = function (cam, escena, geo, mat, obj, grupo) {
      if (cam.isOrthographicCamera) {
        const rz = raiz(obj);
        const k = rz === obj ? firma(obj) : 'grupo(' + rz.children.length + ' hijos ' + (rz.name || rz.type) + ')';
        cuenta.set(k, (cuenta.get(k) || 0) + 1);
        triS += (geo.index ? geo.index.count : geo.attributes.position.count) / 3 * (obj.isInstancedMesh ? obj.count : 1);
      }
      return original(cam, escena, geo, mat, obj, grupo);
    };
    H.renderer.shadowMap.needsUpdate = true;
    H.progreso.horas = ${hora}; H.__bucle();
    R.renderBufferDirect = original;
    const total = [...cuenta.values()].reduce((a, b) => a + b, 0);
    let pueden = 0, visibles = 0, capa1 = 0;
    H.escena.traverse((o) => { if (o.isMesh && o.castShadow) { pueden++; if (o.layers.mask & 2) capa1++; } });
    const sol = H.__cielo ? H.__cielo().sol : null;
    return { lugares: Object.fromEntries(Object.entries(L).filter(([k, v]) => v && Number.isFinite(v.x)).map(([k, v]) => [k, [Math.round(v.x), Math.round(v.z)]])),
      total, triSombra: Math.round(triS), mallasConCastShadow: pueden, enCapa1: capa1, camaraCapas: H.camara.layers.mask,
      grupos: [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, n]) => n + ' · ' + k.slice(0, 150)) };
  })()`);
  console.log(JSON.stringify(r, null, 1));
  app.exit(0);
});
