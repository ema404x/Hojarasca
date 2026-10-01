import fs from 'node:fs';
import assert from 'node:assert/strict';
const src = fs.readFileSync(new URL('../src/estructuras.js', import.meta.url), 'utf8');
const tpl = fs.readFileSync(new URL('../src/plantilla.html', import.meta.url), 'utf8');

// Las mejoras visuales introducidas en V6 deben persistir, pero la marca de
// validación no forma parte del juego final.
assert.ok(src.includes('cartelTextura(\'RAMOS GENERALES\')'), 'se perdió el rótulo del almacén');
assert.ok(src.includes('const COB_X'), 'se perdió el cobertizo lateral del galpón');
assert.ok(src.includes('galería realmente techada'), 'se perdió la galería cubierta de las cabañas');
assert.ok(!tpl.includes('ESTRUCTURAS V6 · VISUAL'), 'la marca temporal V6 sigue visible en la plantilla');
console.log('OK visual V6 preservado');
