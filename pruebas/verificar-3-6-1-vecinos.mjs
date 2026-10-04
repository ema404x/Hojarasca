// 3.6.1 (vecinos): los arreglos de los vecinos, la charla y las mecánicas de cada lugar de la aldea
// (la 3.6.0 recién salida). Una sección por bug: cada una falla con el código de la 3.6.0.
// La partida real que acompaña: humo-3-6-1-asientos.cjs (todos los asientos del juego).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
// jugador.js y aldea-mecanicas-mundo.js usan three: en Node, el three local del juego como módulo
{
  const codigo = leer('three-r186-inline.js');
  const caja = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, ArrayBuffer, DataView, Error, TypeError, Symbol, Promise, Reflect, Proxy };
  vm.runInNewContext(codigo + '\n;this.__claves = Object.keys(THREE);', caja);
  const archivo = path.join(os.tmpdir(), 'hojarasca-three-3-6-1-vecinos.mjs');
  fs.writeFileSync(archivo, codigo + '\nexport const { ' + caja.__claves.join(', ') + ' } = THREE;\n');
  register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) { if (s === 'three') return { url: ${JSON.stringify(pathToFileURL(archivo).href)}, shortCircuit: true }; return n(s, c); }`));
}
const THREE = await import('three');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const main = leer('src/main.js');

// ============================================================ 1. del sillón de los cuentos no se salía
// Lo encontró el usuario: el sillón es un mueble que frena (una caja de cuatro lados) y el asiento cae
// en su medio. Al levantarte, los lados te empujaban siempre para adentro. Ahora volvés a donde estabas
// parado al sentarte (con las teclas, el mando, R o al despertar), y sentado se guarda ese lugar.
{
  // un jugador de verdad (jugador.js) con un DOM mínimo, un terreno plano y la caja del sillón
  const oyentes = {};
  globalThis.document ??= { addEventListener: (t, f) => { oyentes[t] = f; }, pointerLockElement: null };
  globalThis.window ??= { addEventListener() {}, self: 1, top: 1 };
  globalThis.HTMLElement ??= function HTMLElement() {};
  HTMLElement.prototype.requestPointerLock ??= () => {};
  const { crearJugador } = await import('../src/jugador.js');
  // la caja: de -0.5 a 0.5 en x y en z, con los lados como segmentos finos (como piezas.js `mueble`)
  const lados = [[-0.5, -0.5, 0.5, -0.5], [0.5, -0.5, 0.5, 0.5], [0.5, 0.5, -0.5, 0.5], [-0.5, 0.5, -0.5, -0.5]];
  const empujar = (p, r) => {
    for (const [ax, az, bx, bz] of lados) {
      const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz;
      const t = Math.max(0, Math.min(1, ((p.x - ax) * vx + (p.z - az) * vz) / l2));
      const cx = ax + vx * t, cz = az + vz * t, dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
      const minimo = r + 0.04;
      if (d < minimo && d > 1e-9) { p.x = cx + (dx / d) * minimo; p.z = cz + (dz / d) * minimo; }
    }
  };
  const col = {
    resolver: (p, r) => empujar(p, r), resolverPlataformas() {}, plataformaEn: () => null, plataformaBaja: () => null,
    espacioVerticalLibre: () => true, techoEntre: () => null, paredEntre: () => false,
  };
  const T = { altura: () => 0, normal: () => ({ x: 0, y: 1, z: 0 }), agua: () => null, indice: () => 0, distSendero: [9], bosque: [0], pasto: [0] };
  const camara = new THREE.PerspectiveCamera();
  const J = crearJugador(camara, T, col, { activo: () => true, lienzo: { addEventListener() {} }, sensibilidad: () => 1, invierno: () => 0, otono: () => 0, fov: () => 70 });
  const e = J.estado;
  const paso = (k = 1) => { for (let i = 0; i < k; i++) J.actualizar(0.05); };
  // parado adelante del sillón, como para apretar E
  J.ubicar(0, 1.6, 0, 0); paso(6);
  // E: el cuerpo va al asiento (main.js: objetos.usar → r.sentarse) y te sentás
  e.pos.set(0, 0, 0); e.yaw = Math.PI; J.sentarse(true); paso(4);
  ok(e.sentado && Math.hypot(e.pos.x, e.pos.z) < 0.05, 'sentado en el medio del sillón');
  ok(e.salida && Math.abs(e.salida.z - 1.6) < 0.05, 'la salida: donde estabas parado');
  // te levantás caminando: volvés a la salida, afuera de la caja, y te podés ir
  J.teclas.add('KeyW'); paso(1);
  ok(!e.sentado && e.pos.z > 1 && !e.salida, `al levantarte quedás afuera del sillón (${e.pos.z.toFixed(2)})`);
  J.teclas.clear();
  e.yaw = Math.PI; J.teclas.add('KeyW'); paso(40); J.teclas.clear();
  ok(e.pos.z < -1 || e.pos.z > 2.5 || Math.abs(e.pos.x) > 1, `y te alejás (${e.pos.x.toFixed(2)}, ${e.pos.z.toFixed(2)})`);
  // con R (sentarse(false)) y al despertar (dormir), lo mismo
  J.ubicar(1.6, 0, 0, 0); paso(4); e.pos.set(0, 0, 0); J.sentarse(true); paso(2); J.sentarse(false);
  ok(Math.abs(e.pos.x - 1.6) < 0.05 && !e.sentado, 'con R, también afuera');
  // sentado dos veces seguidas (sentado en un banco junto al fuego, E duerme): vale la primera salida
  J.ubicar(-1.6, 0, 0, 0); paso(4); e.pos.set(0, 0, 0); J.sentarse(true); paso(2); J.sentarse(true); paso(2); J.sentarse(false);
  ok(Math.abs(e.pos.x + 1.6) < 0.05, 'dormir sentado y despertar: la salida de antes');
  // si te llevaron lejos sentado (un teletransporte), no se vuelve a una salida de otro lado
  J.ubicar(0, 1.6, 0, 0); paso(4); e.pos.set(0, 0, 0); J.sentarse(true); e.pos.set(30, 0, 30); J.sentarse(false);
  ok(e.pos.x === 30 && e.pos.z === 30, 'lejos de la salida, te levantás donde estás');
  // el código de la 3.6.0 (sin salida) dejaba al jugador adentro
  ok(/estado\.salida = hayDePie \? dePie\.clone\(\) : estado\.pos\.clone\(\)/.test(leer('src/jugador.js')), 'jugador.js: la salida al sentarse');
  // R, sentado, siempre te levanta; y sentado se guarda la salida (al cargar no aparecés adentro del sillón)
  ok(main.includes('if (js.sentado) jugador.sentarse(false);\n      else if (!js.nadando && !js.enKayak && !js.enTren) jugador.sentarse(true);'), 'R: sentado, te levanta siempre');
  ok(main.includes(': jugador.estado.sentado && jugador.estado.salida ? { x: jugador.estado.salida.x, y: jugador.estado.salida.y, z: jugador.estado.salida.z }'), 'guardar: sentado, la salida');
  ok(fs.existsSync(new URL('./humo-3-6-1-asientos.cjs', import.meta.url)), 'la partida real de todos los asientos');
}

console.log(`OK 3.6.1 vecinos · ${n} verificaciones`);
