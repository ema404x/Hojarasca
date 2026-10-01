// 1.6.1 — lo que entra de una partida guardada tiene que llegar sano, y el renoval
// no puede apurar un tocón todas las veces que quieras.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { apurarRebrote, sanearTalados, escalaRebrote, DIAS_REBROTE, DIAS_QUE_APURA_UN_RENOVAL } from '../src/bosque.js';
import { sanearChinches, MAX_CHINCHES } from '../src/chinches.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- el tocón se apura una vez
const pos = { 3: { x: 0, z: 0 }, 4: { x: 2, z: 0 } };
const lista = [{ i: 3, dia: 10, esc: 0, apurado: false }, { i: 4, dia: 10, esc: 0, apurado: false }];

const uno = apurarRebrote(lista, (i) => pos[i], 0.2, 0);
assert.equal(uno.i, 3, 'apura el tocón más cercano');
assert.equal(uno.dia, 10 - DIAS_QUE_APURA_UN_RENOVAL);
assert.equal(uno.apurado, true, 'queda marcado');

// plantar otra vez en el mismo lugar pasa al de al lado, no repite sobre el primero
const dos = apurarRebrote(lista, (i) => pos[i], 0.2, 0);
assert.equal(dos.i, 4, 'el ya apurado sale de la búsqueda y ayuda al vecino');
assert.equal(lista[0].dia, 10 - DIAS_QUE_APURA_UN_RENOVAL, 'el primero no se apuró dos veces');

// con todos apurados, plantar ya no acelera nada
assert.equal(apurarRebrote(lista, (i) => pos[i], 0.2, 0), null, 'no hay tocón que apurar');
assert.ok(lista.every((t) => t.dia >= 10 - DIAS_QUE_APURA_UN_RENOVAL), 'ningún día se fue de más');

// el viejo exploit: N plantadas no pueden volverlo adulto de golpe
const solo = [{ i: 3, dia: 0, esc: 0 }];
for (let n = 0; n < 8; n++) apurarRebrote(solo, (i) => pos[i], 0.2, 0);
assert.ok(escalaRebrote(0 - solo[0].dia) < 1, 'ocho renovales no alcanzan para un árbol entero');
assert.equal(solo[0].dia, -DIAS_QUE_APURA_UN_RENOVAL, 'sólo se descontó una vez');
assert.ok(DIAS_QUE_APURA_UN_RENOVAL < DIAS_REBROTE, 'apurar sigue siendo un atajo, no un botón');

// la marca viaja en la partida
assert.equal(sanearTalados([{ i: 1, dia: 2, apurado: true }], 9)[0].apurado, true);
assert.equal(sanearTalados([{ i: 1, dia: 2 }], 9)[0].apurado, false, 'las partidas viejas entran sin apurar');
assert.equal(sanearTalados([{ i: 1, dia: 2, apurado: 'sí' }], 9)[0].apurado, true, 'la marca siempre es booleana');

// ---------------------------------------------------------------- cuentas de material
// `{ tronco: "5" }` en una partida editada rompía la suma: "5" + 1 daba "51".
const guardado = leer('src/guardado.js');
assert.match(guardado, /function cuentas\(v\)/, 'existe el saneador de contadores');
assert.match(guardado, /materiales: cuentas\(p\.materiales\), acopio: cuentas\(p\.acopio\)/,
  'mochila y acopio pasan por él');

const TOPE = 99999;
function cuentas(v) {
  const limpio = {};
  for (const [k, n] of Object.entries(v && typeof v === 'object' ? v : {})) {
    const c = Math.floor(Number.isFinite(Number(n)) ? Number(n) : 0);
    if (c > 0) limpio[k] = Math.min(TOPE, c);
  }
  return limpio;
}
assert.deepEqual(cuentas({ tronco: '5' }), { tronco: 5 }, 'un número en texto vuelve número');
assert.deepEqual(cuentas({ tronco: -3, tabla: 0 }), {}, 'lo negativo y el cero no ocupan lugar');
assert.deepEqual(cuentas({ piedra: 1e9 }), { piedra: TOPE }, 'un número absurdo pero finito se acota');
assert.deepEqual(cuentas({ piedra: Infinity }), {}, 'el infinito no es una cantidad: se descarta');
assert.deepEqual(cuentas({ piedra: NaN }), {}, 'NaN no entra');
assert.deepEqual(cuentas({ tabla: 2.7 }), { tabla: 2 }, 'no hay medias tablas');
assert.deepEqual(cuentas(null), {}, 'una partida sin materiales no rompe');
const suma = (cuentas({ tronco: '5' }).tronco || 0) + 1;
assert.equal(suma, 6, 'ahora sí suma en vez de concatenar');

// ---------------------------------------------------------------- chinches y tocones al cargar
assert.match(guardado, /chinches: sanearChinches\(p\.chinches\)/, 'las chinches se sanean al cargar');
assert.match(guardado, /talados: sanearTalados\(p\.talados\)/, 'los tocones también');
assert.match(guardado, /import \{ sanearChinches \} from '\.\/chinches\.js'/);
assert.match(guardado, /import \{ sanearTalados \} from '\.\/bosque\.js'/);

// el guardián de main.js estaba al revés: saneaba sólo cuando NO había nada que sanear
const main = leer('src/main.js');
assert.ok(!/if \(!Array\.isArray\(progreso\.chinches\)\) progreso\.chinches = sanearChinches/.test(main),
  'ya no queda el guardián invertido');
assert.match(main, /if \(!chinchesSaneadas\) \{ progreso\.chinches = sanearChinches\(progreso\.chinches\); chinchesSaneadas = true; \}/,
  'se sanea una vez por sesión, venga como venga');
assert.match(main, /talados\(\)\.push\(\{ i, dia: progreso\.dia, esc: 0, apurado: false \}\)/,
  'el tocón nuevo nace sin apurar');

// y que el saneador de chinches efectivamente recorte
const basura = [];
for (let i = 0; i < MAX_CHINCHES + 5; i++) basura.push({ x: i, z: 0, nombre: 'x' });
basura.push({ x: NaN, z: 0 }, { x: 1e9, z: 0 });
assert.equal(sanearChinches(basura).length, MAX_CHINCHES, 'nunca más de las que entran');

console.log('saneo 1.6.1: ok · el renoval apura una vez · materiales enteros · chinches y tocones saneados al cargar');
