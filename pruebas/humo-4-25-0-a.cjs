// Partida real 4.25.0 (A) (Electron + WebGL): la caza de bugs de lo nuevo (guardado, economía, mapa, trochita) en el juego de verdad.
//   1. guardado: guardar y volver a abrir en el tren, en medio de una escena, con fletes y plata, y con el premio de un capítulo (no se cobra dos veces);
//   2. economía: compras, ventas y fletes de verdad por el panel de la trochita, con días que pasan, y que las cuentas cierren;
//   3. mapa: con la Historia pausada, con una escena en curso, en el Desafío; el rumbo hacia un objetivo no queda pegado;
//   4. logros de la Historia: se otorgan una vez y sobreviven a recargar.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-25-0-a.ps1 [-Espera 2700]
//   HUMO_SECCIONES=guardado,economia,mapa,logros (cuáles; por defecto todas) · HUMO_CAPTURAS=0 sin capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-25-0-a'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 30 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 30 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';
const SEC = process.env.HUMO_SECCIONES ? new Set(process.env.HUMO_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca;
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
    return { opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => b.dataset.valleOpcion) };
  };
  N.elegir = (id) => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + id + '"]'); if (b) b.click(); return !!b; };
  N.despejar = async (maxSeg = 6, o = {}) => {
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (es && es.activa()) {
        const d = es.director.datos && es.director.datos();
        if (d && d.eleccion) { N.tecla('Digit1'); await N.tick(0.3); continue; }
        if (!o.esc) { N.tecla('Enter'); await N.tick(0.2); continue; }
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
  N.mapaAbierto = () => !document.getElementById('mapa').classList.contains('oculto');
  N.puntoEnPantalla = (x, z) => {
    const c = document.getElementById('lienzo-mapa'), r = c.getBoundingClientRect();
    const px = ((x + 512) / 1024) * c.width, py = ((z + 512) / 1024) * c.height;
    return { clientX: r.left + (px / c.width) * r.width, clientY: r.top + (py / c.height) * r.height, px, py, W: c.width };
  };
  N.clicEnMapa = (x, z) => {
    const q = N.puntoEnPantalla(x, z);
    document.getElementById('lienzo-mapa').dispatchEvent(new MouseEvent('click', { clientX: q.clientX, clientY: q.clientY, bubbles: true }));
    return 1;
  };
  N.rojosEn = (x, z) => {
    const c = document.getElementById('lienzo-mapa'), q = N.puntoEnPantalla(x, z);
    const d = c.getContext('2d').getImageData(Math.max(0, Math.round(q.px) - 24), Math.max(0, Math.round(q.py) - 36), 48, 48).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 184) < 24 && Math.abs(d[i + 1] - 67) < 24 && Math.abs(d[i + 2] - 47) < 24) n++;
    return n;
  };
  N.rumbo = () => { const b = document.querySelector('#brujula b.rumbo'); return b && b.style.display !== 'none' ? b.textContent : null; };
  // una foto de lo que importa de la partida, para comparar antes y después de guardar y volver a abrir
  N.foto = () => {
    const P = H.progreso;
    return JSON.parse(JSON.stringify({ dia: P.dia, pesos: P.economia && P.economia.pesos, ganado: P.economia && P.economia.ganado, gastado: P.economia && P.economia.gastado, libro: P.economia && P.economia.libro.length,
      comercio: P.comercio, materiales: P.materiales, cosas: P.cosas, hist: P.historia && { cap: P.historia.capitulo, fase: P.historia.fase, cerrados: P.historia.cerrados, vistas: Object.keys(P.historia.escenas.vistas).length, hechos: Object.keys(P.historia.hechos).length },
      chinches: P.chinches, pos: P.pos }));
  };
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
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram|falló "/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); console.log('  [consola] ' + m.slice(0, 260)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 120000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, T = H.T; return (${c}); })()`);
  const url = path.join(raiz, 'index.html');
  const ajustes = (tipo, extra = {}) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false, guiaPrimerDia:false}, ${JSON.stringify(extra)}))); 1`;
  const esperarJuego = async () => {
    await js('window.__sinPausaPorBlur = true; 1');
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const cargar = async () => { await w.loadFile(url, { search: '?debug=1' }); await esperarJuego(); };
  const foto = async (nombre) => {
    if (!CAPTURAS) return;
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(900 + intento * 600);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const IDS = ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha', 'cuaderno', 'frios', 'golpea', 'arco', 'nevada', 'deshielo'];
  const prep = (cap, o = {}) => N(`(() => {
    const h = P.historia, ids = ${JSON.stringify(IDS)};
    h.activa = true; h.empezada = 1; h.version = 2; h.capitulo = ${cap}; h.fase = '${o.fase || 'jugando'}'; h.base = { dia: P.dia, talados: 0, cocinadas: 0, cantos: 0 }; h.terminada = 0;
    h.hechos = {};
    ids.slice(0, ${cap}).forEach((k) => { h.cerrados[k] = P.dia - 1; });
    ${o.vistas ? `${JSON.stringify(o.vistas)}.forEach((e, i) => { h.escenas.vistas[e] = 1 + Math.floor(i / 3); h.aplicadas[e] = 1 + Math.floor(i / 3); });` : ''}
    ${o.hechos ? `${JSON.stringify(o.hechos)}.forEach((k) => { h.hechos['${IDS[o.cap ?? cap]}:' + k] = P.dia; });` : ''}
    Object.assign(h.decisiones, ${JSON.stringify(o.decisiones || {})});
    Object.assign(h.lazos, ${JSON.stringify(o.lazos || {})});
    P.horas = ${o.horas ?? 12};
    return 1 })()`);
  const cerrarTarjetas = async () => { for (let k = 0; k < 4 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); } };
  const abrirMapa = async () => { await N('N.despejar(8, { esc: true })'); await cerrarTarjetas(); if (await N('N.mapaAbierto()')) return true; await N('N.tecla("KeyM")'); await N('N.tick(0.5)'); return !!(await N('N.mapaAbierto()')); };
  const cerrarMapa = async () => { await N('N.tecla("Escape")'); await N('N.tick(0.5)'); };
  const entrar = async (tipo = 'historia', extraAjustes = {}) => {
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes(tipo, extraAjustes)); await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)');
    if (tipo === 'historia') { await N('N.hasta(() => N.tarjeta(), 12)'); await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })'); await cerrarTarjetas(); }
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; P.horas = 12; return 1 })()');
  };
  // volver a abrir lo guardado: se guarda, se recarga la página SIN tocar el almacenamiento y se entra
  const reabrir = async (tipo = 'historia') => {
    const g = await js('window.__hojarasca.guardar()');
    await w.loadFile(url, { search: '?debug=1' }); await esperarJuego();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.0)');
    return g;
  };
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  let prog0 = 0;
  try {
    donde = 'entrar';
    await entrar();
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);

    // ================================================================ 1. guardar y volver a abrir
    if (va('guardado')) {
      donde = 'guardado';
      console.log('— 1. guardar y volver a abrir: en el tren, en una escena, con plata y fletes, y con el premio de un capítulo');
      // 1a. con plata, fletes, existencias del puesto y un viaje en el tren
      await prep(3, { horas: 12 });
      await N('(() => { P.historia.activa = false; return 1 })()');   // (en pausa: ninguna escena se mete mientras se sube al tren)
      await N(`(() => {
        P.economia.pesos = 7300; P.economia.libro.push({ dia: 29, monto: 500, motivo: 'prueba', con: 'x' });
        const t = H.tren, ps = t.paradas, a = ps[0], b = ps[3];
        const c = H.__cargas().comercio();
        c.fletes.push({ id: '30|' + a.nombre + '|0', tipo: 'carga', desde: a.nombre, hasta: b.nombre, cuantos: 4, que: 'bolsas', premio: { pesos: 400, material: { k: 'tabla', n: 4 } }, dia: 30 });
        c.hoy.tomados.push('30|' + a.nombre + '|0');
        P.materiales.tabla = 12; P.materiales.tronco = 9; P.cosas.poncho = 2;
        return 1 })()`);
      // subir al tren de verdad: se lo trae al andén y el jugador sube
      const sube = await N(`(() => { const t = H.tren, e = t.estacion; t.est.subido = false; t.est.conduce = false; t.est.varado = false; t.est.s = t.poste(e); t.est.parado = 30; t.est.vel = 0; t.est.proxima = e; H.jugador.ubicar(e.espera.x, e.espera.z, 0); return t.puedeSubir(H.jugador.estado) })()`);
      console.log('  puedeSubir:', sube);
      await N('N.tick(0.6)');
      await N('(() => { H.tren.subir(H.jugador); return 1 })()');
      await N('N.tick(3)');
      const enTren = await N('H.jugador.estado.enTren');
      ok(enTren === true, 'subido al tren');
      const antes = await N('N.foto()');
      const g = await reabrir();
      const prog1 = await N('N.programas()');
      const despues = await N('N.foto()');
      const a1 = { ...antes, pos: null }, d1 = { ...despues, pos: null };
      ok(g !== false, `guardó con el tren en marcha (guardar() dijo ${g})`);
      ok(igual(a1.comercio, d1.comercio), 'el comercio (fletes, tomados, existencias) vuelve igual');
      ok(antes.pesos === despues.pesos && antes.libro === despues.libro, `la plata vuelve igual ($${antes.pesos} y $${despues.pesos})`);
      ok(igual(a1.materiales, d1.materiales) && igual(a1.cosas, d1.cosas), 'lo que llevás vuelve igual');
      ok(igual(a1.hist, d1.hist), 'la Historia vuelve igual');
      const e = await N(`(() => { const j = H.jugador.estado, e = H.tren.estacion; return { enTren: j.enTren, d: Math.hypot(j.pos.x - e.espera.x, j.pos.z - e.espera.z), flete: P.comercio.fletes.length } })()`);
      ok(!e.enTren && e.d < 25, `al volver estás a pie, en la estación (a ${e.d.toFixed(1)} m)`);
      ok(prog1 <= prog0 + 1, `sin programas nuevos (${prog0} a ${prog1})`);
      // 1b. en medio de una escena
      await prep(1, { horas: 10, vistas: ['ramon-tranquera'] });
      await N('(() => { P.economia.pesos = 2500; return 1 })()');
      const dispara = await N(`(() => { const ok = H.__escenas.director.disparar('elsa-anden'); return ok })()`);
      await N('N.tick(2.0)');
      const enEscena = await N('H.__escenas.activa()');
      const f0 = await js('(() => { const antes = localStorage.getItem("hojarasca-v1"); const r = window.__hojarasca.guardar(); const despues = localStorage.getItem("hojarasca-v1"); return { r, igual: antes === despues } })()');
      console.log(`  escena disparada: ${dispara}, activa: ${enEscena}, guardar() en medio de la escena: ${JSON.stringify(f0)}`);
      ok(enEscena && f0.r === false && f0.igual, 'en medio de una escena no se guarda (y no toca lo guardado)');
      await N('N.despejar(60)');
      const tras = await N('({ vista: Object.hasOwn(P.historia.escenas.vistas, "elsa-anden"), pesos: P.economia.pesos })');
      await reabrir();
      const trasR = await N('({ vista: Object.hasOwn(P.historia.escenas.vistas, "elsa-anden"), pesos: P.economia.pesos })');
      ok(igual(tras, trasR), `terminada la escena y vuelta a abrir, queda igual (${JSON.stringify(tras)} y ${JSON.stringify(trasR)})`);
      // 1c. el premio de un capítulo se cobra una vez, también después de volver a abrir
      await prep(1, { horas: 12, fase: 'outro' });
      await N('(() => { P.economia.pesos = 100; return 1 })()');
      await N('H.__valle.revisarAhora()'); await N('N.tick(1.0)');
      const tarj = await N('N.tarjeta()');
      console.log('  tarjeta de cierre:', JSON.stringify(tarj));
      await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(1.0)');
      const cobro = await N('({ pesos: P.economia.pesos, cap: P.historia.capitulo, fase: P.historia.fase })');
      console.log('  después de cerrar el capítulo:', JSON.stringify(cobro));
      ok(cobro.pesos === 1100, `el premio del capítulo 2 es de $1.000 una sola vez (pesos ahora $${cobro.pesos})`);
      await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.5)');
      await reabrir();
      const trasPremio = await N('({ pesos: P.economia.pesos, cap: P.historia.capitulo })');
      ok(trasPremio.pesos === cobro.pesos, `volviendo a abrir no se cobra otra vez (pesos $${trasPremio.pesos})`);
    }

    // ================================================================ 1bis. partidas viejas (la 4.18.4 y la 4.22.0, armadas con el código de esas versiones)
    if (va('viejas')) {
      donde = 'viejas';
      console.log('— 1bis. partidas viejas en el juego de verdad');
      for (const [ver, archivo] of [['4.18.4', 'partida-4-18-4.json'], ['4.22.0', 'partida-4-22-0.json']]) {
        const txt = fs.readFileSync(path.join(raiz, 'pruebas', 'datos-4-25-0-a', archivo), 'utf8');
        await w.loadFile(url, { search: '?debug=1' });
        await js(ajustes('historia') + `; localStorage.setItem('hojarasca-v1', ${JSON.stringify(txt)}); 1`);
        await cargar();
        await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3500);
        await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
        await N('N.tick(3)');
        await N('N.despejar(20, { esc: true })'); await cerrarTarjetas();
        const e = await N(`({ dia: P.dia, pesos: P.economia.pesos, cap: P.historia.capitulo, fase: P.historia.fase, fletes: P.comercio.fletes.map((f) => f.premio), modo: H.progreso.modo || 'relax', errores: (window.__hojarascaErrores || []).length })`);
        console.log(`  ${ver}:`, JSON.stringify(e));
        ok(e.dia >= 41 && e.pesos === 5400 && e.cap >= 4, `${ver}: entra con su día, su plata y su capítulo`);
        ok(e.fletes.length === 1 && Number.isInteger(e.fletes[0].pesos), `${ver}: el flete en curso paga en pesos`);
        await N('N.tick(10)');
        // un puesto de la trochita: se compra, se vende y se entrega el flete
        const t = await N(`(async () => {
          const c = H.__cargas(), ps = H.tren.paradas, a = ps.find((p) => p.nombre === 'Estación del Valle') || ps[0], b = ps.find((p) => p.nombre === P.comercio.fletes[0]?.hasta) || ps[1];
          c.abrir(a, 'comprar'); const f = c.filas(); const antes = P.economia.pesos; if (f.length) c.elegir(0); const gasto = antes - P.economia.pesos; c.cerrar();
          const llego = c.llegar(b).length; const cobrado = P.economia.pesos - (antes - gasto);
          return { filas: f.length, gasto, llego, cobrado };
        })()`);
        console.log('  puesto:', JSON.stringify(t));
        ok(t.filas > 0 && t.gasto >= 0 && t.llego === 1 && t.cobrado >= 800, `${ver}: el puesto atiende y el flete se cobra (${JSON.stringify(t)})`);
        const antes = await N('N.foto()');
        await reabrir();
        const despues = await N('N.foto()');
        ok(igual({ ...antes, pos: null }, { ...despues, pos: null }), `${ver}: guardada con esta versión, vuelve igual`);
        await N('N.tick(4)');
      }
    }

    // ================================================================ 2. economía de verdad
    if (va('economia')) {
      donde = 'economia';
      console.log('— 2. la economía por el panel de la trochita, con días que pasan');
      await entrar('libre');
      await N('(() => { P.economia.pesos = 20000; return 1 })()');
      const res = await N(`(async () => {
        const c = H.__cargas(), ps = H.tren.paradas.filter((p) => p.cargas && !p.sinFletes), malos = [], cuentas = { compras: 0, ventas: 0, fletes: 0 };
        const dar = () => { P.materiales.tronco = (P.materiales.tronco || 0) + 6; P.materiales.tabla = (P.materiales.tabla || 0) + 8; P.materiales.piedra = (P.materiales.piedra || 0) + 8; P.cosas.poncho = (P.cosas.poncho || 0) + 2; P.cosas.harina = (P.cosas.harina || 0) + 4; };
        const sano = (donde) => {
          const e = P.economia;
          if (!Number.isInteger(e.pesos) || e.pesos < 0) malos.push('pesos ' + e.pesos + ' ' + donde);
          for (const [k, v] of Object.entries(P.materiales)) if (!Number.isInteger(v) || v < 0) malos.push('material ' + k + '=' + v + ' ' + donde);
          for (const [k, v] of Object.entries(P.cosas)) if (typeof v === 'number' && (!Number.isInteger(v) || v < 0)) malos.push('cosa ' + k + '=' + v + ' ' + donde);
          for (const [n, t] of Object.entries(P.comercio.mercado || {})) { if (!(t.caja >= 0)) malos.push('caja ' + n + '=' + t.caja); for (const [b, q] of Object.entries(t.stock)) if (!Number.isInteger(q) || q < 0 || q > 30) malos.push('stock ' + n + '/' + b + '=' + q); }
        };
        for (let dia = 0; dia < 12; dia++) {
          P.dia = 40 + dia * 3; dar();
          for (const p of ps) {
            for (const modo of ['comprar', 'vender', 'fletes']) {
              c.abrir(p, modo);
              for (let k = 0; k < 4; k++) { const f = c.filas(); if (!f.length) break; const antes = P.economia.pesos; c.elegir(k % f.length); if (modo === 'comprar' && P.economia.pesos < antes) cuentas.compras++; if (modo === 'vender' && P.economia.pesos > antes) cuentas.ventas++; }
              c.cerrar();
            }
            const nf = P.comercio.fletes.length; const ll = c.llegar(ps[(ps.indexOf(p) + 3) % ps.length]); cuentas.fletes += ll.length;
            sano('dia ' + dia + ' ' + p.nombre);
          }
        }
        return { malos: malos.slice(0, 5), cuentas, pesos: P.economia.pesos, fletes: P.comercio.fletes.length, entregas: P.comercio.entregas };
      })()`);
      console.log('  ', JSON.stringify(res));
      ok(res.malos.length === 0, 'plata, materiales y existencias siempre enteros y no negativos');
      ok(res.cuentas.compras > 20 && res.cuentas.ventas > 20, `se compró y se vendió de verdad (${res.cuentas.compras} compras, ${res.cuentas.ventas} ventas)`);
      const a = await N('N.foto()');
      await reabrir('libre');
      const d = await N('N.foto()');
      ok(igual({ ...a, pos: null }, { ...d, pos: null }), 'después de tanto comercio, guardar y abrir deja todo igual');
    }

    // ================================================================ 3. el mapa
    if (va('mapa')) {
      donde = 'mapa';
      console.log('— 3. el mapa con la Historia pausada, con una escena en curso y en el Desafío');
      await entrar();
      await prep(2, { horas: 12, vistas: ['ramon-tranquera'] });
      await N('H.__valle.revisarAhora()'); await N('N.tick(0.6)'); await cerrarTarjetas();
      const m1 = await N('H.__valle.marcasObjetivo()');
      console.log('  marcas con la Historia en curso:', JSON.stringify(m1.map((x) => x.punto)));
      // el rumbo hacia una marca
      if (m1.length) {
        ok(await abrirMapa(), 'abre el mapa');
        await N(`N.clicEnMapa(${m1[0].x}, ${m1[0].z})`); await N('N.tick(0.4)');
        await cerrarMapa(); await N('N.tick(1.2)');
        const r1 = await N('N.rumbo()');
        console.log('  rumbo tras el clic:', r1);
        ok(!!r1, 'un clic en la marca pone el rumbo');
        // pausa la Historia: el rumbo se suelta solo
        await N('(() => { P.historia.activa = false; return 1 })()'); await N('N.tick(2.5)');
        const r2 = await N('N.rumbo()');
        ok(!r2, 'al pausar la Historia, el rumbo hacia el objetivo se suelta solo');
        ok(await abrirMapa(), 'el mapa abre con la Historia pausada');
        await foto('3-mapa-pausada');
        const m2 = await N('H.__valle.marcasObjetivo()');
        ok(m2.length === 0, 'con la Historia pausada no hay marcas de objetivos');
        await cerrarMapa();
        await N('(() => { P.historia.activa = true; return 1 })()'); await N('N.tick(1.5)');
        // otra vez rumbo y guardar/abrir: no queda pegado ni deja chinche
        ok(await abrirMapa(), 'abre el mapa otra vez');
        await N(`N.clicEnMapa(${m1[0].x}, ${m1[0].z})`); await N('N.tick(0.4)'); await cerrarMapa();
        const chin = await N('P.chinches.length');
        ok(chin === 0, 'la marca de un objetivo no deja una chinche guardada');
      }
      // con una escena en curso
      const disp = await N(`H.__escenas.director.disparar('elsa-anden')`); await N('N.tick(1.5)');
      const antesM = await N('({ activa: H.__escenas.activa(), corriendo: H.__escenas.corriendo() })');
      await N('(() => { N.tecla("KeyM"); return 1 })()'); await N('N.tick(0.5)');
      const abiertoEnEscena = await N('N.mapaAbierto()');
      console.log('  escena disparada', disp, JSON.stringify(antesM), '· mapa abierto con la escena en curso:', abiertoEnEscena);
      ok(disp === true && antesM.corriendo, 'la escena está corriendo');
      ok(!abiertoEnEscena, 'con una escena en curso la M no abre el mapa');
      await N('N.despejar(60, { esc: true })'); await cerrarTarjetas();
      if (await N('N.mapaAbierto()')) await cerrarMapa();
    }

    // ================================================================ 4. logros
    if (va('logros')) {
      donde = 'logros';
      console.log('— 4. los logros de la Historia: una sola vez y sobreviven a recargar');
      await entrar();
      await N(`(() => { localStorage.removeItem('hojarasca-logros-relax-v1'); return 1 })()`);
      await prep(4, { horas: 12 });
      await N(`(() => { const L = H.__logrosRelax(); const nuevos = H.revisarLogrosRelax(100); return L.progreso().hechos })()`);
      const l1 = await N(`(() => { const L = H.__logrosRelax(); return { hechos: L.progreso().hechos, ids: Object.keys(L.estado().logros) } })()`);
      console.log('  logros con el capítulo 5 en curso:', JSON.stringify(l1));
      ok(l1.ids.includes('historia-verano'), 'cerrar el primer acto da «Ya sos del valle»');
      await N('H.revisarLogrosRelax(100)'); await N('H.revisarLogrosRelax(100)');
      const l2 = await N(`H.__logrosRelax().estado()`);
      ok(igual(Object.keys(l2.logros), l1.ids), 'revisar de nuevo no suma ni repite');
      const fecha = l2.logros['historia-verano'];
      await reabrir();
      await N('H.revisarLogrosRelax(100)'); await N('N.tick(0.5)');
      const l3 = await N(`H.__logrosRelax().estado()`);
      ok(l3.logros['historia-verano'] === fecha, 'después de recargar siguen y con la misma fecha');
    }
  } catch (e) {
    console.log('✗ EXCEPCIÓN en ' + donde + ': ' + (e && e.stack || e));
    errores.push('excepción en ' + donde + ': ' + (e && e.message));
  }
  try {
    const prog1 = await js('window.__hojarasca ? window.__hojarasca.renderer.info.programs.length : -1').catch(() => -1);
    console.log(`  programas al final: ${prog1} (al empezar: ${prog0})`);
  } catch {}
  console.log(errores.length ? `\nHAY ${errores.length} PROBLEMAS:\n  ` + errores.join('\n  ') : '\nTodo en orden.');
  setTimeout(() => app.exit(errores.length ? 1 : 0), 500);
});
