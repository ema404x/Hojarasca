// 1.8: los invasores de lejos usan una malla con menos gajos, y las sombras se
// acomodan cuando la calidad automática cambia de escalón.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const alien = leer('src/desafio-alien.js'), cielo = leer('src/cielo.js'), main = leer('src/main.js'), desafio = leer('src/desafio.js');

// ---------------- la malla simplificada
assert.match(alien, /function menosGajos\(f\)/, 'falta el armador de la malla de lejos');
assert.match(alien, /const DETALLE_LEJOS = 0\.5;/);
assert.match(alien, /export const DISTANCIA_LOD = 42;/);
assert.match(alien, /function construirGeometria\(tipo, detalle = 1\)/);
assert.match(alien, /const clave = `\$\{tipo\}\|\$\{detalle\}`/, 'las dos geometrías se cachean por separado');
// las primitivas de la criatura salen del armador con detalle, no de THREE directo
const cuerpo = alien.slice(alien.indexOf('function construirGeometria(tipo, detalle = 1)'), alien.indexOf('// ---------------------------------------------------------------- esqueleto'));
const conDetalle = (cuerpo.match(/new TH\./g) || []).length;
const directas = (cuerpo.match(/new THREE\.(Sphere|Cylinder|Cone|Torus|Lathe|Icosahedron|Circle)Geometry/g) || []).length;
assert.ok(conDetalle > 30, `pocas primitivas con detalle variable (${conDetalle})`);
assert.equal(directas, 0, 'quedaron primitivas que no respetan el detalle');
// el proxy no baja nunca de un mínimo razonable de gajos
assert.match(alien, /const n = \(v, min\) => Math\.max\(min, Math\.round\(v \* f\)\);/);
// y el cambio es de geometría, no de malla: el esqueleto y el shader siguen igual
assert.match(alien, /malla\.geometry = quiere \? geoLejos : geoCerca/);
assert.match(alien, /animar, detalle,/, 'el invasor expone el cambio de detalle');
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
console.log('LOD de invasores: ok · malla de lejos al 50% de gajos desde 42 m · sombras en caliente');
