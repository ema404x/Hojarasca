// Mirada a ojo (4.17.0): dispara escenas del acto III y saca cuadros. OJO_ESCENAS=id1,id2 (por defecto galpon-encuentro, noche-espera, noche-tras-ganar, umbral-fin).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'escenas-4-17-0'));
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
    // Mira a ojo una muestra de escenas del acto III: las dispara con el director, saca un cuadro cada tanto y avanza con Enter. Capturas en la carpeta de salida.
    const cerrarT = async () => { for (let k = 0; k < 3 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); } };
    const ESCENAS = (process.env.OJO_ESCENAS || 'galpon-encuentro,noche-espera,noche-tras-ganar,umbral-fin').split(',');
    const PREP = {
      'galpon-encuentro': { cap: 9, horas: 23.2, lugar: 'galpon-noche', decisiones: { bolsa: 'a', molienda: 'c', coihue: 'a' }, duendes: {} },
      'noche-espera': { cap: 11, horas: 22.2, lugar: 'galpon-noche', decisiones: { bolsa: 'a', molienda: 'c', coihue: 'c', cuaderno: 'a', majada: 'a', duendes: 'a' }, duendes: { trato: 'trato', noche: 'pendiente' } },
      'noche-tras-ganar': { cap: 11, horas: 23.5, lugar: 'galpon-noche', decisiones: { cuaderno: 'a', majada: 'a', duendes: 'a' }, duendes: { trato: 'trato', noche: 'ganada' } },
      'umbral-fin': { cap: 12, horas: 7.6, lugar: 'refugio-puerta', decisiones: { bolsa: 'a', molienda: 'c', coihue: 'a', cuaderno: 'a', majada: 'a', duendes: 'a' }, duendes: { trato: 'trato', noche: 'ganada' } },
    };
    await entrar({ estacion: 'invierno' });
    await N('(() => { window.__sinPausaPorBlur = true; P.cosas.hacha = 1; return 1 })()');
    { const ref = await N('H.__puntosHistoria().refugio'); await N(`N.levantar('galponcito', N.alrededor(${ref.x}, ${ref.z}, [16, 20, 24], 12))`); await N('N.tick(1.5)'); }
    for (const id of ESCENAS) {
      donde = id;
      const p = PREP[id] || { cap: 9, horas: 12, lugar: 'refugio-puerta', decisiones: {}, duendes: {} };
      console.log(`— ${id}`);
      await N(`(() => { const h = P.historia; h.activa = true; h.empezada = 1; h.version = 2; h.capitulo = ${p.cap}; h.fase = 'jugando'; h.base = { dia: P.dia }; h.hechos = {}; h.cerrados = {}; h.acompanante = null; Object.assign(h.decisiones, ${JSON.stringify(p.decisiones)}); Object.assign(h.duendes, ${JSON.stringify(p.duendes)}); P.horas = ${p.horas}; return 1 })()`);
      await N('N.hasta(() => N.tarjeta(), 4)'); await cerrarT();
      const g = await N(`H.__puntosHistoria()[${JSON.stringify(p.lugar)}]`);
      await N(`N.ir(${g.x + 2}, ${g.z + 3}, 0)`); await N('N.tick(1.2)');
      const lanzo = await N(`H.__escenas.disparar(${JSON.stringify(id)}) === true`);
      ok(lanzo, `${id}: el director la dispara`);
      for (let i = 0; i < 14 && (await N('H.__escenas.activa()')); i++) {
        await N('N.tick(2.2)'); await foto(`ojo-${id}-${String(i).padStart(2, '0')}`);
        await N('N.tecla("Enter")'); await N('N.tick(0.3)');
        const d = await N('(() => { const es = H.__escenas; const d = es.director.datos && es.director.datos(); return d && d.eleccion ? d.eleccion.id : null })()');
        if (d) await N('N.tecla("Digit1")');
      }
      await N('N.despejar(60)');
      ok(!(await N('H.__escenas.activa()')), `${id}: terminó`);
    }
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
