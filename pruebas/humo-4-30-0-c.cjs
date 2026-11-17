// Partida real 4.30.0 (C): cacería de bugs del mundo y la física. Secciones (HUMO_PARTES=a,b,...):
//   puentes · cada puente del valle (el de troncos del sendero, el puentecito del camino de la Aldea, los de la trochita y la pasarela del
//             taller): lo que se ve contra lo que se pisa (rayos de arriba a abajo), cruzarlo caminando y corriendo en los dos sentidos
//             (escalones, caídas, trabas) y empujar contra la baranda en el medio
//   cascada · la cascada y el arroyo en Alta (y en Ultra con HUMO_ULTRA=1): capturas de la cortina, la poza y la orilla; caminar por la orilla
//   fisica  · el inventario de la física: caminar, correr, saltar, nadar, escaleras y pendientes, la cámara contra las paredes, lo que se tira
//   zonas   · cada zona (Aldea, bosque, lago, valle, estaciones): caer fuera del mapa, huecos bajo los pies, capturas
// Uso (después de `node armar.mjs`), con el candado de Electron tomado y minimizado:
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-30-0-c.cjs -Espera 900 -Perfil <carpeta propia>
//   HUMO_PARTES=... · HTML=<otra página> · HUMO_SALIDA=<carpeta> · HUMO_CALIDAD=alta|media|baja · HUMO_ULTRA=1
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-30-0-c'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const TOPE_MIN = 25 + ((process.env.HUMO_PARTES || '').includes('largo') ? Number(process.env.HUMO_MINUTOS || 120) : 0);   // (la partida larga suma sus minutos)
setTimeout(() => { console.log(`ERROR: la prueba tardó más de ${TOPE_MIN} minutos`); try { app.exit(2); } catch { process.exit(2); } }, TOPE_MIN * 60 * 1000).unref?.();
const PARTES = (process.env.HUMO_PARTES || 'puentes,cascada,fisica,zonas').split(',');
const parte = (p) => PARTES.includes(p);
const CALIDAD = process.env.HUMO_CALIDAD || 'alta';
const ULTRA = process.env.HUMO_ULTRA === '1';

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso, T = H.T, col = H.col, J = H.jugador;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.abajo = (code) => document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true }));
  N.arriba = (code) => document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true }));
  N.soltarTodo = () => { for (const c of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space', 'KeyC']) N.arriba(c); return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  // lo que se VE bajo (x, z): el primer dibujo opaco que corta un rayo vertical desde «desde» hacia abajo (sin agua, sin gente, sin partículas)
  const rc = new H.THREE.Raycaster();
  const visible = (o) => { for (let q = o; q; q = q.parent) if (q.visible === false) return false; return true; };
  N.visto = (x, z, desde, largo = 8) => {
    rc.set(new H.THREE.Vector3(x, desde, z), new H.THREE.Vector3(0, -1, 0)); rc.far = largo;
    const hits = rc.intersectObjects(H.escena.children, true);
    for (const h of hits) {
      const o = h.object, m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!o.isMesh || !m || m.transparent || !visible(o)) continue;
      if (/gente|persona|jugador|cuerpo/i.test(o.name || '') ) continue;
      return { y: +h.point.y.toFixed(3), nombre: (o.name || o.parent?.name || o.type).slice(0, 30) };
    }
    return null;
  };
  // lo que se PISA en (x, z) viniendo desde arriba (la plataforma más alta por debajo de «desde», o el terreno)
  N.pisado = (x, z, desde) => { const p = col.plataformaEn(x, z, desde, 0); const t = T.altura(x, z); return p && p.alto > t ? { y: +p.alto.toFixed(3), plat: 1 } : { y: +t.toFixed(3), plat: 0 }; };
  // todos los puentes: { tipo, x, z, ux, uz (a lo largo), largo, ancho, alto (el piso) }
  N.puentes = () => {
    const L = [];
    for (const p of T.puentes || []) L.push({ tipo: 'troncos', x: p.x, z: p.z, ux: Math.cos(p.ang), uz: Math.sin(p.ang), largo: p.largo, ancho: 2.4, alto: p.alto });
    const R = H.__rincones && H.__rincones.mundo && H.__rincones.mundo();
    for (const b of (R && R.puentes ? R.puentes() : [])) L.push({ tipo: 'camino', x: b.x, z: b.z, ux: Math.sin(b.ang), uz: Math.cos(b.ang), largo: b.largo, ancho: 2.0, alto: b.alto + 0.035,
      y0: (Number.isFinite(b.y0) ? b.y0 : b.alto) + 0.035, y1: (Number.isFinite(b.y1) ? b.y1 : b.alto) + 0.035 });
    for (const p of T.puentesRiel || []) if (p.alto !== undefined) L.push({ tipo: 'riel', x: p.x, z: p.z, ux: Math.sin(p.ang), uz: Math.cos(p.ang), largo: p.tablero || p.luz + 4, ancho: 2.6, alto: p.alto - 0.2 });
    const TI = H.__tirolesas && H.__tirolesas();
    for (const l of (TI && TI.lineas || []).filter((x) => x.tipo === 'puente')) { const dx = l.B.x - l.A.x, dz = l.B.z - l.A.z, ll = Math.hypot(dx, dz) || 1;
      L.push({ tipo: 'colgante', x: (l.A.x + l.B.x) / 2, z: (l.A.z + l.B.z) / 2, ux: dx / ll, uz: dz / ll, largo: ll, ancho: 1.0, alto: Math.max(l.A.y, l.B.y), y0: l.A.y, y1: l.B.y, comba: l.comba }); }
    return L.map((b) => ({ ...b, x: +b.x.toFixed(2), z: +b.z.toFixed(2), largo: +b.largo.toFixed(2), alto: +b.alto.toFixed(3) }));
  };
  // el piso de un puente en «s» (a lo largo): en rampa (el camino) o con la comba (el colgante)
  N.pisoEn = (b, s) => { const t = Math.max(0, Math.min(1, s / b.largo + 0.5)); if (b.y0 === undefined) return b.alto; return b.y0 + (b.y1 - b.y0) * t - 4 * (b.comba || 0) * t * (1 - t); };
  // un puente colgante armado con dos estribos sobre el arroyo (como humo-2-9-vela.cjs), para recorrerlo con los otros
  N.colgante = () => { const O = H.obras, PL = H.PLANOS.find((p) => p.id === 'estribo-puente'), TI = H.__tirolesas();
    const fundar = (x, z) => { Object.assign(P.materiales, { tronco: 90, tabla: 90, piedra: 90, lana: 20 }); O.elegir(PL); const r = O.fundar(x, z, 0, T.altura(x, z)); if (!r.ok) { O.elegir(null); return null; }
      for (let g = 0; g < 6 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const k = O.avanzar(r.obra, P.materiales); if (!k.ok) break; } O.elegir(null); P.obras = O.obras.map((o) => o.datos); return r.obra.datos; };
    for (let i = 20; i < T.rio.length - 20; i += 3) { const p = T.rio[i], q = T.rio[i + 1];
      if (Math.hypot(p.x - 150, p.z - 110) < 240 || Math.max(Math.abs(p.x), Math.abs(p.z)) > 330) continue;
      if (T.puentes.some((b) => Math.hypot(b.x - p.x, b.z - p.z) < 25)) continue;
      const tx = q.x - p.x, tz = q.z - p.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
      for (const m of [2.5, 3.5, 5, 6.5]) { const d = p.w + m, a = { x: p.x + nx * d, z: p.z + nz * d }, b = { x: p.x - nx * d, z: p.z - nz * d };
        if (!O.revisarSitio(a.x, a.z, PL, 0).ok || !O.revisarSitio(b.x, b.z, PL, 0).ok) continue;
        if (!TI.probarLinea('puente', { ...a, y: T.altura(a.x, a.z) }, { ...b, y: T.altura(b.x, b.z) }).ok) continue;
        const e1 = fundar(a.x, a.z), e2 = fundar(b.x, b.z); TI.actualizar(1, H.jugador); return { e1: !!e1, e2: !!e2, lineas: TI.lineas.length }; } }
    return null; };
  // perfil: a lo largo del eje (de -largo/2-3 a +largo/2+3) y en tres carriles, lo visto contra lo pisado
  N.perfil = (b) => {
    const filas = [];
    for (const lat of [-b.ancho / 2 + 0.4, 0, b.ancho / 2 - 0.4]) for (let s = -b.largo / 2 - 3; s <= b.largo / 2 + 3.01; s += 0.5) {
      const x = b.x + b.ux * s - b.uz * lat, z = b.z + b.uz * s + b.ux * lat;
      const v = N.visto(x, z, N.pisoEn(b, s) + 2.5, 12), p = N.pisado(x, z, N.pisoEn(b, s) + 0.3);
      filas.push({ piso: +N.pisoEn(b, s).toFixed(3), s: +s.toFixed(1), lat: +lat.toFixed(1), visto: v ? v.y : null, que: v ? v.nombre : '', pisa: p.y, plat: p.plat, terreno: +T.altura(x, z).toFixed(2), agua: !!T.agua(x, z) });
    }
    return filas;
  };
  // cruzar caminando (o corriendo): desde 5 m antes hasta 5 m después, por el eje; devuelve lo que pasó
  N.cruzar = async (b, sentido, correr, lat = 0, maxSeg = 0) => {
    N.soltarTodo();
    const s0 = -sentido * (b.largo / 2 + 5);
    const x0 = b.x + b.ux * s0 - b.uz * lat, z0 = b.z + b.uz * s0 + b.ux * lat;
    const yaw = Math.atan2(-b.ux * sentido, -b.uz * sentido);
    J.ubicar(x0, z0, yaw); J.estado.pitch = 0; J.estado.sentado = false; J.estado.montado = null;
    await N.tick(0.3);
    N.abajo('KeyW'); if (correr) N.abajo('ShiftLeft');
    const meta = b.largo + 10, t0 = performance.now(), lim = (maxSeg || (meta / (correr ? 4 : 2) + 6)) * 1000;
    let yAnt = J.estado.pos.y, saltoMax = 0, minSobre = 9, nado = false, caida = false, lateralMax = 0, avance = 0, n = 0, aire = 0;
    const muestras = [];
    while (performance.now() - t0 < lim) {
      J.estado.yaw = yaw;
      H.__bucle(); await dormir(14); n++;
      const p = J.estado.pos;
      const dx = p.x - b.x, dz = p.z - b.z;
      const s = dx * b.ux + dz * b.uz, l = -dx * b.uz + dz * b.ux;
      avance = (s - s0) * sentido;
      lateralMax = Math.max(lateralMax, Math.abs(l - lat));
      const dy = p.y - yAnt; yAnt = p.y;
      if (Math.abs(s) < b.largo / 2 - 0.5) { saltoMax = Math.max(saltoMax, Math.abs(dy)); minSobre = Math.min(minSobre, p.y - N.pisoEn(b, s)); }
      if (J.estado.nadando) nado = true;
      if (!J.estado.enSuelo) aire++;
      if (Math.abs(s) < b.largo / 2 - 0.5 && p.y < N.pisoEn(b, s) - 0.4) caida = true;
      if (n % 6 === 0) muestras.push([+s.toFixed(1), +(p.y - N.pisoEn(b, s)).toFixed(2)]);
      if (avance >= meta) break;
    }
    N.soltarTodo();
    return { tipo: b.tipo, sentido, correr, lat, avance: +avance.toFixed(1), meta: +meta.toFixed(1), seg: +((performance.now() - t0) / 1000).toFixed(1), saltoMax: +saltoMax.toFixed(3), minSobre: +minSobre.toFixed(3), nado, caida, lateralMax: +lateralMax.toFixed(2), aire, cuadros: n, muestras };
  };
  // empujar contra la baranda: parado en el medio, caminar de costado 3 s
  N.baranda = async (b, lado) => {
    N.soltarTodo();
    J.ubicar(b.x, b.z, Math.atan2(-b.ux, -b.uz), N.pisoEn(b, 0) + 0.05); await N.tick(0.3);
    N.abajo(lado > 0 ? 'KeyD' : 'KeyA'); N.abajo('ShiftLeft');
    const t0 = performance.now(); let lmax = 0, ymin = 99;
    while (performance.now() - t0 < 2500) { J.estado.yaw = Math.atan2(-b.ux, -b.uz); H.__bucle(); await dormir(14); const p = J.estado.pos, dx = p.x - b.x, dz = p.z - b.z; lmax = Math.max(lmax, Math.abs(-dx * b.uz + dz * b.ux)); ymin = Math.min(ymin, p.y - N.pisoEn(b, 0)); }
    N.soltarTodo();
    return { lado, lateralMax: +lmax.toFixed(2), ymin: +ymin.toFixed(2), mitadAncho: b.ancho / 2 };
  };
  // caminar (o correr) «seg» segundos hacia «yaw» desde donde está: lo raro que pasó (saltó solo, se hundió, se trabó)
  N.andar = async (yaw, seg, correr = true, saltar = false) => {
    N.soltarTodo(); N.abajo('KeyW'); if (correr) N.abajo('ShiftLeft');
    const p0 = J.estado.pos.clone(), t0 = performance.now(); let yAnt = p0.y, subeSolo = 0, hundido = 0, n = 0, maxSube = 0, nado = false, salto = false, ySalto = 0;
    while (performance.now() - t0 < seg * 1000) {
      J.estado.yaw = yaw;
      if (saltar && n === 20) { N.abajo('Space'); salto = true; ySalto = 0; }
      if (saltar && n === 24) N.arriba('Space');
      const enSueloAntes = J.estado.enSuelo;
      H.__bucle(); await dormir(14); n++;
      const p = J.estado.pos, dy = p.y - yAnt; yAnt = p.y;
      if (J.estado.nadando) nado = true;
      if (!saltar && enSueloAntes && dy > 0.35 && !J.estado.enPlataforma) { subeSolo++; maxSube = Math.max(maxSube, dy); }
      if (!J.estado.nadando && p.y < T.altura(p.x, p.z) - 0.08 && !col.plataformaEn(p.x, p.z, p.y + 0.3, 0.3)) hundido++;
      if (saltar && salto) ySalto = Math.max(ySalto, p.y - Math.max(T.altura(p.x, p.z), (col.plataformaEn(p.x, p.z, p.y, 0) || { alto: -1e9 }).alto));
    }
    N.soltarTodo();
    const p = J.estado.pos;
    return { avance: +Math.hypot(p.x - p0.x, p.z - p0.z).toFixed(2), subeSolo, maxSube: +maxSube.toFixed(2), hundido, nado, cuadros: n, x: +p.x.toFixed(1), z: +p.z.toFixed(1), y: +p.y.toFixed(2), suelo: +T.altura(p.x, p.z).toFixed(2), alturaSalto: saltar ? +ySalto.toFixed(2) : null };
  };
  // ¿hay algo que frene cerca (una pared, un árbol)? (para saber si quedarse quieto es lógico)
  N.algoCerca = (x, z, r = 1.2) => { const q = { x, z, y: T.altura(x, z) }; const x0 = q.x, z0 = q.z; col.resolver(q, r, 1.6); return Math.hypot(q.x - x0, q.z - z0) > 0.01; };
  // la cámara puesta en un lugar (sin cuerpo): para capturas
  N.camara = (x, y, z, yaw, pitch, horas) => { H.__camaraFija = { x, y, z, yaw, pitch }; J.ubicar(x, z, yaw); J.estado.yaw = yaw; J.estado.pitch = pitch; if (horas !== undefined) { P.horas = horas; } H.camara.children.forEach((q) => { q.visible = false; }); return 1; };
  N.sinCamara = () => { H.__camaraFija = null; return 1; };
  N.mirarDesde = (x, z, alto, hx, hy, hz, horas) => { const y = T.altura(x, z) + alto; const yaw = Math.atan2(-(hx - x), -(hz - z)); const pitch = Math.atan2(hy - y, Math.hypot(hx - x, hz - z)); return N.camara(x, y, z, yaw, pitch, horas); };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 180000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, T = H.T, J = H.jugador; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const foto = async (nombre, seg = 1.2) => {
    await N(`N.tick(${seg})`);
    try {
      const datos = await js(`(() => { const H = window.__hojarasca; H.__bucle(); return H.renderer.domElement.toDataURL('image/jpeg', 0.88); })()`);
      fs.writeFileSync(path.join(salida, nombre + '.jpg'), Buffer.from(datos.split(',')[1], 'base64'));
      console.log(`  (captura ${nombre}.jpg)`);
    } catch (e) { console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'alta', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2)');
    for (let k = 0; k < 6 && (await N('N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }
  };
  const abrir = async (o, limpiar) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`${limpiar ? 'localStorage.clear(); ' : ''}${ajustes(o)}`);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    if (!(await esperarJuego())) throw new Error('el juego no cargó');
  };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre;
    console.log(`\n=== ${nombre}`);
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    await N('(N.soltarTodo(), N.sinCamara())').catch(() => 0);
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas del juego ' + fallas.slice(0, 200)); }
  };
  const extra = process.env.HUMO_EXTRA ? require(path.resolve(process.env.HUMO_EXTRA)) : null;
  try {
    await abrir({ calidad: CALIDAD, ultra: ULTRA, estacion: process.env.HUMO_ESTACION || 'verano' }, true);
    await entrar();
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 12; P.horas = 11; return 1 })()');
    await N('N.tick(2)');
    const prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0, ' calidad', CALIDAD, ULTRA ? 'Ultra' : '');

    await seccion('puentes', async () => {
      if (process.env.HUMO_COLGANTE !== '0') console.log('  colgante:', JSON.stringify(await N('N.colgante()')));
      const L = await N('N.puentes()');
      console.log('  puentes:', L.length, JSON.stringify(L.map((b) => [b.tipo, b.x, b.z, b.largo, b.alto])));
      for (let i = 0; i < L.length; i++) {
        const b = L[i], id = `${i}-${b.tipo}`;
        await N(`(J.ubicar(${b.x}, ${b.z}, 0, ${b.alto} + 0.1), N.tick(1.2))`);
        const perfil = await N(`N.perfil(${JSON.stringify(b)})`);
        // lo que se ve y lo que se pisa sobre el tablero (y en las cabeceras)
        const sobre = perfil.filter((f) => Math.abs(f.s) <= b.largo / 2 - 0.3 && Math.abs(f.lat) < 0.5);
        const difs = sobre.filter((f) => f.visto !== null).map((f) => +(f.visto - f.pisa).toFixed(3));
        const sinPiso = sobre.filter((f) => !f.plat).length;
        const peor = difs.reduce((m, d) => Math.abs(d) > Math.abs(m) ? d : m, 0);
        const cab = perfil.filter((f) => Math.abs(f.s) > b.largo / 2 - 0.3 && Math.abs(f.s) < b.largo / 2 + 1.6 && Math.abs(f.lat) < 0.5).map((f) => `${f.s}:${f.visto ?? '-'}/${f.pisa}${f.plat ? 'p' : 't'}`);
        console.log(`  [${id}] (${b.x}, ${b.z}) largo ${b.largo} piso ${b.alto} · visto−pisado en el eje: peor ${peor} · sin piso ${sinPiso} · cabeceras ${cab.join(' ')}`);
        fs.writeFileSync(path.join(salida, `perfil-${id}.json`), JSON.stringify(perfil));
        for (const sentido of [1, -1]) for (const correr of [false, true]) {
          const r = await N(`N.cruzar(${JSON.stringify(b)}, ${sentido}, ${correr})`);
          console.log(`    cruzar ${sentido > 0 ? 'ida' : 'vuelta'} ${correr ? 'corriendo' : 'caminando'}: avance ${r.avance}/${r.meta} en ${r.seg}s · Δy máx ${r.saltoMax} · y−piso mín ${r.minSobre} · nado ${r.nado} · caída ${r.caida} · desvío ${r.lateralMax} · aire ${r.aire}/${r.cuadros}`);
          if (r.avance < r.meta - 0.5 || r.caida || r.nado) console.log('      muestras', JSON.stringify(r.muestras));
        }
        for (const lado of [1, -1]) console.log('    baranda', JSON.stringify(await N(`N.baranda(${JSON.stringify(b)}, ${lado})`)));
        // capturas: de costado (rasante) y parado arriba mirando a lo largo
        const lejosC = Math.min(13, Math.max(9, b.largo * 0.5));
        await N(`N.mirarDesde(${b.x - b.uz * lejosC + b.ux * 2}, ${b.z + b.ux * lejosC + b.uz * 2}, 1.6, ${b.x}, ${b.alto}, ${b.z}, 11)`);
        await foto(`p${id}-costado`);
        await N(`N.camara(${b.x - b.ux * (b.largo / 2 + 3)}, ${(b.y0 ?? b.alto) + 1.65}, ${b.z - b.uz * (b.largo / 2 + 3)}, ${Math.atan2(-b.ux, -b.uz)}, -0.25, 11)`);
        await foto(`p${id}-encima`);
        await N('N.sinCamara()');
      }
    });

    await seccion('cascada', async () => {
      const s = await N('(() => { const s = T.saltoAgua; return s ? { x: s.x, z: s.z, ang: s.ang, ancho: s.ancho, arriba: s.arriba, abajo: s.abajo } : null })()');
      console.log('  salto:', JSON.stringify(s));
      if (!s) return;
      const dx = Math.sin(s.ang), dz = Math.cos(s.ang), nx = Math.cos(s.ang), nz = -Math.sin(s.ang);
      // la cortina de frente desde la poza, de cerca y de lejos, con el reloj grande (la partida lleva horas)
      for (const [nom, t] of [['reloj-chico', 30], ['reloj-grande', 9000]]) {
        await N(`(() => { const U = H.__U(); U.uTiempo.value = ${t}; return 1 })()`);
        await N(`N.mirarDesde(${s.x + dx * 12}, ${s.z + dz * 12}, 1.6, ${s.x}, ${(s.arriba + s.abajo) / 2}, ${s.z}, 11)`);
        await foto(`c-frente-${nom}`, 0.6);
      }
      await N(`N.mirarDesde(${s.x + dx * 22 + nx * 8}, ${s.z + dz * 22 + nz * 8}, 2.5, ${s.x}, ${s.abajo + 2}, ${s.z}, 11)`);
      await foto('c-lejos');
      await N(`N.mirarDesde(${s.x + dx * 6 + nx * (s.ancho + 3)}, ${s.z + dz * 6 + nz * (s.ancho + 3)}, 1.4, ${s.x + dx * 3}, ${s.abajo}, ${s.z + dz * 3}, 11)`);
      await foto('c-poza-costado');
      // el arroyo: cinco tramos (arriba del salto, abajo, y lejos) mirando la orilla
      const tramos = await N(`(() => { const R = T.rio, out = []; for (const k of [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) { const i = Math.floor(R.length * k), p = R[i], q = R[Math.min(R.length - 1, i + 2)]; const ux = q.x - p.x, uz = q.z - p.z, l = Math.hypot(ux, uz) || 1; out.push({ i, x: p.x, z: p.z, w: p.w, s: p.s, ux: ux / l, uz: uz / l }); } return out })()`);
      for (const t of tramos) {
        const cx = t.x - t.uz * (t.w + 4) - t.ux * 6, cz = t.z + t.ux * (t.w + 4) - t.uz * 6;
        await N(`N.mirarDesde(${cx}, ${cz}, 1.6, ${t.x + t.ux * 4}, ${t.s}, ${t.z + t.uz * 4}, 11)`);
        await foto(`a-${t.i}`);
      }
      // caminar cruzando el arroyo de orilla a orilla en tres lugares (lo que se pisa en la orilla)
      for (const t of tramos.slice(1, 4)) {
        const b = { tipo: 'vado', x: t.x, z: t.z, ux: -t.uz, uz: t.ux, largo: t.w * 2 + 2, ancho: 1, alto: t.s };
        const r = await N(`N.cruzar(${JSON.stringify(b)}, 1, false)`);
        console.log(`  cruzar el arroyo en ${t.i}: avance ${r.avance}/${r.meta} en ${r.seg}s · Δy máx ${r.saltoMax} · nado ${r.nado} · desvío ${r.lateralMax}`);
      }
      await N('(() => { const U = H.__U(); return 1 })()');
    });

    await seccion('fisica', async () => {
      // 1. saltar en el llano, caminando y corriendo
      await N('(() => { const L = T.lugares.refugio; J.ubicar(L.x + 14, L.z + 14, 0.7); return 1 })()');
      await N('N.tick(0.6)');
      const s1 = await N('N.andar(0.7, 1.6, false, true)');
      console.log('  saltar caminando:', JSON.stringify(s1));
      ok(s1.alturaSalto > 0.6 && s1.alturaSalto < 1.1, `el salto sube lo de siempre (~0,8 m): ${s1.alturaSalto}`);
      const s2 = await N('N.andar(0.7, 1.6, true, true)');
      console.log('  saltar corriendo:', JSON.stringify(s2));
      // 2. el valle a pie: puntos al azar (sembrados), correr 3 s en un rumbo: saltar solo, hundirse, trabarse
      const rnd = (() => { let k = 12345; return () => { k ^= k << 13; k >>>= 0; k ^= k >>> 17; k ^= k << 5; k >>>= 0; return k / 4294967296; }; })();
      const raros = [];
      const NPUNTOS = Number(process.env.HUMO_PUNTOS || 70);
      for (let i = 0; i < NPUNTOS; i++) {
        const x = (rnd() - 0.5) * 640, z = (rnd() - 0.5) * 640, yaw = rnd() * 6.283;
        const seco = await N(`!T.agua(${x}, ${z})`);
        if (!seco) continue;
        await N(`(J.ubicar(${x}, ${z}, ${yaw}), N.tick(0.15))`);
        const r = await N(`N.andar(${yaw}, 3, true)`);
        const trabado = r.avance < 1.5 && !(await N(`N.algoCerca(${x}, ${z}, 2.5)`));
        if (r.subeSolo || r.hundido > 2 || trabado) raros.push({ desde: [+x.toFixed(1), +z.toFixed(1), +yaw.toFixed(2)], ...r, trabado });
      }
      console.log(`  ${NPUNTOS} corridas al azar: ${raros.length} raras`);
      for (const r of raros) console.log('   ', JSON.stringify(r));
      fs.writeFileSync(path.join(salida, 'fisica-raros.json'), JSON.stringify(raros));
      // 3. nadar: del muelle hacia el lago y volver a la orilla
      const m = await N('(() => { const M = T.lugares.muelle; return M ? { x: M.x, z: M.z, ang: M.ang } : null })()');
      if (m) {
        const yawLago = Math.atan2(-Math.cos(m.ang), -Math.sin(m.ang));
        await N(`(J.ubicar(${m.x - Math.cos(m.ang) * 4 + Math.sin(m.ang) * 6}, ${m.z - Math.sin(m.ang) * 4 - Math.cos(m.ang) * 6}, ${yawLago}), N.tick(0.3))`);
        const ida = await N(`N.andar(${yawLago}, 9, true)`);
        const vuelta = await N(`N.andar(${yawLago + Math.PI}, 12, true)`);
        console.log('  al lago:', JSON.stringify(ida), ' · de vuelta:', JSON.stringify(vuelta));
        ok(ida.nado, 'entrando al lago se nada');
        ok(!(await N('J.estado.nadando')), 'nadando de vuelta se sale a la orilla');
      }
      // 4. contra la pared del refugio: correr hacia el centro desde afuera; la cámara no entra en la pared
      const ref = await N('(() => { const L = T.lugares.refugio; return { x: L.x, z: L.z } })()');
      for (const [k, a] of [[0, 0], [1, 1.57], [2, 3.14], [3, 4.71]]) {
        const x = ref.x + Math.sin(a) * 9, z = ref.z + Math.cos(a) * 9, yaw = Math.atan2(-(ref.x - x), -(ref.z - z));
        await N(`(J.ubicar(${x}, ${z}, ${yaw}), N.tick(0.2))`);
        const r = await N(`N.andar(${yaw}, 4, true)`);
        const dCentro = Math.hypot(r.x - ref.x, r.z - ref.z);
        console.log(`  contra el refugio (${k}): quedó a ${dCentro.toFixed(2)} m del centro`, JSON.stringify(r));
        await foto(`f-pared-${k}`, 0.4);
      }
    });

    // cuánto cuesta el agua: ms por cuadro (con gl.finish: CPU + placa) mirando la cascada, el arroyo y el lago, 3 rondas de 90 cuadros;
    // se corre igual con HTML=<la 4.29.2> para comparar en la misma PC
    await seccion('medir', async () => {
      const s = await N('(() => { const s = T.saltoAgua; return { x: s.x, z: s.z, ang: s.ang, arriba: s.arriba, abajo: s.abajo } })()');
      const dx = Math.sin(s.ang), dz = Math.cos(s.ang);
      const r = await N('(() => { const R = T.rio, i = Math.floor(R.length * 0.3), p = R[i], q = R[i + 2]; const ux = q.x - p.x, uz = q.z - p.z, l = Math.hypot(ux, uz) || 1; return { x: p.x, z: p.z, w: p.w, s: p.s, ux: ux / l, uz: uz / l } })()');
      const vistas = {
        cascada: `N.mirarDesde(${s.x + dx * 12}, ${s.z + dz * 12}, 1.6, ${s.x}, ${(s.arriba + s.abajo) / 2}, ${s.z}, 11)`,
        arroyo: `N.mirarDesde(${r.x - r.uz * (r.w + 4) - r.ux * 6}, ${r.z + r.ux * (r.w + 4) - r.uz * 6}, 1.6, ${r.x + r.ux * 4}, ${r.s}, ${r.z + r.uz * 4}, 11)`,
      };
      const res = {};
      for (let ronda = 0; ronda < 3; ronda++) for (const [k, v] of Object.entries(vistas)) {
        await N(v); await N('N.tick(1.5)');
        const ms = await N(`(() => { const gl = H.renderer.getContext(); for (let i = 0; i < 10; i++) H.__bucle(); gl.finish(); const t0 = performance.now(); for (let i = 0; i < 90; i++) { H.__bucle(); gl.finish(); } return (performance.now() - t0) / 90 })()`);
        (res[k] ??= []).push(+ms.toFixed(2));
      }
      for (const [k, v] of Object.entries(res)) console.log(`  ${k}: ${v.join(' · ')} ms → mediana ${[...v].sort((a, b) => a - b)[1]}`);
    });

    // soltar con V arriba del puente de troncos: lo soltado queda sobre el tablero (no cae al arroyo de abajo) y se guarda con su altura
    await seccion('soltar', async () => {
      const b = (await N('N.puentes()')).find((q) => q.tipo === 'troncos');
      await N(`(J.ubicar(${b.x - b.ux * 2}, ${b.z - b.uz * 2}, ${Math.atan2(-b.ux, -b.uz)}, ${b.alto} + 0.05), P.ramitas = 6, H.__refrescarBarra && H.__refrescarBarra(), N.tick(0.5))`);
      let ranura = '';
      for (let i = 1; i <= 9 && !/ramit/i.test(ranura); i++) { await N(`(N.abajo('Digit${i}'), N.arriba('Digit${i}'), N.tick(0.1))`); ranura = await N('H.__ranuraActual()'); }
      console.log('  ranura:', ranura, '· parado a', await N(`+(J.estado.pos.y - ${b.alto}).toFixed(2)`), 'm del tablero');
      const antes = await N('(P.soltados || []).length');
      await N(`(N.abajo('KeyV'), N.arriba('KeyV'), N.tick(0.5))`);
      const s = await N('(P.soltados || []).slice(-1)[0] || null');
      console.log('  soltados:', antes, '→', await N('(P.soltados || []).length'), JSON.stringify(s), '· terreno ahí', s ? await N(`+T.altura(${s.x}, ${s.z}).toFixed(2)`) : '-');
      ok(!!s && Number.isFinite(s.y) && Math.abs(s.y - b.alto) < 0.3, `lo soltado arriba del puente queda sobre el tablero (y ${s && s.y} / tablero ${b.alto})`);
      await N(`N.camara(${b.x - b.ux * 4.5}, ${b.alto + 1.2}, ${b.z - b.uz * 4.5}, ${Math.atan2(-b.ux, -b.uz)}, -0.45, 11)`);
      await foto('s-ramita-en-el-puente');
      await N('N.sinCamara()');
    });

    // (Ultra) las huellas en las lajas de la plaza: caminar de verdad por un sendero de laja y mirarlo; en seco y con lluvia
    await seccion('lajas', async () => {
      const s = await N(`(() => { const A = H.__aldeaMundo && H.__aldeaMundo(); const st = A && A.estadoEdificio('plaza'); if (!st) return null; const s = st.sitio; const g = s.rot + 0.9; return { x: s.x, z: s.z, fx: Math.sin(g), fz: Math.cos(g) } })()`);
      console.log('  plaza:', JSON.stringify(s));
      if (!s) return;
      for (const lluvia of [false, true]) {
        await N(`(() => { const e = H.clima.estado, U = H.__U(); H.ajustes.clima = ${lluvia} ? 'lluvia' : 'despejado'; e.nublado = ${lluvia} ? 0.95 : 0.15; e.lluvia = ${lluvia} ? 1 : 0; e.objetivo = ${lluvia} ? 'lluvia' : 'despejado'; e.proximo = e.objetivo; e.t = 1e9; if (U.uMojado) U.uMojado.value = ${lluvia} ? 1 : 0; P.horas = 11.5; const u = H.__ultraVida && H.__ultraVida(); if (u && u.finas) { u.finas.datos.fill(0); u.finas.tex.needsUpdate = true; } return 1 })()`);
        const cam = `N.camara(${s.x + s.fx * 7.5}, T.altura(${s.x + s.fx * 7.5}, ${s.z + s.fz * 7.5}) + 1.7, ${s.z + s.fz * 7.5}, ${Math.atan2(s.fx, s.fz)}, -0.62, 11.5)`;
        await N(cam); await foto(`l-${lluvia ? 'lluvia' : 'seco'}-antes`, 1.5); await N('N.sinCamara()');
        // tres pasadas a pie por el sendero de laja (de la plaza hacia afuera y de vuelta, corridas un poco a los costados)
        for (const [lat, ida] of [[-0.5, 1], [0.4, -1], [0, 1]]) {
          const x0 = s.x + s.fx * (ida > 0 ? 1.5 : 6.5) + s.fz * lat, z0 = s.z + s.fz * (ida > 0 ? 1.5 : 6.5) - s.fx * lat;
          const yaw = Math.atan2(-s.fx * ida, -s.fz * ida);
          await N(`(J.ubicar(${x0}, ${z0}, ${yaw}), N.tick(0.2))`);
          await N(`N.andar(${yaw}, 3.2, false)`);
        }
        const n = await N(`(() => { const u = H.__ultraVida && H.__ultraVida(); let n = 0; if (u && u.finas) for (const v of u.finas.datos) if (v) n++; return n })()`);
        console.log(`  ${lluvia ? 'con lluvia' : 'en seco'}: téxeles con pisada ${n}`);
        await N(cam); await foto(`l-${lluvia ? 'lluvia' : 'seco'}-despues`, 0.6); await N('N.sinCamara()');
      }
      await N("(H.ajustes.clima = 'despejado', H.clima.estado.lluvia = 0, H.clima.estado.objetivo = 'despejado', 1)");
    });

    // la gente de ruta que camina en el lugar (en la partida larga: Ramón junto al puesto, varias veces): dónde, hacia qué etapa y qué la frena
    await seccion('ramon', async () => {
      const claves = (process.env.HUMO_GENTE || 'ramon,ema').split(',');
      const info = await N(`(() => { const out = {}; for (const k of ${JSON.stringify(claves)}) { const g = H.gente.gente.find((q) => q.clave === k); if (!g) continue;
        out[k] = { pos: [+g.pos.x.toFixed(1), +g.pos.z.toFixed(1)], ruta: (g.ruta || []).map((e) => { const q = { x: e.x, z: e.z, y: T.altura(e.x, e.z) }; col.resolver(q, 0.3, 1.6); return { x: +e.x.toFixed(2), z: +e.z.toFixed(2), empujado: +Math.hypot(q.x - e.x, q.z - e.z).toFixed(2), agua: !!T.agua(e.x, e.z) }; }) }; } return out })()`.replace('col.resolver', 'H.col.resolver'));
      console.log('  gente:', JSON.stringify(info));
      const k0 = Object.keys(info)[0]; if (!k0) return;
      const g0 = info[k0].pos;
      await N(`(J.ubicar(${g0[0] + 14}, ${g0[1] + 14}, 0), N.tick(0.5))`);
      const traza = await N(`(async () => { const t = []; const t0 = performance.now(); while (performance.now() - t0 < 80000) { await N.tick(2); const o = {}; for (const k of ${JSON.stringify(claves)}) { const g = H.gente.gente.find((q) => q.clave === k); if (!g) continue; const e = g.ruta ? g.ruta[g.etapa % g.ruta.length] : null; o[k] = [+g.pos.x.toFixed(2), +g.pos.z.toFixed(2), +(g.vel || 0).toFixed(2), g.etapa, e ? +Math.hypot(e.x - g.pos.x, e.z - g.pos.z).toFixed(2) : null, +(g.espera || 0).toFixed(1)]; } t.push(o); } return t })()`);
      for (const k of claves) {
        const s = traza.map((o) => o[k]).filter(Boolean);
        const quieto = s.filter((q, i) => i > 0 && q[2] > 0.2 && Math.hypot(q[0] - s[i - 1][0], q[1] - s[i - 1][1]) < 0.1);
        console.log(`  ${k}: ${s.length} muestras, caminando sin moverse ${quieto.length}`, JSON.stringify(s.slice(0, 40)));
      }
    });

    // el refugio por dentro: correr hacia el centro desde 8 rumbos; dónde frena, por dónde pasa (la traza), la puerta y lo que choca cerca
    await seccion('refugio', async () => {
      const info = await N(`(() => { const L = T.lugares.refugio; const ps = (H.puertas && H.puertas.lista || []).filter((p) => Math.hypot(p.x - L.x, p.z - L.z) < 12).map((p) => ({ x: +p.x.toFixed(1), z: +p.z.toFixed(1), abierta: p.abierta, nombre: p.nombre })); return { x: L.x, z: L.z, y: L.y, rot: L.rot, puertas: ps } })()`);
      console.log('  refugio:', JSON.stringify(info));
      for (const correr of [false, true]) for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4, x = info.x + Math.sin(a) * 9, z = info.z + Math.cos(a) * 9, yaw = Math.atan2(-(info.x - x), -(info.z - z));
        await N(`(J.ubicar(${x}, ${z}, ${yaw}), N.tick(0.2))`);
        const traza = await N(`(async () => { N.soltarTodo(); N.abajo('KeyW'); if (${correr}) N.abajo('ShiftLeft'); const t = []; const t0 = performance.now(); let n = 0; while (performance.now() - t0 < 4500) { J.estado.yaw = ${yaw}; H.__bucle(); await new Promise((r) => setTimeout(r, 14)); if (n++ % 8 === 0) { const p = J.estado.pos; t.push([+(p.x - ${info.x}).toFixed(2), +(p.z - ${info.z}).toFixed(2), +(p.y - ${info.y}).toFixed(2)]); } } N.soltarTodo(); return t })()`);
        const dmin = Math.min(...traza.map((q) => Math.hypot(q[0], q[1])));
        const fin = traza[traza.length - 1];
        console.log(`  ${correr ? "corriendo" : "caminando"} rumbo ${k} (${(a * 57.3).toFixed(0)}°): lo más cerca del centro ${dmin.toFixed(2)} m, terminó en (${fin[0]}, ${fin[1]}) ${Math.hypot(fin[0], fin[1]).toFixed(2)} m`);
        if (dmin < 2.5) console.log('    traza', JSON.stringify(traza));
      }
    });

    await seccion('zonas', async () => {
      const L = await N(`(() => { const out = []; for (const k of ['refugio', 'muelle', 'puente', 'mallin', 'mirador', 'arrayanes', 'faro', 'cabana', 'puesto', 'molino', 'casa-te', 'torre', 'estacion', 'galpon', 'almacen', 'cueva']) { const l = T.lugares[k]; if (l) out.push({ k, x: l.x, z: l.z }); } const pa = (H.tren && H.tren.paradas || []).find((q) => q.aldea); const c = pa && (pa.anden || pa); if (c) out.push({ k: 'aldea', x: c.x + 25, z: c.z }); return out })()`);
      console.log('  lugares:', L.map((l) => l.k).join(' '));
      for (const l of L) {
        // pararse en 24 puntos alrededor: nadie queda debajo del piso ni cae en un hueco
        const r = await N(`(async () => { const malos = []; for (let i = 0; i < 24; i++) { const a = i * 0.785 + (i >> 3) * 0.3, d = 3 + (i >> 3) * 6; const x = ${l.x} + Math.sin(a) * d, z = ${l.z} + Math.cos(a) * d; if (T.agua(x, z)) continue; J.ubicar(x, z, a); await N.tick(0.12); const p = J.estado.pos, t = T.altura(p.x, p.z); if (p.y < t - 0.1 || p.y > t + 6) malos.push([+x.toFixed(1), +z.toFixed(1), +(p.y - t).toFixed(2)]); } return malos })()`);
        if (r.length) console.log(`  [${l.k}] parado raro:`, JSON.stringify(r));
        await N(`N.mirarDesde(${l.x + 16}, ${l.z + 16}, 2.2, ${l.x}, T.altura(${l.x}, ${l.z}) + 1.5, ${l.z}, 11)`);
        await foto(`z-${l.k}`);
      }
    });

    // la partida larga (HUMO_MINUTOS, 120 por defecto): se recorre el valle de lugar en lugar a pie (corriendo) y se mide cada minuto la
    // memoria (JS y lo que guarda la placa: geometrías, texturas, programas) y los ms del cuadro: si crece o se pone lento
    await seccion('largo', async () => {
      const MIN = Number(process.env.HUMO_MINUTOS || 120);
      const lugares = await N(`(() => Object.entries(T.lugares).filter(([k, l]) => l && Number.isFinite(l.x)).map(([k, l]) => ({ k, x: l.x, z: l.z })))()`);
      const filas = [];
      // HUMO_RASTRO=1: anota quién crea cada textura de la placa (y cuáles se borran) para saber de dónde salen las que crecen
      if (process.env.HUMO_RASTRO === '1') await N(`(() => { const gl = H.renderer.getContext(); const vivas = window.__TEX = new Map(); const c0 = gl.createTexture.bind(gl), d0 = gl.deleteTexture.bind(gl);
        gl.createTexture = () => { const t = c0(); vivas.set(t, { t: performance.now(), pila: (new Error().stack || '').split('\\n').slice(2, 9).map((l) => l.trim().replace(/\\(.*index\\.html/, '(').slice(0, 90)).join(' < ') }); return t; };
        gl.deleteTexture = (t) => { vivas.delete(t); return d0(t); }; return 1 })()`);
      const t0 = Date.now();
      let i = 0;
      while (Date.now() - t0 < MIN * 60000) {
        const l = lugares[i % lugares.length]; i++;
        await N(`(J.ubicar(${l.x + 6}, ${l.z + 6}, ${(i * 1.3) % 6.28}), N.tick(0.2))`);
        const t1 = Date.now();
        while (Date.now() - t1 < 55000) await N(`N.andar(${(i * 0.7 + Math.random()) % 6.28}, 4, true)`);
        const f = await N(`(() => { const G0 = (H.gente && H.gente.gente || []).filter((g) => g && g.pos && g.g && g.g.visible).map((g) => ({ g, x: g.pos.x, z: g.pos.z })); const t0 = performance.now(); for (let k = 0; k < 30; k++) H.__bucle(); const ms = (performance.now() - t0) / 30; const trabados = G0.filter((q) => (q.g.vel || 0) > 0.2 && Math.hypot(q.g.pos.x - q.x, q.g.pos.z - q.z) < 0.05).map((q) => (q.g.clave || q.g.nombre || '?') + '@' + q.x.toFixed(0) + ',' + q.z.toFixed(0)); const m = H.renderer.info.memory; return { min: +((performance.now()) / 60000).toFixed(1), ms: +ms.toFixed(1), heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1, geos: m.geometries, tex: m.textures, prog: H.renderer.info.programs.length, lugar: '${l.k}', trabados }; })()`);
        filas.push(f);
        console.log('  ', JSON.stringify(f));
        fs.writeFileSync(path.join(salida, 'largo.json'), JSON.stringify(filas));
      }
      if (process.env.HUMO_RASTRO === '1') {
        const r = await N(`(() => { const g = {}; for (const v of window.__TEX.values()) (g[v.pila] = g[v.pila] || []).push(Math.round(v.t / 60000)); return Object.entries(g).sort((a, b) => b[1].length - a[1].length).slice(0, 12).map(([p, ts]) => ({ n: ts.length, minutos: ts.slice(0, 12), pila: p })) })()`);
        console.log('  texturas vivas creadas durante la partida, por quién:');
        for (const q of r) console.log('   ', JSON.stringify(q));
      }
      const a = filas.slice(1, 4), b = filas.slice(-3);
      const med = (L, k) => L.reduce((s, f) => s + f[k], 0) / Math.max(1, L.length);
      console.log(`  al empezar: heap ${med(a, 'heap').toFixed(0)} MB, geometrías ${med(a, 'geos').toFixed(0)}, texturas ${med(a, 'tex').toFixed(0)}, ${med(a, 'ms').toFixed(1)} ms · al final: heap ${med(b, 'heap').toFixed(0)} MB, geometrías ${med(b, 'geos').toFixed(0)}, texturas ${med(b, 'tex').toFixed(0)}, ${med(b, 'ms').toFixed(1)} ms`);
    });

    if (extra) for (const [nombre, fn] of Object.entries(extra)) await seccion(nombre, () => fn({ N, js, foto, ok, salida, esperar }));
    console.log('\n  programas:', prog0, '→', await N('N.programas()'));
    // todas las calidades, con Ultra prendido y apagado: carga sin errores, la plaza y el mapa (M) y el menú (Esc) abren y cierran
    if (parte('calidades')) {
      donde = 'calidades';
      console.log('\n=== calidades');
      const lista = process.env.HUMO_CALIDADES ? process.env.HUMO_CALIDADES.split(',').map((q) => [q.split(':')[0], q.split(':')[1] === '1']) : [['muybaja', false], ['baja', false], ['media', false], ['alta', false], ['alta', true], ['media', true]];
      for (const [cal, ul] of lista) {
        const antes = errores.length;
        await abrir({ calidad: cal, ultra: ul }, false);
        await entrar();
        await N('(() => { H.clima.estado.lluvia = 0; P.horas = 11; return 1 })()');
        const pa = await N('(() => { const p = (H.tren.paradas || []).find((q) => q.aldea); const c = p && (p.anden || p); return c ? { x: c.x, z: c.z } : null })()');
        if (pa) await N(`N.mirarDesde(${pa.x + 25}, ${pa.z + 12}, 1.7, ${pa.x + 40}, T.altura(${pa.x + 40}, ${pa.z}) + 2, ${pa.z}, 11)`);
        await foto(`q-${cal}${ul ? '-ultra' : ''}`, 2);
        await N('N.sinCamara()');
        const menus = await N(`(async () => { const r = {}; N.abajo('KeyM'); N.arriba('KeyM'); await N.tick(0.5); r.mapa = !document.getElementById('mapa')?.classList.contains('oculto'); N.abajo('KeyM'); N.arriba('KeyM'); await N.tick(0.3);
          N.abajo('Escape'); N.arriba('Escape'); await N.tick(0.4); r.pausa = !document.getElementById('pausa')?.classList.contains('oculto'); r.programas = H.renderer.info.programs.length; r.ultra = !!H.ajustes.ultra; return r })()`);
        console.log(`  ${cal}${ul ? ' + Ultra' : ''}:`, JSON.stringify(menus), errores.length > antes ? 'ERRORES: ' + errores.slice(antes).join(' | ') : 'sin errores');
      }
    }
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
