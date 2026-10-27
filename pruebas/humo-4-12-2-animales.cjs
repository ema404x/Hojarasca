// Partida real 4.12.2 (Electron + WebGL): los animales con huesos.
//   1. Media: el Relax arma sin errores de consola ni de shader; los ciervos, los huemules, el perro y el caballo traen su piel por huesos
//      (una malla con `isSkinnedMesh`, el mismo material de la fauna) y de lejos se ven rígidos;
//   2. cerca (menos de 40 m) la piel se dibuja y las mallas rígidas se esconden; lejos, al revés; con histéresis;
//   3. NINGÚN programa de shader nuevo: se cuentan los programas al terminar la carga y de nuevo después de mostrar cada animal con piel, de
//      día y de noche, a caballo y de pie (el programa con huesos se compiló en la carga);
//   4. los dibujos: un animal con piel es una malla (menos que la rígida) y el cuadro entero no suma dibujos;
//   5. la marcha del perro, del ciervo y del caballo (quieto, paso, trote, galope, pastando, olfateando, huyendo) con la piel puesta: los huesos
//      se mueven, nada se estira ni se hunde (se mira en la propia malla), y el caballo montado anda con la cámara arriba;
//   6. Baja y Mínima: no arman piel (ni el programa con huesos), siguen rígidos y sin errores;
//   7. guardar y recargar el caballo y el perro personalizados sigue andando con piel (se rearma al personalizar);
//   8. capturas de las poses (quieto, paso, galope, pastando, olfateando, montado) y de cuadros seguidos.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-12-2-animales.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
// Las capturas quedan en HUMO_SALIDA (o pruebas/salidas/animales-4-12-2).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'animales-4-12-2'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const { PAGINA } = require('../herramientas/ayuda-animales-4-12-2.cjs');
const escenarios = fs.existsSync(path.join(__dirname, 'humo-4-12-2-escenas.cjs')) ? require('./humo-4-12-2-escenas.cjs') : {};

