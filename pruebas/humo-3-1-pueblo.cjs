// Partida real 3.1 (Electron + WebGL): rangos y oficios, y fundar un pueblo.
//  · se tala con la tecla H hasta subir de nivel de hachero (aviso incluido) y se mira que
//    la habilidad se aplique: un tronco más al talar y, en el nivel 3, un hachazo menos;
//  · se levanta un puesto con O e Y (y el oficio de constructor suma), se cumplen las
//    condiciones, para la trochita en la estación y baja el carpintero; se le habla con E,
//    se lo acepta y se muda: trabaja al lado de la casa de día y duerme adentro de noche;
//    se usa su servicio (troncos → tablas) con E;
//  · se le pone nombre al pueblo desde el cuaderno (J) y aparece el cartel;
//  · se recarga y todo sigue: los oficios, el poblador, su casa, el nombre y el cartel.
// Uso: npx electron pruebas/humo-3-1-pueblo.cjs --user-data-dir=<carpeta propia>
//      (o HUMO_PERFIL=<carpeta>). Borra el localStorage del perfil: usar uno aparte.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

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
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__pueblo)').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; window.prompt = () => 'El Rincón'; 1`);
  };
  const tecla = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  // pone al jugador a `d` metros de (x, z), mirándolo
  const frenteA = (x, z, d = 1.8) => js(`(()=>{ const j = ${H}.jugador, T = ${H}.T; let mejor = null;
    for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, px = (${x}) + Math.cos(a) * ${d}, pz = (${z}) + Math.sin(a) * ${d}; if (!T.agua(px, pz)) { mejor = { px, pz }; break; } }
    if (!mejor) return false;
    j.ubicar(mejor.px, mejor.pz, Math.atan2(-((${x}) - mejor.px), -((${z}) - mejor.pz)));
    j.estado.pitch = -0.05; return true })()`);
  const npc = (clave) => `${H}.__pueblo.mundo().npcs.get('${clave}')`;
  // habla con el poblador que tiene enfrente: E hasta que se cierra la charla
  const hablarCon = async (clave, maximo = 8) => {
    const p = await js(`(()=>{ const n = ${npc(clave)}; return n ? { x: n.pos.x, z: n.pos.z } : null })()`);
    if (!p) return { error: 'no está' };
    await frenteA(p.x, p.z, 1.8);
    await cuadros(6);
    const aviso = await js(`${H}.__aviso()`);
    const textos = [];
    for (let i = 0; i < maximo; i++) {
      await js(`${tecla('KeyE')} 1`);
      const c = await js(`(()=>({ npc: ${H}.__charla().npc, texto: document.getElementById('charla-texto').textContent, seguir: document.getElementById('charla-seguir').textContent }))()`);
      if (!c.npc) break;
      textos.push(`${c.texto} [${c.seguir}]`);
    }
    return { aviso, textos };
  };

  try {
    // el perfil empieza vacío: se borra con la página cerrada (si no, al descargarse la
    // página vuelve a guardar la partida que tenía abierta)
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre' })); return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();
    let e = await js(`(()=>{ const o = ${H}.progreso.oficios; return { o, rango: ${H}.__pueblo.oficios().nivel('hachero'), pueblo: ${H}.progreso.pueblo } })()`);
    ok(e.o && e.o.acreditado === true && Object.keys(e.o.xp).length === 0, 'una partida nueva arranca sin oficios');
    ok(e.pueblo && e.pueblo.pobladores.length === 0, 'y sin pueblo');

    // ------------------------------------------------------------ hachero
    seccion('talar con H hasta subir de nivel');
    // talar un árbol en pie con la tecla H: cuántos hachazos hicieron falta y qué dio
    const talar = () => js(`(()=>{ const P = ${H}.progreso, V = ${H}.veg, T = ${H}.T, j = ${H}.jugador;
      P.cosas.hacha = 1;
      const libre = (x, z) => !V.matas.some((m) => !m.sacado && (m.tipo === 'roca' || m.tipo === 'tronco') && Math.hypot(m.x - x, m.z - z) < 3.6);
      const a = V.arboles.find((t) => !t.sacado && !t.caido && t.especie !== 'pehuen' && !T.agua(t.x, t.z) && !t.__probado && libre(t.x + (t.r || 0.4) + 1.1, t.z) && !T.agua(t.x + (t.r || 0.4) + 1.1, t.z)
        && !V.arboles.some((b) => b !== t && !b.sacado && Math.hypot(b.x - t.x - (t.r || 0.4) - 1.1, b.z - t.z) < 2.6 + (b.r || 0.4)));
      if (!a) return { error: 'no hay árbol' };
      a.__probado = true;
      const px = a.x + (a.r || 0.4) + 1.1;
      j.ubicar(px, a.z, Math.PI / 2);
      const antes = P.materiales.tronco || 0;
      let golpes = 0;
      while (!a.sacado && golpes < 6) { ${tecla('KeyH')} golpes++; }
      return { golpes, talado: !!a.sacado, troncos: (P.materiales.tronco || 0) - antes, xp: P.oficios.xp.hachero || 0 } })()`);
    let r = await talar();
    ok(r.talado && r.golpes === 3, `el primer árbol cae con tres hachazos (${JSON.stringify(r)})`);
    ok(r.troncos === 4 && r.xp === 12, `sin oficio da cuatro troncos y 12 de experiencia (${r.troncos}, ${r.xp})`);
    for (let i = 0; i < 3; i++) r = await talar();
    e = await js(`(()=>({ nivel: ${H}.__pueblo.oficios().nivel('hachero'), avisos: ${H}.__avisos().join(' | ') }))()`);
    ok(e.nivel === 1, `al cuarto árbol, nivel 1 de hachero (${e.nivel})`);
    ok(/Aprendiz de hachero/.test(e.avisos), 'y lo avisa con el título nuevo');
    r = await talar();
    ok(r.talado && r.troncos === 5, `la habilidad se aplica: ahora salen cinco troncos (${r.troncos})`);
    // hasta el nivel 3: el árbol cae con un hachazo menos
    let vueltas = 0;
    while ((await js(`${H}.__pueblo.oficios().nivel('hachero')`)) < 3 && vueltas++ < 30) { r = await talar(); if (r.error) break; }
    e = await js(`(()=>({ nivel: ${H}.__pueblo.oficios().nivel('hachero'), golpes: ${H}.__pueblo.golpes(), avisos: ${H}.__avisos().join(' | ') }))()`);
    ok(e.nivel === 3 && e.golpes === 2, `nivel 3 de hachero: dos hachazos por árbol (${JSON.stringify({ nivel: e.nivel, golpes: e.golpes })})`);
    ok(/Hachero de monte/.test(e.avisos), 'con su aviso');
    r = await talar();
    ok(r.talado && r.golpes === 2, `y el árbol de verdad cae con dos (${r.golpes})`);
    // aserrar a mano (nivel 2+): tres tablas por tronco
    e = await js(`(()=>{ const P = ${H}.progreso; const antes = P.materiales.tabla || 0; ${H}.jugador.ubicar(${H}.jugador.estado.pos.x + 30, ${H}.jugador.estado.pos.z, 0); ${tecla('KeyY')} return (P.materiales.tabla || 0) - antes })()`);
    ok(e === 3, `aserrar a mano con Y ahora da tres tablas (${e})`);

    // ------------------------------------------------------------ la casa
    seccion('levantar un puesto con O e Y');
    e = await js(`(()=>{ const P = ${H}.progreso, T = ${H}.T, O = ${H}.obras, j = ${H}.jugador, r0 = T.lugares.refugio;
      Object.assign(P.materiales, { tronco: 200, tabla: 200, piedra: 200 });
      const n0 = O.obras.length;
      ${tecla('KeyO')}
      O.elegir(${H}.PLANOS.find((p) => p.id === 'puesto'));
      for (let k = 0; k < 80; k++) {
        const x = r0.x + 40 + (k % 8) * 16, z = r0.z + 40 + Math.floor(k / 8) * 16;
        if (T.agua(x, z) || T.agua(x - 6, z)) continue;
        j.ubicar(x, z, Math.PI / 2);   // mira hacia -x: la obra se funda 5,5 m adelante
        ${tecla('KeyY')}
        if (O.obras.length > n0) break;
      }
      const obra = O.obras[O.obras.length - 1];
      if (!obra || O.obras.length === n0) return { error: 'no hubo lugar' };
      const xp0 = P.oficios.xp.obrero || 0;
      for (let i = 0; i < 6 && obra.datos.etapas < obra.plano.etapas.length; i++) { ${tecla('KeyY')} }
      ${tecla('KeyO')}
      return { plano: obra.plano.id, etapas: obra.datos.etapas, total: obra.plano.etapas.length, x: obra.datos.x, z: obra.datos.z, xp: (P.oficios.xp.obrero || 0) - xp0 } })()`);
    ok(!e.error && e.plano === 'puesto' && e.etapas === e.total, `el puesto quedó terminado (${JSON.stringify(e)})`);
    ok(e.xp > 0, `levantarlo enseña oficio de constructor (+${e.xp})`);
    const casa = e;
    await esperar(1200);   // el nombre de la obra (window.prompt de la prueba)
    e = await js(`${H}.__pueblo.mundo().estado()`);
    ok(e.aptas.length === 1 && e.libres.length === 1, `el puesto es una casa apta y libre (${e.aptas.join(', ')})`);

    // ------------------------------------------------------------ la llegada
    seccion('las condiciones y la trochita');
    e = await js(`(()=>{ const P = ${H}.progreso; P.horas = 10;
      const r = ${H}.__pueblo.mundo().revisarLlegada(true); return { r, llegando: P.pueblo.llegando } })()`);
    ok(!e.r && !e.llegando, 'con el valle sin anotar todavía no llega nadie');
    e = await js(`(()=>{ const P = ${H}.progreso; for (const id of ${H}.__pueblo.entradas().slice(0, 14)) P.entradas[id] = P.entradas[id] || { dia: 1, hora: 9, cantidad: 0 };
      const t = ${H}.tren; t.est.s = t.estacion.s; t.est.proxima = t.estacion; t.est.parado = 60; t.est.vel = 0; return Object.keys(P.entradas).length })()`);
    await cuadros(4);
    await js(`${H}.__pueblo.actualizar(1.2); 1`);
    e = await js(`(()=>({ llegando: ${H}.progreso.pueblo.llegando, estado: ${H}.__pueblo.mundo().estado(), avisos: ${H}.__avisos().slice(-4).join(' | ') }))()`);
    ok(e.llegando?.clave === 'carpintero', `paró la trochita y bajó el carpintero (${JSON.stringify(e.llegando)})`);
    ok(/Bajó alguien de la trochita/.test(e.avisos), 'y se avisa');
    const enAnden = e.estado.npcs.find((n) => n.clave === 'carpintero');
    ok(enAnden && enAnden.llegando, 'espera en la estación');

    seccion('hablarle y aceptarlo');
    let h = await hablarCon('carpintero');
    ok(/Hablar con Tito Arrieta/.test(h.aviso), `el aviso de E dice con quién (${h.aviso})`);
    ok(h.textos.some((t) => /carpintero/.test(t)) && h.textos.some((t) => /E: que se quede/.test(t)), `se presenta y pide quedarse (${h.textos.length} renglones)`);
    e = await js(`(()=>({ pueblo: ${H}.progreso.pueblo, avisos: ${H}.__avisos().slice(-5).join(' | ') }))()`);
    ok(e.pueblo.pobladores.length === 1 && e.pueblo.pobladores[0].clave === 'carpintero' && !e.pueblo.llegando, 'lo aceptaste: se queda');
    ok(Math.hypot(e.pueblo.pobladores[0].casa.x - casa.x, e.pueblo.pobladores[0].casa.z - casa.z) < 0.2, 'y vive en tu puesto');
    ok(/se queda en tu pueblo/.test(e.avisos), 'con su aviso');
    e = await js(`${H}.__pueblo.mundo().estado()`);
    ok(e.libres.length === 0, 'el puesto ya no está libre');

    seccion('vive ahí');
    // de día, trabajando al lado de la casa (lejos de todo, llega de una)
    await js(`(()=>{ const P = ${H}.progreso; P.horas = 9; const j = ${H}.jugador; const T = ${H}.T; j.ubicar(T.lugares.refugio.x, T.lugares.refugio.z, 0); return 1 })()`);
    for (let i = 0; i < 3; i++) await js(`${H}.__pueblo.actualizar(1.2); 1`);
    e = await js(`(()=>{ const n = ${npc('carpintero')}; return { x: n.pos.x, z: n.pos.z, fase: n.faseDia, util: !!${H}.__pueblo.mundo().utiles.get('carpintero') } })()`);
    let d = Math.hypot(e.x - casa.x, e.z - casa.z);
    ok(e.fase === 'trabajo' && d < 8, `de día trabaja al lado de su casa (${d.toFixed(1)} m, ${e.fase})`);
    ok(e.util, 'con su caballete');
    // al caer la tarde camina (de verdad, cuadro a cuadro) hasta la puerta
    await js(`(()=>{ ${H}.progreso.horas = 19.5; const T = ${H}.T; let x = (${casa.x}) + 16, z = (${casa.z}); if (T.agua(x, z)) x -= 32; ${H}.jugador.ubicar(x, z, 0); return 1 })()`);
    e = await js(`(()=>{ const n = ${npc('carpintero')}, pts = ${H}.__pueblo.mundo().puntosDeCasa(${H}.progreso.pueblo.pobladores[0].casa, 0);
      const j = ${H}.jugador.estado;
      // a pasos fijos (la ventana oculta corre a los saltos): la gente camina y el pueblo decide
      for (let i = 0; i < 600 && Math.hypot(n.pos.x - pts.frente.x, n.pos.z - pts.frente.z) > 0.8; i++) { ${H}.gente.actualizar(0.05, j, ${H}.camara, null, 0); ${H}.__pueblo.actualizar(0.05); }
      return { d: Math.hypot(n.pos.x - pts.frente.x, n.pos.z - pts.frente.z), fase: n.faseDia } })()`);
    ok(e.fase === 'puerta' && e.d < 1, `al caer la tarde camina hasta su puerta (${e.d.toFixed(2)} m, ${e.fase})`);
    // de noche entra por la puerta y se queda adentro
    e = await js(`(()=>{ ${H}.progreso.horas = 23; const n = ${npc('carpintero')}, j = ${H}.jugador.estado;
      for (let i = 0; i < 600 && !n.adentro; i++) { ${H}.gente.actualizar(0.05, j, ${H}.camara, null, 0); ${H}.__pueblo.actualizar(0.05); }
      return { x: n.pos.x, z: n.pos.z, adentro: !!n.adentro } })()`);
    d = Math.hypot(e.x - casa.x, e.z - casa.z);
    ok(e.adentro && d < 1.5, `de noche duerme adentro (${d.toFixed(2)} m del centro)`);
    await js(`${H}.progreso.horas = 10; 1`);
    for (let i = 0; i < 3; i++) await js(`${H}.__pueblo.actualizar(1.2); 1`);

    seccion('su servicio');
    await js(`(()=>{ const P = ${H}.progreso; P.materiales.tronco = 3; P.materiales.tabla = 10; return 1 })()`);
    h = await hablarCon('carpintero');
    e = await js(`(()=>({ tronco: ${H}.progreso.materiales.tronco || 0, tabla: ${H}.progreso.materiales.tabla || 0 }))()`);
    ok(h.textos.some((t) => /E: dale/.test(t)), 'ofrece aserrar tus troncos');
    ok(e.tronco === 0 && e.tabla === 25, `con E: tres troncos, quince tablas (${JSON.stringify(e)})`);
    await js(`${H}.progreso.materiales.tronco = 4; 1`);
    await hablarCon('carpintero');
    e = await js(`${H}.progreso.materiales.tronco`);
    ok(e === 4, 'una vez por día');

    // ------------------------------------------------------------ el nombre
    seccion('el nombre del pueblo, desde el cuaderno');
    await js(`${tecla('KeyJ')} 1`);
    await esperar(300);
    e = await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista .pestanas button')].find((x) => /Oficios/.test(x.textContent)); if (!b) return 'sin pestaña'; b.click();
      const rango = document.getElementById('cuaderno-lista').textContent;
      const p = document.querySelector('#cuaderno-lista button[data-oficio="pueblo"]'); if (!p) return 'sin pueblo'; p.click();
      const campo = document.getElementById('pueblo-nombre'), boton = document.getElementById('pueblo-nombrar');
      if (!campo || !boton) return 'sin campo';
      campo.value = 'Villa Lenga'; boton.click();
      return { rango: /Hachero de monte/.test(rango), ficha: document.getElementById('cuaderno-ficha').textContent.slice(0, 160) } })()`);
    ok(e && e.rango, `el cuaderno muestra el rango (${JSON.stringify(e).slice(0, 120)})`);
    await js(`${tecla('KeyJ')} 1`);
    e = await js(`(()=>({ nombre: ${H}.progreso.pueblo.nombre, cartel: ${H}.progreso.pueblo.cartel, malla: !!${H}.__pueblo.mundo().cartel(), lugar: ${H}.T.lugares['pueblo-propio'] }))()`);
    ok(e.nombre === 'Villa Lenga', `el pueblo se llama ${e.nombre}`);
    ok(e.malla && e.cartel && e.lugar?.nombre === 'Villa Lenga', 'y tiene su cartel (y queda en el mapa)');
    const oficiosAntes = await js(`JSON.stringify(${H}.progreso.oficios.xp)`);
    await js(`${H}.guardar(); 1`);

    // ------------------------------------------------------------ recargar
    seccion('recargar');
    await abrir();
    ok(await listo(), 'vuelve a cargar');
    await entrar();
    await cuadros(3);
    e = await js(`(()=>({ xp: JSON.stringify(${H}.progreso.oficios.xp), nivel: ${H}.__pueblo.oficios().nivel('hachero'), pueblo: ${H}.progreso.pueblo, estado: ${H}.__pueblo.mundo().estado(), golpes: ${H}.__pueblo.golpes() }))()`);
    ok(e.xp === oficiosAntes && e.nivel === 3 && e.golpes === 2, `los oficios siguen (${e.xp})`);
    ok(e.pueblo.nombre === 'Villa Lenga' && e.pueblo.pobladores.length === 1 && e.pueblo.pobladores[0].clave === 'carpintero', 'el pueblo y su poblador siguen');
    ok(e.estado.npcs.some((n) => n.clave === 'carpintero' && !n.llegando), 'el carpintero vuelve a estar');
    ok(!!e.estado.cartel, 'y el cartel');
    ok(e.estado.aptas.length === 1 && e.estado.libres.length === 0, 'su casa sigue siendo suya');
  } catch (err) {
    errores.push(`excepción: ${err && err.message ? err.message : err}`);
  }
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n${errores.join('\n')}`); app.exit(1); return; }
  console.log('OK humo 3.1 pueblo');
  app.exit(0);
});
