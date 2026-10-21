// Partida real 4.5.1 (Electron + WebGL): sin las carreras contrarreloj ni el torneo de la semana.
//   · una partida nueva del Relax: no hay grupo de carreras en la escena, ni HUD de carrera, ni nada para largar;
//   · se recorren los lugares donde estaban los postes de largada (la estepa, la pampa, el mirador, el faro, el lago y la
//     regata): el aviso no ofrece largar, E no larga nada, y una captura a tamaño completo mirando a donde estaba el poste;
//   · el panel «Desafío del día» (desde la pausa) sin carreras ni torneo; el mapa, con su captura;
//   · una partida vieja (con récords de carreras, un desafío del día a medias y el torneo en el localStorage) carga sin errores:
//     los récords se descartan, la racha queda y lo del torneo no se toca;
//   · ningún error de consola en todo el recorrido.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-5-1-sin-carreras.cjs -Espera 900 -Perfil C:\carpeta -Arg1 --salida=C:\carpeta-capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'sin-carreras-451')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// donde estaban los postes de largada en la 4.5.0 (src/carreras.js) y desde dónde se los mira
const LUGARES = [
  { id: 'estepa', nombre: 'la estepa (La vuelta de la estepa)', x: 300, z: -60 },
  { id: 'pampa', nombre: 'la pampa del sur', x: 395, z: 150 },
  { id: 'mirador', nombre: 'el mirador (El cross del mirador)', x: -262, z: 50 },
  { id: 'faro', nombre: 'el faro (La loma del faro)', x: 195, z: -45 },
  { id: 'lago', nombre: 'el lago (La vuelta del lago, desde el muelle)', x: 75, z: 150, muelle: true },
  { id: 'regata', nombre: 'el lago (La regata del faro)', x: 90, z: 120, muelle: true },
];

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, J = H.jugador;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  A.dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.cuadros = async (n = 6, ms = 60) => { for (let i = 0; i < n; i++) { if (H.__caidas.modo() === 'pausa') H.volverAlJuego(true); if (H.__caidas.modo() === 'jugando') J.actualizar(0.05); H.__bucle(); await A.dormir(ms); } return 1; };
  A.modo = () => H.__caidas.modo();
  // lo que quedaba de las carreras en la escena: el grupo de los postes, las puertas y el fantasma
  A.grupoCarreras = () => { let hay = 0; H.escena.traverse((o) => { if (o.name === 'carreras-3-1') hay++; }); return hay; };
  // un lugar en tierra firme, a d metros del punto, mirándolo (el jugador mira hacia (-sen yaw, -cos yaw))
  A.mirarDesde = (x, z, d = 12) => {
    const T = H.T;
    let mejor = null;
    for (let k = 0; k < 16 && !mejor; k++) {
      const a = (k / 16) * Math.PI * 2, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
      if (T.altura(px, pz) > 0.3) mejor = { px, pz };
    }
    if (!mejor) mejor = { px: x + d, pz: z };
    const yaw = Math.atan2(-(x - mejor.px), -(z - mejor.pz));
    J.ubicar(mejor.px, mejor.pz, yaw);
    if (J.estado.pitch !== undefined) J.estado.pitch = -0.05;
    return { x: mejor.px, z: mejor.pz, yaw };
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(`consola: ${m.slice(0, 300)}`); }
  });
  w.webContents.on('render-process-gone', (_e, d) => errores.push(`se cayó la página: ${JSON.stringify(d)}`));
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, P = H.progreso, J = H.jugador; return (${c}) })()`);
  const foto = async (nombre) => {
    await A('A.cuadros(4, 120)'); await esperar(900);
    w.webContents.invalidate(); await esperar(200);
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    let img = null;
    for (let i = 0; i < 4 && !img; i++) { try { img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO }); } catch (e) { await esperar(500); } }
    if (!img) { console.log('  (sin captura de ' + nombre + ')'); return; }
    const s = img.getSize();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG());
    console.log(`  captura ${nombre}.png (${s.width}×${s.height})`);
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, scale: 1 }));
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const key = async (keyCode) => { w.webContents.sendInputEvent({ type: 'keyDown', keyCode }); w.webContents.sendInputEvent({ type: 'keyUp', keyCode }); await esperar(60); };
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.__caidas && ${H}.__modos)`).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA);
    w.webContents.focus();
    await A('A.cuadros(10, 80)');
  };

  try {
    // ---------------------------------------------------------------- 1. una partida nueva
    seccion('1. una partida nueva del Relax');
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', estacion: 'verano', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false })); 1`);
    await abrir();
    await entrar();
    ok(await A('A.modo() === "jugando" && P.modo !== "desafio"'), 'se está jugando en el Relax');
    ok(await A('A.grupoCarreras() === 0'), 'en la escena no hay grupo de carreras (postes, puertas, columna de luz, fantasma)');
    ok(await A('!document.getElementById("carrera-hud")'), 'no hay HUD de carrera');
    const M = await A('(() => { const m = H.__modos(); return { accion: typeof m.accion, corriendo: typeof m.corriendo, marcas: typeof m.marcasMapa, largar: typeof m.__.largar, actualizar: typeof m.actualizar, pez: typeof m.pez }; })()');
    ok(M.accion === 'undefined' && M.corriendo === 'undefined' && M.marcas === 'undefined' && M.largar === 'undefined' && M.actualizar === 'function' && M.pez === 'function', `el desafío del día sin carreras (${JSON.stringify(M)})`);
    ok(await A('!Object.hasOwn(P, "carreras")'), 'la partida nueva no trae carreras');
    const portada = await A('document.getElementById("diario-portada")?.textContent || ""');
    ok(/Desafío del día/.test(portada) && !/torneo|carrera|corré/i.test(portada), `la portada: «${portada}»`);

    // ---------------------------------------------------------------- 2. los lugares de los postes
    seccion('2. donde estaban los postes de largada');
    await A('(P.horas = 12, 1)');
    for (const L of LUGARES) {
      const pos = await A(`A.mirarDesde(${L.x}, ${L.z}, ${L.muelle ? 30 : 12})`);
      await A('A.cuadros(40, 30)');
      const aviso = await A('H.__avisoYa()');
      const texto = aviso?.texto || '';
      ok(!/largar|largada|carrera|circuito|récord/i.test(texto), `${L.nombre}: el aviso no ofrece largar («${texto || 'sin aviso'}»)`);
      const antes = await A('JSON.stringify({ x: Math.round(J.estado.pos.x), z: Math.round(J.estado.pos.z), modo: A.modo() })');
      await key('E'); await A('A.cuadros(8, 40)');
      ok(await A('!document.getElementById("carrera-hud") && A.grupoCarreras() === 0'), `${L.nombre}: E no larga nada (${antes})`);
      await A('(H.abrir && A.modo() !== "jugando" ? H.volverAlJuego(true) : 0, 1)');
      ok(await A('A.grupoCarreras() === 0'), `${L.nombre}: sin poste, banderín ni cartel (${Math.round(pos.x)}, ${Math.round(pos.z)})`);
      await foto(`lugar-${L.id}`);
    }
    // caminando de verdad un tramo por la estepa (W apretada), sin errores
    await A(`A.mirarDesde(300, -60, 40)`);
    w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'W' });
    await A('A.cuadros(80, 30)');
    w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'W' });
    await A('A.cuadros(4, 30)');
    ok(await A('A.modo() === "jugando" && A.grupoCarreras() === 0'), 'se camina por la estepa sin postes ni errores');

    // ---------------------------------------------------------------- 3. el panel y el mapa
    seccion('3. el panel «Desafío del día» y el mapa');
    await A('(H.abrir("pausa"), 1)'); await esperar(300);
    const boton = await A('document.getElementById("btn-modos")?.textContent || ""');
    ok(boton === 'Desafío del día', `el botón de la pausa dice «${boton}»`);
    await A('(document.getElementById("btn-modos").click(), 1)'); await esperar(400);
    const panel = await A('({ visible: !document.getElementById("modos31").classList.contains("oculto"), titulo: document.querySelector("#modos31 h2")?.textContent, texto: document.getElementById("modos31-contenido").textContent })');
    ok(panel.visible && panel.titulo === 'Desafío del día' && /Desafío del día ·/.test(panel.texto), `el panel se abre: «${panel.titulo}»`);
    ok(!/carrera|torneo|circuito|largada|récord/i.test(panel.texto), `el panel no habla de carreras ni torneo («${panel.texto.slice(0, 160)}»)`);
    await foto('panel-desafio-del-dia');
    await A('(document.getElementById("cerrar-modos31").click(), 1)'); await esperar(300);
    ok(await A('document.getElementById("modos31").classList.contains("oculto")'), 'el panel se cierra');
    await A('(H.volverAlJuego(true), 1)'); await A('A.cuadros(6, 40)');
    await key('M'); await esperar(800);
    if (await A('A.modo() === "mapa"')) { await foto('mapa'); await key('M'); await esperar(400); }
    else console.log(`  (el mapa no abrió con M: modo ${await A('A.modo()')})`);
    await A('(A.modo() !== "jugando" ? H.volverAlJuego(true) : 0, 1)');

    // ---------------------------------------------------------------- 4. una partida vieja con carreras y torneo
    seccion('4. una partida vieja con carreras y torneo');
    await A('(H.guardar(), 1)'); await esperar(500);
    const armada = await js(`(() => {
      const claves = Object.keys(localStorage);
      const clave = claves.find((k) => { try { const p = JSON.parse(localStorage.getItem(k)); return p && typeof p === 'object' && p.versionGuardado && p.modo !== 'desafio' && Object.hasOwn(p, 'diarios'); } catch { return false; } });
      if (!clave) return { claves };
      const p = JSON.parse(localStorage.getItem(clave));
      p.carreras = { mejores: { mirador: { ms: 61234, parciales: [10000, 22000], fecha: '2026-10-01', fantasma: { paso: 0.5, pts: [1, 2, 3, 4] } }, 'lago:invertido': { ms: 90000, parciales: [] } }, corridas: 12 };
      p.diarios = { racha: 4, mejorRacha: 7, ultimo: '2026-10-20', total: 777, hoy: { fecha: '2026-10-21', avance: 0, hecho: false, puntos: 0, base: null }, historial: { '2026-10-20': 150 } };
      p.dia = Math.max(p.dia || 1, 9);
      const torneo = JSON.stringify({ pc: 'abcd1234', nombre: 'José', propias: [{ semana: '2026-S43', nombre: 'José', pesca: 41, carreraMs: 61234, noches: 2, abatidos: 9, t: 1 }], amigos: [{ semana: '2026-S43', nombre: 'Ana', pesca: 30, carreraMs: 0, noches: 0, abatidos: 0, t: 1 }], carpeta: [] });
      localStorage.setItem(clave, JSON.stringify(p));
      localStorage.setItem('hojarasca-torneo-v1', torneo);
      // que nadie la pise al recargar (el juego guarda al salir): desde acá, la página no escribe más
      Storage.prototype.setItem = function () {};
      return { clave, torneo };
    })()`);
    ok(!!armada.clave, `la partida guardada está en «${armada.clave}»${armada.claves ? ` (claves: ${armada.claves.join(', ')})` : ''}`);
    const erroresAntes = consola.length;
    await abrir();
    await entrar();
    ok(await A('A.modo() === "jugando"'), 'la partida vieja carga y se juega');
    ok(await A('!Object.hasOwn(P, "carreras")'), 'los récords de las carreras se descartaron');
    const di = await A('({ racha: P.diarios?.racha, mejor: P.diarios?.mejorRacha, total: P.diarios?.total, dia: P.dia })');
    ok(di.racha === 4 && di.mejor === 7 && di.total === 777 && di.dia >= 9, `el desafío del día y la partida quedaron (${JSON.stringify(di)})`);
    ok((await js(`localStorage.getItem('hojarasca-torneo-v1')`)) === armada.torneo, 'lo del torneo en el localStorage no se tocó (se ignora)');
    await A('A.cuadros(30, 40)');
    await A('(H.guardar(), 1)'); await esperar(400);
    const guardada = await js(`(() => { try { return Object.hasOwn(JSON.parse(localStorage.getItem(${JSON.stringify(armada.clave || '')})), 'carreras'); } catch (e) { return 'error ' + e.message; } })()`);
    ok(guardada === false, `guardada de nuevo, ya sin carreras (${guardada})`);
    ok(consola.length === erroresAntes, `cargar la partida vieja no dejó errores de consola (${consola.slice(erroresAntes).join(' | ')})`);
    await A('(A.mirarDesde(-262, 50, 12), P.horas = 12, 1)');
    await foto('partida-vieja-mirador');

    seccion('fin');
    ok(consola.length === 0, `sin errores de consola en todo el recorrido (${consola.length}${consola.length ? ': ' + consola.slice(0, 5).join(' | ') : ''})`);
  } catch (e) {
    errores.push(`excepción en «${donde}»: ${e && e.stack ? e.stack : e}`);
    console.log(`✗ excepción en «${donde}»: ${e && e.stack ? e.stack : e}`);
  }
  console.log(errores.length ? `HUMO 4.5.1 sin carreras: ${errores.length} FALLAS\n  ${errores.join('\n  ')}` : 'HUMO 4.5.1 sin carreras: OK');
  console.log(`capturas en ${salida}`);
  app.exit(errores.length ? 1 : 0);
});
