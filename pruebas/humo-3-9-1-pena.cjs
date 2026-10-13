// Partida real 3.9.1 · LA PEÑA DE LOS SÁBADOS: el recorrido entero en el juego de verdad, con capturas.
//   1. un sábado de noche en la cantina: los parroquianos sentados con su vaso, los dos que juegan al truco, la guitarra y el bombo en el rincón y Dalia bailando tango;
//   2. a las 23:30 cambia a chamamé; la música suena (la guitarra y el bombo, por código) y baja cuando hablás con la moza;
//   3. te sentás a una mesa: la moza viene con su chiste y la carta, y alguien se arrima a tu mesa a hacerte compañía;
//   4. Dalia te elige: baja de la pista, te ofrece tango o chamamé, bailás con ella (en la pista, unos segundos) y rinde como bailar en la fiesta;
//   5. la mesa de truco: sentado ahí, E te invita a una partida con uno de los que juegan;
//   6. la borrachera: tres tragos fuertes, la imagen se mueve un poquito, Lucrecia lo comenta y te frena; se pasa con el tiempo y con un mate cocido;
//   7. el entorno entre semana (menos gente, sin peña), el guardado y las partidas de antes.
// Uso (después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-3-9-1-pena.cjs      (las capturas, en HOJ_SALIDA o salida-cantina\pena\partida)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/Documents/Hojarasca/salida-cantina/pena/partida';
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa): ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 20 minutos'); salir(2); }, 20 * 60 * 1000).unref?.();

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
  const pena = () => js(`${H}.__pena().estado()`);
  const cantina = () => js(`${H}.__cantina().estado()`);
  const hasta = async (cond, ms = 40000, cada = 50, fn = () => pena()) => {
    const t0 = Date.now();
    let e = await fn();
    while (!cond(e) && Date.now() - t0 < ms) { await cuadro(1); await esperar(cada); e = await fn(); }
    if (!cond(e)) console.log('  (se acabó el tiempo esperando; estado: ' + JSON.stringify(e).slice(0, 600) + '; consola: ' + errores.slice(-3).join(' | ') + ')');
    return e;
  };
  // una vista: el ojo y a dónde mira, en el marco de la cantina (x a lo ancho, z hacia la puerta, y sobre el piso)
  const vista = (ojo, a, extra = {}) => `(() => { const H = ${H}, T = H.T, js = H.jugador.estado;
    const e = H.__aldea.edificio('cantina'), c = Math.cos(e.rot), s = Math.sin(e.rot), piso = e.y + 0.32;
    const w = (lx, lz) => ({ x: e.x + lx * c + lz * s, z: e.z - lx * s + lz * c });
    const wo = w(${ojo[0]}, ${ojo[2]}), wa = w(${a[0]}, ${a[2]});
    const o = { x: wo.x, z: wo.z, y: piso + ${ojo[1]} }, a = { x: wa.x, z: wa.z, y: piso + ${a[1]} };
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    if (!${!!extra.sinJugador}) { js.pos.set(o.x, o.y - 1.65, o.z); js.vel.set(0, 0, 0); js.vy = 0; js.yaw = yaw; js.pitch = pitch; }
    H.__camaraFija = ${!!extra.sinJugador} ? { x: o.x, y: o.y, z: o.z, yaw, pitch } : null;
    const cam = H.camara; cam.position.set(o.x, o.y, o.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0);
    if (cam.fov !== ${extra.fov || 70}) { cam.fov = ${extra.fov || 70}; cam.updateProjectionMatrix(); }
    for (const k of cam.children) k.visible = false;
    return 1 })()`;
  const armarMundo = async (n = 4) => { for (let k = 0; k < n; k++) { await js(`(async () => { const M = ${H}.__aldeaMundo(); M.actualizar(4, ${H}.camara.position); await M.listo(); M.montarCola(); return 1 })()`); await esperar(150); } };
  // pasa el tiempo de juego (con la aldea al día): `h` es la hora a la que se salta
  const aLaHora = async (dia, h) => { await js(`(() => { ${H}.progreso.dia = ${dia}; ${H}.progreso.horas = ${h}; for (let i = 0; i < 6; i++) { ${H}.__aldea.actualizar(0.6); ${H}.__aldea.mundo().prearmar(1e6); } return 1 })()`); };
  const estar = (donde = 'cantina') => js(`(() => { const H = ${H}, e = H.__aldea.edificio('${donde}'); H.jugador.ubicar(e.x + 2, e.z + 9, 0); return 1 })()`);

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:true, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'otono'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.__cantina && ${H}.__pena)`).catch(() => false)) break; }
    ok(await js(`!!${H}.__pena()`), 'el juego cargó con la peña');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; 1`);

    // ------------------------------------------------------------ 1. un sábado a la noche
    console.log('— el sábado a la noche');
    // día 13 = sábado; la aldea ya tiene a los de la peña (el Cholo, Anselmo, Pocha y los que van a la cantina)
    await js(`(() => { const P = ${H}.progreso; P.aldea.descubierta = 1; P.economia.pesos = 9000; P.dia = 13; P.horas = 17; ${H}.clima.estado.nublado = 0.1;
      P.aldea.pobladores = ['musico', 'herrero', 'carpintero', 'pescador', 'modista', 'telegrafista', 'panadera', 'maestra'].map((clave) => ({ clave, dia: 1 })); return 1 })()`);
    await js(`(async () => { await ${H}.__aldeaMundo().listo(); ${H}.__aldeaMundo().montarCola(); return 1 })()`);
    await estar();
    await aLaHora(13, 17);
    await armarMundo(5);
    for (let k = 0; k < 12; k++) { await js(`(() => { ${H}.__aldea.actualizar(0.4); ${H}.__aldea.mundo().prearmar(1e6); ${H}.__bucle(); return 1 })()`); await esperar(40); }
    await aLaHora(13, 22.2);
    // vos adentro, parado en la puerta
    await js(`(() => { const H = ${H}, p = H.__pena().lugar.aMundo(0.2, 3.2); H.jugador.ubicar(p.x, p.z, Math.PI); return 1 })()`);
    for (let k = 0; k < 30; k++) { await js(`(() => { ${H}.__aldea.actualizar(0.5); ${H}.__aldea.mundo().prearmar(1e6); ${H}.__bucle(); return 1 })()`); await esperar(60); }
    await armarMundo(3);
    let e = await hasta((x) => x.sentados.length >= 3, 25000);
    console.log('  sentados:', JSON.stringify(e.sentados), ' vasos:', JSON.stringify(e.vasos));
    ok(e.sentados.length >= 3, `hay parroquianos sentados (${e.sentados.length})`);
    ok(e.sentados.some((s) => /^truco-/.test(s.punto)), 'dos de ellos juegan al truco en la mesa del rincón');
    ok(e.sentados.filter((s) => /^silla-/.test(s.punto)).length <= 4, 'nunca más de cuatro en las sillas de las mesas: te queda dónde sentarte');
    ok(e.vasos.length >= 1, `cada uno con su vaso en la mesa (${e.vasos.length})`);
    const musicos = await js(`(() => { const m = ${H}.__pena().musica(); return { guitarra: !!m.guitarra, bombo: !!m.bombo, pose: [m.guitarra?.pose, m.bombo?.pose], inst: ${H}.__penaMundo().estado().instrumentos } })()`);
    console.log('  músicos:', JSON.stringify(musicos));
    ok(musicos.guitarra && musicos.bombo, 'el Cholo con la guitarra y Anselmo con el bombo, en el rincón');
    const poseDalia = () => js(`(() => { const n = ${H}.__aldea.mundo().personas.get('bailarina')?.npc; return n ? { pose: n.pose, dormido: n.dormido, alzado: n.alzado, y: +(n.pos.y).toFixed(2), camino: n.camino ? n.camino.length : 0 } : null })()`);
    await hasta((x) => x && x.pose === 'tango', 45000, 60, poseDalia);
    const dalia = await poseDalia();
    console.log('  Dalia:', JSON.stringify(dalia), JSON.stringify(await js(`(() => { const st = ${H}.__aldea.mundo().personas.get('bailarina'); const n = st.npc, d = st.destino, pe = ${H}.__pena().lugar.pto('pista'); return { destino: d && { lugar: d.lugar, punto: d.punto, pose: d.pose, sentado: d.sentado, x: +d.x.toFixed(1), z: +d.z.toFixed(1) }, pos: { x: +n.pos.x.toFixed(1), z: +n.pos.z.toFixed(1) }, camino: n.camino ? n.camino.length : -1, conVos: !!n.conVos, pista: { x: +pe.x.toFixed(1), z: +pe.z.toFixed(1) } } })()`)));
    ok(dalia && dalia.pose === 'tango', 'Dalia baila tango en la pista (22:12)');
    // las vistas de la sala
    for (const [nombre, ojo, a] of [
      ['sala-desde-la-puerta', [0.2, 1.65, 3.4], [1.5, 1.0, -0.5]], ['pista-tango', [-0.4, 1.6, 1.4], [3.15, 1.1, 0.55]], ['rincon-musicos', [1.2, 1.65, 1.1], [3.2, 1.2, -0.95]],
      ['mesa-truco', [1.3, 1.7, 3.5], [3.5, 0.9, 2.4]], ['barra-y-mesas', [3.6, 1.7, 3.3], [-2.5, 1.1, 0.4]],
    ]) {
      for (let k = 0; k < 10; k++) { await js(vista(ojo, a, { fov: 66 })); await js(`(() => { ${H}.__aldea.actualizar(0.1); ${H}.__bucle(); return 1 })()`); await esperar(40); }
      await foto(nombre);
    }
    const sonoMusica = await js(`(() => { const e = ${H}.__penaMundo().estado(); return { sonando: e.sonando, golpes: e.golpes, audio: !!${H}.sonido?.ctx } })()`).catch(() => ({}));
    console.log('  música:', JSON.stringify(sonoMusica));
    if (sonoMusica.audio) ok(sonoMusica.sonando === 'tango' && sonoMusica.golpes > 0, 'suena el tango (guitarra y bombo, sintetizados)'); else console.log('  (sin audio en esta ventana: la música no se pudo oír)');
    for (const [nombre, ojo, a] of [['dalia-tango-de-frente', [0.9, 1.65, 1.5], [3.15, 1.15, 0.55]], ['dalia-tango-perfil', [3.2, 1.6, 2.1], [3.15, 1.15, 0.55]]]) {
      for (let k = 0; k < 12; k++) { await js(vista(ojo, a, { fov: 55 })); await js(`(() => { ${H}.__aldea.actualizar(0.1); ${H}.__bucle(); return 1 })()`); await esperar(60); }
      await foto(nombre);
    }
    if (process.env.HOJ_SOLO_FOTOS) { console.log('(sólo fotos)'); salir(0); return; }

    // ------------------------------------------------------------ 2. a las 23:30, chamamé
    console.log('— el chamamé');
    await aLaHora(13, 23.7);
    await hasta((x) => x && x.pose === 'chamame', 20000, 60, poseDalia);
    ok((await poseDalia()).pose === 'chamame', 'a las 23:30 Dalia pasa al chamamé');
    for (let k = 0; k < 12; k++) { await js(vista([0.9, 1.65, 1.5], [3.15, 1.15, 0.55], { fov: 55 })); await js(`(() => { ${H}.__aldea.actualizar(0.1); ${H}.__bucle(); return 1 })()`); await esperar(60); }
    await foto('dalia-chamame');
    ok((await js(`${H}.__penaMundo().estado().sonando`).catch(() => null)) !== 'tango', 'y la música cambia al chamamé (o calla sin audio)');

    // ------------------------------------------------------------ 3. te sentás: la moza con su chiste y alguien se arrima
    console.log('— sentarse, el chiste y el que se arrima');
    await aLaHora(13, 22.4);
    await hasta((x) => x && x.pose === 'tango', 45000, 60, poseDalia);
    await js(`(() => { const H = ${H}, c = H.__cantina(), s = c.lugar.sillas.find((x) => x.mesa.id === 'mesa-1' && x.i === 0), js = H.jugador.estado;
      H.jugador.ubicar(s.x, s.z, s.mira + Math.PI); js.pos.set(s.x, c.lugar.pisoY() + 0.04, s.z); H.jugador.sentarse(true); js.yaw = s.mira + Math.PI; js.pitch = -0.1; return 1 })()`);
    let ec = await hasta((x) => x.ses && x.ses.fase === 'carta', 40000, 50, cantina);
    ok(ec.ses?.fase === 'carta', 'Lucrecia vino a tu mesa con la carta (con los parroquianos y la peña de fondo)');
    const textoCarta = await js(`document.getElementById('cantina-contenido').textContent`);
    console.log('  saludo:', textoCarta.slice(0, 260).replace(/\s+/g, ' '));
    await foto('sentado-carta', true);
    const chiste = await js(`${H}.__cantina().chiste('pedir', 'ginebra', true)`);
    ok(typeof chiste === 'string' && chiste.length > 10, `tiene un chiste para cada cosa de la carta («${(chiste || '').slice(0, 50)}…»)`);
    await js(`${H}.__cantina().cerrarPanel(); 1`);
    // si nadie la llama, ella se va; después, alguien se arrima
    const arrima = await hasta((x) => x.arrima.fase === 'viene' || x.arrima.fase === 'charla', 130000, 100);
    console.log('  arrima:', JSON.stringify(arrima.arrima));
    ok(arrima.arrima.fase === 'viene' || arrima.arrima.fase === 'charla', 'un vecino se arrima a tu mesa a hacerte compañía');
    const charla = await hasta((x) => x.arrima.fase === 'charla', 40000, 80);
    ok(charla.arrima.fase === 'charla', 'llegó, y charla un rato');
    await js(`(() => { const s = ${H}.__cantina().lugar.sillas.find((x) => x.mesa.id === 'mesa-1' && x.i === 0); ${H}.jugador.estado.yaw = s.mira + Math.PI + 0.9; ${H}.jugador.estado.pitch = -0.05; return 1 })()`);
    await cuadro(3); await esperar(300);
    await foto('se-arrima');
    const fin = await hasta((x) => x.arrima.fase === 'no' && x.arrima.hechos >= 1, 60000, 100);
    ok(fin.arrima.fase === 'no' && fin.arrima.hechos >= 1, 'y vuelve a su silla');

    // ------------------------------------------------------------ 4. Dalia te saca a bailar
    console.log('— Dalia te saca a bailar');
    await js(`(() => { const P = ${H}.progreso; P.fiestas = P.fiestas || {}; P.fiestas.baile = { chamame: 2, chacarera: 0 }; P.vecindad && (P.vecindad.personas = P.vecindad.personas || {}); ${H}.jugador.estado.descansado = 0; ${H}.__pena().forzarInvitacion(); return 1 })()`);
    await hasta((x) => x.dalia.fase === 'viene' || x.dalia.fase === 'panel', 20000, 60);
    let ep = await hasta((x) => x.dalia.fase === 'panel', 40000, 60);
    ok(ep.dalia.fase === 'panel', 'Dalia baja de la pista, camina hasta tu mesa y te ofrece bailar');
    const panel = await js(`({ visible: !document.getElementById('cantina-carta').classList.contains('oculto'), titulo: document.querySelector('#cantina-carta h2')?.textContent, texto: document.getElementById('cantina-contenido').textContent, botones: [...document.querySelectorAll('#cantina-contenido button')].map((b) => b.textContent) })`);
    console.log('  panel:', JSON.stringify(panel).slice(0, 500));
    ok(panel.visible && /Dalia/.test(panel.titulo) && panel.botones.length === 3 && panel.botones.some((b) => /tango/i.test(b)) && panel.botones.some((b) => /chamam/i.test(b)), 'el panel: tango, chamamé o más tarde');
    await foto('dalia-invita', true);
    await js(`[...document.querySelectorAll('#cantina-contenido button')].find((b) => /tango/i.test(b.textContent)).dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true })); 1`);
    let eb = await hasta((x) => x.dalia.fase === 'baila', 15000, 60);
    ok(eb.dalia.fase === 'baila' && eb.dalia.baile === 'tango', 'bailás el tango con ella en la pista');
    for (const [nombre, ojo, a, ext] of [['baile-primera-persona', null, null, false], ['baile-desde-afuera', [-0.6, 1.9, 2.6], [2.8, 1.2, 0.6], true]]) {
      if (ext) { for (let k = 0; k < 8; k++) { await js(vista(ojo, a, { sinJugador: true, fov: 56 })); await js(`(() => { ${H}.__bucle(); return 1 })()`); await esperar(60); } }
      else { await js(`(() => { ${H}.__camaraFija = null; return 1 })()`); for (let k = 0; k < 8; k++) { await js(`(() => { ${H}.__bucle(); return 1 })()`); await esperar(60); } }
      await foto(nombre);
    }
    await js(`${H}.__camaraFija = null; 1`);
    const pie = await js(`(() => { const n = ${H}.__aldea.mundo().personas.get('bailarina').npc, js = ${H}.jugador.estado; return { dist: +Math.hypot(n.pos.x - js.pos.x, n.pos.z - js.pos.z).toFixed(2), pose: n.pose, sentado: js.sentado } })()`);
    console.log('  bailando:', JSON.stringify(pie));
    ok(pie.pose === 'tango' && pie.dist < 1.2 && !pie.sentado, 'de pie en la pista, a un paso de ella, en pose de tango');
    const antes = await js(`({ desc: ${H}.jugador.estado.descansado, bailes: ${H}.progreso.cantina.pena.bailes })`);
    const despues = await hasta((x) => x.dalia.fase !== 'baila', 40000, 100);
    const luego = await js(`({ desc: ${H}.jugador.estado.descansado, bailes: ${H}.progreso.cantina.pena.bailes })`);
    console.log('  después:', JSON.stringify(luego));
    ok(luego.bailes === antes.bailes + 1 && luego.desc >= 1.5, `terminó el baile: descansado ${luego.desc} (con el nivel 2 de Pocha, el tango rinde un nivel menos) y una vez más en el cuaderno de la peña`);
    await hasta((x) => x.dalia.fase === 'pista', 30000, 100);
    ok((await pena()).dalia.fase === 'pista', 'Dalia vuelve a la pista');

    // ------------------------------------------------------------ 5. la mesa de truco
    console.log('— la mesa de truco');
    await js(`(() => { const H = ${H}, p = H.__pena().lugar.aMundo(2.7, 2.4), js = H.jugador.estado; H.jugador.ubicar(p.x, p.z, 0); js.pos.set(p.x, H.__cantina().lugar.pisoY() + 0.04, p.z); H.jugador.sentarse(true); return 1 })()`);
    await cuadro(4); await esperar(200);
    const aviso = await js(`${H}.__avisoYa()?.texto || ''`);
    console.log('  aviso:', aviso);
    ok(/Jugar un truco con/.test(aviso), 'sentado a la mesa del rincón, E te invita a una partida de truco con uno de los que juegan');
    await foto('mesa-de-truco-sentado');
    await js(`${tecla('KeyE')} 1`); await cuadro(3); await esperar(300);
    ok(await js(`${H}.__hud.panelAbierto()`), 'E abre el truco (el de las fiestas: truco.js)');
    await foto('truco-jugando', true);
    await js(`${tecla('Escape')} 1`); await cuadro(3);

    // ------------------------------------------------------------ 6. la borrachera
    console.log('— la borrachera');
    await js(`(() => { const H = ${H}, c = H.__cantina(), s = c.lugar.sillas.find((x) => x.mesa.id === 'mesa-1' && x.i === 0), js = H.jugador.estado; js.entumecido = 4;
      H.jugador.ubicar(s.x, s.z, s.mira + Math.PI); js.pos.set(s.x, c.lugar.pisoY() + 0.04, s.z); H.jugador.sentarse(true); js.yaw = s.mira + Math.PI; js.pitch = -0.1; return 1 })()`);
    await hasta((x) => x.ses && x.ses.fase === 'carta', 40000, 50, cantina);
    await js(`(() => { const c = ${H}.__cantina(); return c.pedirItem(c.cartaHoy().find((x) => x.id === 'ginebra'), { medio: 'pesos' }) })()`);
    await hasta((x) => x.servidos.length > 0, 70000, 50, cantina);
    await hasta((x) => x.ses && x.ses.fase === 'libre', 30000, 50, cantina);
    for (let n = 0; n < 3; n++) { await js(`${tecla('KeyE')} 1`); for (let i = 0; i < 50 && (await cantina()).sorbo; i++) { await cuadro(1); await esperar(45); } }
    const nivel1 = await js(`${H}.__cantina().nivelEbrio()`);
    console.log('  nivel:', nivel1);
    ok(nivel1 > 0.9, `una ginebra entera te sube la mareada (${nivel1.toFixed(2)})`);
    const ef = await js(`${H}.__cantina().efectoEbrio(3.3)`);
    ok(ef && Math.abs(ef.roll) + Math.abs(ef.yaw) + Math.abs(ef.pitch) > 0 && Math.abs(ef.roll) < 0.04, `la imagen se mueve apenas (roll ${ef?.roll?.toFixed(3)})`);
    for (const [i, tt] of [[0, 0.6], [1, 2.0]]) { await js(`${H}.__ebrioT = ${tt}; 1`); await cuadro(2); await esperar(200); await foto(`ebrio-${i + 1}`); }
    await js(`(() => { const c = ${H}.progreso.cantina; const a = ${H}.progreso.dia * 24 + ${H}.progreso.horas; c.ebrio = { n: 2.4, t: a }; return 1 })()`);
    ok((await js(`${H}.__cantina().nivelEbrio()`)) > 2, 'más tragos: «torcido» (hasta 3)');
    await js(`(() => { ${H}.ajustes.borrachera = 'apagado'; return 1 })()`);
    ok((await js(`${H}.__cantina().efectoEbrio(3.3)`)) === null, 'con el ajuste apagado, ningún efecto');
    await js(`(() => { ${H}.ajustes.borrachera = 'suave'; return 1 })()`);
    const suave = await js(`${H}.__cantina().efectoEbrio(3.3)`);
    ok(suave && Math.abs(suave.amplitud) > 0 && suave.amplitud < 0.6, 'suave: la mitad');
    await js(`(() => { ${H}.ajustes.borrachera = 'normal'; ${H}.ajustes.movimientoCamara = 'reducido'; return 1 })()`);
    const reducido = await js(`${H}.__cantina().efectoEbrio(3.3)`);
    ok(reducido && reducido.amplitud < 0.25, 'con la cámara reducida, casi nada');
    await js(`(() => { ${H}.ajustes.movimientoCamara = 'normal'; return 1 })()`);
    // se pasa con el tiempo: dos horas de juego
    await js(`(() => { ${H}.progreso.horas += 4; return 1 })()`);
    ok((await js(`${H}.__cantina().nivelEbrio()`)) === 0, 'con el tiempo se pasa');
    await js(`${tecla('KeyR')} 1`); await cuadro(2);

    // ------------------------------------------------------------ 7. entre semana, el guardado y las partidas de antes
    console.log('— entre semana, guardado, partidas viejas');
    await estar();
    await aLaHora(11, 22.0);
    await js(`(() => { const H = ${H}, p = H.__pena().lugar.aMundo(0.2, 3.2); H.jugador.ubicar(p.x, p.z, Math.PI); return 1 })()`);
    for (let k = 0; k < 20; k++) { await js(`(() => { ${H}.__aldea.actualizar(0.5); ${H}.__bucle(); return 1 })()`); await esperar(60); }
    await hasta((x) => x.sentados.length >= 1, 30000, 80);
    const semana = await pena();
    console.log('  entre semana:', JSON.stringify(semana.sentados));
    ok(semana.sentados.length >= 1 && semana.sentados.length <= 3, `un jueves a la noche van ${semana.sentados.length} (hasta 3)`);
    const dd = await poseDalia();
    ok(dd && dd.pose !== 'tango' && dd.pose !== 'chamame', 'sin peña, Dalia no baila');
    await foto('jueves-a-la-noche');
    await js(`(() => { ${H}.guardar?.(); return 1 })()`);
    const g = await js(`JSON.stringify(${H}.progreso.cantina)`);
    ok(/"pena":\{"bailes":1/.test(g) && /"ebrio"/.test(g) && /"chistes"/.test(g), 'la partida guarda tus bailes, la mareada y los chistes que ya salieron');
    await js(`(() => { const P = ${H}.progreso; P.cantina = { visitas: 2, ultima: 3, pedidos: 1, gastado: 100, cuenta: null, fuertes: { dia: 0, n: 0 } }; return 1 })()`);
    const vieja = await js(`(() => { const c = ${H}.__cantina(); try { c.chiste('sentarse', null, true); c.efectoEbrio(1); return { ok: true, nivel: c.nivelEbrio() } } catch (e) { return { ok: false, e: String(e) } } })()`);
    ok(vieja.ok && vieja.nivel === 0, 'una partida de antes de la peña (sin ebrio ni chistes) sigue andando');
    ok(errores.filter((m) => !m.startsWith('FALLÓ')).length === 0, `sin errores en la consola (${errores.filter((m) => !m.startsWith('FALLÓ')).slice(0, 3).join(' | ')})`);
  } catch (err) {
    console.log('ERROR: ' + (err && err.stack ? err.stack : err));
    errores.push('excepción');
  }
  if (errores.length) { console.log(`\n${errores.length} problema(s):\n` + errores.join('\n')); salir(1); } else { console.log('\nTODO BIEN'); salir(0); }
});
