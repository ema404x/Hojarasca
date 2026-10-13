// 3.9.0: primeros planos de Lucrecia (la moza de la cantina) EN EL JUEGO REAL, junto a una vecina normal (Gladys, la madre) para comparar escala y esqueleto:
// quieta, caminando, con la bandeja (parada y caminando), apoyada en la barra y dejando el pedido; cada una de frente, de 3/4 y de perfil.
// Uso: salida-cantina\lanzar.ps1 -Script pruebas\fotos-moza-390.cjs     (HOJ_SALIDA para otra carpeta; HOJ_SOLO=quieta,camina,...)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/Documents/Hojarasca/salida-cantina/moza-juego';
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: tardó más de 12 minutos'); salir(2); }, 12 * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1400, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.focus();
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const url = path.join(raiz, 'index.html');
  const sinHud = `(() => { let s = document.getElementById('sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'sin-hud'; document.head.appendChild(s); } s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; return 1 })()`;
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.__aldea && ${H}.__cantina)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  await js(`(async () => { const P = ${H}.progreso; P.aldea.descubierta = 1; P.dia = 3; P.horas = 14.5; ${H}.clima.estado.nublado = 0.1; await ${H}.__aldeaMundo().listo(); ${H}.__aldeaMundo().montarCola(); return 1 })()`);
  await js(`(() => { const H = ${H}, c = H.__cantina(), p = c.lugar.aMundo(0, 12); H.jugador.ubicar(p.x, p.z + 8, 0); for (let i = 0; i < 8; i++) { H.__aldea.actualizar(0.6); H.__aldea.mundo().prearmar(1e6); } return 1 })()`);
  await js(sinHud);
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  // las dos figuras, libres de la rutina, en el camino de adelante de la cantina, mirando hacia donde se diga
  await js(`(() => { const H = ${H}, M = H.__aldea.mundo();
    window.__f = { L: M.figura('moza'), G: M.figura('madre') };
    for (const n of Object.values(window.__f)) { n.dormido = false; n.soloCerca = 0; n.conVos = true; n.enCita = true; n.alAmor = true; n.charlaVecinos = false; n.__primera = false; }
    return !!(window.__f.L && window.__f.G) })()`);
  // pone a las dos lado a lado: Lucrecia en (x0, z0) y Gladys a su derecha; devuelve el punto medio
  const colocar = (dx, dz) => js(`(() => { const H = ${H}, c = H.__cantina(), p = c.lugar.aMundo(${dx}, ${dz}), T = H.T;
    // «adelante» = hacia la puerta (el +Z de la cantina); cada una mira hacia el camino (hacia vos)
    const e = H.__aldea.edificio('cantina'), yaw = e.rot;   // el giro del edificio en el mundo: el +Z local mira hacia (sin yaw, cos yaw)
    const f = { x: Math.sin(yaw), z: Math.cos(yaw) }, d = { x: Math.cos(yaw), z: -Math.sin(yaw) };   // adelante y derecha (local +X)
    const L = window.__f.L, G = window.__f.G;
    for (const [n, k] of [[L, -0.75], [G, 0.75]]) { const x = p.x + d.x * k, z = p.z + d.z * k; n.pos.set(x, T.altura(x, z), z); n.camino = []; n.pose = null; n.vel = 0; n.rumbo = n.rumboObjetivo = n.g.rotation.y = yaw; n.miraFinal = yaw; }
    L.bandeja?.visible(false); L.bandeja?.vasos(0);
    window.__medio = { x: p.x, z: p.z, yaw, f, d }; return 1 })()`);
  // la cámara: a \`dist\` metros, girada \`ang\` grados desde el frente de ellas (0 frente, 45 tres cuartos, 90 perfil), a \`alto\` m, mirando a \`mira\` m
  const camara = (ang, dist = 2.6, alto = 1.25, mira = 0.95, quien = 'ambas') => js(`(() => { const H = ${H}, m = window.__medio, L = window.__f.L, G = window.__f.G;
    const c = ${quien === 'ambas' ? '{ x: (L.pos.x + G.pos.x) / 2, z: (L.pos.z + G.pos.z) / 2 }' : 'L.pos'};
    const base = L.g.rotation.y, a = base + ${ang} * Math.PI / 180;
    const ojo = { x: c.x + Math.sin(a) * ${dist}, z: c.z + Math.cos(a) * ${dist} };
    const y0 = H.T.altura(c.x, c.z);
    const yaw = Math.atan2(-(c.x - ojo.x), -(c.z - ojo.z)), pitch = Math.atan2((y0 + ${mira}) - (y0 + ${alto}), ${dist});
    H.__camaraFija = { x: ojo.x, y: y0 + ${alto}, z: ojo.z, yaw, pitch }; H.camara.fov = 38; H.camara.updateProjectionMatrix(); return 1 })()`);
  const foto = async (nombre) => {
    await cuadro(2); await esperar(150);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log(`  ${nombre}.png`);
  };
  // lo que hace cada una: ponerles la pose y dejarla asentarse unos cuadros
  const estados = {
    quieta: async () => { await js(`(() => { const L = window.__f.L, G = window.__f.G; L.pose = 'cintura'; G.pose = null; return 1 })()`); },
    atras: async () => { await js(`(() => { const L = window.__f.L, G = window.__f.G; L.pose = 'atras'; G.pose = 'atras'; return 1 })()`); },
    bandeja: async () => { await js(`(() => { const L = window.__f.L, G = window.__f.G; L.pose = 'bandeja'; L.bandeja?.visible(true); L.bandeja?.vasos(3); G.pose = null; return 1 })()`); },
    barra: async () => { await js(`(() => { const L = window.__f.L, G = window.__f.G; L.pose = 'barra'; L.ladoBarra = 1; G.pose = null; return 1 })()`); },
    dejar: async () => { await js(`(() => { const L = window.__f.L, G = window.__f.G; L.pose = 'dejar'; L.bandeja?.visible(true); L.bandeja?.vasos(1); G.pose = null; return 1 })()`); },
  };
  const solo = (process.env.HOJ_SOLO || '').split(',').filter(Boolean);
  const queremos = (k) => !solo.length || solo.includes(k);
  const angulos = [['frente', 0], ['tres-cuartos', 40], ['perfil', 90], ['espalda', 180]];
  for (const [clave, preparar] of Object.entries(estados)) {
    if (!queremos(clave)) continue;
    console.log('— ' + clave);
    await colocar(0, 11);
    await preparar();
    for (let i = 0; i < 25; i++) { await cuadro(1); await esperar(40); }
    for (const [nom, ang] of angulos) { await (ang >= 80 ? camara(ang, 2.3, 1.2, 0.95, 'ella') : camara(ang)); await foto(`${clave}-${nom}`); }
    await camara(30, 1.8, 1.1, 0.85, 'ella'); await foto(`${clave}-cerca`);
  }
  // caminando (las dos, a la par, hacia la cantina y de vuelta): varios cuadros del paso
  for (const [clave, cfg] of Object.entries({ camina: { bandeja: false }, 'camina-bandeja': { bandeja: true } })) {
    if (!queremos(clave)) continue;
    console.log('— ' + clave);
    for (const [nom, ang] of [['frente', 15], ['tres-cuartos', 50], ['perfil', 90]]) {
      await colocar(0, 12);
      await js(`(() => { const H = ${H}, m = window.__medio, L = window.__f.L, G = window.__f.G, T = H.T;
        L.pose = ${cfg.bandeja ? "'bandeja'" : 'null'}; G.pose = null; if (${cfg.bandeja}) { L.bandeja?.visible(true); L.bandeja?.vasos(3); }
        // a lo largo del camino hacia el final de la calle (hacia la cantina: -f), 9 metros
        for (const n of [L, G]) { const k = n === L ? -0.75 : 0.75, x = m.x - m.f.x * 9 + m.d.x * k, z = m.z - m.f.z * 9 + m.d.z * k; n.camino = [{ x, z, sinChoque: true, cerca: 0.3 }]; n.velocidad = ${cfg.bandeja ? 0.8 : 0.9}; n.miraFinal = Math.atan2(-m.f.x, -m.f.z); }
        return 1 })()`);
      // seguirlas con la cámara mientras caminan y sacar tres cuadros del paso
      let sacadas = 0;
      for (let i = 0; i < 160 && sacadas < 3; i++) {
        await js(`(() => { const L = window.__f.L; const a = L.g.rotation.y + (${ang}) * Math.PI / 180; const c = L.pos, H = ${H}, d = 2.7, y0 = H.T.altura(c.x, c.z);
          const ojo = { x: c.x + Math.sin(a) * d, z: c.z + Math.cos(a) * d }; const yaw = Math.atan2(-(c.x - ojo.x), -(c.z - ojo.z)), pitch = Math.atan2(-0.35, d);
          H.__camaraFija = { x: ojo.x, y: y0 + 1.3, z: ojo.z, yaw, pitch }; H.camara.fov = 38; H.camara.updateProjectionMatrix(); return 1 })()`);
        await cuadro(1); await esperar(30);
        if (i > 12 && i % 14 === 0) { await foto(`${clave}-${nom}-${sacadas + 1}`); sacadas++; }
      }
    }
  }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  salir(0);
});
