// 4.10 (coihue): mide lo que cuesta el final del Desafío con lo nuevo (el Coihue caminando con sus huellas y su sombra, un lugar
// del valle tomado, la subida con las raíces) contra la versión anterior, en la misma máquina (en la notebook: sólo comparar).
// El mismo script corre en las dos versiones: lo que una no tiene (el camino, los lugares tomados) se saltea.
//
// Cada vista: se planta el jugador en un punto con una hora fija, se dejan correr cuadros para que se acomode todo y se miden
// N cuadros a mano (`__bucle`) con `gl.finish()` (CPU + placa del cuadro entero, sin vsync); dibujos y triángulos del último.
//
// Uso (desde la carpeta de una versión, después de `node armar.mjs`):
//   HTML=<index.html> SALIDA=<archivo.json> CALIDAD=media|alta npx electron herramientas/medir-4-10-coihue.cjs --user-data-dir=<carpeta propia>
// Opciones: CUADROS=150 (medidos por vista), ASIENTO=100 (cuadros sin medir antes), VISTAS=a,b (sólo ésas)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const HTML = path.resolve(process.env.HTML || path.join(process.cwd(), 'index.html'));
const SALIDA = path.resolve(process.env.SALIDA || './medir-4-10-coihue.json');
const CALIDAD = process.env.CALIDAD || 'media';
const CUADROS = Number(process.env.CUADROS || 150);
const ASIENTO = Number(process.env.ASIENTO || 100);
const SOLO = process.env.VISTAS ? process.env.VISTAS.split(',') : null;
const perfil = (process.argv.find((a) => a.startsWith('--user-data-dir=')) || '').slice(16);
if (!perfil) { console.error('falta --user-data-dir=<carpeta propia>'); process.exit(2); }
app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const r = { html: HTML, calidad: CALIDAD, cuadros: CUADROS, vistas: {}, errores: [], programasNuevos: {} };
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon/.test(m)) r.errores.push(m.slice(0, 300));
  });
  const js = (c, lim = 240000) => Promise.race([w.webContents.executeJavaScript(c, true), esperar(lim).then(() => { throw new Error('sin respuesta'); })]);
  const ajustes = JSON.stringify({ calidad: CALIDAD, clima: 'despejado', musica: false, modo: 'desafio', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', modoFluido: false, estacion: 'verano' });
  const H = 'window.__hojarasca';
  const cargar = async () => {
    await w.loadFile(HTML, { search: '?debug=1' });
    for (let i = 0; i < 1200; i++) { await esperar(250); if (await js('!!window.__hojarasca', 5000).catch(() => false)) break; }
  };
  // mide `CUADROS` cuadros con el jugador clavado en `p` ({ x, y?, z, yaw, pitch?, horas })
  const medir = async (id, p) => {
    await js(`(()=>{ const H = ${H}, js = H.jugador.estado; H.volverAlJuego && H.volverAlJuego(); window.__vista = ${JSON.stringify(p)}; const q = window.__vista;
      js.pos.set(q.x, q.y ?? H.T.altura(q.x, q.z) + 1.65, q.z); js.yaw = q.yaw; js.pitch = q.pitch ?? -0.05; js.vel.set(0, 0, 0); H.progreso.horas = q.horas; return 1 })()`);
    await js(`(()=>{ const H = ${H}, js = H.jugador.estado, q = window.__vista; for (let i = 0; i < ${ASIENTO}; i++) { H.progreso.horas = q.horas; js.pos.x = q.x; js.pos.z = q.z; if (q.y !== undefined) js.pos.y = q.y; js.yaw = q.yaw; js.pitch = q.pitch ?? -0.05; H.__bucle(); } return 1 })()`);
    await esperar(1000);
    const m = await js(`(()=>{ const H = ${H}, R = H.renderer, gl = R.getContext(), js = H.jugador.estado, q = window.__vista; const ms = []; let llamadas = 0, triangulos = 0;
      for (let i = 0; i < ${CUADROS}; i++) {
        H.progreso.horas = q.horas; js.pos.x = q.x; js.pos.z = q.z; if (q.y !== undefined) js.pos.y = q.y; js.yaw = q.yaw; js.pitch = q.pitch ?? -0.05;
        const ultimo = i === ${CUADROS} - 1; let reset = null;
        if (ultimo) { R.info.autoReset = false; R.info.reset(); reset = R.info.reset; R.info.reset = () => {}; }
        const t0 = performance.now(); H.__bucle(); gl.finish(); ms.push(performance.now() - t0);
        if (ultimo) { llamadas = R.info.render.calls; triangulos = R.info.render.triangles; R.info.reset = reset; R.info.autoReset = true; }
      }
      const o = ms.slice().sort((a, b) => a - b), f = (k) => +o[Math.min(o.length - 1, Math.floor(o.length * k))].toFixed(2);
      return { p50: f(0.5), p95: f(0.95), medio: +(ms.reduce((s, x) => s + x, 0) / ms.length).toFixed(2), llamadas, triangulos, programas: R.info.programs.length } })()`);
    r.vistas[id] = m;
    console.log(`${id.padEnd(22)} p50 ${m.p50} p95 ${m.p95} ms · ${m.llamadas} dibujos · ${m.triangulos} triángulos · ${m.programas} programas`);
  };
  const quiere = (id) => !SOLO || SOLO.includes(id);
  try {
    await w.loadFile(HTML, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(ajustes)}); 1`);
    await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`(()=>{ const H = ${H}; H.ajustes.limiteFps = 'libre'; H.progreso.desafio.tutorial = 99; return 1 })()`);
    r.testigos = await js(`(()=>{ const H = ${H}, g = H.escena.children.find((o) => o.name === 'coihue-testigos'); if (!g) return null; return g.children.map((o) => ({ tipo: o.type, mat: o.material && o.material.type, transp: o.material && o.material.transparent, compilado: !!(o.material && H.renderer.properties.get(o.material).currentProgram) })) })()`);
    const prog0 = await js(`(()=>{ const ps = ${H}.renderer.info.programs; window.__pv = new Set(ps.map((p) => p.name + '|' + String(p.cacheKey))); return ps.length })()`);
    // un sitio llano y seco a ~62 m de la base
    const sit = await js(`(()=>{ const H = ${H}, T = H.T, c = H.desafio.centroBase ? H.desafio.centroBase() : H.T.lugares.refugio; let mejor = null;
      for (let a = 0; a < 48; a++) { const x = c.x + Math.cos(a / 48 * 6.283) * 62, z = c.z + Math.sin(a / 48 * 6.283) * 62; if (T.agua(x, z)) continue;
        let mojado = false, des = 0; for (let k = 0; k < 10 && !mojado; k++) for (const e of [8, 16, 26]) { const qx = x + Math.cos(k / 10 * 6.283) * e, qz = z + Math.sin(k / 10 * 6.283) * e; if (T.agua(qx, qz)) { mojado = true; break; } des = Math.max(des, Math.abs(T.altura(qx, qz) - T.altura(x, z))); }
        if (mojado) continue; if (!mejor || des < mejor.des) mejor = { x, z, des }; }
      return mejor })()`);
    const base = await js(`(()=>{ const c = ${H}.desafio.centroBase ? ${H}.desafio.centroBase() : ${H}.T.lugares.refugio; return { x: c.x, z: c.z } })()`);
    // lo del valle tomado (sólo la versión nueva): antes del asedio, con un lugar en el escalón más alto
    if (await js(`!!${H}.desafio.valle`) && quiere('zona-tomada')) {
      await js(`(()=>{ const H = ${H}, D = H.progreso.desafio; D.oleadas = 2; H.progreso.dia = 4; H.progreso.horas = 11; H.desafio.valle.alAmanecer(); const z = D.valle.zonas.find((q) => q.nivel > 0); z.nivel = 3; for (let i = 0; i < 120; i++) H.desafio.actualizar(0.5, { noche: 0, dtReal: 0.5 }); return 1 })()`);
      const z = await js(`(()=>{ const z = ${H}.progreso.desafio.valle.zonas.find((q) => q.nivel > 0); return { x: z.x, z: z.z } })()`);
      const ang = Math.atan2(z.z - base.z, z.x - base.x);
      await medir('zona-tomada', { x: z.x - Math.cos(ang) * 22, z: z.z - Math.sin(ang) * 22, yaw: Math.atan2(-(z.x - (z.x - Math.cos(ang) * 22)), -(z.z - (z.z - Math.sin(ang) * 22))), horas: 12 });
      await js(`(()=>{ const D = ${H}.progreso.desafio; D.valle = null; D.capullos = []; return 1 })()`);
    }
    // el asedio con el Coihue plantado (las dos versiones) y, en la nueva, caminando dos noches
    await js(`(()=>{ const H = ${H}, D = H.progreso.desafio; D.oleadas = 20; D.capullos = []; D.nodriza = null; H.progreso.dia = 30; H.progreso.horas = 12; return H.desafio.asedio.empezar({ x: ${sit.x}, z: ${sit.z} }) })()`);
    for (let i = 0; i < 20; i++) await js(`${H}.desafio.actualizar(0.5, { noche: 0, dtReal: 0.5 }); 1`);
    const mirar = (d, alto = 1.65, horas = 12) => {
      const dx = sit.x - base.x, dz = sit.z - base.z, l = Math.hypot(dx, dz) || 1;
      return { x: base.x + dx / l * d, z: base.z + dz / l * d, yaw: Math.atan2(-dx, -dz), horas };
    };
    if (quiere('coihue-plantado')) await medir('coihue-plantado', mirar(8));
    const hayCamino = await js(`!!${H}.progreso.desafio.asedio.camino`);
    if (hayCamino) {
      await js(`(()=>{ const H = ${H}, D = H.progreso.desafio, M = H.desafio.asedio, js = H.jugador.estado, c = D.asedio.camino;
        for (let n = 0; n < 2; n++) { D.oleadas++; H.progreso.dia++; H.progreso.horas = 20.6; M.alEmpezarNoche(); for (let k = 0; k < 190; k++) { H.progreso.horas += 0.05; if (H.progreso.horas >= 24) H.progreso.horas -= 24; D.salud = 100; M.actualizar(0.25, js); }
          H.progreso.horas = 6.1; M.alTerminarNoche(true); H.progreso.horas = 11; for (let k = 0; k < 80; k++) M.actualizar(0.25, js); }
        return 1 })()`);
      const nave = await js(`(()=>{ const a = ${H}.progreso.desafio.asedio.nave; return { x: a.x, z: a.z } })()`);
      const dx = nave.x - base.x, dz = nave.z - base.z, l = Math.hypot(dx, dz) || 1;
      if (quiere('coihue-camino-dia')) await medir('coihue-camino-dia', { x: base.x + dx / l * 6, z: base.z + dz / l * 6, yaw: Math.atan2(-dx, -dz), horas: 12 });
      if (quiere('coihue-camino-noche')) await medir('coihue-camino-noche', { x: base.x + dx / l * 6, z: base.z + dz / l * 6, yaw: Math.atan2(-dx, -dz), horas: 22 });
      // caminando de verdad: de noche, con la zancada en marcha (el temblor y el polvo)
      await js(`(()=>{ const H = ${H}, D = H.progreso.desafio, M = H.desafio.asedio, c = D.asedio.camino; D.oleadas++; H.progreso.dia++; H.progreso.horas = 20.6; M.alEmpezarNoche(); for (let k = 0; k < 40; k++) { H.progreso.horas += 0.05; M.actualizar(0.25, H.jugador.estado); } c.d = Math.min(c.largo, c.d + 5); return 1 })()`);
      r.zancada = await js(`!!${H}.desafio.asedio.visual.zancada`);
    }
    // la subida (las dos versiones): al pie, E, y un punto de la escalera mirando para arriba
    if (quiere('subida')) {
      await js(`(()=>{ const H = ${H}, M = H.desafio.asedio; const a = H.progreso.desafio.asedio; if (a.camino) { a.camino.llego = true; a.camino.d = a.camino.largo; } else { for (const z of a.zonas) z.estado = 'asegurada'; } H.progreso.horas = 11; const D = H.progreso.desafio; D.oleadaTerminada = true; for (const al of H.desafio.aliens) { al.estado = 'irse'; al.t = 9; } for (let i = 0; i < 120; i++) H.__bucle(); for (const al of H.desafio.aliens) { al.estado = 'irse'; al.t = 9; } for (let i = 0; i < 30; i++) H.desafio.actualizar(0.1, { noche: 0, dtReal: 0.1 }); const s = M.sitioHaz(); H.jugador.ubicar(s.x + 1, s.z + 1, 0, s.y); const ok = H.desafio.usarCercaDe(H.jugador.estado.pos); const motivo = M.motivoHaz(H.jugador.estado.pos); for (let i = 0; i < 60; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); window.__entrada = { ok, motivo, hora: H.progreso.horas, abierto: M.hazAbierto() }; return ok })()`);
      r.entrada = await js(`window.__entrada`);
      const sub = await js(`(()=>{ const N = ${H}.desafio.naveAdentro; if (!N.enSubida) return null; const S = N.subida, o = S.origen, q = S.tramos[Math.floor(S.tramos.length * 0.3)], q2 = S.tramos[Math.floor(S.tramos.length * 0.3) + 6];
        return { x: o.x + q.x, y: o.y + q.alto + 1.65, z: o.z + q.z, yaw: Math.atan2(-(q2.x - q.x), -(q2.z - q.z)) } })()`);
      if (sub) await medir('subida', { ...sub, horas: 11 });
      if (sub && process.env.DIAG) r.pesados = await js(`(()=>{ const H = ${H}, lista = []; const tri = (o) => { let n = 0; o.traverse((q) => { if (q.isMesh && q.visible) { const g = q.geometry; if (!g || !g.attributes || !g.attributes.position) return; n += (g.index ? g.index.count : g.attributes.position.count) / 3 * (q.isInstancedMesh ? q.count : 1); } }); return Math.round(n); };
        for (const o of H.escena.children) if (o.visible) lista.push({ n: o.name || o.type, tri: tri(o), hijos: o.children.length }); lista.sort((a, b) => b.tri - a.tri); return lista.slice(0, 8) })()`);
      else r.vistas.subida = null;
    }
    r.claves = await js(`(()=>{ const H = ${H}, R = H.renderer, M = H.desafio.asedio, N = H.desafio.naveAdentro, k = (m) => { const p = m && R.properties.get(m).currentProgram; if (!p) return null; const t = String(p.cacheKey); let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return t.length + ':' + h; }; const g = H.escena.children.find((o) => o.name === 'coihue-testigos'); const o = {}; try {
      o.testigoTransp = k(g.children[5].material); o.testigoVC = k(g.children[6].material); o.decal = M.huellas ? k(M.huellas.children[0].material) : null; o.monton = M.huellas ? k(M.huellas.children[1].material) : null; o.sombra = M.sombra ? k(M.sombra.material) : null;
      const S = N.subida; o.lane = S && S.raices ? k(S.raices[0].lane.material) : null; } catch (e) { o.error = String(e); } return o })()`).catch(() => null);
    r.programasNuevos = { alEntrar: prog0, alFinal: await js(`${H}.renderer.info.programs.length`), nuevos: await js(`${H}.renderer.info.programs.map((p) => p.name + '|' + String(p.cacheKey)).filter((k) => !window.__pv.has(k)).map((k) => { const i = k.indexOf('highp'); return k.slice(0, Math.min(k.length, i > 0 ? i + 60 : 100)); })`) };
  } catch (e) { r.errores.push('excepcion: ' + (e && e.message ? e.message : e)); }
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(r, null, 2));
  console.log(`programas: ${JSON.stringify(r.programasNuevos)} · errores ${r.errores.length}${r.errores.length ? ' · ' + r.errores.slice(0, 2).join(' | ') : ''}`);
  app.exit(0);
});
