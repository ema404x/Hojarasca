// 4.0 (prototipo de la casa de té): tomas fijas del INTERIOR de la casa de té en el juego real (Relax, calidad alta), de día, a la tarde y de noche.
// La cámara se pone en puntos del marco local del edificio (+z = la puerta, x = −3,5 la chimenea) con `__camaraFija` (sólo con ?debug=1).
// Uso: npx electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/fotos-casa-te-40.cjs salida=<carpeta> [solo=a,b] [momentos=dia,tarde,noche]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const salida = path.resolve(raiz, arg('salida', path.join('pruebas', 'salidas', 'casa-te-40')));
const solo = arg('solo', '').split(',').filter(Boolean);
const ocultar = arg('ocultar', '').split(',').filter(Boolean);   // depurar: nombres de objetos de la escena que no se dibujan
const momentos = arg('momentos', 'dia,tarde,noche').split(',').filter(Boolean);
const HORAS = { dia: 14.5, tarde: 18.2, noche: 22 };
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 10 minutos'); salir(2); }, 10 * 60 * 1000).unref?.();

// las tomas: ojo y blanco en el marco local del edificio [lx, y sobre el piso, lz]; fov
const TOMAS = {
  'entrada': { ojo: [0.0, 1.6, 2.75], mira: [0.0, 1.35, -1.6], fov: 62 },
  'barra': { ojo: [-0.2, 1.55, 1.9], mira: [0.2, 1.25, -2.2], fov: 58 },
  'mesa': { ojo: [-0.2, 1.5, 2.35], mira: [-1.3, 1.1, 1.0], fov: 55 },
  'fondo-ventanas': { ojo: [0.2, 1.6, -1.9], mira: [0.0, 1.5, 2.6], fov: 66 },
  'hogar': { ojo: [1.2, 1.6, 1.9], mira: [-3.0, 1.2, -1.0], fov: 62 },
  'mesa-cerca': { ojo: [-0.5, 1.25, 2.15], mira: [-1.5, 0.95, 1.3], fov: 48 },
  'exterior': { ojo: [0.8, 1.65, 9.0], mira: [0.0, 1.7, 2.6], fov: 62 },
  'techo': { ojo: [0.0, 1.5, 1.8], mira: [0.0, 2.5, -0.6], fov: 70 },
};

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.focus();
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const url = path.join(raiz, 'index.html');
  const sinHud = `(() => { let s = document.getElementById('sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'sin-hud'; document.head.appendChild(s); } s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; return 1 })()`;
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.est)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  await js(`(async () => { const P = ${H}.progreso; P.aldea.descubierta = 1; P.dia = 3; P.horas = 14.5; ${H}.clima.estado.nublado = 0.1; await ${H}.__aldeaMundo().listo(); ${H}.__aldeaMundo().montarCola(); return 1 })()`);
  await js(sinHud);
  const info = await js(`(() => { const t = ${H}.est.casaTe; return JSON.stringify({ x: t.x, z: t.z, y: t.y, rot: t.rot }) })()`);
  console.log('casa de té', info);
  if (ocultar.length) await js(`(() => { const H = ${H}; H.escena.traverse((o) => { if (${JSON.stringify(ocultar)}.includes(o.name)) Object.defineProperty(o, 'visible', { get: () => false, set: () => {} }); }); return 1 })()`);
  if (arg('halo', '')) await js(`(() => { const g = ${H}.est.casaTe.efectos.halos.geometry; g.setDrawRange(${Number(arg('halo', 0))} * 6, 6); return 1 })()`);
  // la pelusa del aire (puntos flotantes del valle) entra a los interiores y tapa la toma: no se dibuja en las capturas
  await js(`(() => { for (const o of ${H}.escena.children) if (o.isPoints) Object.defineProperty(o, 'visible', { get: () => false, set: () => {} }); return 1 })()`);
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const poner = (t, horas) => js(`(() => { const H = ${H}, c = H.est.casaTe, T = H.T;
    const wx = (lx, lz) => ({ x: c.x + lx * Math.cos(c.rot) + lz * Math.sin(c.rot), z: c.z - lx * Math.sin(c.rot) + lz * Math.cos(c.rot) });
    const o = wx(${t.ojo[0]}, ${t.ojo[2]}), b = wx(${t.mira[0]}, ${t.mira[2]});
    const y0 = c.y + 0.38, yo = y0 + ${t.ojo[1]}, yb = y0 + ${t.mira[1]};
    const dx = b.x - o.x, dz = b.z - o.z, d = Math.hypot(dx, dz);
    const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(yb - yo, d);
    H.jugador.ubicar(o.x, o.z, 0);
    H.__camaraFija = { x: o.x, y: yo, z: o.z, yaw, pitch }; H.camara.fov = ${t.fov}; H.camara.updateProjectionMatrix();
    H.progreso.horas = ${horas}; H.camara.children.forEach((o) => { o.visible = false; }); return 1 })()`);
  const foto = async (nombre, horas) => {
    for (let i = 0; i < 40; i++) { await js(`${H}.progreso.horas = ${horas}; 1`); await cuadro(1); await esperar(30); }
    await esperar(300);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log('  ' + nombre + '.png');
  };
  for (const m of momentos) {
    for (const [nombre, t] of Object.entries(TOMAS)) {
      if (solo.length && !solo.includes(nombre)) continue;
      await poner(t, HORAS[m]);
      await foto(`${nombre}-${m}`, HORAS[m]);
    }
  }
  if (arg('dibujos', '')) {
    // cuenta los dibujos de un cuadro con los efectos de la casa de té prendidos y apagados (misma vista)
    const t = TOMAS[arg('dibujos', 'exterior')];
    await poner(t, HORAS.noche);
    const contar = (apagar) => js(`(() => { const H = ${H}, R = H.renderer, ef = H.est.casaTe.efectos; const act = ef.actualizar; if (${apagar}) { ef.actualizar = () => {}; ef.grupo.visible = false; ef.halos.visible = false; } else ef.actualizar = act;
      H.progreso.horas = ${HORAS.noche}; for (let i = 0; i < 10; i++) H.__bucle();
      R.info.autoReset = false; R.info.reset(); const reset = R.info.reset; R.info.reset = () => {}; H.__bucle(); const r = { calls: R.info.render.calls, tri: R.info.render.triangles }; R.info.reset = reset; R.info.autoReset = true; ef.actualizar = act; return JSON.stringify(r) })()`);
    console.log('dibujos con efectos', await contar(false)); console.log('dibujos sin efectos', await contar(true)); console.log('dibujos con efectos', await contar(false));
  }
  if (arg('sonda', '')) console.log(await js(`(() => { try { const H = ${H}, ef = H.est.casaTe.efectos, g = ef.halos.geometry.attributes.position, out = []; ef.halos.parent.updateMatrixWorld(true); H.camara.updateMatrixWorld(true); for (let i = 0; i < g.count; i += 4) { const v = new H.camara.position.constructor(g.getX(i), g.getY(i), g.getZ(i)); v.applyMatrix4(ef.halos.matrixWorld); const w = v.clone(); v.project(H.camara); out.push([i / 4, +v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(3), +g.getX(i).toFixed(2), +g.getY(i).toFixed(2), +g.getZ(i).toFixed(2)].join(' ')); } return out.join('|') } catch (e) { return String(e.stack) } })()`));
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  salir(0);
});
