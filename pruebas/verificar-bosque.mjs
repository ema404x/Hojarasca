// 1.6: la tala con caída y el rebrote de los tocones.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { escalaRebrote, etapaRebrote, sanearTalados, avanzarRebrote, apurarRebrote, resumenBosque, ETAPAS_REBROTE, DIAS_REBROTE, DIAS_QUE_APURA_UN_RENOVAL } from '../src/bosque.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// etapas
assert.equal(escalaRebrote(0), 0, 'recién talado sólo queda el tocón');
assert.equal(escalaRebrote(1), 0);
assert.equal(escalaRebrote(DIAS_REBROTE), 1, 'a los 9 días el árbol está entero');
assert.equal(escalaRebrote(40), 1);
let previa = -1;
for (const e of ETAPAS_REBROTE) { assert.ok(e.escala > previa, 'las etapas crecen'); previa = e.escala; }
assert.equal(etapaRebrote(0), 'tocón');
assert.equal(etapaRebrote(DIAS_REBROTE), 'árbol');

// saneo: índices inválidos, repetidos y basura
const sane = sanearTalados([{ i: 2, dia: 1 }, { i: 2, dia: 3 }, { i: -1, dia: 1 }, { i: 99, dia: 1 }, { i: 1, dia: 'x' }, null, { i: 0, dia: 0 }], 10);
assert.deepEqual(sane.map((t) => t.i), [2, 0]);
assert.deepEqual(sanearTalados('nada'), []);

// avance de un día al otro
const lista = [{ i: 3, dia: 0, esc: -1 }, { i: 4, dia: 0, esc: -1 }];
const r1 = avanzarRebrote(lista, 0);
assert.deepEqual(r1.cambios, [{ i: 3, esc: 0 }, { i: 4, esc: 0 }]);
assert.equal(r1.quedan.length, 2);
assert.deepEqual(avanzarRebrote(lista, 0).cambios, [], 'sin días nuevos no hay cambios');
assert.equal(avanzarRebrote(lista, 2).cambios.length, 2, 'a los 2 días brotan los dos');
const r2 = avanzarRebrote(lista, DIAS_REBROTE);
assert.deepEqual(r2.adultos, [3, 4]);
assert.equal(r2.quedan.length, 0, 'el árbol adulto sale de la lista');

// plantar un renoval al lado apura el tocón más cercano
const pos = { 3: { x: 0, z: 0 }, 4: { x: 30, z: 0 } };
const lista2 = [{ i: 3, dia: 10, esc: 0 }, { i: 4, dia: 10, esc: 0 }];
assert.equal(apurarRebrote(lista2, (i) => pos[i], 1, 1).i, 3);
assert.equal(lista2[0].dia, 10 - DIAS_QUE_APURA_UN_RENOVAL);
assert.equal(apurarRebrote(lista2, (i) => pos[i], 500, 500), null, 'sin tocón cerca no apura nada');
assert.deepEqual(resumenBosque([{ i: 1, dia: 0 }, { i: 2, dia: 5 }], 9), { rebrotando: 2, listos: 1 });

// cableado con el mundo
const veg = leer('src/vegetacion.js'), main = leer('src/main.js');
assert.match(veg, /function talar\(a, dir\)/, 'talar recibe hacia dónde cae');
for (const f of ['function sacudir', 'function crecer', 'function actualizarCaidas', 'function ponerTocon']) assert.ok(veg.includes(f), `falta ${f} en vegetacion.js`);
assert.match(veg, /return \{ actualizar, actualizarCaidas,/, 'vegetacion exporta actualizarCaidas');
assert.match(main, /veg\.actualizarCaidas\(dt\)/, 'el bucle anima la caída');
assert.match(main, /veg\.sacudir\(o\.arbol\)/, 'cada hachazo sacude el árbol');
assert.match(main, /veg\.talar\(o\.arbol, \{ x: o\.arbol\.x - js2\.pos\.x/, 'el árbol cae para el lado contrario al jugador');
assert.match(main, /anotarTalado\(o\.arbol\)/);
assert.match(main, /revisarRebrote\(true\)/, 'al cargar la partida se aplican los tocones');
assert.match(leer('src/guardado.js'), /renovales: \[\], talados: \[\]/);
console.log('bosque: ok · rebrote completo a los', DIAS_REBROTE, 'días');
