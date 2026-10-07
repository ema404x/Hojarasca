// 3.7.5 (fiestas): capturas de las fiestas en el juego real: la fiesta de la estación con gente bailando, la mesa larga,
// la jineteada, el fogón de la noche de la leyenda, la minga, el truco y los recuerdos colgados. Quedan en SALIDA (o en
// pruebas/salidas/fiestas-375/). Perfil propio (no toca el de las pruebas ni el del juego).
// Uso (después de `node armar.mjs`): npx electron --no-sandbox pruebas/fotos-fiestas-375.cjs [toma,toma] [calidad=alta]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.SALIDA || path.join(raiz, 'pruebas', 'salidas', 'fiestas-375'));
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.error('[fotos-fiestas] ', e && e.stack ? e.stack : e); salir(1); });
process.on('unhandledRejection', (e) => { console.error('[fotos-fiestas] ', e && e.stack ? e.stack : e); salir(1); });
if (!process.env.HOJ_PERFIL) {
  const perfil = path.join(salida, '_perfil');
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* que quede */ }
  app.setPath('userData', perfil);
}
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('[fotos-fiestas] tardó más de 15 minutos'); salir(2); }, 15 * 60 * 1000).unref?.();

// En el plano de la aldea (x, z; y: metros sobre el terreno en ese punto). `dia`: el día de la partida (el del año sale
// de ahí); `hora`; `fiesta`: forzar el estado de las fiestas para la toma (ver fiestas-juego.js, `__fiestas().probar`).
const TOMAS = {
  'cenit-oeste': { ojo: [-20, 55, 14], a: [-20, 0, 14.5], hora: 12, dia: 1 },
  'cenit-este': { ojo: [25, 55, 12], a: [25, 0, 12.5], hora: 12, dia: 1 },
  arriba: { ojo: [6, 60, 10], a: [10, 0, 45], hora: 12, dia: 1 },
  'arriba-este': { ojo: [60, 70, 0], a: [40, 0, 50], hora: 12, dia: 1 },
  'arriba-oeste': { ojo: [-30, 70, 0], a: [-15, 0, 40], hora: 12, dia: 1 },
  baile: { ojo: [14.6, 5.5, 22.5], a: [14.6, 0.4, 12.5], hora: 18.6, dia: 2, gente: true },
  predio: { ojo: [2, 14, 2], a: [22, 0, 16], hora: 12.8, dia: 2, gente: true },
  mesa: { ojo: [9.6, 2.2, 18.2], a: [16.0, 0.6, 20.8], hora: 12.8, dia: 2, gente: true },
  jineteada: { ojo: [21.5, 2.4, 9.0], a: [29.8, 1.2, 12.8], hora: 15.4, dia: 2, gente: true, jinete: true },
  leyenda: { ojo: [23.6, 2.0, 15.6], a: [23.6, 0.6, 19.8], hora: 21.2, dia: 9, gente: true },
  minga: { ojo: [29.0, 2.6, 15.5], a: [33.6, 0.9, 21.0], hora: 10.5, dia: 7, gente: true },
  truco: { ojo: [19.6, 1.7, 11.0], a: [20.6, 0.7, 11.0], hora: 15.5, dia: 2, gente: true, truco: true },
  recuerdos: { refugio: true, hora: 11, dia: 3 },
};

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const arg = process.argv.find((a) => /^[a-z-]+(,[a-z-]+)*$/.test(a) && a.split(',').every((t) => TOMAS[t]));
  const pedidas = (arg || Object.keys(TOMAS).join(',')).split(',');
  const calidad = (process.argv.find((a) => /^calidad=/.test(a)) || 'calidad=alta').split('=')[1];
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'auto'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldeaMundo && window.__hojarasca.__aldeaMundo())').catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`window.__hojarasca.__aldeaMundo().listo().then(() => 1)`);
  await js(`(() => { window.__hojarasca.__aldeaMundo().montarCola(); return 1 })()`);
  // la aldea con los locales de siempre abiertos (el salón, para el músico)
  await js(`(() => { const a = window.__hojarasca.progreso.aldea; a.pobladores = ['carpintero','panadera','herrero','musico','maestra','enfermera','modista'].map((clave) => ({ clave, dia: 1 })); a.locales = { carpinteria: 1, panaderia: 1, herreria: 1, salon: 1, escuela: 1, 'puesto-sanitario': 1, costureria: 1 }; a.obras = {}; return 1 })()`);
  const estilo = `(() => { let s = document.getElementById('sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'sin-hud'; document.head.appendChild(s); } s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; return 1 })()`;
  const conHud = `(() => { const s = document.getElementById('sin-hud'); if (s) s.textContent = ''; return 1 })()`;
  const informe = [];
  for (const nombre of pedidas) {
    const t = TOMAS[nombre];
    await js(t.truco ? conHud : estilo);
    await js(`(() => { const H = window.__hojarasca, P = H.progreso; P.dia = ${t.dia}; P.horas = ${t.hora}; H.__fiestas?.()?.probar?.(${JSON.stringify(t)}); return 1 })()`);
    for (let k = 0; k < 4; k++) { await js(`(async () => { const M = window.__hojarasca.__aldeaMundo(); M.actualizar(4, window.__hojarasca.camara.position); await M.listo(); M.montarCola(); return 1 })()`); await esperar(150); }
    if (t.gente) await js(`(() => { const H = window.__hojarasca, r = H.T.lugares.refugio; H.jugador.ubicar(r.x, r.z, 0); for (let i = 0; i < 6; i++) { H.__aldea.actualizar(0.6); } return 1 })()`);
    const poner = `(() => { const H = window.__hojarasca, T = H.T, js = H.jugador.estado, t = ${JSON.stringify(t)};
      H.clima.estado.nublado = 0.15; H.progreso.horas = t.hora;
      let o, a;
      if (t.refugio) { const r = T.lugares.refugio, c = Math.cos(r.rot || 0), s = Math.sin(r.rot || 0), w = (lx, lz) => ({ x: r.x + lx * c + lz * s, z: r.z - lx * s + lz * c });
        const y0 = (r.y ?? T.altura(r.x, r.z)) + 0.37; const wo = w(0.2, 1.6), wa = w(0.2, -2.7); o = { x: wo.x, z: wo.z, y: y0 + 1.6 }; a = { x: wa.x, z: wa.z, y: y0 + 1.7 }; }
      else { const P = { x: 40.33335217430335, z: -339.13893663781784, ang: 2.992763908303246 }, c = Math.cos(P.ang), s = Math.sin(P.ang);
        const w = (lx, lz) => ({ x: P.x + lx * c + lz * s, z: P.z - lx * s + lz * c });
        const wo = w(t.ojo[0], t.ojo[2]), wa = w(t.a[0], t.a[2]);
        o = { x: wo.x, z: wo.z, y: T.altura(wo.x, wo.z) + t.ojo[1] }; a = { x: wa.x, z: wa.z, y: T.altura(wa.x, wa.z) + t.a[1] }; }
      const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
      if (t.truco) { H.jugador.ubicar(o.x, o.z, yaw); } else { js.pos.set(o.x, o.y - 1.65, o.z); js.vel.set(0, 0, 0); js.vy = 0; }
      js.yaw = yaw; js.pitch = pitch;
      const cam = H.camara; cam.position.set(o.x, o.y, o.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0);
      if (cam.fov !== 70) { cam.fov = 70; cam.updateProjectionMatrix(); }
      for (const k of cam.children) k.visible = !!t.truco;
      return 1 })()`;
    await js(poner);
    for (let k = 0; k < 40; k++) {
      await js(`(() => { const H = window.__hojarasca; if (${!!t.gente}) { H.__aldea.actualizar(0.25); H.__aldea.mundo()?.prearmar?.(1e6); } H.__fiestas?.()?.actualizar?.(0.25); H.__fiestasMundo?.()?.armarTodo?.(); H.__bucle(); return 1 })()`);
      if (!t.truco) await js(poner);
      await esperar(40);
    }
    if (t.truco) {
      await js(`(() => { const H = window.__hojarasca; H.__fiestas?.()?.probarTruco?.(); return 1 })()`);
      await esperar(300);
      await js(`(() => { window.__hojarasca.__bucle(); return 1 })()`);
    }
    await esperar(500);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    const m = await js(`(() => { const H = window.__hojarasca, r = H.renderer?.info?.render; return { dibujos: r?.calls ?? null, tris: r?.triangles ?? null, fiesta: (() => { const a = H.__fiestas?.()?.ahora?.(); return a ? a.fecha.id + '|' + a.fase.fase : null })(), mundo: H.__fiestasMundo?.()?.estado?.() || null } })()`);
    informe.push(`${nombre}: ${JSON.stringify(m)}`);
    if (t.truco) await js(`(() => { window.__hojarasca.__fiestas?.()?.cerrarPanel?.(); return 1 })()`);
  }
  fs.writeFileSync(path.join(salida, 'informe.txt'), [...informe, ...(errores.length ? ['errores:', ...errores] : [])].join('\n') + '\n');
  console.log(informe.join('\n'));
  if (errores.length) console.log('errores:\n' + errores.join('\n'));
  salir(0);
});
