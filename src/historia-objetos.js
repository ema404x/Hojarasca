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
    if (!q || !accion(id)) continue;
    const d = Math.hypot(pos.x - q.x, pos.z - q.z);
    const radio = Object.hasOwn(OBJETOS, id) && OBJETOS[id].forma === 'raiz' ? 3.4 : RADIO_OBJETO;
    if (d <= radio && d < dm) { dm = d; mejor = id; }
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
      caja(c, [0.4, 0.045, 0.045], [Math.cos(a) * 0.55, 0.05, Math.sin(a) * 0.55], '#8a6a45', [0, -a + Math.PI / 2, 0], 0.14);
    }
  },
  bolsa: (c) => {
    caja(c, [0.46, 0.62, 0.3], [0, 0.31, 0], '#cdbfa0', [0, 0.2, 0.05], 0.1);
    caja(c, [0.48, 0.05, 0.32], [0, 0.46, 0], '#b8432f', [0, 0.2, 0.05], 0.05);
    esfera(c, 0.1, [0, 0.64, 0], '#bfae8a', [1.5, 0.7, 1], 0.08);
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
  'hacha-tocon': (c) => {
    palo(c, 0.4, 0.42, [0, 0.21, 0], [0, 0, 0], '#6b4f35');
    palo(c, 0.4, 0.04, [0, 0.43, 0], [0, 0, 0], '#c9ac80');
    caja(c, [0.05, 0.62, 0.05], [0.05, 0.72, 0.02], '#7a5a38', [0, 0, 0.18], 0.06);
    caja(c, [0.2, 0.15, 0.05], [0.12, 0.99, 0.02], '#8d949a', [0, 0, 0.18], 0.06);
  },
  raiz: (c) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      esfera(c, 0.2, [Math.cos(a) * 0.9, 0.1, Math.sin(a) * 0.9], '#807a6f', [1.2, 0.6, 1], 0.12);
    }
    caja(c, [0.6, 0.08, 0.5], [0, 0.04, 0], '#5d4630', [0, 0.4, 0], 0.1);
  },
};

// `ctx`: { T, escena, grupo?, refugio: () => ref, molino: () => { raiz } | null, jugador: () => ({x, z}) }
export function crearObjetosHistoria(ctx) {
  const mat = materialVegetal({ flex: 0 });
  const mallas = {}, posiciones = {};
  let listo = false;
  const grupo = new THREE.Group();
  grupo.name = 'historia-objetos';
  (ctx.grupo || ctx.escena).add(grupo);
  const alt = (x, z) => ctx.T.altura(x, z);

  function lugarDe(id) {
    const o = OBJETOS[id];
    if (o.lugar === 'molino-viejo') { const m = ctx.molino?.(); return m ? { x: m.raiz.x, z: m.raiz.z } : null; }
    const ref = ctx.refugio();
    return ref ? aMundoRefugio(ref, o.lx, o.lz) : null;
  }
  function armar() {
    if (listo) return;
    for (const id of Object.keys(OBJETOS)) {
      const forma = OBJETOS[id].forma;
      const q = lugarDe(id);
      if (!q) continue;
      posiciones[id] = { x: q.x, z: q.z };
      if (!Object.hasOwn(FORMAS, forma)) continue;   // (la nota de la mesa no tiene malla: se lee con la E)
      const c = new Constructor();
      FORMAS[forma](c);
      const m = new THREE.Mesh(c.geometria(), mat);
      m.name = `historia-objeto:${id}`;
      m.position.set(q.x, alt(q.x, q.z), q.z);
      m.rotation.y = (Number(ctx.refugio()?.rot) || 0) + (id === 'puertita' ? 0.4 : 0);
      m.castShadow = false; m.receiveShadow = true;   // (sin sombra propia: un dibujo menos en el mapa de sombras y ningún programa de profundidad nuevo cuando sale a la luz de día)
      grupo.add(m);
      mallas[id] = m;
    }
    listo = true;
  }
  armar();
  // Qué se ve: lo que dice la historia (los demás se esconden)
  function mostrar(ids) {
    armar();
    const set = new Set(ids);
    for (const [id, m] of Object.entries(mallas)) m.visible = set.has(id);
  }
  // el molino viejo se calcula después (necesita el terreno y los árboles): se vuelve a ubicar la raíz
  function reubicar() {
    listo = false;
    for (const m of Object.values(mallas)) grupo.remove(m);
    for (const k of Object.keys(mallas)) delete mallas[k];
    armar();
  }
  return { mostrar, reubicar, posiciones, mallas, grupo, cercano: (pos, visibles, accion) => objetoCercano(pos, visibles, posiciones, accion) };
}
