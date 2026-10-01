// 1.11 — pedidos de fotos por correo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { CARTAS, CARTA, PEDIDOS, correoNuevo, sanearCorreo, repartir, pedidosAbiertos, fotoParaPedidos, porEnviar, enviarFoto, partesDeEnvio, dePara } from '../src/correo.js';
import { TRUEQUE } from '../src/trueque.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
// fotos.js importa three: los ids de los desafíos se leen del fuente
const DESAFIOS = new Set([...leer('src/fotos.js').matchAll(/\{ id: '(f-[a-z]+)'/g)].map((m) => m[1]));

// ---------------------------------------------------------------- los pedidos
assert.ok(PEDIDOS.length >= 5, 'hay pedidos de fotos');
assert.equal(new Set(PEDIDOS.map((c) => c.foto)).size, PEDIDOS.length, 'cada uno pide una foto distinta');
for (const c of PEDIDOS) {
  assert.ok(DESAFIOS.has(c.foto), `${c.id} pide ${c.foto}, que no es un desafío del álbum`);
  assert.ok(c.gracias, `${c.id}: Ercilia no dice nada al mandarla`);
  for (const k of Object.keys(c.premio?.cuenta || {})) assert.ok(TRUEQUE[k] || k === 'poncho', `${c.id}: ${k} no se cuenta`);
}
assert.equal(CARTA['c-vuelta'].foto, 'f-atardecer', 'tu hermana pedía una foto del lago: ahora se puede mandar');
// los pedidos van al final: las cartas de la 1.10 siguen llegando en el mismo orden
const primeros = CARTAS.findIndex((c) => c.id === 'c-revista');
assert.ok(CARTAS.slice(0, primeros).every((c) => !c.foto || c.id === 'c-vuelta'));

// ---------------------------------------------------------------- llegan cuando tienen sentido
const p = { entradas: {}, obras: [], encargos: {}, vueltas: 0, desafios: {} };
const k = correoNuevo();
for (let d = 1; d <= 30; d++) repartir(k, p, d);
assert.equal(k.llegadas['c-revista'], undefined, 'la revista espera a que saques fotos');
p.desafios = { 'f-pudu': {}, 'f-zorro': {}, 'f-luna': {} };
p.entradas['c-ramal'] = {};
let llego = [];
for (let d = 31; d <= 40; d++) { const c = repartir(k, p, d); if (c) llego.push(c.id); }
assert.ok(llego.includes('c-revista') && llego.includes('c-almanaque'), `llegaron ${llego}`);
assert.ok(!llego.includes('c-amalia'), 'Amalia espera la lana');
assert.ok(!llego.includes('c-condores'), 'el naturalista espera haber escrito y el cóndor');

// ---------------------------------------------------------------- la foto
assert.deepEqual(pedidosAbiertos(k, p), [], 'sin leer la carta no hay pedido');
p.entradas['c-revista'] = {};
assert.deepEqual(pedidosAbiertos(k, p).map((c) => c.id), ['c-revista']);
assert.deepEqual(fotoParaPedidos(k, p, ['f-zorro'], 41), [], 'otra foto no sirve');
assert.deepEqual(fotoParaPedidos(k, p, ['f-huemul', 'f-cordillera'], 41).map((c) => c.id), ['c-revista'], 'aunque el huemul ya estuviera en el álbum');
assert.deepEqual(pedidosAbiertos(k, p), [], 'ya tiene su foto');
assert.deepEqual(porEnviar(k).map((c) => c.id), ['c-revista']);
assert.deepEqual(fotoParaPedidos(k, p, ['f-huemul'], 42), [], 'una sola foto por pedido');
const partes = partesDeEnvio(CARTA['c-revista']);
assert.match(partes[0], /¿Es la foto para la revista Patagonia Viva/);
assert.equal(partes[1], CARTA['c-revista'].gracias);
assert.equal(enviarFoto(k, 'c-revista'), true);
assert.equal(enviarFoto(k, 'c-revista'), false, 'se manda una vez');
assert.deepEqual(porEnviar(k), []);
assert.equal(dePara(CARTA['c-casa']), 'tu hermana, desde Buenos Aires');

// ---------------------------------------------------------------- guardado
const s = sanearCorreo({ llegadas: {}, fotos: { 'c-revista': { dia: '41', enviada: 1 }, 'c-casa': { dia: 2 }, 'c-falsa': { dia: 1 } } });
assert.deepEqual(s.fotos, { 'c-revista': { dia: 41, enviada: true } }, 'sólo pedidos que existen');
assert.deepEqual(sanearCorreo({ llegadas: {} }).fotos, {}, 'una partida de la 1.10 carga sin fotos');

// ---------------------------------------------------------------- cableado
const main = leer('src/main.js');
assert.match(main, /const vistos = fotos\.evaluar\(\{/);
assert.match(main, /const nuevos = vistos\.filter\(\(id\) => !progreso\.desafios\[id\]\);/, 'el álbum sigue anotando sólo lo nuevo');
assert.match(main, /fotoParaPedidos\(correo\(\), progreso, vistos, progreso\.dia\)/, 'la carta mira todo lo que se ve');
assert.match(main, /else if \(carta\) \{[^\n]*\}\n\s+else if \(envio\) \{ charla\.historia = \{ id: 'envio-foto'/, 'Ercilia primero da las cartas y después recibe fotos');
assert.match(main, /if \(!c \|\| !enviarFoto\(correo\(\), id\)\) return;/, 'se cobra una vez');

console.log('pedidos de fotos:', PEDIDOS.length, 'cartas piden fotos del álbum ·', PEDIDOS.map((c) => c.foto).join(', '));
