// 4.0 (prototipo de agua y cielo): tomas fijas en el juego real (Relax, calidad alta, aldea completa para la plaza).
// Cámara quieta con `__camaraFija` (sólo con ?debug=1). Las tomas se dan en el mundo (x, z, metros sobre el terreno).
// Uso: npx electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/fotos-agua-cielo-40.cjs salida=<carpeta relativa al repo> [solo=a,b] [momentos=amanecer,mediodia,atardecer] [calidad=alta] [estacion=verano|otono]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const salida = path.resolve(raiz, arg('salida', path.join('pruebas', 'salidas', 'agua-cielo-40')));
const solo = arg('solo', '').split(',').filter(Boolean);
const momentos = arg('momentos', 'amanecer,mediodia,atardecer').split(',').filter(Boolean);
const calidad = arg('calidad', 'alta');
const estacion = arg('estacion', 'verano');
const HORAS = { amanecer: 6.8, mediodia: 12.5, atardecer: 19.4, tarde: 18.4 };
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 14 minutos'); salir(2); }, 14 * 60 * 1000).unref?.();

// cada toma: una expresión que corre en la página y devuelve { o: [x, z, alto], m: [x, z, alto], fov }
const TOMAS = {
  'mirador-valle': { donde: `(() => { const L = H.T.lugares.mirador; return { o: [L.x + 3, L.z, 2.2], m: [L.x + 120, L.z + 8, 30], fov: 72 } })()` },
  'orilla-lago': { donde: `(() => { const M = H.T.lugares.muelle, c = Math.cos(M.ang), s = Math.sin(M.ang); return { o: [M.x - c * 3 - s * 4, M.z - s * 3 + c * 4, 1.5], m: [M.x + c * 40, M.z + s * 40, -0.5], fov: 68 } })()` },
  'lago-lejos': { donde: `(() => { const M = H.T.lugares.muelle, c = Math.cos(M.ang), s = Math.sin(M.ang); return { o: [M.x + c * 9, M.z + s * 9, 3.2], m: [M.x + c * 80 + s * 40, M.z + s * 80 - c * 40, 3], fov: 66 } })()` },
  'bosque': { donde: `(() => { const L = H.T.lugares.refugio; return { o: [L.x - 24, L.z - 18, 1.7], m: [L.x + 4, L.z + 6, 4], fov: 68 } })()` },
  'refugio': { donde: `(() => { const L = H.T.lugares.refugio; return { o: [L.x + 26, L.z + 26, 1.7], m: [L.x, L.z, 3], fov: 66 } })()` },
  'aldea-plaza': { aldea: true, donde: `(() => { const A = H.__aldeaMundo(); const s = A.estadoEdificio('plaza').sitio; const fx = Math.sin(s.rot), fz = Math.cos(s.rot);
      return { o: [s.x + fx * 16, s.z + fz * 16, 1.8], m: [s.x, s.z, 4], fov: 64 } })()` },
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
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'${estacion}'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.est)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  const hayAldea = Object.entries(TOMAS).some(([n, t]) => t.aldea && (!solo.length || solo.includes(n)));
  if (hayAldea) {
    await js(`(async () => { const H = ${H}, A = H.__aldeaMundo(); const a = H.progreso.aldea; await A.listo();
      const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
      const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
      a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
      H.progreso.dia = 3; H.clima.estado.nublado = 0.1; A.actualizar(4, H.camara.position); A.montarCola(); return ks.length })()`);
  }
  await js(sinHud);
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const poner = async (t, horas) => {
    await js(`${H}.progreso.horas = ${horas}; 1`);
    const d = await js(`(() => { const H = ${H}; return JSON.stringify(${t.donde}) })()`);
    const q = JSON.parse(d);
    return js(`(() => { const H = ${H}, T = H.T;
      const f = (p) => ({ x: p[0], z: p[1], y: Math.max(T.altura(p[0], p[1]), 0) + p[2] });
      const o = f(${JSON.stringify(q.o)}), b = f(${JSON.stringify(q.m)});
      const dx = b.x - o.x, dz = b.z - o.z, dd = Math.hypot(dx, dz);
      const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(b.y - o.y, dd);
      H.jugador.ubicar(o.x, o.z, 0);
      H.__camaraFija = { x: o.x, y: o.y, z: o.z, yaw, pitch }; H.camara.fov = ${q.fov}; H.camara.updateProjectionMatrix();
      H.progreso.horas = ${horas}; H.camara.children.forEach((q) => { q.visible = false; }); return 1 })()`);
  };
  const foto = async (nombre, horas) => {
    for (let i = 0; i < 90; i++) { await js(`${H}.progreso.horas = ${horas}; 1`); await cuadro(1); await esperar(30); }
    await esperar(400);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log('  ' + nombre + '.png');
    if (arg("diag", "") === "1") console.log("  diag " + JSON.stringify(await js("window.__rb")));
  };
  for (const m of momentos) {
    for (const [nombre, t] of Object.entries(TOMAS)) {
      if (solo.length && !solo.includes(nombre)) continue;
      await poner(t, HORAS[m]);
      await foto(`${nombre}-${m}${estacion === 'verano' ? '' : '-' + estacion}`, HORAS[m]);
    }
  }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  salir(0);
});
