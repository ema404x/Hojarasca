// 4.12.0 (bordes suaves): capturas de los MISMOS encuadres (copas de árboles contra el cielo, techos, vallas, cables, carteles) para comparar el antes y el después.
// Se corre con una página armada, la calidad y una carpeta de salida; la ventana va VISIBLE (el lienzo no se captura bien oculto) y siempre por el lanzador
// (monitor externo, perfil propio). Los parámetros van por variables de entorno:
//   $env:HOJ_PAGINA='<index.html>'; $env:HOJ_CALIDAD='media|alta'; $env:HOJ_SALIDA='<carpeta>'
//   herramientas\lanzar-electron.ps1 -Script herramientas\fotos-bordes-4-12-0.cjs -Visible -Espera 500 -Perfil <carpeta propia>
// Los encuadres están en fotos-bordes-4-12-0.json (`donde` se evalúa en la página y devuelve { x, z, yaw, horas }; el jugador queda ahí y la cámara
// mira con `pitch`): el mundo no cambia entre versiones, así que son los mismos antes y después. Además de la imagen cuenta los «escalones duros»:
// pares de píxeles vecinos que saltan más de 60 de 255 de luz (los dientes de sierra de los bordes); con el suavizado tienen que bajar.
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : (process.env['HOJ_' + n.toUpperCase()] || d); };
const pagina = path.resolve(arg('pagina', 'index.html'));
const calidad = arg('calidad', 'alta');
const salida = path.resolve(arg('salida', path.join(process.env.TEMP || '.', 'fotos-bordes')));
fs.mkdirSync(salida, { recursive: true });
dialog.showErrorBox = (t, c) => { try { fs.writeFileSync(path.join(salida, 'error.txt'), t + String.fromCharCode(10) + c); } catch { /* sin carpeta */ } };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
setTimeout(() => { console.log('ERROR: tardó más de 10 minutos'); salir(2); }, 10 * 60 * 1000).unref?.();

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
  // la aldea se monta de a poco después de la carga: se cuentan cuadros a mano hasta que esté (como herramientas/medir-vistas.cjs)
  await js(`(async () => { const H = ${H}, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0;
    for (let i = 0; i < 100 && A.medir().fabrica.pendientes > 0; i++) await new Promise((ok) => setTimeout(ok, 100));
    for (let n = 0; n < 3000 && (A.medir().cola > 0 || A.medir().listas < A.medir().manzanas); n++) { H.__bucle(); if (n % 50 === 49) await new Promise((ok) => setTimeout(ok, 0)); }
    return 1 })()`);
  const tomas = JSON.parse(fs.readFileSync(path.resolve(arg('tomas', path.join(__dirname, 'fotos-bordes-4-12-0.json'))), 'utf8'));
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  for (const t of tomas) {
    const lugar = await js(`(() => { const H = ${H}, T = H.T; const p = ${t.donde}; if (!p) return null;
      const y = p.y ?? T.altura(p.x, p.z) + 1.65;
      H.jugador.ubicar(p.x, p.z, 0);
      H.__camaraFija = { x: p.x, y, z: p.z, yaw: p.yaw, pitch: ${t.pitch ?? -0.03} };
      H.camara.fov = ${t.fov || 60}; H.camara.updateProjectionMatrix(); H.progreso.horas = p.horas; window.__hora = p.horas;
      H.camara.children.forEach((q) => { q.visible = false; }); return { x: +p.x.toFixed(1), z: +p.z.toFixed(1), horas: p.horas } })()`);
    if (!lugar) { console.log('  ' + t.id + ': este lugar no está en esta versión'); continue; }
    for (let i = 0; i < 150; i++) { await js(`${H}.progreso.horas = window.__hora; 1`); await cuadro(1); await esperar(20); }
    await esperar(300);
    // los escalones duros (se lee el lienzo en la misma tarea en que se dibuja el cuadro)
    const duros = await js(`(() => { ${H}.__bucle(); const c = document.getElementById('mundo'), o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
      const x = o.getContext('2d'); x.drawImage(c, 0, 0); const d = x.getImageData(0, 0, o.width, o.height).data, w = o.width, h = o.height; let n = 0;
      const L = (i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      for (let y = 0; y < h - 1; y++) for (let q = 0; q < w - 1; q++) { const i = (y * w + q) * 4, l = L(i); if (Math.abs(l - L(i + 4)) > 60) n++; if (Math.abs(l - L(i + w * 4)) > 60) n++; }
      return { n, w, h, porMil: +(n * 1000 / (w * h)).toFixed(3) } })()`);
    console.log('  ' + t.id + ' · ' + calidad + ' · escalones duros ' + duros.n + ' (' + duros.porMil + ' por mil de píxeles, ' + duros.w + 'x' + duros.h + ')');
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${t.id}.png`), img.toPNG());
  }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  await esperar(800);   // (que se vacíe la salida antes de cerrar)
  salir(0);
}).catch((e) => { console.log('ERROR: ' + (e && e.stack ? e.stack : e)); salir(1); });
