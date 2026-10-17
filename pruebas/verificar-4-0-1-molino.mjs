// 4.0.1 · El paisaje del molino con el terreno REAL del valle (zona C, hallazgos 1 y 2). El sendero y el terreno no se tocan: lo nuevo les deja paso.
//   1. ningún tulipán sobre el sendero, y el cerco se abre donde el sendero lo cruza (se puede caminar de punta a punta del tramo sin chocar con el campo);
//   2. el agua del arroyo sigue la loma: nunca queda más de 0,8 m sobre el suelo en lo llano, y el sendero la cruza vadeándola, no por debajo.
import assert from 'node:assert/strict';
import { cargar } from './ayuda-4-0-1-mundo.mjs';

const M = cargar(['terreno.js', 'colisiones.js', 'estructuras.js', 'molino-paisaje.js', 'molino-paisaje-plano.js', 'niebla.js']);
const { THREE } = M;
const T = M.terreno.generarTerreno();
const escena = new THREE.Scene(), col = M.colisiones.crearColisiones();
const veg = { arboles: [], colisiones: [], despejar() {} }, puertas = { agregar() {}, agregarPostigos() {}, agregarCorrediza() {} };
const est = M.estructuras.crearEstructuras(T, escena, col, veg, puertas);
const m = est.molino;
const mp = M.molino_paisaje.crearMolinoPaisaje({ T, escena, col, molino: m, densidad: 1 });
const rot = m.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot);
const aLocal = (x, z) => ({ lx: (x - m.x) * cr - (z - m.z) * sr, lz: (x - m.x) * sr + (z - m.z) * cr });

// 1a) los tulipanes
let total = 0, sobre = 0;
const mat = new THREE.Matrix4(), v = new THREE.Vector3();
for (const malla of mp.mallas.tulipanes) for (let i = 0; i < malla.count; i++) { malla.getMatrixAt(i, mat); v.setFromMatrixPosition(mat); total++; if (T.val(T.distSendero, v.x, v.z) < 1.5) sobre++; }
assert.ok(total > 1000, `el campo sigue siendo un campo (${total} tulipanes)`);
assert.equal(sobre, 0, 'ningún tulipán sobre el sendero');

// 1b) caminar el sendero a pie por el tramo del molino, de ida y de vuelta, con las colisiones reales: no se choca con el campo ni su cerco
const S = T.sendero;
let idx0 = 0, mejor = 1e9;
S.forEach((p, i) => { const d = Math.hypot(p.x - m.x, p.z - m.z); if (d < mejor) { mejor = d; idx0 = i; } });
function caminar(desde, dir, hasta) {
  const p0 = S[(idx0 + desde + S.length) % S.length];
  const pos = { x: p0.x, y: T.altura(p0.x, p0.z), z: p0.z };
  for (let k = 1; k <= hasta; k++) {
    const q = S[(idx0 + desde + dir * k + S.length) % S.length];
    const dx = q.x - pos.x, dz = q.z - pos.z, n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.1));
    for (let i = 0; i < n; i++) {
      const nx = pos.x + dx / n, nz = pos.z + dz / n, t = { x: nx, y: T.altura(nx, nz), z: nz };
      col.resolver(t, 0.35, 1.7);
      if (Math.hypot(t.x - nx, t.z - nz) > 0.04) return { k, ...aLocal(nx, nz) };
      pos.x = nx; pos.z = nz;
    }
  }
  return null;
}
const choque = [caminar(-3, -1, 45), caminar(-16, 1, 14)].filter(Boolean);
for (const c of choque) {
  // (el molino mismo y el resto del valle quedan como estaban: sólo cuenta el campo, el cerco y el arroyo, que están en lz > 8)
  assert.ok(!(c.lz > 8 && c.lx > -4 && c.lx < 12), `el sendero no choca con el campo ni el cerco (choca en lx ${c.lx.toFixed(1)}, lz ${c.lz.toFixed(1)})`);
}

