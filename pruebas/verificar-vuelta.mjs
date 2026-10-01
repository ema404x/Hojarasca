// 1.10 — Nueva partida+: otra vuelta al Desafío después del nido.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { SE_LLEVA, VUELTA_MAXIMA, multiplicadorVuelta, textoVuelta, puedeOtraVuelta, nuevaVuelta } from '../src/desafio-vuelta.js';
import { composicionOleada, sanearDesafio, desafioNuevo, MEJORAS } from '../src/desafio-reglas.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- más difícil cada vuelta
assert.deepEqual(multiplicadorVuelta(0), { cantidad: 1, vida: 1, dano: 1 }, 'la primera vuelta es la de siempre');
let antes = multiplicadorVuelta(0);
for (let v = 1; v <= VUELTA_MAXIMA; v++) {
  const m = multiplicadorVuelta(v);
  assert.ok(m.cantidad > antes.cantidad && m.vida > antes.vida && m.dano > antes.dano, `la vuelta ${v + 1} es más dura que la anterior`);
  antes = m;
}
assert.deepEqual(multiplicadorVuelta(99), multiplicadorVuelta(VUELTA_MAXIMA), 'con tope');
assert.equal(textoVuelta(0), '', 'en la primera no se dice nada');
assert.equal(textoVuelta(1), 'Vuelta 2');

assert.equal(composicionOleada(10, 'normal', 0).length, composicionOleada(10).length, 'sin vuelta, igual que antes');
assert.ok(composicionOleada(10, 'normal', 1).length > composicionOleada(10).length, 'en la vuelta siguiente vienen más');
assert.ok(composicionOleada(20, 'implacable', 9).length <= 24, 'el techo de invasores por noche se respeta');
assert.equal(composicionOleada(5, 'normal', 2).filter((t) => t === 'jefe').length, 1, 'el jefe sigue siendo uno');

// ---------------------------------------------------------------- cuándo se ofrece
assert.equal(puedeOtraVuelta({ victoria: true, nido: { caido: false } }), false, 'con el nido en pie, no');
assert.equal(puedeOtraVuelta({ victoria: false, nido: { caido: true } }), false);
assert.equal(puedeOtraVuelta({ victoria: true, nido: { caido: true } }), true, 'con el Desafío terminado del todo, sí');
assert.equal(puedeOtraVuelta({ victoria: true, nido: { caido: true }, vuelta: VUELTA_MAXIMA }), false, 'hasta un tope');

// ---------------------------------------------------------------- qué se lleva
const viejo = {
  dia: 31, materiales: { tronco: 90, cristal: 40 }, obras: [{ plano: 'empalizada' }],
  cosas: { hacha: 1, lanza: 1, arco: 1, pistola: 1, lanzaCristal: 1, arcoReforzado: 1, farol: 1 },
  desafio: { victoria: true, nido: { caido: true }, planos: ['escudo', 'faro'], pistolaEncontrada: true, vuelta: 0, noches: 24, abatidos: 300 },
};
const base = { dia: 1, materiales: { tronco: 6, tabla: 6, piedra: 6 }, obras: [], cosas: { hacha: 1 }, desafio: desafioNuevo() };
const nueva = nuevaVuelta(viejo, base);
assert.equal(nueva.dia, 1, 'arranca en el día uno');
assert.deepEqual(nueva.obras, [], 'sin base');
assert.deepEqual(nueva.materiales, base.materiales, 'con el kit de siempre, no con lo juntado');
for (const k of ['lanza', 'arco', 'pistola', 'lanzaCristal', 'arcoReforzado']) assert.equal(nueva.cosas[k], 1, `se lleva ${k}`);
assert.equal(nueva.cosas.farol, undefined, 'lo del almacén no: se lleva lo que ganó peleando');
assert.deepEqual(nueva.desafio.planos, ['escudo', 'faro'], 'se lleva los planos');
assert.equal(nueva.desafio.pistolaEncontrada, true);
assert.equal(nueva.desafio.vuelta, 1);
assert.equal(nueva.desafio.victoria, false, 'hay que volver a ganar');
assert.equal(nueva.desafio.nido, null);
assert.equal(nueva.desafio.noches, 0);
assert.ok(nueva.desafio.tutorial >= 6, 'el tutorial ya lo hiciste');
assert.equal(viejo.desafio.vuelta, 0, 'la partida vieja no se toca');
for (const clave of Object.keys(MEJORAS)) assert.ok(SE_LLEVA.includes(clave), `la mejora ${clave} se tiene que llevar`);
assert.equal(nuevaVuelta({ ...viejo, desafio: { ...viejo.desafio, vuelta: VUELTA_MAXIMA } }, base).desafio.vuelta, VUELTA_MAXIMA);

// sobrevive al saneo del guardado
assert.equal(sanearDesafio(nueva.desafio).vuelta, 1);
assert.equal(sanearDesafio({ vuelta: 'x' }).vuelta, 0);
assert.equal(sanearDesafio({ vuelta: 50 }).vuelta, 9);

// ---------------------------------------------------------------- cableado
const desafio = leer('src/desafio.js'), main = leer('src/main.js'), plantilla = leer('src/plantilla.html');
assert.equal((desafio.match(/composicionOleada\(.*?, (D\(\)|d)\.vuelta\)/g) || []).length, 4, 'las cuatro oleadas saben en qué vuelta están');
assert.match(desafio, /a\.vida = a\.vidaMax = Math\.round\(a\.def\.vida \* mult \* mv\.vida \*/);
assert.match(desafio, /a\.danoMult = mult \* mv\.dano;/);
assert.match(desafio, /if \(d\.vuelta\) texto = `\$\{textoVuelta\(d\.vuelta\)\} · \$\{texto\}`;/, 'el HUD dice en qué vuelta estás');
assert.ok(plantilla.includes('id="victoria-vuelta"') && plantilla.includes('id="btn-vuelta"'));
assert.match(main, /\$\('victoria-vuelta'\)\.classList\.toggle\('oculto', !\(final && puedeOtraVuelta\(progreso\.desafio\)\)\);/, 'sólo en el final del nido');
assert.match(main, /const nueva = nuevaVuelta\(progreso, progresoNuevo\(\)\);\n  reiniciandoPartida = true;/, 'mismo camino que empezar una partida nueva');

console.log('vuelta: ok · se lleva armas, mejoras y planos · cada vuelta +20% invasores, +25% vida, +15% daño · tope', VUELTA_MAXIMA + 1);
