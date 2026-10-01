// 1.10 — el caballo: el zaino de Don Ramón.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { MARCHA_CABALLO, ALTURA_MONTADO, AGUA_QUE_NO_PISA, caballoNuevo, sanearCaballo, palenque, dondeEspera, yawCaballo, marcha } from '../src/caballo.js';
import { VELOCIDAD } from '../src/config.js';
import { ENCARGO, estadoEncargo } from '../src/encargos.js';
import { ENTRADA } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- andar
assert.ok(MARCHA_CABALLO.trote > VELOCIDAD.caminar && MARCHA_CABALLO.trote < VELOCIDAD.correr * 1.1, 'al trote, más que caminando');
assert.ok(MARCHA_CABALLO.galope > VELOCIDAD.correr * 1.5, 'al galope, bastante más que corriendo');
assert.ok(ALTURA_MONTADO > 0.5, 'arriba del caballo se ve más lejos');
assert.ok(AGUA_QUE_NO_PISA < 1.4, 'el caballo se planta antes de que haya que nadar');
assert.equal(marcha(0).modo, 'quieto');
assert.equal(marcha(2).modo, 'paso');
assert.equal(marcha(MARCHA_CABALLO.trote).modo, 'trote');
assert.equal(marcha(MARCHA_CABALLO.galope).modo, 'galope');

// el caballo mira para donde mira el jinete
assert.ok(Math.abs(yawCaballo(0) - Math.PI) < 1e-9);
assert.ok(Math.abs(yawCaballo(1) - 1 - Math.PI) < 1e-9);

// ---------------------------------------------------------------- dónde espera
const ref = { x: 100, z: 50, puerta: { x: 100, z: 44 }, mira: 0 };
const pal = palenque(ref);
assert.ok(Math.hypot(pal.x - ref.puerta.x, pal.z - ref.puerta.z) > 3.5, 'el palenque no tapa la puerta');
assert.ok(Math.hypot(pal.x - ref.puerta.x, pal.z - ref.puerta.z) < 6.5, 'pero está a mano');
assert.ok(pal.z < ref.puerta.z, 'hacia afuera del refugio (el que sale mira hacia -z)');
assert.deepEqual(dondeEspera(caballoNuevo(), ref), pal, 'si nunca lo moviste, está en el palenque');
assert.deepEqual(dondeEspera({ x: 3, z: 4, yaw: 1 }, ref), { x: 3, z: 4, yaw: 1 }, 'si lo dejaste en otro lado, está ahí');

// ---------------------------------------------------------------- saneo
assert.deepEqual(sanearCaballo(null), caballoNuevo());
assert.deepEqual(sanearCaballo({ x: 'a', z: 3 }), caballoNuevo(), 'una posición rota vuelve al palenque');
assert.deepEqual(sanearCaballo({ x: 9e9, z: 0 }, 500), caballoNuevo(), 'fuera del mapa, al palenque');
assert.deepEqual(sanearCaballo({ x: 10, z: -20, yaw: 2 }, 500), { x: 10, z: -20, yaw: 2 });

// ---------------------------------------------------------------- el encargo
const e = ENCARGO['e-caballo'];
assert.ok(e && e.quien === 'ramon');
assert.deepEqual(e.requiere, ['e-lugares'], 'te lo presta cuando ya caminaste el valle');
assert.equal(estadoEncargo({ encargos: {}, entradas: {} }, e), 'trabado');
assert.equal(estadoEncargo({ encargos: { 'e-lugares': 'hecho' }, entradas: {} }, e), 'disponible');
assert.equal(e.cumplido({ materiales: { lana: 1 }, acopio: {} }), false);
assert.equal(e.cumplido({ materiales: { lana: 1 }, acopio: { lana: 1 } }), true, 'la lana del acopio cuenta');
assert.equal(e.premio.cosa, 'caballo');
assert.ok(ENTRADA.caballo && ENTRADA['e-caballo'], 'el zaino y su encargo en el cuaderno');

// ---------------------------------------------------------------- cableado
const jug = leer('src/jugador.js'), main = leer('src/main.js');
assert.match(jug, /montado: null,/, 'a pie, el jugador no está montado');
assert.match(jug, /if \(estado\.montado && \(code === 'KeyC' \|\| code === 'ControlLeft' \|\| code === 'Space'\)\) return;/, 'a caballo no se agacha ni se salta');
assert.match(jug, /vmax = estado\.corriendo \? estado\.montado\.galope : estado\.montado\.trote;/);
assert.match(jug, /if \(hondo && hondo\.prof > estado\.montado\.aguaMax\) \{/, 'no entra al agua honda');
assert.match(jug, /const radioFisico = estado\.montado \? 0\.6 : 0\.35;/, 'el caballo ocupa más: por una puerta angosta no pasa');
// a pie nada cambia: las líneas de antes siguen intactas en su rama
assert.match(jug, /: estado\.agachado \? ALTURA_AGACHADO : ALTURA_OJOS;/);
assert.match(main, /if \(js\.montado\) \{ desmontar\(\); break; \}/, 'montado, E baja');
assert.match(main, /if \(!objetivo && caballoCerca\(\)\) \{ montar\(\); break; \}/, 'y al lado, E sube');
// 2.4.1: hablando arriba del caballo, E sigue la charla: el aviso no pisa eso
assert.match(main, /if \(js\.montado && !charla\.npc\) aviso = vecino \?/, 'montado, el aviso dice lo mismo que hace E');
assert.match(main, /js\.montado \|\| vecino\) objetivo = null;/, 'desde la montura no se junta nada');
assert.match(main, /if \(js\.montado\) sonido\.casco\?\.\(js\.superficie, f\);/, 'arriba del caballo suenan cascos, no pasos');
assert.match(main, /caballoMundo = esDesafio \? null : crearCaballo\(T, escena\);/, 'sólo en el Relax');
assert.match(leer('src/sonido.js'), /casco\(superficie, fuerza = 0\.8\) \{/);
assert.match(leer('src/guardado.js'), /caballo: sanearCaballo\(p\.caballo, LIMITE\)/);

console.log('caballo: ok · trote', MARCHA_CABALLO.trote, 'm/s · galope', MARCHA_CABALLO.galope, 'm/s · no entra al agua honda · sólo en el Relax');
