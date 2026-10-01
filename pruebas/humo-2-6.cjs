// Partida real 2.6 (Electron + WebGL): el fortín del Desafío. Cada pieza se arma en su
// propio claro y se la pone a trabajar contra invasores de verdad: troneras, catapulta,
// troncos colgantes, cerco de cristal, puente levadizo, espejo del faro, señuelo, lazo,
// abrojos, embudo, tejado de lajas, pasarela, rampa, armero, contrafuerte y resina.
// Uso: npx electron pruebas/humo-2-6.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
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
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
  };
  const simular = (seg, noche = 1) => js(`(()=>{ const H = window.__hojarasca; for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) H.desafio.actualizar(0.05, { noche: ${noche}, dtReal: 0.05 }); return 1 })()`);
  // Un claro para cada pieza: se va corriendo a lo largo de una línea
  let claro = 0;
  const irAlClaro = () => js(`(()=>{ const H = window.__hojarasca, r = H.T.lugares.refugio, j = H.jugador.estado;
    for (let k = 0; k < 40; k++) {
      const x = r.x + 70 + ((${claro} + k) % 8) * 26, z = r.z + 70 + Math.floor(((${claro} + k)) / 8) * 26;
      if (H.T.agua(x, z)) continue;
      j.pos.set(x, H.T.altura(x, z) + 0.05, z); j.yaw = 0; j.pitch = 0; return k;
    } return -1 })()`).then((k) => { claro += (k >= 0 ? k : 0) + 1; return k; });
  // Arma la pieza (terminada) cerca de (dx, dz) del jugador, probando alrededor si no se puede
  const poner = (id, dx = 0, dz = -5, yaw = null) => js(`(()=>{ const H = window.__hojarasca, O = H.obras, P = H.progreso, j = H.jugador.estado;
    Object.assign(P.materiales, { tronco: 200, tabla: 200, piedra: 200, cristal: 200 });
    const p = H.PLANOS.find(q => q.id === '${id}'); if (!p) return { error: 'no hay plano ${id}' };
    for (const r of [0, 1.5, 3, 4.5, 6]) for (let k = 0; k < 8; k++) {
      O.elegir(p);
      const a = k * Math.PI / 4, x = j.pos.x + (${dx}) + Math.cos(a) * r, z = j.pos.z + (${dz}) + Math.sin(a) * r;
      const f = O.fundar(x, z, ${yaw === null ? 'j.yaw' : yaw}, j.pos.y);
      if (!f.ok) { if (r === 0 && k === 0) var motivo = f.motivo; continue; }
      for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { const q = O.avanzar(f.obra, P.materiales); if (!q.ok) break; }
      O.elegir(null); P.obras = O.obras.map(o => o.datos);
      H.desafio.fortin.refrescar();
      return { ok: true, i: O.obras.indexOf(f.obra), x: f.obra.datos.x, z: f.obra.datos.z, y: f.obra.datos.y, rot: f.obra.datos.rot };
    }
    O.elegir(null); return { error: 'no hubo lugar: ' + motivo } })()`);
  const obra = (i) => `window.__hojarasca.obras.obras[${i}]`;
  // un invasor en (x, z), con mucha vida; quieto si se pide
  const invasor = (tipo, x, z, quieto = true, vida = 900) => js(`(()=>{ const H = window.__hojarasca, a = H.desafio.invocar('${tipo}', (${x}), (${z})); if (!a) return -1;
    a.vida = a.vidaMax = (${vida}); if (${quieto}) a.dudaT = 999; return H.desafio.aliens.indexOf(a) })()`);
  const alien = (i) => `window.__hojarasca.desafio.aliens[${i}]`;
  const herido = (i) => js(`${alien(i)}.vidaMax - ${alien(i)}.vida`);
  const limpiar = () => js(`(()=>{ const H = window.__hojarasca; for (const a of H.desafio.aliens) { a.estado = 'irse'; a.t = 9; } H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); return 1 })()`);
  const usarE = (x, z) => js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado; j.pos.set((${x}), H.T.altura((${x}), (${z})) + 0.05, (${z})); return { aviso: H.desafio.avisoCercaDe(j.pos), hizo: H.desafio.usarCercaDe(j.pos) } })()`);

  try {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await abrir(); await entrar();
    ok(await js('!!window.__hojarasca?.desafio?.fortin'), 'carga el Desafío con el fortín');
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.horas = 12; P.cosas.arco = 1; P.desafio.flechas = 20; return 1 })()`);
    const ids = await js(`window.__hojarasca.PLANOS.filter(p => p.categoria === 'defensa').map(p => p.id)`);
    const nuevas = ['muro-tronera', 'catapulta', 'troncos-colgantes', 'cerco-cristal', 'puente-levadizo', 'espejo-faro', 'senuelo', 'trampa-lazo', 'abrojos', 'embudo', 'tejado-lajas', 'puesto-tirador', 'pasarela-colgante', 'rampa-troncos', 'armero', 'contrafuerte'];
    ok(nuevas.every((id) => ids.includes(id)), `las 16 piezas están en los planos (faltan: ${nuevas.filter((id) => !ids.includes(id)).join(', ') || 'ninguna'})`);

    seccion('1. troneras');
    await irAlClaro();
    const tr = await poner('muro-tronera', 0, -4);
    ok(tr.ok, `se arma la pirca con troneras (${JSON.stringify(tr)})`);
    const pasa = await js(`(()=>{ const H = window.__hojarasca, o = ${obra(tr.i)}, D = H.desafio, b = o.datos.y;
      const s = { x: o.datos.x + Math.cos(o.datos.rot) * 0.75, z: o.datos.z - Math.sin(o.datos.rot) * 0.75 };
      return { propioRanura: !D.obraEnPunto(s.x, b + 1.35, s.z, -0.02, null, true), ajenoRanura: !!D.obraEnPunto(s.x, b + 1.35, s.z, -0.02, null, false), propioBajo: !!D.obraEnPunto(s.x, b + 0.5, s.z, -0.02, null, true) } })()`);
    ok(pasa.propioRanura && pasa.ajenoRanura && pasa.propioBajo, `tus tiros pasan por la aspillera; los de ellos no, ni los tuyos por abajo (${JSON.stringify(pasa)})`);

    seccion('2. catapulta');
    await irAlClaro();
    const ca = await poner('catapulta', 0, 0);
    ok(ca.ok, `se arma la catapulta (${JSON.stringify(ca)})`);
    await js(`(()=>{ ${obra(ca.i)}.datos.piedras = 5; return 1 })()`);
    const grupo = [];
    for (const [dx, dz] of [[0, 0], [1.5, 0.5], [-1.2, 1], [0.5, -1.4]]) grupo.push(await invasor('rastreador', ca.x + 22 + dx, ca.z + 5 + dz));
    await simular(9);
    const piedras = await js(`${obra(ca.i)}.datos.piedras`);
    const danos = [];
    for (const i of grupo) danos.push(await herido(i));
    ok(piedras <= 4 && danos.filter((d) => d > 10).length >= 2, `tira al grupo y lastima a varios (piedras ${piedras}, daño ${danos.map((d) => Math.round(d)).join('/')})`);
    await limpiar();

    seccion('3. troncos colgantes');
    await irAlClaro();
    const tc = await poner('troncos-colgantes', 0, -6);
    ok(tc.ok, `se arman los troncos colgantes (${JSON.stringify(tc)})`);
    const vt = await invasor('rastreador', tc.x + 0.3, tc.z);
    await simular(0.6);
    const tronco = await js(`({ dano: ${alien(vt)}.vidaMax - ${alien(vt)}.vida, armada: ${obra(tc.i)}.datos.armada })`);
    ok(tronco.dano >= 80 && tronco.armada === false, `al pasar por abajo, el tronco lo golpea (${JSON.stringify(tronco)})`);
    await limpiar();
    const re = await usarE(tc.x + 1.4, tc.z);
    ok(/colgar/.test(re.aviso || '') && (await js(`${obra(tc.i)}.datos.armada`)) === true, `E lo vuelve a colgar («${re.aviso}»)`);

    seccion('4. cerco de cristal');
    await irAlClaro();
    const cc = await poner('cerco-cristal', 0, -5);
    ok(cc.ok, `se arma el cerco de cristal (${JSON.stringify(cc)})`);
    await js(`window.__hojarasca.desafio.fortin.alEmpezarNoche(); 1`);
    const vc = await invasor('rastreador', cc.x, cc.z);
    await simular(2);
    ok((await herido(vc)) >= 20 && (await js(`${obra(cc.i)}.datos.cargado`)), `cargado con un cristal, da descargas al que lo toca (${Math.round(await herido(vc))})`);
    await limpiar();

    seccion('5. puente levadizo');
    await irAlClaro();
    const pu = await poner('puente-levadizo', 0, -5);
    ok(pu.ok, `se arma el puente (${JSON.stringify(pu)})`);
    await simular(0.2, 0);
    const subido = await js(`(()=>{ const H = window.__hojarasca, o = ${obra(pu.i)}; return { abierta: H.desafio.fortin.obraAbierta(o), plats: H.col.plataformas.filter(p => p.duenio?.puente === o).length } })()`);
    const bajar = await usarE(pu.x, pu.z - 1.4);
    await simular(1, 0);
    const bajado = await js(`(()=>{ const H = window.__hojarasca, o = ${obra(pu.i)}; return { abierta: H.desafio.fortin.obraAbierta(o), plats: H.col.plataformas.filter(p => p.duenio?.puente === o).length } })()`);
    ok(!subido.abierta && subido.plats === 0 && /Bajar/.test(bajar.aviso || '') && bajado.abierta && bajado.plats === 1, `E lo baja: se camina y los invasores pasan (${JSON.stringify({ subido, bajado })})`);
    const pu2 = await poner('puente-levadizo', 0, 6);
    await simular(0.2, 0);
    const conPared = pu2.ok ? await js(`(()=>{ const H = window.__hojarasca, o = ${obra(pu2.i)}; let n = 0; for (const dx of [-8, 0, 8]) for (const dz of [-8, 0, 8]) n += H.col.cercanos(o.datos.x + dx, o.datos.z + dz).filter(c => c.duenio?.puente === o).length; return n })()`) : -1;
    const roto = pu2.ok ? await js(`(()=>{ const H = window.__hojarasca, o = ${obra(pu2.i)}; window.__puenteRoto = o; H.obras.destruir(o); for (let i = 0; i < 30; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      let n = 0; for (const dx of [-8, 0, 8]) for (const dz of [-8, 0, 8]) n += H.col.cercanos(o.datos.x + dx, o.datos.z + dz).filter(c => c.duenio?.puente === o).length; return n })()`) : -1;
    ok(conPared > 0 && roto === 0, `el puente roto no deja una pared invisible (${conPared} → ${roto})`);

    seccion('6. espejo del faro');
    await irAlClaro();
    const es = await poner('espejo-faro', 0, -3);
    const an = es.ok ? await poner('antorcha', 2.5, -3) : { error: 'sin espejo' };
    ok(es.ok && an.ok, `se arman el espejo y una antorcha al lado (${JSON.stringify([es, an])})`);
    const ve = await invasor('tirador', es.x + Math.sin(es.rot) * 14, es.z + Math.cos(es.rot) * 14);
    const encandilado = await js(`(()=>{ const H = window.__hojarasca, a = ${alien(ve)}; let visto = 0;
      for (let i = 0; i < 300; i++) { H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); if (a.encandilado > 0) visto++; } return visto })()`);
    ok(encandilado > 5, `el haz barre y lo encandila (${encandilado} cuadros)`);
    await limpiar();

    seccion('7. señuelo');
    await irAlClaro();
    const se = await poner('senuelo', 0, -12);
    ok(se.ok, `se arma el señuelo (${JSON.stringify(se)})`);
    const vs = await invasor('rastreador', se.x + 14, se.z - 6, false, 600);
    await js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado; j.pos.set(j.pos.x - 30, H.T.altura(j.pos.x - 30, j.pos.z) + 0.05, j.pos.z); return 1 })()`);
    const antes = await js(`Math.hypot(${alien(vs)}.m.g.position.x - (${se.x}), ${alien(vs)}.m.g.position.z - (${se.z}))`);
    await simular(4);
    const sen = await js(`({ d: Math.hypot(${alien(vs)}.m.g.position.x - (${se.x}), ${alien(vs)}.m.g.position.z - (${se.z})), rompe: ${alien(vs)}.obra === ${obra(se.i)} })`);
    ok(sen.d < antes - 5 || sen.rompe, `con vos lejos, va por el señuelo (${antes.toFixed(1)} → ${sen.d.toFixed(1)} m${sen.rompe ? ', lo ataca' : ''})`);
    await limpiar();

    seccion('8. trampa de lazo');
    await irAlClaro();
    const la = await poner('trampa-lazo', 0, -5);
    ok(la.ok, `se arma el lazo (${JSON.stringify(la)})`);
    const vl = await invasor('rastreador', la.x + 0.2, la.z, false);
    await simular(0.3);
    const colg = await js(`({ colgado: ${alien(vl)}.colgadoT, armada: ${obra(la.i)}.datos.armada, alto: ${alien(vl)}.m.g.position.y - window.__hojarasca.T.altura(${alien(vl)}.m.g.position.x, ${alien(vl)}.m.g.position.z) })`);
    ok(colg.colgado > 0 && colg.armada === false && colg.alto > 0.5, `lo deja colgado (${JSON.stringify(colg)})`);
    // colgado recibe más: el mismo golpe, suelto y colgado
    const extra = await js(`(()=>{ const F = window.__hojarasca.desafio.fortin; return { colgado: F.multiplicadorDano(${alien(vl)}), suelto: F.multiplicadorDano({ colgadoT: 0 }) } })()`);
    ok(extra.colgado > extra.suelto, `colgado recibe más (${JSON.stringify(extra)})`);
    const tapa = await js(`(()=>{ const H = window.__hojarasca, p = ${alien(vl)}.m.g.position; const o = H.desafio.obraEnPunto(p.x, p.y + 0.8, p.z, -0.02, null, true); return o ? o.plano.id : null })()`);
    ok(tapa === null, `el lazo no es una caja: tus flechas llegan al colgado (${tapa})`);
    await limpiar();

    seccion('9. abrojos');
    await irAlClaro();
    const ab = await poner('abrojos', 0, -6);
    ok(ab.ok, `se riegan los abrojos (${JSON.stringify(ab)})`);
    const va = await invasor('rastreador', ab.x, ab.z);
    await simular(2);
    ok((await herido(va)) >= 10, `el que está encima se lastima (${Math.round(await herido(va))})`);
    await limpiar();
    const cr0 = await js(`window.__hojarasca.progreso.materiales.cristal`);
    const junta = await usarE(ab.x + 1.8, ab.z);
    const cr1 = await js(`window.__hojarasca.progreso.materiales.cristal`);
    ok(/Juntar/.test(junta.aviso || '') && cr1 === cr0 + 1, `de día, E los junta y devuelve lo que costaron («${junta.aviso}»)`);

    seccion('10. embudo');
    await irAlClaro();
    const em = await poner('embudo', 0, -8);
    ok(em.ok, `se arma el embudo (${JSON.stringify(em)})`);
    // un invasor delante de la boca, corrido hacia un ala; vos del otro lado del embudo
    const aMundo = (lx, lz) => `({ x: ${em.x} + (${lx}) * Math.cos(${em.rot}) + (${lz}) * Math.sin(${em.rot}), z: ${em.z} - (${lx}) * Math.sin(${em.rot}) + (${lz}) * Math.cos(${em.rot}) })`;
    const fuera = await js(aMundo(2.2, 7)), atras = await js(aMundo(0, -8));
    const ve2 = await invasor('rastreador', fuera.x, fuera.z, false, 600);
    await js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado; j.pos.set(${atras.x}, H.T.altura(${atras.x}, ${atras.z}) + 0.05, ${atras.z}); return 1 })()`);
    await simular(2.5);
    const emb = await js(`(()=>{ const o = ${obra(em.i)}, p = ${alien(ve2)}.m.g.position, r = o.datos.rot, dx = p.x - o.datos.x, dz = p.z - o.datos.z; return { lx: dx * Math.cos(r) - dz * Math.sin(r), lz: dx * Math.sin(r) + dz * Math.cos(r) } })()`);
    ok(Math.abs(emb.lx) < 1.6 && emb.lz < 6, `lo encauza hacia la garganta (local ${emb.lx.toFixed(1)}, ${emb.lz.toFixed(1)})`);
    await limpiar();

    seccion('11. tejado de lajas');
    await irAlClaro();
    const te = await poner('tejado-lajas', 0, -5);
    const an2 = te.ok ? await js(`(()=>{ const H = window.__hojarasca, O = H.obras, P = H.progreso, t = ${obra(te.i)};
      const p = H.PLANOS.find(q => q.id === 'antorcha'); O.elegir(p); const f = O.fundar(t.datos.x + 0.4, t.datos.z + 0.4, 0, t.datos.y);
      if (!f.ok) { O.elegir(null); return { error: f.motivo }; }
      while (f.obra.datos.etapas < f.obra.plano.etapas.length) O.avanzar(f.obra, P.materiales); O.elegir(null); H.desafio.defensas.refrescar(); H.desafio.fortin.refrescar();
      return { ok: true, i: O.obras.indexOf(f.obra) } })()`) : { error: 'sin tejado' };
    ok(te.ok && an2.ok, `el tejado y una antorcha abajo (${JSON.stringify([te, an2])})`);
    const prot = await js(`(()=>{ const H = window.__hojarasca, F = H.desafio.fortin, t = ${obra(te.i)}; return { antorcha: F.antorchaProtegida(${obra(an2.i)}), vos: F.bajoTejado({ x: t.datos.x, z: t.datos.z, y: t.datos.y }), afuera: F.bajoTejado({ x: t.datos.x + 5, z: t.datos.z, y: t.datos.y }) } })()`);
    ok(prot.antorcha && prot.vos && !prot.afuera, `protege la antorcha y al que está abajo (${JSON.stringify(prot)})`);
    const bajo = await js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado, t = ${obra(te.i)}, d = H.progreso.desafio;
      j.pos.set(t.datos.x - 0.6, (t.datos.y ?? H.T.altura(t.datos.x, t.datos.z)) + 0.05, t.datos.z - 0.6); d.salud = 100;
      // llega por el lado opuesto a la antorcha (si no, va primero por ella)
      const a = H.desafio.invocar('rastreador', t.datos.x - 2.8, t.datos.z - 0.6); a.vida = a.vidaMax = 900;
      const vida0 = t.datos.vida;
      for (let i = 0; i < 100; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      return { salud: d.salud, rompe: a.obra === t, tejado: t.datos.vida === vida0 } })()`);
    ok(bajo.salud < 100 && !bajo.rompe && bajo.tejado, `bajo el tejado no sos inmune: te pegan sin romperlo (${JSON.stringify(bajo)})`);
    await limpiar();
    await js(`(()=>{ window.__hojarasca.progreso.desafio.salud = 100; return 1 })()`);

    seccion('12. pasarela colgante');
    await irAlClaro();
    const pa = await poner('pasarela-colgante', 0, -6);
    const plat = pa.ok ? await js(`(()=>{ const H = window.__hojarasca, o = ${obra(pa.i)}; const p = H.col.plataformas.filter(q => q.duenio === o); return p.map(q => +(q.alto - o.datos.y).toFixed(2)) })()`) : [];
    ok(pa.ok && plat.includes(2.05), `se arma y se camina a 2 m (${JSON.stringify(plat)})`);

    seccion('13. rampa de troncos');
    await irAlClaro();
    const ra = await poner('rampa-troncos', 0, -4);
    ok(ra.ok, `se arma la rampa (${JSON.stringify(ra)})`);
    await js(`(()=>{ window.__hojarasca.progreso.materiales.tronco = 10; return 1 })()`);
    const cargar = await usarE(ra.x + 1.2, ra.z);
    const cargados = await js(`${obra(ra.i)}.datos.troncos`);
    const delante = await js(`({ x: ${ra.x} + Math.sin(${ra.rot}) * 8, z: ${ra.z} + Math.cos(${ra.rot}) * 8 })`);
    const vr = await invasor('rastreador', delante.x, delante.z);
    const soltar = await usarE(ra.x + 1.2, ra.z);
    await simular(2.5);
    const rodo = await herido(vr);
    ok(cargados === 3 && /Soltar/.test(soltar.aviso || '') && rodo >= 50, `E carga tres troncos y E los suelta: aplastan (${JSON.stringify({ cargar: cargar.aviso, cargados, dano: Math.round(rodo) })})`);
    await limpiar();

    seccion('14. armero');
    await irAlClaro();
    const ar = await poner('armero', 0, -4);
    ok(ar.ok, `se arma el armero (${JSON.stringify(ar)})`);
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.desafio.flechas = 0; P.materiales.tabla = 20; P.materiales.piedra = 20; return 1 })()`);
    const arm = await usarE(ar.x + 1.2, ar.z);
    const fl = await js(`window.__hojarasca.progreso.desafio.flechas`);
    const banco = await js(`(()=>{ const H = window.__hojarasca; return H.obras.tieneFuncionCerca('armero', H.jugador.estado.pos, 5.2) ? 1 : 0 })()`);
    ok(/munición/.test(arm.aviso || '') && fl === 24 && banco === 1, `E rehace las flechas hasta 24, y al lado es como un banco (${JSON.stringify({ aviso: arm.aviso, fl })})`);

    seccion('15. contrafuerte');
    await irAlClaro();
    const pz = await poner('empalizada', 0, -5);
    const cf = pz.ok ? await poner('contrafuerte', 0, -3.6) : { error: 'sin empalizada' };
    const apunt = cf.ok ? await js(`(()=>{ const F = window.__hojarasca.desafio.fortin, o = ${obra(pz.i)}; return { factor: F.factorDanoObra(o), excavador: F.frenaExcavador(o) } })()`) : {};
    ok(pz.ok && cf.ok && Math.abs(apunt.factor - 0.7) < 1e-6 && apunt.excavador, `apuntala la empalizada: aguanta más y el excavador no pasa (${JSON.stringify(apunt)})`);

    seccion('16. resina hirviendo en el adarve');
    await irAlClaro();
    const ad = await poner('adarve', 0, -5);
    ok(ad.ok, `se arma el adarve (${JSON.stringify(ad)})`);
    await js(`(()=>{ window.__hojarasca.progreso.materiales.tronco = 5; return 1 })()`);
    const cargaR = await usarE(ad.x + 1.0, ad.z);
    const vres = await invasor('rastreador', ad.x - 1.5, ad.z + 1.5);
    await simular(0.2, 1);
    const volcar = await usarE(ad.x + 1.0, ad.z);
    const res = await js(`({ dano: ${alien(vres)}.vidaMax - ${alien(vres)}.vida, arde: ${alien(vres)}.fuegoT, quedan: ${obra(ad.i)}.datos.resina })`);
    ok(/Cargar resina/.test(cargaR.aviso || '') && /Volcar/.test(volcar.aviso || '') && res.dano >= 50 && res.arde > 0 && res.quedan === 1, `de día se carga, de noche se vuelca y quema (${JSON.stringify({ cargar: cargaR.aviso, volcar: volcar.aviso, ...res })})`);
    await limpiar();

    seccion('17. se guarda');
    await js(`(()=>{ const H = window.__hojarasca; H.progreso.obras = H.obras.obras.map(o => o.datos); H.guardar(); return 1 })()`);
    const guardado = await js(`(()=>{ const p = JSON.parse(localStorage.getItem('hojarasca-desafio-v1')); const f = (id) => p.obras.find(o => o.plano === id) || {};
      return { puente: f('puente-levadizo').bajado, piedras: f('catapulta').piedras, resina: f('adarve').resina, n: p.obras.length } })()`);
    await abrir(); await entrar();
    const vuelto = await js(`(()=>{ const H = window.__hojarasca; const f = (id) => H.obras.obras.find(o => o.plano.id === id)?.datos || {};
      H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      return { puente: f('puente-levadizo').bajado, piedras: f('catapulta').piedras, resina: f('adarve').resina, n: H.obras.obras.length, abierto: H.desafio.fortin.obraAbierta(H.obras.obras.find(o => o.plano.id === 'puente-levadizo')) } })()`);
    ok(guardado.puente === true && vuelto.puente === true && vuelto.piedras === guardado.piedras && vuelto.resina === 1 && vuelto.n === guardado.n && vuelto.abierto,
      `el fortín vuelve igual al abrir (${JSON.stringify({ guardado, vuelto })})`);
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});
