// La Trochita: vía de trocha angosta, estación y el tren a vapor que la recorre
import * as THREE from 'three';
import { Constructor, matriz, troncoCurvo } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { lerp, clamp, smoothstep, rng } from './ruido.js';
import { compactar } from './vida.js';
import { registrarLuz } from './luces.js';
import { sanearTrochita } from './personal-trochita.js';
import { repintarVertices, cartelNombre, desechar } from './personal-mallas.js';
import { cabinaNueva, pasoCabina, enElAnden, CABINA } from './maquinista.js';
import { cubierta } from './techo-lluvia.js';
import { TREN, sanearNevada, tramoNevado, distanciaANieve } from './tren-viaje.js';

const MADERA = '#6e5238', MADERA_OSCURA = '#4e3a28', TABLA = '#8a6b4a';
const TROCHA = 0.75;          // metros entre rieles, como la de verdad
const LARGO_CHUNK = 48;

// ---------------------------------------------------------------- la vía
function construirVia(T, escena, mat) {
  const riel = T.riel;
  const chunks = [];
  const total = riel.largo;
  const cantidad = Math.ceil(total / LARGO_CHUNK);
  const durmiente = new THREE.BoxGeometry(1.55, 0.12, 0.22);
  const balasto = new THREE.BoxGeometry(2.6, 0.16, 3.4);

  const punto = (i) => riel[((i % riel.length) + riel.length) % riel.length];
  const normal = (i) => {
    const a = punto(i - 1), b = punto(i + 1);
    const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
    return { nx: -tz / l, nz: tx / l, ang: Math.atan2(tx, tz) };
  };

  let indice = 0;
  for (let c = 0; c < cantidad; c++) {
    const desde = c * LARGO_CHUNK, hasta = (c + 1) * LARGO_CHUNK;
    const con = new Constructor();
    const carriles = [[], []];
    let hubo = false;
    while (indice < riel.length && riel[indice].s < hasta + 4) {
      const p = riel[indice];
      if (p.s >= desde - 3) {
        const { nx, nz, ang } = normal(indice);
        hubo = true;
        // balasto y durmientes cada metro y medio
        con.agregar(balasto, { color: '#6f6960', tipo: 4, variar: 0.14, matriz: matriz([p.x, p.h - 0.14, p.z], [0, ang, 0]) });
        con.agregar(durmiente, { color: indice % 3 ? '#4a3b2c' : '#57452f', tipo: 4, variar: 0.1, matriz: matriz([p.x, p.h - 0.02, p.z], [0, ang, 0]) });
        for (const lado of [0, 1]) {
          const s = lado ? 1 : -1;
          carriles[lado].push(new THREE.Vector3(p.x + nx * s * TROCHA / 2, p.h + 0.09, p.z + nz * s * TROCHA / 2));
        }
      }
      indice++;
    }
    indice = Math.max(0, indice - 2);
    if (!hubo) continue;
    // los carriles entran en la misma malla del tramo: un solo dibujo por tramo
    for (const lado of [0, 1]) {
      const pts = carriles[lado];
      if (pts.length < 2) continue;
      const curva = new THREE.CatmullRomCurve3(pts);
      con.agregar(new THREE.TubeGeometry(curva, Math.max(2, pts.length), 0.045, 4, false), { color: '#8a8378', tipo: 4 });
    }
    const g = con.geometria();
    const malla = new THREE.Mesh(g, mat);
    malla.receiveShadow = true;
    malla.matrixAutoUpdate = false;
    escena.add(malla);
    const mallaCarriles = [];
    const medio = riel[Math.min(riel.length - 1, Math.floor(((desde + hasta) / 2 / total) * riel.length))];
    chunks.push({ x: medio.x, z: medio.z, mallas: [malla, ...mallaCarriles] });
  }

  // El anillo se cierra: entre el último punto y el primero quedaba un hueco sin vía
  {
    const con = new Constructor();
    const carriles = [[], []];
    for (let d = -6; d <= 6; d++) {
      const i = d < 0 ? riel.length + d : d;
      const p = punto(i);
      const { nx, nz, ang } = normal(i);
      con.agregar(balasto, { color: '#6f6960', tipo: 4, variar: 0.14, matriz: matriz([p.x, p.h - 0.14, p.z], [0, ang, 0]) });
      con.agregar(durmiente, { color: i % 3 ? '#4a3b2c' : '#57452f', tipo: 4, variar: 0.1, matriz: matriz([p.x, p.h - 0.02, p.z], [0, ang, 0]) });
      for (const lado of [0, 1]) {
        const sg = lado ? 1 : -1;
        carriles[lado].push(new THREE.Vector3(p.x + nx * sg * TROCHA / 2, p.h + 0.09, p.z + nz * sg * TROCHA / 2));
      }
    }
    for (const lado of [0, 1]) {
      const curva = new THREE.CatmullRomCurve3(carriles[lado]);
      con.agregar(new THREE.TubeGeometry(curva, carriles[lado].length * 2, 0.045, 4, false), { color: '#8a8378', tipo: 4 });
    }
    const malla = new THREE.Mesh(con.geometria(), mat);
    malla.receiveShadow = true;
    malla.matrixAutoUpdate = false;
    escena.add(malla);
    const mallas = [malla];
    chunks.push({ x: punto(0).x, z: punto(0).z, mallas });
  }
  return chunks;
}

// ---------------------------------------------------------------- puentes de la vía
function construirPuentes(T, escena, mat, col) {
  const riel = T.riel;
  for (const p of T.puentesRiel) {
    const a = riel[(p.i - 6 + riel.length) % riel.length], b = riel[(p.i + 6) % riel.length];
    const ang = Math.atan2(b.x - a.x, b.z - a.z);
    const alto = riel[p.i].h;
    const luz = p.luz;
    const c = new Constructor();
    // tablero
    c.agregar(new THREE.BoxGeometry(2.9, 0.3, luz + 4), { color: MADERA_OSCURA, tipo: 4, variar: 0.1, matriz: matriz([0, -0.35, 0]) });
    for (const lado of [-1, 1]) {
      c.agregar(new THREE.BoxGeometry(0.22, 0.55, luz + 4), { color: MADERA, tipo: 4, matriz: matriz([lado * 1.3, -0.05, 0]) });
      // baranda
      for (let z = -luz / 2 - 1.5; z <= luz / 2 + 1.5; z += 2.2) {
        c.agregar(new THREE.BoxGeometry(0.12, 1.0, 0.12), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([lado * 1.45, 0.45, z]) });
      }
      c.agregar(new THREE.BoxGeometry(0.1, 0.1, luz + 4), { color: MADERA, tipo: 0, matriz: matriz([lado * 1.45, 0.92, 0]) });
    }
    // caballetes: cada pila baja hasta el terreno
    const pilas = Math.max(2, Math.round(luz / 6));
    for (let k = 0; k <= pilas; k++) {
      const z = -luz / 2 + (luz / pilas) * k;
      const wx = p.x + Math.sin(ang) * z, wz = p.z + Math.cos(ang) * z;
      const suelo = T.altura(wx, wz);
      const h = alto - 0.5 - suelo;
      if (h < 1.2) continue;
      for (const lado of [-1, 1]) {
        c.agregar(new THREE.CylinderGeometry(0.13, 0.17, h, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([lado * 1.15, -0.5 - h / 2, z], [0, 0, lado * 0.06]) });
      }
      c.agregar(new THREE.BoxGeometry(2.9, 0.16, 0.16), { color: MADERA, tipo: 0, matriz: matriz([0, -0.5 - h * 0.55, z]) });
      if (k > 0) {
        const zAnt = z - luz / pilas;
        for (const lado of [-1, 1]) {
          const largo = Math.hypot(luz / pilas, h * 0.5);
          c.agregar(new THREE.BoxGeometry(0.1, largo, 0.1), { color: MADERA, tipo: 0, matriz: matriz([lado * 1.15, -0.5 - h * 0.55, (z + zAnt) / 2], [Math.atan2(luz / pilas, h * 0.5) * lado * 0 + Math.PI / 2 - Math.atan2(h * 0.5, luz / pilas), 0, 0]) });
        }
      }
    }
    const m = new THREE.Mesh(c.geometria(), mat);
    m.position.set(p.x, alto, p.z);
    m.rotation.y = ang;
    m.castShadow = true; m.receiveShadow = true;
    escena.add(m);
    // barandas: no se puede caminar por fuera del tablero
    for (const lado of [-1, 1]) {
      const nx = Math.cos(ang) * lado * 1.45, nz = -Math.sin(ang) * lado * 1.45;
      col.agregar({ seg: true, ax: p.x + nx - Math.sin(ang) * luz / 2, az: p.z + nz - Math.cos(ang) * luz / 2,
        bx: p.x + nx + Math.sin(ang) * luz / 2, bz: p.z + nz + Math.cos(ang) * luz / 2, r: 0.10,
        alturaMin: alto - 0.28, alturaMax: alto + 1.10 });
    }
    // El tablero es largo sobre el eje Z local del mesh. En la convención de
    // colisiones `largo` vive sobre X local, por eso el ángulo correcto es
    // PI/2 - ang. Antes se usaba ang + PI/2: en puentes diagonales la
    // plataforma quedaba girada 90° y aparecía suelo invisible a los costados.
    col.agregarPlataforma({ x: p.x, z: p.z, ang: Math.PI / 2 - ang, largo: luz + 4, ancho: 2.6, alto: alto - 0.2, espesor: 0.18 });
    p.ang = ang; p.alto = alto;
  }
}

