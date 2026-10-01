// 1.11 — el telar: la lana tejida en mantas y ponchos.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { TEJIDOS, queTejer, textoTelar } from '../src/telar.js';
import { ENTRADA } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

assert.equal(queTejer(2, {}), null, 'con dos vellones no alcanza para nada');
assert.equal(queTejer(3, {}), 'poncho', 'con tres, un poncho');
assert.equal(queTejer(4, {}), 'manta', 'con cuatro y sin manta, primero la manta');
assert.equal(queTejer(9, { manta: 1 }), 'poncho', 'con la manta ya hecha, ponchos');
assert.ok(TEJIDOS.manta.unica && !TEJIDOS.poncho.unica);
assert.equal(textoTelar(4, {}), 'Tejer una manta (4 vellones)');
assert.equal(textoTelar(5, { manta: 1 }), 'Tejer un poncho (3 vellones)');
assert.equal(textoTelar(1, {}), 'Telar: hacen falta 3 vellones para un poncho (tenés 1)');
assert.ok(ENTRADA.poncho, 'el poncho va al cuaderno');

const main = leer('src/main.js'), cons = leer('src/construccion.js');
assert.match(cons, /id: 'telar', nombre: 'Telar de palos'/);
assert.match(cons, /funciones: \['tejer'\]/);
assert.match(main, /conMateriales\(\(m\) => \{ m\.lana -= t\.lana; \}\);/, 'la lana sale de la mochila y del acopio, como al construir');
assert.match(main, /if \(!js\.enTren && !js\.enKayak && !objetivo && telarCerca\(\)\) \{ tejer\(\); break; \}/);
assert.ok(main.indexOf('texto: textoTelar(') < main.indexOf('const puertaCerca = !objetivo'), 'el aviso del telar va antes que el de la puerta');
console.log('telar: ok · manta con', TEJIDOS.manta.lana, 'vellones · poncho con', TEJIDOS.poncho.lana);
