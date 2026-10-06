// Partida real 3.7.2 «La cocina» (Electron + WebGL). Las teclas van de verdad (keydown) y el reloj del juego se
// adelanta a mano donde haría falta esperar horas (se dice dónde):
//   1. armar la parrilla con cruz: el aviso dice qué se asa; E abre el panel de recetas y el 1 prende el fuego;
//   2. el asado completo en pasos: brasas → la carne en la cruz → dar vuelta → sacar (el humo, la carne y los
//      chorizos se ven; lo que sale va a la alacena y al recetario);
//   3. el humo trae a alguien de la aldea (va a la parrilla) y al perro, que se roba un chorizo;
//   4. con lluvia, sin techito no prende; con el techito encima, sí; y a mitad de un asado sin techo, la lluvia
//      lo frena;
//   5. el pan en el horno de barro, en pasos;
//   6. guardar y cargar a mitad de una cocción (en la cocina a leña): sigue donde estaba;
//   7. la alacena se llena y se ve; el recetario en el cuaderno; un vecino enseña y otro cambia; sin errores.
// Uso: npx electron --no-sandbox -r herramientas/al-monitor.cjs pruebas/humo-3-7-2-cocina.cjs
// Perfil propio (HUMO_PERFIL, o una carpeta temporal): borra su localStorage, nunca el de %APPDATA%\Hojarasca.
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-3-7-2-cocina')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 15 minutos'); app.exit(2); }, 15 * 60 * 1000).unref?.();

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
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__cocina && window.__hojarasca.__cocina())').catch(() => false)) return true; }
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
  const aviso = () => js(`(()=>{ const a = ${H}.__avisoYa(); return a ? a.texto : '' })()`);
  const notas = () => js(`document.getElementById('notas').textContent`);
  const seco = () => js(`(()=>{ ${H}.clima.estado.lluvia = 0; return 1 })()`);
  // el reloj del juego: `h` horas más (lo que haría falta esperar), y la cocina se entera
  const avanzar = (h) => js(`(()=>{ const p = ${P}; ${H}.__cocina().actualizar(1); p.horas += ${h}; while (p.horas >= 24) { p.horas -= 24; p.dia++; } ${H}.__cocina().actualizar(1); ${H}.__cocinaMundo().actualizar(0.1); return 1 })()`);
  // una pieza terminada en (x, z) exactos
  const fundarEn = (id, x, z, rot = 0) => js(`(()=>{const H=${H}, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:80,tabla:80,piedra:80});
    const p=H.PLANOS.find(q=>q.id==='${id}'); if(!p) return {error:'no hay plano ${id}'};
    O.elegir(p); const r=O.fundar((${x}),(${z}),(${rot}),H.jugador.estado.pos.y);
    if(!r.ok){ O.elegir(null); return {error:r.motivo}; }
    for (let g=0; g<12 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break; }
    O.elegir(null); P.obras=O.obras.map(o=>o.datos);
    return {ok:r.obra.datos.etapas>=r.obra.plano.etapas.length, x:r.obra.datos.x, z:r.obra.datos.z, y:r.obra.datos.y, rot:r.obra.datos.rot}})()`);
  // una pieza terminada cerca de (cx, cz), probando lugares hasta que uno sirva
  const construirCerca = (id, cx, cz) => js(`(()=>{const H=${H}, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:80,tabla:80,piedra:80});
    const p=H.PLANOS.find(q=>q.id==='${id}'); if(!p) return {error:'no hay plano ${id}'};
    O.elegir(p);
    for (const d of [0, 3, 6, 9, 13, 18]) for (let k=0; k<8; k++) {
      const a=k*Math.PI/4, x=(${cx})+Math.sin(a)*d, z=(${cz})+Math.cos(a)*d;
      const r=O.fundar(x,z,0,H.T.altura(x,z)); if(!r.ok) continue;
      for (let g=0; g<12 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const q=O.avanzar(r.obra,P.materiales); if(!q.ok) break; }
      O.elegir(null); P.obras=O.obras.map(o=>o.datos);
      return {ok:r.obra.datos.etapas>=r.obra.plano.etapas.length, x:r.obra.datos.x, z:r.obra.datos.z, y:r.obra.datos.y, rot:r.obra.datos.rot||0};
    }
    O.elegir(null); return {error:'no hubo lugar para ${id}'}})()`);
  // parado adelante de la obra (frente = +z local), mirándola
  const pararseFrente = (o, d = 1.6) => js(`(()=>{ const H=${H}, j=H.jugador; const r=(${o.rot || 0}), x=(${o.x})+Math.sin(r)*${d}, z=(${o.z})+Math.cos(r)*${d};
    j.ubicar(x, z, Math.atan2(-((${o.x})-x), -((${o.z})-z))); j.estado.pitch=-0.2; for (let i=0;i<3;i++) H.__bucle(); return 1 })()`);
  const obra = (id, o) => `${H}.obras.obras.find(q=>q.plano.id==='${id}' && Math.abs(q.datos.x-(${o.x}))<0.01 && Math.abs(q.datos.z-(${o.z}))<0.01)`;
  const coccion = (id, o) => js(`(()=>{ const q = ${obra(id, o)}; const c = q && ${H}.__cocina().coccionDe(q); return c ? JSON.parse(JSON.stringify(c)) : null })()`);
  const panel = () => js(`(()=>{ const d = document.getElementById('cocina-panel'); return { abierto: !d.classList.contains('oculto'), quien: d.querySelector('.quien').textContent, items: [...d.querySelectorAll('li')].map(li => li.textContent) } })()`);
  const cuanto = (k) => js(`(()=>{ const p = ${P}; return (p.entradas[${JSON.stringify(k)}]?.cantidad || 0) + (p.cosas[${JSON.stringify(k)}] || 0) })()`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();
    // sábado a media mañana, despejado, verano
    await js(`(()=>{ const p = ${P}; p.dia = 6; p.horas = 10.5; ${H}.clima.estado.lluvia = 0; return 1 })()`);
    let e = await js(`JSON.stringify(${P}.cocina)`);
    ok(e === JSON.stringify({ sabe: {}, cambios: {}, hechas: {}, moviles: {}, perro: 0, sobremesa: null }), `partida nueva: la cocina vacía (${e})`);

    // ------------------------------------------------------------ 1. la parrilla
    seccion('1. la parrilla con cruz');
    const ref = await js(`(()=>{ const r = ${H}.T.lugares.refugio; return { x: r.x, z: r.z } })()`);
    const parrilla = await construirCerca('parrilla', ref.x - 14, ref.z + 12);
    ok(parrilla.ok, `se arma la parrilla con cruz (${JSON.stringify(parrilla)})`);
    await js(`(()=>{ const p = ${P}; p.entradas['carne-vaca'] = { dia: 1, hora: 9, cantidad: 2 }; p.entradas.chorizo = { dia: 1, hora: 9, cantidad: 2 }; p.cosas.sal = 2; p.materiales.tronco = 6; return 1 })()`);
    await pararseFrente(parrilla, 1.8);
    let a = await aviso();
    ok(/Asar asado a la cruz/.test(a), `el aviso dice qué se asa («${a}»)`);
    await tecla('KeyE'); await esperar(300);
    let pa = await panel();
    ok(pa.abierto && /parrilla/i.test(pa.quien) && pa.items.length === 2 && /Asado a la cruz/.test(pa.items[0]) && /se puede/.test(pa.items[0]) && /no sabés/.test(pa.items[1]), `E abre el panel de recetas de la parrilla (${JSON.stringify(pa)})`);
    await tecla('Digit1'); await esperar(300);
    let c = await coccion('parrilla', parrilla);
    let gasto = await js(`(()=>{ const p = ${P}; return { carne: p.entradas['carne-vaca'].cantidad, chorizo: p.entradas.chorizo.cantidad, sal: p.cosas.sal || 0, tronco: p.materiales.tronco } })()`);
    pa = await panel();
    ok(c && c.receta === 'asado' && c.paso === 1 && Math.abs(c.falta - 0.75) < 0.01 && !pa.abierto, `el 1 prende el fuego: el asado arranca (${JSON.stringify(c)})`);
    ok(gasto.carne === 0 && gasto.chorizo === 0 && gasto.sal === 1 && gasto.tronco === 4, `se gastan la carne, los chorizos, la sal y dos troncos (${JSON.stringify(gasto)})`);

    // ------------------------------------------------------------ 2. el asado en pasos
    seccion('2. el asado en pasos');
    a = await aviso();
    ok(/brasas/.test(a), `mientras, el aviso dice que se hacen las brasas («${a}»)`);
    await tecla('KeyE'); await esperar(200);
    c = await coccion('parrilla', parrilla);
    ok(c.paso === 1, 'E antes de tiempo no adelanta nada');
    await avanzar(0.8);   // (las brasas: tres cuartos de hora del juego)
    a = await aviso();
    ok(/Poner la carne en la cruz/.test(a), `con las brasas hechas, el aviso dice el paso que sigue («${a}»)`);
    await tecla('KeyE'); await esperar(300);
    c = await coccion('parrilla', parrilla);
    ok(c.paso === 2 && c.falta > 1.4, `E pone la carne en la cruz (${JSON.stringify(c)})`);
    await js(`(()=>{ ${H}.__cocinaMundo().refrescar(); ${H}.__cocinaMundo().actualizar(0.1); return 1 })()`);
    let m = await js(`JSON.stringify(${H}.__cocinaMundo().medir())`);
    m = JSON.parse(m);
    ok(m.humo >= 20 && m.mallas >= 5 && m.luz > 0, `se ve: el fuego, la carne, los chorizos, el humo y la luz (${JSON.stringify(m)})`);
    const olor = await js(`(()=>{ const q = ${obra('parrilla', parrilla)}; return ${H}.__cocina().estadoMundo().find(x => x.o === q)?.humo })()`);
    ok(olor && olor.olor === 'asado' && olor.carne && olor.chorizos, `huele a asado (${JSON.stringify(olor)})`);

    // ------------------------------------------------------------ 3. el humo trae vecinos y al perro
    seccion('3. el humo trae a alguien y al perro');
    // (el domingo a mediodía casi todos tienen el rato libre: el asado se hace a la hora de comer)
    await js(`(()=>{ const p = ${P}; p.dia = 7; p.horas = 12.1; ${H}.__cocina().actualizar(1); return 1 })()`);
    await avanzar(0.05);
    c = await coccion('parrilla', parrilla);
    const invitados = (c.invitados || []).filter((k) => k !== '__nadie');
    ok(invitados.length >= 1, `el olor del asado trae gente de la aldea (${JSON.stringify(c.invitados)})`);
    if (invitados.length) {
      const k = invitados[0];
      const d = await js(`(()=>{ const d = ${H}.__cocina().destino('${k}'); return d ? { x: d.x, z: d.z, lugar: d.lugar, fuera: d.fuera, llegada: !!d.llegada } : null })()`);
      const dist = d ? Math.hypot(d.x - parrilla.x, d.z - parrilla.z) : 99;
      ok(d && d.lugar === 'asado' && d.fuera && dist < 3.2, `${k} va a la parrilla (${JSON.stringify(d)}, a ${dist.toFixed(1)} m)`);
      // la aldea la lleva: con el jugador lejos (más de 90 m), aparece en su lugar; al volver, está ahí
      await js(`(()=>{ const r = ${H}.T.lugares.refugio; ${H}.jugador.ubicar(r.x + 150, r.z, 0); return 1 })()`);
      await js(`(()=>{ for (let i = 0; i < 8; i++) { ${H}.__aldea.actualizar(0.6); ${H}.__aldea.mundo()?.prearmar?.(1e6); } return 1 })()`);
      await pararseFrente(parrilla, 1.8);
      await js(`(()=>{ for (let i = 0; i < 6; i++) { ${H}.__aldea.actualizar(0.6); ${H}.__aldea.mundo()?.prearmar?.(1e6); } return 1 })()`);
      const pos = await js(`(()=>{ const n = ${H}.__aldea.mundo().personas.get('${k}')?.npc; return n ? { x: n.pos.x, z: n.pos.z } : null })()`);
      const dn = pos ? Math.hypot(pos.x - parrilla.x, pos.z - parrilla.z) : 99;
      ok(pos && dn < 6, `${k} está junto a la parrilla (${pos ? dn.toFixed(1) : 'sin figura'} m)`);
    }
    // el perro: con los chorizos en la parrilla y el jugador cerca, al rato va
    await pararseFrente(parrilla, 2.2);
    await js(`(()=>{ for (let i = 0; i < 22; i++) ${H}.__cocina().actualizar(1); return 1 })()`);
    let perro = await js(`JSON.stringify(${H}.__cocina().__perro())`);
    ok(/"fase":"va"/.test(perro), `el perro se tienta y va a la parrilla (${perro})`);
    const antojo = await js(`(()=>{ ${H}.__bucle(); return JSON.stringify(${H}.__mundoPerro().antojo || null) })()`);
    ok(antojo !== 'null', `el perro sabe adónde ir (${antojo})`);
    // (lo acercamos: en la ventana oculta los cuadros van lentos)
    await js(`(()=>{ const f = ${H}.__cocina().__perro(); const pe = ${H}.perro.est.pos; pe.x = f.destino.x + 0.3; pe.z = f.destino.z; for (let i = 0; i < 4; i++) ${H}.__cocina().actualizar(1); return 1 })()`);
    c = await coccion('parrilla', parrilla);
    perro = await js(`JSON.stringify(${H}.__cocina().__perro())`);
    let n = await notas();
    ok(c.robado && /se robó un chorizo/.test(n) && /"fase":"huye"/.test(perro), `¡se robó un chorizo! y se escapa (${perro})`);
    m = JSON.parse(await js(`JSON.stringify(${H}.__cocinaMundo().medir())`));
    ok(m.chorizo, 'con el chorizo en la boca');
    await js(`(()=>{ ${H}.__cocinaMundo().refrescar(); ${H}.__cocinaMundo().actualizar(0.1); return 1 })()`);

    // ------------------------------------------------------------ 2 (sigue). dar vuelta y sacar
    seccion('2. dar vuelta y sacar');
    await avanzar(1.6);
    await pararseFrente(parrilla, 1.8);
    a = await aviso();
    ok(/Dar vuelta la cruz/.test(a), `después, dar vuelta la cruz («${a}»)`);
    await tecla('KeyE'); await esperar(200);
    await avanzar(1.1);
    a = await aviso();
    ok(/Sacar el asado/.test(a), `y al final, sacarlo («${a}»)`);
    const presentes = await js(`(()=>{ const q = ${obra('parrilla', parrilla)}; const c = ${H}.__cocina().coccionDe(q); return (c.invitados || []).filter(k => { const n = ${H}.__aldea.mundo().personas.get(k)?.npc; return n && Math.hypot(n.pos.x - q.datos.x, n.pos.z - q.datos.z) < 6; }).length })()`);
    await tecla('KeyE'); await esperar(300);
    c = await coccion('parrilla', parrilla);
    const asado = await cuanto('asado');
    const coc = await js(`JSON.stringify(${P}.cocina)`);
    ok(!c && asado === Math.max(1, 6 - 1) - Math.min(presentes, Math.max(0, 5 - 2)) && /"asado":1/.test(coc), `sale el asado: ${asado} porciones a la alacena (6, menos el chorizo del perro y lo que comieron ${presentes}) (${coc})`);
    await esperar(4000);
    n = await notas();
    ok(/Comieron todos juntos|asado está a punto/.test(n), 'lo dice al sacar (y si hubo gente, que comieron juntos)');

    // ------------------------------------------------------------ 4. la lluvia y el techito
    seccion('4. con lluvia, el techito');
    await js(`(()=>{ const p = ${P}; p.entradas['carne-vaca'].cantidad = 4; p.entradas.chorizo.cantidad = 4; p.cosas.sal = 3; p.materiales.tronco = 10; p.horas = 15; return 1 })()`);
    await pararseFrente(parrilla, 1.8);
    await js(`(()=>{ ${H}.clima.estado.lluvia = 0.9; return 1 })()`);
    a = await aviso();
    ok(/techito/.test(a), `con lluvia, el aviso pide un techito («${a}»)`);
    await tecla('KeyE'); await esperar(200);
    await js(`(()=>{ ${H}.clima.estado.lluvia = 0.9; return 1 })()`);
    await tecla('Digit1'); await esperar(300);
    c = await coccion('parrilla', parrilla);
    n = await notas();
    ok(!c && /no prende/.test(n), 'sin techito, con lluvia no prende');
    await tecla('Escape'); await esperar(150);
    const techito = await fundarEn('techito-parrilla', parrilla.x, parrilla.z, parrilla.rot || 0);
    ok(techito.ok, `el techito va encima de la parrilla (${JSON.stringify(techito)})`);
    await pararseFrente(parrilla, 1.8);
    await js(`(()=>{ ${H}.clima.estado.lluvia = 0.9; return 1 })()`);
    a = await aviso();
    ok(/Asar asado/.test(a), `con techito, el aviso vuelve a ofrecer el asado («${a}»)`);
    await tecla('KeyE'); await esperar(200);
    await js(`(()=>{ ${H}.clima.estado.lluvia = 0.9; return 1 })()`);
    await tecla('Digit1'); await esperar(300);
    c = await coccion('parrilla', parrilla);
    ok(c && c.receta === 'asado' && c.paso === 1, 'con el techito, el asado arranca bajo la lluvia');
    await js(`(()=>{ ${H}.clima.estado.lluvia = 0.9; ${H}.__cocina().actualizar(1); ${P}.horas += 0.5; ${H}.clima.estado.lluvia = 0.9; ${H}.__cocina().actualizar(1); return 1 })()`);
    c = await coccion('parrilla', parrilla);
    ok(!c.pausa && c.falta < 0.3, `bajo techo la lluvia no lo frena (${JSON.stringify(c)})`);
    // otra parrilla, sin techo: arranca seca y se larga a llover
    const parrilla2 = await construirCerca('parrilla', parrilla.x + 9, parrilla.z - 8);
    ok(parrilla2.ok, `una segunda parrilla, a la intemperie (${JSON.stringify(parrilla2)})`);
    await seco();
    await pararseFrente(parrilla2, 1.8);
    await tecla('KeyE'); await esperar(200);
    await seco();
    await tecla('Digit1'); await esperar(300);
    let c2 = await coccion('parrilla', parrilla2);
    ok(c2 && c2.paso === 1, 'la segunda prende con el cielo seco');
    await js(`(()=>{ ${H}.__cocina().actualizar(1); ${H}.clima.estado.lluvia = 0.9; ${P}.horas += 0.4; ${H}.__cocina().actualizar(1); return 1 })()`);
    c2 = await coccion('parrilla', parrilla2);
    a = await aviso();
    ok(c2.pausa && Math.abs(c2.falta - 0.75) < 0.01 && /lluvia/.test(a), `a la intemperie, la lluvia ahoga las brasas: no corre (${JSON.stringify(c2)}, «${a}»)`);
    await seco();

    // ------------------------------------------------------------ 5. el pan en el horno
    seccion('5. el pan en el horno de barro');
    const horno = await construirCerca('horno', ref.x - 22, ref.z + 4);
    ok(horno.ok, `se arma el horno (${JSON.stringify(horno)})`);
    await js(`(()=>{ const p = ${P}; p.cosas.harina = 2; p.materiales.tronco = 3; delete p.entradas['pan-casero']; return 1 })()`);
    await pararseFrente(horno, 1.4);
    a = await aviso();
    ok(/Hornear pan casero/.test(a), `el aviso dice qué se hornea («${a}»)`);
    await tecla('KeyE'); await esperar(200);
    pa = await panel();
    ok(pa.abierto && /horno/i.test(pa.quien), `el panel del horno (${JSON.stringify(pa.items)})`);
    await tecla('Digit1'); await esperar(300);
    c = await coccion('horno', horno);
    ok(c && c.receta === 'pan-casero' && (await js(`${P}.cosas.harina || 0`)) === 0 && (await js(`${P}.materiales.tronco`)) === 2, 'prender el horno: dos medidas de harina y un tronco');
    await avanzar(1.05);
    await pararseFrente(horno, 1.4);
    a = await aviso();
    ok(/meter el pan/.test(a), `con el barro caliente, meter el pan («${a}»)`);
    await tecla('KeyE'); await esperar(200);
    await avanzar(1.05);
    await tecla('KeyE'); await esperar(300);
    ok((await cuanto('pan-casero')) === 3 && !(await coccion('horno', horno)), 'sacar el pan: tres panes caseros');

    // ------------------------------------------------------------ 6. guardar y cargar a mitad
    seccion('6. guardar y cargar a mitad de una cocción');
    const cocinaLena = await construirCerca('cocina-lena', ref.x - 18, ref.z - 6);
    ok(cocinaLena.ok, `se arma la cocina a leña (${JSON.stringify(cocinaLena)})`);
    await js(`(()=>{ const p = ${P}; p.entradas.leche = { dia: 1, hora: 9, cantidad: 2 }; p.cosas.cacao = 1; p.cosas.azucar = 1; p.materiales.tronco = 3; return 1 })()`);
    await pararseFrente(cocinaLena, 1.3);
    a = await aviso();
    ok(/Cocinar chocolate caliente/.test(a), `la cocina a leña ofrece el chocolate (a ojo: no lo sabés) («${a}»)`);
    await tecla('KeyE'); await esperar(200);
    pa = await panel();
    ok(pa.abierto && pa.items.some((t) => /Chocolate caliente \(a ojo\)/.test(t)), `en el panel, a ojo (${JSON.stringify(pa.items)})`);
    const iChoc = pa.items.findIndex((t) => /Chocolate caliente/.test(t));
    await tecla(`Digit${iChoc + 1}`); await esperar(300);
    await avanzar(0.6);
    await pararseFrente(cocinaLena, 1.3);
    await tecla('KeyE'); await esperar(300);
    c = await coccion('cocina-lena', cocinaLena);
    ok(c && c.receta === 'chocolate-caliente' && c.paso === 2 && c.aOjo, `la leche con el cacao, en la olla (${JSON.stringify(c)})`);
    await avanzar(0.2);
    const antes = await coccion('cocina-lena', cocinaLena);
    await js(`(()=>{ ${H}.guardar(); return 1 })()`);
    await abrir();
    ok(await listo(), 'la partida se vuelve a cargar');
    await entrar();
    const despues = await coccion('cocina-lena', cocinaLena);
    ok(despues && despues.receta === antes.receta && despues.paso === antes.paso && Math.abs(despues.falta - antes.falta) < 0.02, `sigue donde estaba (${JSON.stringify(antes)} → ${JSON.stringify(despues)})`);
    await avanzar(0.4);
    await pararseFrente(cocinaLena, 1.3);
    a = await aviso();
    ok(/Servir el chocolate/.test(a), `y se termina («${a}»)`);
    await tecla('KeyE'); await esperar(300);
    ok((await cuanto('chocolate-caliente')) === 4 && /"chocolate-caliente":\{/.test(await js(`JSON.stringify(${P}.cocina.sabe)`)), 'cuatro tazas de chocolate, y la receta queda aprendida');
    // comerlo: saca el frío y da buen paso
    const comer = await js(`(()=>{ const j = ${H}.jugador.estado; j.entumecido = 3; j.descansado = 0; const ok = ${H}.__cocina().comer('chocolate-caliente'); return { ok, entumecido: j.entumecido, descansado: j.descansado, quedan: ${P}.entradas['chocolate-caliente'].cantidad } })()`);
    ok(comer.ok && comer.entumecido === 0 && comer.descansado >= 1 && comer.quedan === 3, `comer un chocolate saca el frío y da buen paso (${JSON.stringify(comer)})`);

    // ------------------------------------------------------------ 7. la alacena, el recetario y los vecinos
    seccion('7. la alacena, el recetario y los vecinos');
    const alacena = await construirCerca('alacena', ref.x - 12, ref.z - 9);
    ok(alacena.ok, `se arma la alacena (${JSON.stringify(alacena)})`);
    await js(`(()=>{ const p = ${P}; p.entradas['mermelada-frambuesa'] = { dia: 1, hora: 9, cantidad: 3 }; p.entradas['dulce-leche'] = { dia: 1, hora: 9, cantidad: 2 }; p.entradas.locro = { dia: 1, hora: 9, cantidad: 4 }; p.cosas.azucar = 2; p.cosas.harina = 3; p.cosas.yerba = 2; return 1 })()`);
    await pararseFrente(alacena, 1.3);
    await js(`(()=>{ ${H}.__cocinaMundo().refrescar(); ${H}.__cocinaMundo().actualizar(0.1); return 1 })()`);
    m = JSON.parse(await js(`JSON.stringify(${H}.__cocinaMundo().medir())`));
    a = await aviso();
    ok(m.alacenas === 1 && /Mirar la alacena/.test(a), `la alacena se llena y se ve (${JSON.stringify(m)}, «${a}»)`);
    await tecla('KeyE'); await esperar(300);
    n = await notas();
    ok(/En la alacena/.test(n), 'E muestra lo que hay en la alacena');
    // el recetario en el cuaderno
    await js(`(()=>{ ${H}.abrir('cuaderno'); return 1 })()`); await esperar(300);
    const pest = await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista .pestanas button')].find(x => /Recetario/.test(x.textContent)); if (b) b.click(); return !!b })()`);
    await esperar(300);
    const rec = await js(`(()=>({ lista: document.getElementById('cuaderno-lista').textContent, ficha: document.getElementById('cuaderno-ficha').textContent }))()`);
    ok(pest && /recetas en el recetario/.test(rec.lista) && /Asado a la cruz/.test(rec.lista) && /Lleva:/.test(rec.ficha), `el recetario en el cuaderno (${rec.lista.slice(0, 120)}…)`);
    await js(`(()=>{ ${H}.volverAlJuego(); return 1 })()`); await esperar(300);
    // un vecino enseña (la abuela, el locro) y otro cambia (Mario: carne por troncos), por el menú de la charla
    const charla = await js(`(()=>{ const V = ${H}.__vecindad(); const C = ${H}.__cocina();
      const op = C.opciones('abuela').map(o => o.titulo);
      const ens = C.elegir({ clave: 'abuela' }, 'cocina-ensenar');
      ${P}.materiales.tronco = 5; const antes = ${P}.entradas['carne-vaca']?.cantidad || 0;
      const sub = C.elegir({ clave: 'padre' }, 'cocina-cambiar');
      const r = C.elegir({ clave: 'padre' }, 'cocina:cambio:0');
      const otra = C.elegir({ clave: 'padre' }, 'cocina-cambiar');
      return { op, sabe: !!${P}.cocina.sabe.locro, renglones: ens.renglones?.length, sub: sub.sub?.opciones?.map(o => o.titulo), carne: (${P}.entradas['carne-vaca']?.cantidad || 0) - antes, tronco: ${P}.materiales.tronco, otra: otra.renglones } })()`);
    ok(charla.op.some((t) => /enseñás a hacer locro/.test(t)) && charla.sabe && charla.renglones >= 2, `la abuela te enseña el locro (${JSON.stringify(charla.op)})`);
    ok(charla.sub?.length >= 2 && charla.carne === 2 && charla.tronco === 2 && /ya cambiamos/.test(String(charla.otra)), `Mario cambia carne por troncos, una vez por día (${JSON.stringify(charla)})`);
    // en el menú de la charla de verdad (si la figura está armada)
    const menu = await js(`(()=>{ const V = ${H}.__vecindad(); const n = V.npcDe('madre'); if (!n) return null; const s = V.abrir(n); return s ? V.menu(s).opciones.map(o => o.titulo) : null })()`);
    ok(!menu || menu.some((t) => /Cambiar algo para la cocina/.test(t)), `el trueque está en el menú de la charla de Gladys (${JSON.stringify(menu)})`);
  } catch (e) {
    errores.push(`excepción: ${e && e.stack ? e.stack : e}`);
    console.log('ERROR', e && e.stack ? e.stack : e);
  }
  ok(!errores.some((x) => /Uncaught|TypeError|ReferenceError/.test(x)), 'sin errores en la consola');
  console.log(errores.length ? `FALLÓ: ${errores.length}` : 'humo 3.7.2 cocina: OK');
  for (const x of errores) console.log('  ·', x);
  app.exit(errores.length ? 1 : 0);
});
