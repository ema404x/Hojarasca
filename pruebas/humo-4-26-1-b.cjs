// Partida real 4.26.1 (B) (Electron + WebGL): las cinemáticas y la Historia, a ojo. Mundo determinista (ayuda-determinista.cjs: el mundo avanza sólo con los
// cuadros de la prueba), 1366x768, calidad media. Secciones (HUMO_SECCIONES=a,b,… ; por defecto, todas menos elsaVar):
//   elsa       el plano de cerca de Elsa en el andén (escena elsa-anden de verdad) a varias horas: cuánta luz le da en la cara (luminancia medida en la captura)
//   elsaVar    (sólo a pedido) las puestas de prueba para elegir la del arreglo: Elsa y la cámara en varios lugares del andén, a varias horas (v0 = la de la 4.26.0)
//   libre      el motor: un plano `libre` sin `posFin` (y uno con `posFin` sin `dy`) no baja la cámara al piso: la altura de la lente al empezar y al terminar
//   camara     los tres peores planos donde la 4.25.1 corrió la lente fuera de un sólido (fiesta-nieve, coihue-talado, galpon-encuentro): captura del cuadro en que
//              la lente se corrió más, y que nunca quede adentro de un sólido
//   llegadas   las caminatas de las escenas (ramon-tranquera, majada-fermin, ese-no-josefina, mulas-belisario): tal cual, arrancando lejos (200 m), arrancando a
//              la vista (70 m delante de la cámara) y trabada; cada salto de más de 0,6 m de un cuadro al otro se anota con si la cámara lo veía (no puede)
//   silueta    la silueta del anochecer (capítulos 2 a 4): desde cuatro lugares y mirando a ocho rumbos, cuántas veces encuentra lugar (forzarSilueta, las reglas de
//              colocación del capítulo) y cuántos árboles tiene alrededor; capturas de tres
//   tocon      el resumen del bosque de la pausa con el coihue grande talado (D2 = b): el tocón no cuenta
//   ramon      Ramón con el mate en las poses de trabajo (palear, hachar, tocar), de perfil y de frente
//   paces      las paces con Fermín (capítulo 11) con una y con dos cosas para regalar: cuántas opciones se ofrecen y qué se cobra
//   coihue     la H junto al coihue grande antes del capítulo 5: el aviso, la nota, y que no se tala
//   nevada     ganar la noche de la nevada, cerrar el juego en la escena del final y volver a abrir: amanece en el galpón
// Uso (después de node armar.mjs): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-26-1-b.ps1 [-Secciones a,b] [-Html <otro index.html>]
//   (o con el candado a mano: herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-26-1-b.cjs -Espera 2700 -Perfil <carpeta propia> -Visible)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const { DETERMINISTA } = require(path.join(raiz, 'pruebas', 'ayuda-determinista.cjs'));
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-26-1-b'));
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
const va = (s) => (SEC ? SEC.has(s) : s !== 'elsaVar');
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

    // ================================================================ el plano de cerca de Elsa (la escena de verdad y, con elsaVar, las puestas de prueba)
    const HORAS = (process.env.HUMO_HORAS || '8,11,14,17,19.5,20.5').split(',').map(Number);
    if (va('elsa') || va('elsaVar')) {
      donde = 'elsa';
      console.log('— el plano de cerca de Elsa en el andén');
      await N('N.prep(1, 10)');
      await N('(() => { P.historia.escenas.vistas["ramon-tranquera"] = 1; delete P.historia.escenas.vistas["elsa-anden"]; if (P.entradas) delete P.entradas.viaje; return 1 })()');
      await N('(() => { N.trenLejos(); const e = H.tren.estacion; H.jugador.ubicar(e.espera.x, e.espera.z, 0); return 1 })()');
      await N('N.sinUi(true)');
      // en el marco del andén: lx sigue la vía, lz se aleja de ella (negativo: hacia la vía y del otro lado)
      const PUESTAS = [];
      if (va('elsa')) PUESTAS.push({ id: 'escena' });
      if (va('elsaVar')) PUESTAS.push(
        { id: 'v0-alero', a: { lx: 1.7, lz: -0.4 }, mira: { lx: 2.4, lz: -9 }, cam: { lx: 2.6, lz: -5.6, dy: 1.7 } },
        { id: 'v1-punta-via', a: { lx: 7.2, lz: -0.5 }, mira: { lx: 7.6, lz: -9 }, cam: { lx: 7.8, lz: -5.6, dy: 1.7 } },
        { id: 'v5-punta-cartel', a: { lx: 7.0, lz: -0.9 }, mira: { lx: 6.2, lz: -9 }, cam: { lx: 5.6, lz: -5.4, dy: 1.7 } },
        { id: 'v4-filo-sol', a: { lx: 6.2, lz: -1.2 }, mira: { lx: 9.5, lz: 1.6 }, cam: { lx: 9.6, lz: 1.8, dy: 1.7 } },
      );
      const tabla = [];
      for (const h of HORAS) {
        for (const pu of PUESTAS) {
          await N(`(() => { N.cerrar(); P.horas = ${h}; N.despejado(); N.trenLejos(); P.historia.escenas.vistas["elsa-anden"] = 1; return 1 })()`);
          await N('N.cuadros(30)');
          if (pu.id === 'escena') await N('(() => { delete P.historia.escenas.vistas["elsa-anden"]; return 1 })()');
          let r;
          if (pu.id === 'escena') r = await N('N.disparar("elsa-anden")');
          else {
            // la de prueba: un plano `libre` SIN posFin (como el arreglo), 30 s
            const escena = { id: 'prueba-elsa-' + pu.id, repetible: true, personajes: {}, pasos: [
              { tipo: 'gesto', quien: 'elsa', accion: 'aparecer', a: { lugar: 'estacion', ...pu.a }, mira: { lugar: 'estacion', ...pu.mira } },
              { tipo: 'plano', plano: 'libre', pos: { lugar: 'estacion', ...pu.cam }, mira: { ref: 'elsa', dy: 1.45 }, fov: 48, mezcla: 0, dur: 30, sinEsperar: true },
              { tipo: 'espera', dur: 30 } ] };
            r = await N(`(() => { const x = H.__escenas.registrar(${JSON.stringify(escena)}); if (!x.ok) return 'mal: ' + x.errores.join('; '); return N.disparar(${JSON.stringify(escena.id)}) })()`);
          }
          if (!arranco(r)) { console.log(`  ${pu.id} a las ${h}: no arrancó (${r})`); continue; }
          if (pu.id === 'escena' && h === 11) { await N('(() => { for (let i = 0; i < 200; i++) { const s = H.__escenas.director.__sesion(); if (!s || s.t >= 1.3) break; N.cuadros(1); } return 1 })()'); guardar(await captura(), 'elsa-escena-plano-largo-11'); }
          // la de verdad: el plano largo dura 2,6 s y el de cerca entra en 1 s (a los 4,2 s); las de prueba, a los 1,5 s
          await N(`(() => { const meta = ${pu.id === 'escena' ? 4.2 : 1.5}; for (let i = 0; i < 400; i++) { const s = H.__escenas.director.__sesion(); if (!s || s.t >= meta) break; N.cuadros(1); } return 1 })()`);
          const m = await N('N.marco("guarda")');
          const encima = await N('(() => { const n = N.actor("guarda"); if (!n) return null; const r = new H.THREE.Raycaster(new H.THREE.Vector3(n.pos.x, n.pos.y + 1.75, n.pos.z), new H.THREE.Vector3(0, 1, 0), 0, 8); const h = r.intersectObjects(H.escena.children, true).filter((x) => x.object.visible !== false); return h.length ? { a: +(h[0].distance.toFixed(2)), que: h[0].object.name || h[0].object.type } : "cielo" })()');
          if (pu.id === 'escena') console.log(`  (sobre la cabeza de Elsa: ${JSON.stringify(encima)})`);
          const img = await captura();
          const l = luzDe(img, m);
          tabla.push({ h, id: pu.id, ...l, camY: m && m.cam.y });
          console.log(`  ${pu.id} a las ${h} h: cara ${l ? l.cara : '?'} · pecho ${l ? l.pecho : '?'} · cuadro ${l ? l.todo : '?'} (alto de la cara ${l ? l.altoCara : '?'} px)`);
          guardar(img, `elsa-${pu.id}-${String(h).replace('.', '_')}`);
          if (m) recorte(img, m, `elsa-${pu.id}-${String(h).replace('.', '_')}-cara`);
          await N('N.cerrar()');
        }
      }
      fs.writeFileSync(path.join(salida, (BASE ? 'base-' : '') + 'elsa-luz.json'), JSON.stringify(tabla, null, 1));
      await N('N.sinUi(false)');
    }

    // ================================================================ el motor: un plano libre sin posFin no baja la cámara
    if (va('libre')) {
      donde = 'libre';
      console.log('— el plano libre sin posFin (el motor)');
      await N('(() => { N.cerrar(); N.prep(3, 11); N.despejado(); N.trenLejos(); const e = H.tren.estacion; H.jugador.ubicar(e.espera.x, e.espera.z, 0); return 1 })()');
      await N('N.cuadros(20)');
      const escena = { id: 'prueba-libre-4261', repetible: true, personajes: {}, pasos: [
        { tipo: 'plano', plano: 'libre', pos: { lugar: 'estacion', lx: 0, lz: -13, dy: 2.2 }, mira: { lugar: 'estacion', lx: 0, lz: -2.4 }, fov: 55, mezcla: 0, dur: 6 },
        { tipo: 'plano', plano: 'libre', pos: { lugar: 'estacion', lx: -3, lz: -13, dy: 2.2 }, mira: { lugar: 'estacion', lx: -3, lz: -2.4 }, posFin: { lugar: 'estacion', lx: -6, lz: -13 }, fov: 55, mezcla: 0, dur: 6 } ] };
      const r = await N(`(() => { const x = H.__escenas.registrar(${JSON.stringify(escena)}); if (!x.ok) return 'mal: ' + x.errores.join('; '); return N.disparar(${JSON.stringify(escena.id)}) })()`);
      if (!arranco(r)) ok(false, `la escena de prueba del plano libre no arrancó (${r})`);
      else {
        await N('N.sinUi(true)');
        const alto = async (t) => N(`(() => { for (let i = 0; i < 400; i++) { const s = H.__escenas.director.__sesion(); if (!s || s.t >= ${t}) break; N.cuadros(1); } const c = H.camara.position; return { y: c.y, suelo: T.altura(c.x, c.z), t: H.__escenas.director.__sesion() ? H.__escenas.director.__sesion().t : -1 } })()`);
        const a0 = await alto(0.6); guardar(await captura(), 'libre-sinposfin-empieza');
        const a1 = await alto(5.6); guardar(await captura(), 'libre-sinposfin-termina');
        const b0 = await alto(6.6);
        const b1 = await alto(11.6); guardar(await captura(), 'libre-posfin-sin-dy-termina');
        const f = (a) => `${a.y.toFixed(2)} (${(a.y - a.suelo).toFixed(2)} sobre el suelo)`;
        console.log(`  sin posFin: la lente a los 0,6 s ${f(a0)} · a los 5,6 s ${f(a1)}`);
        console.log(`  posFin sin dy: a los 0,6 s del plano ${f(b0)} · a los 5,6 s ${f(b1)}`);
        ok(Math.abs(a1.y - a0.y) < 0.05, `un plano libre sin posFin deja la lente a la misma altura (${a0.y.toFixed(2)} → ${a1.y.toFixed(2)})`);
        ok(Math.abs(b1.y - b0.y) < 0.6, `con un posFin sin dy la lente no baja al piso (${b0.y.toFixed(2)} → ${b1.y.toFixed(2)}; el punto final está 2 m más allá, con su suelo)`);
        await N('N.cerrar()');
        await N('N.sinUi(false)');
      }
    }

    // ================================================================ los tres peores planos donde la 4.25.1 corrió la lente
    if (va('camara')) {
      donde = 'camara';
      console.log('— la lente corrida (fiesta-nieve, coihue-talado, galpon-encuentro)');
      // como en el juego: cada escena en su capítulo, a su hora y con el jugador donde la dispara (la auditoría de la 4.25.1 las corrió todas en el capítulo 13, con el
      // coihue en pie y el jugador en cualquier lado)
      const CAMARA = [
        { id: 'fiesta-nieve', perfil: 'trato', cap: 12, horas: 19, lugar: 'plaza', dist: 12 },
        { id: 'coihue-talado', perfil: 'pelea', cap: 4, horas: 11, talar: true },
        { id: 'galpon-encuentro', perfil: 'trato', cap: 9, horas: 23, lugar: 'galpon-noche', dist: 9 },
      ];
      for (const C of CAMARA) {
        const id = C.id;
        await N(`N.preparar(${JSON.stringify(id)}, ${JSON.stringify(C.perfil)}, ${C.cap}, ${C.horas})`);
        if (C.talar) await N(`(() => { const h = P.historia; const iC = H.veg.arboles.findIndex((a) => a.grande === true); const a = H.veg.arboles[iC]; if (a && !a.sacado) { H.veg.talar(a, { x: 1, z: 0.3 }); H.talados().push({ i: iC, dia: P.dia, esc: -1 }); } h.temas = h.temas || {}; h.temas['mundo:coihue-talado'] = P.dia; N.cuadros(120); try { H.__colocarEscena(${JSON.stringify(id)}); } catch (e) {} N.cuadros(8); return 1 })()`);
        if (C.lugar) { const q = await N(`(() => { const p = H.__puntosHistoria()[${JSON.stringify(C.lugar)}] || T.lugares[${JSON.stringify(C.lugar)}]; const r = T.lugares.refugio; if (!p) return null; const a = Math.atan2(r.x - p.x, r.z - p.z), x = p.x + Math.sin(a) * ${C.dist}, z = p.z + Math.cos(a) * ${C.dist}; H.jugador.ubicar(x, z, Math.atan2(p.x - x, p.z - z) - Math.PI); N.cuadros(8); return { x, z } })()`); if (!q) console.log(`  (${id}: sin el lugar ${C.lugar})`); }
        const r = await N(`N.disparar(${JSON.stringify(id)})`);
        if (!arranco(r)) { ok(false, `${id}: no arrancó (${r})`); continue; }
        await N('N.sinUi(true)');
        await N('N.empezarObs()');
        let ultimo = 0, capt = 0;
        for (let k = 0; k < 60; k++) {
          const q = await N(`N.correr(500, { pararEnMax: true, ultimo: ${ultimo} })`);
          if (q.fin) break;
          if (q.max !== undefined) { ultimo = q.max; capt++; guardar(await captura(), `camara-${id}`); const paso = await N('(() => { const s = H.__escenas.director.__sesion(); return s ? s.idx : -1 })()'); const dg = await N('N.diagLente()'); console.log(`    (lente corrida ${q.max.toFixed(2)} m al costado en el cuadro ${q.f}, paso ${paso}: ${JSON.stringify(dg)})`); }
        }
        const ob = await N('({ f: N.obs.f, maxDisp: N.obs.maxDisp, maxF: N.obs.maxF, lenteAdentro: N.obs.lenteAdentro })');
        console.log(`  ${id}: ${ob.f} cuadros; la lente se corrió al costado (el arreglo de la 4.25.1) como mucho ${ob.maxDisp.toFixed(2)} m (cuadro ${ob.maxF}; ${capt} capturas)`);
        ok(ob.lenteAdentro === 0, `${id}: la lente nunca queda adentro de un sólido (${ob.lenteAdentro} cuadros)`);
        await N('N.cerrar()');
        await N('N.sinUi(false)');
      }
    }

    // ================================================================ las llegadas: nadie salta a la vista
    if (va('llegadas')) {
      donde = 'llegadas';
      console.log('— las llegadas (34 m y la caminata trabada)');
      const CASOS = [['ramon-tranquera', 'tal-cual'], ['majada-fermin', 'tal-cual'], ['ese-no-josefina', 'tal-cual'], ['mulas-belisario', 'tal-cual'],
        ['ramon-tranquera', 'lejos'], ['mulas-belisario', 'lejos'], ['ramon-tranquera', 'a-la-vista'], ['mulas-belisario', 'a-la-vista'],
        ['ramon-tranquera', 'trabado'], ['ese-no-josefina', 'trabado'], ['majada-fermin', 'trabado']];
      const resumen = [];
      for (const [id, modo] of CASOS) {
        await N(`N.preparar(${JSON.stringify(id)}, 'trato')`);
        await N(`N.gancho(${JSON.stringify(modo)})`);
        const r = await N(`N.disparar(${JSON.stringify(id)})`);
        if (!arranco(r)) { await N('N.sinGancho()'); ok(false, `${id} (${modo}): no arrancó (${r})`); continue; }
        await N('(() => { if (H.__escenas.llegadas) H.__escenas.llegadas(true); return 1 })()');
        await N('N.empezarObs()');
        let q = { fin: false };
        for (let k = 0; k < 8 && !q.fin; k++) q = await N('N.correr(600, {})');
        await N('N.sinGancho()');
        await N('N.terminarObs()');
        const ob = await N('({ f: N.obs.f, saltos: N.obs.saltos, parpadeos: N.obs.parpadeos, cortes: N.obs.cortes, gancho: N.ganchoInfo, llegadas: H.__escenas.llegadas ? H.__escenas.llegadas() : null })');
        const vistos = ob.saltos.filter((s) => s.aLaVista);
        resumen.push({ id, modo, ...ob });
        console.log(`  ${id} (${modo}): ${ob.f} cuadros, ${ob.saltos.length} saltos (${ob.saltos.map((s) => `${s.k} ${s.d} m${s.corte ? ' en un corte' : ''}${s.velo >= 0.9 ? ' en negro' : ''}${s.guion ? ' (aparecer del guion)' : ''}${s.aLaVista ? ' A LA VISTA' : ''}`).join(', ') || '—'}), ${ob.parpadeos} parpadeos, ${ob.cortes} cortes; gancho ${JSON.stringify(ob.gancho)}${q.fin ? '' : ' (NO TERMINÓ)'}`);
        if (ob.llegadas && ob.llegadas.length) console.log(`    llegadas que decidió el juego: ${ob.llegadas.map((l) => `${l.quien} ${l.como} a los ${l.t} s`).join(' · ')}`);
        ok(!vistos.length, `${id} (${modo}): nadie salta a la vista de la cámara`);
        ok(ob.saltos.every((x) => !(x.par >= 0.9) || x.velo >= 0.9), `${id} (${modo}): el velo de la pantalla sigue al parpadeo (si el juego dice que tapó, la pantalla está en negro)`);
        await N('N.cerrar()');
      }
      fs.writeFileSync(path.join(salida, (BASE ? 'base-' : '') + 'llegadas.json'), JSON.stringify(resumen, null, 1));
    }

    // ================================================================ la silueta del anochecer (capítulos 2 a 4)
    if (va('silueta')) {
      donde = 'silueta';
      console.log('— la silueta del anochecer');
      const res = await N(`(() => {
        const L = T.lugares, out = { sitios: [], total: 0, bien: 0, porRumbo: {}, arboles: [], peorRumbo: 1 };
        const sitios = ['refugio', 'estacion', 'galpon', 'molino', 'puente', 'lago'].filter((k) => L[k] && Number.isFinite(L[k].x)).slice(0, 4);
        out.sitios = sitios;
        const pres = H.__presencia();
        if (!pres) return { error: 'sin presencia' };
        const arb = H.veg.arboles;
        for (const cap of [1, 2, 3]) {
          N.prep(cap, 18.7);
          for (const k of sitios) {
            const s = L[k];
            for (let r = 0; r < 8; r++) {
              const yaw = r * Math.PI / 4;
              H.jugador.ubicar(s.x + 7, s.z + 7, yaw);
              let bien = 0;
              for (let i = 0; i < 3; i++) {
                const si = pres.forzarSilueta();
                out.total++;
                const sil = pres.silueta();
                if (si && sil && sil.posicion) {
                  bien++; out.bien++;
                  const p = sil.posicion; let cerca = 0;
                  for (const a of arb) if (!a.sacado && Math.hypot(a.x - p.x, a.z - p.z) < 6) cerca++;
                  out.arboles.push(cerca);
                }
              }
              const clave = k + '-' + r;
              out.porRumbo[clave] = (out.porRumbo[clave] || 0) + bien;
            }
          }
        }
        const sil = pres.silueta(); if (sil && sil.quitar) { try { sil.quitar(); } catch (e) {} }
        let peor = 9; for (const v of Object.values(out.porRumbo)) peor = Math.min(peor, v / 9); out.peorRumbo = peor;
        out.sinLugar = Object.entries(out.porRumbo).filter(([, v]) => v === 0).map(([k]) => k);
        return out;
      })()`);
      if (res.error) ok(false, 'silueta: ' + res.error);
      else {
        const p = res.bien / res.total;
        const arb = res.arboles.slice().sort((a, b) => a - b);
        const med = arb.length ? arb[Math.floor(arb.length / 2)] : 0, max = arb.length ? arb[arb.length - 1] : 0;
        console.log(`  sitios ${res.sitios.join(', ')}: ${res.bien} de ${res.total} intentos encuentran lugar (${(p * 100).toFixed(0)} %); el peor rumbo ${(res.peorRumbo * 100).toFixed(0)} %; rumbos sin lugar en ningún intento: ${res.sinLugar.length} (${res.sinLugar.join(', ') || '—'})`);
        console.log(`  árboles a menos de 6 m de la silueta: mediana ${med}, máximo ${max}`);
        fs.writeFileSync(path.join(salida, (BASE ? 'base-' : '') + 'silueta.json'), JSON.stringify(res, null, 1));
        // por qué no hay lugar en los rumbos que fallan: una grilla de 14 a 30 m en el abanico de ±0,9 rad, con las mismas reglas que main.js (tierra, árbol a 2,4 o 4,5 m,
        // tronco a menos de 1,1 m, troncos en la línea)
        if (res.sinLugar.length) {
          const diag = await N(`(() => {
            const pv = new H.THREE.Vector3(), alt = (x, z) => T.altura(x, z);
            const mueve = (x, z, r) => { pv.set(x, alt(x, z), z); try { H.col.resolver(pv, r, 1.0); } catch (e) { return true; } return Math.hypot(pv.x - x, pv.z - z) > 0.05; };
            const out = {};
            for (const clave of ${JSON.stringify(res.sinLugar)}) {
              const [k, rr] = clave.split('-'), s = T.lugares[k], j = { x: s.x + 7, z: s.z + 7 }, rumbo = Number(rr) * Math.PI / 4 + Math.PI;
              const c = { agua: 0, campo: 0, sinArbolPegado: 0, troncoPegado: 0, lineaTapada: 0, bien: 0, total: 0 };
              for (let d = 14; d <= 30; d += 2) for (let a = -0.9; a <= 0.901; a += 0.15) {
                const x = j.x + Math.sin(rumbo + a) * d, z = j.z + Math.cos(rumbo + a) * d;
                c.total++;
                if (alt(x, z) < 0.45) { c.agua++; continue; }
                if (!mueve(x, z, 4.5)) { c.campo++; continue; }
                if (!mueve(x, z, 2.4)) c.sinArbolPegado++;
                if (mueve(x, z, 1.1)) { c.troncoPegado++; continue; }
                const dx = x - j.x, dz = z - j.z, n = Math.max(2, Math.ceil(Math.hypot(dx, dz) / 2)); let tapada = false;
                for (let q = 1; q < n; q++) if (mueve(j.x + dx * q / n, j.z + dz * q / n, 0.5)) { tapada = true; break; }
                if (tapada) { c.lineaTapada++; continue; }
                c.bien++;
              }
              out[clave] = c;
            }
            return out;
          })()`);
          for (const [k, c] of Object.entries(diag)) console.log(`    ${k}: de ${c.total} puntos, agua ${c.agua}, campo abierto (sin árbol a 4,5 m) ${c.campo}, tronco pegado ${c.troncoPegado}, troncos en la línea ${c.lineaTapada}, servirían ${c.bien} (sin árbol a 2,4 m: ${c.sinArbolPegado})`);
        }
        if (!BASE) {
          ok(p >= 0.85, `la silueta encuentra lugar en casi todos los intentos (${(p * 100).toFixed(0)} %)`);
          ok(res.sinLugar.length <= 4, `los rumbos sin lugar (monte cerrado: ahí la silueta deja de insistir hasta que girás la vista) son pocos: ${res.sinLugar.length} de 32`);
        }
        // tres capturas: la silueta, de verdad, al anochecer
        await N('N.sinUi(true)');
        for (const [k, r] of [[res.sitios[0], 2], [res.sitios[1] || res.sitios[0], 5], [res.sitios[2] || res.sitios[0], 7]]) {
          const q = await N(`(() => { N.prep(2, 18.9); const s = T.lugares[${JSON.stringify(k)}]; H.jugador.ubicar(s.x + 7, s.z + 7, ${r} * Math.PI / 4); const pres = H.__presencia(); let si = false; for (let i = 0; i < 6 && !si; i++) si = pres.forzarSilueta(); N.cuadros(40); const sil = pres.silueta(); const p = sil && sil.posicion; const j = H.jugador.estado.pos; return si && p ? { d: Math.hypot(p.x - j.x, p.z - j.z), pant: N.proyectar(p.x, p.y + 1, p.z) } : null })()`);
          if (q) { console.log(`  silueta desde ${k}, rumbo ${r}: a ${q.d.toFixed(1)} m, en pantalla (${Math.round(q.pant.x)}, ${Math.round(q.pant.y)})`); guardar(await captura(), `silueta-${k}-${r}`); }
        }
        await N('(() => { const sil = H.__presencia().silueta(); if (sil && sil.quitar) sil.quitar(); return 1 })()');
        await N('N.sinUi(false)');
      }
    }

    // ================================================================ el tocón del coihue grande en la pausa
    if (va('tocon')) {
      donde = 'tocon';
      console.log('— el tocón del coihue en el resumen del bosque');
      const r = await N(`(() => {
        N.cerrar(); N.prep(5, 12);
        const h = P.historia; h.decisiones.coihue = 'b'; h.temas = h.temas || {}; h.temas['mundo:coihue-talado'] = P.dia;
        P.talados = []; H.revisarRebrote(true);
        const iC = H.veg.arboles.findIndex((a) => a.grande === true);
        const conCoihue = H.talados().some((t) => t.i === iC);
        H.abrir('pausa'); const solo = document.getElementById('resumen-pausa').textContent; H.volverAlJuego(); N.cuadros(4);
        const otro = H.veg.arboles.findIndex((a, i) => i !== iC && !a.grande && a.especie !== 'pehuen');
        H.talados().push({ i: otro, dia: P.dia, esc: -1 });
        H.abrir('pausa'); const dos = document.getElementById('resumen-pausa').textContent;
        return { iC, conCoihue, solo, dos, n: H.talados().length };
      })()`);
      console.log(`  coihue ${r.iC} entre los talados: ${r.conCoihue} (${r.n} talados)`);
      console.log(`  pausa sólo con el tocón del coihue: «${r.solo}»`);
      console.log(`  pausa con el coihue y otro árbol talado: «${r.dos}»`);
      guardar(await captura(), 'tocon-pausa');
      if (!BASE) {
        ok(r.conCoihue && !/toc[oó]n/.test(r.solo), 'con el coihue talado (no rebrota) la pausa no cuenta ningún tocón rebrotando');
        ok(/1 tocón rebrotando/.test(r.dos), 'con otro árbol talado, cuenta uno');
      }
      await N('(() => { H.volverAlJuego(); N.cuadros(6); P.talados = []; return 1 })()');
    }

    // ================================================================ Ramón con el mate en las poses de trabajo
    if (va('ramon')) {
      donde = 'ramon';
      console.log('— Ramón con el mate: palear, hachar, tocar');
      await N('(() => { N.cerrar(); N.prep(3, 11); N.despejado(); const r = T.lugares.refugio; H.jugador.ubicar(r.x + 10, r.z + 10, 0); N.cuadros(20); return 1 })()');
      const A = await N('(() => { const p = H.jugador.estado.pos; return { x: p.x + 1.5, z: p.z - 4 } })()');
      await N('N.sinUi(true)');
      for (const pose of ['palear', 'hachar', 'tocar']) {
        for (const [lado, cam] of [['perfil-izq', { x: A.x, z: A.z + 2.4 }], ['perfil-der', { x: A.x, z: A.z - 2.4 }], ['frente', { x: A.x + 2.6, z: A.z + 0.6 }]]) {
          const escena = { id: `prueba-ramon-${pose}-${lado}`, repetible: true, personajes: {}, pasos: [
            { tipo: 'gesto', quien: 'ramon', accion: 'aparecer', a: { x: A.x, z: A.z }, mira: { x: A.x + 5, z: A.z } },
            { tipo: 'plano', plano: 'libre', pos: { x: cam.x, z: cam.z, dy: 1.3 }, mira: { ref: 'ramon', dy: 1.05 }, fov: 45, mezcla: 0, dur: 30, sinEsperar: true },
            { tipo: 'gesto', quien: 'ramon', accion: 'posar', pose, dur: 6 },
            { tipo: 'espera', dur: 9 } ] };
          const r = await N(`(() => { const x = H.__escenas.registrar(${JSON.stringify(escena)}); if (!x.ok) return 'mal: ' + x.errores.join('; '); return N.disparar(${JSON.stringify(escena.id)}) })()`);
          if (!arranco(r)) { ok(false, `Ramón ${pose} ${lado}: no arrancó (${r})`); continue; }
          const q = await N(`(() => { N.cuadros(50); const n = N.actor('ramon'); return { pose: n && n.pose, mate: n && n.mate ? n.mate.visible : 'sin mate' } })()`);
          guardar(await captura(), `ramon-${pose}-${lado}`);
          const q2 = await N(`(() => { N.cuadros(110); const n = N.actor('ramon'); return { pose: n && n.pose, mate: n && n.mate ? n.mate.visible : 'sin mate' } })()`);
          console.log(`  ${pose} ${lado}: en la pose ${JSON.stringify(q)} · después ${JSON.stringify(q2)}`);
          if (lado === 'frente') ok(q.pose === pose && q.mate === false && q2.mate === true, `Ramón ${pose}: el mate se guarda durante la pose y vuelve a la mano después`);
          await N('N.cerrar()');
        }
      }
      await N('N.sinUi(false)');
    }

    // ================================================================ las paces con Fermín, con una y con dos cosas
    if (va('paces')) {
      donde = 'paces';
      console.log('— las paces con Fermín (capítulo 11)');
      for (const caso of [{ n: 1, cosas: { yerba: 1, harina: 0 } }, { n: 2, cosas: { yerba: 1, harina: 1 } }]) {
        await N(`(() => { N.cerrar(); N.tarjetas(); N.perfil('trato', 10); P.horas = 11; N.despejado(); const h = P.historia; delete h.escenas.vistas['fermin-paces']; P.cosas = P.cosas || {}; P.cosas.harina = ${caso.cosas.harina}; P.cosas.yerba = ${caso.cosas.yerba}; P.cosas['pan-casero'] = 0; const g = T.lugares.galpon; const n = N.actor('fermin'); const f = n ? n.pos : g; if (f) { const x = f.x + 2.6, z = f.z + 1.2; H.jugador.ubicar(x, z, Math.atan2(f.x - x, f.z - z) - Math.PI); } N.cuadros(8); return 1 })()`);
        const r = await N('N.disparar("fermin-paces")');
        if (!arranco(r)) { ok(false, `las paces (${caso.n}): no arrancó (${r})`); continue; }
        await N('N.empezarObs()');
        const q = await N('N.correr(1500, { pararEnEleccion: true })');
        const botones = await N('[...document.querySelectorAll("[id^=escena] .opciones button")].filter((b) => b.offsetParent !== null).map((b) => b.textContent.trim())');
        guardar(await captura(), `paces-${caso.n}`);
        console.log(`  con ${caso.n === 1 ? 'yerba sola' : 'yerba y harina'}: la elección ofrece ${JSON.stringify(q.eleccion)}; botones a la vista ${JSON.stringify(botones)}`);
        ok(Array.isArray(q.eleccion) && q.eleccion.length === caso.n && botones.length === caso.n, `las paces con ${caso.n} ${caso.n === 1 ? 'cosa' : 'cosas'}: se ${caso.n === 1 ? 'ofrece una opción' : 'ofrecen dos opciones'}`);
        const antes = await N('({ yerba: P.cosas.yerba, harina: P.cosas.harina })');
        const fin = await N('(() => { let q = { fin: false }; for (let k = 0; k < 6 && !q.fin; k++) q = N.correr(600, { elegir: 0 }); return q })()');
        const despues = await N('({ yerba: P.cosas.yerba, harina: P.cosas.harina, vista: !!P.historia.escenas.vistas["fermin-paces"] })');
        console.log(`  elegida la primera: antes ${JSON.stringify(antes)} → después ${JSON.stringify(despues)}${fin.fin ? '' : ' (NO TERMINÓ)'}`);
        ok(despues.vista && (antes.yerba - despues.yerba) + (antes.harina - despues.harina) === 1, `las paces con ${caso.n}: se cobra una sola cosa (la elegida) y la escena queda vista`);
        await N('N.cerrar()');
      }
    }

    // ================================================================ la H junto al coihue grande antes del capítulo 5
    if (va('coihue')) {
      donde = 'coihue';
      console.log('— el coihue grande con la H antes del capítulo 5');
      const r0 = await N(`(() => {
        N.cerrar(); N.prep(2, 11); N.despejado();
        const h = P.historia; delete h.decisiones.coihue; if (h.temas) delete h.temas['mundo:coihue-talado'];
        P.cosas = P.cosas || {}; P.cosas.hacha = Math.max(1, P.cosas.hacha || 0);
        P.entradas = P.entradas || {}; if (!P.entradas.coihue) P.entradas.coihue = { dia: P.dia, hora: P.horas, cantidad: 0 };
        const arb = H.veg.arboles, a = arb.find((x) => x.grande === true);
        if (!a) return { error: 'no hay coihue grande' };
        if (a.sacado) { const iC = arb.indexOf(a); H.veg.crecer(a, 1); P.talados = (P.talados || []).filter((q) => q.i !== iC); }   // (la sección de la cámara lo taló para coihue-talado)
        let lugar = null;
        for (let k = 0; k < 36 && !lugar; k++) {
          const an = k * Math.PI / 18, d = (a.r || 0.5) + 0.6, x = a.x + Math.sin(an) * d, z = a.z + Math.cos(an) * d;
          if (T.altura(x, z) < 0.45) continue;
          if (arb.some((b) => b !== a && !b.sacado && Math.hypot(b.x - x, b.z - z) - (b.r || 0.4) < 1.4)) continue;
          lugar = { x, z };
        }
        if (!lugar) return { error: 'sin lugar junto al coihue' };
        H.jugador.ubicar(lugar.x, lugar.z, Math.atan2(a.x - lugar.x, a.z - lugar.z) - Math.PI); N.cuadros(30);
        return { ok: 1 };
      })()`);
      await esperar(400);
      const aviso = r0.error ? [] : await N('[...document.querySelectorAll("body *")].filter((e) => e.offsetParent !== null && /coihue grande/i.test(e.textContent) && ![...e.children].some((c) => /coihue grande/i.test(c.textContent))).map((e) => e.textContent.trim()).slice(0, 3)');
      if (!r0.error) guardar(await captura(), 'coihue-h-aviso');
      const r = r0.error ? r0 : await N('(() => { const a = H.veg.arboles.find((x) => x.grande === true); const t0 = H.talados().length; H.usarHacha(); N.cuadros(4); return { talados0: t0, talados1: H.talados().length, sacado: !!a.sacado } })()');
      await esperar(500);
      if (!r.error) { r.aviso = aviso; r.notas = await N('[...document.querySelectorAll("#notas .nota")].map((n) => (n.__titulo || "") + " · " + (n.__sub || ""))'); }
      if (r.error) ok(false, 'coihue: ' + r.error);
      else {
        console.log(`  aviso: ${JSON.stringify(r.aviso)} · tras la H: ${JSON.stringify(r.notas)} · talados ${r.talados0} → ${r.talados1}`);
        guardar(await captura(), 'coihue-h');
        ok(r.aviso.some((t) => /todavía no/.test(t)), 'el aviso de la H junto al coihue dice «El coihue grande, todavía no»');
        ok(r.notas.some((t) => /puertitas/.test(t)) && r.talados1 === r.talados0 && !r.sacado, 'la H no lo tala y la nota explica por qué');
      }
    }

    // ================================================================ la noche de la nevada: ganar, cerrar en la escena del final y volver a abrir
    if (va('nevada')) {
      donde = 'nevada';
      console.log('— la noche de la nevada: cerrar el juego en la escena del final');
      await N(`(() => { N.cerrar(); N.tarjetas(); N.perfil('trato', 11); P.horas = 21.9; const h = P.historia; h.escenas.vistas['noche-espera'] = P.dia; h.duendes = h.duendes || {}; h.duendes.noche = 'pendiente'; delete h.escenas.vistas['noche-tras-ganar']; return 1 })()`);
      const dia0 = await N('P.dia');
      const emp = await N('(() => { try { H.__noche() && H.__noche().preparar && H.__noche().preparar(); } catch (e) {} return H.__valle.noche.empezar() })()');
      await N('N.cuadros(40)');
      await N('(() => { H.__noche().terminar({ gano: true, motivo: "todos" }); return 1 })()');
      await N('N.cuadros(60)');
      const enEscena = await N('({ activa: H.__escenas.activa(), id: H.__escenas.director.idActual(), amanecer: !!(P.historia.noche && P.historia.noche.amanecer), horas: P.horas, dia: P.dia })');
      console.log(`  empezó la noche: ${emp}; tras ganar: ${JSON.stringify(enEscena)}`);
      guardar(await captura(), 'nevada-escena-final');
      ok(enEscena.activa && enEscena.amanecer, 'al ganar sale la escena del final con el amanecer anotado');
      // cerrar el juego en plena escena y volver a abrir
      await reabrir();
      await N(`(() => { const d = H.__escenas.director; for (let i = 0; i < 6 && d.activa(); i++) { d.saltar(); N.cuadros(10); } for (let i = 0; i < 400 && P.dia === ${dia0}; i++) N.cuadros(1); return 1 })()`);
      const v = await N('(() => { const g = H.__puntosHistoria()["galpon-noche"]; const p = H.jugador.estado.pos; return { dia: P.dia, horas: P.horas, dGalpon: g ? Math.hypot(p.x - g.x, p.z - g.z) : null, amanecer: !!(P.historia.noche && P.historia.noche.amanecer), estado: P.historia.noche && P.historia.noche.estado, noche: P.historia.duendes && P.historia.duendes.noche } })()');
      console.log(`  al volver a abrir: ${JSON.stringify(v)} (día de la noche: ${dia0})`);
      guardar(await captura(), 'nevada-al-volver');
      ok(v.dia === dia0 + 1 && v.horas >= 6.3 && v.horas < 8 && v.dGalpon !== null && v.dGalpon < 7 && !v.amanecer && v.noche === 'ganada', 'al volver a abrir amanece: otro día, a la mañana (amanece a las 6:24; el juego corre unos segundos al cargar), al lado del galpón, la noche ganada');
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
