// 4.12.0 (bordes suaves): capturas de los MISMOS encuadres (copas de árboles contra el cielo, techos, vallas, cables) para comparar el antes y el después.
// Se corre con una página armada (`pagina=`), la calidad y una carpeta de salida; la ventana va VISIBLE (el lienzo no se captura bien oculto).
//   electron --no-sandbox -r herramientas/al-monitor.cjs herramientas/fotos-bordes-4-12-0.cjs pagina=<index.html> calidad=media|alta salida=<carpeta> [descubrir=1]
// Los encuadres se buscan en el juego (nombres de mallas y lugares fijos): son los mismos antes y después porque el mundo no cambia.
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const pagina = path.resolve(arg('pagina', 'index.html'));
const calidad = arg('calidad', 'alta');
const salida = path.resolve(arg('salida', path.join(process.env.TEMP || '.', 'fotos-bordes')));
const descubrir = arg('descubrir', '') === '1';
const perfil = arg('perfil', path.join(salida, '_perfil'));
dialog.showErrorBox = () => {};
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
setTimeout(() => { console.log('ERROR: tardó más de 10 minutos'); salir(2); }, 10 * 60 * 1000).unref?.();

// busca en la escena las mallas con nombre de valla / cable / poste, y las agrupa por nombre con su posición de mundo
const DESCUBRIR = `(() => {
  const H = window.__hojarasca, out = {};
  const re = /cerc|valla|cable|alambre|poste|tendido|telegraf|catenaria|baranda|reja|palo/i;
  H.escena.traverse((o) => { if (!re.test(o.name || '')) return; const p = o.getWorldPosition ? o.getWorldPosition(new H.camara.position.constructor()) : o.position; (out[o.name] ||= []).push([+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1)]); });
  for (const k of Object.keys(out)) out[k] = { n: out[k].length, ejemplos: out[k].slice(0, 3) };
  return JSON.stringify({ nombres: out, refugio: H.T.lugares.refugio, estruct: Object.keys(H.est || {}).slice(0, 60) });
})()`;

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.focus();
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false, estacion:'verano'})); 1`;
  await w.loadFile(pagina, { search: '?debug=1' });
  await js(ajustes);
  await w.loadFile(pagina, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3500);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  // sin interfaz (queda el lienzo) y sin partículas sueltas que cambian de un cuadro a otro
  await js(`(() => { let s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s);
    for (const o of ${H}.escena.children) if (o.isPoints) Object.defineProperty(o, 'visible', { get: () => false, set: () => {} }); return 1 })()`);
  if (descubrir) { console.log(await js(DESCUBRIR)); salir(0); return; }
  const tomas = JSON.parse(fs.readFileSync(path.resolve(arg('tomas', path.join(__dirname, 'fotos-bordes-4-12-0.json'))), 'utf8'));
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  for (const t of tomas) {
    // la toma se da con `ojo` y `mira` en coordenadas de mundo (x, altura sobre el suelo, z) o relativas al refugio (`rel: true`)
    await js(`(() => { const H = ${H}, T = H.T, R = ${t.rel ? 'T.lugares.refugio' : '{ x: 0, z: 0 }'};
      const o = { x: R.x + ${t.ojo[0]}, z: R.z + ${t.ojo[2]} }; o.y = T.altura(o.x, o.z) + ${t.ojo[1]};
      const b = { x: R.x + ${t.mira[0]}, z: R.z + ${t.mira[2]} }; b.y = T.altura(b.x, b.z) + ${t.mira[1]};
      const dx = b.x - o.x, dz = b.z - o.z, d = Math.hypot(dx, dz);
      H.jugador.ubicar(o.x, o.z, 0);
      H.__camaraFija = { x: o.x, y: o.y, z: o.z, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(b.y - o.y, d) };
      H.camara.fov = ${t.fov || 60}; H.camara.updateProjectionMatrix(); H.progreso.horas = ${t.horas || 12}; H.camara.children.forEach((q) => { q.visible = false; }); return 1 })()`);
    for (let i = 0; i < 150; i++) { await js(`${H}.progreso.horas = ${t.horas || 12}; 1`); await cuadro(1); await esperar(20); }
    await esperar(300);
    // cuántos pares de píxeles vecinos saltan de golpe (más de 60 de 255 de luz): los escalones de los bordes; con el suavizado bajan
    const duros = await js(`(() => { ${H}.__bucle(); const c = document.getElementById('mundo'), o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
      const x = o.getContext('2d'); x.drawImage(c, 0, 0); const d = x.getImageData(0, 0, o.width, o.height).data, w = o.width, h = o.height; let n = 0;
      const L = (i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      for (let y = 0; y < h - 1; y++) for (let q = 0; q < w - 1; q++) { const i = (y * w + q) * 4, l = L(i); if (Math.abs(l - L(i + 4)) > 60) n++; if (Math.abs(l - L(i + w * 4)) > 60) n++; }
      return { n, w, h, porMil: +(n * 1000 / (w * h)).toFixed(3) } })()`);
    console.log('  ' + t.id + ' escalones duros: ' + duros.n + ' (' + duros.porMil + ' por mil de pixeles, ' + duros.w + 'x' + duros.h + ')');
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${t.id}.png`), img.toPNG());
    console.log('  ' + t.id + '.png');
  }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  salir(0);
});
