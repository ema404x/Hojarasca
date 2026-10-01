// 1.11 — la cocina: recetas de más de un ingrediente.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { RECETAS_FUEGO, NOMBRE_INGREDIENTE, alcanza, posibles, elegirReceta, textoPide } from '../src/cocina.js';
import { ENTRADA } from '../src/cuaderno.js';
import { TRUEQUE, TRUEQUES } from '../src/trueque.js';
import { RECETAS_RELAX } from '../src/logros-relax.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- la lista
assert.equal(new Set(RECETAS_FUEGO.map((r) => r.id)).size, RECETAS_FUEGO.length);
for (const rc of RECETAS_FUEGO) {
  assert.ok(ENTRADA[rc.id]?.seccion === 'recetas', `${rc.id} no está en el cuaderno`);
  for (const p of rc.pide) assert.ok(NOMBRE_INGREDIENTE[p.k], `${rc.id}: no se sabe nombrar ${p.k}`);
}
// las de siempre siguen iguales
const viejas = { mate: [['yerba', 1]], 'pinones-tostados': [['pinon', 3]], 'dulce-calafate': [['calafate', 4]], 'frutillas-brasas': [['frutilla', 3]], 'papas-rescoldo': [['papa', 3]], 'habas-salteadas': [['haba', 4]] };
for (const [id, pide] of Object.entries(viejas)) {
  assert.deepEqual(RECETAS_FUEGO.find((r) => r.id === id).pide.map((p) => [p.k, p.n]), pide, `${id} cambió de receta`);
}
assert.ok(RECETAS_FUEGO.filter((r) => r.pide.length > 1).length >= 3, 'hay recetas de dos ingredientes');

// ---------------------------------------------------------------- qué alcanza
const con = (entradas = {}, cosas = {}) => (k, cosa) => (cosa ? cosas[k] || 0 : entradas[k] || 0);
const guiso = RECETAS_FUEGO.find((r) => r.id === 'guiso-campo');
assert.equal(alcanza(guiso, con({ papa: 2, haba: 2 })), true);
assert.equal(alcanza(guiso, con({ papa: 2, haba: 1 })), false, 'falta un ingrediente: no');
const torta = RECETAS_FUEGO.find((r) => r.id === 'torta-frita');
assert.equal(alcanza(torta, con({ huevo: 1 }, { harina: 1 })), true, 'la harina se cuenta entre las cosas');
assert.equal(alcanza(torta, con({ huevo: 1, harina: 5 }, {})), false, 'harina juntada no hay: es del almacén');
assert.deepEqual(posibles(con({})).map((r) => r.id), []);

// primero lo que nunca cocinaste
const cuanto = con({ papa: 5, haba: 5 });
assert.equal(elegirReceta(cuanto, () => false).id, 'papas-rescoldo', 'la primera de la lista que alcanza');
assert.equal(elegirReceta(cuanto, (id) => id === 'papas-rescoldo').id, 'habas-salteadas');
assert.equal(elegirReceta(cuanto, (id) => ['papas-rescoldo', 'habas-salteadas'].includes(id)).id, 'guiso-campo', 'y después el guiso');
assert.equal(elegirReceta(cuanto, () => true).id, 'papas-rescoldo', 'si ya cocinaste todo, lo primero');
assert.equal(elegirReceta(con({}), () => false), null);

assert.equal(textoPide(guiso), '2 papas de tu cantero y 2 habas de tu cantero');
assert.equal(textoPide(RECETAS_FUEGO[0]), '1 yerba del almacén');

// ---------------------------------------------------------------- la harina y el logro
assert.equal(TRUEQUE.harina?.repetible, true, 'la harina se gasta: se cambia todas las veces');
assert.match(leer('src/main.js'), /const POR_PAGINA_ALMACEN = 9;/, 'el almacén se elige con los números del 1 al 9, de a nueve por página');
for (const id of ['guiso-campo', 'tortilla-papas', 'torta-frita']) assert.ok(RECETAS_RELAX.includes(id), `la mesa completa pide ${id}`);

// ---------------------------------------------------------------- cableado
const main = leer('src/main.js');
assert.ok(!/^const RECETAS = \[/m.test(main), 'las recetas no quedaron duplicadas en main.js');
assert.match(main, /const rc = elegirReceta\(cuantoCocina, \(id\) => !!progreso\.entradas\[id\]\);/);
assert.match(main, /for \(const p of rc\.pide\) \{\n\s+if \(p\.cosa\) progreso\.cosas\[p\.k\] -= p\.n;\n\s+else progreso\.entradas\[p\.k\]\.cantidad -= p\.n;/, 'se gasta cada ingrediente');

console.log('cocina:', RECETAS_FUEGO.length, 'recetas ·', RECETAS_FUEGO.filter((r) => r.pide.length > 1).length, 'de dos ingredientes · la harina en el almacén');
