// 2.8: el tocadiscos del refugio: una vitrola de cuerda sobre la mesa, con su bocina de
// bronce, la manivela y el disco que gira mientras suena (lo hace girar
// `actualizarTocadiscos`, en `personal-musica.js`). Lo arma `objetos.js`.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { materialVegetal } from './materiales.js';

// dónde va, en las coordenadas del refugio (las mismas de `refugiovivo.js`): sobre la
// mesa, que está en (1.1, -0.98) y tiene la tabla a 0.89 m
// 3.0.1: la mesa se corrió 22 cm hacia la puerta (montaba sobre la cama): la vitrola, con ella
const SITIO = { x: 1.55, y: 0.89, z: -1.08, giro: -0.4 };

export function crearTocadiscos(T, escena) {
  const ref = T.lugares?.refugio;
  if (!ref || !Number.isFinite(ref.x) || !Number.isFinite(ref.z)) return null;
  const rot = Number.isFinite(ref.rot) ? ref.rot : 0;
  const y0 = Number.isFinite(ref.y) ? ref.y : T.altura(ref.x, ref.z);

  const mat = materialVegetal({ flex: 0, doble: true });
  const c = new Constructor();
  const CAJA = '#5a3b24', MOLDURA = '#3a2616', BRONCE = '#b08a3c';
  // la caja de nogal con su zócalo y la moldura de la tapa
  c.agregar(new THREE.BoxGeometry(0.36, 0.02, 0.32), { color: MOLDURA, tipo: 4, variar: 0.05, matriz: matriz([0, 0.01, 0]) });
  c.agregar(new THREE.BoxGeometry(0.34, 0.11, 0.3), { color: CAJA, tipo: 4, variar: 0.06, matriz: matriz([0, 0.075, 0]) });
  c.agregar(new THREE.BoxGeometry(0.35, 0.012, 0.31), { color: MOLDURA, tipo: 4, variar: 0.05, matriz: matriz([0, 0.132, 0]) });
  // el plato
  c.agregar(new THREE.CylinderGeometry(0.125, 0.125, 0.01, 24), { color: '#2a2723', tipo: 4, variar: 0, matriz: matriz([-0.03, 0.143, 0]) });
  // la manivela, a un costado
  c.agregar(new THREE.CylinderGeometry(0.007, 0.007, 0.07, 6), { color: BRONCE, tipo: 4, variar: 0, matriz: matriz([0.2, 0.07, 0.05], [0, 0, Math.PI / 2]) });
  c.agregar(new THREE.BoxGeometry(0.012, 0.05, 0.012), { color: BRONCE, tipo: 4, variar: 0, matriz: matriz([0.235, 0.05, 0.05]) });
  c.agregar(new THREE.CylinderGeometry(0.01, 0.01, 0.03, 6), { color: MOLDURA, tipo: 4, variar: 0, matriz: matriz([0.25, 0.03, 0.05], [0, 0, Math.PI / 2]) });
  // el brazo con el diafragma, apoyado sobre el disco
  c.agregar(new THREE.CylinderGeometry(0.012, 0.015, 0.04, 8), { color: BRONCE, tipo: 4, variar: 0, matriz: matriz([0.12, 0.158, -0.1]) });
  c.agregar(new THREE.CylinderGeometry(0.006, 0.006, 0.15, 6), { color: BRONCE, tipo: 4, variar: 0, matriz: matriz([0.075, 0.172, -0.04], [Math.PI / 2, -0.6435, 0]) });
  c.agregar(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 12), { color: BRONCE, tipo: 4, variar: 0, matriz: matriz([0.03, 0.162, 0.02]) });
  // la bocina: el cuello y la campana abierta, mirando hacia la sala
  c.agregar(new THREE.CylinderGeometry(0.018, 0.022, 0.13, 8), { color: BRONCE, tipo: 4, variar: 0, matriz: matriz([0.1, 0.19, -0.12]) });
  const perfil = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; perfil.push(new THREE.Vector2(0.018 + 0.13 * Math.pow(t, 2.3), t * 0.3)); }
  c.agregar(new THREE.LatheGeometry(perfil, 18), { color: BRONCE, tipo: 4, variar: 0.04, matriz: matriz([0.1, 0.245, -0.12], [0.95, 0, 0]) });

  const grupo = new THREE.Group();
  grupo.name = 'tocadiscos';
  grupo.position.set(ref.x, y0, ref.z);
  grupo.rotation.y = rot;
  const aparato = new THREE.Group();
  aparato.position.set(SITIO.x, SITIO.y, SITIO.z);
  aparato.rotation.y = SITIO.giro;
  grupo.add(aparato);
  const cuerpo = new THREE.Mesh(c.geometria(), mat);
  cuerpo.castShadow = true; cuerpo.receiveShadow = true;
  aparato.add(cuerpo);
  // el disco, aparte: gira
  const cd = new Constructor();
  cd.agregar(new THREE.CylinderGeometry(0.118, 0.118, 0.004, 28), { color: '#151311', tipo: 4, variar: 0, matriz: matriz([0, 0, 0]) });
  cd.agregar(new THREE.CylinderGeometry(0.04, 0.04, 0.005, 16), { color: '#b8342f', tipo: 4, variar: 0, matriz: matriz([0, 0.0005, 0]) });
  cd.agregar(new THREE.BoxGeometry(0.022, 0.0058, 0.006), { color: '#e8dfc8', tipo: 4, variar: 0, matriz: matriz([0.022, 0.0005, 0]) });
  const disco = new THREE.Mesh(cd.geometria(), mat);
  disco.position.set(-0.03, 0.15, 0);
  aparato.add(disco);
  escena.add(grupo);
  grupo.updateMatrixWorld(true);

  // el punto de donde sale el sonido (y el que se mira para usarlo)
  const p = new THREE.Vector3(0, 0.16, 0).applyMatrix4(aparato.matrixWorld);
  return { grupo, disco, pos: { x: p.x, y: p.y, z: p.z } };
}
