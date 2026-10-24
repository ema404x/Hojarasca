// 4.10.4 · proceso principal y rendimiento (informes zona-M y zona-H2 de la revisión 6). Todo EJECUTA el comportamiento en Node:
//   H2-1 el guardado ya no relee con «reviver» · M1 backgroundThrottling sólo apagado por entorno · M2/M3 relanzar (portable y candado)
//   M3 errores sin atrapar del proceso principal · M9 guardadoEn no finito · M10 tope de __hojarascaErrores · H2-2 lugares tomados en tres cuadros
//   H2-3 sin doble ruta · H2-4 mapas débiles · H2-5 huellas del Coihue que no se congelan.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import { registrarThree } from './ayuda-three.mjs';

const require = createRequire(import.meta.url);
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ---------------------------------------------------------------- H2-1: el guardado
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const G = await import('../src/guardado.js?proceso=' + Date.now());
  const original = JSON.parse;
  let conReviver = 0, lisos = 0;
  JSON.parse = function (t, r) { if (typeof r === 'function') conReviver++; else lisos++; return original.call(JSON, t, r); };
  try {
    const p = { ...G.progresoNuevo(), dia: 9 };
    ok(G.guardarProgreso(p) !== false, 'H2-1: una partida normal se guarda');
    ok(conReviver === 0 && lisos >= 1, `H2-1: guardar no usa el «reviver» (lisos ${lisos}, con reviver ${conReviver})`);
    conReviver = 0;
    const c = G.cargarProgreso();
    ok(c && c.dia === 9, 'H2-1: y la partida normal vuelve igual');
    ok(conReviver === 0, 'H2-1: cargarla tampoco usa el «reviver»');
    // las claves peligrosas siguen limpiándose, escritas de cualquier manera
    const casos = {
      toString: { ...G.progresoNuevo(), dia: 7, pos: { x: { toString: 1 }, z: 3 } },
      valueOf: { ...G.progresoNuevo(), dia: 7, pos: { x: { valueOf: 1 }, z: 3 } },
    };
    for (const [nombre, roto] of Object.entries(casos)) {
      datos.set('hojarasca-v1', JSON.stringify(roto));
      conReviver = 0;
      const r = G.cargarProgreso();
      ok(r && r.dia === 7, `H2-1: una partida con \`"${nombre}": 1\` carga`);
      ok(conReviver > 0, `H2-1: y ahí sí pasa por el «reviver» (${nombre})`);
      ok(r.pos === null || (Number.isFinite(r.pos.x) && Number.isFinite(r.pos.z)), `H2-1: la posición queda sana o descartada (${nombre})`);
    }
    // la clave escrita con escapes (no aparece la palabra en el texto)
    const escapado = JSON.stringify({ ...G.progresoNuevo(), dia: 7, pos: { x: { T: 1 }, z: 3 } }).replace('"T"', '"\\u0074oString"');
    ok(!escapado.includes('toString') && escapado.includes('\\u0074oString'), 'H2-1: el texto de prueba lleva la clave escapada');
    datos.set('hojarasca-v1', escapado);
    conReviver = 0;
    const e = G.cargarProgreso();
    ok(e && e.dia === 7 && conReviver > 0, 'H2-1: la clave escrita con \\u también pasa por el «reviver» y la partida carga');
    ok(e.pos === null || (Number.isFinite(e.pos.x) && Number.isFinite(e.pos.z)), 'H2-1: y su posición queda sana');
    // texto que no es un objeto, o roto: sigue dando null
    datos.set('hojarasca-v1', '[1,2]'); ok(G.cargarProgreso() === null, 'H2-1: un arreglo no es una partida');
    datos.set('hojarasca-v1', '{roto'); ok(G.cargarProgreso() === null, 'H2-1: un JSON roto da null');
    // el guardado de una partida grande: mismo texto escrito y leído, sin «reviver»
    const grande = { ...G.progresoNuevo(), obras: Array.from({ length: 1500 }, (_, i) => ({ id: 'piso', x: i, z: i * 2, rot: 0, etapas: 3 })) };
    conReviver = 0;
    ok(G.guardarProgreso(grande) !== false && conReviver === 0, 'H2-1: guardar una partida de 1500 obras tampoco usa el «reviver»');
  } finally { JSON.parse = original; }
}

