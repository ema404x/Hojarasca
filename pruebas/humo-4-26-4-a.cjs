// Partida real 4.26.4 (A) (Electron + WebGL): (1) galpon-encuentro con TU galponcito construido (adelante, atrás, al costado, mirando a la pared): duendes en cuadro y la cámara entre vos y el grupo; (2) la silueta del anochecer en el monte cerrado (molino-2, -3 y -4).
// Con -Html <index.html de la 4.26.1> repite las mismas puestas (puestas-frente.json) para el antes (capturas «base-»).
// Uso (después de node armar.mjs): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-26-4-a.ps1 [-Secciones a,b] [-Html <otro index.html>]
//   (o con el candado a mano: herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-26-4-a.cjs -Espera 2700 -Perfil <carpeta propia> -Visible)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const { DETERMINISTA } = require(path.join(raiz, 'pruebas', 'ayuda-determinista.cjs'));
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-26-4-a'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HOJ_PERFIL) app.setPath('userData', path.resolve(process.env.HOJ_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const TOPE_MIN = Number(process.env.HUMO_TOPE_MIN || 18);
setTimeout(() => { console.log(`ERROR: la prueba tardó más de ${TOPE_MIN} minutos`); try { app.exit(2); } catch { process.exit(2); } }, TOPE_MIN * 60 * 1000).unref?.();
const SEC = process.env.HUMO_SECCIONES ? new Set(process.env.HUMO_SECCIONES.split(',')) : null;
const va = (s) => (SEC ? SEC.has(s) : true);
const BASE = !!process.env.HTML;   // (con otro index.html: la 4.26.0, para el antes)

