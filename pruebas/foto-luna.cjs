// Foto de la luna en sus fases, para mirarla: la creciente tiene que ser una C (luz a
// la izquierda) y la menguante una D, como se ve desde el sur. También una fugaz.
//
// Uso: npx electron pruebas/foto-luna.cjs   → pruebas/salidas/fotos-luna/*.png
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const salida = path.join(raiz, 'pruebas', 'salidas', 'fotos-luna');
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: false, width: 960, height: 600, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'baja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  // dia y hora para cada fase (ver faseLunar: el día 1 a las 0 es cuarto creciente)
  const fases = [['creciente', 1, 0.3], ['llena', 3, 0.3], ['menguante', 5, 0.3]];
  for (const [nombre, dia, horas] of fases) {
    await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, T = H.T, r = T.lugares.refugio;
      js.pos.set(r.x + 90, T.altura(r.x + 90, r.z + 70) + 1.65, r.z + 70);
      H.clima.estado.nublado = 0; H.progreso.dia = ${dia}; H.progreso.horas = ${horas}; js.zoom = true; return 1 })()`);
    await esperar(4000);
    await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, d = H.__cielo().uniforms.uLuna.value;
      js.yaw = Math.atan2(-d.x, -d.z); js.pitch = Math.asin(d.y); H.clima.estado.nublado = 0; return 1 })()`);
    await esperar(5000);
    const img = await w.webContents.capturePage({ x: 380, y: 200, width: 200, height: 200 });
    fs.writeFileSync(path.join(salida, `luna-${nombre}.png`), img.toPNG());
    console.log('luna', nombre, await js(`window.__hojarasca.__cielo().uniforms.uFaseLuna.value.toFixed(3)`));
  }
  // una fugaz de la lluvia, mirando al norte
  await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado; H.progreso.dia = 9; H.progreso.horas = 23; js.zoom = false;
    const a = -3.6 * Math.PI / 180, h = 24 * Math.PI / 180;
    js.yaw = Math.atan2(Math.sin(a) * Math.cos(h), Math.cos(a) * Math.cos(h)); js.pitch = h; return 1 })()`);
  await esperar(4000);
  await js(`(()=>{ const H = window.__hojarasca; const f = H.__fugaces(); f.lista.forEach((x) => { x.f = null; });
    const x = f.lanzar({ acimut: -3.6, altura: 30, rumbo: 0.6, largo: 18, dur: 30, brillo: 1 }); x.t = 14.9; return 1 })()`);
  await esperar(5000);
  console.log('fugaz', JSON.stringify(await js(`(()=>{ const H = window.__hojarasca, f = H.__fugaces().lista.find((x) => x.f);
    if (!f) return 'sin fugaz';
    const p = f.linea.geometry.attributes.position.array, cam = H.camara;
    return { t: f.t, op: f.linea.material.opacity, vis: f.linea.visible, p: Array.from(p).map((v) => Math.round(v)), far: cam.far, grupo: f.linea.parent.position.toArray().map(Math.round) } })()`)));
  const img = await w.webContents.capturePage();
  fs.writeFileSync(path.join(salida, 'fugaz.png'), img.toPNG());
  console.log('listo:', salida);
  app.exit(0);
});