// 2) el arroyo: la altura del agua sobre el suelo, muestra por muestra de la cinta
const malla = mp.mallas.agua, a = malla.geometry.attributes.position.array;
let peor = -1e9, cruce = 0;
for (let j = 0; j < a.length / 6; j++) {
  const cx = (a[j * 6] + a[j * 6 + 3]) / 2, cz = (a[j * 6 + 2] + a[j * 6 + 5]) / 2, y = a[j * 6 + 1];
  const { lx } = aLocal(cx, cz);
  if (lx > 9) continue;   // (después de la caída la loma ya la seguía)
  peor = Math.max(peor, y - T.altura(cx, cz));
  const dS = T.val(T.distSendero, cx, cz);
  if (dS < 1.2) cruce = Math.max(cruce, y - T.altura(cx, cz));
}
assert.ok(peor < 0.8, `el agua de lo llano no cuelga (${peor.toFixed(2)} m sobre el suelo)`);
assert.ok(cruce < 0.5, `donde cruza el sendero el agua está a ras del suelo (${cruce.toFixed(2)} m)`);
// 3) la galería de la casa es sólida: caminando de frente por el eje de la galería, el cuerpo se frena en el frente de la galería (antes llegaba a la pared de la casa)
{
  const c = mp.casa ?? null;
  const frente = c?.gz1 ?? 10.8 + 2.3;
  const mundoDe = (lx, lz) => ({ x: m.x + lx * cr + lz * sr, z: m.z - lx * sr + lz * cr });
  for (const lx of [-10.2, -12.5, -7.5]) {
    const pos = { ...mundoDe(lx, frente + 6), y: 0 }; pos.y = T.altura(pos.x, pos.z);
    let corte = null;
    for (let lz = frente + 6; lz > frente - 6; lz -= 0.05) {
      const q = mundoDe(lx, lz), t = { x: q.x, y: T.altura(q.x, q.z), z: q.z };
      col.resolver(t, 0.35, 1.65);
      if (Math.hypot(t.x - q.x, t.z - q.z) > 0.04) { corte = lz; break; }
    }
    assert.ok(corte !== null && corte > frente - 0.8, `la galería frena a quien camina de frente (lx ${lx}): se frenó en lz ${corte}, el frente está en ${frente.toFixed(1)}`);
  }
}
// 4) los bancos de niebla de valle (zona C, hallazgo 4) no cortan cabaña, galpón ni faro; los de siempre no se mueven
{
  const sin = M.niebla.crearNiebla(T, escena, { niebla: 1.08, post: false }), con = M.niebla.crearNiebla(T, escena, { niebla: 1.08, post: true });
  const na = sin.malla.geometry.attributes.position.count / 4, nb = con.malla.geometry.attributes.position.count / 4;
  const A = sin.malla.geometry.attributes.position.array, B = con.malla.geometry.attributes.position.array;
  for (let i = 0; i < na * 12; i++) assert.equal(A[i], B[i], 'los bancos de siempre quedan idénticos');
  assert.ok(nb - na >= 25, `siguen los bancos nuevos (${nb - na})`);
  for (let i = na; i < nb; i++) {
    const cx = (B[i * 12] + B[i * 12 + 3] + B[i * 12 + 6] + B[i * 12 + 9]) / 4, cz = (B[i * 12 + 2] + B[i * 12 + 5] + B[i * 12 + 8] + B[i * 12 + 11]) / 4;
    for (const [k, l] of Object.entries(T.lugares)) {
      if (!l || typeof l.x !== 'number') continue;
      assert.ok(Math.hypot(cx - l.x, cz - l.z) > (l.radio || 8) + 20, `el banco ${i - na} no cae sobre ${k}`);
    }
  }
}
console.log('4.0.1 molino: sendero libre de flores y cerco, arroyo pegado a la loma');
