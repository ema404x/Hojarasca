import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cielo = fs.readFileSync(path.join(raiz,'src/cielo.js'),'utf8');
const mat = fs.readFileSync(path.join(raiz,'src/materiales.js'),'utf8');
const main = fs.readFileSync(path.join(raiz,'src/main.js'),'utf8');
const fallo=[];
// 3.4: la cordillera pasó de grilla radial (30 anillos de 192 lados) a cordones que siguen
// su cresta (384 lados, sin dientes de sierra) sobre un piedemonte de 192
if (!cielo.includes('const LADOS_CORD = 384, LADOS_PIE = 192')) fallo.push('cordillera no suavizada');
if (!cielo.includes('0.00185 + neblinaManana * 0.0029')) fallo.push('niebla global no corregida');
if (!cielo.includes('0.0, 0.72')) fallo.push('perspectiva de cordillera sin límite conservador');
// 3.2: la perspectiva aérea del estilo pintado es una bruma de color (turquesa/dorada)
// más marcada a propósito, pero sigue acotada para no volver a la pared gris del RC30.
if (!/aireVeg \* bajoVeg \* 0\.(1|2|3)\d* \* uBrumaFuerza/.test(mat)) fallo.push('bruma vegetal sin tope (máx. 0.4)');
if (!mat.includes('clamp(aireSuelo, 0.0, 0.4)')) fallo.push('bruma de suelo sin tope');
// RC31 sustituye el workaround de RC30 (todo siempre visible) por culling atómico
// de complejos enteros. Se preserva la intención: jamás ocultar piezas internas
// de forma independiente y mantener shadow LOD sobre mallas descendientes.
if (!main.includes('est.conjuntos')) fallo.push('estructuras no usan complejos atómicos');
if (!main.includes('c.obj.visible = visible')) fallo.push('falta culling atómico por complejo');
if (!main.includes('for (const m of c.sombras) m.castShadow = sombraActiva')) fallo.push('LOD de sombras descendiente no preservado');
if (!main.includes('hijo.traverse((n) => {')) fallo.push('no se inspeccionan descendientes del complejo');
if (fallo.length) { console.error('HOTFIX VISUAL RC30 FALLÓ'); for (const x of fallo) console.error(' -',x); process.exit(1); }
console.log('OK Hotfix Visual RC30 · niebla corregida · cordillera suavizada · estructuras sin piezas flotantes · shadow LOD preservado');
