// Partida real 4.12.0 (Electron + WebGL), parte B: las piedras y el terreno.
//   1. el Relax en calidad media arma sin errores de consola ni de shader (cinco modelos de piedra y el terreno con variedad);
//   2. cinco bloques instanciados de piedras (uno por modelo) comparten el material; Baja trae uno solo;
//   3. de cada modelo, una piedra de verdad: parado a su lado el cartel dice «Picar piedra», se pica a golpes, da piedra y la instancia
//      desaparece de su malla (la recolección sigue andando con los cinco modelos);
//   4. una piedra grande de cada modelo con choque frena al jugador que camina hacia ella;
//   5. una vitrina con los cinco modelos en fila sobre el pasto (capturas de día y de tarde) y un recorrido por el valle (capturas);
//   6. dibujos por cuadro en dos lugares (con cuántos son de piedras);
//   7. guardar y recargar reparte los mismos modelos en los mismos lugares.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-12-0-rocas.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
// Las capturas quedan en HUMO_SALIDA (o pruebas/salidas/rocas-4-12).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'rocas-4-12'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();

const MODELOS = ['roca', 'roca1', 'roca2', 'roca3', 'roca4'];
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, J = H.jugador, P = H.progreso;
  const A = window.__A = {};
  const MODELOS = ['roca', 'roca1', 'roca2', 'roca3', 'roca4'];
  H.ajustes.limiteFps = 'libre';
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.cuadros = async (n = 3) => { for (let i = 0; i < n; i++) { H.__bucle(); await dormir(10); } return 1; };
  A.tecla = (code, tipo) => { document.dispatchEvent(new KeyboardEvent(tipo, { code, key: code, bubbles: true })); return 1; };
  A.bloques = () => { const g = H.escena.getObjectByName('sotobosque'); return g ? g.children.filter((o) => /^soto-roca/.test(o.name)).map((o) => ({ nombre: o.name, instanciada: !!o.isInstancedMesh, cuenta: o.count, visible: o.visible, tris: o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3, mat: o.material.uuid })) : []; };
  A.rocas = () => H.veg.matas.filter((m) => m.tipo === 'roca');
  A.firma = () => { let h = 0; for (const m of A.rocas()) { const s = m.ref.tipo + Math.round(m.x * 10) + ',' + Math.round(m.z * 10); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483647; } return h; };
  A.cuentaModelos = () => { const c = {}; for (const m of A.rocas()) c[m.ref.tipo] = (c[m.ref.tipo] || 0) + 1; return c; };
  // una piedra viva del modelo pedido, de las más cercanas al refugio (grande o chica)
  A.elegirRoca = (modelo, grande) => {
    const r = T.lugares.refugio;
    const l = A.rocas().filter((m) => m.ref.tipo === modelo && !m.sacado && (grande ? m.choque : !m.choque)).sort((a, b) => Math.hypot(a.x - r.x, a.z - r.z) - Math.hypot(b.x - r.x, b.z - r.z));
    return l[0] ? { x: l[0].x, z: l[0].z, esc: l[0].esc } : null;
  };
  A.junto = async (x, z, ang = 0.6, d = 1.6) => {
    const j = J.estado, px = x + Math.sin(ang) * d, pz = z + Math.cos(ang) * d;
    j.pos.set(px, T.altura(px, z) + 1.65, pz); j.vel.set(0, 0, 0); j.vy = 0;
    j.yaw = Math.atan2(-(x - px), -(z - pz)); j.pitch = -0.35;
    await A.cuadros(10);
    return Math.hypot(x - j.pos.x, z - j.pos.z);
  };
  A.viva = (x, z) => { const m = A.rocas().find((q) => Math.abs(q.x - x) < 1e-6 && Math.abs(q.z - z) < 1e-6); return !!m && !m.sacado; };
  A.matrizCero = (x, z) => { const m = A.rocas().find((q) => Math.abs(q.x - x) < 1e-6 && Math.abs(q.z - z) < 1e-6); if (!m) return null; const mm = m.ref.ch.porTipo[m.ref.tipo][0]; const e = mm.instanceMatrix.array, o = m.ref.i * 16; return e[o] === 0 && e[o + 5] === 0 && e[o + 10] === 0; };
  // la vitrina: los cinco modelos en fila sobre un llano del pasto, mirando de frente
  A.llano = () => {
    const r0 = T.lugares.refugio;
    for (let r = 30; r < 450; r += 4) for (let a = 0; a < 6.28; a += 0.1) {
      const x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
      if (Math.abs(x) > 430 || Math.abs(z) > 430 || T.agua(x, z)) continue;
      let ok = true;
      for (let dx = -8; dx <= 8 && ok; dx += 2) for (let dz = -3; dz <= 14 && ok; dz += 2) { const n = T.normal(x + dx, z + dz); if (n.y < 0.985 || T.agua(x + dx, z + dz)) ok = false; }
      if (ok && !H.veg.arboles.some((q) => !q.sacado && Math.hypot(q.x - x, q.z - z) < 20)) return { x, z };
    }
    return null;
  };
  A.vitrina = (c) => {
    const bs = H.escena.getObjectByName('sotobosque').children.filter((o) => /^soto-roca/.test(o.name));
    const IM = bs[0].constructor, M4 = bs[0].matrix.constructor;
    const visibles = [];
    MODELOS.forEach((nombre, i) => {
      const b = bs.find((o) => o.name === 'soto-' + nombre); if (!b) return;
      const im = new IM(b.geometry, b.material, 3);
      for (let k = 0; k < 3; k++) {
        const x = c.x + (i - 2) * 3.4 + (k - 1) * 0.0, z = c.z + k * 4.2, s = [1.0, 0.7, 1.3][k];
        const m = new M4().makeScale(s, s, s); m.setPosition(x, T.altura(x, z) - 0.05, z);
        im.setMatrixAt(k, m);
      }
      im.frustumCulled = false; im.matrixAutoUpdate = false; im.name = 'vitrina-' + nombre;
      H.escena.add(im); visibles.push(im);
    });
    A.vit = visibles;
    return visibles.length;
  };
  A.quitarVitrina = () => { for (const v of A.vit || []) H.escena.remove(v); A.vit = []; return 1; };
  A.mirar = async (x, z, mx, mz, alto = 0, horas = 11.5, n = 14) => {
    const j = J.estado, y = T.altura(x, z) + 1.65 + alto;
    const yaw = Math.atan2(-(mx - x), -(mz - z)), pitch = alto ? -Math.atan2(alto * 0.8, Math.hypot(mx - x, mz - z)) : -0.04;
    for (let i = 0; i < n; i++) { P.horas = horas; j.pos.set(x, y, z); j.yaw = yaw; j.pitch = pitch; j.vel && j.vel.set && j.vel.set(0, 0, 0); H.__bucle(); await dormir(12); }
    return 1;
  };
  // dibujos de un cuadro, por nombre (como diag-dibujo.cjs)
  A.dibujos = () => {
    const R = H.renderer, original = R.renderBufferDirect.bind(R), cuenta = {};
    const raizDe = (o) => { let x = o; while (x.parent && x.parent !== H.escena) x = x.parent; return x; };
    R.renderBufferDirect = function (cam, escena, geo, mat, obj, grupo) {
      const rz = raizDe(obj);
      const k = (cam.isOrthographicCamera ? 'sombra' : 'pantalla') + ' ' + (/^soto-roca/.test(obj.name) ? 'piedras' : rz.name || obj.type);
      cuenta[k] = (cuenta[k] || 0) + 1;
      return original(cam, escena, geo, mat, obj, grupo);
    };
    H.renderer.shadowMap.needsUpdate = true;
    H.__bucle();
    R.renderBufferDirect = original;
    const total = Object.values(cuenta).reduce((a, b) => a + b, 0);
    return { total, piedras: cuenta['pantalla piedras'] || 0, sombraPiedras: cuenta['sombra piedras'] || 0 };
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 300)); }
  });
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const A = (c) => js(`(async () => { const H = window.__hojarasca, A = window.__A; return (${c}); })()`);
  const url = path.join(raiz, 'index.html');
  const ajustes = (calidad) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, idioma:'es', estacion:'verano', limiteFps:'libre', modoFluido:false})); 1`;
  const abrir = async (calidad, conServicio = true) => {
    await w.loadFile(url, { search: '?debug=1' });
    if (conServicio) { await js(ajustes(calidad)); await w.loadFile(url, { search: '?debug=1' }); }
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await A('A.cuadros(30)');
  };
  const foto = async (nombre) => {
    await esperar(200);
    let img;
    try { img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO }); if (img.isEmpty()) throw new Error('vacía'); } catch {
      const dato = await js(`(() => { window.__hojarasca.__bucle(); return window.__hojarasca.renderer.domElement.toDataURL('image/png'); })()`);
      img = require('electron').nativeImage.createFromDataURL(dato);
    }
    fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
    console.log(`  (captura ${nombre}.png)`);
  };
  try {
    // ---- Baja primero: una sola piedra, un solo bloque (el costo de siempre)
    donde = 'baja';
    await abrir('baja'); await entrar();
    let b = await A('A.bloques()');
    ok(b.length === 1 && b[0].nombre === 'soto-roca', `Baja: un solo bloque de piedras (${b.map((x) => x.nombre).join(',')})`);
    ok(Object.keys(await A('A.cuentaModelos()')).join() === 'roca', 'Baja: todas las piedras son el peñasco de siempre');

    // ---- Media
    donde = 'media';
    await abrir('media'); await entrar();
    ok(await A('H.ajustes.calidad') === 'media', 'calidad media');
    b = await A('A.bloques()');
    ok(b.length === 5 && b.every((x) => x.instanciada), `cinco bloques instanciados de piedras (${b.map((x) => x.nombre + ':' + x.tris).join(' ')})`);
    ok(new Set(b.map((x) => x.mat)).size === 1, 'los cinco con el mismo material (ningún programa nuevo)');
    const reparto = await A('A.cuentaModelos()');
    ok(MODELOS.every((k) => (reparto[k] || 0) > 20), `los cinco modelos se reparten por el valle (${JSON.stringify(reparto)})`);
    const firma0 = await A('A.firma()');

    // ---- 3. recolección con cada modelo
    donde = 'recolección';
    await js(`(() => { const P = window.__hojarasca.progreso; P.cosas = { hacha: 1, pico: 1 }; P.materiales = {}; P.oficios.xp = { hachero: 100, picapedrero: 33 }; 1 })()`);
    for (const k of MODELOS) {
      const r = await A(`A.elegirRoca('${k}', false)`);
      ok(!!r, `hay una piedra suelta del modelo ${k}`);
      if (!r) continue;
      const d = await A(`A.junto(${r.x}, ${r.z})`);
      ok(d < 3.2, `${k}: parado a ${d.toFixed(1)} m de la piedra`);
      const cartel = await A('H.__textoHacha()');
      ok(/^Picar piedra/.test(cartel), `${k}: el cartel dice «${cartel}»`);
      if (k === 'roca2') await foto('mano-' + k);
      const antes = await A(`H.progreso.materiales.piedra || 0`);
      let n = 0;
      while (n < 14 && await A(`A.viva(${r.x}, ${r.z})`)) { await A('(H.usarHacha(), A.cuadros(1))'); n++; }
      const despues = await A(`H.progreso.materiales.piedra || 0`);
      ok(!(await A(`A.viva(${r.x}, ${r.z})`)) && despues > antes, `${k}: se picó en ${n} golpes y dio ${despues - antes} piedra(s)`);
      ok((await A(`A.matrizCero(${r.x}, ${r.z})`)) === true, `${k}: la instancia desaparece de su malla`);
    }

    // ---- 4. el choque de una piedra grande de cada modelo
    donde = 'choque';
    for (const k of MODELOS) {
      const r = await A(`A.elegirRoca('${k}', true)`);
      if (!r) { console.log(`  (no hay piedra grande con choque del modelo ${k} cerca: se salta)`); continue; }
      const d0 = await A(`A.junto(${r.x}, ${r.z}, 1.2, 3.2)`);
      await A('A.tecla("KeyW", "keydown")');
      for (let i = 0; i < 70; i++) { await A('(A.cuadros(1))'); await A(`(() => { const j = H.jugador.estado; j.yaw = Math.atan2(-(${r.x} - j.pos.x), -(${r.z} - j.pos.z)); return 1 })()`); }
      await A('A.tecla("KeyW", "keyup")');
      const d1 = await A(`(() => { const j = H.jugador.estado; return Math.hypot(${r.x} - j.pos.x, ${r.z} - j.pos.z) })()`);
      const radio = r.esc * 0.9;
      ok(d1 >= radio * 0.7 && d1 < d0, `${k}: la piedra grande (esc ${r.esc.toFixed(2)}, choque ${radio.toFixed(2)} m) frena: de ${d0.toFixed(1)} a ${d1.toFixed(2)} m del centro`);
    }

    // ---- 5. la vitrina y el valle
    donde = 'vitrina';
    const c = await A('A.llano()');
    ok(!!c, 'un llano de pasto para la vitrina');
    if (c) {
      ok((await A(`A.vitrina(${JSON.stringify(c)})`)) === 5, 'la vitrina arma los cinco modelos (tres tamaños cada uno)');
      await A(`A.mirar(${c.x} + 1, ${c.z} - 12, ${c.x}, ${c.z} + 4, 0.5, 11.5)`);
      await foto('vitrina-dia');
      await A(`A.mirar(${c.x} + 9, ${c.z} - 7, ${c.x}, ${c.z} + 3, 0.2, 16.5)`);
      await foto('vitrina-tarde');
      await A(`A.mirar(${c.x} - 2, ${c.z} - 6, ${c.x} - 1, ${c.z} + 1, 0.1, 11.5)`);
      await foto('vitrina-cerca');
      await A('A.quitarVitrina()');
    }
    donde = 'valle';
    const vistas = JSON.parse(fs.readFileSync(path.join(__dirname, 'vistas-4-12-0-rocas.json'), 'utf8'));
    for (const v of vistas) {
      await A(`A.mirar(${v.x}, ${v.z}, ${v.mira.x}, ${v.mira.z}, ${v.alto || 0}, ${v.horas || 11.5}, 30)`);
      await foto('valle-' + v.id);
    }

    // ---- 6. dibujos
    donde = 'dibujos';
    const lugares = [['rocas-cerca', vistas[0]], ['bosque', vistas[1]]];
    for (const [id, v] of lugares) {
      await A(`A.mirar(${v.x}, ${v.z}, ${v.mira.x}, ${v.mira.z}, 0, 11.5, 40)`);
      const d = await A('A.dibujos()');
      console.log(`  dibujos en «${id}»: ${d.total} en total, ${d.piedras} de piedras (${d.sombraPiedras} en sombras)`);
      ok(d.piedras <= 5, `en «${id}» las piedras son a lo sumo cinco dibujos (${d.piedras})`);
    }

    // ---- 7. guardar y recargar
    donde = 'recarga';
    await A('(H.guardar(), 1)'); await esperar(600);
    await abrir('media', false);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await A('A.cuadros(20)');
    ok((await A('A.firma()')) === firma0, 'al recargar, cada piedra sigue siendo del mismo modelo y en el mismo lugar');
    ok(consola.length === 0, `sin errores en la consola${consola.length ? ': ' + consola.slice(0, 3).join(' | ') : ''}`);
  } catch (err) {
    errores.push(`EXCEPCIÓN (${donde}): ${err && err.stack ? err.stack : err}`);
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n- ${errores.join('\n- ')}` : '\nOK 4.12.0 rocas y terreno, en el juego');
  try { w && !w.isDestroyed() && w.destroy(); } catch { /* ya cerrada */ }
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
