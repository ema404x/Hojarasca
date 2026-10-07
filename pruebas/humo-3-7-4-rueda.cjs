// Partida real 3.7.4 (rueda) (Electron + WebGL): la vida social tipo Los Sims, lo que se ve y se oye.
//   1. hablarle a una vecina en la plaza: la rueda de categorías alrededor de su cabeza, con la barra de amistad (y
//      sus marcas), su emoción y su deseo arriba; «Nada más, chau» abajo;
//   2. con el teclado: el número abre la segunda rueda, Escape vuelve, las flechas mueven la marca, E elige;
//   3. con el mouse: clic (mousedown) en un sector; con el mouse bloqueado, moverlo apunta;
//   4. con el mando: el palito apunta (la misma cuenta que usa leerMando) y A elige;
//   5. una interacción de cada categoría nueva: la animación del vecino, la burbuja, la emoción y la voz;
//   6. lo de siempre sigue: regalar (la segunda rueda del regalo), el servicio del poblador primero, los temas;
//   7. entre vecinos: dos que se cruzan se abrazan, discuten o se ríen, con burbujas y emociones;
//   8. la iniciativa: el que te quiere decir algo (el aviso, y E primero lo que te quería decir);
//   9. el costo: 24 personas en la plaza charlando entre ellas (ms por cuadro y dibujos);
//  10. las capturas (pruebas/salidas/rueda-374/).
// Uso: npx electron pruebas/humo-3-7-4-rueda.cjs (HUMO_PERFIL=<carpeta propia>). Borra el localStorage del perfil.
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', 'perfil-rueda-374')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const salidas = path.join(raiz, 'pruebas', 'salidas', 'rueda-374');
fs.mkdirSync(salidas, { recursive: true });

