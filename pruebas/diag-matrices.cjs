// Diagnóstico del repaso de matrices (2.2): qué recorre escena.updateMatrixWorld() cada
// cuadro, agrupado por la forma de cada hijo de la escena (tipo y geometrías de adentro).
// Uso: npx electron pruebas/diag-matrices.cjs [--modo=relax|desafio]
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
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(4000);
  const r = await js(`(()=>{
    const H = window.__hojarasca;
    const tam = (o) => { let n = 1; for (const c of o.children) if (c.matrixWorldAutoUpdate) n += tam(c); return n; };
    const firma = (o) => {
      const tipos = new Map();
      o.traverse((x) => { const k = x.geometry ? x.geometry.type.replace('Geometry', '') : x.type; tipos.set(k, (tipos.get(k) || 0) + 1); });
      return o.type + '[' + [...tipos.entries()].sort().map(([k, v]) => k + v).join(' ') + ']';
    };
    const grupos = new Map();
    let total = 0, ocultos = 0;
    for (const c of H.escena.children) {
      if (!c.matrixWorldAutoUpdate) continue;
      const n = tam(c); total += n; if (!c.visible) ocultos += n;
      const k = firma(c) + (c.name ? ' ' + c.name : '');
      const g = grupos.get(k) || { cuantos: 0, objetos: 0, ocultos: 0 };
      g.cuantos++; g.objetos += n; if (!c.visible) g.ocultos += n;
      grupos.set(k, g);
    }
    const t0 = performance.now(); for (let i = 0; i < 200; i++) H.escena.updateMatrixWorld();
    return { ms: +((performance.now() - t0) / 200).toFixed(3), total, ocultos, hijos: H.escena.children.length,
      grupos: [...grupos.entries()].sort((a, b) => b[1].objetos - a[1].objetos).slice(0, 28)
        .map(([k, g]) => g.objetos + ' obj (' + g.ocultos + ' ocultos) · ' + g.cuantos + ' × ' + k.slice(0, 150)) };
  })()`);
  console.log(JSON.stringify(r, null, 1));
  app.exit(0);
});
