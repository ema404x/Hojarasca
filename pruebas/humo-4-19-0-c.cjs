// Partida real 4.19.0 (parte C): el pase a ojo de las escenas de la Historia que nunca se vieron en el juego, y la gente lejana en una escena.
//   V. las escenas (las 28 optativas, las de la noche, las del acto III), una por una, por la colocación y el disparo del juego, con seis cuadros cada una armados en una hoja
//      de contacto (`<salida>/hoja-<id>.png`). Es la herramienta de la 4.18.1 (humo-4-18-1-pulido.cjs) con la lista ampliada.
//   G. la gente lejana: los personajes de una escena activa se dibujan aunque estén a más de 130 m del jugador (Herminia en su casa, desde el refugio) y al terminar vuelven a su estado.
//   P. los props de los `mundo:` del acto III (los de la 4.18.0, mirados de cerca), la hoja de la tranquera abierta, las estacas, el frasco, las lucecitas del amanecer.
//   S. los programas de shader: ninguno nuevo (la base es 111).
// Uso (después de `node armar.mjs`), en el monitor externo y con perfil propio:
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-19-0-c.cjs -Espera 2700 -Perfil <carpeta propia> -Visible
// Variables: HUMO_SOLO=V,G,P,S (secciones), HUMO_ESC=id1,id2 (sólo esas escenas), HUMO_SALIDA=<carpeta>, HUMO_CAPTURAS=0, HTML=<index.html de otra versión> (el «antes»).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'pulido-4-19-0'));
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
  // parado adentro del refugio en (lx, lz) locales, mirando (mx, mz) locales
  N.dentro = (lx, lz, mx, mz) => {
    const r = T.lugares.refugio, c = Math.cos(r.rot || 0), s = Math.sin(r.rot || 0);
    const A = (a, b) => ({ x: r.x + a * c + b * s, z: r.z - a * s + b * c });
    const p = A(lx, lz), m = A(mx, mz);
    N.ir(p.x, p.z, Math.atan2(-(m.x - p.x), -(m.z - p.z))); J.estado.pitch = -0.1; return 1;
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
    // (o.amor: la clave del vecino que es tu pareja, con el amor prendido; sin ella nadie lo es)
    if (P.amor && P.amor.personas) for (const q of Object.values(P.amor.personas)) if (q && q.etapa === 'novios') q.etapa = 'conocidos';
    // (o.pobladores: vecinos que viven en la aldea; la pareja tiene que vivir ahí para que la escena la encuentre)
    if (o.pobladores) { P.aldea = P.aldea || {}; P.aldea.pobladores = P.aldea.pobladores || []; for (const k of o.pobladores) if (!P.aldea.pobladores.some((x) => x && x.clave === k)) P.aldea.pobladores.push({ clave: k }); }
    if (o.amor) { P.amor = P.amor || { personas: {}, hijos: [] }; P.amor.personas[o.amor] = Object.assign(P.amor.personas[o.amor] || {}, { etapa: 'novios', afecto: 80 }); }
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
const R = (lx, lz, mx, mz) => ({ ref: [lx, lz, mx, mz] });   // adentro del refugio, en coordenadas locales, mirando (mx, mz)
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
  ['hojas-canelo:pelea', 8, E('puesto', 5, 5), 7, { decisiones: { bolsa: 'b', molienda: 'a', coihue: 'b' }, vistas: ['ramon-cama', 'fermin-tranquera'] }],
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
  ['majada-fin', 12, E('galpon', 0, 12), 11, {}],
  ['cerro-mirador', 9, E('mirador', 3, 3), 8, { vistas: ['galpon-encuentro', 'galpon-trato'] }],
  ['amanecer-trato-ganada', 11, E('galpon-noche', 4, 4), 6.5, { vistas: ['noche-espera'], duendes: { trato: 'trato', noche: 'ganada' } }],
  ['volver-a-subir', 12, Q('ramon'), 11, { decisiones: { majada: 'c' }, vistas: ['majada-fin'] }],
  ['josefina-fin', 12, E('coihue', 6, 3), 15, { decisiones: { cuaderno: 'c' } }],
  ['umbral-fin', 12, E('refugio-puerta', 0, 4), 7.5, { duendes: { trato: 'trato', final: 'trato' } }],
  ['umbral-fin:pelea', 12, E('refugio-puerta', 0, 4), 7.5, { duendes: { trato: 'pelea', final: 'pelea', perdon: true } }],
  ['costumbre-dejar', 12, E('refugio-puerta', 0, 4), 18, { duendes: { final: 'trato' } }],
  ['costumbre-regalito', 12, E('refugio-puerta', 0, 4), 7.5, { duendes: { final: 'trato' } }],
  // ---- 4.19.0: las que faltaban de las optativas (actos I a III), las de la noche y las del acto III de B
  ['frasco-repisa', 1, R(0.1, -0.5, -0.08, -2.55), 10, { vistas: ['nota-eusebio'] }],
  ['frasco-rosa', 2, Q('panadera'), 10, { vistas: ['nota-eusebio', 'frasco-repisa'], temas: ['optativa:frasco-masa-madre'] }],
  ['oveja-ramon', 2, E('puesto', 6, 6), 11, { temas: ['optativa:oveja'] }],
  ['pan-fermin', 2, Q('fermin'), 11, { vistas: ['fermin-galpon'] }],
  ['te-graciela', 3, E('casa-te', 6, 6), 15, { vistas: ['anden-graciela'] }],
  ['vuelta-mirador', 3, E('mirador', 4, 4), 11, { vistas: ['anden-graciela'] }],
  ['vuelta-faro', 3, E('faro', 6, 6), 17, { vistas: ['anden-graciela'] }],
  ['foto-valle', 6, Q('fotografa'), 11, {}],
  ['juntar-ovejas', 8, E('puesto', 6, 6), 11, { temas: ['optativa:juntar-ovejas'], vistas: ['ramon-cama'] }],
  ['pareja-noche-antes', 10, E('refugio-puerta', 0, 6), 20, { amor: 'panadera', pobladores: ['panadera'] }],
  ['fermin-tranquera', 8, E('puesto', 6, 6), 10, { vistas: ['ramon-cama'] }],
  ['majada-fermin', 8, Q('fermin'), 11, { vistas: ['ramon-cama'] }],
  ['majada-vos', 8, E('puesto', 6, 6), 11, { vistas: ['ramon-cama'] }],
  ['majada-belisario', 8, E('puesto-paso', 4, 4), 11, { vistas: ['ramon-cama'] }],
  ['ramon-sanitario', 8, E('plaza', 6, 6), 11, { vistas: ['ramon-cama'] }],
  ['galpon-encuentro', 9, E('galpon-noche', 4, 4), 22.5, { vistas: ['galpon-golpe'] }],
  ['galpon-trato', 9, E('galpon-noche', 4, 4), 22.8, { vistas: ['galpon-golpe', 'galpon-encuentro'] }],
  ['plumas-bosque', 10, E('refugio', 0, 20), 11, {}],
  ['plumas-gallinero', 10, E('gallinero-propio', 3, 3), 11, {}],
  ['plumas-josefina', 10, Q('ema'), 11, {}],
  ['blancos-paso', 10, E('puesto-paso', 4, 4), 11, {}],
  ['blancos-esquila', 10, E('galpon', 4, 4), 11, {}],
  ['fermin-paces', 10, Q('fermin'), 11, {}],
  ['fermin-honda', 10, Q('fermin'), 11, {}],
  ['elvira-cuerda', 10, Q('tejedora'), 11, {}],
  ['prestado-maquinista', 10, Q('martin'), 11, {}],
  ['deuda-pagada', 10, E('coihue', 5, 3), 11, { decisiones: { bolsa: 'b' } }],
  ['recorrer-lado', 10, E('galpon-noche', 4, 4), 18.5, {}],
  ['cena-caliente', 10, E('refugio-puerta', 0, 6), 19, {}],
  ['herminia-estacion', 10, E('estacion', 6, 6), 19, {}],
  ['noche-entre-1', 11, E('galpon-noche', 4, 4), 23, { vistas: ['noche-espera'] }],
  ['noche-entre-2', 11, E('galpon-noche', 4, 4), 23, { vistas: ['noche-espera'] }],
  ['noche-tras-ganar', 11, E('galpon-noche', 4, 4), 23.7, { vistas: ['noche-espera'], duendes: { noche: 'ganada' } }],
  ['noche-tras-perder', 11, E('galpon-noche', 4, 4), 23.7, { vistas: ['noche-espera'], duendes: { noche: 'perdida' } }],
  ['amanecer-trato-perdida', 11, E('galpon-noche', 4, 4), 6.5, { vistas: ['noche-espera'], duendes: { trato: 'trato', noche: 'perdida' } }],
  ['amanecer-pelea-ganada', 11, E('galpon-noche', 4, 4), 6.5, { vistas: ['noche-espera'], duendes: { trato: 'pelea', noche: 'ganada' } }],
  ['amanecer-pelea-perdida', 11, E('galpon-noche', 4, 4), 6.5, { vistas: ['noche-espera'], duendes: { trato: 'pelea', noche: 'perdida' } }],
  ['carpeta-celeste', 12, E('estacion', 8, 4), 11, {}],
  ['fiesta-nieve', 12, E('plaza', 8, 4), 19, {}],
  ['amanecer-trato-ganada:amor', 11, E('galpon-noche', 4, 4), 6.5, { vistas: ['noche-espera'], duendes: { trato: 'trato', noche: 'ganada' }, amor: 'panadera', pobladores: ['panadera'] }],
  ['fiesta-nieve:amor', 12, E('plaza', 8, 4), 19, { amor: 'panadera', pobladores: ['panadera'] }],
  ['umbral-fin:amor', 12, E('refugio-puerta', 0, 4), 7.5, { duendes: { trato: 'trato', final: 'trato' }, amor: 'panadera', pobladores: ['panadera'] }],
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
    if (process.env.HUMO_CONSERVAR !== '1') for (const n of cuadros) fs.rmSync(path.join(salida, n + '.png'), { force: true });   // (HUMO_CONSERVAR=1: deja también los cuadros sueltos)
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

    // ================================================================ K. cámaras de prueba: HUMO_KFILE=<json> con [{ n, cap, temas, hora, opciones, jug: { p, dx, dz }, pos, mira, fov }]
    // (una escena de mentira con un plano libre: pos y mira son anclas de escena: { lugar, dx, dz, dy } / { ref, dy }; saca un cuadro por cada una)
    if (process.env.HUMO_KFILE) {
      donde = 'cámaras de prueba';
      const lista = JSON.parse(fs.readFileSync(path.resolve(process.env.HUMO_KFILE), 'utf8'));
      await N('N.despejar(4)');
      for (const k of lista) {
        await N(`(() => { N.prep(${k.cap ?? 12}, ${JSON.stringify(k.opciones || {})}); P.dia = Math.max(P.dia, 4); P.horas = ${k.hora ?? 11}; for (const t of ${JSON.stringify(k.temas || [])}) P.historia.temas[t] = P.dia; P.historia.activa = false; return 1 })()`);
        if (k.jug) { await N(`N.parar({ p: ${JSON.stringify(k.jug.p)} }, ${k.jug.dx || 0}, ${k.jug.dz || 0})`); }
        if (k.colocar) { await N(`(() => { H.__colocarEscena(${JSON.stringify(k.colocar)}); return 1 })()`); }
        await N('N.tick(1.2)');
        await N(`(() => { const E = H.__escenas; E.registrar({ id: 'prueba-k', repetible: true, personajes: {}, pasos: [{ tipo: 'plano', plano: 'libre', pos: ${JSON.stringify(k.pos)}, mira: ${JSON.stringify(k.mira)}${k.fov ? `, fov: ${k.fov}` : ''}, dur: 30, mezcla: 0, sinEsperar: true }, { tipo: 'espera', dur: 30 }] }); P.historia.activa = true; return E.disparar('prueba-k') })()`);
        await N('N.tick(1.6)');
        await foto(`k-${k.n}`);
        await N('(() => { H.__escenas.saltar(); return 1 })()');
        await N('N.despejar(5)');
      }
    }
    // ================================================================ I. dónde está cada cosa (para acomodar cámaras)
    if (process.env.HUMO_INFO === '1') {
      const info = await N(`(() => { const L = Object.assign({}, H.T.lugares), P2 = H.__puntosHistoria(); const o = {}; for (const [k, v] of Object.entries(Object.assign({}, L, P2))) if (v && Number.isFinite(v.x)) o[k] = { x: +v.x.toFixed(1), z: +v.z.toFixed(1), rot: v.rot === undefined ? undefined : +Number(v.rot).toFixed(2), espera: v.espera ? { x: +v.espera.x.toFixed(1), z: +v.espera.z.toFixed(1) } : undefined }; o.__gente = (H.__gente ? 1 : 0); return o })()`);
      console.log('INFO ' + JSON.stringify(info));
    }
    // ================================================================ G. la gente lejana en una escena
    // umbral-fin con la pelea: Herminia aparece en la puerta de su casa (en la aldea, a ~700 m del refugio donde vos estás). Antes de la 4.19.0 la gente a más de 130 m no se dibujaba.
    if (toca('G')) {
      donde = 'gente lejana';
      console.log('— G. la gente lejana en una escena (Herminia en su casa, desde el refugio)');
      await N('N.despejar(6)');
      await N('(() => { N.prep(12, ' + JSON.stringify({ duendes: { trato: 'pelea', final: 'pelea', perdon: true } }) + '); P.dia = Math.max(P.dia, 4); P.horas = 7.5; delete P.historia.escenas.vistas["umbral-fin"]; P.historia.activa = false; return 1 })()');
      await N('N.tick(1.0)');
      await N('(() => { P.historia.activa = true; return 1 })()');
      const rr = await N('(() => { const c = H.__colocarEscena("umbral-fin"); return { c, l: H.__escenas.disparar("umbral-fin") } })()');
      ok(rr.l, 'umbral-fin (pelea) arranca');
      await N('(() => { H.__escenas.director.acelerar(true); return 1 })()');
      const MIDO = 'H.gente.gente.find((g) => g.clave === "abuela")';
      const muestras = [];
      let sacadas = 0;
      const tVis = [], tOcu = [];
      const limite = Date.now() + 120000;
      while (Date.now() < limite) {
        const d = await N('(() => { const d = H.__escenas.director.datos(); if (!d) return null; const n = ' + MIDO + ', j = H.jugador.estado.pos; return { fase: d.fase, c: d.dialogo ? d.dialogo.completo : null, el: !!d.eleccion, f: d.fundido, h: n ? { vis: !!n.g.visible, d: Math.round(Math.hypot(n.pos.x - j.x, n.pos.z - j.z)), en: !!n.enEscena, x: Math.round(n.pos.x), z: Math.round(n.pos.z) } : null } })()');
        if (!d || d.fase === 'saliendo') break;
        muestras.push(d.h);
        if (d.h && d.h.d > 130 && d.h.vis && sacadas < 3 && d.f < 0.1) { await foto('g-herminia-' + (++sacadas)); }
        // el costo: lo que tarda un cuadro (__bucle) mientras Herminia está lejos, dibujada o no (según el código que se esté probando); en el mismo momento de la escena
        // el costo de dibujar a Herminia a 640 m: llamadas de dibujo y triángulos del mismo cuadro de la escena con la marca puesta y sacada (determinista; los milisegundos se ensucian con lo que haga la PC)
        if (d.h && d.h.d > 130 && d.h.vis && d.f < 0.1 && tVis.length < 6) { const par = await N('(() => { const n = ' + MIDO + '; const m = () => { H.__bucle(); H.__bucle(); const i = H.renderer.info.render; return [i.calls, i.triangles] }; const a = m(); n.enEscena = false; const b = m(); n.enEscena = true; H.__bucle(); return [a, b] })()'); tVis.push(par[0]); tOcu.push(par[1]); }
        if (d.el) { await N('N.tecla("Digit1")'); await N('N.tick(0.3)'); continue; }
        if (d.c) { await N('N.tecla("Enter")'); await N('N.tick(0.35)'); } else await N('N.tick(0.2)');
      }
      const lejos = muestras.filter((m) => m && m.d > 130);
      const lejosVisibles = lejos.filter((m) => m.vis);
      console.log('  muestras con Herminia a más de 130 m: ' + lejos.length + ', de ellas dibujada: ' + lejosVisibles.length + (lejos[0] ? ' (a ' + lejos[0].d + ' m, en ' + lejos[0].x + ',' + lejos[0].z + ')' : ''));
      ok(lejos.length > 0, 'Herminia estuvo a más de 130 m del jugador durante la escena');
      ok(lejos.length > 0 && lejosVisibles.length === lejos.length, 'y estuvo dibujada en todos esos cuadros (' + lejosVisibles.length + ' de ' + lejos.length + ')');
      await N('N.despejar(8)');
      await N('N.tick(1.5)');
      const fin = await N('(() => { const n = ' + MIDO + ', j = H.jugador.estado.pos; return n ? { vis: !!n.g.visible, d: Math.round(Math.hypot(n.pos.x - j.x, n.pos.z - j.z)), en: n.enEscena, conVos: !!n.conVos, enCita: !!n.enCita } : null })()');
      console.log('  después de la escena: ' + JSON.stringify(fin));
      ok(!fin || (fin.d > 130 && !fin.vis && !fin.en), 'al terminar la escena, Herminia vuelve a su estado normal (ya no está en la lista de gente, o está lejos, sin dibujar y sin la marca de escena)');
      if (tVis.length) { const dc = tVis.map((v, i) => v[0] - tOcu[i][0]), dt = tVis.map((v, i) => v[1] - tOcu[i][1]); console.log('  costo de dibujar a Herminia lejos (mismo cuadro, con la marca y sin ella): ' + dc.join('/') + ' llamadas de dibujo y ' + dt.join('/') + ' triángulos de más (' + tVis.length + ' cuadros); cuadro entero: ' + tVis[0][0] + ' llamadas, ' + tVis[0][1] + ' triángulos'); ok(Math.max(...dc) <= 12, 'dibujar a Herminia suma pocas llamadas de dibujo (' + Math.max(...dc) + ')'); }
      await N('N.despejar(10)');
    }
    // ================================================================ F. Fermín en el techo, en la noche jugable (con el galponcito levantado y el lazo con Fermín)
    if (toca('F')) {
      donde = 'fermin en el techo';
      console.log('— F. Fermín en el techo (la noche de la nevada, jugable)');
      await N('N.despejar(6)');
      await N('(() => { N.prep(11, ' + JSON.stringify({ lazos: { ramon: 2, ema: 2, fermin: 2 }, vistas: ['noche-espera'] }) + '); P.dia = Math.max(P.dia, 4); P.horas = 22.2; P.historia.activa = true; return 1 })()');
      await N('N.armarCerca("fermin")');
      const sale = await N('H.__noche().iniciar({ modo: "trato", defensas: [], aliados: { perro: false, ramon: true, josefina: true, fermin: true }, ayudas: true, fuerte: false, deuda: false, flechas: 14 })');
      ok(sale === true, 'la noche de la nevada arranca');
      await N('N.tick(2.5)');
      const q = await N('(() => { const n = H.__genteCampo().npcDe("fermin") || H.gente.gente.find((g) => g.clave === "fermin"); if (!n) return null; const x = n.pos.x, z = n.pos.z; return { sobre: +(n.pos.y - H.T.altura(x, z)).toFixed(2), visible: !!n.g.visible, d: Math.round(Math.hypot(x - H.jugador.estado.pos.x, z - H.jugador.estado.pos.z)) } })()');
      console.log('  Fermín: ' + JSON.stringify(q));
      ok(q && q.sobre > 1.8 && q.visible, 'Fermín está sobre el techo del galponcito (a ' + (q && q.sobre) + ' m del suelo) y se dibuja');
      // (parado donde la noche te deja, mirando hacia Fermín, un poco hacia arriba)
      await N('(() => { const n = H.__genteCampo().npcDe("fermin") || H.gente.gente.find((g) => g.clave === "fermin"), j = H.jugador.estado; j.yaw = Math.atan2(-(n.pos.x - j.pos.x), -(n.pos.z - j.pos.z)); j.pitch = 0.18; return 1 })()');
      await N('N.tick(0.8)');
      await foto('f-fermin-techo');
      await N('(() => { const n = H.__genteCampo().npcDe("fermin") || H.gente.gente.find((g) => g.clave === "fermin"), j = H.jugador.estado; j.yaw = Math.atan2(-(n.pos.x - j.pos.x), -(n.pos.z - j.pos.z)); j.pitch = 0.18; return 1 })()');
      await N('N.tick(0.6)');
      await foto('f-fermin-techo-2');
      await N('(() => { H.__noche().abandonar(); return 1 })()');
      const sobreFin = await N('(() => { const n = H.__genteCampo().npcDe("fermin") || H.gente.gente.find((g) => g.clave === "fermin"); return n ? { sobre: +(n.pos.y - H.T.altura(n.pos.x, n.pos.z)).toFixed(2), camino: Array.isArray(n.camino) ? n.camino.length : n.camino, ruta: !!n.ruta, conVos: !!n.conVos, enCita: !!n.enCita, sinFrenar: !!n.sinFrenar } : null })()');
      console.log('  Fermín justo al terminar la noche: ' + JSON.stringify(sobreFin));
      await N('N.tick(12)');
      const despues = await N('(() => { const n = H.__genteCampo().npcDe("fermin") || H.gente.gente.find((g) => g.clave === "fermin"); return n ? +(n.pos.y - H.T.altura(n.pos.x, n.pos.z)).toFixed(2) : null })()');
      ok(despues === null || despues < 1.5, 'al terminar la noche Fermín baja del techo y vuelve a lo suyo (' + despues + ' m del suelo a los 12 s)');
      await N('N.despejar(8)');
    }
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
        let puesto = lugar.ref ? await N(`N.dentro(${lugar.ref.join(', ')})`) : await N(`N.parar(${q}, ${lugar.dx}, ${lugar.dz})`);
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
        const marcas = process.env.HUMO_TODAS === '1' ? new Set(Array.from({ length: lineas }, (_, i) => i)) : new Set([0, Math.round(lineas * 0.2), Math.round(lineas * 0.4), Math.round(lineas * 0.6), Math.round(lineas * 0.8), Math.max(0, lineas - 1)]);   // (HUMO_TODAS=1: un cuadro por línea, hasta 15)
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
            if (marcas.has(nLinea) && nLinea !== ultima && d.f < 0.2 && cuadros.length < (process.env.HUMO_TODAS === '1' ? 15 : 6)) { await N(`N.tick(${0.5 + Number(process.env.HUMO_DEMORA || 0)})`); await sacar(); }
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
        if (process.env.HUMO_PROP && !process.env.HUMO_PROP.split(',').includes(id)) continue;
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
          const lejos0 = ['faroles-loma', 'lucecitas-raices'].includes(id) ? 14 : ['corral-abierto', 'cartel-catrileo', 'campana-taller', 'puertitas-vacias', 'cartel-notable'].includes(id) ? 5 : 2.4;
          // (4.19.0: la tranquera abierta se mira también a 14 m desde tres lados, que es donde «casi no se distinguía»)
          for (const [lejos, off] of id === 'corral-abierto' ? [[lejos0, 0], [14, 1.6], [14, -1.6], [14, 3.14]] : [[lejos0, 0]]) {
          // adentro del refugio: parado en el medio (local 0,2; 0,6), mirando al prop. Afuera: del otro lado del prop respecto del refugio, mirándolo
          await N(`(() => { const q = H.__historiaObjetos().posiciones[${JSON.stringify(id)}], r = H.T.lugares.refugio; const adentro = ${JSON.stringify(['mapa-mesa', 'arco-mesa', 'puntas-mesa', 'flechas-atado', 'arco-honda-pared', 'repisa-puertita', 'repisa-canto'].includes(id))};
            const V = ${JSON.stringify({ 'arco-honda-pared': [-1.6, -0.4], 'repisa-puertita': [-0.4, -0.9], 'repisa-canto': [-0.4, -0.9] }[id] || [0.2, 0.6])};
            if (adentro) { const c = Math.cos(r.rot || 0), s = Math.sin(r.rot || 0), x = r.x + V[0] * c + V[1] * s, z = r.z - V[0] * s + V[1] * c; N.ir(x, z, Math.atan2(-(q.x - x), -(q.z - z))); H.jugador.estado.pitch = -0.3; return 1; }
            const d = ${lejos}; let a = (Math.atan2(q.x - r.x, q.z - r.z) || 0) + ${off}; const x = q.x + Math.sin(a) * d, z = q.z + Math.cos(a) * d; N.ir(x, z, Math.atan2(-(q.x - x), -(q.z - z))); H.jugador.estado.pitch = d > 8 ? -0.02 : -0.35; return 1 })()`);
          await N('N.tick(1.0)');
          await foto((SIN ? `prop-sin-${id}` : `prop-${id}`) + (lejos !== lejos0 ? `-${lejos}m${off > 0 ? (off > 3 ? 'c' : 'a') : 'b'}` : ''));
          }
        }
        { const pn = await N('N.programas()'); if (pn !== progAntes) console.log(`    [programas ${progAntes} → ${pn} en ${id}]`); progAntes = pn; }
        await N('N.despejar(8)');   // (parado junto al galpón de esquila, majada-fin arranca sola: se la termina antes de sacar el tema)
        // y se esconde cuando ya no corresponde (sin el tema)
        await N(`(() => { for (const t of ${JSON.stringify(temas)}) delete P.historia.temas[t]; return 1 })()`);
        if (temas.length) { await N('N.tick(1.8)'); const v = await N(`!!(H.__historiaObjetos().mallas[${JSON.stringify(id)}] && H.__historiaObjetos().mallas[${JSON.stringify(id)}].visible)`); ok(!v, `${id}: sin el tema no se ve`); if (v) console.log('    diag:', JSON.stringify(await N(`(() => { const o = H.__historiaObjetos(); return { enEscena: Object.keys(o.enEscena), temas: Object.keys(P.historia.temas).filter((k) => k.startsWith('mundo:cartel')), pos: o.posiciones[${JSON.stringify(id)}], jug: { x: +H.jugador.estado.pos.x.toFixed(0), z: +H.jugador.estado.pos.z.toFixed(0) }, cap: P.historia.capitulo, activa: P.historia.activa } })()`))); }
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
