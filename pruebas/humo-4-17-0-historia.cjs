// Partida real 4.17.0 (Electron + WebGL): la Historia nueva, el acto III (capítulos 9 a 13): la helada temprana, la majada y el arreo, golpear antes de abrir (D6),
// los blancos de práctica del arco y la honda, la noche de la nevada (trato y pelea, perder, Otra vez, Que amanezca, ganar), el amanecer, el final A con la
// costumbre de la bolsa y los cuadros de la noche. Corre sin depender del foco de la ventana (window.__sinPausaPorBlur, sólo con ?debug=1).
// Uso (después de `node armar.mjs`): powershell -File herramientaslanzar-electron.ps1 -Script pruebashumo-4-17-0-historia.cjs -Espera 900 -Perfil <carpeta propia> -Visible
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'historia-4-17-0'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';
const SOLO = (process.env.HUMO_SOLO || '').split(',').filter(Boolean);   // p. ej. HUMO_SOLO=6,7 corre sólo esas secciones
const toca = (n) => !SOLO.length || SOLO.includes(String(n));

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, J = H.jugador, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.hasta = async (f, max = 20) => { const t0 = performance.now(); while (performance.now() - t0 < max * 1000) { if (f()) return 1; H.__bucle(); await dormir(14); } return 0; };
  N.h = () => P.historia;
  N.tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); return 1; };
  N.tarjeta = () => {
    const v = document.getElementById('valle-tarjeta');
    if (!v || v.classList.contains('oculto')) return null;
    return { titulo: (v.querySelector('h2') || {}).textContent, arriba: (v.querySelector('.arriba') || {}).textContent, texto: [...v.querySelectorAll('p')].map((p) => p.textContent).join(' | '), lista: [...v.querySelectorAll('li')].map((l) => l.textContent), opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => ({ id: b.dataset.valleOpcion, texto: b.textContent, deshabilitada: b.disabled })) };
  };
  N.elegir = (id) => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + id + '"]'); if (b) b.click(); return !!b; };
  // saltea las escenas que haya (si el otro agente ya las escribió): la primera opción de cada pregunta y Esc dos veces
  // o.avanzar: no se saltea la escena, se la lee con Enter hasta el final (para las que toman una decisión); o.eleccion: { id de la pregunta: tecla }
  N.despejar = async (maxSeg = 6, o = {}) => {
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (es && es.activa()) {
        const d = es.director.datos && es.director.datos();
        if (d && d.eleccion) { N.tecla((o.eleccion && o.eleccion[d.eleccion.id]) || 'Digit1'); await N.tick(0.3); continue; }
        if (o.avanzar) { N.tecla('Enter'); await N.tick(0.25); continue; }
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
  N.aviso = () => { const a = document.getElementById('aviso'); return a && !a.classList.contains('oculto') ? a.textContent : ''; };
  N.panel = () => { const p = document.getElementById('historia-hud'); return p && !p.classList.contains('oculto') ? { texto: p.textContent, filas: p.querySelectorAll('p').length, hechos: p.querySelectorAll('p.hecho').length } : null; };
  N.ir = (x, z, yaw = 0) => { J.ubicar(x, z, yaw); return 1; };
  N.dist = () => H.__distanciasHistoria();
  N.diagEscena = () => { const j = H.jugador.estado; return { activa: H.__escenas.activa(), tarjeta: N.tarjeta() ? N.tarjeta().titulo : null, sentado: j.sentado, montado: !!j.montado, nadando: j.nadando, enTren: j.enTren, enKayak: j.enKayak, vista: Object.hasOwn(P.historia.escenas.vistas, 'placa-herminia'), modo: H.__caidas ? H.__caidas.modo() : null }; };
  N.diag = () => { const s = H.__valle.estado(), j = H.jugador.estado; return { horas: +s.horas.toFixed(2), dia: s.dia, sentado: s.sentado, jsSentado: j.sentado, mv: +(s.lugares['molino-viejo'] || -1).toFixed(1), cap: P.historia.capitulo, fase: P.historia.fase, tarjeta: N.tarjeta() ? N.tarjeta().titulo : null, escenaActiva: H.__escenas ? H.__escenas.activa() : null, vistas: Object.keys(P.historia.escenas.vistas).join(','), acel: H.__valle.aceleracion() }; };
  N.pts = () => H.__puntosHistoria();
  // pone la historia en el capítulo «cap» (0..12), con la tarjeta de entrada pendiente y lo anterior cerrado
  N.preparar = (cap, extra = {}) => {
    const h = P.historia;
    h.activa = true; h.empezada = 1; h.version = 2; h.capitulo = cap; h.fase = 'intro'; h.base = {}; h.hechos = {}; h.momentos = {};
    h.cerrados = {}; ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha'].slice(0, cap).forEach((k, i) => { h.cerrados[k] = (extra.dia || P.dia) - 1; });
    if (extra.decisiones) Object.assign(h.decisiones, extra.decisiones);
    h.entregasVistas = P.comercio ? Math.floor(Number(P.comercio.entregas) || 0) : 0;
    P.ajustes && 0;
    return 1;
  };
  // sembrado de un cantero, un molino, etc.: una pieza terminada en el primer lugar que sirva
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
  // el sitio del molino (a la orilla del arroyo, con la rueda en el agua) como en el humo de las máquinas
  N.sitioMolino = () => {
    const O = H.obras, rio = T.rio, pm = H.PLANOS.find((q) => q.id === 'molino-agua');
    const ref = T.lugares.refugio;
    const orden = rio.map((p, i) => ({ i, d: Math.hypot(p.x - ref.x, p.z - ref.z) })).sort((a, b) => a.d - b.d).filter((q, k) => k % 3 === 0).slice(0, 40);
    for (const { i } of orden) {
      const a = rio[i], b = rio[Math.min(rio.length - 1, i + 1)];
      const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
      for (const lado of [1, -1]) for (const d of [4, 5, 6, 7]) {
        const x = a.x + nx * d * lado, z = a.z + nz * d * lado, rot = Math.atan2(nz * lado, -nx * lado);
        O.elegir(pm); const m = O.moverFantasma(x, z, rot, T.altura(x, z)); O.elegir(null);
        if (m && m.ok) return [x, z, rot];
      }
    }
    return null;
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
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  let progVisto = 0;
  const vigilar = async (etiqueta) => { const n = await N('N.programas()'); if (progVisto && n !== progVisto) console.log(`  [programas ${progVisto} → ${n} en: ${etiqueta}]`); progVisto = n; return n; };
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = (tipo, extra = {}) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false, guiaPrimerDia:false}, ${JSON.stringify(extra)}))); 1`;
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const abrir = async (tipo, extra) => { await w.loadFile(url, { search: '?debug=1' }); await js(ajustes(tipo, extra)); await cargar(); };
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
  // una partida de Historia nueva, ya adentro y con la tarjeta del capítulo 1 cerrada
  let entrado = false, progTrasObra = 0;
  const entrar = async (extra) => {
    entrado = true;
    await abrir('historia', extra);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await js('window.__sinPausaPorBlur = true; 1');   // 4.17.0: la ventana pierde el foco y el juego se pausaba solo
    await N('N.tick(2.5)');
    await N('N.hasta(() => N.tarjeta(), 12)');
    await N('N.elegir("empezar")'); await N('N.tick(1.5)');
    await N('N.despejar(10)');
  };
  // pone la historia en un capítulo y deja abierta la tarjeta de entrada
  const preparar = async (cap, extra = {}) => {
    await N(`N.preparar(${cap}, ${JSON.stringify(extra)})`);
    await N('N.hasta(() => N.tarjeta(), 12)');
    if (!(await N('N.tarjeta()'))) console.log('  [preparar sin tarjeta]', JSON.stringify(await N('N.diag()')), JSON.stringify(await N('N.diagEscena()')));
  };
  // una decisión grande: con la escena de B, sale de la escena (se la lee y se contesta la pregunta); sin escena, sale la tarjeta de respaldo
  const decidir = async (id, digito, titulo, nombreFoto) => {
    await N(`N.despejar(70, { avanzar: true, eleccion: { ${id}: 'Digit${digito}' } })`);
    let por = 'la escena';
    if (!(await N(`P.historia.decisiones.${id}`))) {
      por = 'la tarjeta de respaldo';
      const dec = await N('(async () => { await N.hasta(() => N.tarjeta() && /decisión/i.test(N.tarjeta().arriba), 12); return N.tarjeta() })()');
      ok(dec && dec.titulo === titulo && dec.opciones.length === 3, `sale la decisión «${titulo}» (${dec && dec.titulo})`);
      if (nombreFoto) await foto(nombreFoto);
      await N(`N.tecla("Digit${digito}")`); await N('N.tick(1)');
    }
    console.log(`  (la decisión ${id} salió de ${por})`);
  };
  const empezar = async () => { await N('N.elegir("empezar")'); await N('N.tick(1)'); };
  const hecho = (obj) => N(`P.historia.hechos[${JSON.stringify(obj)}] !== undefined`);
  const decirTarjeta = async () => { const t = await N('N.tarjeta()'); return t ? `${t.titulo} · ${t.arriba}` : 'sin tarjeta'; };
  const pararCerca = (id, d = 1.6) => N(`(() => { const o = H.__historiaObjetos(), q = o.posiciones[${JSON.stringify(id)}]; if (!q) return 0; const j = H.jugador.estado; const a = Math.atan2(j.pos.x - q.x, j.pos.z - q.z) || 0; N.ir(q.x + Math.sin(a) * ${d}, q.z + Math.cos(a) * ${d}, a); H.jugador.estado.pitch = -0.28; return 1 })()`);
  const eCerca = async (id) => { await pararCerca(id); await N('N.tick(0.7)'); const a = await N('(() => { const c = H.__objetoHistoriaCerca(); return c ? { id: c.id, aviso: c.aviso } : null })()'); await N('N.tecla("KeyE")'); await N('N.tick(0.6)'); await N('N.despejar(3)'); return a; };

  try {
    // pone la historia en el capítulo `cap` (0..12) con lo anterior cerrado; fase 'jugando' y base del día actual
    const IDS = ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha', 'cuaderno', 'frios', 'golpea', 'arco', 'nevada', 'deshielo'];
    const cerrarTarjetas = async () => { for (let k = 0; k < 3 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); } };
    const prep = (cap, o = {}) => N(`(() => {
      const h = P.historia, ids = ${JSON.stringify(IDS)};
      h.activa = true; h.empezada = 1; h.version = 2; h.acompanante = ${JSON.stringify(o.acompanante || null)}; h.capitulo = ${cap}; h.fase = '${o.fase || 'jugando'}'; h.base = { dia: P.dia, talados: 0, cocinadas: 0, cantos: 0 }; h.hechos = {}; h.momentos = {}; h.cerrados = {};
      ids.slice(0, ${cap}).forEach((k) => { h.cerrados[k] = P.dia - 1; });
      Object.assign(h.decisiones, ${JSON.stringify(o.decisiones || {})}); Object.assign(h.duendes, ${JSON.stringify(o.duendes || {})});
      for (const e of ${JSON.stringify(o.vistas || [])}) h.escenas.vistas[e] = P.dia;
      for (const e of ${JSON.stringify(o.hechos || [])}) h.hechos[e] = P.dia;
      P.horas = ${o.horas ?? 10};
      return 1 })()`);

    // ================================================================ 0. la puerta de invierno y la helada
    if (toca(0)) {
      donde = 'puerta de invierno';
      console.log('— 0. la puerta de invierno: la helada temprana de la historia');
      await entrar({ estacion: 'auto' });
      await N('(() => { P.dia = 3; P.horas = 9.5; return 1 })()');
      await prep(8, { fase: 'intro', horas: 9.5 });
      await N('(() => { P.historia.cerrados.cuaderno = 3; return 1 })()');
      await N('N.hasta(() => N.tarjeta(), 10)');
      const t0 = await N('N.tarjeta()');
      ok(t0 && /Todavía no hace tanto frío/.test(t0.titulo), `sin helada el capítulo 9 espera: «${t0 && t0.titulo}»`);
      await foto('0a-puerta-invierno');
      await N('N.elegir("seguir")'); await N('N.tick(1)');
      await N('(() => { P.dia = 5; return 1 })()'); await N('N.tick(1.5)');
      ok((await N('H.__valle.estacionForzada()')) === 'invierno', 'a los dos días la historia trae su helada temprana');
      await N('N.hasta(() => H.__U().uInvierno.value > 0.95, 8)');
      ok((await N('H.__U().uInvierno.value')) > 0.95, 'el valle se pone blanco aunque el calendario no lo diga');
      const t1 = await N('(async () => { await N.hasta(() => N.tarjeta() && /Los primeros fríos/.test(N.tarjeta().titulo), 8); return N.tarjeta() })()');
      ok(t1 && t1.titulo === 'Los primeros fríos' && !/continuará|se está escribiendo/.test(t1.texto), `la tarjeta del capítulo 9 (${t1 && t1.titulo})`);
      ok(t1 && t1.lista.length >= 6, `con objetivos de verdad (${t1 && t1.lista.length})`);
      await foto('0b-capitulo-9'); await vigilar('puerta');
      await N('N.elegir("empezar")'); await N('N.tick(1)');
    }

    // ================================================================ 1. capítulo 9: la majada (D5) y el arreo
    if (toca(1)) {
      donde = 'capítulo 9';
      console.log('— 1. capítulo 9: Ramón en cama, la majada (D5) y el arreo');
      if (!entrado) await entrar({ estacion: 'invierno' });
      await prep(8, { horas: 10 });
      await N('(() => { P.cosas.hacha = 1; return 1 })()');
      const pu = await N('H.__puntosHistoria().puesto'); ok(!!pu, 'el Puesto Alto tiene lugar');
      console.log('  [prog] antes del Puesto Alto', await N('N.programas()'));
      await N(`N.ir(${pu.x + 4}, ${pu.z + 4}, 0)`); await N('N.tick(1.2)');
      console.log('  [prog] en el Puesto Alto', await N('N.programas()'));
      await N('N.hasta(() => P.historia.escenas.vistas["ramon-cama"], 14)');
      ok(await N('!!P.historia.escenas.vistas["ramon-cama"]'), 'ramon-cama se dispara en el Puesto Alto');
      ok((await N('P.historia.acompanante')) === 'ramon', 'Ramón queda de acompañante');
      await N('N.despejar(8)');
      await decidir('majada', 1, 'La majada de Ramón', '1a-decision-majada');
      ok((await N('P.historia.decisiones.majada')) === 'a', 'D5 = que se la lleve Fermín');
      await N('N.hasta(() => H.__arreo() && H.__arreo().activo(), 10)');
      ok(await N('!!(H.__arreo() && H.__arreo().activo())'), 'aparecen las ovejas en el corral');
      console.log('  [prog] con las ovejas en el corral', await N('N.programas()'));
      await foto('1b-ovejas-corral');
      const gx = await N('H.__puntosHistoria().galpon');
      // vamos delante, hacia el galpón de esquila, de a pasos; las ovejas siguen
      const pasos = Math.ceil(Math.hypot(gx.x - pu.x, gx.z - pu.z) / 3.4);
      for (let i = 1; i <= pasos + 6 && !(await N('P.historia.temas["arreo:galpon-esquila"] !== undefined')); i++) {
        const k = Math.min(1, i / pasos), x = pu.x + (gx.x - pu.x) * k, z = pu.z + (gx.z - pu.z) * k;
        await N(`N.ir(${x}, ${z}, Math.atan2(${-(gx.x - pu.x)}, ${-(gx.z - pu.z)}))`); await N('N.tick(0.9)');
        if (i === Math.floor(pasos / 2)) await foto('1c-arreo-camino');
      }
      await N('N.tick(2)');
      ok(await N('P.historia.temas["arreo:galpon-esquila"] !== undefined'), 'la majada llegó al galpón de esquila');
      ok(await hecho('frios:cumplir'), 'el objetivo del arreo se tilda');
      console.log('  [prog] llegó la majada', await N('N.programas()'));
      await foto('1d-majada-llego');
      await vigilar('capítulo 9');
    }

    // ================================================================ 2. capítulo 10: golpear antes de abrir y D6
    if (toca(2)) {
      donde = 'capítulo 10';
      console.log('— 2. capítulo 10: golpear la puerta del galpón y decidir (D6)');
      if (!entrado) await entrar({ estacion: 'invierno' });
      await N('(() => { P.cosas.hacha = 1; return 1 })()');
      await prep(9, { horas: 23.2, decisiones: { bolsa: 'a', molienda: 'c', coihue: 'a' } });
      await N('(() => { const O = H.obras; return 1 })()');
      await N('N.hasta(() => N.tarjeta(), 8)'); await N('N.elegir("empezar")'); await N('N.tick(1)');
      { const ref = await N('H.__puntosHistoria().refugio'); const pAntes = await N('N.programas()'); const r = await N(`N.levantar('galponcito', N.alrededor(${ref.x}, ${ref.z}, [16, 20, 24], 12))`); console.log('  [galponcito]', JSON.stringify(r), `programas ${pAntes} → ${await N('N.programas()')} al construirlo (pasa igual en el Relax libre)`); await N('N.tick(1.5)'); progVisto = progTrasObra = await N('N.programas()'); }
      const g = await N('H.__puntosHistoria()["galpon-noche"]'); ok(!!g, 'hay un galpón de la noche (el tuyo o la puerta del refugio)');
      console.log('  [prog]', 'antes de ir al galpón', await N('N.programas()'));
      await N(`N.ir(${g.x + 1.2}, ${g.z + 1.2}, 0)`); await N('N.tick(1)');
      console.log('  [prog]', 'en el galpón de noche', await N('N.programas()'));
      await N('N.hasta(() => { const c = H.__objetoHistoriaCerca(); return c && /Golpear/.test(c.aviso); }, 8)');
      const av = await N('(() => { const c = H.__objetoHistoriaCerca(); return c ? c.aviso : null })()');
      ok(av && /Golpear/.test(av), `la E dice «${av}» (no «Abrir»)`);
      await foto('2a-golpear');
      await N('N.tecla("KeyE")'); await N('N.tick(0.8)'); await N('N.despejar(6)');
      console.log('  [prog]', 'tras golpear', await N('N.programas()'));
      ok(await N('!!P.historia.escenas.vistas.golpe'), 'golpe: hecho');
      await N('N.hasta(() => P.historia.escenas.vistas.encuentro, 10)'); await N('N.despejar(70, { avanzar: true, eleccion: { duendes: "Digit1" } })');
      if (!(await N('P.historia.decisiones.duendes'))) {
        const dec = await N('(async () => { await N.hasta(() => N.tarjeta() && /decisión/i.test(N.tarjeta().arriba), 12); return N.tarjeta() })()');
        ok(dec && dec.opciones.length === 3, `sale la decisión D6 (${dec && dec.titulo})`);
        await foto('2b-decision-duendes'); await N('N.tecla("Digit1")'); await N('N.tick(1)');
      }
      console.log('  [prog] tras D6', await N('N.programas()'));
      ok((await N('P.historia.decisiones.duendes')) === 'a' && (await N('P.historia.duendes.trato')) === 'trato', 'D6 = trato');
      await vigilar('capítulo 10');
    }

    // ================================================================ 3. capítulo 11: los blancos de práctica
    if (toca(3)) {
      donde = 'capítulo 11';
      console.log('— 3. capítulo 11: blancos de paja (arco) y latas (honda)');
      if (!entrado) await entrar({ estacion: 'invierno' });
      await N('(() => { window.__sinPausaPorBlur = true; return 1 })()');
      await prep(10, { horas: 12, decisiones: { majada: 'a' }, hechos: ['arco:tito', 'arco:cuerda', 'arco:puntas', 'arco:plumas', 'arco:fermin', 'arco:cantos'] });
      await N('N.hasta(() => N.tarjeta(), 8)'); if (await N('N.tarjeta()')) { await N('N.elegir("empezar")'); await N('N.tick(1)'); }
      const tirar = async (donde2, punto) => {
        const p = await N(`H.__puntosHistoria()[${JSON.stringify(punto)}]`);
        const ref = await N('H.__puntosHistoria().refugio');
        const a0 = Math.atan2(ref.z - p.z, ref.x - p.x);
        await N(`N.ir(${p.x + Math.cos(a0) * 3}, ${p.z + Math.sin(a0) * 3}, 0)`); await N('N.tick(1.2)');
        await N(`N.hasta(() => H.__noche() && H.__noche().practicaActiva(), 8)`);
        ok(await N('!!(H.__noche() && H.__noche().practicaActiva())'), `los blancos de ${donde2} aparecen`);
        await foto(`3-${donde2}`);
        for (let intento = 0; intento < 90 && (await N(`P.historia.blancos.${donde2} < 5`)); intento++) {
          const arma = donde2 === 'paso' ? 'arco' : 'honda';
          const ya = await N(`(() => { const pr = H.__noche().practica; const k = pr.sim.blancos.findIndex((b) => b.caido <= 0); if (k < 0) return 0; const b = pr.sim.blancos[k], j = H.jugador.estado, ex = ${intento % 7}, dy = (ex - 3) * 0.12; const dx = b.x - j.pos.x, dz = b.z - j.pos.z, hz = Math.hypot(dx, dz); j.yaw = Math.atan2(-dx, -dz); j.pitch = Math.atan2((b.y + b.h / 2 + dy) - (j.pos.y + 1.6), hz) + 0.02 * ex; return 1 })()`);
          if (!ya) { await N('N.tick(0.6)'); continue; }
          await N('N.tick(0.12)');
          await N(`(() => { const pr = H.__noche().practica; pr.sim.recarga = 0; H.__noche().disparar('${arma}', ${arma === 'arco' ? 0.6 : 0}); return 1 })()`);
          await N('N.tick(0.5)');
        }
        const n = await N(`P.historia.blancos.${donde2}`);
        ok(n >= 5, `cinco aciertos de ${donde2} (${n})`);
      };
      await tirar('paso', 'puesto-paso');
      ok(await N('P.historia.duendes.armas.arco === true'), 'con cinco blancos el arco es tuyo');
      await tirar('esquila', 'galpon');
      ok(await N('P.historia.duendes.armas.honda === true'), 'con cinco latas la honda es tuya');
      await N('N.tick(1.2)');
      ok(await hecho('arco:blancos-paso') && await hecho('arco:blancos-esquila'), 'los dos objetivos se tildan');
      await vigilar('capítulo 11');
    }

    // ================================================================ 4. capítulo 12: la noche de la nevada
    if (toca(4)) {
      donde = 'capítulo 12';
      console.log('— 4. capítulo 12: la noche de la nevada (trato: los del cerro, y pelea)');
      if (!entrado) await entrar({ estacion: 'invierno' });
      await N('(() => { window.__sinPausaPorBlur = true; P.cosas.hacha = 1; return 1 })()');
      const antes = await N('N.programas()');
      for (const modo of ['trato', 'pelea']) {
        console.log(`  · modo ${modo}`);
        for (let k = 0; k < 3 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const t = N.tarjeta(); const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }   // (cierra la tarjeta del capítulo que quedó de la vuelta anterior)
        await prep(11, { horas: 22.1, decisiones: { bolsa: 'a', molienda: 'c', coihue: 'c', cuaderno: 'a', majada: 'a', duendes: modo === 'trato' ? 'b' : 'c' },
          duendes: { trato: modo, noche: 'pendiente', armas: { arco: true, honda: true } }, vistas: ['espera'], hechos: ['nevada:comer', 'nevada:estacion'] });
        await N('(() => { const h = P.historia; for (const k of ["herrero","apicultor","maquinista","guarda"]) h.prestado[k] = true; h.lazos.ema = 2; h.lazos.fermin = 2; h.lazos.ramon = 2; return 1 })()');
        const g = await N('H.__puntosHistoria()["galpon-noche"]');
        await N(`N.ir(${g.x + 1}, ${g.z + 1}, 0)`);
        await N('N.hasta(() => H.__noche() && H.__noche().activa(), 14)');
        ok(await N('!!(H.__noche() && H.__noche().activa())'), 'la noche empieza sola al terminar la escena de la espera');
        if (!(await N('!!(H.__noche() && H.__noche().activa())'))) console.log('  [diag noche]', JSON.stringify(await N('({ fase: P.historia.fase, cap: P.historia.capitulo, noche: P.historia.duendes.noche, tarjeta: N.tarjeta() && N.tarjeta().titulo, escena: H.__escenas.activa(), horas: P.horas, activa: P.historia.activa, lug: H.__valle.estado().lugares["galpon-noche"], vehiculo: !!(H.jugador.estado.enTren || H.jugador.estado.enKayak || H.jugador.estado.enVela || H.jugador.estado.montado), modo: H.modo && H.modo() })')));
        await N('N.tick(4)');
        const hud = await N('H.__noche().hud()'); ok(hud && hud.ola === 1, `ola ${hud && hud.ola} de 3 en el panel`);
        const dis = await N('(() => { const d = H.__noche().dis; return { miel: d.miel.length, emp: !!d.empalizada, tramos: d.tramos.length, ux: d.ux, uz: d.uz } })()');
        ok(dis.miel === 2 && dis.emp && dis.tramos === 2, `las defensas prestadas están armadas (miel ${dis.miel}, empalizada ${dis.emp}, estacas ${dis.tramos})`);
        const nd = await N('H.__noche().sim.duendes.filter((d) => d.estado !== "fuera").length'); ok(nd >= 3 && nd <= 12, `duendes en la escena: ${nd} (tope 12)`);
        await N('N.tick(10)'); await foto(`4a-noche-${modo}`);
        await vigilar(`noche ${modo}`);
        // perder: sin aire (pelea) o con siete travesuras (trato)
        await N(`(() => { const s = H.__noche().sim; if ('${modo}' === 'pelea') s.jugador.vida = 0.001; else s.travesuras = 6; for (const d of s.duendes) if (d.estado === 'avanza') { d.x = s.dis.centro.x + 0.5; d.z = s.dis.centro.z; d.wp = 2; } return 1 })()`);
        await N('N.hasta(() => N.tarjeta() && /se te escapó/.test(N.tarjeta().titulo), 30)');
        const per = await N('N.tarjeta()'); ok(per && /se te escapó/.test(per.titulo) && per.opciones.length === 2, `perder: «${per && per.titulo}» con dos botones`);
        ok(per && per.opciones.some((o) => /Otra vez/.test(o.texto)) && per.opciones.some((o) => /Que amanezca/.test(o.texto)), '«Otra vez» y «Que amanezca»');
        await foto(`4b-perdida-${modo}`);
        ok((await N('P.historia.duendes.noche')) === 'pendiente', 'perder no cierra la noche (sin castigo)');
        await N('N.elegir("otra")'); await N('N.tick(2)');
        ok(await N('!!H.__noche().activa()') && (await N('P.horas')) < 23.2, 'Otra vez: vuelve a las 22 y empieza de nuevo');
        // ganar: adelantar el reloj de la noche hasta que pare la nevada
        await N('(() => { const s = H.__noche().sim; s.t = 268; return 1 })()');
        await N('N.hasta(() => !H.__noche().activa(), 20)');
        ok(!(await N('H.__noche().activa()')) && (await N('P.historia.duendes.noche')) === 'ganada', 'aguantar hasta que para la nevada gana la noche');
        const hh = await N('({ horas: P.horas, dia: P.dia })'); ok(Math.abs(hh.horas - 6.4) < 0.3, `amanece (${hh.horas.toFixed(2)})`);
        await N('N.tick(2)'); await N('N.despejar(8)');
        ok(await N('["amanecer-trato-ganada","amanecer-pelea-ganada"].some((e) => P.historia.escenas.vistas[e])'), 'sale la escena del amanecer de la variante correcta');
        ok(await hecho('nevada:noche') && await hecho('nevada:amanecer'), 'la noche y el amanecer se tildan');
        await foto(`4c-amanecer-${modo}`);
      }
      // «Que amanezca»
      await cerrarTarjetas();
      await prep(11, { horas: 22.1, decisiones: { cuaderno: 'a' }, duendes: { trato: 'pelea', noche: 'pendiente' }, vistas: ['espera'] });
      const g2 = await N('H.__puntosHistoria()["galpon-noche"]'); await N(`N.ir(${g2.x + 1}, ${g2.z + 1}, 0)`);
      await N('N.hasta(() => H.__noche() && H.__noche().activa(), 14)'); await N('N.tick(3)');
      await N('H.__noche().sim.jugador.vida = 0.001'); await N('N.hasta(() => N.tarjeta() && /se te escapó/.test(N.tarjeta().titulo), 30)');
      await N('N.elegir("amanezca")'); await N('N.tick(2)');
      ok((await N('P.historia.duendes.noche')) === 'perdida' && !(await N('H.__noche().activa()')), '«Que amanezca»: la noche queda perdida y la historia sigue');
      await N('N.despejar(8)');
      ok(await N('!!P.historia.escenas.vistas["amanecer-pelea-perdida"]'), 'amanecer-pelea-perdida');
      const despues = await N('N.programas()');
      ok(despues === antes, `0 programas de shader nuevos en las noches (${antes} → ${despues})`);
    }

    // ================================================================ 5. el epílogo y el final
    if (toca(5)) {
      donde = 'capítulo 13';
      console.log('— 5. capítulo 13: el último día, el final A (trato) y la costumbre de la bolsa');
      if (!entrado) await entrar({ estacion: 'invierno' });
      await prep(12, { horas: 7.5, decisiones: { majada: 'a', cuaderno: 'a' }, duendes: { trato: 'trato', noche: 'ganada' }, vistas: ['carpeta', 'majada-fin', 'josefina-fin'], hechos: ['deshielo:fiesta'] });
      await N('(() => { P.historia.ramal = 10; P.dia += 1; return 1 })()');
      const rp = await N('H.__puntosHistoria()["refugio-puerta"]'); await N(`N.ir(${rp.x}, ${rp.z + 1}, 0)`);
      await N('N.hasta(() => P.historia.escenas.vistas["umbral-fin"], 14)'); await N('N.despejar(8)');
      ok(await N('!!P.historia.escenas.vistas["umbral-fin"]') && (await N('P.historia.duendes.final')) === 'trato', 'umbral-fin: final A');
      await N('N.hasta(() => N.tarjeta() && /^El trato$/.test(N.tarjeta().titulo), 12)');
      const f = await N('N.tarjeta()'); ok(f && f.titulo === 'El trato' && /bolsa del molino/.test(f.texto) && /trochita pasa todos los días/.test(f.texto) && /puestito|puesto nuevo/.test(f.texto), `la tarjeta final con sus piezas (${f && f.titulo})`);
      ok(f && f.opciones.length === 2 && f.opciones.some((o) => /créditos/i.test(o.texto)), 'Seguir o Ver los créditos');
      await foto('5a-final');
      const poncho0 = await N('P.cosas.poncho || 0'); await N('N.elegir("seguir")'); await N('N.tick(1.5)');
      ok((await N('P.historia.fase')) === 'fin' && (await N('P.cosas.poncho || 0')) >= 1, 'el premio (poncho) sale una vez y la historia termina');
      await N('(() => { P.cosas.harina = 3; P.historia.costumbre = { bolsa: "vacia", cosechas: 0, regalos: 0, dia: P.dia }; return 1 })()'); await N('N.tick(1)');
      const c = await N('(async () => { await N.hasta(() => H.__historiaObjetos().posiciones["bolsa-umbral"], 5); return !!H.__historiaObjetos().posiciones["bolsa-umbral"] })()'); ok(c, 'la bolsa vacía en el umbral (costumbre del trato)');
      await foto('5b-bolsa-umbral');
      await vigilar('final');
    }

    // ================================================================ 6. los frames de la noche
    if (toca(6)) {
      donde = 'fps';
      console.log('— 6. cuadros de la noche (notebook: sólo antes/después)');
      if (!entrado) await entrar({ estacion: 'invierno' });
      await N('(() => { window.__sinPausaPorBlur = true; return 1 })()');
      const medir = (seg) => N(`(async () => { const t = []; const t0 = performance.now(); let u = performance.now(); while (performance.now() - t0 < ${seg * 1000}) { H.__bucle(); const a = performance.now(); t.push(a - u); u = a; await new Promise((r) => requestAnimationFrame(r)); } t.shift(); t.sort((a, b) => a - b); return { n: t.length, media: t.reduce((s, x) => s + x, 0) / t.length, p95: t[Math.floor(t.length * 0.95)], llamadas: H.renderer.info.render.calls, tri: H.renderer.info.render.triangles } })()`);
      await prep(11, { horas: 22.1, decisiones: { cuaderno: 'a', coihue: 'c' }, duendes: { trato: 'trato', noche: 'pendiente', armas: { arco: true, honda: true } }, vistas: ['espera'] });
      await N('(() => { for (const k of ["herrero","apicultor","maquinista","guarda"]) P.historia.prestado[k] = true; return 1 })()');
      const g = await N('H.__puntosHistoria()["galpon-noche"]'); await N(`N.ir(${g.x + 1}, ${g.z + 1}, 0)`);
      const base = await medir(4);
      await N('N.hasta(() => H.__noche() && H.__noche().activa(), 14)');
      await N('N.hasta(() => H.__noche().sim && H.__noche().sim.duendes.filter((d) => d.estado !== "fuera").length >= 7, 40)');
      const noche = await medir(5);
      console.log('  sin la noche:', JSON.stringify(base)); console.log('  con la noche:', JSON.stringify(noche));
      ok(noche.p95 - base.p95 < 6, `la noche no se nota de más en el p95 (${(noche.p95 - base.p95).toFixed(1)} ms)`);
    }

    // ================================================================ D. el control: los mismos lugares, de día y de noche, en el Relax libre (sin historia)
    if (toca('D')) {
      donde = 'diagnóstico';
      console.log('— D. control: el Relax libre en invierno, de día por el puesto y el galpón de esquila, y de noche en el refugio');
      await abrir('libre', { estacion: 'invierno' });
      await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000); await js(PAGINA);
      await js('window.__sinPausaPorBlur = true; 1'); await N('N.tick(2)');
      await N('(() => { P.dia = 7; P.horas = 11; return 1 })()');
      console.log('  [libre] al empezar:', await N('N.programas()'));
      for (const k of ['puesto', 'galpon', 'molino-viejo', 'puesto-paso']) { const p = await N(`H.__puntosHistoria()["${k}"]`); if (!p) continue; await N(`N.ir(${p.x + 4}, ${p.z + 4}, 0)`); await N('N.tick(1.5)'); console.log(`  [libre, día] ${k}:`, await N('N.programas()')); }
      await N('(() => { P.horas = 23.2; return 1 })()');
      const g = await N('H.__puntosHistoria()["refugio-puerta"]'); await N(`N.ir(${g.x + 1}, ${g.z + 3}, 0)`); await N('N.tick(2)');
      console.log('  [libre, noche] refugio:', await N('N.programas()'));
    }

    // ================================================================ 7. los shaders y la consola
    donde = 'cierre';
    const prog = await N('N.programas()');
    if (!SOLO.length) ok(prog <= (progTrasObra || 111), `programas de shader: ${prog} (110 de base; +1 el molino viejo de día y lo que suma construir el galponcito: pasan igual en el Relax libre; la historia, el arreo, los blancos y las noches suman 0)`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
