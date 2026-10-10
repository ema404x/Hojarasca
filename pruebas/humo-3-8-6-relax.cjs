// 3.8.6 (relax): lo del pase de bugs del Relax base que necesita el mundo 3D, en el juego de verdad:
//   1. con el mando solo, la tarjeta de la historia («La llegada») se contesta con A (antes trababa el juego);
//   2. un cantero no entra adentro de un Puesto (las obras grandes y las piezas no se enciman), y al lado sí;
//   3. mover el embarcadero (Shift+Y) se lleva el kayak amarrado, y al recargar amanece ahí;
//   4. la carpa: «T Armar la carpa» no sale en el kayak; armarla y levantarla no deja geometrías sueltas;
//   5. el entumecido se guarda: después de recargar seguís entumecido.
// Uso: HOJ_PERFIL=<carpeta> npx electron --no-sandbox -r ./herramientas/perfil-propio.cjs pruebas/humo-3-8-6-relax.cjs
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', 'perfil-relax-386')));
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
  const abrir = async () => {
    try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); }
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__valle && window.__hojarasca.__caidas && window.__hojarasca.__caidas.modo() === "inicio")').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre' }, ${JSON.stringify(extra || {})})));`;
  const cuadros = (n = 4) => js(`(async ()=>{ for (let i = 0; i < ${n}; i++) { ${H}.__bucle(); await new Promise(r => setTimeout(r, 20)); } return 1 })()`);
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2000); await cuadros(4); };

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });

    // ============================================================ 1. la tarjeta de la historia con el mando
    seccion('1. la tarjeta de la historia con el mando');
    await abrir();
    await js(`localStorage.clear(); ${ajustes({ relaxTipo: 'historia' })} 1`);
    ok(await abrir(), 'una partida con historia');
    await entrar();
    await js(`${H}.__valle.revisarAhora(); 1`);
    await cuadros(3);
    const t0 = await js(`({ abierta: ${H}.__valle.abierta(), modo: ${H}.__caidas.modo(), texto: document.getElementById('valle-tarjeta').textContent.slice(0, 60) })`);
    ok(t0.abierta && t0.modo === 'valle', `se abre «La llegada» (${JSON.stringify(t0)})`);
    const m = await js(`(async()=>{ const pad = { id: 'Mando de prueba', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      ${H}.mando.opciones.leerCrudo = () => pad;
      const cuadros = async (n) => { for (let i = 0; i < n; i++) { ${H}.__bucle(); await new Promise(r => setTimeout(r, 30)); } };
      const tocar = async (b) => { pad.buttons[b].pressed = true; pad.buttons[b].value = 1; await cuadros(3); pad.buttons[b].pressed = false; pad.buttons[b].value = 0; await cuadros(3); };
      await cuadros(3);
      await tocar(13);   // la cruceta: mueve (con un solo botón, queda en ése)
      await tocar(0);    // A
      const r = { abierta: ${H}.__valle.abierta(), modo: ${H}.__caidas.modo(), fase: ${H}.progreso.historia.fase };
      delete ${H}.mando.opciones.leerCrudo; return r; })()`);
    ok(!m.abierta && m.modo === 'jugando' && m.fase === 'jugando', `A la contesta y se vuelve al juego (${JSON.stringify(m)})`);

    // ============================================================ 2. un cantero adentro de un Puesto
    seccion('2. obras grandes y piezas');
    await abrir();
    await js(`localStorage.clear(); ${ajustes({ relaxTipo: 'libre' })} 1`);
    ok(await abrir(), 'una partida libre');
    await entrar();
    const p = await js(`(()=>{ const O = ${H}.obras, P = ${H}.progreso, R = ${H}.T.lugares.refugio, js = ${H}.jugador.estado;
      Object.assign(P.materiales, { tronco: 200, tabla: 200, piedra: 200 });
      const puesto = ${H}.PLANOS.find((q) => q.id === 'puesto'), cantero = ${H}.PLANOS.find((q) => q.id === 'cantero');
      for (let d = 18; d < 70; d += 4) for (let a = 0; a < 6.28; a += 0.5) {
        const x = R.x + Math.cos(a) * d, z = R.z + Math.sin(a) * d;
        js.pos.set(x, ${H}.T.altura(x, z) + 0.05, z);
        O.elegir(puesto); const r = O.fundar(x, z, 0, js.pos.y); O.elegir(null);
        if (!r.ok) continue;
        for (let g = 0; g < 12 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const k = O.avanzar(r.obra, P.materiales); if (!k.ok) break; }
        P.obras = O.obras.map((o) => o.datos);
        const adentro = O.revisarSitio(x + 0.6, z + 0.4, cantero, 0);
        const afuera = O.revisarSitio(x + 7.5, z, cantero, 0);
        return { x, z, terminado: r.obra.datos.etapas >= r.obra.plano.etapas.length, adentro: adentro.ok || adentro.motivo, afuera: afuera.ok || afuera.motivo };
      }
      return null })()`);
    ok(p && p.terminado, `un Puesto terminado (${JSON.stringify(p)})`);
    ok(p && p.adentro !== true && /encima/.test(p.adentro), `un cantero adentro del Puesto, no («${p && p.adentro}»)`);
    ok(p && (p.afuera === true || !/encima/.test(String(p.afuera))), `al lado, el Puesto no molesta (${p && p.afuera})`);

    // ============================================================ 3. el embarcadero se mueve con el kayak
    seccion('3. mover el embarcadero con el kayak amarrado');
    const emb = await js(`(()=>{ const O = ${H}.obras, P = ${H}.progreso, js = ${H}.jugador.estado, plano = ${H}.PLANOS.find((q) => q.id === 'embarcadero');
      const L = { x: 150, z: 110 }; const sitios = [];
      for (let a = 0; a < 6.28 && sitios.length < 2; a += 0.05) for (let r = 90; r < 135 && sitios.length < 2; r += 0.7) {
        const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
        // (la segunda, con el mismo rumbo que la primera: al mover, la pieza conserva su giro)
        for (let k = 0; k < 8; k++) { const rot = sitios.length ? sitios[0].rot : k * Math.PI / 4; if (O.revisarSitio(x, z, plano, rot).ok && (!sitios.length || Math.hypot(sitios[0].x - x, sitios[0].z - z) > 25)) { sitios.push({ x, z, rot }); break; } }
      }
      if (sitios.length < 2) return { error: 'no hay dos orillas' };
      const s = sitios[0];
      js.pos.set(s.x, ${H}.T.altura(s.x, s.z) + 0.1, s.z);
      O.elegir(plano); const r = O.fundar(s.x, s.z, s.rot, js.pos.y); O.elegir(null);
      if (!r.ok) return { error: r.motivo };
      for (let g = 0; g < 12 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const k = O.avanzar(r.obra, P.materiales); if (!k.ok) break; }
      P.obras = O.obras.map((o) => o.datos);
      return { a: s, b: sitios[1], terminado: r.obra.datos.etapas >= r.obra.plano.etapas.length } })()`);
    ok(emb && emb.terminado, `un embarcadero (${JSON.stringify(emb)})`);
    if (emb && emb.terminado) {
      await esperar(1500);
      await js(`${H}.__actualizarCasaViva(3); 1`);
      const antes = await js(`({ amarre: ${H}.progreso.kayakAmarre, k: { x: ${H}.kayak.est.x, z: ${H}.kayak.est.z } })`);
      ok(antes.amarre && Math.hypot(antes.amarre.x - emb.a.x, antes.amarre.z - emb.a.z) < 0.1, `el kayak, amarrado ahí (${JSON.stringify(antes)})`);
      // Shift+Y en el modo obra: levantarlo y llevarlo a la otra orilla
      const mov = await js(`(()=>{ const O = ${H}.obras, js = ${H}.jugador.estado, b = ${JSON.stringify(emb.b)};
        js.pos.set(${emb.a.x}, ${H}.T.altura(${emb.a.x}, ${emb.a.z}) + 0.1, ${emb.a.z});
        const r = O.iniciarEdicionCerca(js.pos, 5.0); if (!r.ok) return { error: r.motivo };
        const dist = O.plano?.distancia || 2.4;
        // (el rumbo de la pieza sale de hacia dónde mirás: se prueba mirando para cada lado hasta que entre)
        for (let k = 0; k < 16 && O.editando; k++) {
          js.yaw = k * Math.PI / 8; js.pos.set(b.x + Math.sin(js.yaw) * dist, ${H}.T.altura(b.x, b.z) + 0.1, b.z + Math.cos(js.yaw) * dist);
          ${H}.__aldea.accionObra();
        }
        const editando = !!O.editando; if (editando) O.cancelarEdicion();
        const o = O.obras.find((q) => q.plano.id === 'embarcadero');
        return { x: o.datos.x, z: o.datos.z, editando, nota: document.getElementById('notas').textContent.slice(-80) } })()`);
      const movido = mov && !mov.error && Math.hypot(mov.x - emb.a.x, mov.z - emb.a.z) > 10;
      ok(movido, `el embarcadero se movió (${JSON.stringify(mov)})`);
      if (movido) {
        const despues = await js(`({ amarre: ${H}.progreso.kayakAmarre, k: { x: ${H}.kayak.est.x, z: ${H}.kayak.est.z } })`);
        ok(despues.amarre && Math.hypot(despues.amarre.x - mov.x, despues.amarre.z - mov.z) < 0.1 && Math.hypot(despues.k.x - mov.x, despues.k.z - mov.z) < 5, `el kayak se fue con él (${JSON.stringify(despues)})`);
        await js(`${H}.guardar(); 1`);
        ok(await abrir(), 'recargó');
        await entrar();
        const vuelta = await js(`({ k: { x: ${H}.kayak.est.x, z: ${H}.kayak.est.z } })`);
        ok(Math.hypot(vuelta.k.x - mov.x, vuelta.k.z - mov.z) < 5, `y al recargar amanece en el embarcadero movido (${JSON.stringify(vuelta)})`);
      }
    }

    // ============================================================ 4. la carpa
    seccion('4. la carpa');
    const c = await js(`(async ()=>{ const P = ${H}.progreso, js = ${H}.jugador.estado, R = ${H}.T.lugares.refugio; P.cosas.manta = 1; P.carpa = null;
      const aviso = () => document.getElementById('aviso')?.textContent || '';
      // un lugar llano y seco, lejos de todo (prueba varios)
      let aPie = '', flags = null;
      for (let d = 20; d < 120 && !/Armar la carpa/.test(aPie); d += 7) {
        const x = R.x + d, z = R.z - d * 0.6; js.pos.set(x, ${H}.T.altura(x, z) + 0.3, z); js.vel?.set?.(0, 0, 0);
        for (let i = 0; i < 12; i++) { ${H}.__bucle(); await new Promise(r => setTimeout(r, 25)); }
        aPie = aviso(); flags = { enSuelo: js.enSuelo, plataforma: !!js.enPlataforma, nadando: js.nadando, d };
      }
      js.enKayak = true; for (let i = 0; i < 3; i++) ${H}.__bucle(); const enKayak = aviso(); js.enKayak = false;
      const info = () => ${H}.renderer.info.memory.geometries;
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyT', bubbles: true }));
      for (let i = 0; i < 3; i++) ${H}.__bucle();
      const armada = !!P.carpa, g1 = info();
      for (let v = 0; v < 4; v++) for (const t of ['KeyT', 'KeyT']) { document.dispatchEvent(new KeyboardEvent('keydown', { code: t, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: t, bubbles: true })); for (let i = 0; i < 3; i++) ${H}.__bucle(); }
      return { aPie, enKayak, armada, g1, g2: info(), sigue: !!P.carpa, flags } })()`);
    ok(/Armar la carpa/.test(c.aPie) && !/Armar la carpa/.test(c.enKayak), `«T Armar la carpa» a pie sí, en el kayak no («${c.aPie}» / «${c.enKayak}» ${JSON.stringify(c.flags)})`);
    ok(c.armada && c.sigue && c.g2 <= c.g1 + 1, `armar y levantar la carpa cuatro veces no suma geometrías (${c.g1} → ${c.g2})`);

    // ============================================================ 5. el entumecido se guarda
    seccion('5. el entumecido se guarda');
    await js(`(()=>{ ${H}.jugador.estado.entumecido = 1.5; ${H}.guardar(); return 1 })()`);
    ok(await abrir(), 'recargó');
    await entrar();
    const e = await js(`${H}.jugador.estado.entumecido`);
    ok(e > 1.3 && e <= 1.5, `después de recargar seguís entumecido (${e})`);
  } catch (e) {
    ok(false, `excepción: ${e && e.stack ? e.stack : e}`);
  }
  console.log(errores.length ? `\nFALLAS (${errores.length}):\n${errores.join('\n')}` : '\nTODO BIEN');
  app.exit(errores.length ? 1 : 0);
});
