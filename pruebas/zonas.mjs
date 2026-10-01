import { generarTerreno } from '../src/terreno.js';
import { rng } from '../src/ruido.js';
const T = generarTerreno();
const r = rng(9090);
let n = 0, alt = 0;
const zonas = [];
for (let i = 0; i < 600 && zonas.length < 4; i++) {
  const x = (r() * 2 - 1) * 440, z = (r() * 2 - 1) * 440;
  const h = T.altura(x, z), k = T.indice(x, z);
  if (h >= 32) alt++;
  if (h < 32 || T.agua(x, z) || T.pendiente[k] > 0.7 || T.bosque[k] > 0.75) continue;
  if (zonas.some((c) => Math.hypot(c.x - x, c.z - z) < 110)) continue;
  zonas.push({ x: x | 0, z: z | 0, h: h | 0 });
}
console.log('altos', alt, 'zonas', JSON.stringify(zonas));
