import fs from 'fs';
import assert from 'assert/strict';
import {
  iniciarFrameEcosistema, publicarAnimal, animalMasCercano,
  destinoEscapeConCobertura, intensidadInteraccionPredadorPresa,
} from '../src/ecosistema.js';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const vida = leer('../src/vida.js');
const bichos = leer('../src/bichos.js');
const huellas = leer('../src/huellas.js');
const flotantes = leer('../src/flotantes.js');
const main = leer('../src/main.js');

// La red conserva un frame anterior: vida.js puede leer liebres de la pasada previa
// aunque bichos.js se actualice después en el frame actual.
iniciarFrameEcosistema();
publicarAnimal('liebre', 'l-1', { x: 4, y: 0, z: 0 }, { vel: 2 });
assert.equal(animalMasCercano('liebre', { x: 0, z: 0 }, 10)?.id, 'l-1');
iniciarFrameEcosistema();
assert.equal(animalMasCercano('liebre', { x: 0, z: 0 }, 10)?.id, 'l-1', 'el frame anterior debe seguir disponible');

const intensidad = intensidadInteraccionPredadorPresa({ x: 0, z: 0 }, { x: 6, z: 0 }, 24);
assert.ok(intensidad > 0.7 && intensidad < 0.8, 'la intensidad predador-presa debe caer con distancia');

// Ruta de huida: debe evitar agua/pendiente y premiar cobertura si hay una alternativa razonable.
const T = {
  bosque: [0.05, 0.95], estepa: [0.9, 0.05],
  indice: (x) => x > 0 ? 1 : 0,
  agua: () => false,
  normal: () => ({ x: 0, y: 1, z: 0 }),
};
const escape = destinoEscapeConCobertura(T, { x: 0, z: 0 }, { x: 0, z: -8 }, { radio: 18, muestras: 11, preferirCobertura: 1, evitarEstepa: 0.8 });
assert.ok(escape, 'debe encontrar una ruta de escape');
assert.ok(escape.bosque > 0.5, 'el huemul debe poder favorecer cobertura boscosa');

// Integración real entre módulos.
assert.match(main, /iniciarFrameEcosistema\(\)/);
assert.match(vida, /animalMasCercano\('liebre'/);
assert.match(vida, /estado = 'cazar'/);
assert.match(vida, /destinoEscapeConCobertura\(T, a\.pos/);
assert.match(vida, /coberturaEscape: 0\.82/);
assert.match(bichos, /animalMasCercano\('zorro'/);
assert.match(bichos, /publicarAnimal\('liebre'/);
assert.match(bichos, /amenazaZorro/);
assert.match(bichos, /zorroAve/);

// Rastros: sólo fauna nativa de referencia y sólo en nieve cercana.
assert.match(huellas, /actualizarFauna/);
assert.match(huellas, /s\.tipo !== 'huemul' && s\.tipo !== 'zorro'/);
assert.match(huellas, /invierno < 0\.25/);
assert.match(main, /huellas\?\.actualizarFauna/);

// Atmósfera de estepa: briznas secas impulsadas por viento y activadas por el bioma local.
assert.match(flotantes, /2 = brizna\/semilla seca/);
assert.match(flotantes, /uniform float uEstepa/);
assert.match(flotantes, /smoothstep\(0\.15, 0\.75, uViento\)/);
assert.match(flotantes, /T\.estepa\?\.\[k\]/);
assert.match(main, /crearFlotantes\(escena, calidad, T\)/);

console.log('OK Ecosistema Dinámico RC17 · red fauna inter-módulo · zorro/liebre · huida con cobertura · aves reactivas · rastros en nieve · briznas de estepa');