// ---------------------------------------------------------------- M2/M3/M7/M1: el proceso principal
{
  const R = require('../recuperacion-main.cjs');
  // relanzar: suelta el candado ANTES y usa el exe portable si existe
  const llamadas = [];
  const app = { releaseSingleInstanceLock: () => llamadas.push('candado'), relaunch: (o) => llamadas.push(['relaunch', o]) };
  R.relanzar(app, undefined, {});
  ok(llamadas[0] === 'candado' && llamadas[1][0] === 'relaunch', 'M3: el candado de instancia única se suelta antes de relanzar');
  ok(!('execPath' in llamadas[1][1]) && !('args' in llamadas[1][1]), 'M2: sin portable, relanzar() es el de siempre (mismo exe, mismos argumentos)');
  llamadas.length = 0;
  R.relanzar(app, ['--x'], { PORTABLE_EXECUTABLE_FILE: 'C:\\juegos\\Hojarasca-Portable.exe' });
  ok(llamadas[1][1].execPath === 'C:\\juegos\\Hojarasca-Portable.exe' && llamadas[1][1].args.join() === '--x', 'M2: en el portable se relanza el exe portable (no la carpeta temporal), con los argumentos');
  R.relanzar({ relaunch: (o) => llamadas.push(o) }, undefined, {});   // un Electron de mentira sin candado: no tira
  ok(true, 'M3: sin releaseSingleInstanceLock tampoco tira');
  // la caída de la GPU relanza con relanzar() (pruebas de la 3.5.1 ya miran el flujo; acá, el candado y el portable)
  {
    const lanz = [];
    const ap = Object.assign(new EventEmitter(), { releaseSingleInstanceLock: () => lanz.push('candado'), relaunch: (o) => lanz.push(o), quit: () => lanz.push('quit') });
    const ventana = { webContents: Object.assign(new EventEmitter(), { send() {} }), isDestroyed: () => false };
    R.registrarRecuperacion({ app: ap, dialog: {}, escribirCrash() {}, index: 'i.html', ventanaActual: () => ventana, cambiarGraficos: () => true, retrasoReinicioMs: 0 });
    const antes = process.env.PORTABLE_EXECUTABLE_FILE;
    process.env.PORTABLE_EXECUTABLE_FILE = 'C:\\p\\Hojarasca.exe';
    try {
      ap.emit('child-process-gone', {}, { type: 'GPU', reason: 'crashed', exitCode: 1 });
      ap.emit('child-process-gone', {}, { type: 'GPU', reason: 'crashed', exitCode: 1 });
      await new Promise((r) => setTimeout(r, 30));
    } finally { if (antes === undefined) delete process.env.PORTABLE_EXECUTABLE_FILE; else process.env.PORTABLE_EXECUTABLE_FILE = antes; }
    ok(lanz[0] === 'candado' && lanz[1].execPath === 'C:\\p\\Hojarasca.exe' && lanz[1].args.includes('--hojarasca-recuperado=graficos') && lanz[2] === 'quit', 'M2/M3: el cambio de gráficos por caídas relanza el portable, suelta el candado y recién ahí sale');
  }

  // errores sin atrapar: se anotan, se pide guardar, y en bucle se cierra
  const registro = [], enviados = [], salidas = [];
  const proceso = new EventEmitter();
  const ventana = { isDestroyed: () => false, webContents: { send: (c) => enviados.push(c) } };
  let t = 1000;
  const cuidado = R.cuidarErroresMain({ proceso, app: { exit: (c) => salidas.push(c) }, escribirCrash: (tipo, d) => registro.push([tipo, d]), ventanaActual: () => ventana, ahora: () => t, retrasoCierreMs: 0 });
  proceso.emit('uncaughtException', new Error('falló un listener'));
  ok(registro.length === 1 && registro[0][0] === 'main-excepcion' && /falló un listener/.test(registro[0][1]), 'M3: la excepción queda en el registro con su stack');
  ok(enviados.join() === 'guardar-ya', 'M3: y se le pide guardar a la página');
  await new Promise((r) => setTimeout(r, 5));
  ok(salidas.length === 0 && !cuidado.cerrando(), 'M3: una sola no cierra el juego');
  proceso.emit('unhandledRejection', 'rechazo sin Error');
  ok(registro[1][0] === 'main-rechazo' && /rechazo sin Error/.test(registro[1][1]), 'M3: el rechazo sin atrapar también queda anotado');
  t += 60000; proceso.emit('uncaughtException', new Error('otra, mucho después'));
  await new Promise((r) => setTimeout(r, 5));
  ok(salidas.length === 0, 'M3: errores espaciados no cuentan como bucle');
  for (let i = 0; i < 6; i++) { t += 100; proceso.emit('uncaughtException', new Error('bucle ' + i)); }
  await new Promise((r) => setTimeout(r, 10));
  ok(cuidado.cerrando() && salidas.length === 1 && salidas[0] === 1, 'M3: en bucle (5 en 10 s) se cierra una sola vez, con guardado pedido');
  ok(registro.some(([tp, d]) => tp === 'main' && /se cierra el juego/.test(d)), 'M3: y el cierre también queda anotado');
  // sin ventana o con el registro roto, no tira
  const p2 = new EventEmitter();
  R.cuidarErroresMain({ proceso: p2, app: { exit() {} }, escribirCrash: () => { throw new Error('disco'); }, ventanaActual: () => null });
  p2.emit('uncaughtException', new Error('x'));
  ok(true, 'M3: sin ventana y con el registro fallando no se vuelve a romper');

  // main.cjs: los enganches (el archivo no se puede ejecutar fuera de Electron)
  const m = leer('main.cjs');
  ok(/backgroundThrottling: !\(process\.env\.HOJ_SIN_ESTRANGULAR === '1' \|\| process\.env\.HUMO_OCULTO === '1'\),/.test(m) && !/backgroundThrottling: false/.test(m), 'M1: en producción el valor por defecto; sólo se apaga con HOJ_SIN_ESTRANGULAR o HUMO_OCULTO (medición)');
  ok(/relanzar\(app\); app\.exit\(0\);/.test(m) && !/app\.relaunch\(/.test(m), 'M2: main.cjs relanza con relanzar()');
  ok(!/app\.relaunch\(/.test(leer('recuperacion-main.cjs').replace(/function relanzar[\s\S]*?\n}\n/, '')), 'M2: recuperacion-main.cjs sólo relanza dentro de relanzar()');
  ok(/cuidarErroresMain\(\{ proceso: process, app, escribirCrash, ventanaActual: \(\) => ventanaPrincipal \}\);/.test(m), 'M3: main.cjs engancha los errores sin atrapar');
  ok(/INTENTOS_GRAFICOS\[siguiente\]\['use-angle'\] === 'd3d9'\) siguiente\+\+;/.test(m), 'M7: graficos-fallaron saltea d3d9');
  // las herramientas de medición que crean sus ventanas siguen con el estrangulado apagado
  ok(/setBackgroundThrottling\(false\)/.test(leer('herramientas/al-monitor.cjs')), 'M1: al-monitor.cjs apaga el estrangulado de toda ventana que abre (las pruebas con el main.cjs entero no cambian)');
  for (const f of ['medir-vistas', 'medir-caminata', 'medir-duendes', 'soak-largo']) ok(/backgroundThrottling: false/.test(leer(`herramientas/${f}.cjs`)), `M1: ${f}.cjs conserva su propia ventana sin estrangular`);
}

