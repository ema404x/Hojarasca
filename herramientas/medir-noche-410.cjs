// 4.10 (noche): cuánto cuesta el Desafío DE NOCHE en pleno combate, escena por escena, en la misma sesión:
//   1 referencia      base de noche sin duendes
//   2 normal          ~30 duendes (el tope los corta) y 10 defensas
//   3 niebla          lo mismo con la noche de niebla (ambiente, fondo)
//   4 luna-llena      luna llena, viejos oscuros
//   5 enjambre        la docena de duendecitos y el curandero (más unos cuantos de los de siempre)
//   6 aliados         noche grande: Anselmo, Herminia (fogones), Martín y los chicos, trampas de miel y el farol de mano
//   7 coihue-camina   el asedio con el Coihue caminando (temblor, polvo, huellas, sombra) y el cerco, con duendes
//   8 subida          la subida al Coihue con sus peligros (de día, como el juego)
// Cada escena: asienta ASIENTO cuadros y mide CUADROS con el bucle a mano (`__bucle` + `gl.finish`, límite de cuadros libre):
// p50, p95, p99, % de cuadros de más de 16,7 ms, dibujos y triángulos por cuadro. Una escena que no se puede armar queda
// «no armada» con el motivo (no falla). No cambia nada del juego.
// Uso (desde la carpeta de la versión, después de `node armar.mjs`):
//   SALIDA=<archivo.json> CALIDAD=alta electron -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs herramientas/medir-noche-410.cjs
//   (con HOJ_PERFIL=<carpeta propia>). Opciones: CUADROS=200 ASIENTO=150 ESCENAS=a,b  FOTOS=<carpeta> (ventana visible 1280x720 y
//   una captura por escena, sin HUD)  VENTANA=1 (visible sin capturas)  DUENDES=30
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const HTML = path.resolve(process.env.HTML || path.join(process.cwd(), 'index.html'));
const SALIDA = path.resolve(process.env.SALIDA || './medir-noche-410.json');
const CALIDAD = process.env.CALIDAD || 'alta';
const CUADROS = Number(process.env.CUADROS || 200);
const ASIENTO = Number(process.env.ASIENTO || 150);
const DUENDES = Number(process.env.DUENDES || 30);
const FOTOS = process.env.FOTOS ? path.resolve(process.env.FOTOS) : null;
const VENTANA = !!process.env.VENTANA || !!FOTOS;
const SOLO = process.env.ESCENAS ? process.env.ESCENAS.split(',') : null;
const LIMITE = 1000 / 60;
const perfil = process.env.HOJ_PERFIL || (process.argv.find((a) => a.startsWith('--user-data-dir=')) || '').slice(16) || path.join(path.dirname(SALIDA), 'perfil-noche');
app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const r = { html: HTML, calidad: CALIDAD, cuadros: CUADROS, asiento: ASIENTO, ventana: VENTANA, inicio: new Date().toISOString(), escenas: {}, errores: [] };
  const w = new BrowserWindow({ show: VENTANA, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon|AudioContext/.test(m)) r.errores.push(m.slice(0, 300));
  });
  const js = (c, lim = 300000) => Promise.race([w.webContents.executeJavaScript(c, true), esperar(lim).then(() => { throw new Error('sin respuesta'); })]);
  const H = 'window.__hojarasca';
  const quiere = (id) => !SOLO || SOLO.includes(id);

  // el fijado de cada cuadro (jugador clavado, salud, hora) vive en la página: window.__pin
  const pinBase = `window.__pin = () => { const H = ${H}, js = H.jugador.estado, q = window.__vista; H.progreso.desafio.salud = 1e5; H.progreso.horas = q.horas; js.pos.x = q.x; js.pos.z = q.z; if (q.y !== undefined) js.pos.y = q.y; js.yaw = q.yaw; js.pitch = q.pitch ?? -0.05; js.vel.set(0, 0, 0); if (window.__pinCoihue) window.__pinCoihue(); };`;
  const poner = (v) => js(`window.__vista = ${JSON.stringify(v)}; 1`);

  const medir = async (id, extra = {}) => {
    const e = { id, ...extra };
    try {
      await js(`(()=>{ ${pinBase} const H = ${H}; for (let i = 0; i < ${ASIENTO}; i++) { window.__pin(); H.__bucle(); } return 1 })()`);
      await esperar(300);
      const m = await js(`(()=>{ const H = ${H}, R = H.renderer, gl = R.getContext(); const ms = []; let llamadas = 0, tri = 0; const auto = R.info.autoReset; R.info.autoReset = false;
        const p0 = R.info.programs.length;
        for (let i = 0; i < ${CUADROS}; i++) { window.__pin(); R.info.reset(); const t0 = performance.now(); H.__bucle(); gl.finish(); ms.push(performance.now() - t0); llamadas += R.info.render.calls; tri += R.info.render.triangles; }
        R.info.autoReset = auto;
        const o = ms.slice().sort((a, b) => a - b), f = (k) => +o[Math.min(o.length - 1, Math.floor(o.length * k))].toFixed(2);
        const sub = {}; try { for (const [k, s] of H.perfilador.stats) sub[k] = +s.ema.toFixed(2); } catch {}
        const vivos = H.desafio.aliens.filter((a) => a.estado !== 'morir' && a.estado !== 'irse').length;
        return { p50: f(0.5), p95: f(0.95), p99: f(0.99), max: +o[o.length - 1].toFixed(2), medio: +(ms.reduce((s, x) => s + x, 0) / ms.length).toFixed(2), pasan: +(ms.filter((x) => x > ${LIMITE}).length / ms.length * 100).toFixed(1),
          dibujos: Math.round(llamadas / ${CUADROS}), triangulos: Math.round(tri / ${CUADROS}), programasNuevos: R.info.programs.length - p0, vivos, sub } })()`);
      Object.assign(e, m);
      console.log(`${id.padEnd(16)} p50 ${m.p50} p95 ${m.p95} p99 ${m.p99} · >16,7: ${m.pasan}% · ${m.dibujos} dibujos · ${(m.triangulos / 1000).toFixed(0)}k tri · ${m.vivos} duendes vivos${e.nota ? ' · ' + e.nota : ''}`);
      if (FOTOS) {
        fs.mkdirSync(FOTOS, { recursive: true });
        await js(`(()=>{ if (!document.getElementById('__sinhud')) { const s = document.createElement('style'); s.id = '__sinhud'; s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); }
          ${pinBase} const H = ${H}; for (let i = 0; i < 6; i++) { window.__pin(); H.__bucle(); } window.__pinT = setInterval(window.__pin, 6); return 1 })()`);
        await esperar(900);
        let img = null;
        for (let k = 0; k < 4 && !img; k++) { try { const c = await w.webContents.capturePage(); if (c && !c.isEmpty()) img = c; } catch { await esperar(1200); } if (!img) await esperar(500); }
        await js(`clearInterval(window.__pinT); 1`);
        if (img) { fs.writeFileSync(path.join(FOTOS, `${id}.png`), img.toPNG()); e.foto = `${id}.png`; } else e.foto = null;
      }
    } catch (x) { e.noArmada = 'falló al medir: ' + (x && x.message ? x.message : x); console.log(`${id.padEnd(16)} NO ARMADA: ${e.noArmada}`); }
    r.escenas[id] = e;
  };
  const noArmada = (id, motivo) => { r.escenas[id] = { id, noArmada: motivo }; console.log(`${id.padEnd(16)} NO ARMADA: ${motivo}`); };

  // suelta `n` duendes de todos los tipos a la vista, en abanico, que pelean de verdad (vida enorme). `extra`: [[tipo, cantidad]]; `viejos`: los viste de viejos
  const soltar = (n, extra = [], viejos = false) => js(`(()=>{ const H = ${H}, D = H.desafio, js = H.jugador.estado, q = window.__vista;
    for (const a of D.aliens) { a.estado = 'irse'; a.t = 9; } for (let i = 0; i < 3; i++) H.__bucle();
    const tipos = ['rastreador', 'tirador', 'saltador', 'escupidor', 'excavador', 'volador', 'bruto', 'rastreador'];
    const poner = (t, k, c, r0, dr, abanico) => { const ang = q.yaw + Math.PI + (k / Math.max(1, c) - 0.5) * abanico, r = r0 + (k % 5) * dr; const a = D.invocar(t, q.x + Math.sin(ang) * r, q.z + Math.cos(ang) * r);
      if (a) { a.vida = a.vidaMax = 1e6; if (${viejos}) { try { a.m.vestir(true, 1); } catch {} } } return a; };
    let hechos = 0; for (let k = 0; k < ${n}; k++) if (poner(tipos[k % tipos.length], k, ${n}, 12, 6, 1.4)) hechos++;
    for (const [t, c] of ${JSON.stringify(extra)}) for (let k = 0; k < c; k++) if (poner(t, k, c, 14, 3, 1.2)) hechos++;
    for (let i = 0; i < 30; i++) { H.progreso.desafio.salud = 1e5; H.__bucle(); }
    return { pedidos: ${n} + ${JSON.stringify(extra)}.reduce((s, x) => s + x[1], 0), hechos } })()`);
  const limpiar = () => js(`(()=>{ const H = ${H}, D = H.desafio; for (const a of D.aliens) { a.estado = 'irse'; a.t = 9; } for (let i = 0; i < 4; i++) { H.progreso.desafio.salud = 1e5; H.__bucle(); } return 1 })()`);

  try {
    await w.loadFile(HTML, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(JSON.stringify({ calidad: CALIDAD, clima: 'despejado', musica: false, modo: 'desafio', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', modoFluido: false }))}); 1`);
    await w.loadFile(HTML, { search: '?debug=1' });
    for (let i = 0; i < 1200; i++) { await esperar(250); if (await js('!!window.__hojarasca && !!document.getElementById("btn-entrar")', 5000).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    r.version = await js(`document.title`).catch(() => null);
    // la noche, en la base, mirando al bosque (la noche 6: ya hay de todo; sin oleada propia, los duendes los pone esto)
    await js(`(()=>{ const H = ${H}, D = H.progreso.desafio; H.ajustes.limiteFps = 'libre'; D.tutorial = 99; D.oleadas = 6; H.progreso.dia++; H.progreso.horas = 19.4;
      for (let i = 0; i < 30; i++) { H.progreso.horas += 0.01; H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); } H.progreso.horas = 20.6;
      for (let i = 0; i < 20; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      for (const a of H.desafio.aliens) { a.estado = 'irse'; a.t = 9; } H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      H.ajustes.duracion = 45; return 1 })()`);
    const base = await js(`(()=>{ const js = ${H}.jugador.estado; return { x: js.pos.x, z: js.pos.z, yaw: js.yaw } })()`);
    r.base = base;
    // 10 defensas (8 tramos de empalizada y 2 torres de vigía) y 2 antorchas: la base de verdad
    r.defensas = await js(`(()=>{ const H = ${H}, O = H.obras, P = H.progreso, j = H.jugador.estado; let n = 0; const errores = [];
      Object.assign(P.materiales, { tronco: 999, tabla: 999, piedra: 999, cristal: 99 });
      const poner = (id, x, z, rot) => { const p = H.PLANOS.find((q) => q.id === id); if (!p) { errores.push('sin plano ' + id); return; } O.elegir(p); const f = O.fundar(x, z, rot, j.pos.y); O.elegir(null); if (!f.ok) { errores.push(id + ': ' + f.motivo); return; }
        for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { if (!O.avanzar(f.obra, P.materiales).ok) break; } n++; };
      // (ocho tramos de empalizada: si un tramo cae en un edificio del valle, se prueba más cerca o más lejos)
      for (let k = 0; k < 12 && n < 8; k++) { if (k % 6 === 2) continue; const a = k / 12 * Math.PI * 2; for (const rad of [9, 11, 7, 13]) { const antes = n; poner('empalizada', j.pos.x + Math.sin(a) * rad, j.pos.z + Math.cos(a) * rad, a); if (n > antes) break; } }
      for (let k = 0; k < 2; k++) { const a = k * Math.PI + 0.4; poner('torre-vigia', j.pos.x + Math.sin(a) * 6, j.pos.z + Math.cos(a) * 6, 0); poner('antorcha', j.pos.x + Math.sin(a + 0.5) * 7, j.pos.z + Math.cos(a + 0.5) * 7, 0); }
      P.obras = O.obras.map((o) => o.datos); H.desafio.defensas.refrescar(); H.desafio.fortin.refrescar(); return { obras: O.obras.length, puestas: n, errores } })()`);
    console.log('defensas: ' + JSON.stringify(r.defensas));
    await poner({ ...base, horas: 22.8 });
    r.programas0 = await js(`${H}.renderer.info.programs.length`);

    // ---------------------------------------------------------------- 1 referencia
    if (quiere('referencia')) { await limpiar(); await medir('referencia'); }
    // ---------------------------------------------------------------- 2 normal
    if (quiere('normal')) { await limpiar(); const s = await soltar(DUENDES); await medir('normal', { nota: `${s.hechos} de ${s.pedidos} duendes`, soltados: s }); }
    // ---------------------------------------------------------------- 3 niebla
    if (quiere('niebla')) {
      await limpiar(); await js(`(()=>{ const D = ${H}.progreso.desafio; D.especial = 'niebla'; return 1 })()`);
      const s = await soltar(DUENDES); await medir('niebla', { nota: `${s.hechos} de ${s.pedidos} duendes`, soltados: s });
      await js(`${H}.progreso.desafio.especial = null; 1`);
    }
    // ---------------------------------------------------------------- 4 luna llena
    if (quiere('luna-llena')) {
      await limpiar(); await js(`(()=>{ const D = ${H}.progreso.desafio; D.especial = 'lunallena'; return 1 })()`);
      const s = await soltar(Math.round(DUENDES * 0.7), [], true); await medir('luna-llena', { nota: `${s.hechos} de ${s.pedidos} duendes, vestidos de viejos`, soltados: s });
      await js(`${H}.progreso.desafio.especial = null; 1`);
    }
    // ---------------------------------------------------------------- 5 enjambre + curandero
    if (quiere('enjambre')) {
      await limpiar();
      const s = await soltar(16, [['enjambre', 12], ['curandero', 2]]);
      const hay = await js(`${H}.desafio.aliens.filter((a) => a.estado !== 'morir' && a.estado !== 'irse').reduce((m, a) => { const t = a.tipo || (a.def && a.def.nombre) || '?'; m[t] = (m[t] || 0) + 1; return m }, {})`);
      await medir('enjambre', { nota: `${s.hechos} de ${s.pedidos} duendes`, soltados: s, porTipo: hay });
    }
    // ---------------------------------------------------------------- 6 aliados + fogones + miel + farol
    if (quiere('aliados')) {
      try {
        await limpiar();
        const ok6 = {};
        await js(`(()=>{ const H = ${H}, D = H.progreso.desafio; D.companeros = []; D.ordenes = {}; D.puestosAliados = {}; D.aldea = D.aldea || {}; D.aldea.ayuda = Object.assign(D.aldea.ayuda || {}, { anselmo: 1, herminia: 1, martin: 1, chicos: 1 }); D.miel = 20; H.progreso.cosas = H.progreso.cosas || {}; H.progreso.cosas.farolMano = 1;
          D.oleadas = 11; D.especial = null; D.oleadaNoche = null; D.oleadaTerminada = true; H.progreso.dia++; H.progreso.horas = 19.7; return 1 })()`);
        // los vecinos vienen de a poco y Herminia prende los fuegos: se los deja pasar con la hora de la tarde, sin duendes
        let presentes = [];
        for (let k = 0; k < 90 && presentes.length < 4; k++) presentes = await js(`(()=>{ const H = ${H}; for (let i = 0; i < 10; i++) { H.progreso.desafio.salud = 1e5; H.progreso.horas = 19.7; for (const a of H.desafio.aliens) { a.estado = 'irse'; a.t = 9; } H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); H.gente.actualizar(0.05, H.jugador.estado, H.camara, null, 0); } return H.desafio.vecinos.presentes() })()`);
        ok6.presentes = presentes;
        await js(`(()=>{ const H = ${H}; for (let k = 0; k < 600; k++) { H.progreso.desafio.salud = 1e5; H.progreso.horas = 19.7; H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); H.gente.actualizar(0.05, H.jugador.estado, H.camara, null, 0); } return 1 })()`);
        ok6.fuegos = await js(`${H}.desafio.vecinos.fuegosPrendidos().length`);
        // tres trampas de miel en el camino de los duendes
        ok6.miel = await js(`(()=>{ const H = ${H}, q = window.__vista; let n = 0; const motivos = []; for (let k = 0; k < 3; k++) { const ang = q.yaw + Math.PI + (k - 1) * 0.5, x = q.x + Math.sin(ang) * 12, z = q.z + Math.cos(ang) * 12; const t = H.desafio.colocarTrampaMiel(x, z, { gratis: true }); if (t && t.ok) n++; else motivos.push(t && t.motivo); } return { n, motivos } })()`);
        // el farol de mano encendido (de noche, sin lluvia)
        await js(`(()=>{ const H = ${H}; H.clima.estado.lluvia = 0; if (!H.desafio.farolPrendido) H.desafio.alternarFarol(); for (let i = 0; i < 4; i++) H.__bucle(); return 1 })()`);
        ok6.farol = await js(`${H}.desafio.farolPrendido`);
        await poner({ ...base, horas: 22.8 });
        const s = await soltar(DUENDES, [['curandero', 1]], true);
        ok6.cuerpos = await js(`${H}.gente.gente.filter((g) => g.claveAliado).length`);
        await medir('aliados', { nota: `${s.hechos} duendes; vecinos ${ok6.presentes.length}/4, fuegos ${ok6.fuegos}, miel ${ok6.miel.n}/3, farol ${ok6.farol ? 'sí' : 'NO'}`, soltados: s, armado: ok6 });
        if (ok6.presentes.length < 4 || !ok6.farol || ok6.miel.n < 3) r.escenas.aliados.incompleta = true;
      } catch (x) { noArmada('aliados', String(x && x.message ? x.message : x)); }
    }
    // ---------------------------------------------------------------- 7 el Coihue caminando + 8 la subida
    if (quiere('coihue-camina') || quiere('subida')) {
      try {
        await limpiar();
        await js(`(()=>{ const H = ${H}, js = H.jugador.estado; if (H.desafio.farolPrendido) H.desafio.alternarFarol(); return 1 })()`);
        const sit = await js(`(()=>{ const H = ${H}, T = H.T, c = { x: ${base.x}, z: ${base.z} }; let mejor = null;
          for (let a = 0; a < 48; a++) { const x = c.x + Math.cos(a / 48 * 6.283) * 62, z = c.z + Math.sin(a / 48 * 6.283) * 62; if (T.agua(x, z)) continue;
            let mojado = false, des = 0; for (let k = 0; k < 10 && !mojado; k++) for (const e of [8, 16, 26]) { const qx = x + Math.cos(k / 10 * 6.283) * e, qz = z + Math.sin(k / 10 * 6.283) * e; if (T.agua(qx, qz)) { mojado = true; break; } des = Math.max(des, Math.abs(T.altura(qx, qz) - T.altura(x, z))); }
            if (mojado) continue; if (!mejor || des < mejor.des) mejor = { x, z, des }; }
          return mejor })()`);
        if (!sit) throw new Error('no hay un sitio llano y seco a 62 m de la base');
        const emp = await js(`(()=>{ const H = ${H}, D = H.progreso.desafio; D.oleadas = 20; D.capullos = []; D.nodriza = null; D.especial = null; H.progreso.dia = 30; H.progreso.horas = 12; return H.desafio.asedio.empezar({ x: ${sit.x}, z: ${sit.z} }) })()`);
        r.asedioEmpezar = emp === undefined ? null : emp;
        for (let i = 0; i < 20; i++) await js(`${H}.desafio.actualizar(0.5, { noche: 0, dtReal: 0.5 }); 1`);
        const hayCamino = await js(`!!${H}.progreso.desafio.asedio.camino`);
        if (!hayCamino) throw new Error('el asedio no tiene camino (el Coihue no camina)');
        // dos noches de asedio para que haya huellas y el Coihue ya venga andando
        await js(`(()=>{ const H = ${H}, D = H.progreso.desafio, M = H.desafio.asedio, js = H.jugador.estado;
          for (let n = 0; n < 2; n++) { D.oleadas++; H.progreso.dia++; H.progreso.horas = 20.6; M.alEmpezarNoche(); for (let k = 0; k < 190; k++) { H.progreso.horas += 0.05; if (H.progreso.horas >= 24) H.progreso.horas -= 24; D.salud = 100; M.actualizar(0.25, js); }
            H.progreso.horas = 6.1; M.alTerminarNoche(true); H.progreso.horas = 11; for (let k = 0; k < 80; k++) M.actualizar(0.25, js); }
          D.oleadas++; H.progreso.dia++; H.progreso.horas = 20.6; M.alEmpezarNoche(); for (let k = 0; k < 40; k++) { H.progreso.horas += 0.05; M.actualizar(0.25, js); } const c = D.asedio.camino; c.d = Math.min(c.largo, c.d + 5); return 1 })()`);
        const nave = await js(`(()=>{ const a = ${H}.progreso.desafio.asedio.nave; return { x: a.x, z: a.z } })()`);
        const dx = nave.x - base.x, dz = nave.z - base.z, l = Math.hypot(dx, dz) || 1;
        const yaw = Math.atan2(-dx, -dz);
        r.zancada = await js(`!!${H}.desafio.asedio.visual.zancada`);
        r.cerco = await js(`!!${H}.progreso.desafio.asedio.camino.cerco`);
        r.camino = await js(`(()=>{ const c = ${H}.progreso.desafio.asedio.camino; return { d: c.d, largo: c.largo, llego: !!c.llego } })()`);
        if (quiere('coihue-camina')) {
          await poner({ x: base.x + dx / l * 6, z: base.z + dz / l * 6, yaw, horas: 22 });
          const s = await soltar(16, [], false);
          // el Coihue sigue andando mientras se mide: cada cuadro se le suma un metro a la cuenta de lo caminado cada medio segundo (la hora está clavada)
          await js(`(()=>{ const H = ${H}, c = H.progreso.desafio.asedio.camino; let k = 0; window.__pinCoihue = () => { if (++k % 30 === 0 && c.d < c.largo - 30) c.d += 2.5; }; return 1 })()`);
          await medir('coihue-camina', { nota: `${s.hechos} duendes; ${r.camino.d.toFixed(0)}/${r.camino.largo.toFixed(0)} m`, soltados: s, camino: r.camino, zancada: r.zancada });
          r.zancadaDespues = await js(`!!${H}.desafio.asedio.visual.zancada`); if (r.escenas['coihue-camina']) { r.escenas['coihue-camina'].zancadaAlFinal = r.zancadaDespues; r.escenas['coihue-camina'].nota += ' · zancada al final: ' + (r.zancadaDespues ? 'sí' : 'no'); } await js(`window.__pinCoihue = null; 1`);
          await limpiar();
        }
        if (quiere('subida')) {
          try {
            await js(`window.__pinCoihue = null; 1`);
            const entr = await js(`(()=>{ const H = ${H}, M = H.desafio.asedio; const a = H.progreso.desafio.asedio; if (a.camino) { a.camino.llego = true; a.camino.d = a.camino.largo; } else { for (const z of a.zonas) z.estado = 'asegurada'; } H.progreso.horas = 11; const D = H.progreso.desafio; D.oleadaTerminada = true; if (H.desafio.limpiar) H.desafio.limpiar(); for (const al of H.desafio.aliens) { al.estado = 'irse'; al.t = 9; } for (let i = 0; i < 120; i++) H.__bucle(); for (const al of H.desafio.aliens) { al.estado = 'irse'; al.t = 9; } for (let i = 0; i < 30; i++) H.desafio.actualizar(0.1, { noche: 0, dtReal: 0.1 }); for (const z of a.zonas) z.guardia = H.progreso.dia; const s = M.sitioHaz(); H.jugador.ubicar(s.x + 1, s.z + 1, 0, s.y); for (const al of H.desafio.aliens) { al.estado = 'irse'; al.t = 9; } H.desafio.actualizar(0.1, { noche: 0, dtReal: 0.1 }); const ok = H.desafio.usarCercaDe(H.jugador.estado.pos); const motivo = M.motivoHaz(H.jugador.estado.pos); for (let i = 0; i < 60; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); return { ok, motivo, abierto: M.hazAbierto() } })()`);
            r.entrada = entr;
            const sub = await js(`(()=>{ const N = ${H}.desafio.naveAdentro; if (!N.enSubida) return null; const S = N.subida, o = S.origen, q = S.tramos[Math.floor(S.tramos.length * 0.3)], q2 = S.tramos[Math.floor(S.tramos.length * 0.3) + 6];
              return { x: o.x + q.x, y: o.y + q.alto + 1.65, z: o.z + q.z, yaw: Math.atan2(-(q2.x - q.x), -(q2.z - q.z)), raices: S.raices ? S.raices.length : 0, ramas: S.vecinos ? S.vecinos.length : 0 } })()`);
            if (!sub) throw new Error('no se pudo entrar a la subida: ' + JSON.stringify(entr));
            await poner({ x: sub.x, y: sub.y, z: sub.z, yaw: sub.yaw, horas: 11 });
            const peligros = await js(`(()=>{ const H = ${H}; return { aliens: H.desafio.aliens.filter((a) => a.estado !== 'morir' && a.estado !== 'irse').length, raices: ${sub.raices}, ramas: ${sub.ramas} } })()`);
            await medir('subida', { nota: `${peligros.raices} raíces, ${peligros.ramas} duendes de las ramas, ${peligros.aliens} invasores sueltos`, peligros });
          } catch (x) { noArmada('subida', String(x && x.message ? x.message : x)); }
        }
      } catch (x) {
        if (quiere('coihue-camina') && !r.escenas['coihue-camina']) noArmada('coihue-camina', String(x && x.message ? x.message : x));
        if (quiere('subida') && !r.escenas.subida) noArmada('subida', 'depende del asedio: ' + String(x && x.message ? x.message : x));
      }
    }
    r.programasFinal = await js(`${H}.renderer.info.programs.length`);
  } catch (e) { r.errores.push('excepcion: ' + (e && e.message ? e.message : e)); }
  r.fin = new Date().toISOString();
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(r, null, 2));
  console.log(`errores ${r.errores.length}${r.errores.length ? ' · ' + r.errores.slice(0, 3).join(' | ') : ''} · programas ${r.programas0} -> ${r.programasFinal}`);
  app.exit(0);
});
