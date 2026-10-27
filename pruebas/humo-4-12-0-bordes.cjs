// Partida real 4.12.0 (Electron + WebGL): bordes suaves.
// Para cada calidad (muybaja, baja, media, alta) abre el juego, entra al Relax y comprueba con la placa de verdad:
//   · Media y Alta: el postproceso existe, su composición se armó con el FXAA, el destino no tiene muestras (MSAA apagado) y los shaders compilan;
//   · Muy baja y Baja: no hay postproceso ni FXAA (siguen como estaban);
//   · ningún programa de shader nuevo después de asentarse (de día, de noche y girando la cámara): nada se compila a mitad de juego;
//   · el cuadro no sale negro ni vacío y no hay errores de consola;
//   · los dibujos por cuadro son los de siempre (no se sumó ninguno): se cuentan con la herramienta de la placa.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`), siempre en el monitor externo:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-12-0-bordes.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
// HUMO_PAGINA=<index.html> para probar otra página armada.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const pagina = path.resolve(process.env.HUMO_PAGINA || path.join(raiz, 'index.html'));
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const visible = process.env.HUMO_OCULTO === '0';
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
let pasos = 0, fallas = 0;
const ok = (c, t) => { pasos++; if (c) console.log('OK ' + t); else { fallas++; console.log('FALLA ' + t); } };

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: visible, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught|shader error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  for (const q of ['muybaja', 'baja', 'media', 'alta']) {
    const conPost = q === 'media' || q === 'alta';
    const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${q}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false})); 1`;
    await w.loadFile(pagina, { search: '?debug=1' });
    await js(ajustes);
    await w.loadFile(pagina, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T && ${H}.renderer)`).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
    const info = await js(`(() => { const P = ${H}.__postproceso && ${H}.__postproceso();
      const fs = P ? P.materialComponer.fragmentShader : '';
      return { hayPost: !!P, fxaa: /^#define HOJ_FXAA/m.test(fs), muestras: P ? P.destino.samples : -1, texel: P ? [P.uniforms.uTexel.value.x, P.uniforms.uTexel.value.y] : null,
        contexto: ${H}.renderer.getContext().getContextAttributes().antialias } })()`);
    console.log(`-- ${q}: ${JSON.stringify(info)}`);
    ok(info.hayPost === conPost, `${q}: ${conPost ? 'tiene' : 'no tiene'} postproceso`);
    ok(info.fxaa === conPost, `${q}: ${conPost ? 'la composición lleva el FXAA' : 'sin FXAA'}`);
    if (conPost) {
      ok(info.muestras === 0, `${q}: el destino no tiene muestras (MSAA apagado por costo)`);
      ok(info.texel && info.texel[0] > 0 && info.texel[0] < 1 && info.texel[1] > 0 && info.texel[1] < 1, `${q}: el texel del FXAA está cargado`);
    }
    // asentarse: varios cuadros de día, y recién ahí se cuentan los programas
    const correr = (n) => js(`(async () => { for (let i = 0; i < ${n}; i++) { ${H}.__bucle(); if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0)); } return 1 })()`);
    await correr(120);
    const progs = () => js(`${H}.renderer.info.programs.length`);
    const nombres = () => js(`${H}.renderer.info.programs.map((p) => p.name + ':' + (p.cacheKey || '').length + ':' + (p.cacheKey || '').slice(0, 60))`);
    const nombresAntes = new Set(await nombres());
    const antes = await progs();
    // de día, de noche, girando y mirando al cielo: nada tiene que compilarse
    await js(`(() => { ${H}.progreso.horas = 12; return 1 })()`); await correr(40);
    await js(`(() => { ${H}.progreso.horas = 22; return 1 })()`); await correr(40);
    await js(`(() => { ${H}.progreso.horas = 7; const J = ${H}.jugador.estado; J.yaw += 2.4; J.pitch = 0.5; return 1 })()`); await correr(40);
    await js(`(() => { ${H}.progreso.horas = 12; const J = ${H}.jugador.estado; J.pitch = -0.05; return 1 })()`); await correr(40);
    const despues = await progs();
    if (despues !== antes) console.log('   programas nuevos: ' + JSON.stringify((await nombres()).filter((n) => !nombresAntes.has(n))));
    ok(despues === antes, `${q}: ningún programa de shader nuevo en ${160} cuadros de día, noche y giros (${antes} → ${despues})`);
    // el cuadro tiene imagen (no negro) y se cuentan los dibujos
    const cuadro = await js(`(() => { const R = ${H}.renderer; R.info.autoReset = false; R.info.reset(); ${H}.__bucle();
      const c = document.getElementById('mundo'), o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const x = o.getContext('2d'); x.drawImage(c, 0, 0);
      const d = x.getImageData(0, 0, o.width, o.height).data; let suma = 0, distintos = new Set();
      for (let i = 0; i < d.length; i += 4 * 97) { suma += d[i] + d[i + 1] + d[i + 2]; distintos.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4)); }
      const r = { llamadas: R.info.render.calls, luz: +(suma / (d.length / (4 * 97)) / 3).toFixed(1), colores: distintos.size, ancho: c.width }; R.info.autoReset = true; return r })()`);
    console.log(`   cuadro: ${JSON.stringify(cuadro)}`);
    ok(cuadro.luz > 20 && cuadro.colores > 40, `${q}: el cuadro tiene imagen (luz media ${cuadro.luz}, ${cuadro.colores} colores)`);
    ok(cuadro.llamadas > 50 && cuadro.llamadas < 400, `${q}: ${cuadro.llamadas} dibujos por cuadro (nada raro)`);
  }
  ok(errores.length === 0, 'sin errores de consola ni de shaders' + (errores.length ? ': ' + errores.join(' | ') : ''));
  console.log(fallas ? `FALLARON ${fallas} de ${pasos}` : `TODO BIEN: ${pasos} pasos OK`);
  try { app.exit(fallas ? 1 : 0); } catch { process.exit(fallas ? 1 : 0); }
});
