// Partida real 4.17.0 (parte C): el pulido de las escenas de los actos I y II de la Historia, mirado a ojo.
//   V. las 58 escenas, una por una, por el camino real (la colocación del jugador, el disparo) y con seis cuadros cada una (planos del principio,
//      del medio y del final del diálogo) armados en una hoja de contacto por escena. Con HUMO_FASE=antes|despues se nombran las hojas.
//   P. los props nuevos (foto movida, llavecita, diez cantos blancos, tropa de mulas) y las escenas que antes no tenían disparador (tablas-tito,
//      foto-sofia, mulas-belisario), con sus interacciones.
//   S. los programas de shader: ninguno nuevo en juego, y el del molino viejo / el faro de día ya compilado en la carga.
// Uso (después de `node armar.mjs`), en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-17-0-pulido.cjs -Espera 1800 -Perfil <carpeta propia> -Visible
// Variables: HUMO_SOLO=V,P,S (secciones), HUMO_FASE=antes|despues, HUMO_ESC=id1,id2 (sólo esas escenas), HUMO_SALIDA=<carpeta>, HUMO_CAPTURAS=0.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const FASE = process.env.HUMO_FASE || 'despues';
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'pulido-4-17-0'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 40 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 40 * 60 * 1000).unref?.();
const SOLO = (process.env.HUMO_SOLO || '').split(',').filter(Boolean);
const toca = (n) => !SOLO.length || SOLO.includes(String(n));
const SOLO_ESC = (process.env.HUMO_ESC || '').split(',').filter(Boolean);

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, J = H.jugador, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.hasta = async (f, max = 20) => { const t0 = performance.now(); while (performance.now() - t0 < max * 1000) { if (f()) return 1; H.__bucle(); await dormir(14); } return 0; };
  N.tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); return 1; };
  N.tarjeta = () => {
    const v = document.getElementById('valle-tarjeta');
    if (!v || v.classList.contains('oculto')) return null;
    return { titulo: (v.querySelector('h2') || {}).textContent, arriba: (v.querySelector('.arriba') || {}).textContent, texto: [...v.querySelectorAll('p')].map((p) => p.textContent).join(' | '), lista: [...v.querySelectorAll('li')].map((l) => l.textContent), opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => ({ id: b.dataset.valleOpcion, texto: b.textContent, deshabilitada: b.disabled })) };
  };
  N.elegir = (id) => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + id + '"]'); if (b) b.click(); return !!b; };
  N.despejar = async (maxSeg = 6, o = {}) => {
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (es && es.activa()) {
        const d = es.director.datos && es.director.datos();
        if (d && d.eleccion) { N.tecla((o.eleccion && o.eleccion[d.eleccion.id]) || 'Digit1'); await N.tick(0.3); continue; }
        if (o.avanzar) { N.tecla('Enter'); await N.tick(0.25); continue; }
        if (es.director.fase() === 'corriendo') N.tecla('Escape');
        await dormir(120);
        if (es.activa() && es.director.fase() === 'corriendo') N.tecla('Escape');
        await N.tick(0.4); continue;
      }
      await N.tick(0.4);
      if (!(es && es.activa())) break;
    }
    return 1;
  };
  N.h = () => P.historia;
  N.ir = (x, z, yaw = 0) => { J.ubicar(x, z, yaw); return 1; };
  N.pts = () => H.__puntosHistoria();
  // los duendes de la historia que hay ahora: estado, dónde y a cuántos metros del jugador
  N.duendes = () => { const dh = H.__duendesHist && H.__duendesHist(); const j = J.estado.pos; return dh ? dh.lista().map((d) => { const p = d.posicion; return { e: d._s ? d._s.estado : '?', x: +p.x.toFixed(1), z: +p.z.toFixed(1), d: +Math.hypot(p.x - j.x, p.z - j.z).toFixed(1) }; }) : []; };
  N.preparar = (cap, extra = {}) => {
    const h = P.historia;
    h.activa = true; h.empezada = 1; h.version = 2; h.capitulo = cap; h.fase = 'intro'; h.base = {}; h.hechos = {}; h.momentos = {};
    h.cerrados = {}; ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha'].slice(0, cap).forEach((k) => { h.cerrados[k] = (extra.dia || P.dia) - 1; });
    if (extra.decisiones) Object.assign(h.decisiones, extra.decisiones);
    h.entregasVistas = P.comercio ? Math.floor(Number(P.comercio.entregas) || 0) : 0;
    return 1;
  };
  N.levantar = (id, lugares) => {
    const O = H.obras;
    Object.assign(P.materiales, { tronco: 80, tabla: 80, piedra: 80 });
    const p = H.PLANOS.find((q) => q.id === id); if (!p) return { error: 'no hay plano ' + id };
    for (const [x, z, yaw] of lugares) {
      O.elegir(p); const r = O.fundar(x, z, yaw, T.altura(x, z)); if (!r.ok) continue;
      for (let g = 0; g < 14 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const k = O.avanzar(r.obra, P.materiales); if (!k.ok) break; }
      O.elegir(null); P.obras = O.obras.map((o) => o.datos);
      return { ok: r.obra.datos.etapas >= r.obra.plano.etapas.length, x: r.obra.datos.x, z: r.obra.datos.z, rot: r.obra.datos.rot };
    }
    O.elegir(null); return { error: 'no hubo lugar para ' + id };
  };
  N.alrededor = (x, z, radios, pasos = 12) => { const l = []; for (const r of radios) for (let i = 0; i < pasos; i++) { const a = (i / pasos) * Math.PI * 2; l.push([x + Math.cos(a) * r, z + Math.sin(a) * r, a]); } return l; };
  N.sitioMolino = () => {
    const O = H.obras, rio = T.rio, pm = H.PLANOS.find((q) => q.id === 'molino-agua');
    const ref = T.lugares.refugio;
    const orden = rio.map((p, i) => ({ i, d: Math.hypot(p.x - ref.x, p.z - ref.z) })).sort((a, b) => a.d - b.d).filter((q, k) => k % 3 === 0).slice(0, 40);
    for (const { i } of orden) {
      const a = rio[i], b = rio[Math.min(rio.length - 1, i + 1)];
      const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
      for (const lado of [1, -1]) for (const d of [4, 5, 6, 7]) {
        const x = a.x + nx * d * lado, z = a.z + nz * d * lado, rot = Math.atan2(nz * lado, -nx * lado);
        O.elegir(pm); const m = O.moverFantasma(x, z, rot, T.altura(x, z)); O.elegir(null);
        if (m && m.ok) return [x, z, rot];
      }
    }
    return null;
  };
  // dónde está una persona o un punto (para ponerse cerca)
  N.donde = (q) => {
    if (q && q.npc) { const p = H.__escenas.mundo.posicion(q.npc); return p ? { x: p.x, z: p.z } : null; }
    const pts = Object.assign({}, T.lugares, H.__puntosHistoria());
    const l = pts[q.p]; return l && Number.isFinite(l.x) ? { x: l.x, z: l.z } : null;
  };
  // los de gente-campo (Fermín, Belisario, Tobías) sólo existen cuando te acercás: te lleva a su lugar y espera a que se arme
  N.armarCerca = async (clave) => {
    const ya = H.__escenas.mundo.posicion(clave); if (ya && H.__genteCampo().npcDe(clave)) return true;
    const sitio = { fermin: () => T.lugares.galpon, belisario: () => ({ x: -347, z: -159 }), tobias: () => ({ x: -394, z: -305 }) }[clave];
    if (!sitio) return false;
    const l = sitio(); N.ir(l.x + 6, l.z + 6, 0);
    await N.hasta(() => H.__genteCampo().npcDe(clave), 25);
    await N.tick(0.5);
    return !!H.__genteCampo().npcDe(clave);
  };
  // el jugador en un punto local del refugio (x a la derecha, z hacia donde mira la puerta), mirando a otro (como la colocación de 4.16.0)
  N.enRefugio = (lx, lz, mx, mz) => {
    const r = T.lugares.refugio, c = Math.cos(r.rot || 0), s = Math.sin(r.rot || 0);
    const a = { x: r.x + lx * c + lz * s, z: r.z - lx * s + lz * c }, b = { x: r.x + mx * c + mz * s, z: r.z - mx * s + mz * c };
    N.ir(a.x, a.z, Math.atan2(-(b.x - a.x), -(b.z - a.z))); H.jugador.estado.pitch = -0.2; return true;
  };
  // el jugador a (dx, dz) de un punto o una persona, mirando hacia ella (o hacia donde dice el yaw)
  N.parar = (q, dx = 0, dz = 0, mirar = true) => {
    const l = N.donde(q); if (!l) return false;
    const x = l.x + dx, z = l.z + dz;
    N.ir(x, z, mirar ? Math.atan2(-(l.x - x), -(l.z - z)) || 0 : 0);
    return true;
  };
  return 1;
})()`;

// ---------------------------------------------------------------- las 58 escenas: [id, capítulo (0 a 7), dónde, hora, previo, cómo]
// dónde: { p: punto, dx, dz } o { npc: clave, dx, dz }. El jugador empieza ahí (en la prueba «antes»: donde lo dejaría el disparador; en la «después»,
// además, pasa por la colocación del juego). cómo: 'auto' | 'forzar' | 'hablar:<clave>' | 'obj:<id>'
const E = (p, dx = 0, dz = 0) => ({ p, dx, dz });
const L = (lx, lz, mx, mz) => ({ loc: [lx, lz, mx, mz] });   // un punto local del refugio y hacia dónde mira (para las del cuaderno, que se leen en la mesa)
const FB = { panadera: E('panaderia', 4, 4), carpintero: E('carpinteria', 4, 3), fotografa: E('estudio-fotos', 4, 3), abuela: E('plaza', 3, 3), tobias: E('cantera', 6, 6), ramon: E('puesto', 4, 0), ema: E('refugio-puerta', 0, 8), belisario: E('puesto-paso', 4, 4), nicanor: E('muelle', 0, 3), fermin: E('galpon', 4, 4), ercilia: E('ramos', 0, 3) };
const Q = (npc, dx = 2.2, dz = 0) => ({ npc, dx, dz, fb: FB[npc] || null });
const ESCENAS = [
  // acto I
  ['trochita-boleto', 0, E('estacion', 3, 1.5), 18, '', 'forzar'],
  ['estacion-llegada', 0, E('estacion', 0, 0), 18.4, "h.escenas.vistas['trochita-boleto'] = 1", 'forzar'],
  ['algo-cruza', 0, E('sendero', 0, 0), 18.6, '', 'forzar'],
  ['nota-eusebio', 0, E('refugio-puerta', 0, 0), 19, 'P.dia = 1', 'puerta'],
  ['ronda-umbral', 0, E('refugio-puerta', 0, 6), 7, "P.dia = 2; h.escenas.vistas['nota-eusebio'] = 1", 'forzar'],
  ['ramon-tranquera', 1, E('refugio-puerta', 0, 8), 8.2, '', 'forzar'],
  ['almacen-ercilia', 1, E('ramos', 0, 3), 11, '', 'forzar'],
  ['ese-no-josefina', 1, E('sendero', 12, 4), 11, "P.cosas.hacha = 1", 'forzar'],
  ['bolsa-alero', 1, E('refugio-puerta', 3, 6), 11, 'h.reparaciones.alero = 4', 'forzar'],
  ['bolsa-coihue', 1, E('molino-viejo', 2, 2), 11, "h.decisiones.bolsa = 'a'", 'forzar'],
  ['bolsa-rosa', 1, Q('panadera'), 11, "h.decisiones.bolsa = 'b'", 'forzar'],
  ['bolsa-josefina', 1, Q('ema'), 11, "h.decisiones.bolsa = 'c'", 'forzar'],
  ['hacha-tocon', 2, E('tocon-hacha', 0, 6), 8, '', 'forzar'],
  ['placa-herminia', 2, E('plaza', 2, 2), 11, '', 'forzar'],
  ['mesa-visita-nicanor', 2, E('refugio-puerta', 0, 5), 16.5, '', 'forzar'],
  ['mesa-visita-ramon', 2, E('refugio-puerta', 0, 5), 16.5, '', 'forzar'],
  ['fermin-galpon', 2, Q('fermin'), 11, '', 'forzar'],
  ['anden-graciela', 3, E('estacion', 0, 0), 10, '', 'forzar'],
  ['cabina-elsa', 3, E('estacion', 0, 0), 11, "h.escenas.vistas['anden-graciela'] = 1", 'forzar'],
  ['derrumbe-puertita', 3, E('sendero', 0, 0), 10, "h.escenas.vistas['anden-graciela'] = 1", 'forzar'],
  ['te-graciela', 3, E('casa-te', 3, 3), 16, "h.escenas.vistas['anden-graciela'] = 1", 'forzar'],
  // acto II
  ['piedras-molino', 4, E('molino-viejo', 3, 3), 10, "h.decisiones.bolsa = 'c'", 'forzar'],
  ['zaino-ramon', 4, Q('ramon'), 10, '', 'forzar'],
  ['tito-coihue', 4, E('molino-viejo', 4, 2), 10, '', 'forzar'],
  ['coihue-en-pie', 4, E('aserradero-propio', 4, 2), 10, "h.decisiones.coihue = 'a'", 'forzar'],
  ['coihue-talado', 4, E('coihue', 5, 2), 10, "h.decisiones.coihue = 'b'", 'forzar'],
  ['tobias-pirca', 4, Q('tobias'), 10, "h.decisiones.coihue = 'c'", 'forzar'],
  ['rueda-gira', 4, E('molino-propio', 4, 2), 10, "h.decisiones.coihue = 'a'", 'forzar'],
  ['trigo-abuelo', 4, Q('ema'), 10, "h.decisiones.bolsa = 'c'", 'forzar'],
  ['tablas-tito', 4, Q('carpintero'), 10, "h.decisiones.coihue = 'b'", 'forzar'],
  ['truchas-nicanor', 4, E('muelle', 0, 3), 10, '', 'forzar'],
  ['luces-lago-nicanor', 5, E('muelle', 0, 3), 20.6, '', 'forzar'],
  ['el-que-vuela', 5, E('faro', 8, 8), 23.5, '', 'forzar'],
  ['guardia-molino', 5, E('molino-viejo', 5, 2), 0.8, "h.decisiones.coihue = 'a'", 'forzar'],
  ['huellas-escarcha', 5, E('molino-viejo', 3, 3), 7, "h.escenas.vistas['guardia-molino'] = 1", 'forzar'],
  ['ramon-raiz', 5, E('raiz-ramon', 3, 3), 7.5, "h.escenas.vistas['guardia-molino'] = 1", 'forzar'],
  ['perdidas-devueltas', 5, Q('ercilia'), 11, '', 'forzar'],
  ['masa-crece', 5, Q('panadera'), 11, "h.decisiones.bolsa = 'b'", 'forzar'],
  ['foto-sofia', 5, Q('fotografa'), 11, '', 'forzar'],
  ['primera-molienda', 6, E('molino-propio', 2.5, 2.5), 9, '', 'forzar'],
  ['molienda-fletes', 6, E('estacion', 0, 0), 12, "h.decisiones.molienda = 'a'", 'forzar'],
  ['molienda-fiado', 6, Q('ercilia'), 11, "h.decisiones.molienda = 'b'", 'forzar'],
  ['molienda-partir', 6, E('molino-viejo', 3, 3), 11, "h.decisiones.molienda = 'c'", 'forzar'],
  ['minga-aldea', 6, E('plaza', 3, 3), 11, '', 'forzar'],
  ['fermin-mulas', 6, Q('fermin'), 11, "h.escenas.vistas['minga-aldea'] = 1", 'forzar'],
  ['galpon-ronda', 6, E('galpon-propio', 3, 4), 6.5, "h.escenas.vistas['minga-aldea'] = 1", 'forzar'],
  ['cuaderno-1', 7, L(0.2, 0.4, 1.1, -0.98), 11, '', 'forzar'],
  ['cuaderno-2', 7, L(0.2, 0.4, 1.1, -0.98), 11, '', 'forzar'],
  ['cuaderno-3', 7, L(0.2, 0.4, 1.1, -0.98), 11, '', 'forzar'],
  ['libreta-fiado', 7, Q('ercilia'), 11, '', 'forzar'],
  ['cuaderno-abuelo', 7, Q('ema'), 11, '', 'forzar'],
  ['los-del-cerro', 7, Q('belisario'), 11, '', 'forzar'],
  ['secreto-ramon', 7, Q('ramon'), 18, '', 'forzar'],
  ['fogon-leyenda', 7, E('plaza', 4, 2), 21, "h.escenas.vistas['libreta-fiado'] = 1; h.escenas.vistas['cuaderno-abuelo'] = 1", 'forzar'],
  ['pluma-umbral', 7, E('refugio-puerta', 0, 3), 22, "h.escenas.vistas['fogon-leyenda'] = 1", 'forzar'],
  ['veta-vuelve', 7, Q('tobias'), 22, "h.decisiones.coihue = 'c'", 'forzar'],
  ['mulas-belisario', 7, E('mallin', 0, 0), 10, '', 'forzar'],
  ['herminia-noventa', 7, Q('abuela'), 11, '', 'forzar'],
];

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
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = (tipo, extra = {}) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false, guiaPrimerDia:false}, ${JSON.stringify(extra)}))); 1`;
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');   // 4.17.0: la ventana de Electron pierde el foco mientras carga y el juego se pausaba solo (sección 0 sin tarjeta)
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const abrir = async (tipo, extra) => { await w.loadFile(url, { search: '?debug=1' }); await js(ajustes(tipo, extra)); await cargar(); };
  const foto = async (nombre) => {
    if (process.env.HUMO_CAPTURAS === '0') return false;
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(120 + intento * 500);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      return true;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
    return false;
  };
  const entrar = async (extra) => {
    await abrir('historia', extra);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await N('N.tick(2.5)');
    await N('N.hasta(() => N.tarjeta(), 12)');
    await N('N.elegir("empezar")'); await N('N.tick(1.5)');
    await N('N.despejar(10)');
  };
  // la hoja de contacto de una escena: hasta seis cuadros en 3 columnas
  const hoja = async (id, cuadros) => {
    if (!cuadros.length) return;
    const html = '<body style="margin:0;background:#111;display:grid;grid-template-columns:640px 640px 640px;gap:2px">' + cuadros.map((n) => `<img src="${n}.png" style="width:640px;height:360px;display:block">`).join('') + '</body>';
    const archivo = path.join(salida, `hoja-${FASE}-${id}.html`);
    fs.writeFileSync(archivo, html);
    const v = new BrowserWindow({ show: false, width: 1924, height: Math.ceil(cuadros.length / 3) * 362, useContentSize: true });
    await v.loadFile(archivo);
    await esperar(500);
    const img = await v.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `hoja-${FASE}-${id}.png`), img.toPNG());
    fs.rmSync(archivo, { force: true });
    v.destroy();
    for (const n of cuadros) fs.rmSync(path.join(salida, n + '.png'), { force: true });   // (la hoja alcanza; los cuadros sueltos se descartan)
  };
  const diag = () => N('(() => { const j = H.jugador.estado; return { activa: H.__escenas.activa(), tarjeta: N.tarjeta() ? N.tarjeta().titulo : null, sentado: j.sentado, montado: !!j.montado, nadando: j.nadando, enTren: j.enTren, enKayak: j.enKayak } })()');

  try {
    // ================================================================ V. las escenas de los actos I y II
    if (toca('V')) {
      donde = 'escenas a ojo';
      console.log(`— V. las escenas de los actos I y II a ojo (${FASE})`);
      await entrar({ estacion: 'otono' });
      await N('(() => { H.ajustes.limiteFps = "libre"; return 1 })()');
      // las obras de verdad que piden las escenas del acto II: el molino, el aserradero y el galponcito
      const sm = await N('N.sitioMolino()');
      const mol = sm ? await N(`N.levantar('molino-agua', [${JSON.stringify(sm)}])`) : null;
      ok(!!(mol && mol.ok), `el molino de agua para las escenas (${JSON.stringify(mol)})`);
      const ase = sm ? await N(`N.levantar('aserradero', N.alrededor(${sm[0]}, ${sm[1]}, [7, 9, 11], 12))`) : null;
      ok(!!(ase && ase.ok), `el aserradero para las escenas (${JSON.stringify(ase)})`);
      const ref = await N('({ x: H.T.lugares.refugio.x, z: H.T.lugares.refugio.z })');
      const gal = await N(`N.levantar('galponcito', N.alrededor(${ref.x}, ${ref.z}, [14, 18, 22], 12))`);
      ok(!!(gal && gal.ok), `el galponcito para las escenas (${JSON.stringify(gal)})`);
      await N('N.tick(1)');
      for (const [id, cap, lugar, hora, previo, como] of ESCENAS) {
        if (SOLO_ESC.length && !SOLO_ESC.includes(id)) continue;
        const t0 = Date.now();
        await N('N.despejar(6)');
        await N('(() => { if (H.volverAlJuego) H.volverAlJuego(); return 1 })()');
        await N(`(() => { const h = P.historia; N.preparar(${cap}); h.fase = 'jugando'; h.base = { dia: 1 }; h.hechos['mesa:nicanor'] = 1; h.hechos['ramal:derrumbe'] = 1; h.hechos['rueda:puente'] = 1; P.dia = Math.max(P.dia, 3); P.horas = ${hora}; h.decisiones.coihue = h.decisiones.coihue || 'a'; ${previo}; delete h.escenas.vistas[${JSON.stringify(id)}]; delete h.aplicadas[${JSON.stringify(id)}]; h.activa = false; return 1 })()`);   // (activa = false: que el juego no dispare solo otra escena mientras se acomoda)
        // dónde empieza el jugador
        const q = lugar.loc ? '{}' : lugar.npc ? `{ npc: ${JSON.stringify(lugar.npc)} }` : `{ p: ${JSON.stringify(lugar.p)} }`;
        if (lugar.npc && ['fermin', 'belisario', 'tobias'].includes(lugar.npc)) await N(`N.armarCerca(${JSON.stringify(lugar.npc)})`);
        let puesto = lugar.loc ? await N(`N.enRefugio(${lugar.loc.join(', ')})`) : await N(`N.parar(${q}, ${lugar.dx}, ${lugar.dz}, true)`);
        if (!puesto && lugar.fb) puesto = await N(`N.parar({ p: ${JSON.stringify(lugar.fb.p)} }, ${lugar.fb.dx}, ${lugar.fb.dz}, true)`);
        if (!puesto) { console.log(`  (${id}: no hay dónde pararse: ${JSON.stringify(lugar)})`); continue; }
        await N('N.tick(1.0)');
        // la colocación del juego, si la escena tiene una (4.16.0 y 4.17.0)
        let colocada = false;
        let lanzo = false, via = '';
        await N('(() => { P.historia.activa = true; return 1 })()');
        const hay = await N(`H.__escenas.director.hay(${JSON.stringify(id)})`);
        if (!hay) { console.log(`  ✗ ${id}: la escena no está registrada`); errores.push(id + ' sin registrar'); continue; }
        if (como === 'puerta') { lanzo = await N('(() => { const a = H.__valle.accionPuerta(); if (!a) return false; a.hacer(); return true })()'); via = 'puerta'; }
        // (la colocación y el disparo en el mismo instante, como hace el juego: lanzarEscena de historia-ui.js)
        if (!lanzo) { const rr = await N(`(() => { const c = H.__colocarEscena ? H.__colocarEscena(${JSON.stringify(id)}) : false; return { c, l: H.__escenas.disparar(${JSON.stringify(id)}) } })()`); lanzo = rr.l; colocada = rr.c; via = 'forzada'; }
        if (!lanzo) { console.log(`  ✗ ${id}: no se pudo lanzar ${JSON.stringify(await diag())}`); errores.push(id + ' no lanzó'); await N('N.despejar(2)'); continue; }
        await N('(() => { H.__escenas.director.acelerar(true); return 1 })()');
        // la cámara al principio: cuánto está lejos del jugador y si arrancó dentro de algo
        const lineas = await N('(() => { const s = H.__escenas.director.__sesion(); let n = 0; const c = (p) => { if (p.tipo === "dialogo") n += (p.lineas || []).length; if (p.tipo === "fundido") (p.alMedio || []).forEach(c); }; s.e.pasos.forEach(c); return n; })()');
        const marcas = new Set([0, Math.round(lineas * 0.2), Math.round(lineas * 0.4), Math.round(lineas * 0.6), Math.round(lineas * 0.8), Math.max(0, lineas - 1)]);
        const cuadros = [];
        let nLinea = 0, guardadas = 0, t = 0;
        // sin diálogo (los duendes): cuadros por tiempo
        const sinTexto = lineas === 0;
        await N('N.tick(1.3)');
        const sacar = async (etq) => { const n = `${FASE}-${id}-${String(cuadros.length + 1)}`; if (await foto(n)) cuadros.push(n); const dd = await N('N.duendes()'); if (dd.length) console.log(`    [${id} cuadro ${cuadros.length}] duendes: ${JSON.stringify(dd)}`); };
        if (!sinTexto) await sacar('inicio');
        else await sacar('inicio');
        const limite = Date.now() + 150000;
        let ultimaLinea = -1, atasco = 0;
        while (Date.now() < limite) {
          const d = await N('(() => { const d = H.__escenas.director.datos(); return d ? { fase: d.fase, c: d.dialogo ? d.dialogo.completo : null, l: d.dialogo ? d.dialogo.linea : 0, q: d.dialogo ? d.dialogo.quien : null, el: !!d.eleccion, f: +d.fundido.toFixed(2) } : null })()');
          if (!d || d.fase === 'saliendo') break;
          if (d.el) { await N('N.tecla("Digit1")'); await N('N.tick(0.3)'); continue; }
          if (sinTexto) { await N('N.tick(0.7)'); await sacar('t'); if (cuadros.length >= 6) { await N('N.despejar(8)'); break; } continue; }
          if (d.c) {
            const clave = nLinea;
            if (marcas.has(clave) && nLinea !== ultimaLinea && d.f < 0.2) { await N('N.tick(0.5)'); if (cuadros.length < 6 && !(clave === 0 && cuadros.length >= 1 && false)) await sacar('l' + clave); }
            ultimaLinea = nLinea; nLinea++;
            await N('N.tecla("Enter")'); await N('N.tick(0.35)'); atasco = 0;
          } else {
            await N('N.tick(0.2)'); atasco++;
            if (atasco > 300) { await N('N.tecla("Enter")'); atasco = 0; }
          }
        }
        // el fin: una vez que la cámara volvió
        await N('N.despejar(8)');
        await hoja(id, cuadros);
        const segs = ((Date.now() - t0) / 1000).toFixed(0);
        console.log(`  ✓ ${id}: ${via}${colocada ? ' (colocada)' : ''}, ${lineas} líneas, ${cuadros.length} cuadros, ${segs} s`);
      }
    }
    // ================================================================ P. props e interacciones nuevas (4.17.0, parte C)
    if (toca('P') && !process.env.HUMO_SIN_P) {
      donde = 'props';
      console.log('— P. los props nuevos y las escenas con disparador nuevo');
      const p = path.join(raiz, 'pruebas', 'humo-4-17-0-pulido-props.cjs');
      if (fs.existsSync(p)) await require(p).correr({ N, ok, foto, entrar, js, esperar, salida, FASE });
    }
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
