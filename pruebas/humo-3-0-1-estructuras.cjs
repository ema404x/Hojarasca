// 3.0.1: partida real (Electron + WebGL) que entra CAMINANDO a cada estructura del valle.
//
// Nada de teletransportarse al destino: el jugador arranca afuera, en el suelo, y llega
// con la tecla W de verdad (keydown + jugador.actualizar) siguiendo un camino que se busca
// sobre la misma física del jugador (colisiones.js: resolver, plataformas, techos). Por
// cada estructura:
//   · llega a los puntos de adentro (camas, mesas, mostrador, hogar, estantes, pisos altos,
//     galerías, andenes) y, con las puertas cerradas, no se entra a lo que es cerrado,
//   · abre la puerta con E desde afuera (el aviso dice «Abrir …»), la cruza, la cierra y
//     la abre con E desde adentro, y la colisión de la hoja coincide con la hoja dibujada,
// y además: nada de terreno asomando por los pisos, los asientos no se usan a través de
// una pared, el mostrador no atiende desde afuera, cayendo por el hueco del faro no se sale
// de la torre, y guardar adentro del faro y del refugio y volver a cargar deja todo en su lugar.
// Uso: npx electron pruebas/humo-3-0-1-estructuras.cjs   (HUMO_PERFIL=<carpeta> para el perfil;
//      si no, uno propio en la carpeta temporal: no toca la partida de nadie)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-3-0-1')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ lo que corre en la página
const BIBLIOTECA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, col = H.col;
  const A = window.__est301 = {};
  const RADIO = 0.35, ALTO = 1.65;
  const w = (s, rot, lx, lz) => ({ x: s.x + lx * Math.cos(rot) + lz * Math.sin(rot), z: s.z - lx * Math.sin(rot) + lz * Math.cos(rot) });
  const loc = (s, rot, x, z) => { const dx = x - s.x, dz = z - s.z; return [dx * Math.cos(rot) - dz * Math.sin(rot), dx * Math.sin(rot) + dz * Math.cos(rot)]; };
  const r2 = (v) => Math.round(v * 100) / 100;
  A.w = w; A.loc = loc; A.r2 = r2;
  const tecla = (tipo, code) => document.dispatchEvent(new KeyboardEvent(tipo, { code, bubbles: true }));
  A.tecla = tecla;
  // la física del jugador, punto por punto
  const libre = (x, y, z) => { const p = { x, y, z }; col.resolver(p, RADIO, ALTO); col.resolverPlataformas(p, RADIO, ALTO, 0.62); return Math.hypot(p.x - x, p.z - z) < 0.004; };
  const piso = (x, z, yPrev) => {
    let plat = col.plataformaEn(x, z, yPrev, 0.62);
    if (plat && plat.alto > yPrev + 0.03 && !col.espacioVerticalLibre(x, z, plat.alto, ALTO)) plat = col.plataformaEn(x, z, yPrev, 0.015);
    const suelo = T.altura(x, z);
    return { y: plat && plat.alto > suelo ? plat.alto : suelo, plat };
  };
  A.libre = libre;
  // búsqueda en la grilla de colisiones (8 vecinos, sube escalones, cae, no nada)
  A.explorar = (o, centro, radio, paso = 0.15) => {
    const est = [], vis = new Map(), cl = (i, j, y) => i + ',' + j + ',' + Math.round(y * 4);
    const y0 = piso(o.x, o.z, o.y ?? T.altura(o.x, o.z)).y;
    est.push({ i: 0, j: 0, x: o.x, z: o.z, y: y0, prev: -1, d: 0 }); vis.set(cl(0, 0, y0), 0);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (let c = 0; c < est.length && est.length < 250000; c++) {
      const n = est[c];
      for (const [di, dj] of dirs) {
        const i = n.i + di, j = n.j + dj, x = o.x + i * paso, z = o.z + j * paso;
        if (Math.hypot(x - centro.x, z - centro.z) > radio || !libre(x, n.y, z)) continue;
        const { y, plat } = piso(x, z, n.y);
        if (y > n.y + 0.64) continue;
        if (!plat) { const ag = T.agua(x, z); if (ag && ag.prof > 1.0) continue; }
        if (Math.abs(y - n.y) > 0.05 && !libre(x, y, z)) continue;
        const k = cl(i, j, y); if (vis.has(k)) continue;
        vis.set(k, est.length); est.push({ i, j, x, z, y, prev: c, d: n.d + Math.hypot(di, dj) * paso });
      }
    }
    return est;
  };
  A.buscar = (est, x, z, tol, y = null) => { let m = -1, md = Infinity; est.forEach((e, k) => { if (Math.hypot(e.x - x, e.z - z) <= tol && (y === null || Math.abs(e.y - y) < 0.3) && e.d < md) { md = e.d; m = k; } }); return m; };
  A.ruta = (est, k) => { const r = []; while (k >= 0) { r.push(est[k]); k = est[k].prev; } return r.reverse(); };
  A.paso = (dt = 0.05) => { H.jugador.actualizar(dt); H.puertas.actualizar(dt); };
  // caminar de verdad: W apretada y el rumbo hacia un punto un poco más adelante en el camino
  A.caminar = (ruta, tol = 0.3) => {
    const e = H.jugador.estado; let k = 0, mejor = 0, ultimo = 0, pasos = 0, llego = false;
    tecla('keydown', 'KeyW');
    try {
      while (pasos < 3000) {
        let kc = k, dc = Infinity;
        for (let q = k; q < Math.min(ruta.length, k + 25); q++) { const d = Math.hypot(ruta[q].x - e.pos.x, ruta[q].z - e.pos.z) + Math.abs(ruta[q].y - e.pos.y) * 0.5; if (d < dc) { dc = d; kc = q; } }
        k = kc; if (k > mejor) { mejor = k; ultimo = pasos; }
        const fin = ruta[ruta.length - 1];
        if (Math.hypot(fin.x - e.pos.x, fin.z - e.pos.z) < tol && Math.abs(fin.y - e.pos.y) < 0.35) { llego = true; break; }
        let t = k, acum = 0;
        while (t < ruta.length - 1 && acum < 0.3) { acum += Math.hypot(ruta[t + 1].x - ruta[t].x, ruta[t + 1].z - ruta[t].z); t++; }
        const dx = ruta[t].x - e.pos.x, dz = ruta[t].z - e.pos.z;
        if (Math.hypot(dx, dz) > 1e-3) e.yaw = Math.atan2(-dx, -dz);
        A.paso(); pasos++;
        if (pasos - ultimo > 80) break;
      }
    } finally { tecla('keyup', 'KeyW'); }
    for (let i = 0; i < 8; i++) A.paso();
    return llego;
  };
  A.poner = (x, z, yaw = 0) => { const e = H.jugador.estado; H.jugador.ubicar(x, z, yaw); e.vel.set(0, 0, 0); e.vy = 0; e.sentado = false; e.agachado = false; for (let i = 0; i < 10; i++) A.paso(); };
  A.puertasDe = (s) => (H.puertas?.lista || []).filter((p) => !p.duenio && !p.postigo && Math.hypot(p.x - s.x, p.z - s.z) < s.radio + 2);
  A.abrirTodas = (s, si) => { for (const p of A.puertasDe(s)) p.objetivo = si ? 1 : 0; for (let i = 0; i < 60; i++) H.puertas.actualizar(0.05); };
  A.apartarGente = (s) => { for (const g of H.gente?.gente || []) if (!g.aBordo && Math.hypot(g.pos.x - s.x, g.pos.z - s.z) < s.radio + 6) { g.pos.x += 80; g.pos.z += 80; } };
  // las estructuras del valle: marco (x, z, y, giro), radio y qué hay que alcanzar
  A.estructuras = () => {
    const L = T.lugares, E = H.est, out = [];
    const add = (clave, o, rot, radio, cfg) => { if (o && Number.isFinite(o.x)) out.push({ clave, x: o.x, z: o.z, y: Number.isFinite(o.y) ? o.y : T.altura(o.x, o.z), rot: rot || 0, radio, cfg }); };
    const casita = (W, D) => ({ entrada: [0, D / 2 + 1.9 + 3.6], encerrado: true, objetivos: [
      ['la galería', 0, D / 2 + 1.2, 0.245], ['el banco de la galería', 1.6, D / 2 + 1.2, 0.245], ['adentro', 0, 0, 0.35],
      ['el catre', -W / 2 + 1.4, -D / 2 + 1.75, 0.35], ['la mesita', W / 2 - 1.0, -D / 2 + 1.55, 0.35], ['el hogar', -W / 2 + 0.95, -0.2, 0.35]] });
    add('refugio', L.refugio, L.refugio.rot, 13, { entrada: [0, 7.0], encerrado: true, objetivos: [
      ['adentro', 0, 0.5, 0.37], ['la mesa', 0.6, -0.3, 0.37], ['el tocadiscos', 1.55, -0.35, 0.37], ['la cama', 2.75, -1.1, 0.37],
      ['el hogar', -2.4, -1.45, 0.37], ['el estante', -0.9, -1.95, 0.37], ['la leña de adentro', -1.75, 1.2, 0.37], ['la ventana', 2.2, 2.1, 0.37]] });
    add('cabana', L.cabana, L.cabana?.rot, 8.5, casita(4.6, 4.0));
    add('puesto', L.puesto, L.puesto?.rot, 8.5, casita(4.0, 3.6));
    add('faro', E.faro, E.faro?.rot, 7.5, { entrada: [0, 7.5], encerrado: true, objetivos: [
      ['la planta baja', 0, 0.9, 1.10], ['la sala de la linterna', -0.35, -0.5, 15.38], ['la mesa del farero', -0.1, -0.42, 15.38], ['la galería', 1.95, -0.9, 16.19]] });
    add('molino', E.molino, E.molino?.rot, 7.5, { entrada: [0, 6.5], encerrado: true, paso: 0.07, objetivos: [
      ['la planta baja', 0, 1.2, 0.29], ['las bolsas de harina', 0.7, 0.9, 0.29], ['el entrepiso', 0.62, -1.47, 3.11, 0.3], ['el piso alto', -0.9, -0.95, 5.68]] });
    add('casa-te', E.casaTe, E.casaTe?.rot, 9.5, { entrada: [0, 8.4], encerrado: true, objetivos: [
      ['la galería', 0, 4.1, 0.24], ['adentro', 0, 0, 0.38], ['el rincón del fondo', 2.5, -1.8, 0.38]] });
    add('torre', E.torre, E.torre?.rot, 10, { entrada: [-1.5, -0.3], objetivos: [['el descanso', 0, -7.1, 3.50], ['la cabina', 0, 0.6, 6.96]] });
    add('cueva', E.cueva, E.cueva?.rot, 8, { entrada: [2, 5.5], objetivos: [['la cornisa', -1.5, 0.8, 0.1], ['la pared tallada', -1.5, -3.0, 0.34]] });
    add('almacen', E.almacen, E.almacen?.rot, 9.5, { entrada: [0, -8.4], encerrado: true, objetivos: [
      ['la vereda', -3.6, -4.3, 0.50], ['el mostrador', 0, -0.4, 0.45], ['el rincón de las bolsas', 1.6, -2.0, 0.45]] });
    add('galpon', E.galpon, E.galpon?.rot, 22, { entrada: [0, -8.5 / 2 - 1.2], objetivos: [
      ['adentro', 0, -2.4, 0.39], ['la tarima de esquila', -2.5, 1.2, 0.61], ['la prensa', 2.7, 0.2, 0.39], ['el cobertizo', -8.95, 1.6, 0.32]] });
    const m = L.muelle;
    if (m) add('muelle', { x: m.x, z: m.z, y: 0 }, Math.atan2(Math.cos(m.ang), Math.sin(m.ang)), (m.largo || 20) + 6, { entrada: [0, -2.5], objetivos: [['la punta del muelle', 0, (m.largo || 20) - 1, m.alto + 0.035]] });
    (H.tren?.paradas || []).forEach((p, i) => add('estacion-' + i, p, p.ang, 14, { entrada: [(p.chica ? 9 : 18) / 2 + 2.5, 3.0], objetivos: [
      ['el andén', 0, 2.4, 0.6], ['el puesto de cargas', p.chica ? -3.3 : -3.6, p.chica ? 3.0 : 2.2, 0.6], ['la sala de espera', 0, 6.0, 0.73]] }));
    return out;
  };
})(); 1`;

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
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 300 s (${donde})`)), 300000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = () => w.loadFile(url, { search: '?debug=1' });
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.est && window.__hojarasca.jugador)').catch(() => false)) return true; } return false; };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`(()=>{ const H = window.__hojarasca; H.volverAlJuego?.(); H.ajustes.limiteFps = 'libre'; H.progreso.horas = 12; return 1 })()`);
    await js(BIBLIOTECA);
  };
  const H = 'window.__hojarasca', A = 'window.__est301';

  try {
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre' })); 1`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();
    const claves = await js(`${A}.estructuras().map((s) => s.clave)`);
    ok(claves.length >= 13, `hay estructuras para recorrer (${claves.join(', ')})`);

    // ------------------------------------------------------------ 1. caminar hasta todo
    for (const clave of claves) {
      seccion(`caminando: ${clave}`);
      const r = await js(`(()=>{ const A = ${A}, H = ${H}, T = H.T; const s = A.estructuras().find((k) => k.clave === ${JSON.stringify(clave)});
        const c = s.cfg, W = (lx, lz) => A.w(s, s.rot, lx, lz), ent = W(...c.entrada);
        const out = { objetivos: [], cerrado: [] };
        A.apartarGente(s);
        if (c.encerrado) {
          // con las puertas cerradas lo de adentro no se alcanza
          A.abrirTodas(s, false);
          const est = A.explorar({ x: ent.x, z: ent.z }, s, s.radio, c.paso);
          for (const [n, lx, lz, nivel, tol = 0.4] of c.objetivos) {
            if (!/adentro|mesa|cama|hogar|estante|leña|ventana|catre|mesita|planta|sala|entrepiso|piso alto|bolsas|mostrador|rincón|tocadiscos/.test(n)) continue;
            const q = W(lx, lz); if (A.buscar(est, q.x, q.z, tol, s.y + nivel) >= 0) out.cerrado.push(n);
          }
        }
        A.abrirTodas(s, true);
        A.poner(ent.x, ent.z);
        for (const [n, lx, lz, nivel, tol = 0.4] of c.objetivos) {
          const e = H.jugador.estado, q = W(lx, lz);
          let est = A.explorar({ x: e.pos.x, z: e.pos.z, y: e.pos.y }, s, s.radio, c.paso);
          let k = A.buscar(est, q.x, q.z, tol, s.y + nivel);
          if (k < 0) { A.poner(ent.x, ent.z); est = A.explorar({ x: ent.x, z: ent.z }, s, s.radio, c.paso); k = A.buscar(est, q.x, q.z, tol, s.y + nivel); }
          if (k < 0) { out.objetivos.push({ n, busca: false }); continue; }
          let camina = A.caminar(A.ruta(est, k));
          if (!camina) { A.poner(ent.x, ent.z); est = A.explorar({ x: ent.x, z: ent.z }, s, s.radio, c.paso); k = A.buscar(est, q.x, q.z, tol, s.y + nivel); camina = k >= 0 && A.caminar(A.ruta(est, k)); }
          const [x0, z0] = A.loc(s, s.rot, e.pos.x, e.pos.z);
          out.objetivos.push({ n, busca: true, camina, donde: [A.r2(x0), A.r2(z0), A.r2(e.pos.y - s.y)] });
          if (!camina) A.poner(ent.x, ent.z);
        }
        return out })()`);
      for (const o of r.objetivos) ok(o.busca && o.camina, `${clave}: se llega caminando a ${o.n}${o.camina ? '' : ` (${o.busca ? 'queda en ' + JSON.stringify(o.donde) : 'no hay camino'})`}`);
      if (r.cerrado.length) ok(false, `${clave}: con la puerta cerrada igual se llega a ${r.cerrado.join(', ')}`);
    }

    // ------------------------------------------------------------ 2. las puertas, con E, de los dos lados
    seccion('puertas');
    for (const clave of claves) {
      const lista = await js(`(()=>{ const A = ${A}, H = ${H}; const s = A.estructuras().find((k) => k.clave === ${JSON.stringify(clave)});
        const out = [];
        for (const p of A.puertasDe(s)) {
          A.apartarGente(s);
          p.objetivo = 0; for (let i = 0; i < 60; i++) H.puertas.actualizar(0.05);
          const r = { n: p.nombre };
          // la colisión sigue a la hoja, cerrada y abierta
          const hojaVsCol = () => { const hoja = p.corrediza ? p.hoja : p.g.children[0]; let m0 = null; hoja.traverse((o) => { if (!m0 && o.isMesh) m0 = o; });
            m0.geometry.computeBoundingBox(); p.g.updateWorldMatrix(true, true); const caja = new (m0.geometry.boundingBox.constructor)().setFromObject(hoja);
            return Math.hypot((p.col.ax + p.col.bx) / 2 - (caja.min.x + caja.max.x) / 2, (p.col.az + p.col.bz) / 2 - (caja.min.z + caja.max.z) / 2); };
          r.cerrada = A.r2(hojaVsCol());
          const nx = Math.sin(p.rot), nz = Math.cos(p.rot), a = { x: p.x + nx * 1.1, z: p.z + nz * 1.1 }, b = { x: p.x - nx * 1.4, z: p.z - nz * 1.4 };
          const afuera = Math.hypot(a.x - s.x, a.z - s.z) > Math.hypot(b.x - s.x, b.z - s.z) ? a : b, adentro = afuera === a ? b : a;
          const ent = A.w(s, s.rot, ...s.cfg.entrada);
          A.poner(ent.x, ent.z);
          const est = A.explorar({ x: ent.x, z: ent.z }, s, s.radio, s.cfg.paso);
          const k = A.buscar(est, afuera.x, afuera.z, 0.45);
          r.llega = k >= 0 && A.caminar(A.ruta(est, k));
          const e = H.jugador.estado;
          e.yaw = Math.atan2(-(p.x - e.pos.x), -(p.z - e.pos.z)); e.pitch = -0.1;
          H.__bucle(); H.__bucle();
          r.avisoAfuera = H.__aviso();
          A.tecla('keydown', 'KeyE'); A.tecla('keyup', 'KeyE');
          for (let i = 0; i < 40; i++) H.puertas.actualizar(0.05);
          r.abreAfuera = p.abierta > 0.95;
          r.abierta = A.r2(hojaVsCol());
          r.cruza = A.caminar([{ x: e.pos.x, y: e.pos.y, z: e.pos.z }, { x: p.x, y: p.y, z: p.z }, { x: adentro.x, y: p.y, z: adentro.z }], 0.35);
          e.yaw = Math.atan2(-(p.x - e.pos.x), -(p.z - e.pos.z));
          H.__bucle(); H.__bucle();
          r.avisoAdentro = H.__aviso();
          A.tecla('keydown', 'KeyE'); A.tecla('keyup', 'KeyE');
          for (let i = 0; i < 40; i++) H.puertas.actualizar(0.05);
          r.cierraAdentro = p.abierta < 0.05;
          A.tecla('keydown', 'KeyE'); A.tecla('keyup', 'KeyE');
          for (let i = 0; i < 40; i++) H.puertas.actualizar(0.05);
          r.abreAdentro = p.abierta > 0.95;
          out.push(r);
        }
        return out })()`);
      for (const p of lista) {
        ok(p.cerrada < 0.2 && p.abierta < 0.2, `${p.n}: la colisión va con la hoja (cerrada ${p.cerrada} m, abierta ${p.abierta} m)`);
        ok(p.llega && /^EAbrir/.test(p.avisoAfuera) && p.abreAfuera, `${p.n}: de afuera el aviso dice «${p.avisoAfuera.slice(1)}» y E la abre`);
        ok(p.cruza, `${p.n}: se cruza caminando`);
        ok(/^ECerrar/.test(p.avisoAdentro) && p.cierraAdentro && p.abreAdentro, `${p.n}: de adentro «${p.avisoAdentro.slice(1)}», E la cierra y la vuelve a abrir`);
      }
    }

    // ------------------------------------------------------------ 3. lo que antes andaba mal
    seccion('asientos, mostrador y terreno');
    const varios = await js(`(()=>{ const A = ${A}, H = ${H}, T = H.T, col = H.col, e = H.jugador.estado; const S = Object.fromEntries(A.estructuras().map((s) => [s.clave, s])); const out = {};
      const mirar = (s, lx, lz, mx, mz) => { const p = A.w(s, s.rot, lx, lz), q = A.w(s, s.rot, mx, mz); A.poner(p.x, p.z); e.yaw = Math.atan2(-(q.x - p.x), -(q.z - p.z)); e.pitch = -0.2; H.__bucle(); H.__bucle(); return H.__aviso(); };
      // lo que E tendría adelante (objetos.buscar: se repasa de a ratos, no en cada cuadro)
      const adelante = () => 'E' + (H.objetos.buscar(H.camara, H.jugador)?.texto || '');
      const ref = S.refugio; A.abrirTodas(ref, false); A.apartarGente(ref);
      out.puertaRefugio = mirar(ref, 0.1, 4.1, 0, 2.78);                 // el banco queda al costado: E es la puerta
      mirar(ref, 3.3, -3.45, 2.2, -2.0); out.camaDeAfuera = adelante();             // del otro lado de la pared, la cama no
      mirar(ref, 2.9, -0.95, 2.5, -2.0); out.camaDeAdentro = adelante();
      const alm = S.almacen; A.abrirTodas(alm, true); A.apartarGente(alm);
      out.mostradorDeAfuera = mirar(alm, 0, 3.3, 0, 0.3);               // detrás de la pared del fondo
      out.mostradorDeAdentro = mirar(alm, 0, -1.0, 0, 0.3);
      // terreno que asoma por los pisos (cabañas, almacén, galpón, cueva)
      out.terreno = [];
      for (const k of ['cabana', 'puesto', 'almacen', 'galpon', 'refugio']) { const s = S[k]; if (!s) continue;
        for (const p of col.plataformas) { if (p.duenio || p.radio !== undefined || Math.hypot(p.x - s.x, p.z - s.z) > 1.2 || p.largo < 3 || p.ancho < 3) continue;
          let max = -Infinity; for (let a = -p.largo / 2; a <= p.largo / 2; a += 0.25) for (let b = -p.ancho / 2; b <= p.ancho / 2; b += 0.25) max = Math.max(max, T.altura(p.x + a * p.cos - b * p.sin, p.z + a * p.sin + b * p.cos) - p.alto);
          out.terreno.push([k, A.r2(max)]); } }
      // la cueva: de la boca hasta la pared pintada, el cerro no tapa el piso (0,34 m)
      if (S.cueva) { const s = S.cueva; let max = -Infinity;
        for (let lx = -3.3; lx <= 3.3; lx += 0.3) for (let lz = -3.4; lz <= 0.3; lz += 0.3) { const q = A.w(s, s.rot, lx, lz); max = Math.max(max, T.altura(q.x, q.z) - (s.y + 0.34)); }
        out.terreno.push(['cueva', A.r2(max)]); }
      // la lente del faro va por encima de la cabeza de quien está en la sala
      const f = H.est.faro; out.lente = A.r2(f.lente.position.y - (f.altoSala + 0.02 + 1.65));
      return out })()`);
    ok(/Abrir la puerta del refugio/.test(varios.puertaRefugio), `en el umbral del refugio, con el banco al costado, E abre la puerta («${varios.puertaRefugio.slice(1)}»)`);
    ok(!/Acostarte/.test(varios.camaDeAfuera), `detrás de la pared del fondo no se ofrece la cama («${varios.camaDeAfuera.slice(1)}»)`);
    ok(/Acostarte/.test(varios.camaDeAdentro), `adentro, mirando la cama, sí («${varios.camaDeAdentro.slice(1)}»)`);
    ok(!/Ver qué hay/.test(varios.mostradorDeAfuera), `desde afuera del almacén no se atiende a través de la pared («${varios.mostradorDeAfuera.slice(1)}»)`);
    ok(/Ver qué hay en el almacén/.test(varios.mostradorDeAdentro), `adentro, frente al mostrador, sí («${varios.mostradorDeAdentro.slice(1)}»)`);
    for (const [k, max] of varios.terreno) ok(max <= 0.01, `${k}: el terreno no asoma por el piso (${max} m)`);
    ok(varios.lente > 0, `la lente del faro queda sobre la cabeza (${varios.lente} m)`);

    seccion('el hueco del faro');
    const hueco = await js(`(()=>{ const A = ${A}, H = ${H}, e = H.jugador.estado; const s = A.estructuras().find((k) => k.clave === 'faro'); if (!s) return null;
      A.abrirTodas(s, true); const ent = A.w(s, s.rot, 0, 7.5); A.poner(ent.x, ent.z);
      const est = A.explorar({ x: ent.x, z: ent.z }, s, s.radio); const q = A.w(s, s.rot, -0.35, -0.5); const k = A.buscar(est, q.x, q.z, 0.4, s.y + 15.38);
      if (k < 0 || !A.caminar(A.ruta(est, k))) return { llego: false };
      // de la sala, derecho hacia el hueco de la escalera y la pared de enfrente
      const d = A.w(s, s.rot, -0.3, 1.9); A.tecla('keydown', 'KeyW');
      for (let i = 0; i < 120; i++) { e.yaw = Math.atan2(-(d.x - e.pos.x), -(d.z - e.pos.z)); A.paso(); }
      A.tecla('keyup', 'KeyW'); for (let i = 0; i < 60; i++) A.paso();
      const [lx, lz] = A.loc(s, s.rot, e.pos.x, e.pos.z);
      return { llego: true, r: A.r2(Math.hypot(lx, lz)), y: A.r2(e.pos.y - s.y) } })()`);
    ok(hueco && hueco.llego && hueco.r < 2.6, `cayendo por el hueco del faro no se sale de la torre (${JSON.stringify(hueco)})`);

    // ------------------------------------------------------------ 4. guardar adentro y volver a cargar
    for (const [clave, lx, lz, nivel] of [['faro', -0.35, -0.5, 15.38], ['refugio', 0.6, -0.3, 0.37]]) {
      seccion(`guardar adentro: ${clave}`);
      const antes = await js(`(()=>{ const A = ${A}, H = ${H}, e = H.jugador.estado; const s = A.estructuras().find((k) => k.clave === ${JSON.stringify(clave)});
        A.abrirTodas(s, true); const ent = A.w(s, s.rot, ...s.cfg.entrada); A.poner(ent.x, ent.z);
        const est = A.explorar({ x: ent.x, z: ent.z }, s, s.radio); const q = A.w(s, s.rot, ${lx}, ${lz}); const k = A.buscar(est, q.x, q.z, 0.4, s.y + (${nivel}));
        const llego = k >= 0 && A.caminar(A.ruta(est, k));
        A.abrirTodas(s, false); for (let i = 0; i < 10; i++) A.paso();
        H.guardar(); return { llego, x: e.pos.x, y: e.pos.y, z: e.pos.z } })()`);
      ok(antes.llego, `${clave}: se llega a donde se guarda`);
      await abrir();
      ok(await listo(), 'recargó');
      await entrar();
      const despues = await js(`(()=>{ const A = ${A}, H = ${H}, e = H.jugador.estado; for (let i = 0; i < 20; i++) A.paso(); return { x: e.pos.x, y: e.pos.y, z: e.pos.z, libre: A.libre(e.pos.x, e.pos.y, e.pos.z) } })()`);
      const d = Math.hypot(despues.x - antes.x, despues.z - antes.z);
      ok(d < 0.3 && Math.abs(despues.y - antes.y) < 0.3 && despues.libre, `${clave}: al volver, el jugador sigue ahí y de pie (${d.toFixed(2)} m, Δy ${(despues.y - antes.y).toFixed(2)})`);
    }
  } catch (e) {
    errores.push('excepción: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('OK 3.0.1: todas las estructuras se entran caminando');
  app.exit(0);
});