// (sin comillas invertidas adentro: el guion de la página va entero en un String.raw)
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, P = H.progreso;
  const N = window.__N = {};
  const dir = () => H.__escenas.director;
  N.cuadros = (n, ms = 50) => window.__cuadros(n, ms);
  N.programas = () => H.renderer.info.programs.length;
  N.sinUi = (si) => { let s = document.getElementById('sin-ui'); if (si && !s) { s = document.createElement('style'); s.id = 'sin-ui'; s.textContent = 'body > *:not(#mundo){visibility:hidden !important}'; document.head.appendChild(s); } if (!si && s) s.remove(); return 1; };
  N.tarjetas = () => { for (let i = 0; i < 4; i++) { const b = document.querySelector('#valle-tarjeta:not(.oculto) button[data-valle-opcion]'); if (!b) break; b.click(); N.cuadros(8); } return 1; };
  N.cerrar = () => { const d = dir(); for (let i = 0; i < 8 && d.activa(); i++) { d.saltar(); N.cuadros(10); } N.cuadros(20); return !d.activa(); };
  N.actor = (clave) => { const l = H.gente && H.gente.gente; if (!l) return null; for (const n of l) if (n.clave === clave) return n; for (const n of l) if (n.claveAldea === clave) return n; return null; };
  N.proyectar = (x, y, z) => { const v = new H.THREE.Vector3(x, y, z).project(H.camara); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, z: v.z }; };
  N.IDS = ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha', 'cuaderno', 'frios', 'golpea', 'arco', 'nevada', 'deshielo'];
  // la partida en el capítulo cap (índice), con lo anterior cerrado
  N.prep = (cap, horas) => {
    const h = P.historia;
    h.activa = true; h.empezada = h.empezada || 1; h.version = 2; h.capitulo = cap; h.fase = 'jugando'; h.terminada = 0;
    N.IDS.slice(0, cap).forEach((k) => { h.cerrados[k] = Math.max(1, P.dia - 1); });
    if (horas !== undefined) P.horas = horas;
    return 1;
  };
  // las decisiones de una partida «de trato» o «de pelea» (las de la auditoría de la 4.25.1)
  N.perfil = (p, cap) => {
    N.prep(cap === undefined ? 12 : cap);
    const h = P.historia, trato = p !== 'pelea';
    Object.assign(h.decisiones, trato ? { bolsa: 'a', coihue: 'a', molienda: 'c', cuaderno: 'a', majada: 'a', duendes: 'a' } : { bolsa: 'c', coihue: 'b', molienda: 'a', cuaderno: 'b', majada: 'c', duendes: 'c' });
    if (h.duendes) h.duendes.trato = trato ? 'trato' : 'pelea';
    for (const k of Object.keys(h.lazos || {})) h.lazos[k] = trato ? 2 : -1;
    h.acompanante = null;
    return 1;
  };
  N.motivo = () => { const js = H.jugador.estado; return { modo: H.__caidas && H.__caidas.modo(), enTren: !!js.enTren, sentado: !!js.sentado, montado: !!js.montado, tarjeta: !!document.querySelector('#valle-tarjeta:not(.oculto)') }; };
  // disparar una escena; si el juego no deja (una tarjeta, el modo), se dice por qué y se la fuerza para mirarla (como la auditoría de la 4.25.1)
  N.disparar = (id) => {
    N.tarjetas();
    if (dir().activa() && dir().idActual() !== id) N.cerrar();
    if (dir().activa() && dir().idActual() === id && dir().fase() === 'corriendo') return true;
    if (H.__escenas.disparar(id, { forzar: true })) return true;
    const m = H.__escenas.mundo, orig = m.puedeEmpezar;
    m.puedeEmpezar = () => true;
    const r = H.__escenas.disparar(id, { forzar: true });
    m.puedeEmpezar = orig;
    return r ? 'forzada ' + JSON.stringify(N.motivo()) : 'no: ' + JSON.stringify({ ...N.motivo(), activa: H.__escenas.activa(), fase: dir().fase(), idActual: dir().idActual(), hay: dir().hay(id) });
  };
  N.preparar = (id, perfil, cap, horas) => { N.cerrar(); N.tarjetas(); N.perfil(perfil || 'trato', cap); P.horas = horas === undefined ? 10 : horas; N.despejado(); try { H.__colocarEscena(id); } catch (e) { /* sin colocación */ } N.cuadros(8); return 1; };
  N.despejado = () => { const e = H.clima.estado; e.lluvia = 0; e.nublado = 0; e.objetivo = 'despejado'; e.proximo = 'despejado'; e.t = 900; return 1; };
  N.trenLejos = () => { const t = H.tren, e = t.estacion; t.est.subido = false; t.est.conduce = false; t.est.varado = false; t.est.parado = 0; t.est.vel = 0; t.est.s = (t.poste(e) + t.largo * 0.45) % t.largo; return 1; };
  // dónde cae la cara y el pecho de alguien en la pantalla (la luz se mide afuera, en la captura)
  N.marco = (clave) => { const n = N.actor(clave); if (!n) return null; const p = n.pos; const cab = N.proyectar(p.x, p.y + 1.58, p.z), men = N.proyectar(p.x, p.y + 1.38, p.z), pecho = N.proyectar(p.x, p.y + 1.15, p.z), pies = N.proyectar(p.x, p.y, p.z); return { cab, men, pecho, pies, x: p.x, y: p.y, z: p.z, cam: { x: H.camara.position.x, y: H.camara.position.y, z: H.camara.position.z } }; };

  // ---- una escena cuadro a cuadro: los saltos de la gente (con la cámara del cuadro anterior y la de este), los cortes, el velo y cuánto corre el despeje a la lente
  const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  N.velo = () => { const v = document.getElementById('escena-velo'); return v ? Number(v.style.opacity || 0) : 0; };
  N.pv = () => H.camara.projectionMatrix.clone().multiply(H.camara.matrixWorldInverse);
  N.seVeCon = (pv, p) => { const c = H.camara.position; if (Math.hypot(p.x - c.x, p.z - c.z) > 200) return false; for (const dy of [0.15, 0.9, 1.65]) { const v = new H.THREE.Vector3(p.x, p.y + dy, p.z).applyMatrix4(pv); if (v.z > -1 && v.z < 1 && Math.abs(v.x) <= 1.1 && Math.abs(v.y) <= 1.1) return true; } return false; };
  N.obs = null;
  N.empezarObs = () => {
    N.obs = { f: 0, prev: new Map(), saltos: [], camPrev: null, pvPrev: null, maxDisp: 0, maxF: -1, cortes: 0, parpadeos: 0, veloPrev: 0, lenteAdentro: 0, guion: [] };
    const m = H.__escenas.mundo;
    if (!N.__aparecer) { N.__aparecer = m.aparecer; m.aparecer = function (k, p, mira) { if (N.obs) N.obs.guion.push({ f: N.obs.f, k }); return N.__aparecer.call(this, k, p, mira); }; }
    return 1;
  };
  N.terminarObs = () => { if (N.__aparecer) { H.__escenas.mundo.aparecer = N.__aparecer; N.__aparecer = null; } return 1; };
  N.observar = () => {
    const o = N.obs; if (!o) return null;
    const d = dir(), cam = H.camara;
    const ca = { x: cam.position.x, y: cam.position.y, z: cam.position.z, yaw: cam.rotation.y, pitch: cam.rotation.x };
    const pv = N.pv();
    const cd = typeof d.cortes === 'function' ? d.cortes() : null;
    const corte = cd !== null ? (o.cortesPrev !== undefined && o.cortesPrev !== null && cd !== o.cortesPrev) : (!!o.camPrev && (Math.hypot(ca.x - o.camPrev.x, ca.y - o.camPrev.y, ca.z - o.camPrev.z) > 1.2 || Math.abs(ang(ca.yaw - o.camPrev.yaw)) > 0.35 || Math.abs(ca.pitch - o.camPrev.pitch) > 0.35));
    o.cortesPrev = cd;
    if (corte) o.cortes++;
    const velo = N.velo();
    if (velo >= 0.9 && o.veloPrev < 0.9) o.parpadeos++;
    const s = d.__sesion && d.__sesion();
    const claves = s && s.capturados ? [...s.capturados] : [];
    for (const k of claves) {
      if (k === 'jugador' || k === 'narra') continue;
      const n = N.actor(k), pm = H.__escenas.mundo.posicion(k);
      if ((n && n.g && n.g.visible === false) || !pm || !Number.isFinite(pm.y)) { o.prev.delete(k); continue; }
      const p = { x: pm.x, y: pm.y, z: pm.z }, q = o.prev.get(k);
      if (q) {
        const dd = Math.hypot(p.x - q.x, p.z - q.z);
        if (dd > 0.6) {
          const antes = !!o.pvPrev && N.seVeCon(o.pvPrev, q) && N.seVeCon(pv, q), ahora = !!o.pvPrev && N.seVeCon(o.pvPrev, p) && N.seVeCon(pv, p), tapado = corte || velo >= 0.9;
          const guion = o.guion.some((g) => g.f === o.f && (g.k === k || N.actor(g.k) === n));
          o.saltos.push({ k, f: o.f, d: Math.round(dd * 10) / 10, antes, ahora, corte, velo: Math.round(velo * 100) / 100, par: Math.round(((H.__escenas.mundo.parpadeo && H.__escenas.mundo.parpadeo()) || (H.__escenas.parpadeo && H.__escenas.parpadeo()) || 0) * 100) / 100, guion, aLaVista: (antes || ahora) && !tapado && !guion });
        }
      }
      o.prev.set(k, p);
    }
    let raw = null;
    try { raw = d.activa() ? d.camara() : null; } catch (e) { raw = null; }
    o.disp = 0;
    if (raw && raw.foco) { const ux = raw.x - raw.foco.x, uz = raw.z - raw.foco.z, L = Math.hypot(ux, uz); if (L > 0.05) o.disp = Math.abs(ux * (ca.z - raw.foco.z) - uz * (ca.x - raw.foco.x)) / L; }
    if (o.disp > o.maxDisp) { o.maxDisp = o.disp; o.maxF = o.f; }
    if (raw) { const b = { x: ca.x, y: ca.y - 0.45, z: ca.z }; try { H.col.resolver(b, 0.22, 0.7); } catch (e) { /* sin choque */ } if (Math.hypot(b.x - ca.x, b.z - ca.z) > 0.06) o.lenteAdentro++; }
    o.camPrev = ca; o.pvPrev = pv; o.veloPrev = velo; o.f++;
    return o;
  };
  // correr la escena activa: avanza los diálogos y elige la opción o.elegir (0 por defecto), hasta que termina o hasta max cuadros. Con o.pararEnMax se detiene
  // en el cuadro en que el corrimiento de la lente pasa al máximo anterior (o.ultimo) por 0,15 m; con o.pararEnEleccion, cuando hay una elección a la vista
  N.correr = (max, o) => {
    o = o || {};
    const d = dir();
    for (let i = 0; i < max; i++) {
      N.cuadros(1);
      const ob = N.observar();
      if (!d.activa()) return { fin: true };
      const dat = d.datos();
      if (dat && dat.eleccion) {
        if (o.pararEnEleccion && d.eleccionLista()) return { fin: false, eleccion: dat.eleccion.opciones.map((x) => x.texto || x.id) };
        if (d.eleccionLista()) d.elegir(o.elegir || 0);
      } else if (dat && dat.dialogo) d.avanzar();
      if (o.pararEnMax && ob && ob.maxF === ob.f - 1 && ob.maxDisp >= (o.ultimo || 0) + 0.15 && ob.maxDisp >= 0.05) return { fin: false, max: ob.maxDisp, f: ob.maxF };
    }
    return { fin: false };
  };
  // las llegadas forzadas: quien camina primero arranca lejos (200 m), a la vista (70 m delante de la cámara) o queda trabado (no avanza)
  N.ganchoInfo = null; N.__caminar = null;
  N.gancho = (modo) => {
    N.ganchoInfo = { modo, hecho: false };
    if (modo === 'tal-cual') return 1;
    const m = H.__escenas.mundo, orig = m.caminar;
    N.__caminar = orig;
    m.caminar = function (clave, d, o) {
      const info = N.ganchoInfo;
      if (info.hecho) return orig.call(this, clave, d, o);
      const n = N.actor(clave);
      if (!n) return orig.call(this, clave, d, o);
      info.hecho = true; info.quien = clave;
      if (modo === 'lejos') { const a = 2.1; const x = d.x + Math.sin(a) * 200, z = d.z + Math.cos(a) * 200; n.pos.set(x, T.altura(x, z), z); info.desde = 200; }
      if (modo === 'a-la-vista') {
        const c = H.camara.position, f = new H.THREE.Vector3(0, 0, -1).applyQuaternion(H.camara.quaternion);
        let x = c.x + f.x * 70, z = c.z + f.z * 70;
        if (Math.hypot(x - d.x, z - d.z) < 55) { x = c.x + f.x * 95; z = c.z + f.z * 95; }
        n.pos.set(x, T.altura(x, z), z); info.desde = Math.round(Math.hypot(x - d.x, z - d.z)); info.seVe = N.seVeCon(N.pv(), n.pos);
      }
      if (N.obs && (modo === 'lejos' || modo === 'a-la-vista')) N.obs.prev.set(clave, { x: n.pos.x, y: n.pos.y, z: n.pos.z });
      const r = orig.call(this, clave, d, o);
      if (modo === 'trabado') { n.velocidad = 0.001; info.trabado = true; }
      return r;
    };
    return 1;
  };
  N.diagLente = () => {
    const d = dir(); let raw = null; try { raw = d.camara(); } catch (e) { raw = null; }
    if (!raw || !raw.foco) return null;
    const f = raw.foco, c = H.camara.position, r2 = (v) => Math.round(v * 100) / 100;
    const choca = (x, y, z, r) => { const b = { x, y: y - 0.45, z }; try { H.col.resolver(b, r, 0.7); } catch (e) { return false; } return Math.hypot(b.x - x, b.z - z) > 0.02; };
    const L = Math.hypot(raw.x - f.x, raw.y - f.y, raw.z - f.z), muestras = [];
    for (let s = 0.4; s <= L; s += 0.3) { const k = s / L; if (choca(f.x + (raw.x - f.x) * k, f.y + (raw.y - f.y) * k, f.z + (raw.z - f.z) * k, 0.3)) muestras.push(r2(s)); }
    return { foco: [r2(f.x), r2(f.y), r2(f.z)], guion: [r2(raw.x), r2(raw.y), r2(raw.z)], lente: [r2(c.x), r2(c.y), r2(c.z)], L: r2(L), focoAdentro: choca(f.x, f.y, f.z, 0.3), guionAdentro: choca(raw.x, raw.y, raw.z, 0.25), chocanEn: muestras.slice(0, 12), alLente: r2(Math.hypot(c.x - f.x, c.y - f.y, c.z - f.z)) };
  };
  N.sinGancho = () => { if (N.__caminar) { H.__escenas.mundo.caminar = N.__caminar; N.__caminar = null; } return 1; };
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
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 150000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, T = H.T; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = (extra = {}) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false}, ${JSON.stringify(extra)}))); 1`;
  const entrar = async (saltarEscenas = true, cuadros = 60) => {
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js('window.__sinPausaPorBlur = true; 1');
    await js(DETERMINISTA(42611));
    await js(PAGINA);
    if (cuadros) await N(`N.cuadros(${cuadros})`);
    if (saltarEscenas) {
      await N('N.tarjetas()');
      await N('(() => { const d = H.__escenas.director; for (let i = 0; i < 6 && d.activa(); i++) { d.saltar(); N.cuadros(10); } return 1 })()');
      await N('N.tarjetas()');
    }
  };
  const abrir = async (extra = {}) => { await w.loadFile(url, { search: '?debug=1' }); await js(ajustes(extra)); await w.loadFile(url, { search: '?debug=1' }); await entrar(); };
  // cerrar el juego y volver a abrirlo: la misma partida (sin borrar nada), como quien sale y entra
  const reabrir = async () => { await w.loadFile(url, { search: '?debug=1' }); await entrar(false, 0); };
  const captura = async () => { for (let k = 0; k < 4; k++) { try { await esperar(350 + k * 300); return await w.webContents.capturePage(); } catch (e) { if (k === 3) throw e; } } return null; };
  const guardar = (img, nombre) => { if (!img) return; fs.writeFileSync(path.join(salida, (BASE ? 'base-' : '') + nombre + '.png'), img.toPNG()); console.log(`  (captura ${(BASE ? 'base-' : '') + nombre}.png)`); };
  // luminancia media (0 a 255) de un rectángulo de la captura
  const lum = (img, x0, y0, x1, y1) => {
    const { width, height } = img.getSize(), b = img.toBitmap();
    let s = 0, n = 0;
    for (let y = Math.max(0, Math.round(y0)); y < Math.min(height, Math.round(y1)); y++) for (let x = Math.max(0, Math.round(x0)); x < Math.min(width, Math.round(x1)); x++) { const i = (y * width + x) * 4; s += 0.114 * b[i] + 0.587 * b[i + 1] + 0.299 * b[i + 2]; n++; }
    return n ? s / n : 0;
  };
  // la cara (entre la frente y el mentón) y el pecho de alguien, medidos en la captura
  const luzDe = (img, m) => {
    if (!m || m.cab.z > 1 || m.men.z > 1) return null;
    const alto = Math.max(4, m.men.y - m.cab.y), ancho = alto * 0.7;
    const cara = lum(img, m.cab.x - ancho / 2, m.cab.y - alto * 0.4, m.cab.x + ancho / 2, m.men.y);
    const pecho = lum(img, m.pecho.x - ancho, m.pecho.y - alto * 0.6, m.pecho.x + ancho, m.pecho.y + alto * 0.6);
    const { width, height } = img.getSize();
    const todo = lum(img, 0, height * 0.12, width, height * 0.88);
    return { cara: Math.round(cara), pecho: Math.round(pecho), todo: Math.round(todo), altoCara: Math.round(alto) };
  };
  const recorte = (img, m, nombre, ancho = 360, alto = 300) => {
    try { const x0 = Math.max(0, Math.round(m.cab.x - ancho / 2)), y0 = Math.max(0, Math.round(m.cab.y - alto * 0.3)); const r = img.crop({ x: x0, y: y0, width: Math.min(ancho, ANCHO - x0), height: Math.min(alto, ALTO - y0) }); fs.writeFileSync(path.join(salida, (BASE ? 'base-' : '') + nombre + '.png'), r.toPNG()); } catch (e) { console.log('  (recorte no: ' + e.message + ')'); }
  };
  const arranco = (r) => r === true || String(r).startsWith('forzada');

  let prog0 = 0;
  try {
    donde = 'entrar';
    await abrir();
    await N('(() => { N.despejado(); P.dia = 30; P.horas = 12; return 1 })()');
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0, BASE ? `(con ${url})` : '');

    // ================================================================ la gente de galpon-encuentro con TU galponcito construido, mirando a la pared y en campo abierto
    if (va('galpon')) {
      donde = 'galpon';
      console.log('— galpon-encuentro con el galponcito construido');
      // (las puestas de la 4.26.3: pared = la estación; abierto = el prado del molino)
      const CASOS = [
        { nombre: 'pared', x: -227.72836338639598, z: 303.2855615844734, yaw: Math.PI, galpon: { lado: 1, d: 7 } },
        { nombre: 'pared-galpon-costado', x: -227.72836338639598, z: 303.2855615844734, yaw: Math.PI, galpon: { lado: 1, d: 5 } },
        { nombre: 'plano-costado', x: 0, z: 0, yaw: 0, galpon: { lado: 1, d: 7 } },
        { nombre: 'pared-galpon-atras', x: -227.72836338639598, z: 303.2855615844734, yaw: Math.PI, galpon: { lado: 2, d: 7 } },
        { nombre: 'plano', x: 0, z: 0, yaw: 0, galpon: { lado: 0, d: 7 } },
        { nombre: 'plano-de-espaldas', x: 0, z: 0, yaw: 0, galpon: { lado: 2, d: 7 } },
      ];
      await js(`(() => {
        const H = window.__hojarasca, N = window.__N, T = H.T;
        // el galponcito terminado a d metros del jugador: lado 0 = adelante, 1 = a la derecha, 2 = atrás (obras.sincronizar: sin los chequeos del colocador)
        N.galponcito = (d, lado) => {
          const E = H.jugador.estado, ang = E.yaw + (lado === 1 ? -Math.PI / 2 : lado === 2 ? Math.PI : 0);
          const x = E.pos.x - Math.sin(ang) * d, z = E.pos.z - Math.cos(ang) * d;
          const O = H.obras;
          for (const o of O.obras.filter((q) => q.plano.id === 'galponcito')) O.destruir(o);   // (la Historia toma el primero terminado: uno solo)
          O.sincronizar([{ plano: 'galponcito', x, z, y: T.altura(x, z), rot: ang, etapas: 99 }]);
          for (let i = 0; i < 20; i++) H.__bucle();
          return { x, z, n: O.obras.filter((o) => o.plano.id === 'galponcito').length };
        };
        // un sitio plano y sin árboles cerca (como el claro de las casas de las auditorías): el centro del galponcito y el jugador 7 m antes, mirándolo
        N.sitioPlano = () => {
          const pend = (x, z) => Math.max(Math.abs(T.altura(x + 3, z) - T.altura(x - 3, z)), Math.abs(T.altura(x, z + 3) - T.altura(x, z - 3))) / 6;
          const r0 = T.lugares.refugio;
          for (let r = 30; r < 300; r += 4) for (let a = 0; a < 6.28; a += 0.1) {
            const x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
            if (Math.abs(x) > 430 || Math.abs(z) > 430 || T.agua(x, z)) continue;
            let bien = pend(x, z) < 0.03;
            for (let k = 0; k < 8 && bien; k++) for (const d of [6, 12]) { const px = x + Math.cos(k * 0.785) * d, pz = z + Math.sin(k * 0.785) * d; if (pend(px, pz) > 0.045 || T.agua(px, pz)) bien = false; }
            if (bien && !(H.veg.arboles || []).some((q) => Math.hypot(q.x - x, q.z - z) < 14)) return { x, z };
          }
          return { x: -30.4, z: 241, fijo: true };   // (el claro plano de las auditorías de las casas)
        };
        return 1;
      })()`);
      const sitio = await N('N.sitioPlano()');
      console.log('  sitio plano:', JSON.stringify(sitio));
      for (const C of CASOS) {
        if (C.nombre.startsWith('plano')) { if (!sitio) { ok(false, 'no hay sitio plano'); continue; } C.x = sitio.x; C.z = sitio.z + 7; C.yaw = 0; }
        const id = 'galpon-encuentro';
        await N(`N.preparar(${JSON.stringify(id)}, 'trato', 9, 23)`);
        await N('(() => { const dh = H.__duendesHist && H.__duendesHist(); if (dh) dh.limpiar(); return 1 })()');
        await N(`(() => { H.jugador.ubicar(${C.x}, ${C.z}, ${C.yaw}); N.cuadros(8); return 1 })()`);
        const g = await N(`N.galponcito(${C.galpon.d}, ${C.galpon.lado})`);
        await N('N.trenLejos()');   // (la trochita no está en el andén, tapando la vista del grupo)
        await N('N.cuadros(20)');
        const pto = await N(`(() => { const p = H.__puntosHistoria(); return p['galpon-noche'] ? { x: p['galpon-noche'].x, z: p['galpon-noche'].z, propio: !!p['galpon-propio'] } : null })()`);
        console.log(`  ${C.nombre}: galponcito en (${g.x.toFixed(1)}, ${g.z.toFixed(1)}), obras ${g.n}; galpon-noche: ${JSON.stringify(pto)}`);
        ok(!!pto && pto.propio, `${C.nombre}: la Historia ve el galponcito (galpon-propio)`);
        await N(`(() => { H.jugador.ubicar(${C.x}, ${C.z}, ${C.yaw}); N.cuadros(4); return 1 })()`);
        const r = await N(`N.disparar(${JSON.stringify(id)})`);
        if (!arranco(r)) { ok(false, `${C.nombre}: no arrancó (${r})`); continue; }
        await N('N.sinUi(true)');
        const lista = [];
        for (let k = 0; k < 8; k++) {
          await N('N.cuadros(70)');
          const info = await N(`(() => { const d = H.__escenas.director; if (!d.activa()) return null; const s = d.__sesion(); const p0 = H.jugador.estado.pos; const cam = H.camara.position; const gal = H.obras.obras.find((o) => o.plano.id === 'galponcito'); return { paso: s ? s.idx : -1, t: s ? +s.t.toFixed(1) : -1, cam: [+cam.x.toFixed(1), +cam.y.toFixed(1), +cam.z.toFixed(1)], jug: [+p0.x.toFixed(1), +p0.z.toFixed(1)], gal: gal ? [+gal.datos.x.toFixed(1), +gal.datos.z.toFixed(1)] : null, centro: (() => { const dh = H.__duendesHist && H.__duendesHist(); const l = dh ? dh.lista() : []; if (!l.length) return null; const cx = l.reduce((t, q) => t + q.posicion.x, 0) / l.length, cz = l.reduce((t, q) => t + q.posicion.z, 0) / l.length; return { dJug: +Math.hypot(cx - p0.x, cz - p0.z).toFixed(1), dCam: +Math.hypot(cx - cam.x, cz - cam.z).toFixed(1), camJug: +Math.hypot(cam.x - p0.x, cam.z - p0.z).toFixed(1) }; })(), duendes: (() => { const dh = H.__duendesHist && H.__duendesHist(); const l = dh ? dh.lista() : []; const pv = N.pv(); return { n: l.length, vistos: l.filter((q) => { const p = q.posicion; return Number.isFinite(p.x) && N.seVeCon(pv, p); }).length, ej: l.slice(0, 3).map((q) => { const p = q.posicion; return [q.tipo, q.estado, +(p.x || 0).toFixed(1), +(p.y || 0).toFixed(1), +(p.z || 0).toFixed(1)]; }) }; })() } })()`);
          if (!info) break;
          lista.push(info);
          guardar(await captura(), `galpon-${C.nombre}-${k}`);
          await N('(() => { const d = H.__escenas.director; const dd = d.datos && d.datos(); if (dd && ((dd.dialogo && dd.dialogo.completo) || dd.eleccion)) { if (dd.eleccion) { if (d.eleccionLista()) d.elegir(0); } else d.avanzar(); } return 1 })()');
        }
        for (const q of lista) console.log(`    paso ${q.paso} t ${q.t}: camara ${q.cam} jugador ${q.jug} galponcito ${q.gal} centro ${JSON.stringify(q.centro)} duendes ${JSON.stringify(q.duendes)}`);
        const sumaV = lista.reduce((t, q) => t + q.duendes.vistos, 0), sumaN = lista.reduce((t, q) => t + q.duendes.n, 0);
        const conGrupo = lista.filter((q) => q.duendes.n > 0);
        ok(conGrupo.length > 0 && conGrupo.filter((q) => q.duendes.vistos < Math.ceil(q.duendes.n * 0.5)).length <= 1, `${C.nombre}: con la gente puesta, la cámara ve a la mayoría en todas las capturas salvo una (la del cerro por la ventana, que no es de la gente) (vistos/n: ${conGrupo.map((q) => q.duendes.vistos + '/' + q.duendes.n).join(' ')})`);
        ok(conGrupo.every((q) => !q.centro || q.centro.dCam <= q.centro.dJug + 3), `${C.nombre}: la cámara del lado tuyo (a lo sumo ${Math.max(0, ...conGrupo.map((q) => q.centro ? q.centro.dCam - q.centro.dJug : 0)).toFixed(1)} m más lejos del grupo que vos)`);
        ok(lista.length > 0, `${C.nombre}: la escena corrió y se capturó (${lista.length} capturas)`);
        await N('N.cerrar()');
        await N('N.sinUi(false)');
      }
    }

    if (va('silueta')) {
      donde = 'silueta';
      console.log('— la silueta del anochecer en el monte cerrado');
      await N('(() => { N.cerrar(); N.tarjetas(); N.despejado(); return 1 })()');
      await N('N.sinUi(true)');
      for (const [k, r] of [['molino', 2], ['molino', 3], ['molino', 4]]) {
        let hecho = false;
        for (let intento = 0; intento < 3 && !hecho; intento++) {
          const q = await N(`(() => { N.prep(2, 18.9); const s = T.lugares[${JSON.stringify(k)}]; H.jugador.ubicar(s.x + 7, s.z + 7, ${r} * Math.PI / 4); const pres = H.__presencia(); const antes = pres.silueta(); if (antes && antes.quitar) { try { antes.quitar(); } catch (e) {} } let si = false; for (let i = 0; i < 6 && !si; i++) si = pres.forzarSilueta(); N.cuadros(40); const sil = pres.silueta(); const p = sil && sil.posicion; const j = H.jugador.estado.pos; if (!(si && p)) return { si }; const pant = N.proyectar(p.x, p.y + 1, p.z); return { si, d: Math.hypot(p.x - j.x, p.z - j.z), y: p.y, suelo: T.altura(p.x, p.z), agua: !!T.agua(p.x, p.z), pant, enPantalla: pant.z > 0 && pant.z < 1 && pant.x > 0 && pant.x < innerWidth && pant.y > 0 && pant.y < innerHeight, estado: sil.estado } })()`);
          if (q.si && q.d !== undefined) {
            hecho = true;
            console.log(`  ${k}-${r}: silueta a ${q.d.toFixed(1)} m, y ${q.y.toFixed(2)} sobre suelo ${q.suelo.toFixed(2)}, agua ${q.agua}, pantalla (${Math.round(q.pant.x)}, ${Math.round(q.pant.y)}), estado ${q.estado}`);
            ok(q.d >= 11.5 && q.d <= 24.5, `${k}-${r}: aparece de 12 a 24 m`);
            ok(Math.abs(q.y - q.suelo) < 0.6 && !q.agua, `${k}-${r}: parada en el piso, fuera del agua`);
            ok(q.enPantalla, `${k}-${r}: dentro del cuadro`);
            guardar(await captura(), `silueta-${k}-${r}`);
          }
        }
        ok(hecho, `${k}-${r}: la silueta aparece`);
      }
      await N('(() => { const sil = H.__presencia().silueta(); if (sil && sil.quitar) sil.quitar(); return 1 })()');
      await N('N.sinUi(false)');
    }

    donde = 'cierre';
    const prog = await js('window.__hojarasca.renderer.info.programs.length').catch(() => prog0);
    ok(prog <= prog0 + 3, `programas de shader: ${prog0} → ${prog} (la noche y las siluetas arman los suyos de siempre; esta versión no suma ninguno)`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
