import { nivelRc } from './version.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const leer=(f)=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const estructuras=leer('src/estructuras.js');
const main=leer('src/main.js');
const plantilla=leer('src/plantilla.html');
const pkg=JSON.parse(leer('package.json'));
const index=leer('index.html');

assert.ok(nivelRc(pkg.version) >= 4, `versi?n RC4 o posterior requerida: ${pkg.version}`);
assert.ok(plantilla.includes('id="version-completa">Versión __HOJARASCA_VERSION__<'),'créditos sin marcador de versión');

// Colocación global: cada estructura reserva su huella real y los fallbacks
// consultan la misma regla; la separación a la vía escala con el tamaño.
for(const marca of [
  'const huellas = [];',
  'const registrarHuella =',
  'const invadeHuella =',
  'if (invadeHuella(x, z, radio, margenHuella)) continue;',
  'const retiroRiel = Math.max(22, radio + 8);',
  "registrarHuella('faro'",
  "registrarHuella('molino'",
  "registrarHuella('casa-te'",
  "registrarHuella('torre'",
  "registrarHuella('cueva'",
  "registrarHuella('almacen'",
  "registrarHuella('galpon'",
]) assert.ok(estructuras.includes(marca),`falta regla RC4: ${marca}`);

// Las dos búsquedas manuales anteriores a buscarLlano también deben respetar
// huellas, para que cabaña/puesto no sean excepciones del sistema global.
assert.ok((estructuras.match(/invadeHuella\(x, z, 6\.5, 4\)/g)||[]).length>=2,
  'cabaña o puesto siguen fuera de la regla global de huellas');

// Casa de Té: el escalón de acceso debe entrar en la malla antes de materializarla.
const iniTe=estructuras.indexOf('// ---------------------------------------------------------------- casa de té');
const finTe=estructuras.indexOf('// ---------------------------------------------------------------- torre de guardaparques',iniTe);
const te=estructuras.slice(iniTe,finTe);
const paso=te.indexOf('PT.escalon({ lx: 0, lz: lzAccesoTe');
const malla=te.indexOf('const malla = new THREE.Mesh(c.geometria(), mat);');
assert.ok(paso>=0 && malla>paso,'Casa de Té vuelve a tener un escalón físico invisible');

// Radios de uso/limpieza deben coincidir con la huella real que ve el jugador.
assert.match(estructuras,/Molino de Viento[\s\S]{0,260}radio: 7\.5/);
assert.match(estructuras,/Cueva de las Manos[\s\S]{0,220}radio: 9/);
assert.match(main,/limpiar\(e\.molino, \(e\.molino\?\.radio \|\| 7\.5\) \+ 0\.5, 6\.2\)/);
assert.match(main,/zona\(e\.molino, e\.molino\?\.radio \|\| 7\.5\)/);

assert.ok(index.includes(`HOJARASCA BUILD ${pkg.version}`),'index desincronizado con package.json');
assert.ok(index.includes(`id="version-completa">Versión ${pkg.version}<`),'créditos sin versión del build');

console.log('OK Implacable RC4 · huellas globales, vía, accesos visibles y radios coherentes');
