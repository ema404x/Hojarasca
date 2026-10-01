// 1.10 — tormentas y crecidas: el clima toca el valle.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  CRECIDA, RAYO, tormentaNueva, sanearTormenta, avanzarCrecida, nivelArroyo, aguaTurbia,
  esperaPorCrecida, horasEntre, puedeCaerRayo, elegirArbolRayo, rumboTexto,
} from '../src/tormenta.js';
import { ENTRADA } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- la crecida
let c = 0;
c = avanzarCrecida(c, 0.3, 5);
assert.equal(c, 0, 'garúa no hace crecer nada');
c = avanzarCrecida(c, 0.8, CRECIDA.horasParaLlenar / 2);
assert.ok(Math.abs(c - 0.5) < 1e-9, 'con lluvia fuerte sube de a poco');
c = avanzarCrecida(c, 0.8, 99);
assert.equal(c, 1, 'y no pasa del tope');
const bajando = avanzarCrecida(1, 0, CRECIDA.horasParaBajar / 2);
assert.ok(bajando > 0.45 && bajando < 0.55, 'cuando para, baja mucho más despacio que lo que subió');
assert.equal(avanzarCrecida(1, 0, CRECIDA.horasParaBajar), 0, 'en casi un día vuelve a su cauce');
assert.ok(CRECIDA.horasParaBajar > CRECIDA.horasParaLlenar * 2);

assert.equal(nivelArroyo(0), 0);
assert.ok(Math.abs(nivelArroyo(1) - CRECIDA.subidaMaxima) < 1e-9);
assert.ok(nivelArroyo(0.5) > CRECIDA.subidaMaxima / 2, 'sube rápido al principio');
assert.equal(aguaTurbia(0.2), false);
assert.equal(aguaTurbia(0.5), true);

assert.equal(esperaPorCrecida(0.1, false), 1, 'agua clara: nada cambia');
assert.ok(esperaPorCrecida(0.9, false) > 2, 'arroyo turbio: no pica nada');
assert.ok(esperaPorCrecida(0.9, true) < 1, 'en el lago, con la crecida, comen mejor');

assert.equal(horasEntre(10, 12.5), 2.5);
assert.equal(horasEntre(23, 1), 2, 'la medianoche no rompe la cuenta');

// ---------------------------------------------------------------- el rayo
assert.equal(puedeCaerRayo({ tormenta: false, dia: 3, diaRayo: -1 }), false, 'sin tormenta no hay rayo');
assert.equal(puedeCaerRayo({ tormenta: true, dia: 3, diaRayo: -1 }), true);
assert.equal(puedeCaerRayo({ tormenta: true, dia: 3, diaRayo: 3 }), false, 'uno por día como mucho');
assert.equal(puedeCaerRayo({ tormenta: true, dia: 4, diaRayo: 3, rayoPendiente: true }), false, 'si hay uno tirado sin hachar, no cae otro');

const pos = { x: 0, z: 0 };
const arboles = [
  { x: 10, z: 0, especie: 'coihue', esc: 1 },          // 0: muy cerca
  { x: 60, z: 0, especie: 'pehuen', esc: 3 },          // 1: pehuén, nunca
  { x: 0, z: 80, especie: 'coihue', esc: 1, sacado: true }, // 2: ya talado
  { x: -70, z: 0, especie: 'lenga', esc: 1 },          // 3: candidato
  { x: 300, z: 0, especie: 'coihue', esc: 1 },         // 4: muy lejos
  { x: 0, z: -90, especie: 'coihue', esc: 1, caido: true }, // 5: ya caído
];
for (let k = 0; k < 20; k++) assert.equal(elegirArbolRayo(arboles, pos, () => k / 20), 3, 'sólo el que está a la vista, en pie y no es pehuén');
assert.equal(elegirArbolRayo([arboles[1], arboles[0]], pos), null, 'si no hay a quién, no cae');
// los altos tienen más chance
const dos = [{ x: 50, z: 0, especie: 'coihue', esc: 3 }, { x: -50, z: 0, especie: 'coihue', esc: 1 }];
let altos = 0;
for (let k = 0; k < 100; k++) if (elegirArbolRayo(dos, pos, () => (k + 0.5) / 100) === 0) altos++;
assert.ok(altos >= 70 && altos <= 80, `el alto sale tres de cada cuatro (${altos}/100)`);

assert.equal(rumboTexto({ x: 0, z: 0 }, { x: 0, z: -80 }), 'a 80 m al norte', 'el norte es -z, como en el mapa');
assert.equal(rumboTexto({ x: 0, z: 0 }, { x: 57, z: 57 }), 'a 80 m al sureste');

// ---------------------------------------------------------------- saneo
assert.deepEqual(sanearTormenta(null), tormentaNueva());
const s = sanearTormenta({ crecida: 7, diaRayo: '4', rayo: { i: 12, dia: 4, dx: 1, dz: 0 } }, 10);
assert.equal(s.crecida, 1);
assert.equal(s.diaRayo, 4);
assert.equal(s.rayo, null, 'un árbol que no existe no queda tirado');
assert.equal(sanearTormenta({ rayo: { i: 3, dia: 4 } }, 10).rayo.i, 3);
assert.equal(sanearTormenta({ rayo: { i: 1.5 } }, 10).rayo, null);

// ---------------------------------------------------------------- cableado
const main = leer('src/main.js'), veg = leer('src/vegetacion.js');
assert.ok(ENTRADA.rayo && ENTRADA.rayo.seccion === 'cielo', 'el rayo va al cuaderno, en el cielo');
assert.match(veg, /function derribarPorRayo\(a, dir, inmediato = false\)/);
assert.match(veg, /if \(an\.modo === 'rayo'\) \{ if \(an\.t > DUR_CAIDA \+ 1\) an\.quieto = true; continue; \}/, 'el del rayo no se descarta a los cinco segundos: queda en el suelo');
assert.match(veg, /if \(a\.caido\) \{\n\s+const i = animados\.findIndex/, 'el hacha retira el árbol tirado en vez de volver a voltearlo');
assert.match(main, /if \(o\.caido\) \{ veg\.talar\(o\.arbol\); anotarTalado\(o\.arbol\); \}/, 'el tocón del rayo rebrota como cualquier talado');
assert.match(main, /agua = await paso\('Llenando el lago', 30, \(\) => crearAgua\(T, escena\)\);/);
assert.match(main, /agua\.arroyo\.position\.y = nivelArroyo\(st\.crecida\)/, 'el arroyo sube de verdad');
assert.match(main, /if \(!a \|\| a\.sacado \|\| !veg\.derribarPorRayo\(a, \{ x: r\.dx, z: r\.dz \}, true\)\) progreso\.tormenta\.rayo = null;/, 'al cargar, el árbol vuelve a estar tirado');
assert.match(main, /ctxPesca\.crecida = progreso\.tormenta\?\.crecida \|\| 0;/);
assert.match(leer('src/pesca.js'), /if \(\(mundo\.crecida \|\| 0\) >= 0\.4\) espera \*= aguaHit\.lago \? 0\.8 : 3;/);
assert.match(leer('src/guardado.js'), /tormenta: sanearTormenta\(p\.tormenta\)/);

console.log('tormenta: ok · el arroyo sube', CRECIDA.subidaMaxima, 'm · un rayo por día como mucho, nunca a un pehuén ·', RAYO.troncos, 'troncos');
