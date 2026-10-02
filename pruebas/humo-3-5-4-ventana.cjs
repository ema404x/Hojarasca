// Partida real 3.5.4: la ventana y las teclas, con el juego arrancado como el instalador
// (main.cjs entero: menú, navegación, una sola copia, recuperación) y un perfil propio.
//  1. Sin menú; la ventana sólo navega al juego (un archivo de la compu, https, data: no), las
//     recargas propias del juego siguen andando y no queda historial para "atrás".
//  2. Soltar archivos: la página no los acepta y la ventana no navega con ellos.
//  3. Alt+Espacio no le llega a Windows (menú de la ventana) pero sí al juego (salto).
//  4. F5, Ctrl+F5, Ctrl+Shift+R, Ctrl+R, Ctrl+Shift+I, F12, Ctrl+W, Ctrl+M, Ctrl+Q, Ctrl+F4,
//     Ctrl+rueda y Ctrl+Más/Menos/0: nada se cierra, recarga, minimiza ni se agranda.
//  5. Teclas pegadas: perder el foco suelta W y Shift, y sin el mouse bloqueado igual pausa.
//  6. El bloqueo del mouse que falla sin gesto o sin foco no pasa a "arrastrar para mirar".
//  7. Suspender, bloquear la pantalla, Windows que cierra la sesión: pausa y guarda.
//  8. Minimizar, restaurar, pantalla completa, ventana chica: el dibujo sigue bien.
//  9. Abrir el juego otra vez: la segunda copia no abre ventana y trae al frente la primera.
// 10. Cerrar la ventana (la X, Alt+F4) guarda lo último.
// Uso: npx electron --no-sandbox pruebas/humo-3-5-4-ventana.cjs
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const { app, BrowserWindow, Menu, powerMonitor } = require('electron');
const raiz = path.resolve(__dirname, '..');
const segunda = process.env.HUMO_354_SEGUNDA === '1';
const perfil = process.env.HUMO_354_PERFIL || fs.mkdtempSync(path.join(os.tmpdir(), 'hojarasca-humo-354-'));
app.setPath('userData', perfil);   // antes de main.cjs: nunca el perfil del jugador
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

if (segunda) {
  // la segunda copia: main.cjs tiene que irse sin abrir nada
  app.on('browser-window-created', () => console.log('SEGUNDA: ventana creada'));
  setTimeout(() => { console.log('SEGUNDA: sigue viva a los 15 s'); app.exit(5); }, 15000);
}
require(path.join(raiz, 'main.cjs'));
if (!segunda) app.whenReady().then(principal);

