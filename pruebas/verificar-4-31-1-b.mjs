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
const PUE = process.env.HX_PUE || path.join(raiz, 'src/puertas.js');
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

// ---------------------------------------------------------------- 4. la E de la puerta, sólo mirándola (puertas.js de verdad)
async function pruebaPuerta() {
  const { crearPuertas } = await import(pathToFileURL(PUE).href);
  const escena = new THREE.Scene(), col = crearColisiones();
  const P = crearPuertas({ altura: () => 0 }, escena, col, null);
  // la puerta del refugio: en (0, 2,78) de un refugio sin girar; el marco de la ventana del frente, a 1,6 m de costado
  const pu = P.agregar({ sitio: { x: 0, z: 0, y: 0 }, rot: 0, lx: 0, lz: 2.78, ancho: 1.2, nombre: 'la puerta del refugio' });
  const dir = (de, a) => ({ x: a.x - de.x, z: a.z - de.z });
  const ojo = { x: 2.2, y: 0, z: 4.1 };
  ok(P.cerca(ojo) === pu, 'por cercanía sola, la puerta está a mano (por eso le ganaba a la ventana)');
  ok(P.mirada(ojo, dir(ojo, { x: 1.6, z: 2.6 })) === null, 'mirando el marco de la ventana desde afuera, la puerta no');
  ok(P.mirada({ x: 0.2, y: 0, z: 4.4 }, dir({ x: 0.2, z: 4.4 }, { x: 0, z: 2.78 })) === pu, 'mirando la puerta de frente, sí');
  ok(P.mirada({ x: 1.4, y: 0, z: 4.0 }, dir({ x: 1.4, z: 4.0 }, { x: 0, z: 2.78 })) === pu, 'mirando la puerta en diagonal, sí');
  ok(P.mirada({ x: 0, y: 0, z: 4.3 }, { x: 0, z: 1 }) === null, 'de espaldas a la puerta, no');
  ok(P.mirada({ x: 0, y: 0, z: 3.2 }, { x: 1, z: 0 }) === pu, 'parado en el vano, mirando para el costado, sí');
  ok(P.mirada({ x: 0, y: 0, z: 4.3 }, { x: 0, z: 0 }) === pu, 'sin vista (0, 0), como antes: la más cercana');
  const fm = fs.readFileSync(MAIN, 'utf8');
  ok(fm.includes('puertaCerca: () => puertas && (puertas.mirada ? puertas.mirada(jugador.estado.pos, camara.getWorldDirection(dirPuertaE))'), 'main.js usa la puerta que mirás para la E');
}

// ---------------------------------------------------------------- 5. el fuego del hogar, adentro de la boca (casa-detalles-mundo.js)
async function pruebaHogar() {
  const { crearCasaDetallesMundo } = await import(pathToFileURL(CDM).href);
  const escena = new THREE.Scene(), circulos = [];
  const M = crearCasaDetallesMundo({ T: { altura: () => 0 }, ref: { x: 0, y: 0, z: 0, rot: 0 }, escena, col: { agregar: (c) => circulos.push(c) } });
  const jambas = circulos.filter((c) => Math.abs(c.z + 1.7) < 0.01 && Math.abs(Math.abs(c.x + 2.4) - 0.72) < 0.01);
  ok(jambas.length === 2, 'las dos jambas de la boca del hogar frenan');
  // piedra delante de la cara del hogar: a los dos costados del fuego y arriba (el dintel), en la cara de adelante (z = -1,54)
  let izq = 0, der = 0, arriba = 0;
  const v = new THREE.Vector3();
  for (const o of M.grupo.children) {
    if (!o.isMesh || o.parent !== M.grupo) continue;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.z < -1.56 || v.z > -1.52) continue;
      if (v.x < -3.0 && v.x > -3.2 && v.y < 0.37 + 0.5) izq++;
      if (v.x > -1.8 && v.x < -1.6 && v.y < 0.37 + 0.5) der++;
      if (v.y > 0.37 + 0.8 && v.y < 0.37 + 0.84 && Math.abs(v.x + 2.4) < 0.8) arriba++;
    }
  }
  ok(izq >= 2 && der >= 2 && arriba >= 2, `hay jambas y dintel delante del fuego (${izq}, ${der}, ${arriba} vértices)`);
  const f = M.partes.fuego.position;
  ok(Math.abs(f.x + 2.4) < 0.05 && f.z > -1.86 && f.z < -1.54, 'el fuego está en la boca, entre la cara del hogar y el frente de las jambas');
}

if (!SOLO || SOLO === 'puerta') await pruebaPuerta();
if (!SOLO || SOLO === 'hogar') await pruebaHogar();
if (!SOLO || SOLO === 'sentado') await pruebaSentado();
if (!SOLO || SOLO === 'alacena') pruebaAlacena();
if (!SOLO || SOLO === 'sillon') await pruebaSillon();
if (process.env.HX_PUE || process.env.HX_JUG || process.env.HX_MAIN || process.env.HX_CD || process.env.HX_CDM) { console.log('mutación sin atrapar'); process.exit(0); }

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
  ['src/casa-detalles-mundo.js', 'HX_CDM', 'hogar', 'sin la boca del hogar', 'for (const s of [-1, 1]) caja(c, [-2.4 + s * 0.72, P + 0.33, -1.7]', 'for (const s of []) caja(c, [-2.4 + s * 0.72, P + 0.33, -1.7]'],
  ['src/casa-detalles-mundo.js', 'HX_CDM', 'hogar', 'las jambas no frenan', 'for (const s of [-1, 1]) circulo(-2.4 + s * 0.72', 'for (const s of []) circulo(-2.4 + s * 0.72'],
  ['src/puertas.js', 'HX_PUE', 'puerta', 'la puerta por cercanía otra vez', 'if (d >= 0.9 && (avanza <= 0 || costado > (p.ancho || 0.95) / 2 + 0.4)) continue;', ''],
  ['src/puertas.js', 'HX_PUE', 'puerta', 'de espaldas también', 'avanza <= 0 || costado', 'costado'],
  ['src/puertas.js', 'HX_PUE', 'puerta', 'en el vano, no', 'if (d >= 0.9 && (', 'if (d >= 0 && ('],
  ['src/main.js', 'HX_MAIN', 'puerta', 'main.js con la más cercana', 'puertaCerca: () => puertas && (puertas.mirada ? ', 'puertaCerca: () => puertas && (false ? '],
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
