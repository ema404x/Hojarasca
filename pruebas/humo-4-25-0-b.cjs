// Partida real 4.25.0 (B) (Electron + WebGL): la pulida de la Historia, a ojo y medida.
//   1. botas: la E sobre las botas de la puerta apenas parado frente a ellas (sin esperar el cuarto de segundo del caché de «lo que se mira»): N intentos, todos tienen que anotar el indicio
//      (con HTML=<index.html de la 4.24.1> se ve que antes fallaba: es la prueba de que se reprodujo);
//   2. paneles: en 1366x768 y en 1024x600, las tarjetas de cada capítulo (la entrada, el cierre y las decisiones) y el panel de objetivos de cada capítulo:
//      cuánto miden contra la ventana (la tarjeta con barra de desplazamiento y el panel que se sale de la pantalla se cuentan), con capturas de los peores;
//   3. consola y programas de shader (la base es 111; esta versión no suma ninguno).
// Uso (después de node armar.mjs): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-25-0-b.ps1
//   (o con el candado a mano: herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-25-0-b.cjs -Espera 2700 -Perfil <carpeta propia> -Visible)
//   HUMO_SECCIONES=botas,paneles (cuáles; por defecto todas) · HUMO_CAPTURAS=0 sin capturas · HTML=<otro index.html> (para comparar con la versión anterior)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-25-0-b'));
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
const TAMANOS = [[1366, 768], [1024, 600]];

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
  N.cerrarTarjetas = async () => { for (let k = 0; k < 4 && N.tarjeta(); k++) { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion]:not([disabled])'); if (b) b.click(); await N.tick(0.5); } return 1; };
  N.despejar = async (maxSeg = 6) => {
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (es && es.activa()) {
        const d = es.director.datos && es.director.datos();
        if (d && d.eleccion) { N.tecla('Digit1'); await N.tick(0.3); continue; }
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
  N.avisos = () => [...document.querySelectorAll('#avisos-altos *, .nota, .aviso')].map((x) => x.textContent).join(' | ');
  // la partida en el capítulo n (índice), con lo anterior cerrado
  N.prep = (cap, horas, fase = 'jugando') => {
    const h = P.historia, ids = ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha', 'cuaderno', 'frios', 'golpea', 'arco', 'nevada', 'deshielo'];
    h.activa = true; h.empezada = 1; h.version = 2; h.capitulo = cap; h.fase = fase; h.base = { dia: P.dia, talados: 0, cocinadas: 0, cantos: 0 }; h.terminada = 0;
    ids.slice(0, cap).forEach((k) => { h.cerrados[k] = P.dia - 1; });
    P.horas = horas;
    return 1;
  };
  // lo que ocupa la tarjeta abierta y el panel de objetivos contra la ventana
  N.medir = () => {
    const vw = innerWidth, vh = innerHeight;
    const carta = document.querySelector('#valle-tarjeta:not(.oculto) .valle-carta');
    const c = carta ? { alto: Math.round(carta.getBoundingClientRect().height), scroll: carta.scrollHeight, cliente: carta.clientHeight, desborda: carta.scrollHeight > carta.clientHeight + 1,
      opcionesAbajo: Math.round(([...carta.querySelectorAll('button[data-valle-opcion]')].pop()?.getBoundingClientRect().bottom || 0)), minFuente: Math.min(...[...carta.querySelectorAll('p, li, b, small')].map((x) => parseFloat(getComputedStyle(x).fontSize))) } : null;
    const hud = document.getElementById('historia-hud');
    let p = null;
    if (hud && !hud.classList.contains('oculto')) {
      const r = hud.getBoundingClientRect();
      const choques = [];
      for (const e of document.querySelectorAll('#hud > *, body > *')) {
        if (e === hud || e.contains(hud) || hud.contains(e) || e.id === 'valle-tarjeta' || e.tagName === 'CANVAS' || e.id === 'mundo') continue;
        if (['aviso', 'estado', 'pista-clic', 'avisos-altos', 'equipo'].includes(e.id)) continue;   // lo que aparece y desaparece al pasar (el aviso de la E, el de «hacé clic») y la barra de herramientas, que se mira aparte
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || e.classList.contains('oculto')) continue;
        const q = e.getBoundingClientRect();
        if (q.width < 4 || q.height < 4) continue;
        if (q.width * q.height > vw * vh * 0.4) continue;   // las capas de pantalla casi completa (cielo, tinte, viñeta, escena…) no son un elemento que se pise
        if (q.left < r.right - 2 && q.right > r.left + 2 && q.top < r.bottom - 2 && q.bottom > r.top + 2) choques.push((e.id || e.className || e.tagName).toString().slice(0, 40));
      }
      const eq = document.getElementById('equipo'), qe = eq && eq.getBoundingClientRect();
      const pisaEquipo = !!(qe && qe.width > 4 && r.bottom > qe.top + 2 && r.left < qe.right && r.right > qe.left);
      p = { pisaEquipo, equipoArriba: qe ? Math.round(qe.top) : null, arriba: Math.round(r.top), abajo: Math.round(r.bottom), alto: Math.round(r.height), ancho: Math.round(r.width), sale: r.bottom > vh - 4, lineas: hud.querySelectorAll('p').length, choques };
    }
    return { vw, vh, carta: c, panel: p };
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: 1366, height: 768, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(1366, 768);
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
      await esperar(900 + intento * 600);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const { CAPITULOS } = await import(pathToFileURL(path.join(raiz, 'src', 'historia.js')).href);

  let prog0 = 0;
  try {
    // una partida nueva de Historia (se vuelve a cargar para cada tamaño de pantalla: así no queda ninguna escena ni tarjeta del tamaño anterior)
    const arrancar = async () => {
      donde = 'entrar';
      await w.loadFile(url, { search: '?debug=1' }); await js(ajustes('historia')); await cargar();
      await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
      await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
      await N('N.tick(2.5)');
      await N('N.hasta(() => N.tarjeta(), 12)'); await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15)'); await N('N.cerrarTarjetas()');
      await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; P.horas = 12; return 1 })()');
    };
    await arrancar();
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);

    // ================================================================ 1. la E sobre las botas, sin esperar el caché
    if (va('botas')) {
      donde = 'botas';
      console.log('— 1. la E sobre las botas apenas parado frente a ellas');
      await js(`(() => { if (!document.getElementById('sin-ui3')) { const s = document.createElement('style'); s.id = 'sin-ui3'; s.textContent = 'body > *:not(#mundo){visibility:hidden !important}'; document.head.appendChild(s); } return 1 })()`);
      const id = 'botas-calafate', INTENTOS = 8;
      let anotadas = 0;
      for (let i = 0; i < INTENTOS; i++) {
        await N(`(() => { const h = P.historia; h.raro = (h.raro || []).filter((x) => x.id !== "${id}"); if (h.objetos) delete h.objetos["${id}"]; return 1 })()`);   // (el indicio y la marca de «ya lo miraste»: si no, la E de la segunda vuelta no tiene nada que mirar)
        await N('N.prep(2, 17)');
        await N(`(() => { for (const e of ['ramon-tranquera', 'almacen-ercilia', 'ese-no-josefina', 'hacha-tocon', 'placa-herminia', 'mesa-visita-nicanor', 'mesa-visita-ramon', 'fermin-galpon']) P.historia.escenas.vistas[e] = 1; return 1 })()`);
        await N('N.despejar(8)'); await N('N.cerrarTarjetas()');
        await N('(() => { if (H.jugador.estado.sentado) H.jugador.sentarse(false); return 1 })()');
        // lejos del refugio un rato (el caché de «lo que se mira» queda en «nada») y de golpe frente a las botas, apenas un cuadro y la E
        await N('(() => { const r = T.lugares.refugio; H.jugador.ubicar(r.x + 60, r.z + 60, 0); return 1 })()');
        await N('N.tick(0.6)');
        const hay = await N(`(() => { const p = H.__historiaObjetos().posiciones["${id}"]; const m = H.__historiaObjetos().mallas["${id}"]; return !!(p && m && m.visible) })()`);
        if (!hay) { console.log('  (las botas no están a la vista: intento ' + (i + 1) + ')'); continue; }
        await N(`(() => { const r = T.lugares.refugio, d = H.__puntosHistoria()['refugio-puerta'], p = H.__historiaObjetos().posiciones["${id}"]; const ox = d.x - r.x, oz = d.z - r.z, ol = Math.hypot(ox, oz) || 1; const x = p.x + ox / ol * 1.6, z = p.z + oz / ol * 1.6; H.jugador.ubicar(x, z, Math.atan2(x - p.x, z - p.z)); H.jugador.estado.yaw = Math.atan2(x - p.x, z - p.z); H.jugador.estado.pitch = -0.28; return 1 })()`);
        await N('(() => { H.__bucle(); return 1 })()');   // un solo cuadro
        await N('N.tecla("KeyE")');
        await N('N.tick(0.8)');
        const dejoIndicio = await N(`(P.historia.raro || []).some((x) => x.id === "${id}")`);
        const sentado = await N('!!H.jugador.estado.sentado');
        console.log(`  intento ${i + 1}: ${dejoIndicio ? 'anotó el indicio' : 'NO anotó' + (sentado ? ' (te sentó en el banco)' : '')}`);
        if (dejoIndicio) anotadas++;
        await N('(() => { if (H.jugador.estado.sentado) H.jugador.sentarse(false); return 1 })()');
      }
      ok(anotadas === INTENTOS, `la E sobre las botas anotó el indicio en ${anotadas} de ${INTENTOS} intentos (apenas parado frente a ellas, con un solo cuadro)`);
      await js("document.getElementById('sin-ui3')?.remove(); 1");
    }

    // ================================================================ 2. tarjetas y panel en las dos pantallas
    if (va('paneles')) {
      donde = 'paneles';
      console.log('— 2. tarjetas y panel de objetivos en 1366x768 y 1024x600');
      const filas = [];
      for (const [ancho, alto] of TAMANOS) {
        w.setContentSize(ancho, alto); await esperar(900);
        await arrancar();
        await N('N.tick(0.5)');
        const tam = `${ancho}x${alto}`;
        let peorCarta = null, peorPanel = null;
        for (let cap = 0; cap < CAPITULOS.length; cap++) {
          const c = CAPITULOS[cap];
          const reg = async (clase, nombre) => {
            const m = await N('N.medir()');
            const fila = { tam, cap: c.id, clase, nombre, ...m };
            filas.push(fila);
            if (clase !== 'panel' && m.carta && (!peorCarta || m.carta.scroll - m.carta.cliente > peorCarta.m.carta.scroll - peorCarta.m.carta.cliente || (!peorCarta.m.carta.desborda && m.carta.scroll > peorCarta.m.carta.scroll))) peorCarta = { c: c.id, clase, nombre, m };
            if (clase === 'panel' && m.panel && (!peorPanel || m.panel.abajo > peorPanel.m.panel.abajo)) peorPanel = { c: c.id, m };
            return m;
          };
          // la entrada del capítulo
          await N('N.despejar(8)'); await N('N.cerrarTarjetas()');
          await N(`N.prep(${cap}, 11, 'intro')`);
          await N('N.hasta(() => N.tarjeta(), 8)');
          await N('N.tick(0.4)');
          await reg('intro', 'entrada');
          if (CAPTURAS && cap === 10) await foto(`2-${tam}-intro-${c.id}`);
          await N('N.cerrarTarjetas()');
          // el panel de objetivos con el capítulo en curso
          await N(`N.prep(${cap}, 11)`);
          await N('N.tick(1.2)');
          await N('N.despejar(8)'); await N('N.cerrarTarjetas()');
          const mp = await reg('panel', 'objetivos');
          if (CAPTURAS && (cap === 10 || cap === 8 || cap === 0)) await foto(`2-${tam}-panel-${c.id}`);
          // la decisión del capítulo (si tiene): la escena que la precede, vista
          for (const d of c.decisiones || []) {
            await N(`N.prep(${cap}, 11)`);
            await N(`(() => { P.historia.escenas.vistas["${d.tras}"] = P.dia; return 1 })()`);
            await N('N.hasta(() => N.tarjeta(), 10)');
            await N('N.tick(0.4)');
            await reg('decision', d.id);
            if (CAPTURAS) await foto(`2-${tam}-decision-${d.id}`);
            await N('(() => { P.historia.decisiones = P.historia.decisiones || {}; return 1 })()');
            await N('N.cerrarTarjetas()');
          }
          // el cierre (el del último capítulo abre el final y los créditos: se mira aparte)
          if (cap === CAPITULOS.length - 1) continue;
          await N(`N.prep(${cap}, 11, 'outro')`);
          await N('N.hasta(() => N.tarjeta(), 8)');
          await N('N.tick(0.4)');
          await reg('outro', 'cierre');
          await N('N.cerrarTarjetas()');
        }
        // resumen de este tamaño
        const delTam = filas.filter((f) => f.tam === tam);
        const cartas = delTam.filter((f) => f.carta);
        const desbordan = cartas.filter((f) => f.carta.desborda);
        const paneles = delTam.filter((f) => f.panel);
        const salen = paneles.filter((f) => f.panel.sale);
        const conChoques = paneles.filter((f) => f.panel.choques.length || f.panel.pisaEquipo);
        console.log(`  ${tam}: ${cartas.length} tarjetas medidas; las más altas: ${cartas.sort((a, b) => b.carta.alto - a.carta.alto).slice(0, 3).map((f) => `${f.cap}/${f.nombre} ${f.carta.alto}px`).join(', ')}; con barra de desplazamiento: ${desbordan.length}${desbordan.length ? ' (' + desbordan.map((f) => `${f.cap}/${f.nombre}`).join(', ') + ')' : ''}`);
        console.log(`  ${tam}: ${paneles.length} paneles; el más alto ${Math.max(0, ...paneles.map((f) => f.panel.abajo))}px de ${alto}; que se salen de la pantalla: ${salen.length}${salen.length ? ' (' + salen.map((f) => `${f.cap} abajo=${f.panel.abajo}`).join(', ') + ')' : ''}; que pisan otra cosa del HUD: ${conChoques.length}${conChoques.length ? ' (' + conChoques.map((f) => `${f.cap}: ${f.panel.choques.join("+")}${f.panel.pisaEquipo ? " + la barra de herramientas (arriba de " + f.panel.equipoArriba + ")" : ""}`).join('; ') + ')' : ''}`);
        ok(desbordan.length === 0, `${tam}: ninguna tarjeta necesita barra de desplazamiento (se leen enteras)`);
        ok(salen.length === 0, `${tam}: el panel de objetivos entra en la pantalla en todos los capítulos`);
        ok(conChoques.length === 0, `${tam}: el panel de objetivos no pisa otra cosa del HUD`);
        ok(cartas.every((f) => f.carta.minFuente >= 12), `${tam}: ninguna letra de las tarjetas baja de 12 px`);
        fs.writeFileSync(path.join(salida, `medidas-${tam}.json`), JSON.stringify(delTam, null, 1));
      }
      w.setContentSize(1366, 768); await esperar(600);
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
