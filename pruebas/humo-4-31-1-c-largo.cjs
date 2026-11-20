// Partida real larga 4.31.1 (C): una partida del Relax de HUMO_MINUTOS (40 por defecto) en Alta con Ultra (HUMO_ULTRA=0 la apaga), minimizada.
// Cada 15 s aparece en otro lugar del valle (el lago, el bosque, la aldea, el arroyo, la vía) y camina, corre, salta y se agacha; cada
// 2 min cambia la estación, el clima (lluvia, nieve, despejado) y la hora (día y noche); de vez en cuando usa la E de la naturaleza
// (sacudir, tocar el agua, el sapito). Mide la memoria (montón de JS, geometrías, texturas, programas, objetos de la escena) y anota
// todo error de la consola. Al final: la memoria al principio y al final (después de calentar) y si creció.
// Uso: powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-4-30-1-a.ps1 -Script pruebas\humo-4-31-1-c-largo.cjs -Espera 3300 -Perfil perfil-4311-c
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-31-1-c'));
const MINUTOS = Number(process.env.HUMO_MINUTOS || 40);
const ULTRA = process.env.HUMO_ULTRA !== '0';
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó demasiado'); try { app.exit(2); } catch { process.exit(2); } }, (MINUTOS + 12) * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  const errores = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: 1366, height: 768, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { errores.push(m.slice(0, 240)); console.log('  CONSOLA: ' + m.slice(0, 240)); }
  });
  const js = (c, espera = 120000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió')), espera))]);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'alta', ultra: ${ULTRA}, clima: 'despejado', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, estacion: 'verano' })); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(4000);
    await js(`(() => { window.__sinPausaPorBlur = true; const H = window.__hojarasca; H.ajustes.limiteFps = 'libre'; for (let k = 0; k < 6; k++) { const b = document.querySelector('#valle-tarjeta:not(.oculto) button[data-valle-opcion]'); if (b) b.click(); } return 1 })()`);
    // el bucle de la partida corre en la página (a ~60 cuadros por segundo con __bucle), y Node sólo pregunta cada tanto
    await js(String.raw`(() => {
      const H = window.__hojarasca, P = H.progreso, T = H.T, J = H.jugador;
      const tecla = (code, abajo) => document.dispatchEvent(new KeyboardEvent(abajo ? 'keydown' : 'keyup', { code, key: code, bubbles: true, cancelable: true }));
      const L = window.__L = { cuadros: 0, ms: [], muestras: [], pasos: 0, lugares: 0, eventos: [], fallas: 0 };
      const LUGARES = [[150, 40], [40, -300], [-287, -266], [-200, 150], [300, -200], [100, 300], [-350, -100], [0, 0], [220, 180], [-120, -380]];
      const ESTACIONES = ['verano', 'otono', 'invierno', 'primavera'];
      let t = 0, proximoLugar = 0, proximoClima = 0, proximaE = 5, k = 0;
      const nat = () => (H.__naturaleza ? H.__naturaleza() : null);
      const muestra = () => { const m = performance.memory || {}; const i = H.renderer.info; let obj = 0; H.escena.traverse(() => obj++);
        L.muestras.push({ t: Math.round(t), heap: Math.round((m.usedJSHeapSize || 0) / 1048576), geo: i.memory.geometries, tex: i.memory.textures, prog: i.programs.length, obj, sueltas: nat()?.mundo.activas() ?? 0, ms: L.ms.length ? +(L.ms.reduce((a, b) => a + b, 0) / L.ms.length).toFixed(1) : 0 }); L.ms.length = 0; };
      L.paso = () => {
        const t0 = performance.now();
        const dt = 1 / 60; t += dt; L.cuadros++;
        if (t >= proximoLugar) {
          proximoLugar = t + 15; L.lugares++;
          const [x, z] = LUGARES[k++ % LUGARES.length];
          const ox = x + (Math.random() - 0.5) * 40, oz = z + (Math.random() - 0.5) * 40;
          for (const c of ['KeyW', 'ShiftLeft', 'KeyC', 'Space', 'KeyA', 'KeyD']) tecla(c, false);
          J.ubicar(ox, oz, Math.random() * 6.28);
          tecla('KeyW', true);
        }
        if (Math.random() < 0.004) { const c = Math.random() < 0.5 ? 'ShiftLeft' : 'KeyC'; tecla(c, true); setTimeout(() => tecla(c, false), 1500); }
        if (Math.random() < 0.003) { tecla('Space', true); setTimeout(() => tecla('Space', false), 120); }
        if (Math.random() < 0.01) J.estado.yaw += (Math.random() - 0.5) * 1.5;
        if (t >= proximoClima) {
          proximoClima = t + 120;
          const est = ESTACIONES[Math.floor(t / 120) % 4]; H.ajustes.estacion = est;
          const e = H.clima.estado, r = Math.random();
          const cl = r < 0.35 ? 'lluvia' : r < 0.5 ? 'nieve' : 'despejado';
          H.ajustes.clima = cl; e.objetivo = cl; e.proximo = cl; e.lluvia = cl === 'despejado' ? 0 : 0.9; e.nublado = cl === 'despejado' ? 0.15 : 0.95;
          P.horas = [11, 19.5, 23, 4, 8][Math.floor(t / 120) % 5];
          L.eventos.push(Math.round(t) + ' s: ' + est + ', ' + cl + ', ' + P.horas + ' h');
        }
        if (t >= proximaE) {
          proximaE = t + 6 + Math.random() * 6;
          try { const a = nat()?.accion(J.estado); if (a) { a.hacer(); L.eventos.push(Math.round(t) + ' s: E ' + a.id); } } catch (er) { L.eventos.push('falla E ' + er.message); L.fallas++; }
        }
        try { H.__bucle(); } catch (er) { L.fallas++; if (L.fallas < 5) console.error('bucle: ' + er.message); }
        L.ms.push(performance.now() - t0);
      };
      L.muestra = muestra;
      return 1;
    })()`);
    const muestras = [];
    const t0 = Date.now();
    let proximaMuestra = 0;
    while (Date.now() - t0 < MINUTOS * 60000) {
      // ~2 s de juego por pedido (120 cuadros), con un respiro entre medio: la PC no se calienta y la página responde
      await js(`(async () => { for (let i = 0; i < 120; i++) { window.__L.paso(); if (i % 6 === 5) await new Promise((r) => setTimeout(r, 4)); } return 1 })()`, 60000);
      if (Date.now() - t0 >= proximaMuestra) {
        proximaMuestra = Date.now() - t0 + 60000;
        await js('(typeof gc === "function" && gc(), window.__L.muestra(), 1)');
        const m = await js('window.__L.muestras[window.__L.muestras.length - 1]');
        muestras.push(m);
        console.log(`  ${Math.round((Date.now() - t0) / 60000)} min · juego ${m.t} s · montón ${m.heap} MB · geometrías ${m.geo} · texturas ${m.tex} · programas ${m.prog} · objetos ${m.obj} · sueltas ${m.sueltas} · ${m.ms} ms por cuadro`);
      }
    }
    const L = await js('({ cuadros: window.__L.cuadros, lugares: window.__L.lugares, fallas: window.__L.fallas, eventos: window.__L.eventos.slice(-60) })');
    console.log(`\n  ${L.cuadros} cuadros, ${L.lugares} lugares, ${L.fallas} fallas del bucle`);
    console.log('  ' + L.eventos.join(' · '));
    const fallas = await js('(() => { const C = window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 800) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push('fallas del juego ' + fallas.slice(0, 300)); }
    fs.writeFileSync(path.join(salida, 'largo.json'), JSON.stringify({ muestras, eventos: L.eventos }, null, 1));
    // la memoria: de la muestra 3 (ya calentado: todo compilado y armado) a la última
    if (muestras.length >= 6) {
      const a = muestras[3], b = muestras[muestras.length - 1];
      console.log(`  memoria del minuto 3 al final: montón ${a.heap} → ${b.heap} MB · geometrías ${a.geo} → ${b.geo} · texturas ${a.tex} → ${b.tex} · objetos ${a.obj} → ${b.obj}`);
      if (b.geo > a.geo * 1.25 + 40) errores.push(`las geometrías crecen (${a.geo} → ${b.geo})`);
      if (b.tex > a.tex + 12) errores.push(`las texturas crecen (${a.tex} → ${b.tex})`);
      if (b.heap > a.heap * 1.5 + 60) errores.push(`el montón crece (${a.heap} → ${b.heap} MB)`);
      if (b.obj > a.obj * 1.25 + 200) errores.push(`los objetos de la escena crecen (${a.obj} → ${b.obj})`);
    }
    if (L.fallas) errores.push(`${L.fallas} fallas del bucle`);
  } catch (err) { console.log('ERROR:', err && err.stack || err); errores.push(String(err && err.message || err)); }
  console.log(`\n${errores.length ? '✗ ' + errores.length + ' problemas:\n  ' + errores.slice(0, 30).join('\n  ') : '✓ todo bien'}`);
  app.exit(errores.length ? 1 : 0);
});
