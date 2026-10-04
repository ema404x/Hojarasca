// Partida real 3.6.1 (vecinos): de TODOS los asientos del juego uno se puede levantar e irse.
// Lo encontró el usuario jugando: «cuando te sentás en el sillón de la biblioteca de la aldea, después
// no podés salir». El sillón de los cuentos es un mueble que frena (una caja de cuatro lados) y el
// asiento cae en su medio: al levantarse, los lados te empujaban siempre para adentro.
// Para cada asiento (los de la aldea completa, los del valle, la casa de té y el banco del refugio):
//  · te sentás como con E (desde adelante, mirándolo) y quedás sentado;
//  · te levantás caminando hacia adelante, atrás y a los costados (W, S, A, D), con el mando (la
//    palanca aprieta las mismas teclas) y con R; en cada caso, después tenés que poder alejarte 3 m;
//  · sentado, el cartel de abajo dice cómo levantarse.
// Uso: npx electron pruebas/humo-3-6-1-asientos.cjs --user-data-dir=<carpeta propia>
//      (o HUMO_PERFIL=<carpeta>; si no, una propia en la carpeta temporal). Borra el localStorage
//      del perfil: usar uno aparte.
const { app, BrowserWindow, dialog } = require('electron');
// que la prueba nunca muestre un cuadro de error en la pantalla del usuario: lo escribe y sale
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
else if (!process.argv.some((a) => a.startsWith('--user-data-dir'))) app.setPath('userData', path.join(os.tmpdir(), 'hojarasca-humo-3-6-1-asientos'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// lo que corre en la página
const AYUDA = String.raw`(() => {
  const H = window.__hojarasca;
  const A = window.__m361a = {};
  A.paso = (dt = 0.05) => { H.jugador.actualizar(dt); H.puertas.actualizar(dt); };
  A.soltar = () => { H.jugador.teclas.clear(); };
  A.poner = (x, z, yaw = 0, y = null) => { const e = H.jugador.estado; A.soltar(); if (e.sentado) H.jugador.sentarse(false); H.jugador.ubicar(x, z, yaw, y); e.vel.set(0, 0, 0); e.vy = 0; e.sentado = false; for (let i = 0; i < 10; i++) A.paso(); e.yaw = yaw; };
  // sentarse como lo hace E con un asiento (main.js: objetos.usar → r.sentarse)
  A.sentar = (s) => {
    const e = H.jugador.estado;
    e.pos.set(s.x, Math.max(s.y - 0.45, H.T.altura(s.x, s.z)), s.z);
    e.yaw = s.mira; e.pitch = -0.05;
    H.jugador.sentarse(true);
    for (let i = 0; i < 6; i++) A.paso();
    return e.sentado;
  };
  // ¿se puede caminar desde acá? (adentro de un mueble que frena, no te movés para ningún lado)
  A.libre = (x, z, y) => {
    const e = H.jugador.estado;
    let anda = 0;
    for (let k = 0; k < 4; k++) {
      A.poner(x, z, (k / 4) * Math.PI * 2, y);
      const x0 = e.pos.x, z0 = e.pos.z;
      H.jugador.teclas.add('KeyW');
      for (let i = 0; i < 8; i++) A.paso();
      A.soltar();
      if (Math.hypot(e.pos.x - x0, e.pos.z - z0) > 0.3) anda++;
    }
    return anda >= 2;
  };
  // un lugar donde pararse para sentarse con E: a menos de 2 m, en el mismo piso, sin pared en el
  // medio, libre, y desde donde E ofrece ese asiento (objetos.buscar, lo mismo que el aviso)
  A.dondePararse = (s) => {
    const e = H.jugador.estado;
    let suelto = null;
    for (const r of [0.75, 1.0, 1.3, 1.7]) for (let k = 0; k < 16; k++) {
      // primero adelante del asiento (hacia donde mira el que se sienta), después abriéndose a los lados
      const a = Math.atan2(-Math.sin(s.mira), -Math.cos(s.mira)) + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 8);
      const x = s.x + Math.sin(a) * r, z = s.z + Math.cos(a) * r;
      const yaw = Math.atan2(-(s.x - x), -(s.z - z));
      A.poner(x, z, yaw, s.y - 0.45);
      if (Math.abs(e.pos.y - (s.y - 0.45)) > 0.7 || Math.hypot(e.pos.x - x, e.pos.z - z) > 0.25) continue;
      if (H.col.paredEntre(x, z, s.x, s.z, s.y)) continue;
      // (un lugar abierto de verdad: desde ahí te podés alejar 3 m; no un rincón encerrado entre muebles)
      if (!A.libre(x, z, e.pos.y)) continue;
      const y0 = e.pos.y;
      if (A.alejarse({ x, z }, 3, { x, y: y0, z }) < 3) continue;
      A.poner(x, z, yaw, y0); e.pitch = -0.35; A.paso();
      const o = H.objetos.buscar(H.camara, H.jugador);
      if (o?.tipo === 'sentarse' && o.s === s) return { x, z, yaw, y: y0, conE: true };
      suelto ??= { x, z, yaw, y: y0, conE: false };
    }
    return suelto;
  };
  // lo más lejos que se llega desde donde estás, probando ocho rumbos (y otra vez desde el mejor)
  A.alejarse = (s, metros = 3, inicio = null) => {
    const e = H.jugador.estado;
    const lejos = () => Math.hypot(e.pos.x - s.x, e.pos.z - s.z);
    if (inicio) A.poner(inicio.x, inicio.z, 0, inicio.y);
    let mejor = lejos(), desde = { x: e.pos.x, y: e.pos.y, z: e.pos.z };
    for (let vuelta = 0; vuelta < 2 && mejor < metros; vuelta++) {
      const base = { ...desde };
      for (let k = 0; k < 8 && mejor < metros; k++) {
        A.poner(base.x, base.z, (k / 8) * Math.PI * 2, base.y);
        H.jugador.teclas.add('KeyW');
        for (let i = 0; i < 50; i++) A.paso();
        A.soltar();
        if (lejos() > mejor) { mejor = lejos(); desde = { x: e.pos.x, y: e.pos.y, z: e.pos.z }; }
      }
    }
    return mejor;
  };
  return 1;
})()`;

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
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 300 s (${donde})`)), 300000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea)').catch(() => false)) return true; } return false; };
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano' }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const asentar = async (veces = 6) => { for (let i = 0; i < veces; i++) { await esperar(160); await cuadros(3); } };
  const aldeaMontada = async (maximo = 900) => {
    await js(`${H}.__aldeaMundo().listo().then(() => 1)`);
    for (let i = 0; i < maximo; i++) { const c = await js(`(()=>{ ${H}.__bucle(); return ${H}.__aldeaMundo().medir().cola })()`); if (c === 0) return i; if (i % 20 === 19) await esperar(30); }
    return -1;
  };

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
    await js(AYUDA);

    seccion('la aldea completa, con todos sus asientos');
    await js(`(()=>{ const P = ${H}.progreso, a = P.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
      a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.llegando = null; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); a.descubierta = 1;
      P.dia = 1; P.horas = 3; return 1 })()`);
    await js(`(()=>{ const M = ${H}.__aldeaMundo(); const o = M.aMundo(6, 29); window.__m361a.poner(o.x, o.z, 0); M.actualizar(4, ${H}.camara.position); return 1 })()`);
    const vueltas = await aldeaMontada();
    await asentar(6);
    await js(`${H}.__mecanicas().revisar(); 1`);
    // de madrugada los vecinos duermen: nadie se cruza en el camino (la prueba es de muebles y paredes)
    const lista = await js(`${H}.est.sentaderos.map((s, i) => ({ i, nombre: s.nombre, aldea: s.aldea || null, cama: !!s.cama, x: s.x, y: s.y, z: s.z, mira: s.mira }))`);
    // (SOLO=texto: sólo los asientos con ese texto en el nombre o el edificio, para mirar uno)
    const sillas = lista.filter((s) => !s.cama && (!process.env.SOLO || `${s.nombre} ${s.aldea}`.includes(process.env.SOLO)));
    ok(vueltas >= 0 && (process.env.SOLO || sillas.filter((s) => s.aldea).length > 60), `la aldea montada: ${sillas.filter((s) => s.aldea).length} asientos de la aldea y ${sillas.filter((s) => !s.aldea).length} del valle`);
    if (!process.env.SOLO) ok(sillas.some((s) => s.nombre === 'el sillón de los cuentos'), 'está el sillón de los cuentos');
    if (!process.env.SOLO) ok(sillas.some((s) => s.nombre === 'el banco del refugio') && sillas.some((s) => s.nombre === 'una silla de la casa de té'), 'están el banco del refugio y las sillas de la casa de té');

    seccion('sentarse y levantarse en cada uno');
    const MODOS = [['KeyW', 'adelante'], ['KeyS', 'atrás'], ['KeyA', 'a la izquierda'], ['KeyD', 'a la derecha'], ['R', 'con R']];
    const trabados = [], sinE = [];
    let probados = 0;
    for (const s of sillas) {
      const r = await js(`(()=>{ const H = ${H}, A = window.__m361a, e = H.jugador.estado, s = H.est.sentaderos[${s.i}];
        const salida = [];
        const p = A.dondePararse(s);
        for (const [modo] of ${JSON.stringify(MODOS)}) {
          // parado donde E ofrece el asiento, mirándolo, y sentado como con E
          if (!p) { salida.push({ modo, sinLugar: true }); continue; }
          A.poner(p.x, p.z, p.yaw, p.y);
          if (!A.sentar(s)) { salida.push({ modo, sentado: false }); continue; }
          if (modo === 'R') { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyR', bubbles: true })); }
          else { H.jugador.teclas.add(modo); for (let i = 0; i < 12; i++) A.paso(); A.soltar(); }
          for (let i = 0; i < 4; i++) A.paso();
          const parado = !e.sentado;
          const lejos = parado ? A.alejarse(s, 3) : 0;
          salida.push({ modo, parado, lejos: +lejos.toFixed(2), conE: p.conE });
        }
        return salida })()`);
      probados++;
      for (const x of r) if (x.sinLugar || x.sentado === false || !x.parado || x.lejos < 3) trabados.push(`${s.nombre}${s.aldea ? ` (${s.aldea})` : ''} [${s.x.toFixed(1)}, ${s.z.toFixed(1)}] ${MODOS.find((m) => m[0] === x.modo)[1]}: ${x.sinLugar ? 'no hay dónde pararse para sentarse' : x.sentado === false ? 'no se sienta' : !x.parado ? 'sigue sentado' : `llega a ${x.lejos} m`}`);
      if (r.some((x) => x.conE === false)) sinE.push(s.nombre);
    }
    ok(probados === sillas.length && !trabados.length, `${probados} asientos, de cada uno te levantás de cinco maneras y te alejás 3 m${trabados.length ? `; trabados (${trabados.length}):\n    ${trabados.slice(0, 40).join('\n    ')}` : ''}`);

    console.log(`  (desde donde E no los ofrece por estar otro más a mano: ${[...new Set(sinE)].join(', ') || 'ninguno'})`);
    seccion('sentado, el cartel dice cómo levantarse');
    const s0 = sillas.find((s) => s.nombre === 'el sillón de los cuentos') || sillas[0];
    await js(`(()=>{ const A = window.__m361a, s = ${H}.est.sentaderos[${s0.i}]; const p = A.dondePararse(s); A.poner(p.x, p.z, p.yaw, p.y); A.sentar(s); return 1 })()`);
    await asentar(3);
    const estado = await js(`document.getElementById('estado')?.textContent || ''`);
    ok(/Movete para levantarte/.test(estado), `«${estado.trim()}»`);
  } catch (err) {
    errores.push(`excepción: ${err && err.message ? err.message : err}`);
  }
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n${errores.join('\n')}`); app.exit(1); return; }
  console.log('OK humo 3.6.1 asientos');
  app.exit(0);
});
