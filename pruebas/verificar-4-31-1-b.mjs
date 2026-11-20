// 4.31.1 (B): cacería de bugs del refugio, tus casas, objetos y economía (lo nuevo de adentro de la 4.31.0 A, visto en partida real con
// pruebas/humo-4-31-1-b.cjs). Lo que se arregló:
//  1. Sentado no se choca (jugador.js): el asiento de tus muebles armados (el sillón, la mecedora, el sillón de cuero) está adentro de su
//     cuerpo y el choque te sacaba 0,8 m (quedabas parado detrás del respaldo mirando el sillón). Al levantarte volvés a la salida.
//  2. La alacena armada es de la cocina (main.js, `obrasCerca`): la E de la casa («Abrir la alacena», con una nota) le ganaba a la de la
//     cocina («Mirar la alacena (3 cosas)» / «La alacena está vacía», con lo que hay de verdad y cuántos).
//  3. Sentado en el sillón del refugio la vista baja al fuego (casa-detalles.js `pitch`, main.js `sentarEnLaAldea`): con la de siempre sólo
//     se veía la chimenea de piedra.
// Mutaciones: cada una es una copia del archivo con otro nombre, probada en su propio proceso; tiene que hacer fallar su comprobación.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';
import { mundoDeMentira, funcion } from './ayuda-codigo.mjs';

registrarThree();
const THREE = await import('three');
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const JUG = process.env.HX_JUG || path.join(raiz, 'src/jugador.js');
const MAIN = process.env.HX_MAIN || path.join(raiz, 'src/main.js');
const CD = process.env.HX_CD || path.join(raiz, 'src/casa-detalles.js');
const CDM = process.env.HX_CDM || path.join(raiz, 'src/casa-detalles-mundo.js');
const SOLO = process.env.HX_SOLO || '';
const { crearColisiones } = await import('../src/colisiones.js');

// ---------------------------------------------------------------- 1. sentado en el sillón armado, no te saca (jugador.js de verdad)
async function pruebaSentado() {
  globalThis.document ??= { addEventListener() {}, pointerLockElement: null };
  globalThis.window ??= { addEventListener() {}, self: 1, top: 1 };
  globalThis.HTMLElement ??= function HTMLElement() {};
  HTMLElement.prototype.requestPointerLock ??= () => {};
  const { crearJugador } = await import(pathToFileURL(JUG).href);
  const T = { altura: () => 0, normal: () => ({ x: 0, y: 1, z: 0 }), agua: () => null, indice: () => 0, distSendero: [9], bosque: [0], pasto: [0] };
  // el cuerpo del sillón de lana (planos-muebles.js: `h.segmento(-0.15, 0, 0.15, 0, 0.45, 0, 0.98)`)
  const col = crearColisiones();
  col.agregar({ seg: true, ax: -0.15, az: 0, bx: 0.15, bz: 0, r: 0.45, alturaMin: 0, alturaMax: 0.98 });
  const J = crearJugador(new THREE.PerspectiveCamera(), T, col, { activo: () => true, lienzo: { addEventListener() {} }, sensibilidad: () => 1, invierno: () => 0, otono: () => 0, fov: () => 70 });
  J.ubicar(0, -1.4, 0);
  for (let i = 0; i < 10; i++) J.actualizar(0.05);   // parado delante: ahí queda la salida
  // te sentás (como `sentarEnLaAldea`: el asiento, 5 cm detrás del centro)
  J.estado.pos.set(0, 0.1, 0.05);
  J.sentarse(true);
  for (let i = 0; i < 60; i++) J.actualizar(0.05);
  const d = Math.hypot(J.estado.pos.x, J.estado.pos.z - 0.05);
  ok(J.estado.sentado && d < 0.01, `sentado en el sillón, el sillón no te saca (te corrió ${d.toFixed(2)} m)`);
  // al levantarte, a la salida (afuera del sillón) y desde ahí el choque de siempre
  J.sentarse(false);
  J.actualizar(0.05);
  ok(!J.estado.sentado && Math.hypot(J.estado.pos.x, J.estado.pos.z + 1.4) < 0.05, `al levantarte volvés adelante del sillón (${J.estado.pos.x.toFixed(2)}, ${J.estado.pos.z.toFixed(2)})`);
  // parado, adentro del sillón, el choque te saca (como siempre)
  J.estado.pos.set(0, 0, 0.05);
  J.actualizar(0.05);
  ok(Math.hypot(J.estado.pos.x, J.estado.pos.z) > 0.7, `parado no se atraviesa el sillón (${Math.hypot(J.estado.pos.x, J.estado.pos.z).toFixed(2)} m del centro)`);
}

