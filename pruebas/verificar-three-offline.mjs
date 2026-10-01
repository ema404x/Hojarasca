// Valida que el runtime Three.js local cubre exactamente la API usada por src/
// y que las primitivas esenciales pueden construirse sin depender de red/npm.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const usados = new Set();
for (const nombre of fs.readdirSync(src).filter((n) => n.endsWith('.js'))) {
  const t = fs.readFileSync(path.join(src, nombre), 'utf8');
  for (const m of t.matchAll(/\bTHREE\.([A-Za-z_$][\w$]*)/g)) usados.add(m[1]);
}
let codigo = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8');
codigo += '\n;globalThis.__THREE_TEST__ = THREE;';
const ctx = { console, setTimeout, clearTimeout, performance: { now: () => 0 } };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(codigo, ctx, { timeout: 15000 });
const T = ctx.__THREE_TEST__;
const faltan = [...usados].filter((k) => !(k in T));
if (faltan.length) throw new Error(`Runtime Three local incompleto: ${faltan.join(', ')}`);
if (Object.keys(T).length !== usados.size) throw new Error(`Runtime local expone ${Object.keys(T).length} APIs pero src usa ${usados.size}`);
const raycaster = new T.Raycaster();
if (!raycaster.ray?.origin?.isVector3 || !raycaster.ray?.direction?.isVector3) throw new Error('Raycaster no inicializa su rayo interno');
const geos = [
  new T.BoxGeometry(1,2,3), new T.PlaneGeometry(2,3), new T.CircleGeometry(2,8),
  new T.ConeGeometry(1,2,8), new T.CylinderGeometry(1,1,2,8), new T.IcosahedronGeometry(1,1),
  new T.RingGeometry(.5,1,8), new T.SphereGeometry(1,8,6), new T.TetrahedronGeometry(1,0),
  new T.TorusGeometry(2,.2,6,12),
];
for (const g of geos) {
  g.computeBoundingBox();
  const v=[...g.boundingBox.min.toArray(),...g.boundingBox.max.toArray()];
  if (!v.every(Number.isFinite) || !g.attributes.position?.count) throw new Error(`Geometría local inválida: ${g.type}`);
}
console.log(`OK Three offline · ${usados.size} APIs cubiertas · Raycaster y ${geos.length} geometrías validadas`);
