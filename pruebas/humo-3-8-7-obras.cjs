// 3.8.7 (obras): partida real (Electron + WebGL) de lo del pase de bugs de la construcción que necesita el mundo 3D, con la
// misma biblioteca que humo-3-0-1-obras (armar con la API de obras, caminar de verdad con W):
//   1. la mesa sobre el piso de la casilla: deshacer el piso no la deja en el aire;
//   2. el fogón prendido se apaga al moverlo (Shift+Y) y al desmontarlo;
//   3. el molino que se mueve no gira su rueda en el lugar viejo, y el alero que se mueve no tapa la lluvia;
//   4. un cantero llevado al pie de un árbol lo despeja;
//   5. las obras que se usan con E y no miraba humo-3-0-1-obras se alcanzan caminando;
//   6. guardar y cargar con la muela a medias;
//   6b. el aviso del chiquero se va en el momento al desmontarlo;
//   7. Desafío: el portón abierto sigue abierto al reforzarlo y al cargar; lo reforzado no se funda (X repite la de antes), la rampa cargada devuelve sus troncos al desarmarla
//      con Shift+Supr, y la catapulta que se mueve no tira.
// Uso: HOJ_PERFIL=<carpeta> npx electron --no-sandbox -r ./herramientas/perfil-propio.cjs pruebas/humo-3-8-7-obras.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- lo que corre en la página
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, O = H.obras, T = H.T, col = H.col, J = H.jugador, V3 = H.THREE.Vector3;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  const R = (v, n = 2) => Math.round(v * 10 ** n) / 10 ** n;
  A.PL = (id) => H.PLANOS.find((p) => p.id === id);
  const mundoR = (x, z, r, lx, lz) => ({ x: x + lx * Math.cos(r) + lz * Math.sin(r), z: z - lx * Math.sin(r) + lz * Math.cos(r) });
  A.mundo = (o, lx, lz) => mundoR(o.datos.x, o.datos.z, o.datos.rot || 0, lx, lz);
  A.local = (o, x, z) => { const r = o.datos.rot || 0, dx = x - o.datos.x, dz = z - o.datos.z; return { lx: dx * Math.cos(r) - dz * Math.sin(r), lz: dx * Math.sin(r) + dz * Math.cos(r) }; };
  A.materiales = () => Object.assign(H.progreso.materiales, { tronco: 9999, tabla: 9999, piedra: 9999, cristal: 9999, lana: 9999 });
  A.limpiar = () => { if (O.editando) O.cancelarEdicion(); for (const o of [...O.obras]) O.destruir(o); O.elegir(null); H.progreso.obras = []; A.ocupados = []; return 1; };
  A.correr = (n = 25) => { if (H.desafio) for (let i = 0; i < n; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); };

  // la física que es de la obra (también la del puente levadizo, que tiene dueño propio)
  const esDe = (o, d) => !!d && (d === o || d.puente === o);
  A.fisica = (o, cx = null, cz = null, Rr = 16) => {
    const obs = new Set(), x0 = cx ?? o.datos.x, z0 = cz ?? o.datos.z;
    for (let x = x0 - Rr; x <= x0 + Rr; x += 4) for (let z = z0 - Rr; z <= z0 + Rr; z += 4) for (const c of col.cercanos(x, z)) if (esDe(o, c.duenio)) obs.add(c);
    return { obs: obs.size, plats: col.plataformas.filter((p) => esDe(o, p.duenio)).length, din: col.dinamicos.filter((p) => esDe(o, p.duenio)).length };
  };
  const pend = (x, z) => Math.acos(Math.max(-1, Math.min(1, T.normal(x, z).y)));
  A.buscarSitio = (id, pmin = 0, pmax = 0.05, rot = 0) => {
    const p = A.PL(id).soloMejora ? A.PL(A.PL(id).mejoraDe) : A.PL(id), r0 = T.lugares.refugio;
    for (let r = 30; r < 260; r += 3.1) {
      const n = Math.max(8, Math.round(2 * Math.PI * r / 3.1));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + r * 0.37, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 480 || Math.abs(z) > 480) continue;
        const pe = pend(x, z);
        if (pe < pmin || pe > pmax) continue;
        let malo = false;
        for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const q = pend(x + dx, z + dz); if (q < pmin * 0.6 || q > pmax * 1.3 + 0.02) malo = true; }
        if (malo || (A.ocupados || []).some((q) => Math.hypot(q.x - x, q.z - z) < 16)) continue;
        if (O.revisarSitio(x, z, p, rot).ok) return { x, z, rot, pendiente: pe };
      }
    }
    return null;
  };
  A.sitioAgua = (id) => {
    const p = A.PL(id), L = { x: 150, z: 110 };
    for (let r = 60; r < 200; r += 0.7) for (let a = 0; a < 6.28; a += 0.04) {
      const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
      for (let k = 0; k < 8; k++) { const rot = k * Math.PI / 4; if (O.revisarSitio(x, z, p, rot).ok) return { x, z, rot }; }
    }
    return null;
  };
  A.sitioMolino = () => {
    const p = A.PL('molino-agua'), rio = T.rio;
    for (let i = 30; i < rio.length - 30; i += 3) {
      const a = rio[i - 2], b = rio[i + 2]; let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      for (const lado of [-1, 1]) for (let d = 1.5; d < 6; d += 0.25) {
        const x = rio[i].x - tz * lado * d, z = rio[i].z + tx * lado * d;
        for (let k = 0; k < 8; k++) { const rot = k * Math.PI / 4; if (O.revisarSitio(x, z, p, rot).ok) return { x, z, rot }; }
      }
    }
    return null;
  };
  A.construir = (id, x, z, rot = 0, ref = null) => {
    A.materiales();
    const p0 = A.PL(id), p = p0.soloMejora ? A.PL(p0.mejoraDe) : p0;   // 3.8.7: lo reforzado no se funda: se arma lo de antes y se refuerza
    O.elegir(p);
    const f = O.fundar(x, z, rot, ref);
    if (!f.ok) { O.elegir(null); return { ok: false, error: f.motivo }; }
    const etapas = [];
    for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { const q = O.avanzar(f.obra, H.progreso.materiales); etapas.push(q.ok || q.motivo); if (!q.ok) break; }
    if (p0 !== p && f.obra.datos.etapas >= f.obra.plano.etapas.length) O.reemplazarPlano(f.obra, p0.id);
    O.elegir(null);
    H.progreso.obras = O.obras.map((o) => o.datos);
    (A.ocupados = A.ocupados || []).push({ x: f.obra.datos.x, z: f.obra.datos.z });
    A.correr();
    return { ok: f.obra.datos.etapas >= f.obra.plano.etapas.length, i: O.obras.indexOf(f.obra), etapas };
  };
  A.obra = (i) => O.obras[i];
  A.poner = (id, pmin = 0, pmax = 0.05) => {
    const s = A.PL(id).sobreAgua ? A.sitioAgua(id) : id === 'molino-agua' ? A.sitioMolino() : A.buscarSitio(id, pmin, pmax);
    if (!s) throw new Error('sin sitio para ' + id);
    const c = A.construir(id, s.x, s.z, s.rot);
    if (!c.ok) throw new Error(id + ': ' + c.error);
    return A.obra(c.i);
  };

  // ------------------------------------------------ caminar de verdad
  const tecla = (code, tipo = 'keydown') => document.dispatchEvent(new KeyboardEvent(tipo, { code, key: code, bubbles: true }));
  A.tecla = tecla;
  A.ponerLocal = (o, lx, lz, y = null) => {
    const q = A.mundo(o, lx, lz), js = J.estado;
    js.enCable = false; js.sentado = false; js.agachado = false;
    js.pos.set(q.x, y ?? T.altura(q.x, q.z), q.z); js.vel.set(0, 0, 0); js.vy = 0; js.enSuelo = true;
    for (let i = 0; i < 6; i++) J.actualizar(0.05);
  };
  A.caminarLocal = (o, puntos, { max = 800, tol = 0.28, trabado = 24 } = {}) => {
    const js = J.estado;
    let pasos = 0;
    tecla('KeyW');
    try {
      for (const [lx, lz] of puntos) {
        const t = A.mundo(o, lx, lz);
        let quieto = 0, ax = js.pos.x, az = js.pos.z;
        for (;;) {
          const dx = t.x - js.pos.x, dz = t.z - js.pos.z;
          if (Math.hypot(dx, dz) < tol) break;
          if (++pasos > max) return false;
          js.yaw = Math.atan2(-dx, -dz);
          J.actualizar(0.05);
          quieto = Math.hypot(js.pos.x - ax, js.pos.z - az) < 0.012 ? quieto + 1 : 0;
          ax = js.pos.x; az = js.pos.z;
          if (quieto > trabado) return false;
        }
      }
      return true;
    } finally { tecla('KeyW', 'keyup'); for (let i = 0; i < 10; i++) J.actualizar(0.05); }
  };
  A.dy = (o) => R(J.estado.pos.y - o.datos.y);
  A.pies = (o) => { const l = A.local(o, J.estado.pos.x, J.estado.pos.z); return [R(l.lx), R(l.lz), A.dy(o)]; };
  A.subir = (o, ruta, esperado, tol = 0.13) => {
    A.ponerLocal(o, ruta[0][0], ruta[0][1]);
    const ok = A.caminarLocal(o, ruta.slice(1));
    return { ok: ok && Math.abs(A.dy(o) - esperado) < tol, pies: A.pies(o), esperado };
  };
  A.aviso = () => { for (let i = 0; i < 3; i++) H.__bucle(); return H.__aviso(); };
  // lo que se mide es la obra: sin las plantas y cosas sueltas del lugar, que tienen su propio
  // aviso («Anotar ñire») y le ganan a E cuando quedan en la mira
  const buscarObjetos = H.objetos.buscar;
  A.sinObjetos = (si) => { H.objetos.buscar = si ? () => null : buscarObjetos; return 1; };
  A.avisoAbajo = () => { J.estado.pitch = -0.75; return A.aviso(); };
  A.pulsarE = () => {
    tecla('KeyE'); tecla('KeyE', 'keyup');
    for (let i = 0; i < 25; i++) H.__bucle();
    for (let i = 0; i < 80 && (H.puertas?.lista || []).some((p) => Math.abs(p.abierta - p.objetivo) > 0.001); i++) H.__bucle();
    return 1;
  };
})()`;

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
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 180 s (${donde})`)), 180000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const partida = async (modo) => {
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', estacion:'verano', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await abrir();
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) { listo = true; break; } }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(PAGINA);
    await js(`(()=>{ const P = ${H}.progreso; P.horas = 11; if (P.desafio) P.desafio.salud = 100; for (let i = 0; i < 3; i++) ${H}.__bucle(); return 1 })()`);
    return listo;
  };
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, O = H.obras, T = H.T; ${c} })()`);
  let copiaStorage = null;

  try {
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(500); if (await js(`!!${H}`).catch(() => false)) break; }
    copiaStorage = await js(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))`);

    // ================================================================ Relax
    seccion('relax: carga');
    ok(await partida('relax'), 'carga el Relax');

    seccion('relax: la mesa en el piso de la casilla');
    const mesa = await A(`
      A.limpiar(); const c = A.poner('casilla');
      const q = A.mundo(c, 0.6, 0.4); const m = A.construir('mesa-campo', q.x, q.z, c.datos.rot || 0, c.datos.y + 0.62);
      const mo = A.obra(m.i), alto = Math.round((mo.datos.y - c.datos.y) * 100) / 100;
      const r = []; for (let i = 0; i < 4; i++) r.push(O.deshacerEtapa({ x: c.datos.x, z: c.datos.z }, 6));
      return { mesa: m.ok, alto, etapas: c.datos.etapas, motivos: r.map((x) => x.ok || x.motivo), piso: H.col.plataformaEn(mo.datos.x, mo.datos.z, mo.datos.y + 0.05, 0.1)?.duenio === c };`);
    ok(mesa.mesa && mesa.alto > 0.5 && mesa.etapas === 2 && mesa.piso && /apoyada/.test(String(mesa.motivos[2])),
      `deshacer el piso de la casilla con la mesa encima no se puede: la mesa no queda en el aire (${JSON.stringify(mesa)})`);

    seccion('relax: el fuego de la obra que ya no está');
    const fuego = await A(`
      A.limpiar(); const f = A.poner('fogon'), js = H.jugador.estado, C = H.clima;
      A.ponerLocal(f, 0, -2.2); H.__encenderFuego(); for (let i = 0; i < 3; i++) H.__bucle();
      const prendido = C.fogata.activa && C.fogata.duenio === f;
      // movido con Shift+Y
      O.elegir(f.plano); O.iniciarEdicionCerca({ x: f.datos.x, y: f.datos.y, z: f.datos.z }, 3); for (let i = 0; i < 3; i++) H.__bucle();
      const alMover = C.fogata.activa; O.cancelarEdicion(); O.elegir(null);
      H.__encenderFuego(); for (let i = 0; i < 3; i++) H.__bucle();
      const otraVez = C.fogata.activa;
      O.desmontarCerca({ x: f.datos.x, y: f.datos.y, z: f.datos.z }, 3); for (let i = 0; i < 3; i++) H.__bucle();
      return { prendido, alMover, otraVez, desmontado: C.fogata.activa };`);
    ok(fuego.prendido && !fuego.alMover && fuego.otraVez && !fuego.desmontado, `el fogón prendido se apaga al moverlo y al desmontarlo (${JSON.stringify(fuego)})`);

    seccion('relax: la obra que se mueve no trabaja ni tapa');
    const mov = await A(`
      A.limpiar(); const out = {};
      const m = A.poner('molino-agua'); H.__maquinas.revisar();
      out.rueda = H.__maquinas.mundo().molino.ruedas.size;
      O.elegir(m.plano); out.agarrado = O.iniciarEdicionCerca({ x: m.datos.x, y: m.datos.y, z: m.datos.z }, 4).ok; H.__maquinas.revisar();
      out.ruedaMoviendo = H.__maquinas.mundo().molino.ruedas.size;
      O.cancelarEdicion(); O.elegir(null); H.__maquinas.revisar(); out.ruedaDeVuelta = H.__maquinas.mundo().molino.ruedas.size;
      A.limpiar(); const al = A.poner('alero'); const p = { x: al.datos.x, y: al.datos.y + 0.3, z: al.datos.z };
      out.techo = !!O.bajoCubierta(p);
      O.elegir(al.plano); O.iniciarEdicionCerca(p, 3); out.techoMoviendo = !!O.bajoCubierta(p); O.cancelarEdicion(); O.elegir(null);
      return out;`);
    ok(mov.rueda === 1 && mov.agarrado && mov.ruedaMoviendo === 0 && mov.ruedaDeVuelta === 1, `el molino que se mueve no gira su rueda en el lugar viejo (${JSON.stringify(mov)})`);
    ok(mov.techo && !mov.techoMoviendo, 'el alero que se mueve no tapa la lluvia');

    seccion('relax: Shift+Y al pie de un árbol');
    const arbol = await A(`
      A.limpiar(); const c = A.poner('cantero');
      const a = H.veg.arboles.find((t) => !t.sacado && !t.despejado && Math.hypot(t.x - c.datos.x, t.z - c.datos.z) < 60 && Math.hypot(t.x - c.datos.x, t.z - c.datos.z) > 8 &&
        O.revisarSitio(t.x + 0.4, t.z, c.plano, 0, c).ok);
      if (!a) return { sin: true };
      O.elegir(c.plano); O.iniciarEdicionCerca({ x: c.datos.x, y: c.datos.y, z: c.datos.z }, 3);
      const r = O.confirmarEdicion(a.x + 0.4, a.z, 0); O.elegir(null);
      return { ok: r.ok, sacado: !!a.sacado };`);
    ok(arbol.sin || (arbol.ok && arbol.sacado), `el árbol del lugar nuevo se despeja (${JSON.stringify(arbol)})`);

    seccion('relax: lo que se usa con E (lo que no miraba humo-3-0-1-obras) se alcanza caminando');
    const usos = await A(`
      const lista = ['bebedero', 'tambo', 'chiquero', 'parrilla', 'cocina-lena', 'alacena', 'telar', 'gallinero'];
      // (la granja mira sus obras cada medio segundo de juego: se la deja ponerse al día)
      const alDia = () => { const t0 = performance.now(); while (performance.now() - t0 < 650) H.__bucle(); };
      const out = [];
      A.sinObjetos(true);
      for (const id of lista) {
        A.limpiar(); let o; try { o = A.poner(id); } catch (e) { out.push({ id, error: e.message }); continue; }
        alDia();
        const d = (o.plano.radio || 1.5) + 3; let bien = 0; const avisos = [];
        for (const [ax, az] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          A.ponerLocal(o, ax * (d + 30), az * (d + 30)); A.aviso();
          A.ponerLocal(o, ax * d, az * d); A.caminarLocal(o, [[ax * 0.05, az * 0.05]], { trabado: 10, max: 300 });
          // (el comedero del tambo y la batea del chiquero se usan desde afuera, por delante y por atrás)
          if (id === 'tambo' || id === 'chiquero') { const c = id === 'tambo' ? [0, -2.4] : [1.05, 2.1]; A.caminarLocal(o, [c], { trabado: 10, max: 300 }); alDia(); }
          const av = A.avisoAbajo(); avisos.push(av);
          if (/^E/.test(av)) bien++;
        }
        out.push({ id, bien, avisos });
      }
      A.sinObjetos(false);
      return out;`);
    for (const u of usos) console.log(`   ${u.id}: ${u.error || u.avisos.join(' | ')}`);
    const noAlcanzan = usos.filter((u) => u.error || u.bien < 1);
    ok(!noAlcanzan.length, `${usos.length} obras más que se usan con E se alcanzan caminando (sin alcance: ${JSON.stringify(noAlcanzan.map((u) => u.id))})`);

    seccion('relax: el aviso del chiquero se va al desmontarlo');
    const chi = await A(`
      A.limpiar(); const o = A.poner('chiquero'); A.sinObjetos(true);
      A.ponerLocal(o, 1.05, 2.1); H.jugador.estado.yaw = 0; const antes = A.avisoAbajo();
      O.desmontarCerca({ x: o.datos.x, y: o.datos.y, z: o.datos.z }, 4); H.progreso.obras = O.obras.map((x) => x.datos);
      const despues = A.avisoAbajo(); A.sinObjetos(false);
      return { antes, despues };`);
    ok(/Chiquero|Batea|batea/.test(chi.antes) && !/Chiquero|batea/i.test(chi.despues), `el aviso de la batea desaparece en el momento (${JSON.stringify(chi)})`);

    seccion('relax: guardar y cargar con la muela moliendo');
    const g1 = await A(`
      A.limpiar(); const m = A.poner('molino-agua'); H.__maquinas.revisar();
      m.datos.muela = { habas: 6, avance: 0.5, harina: 1, hora: null };
      H.__maquinas.revisar();
      H.progreso.obras = O.obras.map((o) => o.datos); H.guardar();
      return { muela: JSON.stringify(m.datos.muela), x: m.datos.x, z: m.datos.z };`);
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500); await js(PAGINA);
    const g2 = await A(`const m = O.obras.find((o) => o.plano.id === 'molino-agua'); H.__maquinas.revisar(); return m ? { muela: JSON.stringify(m.datos.muela), ruedas: H.__maquinas.mundo().molino.ruedas.size } : null;`);
    ok(g2 && g2.ruedas === 1 && /"harina":[1-9]/.test(g2.muela), `al cargar, el molino sigue con su muela (${JSON.stringify([g1, g2])})`);

    // ================================================================ Desafío
    seccion('desafío: carga');
    ok(await partida('desafio'), 'carga el Desafío');

    seccion('desafío: lo reforzado no se funda; X repite la de antes');
    const ref = await A(`
      A.limpiar(); const out = {};
      O.elegir(A.PL('empalizada-reforzada')); const s = A.buscarSitio('empalizada');
      out.fundar = O.fundar(s.x, s.z, 0).motivo || 'se fundó';
      O.elegir(null);
      const e = A.obra(A.construir('empalizada-reforzada', s.x, s.z, 0).i); out.reforzada = e?.plano.id;
      const x = O.copiarCerca({ x: e.datos.x, y: e.datos.y, z: e.datos.z }, 3); out.repite = x.plano?.id; O.elegir(null);
      return out;`);
    ok(/reforzando/.test(ref.fundar) && ref.reforzada === 'empalizada-reforzada' && ref.repite === 'empalizada', `la empalizada reforzada sale de reforzar (${JSON.stringify(ref)})`);

    seccion('desafío: desarmar la rampa cargada devuelve sus troncos');
    const rampa = await A(`
      A.limpiar(); const o = A.poner('rampa-troncos'); o.datos.troncos = 2; A.correr();
      const antes = H.progreso.materiales.tronco;
      A.ponerLocal(o, 0, -2); A.tecla('KeyO'); for (let i = 0; i < 3; i++) H.__bucle();
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Delete', key: 'Delete', shiftKey: true, bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keyup', { code: 'Delete', key: 'Delete', shiftKey: true, bubbles: true }));
      for (let i = 0; i < 3; i++) H.__bucle();
      A.tecla('KeyO'); for (let i = 0; i < 3; i++) H.__bucle();
      const pide = o.plano.etapas.reduce((s, e) => s + (e.pide?.tronco > 1 ? Math.floor(e.pide.tronco * 0.5) : 0), 0);
      return { desarmada: !O.obras.includes(o), devuelto: H.progreso.materiales.tronco - antes, pide };`);
    ok(rampa.desarmada && rampa.devuelto === rampa.pide + 2, `la rampa desarmada devuelve la mitad de lo que costó y los 2 troncos cargados (${JSON.stringify(rampa)})`);

    seccion('desafío: la catapulta que se mueve no tira');
    const cat = await A(`
      A.limpiar(); const o = A.poner('catapulta'); A.correr(30);
      O.elegir(o.plano); const e = O.iniciarEdicionCerca({ x: o.datos.x, y: o.datos.y, z: o.datos.z }, 4); A.correr(30);
      const piedras = o.datos.piedras;
      H.progreso.horas = 23;
      const a = H.desafio.invocar('rastreador', o.datos.x + 20, o.datos.z); if (a) { a.vida = a.vidaMax = 5000; }
      for (let i = 0; i < 200; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      if (a) { a.estado = 'irse'; a.t = 9; } H.progreso.horas = 11; H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      const r = { agarrada: e.ok, antes: piedras, despues: o.datos.piedras };
      O.cancelarEdicion(); O.elegir(null);
      return r;`);
    ok(cat.agarrada && cat.antes === cat.despues, `mientras se mueve, la catapulta no gasta piedras tirando desde el lugar viejo (${JSON.stringify(cat)})`);

    seccion('desafío: el portón abierto sigue abierto al reforzarlo y al cargar');
    const por = await A(`
      A.limpiar(); const o = A.poner('porton-empalizada');
      A.ponerLocal(o, 0, -1.2); A.pulsarE();
      const p = () => (H.puertas?.lista || []).find((q) => q.duenio === O.obras.find((x) => x.plano.porton));
      const abierto = p()?.objetivo === 1 && o.datos.abierto === true;
      O.reemplazarPlano(o, 'porton-reforzado'); A.correr();
      const reforzado = p()?.objetivo === 1;
      H.progreso.obras = O.obras.map((x) => x.datos); H.guardar();
      return { abierto, reforzado };`);
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500); await js(PAGINA);
    const por2 = await A(`const o = O.obras.find((x) => x.plano.id === 'porton-reforzado'); const q = o && (H.puertas?.lista || []).find((p) => p.duenio === o); return o ? { abierta: q?.abierta, objetivo: q?.objetivo } : null;`);
    ok(por.abierto && por.reforzado && por2?.abierta === 1 && por2?.objetivo === 1, `abierto con E, reforzado y cargado, sigue abierto (${JSON.stringify([por, por2])})`);
  } catch (e) {
    errores.push(`${donde}: ${e.message}`);
  } finally {
    if (copiaStorage) {
      await js(`(()=>{ const c = JSON.parse(${JSON.stringify(copiaStorage)});
        localStorage.clear(); for (const [k, v] of Object.entries(c)) localStorage.setItem(k, v);
        Storage.prototype.setItem = () => {}; Storage.prototype.removeItem = () => {}; Storage.prototype.clear = () => {}; return 1 })()`).catch(() => {});
    }
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('OK humo 3.8.7 · obras');
  app.exit(0);
});
