// 3.8.0 (coihue): capturas del Coihue Viejo, el Rey Duende y las semillas doradas en el Desafío real, con
// perfil propio (no toca el de las pruebas). Una sola partida: la noche final (el Coihue que llega caminando
// con sus raíces y desde el fortín), el asedio (plantado de día, la puerta grande y una raíz que brotó), la
// subida por adentro, el corazón con el Rey (las tres fases) y las semillas. Mide los dibujos, los triángulos
// y los ms de cada toma (y los del Coihue o el corazón solos), y avisa si aparece algún programa nuevo.
//
// Uso (después de `node armar.mjs`):
//   npx electron --no-sandbox -r <abs>/herramientas/al-monitor.cjs pruebas/fotos-coihue-380.cjs [carpeta de salida] [toma,toma,...]
// (con HOJ_PERFIL=<carpeta> usa ese perfil; si no, uno propio en la salida)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const tras = process.argv.slice(process.argv.findIndex((a) => a.endsWith('fotos-coihue-380.cjs')) + 1);
const argSalida = tras.find((a) => /[\\/]/.test(a) && !a.startsWith('-'));
const salida = argSalida ? path.resolve(argSalida) : path.join(raiz, 'pruebas', 'salidas', 'coihue-380');
const anotarError = (tipo, e) => {
  const texto = `[fotos-coihue-380] ${tipo}: ${e && e.stack ? e.stack : e}\n`;
  try { console.error(texto); fs.mkdirSync(salida, { recursive: true }); fs.appendFileSync(path.join(salida, 'errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
if (!process.env.HOJ_PERFIL) {
  const perfil = path.join(salida, '_perfil');
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* que quede */ }
  app.setPath('userData', perfil);
}
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const arg = tras.find((a) => /^[a-z0-9-]+(,[a-z0-9-]+)*$/.test(a) && !/^-/.test(a));
  const pedidas = arg ? new Set(arg.split(',')) : null;
  const quiero = (n) => !pedidas || pedidas.has(n);
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon|AudioContext/.test(m)) { errores.push(m.slice(0, 400)); console.log('[página]', m.slice(0, 600)); } });
  // 3.8.4: FOTOS_INDEX mide otro armado (el de antes); FOTOS_SEMILLA fija el azar (el Coihue en el mismo lugar)
  const url = process.env.FOTOS_INDEX ? path.resolve(process.env.FOTOS_INDEX) : path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
  if (!(await js('!!window.__hojarasca').catch(() => false))) { console.log('la página no arrancó'); app.exit(1); return; }
  if (process.env.FOTOS_SEMILLA) await js(`(() => { const c = document.getElementById('codigo-partida'); if (c) c.value = 'COIHUE-4821'; return 1 })()`);   // (el mismo valle)
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`(() => { const s = document.createElement('style'); s.id = 'sin-hud'; s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  // el Desafío envuelto: `__congelar` lo deja quieto (dt 0) y `__cam` pone la cámara después de todo lo demás
  await js(`(() => { const H = ${H}, D = H.desafio; if (D.__envuelto) return 1; const orig = D.actualizar; D.__envuelto = true;
    D.actualizar = function (dt, c) { const r = orig.call(this, window.__congelar ? 0 : dt, c);
      const k = window.__cam; if (k) { const cam = H.camara; cam.position.set(k.o[0], k.o[1], k.o[2]); cam.lookAt(k.a[0], k.a[1], k.a[2]); if (k.fov && cam.fov !== k.fov) { cam.fov = k.fov; cam.updateProjectionMatrix(); } cam.updateMatrixWorld(true); for (const h of cam.children) h.visible = false; }
      return r; };
    H.ajustes.limiteFps = 'libre'; return 1 })()`);
  const correr = (seg, noche = 0) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++) H.desafio.actualizar(0.05,{noche:(${noche}), dtReal:0.05}); return 1})()`);
  const simular = (seg, noche = 1) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.progreso.horas += 0.05*24/(30*60); H.desafio.actualizar(0.05,{noche:(${noche}), dtReal:0.05}); } return 1})()`);
  const limpiarInvasores = () => js(`(()=>{const H=${H}; for (const a of H.desafio.aliens) { if (!a.enNave) { a.estado='irse'; a.t=9; } } H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return 1})()`);
  const listaProgramas = () => js(`${H}.renderer.info.programs.map((p) => p.name + ' · ' + String(p.cacheKey).replace(/\\s+/g, ' ').slice(0, 140))`);
  let antes = new Set(await listaProgramas());
  const informe = [`programas al empezar: ${antes.size}`];
  // una toma: la cámara (o, a en el mundo), la hora, y qué se mide solo (`solo`: una expresión que da los objetos)
  async function toma(nombre, cam, { hora = null, solo = null } = {}) {
    if (!quiero(nombre)) return;
    const modo = await js(`(()=>{ const H=${H}; const m = H.__caidas ? H.__caidas.modo() : '?'; if (m !== 'jugando') H.volverAlJuego?.(); ${hora != null ? `H.progreso.horas = ${hora};` : ''} H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0; window.__cam = ${JSON.stringify(cam)}; window.__congelar = true; for (const h of H.camara.children) h.visible = false; return m })()`);
    if (modo !== 'jugando') console.log(`  (${nombre}: el juego estaba en «${modo}»)`);
    await esperar(4500);
    await js(`(()=>{ const H=${H}; for (let i = 0; i < 3; i++) H.__bucle(); return 1 })()`);
    let img = null;
    for (let k = 0; k < 4 && !img; k++) { try { img = await w.webContents.capturePage(); } catch (e) { await esperar(1500); } }
    if (img) fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    const info = await js(`(() => { const H = ${H}, R = H.renderer; R.info.autoReset = false;
      R.info.reset(); R.render(H.escena, H.camara); const d = { dibujos: R.info.render.calls, tri: R.info.render.triangles };
      const t0 = performance.now(); for (let i = 0; i < 10; i++) H.__bucle(); const ms = +((performance.now() - t0) / 10).toFixed(2);
      let soloM = null;
      const lista = ${solo || 'null'};
      if (lista) {
        const vis = new Set(); for (const o of lista) { let p = o; while (p) { vis.add(p); p = p.parent; } o.traverse((q) => vis.add(q)); }
        const ocultos = []; H.escena.traverse((o) => { if (o !== H.escena && !vis.has(o) && o.visible && !o.isLight && (o.isMesh || o.isPoints || o.isLine || o.isSprite)) { ocultos.push(o); o.visible = false; } });
        R.info.reset(); R.render(H.escena, H.camara); soloM = { dibujos: R.info.render.calls, tri: R.info.render.triangles };
        for (const o of ocultos) o.visible = true;
      }
      R.info.autoReset = true;
      return JSON.stringify({ ...d, ms, solo: soloM, programas: R.info.programs.length }) })()`);
    informe.push(`${nombre}: ${info}`);
    console.log('foto', nombre, info);
    const ahora = await listaProgramas();
    const nuevos = ahora.filter((p) => !antes.has(p));
    if (nuevos.length) { informe.push(`  programas nuevos en ${nombre}:\n    ${nuevos.join('\n    ')}`); console.log(`  programas nuevos (${nuevos.length}):`, nuevos.map((p) => p.slice(0, 110)).join(' | ')); }
    antes = new Set(ahora);
    await js(`window.__cam = null; window.__congelar = false; 1`);
  }

  // ================================================================ la noche final: el Coihue llega caminando
  if (process.env.FOTOS_SEMILLA) await js(`(() => { let s = ${Number(process.env.FOTOS_SEMILLA) || 1}; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; return 1 })()`);
  await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas=19; D.especial=null; D.especialAnterior='roja'; D.tutorial=99; H.progreso.cosas.pistola = 1; D.cargas = 99; Object.assign(H.progreso.materiales,{tronco:40,tabla:40,piedra:40,cristal:40}); return 1})()`);
  await js(`(()=>{const H=${H}; H.progreso.dia++; H.progreso.horas=19.4; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; return 1})()`);
  for (let i = 0; i < 30; i++) { await simular(1); if (await js(`${H}.desafio.nodrizaActiva`)) break; }
  const hay = await js(`!!${H}.desafio.eventos.coihue`);
  console.log('Coihue de la noche final:', hay, 'armado en', await js(`Math.round(${H}.desafio.eventos.coihue.ms)`), 'ms');
  informe.push(`armar el Coihue (noche final): ${await js(`Math.round(${H}.desafio.eventos.coihue.ms)`)} ms`);
  // (la base: dónde está el fortín; el Coihue mira hacia ahí)
  const geo = JSON.parse(await js(`(()=>{const H=${H}, co=H.desafio.eventos.coihue; const p=co.g.position; return JSON.stringify({x:co.x, z:co.z, y:co.y, ax:co.ax, az:co.az})})()`));
  const piso = (x, z) => js(`${H}.T.altura(${x}, ${z})`);
  const soloCoihue = `[H.desafio.eventos.coihue.g]`;
  {
    // caminando: a mitad de la llegada, de costado
    await js(`(()=>{const H=${H}, co=H.desafio.eventos.coihue; co.fase='llegando'; co.t=3.2; window.__congelar=false; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); return 1})()`);
    const p = JSON.parse(await js(`JSON.stringify(${H}.desafio.eventos.coihue.g.position)`));
    // (desde arriba del fortín, la vigía: se lo ve venir por encima del bosque)
    const ox = geo.x - geo.ax * 50 + geo.az * 14, oz = geo.z - geo.az * 50 - geo.ax * 14;
    await toma('v38-coihue-caminando', { o: [ox, (await piso(ox, oz)) + 9, oz], a: [p.x, p.y + 20, p.z], fov: 58 }, { hora: 20.6, solo: soloCoihue });
  }
  {
    // desde el fortín: ya parado, de noche, con sus ventanas encendidas
    await js(`(()=>{const H=${H}, co=H.desafio.eventos.coihue; co.fase='combate'; co.t=4; co.largar=30; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); return 1})()`);
    const p = JSON.parse(await js(`JSON.stringify(${H}.desafio.eventos.coihue.g.position)`));
    const ox = geo.x - geo.ax * 46 + geo.az * 6, oz = geo.z - geo.az * 46 - geo.ax * 6;
    await toma('v38-coihue-noche-fortin', { o: [ox, (await piso(ox, oz)) + 2.4, oz], a: [p.x, p.y + 16, p.z], fov: 64 }, { hora: 22.6, solo: soloCoihue });
    // 3.8.4: de lejos, de noche (la corteza: el pulido visual), a unos 120 m
    const lx = geo.x - geo.ax * 120 + geo.az * 20, lz = geo.z - geo.az * 120 - geo.ax * 20;
    await toma('v38-coihue-noche-lejos', { o: [lx, (await piso(lx, lz)) + 16, lz], a: [p.x, p.y + 22, p.z], fov: 50 }, { hora: 22.6, solo: soloCoihue });
    // y de cerca, abajo, entre las raíces (los núcleos de ámbar)
    const cx = geo.x - geo.ax * 27 - geo.az * 10, cz = geo.z - geo.az * 27 + geo.ax * 10;
    if (process.env.RAICES) await toma('v38-coihue-raices', { o: [cx, (await piso(cx, cz)) + 1.7, cz], a: [p.x, p.y + 14, p.z], fov: 70 }, { hora: 22.6, solo: soloCoihue });
  }

  // ================================================================ el asedio: plantado en el valle
  await js(`${H}.progreso.dia++; ${H}.progreso.horas = 5.98; 1`);
  await simular(4, 0.3);
  await js(`${H}.progreso.horas = 11; 1`);
  await correr(15);
  await limpiarInvasores();
  const as = JSON.parse(await js(`(()=>{const H=${H}, M=H.desafio.asedio, A=H.progreso.desafio.asedio; if (!A || !M.armado || !M.armado.nave) return 'null'; const p=M.armado.nave.g.position; return JSON.stringify({x:p.x, y:p.y, z:p.z, giro:M.armado.nave.giro, zonas:A.zonas.map(z=>({x:z.x, z:z.z, y:H.T.altura(z.x,z.z), id:z.id}))})})()`));
  if (as) {
    const fx = Math.sin(as.giro), fz = Math.cos(as.giro);   // adelante (a la base)
    const soloNave = `[H.desafio.asedio.armado.nave.g]`;
    const ox = as.x + fx * 78 + fz * 20, oz = as.z + fz * 78 - fx * 20;
    await toma('v38-coihue-asedio-tarde', { o: [ox, (await piso(ox, oz)) + 2, oz], a: [as.x, as.y + 17, as.z], fov: 58 }, { hora: 17.6, solo: soloNave });
    // una raíz que brotó (la de la zona 3, todavía tomada)
    const z = as.zonas[as.zonas.length - 1];
    const zx = z.x + 13, zz = z.z + 6;
    await toma('v38-coihue-raiz-zona', { o: [zx, (await piso(zx, zz)) + 1.8, zz], a: [z.x, z.y + 4, z.z], fov: 62 }, { hora: 16.5 });
    // se libera: tres raíces rotas, la puerta grande se enciende
    await js(`(()=>{const H=${H}, E=H.desafio.eventos; for (const i of [0, 1, 2]) { const b = E.blancos().find(q=>q.ancla && q.i===i); if (b) E.herirNucleo(b, 99999); } return 1})()`);
    await correr(1.5);
    await limpiarInvasores();
    const px = as.x + fx * 27 + fz * 5, pz = as.z + fz * 27 - fx * 5;
    await toma('v38-coihue-puerta', { o: [px, (await piso(px, pz)) + 1.7, pz], a: [as.x, as.y + 9, as.z], fov: 64 }, { hora: 19.0, solo: soloNave });
    // el fogón de una zona recuperada (lo que defendés de noche)
    { const z0 = as.zonas[0], fx0 = z0.x + 2.4; await toma('v38-coihue-fogon', { o: [fx0 + 3.2, (await piso(fx0 + 3.2, z0.z + 2.2)) + 1.5, z0.z + 2.2], a: [fx0, z0.y + 0.6, z0.z], fov: 55 }, { hora: 18.4 }); }
  }

  // ================================================================ adentro: la subida (se camina) y el corazón
  await js(`(()=>{const H=${H}; H.progreso.horas = 11; const s=H.desafio.asedio.sitioHaz(); H.jugador.ubicar(s.x+1, s.z+1, 0, s.y); return H.desafio.usarCercaDe(H.jugador.estado.pos)})()`);
  await correr(1.2);
  const sub = JSON.parse(await js(`(()=>{const N=${H}.desafio.naveAdentro; return JSON.stringify({en:N.enSubida, ms:Math.round(N.subida.ms), tramos:N.subida.tramos.length})})()`));
  console.log('subida:', JSON.stringify(sub));
  informe.push(`armar la subida (al entrar, detrás del fundido): ${sub.ms} ms; ${sub.tramos} tramos`);
  // la cámara del jugador: mirando por donde sube la escalera (un poco hacia arriba)
  const mirarAdelante = (k) => js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, js=H.jugador.estado, S=N.subida, o=S.origen;
    let i=0, mejor=1e9; S.tramos.forEach((q, j) => { const d = Math.hypot(o.x+q.x-js.pos.x, o.z+q.z-js.pos.z) + Math.abs(o.y+q.alto-js.pos.y)*3; if (d < mejor) { mejor = d; i = j; } });
    const q = S.tramos[Math.min(S.tramos.length-1, i + ${k})];
    js.yaw = Math.atan2(-(o.x+q.x-js.pos.x), -(o.z+q.z-js.pos.z)); js.pitch = Math.atan2(o.y+q.alto-js.pos.y, Math.hypot(o.x+q.x-js.pos.x, o.z+q.z-js.pos.z)) * 0.6 + 0.05;
    return i})()`);
  await mirarAdelante(5);
  await toma('v38-coihue-subida-abajo', null);
  // caminar de verdad (W apretada, el rumbo hacia unos peldaños más adelante) hasta la puerta del corazón:
  // cuánto tarda caminando, si alguna vez se cayó y por dónde va a la mitad
  const camino = JSON.parse(await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, js=H.jugador.estado, S=N.subida, o=S.origen;
    document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));
    let t = 0, caidas = 0, yAntes = js.pos.y, maxI = 0, mitad = null; const pa = S.puertaArriba;
    const cerca = () => Math.hypot(o.x+pa.x-js.pos.x, o.z+pa.z-js.pos.z) < 2.4 && Math.abs(o.y+pa.y-js.pos.y) < 1.5;
    for (let n = 0; n < 4000 && !cerca(); n++) {
      let i=0, mejor=1e9; S.tramos.forEach((q, j) => { const d = Math.hypot(o.x+q.x-js.pos.x, o.z+q.z-js.pos.z) + Math.abs(o.y+q.alto-js.pos.y)*3; if (d < mejor) { mejor = d; i = j; } });
      maxI = Math.max(maxI, i);
      const q = i >= S.tramos.length - 3 ? { x: pa.x, z: pa.z } : S.tramos[i + 3];
      js.yaw = Math.atan2(-(o.x+q.x-js.pos.x), -(o.z+q.z-js.pos.z));
      H.jugador.actualizar(0.05); H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); t += 0.05;
      if (js.pos.y < yAntes - 1.5) caidas++;
      yAntes = js.pos.y;
      if (!mitad && i >= S.tramos.length / 2) { mitad = { x: js.pos.x, y: js.pos.y, z: js.pos.z, yaw: js.yaw }; }
    }
    document.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
    return JSON.stringify({ segundos: +t.toFixed(1), llego: cerca(), caidas, maxI, de: S.tramos.length, descanso: N.ultimoDescanso, mitad, aviso: H.desafio.avisoCercaDe(js.pos) })})()`));
  console.log('caminando:', JSON.stringify(camino));
  informe.push(`la subida caminando: ${JSON.stringify(camino)}`);
  if (camino.mitad) {
    await js(`(()=>{const H=${H}, m=${JSON.stringify(camino.mitad)}, o=H.desafio.naveAdentro.subida.origen, dx=m.x-o.x, dz=m.z-o.z, l=Math.hypot(dx,dz)||1; H.jugador.ubicar(m.x+dx/l*0.8, m.z+dz/l*0.8, m.yaw, m.y); return 1})()`);   // (pegado a la pared: se ve la escalera que sigue)
    await mirarAdelante(6);
    await toma('v38-coihue-subida-mitad', null);
    // y mirando para abajo, por el hueco entre la escalera y el tronco del medio
    await js(`(()=>{const js=${H}.jugador.estado; js.pitch = -0.55; js.yaw += 1.2; return 1})()`);
    await toma('v38-coihue-subida-mitad-abajo', null);
  }
  // un duende asomado en la puerta de su casita (el del medio de la escalera): la cámara unos peldaños antes
  {
    const v = JSON.parse(await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, S=N.subida, o=S.origen, vs=S.vecinos || [];
      if (!vs.length) return 'null';
      const v = vs[Math.floor(vs.length / 2)], cx = Math.sin(v.a) * 2.9, cz = Math.cos(v.a) * 2.9;
      let j = 0, mejor = 1e9; S.tramos.forEach((q, i) => { const d = Math.hypot(q.x - cx, q.z - cz) + Math.abs(q.alto - v.y) * 2; if (d < mejor) { mejor = d; j = i; } });
      const q = S.tramos[Math.max(0, j - 5)];
      H.jugador.ubicar(o.x + q.x, o.z + q.z, 0, o.y + q.alto);
      const js = H.jugador.estado, px = o.x + Math.sin(v.a) * (S.radio - 0.6), pz = o.z + Math.cos(v.a) * (S.radio - 0.6);
      js.yaw = Math.atan2(-(px - js.pos.x), -(pz - js.pos.z)); js.pitch = -0.05;
      v.quiere = 1; v.espera = 30;
      for (let i = 0; i < 40; i++) H.desafio.actualizar(0.05, {noche:0, dtReal:0.05});
      const ojo = [js.pos.x, js.pos.y + 1.6, js.pos.z], mira = [o.x + Math.sin(v.a) * (S.radio - 0.5), o.y + v.y + 0.45, o.z + Math.cos(v.a) * (S.radio - 0.5)];
      return JSON.stringify({ afuera: +v.afuera.toFixed(2), visible: v.m.g.visible, cuantos: vs.length, ojo, mira })})()`));
    console.log('duende de la subida:', JSON.stringify(v));
    informe.push(`duende de la subida: ${JSON.stringify(v)}`);
    if (v) await toma('v38-coihue-subida-duende', { o: v.ojo, a: v.mira, fov: 48 });
  }
  // llegando a la puerta del corazón
  await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, S=N.subida, o=S.origen, pa=S.puertaArriba, q=S.tramos[S.tramos.length-8];
    H.jugador.ubicar(o.x+q.x, o.z+q.z, 0, o.y+q.alto); const js=H.jugador.estado; js.yaw = Math.atan2(-(o.x+pa.x-js.pos.x), -(o.z+pa.z-js.pos.z)); js.pitch = 0.08; return 1})()`);
  await toma('v38-coihue-subida-puerta', null);
  // E en la puerta del corazón
  await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, S=N.subida, o=S.origen, pa=S.puertaArriba; H.jugador.ubicar(o.x+pa.x, o.z+pa.z, 0, o.y+pa.y); return H.desafio.usarCercaDe(H.jugador.estado.pos)})()`);
  await correr(2);
  await js(`${H}.progreso.desafio.salud = 100; 1`);
  const ar = JSON.parse(await js(`(()=>{const N=${H}.desafio.naveAdentro, A=N.arena; return JSON.stringify({x:A.x, y:A.y, z:A.z, adentro:N.adentro})})()`));
  console.log('adentro:', ar.adentro);
  informe.push(`armar el corazón (al subir): ${await js(`Math.round(${H}.desafio.naveAdentro.arena.ms)`)} ms; el Coihue del asedio: ${await js(`Math.round(${H}.desafio.asedio.armado.nave.ms)`)} ms`);
  const R = 27;
  const soloSala = `[H.desafio.naveAdentro.arena.grupo]`;
  // lo que se ve al llegar: desde la puerta de la escalera, el Rey en el medio
  await toma('v38-coihue-corazon', { o: [ar.x + R - 3.2, ar.y + 1.65, ar.z + 0.01], a: [ar.x, ar.y + 6, ar.z], fov: 72 }, { solo: soloSala });
  // el Rey de cerca (te mira: el jugador va donde está la cámara)
  await js(`(()=>{const H=${H}, js=H.jugador.estado; js.pos.set(${ar.x + 9}, ${ar.y}, ${ar.z + 8}); for (let i=0;i<60;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); H.progreso.desafio.salud = 100; return 1})()`);
  await toma('v38-coihue-rey', { o: [ar.x + 9, ar.y + 2.2, ar.z + 8], a: [ar.x, ar.y + 6.5, ar.z], fov: 62 });
  // 3.8.4: el Rey en dos poses (la piel por huesos: los codos se doblan y la ropa del hombro acompaña). Los huesos se
  // ponen a mano con el Desafío quieto; en el armado de antes no hay codos ni manos (sólo el brazo entero)
  const poseRey = (p) => js(`(()=>{window.__congelar = true; const h=${H}.desafio.naveAdentro.arena.rey.userData.huesos, p=${JSON.stringify(p)};
    for (const [k, r] of Object.entries(p)) if (h[k]) h[k].rotation.set(r[0], r[1], r[2]); h.torso.updateMatrixWorld(true); return 1})()`);
  if (quiero('v38-coihue-rey-llamar')) { await poseRey({ brazo0: [-0.6, 0, 1.3], brazo1: [-0.6, 0, -1.3], codo0: [-0.75, 0, 0], codo1: [-0.75, 0, 0], mano0: [-0.45, 0, 0], mano1: [-0.45, 0, 0], cabeza: [-0.3, 0, 0] });
    await toma('v38-coihue-rey-llamar', { o: [ar.x + 9, ar.y + 2.2, ar.z + 8], a: [ar.x, ar.y + 6.5, ar.z], fov: 62 }); }
  if (quiero('v38-coihue-rey-golpe')) { await poseRey({ brazo0: [-2.3, 0, 0.15], brazo1: [-2.3, 0, -0.15], codo0: [-0.9, 0, 0], codo1: [-0.9, 0, 0], mano0: [0.35, 0, 0], mano1: [0.35, 0, 0], cabeza: [0, 0, 0], torso: [-0.1, 0, 0] });
    await toma('v38-coihue-rey-golpe', { o: [ar.x + 9, ar.y + 2.2, ar.z + 8], a: [ar.x, ar.y + 6.5, ar.z], fov: 62 }); }
  // la segunda fase (el escudo de resina y las raíces con su semilla) y la tercera (el corazón al aire)
  await js(`(()=>{const H=${H}, E=H.desafio.eventos; for (const b of E.blancos().filter(b=>b.nave)) E.herirNucleo(b, 99999); for (let i=0;i<30;i++){ H.progreso.desafio.salud=100; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); } return 1})()`);
  await toma('v38-coihue-pilares', { o: [ar.x - 6, ar.y + 3.5, ar.z + 22], a: [ar.x + 6, ar.y + 3, ar.z + 6], fov: 70 });
  await js(`(()=>{const H=${H}, E=H.desafio.eventos; for (const b of E.blancos().filter(b=>b.nave)) E.herirNucleo(b, 99999); for (let i=0;i<60;i++){ H.progreso.desafio.salud=100; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); } const js=H.jugador.estado; js.pos.set(${ar.x + 2}, ${ar.y}, ${ar.z + 13}); for (let i=0;i<40;i++){ H.progreso.desafio.salud=100; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); } return 1})()`);
  await toma('v38-coihue-corazon-abierto', { o: [ar.x + 2, ar.y + 2.4, ar.z + 13], a: [ar.x, ar.y + 5, ar.z], fov: 60 });
  await js(`(()=>{const N=${H}.desafio.naveAdentro; N.salir(); return 1})()`);
  await correr(2.5);
  await limpiarInvasores();

  // ================================================================ las semillas doradas
  {
    const sem = JSON.parse(await js(`(()=>{const H=${H}, D=H.progreso.desafio, js=H.jugador.estado; H.progreso.horas = 18.2;
      // un claro sobre el sendero, sin árboles cerca (para que las semillas se vean)
      const b = H.desafio.baseMapa || { x: js.pos.x, z: js.pos.z }, T = H.T;
      let x = b.x + 6, z = b.z, mejor = 1e9;
      for (let r = 10; r < 90; r += 4) for (let k = 0; k < 24; k++) { const px = b.x + Math.cos(k * 0.26) * r, pz = b.z + Math.sin(k * 0.26) * r, i = T.indice(px, pz);
        const s = (T.distSendero?.[i] ?? 9) + (T.pendiente?.[i] ?? 0) * 10 + (H.veg.arbolesCerca(px, pz, 6, []).length ? 50 : 0) + (T.agua(px, pz) ? 99 : 0);
        if (s < mejor) { mejor = s; x = px; z = pz; } }
      H.jugador.ubicar(x - 6, z, 0);
      const a = H.desafio.invocar('bruto', x, z); if (!a) return 'null';
      a.m.g.position.set(x, H.T.altura(x, z), z); a.px = x; a.pz = z;
      a.vida = 1; a.dudaT = 999;
      H.camara.position.set(js.pos.x, js.pos.y + 1.6, js.pos.z); H.camara.lookAt(x, H.T.altura(x, z) + 1.2, z); H.camara.updateMatrixWorld(true);
      js.yaw = Math.atan2(-(x - js.pos.x), -(z - js.pos.z)); js.pitch = 0;
      for (let i=0;i<4 && a.vida > 0;i++){ H.desafio.atacar('pistola'); H.desafio.actualizar(0.35,{noche:0}); }
      for (let i=0;i<60;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05});
      // las semillas que soltó (las mallas sueltas de la escena con la geometría de la semilla, a la vista)
      const sueltas = H.escena.children.filter((o) => o.isMesh && o.visible && o.material && o.material.vertexColors && o.geometry.boundingSphere && o.geometry.boundingSphere.radius < 0.25 && Math.hypot(o.position.x - x, o.position.z - z) < 12);
      let sx = x, sz = z;
      if (sueltas.length) { sx = sueltas.reduce((s, o) => s + o.position.x, 0) / sueltas.length; sz = sueltas.reduce((s, o) => s + o.position.z, 0) / sueltas.length; }
      const todas = H.escena.children.filter((o) => o.isMesh && o.geometry && o.geometry.boundingSphere && o.geometry.boundingSphere.radius < 0.25 && o.material && o.material.vertexColors).map((o) => [Math.round(o.position.x), Math.round(o.position.z), o.visible]);
      return JSON.stringify({x: sx, z: sz, y:H.T.altura(sx, sz), muerto:a.vida <= 0, estado: a.estado, ax: Math.round(a.m.g.position.x), az: Math.round(a.m.g.position.z), sueltas: sueltas.length, todas: todas.slice(0, 8)})})()`));
    console.log('semillas:', JSON.stringify(sem));
    if (sem && sem.sueltas) await toma('v38-coihue-semillas', { o: [sem.x - 1.2, sem.y + 1.5, sem.z + 0.7], a: [sem.x, sem.y + 0.2, sem.z], fov: 46 });
    // el lugar de las semillas del mapa (las que asoman entre el musgo)
    const sitio = JSON.parse(await js(`JSON.stringify((${H}.desafio.sitiosMapa || []).find((m) => m.clase === 'cristal') || null)`));
    if (sitio) {
      await js(`(()=>{const H=${H}; H.jugador.ubicar(${sitio.x + 4}, ${sitio.z + 3}, 0); for (let i=0;i<20;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return 1})()`);
      await esperar(1500);
      const y = await piso(sitio.x, sitio.z);
      await toma('v38-coihue-semillas-mapa', { o: [sitio.x + 2.6, y + 1.4, sitio.z + 1.8], a: [sitio.x, y + 0.2, sitio.z], fov: 55 }, { hora: 17.8 });
    }
  }
  await js(`(() => { for (const k of ${H}.camara.children) k.visible = true; return 1; })()`);
  console.log(informe.filter((l) => /^armar/.test(l)).join(String.fromCharCode(10)));
  fs.writeFileSync(path.join(salida, 'informe.txt'), informe.join('\n') + (errores.length ? `\nerrores:\n${errores.join('\n')}` : ''));
  if (errores.length) console.log('errores de la página:\n' + errores.join('\n'));
  console.log('listo:', salida);
  app.exit(0);
});
