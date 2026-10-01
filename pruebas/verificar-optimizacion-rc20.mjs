import fs from 'fs';
import assert from 'assert/strict';
import { crearPoolPosicional, crearCadencia, limitarSombrasPorDistancia } from '../src/rendimiento.js';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const main = leer('../src/main.js');
const fauna = leer('../src/fauna.js');
const vida = leer('../src/vida.js');
const bichos = leer('../src/bichos.js');
const perro = leer('../src/perro.js');
const gente = leer('../src/gente.js');

class Pos {
  constructor(){ this.x=0; this.y=0; this.z=0; }
  set(x,y,z){ this.x=x; this.y=y; this.z=z; return this; }
}
const pool = crearPoolPosicional(() => new Pos(), 1);
pool.reiniciar();
const a = pool.agregar('huemul', {x:1,y:2,z:3}, 0.5, 'h-1', 2);
assert.equal(a.pos.y, 2.5);
pool.reiniciar();
const b = pool.agregar('zorro', {x:4,y:5,z:6});
assert.equal(a, b, 'el pool debe reutilizar el registro en vez de asignar otro');
assert.equal(a.pos, b.pos, 'el vector posicional debe reutilizarse');
assert.equal(pool.lista().length, 1);

const cad = crearCadencia(10);
cad.sumar(0.04); cad.sumar(0.04);
assert.equal(cad.listo(), false);
cad.sumar(0.03);
assert.equal(cad.listo(), true);
assert.ok(cad.consumir() >= 0.10);
assert.equal(cad.acumulado, 0);

const meshA = { isMesh:true, castShadow:true, userData:{} };
const meshB = { isMesh:true, castShadow:false, userData:{} };
const raiz = { userData:{}, traverse(fn){ fn(meshA); fn(meshB); } };
limitarSombrasPorDistancia(raiz, 100, 50);
assert.equal(meshA.castShadow, false);
assert.equal(meshB.castShadow, false);
limitarSombrasPorDistancia(raiz, 10, 50);
assert.equal(meshA.castShadow, true, 'debe restaurar el castShadow original al acercarse');
assert.equal(meshB.castShadow, false, 'no debe activar sombras que originalmente estaban apagadas');

// Hot paths: pools y contextos estables en vez de clones/spreads por cuadro.
assert.match(main, /const ctxMundoVivo = \{/);
assert.match(main, /const ctxSonido = \{/);
assert.match(main, /const rastrosFauna = \[\]/);
assert.doesNotMatch(main, /\[\.\.\.\(vida\.sujetos/);
assert.doesNotMatch(main, /estadoRender = \{ \.\.\.renderer\.info\.render \}/);
assert.match(main, /if \(!medidor\.visible && !HOJARASCA_DEBUG\) return/);
assert.match(main, /acumuladoInterior >= 0\.12/);
assert.match(main, /acumuladoInteraccion >= 0\.10/);
assert.match(main, /acumuladoVecino >= 1 \/ 15/);
assert.match(main, /acumuladoHabitat >= 0\.18/);

assert.match(fauna, /crearPoolPosicional/);
assert.doesNotMatch(fauna, /const lista = \[\];\s*\n\s*for \(const p of pudues\)/);
assert.match(vida, /poolSujetos\.agregar\('huemul'/);
assert.doesNotMatch(vida, /sujetos\.push\(\{ tipo: 'huemul'/);
assert.match(bichos, /poolRastros\.agregar\('guanaco'/);
assert.doesNotMatch(bichos, /rastros\.push\(\{ tipo: 'guanaco'/);
assert.match(perro, /acumuladoScan >= 0\.12/);
assert.match(perro, /ds2 = dxs \* dxs \+ dzs \* dzs/);
assert.doesNotMatch(gente, /new THREE\.Vector3\(adelante\.x/);

// Shadow LOD sólo cambia al cruzar el umbral y está integrado en actores relevantes.
for (const fuente of [fauna, vida, bichos, gente]) assert.match(fuente, /limitarSombrasPorDistancia/);

console.log('OK Optimización Sistémica RC20 · pools sin GC · contextos reutilizados · scans temporales · caché interior/hábitat · perro 8 Hz · shadow LOD dinámico');
