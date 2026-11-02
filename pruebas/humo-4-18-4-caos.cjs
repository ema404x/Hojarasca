// 4.18.4 (C): caos de entrada en plena Historia (Electron + WebGL real, reloj falso de 50 ms por cuadro: el mismo recorrido con la misma semilla). Un jugador que aprieta cualquier
// cosa MIENTRAS corre una escena: Esc, Enter, E, Espacio, Tab, F1, dígitos, clics en el cuadro de diálogo y en el mundo, teclas sostenidas, cambios de resolución de la ventana,
// minimizar y restaurar, perder y recuperar el foco, cambios de ajustes en vivo (calidad, campo de visión, subtítulos, tamaño de letra, movimiento de cámara, paleta, límite de cuadros),
// guardar. Después suelta todo y deja que la escena termine: tiene que cerrar (o saltarse), dejar la cámara y los personajes en su lugar y la partida jugable.
// Además: guardar y cargar en bucle con la Historia en curso (también a mitad de escena), abrir y cerrar cada menú (teclas y botones de la pausa), y pausar durante cada tipo de
// escena (diálogo, pregunta, plano sin texto, fundido) y durante la noche de la nevada: la pausa tiene que congelar la escena y al volver tiene que seguir.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-18-4-caos.cjs -Espera 2700 -Perfil <carpeta propia> -Visible
//   CAOS_SEMILLA=n · CAOS_PASOS=n (acciones por escena, 120) · CAOS_ESCENAS=id1,id2 · CAOS_FASES=a,b,c,d (cuáles)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const { DETERMINISTA } = require('./ayuda-determinista.cjs');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 44 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 44 * 60 * 1000).unref?.();
const SEMILLA = Number(process.env.CAOS_SEMILLA || 4184);
const PASOS = Number(process.env.CAOS_PASOS || 120);
const FASES = (process.env.CAOS_FASES || 'a,b,c,d').split(',');
const ESCENAS = (process.env.CAOS_ESCENAS || 'nota-eusebio,bolsa-alero,galpon-encuentro,ramon-cama,fermin-tranquera,primera-molienda,fogon-leyenda,noche-espera,umbral-fin').split(',').filter(Boolean);
let s = SEMILLA >>> 0;
const azar = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };
const uno = (l) => l[Math.floor(azar() * l.length)];

