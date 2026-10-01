// El cimiento de piedra en el mundo: una hilera de piedras chatas al pie de cada
// empalizada o portón que lo tenga, de los dos lados. Todas en una sola malla
// instanciada; se rehace sólo cuando cambia qué obras tienen cimiento.
import * as THREE from 'three';

const MAX = 480;              // piedras en total (unas 12 por tramo: 40 tramos)
const POR_METRO = 1.6;

export function crearCimientos(T, escena) {
  const geo = new THREE.IcosahedronGeometry(0.2, 0);
  const mat = new THREE.MeshLambertMaterial({ color: '#8c877c' });
  const malla = new THREE.InstancedMesh(geo, mat, MAX);
  malla.count = 0;
  malla.castShadow = false;
  malla.receiveShadow = true;
  malla.frustumCulled = false;
  malla.name = 'cimientos';
  escena.add(malla);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  let firma = '';

  // `obras`: las del constructor. Sólo mira las que tienen `datos.cimiento`.
  function sincronizar(obras) {
    const con = (obras || []).filter((o) => o.datos?.cimiento);
    const nueva = con.map((o) => `${o.datos.x.toFixed(1)},${o.datos.z.toFixed(1)}`).join(';');
    if (nueva === firma) return;
    firma = nueva;
    let n = 0;
    for (const o of con) {
      const rot = o.datos.rot || 0, ancho = o.plano.ancho || 3, fondo = o.plano.fondo || 0.6;
      const cuantas = Math.max(2, Math.round(ancho * POR_METRO));
      for (const lado of [-1, 1]) {
        for (let i = 0; i < cuantas && n < MAX; i++) {
          const lx = -ancho / 2 + (i + 0.5) * (ancho / cuantas);
          const lz = lado * (fondo / 2 + 0.16);
          const x = o.datos.x + lx * Math.cos(rot) + lz * Math.sin(rot);
          const z = o.datos.z - lx * Math.sin(rot) + lz * Math.cos(rot);
          // una piedra distinta de la otra, sin azar: sale de la posición
          const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453, f = h - Math.floor(h);
          p.set(x, T.altura(x, z) + 0.05, z);
          e.set(f * 0.6, f * 6.28, (1 - f) * 0.5);
          s.set(1.1 + f * 0.4, 0.55 + f * 0.2, 0.9 + (1 - f) * 0.4);
          malla.setMatrixAt(n++, M.compose(p, q.setFromEuler(e), s));
        }
      }
    }
    malla.count = n;
    malla.instanceMatrix.needsUpdate = true;
  }
  return { malla, sincronizar };
}
