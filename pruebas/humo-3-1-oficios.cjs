// Partida real 3.1 (Electron + WebGL): rangos y oficios.
//  · se tala con la tecla H hasta subir de nivel de hachero (aviso incluido) y se mira que
//    la habilidad se aplique: un tronco más al talar y, en el nivel 3, un hachazo menos;
//  · se levanta un puesto con O e Y y el oficio de constructor suma;
//  · el cuaderno (J) muestra el rango en «Oficios y aldea»;
//  · se recarga y los oficios siguen.
// 3.6: era humo-3-1-pueblo.cjs. El «fundar un pueblo» se sacó: la llegada de los pobladores,
// sus servicios y las obras del pueblo se prueban ahora en humo-3-6-aldea.cjs.
// Uso: npx electron pruebas/humo-3-1-oficios.cjs --user-data-dir=<carpeta propia>
//      (o HUMO_PERFIL=<carpeta>). Borra el localStorage del perfil: usar uno aparte.
const { app, BrowserWindow, dialog } = require('electron');
// que la prueba nunca muestre un cuadro de error en la pantalla del usuario: lo escribe y sale
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
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
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea)').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; window.prompt = () => 'El Rincón'; 1`);
  };
  const tecla = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);

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
    let e = await js(`(()=>{ const o = ${H}.progreso.oficios; return { o, rango: ${H}.__aldea.oficios().nivel('hachero'), pueblo: 'pueblo' in ${H}.progreso } })()`);
    ok(e.o && e.o.acreditado === true && Object.keys(e.o.xp).length === 0, 'una partida nueva arranca sin oficios');
    ok(!e.pueblo, 'y sin el pueblo de la 3.1 (3.6: ahora está la aldea)');

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
    e = await js(`(()=>({ nivel: ${H}.__aldea.oficios().nivel('hachero'), avisos: ${H}.__avisos().join(' | ') }))()`);
    ok(e.nivel === 1, `al cuarto árbol, nivel 1 de hachero (${e.nivel})`);
    ok(/Aprendiz de hachero/.test(e.avisos), 'y lo avisa con el título nuevo');
    r = await talar();
    ok(r.talado && r.troncos === 5, `la habilidad se aplica: ahora salen cinco troncos (${r.troncos})`);
    // hasta el nivel 3: el árbol cae con un hachazo menos
    let vueltas = 0;
    while ((await js(`${H}.__aldea.oficios().nivel('hachero')`)) < 3 && vueltas++ < 30) { r = await talar(); if (r.error) break; }
    e = await js(`(()=>({ nivel: ${H}.__aldea.oficios().nivel('hachero'), golpes: ${H}.__aldea.golpes(), avisos: ${H}.__avisos().join(' | ') }))()`);
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
    await esperar(1200);   // el nombre de la obra (window.prompt de la prueba)

    // ------------------------------------------------------------ el cuaderno
    seccion('el rango en el cuaderno');
    await js(`${tecla('KeyJ')} 1`);
    await esperar(300);
    e = await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista .pestanas button')].find((x) => /Oficios/.test(x.textContent)); if (!b) return 'sin pestaña'; b.click();
      return { pestana: b.textContent, rango: /Hachero de monte/.test(document.getElementById('cuaderno-lista').textContent) } })()`);
    ok(e && e.rango && e.pestana === 'Oficios y aldea', `el cuaderno muestra el rango (${JSON.stringify(e)})`);
    await js(`${tecla('KeyJ')} 1`);
    const oficiosAntes = await js(`JSON.stringify(${H}.progreso.oficios.xp)`);
    await js(`${H}.guardar(); 1`);

    // ------------------------------------------------------------ recargar
    seccion('recargar');
    await abrir();
    ok(await listo(), 'vuelve a cargar');
    await entrar();
    await cuadros(3);
    e = await js(`(()=>({ xp: JSON.stringify(${H}.progreso.oficios.xp), nivel: ${H}.__aldea.oficios().nivel('hachero'), golpes: ${H}.__aldea.golpes(), obras: ${H}.obras.obras.length }))()`);
    ok(e.xp === oficiosAntes && e.nivel === 3 && e.golpes === 2, `los oficios siguen (${e.xp})`);
    ok(e.obras >= 1, 'y el puesto');
  } catch (err) {
    errores.push(`excepción: ${err && err.message ? err.message : err}`);
  }
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n${errores.join('\n')}`); app.exit(1); return; }
  console.log('OK humo 3.1 oficios');
  app.exit(0);
});
