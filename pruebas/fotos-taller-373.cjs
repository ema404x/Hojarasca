// 3.7.3: capturas del taller ferroviario en el juego real: por fuera (viejo y arreglado, desde el andén y desde el
// desvío), por dentro con Ernesto y Martín trabajando, el cuarto de Martín y el panel de mejoras. Quedan en
// pruebas/salidas/taller-373/ (no van al repositorio). Perfil propio (no toca el de las pruebas ni el del juego).
// Uso (después de `node armar.mjs`): npx electron --no-sandbox -r herramientas/al-monitor.cjs pruebas/fotos-taller-373.cjs [toma,toma] [calidad=alta]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'taller-373');
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.error('[fotos-taller] ', e && e.stack ? e.stack : e); salir(1); });
process.on('unhandledRejection', (e) => { console.error('[fotos-taller] ', e && e.stack ? e.stack : e); salir(1); });
const perfil = path.join(salida, '_perfil');
try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* que quede */ }
app.setPath('userData', perfil);
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('[fotos-taller] tardó más de 12 minutos'); salir(2); }, 12 * 60 * 1000).unref?.();

// en el marco del taller (x a lo largo de la vía, z hacia la vía; y sobre el piso del galpón): ojo y mira
const TOMAS = {
  'afuera-viejo': { ojo: [-2, 2.2, 22], a: [0, 2.6, 0], hora: 10.5 },
  'afuera-desvio': { ojo: [-24, 1.6, 9], a: [-4, 2.2, 0], hora: 16.5, arreglado: true },
  'afuera-arreglado': { ojo: [-2, 2.2, 22], a: [0, 2.6, 0], hora: 10.5, arreglado: true },
  'adentro-trabajo': { ojo: [-7.6, 1.75, -2.6], a: [0.5, 0.9, 0.4], hora: 15, arreglado: true, armando: true, gente: true },
  'adentro-martin': { ojo: [2.2, 1.7, 1.6], a: [-0.6, 1.0, -3.2], hora: 10.4, arreglado: true, gente: true },
  'adentro-foso': { ojo: [4.6, 1.8, 2.8], a: [-6, 0.2, -0.3], hora: 12, arreglado: true },
  cuarto: { ojo: [5.7, 1.6, -3.0], a: [8.2, 0.8, 2.6], hora: 21, arreglado: true },
  noche: { ojo: [-6, 1.7, 16], a: [0, 2.4, 0], hora: 22, arreglado: true },
  panel: { ojo: [-2, 1.7, 0.9], a: [-2, 1.2, -3], hora: 11, arreglado: true, panel: true },
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
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__taller && window.__hojarasca.__taller())').catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`window.__hojarasca.__aldeaMundo().listo().then(() => 1)`);
  await js(`(() => { window.__hojarasca.__aldeaMundo().montarCola(); return 1 })()`);
  // la herrería abierta (Anselmo forja las piezas) y la aldea con gente
  await js(`(() => { const a = window.__hojarasca.progreso.aldea; a.pobladores = [{ clave: 'carpintero', dia: 1 }, { clave: 'herrero', dia: 1 }]; a.locales = { carpinteria: 1, herreria: 1 }; a.obras = {}; return 1 })()`);
  const estilo = `(() => { let s = document.getElementById('sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'sin-hud'; document.head.appendChild(s); } s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; return 1 })()`;
  const conHud = `(() => { const s = document.getElementById('sin-hud'); if (s) s.textContent = ''; return 1 })()`;
  const informe = [];
  for (const nombre of pedidas) {
    const t = TOMAS[nombre];
    await js(t.panel ? conHud : estilo);
    // el galpón viejo o arreglado; una mejora armándose (Ernesto viene a la tarde)
    await js(`(() => { const H = window.__hojarasca, P = H.progreso, tr = H.__taller().tren(), t = ${JSON.stringify(t)};
      tr.taller.arreglado = !!t.arreglado; if (t.arreglado && !tr.taller.hechas.includes('freno-1')) { tr.taller.hechas.push('freno-1'); tr.loco.freno = 1; }
      if (!t.arreglado) { tr.taller.hechas = []; tr.loco.freno = 0; }
      P.dia = 5; P.horas = t.hora;
      tr.taller.pedido = t.armando ? { id: 'farol', arreglo: false, aportado: { tabla: 1, tronco: 0, piedra: 0 }, hierro: 2, desde: 5 * 24 + 8, empezo: 5 * 24 + 9, listo: 9 * 24 + 7 } : null;
      tr.taller.ultimo = P.dia * 24 + P.horas; H.__taller().actualizar(2); return 1 })()`);
    for (let k = 0; k < 4; k++) { await js(`(async () => { const M = window.__hojarasca.__aldeaMundo(); M.actualizar(4, window.__hojarasca.camara.position); await M.listo(); M.montarCola(); return 1 })()`); await esperar(150); }
    // la gente: con vos lejos se ubican directo en su lugar; después volvés
    if (t.gente) {
      await js(`(() => { const H = window.__hojarasca, r = H.T.lugares.refugio; H.jugador.ubicar(r.x, r.z, 0); for (let i = 0; i < 6; i++) { H.__aldea.actualizar(0.6); } return 1 })()`);
    }
    const poner = `(() => { const H = window.__hojarasca, T = H.T, js = H.jugador.estado, t = ${JSON.stringify(t)};
      H.clima.estado.nublado = 0.15; H.progreso.horas = t.hora;
      const e = H.__aldea.edificio('taller-tren'), c = Math.cos(e.rot), s = Math.sin(e.rot), piso = e.y + 0.32;
      const w = (lx, lz) => ({ x: e.x + lx * c + lz * s, z: e.z - lx * s + lz * c });
      const wo = w(t.ojo[0], t.ojo[2]), wa = w(t.a[0], t.a[2]);
      const dentro = Math.abs(t.ojo[0]) < 8.5 && Math.abs(t.ojo[2]) < 3.6;
      const o = { x: wo.x, z: wo.z, y: (dentro ? piso : Math.max(T.altura(wo.x, wo.z), piso - 3)) + t.ojo[1] }, a = { x: wa.x, z: wa.z, y: piso + t.a[1] };
      const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
      if (t.panel) { H.jugador.ubicar(o.x, o.z, yaw); } else { js.pos.set(o.x, o.y - 1.65, o.z); js.vel.set(0, 0, 0); js.vy = 0; }
      js.yaw = yaw; js.pitch = pitch;
      const cam = H.camara; cam.position.set(o.x, o.y, o.z); cam.rotation.order = 'YXZ'; cam.rotation.set(pitch, yaw, 0);
      if (cam.fov !== 70) { cam.fov = 70; cam.updateProjectionMatrix(); }
      for (const k of cam.children) k.visible = !!t.panel;
      return 1 })()`;
    await js(poner);
    // que se acomode: unos cuadros (la gente camina sus últimos pasos y posa), la sombra, la luz
    for (let k = 0; k < 40; k++) {
      await js(`(() => { const H = window.__hojarasca; if (${!!t.gente}) { H.__aldea.actualizar(0.25); H.__aldea.mundo()?.prearmar?.(1e6); } H.__bucle(); return 1 })()`);
      if (!t.panel) await js(poner);
      await esperar(40);
    }
    if (t.panel) {
      await js(`(() => { const H = window.__hojarasca; H.__taller().abrirPanel(); return 1 })()`);
      await esperar(300);
      await js(`(() => { window.__hojarasca.__bucle(); return 1 })()`);
    }
    await esperar(500);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    const m = await js(`(() => { const H = window.__hojarasca, r = H.renderer?.info?.render; const g = (k) => { const st = H.__aldea.mundo().personas.get(k); const n = st?.npc; return n ? { punto: st.destino?.punto, pose: n.pose || null } : null; }; return { dibujos: r?.calls ?? null, tris: r?.triangles ?? null, martin: g('martin'), jefe: g('jefe') } })()`);
    informe.push(`${nombre}: ${JSON.stringify(m)}`);
    if (t.panel) await js(`(() => { window.__hojarasca.__taller().cerrarPanel(); return 1 })()`);
  }
  fs.writeFileSync(path.join(salida, 'informe.txt'), [...informe, ...(errores.length ? ['errores:', ...errores] : [])].join('\n') + '\n');
  console.log(informe.join('\n'));
  if (errores.length) console.log('errores:\n' + errores.join('\n'));
  salir(0);
});