// ---------------------------------------------------------------- pasos a nivel
function construirPasosANivel(T, escena, mat, paradas) {
  const riel = T.riel, sendero = T.sendero;
  const cruces = [];
  for (let i = 0; i < sendero.length; i++) {
    const a = sendero[i], b = sendero[(i + 1) % sendero.length];
    for (let k = 0; k < riel.length; k++) {
      const c = riel[k], d = riel[(k + 1) % riel.length];
      const den = (b.x - a.x) * (d.z - c.z) - (b.z - a.z) * (d.x - c.x);
      if (Math.abs(den) < 1e-9) continue;
      const t = ((c.x - a.x) * (d.z - c.z) - (c.z - a.z) * (d.x - c.x)) / den;
      const u = ((c.x - a.x) * (b.z - a.z) - (c.z - a.z) * (b.x - a.x)) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1) continue;
      const x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t);
      if (cruces.some((p) => Math.hypot(p.x - x, p.z - z) < 30)) continue;
      // ni sobre un puente ni dentro de un andén
      if (T.puentesRiel.some((b2) => Math.hypot(b2.x - x, b2.z - z) < b2.luz * 0.5 + 8)) continue;
      if (paradas.some((q) => Math.hypot(q.x - x, q.z - z) < 16)) continue;
      cruces.push({ x, z, i: k, alto: lerp(c.h, d.h, u), ang: Math.atan2(d.x - c.x, d.z - c.z) });
    }
  }
  for (const p of cruces) {
    const c = new Constructor();
    // tablones entre los rieles y a los costados, para cruzar caminando
    for (const dx of [-1.15, -0.5, 0.5, 1.15]) {
      c.agregar(new THREE.BoxGeometry(0.62, 0.14, 3.4), { color: dx === 0.5 || dx === -0.5 ? '#8a6b4a' : '#7a5f43', tipo: 4, variar: 0.12, matriz: matriz([dx, 0.02, 0]) });
    }
    // cruz de San Andrés a los dos lados
    for (const lado of [-1, 1]) {
      const px = lado * 2.6;
      c.agregar(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([px, 1.1, lado * 1.9]) });
      for (const giro of [0.72, -0.72]) {
        c.agregar(new THREE.BoxGeometry(1.15, 0.16, 0.06), { color: '#e6e1d4', tipo: 4, matriz: matriz([px, 2.15, lado * 1.9 + 0.06], [0, 0, giro]) });
      }
    }
    const m = new THREE.Mesh(c.geometria(), mat);
    m.position.set(p.x, p.alto, p.z);
    m.rotation.y = p.ang;
    m.receiveShadow = true;
    escena.add(m);
  }
  return cruces;
}

