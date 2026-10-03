// Partida real 3.6 (Electron + WebGL): la gente de la Aldea de los Duendes.
//  · la parada del sur se llama «Aldea de los Duendes» (sólo en el Relax) y al llegar se anota
//    en el cuaderno;
//  · los siete vecinos, cada uno donde le toca a cuatro horas distintas (dejados en su lugar con
//    vos lejos, y caminando por las calles con vos cerca);
//  · para la trochita en la aldea y baja el carpintero; se le habla con E, se presenta, pide
//    quedarse y al aceptarlo se abre la obra de su lote;
//  · se aporta a las cuatro etapas con E (con material de la prueba) y se pasan los días: una
//    etapa por vez aunque el reloj salte dos días; abre la carpintería y su servicio anda;
//  · el domingo a la mañana la abuela lee cuentos en la biblioteca: de cerca se oye la charla
//    (un renglón chico, de a una línea);
//  · una partida de la 3.1 con dos pobladores carga con los dos en la aldea, su local abierto;
//  · en el Desafío no hay nada de la aldea.
// Uso: npx electron pruebas/humo-3-6-aldea.cjs --user-data-dir=<carpeta propia>
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
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre' }, ${JSON.stringify(extra || {})})));`;
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const tecla = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  // la aldea: lo que pasa cada medio segundo, `n` veces (las figuras se arman de a una por llamada)
  const aldea = (n = 1, dt = 0.6) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__aldea.actualizar(${dt}); return 1 })()`);
  const estado = () => js(`${H}.__aldea.mundo().estado()`);
  // pone al jugador en (x, z) mirando hacia (mx, mz)
  const ubicar = (x, z, mx = null, mz = null) => js(`(()=>{ const j = ${H}.jugador; const x = ${x}, z = ${z}; const mx = ${mx === null ? 'x' : mx}, mz = ${mz === null ? 'z + 1' : mz};
    j.ubicar(x, z, Math.atan2(-(mx - x), -(mz - z))); j.estado.pitch = -0.05; return 1 })()`);
  // lejos de la aldea (en el refugio): la gente queda en su lugar sin caminar
  const irLejos = () => js(`(()=>{ const r = ${H}.T.lugares.refugio; ${H}.jugador.ubicar(r.x, r.z, 0); return 1 })()`);
  const plaza = async () => { const p = await js(`${H}.__aldea.edificio('plaza')`); await ubicar(p.x, p.z); };
  // la gente camina de verdad, a pasos fijos (la ventana oculta corre a los saltos)
  const caminar = (pasos = 600) => js(`(()=>{ const j = ${H}.jugador.estado; for (let i = 0; i < ${pasos}; i++) { ${H}.gente.actualizar(0.05, j, ${H}.camara, null, 0); if (i % 10 === 0) ${H}.__aldea.actualizar(0.5); } return 1 })()`);
  const npc = (clave) => `${H}.__aldea.mundo().personas.get('${clave}').npc`;
  // habla con alguien de la aldea: enfrente, E hasta que se cierra la charla
  const hablarCon = async (clave, maximo = 10) => {
    const p = await js(`(()=>{ const n = ${npc(clave)}; return n ? { x: n.pos.x, z: n.pos.z } : null })()`);
    if (!p) return { error: 'no está' };
    await js(`(()=>{ const j = ${H}.jugador, T = ${H}.T; const x = ${p.x}, z = ${p.z};
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, px = x + Math.cos(a) * 1.6, pz = z + Math.sin(a) * 1.6; if (!T.agua(px, pz)) { j.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz))); break; } }
      j.estado.pitch = -0.05; return 1 })()`);
    await cuadros(6);
    // 3.5.1: la ventana oculta no corre requestAnimationFrame: quién está enfrente se mira 15
    // veces por segundo, así que entre tandas de cuadros tiene que pasar tiempo real
    for (let i = 0; i < 3; i++) { await esperar(70); await cuadros(2); }
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
  // el aviso de E, dejando pasar tiempo real (se mira 10 veces por segundo)
  const avisoAhora = async () => { await cuadros(4); for (let i = 0; i < 3; i++) { await esperar(120); await cuadros(2); } return js(`${H}.__aviso()`); };
  const avisos = (n = 6) => js(`${H}.__avisos().slice(-${n}).join(' | ')`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes()} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();

    // ------------------------------------------------------------ el lugar
    seccion('la parada de la aldea');
    let e = await js(`(()=>{ const P = ${H}.progreso; return { aldea: P.aldea, pueblo: 'pueblo' in P, paradas: ${H}.tren.paradas.map((p) => ({ nombre: p.nombre, aldea: !!p.aldea, antes: p.nombreAntes || null })), anotada: !!P.entradas.aldea } })()`);
    const pAldea = e.paradas.find((p) => p.aldea);
    ok(!!pAldea && pAldea.nombre === 'Aldea de los Duendes' && !!pAldea.antes, `la parada del sur se llama Aldea de los Duendes (antes: ${pAldea?.antes})`);
    ok(e.aldea && e.aldea.pobladores.length === 0 && !e.pueblo && !e.anotada, 'la aldea empieza como el primer día, sin el pueblo de la 3.1 y sin anotar');
    e = await js(`(()=>{ ${H}.progreso.horas = 10; return 1 })()`);
    await plaza();
    await aldea(30);
    e = await js(`(()=>({ anotada: !!${H}.progreso.entradas.aldea, dia: ${H}.progreso.aldea.descubierta, avisos: ${H}.__avisos().slice(-6).join(' | '), estado: ${H}.__aldea.mundo().estado() }))()`);
    ok(e.anotada && e.dia >= 1, `al llegar se anota en el cuaderno (día ${e.dia})`);
    ok(/Aldea de los Duendes/.test(e.avisos), 'con su aviso');
    ok(e.estado.npcs.length === 9 && e.estado.npcs.some((n) => n.clave === 'ercilia') && e.estado.npcs.every((n) => !n.dormido), `los ocho vecinos y Ercilia están, despiertos (${e.estado.npcs.map((n) => n.clave).join(', ')})`);
    e = await js(`${H}.gente.gente.filter((g) => g.clave === 'ercilia').length`);
    ok(e === 1, 'Ercilia es una sola: la de siempre');

    // ------------------------------------------------------------ los horarios
    seccion('los vecinos a cuatro horas del día');
    // el día 1 es lunes. [hora, quién, edificio, punto (o null: cualquiera)]
    const esperado = [
      [3, [['jefe', 'casa-jefe', 'cama'], ['nene', 'casa-familia', 'cama-chicos'], ['abuela', 'casa-abuela', 'cama']]],
      [10, [['jefe', 'estacion-aldea', null], ['abuela', 'biblioteca', 'adentro'], ['padre', 'casa-familia', 'trabajo']]],
      [13, [['madre', 'casa-familia', 'adentro'], ['nena', 'casa-familia', 'adentro']]],
      [16.6, [['abuela', 'plaza', null], ['nene', 'plaza', null], ['madre', 'plaza', null]]],
    ];
    for (const [hora, quienes] of esperado) {
      // lejos, la gente se deja directo en su lugar; al volver, cada uno está donde le toca
      await irLejos();
      await js(`${H}.progreso.horas = ${hora}; 1`);
      await aldea(3);
      await plaza();
      await aldea(2);
      e = await estado();
      for (const [k, ed, pt] of quienes) {
        const n = e.npcs.find((x) => x.clave === k);
        const d = n && n.destino ? Math.hypot(n.x - n.destino.x, n.z - n.destino.z) : 99;
        ok(n && n.destino.edificio === ed && (!pt || n.destino.punto === pt) && d < 1.2 && !n.caminando, `a las ${hora}, ${k} en ${n?.destino?.edificio}/${n?.destino?.punto} (${d.toFixed(2)} m)`);
      }
    }
    // con vos cerca caminan: de la plaza (16.6) a almorzar a su casa (13), por las calles. Vos,
    // en la punta de la calle de la Vía (con vos al lado, la gente se para a mirarte)
    const punta = await js(`${H}.__aldea.edificio('pescaderia')`);
    await ubicar(punta.x, punta.z);
    await js(`${H}.progreso.horas = 13; 1`);
    await aldea(2);
    e = await js(`(()=>{ const st = ${H}.__aldea.mundo().personas.get('padre'); return { camino: st.npc.camino.map((q) => ({ x: q.x, z: q.z })), destino: st.destino } })()`);
    ok(e.camino.length >= 2, `el padre vuelve a almorzar caminando por un camino de ${e.camino.length} puntos`);
    // (los saltos de antes son de la prueba: corre la aldea sin mover a la gente)
    const saltos0 = (await estado()).saltos;
    await caminar(4000);
    e = await estado();
    e.saltos -= saltos0;
    const llegaron = e.npcs.filter((n) => n.destino && !n.caminando && Math.hypot(n.x - n.destino.x, n.z - n.destino.z) < 1.2);
    ok(e.saltos === 0, `ninguno se trabó en el camino (${e.saltos}: ${e.npcs.filter((n) => n.saltos).map((n) => `${n.clave} ${n.saltos}`).join(', ')})`);
    ok(llegaron.length === e.npcs.length, `todos llegaron caminando a su lugar (${llegaron.length} de ${e.npcs.length}: ${e.npcs.filter((n) => !llegaron.includes(n)).map((n) => `${n.clave} a ${Math.hypot(n.x - n.destino.x, n.z - n.destino.z).toFixed(1)} m`).join(', ')})`);

    // ------------------------------------------------------------ la llegada
    seccion('baja el carpintero');
    e = await js(`(()=>{ const P = ${H}.progreso; P.horas = 10; ${H}.__aldea.mundo().revisarLlegada(true); return { llegando: P.aldea.llegando } })()`);
    ok(!e.llegando, 'con el valle sin anotar todavía no baja nadie');
    e = await js(`(()=>{ const P = ${H}.progreso; for (const id of ${H}.__aldea.entradas().slice(0, 14)) P.entradas[id] = P.entradas[id] || { dia: 1, hora: 9, cantidad: 0 };
      const t = ${H}.tren, p = t.paradas.find((x) => x.aldea); t.est.s = p.s; t.est.proxima = p; t.est.parado = 60; t.est.vel = 0; return Object.keys(P.entradas).length })()`);
    await aldea(4);
    e = await js(`(()=>({ llegando: ${H}.progreso.aldea.llegando, avisos: ${H}.__avisos().slice(-4).join(' | ') }))()`);
    ok(e.llegando?.clave === 'carpintero', `paró la trochita en la aldea y bajó el carpintero (${JSON.stringify(e.llegando)})`);
    ok(/Bajó alguien del tren en la Aldea de los Duendes/.test(e.avisos), 'y se avisa');
    await aldea(4);
    e = await estado();
    let c = e.npcs.find((n) => n.clave === 'carpintero');
    ok(c && c.llegando && c.destino.edificio === 'estacion-aldea' && c.destino.punto === 'anden', `espera en el andén (${JSON.stringify(c?.destino)})`);

    seccion('hablarle y aceptarlo');
    let h = await hablarCon('carpintero');
    ok(/Hablar con Tito Arrieta/.test(h.aviso), `el aviso de E dice con quién (${h.aviso})`);
    ok(h.textos.some((t) => /carpintero/.test(t)) && h.textos.some((t) => /E: que se quede/.test(t)), `se presenta y pide quedarse (${h.textos.length} renglones)`);
    e = await js(`(()=>({ aldea: ${H}.progreso.aldea, avisos: ${H}.__avisos().slice(-5).join(' | '), visual: ${H}.__aldea.mundo().estadoVisual('carpinteria') }))()`);
    ok(e.aldea.pobladores.length === 1 && e.aldea.pobladores[0].clave === 'carpintero' && !e.aldea.llegando, 'lo aceptaste: se queda');
    ok(!!e.aldea.obras.carpinteria && e.visual === 'obra-1', `se abrió la obra de la carpintería (${e.visual})`);
    ok(/Tito Arrieta se queda en la Aldea de los Duendes/.test(e.avisos), 'con su aviso');

    // ------------------------------------------------------------ la obra
    seccion('las cuatro etapas de la obra');
    const lote = await js(`${H}.__aldea.edificio('carpinteria')`);
    await ubicar(lote.x, lote.z);
    // primero un aporte que no alcanza
    await js(`(()=>{ const P = ${H}.progreso; P.materiales = { tronco: 0, tabla: 0, piedra: 3 }; return 1 })()`);
    let aviso = await avisoAhora();
    ok(/^.*Aportar a la obra de la carpintería \(faltan \d+ piedras y \d+ troncos\)/.test(aviso), `parado en el lote, el aviso (${aviso})`);
    await js(`${tecla('KeyE')} 1`);
    e = await js(`(()=>({ obra: ${H}.progreso.aldea.obras.carpinteria, piedra: ${H}.progreso.materiales.piedra }))()`);
    ok(e.obra.aportado.piedra === 3 && e.piedra === 0, `E aporta lo que tengas aunque no alcance (${JSON.stringify(e.obra.aportado)})`);
    aviso = await avisoAhora();
    ok(/faltan/.test(aviso), `y el aviso dice lo que falta (${aviso})`);
    let dia = await js(`${H}.progreso.dia`);
    for (let etapa = 1; etapa <= 4; etapa++) {
      await js(`(()=>{ const P = ${H}.progreso; P.materiales = { tronco: 40, tabla: 40, piedra: 40 }; P.horas = 15; return 1 })()`);
      await ubicar(lote.x, lote.z);
      aviso = await avisoAhora();
      await js(`${tecla('KeyE')} 1`);
      e = await js(`(()=>({ obra: ${H}.progreso.aldea.obras.carpinteria || null, avisos: ${H}.__avisos().slice(-3).join(' | '), mat: ${H}.progreso.materiales, aviso: ${H}.__aviso() }))()`);
      ok(e.obra && e.obra.lista && /Aportaste/.test(e.avisos), `etapa ${etapa}: «${aviso}» y E la completa (lista el día ${e.obra?.lista?.dia})`);
      aviso = await avisoAhora();
      ok(/los vecinos están trabajando/.test(aviso), `y el aviso dice que los vecinos trabajan (${aviso})`);
      ok(e.mat.tronco < 40 || e.mat.tabla < 40, 'se descuenta el material');
      // el reloj salta dos días (como al dormir mucho): igual avanza una sola etapa
      await js(`(()=>{ const P = ${H}.progreso; P.dia += ${etapa === 1 ? 2 : 1}; P.horas = 7.5; return 1 })()`);
      await aldea(2);
      e = await js(`(()=>({ obra: ${H}.progreso.aldea.obras.carpinteria || null, locales: ${H}.progreso.aldea.locales, avisos: ${H}.__avisos().slice(-3).join(' | '), visual: ${H}.__aldea.mundo().estadoVisual('carpinteria') }))()`);
      if (etapa < 4) ok(e.obra && e.obra.etapa === etapa && !e.obra.lista && e.visual === `obra-${etapa + 1}`, `al otro día a la mañana: ${etapa} de 4 etapas hechas (${e.visual}; ${e.avisos.split(' | ').pop()})`);
      else ok(!e.obra && e.locales.carpinteria && e.visual === 'abierto' && /Abrió la carpintería de Tito Arrieta/.test(e.avisos), `abrió la carpintería (${e.avisos})`);
    }

    seccion('el servicio del carpintero');
    // un martes/miércoles a las 10: atiende en su local
    await irLejos();
    await js(`(()=>{ const P = ${H}.progreso; P.horas = 10; while (((P.dia - 1) % 7) > 4) P.dia++; return 1 })()`);
    await aldea(3);
    await plaza();
    await aldea(3);
    e = await estado();
    c = e.npcs.find((n) => n.clave === 'carpintero');
    ok(c && c.destino.edificio === 'carpinteria', `de mañana trabaja en su local (${c?.destino?.edificio}/${c?.destino?.punto})`);
    await js(`(()=>{ const P = ${H}.progreso; P.materiales.tronco = 3; P.materiales.tabla = 10; return 1 })()`);
    h = await hablarCon('carpintero');
    e = await js(`(()=>({ tronco: ${H}.progreso.materiales.tronco || 0, tabla: ${H}.progreso.materiales.tabla || 0 }))()`);
    ok(h.textos.some((t) => /E: dale/.test(t)), `ofrece aserrar tus troncos (${h.textos.join(' / ').slice(0, 160)})`);
    ok(e.tronco === 0 && e.tabla === 25, `con E: tres troncos, quince tablas (${JSON.stringify(e)})`);

    // ------------------------------------------------------------ los cuentos
    seccion('el domingo, los cuentos de la abuela');
    await irLejos();
    await js(`(()=>{ const P = ${H}.progreso; while (((P.dia - 1) % 7) !== 6) P.dia++; P.horas = 10.5; return 1 })()`);
    await aldea(3);
    await plaza();
    await aldea(3);
    e = await js(`(()=>{ const n = ${npc('abuela')}, st = ${H}.__aldea.mundo().personas.get('abuela'); return { x: n.pos.x, z: n.pos.z, destino: st.destino } })()`);
    ok(e.destino.edificio === 'biblioteca' && e.destino.punto === 'cuentos', `la abuela lee en la biblioteca (${e.destino.edificio}/${e.destino.punto})`);
    await ubicar(e.x + 2, e.z, e.x, e.z);
    let oido = [];
    for (let i = 0; i < 30 && oido.length < 2; i++) {
      await aldea(1, 0.6);
      const r = await js(`${H}.__aldea.renglon()`);
      if (r && !oido.includes(r)) oido.push(r);
    }
    e = await estado();
    ok(oido.length >= 2 && oido.every((t) => /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+: /.test(t)), `se oye la charla de a una línea (${oido.join(' / ').slice(0, 200)})`);
    ok(oido.some((t) => /^Herminia: /.test(t)), 'y lee la abuela');
    await irLejos();
    await aldea(2);
    ok(!(await js(`${H}.__aldea.renglon()`)), 'lejos, la charla se apaga');

    // ------------------------------------------------------------ el cuaderno
    seccion('la ficha de la aldea');
    await js(`${tecla('KeyJ')} 1`);
    await esperar(300);
    e = await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista .pestanas button')].find((x) => /Oficios/.test(x.textContent)); if (!b) return 'sin pestaña'; b.click();
      const a = document.querySelector('#cuaderno-lista button[data-oficio="aldea"]'); if (!a) return 'sin aldea'; a.click();
      return { pestana: b.textContent, ficha: document.getElementById('cuaderno-ficha').textContent } })()`);
    ok(e.pestana === 'Oficios y aldea' && /Aldea de los Duendes/.test(e.ficha) && /Tito Arrieta, carpintero: atiende la carpintería/.test(e.ficha) && /(El próximo en llegar: Rosa Quilodrán|Rosa Quilodrán espera en el andén)/.test(e.ficha), `la ficha dice quién vive, qué abrió y quién sigue (${String(e.ficha).slice(-420)})`);
    await js(`${tecla('KeyJ')} 1`);
    await js(`${H}.guardar(); 1`);

    // ------------------------------------------------------------ una partida de la 3.1
    seccion('una partida 3.1 con dos pobladores');
    // la partida se retoca con el juego cerrado (si no, al descargarse la página la vuelve a
    // guardar): en una página vacía del mismo origen (file://)
    const vacia = path.join(require('os').tmpdir(), 'hojarasca-humo-3-6-vacia.html');
    require('fs').writeFileSync(vacia, '<!doctype html><meta charset="utf-8"><title>vacía</title>');
    await w.loadFile(vacia);
    await js(`(()=>{ const P = JSON.parse(localStorage.getItem('hojarasca-v1')); delete P.aldea;
      P.pueblo = { nombre: 'Villa Lenga', cartel: { x: 1, z: 2, rot: 0 }, pobladores: [
        { clave: 'carpintero', casa: { id: 'puesto@10.0,20.0', plano: 'puesto', nombre: 'El Rincón', x: 10, z: 20, rot: 0 }, dia: 2 },
        { clave: 'panadera', casa: { id: 'casilla@30.0,20.0', plano: 'casilla', nombre: 'tu casa', x: 30, z: 20, rot: 0 }, dia: 4 }],
        llegando: null, ultimaLlegada: 4, llamado: false, usos: {}, afilado: 0, mandado: null, mandados: 0 };
      P.horas = 10; while (((P.dia - 1) % 7) > 4) P.dia++;
      localStorage.setItem('hojarasca-v1', JSON.stringify(P)); localStorage.removeItem('hojarasca-v1-backup'); return 1 })()`);
    await abrir();
    ok(await listo(), 'vuelve a cargar');
    await entrar();
    e = await js(`(()=>({ pueblo: 'pueblo' in ${H}.progreso, aldea: ${H}.progreso.aldea, lugar: !!${H}.T.lugares['pueblo-propio'] }))()`);
    ok(!e.pueblo && !e.lugar && e.aldea.pobladores.map((p) => p.clave).join() === 'carpintero,panadera', 'el pueblo se mudó a la aldea (sin nombre ni cartel)');
    ok(!!e.aldea.locales.carpinteria && !!e.aldea.locales.panaderia && !Object.keys(e.aldea.obras).length, 'con sus dos locales ya abiertos');
    await js(`${H}.progreso.horas = 10.5; 1`);
    await plaza();
    await aldea(30);
    e = await estado();
    for (const [k, local] of [['carpintero', 'carpinteria'], ['panadera', 'panaderia']]) {
      const n = e.npcs.find((x) => x.clave === k);
      ok(n && n.destino.edificio === local && Math.hypot(n.x - n.destino.x, n.z - n.destino.z) < 1.2, `${k}: en su local (${n?.destino?.edificio}/${n?.destino?.punto})`);
    }
    await js(`(()=>{ const P = ${H}.progreso; P.cosas.yerba = 5; return 1 })()`);
    h = await hablarCon('panadera');
    e = await js(`(()=>({ yerba: ${H}.progreso.cosas.yerba, pan: ${H}.progreso.entradas['pan-casero']?.cantidad || 0 }))()`);
    ok(e.yerba === 3 && e.pan === 3, `la panadera cambia pan por yerba (${JSON.stringify(e)})`);

    // ------------------------------------------------------------ el Desafío
    seccion('en el Desafío no hay aldea');
    await js(`(()=>{ ${ajustes({ modo: 'desafio', ranura: 1 })} return 1 })()`);
    await abrir();
    ok(await listo(), 'carga el Desafío');
    await entrar();
    e = await js(`(()=>({ mundo: !!${H}.__aldea.mundo(), paradas: ${H}.tren.paradas.map((p) => p.nombre), gente: ${H}.gente.gente.filter((g) => /^(aldea|poblador)-/.test(g.clave)).length, desafio: !!${H}.desafio }))()`);
    ok(e.desafio && !e.mundo && e.gente === 0, 'ni gente ni obras de la aldea');
    ok(!e.paradas.includes('Aldea de los Duendes'), `la parada del sur con su nombre de siempre (${e.paradas.join(', ')})`);
    await js(`(()=>{ ${ajustes()} return 1 })()`);
  } catch (err) {
    errores.push(`excepción: ${err && err.message ? err.message : err}`);
  }
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n${errores.join('\n')}`); app.exit(1); return; }
  console.log('OK humo 3.6 aldea');
  app.exit(0);
});
