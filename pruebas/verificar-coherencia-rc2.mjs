// RC2: coherencia de controles e IDs de progresión que antes quedaban a medias.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js');
const jugador = leer('src/jugador.js');
const html = leer('src/plantilla.html');
const mochila = leer('src/mochila.js');
const refugio = leer('src/refugiovivo.js');
const index = leer('index.html');

assert.match(jugador, /KeyC/);
assert.doesNotMatch(main, /case 'KeyC': abrirObra/);
assert.match(main, /case 'KeyO': abrirObra/);
assert.match(html, /<kbd>O<\/kbd><\/dt><dd>abrir los planos de construcción/);
assert.match(html, /<kbd>Z<\/kbd><\/dt><dd>prismáticos/);
assert.match(html, /<kbd>U<\/kbd> \/ clic derecho<\/dt><dd>usar el objeto en la mano/);

for (const texto of [mochila, refugio]) {
  assert.doesNotMatch(texto, /frutillas-rescoldo/);
  assert.doesNotMatch(texto, /te-torta/);
  assert.match(texto, /frutillas-brasas/);
  assert.match(texto, /te-galesa/);
}
for (const marca of ["case 'KeyO': abrirObra", 'VERSION_GUARDADO = 2', 'frutillas-brasas', 'te-galesa']) assert.ok(index.includes(marca), `index sin ${marca}`);

console.log('OK coherencia RC2 · controles sin conflicto e IDs de progresión sincronizados');
