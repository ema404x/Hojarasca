// 4.15.0: los objetos de la Historia en el mundo (el canto blanco del umbral, la ronda de ramitas, la bolsa de Eusebio, el alero, la
// puertita, el hacha en el tocón, la raíz del coihue grande). Qué se ve y qué hace la E está en `historia-disparadores.js` (OBJETOS,
// puro); acá están las cuentas de dónde van (puras, se prueban en Node) y las mallas.
//
// Rendimiento y shaders: ninguna luz ni programa nuevo. Cada objeto es una malla chica con el MISMO material de las estructuras
// (`materialVegetal({ flex: 0 })`, tipo 0 o 4: el programa de siempre) y sólo se dibuja el que está a la vista según la historia.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { OBJETOS as OBJETOS_HIST, RADIO_OBJETO } from './historia-disparadores.js';
// 4.18.0 (C): los props de los `mundo:` del acto III (historia-props-acto3.js). Si historia-disparadores.js ya los suma a OBJETOS, es el mismo objeto.
import { OBJETOS_PROPS_ACTO3, propsDeEfecto, puestoDeEfecto, puestoHacia } from './historia-props-acto3.js';
const OBJETOS = { ...OBJETOS_HIST, ...OBJETOS_PROPS_ACTO3 };

// ---------------------------------------------------------------- cuentas puras
// Un punto del refugio en coordenadas locales (x a la derecha, z hacia donde mira la puerta) pasado al mundo
export function aMundoRefugio(ref, lx, lz) {
  const rot = Number(ref?.rot) || 0;
  return { x: ref.x + lx * Math.cos(rot) + lz * Math.sin(rot), z: ref.z - lx * Math.sin(rot) + lz * Math.cos(rot) };
}
// El punto del arroyo más cercano al refugio (anillos de `paso` metros hasta `max`): `agua(x, z)` dice si ahí hay agua. Sin agua, null.
export function puntoDeArroyo(ref, agua, paso = 8, max = 320) {
  for (let r = paso; r <= max; r += paso) {
    let mejor = null;
    const n = Math.max(12, Math.round((2 * Math.PI * r) / paso));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, x = ref.x + Math.cos(a) * r, z = ref.z + Math.sin(a) * r;
      if (agua(x, z)) { mejor = { x, z }; break; }
    }
    if (mejor) return mejor;
  }
  return null;
}
// El coihue más grande en un radio alrededor de un punto (`esc` es el tamaño del árbol). Sin coihues, null.
export function coihueGrande(arboles, punto, radio = 45) {
  let mejor = null;
  for (const a of arboles || []) {
    if (a.especie !== 'coihue') continue;
    const d = Math.hypot(a.x - punto.x, a.z - punto.z);
    if (d > radio) continue;
    if (!mejor || (a.esc || 0) > (mejor.esc || 0)) mejor = a;
  }
  return mejor;
}
// Del molino viejo: la orilla (a unos metros del agua, hacia el refugio) y la raíz del coihue grande
export function molinoViejo(ref, agua, arboles) {
  const a = puntoDeArroyo(ref, agua);
  if (!a) return null;
  const d = Math.hypot(ref.x - a.x, ref.z - a.z) || 1;
  const orilla = { x: a.x + ((ref.x - a.x) / d) * 6, z: a.z + ((ref.z - a.z) / d) * 6 };
  const c = coihueGrande(arboles, orilla, 45);
  return { orilla, raiz: c ? { x: c.x + ((orilla.x - c.x) / (Math.hypot(orilla.x - c.x, orilla.z - c.z) || 1)) * Math.max(1.2, (c.r || 1) + 0.9), z: c.z + ((orilla.z - c.z) / (Math.hypot(orilla.x - c.x, orilla.z - c.z) || 1)) * Math.max(1.2, (c.r || 1) + 0.9) } : orilla, arbol: c || null };
}
// Distancias (metros) del jugador a los puntos con nombre
export function distanciasA(pos, puntos, a = {}) {
  for (const k of Object.keys(a)) delete a[k];
  for (const [k, q] of Object.entries(puntos || {})) if (q && Number.isFinite(q.x) && Number.isFinite(q.z)) a[k] = Math.hypot(pos.x - q.x, pos.z - q.z);
  return a;
}
// El objeto más cercano (de los que se ven y tienen qué hacer) dentro del alcance
export function objetoCercano(pos, visibles, posiciones, accion) {
  let mejor = null, dm = Infinity;
  for (const id of visibles) {
    const q = posiciones[id];
    if (!q || !accion(id)) continue;
    const d = Math.hypot(pos.x - q.x, pos.z - q.z);
    const radio = Object.hasOwn(OBJETOS, id) && (OBJETOS[id].forma === 'raiz' || OBJETOS[id].lugar === 'molino-viejo') ? 3.4 : RADIO_OBJETO;
    if (d <= radio && d < dm) { dm = d; mejor = id; }
  }
  return mejor;
}

// ---------------------------------------------------------------- las mallas
const caja = (c, dims, pos, color, rot = [0, 0, 0], variar = 0.08) => c.agregar(new THREE.BoxGeometry(...dims), { color, tipo: 4, variar, matriz: matriz(pos, rot) });
const esfera = (c, r, pos, color, esc = [1, 1, 1], variar = 0.05) => c.agregar(new THREE.SphereGeometry(r, 9, 7), { color, tipo: 0, variar, matriz: matriz(pos, [0, 0, 0], esc) });
const palo = (c, r, largo, pos, rot, color) => c.agregar(new THREE.CylinderGeometry(r, r * 1.1, largo, 7), { color, tipo: 0, variar: 0.1, matriz: matriz(pos, rot) });
// 4.18.0 (C): una caja de tipo 0 (madera): el material de las estructuras le pone nieve arriba a lo de tipo 4 en invierno, y adentro del refugio o
// bajo un techo (el mapa en la mesa, la repisa, la manta) eso la dejaba blanca
const cajaM = (c, dims, pos, color, rot = [0, 0, 0], variar = 0.08) => c.agregar(new THREE.BoxGeometry(...dims), { color, tipo: 0, variar, matriz: matriz(pos, rot) });

