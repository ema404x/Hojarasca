// Partida real 4.0.5 (Electron + WebGL) con un MANDO SIMULADO (navigator.getGamepads falso): A3 y G8 de la 4.0.3.
//  · A3: la carta de la cantina y la de la casa de té (marcar con la cruceta, saltar de parte con LB y RB, elegir con A, forma de pago, B para cerrar)
//    y el mostrador del banco (las cuatro solapas con LB y RB, plazos, montos, pagar, puesto propio, B para salir). La lista se desplaza: lo marcado siempre se ve.
//  · G8: un mando sin mapeo estándar (un volante, un joystick de vuelo) no genera entradas: ni en la portada ni jugando; se avisa y se sigue con teclado y ratón.
// Uso (después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-0-4-mando-cartas.cjs    (capturas en HOJ_SALIDA o salida-cantina\mando)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/Documents/Hojarasca/salida-cantina/mando';
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa): ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); salir(2); }, 14 * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 400));
  });
  w.focus();
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 120 s')), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push('FALLÓ: ' + texto); };
  const H = 'window.__hojarasca';
  const url = path.join(raiz, 'index.html');
  const foto = async (nombre) => {
    await esperar(250);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log(`  (captura ${nombre}.png)`);
  };
  const cuadro = (n = 1) => js(`(() => { for (let i = 0; i < ${n}; i++) { ${H}.__bucle(); } return 1 })()`);
  const A = 0, B = 1, X = 2, LB = 4, RB = 5, START = 9, ARRIBA = 12, ABAJO = 13, IZQ = 14, DER = 15;
  // el mando de mentira: estándar, o sin mapeo estándar (`estandar=false`)
  const instalarMando = (estandar = true) => js(`(() => {
    const pad = { id: ${estandar ? "'Mando de prueba (STANDARD GAMEPAD)'" : "'Volante de carrera (Vendor: 046d Product: c262)'"}, connected: true, mapping: ${estandar ? "'standard'" : "''"}, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    window.__pad = pad; navigator.getGamepads = () => [pad];
    window.__apretar = (i, mantener = 0) => { pad.buttons[i] = { pressed: true, value: 1 }; ${H}.__bucle(); for (let k = 0; k < mantener; k++) ${H}.__bucle(); pad.buttons[i] = { pressed: false, value: 0 }; ${H}.__bucle(); };
    ${H}.__bucle(); return 1; })()`);
  const apretar = (i, mantener = 0) => js(`window.__apretar(${i}, ${mantener}); 1`);
  const foco = () => js(`(() => { const e = document.querySelector('.foco-mando'); return e ? (e.textContent || '').trim() : ''; })()`);
  // ¿lo marcado se ve dentro del panel (que se desplaza)?
  const marcadoSeVe = () => js(`(() => { const e = document.querySelector('.foco-mando'); if (!e) return false; const p = e.closest('.panel-modal').getBoundingClientRect(), r = e.getBoundingClientRect(); return r.top >= p.top - 1 && r.bottom <= p.bottom + 1; })()`);
  const tec = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }));`;
  const pesos = () => js(`${H}.progreso.economia.pesos`);
  const estadoDe = (Q) => js(`${H}.${Q}().estado()`);
  const hasta = async (Q, cond, ms = 40000, cada = 40) => {
    const t0 = Date.now();
    let e = await estadoDe(Q);
    while (!cond(e) && Date.now() - t0 < ms) { await cuadro(1); await esperar(cada); e = await estadoDe(Q); }
    return e;
  };
  const armarMundo = async (n = 4) => { for (let k = 0; k < n; k++) { await js(`(async () => { const M = ${H}.__aldeaMundo(); M.actualizar(4, ${H}.camara.position); await M.listo(); M.montarCola(); return 1 })()`); await esperar(150); } };
  const sentar = (Q, mesa, i, alto = 0.04) => js(`(() => { const H = ${H}, c = H.${Q}(), s = c.lugar.sillas.find((x) => x.mesa.id === '${mesa}' && x.i === ${i}), js = H.jugador.estado;
      H.jugador.ubicar(s.x, s.z, s.mira + Math.PI); js.pos.set(s.x, c.lugar.pisoY() + ${alto}, s.z); js.entumecido = 4; js.descansado = 0; H.jugador.sentarse(true); js.yaw = s.mira + Math.PI; js.pitch = -0.1; return 1 })()`);
  const ajustes = (calidad) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'invierno'})); 1`;

  try {
    // ================================================================= G8 en la portada: un volante no genera entradas fantasma
    await w.loadFile(url, { search: '?debug=1' });
    await js(ajustes('baja'));
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.__cantina && ${H}.__te && ${H}.__bucle)`).catch(() => false)) break; }
    ok(await js(`!!${H}.__te()`), 'el juego cargó (cantina y casa de té armadas)');
    console.log('— G8: un mando sin mapeo estándar');
    await instalarMando(false);
    // el volante en reposo marca -1 en un eje y tiene el botón 0 apretado: con el mapeo estándar sería «A» y un stick a fondo
    await js(`(() => { const p = window.__pad; p.axes = [0, -1, 0, -1]; p.buttons[0] = { pressed: true, value: 1 }; p.buttons[9] = { pressed: true, value: 1 }; return 1 })()`);
    await cuadro(6);
    ok(!(await js(`document.body.classList.contains('con-mando')`)), 'el juego NO toma el volante como mando (no hay clase con-mando)');
    ok(await js(`!document.getElementById('inicio').classList.contains('oculto')`), 'la portada sigue ahí: la A del volante no entró al bosque');
    ok((await foco()) === '', 'ningún botón de la portada quedó marcado por la cruceta fantasma');
    const avisoIgn = await js(`(document.getElementById('notas') || document.body).textContent`);
    ok(/no se puede usar|mapeo estándar/i.test(avisoIgn), 'se avisó una vez que ese mando no se usa');
    ok(await js(`${H}.__aldea !== undefined && !!document.getElementById('btn-entrar')`), 'y el ratón y el teclado siguen (se entra con el botón)');
    await foto('g8-portada-volante');
    // con el teclado se entra normalmente
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; 1`);
    await cuadro(10);
    ok(await js(`document.getElementById('inicio').classList.contains('oculto')`), 'se entró al juego con el ratón');
    const walk = await js(`(() => { const t = ${H}.jugador.teclas; return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Escape'].filter((k) => t.has(k)); })()`);
    ok(walk.length === 0, `jugando con el volante enchufado, el stick fantasma no camina ni salta (teclas: ${JSON.stringify(walk)})`);
    ok(await js(`document.getElementById('pausa').classList.contains('oculto')`), 'y su botón Start fantasma no abrió la pausa');
    // un mando estándar a la vez que el volante: gana el estándar
    await js(`(() => { const est = { id: 'Mando de prueba (STANDARD GAMEPAD)', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; window.__pad2 = est; navigator.getGamepads = () => [window.__pad, est]; return 1; })()`);
    await js(`window.__pad.buttons[0] = { pressed: false, value: 0 }; window.__pad.buttons[9] = { pressed: false, value: 0 }; window.__pad.axes = [0,0,0,0]; 1`);
    await cuadro(3);
    ok(await js(`document.body.classList.contains('con-mando')`), 'con un mando estándar al lado, se usa ese');
    await js(`navigator.getGamepads = () => []; 1`); await cuadro(3);

    // ================================================================= A3: la carta de la cantina
    console.log('— A3: la carta de la cantina');
    await instalarMando(true);
    await js(`(() => { const P = ${H}.progreso; P.aldea.descubierta = 1; P.economia.pesos = 9000; P.materiales.tronco = 5; P.dia = 10; P.horas = 20.4; ${H}.clima.estado.nublado = 0.2; return 1 })()`);
    await js(`(async () => { await ${H}.__aldeaMundo().listo(); ${H}.__aldeaMundo().montarCola(); return 1 })()`);
    await js(`(() => { const H = ${H}, e = H.__aldea.edificio('cantina'); H.jugador.ubicar(e.x + 6, e.z + 10, 0); for (let i = 0; i < 10; i++) { H.__aldea.actualizar(0.6); H.__aldea.mundo().prearmar(1e6); } return 1 })()`);
    await armarMundo(5);
    for (const d of [10, 11, 12, 21, 22, 23, 24, 33, 34, 35, 36]) {
      await js(`(() => { ${H}.progreso.dia = ${d}; ${H}.progreso.horas = 20.4; for (let i = 0; i < 4; i++) { ${H}.__aldea.actualizar(0.6); } return 1 })()`);
      const donde = await js(`(() => { const st = ${H}.__aldea.mundo().personas.get('moza'); return st && st.destino ? st.destino.edificio : null })()`);
      if (donde === 'cantina') break;
    }
    for (let k = 0; k < 30; k++) { await js(`(() => { ${H}.__aldea.actualizar(0.5); ${H}.__aldea.mundo().prearmar(1e6); ${H}.__bucle(); return 1 })()`); await esperar(30); }
    await sentar('__cantina', 'mesa-3', 0, 0.04);
    let est = await hasta('__cantina', (x) => !!x.ses && x.ses.fase === 'carta' && x.panel.abierto, 60000);
    if (!est.panel.abierto) { await js(`${H}.__cantina().llamar(); 1`); est = await hasta('__cantina', (x) => x.ses?.fase === 'carta' && x.panel.abierto, 60000); }
    ok(est.ses?.fase === 'carta' && est.panel.abierto, `la moza trajo la carta (fase ${est.ses?.fase})`);
    await cuadro(2);
    const nPlatos = await js(`document.querySelectorAll('#cantina-contenido .cantina-plato').length`);
    ok(nPlatos >= 15, `la carta de la cantina tiene ${nPlatos} platos`);
    ok(await js(`!!document.querySelector('#cantina-carta .foco-mando')`), 'al abrir la carta ya queda un plato marcado (el marco amarillo)');
    ok((await js(`document.querySelector('#cantina-carta .seguir').textContent`)).includes('Cruceta'), 'el pie de la carta habla del mando, no de la tecla E');
    const pos0 = await js(`(() => { const j = ${H}.jugador.estado; return [j.pos.x, j.pos.z].map((v) => +v.toFixed(3)); })()`);
    await foto('1-cantina-carta-mando');
    // bajar plato por plato: lo marcado siempre se ve (la lista se desplaza) y el stick no mueve a nadie. Primero en una ventana chica (donde la lista SÍ se desplaza), después en la grande
    const scrollDe = () => js(`document.querySelector('#cantina-carta .panel-modal').scrollTop`);
    for (const [ancho, alto, etiqueta] of [[1280, 560, 'ventana chica'], [1600, 900, 'ventana grande']]) {
      await w.setContentSize(ancho, alto); await esperar(500); await cuadro(3);
      let siempreSeVe = true, maxScroll = 0; const vistos = new Set();
      for (let i = 0; i < nPlatos + 5; i++) { await apretar(ABAJO); vistos.add(await foco()); maxScroll = Math.max(maxScroll, await scrollDe()); if (!(await marcadoSeVe())) { siempreSeVe = false; console.log('  no se ve:', await foco()); } if (i === 9) await foto(`2-cantina-carta-abajo-${ancho}`); }
      ok(siempreSeVe, `(${etiqueta}) bajando por toda la carta, el plato marcado siempre queda dentro de la vista`);
      ok(vistos.size >= nPlatos, `(${etiqueta}) se pasó por los ${nPlatos} platos y los botones de abajo (${vistos.size} distintos)`);
      if (ancho < 1500) ok(maxScroll > 0, `(${etiqueta}) la lista se desplazó (hasta ${Math.round(maxScroll)} px)`);
      // subiendo también
      let veAlSubir = true; for (let i = 0; i < nPlatos + 5; i++) { await apretar(ARRIBA); if (!(await marcadoSeVe())) veAlSubir = false; }
      ok(veAlSubir, `(${etiqueta}) y subiendo también se ve lo marcado`);
    }
    // LB y RB: de una parte de la carta a la otra
    const platosOrden = await js(`[...document.querySelectorAll('#cantina-contenido .cantina-plato')].map((b) => b.textContent)`);
    const comerIdx = await js(`(() => { const h = [...document.querySelectorAll('#cantina-contenido .cantina-grupo')]; return h.map((x) => x.textContent); })()`);
    console.log('  partes de la carta:', JSON.stringify(comerIdx));
    // saltar hasta el primer plato (por la cruceta hacia arriba los platos) y probar RB
    for (let i = 0; i < nPlatos + 6; i++) { if ((await foco()) === platosOrden[0]) break; await apretar(ARRIBA); }
    ok((await foco()) === platosOrden[0], `la cruceta hacia arriba vuelve al primer plato (${platosOrden[0]})`);
    await apretar(RB);
    const trasRB = await foco();
    ok(trasRB !== platosOrden[0] && platosOrden.includes(trasRB), `RB salta a la parte siguiente de la carta (${trasRB})`);
    ok(await marcadoSeVe(), 'y se ve');
    await apretar(LB);
    ok((await foco()) === platosOrden[0], 'LB vuelve al principio de la carta');
    // A en un plato: se despliegan las formas de pago y el marco se queda en el mismo plato
    await apretar(ABAJO); await apretar(ABAJO);
    const plato = await foco();
    await apretar(A);
    ok((await foco()) === plato, `A en «${plato}» despliega el pago y el marco sigue en ese plato`);
    ok(await js(`document.querySelectorAll('#cantina-contenido .cantina-pagos button').length >= 4`), 'aparecen las formas de pago (pesos, trueque, a la cuenta) junto a los botones de abajo');
    await foto('3-cantina-forma-de-pago');
    await apretar(ABAJO);
    const f1 = await foco();
    ok(/Pagar|\$/.test(f1), `abajo cae en la primera forma de pago («${f1}»)`);
    await apretar(DER);
    const f2 = await foco();
    ok(f2 !== f1 && f2 !== '', `a la derecha pasa a la siguiente forma («${f2}»)`);
    await apretar(DER);
    const f3 = await foco();
    ok(f3 !== f2 && f3 !== '', `y a la siguiente («${f3}»)`);
    await foto('4-cantina-pago-cuenta-marcado');
    await apretar(IZQ); await apretar(IZQ);
    ok((await foco()) === f1, 'a la izquierda vuelve a pesos');
    // pagar con pesos (A): se cobra y la carta se cierra, la moza toma el pedido
    const antesPesos = await pesos();
    await apretar(A);
    est = await estadoDe('__cantina');
    const despues = await pesos();
    ok(despues < antesPesos, `A en «${f1}» pagó con pesos ($${antesPesos} → $${despues})`);
    ok(!est.panel.abierto && !!est.ses?.orden, 'la carta se cerró y el pedido quedó tomado');
    ok(await js(`document.querySelector('.foco-mando') === null || document.querySelector('#cantina-carta').classList.contains('oculto')`), 'y el panel oculto no deja un marco colgado a la vista');
    const pos1 = await js(`(() => { const j = ${H}.jugador.estado; return [j.pos.x, j.pos.z].map((v) => +v.toFixed(3)); })()`);
    ok(Math.hypot(pos1[0] - pos0[0], pos1[1] - pos0[1]) < 0.05, 'el jugador seguía sentado (no se movió con la cruceta ni el stick)');
    // B cierra la carta sin pedir: se llama otra vez, se abre y B la cierra
    est = await hasta('__cantina', (x) => x.servidos.length > 0 || x.ses?.fase === 'libre', 90000);
    await js(`${H}.__cantina().llamar(); 1`);
    est = await hasta('__cantina', (x) => x.ses?.fase === 'carta' && x.panel.abierto, 60000);
    const antes2 = await pesos();
    await cuadro(2);
    await apretar(B);
    est = await estadoDe('__cantina');
    ok(!est.panel.abierto && (await pesos()) === antes2, 'B cierra la carta sin cobrar nada');
    // Start también cierra; X (como E) también
    await js(`${H}.__cantina().llamar(); 1`);
    est = await hasta('__cantina', (x) => x.ses?.fase === 'carta' && x.panel.abierto, 60000);
    await cuadro(2); await apretar(START);
    ok(!(await estadoDe('__cantina')).panel.abierto, 'Start también cierra la carta');
    // la cuenta: pedir a la cuenta con A y saldarla con el mando
    est = await estadoDe('__cantina');
    await js(`(() => { const c = ${H}.__cantina(), it = c.cartaHoy()[0]; return c.pedirItem(it, { medio: 'cuenta' }) })()`);
    est = await hasta('__cantina', (x) => x.servidos.length > 0 || x.ses?.fase === 'libre', 90000);
    await js(`${H}.__cantina().llamar(); 1`);
    est = await hasta('__cantina', (x) => x.ses?.fase === 'carta' && x.panel.abierto, 60000);
    await cuadro(2);
    ok(await js(`!!document.querySelector('#cantina-contenido .cantina-cuenta')`), 'con una cuenta anotada la carta muestra «Tu cuenta»');
    await apretar(RB); await apretar(RB); await apretar(RB);
    const enCuenta = await foco();
    console.log('  tras RB x3:', enCuenta);
    // por la cruceta se llega siempre a «Saldar»
    for (let i = 0; i < 60 && !/Saldar con \$/.test(await foco()); i++) await apretar(ABAJO);
    ok(/Saldar con \$/.test(await foco()), `la cruceta llega a «${await foco()}»`);
    await foto('5-cantina-cuenta-saldar');
    const debe = await js(`${H}.progreso.cantina.cuenta?.monto || 0`);
    await apretar(A);
    ok((await js(`${H}.progreso.cantina.cuenta?.monto || 0`)) === 0 && debe > 0, `A salda la cuenta ($${debe})`);
    await apretar(B);
    ok(!(await estadoDe('__cantina')).panel.abierto, 'B cierra la carta');
    await js(`${tec('KeyR')} 1`); await cuadro(3);

    // ================================================================= A3: la carta de la casa de té
    console.log('— A3: la carta de la casa de té');
    await js(`(() => { const H = ${H}, e = H.__aldea.edificio('casa-te'); H.progreso.horas = 15.8; H.jugador.ubicar(e.x + 2, e.z + 9, 0); for (let i = 0; i < 10; i++) { H.__aldea.actualizar(0.6); H.__aldea.mundo().prearmar(1e6); } return 1 })()`);
    await armarMundo(5);
    for (const d of [10, 11, 12, 21, 22, 23, 24, 33, 34, 35, 36]) {
      await js(`(() => { ${H}.progreso.dia = ${d}; ${H}.progreso.horas = 15.8; for (let i = 0; i < 5; i++) { ${H}.__aldea.actualizar(0.6); } return 1 })()`);
      const donde = await js(`(() => { const st = ${H}.__aldea.mundo().personas.get('galesa'); return st && st.destino ? st.destino.edificio : null })()`);
      if (donde === 'casa-te') break;
    }
    for (let k = 0; k < 40; k++) { await js(`(() => { ${H}.__aldea.actualizar(0.5); ${H}.__bucle(); return 1 })()`); await esperar(30); }
    await sentar('__te', 'mesa-1', 0, 0.0);
    est = await hasta('__te', (x) => x.ses?.fase === 'carta' && x.panel.abierto, 60000);
    ok(est.ses?.fase === 'carta' && est.panel.abierto, 'Ceinwen trajo la carta de tés');
    await cuadro(2);
    ok(await js(`!!document.querySelector('#cantina-carta .foco-mando')`), 'la carta de la casa de té también queda con un ítem marcado');
    await foto('6-te-carta-mando');
    const platosTe = await js(`[...document.querySelectorAll('#cantina-contenido .cantina-plato')].map((b) => b.textContent)`);
    await apretar(ABAJO); await apretar(ABAJO);
    const itemTe = await foco();
    ok(platosTe.includes(itemTe), `la cruceta recorre los tés y tortas («${itemTe}»)`);
    await apretar(A);
    ok((await foco()) === itemTe && (await js(`document.querySelectorAll('#cantina-contenido .cantina-pagos button').length >= 4`)), 'A despliega las formas de pago');
    await apretar(ABAJO);
    await foto('7-te-forma-de-pago');
    const antesT = await pesos();
    await apretar(A);
    est = await estadoDe('__te');
    ok((await pesos()) < antesT && !est.panel.abierto && !!est.ses?.orden, `A paga con pesos y Ceinwen toma el pedido ($${antesT} → $${await pesos()})`);
    est = await hasta('__te', (x) => x.servidos.length > 0 || x.ses?.fase === 'libre', 90000);
    await js(`${tec('KeyR')} 1`); await cuadro(3);

    // ================================================================= A3: el mostrador del banco
    console.log('— A3: el mostrador del banco');
    await js(`(() => { const H = ${H}, q = H.__aldea.puntos('banco-pueblo'); if (q && q.cliente) H.jugador.ubicar(q.cliente.x, q.cliente.z, 0); H.progreso.economia.pesos = 20000; return 1 })()`);
    await js(`${H}.__banco().abrir('prestamos'); 1`);
    await cuadro(2);
    ok(await js(`${H}.__enElBanco()`), 'el mostrador está abierto');
    ok(await js(`!!document.querySelector('#banco-pueblo .foco-mando')`), 'queda una solapa marcada al abrir');
    ok((await js(`document.querySelector('#banco-pueblo .seguir').textContent`)).includes('LB y RB'), 'el pie del banco dice los botones del mando');
    await foto('8-banco-prestamos-mando');
    const sol = async () => js(`${H}.__banco().estado.solapa`);
    ok((await sol()) === 'prestamos' && (await foco()) === 'Préstamos', 'arranca en Préstamos con esa solapa marcada');
    await apretar(RB); ok((await sol()) === 'abasto' && (await foco()) === 'Abastecimiento', `RB: Abastecimiento (marcada «${await foco()}»)`);
    await foto('9-banco-abastecimiento');
    await apretar(RB); ok((await sol()) === 'casas' && (await foco()) === 'Casas y alquiler', `RB: Casas y alquiler (marcada «${await foco()}»)`);
    await foto('10-banco-casas');
    await apretar(RB); ok((await sol()) === 'puesto' && (await foco()) === 'Mi puesto', `RB: Mi puesto (marcada «${await foco()}»)`);
    await apretar(RB); ok((await sol()) === 'prestamos', 'RB da la vuelta a Préstamos');
    await apretar(LB); ok((await sol()) === 'puesto', 'LB vuelve a Mi puesto');
    // la cruceta derecha pasa de solapa en solapa por posición también
    await apretar(LB); await apretar(LB); await apretar(LB);
    ok((await sol()) === 'prestamos', 'LB x3 vuelve a Préstamos');
    await apretar(DER);
    ok((await foco()) === 'Abastecimiento' && (await sol()) === 'prestamos', 'la cruceta derecha MARCA la solapa de al lado (no la abre)');
    await apretar(A);
    ok((await sol()) === 'abasto', 'y A la abre');
    await apretar(IZQ); await apretar(A);
    ok((await sol()) === 'prestamos', 'cruceta izquierda + A: otra vez Préstamos');
    // plazo y monto
    await apretar(ABAJO);
    const plazo = await foco();
    ok(/días/.test(plazo), `abajo de las solapas están los plazos («${plazo}»)`);
    await apretar(DER); await apretar(A);
    ok((await js(`${H}.__banco().estado.plazo`)) === 9, 'A en «9 días» cambia el plazo y el marco sigue en ese botón');
    ok(/9 días/.test(await foco()), `(marcado: «${await foco()}»)`);
    await apretar(ABAJO);
    const monto = await foco();
    ok(/\$/.test(monto), `abajo cae en los montos («${monto}»)`);
    await foto('11-banco-monto-marcado');
    const antesB = await pesos();
    await apretar(A);
    ok((await pesos()) > antesB, `A pide el préstamo ($${antesB} → $${await pesos()})`);
    ok(/Pagar|Saldar/.test(await foco()), `y el marco queda en un botón de la deuda («${await foco()}»)`);
    await foto('12-banco-deuda');
    const antesP = await pesos();
    await apretar(A);
    ok((await pesos()) < antesP, `A paga (${await foco() || 'sin marca'}): $${antesP} → $${await pesos()}`);
    // casas: poner en alquiler no se puede sin casa, pero los botones se recorren
    await js(`${H}.__banco().abrir('casas'); 1`); await cuadro(1);
    // el puesto propio
    await js(`(() => { ${H}.__banco().cerrar(); ${H}.__banco().abrir('puesto'); return 1 })()`); await cuadro(2);
    ok((await foco()) !== '', 'en Mi puesto también hay un botón marcado');
    await apretar(ABAJO);
    ok(/Comprar el puesto/.test(await foco()), `abajo de las solapas está «${await foco()}»`);
    await foto('13-banco-puesto');
    await apretar(A);
    ok(await js(`/Caja del puesto/.test(document.getElementById('banco-pueblo-contenido').textContent)`), 'A compra el puesto');
    for (let i = 0; i < 12; i++) await apretar(ABAJO);
    ok(await marcadoSeVe(), 'recorriendo el puesto lo marcado se ve');
    await foto('14-banco-puesto-comprado');
    await apretar(B);
    ok(!(await js(`${H}.__enElBanco()`)), 'B sale del mostrador');
    // Start y X también salen
    await js(`${H}.__banco().abrir('casas'); 1`); await cuadro(2); await apretar(START);
    ok(!(await js(`${H}.__enElBanco()`)), 'Start sale del mostrador');
    // sin mando, el pie vuelve a hablar del teclado
    await js(`${H}.__banco().abrir('prestamos'); 1`); await cuadro(2);
    await js(`navigator.getGamepads = () => []; 1`); await cuadro(3);
    ok((await js(`document.querySelector('#banco-pueblo .seguir').textContent`)).includes('Escape'), 'al desenchufar el mando el pie vuelve a hablar de E y Escape');
    await js(`${H}.__banco().cerrar(); 1`);
    // con el teclado, las dos cartas y el banco siguen andando igual
    await js(`${H}.__banco().abrir('prestamos'); 1`);
    await js(`${tec('Escape')} 1`);
    ok(!(await js(`${H}.__enElBanco()`)), 'con teclado, Escape sigue saliendo del mostrador');
  } catch (e) {
    console.log('ERROR: ' + (e && e.stack ? e.stack : e));
    errores.push('excepción: ' + (e && e.message));
  }
  if (errores.length) { console.log('\nERRORES:\n' + errores.join('\n')); salir(1); return; }
  console.log('\nTODO OK');
  salir(0);
});
