// RC31.1: los atributos de vértice no existen en el fragment shader. Si un bloque
// inyectado en `sh.fragmentShader` lee `aTipo` (u otro atributo declarado con
// `attribute`), el programa no compila y el material deja de dibujarse en GPU real.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const fallas = [];
let bloques = 0;

for (const archivo of fs.readdirSync(src).filter((f) => f.endsWith('.js'))) {
  const texto = fs.readFileSync(path.join(src, archivo), 'utf8');
  const atributos = new Set([...texto.matchAll(/attribute\s+\w+\s+(\w+)\s*;/g)].map((m) => m[1]));
  if (!atributos.size) continue;
  // Cada asignación a fragmentShader llega hasta la siguiente asignación de shader/uniforms.
  for (const m of texto.matchAll(/\.fragmentShader\s*=([\s\S]*?)(?=\n\s*(?:sh|shader|s)\.(?:vertexShader|uniforms)|\n\s*};|\n\s*return\b)/g)) {
    bloques++;
    const cuerpo = m[1];
    for (const a of atributos) {
      if (new RegExp(`\\b${a}\\b`).test(cuerpo)) {
        const linea = texto.slice(0, m.index).split('\n').length;
        fallas.push(`${archivo}:${linea} usa el atributo '${a}' en el fragment shader (usar un varying)`);
      }
    }
  }
}

// Contrato concreto del material vegetal/estructural.
const mat = fs.readFileSync(path.join(src, 'materiales.js'), 'utf8');
if (!/varying float vTipoVeg;[\s\S]*vTipoVeg = aTipo;/.test(mat)) fallas.push('materiales.js: falta propagar aTipo al fragment shader mediante vTipoVeg');
if (!/step\(0\.5, vTipoVeg\)/.test(mat) || !/step\(3\.5, vTipoVeg\)/.test(mat)) fallas.push('materiales.js: el microdetalle madera/mineral debe leer vTipoVeg');

// RC31.2: árboles/sotobosque son InstancedMesh. La posición de mundo usada por el
// crossfade LOD, la nieve y la perspectiva aérea debe incluir instanceMatrix; si no,
// todas las instancias quedan en el origen y el bosque desaparece lejos del centro.
if (!/matrizMundoVeg = modelMatrix \* instanceMatrix;/.test(mat)) fallas.push('materiales.js: vPosMundoVeg ignora instanceMatrix (árboles invisibles lejos del origen)');
if (!/vPosMundoVeg = \(matrizMundoVeg \* vec4\(transformed, 1\.0\)\)\.xyz;/.test(mat)) fallas.push('materiales.js: vPosMundoVeg debe usar matrizMundoVeg');
if (/vPosMundoVeg = \(modelMatrix \* vec4\(transformed/.test(mat)) fallas.push('materiales.js: volvió el cálculo de vPosMundoVeg sin instancing');
if (!/raizVeg = matrizMundoVeg \* vec4\(0\.0, 0\.0, 0\.0, 1\.0\)/.test(mat) || !/distanciaLod = length\(vRaizVeg/.test(mat)) fallas.push('materiales.js: vSueloVeg y la distancia LOD deben medirse desde la base de cada instancia');
// Crossfade: cercano y lejano complementarios, con umbral por árbol (sin salpicado en la copa).
if (!/mascaraLod = hash12\(floor\(vRaizVeg/.test(mat)) fallas.push('materiales.js: el umbral LOD debe ser por instancia (vRaizVeg), no por píxel');
if (!/mascaraLod < 1\.0 - coberturaLod/.test(mat)) fallas.push('materiales.js: el LOD lejano no usa la máscara complementaria');

if (fallas.length) {
  console.error('FALLA shaders RC31.2\n- ' + fallas.join('\n- '));
  process.exit(1);
}
console.log(`OK shaders RC31.2 · ${bloques} bloques de fragment sin atributos · vegetación instanciada con posición de mundo y LOD complementario`);
