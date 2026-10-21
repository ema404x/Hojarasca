// 1.11 — rastrear con el perro.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { RASTREO, RASTREABLES, nombreRastro, mirandoAlPerro, elegirPresa, seguirPresa, destinoRastro, estadoRastro } from '../src/rastreo.js';
import { ENTRADA } from '../src/cuaderno.js';
import { antes, que } from './ayuda-interacciones.mjs';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const s = (tipo, x, z) => ({ tipo, pos: { x, z } });

// ---------------------------------------------------------------- mirar al perro
// adelante es (-sin yaw, -cos yaw): con yaw 0 se mira hacia -z
assert.equal(mirandoAlPerro({ pos: { x: 0, z: 0 }, yaw: 0 }, { x: 0, z: -2 }), true);
assert.equal(mirandoAlPerro({ pos: { x: 0, z: 0 }, yaw: 0 }, { x: 0, z: 2 }), false, 'de espaldas, no');
assert.equal(mirandoAlPerro({ pos: { x: 0, z: 0 }, yaw: 0 }, { x: 2, z: -0.2 }), false, 'de costado, no');
assert.equal(mirandoAlPerro({ pos: { x: 0, z: 0 }, yaw: Math.PI / 2 }, { x: -2, z: 0 }), true);
assert.equal(mirandoAlPerro({ pos: { x: 0, z: 0 }, yaw: 0 }, { x: 0, z: -RASTREO.cerca - 1 }), false, 'lejos, no');

// ---------------------------------------------------------------- elegir
const aca = { x: 0, z: 0 };
assert.equal(elegirPresa([], aca), null);
assert.equal(elegirPresa([s('pudu', 10, 0)], aca), null, 'muy cerca: eso ya lo marca solo');
assert.equal(elegirPresa([s('pudu', 400, 0)], aca), null, 'fuera del olfato');
assert.equal(elegirPresa([s('condor', 60, 0), s('pato', 50, 0)], aca), null, 'los que vuelan o nadan no dejan rastro');
assert.equal(elegirPresa([s('pudu', 90, 0), s('zorro', 40, 0)], aca).tipo, 'zorro', 'el más cercano');
assert.equal(elegirPresa([s('pudu', 90, 0), s('zorro', 40, 0)], aca, (t) => t === 'zorro').tipo, 'pudu', 'primero el que no anotaste');
assert.equal(elegirPresa([s('zorro', 40, 0)], aca, () => true).tipo, 'zorro', 'si ya anotaste todo, igual rastrea');
for (const t of RASTREABLES) assert.notEqual(nombreRastro(t), 'algo', `falta el nombre de ${t}`);

// ---------------------------------------------------------------- seguir
const r = elegirPresa([s('huemul', 100, 0)], aca);
assert.equal(seguirPresa(r, [s('huemul', 110, 5), s('huemul', 300, 0)]), true);
assert.deepEqual([r.x, r.z], [110, 5], 'sigue al mismo, el de más cerca de donde estaba');
assert.equal(seguirPresa(r, [s('huemul', 300, 0), s('zorro', 110, 5)]), false, 'se fue o era otro: se pierde');

// el perro va un tramo por delante y te espera si te quedás
const d1 = destinoRastro({ x: 0, z: 0 }, { x: 0, z: 3 }, { x: 100, z: 0 });
assert.equal(d1.esperar, false);
assert.deepEqual([Math.round(d1.x), Math.round(d1.z)], [RASTREO.adelante, 0]);
assert.equal(destinoRastro({ x: 0, z: 0 }, { x: 0, z: RASTREO.espera + 2 }, { x: 100, z: 0 }).esperar, true);

assert.equal(estadoRastro({ x: 5, z: 0, t: 0 }, { x: 0, z: 0 }, true), 'encontrado');
assert.equal(estadoRastro({ x: 50, z: 0, t: 0 }, { x: 0, z: 0 }, true), 'sigue');
assert.equal(estadoRastro({ x: 50, z: 0, t: RASTREO.dura + 1 }, { x: 0, z: 0 }, true), 'frio');
assert.equal(estadoRastro({ x: 50, z: 0, t: 0 }, { x: 0, z: 0 }, false), 'perdido');

// ---------------------------------------------------------------- cableado
assert.equal(ENTRADA.rastreo?.seccion, 'fauna');
const perro = leer('src/perro.js');
assert.match(perro, /\} else if \(mundo\?\.rastro\) \{/, 'el perro sabe rastrear');
assert.match(perro, /mundo\?\.ataque\) \{[\s\S]*mundo\?\.rastro/, 'atacar va antes que rastrear');
const main = leer('src/main.js');
assert.match(main, /return !desafio && !rastro && /, 'sólo en el Relax');
// aviso y tecla E en el mismo orden: el perro después de las puertas
// (4.6.1: desde la 4.6.1 las dos salen de la misma tabla, src/interacciones.js)
antes('puerta', 'dejar-rastro'); antes('puerta', 'pedir-rastro');
{ const r = que({ puertaCerca: { objetivo: 0, nombre: 'la puerta' }, puedoPedirRastro: true }); assert.equal(r.avisoId, 'puerta', 'aviso: puertas antes que el perro'); assert.equal(r.e, 'puerta', 'tecla E: puertas antes que el perro'); }
{ const r = que({ puedoPedirRastro: true }); assert.equal(r.texto, 'Pedirle al perro que rastree'); assert.deepEqual(r.hechos, ['pedirRastro']); }
{ const r = que({ rastro: {}, mirandoAlPerro: true }); assert.equal(r.texto, 'Dejar el rastro'); assert.deepEqual(r.hechos, ['dejarRastro']); }
assert.notEqual(que({ rastro: {}, mirandoAlPerro: true, desafio: {}, usarDesafioCerca: false }).e, 'dejar-rastro', 'en el Desafío, el rastro no se deja con E');
assert.match(main, /rastrosFauna\.push\(pisadaRastro\)/, 'en la nieve se ven las pisadas');
assert.match(leer('src/guardado.js'), /rastreos: Math\.max\(0, Math\.floor\(finito\(p\.rastreos, 0\)\)\)/);

console.log('rastreo:', RASTREABLES.length, 'animales de a pie · olfato', RASTREO.radio, 'm · se enfría a los', RASTREO.dura, 's');
