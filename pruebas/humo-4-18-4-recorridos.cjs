// 4.18.4 (C): la Historia jugada de punta a punta, encadenada, por tres recorridos (Electron + WebGL real). Sin saltar de un capítulo al otro: cada capítulo termina por sus
// objetivos, se cierra con su tarjeta y arranca el siguiente, como en una partida de verdad. Las escenas se leen enteras con Enter (no se saltean), las decisiones se toman con
// lo que dice el recorrido, la noche de la nevada se juega en la simulación real (perder, «Otra vez» o «Que amanezca», ganar) y al final se guarda y se vuelve a cargar con la historia terminada.
// Lo que NO es jugado de verdad (queda dicho en el informe): las escenas se disparan en su lugar con COLOCACION_ESCENA en vez de esperar al disparador natural, y los objetivos de
// mundo que no son escena (cosechar seis veces, moler diez medidas, talar, construir, ir en kayak de noche, esperar sentado…) se dan por hechos con la misma marca que deja el juego
// (hechos[capítulo:objetivo]); cada uno que se fuerza se imprime con «forzado». Esos objetivos los cubren las partidas por capítulo de 4.15 a 4.18.
// En cada cuadro de escena mira la cámara (NaN, bajo el suelo, metida en un sólido), el texto que se muestra (vacío, «undefined», «NaN») y los errores del director; en cada
// capítulo, programas de shader y memoria de three; al final, errores de la consola.
// Uso: powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-18-4-recorridos.cjs -Espera 2700 -Perfil <carpeta propia> -Visible
//   REC_RUTA=trato|pelea|dura (por defecto las tres, una detrás de la otra) · REC_SALIDA=<archivo json>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const { DETERMINISTA } = require('./ayuda-determinista.cjs');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 75 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 75 * 60 * 1000).unref?.();
const RUTAS_PEDIDAS = (process.env.REC_RUTA || 'trato,pelea,dura').split(',').filter(Boolean);
const SALIDA = process.env.REC_SALIDA || path.join(process.env.TEMP || raiz, 'recorridos-4-18-4.json');

// los recorridos: qué se decide en cada una de las seis decisiones, qué se hace en la noche (perder:otra = perder y «Otra vez»; perder:amanezca = perder y «Que amanezca»; ganar)
// y qué hay en la aldea (Rosa sólo vive si está su casa: la opción B de la bolsa la pide)
const RUTAS = {
  trato: { dec: { bolsa: 'a', coihue: 'a', molienda: 'c', cuaderno: 'a', majada: 'a', duendes: 'a' }, noche: ['ganar'], pobladores: [], perdida: 'otra' },
  pelea: { dec: { bolsa: 'c', coihue: 'b', molienda: 'a', cuaderno: 'b', majada: 'c', duendes: 'c' }, noche: ['perder', 'ganar'], pobladores: [], perdida: 'amanezca' },
  // «el que más cuesta»: la bolsa a Rosa (deuda con los duendes), la pirca de Tobías, la harina partida, contarlo a Josefina en la universidad, cuidar la majada vos, la bolsa en el umbral; y la noche: perder, «Otra vez», perder, «Que amanezca»…
  dura: { dec: { bolsa: 'b', coihue: 'c', molienda: 'c', cuaderno: 'c', majada: 'b', duendes: 'b' }, noche: ['perder', 'perder', 'ganar'], pobladores: ['panadera', 'carpintero', 'tejedora', 'herrero'], perdida: 'otra' },
};