app.whenReady().then(async () => {
  const errores = [];
  // (a la vista: la ventana oculta no dibuja, y las capturas serían de un cuadro viejo)
  const w = new BrowserWindow({ show: true, width: 1280, height: 760, useContentSize: true, webPreferences: { backgroundThrottling: false } });
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
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea && window.__hojarasca.__social && window.__hojarasca.__social())').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const P = `${H}.progreso`;
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'baja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre' }, ${JSON.stringify(extra || {})})));`;
  const tecla = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true })); return 1 })()`);
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const asentar = async (t = 3) => { await cuadros(4); for (let i = 0; i < t; i++) { await esperar(110); await cuadros(2); } };
  const aldea = (n = 1, dt = 0.6) => js(`(()=>{ for (let i = 0; i < ${n}; i++) { ${H}.__aldea.actualizar(${dt}); ${H}.__aldea.mundo()?.prearmar?.(1e6); } return 1 })()`);
  const rueda = () => js(`${H}.__rueda()`);
  const vista = () => js(`(()=>{ const c = document.getElementById('charla'); return { abierta: !c.classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent, seguir: document.getElementById('charla-seguir').textContent, rueda: ${H}.__rueda() } })()`);
  const npc = (clave) => `(${H}.gente.gente.find((g) => (g.claveAldea || g.clave) === '${clave}'))`;
  const captura = async (nombre) => {
    await js(`document.getElementById('pista-clic')?.classList.add('oculto'); 1`);
    await cuadros(3); await esperar(400); await cuadros(2); await esperar(200);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salidas, nombre), img.toPNG());
    console.log(`  (captura: pruebas/salidas/rueda-374/${nombre})`);
  };
  // la persona, quieta en (x, z), y vos enfrente, mirándola
  const poner = (clave, x, z, mira = 0) => js(`(()=>{ const n = ${npc(clave)}; if (!n) return false; n.pos.set(${x}, ${H}.T.altura(${x}, ${z}), ${z}); n.camino = []; n.ruta = null; n.pose = null; n.dormido = false; n.vel = 0; n.charlaVecinos = false; n.miraFinal = ${mira}; n.rumboObjetivo = ${mira}; n.g.rotation.y = ${mira}; return true })()`);
  const frente = async (clave, d = 1.7) => {
    await js(`(()=>{ const n = ${npc(clave)}, j = ${H}.jugador; const x = n.pos.x, z = n.pos.z; const px = x, pz = z + ${d}; j.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz))); j.estado.pitch = -0.08; j.estado.sentado = false; return 1 })()`);
    await asentar();
  };
  const hastaRueda = async (max = 10) => { let v = await vista(); for (let i = 0; i < max && v.abierta && !v.rueda.abierta; i++) { await tecla('KeyE'); v = await vista(); } return v; };
  const leer = async () => { const t = []; let v = await vista(); for (let i = 0; i < 8 && v.abierta && !v.rueda.abierta; i++) { t.push(v.texto); await tecla('KeyE'); v = await vista(); } return { renglones: t, v }; };
  // elegir con el número del sector (en la rueda que está abierta)
  const numero = async (re) => { const r = await rueda(); const i = r.sectores.findIndex((s) => re.test(s.titulo) || re.test(s.categoria || '')); if (i < 0 || i > 8) return { error: `no está ${re} en ${r.sectores.map((s) => s.titulo).join(' / ')}` }; await tecla(`Digit${i + 1}`); return vista(); };
  const cerrar = () => js(`${H}.__cerrarCharla(); 1`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes({ relaxTipo: 'libre', ritmoAldea: 'animado' })} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax nueva');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await cuadros(3);
    await js(`(()=>{ try { ${H}.sonido.iniciar(); } catch {} ${P}.horas = 11; ${P}.cosas.yerba = 4; ${H}.ajustes.limiteFps = 'libre'; return 1 })()`);
    // a la plaza de la aldea
    const plaza = await js(`(()=>{ const p = ${H}.__aldea.edificio('plaza'); ${H}.jugador.ubicar(p.x, p.z, 0); return { x: p.x, z: p.z } })()`);
    await aldea(25);
    await asentar(4);
    const presentes = await js(`${H}.gente.gente.filter((g) => g.claveAldea && !g.dormido && !g.aBordo).map((g) => g.claveAldea)`);
    ok(presentes.length >= 6, `la gente de la aldea está (${presentes.length}: ${presentes.slice(0, 12).join(', ')})`);
    const adultos = presentes.filter((k) => !['nino', 'nina', 'chico', 'chica'].some((c) => k.includes(c)));
    const vecina = ['panadera', 'tejedora', 'maestra', 'modista', 'jefe', 'carpintero'].find((k) => presentes.includes(k)) || adultos[0];
    const x0 = plaza.x + 3, z0 = plaza.z - 2;

    // ============================================================ 1. la rueda
    seccion('1. la rueda alrededor de la cabeza');
    ok(await poner(vecina, x0, z0, 0), `${vecina}, en la plaza`);
    await frente(vecina);
    let av = await js(`${H}.__aviso()`);
    ok(/Hablar con|te quiere decir/.test(JSON.stringify(av)), `el aviso: ${JSON.stringify(av)}`);
    await tecla('KeyE');
    let v = await hastaRueda();
    let r = v.rueda;
    ok(v.abierta && r.abierta && r.nivel === 1 && r.tipo === 'categorias', `abre la rueda (${r.sectores.map((s) => s.titulo).join(' · ')})`);
    ok(['Charlar', 'Amistosas', 'Graciosas', 'Juntos', 'Regalar y ayudar', 'Picantes'].every((t) => r.sectores.some((s) => s.titulo === t)), 'las categorías de las reglas');
    ok(/chau/i.test(r.sectores[r.sectores.length - 1].titulo), '«Nada más, chau», al final');
    const dom = await js(`(()=>{ const lis = [...document.querySelectorAll('#charla-opciones li')]; const el = document.getElementById('rueda'); const b = el.getBoundingClientRect(); return { n: lis.length, textos: lis.map((l) => l.textContent), iconos: lis.every((l) => !!l.querySelector('.icono-social')?.style.backgroundPosition), atlas: getComputedStyle(document.documentElement).getPropertyValue('--atlas-social').length, x: b.left, y: b.top, amistad: document.getElementById('rueda-amistad').style.width, marca: document.getElementById('rueda-marca-amigo').style.left, deseo: document.getElementById('rueda-deseo').textContent, emocion: document.getElementById('rueda-emocion').textContent, nombre: document.getElementById('rueda-nombre').textContent } })()`);
    ok(dom.n === r.sectores.length && dom.iconos && dom.atlas > 1000, `los sectores con su ícono del atlas (${dom.textos.join(' / ')})`);
    ok(dom.x > 100 && dom.x < 1180 && dom.y > 100 && dom.y < 700, `alrededor de la cabeza, en la pantalla (${Math.round(dom.x)}, ${Math.round(dom.y)})`);
    ok(/%$/.test(dom.amistad) && dom.marca === '25%', `la barra de amistad (${dom.amistad}) con la marca de amigo (${dom.marca})`);
    ok(r.info && typeof r.info.relacion.amistad === 'number' && !!dom.nombre, `arriba: ${dom.nombre} · ${dom.emocion} · ${dom.deseo}`);
    await captura('1-rueda-categorias.png');

    // ============================================================ 2. teclado
    seccion('2. con el teclado');
    v = await numero(/^Amistosas$/);
    r = await rueda();
    ok(r.nivel === 2 && r.cat === 'amistosa' && r.sectores.some((s) => /abrazo/i.test(s.titulo)), `el número abre la segunda rueda (${r.sectores.map((s) => s.titulo + (s.disponible ? '' : ' [gris]')).join(' · ')})`);
    await captura('2-segunda-rueda.png');
    await tecla('Escape');
    r = await rueda();
    ok(r.nivel === 1 && r.abierta && r.sectores[r.i]?.categoria === 'amistosa', 'Escape vuelve a las categorías, con la marca en la que estaba');
    const antes = r.i;
    await tecla('ArrowDown');
    r = await rueda();
    ok(r.i !== antes, `las flechas mueven la marca (${antes} → ${r.i})`);
    const pos0 = await js(`${H}.jugador.estado.pos.z`);
    await js(`(()=>{ ${H}.jugador.teclas.add('ArrowUp'); return 1 })()`);
    await cuadros(10);
    await js(`(()=>{ ${H}.jugador.teclas.delete('ArrowUp'); return 1 })()`);
    ok(Math.abs((await js(`${H}.jugador.estado.pos.z`)) - pos0) < 0.05, 'con la rueda abierta, las flechas no te hacen caminar');
    await js(`${H}.__moverCharla(1); 1`);
    ok((await rueda()).i === (r.i + 1) % r.sectores.length, 'la ruedita (o LB y RB) también');

    // ============================================================ 3. mouse
    seccion('3. con el mouse');
    const kc = (await rueda()).sectores.findIndex((s) => s.categoria === 'graciosa');
    await js(`(()=>{ const li = document.querySelectorAll('#charla-opciones li')[${kc}]; li.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true })); return 1 })()`);
    r = await rueda();
    ok(r.nivel === 2 && r.cat === 'graciosa', 'clic (mousedown) en un sector abre su rueda');
    await tecla('Escape');
    // con el mouse bloqueado, moverlo apunta (la cuenta de jugador.js → capturarMirada)
    await js(`${H}.__apuntarRueda(0, -90); 1`);
    r = await rueda();
    ok(r.i === 0, `mover el mouse hacia arriba marca el sector de arriba (${r.sectores[r.i]?.titulo})`);
    await js(`${H}.__apuntarRueda(0, 200); 1`);
    r = await rueda();
    const abajo = Math.round(r.sectores.length / 2) % r.sectores.length;
    ok(Math.abs(r.i - abajo) <= 1, `y hacia abajo, el de abajo (${r.sectores[r.i]?.titulo})`);

    // ============================================================ 4. mando
    seccion('4. con el mando');
    await js(`${H}.__apuntarRueda(1, 0, true); 1`);
    r = await rueda();
    const derecha = r.sectores[r.i];
    ok(r.i > 0 && r.i < r.sectores.length / 2, `el palito a la derecha marca uno de la derecha (${derecha?.titulo})`);
    await js(`${H}.__seguirCharla(); 1`);   // (A: lo mismo que E)
    r = await rueda();
    ok(r.nivel === 2 && r.cat === derecha.categoria, `A elige (${r.cat})`);
    await tecla('Escape');

    // ============================================================ 5. una interacción de cada categoría
    seccion('5. las interacciones');
    // (compadres: lo amable no sale mal, así el abrazo de la captura es un abrazo)
    await js(`(()=>{ const v = ${P}.vecindad; v.personas['${vecina}'] = Object.assign(v.personas['${vecina}'] || {}, { p: 150, max: 2, contacto: ${P}.dia }); return 1 })()`);
    const probar = async (cat, re, nombre) => {
      let rr = await rueda();
      if (!rr.abierta) { await cerrar(); await frente(vecina); await tecla('KeyE'); await hastaRueda(); rr = await rueda(); }
      if (rr.nivel === 2) { await tecla('Escape'); rr = await rueda(); }
      const kcat = rr.sectores.findIndex((s) => s.categoria === cat);
      if (kcat < 0) return { error: `no está la categoría ${cat}` };
      await tecla(`Digit${kcat + 1}`);
      rr = await rueda();
      const k = rr.sectores.findIndex((s) => re.test(s.titulo) && s.disponible);
      if (k < 0) return { error: `no se puede ${re} (${rr.sectores.map((s) => `${s.titulo}${s.disponible ? '' : ` [${s.motivo}]`}`).join(' · ')})` };
      const vozAntes = (await js(`${H}.__ultimaVoz()`))?.n || 0;
      await js(`${H}.__elegirCharla(${k}); 1`);
      await cuadros(6);
      const est = await js(`(()=>{ const n = ${npc(vecina)}; return { anim: n.animSocial?.id || null, social: ${H}.__socialMundo().de(n), manos: ${H}.__manosSociales().gesto(), texto: document.getElementById('charla-texto').textContent, rueda: !document.getElementById('rueda').classList.contains('oculto'), voz: ${H}.__ultimaVoz() } })()`);
      est.vozNueva = (est.voz?.n || 0) > vozAntes;
      if (nombre) await captura(nombre);
      const l = await leer();
      est.vuelve = l.v.rueda.abierta || !l.v.abierta;
      return est;
    };
    for (const [cat, re, foto] of [['amistosa', /abrazo/i, '6-abrazo.png'], ['graciosa', /chiste/i, null], ['picante', /quejarse|discutir/i, null], ['amistosa', /cinco/i, null], ['juntos', /foto|ranchera|pelota/i, null]]) {
      const e = await probar(cat, re, foto);
      if (e.error) { ok(false, `${cat}: ${e.error}`); continue; }
      ok(!!e.anim && !!e.social?.burbuja && e.texto.length > 1, `${cat} · ${re.source}: anima (${e.anim}), burbuja (${e.social?.burbuja?.icono}${e.social?.emocion ? `, emoción ${e.social.emocion}` : ''}) y contesta («${e.texto.slice(0, 60)}»)`);
      ok(e.vozNueva && e.voz?.silabas >= 2, `con su voz (${JSON.stringify(e.voz)})`);
      ok(e.vuelve, 'y vuelve a la rueda');
    }
    const rel = await js(`${H}.__rueda().info?.relacion || null`);
    ok(!!rel, `la barra después: ${JSON.stringify(rel)}`);

    // ============================================================ 6. lo de siempre
    seccion('6. lo de siempre');
    await cerrar(); await frente(vecina); await tecla('KeyE'); await hastaRueda();
    v = await numero(/^Regalar y ayudar$/);
    r = await rueda();
    const kr = r.sectores.findIndex((s) => /^Regalar/.test(s.titulo));
    ok(kr >= 0, `Regalar…, en «Regalar y ayudar» (${r.sectores.map((s) => s.titulo).join(' · ')})`);
    await tecla(`Digit${kr + 1}`);
    r = await rueda();
    v = await vista();
    const ky = r.sectores.findIndex((s) => /yerba/i.test(s.titulo));
    ok(r.tipo === 'lista' && v.texto === '¿Qué le regalás?' && ky >= 0 && /Mejor no/.test(r.sectores[r.sectores.length - 1].titulo), `la rueda del regalo (${r.sectores.map((s) => s.titulo).join(' · ')})`);
    const yerba0 = await js(`${P}.cosas.yerba`);
    await tecla(`Digit${ky + 1}`);
    const lr = await leer();
    ok((await js(`${P}.cosas.yerba`)) === yerba0 - 1 && lr.renglones.length >= 1, `regalar yerba anda (${lr.renglones.join(' / ').slice(0, 90)})`);
    // los temas de siempre: «¿Cómo andás?»
    v = await vista();
    if (!v.rueda.abierta) { await cerrar(); await frente(vecina); await tecla('KeyE'); await hastaRueda(); }
    if ((await rueda()).nivel === 2) await tecla('Escape');
    await numero(/^Charlar$/);
    v = await numero(/Cómo andás/);
    const tema = await leer();
    ok(tema.renglones.length >= 1 && tema.v.rueda.abierta && tema.v.rueda.sectores[tema.v.rueda.i]?.titulo.match(/chau/i), `«¿Cómo andás?» y vuelve con la marca en «chau», como antes (${tema.renglones.join(' / ').slice(0, 80)})`);
    await tecla('KeyE');
    v = await vista();
    ok(!v.rueda.abierta && /despedirte/.test(v.seguir), 'E de seguido: chau');
    await cerrar();
    // el servicio del poblador: primera opción, marcada
    const conServicio = ['carpintero', 'panadera', 'herrero', 'tejedora'].find((k) => presentes.includes(k) && k !== vecina) || null;
    if (conServicio) {
      await poner(conServicio, x0 - 6, z0, 0);
      await frente(conServicio);
      await tecla('KeyE');
      v = await hastaRueda();
      r = v.rueda;
      const marcada = r.sectores[r.i];
      const cs = r.categorias?.find((c) => c.id === marcada?.categoria);
      ok(!!cs && /¿Qué tenés para hoy\?/.test(cs.opciones[0] || ''), `${conServicio}: la marca en «${marcada?.titulo}», con su servicio primero (${cs?.opciones.join(' · ')})`);
      await tecla('KeyE');
      r = await rueda();
      ok(r.nivel === 2 && /¿Qué tenés para hoy\?/.test(r.sectores[r.i]?.titulo), 'E, E: el servicio, como antes');
      await tecla('KeyE');
      v = await vista();
      ok(v.abierta && !v.rueda.abierta && v.texto.length > 5, `y lo cuenta (${v.texto.slice(0, 70)})`);
      await cerrar();
    }

    // ============================================================ 7. entre vecinos
    seccion('7. entre vecinos');
    const otros = adultos.filter((k) => k !== vecina && k !== conServicio).slice(0, 6);
    for (let i = 0; i < otros.length; i++) await poner(otros[i], plaza.x - 2 + (i % 2) * 1.6, plaza.z + 4 + Math.floor(i / 2) * 3.2, i % 2 ? -Math.PI / 2 : Math.PI / 2);
    await js(`(()=>{ const j = ${H}.jugador; j.ubicar(${plaza.x} + 6, ${plaza.z} + 7, Math.atan2(6, 0) ); j.estado.yaw = Math.PI / 2 - 0.15; j.estado.pitch = -0.1; return 1 })()`);
    await asentar();
    const e7 = await js(`(()=>{ const s = ${H}.__social(); const n = (k) => ${H}.gente.gente.find((g) => g.claveAldea === k); const ks = ${JSON.stringify(otros)}; const r = [];
      for (let i = 0; i + 1 < ks.length; i += 2) { const x = s.hacerEntre(n(ks[i]), n(ks[i + 1])); r.push(x ? x.id : null); }
      return { ids: r, anims: ks.map((k) => n(k).animSocial?.id || null), burbujas: ks.map((k) => ${H}.__socialMundo().de(n(k))) } })()`);
    ok(e7.ids.filter(Boolean).length >= 2 && e7.anims.filter(Boolean).length >= 4, `se cruzan y hacen algo (${e7.ids.join(', ')}; ${e7.anims.join(', ')})`);
    ok(e7.burbujas.filter((b) => b?.burbuja || b?.emocion).length >= 2, `con burbujas y emociones (${JSON.stringify(e7.burbujas.filter(Boolean)).slice(0, 200)})`);
    await cuadros(8);
    await captura('3-entre-vecinos.png');
    const dib = await js(`${H}.__socialMundo().estado()`);
    ok(dib.dibujadas >= 4, `las burbujas, en un solo dibujo (${dib.dibujadas} cuadraditos; renglones: ${dib.renglones.join(' | ')})`);

    // ============================================================ 8. la iniciativa
    seccion('8. la iniciativa');
    const quien = otros[0];
    // (todos libres: sin lo que estaban haciendo ni a dónde iban; y lo de hoy de la vida social, de nuevo)
    const libres = () => js(`(()=>{ for (const n of ${H}.gente.gente) if (n.claveAldea) { n.animSocial = null; n.camino = []; n.pose = null; n.vel = 0; n.__iniciativa = false; } return 1 })()`);
    await js(`(()=>{ ${P}.vecindad.social = null; ${P}.horas = 11; ${H}.ajustes.ritmoAldea = 'animado'; return 1 })()`);
    let ini = null;
    for (let s = 0; s < 60 && !ini; s++) { await libres(); await js(`${H}.__social().forzarIniciativa(); 1`); ini = await js(`${H}.__social().pendiente()`); }
    ok(!!ini, `alguien te quiere decir algo (${JSON.stringify(ini)})`);
    if (ini) {
      await js(`(()=>{ const n = ${npc(ini.clave)} || ${H}.gente.gente.find((g) => g.claveAldea === '${ini.clave}'); const j = ${H}.jugador; j.ubicar(n.pos.x, n.pos.z + 1.7, 0); j.estado.pitch = -0.08; return 1 })()`);
      await asentar(5);
      av = await js(`${H}.__aviso()`);
      ok(/te quiere decir algo/.test(JSON.stringify(av)), `el aviso: ${JSON.stringify(av)}`);
      await tecla('KeyE');
      v = await vista();
      ok(v.abierta && !v.rueda.abierta && v.texto.length > 4, `E: primero lo que te quería decir («${v.texto.slice(0, 70)}»)`);
      v = await hastaRueda();
      ok(v.rueda.abierta, 'y después, la rueda');
      await cerrar();
    }

    // ============================================================ 9. el costo
    seccion('9. el costo: 20 o más en la plaza charlando entre ellas');
    // todos los de la aldea, despiertos y armados, en ronda en la plaza (de dos en dos, mirándose)
    // (en la aldea, a esta hora, están los que están: para llegar a 26 se suman unos de afuera, con su figura)
    await js(`(()=>{ const H = ${H}, ya = new Set(H.gente.gente.filter((g) => g.claveAldea).map((g) => g.claveAldea));
      const faltan = ["jefe","nelida","abuela","padre","madre","galesa","ercilia","carpintero","panadera","herrero","pescador","maestra","enfermera","telegrafista","tejedora","apicultor","guardaparque","musico","veterinaria","herbolaria","modista","botera","pintora","andinista","fotografa","ceramista","astronoma"].filter((k) => !ya.has(k));
      const cuantos = Math.max(0, 26 - H.gente.gente.filter((g) => !g.aBordo && g.g).length);
      for (const k of faltan.slice(0, cuantos)) { const n = H.gente.agregarPoblador({ clave: 'aldea-' + k, nombre: k, oficio: '', pos: { x: ${plaza.x}, z: ${plaza.z} - 30 }, colores: {} }); n.claveAldea = k; n.camino = []; }
      return 1 })()`);
    const medir = (social) => js(`(()=>{ const H = ${H}; const s = H.__social(), sm = H.__socialMundo();
      const lista = H.gente.gente.filter((g) => !g.aBordo && g.g && !g.enBase).slice(0, 26);
      lista.forEach((n, i) => { const par = Math.floor(i / 2), a = (par / Math.ceil(lista.length / 2)) * Math.PI * 2, r = 6, lado = i % 2 ? 0.6 : -0.6;
        const x = ${plaza.x} + Math.cos(a) * r + Math.sin(a) * lado, z = ${plaza.z} + Math.sin(a) * r - Math.cos(a) * lado;
        n.pos.set(x, H.T.altura(x, z), z); n.camino = []; n.ruta = null; n.pose = null; n.vel = 0; n.dormido = false; n.soloCerca = 0; n.g.visible = true; if (!${social}) { n.animSocial = null; } });
      H.jugador.ubicar(${plaza.x}, ${plaza.z} + 13, 0); H.jugador.estado.pitch = -0.15;
      const charlar = () => { for (let i = 0; i + 1 < lista.length; i += 2) s.hacerEntre(lista[i], lista[i + 1]); };
      if (${social}) charlar(); else { for (const n of lista) sm.quitar(n); }
      for (let i = 0; i < 10; i++) H.__bucle();
      const r = H.renderer.info.render; const t = [], ts = []; let llamadas = 0;
      const act = sm.actualizar; let enSocial = 0;
      sm.actualizar = (...x) => { const t0 = performance.now(); const v = act(...x); enSocial += performance.now() - t0; return v; };
      for (let i = 0; i < 90; i++) { const e0 = enSocial, t0 = performance.now(); H.__bucle(); t.push(performance.now() - t0); ts.push(enSocial - e0); llamadas += r.calls; if (${social} && i % 30 === 29) charlar(); }
      sm.actualizar = act;
      t.sort((a, b) => a - b); ts.sort((a, b) => a - b);
      const animados = lista.filter((n) => n.animSocial).length;
      return { personas: lista.length, animados, ms: +(t.slice(10, 80).reduce((a, b) => a + b, 0) / 70).toFixed(2), msSocial: +(ts.slice(10, 80).reduce((a, b) => a + b, 0) / 70).toFixed(3), dibujos: Math.round(llamadas / 90), burbujas: sm.estado().dibujadas, mallaBurbujas: sm.malla.visible } })()`);
    const rondas = [];
    for (let k = 0; k < 3; k++) { rondas.push(['sin', await medir(false)]); rondas.push(['con', await medir(true)]); }
    for (const [q, m] of rondas) console.log(`  ${q}: ${JSON.stringify(m)}`);
    const med = (q, c) => { const l = rondas.filter((x) => x[0] === q).map((x) => x[1][c]).sort((a, b) => a - b); return l[1]; };
    const conM = rondas.find((x) => x[0] === 'con')[1];
    ok(conM.personas >= 20 && conM.animados >= 10, `${conM.personas} personas en la plaza, ${conM.animados} haciendo algo entre ellas`);
    ok(med('con', 'msSocial') <= 0.5, `las burbujas y los renglones: ${med('con', 'msSocial')} ms por cuadro (tope 0,5 ms)`);
    console.log(`  el cuadro entero (mediana de 3, ventana a la vista, con ruido): sin ${med('sin', 'ms')} ms · con ${med('con', 'ms')} ms; dibujos: sin ${med('sin', 'dibujos')} · con ${med('con', 'dibujos')}`);
    ok(conM.mallaBurbujas && conM.burbujas > 4, `todas las burbujas y emociones: un solo dibujo (${conM.burbujas} cuadraditos)`);
    await captura('4-plaza-emociones.png');
  } catch (e) {
    ok(false, `la prueba se cortó en «${donde}»: ${e.message}`);
  }
  if (errores.length) { console.log(`\n${errores.length} problema(s):`); for (const e of errores) console.log(`  · ${e}`); }
  console.log(errores.length ? '\nHUMO 3.7.4 (rueda): FALLÓ' : '\nHUMO 3.7.4 (rueda): OK');
  app.exit(errores.length ? 1 : 0);
});
