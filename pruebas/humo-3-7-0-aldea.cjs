// Partida real 3.7.0 «La aldea crece» (Electron + WebGL):
//   1. una partida Relax con la aldea completa (los veinte): las nueve nuevas en la calle de la Loma,
//      cada una en su local a media mañana, Martina en el muelle del lago (se la ve allá) y Valentina
//      durmiendo hasta la siesta y trabajando de noche;
//   2. hablarle a una nueva: su servicio del día (Martina calafatea el kayak) y la escena de llegada
//      con su objeto;
//   3. el cumpleaños: el aviso del día antes y la fiesta; el calendario en el cuaderno;
//   4. un visitante baja del tren, te pide que lo lleves a un lugar del valle, te sigue y queda anotado;
//   5. tu familia en el refugio, que opina de todo;
//   6. la Chola tiene cachorros, Ernesto te ofrece uno y vive en tu refugio;
//   7. los animales de la aldea (perros, caballos, gallinas) y los dibujos por cuadro en la plaza;
//   8. Josefina en el valle y el ajuste «ritmo de la aldea».
// Uso: electron pruebas/humo-3-7-0-aldea.cjs con HUMO_PERFIL=<carpeta propia> (borra el localStorage
// del perfil: usar uno aparte).
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
  const aldea = (n = 1, dt = 0.6) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__aldea.actualizar(${dt}); return 1 })()`);
  const estado = () => js(`${H}.__aldea.mundo().estado()`);
  const ubicar = (x, z, mx = null, mz = null) => js(`(()=>{ const j = ${H}.jugador; const x = ${x}, z = ${z}; const mx = ${mx === null ? 'x' : mx}, mz = ${mz === null ? 'z + 1' : mz};
    j.ubicar(x, z, Math.atan2(-(mx - x), -(mz - z))); j.estado.pitch = -0.05; return 1 })()`);
  const irLejos = () => js(`(()=>{ const r = ${H}.T.lugares.refugio; ${H}.jugador.ubicar(r.x, r.z, 0); return 1 })()`);
  const plaza = async () => { const p = await js(`${H}.__aldea.edificio('plaza')`); await ubicar(p.x, p.z); };
  const avisos = (n = 8) => js(`${H}.__avisos().slice(-${n}).join(' | ')`);
  // habla con una figura (por su clave de la aldea): enfrente, E hasta que se cierra la charla (o `maximo`)
  const hablarCon = async (expr, maximo = 10) => {
    const p = await js(`(()=>{ const n = ${expr}; return n ? { x: n.pos.x, z: n.pos.z } : null })()`);
    if (!p) return { error: 'no está' };
    await js(`(()=>{ const j = ${H}.jugador, T = ${H}.T; const x = ${p.x}, z = ${p.z};
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, px = x + Math.cos(a) * 1.6, pz = z + Math.sin(a) * 1.6; if (!T.agua(px, pz)) { j.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz))); break; } }
      j.estado.pitch = -0.05; return 1 })()`);
    await cuadros(6);
    for (let i = 0; i < 3; i++) { await esperar(70); await cuadros(2); }
    const textos = [];
    for (let i = 0; i < maximo; i++) {
      await js(`${tecla('KeyE')} 1`);
      const c = await js(`(()=>({ npc: !!${H}.__charla().npc, texto: document.getElementById('charla-texto').textContent, seguir: document.getElementById('charla-seguir').textContent, menu: !document.getElementById('charla-opciones')?.classList.contains('oculto') }))()`);
      if (!c.npc) break;
      textos.push(`${c.texto} [${c.seguir}]`);
      if (c.menu) break;
    }
    return { textos };
  };
  const cerrarCharla = () => js(`(()=>{ for (let i = 0; i < 6 && ${H}.__charla().npc; i++) document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })); return !${H}.__charla().npc })()`);
  const npc = (clave) => `${H}.__aldea.mundo().personas.get('${clave}')?.npc`;

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes()} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();

    // ------------------------------------------------------------ 1. los veinte
    seccion('la aldea completa: las nueve de la calle de la Loma');
    let e = await js(`(()=>{ const P = ${H}.progreso; return { vida: !!P.vidaAldea, chicos: !!P.aldea.chicos, ritmo: ${H}.ajustes.ritmoAldea } })()`);
    ok(e.vida && e.chicos && e.ritmo === 'normal', 'la partida nueva trae la vida de la aldea, los chicos y el ritmo normal');
    await js(`(()=>{ const P = ${H}.progreso; const ORD = ['carpintero','veterinaria','panadera','herbolaria','herrero','modista','pescador','botera','maestra','pintora','enfermera','andinista','telegrafista','fotografa','tejedora','ceramista','apicultor','astronoma','guardaparque','musico'];
      const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
      P.aldea.pobladores = ORD.map((clave) => ({ clave, dia: 1 })); P.aldea.locales = Object.fromEntries(ORD.map((k) => [L[k], 1])); P.aldea.obras = {}; P.aldea.descubierta = 1;
      P.dia = 2; P.horas = 10.5; return 1 })()`);
    await irLejos(); await aldea(3);
    await plaza(); await aldea(60);
    e = await estado();
    const nuevas = { veterinaria: 'veterinaria', fotografa: 'estudio-fotos', andinista: 'refugio-andinista', herbolaria: 'herboristeria', pintora: 'taller-arte', ceramista: 'ceramica', modista: 'costureria' };
    for (const [k, lote] of Object.entries(nuevas)) {
      const n = e.npcs.find((x) => x.clave === k);
      ok(n && (n.libre || n.destino?.edificio === lote), `${k}: a las 10:30 en ${n?.destino?.edificio}/${n?.destino?.punto}${n?.libre ? ` (libre: ${n.actividad})` : ''}`);
    }
    const valentina = e.npcs.find((x) => x.clave === 'astronoma');
    ok(valentina && valentina.destino?.punto === 'cama', `Valentina duerme hasta la siesta (${valentina?.destino?.edificio}/${valentina?.destino?.punto})`);
    const martina = e.npcs.find((x) => x.clave === 'botera');
    ok(martina && martina.destino?.punto === 'trabajo-muelle', `Martina trabaja en el muelle del lago (${martina?.destino?.punto})`);
    // Martina: con vos lejos de la aldea, ya está en el muelle; se la ve si estás cerca de ella
    await irLejos(); await aldea(3);
    const muelle = await js(`${H}.__aldea.puntos('varadero')['trabajo-muelle']`);
    await ubicar(muelle.x + 6, muelle.z + 2, muelle.x, muelle.z);
    await aldea(4); await cuadros(4);
    e = await js(`(()=>{ const n = ${npc('botera')}; return n ? { x: n.pos.x, z: n.pos.z, dormido: !!n.dormido, visible: !!n.g?.visible } : null })()`);
    ok(e && Math.hypot(e.x - muelle.x, e.z - muelle.z) < 1.5 && !e.dormido, `en el muelle, a la vista (${e ? Math.hypot(e.x - muelle.x, e.z - muelle.z).toFixed(1) : '-'} m)`);

    // ------------------------------------------------------------ 2. el servicio de Martina
    seccion('Martina calafatea el kayak');
    await js(`(()=>{ ${H}.progreso.materiales.tabla = 3; return 1 })()`);
    let h = await hablarCon(npc('botera'), 6);
    ok(h.textos?.length >= 1, `le hablás (${(h.textos || []).slice(0, 2).join(' / ').slice(0, 160)})`);
    // el menú de la vecindad: su servicio es la primera opción
    await js(`(()=>{ ${H}.__elegirCharla(0); return 1 })()`);
    for (let i = 0; i < 4; i++) { await js(`${tecla('KeyE')} 1`); }
    await cerrarCharla();
    e = await js(`(()=>({ cal: ${H}.progreso.aldea.calafateado, dia: ${H}.progreso.dia, tabla: ${H}.progreso.materiales.tabla }))()`);
    ok(e.cal === e.dia && e.tabla === 2, `el kayak calafateado hoy (por una tabla): ${JSON.stringify(e)}`);
    // la llegada con el objeto
    e = await js(`(()=>{ const P = ${H}.progreso, a = P.aldea; a.pobladores = a.pobladores.filter((p) => p.clave !== 'astronoma'); delete a.locales.observatorio; a.llamado = true;
      ${H}.__aldea.mundo().revisarLlegada(true); return a.llegando })()`);
    ok(e?.clave === 'astronoma', 'baja Valentina del tren');
    e = await avisos(4);
    ok(/telescopio en un cajón/.test(e), `con su telescopio (${e.slice(-160)})`);
    await js(`(()=>{ const P = ${H}.progreso; P.aldea.llegando = null; P.aldea.pobladores.push({ clave: 'astronoma', dia: 1 }); P.aldea.locales.observatorio = 1; return 1 })()`);

    // ------------------------------------------------------------ 3. el cumpleaños y el calendario
    seccion('el cumpleaños y el calendario');
    // el día 9 (Rosa, Cholo y Martina): el aviso, el día 8
    await js(`(()=>{ ${H}.progreso.dia = 8; ${H}.progreso.horas = 9; ${H}.__aldea.mundo().revisarDia(); return 1 })()`);
    e = await avisos(8);
    ok(/Mañana cumplen años Rosa, Martina y Cholo/.test(e), `el aviso del día antes (${(e.match(/Mañana[^|]*/) || [''])[0]})`);
    await js(`(()=>{ ${H}.progreso.dia = 9; ${H}.progreso.horas = 18.6; return 1 })()`);
    await irLejos(); await aldea(3); await plaza(); await aldea(30);
    e = await estado();
    const festejan = e.npcs.filter((n) => n.destino?.lugar === 'fiesta').map((n) => n.clave);
    ok(festejan.includes('panadera') && festejan.includes('musico'), `la fiesta en la plaza (${festejan.join(', ')})`);
    await js(`${H}.__aldea.cuaderno('oficios'); 1`);
    e = await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista [data-oficio="calendario"]')][0]; if (!b) return null; b.click(); return document.getElementById('cuaderno-ficha').textContent })()`);
    ok(e && /Calendario y vida de la aldea/.test(e) && /Hoy: /.test(e) && /Cumpleaños de todos/.test(e), `el calendario en el cuaderno (${(e || '').slice(0, 120)})`);
    await js(`${H}.volverAlJuego?.(); 1`);

    // ------------------------------------------------------------ 4. un visitante
    seccion('un visitante baja del tren');
    await js(`(()=>{ const P = ${H}.progreso; P.dia = 10; P.horas = 10; P.vidaAldea.visitante = { id: 'lena', lugar: 'mirador', dia: 10, estado: 'anden' }; return 1 })()`);
    await plaza(); await aldea(4);
    e = await js(`(()=>{ const f = ${H}.gente.gente.find((g) => g.claveAldea === 'visitante'); return f ? { x: f.pos.x, z: f.pos.z, nombre: f.nombre } : null })()`);
    ok(e && e.nombre === 'Lena', 'Lena espera en el andén');
    h = await hablarCon(`${H}.gente.gente.find((g) => g.claveAldea === 'visitante')`, 4);
    ok(h.textos?.some((t) => /Mirador del Pehuén/.test(t)), `te pregunta por el mirador (${(h.textos || []).join(' / ').slice(0, 200)})`);
    await cerrarCharla();
    e = await js(`${H}.progreso.vidaAldea.visitante?.estado`);
    ok(e === 'guiando', `te sigue (${e})`);
    const mir = await js(`${H}.T.lugares.mirador`);
    await ubicar(mir.x + 4, mir.z + 4, mir.x, mir.z);
    await aldea(3);
    e = await js(`(()=>({ guiados: ${H}.progreso.vidaAldea.guiados.length, avisos: ${H}.__avisos().slice(-3).join(' | ') }))()`);
    ok(e.guiados === 1 && /Llevaste a Lena hasta el Mirador del Pehuén/.test(e.avisos), `llegaron al mirador: anotado (${e.avisos.slice(-120)})`);

    // ------------------------------------------------------------ 5. tu familia
    seccion('tu familia en el refugio');
    await js(`(()=>{ const P = ${H}.progreso; P.horas = 12; P.vidaAldea.familia.proxima = P.dia; P.vidaAldea.familia.quien = 'mama'; return 1 })()`);
    await irLejos(); await aldea(3); await cuadros(4);
    e = await js(`(()=>{ const f = ${H}.gente.gente.find((g) => g.claveAldea === 'familia'); return f ? { nombre: f.nombre, dormido: !!f.dormido } : null })()`);
    ok(e && e.nombre === 'Susana' && !e.dormido, 'tu mamá vino al refugio');
    h = await hablarCon(`${H}.gente.gente.find((g) => g.claveAldea === 'familia')`, 8);
    ok((h.textos || []).length >= 4, `y opina de todo (${(h.textos || []).slice(1, 3).join(' / ').slice(0, 200)})`);
    await cerrarCharla();
    await js(`(()=>{ ${H}.progreso.horas = 19.5; return 1 })()`); await aldea(3);
    e = await js(`${H}.progreso.vidaAldea.familia`);
    ok(e.ultima === e.proxima - 20 && e.quien === 'hermano', `a la tardecita se vuelve; la próxima, tu hermano el día ${e.proxima}`);

    // ------------------------------------------------------------ 6. el cachorro
    seccion('el cachorro de la Chola');
    await js(`(()=>{ const P = ${H}.progreso; P.dia = 11; P.horas = 10; P.vidaAldea.mascota = { estado: 'cachorros', desde: 0, nombre: null, ofrecido: 0, nacieron: 11 }; return 1 })()`);
    await plaza(); await aldea(30);
    h = await hablarCon(npc('jefe'), 4);
    ok(h.textos?.some((t) => /Chola tuvo cuatro cachorros/.test(t)), `Ernesto te ofrece uno (${(h.textos || []).join(' / ').slice(0, 160)})`);
    await cerrarCharla();
    e = await js(`${H}.progreso.vidaAldea.mascota`);
    ok(e.estado === 'adoptado' && e.nombre, `lo adoptaste: ${e.nombre}`);
    await irLejos(); for (let i = 0; i < 6; i++) await cuadros(4);
    e = await js(`${H}.__aldea.animales().estado().cachorro`);
    ok(e && e.visible && e.talla > 0.4 && e.talla < 0.6, `vive en tu refugio, chiquito (${JSON.stringify(e)})`);

    // ------------------------------------------------------------ 7. los animales y los dibujos
    seccion('los animales de la aldea');
    await js(`(()=>{ ${H}.progreso.horas = 11; return 1 })()`);
    await plaza(); await aldea(10);
    for (let i = 0; i < 10; i++) { await cuadros(3); await esperar(60); }
    e = await js(`${H}.__aldea.animales().estado()`);
    ok(e.armada && e.perros.filter((p) => p.visible).length >= 2, `perros con nombre (${e.perros.filter((p) => p.visible).map((p) => p.id).join(', ')})`);
    ok(e.caballos.every((c) => c.visible) && e.gallinas > 0, `dos caballos atados y ${e.gallinas} gallinas`);
    // un perro te sigue
    const chola = e.perros.find((p) => p.id === 'chola');
    await ubicar(chola.x + 1.5, chola.z);
    for (let i = 0; i < 20; i++) { await cuadros(3); await esperar(40); }
    e = await js(`${H}.__aldea.animales().estado().perros.find((p) => p.id === 'chola')`);
    ok(e.estado === 'sigue', `la Chola te sigue un rato (${e.estado})`);
    await plaza(); for (let i = 0; i < 6; i++) await cuadros(4);
    e = await js(`(()=>{ const R = ${H}.renderer; if (!R) return null; R.info.autoReset = false; R.info.reset(); R.render(${H}.escena, ${H}.camara); const d = R.info.render.calls; R.info.autoReset = true; return d })()`);
    ok(e !== null, 'se miden los dibujos');
    if (e !== null) { console.log(`  dibujos por cuadro en la plaza: ${e}`); ok(e < 520, `menos de 520 dibujos por cuadro en la plaza (${e})`); }

    // ------------------------------------------------------------ 8. Josefina y el ritmo
    seccion('Josefina y el ritmo de la aldea');
    e = await js(`(()=>{ const g = ${H}.gente.gente.find((x) => x.clave === 'ema'); return g ? g.nombre : null })()`);
    ok(e === 'Josefina', `la guardaparque del valle se llama Josefina (${e})`);
    e = await js(`[...document.querySelectorAll('[data-ajuste="ritmoAldea"] button')].map((b) => b.dataset.valor).join(',')`);
    ok(e === 'tranquilo,normal,animado', 'el ajuste «ritmo de la aldea»');
    await js(`document.querySelector('[data-ajuste="ritmoAldea"] button[data-valor="animado"]').click(); 1`);
    e = await js(`(()=>({ a: ${H}.ajustes.ritmoAldea, g: JSON.parse(localStorage.getItem('hojarasca-ajustes-v1')).ritmoAldea }))()`);
    ok(e.a === 'animado' && e.g === 'animado', 'se elige y se guarda');
    // guardar y volver a cargar: todo vuelve igual
    await js(`${H}.guardar?.(); 1`);
    const antes = await js(`JSON.stringify(${H}.progreso.vidaAldea)`);
    await abrir(); ok(await listo(), 'vuelve a cargar'); await entrar();
    const despues = await js(`JSON.stringify(${H}.progreso.vidaAldea)`);
    ok(antes === despues, 'la vida de la aldea vuelve igual al recargar');
  } catch (err) {
    errores.push(`excepción: ${err && err.message ? err.message : err}`);
  }
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n${errores.join('\n')}`); app.exit(1); return; }
  console.log('OK humo 3.7.0 aldea');
  app.exit(0);
});
