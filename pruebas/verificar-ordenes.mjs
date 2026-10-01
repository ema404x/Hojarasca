// 1.11 — órdenes a los compañeros del Desafío.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ORDENES, NOMBRE_ORDEN, RESPUESTAS, RADIO_ARREGLO, ordenInicial, ordenDe, siguienteOrden, sanearOrdenes, puntoDeOrden, centroDeArreglo, portonDeLaBase, velocidadSiguiendo } from '../src/desafio-ordenes.js';
import { COMPANEROS, sanearDesafio } from '../src/desafio-reglas.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- las órdenes
assert.deepEqual(Object.keys(ORDENES).sort(), Object.keys(COMPANEROS).sort(), 'cada compañero tiene sus órdenes');
for (const [clave, lista] of Object.entries(ORDENES)) {
  assert.ok(lista.includes('seguime') && lista.includes('porton'), `${clave}: seguime y portón`);
  for (const o of lista) {
    assert.ok(NOMBRE_ORDEN[o], `${o} sin nombre`);
    assert.ok(RESPUESTAS[clave][o], `${clave} no contesta a ${o}`);
    assert.ok(o in RADIO_ARREGLO, `${o} sin radio de arreglo`);
  }
}
assert.equal(ordenInicial('ramon'), 'reparar', 'Ramón empieza haciendo lo de siempre');
assert.equal(ordenInicial('ema'), 'base', 'Ema también');
assert.equal(ordenDe({}, 'ramon'), 'reparar');
assert.equal(ordenDe({ ramon: 'volar' }, 'ramon'), 'reparar', 'una orden que no es suya no cuenta');
assert.equal(ordenDe({ ema: 'reparar' }, 'ema'), 'base', 'Ema no arregla');
assert.deepEqual(['reparar', 'seguime', 'porton'].map((o) => siguienteOrden('ramon', o)), ['seguime', 'porton', 'reparar'], 'E da la vuelta');
assert.deepEqual(sanearOrdenes({ ramon: 'porton', ema: 'reparar', nadie: 'seguime' }), { ramon: 'porton' });
assert.deepEqual(sanearOrdenes(null), {});
assert.deepEqual(sanearDesafio({ ordenes: { ema: 'seguime' } }).ordenes, { ema: 'seguime' }, 'la orden se guarda');
assert.deepEqual(sanearDesafio(null).ordenes, {}, 'un Desafío de la 1.10 carga con las de siempre');

// ---------------------------------------------------------------- dónde se paran
const base = { x: 0, z: 0 }, puntoB = { x: 3, z: 0 };
const ctx = (i, porton = null, yaw = 0) => ({ base, porton, i, puntoBase: puntoB, jugador: { pos: { x: 50, z: 50 }, yaw } });
assert.deepEqual(puntoDeOrden('reparar', ctx(0)), puntoB);
assert.deepEqual(puntoDeOrden('base', ctx(1)), puntoB);
assert.deepEqual(puntoDeOrden('porton', ctx(0)), puntoB, 'sin portón, en la base');
const s0 = puntoDeOrden('seguime', ctx(0)), s1 = puntoDeOrden('seguime', ctx(1));
// yaw 0: se mira a -z; atrás es +z
assert.ok(s0.z > 50 && s1.z > 50, 'siguiendo, van atrás tuyo');
assert.ok(Math.abs(s0.x - s1.x) > 2, 'cada uno de un lado');
const pt = puntoDeOrden('porton', ctx(0, { x: 0, z: 20 }));
assert.ok(pt.z < 20 && pt.z > 15, 'del lado de adentro del portón');
assert.deepEqual(centroDeArreglo('seguime', ctx(0)), { x: 50, z: 50 }, 'siguiendo arregla cerca tuyo');
assert.deepEqual(centroDeArreglo('porton', ctx(0, { x: 0, z: 20 })), { x: 0, z: 20 });
assert.deepEqual(centroDeArreglo('reparar', ctx(0)), base);
assert.deepEqual(portonDeLaBase([{ x: 40, z: 0 }, { x: 0, z: 12 }], base), { x: 0, z: 12 }, 'el portón más cercano');
assert.equal(portonDeLaBase([], base), null);
assert.ok(velocidadSiguiendo(20) > velocidadSiguiendo(6) && velocidadSiguiendo(6) > velocidadSiguiendo(2), 'si quedó lejos, apura');

// ---------------------------------------------------------------- cableado
const aliados = leer('src/desafio-aliados.js');
assert.match(aliados, /const orden = ordenDe\(api\.D\(\)\.ordenes, clave\);/);
assert.match(aliados, /const obra = radio \? api\.obraMasDanada\(centroDeArreglo\(orden, ctxO\), radio\) : null;/, 'Ramón arregla donde le toca');
// 2.6: con "quedate en la base" y un puesto de tirador, el punto es el puesto
assert.match(aliados, /if \(c\.tMover <= 0\) \{ c\.tMover = 0\.4; irA\(npc, puesto \|\| puntoDeOrden\(orden, contextoOrden\(1\)\), orden\); \}\n\s+if \(!nocheActiva \|\| c\.t > 0\) continue;/, 'Ema se mueve de día y tira de noche');
assert.match(leer('src/desafio.js'), /portones: \(\) => obras\.obras\.filter\(\(o\) => o\.plano\.porton && completa\(o\)\)/);
const main = leer('src/main.js');
assert.match(main, /if \(vecino && desafio && vecino\.enBase\) \{ ordenarCompanero\(vecino\); break; \}\n\s+if \(vecino\) \{ hablar\(vecino\); break; \}/, 'E ordena en el Desafío');
assert.match(main, /else if \(vecino && desafio && vecino\.enBase\) aviso = \{ tecla: 'E', texto: textoOrdenar\(vecino\) \};\n\s+else if \(vecino\) aviso/, 'y el aviso lo dice');

console.log('órdenes:', Object.entries(ORDENES).map(([k, l]) => `${k} (${l.join(', ')})`).join(' · '));
