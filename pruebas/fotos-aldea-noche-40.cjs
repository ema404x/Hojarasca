// 4.0 (prototipo de la aldea de noche): tomas fijas de la aldea completa en el juego real (Relax, calidad alta, aldea completa), de noche y al atardecer.
// Las posiciones están en el marco de la aldea (A.aMundo(lx, lz)); la altura es sobre el terreno. Cámara quieta con `__camaraFija` (sólo con ?debug=1).
// Uso: npx electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/fotos-aldea-noche-40.cjs salida=<carpeta> [solo=a,b] [momentos=noche,tarde] [calidad=alta]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const salida = path.resolve(raiz, arg('salida', path.join('pruebas', 'salidas', 'aldea-noche-40')));
const solo = arg('solo', '').split(',').filter(Boolean);
const momentos = arg('momentos', 'noche,tarde').split(',').filter(Boolean);
const calidad = arg('calidad', 'alta');
const HORAS = { noche: 22, tarde: 18.2 };
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 12 minutos'); salir(2); }, 12 * 60 * 1000).unref?.();

// ojo y blanco: [lx, lz, metros sobre el terreno] en el marco de la aldea; fov
const TOMAS = {
  'plaza-reloj': { ojo: [10, 30, 1.7], mira: [4, 38, 3.0], fov: 64 },
  'loma': { ojo: [-40, 53, 1.7], mira: [-100, 52, 2.0], fov: 66 },
  'cantina-fachada': { ojo: [-146, 56, 1.7], mira: [-153.5, 41, 2.0], fov: 62 },
  'cantina-interior': { ojo: [-153.5, 43.2, 1.6], mira: [-153.5, 36, 1.4], fov: 70 },
  'casa-ventanas': { ojo: [-52, 55, 1.7], mira: [-68, 45, 2.2], fov: 60 },
  'general': { ojo: [-38, 22, 20], mira: [-70, 48, 2], fov: 70 },
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
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.est)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  // la aldea completa (como medir-vistas con COMPLETA=1)
  await js(`(async () => { const H = ${H}, A = H.__aldeaMundo(); const a = H.progreso.aldea; await A.listo();
    const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
    const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
    a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
    H.progreso.dia = 3; H.progreso.horas = 22; H.clima.estado.nublado = 0.1; A.actualizar(4, H.camara.position); A.montarCola(); return ks.length })()`);
  await js(sinHud);
  await js(`(() => { for (const o of ${H}.escena.children) if (o.isPoints) Object.defineProperty(o, 'visible', { get: () => false, set: () => {} }); return 1 })()`);
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const poner = (t, horas) => js(`(() => { const H = ${H}, A = H.__aldeaMundo(), T = H.T;
    const f = (p) => { const w = A.aMundo(p[0], p[1]); return { x: w.x, z: w.z, y: T.altura(w.x, w.z) + p[2] }; };
    const o = f(${JSON.stringify(t.ojo)}), b = f(${JSON.stringify(t.mira)});
    const dx = b.x - o.x, dz = b.z - o.z, d = Math.hypot(dx, dz);
    const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(b.y - o.y, d);
    H.jugador.ubicar(o.x, o.z, 0);
    H.__camaraFija = { x: o.x, y: o.y, z: o.z, yaw, pitch }; H.camara.fov = ${t.fov}; H.camara.updateProjectionMatrix();
    H.progreso.horas = ${horas}; H.camara.children.forEach((q) => { q.visible = false; }); return 1 })()`);
  const foto = async (nombre, horas) => {
    for (let i = 0; i < 90; i++) { await js(`${H}.progreso.horas = ${horas}; 1`); await cuadro(1); await esperar(30); }
    await esperar(400);
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
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  salir(0);
});
