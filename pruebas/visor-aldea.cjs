// 3.6: visor de la arquitectura de la Aldea de los Duendes. Abre el juego (?debug=1, perfil propio),
// le inyecta src/aldea-arquitectura.js tal cual (con el three y los módulos que ya trae el juego),
// arma los edificios en fila sobre un piso parejo donde va la aldea y saca fotos de día, de noche y
// de adentro. Las fotos quedan en pruebas/salidas/aldea/ (no van al repositorio).
//
// Uso (después de `node armar.mjs`):
//   npx electron --no-sandbox -r herramientas/al-monitor.cjs pruebas/visor-aldea.cjs [toma,toma,...]
// Tomas: ver TOMAS abajo (sin argumento, todas).
const { app, BrowserWindow, dialog } = require('electron');
// nunca un cartel en la pantalla del usuario: el error va a la consola y a un archivo, y se cierra
const fsG = require('fs');
const anotarError = (tipo, e) => {
  const texto = `[visor-aldea] ${tipo}: ${e && e.stack ? e.stack : e}
`;
  try { console.error(texto); fsG.appendFileSync(require('path').join(__dirname, 'salidas', 'aldea-errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
const path = require('path');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
const perfil = path.join(raiz, 'pruebas', 'salidas', 'aldea', '_perfil');
try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* que quede */ }
app.setPath('userData', perfil);
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const salida = path.join(raiz, 'pruebas', 'salidas', 'aldea');

// el módulo, pasado a un script común: los imports se toman de lo que el juego ya armó
function moduloAldea() {
  let t = fs.readFileSync(path.join(raiz, 'src', 'aldea-arquitectura.js'), 'utf8');
  const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"]\.\/(.+?)\.js['"]\s*;\s*$/gm, (_x, n, m) => `const { ${n.trim()} } = __mod_${m.replace(/[^A-Za-z0-9_$]/g, '_')};`);
  t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `window.__A = (() => {\n${t}\nreturn { ${ex.join(', ')} };\n})();`;
}

// lo que corre en la página: piso, armado de edificios, cámara, hora
const AYUDA = `
window.__V = (() => {
  const H = window.__hojarasca, A = window.__A, T = H.T, est = H.est, js = H.jugador.estado;
  // cerca de la parada del sur (40,3; −339,1), pero no encima: el lugar más parejo alrededor
  let B = null, Y0 = 0, mejor = Infinity;
  for (const [ox, oz] of [[0, 70], [0, -70], [70, 0], [-70, 0], [55, 55], [-55, 55], [55, -55], [-55, -55], [0, 110], [110, 0], [-110, 0]]) {
    const c = { x: 40.3 + ox, z: -339.1 + oz };
    let lo = Infinity, hi = -Infinity, seco = true;
    for (let dx = -45; dx <= 45; dx += 5) for (let dz = -45; dz <= 45; dz += 5) { const h = T.altura(c.x + dx, c.z + dz); lo = Math.min(lo, h); hi = Math.max(hi, h); if (T.agua && T.agua(c.x + dx, c.z + dz)) seco = false; }
    if (seco && hi - lo < mejor) { mejor = hi - lo; B = c; Y0 = hi; }
  }
  if (!B) { B = { x: 40.3, z: -339.1 + 70 }; Y0 = T.altura(B.x, B.z); }
  Y0 += 0.05;
  const grupo = new THREE.Group(); H.escena.add(grupo);
  const vidrio = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: 0x23201b });
  const atlas = A.crearTexturaCarteles();
  const mats = { estructura: est.mat, follaje: est.mat, vidrio, carteles: new THREE.MeshLambertMaterial({ map: atlas }) };
  // sin piso propio: el terreno pintado del juego; sólo se despeja el bosque
  for (let x = -75; x <= 75; x += 10) for (let z = -75; z <= 75; z += 10) H.veg.despejar(B.x + x, B.z + z, 9);
  let Yref = Y0;
  // lo que hará el mundo con pisos y ocupa (marcarPisos): ahí no salen pasto ni helechos
  const texE = __mod_materiales.U.uEstepa.value;
  let marcas = [];
  // (marcarPisos del juego rehace el canal cuando cambian las plataformas: se vuelve a marcar antes de cada foto)
  function remarcar() { for (const m of marcas) marcar(...m, true); }
  function marcar(x0, x1, z0, z1, v, otra) {
    if (!otra) { if (v) marcas.push([x0, x1, z0, z1, v]); else marcas = []; }
    if (!texE?.image?.data) return;
    const d = texE.image.data, n = texE.image.width;
    for (let j = Math.max(0, Math.floor((z0 + 512) / 2)); j <= Math.min(n - 1, Math.ceil((z1 + 512) / 2)); j++)
      for (let i = Math.max(0, Math.floor((x0 + 512) / 2)); i <= Math.min(n - 1, Math.ceil((x1 + 512) / 2)); i++) d[(j * n + i) * 4 + 2] = v;
    texE.needsUpdate = true;
  }
  let puertas = [];
  function limpiar() {
    for (const o of [...grupo.children]) { grupo.remove(o); o.traverse((k) => { if (k.geometry) k.geometry.dispose(); }); }
    H.col.eliminarPorDuenio('visor');
    marcar(B.x - 80, B.x + 80, B.z - 80, B.z + 80, 0);
    H.puertas.eliminarPorDuenio('visor');
    puertas = [];
  }
  // lista: [{ id, etapa, x, z, rot, op, interior }] relativo a B
  function poner(lista) {
    limpiar();
    const res = [];
    for (const it of lista) {
      const ed = it.acc ? A.armarAccesorio(it.acc, it.op || {}) : A.armarEdificio(it.id, it.etapa ?? 4, it.op || {});
      // apoyado en el terreno real: el punto más alto de su planta (la plaza, el promedio)
      const o = ed.ocupa; let hi = -1e9, suma = 0, n = 0;
      for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) { const h = T.altura(B.x + it.x + o.x0 + (o.x1 - o.x0) * a / 12, B.z + it.z + o.z0 + (o.z1 - o.z0) * b / 12); hi = Math.max(hi, h); suma += h; n++; }
      const y = it.acc ? suma / n : it.id === 'plaza' ? hi + 0.15 : hi - 0.04;
      const sitio = { x: B.x + it.x, y, z: B.z + it.z, rot: it.rot || 0 };
      if (!res.length) Yref = y;
      { const c = Math.cos(sitio.rot), s = Math.sin(sitio.rot); const xs = [o.x0, o.x1], zs = [o.z0, o.z1]; let a = 1e9, b = -1e9, e = 1e9, g = -1e9; for (const lx of xs) for (const lz of zs) { const X = sitio.x + lx * c + lz * s, Z = sitio.z - lx * s + lz * c; a = Math.min(a, X); b = Math.max(b, X); e = Math.min(e, Z); g = Math.max(g, Z); } if (!it.acc) marcar(a - 0.6, b + 0.6, e - 0.6, g + 0.6, 255); }
      const m = A.montarEdificio(ed, mats);
      const g = new THREE.Group(); g.position.set(sitio.x, sitio.y, sitio.z); g.rotation.y = sitio.rot;
      g.add(m.exterior); if (it.interior !== false) g.add(m.interior);
      grupo.add(g);
      const r = A.registrarEnMundo({ col: H.col, puertas: it.abierta || it.acc ? null : H.puertas }, ed, sitio, { duenio: 'visor' });
      puertas.push(...r.puertas);
      res.push({ id: it.id || it.acc, tri: ed.medidas.triangulos, luces: ed.luces.length });
      if (res.length === 1) spec = ed.luces.filter((l) => l.cuarto !== 'calle' && l.cuarto !== 'afuera').map((l) => ({ ...l, w: A.aMundoAldea(sitio, l.lx, l.ly, l.lz) }));
    }
    return res;
  }
  const luces = [];
  function camara(x, y, z, tx, ty, tz) {
    const yaw = Math.atan2(-(tx - x), -(tz - z)), pitch = Math.atan2(ty - y, Math.hypot(tx - x, tz - z));
    // el jugador parado sobre una tarima invisible a la altura pedida (y = ojos)
    H.col.agregarPlataforma({ x: B.x + x, z: B.z + z, ang: 0, largo: 0.6, ancho: 0.6, alto: Yref + y - 1.65, espesor: 0.05, duenio: 'visor', sinTecho: true });
    js.pos.set(B.x + x, Yref + y - 1.65, B.z + z); js.vel.set(0, 0, 0); js.vy = 0;
    js.yaw = yaw; js.pitch = pitch; js.zoom = false;
    // (si la ventana pierde el foco el juego se pausa y la cámara deja de seguir al jugador: se la pone a mano)
    const c = H.camara; c.position.set(B.x + x, Yref + y, B.z + z); c.rotation.order = 'YXZ'; c.rotation.set(pitch, yaw, 0);
    if (c.fov !== 70) { c.fov = 70; c.updateProjectionMatrix(); }
  }
  function hora(h, noche) {
    H.progreso.horas = h; H.clima.estado.nublado = 0;
    const f = noche ? 1 : 0;
    vidrio.color.setRGB(0.07 + f * 1.4, 0.07 + f * 0.75, 0.08 + f * 0.25);
  }
  let spec = [];
  // las luces del edificio según su spec (como hará el mundo con el pool de 4): las más cercanas a la cámara
  function lucesSpec() {
    const c = H.camara.position;
    for (const l of spec.slice().sort((a, b) => Math.hypot(a.w.x - c.x, a.w.z - c.z) - Math.hypot(b.w.x - c.x, b.w.z - c.z)).slice(0, 4)) {
      const p = new THREE.PointLight(l.color, l.intensidad * 1.8, l.radio, 1.6); p.position.set(l.w.x, l.w.y, l.w.z); H.escena.add(p); luces.push(p);
    }
  }
  function luzEn(x, y, z, color = 0xffb070, i = 2.2, d = 9) {
    const l = new THREE.PointLight(color, i, d, 1.6); l.position.set(B.x + x, Yref + y, B.z + z); H.escena.add(l); luces.push(l);
  }
  function sinLuces() { for (const l of luces) H.escena.remove(l); luces.length = 0; }
  return { poner, camara, hora, luzEn, lucesSpec, sinLuces, remarcar, Y0, B };
})(); 1`;

// Tomas: qué se arma, de dónde se mira (x, y de los ojos, z, yaw, pitch) y a qué hora.
const casas = [
  { id: 'casa-jefe', x: -14, z: 0 }, { id: 'casa-ercilia', x: -7, z: 0 }, { id: 'casa-nelida', x: -0.5, z: 0 }, { id: 'casa-abuela', x: 6.5, z: 0 }, { id: 'casa-familia', x: 14.5, z: 0 },
];
const locales1 = [{ id: 'panaderia', x: -16, z: 0 }, { id: 'herreria', x: -7, z: 0 }, { id: 'carpinteria', x: 3, z: 0 }, { id: 'pescaderia', x: 12.5, z: 0 }];
const locales2 = [{ id: 'puesto-sanitario', x: -21, z: 0 }, { id: 'estafeta', x: -13, z: 0 }, { id: 'hilanderia', x: -5, z: 0 }, { id: 'sala-miel', x: 4, z: 0 }, { id: 'seccional', x: 13, z: 0 }];
const etapas = [0, 1, 2, 3, 4].map((e, i) => ({ id: 'panaderia', etapa: e, x: -24 + i * 11, z: 0 }));
const TOMAS = {
  plaza: { arma: [{ id: 'plaza', x: 0, z: 0 }], ojo: [4, 7.5, 12.5], a: [0, 0, 0.5], hora: 18.6 },
  'plaza-baja': { arma: [{ id: 'plaza', x: 0, z: 0 }], ojo: [3.2, 1.7, 6.2], a: [0, 2.3, 0], hora: 18.8 },
  biblioteca: { arma: [{ id: 'biblioteca', x: 0, z: 0 }, { id: 'escuela', x: 11, z: 0 }], ojo: [-6, 2.0, 15], a: [3, 2.0, 3], hora: 10 },
  casas: { arma: casas, ojo: [-19, 2.0, 9.5], a: [-6, 1.8, 3.5], hora: 9 },
  'casas-frente': { arma: casas, ojo: [-2.5, 4.0, 17], a: [-2.5, 1.5, 0], hora: 11 },
  locales: { arma: locales1, ojo: [-21, 2.0, 11], a: [-8, 2.0, 3.5], hora: 11 },
  'locales-2': { arma: locales2, ojo: [-27, 2.0, 11], a: [-13, 2.0, 3.5], hora: 15 },
  'locales-noche': { arma: locales1, ojo: [-21, 2.0, 11], a: [-8, 2.0, 3.5], hora: 22, noche: true },
  'casas-noche': { arma: casas, ojo: [-19, 2.0, 9.5], a: [-6, 1.8, 3.5], hora: 22, noche: true },
  salon: { arma: [{ id: 'salon', x: 0, z: 0 }, { id: 'escuela', x: -13, z: 0, etapa: 3 }], ojo: [6, 2.0, 14], a: [-5, 2.2, 2], hora: 12 },
  etapas: { arma: etapas, ojo: [-31, 3.5, 13], a: [-10, 1.5, 0], hora: 12 },
  'etapas-frente': { arma: etapas, ojo: [-2, 7, 21], a: [-2, 0.5, 0], hora: 12 },
  'adentro-panaderia': { arma: [{ id: 'panaderia', x: 0, z: 0, abierta: true }], ojo: [-1.3, 1.95, 2.2], a: [1.5, 1.2, -0.5], hora: 11, luz: 'spec' },
  'adentro-escuela': { arma: [{ id: 'escuela', x: 0, z: 0, abierta: true }], ojo: [4.3, 1.95, 2.9], a: [-4.8, 1.3, 1.0], hora: 11, luz: 'spec' },
  'adentro-biblioteca': { arma: [{ id: 'biblioteca', x: 0, z: 0, abierta: true }], ojo: [-0.6, 1.95, 4.6], a: [0.8, 1.2, -4], hora: 11, luz: 'spec' },
  'adentro-herreria': { arma: [{ id: 'herreria', x: 0, z: 0 }], ojo: [1.2, 1.95, 4.3], a: [-2.5, 1.0, 0.2], hora: 17, luz: 'spec' },
  'adentro-casa': { arma: [{ id: 'casa-abuela', x: 0, z: 0, abierta: true }], ojo: [1.2, 1.9, 2.0], a: [-2.2, 1.0, 0.6], hora: 20.5, noche: true, luz: 'spec' },
  sillon: { arma: [{ id: 'biblioteca', x: 0, z: 0, abierta: true }], ojo: [-0.4, 1.75, 1.6], a: [1.9, 0.9, 4.0], hora: 18, luz: 'spec' },
  'duende-cerca': { arma: [{ id: 'plaza', x: 0, z: 0 }], ojo: [1.3, 1.75, 4.6], a: [0, 2.6, 0], hora: 17.5 },
  alamos: { arma: [{ acc: 'alamo', x: -6, z: -4, op: { semilla: 1 } }, { acc: 'alamo', x: 0, z: -5, op: { semilla: 2 } }, { acc: 'alamo', x: 6, z: -4, op: { semilla: 3 } },
    { acc: 'pirca', x: -3, z: 2, op: { largo: 6 } }, { acc: 'cerco', x: 4, z: 2, op: { largo: 5, tipo: 'pique' } }, { acc: 'faroles', x: 0, z: 3 }, { acc: 'banco', x: 1.5, z: 3.2, rot: Math.PI },
    { acc: 'lena', x: -6, z: 4 }, { acc: 'tendedero', x: 7, z: 5 }, { acc: 'poste-luz', x: 10, z: 2 }, { acc: 'vereda', x: 0, z: 6, op: { largo: 10 } }, { acc: 'mastil', x: -10, z: 2 }],
  ojo: [0, 2.0, 17], a: [0, 4, 0], hora: 17 },
};

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const pedidas = (process.argv.find((a) => /^[a-z0-9-]+(,[a-z0-9-]+)*$/.test(a) && a.split(',').every((t) => TOMAS[t])) || Object.keys(TOMAS).join(',')).split(',');
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  // hasta que la cámara siga al jugador (termina la entrada)
  for (let i = 0; i < 90; i++) {
    await esperar(1000);
    const ok = await js(`(() => { const H = window.__hojarasca, p = H.jugador.estado.pos, c = H.camara.position; return Math.hypot(p.x - c.x, p.z - c.z) < 2; })()`).catch(() => false);
    if (ok) break;
    if (i % 10 === 9) await js(`document.getElementById('btn-entrar')?.click(); 1`).catch(() => 0);
  }
  await esperar(2000);
  await js(moduloAldea() + '\n1');
  await js(AYUDA);
  // sin carteles del juego encima de la foto
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  const informe = [];
  for (const nombre of pedidas) {
    const t = TOMAS[nombre];
    const res = await js(`JSON.stringify(window.__V.poner(${JSON.stringify(t.arma)}))`);
    await js(`(() => { const V = window.__V; V.sinLuces(); ${t.luz === 'spec' ? 'V.lucesSpec();' : (t.luz || []).map((l) => `V.luzEn(${l.join(',')});`).join(' ')} V.hora(${t.hora}, ${!!t.noche}); V.camara(${t.ojo.join(',')}, ${t.a.join(',')}); return 1; })()`);
    await esperar(3500);
    await js(`(() => { const V = window.__V; V.hora(${t.hora}, ${!!t.noche}); V.camara(${t.ojo.join(',')}, ${t.a.join(',')}); V.remarcar(); return 1; })()`);
    await esperar(2500);
    await js(`(() => { for (const k of window.__hojarasca.camara.children) k.traverse((o) => o.layers.set(31)); return 1; })()`);
    await esperar(300);
    const img = await w.webContents.capturePage();
    await js(`(() => { for (const k of window.__hojarasca.camara.children) k.traverse((o) => o.layers.set(0)); return 1; })()`);
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    const info = await js(`JSON.stringify({ dibujos: window.__hojarasca.renderer.info.render.calls, tri: window.__hojarasca.renderer.info.render.triangles })`);
    const donde = await js(`JSON.stringify({ B: window.__V.B, Y0: window.__V.Y0, pos: window.__hojarasca.jugador.estado.pos, cam: window.__hojarasca.camara.position, pausa: document.pointerLockElement === null, grupo: window.__hojarasca.escena.children.length, tex: (() => { const x = __mod_materiales.U.uEstepa.value; const d = x?.image?.data; if (!d) return 'sin'; const B = window.__V.B; const i = Math.floor((B.x + 512) / 2), j = Math.floor((B.z + 512) / 2); return [x.image.width, d.length, d[(j * x.image.width + i) * 4 + 2]]; })() })`);
    informe.push(`${nombre}: ${res} ${info} ${donde}`);
    console.log(donde);
    console.log('foto', nombre, info);
  }
  fs.writeFileSync(path.join(salida, 'informe.txt'), informe.join('\n'));
  console.log('listo:', salida);
  app.exit(0);
});
