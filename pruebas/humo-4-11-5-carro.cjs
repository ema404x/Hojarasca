// Partida real 4.11.5 (Electron + WebGL): el carro del caballo.
//   1. se construye la carpintería; sin tablas, troncos y plata el banco dice qué falta y no gasta nada;
//   2. con lo justo, la E del banco hace el carro: descuenta 14 tablas, 4 troncos y $6.000, lo engancha, avisa;
//   3. a pie no suma; montado suma 16 casillas (40) y 28 con las alforjas (52); el desglose de la mochila lo dice;
//   4. el carro se ve detrás del caballo, lo sigue al trote y en una pendiente sin atravesar el suelo, y las ruedas giran;
//   5. «Personalizar → Tu caballo»: desenganchar (el carro desaparece y las casillas vuelven a 24: con 30 casillas encima queda
//      sobrecarga, no se pierde nada y no se recoge más) y volver a enganchar;
//   6. bajarse con el carro enganchado: a pie, 24;
//   7. el guardado: recargar deja el carro; una partida de antes (sin los campos) abre sin carro; una de versión más nueva se lee y no se pisa.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`), siempre en el monitor externo:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-11-5-carro.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
// Las capturas quedan en HUMO_SALIDA (o pruebas/salidas/carro).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'carro'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, O = H.obras, T = H.T, J = H.jugador, P = H.progreso;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); return 1; };
  A.cuadros = async (n = 3) => { for (let i = 0; i < n; i++) { H.__bucle(); await dormir(12); } return 1; };
  A.plata = (n) => { P.economia.pesos = n; return P.economia.pesos; };
  A.materiales = (m) => { Object.assign(P.materiales, m); return 1; };
  A.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent.replace(/\s+/g, ' ').trim());
  A.limpiarNotas = () => { document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); return 1; };
  A.ocupados = [];
  const pend = (x, z) => Math.acos(Math.max(-1, Math.min(1, T.normal(x, z).y)));
  A.sitio = (id, lejos = 14) => {
    const pl = H.PLANOS.find((p) => p.id === id), r0 = T.lugares.refugio;
    for (let r = 26; r < 260; r += 3.1) {
      const k = Math.max(8, Math.round(2 * Math.PI * r / 3.1));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + r * 0.37, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 470 || Math.abs(z) > 470) continue;
        if (pend(x, z - 2.4) > 0.05 || pend(x, z) > 0.07 || pend(x, z - 1) > 0.05 || pend(x, z - 4) > 0.06) continue;
        if (A.ocupados.some((q) => Math.hypot(q.x - x, q.z - z) < lejos)) continue;
        if (O.revisarSitio(x, z - 2.4, pl, 0).ok) return { x, z };
      }
    }
    return null;
  };
  A.parar = (s) => { J.ubicar(s.x, s.z, 0); for (let i = 0; i < 12; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  A.menuAbierto = () => !document.getElementById('obra').classList.contains('oculto');
  const clic = (el) => el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  A.elegir = (nombre) => {
    if (!A.menuAbierto()) A.tecla('KeyO');
    for (const cat of document.querySelectorAll('#obra-categorias button')) {
      clic(cat);
      for (let pag = 0; pag < 16; pag++) {
        const b = [...document.querySelectorAll('#obra-planos button')].find((x) => new RegExp('^\\d+\\. ' + nombre.replace(/[.*+?^$()]/g, '\\$&')).test(x.textContent));
        if (b) { clic(b); return true; }
        const sig = [...document.querySelectorAll('#obra-planos button')].find((x) => x.textContent === '›');
        if (!sig) break;
        clic(sig);
      }
    }
    return false;
  };
  A.obra = (id) => O.obras.find((q) => q.plano.id === id);
  A.alLado = (id) => { const o = A.obra(id), r = o.datos.rot || 0; J.ubicar(o.datos.x - 0.9 * Math.sin(r), o.datos.z - 0.9 * Math.cos(r), r + Math.PI); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  A.aviso = (id) => H.__avisoObraQueTrabaja(A.obra(id));
  // un claro llano, sin árboles ni agua en 14 m a la redonda, cerca del refugio, para pasear al caballo (mira hacia +x)
  A.llano = () => {
    const r0 = T.lugares.refugio, arboles = H.veg.arboles.filter((q) => !q.sacado && !q.caido);
    for (let r = 20; r < 450; r += 4) for (let a = 0; a < 6.28; a += 0.1) {
      const x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
      if (Math.abs(x) > 440 || Math.abs(z) > 440 || pend(x, z) > 0.05 || T.agua(x, z)) continue;
      let bien = !arboles.some((q) => Math.hypot(q.x - x, q.z - z) < 14);
      for (let k = 0; k < 8 && bien; k++) for (const d of [7, 14]) { const px = x + Math.cos(k * 0.785) * d, pz = z + Math.sin(k * 0.785) * d; if (pend(px, pz) > 0.09 || T.agua(px, pz)) bien = false; }
      if (bien) return { x, z, yaw: -Math.PI / 2 };
    }
    return null;
  };
  // una cuesta sin árboles ni agua, subiendo hacia donde mira el caballo
  A.cuesta = () => {
    const r0 = T.lugares.refugio, arboles = H.veg.arboles.filter((q) => !q.sacado && !q.caido);
    for (let r = 30; r < 400; r += 5) for (let a = 0; a < 6.28; a += 0.12) {
      const x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r, n = T.normal(x, z);
      if (n.y > 0.93 || n.y < 0.85) continue;
      const hx = -n.x, hz = -n.z, l = Math.hypot(hx, hz);
      let bien = true;
      for (let i = 0; i <= 8 && bien; i++) { const px = x + hx / l * i * 4, pz = z + hz / l * i * 4; if (T.agua(px, pz) || arboles.some((q) => Math.hypot(q.x - px, q.z - pz) < 7) || T.normal(px, pz).y < 0.8) bien = false; }
      if (bien) return { x, z, yaw: Math.atan2(-(hx / l), -(hz / l)) };
    }
    return null;
  };
  // monta al caballo en ese sitio (el jugador y el caballo van juntos)
  A.montarEn = async (s) => {
    P.caballo = { x: s.x, z: s.z, yaw: s.yaw + Math.PI };
    J.ubicar(s.x, s.z, 0);
    for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); }
    H.montar();
    J.estado.yaw = s.yaw; J.estado.pos.set(s.x, T.altura(s.x, s.z) + 1.8, s.z);
    await A.cuadros(30);
    return 1;
  };
  A.andar = async (n, tecla = 'KeyW') => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: tecla, key: tecla, bubbles: true }));
    for (let i = 0; i < n; i++) { H.__bucle(); await dormir(16); }
    document.dispatchEvent(new KeyboardEvent('keyup', { code: tecla, key: tecla, bubbles: true }));
    return 1;
  };
  A.cap = () => H.__mochilaCarga().capacidad;
  A.ocup = () => { const o = H.__mochilaCarga().ocupacion; return { usadas: o.usadas, total: o.total, libres: o.libres, sobrecarga: o.sobrecarga }; };
  // el carro: dónde está respecto del enganche del caballo
  A.carro = () => {
    const c = H.__caballo(), k = c.carro();
    if (!k) return null;
    k.g.updateMatrixWorld(true);
    const v = new H.THREE.Vector3(0, 0.98, 2.05); k.g.localToWorld(v);
    const e = c.est, hx = e.x - Math.sin(e.yaw) * 1.25, hz = e.z - Math.cos(e.yaw) * 1.25;
    const suelo = [];
    for (const [lx, lz] of [[-0.56, -0.85], [0.56, -0.85], [-0.56, 0.75], [0.56, 0.75]]) { const q = new H.THREE.Vector3(lx, 0.68, lz); k.g.localToWorld(q); suelo.push(q.y - T.altura(q.x, q.z)); }
    return { visible: k.g.visible, errorEnganche: Math.hypot(v.x - hx, v.z - hz), bajoSuelo: Math.min(...suelo), x: k.g.position.x, z: k.g.position.z, pitch: k.g.rotation.x, ruedas: k.ruedas.map((w) => w.rotation.x), hijos: k.g.children.length, enEscena: H.escena.children.includes(k.g) };
  };
  // la cámara fija mirando al conjunto desde un costado
  A.camaraCarro = (lado = 7.5, alto = 2.4, atras = 0.5) => {
    const e = H.__caballo().est, fx = Math.sin(e.yaw), fz = Math.cos(e.yaw), sx = Math.cos(e.yaw), sz = -Math.sin(e.yaw);
    const mx = e.x - fx * (1.6 + atras), mz = e.z - fz * (1.6 + atras);
    const cx = mx + sx * lado, cz = mz + sz * lado, cy = T.altura(cx, cz) + alto, ty = T.altura(mx, mz) + 1.0;
    const dx = mx - cx, dz = mz - cz, d = Math.hypot(dx, dz);
    H.__camaraFija = { x: cx, y: cy, z: cz, pitch: -Math.atan2(cy - ty, d), yaw: Math.atan2(-dx, -dz) };
    for (let i = 0; i < 4; i++) H.__bucle();
    return 1;
  };
  A.sinCamara = () => { delete H.__camaraFija; return 1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 300)); }
  });
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, O = H.obras, P = H.progreso; return (${c}) })()`);
  const foto = async (nombre, notas = false) => {
    if (notas) await js(`(() => { const e = document.createElement('style'); e.id = 'fx-notas'; e.textContent = '.nota { animation: none !important; opacity: 1 !important; }'; document.head.appendChild(e); return 1; })()`);
    await A('A.cuadros(3)'); await esperar(400);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
    const s = img.getSize();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG());
    console.log(`  captura ${nombre}.png (${s.width}×${s.height})`);
    if (notas) await js(`document.getElementById('fx-notas')?.remove(); 1`);
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, scale: 1 }));
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const entrar = async () => {
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(window.__hojarasca && window.__hojarasca.jugador && window.__hojarasca.obras)`).catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el Relax');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3500);
    await js(PAGINA);
  };
  // deja `texto` como la partida guardada: la página que se va (beforeunload) ya no puede pisarla
  const dejarPartida = (texto) => js(`(() => { const set = Storage.prototype.setItem, del = Storage.prototype.removeItem; Storage.prototype.setItem = function (k, v) { if (/^hojarasca-v1/.test(k)) return; return set.call(this, k, v); }; Storage.prototype.removeItem = function (k) { if (/^hojarasca-v1/.test(k)) return; return del.call(this, k); }; set.call(localStorage, 'hojarasca-v1', ${JSON.stringify(texto)}); del.call(localStorage, 'hojarasca-v1-backup'); return 1; })()`);
  const nuevas = async () => (await A('A.notas()')).join(' | ');
  const AJUSTES = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', estacion: 'otono', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false }))`;

  try {
    // ---------------------------------------------------------------- 0. la partida
    seccion('carga');
    await abrir();
    await js(`localStorage.clear(); ${AJUSTES}; 1`);
    await abrir();
    await entrar();
    await A(`(P.horas = 11, P.dia = 4, P.cosas.caballo = 1, 1)`);
    ok(await A('!!P.economia && P.modo !== "desafio" && !!H.__caballo()'), 'la partida es del Relax, con economía y con caballo');
    ok(await A('P.personal.caballo.carro === false && P.personal.caballo.enganchado === false'), 'una partida nueva no trae carro');
    ok((await A('A.cap().total')) === 24 && !(await A('H.__caballo().carro()')), 'sin carro: 24 casillas y ni una malla del carro');

    // ---------------------------------------------------------------- 1. la carpintería
    seccion('la carpintería');
    await A('(A.plata(60000), A.materiales({ tronco: 999, tabla: 999, piedra: 999, lana: 999 }), 1)');
    const sitio = await A('A.sitio("carpinteria")');
    ok(!!sitio, 'hay lugar para la carpintería');
    await A(`(A.parar(${JSON.stringify(sitio)}), A.limpiarNotas(), A.elegir("Carpintería"), 1)`);
    await A('A.tecla("KeyY")'); await esperar(500);
    ok(await A('!!A.obra("carpinteria")'), 'Y construye la carpintería');
    await A('A.tecla("KeyO")');
    ok((await A('A.cap().total')) === 24, 'a pie, 24 casillas');

    // ---------------------------------------------------------------- 2. el banco, sin lo que pide
    seccion('el banco sin lo que pide');
    await A(`(A.plata(5999), P.materiales = { tabla: 13, tronco: 4 }, P.cosas.caballo = 1, A.alLado("carpinteria"), A.limpiarNotas(), 1)`);
    let aviso = await A('A.aviso("carpinteria")');
    ok(/^El carro del caballo: 14 tablas, 4 troncos y \$6\.000 de hierro$/.test(aviso), `el aviso dice qué pide: «${aviso}»`);
    await A('A.tecla("KeyE")'); await esperar(300);
    const faltan = await nuevas();
    ok(/Para hacerlo falta 1 tabla, \$1 de hierro/.test(faltan), `E dice qué falta: «${faltan}»`);
    ok((await A('[P.materiales.tabla, P.materiales.tronco, P.economia.pesos].join()')) === '13,4,5999' && (await A('P.personal.caballo.carro')) === false, 'no se gastó nada ni se hizo el carro');
    await foto('01-banco-falta-algo', true);

    // ---------------------------------------------------------------- 3. con lo justo
    seccion('hacer el carro');
    await A(`(A.plata(6000), P.materiales.tabla = 14, A.limpiarNotas(), 1)`);
    aviso = await A('A.aviso("carpinteria")');
    ok(/^Hacer el carro del caballo/.test(aviso), `con todo, el aviso invita: «${aviso}»`);
    await A('A.tecla("KeyE")'); await esperar(400);
    const hecho = await nuevas();
    ok(/Hiciste el carro/.test(hecho) && /16 casillas/.test(hecho) && /Personalizar/.test(hecho), `la nota: «${hecho}»`);
    ok((await A('[P.materiales.tabla, P.materiales.tronco, P.economia.pesos].join()')) === '0,0,0', `descontó 14 tablas, 4 troncos y \$6.000 (quedan ${await A('[P.materiales.tabla, P.materiales.tronco, P.economia.pesos].join()')})`);
    ok(await A('P.personal.caballo.carro === true && P.personal.caballo.enganchado === true'), 'el carro quedó hecho y enganchado');
    await foto('02-banco-hiciste-el-carro', true);
    await A('(A.limpiarNotas(), 1)');
    await A('A.tecla("KeyE")'); await esperar(300);
    ok(/Tu carro/.test(await nuevas()) && (await A('P.economia.pesos')) === 0, `otra E no cobra: «${await nuevas()}»`);
    ok(/enganchado/.test(await A('A.aviso("carpinteria")')), 'y el aviso dice cómo va');
    ok((await A('A.cap().total')) === 24, 'a pie el carro no suma (24)');

    // ---------------------------------------------------------------- 4. montado
    seccion('montado, con el carro');
    const llano = await A('A.llano()');
    ok(!!llano, 'hay un tramo llano para pasear');
    await A(`A.montarEn(${JSON.stringify(llano)})`);
    ok(!!(await A('H.jugador.estado.montado')), 'montado');
    const cap = await A('A.cap()');
    ok(cap.total === 40 && cap.carro === 16 && cap.alforjas === 0, `montado con el carro enganchado: 40 casillas (${JSON.stringify(cap)})`);
    let c = await A('A.carro()');
    ok(c && c.visible && c.hijos === 3 && c.enEscena, `el carro se ve, con tres mallas, en la escena (${JSON.stringify({ v: c?.visible, h: c?.hijos })})`);
    ok(c.errorEnganche < 0.02, `las varas llegan al enganche (${c.errorEnganche.toFixed(4)} m)`);
    await A('A.camaraCarro(7.5, 2.4, 0.6)');
    await foto('03-carro-enganchado-parado');
    await A('A.camaraCarro(4.6, 1.5, 1.2)');
    await foto('04-carro-enganchado-cerca');
    await A('A.sinCamara()');
    // al trote
    const r0 = (await A('A.carro()')).ruedas[0];
    await A('A.andar(140)');
    c = await A('A.carro()');
    ok(c.errorEnganche < 0.02 && c.bajoSuelo > 0.1, `al trote sigue enganchado (${c.errorEnganche.toFixed(4)} m) y sin tocar el suelo (${c.bajoSuelo.toFixed(2)} m sobre el piso)`);
    ok(Math.abs(c.ruedas[0] - r0) > 3 && Math.abs(c.ruedas[0] - c.ruedas[1]) < 1e-9, `las ruedas giraron (${(c.ruedas[0] - r0).toFixed(1)} rad) y juntas`);
    ok(await A('H.jugador.estado.montado && H.jugador.estado.velocidadActual >= 0'), 'sigue montado');
    await A('A.andar(40)');
    await A('A.camaraCarro(7.5, 2.4, 0.6)');
    await foto('05-carro-al-trote');
    await A('A.sinCamara()');
    // girando
    await js(`(async () => { const j = window.__hojarasca.jugador.estado; document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'KeyW', bubbles: true })); let peor = 0, bajo = 9; for (let i = 0; i < 120; i++) { j.yaw += 0.04; window.__hojarasca.__bucle(); await new Promise((r) => setTimeout(r, 16)); const q = window.__A.carro(); peor = Math.max(peor, q.errorEnganche); bajo = Math.min(bajo, q.bajoSuelo); } document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'KeyW', bubbles: true })); window.__giro = { peor, bajo }; return 1; })()`);
    const giro = await js('window.__giro');
    ok(giro.peor < 0.03 && giro.bajo > 0.05, `girando en círculo sigue enganchado (peor ${giro.peor.toFixed(4)} m) y sin hundirse (${giro.bajo.toFixed(2)} m)`);
    await A('A.camaraCarro(8.5, 3.0, 0.6)');
    await foto('06-carro-en-la-curva');
    await A('A.sinCamara()');
    // la cuesta
    const cuesta = await A('A.cuesta()');
    ok(!!cuesta, 'hay una cuesta limpia');
    if (cuesta) {
      await A(`(H.desmontar(), 1)`);
      await A(`A.montarEn(${JSON.stringify(cuesta)})`);
      await A('A.andar(70)');
      const cu = await A('A.carro()');
      ok(Math.abs(cu.pitch) > 0.05 && cu.bajoSuelo > 0.05 && cu.errorEnganche < 0.03, `en la cuesta se inclina (${cu.pitch.toFixed(2)} rad), no se hunde (${cu.bajoSuelo.toFixed(2)} m) y sigue enganchado (${cu.errorEnganche.toFixed(3)} m)`);
      await A('A.camaraCarro(8, 2.6, 0.6)');
      await foto('07-carro-en-la-cuesta');
      await A('A.sinCamara()');
    }

    // ---------------------------------------------------------------- 5. la mochila
    seccion('la mochila');
    await A(`(A.montarEn(${JSON.stringify(llano)}), 1)`);
    await A(`(H.progreso.materiales.tronco = 300, 1)`);   // 30 casillas de troncos
    await A('A.cuadros(4)');
    ok((await A('A.ocup().usadas')) === 30 && (await A('A.ocup().total')) === 40, 'montado: 30 de 40 casillas');
    await A('(A.tecla("KeyI"), 1)'); await A('A.cuadros(3)'); await esperar(300);
    let det = await js(`document.getElementById('mochila-detalle').textContent`);
    ok(det === '24 de la mochila + 16 del carro', `el desglose: «${det}»`);
    ok((await js(`document.getElementById('mochila-contador').textContent`)) === 'Casillas 30/40', 'el contador: Casillas 30/40');
    const titulos = await js(`[...document.querySelectorAll('#mochila-casillas .casillas-zona')].map((e) => e.textContent)`);
    ok(JSON.stringify(titulos) === JSON.stringify(['Carro del caballo']), `el título de la zona: ${JSON.stringify(titulos)}`);
    ok((await js(`document.querySelectorAll('#mochila-casillas .casilla').length`)) === 40 && (await js(`document.querySelectorAll('#mochila-casillas .casilla.carro').length`)) === 16, '40 casillas, 16 del carro');
    await foto('08-mochila-con-el-carro');
    // con las alforjas también
    await A(`(P.personal.caballo.conAlforjas = true, A.tecla("KeyI"), A.tecla("KeyI"), 1)`); await A('A.cuadros(3)'); await esperar(300);
    det = await js(`document.getElementById('mochila-detalle').textContent`);
    ok(det === '24 de la mochila + 12 de las alforjas + 16 del carro', `con alforjas: «${det}»`);
    ok((await A('A.cap().total')) === 52, 'son 52 casillas');
    await foto('09-mochila-alforjas-y-carro');
    await A('(A.tecla("KeyI"), P.personal.caballo.conAlforjas = false, 1)');
    await A('A.cuadros(3)');

    // ---------------------------------------------------------------- 6. desenganchar desde «Personalizar → Tu caballo»
    seccion('Personalizar → Tu caballo');
    await A('(H.__caballo().est.visible ? 1 : 1)');
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F5', key: 'F5', bubbles: true })); 1`);
    await esperar(600);
    await js(`document.getElementById('personal-pestana-caballo')?.click(); 1`);
    await esperar(300);
    const filaCarro = () => js(`(() => { const f = [...document.querySelectorAll('#personal-contenido .personal-fila')].find((x) => /Carro enganchado/.test(x.textContent)); return f ? { texto: f.textContent, si: f.querySelector('[data-valor="true"]')?.getAttribute('aria-pressed'), no: f.querySelector('[data-valor="false"]')?.getAttribute('aria-pressed') } : null; })()`);
    let fila = await filaCarro();
    ok(fila && /\+16 casillas montado/.test(fila.texto) && fila.si === 'true', `el interruptor del carro está en Sí: ${JSON.stringify(fila)}`);
    await foto('10-personalizar-tu-caballo');
    await js(`document.querySelector('#personal-contenido [data-valor="false"]') && [...document.querySelectorAll('#personal-contenido .personal-fila')].find((x) => /Carro enganchado/.test(x.textContent)).querySelector('[data-valor="false"]').click(); 1`);
    await esperar(400);
    fila = await filaCarro();
    ok(fila && fila.no === 'true', 'el clic en No lo desengancha');
    ok(await A('P.personal.caballo.carro === true && P.personal.caballo.enganchado === false'), 'el carro sigue hecho, pero desenganchado');
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })); 1`);
    await esperar(500);
    await A('(H.volverAlJuego && H.volverAlJuego(true), A.cuadros(6), 1)');
    c = await A('A.carro()');
    ok(!c || !c.visible, 'desenganchado, el carro ya no se ve detrás del caballo');
    await A('A.camaraCarro(7.5, 2.4, 0.6)');
    await foto('11-carro-desenganchado');
    await A('A.sinCamara()');
    ok((await A('A.cap().total')) === 24, 'montado y desenganchado: 24 casillas');
    const ocu = await A('A.ocup()');
    ok(ocu.usadas === 30 && ocu.total === 24 && ocu.sobrecarga.tronco > 0, `con 30 casillas encima queda sobrecarga (${JSON.stringify(ocu.sobrecarga)})`);
    ok((await A('P.materiales.tronco')) === 300, 'no se perdió ningún tronco');
    ok((await A('H.__lugarEn("tronco", 10)')) === 0 && (await A('H.__lugarEn("tabla", 10)')) === 0, 'no se puede juntar nada más');
    await A('(A.tecla("KeyI"), 1)'); await A('A.cuadros(3)'); await esperar(300);
    ok(/sobrecarga/.test(await js(`document.getElementById('mochila-contador').textContent`)) && /Montado con el carro suman 16 más|24 casillas en la mochila|24 de la mochila/.test(await js(`document.getElementById('mochila-detalle').textContent`)), `la mochila avisa: «${await js(`document.getElementById('mochila-contador').textContent`)}» · «${await js(`document.getElementById('mochila-detalle').textContent`)}»`);
    await foto('12-mochila-sobrecarga-sin-carro');
    await A('(A.tecla("KeyI"), 1)');
    // volver a enganchar
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F5', key: 'F5', bubbles: true })); 1`);
    await esperar(600);
    await js(`document.getElementById('personal-pestana-caballo')?.click(); 1`);
    await esperar(300);
    await js(`[...document.querySelectorAll('#personal-contenido .personal-fila')].find((x) => /Carro enganchado/.test(x.textContent)).querySelector('[data-valor="true"]').click(); 1`);
    await esperar(400);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })); 1`);
    await esperar(500);
    await A('(H.volverAlJuego && H.volverAlJuego(true), A.cuadros(8), 1)');
    ok(await A('P.personal.caballo.enganchado === true'), 'enganchado de nuevo');
    c = await A('A.carro()');
    ok(c && c.visible && c.errorEnganche < 0.02, 'el carro vuelve a verse detrás del caballo');
    ok((await A('A.cap().total')) === 40 && (await A('A.ocup().sobrecarga.tronco')) === undefined, 'montado otra vez: 40 casillas y sin sobrecarga');

    // ---------------------------------------------------------------- 7. bajarse
    seccion('bajarse con el carro');
    await A('(H.desmontar(), A.cuadros(8), 1)');
    ok((await A('A.cap().total')) === 24, 'a pie con el carro enganchado: 24');
    c = await A('A.carro()');
    ok(c && c.visible, 'el carro se queda enganchado al caballo parado');
    ok((await A('P.materiales.tronco')) === 300 && (await A('A.ocup().sobrecarga.tronco')) > 0, 'bajarse deja sobrecarga y no pierde nada');
    ok((await A('H.__lugarEn("tronco", 10)')) === 0, 'y no deja juntar más');
    await A('(H.__caballo().est.x, 1)');
    await A('A.camaraCarro(7.5, 2.4, 0.6)');
    await foto('13-carro-con-el-caballo-parado');
    await A('A.sinCamara()');
    // gastando, vuelve a poderse
    await A('(P.materiales.tronco = 100, 1)');
    ok((await A('H.__lugarEn("tronco", 10)')) === 10, 'gastando, se vuelve a poder juntar');

    // ---------------------------------------------------------------- 8. el guardado
    seccion('el guardado');
    await A('(H.guardar(), 1)'); await esperar(500);
    let g = await js(`JSON.parse(localStorage.getItem('hojarasca-v1'))`);
    ok(g.personal.caballo.carro === true && g.personal.caballo.enganchado === true, 'el guardado trae el carro enganchado');
    await abrir();
    await entrar();
    ok(await A('P.personal.caballo.carro === true && P.personal.caballo.enganchado === true'), 'al recargar el carro sigue hecho y enganchado');
    await A('A.cuadros(10)');
    c = await A('A.carro()');
    ok(c && c.visible && c.errorEnganche < 0.05, 'y se ve enganchado al caballo');
    await A(`(H.montar(), A.cuadros(4), 1)`);
    ok((await A('A.cap().total')) === 40, 'montado, 40 casillas');
    await A('(H.desmontar(), 1)');
    // una partida de antes: sin los campos del carro
    g = await js(`JSON.parse(localStorage.getItem('hojarasca-v1'))`);
    delete g.personal.caballo.carro; delete g.personal.caballo.enganchado;
    await dejarPartida(JSON.stringify(g));
    await abrir();
    await entrar();
    ok(await A('P.personal.caballo.carro === false && P.personal.caballo.enganchado === false'), 'una partida de antes (sin los campos) abre sin carro');
    await A(`(H.montar(), A.cuadros(6), 1)`);
    ok((await A('A.cap().total')) === 24 && !(await A('H.__caballo().carro()')), 'y sigue igual que antes: 24 casillas, ni una malla del carro');
    await A('(H.desmontar(), 1)');
    // una partida de una versión más nueva: se abre en sólo lectura y no se pisa
    g.versionJuego = '9.0.0'; g.personal.caballo.carro = true; g.personal.caballo.enganchado = true;
    const texto = JSON.stringify(g);
    await dejarPartida(texto);
    await abrir();
    await entrar();
    ok(await A('P.personal.caballo.carro === true && P.personal.caballo.enganchado === true'), 'la partida de una versión más nueva se lee con su carro');
    await A('(H.guardar(), 1)'); await esperar(600);
    const despues = await js(`JSON.parse(localStorage.getItem('hojarasca-v1'))`);
    ok(despues.versionJuego === '9.0.0' && despues.personal.caballo.carro === true, `en sólo lectura no se pisa la partida (versión ${despues.versionJuego})`);

    ok(consola.length === 0, `sin errores en la consola${consola.length ? ': ' + consola.slice(0, 3).join(' | ') : ''}`);
  } catch (err) {
    errores.push(`EXCEPCIÓN (${donde}): ${err && err.stack ? err.stack : err}`);
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n- ${errores.join('\n- ')}` : '\nOK 4.11.5 carro, en el juego');
  try { w && !w.isDestroyed() && w.destroy(); } catch { /* ya cerrada */ }
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
