import fs from 'fs';
import assert from 'assert/strict';
import { generarTerreno } from '../src/terreno.js';
import { perfilHabitatPatagonico } from '../src/patagonia.js';
import { bordeBosqueNatural, corredorEscenico, factorRodalPatagonico, firmaComposicionPaisaje } from '../src/paisaje.js';

const mock = (o = {}) => ({ bosque: 0.46, ecotono: 0.65, bosqueHumedo: 0.2, estepa: 0.05, pendiente: 0.15, exposicion: 0.25, ...o });
assert.ok(bordeBosqueNatural(mock()) > bordeBosqueNatural(mock({ bosque: 0.98, ecotono: 0 })), 'El borde del bosque debe concentrarse en transición/ecotono');

const a = { x: 0, z: 0 }, b = { x: 100, z: 0 };
assert.ok(corredorEscenico(50, 1, a, b, 18) > 0.8, 'El centro del corredor escénico debe abrirse');
assert.equal(corredorEscenico(50, 40, a, b, 18), 0, 'El corredor no debe afectar paisaje lejano lateral');

const p = mock();
const ralo = factorRodalPatagonico(p, 0.05, 0);
const denso = factorRodalPatagonico(p, 0.95, 0);
const vista = factorRodalPatagonico(p, 0.95, 1);
assert.ok(denso > ralo, 'El ruido macro debe crear rodales densos y claros');
assert.ok(vista < denso * 0.6, 'La vista escénica debe reducir densidad sin borrar el bioma');
assert.ok(vista >= 0.38, 'El corredor no debe convertirse en una calle totalmente vacía');

const rocaLlano = firmaComposicionPaisaje(mock({ pendiente: 0.02, exposicion: 0.05, estepa: 0 }), 0.9, 0.5).roca;
const rocaLadera = firmaComposicionPaisaje(mock({ pendiente: 0.9, exposicion: 0.85, estepa: 0.3 }), 0.9, 0.5).roca;
assert.ok(rocaLadera > rocaLlano, 'Las agrupaciones rocosas deben favorecer laderas/exposición');
const maderaBosque = firmaComposicionPaisaje(mock({ bosque: 0.9, bosqueHumedo: 0.9, estepa: 0 }), 0.4, 0.92).tronco;
const maderaEstepa = firmaComposicionPaisaje(mock({ bosque: 0.1, bosqueHumedo: 0, estepa: 0.95 }), 0.4, 0.92).tronco;
assert.ok(maderaBosque > maderaEstepa * 4, 'La madera muerta debe concentrarse en bosque, no en estepa abierta');

const T = generarTerreno();
let finitos = 0;
for (let z = -350; z <= 350; z += 70) for (let x = -350; x <= 350; x += 70) {
  if (T.agua(x, z)) continue;
  const perfil = perfilHabitatPatagonico(T, x, z);
  const firma = firmaComposicionPaisaje(perfil, 0.66, 0.72);
  assert.ok(Number.isFinite(firma.roca) && Number.isFinite(firma.tronco) && Number.isFinite(firma.borde));
  finitos++;
}
assert.ok(finitos > 40, 'La composición debe ser válida a escala de mundo');

const veg = fs.readFileSync(new URL('../src/vegetacion.js', import.meta.url), 'utf8');
assert.match(veg, /macroRodal/);
assert.match(veg, /corredorVista/);
assert.match(veg, /factorRodalPatagonico/);
assert.match(veg, /composicionPaisaje/);
assert.match(veg, /gruposRoca/);
assert.match(veg, /gruposTronco/);
assert.match(veg, /decorativo: true/);
assert.match(veg, /matas\.push\(\{ x, z, tipo: 'roca'/);
assert.match(veg, /matas\.push\(\{ x, z, tipo: 'tronco'/);

console.log('OK Composición Paisaje RC29 · rodales/claros macro · corredor escénico · bordes de ecotono · rocas y madera agrupadas · props despejables');
