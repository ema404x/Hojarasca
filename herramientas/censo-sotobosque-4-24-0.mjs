// censo del sotobosque (base 4.23.0 contra 4.24.0): se corre desde cada árbol con su propio src
import { registrarThree } from '../pruebas/ayuda-three.mjs';
registrarThree();
const THREE = await import('three');
const { generarTerreno } = await import('../src/terreno.js');
const V = await import('../src/vegetacion.js');
const { CALIDADES } = await import('../src/config.js');
const T = generarTerreno();
const hashDe = (lista, f) => { let h = 0; for (const e of lista) for (const v of f(e)) h = (h * 31 + Math.round(v * 1000)) % 2147483647; return h; };
const out = {};
for (const q of ['media', 'baja', 'alta']) {
  const escena = new THREE.Scene();
  const veg = V.generarVegetacion(T, CALIDADES[q], escena);
  const porTipo = {};
  for (const m of veg.matas) porTipo[m.tipo] = (porTipo[m.tipo] || 0) + 1;
  const fijos = veg.matas.filter((m) => m.tipo === 'roca' || m.tipo === 'tronco');
  out[q] = { arboles: veg.arboles.length, matas: veg.matas.length, colisiones: veg.colisiones.length, plantas: veg.plantas.length,
    calafates: veg.calafates.length, porTipo, hArb: hashDe(veg.arboles, (a) => [a.x, a.z, a.esc]), hFijos: hashDe(fijos, (m) => [m.x, m.z, m.esc || 0]),
    hCol: hashDe(veg.colisiones, (c) => [c.x ?? c.ax, c.z ?? c.az, c.r]), grupos: veg.composicionPaisaje,
    hijosEscena: escena.children.length };
}
console.log(JSON.stringify(out));
