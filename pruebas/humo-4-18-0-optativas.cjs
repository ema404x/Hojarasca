// Partida real 4.18.0 (Electron + WebGL): las subtramas optativas de la Historia, cada una al menos una vez, con las escenas reales de B (si
// están; si no, la mecánica las da por vistas y el humo lo dice). Acto I: el frasco de la repisa a Rosa, la oveja de Ramón (el evento, la oveja
// que te sigue hasta el Puesto Alto), el pan para Fermín, la vuelta con Graciela (mirador y faro). Acto II: las de los vecinos (trigo, tablas,
// truchas, masa, foto, Fermín, veta, mulas, noventa) y las de encargos y concurso. Acto III: el papel de Elsa, visitar a Ramón, juntar las
// ovejas desparramadas, la trochita en la nieve, la llave del 79, pedir perdón, flechas de más, el cumpleaños, la pareja, volver a subir; y lo
// que no tenía disparador: abrir el galpón sin golpear, las plumas del gallinero y la costumbre del trato. El tablón, la guía, la charla de
// historia, el +1 de los encargos y 0 programas de shader nuevos.
// Uso (después de `node armar.mjs`): powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-18-0-optativas.cjs -Espera 1800 -Perfil <carpeta propia> -Visible
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'optativas-4-18-0'));
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
  const comprobar = async (escena, optativa, que) => {
    await N('N.despejar(90)'); await N('N.tick(1.2)'); await N('N.despejar(20)'); await N('N.tick(0.8)');
    const v = await vista(escena), real = await hay(escena);
    if (!real) noVistas.push(escena);
    ok(v, `${que}: sale ${escena}${real ? ' (escena de B)' : ' (SIN escena escrita: se dio por vista)'}`);
    if (optativa) ok(await hecha(optativa), `${que}: la optativa «${optativa}» queda hecha`);
  };
  const hablarCon = async (clave) => { const r = await N(`H.__valle.alHablarCon(${JSON.stringify(clave)})`); await N('N.tick(0.6)'); return r; };
  const irA = async (punto, dx = 2, dz = 2, seg = 1.2) => { const p = (await pts())[punto]; if (!p) return null; await N(`N.ir(${p.x + dx}, ${p.z + dz}, 0)`); await N(`N.tick(${seg})`); return p; };
  const pararCerca = (id, d = 1.4) => N(`(() => { const o = H.__historiaObjetos(), q = o.posiciones[${JSON.stringify(id)}]; if (!q) return 0; const j = H.jugador.estado; const a = Math.atan2(j.pos.x - q.x, j.pos.z - q.z) || 0; N.ir(q.x + Math.sin(a) * ${d}, q.z + Math.cos(a) * ${d}, a); H.jugador.estado.pitch = -0.28; return 1 })()`);
  const eCerca = async (id) => { await N('N.tick(0.6)'); await pararCerca(id); await N('N.tick(0.7)'); const a = await N('(() => { const c = H.__objetoHistoriaCerca(); return c ? { id: c.id, aviso: c.aviso } : null })()'); await N('N.tecla("KeyE")'); await N('N.tick(0.6)'); return a; };

  try {
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes('historia', { estacion: 'auto' })); await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)'); await N('N.hasta(() => N.tarjeta(), 12)'); await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })');
    const prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);
    // las escenas de B registradas
    const deB = await N('(() => { const ids = ["frasco-repisa","frasco-rosa","oveja-ramon","pan-fermin","vuelta-mirador","vuelta-faro","juntar-ovejas"]; return ids.filter((i) => H.__escenas.director.hay(i)) })()');
    console.log(`  escenas de B registradas: ${deB.length} de 7 (${deB.join(', ')})`);

    // ================================================================ 1. acto I
    if (toca(1)) {
      donde = 'acto I';
      console.log('— 1. acto I: el frasco, la oveja de Ramón, el pan para Fermín, la vuelta con Graciela');
      // el frasco: la E en la repisa y la E sobre Rosa
      await cerrarTarjetas();
      await prep(0, { horas: 15, vistas: ['trochita-boleto', 'estacion-llegada', 'nota-eusebio'] });
      await N('(() => { if (!P.aldea.pobladores.some((x) => x.clave === "panadera")) P.aldea.pobladores.push({ clave: "panadera" }); return 1 })()');
      await N('N.tick(1)');
      const panel1 = await N('N.panel()');
      ok(/De paso/.test(panel1) && /frasco/i.test(panel1), `el tablón muestra el frasco ofrecido («${panel1.slice(0, 120)}…»)`);
      await foto('1a-tablon-frasco');
      const a = await eCerca('frasco-repisa');
      ok(a && /frasco/i.test(a.aviso), `la E en la repisa: «${a && a.aviso}»`);
      await comprobar('frasco-repisa', null, 'el frasco a la mochila');
      ok(await N('!!(P.historia.temas["obj:frasco-masa-madre"] || P.historia.objetos["frasco-masa-madre"])'), 'el frasco está en la mochila');
      await prep(1, { horas: 11, vistas: ['nota-eusebio', 'frasco-repisa'], temas: ['obj:frasco-masa-madre'] });
      await N('N.tick(0.8)');
      await hablarCon('panadera');
      await comprobar('frasco-rosa', 'frasco-masa-madre', 'el frasco a Rosa');
      ok(await N('P.historia.panRosa && P.historia.panRosa.quedan === 3'), 'Rosa va a dejar pan tres mañanas');
      const pan0 = await N('P.cosas["pan-casero"] || 0');
      await N('(() => { P.dia += 1; P.horas = 8; return 1 })()'); await N('H.__valle.revisarAhora()'); await N('N.tick(1)');
      ok((await N('P.cosas["pan-casero"] || 0')) === pan0 + 1, 'a la mañana siguiente, un pan de Rosa');
      const linea = await N('H.__valle.lineaDeHistoria("panadera")');
      ok(typeof linea === 'string' && linea.length > 10, `Rosa tiene una línea de historia después: «${linea}»`);
      // la oveja de Ramón: la historia ofrece el evento, «Arrearla vos», la oveja sigue hasta el puesto
      await cerrarTarjetas();
      await prep(1, { horas: 10, vistas: ['ramon-tranquera'] });
      await N('(() => { delete P.eventosValle.hechos.oveja; P.eventosValle.activo = null; return 1 })()');
      await N('H.__valle.revisarAhora()'); await N('N.tick(1)');
      await N('N.hasta(() => N.tarjeta() && /oveja/i.test(N.tarjeta().titulo), 10)');
      const tv = await N('N.tarjeta()');
      ok(tv && /oveja/i.test(tv.titulo), `la historia ofrece «${tv && tv.titulo}» en el capítulo 2`);
      await foto('1b-evento-oveja');
      await N('N.elegir("buscar")'); await N('N.tick(1)'); await cerrarTarjetas();
      await N('N.hasta(() => H.__arreo() && H.__arreo().activo() && H.__arreo().clave === "opt-oveja", 10)');
      ok(await N('!!(H.__arreo() && H.__arreo().activo() && H.__arreo().clave === "opt-oveja")'), 'aparece la oveja escapada');
      const ov = await N('(() => { const o = H.__arreo().estado.ovejas[0]; return { x: o.x, z: o.z } })()');
      const pu = (await pts()).puesto;
      await N(`N.ir(${ov.x + 2}, ${ov.z + 2}, 0)`); await N('N.tick(1.5)');
      await foto('1c-oveja-escapada');
      const pasos = Math.ceil(Math.hypot(pu.x - ov.x, pu.z - ov.z) / 3);
      for (let i = 1; i <= pasos + 8 && !(await N('P.historia.temas["arreo:oveja-ramon"] !== undefined')); i++) {
        const k = Math.min(1, i / pasos), x = ov.x + (pu.x + 7 - ov.x) * k, z = ov.z + (pu.z + 4 - ov.z) * k;
        await N(`N.ir(${x}, ${z}, Math.atan2(${-(pu.x - ov.x)}, ${-(pu.z - ov.z)}))`); await N('N.tick(0.9)');
      }
      ok(await N('P.historia.temas["arreo:oveja-ramon"] !== undefined'), 'la oveja llegó al Puesto Alto');
      await comprobar('oveja-ramon', 'oveja', 'la oveja de Ramón');
      // el pan para Fermín
      await cerrarTarjetas();
      await prep(2, { horas: 12, vistas: ['fermin-galpon'] });
      await N('(() => { P.cosas["pan-casero"] = 2; return 1 })()'); await N('N.tick(0.6)');
      await hablarCon('fermin');
      await comprobar('pan-fermin', 'fermin-pan', 'el pan para Fermín');
      ok((await N('P.cosas["pan-casero"] || 0')) <= 1, 'se gastó lo que le diste');
      // la vuelta con Graciela: el mirador y el faro
      await cerrarTarjetas();
      await prep(3, { horas: 12, vistas: ['anden-graciela'], acompanante: 'graciela' });
      const g0 = await N('({ l: P.historia.lazos.graciela, r: P.historia.ramal })');
      await irA('mirador', 3, 3, 1.5); await N('N.hasta(() => H.__escenas.activa() || P.historia.escenas.vistas["vuelta-mirador"], 10)');
      await foto('1d-vuelta-mirador');
      await comprobar('vuelta-mirador', null, 'la vuelta: el mirador');
      await N('(() => { P.historia.acompanante = "graciela"; return 1 })()');
      await irA('faro', 6, 6, 1.5); await N('N.hasta(() => H.__escenas.activa() || P.historia.escenas.vistas["vuelta-faro"], 10)');
      await comprobar('vuelta-faro', 'vuelta-ingeniera', 'la vuelta: el faro');
      const g1 = await N('({ l: P.historia.lazos.graciela, r: P.historia.ramal })');
      ok(g1.l === Math.min(3, g0.l + 2) && g1.r === g0.r + 2, `Graciela +2 y ramal +2 (${g0.l}→${g1.l}, ${g0.r}→${g1.r})`);
    }

    // ================================================================ 2. acto II
    if (toca(2)) {
      donde = 'acto II';
      console.log('— 2. acto II: las de los vecinos, los encargos y el concurso');
      const casos = [
        [4, { decisiones: { bolsa: 'c' }, vistas: ['piedras-molino'] }, 'ema', 'trigo-abuelo', 'trigo-abuelo'],
        [4, { decisiones: { coihue: 'b' }, vistas: ['piedras-molino'], cosas: { 'tabla-coihue': 12 } }, 'carpintero', 'tablas-tito', 'tablas-tito'],
        [4, { vistas: ['piedras-molino'] }, 'nicanor', 'truchas-nicanor', 'truchas'],
        [5, { decisiones: { bolsa: 'b' }, vistas: ['luces-lago-nicanor'] }, 'panadera', 'masa-crece', 'masa-crece'],
        [5, { temas: ['obj:foto-movida'], horas: 11 }, 'fotografa', 'foto-sofia', 'foto-sofia'],
        [6, { vistas: ['minga-aldea'] }, 'fermin', 'fermin-mulas', 'fermin-habla'],
        [7, { decisiones: { coihue: 'c' }, horas: 21, vistas: ['libreta-fiado', 'cuaderno-abuelo', 'los-del-cerro', 'secreto-ramon'] }, 'tobias', 'veta-vuelve', 'veta-vuelve'],
        [7, { vistas: ['los-del-cerro'] }, 'belisario', 'mulas-belisario', 'mulas'],
        [7, { vistas: ['libreta-fiado', 'cuaderno-abuelo', 'los-del-cerro'] }, 'abuela', 'herminia-noventa', 'noventa'],
      ];
      for (const [cap, o, clave, escena, opt] of casos) {
        await cerrarTarjetas();
        await prep(cap, o);
        if (o.cosas) await N(`(() => { Object.assign(P.cosas, ${JSON.stringify(o.cosas)}); return 1 })()`);
        await N('N.tick(0.6)');
        const pesos0 = await N('(P.economia && P.economia.pesos) || 0');
        const cantos0 = await N('(P.entradas.canto && P.entradas.canto.cantidad) || 0');
        await hablarCon(clave);
        await comprobar(escena, opt, opt);
        if (opt === 'tablas-tito') ok((await N('(P.economia && P.economia.pesos) || 0')) > pesos0 && (await N('P.cosas["tabla-coihue"]')) === 6, 'Tito pagó las seis tablas');
        if (opt === 'veta-vuelve') ok((await N('(P.entradas.canto && P.entradas.canto.cantidad) || 0')) === cantos0 + 10, 'diez cantos blancos');
      }
      // los encargos, la pesca y el concurso
      await cerrarTarjetas();
      await prep(6, { horas: 12 });
      await N('(() => { P.encargos["e-pesca"] = "hecho"; P.concursos = P.concursos || {}; P.concursos.cintas = [...(P.concursos.cintas || []), { id: "dulce", dia: P.dia, puesto: 1, cinta: "azul", que: "dulce" }]; return 1 })()');
      const e0 = await N('P.historia.lazos.ercilia');
      await N('H.__valle.revisarAhora()'); await N('N.tick(1)');
      ok(await hecha('tres-de-tres') && await hecha('concurso'), 'tres de tres y el concurso del dulce, hechas');
      ok((await N('P.historia.lazos.ercilia')) === Math.min(3, e0 + 1), 'la cinta del dulce: Ercilia +1');
      // un encargo de un vecino con arco: +1 al lazo
      await prep(1, { horas: 12 });
      await N('(() => { P.encargos["e-banco"] = "pedido"; return 1 })()'); await N('H.__valle.revisarAhora()'); await N('N.tick(0.6)');
      const r0 = await N('P.historia.lazos.ramon');
      await N('(() => { P.encargos["e-banco"] = "hecho"; return 1 })()'); await N('H.__valle.revisarAhora()'); await N('N.tick(0.8)');
      ok((await N('P.historia.lazos.ramon')) === Math.min(3, r0 + 1) && await hecha('banco-primero'), 'el banco primero: Ramón +1 y la optativa hecha');
      await N('(() => { P.encargos["e-vuelta"] = "hecho"; return 1 })()'); await prep(3, { horas: 12 }); await N('H.__valle.revisarAhora()'); await N('N.tick(0.8)');
      ok(await hecha('vuelta-completa'), 'la vuelta completa de Elsa');
      await prep(2, { horas: 12 }); await N('(() => { P.encargos["e-arboles"] = "pedido"; return 1 })()'); await N('H.__valle.revisarAhora()'); await N('N.tick(0.5)');
      ok(await hecha('encargo'), 'aceptar un encargo cuenta');
    }

    // ================================================================ 3. acto III
    if (toca(3)) {
      donde = 'acto III';
      console.log('— 3. acto III');
      await N('(() => { P.horas = 10; return 1 })()');
      // el papel de Elsa (auto, en la estación)
      await cerrarTarjetas();
      await prep(8, { horas: 10, vistas: ['ramon-cama', 'fermin-tranquera', 'hojas-canelo', 'ramon-sanitario'], decisiones: { majada: 'b' } });
      await irA('estacion', 3, 3, 1.5); await N('N.hasta(() => H.__escenas.activa() || P.historia.escenas.vistas["papel-elsa"], 10)');
      await comprobar('papel-elsa', 'papel-elsa', 'el papel de Elsa');
      await hablarCon('ramon');
      await comprobar('visita-ramon', 'visita-ramon', 'visitar a Ramón');
      // juntar las ovejas desparramadas
      await cerrarTarjetas();
      await prep(8, { horas: 10, vistas: ['ramon-cama', 'fermin-tranquera', 'hojas-canelo', 'ramon-sanitario', 'papel-elsa', 'visita-ramon'], decisiones: { majada: 'b' }, temas: ['optativa:juntar-ovejas', 'mundo:corral-abierto'] });
      const pu = await irA('puesto', 7, 4, 1.5);
      await N('N.hasta(() => H.__arreo() && H.__arreo().activo() && H.__arreo().clave === "opt-juntar", 10)');
      ok(await N('!!(H.__arreo() && H.__arreo().clave === "opt-juntar")'), 'las ovejas desparramadas en la ladera');
      await foto('3a-ovejas-desparramadas');
      const ovs = await N('H.__arreo().estado.ovejas.map((o) => ({ x: o.x, z: o.z }))');
      const corral = { x: pu.x + 7, z: pu.z + 4 };
      const caminar = async (x0, z0, x1, z1) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 2.5)); for (let i = 1; i <= n; i++) { const k = i / n; await N(`N.ir(${x0 + (x1 - x0) * k}, ${z0 + (z1 - z0) * k}, Math.atan2(${-(x1 - x0)}, ${-(z1 - z0)}))`); await N('N.tick(0.5)'); } };
      let yo = { ...corral };
      for (const o of ovs) {
        if (await N('P.historia.temas["arreo:corral-ramon"] !== undefined')) break;
        await caminar(yo.x, yo.z, o.x, o.z); await N('N.tick(0.8)');
        await caminar(o.x, o.z, corral.x, corral.z); await N('N.tick(1.2)');
        yo = { ...corral };
        console.log(`  juntadas: ${await N('H.__arreo().juntadas ? H.__arreo().juntadas() : -1')} de ${ovs.length}`);
      }
      ok(await N('P.historia.temas["arreo:corral-ramon"] !== undefined'), 'las seis ovejas volvieron al corral');
      await comprobar('juntar-ovejas', 'juntar-ovejas', 'juntar las ovejas');
      // la trochita en la nieve (encargo de temporada): ramal +1
      const ra = await N('P.historia.ramal');
      await N('(() => { P.encargos["t-trochita-nieve"] = "hecho"; return 1 })()'); await N('H.__valle.revisarAhora()'); await N('N.tick(0.6)');
      ok(await hecha('trochita-nieve') && (await N('P.historia.ramal')) === ra + 1, 'la trochita en la nieve: ramal +1');
      // capítulo 10: abrir sin golpear (repetible), la llave del 79 y pedir perdón
      await cerrarTarjetas();
      await prep(9, { horas: 22.5 });
      { const ref = (await pts()).refugio; const r = await N(`N.levantar('galponcito', N.alrededor(${ref.x}, ${ref.z}, [16, 20, 24], 12))`); console.log('  [galponcito]', JSON.stringify(r)); await N('N.tick(1.2)'); }
      for (let vez = 1; vez <= 2; vez++) {
        const av = await eCerca('puerta-galpon-abrir');
        ok(av && /sin golpear/.test(av.aviso), `vez ${vez}: la E «${av && av.aviso}»`);
        await N('N.hasta(() => H.__escenas.activa(), 6)');
        if (vez === 1) await foto('3b-sin-golpear');
        await comprobar('galpon-sin-golpear', null, `abrir sin golpear (vez ${vez})`);
      }
      ok(!(await vista('galpon-golpe')), 'abrir sin golpear no cuenta como golpear');
      await cerrarTarjetas();
      await prep(9, { horas: 11, vistas: ['galpon-golpe', 'galpon-encuentro', 'galpon-trato'], decisiones: { duendes: 'a' }, duendes: { trato: 'trato' } });
      await N('(() => { P.cosas["llave-79"] = 1; return 1 })()'); await N('N.tick(0.6)');
      const al = await eCerca('cajon-trabado'); ok(al && /llave/i.test(al.aviso), `la E en el cajón: «${al && al.aviso}»`);
      await comprobar('llave-79', 'llave-79', 'la llave del 79');
      await cerrarTarjetas();
      await prep(9, { horas: 11, vistas: ['galpon-golpe', 'galpon-encuentro', 'galpon-pelea'], decisiones: { duendes: 'c' }, duendes: { trato: 'pelea', perdon: false } });
      await N('(() => { P.cosas.harina = 2; if (P.entradas.pinon) P.entradas.pinon.cantidad = 5; else P.entradas.pinon = { dia: P.dia, hora: 10, cantidad: 5 }; return 1 })()'); await N('N.tick(0.6)');
      const ap = await eCerca('raiz-perdon'); ok(ap && /perd/i.test(ap.aviso), `la E en la raíz: «${ap && ap.aviso}»`);
      await comprobar('pedir-perdon', 'pedir-perdon', 'pedir perdón');
      // capítulo 11: flechas de más, el cumpleaños, las plumas del gallinero, la pareja
      await cerrarTarjetas();
      await prep(10, { horas: 12, vistas: ['tito-arco', 'blancos-paso'], decisiones: { duendes: 'a' }, duendes: { trato: 'trato' } });
      await hablarCon('carpintero');
      await comprobar('flechas-de-mas', 'flechas-de-mas', 'flechas de más');
      ok((await N('P.historia.flechasExtra')) >= 15, 'el segundo atado: flechas de más para la noche');
      await prep(10, { horas: 16 });
      const cu = await N('H.__valle.estado().cumple');
      ok(!!cu, `hoy hay un cumpleaños en la aldea (${cu && cu.claves && cu.claves.join(', ')} en ${cu && cu.edificio})`);
      if (cu) { await irA('cumple', 3, 3, 1.5); await N('N.hasta(() => H.__escenas.activa() || P.historia.escenas.vistas["cumple-nevada"], 10)'); await foto('3c-cumple'); await comprobar('cumple-nevada', 'cumple-nevada', 'el cumpleaños que no se suspende'); }
      await cerrarTarjetas();
      await prep(10, { horas: 12 });
      { const ref = (await pts()).refugio; const r = await N(`N.levantar('gallinero', N.alrededor(${ref.x}, ${ref.z}, [12, 15, 18, 22], 12))`); console.log('  [gallinero]', JSON.stringify(r)); await N('N.tick(1)'); }
      await N('(() => { if (P.entradas.pluma) P.entradas.pluma.cantidad = 6; else P.entradas.pluma = { dia: P.dia, hora: 10, cantidad: 6 }; return 1 })()');
      await irA('gallinero', 2, 2, 1.5); await N('N.hasta(() => H.__escenas.activa() || P.historia.escenas.vistas["plumas-gallinero"], 10)');
      await comprobar('plumas-gallinero', null, 'las plumas del gallinero');
      // la pareja (sólo con el amor prendido y alguien con quien salís)
      await cerrarTarjetas();
      const pareja = await N('(() => { const g = (H.gente && H.gente.gente || []).concat([]); P.amor = P.amor || { personas: {} }; P.amor.personas = P.amor.personas || {}; const k = Object.keys(P.amor.personas)[0] || "maestra"; P.amor.personas[k] = Object.assign({}, P.amor.personas[k] || {}, { etapa: "novios" }); H.ajustes.romance = true; return k })()');
      await prep(10, { horas: 20 });
      await irA('refugio', 3, 3, 1.5); await N('N.hasta(() => H.__escenas.activa() || P.historia.escenas.vistas["pareja-noche-antes"], 10)');
      await comprobar('pareja-noche-antes', 'alguien-te-espera', `alguien que te espera (con ${pareja})`);
      // capítulo 13: volver a subir
      await cerrarTarjetas();
      await prep(12, { horas: 12, vistas: ['carpeta-celeste', 'majada-fin'], decisiones: { majada: 'c' } });
      await hablarCon('ramon');
      await comprobar('volver-a-subir', 'volver-a-subir', 'volver a subir');
    }

    // ================================================================ 4. la costumbre del trato (después de la historia, final A)
    if (toca(4)) {
      donde = 'costumbre';
      console.log('— 4. la costumbre del trato: llenar la bolsa y el regalito');
      await cerrarTarjetas();
      await prep(12, { fase: 'fin', horas: 18, duendes: { trato: 'trato', noche: 'ganada', final: 'trato' } });
      await N('(() => { P.historia.terminada = P.dia; P.historia.costumbre = { bolsa: "vacia", cosechas: 0, regalos: 0, dia: P.dia }; P.cosas.harina = 3; return 1 })()'); await N('N.tick(1)');
      const h0 = await N('P.cosas.harina');
      const ab = await eCerca('bolsa-umbral'); ok(ab && /Llenar/.test(ab.aviso), `la E en la bolsa: «${ab && ab.aviso}»`);
      await N('N.hasta(() => H.__escenas.activa(), 5)'); await foto('4a-costumbre-dejar');
      await comprobar('costumbre-dejar', null, 'la costumbre: dejar la bolsa');
      ok((await N('P.cosas.harina')) === h0 - 1, `una sola medida de harina (${h0} → ${await N('P.cosas.harina')})`);
      await N('(() => { P.dia += 1; P.horas = 7; return 1 })()'); await N('H.__valle.revisarAhora()'); await N('N.tick(1)');
      await N('N.hasta(() => H.__escenas.activa() || P.historia.escenas.vistas["costumbre-regalito"], 6)');
      await comprobar('costumbre-regalito', null, 'la costumbre: el regalito de la mañana');
    }

    // ================================================================ 5. la guía y los shaders
    donde = 'cierre';
    const guia = await N('(() => { const g = document.getElementById("historia-guia"); return g ? g.textContent : "" })()');
    if (!SOLO.length || toca(1)) ok(/Lo que hiciste de paso/.test(guia) || (await N('Object.keys(P.historia.optativas).length')) > 0, 'la guía lista lo que hiciste de paso');
    const hechas = await N('Object.keys(P.historia.optativas)');
    console.log(`  optativas hechas: ${hechas.length} (${hechas.join(', ')})`);
    if (noVistas.length) console.log(`  escenas sin escribir (dadas por vistas): ${noVistas.join(', ')}`);
    const prog = await N('N.programas()');
    ok(prog <= Math.max(prog0, 112), `programas de shader: ${prog0} → ${prog} (la base es 111; construir el galponcito o el gallinero puede sumar lo mismo que en el Relax libre)`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
