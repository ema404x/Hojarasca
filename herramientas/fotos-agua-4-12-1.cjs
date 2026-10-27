// 4.12.1 (agua y reflejos): capturas de los MISMOS encuadres del agua (lago a mediodía, tarde, ocaso, con luna y de noche; muelle y orilla de cerca;
// arroyo y cascada) para comparar el antes y el después. Mismos encuadres que la medición (herramientas/vistas-agua-4-12-1.cjs). La ventana va VISIBLE
// (el lienzo no se captura bien oculto) y siempre por el lanzador (monitor externo, perfil propio). Parámetros por entorno:
//   $env:HOJ_PAGINA='<index.html>'; $env:HOJ_CALIDAD='media|alta|baja|muybaja'; $env:HOJ_SALIDA='<carpeta>'; [$env:HOJ_SOLO='01,03']; [$env:HOJ_CLIMA='despejado']
//   herramientas\lanzar-electron.ps1 -Script herramientas\fotos-agua-4-12-1.cjs -Visible -Espera 500 -Perfil <carpeta propia>
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { preludio, vistas } = require('./vistas-agua-4-12-1.cjs');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : (process.env['HOJ_' + n.toUpperCase()] || d); };
const pagina = path.resolve(arg('pagina', 'index.html'));
const calidad = arg('calidad', 'alta');
const clima = arg('clima', 'despejado');
const solo = arg('solo', '') ? arg('solo', '').split(',') : null;
const salida = path.resolve(arg('salida', path.join(process.env.TEMP || '.', 'fotos-agua')));
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
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'${clima}', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false, estacion:'verano'})); 1`;
  await w.loadFile(pagina, { search: '?debug=1' });
  await js(ajustes);
  await w.loadFile(pagina, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3500);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  await js(`(() => { let s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s);
    for (const o of ${H}.escena.children) if (o.isPoints && !o.userData.agua) Object.defineProperty(o, 'visible', { get: () => false, set: () => {} }); return 1 })()`);
  await js(preludio);
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  for (const t of vistas) {
    if (solo && !solo.some((s) => t.id.startsWith(s))) continue;
    const lugar = await js(`(() => { const H = ${H}, T = H.T; const p = ${t.donde}; if (!p) return null;
      const y = p.y ?? T.altura(p.x, p.z) + 1.65;
      H.jugador.ubicar(p.x, p.z, 0);
      H.__camaraFija = { x: p.x, y, z: p.z, yaw: p.yaw, pitch: ${t.pitch ?? -0.03} };
      H.camara.fov = ${t.fov || 60}; H.camara.updateProjectionMatrix(); H.progreso.horas = p.horas; window.__hora = p.horas;
      H.camara.children.forEach((q) => { q.visible = false; }); return { x: +p.x.toFixed(1), z: +p.z.toFixed(1), horas: p.horas } })()`);
    if (!lugar) { console.log('  ' + t.id + ': este lugar no está en esta versión'); continue; }
    for (let i = 0; i < 150; i++) { await js(`${H}.progreso.horas = window.__hora; 1`); await cuadro(1); await esperar(20); }
    await esperar(300);
    await js(`${H}.progreso.horas = window.__hora; ${H}.__bucle(); 1`);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${calidad}-${t.id}.png`), img.toPNG());
    console.log('  ' + t.id + ' · ' + calidad + ' ' + JSON.stringify(lugar));
  }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  await esperar(800);
  salir(0);
}).catch((e) => { console.log('ERROR: ' + (e && e.stack ? e.stack : e)); salir(1); });