// ---------------------------------------------------------------- la estación
function construirParada(T, escena, col, mat, cartel, sentaderos, indiceEstacion, nombre, chica) {
  const riel = T.riel;
  const p = riel[indiceEstacion];
  const a = riel[indiceEstacion - 4], b = riel[indiceEstacion + 4];
  const ang = Math.atan2(b.x - a.x, b.z - a.z);
  const nx = Math.cos(ang), nz = -Math.sin(ang);   // perpendicular a la vía
  const y = p.h;
  const c = new Constructor();
  const W = chica ? 4.2 : 8.5, D = chica ? 3 : 5, H = chica ? 2.4 : 2.8;
  const largoAnden = chica ? 9 : 18;

  const Z0 = 6.0;          // el galpón, corrido para que el tren no lo roce
  const bordeAnden = 1.15; // distancia del filo del andén al eje de la vía
  const anchoAnden = 3.6;
  const centroAnden = bordeAnden + anchoAnden / 2;

  // andén: zócalo de piedra, tablones y filo pintado
  c.agregar(new THREE.BoxGeometry(largoAnden, 2.6, anchoAnden), { color: '#7f7a70', tipo: 4, variar: 0.1, matriz: matriz([0, -0.8, centroAnden]) });
  for (let i = 0; i < Math.round(largoAnden / 0.9); i++) {
    const x = -largoAnden / 2 + 0.45 + i * 0.9;
    c.agregar(new THREE.BoxGeometry(0.84, 0.1, anchoAnden - 0.2), { color: i % 2 ? '#93836b' : '#8a7a63', tipo: 4, variar: 0.12, matriz: matriz([x, 0.55, centroAnden]) });
  }
  c.agregar(new THREE.BoxGeometry(largoAnden, 0.14, 0.26), { color: '#d8d2c2', tipo: 4, matriz: matriz([0, 0.55, bordeAnden]) });
  c.agregar(new THREE.BoxGeometry(largoAnden, 0.5, 0.18), { color: '#6b665e', tipo: 4, variar: 0.12, matriz: matriz([0, 0.25, bordeAnden - 0.06]) });

  // galpón: zócalo, tablas verticales y friso
  c.agregar(new THREE.BoxGeometry(W + 0.5, 0.5, D + 0.5), { color: '#6f6a62', tipo: 4, variar: 0.1, matriz: matriz([0, 0.3, Z0]) });
  c.agregar(new THREE.BoxGeometry(W, 0.22, D), { color: TABLA, tipo: 4, matriz: matriz([0, 0.62, Z0]) });
  const tablas = (x0, x1, z, saltar) => {
    for (let x = x0; x < x1 - 0.01; x += 0.32) {
      if (saltar && saltar(x + 0.16)) continue;
      c.agregar(new THREE.BoxGeometry(0.3, H - 0.1, 0.12), { color: Math.round(x * 10) % 2 ? '#8a6a46' : '#7d5f3f', tipo: 4, variar: 0.09, matriz: matriz([x + 0.16, 0.72 + (H - 0.1) / 2, z]) });
    }
  };
  const hueco = chica ? 1.1 : 2.6;
  // frente al andén: puerta al medio y ventanas a los lados
  tablas(-W / 2, W / 2, Z0 - D / 2, (x) => Math.abs(x) < hueco * 0.42 || (!chica && Math.abs(Math.abs(x) - 2.9) < 0.75));
  tablas(-W / 2, W / 2, Z0 + D / 2);
  for (const lado of [-1, 1]) {
    for (let z = -D / 2; z < D / 2 - 0.01; z += 0.32) {
      c.agregar(new THREE.BoxGeometry(0.12, H - 0.1, 0.3), { color: Math.round(z * 10) % 2 ? '#8a6a46' : '#7d5f3f', tipo: 4, variar: 0.09, matriz: matriz([lado * W / 2, 0.72 + (H - 0.1) / 2, Z0 + z + 0.16]) });
    }
  }
  // friso, marco de la puerta y de las ventanas
  c.agregar(new THREE.BoxGeometry(W + 0.3, 0.22, D + 0.3), { color: '#5f462d', tipo: 4, matriz: matriz([0, H + 0.72, Z0]) });
  c.agregar(new THREE.BoxGeometry(hueco * 0.9 + 0.3, 0.16, 0.16), { color: '#5f462d', tipo: 4, matriz: matriz([0, 2.35, Z0 - D / 2 - 0.05]) });
  for (const l of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.16, 1.9, 0.16), { color: '#5f462d', tipo: 4, matriz: matriz([l * (hueco * 0.45 + 0.08), 1.35, Z0 - D / 2 - 0.05]) });
  if (!chica) for (const l of [-1, 1]) {
    c.agregar(new THREE.BoxGeometry(1.7, 0.14, 0.14), { color: '#5f462d', tipo: 4, matriz: matriz([l * 2.9, 1.05, Z0 - D / 2 - 0.05]) });
    c.agregar(new THREE.BoxGeometry(1.7, 0.14, 0.14), { color: '#5f462d', tipo: 4, matriz: matriz([l * 2.9, 2.15, Z0 - D / 2 - 0.05]) });
    for (const p2 of [-0.85, 0.85]) c.agregar(new THREE.BoxGeometry(0.14, 1.2, 0.14), { color: '#5f462d', tipo: 4, matriz: matriz([l * 2.9 + p2, 1.6, Z0 - D / 2 - 0.05]) });
    // postigos
    for (const p2 of [-1.12, 1.12]) c.agregar(new THREE.BoxGeometry(0.5, 1.1, 0.08), { color: '#4d6b52', tipo: 4, variar: 0.1, matriz: matriz([l * 2.9 + p2, 1.6, Z0 - D / 2 - 0.12]) });
  }
  // frontones
  for (const dz of [-D / 2, D / 2]) {
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-W / 2, 0, 0, W / 2, 0, 0, 0, 1.5, 0, W / 2, 0, 0, -W / 2, 0, 0, 0, 1.5, 0], 3));
    c.agregar(tri, { color: '#6a4f36', tipo: 0, matriz: matriz([0, H + 0.82, Z0 + dz]) });
  }
  // chimenea de ladrillo y reloj
  c.agregar(new THREE.BoxGeometry(0.62, 2.6, 0.62), { color: '#8a5a44', tipo: 4, variar: 0.12, matriz: matriz([-W / 2 + 1, H + 1.3, Z0 - 1.2]) });
  c.agregar(new THREE.BoxGeometry(0.78, 0.16, 0.78), { color: '#6b6660', tipo: 4, matriz: matriz([-W / 2 + 1, H + 2.6, Z0 - 1.2]) });
  if (!chica) {
    c.agregar(new THREE.CylinderGeometry(0.46, 0.46, 0.1, 16), { color: '#3b3128', tipo: 4, matriz: matriz([0, H + 1.35, Z0 - D / 2 - 0.02], [Math.PI / 2, 0, 0]) });
    c.agregar(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 16), { color: '#efe8d6', tipo: 4, matriz: matriz([0, H + 1.35, Z0 - D / 2 - 0.05], [Math.PI / 2, 0, 0]) });
    c.agregar(new THREE.BoxGeometry(0.05, 0.3, 0.04), { color: '#2a241c', tipo: 4, matriz: matriz([0, H + 1.47, Z0 - D / 2 - 0.12]) });
    c.agregar(new THREE.BoxGeometry(0.22, 0.05, 0.04), { color: '#2a241c', tipo: 4, matriz: matriz([0.08, H + 1.35, Z0 - D / 2 - 0.12]) });
  }
  // postes del alero, con ménsulas
  for (const px of chica ? [-1.6, 1.6] : [-3.4, 0, 3.4]) {
    c.agregar(new THREE.CylinderGeometry(0.11, 0.12, 2.5, 8), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([px, 1.85, bordeAnden + 0.6]) });
    for (const l of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.5, 0.1, 0.1), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([px + l * 0.22, 2.92, bordeAnden + 0.6], [0, 0, l * 0.7]) });
  }
  // banco del andén
  c.agregar(new THREE.BoxGeometry(2.2, 0.1, 0.48), { color: TABLA, tipo: 4, matriz: matriz([chica ? 1.4 : 3.2, 1.03, centroAnden + 0.6]) });
  c.agregar(new THREE.BoxGeometry(2.2, 0.55, 0.1), { color: TABLA, tipo: 4, matriz: matriz([chica ? 1.4 : 3.2, 1.3, centroAnden + 0.85]) });
  for (const dx of [-0.9, 0.9]) c.agregar(new THREE.BoxGeometry(0.12, 0.5, 0.44), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([(chica ? 1.4 : 3.2) + dx, 0.78, centroAnden + 0.6]) });
  // farol de andén
  c.agregar(new THREE.CylinderGeometry(0.07, 0.08, 2.4, 6), { color: '#3f3830', tipo: 0, matriz: matriz([-largoAnden / 2 + 1.2, 1.75, centroAnden + 1.1]) });
  c.agregar(new THREE.BoxGeometry(0.3, 0.34, 0.3), { color: '#3f3830', tipo: 4, matriz: matriz([-largoAnden / 2 + 1.2, 3.1, centroAnden + 1.1]) });
  c.agregar(new THREE.ConeGeometry(0.26, 0.16, 4), { color: '#3f3830', tipo: 4, matriz: matriz([-largoAnden / 2 + 1.2, 3.35, centroAnden + 1.1]) });
  if (!chica) {
    // carro de equipaje y unos cajones
    c.agregar(new THREE.BoxGeometry(1.9, 0.18, 0.95), { color: TABLA, tipo: 4, matriz: matriz([-3.6, 1.12, centroAnden + 0.2]) });
    for (const dx of [-0.7, 0.7]) c.agregar(new THREE.CylinderGeometry(0.28, 0.28, 0.09, 10), { color: '#4a3b2c', tipo: 4, matriz: matriz([-3.6 + dx, 0.88, centroAnden + 0.2], [0, 0, Math.PI / 2]) });
    c.agregar(new THREE.BoxGeometry(0.62, 0.5, 0.5), { color: '#7d5f3f', tipo: 4, variar: 0.12, matriz: matriz([-3.9, 1.46, centroAnden + 0.2]) });
    c.agregar(new THREE.BoxGeometry(0.5, 0.42, 0.45), { color: '#8a6a46', tipo: 4, variar: 0.12, matriz: matriz([-3.2, 1.42, centroAnden + 0.35]) });
    // tanque de agua para la locomotora
    c.agregar(new THREE.CylinderGeometry(1.5, 1.5, 2.4, 12), { color: '#5d6b63', tipo: 4, variar: 0.08, matriz: matriz([-11, 4.4, centroAnden - 0.2]) });
    c.agregar(new THREE.ConeGeometry(1.65, 0.6, 12), { color: '#49514a', tipo: 4, matriz: matriz([-11, 5.9, centroAnden - 0.2]) });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      c.agregar(new THREE.CylinderGeometry(0.11, 0.13, 3.2, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([-11 + sx, 1.6, centroAnden - 0.2 + sz]) });
    }
    c.agregar(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 6), { color: '#49514a', tipo: 4, matriz: matriz([-11, 3.3, bordeAnden + 0.3], [0.55, 0, 0]) });
  }
  // 2.9: el puesto de cargas (ver `comercio.js`): en la estación grande, el carro de
  // equipaje; en las chicas, unos cajones. Al lado, la pizarra con los precios del día.
  const puestoX = chica ? -3.3 : -3.6, puestoZ = chica ? 3.0 : 2.2;
  if (chica) {
    c.agregar(new THREE.BoxGeometry(0.66, 0.5, 0.5), { color: '#7d5f3f', tipo: 4, variar: 0.12, matriz: matriz([puestoX - 0.2, 0.85, puestoZ + 0.95]) });
    c.agregar(new THREE.BoxGeometry(0.5, 0.4, 0.44), { color: '#8a6a46', tipo: 4, variar: 0.12, matriz: matriz([puestoX + 0.45, 0.8, puestoZ + 1.0]) });
    c.agregar(new THREE.BoxGeometry(0.5, 0.36, 0.44), { color: '#8a6a46', tipo: 4, variar: 0.12, matriz: matriz([puestoX - 0.15, 1.28, puestoZ + 0.95]) });
  }
  c.agregar(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([puestoX - 1.0, 1.45, puestoZ + 0.9]) });
  c.agregar(new THREE.BoxGeometry(0.9, 0.62, 0.05), { color: '#2b2f2a', tipo: 4, matriz: matriz([puestoX - 1.0, 1.95, puestoZ + 0.86]) });
  c.agregar(new THREE.BoxGeometry(0.98, 0.07, 0.07), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([puestoX - 1.0, 2.29, puestoZ + 0.86]) });

  const grupo = new THREE.Group();
  grupo.position.set(p.x, y, p.z);
  const rot = ang + Math.PI / 2;   // local X corre paralelo a la vía; local Z se aleja de ella
  grupo.rotation.y = rot;
  const malla = new THREE.Mesh(c.geometria(), mat);
  malla.castShadow = true; malla.receiveShadow = true;
  grupo.add(malla);
  // techo en dos aguas, con alero largo del lado del andén
  const t = new Constructor();
  t.agregar(new THREE.BoxGeometry(W + 1.4, 0.16, D + 1.2), { color: '#4e4038', tipo: 4 });
  const techoGeo = t.geometria();
  const incl = Math.atan2(1.5, W / 2);
  for (const lado of [-1, 1]) {
    const m = new THREE.Mesh(techoGeo, mat);
    m.position.set(lado * (W / 4), H + 1.55, Z0);
    m.rotation.z = -lado * incl;
    m.castShadow = true;
    grupo.add(m);
  }
  const anchoAlero = chica ? 3.2 : 4.2;
  const alero = new THREE.Mesh(new THREE.BoxGeometry(W + 2.2, 0.16, anchoAlero), new THREE.MeshLambertMaterial({ color: 0x5a4a3e }));
  alero.position.set(0, 3.02, bordeAnden + 1.1);
  alero.rotation.x = -0.14;
  alero.castShadow = true;
  grupo.add(alero);
  for (const sx of [-W / 2 + 0.3, W / 2 - 0.3]) {
    void sx;
  }
  const vidrio = new THREE.MeshBasicMaterial({ color: 0x23201b });
  for (const vx of chica ? [0] : [-2.8, 2.8]) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.0), vidrio);
    v.position.set(vx, 1.6, Z0 - D / 2 - 0.02);
    grupo.add(v);
  }
  const luz = new THREE.PointLight(0xffb070, 0, 18, 1.6);
  luz.position.set(0, 2.2, Z0);
  grupo.add(luz);
  registrarLuz(luz);   // 2.7.4: ver luces.js
  escena.add(grupo);

  const w = (lx, lz) => ({ x: p.x + lx * Math.cos(rot) + lz * Math.sin(rot), z: p.z - lx * Math.sin(rot) + lz * Math.cos(rot) });
  // paredes del galpón
  const pared = (a2, b2) => { const A = w(...a2), B = w(...b2); col.agregar({ seg: true,
    ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.16,
    alturaMin: y - 0.18, alturaMax: y + H + 0.78 }); };
  // 3.0.1: junto a la puerta la cápsula termina su radio antes: su punta redonda cerraba
  // el vano (en las paradas chicas quedaban 78 cm para un cuerpo de 70)
  pared([-W / 2, Z0 - D / 2], [-hueco * 0.5 - 0.16, Z0 - D / 2]);
  pared([hueco * 0.5 + 0.16, Z0 - D / 2], [W / 2, Z0 - D / 2]);
  pared([-W / 2, Z0 + D / 2], [W / 2, Z0 + D / 2]);
  pared([-W / 2, Z0 - D / 2], [-W / 2, Z0 + D / 2]);
  pared([W / 2, Z0 - D / 2], [W / 2, Z0 + D / 2]);
  const anden = w(0, centroAnden);
  col.agregarPlataforma({ x: anden.x, z: anden.z, ang: -rot, largo: largoAnden, ancho: anchoAnden, alto: y + 0.6, espesor: 0.20 });
  // 3.0.1: el andén está a 60 cm de la vía y no tenía por dónde subirse caminando: en las
  // paradas chicas el terreno queda 20 a 50 cm más abajo y el escalón no alcanzaba, así que
  // el andén, la sala de espera y el puesto de cargas sólo se pisaban bajando del tren.
  // Escalones de piedra en las puntas (en la grande, sólo del lado sin el tanque de agua).
  for (const lado of chica ? [-1, 1] : [1]) {
    const ex = new Constructor();
    let tope = 0.6, n = 0;
    for (let k = 0; k < 8; k++) {
      const lx = lado * (largoAnden / 2 + 0.22 + k * 0.42), lz = centroAnden + 0.3;
      const q = w(lx, lz);
      const suelo = T.altura(q.x, q.z) - y;
      if (k === 0 && suelo > 0.42) break;
      tope = Math.max(suelo + 0.08, tope - 0.2);
      const alto = tope - suelo + 0.15;
      ex.agregar(new THREE.BoxGeometry(0.44, alto, 2.4), { color: k % 2 ? '#7f7a70' : '#77726a', tipo: 4, variar: 0.1, matriz: matriz([lx, tope - alto / 2, lz]) });
      col.agregarPlataforma({ x: q.x, z: q.z, ang: -rot, largo: 0.44, ancho: 2.4, alto: y + tope, espesor: alto });
      n++;
      if (tope - suelo < 0.1) break;
    }
    if (n) {
      const m = new THREE.Mesh(ex.geometria(), mat);
      m.position.set(p.x, y, p.z); m.rotation.y = rot;
      m.castShadow = true; m.receiveShadow = true;
      escena.add(m);
    }
  }
  const piso = w(0, Z0);
  col.agregarPlataforma({ x: piso.x, z: piso.z, ang: -rot, largo: W, ancho: D, alto: y + 0.73, espesor: 0.18 });
  if (!chica) {
    const tanque = w(-11, centroAnden - 0.2);
    // El depósito elevado ya no es un cilindro invisible desde el suelo hasta el
    // cielo: se puede caminar entre las patas, y sólo chocan las patas y la cuba.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const pata = w(-11 + sx, centroAnden - 0.2 + sz);
      col.agregar({ x: pata.x, z: pata.z, r: 0.13, alturaMin: y - 0.10, alturaMax: y + 3.25 });
    }
    col.agregar({ x: tanque.x, z: tanque.z, r: 1.52, alturaMin: y + 3.15, alturaMax: y + 6.25 });
  }
  const banco = w(chica ? 1.4 : 3.2, centroAnden + 0.6);
  sentaderos.push({ x: banco.x, z: banco.z, y: y + 1.03, nombre: `el banco de ${nombre.toLowerCase()}`, mira: rot + Math.PI / 2 });
  const cc = w(chica ? 3.6 : 6.4, centroAnden + 2.2);
  cartel(nombre, cc.x, cc.z, rot + Math.PI);

  return {
    x: p.x, z: p.z, y, ang: rot, nombre, chica, vidrio, luz,
    s: p.s, anden, indice: indiceEstacion,
    espera: { x: anden.x, z: anden.z, y: y + 0.6 },
    cargas: { ...w(puestoX, puestoZ), y: y + 0.6 },   // 2.9: donde se para uno para comerciar
    // 3.6.2 (visual): abajo del techo del galpón y del alero del andén no llueve (ver techo-lluvia.js)
    cubiertas: [
      cubierta(p, rot, -W / 2 - 0.7, W / 2 + 0.7, Z0 - D / 2 - 0.6, Z0 + D / 2 + 0.6, y + H + 2.22, { ab: -1.5 / (W / 2) }),
      cubierta(p, rot, -(W + 2.2) / 2, (W + 2.2) / 2, bordeAnden + 1.1 - anchoAlero / 2, bordeAnden + 1.1 + anchoAlero / 2,
        y + 2.95 - (bordeAnden + 1.1) * Math.sin(0.14), { az: Math.sin(0.14) }),
    ],
  };
}

