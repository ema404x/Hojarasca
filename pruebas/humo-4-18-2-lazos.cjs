// Partida real 4.18.2 (Electron + WebGL): el lazo de los siete vecinos que no lo tenían (Rosa, Tito, Tobías, Nicanor, Belisario, Herminia y Sofía).
// Se hace una escena de verdad de cada uno (la de Sofía, por la E sobre ella: disparador, escena y optativa «La foto del valle»), se mira que el lazo
// se guarde y cuente una sola vez, que la guía los muestre en palabras (nunca números), la charla de después de Tito, la tarjeta de decisión del coihue
// (si sale) y el final con las líneas de los vecinos de la casa; y que no se sume ningún programa de shader.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-18-2-lazos.cjs -Espera 2700 -Perfil <carpeta propia> -Visible
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'lazos-4-18-2'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 25 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 25 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';
const SOLO = (process.env.HUMO_SOLO || '').split(',').filter(Boolean);
const toca = (n) => !SOLO.length || SOLO.includes(String(n));

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
  // lee las escenas (Enter) contestando la primera opción de cada pregunta; o.esc: saltearlas con Esc
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
  N.levantar = (id, lugares) => {
    const O = H.obras;
    Object.assign(P.materiales, { tronco: 80, tabla: 80, piedra: 80 });
    const p = H.PLANOS.find((q) => q.id === id); if (!p) return { error: 'no hay plano ' + id };
    for (const [x, z, yaw] of lugares) {
      O.elegir(p); const r = O.fundar(x, z, yaw, T.altura(x, z)); if (!r.ok) continue;
      for (let g = 0; g < 14 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const k = O.avanzar(r.obra, P.materiales); if (!k.ok) break; }
      O.elegir(null); P.obras = O.obras.map((o) => o.datos);
      return { ok: r.obra.datos.etapas >= r.obra.plano.etapas.length, x: r.obra.datos.x, z: r.obra.datos.z };
    }
    O.elegir(null); return { error: 'no hubo lugar para ' + id };
  };
  N.alrededor = (x, z, radios, pasos = 12) => { const l = []; for (const r of radios) for (let i = 0; i < pasos; i++) { const a = (i / pasos) * Math.PI * 2; l.push([x + Math.cos(a) * r, z + Math.sin(a) * r, a]); } return l; };
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
  const cerrarTarjetas = async () => { for (let k = 0; k < 4 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); } };
  const pts = () => N('H.__puntosHistoria()');
  const vista = (id) => N(`!!P.historia.escenas.vistas[${JSON.stringify(id)}]`);
  const hay = (id) => N(`H.__escenas.director.hay(${JSON.stringify(id)})`);
  const hecha = (id) => N(`P.historia.optativas[${JSON.stringify(id)}] !== undefined`);
  // una escena: que salga, que sea la de B (o se diga que faltaba) y que la optativa quede hecha
  let progUlt = 0;
  const comprobar = async (escena, optativa, que) => {
    await N('N.despejar(90)'); await N('N.tick(1.2)'); await N('N.despejar(20)'); if (await N('H.__escenas.activa()')) { console.log(`  (${escena}: larga; se saltea el resto con Esc)`); await N('N.despejar(30, { esc: true })'); } await N('N.tick(0.8)');
    { const pr = await N('N.programas()'); if (progUlt && pr !== progUlt) console.log(`  [programas ${progUlt} → ${pr} con ${escena}]`); progUlt = pr; }
    const v = await vista(escena), real = await hay(escena);
    if (!real) noVistas.push(escena);
    if (!v) console.log('  [diag]', JSON.stringify(await N('({ activa: H.__escenas.activa(), fase: H.__escenas.director.fase(), tarjeta: N.tarjeta() && N.tarjeta().titulo, cap: P.historia.capitulo, fasH: P.historia.fase, horas: P.horas, libre: !document.getElementById("charla") || document.getElementById("charla").classList.contains("oculto") })')));
    ok(v, `${que}: sale ${escena}${real ? ' (escena de B)' : ' (SIN escena escrita: se dio por vista)'}`);
    if (optativa) ok(await hecha(optativa), `${que}: la optativa «${optativa}» queda hecha`);
  };
  const hablarCon = async (clave) => { await N('N.despejar(40)'); await cerrarTarjetas(); const r = await N(`H.__valle.alHablarCon(${JSON.stringify(clave)})`); if (!r) console.log(`  [hablar ${clave}] no arrancó escena`, JSON.stringify(await N('({ activa: H.__escenas.activa(), tarjeta: N.tarjeta() && N.tarjeta().titulo, fase: P.historia.fase, cap: P.historia.capitulo })'))); await N('N.tick(0.6)'); return r; };
  const irA = async (punto, dx = 2, dz = 2, seg = 1.2) => { const p = (await pts())[punto]; if (!p) return null; await N(`N.ir(${p.x + dx}, ${p.z + dz}, 0)`); await N(`N.tick(${seg})`); return p; };
  const pararCerca = (id, d = 1.4) => N(`(() => { const o = H.__historiaObjetos(), q = o.posiciones[${JSON.stringify(id)}]; if (!q) return 0; const j = H.jugador.estado; const a = Math.atan2(j.pos.x - q.x, j.pos.z - q.z) || 0; N.ir(q.x + Math.sin(a) * ${d}, q.z + Math.cos(a) * ${d}, a); H.jugador.estado.pitch = -0.28; return 1 })()`);
  const eCerca = async (id) => { await N('N.tick(0.6)'); await pararCerca(id); await N('N.tick(0.7)'); const a = await N('(() => { const c = H.__objetoHistoriaCerca(); return c ? { id: c.id, aviso: c.aviso } : null })()'); await N('N.tecla("KeyE")'); await N('N.tick(0.6)');
    // (si la E la tomó un vecino que pasaba —la E habla antes que los objetos—, se cierra la charla y se usa el objeto)
    if (a && a.id === id && !(await N('H.__escenas.activa()')) && (await N('!document.getElementById("charla").classList.contains("oculto")'))) {
      console.log(`  (la E de ${id} la tomó un vecino que pasaba: se usa el objeto)`);
      await N('N.tecla("Escape")'); await N('N.tick(0.5)'); await pararCerca(id); await N('N.tick(0.5)');
      await N(`(() => { const c = H.__objetoHistoriaCerca(); if (c && c.id === ${JSON.stringify(id)}) c.hacer(); return 1 })()`); await N('N.tick(0.6)');
    }
    return a; };

  const VECINOS = ['rosa', 'tobias', 'tito', 'belisario', 'herminia', 'nicanor', 'sofia'];
  const lazos = () => N('({ ...P.historia.lazos })');
  const palabrasLazo = /de la casa|de confianza|conocido|tirante|frío/;
  let TL = null;
  try { TL = await import(require('url').pathToFileURL(path.join(raiz, 'src', 'historia-texto-lazos.js')).href); } catch (e) { console.log('  (no se pudo leer historia-texto-lazos.js:', e.message, ')'); }
  try {
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes('historia', { estacion: 'auto' })); await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)'); await N('N.hasta(() => N.tarjeta(), 12)'); await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })');
    const prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);
    const l0 = await lazos();
    ok(Object.keys(l0).length === 13 && Object.values(l0).every((v) => v === 0), `una partida nueva trae los trece lazos en cero (${Object.keys(l0).length})`);
    ok(await N('H.__escenas.director.hay("foto-valle")'), 'la escena de Sofía (foto-valle) está registrada en el director');

    // ================================================================ 1. una escena de cada vecino
    donde = 'escenas';
    console.log('— 1. una escena de cada vecino y el lazo que queda');
    const escena = async (id, quien, minimo, cap, o = {}, eleccion = null) => {
      await cerrarTarjetas();
      await prep(cap, o);
      await N('N.tick(0.6)');
      const antes = (await lazos())[quien];
      const real = await hay(id);
      if (!real) noVistas.push(id);
      const sale = await N(`H.__escenas.disparar(${JSON.stringify(id)})`);
      await N(eleccion ? `N.despejar(90, { eleccion: ${JSON.stringify(eleccion)} })` : 'N.despejar(90)'); await N('N.tick(1.2)'); await N('N.despejar(20)'); if (await N('H.__escenas.activa()')) { console.log(`  (${id}: larga; se saltea el resto con Esc)`); await N('N.despejar(30, { esc: true })'); } await N('N.tick(0.8)');
      await cerrarTarjetas();
      const v = await vista(id);
      const despues = (await lazos())[quien];
      console.log(`  ${id}: ${real ? 'escena escrita' : 'SIN ESCENA ESCRITA'}, salió=${sale}, vista=${v}, lazo de ${quien}: ${antes} → ${despues}`);
      ok(real && v && despues >= Math.min(3, antes + minimo), `${id}: el lazo de ${quien} sube (${antes} → ${despues})`);
      return despues;
    };
    await escena('frasco-rosa', 'rosa', 1, 1, { horas: 11, vistas: ['nota-eusebio', 'frasco-repisa', 'ramon-tranquera'], temas: ['obj:frasco-masa-madre'] });
    await escena('coihue-talado', 'tito', 2, 4, { horas: 11, decisiones: { coihue: 'b' }, vistas: ['piedras-molino', 'tito-coihue'] });
    await escena('tobias-pirca', 'tobias', 2, 4, { horas: 11, decisiones: { coihue: 'c' }, vistas: ['piedras-molino', 'tito-coihue'] });
    await escena('truchas-nicanor', 'nicanor', 1, 4, { horas: 11, vistas: ['piedras-molino'] });
    await escena('los-del-cerro', 'belisario', 1, 7, { horas: 11 }, { 'cerro-resp': 'Digit3' });   // (la opción «Gracias por contarme» es la que da el lazo)
    await escena('herminia-noventa', 'herminia', 2, 7, { horas: 11 });
    // Sofía: por la E sobre ella, con ella viviendo en la aldea (el disparador de verdad)
    await cerrarTarjetas(); await prep(6, { horas: 11, vistas: [] });
    await N('(() => { if (!P.aldea.pobladores.some((x) => x.clave === "fotografa")) P.aldea.pobladores.push({ clave: "fotografa" }); return 1 })()'); await N('N.tick(1)');
    const panelS = await N('N.panel()');
    ok(/foto del valle/i.test(panelS), `el tablón «De paso» ofrece la foto del valle («${panelS.replace(/\s+/g, ' ').slice(0, 140)}»)`);
    await foto('1-tablon-sofia');
    await hablarCon('fotografa');
    await comprobar('foto-valle', 'foto-valle', 'la foto del valle con Sofía');
    const ls = (await lazos()).sofia;
    ok(ls === 1 || ls === 2, `Sofía queda con lazo ${ls} (la escena da 2 o 1, nunca los dos)`);
    await foto('1-foto-valle-hecha');
    const l1 = await lazos();
    console.log('  lazos:', JSON.stringify(Object.fromEntries(VECINOS.map((k) => [k, l1[k]]))));
    ok(VECINOS.every((k) => l1[k] > 0), 'los siete tienen lazo');
    ok(['fermin', 'guarda', 'graciela'].every((k) => l1[k] === l0[k]), 'Fermín, Elsa y Graciela no se movieron');

    // ================================================================ 2. una sola vez
    donde = 'una vez';
    console.log('— 2. una sola vez');
    await N('H.__valle.aplicarEscenas(P.historia)'); await N('H.__valle.aplicarEscenas(P.historia)'); await N('H.__valle.revisarAhora()'); await N('N.tick(1)');
    const l2 = await lazos();
    ok(VECINOS.every((k) => l2[k] === l1[k]), 'aplicar las escenas vistas otra vez no cuenta doble');

    // ================================================================ 3. la guía
    donde = 'guía';
    console.log('— 3. «con quién tenés lazo» en la guía, en palabras');
    await N('(() => { const g = document.getElementById("guia"); if (g) { g.classList.add("oculto"); g.classList.remove("oculto"); } return 1 })()'); await N('N.tick(0.8)');
    const items = await N('[...document.querySelectorAll("#historia-guia ul.lazos li")].map((li) => li.textContent)');
    console.log('  guía:', JSON.stringify(items));
    for (const nombre of ['Rosa', 'Tito', 'Tobías', 'Belisario', 'Herminia', 'Nicanor', 'Sofía']) ok(items.some((t) => t.includes(nombre)), `la guía nombra a ${nombre}`);
    ok(items.length >= 7 && items.every((t) => palabrasLazo.test(t)) && items.every((t) => !/\d/.test(t)), 'cada línea trae una palabra de lazo y ningún número');
    if (TL && TL.TEXTO_LAZOS && TL.TEXTO_LAZOS.guia && TL.TEXTO_LAZOS.guia.tito && TL.TEXTO_LAZOS.guia.tito.rol) {
      const rol = TL.TEXTO_LAZOS.guia.tito.rol;
      ok(items.some((t) => t.includes('Tito') && t.includes(rol)), `Tito sale con su oficio («${rol}»)`);
    }
    await N('(() => { document.getElementById("guia").classList.remove("oculto"); return 1 })()');
    await foto('3-guia');
    await N('(() => { document.getElementById("guia").classList.add("oculto"); return 1 })()');

    // ================================================================ 4. la charla de después
    donde = 'charla';
    console.log('— 4. la charla de después de Tito con lazo de la casa');
    await cerrarTarjetas();
    await prep(4, { horas: 11, decisiones: { coihue: 'b' } });
    await N('(() => { P.historia.lazos.tito = 3; return 1 })()'); await N('N.tick(0.5)');
    const esperadas = TL && TL.TEXTO_LAZOS ? (TL.TEXTO_LAZOS.charlas.tito || []).filter((l) => l.cuando && l.cuando.lazo && Number.isFinite(l.cuando.lazo.min) && l.cap <= 5).map((l) => l.texto) : [];
    const dichas = [];
    for (let k = 0; k < 8; k++) { const t = await N('H.__valle.lineaDeHistoria("carpintero")'); if (t) dichas.push(t); else break; }
    console.log(`  Tito dijo ${dichas.length} líneas de historia`);
    ok(dichas.length >= 1, 'Tito tiene una línea de historia con lazo de la casa');
    if (esperadas.length) ok(esperadas.some((e) => dichas.includes(e)), 'y entre ellas la nueva de B (la de lazo bueno)');
    ok((await N('H.__valle.lineaDeHistoria("carpintero")')) === null, 'cada línea se dice una sola vez');

    // ================================================================ 5. la tarjeta de decisión del coihue
    donde = 'decisión';
    console.log('— 5. la tarjeta de decisión del coihue nombra a Tito y a Tobías en palabras (si sale)');
    await cerrarTarjetas();
    await prep(4, { horas: 11, vistas: ['piedras-molino', 'tito-coihue'] });
    await N('(() => { P.historia.decisiones.coihue = null; return 1 })()');
    await N('H.__valle.revisarAhora()'); await N('N.hasta(() => N.tarjeta() && /coihue/i.test(N.tarjeta().titulo), 8)');
    const dc = await N('N.tarjeta()');
    if (dc && /coihue/i.test(dc.titulo)) {
      console.log('  tarjeta:', JSON.stringify(dc.opciones));
      ok(/Tito te va a tener más confianza/.test(JSON.stringify(dc.opciones)) && /Tobías te va a tener más confianza/.test(JSON.stringify(dc.opciones)), 'las opciones de talar y de la pirca dicen cómo queda Tito y Tobías');
      await foto('5-decision-coihue');
      await N('N.elegir("a")'); await N('N.tick(0.6)'); await cerrarTarjetas();
    } else console.log('  (la tarjeta de respaldo no salió: la escena toma la decisión; queda cubierta por la prueba de Node, no se vio a ojo)');

    // ================================================================ 6. el final
    donde = 'final';
    console.log('— 6. el final con las líneas de los vecinos de la casa');
    await cerrarTarjetas();
    await prep(12, { fase: 'outro', horas: 18, duendes: { trato: 'trato', noche: 'ganada', final: 'trato' } });
    await N('(() => { for (const k of ["rosa","tobias","tito","belisario","herminia","nicanor","sofia"]) P.historia.lazos[k] = 3; return 1 })()');
    await N('H.__valle.mostrarFinal()'); await N('N.tick(1)');
    const tf = await N('N.tarjeta()');
    ok(tf && /El trato/.test(tf.titulo), `sale la tarjeta final (${tf && tf.titulo})`);
    if (TL && tf && TL.finalDeLazos) {
      const lineas = TL.finalDeLazos(() => 3);
      console.log(`  líneas de vecinos esperadas: ${lineas.length}`);
      ok(lineas.length >= 1 && lineas.every((t) => tf.texto.includes(t)), 'el final trae las líneas de los vecinos de la casa');
    }
    await foto('6-final');
    await N('N.elegir("seguir")'); await N('N.tick(0.8)'); await cerrarTarjetas();

    // ================================================================ 7. shaders
    donde = 'cierre';
    if (noVistas.length) console.log(`  escenas sin escribir (dadas por vistas): ${noVistas.join(', ')}`);
    const prog = await N('N.programas()');
    ok(prog <= prog0 + 1, `programas de shader: ${prog0} → ${prog} (la base es 111; esta versión no suma ninguno)`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
