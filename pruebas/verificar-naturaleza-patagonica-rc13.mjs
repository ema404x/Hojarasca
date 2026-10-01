import fs from 'fs';
import assert from 'assert/strict';
import { generarTerreno } from '../src/terreno.js';
import {
  FLORA_PATAGONICA,
  FAUNA_PATAGONICA,
  perfilHabitatPatagonico,
  elegirArbolPatagonico,
  formaArbolPatagonico,
} from '../src/patagonia.js';

const T = generarTerreno();

// El mundo debe contener una transición ecológica real, no una única máscara de "bosque".
const biomas = new Set();
for (let z = -420; z <= 420; z += 28) for (let x = -420; x <= 420; x += 28) {
  if (T.agua(x, z)) continue;
  biomas.add(perfilHabitatPatagonico(T, x, z).bioma);
}
for (const esperado of ['bosque_humedo', 'ecotono', 'estepa']) {
  assert.ok(biomas.has(esperado), `Falta el bioma patagónico ${esperado}`);
}

// Perfiles sintéticos para reglas de especie/silueta.
const mock = (o) => ({
  bioma: 'bosque_abierto', bosqueHumedo: 0, estepa: 0, alto: 0, exposicion: 0, ...o,
});
assert.equal(elegirArbolPatagonico(mock({ bioma: 'bosque_humedo' }), 0.2, 0.5), 'coihue');
assert.equal(elegirArbolPatagonico(mock({ bioma: 'mallin' }), 0.2, 0.5), 'nire');
assert.equal(elegirArbolPatagonico(mock({ bioma: 'altoandino' }), 0.2, 0.5), 'lenga');
assert.equal(elegirArbolPatagonico(mock({ bioma: 'estepa' }), 0.2, 0.4), null);

const nireCalmo = formaArbolPatagonico('nire', mock({ exposicion: 0.05 }), 0.5);
const nireExpuesto = formaArbolPatagonico('nire', mock({ exposicion: 0.95 }), 0.5);
assert.ok(nireExpuesto.sy < nireCalmo.sy, 'El ñire expuesto debe achaparrarse');
assert.ok(nireExpuesto.sx > nireCalmo.sx, 'El ñire expuesto debe ensanchar su silueta');

for (const id of ['coihue', 'lenga', 'nire', 'arrayan', 'coiron', 'neneo', 'calafate', 'notro']) {
  assert.equal(FLORA_PATAGONICA[id]?.nativa, true, `Flora sin contrato patagónico: ${id}`);
}
for (const id of ['huemul', 'pudu', 'zorro', 'guanaco', 'condor', 'carpintero']) {
  assert.equal(FAUNA_PATAGONICA[id]?.nativa, true, `Fauna sin contrato patagónico: ${id}`);
}

const pasto = fs.readFileSync(new URL('../src/pasto.js', import.meta.url), 'utf8');
assert.match(pasto, /uniform sampler2D uEstepa/);
assert.match(pasto, /baseCoiron/);
assert.match(pasto, /estepa \* 0\.32/);

const veg = fs.readFileSync(new URL('../src/vegetacion.js', import.meta.url), 'utf8');
assert.match(veg, /perfilHabitatPatagonico/);
assert.match(veg, /arbolSeco/);
assert.match(veg, /for \(let v = 0; v < 3; v\+\+\)/);

const vida = fs.readFileSync(new URL('../src/vida.js', import.meta.url), 'utf8');
assert.match(vida, /MAT_FAUNA\.onBeforeCompile = bordeLuz/);
assert.match(vida, /Microvariación muy sutil/);
assert.match(vida, /perfilHabitatPatagonico\(T, x, z\)/);

const bichos = fs.readFileSync(new URL('../src/bichos.js', import.meta.url), 'utf8');
assert.match(bichos, /mallaGuanaco\(cria = false\)/);
assert.match(bichos, /alarmaGrupo/);
assert.match(bichos, /centinela/i);
assert.match(bichos, /perfilHabitatPatagonico\(T, cx, cz\)/);

console.log(`OK Naturaleza Patagónica RC13 · biomas ${[...biomas].sort().join(', ')} · flora regional · pasto de estepa · fauna con contraluz · guanacos en tropilla`);
