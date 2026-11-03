// Partida real 4.23.0 (B) (Electron + WebGL): metas y logros de la Historia, en una partida corta.
//   1. «Lo vivido» en el cuaderno (J): la pestaña, las escenas con su día y su reseña, sin spoilers, legible en 1366x768 y en 1024x600;
//   2. los contadores de la guía (F1): lo raro, de paso, vecinos de la casa y escenas vividas, sin números de lazo;
//   3. los logros de la Historia: se desbloquean con el aviso en pantalla, quedan guardados, y el panel los muestra bajo su título (lo oculto en «???»);
//   y que no se sume ningún programa de shader (base 111).
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-23-0-b.ps1
//   (o con el candado a mano: herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-23-0-b.cjs -Espera 2700 -Perfil <carpeta propia> -Visible)
//   HUMO_SECCIONES=vivido,guia,logros (cuáles; por defecto todas) · HUMO_CAPTURAS=0 sin capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-23-0-b'));
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
  // corre una escena entera con el director de la partida (elige siempre la primera opción)
  N.correrEscena = async (id, maxSeg = 90) => {
    const es = H.__escenas;
    if (!es.disparar(id, { forzar: true })) return { disparo: false };
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000 && es.activa()) {
      const d = es.director.datos();
      if (d && d.eleccion) { N.tecla('Digit1'); await N.tick(0.3); continue; }
      if (d && d.dialogo && d.fase === 'corriendo') N.tecla('Enter');
      await N.tick(0.15);
    }
    return { disparo: true, termino: !es.activa() };
  };
  // el desborde de un panel: si algo se sale de su caja por el costado
  N.desborde = (sel) => {
    const c = document.querySelector(sel);
    if (!c) return { hay: false };
    const r = c.getBoundingClientRect();
    return { hay: true, ancho: c.clientWidth, contenido: c.scrollWidth, alto: c.clientHeight, contenidoAlto: c.scrollHeight, caja: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], ventana: [window.innerWidth, window.innerHeight] };
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
    ids.slice(0, ${cap}).forEach((k) => { h.cerrados[k] = P.dia - 1; });
    ${o.vistas ? `${JSON.stringify(o.vistas)}.forEach((e, i) => { h.escenas.vistas[e] = 1 + Math.floor(i / 3); h.aplicadas[e] = 1 + Math.floor(i / 3); });` : ''}
    Object.assign(h.decisiones, ${JSON.stringify(o.decisiones || {})});
    Object.assign(h.lazos, ${JSON.stringify(o.lazos || {})});
    P.horas = ${o.horas ?? 12};
    return 1 })()`);
  const cerrarTarjetas = async () => { for (let k = 0; k < 4 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); } };
  const tamano = async (a, h) => { await w.setContentSize(a, h); await esperar(900); };

  let prog0 = 0;
  try {
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes('historia')); await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)');
    await N('N.hasta(() => N.tarjeta(), 12)'); await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })'); await cerrarTarjetas();
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; P.horas = 12; return 1 })()');
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);

    // (los logros van primero: cuentan lo que se gana desde una historia recién empezada y los otros pasos ya cierran capítulos)
    // ================================================================ 3. los logros de la Historia
    if (va('logros')) {
      donde = 'logros';
      console.log('— 3. los logros de la Historia: el aviso, lo guardado y el panel');
      await N('(() => { localStorage.removeItem("hojarasca-logros-relax-v1"); return 1 })()');
      const antes = await N('H.__logrosRelax().progreso().hechos');
      // con los capítulos 1 a 3 cerrados no se cumple ninguno (la primera hora)
      await prep(3, { horas: 12, vistas: ['trochita-boleto', 'estacion-llegada'] });
      const nada = await N('H.revisarLogrosRelax(5).map((l) => l.id).filter((i) => i.startsWith("historia-"))');
      ok(nada.length === 0, `con tres capítulos cerrados no se gana ningún logro de la Historia (${nada.join() || 'ninguno'})`);
      // el acto I cerrado (capítulo 4) da «Ya sos del valle»
      await prep(4, { horas: 12, vistas: ['trochita-boleto', 'estacion-llegada', 'anden-graciela'] });
      const nuevos = await N('H.revisarLogrosRelax(5).map((l) => l.id)');
      ok(nuevos.join() === 'historia-verano', `cerrar el acto I da exactamente «Ya sos del valle» (${nuevos.join()})`);
      await N('N.tick(2.2)');
      const aviso = await N(`[...document.querySelectorAll('#avisos-altos *, .nota, .aviso')].map((x) => x.innerText).join(' | ')`);
      ok(/Logro: Ya sos del valle/.test(aviso), `se ve el aviso en pantalla (${aviso.slice(0, 120)})`);
      await foto('3-aviso-logro');
      const guardado = await js(`JSON.parse(localStorage.getItem('hojarasca-logros-relax-v1') || '{}')`);
      ok(guardado.logros && guardado.logros['historia-verano'], 'queda guardado en el almacén de logros (como los del Relax)');
      const otra = await N('H.revisarLogrosRelax(5).map((l) => l.id)');
      ok(otra.length === 0, 'no se vuelve a ganar');
      // el panel, en las dos ventanas
      for (const [a, h, nombre] of [[ANCHO, ALTO, '1366x768'], [1024, 600, '1024x600']]) {
        await tamano(a, h);
        await N('N.tecla("Escape")'); await N('N.tick(0.5)');
        await N('(() => { document.getElementById("btn-logros").click(); return 1 })()'); await N('N.tick(0.6)');
        const p = await N(`({ grupo: [...document.querySelectorAll('#logros-contenido .logro-grupo')].map((x) => x.textContent), items: document.querySelectorAll('#logros-contenido .logro-item').length, hechos: document.querySelectorAll('#logros-contenido .logro-item.hecho').length,
          velados: [...document.querySelectorAll('#logros-contenido .logro-item')].filter((x) => x.innerText.includes('???')).length, progreso: (document.querySelector('#logros-contenido .logro-progreso') || {}).textContent, texto: document.getElementById('logros-contenido').innerText })`);
        ok(p.grupo.join() === 'La historia del valle', `${nombre}: el título «La historia del valle» (una sola vez)`);
        ok(p.items === 41, `${nombre}: 41 logros en el panel (${p.items})`);
        ok(p.hechos === 1 && /Ya sos del valle/.test(p.texto), `${nombre}: el ganado se ve con su nombre`);
        ok(p.velados === 17, `${nombre}: los ocultos dicen «???» (${p.velados}: 15 de la Historia y 2 del Relax)`);
        ok(!/La puerta entornada|Hay que tener trato|Pedí perdón|Nevó y no cedió/.test(p.texto), `${nombre}: nada de lo oculto se adelanta`);
        ok(/^1 de 41 logros$/.test(p.progreso), `${nombre}: «${p.progreso}»`);
        const d = await N(`N.desborde('#logros .panel-modal')`);
        ok(d.hay && d.contenido <= d.ancho + 1, `${nombre}: el panel no se desborda a los costados (${d.contenido}/${d.ancho})`);
        const g = await N(`(() => { const t = document.querySelector('#logros-contenido .logro-grupo'); const l = document.querySelector('#logros-contenido .logro-lista'); if (!t || !l) return null; const a = t.getBoundingClientRect(), b = l.getBoundingClientRect(); return { ancho: Math.round(a.width), lista: Math.round(b.width) } })()`);
        ok(g && g.ancho >= g.lista - 6, `${nombre}: el título ocupa todo el ancho de la grilla (${g && g.ancho}/${g && g.lista})`);
        await foto(`3-logros-${nombre}`);
        await N(`(() => { document.getElementById('logros-contenido').scrollTop = 99999; const c = document.getElementById('logros-contenido').closest('.panel-modal'); if (c) c.scrollTop = 99999; return 1 })()`); await N('N.tick(0.3)');
        await foto(`3-logros-abajo-${nombre}`);
        await N('(() => { document.getElementById("cerrar-logros").click(); return 1 })()'); await N('N.tick(0.4)');
        await N('N.tecla("Escape")'); await N('N.tick(0.4)');
      }
      await tamano(ANCHO, ALTO);
      void antes;
    }


    // ---- la partida: capítulo 6, con escenas vividas de los capítulos 1 a 5 y de las optativas, y unos indicios y vecinos
    const VISTAS = ['trochita-boleto', 'estacion-llegada', 'algo-cruza', 'nota-eusebio', 'ronda-umbral', 'ramon-tranquera', 'almacen-ercilia', 'bolsa-alero', 'bolsa-rosa', 'hacha-tocon', 'placa-herminia', 'anden-graciela'];
    await prep(5, { horas: 12, vistas: VISTAS, decisiones: { bolsa: 'b', coihue: 'a' }, lazos: { ramon: 3, ercilia: 3, ema: 2, rosa: 3 } });
    await N(`(() => { const h = P.historia; h.raro = ${JSON.stringify(['algo-cruzo', 'ronda-ramitas'])}.map((id, i) => ({ id, dia: 2 + i })); h.optativas = { oveja: 4, 'frasco-masa-madre': 6 }; return 1 })()`);
    const tiene = await N(`(() => { const ids = Object.keys(P.historia.escenas.vistas); return ids.length })()`);
    console.log('  escenas vistas anotadas:', tiene);

    // ================================================================ 1. «Lo vivido» en el cuaderno
    if (va('vivido')) {
      donde = 'vivido';
      console.log('— 1. «Lo vivido» en el cuaderno');
      // una escena corrida de verdad con el director de la partida (queda vivida con su efecto)
      const antes = await N('Object.keys(P.historia.escenas.vistas).length');
      const r = await N('N.correrEscena("derrumbe-puertita", 120)');
      await N('N.despejar(10, { esc: true })'); await cerrarTarjetas();
      const despues = await N('Object.keys(P.historia.escenas.vistas).length');
      ok(r.disparo && r.termino, 'la escena corre hasta el final en la partida real');
      ok(despues === antes + 1 && (await N('!!P.historia.escenas.vistas["derrumbe-puertita"]')), `queda vivida: ${antes} → ${despues} escenas`);
      for (const [a, h, nombre] of [[ANCHO, ALTO, '1366x768'], [1024, 600, '1024x600']]) {
        await tamano(a, h);
        await N('N.tecla("KeyJ")'); await N('N.tick(0.6)');
        const tabs = await N(`[...document.querySelectorAll('#cuaderno-lista .pestanas button')].map((b) => b.textContent)`);
        ok(tabs.includes('Lo vivido'), `${nombre}: la pestaña «Lo vivido» está (pestañas: ${tabs.join(' · ')})`);
        await N(`(() => { const b = [...document.querySelectorAll('#cuaderno-lista .pestanas button')].find((x) => x.textContent === 'Lo vivido'); b.click(); return 1 })()`);
        await N('N.tick(0.5)');
        const txt = await N(`({ lista: document.getElementById('cuaderno-lista').innerText, ficha: document.getElementById('cuaderno-ficha').innerText })`);
        ok(/\d+ de 125 escenas vividas/.test(txt.lista), `${nombre}: el avance dice «${(txt.lista.match(/\d+ de 125 escenas vividas/) || [''])[0]}»`);
        ok(/5\. La rueda|1\. La llave/.test(txt.lista) || /La llave del molinero/.test(txt.lista), `${nombre}: la lista nombra los capítulos vividos`);
        // por defecto, el último capítulo vivido (el 4: el andén y la ingeniera, con la escena que se acaba de correr)
        ok(/Piedras en la vía/.test(txt.ficha) && /Graciela/.test(txt.ficha), `${nombre}: la ficha muestra lo vivido del último capítulo (con la escena recién corrida)`);
        ok(!/Lo que se pierde, aparece|La cosecha|El cuaderno de Eusebio|La noche de la nevada|El deshielo/.test(txt.lista + txt.ficha), `${nombre}: ningún título de capítulos que no tocaste`);
        const d1 = await N(`N.desborde('#cuaderno-ficha')`), d2 = await N(`N.desborde('#cuaderno-lista')`), d3 = await N(`N.desborde('#cuaderno-lista .pestanas')`);
        ok(d1.contenido <= d1.ancho + 1 && d2.contenido <= d2.ancho + 1 && d3.contenido <= d3.ancho + 1, `${nombre}: sin desborde a los costados (ficha ${d1.contenido}/${d1.ancho}, lista ${d2.contenido}/${d2.ancho}, pestañas ${d3.contenido}/${d3.ancho})`);
        await foto(`1-vivido-${nombre}`);
        // elegir el capítulo 1 con el botón
        await N(`(() => { const b = [...document.querySelectorAll('#cuaderno-lista ul.lista button')][0]; b.click(); return 1 })()`); await N('N.tick(0.5)');
        const c1 = await N(`document.getElementById('cuaderno-ficha').innerText`);
        ok(/La llave del molinero/.test(c1) && /Día 1 · /.test(c1) && /Elsa te cortó el boleto/.test(c1), `${nombre}: el capítulo 1 se lee con su día y su reseña`);
        await foto(`1-vivido-capitulo1-${nombre}`);
        await N(`(() => { const bs = [...document.querySelectorAll('#cuaderno-lista ul.lista button')]; bs[bs.length - 1].click(); return 1 })()`); await N('N.tick(0.4)');   // (vuelve al último: la elección se recuerda mientras dura la partida)
        await N('N.tecla("KeyJ")'); await N('N.tick(0.4)');
      }
      await tamano(ANCHO, ALTO);
    }

    // ================================================================ 2. los contadores de la guía
    if (va('guia')) {
      donde = 'guia';
      console.log('— 2. los contadores de la guía (F1)');
      for (const [a, h, nombre] of [[ANCHO, ALTO, '1366x768'], [1024, 600, '1024x600']]) {
        await tamano(a, h);
        await N('N.tecla("Escape")'); await N('N.tick(0.5)');
        await N('(() => { document.getElementById("btn-guia").click(); return 1 })()'); await N('N.tick(0.6)');
        const g = await N(`({ caja: (document.getElementById('historia-guia') || {}).innerText || '', metas: [...document.querySelectorAll('#historia-guia ul.metas li')].map((l) => l.textContent) })`);
        console.log('  contadores:', JSON.stringify(g.metas));
        const esp = await N(`({ raros: P.historia.raro.length, casa: Object.values(P.historia.lazos).filter((v) => v >= 3).length, opt: Object.keys(P.historia.optativas).length, vistas: Object.keys(P.historia.escenas.vistas).length })`);
        ok(g.metas.length === 4, `${nombre}: son cuatro contadores`);
        ok(g.metas[0] === 'Lo raro: ' + esp.raros + ' de 128' && esp.raros >= 2, `${nombre}: «${g.metas[0]}»`);
        ok(g.metas[1] === `De paso: ${esp.opt} de 34 (en una misma partida entran hasta 29)`, `${nombre}: «${g.metas[1]}»`);
        ok(g.metas[2] === `Vecinos de la casa: ${esp.casa} (hasta 12 en una misma partida)` && esp.casa === 3, `${nombre}: «${g.metas[2]}»`);
        ok(g.metas[3] === `Escenas vividas: ${esp.vistas} de 125`, `${nombre}: «${g.metas[3]}»`);
        ok(!/lazo|confianza|[+-]\d/i.test(g.metas.join(' ')), `${nombre}: ningún contador muestra un número de lazo`);
        const d = await N(`N.desborde('#guia .panel-modal')`);
        ok(d.hay && d.contenido <= d.ancho + 1, `${nombre}: la guía no se desborda a los costados (${d.contenido}/${d.ancho})`);
        const visible = await N(`(() => { const u = document.querySelector('#historia-guia ul.metas'); if (!u) return null; const r = u.getBoundingClientRect(); return { izq: Math.round(r.left), der: Math.round(r.right), ancho: window.innerWidth, ancho_ul: u.scrollWidth <= u.clientWidth + 1 } })()`);
        ok(visible && visible.izq >= 0 && visible.der <= visible.ancho && visible.ancho_ul, `${nombre}: los contadores caben a lo ancho (${visible && visible.izq}–${visible && visible.der} de ${visible && visible.ancho})`);
        await foto(`2-guia-${nombre}`);
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
