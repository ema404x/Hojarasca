// Partida real 3.7.3 «La trochita» mejorada (Electron + WebGL), en el Relax. Las teclas van de verdad (keydown) y el
// tren se pone donde hace falta (se dice dónde):
//   1. el tren de siempre (sin mejoras): la locomotora vieja con los dos coches de segunda;
//   2. subir por la puerta de cualquier coche (el de atrás de todo) y bajar en el andén;
//   3. manejar: la caldera y el freno del taller llegan a la cabina; sin arenero, con lluvia, las ruedas patinan;
//      con arenero, no; el silbato del taller (el de pájaro) suena con Espacio;
//   4. el taller termina las mejoras (`aplicarMejoras`): aparecen el farol, el quitanieves, el arenero, los banderines,
//      la pintura y el nombre, y los vagones de la composición; nada se compila en el momento;
//   5. cada vagón que se usa: la salamandra (se va el frío, los vecinos charlan), el comedor (la cocina móvil con su
//      fuego y su olla, y unos mates), el mirador, tu caballo en la jaula (sube montado y baja con vos), el furgón
//      (más fletes) y el dormitorio (se duerme en viaje);
//   6. la nevada: sin quitanieves el tren se planta antes de la nieve (y pasa la cuadrilla); con, pasa y la abre;
//   7. de noche con el farol (foco y haz) y sin él; sin errores en la consola.
// Uso: npx electron --no-sandbox -r herramientas/al-monitor.cjs pruebas/humo-3-7-3-tren.cjs
// Perfil propio (HUMO_PERFIL, o una carpeta temporal): borra su localStorage, nunca el de %APPDATA%\Hojarasca.
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-3-7-3-tren')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 15 minutos'); app.exit(2); }, 15 * 60 * 1000).unref?.();

