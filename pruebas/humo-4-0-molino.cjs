// 4.0 (molino y puente): humo en el juego real (Electron, Relax). Camina de verdad (W apretada y `jugador.actualizar`) y comprueba:
//  · el puente sigue siendo transitable de punta a punta, arriba del tablero;
//  · el molino se sigue pudiendo entrar por su puerta;
//  · la casa del molino frena (no se atraviesa) y el cerco del campo también, pero el portón deja pasar;
//  · la consola sin errores.
// Uso: npx electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/humo-4-0-molino.cjs
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
app.setPath('userData', path.join(require('os').tmpdir(), 'hojarasca-humo-4-0-molino'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 8 minutos'); salir(2); }, 8 * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.est)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  const res = await js(`(() => {
    const H = ${H}, T = H.T, e = H.est, J = H.jugador, out = [];
    const tecla = (t, c) => document.dispatchEvent(new KeyboardEvent(t, { code: c, bubbles: true }));
    const paso = () => { J.actualizar(0.05); };
    const poner = (x, z, yaw) => { const s = J.estado; J.ubicar(x, z, yaw); s.vel.set(0, 0, 0); s.vy = 0; for (let i = 0; i < 12; i++) paso(); };
    const caminar = (n) => { const s = J.estado; tecla('keydown', 'KeyW'); for (let i = 0; i < n; i++) paso(); tecla('keyup', 'KeyW'); for (let i = 0; i < 8; i++) paso(); return { x: s.pos.x, y: s.pos.y, z: s.pos.z }; };
    const dir = (dx, dz) => Math.atan2(-dx, -dz);
    const ok = (nombre, cond, dato) => out.push({ nombre, ok: !!cond, dato });
    // el puente, de punta a punta
    { const p = T.puentes[0], ux = Math.cos(p.ang), uz = Math.sin(p.ang), a = { x: p.x - ux * (p.largo / 2 + 3), z: p.z - uz * (p.largo / 2 + 3) };
      poner(a.x, a.z, dir(ux, uz));
      let ymax = -1e9, llego = false; const s = J.estado; tecla('keydown', 'KeyW');
      for (let i = 0; i < 400; i++) { paso(); ymax = Math.max(ymax, s.pos.y); if (Math.hypot(s.pos.x - (p.x + ux * (p.largo / 2 + 2)), s.pos.z - (p.z + uz * (p.largo / 2 + 2))) < 1.2) { llego = true; break; } }
      tecla('keyup', 'KeyW');
      ok('el puente se cruza de punta a punta', llego, { x: +s.pos.x.toFixed(1), z: +s.pos.z.toFixed(1), ymax: +ymax.toFixed(2), alto: +p.alto.toFixed(2) });
      ok('y se camina sobre el tablero (no por abajo)', ymax > p.alto - 0.3, { ymax: +ymax.toFixed(2), alto: +p.alto.toFixed(2) }); }
    // en el molino: el marco local
    const m = e.molino, c = Math.cos(m.rot), sn = Math.sin(m.rot);
    const W = (lx, lz) => ({ x: m.x + lx * c + lz * sn, z: m.z - lx * sn + lz * c });
    const loc = (p) => ({ lx: (p.x - m.x) * c - (p.z - m.z) * sn, lz: (p.x - m.x) * sn + (p.z - m.z) * c });
    const hacia = (a, b) => { const A = W(...a), B = W(...b); return dir(B.x - A.x, B.z - A.z); };
    { const a = W(0, 8); poner(a.x, a.z, hacia([0, 8], [0, 0])); const f = caminar(60); const l = loc(f);
      ok('el molino se entra por su puerta', Math.hypot(l.lx, l.lz) < 2.3, { lx: +l.lx.toFixed(2), lz: +l.lz.toFixed(2) }); }
    { const a = W(-10, 16.5); poner(a.x, a.z, hacia([-10, 16.5], [-10, 3])); const f = caminar(90); const l = loc(f);
      ok('la casa del molino frena (no se atraviesa)', l.lz > 10.2, { lx: +l.lx.toFixed(2), lz: +l.lz.toFixed(2) }); }
    { const a = W(0, 6.3); poner(a.x, a.z, hacia([0, 6.3], [0, 18])); const f = caminar(40); const l = loc(f);
      ok('el cerco del campo frena donde no hay portón', l.lz < 8.3, { lx: +l.lx.toFixed(2), lz: +l.lz.toFixed(2) }); }
    { const a = W(4.3, 6.3); poner(a.x, a.z, hacia([4.3, 6.3], [4.3, 18])); const f = caminar(60); const l = loc(f);
      ok('por el portón se entra al campo', l.lz > 12, { lx: +l.lx.toFixed(2), lz: +l.lz.toFixed(2) }); }
    const mp = e.molinoPaisaje;
    ok('el paisaje del molino está armado', !!mp && mp.info.tulipanes > 1500, mp && { tulipanes: mp.info.tulipanes, instancias: mp.info.instancias(), triangulosObras: mp.info.triangulos() });
    return out;
  })()`);
  let mal = 0;
  for (const r of res) { console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre} ${JSON.stringify(r.dato ?? '')}`); if (!r.ok) mal++; }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  console.log(mal || errores.length ? `HUMO 4.0 MOLINO: ${mal} fallas` : 'HUMO 4.0 MOLINO: todo OK');
  salir(mal || errores.length ? 1 : 0);
});
