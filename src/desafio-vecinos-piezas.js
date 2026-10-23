// 4.9 aliados: lo que se ve de los vecinos de las noches grandes (three): el martillo de Anselmo y los fuegos de la abuela Herminia.
// Aparte de desafio-vecinos-mundo.js para que ese se pueda probar en Node (acá se arman mallas).
import * as THREE from 'three';
import { compactar, lam } from './vida.js';

// El martillo de Anselmo: un mango y una cabeza de hierro, en la mano.
export function mallaMartillo() {
  const g = new THREE.Group();
  const mango = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.46, 6), lam('#6b4a2e'));
  const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.09), lam('#4a4d52'));
  cabeza.position.y = 0.23;
  g.add(mango, cabeza);
  g.rotation.set(Math.PI / 2, 0, 0);
  g.position.set(0, -0.02, 0.1);
  compactar(g);
  return g;
}
// Un fuego (un fogón de piedras con leña, o un farol en un palo): la parte sólida es una sola malla, las llamas son dos conos aditivos
// y abajo un brillo en el suelo. Sin luces: el brillo y las llamas alcanzan para que de noche se vea de lejos.
const matLlama = new THREE.MeshBasicMaterial({ color: '#ff9b3a', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const matLlamaFina = new THREE.MeshBasicMaterial({ color: '#ffe9a0', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const matBrillo = new THREE.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const matVidrio = new THREE.MeshBasicMaterial({ color: '#ffd27a' });
const geoLlama = new THREE.ConeGeometry(0.26, 0.9, 7).translate(0, 0.45, 0);
const geoLlamaFina = new THREE.ConeGeometry(0.14, 0.6, 6).translate(0, 0.3, 0);
const geoBrillo = new THREE.CircleGeometry(2.6, 14).rotateX(-Math.PI / 2);
export function mallaFuego(tipo) {
  const g = new THREE.Group();
  const solida = new THREE.Group();
  if (tipo === 'fogon') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const piedra = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15 + (i % 3) * 0.03, 0), lam(i % 2 ? '#6f6a60' : '#5d5951'));
      piedra.position.set(Math.cos(a) * 0.55, 0.1, Math.sin(a) * 0.55);
      solida.add(piedra);
    }
    for (let i = 0; i < 3; i++) {
      const lenia = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 6), lam('#4a3626'));
      lenia.rotation.set(Math.PI / 2 - 0.35, (i / 3) * Math.PI * 2, 0, 'YXZ');
      lenia.position.set(0, 0.16, 0);
      solida.add(lenia);
    }
  } else {
    // el farol: un palo, un brazo y la caja de vidrio con la llama adentro
    const pieza = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); solida.add(m); };
    pieza(new THREE.CylinderGeometry(0.045, 0.06, 2.3, 6), lam('#5d4630'), 0, 1.15, 0);
    pieza(new THREE.BoxGeometry(0.4, 0.04, 0.04), lam('#5d4630'), 0.18, 2.28, 0);
    pieza(new THREE.BoxGeometry(0.3, 0.04, 0.3), lam('#3b3a38'), 0.36, 2.0, 0);
    pieza(new THREE.BoxGeometry(0.3, 0.04, 0.3), lam('#3b3a38'), 0.36, 2.26, 0);
  }
  compactar(solida);
  solida.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  g.add(solida);
  const llama = new THREE.Mesh(geoLlama, matLlama), fina = new THREE.Mesh(geoLlamaFina, matLlamaFina);
  if (tipo === 'fogon') { llama.position.y = 0.12; fina.position.y = 0.12; } else {
    llama.scale.setScalar(0.32); fina.scale.setScalar(0.32);
    llama.position.set(0.36, 2.03, 0); fina.position.set(0.36, 2.03, 0);
    const vidrio = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.22), matVidrio);
    vidrio.position.set(0.36, 2.14, 0);
    g.add(vidrio);
  }
  const brillo = new THREE.Mesh(geoBrillo, matBrillo);
  brillo.position.y = 0.08;
  brillo.scale.setScalar(tipo === 'fogon' ? 1.3 : 0.9);
  g.add(llama, fina, brillo);
  return { g, llama, fina, brillo, tipo };
}


// Lo que recibe crearVecinosMundo.
export const crearPiezasVecinos = () => ({ fuego: mallaFuego, martillo: mallaMartillo });
