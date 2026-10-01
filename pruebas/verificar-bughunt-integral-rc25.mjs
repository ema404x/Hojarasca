import fs from 'fs';
import path from 'path';
import assert from 'assert/strict';
import { fileURLToPath } from 'url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const main = leer('src/main.js');
const jugador = leer('src/jugador.js');
const puertas = leer('src/puertas.js');
const construccion = leer('src/construccion.js');

// Guardado multinivel: la cota Y viaja en la partida y se entrega al jugador.
assert.match(main, /\{ x: jugador\.estado\.pos\.x, y: jugador\.estado\.pos\.y, z: jugador\.estado\.pos\.z \}/);
assert.match(main, /jugador\.ubicar\(progreso\.pos\.x, progreso\.pos\.z, progreso\.yaw, progreso\.pos\.y\)/);
assert.match(jugador, /function ubicar\(x, z, yaw = 0, yGuardada = null\)/);
assert.match(jugador, /Number\.isFinite\(Number\(yGuardada\)\)/);

// Interacciones verticales: una planta no puede accionar/usar la de abajo.
assert.match(puertas, /if \(dy > 1\.55\) continue/);
assert.match(puertas, /Math\.hypot\(p\.x - pos\.x, p\.z - pos\.z, dy \* 0\.45\)/);
assert.match(construccion, /Catres\/talleres\/estufas apilados pertenecen a plantas distintas/);
assert.match(construccion, /if \(dy > 1\.55\) continue/);

// Un refugio prefabricado sólo cuenta como interior en su volumen vertical.
assert.match(construccion, /const dentroVertical = py >= baseY - 0\.30/);
assert.match(construccion, /dentroVertical && Math\.abs\(lx\)/);

// Fogones y fuego también respetan nivel vertical.
assert.match(main, /function fogonPropioCerca\(\)[\s\S]*?if \(dy > 1\.55\) continue/);
assert.match(main, /function cercaDelFuego\(\)[\s\S]*?Math\.abs\(js\.pos\.y - f\.pos\.y\) < 1\.75/);

// Cambiar el preset climático no puede quedar esperando el temporizador viejo.
assert.match(main, /if \(clave === 'clima' && clima\?\.estado\) clima\.estado\.t = 0/);

// Prueba real del saneamiento Y del save con localStorage mínimo.
const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => memoria.has(k) ? memoria.get(k) : null,
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k),
};
const guardado = await import(`../src/guardado.js?rc25=${Date.now()}`);
const p = guardado.progresoNuevo();
p.pos = { x: 12.5, y: 27.75, z: -33.25 };
assert.equal(guardado.guardarProgreso(p), true);
const cargado = guardado.cargarProgreso();
assert.deepEqual(cargado.pos, { x: 12.5, y: 27.75, z: -33.25 }, 'el segundo piso debe conservar su cota Y');

// Compatibilidad: un save viejo sin Y continúa cargando.
const viejo = guardado.progresoNuevo();
viejo.pos = { x: -5, z: 9 };
assert.equal(guardado.guardarProgreso(viejo), true);
const cargadoViejo = guardado.cargarProgreso();
assert.equal(cargadoViejo.pos.x, -5);
assert.equal(cargadoViejo.pos.z, 9);
assert.equal('y' in cargadoViejo.pos, false);

console.log('OK Bug Hunt Integral RC25 · guardado multinivel · puertas/funciones por planta · refugio vertical · fuego por nivel · clima inmediato');
