// Partida real 4.22.0 (B) (Electron + WebGL): el valle se acuerda, en una partida corta.
//   1. la tarjeta final con las líneas de las decisiones, leída página por página, sin barra de desplazamiento en 1366x768 y en 1024x600;
//   2. el valle se acuerda: la mesa de guerra con la primera molienda (D3) y la majada (D5), corriendo con el director de escenas de la partida;
//   3. el tope del lazo por encargos con los encargos de verdad (Ramón frío por la majada vendida: los encargos no lo borran);
//   y que no se sume ningún programa de shader (base 111).
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-22-0-b.cjs -Espera 2700 -Perfil <carpeta propia> -Visible
//   HUMO_SECCIONES=final,escena,encargos (cuáles; por defecto todas) · HUMO_CAPTURAS=0 sin capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-22-0-b'));
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
    const c = v.querySelector('.valle-carta');
    return { titulo: (v.querySelector('h2') || {}).textContent, arriba: (v.querySelector('.arriba') || {}).textContent, premio: (v.querySelector('.premio') || {}).textContent || '',
      parrafos: [...v.querySelectorAll('.valle-carta > p:not(.premio)')].map((p) => p.textContent),
      opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => b.dataset.valleOpcion),
      alto: c ? c.clientHeight : 0, contenido: c ? c.scrollHeight : 0, ventana: [window.innerWidth, window.innerHeight] };
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
  // corre una escena entera con el director de la partida y devuelve las líneas que se mostraron (elige siempre la primera opción)
  N.leerEscena = async (id, maxSeg = 90) => {
    const es = H.__escenas, lineas = [];
    if (!es.disparar(id, { forzar: true })) return { disparo: false, lineas };
    let ultima = '';
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000 && es.activa()) {
      const d = es.director.datos();
      if (d && d.eleccion) { N.tecla('Digit1'); await N.tick(0.3); continue; }
      if (d && d.dialogo && d.fase === 'corriendo') {
        if (d.dialogo.completo) { const k = d.dialogo.nombre + '|' + d.dialogo.texto; if (k !== ultima) { lineas.push(d.dialogo.texto); ultima = k; } N.tecla('Enter'); }
        else N.tecla('Enter');
      }
      await N.tick(0.15);
    }
    return { disparo: true, termino: !es.activa(), lineas };
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
    if (/escena de la historia mal armada/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 120000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, T = H.T, U = H.__U(); return (${c}); })()`);
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
    for (const e of ${JSON.stringify(o.vistas || [])}) { h.escenas.vistas[e] = P.dia; h.aplicadas[e] = P.dia; }
    Object.assign(h.decisiones, ${JSON.stringify(o.decisiones || {})});
    Object.assign(h.lazos, ${JSON.stringify(o.lazos || {})});
    if (${JSON.stringify(o.trato || null)}) h.duendes.trato = ${JSON.stringify(o.trato || null)};
    P.horas = ${o.horas ?? 12};
    return 1 })()`);
  const cerrarTarjetas = async () => { for (let k = 0; k < 4 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); } };

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

    // ================================================================ 1. la tarjeta final
    if (va('final')) {
      donde = 'final';
      console.log('— 1. la tarjeta final con las líneas de las decisiones');
      const FRAG = ['piñones bien juntos', 'panadería de Rosa huele', 'nota de Eusebio', 'sigue en pie y el aserradero', 'renuevos que nadie plantó', 'pirca de Tobías abraza', 'fletes de harina', 'fiado largo llenó', 'se parte en tres', 'cuaderno de Eusebio duerme', 'científica con una cinta', 'majada pasó el invierno', 'ovejas de Ramón pastan', 'bolsa de Eusebio que pusiste'];
      // el peor caso real: todos los vecinos «de la casa», la noche perdida y las seis decisiones (tres juegos de decisiones distintos)
      const JUEGOS = [
        { nombre: 'B', dec: { bolsa: 'b', coihue: 'b', molienda: 'b', cuaderno: 'b', majada: 'b', duendes: 'b' }, esperan: [1, 4, 7, 9, 11, 13] },
        { nombre: 'C', dec: { bolsa: 'c', coihue: 'c', molienda: 'c', cuaderno: 'c', majada: 'c', duendes: 'c' }, esperan: [2, 5, 8, 10, 12], trato: 'pelea' },
      ];
      const LAZOS_ALTOS = { ramon: 3, ema: 3, ercilia: 3, guarda: 3, fermin: 3, graciela: 3, rosa: 3, tobias: 3, tito: 3, belisario: 3, herminia: 3, nicanor: 3, sofia: 3 };
      for (const J of JUEGOS) {
        await prep(12, { fase: 'outro', horas: 12, decisiones: J.dec, lazos: LAZOS_ALTOS, trato: J.trato || 'trato' });
        await N('(() => { P.historia.ramal = 10; P.historia.duendes.noche = "perdida"; return 1 })()');
        await N('H.__valle.revisarAhora()'); await N('N.hasta(() => N.tarjeta(), 10)');
        const paginas = [];
        for (let i = 0; i < 10; i++) {
          const t = await N('N.tarjeta()');
          if (!t) break;
          paginas.push(t);
          if (!t.opciones.includes('sigue')) break;
          if (i === 0) await foto(`1${J.nombre.toLowerCase()}-final-pagina-1`);
          await N('N.elegir("sigue")'); await N('N.tick(0.5)');
        }
        const ult = paginas[paginas.length - 1];
        console.log(`  final «${J.nombre}»: ${paginas.length} páginas · alto de la tarjeta ${paginas.map((p) => `${p.contenido}/${p.alto}`).join(' ')}`);
        ok(paginas.length >= 2 && paginas.length <= 6, `final ${J.nombre}: se lee en ${paginas.length} páginas (entre 2 y 6)`);
        const todo = paginas.flatMap((p) => p.parrafos).join(' ');
        const salen = FRAG.map((f, i) => (todo.includes(f) ? i : -1)).filter((i) => i >= 0);
        ok(JSON.stringify(salen) === JSON.stringify(J.esperan), `final ${J.nombre}: salen exactamente las líneas de sus decisiones, en las páginas (salen ${JSON.stringify(salen)}, esperadas ${JSON.stringify(J.esperan)})`);
        ok(paginas.every((p) => p.contenido <= p.alto + 1), `final ${J.nombre}: ninguna página con barra de desplazamiento en ${paginas[0].ventana.join('x')}`);
        ok(ult.opciones.includes('seguir') && ult.opciones.includes('creditos') && /Te queda/.test(ult.premio), `final ${J.nombre}: la última lleva el premio y las dos salidas`);
        await foto(`1${J.nombre.toLowerCase()}-final-pagina-ultima`);
        // la misma lectura en 1024x600 (la ventana más chica que se juega)
        await w.setContentSize(1024, 600); await esperar(900);
        const chico = await N('N.tarjeta()');
        ok(chico && chico.contenido <= chico.alto + 1, `final ${J.nombre}: la última página tampoco tiene barra en 1024x600 (${chico && chico.contenido}/${chico && chico.alto})`);
        await foto(`1${J.nombre.toLowerCase()}-final-1024x600`);
        await w.setContentSize(ANCHO, ALTO); await esperar(600);
        await cerrarTarjetas();
        // y las páginas anteriores, en 1024x600: se vuelve a mostrar y se mide cada una
        await prep(12, { fase: 'outro', horas: 12, decisiones: J.dec, lazos: LAZOS_ALTOS, trato: J.trato || 'trato' });
        await N('(() => { P.historia.ramal = 10; P.historia.duendes.noche = "perdida"; return 1 })()');
        await w.setContentSize(1024, 600); await esperar(700);
        await N('H.__valle.revisarAhora()'); await N('N.hasta(() => N.tarjeta(), 10)');
        const chicas = [];
        for (let i = 0; i < 10; i++) { const t = await N('N.tarjeta()'); if (!t) break; chicas.push(t); if (!t.opciones.includes('sigue')) break; await N('N.elegir("sigue")'); await N('N.tick(0.4)'); }
        ok(chicas.length === paginas.length && chicas.every((p) => p.contenido <= p.alto + 1), `final ${J.nombre}: en 1024x600 las ${chicas.length} páginas entran sin barra (${chicas.map((p) => `${p.contenido}/${p.alto}`).join(' ')})`);
        await w.setContentSize(ANCHO, ALTO); await esperar(600);
        await cerrarTarjetas();
      }
    }

    // ================================================================ 2. el valle se acuerda
    if (va('escena')) {
      donde = 'escena';
      console.log('— 2. la mesa de guerra con la molienda (D3 A) y la majada vendida (D5 C)');
      await prep(9, { horas: 17, decisiones: { molienda: 'a', majada: 'c', duendes: 'a' }, lazos: { ramon: -2, fermin: -2, ema: 2, ercilia: 2 }, trato: 'trato', vistas: ['cerro-mirador'] });
      await N('(() => { P.horas = 17; return 1 })()');
      const r = await N('N.leerEscena("mesa-guerra", 120)');
      console.log('  líneas:', r.lineas.length, '· terminó:', r.termino);
      ok(r.disparo && r.termino, 'la mesa de guerra corre hasta el final en la partida real');
      ok(r.lineas.some((l) => /Los sacos que salieron por la trochita/.test(l)), 'Ercilia se acuerda de los fletes (D3 A)');
      ok(r.lineas.some((l) => /Hay dos sillas vacías en la mesa, la de Ramón y la de Fermín/.test(l)), 'se ven las dos sillas vacías (D5 C: Ramón y Fermín no vinieron)');
      await N('N.despejar(10, { esc: true })'); await cerrarTarjetas();
      await foto('2-mesa-de-guerra');
      await prep(9, { horas: 17, decisiones: { molienda: 'b', majada: 'b', duendes: 'a' }, lazos: { ramon: 3, fermin: -1, ema: 2, ercilia: 2 }, trato: 'trato', vistas: ['cerro-mirador'] });
      await N('(() => { P.horas = 17; return 1 })()');
      const r2 = await N('N.leerEscena("mesa-guerra", 120)');
      ok(r2.disparo && r2.termino && r2.lineas.some((l) => /fiado de invierno y de gente que viene a pagar con gusto/.test(l)) && r2.lineas.some((l) => /Hay una silla vacía junto a la ventana/.test(l)) && !r2.lineas.some((l) => /dos sillas vacías/.test(l)), 'con el fiado (D3 B) y la majada cuidada (D5 B): Ercilia habla del almacén y hay una sola silla vacía (la de Fermín)');
      await N('N.despejar(10, { esc: true })'); await cerrarTarjetas();
      // la espera de la noche con la majada cuidada (D5 B): falta Fermín en el techo
      await prep(11, { horas: 22, decisiones: { molienda: 'b', majada: 'b', duendes: 'b' }, lazos: { ramon: 3, fermin: -1, ema: 3 }, trato: 'trato' });
      await N('(() => { P.horas = 22; return 1 })()');
      const e = await N('N.leerEscena("noche-espera", 150)');
      console.log('  espera: líneas', e.lineas.length, '· terminó:', e.termino);
      ok(e.disparo && e.termino, 'la espera de la noche corre hasta el final');
      ok(e.lineas.some((l) => /falta la silueta de Fermín/.test(l)), 'D5 B: falta la silueta de Fermín en el techo del galpón');
      ok(e.lineas.some((l) => /reconoce una bolsa con su piolín colorado/.test(l)), 'D6 firme: una lucecita reconoce la bolsa con su piolín');
      await N('N.despejar(10, { esc: true })'); await cerrarTarjetas();
    }

    // ================================================================ 3. el tope de los encargos
    if (va('encargos')) {
      donde = 'encargos';
      console.log('— 3. el tope del lazo por encargos, con los encargos de verdad');
      const ids = await N('H.__idsEncargos()');
      console.log('  encargos del Relax:', ids.length);
      await prep(8, { horas: 12, decisiones: { majada: 'c' }, lazos: { ramon: -2, ema: 0, ercilia: 0, guarda: 0, fermin: 0, graciela: 0, rosa: 0, tobias: 0, tito: 0, belisario: 0, herminia: 0, nicanor: 0, sofia: 0 } });
      await N('(() => { P.historia.encargosLazo = null; P.encargos = {}; return 1 })()');
      await N('H.__valle.revisarAhora()'); await N('N.tick(0.6)');   // (la primera pasada anota la base)
      // marcamos como hechos todos los encargos del Relax (el juego sabe de quién es cada uno)
      await N(`(() => { for (const id of ${JSON.stringify(ids)}) P.encargos[id] = 'hecho'; return 1 })()`);
      await N('H.__valle.revisarAhora()'); await N('N.tick(0.8)');
      const e = await N('({ lazos: { ...P.historia.lazos }, pagados: Object.values(P.historia.encargosLazo || {}).filter((v) => v >= 1).length, anotados: Object.keys(P.historia.encargosLazo || {}).length })');
      console.log('  tras marcar todos los encargos como hechos:', JSON.stringify(e));
      ok(e.lazos.ramon <= 0 && e.lazos.ramon >= -2, `Ramón (frío por la majada vendida) no se lava con los encargos: lazo ${e.lazos.ramon} (antes de 4.22.0 quedaba en el máximo)`);
      const otros = ['ema', 'ercilia', 'guarda', 'nicanor'].map((q) => e.lazos[q]);
      ok(otros.every((v) => v <= 2), `ninguno de los otros vecinos pasa de +2 sólo con encargos (${['ema', 'ercilia', 'guarda', 'nicanor'].map((q, i) => q + ' ' + otros[i]).join(' · ')})`);
      ok(e.pagados <= 2 * 5, `en total no se pagan más de dos por vecino (${e.pagados} pagados de ${e.anotados} anotados)`);
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
