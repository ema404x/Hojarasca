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
// Todo en aditivo y con el color en los vértices: la llama se apaga hacia la punta y el brillo del suelo se apaga hacia el borde (sin bordes
// duros: en aditivo, el negro no se ve).
const aditivo = (color, opacity) => new THREE.MeshBasicMaterial({ color, vertexColors: true, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const matLlama = aditivo('#ffffff', 0.95), matLlamaFina = aditivo('#fff2b8', 0.95), matBrillo = aditivo('#ffffff', 0.38);
const matVidrio = new THREE.MeshBasicMaterial({ color: '#ffd27a' });
// una gota de fuego: panzona abajo, afinándose hacia arriba
function gota(r, alto, segmentos) {
  const perfil = [[0.001, 0], [0.62, 0.08], [1, 0.3], [0.86, 0.58], [0.5, 0.82], [0.16, 0.97], [0.001, 1.08]];
  const g = new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x * r, y * alto)), segmentos);
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, p.getY(i) / (alto * 1.08))), k = 1 - t * t * 0.92;
    c[i * 3] = k; c[i * 3 + 1] = k * 0.74; c[i * 3 + 2] = k * 0.28;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
// el brillo sobre el suelo: más fuerte en el medio, nada en el borde. Una grilla polar (5 anillos de 24 puntos) que se acomoda al terreno
// cada vez que se prende el fuego (`ajustar`): un disco chato se cortaba contra las lomas y quedaba con bordes rectos.
const ANILLOS = 5, PUNTOS = 24;
function charco(radio) {
  const n = 1 + ANILLOS * PUNTOS;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), idx = [];
  const polar = (k, j) => (k === 0 ? 0 : 1 + (k - 1) * PUNTOS + (j % PUNTOS));
  for (let k = 1; k <= ANILLOS; k++) {
    const r = (radio * k) / ANILLOS, c = Math.pow(1 - k / ANILLOS, 1.6);
    for (let j = 0; j < PUNTOS; j++) {
      const i = polar(k, j), a = (j / PUNTOS) * Math.PI * 2;
      pos[i * 3] = Math.sin(a) * r; pos[i * 3 + 2] = Math.cos(a) * r;
      col[i * 3] = c; col[i * 3 + 1] = c * 0.62; col[i * 3 + 2] = c * 0.25;
    }
  }
  col[0] = 1; col[1] = 0.62; col[2] = 0.25;
  for (let j = 0; j < PUNTOS; j++) idx.push(0, polar(1, j), polar(1, j + 1));   // (de frente hacia arriba)
  for (let k = 1; k < ANILLOS; k++) for (let j = 0; j < PUNTOS; j++) {
    const a = polar(k, j), b = polar(k, j + 1), c = polar(k + 1, j), d = polar(k + 1, j + 1);
    idx.push(a, d, b, a, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  // `altura(x, z)`: la del terreno; (x, z): dónde queda el fuego en el mundo
  const ajustar = (altura, x, z) => {
    const y0 = altura(x, z), p = g.attributes.position;
    for (let i = 0; i < n; i++) p.setY(i, Math.max(-1.5, Math.min(1.5, altura(x + p.getX(i), z + p.getZ(i)) - y0)) + 0.12);
    p.needsUpdate = true;
  };
  return { g, ajustar };
}
const geoLlama = gota(0.24, 0.85, 9), geoLlamaFina = gota(0.12, 0.55, 8);
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
  if (tipo === 'fogon') { llama.position.y = 0.12; fina.position.y = 0.12; llama.scale.setScalar(1.15); } else {
    llama.scale.setScalar(0.32); fina.scale.setScalar(0.32);
    llama.position.set(0.36, 2.03, 0); fina.position.set(0.36, 2.03, 0);
    const vidrio = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.22), matVidrio);
    vidrio.position.set(0.36, 2.14, 0);
    g.add(vidrio);
  }
  const suelo = charco(tipo === 'fogon' ? 4.2 : 2.8);   // el brillo del fogón llega a 4,2 m; el del farol, a 2,8 m
  // 4.10.3 (V2): un material de brillo por fuego (era uno para los cuatro y la última fase pisaba a las otras: pulsaban todos igual)
  const brillo = new THREE.Mesh(suelo.g, matBrillo.clone());
  brillo.frustumCulled = false;   // (su alto cambia con el terreno cada vez que se prende)
  g.add(llama, fina, brillo);
  // 4.10.3 (V2): el titileo se aplica sobre la escala con la que se armó cada llama (la del farol es 0,32 y el update la pisaba con 1: la llama salía 3,6 veces más grande
  // que su caja de vidrio). El fogón conserva lo que se veía (escala 1).
  const base = tipo === 'fogon' ? 1 : 0.32;
  const titilar = (t) => {
    llama.scale.set(base * (1 + Math.sin(t) * 0.07), base * (1 + Math.sin(t * 1.7 + 1) * 0.18), base * (1 + Math.cos(t * 1.3) * 0.07));
    fina.scale.y = base * (1 + Math.sin(t * 2.3) * 0.22);
  };
  return { g, llama, fina, brillo, tipo, ajustar: suelo.ajustar, titilar };
}


// Lo que recibe crearVecinosMundo.
export const crearPiezasVecinos = () => ({ fuego: mallaFuego, martillo: mallaMartillo });