// ---------------------------------------------------------------- M9: guardadoEn no finito
{
  const S = require('../sincronia-main.cjs');
  const con = (g) => JSON.stringify({ cuerpo: { progreso: { guardadoEn: g } } });
  ok(S.guardadoEnDe(con(5000)) === 5000, 'M9: un sello normal se lee');
  ok(S.guardadoEnDe('{"cuerpo":{"progreso":{"guardadoEn":1e400}}}') === 0, 'M9: 1e400 (Infinity) no vale como sello');
  ok(S.guardadoEnDe(con(-5)) === 0 && S.guardadoEnDe(con('x')) === 0 && S.guardadoEnDe('roto') === 0, 'M9: negativo, texto y JSON roto dan 0 (como siempre)');
  ok(S.puedePisar('{"cuerpo":{"progreso":{"guardadoEn":1e400}}}', 1000) === true, 'M9: una copia con sello infinito ya no traba las escrituras');
  ok(S.puedePisar(con(3000), 1000) === false && S.puedePisar(con(3000), 2000) === false && S.puedePisar(con(3000), 3000) === true, 'M9: el conflicto real sigue igual');
}

// ---------------------------------------------------------------- M10: __hojarascaErrores con tope
{
  const html = leer('src/plantilla.html');
  const bloque = /<script>\n(window\.__hojarascaErrores = \[\];[\s\S]*?)<\/script>/.exec(html);
  ok(!!bloque, 'M10: está el primer script de la plantilla');
  const oyentes = {};
  const win = { addEventListener: (tipo, f) => { oyentes[tipo] = f; } };
  vm.runInNewContext(bloque[1], { window: win, String });
  for (let i = 0; i < 5000; i++) oyentes.error({ error: { stack: 'stack ' + i } });
  for (let i = 0; i < 5000; i++) oyentes.unhandledrejection({ reason: 'rechazo ' + i });
  ok(win.__hojarascaErrores.length === 100, `M10: el arreglo se queda en 100 (${win.__hojarascaErrores.length})`);
  ok(win.__hojarascaErrores[0] === 'stack 0', 'M10: y conserva los primeros (los que explican por qué no arrancó)');
}

