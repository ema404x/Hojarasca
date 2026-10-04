// Partida real 3.6 (mecánicas): lo que se hace en cada lugar de la Aldea de los Duendes (PLAN_ALDEA
// §14), en Electron y con WebGL, con la aldea completa (los once locales abiertos):
//  · sentarse en los bancos de la plaza, las sillas de la biblioteca, los pupitres y el salón;
//  · el aljibe (una vez por día), la bandera a las 8 y a las 19 (y el jefe en la soga), el duende;
//  · un libro en la mesa de lectura y el préstamo (se lee en el refugio y se devuelve);
//  · el pizarrón y los dibujos de la escuela; la campana del andén cuando llega el tren; el horario;
//  · el té en la casa de té (sentado, la galesa lo trae); las chispas de la fragua cerca y apagadas
//    lejos (y el humo del horno y las abejas); el baile del sábado; la camilla; las casillas; el mapa;
//  · los cuentos del domingo; todas las puertas de la aldea se abren con E;
//  · lo que cuesta: menos de 0,3 ms por cuadro en la plaza, no más de 6 dibujos, ningún programa nuevo.
// Uso: npx electron pruebas/humo-3-6-mecanicas.cjs --user-data-dir=<carpeta propia>
//      (o HUMO_PERFIL=<carpeta>; si no, una propia en la carpeta temporal). Borra el localStorage
//      del perfil: usar uno aparte.
const { app, BrowserWindow, dialog } = require('electron');
// que la prueba nunca muestre un cuadro de error en la pantalla del usuario: lo escribe y sale
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
else if (!process.argv.some((a) => a.startsWith('--user-data-dir'))) app.setPath('userData', path.join(os.tmpdir(), 'hojarasca-humo-3-6-mecanicas'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const CARTA = (/id: '(c-[a-z-]+)'/.exec(fs.readFileSync(path.join(raiz, 'src', 'correo.js'), 'utf8')) || [])[1];

// lo que corre en la página (como humo-3-6-mundo)
const AYUDA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, col = H.col;
  const A = window.__m36m = {};
  A.tecla = (tipo, code) => document.dispatchEvent(new KeyboardEvent(tipo, { code, bubbles: true }));
  A.toque = (code) => { A.tecla('keydown', code); A.tecla('keyup', code); };
  A.paso = (dt = 0.05) => { H.jugador.actualizar(dt); H.puertas.actualizar(dt); };
  A.poner = (x, z, yaw = 0) => { const e = H.jugador.estado; if (e.sentado) H.jugador.sentarse(false); H.jugador.ubicar(x, z, yaw); e.vel.set(0, 0, 0); e.vy = 0; e.sentado = false; for (let i = 0; i < 10; i++) A.paso(); e.yaw = yaw; };
  // parado sobre el punto de una mecánica, mirando hacia donde mira el punto
  A.enPunto = (c, adelante = 0) => A.poner(c.x + Math.sin(c.mira) * adelante, c.z + Math.cos(c.mira) * adelante, c.mira + Math.PI);
  A.apartarGente = (x, z, r = 14) => {
    for (const g of H.gente?.gente || []) if (!g.aBordo && Math.hypot(g.pos.x - x, g.pos.z - z) < r) { g.pos.x += 60; g.pos.z += 60; }
    for (const st of H.__aldea.mundo()?.personas?.values() || []) if (st.npc && Math.hypot(st.npc.pos.x - x, st.npc.pos.z - z) < r) { st.npc.pos.x += 60; st.npc.pos.z += 60; st.npc.camino = []; }
  };
  A.dibujos = () => { const R = H.renderer; R.info.autoReset = false; R.info.reset(); R.render(H.escena, H.camara); const d = { dibujos: R.info.render.calls, tri: R.info.render.triangles }; R.info.autoReset = true; return d; };
  A.mirar = (x, z, tx, tz) => { const e = H.jugador.estado; if (e.sentado) H.jugador.sentarse(false); H.jugador.ubicar(x, z, Math.atan2(-(tx - x), -(tz - z))); e.pitch = -0.04; e.vel.set(0, 0, 0); for (let i = 0; i < 6; i++) H.__bucle(); };
  A.cand = (tipo, edificio) => H.__mecanicas().candidatos().find((c) => c.tipo === tipo && (!edificio || c.edificio === edificio));
  A.charla = () => ({ abierta: !document.getElementById('charla').classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent });
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const medidas = {};
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 180 s (${donde})`)), 180000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea)').catch(() => false)) return true; } return false; };
  const H = 'window.__hojarasca';
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'media', clima: 'despejado', musica: true, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano' }, ${JSON.stringify(extra || {})})));`;
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  // la ventana oculta no corre requestAnimationFrame: cuadros con tiempo de verdad en el medio
  const asentar = async (veces = 6) => { for (let i = 0; i < veces; i++) { await esperar(160); await cuadros(3); } };
  const avisoAhora = async () => { await cuadros(4); for (let i = 0; i < 3; i++) { await esperar(120); await cuadros(2); } return (await js(`${H}.__aviso()`)).replace(/^(E|F|G|H|T|B|Y|·)(?=[A-ZÁÉÍÓÚÑ¿«])/, ''); };
  const tecla = async (code = 'KeyE', despues = 3) => { await js(`(()=>{ window.__m36m.toque('${code}'); return 1 })()`); await cuadros(despues); };
  const charla = () => js(`window.__m36m.charla()`);
  // lee la página entera (E hasta que se cierra); devuelve los renglones
  const leerTodo = async () => { const r = []; for (let i = 0; i < 8; i++) { const c = await charla(); if (!c.abierta) break; r.push(c.texto); await tecla('KeyE', 1); } return r; };
  const aldeaMontada = async (maximo = 900) => {
    await js(`${H}.__aldeaMundo().listo().then(() => 1)`);
    for (let i = 0; i < maximo; i++) { const c = await js(`(()=>{ ${H}.__bucle(); return ${H}.__aldeaMundo().medir().cola })()`); if (c === 0) return i; if (i % 20 === 19) await esperar(30); }
    return -1;
  };
  const avisos = () => js(`${H}.__avisos()`);
  const reloj = (dia, horas) => js(`(()=>{ const P = ${H}.progreso; P.dia = ${dia}; P.horas = ${horas}; return 1 })()`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes()} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia (calidad media)');
    await entrar();
    await js(AYUDA);
    ok(await js(`!!${H}.__mecanicas()`), 'las mecánicas de la aldea, armadas en el Relax');

    // ------------------------------------------------------------ llegar, con la aldea completa
    seccion('la aldea completa');
    await js(`(()=>{ const P = ${H}.progreso, a = P.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
      a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.llegando = null; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); a.descubierta = 1;
      P.dia = 1; P.horas = 10; P.cosas.hacha = 1; return 1 })()`);
    await js(`(()=>{ const M = ${H}.__aldeaMundo(); const o = M.aMundo(6, 29), a = M.aMundo(10, 60); window.__m36m.mirar(o.x, o.z, a.x, a.z); M.actualizar(4, ${H}.camara.position); return 1 })()`);
    const vueltas = await aldeaMontada();
    await asentar(6);
    await js(`${H}.__mecanicas().revisar(); 1`);
    await cuadros(4);
    let e = await js(`(()=>{ const m = ${H}.__mecanicas(); const md = m.medir(); return { md, tipos: [...new Set(m.candidatos().map((c) => c.tipo))], sentaderos: m.sentaderos().length, campana: !!m.animables().campana, banderas: m.animables().banderas.length, fuelle: !!m.animables().fuelle, rueca: !!m.animables().rueca } })()`);
    ok(vueltas >= 0 && e.md.listo, `la aldea montada (${vueltas} cuadros) y las mecánicas leyeron sus puntos (${e.md.candidatos} lugares, ${e.md.lectura} sillas de lectura, ${e.md.estufas} estufas)`);
    ok(['aljibe', 'duende', 'prestamo', 'pizarron', 'dibujos', 'horario', 'casillas', 'mapa', 'camilla', 'estufa'].every((t) => e.tipos.includes(t)), `cada lugar con lo suyo (${e.tipos.join(', ')})`);
    ok(e.sentaderos > 60, `los asientos de la aldea son sentaderos (${e.sentaderos})`);
    ok(e.campana && e.banderas === 3 && e.fuelle && e.rueca, `lo que se mueve: la campana del andén, ${e.banderas} banderas, el fuelle y la rueca`);
    await js(`(()=>{ window.__progs0 = new Set(${H}.renderer.info.programs.map((p) => p.cacheKey)); return 1 })()`);
    const sonidoListo = await js(`!!${H}.sonido?.ctx`);
    console.log(`  motor de sonido: ${sonidoListo ? 'andando' : 'sin contexto de audio (la ventana oculta)'}`);

    // ------------------------------------------------------------ sentarse
    seccion('sentarse en todo lo que es asiento');
    for (const [id, nombre] of [['plaza', 'un banco de la plaza'], ['biblioteca', 'una silla de lectura'], ['escuela', 'un pupitre de la escuela'], ['salon', 'una silla del salón']]) {
      const s = await js(`(()=>{ const s = ${H}.__mecanicas().sentaderos().find((q) => q.aldea === '${id}' && q.nombre === '${nombre}'); if (!s) return null;
        const fx = -Math.sin(s.mira), fz = -Math.cos(s.mira), px = s.x + fx * 0.95, pz = s.z + fz * 0.95;
        window.__m36m.apartarGente(s.x, s.z, 8); window.__m36m.poner(px, pz, Math.atan2(-(s.x - px), -(s.z - pz))); ${H}.jugador.estado.pitch = -0.35; return s })()`);
      if (!s) { ok(false, `${id}: hay «${nombre}»`); continue; }
      const av = await avisoAhora();
      await tecla();
      const r = await js(`(()=>{ const e = ${H}.jugador.estado; return { sentado: !!e.sentado, d: Math.hypot(e.pos.x - ${s.x}, e.pos.z - ${s.z}) } })()`);
      ok(av === `Sentarte en ${nombre}` && r.sentado && r.d < 0.6, `${id}: «${av}» y E te sienta (a ${r.d.toFixed(2)} m)`);
      if (id === 'biblioteca') {
        // ------------------------------------------------------------ un libro en la mesa
        seccion('sentado a la mesa de lectura: un libro');
        const av2 = await avisoAhora();
        await tecla();
        const c = await charla();
        const reng = await leerTodo();
        const reg = await js(`Object.keys(${H}.progreso.entradas).filter((k) => k.startsWith('libro-'))`);
        ok(av2 === 'Leer un libro' && c.abierta && /^Biblioteca Popular, /.test(c.quien), `«${av2}»: se abre «${c.quien}»`);
        ok(reng.length >= 3 && reg.length === 1, `se lee la página (${reng.length - 1} partes) y queda en el cuaderno (${reg.join(', ')})`);
      }
      await js(`(()=>{ ${H}.jugador.sentarse(false); return 1 })()`);
    }

    // ------------------------------------------------------------ la plaza
    seccion('el aljibe');
    await reloj(1, 10);
    let c = await js(`window.__m36m.cand('aljibe')`);
    await js(`(()=>{ const A = window.__m36m, c = ${JSON.stringify(c)}; A.apartarGente(c.x, c.z, 6); A.enPunto(c); ${H}.jugador.estado.descansado = 0; return 1 })()`);
    let av = await avisoAhora();
    await tecla();
    e = await js(`({ d: ${H}.jugador.estado.descansado, uso: ${H}.progreso.mecanicas?.usos?.aljibe })`);
    ok(av === 'Sacar agua del aljibe' && e.d >= 1 && e.uso === 1, `«${av}»: un trago, un rato descansado (${e.d} h)`);
    await js(`${H}.jugador.estado.descansado = 0; 1`);
    await avisoAhora(); await tecla();
    e = await js(`({ d: ${H}.jugador.estado.descansado, a: ${H}.__avisos().slice(-3).join(' | ') })`);
    ok(!e.d && /Agua fresca del aljibe/.test(e.a), 'el segundo trago del día: sólo el trago');

    seccion('la bandera a las 8 y a las 19');
    const bandera = async (h) => { await reloj(1, h); await asentar(8); return js(`(()=>{ const m = ${H}.__mecanicas(); const b = m.animables().banderas; return { f: m.medir().banderaF, alto: b.map((x) => +(x.objeto.position.y - x.base.y).toFixed(2)), desde: b.map((x) => x.dato.desde), claves: Object.keys(b[0]?.dato || {}).join(',') } })()`); };
    const b7 = await bandera(7.6), b12 = await bandera(12), b8 = await bandera(8.12), b19 = await bandera(19.4);
    ok(b7.f === 0 && b7.alto.every((y) => y < -3), `a las 7:36, abajo (${b7.alto.join(', ')} m; desde ${b7.desde.join(', ')}; ${b7.claves})`);
    ok(b8.f > 0 && b8.f < 1, `a las 8:07, subiendo (${b8.f.toFixed(2)})`);
    ok(b12.f === 1 && b12.alto.every((y) => Math.abs(y) < 0.01), 'al mediodía, arriba');
    ok(b19.f === 0 && b19.alto.every((y) => y < -3), `a las 19:24, arriada (${b19.f})`);
    await reloj(1, 7.8);
    await js(`${H}.__aldea.actualizar(0.6); 1`);
    e = await js(`(()=>{ const n = ${H}.__aldea.mundo().estado().npcs.find((x) => x.clave === 'jefe'); return n ? n.destino : null })()`);
    ok(e && e.edificio === 'plaza' && e.punto === 'soga', `a las 7:48 el jefe de estación va a la soga del mástil (${e ? e.edificio + '/' + e.punto : 'sin jefe'})`);
    await js(`(()=>{ const st = ${H}.__aldea.mundo().personas.get('jefe'); const n = st.npc, d = st.destino; n.pos.x = d.x; n.pos.z = d.z; n.camino = []; return 1 })()`);
    await reloj(1, 8.05);
    await js(`${H}.__aldea.actualizar(0.6); 1`); await cuadros(3);
    e = await js(`${H}.__aldea.mundo().estado().npcs.find((x) => x.clave === 'jefe')?.pose`);
    ok(e === 'izar', `y tira de la soga (${e})`);

    seccion('el duende tallado');
    await reloj(1, 10);
    c = await js(`window.__m36m.cand('duende')`);
    await js(`(()=>{ const A = window.__m36m, c = ${JSON.stringify(c)}; A.apartarGente(c.x, c.z, 6); A.enPunto(c); return 1 })()`);
    av = await avisoAhora();
    await tecla();
    let ch = await charla();
    let reng = await leerTodo();
    ok(av === 'Leer la plaquita del duende' && /Duende del Valle/.test(ch.texto), `«${av}»: «${ch.texto.slice(0, 60)}…»`);
    ok(await js(`!!${H}.progreso.entradas['duende-plaza']`), `la primera vez, al cuaderno (${reng.length} renglones)`);

    // ------------------------------------------------------------ la biblioteca: el préstamo
    seccion('pedir un libro prestado y leerlo en el refugio');
    c = await js(`window.__m36m.cand('prestamo')`);
    await js(`(()=>{ const A = window.__m36m, c = ${JSON.stringify(c)}; A.apartarGente(c.x, c.z, 5); A.enPunto(c); return 1 })()`);
    av = await avisoAhora();
    await tecla();
    const prestado = await js(`${H}.progreso.mecanicas.prestado`);
    ok(av === 'Pedir un libro prestado' && !!prestado, `«${av}»: te llevás ${prestado?.id}`);
    await js(`(()=>{ const r = ${H}.T.lugares.refugio; window.__m36m.poner(r.x + 2.5, r.z + 2.5, 0); ${H}.jugador.sentarse(true); return 1 })()`);
    av = await avisoAhora();
    await tecla();
    ch = await charla();
    reng = await leerTodo();
    ok(/^Leer «.+», el libro prestado$/.test(av) && /^Libro prestado, /.test(ch.quien), `sentado en el refugio: «${av}»`);
    ok(await js(`!!${H}.progreso.entradas['${prestado?.id}']`), 'leído en casa, también al cuaderno');
    await js(`(()=>{ ${H}.jugador.sentarse(false); const A = window.__m36m, c = ${JSON.stringify(c)}; A.enPunto(c); return 1 })()`);
    av = await avisoAhora();
    // 3.6: si la que atiende está de frente, la E es para hablarle y devolver queda en su menú
    let porMenu = false;
    if (/^Hablar con /.test(av)) {
      await tecla(); await esperar(150); await cuadros(2);
      for (let i = 0; i < 4 && !(await js(`[...document.querySelectorAll('#charla-opciones li')].some((li) => /Devolver «/.test(li.textContent))`)); i++) { await tecla(); await esperar(120); await cuadros(2); }
      porMenu = await js(`(()=>{ const li = [...document.querySelectorAll('#charla-opciones li')].find((x) => /Devolver «/.test(x.textContent)); if (!li) return false; li.click(); return true })()`);
      await cuadros(3);
    } else await tecla();
    e = await js(`${H}.progreso.mecanicas`);
    ok((/^Devolver «/.test(av) || porMenu) && !e.prestado && e.prestamos === 1, `de vuelta en el mostrador: «${av}»${porMenu ? ' (desde el menú de la charla)' : ''}`);
    av = await avisoAhora();
    ok(!/prestado/.test(av), `y por hoy, ninguno más («${av}»)`);

    // ------------------------------------------------------------ la escuela
    seccion('el pizarrón y los dibujos');
    await js(`(()=>{ const P = ${H}.progreso; P.entradas.coihue = P.entradas.coihue || { dia: 1, hora: 9, cantidad: 0 }; P.entradas.huemul = P.entradas.huemul || { dia: 1, hora: 9, cantidad: 0 }; return 1 })()`);
    for (const [tipo, texto, patron] of [['pizarron', 'Mirar el pizarrón', /Hoy aprendimos: /], ['dibujos', 'Mirar los dibujos de los chicos', /dibujos de los chicos/]]) {
      c = await js(`window.__m36m.cand('${tipo}')`);
      await js(`(()=>{ const A = window.__m36m, c = ${JSON.stringify(c)}; A.apartarGente(c.x, c.z, 5); A.enPunto(c, 0.35); return 1 })()`);
      av = await avisoAhora();
      await tecla();
      reng = await leerTodo();
      ok(av === texto && reng.some((r) => patron.test(r)), `«${av}»: ${reng.find((r) => patron.test(r))?.slice(0, 70)}`);
    }

    // ------------------------------------------------------------ la estación
    seccion('la campana del andén cuando llega el tren');
    c = await js(`window.__m36m.cand('horario')`);
    await js(`(()=>{ const A = window.__m36m, c = ${JSON.stringify(c)}; A.apartarGente(c.x, c.z, 6); A.enPunto(c); const t = ${H}.tren, p = t.paradas.find((x) => x.aldea); Object.assign(t.est, { s: (p.s + 400) % t.largo, parado: 0, vel: 7, subido: false, conduce: false, proxima: p }); return 1 })()`);
    await cuadros(6);
    const antes = await js(`${H}.__mecanicas().medir().campanadas`);
    await js(`(()=>{ const t = ${H}.tren, p = t.paradas.find((x) => x.aldea); Object.assign(t.est, { s: (p.s - 1 + t.largo) % t.largo, parado: 0, vel: 1.5, proxima: p }); return 1 })()`);
    let suena = 0, giro = 0;
    for (let i = 0; i < 12; i++) { await cuadros(2); const r = await js(`(()=>{ const m = ${H}.__mecanicas(); return { n: m.medir().campanadas, q: Math.abs(m.animables().campana.objeto.quaternion.x) } })()`); suena = r.n; giro = Math.max(giro, r.q); await esperar(40); }
    const parado = await js(`${H}.tren.parado()`);
    ok(parado && suena > antes && giro > 0.02, `el tren paró en la aldea y la campana del andén suena (${antes} → ${suena}) y se mueve (${giro.toFixed(3)})`);
    seccion('el horario de trenes');
    await js(`(()=>{ const t = ${H}.tren, p = t.paradas.find((x) => x.aldea); Object.assign(t.est, { s: (p.s - 600 + t.largo) % t.largo, parado: 0, vel: 7, proxima: p }); return 1 })()`);
    await js(`(()=>{ const A = window.__m36m, c = ${JSON.stringify(c)}; A.apartarGente(c.x, c.z, 6); A.enPunto(c); return 1 })()`);
    av = await avisoAhora();
    await tecla();
    reng = await leerTodo();
    ok(av === 'Mirar el horario de trenes' && reng.some((r) => /El próximo tren llega a las \d\d:\d\d: faltan? /.test(r)), `«${av}»: ${reng.find((r) => /próximo tren/.test(r))}`);

    // ------------------------------------------------------------ la casa de té
    seccion('el té en la casa de té');
    const silla = await js(`(()=>{ const c = ${H}.T.lugares['casa-te']; const s = ${H}.est.sentaderos.filter((q) => q.nombre === 'una silla de la casa de té').sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0]; return s ? { x: s.x, y: s.y, z: s.z, mira: s.mira } : null })()`);
    await reloj(1, 16);
    await js(`(()=>{ const A = window.__m36m, s = ${JSON.stringify(silla)}; A.apartarGente(s.x, s.z, 6); const e = ${H}.jugador.estado; A.poner(s.x, s.z, s.mira); e.pos.set(s.x, s.y - 0.45, s.z); ${H}.jugador.sentarse(true); return 1 })()`);
    av = await avisoAhora();
    const nAntes = await js(`Object.keys(${H}.progreso.entradas).length`);
    await tecla();
    await esperar(1200); await cuadros(3);
    e = await js(`({ n: Object.keys(${H}.progreso.entradas).length, a: ${H}.__avisos().slice(-4).join(' | ') })`);
    ok(av === 'Pedir algo en la casa de té' && /La galesa te trae /.test(e.a) && e.n > nAntes, `sentado a la mesa: «${av}», y la galesa lo trae (${e.a.split(' | ').find((x) => /galesa/.test(x))})`);
    await js(`(()=>{ ${H}.jugador.sentarse(false); return 1 })()`);

    // ------------------------------------------------------------ los oficios
    seccion('las chispas de la fragua: cerca sí, lejos no');
    await reloj(1, 10);   // lunes a las 10: el herrero en la fragua
    const fr = await js(`${H}.__mecanicas().lugares().fragua`);
    await js(`(()=>{ window.__m36m.mirar(${fr.x} + 9, ${fr.z} + 9, ${fr.x}, ${fr.z}); return 1 })()`);
    await asentar(8);
    const q0 = await js(`${H}.__mecanicas().animables().fuelle.objeto.quaternion.x`);
    await asentar(8);
    e = await js(`(()=>{ const m = ${H}.__mecanicas().medir(); return { chispas: m.chispas, gestos: m.gestos, q: ${H}.__mecanicas().animables().fuelle.objeto.quaternion.x, golpes: m.golpes } })()`);
    ok(e.chispas && e.gestos.herreria && Math.abs(e.q - q0) > 1e-4, `a 13 m de la fragua, con el herrero trabajando: chispas y el fuelle que se mueve${sonidoListo ? ` (${e.golpes} martillazos)` : ''}`);
    await js(`(()=>{ window.__m36m.mirar(${fr.x} + 60, ${fr.z} + 40, ${fr.x}, ${fr.z}); return 1 })()`);
    await asentar(8);
    e = await js(`${H}.__mecanicas().medir()`);
    ok(!e.chispas && !e.abejas, 'a 72 m, apagadas');
    const ab = await js(`${H}.__mecanicas().lugares().abejas`);
    await js(`(()=>{ window.__m36m.mirar(${ab.x} + 8, ${ab.z} + 8, ${ab.x}, ${ab.z}); return 1 })()`);
    await reloj(1, 12); await asentar(8);
    e = await js(`${H}.__mecanicas().medir()`);
    ok(e.abejas, 'las abejas dan vueltas en las colmenas');
    const hn = await js(`${H}.__mecanicas().lugares().horno`);
    await reloj(1, 7.2);
    await js(`(()=>{ window.__m36m.mirar(${hn.x} + 10, ${hn.z} + 6, ${hn.x}, ${hn.z}); return 1 })()`);
    await asentar(8);
    e = await js(`${H}.__mecanicas().medir()`);
    ok(e.humo, 'el horno humea a la mañana');
    await reloj(1, 15); await asentar(8);
    e = await js(`${H}.__mecanicas().medir()`);
    ok(!e.humo, 'a la tarde, no');
    const nuevos = await js(`${H}.renderer.info.programs.filter((p) => !window.__progs0.has(p.cacheKey)).map((p) => p.name || p.cacheKey.slice(0, 30))`);
    ok(!nuevos.includes('PointsMaterial'), `las partículas no compilan nada (${nuevos.length ? 'nuevos: ' + nuevos.join(', ') : 'ningún programa nuevo'})`);

    // ------------------------------------------------------------ el salón
    seccion('el baile del sábado');
    await reloj(6, 17.4);   // día 6: sábado
    const sal = await js(`${H}.__mecanicas().lugares().salon`);
    await js(`(()=>{ const A = window.__m36m; A.mirar(${sal.x} + 0.3, ${sal.z} + 0.3, ${sal.x} + 3, ${sal.z}); return 1 })()`);
    await js(`${H}.__aldea.actualizar(0.6); 1`);
    // los que van al salón, ya llegados
    await js(`(()=>{ const y = ${H}.__aldeaMundo().puntosEdificio('salon').sitio.y + 0.32; for (const st of ${H}.__aldea.mundo().personas.values()) if (st.npc && st.destino?.edificio === 'salon') { st.npc.pos.set(st.destino.x, y, st.destino.z); st.npc.camino = []; st.npc.dormido = false; } return 1 })()`);
    await js(`${H}.__aldea.actualizar(0.6); 1`);
    await asentar(14);
    e = await js(`(()=>{ const n = ${H}.__aldea.mundo().estado().npcs; return { bailan: n.filter((x) => x.pose === 'bailar').map((x) => x.clave), musico: n.find((x) => x.clave === 'musico')?.pose, m: ${H}.__mecanicas().medir() } })()`);
    ok(e.bailan.length >= 4 && e.musico === 'tocar', `el músico toca y bailan ${e.bailan.length} (${e.bailan.join(', ')})`);
    ok(!sonidoListo || e.m.musica, sonidoListo ? 'y suena la música del músico' : 'la música (sin motor de sonido en la ventana oculta: no se puede oír)');
    await reloj(6, 19.5); await js(`${H}.__aldea.actualizar(0.6); 1`); await asentar(14);
    e = await js(`${H}.__mecanicas().medir()`);
    ok(!e.musica, 'a las 19:30 ya no hay baile');

    // ------------------------------------------------------------ el puesto, la estafeta, la seccional
    seccion('la camilla');
    await reloj(2, 11);
    c = await js(`window.__m36m.cand('camilla')`);
    await js(`(()=>{ const A = window.__m36m, c = ${JSON.stringify(c)}; A.apartarGente(c.x, c.z, 5); A.enPunto(c); const e = ${H}.jugador.estado; e.descansado = 0; e.entumecido = 0.7; return 1 })()`);
    av = await avisoAhora();
    await tecla();
    e = await js(`({ s: ${H}.jugador.estado.sentado, d: ${H}.jugador.estado.descansado, en: ${H}.jugador.estado.entumecido, uso: ${H}.progreso.aldea.usos.enfermera })`);
    ok(av === 'Recostarte en la camilla' && e.s && e.d >= 3 && e.en === 0 && e.uso === 2, `«${av}»: recostado (${e.s}), descansado ${e.d} h y sin frío (${e.en}) (el día de la enfermera: ${e.uso})`);
    await js(`(()=>{ ${H}.jugador.sentarse(false); return 1 })()`);

    seccion('las casillas de la estafeta');
    c = await js(`window.__m36m.cand('casillas')`);
    await js(`(()=>{ const A = window.__m36m, c = ${JSON.stringify(c)}; A.apartarGente(c.x, c.z, 5); A.enPunto(c); const co = ${H}.progreso.correo; co.llegadas = {}; co.fotos = {}; return 1 })()`);
    av = await avisoAhora();
    await tecla();
    e = await avisos();
    ok(av === 'Abrir tu casilla de correo' && e.some((x) => /Tu casilla está vacía/.test(x)), `«${av}»: vacía`);
    await js(`(()=>{ ${H}.progreso.correo.llegadas['${CARTA}'] = 1; return 1 })()`);
    await avisoAhora();
    await tecla();
    ch = await charla();
    reng = await leerTodo();
    ok(/^Tu casilla, en la estafeta$/.test(ch.quien) && (await js(`!!${H}.progreso.entradas['${CARTA}']`)), `con carta: «${ch.quien}», se lee y queda en el cuaderno (${reng.length} renglones)`);

    seccion('el mapa del valle en la seccional');
    c = await js(`window.__m36m.cand('mapa')`);
    await js(`(()=>{ const A = window.__m36m, c = ${JSON.stringify(c)}; A.apartarGente(c.x, c.z, 5); A.enPunto(c); return 1 })()`);
    av = await avisoAhora();
    await tecla();
    reng = await leerTodo();
    ok(av === 'Mirar el mapa del valle' && reng.some((r) => /Te faltan \d+ animales? y \d+ lugar/.test(r)), `«${av}»: ${reng.find((r) => /Te faltan/.test(r))}`);

    // ------------------------------------------------------------ los cuentos del domingo
    seccion('los cuentos del domingo');
    await reloj(7, 10.5);   // día 7: domingo
    await js(`${H}.__aldea.actualizar(0.6); 1`);
    const sil = await js(`(()=>{ const L = ${H}.__mecanicas().lugares(); const c = L.biblioteca; return L.lectura.sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0] })()`);
    await js(`(()=>{ const y = ${H}.__aldeaMundo().puntosEdificio('biblioteca').sitio.y + 0.32; for (const st of ${H}.__aldea.mundo().personas.values()) if (st.npc && st.destino?.edificio === 'biblioteca') { st.npc.pos.set(st.destino.x, y, st.destino.z); st.npc.camino = []; st.npc.dormido = false; }
      const s = ${JSON.stringify(sil)}, e = ${H}.jugador.estado; window.__m36m.poner(s.x, s.z, s.mira + Math.PI); e.pos.set(s.x, s.y - 0.45, s.z); ${H}.jugador.sentarse(true); return 1 })()`);
    let oido = [];
    for (let i = 0; i < 200; i++) {
      await js(`(()=>{ ${H}.progreso.horas = 10.5; ${H}.__aldea.actualizar(1); ${H}.__bucle(); return 1 })()`);
      const r = await js(`(()=>({ renglon: ${H}.__aldea.renglon(), anotado: !!${H}.progreso.entradas['cuentos-domingo'], sentado: ${H}.jugador.estado.sentado }))()`);
      if (r.renglon && !oido.includes(r.renglon)) oido.push(r.renglon);
      if (r.anotado) break;
      if (!r.sentado) await js(`${H}.jugador.sentarse(true); 1`);
    }
    e = await js(`!!${H}.progreso.entradas['cuentos-domingo']`);
    ok(oido.some((x) => /^Herminia: /.test(x)) && e, `sentado, se oye a la abuela (${oido.length} renglones: «${oido[0]?.slice(0, 50)}…») y queda el recuerdo en el cuaderno`);
    await js(`(()=>{ ${H}.jugador.sentarse(false); return 1 })()`);

    // ------------------------------------------------------------ las puertas
    seccion('todas las puertas de la aldea se abren con E');
    await reloj(2, 11);
    const puertas = await js(`(()=>{ const H = window.__hojarasca; return H.puertas.lista.map((p, i) => ({ i, nombre: p.nombre, duenio: p.duenio || '', x: p.x, z: p.z, rot: p.rot })).filter((p) => /^aldea:/.test(p.duenio) || ['la puerta del almacén', 'la puerta de la casa de té'].includes(p.nombre)) })()`);
    let abiertas = 0;
    const fallan = [];
    for (const p of puertas) {
      const r = await js(`(async ()=>{ const H = window.__hojarasca, A = window.__m36m, p = ${JSON.stringify(p)}; const q = H.puertas.lista[p.i];
        q.objetivo = 0; q.abierta = 0;
        const id = p.duenio.slice(6), b = id && id !== 'estacion' ? H.__aldeaMundo().estadoEdificio(id) : null;
        const L = H.T.lugares, est = !b && /almacén/.test(p.nombre) ? L.almacen : !b && /casa de té/.test(p.nombre) ? L['casa-te'] : null;
        const cx = b ? b.sitio.x : est ? est.x : p.x - Math.sin(p.rot), cz = b ? b.sitio.z : est ? est.z : p.z - Math.cos(p.rot);
        let ux = p.x - cx, uz = p.z - cz; const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l;
        const res = [];
        for (const lado of [1, -1]) {
          const x = p.x + ux * 1.3 * lado, z = p.z + uz * 1.3 * lado;
          A.apartarGente(x, z, 4); A.poner(x, z, Math.atan2(-(p.x - x), -(p.z - z)));
          const cerca = H.puertas.cerca(H.jugador.estado.pos);
          res.push(cerca === q);
          if (cerca === q) break;
        }
        return { cerca: res.includes(true) } })()`);
      if (!r.cerca) { fallan.push(`${p.nombre} (no queda a mano)`); continue; }
      const aviso = await avisoAhora();
      await tecla('KeyE', 2);
      const o = await js(`${H}.puertas.lista[${p.i}].objetivo`);
      if (/^Abrir /.test(aviso) && o > 0.5) abiertas++;
      else fallan.push(`${p.nombre} («${aviso}», objetivo ${o})`);
    }
    ok(puertas.length >= 17 && abiertas === puertas.length, `${abiertas} de ${puertas.length} puertas se abren con E${fallan.length ? ': fallan ' + fallan.join(', ') : ''}`);

    // ------------------------------------------------------------ lo que cuesta
    seccion('lo que cuesta, en la plaza');
    const enPlaza = async (h) => {
      await reloj(1, h);
      await js(`(()=>{ const M = ${H}.__aldeaMundo(); const o = M.aMundo(6, 29), a = M.aMundo(10, 60); window.__m36m.mirar(o.x, o.z, a.x, a.z); return 1 })()`);
      await js(`${H}.__mecanicas().reiniciarMedidas(); 1`);
      await asentar(6);
      // el tiempo del módulo (medido adentro: promedio y peor cuadro) y los dibujos de lo suyo
      return js(`(()=>{ const H = window.__hojarasca, A = window.__m36m, m = H.__mecanicas();
        for (let i = 0; i < 120; i++) H.__bucle();
        const t0 = performance.now(); const cam = H.camara.position; for (let i = 0; i < 300; i++) m.actualizar(1 / 60, cam); const directo = (performance.now() - t0) / 300;
        const con = A.dibujos(); const nubes = m.nubes(); const vis = nubes.map((p) => p.visible); nubes.forEach((p) => { p.visible = false; });
        const anim = m.animables(); const piezas = [...anim.banderas, anim.fuelle, anim.rueca, anim.campana].filter(Boolean); const vp = piezas.map((a) => a.contenedor.visible); piezas.forEach((a) => { a.contenedor.visible = false; });
        const sin = A.dibujos(); nubes.forEach((p, i) => { p.visible = vis[i]; }); piezas.forEach((a, i) => { a.contenedor.visible = vp[i]; });
        const md = m.medir(); return { ms: md.ms, msMax: md.msMax, directo: +directo.toFixed(4), con: con.dibujos, sin: sin.dibujos, nubes: md.dibujos } })()`);
    };
    const dia = await enPlaza(12), manana = await enPlaza(7.3);
    medidas.plaza = dia; medidas.plazaManana = manana;
    for (const [n, r] of [['al mediodía', dia], ['a las 7:18 (humea el horno)', manana]]) {
      ok(r.ms < 0.3 && r.directo < 0.3, `${n}: ${r.ms.toFixed(3)} ms por cuadro en promedio (${r.directo} ms medido aparte; el peor, ${r.msMax} ms)`);
      ok(r.con - r.sin <= 6, `${n}: ${r.con - r.sin} dibujos de las mecánicas (lo que se mueve y las partículas; ${r.nubes} nubes prendidas) de ${r.con}`);
      ok(r.msMax < 3, `${n}: el peor cuadro del módulo en la plaza, ${r.msMax.toFixed(3)} ms`);
    }
  } catch (err) {
    errores.push(`excepción: ${err && err.message ? err.message : err}`);
  }
  console.log('MEDIDAS ' + JSON.stringify(medidas));
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n${errores.join('\n')}`); app.exit(1); return; }
  console.log('OK humo 3.6 mecánicas');
  app.exit(0);
});
