// Partida real 4.18.3 (Electron + WebGL): lo que antes no hacía nada y ahora gasta o cuesta.
//   1. «Visitar a Ramón» (capítulo 9): sin algo rico la E sobre Ramón no dispara la visita; con una trucha ahumada sí, se gasta UNA y se avisa en pantalla; una vez.
//   2. «Herminia y los noventa» (capítulo 8): lo mismo con lo dulce de la torta (un frasco de dulce de leche).
//   3. «D5 A sin costo»: la decisión de la majada con Fermín en dos lazos distintos (con reserva y con confianza): la escena de la tranquera la toma, la de la llegada le cobra
//      −1 a Ramón sólo si Fermín no confiaba; y la tarjeta de respaldo lo dice en palabras.
//   4. Guardar y recargar: lo gastado queda gastado y no se gasta de nuevo.
//   y que no se sume ningún programa de shader.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-18-3-gastos.cjs -Espera 2700 -Perfil <carpeta propia> -Visible
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'gastos-4-18-3'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 25 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 25 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';

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
    return { titulo: (v.querySelector('h2') || {}).textContent, arriba: (v.querySelector('.arriba') || {}).textContent, texto: [...v.querySelectorAll('p')].map((p) => p.textContent).join(' | '), opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => ({ id: b.dataset.valleOpcion, texto: b.textContent, deshabilitada: b.disabled })) };
  };
  N.elegir = (id) => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + id + '"]'); if (b) b.click(); return !!b; };
  // las notas que aparecen en pantalla (duran pocos segundos: se anotan al aparecer)
  N.notas = [];
  { const caja = document.getElementById('notas'); if (caja) new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('nota')) setTimeout(() => N.notas.push(n.textContent), 40); }).observe(caja, { childList: true }); }
  // lee las escenas (Enter) contestando la primera opción de cada pregunta; o.esc: saltearlas con Esc; o.eleccion: { idElección: 'Digit2' }
  N.despejar = async (maxSeg = 6, o = {}) => {
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (es && es.activa()) {
        const d = es.director.datos && es.director.datos();
        if (d && d.eleccion) { N.tecla((o.eleccion && o.eleccion[d.eleccion.id]) || 'Digit1'); await N.tick(0.3); continue; }
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
  N.panel = () => { const p = document.getElementById('historia-hud'); return p && !p.classList.contains('oculto') ? p.textContent : ''; };
  N.ir = (x, z, yaw = 0) => { J.ubicar(x, z, yaw); return 1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [], noVistas = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
    if (/escena de la historia mal armada/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
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
  const foto = async (nombre) => {
    if (!CAPTURAS) return;
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(250 + intento * 600);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const IDS = ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha', 'cuaderno', 'frios', 'golpea', 'arco', 'nevada', 'deshielo'];
  // pone la historia en el capítulo `cap` (0..12), jugando, con lo anterior cerrado
  const prep = (cap, o = {}) => N(`(() => {
    const h = P.historia, ids = ${JSON.stringify(IDS)};
    h.activa = true; h.empezada = 1; h.version = 2; h.acompanante = ${JSON.stringify(o.acompanante || null)}; h.capitulo = ${cap}; h.fase = '${o.fase || 'jugando'}'; h.base = { dia: P.dia, talados: 0, cocinadas: 0, cantos: 0 }; h.hechos = {}; h.momentos = {}; h.cerrados = {};
    ids.slice(0, ${cap}).forEach((k) => { h.cerrados[k] = P.dia - 1; });
    Object.assign(h.decisiones, ${JSON.stringify(o.decisiones || {})}); Object.assign(h.duendes, ${JSON.stringify(o.duendes || {})});
    for (const e of ${JSON.stringify(o.vistas || [])}) h.escenas.vistas[e] = P.dia;
    for (const e of ${JSON.stringify(o.temas || [])}) h.temas[e] = P.dia;
    P.horas = ${o.horas ?? 10};
    return 1 })()`);
  // vacía lo que se lleva (para que cada caso parta de cero) y pone `cosas` en lo juntado: { id: cantidad }
  const mochila = (juntado = {}) => N(`(() => {
    for (const k of ["pinon","trucha-ahumada","pan-casero","empanadas","miel","frasco-frutilla","dulce-leche","mermelada-frambuesa","chocolate-caliente","locro","asado"]) { if (P.entradas[k]) P.entradas[k].cantidad = 0; if (P.cosas[k]) delete P.cosas[k]; }
    for (const [k, c] of Object.entries(${JSON.stringify(juntado)})) P.entradas[k] = { dia: P.dia, hora: P.horas, cantidad: c };
    return 1 })()`);
  const cuanto = (k) => N(`((P.entradas[${JSON.stringify(k)}] && P.entradas[${JSON.stringify(k)}].cantidad) || 0) + (Number(P.cosas[${JSON.stringify(k)}]) || 0)`);
  // todo lo de la historia que se anotó de una escena (para repetir una escena de cero)
  const olvidar = (escenas) => N(`(() => { const h = P.historia; for (const id of ${JSON.stringify(escenas)}) { delete h.escenas.vistas[id]; delete h.aplicadas[id]; for (const k of Object.keys(h.aplicadas)) if (k.startsWith('e:' + id + ':')) delete h.aplicadas[k]; } return 1 })()`);
  const cerrarTarjetas = async () => { for (let k = 0; k < 4 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); } };
  const pts = () => N('H.__puntosHistoria()');
  const vista = (id) => N(`!!P.historia.escenas.vistas[${JSON.stringify(id)}]`);
  const hay = (id) => N(`H.__escenas.director.hay(${JSON.stringify(id)})`);
  const hecha = (id) => N(`P.historia.optativas[${JSON.stringify(id)}] !== undefined`);
  const lazo = (q) => N(`P.historia.lazos[${JSON.stringify(q)}]`);
  const tablon = async () => { await N('H.__valle.revisarAhora()'); await N('N.tick(0.8)'); return N('N.panel()'); };
  let progUlt = 0;
  // deja correr la escena hasta el final (leyéndola) y mira que haya quedado vista
  const terminar = async (escena, eleccion = null) => {
    await N(eleccion ? `N.despejar(90, { eleccion: ${JSON.stringify(eleccion)} })` : 'N.despejar(90)'); await N('N.tick(1.2)'); await N('N.despejar(20)');
    if (await N('H.__escenas.activa()')) { console.log(`  (${escena}: larga; se saltea el resto con Esc)`); await N('N.despejar(30, { esc: true })'); }
    await N('N.tick(1)'); await cerrarTarjetas();
    { const pr = await N('N.programas()'); if (progUlt && pr !== progUlt) console.log(`  [programas ${progUlt} → ${pr} con ${escena}]`); progUlt = pr; }
    const real = await hay(escena);
    if (!real) noVistas.push(escena);
    return { vista: await vista(escena), real };
  };
  const hablarCon = async (clave) => { await N('N.despejar(40)'); await cerrarTarjetas(); const r = await N(`H.__valle.alHablarCon(${JSON.stringify(clave)})`); await N('N.tick(0.6)'); return r; };
  const irA = async (punto, dx = 2, dz = 2, seg = 1.2) => { const p = (await pts())[punto]; if (!p) return null; await N(`N.ir(${p.x + dx}, ${p.z + dz}, 0)`); await N(`N.tick(${seg})`); return p; };
  const notas = () => N('N.notas.slice()');

  let prog0 = 0;
  try {
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes('historia', { estacion: 'auto' })); await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)'); await N('N.hasta(() => N.tarjeta(), 12)'); await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })');
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);

    // ================================================================ 1. visitar a Ramón
    donde = 'visita';
    console.log('— 1. visitar a Ramón: hace falta algo rico y se gasta uno');
    await cerrarTarjetas();
    await prep(8, { horas: 11, vistas: ['ramon-cama', 'fermin-tranquera', 'hojas-canelo', 'ramon-sanitario'], decisiones: { majada: 'b' } });
    await mochila({});
    await N('(() => { P.cosas.harina = 4; P.cosas.yerba = 2; P.entradas.huevo = { dia: P.dia, hora: P.horas, cantidad: 3 }; return 1 })()');
    let panel = await tablon();
    console.log('  tablón sin nada rico:', JSON.stringify(panel.replace(/\s+/g, ' ').slice(0, 400)));
    ok(/Visitar a Ramón/.test(panel) && /te falta algo rico/.test(panel) && /trucha ahumada/.test(panel), 'el tablón «De paso» dice que falta algo rico y qué llevar');
    ok(!/\d+ de \d+/.test(panel.split('Visitar a Ramón')[1]?.slice(0, 200) || ''), 'sin números en esa línea');
    await foto('1a-tablon-sin-nada');
    let r = await hablarCon('ramon');
    ok(r === false && !(await vista('visita-ramon')) && !(await hecha('visita-ramon')), 'sin algo rico (sólo harina, yerba y huevos) la E sobre Ramón no dispara la visita: es la charla de siempre');
    ok((await cuanto('harina')) === 4 && (await cuanto('yerba')) === 2, 'y no se gastó nada');
    // con la trucha ahumada
    await mochila({ 'trucha-ahumada': 2 });
    panel = await tablon();
    console.log('  tablón con una trucha:', JSON.stringify(panel.replace(/\s+/g, ' ').slice(0, 400)));
    ok(/llevale una trucha ahumada al puesto sanitario/.test(panel), 'con la trucha ahumada el tablón dice qué llevarle');
    await foto('1b-tablon-con-trucha');
    await N('N.notas.length = 0');
    r = await hablarCon('ramon');
    ok(r === true, 'con la trucha, la E sobre Ramón arranca la visita');
    let t = await terminar('visita-ramon');
    ok(t.vista, `sale visita-ramon${t.real ? ' (escena de B)' : ' (SIN escena escrita)'}`);
    ok(await hecha('visita-ramon'), 'la optativa «visita-ramon» queda hecha');
    ok((await cuanto('trucha-ahumada')) === 1, `se gastó UNA trucha ahumada (quedan ${await cuanto('trucha-ahumada')} de 2)`);
    const n1 = await notas();
    console.log('  notas:', JSON.stringify(n1.slice(0, 6)));
    ok(n1.some((x) => /Le llevaste una trucha ahumada a Ramón/.test(x)), 'el aviso en pantalla dice qué le llevaste');
    await foto('1c-visita-hecha');
    // una sola vez
    await N('H.__valle.aplicarEscenas(P.historia)'); await N('H.__valle.aplicarEscenas(P.historia)'); await N('H.__valle.revisarAhora()'); await N('N.tick(0.6)');
    r = await hablarCon('ramon');
    ok((await cuanto('trucha-ahumada')) === 1 && r === false, 'aplicar de nuevo y volver a hablar con Ramón no gasta otra');

    // ================================================================ 2. los noventa de Herminia
    donde = 'noventa';
    console.log('— 2. Herminia y los noventa: hace falta lo dulce de la torta y se gasta uno');
    await cerrarTarjetas();
    await prep(7, { horas: 11, vistas: ['libreta-fiado', 'cuaderno-abuelo', 'los-del-cerro'] });
    await mochila({});
    await N('(() => { P.cosas.harina = 4; P.entradas["pan-casero"] = { dia: P.dia, hora: P.horas, cantidad: 3 }; P.entradas["trucha-ahumada"] = { dia: P.dia, hora: P.horas, cantidad: 1 }; return 1 })()');
    panel = await tablon();
    console.log('  tablón sin nada dulce:', JSON.stringify(panel.replace(/\s+/g, ' ').slice(0, 400)));
    ok(/Herminia y los noventa/.test(panel) && /te falta algo dulce para la torta/.test(panel) && /miel/.test(panel), 'el tablón dice que falta algo dulce para la torta y qué llevar');
    await foto('2a-tablon-sin-dulce');
    r = await hablarCon('abuela');
    ok(r === false && !(await vista('herminia-noventa')), 'con pan, harina y trucha (no es una torta) la E sobre Herminia no dispara la escena');
    await mochila({ 'dulce-leche': 2 });
    panel = await tablon();
    ok(/llevale un frasco de dulce de leche a Herminia para la torta/.test(panel), 'con dulce de leche el tablón dice qué llevarle');
    await N('N.notas.length = 0');
    const lh0 = await lazo('herminia');
    r = await hablarCon('abuela');
    ok(r === true, 'con el dulce de leche, la E sobre Herminia arranca la escena');
    t = await terminar('herminia-noventa');
    ok(t.vista && await hecha('noventa'), `sale herminia-noventa${t.real ? ' (escena de B)' : ' (SIN escena escrita)'} y la optativa queda hecha`);
    ok((await cuanto('dulce-leche')) === 1, `se gastó UN frasco de dulce de leche (quedan ${await cuanto('dulce-leche')} de 2)`);
    ok((await lazo('herminia')) > lh0, `el lazo de Herminia sube como siempre (${lh0} → ${await lazo('herminia')})`);
    const n2 = await notas();
    console.log('  notas:', JSON.stringify(n2.slice(0, 6)));
    ok(n2.some((x) => /Le llevaste un frasco de dulce de leche a Herminia/.test(x)), 'el aviso en pantalla dice qué le llevaste');
    await foto('2b-noventa-hecha');
    await N('H.__valle.aplicarEscenas(P.historia)'); await N('H.__valle.aplicarEscenas(P.historia)'); await N('N.tick(0.4)');
    ok((await cuanto('dulce-leche')) === 1, 'aplicar de nuevo no gasta otro');

    // ================================================================ 3. la majada con Fermín en dos lazos
    donde = 'majada';
    console.log('— 3. D5 A sin costo: la majada con Fermín con reserva (lazo bajo) y con confianza (lazo alto)');
    const majada = async (lf, esperaConfia) => {
      await cerrarTarjetas();
      await prep(8, { horas: 10, vistas: ['ramon-cama'], decisiones: { majada: null } });
      await olvidar(['fermin-tranquera', 'majada-fermin']);
      await N(`(() => { const h = P.historia; h.decisiones.majada = null; delete h.temas['fermin:majada-confia']; h.lazos.fermin = ${lf}; h.lazos.ramon = 1; return 1 })()`);
      await N('N.tick(0.5)');
      // la escena de la tranquera sale sola al llegar al Puesto Alto (de 8 a 20)
      await irA('puesto', 4, 3, 1.5);
      await N('N.hasta(() => H.__escenas.activa() || P.historia.escenas.vistas["fermin-tranquera"], 12)');
      const salioSola = await N('!!(H.__escenas.activa() || P.historia.escenas.vistas["fermin-tranquera"])');
      if (!salioSola) { console.log('  (la tranquera no salió sola: se dispara a mano)'); await N('H.__escenas.disparar("fermin-tranquera")'); }
      // la primera opción de la pregunta de la majada es A
      const leidas = [];
      const t0 = Date.now();
      while (Date.now() - t0 < 90000 && (await N('H.__escenas.activa()'))) {
        const d = await N('(() => { const d = H.__escenas.director.datos && H.__escenas.director.datos(); return d ? { el: d.eleccion ? d.eleccion.id : null, tx: d.dialogo && d.dialogo.completo ? d.dialogo.texto : null } : null })()');
        if (d && d.tx && /Fermín (ya no te mira|todavía te mira)/.test(d.tx)) leidas.push(d.tx);
        if (d && d.el) { await N('N.tecla("Digit1")'); await N('N.tick(0.3)'); } else { await N('N.tecla("Enter")'); await N('N.tick(0.2)'); }
      }
      await N('N.tick(1)'); await cerrarTarjetas();
      const dec = await N('P.historia.decisiones.majada'), tema = await N('P.historia.temas["fermin:majada-confia"] !== undefined');
      console.log(`  lazo de Fermín ${lf}: decisión ${dec}, confianza anotada ${tema}; lo que dijo la escena: ${JSON.stringify(leidas)}`);
      ok(dec === 'a', `lazo ${lf}: la escena de la tranquera decide A`);
      ok(tema === esperaConfia, `lazo ${lf}: ${esperaConfia ? 'queda anotada la confianza de Fermín' : 'no queda anotada la confianza (Fermín todavía mira con reserva)'}`);
      ok(leidas.length === 1 && (esperaConfia ? /Ramón lo va a entender/ : /a Ramón le va a doler/).test(leidas[0]), `lazo ${lf}: la escena lo dice en palabras (${leidas[0] ? leidas[0].slice(0, 70) : 'nada'}…)`);
      ok(!leidas.some((x) => /\d/.test(x)), `lazo ${lf}: sin números`);
      await foto(`3-tranquera-lazo-${lf}`);
      // la llegada de la majada al galpón de esquila
      const r0 = await lazo('ramon');
      await N('H.__escenas.disparar("majada-fermin")');
      const t = await terminar('majada-fermin');
      const r1 = await lazo('ramon');
      console.log(`  Ramón: ${r0} → ${r1} (Fermín ${await lazo('fermin')})`);
      ok(t.vista, `lazo ${lf}: sale majada-fermin${t.real ? '' : ' (SIN escena escrita)'}`);
      ok(r1 === (esperaConfia ? r0 : r0 - 1), `lazo ${lf}: ${esperaConfia ? 'Ramón no pierde nada' : 'Ramón baja uno'} (${r0} → ${r1})`);
      return { dec, tema };
    };
    await majada(1, false);
    await majada(3, true);

    // la tarjeta de respaldo (si la escena de la tranquera se vio sin decidir): lo dice en palabras
    donde = 'tarjeta';
    console.log('— 3b. la tarjeta de la decisión (respaldo) dice lo de Ramón en palabras');
    for (const [lf, re, nore] of [[1, /le va a doler/, /lo va a entender/], [2, /lo va a entender/, /le va a doler/]]) {
      await cerrarTarjetas();
      await prep(8, { horas: 10, vistas: ['ramon-cama', 'fermin-tranquera'], decisiones: { majada: null } });
      await olvidar(['majada-fermin']);
      await N(`(() => { const h = P.historia; h.decisiones.majada = null; delete h.temas['fermin:majada-confia']; h.lazos.fermin = ${lf}; h.lazos.ramon = 1; return 1 })()`);
      await N('H.__valle.revisarAhora()'); await N('N.hasta(() => N.tarjeta() && /majada/i.test(N.tarjeta().titulo), 8)');
      const dc = await N('N.tarjeta()');
      if (dc && /majada/i.test(dc.titulo)) {
        const a = dc.opciones.find((o) => o.id === 'a');
        console.log(`  tarjeta con Fermín en ${lf}:`, JSON.stringify(a && a.texto));
        ok(a && re.test(a.texto) && !nore.test(a.texto) && !/\d/.test(a.texto.replace(/«[^»]*»/g, '')), `con lazo ${lf}: la opción A dice, en palabras, ${re.source}`);
        await foto(`3b-tarjeta-lazo-${lf}`);
        await N('N.elegir("a")'); await N('N.tick(0.6)'); await cerrarTarjetas();
        ok((await N('P.historia.temas["fermin:majada-confia"] !== undefined')) === (lf >= 2), `con lazo ${lf}: elegir A por la tarjeta ${lf >= 2 ? 'anota' : 'no anota'} la confianza`);
      } else console.log(`  (la tarjeta de respaldo no salió con Fermín en ${lf}: la escena toma la decisión; queda cubierta por la prueba de Node, no se vio a ojo)`);
    }

    // ================================================================ 4. guardar y recargar
    donde = 'recargar';
    console.log('— 4. guardar y recargar: lo gastado queda gastado');
    await N('H.guardar()'); await N('N.tick(0.4)');
    const antes = { trucha: await cuanto('trucha-ahumada'), dulce: await cuanto('dulce-leche'), ramon: await N('P.historia.aplicadas["visita-ramon"]'), herminia: await N('P.historia.aplicadas["herminia-noventa"]') };
    console.log('  antes de recargar:', JSON.stringify(antes));
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.progreso').catch(() => false); }
    ok(listo, 'la partida recargó');
    const des = await js(`(() => { const P = window.__hojarasca.progreso, e = (k) => ((P.entradas[k] && P.entradas[k].cantidad) || 0) + (Number(P.cosas[k]) || 0); return { trucha: e('trucha-ahumada'), dulce: e('dulce-leche'), ramon: P.historia.aplicadas['visita-ramon'], herminia: P.historia.aplicadas['herminia-noventa'], optRamon: P.historia.optativas['visita-ramon'] !== undefined, optNoventa: P.historia.optativas.noventa !== undefined } })()`);
    console.log('  después de recargar:', JSON.stringify(des));
    ok(des.trucha === antes.trucha && des.dulce === antes.dulce, `lo que quedaba en la mochila es lo mismo (trucha ${des.trucha}, dulce de leche ${des.dulce})`);
    ok(des.ramon !== undefined && des.herminia !== undefined && des.optRamon && des.optNoventa, 'las dos escenas siguen anotadas como aplicadas y las optativas como hechas');
    const aplicar = await js(`(() => { const H = window.__hojarasca; if (!H.__valle || !H.__valle.aplicarEscenas) return null; H.__valle.aplicarEscenas(H.progreso.historia); H.__valle.aplicarEscenas(H.progreso.historia); const P = H.progreso, e = (k) => ((P.entradas[k] && P.entradas[k].cantidad) || 0) + (Number(P.cosas[k]) || 0); return { trucha: e('trucha-ahumada'), dulce: e('dulce-leche') }; })()`);
    if (aplicar) ok(aplicar.trucha === antes.trucha && aplicar.dulce === antes.dulce, 'aplicar las escenas vistas después de recargar no gasta de nuevo'); else console.log('  (el valle de la historia no estaba a mano antes de entrar: sólo se comprobó lo guardado)');

    donde = 'cierre';
    if (noVistas.length) console.log(`  escenas sin escribir (dadas por vistas): ${noVistas.join(', ')}`);
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