async function principal() {
  const errores = [], pasos = [];
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const nota = (texto) => console.log(`  · ${texto}`);
  const seccion = (t) => console.log(`\n— ${t}`);
  let w = null;
  for (let i = 0; i < 150 && !w; i++) { await esperar(200); w = BrowserWindow.getAllWindows()[0]; }
  if (!w) { console.log('FALLÓ: main.cjs no abrió la ventana'); app.exit(1); return; }
  const wc = w.webContents;
  wc.on('console-message', (e) => {
    const m = String(e.message);
    if (!(e.level === 'error' || /Uncaught/.test(m)) || /Security|GL_INVALID|PCF|Autofill|AudioContext|favicon|Not allowed to load local resource|Not allowed to navigate top frame to data URL|pointer lock|Pointer Lock|requestPointerLock/i.test(m)) return;
    errores.push(m.slice(0, 400));
  });
  wc.on('render-process-gone', (_e, d) => errores.push('se cayó la página: ' + JSON.stringify(d)));
  let segundaAviso = 0;
  app.on('second-instance', () => { segundaAviso++; });
  const js = (c, gesto = false) => Promise.race([wc.executeJavaScript(c, gesto), esperar(60000).then(() => { throw new Error('la página no respondió en 60 s'); })]);
  const H = 'window.__hojarasca';
  const index = path.join(raiz, 'index.html');
  const listo = async () => { for (let i = 0; i < 180; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador)`).catch(() => false)) return true; } return false; };
  const cargar = async (busqueda = '?debug=1') => { await wc.loadFile(index, { search: busqueda }).catch(() => {}); return listo(); };
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`, true); await esperar(2500); await js(`${H}.volverAlJuego(); ${H}.ajustes.limiteFps = 'libre'; 1`, true); };
  const modo = () => js(`(()=>{ const v = (id) => !document.getElementById(id).classList.contains('oculto'); return v('pausa') ? 'pausa' : v('inicio') ? 'inicio' : 'jugando' })()`);
  const marcar = () => js('window.__marca354 = 7; 1');
  const marca = () => js('window.__marca354 === 7').catch(() => false);
  const archivo = (u) => decodeURIComponent(String(u).replace(/^.*\//, ''));
  const guardado = () => js(`(()=>{ try { return JSON.parse(localStorage.getItem('hojarasca-v1') || '{}').ramitas } catch { return null } })()`);
  const registro = () => { try { return fs.readFileSync(path.join(perfil, 'logs', 'hojarasca-crash.log'), 'utf8'); } catch { return ''; } };

  try {
    // esperar la carga de main.cjs antes de pedir la nuestra (si no, se pisan)
    for (let i = 0; i < 150 && (wc.isLoading() || !wc.getURL()); i++) await esperar(200);
    await esperar(500);
    seccion('arranque como el instalador');
    ok(Menu.getApplicationMenu() === null && BrowserWindow.getAllWindows().length === 1, 'una ventana y sin menú (3.5.3)');
    ok(await cargar(), 'carga el juego');
    await js(`localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'baja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false })); 1`);
    ok(await cargar(), 'con calidad baja');
    await entrar();
    ok(await modo() === 'jugando', 'adentro de la partida');

    // ------------------------------------------------------------ 1. navegación
    seccion('la ventana sólo navega al juego');
    const txt = path.join(perfil, 'nota de prueba.txt'); fs.writeFileSync(txt, 'hola');
    for (const [que, destino] of [['un archivo de la compu', 'file:///' + txt.replace(/\\/g, '/')], ['una página de internet', 'https://example.com/'], ['un data:', 'data:text/html,hola']]) {
      await marcar();
      await js(`location.href = ${JSON.stringify(destino)}; 1`).catch(() => {});
      await esperar(1500);
      ok(/index\.html/.test(wc.getURL()) && await marca(), `location.href a ${que}: el juego sigue ahí (${archivo(wc.getURL())})`);
    }
    ok(/ventana: navegación bloqueada: file:/.test(registro()), 'y queda anotado en logs/hojarasca-crash.log');
    // las recargas propias del juego (cambiar calidad, otra partida, recuperación de la placa)
    await marcar();
    await js('location.reload(); 1').catch(() => {});
    await esperar(1500);
    ok(await listo() && !(await marca()), 'location.reload() del juego sigue andando');
    await js(`(()=>{ const u = new URL(location.href); u.searchParams.set('recuperado', 'graficos'); location.replace(u.toString()); return 1 })()`).catch(() => {});
    await esperar(1500);
    ok(await listo() && /recuperado=graficos/.test(wc.getURL()), `y la recarga por la placa (${archivo(wc.getURL())})`);
    await wc.loadFile(index, { search: '?debug=1&recuperado=caida' }).catch(() => {});   // como recuperacion-main.cjs
    await listo();
    ok(!wc.navigationHistory.canGoBack(), `sin historial después de una recuperación (${wc.navigationHistory.length()} entrada)`);
    await marcar();
    await js('history.back(); 1').catch(() => {});
    await esperar(1500);
    ok(await marca() && /recuperado=caida/.test(wc.getURL()), '"atrás" no vuelve a abrir un juego viejo');
    await entrar();

    // ------------------------------------------------------------ 2. soltar archivos
    seccion('soltar archivos sobre la ventana');
    const prefs = wc.getLastWebPreferences() || {};
    ok(!prefs.navigateOnDragDrop, `Electron no navega con lo soltado (navigateOnDragDrop: ${prefs.navigateOnDragDrop})`);
    let e = await js(`(()=>{ const dt = new DataTransfer(); dt.items.add(new File(['hola'], 'nota.txt', { type: 'text/plain' }));
      const ov = new DragEvent('dragover', { cancelable: true, bubbles: true, dataTransfer: dt }); document.body.dispatchEvent(ov);
      const dr = new DragEvent('drop', { cancelable: true, bubbles: true, dataTransfer: dt }); document.body.dispatchEvent(dr);
      return { arrastre: ov.defaultPrevented, efecto: dt.dropEffect, suelta: dr.defaultPrevented } })()`);
    ok(e.arrastre && e.efecto === 'none' && e.suelta, `la página no acepta archivos (${JSON.stringify(e)})`);
    await marcar();
    try {
      wc.debugger.attach('1.3');
      const data = { items: [], files: [txt], dragOperationsMask: 1 };
      for (const type of ['dragEnter', 'dragOver', 'drop']) await wc.debugger.sendCommand('Input.dispatchDragEvent', { type, x: 400, y: 300, data });
      wc.debugger.detach();
    } catch (err) { nota(`arrastre por el depurador: ${err.message}`); }
    await esperar(1500);
    ok(await marca() && /index\.html/.test(wc.getURL()), 'un archivo soltado (arrastre del navegador) no saca al juego');

    // ------------------------------------------------------------ 3. Alt+Espacio
    seccion('Alt+Espacio');
    await js(`${H}.volverAlJuego(); 1`, true);
    e = await js(`(()=>{ const j = ${H}.jugador.estado; j.saltoPedido = 0;
      const a = new KeyboardEvent('keydown', { code: 'Space', key: ' ', altKey: true, bubbles: true, cancelable: true }); document.dispatchEvent(a);
      document.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', altKey: true, bubbles: true }));
      const salto = j.saltoPedido; j.saltoPedido = 0;
      const b = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true, cancelable: true }); document.dispatchEvent(b);
      document.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
      return { conAlt: a.defaultPrevented, salto, sinAlt: b.defaultPrevented } })()`);
    ok(e.conAlt, 'Alt+Espacio no le llega a Windows (no abre el menú de la ventana, donde C es "Cerrar")');
    ok(e.salto > 0, `pero el juego lo recibe (salto pedido ${e.salto})`);
    ok(!e.sinAlt, 'el Espacio solo no se toca');

    // ------------------------------------------------------------ 4. teclas del navegador
    seccion('teclas de navegador y zoom');
    await js(`(()=>{ window.__vistas354 = []; document.addEventListener('keydown', (ev) => window.__vistas354.push(ev.code), true); return 1 })()`);
    w.focus(); wc.focus(); await esperar(400);
    wc.sendInputEvent({ type: 'keyDown', keyCode: 'B' }); wc.sendInputEvent({ type: 'keyUp', keyCode: 'B' });
    await esperar(400);
    const llegan = (await js('window.__vistas354.slice()')).includes('KeyB');
    if (!llegan) nota('la ventana no tiene el foco (el escritorio está en uso): las teclas de verdad no llegan y esta parte no se prueba');
    else {
      const malos = [];
      for (const [k, mods] of [['F5', []], ['F5', ['control']], ['R', ['control', 'shift']], ['R', ['control']], ['I', ['control', 'shift']], ['F12', []], ['W', ['control']], ['M', ['control']], ['Q', ['control']], ['F4', ['control']]]) {
        await marcar();
        w.focus(); wc.focus();
        wc.sendInputEvent({ type: 'keyDown', keyCode: k, modifiers: mods }); wc.sendInputEvent({ type: 'keyUp', keyCode: k, modifiers: mods });
        await esperar(900);
        if (w.isDestroyed()) { ok(false, `${[...mods, k].join('+')} cerró la ventana`); throw new Error('ventana cerrada'); }
        const que = [];
        // (con el escritorio en uso, algo de afuera puede minimizarla: en esta PC llega un
        // WM_APPCOMMAND y se minimiza aunque no se toque ninguna tecla. Se repite la tecla hasta
        // tres veces: falla sólo si la minimiza todas las veces)
        for (let intento = 0; intento < 3 && w.isMinimized(); intento++) {
          w.restore(); await esperar(600); w.focus(); wc.focus();
          wc.sendInputEvent({ type: 'keyDown', keyCode: k, modifiers: mods }); wc.sendInputEvent({ type: 'keyUp', keyCode: k, modifiers: mods });
          await esperar(900);
          if (!w.isMinimized()) nota(`${[...mods, k].join('+')}: la ventana se minimizó desde afuera; repetida, la tecla no la minimiza`);
        }
        if (w.isMinimized()) { que.push('minimizó'); w.restore(); }
        if (wc.isDevToolsOpened()) { que.push('abrió las herramientas'); wc.closeDevTools(); }
        if (!(await marca())) { que.push('recargó'); await listo(); }
        if (que.length) malos.push(`${[...mods, k].join('+')}: ${que.join(', ')}`);
        // F5 abre Personalizar adentro del juego: se cierra para la próxima
        await js(`(()=>{ if (!document.getElementById('personalizar')?.classList.contains('oculto')) document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })); return 1 })()`).catch(() => {});
      }
      ok(malos.length === 0, `ninguna cierra, recarga, minimiza ni abre nada (${malos.join(' · ') || 'F5, Ctrl+F5, Ctrl+Shift+R, Ctrl+R, Ctrl+Shift+I, F12, Ctrl+W, Ctrl+M, Ctrl+Q, Ctrl+F4'})`);
      for (let i = 0; i < 3; i++) wc.sendInputEvent({ type: 'mouseWheel', x: 400, y: 300, deltaY: 120, wheelTicksY: 1, modifiers: ['control'], canScroll: true });
      for (const k of ['=', 'Plus', '-', 'numadd', 'numsub', '0']) { wc.sendInputEvent({ type: 'keyDown', keyCode: k, modifiers: ['control'] }); wc.sendInputEvent({ type: 'keyUp', keyCode: k, modifiers: ['control'] }); }
      await esperar(600);
      ok(wc.getZoomFactor() === 1 && await js('visualViewport.scale') === 1, `Ctrl+rueda y Ctrl+Más/Menos/0 no agrandan la página (zoom ${wc.getZoomFactor()})`);
    }

    // ------------------------------------------------------------ 5. teclas pegadas y foco
    seccion('perder el foco');
    // jugando sin el mouse bloqueado (como cuando el bloqueo falló al volver con Esc)
    await js(`(()=>{ window.__rplOrig = HTMLElement.prototype.requestPointerLock; HTMLElement.prototype.requestPointerLock = function () { return Promise.resolve(); }; ${H}.jugador.soltar(); return 1 })()`);
    await esperar(400);
    await js(`${H}.volverAlJuego(); HTMLElement.prototype.requestPointerLock = window.__rplOrig; 1`); await esperar(300);
    ok(await modo() === 'jugando' && !(await js('!!document.pointerLockElement')), 'jugando sin el mouse bloqueado');
    e = await js(`(()=>{ const t = ${H}.jugador.teclas; for (const c of ['KeyW', 'ShiftLeft']) document.dispatchEvent(new KeyboardEvent('keydown', { code: c, bubbles: true }));
      const antes = [...t].join(','); window.dispatchEvent(new Event('blur'));
      return { antes, despues: [...t].join(','), lock: !!document.pointerLockElement } })()`);
    ok(e.antes.includes('KeyW') && e.antes.includes('ShiftLeft') && e.despues === '', `al perder el foco se sueltan W y Shift (${e.antes} → "${e.despues}")`);
    ok(await modo() === 'pausa', 'y sin el mouse bloqueado igual se pausa (antes la partida seguía sola)');
    if (w.isFocused()) {
      await js(`${H}.volverAlJuego(); 1`, true); await esperar(500);
      w.focus(); wc.focus();
      wc.sendInputEvent({ type: 'keyDown', keyCode: 'W' });
      await esperar(200);
      const otra = new BrowserWindow({ width: 320, height: 200, show: true });
      otra.focus(); await esperar(900);
      e = await js(`({ teclas: [...${H}.jugador.teclas].join(','), foco: document.hasFocus() })`);
      ok(!e.foco && e.teclas === '' && await modo() === 'pausa', `de verdad: otra ventana encima suelta las teclas y pausa (${JSON.stringify(e)})`);
      otra.destroy();
    } else nota('la ventana no tiene el foco: la prueba con otra ventana de verdad encima no se hace');

    // ------------------------------------------------------------ 6. el bloqueo del mouse
    seccion('el bloqueo del mouse que falla');
    await esperar(5500);   // que venza el gesto de la última vez
    await js(`(()=>{ window.__rplOrig = HTMLElement.prototype.requestPointerLock; window.__focoOrig = document.hasFocus;
      HTMLElement.prototype.requestPointerLock = function () { setTimeout(() => document.dispatchEvent(new Event('pointerlockerror')), 0); return Promise.reject(new DOMException('no', 'NotAllowedError')); };
      document.hasFocus = () => true; return 1 })()`);
    for (let i = 0; i < 4; i++) { await js(`${H}.jugador.pedirBloqueo(); 1`, false); await esperar(150); }
    ok(await js(`${H}.jugador.bloqueado()`) === false, 'cuatro pedidos sin gesto (Esc para volver) que fallan: no pasa a "arrastrar para mirar"');
    await js(`(()=>{ document.hasFocus = () => false; return 1 })()`);
    for (let i = 0; i < 4; i++) { await js(`${H}.jugador.pedirBloqueo(); 1`, true); await esperar(150); }
    ok(await js(`${H}.jugador.bloqueado()`) === false, 'cuatro con la ventana sin foco, tampoco');
    await js(`(()=>{ document.hasFocus = () => true; return 1 })()`);
    for (let i = 0; i < 3; i++) { await js(`${H}.jugador.pedirBloqueo(); 1`, true); await esperar(150); }
    ok(await js(`${H}.jugador.bloqueado()`) === true, 'donde de verdad no se puede bloquear (con foco y con clic), sí pasa a arrastrar');
    await js(`(()=>{ HTMLElement.prototype.requestPointerLock = window.__rplOrig; document.hasFocus = window.__focoOrig; return 1 })()`);
    ok(await cargar(), 'se vuelve a cargar el juego');
    await entrar();

    // ------------------------------------------------------------ 7. suspensión y sesión
    seccion('suspender, bloquear la pantalla, cerrar la sesión de Windows');
    await js(`${H}.volverAlJuego(); ${H}.progreso.ramitas = 777; 1`, true);
    powerMonitor.emit('suspend');
    await esperar(900);
    ok(await modo() === 'pausa' && await guardado() === 777, `la compu se suspende: pausa y guarda (${await guardado()})`);
    await js(`${H}.volverAlJuego(); ${H}.progreso.ramitas = 778; 1`, true);
    powerMonitor.emit('lock-screen');
    await esperar(900);
    ok(await modo() === 'pausa' && await guardado() === 778, 'se bloquea la pantalla: igual');
    await js(`${H}.volverAlJuego(); ${H}.progreso.ramitas = 779; 1`, true);
    w.emit('query-session-end', { preventDefault() {}, reasons: ['logoff'] });
    await esperar(900);
    ok(await guardado() === 779, 'Windows cierra la sesión: guarda');
    ok(/Windows cierra la sesión: se guarda/.test(registro()), 'y lo anota');
    w.emit('session-end', { preventDefault() {}, reasons: ['logoff'] });

    // ------------------------------------------------------------ 8. tamaño de la ventana
    seccion('minimizar, restaurar, pantalla completa, ventana chica');
    await js(`${H}.volverAlJuego(); 1`, true);
    const medida = () => js(`(()=>{ const r = ${H}.renderer, c = ${H}.camara, v = new ${H}.THREE.Vector3(); r.getSize(v); for (let i = 0; i < 3; i++) ${H}.__bucle();
      return { w: innerWidth, h: innerHeight, rw: v.x, rh: v.y, aspecto: c.aspect, cuadro: r.info.render.frame } })()`);
    const bien = (m) => m.w > 0 && m.h > 0 && Number.isFinite(m.aspecto) && Math.abs(m.aspecto - m.w / m.h) < 0.01 && m.rw === m.w && m.rh === m.h;
    const m0 = await medida();
    w.minimize(); await esperar(1200);
    const mMin = await medida();
    w.restore(); await esperar(1200);
    const m1 = await medida();
    ok(bien(mMin) && bien(m1) && m1.cuadro > m0.cuadro, `minimizar y restaurar (${m0.w}×${m0.h} → ${mMin.w}×${mMin.h} → ${m1.w}×${m1.h}, sigue dibujando)`);
    w.setFullScreen(true); await esperar(1500);
    const mF = await medida();
    w.setFullScreen(false); await esperar(1500);
    const m2 = await medida();
    ok(bien(mF) && bien(m2), `pantalla completa y vuelta (${mF.w}×${mF.h} → ${m2.w}×${m2.h})`);
    w.setSize(200, 100); await esperar(900);
    const [ancho, alto] = w.getSize();
    const m3 = await medida();
    ok(ancho >= 1024 && alto >= 640 && bien(m3), `la ventana no se achica de más (${ancho}×${alto})`);
    w.setSize(1280, 760); await esperar(600);

    // ------------------------------------------------------------ 9. abrir el juego otra vez
    seccion('abrir el juego otra vez');
    const electron = require(path.join(raiz, 'node_modules', 'electron'));
    const t0 = Date.now();
    const salida = await new Promise((listo2) => {
      let texto = '';
      // (con los mismos -r <precarga> con que se lanzó esta prueba, p. ej. la que la manda a otro monitor)
      const precargas = [];
      process.argv.forEach((a, i) => { if ((a === '-r' || a === '--require') && process.argv[i + 1]) precargas.push(a, process.argv[i + 1]); });
      const p = spawn(electron, ['--no-sandbox', ...precargas, __filename], { env: { ...process.env, HUMO_354_SEGUNDA: '1', HUMO_354_PERFIL: perfil }, stdio: ['ignore', 'pipe', 'pipe'] });
      p.stdout.on('data', (d) => { texto += d; });
      p.on('exit', (codigo) => listo2({ codigo, texto, ms: Date.now() - t0 }));
    });
    await esperar(500);
    ok(salida.codigo === 0 && !/SEGUNDA: ventana creada|sigue viva/.test(salida.texto), `la segunda copia se va sin abrir ventana (en ${salida.ms} ms${salida.texto.trim() ? ': ' + salida.texto.trim() : ''})`);
    ok(segundaAviso === 1 && BrowserWindow.getAllWindows().length === 1, 'y la primera se entera (para traerse al frente) y sigue sola');
    ok(!w.isMinimized() && w.isVisible(), 'la ventana del juego queda a la vista');

    // ------------------------------------------------------------ 10. cerrar la ventana
    seccion('cerrar la ventana (la X o Alt+F4)');
    await js(`${H}.volverAlJuego(); ${H}.progreso.ramitas = 4321; 1`, true);
    let saliendo = 0;
    app.on('before-quit', (ev) => { saliendo++; ev.preventDefault(); });   // la prueba sigue para mirar lo guardado
    w.close();
    for (let i = 0; i < 40 && !w.isDestroyed(); i++) await esperar(250);
    ok(w.isDestroyed(), 'la ventana se cierra sin colgarse');
    ok(saliendo >= 1, 'y el juego sale (sin ventanas)');
    const lector = new BrowserWindow({ show: false, webPreferences: { backgroundThrottling: false } });
    const pagina = path.join(perfil, 'leer.html'); fs.writeFileSync(pagina, '<!doctype html><title>leer</title>');
    await lector.loadFile(pagina);
    const r = await lector.webContents.executeJavaScript(`(()=>{ try { return JSON.parse(localStorage.getItem('hojarasca-v1') || '{}').ramitas } catch { return null } })()`);
    ok(r === 4321, `lo último quedó guardado al cerrar (${r})`);
  } catch (err) {
    errores.push('excepción: ' + (err && err.stack ? err.stack : err));
  }
  // lo que el juego anotó como error (con la pila) antes de borrar el perfil
  const errJs = registro().split(/\n(?=\[\d{4}-)/).filter((x) => /\] javascript: /.test(x));
  for (const l of errJs) console.log('  registro: ' + l.slice(0, 1500));
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* Windows lo suelta después */ }
  const malos = pasos.filter((p) => p.startsWith('✗')).length;
  if (errores.length) { console.log(`\nFALLÓ (${malos} de ${pasos.length}):\n- ` + [...new Set(errores)].join('\n- ')); app.exit(1); return; }
  console.log(`\nOK 3.5.4 ventana · ${pasos.length} pasos`);
  app.exit(0);
}