// la tabla de capítulos y objetivos, leída del propio historia.js (ids de escena y de decisión de cada objetivo)
function tablaDeCapitulos() {
  const t = fs.readFileSync(path.join(raiz, 'src', 'historia.js'), 'utf8').split('\n');
  const ini = t.findIndex((l) => l.startsWith('export const CAPITULOS = ['));
  const fin = t.findIndex((l, i) => i > ini && l.startsWith('];'));
  const caps = []; let cur = null;
  for (let i = ini; i < fin; i++) {
    const l = t[i];
    let m = /^    id: '(\w+)', titulo: '([^']*)'/.exec(l);
    if (m) { cur = { id: m[1], titulo: m[2], objs: [], dec: [] }; caps.push(cur); continue; }
    if (!cur) continue;
    m = /^\s*\{ id: '([^']+)', tecla:/.exec(l);
    if (m) {
      const o = { id: m[1] };
      const e = /hecho: escena\('([^']+)'\)/.exec(l) || /escenas\.has\('([^']+)'\)/.exec(l); if (e) o.escena = e[1];
      const d = /hecho: decision\('(\w+)'\)/.exec(l); if (d) o.decision = d[1];
      if (/delMomento/.test(l)) o.momento = true;
      cur.objs.push(o); continue;
    }
    m = /decisiones: \[(.*)\]/.exec(l);
    if (m) for (const x of m[1].matchAll(/\{ id: '(\w+)', tras: '([^']+)'/g)) cur.dec.push({ id: x[1], tras: x[2] });
  }
  return caps;
}

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, P = H.progreso;
  const R = window.__R = { vistas: [], forzados: [], malas: [], tarjetas: [] };
  const dir = () => H.__escenas.director;
  const frames = (n) => window.__cuadros(n, 50);
  const dormir = () => new Promise((r) => setTimeout(r, 0));
  const MAL_TEXTO = /undefined|NaN|\[object|\bnull\b|\{\{|\}\}/;
  const tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); };
  R.tarjeta = () => {
    const v = document.getElementById('valle-tarjeta');
    if (!v || v.classList.contains('oculto')) return null;
    return { titulo: (v.querySelector('h2') || {}).textContent || '', arriba: (v.querySelector('.arriba') || {}).textContent || '', texto: [...v.querySelectorAll('p')].map((p) => p.textContent).join(' | '), lista: [...v.querySelectorAll('li')].map((l) => l.textContent), opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => ({ id: b.dataset.valleOpcion, texto: b.textContent, deshabilitada: b.disabled })) };
  };
  R.panel = () => { const p = document.getElementById('historia-hud'); return p && !p.classList.contains('oculto') ? { filas: p.querySelectorAll('p').length, hechos: p.querySelectorAll('p.hecho').length, texto: p.textContent.slice(0, 200) } : null; };
  R.malasPartida = () => {
    const mal = [], js = H.jugador.estado, p = js.pos;
    if (![p.x, p.y, p.z, js.yaw, js.pitch].every(Number.isFinite)) mal.push('jugador no finito');
    else if (!js.enTren && !js.nadando && !js.enKayak && !js.enVela && p.y < T.altura(p.x, p.z) - 1.5) mal.push('jugador bajo el suelo ' + (p.y - T.altura(p.x, p.z)).toFixed(2));
    if (!Number.isFinite(P.horas) || !Number.isFinite(P.dia)) mal.push('hora o día no finitos');
    for (const [k, n] of Object.entries(P.materiales || {})) if (!Number.isFinite(n) || n < 0) mal.push('material ' + k + ' = ' + n);
    for (const [k, n] of Object.entries(P.cosas || {})) if (typeof n === 'number' && (!Number.isFinite(n) || n < 0)) mal.push('cosa ' + k + ' = ' + n);
    if (!Number.isFinite(P.ramitas) || P.ramitas < 0) mal.push('ramitas = ' + P.ramitas);
    const pe = P.economia && P.economia.pesos; if (pe !== undefined && (!Number.isFinite(pe) || pe < 0)) mal.push('pesos = ' + pe);
    for (const [k, n] of Object.entries(P.historia.lazos || {})) if (!Number.isFinite(n) || n < -2 || n > 3) mal.push('lazo ' + k + ' = ' + n);
    return mal;
  };
  R.estado = () => {
    const h = P.historia;
    return { cap: h.capitulo, fase: h.fase, dia: P.dia, horas: +P.horas.toFixed(1), escena: H.__escenas.activa() ? dir().idActual() : null, tarjeta: (R.tarjeta() || {}).titulo || null,
      hechos: Object.keys(h.hechos).length, noche: h.duendes && h.duendes.noche, nocheActiva: !!(H.__noche() && H.__noche().activa()), programas: H.renderer.info.programs.length,
      geo: H.renderer.info.memory.geometries, tex: H.renderer.info.memory.textures };
  };
  // se lee la escena que esté corriendo hasta el final: Enter en cada línea y la opción del recorrido en cada pregunta
  R.leerEscena = async (ruta, maxF = 5200) => {
    const d = dir(), id = d.idActual(), reg = { id, dur: 0, elec: [], malas: [], textos: 0 };
    let solido = 0; const bola = { x: 0, y: 0, z: 0 };
    let f = 0;
    for (; f < maxF && d.activa(); f++) {
      frames(1);
      let dat = d.datos();
      if (!dat || !d.activa()) {
        // ¿otra escena que el juego dispara sola al terminar ésta (una cadena)? se la lee también
        frames(12);
        if (d.activa() && d.idActual() !== id) { reg.encadenadas = (reg.encadenadas || []).concat(d.idActual()); dat = d.datos(); if (!dat) continue; } else break;
      }
      if (f % 4 === 0) {
        const c = H.camara.position;
        if (![c.x, c.y, c.z].every(Number.isFinite)) { reg.malas.push('cámara no finita'); break; }
        const suelo = T.altura(c.x, c.z), fase = d.fase();
        if (c.y < suelo - 0.02 && !reg.bajoSuelo) { reg.bajoSuelo = true; reg.malas.push('cámara bajo el suelo en el cuadro ' + f + ' (' + (c.y - suelo).toFixed(2) + ' m) en la fase «' + fase + '»'); }
        bola.x = c.x; bola.y = c.y - 0.45; bola.z = c.z; const x0 = bola.x, z0 = bola.z;
        try { H.col.resolver(bola, 0.22, 0.7); } catch (e) { /* sin colisión */ }
        if (Math.hypot(bola.x - x0, bola.z - z0) > 0.06) { solido++; if (solido === 8) reg.malas.push('aviso: cámara metida en un sólido en el cuadro ' + f + ' (' + c.x.toFixed(1) + ',' + c.z.toFixed(1) + ')'); } else solido = 0;
      }
      if (dat.eleccion) {
        if (d.eleccionLista()) {
          const ops = dat.eleccion.opciones; let quiero = dat.eleccion.id === 'perdida-resp' ? ruta.perdida : ruta.dec[dat.eleccion.id];
          if (/^duendes/.test(dat.eleccion.id)) quiero = { a: 'trato', b: 'fuerte', c: 'pelea' }[ruta.dec.duendes];   // (en las escenas de la D6 las opciones se llaman trato, fuerte y pelea)
          let k = ops.findIndex((o) => o.id === quiero); if (k < 0) k = 0;
          reg.elec.push(dat.eleccion.id + ':' + ops[k].id + (ops[k].id !== quiero && quiero ? ' (no estaba ' + quiero + ')' : ''));
          if (MAL_TEXTO.test(dat.eleccion.pregunta + ' ' + ops.map((o) => o.texto).join(' '))) reg.malas.push('texto raro en la pregunta ' + dat.eleccion.id);
          d.elegir(k);
        }
      } else if (dat.dialogo) {
        reg.textos++;
        if (dat.dialogo.completo && (!dat.dialogo.texto || MAL_TEXTO.test(dat.dialogo.texto))) reg.malas.push('texto raro/vacío: «' + String(dat.dialogo.texto).slice(0, 80) + '»');
        d.avanzar();
      }
      if (f % 15 === 0) for (const e of d.errores()) if (!reg.malas.includes('director: ' + e)) reg.malas.push('director: ' + e);
      if (f % 60 === 59) await dormir();
    }
    reg.dur = +(f * 0.05).toFixed(1);
    if (d.activa()) { reg.malas.push('NO CIERRA en ' + reg.dur + ' s'); d.saltar(); for (let i = 0; i < 8 && d.activa(); i++) frames(10); }
    frames(40);
    if (document.body.classList.contains('escena-en-curso') || document.body.classList.contains('escena-saliendo')) reg.malas.push('quedaron las barras de cine');
    if (H.__escenas.capturados().length) reg.malas.push('personajes sin soltar: ' + H.__escenas.capturados().join(','));
    const c = H.camara.position, j = H.jugador.estado.pos;
    if (Math.hypot(c.x - j.x, c.z - j.z) > 3) reg.malas.push('la cámara no volvió al jugador (' + Math.hypot(c.x - j.x, c.z - j.z).toFixed(1) + ' m)');
    for (const m of R.malasPartida()) reg.malas.push(m);
    R.vistas.push(reg);
    return reg;
  };
  R.disparar = (id) => {
    try { H.__colocarEscena(id); } catch (e) { /* sin colocación */ }
    frames(6);
    // (con la colocación puesta y unos cuadros, el disparador natural del juego puede arrancarla solo: entonces ya está corriendo)
    if (H.__escenas.activa()) return true;
    return H.__escenas.disparar(id, { forzar: false }) || H.__escenas.disparar(id, { forzar: true }) || H.__escenas.activa();
  };
  // las tarjetas: la opción que corresponde (empezar, seguir, la decisión del recorrido, o la primera)
  R.contestarTarjeta = (ruta) => {
    const t = R.tarjeta(); if (!t) return null;
    const reg = { titulo: t.titulo, arriba: t.arriba, ops: t.opciones.map((o) => o.id).join(','), mal: [] };
    if (!t.texto || MAL_TEXTO.test(t.titulo + ' ' + t.texto + ' ' + t.lista.join(' '))) reg.mal.push('texto raro/vacío en la tarjeta «' + t.titulo + '»: ' + t.texto.slice(0, 100));
    if (/continuará|se está escribiendo|todavía se está/i.test(t.texto)) reg.mal.push('tarjeta con «continuará»');
    R.tarjetas.push(reg);
    const ids = t.opciones.map((o) => o.id);
    let elegir = null;
    if (/decisi/i.test(t.arriba)) { const d = Object.keys(ruta.dec).find((k) => P.historia.decisiones[k] == null); const q = d ? ruta.dec[d] : null; elegir = ids.includes(q) ? q : ids[0]; reg.decision = d + ':' + elegir; }
    else if (ids.includes('empezar')) elegir = 'empezar'; else if (ids.includes('seguir')) elegir = 'seguir'; else elegir = ids[0];
    const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + elegir + '"]');
    if (b) b.click(); else reg.mal.push('la tarjeta no tiene botón ' + elegir);
    frames(12);
    return reg;
  };
  // objetivos que no son escena: se dan por hechos (con los efectos que el juego les pone cuando los tilda)
  R.forzar = (capId, objId) => {
    const h = P.historia, k = capId + ':' + objId;
    if (h.hechos[k] !== undefined) return false;
    h.hechos[k] = P.dia;
    if (capId === 'arco' && objId === 'blancos-paso') h.duendes.armas.arco = true;
    if (capId === 'arco' && objId === 'blancos-esquila') h.duendes.armas.honda = true;
    if (capId === 'arco' && objId === 'prestado') for (const q of ['herrero', 'apicultor', 'maquinista', 'guarda']) h.prestado[q] = true;
    if (capId === 'ramal' && objId === 'fletes') h.ramal = Math.max(h.ramal || 0, 6);
    if (capId === 'cosecha' && objId === 'moler') h.molido = Math.max(h.molido || 0, 10);
    R.forzados.push(k);
    return true;
  };
  // la noche de la nevada en la simulación real
  R.noche = async (accion, ruta) => {
    const n = H.__noche();
    if (!n || !n.activa()) return 'no activa';
    for (let i = 0; i < 120; i++) frames(1);   // seis segundos de noche
    const s = n.sim;
    if (accion === 'perder') { if (ruta === 'pelea') { s.jugador.vida = -5; s.jugador.sinGolpe = 0; } else s.travesuras = 6; for (const d of s.duendes) if (d.estado === 'avanza') { d.x = s.dis.centro.x + 0.5; d.z = s.dis.centro.z; d.wp = 2; } }
    else s.t = 268;
    for (let i = 0; i < 1500 && n.activa() && !H.__escenas.activa(); i++) { frames(1); if (i % 60 === 59) await dormir(); }
    return 'hecho';
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const consola = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  let donde = 'carga';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) consola.push({ en: donde, m: m.slice(0, 300) });
  });
  w.webContents.on('render-process-gone', (e, d) => { console.log('PROCESO DE LA PÁGINA CAÍDO en ' + donde + ':', JSON.stringify(d)); consola.push({ en: donde, m: 'render-process-gone ' + JSON.stringify(d) }); });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 150 s (${donde})`)), 150000))]);
  const R = (c) => js(`(async () => { const H = window.__hojarasca, R = window.__R, P = H.progreso; return (${c}); })()`);
  const url = path.join(raiz, 'index.html');
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false})); 1`;
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const entrar = async (nueva) => {
    if (nueva) { await w.loadFile(url, { search: '?debug=1' }); await js(ajustes); }
    await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js('window.__sinPausaPorBlur = true; 1');
    await js(DETERMINISTA(4184));
    await js(PAGINA);
    await js('window.__cuadros(80, 50)');
  };
  const TABLA = tablaDeCapitulos();
  const informe = { rutas: {}, consola };
  let hayProblemas = false;

  for (const nombreRuta of RUTAS_PEDIDAS) {
    const ruta = RUTAS[nombreRuta];
    if (!ruta) continue;
    console.log(`\n=== recorrido «${nombreRuta}» ===`);
    donde = 'ruta ' + nombreRuta;
    const log = { pasos: 0, capitulos: [], problemas: [], traba: null };
    informe.rutas[nombreRuta] = log;
    try {
      await entrar(true);
      await js(`window.__R.ruta = ${JSON.stringify(ruta)}; (() => { const P = window.__hojarasca.progreso; P.aldea = P.aldea || {}; P.aldea.pobladores = P.aldea.pobladores || []; for (const k of ${JSON.stringify(ruta.pobladores)}) if (!P.aldea.pobladores.some((x) => x && x.clave === k)) P.aldea.pobladores.push({ clave: k }); return 1 })()`);
      let sinCambio = 0, ultimo = '', capAnterior = -1;
      const tiempoCap = {};
      const pendientes = new Set();   // objetivos que ya se intentaron y no se tildaron
      for (let paso = 0; paso < 700; paso++) {
        donde = `${nombreRuta} paso ${paso}`;
        log.pasos = paso;
        const e0 = await R('R.estado()');
        if (e0.cap !== capAnterior) {
          capAnterior = e0.cap; pendientes.clear();
          const cap = TABLA[e0.cap];
          console.log(`— capítulo ${e0.cap + 1}: ${cap ? cap.titulo : '?'} · día ${e0.dia} · programas ${e0.programas} · geometrías ${e0.geo} · texturas ${e0.tex}`);
          log.capitulos.push({ cap: e0.cap + 1, dia: e0.dia, programas: e0.programas, geo: e0.geo, tex: e0.tex, paso });
        }
        if (e0.fase === 'fin') { console.log('  la historia terminó (fase fin)'); break; }
        const firma = JSON.stringify([e0.cap, e0.fase, e0.escena, e0.tarjeta, e0.hechos, e0.dia, e0.nocheActiva, e0.noche]);
        sinCambio = firma === ultimo ? sinCambio + 1 : 0; ultimo = firma;
        if (sinCambio > 14) { log.traba = { estado: e0, pendientes: [...pendientes] }; const panel = await R('R.panel()'); log.traba.panel = panel; console.log('  ✗ SE TRABÓ: ' + JSON.stringify(log.traba)); log.problemas.push('se trabó en el capítulo ' + (e0.cap + 1) + ' (' + JSON.stringify(e0) + ')'); break; }

        // 1. una tarjeta abierta
        const t = await R('R.tarjeta()');
        if (t) {
          const r = await R(`R.contestarTarjeta(window.__R.ruta)`);
          console.log(`  [tarjeta] ${r.titulo} · ${r.arriba}${r.decision ? ' → ' + r.decision : ''}${r.mal.length ? '  ✗ ' + r.mal.join(' | ') : ''}`);
          for (const m of r.mal) log.problemas.push(m);
          continue;
        }
        // 2. una escena en curso
        if (e0.escena) {
          const r = await R(`R.leerEscena(window.__R.ruta)`);
          console.log(`  [escena] ${r.id} ${r.dur} s${r.elec.length ? ' · ' + r.elec.join(' ') : ''}${r.malas.length ? '\n      ✗ ' + r.malas.join('\n      ✗ ') : ''}`);
          for (const m of r.malas) if (!/^aviso/.test(m)) log.problemas.push(`${r.id}: ${m}`); else log.avisos = (log.avisos || []).concat(`${r.id}: ${m}`);
          continue;
        }
        // 3. la noche
        if (e0.nocheActiva) {
          const queHago = ruta.noche.shift() || 'ganar';
          console.log(`  [noche] ${queHago}`);
          await R(`R.noche(${JSON.stringify(queHago)}, ${JSON.stringify(nombreRuta)})`);
          continue;
        }
        // 4. el capítulo en curso
        const cap = TABLA[e0.cap];
        if (e0.fase === 'intro') {
          // la tarjeta de entrada todavía no salió (puerta de estación o de días): pasa un día
          tiempoCap[e0.cap] = (tiempoCap[e0.cap] || 0) + 1;
          if (tiempoCap[e0.cap] > 3) { await R('(() => { P.dia += 1; P.horas = 9.5; return 1 })()'); console.log('  (pasa un día esperando la puerta del capítulo: día ' + (e0.dia + 1) + ')'); }
          await R('window.__cuadros(60, 50)');
          continue;
        }
        if (e0.fase === 'outro') { await R('window.__cuadros(60, 50)'); continue; }
        // jugando: el primer objetivo sin hacer
        const hechos = await R('Object.keys(P.historia.hechos)');
        const falta = cap.objs.filter((o) => !hechos.includes(cap.id + ':' + o.id));
        if (!falta.length) { await R('window.__cuadros(60, 50)'); continue; }
        // la hora de la noche
        if (cap.id === 'nevada') await R('(() => { if (P.horas < 21.5 && P.horas > 8) P.horas = 22.05; return 1 })()');
        const o = falta.find((x) => !pendientes.has(x.id)) || falta[0];
        pendientes.add(o.id);
        let hecho = '';
        if (o.decision) {
          const tras = (cap.dec.find((x) => x.id === o.decision) || {}).tras;
          const dispara = tras && (await R(`R.disparar(${JSON.stringify(tras)})`));
          hecho = dispara ? 'escena de decisión ' + tras : 'sin escena de decisión (' + tras + '): sale la tarjeta de respaldo o se fuerza';
          if (dispara) { await R('window.__cuadros(8, 50)'); continue; }
          await R('window.__cuadros(40, 50)');
          if (!(await R('!!R.tarjeta()'))) { await R(`R.forzar(${JSON.stringify(cap.id)}, ${JSON.stringify(o.id)})`); log.problemas.push(`decisión ${o.decision}: la escena ${tras} no disparó y no salió la tarjeta de respaldo`); }
        } else if (o.escena) {
          const dispara = await R(`R.disparar(${JSON.stringify(o.escena)})`);
          if (dispara) { await R('window.__cuadros(8, 50)'); continue; }
          hecho = 'la escena ' + o.escena + ' no se pudo disparar';
          console.log(`  ⚠ ${cap.id}:${o.id} → ${hecho}`);
          log.problemas.push(`${cap.id}:${o.id}: ${hecho}`);
          await R(`R.forzar(${JSON.stringify(cap.id)}, ${JSON.stringify(o.id)})`);
        } else {
          // el momento (un evento del valle): se le da un rato para que salga solo
          if (o.momento) { await R('window.__cuadros(100, 50)'); if (await R('!!R.tarjeta()')) continue; }
          const f = await R(`R.forzar(${JSON.stringify(cap.id)}, ${JSON.stringify(o.id)})`);
          if (f) console.log(`  forzado ${cap.id}:${o.id}`);
        }
        await R('window.__cuadros(20, 50)');
        // si la escena terminó y el objetivo con escena no se tildó, es un problema
      }
      // el estado final: lo que dejó el recorrido
      const fin = await R(`({ h: JSON.parse(JSON.stringify(P.historia)), tarjeta: R.tarjeta() })`);
      log.final = { fase: fin.h.fase, capitulo: fin.h.capitulo, terminada: fin.h.terminada, decisiones: fin.h.decisiones, trato: fin.h.duendes && fin.h.duendes.trato, final: fin.h.duendes && fin.h.duendes.final, noche: fin.h.duendes && fin.h.duendes.noche, lazos: fin.h.lazos, escenasVistas: Object.keys(fin.h.escenas.vistas).length };
      console.log('  final: ' + JSON.stringify(log.final));
      if (log.final.fase !== 'fin') log.problemas.push('la historia no llegó a fase fin (' + log.final.fase + ', capítulo ' + (log.final.capitulo + 1) + ')');
      // el final y guardar/cargar con la historia terminada
      for (let i = 0; i < 10 && (await R('!!R.tarjeta() || window.__hojarasca.__escenas.activa()')); i++) {
        if (await R('window.__hojarasca.__escenas.activa()')) { const r = await R('R.leerEscena(window.__R.ruta)'); console.log(`  [escena] ${r.id} ${r.dur} s${r.malas.length ? ' ✗ ' + r.malas.join(' | ') : ''}`); for (const m of r.malas) if (!/^aviso/.test(m)) log.problemas.push(`${r.id}: ${m}`); else log.avisos = (log.avisos || []).concat(`${r.id}: ${m}`); }
        else { const r = await R('R.contestarTarjeta(window.__R.ruta)'); console.log(`  [tarjeta] ${r.titulo} · ${r.arriba}${r.mal.length ? ' ✗ ' + r.mal.join(' | ') : ''}`); for (const m of r.mal) log.problemas.push(m); }
      }
      await R('window.__hojarasca.guardar()');
      const antes = await R('JSON.stringify({ c: P.historia.capitulo, f: P.historia.fase, d: P.historia.decisiones, t: P.historia.terminada, dia: P.dia })');
      donde = nombreRuta + ' recarga';
      await entrar(false);
      await R('window.__cuadros(60, 50)');
      const despues = await R('JSON.stringify({ c: P.historia.capitulo, f: P.historia.fase, d: P.historia.decisiones, t: P.historia.terminada, dia: P.dia })');
      console.log(`  guardar y recargar con la historia terminada: ${antes === despues ? '✓ igual' : '✗ distinto\n    antes   ' + antes + '\n    después ' + despues}`);
      if (antes !== despues) log.problemas.push('guardar y recargar cambió la historia terminada: ' + antes + ' → ' + despues);
      const mal = await R('R.malasPartida()');
      for (const m of mal) log.problemas.push('al final: ' + m);
      log.vistas = await R('R.vistas.map((v) => ({ id: v.id, dur: v.dur, malas: v.malas.length }))');
      log.tarjetas = await R('R.tarjetas.length');
      log.forzados = await R('R.forzados');
      console.log(`  escenas leídas: ${log.vistas.length} · tarjetas: ${log.tarjetas} · objetivos forzados: ${log.forzados.length} (${log.forzados.join(', ')})`);
    } catch (e) { console.log('ERROR:', e && e.stack || e); log.problemas.push('excepción: ' + (e && e.message)); }
    console.log(log.problemas.length ? `  ✗ ${log.problemas.length} problemas en «${nombreRuta}»` : `  ✓ «${nombreRuta}» sin problemas`);
    if (log.problemas.length) hayProblemas = true;
  }
  fs.writeFileSync(SALIDA, JSON.stringify(informe, null, 1));
  console.log(`\nerrores de consola: ${consola.length}`);
  for (const c of consola.slice(0, 20)) console.log('  consola [' + c.en + ']: ' + c.m);
  console.log(hayProblemas || consola.length ? 'CON PROBLEMAS (detalle en ' + SALIDA + ')' : 'Todo en orden');
  try { app.exit(hayProblemas || consola.length ? 1 : 0); } catch { process.exit(1); }
});