const FORMAS = {
  canto: (c) => { esfera(c, 0.15, [0, 0.11, 0], '#f3f0e8', [1, 0.78, 0.9], 0.02); },
  ronda: (c) => {
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      caja(c, [0.55, 0.07, 0.07], [Math.cos(a) * 0.75, 0.06, Math.sin(a) * 0.75], '#8a6a45', [0, -a + Math.PI / 2, 0], 0.14);   // (4.16.0: más grande: de lejos, en la escena, no se veía)
    }
  },
  bolsa: (c) => {
    caja(c, [0.46, 0.62, 0.3], [0, 0.31, 0], '#cdbfa0', [0, 0.2, 0.05], 0.1);
    caja(c, [0.48, 0.05, 0.32], [0, 0.46, 0], '#b8432f', [0, 0.2, 0.05], 0.05);
    esfera(c, 0.1, [0, 0.64, 0], '#bfae8a', [1.5, 0.7, 1], 0.08);
    caja(c, [0.03, 0.8, 0.03], [0, 1.04, 0], '#b8432f', [0, 0, 0], 0.04);   // 4.17.0: el piolín colorado de que cuelga bajo el alero (la bolsa se ve desde que se arregla el alero)
  },
  alero: (c) => {
    for (let i = 0; i < 4; i++) caja(c, [0.92, 0.035, 0.17], [0, 0.04 + i * 0.04, i * 0.02], '#a98558', [0, 0.08 * i, 0], 0.1);
    caja(c, [0.3, 0.3, 0.3], [0.7, 0.15, 0.1], '#7b6446', [0, 0.3, 0], 0.1);
  },
  puertita: (c) => {
    caja(c, [0.26, 0.4, 0.03], [0, 0.2, 0], '#8a5a34', [0.1, 0, 0.12], 0.1);
    esfera(c, 0.022, [0.07, 0.2, 0.025], '#e7ddc6', [1, 1, 1], 0.02);
    caja(c, [0.04, 0.05, 0.02], [-0.12, 0.2, 0.02], '#4a3624', [0.1, 0, 0.12], 0.05);
  },
  // 4.17.0: el tocón más alto (se perdía entre los lupinos, que le llegan a la rodilla)
  'hacha-tocon': (c) => {
    palo(c, 0.42, 0.95, [0, 0.475, 0], [0, 0, 0], '#6b4f35');
    palo(c, 0.42, 0.04, [0, 0.96, 0], [0, 0, 0], '#c9ac80');
    caja(c, [0.05, 0.62, 0.05], [0.05, 1.25, 0.02], '#7a5a38', [0, 0, 0.18], 0.06);
    caja(c, [0.2, 0.15, 0.05], [0.12, 1.52, 0.02], '#8d949a', [0, 0, 0.18], 0.06);
  },
  // 4.16.0: los props del acto II y los del acto I que antes sólo dejaban una marca
  'dedal-poste': (c) => {
    palo(c, 0.06, 1.3, [0, 0.65, 0], [0, 0, 0], '#6b5030');
    palo(c, 0.05, 0.07, [0, 1.34, 0], [0, 0, 0], '#cfd3d8');
    esfera(c, 0.05, [0, 1.38, 0], '#d9dde2', [1, 0.6, 1], 0.02);
  },
  pipa: (c) => {
    esfera(c, 0.18, [0, 0.05, 0], '#8a877f', [1, 0.35, 1], 0.08);
    palo(c, 0.018, 0.22, [0, 0.14, 0], [0, 0, 1.45], '#4a3220');
    palo(c, 0.03, 0.08, [0.11, 0.18, 0], [0, 0, 0], '#3d2a1a');
  },
  'bota-cuchara': (c) => {
    caja(c, [0.16, 0.3, 0.11], [0, 0.15, 0], '#4a3828', [0, 0, 0], 0.08);
    caja(c, [0.22, 0.09, 0.11], [0.05, 0.045, 0], '#3d2e20', [0, 0, 0], 0.06);
    palo(c, 0.012, 0.4, [0.02, 0.45, 0], [0, 0, 0.15], '#b89462');
    esfera(c, 0.05, [0.07, 0.66, 0], '#b89462', [1, 0.5, 1.3], 0.04);
  },
  yerba: (c) => {
    esfera(c, 0.34, [0, 0.03, 0], '#5d7d3a', [1, 0.12, 1.25], 0.1);
    esfera(c, 0.12, [0, 0.1, 0], '#8f9a4b', [1, 0.7, 1], 0.06);
  },
  'ronda-harina': (c) => {
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      esfera(c, 0.13, [Math.cos(a) * 1.15, 0.05, Math.sin(a) * 1.15], '#efe9dc', [1, 0.5, 1], 0.03);
      caja(c, [0.05, 0.01, 0.09], [Math.cos(a + 0.28) * 1.15, 0.012, Math.sin(a + 0.28) * 1.15], '#d9d2c0', [0, -a, 0], 0.04);
    }
    palo(c, 0.45, 0.03, [0, 0.016, 0], [0, 0, 0], '#2a1f16');
  },
  'cuaderno-hule': (c) => {
    caja(c, [0.26, 0.06, 0.19], [0, 0.06, 0], '#2d4a3a', [0, 0.3, 0], 0.05);
    caja(c, [0.03, 0.062, 0.2], [0, 0.062, 0], '#b8432f', [0, 0.3, 0], 0.03);
  },
  pinones: (c) => {
    for (let i = 0; i < 5; i++) esfera(c, 0.035, [Math.cos(i * 1.7) * 0.12, 1.0, Math.sin(i * 1.7) * 0.12], '#5a3a22', [1, 1.6, 1], 0.1);
  },
  'cuchara-techo': (c) => {
    palo(c, 0.012, 0.36, [0, 0.03, 0], [0, 0, 1.25], '#b89462');
    esfera(c, 0.05, [0.2, 0.05, 0], '#b89462', [1.3, 0.5, 1], 0.04);
  },
  'puertita-noche': (c) => {
    caja(c, [0.26, 0.4, 0.03], [0, 0.2, 0.06], '#8a5a34', [-0.28, 0, 0.1], 0.1);
    esfera(c, 0.022, [0.07, 0.2, 0.09], '#e7ddc6', [1, 1, 1], 0.02);
  },
  // las muelas rotas del molino viejo, las diez bolsas de harina y la pluma de cóndor
  muelas: (c) => {
    palo(c, 0.95, 0.3, [0, 0.14, 0], [0, 0, 0.06], '#8d8a82');
    palo(c, 0.8, 0.26, [2.0, 0.12, 0.8], [0.25, 0, 0.35], '#7d7a72');
    caja(c, [0.5, 0.2, 0.4], [0.5, 0.08, -1.1], '#8d8a82', [0, 0.5, 0], 0.1);
  },
  'diez-bolsas': (c) => {
    for (let i = 0; i < 10; i++) { const capa = i < 4 ? 0 : i < 7 ? 1 : 2, k = i < 4 ? i : i < 7 ? i - 4 + 0.5 : i - 7 + 1; caja(c, [0.5, 0.3, 0.34], [k * 0.55 - 0.9, 0.15 + capa * 0.3, 0], '#cdbfa0', [0, 0.1 * (i % 3 - 1), 0], 0.08); }
  },
  pluma: (c) => {
    palo(c, 0.012, 0.55, [0, 0.05, 0], [0, 0, 1.45], '#2b2a2a');
    esfera(c, 0.035, [0.28, 0.06, 0], '#f3f0e8', [1.8, 0.4, 0.8], 0.02);
  },
  // las puertitas talladas en la raíz del coihue grande (decoración): cuatro, al pie del tronco
  puertitas: (c, info) => {
    const r = Math.max(0.8, Number(info?.r) || 1.4);
    [0.5, 1.9, 3.4, 4.9].forEach((a, i) => {
      caja(c, [0.22, 0.34 - i * 0.03, 0.04], [Math.cos(a) * (r + 0.03), 0.2, Math.sin(a) * (r + 0.03)], '#6e4a2a', [0, Math.PI / 2 - a, 0], 0.1);
      esfera(c, 0.016, [Math.cos(a) * (r + 0.06), 0.2, Math.sin(a) * (r + 0.06)], '#e7ddc6', [1, 1, 1], 0.02);
    });
  },
  // la pirca de Tobías: dos vueltas de piedras redondas alrededor del tronco
  pirca: (c, info) => {
    const r = Math.max(0.8, Number(info?.r) || 1.4) + 0.95;
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; esfera(c, 0.27, [Math.cos(a) * r, 0.17, Math.sin(a) * r], i % 3 ? '#8d8a82' : '#76736b', [1, 0.65, 1], 0.12); }
    for (let i = 0; i < 17; i++) { const a = ((i + 0.5) / 17) * Math.PI * 2; esfera(c, 0.22, [Math.cos(a) * (r - 0.05), 0.4, Math.sin(a) * (r - 0.05)], '#8d8a82', [1, 0.7, 1], 0.12); }
  },
  // 4.17.0 (C): los que faltaban. Una foto sobre la mesa con tres manchas doradas (la foto movida del lago) y la llavecita de bronce de Herminia
  'foto-movida': (c) => {
    caja(c, [0.23, 0.012, 0.17], [0, 0.006, 0], '#e9e2d0', [0, 0.3, 0], 0.03);
    caja(c, [0.2, 0.004, 0.14], [0, 0.014, 0], '#26221e', [0, 0.3, 0], 0.02);
    [[-0.05, 0.025], [0.015, -0.03], [0.06, 0.03]].forEach(([x, z]) => esfera(c, 0.017, [x, 0.018, z], '#e6b04a', [1, 0.3, 1], 0.05));
  },
  llavecita: (c) => {
    esfera(c, 0.028, [0, 0.012, 0], '#c9a24a', [1.2, 0.3, 1.2], 0.04);
    caja(c, [0.11, 0.008, 0.014], [0.07, 0.008, 0], '#c9a24a', [0, 0, 0], 0.04);
    caja(c, [0.012, 0.008, 0.03], [0.115, 0.008, 0.012], '#c9a24a', [0, 0, 0], 0.04);
  },
  // los diez cantos blancos que alguien rellenó en la veta de la cantera: un montoncito contra la pared de piedra
  'cantos-veta': (c) => {
    for (let i = 0; i < 10; i++) {
      const capa = i < 5 ? 0 : i < 8 ? 1 : 2, k = i < 5 ? i : i < 8 ? i - 5 + 0.5 : 1.5;
      esfera(c, 0.15, [k * 0.28 - 0.56, 0.1 + capa * 0.2, capa * 0.02], '#f3f0e8', [1, 0.78, 0.9], 0.02);
    }
  },
  // el fogón de la Noche de la Leyenda, en el predio de la aldea: un círculo de piedras, leños cruzados y brasas (sin luz ni fuego animado: la aldea ya tiene sus faroles)
  fogon: (c) => {
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; esfera(c, 0.2, [Math.cos(a) * 0.95, 0.1, Math.sin(a) * 0.95], i % 2 ? '#77746d' : '#66635c', [1, 0.7, 1], 0.1); }
    for (let i = 0; i < 5; i++) caja(c, [1.25, 0.15, 0.15], [0, 0.17 + (i % 2) * 0.12, 0], '#4a3322', [0, (i / 5) * Math.PI, 0.05 * (i - 2)], 0.1);
    for (const [x, z] of [[0.1, 0.05], [-0.2, 0.1], [0.05, -0.25], [0.25, 0.2]]) esfera(c, 0.12, [x, 0.3, z], '#e2571f', [1, 0.55, 1], 0.1);
    esfera(c, 0.2, [0, 0.12, 0], '#2a1c14', [1.6, 0.35, 1.6], 0.05);
  },
  // la tropa de mulas de Belisario: siete en fila, con la carga atada (cada una: cuerpo, cuello, cabeza, orejas, cuatro patas, cola y bulto)
  mulas: (c) => {
    const pelos = ['#7a6650', '#5d4b3a', '#8a7a68', '#4d4036', '#6e5d4a', '#85705a', '#5a4a3c'];
    for (let i = 0; i < 7; i++) {
      const bx = i * 1.7, bz = Math.sin(i * 1.3) * 0.3, giro = Math.sin(i * 2.1) * 0.12, cg = Math.cos(giro), sg = Math.sin(giro);
      const loc = (x, y, z) => [bx + x * cg + z * sg, y, bz - x * sg + z * cg];
      const pelo = pelos[i];
      caja(c, [0.55, 0.52, 1.25], loc(0, 1.0, 0), pelo, [0, giro, 0], 0.08);
      caja(c, [0.24, 0.55, 0.26], loc(0, 1.25, 0.72), pelo, [0.5, giro, 0], 0.08);
      caja(c, [0.22, 0.24, 0.46], loc(0, 1.45, 1.0), pelo, [0.2, giro, 0], 0.08);
      caja(c, [0.07, 0.22, 0.05], loc(-0.07, 1.67, 0.9), pelo, [0, giro, -0.1], 0.06);
      caja(c, [0.07, 0.22, 0.05], loc(0.07, 1.67, 0.9), pelo, [0, giro, 0.1], 0.06);
      for (const [px, pz] of [[-0.18, -0.48], [0.18, -0.48], [-0.18, 0.48], [0.18, 0.48]]) caja(c, [0.12, 0.76, 0.12], loc(px, 0.38, pz), '#3d3228', [0, giro, 0], 0.06);
      caja(c, [0.06, 0.5, 0.06], loc(0, 0.95, -0.68), '#3d3228', [-0.25, giro, 0], 0.06);
      caja(c, [0.78, 0.34, 0.8], loc(0, 1.46, -0.05), i % 2 ? '#cdbfa0' : '#a98558', [0, giro, 0], 0.08);
      caja(c, [0.8, 0.05, 0.12], loc(0, 1.45, -0.05), '#b8432f', [0, giro, 0], 0.05);
    }
  },
  // ---- 4.18.0 (C): los props del acto III (historia-props-acto3.js). +z local mira hacia el jugador (los de escena) o hacia la puerta (los del refugio).
  // Ramón en cama: el banquito, la manta sobre las rodillas (Ramón se sienta en el origen, mirando a +z) y la estufa de hierro a su derecha
  'manta-estufa': (c) => {
    cajaM(c, [0.46, 0.06, 0.4], [0, 0.45, -0.05], '#6b5030', [0, 0, 0], 0.08);
    for (const [x, z] of [[-0.18, -0.2], [0.18, -0.2], [-0.18, 0.12], [0.18, 0.12]]) palo(c, 0.025, 0.44, [x, 0.22, z], [0, 0, 0], '#4f3a24');
    cajaM(c, [0.62, 0.09, 0.5], [0, 0.6, 0.2], '#7d3a2c', [0.08, 0, 0], 0.08);    // sobre las rodillas
    cajaM(c, [0.64, 0.46, 0.06], [0, 0.38, 0.47], '#743427', [0.06, 0, 0], 0.08);   // cae por delante
    cajaM(c, [0.58, 0.36, 0.08], [0, 0.86, 0.1], '#7d3a2c', [-0.12, 0, 0], 0.08);   // hasta el pecho
    for (let i = 0; i < 4; i++) cajaM(c, [0.65, 0.025, 0.012], [0, 0.32 + i * 0.1, 0.505], '#c9b48a', [0.06, 0, 0], 0.04);   // las guardas de la manta
    cajaM(c, [0.55, 0.62, 0.5], [-1.0, 0.31, 0.1], '#2d2b29', [0, 0.2, 0], 0.05);
    cajaM(c, [0.6, 0.04, 0.55], [-1.0, 0.64, 0.1], '#3a3734', [0, 0.2, 0], 0.04);
    palo(c, 0.07, 1.7, [-1.05, 1.5, 0.05], [0, 0, 0], '#3a3734');
    for (const [x, z] of [[-1.2, -0.08], [-0.8, -0.08], [-1.2, 0.28], [-0.8, 0.28]]) palo(c, 0.03, 0.08, [x, 0.02, z], [0, 0, 0], '#2d2b29');
    for (let i = 0; i < 4; i++) palo(c, 0.05, 0.42, [-1.62, 0.06 + i * 0.1, 0.15 - (i % 2) * 0.12], [Math.PI / 2, 0.3, 0], '#5b4632');   // leña al lado
  },
  'atado-canelo': (c) => {
    for (let i = 0; i < 7; i++) palo(c, 0.012, 0.7, [Math.cos(i) * 0.05, 0.35, Math.sin(i) * 0.05], [0.1 * Math.sin(i * 2), 0, 0.1 * Math.cos(i * 3)], '#5a4a2a');
    for (let i = 0; i < 9; i++) esfera(c, 0.09, [Math.cos(i * 2.1) * 0.09, 0.62 + (i % 3) * 0.08, Math.sin(i * 2.1) * 0.09], i % 3 ? '#3f6b35' : '#a9b07a', [0.7, 1.5, 0.4], 0.12);
    caja(c, [0.14, 0.03, 0.14], [0, 0.42, 0], '#b8432f', [0, 0, 0], 0.04);
  },
  'tranquera-abierta': (c) => {
    palo(c, 0.09, 1.4, [-1.6, 0.7, 0], [0, 0, 0], '#5f4a33'); palo(c, 0.09, 1.4, [1.6, 0.7, 0], [0, 0, 0], '#5f4a33');
    const giro = 1.25;   // la hoja abierta, colgada del poste de la izquierda
    for (let i = 0; i < 4; i++) caja(c, [3.0, 0.1, 0.06], [-1.6 + Math.cos(giro) * 1.5, 0.35 + i * 0.28, Math.sin(giro) * 1.5], '#8a6b48', [0, -giro, 0], 0.1);
    caja(c, [0.08, 1.1, 0.08], [-1.6 + Math.cos(giro) * 2.95, 0.75, Math.sin(giro) * 2.95], '#8a6b48', [0, -giro, 0], 0.1);
  },
  // el farol en el piso del galpón (el vidrio, en la malla de brillo)
  'farol-galpon': (c) => {
    cajaM(c, [0.22, 0.04, 0.22], [0, 0.02, 0], '#2d2b29', [0, 0, 0], 0.04);
    cajaM(c, [0.24, 0.04, 0.24], [0, 0.36, 0], '#2d2b29', [0, 0, 0], 0.04);
    palo(c, 0.012, 0.12, [0, 0.44, 0], [0, 0, 1.57], '#2d2b29');
    for (let i = 0; i < 3; i++) cajaM(c, [0.5, 0.42, 0.34], [0.55 + (i % 2) * 0.1, 0.21 + Math.floor(i / 2) * 0.42, -0.6 + i * 0.35], '#cdbfa0', [0, 0.3 * i, 0], 0.1);   // las bolsas abiertas
  },
  'puertita-reves': (c) => {
    palo(c, 0.05, 0.9, [0, 0.45, 0], [0, 0, 0], '#5f4a33');
    caja(c, [0.26, 0.4, 0.03], [0, 0.62, 0.06], '#8a5a34', [0, 0, Math.PI], 0.1);
    esfera(c, 0.022, [-0.07, 0.62, 0.085], '#e7ddc6', [1, 1, 1], 0.02);
  },
  'barro-bellotas': (c) => {
    [[-0.3, 1.25, 0.25], [0.05, 1.05, 0.33], [0.32, 1.38, 0.2], [-0.05, 1.5, 0.16], [0.4, 0.95, 0.22]].forEach(([x, y, r]) => esfera(c, r, [x, y, 0.02], '#4a3726', [1, 0.8, 0.12], 0.12));
    for (let i = 0; i < 9; i++) { const x = (i - 4) * 0.13, z = 0.15 + (i % 3) * 0.08; esfera(c, 0.035, [x, 0.035, z], '#8a5a2b', [1, 1.3, 1], 0.08); esfera(c, 0.033, [x, 0.065, z], '#5a4028', [1, 0.45, 1], 0.06); }
  },
  mapa: (c) => {
    cajaM(c, [0.72, 0.006, 0.5], [0, 0.003, 0], '#c9b07e', [0, 0.15, 0], 0.03);   // (más oscuro: el papel claro se perdía contra la tabla)
    cajaM(c, [0.62, 0.008, 0.05], [0, 0.006, 0.05], '#2f5f86', [0, 0.55, 0], 0.03);   // el arroyo
    for (const [x, z] of [[-0.24, -0.16], [-0.1, -0.2], [0.05, -0.17]]) esfera(c, 0.04, [x, 0.008, z], '#5d7d3a', [1, 0.2, 1], 0.05);   // el bosque
    cajaM(c, [0.1, 0.02, 0.08], [0.18, 0.01, -0.12], '#4a3220', [0, 0.15, 0], 0.03);   // el galpón
    cajaM(c, [0.22, 0.012, 0.02], [-0.12, 0.008, 0.16], '#b8432f', [0, -0.4, 0], 0.03);   // la flecha del lado de ataque
    esfera(c, 0.035, [-0.28, 0.02, 0.18], '#8a877f', [1, 0.6, 1], 0.06);   // una piedra para que no se vuele
  },
  'arco-mesa': (c) => {
    for (let i = 0; i < 7; i++) { const a = -0.6 + i * 0.2, x = Math.sin(a) * 0.75, z = (Math.cos(a) - 0.88) * 0.75; cajaM(c, [0.22, 0.03, 0.035], [x, 0.02, z], '#8a6a40', [0, -a, 0], 0.06); }
  },
  puntas: (c) => {
    for (let i = 0; i < 12; i++) c.agregar(new THREE.ConeGeometry(0.018, 0.07, 5), { color: '#5d5f63', tipo: 0, variar: 0.08, matriz: matriz([(i % 4) * 0.06 - 0.09, 0.012, Math.floor(i / 4) * 0.06 - 0.06], [0, 0, Math.PI / 2]) });
  },
  'atado-flechas': (c) => {
    for (let i = 0; i < 10; i++) { const x = (i % 5) * 0.03 - 0.06, z = Math.floor(i / 5) * 0.03; palo(c, 0.007, 0.85, [x, 0.43, z], [0.06, 0, 0.03 * (i % 3 - 1)], '#8a6a40'); esfera(c, 0.02, [x, 0.84, z + 0.05], '#f0ece2', [0.4, 1.6, 1], 0.04); }
    cajaM(c, [0.18, 0.03, 0.1], [-0.01, 0.4, 0.015], '#b8432f', [0, 0, 0], 0.04);
  },
  // lo prestado, durante la escena que lo trae (en la noche lo arma historia-noche-mundo.js)
  estacas: (c, info) => {
    for (let i = 0; i < 7; i++) { const x = (i - 3) * 0.9, y = info.suelo(x, 0); palo(c, 0.06, 1.4, [x, y + 0.5, 0.15], [0.55, 0, 0], '#6b5238'); c.agregar(new THREE.ConeGeometry(0.065, 0.2, 6), { color: '#5d5f63', tipo: 4, variar: 0.06, matriz: matriz([x, y + 1.13, 0.53], [0.55, 0, 0]) }); }
  },
  'frascos-miel': (c) => {
    for (const x of [-0.25, 0.25]) { palo(c, 0.1, 0.22, [x, 0.11, 0], [0, 0, 0], '#c98a2a'); palo(c, 0.105, 0.03, [x, 0.235, 0], [0, 0, 0], '#e9e2d0'); }
  },
  empalizada: (c, info) => {
    for (let i = 0; i < 7; i++) { const x = (i - 3) * 0.3, y = info.suelo(x, 0); caja(c, [0.26, 1.7, 0.15], [x, y + 0.8, 0], i % 2 ? '#4d3b2a' : '#3f3022', [0, 0, 0.03 * (i % 3 - 1)], 0.1); }
    caja(c, [2.3, 0.15, 0.12], [0, info.suelo(0, 0) + 1.2, -0.13], '#4d3b2a', [0, 0, 0], 0.1);
  },
  'campana-palo': (c) => {
    palo(c, 0.08, 2.3, [0, 1.15, 0], [0, 0, 0], '#5f4a33');
    caja(c, [0.9, 0.09, 0.09], [0.38, 2.2, 0], '#5f4a33', [0, 0, 0], 0.08);
    palo(c, 0.01, 0.2, [0.68, 2.06, 0], [0, 0, 0], '#3a3734');
    c.agregar(new THREE.CylinderGeometry(0.08, 0.17, 0.26, 10), { color: '#9a7a3a', tipo: 4, variar: 0.05, matriz: matriz([0.68, 1.85, 0]) });
  },
  'pirca-alta': (c, info) => {
    const r = Math.max(0.8, Number(info?.r) || 1.4) + 0.95;
    for (let k = 0; k < 2; k++) for (let i = 0; i < 15; i++) { const a = ((i + k * 0.5) / 15) * Math.PI * 2; esfera(c, 0.2, [Math.cos(a) * (r - 0.1 - k * 0.05), 0.6 + k * 0.2, Math.sin(a) * (r - 0.1 - k * 0.05)], i % 2 ? '#8d8a82' : '#7d7a72', [1, 0.7, 1], 0.12); }
  },
  // la aldea en la loma: siluetas con su farol (el vidrio, en la malla de brillo), en una fila que sigue el suelo
  faroles: (c, info) => {
    for (let i = 0; i < 12; i++) {
      const x = (i - 5.5) * 2.1 + Math.sin(i * 1.7) * 0.4, z = Math.sin(i * 0.9) * 1.2, y = info.suelo(x, z), chico = i % 4 === 3, k = chico ? 0.7 : 1;
      caja(c, [0.42 * k, 1.05 * k, 0.3 * k], [x, y + 0.55 * k, z], '#24211e', [0, 0.2 * Math.sin(i), 0], 0.12);
      esfera(c, 0.14 * k, [x, y + 1.2 * k, z], '#2c2824', [1, 1.1, 1], 0.08);
      palo(c, 0.012, 0.22, [x + 0.26 * k, y + 0.98 * k, z + 0.05], [0, 0, 0], '#24211e');
    }
  },
  'cartel-tabla': (c) => {
    palo(c, 0.06, 1.7, [-0.75, 0.85, 0], [0, 0, 0], '#5f4a33'); palo(c, 0.06, 1.7, [0.75, 0.85, 0], [0, 0, 0], '#5f4a33');
    caja(c, [1.75, 0.42, 0.05], [0, 1.45, 0.05], '#a07a4a', [0, 0, 0], 0.08);
    for (let i = 0; i < 6; i++) caja(c, [0.16 + (i % 3) * 0.05, 0.12, 0.012], [-0.65 + i * 0.26, 1.47, 0.08], '#3a2a1c', [0, 0, 0], 0.04);   // «Puesto Catrileo», a pincel
  },
  'cartel-chapa': (c, info) => {
    const r = Math.max(0.8, Number(info?.r) || 1.4), a = 1.2, x = Math.cos(a) * (r + 0.06), z = Math.sin(a) * (r + 0.06);
    caja(c, [0.42, 0.26, 0.015], [x, 1.45, z], '#9aa3a8', [0, Math.PI / 2 - a, 0], 0.04);
    for (let i = 0; i < 3; i++) caja(c, [0.3 - i * 0.06, 0.03, 0.006], [x + Math.cos(a) * 0.012, 1.52 - i * 0.06, z + Math.sin(a) * 0.012], '#2d3236', [0, Math.PI / 2 - a, 0], 0.03);
  },
  'puertita-nueva': (c) => {
    caja(c, [0.28, 0.42, 0.035], [0, 0.22, 0], '#c8a274', [-0.12, 0, 0], 0.06);
    caja(c, [0.04, 0.12, 0.04], [-0.14, 0.3, 0.02], '#6a4a30', [-0.12, 0, 0], 0.05);
    caja(c, [0.04, 0.12, 0.04], [-0.14, 0.12, 0.02], '#6a4a30', [-0.12, 0, 0], 0.05);
    esfera(c, 0.022, [0.08, 0.22, 0.03], '#e7ddc6', [1, 1, 1], 0.02);
  },
  // las puertitas de la raíz, abiertas de par en par, vacías y con telarañas (entre las de siempre, que quedan cerradas)
  'puertitas-abiertas': (c, info) => {
    const r = Math.max(0.8, Number(info?.r) || 1.4);
    [1.2, 2.65, 4.15, 5.6].forEach((a) => {
      const cx = Math.cos(a) * (r + 0.03), cz = Math.sin(a) * (r + 0.03), giro = Math.PI / 2 - a;
      caja(c, [0.24, 0.34, 0.02], [cx, 0.2, cz], '#1c1511', [0, giro, 0], 0.05);   // el hueco
      const bx = cx + Math.cos(a) * 0.12 + Math.cos(giro) * 0.14, bz = cz + Math.sin(a) * 0.12 - Math.sin(giro) * 0.14;
      caja(c, [0.22, 0.32, 0.03], [bx, 0.2, bz], '#6e4a2a', [0, giro + 1.3, 0], 0.1);   // la hoja abierta
      for (let k = 0; k < 3; k++) caja(c, [0.28, 0.006, 0.006], [cx + Math.cos(a) * 0.02, 0.12 + k * 0.1, cz + Math.sin(a) * 0.02], '#d8d8d0', [0, giro, 0.5 - k * 0.5], 0.02);   // telarañas
    });
  },
  bellota: (c) => {
    esfera(c, 0.05, [0, 0.06, 0], '#8a5a2b', [1, 1.35, 1], 0.06);
    esfera(c, 0.052, [0, 0.11, 0], '#5a4028', [1, 0.5, 1], 0.06);
    palo(c, 0.006, 0.03, [0, 0.145, 0], [0, 0, 0], '#5a4028');
  },
  'bolsa-doblada': (c) => {
    caja(c, [0.42, 0.05, 0.3], [0, 0.025, 0], '#cdbfa0', [0, 0.25, 0], 0.06);
    caja(c, [0.4, 0.03, 0.14], [0.01, 0.06, -0.06], '#c4b593', [0, 0.25, 0], 0.06);
    caja(c, [0.44, 0.012, 0.02], [0, 0.08, 0], '#b8432f', [0, 0.25, 0], 0.03);
  },
  // el arco y la honda colgados en la pared izquierda del refugio (la pared queda a −x: el arco va en el plano y-z)
  'arco-honda': (c) => {
    for (let i = 0; i < 7; i++) { const a = -0.6 + i * 0.2, z = Math.sin(a) * 0.72, y = 1.0 + (Math.cos(a) - 0.88) * 0.72; cajaM(c, [0.035, 0.22, 0.03], [-0.02, y, z], '#8a6a40', [a, 0, 0], 0.06); }
    cajaM(c, [0.008, 0.008, 0.98], [0.0, 1.0 - 0.12 * 0.72, 0], '#e9e2d0', [0, 0, 0], 0.02);   // la cuerda
    palo(c, 0.008, 0.55, [-0.01, 0.75, 0.75], [0, 0, 0], '#7a5a38'); palo(c, 0.008, 0.55, [-0.01, 0.75, 0.85], [0, 0, 0], '#7a5a38');
    cajaM(c, [0.03, 0.11, 0.09], [-0.01, 0.47, 0.8], '#5a3d26', [0, 0, 0], 0.06);   // el cuero de la honda
    esfera(c, 0.02, [0, 1.03, 0.8], '#5f5f5f', [1, 1, 1], 0.04);   // el clavo
  },
  // sobre la estantería de verdad del refugio (la del fondo, estructuras.js), en la punta libre de la tabla de abajo: la puertita abierta y el piñón
  'repisa-puertita': (c) => {
    cajaM(c, [0.15, 0.24, 0.02], [0, 0.12, -0.08], '#6e4a2a', [0, 0, 0], 0.08);
    cajaM(c, [0.14, 0.23, 0.02], [0.06, 0.12, 0.0], '#8a5a34', [0, -1.2, 0], 0.1);   // abierta
    esfera(c, 0.025, [-0.01, 0.035, -0.04], '#6a4428', [1, 1.6, 1], 0.06);   // el piñón tostado
  },
  // el frasco de masa madre de 1987 (la optativa del acto I; el objeto es de A): en la punta libre de la tabla de arriba de la estantería
  frasco: (c) => {
    palo(c, 0.065, 0.17, [0, 0.085, 0], [0, 0, 0], '#d9d2b8');   // el frasco
    palo(c, 0.05, 0.09, [0, 0.06, 0], [0, 0, 0], '#efe6cc');     // la masa adentro
    palo(c, 0.072, 0.03, [0, 0.18, 0], [0, 0, 0], '#b8432f');    // la tapa, con el trapito colorado
  },
  pan: (c) => {
    cajaM(c, [0.42, 0.04, 0.32], [0, 0.02, 0], '#e9e2d0', [0, 0.2, 0], 0.04);   // el repasador
    esfera(c, 0.13, [0, 0.1, 0], '#b9803e', [1.3, 0.62, 1], 0.08);
    for (let i = 0; i < 3; i++) cajaM(c, [0.02, 0.01, 0.16], [-0.06 + i * 0.06, 0.175, 0], '#e3c08a', [0, 0.2, 0.15], 0.04);   // los cortes
  },
  'repisa-canto': (c) => { esfera(c, 0.1, [-0.02, 0.07, 0], '#f3f0e8', [1, 0.78, 0.9], 0.02); },   // (en la estantería, como la puertita)
  raiz: (c) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      esfera(c, 0.2, [Math.cos(a) * 0.9, 0.1, Math.sin(a) * 0.9], '#807a6f', [1.2, 0.6, 1], 0.12);
    }
    caja(c, [0.6, 0.08, 0.5], [0, 0.04, 0], '#5d4630', [0, 0.4, 0], 0.1);
  },
};

