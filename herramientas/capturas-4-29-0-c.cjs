// 4.29.0 (C): capturas de lo mío en una partida real (Electron visible, por el lanzador y con el candado de Electron tomado): por escenario,
// la misma toma con Alta y con Ultra (cambiado EN VIVO: el mismo cielo, las mismas nubes y la misma gente) y, donde algo se mueve, varias tomas seguidas.
//   $env:CAP_ESC='vidrios,gente-viento'; $env:CAP_SALIDA='<carpeta>'; $env:CAP_ESTACION='verano'; powershell -File herramientas\lanzar-electron.ps1 -Script herramientas\capturas-4-29-0-c.cjs -Espera 600 -Perfil <carpeta> -Visible
// Variables: CAP_ESC (los escenarios, separados por coma; `listar` imprime la gente y el estado), CAP_SALIDA, CAP_ESTACION (verano, otono, invierno),
//   CAP_CLIMA (despejado), CAP_LLUVIA=1 (lluvia plena), CAP_ESCALA (1,5: el lienzo interno de 1920x1080 sobre la ventana de 1280x720), CAP_SOLO_ULTRA=1.
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const env = (n, d) => process.env['CAP_' + n] || d;
const pagina = path.resolve(env('PAGINA', 'index.html'));
const salida = path.resolve(env('SALIDA', path.join(process.env.TEMP || '.', 'capturas-4-29-0-c')));
const estacion = env('ESTACION', 'verano');
const clima = env('CLIMA', 'despejado');
const lluvia = env('LLUVIA', '0') === '1';
const ESCALA = Number(env('ESCALA', 1.5));
const ESCS = env('ESC', 'listar').split(',');
const soloUltra = env('SOLO_ULTRA', '0') === '1';
fs.mkdirSync(salida, { recursive: true });
dialog.showErrorBox = (t, c) => { try { fs.writeFileSync(path.join(salida, 'error.txt'), t + String.fromCharCode(10) + c); } catch { /* sin carpeta */ } };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log('ERROR: ' + (e && e.stack ? e.stack : e)); salir(1); });
process.on('unhandledRejection', (e) => { console.log('ERROR: ' + (e && e.stack ? e.stack : e)); salir(1); });
setTimeout(() => { console.log('ERROR: tardó más de 15 minutos'); salir(2); }, 15 * 60 * 1000).unref?.();

