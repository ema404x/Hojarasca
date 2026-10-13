// Partida real 3.9.0 · LA CANTINA: el flujo entero en el juego de verdad, con capturas.
//   1. el edificio (por fuera de día y de noche, por dentro) y la moza detrás de la barra;
//   2. te sentás a una mesa: la moza te ve y VIENE CAMINANDO (no aparece), te saluda y se abre la carta;
//   3. pedís (pagando con pesos): ella vuelve a la barra, prepara, trae la bandeja caminando, la deja en la mesa y se va;
//   4. tomás de a sorbos (el vaso sube hacia la cara) y el trago fuerte te saca el frío;
//   5. un pedido de comida y otro pagado con trueque y con la cuenta; te levantás y ella levanta la mesa;
//   6. cerrada (de día), sin economía no hay nada, y la partida guardada vuelve con su cuenta.
// Uso (después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   salida-cantina\lanzar.ps1 -Script pruebas\humo-3-9-0-cantina.cjs      (las capturas, en HOJ_SALIDA o salida-cantina\partida)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/Documents/Hojarasca/salida-cantina/partida';
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa): ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); salir(2); }, 14 * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  const errores = [];
  const calidad = process.env.HOJ_CALIDAD || 'alta';
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
  const tecla = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }));`;
  const estado = () => js(`${H}.__cantina().estado()`);
  const sinHud = `(() => { let s = document.getElementById('sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'sin-hud'; document.head.appendChild(s); } s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; return 1 })()`;
  const conHud = `(() => { const s = document.getElementById('sin-hud'); if (s) s.textContent = ''; return 1 })()`;
  const foto = async (nombre, hud = false) => {
    await js(`${H}.volverAlJuego?.(); 1`);
    await js(hud ? conHud : sinHud); await esperar(120);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log(`  (captura ${nombre}.png)`);
  };
  // un cuadro del juego (la moza camina, el mundo se acomoda)
  // (si la ventana pierde el foco —otra ventana encima— el juego se pausa solo: se vuelve a jugar)
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) { ${H}.__bucle(); } return 1 })()`);
  // avanza hasta que se cumpla `cond` (una función de estado → booleano) o pase `ms`; devuelve el estado
  const hasta = async (cond, ms = 40000, cada = 50, durante = null) => {
    const t0 = Date.now();
    let e = await estado();
    while (!cond(e) && Date.now() - t0 < ms) { if (durante) await durante(e); await cuadro(1); await esperar(cada); e = await estado(); }
    if (!cond(e)) console.log('  (se acabó el tiempo esperando; estado: ' + JSON.stringify(e) + '; consola: ' + errores.slice(-3).join(' | ') + ')');
    return e;
  };
  // una vista de afuera: el ojo y a dónde mira, en el marco de la cantina (x a lo ancho, z hacia la puerta, y sobre el piso)
  const vista = (ojo, a, extra = {}) => `(() => { const H = ${H}, T = H.T, js = H.jugador.estado;
    const e = H.__aldea.edificio('cantina'), c = Math.cos(e.rot), s = Math.sin(e.rot), piso = e.y + 0.32;
    const w = (lx, lz) => ({ x: e.x + lx * c + lz * s, z: e.z - lx * s + lz * c });
    const wo = w(${ojo[0]}, ${ojo[2]}), wa = w(${a[0]}, ${a[2]});
    const dentro = Math.abs(${ojo[0]}) < 5 && Math.abs(${ojo[2]}) < 4;
    const o = { x: wo.x, z: wo.z, y: (dentro ? piso : Math.max(T.altura(wo.x, wo.z), piso - 3)) + ${ojo[1]} }, a = { x: wa.x, z: wa.z, y: piso + ${a[1]} };
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    if (!${!!extra.sinJugador}) { js.pos.set(o.x, o.y - 1.65, o.z); js.vel.set(0, 0, 0); js.vy = 0; js.yaw = yaw; js.pitch = pitch; }   // (vos, donde está la cámara: la luz de adentro es la del cuarto en que estás)
    H.__camaraFija = ${!!extra.sinJugador} ? { x: o.x, y: o.y, z: o.z, yaw, pitch } : null;
    const cam = H.camara; cam.position.set(o.x, o.y, o.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0);
    if (cam.fov !== ${extra.fov || 70}) { cam.fov = ${extra.fov || 70}; cam.updateProjectionMatrix(); }
    for (const k of cam.children) k.visible = false;
    return 1 })()`;
  const armarMundo = async (n = 4) => { for (let k = 0; k < n; k++) { await js(`(async () => { const M = ${H}.__aldeaMundo(); M.actualizar(4, ${H}.camara.position); await M.listo(); M.montarCola(); return 1 })()`); await esperar(150); } };

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'invierno'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.__cantina)`).catch(() => false)) break; }
    ok(await js(`!!${H}.__cantina()`), 'el juego cargó con la cantina');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; 1`);

    // ------------------------------------------------------------ 1. el edificio y la moza
    console.log('— el edificio');
    await js(`(() => { const P = ${H}.progreso; P.aldea.descubierta = 1; P.economia.pesos = 6000; P.dia = 10; P.horas = 17.4; ${H}.clima.estado.nublado = 0.2; return 1 })()`);
    await js(`(async () => { await ${H}.__aldeaMundo().listo(); ${H}.__aldeaMundo().montarCola(); return 1 })()`);
    const e = await js(`${H}.__aldea.edificio('cantina')`);
    ok(e && e.id === 'cantina', `la cantina está en la aldea (${Math.round(e.x)}, ${Math.round(e.z)})`);
    // vos cerca (la aldea se arma de a poco) y la moza detrás de la barra a las 18
    await js(`(() => { const H = ${H}, e = H.__aldea.edificio('cantina'); H.jugador.ubicar(e.x + 6, e.z + 10, 0); H.progreso.horas = 20.4; for (let i = 0; i < 10; i++) { H.__aldea.actualizar(0.6); H.__aldea.mundo().prearmar(1e6); } return 1 })()`);
    await armarMundo(5);
    for (let k = 0; k < 12; k++) { await js(`(() => { ${H}.__aldea.actualizar(0.4); ${H}.__aldea.mundo().prearmar(1e6); ${H}.__bucle(); return 1 })()`); await esperar(40); }
    // (si ese día hay fiesta, a la noche toda la aldea va al predio: se busca otro día de invierno)
    for (const d of [10, 11, 12, 21, 22, 23, 24, 33, 34, 35, 36]) {
      await js(`(() => { ${H}.progreso.dia = ${d}; ${H}.progreso.horas = 20.4; for (let i = 0; i < 4; i++) { ${H}.__aldea.actualizar(0.6); } return 1 })()`);
      const donde = await js(`(() => { const st = ${H}.__aldea.mundo().personas.get('moza'); return st && st.destino ? st.destino.edificio : null })()`);
      if (donde === 'cantina') break;
    }
    const moza0 = await js(`(() => { const n = ${H}.__aldea.mundo().personas.get('moza')?.npc; if (!n) return null; const e = ${H}.__aldea.edificio('cantina'), c = Math.cos(e.rot), sn = Math.sin(e.rot), dx = n.pos.x - e.x, dz = n.pos.z - e.z; return { lx: +(dx * c - dz * sn).toFixed(2), lz: +(dx * sn + dz * c).toFixed(2), y: +(n.pos.y - e.y).toFixed(2), dormido: !!n.dormido, pose: n.pose || null, visible: n.g.visible, soloCerca: n.soloCerca, camino: n.camino ? n.camino.length : -1, d: (() => { const st = ${H}.__aldea.mundo().personas.get('moza'); return st.destino && [st.destino.lugar, st.destino.edificio, st.destino.punto, st.clave]; })() } })()`);
    console.log('  Lucrecia (marco de la cantina):', JSON.stringify(moza0));
    ok(!!moza0 && !moza0.dormido, 'Lucrecia está en la cantina a la noche');
    // las capturas de afuera: el atardecer (cerrada todavía), la noche con las ventanas encendidas y el final de la calle
    await js(`${H}.progreso.horas = 17.6; 1`);
    for (const [nombre, ojo, a, hora] of [
      ['afuera-frente', [0, 1.7, 22], [0, 2.3, 4], 17.6], ['afuera-atardecer', [-7.5, 1.7, 15], [0, 2.1, 3], 17.6], ['afuera-noche', [4.5, 1.7, 14], [0, 2.0, 4.2], 21.3],
      ['afuera-calle', [-3, 1.8, 42], [0, 2.4, 2], 18.2],
    ]) {
      await js(`${H}.progreso.horas = ${hora}; 1`);
      for (let k = 0; k < 14; k++) { await js(vista(ojo, a)); await js(`${H}.__bucle(); 1`); await esperar(40); }
      await foto(nombre);
    }
    await js(`${H}.progreso.horas = 21.2; 1`);
    for (const [nombre, ojo, a] of [
      ['adentro-barra', [0.6, 1.65, 3.5], [-3.6, 1.3, 0.3]], ['adentro-salon', [3.9, 1.8, -0.9], [-1.0, 0.9, 2.0]],
      ['adentro-guitarra', [-0.6, 1.6, 1.6], [4.9, 1.8, 1.7]], ['adentro-puerta', [-3.4, 1.7, 0.3], [2.5, 1.0, 2.4]],
      ['moza-barra', [-1.6, 1.6, 0.2], [-3.95, 1.35, 0.2]],
    ]) {
      for (let k = 0; k < 14; k++) { await js(vista(ojo, a, { fov: 66 })); await js(`(() => { ${H}.__aldea.actualizar(0.1); ${H}.__bucle(); return 1 })()`); await esperar(40); }
      await foto(nombre);
    }
    if (process.env.HOJ_SOLO_FOTOS) { console.log('(sólo fotos)'); salir(0); return; }

    // ------------------------------------------------------------ 2. te sentás: la moza viene caminando
    console.log('— sentarse y la carta');
    await js(`(() => { const H = ${H}, c = H.__cantina(), s = c.lugar.sillas.find((x) => x.mesa.id === 'mesa-3' && x.i === 1), js = H.jugador.estado;
      H.jugador.ubicar(s.x, s.z, s.mira + Math.PI); js.pos.y = c.lugar.pisoY(); js.entumecido = 4; js.descansado = 0; H.jugador.sentarse(true); js.yaw = s.mira + Math.PI; js.pitch = -0.1; return 1 })()`);
    let est = await hasta((x) => !!x.ses, 5000);
    ok(!!est.ses && est.ses.mesa === 'mesa-3', `empezó la visita en la mesa 3 (fase ${est.ses?.fase})`);
    ok(est.ses.fase === 'espera', 'la moza todavía no viene: te está viendo');
    const pos0 = await js(`(() => { const n = ${H}.__aldea.mundo().personas.get('moza').npc; return { x: n.pos.x, z: n.pos.z } })()`);
    // viene: se la ve caminar hasta la mesa (la cámara de la mesa, desde el costado)
    let vistos = 0, mejor = 0;
    est = await hasta((x) => x.ses && x.ses.fase === 'carta', 30000, 40, async (x) => {
      if (x.ses && x.ses.fase === 'viene') { vistos++; const d = await js(`(() => { const n = ${H}.__aldea.mundo().personas.get('moza').npc; return Math.hypot(n.pos.x - ${pos0.x}, n.pos.z - ${pos0.z}) })()`); mejor = Math.max(mejor, d); if (vistos === 4 || vistos === 14) { await js(vista([4.2, 2.1, 3.3], [-1.5, 1.0, 1.2], { sinJugador: true, fov: 62 })); await foto(vistos === 4 ? 'moza-viene' : 'moza-viene-2'); await js(`${H}.__camaraFija = null; 1`); } }
    });
    ok(vistos > 8 && mejor > 1.8, `la moza VINO CAMINANDO (${vistos} cuadros andando, hasta ${mejor.toFixed(1)} m de donde salió)`);
    ok(est.ses && est.ses.fase === 'carta' && est.panel.abierto, `llegó y se abrió la carta (fase ${est.ses?.fase})`);
    const txt = await js(`document.getElementById('cantina-contenido').textContent`);
    ok(/Ginebra/.test(txt) && /Empanadas/.test(txt) && /Chocolate/.test(txt) && /Guiso/.test(txt) && !/Trucha/.test(txt), 'la carta de invierno: ginebra, empanadas, chocolate caliente y guiso');
    ok(/Tenés \$6\.000/.test(txt), 'muestra tu plata');
    await foto('carta', true);
    await js(`(() => { ${H}.__cantina().panel.sel = 'ginebra'; ${H}.__cantina().dibujar(); return 1 })()`);
    await foto('carta-pagar', true);

    // ------------------------------------------------------------ 3. pedís: bandeja
    console.log('— el pedido en bandeja');
    const antes = await js(`${H}.progreso.economia.pesos`);
    await js(`(() => { const c = ${H}.__cantina(), it = c.cartaHoy().find((x) => x.id === 'ginebra'); return c.pedirItem(it, { medio: 'pesos' }) })()`);
    ok((await js(`${H}.progreso.economia.pesos`)) === antes - 300, 'pagaste $300 con tu billetera');
    ok(!(await estado()).panel.abierto, 'la carta se cierra y ella anota');
    let sirve = false, trae = 0, barraPose = false;
    est = await hasta((x) => x.servidos.length > 0, 60000, 40, async (x) => {
      if (x.ses?.fase === 'prepara') { const p = await js(`${H}.__aldea.mundo().personas.get('moza').npc.pose`); if (p === 'barra') barraPose = true; }
      if (x.ses?.fase === 'trae') { trae++; if (trae === 5 || trae === 40) { await js(vista([4.2, 2.1, 3.3], [-1.5, 1.0, 1.2], { sinJugador: true, fov: 62 })); await foto(trae === 5 ? 'moza-trae' : 'moza-trae-2'); await js(`${H}.__camaraFija = null; 1`); } }
      if (x.ses?.fase === 'deja') sirve = true;
    });
    ok(barraPose, 'mientras prepara, está apoyada en la barra');
    ok(trae > 8, `trajo la bandeja CAMINANDO hasta la mesa (${trae} cuadros)`);
    ok(est.servidos.length === 1 && est.servidos[0].item === 'ginebra' && est.servidos[0].restantes === 3, 'dejó la ginebra en tu mesa');
    ok(sirve, 'se inclinó a apoyarla (pose «dejar»)');
    est = await hasta((x) => x.ses && x.ses.fase === 'libre', 30000, 40);
    ok(est.ses?.fase === 'libre' && !est.controla, `se fue a atender a otro (fase ${est.ses?.fase})`);
    await js(`(() => { const s = ${H}.__cantina().lugar.sillas.find((x) => x.mesa.id === 'mesa-3' && x.i === 1); ${H}.jugador.estado.yaw = s.mira + Math.PI; ${H}.jugador.estado.pitch = -0.5; return 1 })()`);
    await cuadro(3); await esperar(200);
    await foto('mesa-servida');
    // (la misma mesa vista desde afuera, con tu cuerpo en la silla: lo servido y la silla de enfrente)
    for (const [nombre, ojo, mira] of [['mesa-lado', [2.2, 1.5, -1.3], [-0.9, 0.85, 0.35]], ['mesa-arriba', [-0.2, 2.1, 1.5], [-0.9, 0.78, 0.3]]]) {
      await js(vista(ojo, mira, { sinJugador: true, fov: 50 })); await cuadro(2); await esperar(100); await foto(nombre); await js(`${H}.__camaraFija = null; 1`);
    }

    // ------------------------------------------------------------ 4. tomar de a sorbos
    console.log('— tomar');
    const aviso = await js(`${H}.__avisoYa()?.texto || ''`);
    ok(/trago/i.test(aviso), `el aviso dice qué hacer: «${aviso}»`);
    await js(`${tecla('KeyE')} 1`);
    await cuadro(2);
    ok((await estado()).sorbo, 'E: empieza el sorbo');
    let sacada = false;
    for (let i = 0; i < 30 && (await estado()).sorbo; i++) { await cuadro(1); await esperar(45); if (i === 14 && !sacada) { sacada = true; await foto('sorbo'); } }
    est = await estado();
    ok(est.servidos[0].restantes === 2, `un sorbo menos (quedan ${est.servidos[0].restantes})`);
    ok((await js(`${H}.jugador.estado.entumecido`)) === 0, 'el trago fuerte te sacó el frío (entumecido 0)');
    for (let n = 0; n < 2; n++) { await js(`${tecla('KeyE')} 1`); for (let i = 0; i < 40 && (await estado()).sorbo; i++) { await cuadro(1); await esperar(45); } }
    est = await estado();
    ok(est.servidos[0].restantes === 0, 'terminó el vaso');

    // ------------------------------------------------------------ 5. otra cosa: comida y trueque
    console.log('— otra ronda: empanadas con trueque, un mate con la cuenta');
    await js(`(() => { const P = ${H}.progreso; P.materiales.tronco = 5; ${H}.__cantina().llamar(); return 1 })()`);
    est = await hasta((x) => x.ses && x.ses.fase === 'carta', 40000, 40);
    ok(est.ses?.fase === 'carta', 'la llamás y viene a la mesa otra vez');
    const formas = await js(`(() => { const c = ${H}.__cantina(); const it = c.cartaHoy().find((x) => x.id === 'empanadas'); return c.cartaHoy().length })()`);
    ok(formas >= 8, `la carta de invierno trae ${formas} cosas`);
    await js(`(() => { ${H}.__cantina().panel.sel = 'empanadas'; ${H}.__cantina().dibujar(); return 1 })()`);
    const botones = await js(`[...document.querySelectorAll('#cantina-contenido .cantina-pagos button')].map((b) => b.textContent + (b.disabled ? ' (no)' : ''))`);
    ok(botones.some((b) => /Pagar/.test(b)) && botones.some((b) => /Trueque: \d+ troncos/.test(b)) && botones.some((b) => /cuenta/.test(b)), `las tres formas de pagar: ${JSON.stringify(botones)}`);
    await foto('carta-trueque', true);
    const troncos = await js(`${H}.progreso.materiales.tronco`);
    await js(`(() => { const c = ${H}.__cantina(); const it = c.cartaHoy().find((x) => x.id === 'empanadas'); return c.pedirItem(it, { medio: 'trueque', bien: 'tronco' }) })()`);
    ok((await js(`${H}.progreso.materiales.tronco`)) === troncos - 3, 'pagaste con troncos (trueque)');
    est = await hasta((x) => x.servidos.length > 0 && x.servidos[0].item === 'empanadas', 70000, 40);
    ok(est.servidos[0]?.item === 'empanadas', 'te trajo las empanadas');
    est = await hasta((x) => x.ses && x.ses.fase === 'libre', 30000, 40);
    await js(`(() => { ${H}.jugador.estado.pitch = -0.5; return 1 })()`); await cuadro(2); await esperar(200);
    await foto('empanadas');
    await js(`${tecla('KeyE')} 1`); for (let i = 0; i < 40 && (await estado()).sorbo; i++) { await cuadro(1); await esperar(45); }
    await foto('bocado').catch(() => {});
    // se las deja a medias: te levantás (R) y ella levanta la mesa después
    await js(`${tecla('KeyR')} 1`);
    await cuadro(3);
    est = await estado();
    ok(!est.ses, 'te levantaste: la visita terminó');
    est = await hasta((x) => x.limpieza === 'va' || x.servidos.length === 0, 30000, 40);
    ok(est.limpieza === 'va' || est.servidos.length === 0, `la moza viene a levantar la mesa (${est.limpieza})`);
    est = await hasta((x) => x.servidos.length === 0 && !x.limpieza, 40000, 40);
    ok(est.servidos.length === 0, 'levantó lo de la mesa');

    // ------------------------------------------------------------ 6. guardado y cerrada
    console.log('— la cuenta, el guardado y la hora');
    await js(`(() => { const P = ${H}.progreso, c = P.cantina; c.cuenta = { monto: 600, k: 'tronco', n: 4, dia: 9 }; ${H}.guardar?.(); return 1 })()`);
    const guardado = await js(`JSON.stringify(${H}.progreso.cantina)`);
    ok(/"monto":600/.test(guardado), 'la cuenta se guarda en la partida');
    await js(`(() => { ${H}.progreso.horas = 13; return 1 })()`);
    await js(`(() => { const c = ${H}.__cantina(), s = c.lugar.sillas[0]; ${H}.jugador.ubicar(s.x, s.z, s.mira + Math.PI); ${H}.jugador.estado.pos.y = c.lugar.pisoY(); ${H}.jugador.sentarse(true); return 1 })()`);
    est = await hasta((x) => !!x.ses, 3000);
    ok(est.ses?.fase === 'cerrada', 'de día, la cantina está cerrada: no viene nadie');
    await js(`${tecla('KeyR')} 1`); await cuadro(2);
    ok(errores.filter((m) => !m.startsWith('FALLÓ')).length === 0, `sin errores en la consola (${errores.filter((m) => !m.startsWith('FALLÓ')).slice(0, 3).join(' | ')})`);
  } catch (err) {
    console.log('ERROR: ' + (err && err.stack ? err.stack : err));
    errores.push('excepción');
  }
  if (errores.length) { console.log(`\n${errores.length} problema(s):\n` + errores.join('\n')); salir(1); } else { console.log('\nTODO BIEN'); salir(0); }
});
