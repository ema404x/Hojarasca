// 2.4: los vidrios encendidos de tu casa (ver casa-viva.js). Un solo InstancedMesh para
// todas las ventanas: una llamada de dibujo, se rehace cada tanto y no por cuadro.
import * as THREE from 'three';

export function crearVentanas(escena, max = 64) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffb867, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const malla = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, max);
  malla.count = 0;
  malla.frustumCulled = false;
  malla.renderOrder = 2;
  malla.name = 'ventanas-encendidas';
  escena.add(malla);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3(), p = new THREE.Vector3(), eje = new THREE.Vector3(0, 1, 0);

  // `lista`: [{ x, y, z, rot, ancho, alto }]; `brillo`: 0..1
  function actualizar(lista, brillo) {
    const n = Math.min(max, lista.length);
    for (let i = 0; i < n; i++) {
      const v = lista[i];
      q.setFromAxisAngle(eje, v.rot);
      p.set(v.x, v.y, v.z);
      e.set(v.ancho * 0.94, v.alto * 0.94, 1);
      malla.setMatrixAt(i, m.compose(p, q, e));
    }
    malla.count = n;
    malla.instanceMatrix.needsUpdate = true;
    mat.opacity = 0.78 * Math.max(0, Math.min(1, brillo));
    malla.visible = n > 0 && brillo > 0.01;
  }
  return { malla, actualizar };
}
