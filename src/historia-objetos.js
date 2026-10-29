// 4.15.0: los objetos de la Historia en el mundo (el canto blanco del umbral, la ronda de ramitas, la bolsa de Eusebio, el alero, la
// puertita, el hacha en el tocón, la raíz del coihue grande). Qué se ve y qué hace la E está en `historia-disparadores.js` (OBJETOS,
// puro); acá están las cuentas de dónde van (puras, se prueban en Node) y las mallas.
//
// Rendimiento y shaders: ninguna luz ni programa nuevo. Cada objeto es una malla chica con el MISMO material de las estructuras
// (`materialVegetal({ flex: 0 })`, tipo 0 o 4: el programa de siempre) y sólo se dibuja el que está a la vista según la historia.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { OBJETOS, RADIO_OBJETO } from './historia-disparadores.js';

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
    if (!q) continue;
    const d = Math.hypot(pos.x - q.x, pos.z - q.z);
    const radio = Object.hasOwn(OBJETOS, id) && (OBJETOS[id].forma === 'raiz' || OBJETOS[id].lugar === 'molino-viejo') ? 3.4 : RADIO_OBJETO;
    // 4.17.1: primero la distancia y después la acción (que arma el estado entero de la historia): antes se armaba para los ~40 objetos cada 250 ms
    if (d <= radio && d < dm && accion(id)) { dm = d; mejor = id; }
  }
  return mejor;
}

// ---------------------------------------------------------------- las mallas
const caja = (c, dims, pos, color, rot = [0, 0, 0], variar = 0.08) => c.agregar(new THREE.BoxGeometry(...dims), { color, tipo: 4, variar, matriz: matriz(pos, rot) });
const esfera = (c, r, pos, color, esc = [1, 1, 1], variar = 0.05) => c.agregar(new THREE.SphereGeometry(r, 9, 7), { color, tipo: 0, variar, matriz: matriz(pos, [0, 0, 0], esc) });
const palo = (c, r, largo, pos, rot, color) => c.agregar(new THREE.CylinderGeometry(r, r * 1.1, largo, 7), { color, tipo: 0, variar: 0.1, matriz: matriz(pos, rot) });

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
  raiz: (c) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      esfera(c, 0.2, [Math.cos(a) * 0.9, 0.1, Math.sin(a) * 0.9], '#807a6f', [1.2, 0.6, 1], 0.12);
    }
    caja(c, [0.6, 0.08, 0.5], [0, 0.04, 0], '#5d4630', [0, 0.4, 0], 0.1);
  },
};

// `ctx`: { T, escena, grupo?, refugio: () => ref, molino: () => { raiz, arbol } | null, puntos: () => ({ nombre: {x, z} }), alturaDePie?: (x, z) => y }
// 4.16.0: los puntos con nombre (el galponcito de tu obra, la estación, el faro…) pueden cambiar o aparecer más tarde: la posición se recalcula en cada
// `mostrar` (cada medio segundo) y el objeto se mueve si hace falta.
export function crearObjetosHistoria(ctx) {
  const mat = materialVegetal({ flex: 0 });
  const mallas = {}, posiciones = {}, claves = {};
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
  function armarMalla(id, q) {
    const o = OBJETOS[id];
    if (!o.forma || (o.forma !== 'huellas' && !Object.hasOwn(FORMAS, o.forma))) return;   // (la nota de la mesa, el cuaderno de la mesa y las raíces sin malla se usan con la E)
    const c = new Constructor();
    if (o.forma === 'huellas') {
      const hasta = ctx.puntos?.()?.[o.hasta];
      if (!hasta) return;
      huellas(c, q, hasta);
      claves[id] = claveHuellas(q, hasta);
    } else FORMAS[o.forma](c, { r: ctx.molino?.()?.arbol?.r });
    const m = new THREE.Mesh(c.geometria(), mat);
    m.name = `historia-objeto:${id}`;
    m.castShadow = false; m.receiveShadow = true;   // (sin sombra propia: un dibujo menos en el mapa de sombras y ningún programa de profundidad nuevo cuando sale a la luz de día)
    m.visible = false;
    grupo.add(m);
    mallas[id] = m;
  }
  function colocar(id) {
    const q = lugarDe(id);
    if (!q) { delete posiciones[id]; if (mallas[id]) mallas[id].visible = false; return null; }
    const antes = posiciones[id];
    posiciones[id] = { x: q.x, z: q.z };
    const o = OBJETOS[id];
    if (o.forma === 'huellas') {
      const k = claveHuellas(q, ctx.puntos?.()?.[o.hasta]);
      if (mallas[id] && claves[id] !== k) { grupo.remove(mallas[id]); mallas[id].geometry.dispose(); delete mallas[id]; }
      if (!mallas[id] && k) armarMalla(id, q);
      return q;
    }
    if (!mallas[id]) armarMalla(id, q);
    const m = mallas[id];
    if (m && (!antes || antes.x !== q.x || antes.z !== q.z || m.userData.puesto !== true)) {
      m.position.set(q.x, alt(q.x, q.z) + (Number(o.y) || 0), q.z);
      m.rotation.y = Number.isFinite(o.lx) ? (Number(ctx.refugio()?.rot) || 0) + (id === 'puertita' ? 0.4 : 0) : 0;
      m.userData.puesto = true;
    }
    return q;
  }
  function armar() { for (const id of Object.keys(OBJETOS)) colocar(id); }
  armar();
  // Qué se ve: lo que dice la historia (los demás se esconden)
  function mostrar(ids) {
    const set = new Set(ids);
    for (const id of Object.keys(OBJETOS)) { colocar(id); if (mallas[id]) mallas[id].visible = set.has(id) && !!posiciones[id]; }
  }
  // el molino viejo se calcula después (necesita el terreno y los árboles): se vuelve a ubicar la raíz
  function reubicar() {
    for (const m of Object.values(mallas)) { grupo.remove(m); m.geometry?.dispose?.(); }
    for (const k of Object.keys(mallas)) delete mallas[k];
    for (const k of Object.keys(claves)) delete claves[k];
    armar();
  }
  return { mostrar, reubicar, posiciones, mallas, grupo, cercano: (pos, visibles, accion) => objetoCercano(pos, visibles, posiciones, accion) };
}
