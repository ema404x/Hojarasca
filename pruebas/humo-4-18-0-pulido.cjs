// Partida real 4.18.0 (parte C): el mundo del acto III y las escenas optativas, mirados a ojo.
//   V. las escenas optativas de los actos II y III y las del acto III que ahora tienen prop (Ramón sentado con la manta, el galpón de noche, la mesa
//      con el mapa, lo prestado, Fermín en el techo, los faroles y las lucecitas, el umbral del final), una por una, por la colocación y el disparo del
//      juego, con seis cuadros cada una armados en una hoja de contacto (`pruebas/salidas/pulido-4-18-0/hoja-<id>.png`).
//   P. los props de los `mundo:` (historia-props-acto3.js): cada uno se ve cuando la historia lo dice, tiene lugar y malla, y se lo mira de cerca.
//   S. los programas de shader: ninguno nuevo en juego por los props ni por lo que brilla (la base es 111).
// Uso (después de `node armar.mjs`), en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-18-0-pulido.cjs -Espera 2400 -Perfil <carpeta propia> -Visible
// Variables: HUMO_SOLO=V,P,S (secciones), HUMO_ESC=id1,id2 (sólo esas escenas), HUMO_SALIDA=<carpeta>, HUMO_CAPTURAS=0.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'pulido-4-18-0'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 38 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 38 * 60 * 1000).unref?.();
const SOLO = (process.env.HUMO_SOLO || '').split(',').filter(Boolean);
const toca = (n) => !SOLO.length || SOLO.includes(String(n));
const SOLO_ESC = (process.env.HUMO_ESC || '').split(',').filter(Boolean);
const IDS_CAP = ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha', 'cuaderno', 'frios', 'golpea', 'arco', 'nevada', 'deshielo'];

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
    return { titulo: (v.querySelector('h2') || {}).textContent, opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => ({ id: b.dataset.valleOpcion })) };
  };
  N.elegir = (id) => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + id + '"]'); if (b) b.click(); return !!b; };
  N.despejar = async (maxSeg = 6, o = {}) => {
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (es && es.activa()) {
        const d = es.director.datos && es.director.datos();
        if (d && d.eleccion) { N.tecla((o.eleccion && o.eleccion[d.eleccion.id]) || 'Digit1'); await N.tick(0.3); continue; }
        if (es.director.fase() === 'corriendo') N.tecla('Escape');
        await dormir(120);
        if (es.activa() && es.director.fase() === 'corriendo') N.tecla('Escape');
        await N.tick(0.4); continue;
      }
      if (N.tarjeta()) { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion]'); if (b) b.click(); }
      await N.tick(0.4);
      if (!(es && es.activa()) && !N.tarjeta()) break;
    }
    return 1;
  };
  N.ir = (x, z, yaw = 0) => { J.ubicar(x, z, yaw); return 1; };
  N.duendes = () => { const dh = H.__duendesHist && H.__duendesHist(); const j = J.estado.pos; return dh ? dh.lista().map((d) => { const p = d.posicion; return { e: d._s ? d._s.estado : '?', d: +Math.hypot(p.x - j.x, p.z - j.z).toFixed(1) }; }) : []; };
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
  N.donde = (q) => {
    if (q && q.npc) { const p = H.__escenas.mundo.posicion(q.npc); return p ? { x: p.x, z: p.z } : null; }
    const pts = Object.assign({}, T.lugares, H.__puntosHistoria());
    const l = pts[q.p]; return l && Number.isFinite(l.x) ? { x: l.x, z: l.z } : null;
  };
  N.armarCerca = async (clave) => {
    const ya = H.__escenas.mundo.posicion(clave); if (ya && H.__genteCampo().npcDe(clave)) return true;
    const sitio = { fermin: () => T.lugares.galpon, belisario: () => ({ x: -347, z: -159 }), tobias: () => ({ x: -394, z: -305 }) }[clave];
    if (!sitio) return false;
    const l = sitio(); N.ir(l.x + 6, l.z + 6, 0);
    await N.hasta(() => H.__genteCampo().npcDe(clave), 25);
    await N.tick(0.5);
    return !!H.__genteCampo().npcDe(clave);
  };
  N.parar = (q, dx = 0, dz = 0) => {
    const l = N.donde(q); if (!l) return false;
    const x = l.x + dx, z = l.z + dz;
    N.ir(x, z, Math.atan2(-(l.x - x), -(l.z - z)) || 0);
    return true;
  };
  // la historia en el capítulo cap (0..12), con lo anterior cerrado, jugando
  N.prep = (cap, o = {}) => {
    const h = P.historia, ids = ${JSON.stringify(IDS_CAP)};
    h.activa = true; h.empezada = 1; h.version = 2; h.capitulo = cap; h.fase = 'jugando'; h.base = { dia: Math.max(1, P.dia - 1), talados: 0, cocinadas: 0, cantos: 0 }; h.hechos = {}; h.momentos = {}; h.cerrados = {};
    ids.slice(0, cap).forEach((k) => { h.cerrados[k] = P.dia - 1; });
    // (cada escena o prop arranca limpio: sin las escenas vistas, la costumbre ni los mundo: que dejaron las anteriores)
    if (o.limpio !== false) { h.escenas.vistas = {}; h.costumbre = null; for (const k of Object.keys(h.temas || {})) if (k.startsWith('mundo:')) delete h.temas[k]; }
    h.decisiones = Object.assign({ bolsa: 'a', coihue: 'a', molienda: 'a', cuaderno: 'a', majada: 'a' }, o.decisiones || {});
    h.lazos = Object.assign({ ramon: 2, ema: 2, fermin: 2, graciela: 1, ercilia: 1 }, o.lazos || {});
    h.duendes = Object.assign(h.duendes || {}, { trato: 'trato', noche: 'pendiente', final: null }, o.duendes || {});
    for (const e of o.vistas || []) h.escenas.vistas[e] = P.dia - 1;
    for (const t of o.temas || []) h.temas[t] = P.dia;
    return 1;
  };
  return 1;
})()`;

// ---------------------------------------------------------------- las escenas: [id, capítulo (0..12), dónde, hora, opciones de prep]
// dónde: { p: punto, dx, dz } o { npc: clave, dx, dz, fb: { p, dx, dz } }. El jugador empieza ahí y después pasa por la colocación del juego.
const E = (p, dx = 0, dz = 0) => ({ p, dx, dz });
const FB = { panadera: E('panaderia', 4, 4), carpintero: E('carpinteria', 4, 3), fotografa: E('estudio-fotos', 4, 3), abuela: E('plaza', 3, 3), tobias: E('cantera', 6, 6), ramon: E('puesto', 4, 0), ema: E('refugio-puerta', 0, 8), belisario: E('puesto-paso', 4, 4), nicanor: E('muelle', 0, 3), fermin: E('galpon', 4, 4), ercilia: E('ramos', 0, 3), herrero: E('plaza', -4, 4), apicultor: E('plaza', 4, -4), martin: E('estacion', 4, 3), guarda: E('estacion', 3, 4) };
const Q = (npc, dx = 2.2, dz = 0) => ({ npc, dx, dz, fb: FB[npc] || null });
const ESCENAS = [
  // acto II: las optativas
  ['trigo-abuelo', 4, Q('ema'), 10, { decisiones: { bolsa: 'c' } }],
  ['tablas-tito', 4, Q('carpintero'), 10, { decisiones: { coihue: 'b' } }],
  ['truchas-nicanor', 4, E('muelle', 0, 3), 10, {}],
  ['masa-crece', 5, Q('panadera'), 11, { decisiones: { bolsa: 'b' } }],
  ['foto-sofia', 5, Q('fotografa'), 11, { temas: ['obj:foto-movida'] }],
  ['fermin-mulas', 6, Q('fermin'), 11, { vistas: ['minga-aldea'] }],
  ['veta-vuelve', 7, Q('tobias'), 20.5, { decisiones: { coihue: 'c' } }],
  ['mulas-belisario', 7, E('mallin', 0, 0), 10, {}],
  ['herminia-noventa', 7, Q('abuela'), 11, {}],
  // acto III: las de los props y las optativas
  ['ramon-cama', 8, E('puesto', 4, 4), 9, {}],
  ['papel-elsa', 8, E('estacion', 0, 0), 10, { vistas: ['ramon-cama'] }],
  ['visita-ramon', 8, Q('ramon'), 11, { vistas: ['ramon-cama', 'ramon-sanitario'] }],
  ['hojas-canelo', 8, E('puesto', 5, 5), 7, { vistas: ['ramon-cama', 'fermin-tranquera'] }],
  ['galpon-golpe', 9, E('galpon-noche', 4, 4), 22.5, {}],
  ['galpon-sin-golpear', 9, E('galpon-noche', 4, 4), 22.2, { vistas: ['galpon-golpe'], temas: ['mundo:galpon-luz-adentro'] }],
  ['galpon-pelea', 9, E('galpon-noche', 4, 4), 23, { duendes: { trato: 'pelea' }, vistas: ['galpon-golpe', 'galpon-encuentro'] }],
  ['mesa-guerra', 9, E('refugio-puerta', 0, 5), 16.5, { vistas: ['cerro-mirador'] }],
  ['llave-79', 9, E('molino-viejo', 3, 3), 11, { vistas: ['galpon-encuentro'] }],
  ['pedir-perdon', 9, E('molino-viejo', 3, 3), 11, { duendes: { trato: 'pelea' }, vistas: ['galpon-encuentro'] }],
  ['tito-arco', 10, Q('carpintero'), 9, {}],
  ['anselmo-puntas', 10, Q('herrero'), 11, {}],
  ['prestado-herrero', 10, Q('herrero'), 11, {}],
  ['prestado-apicultor', 10, Q('apicultor'), 11, {}],
  ['prestado-guarda', 10, Q('guarda'), 11, {}],
  ['prestado-tobias', 10, E('coihue', 5, 3), 11, { decisiones: { coihue: 'c' } }],
  ['flechas-de-mas', 10, Q('carpintero'), 11, { vistas: ['tito-arco', 'blancos-paso'] }],
  ['cumple-nevada', 10, Q('ercilia'), 16, {}],
  ['noche-espera', 11, E('galpon-noche', 4, 4), 22, {}],
  ['majada-fin', 12, E('puesto', 4, 4), 11, {}],
  ['volver-a-subir', 12, Q('ramon'), 11, { decisiones: { majada: 'c' }, vistas: ['majada-fin'] }],
  ['josefina-fin', 12, E('coihue', 6, 3), 15, { decisiones: { cuaderno: 'c' } }],
  ['umbral-fin', 12, E('refugio-puerta', 0, 4), 7.5, { duendes: { trato: 'trato', final: 'trato' } }],
  ['umbral-fin:pelea', 12, E('refugio-puerta', 0, 4), 7.5, { duendes: { trato: 'pelea', final: 'pelea', perdon: true } }],
  ['costumbre-dejar', 12, E('refugio-puerta', 0, 4), 18, { duendes: { final: 'trato' } }],
  ['costumbre-regalito', 12, E('refugio-puerta', 0, 4), 7.5, { duendes: { final: 'trato' } }],
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
    await js('window.__sinPausaPorBlur = true; 1');
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
    await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)');
    await N('N.hasta(() => N.tarjeta(), 12)');
    await N('N.elegir("empezar")'); await N('N.tick(1.5)');
    await N('N.despejar(10)');
  };
  const hoja = async (id, cuadros) => {
    if (!cuadros.length) return;
    const html = '<body style="margin:0;background:#111;display:grid;grid-template-columns:640px 640px 640px;gap:2px">' + cuadros.map((n) => `<img src="${n}.png" style="width:640px;height:360px;display:block">`).join('') + '</body>';
    const archivo = path.join(salida, `hoja-${id}.html`);
    fs.writeFileSync(archivo, html);
    const v = new BrowserWindow({ show: false, width: 1924, height: Math.ceil(cuadros.length / 3) * 362, useContentSize: true });
    await v.loadFile(archivo);
    await esperar(500);
    const img = await v.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `hoja-${id.replace(':', '-')}.png`), img.toPNG());
    fs.rmSync(archivo, { force: true });
    v.destroy();
    for (const n of cuadros) fs.rmSync(path.join(salida, n + '.png'), { force: true });
  };
  let prog0 = 0, progSinNoche = null, progTrasV = null;

  try {
    await entrar({ estacion: 'invierno' });
    prog0 = await N('N.programas()');
    console.log(`  (programas al entrar: ${prog0})`);
    // las obras que piden las escenas: el galponcito (el galpón de la noche) cerca del refugio
    const ref = await N('({ x: H.T.lugares.refugio.x, z: H.T.lugares.refugio.z })');
    const gal = await N(`N.levantar('galponcito', N.alrededor(${ref.x}, ${ref.z}, [14, 18, 22], 12))`);
    ok(!!(gal && gal.ok), `el galponcito (el galpón de la noche) para las escenas (${JSON.stringify(gal)})`);
    await N('N.tick(1)');
    const progObra = await N('N.programas()');

    // ================================================================ V. las escenas a ojo
    if (toca('V')) {
      donde = 'escenas a ojo';
      console.log('— V. las escenas optativas de los actos II y III y las del acto III con props, a ojo');
      // HUMO_SIN_PROPS=1: las mismas escenas sin los props (el grupo de los objetos de historia escondido): la base para contar programas
      if (process.env.HUMO_SIN_PROPS === '1') await N('(() => { const ob = H.__historiaObjetos(); ob.grupo.visible = false; ob.efecto = () => []; return 1 })()');
      let progEsc = await N('N.programas()');
      for (const [clave, cap, lugar, hora, o] of ESCENAS) {
        const id = clave.split(':')[0];
        if (SOLO_ESC.length && !SOLO_ESC.includes(id) && !SOLO_ESC.includes(clave)) continue;
        const t0 = Date.now();
        await N('N.despejar(6)');
        await N(`(() => { N.prep(${cap}, ${JSON.stringify(o)}); P.dia = Math.max(P.dia, 4); P.horas = ${hora}; delete P.historia.escenas.vistas[${JSON.stringify(id)}]; P.historia.activa = false; return 1 })()`);
        const q = lugar.npc ? `{ npc: ${JSON.stringify(lugar.npc)} }` : `{ p: ${JSON.stringify(lugar.p)} }`;
        if (lugar.npc && ['fermin', 'belisario', 'tobias'].includes(lugar.npc)) await N(`N.armarCerca(${JSON.stringify(lugar.npc)})`);
        let puesto = await N(`N.parar(${q}, ${lugar.dx}, ${lugar.dz})`);
        if (!puesto && lugar.fb) puesto = await N(`N.parar({ p: ${JSON.stringify(lugar.fb.p)} }, ${lugar.fb.dx}, ${lugar.fb.dz})`);
        if (!puesto) { console.log(`  (${clave}: no hay dónde pararse: ${JSON.stringify(lugar)})`); continue; }
        await N('N.tick(1.0)');
        await N('(() => { P.historia.activa = true; return 1 })()');
        const hay = await N(`H.__escenas.director.hay(${JSON.stringify(id)})`);
        if (!hay) { console.log(`  ✗ ${clave}: la escena no está registrada`); errores.push(clave + ' sin registrar'); continue; }
        const rr = await N(`(() => { const c = H.__colocarEscena ? H.__colocarEscena(${JSON.stringify(id)}) : false; return { c, l: H.__escenas.disparar(${JSON.stringify(id)}) } })()`);
        if (!rr.l) { console.log(`  ✗ ${clave}: no se pudo lanzar`); errores.push(clave + ' no lanzó'); await N('N.despejar(2)'); continue; }
        await N('(() => { H.__escenas.director.acelerar(true); return 1 })()');
        const lineas = await N('(() => { const s = H.__escenas.director.__sesion(); let n = 0; const c = (p) => { if (p.tipo === "dialogo") n += (p.lineas || []).length; if (p.tipo === "fundido") (p.alMedio || []).forEach(c); }; s.e.pasos.forEach(c); return n; })()');
        const marcas = new Set([0, Math.round(lineas * 0.2), Math.round(lineas * 0.4), Math.round(lineas * 0.6), Math.round(lineas * 0.8), Math.max(0, lineas - 1)]);
        const cuadros = [];
        let nLinea = 0, ultima = -1, atasco = 0;
        await N('N.tick(1.3)');
        const nombre = clave.replace(':', '-');
        const sacar = async () => { const n = `${nombre}-${cuadros.length + 1}`; if (await foto(n)) cuadros.push(n); };
        await sacar();
        const props = new Set();
        const limite = Date.now() + 150000;
        while (Date.now() < limite) {
          const d = await N('(() => { const d = H.__escenas.director.datos(); return d ? { fase: d.fase, c: d.dialogo ? d.dialogo.completo : null, el: !!d.eleccion, f: +d.fundido.toFixed(2) } : null })()');
          for (const k of await N('Object.keys(H.__historiaObjetos().enEscena || {})')) props.add(k);
          if (!d || d.fase === 'saliendo') break;
          if (d.el) { await N('N.tecla("Digit1")'); await N('N.tick(0.3)'); continue; }
          if (lineas === 0) { await N('N.tick(0.7)'); await sacar(); if (cuadros.length >= 6) { await N('N.despejar(8)'); break; } continue; }
          if (d.c) {
            if (marcas.has(nLinea) && nLinea !== ultima && d.f < 0.2 && cuadros.length < 6) { await N('N.tick(0.5)'); await sacar(); }
            ultima = nLinea; nLinea++;
            await N('N.tecla("Enter")'); await N('N.tick(0.35)'); atasco = 0;
          } else { await N('N.tick(0.2)'); if (++atasco > 300) { await N('N.tecla("Enter")'); atasco = 0; } }
        }
        await N('N.despejar(8)');
        await hoja(nombre, cuadros);
        { const pn = await N('N.programas()'); if (pn !== progEsc) console.log(`    [programas ${progEsc} → ${pn} en ${clave}]`); progEsc = pn; }
        console.log(`  ✓ ${clave}: ${rr.c ? 'colocada, ' : ''}${lineas} líneas, ${cuadros.length} cuadros${props.size ? `, props de escena: ${[...props].join(' ')}` : ''}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      }
    }

    if (toca("V")) progTrasV = await N("N.programas()");   // (las escenas compilan lo suyo: duendes, invitados, la noche; los props se miden contra esto y contra HUMO_SIN_PROPS=1)
    // ================================================================ P. los props de los mundo: del acto III
    if (toca('P')) {
      donde = 'props';
      console.log('— P. los props de los mundo: del acto III');
      // [prop, capítulo, temas, hora, opciones de prep, dónde mirarlo: { p, dx, dz } o null (de cerca, con la posición del prop)]
      const PROPS = [
        ['hojas-canelo', 8, ['mundo:hojas-canelo'], 8, {}],
        ['corral-abierto', 8, ['mundo:corral-abierto'], 8, {}],
        ['galpon-luz', 9, ['mundo:galpon-luz-adentro'], 22.5, {}],
        ['puertita-reves', 9, ['mundo:puertita-al-reves'], 9, {}],
        ['ventana-barro', 9, ['mundo:ventana-barro-y-bellotas'], 9, {}],
        ['mapa-mesa', 9, ['mundo:mesa-con-mapa'], 17, {}],
        ['arco-mesa', 10, ['mundo:arco-sin-cuerda'], 10, {}],
        ['puntas-mesa', 10, ['mundo:puntas-de-flecha'], 10, {}],
        ['flechas-atado', 10, ['mundo:flechas-extra'], 10, {}],
        ['campana-taller', 10, ['mundo:campana-del-taller'], 10, {}],
        ['cartel-catrileo', 12, ['mundo:cartel-puesto-catrileo'], 11, {}],
        ['cartel-notable', 12, ['mundo:cartel-arbol-notable'], 11, {}],
        ['puertita-nueva', 12, ['mundo:puertita-nueva-en-la-raiz'], 11, {}],
        ['puertitas-vacias', 12, ['mundo:puertitas-vacias'], 11, {}],
        ['bellota-derecha', 12, ['mundo:bellota-derecha'], 11, {}],
        ['ronda-final', 12, ['mundo:ronda-ramitas-final'], 8, {}],
        ['bolsa-doblada', 12, ['mundo:bolsa-vacia-doblada'], 8, {}],
        ['arco-honda-pared', 12, ['mundo:arco-y-honda-en-la-pared'], 11, {}],
        ['repisa-puertita', 12, ['mundo:puertita-repisa-abre'], 11, {}],
        ['repisa-canto', 12, ['mundo:canto-blanco-queda'], 11, {}],
        ['pan-umbral', 2, ['mundo:pan-de-rosa'], 8, {}],
        // los de la noche de la nevada, al final: con la espera vista la noche de A empieza sola y ya no se va (y compila lo suyo)
        ['faroles-loma', 11, ['mundo:faroles-en-la-loma'], 22.6, {}],
        ['lucecitas-raices', 11, [], 22.8, { vistas: ['noche-espera'] }],
      ];
      const ANTES_DE_LA_NOCHE = 'faroles-loma';

      // HUMO_SIN_PROPS=1: el mismo recorrido (lugares, horas, capítulos) pero sin los temas que los muestran: la base para contar programas
      const SIN = process.env.HUMO_SIN_PROPS === '1';
      let progAntes = await N('N.programas()');
      for (const [id, cap, temas0, hora, o0] of PROPS) {
        const temas = SIN ? [] : temas0, o = SIN ? { vistas: o0.vistas } : o0;
        if (id === ANTES_DE_LA_NOCHE) { progSinNoche = await N('N.programas()'); console.log(`    (programas antes de la noche: ${progSinNoche})`); }
        await N('N.despejar(4)');
        await N(`(() => { N.prep(${cap}, ${JSON.stringify({ ...o, temas })}); P.horas = ${hora}; for (const t of ${JSON.stringify(temas)}) P.historia.temas[t] = P.dia; return 1 })()`);
        await N('N.tick(1.2)');
        const r = await N(`(() => { const ob = H.__historiaObjetos(), m = ob.mallas[${JSON.stringify(id)}], q = ob.posiciones[${JSON.stringify(id)}]; return { malla: !!m, visible: !!(m && m.visible), q: q ? { x: +q.x.toFixed(1), z: +q.z.toFixed(1) } : null } })()`);
        if (!r.visible) console.log('    diag:', JSON.stringify(await N(`(() => { const s = H.__valle.estado(), h = P.historia; return { horas: s.horas, dia: s.dia, cap: h.capitulo, temas: Object.keys(h.temas || {}).filter((k) => k.startsWith('mundo:')), escena: H.__escenas.activa(), tarjeta: !!N.tarjeta() } })()`)));
        if (!SIN) ok(r.malla && r.visible && !!r.q, `${id}: se ve cuando la historia lo dice (${JSON.stringify(r)})`);
        if (SIN) r.q = await N(`H.__historiaObjetos().posiciones[${JSON.stringify(id)}] || null`);
        if (r.q) {
          // mirarlo de cerca (a 2,6 m, del lado del refugio) y de más lejos (los faroles y las lucecitas, de noche)
          const lejos = ['faroles-loma', 'lucecitas-raices'].includes(id) ? 14 : ['corral-abierto', 'cartel-catrileo', 'campana-taller', 'puertitas-vacias', 'cartel-notable'].includes(id) ? 5 : 2.4;
          // adentro del refugio: parado en el medio (local 0,2; 0,6), mirando al prop. Afuera: del otro lado del prop respecto del refugio, mirándolo
          await N(`(() => { const q = H.__historiaObjetos().posiciones[${JSON.stringify(id)}], r = H.T.lugares.refugio; const adentro = ${JSON.stringify(['mapa-mesa', 'arco-mesa', 'puntas-mesa', 'flechas-atado', 'arco-honda-pared', 'repisa-puertita', 'repisa-canto'].includes(id))};
            const V = ${JSON.stringify({ 'arco-honda-pared': [-1.6, -0.4], 'repisa-puertita': [-0.4, -0.9], 'repisa-canto': [-0.4, -0.9] }[id] || [0.2, 0.6])};
            if (adentro) { const c = Math.cos(r.rot || 0), s = Math.sin(r.rot || 0), x = r.x + V[0] * c + V[1] * s, z = r.z - V[0] * s + V[1] * c; N.ir(x, z, Math.atan2(-(q.x - x), -(q.z - z))); H.jugador.estado.pitch = -0.3; return 1; }
            const d = ${lejos}; let a = Math.atan2(q.x - r.x, q.z - r.z) || 0; const x = q.x + Math.sin(a) * d, z = q.z + Math.cos(a) * d; N.ir(x, z, Math.atan2(-(q.x - x), -(q.z - z))); H.jugador.estado.pitch = d > 8 ? -0.02 : -0.35; return 1 })()`);
          await N('N.tick(1.0)');
          await foto(SIN ? `prop-sin-${id}` : `prop-${id}`);
        }
        { const pn = await N('N.programas()'); if (pn !== progAntes) console.log(`    [programas ${progAntes} → ${pn} en ${id}]`); progAntes = pn; }
        // y se esconde cuando ya no corresponde (sin el tema)
        await N(`(() => { for (const t of ${JSON.stringify(temas)}) delete P.historia.temas[t]; return 1 })()`);
        if (temas.length) { await N('N.tick(0.8)'); const v = await N(`!!(H.__historiaObjetos().mallas[${JSON.stringify(id)}] && H.__historiaObjetos().mallas[${JSON.stringify(id)}].visible)`); ok(!v, `${id}: sin el tema no se ve`); }
      }
      // los de escena: un efecto con `donde` los pone durante la escena y se van al terminar (sin escena en curso no quedan)
      const r = await N(`(() => { const ob = H.__historiaObjetos(); document.body.classList.add('escena-en-curso'); const j = H.jugador.estado; ob.efecto('mundo:estacas-prestadas', { x: j.pos.x + 6, z: j.pos.z }, j); const a = !!(ob.mallas['estacas-escena'] && ob.mallas['estacas-escena'].visible); document.body.classList.remove('escena-en-curso'); ob.mostrar([]); const b = !!(ob.mallas['estacas-escena'] && ob.mallas['estacas-escena'].visible); return { a, b } })()`);
      if (process.env.HUMO_SIN_PROPS !== '1') ok(r.a && !r.b, `las estacas prestadas se ven durante la escena y se van al terminar (${JSON.stringify(r)})`);
    }

    // ================================================================ S. los programas
    if (toca('S')) {
      donde = 'programas';
      const n = await N('N.programas()');
      const base = Math.max(prog0, progObra, progTrasV || 0);
      console.log(`  (programas: al entrar ${prog0}, con el galponcito ${progObra}, antes de la noche ${progSinNoche}, al final, con la noche de A corriendo, ${n})`);
      // los props, hasta antes de la noche de la nevada (la noche de A compila lo suyo: se compara con la corrida HUMO_SIN_PROPS=1, que hace el mismo recorrido sin props)
      ok(progSinNoche === null || progSinNoche <= base, `0 programas nuevos por los props y lo que brilla (${base} de base, ${progSinNoche} después de todos los props de día y de noche, antes de la noche de A)`);
    }
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
