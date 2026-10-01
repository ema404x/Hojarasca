// Integridad estática de la UI: cualquier ID literal usado por el juego debe existir
// exactamente una vez en la plantilla.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const html = leer('src/plantilla.html');
const main = leer('src/main.js');
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, 'la plantilla contiene IDs HTML duplicados');
const existentes = new Set(ids);
const refs = new Set();
for (const texto of [main, html]) {
  for (const m of texto.matchAll(/\$\(['"]([^'"]+)['"]\)/g)) refs.add(m[1]);
  for (const m of texto.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)) refs.add(m[1]);
}
const faltan = [...refs].filter((id) => !existentes.has(id));
assert.deepEqual(faltan, [], `IDs referenciados pero ausentes: ${faltan.join(', ')}`);
for (const id of ['inicio','carga','hud','pausa','mapa','cuaderno','mochila','controles-completos','creditos','error-release','mundo']) assert.ok(existentes.has(id), `falta superficie UI crítica: ${id}`);
console.log(`OK DOM RC2 · ${ids.length} IDs únicos · ${refs.size} referencias resueltas`);
