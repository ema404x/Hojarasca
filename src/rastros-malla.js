// 2.1: dibuja las huellas de un rastro (ver `rastros.js`). Una malla instanciada por
// forma de huella; cada huella es un dibujo chato apoyado en el suelo, oscuro como el
// barro removido, que apunta hacia donde iba el animal.
import * as THREE from 'three';
import { RASTROS } from './rastros.js';

const MAX = 180;

// Junta círculos deformados en una sola geometría chata (en el plano XZ, +z adelante).
function dibujo(partes) {
  const pos = [];
  for (const [cx, cz, rx, rz] of partes) {
    const g = new THREE.CircleGeometry(1, 12).toNonIndexed();
    g.rotateX(-Math.PI / 2);
    g.scale(rx, 1, rz);
    g.translate(cx, 0, cz);
    pos.push(...g.attributes.position.array);
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}

const FORMAS = {
  // pezuña partida: dos gotas juntas, más anchas atrás
  pezuna: () => dibujo([[-0.028, 0, 0.026, 0.055], [0.028, 0, 0.026, 0.055]]),
  // zorro: la almohadilla grande, cuatro dedos y las uñas marcadas
  pata: () => dibujo([[0, -0.01, 0.03, 0.026], [-0.028, 0.035, 0.011, 0.014], [-0.01, 0.05, 0.011, 0.014], [0.01, 0.05, 0.011, 0.014], [0.028, 0.035, 0.011, 0.014]]),
  // liebre: las dos patas largas de atrás adelante, y las dos chicas atrás
  liebre: () => dibujo([[-0.035, 0.07, 0.018, 0.06], [0.035, 0.07, 0.018, 0.06], [-0.012, -0.07, 0.014, 0.02], [0.012, -0.1, 0.014, 0.02]]),
};

export function crearRastrosMalla(escena, T) {
  const material = new THREE.MeshBasicMaterial({
    color: '#2b2016', transparent: true, opacity: 0.6, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const mallas = {};
  for (const [forma, crear] of Object.entries(FORMAS)) {
    const m = new THREE.InstancedMesh(crear(), material, MAX);
    m.count = 0; m.frustumCulled = false; m.renderOrder = 2;
    escena.add(m);
    mallas[forma] = m;
  }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0);

  // Pone las huellas del rastro activo (o ninguna). `vida` de 0 a 1 las va borrando.
  function mostrar(rastro, vida = 1, invierno = 0) {
    for (const m of Object.values(mallas)) m.count = 0;
    material.opacity = 0.6 * Math.max(0, Math.min(1, vida));
    // en la nieve la huella es sombra fría, en el barro es tierra oscura
    material.color.set(invierno > 0.5 ? '#4a5160' : '#2b2016');
    if (!rastro) return;
    const R = RASTROS[rastro.especie];
    const m = mallas[R.forma];
    let n = 0;
    for (const h of rastro.huellas) {
      if (n >= MAX) break;
      _p.set(h.x, T.altura(h.x, h.z) + 0.03, h.z);
      _q.setFromAxisAngle(_y, h.rumbo);
      _s.setScalar(R.escala * 2.4);
      _m.compose(_p, _q, _s);
      m.setMatrixAt(n++, _m);
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  }
  return { mostrar, mallas };
}