// ---------------------------------------------------------------- el tren
function construirTren(mat) {
  const g = new THREE.Group();
  const negro = new THREE.MeshLambertMaterial({ color: 0x2a2723 });
  const rojo = new THREE.MeshLambertMaterial({ color: 0x7c2f22 });
  const madera = new THREE.MeshLambertMaterial({ color: 0x6b4a2e });
  const bronce = new THREE.MeshLambertMaterial({ color: 0x8d7a44 });
  const techo = new THREE.MeshLambertMaterial({ color: 0x4a4540 });

  const bancoMat = new THREE.MeshLambertMaterial({ color: 0x8a6b4a });
  const caja = (material, [sx, sy, sz], [px, py, pz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
    m.position.set(px, py, pz);
    return m;
  };
  const ruedas = [];
  const rueda = (padre, x, lado, radio) => {
    const eje = new THREE.Group();
    const r = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, 0.08, 10), negro);
    r.rotation.z = Math.PI / 2;
    r.position.set(lado * (TROCHA / 2 + 0.06), radio, x);
    const raya = new THREE.Mesh(new THREE.BoxGeometry(0.09, radio * 1.5, 0.05), bronce);
    r.add(raya);
    eje.add(r);
    padre.add(eje);
    ruedas.push({ malla: r, radio });
  };

  // locomotora
  const loco = new THREE.Group();
  const caldera = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.6, 12), negro);
  caldera.rotation.x = Math.PI / 2; caldera.position.set(0, 1.05, 0.5);
  const frente = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.16, 12), rojo);
  frente.rotation.x = Math.PI / 2; frente.position.set(0, 1.05, 1.82);
  const cabina = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 1.2), madera);
  cabina.position.set(0, 1.35, -1.25);
  const techoCab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 1.5), techo);
  techoCab.position.set(0, 2.05, -1.25);
  const chimenea = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.75, 10), negro);
  chimenea.position.set(0, 1.78, 1.45);
  const boca = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.2, 10), negro);
  boca.position.set(0, 2.14, 1.45);
  const domo = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 6), bronce);
  domo.position.set(0, 1.45, 0.35);
  const faroGrupo = new THREE.Group();
  const faro = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 10), bronce.clone());
  faro.rotation.x = Math.PI / 2; faro.position.set(0, 1.55, 1.85);
  faroGrupo.add(faro);
  const quitapiedras = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 4), negro);
  quitapiedras.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
  quitapiedras.position.set(0, 0.45, 2.15);
  const bastidor = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 4.2), negro);
  bastidor.position.set(0, 0.6, 0.2);
  loco.add(caldera, frente, cabina, techoCab, chimenea, boca, domo, faroGrupo, quitapiedras, bastidor);
  for (const z of [1.2, 0.2, -0.8]) for (const l of [-1, 1]) rueda(loco, z, l, 0.35);
  g.add(loco);

  // ténder
  const tender = new THREE.Group();
  const cajaT = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 1.9), madera);
  cajaT.position.set(0, 1.0, 0);
  const carbon = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.2, 1.6), negro);
  carbon.position.set(0, 1.52, 0);
  tender.add(cajaT, carbon);
  tender.position.z = -2.6;
  for (const z of [0.6, -0.6]) for (const l of [-1, 1]) rueda(tender, z, l, 0.3);
  g.add(tender);

  // dos coches de pasajeros
  const coches = [];
  for (let i = 0; i < 2; i++) {
    const coche = new THREE.Group();
    const L = 5.2, W2 = 1.5, altoPiso = 0.72;
    // piso y bastidor
    coche.add(caja(madera, [W2, 0.14, L], [0, altoPiso, 0]));
    coche.add(caja(negro, [W2 - 0.2, 0.2, L - 0.3], [0, altoPiso - 0.18, 0]));
    // paredes con ventanas de verdad: antepecho, pilares y franja alta
    for (const l of [-1, 1]) {
      coche.add(caja(madera, [0.09, 0.85, L], [l * (W2 / 2 - 0.05), altoPiso + 0.5, 0]));      // antepecho
      coche.add(caja(rojo, [0.11, 0.16, L], [l * (W2 / 2 - 0.05), altoPiso + 0.98, 0]));       // franja
      coche.add(caja(madera, [0.09, 0.42, L], [l * (W2 / 2 - 0.05), altoPiso + 1.73, 0]));     // sobre las ventanas
      for (let k = -2.5; k <= 2.5; k += 1) coche.add(caja(madera, [0.1, 0.72, 0.12], [l * (W2 / 2 - 0.05), altoPiso + 1.4, k]));
    }
    // testeros con puerta
    for (const z of [-1, 1]) {
      coche.add(caja(madera, [0.45, 1.9, 0.1], [-0.52, altoPiso + 0.95, z * L / 2]));
      coche.add(caja(madera, [0.45, 1.9, 0.1], [0.52, altoPiso + 0.95, z * L / 2]));
      coche.add(caja(madera, [1.55, 0.25, 0.12], [0, altoPiso + 1.78, z * L / 2]));
    }
    // techo curvo
    coche.add(caja(techo, [W2 + 0.2, 0.14, L + 0.3], [0, altoPiso + 1.97, 0]));
    coche.add(caja(techo, [W2 - 0.5, 0.12, L + 0.1], [0, altoPiso + 2.06, 0]));
    const chimeneaC = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.45, 8), negro);
    chimeneaC.position.set(0.45, altoPiso + 2.3, 1.6);
    coche.add(chimeneaC);
    // asientos de madera enfrentados, con respaldo
    const asientos = [];
    for (let k = -2; k <= 2; k++) for (const l of [-1, 1]) {
      const banco = new THREE.Group();
      banco.position.set(l * 0.45, altoPiso, k * 1.0);
      banco.add(caja(bancoMat, [0.52, 0.09, 0.85], [0, 0.42, 0]));
      banco.add(caja(bancoMat, [0.1, 0.55, 0.85], [l * 0.24, 0.68, 0]));
      coche.add(banco);
      asientos.push({ x: l * 0.45, z: k * 1.0, lado: l, coche: i });
    }
    // farol del techo
    const farolGrupo = new THREE.Group();
    const farolC = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2a2620 }));
    farolC.position.set(0, altoPiso + 1.85, 0);
    farolGrupo.add(farolC);
    coche.add(farolGrupo);
    // plataformas abiertas en las dos puntas, con baranda
    for (const z of [-1, 1]) {
      coche.add(caja(madera, [W2, 0.12, 0.8], [0, altoPiso - 0.02, z * (L / 2 + 0.45)]));
      for (const l of [-1, 1]) {
        coche.add(caja(negro, [0.07, 0.9, 0.07], [l * (W2 / 2 - 0.1), altoPiso + 0.45, z * (L / 2 + 0.8)]));
        coche.add(caja(negro, [0.07, 0.07, 0.8], [l * (W2 / 2 - 0.1), altoPiso + 0.9, z * (L / 2 + 0.45)]));
      }
      coche.add(caja(negro, [W2 - 0.2, 0.07, 0.07], [0, altoPiso + 0.9, z * (L / 2 + 0.8)]));
    }
    coche.userData.asientos = asientos;
    coche.userData.farol = farolC;
    coche.userData.plataforma = { z: -(L / 2 + 0.6), alto: altoPiso };
    coche.position.z = -5.2 - i * 6.6;
    for (const z of [1.9, -1.9]) for (const l of [-1, 1]) rueda(coche, z, l, 0.3);
    g.add(coche);
    coches.push(coche);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(loco); compactar(tender); for (const c of coches) compactar(c);
  const luzFaro = new THREE.SpotLight(0xffe2ab, 0, 70, 0.42, 0.6, 1.2);
  luzFaro.position.set(0, 1.55, 1.9);
  const blancoFaro = new THREE.Object3D();
  blancoFaro.position.set(0, 0.4, 16);
  loco.add(luzFaro, blancoFaro);
  luzFaro.target = blancoFaro;
  const luzCoche = new THREE.PointLight(0xffc98a, 0, 6, 1.6);
  g.add(luzCoche);
  // 2.7.4: el tren se oculta lejos y eso cambia la cantidad de luces: se anotan para que
  // los programas de la cantidad nueva estén compilados antes (ver luces.js)
  registrarLuz(luzFaro); registrarLuz(luzCoche);
  void mat;
  return { g, ruedas, coches, loco, tender, faro, luzFaro, luzCoche };
}

