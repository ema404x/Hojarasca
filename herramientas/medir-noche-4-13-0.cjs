// 4.13.0 (B): mide lo que cuesta la noche de la Historia (la defensa del final), para comparar con el mismo lugar sin la noche.
// Lo importante es el cuadro de la PLAZA... y éste: el refugio de noche, con el portón, las antorchas y hasta 10 duendes a la vista.
// Cada medición: se dejan correr cuadros para que se asiente todo y se miden N cuadros a mano (`__bucle`) con `gl.finish()` después de cada
// uno (CPU + placa del cuadro entero, sin vsync ni límite). Tres vistas, siempre con la cámara en el mismo lugar y mirando al portón:
//   · base:    el refugio de noche, sin la noche (de referencia: mira para otro lado);
//   · sin:     el mismo cuadro de `noche` con las estacas, las antorchas y los duendes escondidos (la vara para `delta`);
//   · noche:   la noche en marcha, con los duendes ya en el portón (se espera a que haya 6 o más a la vista; no se los mata);
//   · pico:    lo mismo, pero con la cámara mirando de frente a la fila de duendes (el peor cuadro).
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`), en el monitor externo y con perfil propio:
//   CALIDAD=media|alta CUADROS=300 SALIDA=<archivo.json> npx electron herramientas/medir-noche-4-13-0.cjs --user-data-dir=<carpeta propia>
// En la 4600G (la PC de referencia): sin vigilante, ventana visible; compará el promedio y el p95 de `noche` y `pico` contra `base`.
// Mirá `delta.ms` (cuánto suma la noche: el mismo cuadro con y sin lo suyo) y `delta.llamadas` (dibujos); `base` es el refugio de noche mirando para otro lado (sólo de referencia). La noche entra si suma menos de ~1,5 ms y menos de ~30 llamadas.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
const HTML = path.resolve(process.env.HTML || path.join(raiz, 'index.html'));
const SALIDA = path.resolve(process.env.SALIDA || './medir-noche-4-13-0.json');
const CALIDAD = process.env.CALIDAD || 'media';
const CUADROS = Number(process.env.CUADROS || 300);
const ASIENTO = Number(process.env.ASIENTO || 120);
const perfil = (process.argv.find((a) => a.startsWith('--user-data-dir=')) || '').slice(16) || process.env.HOJ_PERFIL || '';
if (!perfil) { console.error('falta --user-data-dir=<carpeta propia>'); process.exit(2); }
app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 12 minutos'); app.exit(2); }, 12 * 60 * 1000).unref?.();

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, J = H.jugador, P = H.progreso;
  const M = window.__M = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  M.mundo = () => H.__noche();
  M.vivos = () => M.mundo().sim.duendes.filter((d) => d.estado === 'avanza' || d.estado === 'ataca');
  M.camaraA = (x, y, z) => { const j = J.estado; j.yaw = Math.atan2(-(x - j.pos.x), -(z - (j.pos.z))); j.pitch = Math.atan2(y - (j.pos.y + j.alturaOjos), Math.hypot(x - j.pos.x, z - j.pos.z)); };
  M.cuadros = async (n) => { for (let i = 0; i < n; i++) { H.__bucle(); await dormir(2); } };
  // la noche con un tirador que los frena (apunta por la cámara) para que se acumulen en el portón
  M.tirar = () => {
    const m = M.mundo(), s = m.sim, j = J.estado;
    if (!s || s.fin || s.recarga > 0) return;
    let b = null, bd = 1e9;
    for (const d of M.vivos()) { const dd = Math.hypot(d.x - j.pos.x, d.z - j.pos.z); if (dd < bd && dd < 38) { bd = dd; b = d; } }
    if (!b) return;
    const a = s.flechas > 0 ? 'arco' : 'honda', v = a === 'arco' ? 64 : 36, tt = bd / v;
    const cam = H.camara; cam.position.set(j.pos.x, j.pos.y + j.alturaOjos, j.pos.z); cam.lookAt(b.x, b.y + b.def.altura * 0.55 + 0.5 * 9.8 * tt * tt - 1.2 * tt, b.z); cam.updateMatrixWorld(true);
    m.disparar(a, 1.1);
  };
  // para medir: que la noche no termine (se pierde o se gana) a mitad de la medición
  M.inmortal = () => { const m = M.mundo(); if (m && m.activa() && m.sim) { m.sim.puerta = 100; m.sim.jugador.vida = 100; m.sim.t = Math.min(m.sim.t, 120); } };
  M.medir = async (n) => {
    const gl = H.renderer.getContext(), tiempos = [];
    const R = H.renderer; R.info.autoReset = false;
    let llamadas = 0, tris = 0;
    for (let i = 0; i < n; i++) {
      M.inmortal(); R.info.reset();
      const t0 = performance.now(); H.__bucle(); gl.finish(); tiempos.push(performance.now() - t0);
      llamadas += R.info.render.calls; tris += R.info.render.triangles;
      if (i % 4 === 0) await dormir(0);
    }
    R.info.autoReset = true;
    tiempos.sort((a, b) => a - b);
    const prom = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    return { ms: +prom.toFixed(2), p95: +tiempos[Math.floor(tiempos.length * 0.95)].toFixed(2), max: +tiempos[tiempos.length - 1].toFixed(2), llamadas: Math.round(llamadas / n), triangulos: Math.round(tris / n) };
  };
  return 1;
})()`;

