// Evita que reconstrucciones de interiores acumulen recursos WebGL muertos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const t = fs.readFileSync(new URL('../src/refugiovivo.js', import.meta.url), 'utf8');
assert.match(t, /cuadro\.traverse\(\(o\) => \{/);
assert.match(t, /o\.geometry\?\.dispose\?\.\(\)/);
assert.match(t, /m\?\.map\?\.dispose\?\.\(\)/);
assert.match(t, /m\?\.dispose\?\.\(\)/);
assert.doesNotMatch(t, /for \(const c of cuadros\) \{ grupo\.remove\(c\); c\.material\.map/);
console.log('OK recursos RC2 · fotos del refugio liberan geometría, material y textura');
