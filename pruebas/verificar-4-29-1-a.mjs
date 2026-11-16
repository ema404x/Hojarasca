// 4.29.1 (A): Ultra medido y recortado para entrar en el presupuesto de 33 ms.
// Los tres recortes (en el orden del brief): la oclusión a 3 muestras (media resolución como siempre), la niebla en 6 pasos (el piso) y el
// relieve de los materiales apagado entre 12 y 20 m (antes 14 y 25). Todo vive en los archivos de Ultra: con Ultra apagado no cambia ningún
// programa (eso lo cubren 4-28-0-a y 4-29-0-a). Después, MUTACIONES: cada recorte deshecho (o pasado de largo) en una copia hace fallar.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'src');
const leer = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

const chequeo = (reglas, mundo, mats) => {
  const mu = /AO_ULTRA = \{[^}]*muestras: ([0-9]+) \}/.exec(reglas);
  const pasos = /const int PASOS = ([0-9]+);/.exec(mundo);
  const relieves = mats.match(/smoothstep\(([0-9.]+), ([0-9.]+), length\(vViewPosition\)\)/g) || [];
  return !!mu && Number(mu[1]) === 3
    && !!pasos && Number(pasos[1]) === 6                       // (el piso de la niebla: no menos de 6)
    && relieves.length === 2 && relieves.every((r) => r.includes('smoothstep(12.0, 20.0,'))
    && mundo.includes('AO_ULTRA.muestras') && !/uLejosAO: \{ value: [0-9]+ \}/.test(mundo);   // (la oclusión sigue leyendo la constante)
};
const r0 = leer('ultra-luz.js'), m0 = leer('ultra-luz-mundo.js'), t0 = leer('ultra-materiales.js');
assert.ok(chequeo(r0, m0, t0), 'Ultra recortado: oclusión 3 muestras, niebla 6 pasos, relieve entre 12 y 20 m');
assert.ok(!/AO_ULTRA\.muestras\s*=/.test(m0), 'la oclusión no se pisa en otro lado');

const MUT = [
  ['la oclusión vuelve a 4 muestras', () => chequeo(r0.replace('muestras: 3 }', 'muestras: 4 }'), m0, t0)],
  ['la oclusión baja a 2 muestras (se ve rala)', () => chequeo(r0.replace('muestras: 3 }', 'muestras: 2 }'), m0, t0)],
  ['la niebla vuelve a 7 pasos', () => chequeo(r0, m0.replace('const int PASOS = 6;', 'const int PASOS = 7;'), t0)],
  ['la niebla baja de 6 pasos', () => chequeo(r0, m0.replace('const int PASOS = 6;', 'const int PASOS = 5;'), t0)],
  ['el relieve de la aldea vuelve a 14-25 m', () => chequeo(r0, m0, t0.replace('smoothstep(12.0, 20.0, length(vViewPosition))', 'smoothstep(14.0, 25.0, length(vViewPosition))'))],
  ['el relieve de las estructuras vuelve a 14-25 m', () => chequeo(r0, m0, t0.split('smoothstep(12.0, 20.0, length(vViewPosition))').join('@@').replace('@@', 'smoothstep(12.0, 20.0, length(vViewPosition))').replace('@@', 'smoothstep(14.0, 25.0, length(vViewPosition))'))],
  ['el relieve de una de las dos se pierde', () => chequeo(r0, m0, t0.replace(/\(1\.0 - smoothstep\(12\.0, 20\.0, length\(vViewPosition\)\)\);   \/\/ \(más allá/, '1.0;   // (más allá'))],
];
for (const [n, f] of MUT) assert.ok(!f(), 'mutación atrapada: ' + n);
console.log(`verificar-4-29-1-a: recortes de Ultra en su sitio · ${MUT.length} de ${MUT.length} mutaciones atrapadas`);
