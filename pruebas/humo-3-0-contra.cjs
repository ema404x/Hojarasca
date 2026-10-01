// Partida real 3.0 (Electron + WebGL): el contraataque de día y los invasores que evolucionan.
//   1. al amanecer aparece un puesto; al acercarte queda en el mapa y aparecen sus guardias
//      dormidos; la vaina se quema con E (la tecla de verdad), la aguja se rompe a flechazos
//      y a hachazos; roto, deja cristales y la noche siguiente vienen menos y más flojos;
//      uno en pie manda los suyos.
//   2. se queman invasores varias noches: aparece la resistencia al fuego (aviso al
//      atardecer, placas, el fuego les entra menos), y después se olvida.
//   3. todo sobrevive a cerrar y volver a abrir.
// Uso: npx electron pruebas/humo-3-0-contra.cjs --user-data-dir=<carpeta propia>
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
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{code:'${code}',bubbles:true})); 1`);
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`window.__hojarasca.ajustes.limiteFps = 'libre'; 1`);
  };
  const simular = (seg, noche = 1) => js(`(()=>{ const H = window.__hojarasca; for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) H.desafio.actualizar(0.05, { noche: ${noche}, dtReal: 0.05 }); return 1 })()`);
  const cuadros = (n = 2) => js(`(async ()=>{ const H = window.__hojarasca; for (let i = 0; i < ${n}; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 20)); } return 1 })()`);
  const D = (expr) => js(`(()=>{ const d = window.__hojarasca.progreso.desafio; return ${expr} })()`);
  // el jugador en un punto, mirando hacia (hx, hz)
  const pararEn = (x, z, hx = null, hz = null) => js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado;
    j.pos.set((${x}), H.T.altura((${x}), (${z})) + 0.05, (${z})); j.vel.set(0, 0, 0);
    if (${hx !== null}) { j.yaw = Math.atan2(j.pos.x - (${hx ?? 0}), j.pos.z - (${hz ?? 0})); } j.pitch = 0; return 1 })()`);
  const limpiarAliens = () => js(`(()=>{ const H = window.__hojarasca; for (const a of H.desafio.aliens) { a.estado = 'irse'; a.t = 9; } H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); return H.desafio.aliens.length })()`);
  // una noche entera: el aviso del atardecer, la nave, y el amanecer
  const atardecer = () => js(`(()=>{ const H = window.__hojarasca, P = H.progreso, d = P.desafio;
    d.especialAnterior = 'roja'; d.capullos = []; d.salud = 100; P.horas = 19.8; H.desafio.actualizar(0.05, { noche: 0.5, dtReal: 0.05 }); return 1 })()`);
  const anochecer = () => js(`(()=>{ const H = window.__hojarasca, P = H.progreso, d = P.desafio;
    d.capullos = []; P.horas = 21; H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); return { oleadas: d.oleadas, vivos: d.vivos } })()`);
  const amanecer = () => js(`(()=>{ const H = window.__hojarasca, P = H.progreso, d = P.desafio;
    P.horas = 6.5; P.dia += 1; H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); d.salud = 100;
    for (const a of H.desafio.aliens) { a.estado = 'irse'; a.t = 9; } H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
    P.horas = 12; H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); return { oleadas: d.oleadas, terminada: d.oleadaTerminada } })()`);
  // `n` rastreadores quietos al lado, ardiendo (el fuego del arsenal: arde → herirAlien 'fuego')
  const quemar = async (n) => {
    await js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado;
      for (let i = 0; i < ${n}; i++) { const a = H.desafio.invocar('rastreador', j.pos.x + 8 + i * 1.5, j.pos.z + 8); if (!a) continue; a.enredadoT = 999; a.fuegoT = 30; }
      return 1 })()`);
    await simular(9);
    const caido = await js(`(()=>{ const H = window.__hojarasca; const c = H.desafio.caido; if (c) H.desafio.levantarse(); H.progreso.desafio.salud = 100; return c })()`);
    if (caido) errores.push('el jugador cayó mientras ardían (la noche no cuenta)');
  };

  try {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await abrir();
    await entrar();
    ok(await js('!!window.__hojarasca?.desafio?.puestosMundo'), 'carga el Desafío con los puestos');
    const base = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, r = H.T.lugares.refugio;
      P.dia = 3; P.horas = 12; P.materiales = { tronco: 40, tabla: 40, piedra: 40, cristal: 0 }; P.ramitas = 10; P.cosas.hacha = 1; P.cosas.arco = 1;
      Object.assign(P.desafio, { oleadas: 2, noches: 2, oleadaNoche: 2, oleadaTerminada: true, flechas: 40, salud: 100, tutorial: 99, especialAnterior: 'roja' });
      return { x: r.x, z: r.z } })()`);
    await pararEn(base.x + 20, base.z + 20);
    await simular(0.5, 0);

    seccion('1. aparece un puesto');
    await js(`window.__hojarasca.desafio.puestosMundo.alAmanecer(); 1`);
    const p0 = await D(`JSON.parse(JSON.stringify(d.puestos.lista))`);
    ok(p0.length === 1 && p0[0].estructuras.length === 2, `al amanecer de la noche 2, un puesto con aguja y vaina (${JSON.stringify(p0.map((p) => [Math.round(p.x), Math.round(p.z), p.estructuras.map((e) => e.tipo).join('+')]))})`);
    const P1 = p0[0];
    // (la distancia a la base la mide la prueba de Node: acá, que esté en tierra firme y en el valle)
    const lugar = await js(`(()=>{ const H = window.__hojarasca; return { agua: !!H.T.agua(${P1.x}, ${P1.z}), dentro: Math.abs(${P1.x}) < 500 && Math.abs(${P1.z}) < 500 } })()`);
    ok(!lugar.agua && lugar.dentro, `en tierra firme, dentro del valle (${JSON.stringify(lugar)})`);
    ok((await js(`window.__hojarasca.desafio.puestos.length`)) === 0, 'todavía no está en el mapa: hay que verlo');
    const malla = await js(`(()=>{ let n = 0; window.__hojarasca.escena.traverse((o) => { if (o.name === 'puesto-invasor' && o.visible) n++; }); return n })()`);
    ok(malla === 1, 'se ve en el mundo (una malla)');

    // te acercás: queda en el mapa y aparecen los guardias dormidos
    await pararEn(P1.x + 40, P1.z, P1.x, P1.z);
    await simular(1.2, 0);
    ok(await D('d.puestos.lista[0].visto'), 'a 40 m queda anotado');
    const mapa = await js(`window.__hojarasca.desafio.puestos`);
    ok(mapa.length === 1, `y sale en el mapa (${JSON.stringify(mapa)})`);
    const guardias = await js(`window.__hojarasca.desafio.aliens.filter((a) => a.puesto === ${P1.id}).map((a) => a.estado + ':' + a.tipo)`);
    ok(guardias.length === 2 && guardias.every((g) => g.startsWith('dormido')), `dos guardias dormidos (${guardias.join(', ')})`);
    // uno se abate a hachazos: el puesto se queda con un guardia menos
    await js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado, a = H.desafio.aliens.find((q) => q.puesto === ${P1.id});
      a.vida = 1; const p = a.m.g.position; j.pos.set(p.x + 1.2, H.T.altura(p.x + 1.2, p.z) + 0.05, p.z); j.yaw = Math.atan2(j.pos.x - p.x, j.pos.z - p.z); j.pitch = -0.2;
      window.__guardia = a; return 1 })()`);
    await cuadros(2);
    await js(`(()=>{ const H = window.__hojarasca; for (let i = 0; i < 40 && H.desafio.recarga > 0; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); H.desafio.atacar('hacha'); return 1 })()`);
    await simular(1.2, 0);
    ok((await D('d.puestos.lista[0].guardias')) === 1, `abatido un guardia, queda uno (${await D('d.puestos.lista[0].guardias')})`);
    await js(`(()=>{ for (const a of window.__hojarasca.desafio.aliens) if (a.puesto === ${P1.id}) { a.estado = 'irse'; a.t = 9; } return 1 })()`);
    await simular(0.5, 0);

    // la vaina se quema con E (la tecla de verdad, y el aviso dice lo mismo)
    const iV = P1.estructuras.findIndex((e) => e.tipo === 'vaina'), eV = P1.estructuras[iV];
    await pararEn(P1.x + eV.dx + 1.3, P1.z + eV.dz, P1.x + eV.dx, P1.z + eV.dz);
    await cuadros(3);
    const avisoE = await js(`window.__hojarasca.desafio.avisoCercaDe(window.__hojarasca.jugador.estado.pos, 99)`);
    const avisoPantalla = await js(`window.__hojarasca.__aviso()`);
    ok(/Quemar la vaina/.test(avisoE), `el aviso de E: "${avisoE}" (en pantalla: "${avisoPantalla}")`);
    const ramitas0 = await js(`window.__hojarasca.progreso.ramitas ?? window.__hojarasca.progreso.materiales.ramita`);
    await tecla('KeyE');
    await simular(3.2, 0);
    const vaina = await D(`d.puestos.lista[0].estructuras[${iV}].vida`);
    ok(vaina === 0, `E quema la vaina con una ramita (vida ${vaina}, ramitas ${ramitas0} → ${await js(`window.__hojarasca.progreso.ramitas ?? window.__hojarasca.progreso.materiales.ramita`)})`);

    // la aguja: un flechazo le entra (es un blanco como las cámaras del nido); se termina a hachazos
    const iA = P1.estructuras.findIndex((e) => e.tipo === 'aguja');
    await pararEn(P1.x + 14, P1.z, P1.x, P1.z);
    await js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado; const y = H.T.altura(${P1.x}, ${P1.z}) + 2.6; j.pitch = Math.atan2(y - (j.pos.y + 1.6), 14); return 1 })()`);
    await cuadros(2);
    const v0 = await D(`d.puestos.lista[0].estructuras[${iA}].vida`);
    await js(`(()=>{ const H = window.__hojarasca; for (let i = 0; i < 40 && H.desafio.recarga > 0; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); H.desafio.atacar('arco'); return 1 })()`);
    await simular(1.5, 0);
    const v1 = await D(`d.puestos.lista[0].estructuras[${iA}].vida`);
    ok(v1 < v0, `la flecha le entra a la aguja (${v0} → ${v1})`);
    const cristal0 = await js(`window.__hojarasca.progreso.materiales.cristal || 0`);
    await pararEn(P1.x + 2.2, P1.z, P1.x, P1.z);
    await cuadros(2);
    const golpes = await js(`(()=>{ const H = window.__hojarasca; let n = 0;
      for (; n < 60 && H.progreso.desafio.puestos.lista[0].estructuras[${iA}].vida > 0; n++) {
        for (let i = 0; i < 40 && H.desafio.recarga > 0; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
        H.desafio.atacar('hacha');
      } return n })()`);
    await simular(0.6, 0);
    const roto = await D(`({ roto: d.puestos.lista[0].roto, golpes: d.puestos.golpes, rotos: d.puestos.rotos })`);
    const cristal1 = await js(`window.__hojarasca.progreso.materiales.cristal || 0`);
    ok(roto.roto && roto.rotos === 1, `a hachazos (${golpes} golpes) cae la aguja y el puesto queda roto`);
    ok(cristal1 - cristal0 >= 4, `deja cristales (+${cristal1 - cristal0})`);
    ok(roto.golpes.length === 1 && roto.golpes[0].noche === 3 && roto.golpes[0].menos === 3, `la noche 3 vienen menos (${JSON.stringify(roto.golpes)})`);
    ok((await js(`window.__hojarasca.desafio.puestos.length`)) === 0, 'roto, sale del mapa');
    const avisos = await js(`window.__hojarasca.__avisos().join(' | ')`);
    ok(/Rompiste el puesto/.test(avisos), 'y se avisa');

    seccion('2. la noche siguiente: menos y más flojos');
    await limpiarAliens();
    await pararEn(base.x + 20, base.z + 20);
    await atardecer();
    const n3 = await anochecer();
    // lo que habría bajado: la composición de la noche 3 (la dificultad normal)
    const comp3 = await js(`window.__hojarasca.progreso.desafio.oleadas`);
    ok(n3.oleadas === 3 && comp3 === 3, 'empezó la noche 3');
    // la composición completa de la noche 3 en normal es de 7: rompiste un puesto de nivel 1 → 3 menos
    ok(n3.vivos === 7 - 3, `bajan ${n3.vivos} en vez de 7`);
    await simular(8);
    const vidas = await js(`window.__hojarasca.desafio.aliens.filter((a) => a.tipo === 'rastreador').map((a) => a.vidaMax)`);
    ok(vidas.length > 0 && vidas.every((v) => v <= 40), `y más flojos: rastreadores de ${vidas.join('/')} de vida (sin el puesto roto serían 46)`);
    const am3 = await amanecer();
    ok(am3.terminada, 'amanece');

    seccion('3. un puesto en pie manda los suyos');
    // uno a mano (el de la noche 4 no toca: pasan de a dos)
    await js(`(()=>{ const H = window.__hojarasca, d = H.progreso.desafio, r = H.T.lugares.refugio;
      d.puestos.lista.push({ id: 50, x: r.x - 110, z: r.z + 20, nivel: 1, nacio: 3, crecio: 3, estructuras: [{ tipo: 'aguja', dx: 0, dz: 0, vida: 150, max: 150 }], guardias: 0, visto: true, roto: false });
      H.desafio.puestosMundo.sincronizar(); return 1 })()`);
    await limpiarAliens();
    await atardecer();
    const n4 = await anochecer();
    const comp4 = 9;
    ok(n4.oleadas === 4 && n4.vivos === comp4 + 1, `la noche 4 bajan ${n4.vivos}: 9 de la nave y 1 del puesto`);
    const delPuesto = await js(`(()=>{ const H = window.__hojarasca, r = H.T.lugares.refugio; return H.desafio.aliens.filter((a) => Math.hypot(a.m.g.position.x - (r.x - 110), a.m.g.position.z - (r.z + 20)) < 8).length })()`);
    ok(delPuesto === 1, 'sale desde el puesto');
    await amanecer();

    seccion('4. los queman noche tras noche: aprenden');
    const niveles = [];
    for (let k = 0; k < 3; k++) {
      await limpiarAliens();
      await atardecer();
      await anochecer();
      await limpiarAliens();
      await quemar(5);
      niveles.push(await D(`JSON.stringify(d.evolucion.noche)`));
      await amanecer();
      niveles.push(await D(`d.evolucion.niveles.fuego || 0`));
    }
    ok((await D('d.evolucion.niveles.fuego')) === 3, `resistencia al fuego, de a un nivel por noche (${niveles.join(' · ')})`);
    // el aviso del atardecer
    await limpiarAliens();
    await atardecer();
    await esperar(4500);
    const dichos = await js(`window.__hojarasca.__avisos().slice(-12).join(' | ')`);
    ok(/Vienen resistentes al fuego/.test(dichos), `al atardecer: "Vienen resistentes al fuego" (${dichos})`);
    await anochecer();
    await limpiarAliens();
    // bajan: la mitad trae placas
    const adapt = await js(`(()=>{ const H = window.__hojarasca, j = H.jugador.estado, r = [];
      for (let i = 0; i < 16; i++) { const a = H.desafio.invocar('rastreador', j.pos.x + 10 + (i % 4) * 1.6, j.pos.z + 10 + Math.floor(i / 4) * 1.6); if (a) { a.enredadoT = 999; r.push(a); } }
      return { n: r.length, fuego: r.filter((a) => a.resiste === 'fuego').length, placas: r.filter((a) => a.resiste && a.m.placas?.visible).length, sinPlacas: r.filter((a) => !a.resiste && a.m.placas?.visible).length } })()`);
    ok(adapt.fuego >= 3 && adapt.fuego <= 13, `vienen adaptados ${adapt.fuego} de ${adapt.n}`);
    ok(adapt.placas === adapt.fuego && adapt.sinPlacas === 0, 'los adaptados traen placas (y los otros no)');
    // el fuego les entra la mitad; las flechas, igual que siempre
    const dano = await js(`(()=>{ const H = window.__hojarasca, al = H.desafio.aliens;
      const con = al.find((a) => a.resiste === 'fuego' && a.enredadoT > 100), sin = al.find((a) => !a.resiste && a.enredadoT > 100);
      for (const a of [con, sin]) { a.vida = a.vidaMax = 999; a.fuegoT = 2; }
      for (let i = 0; i < 20; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      return { con: 999 - con.vida, sin: 999 - sin.vida } })()`);
    ok(dano.sin > 0 && Math.abs(dano.con / dano.sin - 0.5) < 0.08, `el fuego le entra la mitad al adaptado (${dano.con.toFixed(1)} contra ${dano.sin.toFixed(1)})`);
    const best = await js(`JSON.stringify(window.__hojarasca.desafio.bestiario.adaptado || null)`);
    ok(await js(`/resistentes al fuego/.test(window.__hojarasca.desafio.adaptaciones)`), 'el bestiario dice contra qué vienen');
    void best;
    await amanecer();

    seccion('5. se guarda y vuelve');
    const antes = await js(`(()=>{ const H = window.__hojarasca; H.guardar(); const g = JSON.parse(localStorage.getItem('hojarasca-desafio-v1')); return { evo: g.desafio.evolucion, puestos: g.desafio.puestos.lista.map((p) => [p.id, p.roto]) } })()`);
    // (la noche 8 casi no hubo fuego: al amanecer ya se olvidaron un nivel)
    ok(antes.evo?.niveles?.fuego === 2 && antes.puestos.length >= 2, `en el guardado (${JSON.stringify(antes)})`);
    await abrir();
    await entrar();
    const despues = await js(`(()=>{ const H = window.__hojarasca, d = H.progreso.desafio; let mallas = 0; H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      H.escena.traverse((o) => { if (o.name === 'puesto-invasor' && o.visible) mallas++; });
      return { evo: d.evolucion, puestos: d.puestos.lista.map((p) => [p.id, p.roto]), mallas } })()`);
    ok(JSON.stringify(despues.evo.niveles) === JSON.stringify(antes.evo.niveles) && JSON.stringify(despues.puestos) === JSON.stringify(antes.puestos), `al volver a abrir sigue igual (${JSON.stringify(despues.evo.niveles)})`);
    ok(despues.mallas === antes.puestos.filter((p) => !p[1]).length, `y los puestos en pie se ven (${despues.mallas})`);

    seccion('6. si dejás el fuego, se olvidan');
    const bajando = [];
    await pararEn(base.x + 20, base.z + 20);
    for (let k = 0; k < 2; k++) {
      await limpiarAliens();
      await atardecer();
      await anochecer();
      await limpiarAliens();
      await amanecer();
      bajando.push(await D('d.evolucion.niveles.fuego || 0'));
    }
    ok(bajando.join() === '1,0', `se olvida de a un nivel por noche (2 → ${bajando.join(' → ')})`);
    await esperar(8000);
    ok(/Se van olvidando/.test(await js(`window.__hojarasca.__avisos().join(' | ')`)), 'y se avisa al amanecer');
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('humo 3.0 contraataque: todo en verde');
  app.exit(0);
});