// lo que corre en la página
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, R = H.renderer;
  const A = window.__CAP = {};
  const UU = () => (typeof H.__U === 'function' ? H.__U() : H.__U);
  window.__UU = UU;
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.poner = (p, pitch, fov) => {
    const y = p.y ?? T.altura(p.x, p.z) + 1.65;
    H.jugador.ubicar(p.x, p.z, p.yaw);
    H.jugador.estado.yaw = p.yaw; H.jugador.estado.pitch = pitch;
    H.__camaraFija = { x: p.x, y, z: p.z, yaw: p.yaw, pitch };
    H.camara.fov = fov; H.camara.updateProjectionMatrix();
    H.progreso.horas = p.horas; window.__hora = p.horas;
    H.camara.children.forEach((q) => { q.visible = false; });
    return { x: +p.x.toFixed(1), y: +y.toFixed(1), z: +p.z.toFixed(1), yaw: +p.yaw.toFixed(3), horas: p.horas };
  };
  A.cuadros = async (n, dt) => { for (let i = 0; i < n; i++) { H.progreso.horas = window.__hora; H.__bucle(); if (i % 10 === 9) await dormir(0); } return 1; };
  A.programas = () => R.info.programs.length;
  A.ultra = (v) => { H.ajustes.ultra = !!v; return H.ajustes.ultra; };
  A.lluvia = () => { const e = H.clima.estado, U = UU(); e.nublado = 0.95; e.lluvia = 1; e.vientoBase = 0.9; e.objetivo = 'lluvia'; e.proximo = 'lluvia'; e.t = 1e9; U.uMojado.value = 1; return 1; };
  A.viento = (v) => { const e = H.clima.estado; e.vientoBase = v; e.viento = v; UU().uViento.value = v; return v; };
  // la ola de ráfaga (la misma cuenta del shader): pone el reloj del viento (U.uTiempo) en el momento en que la ola vale «q» (0 = en calma, 1 = la cresta) en (x, z)
  A.ola = (x, z, q) => {
    const dx = Math.hypot(1, 0.35), ex = 1 / dx, ez = 0.35 / dx, d = x * ex + z * ez, p = -ez * x + ex * z;
    const f = (t) => Math.pow(Math.sin(d * 0.035 - t * 0.36) * 0.5 + 0.5, 3) * (0.55 + 0.45 * Math.sin(p * 0.021 + t * 0.11));
    let mn = 9, mx = -9; const v = [];
    for (let t = 60; t < 360; t += 0.05) { const y = f(t); v.push([t, y]); if (y < mn) mn = y; if (y > mx) mx = y; }
    const obj = mn + q * (mx - mn); let mejor = v[0];
    for (const e of v) if (Math.abs(e[1] - obj) < Math.abs(mejor[1] - obj)) mejor = e;
    UU().uTiempo.value = mejor[0]; return +mejor[1].toFixed(2);
  };
  return 1;
})()`;

const ESCENARIOS = {
  // el biblioteca desde enfrente: los vidrios que reflejan el cielo (de día, al ocaso)
  'vidrios': { horas: 12, pitch: 0.02, fov: 50, donde: `(()=>{ const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const e = A.estadoEdificio('biblioteca'); if (!e) return null; const s = e.sitio; const fx = Math.sin(s.rot), fz = Math.cos(s.rot); const x = s.x + fx * 9 + fz * 0, z = s.z + fz * 9 - fx * 0; return { x, z, y: H.T.altura(x, z) + 1.7, yaw: Math.atan2(x - s.x, z - s.z), horas: 12 } })()` },
  'vidrios-ocaso': { horas: 18.6, pitch: 0.02, fov: 50, donde: `(()=>{ const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const e = A.estadoEdificio('biblioteca'); if (!e) return null; const s = e.sitio; const fx = Math.sin(s.rot), fz = Math.cos(s.rot); const x = s.x + fx * 9, z = s.z + fz * 9; return { x, z, y: H.T.altura(x, z) + 1.7, yaw: Math.atan2(x - s.x, z - s.z), horas: 18.6 } })()` },
  'vidrios-casa': { horas: 12, pitch: 0.0, fov: 50, donde: `(()=>{ const L = H.T.lugares.refugio; const x = L.x + 5, z = L.z + 5; return { x, z, y: H.T.altura(x, z) + 1.6, yaw: Math.atan2(x - L.x, z - L.z), horas: 12 } })()` },
};

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.focus();
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c, true);
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', ultra:${!soloUltra ? 'false' : 'true'}, clima:'${clima}', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false, estacion:'${estacion}'})); 1`;
  await w.loadFile(pagina, { search: '?debug=1' });
  await js(ajustes);
  await w.loadFile(pagina, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3500);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  await js(PAGINA);
  console.log('lienzo ' + (await js(`(() => { const R = ${H}.renderer; R.setPixelRatio(${ESCALA}); const p = ${H}.__postproceso(); if (p) p.redimensionar(window.innerWidth, window.innerHeight); return [R.domElement.width, R.domElement.height] })()`)).join('x'));
  await js(`(() => { let s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1 })()`);
  await js(`(async () => { for (let n = 0; n < 60; n++) ${H}.__bucle(); return 1 })()`);
  const previas = new Map();
  // (diferencia con la toma anterior del mismo modo: cuántos píxeles cambiaron, para mostrar que algo se mueve; y el recorte ampliado de la zona)
  const foto = async (nombre, modo, recorte) => {
    let img = null;
    for (let i = 0; i < 5 && !img; i++) { try { img = await w.webContents.capturePage(); } catch (e) { try { w.show(); w.focus(); } catch {} await js(`window.__CAP.cuadros(3)`); await esperar(1200); } }
    if (img) {
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      const bm = img.toBitmap(), sz = img.getSize(), prev = previas.get(modo);
      let cambia = 0;
      if (prev && prev.length === bm.length) for (let i = 0; i < bm.length; i += 4) if (Math.abs(bm[i] - prev[i]) + Math.abs(bm[i + 1] - prev[i + 1]) + Math.abs(bm[i + 2] - prev[i + 2]) > 36) cambia++;
      previas.set(modo, Buffer.from(bm));
      console.log('  ' + nombre + ': ' + sz.width + 'x' + sz.height + (prev ? ', píxeles que cambian respecto de la anterior: ' + cambia + ' (' + (100 * cambia / (sz.width * sz.height)).toFixed(2) + ' %)' : ''));
      if (recorte) { const z = img.crop({ x: Math.max(0, Math.round(recorte.x)), y: Math.max(0, Math.round(recorte.y)), width: Math.min(sz.width, Math.round(recorte.w)), height: Math.min(sz.height, Math.round(recorte.h)) }).resize({ width: 960, quality: 'best' }); fs.writeFileSync(path.join(salida, nombre + '-zoom.png'), z.toPNG()); }
    } else console.log('  sin captura ' + nombre);
  };
  const resultado = { estacion, clima, lluvia, escenarios: {}, errores };
  if (lluvia) await js(`window.__CAP.lluvia()`);
  for (const esc of ESCS) {
    if (esc === 'listar') {
      resultado.gente = await js(`(${H}.gente.gente || []).map((g) => g.clave + '@' + Math.round(g.pos.x) + ',' + Math.round(g.pos.z))`);
      resultado.programas = await js(`window.__CAP.programas()`);
      console.log(JSON.stringify(resultado.gente)); continue;
    }
    const cuerpo = ESCENARIOS[esc] || (fs.existsSync(path.join(__dirname, 'capturas-4-29-0-c-escenarios.cjs')) ? require('./capturas-4-29-0-c-escenarios.cjs')[esc] : null);
    if (!cuerpo) { console.log('no hay escenario ' + esc); continue; }
    if (cuerpo.antes) { const rr = await js(cuerpo.antes); console.log('  antes: ' + JSON.stringify(rr)); }
    const lugar = await js(`(() => { const H = ${H}, T = H.T; const p = ${cuerpo.donde}; if (!p) return null; return ${cuerpo.sinPoner ? 'p' : 'window.__CAP.poner(p, ' + (cuerpo.pitch ?? -0.03) + ', ' + (cuerpo.fov || 55) + ')'} })()`);
    if (!lugar) { console.log('  ' + esc + ': este lugar no está'); resultado.escenarios[esc] = null; continue; }
    if (lluvia) await js(`window.__CAP.lluvia()`);
    await js(`window.__CAP.ultra(false)`);
    await js(`window.__CAP.cuadros(${cuerpo.asiento ?? 150})`);
    await esperar(1200);
    await js(`window.__CAP.cuadros(40)`);
    await js(`(() => { const H = ${H}, c = H.camara.position; for (let i = 0; i < 4; i++) { H.veg.actualizar(c, 1); H.objetos.actualizar?.(c); } return 1 })()`);
    await esperar(600);
    await js(`window.__CAP.cuadros(40)`);
    const r = { donde: lugar, programasAlta: await js(`window.__CAP.programas()`), fotos: [] };
    const modos = soloUltra ? ['ultra'] : ['alta', 'ultra'];
    for (const modo of modos) {
      await js(`window.__CAP.ultra(${modo === 'ultra'})`);
      await js(`window.__CAP.cuadros(10)`);
      if (cuerpo.preModo) await js(typeof cuerpo.preModo === 'function' ? cuerpo.preModo(modo) : cuerpo.preModo);
      const n = cuerpo.fotos || 1;
      for (let k = 0; k < n; k++) {
        if (cuerpo.paso) await js(cuerpo.paso.replace(/__K__/g, String(k)));
        await js(`window.__CAP.cuadros(${cuerpo.cuadrosEntre || 4})`);
        const nombre = `${esc}-${modo}` + (n > 1 ? `-${k + 1}` : '');
        const rec = cuerpo.recorte ? await js(cuerpo.recorte) : null;
        await foto(nombre, modo, rec); r.fotos.push(nombre);
      }
      if (cuerpo.medir) r[modo] = await js(cuerpo.medir);
    }
    r.programasUltra = await js(`window.__CAP.programas()`);
    if (cuerpo.despues) await js(cuerpo.despues);
    await js(`window.__CAP.ultra(false)`);
    resultado.escenarios[esc] = r;
    console.log(esc + ': ' + JSON.stringify(r));
  }
  fs.writeFileSync(path.join(salida, 'capturas.json'), JSON.stringify(resultado, null, 1));
  console.log('errores de consola: ' + errores.length + (errores.length ? ' ' + JSON.stringify(errores.slice(0, 5)) : ''));
  salir(0);
});
