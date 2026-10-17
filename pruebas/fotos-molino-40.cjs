// 4.0 (molino y puente): tomas fijas del molino de viento (con su campo, arroyo y cerco) y del puente de troncos en el juego real
// (Relax, calidad alta), de día y a la tarde. La cámara se pone en el marco local de la obra con `__camaraFija` (sólo con ?debug=1):
//   molino: +z = hacia la puerta (el sendero), +x = a la derecha mirando desde la puerta; y = metros sobre el suelo bajo la cámara.
//   puente: +x = a lo largo del tablero (ángulo del puente), +z = al costado.
// Uso: npx electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/fotos-molino-40.cjs salida=<carpeta relativa> [solo=a,b] [momentos=dia,tarde]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const salida = path.resolve(raiz, arg('salida', path.join('pruebas', 'salidas', 'molino-40')));
const solo = arg('solo', '').split(',').filter(Boolean);
const momentos = arg('momentos', 'dia,tarde').split(',').filter(Boolean);
const HORAS = { dia: 12.5, tarde: 18.4 };
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 10 minutos'); salir(2); }, 10 * 60 * 1000).unref?.();

// ojo y blanco: [lx, metros sobre el suelo, lz] en el marco local de la obra; fov
const TOMAS = {
  'molino-lejos': { obra: 'molino', ojo: [16, 6, 30], mira: [0, 5, 0], fov: 55 },
  'molino-cerca': { obra: 'molino', ojo: [5, 1.7, 11], mira: [0, 3.2, 0], fov: 60 },
  'molino-cerca-lateral': { obra: 'molino', ojo: [11.5, 2.2, 6.5], mira: [0, 3.5, 0], fov: 60 },
  'casa': { obra: 'molino', ojo: [-6, 1.7, 21], mira: [-10, 1.9, 9], fov: 60 },
  'casa-galeria': { obra: 'molino', ojo: [-7.5, 1.6, 16.5], mira: [-10.5, 1.6, 12], fov: 66 },
  'molino-aerea': { obra: 'molino', ojo: [4, 30, 26], mira: [0, 0, 2], fov: 55 },
  'campo': { obra: 'molino', ojo: [-5, 2.4, 20], mira: [10, 0.4, 8], fov: 62 },
  'campo-bajo': { obra: 'molino', ojo: [13, 1.2, 20], mira: [3, 0.4, 14], fov: 58 },
  'arroyo': { obra: 'molino', ojo: [-8, 1.7, 21.5], mira: [-15, 0.3, 26.3], fov: 58 },
  'cascada': { obra: 'molino', ojo: [7, 1.5, 33], mira: [11.5, 0.5, 26.8], fov: 55 },
  'cascada-lado': { obra: 'molino', ojo: [15, 2.0, 21.5], mira: [11.5, 0.5, 26.8], fov: 58 },
  'puente-frente': { obra: 'puente', ojo: [-2, 1.7, 12], mira: [0, 1.0, 0], fov: 60 },
  'puente-lateral': { obra: 'puente', ojo: [-12, 1.9, 5], mira: [0, 1.0, 0], fov: 62 },
  'puente-arriba': { obra: 'puente', ojo: [-7, 12, 9], mira: [0, 0, 0], fov: 55 },
  'puente-sobre': { obra: 'puente', ojo: [-5.5, 2.2, 0], mira: [4, 1.2, 0], fov: 64 },
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
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${arg('calidad', 'alta')}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'${arg('estacion', 'verano')}'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.est)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  await js(`(async () => { const P = ${H}.progreso; P.aldea.descubierta = 1; P.dia = 3; P.horas = 12.5; ${H}.clima.estado.nublado = 0.1; await ${H}.__aldeaMundo().listo(); ${H}.__aldeaMundo().montarCola(); return 1 })()`);
  await js(sinHud);
  const info = await js(`(() => { const m = ${H}.est.molino, p = ${H}.T.puentes; return JSON.stringify({ molino: m && { x: m.x, z: m.z, y: m.y, rot: m.rot }, puentes: p.map((q) => ({ x: q.x, z: q.z, ang: q.ang, alto: q.alto, largo: q.largo })) }) })()`);
  console.log('obras', info);
  const obras = JSON.parse(info);
  if (arg('sonda', '')) {
    // mapa de texto del terreno en el marco del molino (arriba = -z, derecha = +x): ~ agua, p sendero, T bosque, dígito/letra = metros sobre/bajo la base
    const m = obras.molino;
    const filas = await js(`(() => { const H = ${H}, T = H.T, o = ${JSON.stringify(m)}, out = [];
      for (let lz = -50; lz <= 56; lz += 2) { let f = String(lz).padStart(4) + ' '; for (let lx = -50; lx <= 50; lx += 2) {
        const x = o.x + lx * Math.cos(o.rot) + lz * Math.sin(o.rot), z = o.z - lx * Math.sin(o.rot) + lz * Math.cos(o.rot);
        const k = T.indice(x, z), dy = T.altura(x, z) - o.y;
        let ch = Math.abs(dy) < 0.4 ? '.' : dy > 0 ? String(Math.min(9, Math.round(dy))) : String.fromCharCode(96 + Math.min(9, Math.round(-dy)));
        if (T.bosque[k] > 0.35) ch = 'T'; if (T.distSendero[k] < 2.2) ch = 'p'; if (T.agua(x, z)) ch = '~'; f += ch; } out.push(f); } return out.join('\\n') })()`);
    console.log('columnas lx -50..50 de a 2; filas lz -50..56 de a 2');
    console.log(filas);
    salir(0); return;
  }
  await js(`(() => { for (const o of ${H}.escena.children) if (o.isPoints) Object.defineProperty(o, 'visible', { get: () => false, set: () => {} }); return 1 })()`);
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const poner = (t, horas) => {
    const idx = Number(arg('puente', 0));
    const o = t.obra === 'molino' ? obras.molino : obras.puentes[idx];
    // marco local: molino (rot: +z hacia la puerta), puente (ang: +x a lo largo)
    const f = t.obra === 'molino'
      ? `const wx = (lx, lz) => ({ x: ${o.x} + lx * Math.cos(${o.rot}) + lz * Math.sin(${o.rot}), z: ${o.z} - lx * Math.sin(${o.rot}) + lz * Math.cos(${o.rot}) });`
      : `const wx = (lx, lz) => ({ x: ${o.x} + lx * Math.cos(${o.ang}) - lz * Math.sin(${o.ang}), z: ${o.z} + lx * Math.sin(${o.ang}) + lz * Math.cos(${o.ang}) });`;
    return js(`(() => { const H = ${H}, T = H.T; ${f}
      const a = wx(${t.ojo[0]}, ${t.ojo[2]}), b = wx(${t.mira[0]}, ${t.mira[2]});
      const yo = T.altura(a.x, a.z) + ${t.ojo[1]}, yb = T.altura(b.x, b.z) + ${t.mira[1]};
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(yb - yo, d);
      H.jugador.ubicar(a.x, a.z, 0);
      H.__camaraFija = { x: a.x, y: yo, z: a.z, yaw, pitch }; H.camara.fov = ${t.fov}; H.camara.updateProjectionMatrix();
      H.progreso.horas = ${horas}; H.camara.children.forEach((o) => { o.visible = false; }); return 1 })()`);
  };
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
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  salir(0);
});