const COMPLETO = {
  loco: { caldera: 3, freno: 3, farol: true, silbato: 'pajaro', quitanieves: true, arenero: true, pintura: { cuerpo: '#2f5a3a', franja: '#e8c870', ruedas: '#c8402a' }, nombre: 'La Hojarasca', banderines: true },
  vagones: { pasajeros: true, comedor: true, carga: true, caballo: true, mirador: true, dormitorio: true },
  composicion: ['pasajeros', 'comedor', 'caballo', 'mirador'],
};

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
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
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.tren && window.__hojarasca.__cocina && window.__hojarasca.__cocina())').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const P = `${H}.progreso`;
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano' }));`;
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const tecla = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true })); return 1 })()`);
  const sostener = (code, si) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('${si ? 'keydown' : 'keyup'}', { code: '${code}', bubbles: true })); return 1 })()`);
  const aviso = () => js(`(()=>{ const a = ${H}.__avisoYa(); return a ? a.texto : '' })()`);
  const notas = () => js(`document.getElementById('notas')?.textContent || ''`);
  const cuadros = async (n, ms = 16) => { for (let i = 0; i < n; i++) { await js(`${H}.__bucle(); 1`); if (ms) await esperar(ms); } };
  // el tren parado en una parada (con el primer coche de pasajeros frente al andén) y vos en el andén
  const pararEn = (cual = 'aldea', espera = 600) => js(`(()=>{ const H = ${H}, t = H.tren, p = ${cual === 'aldea' ? 't.paradas.find((q) => q.aldea)' : `t.paradas[${cual}]`};
    t.est.s = t.poste(p) % t.largo; t.est.vel = 0; t.est.parado = ${espera}; t.est.proxima = p; window.__parada = p.nombre;
    return { nombre: p.nombre, s: p.s, poste: t.poste(p) } })()`);
  // en el mundo, un punto del tren: `coche` (índice en la composición, o 'loco'), `z` en el marco del vagón, al costado `lado` m
  const puntoDelTren = (coche, z, lado) => `(()=>{ const t = ${H}.tren, off = ${coche === 'loco' ? 0 : `t.tren.offCoches[${coche}]`}; const p = t.enVia(t.est.s + off + ${z}); const nx = Math.cos(p.ang), nz = -Math.sin(p.ang); return { x: p.x + nx * ${lado}, z: p.z + nz * ${lado}, y: p.y } })()`;
  const ponerEn = (pt) => js(`(()=>{ const q = ${pt}; ${H}.jugador.ubicar(q.x, q.z, 0); ${H}.jugador.estado.pitch = 0; return q })()`);
  const mejoras = (e) => js(`(()=>{ ${P}.tren = ${JSON.stringify(e)}; const r = ${H}.__aplicarMejorasTren(${P}.tren); ${H}.__bucle(); return r })()`);
  const piezas = () => js(`${H}.tren.tren.piezasVisibles()`);
  // el tren andando entre dos paradas, lejos de las dos (para la nieve)
  const lejosDeParadas = () => js(`(()=>{ const t = ${H}.tren, L = t.largo, ps = t.paradas.map((p) => t.poste(p) % L).sort((a, b) => a - b);
    let mejor = 0, hueco = 0; ps.forEach((s, i) => { const sig = i + 1 < ps.length ? ps[i + 1] : ps[0] + L; if (sig - s > hueco) { hueco = sig - s; mejor = s; } });
    t.est.s = (mejor + 40) % L; const prox = t.paradas.reduce((a, b) => { const da = ((t.poste(a) - t.est.s) % L + L) % L, db = ((t.poste(b) - t.est.s) % L + L) % L; return db < da ? b : a; }, t.paradas[0]);
    t.est.proxima = prox; t.est.vel = 6; t.est.parado = 0; return hueco })()`);

  try {
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`localStorage.clear(); ${ajustes} 1`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();

    seccion('1. el tren de siempre, sin mejoras');
    // (una partida nueva no trae nada del taller: `progreso.tren` vacío)
    await js(`(()=>{ const nuevo = ${P}.tren === undefined; delete ${P}.tren; delete ${P}.trenViaje; ${H}.__aplicarMejorasTren(undefined); window.__nuevo = nuevo; return 1 })()`);
    await pararEn('aldea');
    await ponerEn(puntoDelTren('loco', 8, 6));
    await cuadros(3);
    const base = await js(`(()=>{ const t = ${H}.tren.tren; return { mejorado: !!t.lugares, comp: t.composicion, piezas: t.piezasVisibles(), medir: t.medir(), estado: window.__nuevo } })()`);
    ok(base.mejorado, `en el Relax, la trochita es la Baldwin (tren.js)${base.estado ? ', y la partida nueva no trae nada del taller' : ''}`);
    ok(JSON.stringify(base.comp) === '["segunda","segunda2"]', `sin vagones del taller, los dos coches de segunda de siempre (${base.comp})`);
    ok(base.piezas.includes('loco.farolViejo') && base.piezas.includes('loco.quitapiedras') && !base.piezas.some((p) => /loco\.(farol|haz|quitanieves|arenero|banderines|nombre)$/.test(p)), `la locomotora vieja: farolito, quitapiedras, sin mejoras (${base.piezas.filter((p) => p.startsWith('loco')).join(', ')})`);
    ok(base.medir.dibujos <= 7 && base.medir.largo < 40, `el tren de siempre: ${base.medir.dibujos} dibujos, ${base.medir.triangulos} triángulos, ${base.medir.largo} m`);

    seccion('2. subir por cualquier coche y bajar en el andén');
    const par = await pararEn('aldea');
    await cuadros(2);
    // la puerta de atrás del último coche (lejos del andén), del lado del andén
    await ponerEn(puntoDelTren(1, -(4.4 + 0.42), 1.9));
    await cuadros(2);
    ok(await js(`${H}.tren.puedeSubir(${H}.jugador.estado)`), `al lado de la puerta de atrás del segundo coche se puede subir (${par.nombre})`);
    ok(/Subir a la trochita/.test(await aviso()), `el aviso lo dice: «${await aviso()}»`);
    await tecla('KeyE'); await cuadros(2);
    let ya = await js(`(()=>{ const a = ${H}.tren.asientoActual(); return { enTren: ${H}.jugador.estado.enTren, coche: a?.coche, vagon: a?.vagon } })()`);
    ok(ya.enTren && ya.coche === 1, `subiste al coche de esa puerta (${JSON.stringify(ya)})`);
    for (let i = 0; i < 4; i++) await tecla('KeyW');
    ya = await js(`(()=>{ const a = ${H}.tren.asientoActual(); return { coche: a?.coche, z: a?.z } })()`);
    ok(ya.coche === 0 || ya.z > -3.6, `con W se camina por el tren hacia adelante (${JSON.stringify(ya)})`);
    ok(/Bajar del tren/.test(await aviso()), `parado, el aviso ofrece bajar: «${await aviso()}»`);
    await tecla('KeyE'); await cuadros(2);
    const abajo = await js(`(()=>{ const j = ${H}.jugador.estado, p = ${H}.tren.paradas.find((q) => q.nombre === window.__parada); return { enTren: j.enTren, d: Math.hypot(j.pos.x - p.anden.x, j.pos.z - p.anden.z) } })()`);
    ok(!abajo.enTren && abajo.d < 3, `bajaste en el andén (a ${abajo.d.toFixed(1)} m del medio)`);

    seccion('3. manejar: caldera, freno, arenero y silbato');
    ok(await mejoras({ loco: { caldera: 3, freno: 2, silbato: 'pajaro' } }), 'el taller aplica las mejoras (aplicarMejoras)');
    await pararEn(0, 600);
    await ponerEn(puntoDelTren('loco', -2.6, 2.2));
    await cuadros(2);
    ok(await js(`${H}.tren.puedeConducir(${H}.jugador.estado)`) && /cabina/.test(await aviso()), `al lado de la cabina se sube a manejar: «${await aviso()}»`);
    await tecla('KeyE'); await cuadros(3);
    const cab = await js(`(()=>({ conduce: ${H}.tren.conduciendo(), manejo: ${H}.__ctxTren.manejo, agarre: ${H}.__ctxTren.agarre }))()`);
    ok(cab.conduce && Math.abs(cab.manejo.traccion - 1.66) < 0.01 && Math.abs(cab.manejo.freno - 1.7) < 0.01 && cab.agarre === 1, `la caldera y el freno llegan a la cabina (${JSON.stringify(cab)})`);
    // el silbato del taller: el de pájaro (sus caños y toques), con Espacio
    await js(`(()=>{ window.__silbos = []; const s = ${H}.sonido.silbato.bind(${H}.sonido); ${H}.sonido.silbato = (pos, tipo) => { window.__silbos.push(tipo); return s(pos, tipo); }; return 1 })()`);
    await tecla('Space'); await cuadros(1);
    const silbo = await js(`window.__silbos.map((t) => (t && typeof t === 'object' ? t.nombre : String(t)))`);
    ok(silbo.length >= 1 && /pájaro/.test(silbo[0]), `Espacio silba con el silbato del taller (${silbo})`);
    // con lluvia y sin arenero las ruedas patinan; con arenero, no
    await js(`(()=>{ ${H}.clima.estado.lluvia = 1; ${H}.__ctxTren.agarre = 1; return 1 })()`);
    await esperar(600); await cuadros(2);
    await sostener('KeyW', true);
    let patino = false;
    for (let i = 0; i < 70 && !patino; i++) { await cuadros(1, 40); patino = await js(`!!${H}.tren.est.cabina.patina`); }
    await sostener('KeyW', false);
    ok(patino, `con la vía mojada y sin arenero, abrir el regulador hace patinar (agarre ${await js(`${H}.__ctxTren.agarre`)})`);
    ok(/patinan/.test(await notas()), 'y se avisa una vez');
    await mejoras({ loco: { caldera: 3, freno: 2, silbato: 'pajaro', arenero: true } });
    await js(`(()=>{ const c = ${H}.tren.est.cabina; c.regulador = 0; c.vel = 0; ${H}.tren.est.vel = 0; return 1 })()`);
    await esperar(600); await cuadros(2);
    await sostener('KeyW', true);
    let patina2 = false, vel = 0;
    for (let i = 0; i < 60; i++) { await cuadros(1, 40); const r = await js(`[!!${H}.tren.est.cabina.patina, ${H}.tren.est.vel]`); patina2 = patina2 || r[0]; vel = r[1]; }
    await sostener('KeyW', false);
    ok(!patina2 && vel > 0.5, `con el arenero no patina y arranca (${vel.toFixed(2)} m/s)`);
    await js(`(()=>{ ${H}.clima.estado.lluvia = 0; return 1 })()`);
    // se baja en el andén (el tren puesto en la parada, frenado)
    await js(`(()=>{ const t = ${H}.tren, p = t.paradas[0]; t.est.s = t.poste(p) % t.largo; t.est.cabina.vel = 0; t.est.cabina.regulador = 0; t.est.vel = 0; return 1 })()`);
    await cuadros(3);
    await tecla('KeyE'); await cuadros(2);
    ok(!(await js(`${H}.tren.conduciendo()`)), 'bajaste de la cabina en el andén');

    seccion('4. el taller termina todo: se ve, sin compilar nada');
    await pararEn('aldea', 900);
    await ponerEn(puntoDelTren('loco', 3, 7));
    await cuadros(4);
    const prog0 = await js(`${H}.renderer.info.programs.length`);
    const v0 = await js(`${H}.tren.tren.version`);
    await mejoras(COMPLETO);
    await cuadros(4);
    const tod = await js(`(()=>{ const t = ${H}.tren.tren; return { comp: t.composicion, piezas: t.piezasVisibles(), version: t.version, medir: t.medir(), nombre: t.nombre() } })()`);
    ok(JSON.stringify(tod.comp) === JSON.stringify(COMPLETO.composicion) && tod.version !== v0, `la composición nueva (${tod.comp})`);
    for (const p of ['loco.farol', 'loco.quitanieves', 'loco.arenero', 'loco.banderines', 'loco.nombre']) ok(tod.piezas.includes(p), `se ve ${p}`);
    ok(!tod.piezas.includes('loco.farolViejo') && !tod.piezas.includes('loco.quitapiedras'), 'y ya no lo viejo');
    ok(tod.nombre === 'La Hojarasca' && tod.medir.largo > 50 && tod.medir.largo < 60, `el nombre pintado y el largo (${tod.nombre}, ${tod.medir.largo} m)`);
    // de noche, en invierno, con el caballo a bordo y la cocina prendida: todo junto, y ningún programa nuevo
    await js(`(()=>{ ${P}.horas = 22.5; ${H}.__U().uInvierno.value = 1; ${H}.tren.tren.subirCaballo(true); ${P}.cocina.moviles['tren-comedor'] = { receta: 'locro', paso: 2, falta: 1, dia: ${P}.dia }; ${H}.tren.taparVia([{ desde: ${H}.tren.est.s + 6, hasta: ${H}.tren.est.s + 30 }]); return 1 })()`);
    await cuadros(8);
    await js(`(()=>{ ${P}.horas = 12; ${H}.__U().uInvierno.value = 0; ${H}.tren.tren.subirCaballo(false); delete ${P}.cocina.moviles['tren-comedor']; ${H}.tren.taparVia(null); return 1 })()`);
    await cuadros(4);
    const prog1 = await js(`${H}.renderer.info.programs.length`);
    ok(prog1 === prog0, `ningún programa nuevo al rearmar el tren, prender el farol, la nieve, el caballo y la cocina (${prog0} → ${prog1})`);

    seccion('5a. pasajeros con salamandra');
    await pararEn('aldea', 900);
    // (por el lado de afuera, lejos del puesto de cargas del andén)
    await ponerEn(puntoDelTren(0, -(4.4 + 0.42), -1.9));
    await cuadros(2);
    await tecla('KeyE'); await cuadros(2);
    ok(await js(`${H}.jugador.estado.enTren && ${H}.tren.asientoActual()?.vagon === 'pasajeros'`), `subiste al coche de pasajeros por la puerta de atrás, del lado de afuera (${await js(`${H}.tren.asientoActual()?.vagon`)})`);
    ok(await js(`${H}.tren.irA((a) => a.calor)`) && await js(`!!${H}.lugarDelTren()?.calor`), 'te sentás al lado de la salamandra');
    await js(`(()=>{ ${H}.tren.est.parado = 0.001; ${H}.jugador.estado.entumecido = 3; return 1 })()`);
    await cuadros(4);
    // (si mirás a la guarda, el aviso ofrece hablarle: se mira lo del lugar)
    const avS = await js(`${H}.avisoLugarDelTren()?.texto || ''`);
    ok(/salamandra/.test(avS), `andando, el aviso lo dice: «${avS}»`);
    // (el reloj: dos horas de viaje junto a la estufa)
    await js(`(()=>{ ${P}.horas += 0.5; return 1 })()`); await cuadros(3);
    const ent = await js(`${H}.jugador.estado.entumecido`);
    ok(ent < 3, `al calor de la salamandra se va el entumecimiento (3 → ${ent})`);
    const via = await js(`${H}.tren.tren.viajeros()`);
    await js(`(()=>{ ${H}.__charlaTren.t = 0; return 1 })()`); await cuadros(2);
    const dicho = await js(`document.getElementById('charla-aldea')?.textContent || ''`);
    ok(via.length === 2 && /:/.test(dicho), `viajan dos vecinos (${via}) y charlan: «${dicho}»`);

    seccion('5b. comedor: la cocina y unos mates');
    ok(await js(`${H}.tren.irA((a) => a.cocina)`), 'vas a la cocina del comedor');
    await cuadros(2);
    const avC = await aviso();
    ok(avC.length > 0 && !/Bajar del tren/.test(avC), `el aviso es el de la cocina: «${avC}»`);
    await tecla('KeyE'); await cuadros(1);
    ok(await js(`${H}.__cocina().panelAbierto()`), 'E abre las recetas de la cocina del comedor (la cocina móvil de la 3.7.2)');
    await tecla('Escape'); await js(`(()=>{ ${H}.__cocina().cerrarPanel(); ${H}.volverAlJuego?.(); return 1 })()`);
    await js(`(()=>{ ${P}.cocina.moviles['tren-comedor'] = { receta: 'dulce-leche', paso: 2, falta: 1, dia: ${P}.dia }; return 1 })()`);
    await cuadros(3);
    let pz = await piezas();
    ok(pz.includes('comedor.fuego') && pz.includes('comedor.olla-dulce') && !pz.includes('comedor.ollaFija'), `cocinando, se ven el fuego y la olla de cobre (${pz.filter((p) => p.startsWith('comedor')).join(', ')})`);
    await js(`(()=>{ delete ${P}.cocina.moviles['tren-comedor']; return 1 })()`); await cuadros(2);
    pz = await piezas();
    ok(!pz.includes('comedor.fuego') && pz.includes('comedor.ollaFija'), 'sin nada al fuego, la cocina apagada');
    ok(await js(`${H}.tren.irA((a) => a.mesa)`), 'te sentás a una mesa');
    await js(`(()=>{ ${H}.jugador.estado.entumecido = 2; return 1 })()`);
    ok(/Tomar unos mates/.test(await aviso()), `el aviso: «${await aviso()}»`);
    await tecla('KeyE'); await cuadros(1);
    ok(/mates en el comedor/.test(await notas()) && (await js(`${H}.jugador.estado.entumecido`)) === 0, 'unos mates: se va el frío');
    ok(!/Tomar unos mates/.test(await aviso()), 'y por un rato no hay más');

    seccion('5c. mirador');
    ok(await js(`${H}.tren.irA((a) => a.mirador)`) && await js(`!!${H}.lugarDelTren()?.mirador`), 'en el mirador (las fotos de animales salen desde más lejos: fotos.js)');

    seccion('5d. tu caballo en la jaula');
    await pararEn('aldea', 900);
    await tecla('KeyE'); await cuadros(2);   // (te bajás: el tren está parado en la aldea)
    ok(!(await js(`${H}.jugador.estado.enTren`)), 'bajaste');
    const jaula = await js(`(()=>{ ${P}.cosas.caballo = 1; const t = ${H}.tren, i = t.tren.composicion.indexOf('caballo'); const p = t.enVia(t.est.s + t.tren.offCoches[i]); const nx = Math.cos(p.ang), nz = -Math.sin(p.ang);
      ${P}.caballo.x = p.x + nx * 3; ${P}.caballo.z = p.z + nz * 3; ${H}.jugador.ubicar(p.x + nx * 3.2, p.z + nz * 3.2, 0); return { i } })()`);
    await cuadros(2);
    ok(await js(`${H}.caballoCerca()`), 'tu caballo está al lado de la jaula');
    await js(`${H}.montar(); 1`); await cuadros(2);
    ok(await js(`${H}.jaulaCerca()`) && /jaula/.test(await aviso()), `montado al lado de la jaula: «${await aviso()}»`);
    await tecla('KeyE'); await cuadros(3);
    const subio = await js(`({ caballo: ${H}.viajeTren().caballo, enTren: ${H}.jugador.estado.enTren, montado: !!${H}.jugador.estado.montado, aBordo: ${H}.tren.tren.caballoABordo(), cerca: ${H}.caballoCerca() })`);
    ok(subio.caballo && subio.enTren && !subio.montado && subio.aBordo && !subio.cerca, `el caballo sube a la jaula y vos al tren (${JSON.stringify(subio)})`);
    // el viaje a la parada siguiente (el tren puesto ahí) y te bajás: baja con vos
    await js(`(()=>{ const t = ${H}.tren, p = t.paradas.find((q) => !q.aldea); t.est.s = t.poste(p) % t.largo; t.est.vel = 0; t.est.parado = 300; window.__parada = p.nombre; return 1 })()`);
    await cuadros(2);
    await js(`(()=>{ ${H}.tren.irA((a) => !a.plataforma && !a.cocina && !a.mesa && !a.cama); return 1 })()`);
    await tecla('KeyE'); await cuadros(2);
    const bajo = await js(`(()=>{ const p = ${H}.tren.paradas.find((q) => q.nombre === window.__parada), c = ${P}.caballo; return { caballo: ${H}.viajeTren().caballo, enTren: ${H}.jugador.estado.enTren, d: Math.hypot(c.x - p.anden.x, c.z - p.anden.z) } })()`);
    ok(!bajo.caballo && !bajo.enTren && bajo.d < 20, `al bajarte en ${await js('window.__parada')}, tu caballo baja con vos (a ${bajo.d.toFixed(1)} m del andén)`);
    ok(/bajó con vos/.test(await notas()), 'y se avisa');

    seccion('5e. furgón de carga: más fletes');
    const fletes = await js(`(()=>{ const c = ${H}.__cargas(), p = ${H}.tren.paradas[0]; c.abrir(p); while (c.modo() !== 'fletes') c.pasarModo(1); const con = c.filas().filter((f) => f.flete).length; c.cerrar();
      ${P}.tren = { ...${P}.tren, composicion: ['pasajeros', 'comedor', 'caballo', 'mirador'] }; ${H}.__aplicarMejorasTren(${P}.tren);
      c.abrir(p); while (c.modo() !== 'fletes') c.pasarModo(1); const sin = c.filas().filter((f) => f.flete).length; c.cerrar(); return { con, sin } })()`);
    ok(fletes.sin === 2, `sin furgón, los dos fletes de siempre (${fletes.sin})`);
    const conFurgon = await js(`(()=>{ const c = ${H}.__cargas(), p = ${H}.tren.paradas[0]; ${P}.tren = { ...${P}.tren, composicion: ['pasajeros', 'carga', 'dormitorio', 'mirador'] }; ${H}.__aplicarMejorasTren(${P}.tren);
      c.abrir(p); while (c.modo() !== 'fletes') c.pasarModo(1); const n = c.filas().filter((f) => f.flete).length; const d = document.querySelector('#cargas .dicho')?.textContent || ''; c.cerrar(); return { n, d } })()`);
    ok(conFurgon.n === 4 && /de 5/.test(conFurgon.d), `con el furgón, cuatro por día y hasta cinco a la vez (${JSON.stringify(conFurgon)})`);

    seccion('5f. dormitorio: dormir en viaje');
    await pararEn('aldea', 900);
    await ponerEn(puntoDelTren(0, -(4.4 + 0.42), -1.9));
    await cuadros(2);
    await tecla('KeyE'); await cuadros(2);
    const dia0 = await js(`${P}.dia`);
    await js(`(()=>{ ${P}.horas = 22.2; ${H}.tren.irA((a) => a.cama); ${H}.tren.est.parado = 0; return 1 })()`);
    await cuadros(2);
    ok(/Dormir en la cucheta/.test(await aviso()), `de noche, en la cucheta: «${await aviso()}»`);
    await tecla('KeyE');
    await esperar(4200); await cuadros(3);
    const desperto = await js(`({ dia: ${P}.dia, horas: ${P}.horas, enTren: ${H}.jugador.estado.enTren, nota: document.getElementById('notas')?.textContent || '' })`);
    ok(desperto.dia === dia0 + 1 && desperto.enTren, `dormiste en el tren y amaneciste arriba (${JSON.stringify(desperto).slice(0, 160)})`);

    seccion('6. la nevada');
    // sin quitanieves: el tren automático se planta antes de la nieve
    await mejoras({ loco: { farol: true }, vagones: { pasajeros: true }, composicion: ['pasajeros'] });
    await lejosDeParadas();
    await js(`(()=>{ const t = ${H}.tren; t.est.parado = 0; t.est.vel = 6; t.est.objetivo = 7; window.__nieve = t.taparVia([{ desde: t.est.s + 30, hasta: t.est.s + 55 }]); window.__desde = t.est.s + 30; return window.__nieve.length })()`);
    let plantado = false;
    for (let i = 0; i < 400 && !plantado; i++) { await cuadros(1, 25); plantado = await js(`${H}.tren.est.vel === 0 && ${H}.tren.est.esperaNieve > 0`); }
    const antesNieve = await js(`(()=>{ const t = ${H}.tren; const d = ((window.__desde - (t.est.s + 5.2)) % t.largo + t.largo) % t.largo; return { d: +d.toFixed(2), vel: t.est.vel } })()`);
    ok(plantado && antesNieve.d < 2.5, `sin quitanieves, se planta en el borde de la nieve (${JSON.stringify(antesNieve)})`);
    ok(/tapada de nieve/.test(await notas()), 'y se avisa');
    await js(`(()=>{ ${H}.tren.est.esperaNieve = 1e4; return 1 })()`); await cuadros(2);
    ok((await js(`${H}.tren.viaNevada().length`)) === 0 && /cuadrilla/.test(await notas()), 'pasa la cuadrilla con las palas y la vía queda abierta');
    // con quitanieves: pasa despacio y la abre
    await mejoras({ loco: { farol: true, quitanieves: true }, vagones: { pasajeros: true }, composicion: ['pasajeros'] });
    await lejosDeParadas();
    await js(`(()=>{ const t = ${H}.tren; t.est.parado = 0; t.est.vel = 6; t.taparVia([{ desde: t.est.s + 12, hasta: t.est.s + 26 }]); return 1 })()`);
    let maxEnNieve = 0, abierta = false;
    for (let i = 0; i < 500 && !abierta; i++) {
      await cuadros(1, 25);
      const r = await js(`(()=>{ const t = ${H}.tren; return [t.est.vel, t.viaNevada().length, !!t.est.enNieve] })()`);
      if (r[2]) maxEnNieve = Math.max(maxEnNieve, r[0]);
      abierta = r[1] === 0;
    }
    ok(abierta, `con el quitanieves, el tren pasa y deja la vía abierta (${await js(`JSON.stringify({ s: ${H}.tren.est.s, vel: ${H}.tren.est.vel, nieve: ${H}.tren.viaNevada(), parado: ${H}.tren.est.parado, prox: ${H}.tren.est.proxima?.nombre })`)})`);
    ok(maxEnNieve > 0 && maxEnNieve <= 5, `en la nieve va despacio (máximo ${maxEnNieve.toFixed(2)} m/s)`);

    seccion('7. de noche, con el farol y sin él');
    await js(`(()=>{ ${H}.tren.est.subido = false; ${H}.jugador.estado.enTren = false; return 1 })()`);   // (afuera del tren)
    await mejoras(COMPLETO);
    await pararEn('aldea', 900);
    await ponerEn(puntoDelTren('loco', 8, 4));
    await js(`(()=>{ ${P}.horas = 22.6; return 1 })()`);
    await esperar(800); await cuadros(6);
    const conFarol = await js(`(()=>{ const t = ${H}.tren.tren; return { foco: t.luzFaro.intensity, haz: t.mallas.haz.visible } })()`);
    ok(conFarol.foco > 0 && conFarol.haz, `con el farol del taller, el foco y el haz (${JSON.stringify(conFarol)})`);
    await mejoras({ ...COMPLETO, loco: { ...COMPLETO.loco, farol: false } });
    await cuadros(4);
    const sinFarol = await js(`(()=>{ const t = ${H}.tren.tren; return { foco: t.luzFaro.intensity, haz: t.mallas.haz.visible, viejo: t.piezasVisibles().includes('loco.farolViejo') } })()`);
    ok(sinFarol.foco === 0 && !sinFarol.haz && sinFarol.viejo, `sin el farol, el farolito de kerosén y la vía a oscuras (${JSON.stringify(sinFarol)})`);
    // los interiores se apagan de lejos
    await ponerEn(puntoDelTren('loco', 120, 0));
    await cuadros(4);
    pz = await piezas();
    ok(!pz.some((p) => p.endsWith('.adentro')), `de lejos, los interiores no se dibujan (${pz.filter((p) => p.endsWith('.adentro'))} · cámara a ${await js(`(()=>{ const c = ${H}.camara.position, v = ${H}.tren.tren.vagon(0).position; return Math.hypot(c.x - v.x, c.z - v.z).toFixed(1) })()`)} m)`);
  } catch (e) {
    errores.push(`excepción: ${e && e.stack ? e.stack : e}`);
    console.log('ERROR', e && e.stack ? e.stack : e);
  }
  ok(!errores.some((x) => /Uncaught|TypeError|ReferenceError/.test(x)), 'sin errores en la consola');
  console.log(errores.length ? `FALLÓ: ${errores.length}` : 'humo 3.7.3 tren: OK');
  for (const x of errores) console.log('  ·', x);
  app.exit(errores.length ? 1 : 0);
});