const TECLAS_ESCENA = ['Escape', 'Escape', 'Enter', 'Enter', 'Space', 'Tab', 'KeyE', 'KeyE', 'KeyF', 'KeyH', 'KeyG', 'KeyY', 'KeyB', 'KeyT', 'KeyV', 'KeyR', 'KeyO', 'KeyX', 'KeyC', 'KeyQ', 'KeyM', 'KeyI', 'KeyJ', 'KeyP', 'KeyN', 'KeyK', 'KeyL', 'KeyU', 'KeyZ',
  'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'F1', 'F2', 'F3', 'Backspace', 'Delete', 'BracketLeft', 'BracketRight'];
const AJUSTES_VIVOS = ['calidad', 'tamanoLetra', 'subtitulos', 'movimientoCamara', 'paleta', 'limiteFps', 'sonidosEscritos', 'modoFluido', 'invertirY', 'vibracion', 'virado', 'musica', 'guiaPrimerDia', 'autoCalidad', 'distancia', 'distanciaPlantas'];

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, P = H.progreso;
  const C = window.__C = { malas: [], pasos: [] };
  const dir = () => H.__escenas.director;
  const frames = (n) => window.__cuadros(n, 50);
  const tecla = (code, mant = 1) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true })); frames(mant); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); };
  C.tecla = tecla;
  C.perfil = (p) => {
    const h = P.historia;
    h.activa = true; h.empezada = h.empezada || 1; h.version = 2; h.capitulo = 12; h.fase = 'jugando';
    Object.assign(h.decisiones, { bolsa: 'a', coihue: 'a', molienda: 'c', cuaderno: 'a', majada: 'a', duendes: 'a' });
    h.duendes.trato = 'trato';
    for (const k of Object.keys(h.lazos)) h.lazos[k] = 1;
    return 1;
  };
  // F1 abre la pausa con la guía; F1 (o Esc) cierra la guía y vuelve a la pausa; Esc cierra la pausa
  C.cerrarPausa = () => { for (let i = 0; i < 5 && H.__caidas.modo() !== "jugando"; i++) tecla(i === 0 ? "F1" : "Escape", 3); return H.__caidas.modo(); };
  C.tarjetaAbierta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  C.velos = () => [...document.querySelectorAll('section.velo, #inicio, #foto-panel, #valle-tarjeta, #pausa, #cuaderno, #mapa-panel, #historia-guia, #personal, #almacen, #mochila-panel')].filter((e) => !e.classList.contains('oculto') && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden').map((e) => e.id);
  // lo que no puede pasar nunca
  C.revisar = () => {
    const mal = [], js = H.jugador.estado, p = js.pos, c = H.camara.position;
    if (![p.x, p.y, p.z, js.yaw, js.pitch].every(Number.isFinite)) mal.push('jugador no finito');
    else if (!js.enTren && !js.nadando && !js.enKayak && !js.enVela && p.y < T.altura(p.x, p.z) - 1.5) mal.push('jugador bajo el suelo ' + (p.y - T.altura(p.x, p.z)).toFixed(2));
    if (![c.x, c.y, c.z].every(Number.isFinite)) mal.push('cámara no finita');
    else if (c.y < T.altura(c.x, c.z) + 0.05 && !(js.nadando || js.enKayak || js.enVela)) mal.push('cámara bajo el suelo ' + (c.y - T.altura(c.x, c.z)).toFixed(2));
    if (!Number.isFinite(P.horas) || !Number.isFinite(P.dia)) mal.push('hora o día no finitos');
    for (const [k, n] of Object.entries(P.materiales || {})) if (!Number.isFinite(n) || n < 0) mal.push('material ' + k + ' = ' + n);
    for (const [k, n] of Object.entries(P.cosas || {})) if (typeof n === 'number' && (!Number.isFinite(n) || n < 0)) mal.push('cosa ' + k + ' = ' + n);
    if (!Number.isFinite(P.ramitas) || P.ramitas < 0) mal.push('ramitas = ' + P.ramitas);
    for (const [k, n] of Object.entries(P.historia.lazos || {})) if (!Number.isFinite(n) || n < -2 || n > 3) mal.push('lazo ' + k + ' = ' + n);
    const fal = H.__caidas.fallas(); if (fal.length) mal.push('fallas de sistema: ' + JSON.stringify(fal).slice(0, 160));
    const act = H.__escenas.activa(), b = document.body.classList;
    if (!act && (b.contains('escena-en-curso') || b.contains('escena-saliendo')) ) mal.push('barras de cine sin escena');
    if (act && !(b.contains('escena-en-curso') || b.contains('escena-saliendo') || b.contains('escena-tapada'))) mal.push('escena activa sin barras de cine');
    return mal;
  };
  C.escena = (id) => {
    for (let i = 0; i < 8 && H.__escenas.activa(); i++) { dir().saltar(); frames(10); }
    C.perfil(); P.horas = 10;
    delete P.historia.escenas.vistas[id];   // (como si fuera la primera vez: así se ve si guardar a mitad de escena la deja «vista» sin haber terminado)
    try { H.__colocarEscena(id); } catch (e) { /* sin colocación */ }
    frames(8);
    return H.__escenas.disparar(id, { forzar: true });
  };
  C.estado = () => ({ escena: H.__escenas.activa() ? dir().idActual() : null, fase: H.__escenas.activa() ? dir().fase() : null, modo: H.__caidas.modo(), velos: C.velos(), t: H.__escenas.activa() && dir().__sesion() ? +dir().__sesion().t.toFixed(2) : null, idx: H.__escenas.activa() && dir().__sesion() ? dir().__sesion().idx : null });
  // una acción de caos (las de la ventana las hace Node)
  C.clic = (donde, boton) => {
    const o = { button: boton, buttons: boton === 2 ? 2 : 1, bubbles: true, cancelable: true, clientX: 300 + Math.floor(Math.random() * 500), clientY: 200 + Math.floor(Math.random() * 300) };
    let el = null;
    if (donde === 'dialogo') el = document.getElementById('escena-dialogo');
    else if (donde === 'opcion') el = document.querySelector('#escena-dialogo button[data-i]');
    else if (donde === 'capa') el = document.getElementById('escena-capa');
    else if (donde === 'tarjeta') el = document.querySelector('#valle-tarjeta button');
    else el = document.getElementById('mundo') || document.querySelector('canvas');
    if (!el) return 0;
    for (const t of ['mousedown', 'mouseup', 'click']) el.dispatchEvent(new MouseEvent(t, o));
    return 1;
  };
  C.ajuste = (clave) => {
    const bs = [...document.querySelectorAll('[data-ajuste="' + clave + '"] button[data-valor]')];
    if (!bs.length) return 0;
    bs[Math.floor(Math.random() * bs.length)].click();
    return 1;
  };
  C.fov = () => { const r = document.querySelector('[data-ajuste-rango="fov"]'); if (!r) return 0; r.value = String(Math.floor(r.min) + Math.floor(Math.random() * (r.max - r.min))); r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); return 1; };
  // suelta todo y deja que la escena termine leyéndola con Enter
  C.terminarEscena = (maxF = 4000) => {
    for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'KeyZ', 'Space', 'KeyC']) document.dispatchEvent(new KeyboardEvent('keyup', { code: k, bubbles: true }));
    // cerrar lo que haya encima: pausas, menús, el cuaderno, el mapa
    for (let i = 0; i < 4 && H.__caidas.modo() !== 'jugando'; i++) { try { H.volverAlJuego(); } catch (e) { /* ya */ } frames(2); }
    const d = dir(); let f = 0;
    for (; f < maxF && d.activa(); f++) {
      frames(1);
      const dat = d.datos(); if (!dat) break;
      if (dat.eleccion) { if (d.eleccionLista()) d.elegir(Math.floor(Math.random() * dat.eleccion.opciones.length)); }
      else if (dat.dialogo) d.avanzar();
    }
    // (una escena que el juego dispara sola al terminar ésta, como una cadena, se lee también)
    for (let cadena = 0; cadena < 4; cadena++) { frames(40); if (!d.activa()) break; for (let g = 0; g < 4000 && d.activa(); g++) { frames(1); const dt = d.datos(); if (!dt) break; if (dt.eleccion) { if (d.eleccionLista()) d.elegir(0); } else if (dt.dialogo) d.avanzar(); } }
    const cerro = !d.activa();
    if (!cerro) { d.saltar(); for (let i = 0; i < 8 && d.activa(); i++) frames(10); }
    frames(40);
    // lo que el caos haya abierto fuera de la escena (la guía, el mapa…) se cierra como lo cierra un jugador: con Esc
    const abiertos0 = C.velos();
    for (let i = 0; i < 5 && (C.velos().length || H.__caidas.modo() !== 'jugando'); i++) tecla('Escape', 3);
    const modoTrasEsc = H.__caidas.modo(), velosTrasEsc = C.velos();
    for (let i = 0; i < 3 && H.__caidas.modo() !== 'jugando'; i++) { try { H.volverAlJuego(); } catch (e) { /* ya */ } frames(3); }
    if (modoTrasEsc !== 'jugando' || velosTrasEsc.length) return { cerro, seg: +(f * 0.05).toFixed(1), abiertos0, cierranConEsc: false, trasEsc: { modo: modoTrasEsc, velos: velosTrasEsc } };
    return { cerro, seg: +(f * 0.05).toFixed(1), abiertos0, cierranConEsc: !C.velos().length };
  };
  // ¿se puede caminar?
  C.camina = () => {
    const js = H.jugador.estado, x0 = js.pos.x, z0 = js.pos.z;
    if (js.enTren || js.enKayak || js.enVela || js.sentado) return true;
    // (el jugador puede haber quedado mirando una pared: se prueba para adelante, atrás y los costados)
    for (const k of ['KeyW', 'KeyS', 'KeyA', 'KeyD']) {
      const x1 = js.pos.x, z1 = js.pos.z;
      document.dispatchEvent(new KeyboardEvent('keydown', { code: k, key: k, bubbles: true }));
      frames(30);
      document.dispatchEvent(new KeyboardEvent('keyup', { code: k, bubbles: true }));
      frames(4);
      if (Math.hypot(js.pos.x - x1, js.pos.z - z1) > 0.3) return true;
    }
    return false;
  };
  C.diagCamina = () => { const js = H.jugador.estado; const o = {}; for (const [k, v] of Object.entries(js)) if (typeof v === 'boolean' && v) o[k] = true; return { banderas: o, pos: [js.pos.x, js.pos.y, js.pos.z].map((n) => +n.toFixed(2)), vel: [js.vel.x, js.vel.z].map((n) => +n.toFixed(2)), modo: H.__caidas.modo(), velos: C.velos(), tarjeta: C.tarjetaAbierta(), escena: H.__escenas.activa(), teclas: [...(H.jugador.teclas || [])] }; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const consola = [], problemas = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  let donde = 'carga', ultimo = '';
  const anotar = (m) => { const k = `[${donde}] ${m}`; if (!problemas.includes(k)) { problemas.push(k); console.log(`  ✗ ${k}\n      último paso: ${ultimo}`); } };
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push({ en: donde, m: m.slice(0, 300) }); anotar('consola: ' + m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => anotar('el proceso de la página se cayó: ' + JSON.stringify(d)));
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 90 s (${donde})`)), 90000))]);
  const C = (c) => js(`(async () => { const H = window.__hojarasca, C = window.__C, P = H.progreso; return (${c}); })()`);
  const url = path.join(raiz, 'index.html');
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false})); 1`;
  const entrar = async (nueva) => {
    if (nueva) { await w.loadFile(url, { search: '?debug=1' }); await js(ajustes); }
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js('window.__sinPausaPorBlur = true; 1');
    await js(DETERMINISTA(SEMILLA));
    await js(PAGINA);
    await js('window.__cuadros(80, 50)');
    await js(`(() => { for (let i = 0; i < 3; i++) { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion]'); if (b) { b.click(); window.__cuadros(10, 50); } } return 1 })()`);
  };
  const revisar = async () => { const mal = await C('C.revisar()'); for (const m of mal) anotar(m); return mal; };
  const accion = async () => {
    const r = azar();
    if (r < 0.56) {
      const t = uno(TECLAS_ESCENA), mant = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft'].includes(t) ? 3 + Math.floor(azar() * 14) : 1 + Math.floor(azar() * 3);
      ultimo = `tecla ${t} (${mant})`; await C(`C.tecla(${JSON.stringify(t)}, ${mant})`);
    } else if (r < 0.72) {
      const d = uno(['dialogo', 'dialogo', 'opcion', 'capa', 'mundo', 'tarjeta']), b = azar() < 0.7 ? 0 : 2;
      ultimo = `clic ${b} en ${d}`; await C(`(() => { C.clic(${JSON.stringify(d)}, ${b}); window.__cuadros(2, 50); return 1 })()`);
    } else if (r < 0.79) {
      const ancho = 640 + Math.floor(azar() * 960), alto = 400 + Math.floor(azar() * 500);
      ultimo = `ventana ${ancho}x${alto}`; w.setContentSize(ancho, alto); await esperar(120); await C('window.__cuadros(4, 50)');
    } else if (r < 0.84) {
      ultimo = 'minimizar y restaurar'; w.minimize(); await esperar(250); await C('window.__cuadros(6, 50)'); w.restore(); await esperar(300); await C('window.__cuadros(6, 50)');
    } else if (r < 0.88) {
      ultimo = 'perder y recuperar el foco (eventos)'; await C(`(() => { window.dispatchEvent(new Event('blur')); document.dispatchEvent(new Event('visibilitychange')); window.__cuadros(6, 50); window.dispatchEvent(new Event('focus')); window.__cuadros(4, 50); return 1 })()`);
    } else if (r < 0.95) {
      const a = uno(AJUSTES_VIVOS);
      ultimo = `ajuste ${a}`; await C(`(() => { C.ajuste(${JSON.stringify(a)}); window.__cuadros(3, 50); return 1 })()`);
    } else if (r < 0.97) {
      ultimo = 'campo de visión'; await C('(() => { C.fov(); window.__cuadros(3, 50); return 1 })()');
    } else {
      ultimo = 'guardar'; await C('(() => { H.guardar(); window.__cuadros(2, 50); return 1 })()');
    }
  };

  try {
    console.log(`caos de la Historia · semilla ${SEMILLA} · ${PASOS} acciones por escena · fases ${FASES.join(',')}`);
    await entrar(true);
    const hay = await C('dir0 = H.__escenas.director.ids()');
    const escenas = ESCENAS.filter((id) => hay.includes(id));
    console.log(`escenas del caos: ${escenas.join(', ')}${escenas.length < ESCENAS.length ? ' (faltan: ' + ESCENAS.filter((x) => !hay.includes(x)).join(', ') + ')' : ''}`);

    // ================================================================ a. el frenesí dentro de cada escena
    if (FASES.includes('a')) {
      for (const id of escenas) {
        donde = 'frenesí en ' + id;
        const ok = await C(`C.escena(${JSON.stringify(id)})`);
        if (!ok) { console.log(`  (no disparó ${id})`); continue; }
        let i = 0;
        for (; i < PASOS; i++) {
          try { await accion(); } catch (e) { anotar('excepción en la prueba: ' + e.message); break; }
          const mal = await revisar();
          if (mal.length) break;
          const e = await C('C.estado()');
          if (!e.escena && i > 5 && azar() < 0.25) break;   // la escena ya terminó (la saltó el caos)
        }
        w.setContentSize(1280, 720); await esperar(100);
        const fin = await C('C.terminarEscena()');
        // (sin el clic que vuelve a bloquear el ratón, el juego puede quedar en la pausa: se la cierra como lo hace el botón «Volver»)
        const modoAntes = await C('H.__caidas.modo()');
        await C('(() => { for (let i = 0; i < 3 && H.__caidas.modo() !== "jugando"; i++) { try { H.volverAlJuego(); } catch (e) { /* ya */ } window.__cuadros(3, 50); } return 1 })()');
        if (modoAntes !== 'jugando') console.log(`  (tras el caos en ${id} el modo estaba en «${modoAntes}»; se volvió con «Volver al juego»)`);
        await revisar();
        const vista = await C(`Object.hasOwn(P.historia.escenas.vistas, ${JSON.stringify(id)})`);
        const camina = await C('C.camina()');
        const sigue = await C('C.estado()');
        console.log(`${fin.cerro && vista && camina && !sigue.velos.length ? '✓' : '✗'} ${id}: ${i} acciones · ${fin.cerro ? 'cerró sola en ' + fin.seg + ' s' : 'NO CERRABA (se la saltó)'} · vista ${vista} · se puede caminar ${camina} · abierto tras el caos: ${fin.abiertos0.join(',') || 'nada'} (${fin.cierranConEsc ? 'se cierra con Esc' : 'NO SE CIERRA CON ESC'}) · velos ${sigue.velos.join(',') || 'ninguno'} · modo ${sigue.modo}`);
        if (!fin.cerro) anotar(`${id}: no cerraba después del caos (hubo que saltarla)`);
        if (!vista) anotar(`${id}: terminó y no quedó como vista`);
        if (!camina) anotar(`${id}: después de la escena no se puede caminar ` + JSON.stringify(await C('C.diagCamina()')));
        if (sigue.velos.length) anotar(`${id}: quedó un velo encima: ${sigue.velos.join(',')}`);
        if (sigue.modo !== 'jugando') anotar(`${id}: el modo quedó en ${sigue.modo}`);
      }
    }

    // ================================================================ b. guardar y cargar en bucle, también a mitad de escena
    if (FASES.includes('b')) {
      donde = 'guardar y cargar';
      for (let k = 0; k < 6; k++) {
        const conEscena = k % 2 === 1;
        ultimo = `ciclo ${k} ${conEscena ? 'con escena' : 'sin escena'}`;
        let id = null;
        if (conEscena) { id = escenas[k % escenas.length]; await C(`(() => { delete P.historia.escenas.vistas[${JSON.stringify(id)}]; H.guardar(); return 1 })()`); await C(`C.escena(${JSON.stringify(id)})`); await C('window.__cuadros(60, 50)'); }
        await C('(() => { C.perfil(); P.horas = 10; return 1 })()');
        const antes = await C('JSON.stringify({ c: P.historia.capitulo, f: P.historia.fase, d: P.historia.decisiones, dia: P.dia, vistas: Object.keys(P.historia.escenas.vistas).filter((x) => x !== ' + JSON.stringify(id) + ').length })');
        await C('H.guardar()');
        await entrar(false);   // recarga el juego (como cerrar y abrir)
        const e = await C('C.estado()');
        const despues = await C('JSON.stringify({ c: P.historia.capitulo, f: P.historia.fase, d: P.historia.decisiones, dia: P.dia, vistas: Object.keys(P.historia.escenas.vistas).length })');
        const a = JSON.parse(antes), d = JSON.parse(despues);
        const igual = a.c === d.c && a.f === d.f && JSON.stringify(a.d) === JSON.stringify(d.d) && a.vistas === d.vistas;
        const sinEscenaColgada = !e.escena;
        const vistaFalsa = id ? await C(`Object.hasOwn(P.historia.escenas.vistas, ${JSON.stringify(id)})`) : false;
        console.log(`${igual && sinEscenaColgada && !vistaFalsa ? '✓' : '✗'} ciclo ${k} (${conEscena ? 'a mitad de ' + id : 'sin escena'}): capítulo ${a.c + 1}→${d.c + 1} fase ${a.f}→${d.f} vistas ${a.vistas}→${d.vistas}${vistaFalsa ? ' · LA ESCENA QUEDÓ VISTA SIN TERMINAR' : ''}${e.escena ? ' · escena activa tras cargar: ' + e.escena : ''}`);
        if (!igual) anotar(`guardar/cargar ${conEscena ? 'a mitad de ' + id : ''} cambió la historia: ${antes} → ${despues}`);
        if (vistaFalsa) anotar(`guardar a mitad de ${id}: al cargar, la escena figura como vista sin haber terminado`);
        if (e.escena) anotar('después de cargar hay una escena activa: ' + e.escena);
        await revisar();
      }
    }

    // ================================================================ c. abrir y cerrar cada menú
    if (FASES.includes('c')) {
      donde = 'menús';
      await C('(() => { C.perfil(); const h = P.historia; h.fase = "jugando"; for (let i = 0; i < 6 && H.__escenas.activa(); i++) { H.__escenas.director.saltar(); window.__cuadros(10, 50); } return 1 })()');
      const TECLAS_MENU = ['Escape', 'F1', 'KeyM', 'KeyI', 'KeyJ', 'KeyP', 'KeyG', 'KeyB', 'KeyO', 'KeyN', 'KeyK', 'KeyL', 'KeyU', 'F2', 'Tab', 'KeyV', 'KeyT', 'KeyY', 'KeyQ', 'KeyX'];
      for (const t of TECLAS_MENU) {
        ultimo = `menú con ${t}`;
        await C(`C.tecla(${JSON.stringify(t)}, 3)`);
        const abiertos = await C('C.velos().concat(H.__caidas.modo() !== "jugando" ? ["modo:" + H.__caidas.modo()] : [])');
        for (let i = 0; i < 4; i++) await C(`C.tecla('Escape', 3)`);
        await C('H.__foto().activo && H.abrirModoFoto && H.abrirModoFoto(false)').catch(() => 0);
        await C('(() => { for (let i = 0; i < 3 && H.__caidas.modo() !== "jugando"; i++) { try { H.volverAlJuego(); } catch (e) {} window.__cuadros(3, 50); } return 1 })()');
        const e = await C('C.estado()');
        console.log(`${e.modo === 'jugando' && !e.velos.length ? '✓' : '✗'} ${t}: abrió «${abiertos.join(',') || 'nada'}» · después de cerrar: modo ${e.modo}, velos ${e.velos.join(',') || 'ninguno'}`);
        if (e.modo !== 'jugando' || e.velos.length) anotar(`menú ${t}: no se pudo cerrar (modo ${e.modo}, velos ${e.velos.join(',')})`);
        await revisar();
      }
      for (const b of ['btn-mapa', 'btn-cuaderno', 'btn-guia', 'btn-logros', 'btn-controles', 'btn-teclas', 'btn-personalizar', 'btn-album', 'btn-billetera', 'btn-base', 'btn-partidas', 'btn-modos', 'btn-foto', 'btn-guardar']) {
        ultimo = `botón ${b}`;
        await C(`C.tecla('Escape', 3)`);
        const pausa = await C('!document.getElementById("pausa").classList.contains("oculto")');
        await C(`(() => { const e = document.getElementById(${JSON.stringify(b)}); if (e) e.click(); window.__cuadros(4, 50); return !!e })()`);
        const abiertos = await C('C.velos().concat(H.__caidas.modo() !== "jugando" ? ["modo:" + H.__caidas.modo()] : [])');
        for (let i = 0; i < 4; i++) await C(`C.tecla('Escape', 3)`);
        await C('(() => { for (let i = 0; i < 3 && H.__caidas.modo() !== "jugando"; i++) { try { H.volverAlJuego(); } catch (e) {} window.__cuadros(3, 50); } return 1 })()');
        const e = await C('C.estado()');
        console.log(`${e.modo === 'jugando' && !e.velos.length ? '✓' : '✗'} ${b}: pausa ${pausa} · abrió «${abiertos.join(',') || 'nada'}» · después: modo ${e.modo}, velos ${e.velos.join(',') || 'ninguno'}`);
        if (e.modo !== 'jugando' || e.velos.length) anotar(`botón ${b}: no se pudo cerrar (modo ${e.modo}, velos ${e.velos.join(',')})`);
        await revisar();
      }
    }

    // ================================================================ d. pausar en cada tipo de escena
    if (FASES.includes('d')) {
      donde = 'pausa en escena';
      const tipos = { dialogo: 0, eleccion: 0, plano: 0, fundido: 0 };
      for (const id of escenas) {
        if (Object.values(tipos).every((n) => n >= 2)) break;
        let ok = false;
        for (let k = 0; k < 8 && !ok; k++) { ok = await C(`C.escena(${JSON.stringify(id)})`); if (!ok) await C(`(() => { try { H.volverAlJuego(); } catch (e) {} window.__cuadros(20, 50); return 1 })()`); }
        if (!ok) { console.log(`  (no disparó ${id} para la pausa: ${JSON.stringify(await C('({ d: C.diagCamina(), foto: H.__foto().activo })'))})`); continue; }
        for (let f = 0; f < 2500 && (await C('H.__escenas.activa()')); f++) {
          const d = await C('(() => { window.__cuadros(1, 50); const dat = H.__escenas.director.datos(); return dat ? { dialogo: !!dat.dialogo, eleccion: !!dat.eleccion, fundido: dat.fundido, completo: dat.dialogo ? dat.dialogo.completo : null, fase: dat.fase } : null })()');
          if (!d) break;
          const tipo = d.eleccion ? 'eleccion' : d.dialogo ? 'dialogo' : d.fundido > 0.3 ? 'fundido' : 'plano';
          if (d.fase === 'corriendo' && tipos[tipo] < 2 && f > 10 && (f % 37 === 0 || tipo === 'fundido')) {
            tipos[tipo]++;
            ultimo = `F1 en ${id} (${tipo})`;
            const t0 = await C('C.estado()');
            await C(`C.tecla('F1', 2)`);
            const enPausa = await C('H.__caidas.modo()');
            const t1 = await C('C.estado()');
            await C('window.__cuadros(120, 50)');   // seis segundos con la pausa abierta
            const t2 = await C('C.estado()');
            const tapada = await C('document.body.classList.contains("escena-tapada")');
            await C(`C.cerrarPausa()`);
            const t3 = await C('C.estado()');
            await C('window.__cuadros(30, 50)');
            const t4 = await C('C.estado()');
            const congelo = t1.t === t2.t && t1.idx === t2.idx;
            const sigue = t4.escena !== id || t4.t > t3.t - 0.01;
            console.log(`${enPausa === 'pausa' && congelo && sigue && t3.modo === 'jugando' ? '✓' : '✗'} F1 en ${id} (${tipo}): modo ${enPausa}, la escena ${congelo ? 'se congela' : 'SIGUE CORRIENDO (t ' + t1.t + '→' + t2.t + ', paso ' + t1.idx + '→' + t2.idx + ')'}, escondida ${tapada}, al volver ${t3.modo} y ${sigue ? 'sigue' : 'NO SIGUE'}`);
            if (enPausa !== 'pausa') anotar(`F1 en ${id} (${tipo}): el modo quedó en ${enPausa}`);
            if (!congelo) anotar(`F1 en ${id} (${tipo}): la escena sigue corriendo con la pausa abierta (t ${t1.t}→${t2.t}, paso ${t1.idx}→${t2.idx})`);
            if (t3.modo !== 'jugando') anotar(`F1 en ${id} (${tipo}): al cerrar la pausa el modo quedó en ${t3.modo}`);
            if (!sigue) anotar(`F1 en ${id} (${tipo}): la escena no sigue después de la pausa`);
            await revisar();
          }
          const dd = await C('(() => { const d = H.__escenas.director, dat = d.datos(); if (!dat) return 0; if (dat.eleccion) { if (d.eleccionLista()) d.elegir(0); } else if (dat.dialogo) d.avanzar(); return 1 })()');
          if (!dd) break;
        }
        await C('C.terminarEscena()');
      }
      console.log(`pausas en escena: ${JSON.stringify(tipos)}`);
      // la noche de la nevada
      donde = 'pausa en la noche';
      await C(`(() => { C.perfil(); const h = P.historia; h.capitulo = 11; h.fase = 'jugando'; h.duendes.noche = 'pendiente'; h.duendes.armas.arco = true; h.duendes.armas.honda = true; for (const k of ['herrero','apicultor','maquinista','guarda']) h.prestado[k] = true; P.cosas.hacha = 1; P.horas = 22.1; const g = H.__puntosHistoria()['galpon-noche']; H.jugador.ubicar(g.x + 1, g.z + 1, 0); return 1 })()`);
      await C('(async () => { for (let i = 0; i < 400 && !(H.__noche() && H.__noche().activa()); i++) { window.__cuadros(1, 50); if (H.__escenas.activa()) { const d = H.__escenas.director, dat = d.datos(); if (dat && dat.eleccion) { if (d.eleccionLista()) d.elegir(0); } else if (dat && dat.dialogo) d.avanzar(); } } return 1 })()');
      const activa = await C('!!(H.__noche() && H.__noche().activa())');
      if (!activa) { await C(`H.__escenas.disparar('noche-espera', { forzar: true })`); await C('C.terminarEscena()'); await C('window.__cuadros(100, 50)'); }
      if (!(await C('!!(H.__noche() && H.__noche().activa())'))) console.log('  (diag noche: ' + JSON.stringify(await C('({ d: C.diagCamina(), noche: P.historia.duendes.noche, cap: P.historia.capitulo, fase: P.historia.fase, horas: P.horas, escena: H.__escenas.activa(), vistas: Object.keys(P.historia.escenas.vistas).length })')) + ')');
      if (await C('!!(H.__noche() && H.__noche().activa())')) {
        await C('window.__cuadros(100, 50)');
        const a = await C('H.__noche().sim.t');
        await C(`C.tecla('F1', 2)`);
        await C('window.__cuadros(160, 50)');
        const b = await C('H.__noche().sim.t'), modo = await C('H.__caidas.modo()');
        await C(`C.cerrarPausa()`);
        await C('window.__cuadros(40, 50)');
        const c = await C('H.__noche().sim.t');
        console.log(`${modo === 'pausa' && b === a && c > b ? '✓' : '✗'} F1 en la noche: modo ${modo} · sim.t ${a.toFixed(2)} → ${b.toFixed(2)} con la pausa → ${c.toFixed(2)} al volver`);
        if (b !== a) anotar(`F1 en la noche: la simulación sigue con la pausa abierta (${a.toFixed(2)} → ${b.toFixed(2)})`);
        if (!(c > b)) anotar(`F1 en la noche: no sigue al volver (${b.toFixed(2)} → ${c.toFixed(2)})`);
        await revisar();
      } else console.log('  (la noche no arrancó: no se probó la pausa en la noche)');
    }
  } catch (e) { console.log('ERROR:', e && e.stack || e); anotar('excepción: ' + (e && e.message)); }
  console.log(`\nerrores de consola: ${consola.length}`);
  console.log(problemas.length ? `${problemas.length} PROBLEMAS` : 'Todo en orden');
  try { app.exit(problemas.length ? 1 : 0); } catch { process.exit(1); }
});