// 4.18.0 (C): lo que brilla (la misma forma, en una segunda malla con MeshBasicMaterial y color de vértice: no le llega la luz, se ve de noche)
const brilla = (c, r, pos, color, esc = [1, 1, 1]) => c.agregar(new THREE.SphereGeometry(r, 8, 6), { color, tipo: 0, variar: 0.04, matriz: matriz(pos, [0, 0, 0], esc) });
const FORMAS_BRILLO = {
  'manta-estufa': (c) => { caja(c, [0.26, 0.14, 0.02], [-0.98, 0.26, 0.37], '#ff8a32', [0, 0.2, 0], 0.08); },   // la boca de la estufa
  'farol-galpon': (c) => {
    brilla(c, 0.11, [0, 0.2, 0], '#ffc25a', [1, 1.35, 1]);
    for (let i = 0; i < 5; i++) { const a = i * 1.26; caja(c, [0.9, 0.01, 0.05], [Math.cos(a) * 0.75, 0.005, Math.sin(a) * 0.75], '#8a5a20', [0, -a, 0], 0.15); }   // la luz que se cuela entre las tablas del piso
  },
  faroles: (c, info) => {
    for (let i = 0; i < 12; i++) {
      const x = (i - 5.5) * 2.1 + Math.sin(i * 1.7) * 0.4, z = Math.sin(i * 0.9) * 1.2, y = info.suelo(x, z), k = i % 4 === 3 ? 0.7 : 1;
      brilla(c, 0.13, [x + 0.26 * k, y + 0.82 * k, z + 0.05], i % 3 ? '#ffcf6a' : '#ffb44a', [1, 1.3, 1]);
    }
  },
  // veinte lucecitas ámbar en semicírculo, bajitas, en las raíces (de a una: se prenden escalonadas con la escena; acá ya están las veinte)
  lucecitas: (c, info) => {
    for (let i = 0; i < 20; i++) { const a = Math.PI * (0.08 + 0.84 * (i / 19)), r = 3.2 + Math.sin(i * 2.3) * 0.5, x = Math.cos(a) * r, z = Math.sin(a) * r * 0.7; brilla(c, 0.05 + (i % 3) * 0.01, [x, info.suelo(x, z) + 0.25 + (i % 4) * 0.12, z], i % 2 ? '#ffbe4d' : '#ffd27a'); }
  },
  'lucecitas-tres': (c) => { for (let i = 0; i < 3; i++) brilla(c, 0.045, [(i - 1) * 0.18, 0.55 + (i % 2) * 0.08, Math.sin(i) * 0.05], '#ffc25a'); },
  'lucecitas-ronda': (c, info) => {
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2, x = Math.cos(a) * 3.6, z = Math.sin(a) * 3.6; brilla(c, 0.05, [x, info.suelo(x, z) + 0.7 + (i % 5) * 0.25, z], i % 2 ? '#ffbe4d' : '#ffd27a'); }
  },
};
// las formas que siguen el suelo (anchas: una fila de 24 m sobre la loma) se rearman cuando cambian de lugar
const SIGUE_SUELO = new Set(['faroles', 'lucecitas', 'lucecitas-ronda', 'estacas', 'empalizada']);
const enEscenaDom = () => { try { return typeof document !== 'undefined' && !!document.body?.classList?.contains('escena-en-curso'); } catch { return false; } };

