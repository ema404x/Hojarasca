// Sombras de contacto económicas para naturaleza RC16.
import * as THREE from 'three';
import { clamp } from './ruido.js';

export function crearSombraContacto(escena, ancho = 0.55, largo = 0.9, opacidad = 0.16) {
  const geo = new THREE.CircleGeometry(1, 18);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x17130f,
    transparent: true,
    opacity: opacidad,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(ancho, 1, largo);
  m.renderOrder = 1;
  m.frustumCulled = true;
  m.userData.opacidadBase = opacidad;
  escena.add(m);
  return m;
}

export function actualizarSombraContacto(sombra, T, pos, visible = true, factor = 1) {
  if (!sombra) return;
  sombra.visible = !!visible;
  if (!sombra.visible) return;
  sombra.position.set(pos.x, T.altura(pos.x, pos.z) + 0.018, pos.z);
  sombra.material.opacity = sombra.userData.opacidadBase * clamp(factor, 0.35, 1.15);
}
