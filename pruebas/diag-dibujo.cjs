// Diagnóstico de llamadas de dibujo (2.2): de dónde sale cada una en un cuadro, desde el
// mismo punto de vista que perfil-cpu.cjs. Agrupa por el hijo de la escena del que cuelga
// el objeto dibujado (su nombre, o la forma si no tiene).
// Uso: npx electron pruebas/diag-dibujo.cjs [--modo=relax|desafio]
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const modo = process.argv.find((a) => a.startsWith('--modo='))?.split('=')[1] || 'relax';
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(2500);
  const r = await js(`(()=>{
    const H = window.__hojarasca, js = H.jugador.estado, p = H.T.lugares.refugio;
    js.pos.set(p.x + 26, H.T.altura(p.x + 26, p.z + 26) + 1.65, p.z + 26);
    js.yaw = Math.PI * 0.25; js.pitch = -0.05; H.progreso.horas = ${modo === 'desafio' ? 21 : 10};
    for (let i = 0; i < 60; i++) H.__bucle();
    const R = H.renderer, original = R.renderBufferDirect.bind(R);
    const raiz = (o) => { let x = o; while (x.parent && x.parent !== H.escena) x = x.parent; return x; };
    const firma = (o) => o.name || (o.type + ':' + (o.geometry ? o.geometry.type.replace('Geometry', '') : '') + ':' + (o.material?.type || ''));
    const cuenta = new Map();
    R.renderBufferDirect = function (cam, escena, geo, mat, obj, grupo) {
      const rz = raiz(obj);
      const k = (cam.isOrthographicCamera ? '[sombra] ' : '') + (rz === obj ? firma(obj) : 'grupo@' + Math.round(rz.position.x) + ',' + Math.round(rz.position.z) + ' (' + rz.children.length + ' hijos' + (rz.name ? ' ' + rz.name : '') + ')');
      cuenta.set(k, (cuenta.get(k) || 0) + 1);
      return original(cam, escena, geo, mat, obj, grupo);
    };
    H.renderer.shadowMap.needsUpdate = true;
    H.__bucle();
    R.renderBufferDirect = original;
    const total = [...cuenta.values()].reduce((a, b) => a + b, 0);
    // qué hay en cada posición: lugares del valle, gente, animales
    const cerca = (x, z) => {
      const cand = [];
      for (const [k, L] of Object.entries(H.T.lugares || {})) if (L && Number.isFinite(L.x)) cand.push(['lugar ' + k, L.x, L.z]);
      for (const g of H.gente?.gente || []) cand.push(['persona ' + g.clave, g.pos.x, g.pos.z]);
      if (H.perro) cand.push(['perro', H.perro.est.pos.x, H.perro.est.pos.z]);
      let mejor = null, d0 = 12;
      for (const [n, cx, cz] of cand) { const d = Math.hypot(cx - x, cz - z); if (d < d0) { d0 = d; mejor = n + ' (' + d.toFixed(0) + ' m)'; } }
      return mejor || '?';
    };
    for (const k of [...cuenta.keys()]) { const m = /grupo@(-?d+),(-?d+)/.exec(k); if (m) { const n = cuenta.get(k); cuenta.delete(k); cuenta.set(k + ' = ' + cerca(+m[1], +m[2]), n); } }
    return { total, grupos: [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, n]) => n + ' · ' + k.slice(0, 160)) };
  })()`);
  console.log(JSON.stringify(r, null, 1));
  app.exit(0);
});
