// Partida real 3.8.7 (aldea): lo del segundo pase de la aldea, en el mundo.
//   1. «¿Un mate?»: un vecino te viene a buscar y te invita; no cuenta hasta que llega a hablarte; el aviso dice «te quiere
//      decir algo», E abre la charla con «E: dale · Escape: ahora no», E acepta (van a tomar algo: la casa de té o tu mesa,
//      o ahí mismo) y suma amistad;
//   2. otra invitación: Escape, «Ahora no»: no se ofende ni baja la amistad;
//   3. el que sale a buscarte y no llega (te fuiste lejos): no gasta la espera, el cupo del día ni su vuelta de hoy;
//   4. la plaza: el que va a estar a la plaza se sienta en un banco de verdad (antes, en el aire);
//   5. el predio de la fiesta: la gente llega a la mesa larga caminando, sin trabarse contra la mesa (antes, saltos).
// Uso: electron pruebas/humo-3-8-7-aldea.cjs con HUMO_PERFIL=<carpeta propia> (borra el localStorage del perfil).
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
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
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea)').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const tecla = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const charla = () => js(`(()=>({ npc: ${H}.__charla().npc, texto: document.getElementById('charla-texto').textContent, seguir: document.getElementById('charla-seguir').textContent }))()`);
  // un vecino que te viene a invitar (a tomar algo, si `tomar`); devuelve { clave, id } o null
  const invitacion = (tomar, cualquiera = false) => js(`(()=>{ const S = ${H}.__social(); for (let i = 0; i < 400; i++) { const v = S.pendiente(); if (v?.npc) v.npc.camino = []; S.soltar(); for (const g of ${H}.gente.gente) g.__iniciativa = false;
      ${H}.progreso.vecindad.social && (${H}.progreso.vecindad.social.vino = {}, ${H}.progreso.vecindad.social.iniciativa = { dia: 0, n: 0, ultima: -99 });
      if (!S.forzarIniciativa()) continue; const p = S.pendiente(); if (p && (${cualquiera} || p.tipo === 'invitar') && (${cualquiera} || !${tomar} || p.id === 'mate' || p.id === 'cartas')) return { clave: p.clave, id: p.id, anotada: p.anotada }; }
      const v = S.pendiente(); if (v?.npc) v.npc.camino = []; S.soltar(); return null })()`);
  // vos, a 1,6 m del que viene, de frente
  const alLado = () => js(`(()=>{ const p = ${H}.__social().pendiente(); if (!p) return false; const n = p.npc, j = ${H}.jugador; const dx = j.estado.pos.x - n.pos.x, dz = j.estado.pos.z - n.pos.z, d = Math.hypot(dx, dz) || 1; const x = n.pos.x + dx / d * 1.6, z = n.pos.z + dz / d * 1.6; n.camino = [];
      j.ubicar(x, z, Math.atan2(-(n.pos.x - x), -(n.pos.z - z))); j.estado.pitch = -0.05; for (let i = 0; i < 8; i++) ${H}.__bucle(); return ${H}.__social().pendiente()?.anotada ?? null })()`);
  const amistad = (k) => js(`${H}.progreso.vecindad?.personas?.['${k}']?.p ?? 0`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', ritmoAldea: 'animado' })); return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
    await js(`(()=>{ const P = ${H}.progreso; const ORD = ['carpintero','veterinaria','panadera','herbolaria','herrero','modista','pescador','botera','maestra','pintora','enfermera','andinista','telegrafista','fotografa','tejedora','ceramista','apicultor','astronoma','guardaparque','musico'];
      const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
      P.aldea.pobladores = ORD.map((clave) => ({ clave, dia: 1 })); P.aldea.locales = Object.fromEntries(ORD.map((k) => [L[k], 1])); P.aldea.obras = {}; P.aldea.descubierta = 1;
      P.dia = 9; P.horas = 18; for (const k of ['jefe','nelida','abuela','padre','madre','galesa','martin', ...ORD]) ${H}.__aldea.amigo(k, 6);
      const pl = ${H}.__aldea.edificio('plaza'); ${H}.jugador.ubicar(pl.x, pl.z + 6, 0);
      for (let i = 0; i < 10; i++) { ${H}.__aldea.actualizar(0.6); ${H}.__aldea.mundo().prearmar(1e6); } return 1 })()`);
    for (let k = 0; k < 20; k++) { await cuadros(20); await esperar(40); }

    // ------------------------------------------------------------ 1. «Dale»
    seccion('«¿Un mate?»: Dale');
    let inv = await invitacion(true);
    ok(!!inv, `un vecino te viene a invitar (${inv ? `${inv.clave}: ${inv.id}` : 'nadie'})`);
    if (inv) {
      ok(inv.anotada === false && !(await js(`${H}.progreso.vecindad.social?.vino?.['${inv.clave}']`)), 'sale a buscarte sin gastar nada todavía');
      const llego = await alLado();
      ok(llego === true && (await js(`${H}.progreso.vecindad.social.vino['${inv.clave}'] === ${H}.progreso.dia`)), 'llegó a hablarte: ahora cuenta');
      const aviso = await js(`${H}.__avisoYa()?.texto || ''`);
      ok(/te quiere decir algo/.test(aviso), `el aviso: «${aviso}»`);
      const antes = await amistad(inv.clave);
      await js(`${tecla('KeyE')} 1`);
      let c = await charla();
      ok(c.npc && c.seguir === 'E: dale · Escape: ahora no', `E abre la invitación: «${c.texto}» [${c.seguir}]`);
      await js(`${tecla('KeyE')} 1`);
      c = await charla();
      ok(!!c.npc && c.texto.length > 0, `«Dale»: ${c.texto}`);
      for (let i = 0; i < 6 && (await js(`!!${H}.__charla().npc && !${H}.__rueda().abierta`)); i++) await js(`${tecla('KeyE')} 1`);
      const cita = await js(`${H}.__vecindad()?.cita?.() || null`);
      const despues = await amistad(inv.clave);
      ok(despues > antes, `suma amistad (${antes} → ${despues})${cita ? `; van a tomar algo: ${cita.que === 'te' ? 'la casa de té' : 'tu mesa'}` : '; lo hicieron ahí mismo'}`);
      await js(`(()=>{ for (let i = 0; i < 6 && ${H}.__charla().npc; i++) document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })); ${H}.__vecindad()?.terminarCita?.('fin'); return 1 })()`);
    }

    // ------------------------------------------------------------ 2. «Ahora no»
    seccion('«Ahora no»');
    inv = await invitacion(false);
    ok(!!inv, `otro te invita (${inv ? `${inv.clave}: ${inv.id}` : 'nadie'})`);
    if (inv) {
      await alLado();
      const antes = await amistad(inv.clave);
      await js(`${tecla('KeyE')} 1`);
      let c = await charla();
      ok(c.seguir === 'E: dale · Escape: ahora no', `la invitación: «${c.texto}»`);
      await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })); 1`);
      c = await charla();
      const of = await js(`!!${H}.progreso.vecindad.social?.ofendido?.['${inv.clave}']`);
      const cita2 = await js(`${H}.__vecindad()?.cita?.() || null`), despues = await amistad(inv.clave);
      ok(!c.npc && !of && despues >= antes && !cita2, `Escape: la charla se cierra, no se ofende, la amistad no baja (lo de saludarlo, sí suma) y no van a ningún lado (${JSON.stringify({ charla: c.npc, of, antes, despues, cita: cita2 && cita2.clave })})`);
    }

    // ------------------------------------------------------------ 3. el que no llega
    seccion('el que sale a buscarte y no llega');
    inv = await invitacion(false, true);
    if (inv) {
      const n0 = await js(`${H}.progreso.vecindad.social?.iniciativa?.n || 0`);
      await js(`(()=>{ const r = ${H}.T.lugares.refugio; ${H}.jugador.ubicar(r.x, r.z, 0); for (let i = 0; i < 6; i++) { ${H}.__aldea.actualizar(0.6); ${H}.__bucle(); } return 1 })()`);
      const r = await js(`({ pend: !!${H}.__social().pendiente(), vino: ${H}.progreso.vecindad.social?.vino?.['${inv.clave}'] || 0, n: ${H}.progreso.vecindad.social?.iniciativa?.n || 0 })`);
      ok(!r.pend && !r.vino && r.n === n0, `te fuiste lejos: se volvió sin gastar nada (${JSON.stringify(r)})`);
    } else ok(false, 'no salió nadie a buscarte');

    // ------------------------------------------------------------ 4. la plaza
    seccion('la plaza: en un banco');
    const banco = await js(`(()=>{ const pl = ${H}.__aldea.edificio('plaza'); ${H}.jugador.ubicar(pl.x + 2, pl.z + 6, 0); const A = ${H}.__aldea.mundo();
      for (let i = 0; i < 8; i++) { ${H}.__aldea.actualizar(0.6); ${H}.__bucle(); }
      const S = ${H}.est?.sentaderos || [], P = ${H}.__aldea.puntos('plaza'), lejos = [];
      for (let k = 1; k <= 12; k++) { const q = P['estar-' + k]; const d = Math.min(...S.map((s) => Math.hypot(s.x - q.x, s.z - q.z))); if (d > 0.3) lejos.push(k + ':' + d.toFixed(2)); }
      return lejos })()`);
    ok(banco.length === 0, `los doce lugares sentados de la plaza son asientos de banco (${banco.join(', ')})`);

    // ------------------------------------------------------------ 5. el predio
    seccion('la mesa larga de la fiesta');
    const r5 = await js(`(()=>{ const P = ${H}.progreso, A = ${H}.__aldea.mundo(), j = ${H}.jugador; P.dia = 2; P.horas = 11.0; ${H}.__fiestas()?.reiniciarDia?.();
      const pr = ${H}.__fiestasMundo?.()?.centro?.() || null; if (pr) j.ubicar(pr.x + 8, pr.z + 8, 0);
      for (let i = 0; i < 6; i++) { ${H}.__aldea.actualizar(0.6); A.prearmar(1e6); }
      for (let i = 0; i < 300; i++) ${H}.__bucle();
      // (los saltos de los que ves: los que están a más de 130 m no caminan y llegan de una, como siempre)
      let saltos = 0; const quien = [];
      for (let paso = 0; paso < 70; paso++) { P.horas = 11.0 + paso / 40; for (const g of ${H}.gente.gente) if (g.claveAldea) g.alAmor = true; for (let i = 0; i < 25; i++) ${H}.gente.actualizar(0.1, j.estado, ${H}.camara, null, 0);
        const antes = new Map([...A.personas].filter(([, st]) => st.npc && st.npc.g?.visible).map(([k, st]) => [k, st.saltos || 0]));
        ${H}.__aldea.actualizar(2.5); ${H}.__fiestas()?.actualizar(2.5);
        // (la primera media hora, no: venían del salto de día y hora de la prueba)
        if (paso >= 20) for (const [k, n] of antes) if ((A.personas.get(k).saltos || 0) > n) { saltos++; quien.push(k + '→' + A.personas.get(k).destino?.punto); } }
      const enMesa = [...A.personas].filter(([, st]) => st.destino?.edificio === 'predio' && /^mesa-/.test(st.destino.punto || '') && st.npc && !st.npc.camino?.length && Math.hypot(st.npc.pos.x - st.destino.x, st.npc.pos.z - st.destino.z) < 0.3).length;
      return { centro: !!pr, saltos, quien, enMesa } })()`);
    ok(r5.centro && r5.enMesa >= 6 && r5.saltos <= 2, `a la mesa larga caminando: ${r5.enMesa} sentados, ${r5.saltos} saltos de los que se ven (antes, casi todos) ${r5.quien.join(' ')}`);
  } catch (e) { errores.push(String(e && e.stack ? e.stack : e)); console.log('ERROR', e); }
  console.log(errores.length ? `✗ ${errores.length} problemas:\n  ${errores.join('\n  ')}` : '✓ humo-3-8-7-aldea: todo en orden');
  app.exit(errores.length ? 1 : 0);
});
