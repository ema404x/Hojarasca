// 1.8: los invasores de lejos usan una malla con menos gajos, y las sombras se
// acomodan cuando la calidad automática cambia de escalón.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
// 3.8.0: los invasores son duendes (desafio-duendes.js y duendes-modelo.js): el de lejos es el mismo
// modelo armado con menos gajos y sin lo fino; como se dibujan instanciados, cambiar de detalle es
// cambiar de lote (no de geometría ni de programa)
const alien = leer('src/desafio-duendes.js'), modelo = leer('src/duendes-modelo.js'), cielo = leer('src/cielo.js'), main = leer('src/main.js'), desafio = leer('src/desafio.js');

// ---------------- la malla simplificada
assert.match(alien, /export const DETALLE_CERCA = [\d.]+, DETALLE_LEJOS = [\d.]+;/, 'faltan los detalles de cerca y de lejos');
assert.match(alien, /export const DISTANCIA_LOD = \d+;/);
assert.ok(alien.includes('const clave = `${tipo}|${viejo ? 1 : 0}|${look}|${lejos ? 1 : 0}`;'), 'cada detalle se cachea por separado');
// las primitivas del duende salen con el detalle, no de THREE directo
assert.ok(modelo.includes('const nn = (v, min = 3) => Math.max(min, Math.round(v * DET));'), 'el detalle no baja nunca de un mínimo razonable de gajos');
const cuerpo = modelo.slice(modelo.indexOf('function armar(P, semilla) {'), modelo.indexOf('// ---------------------------------------------------------------- la lechuza'));
assert.equal((cuerpo.match(/new THREE\.(Sphere|Cylinder|Torus|Lathe|Icosahedron|Circle)Geometry\((?!1, nn)/g) || []).length, 0, 'quedaron primitivas que no respetan el detalle');
assert.ok((cuerpo.match(/fino\(\)/g) || []).length >= 8, 'de lejos, sin lo fino');
assert.match(alien, /animar, detalle, caer,/, 'el duende expone el cambio de detalle');
assert.equal((alien.match(/customProgramCacheKey/g) || []).length, 1, 'sigue habiendo un solo programa compartido');

// ---------------- se revisa de a ratos, no en cada cuadro
assert.match(desafio, /a\.tLod = \(a\.tLod \|\| 0\) - dt;/);
assert.match(desafio, /a\.m\.detalle\?\.\(Math\.hypot\(p\.x - js\.pos\.x, p\.z - js\.pos\.z\)\)/);

// ---------------- sombras que se acomodan en caliente
assert.match(cielo, /function ajustarSombras\(tam\)/);
assert.match(cielo, /if \(sol\.shadow\.map\) \{ sol\.shadow\.map\.dispose\(\); sol\.shadow\.map = null; \}/, 'hay que tirar el mapa viejo o queda el tamaño anterior');
assert.match(cielo, /return \{ actualizar, sol, hemi, ajustarSombras[\w, ]*\}/);
assert.match(main, /cielo\?\.ajustarSombras\?\.\(nueva\.sombras\)/);
assert.match(main, /renderer\.shadowMap\.enabled = nueva\.sombras > 0/);

// ---------------- la medición quedó comparable entre corridas
const medir = leer('pruebas/medir-rendimiento.cjs');
assert.match(medir, /autoCalidad:false/, 'si la calidad cambia sola, dos mediciones no se pueden comparar');
assert.match(medir, /r\.dibujoLejos = await js/, 'hay que medir también a los invasores lejos');
console.log('LOD de invasores: ok · duendes: el de lejos con menos gajos (otro lote) · sombras en caliente');
