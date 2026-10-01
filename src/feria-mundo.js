// El puesto de la feria en el mundo: una mesa con toldo a rayas al final del andén de
// la Estación del Valle, del lado contrario al tanque de agua. Sólo se ve los días de
// feria, un poco antes de que abra y un poco después de que cierre.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';

// En coordenadas de la estación: x a lo largo de la vía, z alejándose de ella. El andén
// va de x -9 a 9 y el galpón queda entre z 3.5 y 8.5; el puesto se para pasando la punta.
const LOCAL = { x: 12.5, z: 4.5 };

export function crearPuestoFeria(T, escena, estacion) {
  const rot = estacion.ang || 0;
  const x = estacion.x + LOCAL.x * Math.cos(rot) + LOCAL.z * Math.sin(rot);
  const z = estacion.z - LOCAL.x * Math.sin(rot) + LOCAL.z * Math.cos(rot);
  const y = T.altura(x, z);

  const c = new Constructor();
  const lona = '#b8452f', lona2 = '#e6dcc4', madera = '#6b5238';
  // la mesa con sus patas
  c.agregar(new THREE.BoxGeometry(2.2, 0.06, 0.9), { color: '#8a6b4a', tipo: 4, matriz: matriz([0, 0.8, 0]) });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.06, 0.8, 0.06), { color: madera, tipo: 4, matriz: matriz([sx * 1, 0.4, sz * 0.38]) });
  // el toldo a rayas, sobre cuatro palos
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 5), { color: madera, tipo: 0, matriz: matriz([sx * 1.15, 1.05, sz * 0.6]) });
  for (let i = 0; i < 6; i++) c.agregar(new THREE.BoxGeometry(0.4, 0.03, 1.5), { color: i % 2 ? lona : lona2, tipo: 2, matriz: matriz([-1 + i * 0.4, 2.1, 0], [0.12, 0, 0]) });
  // arriba de la mesa: un cajón, una bolsa y un poncho doblado
  c.agregar(new THREE.BoxGeometry(0.5, 0.25, 0.4), { color: '#7d6146', tipo: 4, matriz: matriz([-0.6, 0.96, 0]) });
  c.agregar(new THREE.SphereGeometry(0.2, 7, 5), { color: '#cdbf9e', tipo: 2, matriz: matriz([0.1, 0.98, 0.1], [0, 0, 0], [1, 0.8, 1]) });
  c.agregar(new THREE.BoxGeometry(0.5, 0.12, 0.35), { color: '#8f877a', tipo: 2, matriz: matriz([0.65, 0.9, 0]) });

  const malla = new THREE.Mesh(c.geometria(), new THREE.MeshLambertMaterial({ vertexColors: true }));
  malla.position.set(x, y, z);
  malla.rotation.y = rot;
  malla.castShadow = true;
  malla.visible = false;
  malla.name = 'feria';
  escena.add(malla);
  return { malla, x, z, y };
}
