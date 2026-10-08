// Partida real 2.0: las diez mejoras del Desafío.
// 3.8.0: los textos que mira esta partida dicen lo de los duendes (duendes, Coihue Viejo, madrigueras).
//
// Como en `humo-desafio.cjs`, el Desafío se hace avanzar a mano (`simular`): la ventana
// oculta dibuja un cuadro cada varios segundos, pero la lógica de la noche corre a
// cuadros de 0,05 s cuando se la llama directo. Lo que se prueba es el juego de verdad,
// con sus invasores, sus obras y su perro.
//
// Uso: npx electron pruebas/humo-desafio-2.cjs
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
  // cada llamada con tope: si la página se cuelga, la prueba dice dónde en vez de esperar para siempre
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { const l = `${cond ? '✓' : '✗'} ${texto}`; pasos.push(l); console.log(l); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const simular = (seg) => js(`(()=>{const H=window.__hojarasca; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); } return 1})()`);
  const url = path.join(raiz, 'index.html');

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el modo Desafío');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await w.webContents.executeJavaScript(`(async()=>{ const s = window.__hojarasca.sonido; if (!s.ctx) s.iniciar?.(); await s.ctx?.resume?.(); return 1 })()`, true);

    // Un invasor puesto a mano, a `metros` delante (o detrás) del jugador.
    const poner = (tipo, metros, { mirando = true, estado = 'quieto', detras = false } = {}) => js(`(()=>{
      const H = window.__hojarasca, js = H.jugador.estado;
      H.progreso.horas = 23;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      ${'H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });'}
      const s = ${detras ? -1 : 1};
      const x = js.pos.x - Math.sin(js.yaw) * ${metros} * s, z = js.pos.z - Math.cos(js.yaw) * ${metros} * s;
      const a = H.desafio.invocar('${tipo}', x, z);
      a.rumbo = Math.atan2(js.pos.x - x, js.pos.z - z) + ${mirando ? 0 : 'Math.PI'};
      a.m.g.rotation.y = a.rumbo;
      a.estado = '${estado}'; a.vida = a.vidaMax = 999;
      window.__bicho = a;
      return { x: Math.round(x), z: Math.round(z) } })()`);

    // ---- 1. los ojos reflejan la linterna
    seccion('1. los ojos');
    // la cámara del juego mira exactamente adonde apunta el jugador
    await js(`(()=>{ const H = window.__hojarasca; H.jugador.estado.pitch = 0.05; H.linterna.intensity = 45; H.linterna.distance = 42; H.linterna.angle = 0.42; return 1 })()`);
    await esperar(2500);
    await poner('rastreador', 24);
    await simular(0.6);
    const conLuz = await js(`+window.__bicho.m.uniformes().uReflejo.value.toFixed(3)`);
    ok(conLuz > 0.3, `con la linterna encima, los ojos devuelven la luz (reflejo ${conLuz})`);
    await js(`window.__hojarasca.linterna.intensity = 0; 1`);
    await simular(0.6);
    const sinLuz = await js(`+window.__bicho.m.uniformes().uReflejo.value.toFixed(3)`);
    ok(sinLuz < 0.05, `con la linterna apagada, nada (${sinLuz})`);
    await js(`window.__hojarasca.linterna.intensity = 45; 1`);
    // un solo cuadro: el invasor se da vuelta hacia vos enseguida, y en medio segundo ya te mira
    await poner('rastreador', 24, { mirando: false });
    await simular(0.05);
    const deEspaldas = await js(`+(window.__bicho.reflejo || 0).toFixed(3)`);
    ok(deEspaldas < 0.05, `si te da la espalda, no te devuelve la luz (${deEspaldas})`);
    await js(`window.__hojarasca.linterna.intensity = 0; 1`);

    // ---- 2. el acecho
    seccion('2. el acecho');
    await poner('rastreador', 24, { estado: 'avanzar' });
    await simular(0.5);
    const mirado = await js(`window.__bicho.acecho`);
    ok(mirado === 'rodear' || mirado === 'esconderse', `si lo mirás, se frena, rodea o se esconde (${mirado})`);
    const antes = await js(`(()=>{ const H = window.__hojarasca, p = window.__bicho.m.g.position, j = H.jugador.estado.pos; return Math.hypot(p.x - j.x, p.z - j.z) })()`);
    await simular(2);
    const despues = await js(`(()=>{ const H = window.__hojarasca, p = window.__bicho.m.g.position, j = H.jugador.estado.pos; return Math.hypot(p.x - j.x, p.z - j.z) })()`);
    ok(despues > antes - 5, `mirándolo no se te viene encima (${antes.toFixed(1)} → ${despues.toFixed(1)} m)`);
    // le das la espalda
    await js(`(()=>{ const H = window.__hojarasca; H.jugador.estado.yaw += Math.PI; H.jugador.estado.pitch = 0; return 1 })()`);
    await esperar(2500);   // un cuadro de verdad, para que la cámara gire
    await simular(0.3);
    const espalda = await js(`(()=>{ const H = window.__hojarasca; return { modo: window.__bicho.acecho, escritos: H.__sonidosEscritos().join(' | ') } })()`);
    ok(espalda.modo === 'cargar', `de espaldas, carga (${espalda.modo})`);
    ok(/pasos rápidos/.test(espalda.escritos), `y se lo oye venir: «${espalda.escritos}»`);
    const a2 = await js(`(()=>{ const H = window.__hojarasca, p = window.__bicho.m.g.position, j = H.jugador.estado.pos; return Math.hypot(p.x - j.x, p.z - j.z) })()`);
    await simular(1.5);
    const a3 = await js(`(()=>{ const H = window.__hojarasca, p = window.__bicho.m.g.position, j = H.jugador.estado.pos; return Math.hypot(p.x - j.x, p.z - j.z) })()`);
    ok(a3 < a2 - 4, `y se acerca rápido (${a2.toFixed(1)} → ${a3.toFixed(1)} m en 1,5 s)`);

    // ---- 3. el perro avisa
    seccion('3. el perro avisa');
    // el invasor a treinta metros detrás tuyo, que no ves; el perro al lado
    await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado; H.perro.est.pos.set(js.pos.x + 1.5, js.pos.y, js.pos.z + 1.5); return 1 })()`);
    await poner('rastreador', 30, { detras: true });
    await js(`(()=>{ const a = window.__bicho; a.estado = 'quieto'; return 1 })()`);
    await simular(1.2);
    const perro = await js(`(()=>{ const H = window.__hojarasca; return { aviso: H.desafio.aliados.avisoPerro, alerta: !!H.desafio.alertaPerro(), escritos: H.__sonidosEscritos().join(' | '), oidos: H.desafio.ultimosOidos.join(' | ') } })()`);
    // en pantalla caben tres renglones y el zumbido de la nave puede ocupar dos: se mira
    // también lo último que se oyó
    perro.escritos += ' | ' + perro.oidos;
    ok(perro.aviso === 'grunir', `el perro gruñe por lo que no ves (${perro.aviso})`);
    ok(perro.alerta, 'y marca para ese lado');
    ok(/el perro gruñe/.test(perro.escritos), `se escribe con la dirección de la amenaza: «${perro.escritos}»`);
    await esperar(3000);
    const estadoPerro = await js(`window.__hojarasca.perro.est.estado`);
    ok(estadoPerro === 'alerta', `el perro se queda duro mirando (${estadoPerro})`);
    // si te das vuelta y lo ves, deja de gruñir
    await js(`(()=>{ const H = window.__hojarasca; H.jugador.estado.yaw += Math.PI; return 1 })()`);
    await esperar(2500);
    await simular(0.6);
    const visto = await js(`window.__hojarasca.desafio.aliados.avisoPerro`);
    ok(visto === null, `lo que ya ves, no te lo marca (${visto})`);

    // ---- 6 y 7. subtítulos con dirección y la mezcla que se agacha
    seccion('6 y 7. subtítulos');
    // El chillido real: el invasor a cinco metros chilla cuando le toca; se le fuerza el reloj.
    const grito = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, b = window.__bicho;
      b.m.g.position.set(js.pos.x - Math.sin(js.yaw) * 5, b.m.g.position.y, js.pos.z - Math.cos(js.yaw) * 5);
      b.estado = 'avanzar'; b.chillido = -1;
      return { antes: H.sonido.agachadas || 0 } })()`);
    await simular(0.1);
    const mezcla = await js(`(()=>{ const H = window.__hojarasca, S = H.sonido; return { agachadas: S.agachadas || 0, escritos: H.__sonidosEscritos().join(' | '), pulsos: H.__pulsos().dados } })()`);
    ok(mezcla.agachadas > grito.antes, `un chillido al lado agacha el bosque y la música (${grito.antes} → ${mezcla.agachadas})`);
    ok(/risita (encima|cerca)/.test(mezcla.escritos), `y se escribe de dónde vino: «${mezcla.escritos}»`);

    // ---- 10. la vibración (sin mando no vibra, pero decide el pulso)
    seccion('10. la vibración');
    const vib = await js(`(()=>{ const H = window.__hojarasca; const antes = H.__pulsos().dados;
      H.desafio.herirJugador(12, { x: H.jugador.estado.pos.x + 1, z: H.jugador.estado.pos.z });
      const d = H.__pulsos(); H.progreso.desafio.salud = 100; return { antes, despues: d.dados, ultimo: d.ultimo } })()`);
    ok(vib.despues > vib.antes && vib.ultimo && vib.ultimo.fuerte > 0.4, `un golpe manda un pulso fuerte al mando (${JSON.stringify(vib.ultimo)})`);
    const sinVib = await js(`(()=>{ const H = window.__hojarasca; H.ajustes.vibracion = false; const a = H.__pulsos().dados; H.__vibrar('herido', 1); const b = H.__pulsos().dados; H.ajustes.vibracion = true; return b - a })()`);
    ok(sinVib === 0, 'apagada en los ajustes, no vibra');

    // ---- 8. el bestiario
    seccion('8. el bestiario');
    const best = await js(`(()=>{ const H = window.__hojarasca, B = H.progreso.desafio.bestiario || {}; return { visto: B.rastreador?.vistos || 0 } })()`);
    ok(best.visto >= 1, `el rastreador que viste de cerca quedó en el bestiario (${best.visto})`);
    await js(`(()=>{ const H = window.__hojarasca, b = window.__bicho; for (let i = 0; i < 3; i++) { H.desafio.anotarEnBestiario('rastreador', 'abatido'); } return 1 })()`);
    await js(`(()=>{ const H = window.__hojarasca; H.abrir('cuaderno'); return 1 })()`);
    await esperar(1200);
    const tab = await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista .pestanas button')].find((x) => /Bestiario/.test(x.textContent)); if (b) b.click(); return !!b })()`);
    await esperar(800);
    const ficha = await js(`document.getElementById('cuaderno-ficha').textContent`);
    ok(tab, 'el cuaderno del Desafío tiene la pestaña Bestiario');
    ok(/Rastreador/.test(ficha) && /Punto débil/.test(ficha), `con la ficha del rastreador completa («${ficha.slice(0, 90)}…»)`);
    await js(`window.__hojarasca.volverAlJuego(); 1`);

    // ---- 4. el asedio: encerrado en una casilla, primero tantean
    seccion('4. el asedio');
    const casilla = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, O = H.obras, P = H.progreso;
      for (const k of ['tronco','tabla','piedra','ramita']) P.materiales[k] = 200;
      const plano = H.PLANOS.find((q) => q.id === 'casilla'); if (!plano) return 'sin plano';
      O.elegir(plano);
      for (const d of [6, 8, 10, 12, 14]) {
        const x = js.pos.x - Math.sin(js.yaw) * d, z = js.pos.z - Math.cos(js.yaw) * d;
        const r = O.fundar(x, z, js.yaw, js.pos.y); if (!r.ok) continue;
        let a; for (let i = 0; i < 12; i++) { a = O.avanzar(r.obra, P.materiales); if (!a.ok) break; }
        O.elegir(null);
        window.__casa = r.obra;
        return { etapas: r.obra.datos.etapas, total: r.obra.plano.etapas.length, x: r.obra.datos.x, z: r.obra.datos.z };
      }
      O.elegir(null); return 'no se pudo fundar' })()`);
    ok(typeof casilla === 'object' && casilla.etapas === casilla.total, `se levanta una casilla (${JSON.stringify(casilla)})`);
    if (typeof casilla === 'object') {
      const adentro = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, c = window.__casa;
        js.pos.set(c.datos.x, (c.datos.y ?? js.pos.y) + 0.1, c.datos.z);
        return !!H.obras.dentro(js.pos) })()`);
      ok(adentro, 'el jugador queda adentro');
      await js(`(()=>{ const H = window.__hojarasca, c = window.__casa;
        for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
        H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
        const a = H.desafio.invocar('rastreador', c.datos.x + 2.6, c.datos.z);
        a.vida = a.vidaMax = 999; a.estado = 'romper'; a.obra = c; a.cd = 0;
        c.datos.vida = 800;
        H.desafio.ultimosOidos.length = 0;
        window.__sitiador = a; return 1 })()`);
      await simular(0.7);   // también actualiza el "estás adentro"
      const vida0 = await js(`(()=>{ const c = window.__casa; return c.datos.vida })()`);
      await simular(1.2);
      const tanteo = await js(`(()=>{ const H = window.__hojarasca, a = window.__sitiador, c = window.__casa;
        // en pantalla quedan los tres últimos; el historial de lo oído tiene más
        return { total: +a.tanteoTotal.toFixed(2), t: +a.tanteo.toFixed(2), vida: c.datos.vida, escritos: H.desafio.ultimosOidos.join(' | '), notas: document.getElementById('notas').textContent } })()`);
      ok(tanteo.total > 1.5, `con vos adentro, primero tantea (${tanteo.total} s)`);
      ok(tanteo.vida === vida0, `mientras tantea no rompe nada (${vida0} → ${tanteo.vida})`);
      ok(/arañazos en la pared/.test(tanteo.escritos), `se lo oye rascar: «${tanteo.escritos}»`);
      ok(/Tantean las paredes/.test(tanteo.notas), 'y el juego lo avisa');
      await simular(4);
      const golpea = await js(`(()=>{ const H = window.__hojarasca, c = window.__casa; return { vida: c.datos.vida, escritos: H.__sonidosEscritos().join(' | ') } })()`);
      ok(golpea.vida < vida0, `después golpea de verdad (${vida0} → ${golpea.vida})`);
    }

    // ---- 5. la noche sin luces
    seccion('5. la noche sin luces');
    const luces = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, O = H.obras, P = H.progreso;
      const plano = H.PLANOS.find((q) => q.plano?.defensa?.tipo === 'antorcha' || q.defensa?.tipo === 'antorcha'); if (!plano) return 'sin antorcha';
      let n = 0;
      for (const [dx, dz] of [[4, 0], [-4, 0], [0, 4], [0, -4], [5, 5]]) {
        O.elegir(plano);
        const r = O.fundar(js.pos.x + dx + 20, js.pos.z + dz + 20, 0, js.pos.y); if (!r.ok) continue;
        for (let i = 0; i < 6; i++) { const a = O.avanzar(r.obra, P.materiales); if (!a.ok) break; }
        n++;
      }
      O.elegir(null);
      H.desafio.defensas.refrescar();
      for (const a of H.desafio.defensas.antorchas) a.datos.apagada = false;
      P.desafio.especial = 'apagon';
      // que haya invasores vivos: la noche sin luces es mientras dura el ataque
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const b = H.desafio.invocar('rastreador', js.pos.x + 60, js.pos.z + 60); b.vida = b.vidaMax = 999; b.estado = 'quieto';
      return { n, prendidas: H.desafio.defensas.prendidas.length } })()`);
    ok(typeof luces === 'object' && luces.prendidas >= 2, `hay antorchas prendidas (${JSON.stringify(luces)})`);
    if (typeof luces === 'object') {
      // cada una tarda entre 8 y 34 s en elegirse, y 1,6 s en ahogarse temblando
      await simular(40);
      await esperar(3000);          // el titileo corre en el cuadro de las defensas
      await simular(4);
      const apagadas = await js(`(()=>{ const H = window.__hojarasca; return { prendidas: H.desafio.defensas.prendidas.length, notas: document.getElementById('notas').textContent, escritos: H.__sonidosEscritos().join(' | ') } })()`);
      ok(apagadas.prendidas < luces.prendidas, `se apagan de a una (${luces.prendidas} → ${apagadas.prendidas})`);
      ok(/Se apagan las luces/.test(apagadas.notas), 'y el juego lo avisa');
      await js(`(()=>{ window.__hojarasca.progreso.desafio.especial = null; return 1 })()`);
    }

    // ---- 9. las noches después: la opción del final, los mutados y su regeneración
    seccion('9. las noches después');
    const elegidas = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio;
      D.victoria = true; D.nido = { x: 0, z: 0, pistas: 3, cercoX: 0, cercoZ: 0, camaras: [0, 0, 0], caido: true };
      const ok1 = H.desafio.empezarDespues();
      return { ok1, despues: JSON.stringify(D.despues), boton: !!document.getElementById('victoria-despues') } })()`);
    ok(elegidas.ok1 && /"activo":true/.test(elegidas.despues), `se eligen las noches después (${elegidas.despues})`);
    ok(elegidas.boton, 'el final tiene el botón para elegirlas');
    const mut = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado; let mutados = 0, total = 0, vida = 0;
      const R = Math.random; Math.random = () => 0.01;   // que salgan mutados
      try {
        for (let i = 0; i < 3; i++) {
          const a = H.desafio.invocar('rastreador', js.pos.x + 30 + i * 3, js.pos.z + 30);
          total++; if (a.mutado) { mutados++; vida = a.vidaMax; }
        }
      } finally { Math.random = R; }
      return { mutados, total, vida } })()`);
    ok(mut.mutados === mut.total, `en las noches después bajan mutados (${mut.mutados}/${mut.total}, vida ${mut.vida} contra 40)`);
    const regen = await js(`(()=>{ const H = window.__hojarasca; const a = H.desafio.aliens.find((x) => x.mutado); if (!a) return null;
      a.vida = a.vidaMax * 0.5; a.sinGolpe = 10; a.estado = 'quieto'; window.__mutado = a; return a.vida })()`);
    await simular(2);
    const regen2 = await js(`window.__mutado ? window.__mutado.vida : null`);
    ok(regen !== null && regen2 > regen, `si lo dejás respirar, se cura (${regen} → ${regen2 && regen2.toFixed(1)})`);
    const venas = await js(`(()=>{ const u = window.__mutado.m.uniformes(); return '#' + u.uVena.value.getHexString() })()`);
    ok(venas === '#ff5a2a', `con las venas de otro color (${venas})`);
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});
