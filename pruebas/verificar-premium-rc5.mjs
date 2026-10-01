import { nivelRc } from './version.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const estructuras = fs.readFileSync(path.join(raiz, 'src', 'estructuras.js'), 'utf8');
const refugioVivo = fs.readFileSync(path.join(raiz, 'src', 'refugiovivo.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));

assert.ok(nivelRc(pkg.version) >= 5, `versi?n RC5 o posterior requerida: ${pkg.version}`);

// Nunca volver a poner un travesaño a media altura dentro del acceso del refugio.
assert.ok(!estructuras.includes("caja(c, [0, 1.05, D / 2 + 0.12], [1.5, 0.1, 0.16]"),
  'regresion: travesaño horizontal vuelve a cruzar la puerta del refugio');
assert.match(estructuras, /const ALTO_MARCO_REF = 2\.38/);
assert.match(estructuras, /const ALTO_MARCO_CAB = 2\.25/);

assert.ok(estructuras.includes('if (y < 2.45) {'), 'refugio: el hueco vertical vuelve a quedar bajo');
assert.ok(estructuras.includes('if (yy < 2.28) {'), 'cabaña: el hueco vertical vuelve a cortar la hoja');
assert.ok(estructuras.includes('piso: 0.37'), 'refugio: puerta no alineada con el piso');
assert.ok(estructuras.includes('piso: 0.35'), 'cabaña: puerta no alineada con el piso');

// Chimenea: hogar, fuste y punto de humo comparten el mismo eje/altura real.
for (const marca of [
  'const CHIM_REF = { x: -W / 2 + 1.1, z: -D / 2 + 0.45 }',
  'const chimRefDesde = 0.42',
  'const chimRefHasta = H + 2.6',
  'const chim = esquina(CHIM_REF.x, CHIM_REF.z)',
  'y: ref.y + chimRefHasta + 0.08',
  'const ch = w(chX, chZ)',
  'y: y + chTope + 0.08',
]) assert.ok(estructuras.includes(marca), `falta continuidad de chimenea: ${marca}`);

// Fotos: deben anclarse a la pared real declarada por la estructura, no a un z fijo en el aire.
assert.match(estructuras, /ref\.paredFondoInteriorZ = -D \/ 2 \+ radio \+ 0\.035/);
assert.ok(!refugioVivo.includes('1.95, -1.68'), 'regresion: fotos vuelven a flotar en z=-1.68');
assert.match(refugioVivo, /Number\.isFinite\(ref\.paredFondoInteriorZ\)/);
// 3.0.1: a 2,25 m, por encima de la tabla de arriba de la estantería (a 1,95 la cortaba)
assert.match(refugioVivo, /marco\.position\.set\(-1\.4 \+ i \* 0\.62, 2\.25, zPared\)/);

console.log('OK Premium RC5 · accesos limpios, fotos ancladas y chimeneas continuas');
