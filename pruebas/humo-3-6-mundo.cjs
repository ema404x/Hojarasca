// Partida real 3.6 (Electron + WebGL): la Aldea de los Duendes puesta en el valle (aldea-mundo.js).
//  · desde el refugio la aldea no suma nada (ni un dibujo: queda fuera de la distancia de dibujo);
//  · se llega a la aldea y se arma en un Worker (sin tirones: se monta de a una manzana por cuadro);
//  · se entra caminando por la puerta (con E y la tecla W) a la biblioteca, la casa del jefe de
//    estación, el almacén y la casa de té (las dos últimas, las de estructuras.js, mudadas acá);
//  · se compra en el almacén (aviso y E) y se pide en la casa de té;
//  · llueve: afuera se ve la lluvia y adentro no (bajo techo, con el techo de chapa sonando);
//  · una obra avanza de etapa y su geometría cambia (sólo ese lote);
//  · dibujos por cuadro en la plaza de día y de noche, con la aldea inicial y con los once locales
//    abiertos (< 520), luces del presupuesto (nunca más de 4 puntuales) y el tiempo de cuadro
//    comparado con el bosque;
//  · en el Desafío no hay aldea y el almacén y la casa de té están en el valle.
// Uso: npx electron pruebas/humo-3-6-mundo.cjs --user-data-dir=<carpeta propia>
//      (o HUMO_PERFIL=<carpeta>; si no, una propia en la carpeta temporal). Borra el
//      localStorage del perfil: usar uno aparte.
const { app, BrowserWindow, dialog } = require('electron');
// que la prueba nunca muestre un cuadro de error en la pantalla del usuario: lo escribe y sale
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
else if (!process.argv.some((a) => a.startsWith('--user-data-dir'))) app.setPath('userData', path.join(os.tmpdir(), 'hojarasca-humo-3-6-mundo'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// lo que corre en la página: caminar de verdad (W y jugador.actualizar), como humo-3-0-1-estructuras
const AYUDA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, col = H.col;
  const A = window.__m36 = {};
  A.tecla = (tipo, code) => document.dispatchEvent(new KeyboardEvent(tipo, { code, bubbles: true }));
  A.toque = (code) => { A.tecla('keydown', code); A.tecla('keyup', code); };
  A.paso = (dt = 0.05) => { H.jugador.actualizar(dt); H.puertas.actualizar(dt); };
  A.piso = (x, z, y) => { const p = col.plataformaEn(x, z, y + 0.62); const s = T.altura(x, z); return p && p.alto > s ? p.alto : s; };
  // un camino recto entre puntos (cada 15 cm), con la altura del piso
  A.ruta = (pts) => { const r = []; let y = A.piso(pts[0].x, pts[0].z, T.altura(pts[0].x, pts[0].z));
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.15));
      for (let k = 0; k <= n; k++) { const x = a.x + (b.x - a.x) * k / n, z = a.z + (b.z - a.z) * k / n; y = A.piso(x, z, y); r.push({ x, z, y }); } }
    return r; };
  A.caminar = (ruta, tol = 0.35) => {
    const e = H.jugador.estado; let k = 0, mejor = 0, ultimo = 0, pasos = 0, llego = false;
    A.tecla('keydown', 'KeyW');
    try {
      while (pasos < 2500) {
        let kc = k, dc = Infinity;
        for (let q = k; q < Math.min(ruta.length, k + 25); q++) { const d = Math.hypot(ruta[q].x - e.pos.x, ruta[q].z - e.pos.z); if (d < dc) { dc = d; kc = q; } }
        k = kc; if (k > mejor) { mejor = k; ultimo = pasos; }
        const fin = ruta[ruta.length - 1];
        if (Math.hypot(fin.x - e.pos.x, fin.z - e.pos.z) < tol) { llego = true; break; }
        let t = k, acum = 0;
        while (t < ruta.length - 1 && acum < 0.3) { acum += Math.hypot(ruta[t + 1].x - ruta[t].x, ruta[t + 1].z - ruta[t].z); t++; }
        const dx = ruta[t].x - e.pos.x, dz = ruta[t].z - e.pos.z;
        if (Math.hypot(dx, dz) > 1e-3) e.yaw = Math.atan2(-dx, -dz);
        A.paso(); pasos++;
        if (pasos - ultimo > 80) break;
      }
    } finally { A.tecla('keyup', 'KeyW'); }
    for (let i = 0; i < 8; i++) A.paso();
    return { llego, x: e.pos.x, z: e.pos.z, pasos };
  };
  A.poner = (x, z, yaw = 0) => { const e = H.jugador.estado; H.jugador.ubicar(x, z, yaw); e.vel.set(0, 0, 0); e.vy = 0; e.sentado = false; for (let i = 0; i < 10; i++) A.paso(); };
  A.apartarGente = (x, z, r = 14) => { for (const g of H.gente?.gente || []) if (!g.aBordo && Math.hypot(g.pos.x - x, g.pos.z - z) < r) { g.pos.x += 60; g.pos.z += 60; } };
  // dibujos y triángulos de un cuadro (como humo-rendimiento)
  A.dibujos = () => { const R = H.renderer; R.info.autoReset = false; R.info.reset(); R.render(H.escena, H.camara); const d = { dibujos: R.info.render.calls, tri: R.info.render.triangles }; R.info.autoReset = true; return d; };
  // milisegundos por cuadro (CPU y placa: gl.finish espera a que termine de dibujar)
  A.ms = (n = 40) => { const gl = H.renderer.getContext(); for (let i = 0; i < 6; i++) H.__bucle(); gl.finish(); const t0 = performance.now(); for (let i = 0; i < n; i++) { H.__bucle(); gl.finish(); } return +((performance.now() - t0) / n).toFixed(2); };
  A.mirar = (x, z, tx, tz, alto = 1.7) => { const e = H.jugador.estado; H.jugador.ubicar(x, z, Math.atan2(-(tx - x), -(tz - z))); e.pitch = -0.04; e.vel.set(0, 0, 0); for (let i = 0; i < 6; i++) H.__bucle(); };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const medidas = {};
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 180 s (${donde})`)), 180000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea)').catch(() => false)) return true; } return false; };
  const H = 'window.__hojarasca';
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'media', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano' }, ${JSON.stringify(extra || {})})));`;
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  // cuadros con tiempo de verdad en el medio (el LOD y lo que corre cada tanto miran el reloj)
  const asentar = async (veces = 6) => { for (let i = 0; i < veces; i++) { await esperar(160); await cuadros(3); } };
  // el aviso de E (se mira unas veces por segundo: tiene que pasar tiempo real entre cuadros)
  const avisoAhora = async () => { await cuadros(4); for (let i = 0; i < 3; i++) { await esperar(120); await cuadros(2); } return js(`${H}.__aviso()`); };
  // hasta que la aldea esté montada, con cuadros de verdad (el planificador antitirones la monta de a una)
  const aldeaMontada = async (maximo = 600) => {
    await js(`${H}.__aldeaMundo().listo().then(() => 1)`);
    for (let i = 0; i < maximo; i++) { const c = await js(`(()=>{ ${H}.__bucle(); return ${H}.__aldeaMundo().medir().cola })()`); if (c === 0) return i; if (i % 20 === 19) await esperar(30); }
    return -1;
  };

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes()} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia (calidad media)');
    await entrar();
    await js(AYUDA);
    let e = await js(`(()=>{ const C = ${H}.__carga(); const M = ${H}.__aldeaMundo().medir(); return { total: C.etapas.reduce((s, x) => s + x.ms, 0), etapas: C.etapas, emparejar: M.emparejarMs, despejar: M.despejarMs, montar: M.montarMs, arrancar: M.arrancarMs, parche: M.parcheTris } })()`);
    medidas.carga = { aldeaMs: +(e.emparejar + e.despejar + e.montar + e.arrancar).toFixed(1), emparejar: +e.emparejar.toFixed(1), despejar: +e.despejar.toFixed(1), montar: +e.montar.toFixed(1), arrancar: +e.arrancar.toFixed(1), totalEtapas: e.total };
    ok(medidas.carga.aldeaMs < 300, `la aldea suma ${medidas.carga.aldeaMs} ms a la carga (emparejar ${medidas.carga.emparejar}, despejar ${medidas.carga.despejar}, complejos ${medidas.carga.montar}, Worker ${medidas.carga.arrancar}); los edificios se arman aparte`);

    // ------------------------------------------------------------ desde el refugio
    seccion('desde el refugio no se ve nada de la aldea');
    await js(`(()=>{ const r = ${H}.T.lugares.refugio; window.__m36.mirar(r.x + 6, r.z + 6, ${H}.__aldeaMundo().centro.x, ${H}.__aldeaMundo().centro.z); return 1 })()`);
    await aldeaMontada();
    await cuadros(30);
    e = await js(`(()=>{ const M = ${H}.__aldeaMundo(), A = window.__m36; const vis = M.raices().filter((r) => r.visible).map((r) => r.name);
      const parche = ${H}.escena.getObjectByName('terreno-aldea'); const con = A.dibujos();
      const raices = M.raices(); raices.forEach((r) => { r.userData.__v = r.visible; r.visible = false; }); const pv = parche.visible; parche.visible = false; const sin = A.dibujos();
      raices.forEach((r) => { r.visible = r.userData.__v; }); parche.visible = pv;
      return { vis, parche: pv, con, sin, d: Math.hypot(${H}.camara.position.x - M.centro.x, ${H}.camara.position.z - M.centro.z) } })()`);
    ok(e.vis.length === 0 && !e.parche, `a ${Math.round(e.d)} m todos los complejos y el suelo de la aldea están apagados (${e.vis.join(', ') || 'ninguno prendido'})`);
    ok(e.con.dibujos === e.sin.dibujos && e.con.tri === e.sin.tri, `la aldea suma 0 dibujos desde el refugio (${e.con.dibujos} con, ${e.sin.dibujos} sin)`);
    medidas.refugio = e.con;
    await js(`(()=>{ window.__progs0 = new Set(${H}.renderer.info.programs.map((p) => p.cacheKey)); return 1 })()`);

    // ------------------------------------------------------------ llegar
    seccion('llegar a la aldea');
    const parada = await js(`(()=>{ const p = ${H}.tren.paradas.find((x) => x.aldea); return { x: p.espera.x, z: p.espera.z, nombre: p.nombre } })()`);
    ok(parada.nombre === 'Aldea de los Duendes', `la parada del sur: ${parada.nombre}`);
    await js(`(()=>{ const M = ${H}.__aldeaMundo(); window.__m36.mirar(${parada.x}, ${parada.z}, M.centro.x, M.centro.z); return 1 })()`);
    const vueltas = await aldeaMontada();
    await asentar(8);
    e = await js(`(()=>{ const M = ${H}.__aldeaMundo(); return { m: M.medir(), vis: M.raices().filter((r) => r.visible).length, total: M.raices().length } })()`);
    ok(vueltas >= 0 && e.m.listas === e.m.manzanas && e.m.cola === 0, `la aldea está montada (${e.m.listas} manzanas, ${e.m.montados} edificios, ${vueltas} cuadros)`);
    ok(e.m.fabrica.origen === 'worker' && e.m.fabrica.worker > 0 && e.m.fabrica.momento === 0, `la geometría se armó en el Worker (${e.m.fabrica.worker} pedidos), no en el cuadro`);
    ok(e.vis >= e.total - 1, `desde la estación se ven los complejos (${e.vis} de ${e.total})`);
    // los programas de la aldea (el material con el detalle de superficie, el vidrio, el ripio...)
    // se compilaron en la carga: al llegar no se compila nada (con los cuadros del juego, que dibujan
    // con el postproceso: `A.dibujos()` dibuja directo a la pantalla y ésos son otros programas)
    await js(`(()=>{ const A = window.__m36; const M = ${H}.__aldeaMundo(); const o = M.aMundo(6, 29), a = M.aMundo(10, 60); A.mirar(o.x, o.z, a.x, a.z); return 1 })()`);
    await asentar(4);
    const nuevos = await js(`${H}.renderer.info.programs.filter((p) => !window.__progs0.has(p.cacheKey)).map((p) => ((p.cacheKey.includes("aldea-3.6") || p.cacheKey.includes("vidrio-aldea")) ? "ALDEA " : "") + (p.name || "") + " " + p.cacheKey.slice(0, 40) + " … " + p.cacheKey.slice(-70).split(String.fromCharCode(10)).join(" "))`);
    console.log('  programas nuevos al llegar: ' + (nuevos.join(' || ') || 'ninguno'));
    ok(!nuevos.some((n) => n.startsWith('ALDEA')), `al llegar no se compila ningún programa de la aldea (${nuevos.length} nuevos en total, de la gente y el bosque)`);
    const anim = await js(`(()=>{ const M = ${H}.__aldeaMundo(); return M.animables().map((a) => a.edificio + ':' + a.id) })()`);
    ok(anim.length >= 1, `las piezas que se mueven quedan a mano (${anim.join(', ')})`);
    medidas.aldea = { luces: e.m.luces, triangulos: e.m.triangulos, mallas: e.m.mallas, msMontar: +e.m.msMontar.toFixed(1), montajes: e.m.montajes };
    ok(e.m.msMontar / Math.max(1, e.m.montajes) < 40, `montar una manzana tarda ${(e.m.msMontar / Math.max(1, e.m.montajes)).toFixed(1)} ms (de a una por cuadro)`);

    // ------------------------------------------------------------ entrar caminando
    seccion('entrar caminando por la puerta');
    const destinos = await js(`(()=>{ const H = window.__hojarasca, M = H.__aldeaMundo(), L = H.T.lugares, out = [];
      for (const id of ['biblioteca', 'casa-jefe']) {
        const p = H.puertas.lista.find((q) => q.duenio === 'aldea:' + id); const pts = H.__aldea.puntos(id);
        out.push({ id, puerta: { x: p.x, z: p.z }, rot: p.rot, adentro: pts.adentro, sitio: M.estadoEdificio(id).sitio });
      }
      const pa = H.puertas.lista.find((q) => q.nombre === 'la puerta del almacén'), a = L.almacen;
      out.push({ id: 'almacen', puerta: { x: pa.x, z: pa.z }, rot: pa.rot, adentro: { x: a.mostrador.x + (a.puerta.x - a.mostrador.x) * 0.18, z: a.mostrador.z + (a.puerta.z - a.mostrador.z) * 0.18 }, sitio: { x: a.x, z: a.z } });
      const pt = H.puertas.lista.find((q) => q.nombre === 'la puerta de la casa de té'), c = L['casa-te'];
      out.push({ id: 'casa-te', puerta: { x: pt.x, z: pt.z }, rot: pt.rot, adentro: { x: c.x, z: c.z }, sitio: { x: c.x, z: c.z } });
      return out })()`);
    for (const d of destinos) {
      // afuera: tres metros delante de la puerta (del lado de la calle)
      const r = await js(`(async ()=>{ const H = window.__hojarasca, A = window.__m36, d = ${JSON.stringify(d)};
        A.apartarGente(d.puerta.x, d.puerta.z, 16);
        const fx = d.puerta.x - d.sitio.x, fz = d.puerta.z - d.sitio.z, l = Math.hypot(fx, fz) || 1, ux = fx / l, uz = fz / l;
        const fuera = { x: d.puerta.x + ux * 3.2, z: d.puerta.z + uz * 3.2 }, umbralF = { x: d.puerta.x + ux * 0.9, z: d.puerta.z + uz * 0.9 }, umbralD = { x: d.puerta.x - ux * 1.0, z: d.puerta.z - uz * 1.0 };
        A.poner(fuera.x, fuera.z, Math.atan2(-(d.puerta.x - fuera.x), -(d.puerta.z - fuera.z)));
        const ruta1 = A.ruta([fuera, umbralF]); const r1 = A.caminar(ruta1);
        const p = H.puertas.lista.find((q) => Math.hypot(q.x - d.puerta.x, q.z - d.puerta.z) < 0.05);
        return { r1, abierta: p.abierta, x: H.jugador.estado.pos.x, z: H.jugador.estado.pos.z, umbralD, fuera };
      })()`);
      const aviso = await avisoAhora();
      await js(`(()=>{ window.__m36.toque('KeyE'); for (let i = 0; i < 40; i++) window.__m36.paso(); return 1 })()`);
      const r2 = await js(`(()=>{ const H = window.__hojarasca, A = window.__m36, d = ${JSON.stringify(d)}, u = ${JSON.stringify(r.umbralD)};
        const p = H.puertas.lista.find((q) => Math.hypot(q.x - d.puerta.x, q.z - d.puerta.z) < 0.05);
        const e = H.jugador.estado; const ux = d.puerta.x - u.x, uz = d.puerta.z - u.z; const ruta = A.ruta([{ x: e.pos.x, z: e.pos.z }, { x: d.puerta.x, z: d.puerta.z }, u, { x: d.puerta.x - ux * 2.2, z: d.puerta.z - uz * 2.2 }]);
        const c = A.caminar(ruta, 0.45);
        const pasoPuerta = ((e.pos.x - d.puerta.x) * -ux + (e.pos.z - d.puerta.z) * -uz) / (Math.hypot(ux, uz) || 1);
        return { abierta: +p.abierta.toFixed(2), c, adentro: !!H.__aldeaMundo().adentro(e.pos) || pasoPuerta > 0.8, pasoPuerta: +pasoPuerta.toFixed(2), y: e.pos.y } })()`);
      await cuadros(4); await esperar(150); await cuadros(4);
      const t = await js(`${H}.__techo()`);
      ok(/Abrir|puerta/i.test(aviso) && r2.abierta > 0.5, `${d.id}: E abre la puerta («${aviso}»)`);
      ok((r2.c.llego || r2.adentro) && t.espacio === 'adentro', `${d.id}: entra caminando por la puerta (${r2.c.pasos} pasos, ${r2.pasoPuerta} m adentro; espacio ${t.espacio}, techo ${t.techo})`);
      if (d.id === 'almacen') {
        seccion('comprar en el almacén');
        await js(`(()=>{ const a = window.__hojarasca.T.lugares.almacen, A = window.__m36; const dx = a.puerta.x - a.mostrador.x, dz = a.puerta.z - a.mostrador.z, l = Math.hypot(dx, dz); const x = a.mostrador.x + dx / l * 1.1, z = a.mostrador.z + dz / l * 1.1; A.poner(x, z, Math.atan2(dx, dz)); return 1 })()`);
        const av = await avisoAhora();
        ok(/Ver qué hay en el almacén/.test(av), `junto al mostrador, el aviso: «${av}»`);
        await js(`(()=>{ const P = ${H}.progreso; P.cosas.hacha = 0; P.ramitas = 30; P.entradas.canto = P.entradas.canto || { dia: 1, hora: 9, cantidad: 0 }; P.entradas.canto.cantidad = 5; return 1 })()`);
        await js(`(()=>{ window.__m36.toque('KeyE'); return 1 })()`);
        const abierto = await js(`!document.getElementById('trueque').classList.contains('oculto')`);
        await js(`(()=>{ window.__m36.toque('Digit1'); return 1 })()`);
        const compra = await js(`({ hacha: ${H}.progreso.cosas.hacha || 0, ramitas: ${H}.progreso.ramitas })`);
        ok(abierto && compra.hacha === 1 && compra.ramitas < 30, `E abre el almacén y con 1 se compra el hacha (ramitas ${compra.ramitas})`);
        await js(`(()=>{ window.__m36.toque('Escape'); return 1 })()`);
        await esperar(200);
        await js(`${H}.volverAlJuego?.(); 1`);
      }
      if (d.id === 'casa-te') {
        seccion('pedir en la casa de té');
        await js(`(()=>{ const H = window.__hojarasca, c = H.T.lugares['casa-te'], A = window.__m36; const dx = c.puerta.x - c.mostrador.x, dz = c.puerta.z - c.mostrador.z, l = Math.hypot(dx, dz); A.poner(c.mostrador.x + dx / l * 2.0, c.mostrador.z + dz / l * 2.0, Math.atan2(dx, dz)); return 1 })()`);
        const av = await avisoAhora();
        const antes = await js(`Object.keys(${H}.progreso.entradas).length`);
        await js(`(()=>{ window.__m36.toque('KeyE'); return 1 })()`);
        await esperar(1200);
        const despues = await js(`Object.keys(${H}.progreso.entradas).length`);
        ok(/Pedir algo en la casa de té/.test(av) && despues > antes, `en la galería: «${av}» y E sirve algo (${antes} → ${despues} anotaciones)`);
      }
    }

    // ------------------------------------------------------------ la lluvia
    seccion('llueve: afuera sí, adentro no');
    const lluvia = (adentro) => js(`(async ()=>{ const H = window.__hojarasca, A = window.__m36, M = H.__aldeaMundo();
      H.ajustes.clima = 'variable'; const e = H.clima.estado; e.objetivo = 'lluvia'; e.proximo = 'lluvia'; e.t = 9999; e.lluvia = 1; e.nublado = 1;
      const b = M.estadoEdificio('biblioteca'), pu = H.puertas.lista.find((q) => q.duenio === 'aldea:biblioteca');
      if (${adentro}) { const p = H.__aldea.puntos('biblioteca').adentro; A.poner(p.x, p.z, 0); } else A.poner(pu.x + (pu.x - b.sitio.x) * 1.4, pu.z + (pu.z - b.sitio.z) * 1.4, 0);
      return 1 })()`);
    const verLluvia = async () => { await cuadros(6); await esperar(150); await cuadros(6); return js(`(()=>{ const H = window.__hojarasca; const l = H.escena.children.find((o) => o.isLineSegments && o.geometry.attributes.position.count === 6400); return { visible: !!l?.visible, techo: H.__techo(), lluvia: +H.clima.estado.lluvia.toFixed(2) } })()`); };
    await lluvia(false);
    const fuera = await verLluvia();
    await lluvia(true);
    const dentro = await verLluvia();
    ok(fuera.visible && !fuera.techo.bajoTecho, `en la calle llueve (lluvia ${fuera.lluvia})`);
    ok(!dentro.visible && dentro.techo.bajoTecho && dentro.techo.espacio === 'adentro' && dentro.techo.techo === 'chapa', `adentro de la biblioteca no llueve (bajo techo, ${dentro.techo.espacio}, suena la ${dentro.techo.techo})`);
    await js(`(()=>{ const H = window.__hojarasca; H.ajustes.clima = 'despejado'; const e = H.clima.estado; e.objetivo = 'despejado'; e.lluvia = 0; e.nublado = 0.1; return 1 })()`);

    // ------------------------------------------------------------ una obra
    seccion('una obra avanza de etapa');
    e = await js(`(async ()=>{ const H = window.__hojarasca, P = H.progreso, a = P.aldea, M = H.__aldeaMundo();
      const lote = H.__aldea.edificio('carpinteria'); window.__m36.mirar(lote.x + 12, lote.z + 12, lote.x, lote.z);
      const antes = M.estadoEdificio('carpinteria');
      if (!a.pobladores.some((p) => p.clave === 'carpintero')) a.pobladores.push({ clave: 'carpintero', dia: P.dia });
      a.obras.carpinteria = { etapa: 1, aportado: {}, lista: { dia: P.dia, hora: 0 }, desde: P.dia };
      H.__aldea.actualizar(0.6);   // la etapa queda hecha (avanzarObras avisa y la aldea rearma el lote)
      return { antes, obra: a.obras.carpinteria } })()`);
    await aldeaMontada();
    const obra = await js(`(()=>{ const M = ${H}.__aldeaMundo(); return { despues: M.estadoEdificio('carpinteria'), otro: M.estadoEdificio('herreria'), rearmados: M.medir().rearmados } })()`);
    ok(e.obra.etapa === 2 && obra.despues.montada === 'carpinteria|2|1', `la carpintería pasó a la estructura (${e.antes.montada} → ${obra.despues.montada})`);
    ok(obra.despues.tris.exterior !== e.antes.tris.exterior && obra.despues.suelto && !obra.despues.enFusion, `y su geometría cambió (${e.antes.tris.exterior} → ${obra.despues.tris.exterior} triángulos, sola)`);
    ok(obra.otro.enFusion && obra.rearmados === 1, 'sin tocar los demás lotes de su manzana');

    // ------------------------------------------------------------ dibujos y luces
    seccion('dibujos por cuadro, luces y tiempo de cuadro');
    const enPlaza = `(()=>{ const H = window.__hojarasca, M = H.__aldeaMundo(); const o = M.aMundo(6, 29), a = M.aMundo(10, 60); window.__m36.mirar(o.x, o.z, a.x, a.z); return 1 })()`;
    const medir = async (nombre, hora) => {
      await js(`${H}.progreso.horas = ${hora}; 1`);
      await js(enPlaza);
      await cuadros(10); await asentar(8);
      const r = await js(`(()=>{ const H = window.__hojarasca, A = window.__m36, P = H.escena.userData.presupuestoLuces;
        const d = A.dibujos(); const ms = A.ms(30); const prendidas = P.fijasP.filter((f) => f.intensity > 0).length;
        return { ...d, ms, prendidas, focos: P.fijasS.filter((f) => f.intensity > 0).length, vivas: P.stats.vivas, maxVivas: P.stats.maxVivas, aldea: H.__aldeaMundo().medir().lucesPrendidas } })()`);
      medidas[nombre] = r;
      ok(r.dibujos < 520, `${nombre}: ${r.dibujos} dibujos por cuadro, ${r.tri.toLocaleString('es')} triángulos, ${r.ms} ms (tope 520 dibujos)`);
      ok(r.prendidas <= 4 && r.focos <= 1, `${nombre}: ${r.prendidas} luces puntuales prendidas del presupuesto (${r.vivas} candidatas, ${r.aldea} de la aldea)`);
      return r;
    };
    await medir('plaza-dia', 12);
    const noche = await medir('plaza-noche', 22.5);
    ok(noche.aldea > 3 && noche.prendidas >= 2, 'de noche se prenden los faroles y las ventanas');
    // el bosque, para comparar
    await js(`(()=>{ const H = window.__hojarasca, a = H.T.lugares.arrayanes; window.__m36.mirar(a.x + 20, a.z, a.x - 40, a.z); H.progreso.horas = 12; return 1 })()`);
    await cuadros(10); await asentar(8);
    medidas.bosque = await js(`(()=>{ const A = window.__m36; return { ...A.dibujos(), ms: A.ms(30) } })()`);
    console.log(`  bosque: ${medidas.bosque.dibujos} dibujos, ${medidas.bosque.tri.toLocaleString('es')} triángulos, ${medidas.bosque.ms} ms`);
    // la aldea completa: los once locales abiertos
    await js(`(()=>{ const a = ${H}.progreso.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
      a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.llegando = null; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); ${H}.__aldeaMundo().actualizar(4, ${H}.camara.position); return 1 })()`);
    await js(enPlaza);
    await aldeaMontada();
    e = await js(`(()=>{ const M = ${H}.__aldeaMundo(); return { abiertos: ['carpinteria', 'panaderia', 'herreria', 'pescaderia', 'escuela', 'puesto-sanitario', 'estafeta', 'hilanderia', 'sala-miel', 'seccional', 'salon'].filter((id) => /\|4\|/.test(M.estadoEdificio(id).montada)).length, m: M.medir() } })()`);
    ok(e.abiertos === 11, `los once locales abiertos y armados (${e.abiertos})`);
    medidas.completa = { triangulos: e.m.triangulos, luces: e.m.luces };
    const cd = await medir('completa-dia', 12);
    const cn = await medir('completa-noche', 22.5);
    void cd; void cn;
    ok(medidas['plaza-dia'].ms <= Math.max(medidas.bosque.ms * 1.35, medidas.bosque.ms + 4), `el cuadro en la plaza (${medidas['plaza-dia'].ms} ms) no es peor que en el bosque (${medidas.bosque.ms} ms)`);

    // ------------------------------------------------------------ el Desafío
    seccion('en el Desafío no hay aldea');
    await js(`(()=>{ ${ajustes({ modo: 'desafio', ranura: 1 })} return 1 })()`);
    await abrir();
    ok(await listo(), 'carga el Desafío');
    await entrar();
    e = await js(`(()=>{ const H = window.__hojarasca, L = H.T.lugares; const p = H.tren.paradas.find((x) => x.indice === 116) || H.tren.paradas[0];
      const ald = { x: 40.33, z: -339.14 };
      return { mundo: !!H.__aldeaMundo(), parche: !!H.escena.getObjectByName('terreno-aldea'), alm: L.almacen ? Math.hypot(L.almacen.x - ald.x, L.almacen.z - ald.z) : -1, te: L['casa-te'] ? Math.hypot(L['casa-te'].x - ald.x, L['casa-te'].z - ald.z) : -1,
        raices: H.est.conjuntos.filter((c) => /^aldea-/.test(c.clave)).length, paradas: H.tren.paradas.map((x) => x.nombre) } })()`);
    ok(!e.mundo && !e.parche && e.raices === 0, 'ni edificios, ni suelo, ni complejos de la aldea');
    ok(e.alm > 150 && e.te > 150, `el almacén (a ${Math.round(e.alm)} m de la parada del sur) y la casa de té (a ${Math.round(e.te)} m) están en el valle`);
    ok(!e.paradas.includes('Aldea de los Duendes'), `las paradas de siempre (${e.paradas.join(', ')})`);
    await js(`(()=>{ ${ajustes()} return 1 })()`);
  } catch (err) {
    errores.push(`excepción: ${err && err.message ? err.message : err}`);
  }
  console.log('MEDIDAS ' + JSON.stringify(medidas));
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n${errores.join('\n')}`); app.exit(1); return; }
  console.log('OK humo 3.6 mundo');
  app.exit(0);
});