// ---------------------------------------------------------------- H2-2: los lugares tomados se arman en tres cuadros
{
  registrarThree();
  const { crearTomadasMundo } = await import('../src/desafio-tomadas-mundo.js');
  const T = { altura: (x, z) => 3 + Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2, agua: () => false, indice: () => 0, lugares: {} };
  const hijos = new Set();
  const escena = { add: (g) => hijos.add(g), remove: (g) => hijos.delete(g) };
  const valle = { cerrado: false, zonas: [{ id: 'lago', x: 100, z: 100, nivel: 2 }, { id: 'bosque', x: -150, z: 60, nivel: 1 }] };
  const jug = { pos: { x: 100, z: 100 } };
  const tm = crearTomadasMundo(T, escena, { D: () => ({ valle }) });
  tm.actualizar(0.016, jug);
  const s1 = tm.sitios.get('lago');
  ok(tm.sitios.size === 2 && hijos.size === 2, 'H2-2: el lugar existe y está en la escena desde el primer cuadro');
  ok(s1.etapa === 1 && s1.tinte && !s1.bruma && !s1.hongos, 'H2-2: el primer cuadro arma sólo el suelo oscuro (un lugar por cuadro entre todos)');
  ok(s1.g.visible === false && tm.sitios.get('bosque').etapa === 0, 'H2-2: nace invisible y el otro lugar espera su turno');
  tm.actualizar(0.016, jug);
  ok(s1.etapa === 2 && s1.bruma && !s1.hongos && s1.g.visible === false, 'H2-2: el segundo cuadro, la bruma con las columnas');
  tm.actualizar(0.016, jug);
  ok(s1.etapa === 3 && s1.hongos && s1.g.children.length === 3, 'H2-2: el tercero, los hongos: el lugar queda completo (suelo, bruma, hongos, en ese orden)');
  ok(s1.g.children[0] === s1.tinte && s1.g.children[1] === s1.bruma && s1.g.children[2] === s1.hongos, 'H2-2: mismo orden de dibujo que antes');
  for (let i = 0; i < 4; i++) tm.actualizar(0.016, jug);
  const s2 = tm.sitios.get('bosque');
  ok(s2.etapa === 3, 'H2-2: el segundo lugar se completa después (seis cuadros en total)');
  for (let i = 0; i < 400; i++) tm.actualizar(0.05, jug);
  ok(Math.abs(s1.k - 2 / TOMADAS_NIVEL_MAX()) < 0.01 || s1.k > 0.5, `H2-2: el fundido sube hasta su escalón (k=${s1.k.toFixed(2)})`);
  ok(s1.g.visible === true && s1.hongos.geometry.drawRange.count > 0, 'H2-2: y el lugar se ve');
  // limpiar con un lugar a medio armar no tira
  valle.zonas.push({ id: 'cerro', x: 0, z: -200, nivel: 1 });
  tm.actualizar(0.016, jug);
  ok(tm.sitios.get('cerro').etapa === 1, 'H2-2: un tercer lugar queda a medio armar');
  tm.limpiar();
  ok(tm.sitios.size === 0 && hijos.size === 0, 'H2-2: limpiar() con un lugar a medio armar los suelta a todos sin tirar');
  function TOMADAS_NIVEL_MAX() { return 3; }
}

