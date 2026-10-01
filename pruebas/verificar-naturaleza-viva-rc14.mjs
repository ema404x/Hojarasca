import fs from 'fs';
import assert from 'assert/strict';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const veg = leer('../src/vegetacion.js');
const vida = leer('../src/vida.js');
const fauna = leer('../src/fauna.js');
const bichos = leer('../src/bichos.js');

// Integración árbol-suelo: raíces ensanchadas y piso orgánico real por instancing.
assert.match(veg, /function baseRaices\(/, 'Falta ensanche basal de raíces');
for (const especie of ['coihue', 'lenga', 'nire', 'cipres']) {
  assert.match(veg, new RegExp(`baseRaices\\(c, r, [^\\n]+${especie === 'coihue' ? '0\\.62' : especie === 'lenga' ? '0\\.45' : especie === 'nire' ? '0\\.34' : '0\\.35'}`), `Falta base de raíces en ${especie}`);
}
assert.match(veg, /function mantaHojarasca\(/, 'Falta la manta de hojarasca');
assert.match(veg, /registrar\('hojarasca0'/);
assert.match(veg, /registrar\('hojarasca1'/);
assert.match(veg, /piso orgánico del bosque/i);
assert.match(veg, /perfil\.estepa > 0\.32/, 'La hojarasca no debe invadir la estepa abierta');
assert.match(veg, /Math\.min\(calidad\.sotobosque, 52\)/, 'La capa de suelo necesita presupuesto de distancia');

// Silueta individual: el rodal conserva coherencia pero no repite un único árbol por chunk.
assert.match(veg, /for \(let v = 0; v < 4; v\+\+\)/, 'Coihue/lenga/ñire necesitan cuatro variantes');
assert.match(veg, /hashArbol/, 'Falta variación individual determinista');
assert.match(veg, /variante4 = hashArbol % 4/);

// Mamíferos nativos deben adaptarse visualmente a la pendiente y no quedar verticales en ladera.
assert.match(vida, /export function inclinacionTerrenoMamifero/);
assert.match(vida, /T\.normal\(pos\.x, pos\.z\)/);
assert.match(vida, /suelo = inclinacionTerrenoMamifero\(T, a\.pos/); // huemul / ciervos
assert.match(vida, /sueloZ = inclinacionTerrenoMamifero\(T, z\.pos/); // zorro
assert.match(bichos, /sueloG = inclinacionTerrenoMamifero\(T, gu\.pos/); // guanaco
assert.match(fauna, /sueloP = inclinacionTerrenoMamifero\(T, p\.pos/); // pudú

// El pudú debe compartir el material de fauna con contraluz/microvariación de RC13.
assert.match(fauna, /import \{ lam, inclinacionTerrenoMamifero \} from '\.\/vida\.js'/);
assert.doesNotMatch(fauna, /const lam = \(color\) => new THREE\.MeshLambertMaterial/);
assert.match(vida, /Microvariación muy sutil/);

console.log('OK Naturaleza Viva RC14 · raíces integradas · hojarasca procedural · 4 variantes arbóreas · fauna alineada a pendiente · pudú con material premium · presupuesto de detalle cercano');
