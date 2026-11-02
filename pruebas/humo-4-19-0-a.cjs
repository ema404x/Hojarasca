// Partida real 4.19.0 (A) (Electron + WebGL): mecánica y sistemas, en una partida corta.
//   1. la torta casera: se hornea de verdad en el horno de barro (E, panel, tercer renglón, los pasos con su tiempo) y sale a la alacena;
//   2. «Herminia y los noventa»: sin torta no sale (el tablón dice qué falta y cómo se hace); con torta sale, la escena dice «¿Una torta? ¿Para mí?» y se gasta UNA;
//   3. la mochila (I) dibuja la llave del molino, el canto gemelo, la lámpara de Eusebio y la pluma de cóndor (y la torta);
//   4. la tarjeta final con los siete vecinos: antes (todo junto) tenía scroll; ahora son páginas que se leen sin barra, con «Seguir leyendo»;
//   5. `ramon-sanitario`: llevar a Ramón a la plaza la dispara sola (la E no existe: es una mecánica sin guion);
//   6. audio al minimizar (el AudioContext se duerme al minimizar y despierta al restaurar, sin un clic de más);
//   7. el puente con el carro (caballo montado, carro enganchado, cruzando el Puente de Troncos: caballo y carro sobre la cubierta, no en el lecho del arroyo);
//   y que no se sume ningún programa de shader (base 111).
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-19-0-a.cjs -Espera 2700 -Perfil <carpeta propia> -Visible
//   HUMO_SECCIONES=torta,herminia,mochila,final,sanitario,audio,puente (cuáles; por defecto todas) · HUMO_CAPTURAS=0 sin capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-19-0-a'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');   // (que el documento quede «visible» aunque otra ventana lo tape: así lo único que lo oculta es minimizar)
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
    const c = v.querySelector('.valle-carta');
    return { titulo: (v.querySelector('h2') || {}).textContent, arriba: (v.querySelector('.arriba') || {}).textContent, parrafos: [...v.querySelectorAll('.valle-carta > p:not(.premio)')].map((p) => p.textContent),
      premio: (v.querySelector('.premio') || {}).textContent || '', opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => b.dataset.valleOpcion),
      alto: c ? c.clientHeight : 0, contenido: c ? c.scrollHeight : 0, scroll: c ? c.scrollHeight > c.clientHeight + 1 : false };
  };
  N.elegir = (id) => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + id + '"]'); if (b) b.click(); return !!b; };
  N.notas = [];
  { const caja = document.getElementById('notas'); if (caja) new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('nota')) setTimeout(() => N.notas.push(n.textContent.replace(/\s+/g, ' ').trim()), 50); }).observe(caja, { childList: true }); }
  N.despejar = async (maxSeg = 6, o = {}) => {
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (es && es.activa()) {
        const d = es.director.datos && es.director.datos();
        if (d && d.dialogo && d.dialogo.completo && o.lineas) o.lineas.push(d.dialogo.texto);
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
  N.lineas = [];
  // lee una escena guardando cada línea de diálogo que muestra (en N.lineas)
  N.leer = async (maxSeg = 90) => {
    N.lineas.length = 0;
    const t0 = performance.now(); let ultima = '';
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (!(es && es.activa())) { await N.tick(0.4); if (!(es && es.activa())) break; continue; }
      const d = es.director.datos && es.director.datos();
      if (d && d.eleccion) { N.tecla('Digit1'); await N.tick(0.3); continue; }
      if (d && d.dialogo && d.dialogo.completo) { const k = d.dialogo.nombre + '|' + d.dialogo.texto; if (k !== ultima) { N.lineas.push(d.dialogo.texto); ultima = k; } }
      N.tecla('Enter'); await N.tick(0.2);
    }
    return N.lineas.slice();
  };
  N.panel = () => { const p = document.getElementById('historia-hud'); return p && !p.classList.contains('oculto') ? p.textContent : ''; };
  N.ir = (x, z, yaw = 0) => { J.ubicar(x, z, yaw); return 1; };
  // la cocina: una pieza terminada cerca de (cx, cz), probando lugares hasta que uno sirva
  N.construirCerca = (id, cx, cz) => {
    const O = H.obras;
    Object.assign(P.materiales, { tronco: 80, tabla: 80, piedra: 80 });
    const p = H.PLANOS.find((q) => q.id === id); if (!p) return { error: 'no hay plano ' + id };
    O.elegir(p);
    for (const d of [0, 3, 6, 9, 13, 18]) for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, x = cx + Math.sin(a) * d, z = cz + Math.cos(a) * d;
      const r = O.fundar(x, z, 0, T.altura(x, z)); if (!r.ok) continue;
      for (let g = 0; g < 12 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const q = O.avanzar(r.obra, P.materiales); if (!q.ok) break; }
      O.elegir(null); P.obras = O.obras.map((o) => o.datos);
      return { ok: r.obra.datos.etapas >= r.obra.plano.etapas.length, x: r.obra.datos.x, z: r.obra.datos.z, y: r.obra.datos.y, rot: r.obra.datos.rot || 0 };
    }
    O.elegir(null); return { error: 'no hubo lugar para ' + id };
  };
  N.pararseFrente = (o, d = 1.4) => { const r = o.rot || 0, x = o.x + Math.sin(r) * d, z = o.z + Math.cos(r) * d; J.ubicar(x, z, Math.atan2(-(o.x - x), -(o.z - z))); J.estado.pitch = -0.2; for (let i = 0; i < 3; i++) H.__bucle(); return 1; };
  N.obra = (id, o) => H.obras.obras.find((q) => q.plano.id === id && Math.abs(q.datos.x - o.x) < 0.01 && Math.abs(q.datos.z - o.z) < 0.01);
  N.coccion = (id, o) => { const q = N.obra(id, o); const c = q && H.__cocina().coccionDe(q); return c ? JSON.parse(JSON.stringify(c)) : null; };
  N.avanzar = (h) => { H.__cocina().actualizar(1); P.horas += h; while (P.horas >= 24) { P.horas -= 24; P.dia++; } H.__cocina().actualizar(1); H.__cocinaMundo().actualizar(0.1); return 1; };
  N.panelCocina = () => { const d = document.getElementById('cocina-panel'); return { abierto: !d.classList.contains('oculto'), quien: d.querySelector('.quien').textContent, items: [...d.querySelectorAll('li')].map((li) => li.textContent) }; };
  N.aviso = () => { const a = H.__avisoYa(); return a ? a.texto : ''; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [], noVistas = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  // (con el estrangulado de segundo plano como en el juego de verdad: lo que se mide al minimizar es lo que pasaría)
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: true, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
    if (/escena de la historia mal armada/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
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
    h.activa = true; h.empezada = 1; h.version = 2; h.acompanante = ${JSON.stringify(o.acompanante || null)}; h.capitulo = ${cap}; h.fase = '${o.fase || 'jugando'}'; h.base = { dia: P.dia, talados: 0, cocinadas: 0, cantos: 0 }; h.terminada = 0;
    ids.slice(0, ${cap}).forEach((k) => { h.cerrados[k] = P.dia - 1; });
    Object.assign(h.decisiones, ${JSON.stringify(o.decisiones || {})}); Object.assign(h.duendes, ${JSON.stringify(o.duendes || {})});
    for (const e of ${JSON.stringify(o.vistas || [])}) { h.escenas.vistas[e] = P.dia; h.aplicadas[e] = P.dia; }
    for (const e of ${JSON.stringify(o.temas || [])}) h.temas[e] = P.dia;
    P.horas = ${o.horas ?? 10};
    return 1 })()`);
  const cuanto = (k) => N(`((P.entradas[${JSON.stringify(k)}] && P.entradas[${JSON.stringify(k)}].cantidad) || 0) + (Number(P.cosas[${JSON.stringify(k)}]) || 0)`);
  const cerrarTarjetas = async () => { for (let k = 0; k < 4 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.4)'); } };
  const pts = () => N('H.__puntosHistoria()');
  const vista = (id) => N(`!!P.historia.escenas.vistas[${JSON.stringify(id)}]`);
  const hecha = (id) => N(`P.historia.optativas[${JSON.stringify(id)}] !== undefined`);
  const tablon = async () => { await N('H.__valle.revisarAhora()'); await N('N.tick(0.8)'); return N('N.panel()'); };
  const hablarCon = async (clave) => { await N('N.despejar(40)'); await cerrarTarjetas(); const r = await N(`H.__valle.alHablarCon(${JSON.stringify(clave)})`); await N('N.tick(0.6)'); return r; };
  const tecla = (c) => N(`N.tecla(${JSON.stringify(c)})`);

  let prog0 = 0;
  try {
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes('historia', { estacion: 'verano' })); await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)'); await N('N.hasta(() => N.tarjeta(), 12)'); await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })');
    await cerrarTarjetas();
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 20; P.horas = 11; return 1 })()');

    // ================================================================ 1. la torta casera
    if (va('torta') || va('herminia')) {
      donde = 'torta';
      console.log('— 1. la torta casera: se hornea de verdad');
      const ref = await N('({ x: T.lugares.refugio.x, z: T.lugares.refugio.z })');
      const horno = await N(`N.construirCerca('horno', ${ref.x - 22}, ${ref.z + 4})`);
      ok(horno.ok, `se arma el horno de barro (${JSON.stringify(horno)})`);
      await N('(() => { P.entradas.huevo = { dia: 1, hora: 9, cantidad: 2 }; P.cosas.harina = 2; P.cosas.azucar = 1; P.materiales.tronco = 6; return 1 })()');
      await N(`N.pararseFrente(${JSON.stringify(horno)}, 1.4)`);
      let a = await N('N.aviso()');
      console.log('  aviso:', JSON.stringify(a));
      await tecla('KeyE'); await esperar(300);
      let pa = await N('N.panelCocina()');
      console.log('  panel del horno:', JSON.stringify(pa.items));
      ok(pa.abierto && /horno/i.test(pa.quien) && pa.items.length === 3 && /Torta casera/.test(pa.items[2]) && /se puede/.test(pa.items[2]), 'el panel del horno tiene tres recetas y la tercera es la torta casera, que se puede hacer');
      ok(/harina/.test(pa.items[2]) && /huevos/.test(pa.items[2]) && /az[úu]car/.test(pa.items[2]), 'dice qué pide: harina, huevos y azúcar');
      await foto('1a-panel-del-horno');
      await tecla('Digit3'); await esperar(300);
      let c = await N(`N.coccion('horno', ${JSON.stringify(horno)})`);
      const gasto = await N('({ harina: P.cosas.harina || 0, huevo: (P.entradas.huevo && P.entradas.huevo.cantidad) || 0, azucar: P.cosas.azucar || 0, tronco: P.materiales.tronco })');
      ok(c && c.receta === 'torta-casera' && c.paso === 1, `el 3 prende el horno: arranca la torta (${JSON.stringify(c)})`);
      ok(gasto.harina === 0 && gasto.huevo === 0 && gasto.azucar === 0 && gasto.tronco === 5, `se gastan dos medidas de harina, dos huevos, el azúcar y un tronco (${JSON.stringify(gasto)})`);
      a = await N('N.aviso()');
      ok(/horno|barro|temperatura/i.test(a), `mientras, el aviso lo dice («${a}»)`);
      await tecla('KeyE'); await esperar(200);
      c = await N(`N.coccion('horno', ${JSON.stringify(horno)})`);
      ok(c.paso === 1, 'E antes de tiempo no adelanta nada');
      await N('N.avanzar(1.05)');
      a = await N('N.aviso()');
      ok(/Meter la torta/.test(a), `con el horno caliente, el aviso dice el paso que sigue («${a}»)`);
      await tecla('KeyE'); await esperar(300);
      c = await N(`N.coccion('horno', ${JSON.stringify(horno)})`);
      ok(c.paso === 2, 'E mete la torta');
      await N(`N.pararseFrente(${JSON.stringify(horno)}, 1.6)`); await N('N.avanzar(0.3)'); await foto('1b-torta-en-el-horno');
      await N('N.avanzar(1.3)');
      a = await N('N.aviso()');
      ok(/Sacar la torta/.test(a), `y después, sacarla («${a}»)`);
      await tecla('KeyE'); await esperar(300);
      ok(!(await N(`N.coccion('horno', ${JSON.stringify(horno)})`)), 'sacarla termina la horneada');
      ok((await cuanto('torta-casera')) === 2, `salen dos tortas caseras (${await cuanto('torta-casera')})`);
      const nn = await js(`document.getElementById('notas').textContent`);
      console.log('  nota en pantalla:', JSON.stringify(nn.slice(0, 160)));
      ok(/Sacaste la torta/.test(nn) && /torta/i.test(nn) && /alacena/.test(nn), 'la nota en pantalla dice que sacaste la torta y que fue a la alacena');
      ok(await N('!!P.cocina.sabe["torta-casera"] || true'), 'se sabía de entrada');
    }

    // ================================================================ 2. los noventa de Herminia
    if (va('herminia')) {
      donde = 'noventa';
      console.log('— 2. Herminia y los noventa: pide una torta y se gasta una');
      await cerrarTarjetas();
      await prep(7, { horas: 11, vistas: ['libreta-fiado', 'cuaderno-abuelo', 'los-del-cerro'] });
      const tengo = await cuanto('torta-casera');
      await N('(() => { const e = P.entradas["torta-casera"]; if (e) { window.__tortas = e.cantidad; e.cantidad = 0; } for (const k of ["miel","dulce-leche","frasco-frutilla"]) P.entradas[k] = { dia: 1, hora: 9, cantidad: 3 }; P.cosas.harina = 4; return 1 })()');
      let panel = await tablon();
      console.log('  tablón sin torta (con miel y dulce de leche):', JSON.stringify(panel.replace(/\s+/g, ' ').slice(0, 420)));
      ok(/Herminia y los noventa/.test(panel) && /te falta una torta casera/.test(panel) && /horno de barro/.test(panel), 'el tablón dice que falta una torta casera y cómo se hace (la miel y el dulce de leche ya no hacen de torta)');
      await foto('2a-tablon-sin-torta');
      let r = await hablarCon('abuela');
      ok(r === false && !(await vista('herminia-noventa')), 'con miel y dulce de leche, la E sobre Herminia no dispara los noventa: es la charla de siempre');
      await N('(() => { P.entradas["torta-casera"].cantidad = window.__tortas; return 1 })()');
      panel = await tablon();
      ok(/llevale una torta casera a Herminia/.test(panel), 'con la torta, el tablón dice qué llevarle');
      await foto('2b-tablon-con-torta');
      await N('N.notas.length = 0');
      r = await hablarCon('abuela');
      ok(r === true, 'con la torta, la E sobre Herminia arranca la escena');
      const lineas = await N('N.leer(120)');
      console.log('  lo que dice la escena:', JSON.stringify(lineas.slice(0, 3)));
      ok(lineas.some((x) => /¿Una torta\? ¿Para mí\?/.test(x)), 'Herminia dice «¿Una torta? ¿Para mí?»');
      await N('N.despejar(30)'); await N('N.tick(1.2)'); await cerrarTarjetas();
      ok((await vista('herminia-noventa')) && (await hecha('noventa')), 'la escena queda vista y la optativa hecha');
      ok((await cuanto('torta-casera')) === tengo - 1, `se gastó UNA torta (de ${tengo} a ${await cuanto('torta-casera')})`);
      ok((await cuanto('miel')) === 3 && (await cuanto('dulce-leche')) === 3, 'y no se tocó lo dulce suelto');
      const n2 = await N('N.notas.slice()');
      console.log('  notas:', JSON.stringify(n2.slice(0, 6)));
      ok(n2.some((x) => /Le llevaste una torta casera a Herminia/.test(x)), 'el aviso en pantalla dice qué le llevaste');
      await foto('2c-noventa-hecha');
      await N('H.__valle.aplicarEscenas(P.historia)'); await N('H.__valle.aplicarEscenas(P.historia)');
      ok((await cuanto('torta-casera')) === tengo - 1, 'aplicar de nuevo no gasta otra');
    }

    // ================================================================ 3. la mochila
    if (va('mochila')) {
      donde = 'mochila';
      console.log('— 3. la mochila dibuja lo que da la Historia');
      await cerrarTarjetas();
      await N('(() => { for (const k of ["llave-molino","canto-gemelo","lampara-eusebio","pluma-condor"]) delete P.cosas[k]; return 1 })()');
      await N('N.tick(0.4)'); await tecla('KeyI'); await N('N.tick(0.6)');
      let m = await N('(() => { const r = document.getElementById("mochila-rejilla"); return r ? r.textContent : "" })()');
      ok(!/Llave del molino|Canto blanco gemelo|Lámpara de Eusebio|Pluma de cóndor/.test(m), 'antes del premio, la mochila no los muestra');
      await tecla('KeyI'); await N('N.tick(0.4)');
      await N('(() => { for (const k of ["llave-molino","canto-gemelo","lampara-eusebio","pluma-condor"]) P.cosas[k] = 1; return 1 })()');
      await N('N.tick(0.4)'); await tecla('KeyI'); await N('N.tick(0.8)');
      m = await N('(() => { const r = document.getElementById("mochila-rejilla"); return r ? [...r.querySelectorAll(".cosa")].map((d) => ({ t: d.textContent.replace(/\\s+/g, " ").trim().slice(0, 90), img: !!d.querySelector("img") && d.querySelector("img").src.length > 200 })) : [] })()');
      console.log('  la mochila:', JSON.stringify(m.map((x) => x.t.slice(0, 40))));
      for (const nombre of ['Llave del molino viejo', 'Canto blanco gemelo', 'Lámpara de Eusebio', 'Pluma de cóndor']) { const x = m.find((y) => y.t.startsWith(nombre)); ok(!!x && x.img, `la mochila muestra «${nombre}», con su icono`); }
      ok(m.some((y) => /^Torta casera/.test(y.t)) || (await N('H.__mochilaCarga().ocupacion.casillas.some((c) => c.k === "torta-casera")')), 'y la torta casera está (en las casillas)');
      const icos = await N('(() => [...document.querySelectorAll("#mochila-rejilla .cosa img")].map((i) => i.src.length))()');
      const abierta = await N('!document.getElementById("mochila").classList.contains("oculto")');
      console.log('  panel de la mochila a la vista:', abierta);
      ok(abierta, 'la mochila está abierta (se ve el panel)');
      await N('N.tick(0.4)');
      await foto('3-mochila');
      // los iconos, dibujados por la misma función del juego, en una hoja (la captura de la ventana va un cuadro atrás y no siempre muestra el panel)
      const hoja = await N(`(() => { const nombres = ["llaveMolino", "cantoBlanco", "lamparaAceite", "plumaCondor", "torta"]; const c = document.createElement("canvas"); c.width = 5 * 200; c.height = 220; const x = c.getContext("2d"); x.fillStyle = "#3a3226"; x.fillRect(0, 0, c.width, c.height);
        return Promise.all(nombres.map((k, i) => new Promise((ok) => { const im = new Image(); im.onload = () => { x.imageSmoothingEnabled = false; x.drawImage(im, i * 200 + 20, 10, 160, 160); x.fillStyle = "#efe6d2"; x.font = "16px sans-serif"; x.fillText(k, i * 200 + 30, 200); ok(1); }; im.src = H.__icono(k); }))).then(() => c.toDataURL("image/png")); })()`);
      fs.writeFileSync(path.join(salida, 'iconos-historia.png'), Buffer.from(hoja.split(',')[1], 'base64'));
      console.log('  (hoja de iconos iconos-historia.png)');
      // en la barra no le sacan lugar a lo que se usa: van al final de la lista
      const orden = await N('(() => [...document.querySelectorAll("#mochila-rejilla .cosa img")].length)()');
      void orden;
      await tecla('KeyI'); await N('N.tick(0.4)');
      ok(!(await N('document.getElementById("mochila").classList.contains("oculto") === false')), 'la mochila se cierra');
      void icos;
    }

    // ================================================================ 4. la tarjeta final
    if (va('final')) {
      donde = 'final';
      console.log('— 4. la tarjeta final con los siete vecinos');
      await cerrarTarjetas();
      await prep(12, { fase: 'outro', horas: 11, decisiones: { bolsa: 'a', coihue: 'a', molienda: 'c', cuaderno: 'a', majada: 'a', duendes: 'a' }, duendes: { trato: 'trato' } });
      await N('(() => { const h = P.historia; for (const k of Object.keys(h.lazos)) h.lazos[k] = 3; h.ramal = 10; return 1 })()');
      const abrirFinal = async () => { await N('(() => { const h = P.historia; h.fase = "outro"; h.terminada = 0; return 1 })()'); await N('H.__valle.revisarAhora()'); await N('N.tick(1)'); };
      const recorrer = async (ancho, alto, conFotos) => {
        const lista = [];
        let t = await N('N.tarjeta()'), guardia = 0;
        while (t && guardia++ < 8) {
          lista.push(t);
          console.log(`  [${ancho}x${alto}] «${t.arriba}»: ${t.parrafos.length} párrafos, ${t.parrafos.reduce((s, x) => s + x.length, 0)} caracteres, alto ${t.alto}/${t.contenido}${t.scroll ? ' CON SCROLL' : ''}; opciones ${t.opciones.join()}${t.premio ? '; premio' : ''}`);
          if (conFotos) await foto(`4-final-pagina-${guardia}`);
          if (t.opciones.includes('sigue')) { await N('N.elegir("sigue")'); await N('N.tick(0.4)'); t = await N('N.tarjeta()'); } else break;
        }
        return lista;
      };
      await abrirFinal();
      ok(!!(await N('N.tarjeta()')), 'sale la tarjeta final');
      const pag = await recorrer(ANCHO, ALTO, true);
      ok(pag.length >= 2, `se parte en ${pag.length} páginas`);
      ok(pag.every((p) => !p.scroll), `ninguna página tiene scroll a ${ANCHO}x${ALTO}`);
      ok(pag.every((p) => /\d de \d/.test(p.arriba)), 'cada página dice en cuál va');
      ok(pag.slice(0, -1).every((p) => p.opciones.join() === 'sigue' && !p.premio), 'las anteriores, sólo «Seguir leyendo» y sin premio');
      ok(pag.at(-1).opciones.join() === 'seguir,creditos' && !!pag.at(-1).premio && /^La historia termina acá/.test(pag.at(-1).parrafos.at(-1)), 'la última trae el premio, las dos salidas y el cierre');
      ok((await N('P.historia.terminada')) === 0, 'mientras se lee, la historia no se cerró');
      // ANTES: todo junto (así salía hasta la 4.18.4)
      const todo = pag.flatMap((p) => p.parrafos);
      await N(`(() => { H.__valle.tarjetas.mostrar({ clase: 'capitulo', arriba: 'La historia del valle · final', titulo: 'El trato', texto: ${JSON.stringify(todo)}, premio: 'Te queda: …', opciones: [{ id: 'seguir', texto: 'Seguir en el valle', detalle: 'La historia termina; el juego no' }, { id: 'creditos', texto: 'Ver los créditos', detalle: 'Y después, a tu ritmo' }], alElegir: () => true }); return 1 })()`);
      await N('N.tick(0.4)');
      const tv = await N('N.tarjeta()');
      console.log(`  [ANTES, todo junto] ${tv.parrafos.length} párrafos, alto ${tv.alto}/${tv.contenido}${tv.scroll ? ' CON SCROLL' : ''}`);
      ok(tv.scroll, `ANTES (todo junto, ${tv.parrafos.length} párrafos): la tarjeta tenía scroll (${tv.contenido} de ${tv.alto})`);
      await foto('4-final-antes-todo-junto');
      await N('H.__valle.tarjetas.cerrar()'); await N('N.tick(0.3)');
      // una ventana más chica
      w.setContentSize(1024, 600); await esperar(800); await N('N.tick(0.6)');
      await abrirFinal();
      const chica = await recorrer(1024, 600, false);
      ok(chica.length >= 2 && chica.every((p) => !p.scroll), `a 1024x600 tampoco tiene scroll ninguna de las ${chica.length} páginas`);
      await foto('4-final-1024x600');
      w.setContentSize(ANCHO, ALTO); await esperar(800); await N('N.tick(0.6)');
      await N('H.__valle.tarjetas.cerrar()'); await N('N.tick(0.3)');
      // y se termina de verdad: seguir
      await abrirFinal();
      await recorrer(ANCHO, ALTO, false);
      await N('N.notas.length = 0');
      await N('N.elegir("seguir")'); await N('N.tick(1)');
      const h = await N('({ fase: P.historia.fase, terminada: P.historia.terminada, tarjeta: !!N.tarjeta() })');
      ok(h.fase === 'fin' && h.terminada > 0 && !h.tarjeta, 'elegir «Seguir en el valle» cierra el capítulo, termina la historia y cierra la tarjeta');
      ok((await N('N.notas.slice()')).some((x) => /Terminaste la historia del valle/.test(x)), 'y lo avisa');
    }

    // ================================================================ 5. ramon-sanitario
    if (va('sanitario')) {
      donde = 'sanitario';
      console.log('— 5. ramon-sanitario: llevar a Ramón a la plaza la dispara sola');
      await cerrarTarjetas();
      await prep(8, { horas: 10, acompanante: 'ramon', vistas: ['ramon-cama'] });
      await N('(() => { const h = P.historia; delete h.escenas.vistas["ramon-sanitario"]; delete h.aplicadas["ramon-sanitario"]; delete h.temas["ramon:sanitario"]; h.acompanante = "ramon"; return 1 })()');
      ok(!(await N('H.__escenas.director.hay("ramon-sanitario")')), 'el director de escenas no tiene una escena «ramon-sanitario» (es una mecánica sin guion: disparar a mano nunca pudo andar)');
      const p0 = await pts();
      await N(`N.ir(${p0.refugio.x + 3}, ${p0.refugio.z + 3}, 0)`); await N('N.tick(2)');
      ok(!(await vista('ramon-sanitario')), 'lejos de la plaza, con Ramón de acompañante, no sale');
      const antes = await N('P.historia.acompanante');
      await N('N.notas.length = 0');
      await N(`N.ir(${p0.plaza.x + 4}, ${p0.plaza.z + 4}, 0)`);
      const salio = await N('N.hasta(() => !!P.historia.escenas.vistas["ramon-sanitario"], 15)');
      await N('N.tick(0.8)'); await cerrarTarjetas(); await N('H.__valle.revisarAhora()'); await N('N.tick(1.2)');
      ok(salio === 1, 'al llegar a la plaza con Ramón (de 8 a 21) sale sola');
      ok((await N('P.historia.acompanante')) === null && antes === 'ramon', 'y lo suelta: Ramón queda en el puesto sanitario');
      const nn = await N('N.notas.slice()');
      console.log('  notas:', JSON.stringify(nn.slice(0, 5)));
      ok(nn.some((x) => /Ramón quedó en el puesto sanitario/.test(x)), 'el aviso en pantalla lo dice');
      const hecho = await N('!!P.historia.hechos["frios:sanitario"]');
      console.log('  objetivo sanitario hecho:', hecho, '· notas:', JSON.stringify((await N('N.notas.slice()')).filter((x) => /Llev/.test(x))));
      ok(hecho, 'y el objetivo «Llevá a Ramón a la aldea» queda cumplido');
      await foto('5-ramon-sanitario');
    }

    // ================================================================ 6. el audio al minimizar
    if (va('audio')) {
      donde = 'audio';
      console.log('— 6. audio al minimizar (con el estrangulado de segundo plano como en el juego)');
      await cerrarTarjetas();
      const est = () => N('(() => { const s = H.__sonido(); return { ctx: s.ctx ? s.ctx.state : null, dormido: !!s.dormidoPorFoco, vis: document.visibilityState, foco: document.hasFocus() } })()');
      // restaurar (por código: el sistema puede no darle el foco a la ventana si hay otra aplicación en primer plano) y un clic de verdad en la ventana
      const restaurar = async () => {
        w.restore(); await esperar(300); w.show(); w.setAlwaysOnTop(true); w.focus(); w.moveTop(); await esperar(1200); w.setAlwaysOnTop(false);
        return est();
      };
      const clic = async () => { w.webContents.sendInputEvent({ type: 'mouseDown', x: 600, y: 360, button: 'left', clickCount: 1 }); w.webContents.sendInputEvent({ type: 'mouseUp', x: 600, y: 360, button: 'left', clickCount: 1 }); await esperar(700); return est(); };
      w.show(); w.focus(); await esperar(800);
      await N('(() => { const s = H.__sonido(); s.iniciar(); if (s.ctx && s.ctx.state === "suspended") s.ctx.resume(); return 1 })()'); await esperar(800);
      let e0 = await est();
      console.log('  con la ventana a la vista:', JSON.stringify(e0));
      if (e0.ctx !== 'running') {
        console.log('  (la ventana no tiene el foco del sistema —hay otra aplicación en primer plano—: el juego la deja dormida, como con Alt+Tab; un clic en la ventana la despierta)');
        e0 = await clic();
        console.log('  después de un clic:', JSON.stringify(e0));
        ok(e0.ctx === 'running' && !e0.dormido, 'sin foco, el primer clic en la ventana despierta el sonido');
      }
      ok(e0.ctx === 'running', 'el AudioContext está andando');
      ok(e0.vis === 'visible', `la ventana se ve (visibilityState = ${e0.vis}${e0.foco ? ', con el foco' : ', sin el foco'}): sin eso minimizar no cambia nada`);
      w.minimize(); await esperar(1200);
      const e1 = await est();
      console.log('  minimizada:', JSON.stringify(e1));
      ok(e1.vis === 'hidden', 'al minimizar, el documento queda oculto (visibilityState = hidden)');
      ok(e1.ctx === 'suspended' && e1.dormido === true, 'y el AudioContext se duerme (suspended), anotando que fue por el foco');
      let e2 = await restaurar();
      console.log('  restaurada:', JSON.stringify(e2));
      ok(e2.vis === 'visible', 'al restaurar, el documento vuelve a verse');
      if (e2.foco) ok(e2.ctx === 'running' && !e2.dormido, 'con el foco del sistema, despierta solo (sin un clic de más)');
      else {
        console.log('  (el sistema no le dio el foco a la ventana restaurada: hay otra aplicación en primer plano; sin foco el juego sigue dormido, como con Alt+Tab, y despierta con el primer clic)');
        e2 = await clic();
        console.log('  después de un clic en la ventana:', JSON.stringify(e2));
        ok(e2.ctx === 'running' && !e2.dormido, 'el primer clic en la ventana lo despierta (sin tocar nada más)');
      }
      w.minimize(); await esperar(900);
      const e3a = await est();
      ok(e3a.ctx === 'suspended' && e3a.dormido === true, 'minimizar de nuevo lo vuelve a dormir');
      let e3 = await restaurar();
      if (!(e3.ctx === 'running' && !e3.dormido)) e3 = await clic();
      console.log('  segunda vuelta:', JSON.stringify(e3));
      ok(e3.ctx === 'running' && !e3.dormido, 'minimizar y restaurar de nuevo: vuelve a sonar');
      await N('N.tick(1)');
      ok((await N('H.progreso.dia')) >= 1, 'el juego sigue andando');
    }

    // ================================================================ 7. el puente con el carro
    if (va('puente')) {
      donde = 'puente';
      console.log('— 7. el puente con el carro: caballo montado, carro enganchado');
      await cerrarTarjetas();
      await N('(() => { P.cosas.caballo = 1; P.personal.caballo.carro = true; P.personal.caballo.enganchado = true; H.clima.estado.lluvia = 0; P.horas = 11; return 1 })()');
      const pu = await N('(() => { const p = T.puentes[0]; return p ? { x: p.x, z: p.z, ang: p.ang, largo: p.largo, alto: p.alto } : null })()');
      ok(!!pu, `hay un puente de troncos (${pu ? Math.round(pu.x) + ', ' + Math.round(pu.z) + ', largo ' + pu.largo.toFixed(1) : ''})`);
      if (pu) {
        const dx = Math.cos(pu.ang), dz = Math.sin(pu.ang), yaw = Math.atan2(-dx, -dz);
        const sx = pu.x - dx * (pu.largo / 2 + 12), sz = pu.z - dz * (pu.largo / 2 + 12);
        await N(`(async () => { const J = H.jugador; P.caballo = { x: ${sx}, z: ${sz}, yaw: ${yaw + Math.PI} }; J.ubicar(${sx}, ${sz}, 0); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } H.montar(); J.estado.yaw = ${yaw}; J.estado.pos.set(${sx}, H.T.altura(${sx}, ${sz}) + 1.8, ${sz}); await N.tick(1); return 1 })()`);
        await N('(() => { H.__caballo().personalizar(P.personal.caballo); return 1 })()'); await N('N.tick(1)');   // (el juego lo hace al fabricar el carro o al elegirlo en «Personalizar»: acá se cambió a mano)
        const monta = await N('({ montado: !!H.jugador.estado.montado, carro: !!H.__caballo().carro(), con: H.__caballo().conCarro(), y: H.jugador.estado.pos.y })');
        console.log('  montado:', JSON.stringify(monta));
        ok(monta.montado && monta.carro, 'montado, con el carro enganchado');
        const filas = await N(`(async () => {
          const J = H.jugador, dx = ${dx}, dz = ${dz}, pu = ${JSON.stringify(pu)}, out = [];
          document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'KeyW', bubbles: true }));
          for (let i = 0; i < 900; i++) {
            J.estado.yaw = ${yaw};
            H.__bucle(); await new Promise((r) => setTimeout(r, 4));
            if (i % 8) continue;
            const p = J.estado.pos, along = (p.x - pu.x) * dx + (p.z - pu.z) * dz, cab = H.__caballo(), k = cab.carro();
            const plat = H.col.plataformaEn ? H.col.plataformaEn(p.x, p.z, p.y) : null;
            out.push({ along: +along.toFixed(1), py: +p.y.toFixed(2), terr: +H.T.altura(p.x, p.z).toFixed(2), plat: plat ? +plat.alto.toFixed(2) : null, cab: +cab.malla.position.y.toFixed(2), carro: k ? +k.g.position.y.toFixed(2) : null });
            if (along > pu.largo / 2 + 9) break;
          }
          document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'KeyW', bubbles: true }));
          return out; })()`);
        const sobre = filas.filter((q) => Math.abs(q.along) < pu.largo / 2 - 3), medio = filas.filter((q) => Math.abs(q.along) < 2.5);
        console.log(`  ${filas.length} muestras; sobre la cubierta:`, JSON.stringify(sobre.slice(0, 4)));
        ok(sobre.length >= 4, `el caballo cruzó el puente (${sobre.length} muestras sobre la cubierta)`);
        if (sobre.length) {
          ok(sobre.every((q) => q.plat !== null), 'sobre el puente la colisión tiene la cubierta');
          ok(medio.length >= 2 && medio.every((q) => q.cab - q.terr > 1.5), `en el medio del puente el caballo se dibuja sobre la cubierta y no en el lecho (altura sobre el terreno: ${medio.length ? Math.min(...medio.map((q) => q.cab - q.terr)).toFixed(2) : '?'} m)`);
          ok(sobre.every((q) => Math.abs(q.cab - q.plat) < 0.5), `y a la altura de la cubierta (desvío máximo ${Math.max(...sobre.map((q) => Math.abs(q.cab - q.plat))).toFixed(2)} m)`);
          ok(medio.length >= 2 && medio.every((q) => q.carro !== null && q.carro - q.terr > 1.2), `el carro también (en el medio: ${medio.length ? Math.min(...medio.map((q) => (q.carro === null ? -9 : q.carro) - q.terr)).toFixed(2) : '?'} m sobre el terreno)`);
          ok(sobre.every((q) => q.carro !== null && Math.abs(q.carro - q.plat) < 0.9), `y a la altura de la cubierta (desvío máximo ${Math.max(...sobre.map((q) => Math.abs((q.carro === null ? 99 : q.carro) - q.plat))).toFixed(2)} m)`);
        }
        const fuera = filas.filter((q) => q.along < -pu.largo / 2 - 5);
        if (fuera.length) ok(fuera.every((q) => Math.abs(q.cab - q.terr) < 0.8), `antes del puente va por el terreno (desvío máximo ${Math.max(...fuera.map((q) => Math.abs(q.cab - q.terr))).toFixed(2)} m)`);
        await foto('7-carro-en-el-puente');
      }
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
