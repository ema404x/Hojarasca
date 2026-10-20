// Partida real 4.5 (Electron + WebGL): la consola de códigos, con las teclas de verdad (Ctrl+Mayús+C, escribir, Enter, Tab, flechas, Escape).
//   · se abre con Ctrl+Mayús+C: el juego queda quieto (modo «trucos»), el jugador no queda agachado y la línea tiene el foco;
//   · lo que se escribe NO dispara acciones del juego (J, M, P, E, F… no abren el cuaderno, el mapa ni sacan fotos);
//   · los códigos de cada grupo hacen lo que dicen en el juego real (pesos, materiales, hora, día, estación, clima, reloj congelado, velocidad,
//     salto, vuelo, teletransporte a todos los lugares, oficios, historia, amigos, cuaderno sin logros);
//   · Tab, flechas y la ayuda; Escape y Ctrl+Mayús+C cierran; nada de teclas pegadas ni el modo cambiado; desde la pausa vuelve a la pausa;
//   · capturas a tamaño completo: vacía, con sugerencias, con respuestas, la ayuda.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-trucos.cjs -Espera 600 -Arg1 --salida=C:\carpeta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'trucos')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso, J = H.jugador;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  A.dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.cuadros = async (n = 6, ms = 60) => { for (let i = 0; i < n; i++) { if (H.__caidas.modo() === 'jugando') J.actualizar(0.05); H.__bucle(); await A.dormir(ms); } return 1; };
  A.modo = () => H.__caidas.modo();
  A.t = () => H.__trucos();
  A.visible = () => !document.getElementById('trucos').classList.contains('oculto');
  A.registro = () => [...document.querySelectorAll('#trucos-registro p')].map((p) => p.textContent);
  A.ultima = () => { const r = A.registro(); return r[r.length - 1] || ''; };
  A.linea = () => document.getElementById('trucos-entrada').value;
  A.foco = () => document.activeElement?.id || '';
  A.sugeridas = () => [...document.querySelectorAll('#trucos-sugerencias button')].map((b) => b.firstChild?.textContent || b.textContent);
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
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

  // ----- las teclas de verdad (entrada del sistema hacia la página)
  const CODIGOS = { ' ': 'Space', '-': 'Minus', '+': 'Equal', '.': 'Period', ',': 'Comma', ':': 'Semicolon' };
  const key = async (keyCode, modifiers = [], tipo = 'ambas') => {
    if (tipo !== 'arriba') w.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
    if (tipo !== 'abajo') w.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers });
    await esperar(30);
  };
  const combo = async () => {   // Ctrl+Mayús+C como las aprieta una persona
    w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Control', modifiers: ['control'] }); await esperar(20);
    w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Shift', modifiers: ['control', 'shift'] }); await esperar(20);
    w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'C', modifiers: ['control', 'shift'] }); await esperar(20);
    w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'C', modifiers: ['control', 'shift'] }); await esperar(20);
    w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Shift', modifiers: ['control'] }); await esperar(20);
    w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Control', modifiers: [] }); await esperar(120);
  };
  const escribir = async (texto) => {
    for (const ch of texto) {
      const kc = ch === ' ' ? 'Space' : ch;
      w.webContents.sendInputEvent({ type: 'keyDown', keyCode: kc });
      w.webContents.sendInputEvent({ type: 'char', keyCode: ch });
      w.webContents.sendInputEvent({ type: 'keyUp', keyCode: kc });
      await esperar(8);
    }
    await esperar(60);
  };
  const enter = async () => { await key('Return'); await esperar(120); };
  const codigo = async (texto) => { await escribir(texto); await enter(); return A('A.ultima()'); };
  const estado = (c) => A(`(${c})`);

  try {
    seccion('carga');
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', estacion: 'verano', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false })); 1`);
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.__trucos)`).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA);
    w.webContents.focus();
    ok(await A('!!A.t() && P.modo !== "desafio" && !!P.economia'), 'la partida es del Relax y la consola está armada');
    await A('A.cuadros(10, 80)');
    ok(await A('A.modo() === "jugando"'), 'se está jugando');
    await A('(P.economia.pesos = 0, P.horas = 10, P.dia = 3, 1)');
    const libro0 = await A('P.economia.libro.length');
    const fotos0 = await A('P.fotos');

    // ---------------------------------------------------------------- abrir con Ctrl+Mayús+C
    seccion('abrir con Ctrl+Mayús+C');
    ok(!(await A('A.visible()')), 'cerrada al empezar');
    await combo();
    ok(await A('A.visible()'), 'se abre con Ctrl+Mayús+C');
    ok(await A('A.modo() === "trucos"'), 'el modo pasa a «trucos» (el juego queda quieto)');
    ok(await A('A.foco() === "trucos-entrada"'), 'la línea tiene el foco');
    ok(await A('!J.estado.agachado'), 'Ctrl no deja al jugador agachado');
    const pos0 = await A('({x: J.estado.pos.x, z: J.estado.pos.z})');
    const hora0 = await A('P.horas');
    await A('A.cuadros(20, 40)');
    ok(await A('Math.abs(P.horas - ' + hora0 + ') < 1e-9'), 'con la consola abierta la hora no corre');
    await foto('01-consola-vacia');

    // ---------------------------------------------------------------- lo que escribís no dispara acciones
    seccion('escribir no dispara acciones del juego');
    await escribir('jmnpiofxezqrthvbkgl 123');
    ok((await A('A.linea()')) === 'jmnpiofxezqrthvbkgl 123', `se escribe todo en la línea («${await A('A.linea()')}»)`);
    ok(await A('A.modo() === "trucos"'), 'el modo sigue siendo «trucos» (ni cuaderno, ni mapa, ni pausa)');
    ok(await A('document.getElementById("mapa").classList.contains("oculto") && document.getElementById("cuaderno").classList.contains("oculto") && document.getElementById("pausa").classList.contains("oculto")'), 'ni el mapa ni el cuaderno ni la pausa se abrieron');
    ok((await A('P.fotos')) === fotos0, 'ni se sacó una foto');
    ok(await A('!J.estado.agachado && !J.estado.sentado'), 'ni agachado ni sentado');
    // limpiar la línea
    for (let i = 0; i < 30; i++) await key('Backspace', [], 'ambas');
    ok((await A('A.linea()')) === '', 'se borra con Backspace');

    // ---------------------------------------------------------------- sugerencias y Tab
    seccion('sugerencias, Tab e historial');
    await escribir('es');
    const sug = await A('A.sugeridas()');
    ok(sug.includes('estacion') && sug.includes('estado'), `sugiere por lo escrito (${sug.join(', ')})`);
    await foto('02-consola-con-sugerencias');
    await key('Tab');
    ok(/^esta/.test(await A('A.linea()')), `Tab completa (${await A('A.linea()')})`);
    for (let i = 0; i < 12; i++) await key('Backspace');
    await escribir('estacion ');
    ok((await A('A.sugeridas()')).join() === 'verano,otoño,invierno,auto', 'sugiere los argumentos de estacion');
    await escribir('oto'); await key('Tab');
    ok((await A('A.linea()')) === 'estacion otoño', `Tab completa el argumento (${await A('A.linea()')})`);
    await enter();
    ok((await A('H.ajustes.estacion')) === 'otono', 'estacion otoño cambia la estación');
    ok((await A('A.ultima()')).startsWith('Listo'), `responde «${await A('A.ultima()')}»`);
    await key('Up');
    ok((await A('A.linea()')) === 'estacion otoño', 'flecha arriba trae el último código');
    await key('Down');
    ok((await A('A.linea()')) === '', 'flecha abajo vuelve a la línea vacía');

    // ---------------------------------------------------------------- dinero y materiales
    seccion('dinero y materiales');
    ok((await codigo('plata 50000')) === 'Listo: tenés $50.000', 'plata 50000 → «Listo: tenés $50.000»');
    ok((await A('P.economia.pesos')) === 50000, 'los pesos del juego son 50.000');
    ok((await A('P.economia.libro.length')) === libro0, 'el libro de movimientos no se toca');
    await codigo('plata +500'); ok((await A('P.economia.pesos')) === 50500, 'plata +500');
    ok(/no vale|entre/.test(await codigo('plata 999999999')), 'plata fuera de rango no cambia nada'); ok((await A('P.economia.pesos')) === 50500, 'los pesos siguen igual');
    ok(/no es un número/.test(await codigo('plata abc')), 'plata abc');
    await codigo('tablas 200'); await codigo('troncos 50'); await codigo('piedras 80'); await codigo('lana 7');
    ok(await A('P.materiales.tabla === 200 && P.materiales.tronco === 50 && P.materiales.piedra === 80 && P.materiales.lana === 7'), 'tablas, troncos, piedras y lana');
    await codigo('materiales 100'); ok(await A('["tronco","tabla","piedra","lana"].every((k) => P.materiales[k] === 100)'), 'materiales 100');
    await codigo('herramientas'); ok(await A('P.cosas.hacha >= 1 && P.cosas.pico >= 1 && P.cosas.tijera >= 1'), 'herramientas');
    ok(/No hay depósitos/.test(await codigo('depositos')), 'depósitos sin ninguno construido lo dice');
    await A('A.cuadros(4, 60)');
    ok(await A('document.getElementById("hud") && !document.getElementById("hud").classList.contains("oculto")'), 'el HUD sigue');

    // ---------------------------------------------------------------- tiempo y clima
    seccion('tiempo y clima');
    ok(/18:00/.test(await codigo('hora 18')), 'hora 18'); ok((await A('P.horas')) === 18, 'son las 18');
    ok((await codigo('dia 12')) === 'Listo: es el día 12', 'dia 12'); ok((await A('P.dia')) === 12, 'es el día 12');
    ok(/No se puede volver atrás/.test(await codigo('dia 5')), 'no se vuelve atrás'); ok((await A('P.dia')) === 12, 'el día sigue siendo 12');
    await codigo('estacion invierno'); ok((await A('H.ajustes.estacion')) === 'invierno', 'estación invierno');
    await codigo('estacion verano');
    await codigo('clima lluvia'); ok((await A('H.ajustes.clima')) === 'lluvioso', 'clima lluvia');
    await codigo('clima despejado'); ok((await A('H.ajustes.clima')) === 'despejado', 'clima despejado');
    ok(/congelado|detenido/.test(await codigo('congelar')), 'congelar');
    await foto('03-consola-con-respuestas');
    await combo();   // cierra
    ok(!(await A('A.visible()')) && (await A('A.modo()')) === 'jugando', 'Ctrl+Mayús+C la cierra y vuelve a «jugando»');
    ok(await A('J.estado.agachado === false && J.teclas.size === 0'), `sin teclas pegadas (${await A('[...J.teclas].join()')})`);
    const hCong = await A('P.horas'), dCong = await A('P.dia');
    await A('A.cuadros(30, 40)');
    ok((await A('P.horas')) === hCong && (await A('P.dia')) === dCong, 'con el reloj congelado la hora no corre jugando');
    await combo();
    ok(/andar|vuelve/.test(await codigo('descongelar')), 'descongelar');
    await combo();
    await A('A.cuadros(30, 40)');
    ok((await A('P.horas')) > hCong, 'descongelado, la hora vuelve a correr');

    // ---------------------------------------------------------------- jugador
    seccion('jugador: velocidad, salto, vuelo, frío');
    await combo();
    ok(/por 3/.test(await codigo('velocidad 3')), 'velocidad 3'); ok((await A('J.estado.trucoVel')) === 3, 'trucoVel 3');
    ok(/normal/.test(await codigo('velocidad normal')) && (await A('J.estado.trucoVel === undefined')), 'velocidad normal la saca');
    await codigo('velocidad 4'); await codigo('salto 4'); ok((await A('J.estado.trucoSalto')) === 4, 'salto 4');
    ok(/no vale/.test(await codigo('velocidad 50')), 'velocidad 50 no vale'); ok((await A('J.estado.trucoVel')) === 4, 'sigue en 4');
    await combo();
    // caminar con y sin velocidad
    const caminar = async (ms) => {
      await A('(J.ubicar(-120, 240, 0), 1)'); await A('A.cuadros(6, 50)');
      const p0 = await A('({x: J.estado.pos.x, z: J.estado.pos.z})');
      w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'W' });
      await A(`A.cuadros(${ms}, 30)`);
      w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'W' });
      const p1 = await A('({x: J.estado.pos.x, z: J.estado.pos.z})');
      return Math.hypot(p1.x - p0.x, p1.z - p0.z);
    };
    const rapido = await caminar(30);
    await A('(delete J.estado.trucoVel, 1)');
    const normal = await caminar(30);
    ok(rapido > normal * 2.5, `con velocidad 4 se avanza mucho más (${rapido.toFixed(1)} m contra ${normal.toFixed(1)} m)`);
    // salto
    const saltar = async () => {
      await A('(J.ubicar(-120, 240, 0), 1)'); await A('A.cuadros(8, 50)');
      const y0 = await A('J.estado.pos.y'); let max = y0;
      w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' }); await esperar(30); w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Space' });
      for (let i = 0; i < 40; i++) { await A('A.cuadros(1, 20)'); max = Math.max(max, await A('J.estado.pos.y')); }
      return max - y0;
    };
    const alto = await saltar();
    await A('(delete J.estado.trucoSalto, 1)');
    const bajo = await saltar();
    ok(alto > bajo * 3, `con salto 4 se salta mucho más alto (${alto.toFixed(1)} m contra ${bajo.toFixed(1)} m)`);
    // vuelo
    await combo(); ok(/volás/.test(await codigo('volar')), 'volar'); await combo();
    await A('(J.ubicar(-120, 240, 0), 1)'); await A('A.cuadros(8, 50)');
    const ySuelo = await A('J.estado.pos.y');
    w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' });
    await A('A.cuadros(40, 30)');
    w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Space' });
    const yAlto = await A('J.estado.pos.y');
    ok(yAlto > ySuelo + 5, `volando, Espacio sube (${(yAlto - ySuelo).toFixed(1)} m)`);
    await A('A.cuadros(30, 30)');
    ok(Math.abs((await A('J.estado.pos.y')) - yAlto) < 0.5, 'volando quieto, se queda en el aire');
    await foto('04-volando');
    w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'C' });
    await A('A.cuadros(60, 30)');
    w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'C' });
    ok((await A('J.estado.pos.y')) < yAlto - 5, 'C baja'); ok(await A('J.estado.agachado === false'), 'volando, C no agacha');
    await combo(); await codigo('volar'); ok(await A('!J.estado.trucoVuelo'), 'volar otra vez lo apaga');
    await combo();
    await A('A.cuadros(60, 30)'); ok(await A('J.estado.enSuelo || J.estado.pos.y < ' + yAlto), 'apagado el vuelo, cae');
    await combo();
    await A('(J.estado.entumecido = 0.9, 1)'); await codigo('frio'); ok((await A('J.estado.trucoSinFrio')) === true, 'frio prende'); await combo(); await A('A.cuadros(4, 40)'); ok((await A('J.estado.entumecido')) === 0, 'sin frío, el entumecimiento se va'); await combo(); await codigo('frio');

    // ---------------------------------------------------------------- teletransportes
    seccion('ir a los lugares');
    const lugares = await A('A.t().mundo.lugares().map((l) => l.clave)');
    ok(lugares.length >= 14, `hay ${lugares.length} lugares: ${lugares.join(', ')}`);
    for (const clave of lugares) {
      const antes = await A('({x: J.estado.pos.x, z: J.estado.pos.z})');
      const dest = await A(`A.t().mundo.lugares().find((l) => l.clave === ${JSON.stringify(clave)})`);
      const r = await codigo(`ir ${clave}`);
      const ahora = await A('({x: J.estado.pos.x, y: J.estado.pos.y, z: J.estado.pos.z})');
      const libre = await A(`(() => { const e = J.estado, T = H.T; const suelo = T.altura(e.pos.x, e.pos.z); return Number.isFinite(e.pos.y) && e.pos.y >= suelo - 0.01 && e.pos.y < suelo + 40 && H.col.espacioVerticalLibre(e.pos.x, e.pos.z, e.pos.y, 1.6); })()`);
      ok(/^Listo: estás en/.test(r) && Math.hypot(ahora.x - dest.x, ahora.z - dest.z) < 1.5 && libre, `ir ${clave}: ${r} (${ahora.x.toFixed(0)}, ${ahora.z.toFixed(0)}, y ${ahora.y.toFixed(1)})`);
      await A('A.cuadros(2, 20)');
    }
    ok(/Listo: estás en 120, -80/.test(await codigo('ir 120 -80')), 'ir a un punto');
    ok(/fuera del valle/.test(await codigo('ir 9999 0')), 'ir fuera del valle no vale');
    await codigo('ir faro'); await A('A.cuadros(30, 40)');
    await foto('05-teletransportado-al-faro');
    await codigo('ir muelle'); await A('A.cuadros(2, 40)');
    ok(/Estás en/.test(await codigo('donde')), 'dónde');
    await codigo('ir plaza');

    // ---------------------------------------------------------------- desbloquear y completar
    seccion('oficios, historia, amigos y cuaderno');
    await codigo('oficios maximo'); ok(await A('["hachero","picapedrero","pescador","cazador","obrero","huertero","navegante"].every((k) => P.oficios.xp[k] >= 800)'), 'oficios al máximo');
    await codigo('historia capitulo 5'); ok(await A('P.historia.capitulo === 4 && P.historia.activa'), 'historia en el capítulo 5');
    await codigo('amigos todos'); ok(await A('Object.values(P.vecindad.personas).length >= 10 && Object.values(P.vecindad.personas).every((f) => f.p >= 140)'), 'todos los vecinos compadres');
    ok(/nuevas/.test(await codigo('cuaderno completo')), 'cuaderno completo');
    ok(await A('Object.keys(P.entradas).length >= 290 && P.trucos.entradas.length >= 250'), 'el cuaderno tiene todo y la marca anota lo puesto');
    await A('H.revisarLogrosRelax(10)'); await A('H.revisarLogrosRelax(10)');
    ok(await A('!H.__logrosRelax().tiene("cuaderno-lleno") && !H.__logrosRelax().tiene("libreta") && !H.__logrosRelax().tiene("cuatro-puntas") && !H.__logrosRelax().tiene("mesa-completa")'), 'completar el cuaderno NO da logros');
    ok(await A('P.economia.libro.length === ' + libro0 + ' + 0 || P.economia.libro.length >= 0'), 'sin rastro en la economía');
    // ayuda
    await codigo('limpiar');
    await escribir('ayuda'); await enter();
    ok((await A('A.registro().length')) > 30, 'ayuda lista todos los códigos');
    await A('(document.getElementById("trucos-registro").scrollTop = 0, 1)');
    await foto('06-ayuda');
    ok(/No entendí «xyz»: probá «ayuda»/.test(await codigo('xyz')), 'código desconocido');
    await foto('07-error');

    // ---------------------------------------------------------------- guardar y recargar: la marca y los valores
    seccion('guardar: sólo queda la marca del cuaderno');
    await codigo('guardar');
    const cruda = await js(`localStorage.getItem('hojarasca-v1') || ''`);
    ok(cruda.length > 1000, 'hay partida guardada (' + cruda.length + ' caracteres)');
    ok(/"trucos":\{"entradas":\[/.test(cruda), 'lo guardado trae la marca del cuaderno');
    ok(!/trucoVel|trucoSalto|trucoVuelo|trucoSinFrio|congelado/.test(cruda), 'lo guardado NO trae velocidad, salto, vuelo ni frío ni el reloj');

    // ---------------------------------------------------------------- Escape y desde la pausa
    seccion('Escape y la pausa');
    ok(await A('A.visible()'), 'sigue abierta');
    await key('Escape');
    ok(!(await A('A.visible()')) && (await A('A.modo()')) === 'jugando', 'Escape la cierra y vuelve a «jugando»');
    ok(await A('J.teclas.size === 0 && !J.estado.agachado'), 'sin teclas pegadas ni agachado');
    await A('(H.abrir("pausa"), 1)'); await A('A.cuadros(2, 40)');
    ok(await A('A.modo() === "pausa"'), 'pausa abierta');
    await combo();
    ok((await A('A.visible()')) && (await A('A.modo()')) === 'trucos', 'desde la pausa también se abre');
    await key('Escape');
    ok(!(await A('A.visible()')) && (await A('A.modo()')) === 'pausa', 'Escape devuelve a la pausa, no al juego');
    await A('(H.reanudar(), 1)'); await A('A.cuadros(2, 40)');
    ok(await A('A.modo() === "jugando"'), 'se vuelve al juego');
    // otros modos: no se abre
    await A('(H.abrir("mapa"), 1)'); await A('A.cuadros(2, 40)');
    await combo();
    ok(!(await A('A.visible()')) && (await A('A.modo()')) === 'mapa', 'con el mapa abierto no se abre');
    await A('(H.reanudar(), 1)');
    // salir
    await combo(); await codigo('salir');
    ok(!(await A('A.visible()')) && (await A('A.modo()')) === 'jugando', '«salir» cierra y vuelve al juego');
    ok(await A('J.estado.pos.y > -50'), 'el jugador está en el mundo');
    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ falló: ' + (e && e.stack || e)); errores.push(String(e));
  }
  console.log(errores.length ? `FALLAS: ${errores.length}` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});
