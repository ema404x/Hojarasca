// Coherencia de contenido/progresión: evita encargos, trueques o recetas imposibles
// por IDs duplicados o desincronizados.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ENTRADAS } from '../src/cuaderno.js';
import { ENCARGOS } from '../src/encargos.js';
import { TRUEQUES, NOMBRE_COSA } from '../src/trueque.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const unicos = (lista, nombre) => {
  const ids = lista.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, `${nombre} tiene IDs duplicados`);
  return new Set(ids);
};
const entradas = unicos(ENTRADAS, 'cuaderno');
const encargos = unicos(ENCARGOS, 'encargos');
unicos(TRUEQUES, 'trueques');

for (const e of encargos) assert.ok(entradas.has(e), `encargo ${e} no tiene entrada en el cuaderno`);
for (const t of TRUEQUES) {
  assert.ok(entradas.has(t.id), `trueque ${t.id} no tiene entrada en el cuaderno`);
  for (const [id, n] of t.pide) {
    assert.ok(Number.isInteger(n) && n > 0, `trueque ${t.id} tiene cantidad inválida para ${id}`);
    assert.ok(id === 'ramita' || entradas.has(id), `trueque ${t.id} pide recurso inexistente: ${id}`);
    assert.ok(NOMBRE_COSA[id], `trueque ${t.id} no tiene nombre visible para ${id}`);
  }
}
const main = leer('src/main.js');
for (const m of main.matchAll(/\bregistrar\(['"]([^'"]+)['"]\)/g)) assert.ok(entradas.has(m[1]), `main registra una entrada inexistente: ${m[1]}`);
for (const id of ['pinones-tostados','dulce-calafate','frutillas-brasas','te-galesa','mate','chocolate']) assert.ok(entradas.has(id), `receta/consumición sin entrada: ${id}`);
for (const viejo of ['frutillas-rescoldo','te-torta']) assert.ok(!entradas.has(viejo), `ID histórico volvió al cuaderno: ${viejo}`);

// Los módulos con Three se auditan por texto para no depender de npm.
const idsTexto = (f) => [...leer(f).matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
for (const [f,nombre] of [['src/construccion.js','planos'],['src/fotos.js','desafíos de fotos']]) {
  const ids = idsTexto(f); assert.equal(new Set(ids).size, ids.length, `${nombre} tiene IDs duplicados`);
}
const materiales = new Set([...leer('src/construccion.js').matchAll(/^\s{2}([A-Za-z0-9_-]+):\s*\{/gm)].map((m)=>m[1]));
assert.ok(materiales.has('tronco') && materiales.has('tabla') && materiales.has('piedra'), 'catálogo de materiales incompleto');
console.log(`OK progresión RC2 · ${ENTRADAS.length} entradas · ${ENCARGOS.length} encargos · ${TRUEQUES.length} trueques · contenido sin IDs duplicados`);
