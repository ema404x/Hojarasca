// Partida real 3.9.2 · LA CASA DE TÉ IGUAL QUE LA CANTINA y LA CANTINA MÁS VIVA: el flujo entero en el juego de verdad, con capturas.
//   1. la casa de té: te sentás, Ceinwen viene caminando con la carta de tés y tortas galesas, pedís, trae la bandeja (tetera y taza), tomás, se registra y ella levanta la mesa;
//   2. la cantina: su carta nueva (platos del día), el ambiente (cuadros, reloj, herraduras, lo usado en las mesas, la música de fondo), el saludo con la mano y por tu nombre,
//      la bandeja con lo que pediste y «Charlar un rato».
// Uso (después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-3-9-2-cantina.cjs    (las capturas, en HOJ_SALIDA o salida-cantina\mejoras-casa-te)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/Documents/Hojarasca/salida-cantina/mejoras-casa-te';
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa): ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 16 minutos'); salir(2); }, 16 * 60 * 1000).unref?.();

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
  const sinHud = `(() => { let s = document.getElementById('sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'sin-hud'; document.head.appendChild(s); } s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; return 1 })()`;
  const conHud = `(() => { const s = document.getElementById('sin-hud'); if (s) s.textContent = ''; return 1 })()`;
  const foto = async (nombre, hud = false) => {
    await js(`${H}.volverAlJuego?.(); 1`);
    await js(hud ? conHud : sinHud); await esperar(120);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log(`  (captura ${nombre}.png)`);
  };
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) { ${H}.__bucle(); } return 1 })()`);
  // `Q`: qué instancia se mira (`__cantina` o `__te`)
  const estadoDe = (Q) => js(`${H}.${Q}().estado()`);
  const hasta = async (Q, cond, ms = 40000, cada = 50, durante = null) => {
    const t0 = Date.now();
    let e = await estadoDe(Q);
    while (!cond(e) && Date.now() - t0 < ms) { if (durante) await durante(e); await cuadro(1); await esperar(cada); e = await estadoDe(Q); }
    if (!cond(e)) console.log('  (se acabó el tiempo esperando; estado: ' + JSON.stringify(e).slice(0, 600) + '; consola: ' + errores.slice(-3).join(' | ') + ')');
    return e;
  };
  // una vista: el ojo y a dónde mira, en el marco del edificio `id` (x a lo ancho, z hacia la puerta, y sobre el piso; `piso`: lo que sube el piso de adentro)
  const vista = (id, piso0, ojo, a, extra = {}) => `(() => { const H = ${H}, T = H.T, js = H.jugador.estado;
    const e = H.__aldea.edificio('${id}'), c = Math.cos(e.rot), s = Math.sin(e.rot), piso = e.y + ${piso0};
    const w = (lx, lz) => ({ x: e.x + lx * c + lz * s, z: e.z - lx * s + lz * c });
    const wo = w(${ojo[0]}, ${ojo[2]}), wa = w(${a[0]}, ${a[2]});
    const dentro = ${extra.dentro === undefined ? 'true' : extra.dentro};
    const o = { x: wo.x, z: wo.z, y: (dentro ? piso : Math.max(T.altura(wo.x, wo.z), piso - 3)) + ${ojo[1]} }, a = { x: wa.x, z: wa.z, y: piso + ${a[1]} };
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    if (!${!!extra.sinJugador}) { js.pos.set(o.x, o.y - 1.65, o.z); js.vel.set(0, 0, 0); js.vy = 0; js.yaw = yaw; js.pitch = pitch; }
    H.__camaraFija = ${!!extra.sinJugador} ? { x: o.x, y: o.y, z: o.z, yaw, pitch } : null;
    const cam = H.camara; cam.position.set(o.x, o.y, o.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0);
    if (cam.fov !== ${extra.fov || 70}) { cam.fov = ${extra.fov || 70}; cam.updateProjectionMatrix(); }
    for (const k of cam.children) k.visible = false;
    return 1 })()`;
  // la cámara a `d` metros de alguien, a su derecha `lado` y a `alto` del piso, mirándole el pecho
  const seguir = (clave, d, lado, alto) => `(() => { const H = ${H}, n = H.__aldea.mundo().personas.get('${clave}').npc, js = H.jugador.estado;
    const dx = Math.sin(n.rumbo ?? 0), dz = Math.cos(n.rumbo ?? 0);
    const o = { x: n.pos.x + dx * ${d} + dz * ${lado}, y: (n.pos.y ?? n.g?.position?.y ?? 0) + ${alto}, z: n.pos.z + dz * ${d} - dx * ${lado} }, a = { x: n.pos.x, y: (n.pos.y ?? n.g?.position?.y ?? 0) + 1.25, z: n.pos.z };
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    H.__camaraFija = { x: o.x, y: o.y, z: o.z, yaw, pitch };
    const cam = H.camara; cam.position.set(o.x, o.y, o.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0); cam.fov = 55; cam.updateProjectionMatrix();
    for (const k of cam.children) k.visible = false; return 1 })()`;
  const vistaTe = (ojo, a, extra = {}) => vista('casa-te', 0.38, [ojo[0], ojo[1], ojo[2] - 2], [a[0], a[1], a[2] - 2], extra);   // (en el marco de la estructura, que está 2 m corrida)
  const vistaCa = (ojo, a, extra = {}) => vista('cantina', 0.32, ojo, a, extra);
  const armarMundo = async (n = 4) => { for (let k = 0; k < n; k++) { await js(`(async () => { const M = ${H}.__aldeaMundo(); M.actualizar(4, ${H}.camara.position); await M.listo(); M.montarCola(); return 1 })()`); await esperar(150); } };
  const sentar = (Q, mesa, i, alto = 0.04) => js(`(() => { const H = ${H}, c = H.${Q}(), s = c.lugar.sillas.find((x) => x.mesa.id === '${mesa}' && x.i === ${i}), js = H.jugador.estado;
      H.jugador.ubicar(s.x, s.z, s.mira + Math.PI); js.pos.set(s.x, c.lugar.pisoY() + ${alto}, s.z); js.entumecido = 4; js.descansado = 0; H.jugador.sentarse(true); js.yaw = s.mira + Math.PI; js.pitch = -0.1; return 1 })()`);

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:true, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'invierno'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.__cantina && ${H}.__te)`).catch(() => false)) break; }
    ok(await js(`!!${H}.__te()`), 'el juego cargó con la casa de té armada');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; 1`);
    await js(`(() => { const P = ${H}.progreso; P.aldea.descubierta = 1; P.economia.pesos = 9000; P.dia = 10; P.horas = 15.8; ${H}.clima.estado.nublado = 0.2; return 1 })()`);
    await js(`(async () => { await ${H}.__aldeaMundo().listo(); ${H}.__aldeaMundo().montarCola(); return 1 })()`);

    // ------------------------------------------------------------ 1. LA CASA DE TÉ
    console.log('— la casa de té');
    const et = await js(`${H}.__aldea.edificio('casa-te')`);
    ok(et && et.id === 'casa-te', `la casa de té está en la aldea (${Math.round(et.x)}, ${Math.round(et.z)})`);
    await js(`(() => { const H = ${H}, e = H.__aldea.edificio('casa-te'); H.jugador.ubicar(e.x + 2, e.z + 9, 0); for (let i = 0; i < 10; i++) { H.__aldea.actualizar(0.6); H.__aldea.mundo().prearmar(1e6); } return 1 })()`);
    await armarMundo(5);
    for (let k = 0; k < 10; k++) { await js(`(() => { ${H}.__aldea.actualizar(0.4); ${H}.__aldea.mundo().prearmar(1e6); ${H}.__bucle(); return 1 })()`); await esperar(40); }
    // un día en que la galesa esté en la casa de té a esa hora (si hay fiesta, la aldea va al predio)
    for (const d of [10, 11, 12, 21, 22, 23, 24, 33, 34, 35, 36]) {
      await js(`(() => { ${H}.progreso.dia = ${d}; ${H}.progreso.horas = 15.8; for (let i = 0; i < 5; i++) { ${H}.__aldea.actualizar(0.6); } return 1 })()`);
      const donde = await js(`(() => { const st = ${H}.__aldea.mundo().personas.get('galesa'); return st && st.destino ? st.destino.edificio : null })()`);
      if (donde === 'casa-te') break;
    }
    for (let k = 0; k < 40; k++) { await js(`(() => { ${H}.__aldea.actualizar(0.5); ${H}.__bucle(); return 1 })()`); await esperar(30); }   // (que llegue a su lugar)
    const g0 = await js(`(() => { const n = ${H}.__aldea.mundo().personas.get('galesa')?.npc; return n ? { x: +n.pos.x.toFixed(1), z: +n.pos.z.toFixed(1), dormido: !!n.dormido, pose: n.pose || null, bandeja: !!n.bandeja } : null })()`);
    console.log('  Ceinwen:', JSON.stringify(g0));
    ok(!!g0 && !g0.dormido && g0.bandeja, 'Ceinwen está en la casa de té y trae bandeja (su ropa la tiene)');
    ok(await js(`${H}.__te().sirviendo()`), 'la casa de té está atendiendo (la galesa libre y es horario)');
    await js(`${H}.progreso.horas = 15.8; 1`);
    for (const [nombre, ojo, a] of [['te-afuera-frente', [0.5, 1.7, 14], [0, 1.5, 4]], ['te-galeria', [0, 1.6, 8.6], [0, 1.0, 4.4]]]) {
      for (let k = 0; k < 12; k++) { await js(vistaTe(ojo, a, { dentro: false })); await js(`${H}.__bucle(); 1`); await esperar(40); }
      await foto(nombre);
    }
    for (const [nombre, ojo, a] of [['te-salon', [2.6, 1.7, 2.3], [-1.3, 0.9, 0.6]], ['te-salon-2', [-2.4, 1.7, -1.5], [1.3, 0.9, 1.4]]]) {
      for (let k = 0; k < 12; k++) { await js(vistaTe(ojo, a)); await js(`${H}.__bucle(); 1`); await esperar(40); }
      await foto(nombre);
    }
    if (process.env.HOJ_SOLO_FOTOS) { console.log('(sólo fotos)'); salir(0); return; }

    // las sillas de la casa de té son las de verdad (las de estructuras.js)
    const sillas = await js(`(() => { const c = ${H}.__te(), sent = ${H}.est?.sentaderos || [], r = []; for (const s of c.lugar.sillas) { let d = 99; for (const q of sent) d = Math.min(d, Math.hypot(q.x - s.x, q.z - s.z)); r.push(+d.toFixed(2)); } return { n: c.lugar.sillas.length, d: r, hay: sent.length } })()`);
    console.log('  sillas:', JSON.stringify(sillas));
    ok(sillas.n === 6 && (!sillas.hay || sillas.d.every((x) => x < 0.3)), 'las seis sillas coinciden con los asientos de verdad de la casa de té');

    // te sentás en la galería: Ceinwen viene caminando
    console.log('— sentarse, la carta de tés');
    await sentar('__te', 'mesa-1', 0, 0.0);
    let est = await hasta('__te', (x) => !!x.ses, 5000);
    ok(!!est.ses && est.ses.mesa === 'mesa-1', `empezó la visita en la galería (fase ${est.ses?.fase})`);
    const pos0 = await js(`(() => { const n = ${H}.__aldea.mundo().personas.get('galesa').npc; return { x: n.pos.x, z: n.pos.z } })()`);
    let vistos = 0, lejos = 0;
    est = await hasta('__te', (x) => x.ses && x.ses.fase === 'carta', 40000, 40, async (x) => {
      if (x.ses && x.ses.fase === 'viene') { vistos++; const d = await js(`(() => { const n = ${H}.__aldea.mundo().personas.get('galesa').npc; return Math.hypot(n.pos.x - ${pos0.x}, n.pos.z - ${pos0.z}) })()`); lejos = Math.max(lejos, d); }
    });
    ok(vistos > 6 && lejos > 1.5, `Ceinwen VINO CAMINANDO (${vistos} cuadros andando, hasta ${lejos.toFixed(1)} m de donde salió)`);
    ok(est.ses && est.ses.fase === 'carta' && est.panel.abierto, `llegó y se abrió la carta (fase ${est.ses?.fase})`);
    const txt = await js(`document.getElementById('cantina-contenido').textContent`);
    ok(/Té galés/.test(txt) && /Torta negra/.test(txt) && /Scones/.test(txt) && /Bara brith/.test(txt) && /Pan de jengibre/.test(txt), 'la carta: té galés, torta negra, scones, bara brith y pan de jengibre');
    ok(/del día/.test(txt), 'una torta del día');
    ok(/Charlar un rato/.test(txt), 'y «Charlar un rato»');
    const titulo = await js(`document.querySelector('#cantina-carta h2').textContent`);
    ok(/casa de té/i.test(titulo), `el título de la carta es el de la casa de té («${titulo}»)`);
    await foto('te-carta', true);
    await js(`(() => { ${H}.__te().panel.sel = 'te-completo'; ${H}.__te().dibujar(); return 1 })()`);
    await foto('te-carta-pagar', true);

    // pedís el té completo: tetera y taza, y la torre
    console.log('— el té completo, en bandeja');
    const antes = await js(`${H}.progreso.economia.pesos`);
    const entradaAntes = await js(`!!${H}.progreso.entradas['te-galesa']`);
    await js(`(() => { const c = ${H}.__te(), it = c.cartaHoy().find((x) => x.id === 'te-completo'); return c.pedirItem(it, { medio: 'pesos' }) })()`);
    ok((await js(`${H}.progreso.economia.pesos`)) === antes - 650, 'pagaste $650 con tu billetera');
    ok((await js(`${H}.progreso.casaTe.pedidos`)) === 1 && (await js(`${H}.progreso.casaTe.ultimoPedido`)) === 'te-completo', 'queda anotado lo último que pediste (progreso.casaTe)');
    let trae = 0, barraPose = false, bandejaVista = false;
    est = await hasta('__te', (x) => x.servidos.length > 0, 90000, 40, async (x) => {
      if (x.ses?.fase === 'prepara') { const p = await js(`${H}.__aldea.mundo().personas.get('galesa').npc.pose`); if (p === 'barra') barraPose = true; }
      if (x.ses?.fase === 'trae') {
        trae++;
        if (trae === 14 || trae === 40 || trae === 80) { bandejaVista = true; await js(seguir('galesa', 2.2, -0.6, 1.55)); await cuadro(1); await foto(`te-trae-bandeja-${trae}`); await js(`${H}.__camaraFija = null; 1`); }
      }
    });
    ok(barraPose, 'mientras prepara, está apoyada en su cocina');
    ok(trae > 8, `trajo la bandeja CAMINANDO hasta la mesa (${trae} cuadros)`);
    ok(est.servidos.length === 1 && est.servidos[0].item === 'te-completo', 'dejó el té completo en tu mesa');
    ok(await js(`!!${H}.progreso.entradas['te-galesa']`), 'se anotó «un té con torta galesa» en tu cuaderno (lo que antes daba pedir de pie)');
    est = await hasta('__te', (x) => x.ses && x.ses.fase === 'libre', 40000, 40);
    ok(est.ses?.fase === 'libre' && !est.controla, `Ceinwen se fue a lo suyo (fase ${est.ses?.fase})`);
    await js(`(() => { const s = ${H}.__te().lugar.sillas.find((x) => x.mesa.id === 'mesa-1'); ${H}.jugador.estado.yaw = s.mira + Math.PI; ${H}.jugador.estado.pitch = -0.55; return 1 })()`);
    await cuadro(3); await esperar(200);
    await foto('te-mesa-servida');
    for (const [nombre, ojo, mira] of [['te-mesa-lado', [-0.2, 1.7, 5.6], [-1.9, 1.0, 4.0]], ['te-mesa-cerca', [-1.2, 1.55, 4.9], [-1.9, 1.0, 4.0]]]) {
      await js(vistaTe(ojo, mira, { sinJugador: true, fov: 46 })); await cuadro(3); await esperar(120); await foto(nombre); await js(`${H}.__camaraFija = null; 1`);
    }
    // tomar: la taza sube a la boca, la tetera se queda
    console.log('— tomar y comer');
    const aviso = await js(`${H}.__avisoYa()?.texto || ''`);
    ok(/trago/i.test(aviso), `el aviso dice qué hacer: «${aviso}»`);
    await js(`${tecla('KeyE')} 1`);
    await cuadro(2);
    ok((await estadoDe('__te')).sorbo, 'E: empieza el sorbo (la taza sube)');
    for (let i = 0; i < 30 && (await estadoDe('__te')).sorbo; i++) { await cuadro(1); await esperar(45); if (i === 14) await foto('te-sorbo'); }
    est = await estadoDe('__te');
    ok(est.servidos[0].restantes === 5, `un sorbo menos (quedan ${est.servidos[0].restantes})`);
    const vuelta = await js(`(() => { const e = ${H}.__cantinaMundo().enMesa.get('mesa-1'); const t = e.g.userData.alzable; return { padre: t.parent === e.g, y: +t.position.y.toFixed(3) } })()`);
    ok(vuelta.padre, 'la taza volvió a su platito (no quedó en el aire)');
    await foto('te-mesa-despues');
    // te levantás con el té a medias: ella levanta la mesa
    await js(`${tecla('KeyR')} 1`);
    await cuadro(3);
    ok(!(await estadoDe('__te')).ses, 'te levantaste: la visita terminó');
    est = await hasta('__te', (x) => x.servidos.length === 0 && !x.limpieza, 50000, 40, async (x) => { if (x.limpieza === 'va' || x.limpieza === 'recoge') await foto('te-levanta').catch(() => {}); });
    ok(est.servidos.length === 0, 'Ceinwen levantó lo de la mesa');

    // el salón: otra visita, con trueque y la cuenta
    console.log('— el salón, el trueque y la cuenta');
    await js(`(() => { ${H}.progreso.materiales.tronco = 5; return 1 })()`);
    await sentar('__te', 'mesa-3', 0, 0.0);
    est = await hasta('__te', (x) => x.ses && x.ses.fase === 'carta', 60000, 40);
    ok(est.ses?.fase === 'carta', 'sentado en el salón, también viene');
    const sal = await js(`(() => { const c = ${H}.__te(); return c.sentadoEn()?.mesa?.id })()`);
    ok(sal === 'mesa-3', 'la silla del salón es de la mesa 3');
    await js(`(() => { ${H}.__te().panel.sel = 'scones'; ${H}.__te().dibujar(); return 1 })()`);
    const botones = await js(`[...document.querySelectorAll('#cantina-contenido .cantina-pagos button')].map((b) => b.textContent + (b.disabled ? ' (no)' : ''))`);
    ok(botones.some((b) => /Pagar/.test(b)) && botones.some((b) => /Trueque/.test(b)) && botones.some((b) => /cuenta/.test(b)), `las tres formas de pagar: ${JSON.stringify(botones)}`);
    const troncos = await js(`${H}.progreso.materiales.tronco`);
    await js(`(() => { const c = ${H}.__te(), it = c.cartaHoy().find((x) => x.id === 'scones'); return c.pedirItem(it, { medio: 'trueque', bien: 'tronco' }) })()`);
    ok((await js(`${H}.progreso.materiales.tronco`)) < troncos, 'pagaste los scones con troncos (trueque)');
    est = await hasta('__te', (x) => x.servidos.length > 0, 90000, 40);
    ok(est.servidos[0]?.item === 'scones', 'te trajo los scones');
    est = await hasta('__te', (x) => x.ses && x.ses.fase === 'libre', 40000, 40);
    await js(`(() => { ${H}.jugador.estado.pitch = -0.6; return 1 })()`); await cuadro(3); await esperar(200);
    await foto('te-scones');
    await js(`${tecla('KeyE')} 1`); for (let i = 0; i < 40 && (await estadoDe('__te')).sorbo; i++) { await cuadro(1); await esperar(45); }
    ok((await estadoDe('__te')).servidos[0].restantes === 2, 'un bocado menos de los scones');
    // llamás otra vez y la anotás en la cuenta
    await js(`(() => { ${H}.__te().llamar(); return 1 })()`);
    est = await hasta('__te', (x) => x.ses && x.ses.fase === 'carta', 60000, 40);
    await js(`(() => { const c = ${H}.__te(), it = c.cartaHoy().find((x) => x.id === 'chocolate' || x.id === 'te-especiado'); return c.pedirItem(it, { medio: 'cuenta' }) })()`);
    ok((await js(`${H}.progreso.casaTe.cuenta?.monto || 0`)) > 0, 'anotó lo del segundo pedido en la cuenta de la casa de té');
    ok((await js(`${H}.progreso.cantina.cuenta?.monto || 0`)) === 0, 'la cuenta de la cantina no se mezcla');
    est = await hasta('__te', (x) => x.servidos.length > 0 && x.ses?.fase === 'libre', 90000, 40);
    await js(`${tecla('KeyR')} 1`); await cuadro(3);
    est = await hasta('__te', (x) => x.servidos.length === 0 && !x.limpieza, 60000, 40);
    // el guardado
    await js(`${H}.guardar?.(); 1`);
    ok(/"pedidos":3/.test(await js(`JSON.stringify(${H}.progreso.casaTe)`)), 'la libreta de la casa de té se guarda en la partida (3 pedidos)');
    // de noche (cerrada) no atiende, y sin la galesa tampoco
    await js(`${H}.progreso.horas = 22; 1`);
    await sentar('__te', 'mesa-2', 0, 0.0);
    est = await hasta('__te', (x) => !!x.ses, 3000);
    ok(est.ses?.fase === 'cerrada', 'a la noche, la casa de té está cerrada: no viene nadie');
    await js(`${tecla('KeyR')} 1`); await cuadro(2);

    // ------------------------------------------------------------ 2. LA CANTINA MÁS VIVA
    console.log('— la cantina, más viva');
    await js(`(() => { const H = ${H}; H.progreso.dia = 10; H.progreso.horas = 20.4; const e = H.__aldea.edificio('cantina'); H.jugador.ubicar(e.x + 6, e.z + 10, 0); for (let i = 0; i < 10; i++) { H.__aldea.actualizar(0.6); H.__aldea.mundo().prearmar(1e6); } return 1 })()`);
    await armarMundo(5);
    for (const d of [10, 11, 12, 21, 22, 23, 24, 33, 34, 35, 36]) {
      await js(`(() => { ${H}.progreso.dia = ${d}; ${H}.progreso.horas = 20.4; for (let i = 0; i < 4; i++) { ${H}.__aldea.actualizar(0.6); } return 1 })()`);
      const donde = await js(`(() => { const st = ${H}.__aldea.mundo().personas.get('moza'); return st && st.destino ? st.destino.edificio : null })()`);
      if (donde === 'cantina') break;
    }
    for (let k = 0; k < 30; k++) { await js(`(() => { ${H}.__aldea.actualizar(0.5); ${H}.__aldea.mundo().prearmar(1e6); ${H}.__bucle(); return 1 })()`); await esperar(30); }
    // el saludo: llegás de lejos, ella levanta la mano y te nombra
    await js(`(() => { const H = ${H}, e = H.__aldea.edificio('cantina'); H.jugador.ubicar(e.x + 6, e.z + 40, 0); return 1 })()`);
    for (let k = 0; k < 6; k++) { await cuadro(1); await esperar(40); }
    await js(`(() => { const H = ${H}, e = H.__aldea.edificio('cantina'); H.progreso.vecindad.apodo = H.progreso.vecindad.apodo || undefined; H.jugador.ubicar(e.x + 2, e.z + 8.5, 0); return 1 })()`);
    let saludo = false;
    for (let k = 0; k < 40 && !saludo; k++) { await cuadro(1); await esperar(40); saludo = await js(`${H}.__aldea.mundo().personas.get('moza').npc.pose === 'saludar'`); }
    if (!saludo) console.log('  diag saludo:', JSON.stringify(await js(`(() => { const n = ${H}.__aldea.mundo().personas.get('moza').npc, p = ${H}.jugador.estado.pos, c = ${H}.__cantina().lugar.centro; return { pose: n.pose || null, d: Math.hypot(p.x - c.x, p.z - c.z), sirv: ${H}.__cantina().sirviendo(), conVos: !!n.conVos, llegando: !!n.llegando, dorm: !!n.dormido, hora: ${H}.progreso.horas } })()`)));
    ok(saludo, 'al llegar, Lucrecia te saluda con la mano en alto (pose «saludar»)');
    if (saludo) {
      await js(vistaCa([-2.4, 1.6, 1.9], [-3.95, 1.4, 0.2], { sinJugador: true, fov: 52 })); await cuadro(4); await esperar(120); await foto('cantina-saluda'); await js(`${H}.__camaraFija = null; 1`);
    }
    await js(`${H}.progreso.horas = 21.2; 1`);
    for (const [nombre, ojo, a] of [
      ['cantina-frente', [0.2, 1.65, 0.2], [0, 1.9, 3.8]], ['cantina-tabique', [0.4, 1.65, 3.2], [-1.5, 1.7, -1.3]], ['cantina-der', [-1.6, 1.7, 0.6], [5.0, 1.7, 0.6]], ['cantina-izq', [2.4, 1.7, 1.0], [-5.0, 1.7, 1.4]],
      ['cantina-mesas', [3.6, 1.8, 3.4], [-0.4, 0.8, 1.4]], ['cantina-barra', [0.6, 1.65, 3.5], [-3.6, 1.3, 0.3]],
    ]) {
      for (let k = 0; k < 14; k++) { await js(vistaCa(ojo, a, { fov: 66 })); await js(`(() => { ${H}.__aldea.actualizar(0.1); ${H}.__bucle(); return 1 })()`); await esperar(40); }
      await foto(nombre);
    }
    const amb = await js(`${H}.__ambiente().estado()`);
    ok(amb.visible && amb.usados >= 1, `el ambiente está armado y a la vista; vasos y platos usados en las mesas: ${amb.usados}`);
    const hora = await js(`(() => { const r = ${H}.__ambiente().raiz; return r.children.length })()`);
    ok(hora >= 12, `cuadros, herraduras, cartel, reloj y vasos: ${hora} cosas en las paredes y las mesas`);

    // la carta nueva
    console.log('— la carta nueva y la bandeja');
    await sentar('__cantina', 'mesa-3', 0, 0.04);
    est = await hasta('__cantina', (x) => x.ses && x.ses.fase === 'carta', 40000, 40);
    ok(est.ses?.fase === 'carta', 'te sentás: Lucrecia viene con la carta');
    const txc = await js(`document.getElementById('cantina-contenido').textContent`);
    ok(/Locro|Cordero|Fernet|Licor de calafate|Milanesa/.test(txc), 'la carta tiene platos y bebidas nuevos');
    ok(/Para tomar/.test(txc) && /Para comer/.test(txc) && /del día/.test(txc), 'agrupada en «Para tomar» y «Para comer», con un plato del día');
    await foto('cantina-carta', true);
    const ids = await js(`${H}.__cantina().cartaHoy().map((x) => x.id)`);
    console.log('  carta de hoy:', ids.join(', '));
    ok(ids.length >= 16, `la carta de hoy tiene ${ids.length} cosas`);
    const dd = await js(`${H}.__cantina().cartaHoy().find((x) => x.delDia)?.id || null`);
    ok(!!dd, `plato del día: ${dd}`);
    for (const id of [dd, 'fernet-cola'].filter(Boolean)) {
      const antesP = await js(`${H}.progreso.cantina.pedidos`);
      await js(`(() => { const c = ${H}.__cantina(), it = c.cartaHoy().find((x) => x.id === '${id}'); return c.pedirItem(it, { medio: 'pesos' }) })()`);
      ok((await js(`${H}.progreso.cantina.pedidos`)) === antesP + 1, `pediste ${id}`);
      let trae2 = 0;
      est = await hasta('__cantina', (x) => x.servidos.length > 0 && x.servidos[0].item === id, 90000, 40, async (x) => {
        if (x.ses?.fase === 'trae') { trae2++; if (trae2 === 16 || trae2 === 40) { await js(seguir('moza', 2.0, -0.5, 1.5)); await cuadro(1); await foto(`cantina-bandeja-${id}-${trae2}`); await js(`${H}.__camaraFija = null; 1`); } }
      });
      ok(est.servidos[0]?.item === id, `te trajo ${id}`);
      est = await hasta('__cantina', (x) => x.ses && x.ses.fase === 'libre', 40000, 40);
      await js(`(() => { ${H}.jugador.estado.pitch = -0.6; return 1 })()`); await cuadro(3); await esperar(200);
      await foto(`cantina-mesa-${id}`);
      if (id === 'fernet-cola') break;
      await js(`${tecla('KeyE')} 1`); for (let i = 0; i < 40 && (await estadoDe('__cantina')).sorbo; i++) { await cuadro(1); await esperar(45); }
      await js(`(() => { ${H}.__cantina().llamar(); return 1 })()`);
      est = await hasta('__cantina', (x) => x.ses && x.ses.fase === 'carta', 60000, 40);
    }
    // «Charlar un rato» y un comentario sin que se lo pidas
    est = await hasta('__cantina', (x) => x.ses && (x.ses.fase === 'libre' || x.ses.fase === 'carta'), 20000, 40);
    if (est.ses?.fase !== 'carta') { await js(`(() => { ${H}.__cantina().llamar(); return 1 })()`); est = await hasta('__cantina', (x) => x.ses && x.ses.fase === 'carta', 60000, 40); }
    await js(`(() => { const b = [...document.querySelectorAll('#cantina-contenido button')].find((x) => /Charlar/.test(x.textContent)); if (b) b.click(); return !!b })()`);
    await cuadro(2);
    const charla = await js(`document.querySelector('#cantina-contenido .cantina-saludo').textContent`);
    ok(charla.length > 30 && !/^La última/.test(charla), `«Charlar un rato»: ${charla.slice(0, 80)}…`);
    await foto('cantina-charla', true);
    await js(`(() => { ${H}.__cantina().cerrarPanel(); return 1 })()`);
    // el último pedido en el saludo (la próxima visita)
    await js(`${tecla('KeyR')} 1`); await cuadro(3);
    ok((await js(`${H}.progreso.cantina.ultimoPedido`)) === 'fernet-cola', 'la cantina recuerda lo último que pediste (fernet-cola)');
    // la música de fondo suena adentro
    await js(`(() => { const H = ${H}; H.progreso.horas = 21.0; H.progreso.dia = 11; return 1 })()`);
    let suena = false;
    for (let k = 0; k < 60 && !suena; k++) { await cuadro(2); await esperar(60); suena = (await js(`${H}.__ambiente().estado()`)).sonando; }
    console.log('  ambiente:', JSON.stringify(await js(`${H}.__ambiente().estado()`)));
    ok(suena || (await js(`!${H}.sonido?.ctx`)), 'la guitarra de fondo suena adentro de la cantina (o no hay audio en esta máquina)');
    ok(errores.filter((m) => !m.startsWith('FALLÓ')).length === 0, `sin errores en la consola (${errores.filter((m) => !m.startsWith('FALLÓ')).slice(0, 3).join(' | ')})`);
  } catch (err) {
    console.log('ERROR: ' + (err && err.stack ? err.stack : err));
    errores.push('excepción');
  }
  if (errores.length) { console.log(`\n${errores.length} problema(s):\n` + errores.join('\n')); salir(1); } else { console.log('\nTODO BIEN'); salir(0); }
});