// `ctx`: { T, escena, grupo?, refugio: () => ref, molino: () => { raiz, arbol } | null, puntos: () => ({ nombre: {x, z} }), alturaDePie?: (x, z) => y }
// 4.16.0: los puntos con nombre (el galponcito de tu obra, la estación, el faro…) pueden cambiar o aparecer más tarde: la posición se recalcula en cada
// `mostrar` (cada medio segundo) y el objeto se mueve si hace falta.
export function crearObjetosHistoria(ctx) {
  const mat = materialVegetal({ flex: 0 });
  const mallas = {}, posiciones = {}, claves = {};
  // 4.18.0 (C): lo que puso un efecto de la escena que está corriendo: id → { puesto } o { apaga, hasta }. Se borra cuando la escena termina.
  const enEscena = {};
  const grupo = new THREE.Group();
  grupo.name = 'historia-objetos';
  (ctx.grupo || ctx.escena).add(grupo);
  const alt = (x, z) => (ctx.alturaDePie ? ctx.alturaDePie(x, z) : ctx.T.altura(x, z));

  // dónde va el objeto en el mundo: { x, z } o null si todavía no se sabe
  function lugarDe(id) {
    const o = OBJETOS[id];
    if (o.lugar === 'molino-viejo') { const m = ctx.molino?.(); return m ? { x: m.raiz.x + (o.dx || 0), z: m.raiz.z + (o.dz || 0) } : null; }
    if (o.lugar === 'coihue') { const m = ctx.molino?.(); return m?.arbol ? { x: m.arbol.x, z: m.arbol.z } : null; }
    if (o.punto) { const p = ctx.puntos?.()?.[o.punto]; return p ? { x: p.x + (o.dx || 0), z: p.z + (o.dz || 0) } : null; }
    if (Number.isFinite(o.lx)) { const ref = ctx.refugio(); return ref ? aMundoRefugio(ref, o.lx, o.lz) : null; }
    return null;
  }
  const claveHuellas = (q, hasta) => (hasta ? `${q.x.toFixed(1)},${q.z.toFixed(1)}>${hasta.x.toFixed(1)},${hasta.z.toFixed(1)}` : '');
  // el rastro de huellas: de la raíz del coihue a la raíz de la ladera de Ramón (cada pie, un óvalo chico y plano pegado al suelo)
  function huellas(c, desdeP, hastaP) {
    const dx = hastaP.x - desdeP.x, dz = hastaP.z - desdeP.z, dist = Math.hypot(dx, dz) || 1;
    const n = Math.max(8, Math.min(44, Math.round(dist / 2.4))), ang = Math.atan2(dx, dz);
    // 4.17.0: más grandes y más claras (a 0,05 m de radio no se veían ni de cerca), y más seguidas en los primeros diez metros, que es donde se las mira
    const pie = (x, z, lado) => c.agregar(new THREE.SphereGeometry(0.085, 7, 5), { color: '#f4f8ff', tipo: 0, variar: 0.02, matriz: matriz([x, alt(x, z) + 0.04, z], [0, ang + lado * 0.12, 0], [1, 0.16, 1.9]) });
    for (let k = 1; k <= 9 && k * 1.1 < dist; k++) { const lado = k % 2 ? 1 : -1, d = k * 1.1; pie(desdeP.x + (dx / dist) * d + Math.cos(ang) * 0.13 * lado, desdeP.z + (dz / dist) * d - Math.sin(ang) * 0.13 * lado, lado); }
    for (let i = 1; i < n; i++) {
      const u = i / n, lado = i % 2 ? 1 : -1, ondula = Math.sin(u * 9) * 1.1;
      pie(desdeP.x + dx * u + Math.cos(ang) * (0.13 * lado + ondula), desdeP.z + dz * u - Math.sin(ang) * (0.13 * lado + ondula), lado);
    }
  }
  // 4.18.0 (C): el suelo debajo de un punto local de la forma (para las que son anchas), relativo al suelo del origen
  const sueloLocal = (q, rot) => {
    const y0 = alt(q.x, q.z), c = Math.cos(rot), s = Math.sin(rot);
    return (lx, lz) => { const x = q.x + lx * c + lz * s, z = q.z - lx * s + lz * c; const y = alt(x, z); return Number.isFinite(y) ? Math.max(-3, Math.min(3, y - y0)) : 0; };
  };
  function armarMalla(id, q, rot = 0) {
    const o = OBJETOS[id];
    const conForma = !!o.forma && Object.hasOwn(FORMAS, o.forma), conBrillo = !!o.forma && Object.hasOwn(FORMAS_BRILLO, o.forma);
    if (!o.forma || (o.forma !== 'huellas' && !conForma && !conBrillo)) return;   // (la nota de la mesa, el cuaderno de la mesa y las raíces sin malla se usan con la E)
    const info = { r: ctx.molino?.()?.arbol?.r, suelo: SIGUE_SUELO.has(o.forma) ? sueloLocal(q, rot) : () => 0 };
    let m = null;
    if (o.forma === 'huellas' || conForma) {
      const c = new Constructor();
      if (o.forma === 'huellas') {
        const hasta = ctx.puntos?.()?.[o.hasta];
        if (!hasta) return;
        huellas(c, q, hasta);
        claves[id] = claveHuellas(q, hasta);
      } else FORMAS[o.forma](c, info);
      m = new THREE.Mesh(c.geometria(), mat);
      m.castShadow = false; m.receiveShadow = true;   // (sin sombra propia: un dibujo menos en el mapa de sombras y ningún programa de profundidad nuevo cuando sale a la luz de día)
    }
    // 4.18.0 (C): lo que brilla, en una malla hija (o sola, si no hay otra): sin sombra y sin luz
    if (conBrillo) {
      const c = new Constructor();
      FORMAS_BRILLO[o.forma](c, info);
      if (!matBrillo) matBrillo = new THREE.MeshBasicMaterial({ vertexColors: true });
      const b = new THREE.Mesh(c.geometria(), matBrillo);
      b.castShadow = false; b.receiveShadow = false; b.name = `historia-brillo:${id}`;
      if (m) m.add(b); else m = b;
    }
    m.name = `historia-objeto:${id}`;
    m.visible = false;
    if (SIGUE_SUELO.has(o.forma)) claves[id] = `${q.x.toFixed(1)},${q.z.toFixed(1)},${rot.toFixed(2)}`;
    grupo.add(m);
    mallas[id] = m;
  }
  function quitarMalla(id) {
    const m = mallas[id]; if (!m) return;
    grupo.remove(m);
    m.traverse((x) => { if (x.geometry) x.geometry.dispose(); });
    delete mallas[id]; delete claves[id];
  }
  // 4.18.0 (C): dónde va mientras dura la escena que lo trae (si la escena lo pide), si no su lugar de siempre
  function puestoDe(id) {
    const e = enEscena[id];
    if (e?.puesto) return e.puesto;
    const o = OBJETOS[id];
    if (o.hacia) return puestoHacia(o, ctx.puntos?.());
    if (o.soloEscena && !o.punto) return null;
    return lugarDe(id);
  }
  function colocar(id) {
    const q = puestoDe(id);
    if (!q) { delete posiciones[id]; if (mallas[id]) mallas[id].visible = false; return null; }
    const antes = posiciones[id];
    posiciones[id] = { x: q.x, z: q.z };
    const o = OBJETOS[id];
    if (o.forma === 'huellas') {
      const k = claveHuellas(q, ctx.puntos?.()?.[o.hasta]);
      if (mallas[id] && claves[id] !== k) quitarMalla(id);
      if (!mallas[id] && k) armarMalla(id, q);
      return q;
    }
    const rot = Number.isFinite(q.rot) ? q.rot : Number.isFinite(o.lx) ? (Number(ctx.refugio()?.rot) || 0) + (id === 'puertita' ? 0.4 : 0) : 0;
    if (mallas[id] && SIGUE_SUELO.has(o.forma) && claves[id] !== `${q.x.toFixed(1)},${q.z.toFixed(1)},${rot.toFixed(2)}`) { const vis = mallas[id].visible; quitarMalla(id); armarMalla(id, q, rot); if (mallas[id]) mallas[id].visible = vis; }
    if (!mallas[id]) armarMalla(id, q, rot);
    const m = mallas[id];
    if (m && (!antes || antes.x !== q.x || antes.z !== q.z || m.userData.puesto !== true || m.rotation.y !== rot)) {
      m.position.set(q.x, alt(q.x, q.z) + (Number(o.y) || 0), q.z);
      m.rotation.y = rot;
      m.userData.puesto = true;
    }
    return q;
  }
  function armar() { for (const id of Object.keys(OBJETOS)) colocar(id); }
  armar();
  let ultimosIds = [];
  const visibleAhora = (id, set) => {
    const o = OBJETOS[id], e = enEscena[id];
    if (e?.apagado) return false;
    if (Object.values(enEscena).some((x) => x.apaga === id)) return false;
    return (o.soloEscena ? false : set.has(id)) || (!!e && !o.apaga);
  };
  // Qué se ve: lo que dice la historia (los demás se esconden), más lo que puso la escena en curso
  function mostrar(ids) {
    ultimosIds = Array.isArray(ids) ? ids : [];
    if (Object.keys(enEscena).length && !enEscenaDom()) for (const k of Object.keys(enEscena)) delete enEscena[k];
    const set = new Set(ultimosIds);
    for (const id of Object.keys(OBJETOS)) { colocar(id); if (mallas[id]) mallas[id].visible = visibleAhora(id, set) && !!posiciones[id]; }
  }
  // 4.18.0 (C): un efecto de escena (`mundo:<id>` o `duende:<id>`; lo llama main.js): `p` es dónde lo pone la escena (o null), `jug` = { pos, yaw }
  function efecto(clave, p, jug) {
    const ids = propsDeEfecto(clave);
    for (const id of ids) {
      const o = OBJETOS[id];
      if (o.apaga) { enEscena[id] = { apaga: o.apaga.prop, hasta: o.apaga.hasta }; continue; }
      const puesto = o.usaDonde || o.frente ? puestoDeEfecto(o, o.usaDonde ? p : null, jug) : null;
      enEscena[id] = { puesto };
    }
    // el que vuelve a prender lo que otro apagó
    for (const [k, e] of Object.entries(enEscena)) if (e.hasta === clave) delete enEscena[k];
    if (ids.length || clave) mostrar(ultimosIds);
    return ids;
  }
  // el molino viejo se calcula después (necesita el terreno y los árboles): se vuelve a ubicar la raíz
  function reubicar() {
    for (const id of Object.keys(mallas)) quitarMalla(id);
    for (const k of Object.keys(claves)) delete claves[k];
    armar();
  }
  return { mostrar, reubicar, efecto, enEscena, posiciones, mallas, grupo, cercano: (pos, visibles, accion) => objetoCercano(pos, visibles, posiciones, accion) };
}
let matBrillo = null;   // 4.18.0 (C): MeshBasicMaterial con color de vértice, como las brasas de la aldea (el mismo programa)