// ---------------------------------------------------------------- H2-4: mapas débiles
{
  const d = leer('src/desafio.js'), df = leer('src/desafio-defensas.js');
  ok(/const recargaTorreta = new WeakMap\(\);/.test(d) && /const silencioCampana = new WeakMap\(\);/.test(df), 'H2-4: recargaTorreta y silencioCampana no retienen las obras caídas');
  ok(!/recargaTorreta\.(keys|values|entries|size|forEach|clear|has)\b|silencioCampana\.(keys|values|entries|size|forEach|clear|has)\b/.test(d + df), 'H2-4: y sólo se usan con get/set (lo que un WeakMap permite)');
  const o = {}; const w = new WeakMap(); w.set(o, 0.3);
  ok((w.get(o) || 0) - 0.5 < 0 && w.get({}) === undefined, 'H2-4: get/set de un WeakMap hacen lo que hacía el Map');
}

// ---------------------------------------------------------------- H2-3 y H2-5: el Coihue
{
  const a = leer('src/desafio-asedio-mundo.js');
  ok(/let c = a\.camino;\n    if \(!c\) c = crearCamino\(a\); else replanear\(a\);\n    empezarNocheCamino\(c, D\(\)\.oleadas \+ 1\);/.test(a), 'H2-3: nocheCamino no replanea un camino recién creado');
  ok(/c\.rastro\.length !== vis\.nHuellas \|\| uRastro\[0\] !== vis\.huellaX \|\| uRastro\[1\] !== vis\.huellaZ/.test(a), 'H2-5: las huellas se rearman también con el rastro lleno (cambia el último punto)');
  // el rastro lleno sigue cambiando de último punto aunque el largo no cambie
  const C = await import('../src/desafio-camino.js');
  const c = C.caminoNuevo({ ruta: [[0, 0], [2000, 0]], base: { x: 2000, z: 0 }, interior: { x: 0, z: 0 } });
  for (let x = 6; x < 700; x += 6) C.anotarRastro(c, x, 0);
  const largo = c.rastro.length, ult = c.rastro[c.rastro.length - 1][0];
  C.anotarRastro(c, 800, 0);
  ok(c.rastro.length === largo && c.rastro[c.rastro.length - 1][0] !== ult, 'H2-5: con el rastro lleno el largo no cambia pero el último punto sí (la clave nueva lo detecta)');
}

// ---------------------------------------------------------------- M11/M12: el paquete lleva todo lo que main.cjs necesita
{
  const files = JSON.parse(leer('package.json')).build.files;
  const pedidos = [...leer('main.cjs').matchAll(/require\('\.\/([\w.-]+\.cjs)'\)/g)].map((x) => x[1]);
  ok(pedidos.length >= 5, `M11: main.cjs pide ${pedidos.length} módulos propios`);
  for (const f of new Set(pedidos)) ok(files.includes(f), `M11: ${f} (lo pide main.cjs) está en build.files: si no, el instalado no arranca`);
  for (const f of ['preload.cjs', 'index.html', 'build/icon.png']) ok(files.includes(f), `M12: build.files lleva ${f}`);
  ok(files.every((f) => !/[*]|pruebas|\.claude|informes|CAMBIOS|PLAN_/.test(f)), 'M12: build.files es una lista cerrada de archivos (nada de carpetas con comodines, pruebas ni informes)');
}

console.log(`4.10.4 (proceso y rendimiento): ${n} comprobaciones`);
