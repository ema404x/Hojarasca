// Partida real 3.7.5 «Tradiciones», los rincones y la casa (Electron + WebGL). Lo que se apura a mano se dice; lo demás,
// con las teclas de verdad (E, W, Shift) y el aviso:
//   1. partida nueva: los rincones montados (los doce duendes, el camino con su puentecito, los faroles, el potrero);
//   2. encontrar un duende: al lado, el aviso dice «Anotar…»; E lo anota en el cuaderno;
//   3. un gol en el potrero: E arma el picado (los chicos y un vecino vienen a jugar), la pelota delante del arco, E
//      patea y entra; el cuaderno lo anota;
//   4. trabajar la huerta comunitaria: E siembra o carpe, una vez por día;
//   5. el sulky: Tito te lo hace (en la charla, como un jugador), a la mañana está; subís con E, el zaino tira por el camino
//      (con Shift al galope; el reloj del cuadro se corre a mano, 0,05 s por paso) y llegás a la aldea;
//   6. tu casa: con dos amigos te dan el lote, traés el material con E, al día siguiente está; abrís la puerta con E,
//      caminás con W y estás adentro;
//   7. guardar y cargar: todo sigue; sin programas nuevos a mitad de juego; sin errores en la consola.
// Uso: npx electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/humo-3-7-5-rincones.cjs
// Perfil propio (HUMO_PERFIL, o una carpeta temporal): borra su localStorage, nunca el de %APPDATA%\Hojarasca.
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-3-7-5-rincones')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 15 minutos'); app.exit(2); }, 15 * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) consola.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const P = `${H}.progreso`;
  const J = `${H}.__rincones.juego()`, M = `${H}.__rincones.mundo()`;
  const R = `${J}.rincones()`;
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(window.__hojarasca && window.__hojarasca.__rincones && window.__hojarasca.__rincones.juego() && window.__hojarasca.__aldea)`).catch(() => false)) return true; }
    return false;
  };
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'auto' }, ${JSON.stringify(extra || {})})));`;
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500); await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`); };
  const abajo = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); return 1 })()`);
  const arriba = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true })); return 1 })()`);
  const tecla = async (code) => { await abajo(code); await arriba(code); };
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const asentar = async (t = 3) => { await cuadros(4); for (let i = 0; i < t; i++) { await esperar(110); await cuadros(2); } };
  const aviso = () => js(`(()=>{ const a = ${H}.__avisoYa(); return a ? a.texto : '' })()`);
  const notas = () => js(`document.getElementById('notas').textContent`);
  const anotada = (id) => js(`!!${P}.entradas['${id}']`);
  // el reloj del cuadro a mano: el jugador (y lo que lleva: el sulky) y los rincones, de a 0,05 s
  const correr = (n, dt = 0.05) => js(`(()=>{ const Hh = ${H}; for (let i = 0; i < ${n}; i++) { Hh.jugador.actualizar(${dt}); Hh.__rincones.juego().actualizar(${dt}); } Hh.__bucle(); return 1 })()`);
  // pararse en (x, z) mirando a (ax, az)
  const pararse = (x, z, ax, az, pitch = -0.3) => js(`(()=>{ const j = ${H}.jugador; j.ubicar(${x}, ${z}, Math.atan2(-((${ax}) - (${x})), -((${az}) - (${z})))); j.estado.pitch = ${pitch}; j.estado.sentado = false; return 1 })()`);
  const programas = () => js(`${H}.renderer.info.programs.length`);
  const montarAldea = () => js(`(async () => { const A = ${H}.__aldeaMundo(); if (A) { await A.listo(); A.montarCola(); } return 1 })()`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes()} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();
    await asentar();

    // ------------------------------------------------------------ 1. los rincones montados
    seccion('1. partida nueva');
    let e = await js(`(()=>{ const m = ${M}.medir(), r = ${R}; return { m, r: { duendes: Object.keys(r.duendes).length, casa: r.casa.estado, sulky: r.sulky.listo, minga: r.camino.minga } } })()`);
    ok(e.m.duendes === 12 && e.r.duendes === 0, `los doce duendes en el mundo, ninguno anotado (${e.m.duendes})`);
    ok(e.m.camino > 500 && e.m.puentes >= 1 && e.m.faroles >= 12, `el camino al refugio (${e.m.camino} m, ${e.m.puentes} puentecito, ${e.m.faroles} faroles)`);
    ok(e.r.casa === 'libre' && e.r.sulky === 0 && e.r.minga === 0, 'el lote libre, sin sulky, el camino sin minga');
    ok(e.m.montarMs < 400, `montar los rincones en la carga: ${Math.round(e.m.montarMs)} ms (el camino, ${Math.round(e.m.caminoMs)} ms)`);
    const prog0 = await programas();

    // ------------------------------------------------------------ 2. un duende
    seccion('2. encontrar un duende');
    const d = await js(`(()=>{ const d = ${M}.duendes().find((q) => q.id === 'duende-lenera'); return { x: d.x, z: d.z, y: d.y } })()`);
    await pararse(d.x + 1.1, d.z + 0.4, d.x, d.z, -0.6);
    await asentar();
    let a = await aviso();
    ok(a === 'Anotar el duende de la leñera', `al lado, el aviso: «${a}»`);
    await tecla('KeyE'); await asentar(1);
    e = await js(`(()=>({ r: ${R}.duendes['duende-lenera'] || 0, n: Object.keys(${R}.duendes).length }))()`);
    ok(e.r > 0 && e.n === 1 && await anotada('duende-lenera'), 'E: anotado en el cuaderno');
    ok(/Encontraste el duende de la leñera/.test(await notas()), 'y la nota lo dice');
    a = await aviso();
    ok(/ya lo anotaste/.test(a), `después, el aviso: «${a}»`);

    // ------------------------------------------------------------ 3. un gol en el potrero
    seccion('3. un gol en el potrero');
    await js(`(()=>{ ${P}.horas = 15; return 1 })()`);
    const pot = await js(`(()=>{ const p = ${M}.potrero(); return { c: p.centro, a: p.aMundo(0, -3) } })()`);
    await pararse(pot.a.x, pot.a.z, pot.c.x, pot.c.z, -0.2);
    await montarAldea();
    for (let i = 0; i < 6; i++) { await js(`${H}.__aldea.actualizar(0.6); 1`); await asentar(1); }
    a = await aviso();
    ok(a === 'Armar un picado con los chicos', `en el potrero, el aviso: «${a}»`);
    await tecla('KeyE'); await asentar(1);
    e = await js(`(()=>{ const p = ${J}.partido(); return p ? { jugadores: p.jugadores.map((j) => j.clave), conVos: p.jugadores.every((j) => j.npc.conVos) } : null })()`);
    ok(e && e.jugadores.length >= 1 && e.conVos, `E: el picado (${e?.jugadores.join(', ')})`);
    ok(await anotada('potrero'), 'el potrero, en el cuaderno');
    // (los que juegan, lejos del arco un momento: que el tiro sea tuyo)
    await js(`(()=>{ const p = ${J}.partido(), P = ${M}.potrero(); for (const j of p.jugadores) { const w = P.aMundo(-5, -8); j.npc.pos.x = w.x; j.npc.pos.z = w.z; j.enfria = 99; } return 1 })()`);
    // la pelota en el punto penal, vos detrás mirando al arco del fondo
    const tiro = await js(`(()=>{ const p = ${J}.partido(), P = ${M}.potrero(); p.pelota.u = 0; p.pelota.v = 6; p.pelota.vu = 0; p.pelota.vv = 0; p.pelota.y = 0; p.pelota.enJuego = true; p.pelota.quieta = true;
      const yo = P.aMundo(0, 5.3), arco = P.aMundo(0, 12); return { yo, arco } })()`);
    await pararse(tiro.yo.x, tiro.yo.z, tiro.arco.x, tiro.arco.z, -0.05);
    await asentar(1);
    a = await aviso();
    ok(a === 'Patear la pelota', `al lado de la pelota, el aviso: «${a}»`);
    await tecla('KeyE');
    let goles = 0;
    for (let i = 0; i < 40 && !goles; i++) { await js(`(()=>{ for (let k = 0; k < 6; k++) ${J}.actualizar(0.05); ${H}.__bucle(); return 1 })()`); goles = await js(`${R}.futbol.goles`); }
    ok(goles >= 1, `E: ¡gol! (${goles})`);
    ok(await anotada('gol-potrero'), 'el gol, en el cuaderno');
    await js(`${J}.terminarPartido('silencio'); 1`);
    e = await js(`(()=>({ libres: ${H}.gente.gente.filter((g) => ['nene', 'nena', 'andinista', 'padre', 'carpintero', 'pescador'].includes(g.claveAldea)).every((g) => !g.conVos) }))()`);
    ok(e.libres, 'al terminar, los chicos y los vecinos vuelven a lo suyo');

    // ------------------------------------------------------------ 4. la huerta comunitaria
    seccion('4. la huerta comunitaria');
    await js(`(()=>{ ${P}.horas = 10; return 1 })()`);
    const can = await js(`(()=>{ const k = ${M}.huertas().comunitaria[0]; return { x: k.x, z: k.z } })()`);
    await pararse(can.x + 0.9, can.z + 0.6, can.x, can.z, -0.5);
    await asentar(2);
    a = await aviso();
    ok(/huerta de todos/.test(a) && /^(Sembrar|Carpir)/.test(a), `al lado del cantero, el aviso: «${a}»`);
    const antes = await js(`JSON.stringify(${R}.huerta.c0 || null)`);
    await tecla('KeyE'); await asentar(1);
    e = await js(`(()=>({ c: ${R}.huerta.c0 || null, dia: ${P}.dia }))()`);
    ok(e.c && e.c.trabajado === e.dia && JSON.stringify(e.c) !== antes, 'E: trabajada hoy');
    ok(await anotada('huerta-comunitaria'), 'la huerta de todos, en el cuaderno');
    a = await aviso();
    ok(/hoy ya la trabajaste/.test(a), `y por hoy, listo: «${a}»`);
    e = await js(`${M}.matas()?.hojas?.count ?? -1`);
    ok(e > 0, `las matas se ven (${e})`);
    ok(await js(`${H}.escena.getObjectByName('huerta')?.count ?? 0`) === 0, 'y no se mezclan con las de tus canteros');

    // ------------------------------------------------------------ 5. el sulky
    seccion('5. el sulky');
    // (el zaino ya es tuyo: se apura a mano)
    await js(`(()=>{ ${P}.cosas.caballo = 1; Object.assign(${P}.materiales, { tabla: 40, tronco: 30, piedra: 30 }); return 1 })()`);
    // Tito, en la charla: «Pedirle un sulky»
    const r1 = await js(`(()=>{ const s = { clave: 'carpintero', sub: null, vueltas: 0 }; const o = ${J}.opciones('carpintero'); const op = o.find((x) => x.id === 'rincones:sulky'); const r = op ? ${J}.elegir(s, op.id) : null; return { op: op?.titulo || null, r } })()`);
    ok(/Pedirle un sulky/.test(r1.op || '') && r1.r?.tipo === 'renglones', `Tito: «${r1.op}»`);
    e = await js(`(()=>({ s: ${R}.sulky, tablas: ${P}.materiales.tabla }))()`);
    ok(e.s.pedido > 0 && e.tablas === 30, 'pagaste con tablas y troncos');
    // a la mañana siguiente, en el refugio
    await js(`(()=>{ ${P}.dia += 1; ${P}.horas = 8; for (let i = 0; i < 3; i++) ${J}.actualizar(1.1); return 1 })()`);
    ok(await js(`${J}.tieneSulky()`), 'a la mañana, el sulky es tuyo');
    const sp = await js(`(()=>{ const p = ${J}.poseSulky(); return { x: p.x, z: p.z, rumbo: p.rumbo, s: p.s } })()`);
    ok(sp.s === 0, 'está en la punta del refugio');
    await pararse(sp.x + Math.cos(sp.rumbo) * 1.2, sp.z - Math.sin(sp.rumbo) * 1.2, sp.x, sp.z);
    await asentar(2);
    a = await aviso();
    ok(a === 'Subir al sulky (a la aldea)', `al lado, el aviso: «${a}»`);
    await tecla('KeyE'); await asentar(1);
    e = await js(`(()=>({ en: ${H}.jugador.estado.enSulky, atado: ${R}.sulky.atado, viaje: !!${J}.viaje() }))()`);
    ok(e.en && e.atado && e.viaje, 'E: arriba, con el zaino atado a las varas');
    a = await aviso();
    ok(a === 'Bajar del sulky', `arriba, el aviso: «${a}»`);
    // al galope (Shift apretado) por el camino, con el reloj del cuadro a mano
    await abajo('ShiftLeft');
    let llego = false, pasos = 0, vmax = 0, cab = null;
    for (; pasos < 100 && !llego; pasos++) {
      await correr(40);
      const q = await js(`(()=>({ en: ${H}.jugador.estado.enSulky, v: ${J}.viaje()?.v || 0, c: ${H}.__caballo?.()?.est ? { x: ${H}.__caballo().est.x, z: ${H}.__caballo().est.z, vis: ${H}.__caballo().est.visible } : null }))()`);
      vmax = Math.max(vmax, q.v); if (q.c) cab = q.c;
      llego = !q.en;
    }
    await arriba('ShiftLeft');
    e = await js(`(()=>{ const js = ${H}.jugador.estado, A = ${H}.__aldeaMundo(); return { d: Math.hypot(js.pos.x - A.centro.x, js.pos.z - A.centro.z), donde: ${R}.sulky.donde } })()`);
    ok(llego && e.donde === 'aldea', `llegaste a la aldea en sulky (${pasos * 2} s de juego; al galope, ${vmax.toFixed(1)} m/s)`);
    ok(e.d < 70, `bajaste en la aldea (a ${e.d.toFixed(0)} m del centro)`);
    ok(cab && cab.vis, 'el zaino tiraba del sulky (se ve)');
    ok(await anotada('sulky') && await anotada('camino-aldea'), 'el sulky y el camino, en el cuaderno');

    // ------------------------------------------------------------ 6. tu casa
    seccion('6. tu casa en la calle de la Loma');
    // (dos amigos en la aldea: se apura a mano)
    await js(`(()=>{ for (const k of ['jefe', 'abuela']) for (let i = 0; i < 7; i++) ${H}.__rincones.amistad(k, 10); return 1 })()`);
    const lote = await js(`(()=>{ const s = ${M}.casa().sitio; return { x: s.x, z: s.z, rot: s.rot, y: s.y } })()`);
    const frente = { x: lote.x + Math.sin(lote.rot) * 5, z: lote.z + Math.cos(lote.rot) * 5 };
    await pararse(frente.x, frente.z, lote.x, lote.z);
    await asentar(2);
    a = await aviso();
    ok(a === 'Pedir este lote para tu casa', `en el lote, el aviso: «${a}»`);
    await tecla('KeyE'); await asentar(1);
    ok(await js(`${R}.casa.estado`) === 'obra', 'E: el lote es tuyo');
    a = await aviso();
    ok(/^Traer material para tu casa/.test(a), `el aviso: «${a}»`);
    await tecla('KeyE'); await asentar(1);
    e = await js(`(()=>({ c: ${R}.casa, m: { ...${P}.materiales } }))()`);
    ok(e.c.estado === 'lista' && e.c.lista === (await js(`${P}.dia`)) + 1, 'E: todo el material; mañana está');
    // al otro día, a las 9
    await js(`(()=>{ ${P}.dia += 1; ${P}.horas = 9; return 1 })()`);
    for (let i = 0; i < 20 && (await js(`${M}.casa().etapa`)) !== 4; i++) await correr(5);
    ok(await js(`${M}.casa().etapa`) === 4, 'la casa, levantada');
    // la puerta: E la abre; con W se entra
    // (enfrente de la puerta, a lo largo de su eje)
    const puerta = await js(`(()=>{ const s = ${M}.casa().sitio, p = ${M}.casa().puertas[0]; const fx = Math.sin(s.rot), fz = Math.cos(s.rot); return { nombre: p.nombre, afuera: { x: p.x + fx * 2.6, z: p.z + fz * 2.6 }, adentro: { x: p.x - fx * 2, z: p.z - fz * 2 } } })()`);
    ok(puerta.nombre === 'la puerta de tu casa', `la puerta: «${puerta.nombre}»`);
    await pararse(puerta.afuera.x, puerta.afuera.z, puerta.adentro.x, puerta.adentro.z, 0);
    await asentar(2);
    // (de frente a la puerta)
    for (let i = 0; i < 30; i++) {
      const s = await js(`(()=>{ const a = ${H}.__avisoYa(); return a ? a.texto : '' })()`);
      if (/^Abrir/.test(s)) { await tecla('KeyE'); await asentar(1); break; }
      await abajo('KeyW'); await correr(2); await arriba('KeyW');
    }
    await abajo('KeyW');
    let adentro = false;
    for (let i = 0; i < 30 && !adentro; i++) { await correr(4); adentro = await js(`${M}.casa() && (()=>{ const js = ${H}.jugador.estado, s = ${M}.casa().sitio, c = Math.cos(s.rot), sn = Math.sin(s.rot), dx = js.pos.x - s.x, dz = js.pos.z - s.z; return Math.abs(dx * c - dz * sn) < 2.7 && Math.abs(dx * sn + dz * c) < 2.2 })()`); }
    await arriba('KeyW');
    await correr(4);
    if (!adentro) console.log('  (dónde quedó:', await js(`JSON.stringify((()=>{ const js = ${H}.jugador.estado, s = ${M}.casa().sitio, c = Math.cos(s.rot), sn = Math.sin(s.rot), dx = js.pos.x - s.x, dz = js.pos.z - s.z; const ps = ${M}.casa().puertas.map((p) => ({ n: p.nombre, x: +(p.x - s.x).toFixed(2), z: +(p.z - s.z).toFixed(2), o: p.objetivo, a: p.abierta })); return { u: +(dx * c - dz * sn).toFixed(2), v: +(dx * sn + dz * c).toFixed(2), y: +(js.pos.y - s.y).toFixed(2), aviso: ${H}.__avisoYa()?.texto, ps } })())`), ')');
    ok(adentro, 'caminando, entraste a tu casa');
    ok(await anotada('casa-propia'), 'tu casa, en el cuaderno');

    // ------------------------------------------------------------ 7. guardar y cargar
    seccion('7. guardar y cargar');
    const guardado = await js(`(()=>{ ${H}.guardar?.(); return JSON.stringify(${R}) })()`);
    const prog1 = await programas();
    ok(prog1 - prog0 <= 1, `sin programas nuevos a mitad de juego (${prog0} → ${prog1})`);
    await abrir();
    ok(await listo(), 'se volvió a cargar');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    const r2 = await js(`JSON.stringify(${R})`);
    const g1 = JSON.parse(guardado), g2 = JSON.parse(r2);
    ok(g2.duendes['duende-lenera'] > 0 && g2.futbol.goles >= 1 && g2.casa.estado === 'lista' && g2.sulky.donde === 'aldea' && g2.huerta.c0, 'todo sigue después de cargar');
    ok(JSON.stringify(g1.casa) === JSON.stringify(g2.casa) && JSON.stringify(g1.duendes) === JSON.stringify(g2.duendes), 'igual a lo guardado');
  } catch (err) {
    ok(false, `la prueba se cortó en «${donde}»: ${err && err.stack ? err.stack : err}`);
  }
  for (const m of consola) console.log('consola:', m);
  ok(consola.length === 0, 'sin errores en la consola');
  console.log(errores.length ? `FALLÓ: ${errores.length}` : 'OK: humo 3.7.5 rincones');
  app.exit(errores.length ? 1 : 0);
});
