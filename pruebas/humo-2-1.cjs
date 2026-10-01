// Partida real 2.1: las diez mejoras. Primero el Relax (grabador, rastros, el tiempo,
// el almanaque, las conservas); después el Desafío (rescates, excavador, jefes, restos,
// forja). Como en las otras, el Desafío se hace avanzar a mano con `simular`.
//
// Uso: npx electron pruebas/humo-2-1.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { const l = `${cond ? '✓' : '✗'} ${texto}`; pasos.push(l); console.log(l); if (!cond) errores.push(texto); };
  // En el Desafío la salud vive en progreso.desafio.salud: se repone en cada sección,
  // si no el jugador cae a mitad de la prueba y la noche se da por perdida.
  const seccion = async (s) => {
    donde = s; console.log(`— ${s}`);
    await js(`(()=>{ const D = window.__hojarasca?.progreso?.desafio; if (D) D.salud = 100; return 1 })()`);
  };
  const simular = (seg) => js(`(()=>{const H=window.__hojarasca; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); } return 1})()`);
  const notas = () => js(`document.getElementById('notas').textContent`);
  const url = path.join(raiz, 'index.html');
  // a veces la carga anterior todavía está cerrando audio y workers y Electron corta la
  // nueva con ERR_FAILED: se reintenta una vez
  const abrir = async () => {
    try { await w.loadFile(url, { search: '?debug=1' }); }
    catch (e) { console.log(`(recarga: ${e.message.slice(0, 40)})`); await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); }
  };
  const cargar = async (modo) => {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
  };

  try {
    // ================================================================ RELAX
    await cargar('relax');
    ok(await js('!!window.__hojarasca'), 'carga el Relax');

    await seccion('1. el grabador');
    const grab = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      P.cosas.grabador = 1; P.entradas.chucao = { dia: 1, hora: 10, cantidad: 0 };
      const ch = H.fauna.chucaos[0];
      js.pos.set(ch.x + 8, H.T.altura(ch.x + 8, ch.z) + 1.65, ch.z);
      H.__cantosOidos.length = 0;
      H.sonido.chucao(ch);                       // canta el chucao, cerca
      H.__usarGrabador();
      return { grabado: !!P.grabaciones?.chucao, cantos: H.__cantosOidos.length } })()`);
    ok(grab.cantos >= 1, `el canto quedó anotado para grabarlo (${grab.cantos})`);
    ok(grab.grabado, 'clic con el grabador: el chucao queda grabado');
    ok(/Grabaste el chucao/.test(await notas()), 'y el juego lo avisa');
    await js(`(()=>{ const H = window.__hojarasca; H.__cantosOidos.length = 0; H.__usarGrabador(); return 1 })()`);
    await esperar(4500);
    const contesta = await notas();
    ok(/Hacés sonar el chucao/.test(contesta), 'sin nada cantando, el clic hace sonar lo grabado');
    ok(/Contesta el chucao/.test(contesta), `y contesta el más cercano, diciendo de qué lado («${contesta.slice(-70)}»)`);
    const viene = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      P.entradas.carpintero = { dia: 1, hora: 10, cantidad: 0 }; P.grabaciones.carpintero = { dia: 1 };
      const c = H.fauna.carpinteros[0];
      // parado a 10 m de un coihue o una lenga que esté a 30–90 m del carpintero: en campo
      // abierto no tiene dónde posarse más cerca, y entonces no viene (a propósito)
      const buenos = H.veg.arboles.filter((a) => !a.sacado && a.esc >= 0.7 && (a.especie === 'coihue' || a.especie === 'lenga')
        && Math.hypot(a.x - c.g.position.x, a.z - c.g.position.z) > 30 && Math.hypot(a.x - c.g.position.x, a.z - c.g.position.z) < 90);
      const t = buenos[0] || { x: c.g.position.x + 40, z: c.g.position.z };
      const ang = Math.atan2(t.x - c.g.position.x, t.z - c.g.position.z);
      const px = t.x - Math.sin(ang) * 10, pz = t.z - Math.cos(ang) * 10;
      js.pos.set(px, H.T.altura(px, pz) + 1.65, pz);
      H.__cantosOidos.length = 0;
      // que suene el carpintero: se pasa de largo el chucao
      H.__usarGrabador(); if (!H.fauna.carpinteros.some((x) => x.volando)) { H.__cantosOidos.length = 0; H.__usarGrabador(); }
      return { vuela: H.fauna.carpinteros.some((x) => x.volando), buenos: buenos.length,
        dCarp: H.fauna.carpinteros.map((x) => Math.round(Math.hypot(x.g.position.x - js.pos.x, x.g.position.z - js.pos.z))).join(','),
        suj: H.fauna.sujetos().filter((s) => s.tipo === 'carpintero').length,
        notas: [...document.getElementById('notas').children].map((e) => e.textContent).slice(-2).join(' | ') } })()`);
    ok(viene.vuela, `al hacer sonar al carpintero, uno se muda a un árbol cerca tuyo (${JSON.stringify(viene)})`);

    await seccion('2. rastros');
    await js(`(()=>{ window.__hojarasca.progreso.horas = 11; window.__hojarasca.__apurarRastro(); return 1 })()`);
    let rastro = null;
    for (let i = 0; i < 12 && !rastro; i++) {
      await esperar(2000);
      rastro = await js(`(()=>{ const H = window.__hojarasca, r = H.__rastro(); if (!r) { H.__apurarRastro(); return null; }
        const m = H.__mallaRastros().mallas; return { especie: r.especie, n: r.huellas.length, dibujadas: Object.values(m).reduce((s, x) => s + x.count, 0) } })()`);
    }
    ok(!!rastro, `aparece un rastro cerca (${rastro && rastro.especie}, ${rastro && rastro.n} huellas)`);
    if (rastro) {
      ok(rastro.dibujadas > 5, `las huellas se dibujan en el suelo (${rastro.dibujadas})`);
      const mirado = await js(`(()=>{ const H = window.__hojarasca, r = H.__rastro(), h = r.huellas[3], js = H.jugador.estado;
        js.pos.set(h.x, H.T.altura(h.x, h.z) + 1.65, h.z);
        const ok = H.__mirarRastro();
        const R = { huemul: 'rastro-huemul', pudu: 'rastro-pudu', guanaco: 'rastro-guanaco', zorro: 'rastro-zorro', liebre: 'rastro-liebre' }[r.especie];
        return { ok, anotado: !!H.progreso.entradas[R] } })()`);
      ok(mirado.ok && mirado.anotado, 'parado sobre el rastro, E lo mira y lo anota en el cuaderno');
      ok(/Huellas de .*Van hacia el/.test(await notas()), 'y dice para dónde van');
    }

    await seccion('3. el tiempo que se ve venir');
    await js(`(()=>{ const H = window.__hojarasca; H.ajustes.clima = 'variable'; const e = H.clima.estado; e.objetivo = 'despejado'; e.proximo = 'lluvia'; e.t = 50; return 1 })()`);
    await esperar(6000);
    const frente = await js(`(()=>{ const H = window.__hojarasca; H.clima.estado.t = Math.max(H.clima.estado.t, 40); return +H.__cielo().uniforms.uFrente.value.toFixed(2) })()`);
    ok(frente > 0.05, `el frente de lluvia se ve venir sobre la cordillera (${frente})`);
    const charla = await js(`(()=>{ const H = window.__hojarasca, npc = H.gente.gente.find((g) => g.clave === 'ramon');
      H.clima.estado.proximo = 'lluvia'; H.clima.estado.t = 40;
      H.hablar(npc); const t = document.getElementById('charla-texto').textContent; H.__cerrarCharla(); return t })()`);
    ok(/tapó el cerro|Se viene agua/.test(charla), `Don Ramón lo anuncia al saludar («${charla.slice(0, 90)}»)`);

    await seccion('4. el almanaque');
    const mig = await js(`(()=>{ const H = window.__hojarasca; H.fauna.lanzarMigracion(H.jugador.estado.pos); const m = H.fauna.migracion;
      return { activa: m.activa, visibles: m.aves.filter((a) => a.g.visible).length } })()`);
    ok(mig.activa && mig.visibles === 13, `en otoño pasa la bandada de cauquenes en V (${mig.visibles} aves)`);
    await js(`(()=>{ const H = window.__hojarasca, P = H.progreso; P.entradas.picaflor = { dia: 1, hora: 10, cantidad: 0 };
      H.ajustes.estacion = 'otono'; H.__U().uOtono.value = 1; H.__U().uInvierno.value = 0; return 1 })()`);
    await esperar(3000);
    await js(`(()=>{ const H = window.__hojarasca; H.ajustes.estacion = 'invierno'; H.__U().uOtono.value = 0; H.__U().uInvierno.value = 1; return 1 })()`);
    let se = '';
    for (let i = 0; i < 5 && !/Se fueron al norte/.test(se); i++) { await esperar(2000); se = await notas(); }
    ok(/Se fueron al norte/.test(se), 'al llegar el invierno, avisa quiénes se fueron');
    await js(`(()=>{ const H = window.__hojarasca; H.ajustes.estacion = 'verano'; H.__U().uInvierno.value = 0; return 1 })()`);

    await seccion('5. conservas');
    const frasco = await js(`(async()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      P.entradas.frutilla = { dia: 1, hora: 10, cantidad: 8 }; P.entradas['frutillas-brasas'] = { dia: 1, hora: 10, cantidad: 0 };
      H.clima.encenderFogata(js.pos.x + 1, js.pos.y - 1.65, js.pos.z, 600);
      H.__cocinar(); await new Promise((r) => setTimeout(r, 1800));
      return { frascos: P.entradas['frasco-frutilla']?.cantidad || 0, frutillas: P.entradas.frutilla.cantidad } })()`);
    ok(frasco.frascos === 1 && frasco.frutillas === 4, `cuatro frutillas al fuego hacen un frasco (${JSON.stringify(frasco)})`);
    const tendal = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado, O = H.obras;
      for (const k of ['tronco', 'tabla', 'piedra']) P.materiales[k] = 50;
      O.elegir(H.PLANOS.find((q) => q.id === 'tendal'));
      let obra = null;
      // se busca lugar alrededor: adelante puede haber agua, un árbol o una pendiente
      const lugares = [];
      for (const d of [3, 5, 8, 12]) for (let k = 0; k < 8; k++) lugares.push([d, js.yaw + k * Math.PI / 4]);
      for (const [d, ang] of lugares) { const x = js.pos.x - Math.sin(ang) * d, z = js.pos.z - Math.cos(ang) * d;
        const r = O.fundar(x, z, js.yaw, js.pos.y); if (!r.ok) continue; for (let i = 0; i < 6; i++) { if (!O.avanzar(r.obra, P.materiales).ok) break; } obra = r.obra; break; }
      O.elegir(null);
      if (!obra) return 'sin tendal';
      js.pos.set(obra.datos.x + 1, js.pos.y, obra.datos.z);
      P.entradas.calafate = { dia: 1, hora: 10, cantidad: 5 };
      H.__usarTendal();
      const colgado = obra.datos.tendal?.colgado;
      obra.datos.tendal.horas = 12;
      H.__usarTendal();
      return { colgado, secos: P.entradas['calafate-seco']?.cantidad || 0 } })()`);
    ok(tendal.colgado === 'calafate-seco' && tendal.secos === 1, `en el tendal los calafates se secan (${JSON.stringify(tendal)})`);
    const almacen = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso;
      P.cosas.grabador = 0; delete P.cosas.grabador;
      P.entradas['frasco-frutilla'].cantidad = 2; P.entradas.pluma = { dia: 1, hora: 10, cantidad: 2 };
      P.entradas['calafate-seco'].cantidad = 2; P.entradas['hongos-secos'] = { dia: 1, hora: 10, cantidad: 1 };
      H.__cambiar(5); H.__cambiar(6);
      return { grabador: !!P.cosas.grabador, botas: !!P.cosas.botas } })()`);
    ok(almacen.grabador && almacen.botas, 'con las conservas, el almacén da el grabador y las botas');
    await esperar(2500);
    const botas = await js(`window.__hojarasca.jugador.estado.botas`);
    ok(botas === true, 'y las botas se llevan puestas');

    // ================================================================ DESAFÍO
    await cargar('desafio');
    ok(await js('!!window.__hojarasca?.desafio'), 'carga el Desafío');

    await seccion('6. rescates');
    const resc = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio;
      H.desafio.forzarRescate('puesto'); D.oleadas = 5; H.progreso.horas = 20.49; return 1 })()`);
    await js(`(()=>{ const H = window.__hojarasca; H.progreso.horas = 20.6; return 1 })()`);
    await simular(1);
    const r1 = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, L = H.T.lugares.puesto;
      return { rescate: D.rescate, cerca: H.desafio.aliens.filter((a) => Math.hypot(a.m.g.position.x - L.x, a.m.g.position.z - L.z) < 80).length, total: H.desafio.aliens.length } })()`);
    ok(r1.rescate?.lugar === 'puesto', `una noche de rescate: atacan el puesto de Don Ramón (${JSON.stringify(r1.rescate)})`);
    await esperar(3000);
    ok(/Atacan el puesto de Don Ramón/.test(await notas()), 'y el juego avisa hacia dónde');
    const golpes = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, L = H.T.lugares.puesto, js = H.jugador.estado;
      js.pos.set(L.x + 150, H.T.altura(L.x + 150, L.z) + 1.65, L.z);
      const a = H.desafio.invocar('rastreador', L.x + 5, L.z); a.estado = 'avanzar'; a.vida = a.vidaMax = 999;
      const antes = D.rescate.vida; for (let i = 0; i < 80; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      return { antes, despues: D.rescate.vida } })()`);
    ok(golpes.despues < golpes.antes, `los invasores le pegan al puesto (${golpes.antes} → ${golpes.despues})`);
    await js(`(()=>{ const D = window.__hojarasca.progreso.desafio; D.rescate.vida = 1; return 1 })()`);
    await simular(4);
    const enojo = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, npc = H.gente.gente.find((g) => g.clave === 'ramon');
      const caido = D.rescate?.caido; H.hablar(npc); const t = document.getElementById('charla-texto').textContent; H.__cerrarCharla();
      return { caido, enojado: H.desafio.enojado('ramon'), t } })()`);
    ok(enojo.caido && enojo.enojado, 'si el puesto cae, Don Ramón queda enojado');
    ok(/no viniste/.test(enojo.t), `y no quiere hablar («${enojo.t.slice(0, 60)}»)`);

    await seccion('7. el excavador');
    const exc = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, O = H.obras, P = H.progreso;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      P.desafio.rescate = null;
      for (const k of ['tronco', 'tabla', 'piedra']) P.materiales[k] = 200;
      const r = H.T.lugares.refugio; js.pos.set(r.x + 30, H.T.altura(r.x + 30, r.z + 30) + 1.65, r.z + 30); js.yaw = 0;
      O.elegir(H.PLANOS.find((q) => q.id === 'empalizada'));
      for (const l of [-3, 0, 3]) { const x = js.pos.x + l, z = js.pos.z - 6; const f = O.fundar(x, z, 0, js.pos.y); if (f.ok) for (let i = 0; i < 6; i++) { if (!O.avanzar(f.obra, P.materiales).ok) break; } }
      O.elegir(null);
      const a = H.desafio.invocar('excavador', js.pos.x, js.pos.z - 24); a.estado = 'avanzar'; a.vida = a.vidaMax = 999;
      window.__exc = a; return !!a })()`);
    ok(exc, 'baja un excavador detrás de una empalizada');
    let bajo = false, salio = null;
    for (let i = 0; i < 40 && !salio; i++) {
      await simular(0.5);
      const e = await js(`(()=>{ const a = window.__exc, js = window.__hojarasca.jugador.estado; return { estado: a.estado, d: Math.hypot(a.m.g.position.x - js.pos.x, a.m.g.position.z - js.pos.z) } })()`);
      if (e.estado === 'bajoTierra') bajo = true;
      if (bajo && e.estado !== 'bajoTierra') salio = e;
    }
    ok(bajo, 'no rompe la empalizada: se mete bajo tierra');
    ok(salio && salio.d < 5, `y asoma cerca tuyo, adentro (${salio && salio.d.toFixed(1)} m)`);
    ok(/Algo cava bajo la tierra/.test(await notas()), 'el juego avisa que algo cava');

    await seccion('8. los jefes');
    const jefes = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, js = H.jugador.estado, res = {};
      for (const [n, v] of [[5, 'clasico'], [10, 'llamador'], [15, 'sombra'], [20, 'artillero']]) {
        for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
        H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
        D.oleadas = n; const a = H.desafio.invocar('jefe', js.pos.x + 25, js.pos.z + 25); res[n] = a && a.variante;
      }
      return res })()`);
    ok(jefes[5] === 'clasico' && jefes[10] === 'llamador' && jefes[15] === 'sombra' && jefes[20] === 'artillero', `cada jefe es otro (${JSON.stringify(jefes)})`);
    const llamador = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, js = H.jugador.estado;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      D.oleadas = 10; const j = H.desafio.invocar('jefe', js.pos.x + 30, js.pos.z + 30); j.estado = 'avanzar'; j.tLlamado = 0.1;
      for (let i = 0; i < 20; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      return { llamados: j.llamados, vivos: H.desafio.aliens.filter((a) => a.tipo === 'rastreador' && a.estado !== 'irse').length } })()`);
    ok(llamador.llamados >= 2 && llamador.vivos >= 2, `el que llama trae refuerzos (${JSON.stringify(llamador)})`);
    const sombra = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, js = H.jugador.estado;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      H.linterna.intensity = 0;
      D.oleadas = 15; const j = H.desafio.invocar('jefe', js.pos.x + 25, js.pos.z + 25); j.estado = 'avanzar';
      for (let i = 0; i < 4; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const oculta = !j.m.malla.visible;
      j.flash = 1; H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      return { oculta, alGolpe: j.m.malla.visible } })()`);
    ok(sombra.oculta, 'la sombra no se ve sin linterna');
    ok(sombra.alGolpe, 'pero al pegarle se descubre');
    const artillero = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, js = H.jugador.estado;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      H.desafio.ultimosOidos.length = 0;
      D.oleadas = 20; const j = H.desafio.invocar('jefe', js.pos.x + 26, js.pos.z); j.estado = 'avanzar'; j.tRoca = 0.1;
      for (let i = 0; i < 90; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      return H.desafio.ultimosOidos.join(' | ') })()`);
    ok(/una piedra que cae/.test(artillero), `el artillero tira piedras («${artillero.slice(0, 120)}»)`);

    await seccion('9. los restos');
    const ruina = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, js = H.jugador.estado;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      D.restos = null; D.planos = []; H.progreso.horas = 11;
      const ok = H.desafio.eventos.soltarRestos();
      const r = D.restos; js.pos.set(r.x + 30, H.T.altura(r.x + 30, r.z) + 1.65, r.z);
      for (let i = 0; i < 6; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      const dormidos = H.desafio.aliens.filter((a) => a.estado === 'dormido').length;
      return { ok, dormidos, puedeDormir: H.desafio.hayAtaque() } })()`);
    ok(ruina.ok, 'cae una nave: la ruina aparece');
    ok(ruina.dormidos >= 2, `al acercarte, adentro hay invasores dormidos (${ruina.dormidos})`);
    ok(!ruina.puedeDormir, 'y dormidos no cuentan como ataque');
    const premio = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, js = H.jugador.estado, r = D.restos;
      const rot = r.rot;
      // por el pasillo (locales, z crece hacia el fondo), parado y sin agacharse: por la
      // cámara del medio, donde duermen, y después al fondo, donde está el premio
      const ir = (lz) => { const x = r.x + lz * Math.sin(rot), z = r.z + lz * Math.cos(rot); js.pos.set(x, H.T.altura(x, z) + 1.65, z);
        for (let i = 0; i < 4; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); };
      js.agachado = false;
      ir(9);
      const despiertos = H.desafio.aliens.filter((a) => a.estado === 'avanzar').length;
      ir(15.8);
      return { restos: D.restos, planos: D.planos.length, despiertos } })()`);
    ok(!premio.restos && premio.planos === 1, 'al fondo está el premio: un plano');
    ok(premio.despiertos >= 1, `pasar parado al lado los despierta (${premio.despiertos})`);

    await seccion('10. la forja');
    const forja = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      // afuera de la ruina: si no, el blanco puede quedar del otro lado de una pared
      const lr = H.T.lugares.refugio; H.jugador.ubicar(lr.x + 25, lr.z - 25, 0);
      P.cosas.lanza = 1; P.cosas.lanzaHielo = 1;
      const x = js.pos.x - Math.sin(js.yaw) * 1.8, z = js.pos.z - Math.cos(js.yaw) * 1.8;
      const a = H.desafio.invocar('rastreador', x, z); a.estado = 'avanzar'; a.vida = a.vidaMax = 999;
      H.desafio.atacar('lanza');
      const hielo = a.congeladoT;
      // el rayo: tres juntos
      const b = H.desafio.invocar('rastreador', x + 2, z); b.vida = b.vidaMax = 500;
      const c = H.desafio.invocar('rastreador', x + 4, z); c.vida = c.vidaMax = 500;
      H.desafio.aplicarForja('rayo', a, js.pos, 42);
      // el empuje contra un tirador
      const t = H.desafio.invocar('tirador', x - 3, z); t.vida = t.vidaMax = 500;
      H.desafio.aplicarForja('empuje', t, js.pos, 18);
      return { hielo, rayoB: 500 - b.vida, rayoC: 500 - c.vida, derribado: t.enredadoT } })()`);
    ok(forja.hielo > 2, `la lanza de hielo congela al rastreador (${forja.hielo.toFixed(1)} s)`);
    ok(forja.rayoB > 0 && forja.rayoC > 0, `el rayo salta a los dos de al lado (${forja.rayoB.toFixed(0)} y ${forja.rayoC.toFixed(0)})`);
    ok(forja.derribado > 1, `la honda de empuje derriba al tirador (${forja.derribado.toFixed(1)} s)`);
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});