// ---------------------------------------------------------------- 2. la alacena armada es de la cocina (main.js)
function pruebaAlacena() {
  const fuente = fs.readFileSync(MAIN, 'utf8');
  const linea = fuente.split('\n').find((l) => l.trimStart().startsWith('obrasCerca: (p, r) =>'));
  ok(!!linea, 'main.js le da a la casa sus muebles cerca (`obrasCerca`)');
  const cuerpo = linea.trimStart().slice('obrasCerca: '.length).replace(/,\s*(\/\/.*)?$/, '');
  const obra = (id) => ({ plano: { id }, datos: { x: 1, y: 0, z: 1 } });
  const lista = [obra('alacena'), obra('sillon'), obra('baul'), obra('parrilla')];
  const env = { obras: { obras: lista, editando: null }, obraTerminada: () => true, Math,
    cocinaJuego: { esDeCocina: (o) => ['alacena', 'parrilla', 'cocina-lena', 'horno'].includes(o.plano.id) } };
  const obrasCerca = new Function('env', `with (env) { return (${cuerpo}); }`)(mundoDeMentira(env));
  const ids = obrasCerca({ x: 0, y: 0, z: 0 }, 3.2).map((o) => o.plano.id);
  ok(!ids.includes('alacena'), `la alacena armada no es un mueble de la casa: la E es de la cocina (quedan ${ids.join(', ')})`);
  ok(ids.includes('sillon') && ids.includes('baul'), 'el sillón y el baúl siguen siendo de la casa');
  // en el Desafío no hay cocina: no se rompe
  const sinCocina = new Function('env', `with (env) { return (${cuerpo}); }`)(mundoDeMentira({ ...env, cocinaJuego: null }));
  let quedan = -1;
  try { quedan = sinCocina({ x: 0, y: 0, z: 0 }, 3.2).length; } catch { /* (se rompió) */ }
  ok(quedan === 4, 'sin cocina (null) no se rompe');
  // y en la tabla de la E, la casa va antes que las obras que trabajan (por eso le ganaba)
  const tabla = leer('src/interacciones.js');
  ok(tabla.indexOf("{ id: 'casa'") < tabla.indexOf("{ id: 'obra-trabaja'"), 'la casa va antes que las obras que trabajan en la tabla de la E');
}

// ---------------------------------------------------------------- 3. sentado en el sillón del refugio, al fuego
async function pruebaSillon() {
  const C = await import(pathToFileURL(CD).href);
  const s = C.COSAS_REFUGIO.find((k) => k.id === 'sillon').sentarse;
  ok(Number.isFinite(s.pitch) && s.pitch < -0.2 && s.pitch > -0.6, `el sillón del refugio pide la vista baja (${s.pitch})`);
  // la vista desde los ojos (sentado: 0,95 m sobre los pies, que van 0,45 bajo el asiento) llega al fuego del hogar (a 0,2 m del piso)
  const ojo = { y: s.y - 0.45 + 0.95 }, fuego = { x: -2.4, y: C.PISO_REFUGIO + 0.2, z: -1.74 };
  const dist = Math.hypot(fuego.x - s.x, fuego.z - s.z), hacia = Math.atan2(fuego.y - ojo.y, dist);
  ok(Math.abs(hacia - s.pitch) < 0.35, `con esa vista el fuego queda en la pantalla (${hacia.toFixed(2)} hacia el fuego, ${s.pitch} la vista)`);
  // el mundo lo pasa al asiento y main.js lo usa
  const fm = fs.readFileSync(CDM, 'utf8');
  ok(/sentarse\[k\.id\] = \{[^}]*pitch: s\.pitch/.test(fm), 'casa-detalles-mundo.js pasa la vista del asiento');
  const js = { pos: { set(x, y, z) { Object.assign(this, { x, y, z }); } }, yaw: 0, pitch: 0 };
  let sentado = false;
  const sentar = funcion(fs.readFileSync(MAIN, 'utf8'), 'sentarEnLaAldea', { jugador: { estado: js, sentarse: (v) => { sentado = v; } }, T: { altura: () => 0 }, Math, Number });
  sentar({ x: 1, y: 0.8, z: 2, mira: 1.2, pitch: -0.32 });
  ok(sentado && js.yaw === 1.2 && js.pitch === -0.32, `sentarEnLaAldea usa la vista que pide el asiento (${js.pitch})`);
  sentar({ x: 1, y: 0.8, z: 2, mira: 0.4 });
  ok(js.pitch === -0.05, 'sin vista pedida, la de siempre (-0,05)');
}

