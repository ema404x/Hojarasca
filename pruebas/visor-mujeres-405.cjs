// 4.0.5: visor de cuerpo y ropa de las mujeres (Dalia, Lucrecia, Ceinwen) junto a una vecina normal: de frente, 3/4, perfil y espalda; quieta, caminando y bailando; con primeros planos de piernas, zapatos y escote.
//   uso: electron --no-sandbox -r al-monitor.cjs -r perfil-propio.cjs pruebas/visor-mujeres-405.cjs quien=aldea-bailarina nombre=Dalia salida=<carpeta> [estados=quieta,tango,...] [vistas=cuerpo-frente,...]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
// (los parámetros vienen por la línea de comandos o, para herramientas/lanzar-electron.ps1, que sólo pasa uno, por la variable VISOR_ARGS separados por «;»)
const ARGV = process.argv.concat((process.env.VISOR_ARGS || '').split(';').filter(Boolean));
const arg = (n, d) => { const a = ARGV.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
// (quien=<clave> nombre=<nombre>: otra persona del vestuario en el mismo lugar, p. ej. quien=aldea-bailarina nombre=Dalia)
const QUIEN = arg('quien', 'aldea-anfitriona'), NOMBRE = arg('nombre', 'Greta'), QUIETUD = arg('quietud', 'juntas');
const salida = arg('salida', path.join(raiz, 'pruebas', 'salidas', QUIEN.replace(/^aldea-/, '') + '-valle'));
const HORA = Number(arg('hora', '17.2')), CALIDAD = arg('calidad', 'alta');
const errores = [];
const anotarError = (tipo, e) => {
  const texto = `[visor-anfitriona] ${tipo}: ${e && e.stack ? e.stack : e}\n${errores.slice(-8).join('\n')}\n`;
  try { console.error(texto); fs.mkdirSync(salida, { recursive: true }); fs.appendFileSync(path.join(salida, 'errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
setTimeout(() => anotarError('tiempo', 'más de 8 minutos'), 8 * 60 * 1000).unref();
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const AYUDA = String.raw`(() => {
  const H = window.__hojarasca, M = H.__aldeaMundo(), T = H.T;
  const P = window.__proto = {};
  P.deAldea = () => (H.gente.gente || []).filter((n) => n.claveAldea);
  P.sol = () => { let s = null; H.escena.traverse((o) => { if (!s && o.isDirectionalLight && o.castShadow) s = o; });
    if (!s) H.escena.traverse((o) => { if (!s && o.isDirectionalLight) s = o; });
    s.updateMatrixWorld(); s.target.updateMatrixWorld();
    const dx = s.position.x - s.target.position.x, dy = s.position.y - s.target.position.y, dz = s.position.z - s.target.position.z;
    return { az: Math.atan2(dx, dz), alto: Math.atan2(dy, Math.hypot(dx, dz)) }; };
  P.parar = (n, x, z, r) => {
    n.deVisita = true; n.camino = null; n.ruta = null; n.pose = null; n.dormido = false; n.soloCerca = 0; n.espera = 0; n.vel = 0;
    n.pos.set(x, T.altura(x, z), z); n.rumbo = n.rumboObjetivo = r; n.g.rotation.y = r; n.miraFinal = r;
  };
  P.camara = (o, a, fov) => {
    const c = H.camara, js = H.jugador.estado;
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    js.yaw = yaw; js.pitch = pitch;
    c.position.set(o.x, o.y, o.z); c.rotation.order = 'YXZ'; c.rotation.set(pitch, yaw, 0);
    if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
    for (const k of c.children) k.visible = false;
  };
  P.despejado = (o, puntos) => {
    const rc = new H.THREE.Raycaster(), V = H.THREE.Vector3, gente = new Set((H.gente.gente || []).map((n) => n.g));
    const objetos = []; H.escena.traverse((x) => { if (x.isMesh && !x.isInstancedMesh && x.visible) { let q = x, de = false; while (q) { if (gente.has(q)) { de = true; break; } q = q.parent; } if (!de) objetos.push(x); } });
    for (const p of puntos) { const a = new V(o.x, o.y, o.z), b = new V(p.x, p.y, p.z), d = b.clone().sub(a); const L = d.length(); rc.set(a, d.normalize()); rc.far = L; if (rc.intersectObjects(objetos, false).some((h) => h.distance < L - 0.05)) return false; }
    return true;
  };
  P.hora = (h) => { H.progreso.horas = h; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0; };
  // un lugar despejado de la plaza, mirando con el sol de costado y adelante
  P.lugar = () => {
    if (P.centro) return P.centro;
    const s = P.sol(), r = s.az - 0.55;
    const fx0 = Math.sin(r), fz0 = Math.cos(r), lx0 = Math.cos(r), lz0 = -Math.sin(r);
    for (const lz of [41, 42.5, 39.5, 44, 38, 36.5, 35]) { for (const lx of [3, 4.5, 1.5, 7.5, 9, 10.5, 0, 12]) {
      const w = M.aMundo(lx, lz), y0 = T.altura(w.x, w.z);
      const puntos = [-0.9, 0, 0.8].flatMap((k) => [{ x: w.x + lx0 * k, z: w.z + lz0 * k, y: y0 + 0.9 }, { x: w.x + lx0 * k, z: w.z + lz0 * k, y: y0 + 1.5 }, { x: w.x + lx0 * k, z: w.z + lz0 * k, y: y0 + 0.2 }]);
      const o1 = { x: w.x + fx0 * 3, z: w.z + fz0 * 3, y: y0 + 0.95 }, o2 = { x: w.x + fx0 * 3.5 - lx0 * 0.4, z: w.z + fz0 * 3.5 - lz0 * 0.4, y: y0 + 1.65 };
      if (Math.abs(T.altura(o1.x, o1.z) - y0) < 0.4 && P.despejado(o1, puntos) && P.despejado(o2, puntos)) { P.centro = { lx, lz, r }; return P.centro; }
    } }
    P.centro = { lx: 2.2, lz: 39.5, r }; return P.centro;
  };
  // 4.0.5: a qué altura del piso quedan los puntos más bajos de cada pie (esqueleto de verdad, vértices de los pies en el modelo de reposo)
  P.pies = (n) => { try { let sk = null; n.g.traverse((o) => { if (o.isSkinnedMesh && !sk) sk = o; }); sk.skeleton.update(); const g = sk.geometry, PO = g.attributes.position, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight, Mx = sk.skeleton.boneMatrices;
    const r = { izq: 9, der: 9, izqPunta: 9, izqTaco: 9, derPunta: 9, derTaco: 9 }; for (let i = 0; i < PO.count; i++) { const x = PO.getX(i), y = PO.getY(i), z = PO.getZ(i); if (y > 0.2) continue; let Y = 0; for (let q = 0; q < 4; q++) { const w = SW.getComponent(i, q); if (w <= 0) continue; const o = SI.getComponent(i, q) * 16; Y += w * (Mx[o + 1] * x + Mx[o + 5] * y + Mx[o + 9] * z + Mx[o + 13]); } const k = x < 0 ? 'izq' : 'der'; r[k] = Math.min(r[k], Y); if (z > 0.09) r[k + 'Punta'] = Math.min(r[k + 'Punta'], Y); if (z < 0) r[k + 'Taco'] = Math.min(r[k + 'Taco'], Y); }
    const base = n.g.position.y + 0, s = n.g.scale.y, suelo = H.T.altura(n.pos.x, n.pos.z); const f = (v) => +((base + s * v) - suelo).toFixed(3); return { izq: f(r.izq), der: f(r.der), izqPunta: f(r.izqPunta), izqTaco: f(r.izqTaco), derPunta: f(r.derPunta), derTaco: f(r.derTaco) }; } catch (e) { return String(e.stack || e); } };
  return 1;
})()`;


// las vistas: ángulo alrededor de ella (0 de frente, 40 tres cuartos, 90 perfil, 180 espalda), distancia, altura de la cámara, a qué altura mira y lente
const V = (a, d, alto, mira, fov) => ({ a, d, alto, mira, fov });
const VISTAS = {
  'cuerpo-frente': V(0, 2.9, 1.1, 0.85, 38), 'cuerpo-3c': V(40, 2.9, 1.1, 0.85, 38), 'cuerpo-perfil': V(90, 2.9, 1.1, 0.85, 38), 'cuerpo-espalda': V(180, 2.9, 1.1, 0.85, 38),
  'piernas-frente': V(0, 1.7, 0.7, 0.5, 36), 'piernas-3c': V(40, 1.7, 0.7, 0.5, 36), 'piernas-perfil': V(90, 1.7, 0.7, 0.5, 36), 'piernas-espalda': V(180, 1.7, 0.7, 0.5, 36),
  'zapatos-3c': V(35, 1.1, 0.4, 0.1, 34), 'zapatos-perfil': V(90, 1.0, 0.25, 0.1, 34), 'zapatos-frente': V(10, 1.1, 0.35, 0.1, 34),
  'escote-frente': V(0, 0.9, 1.38, 1.3, 30), 'escote-3c': V(35, 0.9, 1.38, 1.3, 30), 'escote-cerca': V(0, 0.6, 1.38, 1.31, 24),
};
// los estados: pose, gesto y fases de baile/paso a fotografiar. `camina` = pasos clavados en el lugar (tiempo del paso congelado).
const ESTADOS = {
  quieta: { pose: null, quietud: QUIETUD, gesto: 'sonrisa', fases: [null] },
  tango: { pose: 'tango', gesto: 'sonrisa', fases: [0.827, 2.48] },
  chamame: { pose: 'chamame', gesto: 'sonrisa', fases: [0.54, 1.62] },
  'chamame-solo': { pose: 'chamame-solo', gesto: 'sonrisa', fases: [0.507, 1.52] },
  camina: { pose: null, camina: true, quietud: QUIETUD, gesto: null, fases: [1.57, 4.71] },
};
const lista = (n, d) => arg(n, d).split(',').filter(Boolean);
const ESTADOS_PEDIDOS = lista('estados', 'quieta,tango,chamame,chamame-solo,camina');
const VISTAS_PEDIDAS = lista('vistas', Object.keys(VISTAS).join(','));
const VECINA = arg('vecina', 'aldea-maestra');

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: arg('ver', '0') === '1', width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${CALIDAD}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.gente').catch(() => false)) break; }
  if (!(await js('!!window.__hojarasca && !!window.__hojarasca.gente').catch(() => false))) { console.log('no cargó:\n' + errores.join('\n')); app.exit(1); return; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  await js(`window.__hojarasca.__aldeaMundo().listo().then(() => 1)`);
  await js(AYUDA);
  await js(`(() => { const H = window.__hojarasca, a = H.progreso.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
    a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); return 1 })()`);
  await js(`(() => { const H = window.__hojarasca, M = H.__aldeaMundo(), js = H.jugador.estado, p = M.aMundo(-2, 33);
    js.pos.set(p.x, H.T.altura(p.x, p.z), p.z); js.vel.set(0, 0, 0); window.__proto.hora(${HORA}); return 1 })()`);
  await js(`(async () => { const M = window.__hojarasca.__aldeaMundo(); M.actualizar(4, window.__hojarasca.camara.position); await M.listo(); M.montarCola(); return 1 })()`);
  let cuantos = 0;
  for (let i = 0; i < 80; i++) { await esperar(500); cuantos = await js(`(() => { window.__proto.hora(${HORA}); return window.__proto.deAldea().length })()`); if (cuantos >= 8) break; }
  console.log('gente de la aldea', cuantos);
  await js(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F4', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'F4', bubbles: true })); return 1 })()`);
  await esperar(500);
  console.log('lugar', await js(`(() => { const H = window.__hojarasca, P = window.__proto, M = H.__aldeaMundo(); const c = P.lugar(), w = M.aMundo(c.lx, c.lz);
    P.greta = H.gente.agregarPoblador({ clave: '${QUIEN}', colores: {}, pos: { x: w.x, z: w.z }, nombre: '${NOMBRE}', oficio: '', saludo: '', despedida: '', camino: [] });
    P.vecina = H.gente.agregarPoblador({ clave: '${VECINA}', colores: {}, pos: { x: w.x, z: w.z }, nombre: 'Vecina', oficio: '', saludo: '', despedida: '', camino: [] });
    return JSON.stringify(c) })()`));
  // deja a las dos en su lugar; la vecina al costado, perpendicular a la línea de la cámara (así nunca tapa ni se tapa)
  const montar = (e, v) => `(() => { const H = window.__hojarasca, P = window.__proto, M = H.__aldeaMundo(), T = H.T, o = ${JSON.stringify(e)}, v = ${JSON.stringify(v)};
    P.hora(${HORA});
    clearInterval(P.ancla);
    const c0 = P.lugar(), c = M.aMundo(c0.lx, c0.lz), r = c0.r;
    const y0 = T.altura(c.x, c.z);
    const ang = r + v.a * Math.PI / 180, ux = Math.sin(ang), uz = Math.cos(ang), px = Math.cos(ang), pz = -Math.sin(ang);
    const lado = 0.95;
    P.parar(P.greta, c.x, c.z, r);
    P.greta.pose = o.pose || null; P.greta.__gesto = o.gesto; P.greta.__quietud = o.quietud; P.greta.dormido = false;
    const vx = c.x + px * lado, vz = c.z + pz * lado;
    P.parar(P.vecina, vx, vz, r); P.vecina.pose = null; P.vecina.dormido = false;
    for (const n of P.deAldea()) if (n !== P.greta && n !== P.vecina) n.dormido = true;
    if (o.camina) {
      P.greta.camino = [{ x: c.x + Math.sin(r) * 80, z: c.z + Math.cos(r) * 80, sinChoque: true, cerca: 0.3 }]; P.greta.velocidad = 0.9; P.greta.deVisita = false;
      P.greta.enCita = true; P.greta.conVos = true; P.greta.sinFrenar = true;
      P.vecina.camino = [{ x: vx + Math.sin(r) * 80, z: vz + Math.cos(r) * 80, sinChoque: true, cerca: 0.3 }]; P.vecina.velocidad = 0.9; P.vecina.enCita = true; P.vecina.conVos = true; P.vecina.sinFrenar = true;
      P.ancla = setInterval(() => { P.greta.pos.set(c.x, T.altura(c.x, c.z), c.z); P.vecina.pos.set(vx, T.altura(vx, vz), vz); if (P.congelarPaso !== undefined) { P.greta.paso = P.congelarPaso; P.vecina.paso = P.congelarPaso; } }, 4);
    } else {
      P.ancla = setInterval(() => { if (P.congelarFase !== undefined) P.greta.g.fase = P.congelarFase; }, 4);
    }
    const m = v.fov >= 36 ? 0.5 : 0;   // (los primeros planos miran sólo a ella, sin correr la cámara hacia la vecina)
    const cam = { x: c.x + ux * v.d + px * lado * m, z: c.z + uz * v.d + pz * lado * m, y: y0 + v.alto };
    P.camara(cam, { x: c.x + px * lado * m, z: c.z + pz * lado * m, y: y0 + v.mira }, v.fov);
    return 1 })()`;
  // (combos=estado:vista,estado:vista...: sólo esas tomas, en una sola ventana)
  const pares = arg('combos', '') ? arg('combos', '').split(',').map((x) => x.split(':')) : ESTADOS_PEDIDOS.flatMap((en) => VISTAS_PEDIDAS.filter((vn) => !(/^(escote|zapatos)/.test(vn) && !['quieta', 'camina'].includes(en)) && !(/^escote/.test(vn) && en === 'camina')).map((vn) => [en, vn]));
  for (const [en, vn] of pares) {
    const e = ESTADOS[en], v = VISTAS[vn]; if (!e || !v) continue;
    for (const [i, fa] of e.fases.entries()) {
      await js(`(() => { window.__proto.congelarFase = undefined; window.__proto.congelarPaso = undefined; return 1 })()`);
      await js(montar(e, v)); await esperar(1200); await js(montar(e, v)); await esperar(400);
      if (fa !== null) await js(`(() => { window.__proto.${e.camina ? 'congelarPaso' : 'congelarFase'} = ${fa}; return 1 })()`);
      await esperar(350);
      const img = await w.webContents.capturePage();
      const nom = `${en}-${vn}${fa === null ? '' : '-' + (i + 1)}`;
      fs.writeFileSync(path.join(salida, nom + '.png'), img.toPNG());
      console.log('foto', nom, 'pies', JSON.stringify(await js('window.__proto.pies(window.__proto.greta)')), 'vecina', JSON.stringify(await js('window.__proto.pies(window.__proto.vecina)')));
    }
  }
  await js(`(() => { clearInterval(window.__proto.ancla); return 1 })()`);
  if (errores.length) console.log('consola:\n' + [...new Set(errores)].slice(0, 12).join('\n'));
  console.log('listo', salida);
  app.exit(0);
});
