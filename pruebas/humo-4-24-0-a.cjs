// Partida real 4.24.0 (A) (Electron + WebGL): «No te pierdas», en una Historia que empieza de verdad y en capítulos puestos a mano.
//   1. inicio: el minuto uno de una Historia nueva: el primer objetivo (llegar al Refugio del Arroyo) ya está marcado en el mapa; un clic en la marca pone el rumbo en la brújula
//      y camina con vos; otro clic lo suelta; cumplido el objetivo, la marca y el rumbo se van solos;
//   2. marca: el capítulo 5 (molino viejo, Puesto Alto): la banderita se dibuja (se cuentan los píxeles), los lugares conocidos se nombran, una chinche propia sigue andando;
//   3. panel: el capítulo 11 con sus cadenas, en 1366x768 y en 1024x600 (entra en la ventana, sin desborde), y el capítulo 13 con sus cuatro marcas;
//   4. guía: la línea de teclas de la Historia;
//   y que no se sume ningún programa de shader (base 111).
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-24-0-a.ps1
//   (o con el candado a mano: herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-24-0-a.cjs -Espera 2700 -Perfil <carpeta propia> -Visible)
//   HUMO_SECCIONES=inicio,marca,panel,guia (cuáles; por defecto todas) · HUMO_CAPTURAS=0 sin capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-24-0-a'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 25 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 25 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';
const SEC = process.env.HUMO_SECCIONES ? new Set(process.env.HUMO_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);

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
  // el mapa: la caja del lienzo y dónde cae un punto del mundo (x, z) en la pantalla
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
  // píxeles del color de la banderita (#b8432f) en una ventana de 30 x 30 alrededor de un punto del mundo
  N.rojosEn = (x, z) => {
    const c = document.getElementById('lienzo-mapa'), q = N.puntoEnPantalla(x, z);
    const d = c.getContext('2d').getImageData(Math.max(0, Math.round(q.px) - 24), Math.max(0, Math.round(q.py) - 36), 48, 48).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 184) < 24 && Math.abs(d[i + 1] - 67) < 24 && Math.abs(d[i + 2] - 47) < 24) n++;
    return n;
  };
  N.rumbo = () => { const b = document.querySelector('#brujula b.rumbo'); return b && b.style.display !== 'none' ? b.textContent : null; };
  N.panel = () => {
    const p = document.getElementById('historia-hud');
    if (!p || p.classList.contains('oculto')) return null;
    const r = p.getBoundingClientRect();
    return { arriba: Math.round(r.top), abajo: Math.round(r.bottom), izq: Math.round(r.left), der: Math.round(r.right), ventana: [window.innerWidth, window.innerHeight], lineas: p.querySelectorAll('p').length, cadenas: [...p.querySelectorAll('.cadena-t')].map((x) => x.innerText.replace(/\s+/g, ' ')),
      compacto: /pasos? más/.test(p.innerText), optativas: !!p.querySelector('.optativas'), mapa: (p.querySelector('p.mapa') || {}).innerText || '', texto: p.innerText };
  };
  N.desborde = (sel) => {
    const c = document.querySelector(sel);
    if (!c) return { hay: false };
    return { hay: true, ancho: c.clientWidth, contenido: c.scrollWidth };
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
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 120000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, T = H.T; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = (tipo, extra = {}) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false, guiaPrimerDia:false}, ${JSON.stringify(extra)}))); 1`;
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const foto = async (nombre) => {
    if (!CAPTURAS) return;
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(900 + intento * 600);   // (capturePage va un cuadro atrás: se espera a que pinte)
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
  const tamano = async (a, h) => { await w.setContentSize(a, h); await esperar(900); };
  // (antes de apretar M se despeja lo que esté en curso —una escena, una tarjeta—: con algo encima la M no abre el mapa)
  const abrirMapa = async () => { await N('N.despejar(8, { esc: true })'); await cerrarTarjetas(); if (await N('N.mapaAbierto()')) return true; await N('N.tecla("KeyM")'); await N('N.tick(0.5)'); return !!(await N('N.mapaAbierto()')); };
  const cerrarMapa = async () => { await N('N.tecla("Escape")'); await N('N.tick(0.5)'); };

  let prog0 = 0;
  try {
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes('historia')); await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)');
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);

    // ================================================================ 1. el minuto uno de una Historia nueva
    if (va('inicio')) {
      donde = 'inicio';
      console.log('— 1. el minuto uno: «Llegá al Refugio del Arroyo» marcado en el mapa');
      await N('N.hasta(() => N.tarjeta(), 12)');
      ok(!!(await N('N.tarjeta()')), 'la tarjeta de entrada del capítulo 1 está');
      await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })'); await cerrarTarjetas();
      const ini = await N('({ cap: P.historia.capitulo, fase: P.historia.fase, activa: P.historia.activa, dia: P.dia, horas: P.horas, pos: { x: Math.round(H.jugador.estado.pos.x), z: Math.round(H.jugador.estado.pos.z) } })');
      console.log('  partida:', JSON.stringify(ini));
      ok(ini.cap === 0 && ini.fase === 'jugando' && ini.activa, 'la Historia está en el capítulo 1, jugando');
      const m0 = await N('H.__valle.marcasObjetivo()');
      console.log('  marcas:', JSON.stringify(m0));
      ok(m0.length === 1 && m0[0].punto === 'refugio' && m0[0].nombre === 'Refugio del Arroyo' && Math.abs(m0[0].x - (-120)) < 1 && Math.abs(m0[0].z - 232) < 1, 'el primer objetivo marca el Refugio del Arroyo en (-120, 232)');
      const pan = await N('N.panel()');
      ok(pan && /En el mapa: Refugio del Arroyo/.test(pan.mapa), `el panel dice «${pan && pan.mapa}»`);
      ok((await N('N.rumbo()')) === null, 'la brújula no sigue nada hasta que lo pidas');
      await abrirMapa();
      ok(await N('N.mapaAbierto()'), 'el mapa se abre con M');
      const rojos = await N('N.rojosEn(-120, 232)');
      ok(rojos >= 20, `la banderita colorada se dibuja en el papel (${rojos} píxeles)`);
      await foto('1-mapa-minuto-uno');
      // un clic en la marca: el rumbo
      await N('N.clicEnMapa(-118, 230)'); await N('N.tick(0.4)');
      await cerrarMapa();
      await N('N.tick(0.6)');
      const r1 = await N('N.rumbo()');
      console.log('  brújula:', r1);
      ok(!!r1 && /^.*Refugio del Arroyo · \d+ m/.test(r1), `un clic en la marca pone el rumbo en la brújula («${r1}»)`);
      const d1 = Number((/(\d+) m/.exec(r1) || [])[1]);
      ok(d1 > 60 && d1 < 400, `a una distancia razonable del refugio (${d1} m desde la estación)`);
      await foto('1-brujula-con-rumbo');
      // el rumbo no es una chinche: no se guardó nada
      ok((await N('(P.chinches || []).length')) === 0, 'no es una chinche: no hay ninguna guardada');
      // caminar hacia el refugio: la distancia baja
      await N('(() => { const e = H.jugador.estado; H.jugador.ubicar(e.pos.x + (-120 - e.pos.x) * 0.5, e.pos.z + (232 - e.pos.z) * 0.5, e.yaw); return 1 })()'); await N('N.tick(1.0)');
      const d2 = Number((/(\d+) m/.exec(await N('N.rumbo()')) || [])[1]);
      ok(d2 < d1 - 20, `acercándote, baja la distancia (${d1} → ${d2} m)`);
      // otro clic en la marca: lo suelta
      ok(await abrirMapa(), 'el mapa se vuelve a abrir');
      await N('N.clicEnMapa(-120, 232)'); await N('N.tick(0.3)'); await cerrarMapa(); await N('N.tick(0.5)');
      ok((await N('N.rumbo()')) === null, 'otro clic en la marca suelta el rumbo');
      // y otra vez, para ver que se va solo al cumplirse el objetivo (llegar al refugio)
      ok(await abrirMapa(), 'el mapa se abre otra vez'); await N('N.clicEnMapa(-120, 232)'); await N('N.tick(0.3)'); await cerrarMapa(); await N('N.tick(0.5)');
      ok(!!(await N('N.rumbo()')), 'vuelve a seguirlo');
      await N('(() => { H.jugador.ubicar(-117, 229, 0); return 1 })()');
      await N('N.hasta(() => P.historia.hechos["llave:refugio"] !== undefined, 8)'); await N('N.tick(1.6)');
      const hecho = await N('P.historia.hechos["llave:refugio"] !== undefined');
      ok(hecho, 'llegar al refugio cumple el primer objetivo');
      ok((await N('H.__valle.marcasObjetivo().length')) === 0 || (await N('H.__valle.marcasObjetivo().every((m) => m.objetivo !== "refugio")')), 'la marca de ese objetivo se va');
      ok((await N('N.rumbo()')) === null, 'y la brújula suelta el rumbo sola');
      await foto('1-refugio-cumplido');
    }

    // ================================================================ 2. el capítulo 5: molino viejo y Puesto Alto
    if (va('marca')) {
      donde = 'marca';
      console.log('— 2. el capítulo 5: la banderita, los lugares conocidos y las chinches de siempre');
      await N('(() => { P.chinches = []; return 1 })()');
      await prep(4, { horas: 12 });
      await N('H.__valle.revisarAhora()'); await N('N.tick(1.0)');
      const m = await N('H.__valle.marcasObjetivo()');
      const conocidos = await N('H.__valle.lugaresConocidos()');
      console.log('  marcas:', JSON.stringify(m.map((x) => `${x.nombre} (${x.objetivo})`)), '· conocidos:', JSON.stringify(conocidos.map((x) => x.nombre)));
      ok(m.some((x) => x.punto === 'molino-viejo') && m.some((x) => x.punto === 'puesto'), 'las piedras del molino viejo y el zaino en el Puesto Alto están marcados');
      ok(conocidos.map((x) => x.punto).join() === 'molino-viejo,coihue', 'el mapa nombra el molino viejo y el coihue grande (los conoce desde el capítulo 5)');
      const mv = m.find((x) => x.punto === 'molino-viejo'), pa = m.find((x) => x.punto === 'puesto');
      ok(Number.isFinite(mv.x) && Number.isFinite(mv.z) && Math.abs(mv.x) < 470 && Math.abs(mv.z) < 470, `el molino viejo cae adentro del valle (${Math.round(mv.x)}, ${Math.round(mv.z)})`);
      ok(await abrirMapa(), 'el mapa se abre');
      const rM = await N(`N.rojosEn(${mv.x}, ${mv.z})`), rP = await N(`N.rojosEn(${pa.x}, ${pa.z})`);
      ok(rM >= 20 && rP >= 20, `las dos banderitas se dibujan (${rM} y ${rP} píxeles)`);
      await foto('2-mapa-capitulo-5-1366x768');
      await tamano(1024, 600); await N('N.tick(0.6)');
      await foto('2-mapa-capitulo-5-1024x600');
      const caja = await N(`(() => { const c = document.getElementById('lienzo-mapa').getBoundingClientRect(); return { izq: Math.round(c.left), arriba: Math.round(c.top), der: Math.round(c.right), abajo: Math.round(c.bottom), ventana: [innerWidth, innerHeight] }; })()`);
      ok(caja.izq >= 0 && caja.arriba >= 0 && caja.der <= caja.ventana[0] && caja.abajo <= caja.ventana[1], `en 1024x600 el mapa entra en la ventana (${JSON.stringify(caja)})`);
      await tamano(ANCHO, ALTO); await N('N.tick(0.4)');
      // el clic en la marca del Puesto Alto, y una chinche propia en el papel vacío (como siempre)
      await N(`N.clicEnMapa(${pa.x}, ${pa.z})`); await N('N.tick(0.3)');
      ok((await N('(P.chinches || []).length')) === 0, 'el clic en la marca no deja chinche');
      await N('N.clicEnMapa(300, 300)'); await N('N.tick(0.3)');
      const ch = await N('(P.chinches || []).map((c) => c.nombre)');
      ok(ch.length === 1, `un clic en el papel vacío sigue poniendo una chinche (${ch.join()})`);
      await cerrarMapa(); await N('N.tick(0.6)');
      ok(/Chinche 1/.test((await N('N.rumbo()')) || ''), 'y la brújula va a esa chinche (la última que pusiste)');
      // cumplir el objetivo del molino: la marca se va del mapa
      await N(`(() => { P.historia.hechos["rueda:piedras"] = P.dia; return 1 })()`); await N('N.tick(0.4)');
      ok((await N('H.__valle.marcasObjetivo().every((x) => x.objetivo !== "piedras")')), 'cumplido «las piedras del molino viejo», su marca se va; el lugar sigue nombrado en el papel');
      await N('(() => { P.chinches = []; return 1 })()');
    }

    // ================================================================ 3. el panel del capítulo 11 y el 13
    if (va('panel')) {
      donde = 'panel';
      console.log('— 3. el panel: las cadenas del capítulo 11 y las marcas del 13');
      for (const [a, h, nombre] of [[ANCHO, ALTO, '1366x768'], [1024, 600, '1024x600']]) {
        await tamano(a, h);
        await prep(10, { horas: 12, hechos: ['lenga', 'cantos'] });
        await N('H.__valle.revisarAhora()'); await N('N.tick(1.2)'); await cerrarTarjetas();
        const p = await N('N.panel()');
        console.log(`  ${nombre}: panel de ${p && p.abajo - p.arriba} px (de ${p && p.arriba} a ${p && p.abajo} de ${h}), ${p && p.lineas} líneas, cadenas ${JSON.stringify(p && p.cadenas)}, compacto ${p && p.compacto}, optativas ${p && p.optativas}`);
        ok(p && p.cadenas.length === 2 && /El arco/.test(p.cadenas[0]) && /La honda/.test(p.cadenas[1]), `${nombre}: las dos cadenas con título`);
        ok(p && /\d de 6/.test(p.cadenas[0]) && /\d de 3/.test(p.cadenas[1]), `${nombre}: con su contador (${p && p.cadenas.join(' · ')})`);
        ok(p && p.abajo <= h - 6, `${nombre}: el panel entra en la ventana (abajo ${p && p.abajo} de ${h})`);
        ok(p && p.der <= a, `${nombre}: ni se sale por el costado`);
        ok(p && /Recorré el lado del arroyo/.test(p.texto) && /Pedí defensas prestadas/.test(p.texto), `${nombre}: los objetivos sueltos están`);
        ok(p && p.mapa !== '' && /Puesto del Paso|Galpón de Esquila/.test(p.mapa), `${nombre}: «${p && p.mapa}»`);
        await foto(`3-panel-capitulo-11-${nombre}`);
      }
      // el capítulo 13 (carpeta, majada, fiesta, Josefina, umbral): cuatro marcas
      await tamano(ANCHO, ALTO);
      await prep(12, { horas: 12 });
      await N('H.__valle.revisarAhora()'); await N('N.tick(1.0)'); await cerrarTarjetas();
      const m13 = await N('H.__valle.marcasObjetivo()');
      ok(m13.length === 4 && new Set(m13.map((x) => x.punto)).size === 4, `capítulo 13: cuatro marcas distintas (${m13.map((x) => x.nombre).join(', ')})`);
      await abrirMapa(); await foto('3-mapa-capitulo-13'); await cerrarMapa();
      await foto('3-panel-capitulo-13');
      // el Desafío no se toca: la API no devuelve nada si la Historia está en pausa
      await N('(() => { P.historia.activa = false; return 1 })()');
      ok((await N('H.__valle.marcasObjetivo().length')) === 0, 'con la Historia en pausa no hay marcas de objetivo');
      await N('(() => { P.historia.activa = true; return 1 })()');
    }

    // ================================================================ 4. la guía
    if (va('guia')) {
      donde = 'guia';
      console.log('— 4. la guía (F1): las teclas de la Historia');
      for (const [a, h, nombre] of [[ANCHO, ALTO, '1366x768'], [1024, 600, '1024x600']]) {
        await tamano(a, h);
        await N('N.tecla("Escape")'); await N('N.tick(0.5)');
        await N('(() => { document.getElementById("btn-guia").click(); return 1 })()'); await N('N.tick(0.6)');
        const g = await N(`({ teclas: [...document.querySelectorAll('#historia-guia p.teclas')].map((x) => x.innerText) })`);
        ok(g.teclas[0] === 'Teclas de la historia: E hablar o tomar · R esperar sentado · M mapa · J cuaderno', `${nombre}: «${g.teclas[0]}»`);
        ok(/un clic en la marca y la brújula te lleva/.test(g.teclas[1] || ''), `${nombre}: y cuenta la marca del mapa`);
        const d = await N(`N.desborde('#guia .panel-modal')`);
        ok(d.hay && d.contenido <= d.ancho + 1, `${nombre}: la guía no se desborda a los costados (${d.contenido}/${d.ancho})`);
        await foto(`4-guia-${nombre}`);
        await N('N.tecla("Escape")'); await N('N.tick(0.4)');
      }
      await tamano(ANCHO, ALTO);
    }

    donde = 'cierre';
    const prog = await js('window.__hojarasca.renderer.info.programs.length').catch(() => prog0);
    ok(prog <= prog0 + 1, `programas de shader: ${prog0} → ${prog} (la base es 111; esta versión no suma ninguno)`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
