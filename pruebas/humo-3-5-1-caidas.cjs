// Partida real 3.5.1: caídas. Con perfil propio (no pisa el de las otras pruebas).
//  1. Ponerle nombre a una obra terminada: el cuadro del juego (antes window.prompt, que en
//     Electron tiraba "prompt() is not supported"), con Enter, con Esc, con el mando, y el juego
//     quieto mientras tanto. Nuevo recorrido: la pregunta, cancelada, no borra nada.
//  2. Un sistema del bucle que falla: se anota una vez y el mundo se sigue dibujando.
//  3. El contexto 3D perdido y devuelto (WEBGL_lose_context) en Relax y en Desafío: pausa,
//     aviso, guarda, y al volver los impostores están horneados de nuevo y se dibuja sin errores.
//  4. El contexto que no vuelve: guarda y recarga con la partida (y lo avisa).
//  5. La página que se cae de verdad (forcefullyCrashRenderer) con la vigilancia de main.cjs
//     (recuperacion-main.cjs): vuelve sola con la partida guardada y lo avisa.
// Uso: npx electron pruebas/humo-3-5-1-caidas.cjs
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'hojarasca-humo-351-'));
app.setPath('userData', perfil);
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  let esperados = [];   // errores que la prueba provoca a propósito
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if (!(e.level === 'error' || /Uncaught/.test(m)) || /Security|GL_INVALID|PCF|Autofill|AudioContext|favicon|CONTEXT_LOST_WEBGL/.test(m)) return;
    if (esperados.some((x) => m.includes(x))) return;
    errores.push(m.slice(0, 400));
  });
  w.webContents.on('render-process-gone', (_e, d) => { if (!esperandoCaida) errores.push('se cayó la página: ' + JSON.stringify(d)); });
  let esperandoCaida = false;
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 60 s')), 60000))]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (t) => console.log(`\n— ${t}`);
  const url = path.join(raiz, 'index.html');
  const H = 'window.__hojarasca';
  const listo = async (cond = '!!(window.__hojarasca && window.__hojarasca.__caidas)') => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(cond).catch(() => false)) return true; }
    return false;
  };
  const cargar = async (modo) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'baja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    ok(await listo(), `carga el ${modo}`);
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const tecla = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return ${H}.renderer.info.render.frame })()`);
  const dialogo = () => js(`(()=>{ const d = document.getElementById('dialogo'), C = ${H}.__caidas; return { visible: !d.classList.contains('oculto'), texto: document.getElementById('dialogo-texto').textContent,
    entrada: document.getElementById('dialogo-entrada').classList.contains('oculto') ? null : document.getElementById('dialogo-entrada').value, modo: C.modo(), abierto: C.dialogos.abierto() } })()`);
  // cuántos píxeles del atlas de impostores tienen algo (alfa > 0)
  const atlasLleno = () => js(`(()=>{ const H = ${H}, imp = H.veg.prepararImpostores(H.renderer); if (!imp?.atlas) return -1;
    const rt = imp.atlas().verano.color, ancho = Math.min(256, rt.width), alto = Math.min(256, rt.height), buf = new Uint8Array(ancho * alto * 4);
    H.renderer.readRenderTargetPixels(rt, 0, 0, ancho, alto, buf);
    let n = 0; for (let i = 3; i < buf.length; i += 4) if (buf[i] > 0) n++; return n })()`);
  // una captura de la ventana (queda en pruebas/salidas para mirarla) y su versión chica para comparar
  const salidas = path.join(raiz, 'pruebas', 'salidas'); fs.mkdirSync(salidas, { recursive: true });
  // (la hora se fija y se deja asentar 2,5 s: la luz y la bruma se acomodan de a poco)
  const captura = async (nombre) => {
    await js(`(()=>{ const H = ${H}; H.volverAlJuego(); H.progreso.horas = 13; for (let i = 0; i < 8; i++) H.__bucle(); return 1 })()`);
    await esperar(2500);
    await js(`(()=>{ const H = ${H}; H.progreso.horas = 13; for (let i = 0; i < 4; i++) H.__bucle(); return 1 })()`);
    await esperar(300);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salidas, `caidas-${nombre}.png`), img.toPNG());
    return img.resize({ width: 64, height: 40 }).toBitmap();
  };
  const diferencia = (a, b) => { let s = 0, n = 0; for (let i = 0; i < Math.min(a.length, b.length); i += 4) { s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); n += 3; } return n ? s / n : 255; };
  const brillo = (a) => { let s = 0; for (let i = 0; i < a.length; i += 4) s += a[i] + a[i + 1] + a[i + 2]; return s / (a.length / 4) / 3; };
  const ext = `(${H}.__ctxPrueba || (${H}.__ctxPrueba = ${H}.renderer.getContext().getExtension('WEBGL_lose_context')))`;

  // el contexto 3D perdido y devuelto
  const perderYVolver = async (modo, sinRehornear = false) => {
    seccion(`contexto 3D perdido y devuelto (${modo})`);
    await cuadros(6);
    const fotoAntes = await captura(`${modo}-antes`);
    const antes = await atlasLleno();
    ok(antes > 50, `el atlas de impostores tiene dibujo (${antes} píxeles)`);
    await js(`(()=>{ ${H}.progreso.ramitas = 321; ${ext}.loseContext(); return 1 })()`);
    await esperar(400);
    let e = await js(`(()=>{ const C = ${H}.__caidas; return { perdidos: C.graficos.perdidos, aviso: !document.getElementById('graficos-recuperando').classList.contains('oculto'),
      guardado: JSON.parse(localStorage.getItem(${modo === 'desafio' ? "'hojarasca-desafio-v1'" : "'hojarasca-v1'"}) || '{}').ramitas } })()`);
    ok(e.perdidos && e.aviso, `se pausa y avisa "Recuperando los gráficos…" (${JSON.stringify(e)})`);
    ok(e.guardado === 321, `y guarda enseguida (ramitas ${e.guardado})`);
    const f0 = await js(`${H}.renderer.info.render.frame`);
    await cuadros(5);
    ok(await js(`${H}.renderer.info.render.frame`) === f0, 'sin contexto el bucle no dibuja (ni tira errores)');
    // (sinRehornear: la prueba de que hace falta: sin volver a hornear, el atlas queda vacío)
    if (sinRehornear) await js(`(()=>{ window.__rehornear = ${H}.veg.rehornearImpostores; ${H}.veg.rehornearImpostores = () => 0; return 1 })()`);
    await js(`${ext}.restoreContext(); 1`);
    let vuelto = false;
    for (let i = 0; i < 40 && !vuelto; i++) { await esperar(250); vuelto = await js(`!${H}.__caidas.graficos.perdidos`); }
    ok(vuelto, 'cuando la placa lo devuelve, el juego sigue');
    e = await js(`(()=>({ aviso: !document.getElementById('graficos-recuperando').classList.contains('oculto'), recuperados: ${H}.__caidas.graficos.recuperados, gl: ${H}.renderer.getContext().isContextLost() }))()`);
    ok(!e.aviso && e.recuperados >= 1 && !e.gl, `sin el aviso y con el contexto nuevo (${JSON.stringify(e)})`);
    const f2 = await js(`${H}.renderer.info.render.frame`);
    const f1 = await cuadros(10);
    ok(f1 > f2, `y vuelve a dibujar (${f2} → ${f1})`);
    if (sinRehornear) {
      const vacio = await atlasLleno();
      ok(vacio < antes * 0.05, `sin volver a hornearlos, los impostores quedarían vacíos (${vacio} píxeles)`);
      await js(`(()=>{ ${H}.veg.rehornearImpostores = window.__rehornear; ${H}.veg.rehornearImpostores(); return 1 })()`);
    }
    const despues = await atlasLleno();
    ok(despues > antes * 0.9, `los impostores se hornearon de nuevo (${antes} → ${despues} píxeles)`);
    const err = await js(`(()=>{ const gl = ${H}.renderer.getContext(); const n = []; let e; while ((e = gl.getError()) && n.length < 10) n.push(e); return n.join(',') })()`);
    ok(err === '', `sin errores de WebGL después (${err})`);
    // la escena dibujada no está negra: el centro de la pantalla tiene luz
    const luz = await js(`(()=>{ const H = ${H}; H.progreso.horas = 13; for (let i = 0; i < 4; i++) H.__bucle(); const gl = H.renderer.getContext(), px = new Uint8Array(4 * 64);
      gl.readPixels(Math.floor(gl.drawingBufferWidth / 2) - 4, Math.floor(gl.drawingBufferHeight / 2) - 4, 8, 8, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let s = 0; for (let i = 0; i < px.length; i += 4) s += px[i] + px[i + 1] + px[i + 2]; return Math.round(s / 64 / 3) })()`);
    ok(luz > 8, `la escena se ve (brillo medio ${luz})`);
    // la imagen de después es la de antes (mismo lugar, misma hora): sin negro, sin carteles vacíos
    const fotoDespues = await captura(`${modo}-despues`);
    const dif = diferencia(fotoAntes, fotoDespues);
    ok(brillo(fotoDespues) > 20 && dif < 25, `la captura de después se ve como la de antes (diferencia media ${dif.toFixed(1)} de 255, brillo ${brillo(fotoAntes).toFixed(0)} → ${brillo(fotoDespues).toFixed(0)}; pruebas/salidas/caidas-${modo}-*.png)`);
  };

  try {
    // ------------------------------------------------------------ 1. las preguntas
    await cargar('relax');
    seccion('el nombre de la obra (antes window.prompt)');
    let e = await js(`(()=>{ const P = ${H}.progreso, T = ${H}.T, O = ${H}.obras, j = ${H}.jugador, r0 = T.lugares.refugio;
      Object.assign(P.materiales, { tronco: 200, tabla: 200, piedra: 200 });
      const n0 = O.obras.length;
      ${tecla('KeyO')}
      O.elegir(${H}.PLANOS.find((p) => p.id === 'puesto'));
      for (let k = 0; k < 80; k++) {
        const x = r0.x + 40 + (k % 8) * 16, z = r0.z + 40 + Math.floor(k / 8) * 16;
        if (T.agua(x, z) || T.agua(x - 6, z)) continue;
        j.ubicar(x, z, Math.PI / 2);
        ${tecla('KeyY')}
        if (O.obras.length > n0) break;
      }
      const obra = O.obras[O.obras.length - 1];
      if (!obra || O.obras.length === n0) return { error: 'no hubo lugar' };
      for (let i = 0; i < 8 && obra.datos.etapas < obra.plano.etapas.length; i++) { ${tecla('KeyY')} }
      ${tecla('KeyO')}
      return { plano: obra.plano.id, terminada: obra.datos.etapas === obra.plano.etapas.length, nombre: obra.datos.nombre || '' } })()`);
    ok(!e.error && e.terminada, `se termina un puesto con O e Y (${JSON.stringify(e)})`);
    await esperar(1400);   // el nombre se pide 900 ms después
    let d = await dialogo();
    ok(d.visible && d.abierto && d.texto === '¿Cómo le vas a poner?', `aparece el cuadro del juego (${JSON.stringify(d)})`);
    ok(d.entrada !== null && d.entrada.length > 0, `con el nombre de ahora para cambiar (${d.entrada})`);
    ok(d.modo === 'dialogo', 'y el juego queda quieto');
    await js(`${tecla('KeyM')} 1`);
    d = await dialogo();
    ok(d.modo === 'dialogo' && d.visible, 'las teclas del juego no pasan (M no abre el mapa)');
    await js(`(()=>{ const i = document.getElementById('dialogo-entrada'); i.value = '  La Tapera del Ñire  '; i.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true })); return 1 })()`);
    await esperar(300);
    d = await dialogo();
    e = await js(`(()=>{ const O = ${H}.obras, o = O.obras[O.obras.length - 1], k = 'obra-' + (o.datos.x | 0) + '-' + (o.datos.z | 0);
      return { nombre: o.datos.nombre, lugar: ${H}.T.lugares[k]?.nombre, guardado: (localStorage.getItem('hojarasca-v1') || '').includes('La Tapera del Ñire') } })()`);
    ok(!d.visible && d.modo === 'jugando', `Enter lo cierra y se vuelve al juego (${d.modo})`);
    ok(e.nombre === 'La Tapera del Ñire' && e.lugar === 'La Tapera del Ñire', `la obra quedó con su nombre, también en el mapa (${JSON.stringify(e)})`);
    ok(e.guardado, 'y quedó guardado');
    // Esc: no cambia nada
    await js(`(()=>{ const O = ${H}.obras; ${H}.__caidas.pedirNombre(O.obras[O.obras.length - 1]); return 1 })()`);
    await esperar(200);
    await js(`(()=>{ document.getElementById('dialogo-entrada').value = 'Otra cosa'; document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })); return 1 })()`);
    await esperar(300);
    e = await js(`(()=>{ const O = ${H}.obras; return { nombre: O.obras[O.obras.length - 1].datos.nombre, pausa: !document.getElementById('pausa').classList.contains('oculto') } })()`);
    d = await dialogo();
    ok(!d.visible && e.nombre === 'La Tapera del Ñire' && !e.pausa, `Esc cancela sin tocar el nombre ni abrir la pausa (${JSON.stringify(e)})`);
    // el mando: A acepta
    await js(`(()=>{ window.__pad = { connected: true, buttons: [{ pressed: false }, { pressed: false }] }; navigator.getGamepads = () => [window.__pad];
      window.__respuesta = 'nada'; ${H}.__caidas.dialogos.confirmar('¿Con el mando?').then((r) => { window.__respuesta = r; }); return 1 })()`);
    await esperar(200);
    await js(`(()=>{ window.__pad.buttons[0].pressed = true; return 1 })()`);
    await esperar(300);
    ok(await js('window.__respuesta') === true, 'con el mando, A acepta');
    await js(`(()=>{ window.__pad.buttons[0].pressed = false; window.__respuesta = 'nada'; ${H}.__caidas.dialogos.confirmar('¿Y B?').then((r) => { window.__respuesta = r; }); return 1 })()`);
    await esperar(200);
    await js(`(()=>{ window.__pad.buttons[1].pressed = true; return 1 })()`);
    await esperar(300);
    ok(await js('window.__respuesta') === false, 'y B cancela');
    await js(`(()=>{ delete navigator.getGamepads; return 1 })()`);
    // el mouse de verdad: un clic en "Sí" (eventos del sistema, no .click())
    await js(`(()=>{ window.__respuesta = 'nada'; ${H}.__caidas.dialogos.confirmar('¿Con el mouse?').then((r) => { window.__respuesta = r; }); return 1 })()`);
    await esperar(200);
    const caja = await js(`(()=>{ const r = document.getElementById('dialogo-si').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } })()`);
    for (const type of ['mouseMove', 'mouseDown', 'mouseUp']) w.webContents.sendInputEvent({ type, x: caja.x, y: caja.y, button: 'left', clickCount: 1 });
    await esperar(400);
    ok(await js('window.__respuesta') === true, `un clic del mouse en "Sí" acepta (${caja.x}, ${caja.y})`);
    // nuevo recorrido: preguntado, cancelado, no borra
    seccion('nuevo recorrido: la pregunta, cancelada');
    await js(`(()=>{ ${H}.progreso.ramitas = 77; ${H}.guardar(); ${H}.abrir('pausa'); document.getElementById('btn-nuevo').click(); return 1 })()`);
    await esperar(300);
    d = await dialogo();
    ok(d.visible && /borra el recorrido guardado/.test(d.texto), `pregunta antes de borrar (${d.texto.slice(0, 50)}…)`);
    await js(`(()=>{ document.getElementById('dialogo-no').click(); return 1 })()`);
    await esperar(1500);
    e = await js(`(()=>({ ramitas: ${H}.progreso.ramitas, guardado: JSON.parse(localStorage.getItem('hojarasca-v1')).ramitas, visible: !document.getElementById('dialogo').classList.contains('oculto') }))()`).catch((err) => ({ error: err.message }));
    ok(e.ramitas === 77 && e.guardado === 77 && !e.visible, `"No" no borra nada (${JSON.stringify(e)})`);
    await js(`${H}.volverAlJuego(); 1`);

    // ------------------------------------------------------------ 2. un sistema que falla
    seccion('un sistema del bucle que falla');
    esperados = ['prueba 3.5.1: la fauna se rompe'];
    const f0 = await cuadros(2);
    await js(`(()=>{ const F = ${H}.fauna; window.__faunaBien = F.actualizar; F.actualizar = () => { throw new Error('prueba 3.5.1: la fauna se rompe'); }; return 1 })()`);
    for (let i = 0; i < 6; i++) { await cuadros(5); await esperar(60); }
    const f1 = await js(`${H}.renderer.info.render.frame`);
    e = await js(`(()=>{ const F = ${H}.__caidas.fallas().find((f) => f.nombre === 'fauna'); return { fallas: ${H}.__caidas.fallas().length, veces: F?.veces || 0, errores: (window.__hojarascaErrores || []).length } })()`);
    ok(e.veces >= 1, `la falla de la fauna se anotó (${e.veces} veces, una sola en la consola)`);
    ok(f1 > f0 + 20, `y el mundo siguió dibujándose (${f0} → ${f1})`);
    ok(e.errores === 0, `sin excepciones sueltas (${e.errores})`);
    await js(`(()=>{ ${H}.fauna.actualizar = window.__faunaBien; return 1 })()`);
    esperados = [];

    // ------------------------------------------------------------ 3. contexto perdido (Relax)
    await perderYVolver('relax', true);

    // ------------------------------------------------------------ 4. el contexto que no vuelve
    seccion('el contexto que no vuelve: guarda y recarga');
    await js(`(()=>{ ${H}.progreso.ramitas = 4242; ${H}.__caidas.graficos.esperaMs = 1500; ${ext}.loseContext(); return 1 })()`);
    await esperar(2500);
    ok(await listo(), 'la página se recargó sola');
    e = await js(`(()=>({ busca: location.search, aviso: document.getElementById('aviso-recuperado').textContent, visible: !document.getElementById('aviso-recuperado').classList.contains('oculto') }))()`);
    ok(/recuperado=graficos/.test(e.busca) && /debug=1/.test(e.busca), `avisando por qué (${e.busca})`);
    ok(e.visible && /placa de video/.test(e.aviso), `la portada lo dice (${e.aviso})`);
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    e = await js(`(()=>({ ramitas: ${H}.progreso.ramitas, obra: ${H}.obras.obras.some((o) => o.datos.nombre === 'La Tapera del Ñire') }))()`);
    ok(e.ramitas === 4242 && e.obra, `con la partida como estaba (${JSON.stringify(e)})`);

    // ------------------------------------------------------------ 3b. contexto perdido (Desafío)
    await cargar('desafio');
    await js(`(()=>{ const H = ${H}; H.progreso.horas = 22; for (let i = 0; i < 80; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); return 1 })()`);
    await perderYVolver('desafio');
    await js(`(()=>{ const H = ${H}; for (let i = 0; i < 60; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); return 1 })()`);
    await cuadros(10);
    ok(true, 'la noche del Desafío sigue después');

    // ------------------------------------------------------------ 5. la página que se cae
    seccion('la página se cae: main.cjs la vuelve a abrir');
    const registro = [];
    const { registrarRecuperacion } = require(path.join(raiz, 'recuperacion-main.cjs'));
    const rec = registrarRecuperacion({ app, dialog, escribirCrash: (t, m) => registro.push(`${t}: ${m}`), index: url, ventanaActual: () => w, cambiarGraficos: () => false });
    rec.vigilar(w);
    await js(`(()=>{ ${H}.progreso.desafio.abatidos = 99; ${H}.guardar(); return 1 })()`);
    esperandoCaida = true;
    w.webContents.forcefullyCrashRenderer();
    await esperar(3000);
    ok(await listo('!!window.__hojarasca'), 'vuelve a abrir el juego sola');
    esperandoCaida = false;
    e = await js(`(()=>({ busca: location.search, aviso: document.getElementById('aviso-recuperado').textContent, visible: !document.getElementById('aviso-recuperado').classList.contains('oculto'),
      abatidos: JSON.parse(localStorage.getItem('hojarasca-desafio-v1') || '{}').desafio?.abatidos }))()`);
    ok(/recuperado=caida/.test(e.busca) && e.visible && /se volvió a abrir solo/.test(e.aviso), `avisando en la portada (${e.aviso})`);
    ok(e.abatidos === 99, `con la partida guardada (${e.abatidos} abatidos)`);
    ok(registro.some((l) => /^recuperacion: caída 1 .*→ recargar/.test(l)), `y queda en el registro (${registro.join(' | ')})`);
  } catch (err) {
    errores.push('excepción: ' + (err && err.stack ? err.stack : err));
  }
  const errsPagina = await js('(window.__hojarascaErrores || []).slice(0, 5)').catch(() => []);
  for (const m of errsPagina) errores.push('en la página: ' + String(m).slice(0, 300));
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* Windows lo suelta después */ }
  const malos = pasos.filter((p) => p.startsWith('✗')).length;
  if (errores.length) { console.log(`\nFALLÓ (${malos} de ${pasos.length}):\n- ` + [...new Set(errores)].join('\n- ')); app.exit(1); return; }
  console.log(`\nOK 3.5.1 caídas · ${pasos.length} pasos`);
  app.exit(0);
});
