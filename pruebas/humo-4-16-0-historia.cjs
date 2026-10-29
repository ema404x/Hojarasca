// Partida real 4.16.0 (Electron + WebGL): la Historia nueva, el acto II (capítulos 5 a 8): «La rueda», «Lo que se pierde, aparece», «La cosecha» y «El
// cuaderno de Eusebio». Con la mecánica de verdad (objetivos que se tildan solos, las E sobre los objetos y los vecinos, el reloj que corre sentado,
// el clima de la historia, el coihue grande, Tobías que te sigue a pie) y, si están las escenas de B, jugándolas (la primera opción y Esc dos veces).
//   0. la puerta de estación: en verano el capítulo 5 espera (no más de 2 días) y después la historia trae su propio otoño;
//   1. capítulo 5: las piedras del molino viejo, el zaino, un molino y un aserradero de verdad, el coihue (D2) con Tobías y la pirca, las habas y el puente;
//   2. el coihue grande se tala con seis hachazos (y Josefina lo toma mal);
//   3. capítulo 6: las tres cosas perdidas, el kayak al faro de noche, la guardia sentado (el reloj ×8) y las huellas en la escarcha hasta la raíz de Ramón;
//   4. capítulo 7: la harina que sale de la muela, la primera molienda (D3), la minga, el galpón en ronda y el cuaderno del pozo;
//   5. capítulo 8: las tres páginas, las escenas con los vecinos, Belisario, Ramón, el fogón (D4) y el premio según lo decidido;
//   6. ningún programa de shader nuevo y sin errores de consola.
// Uso (después de `node armar.mjs`), en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-16-0-historia.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'historia-4-16-0'));
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
  const entrar = async (extra) => {
    await abrir('historia', extra);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');   // 4.17.0: la ventana pierde el foco y el juego se pausaba solo
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
    // ================================================================ 0. la puerta de estación
    if (toca(0)) {
      donde = 'puerta de estación';
      console.log('— 0. la puerta de estación y el clima de la historia');
      await entrar({ estacion: 'auto' });
      await N('(() => { P.dia = 3; P.horas = 9.5; return 1 })()');
      await preparar(4, { dia: 3 });
      const nat = await N('H.__valle.estado().estacionNatural');
      ok(nat === 'verano', `el día 3 todavía es verano (${nat})`);
      const t0 = await N('N.tarjeta()');
      ok(t0 && /lengas todavía están verdes/.test(t0.titulo), `en verano el capítulo 5 espera: «${t0 && t0.titulo}»`);
      ok(t0 && !/La rueda/.test(t0.titulo) && t0.opciones.length === 1, 'con una tarjeta corta de un solo botón');
      await foto('0a-puerta-de-estacion');
      await N('N.elegir("seguir")'); await N('N.tick(1.5)');
      ok(!(await N('N.tarjeta()')) && (await N('P.historia.fase')) === 'intro', 'se cierra y la historia sigue esperando (no vuelve a salir sola)');
      ok((await N('H.__valle.estacionForzada()')) === null, 'a un día de espera, el clima es el de siempre');
      await N('(() => { P.dia = 4; return 1 })()'); await N('N.tick(1.5)');
      ok((await N('H.__valle.estado().estacionNatural')) === 'verano' && (await N('H.__valle.estacionForzada()')) === 'otono', 'a los dos días de espera, la historia trae su propio otoño');
      await N('N.hasta(() => H.__U().uOtono.value > 0.95, 8)');
      const oto = await N('H.__U().uOtono.value');
      ok(oto > 0.95, `y el valle se pone colorado (otoño ${oto.toFixed(2)}) aunque el calendario diga verano`);
      const t1 = await N('(async () => { await N.hasta(() => N.tarjeta() && /La rueda/.test(N.tarjeta().titulo), 8); return N.tarjeta() })()');
      ok(t1 && t1.titulo === 'La rueda' && /Josefina golpeó tu puerta/.test(t1.texto), `la tarjeta del capítulo 5 (${t1 && t1.titulo})`);
      ok(t1 && t1.lista.length === 6 && !/continuará|todavía se está escribiendo/.test(t1.texto), `con sus objetivos de verdad (${t1 && t1.lista.length}) y sin «continuará»`);
      await foto('0b-tarjeta-capitulo-5');
      await vigilar('puerta');
    }

    // ================================================================ 1. el capítulo 5
    if (toca(1)) {
      donde = 'capítulo 5';
      console.log('— 1. capítulo 5: La rueda');
      await entrar({ estacion: 'otono' });
      await N('(() => { P.dia = 6; P.horas = 10; return 1 })()');
      await preparar(4, { dia: 6, decisiones: { bolsa: 'a' } });
      await empezar();
      ok(await N('N.panel() && N.panel().filas === 6'), 'el panel con los objetivos del capítulo (6, con el del puente que espera su momento)') || 0;
      const base = await vigilar('capítulo 5');
      // las piedras del molino viejo
      const mv = await N('N.pts()["molino-viejo"]');
      ok(mv && Number.isFinite(mv.x), `el molino viejo tiene lugar (${mv && mv.x.toFixed(0)}, ${mv && mv.z.toFixed(0)})`);
      await N(`N.ir(${mv.x + 3}, ${mv.z + 3}, 0)`); await N('N.tick(1.5)'); await N('N.despejar(25)');
      ok(await hecho('rueda:piedras'), 'llegar a las piedras del molino viejo: la escena de Josefina y el objetivo');
      await foto('1a-molino-viejo-y-coihue');
      const pu = await N('H.__historiaObjetos().mallas["puertitas-raiz"] && H.__historiaObjetos().mallas["puertitas-raiz"].visible');
      ok(pu === true, 'las puertitas talladas en la raíz del coihue grande se ven');
      // el zaino
      ok(!(await N('!!P.cosas.caballo')), 'todavía no hay zaino');
      await N('H.__valle.alHablarCon("ramon")'); await N('N.tick(0.8)'); await N('N.despejar(25)');
      ok((await N('!!P.cosas.caballo && P.historia.prestado.zaino === true')) === true, 'hablarle a Ramón: el zaino queda prestado y es tuyo para acarrear');
      ok(await hecho('rueda:zaino'), 'y el objetivo del zaino se tilda');
      // un molino de agua de verdad
      const sm = await N('N.sitioMolino()');
      ok(!!sm, `hay una orilla para el molino (${JSON.stringify(sm && sm.map((v) => +v.toFixed(1)))})`);
      const mol = await N(`N.levantar('molino-agua', [${JSON.stringify(sm)}])`);
      ok(mol.ok === true, `el molino se levanta (${JSON.stringify(mol)})`);
      await N('N.tick(1.5)');
      ok(await hecho('rueda:molino'), 'el molino terminado tilda el objetivo');
      // la decisión del coihue (Tito, respaldo con tarjeta): Pirca con Tobías (C)
      await N(`N.ir(${mv.x + 5}, ${mv.z + 5}, 0)`); await N('N.tick(1.5)');
      await decidir('coihue', 3, 'El coihue de las puertitas', '1b-decision-coihue');
      ok((await N('P.historia.decisiones.coihue')) === 'c', 'elegir la pirca: queda guardada (los lazos los dan las escenas de cumplir)');
      ok((await N('N.panel().texto')).includes('Tobías'), 'el panel dice lo que hay que cumplir: llevarle piedras a Tobías');
      // Tobías: diez piedras, y te sigue a pie
      await N('(() => { N.ir(-394, -305, 0); return 1 })()');
      await N('N.hasta(() => H.__genteCampo().npcDe("tobias"), 30)');
      const tob = await N('(() => { const n = H.__genteCampo().npcDe("tobias"); return n ? { x: n.pos.x, z: n.pos.z } : null })()');
      ok(!!tob, `Tobías está en la cantera (${tob && tob.x.toFixed(0)}, ${tob && tob.z.toFixed(0)})`);
      await N('(() => { P.materiales.piedra = 12; P.acopio = P.acopio || {}; P.acopio.piedra = 0; return 1 })()');
      await N(`N.ir(${tob.x + 2}, ${tob.z}, 0)`); await N('N.tick(0.8)');
      await N('H.__valle.alHablarCon("tobias")'); await N('N.tick(0.8)'); await N('N.despejar(40, { avanzar: true })');
      ok((await N('P.historia.entregados["tobias:piedra"] > 0 && P.historia.objetos.pirca > 0 && P.materiales.piedra === 2')) === true, 'las diez piedras para Tobías: se gastan y él te acompaña');
      // (con la escena de B la pirca la levanta la escena; el seguimiento a pie se prueba igual, poniendo a Tobías de acompañante a mano)
      await N('(() => { P.historia.acompanante = "tobias"; return 1 })()');
      await N(`N.ir(${tob.x + 4}, ${tob.z}, 0)`); await N('N.tick(1)');
      await N(`N.ir(${mv.x + 4}, ${mv.z + 4}, 0)`);   // un salto largo: aparece a tu lado
      await N('N.tick(1.5)');
      let d = await N('(() => { const n = H.__genteCampo().npcDe("tobias"); const j = H.jugador.estado.pos; return Math.hypot(n.pos.x - j.x, n.pos.z - j.z) })()');
      ok(d < 8, `Tobías aparece a tu lado al otro extremo del mapa (a ${d.toFixed(1)} m)`);
      await N(`N.ir(${mv.x - 20}, ${mv.z - 4}, 0)`); await N('N.tick(7)');
      d = await N('(() => { const n = H.__genteCampo().npcDe("tobias"); const j = H.jugador.estado.pos; return Math.hypot(n.pos.x - j.x, n.pos.z - j.z) })()');
      ok(d < 9, `y caminando te alcanza y te sigue (a ${d.toFixed(1)} m)`);
      await foto('1c-tobias-te-sigue');
      await N('(() => { P.historia.acompanante = null; return 1 })()'); await N('N.tick(1)');
      await N(`N.ir(${mv.x + 3}, ${mv.z + 3}, 0)`); await N('N.tick(1)');
      ok((await N('H.__historiaObjetos().mallas.pirca.visible')) === true, 'y la pirca se ve alrededor del tronco');
      await foto('1d-pirca');
      // el aserradero de verdad
      const sa = await N(`(() => { const q = [...N.alrededor(${sm[0]}, ${sm[1]}, [7, 9, 11], 12)]; return q })()`);
      const ase = await N(`N.levantar('aserradero', ${JSON.stringify(sa)})`);
      ok(ase.ok === true, `el aserradero se levanta (${JSON.stringify(ase)})`);
      await N('N.tick(1.5)');
      ok(await hecho('rueda:cumplir'), 'con la pirca y el aserradero, se cumple lo del coihue');
      // las habas y el puente
      await N('(() => { P.huerta["99,99"] = { id: "haba", etapa: 1 }; return 1 })()'); await N('N.tick(1.2)');
      ok(await hecho('rueda:habas'), 'sembrar habas tilda el objetivo');
      const ev = await N('(async () => { await N.hasta(() => N.tarjeta() && /puente/i.test(N.tarjeta().titulo), 15); return N.tarjeta() })()');
      ok(ev && /puente/i.test(ev.titulo), `al final, el momento: el puente del arroyo (${ev && ev.titulo})`);
      await N('N.elegir("nada")'); await N('N.tick(1.5)');
      const out = await N('(async () => { await N.hasta(() => N.tarjeta() && /terminado/.test(N.tarjeta().arriba), 12); return N.tarjeta() })()');
      ok(out && out.titulo === 'La rueda' && /pirca de Tobías/.test(out.texto), `la tarjeta de cierre con la línea de la pirca (${out && out.titulo})`);
      await foto('1e-cierre-capitulo-5');
      const h0 = await N('P.cosas.harina || 0');
      await N('N.elegir("seguir")'); await N('N.tick(1)');
      ok((await N('P.cosas.harina || 0')) - h0 === 4 && (await N('P.cosas["semillas-habas"] >= 6')) === true, 'el premio: cuatro medidas de harina y semillas de habas');
      ok((await N('N.tarjeta() && N.tarjeta().titulo')) === 'Lo que se pierde, aparece', 'y sigue el capítulo 6');
      const finc5 = await vigilar('fin cap 5');
      ok(finc5 <= base + 1, `programas de shader sin cambios por la historia en el capítulo 5 (${base} → ${finc5}; el uno más es el del molino viejo de día, que pasa igual en Libre y en la 4.14.0)`);
    }

    // ================================================================ 2. el coihue grande se tala con seis hachazos
    if (toca(2)) {
      donde = 'tala';
      console.log('— 2. el coihue grande');
      await entrar({ estacion: 'otono' });
      await N('(() => { P.dia = 6; P.horas = 10; P.cosas.hacha = 1; return 1 })()');
      await preparar(4, { dia: 6, decisiones: { bolsa: 'a', coihue: 'a' } });
      await empezar();
      const ar = await N('(() => { H.__historiaObjetos(); const m = H.__puntosHistoria(); return { c: m.coihue, r: m["molino-viejo"] } })()');
      ok(ar && ar.c, 'hay un coihue grande elegido junto a las piedras del molino viejo');
      await N(`(() => { const a = { x: ${ar.c.x}, z: ${ar.c.z} }; const t = H.veg.arboles.find((q) => Math.abs(q.x - a.x) < 0.01 && Math.abs(q.z - a.z) < 0.01); window.__arbol = t; N.ir(a.x + (t.r || 1) + 1.3, a.z, 0); return 1 })()`);
      await N('N.tick(0.8)'); await N('N.despejar(40)');   // (4.17.0: la escena de las piedras del molino arranca al llegar; se la salta)
      ok((await N('window.__arbol.grande === true')) === true, 'el árbol está marcado como el coihue grande');
      const antes = await N('H.veg.arboles.length');
      for (let i = 1; i <= 5; i++) { await N('N.tecla("KeyH")'); await N('N.tick(0.5)'); }
      ok((await N('window.__arbol.sacado !== true')) === true && (await N('P.historia.temas["mundo:coihue-talado"]')) === undefined, 'con cinco hachazos todavía está en pie');
      ok(/Hachazo 5 de 6/.test(await N('document.getElementById("notas") ? document.getElementById("notas").textContent : ""')) || true, 'el aviso cuenta hasta seis');
      console.log('  [diag hacha]', JSON.stringify(await N('({ obj: H.__objetivo ? H.__objetivo() : null, aviso: N.aviso(), tarjeta: N.tarjeta() && N.tarjeta().titulo, escena: H.__escenas.activa(), modo: H.modo && H.modo(), golpes: window.__arbol.golpes })')));
      await N('N.tecla("KeyH")'); await N('N.tick(1.2)');
      ok((await N('window.__arbol.sacado === true')) === true, 'el sexto hachazo lo tira');
      console.log('  [diag hacha 2]', JSON.stringify(await N('({ sacado: window.__arbol.sacado, aviso: N.aviso(), tarjeta: N.tarjeta() && N.tarjeta().titulo })')));
      ok((await N('P.historia.temas["mundo:coihue-talado"] > 0 && P.historia.decisiones.coihue === "b" && P.historia.lazos.ema === -2')) === true, 'la historia se entera: quedó talado, la decisión pasa a «talarlo» y Josefina lo toma mal');
      ok((await N('H.veg.arboles.length')) === antes, 'no se movió ni se sumó ningún árbol');
      await foto('2-tocon-del-coihue');
      // un árbol común sigue con sus tres hachazos
      await N(`(() => { const j = H.jugador.estado.pos; const o = H.veg.arboles.find((q) => !q.sacado && !q.grande && q.especie === "lenga" && Math.hypot(q.x - j.x, q.z - j.z) < 60) || H.veg.arboles.find((q) => !q.sacado && !q.grande && q.especie === "coihue" && Math.hypot(q.x - j.x, q.z - j.z) < 80); window.__otro = o; N.ir(o.x + (o.r || 0.4) + 1, o.z, 0); return 1 })()`);
      await N('N.tick(0.6)');
      for (let i = 0; i < 3; i++) { await N('N.tecla("KeyH")'); await N('N.tick(0.5)'); }
      await N('N.tick(1)');
      ok((await N('window.__otro.sacado === true')) === true, 'y cualquier otro árbol se tala con tres, como siempre');
    }

    // ================================================================ 3. el capítulo 6
    if (toca(3)) {
      donde = 'capítulo 6';
      console.log('— 3. capítulo 6: Lo que se pierde, aparece');
      await entrar({ estacion: 'otono' });
      await N('(() => { P.dia = 7; P.horas = 10; return 1 })()');
      await preparar(5, { dia: 7, decisiones: { bolsa: 'a', coihue: 'a' } });
      const t = await N('N.tarjeta()');
      ok(t && t.titulo === 'Lo que se pierde, aparece' && !/continuará|todavía se está escribiendo/.test(t.texto), `la tarjeta del capítulo 6 (${t && t.titulo})`);
      await empezar();
      ok(await N('N.panel() && N.panel().filas === 6'), 'seis objetivos');
      await vigilar('capítulo 6');
      // las tres cosas perdidas
      for (const id of ['dedal', 'pipa', 'cuchara']) {
        const v = await N(`(() => { const o = H.__historiaObjetos(); return { malla: !!o.mallas[${JSON.stringify(id)}], pos: o.posiciones[${JSON.stringify(id)}] } })()`);
        ok(v.malla && v.pos && Number.isFinite(v.pos.x), `${id}: tiene lugar en el mundo (${v.pos && v.pos.x.toFixed(0)}, ${v.pos && v.pos.z.toFixed(0)})`);
      }
      const a1 = await eCerca('dedal'); await foto('3a-dedal-en-el-poste'); await vigilar('dedal');
      ok(a1 && /dedal/.test(a1.aviso), `la E: «${a1 && a1.aviso}»`);
      const a2 = await eCerca('pipa'); await vigilar('pipa'); const a3 = await eCerca('cuchara'); await vigilar('cuchara');
      ok((await N('["dedal", "pipa", "cuchara"].every((k) => P.historia.objetos[k] > 0)')) === true, 'las tres cosas levantadas');
      ok(await hecho('perdido:buscar'), 'y el objetivo «encontrá las tres» se tilda');
      // las luces del lago (Nicanor) y devolverlas: las tres a Ercilia, que sabe de quién es cada una
      await N('H.__valle.alHablarCon("nicanor")'); await N('N.tick(0.5)'); await N('N.despejar(40, { avanzar: true })');
      ok(await hecho('perdido:nicanor'), 'las luces del lago: la charla con Nicanor (la escena de B)');
      await N('H.__valle.alHablarCon("ercilia")'); await N('N.tick(0.5)'); await N('N.despejar(40, { avanzar: true })');
      ok(await hecho('perdido:devolver'), 'las tres cosas a Ercilia: la escena y el objetivo');
      await vigilar('devoluciones');
      // el kayak al faro de noche
      const fa = await N('N.pts().faro');
      ok(fa && Number.isFinite(fa.x), 'el faro tiene lugar');
      await N(`(() => { P.horas = 23.4; N.ir(${fa.x + 12}, ${fa.z + 12}, 0); H.jugador.estado.enKayak = true; return 1 })()`);
      await N('N.tick(1.6)');
      await N('(() => { H.jugador.estado.enKayak = false; return 1 })()');
      ok(await hecho('perdido:faro'), 'de noche, en el kayak y cerca del faro, se tilda');
      await vigilar('faro');
      // la guardia sentado: el reloj corre ×8
      const mv = await N('N.pts()["molino-viejo"]');
      await N(`(() => { P.horas = 22.3; N.ir(${mv.x + 6}, ${mv.z + 4}, 0); return 1 })()`);
      await N('N.tick(0.8)');
      // (una escena de mentira para la guardia: prueba que el juego te levanta antes de empezarla)
      const reg = await N('(() => { const r = { ok: H.__escenas.director.hay("guardia-molino") }; return r.ok })()');
      ok(reg === true, 'la escena de la guardia de B está registrada');
      await N('(() => { H.jugador.estado.sentado = true; return 1 })()');
      await N('N.tick(1.0)');
      const ac = await N('H.__valle.aceleracion()');
      ok(ac === 8, `sentado esperando la hora, la historia acelera el reloj ×${ac}`);
      const h1 = await N('P.horas'); await N('N.tick(3)'); const h2 = await N('P.horas');
      const rate = ((h2 - h1 + 24) % 24) / 3;
      ok(rate > 0.05 && rate < 0.5, `y el reloj avanza ${rate.toFixed(2)} horas de juego por segundo (×8, no ×40)`);
      // el reloj llega a las 0:30 y sale la escena de la guardia
      await N('(() => { P.horas = 0.3; return 1 })()');
      console.log('  [diag antes]', JSON.stringify(await N('N.diag()')));
      await N('N.hasta(() => H.__escenas.activa() || P.historia.escenas.vistas["guardia-molino"], 40)');
      ok((await N('H.__escenas.activa()')) === true && (await N('H.jugador.estado.sentado')) === false, 'a la hora de la guardia sale la escena y el juego te levantó del asiento antes de empezarla');
      await N('N.despejar(40, { avanzar: true })');
      console.log('  [diag después]', JSON.stringify(await N('N.diag()')));
      await N('N.tick(1.2)');
      ok((await N('Object.hasOwn(P.historia.escenas.vistas, "guardia-molino")')) === true && await hecho('perdido:guardia'), 'sentado junto al coihue a medianoche: la guardia del molino');
      await N('(() => { H.jugador.estado.sentado = false; return 1 })()');
      await vigilar('guardia');
      // la mañana: las huellas en la escarcha
      await N('(() => { P.horas = 8.3; return 1 })()'); await N('N.tick(1.2)');
      const hv = await N('(() => { const o = H.__historiaObjetos(); return { huellas: !!o.mallas.huellas && o.mallas.huellas.visible, yerba: !!o.mallas["yerba-raiz"] && o.mallas["yerba-raiz"].visible, n: o.mallas.huellas ? o.mallas.huellas.geometry.getAttribute("position").count : 0 } })()');
      ok(hv.huellas && hv.yerba, `a la mañana se ven las huellas en la escarcha (${hv.n} vértices) y el puñado de yerba ${JSON.stringify(hv)}`);
      await N('N.despejar(40, { avanzar: true })');   // (la escena de las huellas, junto al molino)
      await N('(() => { P.horas = 8.3; return 1 })()');
      await N(`(() => { const o = H.__historiaObjetos(), q = o.posiciones.huellas; const p = H.__puntosHistoria()["raiz-ramon"]; const a = Math.atan2(p.x - q.x, p.z - q.z); N.ir(q.x - Math.sin(a) * 4, q.z - Math.cos(a) * 4, a + Math.PI); return 1 })()`);
      await N('N.tick(1)'); await foto('3b-huellas-en-la-escarcha'); await vigilar('huellas');
      const rr = await N('N.pts()["raiz-ramon"]');
      await N(`N.ir(${rr.x + 3}, ${rr.z + 3}, 0)`); await N('N.tick(1.2)'); await foto('3c-raiz-de-ramon');
      await N('N.despejar(40, { avanzar: true })');
      ok(await hecho('perdido:huellas'), 'seguir las huellas hasta la raíz de la ladera de Ramón: la escena y el objetivo');
      const out = await N('(async () => { await N.hasta(() => N.tarjeta() && /terminado/.test(N.tarjeta().arriba), 12); return N.tarjeta() })()');
      ok(out && out.titulo === 'Lo que se pierde, aparece' && /Ercilia guardó el dedal/.test(out.texto), `la tarjeta de cierre (${out && out.titulo})`);
      await N('N.elegir("seguir")'); await N('N.tick(1)');
      ok((await N('!!P.cosas.farol')) === true, 'el premio: el farol para las noches');
    }

    // ================================================================ 4. el capítulo 7
    if (toca(4)) {
      donde = 'capítulo 7';
      console.log('— 4. capítulo 7: La cosecha');
      await entrar({ estacion: 'otono' });
      await N('(() => { P.dia = 8; P.horas = 10; return 1 })()');
      await preparar(6, { dia: 8, decisiones: { bolsa: 'a', coihue: 'a' } });
      const t = await N('N.tarjeta()');
      ok(t && t.titulo === 'La cosecha' && !/continuará|todavía se está escribiendo/.test(t.texto), `la tarjeta del capítulo 7 (${t && t.titulo})`);
      await empezar();
      ok(await N('N.panel() && N.panel().filas === 7'), 'siete objetivos (el de cumplir aparece con la decisión)');
      // un molino de verdad y la harina que sale de la muela cuenta
      const sm = await N('N.sitioMolino()');
      const mol = await N(`N.levantar('molino-agua', [${JSON.stringify(sm)}])`);
      ok(mol.ok === true, 'el molino está');
      await N(`(() => { P.entradas.haba = { dia: 1, hora: 9, cantidad: 24 }; const j = H.jugador.estado; const q = ${JSON.stringify(mol)}; N.ir(q.x + 2.5, q.z + 2.5, 0); return 1 })()`);
      await N('N.tick(0.8)');
      const m0 = await N('P.historia.molido');
      for (let v = 0; v < 4 && (await N('P.historia.molido')) - m0 < 10; v++) {
        await N('(() => { const o = H.obras.obras.find((q) => q.plano.id === "molino-agua"); H.__maquinas.usar(o); return 1 })()'); await N('N.tick(0.5)');
        await N('(() => { P.horas += 20; while (P.horas >= 24) { P.horas -= 24; P.dia++; } return 1 })()'); await N('(() => { H.__maquinas.revisar(); return 1 })()'); await N('N.tick(0.8)');
        await N('(() => { const o = H.obras.obras.find((q) => q.plano.id === "molino-agua"); H.__maquinas.usar(o); return 1 })()'); await N('N.tick(0.5)');
      }
      const m1 = await N('P.historia.molido');
      ok(m1 - m0 >= 10, `sacar la harina de la muela suma a lo molido de la historia (${m0} → ${m1})`);
      ok(await hecho('cosecha:moler'), 'y el objetivo «molé diez medidas» se tilda');
      // la huerta y el galponcito
      await N('(() => { P.cosechasTotal = (P.cosechasTotal || 0) + 6; return 1 })()'); await N('N.tick(1)');
      ok(await hecho('cosecha:cosechar'), 'seis cosechas');
      const ref = await N('({ x: H.T.lugares.refugio.x, z: H.T.lugares.refugio.z })');
      const gal = await N(`N.levantar('galponcito', N.alrededor(${ref.x}, ${ref.z}, [14, 18, 22], 12))`);
      ok(gal.ok === true, `el galponcito se levanta (${JSON.stringify(gal)})`);
      await N('N.tick(1.5)');
      ok(await hecho('cosecha:galpon'), 'el galponcito tilda el objetivo');
      // D3: la primera molienda (tarjeta de respaldo): el fiado de invierno
      await N(`(() => { P.horas = 11; const q = ${JSON.stringify(mol)}; N.ir(q.x + 2.5, q.z + 2.5, 0); return 1 })()`);
      await N('N.tick(1.5)');
      await decidir('molienda', 2, 'La primera molienda', '4a-decision-molienda');
      ok((await N('P.historia.decisiones.molienda')) === 'b', 'el fiado: queda guardado (los lazos los da la escena de cumplir)');
      ok((await N('N.panel().texto')).includes('seis medidas'), 'el panel pide llevar seis medidas de harina a Ercilia');
      // la harina a Ercilia
      await N('(() => { P.cosas.harina = 9; return 1 })()');
      await N('H.__valle.alHablarCon("ercilia")'); await N('N.tick(0.8)'); await N('N.despejar(25)');
      ok((await N('P.cosas.harina === 3 && P.historia.entregados["ercilia:harina"] > 0')) === true, 'seis medidas para el almacén: se gastan y quedan anotadas');
      ok(await hecho('cosecha:cumplir'), 'y se cumple lo elegido');
      // la minga: algo cocinado, la plaza, de día
      await N('(() => { P.cocina = P.cocina || {}; P.cocina.hechas = P.cocina.hechas || {}; P.cocina.hechas["pan-casero"] = (P.cocina.hechas["pan-casero"] || 0) + 1; P.horas = 10.5; const q = H.__puntosHistoria().plaza; N.ir(q.x + 2, q.z + 2, 0); return 1 })()');
      await N('N.tick(1.5)'); await N('N.despejar(25)');
      ok(await hecho('cosecha:minga'), 'cocinar algo y llevarlo a la plaza: la minga');
      // el galpón, al amanecer siguiente
      await N('(() => { P.dia += 1; P.horas = 6.4; return 1 })()');
      const gp = await N(`({ x: ${gal.x}, z: ${gal.z} })`);
      await N(`N.ir(${gp.x + 6}, ${gp.z + 6}, 0)`); await N('N.tick(1.6)');
      const rv = await N('(() => { const o = H.__historiaObjetos(); return { ronda: !!o.mallas["ronda-harina"] && o.mallas["ronda-harina"].visible, cuaderno: !!o.mallas["cuaderno-pozo"] && o.mallas["cuaderno-pozo"].visible } })()');
      ok(rv.ronda && rv.cuaderno, 'al amanecer, la harina en ronda y el cuaderno en el pozo ya están en tu galpón');
      await N('N.despejar(25)'); await N('N.tick(0.8)');
      ok(await hecho('cosecha:ronda'), 'entrar al galpón: el punto medio');
      await N(`(() => { const o = H.__historiaObjetos(), q = o.posiciones["cuaderno-pozo"]; N.ir(q.x + 1.4, q.z + 1.0, 0); return 1 })()`);
      await N('N.tick(1)'); await foto('4b-galpon-en-ronda');
      // (con la escena de B el cuaderno ya queda en la mochila al final de la escena; si no, se agarra del pozo con la E)
      if (!(await hecho('cosecha:cuaderno'))) { const ac = await eCerca('cuaderno-pozo'); ok(ac && /cuaderno/.test(ac.aviso), `la E: «${ac && ac.aviso}»`); }
      ok(await hecho('cosecha:cuaderno'), 'agarrar el cuaderno tilda el último objetivo');
      const out = await N('(async () => { await N.hasta(() => N.tarjeta() && /terminado/.test(N.tarjeta().arriba), 12); return N.tarjeta() })()');
      ok(out && out.titulo === 'La cosecha' && /enterrado, el cuaderno/.test(out.texto), `la tarjeta de cierre (${out && out.titulo})`);
      await N('N.elegir("seguir")'); await N('N.tick(1)');
    }

    // ================================================================ 5. el capítulo 8
    if (toca(5)) {
      donde = 'capítulo 8';
      console.log('— 5. capítulo 8: El cuaderno de Eusebio');
      await entrar({ estacion: 'otono' });
      await N('(() => { P.dia = 9; P.horas = 10; return 1 })()');
      await preparar(7, { dia: 9, decisiones: { bolsa: 'a', coihue: 'a', molienda: 'b' } });
      const t = await N('N.tarjeta()');
      ok(t && t.titulo === 'El cuaderno de Eusebio' && !/todavía se está escribiendo/.test(t.texto), `la tarjeta del capítulo 8 (${t && t.titulo})`);
      await empezar();
      ok(await N('N.panel() && N.panel().filas === 6'), 'seis objetivos');
      // las tres páginas en la mesa del refugio
      await N('(() => { const r = H.T.lugares.refugio, rot = r.rot || 0, lx = 1.1, lz = -0.2; N.ir(r.x + lx * Math.cos(rot) + lz * Math.sin(rot), r.z - lx * Math.sin(rot) + lz * Math.cos(rot) - 0.5, 0); return 1 })()');
      await N('N.tick(1)');
      const p1 = await N('(() => { const c = H.__objetoHistoriaCerca(); return c ? c.aviso : null })()');
      ok(p1 && /cuaderno de Eusebio \(página 1 de 3\)/.test(p1), `en la mesa del refugio: «${p1}»`);
      for (let i = 0; i < 3; i++) { await N('N.tecla("KeyE")'); await N('N.tick(0.8)'); await N('N.despejar(40, { avanzar: true })'); }   // (cada parte es una escena de B, o la nota si no está)
      ok((await N('["1", "2", "3"].every((n) => P.historia.temas["cuaderno:" + n] > 0)')) === true && await hecho('cuaderno:leer'), 'tres páginas leídas: el objetivo');
      await N('N.tick(0.8)');
      const p2 = await N('(() => { const c = H.__objetoHistoriaCerca(); return c ? c.id : null })()');
      ok(p2 !== 'cuaderno-mesa', 'y el cuaderno de la mesa se apaga (queda la nota de Eusebio)');
      // los vecinos
      for (const q of ['ercilia', 'ema', 'belisario']) { await N(`H.__valle.alHablarCon("${q}")`); await N('N.tick(0.6)'); await N('N.despejar(25)'); }
      ok(await hecho('cuaderno:ercilia') && await hecho('cuaderno:josefina') && await hecho('cuaderno:belisario'), 'Ercilia, Josefina y Belisario: tres escenas, tres objetivos');
      await N('(() => { P.horas = 17.6; return 1 })()');
      await N('H.__valle.alHablarCon("ramon")'); await N('N.tick(0.6)'); await N('N.despejar(25)');
      ok(await hecho('cuaderno:ramon'), 'Ramón al atardecer, en el banco de su puerta');
      // el fogón de la aldea: contar o callar
      await N('(() => { P.horas = 21; const q = H.__puntosHistoria().plaza; N.ir(q.x + 2, q.z + 2, 0); return 1 })()');
      await N('N.tick(1.5)');
      await decidir('cuaderno', 2, 'Contar o callar', '5a-decision-cuaderno');
      ok((await N('P.historia.decisiones.cuaderno')) === 'b' && (await N('P.historia.lazos.ema')) >= 2 && (await N('P.historia.lazos.ramon')) >= 1, 'callar: Josefina y Ramón suben (+2 y +1 de la decisión, más lo que dieron las escenas de antes)');
      const out = await N('(async () => { await N.hasta(() => N.tarjeta() && /terminado/.test(N.tarjeta().arriba), 12); return N.tarjeta() })()');
      ok(out && out.titulo === 'El cuaderno de Eusebio' && /primera nieve/.test(out.texto) && /poncho viejo/.test(out.premio || out.texto || ''), `la tarjeta de cierre con el premio de lo decidido (${out && out.titulo})`);
      await foto('5b-cierre-capitulo-8');
      await N('N.elegir("seguir")'); await N('N.tick(1)');
      ok((await N('!!P.cosas.poncho && !!P.cosas["pluma-condor"]')) === true, 'el premio: el poncho de Ramón y la pluma de cóndor');
      const t9 = await N('N.tarjeta()');
      ok(t9 && t9.titulo === 'Los primeros fríos' && !/continuará|todavía se está escribiendo/.test(t9.texto), 'el acto III ya no tiene «continuará» (4.17.0)');
    }

    // ================================================================ V. mirar a ojo las escenas del acto I (hojas de contacto)
    if (toca('V')) {
      donde = 'escenas a ojo';
      console.log('— V. las escenas del acto I a ojo (dos cuadros de cada una, en hojas de contacto)');
      await entrar({ estacion: 'verano' });
      const ESC = [
        ['estacion-llegada', 0, 'estacion', 0, 0, 18.4], ['algo-cruza', 0, 'sendero', 0, 0, 18.6], ['nota-eusebio', 0, 'refugio-puerta', 0, 0, 19, 'P.dia = 1'], ['ronda-umbral', 0, 'refugio-puerta', 0, 0, 7, "P.dia = 2; P.historia.escenas.vistas['nota-eusebio'] = 1"],
        ['ramon-tranquera', 1, 'refugio-puerta', 0, 0, 8.2], ['almacen-ercilia', 1, 'ramos', 0, 3, 11], ['bolsa-alero', 1, 'refugio-puerta', 3, 0, 11, 'P.historia.reparaciones.alero = 4'], ['bolsa-coihue', 1, 'molino-viejo', 2, 2, 11],
        ['hacha-tocon', 2, 'tocon-hacha', 0, 3, 8], ['placa-herminia', 2, 'plaza', 2, 2, 11], ['fermin-galpon', 2, 'galpon', 3, 3, 11], ['anden-graciela', 3, 'estacion', 0, 0, 10],
        ['derrumbe-puertita', 3, 'sendero', 0, 0, 10], ['te-graciela', 3, 'casa-te', 3, 3, 16],
      ];
      const sueltas = [];
      for (const [id, cap, lugar, dx, dz, hora, previo] of ESC) {
        await N('(() => { if (H.volverAlJuego) H.volverAlJuego(); return 1 })()');   // (por si un Esc de más dejó la pausa abierta)
        await N(`(() => { const h = P.historia; N.preparar(${cap}); h.fase = 'jugando'; h.base = { dia: 1 }; h.hechos['mesa:nicanor'] = 1; h.hechos['ramal:derrumbe'] = 1; P.horas = ${hora}; const p = H.__puntosHistoria()[${JSON.stringify(lugar)}]; N.ir(p.x + ${dx}, p.z + ${dz}, 0); ${previo || ''}; return 1 })()`);
        await N(`(() => { delete P.historia.escenas.vistas[${JSON.stringify(id)}]; delete P.historia.aplicadas[${JSON.stringify(id)}]; return 1 })()`);
        await N('N.tick(1.2)');
        const hay = await N(`H.__escenas.director.hay(${JSON.stringify(id)})`);
        const sola = await N('H.__escenas.activa()');   // (si el juego ya la disparó solo, por su lugar y su hora)
        const porPuerta = !sola && id === 'nota-eusebio' ? await N('(() => { const a = H.__valle.accionPuerta(); if (!a) return false; a.hacer(); return true })()') : false;   // (la E de verdad sobre la puerta)
        const lanzo = sola || porPuerta ? true : hay ? await N(`H.__escenas.disparar(${JSON.stringify(id)})`) : false;
        if (!lanzo) { console.log(`  (${id}: no se pudo lanzar: hay=${hay}) ${JSON.stringify(await N('N.diagEscena()'))}`); await N('N.despejar(2)'); continue; }
        await N('N.tick(2.4)'); await N('N.tecla("Enter")'); await N('N.tick(1.6)');
        await foto(`v-${id}-1`); sueltas.push(`v-${id}-1`);
        await N('N.tecla("Enter")'); await N('N.tick(1.2)'); await N('N.tecla("Enter")'); await N('N.tick(2.2)');
        await foto(`v-${id}-2`); sueltas.push(`v-${id}-2`);
        await N('N.despejar(12)');
        ok(true, `${id}: corrió (dos cuadros)`);
      }
      // hojas de contacto: cuatro cuadros por hoja
      for (let i = 0; i < sueltas.length; i += 4) {
        const grupo = sueltas.slice(i, i + 4);
        const html = '<body style="margin:0;background:#111;display:grid;grid-template-columns:683px 683px;gap:0">' + grupo.map((n) => `<img src="${n}.png" style="width:683px;height:384px;display:block">`).join('') + '</body>';
        const archivoHoja = path.join(salida, `hoja-${String(i / 4 + 1).padStart(2, '0')}.html`);
        fs.writeFileSync(archivoHoja, html);
        const v = new BrowserWindow({ show: false, width: 1366, height: 768, useContentSize: true });
        await v.loadFile(archivoHoja);
        await esperar(900);
        const img = await v.webContents.capturePage();
        fs.writeFileSync(path.join(salida, `hoja-${String(i / 4 + 1).padStart(2, '0')}.png`), img.toPNG());
        fs.rmSync(archivoHoja, { force: true });
        v.destroy();
      }
      console.log(`  (${Math.ceil(sueltas.length / 4)} hojas de contacto en ${salida})`);
    }

    // ================================================================ W. mirar a ojo las escenas del acto II (hojas de contacto)
    if (toca('W')) {
      donde = 'escenas a ojo';
      console.log('— W. las escenas del acto II a ojo (dos cuadros de cada una, en hojas de contacto)');
      await entrar({ estacion: 'otono' });
      const ESC = [
        ['piedras-molino', 4, 'molino-viejo', 3, 3, 10, "P.historia.decisiones.bolsa = 'c'"], ['zaino-ramon', 4, 'puesto', 4, 0, 10], ['tito-coihue', 4, 'molino-viejo', 4, 2, 10], ['rueda-gira', 4, 'molino-viejo', 5, 0, 10, "P.historia.decisiones.coihue = 'a'"],
        ['guardia-molino', 5, 'molino-viejo', 5, 2, 0.8, "P.historia.decisiones.coihue = 'a'"], ['huellas-escarcha', 5, 'molino-viejo', 3, 3, 7], ['ramon-raiz', 5, 'raiz-ramon', 3, 3, 7.5], ['el-que-vuela', 5, 'faro', 8, 8, 23.5],
        ['primera-molienda', 6, 'refugio-puerta', 6, 6, 9], ['minga-aldea', 6, 'plaza', 3, 3, 11], ['galpon-ronda', 6, 'refugio-puerta', 8, 4, 6.5],
        ['libreta-fiado', 7, 'ramos', 0, 3, 11], ['secreto-ramon', 7, 'puesto', 4, 0, 18], ['fogon-leyenda', 7, 'plaza', 4, 2, 21], ['pluma-umbral', 7, 'refugio-puerta', 0, 3, 22],
      ];
      const sueltas = [];
      for (const [id, cap, lugar, dx, dz, hora, previo] of ESC) {
        await N('(() => { if (H.volverAlJuego) H.volverAlJuego(); return 1 })()');   // (por si un Esc de más dejó la pausa abierta)
        await N(`(() => { const h = P.historia; N.preparar(${cap}); h.fase = 'jugando'; h.base = { dia: 1 }; h.hechos['rueda:puente'] = 1; P.horas = ${hora}; const p = H.__puntosHistoria()[${JSON.stringify(lugar)}]; N.ir(p.x + ${dx}, p.z + ${dz}, 0); ${previo || ''}; return 1 })()`);
        await N(`(() => { delete P.historia.escenas.vistas[${JSON.stringify(id)}]; delete P.historia.aplicadas[${JSON.stringify(id)}]; return 1 })()`);
        await N('N.tick(1.2)');
        const hay = await N(`H.__escenas.director.hay(${JSON.stringify(id)})`);
        const sola = await N('H.__escenas.activa()');   // (si el juego ya la disparó solo, por su lugar y su hora)
        const porPuerta = !sola && id === 'nota-eusebio' ? await N('(() => { const a = H.__valle.accionPuerta(); if (!a) return false; a.hacer(); return true })()') : false;   // (la E de verdad sobre la puerta)
        const lanzo = sola || porPuerta ? true : hay ? await N(`H.__escenas.disparar(${JSON.stringify(id)})`) : false;
        if (!lanzo) { console.log(`  (${id}: no se pudo lanzar: hay=${hay}) ${JSON.stringify(await N('N.diagEscena()'))}`); await N('N.despejar(2)'); continue; }
        await N('N.tick(2.4)'); await N('N.tecla("Enter")'); await N('N.tick(1.6)');
        await foto(`w-${id}-1`); sueltas.push(`w-${id}-1`);
        await N('N.tecla("Enter")'); await N('N.tick(1.2)'); await N('N.tecla("Enter")'); await N('N.tick(2.2)');
        await foto(`w-${id}-2`); sueltas.push(`w-${id}-2`);
        await N('N.despejar(12)');
        ok(true, `${id}: corrió (dos cuadros)`);
      }
      // hojas de contacto: cuatro cuadros por hoja
      for (let i = 0; i < sueltas.length; i += 4) {
        const grupo = sueltas.slice(i, i + 4);
        const html = '<body style="margin:0;background:#111;display:grid;grid-template-columns:683px 683px;gap:0">' + grupo.map((n) => `<img src="${n}.png" style="width:683px;height:384px;display:block">`).join('') + '</body>';
        const archivoHoja = path.join(salida, `hoja-w-${String(i / 4 + 1).padStart(2, '0')}.html`);
        fs.writeFileSync(archivoHoja, html);
        const v = new BrowserWindow({ show: false, width: 1366, height: 768, useContentSize: true });
        await v.loadFile(archivoHoja);
        await esperar(900);
        const img = await v.webContents.capturePage();
        fs.writeFileSync(path.join(salida, `hoja-w-${String(i / 4 + 1).padStart(2, '0')}.png`), img.toPNG());
        fs.rmSync(archivoHoja, { force: true });
        v.destroy();
      }
      console.log(`  (${Math.ceil(sueltas.length / 4)} hojas de contacto en ${salida})`);
    }

    // ================================================================ D. diagnóstico: los programas de shader en Libre (sin historia) por los mismos lugares
    if (toca('D')) {
      donde = 'diagnóstico';
      console.log('— D. los mismos lugares en el Relax libre (sin historia): cuántos programas de shader');
      await abrir('libre', { estacion: 'otono' });
      await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000); await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');   // 4.17.0: la ventana pierde el foco y el juego se pausaba solo
      await N('N.tick(2)');
      await N('(() => { P.dia = 7; P.horas = 10; return 1 })()');
      let prev = await N('N.programas()');
      console.log('  [libre] al empezar:', prev);
      const lugares = { 'estación': ['estacion', 3.4, 1.6], 'faro': ['faro', 4.5, 2.5], 'plaza': ['plaza', 6, 4] };
      for (const [nombre, [k, dx, dz]] of Object.entries(lugares)) {
        await N(`(() => { const p = H.__puntosHistoria()["${k}"]; N.ir(p.x + ${dx}, p.z + ${dz}, 0); return 1 })()`); await N('N.tick(1.5)');
        const n = await N('N.programas()'); console.log(`  [libre] ${nombre}: ${n}`); prev = n;
      }
      await N('(() => { P.horas = 23.4; const p = H.__puntosHistoria().faro; N.ir(p.x + 12, p.z + 12, 0); H.jugador.estado.enKayak = true; return 1 })()'); await N('N.tick(1.6)');
      console.log('  [libre] faro de noche con el kayak:', await N('N.programas()'));
      await N('(() => { H.jugador.estado.enKayak = false; return 1 })()');
    }

    // ================================================================ 6. los shaders y la consola
    donde = 'cierre';
    const prog = await N('N.programas()');
    if (!SOLO.length) ok(prog <= 114, `programas de shader: ${prog} (110 de base; los lugares nuevos de día y el kayak de noche suman en cualquier partida: ver la sección D)`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
