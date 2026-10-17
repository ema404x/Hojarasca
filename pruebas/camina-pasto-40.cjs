// 4.0 (aplastado del pasto): PRUEBA EN MOVIMIENTO en el juego real (Relax, calidad alta, verano). El jugador camina con W
// (cuadros fijos de 0,05 s de juego: la ventana puede ir a 1 cuadro/s y da igual) a través de un pastizal y se sacan
// capturas antes de pasar, pasando, 3 s y 8 s después, desde atrás y de costado; y otra secuencia con el perro cerca.
// Uso: npx electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/camina-pasto-40.cjs salida=<carpeta relativa> [calidad=alta] [sin=1]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const salida = path.resolve(raiz, arg('salida', path.join('pruebas', 'salidas', 'camina-pasto-40')));
const calidad = arg('calidad', 'alta');
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 12 minutos'); salir(2); }, 12 * 60 * 1000).unref?.();

// un pastizal llano y abierto, cerca del refugio, con 24 m de largo libres para caminar en línea recta
const BUSCAR = `(() => {
  const H = window.__hojarasca, T = H.T, ref = T.lugares.refugio;
  const bueno = (x, z) => { const k = T.indice(x, z); return !T.agua(x, z) && T.bosque[k] < 0.15 && T.distSendero[k] > 3 && T.pendiente[k] < 0.2 && T.pasto[k] > 0.45; };
  let mejor = null;
  for (let z = -400; z < 400; z += 6) for (let x = -400; x < 400; x += 6) {
    for (const ang of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      let ok = true;
      for (let s = -8; s <= 26 && ok; s += 2) for (let l = -8; l <= 8 && ok; l += 4) ok = bueno(x + Math.cos(ang) * s - Math.sin(ang) * l, z + Math.sin(ang) * s + Math.cos(ang) * l);
      if (!ok) continue;
      const p = -Math.hypot(x - ref.x, z - ref.z);
      if (!mejor || p > mejor.p) mejor = { p, x, z, ang };
    }
  }
  return JSON.stringify(mejor);
})()`;

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
  await js(sinHud);
  await js(`(() => { for (const o of ${H}.escena.children) if (o.isPoints) Object.defineProperty(o, 'visible', { get: () => false, set: () => {} }); return 1 })()`);
  const P = JSON.parse(await js(BUSCAR));
  console.log('pastizal', JSON.stringify(P));
  console.log('uniforme:', await js(`(${H}.pasto && ${H}.calidad.pasto)`));
  const cuadro = async (n = 1) => { await esperar(55); return js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`); };
  const foto = async (nombre) => { await esperar(250); const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG()); console.log('  ' + nombre + '.png'); };
  const tecla = (tipo, code) => js(`document.dispatchEvent(new KeyboardEvent('${tipo}', { code: '${code}', bubbles: true })); 1`);
  // la dirección del pastizal: (cos, sin) de P.ang en (x, z); el yaw del jugador mira hacia -sin(yaw), -cos(yaw)
  const dx = Math.cos(P.ang), dz = Math.sin(P.ang), yaw = Math.atan2(-dx, -dz);
  const en = (s, l) => ({ x: P.x + dx * s - dz * l, z: P.z + dz * s + dx * l });
  // la cámara es la del juego (el pasto se arma alrededor de ella: con una cámara fija lejos del jugador el anillo no coincide):
  // se camina hacia adelante y se mira para atrás (yaw + pi) con una inclinación de mirada distinta en cada variante
  const mirar = (yawM, pitch) => js(`(() => { const e = ${H}.jugador.estado; e.yaw = ${yawM}; e.pitch = ${pitch}; ${H}.progreso.horas = 11.5; return 1 })()`);
  const quieto = async (cuadros) => { for (let i = 0; i < cuadros; i++) { await js(`${H}.progreso.horas = 11.5; 1`); await cuadro(1); } };
  const pos = async () => JSON.parse(await js(`JSON.stringify({x:${H}.jugador.estado.pos.x, z:${H}.jugador.estado.pos.z})`));
  const VARIANTES = [['atras', -0.1, false], ['bajo', -0.4, false], ['atras-perro', -0.1, true], ['bajo-perro', -0.4, true]];
  for (const [pref, pitch, conPerro] of VARIANTES) {
    const ini = en(0, 0);
    await js(`${H}.jugador.ubicar(${ini.x}, ${ini.z}, ${yaw}); 1`);
    // el perro: cerca del recorrido (a un costado del camino) o lejos
    const pp = conPerro ? en(9, 2.5) : en(-70, 40);
    await js(`(() => { const e = ${H}.perro.est; e.pos.x = ${pp.x}; e.pos.z = ${pp.z}; return 1 })()`);
    // ANTES: el pastizal sin tocar, visto desde el final del recorrido hacia el principio
    const fin = en(16, 0);
    await js(`${H}.jugador.ubicar(${fin.x}, ${fin.z}, ${yaw + Math.PI}); 1`);
    await mirar(yaw + Math.PI, pitch);
    await quieto(160);
    await foto(`${pref}-1-antes`);
    // CAMINA 16 m con W sostenida (cuadros de 0,05 s de juego), del principio al final
    await js(`${H}.jugador.ubicar(${ini.x}, ${ini.z}, ${yaw}); 1`);
    await js(`(() => { const e = ${H}.perro.est; e.pos.x = ${pp.x}; e.pos.z = ${pp.z}; return 1 })()`);
    await quieto(160);   // las huellas de la pasada anterior ya se levantaron
    await tecla('keydown', 'KeyW');
    const p0 = await pos();
    let cuadros = 0;
    for (let i = 0; i < 400; i++) {
      await js(`${H}.progreso.horas = 11.5; 1`); await cuadro(1); cuadros++;
      const q = await pos();
      if (Math.hypot(q.x - p0.x, q.z - p0.z) > 15.5) break;
    }
    await tecla('keyup', 'KeyW');
    const q = await pos();
    console.log(pref, 'caminó', Math.hypot(q.x - p0.x, q.z - p0.z).toFixed(1), 'm en', cuadros, 'cuadros (', (cuadros * 0.05).toFixed(1), 's de juego )');
    await mirar(yaw + Math.PI, pitch);
    await quieto(2);
    await foto(`${pref}-2-pasando`);
    await quieto(60);   // 3 s
    await foto(`${pref}-3-a-los-3s`);
    await quieto(100);  // 5 s más: 8 s
    await foto(`${pref}-4-a-los-8s`);
  }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  salir(0);
});