if (!SOLO || SOLO === 'sentado') await pruebaSentado();
if (!SOLO || SOLO === 'alacena') pruebaAlacena();
if (!SOLO || SOLO === 'sillon') await pruebaSillon();
if (process.env.HX_JUG || process.env.HX_MAIN || process.env.HX_CD || process.env.HX_CDM) { console.log('mutación sin atrapar'); process.exit(0); }

// ---------------------------------------------------------------- mutaciones
const MUT = [
  ['src/jugador.js', 'HX_JUG', 'sentado', 'sentado se choca otra vez', 'if (!estado.sentado) {\n    col.resolver(estado.pos, radioFisico, alturaFisica);', 'if (true) {\n    col.resolver(estado.pos, radioFisico, alturaFisica);'],
  ['src/jugador.js', 'HX_JUG', 'sentado', 'no se choca nunca', 'if (!estado.sentado) {\n    col.resolver(estado.pos, radioFisico, alturaFisica);', 'if (false) {\n    col.resolver(estado.pos, radioFisico, alturaFisica);'],
  ['src/main.js', 'HX_MAIN', 'alacena', 'la alacena vuelve a ser de la casa', '!cocinaJuego?.esDeCocina?.(o) && ', ''],
  ['src/main.js', 'HX_MAIN', 'alacena', 'sin cocina se rompe', '!cocinaJuego?.esDeCocina?.(o) && ', '!cocinaJuego.esDeCocina(o) && '],
  ['src/main.js', 'HX_MAIN', 'sillon', 'el asiento no pide la vista', 'js.pitch = Number.isFinite(s.pitch) ? s.pitch : -0.05;', 'js.pitch = -0.05;'],
  ['src/casa-detalles.js', 'HX_CD', 'sillon', 'el sillón sin vista baja', "mira: [-0.7, -0.72], pitch: -0.32 }", "mira: [-0.7, -0.72] }"],
  ['src/casa-detalles.js', 'HX_CD', 'sillon', 'la vista al techo', "mira: [-0.7, -0.72], pitch: -0.32 }", "mira: [-0.7, -0.72], pitch: 0.32 }"],
  ['src/casa-detalles-mundo.js', 'HX_CDM', 'sillon', 'el mundo no pasa la vista', ', pitch: s.pitch };', ' };'],
];
let atrapadas = 0;
for (const [archivo, clave, solo, nombre, de, a] of MUT) {
  const texto = leer(archivo);
  assert.equal(texto.split(de).length, 2, `la mutación «${nombre}» encuentra su fragmento una sola vez en ${archivo}`);
  const copia = path.join(raiz, path.dirname(archivo), `__mut-4311b-${atrapadas}-${path.basename(archivo)}`);
  fs.writeFileSync(copia, texto.replace(de, a));
  try {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, HX_SOLO: solo, [clave]: copia }, encoding: 'utf8' });
    assert.ok(r.status !== 0 && /AssertionError/.test(r.stderr || ''), `la mutación «${nombre}» no se atrapó (o se rompió por otra cosa): ${(r.stdout || '').slice(-200)} ${(r.stderr || '').slice(0, 300)}`);
    atrapadas++;
  } finally { fs.rmSync(copia, { force: true }); }
}
console.log(`verificar-4-31-1-b: ${n} comprobaciones OK · ${atrapadas} de ${MUT.length} mutaciones atrapadas`);
