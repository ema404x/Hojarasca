// 1.11 — el cimiento de piedra. En la 2.2, junto al excavador de la 2.1: el que se mete
// bajo tierra cuando tiene una obra entre él y vos no se mete debajo de madera con
// cimiento (ahí tiene que romper, como los demás). La losa sigue siendo lo que le impide
// asomar adentro.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { CIMENTABLES, CIMIENTO, admiteCimiento, frenaAlExcavador } from '../src/desafio-cimiento-reglas.js';
import { RECETAS } from '../src/desafio-reglas.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- la regla
for (const id of CIMENTABLES) {
  assert.equal(admiteCimiento({ id }, {}), true, `${id} se puede cimentar`);
  assert.equal(admiteCimiento({ id }, { cimiento: true }), false, 'no se echa dos veces');
}
assert.equal(admiteCimiento({ id: 'muro-piedra' }, {}), false, 'la piedra no lleva cimiento: contra el excavador está la losa');
assert.equal(frenaAlExcavador({ datos: { cimiento: true } }), true);
assert.equal(frenaAlExcavador({ datos: {} }), false);
assert.equal(frenaAlExcavador(null), false);
assert.ok(CIMIENTO.pide.piedra > 0 && Object.keys(CIMIENTO.pide).length === 1, 'cuesta piedra');
const planos = leer('src/construccion.js');
for (const id of CIMENTABLES) assert.ok(planos.includes(`id: '${id}', nombre:`), `no existe el plano ${id}`);

// ---------------------------------------------------------------- el taller
const r = RECETAS.find((x) => x.id === 'cimentar');
assert.ok(r && r.cat === 'base' && r.cimentar, 'está en el taller, en Base');
assert.deepEqual(r.pide, {}, 'el costo sale de CIMIENTO, como el del refuerzo sale de REFUERZOS');

// ---------------------------------------------------------------- cableado
const d = leer('src/desafio.js');
assert.match(d, /debeCavar\(\{ distancia: dist, obraEnMedio: !!enMedio \}\) && !frenaAlExcavador\(enMedio\)/, 'el excavador de la 2.1 mira el cimiento');
assert.match(d, /e\.obra\.datos\.cimiento = true;/, 'queda en los datos de la obra (se guarda con ella)');
assert.match(d, /recetasTotales: RECETAS\.filter\(\(r\) => !r\.reparar && !r\.reforzar && !r\.cimentar\)/, 'no cuenta como receta para el logro de fabricarlas todas');
assert.match(d, /cimientos\.sincronizar\(obras\.obras\);/, 'las piedras se ven');
assert.ok(!/pozoParaUsar|agregarPozo|intentarCavar/.test(d), 'los pozos de la 1.10 no quedaron a medias');
assert.ok(!fs.existsSync(new URL('../src/desafio-pozos.js', import.meta.url)), 'ni su módulo');

console.log('cimiento:', CIMENTABLES.length, 'defensas de madera se pueden cimentar ·', CIMIENTO.pide.piedra, 'piedras · el excavador de la 2.1 lo respeta');
