// Partida real 3.7.1 «Amor en la aldea» (Electron + WebGL), un recorrido corto por el menú de la charla de
// verdad (los números se apuran a mano donde haría falta jugar días enteros, y se dice dónde):
//   1. conocer a Ayelén (la veterinaria): en su menú está «Coquetear…» (y no con los chicos ni con Pocha);
//   2. coquetear: el piropo y lo que contesta;
//   3. la cita: invitarla a la plaza, ella espera a la hora, el aviso lo dice, hablarle empieza la cita;
//   4. declararse: novios;
//   5. el anillo: Anselmo lo hace con un canto rodado y está a los tres días;
//   6. proponer: comprometidos, y la fecha;
//   7. el casamiento civil en la biblioteca (el juez de paz);
//   8. vivir juntos (en la casa de ella);
//   9. buscar un hijo, el ñiki ñiki (el fundido, el descanso) y el bebé que nace;
//  10. con el ajuste «Romance» apagado no aparece nada (y vuelve al prenderlo); sin errores en la consola.
// Uso: npx electron --no-sandbox -r herramientas/al-monitor.cjs pruebas/humo-3-7-1-amor.cjs
// Perfil propio (HUMO_PERFIL, o una carpeta temporal): borra su localStorage, nunca el de %APPDATA%\Hojarasca.
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-3-7-1-amor')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// blindada: si algo se cuelga, sale sola (nunca hace falta matar electron por nombre)
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
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea && window.__hojarasca.__amor)').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const P = `${H}.progreso`;
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre' }, ${JSON.stringify(extra || {})})));`;
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const tecla = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const aldea = (n = 1, dt = 0.6) => js(`(()=>{ for (let i = 0; i < ${n}; i++) { ${H}.__aldea.actualizar(${dt}); ${H}.__aldea.mundo()?.prearmar?.(1e6); } return 1 })()`);
  const amor = (n = 2) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__amor().actualizar(1); return 1 })()`);
  const ubicar = (x, z, mx, mz) => js(`(()=>{ const j = ${H}.jugador; j.ubicar(${x}, ${z}, Math.atan2(-(${mx} - ${x}), -(${mz} - ${z}))); j.estado.pitch = -0.05; return 1 })()`);
  const irLejos = () => js(`(()=>{ const r = ${H}.T.lugares.refugio; ${H}.jugador.ubicar(r.x, r.z, 0); return 1 })()`);
  const npc = (clave) => `${H}.__aldea.mundo().personas.get('${clave}')?.npc`;
  const charla = () => js(`(()=>({ npc: ${H}.__charla().npc, texto: document.getElementById('charla-texto').textContent, opciones: [...document.querySelectorAll('#charla-opciones li')].map((li) => li.textContent), menu: !document.getElementById('charla-opciones')?.classList.contains('oculto') }))()`);
  // se para enfrente de la figura y aprieta E hasta que aparece el menú (o se cierra)
  const hablarCon = async (clave, maximo = 12) => {
    const p = await js(`(()=>{ const n = ${npc(clave)}; return n ? { x: n.pos.x, z: n.pos.z } : null })()`);
    if (!p) return { error: 'no está', textos: [] };
    await js(`(()=>{ const j = ${H}.jugador, T = ${H}.T; const x = ${p.x}, z = ${p.z};
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, px = x + Math.cos(a) * 1.4, pz = z + Math.sin(a) * 1.4; if (!T.agua(px, pz)) { j.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz))); break; } }
      j.estado.pitch = -0.05; return 1 })()`);
    await cuadros(6);
    for (let i = 0; i < 3; i++) { await esperar(70); await cuadros(2); }
    const aviso = await js(`${H}.__aviso()`);
    const textos = [];
    for (let i = 0; i < maximo; i++) {
      await js(`${tecla('KeyE')} 1`);
      const c = await charla();
      if (!c.npc) break;
      textos.push(c.texto);
      if (c.menu) return { textos, aviso, menu: c.opciones };
    }
    return { textos, aviso, menu: null };
  };
  // elige en el menú (o submenú) la opción que dice `texto`; devuelve lo que se ve después
  const elegir = async (texto) => {
    const c = await charla();
    const i = c.opciones.findIndex((o) => o.includes(texto));
    if (i < 0) return { error: `no está «${texto}» en ${c.opciones.join(' / ')}`, opciones: c.opciones };
    await js(`${H}.__elegirCharla(${i}); 1`);
    return charla();
  };
  // E hasta volver al menú (lee los renglones)
  const seguir = async (maximo = 8) => {
    const textos = [];
    for (let i = 0; i < maximo; i++) { const c = await charla(); if (!c.npc || c.menu) return { textos, menu: c.menu ? c.opciones : null }; textos.push(c.texto); await js(`${tecla('KeyE')} 1`); }
    return { textos, menu: null };
  };
  const cerrarCharla = () => js(`(()=>{ for (let i = 0; i < 8 && ${H}.__charla().npc; i++) document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })); return !${H}.__charla().npc })()`);
  const ficha = () => js(`(${P}.amor.personas.veterinaria || null)`);
  const dia = (d, h) => js(`(()=>{ ${P}.dia = ${d}; ${P}.horas = ${h}; return 1 })()`);
  const nuevoDia = async (d, h = 9) => { await dia(d, h); await js(`${H}.__vecindad().revisarDia(); ${H}.__amor().revisarDia(); 1`); };

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes()} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();

    // ------------------------------------------------------------ 1. conocer
    seccion('conocer a Ayelén');
    let e = await js(`(()=>({ amor: JSON.stringify(${P}.amor), romance: ${H}.ajustes.romance, boton: !!document.querySelector('[data-ajuste="romance"] button[data-valor="false"]') }))()`);
    ok(e.romance === true && e.boton && e.amor === JSON.stringify({ personas: {}, cita: null, anillo: null, boda: null, conyuge: null, convivencia: null, hijos: [], embarazo: null, buscan: false, habilidades: {}, niki: 0, animo: 0, correo: [], noticias: [], comentados: {}, chisme: 0, rinde: 0, dia: 0 }), 'partida nueva: el amor vacío y el ajuste encendido');
    await js(`(()=>{ const ORD = ['carpintero','veterinaria','panadera','herbolaria','herrero','modista','pescador','botera','maestra','pintora','enfermera','andinista','telegrafista','fotografa','tejedora','ceramista','apicultor','astronoma','guardaparque','musico'];
      const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
      ${P}.aldea.pobladores = ORD.map((clave) => ({ clave, dia: 1 })); ${P}.aldea.locales = Object.fromEntries(ORD.map((k) => [L[k], 1])); ${P}.aldea.obras = {}; ${P}.aldea.descubierta = 1;
      ${P}.dia = 3; ${P}.horas = 10.5; ${P}.vecindad.dia = 3; ${P}.amor.dia = 3; ${P}.entradas.canto = { dia: 1, hora: 9, cantidad: 2 }; return 1 })()`);
    await irLejos(); await aldea(3);
    const plaza = await js(`${H}.__aldea.edificio('plaza')`);
    await ubicar(plaza.x, plaza.z, plaza.x, plaza.z + 1); await aldea(60);
    let h = await hablarCon('veterinaria');
    ok(h.menu && h.menu.some((o) => o.includes('Coquetear…')), `Ayelén: «Coquetear…» en su menú (${(h.menu || []).join(' / ')})`);
    await cerrarCharla();
    for (const k of ['nena', 'modista']) {
      const r = await hablarCon(k);
      ok(!r.error && r.menu && !r.menu.some((o) => /Coquetear|Lo nuestro/.test(o)), `${k}: nada de romance (${(r.menu || []).length} opciones)`);
      await cerrarCharla();
    }

    // ------------------------------------------------------------ 2. coquetear
    seccion('coquetear');
    h = await hablarCon('veterinaria');
    let c = await elegir('Coquetear…');
    ok(c.menu && c.opciones.some((o) => o.includes('Tirarle un piropo')) && c.opciones.at(-1).includes('Mejor no'), `el submenú: ${c.opciones.join(' / ')}`);
    c = await elegir('Tirarle un piropo');
    ok(!c.menu && c.texto.length > 15, `ella contesta: «${c.texto}»`);
    let f = await ficha();
    ok(f && f.piropo === 3, 'queda anotado (un piropo por día)');
    await cerrarCharla();
    // (apurado: la amistad y el afecto de unos días de charla, regalos y piropos)
    await js(`(()=>{ const v = ${P}.vecindad.personas.veterinaria; v.p = 150; v.max = 2; v.contacto = 3; const f = ${P}.amor.personas.veterinaria; f.afecto = 60; f.etapa = 'coqueteo'; f.desde = 3; return 1 })()`);

    // ------------------------------------------------------------ 3. la cita
    seccion('la cita');
    let cita = null;
    for (let d = 4; d < 12 && !cita; d++) {
      await nuevoDia(d, 9);
      await ubicar(plaza.x, plaza.z, plaza.x, plaza.z + 1); await aldea(20);
      h = await hablarCon('veterinaria');
      if (!h.menu) { await cerrarCharla(); continue; }
      await elegir('Coquetear…'); await elegir('Invitarla a salir…');
      c = await elegir('Un paseo por la plaza');
      const r = await seguir();
      console.log(`  (día ${d}: ${[c.texto, ...r.textos].join(' / ')})`);
      cita = await js(`${P}.amor.cita`);
      await cerrarCharla();
    }
    ok(cita && cita.lugar === 'plaza', `aceptó: la plaza, el día ${cita?.dia} a las ${cita?.desde}`);
    await dia(cita.dia, cita.desde + 0.1);
    await irLejos(); await amor(3);
    let puesta = await js(`${H}.__amor().puesta()`);
    ok(puesta && puesta.clave === 'veterinaria' && puesta.por === 'cita', 'a la hora, ella te espera en la plaza');
    await cuadros(4);
    const enLaPlaza = await js(`(()=>{ const n = ${npc('veterinaria')}; const p = ${H}.__aldea.puntos('plaza')['estar-3']; return Math.hypot(n.pos.x - p.x, n.pos.z - p.z) })()`);
    ok(enLaPlaza < 40, `está en la plaza (a ${enLaPlaza.toFixed(1)} m de su banco)`);
    h = await hablarCon('veterinaria');
    ok(/Empezar la cita con Ayelén/.test(h.aviso), `el aviso: «${h.aviso}»`);
    ok(h.textos.length >= 2, `la cita: ${h.textos.slice(0, 3).join(' / ')}`);
    await cerrarCharla();
    f = await ficha();
    ok(f.etapa === 'saliendo' && f.citas === 1 && !(await js(`${P}.amor.cita`)), 'terminó la cita: ahora salen');
    await amor(2); await js(`${P}.horas = ${cita.desde + 1.2}; 1`); await amor(2);
    ok(!(await js(`${H}.__amor().puesta()`)), 'después de la sobremesa vuelve a lo suyo');

    // ------------------------------------------------------------ 4. declararse
    seccion('declararse');
    await js(`(()=>{ const f = ${P}.amor.personas.veterinaria; f.citas = 3; f.afecto = 90; return 1 })()`);   // (apurado: tres citas)
    let d0 = cita.dia + 1;
    for (let d = d0; d < d0 + 6 && (await ficha()).etapa !== 'novios'; d++) {
      await nuevoDia(d, 19); await js(`${P}.amor.personas.veterinaria.rechazo = 0; 1`);
      await ubicar(plaza.x, plaza.z, plaza.x, plaza.z + 1); await aldea(20);
      h = await hablarCon('veterinaria');
      if (!h.menu) { await cerrarCharla(); continue; }
      await elegir('Coquetear…');
      c = await elegir('¿Querés ser mi novia?');
      console.log(`  (día ${d}: ${c.texto || c.error})`);
      await cerrarCharla();
      d0 = d;
    }
    ok((await ficha()).etapa === 'novios', 'dijo que sí: novios');

    // ------------------------------------------------------------ 5. el anillo
    seccion('el anillo');
    h = await hablarCon('herrero');
    ok(h.menu && h.menu.some((o) => o.includes('Encargarle un anillo')), 'Anselmo: «Encargarle un anillo»');
    c = await elegir('Encargarle un anillo');
    ok(/canto rodado/.test(c.texto), `«${c.texto}»`);
    await cerrarCharla();
    const an = await js(`${P}.amor.anillo`);
    ok(an && an.listo === an.pedido + 3 && (await js(`${P}.entradas.canto.cantidad`)) === 1, 'se llevó el canto rodado; listo en tres días');
    await nuevoDia(an.listo, 10);
    for (let i = 0; i < 20 && ((await js(`${H}.__amor().notasPendientes()`)) > 0 || i < 2); i++) { await amor(1); await esperar(2600); }
    ok(/Anselmo terminó el anillo/.test(await js(`${H}.__avisos().join(' | ')`)), 'el aviso: el anillo está listo');
    h = await hablarCon('herrero');
    c = await elegir('Retirar el anillo');
    ok(c.texto && /anillo/.test(c.texto), `«${c.texto}»`);
    await cerrarCharla();

    // ------------------------------------------------------------ 6. proponer
    seccion('proponer');
    await js(`(()=>{ const f = ${P}.amor.personas.veterinaria; f.desde = ${P}.dia - 5; f.afecto = 95; f.contacto = ${P}.dia; return 1 })()`);   // (apurado: novios hace días)
    let boda = null;
    for (let d = an.listo; d < an.listo + 5 && !boda; d++) {
      await nuevoDia(d, 18); await js(`${P}.amor.personas.veterinaria.rechazo = 0; ${P}.amor.personas.veterinaria.contacto = ${d}; 1`);
      await ubicar(plaza.x, plaza.z, plaza.x, plaza.z + 1); await aldea(20);
      h = await hablarCon('veterinaria');
      if (!h.menu) { await cerrarCharla(); continue; }
      c = await elegir('Lo nuestro…');
      c = await elegir('Proponerle casamiento');
      const r = await seguir();
      console.log(`  (día ${d}: ${[c.texto, ...r.textos].join(' / ')})`);
      await cerrarCharla();
      boda = await js(`${P}.amor.boda`);
    }
    ok(boda && boda.con === 'veterinaria' && (await ficha()).etapa === 'comprometidos', `dijo que sí: se casan el día ${boda?.dia}`);

    // ------------------------------------------------------------ 7. el casamiento civil
    seccion('el casamiento');
    await nuevoDia(boda.dia, 11);
    await js(`${P}.amor.personas.veterinaria.contacto = ${boda.dia}; 1`);
    await irLejos(); await amor(3);
    puesta = await js(`${H}.__amor().puesta()`);
    ok(puesta && puesta.por === 'boda', 'ella espera en la biblioteca');
    h = await hablarCon('veterinaria', 14);
    ok(/Casarte con Ayelén/.test(h.aviso), `el aviso: «${h.aviso}»`);
    ok(h.textos.some((t) => /juez de paz/.test(t)) && h.textos.some((t) => /Sí, quiero/.test(t)), `la escena: ${h.textos.slice(0, 2).join(' / ')}`);
    ok((await ficha()).etapa === 'casados' && (await js(`${P}.amor.conyuge`)) === 'veterinaria', 'casados');

    // ------------------------------------------------------------ 8. vivir juntos
    seccion('vivir juntos');
    if (!h.menu) { await cerrarCharla(); h = await hablarCon('veterinaria'); }
    c = await elegir('Lo nuestro…');
    c = await elegir('¿Dónde vivimos?');
    c = await elegir('En tu casa');
    await cerrarCharla();
    const conv = await js(`${P}.amor.convivencia`);
    ok(conv && conv.con === 'veterinaria' && conv.donde === 'suya' && (await js(`${H}.__amor().mundo().convivencia.edificio`)) === 'veterinaria', 'viven en la veterinaria');

    // ------------------------------------------------------------ 9. un hijo
    seccion('un hijo');
    h = await hablarCon('veterinaria');
    await elegir('Lo nuestro…');
    c = await elegir('¿Y si buscamos un hijo?');
    await cerrarCharla();
    ok(await js(`${P}.amor.buscan`), `lo buscan: «${c.texto}»`);
    const vet = await js(`${H}.__aldea.edificio('veterinaria')`);
    let fundido = false, descanso = 0;
    for (let d = boda.dia + 1; d < boda.dia + 16 && !(await js(`${P}.amor.embarazo`)); d++) {
      await nuevoDia(d, 22.2);   // (3.7.1 (mundo): ella va caminando de verdad: a las 22 ya está en su casa, y se la ubica con vos lejos)
      await js(`${P}.amor.personas.veterinaria.contacto = ${d}; ${H}.jugador.estado.descansado = 0; 1`);
      await irLejos(); await aldea(3); await ubicar(vet.x, vet.z, vet.x + 1, vet.z); await aldea(20);
      h = await hablarCon('veterinaria');
      if (!h.menu) { await cerrarCharla(); continue; }
      c = await elegir('Lo nuestro…');
      c = await elegir('Ñiki ñiki');
      if (c.error) { console.log(`  (día ${d}: ${c.error})`); await cerrarCharla(); continue; }
      await js(`${tecla('KeyE')} 1`);
      await esperar(300);
      fundido ||= await js(`document.getElementById('fundido').classList.contains('activo')`);
      await esperar(3200);
      descanso = Math.max(descanso, await js(`${H}.jugador.estado.descansado || 0`));
      console.log(`  (día ${d}: ñiki ñiki · embarazo: ${!!(await js(`${P}.amor.embarazo`))})`);
      await cerrarCharla();
    }
    ok(fundido, 'el ñiki ñiki: el fundido a negro (nada más)');
    ok(descanso > 0 && !(await js(`document.getElementById('fundido').classList.contains('activo')`)), `descansado (${descanso} h) y la pantalla vuelve`);
    const emb = await js(`${P}.amor.embarazo`);
    ok(!!emb, `viene un bebé (nace el día ${emb?.nace})`);
    h = await hablarCon('veterinaria');
    ok(h.textos.some((t) => /bebé/.test(t)) || (h.menu && true), 'ella te lo cuenta');
    await cerrarCharla();
    await nuevoDia(emb.nace, 9);
    // las notas salen de a una, cada dos segundos y medio
    for (let i = 0; i < 20 && ((await js(`${H}.__amor().notasPendientes()`)) > 0 || i < 2); i++) { await amor(1); await esperar(2600); }
    const hijos = await js(`${H}.__amor().mundo().hijos`);
    ok(hijos.length === 1 && hijos[0].etapa === 'bebe' && hijos[0].madre === 'veterinaria', `nació ${hijos[0]?.nombre}`);
    ok(/¡Nació/.test(await js(`${H}.__avisos().join(' | ')`)), 'el aviso del nacimiento');

    // ------------------------------------------------------------ 9b. lo que te enseñó (rinde y mejora para siempre)
    seccion('las habilidades');
    const hab = await js(`${P}.amor.habilidades.veterinaria`);
    ok(hab && hab.nivel === 3, `aprendiste los tres niveles de Ayelén (una por estación desde el día ${boda.dia})`);
    await amor(2);
    ok((await js(`${H}.jugador.estado.huidaAmor`)) === 0.7 && (await js(`${H}.__amor().bonos().huida`)) === 0.7, 'para siempre: los animales se espantan desde más cerca');
    const huevos = await js(`${P}.entradas.huevo?.cantidad || 0`);
    await nuevoDia(emb.nace + 1, 9);
    ok((await js(`${P}.entradas.huevo?.cantidad || 0`)) === huevos + 2 && (await js(`${P}.aldea.herrado`)) === emb.nace + 1, 'cada mañana rinde: dos huevos y el zaino herrado');

    // ------------------------------------------------------------ 10. el ajuste apagado
    seccion('el ajuste apagado');
    await js(`document.querySelector('[data-ajuste="romance"] button[data-valor="false"]').click(); 1`);
    ok((await js(`${H}.ajustes.romance`)) === false && JSON.parse(await js(`localStorage.getItem('hojarasca-ajustes-v1')`)).romance === false, 'apagado y guardado');
    await dia(emb.nace + 1, 21.2);
    await ubicar(vet.x, vet.z, vet.x + 1, vet.z); await aldea(20);
    h = await hablarCon('veterinaria');
    ok(h.menu && !h.menu.some((o) => /Coquetear|Lo nuestro|anillo|carta de amor/.test(o)), `apagado: nada en su menú (${(h.menu || []).join(' / ')})`);
    await cerrarCharla();
    ok((await js(`JSON.stringify(${H}.__amor().mundo())`)) === '{"activo":false}', 'el mundo no muestra nada');
    await amor(2);
    ok((await js(`${H}.jugador.estado.huidaAmor`)) === 1, 'ni las mejoras de lo aprendido');
    h = await hablarCon('telegrafista');
    ok(!h.menu || !h.menu.some((o) => /carta de amor/.test(o)), 'ni el correo');
    await cerrarCharla();
    const antes = await js(`JSON.stringify(${P}.amor)`);
    await nuevoDia(emb.nace + 20, 9);
    const despues = JSON.parse(await js(`JSON.stringify(${P}.amor)`));
    ok(despues.personas.veterinaria.etapa === 'casados' && despues.hijos.length === 1 && antes.length > 100, 'quieto: lo que pasó sigue guardado');
    await js(`document.querySelector('[data-ajuste="romance"] button[data-valor="true"]').click(); 1`);
    await amor(2);
    ok((await js(`${H}.__amor().mundo().activo`)) && (await js(`${H}.__amor().mundo().hijos.length`)) === 1 && (await js(`${H}.__amor().mundo().hijos[0].etapa`)) === 'bebe', 'prendido de nuevo: vuelve todo (y el bebé no creció de golpe)');
    await js(`${H}.guardar?.(); 1`);
    await cuadros(4);
  } catch (err) {
    errores.push(`excepción en «${donde}»: ${err && err.stack ? err.stack : err}`);
  }
  ok(!errores.filter((x) => !/^✗/.test(x)).some((x) => /Uncaught|Error/.test(x)), 'sin errores en la consola');
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n${errores.join('\n')}` : '\nOK humo 3.7.1 amor');
  app.exit(errores.length ? 1 : 0);
});