// ---------------------------------------------------------------- todo junto
export function crearTrochita(T, escena, col, sonido, opciones) {
  const mat = materialVegetal({ flex: 0 });
  const r = rng(1922);
  const riel = T.riel;
  const total = riel.largo;
  const chunks = construirVia(T, escena, mat);
  construirPuentes(T, escena, mat, col);

  // ---------- cuatro paradas repartidas por el anillo ----------
  const paradas = [];
  const sitios = [];
  const sobrePuente = (i) => riel[i].sobrePuente || (riel[i].cercaPuente || 0) > 0.55;
  for (let k = 0; k < 4; k++) {
    const objetivo = (k / 4) * total;
    let mejor = -1, puntaje = Infinity;
    for (let i = 0; i < riel.length; i++) {
      const p = riel[i];
      let d = Math.abs(p.s - objetivo);
      d = Math.min(d, total - d);
      if (d > total * 0.1 || sobrePuente(i)) continue;
      if (paradas.some((q) => Math.abs(q.indice - i) < 40)) continue;
      let desnivel = 0;
      for (let j = -16; j <= 16; j++) desnivel = Math.max(desnivel, Math.abs(riel[(i + j + riel.length) % riel.length].h - p.h));
      const kk = T.indice(p.x, p.z);
      const cerca = Math.min(90, T.distSendero[kk]);
      const pt = desnivel * 12 + cerca * 0.25 + d * 0.02;
      if (pt < puntaje) { puntaje = pt; mejor = i; }
    }
    if (mejor < 0) continue;
    sitios.push({ i: mejor, x: riel[mejor].x, z: riel[mejor].z });
  }
  // los nombres se reparten según qué hay cerca; la estación grande, la más pegada al refugio
  const cercanos = [
    ['refugio', 'Estación del Valle'], ['mallin', 'Parada del Mallín'], ['faro', 'Apeadero del Faro'],
    ['arrayanes', 'Parada Arrayanes'], ['puesto', 'Parada Alta'], ['molino', 'Parada del Molino'],
    ['casa-te', 'Apeadero de la Casa de Té'], ['mirador', 'Parada del Mirador'], ['cabana', 'Apeadero del Pescador'],
  ];
  const principal = sitios.reduce((a, b) => {
    const ref = T.lugares.refugio;
    return Math.hypot(b.x - ref.x, b.z - ref.z) < Math.hypot(a.x - ref.x, a.z - ref.z) ? b : a;
  }, sitios[0]);
  // (3.6: con los lugares que se pasen, para saber también cómo se llamaba antes cada parada)
  const nombrar = (lugares) => {
    const usados = new Set();
    return sitios.map((sitio) => {
      let nombre = sitio === principal ? 'Estación del Valle' : null;
      if (!nombre) {
        let mejorN = 'Parada del Bosque', mejorD = Infinity;
        for (const [clave, texto] of cercanos) {
          const l = lugares[clave];
          if (!l || usados.has(texto) || texto === 'Estación del Valle') continue;
          const d = Math.hypot(l.x - sitio.x, l.z - sitio.z);
          if (d < mejorD) { mejorD = d; mejorN = texto; }
        }
        nombre = mejorN;
      }
      usados.add(nombre);
      return nombre;
    });
  };
  const nombres = nombrar(T.lugares);
  // 3.6: `opciones.lugaresAntes`: dónde estaban los lugares que en el Relax se mudaron a la aldea
  // (la casa de té y el almacén): con eso sale el nombre que tenía antes cada parada
  const nombresAntes = opciones.lugaresAntes ? nombrar({ ...T.lugares, ...opciones.lugaresAntes }) : nombres;
  sitios.forEach((sitio, k) => {
    let nombre = nombres[k];
    // 3.6: en el Relax la parada del sur es la de la Aldea de los Duendes (ver aldea.js): su
    // cartel y los anuncios del tren dicen eso. `nombreAntes` es el de siempre (el que sigue
    // teniendo en el Desafío), para pasar al nombre nuevo lo guardado del comercio.
    const deLaAldea = !!opciones.aldea && sitio.i === opciones.aldea.indice;
    const antes = nombresAntes[k];
    if (deLaAldea) nombre = opciones.aldea.nombre;
    const parada = construirParada(T, escena, col, mat, opciones.cartel, opciones.sentaderos, sitio.i, nombre, sitio !== principal);
    if (deLaAldea) parada.aldea = true;
    if (antes !== nombre) parada.nombreAntes = antes;
    paradas.push(parada);
  });
  paradas.sort((a, b) => a.s - b.s);
  const estacion = paradas.find((p) => !p.chica) || paradas[0];
  T.lugares.estacion = estacion;
  paradas.forEach((p, i) => { p.orden = i; });

  const cruces = construirPasosANivel(T, escena, mat, paradas);

  // 3.7.3: `opciones.armarTren` arma el tren mejorado del Relax (ver tren.js) con la misma forma
  // (g, loco, tender, coches, faro, luzFaro, luzCoche) y además `colocar` (dónde va cada vagón),
  // `offCoches` (cuánto atrás de la locomotora va cada coche), `boca` (la chimenea), `alActualizar`,
  // `lugares()` (dónde se viaja en cada vagón), `puertas()` (por dónde se sube), `adelanto` (cuánto pasa la
  // locomotora del poste al parar: el primer coche de pasajeros queda frente al andén) y `version` (cambia
  // cuando el taller cambia la composición). En el Desafío, el tren de siempre (`construirTren`).
  const tren = opciones.armarTren ? opciones.armarTren({ mat, trocha: TROCHA, escena }) : construirTren(mat);
  const offCoche = (i) => (tren.offCoches ? tren.offCoches[i] : -5.2 - i * 6.6);
  // 3.8.4: la locomotora sola (el taller tiene vagones y no enganchaste ninguno): sin coches, ni puerta ni guarda
  const hayCoches = () => !tren.offCoches || tren.offCoches.length > 0;
  // dónde para la locomotora en cada parada (con el tren de siempre, en el poste)
  const poste = (p) => p.s + (tren.adelanto || 0);
  // dónde va el maquinista en la cabina: metros adelante (negativo: atrás) del centro de la locomotora, al costado
  // y sobre el riel (3.7.3: la cabina de la Baldwin es más larga y más alta)
  const CAB = tren.cabina || { z: -1.0, x: 0.42, y: 0.72 };
  escena.add(tren.g);
  // 2.8: lo personal (ver `personalizar`): la pintura de siempre y sin nombre
  let personal = sanearTrochita(null), placas = [];
  const humo = (() => {
    const N = 34;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const mat2 = new THREE.PointsMaterial({ color: 0xb9b4ac, size: 1.5, sizeAttenuation: true, transparent: true, opacity: 0.6, depthWrite: false });
    const p = new THREE.Points(geo, mat2);
    p.frustumCulled = false;
    escena.add(p);
    return { puntos: p, vidas: Array.from({ length: N }, () => r()) };
  })();

  const est = {
    s: (paradas[0].s + total * 0.2) % total, vel: 0, objetivo: 7, parado: 0, silbato: 3, chaca: 0,
    subido: false, empujando: 0, proxima: paradas[1] || paradas[0], avisoSilbato: false, asiento: 0, campana: 0, frenos: 0, luzUltima: -1, recorrido: 0,
    // 2.9: el jugador de maquinista (ver `maquinista.js`): la cabina, el andén en que
    // paró (null andando o entre paradas), la llegada recién hecha y el silbato propio
    conduce: false, cabina: cabinaNueva(), paradaCabina: null, llegada: null, silbar: 0, angCabina: 0,
  };
  const tmp = new THREE.Vector3();
  // 3.7.3: la vía nevada (ver `taparVia`, más abajo)
  const SIN_NIEVE = Object.freeze({ tope: Infinity, frena: 0, plantado: false, adentro: false });
  est.nevada = []; est.esperaNieve = 0; est.avisoNieve = null;
  let nieveAhora = SIN_NIEVE;   // (la del cuadro: la usa `manejar`)
  const conQuitanieves = () => !!(opciones.quitanieves ? opciones.quitanieves() : tren.estado?.loco?.quitanieves);

  // asientos posibles: dos coches × cinco filas × dos ventanillas, más la plataforma abierta
  // (3.7.3: con el tren mejorado, los lugares de cada vagón de la composición: `tren.lugares()`; se rehacen
  // cuando el taller cambia la composición)
  const ASIENTOS = [];
  let versionAsientos = -1;
  function armarAsientos() {
    ASIENTOS.length = 0;
    versionAsientos = tren.version ?? 0;
    if (tren.lugares) { for (const l of tren.lugares()) ASIENTOS.push(l); return; }
    for (let c = 0; c < 2; c++) {
      for (let fila = -2; fila <= 2; fila++) for (const lado of [-1, 1]) ASIENTOS.push({ coche: c, z: fila * 1.0, x: lado * 0.45, lado });
    }
    ASIENTOS.push({ coche: 1, z: -3.2, x: 0, lado: 0, plataforma: true });
  }
  armarAsientos();
  // a lo largo del tren, dónde queda un asiento (metros detrás de la locomotora)
  const largoDe = (a) => offCoche(a.coche) + a.z;

  const delta = (a, b) => { let d = b - a; while (d < 0) d += total; while (d > total) d -= total; return d; };

  function enVia(s) {
    const sc = ((s % total) + total) % total;
    let lo = 0, hi = riel.length;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if ((riel[m] ? riel[m].s : total) < sc) lo = m; else hi = m; }
    const a = riel[lo], b = riel[hi % riel.length];
    const sb = hi >= riel.length ? total : b.s;
    const t = (sc - a.s) / Math.max(0.001, sb - a.s);
    return {
      x: lerp(a.x, b.x, t), y: lerp(a.h, b.h, t), z: lerp(a.z, b.z, t),
      ang: Math.atan2(b.x - a.x, b.z - a.z), pend: (b.h - a.h) / Math.max(0.001, sb - a.s),
    };
  }

  function colocarVagon(obj, s, offset) {
    const p = enVia(s + offset);
    obj.position.set(p.x, p.y, p.z);
    obj.rotation.set(-Math.atan(p.pend), p.ang, 0, 'YXZ');
  }

  function siguienteParada(desde) {
    let mejor = paradas[0], mejorD = Infinity;
    for (const p of paradas) {
      const d = delta(desde, poste(p));
      if (d > 3 && d < mejorD) { mejorD = d; mejor = p; }
    }
    return mejor;
  }

  function actualizar(dt, jugador, camara, mundo) {
    // 2.9: el tren que manejás se congela con la pausa o un panel abierto (ver `ctxTren.pausado`
    // en main.js): sin tiempo no rueda, no humea ni suena, y sigue igual al volver
    if (est.conduce && mundo?.pausado) dt = 0;
    const js = jugador.estado;
    if ((tren.version ?? 0) !== versionAsientos) {
      // 3.7.3: el taller cambió la composición: los lugares nuevos (el que viajaba, al más cercano)
      const antes = est.subido && !est.conduce ? ASIENTOS[est.asiento] : null;
      armarAsientos();
      if (antes) est.asiento = asientoMasCerca(largoDe(antes), antes.x);
      else est.asiento = Math.min(est.asiento, Math.max(0, ASIENTOS.length - 1));
    }
    const cabeza = enVia(est.s);
    const lejos = Math.hypot(cabeza.x - js.pos.x, cabeza.z - js.pos.z);
    const visible = lejos < 340 || est.subido;
    tren.g.visible = visible;
    humo.puntos.visible = visible && lejos < 280;

    const falta = delta(est.s, poste(est.proxima));
    // 3.7.3: la vía nevada adelante (ver `taparVia`)
    const nieve = nieveAhora = nieveAdelante(dt);
    est.enNieve = nieve.adentro;
    // 2.9: con el jugador en la cabina, el tren es suyo (ver `manejar`)
    if (est.conduce) manejar(dt, mundo, cabeza, visible);
    // 2.3: varado en el Desafío (ver `desafio-varada.js`): el que mueve el tren es la
    // escolta, de a poco; acá sólo se dibuja donde quedó
    else if (est.varado) {
      est.vel = est.velVarado || 0;
      est.parado = 0;
    } else if (est.parado > 0) {
      est.parado -= dt;
      est.vel = 0;
      if (est.parado <= 0) {
        est.proxima = siguienteParada(est.s);
        est.avisoSilbato = false;
        pitar(cabeza);
      }
    } else {
      const frenando = falta < 60;
      const objetivo = frenando ? Math.max(1.1, falta * 0.13) : est.objetivo;
      // 3.7.3: con nieve adelante, sin quitanieves se para antes; con, pasa despacio
      est.vel = lerp(est.vel, Math.min(objetivo, nieve.tope), 1 - Math.exp(-dt * (nieve.tope < objetivo ? 1.4 : 0.55)));
      if (nieve.plantado) est.vel = 0;
      est.s = (est.s + est.vel * dt) % total;
      if (est.subido) est.recorrido += est.vel * dt;
      if (falta < 140 && falta > 120 && !est.avisoSilbato) { est.avisoSilbato = true; if (visible) pitar(cabeza); }
      if (frenando && est.vel > 1.2) {
        est.frenos -= dt;
        if (est.frenos <= 0 && visible) { sonido.frenos(cabeza, Math.min(1, est.vel / 6)); est.frenos = 0.8; }
      }
      if (falta < 1.4 && est.vel < 2) {
        est.vel = 0; est.s = poste(est.proxima) % total; est.parado = 45 + r() * 25;
        pitar(cabeza);
        if (visible) sonido.campana(cabeza);
      }
    }

    if (tren.colocar) tren.colocar(enVia, est.s);
    else {
      colocarVagon(tren.loco, est.s, 0);
      colocarVagon(tren.g.children[1], est.s, -2.6);
      tren.coches.forEach((coche, i) => colocarVagon(coche, est.s, offCoche(i)));
    }
    for (const rd of tren.ruedas) rd.malla.rotation.y += est.vel * dt / rd.radio;

    if (tren.colocar) tren.loco.updateMatrixWorld();
    const chimeneaMundo = (tren.boca ? tmp.set(...tren.boca) : tmp.set(0, 1.9, 1.45)).applyMatrix4(tren.loco.matrixWorld);
    const arr = humo.puntos.geometry.attributes.position.array;
    // 2.9: manejando, el humo sale con el regulador: resopla más cuanto más vapor le das
    const vapor = est.conduce ? 0.6 + est.cabina.regulador * 1.6 : 1;
    for (let i = 0; i < humo.vidas.length; i++) {
      humo.vidas[i] += dt * (0.16 + est.vel * 0.035) * vapor;
      if (humo.vidas[i] > 1) {
        humo.vidas[i] -= 1;
        arr[i * 3] = chimeneaMundo.x; arr[i * 3 + 1] = chimeneaMundo.y; arr[i * 3 + 2] = chimeneaMundo.z;
      } else {
        const v = humo.vidas[i];
        arr[i * 3 + 1] += dt * (1.6 + v * 2);
        arr[i * 3] += dt * (mundo.viento * 1.4 + Math.sin(v * 9 + i) * 0.5);
        arr[i * 3 + 2] += dt * Math.cos(v * 7 + i) * 0.5;
      }
    }
    humo.puntos.geometry.attributes.position.needsUpdate = true;
    humo.puntos.material.opacity = est.conduce ? 0.25 + est.cabina.regulador * 0.45 : 0.55 * (est.parado > 0 ? 0.5 : 1);

    if (visible && est.vel > 0.4) {
      est.chaca -= dt;
      if (est.chaca <= 0) {
        const enPuente = T.puentesRiel.some((p) => Math.hypot(p.x - cabeza.x, p.z - cabeza.z) < p.luz * 0.6 + 4);
        sonido.traqueteo(cabeza, Math.min(1, est.vel / 7), enPuente);
        est.chaca = Math.max(0.22, 1.6 / Math.max(0.6, est.vel));
      }
    }
    est.silbato -= dt;
    if (est.silbato <= 0) {
      if (visible && lejos < 200 && est.vel > 3 && !est.conduce) pitar(cabeza);
      est.silbato = 45 + r() * 60;
    }

    // al que quede parado en la vía, el tren lo aparta
    if (!est.subido && est.vel > 0.5 && lejos < 60) {
      for (let d = -13; d <= 3; d += 2) {
        const p = enVia(est.s + d);
        const dx = js.pos.x - p.x, dz = js.pos.z - p.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 1.9 && Math.abs(js.pos.y - p.y) < 2.6) {
          const l = dist || 0.001;
          js.pos.x = p.x + (dx / l) * 1.9;
          js.pos.z = p.z + (dz / l) * 1.9;
          if (est.empujando <= 0) { pitar(p); est.empujando = 1.5; }
          break;
        }
      }
    }
    if (est.empujando > 0) est.empujando -= dt;

    if (est.subido && est.conduce) {
      // 2.9: en la cabina, del lado del maquinista; la vista gira con la locomotora
      const p = enVia(est.s + CAB.z);
      const nx = Math.cos(p.ang), nz = -Math.sin(p.ang);
      js.pos.set(p.x + nx * CAB.x, p.y + CAB.y, p.z + nz * CAB.x);
      let giro = p.ang - est.angCabina;
      while (giro > Math.PI) giro -= Math.PI * 2;
      while (giro < -Math.PI) giro += Math.PI * 2;
      js.yaw += giro;
      est.angCabina = p.ang;
      js.velocidadActual = est.vel;
    } else if (est.subido) {
      // el asiento elegido: fila, lado y coche; la última posición es la plataforma abierta
      const a = ASIENTOS[est.asiento];
      const base = offCoche(a.coche);
      const p = enVia(est.s + base + a.z);
      const nx = Math.cos(p.ang), nz = -Math.sin(p.ang);
      // (3.7.3: cada lugar del tren mejorado trae su altura sobre el riel)
      js.pos.set(p.x + nx * a.x, p.y + (a.y ?? (0.72 + (a.plataforma ? 0 : 0.42))), p.z + nz * a.x);
      js.velocidadActual = est.vel;
    }
    // de noche se encienden el faro de la locomotora y los faroles de los coches
    const noche = mundo.noche || 0;
    if (Math.abs(noche - est.luzUltima) > 0.05) {
      est.luzUltima = noche;
      tren.faro.material.color.setRGB(0.55 + noche * 3.2, 0.5 + noche * 2.6, 0.32 + noche * 1.4);
      for (const c of tren.coches) c.userData.farol.material.color.setRGB(0.16 + noche * 2.2, 0.15 + noche * 1.7, 0.13 + noche * 0.9);
    }
    tren.luzFaro.intensity = noche * 3.2 * (lejos < 90 ? 1 : 0);
    tren.luzCoche.intensity = est.subido ? 0.9 + noche * 2.8 : 0;
    if (est.subido) tren.luzCoche.position.set(js.pos.x, js.pos.y + 1.1, js.pos.z);
    tren.alActualizar?.({ dt, s: est.s, vel: est.vel, noche, lejos, subido: est.subido, camara, enVia, enNieve: nieve.adentro });
    // la guarda viaja parada en el pasillo del primer coche (3.7.3: el primero donde se viaja)
    const pg = hayCoches() ? enVia(est.s + offCoche(tren.primerCoche ?? 0) + 1.6) : null;
    const guarda = pg ? { x: pg.x, z: pg.z, y: pg.y + (tren.piso ?? 0.72), rumbo: pg.ang + Math.PI / 2 } : null;
    // 2.9: la llegada a un andén manejando se avisa una sola vez
    const llegada = est.llegada;
    est.llegada = null;
    // 3.7.3: lo que pasó con la nieve en este cuadro (main.js lo avisa una vez)
    const avisoNieve = est.avisoNieve;
    est.avisoNieve = null;
    return {
      parado: est.parado > 0 || paradoEnCabina(), vel: est.vel, pos: cabeza, proxima: est.proxima, falta,
      asiento: ASIENTOS[est.asiento], guarda, recorrido: est.recorrido, vuelta: total,
      conduce: est.conduce, cabina: est.conduce ? est.cabina : null, paradaCabina: est.paradaCabina, llegada, avisoNieve,
    };
  }

  // ---------------------------------------------------------------- 2.9: de maquinista
  // La parada en cuyo andén está la locomotora (`CABINA.ventana` metros antes o después
  // del poste), o null.
  function paradaEnVentana() {
    for (const p of paradas) {
      // (3.7.3: con el tren largo vale tanto la locomotora en el andén como el primer coche: del poste al poste corrido)
      for (const s of tren.adelanto ? [p.s, poste(p)] : [p.s]) {
        const d = delta(est.s, s);
        if (enElAnden(d > total / 2 ? d - total : d)) return p;
      }
    }
    return null;
  }
  const paradoEnCabina = () => est.conduce && est.vel === 0 && !!est.paradaCabina;
  // `mundo.acelera` y `mundo.frena`: lo que sostiene el jugador (W y S, o el stick)
  // 3.7.3: `mundo.manejo` (la caldera y el freno del taller), `mundo.agarre` (sin arenero, con lluvia o helada)
  // y la nieve de la vía (`nieve`: sin quitanieves se planta; con, no pasa del tope)
  function manejar(dt, mundo, cabeza, visible, nieve = nieveAhora) {
    const c = est.cabina;
    pasoCabina(c, dt, { acelera: !!mundo.acelera, frena: !!mundo.frena, pendiente: cabeza.pend, manejo: mundo.manejo || null, agarre: mundo.agarre ?? 1, nieve: nieve.frena, tope: nieve.tope });
    if (nieve.plantado) c.vel = 0;
    est.vel = c.vel;
    est.parado = 0;
    est.s = (est.s + est.vel * dt) % total;
    est.recorrido += est.vel * dt;
    est.proxima = siguienteParada(est.s);
    const aqui = paradaEnVentana();
    if (!aqui) est.paradaCabina = null;
    else if (est.vel === 0 && est.paradaCabina !== aqui) {
      // paró en un andén: la campana, y main.js entrega los fletes que iban ahí
      est.paradaCabina = aqui;
      est.llegada = aqui;
      sonido.campana(cabeza);
    }
    if (c.freno > 0.35 && est.vel > 1.2) {
      est.frenos -= dt;
      if (est.frenos <= 0 && visible) { sonido.frenos(cabeza, Math.min(1, est.vel / 6)); est.frenos = 0.8; }
    }
    if (est.silbar > 0) est.silbar -= dt;
  }
  // Se sube a la cabina con el tren parado en una estación, al lado de la locomotora
  // (y más cerca de ella que de la puerta del coche: ahí E sube como pasajero).
  function puedeConducir(js) {
    if (est.subido || est.parado <= 0 || est.varado) return false;
    const cab = enVia(est.s + CAB.z - 0.3), puerta = hayCoches() ? enVia(est.s + (tren.puertas ? offCoche(tren.primerCoche ?? 0) + 4.8 : -5.2)) : null;
    const dCab = Math.hypot(cab.x - js.pos.x, cab.z - js.pos.z);
    return dCab < 3.2 && (!puerta || dCab + 1 < Math.hypot(puerta.x - js.pos.x, puerta.z - js.pos.z)) && Math.abs(js.pos.y - cab.y) < 2.6;
  }
  function subirACabina(jugador) {
    est.subido = true; est.conduce = true;
    est.recorrido = 0; est.parado = 0; est.vel = 0;
    est.cabina = cabinaNueva();
    est.paradaCabina = paradaEnVentana(); est.llegada = null;
    const p = enVia(est.s + CAB.z);
    est.angCabina = p.ang;
    vaporDeCabina(true);
    const js = jugador.estado;
    js.enTren = true; js.agachado = false; js.sentado = false;
    js.yaw = p.ang + Math.PI; js.pitch = -0.06;
  }
  // Se baja parado en un andén. El tren vuelve a andar solo: si quedó antes del poste, se
  // arrima despacio y espera como siempre; si se pasó, espera un rato y sigue.
  function bajarDeCabina(jugador) {
    if (!est.conduce || est.vel > 0 || !est.paradaCabina) return false;
    const parada = est.paradaCabina;
    est.conduce = false; est.subido = false;
    est.cabina.regulador = 0; est.cabina.freno = 0;
    vaporDeCabina(false);
    jugador.estado.enTren = false;
    const d = delta(est.s, poste(parada));
    if (d > 0 && d <= CABINA.ventana + 0.5) { est.proxima = parada; est.parado = 0; }
    else { est.proxima = siguienteParada(est.s); est.parado = 30; }
    est.paradaCabina = null;
    jugador.ubicar(parada.anden.x, parada.anden.z, jugador.estado.yaw);
    return true;
  }
  // Desde la cabina el humo pasa a centímetros: con puntos cuadrados se ven cuadrados. Mientras
  // manejás, los puntos son bocanadas redondas (una textura chica que se arma la primera vez).
  let matVapor = null;
  const matHumo = humo.puntos.material;
  function vaporDeCabina(si) {
    if (si && !matVapor && typeof document !== 'undefined') {
      try {
        const lienzo = document.createElement('canvas');
        lienzo.width = lienzo.height = 64;
        const g = lienzo.getContext('2d');
        const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
        grad.addColorStop(0, 'rgba(255,255,255,0.9)'); grad.addColorStop(0.55, 'rgba(255,255,255,0.35)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
        matVapor = new THREE.PointsMaterial({ color: 0xd9d5cd, size: 1.1, sizeAttenuation: true, transparent: true, opacity: 0.6, depthWrite: false, map: new THREE.CanvasTexture(lienzo) });
      } catch { matVapor = null; }
    }
    humo.puntos.material = si && matVapor ? matVapor : matHumo;
  }
  function silbar() {
    if (!est.conduce || est.silbar > 0) return false;
    est.silbar = 1.2;
    pitar(enVia(est.s));
    return true;
  }
  // 3.7.3: el silbato del taller (o el de "Personalizar"): `opciones.silbato()` dice cuál
  function pitar(pos) {
    const tipo = opciones.silbato?.();
    if (tipo) sonido.silbato(pos, tipo); else sonido.silbato(pos);
  }
  // El puesto de cargas más cercano a `pos`, si está a menos de `radio` metros.
  function puestoCerca(pos, radio = 2.2) {
    for (const p of paradas) if (p.cargas && Math.hypot(p.cargas.x - pos.x, p.cargas.z - pos.z) < radio && Math.abs((pos.y ?? p.cargas.y) - p.cargas.y) < 2.5) return p;
    return null;
  }

  function paradaCerca(js) {
    for (const p of paradas) if (Math.hypot(p.anden.x - js.pos.x, p.anden.z - js.pos.z) < 14) return p;
    return null;
  }
  // 3.7.3: con el tren mejorado se sube por la puerta de cualquier coche de pasajeros (las plataformas de las
  // puntas), esté o no junto al andén. El tren completo (ténder + 4 vagones, unos 55 m) es más largo que los andenes
  // (9 y 18 m): en vez de alargarlos (cambiaba el terreno, el despeje y el sorteo de las paradas, y en las curvas no
  // entran), el tren para con su primer coche de pasajeros frente al andén (`adelanto`), se sube por cualquier coche
  // y al bajar se baja en el andén.
  function puertaCerca(js, radio = 2.8) {
    if (!tren.puertas) return null;
    let mejor = null, d0 = radio;
    for (const pu of tren.puertas()) {
      const p = enVia(est.s + offCoche(pu.coche) + pu.z);
      const d = Math.hypot(p.x - js.pos.x, p.z - js.pos.z) - 1.05;
      if (d < d0 && Math.abs(js.pos.y - p.y) < 2.6) { d0 = d; mejor = pu; }
    }
    return mejor;
  }
  function puedeSubir(js) {
    if (est.subido || est.parado <= 0) return false;
    if (tren.puertas) return !!puertaCerca(js);
    const p = enVia(est.s - 5.2);
    return Math.hypot(p.x - js.pos.x, p.z - js.pos.z) < 7;
  }
  // el asiento (no la plataforma) más cerca de un punto del tren (metros detrás de la locomotora y al costado)
  function asientoMasCerca(largo, x = 0, filtro = null) {
    let mejor = 0, d0 = Infinity;
    ASIENTOS.forEach((a, i) => {
      if (a.plataforma || (filtro && !filtro(a))) return;
      const d = Math.abs(largoDe(a) - largo) + Math.abs(a.x - x) * 0.5;
      if (d < d0) { d0 = d; mejor = i; }
    });
    return mejor;
  }
  function moverse(dx, dz) {
    if (!est.subido) return;
    const actual = ASIENTOS[est.asiento];
    if (actual.plataforma) {
      // desde la plataforma solo se vuelve adentro
      if (dz > 0) est.asiento = tren.lugares ? asientoMasCerca(largoDe(actual), 0, (a) => a.coche === actual.coche) : ASIENTOS.findIndex((a) => a.coche === 1 && a.z === -2 && a.lado === 1);
      return;
    }
    let mejor = est.asiento, mejorD = Infinity;
    ASIENTOS.forEach((a, i) => {
      if (i === est.asiento) return;
      const dxx = tren.lugares ? largoDe(a) - largoDe(actual) : (a.coche - actual.coche) * -6.6 + (a.z - actual.z);
      const dlado = a.lado - actual.lado;
      if (dz !== 0 && Math.sign(dxx) !== Math.sign(dz)) return;
      if (dx !== 0 && Math.sign(dlado) !== Math.sign(dx)) return;
      const d = Math.abs(dxx) * (dz ? 1 : 3) + Math.abs(dlado) * (dx ? 1 : 3) + (a.plataforma ? 0.4 : 0);
      if (d < mejorD) { mejorD = d; mejor = i; }
    });
    est.asiento = mejor;
  }

  function reiniciarVuelta() { est.recorrido = 0; }
  function subir(jugador) {
    // 3.7.3: al coche de la puerta por la que subiste, en el asiento más cerca
    const pu = puertaCerca(jugador.estado, 4);
    est.subido = true;
    est.recorrido = 0;
    est.asiento = pu ? asientoMasCerca(offCoche(pu.coche) + pu.z * 0.8, 0, (a) => a.coche === pu.coche) : ASIENTOS.findIndex((a) => a.coche === 0 && a.z === 0 && a.lado === 1);
    if (est.asiento < 0) est.asiento = asientoMasCerca(offCoche(0));
    jugador.estado.enTren = true;
    jugador.estado.agachado = false;
    pitar(enVia(est.s));
  }
  // 3.7.3: a un lugar del tren (el de la cocina, una cama…): el primero que cumpla `filtro`
  function irA(filtro) {
    if (!est.subido || est.conduce) return false;
    const i = ASIENTOS.findIndex(filtro);
    if (i < 0) return false;
    est.asiento = i;
    return true;
  }
  function bajar(jugador) {
    if (est.parado <= 0) return false;
    est.subido = false;
    jugador.estado.enTren = false;
    const p = enVia(est.s + (tren.adelanto ? -tren.adelanto : -5.2));
    const parada = paradas.reduce((a, b) => (Math.hypot(b.anden.x - p.x, b.anden.z - p.z) < Math.hypot(a.anden.x - p.x, a.anden.z - p.z) ? b : a), paradas[0]);
    jugador.ubicar(parada.anden.x, parada.anden.z, jugador.estado.yaw);
    return true;
  }

  function proximoTrenA(parada) {
    if (!parada) return null;
    const d = delta(est.s, poste(parada));
    return { metros: d, segundos: Math.round(d / Math.max(2.5, est.objetivo) + (est.parado > 0 ? est.parado : 0)) };
  }

  // 2.3: el Desafío lo vara y lo suelta; al soltarlo sigue a la próxima parada
  // 2.8: lo elegido en "Personalizar" (ver `personal-trochita.js`): la pintura de los
  // coches, la franja y el frente, la cabina y el ténder, el nombre de la locomotora (una
  // chapa de bronce a cada lado de la cabina) y el silbato.
  function personalizar(datos) {
    const d = sanearTrochita(datos);
    // 3.7.3: el tren mejorado se pinta y se nombra a su manera (ver tren.js `personalizar`)
    if (tren.personalizar) {
      tren.personalizar(d);
      if (sonido && typeof sonido === 'object') sonido.silbatoElegido = d.silbato;
      personal = d;
      return true;
    }
    if (d.coches !== personal.coches || d.franja !== personal.franja || d.cabina !== personal.cabina) {
      for (const c of tren.coches) repintarVertices(c, { '#6b4a2e': d.coches, '#7c2f22': d.franja });
      repintarVertices(tren.loco, { '#6b4a2e': d.cabina, '#7c2f22': d.franja });
      if (tren.tender) repintarVertices(tren.tender, { '#6b4a2e': d.cabina });
    }
    if (d.nombre !== personal.nombre || (d.nombre && !placas.length)) {
      for (const p of placas) { tren.loco.remove(p); desechar(p); }
      placas = [];
      if (d.nombre) {
        for (const lado of [-1, 1]) {
          const p = cartelNombre(d.nombre, 0.8, 0.17, { ancho: 640, alto: 136, fondo: '#b89a5c', tinta: '#2e2414', borde: '#7a6436' });
          p.position.set(lado * 0.557, 1.12, -1.25);
          p.rotation.y = lado * Math.PI / 2;
          tren.loco.add(p);
          placas.push(p);
        }
      }
    }
    if (sonido && typeof sonido === 'object') sonido.silbatoElegido = d.silbato;
    personal = d;
    return true;
  }

  if (tren.lugares) vaporDeCabina(true);   // 3.7.3: con el tren mejorado, bocanadas redondas siempre

  // ---------------------------------------------------------------- 3.7.3: la vía nevada
  // La gran nevada (3.7.4) tapa tramos de vía con `taparVia([{ desde, hasta }])` (metros de vía; null destapa).
  // Sin quitanieves el tren se planta antes de la nieve (manejando, adentro) hasta que pasa la cuadrilla con las
  // palas (TREN.nieve.espera segundos) o se destapa; con quitanieves pasa despacio y la deja abierta detrás.
  function taparVia(tramos) {
    est.nevada = sanearNevada(tramos || [], total);
    est.esperaNieve = 0;
    tren.nieve?.(est.nevada, enVia, total);
    return est.nevada.slice();
  }
  function nieveAdelante(dt) {
    if (!est.nevada.length || est.varado) return SIN_NIEVE;
    const frente = 5.2;   // la punta de la cuña (o del quitapiedras), adelante del centro de la locomotora
    const sf = est.s + frente;
    const tramo = tramoNevado(sf % total, est.nevada, total);
    const dn = tramo ? 0 : distanciaANieve(sf % total, est.nevada, total);
    if (conQuitanieves()) {
      if (!tramo) {
        // (lo que la cuña dejó atrás sin terminar de abrir, un pedacito, se da por abierto)
        const atras = est.nevada.find((t) => ((sf - t.hasta) % total + total) % total < 6);
        if (atras) { est.nevada = est.nevada.filter((t) => t !== atras); est.avisoNieve = 'abierta'; tren.nieve?.(est.nevada, enVia, total); }
        return dn < 25 ? { ...SIN_NIEVE, tope: Math.max(TREN.nieve.vmax, dn * 0.5) } : SIN_NIEVE;
      }
      // la cuña abre la vía: lo que quedó atrás de la punta ya no está tapado
      const hecho = ((sf - tramo.desde) % total + total) % total;
      if (hecho > 1) {
        const largo = tramo.hasta - tramo.desde;
        tramo.desde = (tramo.desde + hecho) % total;
        tramo.hasta = tramo.desde + Math.max(0, largo - hecho);
        if (tramo.hasta - tramo.desde < 2) { est.nevada = est.nevada.filter((t) => t !== tramo); est.avisoNieve = 'abierta'; }
        tren.nieve?.(est.nevada, enVia, total);
      }
      return { tope: TREN.nieve.vmax, frena: 0, plantado: false, adentro: true };
    }
    // sin quitanieves: se planta en el borde (y espera la cuadrilla)
    if (tramo || dn < 1.5) {
      if (est.esperaNieve === 0) est.avisoNieve = 'plantado';
      est.esperaNieve += dt;
      if (est.esperaNieve > TREN.nieve.espera) {
        const t = tramo || est.nevada.find((x) => ((x.desde - sf) % total + total) % total < 2);
        est.nevada = est.nevada.filter((x) => x !== t);
        est.esperaNieve = 0; est.avisoNieve = 'cuadrilla';
        tren.nieve?.(est.nevada, enVia, total);
        return SIN_NIEVE;
      }
      return { tope: 0, frena: TREN.nieve.frena, plantado: true, adentro: !!tramo };
    }
    est.esperaNieve = 0;
    return dn < 40 ? { ...SIN_NIEVE, tope: Math.max(0, (dn - 1.2) * 0.6) } : SIN_NIEVE;
  }
  function varar(s) { est.varado = true; est.s = ((s % total) + total) % total; est.vel = 0; est.velVarado = 0; }
  function soltar(esperar = 0) { est.varado = false; est.velVarado = 0; est.proxima = siguienteParada(est.s); est.parado = esperar; }
  // 3.8.4: plantado en la nieve sin quitanieves (esperando a la cuadrilla), arriba (de pasajero o en la cabina) te podés
  // bajar y seguir a pie: quedás al costado de la vía y el tren sigue esperando a la cuadrilla; después sigue solo hasta
  // la próxima parada (antes había que esperar los cuatro minutos adentro)
  const varadoEnNieve = () => est.subido && !est.varado && est.esperaNieve > 0 && est.vel < 0.05;
  function bajarEnLaNieve(jugador) {
    if (!varadoEnNieve()) return false;
    if (est.conduce) {
      est.conduce = false;
      est.cabina.regulador = 0; est.cabina.freno = 0;
      vaporDeCabina(false);
      est.paradaCabina = null;
      est.proxima = siguienteParada(est.s); est.parado = 0;
    }
    est.subido = false;
    jugador.estado.enTren = false;
    // al costado de la locomotora, del lado de afuera de la vía
    const a = enVia(est.s), b = enVia(est.s + 1.5);
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    jugador.ubicar(a.x - (dz / l) * 2.6, a.z + (dx / l) * 2.6, jugador.estado.yaw);
    return true;
  }
  return {
    varadoEnNieve, bajarEnLaNieve,
    est, actualizar, puedeSubir, subir, bajar, moverse, proximoTrenA, reiniciarVuelta, estacion, paradas, chunks, cruces, enVia, paradaCerca,
    // 3.7.3: el lugar donde vas, ir a uno (la cocina, una cama), la vía nevada y dónde para la locomotora
    asientoActual: () => (est.subido && !est.conduce ? ASIENTOS[est.asiento] : null), irA, taparVia, viaNevada: () => est.nevada.slice(), poste,
    viajando: () => est.subido, parado: () => est.parado > 0 || paradoEnCabina(),
    // 2.9: de maquinista y el puesto de cargas de cada parada
    puedeConducir, subirACabina, bajarDeCabina, silbar, puestoCerca, paradaEnVentana,
    conduciendo: () => est.conduce, paradaCabina: () => est.paradaCabina,
    largo: total, varar, soltar,
    personalizar, personal: () => personal, nombreLocomotora: () => personal.nombre, tren,   // 2.8
    // 2.7.4: si el tren (y sus luces) se ve desde `pos`, y cuántos metros le faltan al
    // jugador para que cambie: el mismo corte que en `actualizar` (ver luces.js)
    grupoLuces: tren.g,
    visibleDesde: (pos) => est.subido || Math.hypot(enVia(est.s).x - pos.x, enVia(est.s).z - pos.z) < 340,
    margenLuces: (pos) => (est.subido ? Infinity : Math.abs(Math.hypot(enVia(est.s).x - pos.x, enVia(est.s).z - pos.z) - 340)),
  };
}
