// Partida real 3.7.1 «Amor en la aldea», el mundo (Electron + WebGL): lo que se ve del amor (amor-mundo.js, amor-escenas.js
// y lo que se engancha en aldea-gente.js y gente.js). Los números se apuran a mano (como en humo-3-7-1-amor.cjs: el estado
// del amor se pone directo, sin jugar días enteros) y la gente se mueve con pasos de gente.js (la ventana oculta corre a un
// cuadro por segundo):
//   1. la cita en el valle (Sofía, en el mirador): sale con tiempo, llega caminando por el camino, espera, y la cita tiene
//      su momento; al terminar vuelven juntos (cerca);
//   2. la cita en la aldea (Marta, en la casa de té): va caminando por las calles y se sienta a la mesa;
//   3. la cita en el muelle (Martina): sentada en las tablas;
//   4. de la mano en la aldea (Inés, novia): camina a tu lado, con el gesto;
//   5. el casamiento civil en la biblioteca: el juez de paz detrás del mostrador, los testigos, los invitados sentados, tu
//      familia; la fiesta (en el salón y, cerrado el salón, en la plaza con la mesa larga), la música y el brindis;
//   6. la mudanza al refugio: sus cosas (y las cajas), ella a la mesa a la noche y después en la cama;
//   7. los hijos: el cuarto que se suma al refugio, el bebé en la cuna y el chico dormido en su cama;
//   8. el anillo en el yunque de Anselmo;
//   9. la mañana después del ñiki ñiki: el desayuno en la mesa;
//  10. con el ajuste «Romance» apagado no se ve nada (y vuelve al prenderlo); sin errores en la consola.
// Uso: npx electron --no-sandbox -r <ruta absoluta>\herramientas\al-monitor.cjs <ruta absoluta>\pruebas\humo-3-7-1-amor-mundo.cjs
// Perfil propio (HUMO_PERFIL, o una carpeta temporal). CAPTURAS=<carpeta>: guarda las capturas (v371-amor-*.png).
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const fs = require('fs');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-3-7-1-amor-mundo')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const CAPTURAS = process.env.CAPTURAS ? path.resolve(process.env.CAPTURAS) : null;
const SOLO = process.env.SOLO ? new Set(process.env.SOLO.split(',')) : null;
setTimeout(() => { console.log('ERROR: la prueba tardó más de 25 minutos'); app.exit(2); }, 25 * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, webPreferences: { backgroundThrottling: false } });
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
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea && window.__hojarasca.__amorMundo && window.__hojarasca.__amorMundo())').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const P = `${H}.progreso`;
  const AM = `${H}.__amorMundo()`;
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'media', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano' }, ${JSON.stringify(extra || {})})));`;
  const tecla = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const aldea = (n = 1, dt = 0.6) => js(`(()=>{ for (let i = 0; i < ${n}; i++) { ${H}.__aldea.actualizar(${dt}); ${H}.__aldea.mundo()?.prearmar?.(1e6); } return 1 })()`);
  // (que no corra el día del amor ni el descuido: el estado se pone a mano)
  const alDia = () => js(`(()=>{ const p = ${P}; p.amor.dia = p.dia; p.vecindad.dia = p.dia; for (const f of Object.values(p.amor.personas)) { f.contacto = p.dia; f.enojo = 0; } return 1 })()`);
  const amor = async (n = 2) => { await alDia(); return js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__amor().actualizar(1); return 1 })()`); };
  // la gente camina (gente.js con pasos de 0,1 s) y la aldea y el amor se revisan cada medio segundo
  const pasos = async (seg) => { await alDia(); return js(`(()=>{ const H = ${H}, js = H.jugador.estado; const n = Math.round(${seg} / 0.1);
    for (let i = 0; i < n; i++) { H.gente.actualizar(0.1, js, H.camara, null, 0); H.__amorMundo().actualizar(0.1); if (i % 5 === 4) H.__aldea.actualizar(0.5); } return 1 })()`); };
  const npc = (clave) => `${H}.__aldea.mundo().personas.get('${clave}')?.npc`;
  const posDe = (clave) => js(`(()=>{ const n = ${npc(clave)}; return n ? { x: n.pos.x, y: n.pos.y, z: n.pos.z, camino: n.camino?.length || 0, pose: n.pose || null, dormido: !!n.dormido, lejano: !!n.enLejano, conVos: !!n.conVos, gesto: n.gestoAmor?.tipo || null, mira: n.miraFinal ?? 0, sig: n.camino?.length ? (() => { let d = 0, p = n.pos; for (const q of n.camino) { const l = Math.hypot(q.x - p.x, q.z - p.z); if (d + l > 7) { const t = (7 - d) / l; return { x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t }; } d += l; p = q; } return { x: p.x, z: p.z }; })() : null } : null })()`);
  const ubicar = (x, z, mx, mz, alto = 1.25) => js(`(()=>{ const H = ${H}, j = H.jugador, T = H.T; j.ubicar(${x}, ${z}, Math.atan2(-(${mx} - ${x}), -(${mz} - ${z})));
    const ojo = j.estado.pos.y + 1.6, blanco = T.altura(${mx}, ${mz}) + ${alto}; j.estado.pitch = Math.atan2(blanco - ojo, Math.hypot(${mx} - ${x}, ${mz} - ${z})); if (j.estado.vel) j.estado.vel.set(0, 0, 0); return 1 })()`);
  // mira a un punto desde donde está (la altura del blanco, absoluta)
  const mirarA = (x, y, z) => js(`(()=>{ const j = ${H}.jugador.estado; const dx = ${x} - j.pos.x, dz = ${z} - j.pos.z; j.yaw = Math.atan2(-dx, -dz); j.pitch = Math.atan2(${y} - (j.pos.y + 1.6), Math.hypot(dx, dz)); return 1 })()`);
  const dia = (d, h) => js(`(()=>{ ${P}.dia = ${d}; ${P}.horas = ${h}; return 1 })()`);
  const charla = () => js(`(()=>({ npc: ${H}.__charla().npc, texto: document.getElementById('charla-texto').textContent, opciones: [...document.querySelectorAll('#charla-opciones li')].map((li) => li.textContent), menu: !document.getElementById('charla-opciones')?.classList.contains('oculto') }))()`);
  const cerrarCharla = () => js(`(()=>{ for (let i = 0; i < 8 && ${H}.__charla().npc; i++) document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })); return !${H}.__charla().npc })()`);
  const hablarCon = async (clave, maximo = 12) => {
    const p = await posDe(clave);
    if (!p) return { error: 'no está', textos: [] };
    // (se para alrededor de ella hasta que el aviso es el suyo: en la biblioteca o la casa de té hay otros al lado)
    const nombre = await js(`(${npc(clave)}?.nombre || '').split(' ')[0]`);
    let aviso = '';
    for (let k = 0; k < 16; k++) {
      const puede = await js(`(()=>{ const j = ${H}.jugador, T = ${H}.T; const x = ${p.x}, z = ${p.z};
        const a = ${k} * Math.PI / 8, px = x + Math.cos(a) * 1.2, pz = z + Math.sin(a) * 1.2; if (T.agua(px, pz) || ${H}.col.paredEntre?.(px, pz, x, z, ${p.y} + 1)) return false;
        j.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz))); j.estado.pitch = -0.15; return true })()`);
      if (!puede) continue;
      await cuadros(4);
      aviso = await js(`${H}.__aviso()`);
      if (nombre && aviso.includes(nombre)) break;
    }
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
  const elegir = async (texto) => {
    const c = await charla();
    const i = c.opciones.findIndex((o) => o.includes(texto));
    if (i < 0) return { error: `no está «${texto}» en ${c.opciones.join(' / ')}`, opciones: c.opciones };
    await js(`${H}.__elegirCharla(${i}); 1`);
    return charla();
  };
  const estado = () => js(`${AM}.estado()`);
  // una captura sin carteles (si CAPTURAS): la vegetación de cerca puesta y unos cuadros
  const foto = async (nombre) => {
    await js(`(()=>{ const H = ${H}; document.body.style.visibility = 'hidden'; document.querySelectorAll('canvas').forEach((c) => { c.style.visibility = 'visible'; }); H.veg.actualizar(H.camara.position); return 1 })()`);
    // (unos cuantos cuadros: lo que el LOD apaga lejos, como el refugio o la biblioteca, se vuelve a ver después de
    // moverse de golpe; y los edificios de la aldea que falten, armados)
    for (let i = 0; i < 6; i++) await cuadros(10);
    // (y el LOD de los complejos, al instante: con cuadros seguidos el refugio quedaba apagado después de venir de la aldea,
    // y ella se veía sentada en el pasto)
    await js(`${H}.__visibilidad(); ${H}.__bucle(); 1`);
    await esperar(1800);
    await js(`(()=>{ const H = ${H}; H.veg.actualizar(H.camara.position); H.objetos?.actualizar?.(H.camara.position); return 1 })()`);
    await js(`${H}.__visibilidad(); 1`);
    await cuadros(2);
    await esperar(1500);
    // (lo que tiene que verse, adentro de la cámara: si el complejo del refugio está apagado, la captura no sirve)
    if (!(await js(`(()=>{ const r = ${H}.est?.conjuntos?.find((k) => k.clave === 'refugio'); const c = ${H}.camara.position; return !r || r.obj.visible || Math.hypot(c.x - r.x, c.z - r.z) > 300 })()`))) ok(false, `${nombre}: el refugio está apagado por el LOD`);
    if (CAPTURAS) { const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(CAPTURAS, `v371-amor-${nombre}.png`), img.toPNG()); console.log(`  (captura: v371-amor-${nombre}.png)`); }
    await js(`document.body.style.visibility = ''; 1`);
  };
  const quiere = (s) => !SOLO || SOLO.has(s);
  // los edificios de la aldea, todos armados (como en humo-3-6-mundo.cjs)
  const edificios = async (maximo = 900) => {
    await js(`${H}.__aldeaMundo().listo().then(() => 1)`);
    // (aldea-mundo revisa cada 3 s qué etapa dibujar: el estado se puso a mano)
    for (let i = 0; i < 8; i++) { await cuadros(10); await esperar(50); }
    for (let i = 0; i < maximo; i++) { const c = await js(`(()=>{ ${H}.__bucle(); const m = ${H}.__aldeaMundo().medir(); return m.cola + (m.fabrica?.pendientes || 0) })()`); if (c === 0 && i > 5) return i; if (i % 20 === 19) await esperar(30); }
    return -1;
  };
  const ficha = (etapa, extra = {}) => JSON.stringify({ etapa, afecto: 80, desde: 1, contacto: 3, charla: 0, piropo: 0, flores: 0, carta: 0, leyo: null, citas: 3, ultimaCita: 0, enojo: 0, motivo: null, rechazo: 0, reconquista: 0, chicos: 0, ...extra });

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó (con amor-mundo)');
    await js(`(()=>{ localStorage.clear(); ${ajustes()} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
    await js(`(()=>{ const ORD = ['carpintero','veterinaria','panadera','herbolaria','herrero','modista','pescador','botera','maestra','pintora','enfermera','andinista','telegrafista','fotografa','tejedora','ceramista','apicultor','astronoma','guardaparque','musico'];
      const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
      ${P}.aldea.pobladores = ORD.map((clave) => ({ clave, dia: 1 })); ${P}.aldea.locales = Object.fromEntries(ORD.map((k) => [L[k], 1])); ${P}.aldea.obras = {}; ${P}.aldea.descubierta = 1;
      ${P}.dia = 3; ${P}.horas = 9; ${P}.vecindad.dia = 3; ${P}.amor.dia = 3; return 1 })()`);
    // (se guarda y se vuelve a cargar: así la aldea se arma con todo abierto, como en una partida de verdad)
    await js(`${H}.guardar(); 1`);
    await abrir();
    ok(await listo(), 'la partida guardada carga');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
    ok(await js(`${P}.aldea.pobladores.length === 20 && ${P}.dia === 3`), 'con los veinte pobladores');
    const plaza = await js(`${H}.__aldea.edificio('plaza')`);
    await ubicar(plaza.x, plaza.z + 3, plaza.x, plaza.z);
    await aldea(80);
    await edificios();
    await cuadros(4);
    let e = await estado();
    ok(e.activo === true && !e.cuarto && !e.cosas && !e.figuras.length, 'sin amor todavía: nada que mostrar');

    // ------------------------------------------------------------ 1. la cita en el valle (Sofía, el mirador)
    if (quiere('cita')) {
      seccion('la cita en el mirador');
      await js(`(()=>{ ${P}.amor.personas.fotografa = ${ficha('saliendo')}; ${P}.amor.cita = { clave: 'fotografa', lugar: 'mirador', dia: 3, desde: 11, hasta: 12.5, estado: 'acordada' }; ${P}.horas = 10.2; return 1 })()`);
      // en la aldea, sale con tiempo hacia el andén
      await aldea(2); await pasos(2);
      let s = await posDe('fotografa');
      ok(s && (s.camino > 0 || s.lejano), `sale con tiempo para la cita (camino: ${s?.camino}, afuera: ${s?.lejano})`);
      // vos ya en el mirador: la ves llegar por el camino
      const m = await js(`(()=>{ const l = ${H}.T.lugares.mirador; const am = ${AM}; return { x: l.x, z: l.z, suyo: { x: l.x + 1.2, z: l.z + 1.2 }, tuyo: { x: l.x - 0.4, z: l.z - 0.4 } } })()`);
      await js(`(()=>{ ${H}.jugador.ubicar(${m.tuyo.x}, ${m.tuyo.z}, 0); return 1 })()`);
      await js(`${P}.horas = 10.4; 1`);
      // (la figura sigue armada; al teletransportarte, la aldea queda lejos)
      for (let i = 0; i < 6; i++) await pasos(1);
      await pasos(12);
      s = await posDe('fotografa');
      const lejos0 = s ? Math.hypot(s.x - m.suyo.x, s.z - m.suyo.z) : -1;
      ok(s && s.lejano && s.camino > 0 && lejos0 > 6, `llega caminando por el camino (a ${lejos0.toFixed(1)} m de su lugar)`);
      await pasos(7); s = await posDe('fotografa');
      if (s) { await mirarA(s.x, s.y + 1.0, s.z); await foto('cita-camino-mirador'); }
      await pasos(40);
      s = await posDe('fotografa');
      const lejos1 = s ? Math.hypot(s.x - m.suyo.x, s.z - m.suyo.z) : -1;
      ok(s && lejos1 < 1.2, `llegó a su lugar del mirador (a ${lejos1.toFixed(2)} m)`);
      await js(`${P}.horas = 11; 1`); await amor(2);
      const h = await hablarCon('fotografa');
      ok(/Empezar la cita con Sofía/.test(h.aviso) && h.textos.length >= 2, `la cita empieza: «${h.aviso}»`);
      await cerrarCharla();
      await aldea(1); await pasos(15);
      s = await posDe('fotografa');
      ok(s && (s.pose === 'mirar' || s.pose === 'sentado'), `el momento: en el banco del mirador, o mirando el paisaje (${s?.pose})`);
      // (de frente, un poco al costado)
      if (s) { await js(`(()=>{ const j = ${H}.jugador, m = ${s.mira}; j.ubicar(${s.x} + Math.sin(m) * 2.6 - Math.cos(m) * 1.1, ${s.z} + Math.cos(m) * 2.6 + Math.sin(m) * 1.1, 0); return 1 })()`); await mirarA(s.x, s.y + 0.8, s.z); }
      await foto('cita-mirador');
      // después de la sobremesa, vuelven juntos
      await js(`(()=>{ const j = ${H}.jugador; j.ubicar(${m.suyo.x} - 1.5, ${m.suyo.z}, 0); ${P}.horas = 11.8; return 1 })()`);
      await amor(2); await pasos(1);
      e = await estado();
      ok(e.juntos && e.juntos.clave === 'fotografa' && e.juntos.gesto === 'cerca', `vuelven juntos (${JSON.stringify(e.juntos)})`);
      await js(`(()=>{ const j = ${H}.jugador; j.ubicar(${m.suyo.x} + 60, ${m.suyo.z} + 60, 0); return 1 })()`);
      await pasos(3);
      e = await estado();
      ok(!e.juntos || e.juntos.yendose, 'si te vas lejos, te deja ir');
      await pasos(20);
      await js(`${P}.amor.personas.fotografa.etapa = 'coqueteo'; 1`);
    }

    // ------------------------------------------------------------ 2. la cita en la aldea (Marta, la casa de té)
    if (quiere('casa-te')) {
      seccion('la cita en la casa de té');
      await js(`(()=>{ ${P}.amor.personas.enfermera = ${ficha('saliendo')}; ${P}.amor.cita = { clave: 'enfermera', lugar: 'casa-te', dia: 3, desde: 17, hasta: 18.5, estado: 'acordada' }; ${P}.horas = 16.0; return 1 })()`);
      const ct = await js(`${H}.__aldea.puntos('casa-te')`);
      await ubicar(plaza.x, plaza.z, ct['mesa-4'].x, ct['mesa-4'].z);
      await aldea(4); await pasos(2);
      await js(`${P}.horas = 16.6; 1`);
      await aldea(2); await pasos(4);
      let s = await posDe('enfermera');
      ok(s && s.camino > 0, `va caminando a la casa de té (${s?.camino} tramos)`);
      // (parado más adelante en su camino, mirándola venir)
      if (s?.sig) { await js(`(()=>{ const j = ${H}.jugador; j.ubicar(${s.sig.x}, ${s.sig.z}, 0); return 1 })()`); await pasos(1); s = await posDe('enfermera'); await mirarA(s.x, s.y + 1.0, s.z); await foto('cita-camino-aldea'); }
      for (let i = 0; i < 8; i++) { await pasos(15); s = await posDe('enfermera'); if (s && !s.camino) break; }
      s = await posDe('enfermera');
      const d4 = s ? Math.hypot(s.x - ct['mesa-4'].x, s.z - ct['mesa-4'].z) : -1;
      ok(s && d4 < 1.0, `llegó a la mesa 4 (a ${d4.toFixed(2)} m)`);
      await js(`${P}.horas = 17.1; 1`); await amor(2);
      const h = await hablarCon('enfermera');
      ok((await js(`${P}.amor.personas.enfermera.citas`)) === 4, `la cita empezó y terminó (aviso: «${h.aviso}»)`);
      await cerrarCharla();
      await aldea(2); await pasos(3);
      s = await posDe('enfermera');
      ok(s && s.pose === 'sentado', `el momento: el té, sentados a la mesa (${s?.pose})`);
      await js(`(()=>{ const j = ${H}.jugador; j.ubicar(${ct['mesa-3'].x} + 0.3, ${ct['mesa-3'].z} + 1.3, 0); return 1 })()`);
      await mirarA(ct['mesa-4'].x, (s?.y || 0) + 0.9, ct['mesa-4'].z);
      await foto('cita-casa-te');
      await js(`(()=>{ ${P}.amor.cita = null; ${P}.horas = 23; return 1 })()`); await amor(2); await pasos(2);
    }

    // ------------------------------------------------------------ 3. la cita en el muelle (Martina)
    if (quiere('muelle')) {
      seccion('la cita en el muelle');
      await js(`(()=>{ ${P}.dia = 4; ${P}.horas = 15; ${P}.amor.personas.botera = ${ficha('saliendo')}; ${P}.amor.cita = { clave: 'botera', lugar: 'muelle', dia: 4, desde: 15, hasta: 16.5, estado: 'en-curso' }; return 1 })()`);
      const mu = await js(`(()=>{ const l = ${H}.T.lugares.muelle; return { x: l.x, z: l.z } })()`);
      await js(`(()=>{ ${H}.jugador.ubicar(${mu.x} - 0.4, ${mu.z} - 0.4, 0); return 1 })()`);
      await alDia(); await aldea(2); await pasos(50);
      const s = await posDe('botera');
      if (!(s && s.pose === 'sentado')) console.log('  (Martina:', JSON.stringify(s), 'destino:', JSON.stringify(await js(`${AM}.destino('botera')`)), ')');
      ok(s && Math.hypot(s.x - mu.x - 1.2, s.z - mu.z - 1.2) < 1.2 && s.pose === 'sentado', `Martina, sentada en el muelle (${s?.pose})`);
      if (s) { await js(`(()=>{ const j = ${H}.jugador; j.ubicar(${s.x} - 3.2, ${s.z} + 1.2, 0); return 1 })()`); await mirarA(s.x, s.y + 0.6, s.z); await foto('cita-muelle'); }
      await js(`(()=>{ ${P}.amor.cita = null; ${P}.amor.personas.botera.etapa = 'coqueteo'; return 1 })()`);
    }

    // ------------------------------------------------------------ 4. de la mano en la aldea (Inés)
    if (quiere('mano')) {
      seccion('de la mano en la aldea');
      await js(`(()=>{ ${P}.dia = 5; ${P}.horas = 20; ${P}.amor.personas.herbolaria = ${ficha('novios')}; return 1 })()`);
      for (const hh of [17, 18, 18.5, 19, 19.5, 13, 20]) { await js(`${P}.horas = ${hh}; 1`); const r = await js(`${AM}.caminar('herbolaria')`); await js(`${AM}.soltarJuntos('herbolaria'); 1`); if (r.ok) break; }
      console.log(`  (a las ${await js(`${P}.horas`)})`);
      await ubicar(plaza.x - 4, plaza.z + 8, plaza.x, plaza.z);
      await aldea(4); await pasos(3);
      const s0 = await posDe('herbolaria');
      // se la invita con el menú de la charla
      const h = await hablarCon('herbolaria');
      let c = await elegir('Lo nuestro…');
      ok(c.opciones?.some((o) => o.includes('Salir a caminar juntos')), `«Salir a caminar juntos» en «Lo nuestro…» (${(c.opciones || []).join(' / ')})`);
      c = await elegir('Salir a caminar juntos');
      ok(/mano/.test(c.texto || ''), `ella: «${c.texto}»`);
      await cerrarCharla();
      // caminás por la calle: ella va a tu derecha, de la mano
      // (en la calle de la Vía, al lado de la plaza, mirando a lo largo)
      const calle = await js(`(()=>{ const H = ${H}, am = ${AM}; const a = am.marcos.aMundoPlano(-24, 26.5), b = am.marcos.aMundoPlano(4, 26.5); H.jugador.ubicar(a.x, a.z, Math.atan2(-(b.x - a.x), -(b.z - a.z))); H.jugador.estado.pitch = -0.05;
        const n = H.__aldea.mundo().personas.get('herbolaria').npc; n.pos.set(a.x + 1, H.T.altura(a.x + 1, a.z), a.z); am.empezarJuntos('herbolaria'); return { x: a.x, z: a.z } })()`);
      await pasos(1);
      await js(`(()=>{ const H = ${H}, js = H.jugador.estado; const cu = H.__personal?.cuerpo?.(); js.velocidadActual = 1.2;
        // (caminando de verdad, a 1,2 m/s: se corta a mitad de paso)
        for (let i = 0; i < 83; i++) { const f = { x: -Math.sin(js.yaw), z: -Math.cos(js.yaw) }; js.pos.x += f.x * 0.12; js.pos.z += f.z * 0.12; js.pos.y = H.T.altura(js.pos.x, js.pos.z); H.__amorMundo().actualizar(0.1); H.gente.actualizar(0.1, js, H.camara, null, 0); cu?.actualizar(0.1, js, { conSombras: true }); } return 1 })()`);
      const s = await posDe('herbolaria');
      e = await estado();
      const jp = await js(`(()=>{ const j = ${H}.jugador.estado; return { x: j.pos.x, z: j.pos.z, y: j.pos.y, yaw: j.yaw } })()`);
      const lado = s ? Math.hypot(s.x - jp.x, s.z - jp.z) : -1;
      ok(e.juntos?.clave === 'herbolaria' && e.juntos.gesto === 'mano' && s?.gesto === 'mano' && lado < 1.0, `de la mano, a tu lado (${lado.toFixed(2)} m, ${s?.gesto})`);
      // la captura: te quedás quieto, se congela, tu cuerpo queda ahí y la cámara se corre adelante, en diagonal
      // (el modo foto: tu cuerpo se queda donde está y la cámara vuela, adelante y en diagonal; con el mundo quieto)
      await js(`(()=>{ const H = ${H}, js = H.jugador.estado; H.__amorMundo().congelar(true);
        const f = { x: -Math.sin(js.yaw), z: -Math.cos(js.yaw) }, r = { x: Math.cos(js.yaw), z: -Math.sin(js.yaw) };
        // (de atrás, en diagonal: las manos juntas se ven entre los dos)
        const n0 = H.__aldea.mundo().personas.get('herbolaria').npc, ld = Math.sign((n0.pos.x - js.pos.x) * r.x + (n0.pos.z - js.pos.z) * r.z) || 1;
        const c = { x: js.pos.x - f.x * 2.3 + r.x * ld * 1.1, z: js.pos.z - f.z * 2.3 + r.z * ld * 1.1 };
        const n = H.__aldea.mundo().personas.get('herbolaria').npc; const b = { x: (js.pos.x + n.pos.x) / 2, z: (js.pos.z + n.pos.z) / 2, y: js.pos.y + 0.85 };
        const fo = H.__foto(); fo.grano = 0; fo.vineta = 0.25;
        H.abrirModoFoto(true);
        H.camara.position.set(c.x, js.pos.y + 1.3, c.z);
        js.yaw = Math.atan2(-(b.x - c.x), -(b.z - c.z)); js.pitch = Math.atan2(b.y - (js.pos.y + 1.3), Math.hypot(b.x - c.x, b.z - c.z));
        return 1 })()`);
      await foto('pareja-mano');
      await js(`(()=>{ const H = ${H}; H.abrirModoFoto(false); H.__amorMundo().congelar(false); return 1 })()`);
      await js(`(()=>{ const am = ${AM}; am.soltarJuntos('herbolaria'); return 1 })()`);
      void s0; void calle; void h;
    }

    // ------------------------------------------------------------ 5. el casamiento y la fiesta
    let D = 6;
    if (quiere('boda')) {
      seccion('el casamiento');
      await js(`(()=>{ ${P}.dia = ${D}; ${P}.horas = 9.5; ${P}.amor.personas.veterinaria = ${ficha('comprometidos', { afecto: 95 })}; ${P}.amor.boda = { con: 'veterinaria', dia: ${D}, hora: 11 }; ${P}.amor.anillo = { pedido: 1, listo: 4, retirado: true, para: 'veterinaria' };
        ${P}.vidaAldea.familia = Object.assign(${P}.vidaAldea.familia || {}, { quien: 'mama' }); for (const k of ['jefe','modista','herrero','nelida','panadera','maestra']) ${H}.__aldea.amigo(k, 80); return 1 })()`);
      const bib = await js(`${H}.__aldea.puntos('biblioteca')`);
      await ubicar(bib.cliente.x, bib.cliente.z, bib.adentro.x, bib.adentro.z);
      await aldea(2); await pasos(2);
      await js(`${P}.horas = 10.6; 1`);
      await aldea(2); await amor(2);
      for (let i = 0; i < 10; i++) await pasos(15);
      e = await estado();
      ok(e.escena?.fase === 'ceremonia' && e.escena.ella === 'veterinaria' && e.escena.personas.includes('jefe') && e.escena.personas.includes('modista'), `la ceremonia: ${JSON.stringify(e.escena)}`);
      const juez = e.figuras.find((f) => f.id === 'juez');
      ok(juez?.lista && Math.hypot(juez.x - bib.adentro.x, juez.z - bib.adentro.z) < 1.2, `el juez de paz detrás del mostrador (${juez ? Math.hypot(juez.x - bib.adentro.x, juez.z - bib.adentro.z).toFixed(2) : 'no está'} m)`);
      ok(e.figuras.some((f) => f.id === 'familia-mama' && f.lista), 'tu mamá vino al casamiento');
      const sv = await posDe('veterinaria');
      ok(sv && Math.hypot(sv.x - bib.cliente.x, sv.z - bib.cliente.z) < 1.0, 'ella espera frente al mostrador');
      if (!(sv && Math.hypot(sv.x - bib.cliente.x, sv.z - bib.cliente.z) < 1.0)) console.log('  (ella:', JSON.stringify(sv), 'destino:', JSON.stringify(await js(`${AM}.destino('veterinaria')`)), 'figuras:', JSON.stringify(e.figuras), ')');
      // la foto: desde atrás de los invitados, mirando al mostrador
      await js(`(()=>{ const H = ${H}, b = ${JSON.stringify(bib)}; const dx = b.cliente.x - b.adentro.x, dz = b.cliente.z - b.adentro.z, l = Math.hypot(dx, dz); H.jugador.ubicar(b.cliente.x + dx / l * 1.7 - dz / l * 0.9, b.cliente.z + dz / l * 1.7 + dx / l * 0.9, 0); return 1 })()`);
      await mirarA(bib.adentro.x, (sv?.y || 22) + 1.1, bib.adentro.z);
      await foto('boda');
      const h = await hablarCon('veterinaria', 16);
      ok(/Casarte con Ayelén/.test(h.aviso) && h.textos.some((t) => /juez de paz/.test(t)), `«${h.aviso}»`);
      await cerrarCharla();
      ok((await js(`${P}.amor.conyuge`)) === 'veterinaria', 'casados');
      await amor(1); await pasos(1); await js(`${P}.horas += 0.15; 1`);   // (un rato después: el brindis)
      await amor(2); await pasos(1);
      e = await estado();
      ok(e.fiesta && e.escena?.fase === "fiesta" && e.escena.donde === "salon", `la fiesta, en el salón (${JSON.stringify(e.escena)} ${JSON.stringify(e.fiesta)} hora ${await js(`${P}.horas`)})`);
      const sal = await js(`${H}.__aldea.puntos('salon')`);
      const l5 = sal['lugar-5'], l8 = sal['lugar-8'], ent = { x: l5.x + (l8.x - l5.x) * 0.12, z: l5.z + (l8.z - l5.z) * 0.12 };   // (entre las sillas de un costado y la pista)
      await ubicar(ent.x, ent.z, sal['baile-1'].x, sal['baile-1'].z, 1.2);
      for (let i = 0; i < 10; i++) await pasos(15);
      e = await estado();
      const sb = await posDe('veterinaria');
      ok(sb && sb.pose === 'bailar', `la novia baila (${sb?.pose})`);
      ok(e.copas > 0 || e.escena?.brindis === false, `el brindis: ${e.copas} vasos en alto`);
      await mirarA(sal['baile-2'].x, (sb?.y || 22) + 1.1, sal['baile-2'].z);
      await foto('fiesta-salon');
      // y si el salón estuviera cerrado: en la plaza, con la mesa larga
      await js(`(()=>{ delete ${P}.aldea.locales.salon; return 1 })()`);
      await amor(1); await pasos(1); await edificios(300);
      e = await estado();
      ok(e.escena?.donde === 'plaza' && e.mesa, 'sin salón, la fiesta es en la plaza, con la mesa larga');
      await ubicar(plaza.x + 5, plaza.z - 4, plaza.x, plaza.z + 1.6, 0.8);
      for (let i = 0; i < 10; i++) await pasos(15);
      await foto('fiesta-plaza');
      await js(`(()=>{ ${P}.aldea.locales.salon = 1; return 1 })()`);
      await js(`${P}.horas = 17; 1`); await amor(1); await pasos(2);
      e = await estado();
      ok(!e.escena && !e.mesa && !e.figuras.some((f) => f.id === 'juez' && !f.dormido), 'terminó la fiesta: se levanta la mesa y el juez se fue');
    }

    // ------------------------------------------------------------ 6. la mudanza al refugio
    if (quiere('refugio')) {
      seccion('vivir juntos en el refugio');
      await js(`(()=>{ if (!${P}.amor.personas.veterinaria || ${P}.amor.personas.veterinaria.etapa !== 'casados') { ${P}.amor.personas.veterinaria = ${ficha('casados')}; ${P}.amor.conyuge = 'veterinaria'; }
        ${P}.dia = ${D + 1}; ${P}.horas = 18.5; ${P}.amor.convivencia = { con: 'veterinaria', donde: 'refugio', desde: ${D + 1} }; return 1 })()`);
      const ref = await js(`(()=>{ const r = ${H}.T.lugares.refugio; return { x: r.x, z: r.z, y: r.y, rot: r.rot } })()`);
      const aM = (lx, lz) => ({ x: ref.x + lx * Math.cos(ref.rot) + lz * Math.sin(ref.rot), z: ref.z - lx * Math.sin(ref.rot) + lz * Math.cos(ref.rot) });
      const dentro = aM(0.6, 1.9);
      await js(`(()=>{ ${H}.jugador.ubicar(${dentro.x}, ${dentro.z}, 0); return 1 })()`);
      await amor(1); await pasos(1);
      e = await estado();
      ok(e.cosas && /cajas/.test(e.cosas.firma), `sus cosas en el refugio, con las cajas de la mudanza (${e.cosas?.firma})`);
      await js(`${P}.horas = 19.6; 1`);
      await aldea(2); await pasos(4);
      let s = await posDe('veterinaria');
      const silla = aM(-0.22, -0.98);
      ok(s && s.lejano, `a la noche vuelve al refugio (${s ? Math.hypot(s.x - silla.x, s.z - silla.z).toFixed(1) : '-'} m de su silla)`);
      for (let i = 0; i < 8; i++) { await pasos(15); s = await posDe('veterinaria'); if (s && !s.camino) break; }
      s = await posDe('veterinaria');
      ok(s && Math.hypot(s.x - silla.x, s.z - silla.z) < 0.6 && s.pose === 'sentado', `a la mesa, en su silla (${s?.pose}, ${s ? Math.hypot(s.x - silla.x, s.z - silla.z).toFixed(2) : '-'} m)`);
      await js(`${P}.horas = 21; 1`);
      const ojo = aM(2.6, 1.6);
      await js(`(()=>{ ${H}.jugador.ubicar(${ojo.x}, ${ojo.z}, 0); return 1 })()`);
      await mirarA(silla.x, ref.y + 1.0, silla.z);
      await foto('refugio-noche');
      await js(`${P}.horas = 22.6; 1`);
      await aldea(2); await pasos(25);
      s = await posDe('veterinaria');
      ok(s && s.pose === 'dormir', `a dormir, en la cama (${s?.pose})`);
      const cama = aM(2.2, -2.0);
      await js(`(()=>{ const p = ${JSON.stringify(aM(0.6, 0.3))}; ${H}.jugador.ubicar(p.x, p.z, 0); return 1 })()`);
      await mirarA(cama.x, ref.y + 0.8, cama.z);
      await foto('refugio-cama');
    }

    // ------------------------------------------------------------ 7. los hijos y su cuarto
    if (quiere('hijos')) {
      seccion('los hijos');
      await js(`(()=>{ const d = ${D + 14}; ${P}.dia = d; ${P}.horas = 21.5; ${P}.amor.hijos = [{ id: 'hijo-1', nombre: 'Mateo', sexo: 'nene', nacio: d - 14, madre: 'veterinaria', guia: null }, { id: 'hijo-2', nombre: 'Lucía', sexo: 'nena', nacio: d - 2, madre: 'veterinaria', guia: null }];
        if (!${P}.amor.convivencia) ${P}.amor.convivencia = { con: 'veterinaria', donde: 'refugio', desde: ${D + 1} }; return 1 })()`);
      await amor(1); await pasos(1);
      e = await estado();
      ok(e.cuarto && e.cuarto.casa === 'refugio' && /0/.test(e.cuarto.firma) && /true$/.test(e.cuarto.firma), `el cuarto de los chicos, pegado al refugio (${JSON.stringify(e.cuarto)})`);
      ok(e.cuarto?.bebe, 'el bebé duerme en la cuna');
      for (let i = 0; i < 12; i++) { await pasos(10); e = await estado(); const f = e.figuras.find((x) => x.id === 'hijo-1'); if (f?.lista && f.pose === 'dormir') break; }
      const hf = e.figuras.find((x) => x.id === 'hijo-1');
      ok(hf?.lista && hf.pose === 'dormir', `Mateo, dormido en su cama (${JSON.stringify(hf)})`);
      const puerta = await js(`${AM}.puntoCuarto('puerta')`), adentro = await js(`${AM}.puntoCuarto('umbral')`), cuna = await js(`${AM}.puntoCuarto('cuna')`);
      await js(`(()=>{ const p = ${JSON.stringify(adentro)}; ${H}.jugador.ubicar(p.x, p.z, 0); return 1 })()`);
      await mirarA((cuna.x + (hf?.x ?? cuna.x)) / 2, cuna.y + 0.5, (cuna.z + (hf?.z ?? cuna.z)) / 2);
      await foto('cuarto');
      // y el cuarto desde afuera, de día
      await js(`${P}.horas = 11; 1`);
      const ref = await js(`(()=>{ const r = ${H}.T.lugares.refugio; return { x: r.x, z: r.z } })()`);
      await js(`(()=>{ const p = ${JSON.stringify(puerta)}, r = ${JSON.stringify(ref)}; const dx = p.x - r.x, dz = p.z - r.z, l = Math.hypot(dx, dz); ${H}.jugador.ubicar(p.x + dx / l * 6, p.z + dz / l * 6, 0); return 1 })()`);
      await mirarA((puerta.x + ref.x) / 2, puerta.y + 1.2, (puerta.z + ref.z) / 2);
      await foto('cuarto-afuera');
    }

    // ------------------------------------------------------------ 8. el anillo en el yunque
    if (quiere('anillo')) {
      seccion('el anillo');
      await js(`(()=>{ const d = ${P}.dia; ${P}.horas = 10.5; ${P}.amor.anillo = { pedido: d, listo: d + 3, retirado: false, para: null }; ${P}.amor.personas.herbolaria = ${ficha('novios')}; return 1 })()`);
      const he = await js(`${H}.__aldea.puntos('herreria')`);
      await ubicar(he.adentro.x, he.adentro.z, he.adentro.x, he.adentro.z + 1);
      await amor(1); await aldea(2); await pasos(20);
      e = await estado();
      ok(e.anillo?.estado === 'haciendo', `el anillo en el yunque (${JSON.stringify(e.anillo)})`);
      const yun = await js(`(()=>{ const s = ${AM}.marcos.edificio('herreria'); const c = Math.cos(s.rot), n = Math.sin(s.rot); return { x: s.x + -1.2 * c + 0.8 * n, z: s.z - -1.2 * n + 0.8 * c, y: s.y + 1.1 } })()`);
      await js(`(()=>{ const y = ${JSON.stringify(yun)}, a = ${JSON.stringify(he.adentro)}; const dx = a.x - y.x, dz = a.z - y.z, l = Math.hypot(dx, dz) || 1; ${H}.jugador.ubicar(y.x + dx / l * 1.4 + dz / l * 0.6, y.z + dz / l * 1.4 - dx / l * 0.6, 0); return 1 })()`);
      await mirarA(yun.x, yun.y, yun.z);
      await foto('anillo-yunque');
      await js(`(()=>{ ${P}.amor.anillo = null; ${P}.amor.personas.herbolaria.etapa = 'coqueteo'; return 1 })()`);
    }

    // ------------------------------------------------------------ 9. la mañana después
    if (quiere('manana')) {
      seccion('la mañana después');
      await js(`(()=>{ const d = ${P}.dia; ${P}.amor.niki = d; ${P}.dia = d + 1; ${P}.horas = 7.4; if (!${P}.amor.convivencia) ${P}.amor.convivencia = { con: 'veterinaria', donde: 'refugio', desde: 1 }; ${P}.amor.convivencia.donde = 'refugio'; return 1 })()`);
      const ref = await js(`(()=>{ const r = ${H}.T.lugares.refugio; return { x: r.x, z: r.z, y: r.y, rot: r.rot } })()`);
      const aM = (lx, lz) => ({ x: ref.x + lx * Math.cos(ref.rot) + lz * Math.sin(ref.rot), z: ref.z - lx * Math.sin(ref.rot) + lz * Math.cos(ref.rot) });
      const p0 = aM(2.4, 0.9);
      await js(`(()=>{ ${H}.jugador.ubicar(${p0.x}, ${p0.z}, 0); return 1 })()`);
      await amor(1); await aldea(2); for (let i = 0; i < 8; i++) { await pasos(10); const q = await posDe('veterinaria'); if (q && !q.camino && q.pose) break; }
      e = await estado();
      const sm = await posDe('veterinaria');
      ok(sm && sm.pose === 'sentado', `ella, a la mesa para el desayuno (${JSON.stringify(sm)})`);
      ok(e.cosas?.desayuno, 'el desayuno en la mesa');
      ok(/ya puso la pava|mate/.test(await js(`${H}.__avisos().join(' | ')`)), 'la nota tierna de la mañana');
      const mesa = aM(1.1, -0.98);
      await mirarA(mesa.x, ref.y + 0.9, mesa.z);
      await foto('manana');
    }

    // ------------------------------------------------------------ 10. el ajuste apagado
    seccion('el ajuste apagado');
    // lo que cuesta (en el refugio, con el cuarto, sus cosas, el desayuno, ella y los chicos): dibujos y ms de amor-mundo.js
    const medir = () => js(`(()=>{ const H = ${H}; let calls = 0, tris = 0; for (let i = 0; i < 5; i++) { H.__bucle(); calls += H.renderer.info.render.calls; tris += H.renderer.info.render.triangles; }
      const t0 = performance.now(); for (let i = 0; i < 200; i++) H.__amorMundo().actualizar(0.1); const ms = (performance.now() - t0) / 200;
      return { calls: Math.round(calls / 5), tris: Math.round(tris / 5), ms: +ms.toFixed(3) } })()`);
    const conAmor = await medir();
    await js(`(()=>{ ${H}.ajustes.romance = false; return 1 })()`);
    await amor(1); await pasos(1);
    const sinAmor = await medir();
    console.log(`  (costo: con el amor ${JSON.stringify(conAmor)} · apagado ${JSON.stringify(sinAmor)})`);
    e = await estado();
    ok(!e.activo && !e.cuarto && !e.cosas && !e.anillo && !e.mesa && !e.juntos && !e.figuras.length, `apagado: no se ve nada (${JSON.stringify({ c: e.cuarto, f: e.figuras.length })})`);
    ok(await js(`(()=>{ const n = ${npc('veterinaria')}; return !n || (!n.conVos && !n.__bebe?.visible && !n.gestoAmor) })()`), 'ni gestos ni bebé en brazos');
    await js(`(()=>{ ${H}.ajustes.romance = true; return 1 })()`);
    await amor(1); await pasos(1);
    e = await estado();
    ok(e.activo && (!(await js(`${P}.amor.hijos.length`)) || e.cuarto), 'prendido de nuevo: vuelve el cuarto');
    await cuadros(4);
  } catch (err) {
    errores.push(`excepción en «${donde}»: ${err && err.stack ? err.stack : err}`);
  }
  ok(!errores.filter((x) => !/^✗/.test(x)).some((x) => /Uncaught|Error/.test(x)), 'sin errores en la consola');
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n${errores.join('\n')}` : '\nOK humo 3.7.1 amor (mundo)');
  app.exit(errores.length ? 1 : 0);
});
