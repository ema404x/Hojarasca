// Partida real 4.26.5 (C): cacería de bugs en lo que se hace en el pueblo. Recorre la Aldea y su andén (de día, al ocaso y de noche; en Alta y en Baja):
//   anden   · el puesto de cargas (la E, comprar, vender, fletes, el panel al alejarse y al irse el tren) y subir y bajar de la trochita
//   mochila · tirar, juntar y Mayús+V en la plaza, en el andén, adentro de una casa y arriba de la trochita; guardar y cargar con eso
//   guardar · guardar y cargar parado en una casa, en el andén y arriba de la trochita (parada en la Aldea)
//   pedidos · el pedido de un vecino (la rueda, el texto, entregar, el cupo)
//   avisos  · los textos de pantalla en el pueblo
//   historia· la Historia pasando por el pueblo
//   desafio · el Desafío en el pueblo
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-26-5-c.ps1 [-Partes anden,mochila]
//   HUMO_PARTES=... · HTML=<otra página> · HUMO_SALIDA=<carpeta> · HUMO_CALIDAD=media|baja|alta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-26-5-c'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const PARTES = (process.env.HUMO_PARTES || 'anden,mochila,guardar,pedidos,avisos,historia,desafio').split(',');
const parte = (p) => PARTES.includes(p);
const CALIDAD = process.env.HUMO_CALIDAD || 'media';

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.tecla = (code, shift = false) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, shiftKey: shift, bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, shiftKey: shift, bubbles: true })); return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  N.aviso = () => { const a = document.getElementById('aviso'); return a && !a.classList.contains('oculto') ? a.innerText.replace(/\s+/g, ' ') : ''; };
  N.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => (n.__titulo || '') + ' / ' + (n.__sub || ''));
  N.esperarNota = async (re, seg = 6) => { const r = new RegExp(re); for (let i = 0; i < seg * 4; i++) { const n = N.notas().find((x) => r.test(x)); if (n) return n; await N.tick(0.25); } return ''; };
  N.fundido = () => document.getElementById('fundido').classList.contains('activo');
  N.tren = (o) => { const t = H.tren, e = t.est; e.subido = false; e.conduce = false; e.varado = false; e.esperaNieve = 0;
    if (o.parado) { e.s = t.poste(o.parada) % t.largo; e.parado = o.parado; e.vel = 0; e.proxima = o.parada; }
    else { e.s = (t.poste(o.parada) + o.metros) % t.largo; e.parado = 0; e.vel = 7; const i = t.paradas.indexOf(o.parada); e.proxima = t.paradas[(i + 1) % t.paradas.length]; }
    return 1; };
  N.aldea = () => H.tren.paradas.find((q) => q.aldea);
  N.panelCargas = () => { const p = document.getElementById('cargas') || document.querySelector('.panel-cargas'); return p ? { oculto: p.classList.contains('oculto'), texto: p.innerText.replace(/\s+/g, ' ').slice(0, 900) } : null; };
  N.paneles = () => [...document.querySelectorAll('.panel, [id^=panel], #charla, #almacen, #feria, #cargas')].filter((e) => e.offsetParent !== null).map((e) => e.id || e.className);
  N.aldeaEntera = () => { const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0; const a = P.aldea;
    const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', ceramista: 'ceramica' };
    const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
    a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
    A.actualizar(4, H.camara.position); return ks.length; };
  N.ranura = async (re) => { for (let i = 1; i <= 8; i++) { N.tecla('Digit' + i); await N.tick(0.08); if (re.test(H.__ranuraActual())) return H.__ranuraActual(); } return ''; };
  N.npc = (k) => H.gente.gente.find((g) => (g.claveAldea || g.clave) === k);
  N.charla = () => ({ abierta: !document.getElementById('charla').classList.contains('oculto'), texto: document.getElementById('charla-texto').textContent });
  N.mirarA = (x, z, hx, hz) => { H.jugador.ubicar(x, z, Math.atan2(-(hx - x), -(hz - z))); H.jugador.estado.sentado = false; return 1; };
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
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, t = H.tren; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const foto = async (nombre) => {
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(700 + intento * 600);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2)');
    for (let k = 0; k < 6 && (await N('N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }
  };
  const abrir = async (o, limpiar) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`${limpiar ? 'localStorage.clear(); ' : ''}${ajustes(o)}`);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    if (!(await esperarJuego())) throw new Error('el juego no cargó');
  };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre;
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    await js(`(() => { const H = window.__hojarasca; if (H) H.__camaraFija = null; return 1 })()`).catch(() => 0);
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas del juego ' + fallas.slice(0, 200)); }
  };
  const sonda = async (q) => { try { return await N(q); } catch (e) { return 'ERROR ' + (e && e.message); } };
  let prog0 = 0;
  try {
    await abrir({ calidad: CALIDAD }, true);
    await entrar();
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; P.horas = 11; return 1 })()');
    console.log('  locales abiertos:', await N('N.aldeaEntera()'));
    await N('N.tick(3)');
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);
    // -- sonda inicial: dónde está todo
    console.log('  sonda:', JSON.stringify(await sonda(`(() => { const p = N.aldea(); return { nombre: p.nombre, anden: p.anden, cargas: p.cargas, espera: p.espera, campana: p.campana, tieneCargas: !!p.cargas, claves: Object.keys(p) } })()`)));

    // ---------------------------------------------------------------- 1. el andén y el puesto de cargas
    await seccion('anden', async () => {
      console.log('— 1. el andén de la Aldea: el puesto de cargas, comprar, vender, fletes, subir y bajar');
      await N('N.tren({ parada: N.aldea(), parado: 80 })');
      await N('(() => { const p = N.aldea(); N.mirarA(p.cargas.x + 1.2, p.cargas.z + 0.6, p.cargas.x, p.cargas.z); P.economia && (P.economia.pesos = 20000); return 1 })()');
      await N('N.tick(0.8)');
      console.log('  aviso junto al puesto:', JSON.stringify(await N('N.aviso()')), ' tren parado:', await N('t.est.parado'));
      await foto('1a-puesto-cargas-dia');
      await N('N.tecla("KeyE")'); await N('N.tick(0.4)');
      console.log('  panel tras E:', JSON.stringify(await N('N.panelCargas()')));
      await foto('1b-panel-cargas');
      // comprar la primera fila que se pueda
      const antes = await N('({ pesos: P.economia && P.economia.pesos, mochila: JSON.stringify(P.materiales) + JSON.stringify(P.cosas) })');
      await N('N.tecla("Digit1")'); await N('N.tick(0.4)');
      const desp = await N('({ pesos: P.economia && P.economia.pesos, mochila: JSON.stringify(P.materiales) + JSON.stringify(P.cosas), notas: N.notas().slice(-2) })');
      console.log('  compra 1:', JSON.stringify(antes), '→', JSON.stringify(desp));
      await N('N.tecla("Tab")'); await N('N.tick(0.3)');
      console.log('  panel en Vender:', JSON.stringify(await N('N.panelCargas()')));
      await N('N.tecla("Tab")'); await N('N.tick(0.3)');
      console.log('  panel en Fletes:', JSON.stringify(await N('N.panelCargas()')));
      await N('N.tecla("Digit1")'); await N('N.tick(0.4)');
      console.log('  notas tras tomar un flete:', JSON.stringify(await N('N.notas().slice(-2)')), 'fletes:', await N('JSON.stringify(H.__hojarasca ? 0 : 0)'));
      // se aleja con el panel abierto
      await N('(() => { const p = N.aldea(); H.jugador.ubicar(p.cargas.x + 14, p.cargas.z + 14, 0); return 1 })()'); await N('N.tick(0.6)');
      console.log('  panel al alejarse:', JSON.stringify(await N('N.panelCargas()')));
      ok(await N('(N.panelCargas() || { oculto: true }).oculto'), 'el panel de cargas se cierra al alejarse');
      // el tren se va con el panel abierto y el jugador cerca
      await N('(() => { const p = N.aldea(); N.mirarA(p.cargas.x + 1.2, p.cargas.z + 0.6, p.cargas.x, p.cargas.z); return 1 })()'); await N('N.tick(0.6)');
      await N('N.tecla("KeyE")'); await N('N.tick(0.4)');
      await N('(() => { t.est.parado = 0.2; return 1 })()'); await N('N.tick(3)');
      console.log('  panel con el tren yéndose:', JSON.stringify(await N('N.panelCargas()')), ' tren s/vel:', await N('t.est.vel'));
      await N('N.tecla("Escape")'); await N('N.tick(0.3)');
      for (const [hora, nom] of [[19.3, 'ocaso'], [23, 'noche']]) {
        await N(`(() => { P.horas = ${hora}; N.tren({ parada: N.aldea(), parado: 80 }); const p = N.aldea(); N.mirarA(p.cargas.x + 1.2, p.cargas.z + 0.6, p.cargas.x, p.cargas.z); return 1 })()`); await N('N.tick(2.5)');
        console.log(`  [${nom}] aviso:`, JSON.stringify(await N('N.aviso()')));
        await N('N.tecla("KeyE")'); await N('N.tick(0.6)');
        ok(!(await N('N.panelCargas().oculto')), `${nom}: la E abre el panel de cargas`);
        await foto(`1c-panel-${nom}`);
        await N('N.tecla("Escape")'); await N('N.tick(0.3)');
        await N('N.tecla("KeyE")'); await N('N.tick(0.3)'); await N('N.tecla("KeyE")'); await N('N.tick(0.3)');
        console.log(`  [${nom}] E dos veces (abre y cierra): panel oculto =`, await N('N.panelCargas().oculto'));
        await foto(`1d-puesto-${nom}`);
      }
      await N('(() => { P.horas = 11; return 1 })()');
    });

    // ---------------------------------------------------------------- 2. mochila: tirar y juntar en el pueblo
    await seccion('mochila', async () => {
      console.log('— 2. la mochila en el pueblo: tirar en la plaza, en el andén, adentro de una casa y arriba de la trochita');
      await N('(() => { P.horas = 11; P.materiales = P.materiales || {}; P.materiales.tronco = 9; P.materiales.tabla = 8; P.ramitas = 5; P.cosas = P.cosas || {}; P.cosas.yerba = 5; return 1 })()');
      const lugares = await N(`(() => { const A = H.__aldeaMundo(); const pl = A.estadoEdificio('plaza'); const pa = A.estadoEdificio('panaderia'); const q = N.aldea();
        return { plaza: pl && pl.sitio, panaderia: pa && { sitio: pa.sitio, puertas: pa.puertas }, anden: q.anden } })()`);
      console.log('  lugares:', JSON.stringify(lugares));
      const tirar = async (etiqueta, ranuraRe, shift = false) => {
        const r = await N(`N.ranura(${ranuraRe})`);
        const a0 = await N('({ n: (H.objetos.bultos() || []).length, mat: JSON.stringify(P.materiales) })');
        await N(`N.tecla("KeyV", ${shift})`); await N('N.tick(0.5)');
        const b = await N('(H.objetos.bultos() || []).map((b) => ({ id: b.carga && b.carga.id, n: b.carga && b.carga.n, x: +b.x.toFixed(2), y: b.y === null ? null : +b.y.toFixed(2), z: +b.z.toFixed(2) }))');
        const j = await N('({ x: +H.jugador.estado.pos.x.toFixed(2), y: +H.jugador.estado.pos.y.toFixed(2), z: +H.jugador.estado.pos.z.toFixed(2), suelo: +H.T.altura(H.jugador.estado.pos.x, H.jugador.estado.pos.z).toFixed(2) })');
        console.log(`  [${etiqueta}] mano «${r}» · jugador ${JSON.stringify(j)} · bultos ${JSON.stringify(b)} · notas ${JSON.stringify(await N('N.notas().slice(-1)'))}`);
        return b;
      };
      // la plaza
      if (lugares.plaza) {
        await N(`N.mirarA(${lugares.plaza.x} + 6, ${lugares.plaza.z} + 6, ${lugares.plaza.x}, ${lugares.plaza.z})`); await N('N.tick(0.8)');
        await tirar('plaza', '/tronco/i', true);
        await foto('2a-plaza-bulto');
      }
      // el andén
      await N('N.tren({ parada: N.aldea(), parado: 120 })');
      await N('(() => { const p = N.aldea(); N.mirarA(p.anden.x, p.anden.z + 1.5, p.anden.x + 3, p.anden.z + 1.5); return 1 })()'); await N('N.tick(0.8)');
      await tirar('andén', '/tabla/i');
      await foto('2b-anden-bulto');
      // adentro de la panadería
      if (lugares.panaderia) {
        const s = lugares.panaderia.sitio;
        const dentro = await N(`(() => { const A = H.__aldeaMundo(); let q = null; for (let r = 0; r < 4 && !q; r += 0.5) for (let a = 0; a < 6.28 && !q; a += 0.5) { const x = ${s.x} + Math.cos(a) * r, z = ${s.z} + Math.sin(a) * r; if (A.interiorDe({ x, y: H.T.altura(x, z) + 1.5, z })) q = { x, z }; } if (q) { N.mirarA(q.x, q.z, ${s.x}, ${s.z}); } return q })()`);
        console.log('  punto adentro de la panadería:', JSON.stringify(dentro));
        if (dentro) { await N('N.tick(1.2)'); const b = await tirar('panadería', '/tabla/i'); await foto('2c-casa-bulto'); }
      }
      // arriba de la trochita
      await N('(() => { const p = N.aldea(); H.jugador.ubicar(p.anden.x, p.anden.z, 0); t.subir(H.jugador); H.jugador.estado.enTren = true; return 1 })()'); await N('N.tick(0.8)');
      await tirar('arriba del tren', '/tronco/i');
      await N('N.tecla("KeyE")'); await N('N.tick(0.4)');
      console.log('  aviso arriba del tren:', JSON.stringify(await N('N.aviso()')));
      await N('(() => { t.soltar && 0; t.bajar(H.jugador); return 1 })()'); await N('N.tick(0.5)');
      // juntar cada uno parado al lado
      const todos = await N('(H.objetos.bultos() || []).map((b) => ({ x: b.x, y: b.y, z: b.z, id: b.carga.id, n: b.carga.n }))');
      for (const b of todos) {
        await N(`(() => { H.jugador.ubicar(${b.x} + 1.0, ${b.z} + 0.6, Math.atan2(1.0, 0.6)); H.jugador.estado.pitch = -0.7; return 1 })()`); await N('N.tick(1)');
        const av = await N('N.aviso()');
        await N('N.tecla("KeyE")'); await N('N.tick(0.5)');
        const quedan = await N('(H.objetos.bultos() || []).length');
        console.log(`  junto «${b.id}» (${b.n}) en (${b.x.toFixed(1)}, ${b.z.toFixed(1)}): aviso «${av}» · bultos que quedan ${quedan} · mat ${await N('JSON.stringify(P.materiales)')}`);
      }
    });

    // ---------------------------------------------------------------- 3. guardar y cargar parado en el pueblo
    await seccion('guardar', async () => {
      console.log('— 3. guardar y cargar parado en el pueblo');
      const probar = async (etiqueta, poner) => {
        await N(poner); await N('N.tick(1.2)');
        const antes = await N('({ x: +H.jugador.estado.pos.x.toFixed(2), y: +H.jugador.estado.pos.y.toFixed(2), z: +H.jugador.estado.pos.z.toFixed(2), enTren: !!H.jugador.estado.enTren })');
        await N('H.guardar()');
        const g = await N('JSON.stringify(P.pos)');
        await abrir({ calidad: CALIDAD }, false); await entrar();
        await N('N.tick(1)');
        const d = await N('({ x: +H.jugador.estado.pos.x.toFixed(2), y: +H.jugador.estado.pos.y.toFixed(2), z: +H.jugador.estado.pos.z.toFixed(2), enTren: !!H.jugador.estado.enTren, dist: Math.hypot(H.jugador.estado.pos.x - N.aldea().anden.x, H.jugador.estado.pos.z - N.aldea().anden.z), interior: !!(H.__aldeaMundo().interiorDe({ x: H.jugador.estado.pos.x, y: H.jugador.estado.pos.y + 1.5, z: H.jugador.estado.pos.z })) })');
        console.log(`  [${etiqueta}] antes ${JSON.stringify(antes)} · guardado ${g} · cargado ${JSON.stringify(d)}`);
        await foto('3-' + etiqueta.replace(/\W+/g, '-'));
        return { antes, d };
      };
      await N('(() => { const A = H.__aldeaMundo(); window.__N.pan = A.estadoEdificio("panaderia").sitio; return 1 })()');
      await probar('andén', `(() => { N.tren({ parada: N.aldea(), parado: 120 }); const p = N.aldea(); H.jugador.ubicar(p.anden.x, p.anden.z, 0); H.jugador.estado.enTren = false; return 1 })()`);
      const casa = await probar('casa', `(() => { const A = H.__aldeaMundo(), s = A.estadoEdificio("panaderia").sitio; let q = null; for (let r = 0; r < 4 && !q; r += 0.5) for (let a = 0; a < 6.28 && !q; a += 0.5) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r; if (A.interiorDe({ x, y: H.T.altura(x, z) + 1.5, z })) q = { x, z }; } if (q) H.jugador.ubicar(q.x, q.z, 0); return 1 })()`);
      ok(casa.d.interior, 'guardado adentro de la panadería, se carga adentro');
      const tren = await probar('arriba de la trochita', `(() => { N.tren({ parada: N.aldea(), parado: 120 }); const p = N.aldea(); H.jugador.ubicar(p.anden.x, p.anden.z, 0); t.subir(H.jugador); H.jugador.estado.enTren = true; return 1 })()`);
      ok(tren.d.dist < 30, 'guardado arriba de la trochita parada en la Aldea, se carga en la Aldea (a ' + Math.round(tren.d.dist) + ' m del andén)');
    });

    // ---------------------------------------------------------------- 4. un pedido de un vecino: pedirlo, juntarlo y entregarlo
    await seccion('pedidos', async () => {
      console.log('— 4. un pedido de la panadera: el texto, entregarlo, que no se repita y el cupo del día');
      await N('(() => { P.dia = 19; P.horas = 11; if (P.economia) P.economia.pesos = 0; const n = P.negocios || (P.negocios = {}); n.rep = n.rep || {}; n.pedidos = {}; n.fijos = {}; n.cajas = n.cajas || {}; n.rep.panadera = 20; n.cajas.panadera = 6000; if (P.granja) P.granja.vaca = null; return 1 })()');
      await N('(() => { const s = H.__aldeaMundo().estadoEdificio("plaza").sitio; H.jugador.ubicar(s.x + 4, s.z + 4, 0); return 1 })()'); await N('N.tick(2)');
      for (let i = 0; i < 12 && !(await N('!!N.npc("panadera")')); i++) { await N('(() => { H.__aldea.actualizar(2); return 1 })()'); await N('N.tick(1.5)'); }
      console.log('  vecinos a mano:', await N('H.gente.gente.filter((g) => g.claveAldea || /poblador/.test(g.clave || "")).map((g) => g.claveAldea || g.clave).join(",")'));
      const hablar = async (k) => {
        await N(`(() => { const g = N.npc("${k}"); const p = g.g.position, a = g.g.rotation.y, x = p.x + Math.sin(a) * 1.4, z = p.z + Math.cos(a) * 1.4; H.jugador.ubicar(x, z, Math.atan2(-(p.x - x), -(p.z - z))); return 1 })()`); await N('N.tick(0.4)');
        await N(`(() => { H.hablar(N.npc("${k}")); return 1 })()`); await N('N.tick(0.3)');
        for (let i = 0; i < 4 && !(await N('H.__rueda().abierta')); i++) { await N('N.tecla("KeyE")'); await N('N.tick(0.25)'); }
        const eligio = await N('H.__elegirEnRueda("¿Qué tenés para hoy?")'); await N('N.tick(0.3)');
        const vistos = [];
        for (let i = 0; i < 6; i++) { const c = await N('N.charla()'); vistos.push(c.texto); if (!c.abierta) break; await N('N.tecla("KeyE")'); await N('N.tick(0.25)'); }
        return { eligio, textos: vistos };
      };
      const cerrar = async () => { for (let i = 0; i < 8 && (await N('N.charla().abierta')); i++) { await N('N.tecla("Escape")'); await N('N.tick(0.2)'); } };
      const h1 = await hablar('panadera');
      console.log('  1.ª charla:', JSON.stringify(h1.textos));
      await cerrar();
      const txt = h1.textos.join(' ');
      const m = /necesitando (\d+) (.+?) \(hasta el día (\d+)/.exec(txt);
      ok(!!m, 'la panadera pide algo («' + (m && m[0]) + '»)');
      if (m) {
        const n = Number(m[1]);
        await N(`(() => { for (const k of ["harina", "huevo", "miel", "leche"]) { P.materiales = P.materiales || {}; P.cosas = P.cosas || {}; P.materiales[k] = ${n}; P.cosas[k] = ${n}; P.entradas = P.entradas || {}; P.entradas[k] = { dia: 1, hora: 9, cantidad: ${n} }; } return 1 })()`);
        await N('(() => { P.economia.pesos = 0; return 1 })()');
        const antes = await N('({ pesos: P.economia.pesos, mat: JSON.stringify(P.materiales), cosas: JSON.stringify(P.cosas), ent: JSON.stringify(Object.fromEntries(Object.entries(P.entradas).filter(([k]) => ["harina","huevo","miel","leche"].includes(k)))) })');
        const h2 = await hablar('panadera');
        console.log('  2.ª charla (con todo en la mochila):', JSON.stringify(h2.textos));
        const desp = await N('({ pesos: P.economia.pesos, mat: JSON.stringify(P.materiales), cosas: JSON.stringify(P.cosas), ent: JSON.stringify(Object.fromEntries(Object.entries(P.entradas).filter(([k]) => ["harina","huevo","miel","leche"].includes(k)))), notas: N.notas().slice(-2) })');
        console.log('  antes:', JSON.stringify(antes)); console.log('  después:', JSON.stringify(desp));
        ok(/Justo lo que necesitaba/.test(h2.textos.join(' ')), 'la panadera recibe el pedido');
        ok(desp.pesos > antes.pesos, 'y paga (' + antes.pesos + ' → ' + desp.pesos + ')');
        ok(!/\d de /.test(h1.textos.join(' ') + h2.textos.join(' ')), 'el texto del pedido no dice «2 de frascos»');
        await cerrar();
        const h3 = await hablar('panadera');
        console.log('  3.ª charla (ya entregado):', JSON.stringify(h3.textos));
        ok(!/Justo lo que necesitaba/.test(h3.textos.join(' ')), 'no se vuelve a pagar el mismo pedido');
        await cerrar();
      }
    });

    // ---------------------------------------------------------------- 5. el Desafío en el pueblo
    await seccion('desafio', async () => {
      console.log('— 5. el Desafío en el pueblo: el andén, la E y guardar parado ahí');
      await abrir({ calidad: CALIDAD, modo: 'desafio', dificultad: 'normal', perillaCantidad: 0, perillaVida: 0, perillaDano: 0, estacion: 'verano' }, true);
      await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3500);
      await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
      await N('N.tick(2)');
      const D = await N('({ modo: P.modo, aldea: !!(H.__aldeaMundo && H.__aldeaMundo()), paradas: t.paradas.map((q) => q.nombre), tieneAldea: !!N.aldea() })');
      console.log('  Desafío:', JSON.stringify(D));
      if (!D.tieneAldea) return;
      for (const [hora, nom] of [[11, 'dia'], [19.3, 'ocaso'], [23, 'noche']]) {
        await N(`(() => { P.horas = ${hora}; const p = N.aldea(); N.tren({ parada: p, parado: 90 }); N.mirarA(p.cargas.x + 1.2, p.cargas.z + 0.6, p.cargas.x, p.cargas.z); return 1 })()`); await N('N.tick(2.5)');
        console.log(`  [${nom}] junto al puesto de cargas: aviso «${await N('N.aviso()')}»`);
        await N('N.tecla("KeyE")'); await N('N.tick(0.5)');
        console.log(`  [${nom}] tras la E: panel cargas oculto=${await N('(N.panelCargas() || { oculto: true }).oculto')} · notas ${JSON.stringify(await N('N.notas().slice(-2)'))}`);
        await N('N.tecla("Escape")'); await N('N.tick(0.3)');
        await N(`(() => { const p = N.aldea(); H.jugador.ubicar(p.anden.x, p.anden.z, 0); return 1 })()`); await N('N.tick(1.5)');
        console.log(`  [${nom}] en el andén con el tren parado: aviso «${await N('N.aviso()')}» · puedeSubir ${await N('t.puedeSubir(H.jugador.estado)')}`);
        await foto('5-desafio-anden-' + nom);
      }
      await N('(() => { const p = N.aldea(); N.tren({ parada: p, parado: 90 }); H.jugador.ubicar(p.anden.x, p.anden.z, 0); t.subir(H.jugador); H.jugador.estado.enTren = true; return 1 })()'); await N('N.tick(0.8)');
      await N('H.guardar()');
      console.log('  guardado arriba del tren en el Desafío:', await N('JSON.stringify(P.pos)'));
    });

    // ---------------------------------------------------------------- 6. los avisos en la puerta de cada edificio de la Aldea
    await seccion('avisos', async () => {
      console.log('— 6. los avisos de la E en la puerta de cada edificio de la Aldea (día, ocaso y noche)');
      await N('(() => { P.dia = 30; P.economia && (P.economia.pesos = 5000); return 1 })()');
      const ids = ['estacion-aldea', 'plaza', 'biblioteca', 'almacen', 'casa-te', 'escuela', 'casa-jefe', 'casa-ercilia', 'casa-nelida', 'casa-abuela', 'casa-familia', 'panaderia', 'herreria', 'carpinteria', 'pescaderia', 'puesto-sanitario', 'estafeta', 'hilanderia', 'sala-miel', 'seccional', 'salon', 'veterinaria', 'estudio-fotos', 'refugio-andinista', 'herboristeria', 'taller-arte', 'ceramica', 'varadero', 'observatorio', 'costureria', 'banco-pueblo', 'cantina', 'taller-tren'];
      for (const [hora, nom] of [[11, 'dia'], [19.3, 'ocaso'], [23, 'noche']]) {
        await N(`(() => { P.horas = ${hora}; return 1 })()`);
        const sal = [];
        for (const id of ids) {
          const e = await N(`(() => { const A = H.__aldeaMundo(), b = A.estadoEdificio("${id}"); if (!b) return null; const pu = b.puertas[0]; if (!pu) return { id: "${id}", sinPuerta: true }; const s = b.sitio, dx = pu.x - s.x, dz = pu.z - s.z, l = Math.hypot(dx, dz) || 1, x = pu.x + dx / l * 1.4, z = pu.z + dz / l * 1.4; N.mirarA(x, z, pu.x, pu.z); H.jugador.estado.pitch = 0; return { id: "${id}", x, z } })()`);
          if (!e) continue;
          if (e.sinPuerta) { sal.push(`${id}: (sin puerta)`); continue; }
          await N('N.tick(0.9)');
          sal.push(`${id}: «${await N('N.aviso()')}»`);
        }
        console.log(`  [${nom}]`); for (const l of sal) console.log('    ' + l);
      }
    });

    // ---------------------------------------------------------------- 7. subir y bajar de la trochita en la Aldea (llegada de verdad)
    await seccion('tren', async () => {
      console.log('— 7. la trochita llega a la Aldea, se sube con E, se baja con E');
      await N('(() => { P.horas = 11; t.soltar && 0; return 1 })()');
      await N('(() => { const p = N.aldea(); H.jugador.ubicar(p.anden.x - 3, p.anden.z, 0); t.traerAlAnden(p, 135); return 1 })()');
      let llego = false;
      for (let i = 0; i < 120 && !llego; i++) { await N('N.tick(0.5)'); llego = await N('t.est.parado > 0'); }
      console.log('  llegó:', llego, '· parado', await N('t.est.parado'), '· s', await N('t.est.s'));
      await N('(() => { const p = N.aldea(); H.jugador.ubicar(p.anden.x, p.anden.z, 0); return 1 })()'); await N('N.tick(1.6)');
      console.log('  en el andén: aviso «' + (await N('N.aviso()')) + '» · puedeSubir', await N('t.puedeSubir(H.jugador.estado)'));
      await foto('7a-tren-en-la-aldea');
      await N('N.tecla("KeyE")'); await N('N.tick(0.8)');
      console.log('  tras la E: enTren', await N('H.jugador.estado.enTren'), '· aviso «' + (await N('N.aviso()')) + '» · notas', JSON.stringify(await N('N.notas().slice(-2)')));
      await foto('7b-arriba');
      // dejar el panel de cargas abierto y subir: no tiene que quedar colgado
      await N('N.tecla("KeyE")'); await N('N.tick(0.8)');
      console.log('  E arriba: enTren', await N('H.jugador.estado.enTren'), '· pos', JSON.stringify(await N('({ x: +H.jugador.estado.pos.x.toFixed(1), z: +H.jugador.estado.pos.z.toFixed(1) })')), '· andén', JSON.stringify(await N('({ x: +N.aldea().anden.x.toFixed(1), z: +N.aldea().anden.z.toFixed(1) })')), '· notas', JSON.stringify(await N('N.notas().slice(-2)')));
      await foto('7c-abajo');
    });

    // ---------------------------------------------------------------- 8. V con un panel abierto
    await seccion('tirarpanel', async () => {
      console.log('— 8. V (tirar) con el puesto de cargas, la mochila o una charla abiertos');
      await N('(() => { P.horas = 11; P.materiales = P.materiales || {}; P.materiales.tabla = 8; P.economia && (P.economia.pesos = 5000); return 1 })()');
      await N('N.tren({ parada: N.aldea(), parado: 120 })');
      await N('(() => { const p = N.aldea(); N.mirarA(p.cargas.x + 1.2, p.cargas.z + 0.6, p.cargas.x, p.cargas.z); return 1 })()'); await N('N.tick(1.2)');
      console.log('  mano:', await N('N.ranura(/tabla/i)'));
      await N('N.tecla("KeyE")'); await N('N.tick(0.5)'); await N('N.tecla("Tab")'); await N('N.tick(0.3)');
      const a0 = await N('({ tablas: P.materiales.tabla, bultos: (H.objetos.bultos() || []).length, panelAbierto: !N.panelCargas().oculto })');
      await N('N.tecla("KeyV")'); await N('N.tick(0.5)');
      const a1 = await N('({ tablas: P.materiales.tabla, bultos: (H.objetos.bultos() || []).length, panelAbierto: !N.panelCargas().oculto, fila: (N.panelCargas().texto.match(/Tablas ×4[^0-9]*[^T]{0,60}/) || [""])[0] })');
      console.log('  con el puesto abierto (Vender): antes', JSON.stringify(a0), '· V →', JSON.stringify(a1));
      await N('N.tecla("Escape")'); await N('N.tick(0.3)');
      // la mochila
      await N('N.tecla("KeyI")'); await N('N.tick(0.6)');
      const m0 = await N('({ abierta: !document.getElementById("mochila").classList.contains("oculto"), tablas: P.materiales.tabla, texto: document.getElementById("mochila").innerText.split(String.fromCharCode(10)).filter((x) => /tabla/i.test(x)).join(" | ") })');
      await N('N.tecla("KeyV")'); await N('N.tick(0.6)');
      const m1 = await N('({ abierta: !document.getElementById("mochila").classList.contains("oculto"), tablas: P.materiales.tabla, texto: document.getElementById("mochila").innerText.split(String.fromCharCode(10)).filter((x) => /tabla/i.test(x)).join(" | ") })');
      console.log('  con la mochila abierta: antes', JSON.stringify(m0), '· V →', JSON.stringify(m1));
      await foto('8a-mochila-v');
      await N('N.tecla("KeyI")'); await N('N.tick(0.4)');
      // una charla
      await N('(() => { const g = N.npc("jefe") || N.npc("panadera"); const p = g.g.position, a = g.g.rotation.y, x = p.x + Math.sin(a) * 1.4, z = p.z + Math.cos(a) * 1.4; H.jugador.ubicar(x, z, Math.atan2(-(p.x - x), -(p.z - z))); H.hablar(g); return 1 })()'); await N('N.tick(0.5)');
      const c0 = await N('({ charla: N.charla().abierta, tablas: P.materiales.tabla, bultos: (H.objetos.bultos() || []).length })');
      await N('N.tecla("KeyV")'); await N('N.tick(0.5)');
      const c1 = await N('({ charla: N.charla().abierta, tablas: P.materiales.tabla, bultos: (H.objetos.bultos() || []).length })');
      console.log('  charlando: antes', JSON.stringify(c0), '· V →', JSON.stringify(c1));
      for (let i = 0; i < 6 && (await N('N.charla().abierta')); i++) { await N('N.tecla("Escape")'); await N('N.tick(0.2)'); }
    });

    // ---------------------------------------------------------------- 9. dónde se puede subir en el andén de la Aldea
    await seccion('embarque', async () => {
      console.log('— 9. dónde se puede subir a la trochita parada en el andén de la Aldea');
      await N('(() => { P.horas = 11; return 1 })()');
      await N('(() => { const p = N.aldea(); H.jugador.ubicar(p.anden.x - 3, p.anden.z, 0); t.traerAlAnden(p, 135); return 1 })()');
      for (let i = 0; i < 120 && !(await N('t.est.parado > 0')); i++) await N('N.tick(0.5)');
      const r = await N(`(() => { const p = N.aldea(), y = p.anden.y ?? p.espera.y, si = []; for (let dx = -14; dx <= 14; dx += 2) for (let dz = -14; dz <= 14; dz += 2) { const pos = { x: p.anden.x + dx, y, z: p.anden.z + dz }; if (t.puedeSubir({ pos })) si.push([dx, dz]); } return { anden: p.anden, y, n: si.length, muestra: si.slice(0, 40), puertas: !!(t.tren && t.tren.puertas), primerCoche: t.tren && t.tren.primerCoche, adelanto: t.tren && t.tren.adelanto, parado: t.est.parado, s: t.est.s, poste: t.poste(p) } })()`);
      console.log('  ', JSON.stringify(r));
      const d = await N(`(() => { const p = N.aldea(); let mejor = 99, q = null; for (let dx = -14; dx <= 14; dx += 1) for (let dz = -14; dz <= 14; dz += 1) { if (t.puedeSubir({ pos: { x: p.anden.x + dx, y: p.anden.y ?? p.espera.y, z: p.anden.z + dz } })) { const d = Math.hypot(dx, dz); if (d < mejor) { mejor = d; q = [dx, dz]; } } } return { mejor, q } })()`);
      console.log('  el lugar más cercano al andén desde donde se sube:', JSON.stringify(d));
      if (d.q) { await N(`(() => { const p = N.aldea(); H.jugador.ubicar(p.anden.x + ${d.q[0]}, p.anden.z + ${d.q[1]}, 0); return 1 })()`); await N('N.tick(1.5)'); console.log('  aviso ahí: «' + (await N('N.aviso()')) + '»'); await foto('9-embarque'); await N('N.tecla("KeyE")'); await N('N.tick(0.8)'); console.log('  tras la E: enTren', await N('H.jugador.estado.enTren'), '· aviso «' + (await N('N.aviso()')) + '»'); await foto('9c-arriba'); }
      // todos los lugares desde donde se sube, mirando hacia los cuatro lados: qué ofrece el aviso
      const spots = await N(`(() => { const p = N.aldea(), y = p.anden.y ?? p.espera.y, si = []; for (let dx = -14; dx <= 14; dx += 1) for (let dz = -6; dz <= 8; dz += 1) { if (t.puedeSubir({ pos: { x: p.anden.x + dx, y, z: p.anden.z + dz } })) si.push([dx, dz, Math.hypot(dx, dz)]); } si.sort((a, b) => a[2] - b[2]); return si })()`);
      const vistos = {};
      for (const [dx, dz] of spots.filter((_, i) => i % Math.max(1, Math.floor(spots.length / 10)) === 0).slice(0, 10)) {
        for (const yaw of [0, 1.57, 3.14, 4.71]) {
          await N(`(() => { const p = N.aldea(); H.jugador.ubicar(p.anden.x + ${dx}, p.anden.z + ${dz}, ${yaw}); H.jugador.estado.pitch = 0; return 1 })()`); await N('N.tick(0.6)');
          const av = await N('N.aviso()');
          (vistos[av] = vistos[av] || []).push(`${dx},${dz}@${yaw}`);
        }
      }
      for (const [k, v] of Object.entries(vistos)) console.log(`  «${k}» ×${v.length} (${v.slice(0, 4).join(' ')})`);
      ok(Object.keys(vistos).some((k) => /Subir a la trochita/.test(k)), 'desde alguno de los lugares de embarque, el aviso ofrece subir a la trochita');
      await N('(() => { const p = N.aldea(); H.jugador.ubicar(p.anden.x, p.anden.z, 0); return 1 })()'); await N('N.tick(1.5)'); await foto('9b-en-el-anden');
    });

    console.log('  programas:', prog0, '→', await N('N.programas()'));
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});
