// Partida real 4.21.0 (B) (Electron + WebGL): la Historia arranca bien, en una partida corta.
//   1. el arranque de una Historia nueva con los ajustes de fábrica (verano) y «Hora de tu reloj» puesta: los chips de la estación y del reloj se apagan con el motivo,
//      el día vuelve a durar 30 minutos, «Primeros pasos» no aparece y el panel del capítulo es el único;
//   2. la estación propia: capítulo 9 con «Verano» en los ajustes: el invierno de la historia se aplica (antes: valle verde); con la bandera de las Historias
//      anteriores a la 4.21.0 se respeta el verano elegido (así se reproduce el «antes»);
//   3. la línea de espera del panel («Falta esperar hasta las 0:30…») y sentado (R) el reloj corre más rápido;
//   4. un indicio antes: la risa de la primera noche, anotada al despertar;
//   5. el premio en pesos al cerrar un capítulo (con el renglón corto en el libro);
//   6. la meta con plata del acto I (el puesto de la feria) en el tablón;
//   y que no se sume ningún programa de shader (base 111).
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-21-0-b.cjs -Espera 2700 -Perfil <carpeta propia> -Visible
//   HUMO_SECCIONES=arranque,estacion,espera,indicio,premio,metas (cuáles; por defecto todas) · HUMO_CAPTURAS=0 sin capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-21-0-b'));
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
    return { titulo: (v.querySelector('h2') || {}).textContent, arriba: (v.querySelector('.arriba') || {}).textContent, premio: (v.querySelector('.premio') || {}).textContent || '',
      opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => b.dataset.valleOpcion) };
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
  N.panel = () => { const p = document.getElementById('historia-hud'); return p && !p.classList.contains('oculto') ? p.textContent : ''; };
  N.panelHtml = () => { const p = document.getElementById('historia-hud'); return p && !p.classList.contains('oculto') ? p.innerHTML : ''; };
  N.guiaVisible = () => { const t = document.getElementById('tutorial'); return !!t && !t.classList.contains('oculto'); };
  N.chips = (clave, valor) => [...document.querySelectorAll('[data-ajuste="' + clave + '"] button' + (valor ? '[data-valor="' + valor + '"]' : ''))].map((b) => b.disabled);
  N.avisos = () => [...document.querySelectorAll('[data-aviso-ajuste]')].filter((e) => !e.classList.contains('oculto')).map((e) => e.dataset.avisoAjuste + ': ' + e.textContent);
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
    if (/escena de la historia mal armada/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 120000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, T = H.T, U = H.__U(); return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  // (con la guía del primer día encendida —de fábrica— y «Verano» y «Hora de tu reloj» puestos: lo que le pasa a quien nunca tocó los ajustes, o los tocó mal)
  const ajustes = (tipo, extra = {}) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false, guiaPrimerDia:true}, ${JSON.stringify(extra)}))); 1`;
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
  // la partida en el capítulo `cap` (índice), sin tocar la bandera de la Historia (arranqueNuevo)
  const prep = (cap, o = {}) => N(`(() => {
    const h = P.historia, ids = ${JSON.stringify(IDS)};
    h.activa = true; h.empezada = 1; h.version = 2; h.capitulo = ${cap}; h.fase = '${o.fase || 'jugando'}'; h.base = { dia: P.dia, talados: 0, cocinadas: 0, cantos: 0 }; h.terminada = 0;
    ids.slice(0, ${cap}).forEach((k) => { h.cerrados[k] = P.dia - 1; });
    for (const e of ${JSON.stringify(o.vistas || [])}) { h.escenas.vistas[e] = P.dia; h.aplicadas[e] = P.dia; }
    P.horas = ${o.horas ?? 12};
    return 1 })()`);
  const cerrarTarjetas = async () => { for (let k = 0; k < 4 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); } };
  const tablon = async () => { await N('H.__valle.revisarAhora()'); await N('N.tick(0.8)'); return N('N.panel()'); };

  let prog0 = 0;
  try {
    // ================================================================ 1. el arranque
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes('historia', { estacion: 'verano', duracion: 'reloj' })); await cargar();
    if (va('arranque')) {
      console.log('— 1. el arranque de una Historia nueva (ajustes de fábrica: Verano y Hora de tu reloj)');
      const portada = await js(`({ est: [...document.querySelectorAll('[data-ajuste="estacion"] button')].map((b) => b.disabled), avisos: [...document.querySelectorAll('[data-aviso-ajuste]')].filter((e) => !e.classList.contains('oculto')).map((e) => e.dataset.avisoAjuste + ': ' + e.textContent) })`);
      console.log('  portada:', JSON.stringify(portada));
      ok(portada.est.length > 0 && portada.est.every(Boolean), 'en la portada, con «Historia» elegida, los chips de la estación están apagados');
      ok(portada.avisos.some((a) => /^estacion: .*pasan solas/.test(a)), 'y el aviso dice el motivo («las estaciones pasan solas»)');
    }
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)');
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);
    if (va('arranque')) {
      const e = await N(`({ dur: H.ajustes.duracion, nuevo: P.historia.arranqueNuevo, guia: N.guiaVisible(), panel: N.panel().replace(/\\s+/g, ' ').slice(0, 200), hora: P.horas })`);
      console.log('  al entrar:', JSON.stringify(e));
      ok(e.dur === 30, 'con «Hora de tu reloj» puesta, al empezar la Historia el día vuelve a durar 30 minutos');
      ok(e.nuevo === true, 'la Historia nueva lleva la bandera de la estación propia');
      ok(e.guia === false, '«Primeros pasos» no aparece');
      await N('N.hasta(() => N.tarjeta(), 12)');
      const t = await N('N.tarjeta()');
      ok(t && /La llave del molinero/.test(t.titulo || ''), 'la tarjeta de entrada del capítulo 1');
      await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })'); await cerrarTarjetas();
      const e2 = await N('({ guia: N.guiaVisible(), panel: N.panel().replace(/\\s+/g, " ").slice(0, 400) })');
      console.log('  ya jugando:', JSON.stringify(e2));
      ok(e2.guia === false && /Capítulo 1/.test(e2.panel), 'ya jugando: un solo panel (el del capítulo)');
      await foto('1-minuto-uno-panel-unico');
      // los chips de los ajustes (abrir la pausa los vuelve a pintar)
      await N('N.tecla("Escape")'); await N('N.tick(0.6)');
      const aj = await N(`({ est: N.chips('estacion'), reloj: N.chips('duracion', 'reloj'), veinte: N.chips('duracion', '20'), avisos: N.avisos() })`);
      console.log('  en la pausa:', JSON.stringify(aj));
      ok(aj.est.length > 0 && aj.est.every(Boolean) && aj.reloj.every(Boolean) && aj.veinte.every((x) => x === false), 'en la pausa: la estación y «Hora de tu reloj» apagadas; las otras duraciones andan');
      ok(aj.avisos.length >= 2, 'con el motivo debajo de cada uno');
      const marcado = await js("[...document.querySelectorAll('[data-ajuste=\"estacion\"] button')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.valor)");
      console.log('  chip marcado:', JSON.stringify(marcado));
      ok(marcado.length === 2 && marcado.every((v) => v === 'auto'), 'el chip marcado es «Que pasen solas» (la estación que rige), no el «Verano» guardado');
      await foto('1b-ajustes-apagados');
      await N('N.tecla("Escape")'); await N('N.tick(0.6)');
    } else {
      await N('N.hasta(() => N.tarjeta(), 12)'); await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })'); await cerrarTarjetas();
    }
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 3; P.horas = 12; return 1 })()');

    // ================================================================ 2. la estación propia
    if (va('estacion')) {
      donde = 'estacion';
      console.log('— 2. la estación propia: capítulo 9 con «Verano» en los ajustes');
      await prep(8, { horas: 12 });
      console.log('  ajuste de estación:', await N('H.ajustes.estacion'), '· bandera de la Historia:', await N('P.historia.arranqueNuevo'));
      await N('H.__valle.revisarAhora()');
      const llego = await N('N.hasta(() => U.uInvierno.value > 0.9, 40)');
      await N('N.tick(3)');
      const inv = await N('+U.uInvierno.value.toFixed(2)');
      ok(llego && inv > 0.9, `Historia nueva: en el capítulo 9 el invierno de la historia se aplica aunque el ajuste diga «Verano» (invierno ${inv})`);
      await N('N.tick(2)'); await foto('2a-capitulo-9-estacion-propia');
      // el «antes»: una Historia anterior a la 4.21.0 (sin la bandera) con el verano elegido a mano
      await N('(() => { P.historia.arranqueNuevo = false; return 1 })()'); await N('H.__valle.revisarAhora()');
      const vuelve = await N('N.hasta(() => U.uInvierno.value < 0.1, 40)');
      await N('N.tick(3)');
      const inv2 = await N('+U.uInvierno.value.toFixed(2)');
      ok(vuelve && inv2 < 0.1, `Historia anterior (sin la bandera): se respeta el verano elegido (invierno ${inv2})`);
      await N('N.tick(2)'); await foto('2b-capitulo-9-verano-elegido-antes');
      await N('(() => { P.historia.arranqueNuevo = true; return 1 })()');
      await N('N.hasta(() => U.uInvierno.value > 0.9, 40)');
    }

    // ================================================================ 3. la línea de espera
    if (va('espera')) {
      donde = 'espera';
      console.log('— 3. la línea de espera del panel (la guardia del molino, capítulo 6)');
      await N('(() => { P.dia = 6; return 1 })()');
      await prep(5, { horas: 12 });
      const panel = await tablon();
      const html = await N('N.panelHtml()');
      console.log('  panel:', JSON.stringify(panel.replace(/\s+/g, ' ').slice(0, 520)));
      ok(/Hacé guardia en el molino viejo, pasada la medianoche/.test(panel) && /0:30/.test(panel) && /2:30/.test(panel) && !/22 y las 2/.test(panel), 'el objetivo de la guardia dice «entre las 0:30 y las 2:30», no «entre las 22 y las 2»');
      ok(/<p class="espera">Falta esperar hasta las 0:30 \(de madrugada\) \(R te sienta y el reloj corre más rápido\)<\/p>/.test(html), 'debajo del objetivo, la línea gris: «Falta esperar hasta las 0:30 (de madrugada) (R te sienta…)»');
      await foto('3-linea-de-espera');
      // sentado (R) el reloj corre más rápido
      await N('H.jugador.sentarse(false)');
      const h0 = await N('P.horas'); await N('N.tick(3)'); const h1 = await N('P.horas');
      await N('N.tecla("KeyR")'); await N('N.tick(0.4)');
      const sent = await N('!!H.jugador.estado.sentado');
      const h2 = await N('P.horas'); await N('N.tick(3)'); const h3 = await N('P.horas');
      const d0 = ((h1 - h0 + 24) % 24), d1 = ((h3 - h2 + 24) % 24);
      console.log(`  de pie: +${d0.toFixed(3)} h en 3 s · sentado: +${d1.toFixed(3)} h en 3 s`);
      ok(sent && d1 > d0 * 3, 'con R el reloj corre mucho más rápido (la línea no miente)');
      await N('N.tecla("KeyR")'); await N('N.tick(0.4)');
    }

    // ================================================================ 4. un indicio antes
    if (va('indicio')) {
      donde = 'indicio';
      console.log('— 4. la risa de la primera noche');
      await N('(() => { P.dia = 7; P.horas = 8; return 1 })()');
      await prep(0, { horas: 8 });
      await N('(() => { P.historia.raro = []; P.historia.base.dia = P.dia - 1; return 1 })()');   // (pasó la primera noche)
      await N('N.notas.length = 0');
      await N('H.__valle.revisarAhora()'); await N('N.tick(1.5)');
      const r = await N('({ raro: P.historia.raro.map((x) => x.id), notas: N.notas.slice() })');
      console.log('  lo raro:', JSON.stringify(r.raro), '· notas:', JSON.stringify(r.notas.slice(0, 4)));
      ok(r.raro.includes('risa-primera-noche'), 'al despertar la primera mañana el cuaderno anota la risa del arroyo');
      ok(r.notas.some((x) => /El cuaderno anota algo raro/.test(x) && /risa/.test(x)), 'y lo avisa en pantalla');
    }

    // ================================================================ 5. el premio en pesos
    if (va('premio')) {
      donde = 'premio';
      console.log('— 5. el premio en pesos al cerrar el capítulo 3');
      await N('(() => { P.dia = 9; return 1 })()');
      await prep(2, { fase: 'outro', horas: 12 });
      await cerrarTarjetas();
      await N('H.__valle.revisarAhora()'); await N('N.hasta(() => N.tarjeta(), 10)');
      const t = await N('N.tarjeta()');
      console.log('  tarjeta de cierre:', JSON.stringify(t));
      ok(t && /Capítulo 3 · terminado/.test(t.arriba || '') && /\$1\.400/.test(t.premio || ''), 'la tarjeta de cierre del capítulo 3 dice «Te queda: … $1.400 …»');
      await foto('5a-tarjeta-de-cierre');
      const antes = await N('P.economia.pesos');
      await N('N.elegir("seguir")'); await N('N.tick(2)');
      const e = await N('({ pesos: P.economia.pesos, libro: P.economia.libro.slice(-2) })');
      console.log('  pesos:', antes, '→', e.pesos, JSON.stringify(e.libro));
      ok(e.pesos - antes === 1400, `al seguir se cobran los $1.400 (de ${antes} a ${e.pesos})`);
      ok(e.libro.some((x) => x.monto === 1400 && x.motivo === 'La historia del valle · La mesa larga'), 'y el libro de pesos dice «La historia del valle · La mesa larga», no el texto largo');
      await cerrarTarjetas();
    }

    // ================================================================ 6. la meta con plata
    if (va('metas')) {
      donde = 'metas';
      console.log('— 6. la meta con plata del acto I');
      await N('(() => { P.dia = 12; return 1 })()');
      await prep(2, { horas: 12 });
      const panel = await tablon();
      console.log('  panel:', JSON.stringify(panel.replace(/\s+/g, ' ').slice(-260)));
      ok(/Un puesto propio en la feria/.test(panel) && /\$6\.000/.test(panel) && /banco del pueblo/.test(panel), 'el tablón de «De paso» ofrece el puesto propio en la feria y dice cuánto cuesta');
      await N('N.despejar(40, { esc: true })'); await cerrarTarjetas(); await N('N.tick(1)');
      await foto('6-meta-con-plata');
      await N('(() => { P.negocios = P.negocios || {}; P.negocios.casas = P.negocios.casas || {}; P.negocios.casas.puesto = { desde: 1, caja: 0, stock: {}, dia: 1 }; return 1 })()');
      await N('H.__valle.revisarAhora()'); await N('N.tick(1)');
      ok(await N('P.historia.optativas["puesto-feria"] !== undefined'), 'con el puesto comprado, la meta queda hecha');
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
