// 3.8.7 (progreso): lo del pase de bugs de la historia y el clima que necesita el juego de verdad:
//   1. la noche del temporal del capítulo 8: contestada la tarjeta, no vuelve a salir; la estación la anuncia; a la
//      noche el clima va a lluvia; a la medianoche todavía no se tilda y a la mañana sí (con la tarjeta del final y el
//      poncho), y recién después «lo que pasó después»;
//   2. «Largar de nuevo» a mitad de una carrera esconde el fantasma de la vuelta anterior.
// Uso: HOJ_PERFIL=<carpeta> npx electron --no-sandbox -r ./herramientas/perfil-propio.cjs pruebas/humo-3-8-7-progreso.cjs
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', 'perfil-progreso-387')));
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
  const abrir = async () => {
    try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); }
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__valle && window.__hojarasca.__caidas && window.__hojarasca.__caidas.modo() === "inicio")').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre' }, ${JSON.stringify(extra || {})})));`;
  // cuadros con tiempo de verdad entre uno y otro (el reloj del juego avanza); sin el mouse, la ventana oculta pasa a la
  // pausa: se vuelve al juego sin pedirlo
  const pasos = (n) => js(`(async()=>{ for (let i = 0; i < ${n}; i++) { if (${H}.__caidas.modo() === 'pausa') ${H}.volverAlJuego(true); ${H}.__bucle(); await new Promise(r => setTimeout(r, 15)); } return 1 })()`);
  const tarjeta = () => js(`({ abierta: ${H}.__valle.abierta(), texto: document.getElementById('valle-tarjeta').textContent.slice(0, 90) })`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    await js(`localStorage.clear(); ${ajustes({ relaxTipo: 'historia', clima: 'variable', duracion: 4 })} 1`);
    ok(await abrir(), 'una partida con historia');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2000);
    await pasos(4);

    // ============================================================ 1. la noche del temporal
    seccion('1. la noche del temporal del capítulo 8');
    const t0 = await js(`(()=>{ const V = ${H}.__valle, P = ${H}.progreso;
      V.revisarAhora(); V.tarjetas.elegir('empezar');
      P.horas = 15;
      P.historia = { activa: true, capitulo: 7, fase: 'jugando', hechos: { 'temporal:visita': P.dia, 'temporal:cuento': P.dia }, base: { dia: P.dia, visitas: 0, cuentos: 0 }, empezada: 1, terminada: 0, hablados: {}, momentos: {}, cerrados: {} };
      V.revisarAhora();
      const texto = document.getElementById('valle-tarjeta').textContent;
      const elegida = V.tarjetas.elegir('lena');
      return { texto: texto.slice(0, 60), elegida, dia: P.dia }; })()`);
    ok(/Se viene un temporal/.test(t0.texto) && t0.elegida, `llega la tarjeta del temporal y se contesta (${t0.texto})`);
    await pasos(4);
    const otra = await js(`(()=>{ const V = ${H}.__valle; const r = []; for (let i = 0; i < 4; i++) { V.revisarAhora(); r.push(V.abierta()); } return { r, veces: ${H}.progreso.eventosValle.veces.temporal } })()`);
    ok(!otra.r.some(Boolean) && otra.veces === 1, `contestada, no vuelve (${JSON.stringify(otra)})`);
    const pron = await js(`${H}.__maquinas.pronostico()[0]`);
    ok(pron.lluvia && /a la noche/.test(pron.texto), `la estación la anuncia (${pron.texto})`);
    await js(`${H}.progreso.horas = 19.5; 1`);
    await pasos(30);
    const noche = await js(`({ objetivo: ${H}.clima.estado.objetivo })`);
    ok(noche.objetivo === 'lluvia', `a la noche, el clima va a lluvia (${JSON.stringify(noche)})`);
    await js(`${H}.progreso.horas = 23.95; 1`);
    for (let i = 0; i < 20 && await js(`${H}.progreso.dia`) === t0.dia; i++) await pasos(60);   // hasta que pase la medianoche
    await js(`${H}.__valle.revisarAhora(); 1`);
    const media = await js(`({ dia: ${H}.progreso.dia, h: ${H}.progreso.horas, fase: ${H}.progreso.historia.fase, abierta: ${H}.__valle.abierta() })`);
    ok(media.dia === t0.dia + 1 && media.fase === 'jugando' && !media.abierta, `a la medianoche, en plena tormenta, todavía no termina (${JSON.stringify(media)})`);
    await js(`${H}.progreso.horas = 7.2; 1`);
    await pasos(5);
    await js(`${H}.__valle.revisarAhora(); 1`);
    let t = await tarjeta();
    ok(t.abierta && /Capítulo 8 · terminado/.test(t.texto), `a la mañana, la tarjeta del final (${t.texto})`);
    const fin = await js(`(()=>{ const V = ${H}.__valle, P = ${H}.progreso; const antes = P.cosas.poncho || 0; V.tarjetas.elegir('seguir'); return { fase: P.historia.fase, poncho: (P.cosas.poncho || 0) - antes } })()`);
    ok(fin.fase === 'fin' && fin.poncho === 1, `la historia termina con el poncho (${JSON.stringify(fin)})`);
    await pasos(4);
    await js(`${H}.__valle.revisarAhora(); 1`);
    t = await tarjeta();
    ok(t.abierta && /Lo que pasó después/.test(t.texto), `y después, lo que pasó con el temporal (${t.texto})`);
    await js(`${H}.__valle.tarjetas.elegir('seguir'); 1`);

    // ============================================================ 2. el fantasma al relargar
    seccion('2. «Largar de nuevo» esconde el fantasma');
    const f = await js(`(async()=>{ const M = ${H}.__modos(), js = ${H}.jugador.estado, T = ${H}.T, c = { x: -262, z: 50 };
      if (${H}.__caidas.modo() !== 'jugando') ${H}.volverAlJuego(true);
      // un récord con fantasma, armado a mano: la vuelta va derecho para el lado de la primera puerta
      const pts = []; for (let i = 0; i < 40; i++) pts.push(Math.round((c.x + i * 2) * 10), Math.round((c.z + i) * 10));
      M.__.estado().carreras.mejores.mirador = { ms: 60000, parciales: [], fecha: '', fantasma: { paso: 0.5, pts } };
      js.pos.set(c.x, T.altura(c.x, c.z) + 0.05, c.z);
      M.__.largar('mirador');
      const paso = async () => { if (${H}.__caidas.modo() === 'pausa') ${H}.volverAlJuego(true); ${H}.__bucle(); await new Promise(r => setTimeout(r, 16)); };
      for (let i = 0; i < 400 && M.__.estado().carrera.fase === 'cuenta'; i++) await paso();
      for (let i = 0; i < 30; i++) await paso();
      const fantasma = () => M.__.mundo.grupo.children.find((o) => o.geometry?.type === 'IcosahedronGeometry');
      const antes = fantasma()?.visible;
      const a = M.accion(js); const texto = a?.texto; a?.hacer(); await paso();
      return { fase: M.__.estado().carrera.fase, antes, texto, despues: fantasma()?.visible }; })()`);
    ok(f.antes === true && f.texto === 'Largar de nuevo' && f.fase === 'cuenta' && f.despues === false, `relargar esconde el fantasma durante la cuenta (${JSON.stringify(f)})`);
    await pasos(400);   // que termine (o se abandone) la carrera

    // ============================================================ 3. los fuegos (decisión del usuario)
    seccion('3. hasta cuatro fuegos, la siesta y el guardado');
    const fu = await js(`(async()=>{ const C = ${H}.clima, P = ${H}.progreso, J = ${H}.jugador.estado, T = ${H}.T, O = ${H}.obras;
      const paso = async (n = 3) => { for (let i = 0; i < n; i++) { if (${H}.__caidas.modo() === 'pausa') ${H}.volverAlJuego(true); ${H}.__bucle(); await new Promise(r => setTimeout(r, 16)); } };
      const R = T.lugares.refugio, out = {};
      // un fogón de piedra tuyo, terminado
      Object.assign(P.materiales, { tronco: 200, tabla: 200, piedra: 200 });
      const plano = ${H}.PLANOS.find((q) => q.id === 'fogon');
      let fogon = null;
      for (let d = 14; d < 60 && !fogon; d += 3) for (let a = 0; a < 6.28 && !fogon; a += 0.6) {
        const x = R.x + Math.cos(a) * d, z = R.z + Math.sin(a) * d;
        J.pos.set(x, T.altura(x, z) + 0.05, z);
        O.elegir(plano); const r = O.fundar(x, z, 0, J.pos.y); O.elegir(null);
        if (!r.ok) continue;
        for (let g = 0; g < 12 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const k = O.avanzar(r.obra, P.materiales); if (!k.ok) break; }
        P.obras = O.obras.map((o) => o.datos); fogon = r.obra;
      }
      out.fogon = !!fogon;
      // parado al lado, F prende el fogón (con su obra)
      J.pos.set(fogon.datos.x + 1.2, T.altura(fogon.datos.x + 1.2, fogon.datos.z) + 0.05, fogon.datos.z);
      J.yaw = Math.PI / 2;
      await paso(8);
      out.aviso = ${H}.__aviso();
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF', key: 'f', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyF', key: 'f', bubbles: true }));
      await paso(3);
      const delFogon = C.fogatas.find((f) => f.activa && f.duenio === fogon);
      out.conDuenio = !!delFogon;
      // tres fogatas más, lejos: con el fogón son cuatro, y todas arden a la vez
      P.ramitas = 30;
      for (let k = 0; k < 3; k++) { const x = fogon.datos.x + 12 + k * 6, z = fogon.datos.z + 8; C.encenderFogata(x, T.altura(x, z), z, 100 + k * 100); }
      await paso(4);
      out.cuatro = C.fogatas.filter((f) => f.activa && f.vida > 0).length;
      out.otroNoApaga = delFogon.activa && delFogon.vida > 0;
      // el más cercano es el del fogón (el calor, cocinar)
      out.cercano = C.fogata === delFogon;
      // la siesta los consume según lo dormido
      const antes = C.fogatas.map((f) => f.vida);
      P.horas = 13;
      ${H}.__dormir();
      await new Promise((r) => setTimeout(r, 2600));
      await paso(2);
      const seg = 2 * ((${H}.ajustes.duracion === 'reloj' ? 1440 : ${H}.ajustes.duracion) * 60) / 24;
      out.siesta = C.fogatas.map((f, i) => ({ antes: Math.round(antes[i]), despues: Math.round(f.vida), arde: f.activa && f.vida > 0 }));
      out.seg = seg;
      // guardar: van los que arden
      ${H}.guardar();
      out.guardadas = (P.fogatas || []).length;
      out.vivos = C.fogatas.filter((f) => f.activa && f.vida > 0).length;
      return out; })()`);
    ok(fu.fogon && fu.conDuenio, `F prende tu fogón y el fuego sabe de qué obra es (aviso: ${fu.aviso})`);
    ok(fu.cuatro === 4 && fu.otroNoApaga, `cuatro fuegos prendidos a la vez; prender otro no apaga el anterior (${fu.cuatro})`);
    ok(fu.cercano, 'el fuego que mira el calor y la cocina es el más cercano');
    const consumo = fu.siesta.filter((x) => x.antes > 0).every((x) => (x.antes - fu.seg > 0 ? x.arde && Math.abs(x.despues - (x.antes - fu.seg)) < 3 : !x.arde));
    ok(consumo && fu.siesta.some((x) => x.arde) && fu.siesta.some((x) => x.antes > 0 && !x.arde), `la siesta consume según lo dormido: unos siguen más bajos y otros se apagan (${JSON.stringify(fu.siesta)}, ${fu.seg} s)`);
    ok(fu.guardadas === fu.vivos && fu.vivos > 0, `se guardan los que arden (${fu.guardadas})`);
    // al recargar vuelven, el del fogón con su obra
    await abrir();
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2000);
    await pasos(4);
    const re = await js(`(()=>{ const C = ${H}.clima; return { vivos: C.fogatas.filter((f) => f.activa && f.vida > 0).length, conDuenio: C.fogatas.filter((f) => f.activa && f.duenio).length } })()`);
    ok(re.vivos === fu.vivos && re.conDuenio === 1, `al recargar vuelven los fuegos, el del fogón con su obra (${JSON.stringify(re)})`);
    // sin su obra, el fuego se apaga
    const sin = await js(`(async()=>{ const C = ${H}.clima, O = ${H}.obras; const f = C.fogatas.find((x) => x.activa && x.duenio); const o = f.duenio;
      O.destruir(o); ${H}.progreso.obras = O.obras.map((x) => x.datos);
      for (let i = 0; i < 3; i++) { if (${H}.__caidas.modo() === 'pausa') ${H}.volverAlJuego(true); ${H}.__bucle(); await new Promise(r => setTimeout(r, 16)); }
      return { apagado: !f.activa, otros: C.fogatas.filter((x) => x.activa && x.vida > 0).length } })()`);
    ok(sin.apagado && sin.otros === re.vivos - 1, `desarmado el fogón, su fuego se apaga y los demás siguen (${JSON.stringify(sin)})`);
  } catch (e) {
    errores.push(`excepción: ${e && e.stack ? e.stack : e}`);
  }
  if (errores.length) { console.log(`\nHUMO 3.8.7 PROGRESO: ${errores.length} problema(s)`); for (const e of errores) console.log(`  · ${e}`); app.exit(1); }
  else { console.log('\nHUMO 3.8.7 PROGRESO: todo en orden'); app.exit(0); }
});
