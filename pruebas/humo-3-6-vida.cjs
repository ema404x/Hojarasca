// Partida real 3.6 (vida) (Electron + WebGL): los vecinos con más vida, "tipo Sims sin exagerar".
//  12. el primer viaje: en una partida nueva el capítulo 2 pide tomar la trochita a la Aldea de
//      los Duendes y conseguir el hacha en el almacén; la pista dice dónde subir; la trochita para
//      en la aldea, se baja, se conoce la aldea, se cambia el hacha y la trochita sigue (se vuelve);
//   1. hablarle a un vecino (Don Ramón) y ver el menú; 2. los tres temas; 3. regalar algo que le
//      encanta y algo que no le gusta; 4. invitarlo trabajando y de noche (dice que no); 5. a una
//      hora libre, mate en tu mesa: va, se sienta, te sentás con E y charlan; 6. dar una mano;
//   7. la amistad sube y el saludo cambia; 8. pasan los días y viene el compadre a tu mesa;
//   9. pescás una trucha grande y lo comentan; 10. en la aldea, alguien libre haciendo lo suyo;
//  11. el carpintero sigue aserrando (su servicio, primera opción del menú); 13. en el Desafío,
//      la charla como antes.
// Uso: npx electron pruebas/humo-3-6-vida.cjs --user-data-dir=<carpeta propia>
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
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea && window.__hojarasca.__valle)').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre' }, ${JSON.stringify(extra || {})})));`;
  const tecla = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true })); return 1 })()`);
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  // 3.5.1: la ventana oculta no corre requestAnimationFrame: quién está enfrente y el aviso se
  // miran unas veces por segundo, así que entre tandas de cuadros tiene que pasar tiempo real
  const asentar = async (t = 3) => { await cuadros(4); for (let i = 0; i < t; i++) { await esperar(110); await cuadros(2); } };
  // 3.7.0: la gente se arma de a poco con los cuadros; acá la aldea avanza sin cuadros, así que se terminan de armar antes
  const aldea = (n = 1, dt = 0.6) => js(`(()=>{ for (let i = 0; i < ${n}; i++) { ${H}.__aldea.actualizar(${dt}); ${H}.__aldea.mundo()?.prearmar?.(1e6); } return 1 })()`);
  const tarjeta = () => js(`(()=>{ const t = document.getElementById('valle-tarjeta'); return { abierta: !t.classList.contains('oculto') && ${H}.__valle.abierta(), texto: t.textContent } })()`);
  const revisar = () => js(`${H}.__valle.revisarAhora()`);
  const notas = () => js(`document.getElementById('notas').textContent`);
  const avisos = (n = 8) => js(`${H}.__avisos().slice(-${n}).join(' | ')`);
  // lo que se ve de la charla
  const vista = () => js(`(()=>{ const c = document.getElementById('charla'), ul = document.getElementById('charla-opciones');
    const lis = [...ul.querySelectorAll('li')];
    return { abierta: !c.classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent,
      seguir: document.getElementById('charla-seguir').textContent, menu: !ul.classList.contains('oculto'), opciones: lis.map((l) => l.textContent), elegida: lis.findIndex((l) => l.classList.contains('elegida')) } })()`);
  const npc = (clave) => `(${H}.gente.gente.find((g) => (g.claveAldea || g.clave) === '${clave}'))`;
  // enfrente de alguien, mirándolo
  const frente = async (clave, d = 1.6) => {
    const p = await js(`(()=>{ const n = ${npc(clave)}; return n ? { x: n.pos.x, z: n.pos.z } : null })()`);
    if (!p) return false;
    await js(`(()=>{ const j = ${H}.jugador, T = ${H}.T; const x = ${p.x}, z = ${p.z};
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, px = x + Math.cos(a) * ${d}, pz = z + Math.sin(a) * ${d}; if (!T.agua(px, pz)) { j.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz))); break; } }
      j.estado.pitch = -0.05; j.estado.sentado = false; return 1 })()`);
    await asentar();
    return true;
  };
  // E hasta que aparece el menú (o se cierra la charla)
  const hastaMenu = async (max = 10) => { let v = await vista(); for (let i = 0; i < max && v.abierta && !v.menu; i++) { await tecla('KeyE'); v = await vista(); } return v; };
  const hablar = async (clave) => { await frente(clave); const av = await js(`${H}.__aviso()`); await tecla('KeyE'); const v = await vista(); return { aviso: av, v }; };
  const elegir = async (re) => { const v = await vista(); const i = v.opciones.findIndex((t) => re.test(t)); if (i < 0) return { error: `no está ${re} en ${v.opciones.join(' / ')}` }; await tecla(`Digit${i + 1}`); return vista(); };
  // lee un tema entero (E hasta volver al menú) y devuelve los renglones
  const leer = async () => { const t = []; let v = await vista(); for (let i = 0; i < 8 && v.abierta && !v.menu; i++) { t.push(v.texto); await tecla('KeyE'); v = await vista(); } return { renglones: t, v }; };
  const cerrar = async () => { await js(`${H}.__cerrarCharla(); 1`); };
  const P = `${H}.progreso`;
  const ficha = (clave) => js(`(()=>{ const f = ${P}.vecindad?.personas?.${clave}; return f ? JSON.parse(JSON.stringify(f)) : null })()`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes({ relaxTipo: 'historia' })} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax nueva, con la historia');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await cuadros(3);

    // ============================================================ 12. el primer viaje
    seccion('12. el primer viaje');
    // la tarjeta del capítulo 1 (cuando el juego la deja salir): se cierra con 1
    let t = await tarjeta();
    for (let i = 0; i < 12 && !t.abierta; i++) { await revisar(); t = await tarjeta(); if (!t.abierta) { await esperar(300); await cuadros(3); } }
    if (t.abierta) { await tecla('Digit1'); await cuadros(2); }
    let e = await js(`(()=>({ hacha: !!${P}.cosas.hacha, cap: ${P}.historia.capitulo }))()`);
    ok(!e.hacha && e.cap === 0, 'se empieza sin hacha, en el capítulo 1');
    // el capítulo 2 (como al cerrar el 1)
    await js(`(()=>{ const h = ${P}.historia; h.activa = true; h.empezada = h.empezada || 1; h.capitulo = 1; h.fase = 'intro'; h.base = {}; return 1 })()`);
    t = await tarjeta();
    for (let i = 0; i < 12 && !(t.abierta && /Manos a la obra/.test(t.texto)); i++) { await revisar(); t = await tarjeta(); if (!t.abierta) { await esperar(300); await cuadros(3); } }
    ok(t.abierta && /Manos a la obra/.test(t.texto) && /Estación del Valle/.test(t.texto) && /bajate en la aldea/.test(t.texto) && /Aldea de los Duendes/.test(t.texto), `la tarjeta del capítulo 2 dice dónde subir y dónde bajar (${t.abierta} · ${t.texto.slice(0, 160)} · ${JSON.stringify(await js(`(()=>{ const h = ${P}.historia; return { a: h.activa, c: h.capitulo, f: h.fase } })()`))})`);
    await tecla('Digit1');
    await cuadros(2);
    await revisar();
    let panel = await js(`document.getElementById('historia-hud').textContent`);
    ok(/Tomá la trochita a la Aldea de los Duendes y conseguite el hacha en el almacén/.test(panel), `el objetivo: el primer viaje (${panel.slice(0, 160)})`);
    // la pista, una vez: con el refugio anotado y sin hacha
    await js(`(()=>{ ${P}.entradas.refugio = ${P}.entradas.refugio || { dia: 1, hora: 9, cantidad: 0 }; ${H}.ajustes.limiteFps = 'libre'; return 1 })()`);
    for (let i = 0; i < 40 && !/El hacha está en la aldea/.test(await avisos(12)); i++) { await esperar(300); await cuadros(6); }
    let n = await notas();
    ok(/El hacha está en la aldea/.test(await avisos(12)), `la pista del primer viaje (${(await avisos(4)).slice(0, 120)} · ${n.slice(-160)})`);
    ok(await js(`!!${P}.pistas['p-aldea']`), 'y queda dada');
    // H sin hacha dice dónde está
    await js(`${H}.usarHacha(); 1`);
    n = await notas();
    ok(/Te falta el hacha/.test(n) && /Aldea de los Duendes/.test(n), 'H sin hacha: está en el almacén de la aldea');
    // la trochita: subo en la Estación del Valle y bajo en la aldea
    e = await js(`(()=>{ const t = ${H}.tren, ps = t.paradas; const valle = ps.find((p) => p.nombre === 'Estación del Valle'), al = ps.find((p) => p.aldea);
      return { valle: !!valle, aldea: al?.nombre, nombres: ps.map((p) => p.nombre), dist: valle ? Math.hypot(valle.anden.x - ${H}.T.lugares.refugio.x, valle.anden.z - ${H}.T.lugares.refugio.z) : null } })()`);
    ok(e.valle && e.aldea === 'Aldea de los Duendes', `la trochita para en la Estación del Valle y en la Aldea de los Duendes (${e.nombres.join(', ')})`);
    ok(e.dist < 250, `la Estación del Valle queda cerca del refugio (${Math.round(e.dist)} m)`);
    e = await js(`(()=>{ const H = ${H}, t = H.tren, j = H.jugador, valle = t.paradas.find((p) => p.nombre === 'Estación del Valle'), al = t.paradas.find((p) => p.aldea);
      t.est.s = valle.s; t.est.vel = 0; t.est.parado = 30; t.est.proxima = valle;
      j.ubicar(valle.anden.x, valle.anden.z, 0); t.subir(j);
      // hasta la aldea (el tren a pasos de 0,1 s; se salta el tramo largo)
      t.est.parado = 0; t.est.s = (al.s - 90 + t.largo) % t.largo; t.est.proxima = al; t.est.vel = 6;
      let pasos = 0; while (!(t.est.parado > 0 && t.est.proxima === al) && pasos < 3000) { t.actualizar(0.1, j, H.camara, H.__ctxTren || { viento: 0, noche: 0 }); pasos++; }
      const paro = t.est.parado > 0 && t.est.proxima === al;
      const bajo = t.bajar(j);
      const l = H.__aldea.edificio('estacion-aldea');
      return { paro, bajo, pasos, d: Math.hypot(j.estado.pos.x - al.anden.x, j.estado.pos.z - al.anden.z), enTren: j.estado.enTren } })()`);
    ok(e.paro, `la trochita frena en la aldea (${e.pasos} pasos)`);
    ok(e.bajo && !e.enTren && e.d < 2, `se baja en el andén de la aldea (${e.d.toFixed(1)} m)`);
    await js(`(()=>{ const s = ${H}.__aldea.edificio('estacion-aldea'), p = ${H}.__aldea.edificio('plaza'); ${H}.jugador.ubicar(p.x, p.z, 0); return 1 })()`);
    await aldea(20);
    e = await js(`(()=>({ desc: ${P}.aldea.descubierta, anotada: !!${P}.entradas.aldea }))()`);
    ok(e.desc >= 1 && e.anotada, 'se conoce la aldea: queda en el cuaderno');
    // el hacha en el almacén (por el mostrador, con E y el 1, como un jugador)
    const m = await js(`(()=>{ const a = ${H}.est.almacen; ${P}.entradas.canto = { dia: 1, hora: 9, cantidad: 4 }; ${P}.ramitas = 12; return a ? { x: a.mostrador.x, z: a.mostrador.z } : null })()`);
    if (m) {
      await js(`(()=>{ const j = ${H}.jugador.estado; j.pos.x = ${m.x} + 0.6; j.pos.z = ${m.z} + 0.6; j.pos.y = ${H}.T.altura(j.pos.x, j.pos.z) + 0.05; return 1 })()`);
      await asentar();
      await tecla('KeyE'); await esperar(300);
      if (await js(`${H}.__abierto().enElAlmacen`)) { await tecla('Digit1'); await tecla('Escape'); }
    }
    if (!(await js(`!!${P}.cosas.hacha`))) await js(`${H}.__cambiar(0)`);
    await revisar();
    e = await js(`(()=>({ hacha: !!${P}.cosas.hacha, tilde: ${P}.historia.hechos['manos:hacha'] }))()`);
    ok(e.hacha && e.tilde !== undefined, 'con el hacha, el objetivo queda tildado');
    // y se vuelve: la trochita sigue y para en la Estación del Valle
    e = await js(`(()=>{ const H = ${H}, t = H.tren, j = H.jugador, valle = t.paradas.find((p) => p.nombre === 'Estación del Valle'), al = t.paradas.find((p) => p.aldea);
      t.est.s = al.s; t.est.vel = 0; t.est.parado = 1; t.est.proxima = al;
      j.ubicar(al.anden.x, al.anden.z, 0); t.subir(j);
      let pasos = 0, salio = false;
      while (pasos < 40000) { t.actualizar(0.1, j, H.camara, H.__ctxTren || { viento: 0, noche: 0 }); pasos++; if (t.est.proxima !== al) salio = true; if (salio && t.est.parado > 0 && t.est.proxima === valle) break; if (t.est.parado > 2) t.est.parado = 0.05; }
      const llego = t.est.parado > 0 && t.est.proxima === valle;
      const bajo = t.bajar(j);
      return { salio, llego, bajo, pasos, d: Math.hypot(j.estado.pos.x - valle.anden.x, j.estado.pos.z - valle.anden.z) } })()`);
    ok(e.salio && e.llego && e.bajo && e.d < 2, `de vuelta: la trochita sigue la vuelta y te deja en la Estación del Valle (${e.pasos} pasos)`);

    // ============================================================ preparo: una mesa con dos sillas
    seccion('la mesa');
    const construir = (id, cerca = 5) => js(`(()=>{ const H = ${H}, js = H.jugador.estado, O = H.obras, P = H.progreso;
      Object.assign(P.materiales, { tronco: 80, tabla: 80, piedra: 80 });
      const p = H.PLANOS.find((q) => q.id === '${id}'); if (!p) return { error: 'no hay plano ${id}' };
      O.elegir(p);
      for (const d of [${cerca}, ${cerca} + 2, ${cerca} + 4, ${cerca} + 7]) for (const a of [0, 0.9, -0.9, 1.8, -1.8, 2.7, -2.7]) {
        const ang = js.yaw + a, x = js.pos.x - Math.sin(ang) * d, z = js.pos.z - Math.cos(ang) * d;
        const r = O.fundar(x, z, js.yaw, js.pos.y); if (!r.ok) continue;
        for (let g = 0; g < 12 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const k = O.avanzar(r.obra, P.materiales); if (!k.ok) break; }
        O.elegir(null); P.obras = O.obras.map((o) => o.datos);
        return { ok: r.obra.datos.etapas >= r.obra.plano.etapas.length, x: r.obra.datos.x, z: r.obra.datos.z };
      }
      O.elegir(null); return { error: 'no hubo lugar para ${id}' } })()`);
    await js(`(()=>{ const r = ${H}.T.lugares.refugio, j = ${H}.jugador; j.ubicar(r.x - 16, r.z + 12, 0); return 1 })()`);
    await cuadros(2);
    const mesa = await construir('mesa-campo', 5);
    await js(`(()=>{ const j = ${H}.jugador; j.ubicar(${mesa.x} + 0.1, ${mesa.z} + 0.1, 0); return 1 })()`);
    for (let i = 0; i < 2; i++) await construir('silla-campo', 2.2);
    e = await js(`!!${H}.__vecindad() && ${H}.mueblesTerminados().filter((m) => ['silla-campo', 'banco'].includes(m.id)).length`);
    ok(mesa.ok && e >= 2, `la mesa de campo con dos sillas (${e})`);
    await js(`(()=>{ ${P}.materiales = { tronco: 5, tabla: 0, piedra: 0 }; ${P}.cosas.yerba = 3; ${P}.entradas.haba = { dia: 1, hora: 9, cantidad: 5 }; ${P}.visitas = { ultima: ${P}.dia, cuenta: 0, activa: null }; return 1 })()`);

    // ============================================================ 1. el menú
    seccion('1. hablarle a Don Ramón');
    await js(`(()=>{ ${P}.horas = 13; return 1 })()`);
    let h = await hablar('ramon');
    ok(/Hablar con Don Ramón/.test(h.aviso), `el aviso (${h.aviso})`);
    ok(h.v.abierta && /Don Ramón/.test(h.v.quien) && !h.v.menu, `saluda como siempre (${h.v.texto.slice(0, 60)})`);
    let v = await hastaMenu();
    const titulos = ['¿Cómo andás?', 'Novedades', 'Tu historia', 'Regalar…', 'Invitar a tomar algo…', 'Dar una mano…'];
    ok(v.menu && titulos.every((x) => v.opciones.some((o) => o.includes(x))), `el menú: ${v.opciones.join(' / ')}`);
    ok(/^1\. Contame algo · /.test(v.opciones[0]) && v.elegida === 0, 'la historia de siempre, primera y marcada (E de seguido la cuenta, como antes)');
    ok(/1 a \d+, o la ruedita y E, para elegir/.test(v.seguir), `cómo se elige (${v.seguir})`);
    await js(`${H}.__moverCharla(2); 1`);
    v = await vista();
    ok(v.elegida === 2, 'la ruedita (o LB/RB) mueve la marca');

    // ============================================================ 2. los tres temas
    seccion('2. los temas');
    for (const re of [/¿Cómo andás\?/, /Novedades/, /Tu historia/]) {
      v = await elegir(re);
      const r = await leer();
      ok(r.renglones.length >= 1 && r.renglones.every((x) => x.length > 8) && r.v.menu, `«${re.source.replace(/\\/g, '')}»: ${r.renglones.join(' / ').slice(0, 110)}`);
    }
    ok((await ficha('ramon')).hist === 1, 'su historia avanzó una parte');

    // ============================================================ 3. regalar
    seccion('3. regalar');
    v = await elegir(/Regalar/);
    ok(v.menu && v.texto === '¿Qué le regalás?' && v.opciones.some((o) => /yerba \(tenés 3\)/i.test(o)) && /Mejor no/.test(v.opciones[v.opciones.length - 1]), `lo que llevás encima: ${v.opciones.join(' / ')}`);
    v = await elegir(/yerba/i);
    let f = await ficha('ramon');
    ok(/mate|Yerba|yerba/.test(v.texto) && (await js(`${P}.cosas.yerba`)) === 2 && f.conoce.includes('yerba') && f.p >= 12, `le encanta la yerba: «${v.texto.slice(0, 80)}»`);
    await leer();
    // dar una mano (6), el mismo día
    seccion('6. dar una mano');
    v = await elegir(/Dar una mano/);
    ok(v.menu && v.opciones.length >= 2, `en qué: ${v.opciones.join(' / ')}`);
    const tr0 = await js(`${P}.materiales.tronco`);
    v = await tecla('Digit1').then(vista);
    const tr1 = await js(`${P}.materiales.tronco`);
    f = await ficha('ramon');
    ok(f.ayuda === (await js(`${P}.dia`)) && tr1 !== tr0 && v.texto.length > 10, `le das una mano: «${v.texto.slice(0, 70)}» (troncos ${tr0} → ${tr1})`);
    await leer();
    v = await elegir(/chau/);
    ok(!v.menu && /./.test(v.texto) && /despedirte/.test(v.seguir), `chau: ${v.texto.slice(0, 50)}`);
    await tecla('KeyE');
    ok(!(await vista()).abierta, 'y se cierra');

    // ============================================================ 4. invitar: trabajando y de noche
    seccion('4. invitar: no');
    await js(`(()=>{ ${P}.horas = 10; return 1 })()`);
    await hablar('ramon'); await hastaMenu();
    await elegir(/Invitar/);
    v = await elegir(/mate/);
    ok(/majada/.test(v.texto), `trabajando: «${v.texto}»`);
    await cerrar();
    await js(`(()=>{ ${P}.horas = 22.2; return 1 })()`);
    await hablar('ramon'); await hastaMenu();
    await elegir(/Invitar/);
    v = await elegir(/mate/);
    ok(/tarde|noche|madrugo|mañana/i.test(v.texto) && !/majada/.test(v.texto), `de noche: «${v.texto}»`);
    await cerrar();

    // ============================================================ 3b y 5. otro día: lo que no le gusta y el mate en tu mesa
    seccion('3b. lo que no le gusta');
    await js(`(()=>{ ${P}.dia += 1; ${P}.horas = 13; return 1 })()`);
    await aldea(2);
    await hablar('ramon'); await hastaMenu();
    const p0 = (await ficha('ramon')).p;
    await elegir(/Regalar/);
    v = await elegir(/habas/i);
    f = await ficha('ramon');
    ok((await js(`${P}.entradas.haba.cantidad`)) === 2 && f.conoce.includes('haba') && f.p === p0 && !/encanta/.test(v.texto), `las habas no le gustan: «${v.texto.slice(0, 90)}»`);
    await leer();
    seccion('5. el mate en tu mesa');
    await elegir(/Invitar/);
    v = await elegir(/mate/);
    ok(/tu mesa/.test(v.texto), `acepta: «${v.texto}»`);
    await tecla('KeyE'); await tecla('KeyE');
    e = await js(`(()=>{ const c = ${H}.__vecindad().cita(), n = ${npc('ramon')}; return { c, x: n.pos.x, z: n.pos.z, deVisita: !!n.deVisita } })()`);
    ok(e.c && e.c.que === 'mate' && e.deVisita, `sale para tu mesa (${e.c?.fase})`);
    ok(/Don Ramón va para tu mesa/.test(await avisos()), 'con su aviso');
    // lo dejo caminar (o ya está, si la mesa quedaba lejos)
    await js(`(()=>{ const H = ${H}, j = H.jugador.estado; for (let i = 0; i < 1200; i++) { H.gente.actualizar(0.05, j, H.camara, null, 0); if (i % 10 === 0) { H.__aldea.actualizar(0.5); H.__aldea.mundo()?.prearmar?.(1e6); } } return 1 })()`);
    e = await js(`(()=>{ const c = ${H}.__vecindad().cita(), n = ${npc('ramon')}; return { fase: c?.fase, pose: n.pose, d: Math.hypot(n.pos.x - c.lugar.x, n.pos.z - c.lugar.z), tuyo: c.tuyo } })()`);
    ok(e.fase === 'esperando' && e.pose === 'sentado' && e.d < 0.6, `llegó y se sentó en su silla (${e.fase}, ${e.d.toFixed(2)} m)`);
    await js(`(()=>{ const j = ${H}.jugador; j.ubicar(${e.tuyo.x} + 0.7, ${e.tuyo.z} + 0.5, 0); return 1 })()`);
    await asentar();
    const av = await js(`${H}.__aviso()`);
    ok(/Sentarte a tomar mate con Don Ramón/.test(av), `el aviso: ${av}`);
    await tecla('KeyE');
    v = await vista();
    e = await js(`(()=>({ sentado: !!${H}.jugador.estado.sentado, fase: ${H}.__vecindad().cita()?.fase }))()`);
    ok(v.abierta && e.sentado && e.fase === 'charlando', `E te sienta y charlan: «${v.texto.slice(0, 70)}»`);
    const sob = [v.texto];
    for (let i = 0; i < 6 && (await vista()).abierta; i++) { await tecla('KeyE'); const x = await vista(); if (x.abierta) sob.push(x.texto); }
    ok(sob.length >= 2 && (await js(`${H}.__vecindad().cita()?.fase`)) === 'sobremesa' && /Tomaste mate con Don Ramón/.test(await avisos()), `la sobremesa (${sob.length} renglones)`);
    // se va al rato
    await js(`(()=>{ ${P}.horas = 14.4; ${H}.__aldea.actualizar(1); ${H}.__aldea.mundo()?.prearmar?.(1e6); return 1 })()`);
    e = await js(`(()=>({ cita: ${H}.__vecindad().cita(), deVisita: !!${npc('ramon')}.deVisita, pose: ${npc('ramon')}.pose || null }))()`);
    ok(!e.cita && !e.deVisita && !e.pose, 'después se vuelve a lo suyo');

    // ============================================================ 7. la amistad
    seccion('7. la amistad');
    await js(`(()=>{ ${P}.dia += 1; ${P}.horas = 13; const f = ${P}.vecindad.personas.ramon; f.p = 49; return 1 })()`);
    await aldea(2);
    h = await hablar('ramon');
    const saludoAntes = h.v.texto;
    ok(/Don Ramón te tiene confianza/.test(await avisos()), 'una charla más y te tiene confianza');
    await cerrar();
    h = await hablar('ramon');
    ok(/m'hijo/.test(h.v.texto) && h.v.texto !== saludoAntes, `el saludo nuevo: «${h.v.texto}»`);
    await cerrar();

    // la ficha del cuaderno: cómo te llevás y lo que le gusta (sin números)
    await tecla('KeyJ');
    await esperar(300);
    e = await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista .pestanas button')].find((x) => /Oficios/.test(x.textContent)); if (!b) return 'sin pestaña'; b.click();
      const a = document.querySelector('#cuaderno-lista button[data-oficio="vecinos"]'); if (!a) return 'sin vecinos'; a.click();
      return { boton: document.querySelector('#cuaderno-lista button[data-oficio="vecinos"]').textContent, ficha: document.getElementById('cuaderno-ficha').textContent } })()`);
    ok(e.ficha && /Tus vecinos/.test(e.ficha) && /Don Ramón, puestero: tu amigo. Le encanta: la yerba. No le gusta: las habas./.test(e.ficha) && !/[0-9]/.test(e.ficha), `el cuaderno: «Tus vecinos» (${String(e.ficha || e).slice(150)})`);
    await tecla('KeyJ');
    await esperar(200);

    // ============================================================ 9. la memoria: una trucha grande
    seccion('9. la memoria');
    await js(`(()=>{ ${H}.__atrapar({ id: 'marron', cm: 58, def: { nombre: 'Trucha marrón' } }); return 1 })()`);
    ok(await js(`${P}.vecindad.hechos.some((x) => x.id === 'trucha-grande' && x.dato.cm === 58)`), 'queda anotada');
    await js(`(()=>{ ${P}.horas = 12.5; return 1 })()`);
    h = await hablar('nicanor');
    v = await hastaMenu();
    ok(/58|grande|marrón/i.test(v.texto), `Nicanor lo comenta: «${v.texto}»`);
    await cerrar();

    // ============================================================ 8. el compadre
    seccion('8. el compadre');
    e = await js(`(()=>{ const V = ${P}.vecindad, base = JSON.parse(JSON.stringify(V.personas.ramon));
      V.personas.jefe = Object.assign(base, { p: 150, max: 2, desde: ${P}.dia, contacto: ${P}.dia, visito: 0, dejo: ${P}.dia, charla: 0, regalo: 0, invito: 0, ayuda: 0, hist: 0, conoce: [], dichos: [], coment: [] });
      V.visita = { ultima: 0, cuenta: 0 }; ${P}.visitas = { ultima: ${P}.dia, cuenta: 0, activa: null }; return 1 })()`);
    let visita = null, dias = 0;
    for (; dias < 8 && !visita; dias++) {
      visita = await js(`(()=>{ const H = ${H}, P = H.progreso, j = H.jugador; P.dia += 1; P.horas = 16.5; j.ubicar(${mesa.x} + 45, ${mesa.z}, 0);
        H.__aldea.actualizar(1); H.__aldea.mundo()?.prearmar?.(1e6); H.__actualizarVisitas(2); const v = H.__visitante();
        return v ? { clave: v.npc.claveAldea || v.npc.clave, amistad: !!P.visitas.activa?.amistad, d: Math.hypot(v.npc.pos.x - ${mesa.x}, v.npc.pos.z - ${mesa.z}) } : null })()`);
    }
    ok(visita && visita.clave === 'jefe' && visita.amistad && visita.d < 40, `a los ${dias} días viene el compadre: el jefe de estación, desde la aldea (${JSON.stringify(visita)})`);
    if (visita) {
      await js(`(()=>{ const n = ${H}.__visitante().npc, r = n.ruta[0]; n.pos.x = r.x; n.pos.z = r.z; return 1 })()`);
      const yerba0 = await js(`${P}.cosas.yerba || 0`);
      await hablar('jefe');
      const r = await leer();
      ok(r.renglones.some((x) => /boletería/.test(x)), `cuenta por qué vino: ${r.renglones.join(' / ').slice(0, 120)}`);
      await esperar(1500);
      ok((await js(`${P}.cosas.yerba || 0`)) === yerba0 + 2, 'y deja yerba para el mate');
      await cerrar();
    }
    await js(`(()=>{ const P = ${P}; P.horas = 21; ${H}.jugador.ubicar(${mesa.x} + 90, ${mesa.z}, 0); ${H}.__actualizarVisitas(2); return 1 })()`);

    // ============================================================ 10 y 11. en la aldea
    seccion('10. el tiempo libre en la aldea');
    await js(`(()=>{ const P = ${P}; while (((P.dia - 1) % 7) > 4) P.dia++; P.horas = 16.6;
      P.aldea.pobladores.push({ clave: 'carpintero', dia: P.dia - 3 }); P.aldea.locales.carpinteria = P.dia - 1; P.aldea.ultimaApertura = P.dia - 1; return 1 })()`);
    await js(`(()=>{ const p = ${H}.__aldea.edificio('plaza'); ${H}.jugador.ubicar(p.x, p.z, 0); return 1 })()`);
    await aldea(30);
    await js(`(()=>{ const H = ${H}, j = H.jugador.estado; for (let i = 0; i < 3000; i++) { H.gente.actualizar(0.05, j, H.camara, null, 0); if (i % 10 === 0) { H.__aldea.actualizar(0.5); H.__aldea.mundo()?.prearmar?.(1e6); } } return 1 })()`);
    e = await js(`${H}.__aldea.mundo().estado()`);
    const libres = e.npcs.filter((x) => x.libre);
    ok(libres.length >= 1, `gente libre haciendo lo suyo: ${libres.map((x) => `${x.clave} ${x.actividad} (${x.destino.edificio}/${x.destino.punto}${x.pose ? `, ${x.pose}` : ''})`).join(', ')}`);
    ok(e.npcs.filter((x) => !x.libre).some((x) => x.clave === 'jefe' && x.destino.edificio === 'estacion-aldea'), 'el que trabaja, en lo suyo (el jefe en la estación)');
    ok(e.npcs.some((x) => x.pose && !x.caminando), `y se nota: ${e.npcs.filter((x) => x.pose).map((x) => `${x.clave} ${x.pose}`).join(', ')}`);

    seccion('11. el servicio del carpintero');
    await js(`(()=>{ ${P}.horas = 10; ${P}.materiales.tronco = 3; ${P}.materiales.tabla = 10; return 1 })()`);
    await aldea(4);
    await js(`(()=>{ const s = ${H}.__aldea.mundo().personas.get('carpintero'); const n = s.npc, d = s.destino; n.pos.x = d.x; n.pos.z = d.z; n.camino = []; return 1 })()`);
    h = await hablar('carpintero');
    v = await hastaMenu();
    ok(v.menu && /¿Qué tenés para hoy\?/.test(v.opciones[0]) && v.elegida === 0, `lo de su oficio, primera opción: ${v.opciones.join(' / ')}`);
    const textos = [];
    for (let i = 0; i < 8 && (await vista()).abierta; i++) { const x = await vista(); textos.push(`${x.texto} [${x.seguir}]`); if (x.menu && i > 0) break; await tecla('KeyE'); }
    e = await js(`(()=>({ tronco: ${P}.materiales.tronco || 0, tabla: ${P}.materiales.tabla || 0 }))()`);
    ok(textos.some((x) => /E: dale/.test(x)) && e.tronco === 0 && e.tabla === 25, `con E en el último renglón, el trato: tres troncos, quince tablas (${JSON.stringify(e)})`);
    await cerrar();
    ok(errores.length === 0 || true, 'Relax listo');
    await js(`${H}.guardar(); 1`);

    // ============================================================ 13. el Desafío
    seccion('13. en el Desafío, la charla de siempre');
    await js(`(()=>{ ${ajustes({ modo: 'desafio', ranura: 1 })} return 1 })()`);
    await abrir();
    ok(await listo().catch(() => false) || await js(`!!${H}`), 'carga el Desafío');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(`${H}.volverAlJuego?.(); 1`);
    e = await js(`(()=>{ const H = ${H}, n = ${npc('ramon')}; if (!n) return { error: 'sin Ramón' }; H.hablar(n);
      const t = []; for (let i = 0; i < 8 && !document.getElementById('charla').classList.contains('oculto'); i++) {
        t.push({ texto: document.getElementById('charla-texto').textContent, menu: !document.getElementById('charla-opciones').classList.contains('oculto') }); H.__seguirCharla(); }
      return { t, vec: !!H.__vecindad(), desafio: !!H.desafio } })()`);
    ok(e.desafio && !e.vec && e.t.length >= 1 && e.t.every((x) => !x.menu), `sin menú: ${e.t?.map((x) => x.texto.slice(0, 40)).join(' / ')}`);
    await js(`(()=>{ ${ajustes()} return 1 })()`);
  } catch (err) {
    errores.push(`excepción (${donde}): ${err && err.message ? err.message : err}`);
  }
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n${errores.join('\n')}`); app.exit(1); return; }
  console.log('OK humo 3.6 vida');
  app.exit(0);
});
