// 4.12.3: el programa de profundidad (sombra) de la silueta del jugador se compila en la carga, no a mitad de juego.
// Parte de código: la silueta del juego y la del precalentado tienen la misma receta, y gente.js las dibuja las dos en la carga.
// La parte de placa está en pruebas/humo-4-12-0-bordes.cjs, humo-4-12-1-edificios.cjs y humo-4-12-2-animales.cjs (cuentan los programas).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };

const piel = leer('src/animales-piel.js');
const gente = leer('src/gente.js');
const jugador = leer('src/personal-personaje-mundo.js');

const real = jugador.match(/const matSilueta = new THREE\.MeshBasicMaterial\(\{([^}]*)\}\)/);
ok(!!real, 'la silueta del juego usa un MeshBasicMaterial');
const dummy = piel.match(/export function precalentarSilueta[\s\S]*?\n\}\n/);
ok(!!dummy, 'animales-piel.js exporta precalentarSilueta');
const cuerpo = dummy ? dummy[0] : '';
const clave = (t) => (t || '').replace(/\s+/g, '').split(',').sort().join(',');
const mat = cuerpo.match(/new THREE\.MeshBasicMaterial\(\{([^}]*)\}\)/);
ok(!!mat && !!real && clave(mat[1]) === clave(real[1]), 'el precalentado usa el mismo material que la silueta (' + (real ? real[1].trim() : '?') + ')');
ok(/setAttribute\('position'/.test(cuerpo) && !/setAttribute\('(normal|color|uv)'/.test(cuerpo), 'la geometría del precalentado tiene sólo position, como la silueta');
ok(/castShadow = true/.test(cuerpo), 'el precalentado proyecta sombra');
ok(/escena\.add\(malla\)/.test(cuerpo) && /escena\.remove\(malla\)/.test(cuerpo), 'se agrega y se saca de la escena');
ok(/try \{ dibujar\(\); \} finally/.test(cuerpo), 'se saca de la escena aunque el dibujo falle');
ok(/geo\.dispose\(\)/.test(cuerpo) && /mat\.dispose\(\)/.test(cuerpo), 'libera la geometría y el material');
ok(/import \{[^}]*precalentarSilueta[^}]*\} from '\.\/animales-piel\.js'/.test(gente), 'gente.js importa precalentarSilueta');
ok(/precalentarSilueta\(escena, camara, dibujar\)/.test(gente), 'gente.precalentar la llama con el dibujo de la carga');
const iPiel = gente.indexOf('precalentarPiel(escena, camara, dibujar)'), iSil = gente.indexOf('precalentarSilueta(escena, camara, dibujar)');
ok(iPiel > 0 && iSil > iPiel, 'se llama junto al precalentado de la piel, antes del de la gente');
ok(iSil < gente.indexOf('const n = guarda || gente[0]'), 'se llama aunque no haya gente (antes del primer return)');

console.log(`verificar-4-12-3-shader: ${n} comprobaciones ${fallas ? 'con ' + fallas + ' FALLAS' : 'OK'}`);
process.exit(fallas ? 1 : 0);
