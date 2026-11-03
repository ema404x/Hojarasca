// Partida real 4.24.1 (A) (Electron + WebGL): la trochita de vuelta sin espera y el mapa y el panel mirados a ojo.
//   1. vuelta: en el andén de la Aldea, de regreso de las diligencias (te alejaste más de 30 m), con el tren lejos, Elsa lo apura (escena corta) y el tren llega en pocos segundos;
//      recién bajado del tren no sale; una sola vez; sin viaje hecho o de noche, no; la escena de la ida sigue andando;
//   2. mapa: la aldea apretada (la plaza y el almacén juntos): los dos nombres se leen; de noche y con lluvia; con una chinche propia encima de una banderita; en 1024x600;
//   3. panel: el capítulo 11 con todas las optativas abiertas en 1366x768 y en 1024x600 (entra, no pisa la barra de la mano, las optativas se van de a una);
//   4. teclas reasignadas: el panel, los botones «Cerrar», el mapa y la guía dicen las teclas del jugador;
//   y que no se sume ningún programa de shader.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-24-1-a.ps1
//   (o con el candado a mano: herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-24-1-a.cjs -Espera 2700 -Perfil <carpeta propia> -Visible)
//   HUMO_SECCIONES=vuelta,mapa,panel,teclas (cuáles; por defecto todas) · HUMO_CAPTURAS=0 sin capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-24-1-a'));
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
  // un recorte del papel del mapa, en grande: alrededor de (x, z), de r metros de radio, a 640 x 640
  N.recorte = (x, z, r) => {
    const c = document.getElementById('lienzo-mapa'), q = N.puntoEnPantalla(x, z), s = (r / 1024) * c.width;
    const o = document.createElement('canvas'); o.width = o.height = 640;
    o.getContext('2d').drawImage(c, q.px - s, q.py - s, 2 * s, 2 * s, 0, 0, 640, 640);
    return o.toDataURL('image/png');
  };
  N.panel = () => {
    const p = document.getElementById('historia-hud');
    if (!p || p.classList.contains('oculto')) return null;
    const r = p.getBoundingClientRect();
    return { arriba: Math.round(r.top), abajo: Math.round(r.bottom), izq: Math.round(r.left), der: Math.round(r.right), ventana: [window.innerWidth, window.innerHeight], lineas: p.querySelectorAll('p').length, cadenas: [...p.querySelectorAll('.cadena-t')].map((x) => x.innerText.replace(/\s+/g, ' ')),
      compacto: /pasos? más/.test(p.innerText), optativas: !!p.querySelector('.optativas'), nOpt: p.querySelectorAll('.optativas p:not(.mas)').length, masOpt: ((p.querySelector('.optativas p.mas') || {}).innerText || ''), mapa: (p.querySelector('p.mapa') || {}).innerText || '', texto: p.innerText };
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
  // (se vuelve a pedir hasta que la ventana de verdad tenga ese tamaño; la de 1366x768 mide 1368x776 con los bordes)
  const tamano = async (a, h) => {
    for (let i = 0; i < 4; i++) {
      if (w.isMaximized?.()) w.unmaximize(); if (w.isFullScreen?.()) w.setFullScreen(false);
      w.setContentSize(a, h); await esperar(900);
      const m = await js('[innerWidth, innerHeight]').catch(() => [0, 0]);
      if (Math.abs(m[0] - a) <= 12 && Math.abs(m[1] - h) <= 12) return;
    }
    console.log(`  (la ventana quedó en ${await js('innerWidth')}x${await js('innerHeight')} y no en ${a}x${h}; maximizada: ${w.isMaximized?.()}, pantalla completa: ${w.isFullScreen?.()}, contenido: ${w.getContentSize?.()})`);
  };
  // (antes de apretar M se despeja lo que esté en curso —una escena, una tarjeta—: con algo encima la M no abre el mapa)
  const abrirMapa = async () => { await N('N.despejar(8, { esc: true })'); await cerrarTarjetas(); if (await N('N.mapaAbierto()')) return true; await N('N.tecla("KeyM")'); await N('N.tick(0.5)'); return !!(await N('N.mapaAbierto()')); };
  const cerrarMapa = async () => { await N('N.tecla("Escape")'); await N('N.tick(0.5)'); };

  let prog0 = 0;
  const entrar = async (extraAjustes = {}) => {
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes('historia', extraAjustes)); await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)');
    await N('N.hasta(() => N.tarjeta(), 12)'); await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })'); await cerrarTarjetas();
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; P.horas = 12; return 1 })()');
  };
  try {
    donde = 'entrar';
    await entrar();
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);

    // ================================================================ 1. el viaje de vuelta sin espera
    if (va('vuelta')) {
      donde = 'vuelta';
      console.log('— 1. el viaje de vuelta en trochita sin la espera larga (andén de la Aldea)');
      await prep(1, { horas: 10, vistas: ['ramon-tranquera', 'elsa-anden'] });
      await N('(() => { P.entradas.viaje = { cantidad: 1 }; return 1 })()');
      // el tren acaba de salir de la Aldea y va hacia el valle: lejos del andén
      const est = await N(`(() => { const t = H.tren, a = t.paradas.find((p) => p.aldea); t.est.subido = false; t.est.conduce = false; t.est.varado = false; t.est.parado = 0; t.est.vel = 7; t.est.s = (t.poste(a) + 60) % t.largo; t.est.proxima = t.paradas.find((p) => p !== a) || a; return { espera: t.esperaEnAnden(a), x: a.espera.x, z: a.espera.z } })()`);
      console.log('  espera antes (con el tren que acaba de salir de la Aldea):', est.espera, 's');
      ok(est.espera > 300, `sin la escena, el tren que acaba de salir tarda más de 5 minutos (${est.espera} s)`);
      // (viajaste en el tren y te bajaste acá: el contador de «te alejaste» arranca de cero)
      await N('(() => { H.jugador.estado.enTren = true; return 1 })()'); await N('N.tick(0.6)'); await N('(() => { H.jugador.estado.enTren = false; return 1 })()');
      // recién bajado, en el andén: todavía no se alejó, así que no hay escena (se vienen las diligencias)
      await N(`H.jugador.ubicar(${est.x} + 4, ${est.z} + 4, 0)`);
      await N('N.tick(4)');
      ok(!(await N('H.__escenas.activa()')), 'recién llegado, parado en el andén (sin haberte alejado) no sale la escena');
      ok(!(await N('Object.hasOwn(P.historia.escenas.vistas, "elsa-anden-vuelta")')), 'y no queda vista');
      // se aleja a las diligencias (60 m) y vuelve: ahora sí
      await N(`H.jugador.ubicar(${est.x} + 60, ${est.z} + 20, 0)`);
      await N('N.tick(2.5)');
      ok(!(await N('H.__escenas.activa()')), 'a 60 m del andén tampoco');
      await N(`H.jugador.ubicar(${est.x} + 4, ${est.z} + 4, 0)`);
      const t0 = Date.now();
      const arranco = await N('N.hasta(() => H.__escenas.activa(), 25)');
      ok(arranco === 1, `de vuelta en el andén, con el tren lejos, la escena de Elsa arranca sola (a los ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
      await N('N.tick(2.5)');
      console.log('  puestos:', JSON.stringify(await N(`(() => { const p = H.__puntosHistoria().aldea, a = H.tren.paradas.find((q) => q.aldea), e = H.__escenas.mundo.posicion('elsa'), j = H.jugador.estado; return { anden: p, ang: a.ang, elsa: e && { x: +e.x.toFixed(1), z: +e.z.toFixed(1) }, jug: { x: +j.pos.x.toFixed(1), z: +j.pos.z.toFixed(1), yaw: +j.yaw.toFixed(2) } } })()`)));
      await foto('1-vuelta-escena');
      const tEscena = Date.now();
      await N('N.despejar(60)');
      const fin = await N('(() => ({ activa: H.__escenas.activa(), vista: Object.hasOwn(P.historia.escenas.vistas, "elsa-anden-vuelta"), tema: Object.hasOwn(P.historia.temas || {}, "mundo:tren-al-aldea"), peDespues: H.tren.esperaEnAnden(H.tren.paradas.find((p) => p.aldea)) }))()');
      ok(!fin.activa && fin.vista, `la escena termina y queda vista (${((Date.now() - tEscena) / 1000).toFixed(1)} s de escena)`);
      ok(fin.tema, 'anota que el tren se trajo (mundo:tren-al-aldea)');
      console.log('  espera después de la escena:', fin.peDespues, 's');
      ok(fin.peDespues <= 25, `después de la escena faltan ${fin.peDespues} s (antes: ${est.espera} s)`);
      await foto('1-vuelta-despues');
      const tLlega = Date.now();
      const llego = await N('N.hasta(() => { const a = H.tren.paradas.find((p) => p.aldea); return H.tren.parado() && H.tren.est.proxima === a && H.tren.esperaEnAnden(a) === 0; }, 60)');
      const seg = (Date.now() - tLlega) / 1000;
      ok(llego === 1 && seg < 45, `el tren llega y para en el andén de la Aldea en ${seg.toFixed(1)} s desde que termina la escena (antes: ${est.espera} s)`);
      await foto('1-vuelta-tren-en-el-anden');
      // una sola vez
      await N(`(() => { const t = H.tren, a = t.paradas.find((p) => p.aldea); t.est.parado = 0; t.est.s = (t.poste(a) + 60) % t.largo; t.est.proxima = t.paradas.find((p) => p !== a) || a; return 1 })()`);
      await N(`H.jugador.ubicar(${est.x} + 60, ${est.z} + 20, 0)`); await N('N.tick(1.5)'); await N(`H.jugador.ubicar(${est.x} + 4, ${est.z} + 4, 0)`);
      await N('N.tick(3)');
      ok(!(await N('H.__escenas.activa()')), 'la escena es de una sola vez');
      // sin ningún viaje hecho, no (es la ida, del otro lado)
      await N('(() => { delete P.historia.escenas.vistas["elsa-anden-vuelta"]; delete P.entradas.viaje; return 1 })()');
      await N(`H.jugador.ubicar(${est.x} + 60, ${est.z} + 20, 0)`); await N('N.tick(1.5)'); await N(`H.jugador.ubicar(${est.x} + 4, ${est.z} + 4, 0)`);
      await N('N.tick(3)');
      ok(!(await N('H.__escenas.activa()')), 'sin un viaje hecho no sale');
      // de noche tampoco (el tren es el de siempre)
      await N('(() => { P.entradas.viaje = { cantidad: 1 }; P.horas = 22.5; return 1 })()');
      await N('N.tick(3)');
      ok(!(await N('H.__escenas.activa()')), 'a las 22:30 no sale');
      await N('(() => { P.horas = 10; delete P.historia.escenas.vistas["elsa-anden-vuelta"]; P.historia.escenas.vistas["elsa-anden-vuelta"] = 1; return 1 })()');
      // el andén de la estación no cambió (la ida sigue igual): con el tren lejos y sin viaje, la de la ida sale
      await N('(() => { delete P.historia.escenas.vistas["elsa-anden"]; delete P.entradas.viaje; return 1 })()');
      await N(`(() => { const t = H.tren, e = t.estacion; t.est.subido = false; t.est.parado = 0; t.est.vel = 7; t.est.s = (t.poste(e) + 60) % t.largo; t.est.proxima = t.paradas.find((p) => p !== e) || e; H.jugador.ubicar(e.espera.x + 4, e.espera.z + 4, 0); return 1 })()`);
      ok((await N('N.hasta(() => H.__escenas.activa(), 25)')) === 1, 'la escena de la ida, en la estación, sigue andando');
      await N('N.despejar(60)');
    }

    // ================================================================ 2. el mapa a ojo
    if (va('mapa')) {
      donde = 'mapa';
      console.log('— 2. el mapa a ojo: banderitas en la aldea apretada, de noche, con lluvia, con una chinche encima');
      const recorte = async (nombre, x, z, r) => {
        const url = await N(`N.recorte(${x}, ${z}, ${r})`);
        fs.writeFileSync(path.join(salida, nombre + '.png'), Buffer.from(String(url).split(',')[1], 'base64'));
        console.log(`  (recorte ${nombre}.png)`);
      };
      await N('(() => { P.chinches = []; return 1 })()');
      // las marcas de cada capítulo
      const porCap = [];
      for (let cap = 0; cap < 13; cap++) {
        await prep(cap, { horas: 12 }); await N('H.__valle.revisarAhora()'); await N('N.tick(0.4)'); await cerrarTarjetas();
        const m = await N('H.__valle.marcasObjetivo()');
        porCap.push({ cap, puntos: m.map((x) => x.punto) });
      }
      console.log('  marcas por capítulo:', JSON.stringify(porCap.map((x) => `${x.cap + 1}: ${x.puntos.join('/')}`)));
      const EN_ALDEA = new Set(['plaza', 'ramos', 'panaderia', 'carpinteria', 'seccional', 'estudio-fotos', 'casa-herminia']);
      const elegido = porCap.filter((x) => x.puntos.includes('plaza')).sort((a, b) => b.puntos.filter((p) => EN_ALDEA.has(p)).length - a.puntos.filter((p) => EN_ALDEA.has(p)).length)[0] || porCap[2];
      console.log('  capítulo elegido para la aldea apretada:', elegido.cap + 1, JSON.stringify(elegido.puntos));
      await prep(elegido.cap, { horas: 12 }); await N('H.__valle.revisarAhora()'); await N('N.tick(0.6)'); await cerrarTarjetas();
      const pts = await N('H.__puntosHistoria()');
      const marcas = await N('H.__valle.marcasObjetivo()');
      const pl = marcas.find((x) => x.punto === 'plaza') || { x: pts.plaza.x, z: pts.plaza.z };
      ok(await abrirMapa(), 'el mapa se abre');
      await foto('2-mapa-aldea-1366x768');
      await recorte('2-recorte-aldea-dia', pl.x, pl.z, 95);
      await recorte('2-recorte-plaza-dia', pl.x, pl.z, 45);
      const rojosDia = await N(`N.rojosEn(${pl.x}, ${pl.z})`);
      console.log('  píxeles de la banderita de la plaza de día:', rojosDia);
      ok(rojosDia >= 20, `la banderita de la plaza se dibuja (${rojosDia} píxeles)`);
      // de noche y con lluvia (el papel es el mismo: la banderita también)
      await cerrarMapa();
      await N('(() => { P.horas = 23; H.clima.estado.lluvia = 1; return 1 })()'); await N('N.tick(2.5)');
      ok(await abrirMapa(), 'el mapa se abre de noche y con lluvia');
      await foto('2-mapa-aldea-noche-lluvia');
      await recorte('2-recorte-aldea-noche', pl.x, pl.z, 95);
      const rojosNoche = await N(`N.rojosEn(${pl.x}, ${pl.z})`);
      ok(rojosNoche === rojosDia, `de noche y con lluvia la banderita es la misma (${rojosNoche} y ${rojosDia} píxeles)`);
      await cerrarMapa();
      await N('(() => { P.horas = 12; H.clima.estado.lluvia = 0; return 1 })()'); await N('N.tick(1.0)');
      // una chinche propia justo encima de la banderita de la plaza
      await N(`(() => { P.chinches = [{ x: ${pl.x}, z: ${pl.z}, nombre: 'Chinche 1' }]; return 1 })()`);
      ok(await abrirMapa(), 'el mapa se abre con una chinche encima de la banderita');
      await recorte('2-recorte-chinche-encima', pl.x, pl.z, 45);
      await foto('2-mapa-chinche-encima');
      await cerrarMapa();
      await N('(() => { P.chinches = []; return 1 })()');
      // el mapa en 1024x600
      await tamano(1024, 600); await N('N.tick(0.5)');
      ok(await abrirMapa(), 'el mapa se abre en 1024x600');
      await foto('2-mapa-aldea-1024x600');
      await cerrarMapa();
      await tamano(ANCHO, ALTO); await N('N.tick(0.4)');
    }

    // ================================================================ 3. el panel del capítulo 11 con todas las optativas abiertas
    if (va('panel')) {
      donde = 'panel';
      console.log('— 3. el panel del capítulo 11 con todas las optativas abiertas, en 1366x768 y en 1024x600');
      for (const [a, h, nombre] of [[ANCHO, ALTO, '1366x768'], [1024, 600, '1024x600']]) {
        await tamano(a, h);
        await prep(10, { horas: 16, hechos: ['lenga', 'cantos'], vistas: ['ramon-cama', 'ramon-sanitario', 'tito-arco', 'ramon-guardia'] });
        // (las optativas del capítulo: lo que las ofrece, puesto a mano en la partida)
        await N(`(() => { P.cosas = P.cosas || {}; P.cosas['llave-79'] = 1; P.historia.duendes = Object.assign(P.historia.duendes || {}, { trato: 'trato' }); P.amor = P.amor || {}; P.amor.personas = Object.assign(P.amor.personas || {}, { camila: { etapa: 'saliendo' } }); return 1 })()`);
        await N('H.__valle.revisarAhora()'); await N('N.tick(1.0)'); await N('N.despejar(20, { esc: true })'); await cerrarTarjetas(); await N('H.__valle.revisarAhora()'); await N('N.tick(1.2)');
        const p = await N('N.panel()');
        console.log(`  ${nombre}: panel de ${p && p.abajo - p.arriba} px (de ${p && p.arriba} a ${p && p.abajo} de ${h}), ${p && p.lineas} líneas, cadenas ${JSON.stringify(p && p.cadenas)}, compacto ${p && p.compacto}, optativas ${p && p.nOpt} (${p && p.masOpt})`);
        console.log('  texto:', JSON.stringify(p && p.texto.replace(/\s+/g, ' ').slice(0, 900)));
        ok(p && p.abajo <= h - 6, `${nombre}: el panel entra en la ventana (abajo ${p && p.abajo} de ${h})`);
        ok(p && p.der <= a, `${nombre}: ni se sale por el costado`);
        ok(p && /Recorré el lado del arroyo/.test(p.texto), `${nombre}: el objetivo suelto no se esconde`);
        const b = await N(`(() => { const x = document.getElementById('barra'); if (!x) return null; const r = x.getBoundingClientRect(), q = document.getElementById('historia-hud').getBoundingClientRect(); return { izq: Math.round(r.left), arriba: Math.round(r.top), pisa: r.width > 0 && q.right > r.left && q.left < r.right && q.bottom > r.top - 4 }; })()`);
        console.log(`  ${nombre}: la barra de la mano: ${JSON.stringify(b)}`);
        ok(!b || !b.pisa, `${nombre}: el panel no pisa la barra de la mano`);
        await foto(`3-panel-optativas-${nombre}`);
      }
      await tamano(ANCHO, ALTO); await N('N.tick(0.4)');
    }

    // ================================================================ 4. teclas reasignadas
    if (va('teclas')) {
      donde = 'teclas';
      console.log('— 4. con las teclas reasignadas (mapa en la U, cuaderno en la G, hacha en la B, planos en la V, interactuar en la Q)');
      await entrar({ teclas: { mapa: 'KeyU', cuaderno: 'KeyG', hacha: 'KeyB', planos: 'KeyV', interactuar: 'KeyQ' } });
      await prep(1, { horas: 12, vistas: ['ramon-tranquera'] });
      await N('H.__valle.revisarAhora()'); await N('N.tick(1.0)'); await cerrarTarjetas();
      const p = await N('N.panel()');
      console.log('  panel:', JSON.stringify(p && p.texto.replace(/\s+/g, ' ').slice(0, 500)));
      const kbds = await N(`[...document.querySelectorAll('#historia-hud p > kbd')].map((k) => k.innerText)`);
      console.log('  teclas del panel:', JSON.stringify(kbds));
      ok(kbds.includes('Q') && kbds.includes('B') && kbds.includes('V') && !kbds.includes('E') && !kbds.includes('H') && !kbds.includes('O'), 'el panel muestra las teclas del jugador (Q, B, V), no las de fábrica');
      ok(/En el mapa: /.test(p.mapa), `y sigue la línea «${p.mapa}»`);
      await foto('4-panel-teclas-propias');
      // el mapa se abre con la U y no con la M
      await N('N.despejar(8, { esc: true })'); await cerrarTarjetas();
      await N('N.tecla("KeyM")'); await N('N.tick(0.5)');
      ok(!(await N('N.mapaAbierto()')), 'la M ya no abre el mapa');
      await N('N.tecla("KeyU")'); await N('N.tick(0.8)');
      ok(await N('N.mapaAbierto()'), 'la U abre el mapa');
      const botones = await N(`({ mapa: document.getElementById('cerrar-mapa').textContent, cuaderno: document.getElementById('cerrar-cuaderno').textContent })`);
      ok(botones.mapa === 'Cerrar (U)' && botones.cuaderno === 'Cerrar (G)', `los botones del papel dicen las teclas del jugador («${botones.mapa}» y «${botones.cuaderno}»)`);
      const m = await N('H.__valle.marcasObjetivo()');
      ok(m.length >= 1, `con las marcas de siempre (${m.map((x) => x.nombre).join(', ')})`);
      const r = await N(`N.rojosEn(${m[0].x}, ${m[0].z})`);
      ok(r >= 20, `la banderita se dibuja igual (${r} píxeles)`);
      await foto('4-mapa-teclas-propias');
      await N(`N.clicEnMapa(${m[0].x + 2}, ${m[0].z + 2})`); await N('N.tick(0.4)');
      await N('N.tecla("KeyU")'); await N('N.tick(0.6)');
      ok(!(await N('N.mapaAbierto()')), 'la U lo cierra');
      const rumbo = await N('N.rumbo()');
      ok(!!rumbo && new RegExp(m[0].nombre).test(rumbo), `un clic en la marca pone el rumbo («${rumbo}»)`);
      // la guía dice las teclas del jugador
      await N('(() => { document.getElementById("btn-guia").click(); return 1 })()'); await N('N.tick(0.6)');
      const g = await N(`({ teclas: [...document.querySelectorAll('#historia-guia p.teclas')].map((x) => x.innerText) })`);
      console.log('  guía:', JSON.stringify(g.teclas));
      ok(/^Teclas de la historia: Q hablar o tomar · R esperar sentado · U mapa · G cuaderno$/.test(g.teclas[0] || ''), `la guía dice las teclas del jugador («${g.teclas[0]}»)`);
      await foto('4-guia-teclas-propias');
      await N('N.tecla("Escape")'); await N('N.tick(0.4)');
    }

    donde = 'cierre';
    const prog = await js('window.__hojarasca.renderer.info.programs.length').catch(() => prog0);
    ok(prog <= 114, `programas de shader: ${prog0} → ${prog} (base 111; en la aldea, 113 o 114 es lo conocido de siempre; esta versión no suma ninguno)`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