app.whenReady().then(async () => { try {
  const w = new BrowserWindow({ show: process.env.HUMO_OCULTO !== '1', width: 1366, height: 768, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${CALIDAD}', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false, idioma:'es', limiteFps:'libre'}));`;
  await w.loadFile(HTML, { search: '?debug=1' });
  await js(ajustes);
  await w.loadFile(HTML, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.__noche)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(PAGINA);
  const out = { calidad: CALIDAD, cuadros: CUADROS, gpu: await js('(() => { try { const gl = window.__hojarasca.renderer.getContext(); const e = gl.getExtension("WEBGL_debug_renderer_info"); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?" } catch { return "?" } })()') };
  // la historia en el capítulo 8 (terminado), con el trato y las armas; la tarjeta del capítulo 1 se cierra
  await js(`(async () => { const H = ${H}, P = H.progreso; for (let i = 0; i < 5; i++) { H.__valle.revisarAhora(); const b = document.querySelector('#valle-tarjeta button'); if (b && H.__valle.abierta()) b.click(); for (let k = 0; k < 8; k++) { H.__bucle(); await new Promise((r) => setTimeout(r, 15)); } }
    const h = P.historia = P.historia || {}; Object.assign(h, { activa: true, capitulo: 7, fase: 'outro', empezada: 1, terminada: 0 }); h.duendes = { trato: 'pelea', vistos: 3, regalos: 0, armas: { arco: true, honda: true }, noche: 'pendiente', final: null, intentos: 0 }; h.noche = { estado: 'pendiente', intentos: 0, modo: '', horasAntes: null }; P.horas = 11; return 1 })()`);
  // base: el refugio de noche, mirando hacia donde va a estar el portón (se calcula con el mismo lado que va a elegir la noche)
  const lugar = await js(`(() => { const H = ${H}, r = H.T.lugares.refugio, p = r.puerta || r; H.jugador.ubicar(p.x + 2, p.z + 2, 0); H.progreso.horas = 22.3; return { x: p.x, z: p.z } })()`);
  await js('window.__M.cuadros(' + ASIENTO + ')');
  out.base = await js(`window.__M.medir(${CUADROS})`);
  // la noche
  await js(`(async () => { const H = ${H}; H.progreso.horas = 11; H.__valle.noche.esperar(0); for (let i = 0; i < 6 && !H.__noche().activa(); i++) { H.__valle.revisarAhora(); await new Promise((r) => setTimeout(r, 100)); const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="salir"]') || document.querySelector('#valle-tarjeta button'); if (b && H.__valle.abierta()) b.click(); for (let k = 0; k < 8; k++) { H.__bucle(); await new Promise((r) => setTimeout(r, 15)); } } return H.__noche().activa() })()`);
  await js('window.__M.cuadros(30)');
  // adelantar hasta que haya 6 o más duendes a la vista (el jugador y la puerta no caen, para que se acumulen en el portón)
  const llego = await js(`(async () => { const M = window.__M, m = M.mundo(); const j = ${H}.jugador.estado.pos;
    for (let i = 0; i < 4000 && m.activa(); i++) { M.inmortal(); m.actualizar(0.05); if (!m.activa()) break; if (M.vivos().filter((d) => Math.hypot(d.x - j.x, d.z - j.z) < 30).length >= 6) break; }
    return { vivos: m.activa() ? M.vivos().length : 0, t: m.sim ? m.sim.t : 0 } })()`);
  out.llego = llego;
  await js(`(() => { const M = window.__M, m = M.mundo(); const v = M.vivos(); if (v.length) { const x = v.reduce((a, d) => a + d.x, 0) / v.length, z = v.reduce((a, d) => a + d.z, 0) / v.length; M.camaraA(x, 1, z); } return 1 })()`);
  await js('window.__M.cuadros(' + ASIENTO + ')');
  out.noche = await js(`window.__M.medir(${CUADROS})`);
  // el pico: la cámara de frente a la fila (se vuelve a apuntar en cada cuadro porque los duendes se mueven)
  out.pico = await js(`(async () => { const M = window.__M, m = M.mundo(); const gl = ${H}.renderer.getContext(); const tiempos = []; const R = ${H}.renderer; R.info.autoReset = false; let llamadas = 0;
    for (let i = 0; i < ${CUADROS}; i++) { M.inmortal(); if (m.activa()) { const v = M.vivos(); if (v.length) { const d = v[0]; M.camaraA(d.x, 1, d.z); } } R.info.reset(); const t0 = performance.now(); ${H}.__bucle(); gl.finish(); tiempos.push(performance.now() - t0); llamadas += R.info.render.calls; if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0)); }
    R.info.autoReset = true; tiempos.sort((a, b) => a - b); return { ms: +(tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(2), p95: +tiempos[Math.floor(tiempos.length * 0.95)].toFixed(2), max: +tiempos[tiempos.length - 1].toFixed(2), llamadas: Math.round(llamadas / ${CUADROS}) } })()`);
  // el mismo cuadro (misma cámara, misma hora) sin lo de la noche: se esconden las estacas, las antorchas y los duendes
  await js(`(() => { const e = ${H}.escena; e.getObjectByName('historia-noche').visible = false; e.getObjectByName('duendes').visible = false; return 1 })()`);
  await js('window.__M.cuadros(' + ASIENTO + ')');
  out.sin = await js(`window.__M.medir(${CUADROS})`);
  await js(`(() => { const e = ${H}.escena; e.getObjectByName('historia-noche').visible = true; e.getObjectByName('duendes').visible = true; return 1 })()`);
  out.delta = { ms: +(out.noche.ms - out.sin.ms).toFixed(2), p95: +(out.noche.p95 - out.sin.p95).toFixed(2), llamadas: out.noche.llamadas - out.sin.llamadas, triangulos: out.noche.triangulos - out.sin.triangulos };
  out.programas = await js(`${H}.renderer.info.programs.length`);
  fs.writeFileSync(SALIDA, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
  app.exit(0);
  } catch (e) { console.log('ERROR:', e && e.stack || e); app.exit(1); }
});