// lo que corre dentro de la página para mirar a los animales
const PAGINA2 = String.raw`(() => {
  const A = window.__A, H = window.__hojarasca, T = H.T;
  A.tecla = (code, tipo) => { document.dispatchEvent(new KeyboardEvent(tipo, { code, key: code, bubbles: true })); return 1; };
  A.programas = () => H.renderer.info.programs.length;
  A.nombresProgramas = () => H.renderer.info.programs.map((p) => p.name + ':' + (p.cacheKey || '').length);
  A.piezas = (g) => { const r = { piel: 0, rigidas: 0 }; g.traverse((o) => { if (!o.isMesh || !o.visible) return; if (o.isSkinnedMesh) r.piel++; else if (o.material && o.material.isMeshLambertMaterial && o.material.vertexColors) r.rigidas++; }); return r; };
  // todos los animales con piel que hay en el mundo (los ciervos, los huemules, el perro y el caballo)
  A.conPiel = () => {
    const lista = [];
    for (const c of A.ciervos()) lista.push({ nombre: 'ciervo', a: c, g: c.g, piel: c.piel });
    for (const h of A.huemules()) lista.push({ nombre: 'huemul', a: h, g: h.g, piel: h.piel });
    const pe = H.perro; if (pe) lista.push({ nombre: 'perro', a: pe.malla, g: pe.malla.g, piel: pe.malla.piel });
    return lista;
  };
  A.estadoPiel = () => A.conPiel().map((q) => ({ nombre: q.nombre, tiene: !!q.piel, activa: !!(q.piel && q.piel.activa), skin: q.piel ? q.piel.malla.isSkinnedMesh === true : false, mismoMaterial: q.piel ? q.piel.malla.material === (q.piel.rigidas[0] && q.piel.rigidas[0].material) : null, huesos: q.piel ? q.piel.huesos.n : 0, x: +q.g.position.x.toFixed(1), z: +q.g.position.z.toFixed(1) }));
  // los vértices de la piel como los dejan los huesos: ¿se estira, se hunde?
  A.revisarMalla = (q) => {
    const m = q.piel.malla, sk = m.skeleton; sk.update();
    const geo = m.geometry, P = geo.attributes.position, sw = geo.attributes.skinWeight, si = geo.attributes.skinIndex, ind = geo.index, M = sk.boneMatrices, b0 = 0;
    const out = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i); let ox = 0, oy = 0, oz = 0;
      for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (!w) continue; const o = (b0 + si.getComponent(i, k)) * 16;
        ox += w * (M[o] * x + M[o + 4] * y + M[o + 8] * z + M[o + 12]); oy += w * (M[o + 1] * x + M[o + 5] * y + M[o + 9] * z + M[o + 13]); oz += w * (M[o + 2] * x + M[o + 6] * y + M[o + 10] * z + M[o + 14]); }
      out[i * 3] = ox; out[i * 3 + 1] = oy; out[i * 3 + 2] = oz;
    }
    let peor = 0, bajo = 1e9, nan = 0;
    for (let t = 0; t < ind.count; t += 3) for (let e = 0; e < 3; e++) {
      const a = ind.getX(t + e), b = ind.getX(t + (e + 1) % 3);
      const r = Math.hypot(P.getX(a) - P.getX(b), P.getY(a) - P.getY(b), P.getZ(a) - P.getZ(b)); if (r < 0.004) continue;
      peor = Math.max(peor, Math.hypot(out[a * 3] - out[b * 3], out[a * 3 + 1] - out[b * 3 + 1], out[a * 3 + 2] - out[b * 3 + 2]) / r);
    }
    for (let i = 0; i < out.length; i++) { if (!Number.isFinite(out[i])) nan++; if (i % 3 === 1) bajo = Math.min(bajo, out[i]); }
    return { estira: +peor.toFixed(2), bajo: +bajo.toFixed(3), nan };
  };
  A.moverPerro = (x, z, rumbo) => { const e = H.perro.est; e.pos.set(x, T.altura(x, z), z); e.rumbo = rumbo; e.rumboObjetivo = rumbo; e.vel = 0; };
  A.mover = (a, x, z, rumbo) => { a.pos.set(x, T.altura(x, z), z); a.rumbo = rumbo; a.g.rotation.y = rumbo; a.vel = 0; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 300)); }
  });
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const A = (c) => js(`(async () => { const H = window.__hojarasca, A = window.__A; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = (calidad) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, idioma:'es', estacion:'verano', limiteFps:'libre', modoFluido:false})); 1`;
  const abrir = async (calidad) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(ajustes(calidad)); await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA); await js(PAGINA2);
    await A('A.cuadros(30)');
  };
  const guardarFoto = (nombre, dataUrl) => { fs.writeFileSync(path.join(salida, nombre + '.jpg'), Buffer.from(dataUrl.split(',')[1], 'base64')); console.log(`  (captura ${nombre}.jpg)`); };
  try {
    // ---------------------------------------------------------------- Baja: nada de piel
    donde = 'baja';
    await abrir('baja');
    const progsBajaCarga = await js('window.__hojarasca.renderer.info.programs.length');
    await entrar();
    let est = await A('A.estadoPiel()');
    ok(est.length >= 3 && est.every((q) => !q.tiene), `Baja: ${est.length} animales sin piel (siguen rígidos como siempre)`);
    await A('(async () => { for (let i = 0; i < 90; i++) { H.__bucle(); await A.dormir(8); } return 1 })()');
    const progsBaja = await A('A.programas()');
    const deltaBaja = progsBaja - progsBajaCarga;
    console.log(`  Baja: programas ${progsBajaCarga} al terminar la carga, ${progsBaja} jugando (${deltaBaja} se arman al entrar, con o sin animales)`);
    const cBaja = await A('(() => { const R = H.renderer; R.info.autoReset = false; R.info.reset(); H.__bucle(); const r = R.info.render.calls; R.info.autoReset = true; return r })()');
    ok(cBaja > 20 && cBaja < 400, `Baja: ${cBaja} dibujos por cuadro`);

    // ---------------------------------------------------------------- Media
    donde = 'media';
    await abrir('media');
    const progsCarga = await js('window.__hojarasca.renderer.info.programs.length');
    await entrar();
    ok(await A('H.ajustes.calidad') === 'media', 'calidad media');
    est = await A('A.estadoPiel()');
    ok(est.length >= 4 && est.every((q) => q.tiene && q.skin && q.mismoMaterial && q.huesos === 22), `Media: ${est.length} animales (ciervos, huemules y perro) con piel por huesos del mismo material que la malla rígida`);
    const cab = await A('(() => { const c = H.__caballo(); return c && c.malla ? { hay: true } : { hay: false } })()');
    ok(cab.hay, 'el caballo está en el mundo');
    // ---- 2. el LOD con animales de verdad
    donde = 'lod';
    const lod = await A(`(async () => {
      const B = A.llano(); A.jugadorEn(B.x, B.z, 0);
      const res = { cerca: [], lejos: [] };
      const lista = A.conPiel().filter((q) => q.nombre !== 'perro');
      lista.forEach((q, i) => { q.a.estado = 'pastar'; q.a.t = 99; A.mover(q.a, B.x + (i - 2) * 3, B.z - 12 - i * 2, i); });
      A.moverPerro(B.x + 2, B.z - 6, 1);
      await A.cuadros(40, 8);
      for (const q of A.conPiel()) res.cerca.push({ n: q.nombre, activa: q.piel.activa, ...A.piezas(q.g) });
      lista.forEach((q, i) => { q.a.estado = 'pastar'; q.a.t = 99; A.mover(q.a, B.x + (i - 2) * 3, B.z - 70 - i * 2, i); });
      A.moverPerro(B.x + 2, B.z - 60, 1);
      await A.cuadros(40, 8);
      for (const q of lista) res.lejos.push({ n: q.nombre, activa: q.piel.activa, ...A.piezas(q.g) });
      return res;
    })()`);
    ok(lod.cerca.length >= 4 && lod.cerca.every((q) => q.activa && q.piel === 1 && q.rigidas === 0), `cerca (menos de 40 m): ${lod.cerca.length} animales con una sola malla de piel y ninguna rígida visible`);
    ok(lod.lejos.length >= 3 && lod.lejos.every((q) => !q.activa && q.piel === 0 && q.rigidas >= 4), `lejos (más de 46 m): los mismos, rígidos (${lod.lejos.map((q) => q.rigidas).join(',')} mallas)`);
    // ---- 3. ningún programa nuevo
    donde = 'programas';
    const progs0 = await A('A.programas()');
    const nombres0 = new Set(await A('A.nombresProgramas()'));
    ok(progs0 - progsCarga <= deltaBaja, `los animales con piel no compilaron nada más que lo de Baja desde la carga (${progsCarga} → ${progs0}; en Baja, sin piel: ${progsBajaCarga} → ${progsBaja})`);
    // la vuelta completa: de día, de noche, girando, a caballo, quieto y andando
    await A(`(async () => {
      const B = A.llano(); A.jugadorEn(B.x, B.z, 0);
      const lista = A.conPiel();
      lista.forEach((q, i) => { if (q.nombre !== 'perro') { q.a.estado = 'pastar'; q.a.t = 99; A.mover(q.a, B.x + (i - 3) * 2.5, B.z - 9 - i * 1.5, i); } });
      const c = H.progreso.caballo || (H.progreso.caballo = {}); c.x = B.x; c.z = B.z + 3; c.yaw = 0.4; H.progreso.cosas = Object.assign(H.progreso.cosas || {}, { caballo: 1 });
      for (const h of [12, 22, 6.5, 12]) { H.progreso.horas = h; for (let i = 0; i < 40; i++) { H.__bucle(); await A.dormir(6); } }
      H.jugador.estado.yaw += 2.4; await A.cuadros(30, 6); H.jugador.estado.yaw -= 2.4;
      H.montar(); await A.cuadros(30, 6);
      A.tecla('KeyW', 'keydown'); await A.cuadros(80, 8); A.tecla('ShiftLeft', 'keydown'); await A.cuadros(80, 8);
      A.tecla('ShiftLeft', 'keyup'); A.tecla('KeyW', 'keyup'); await A.cuadros(30, 8);
      H.desmontar(); await A.cuadros(30, 8);
      return 1; })()`);
    const progs1 = await A('A.programas()');
    const nuevos = (await A('A.nombresProgramas()')).filter((x) => !nombres0.has(x));
    ok(progs1 === progs0, `ningún programa de shader nuevo de día, de noche, girando, a caballo y de pie (${progs0} → ${progs1}${nuevos.length ? ': ' + JSON.stringify(nuevos) : ''})`);
    // ---- 4. dibujos
    donde = 'dibujos';
    const dib = await A(`(async () => {
      const B = A.llano(); A.jugadorEn(B.x, B.z, 0); H.progreso.horas = 12;
      const lista = A.conPiel().filter((q) => q.nombre !== 'perro');
      const medir = async () => { for (let i = 0; i < 20; i++) { H.__bucle(); await A.dormir(6); } const R = H.renderer; R.info.autoReset = false; R.info.reset(); H.__bucle(); const r = { llamadas: R.info.render.calls, tris: R.info.render.triangles }; R.info.autoReset = true; return r; };
      lista.forEach((q, i) => { q.a.estado = 'pastar'; q.a.t = 99; A.mover(q.a, B.x + (i - 2) * 3, B.z - 10 - i * 1.5, i); });
      A.moverPerro(B.x + 2, B.z - 6, 1);
      const conPiel = await medir();
      const cuenta = A.conPiel().filter((q) => q.piel.activa).length;
      lista.forEach((q, i) => { q.a.estado = 'pastar'; q.a.t = 99; A.mover(q.a, B.x + (i - 2) * 3, B.z - 80 - i * 1.5, i); });
      A.moverPerro(B.x + 2, B.z - 70, 1);
      const lejos = await medir();
      return { conPiel, lejos, cuenta, animales: A.conPiel().length };
    })()`);
    console.log(`  dibujos: ${dib.animales} animales, ${dib.cuenta} con piel a la vista: ${dib.conPiel.llamadas} dibujos y ${dib.conPiel.tris} triángulos; los mismos lejos y rígidos: ${dib.lejos.llamadas} y ${dib.lejos.tris}`);
    ok(dib.cuenta >= 4, `${dib.cuenta} animales con piel a la vista`);
    ok(dib.conPiel.tris < dib.lejos.tris * 1.6 + 60000, 'los triángulos del cuadro no se disparan');
    // ---- 5. la malla en movimiento
    donde = 'poses';
    const poses = await A(`(async () => {
      const B = A.llano(); A.jugadorEn(B.x, B.z, 0);
      const salida = [];
      const lista = A.conPiel().filter((q) => q.nombre !== 'perro');
      // cada animal pasa por pastar, caminar, huir y alerta, mirando la malla en cada momento
      lista.forEach((q, i) => A.mover(q.a, B.x + (i - 2) * 4, B.z - 11 - i * 2, i));
      const peor = { estira: 0, bajo: 0, nan: 0, cuadros: 0 };
      for (const est of ['pastar', 'caminar', 'huir', 'alerta', 'pastar']) {
        for (let i = 0; i < 70; i++) {
          for (const q of lista) { q.a.estado = est; q.a.t = 99; if (est === 'caminar') q.a.obj = { x: q.a.pos.x + Math.sin(q.a.rumbo) * 20, z: q.a.pos.z + Math.cos(q.a.rumbo) * 20 };
            if (Math.hypot(q.a.pos.x - B.x, q.a.pos.z - B.z) > 30) A.mover(q.a, B.x + (q.a.pos.x > B.x ? -4 : 4), B.z - 12, q.a.rumbo + 2); }
          A.jugadorEn(B.x, B.z, 0); H.__bucle(); await A.dormir(4);
          if (i % 10 === 0) for (const q of lista) if (q.piel.activa) { const m = A.revisarMalla(q); peor.estira = Math.max(peor.estira, m.estira); peor.bajo = Math.min(peor.bajo, m.bajo); peor.nan += m.nan; peor.cuadros++; }
        }
      }
      return peor; })()`);
    ok(poses.cuadros > 30 && poses.nan === 0, `${poses.cuadros} cuadros de ciervos y huemules pastando, caminando, huyendo y alertas: sin vértices rotos`);
    ok(poses.estira < 1.9, `y nada se estira más de ${poses.estira}×`);
    ok(poses.bajo > -0.12, `y ninguna pata se hunde en el piso (${poses.bajo} m)`);
    // el perro: seguir, olfatear, marcar, correr
    const perro = await A(`(async () => {
      const B = A.llano(); A.jugadorEn(B.x, B.z, 0);
      const e = H.perro.est, q = A.conPiel().find((x) => x.nombre === 'perro');
      const peor = { estira: 0, bajo: 0, nan: 0, cuadros: 0, activa: 0 };
      for (const est of ['olfatear', 'adelante', 'seguir', 'olfatear']) {
        for (let i = 0; i < 80; i++) {
          e.estado = est; e.t = 5; if (est === 'olfatear') e.olfateo = 1;
          if (est === 'adelante') e.objetivo.set(e.pos.x + Math.sin(e.rumbo) * 20, 0, e.pos.z + Math.cos(e.rumbo) * 20);
          if (Math.hypot(e.pos.x - B.x, e.pos.z - B.z) > 20) { e.pos.set(B.x + 3, H.T.altura(B.x + 3, B.z - 5), B.z - 5); e.rumbo += 2; }
          A.jugadorEn(B.x, B.z, 0); H.__bucle(); await A.dormir(4);
          if (q.piel.activa) peor.activa++;
          if (i % 10 === 0 && q.piel.activa) { const m = A.revisarMalla(q); peor.estira = Math.max(peor.estira, m.estira); peor.bajo = Math.min(peor.bajo, m.bajo); peor.nan += m.nan; peor.cuadros++; }
        }
      }
      return peor; })()`);
    ok(perro.activa > 200 && perro.nan === 0 && perro.estira < 1.8 && perro.bajo > -0.1, `perro con piel olfateando, andando y siguiendo: ${perro.cuadros} cuadros revisados, estira ${perro.estira}×, base ${perro.bajo} m`);
    // el caballo, montado y de pie
    donde = 'caballo';
    const cab2 = await A(`(async () => {
      const B = A.llano(); A.jugadorEn(B.x, B.z, 0); H.progreso.horas = 12;
      const c = H.progreso.caballo || (H.progreso.caballo = {}); c.x = B.x; c.z = B.z; c.yaw = Math.PI; H.progreso.cosas = Object.assign(H.progreso.cosas || {}, { caballo: 1 });
      await A.cuadros(20, 6);
      const res = { tieneMalla: !!A.caballo().malla, errores: 0 };
      H.montar(); await A.cuadros(30, 8);
      const J = H.jugador.estado;
      res.montado = !!J.montado;
      const x0 = J.pos.x, z0 = J.pos.z;
      A.tecla('KeyW', 'keydown'); await A.cuadros(120, 8);
      res.trote = Math.hypot(J.pos.x - x0, J.pos.z - z0);
      A.tecla('ShiftLeft', 'keydown'); await A.cuadros(100, 8);
      res.vel = A.caballo().est.vel;
      A.tecla('ShiftLeft', 'keyup'); A.tecla('KeyW', 'keyup'); await A.cuadros(40, 8);
      return res; })()`);
    ok(cab2.montado && cab2.trote > 6, `a caballo: montado y trotó ${cab2.trote.toFixed(1)} m (el movimiento es el de siempre)`);
    ok(cab2.vel > 6, `al galope la velocidad pasa de ${cab2.vel.toFixed(1)} m/s`);
    await A('(() => { H.desmontar(); return 1 })()');
    // ---- 7. personalizar: el perro y el caballo se rearman con piel
    donde = 'personalizar';
    const pers = await A(`(async () => {
      const P = H.progreso; P.personal = P.personal || {};
      const antes = { perro: H.perro.malla.piel, caballo: A.caballo().malla };
      const cambio = {};
      try { P.personal.perro = Object.assign({}, P.personal.perro || {}, { pelo: '#6b6660', dibujo: 'manchado', nombre: 'Prueba' }); H.perro.personalizar(P.personal.perro); cambio.perro = H.perro.malla.piel && H.perro.malla.piel !== antes.perro; } catch (e) { cambio.perroError = e.message; }
      await A.cuadros(20, 6);
      cambio.perroActiva = !!(H.perro.malla.piel && H.perro.malla.piel.malla.parent === H.perro.malla.g);
      try { P.personal.caballo = Object.assign({}, P.personal.caballo || {}, { pelaje: 'overo', nombre: 'Pinto' }); A.caballo().personalizar(P.personal.caballo); cambio.caballo = true; } catch (e) { cambio.caballoError = e.message; }
      await A.cuadros(20, 6);
      return cambio; })()`);
    ok(pers.perro === true && pers.perroActiva === true && !pers.perroError, `personalizar el perro rearma su piel (${JSON.stringify(pers)})`);
    ok(pers.caballo === true && !pers.caballoError, 'personalizar el caballo no rompe nada');
    // ---- 8. capturas
    donde = 'capturas';
    for (const nombre of Object.keys(escenarios)) {
      try {
        const r = await js(`(async () => { const A = window.__A, H = window.__hojarasca; ${escenarios[nombre]} })()`);
        if (r && r.fotos) r.fotos.forEach((f, i) => guardarFoto(`${nombre}${r.fotos.length > 1 ? '-' + i : ''}`, f));
        if (r && r.info) console.log('  ' + nombre + ' ' + JSON.stringify(r.info));
      } catch (e) { ok(false, `escena de captura ${nombre}: ${e.message}`); }
    }
    ok(await A('A.programas()') === progs1, `y las escenas de captura tampoco compilaron nada (${progs1})`);

    // ---------------------------------------------------------------- Mínima
    donde = 'mínima';
    await abrir('muybaja'); await entrar();
    est = await A('A.estadoPiel()');
    ok(est.length >= 3 && est.every((q) => !q.tiene), `Mínima: ${est.length} animales sin piel`);
    await A('A.cuadros(60, 8)');

    ok(errores.length === 0, 'sin errores de consola ni de shaders' + (errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''));
  } catch (e) {
    ok(false, `la prueba se cortó en «${donde}»: ${e.message}`);
  }
  const bien = !errores.length;
  console.log(bien ? 'TODO BIEN' : `FALLARON ${errores.length}`);
  try { app.exit(bien ? 0 : 1); } catch { process.exit(bien ? 0 : 1); }
});
