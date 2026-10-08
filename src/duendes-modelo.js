// 3.8.0: los duendes del Desafío, armados por código (del prototipo de la rama `proto-duendes`, estilo
// C, bosque y musgo, que eligió el usuario). Acá sólo se arman las geometrías; el esqueleto, la
// animación y el dibujo instanciado están en desafio-duendes.js.
//   · Cada duende es UNA geometría "con piel": cada vértice sabe a qué hueso va (aHuesoParte) y el
//     esqueleto lo mueve en el shader (los mismos huesos que la gente de gente-cuerpo: pelvis, pecho,
//     cabeza, mandíbula, hombros, codos, muslos, rodillas y tobillos; más la punta del gorro, las alas y
//     la montura de la lechuza).
//   · Las piezas son las del prototipo (formas.js) con los atributos del material de la gente
//     (materialGente: el atlas pintado por código: telas, guardas, la pincelada de la piel, las hebras
//     del pelo). Los ojos que brillan y los hongos de luz van en la misma malla (aHuesoParte dice qué
//     parte es: brillo, ojo, botín o punto débil).
//   · Se arma "en reposo" (parado, los brazos colgando) en unidades de figura (la cabeza a ~1,6); el
//     tamaño de verdad lo pone la escala de la instancia. Con `detalle` < 1 salen menos gajos y sin lo
//     fino (dedos, remiendos, mechones): la malla de lejos.
import * as THREE from 'three';
import { huso, coser } from './formas.js';
import { materialGente } from './gente-cuerpo.js';

const TAU = Math.PI * 2;
const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const cl = (x, a, b) => Math.min(b, Math.max(a, x));
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const vv = (a) => (a.isVector3 ? a.clone() : V3(a[0], a[1], a[2]));
export function azar(s) { s = Math.abs(Math.floor(s)) % 2147483646 + 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
// ruido suave fijo, de -1 a 1
export function ruido(x, y, z) {
  return Math.sin(x * 1.9 + y * 1.3) * Math.sin(y * 1.7 - z * 2.1) * 0.5 + Math.sin(z * 2.3 + x * 0.9) * Math.sin(x * 2.9 - y * 0.6 + z * 0.4) * 0.3 + Math.sin(x * 4.1 + z * 3.7 + y * 2.9) * 0.2;
}
const COL = new Map();
export const colorDe = (hex) => { let c = COL.get(hex); if (!c) { c = new THREE.Color(hex); COL.set(hex, c); } return c; };
const tinta = (c, hex, t) => { if (t > 0) c.lerp(colorDe(hex), Math.min(1, t)); };

// ---------------------------------------------------------------- huesos y partes
export const HUESO = { pelvis: 0, pecho: 1, cabeza: 2, mandibula: 3, hombroI: 4, codoI: 5, hombroD: 6, codoD: 7, musloI: 8, rodillaI: 9, tobilloI: 10, musloD: 11, rodillaD: 12, tobilloD: 13, gorro: 14, alaI: 15, alaD: 16, montura: 17 };
export const N_HUESOS = 18;
// qué es cada vértice (va en aHuesoParte = hueso + parte · 32)
export const PARTE = { cuerpo: 0, brillo: 1, ojo: 2, botin: 3, debil: 4 };
const PADRE = [17, 0, 1, 2, 1, 4, 1, 6, 0, 8, 9, 0, 11, 12, 2, 17, 17, -1];

// ---------------------------------------------------------------- el detalle
let DET = 1;
const nn = (v, min = 3) => Math.max(min, Math.round(v * DET));
const fino = () => DET >= 0.6;

// ---------------------------------------------------------------- piezas y fundición
// Una pieza: la geometría (en el espacio de la figura), su color y su hueso (un número, o fn(l, p)
// con la posición antes de ubicarla y la ya ubicada). o: tela, piel, ao, pintar(c, p, n, l), guarda(l,
// p) → [tipo, dist, largo, ancho], hebra(l, p), parte, fuerza (brillo).
function pieza(geo, M, col, o = {}) {
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const local = geo.attributes.position.array.slice();
  if (M) geo.applyMatrix4(M);
  return { geo, local, col, ...o };
}
const _p = V3(), _n = V3(), _l = V3(), _c = new THREE.Color();
// Todas las piezas en una geometría con los atributos de la gente y el hueso de cada vértice.
export function fundirPiezas(piezas) {
  let nv = 0, ni = 0;
  for (const q of piezas) { nv += q.geo.attributes.position.count; ni += q.geo.index ? q.geo.index.count : q.geo.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  const tela = new Float32Array(nv * 3), gua = new Float32Array(nv * 4), zona = new Float32Array(nv * 2), hp = new Float32Array(nv);
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0;
  for (const q of piezas) {
    const P = q.geo.attributes.position, N = q.geo.attributes.normal, L = q.local, n = P.count;
    const fijo = typeof q.col === 'string' ? colorDe(q.col) : null;
    const parte = q.parte || 0, brilla = parte === PARTE.brillo || parte === PARTE.ojo || parte === PARTE.debil;
    for (let i = 0; i < n; i++) {
      _p.fromBufferAttribute(P, i); _n.fromBufferAttribute(N, i); _l.set(L[i * 3], L[i * 3 + 1], L[i * 3 + 2]);
      if (fijo) _c.copy(fijo); else _c.setRGB(1, 1, 1);
      if (typeof q.col === 'function') q.col(_c, _p, _n, _l);
      if (q.pintar) q.pintar(_c, _p, _n, _l, i);
      if (brilla) {
        // el brillo: el centro más claro (mira de frente), el borde del color; fuerte (> 1)
        const f = (q.fuerza ?? 1) * (0.75 + 0.35 * (Math.abs(_n.z) * 0.5 + 0.5));
        _c.multiplyScalar(f);
      }
      const k = ov + i;
      pos[k * 3] = _p.x; pos[k * 3 + 1] = _p.y; pos[k * 3 + 2] = _p.z;
      nor[k * 3] = _n.x; nor[k * 3 + 1] = _n.y; nor[k * 3 + 2] = _n.z;
      col[k * 3] = _c.r; col[k * 3 + 1] = _c.g; col[k * 3 + 2] = _c.b;
      if (q.tela && !brilla) {
        const h = q.hebra ? q.hebra(_l, _p) : [_l.x + _l.z * 0.5, _l.y];
        tela[k * 3] = q.tela; tela[k * 3 + 1] = h[0]; tela[k * 3 + 2] = h[1];
      }
      if (q.guarda) { const g = q.guarda(_l, _p); if (g) gua.set(g, k * 4); }
      zona[k * 2] = q.piel ? 1 : 0;
      zona[k * 2 + 1] = q.ao == null ? 1 : typeof q.ao === 'function' ? q.ao(_p, _n, _l) : q.ao;
      const h = typeof q.hueso === 'function' ? q.hueso(_l, _p) : (q.hueso || 0);
      hp[k] = h + parte * 32;
    }
    if (q.geo.index) { const I = q.geo.index.array; for (let j = 0; j < I.length; j++) idx[oi + j] = I[j] + ov; oi += I.length; } else { for (let j = 0; j < n; j++) idx[oi + j] = ov + j; oi += n; }
    ov += n;
    q.geo.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aTela', new THREE.BufferAttribute(tela, 3));
  g.setAttribute('aGuarda', new THREE.BufferAttribute(gua, 4));
  g.setAttribute('zona', new THREE.BufferAttribute(zona, 2));
  g.setAttribute('aHuesoParte', new THREE.BufferAttribute(hp, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------- geometrías
export const M4 = (pos = [0, 0, 0], rot = [0, 0, 0], esc = [1, 1, 1]) => new THREE.Matrix4().compose(vv(pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')), vv(esc));
const mul = (a, b) => new THREE.Matrix4().multiplyMatrices(a, b);
export const esfera = (a = 20, b = 14) => new THREE.SphereGeometry(1, nn(a, 6), nn(b, 4));
export function deform(geo, fn) {
  const P = geo.attributes.position, v = V3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); fn(v, i); P.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  if (geo.index) coser(geo);
  return geo;
}
export const husoG = (pts, rad, tramos = 12, lados = 10) => huso('#ffffff', pts.map((p) => (p.isVector3 ? [p.x, p.y, p.z] : p)), rad, nn(tramos, 3), nn(lados, 4)).geometry;
export function lathe(perfil, lados = 16, desde = 0, arco = TAU) {
  return new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), nn(lados, 5), desde, arco);
}
// un perfil más fino: interpola los puntos (para que el torno se pueda deformar)
export function afinar(perfil, n = 3) {
  n = Math.max(1, Math.round(n * DET));
  const out = [];
  for (let i = 0; i < perfil.length - 1; i++) for (let j = 0; j < n; j++) { const t = j / n; out.push([perfil[i][0] + (perfil[i + 1][0] - perfil[i][0]) * t, perfil[i][1] + (perfil[i + 1][1] - perfil[i][1]) * t]); }
  out.push(perfil[perfil.length - 1]);
  return out;
}
// una superficie (u, v) ∈ [0,1]²; `grosor`: la cara de atrás (alas, hojas, capas)
export function grilla(fn, nu, nv, grosor = 0) {
  nu = nn(nu, 3); nv = nn(nv, 2);
  const pos = [], idx = [], p = V3();
  const caras = grosor ? 2 : 1;
  for (let c = 0; c < caras; c++) {
    const base = c * (nu + 1) * (nv + 1);
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { fn(i / nu, j / nv, p, c); pos.push(p.x, p.y, p.z); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i, b = a + 1, d = a + nu + 1, e = d + 1;
      if (c === 0) idx.push(a, b, d, b, e, d); else idx.push(a, d, b, b, d, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// dos huesos: dónde queda el codo (o la rodilla) entre `a` y `c`, del lado de `polo`
function ik(a, c, l1, l2, polo) {
  const d = c.clone().sub(a);
  const L = cl(d.length(), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  d.normalize();
  const x = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const pv = polo.clone(); pv.sub(d.clone().multiplyScalar(pv.dot(d)));
  if (pv.lengthSq() < 1e-8) pv.set(0, 0, 1);
  pv.normalize();
  return a.clone().addScaledVector(d, x).addScaledVector(pv, h);
}
const quatDe = (desde, hacia) => new THREE.Quaternion().setFromUnitVectors(desde.clone().normalize(), hacia.clone().normalize());
// de cuál de dos tramos (a→b o b→c) está más cerca un punto: para repartir un miembro en dos huesos
function tramo(a, b, c, h1, h2) {
  const ab = b.clone().sub(a), bc = c.clone().sub(b), t = V3();
  const d = (p, o, v) => { const k = cl(t.copy(p).sub(o).dot(v) / Math.max(1e-6, v.lengthSq()), 0, 1); return t.copy(o).addScaledVector(v, k).distanceToSquared(p); };
  return (l, p) => (d(p, a, ab) <= d(p, b, bc) ? h1 : h2);
}

// ---------------------------------------------------------------- los duendes (estilo C)
// Las medidas "a escala de persona" (como el prototipo); el duende de verdad sale de la escala de la
// instancia. 3.8.0: para que llenen la caja de golpe del invasor sin parecer gente, la cabeza y el gorro
// son más grandes y las piernas más cortas que en el prototipo.
const BASE = {
  cab: 0.25, cabEsc: [1, 1.04, 0.98],
  nariz: { largo: 1.15, punta: 1.2, forma: 'papa' }, orejas: { largo: 1.15, ancho: 1, abre: 1.05 },
  ojos: { tam: 1, iris: '#1a1a0a', brillo: '#d8ff6a', fuerza: 1.8, parpado: 0.38, halo: 0.6, blanco: '#e9e0cc' },
  cejas: { col: '#a9b48a', grosor: 1.2, angulo: 0.25 },
  boca: 'sonrisa', barba: null, bigote: null, pelo: { col: '#7a8a5a', mechones: 5 },
  piel: { col: '#a48a68', tipo: 'corteza', mejillas: null, ruido: 0.06 },
  gorro: { alto: 3.8, caida: 0.4, col: '#6b5232', puno: '#4e5a34', guarda: [11, 1], tela: 5, hongos: 3, musgo: 0.5 },
  cuerpo: { torso: 0.46, panza: 0.06, ancho: 1, cadera: 0.5, brazo: 1, gBrazo: 1, gPierna: 1, encorvado: 0 },
  ropa: { saco: '#4e5a34', tela: 1, guardaSaco: [11, 0.05], cinto: '#3e2a1c', hebilla: '#b0903e', pantalon: '#4a3a28', telaPant: 1, botas: '#3a2a1c', remiendos: ['#7a8a4a', '#8a6d4b'], bufanda: null, guardaBufanda: [3, 0], largo: 0.16 },
  capa: { tipo: 'musgo', col: '#4e6a2a', corta: 1, musgo: 0.6 }, manos: { nudosas: 0, dedos: 1 },
  hojas: 1, objeto: null, joroba: 0, botin: 0,
};
const mezclar = (a, b) => {
  const o = { ...a };
  for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? { ...a[k], ...v } : v;
  return o;
};
// El viejo de las noches grandes: oscuro, encorvado, de barba larga con musgo y los ojos de brasa verde.
const VIEJO = {
  cab: 0.22,
  piel: { col: '#6e5e48', tipo: 'corteza', mejillas: null, ruido: 0.08 },
  nariz: { largo: 1.3, punta: 1.1, forma: 'gancho' }, orejas: { largo: 1.35 },
  ojos: { brillo: '#a8ff4a', fuerza: 3.2, parpado: 0.45, halo: 1, iris: '#0a1004' },
  cejas: { col: '#b8c2a0', grosor: 1.8, angulo: -0.3 }, boca: 'mueca',
  gorro: { col: '#3a3424', puno: '#3e5a2a', guarda: [11, 1], alto: 3.2, caida: 1.0, hongos: 6, musgo: 1 },
  barba: { tipo: 'larga', col: '#9aa880', largo: 1.45, liquen: 1, musgo: 0.5 }, bigote: { col: '#9aa880' },
  cuerpo: { torso: 0.52, panza: 0.02, ancho: 0.95, cadera: 0.56, brazo: 1.25, gBrazo: 0.9, encorvado: 0.5 },
  ropa: { saco: '#3a3a26', tela: 1, pantalon: '#2e2a20', botas: '#2a2218', remiendos: ['#4e5a34'], largo: 0.3 },
  capa: { tipo: 'musgo', col: '#3e5a2a', musgo: 1 }, manos: { nudosas: 1, dedos: 1.4 },
};
// Cada tipo de invasor, de duende. `i`: la variante de ropa (los pillos vienen de dos pintas).
export const DUENDES = {
  // el pillo: el que se acerca corriendo, se ríe y te roba
  rastreador: (i = 0) => ({
    travieso: mezclar(BASE, {
      piel: { col: ['#a48a68', '#9a8262'][i % 2] },
      gorro: { col: ['#6b5232', '#4e5a34'][i % 2], alto: [3.8, 4.2][i % 2], caida: [0.35, 0.6][i % 2] },
      ropa: { saco: ['#4e5a34', '#5a4a2e'][i % 2] },
      barba: i % 2 ? null : { tipo: 'corta', col: '#94a478', largo: 0.9, liquen: 1, musgo: 0.3 },
      capa: i % 2 ? { tipo: 'hojas', col: '#8a5a22', corta: 1 } : BASE.capa,
      botin: 1,
    }),
    viejo: mezclar(mezclar(BASE, VIEJO), { botin: 0 }),
  }),
  // el saltarín: flaco, de piernas largas, con la capucha de una hoja grande
  saltador: () => ({
    travieso: mezclar(BASE, {
      cab: 0.24, orejas: { largo: 1.4, ancho: 0.9, abre: 1.25 }, nariz: { largo: 1.3, punta: 0.9, forma: 'larga' },
      piel: { col: '#ae9470' }, boca: 'dientes',
      gorro: { col: '#a8742a', puno: '#6b4a1e', alto: 2.6, caida: 1.1, hongos: 1, musgo: 0.2, tela: 5 },
      cuerpo: { torso: 0.42, panza: -0.02, ancho: 0.85, cadera: 0.6, brazo: 1.05, gBrazo: 0.8, gPierna: 0.8 },
      ropa: { saco: '#6b5a36', pantalon: '#5a4a30', remiendos: ['#a8742a'] },
      capa: { tipo: 'hojas', col: '#8a5a22', corta: 1 }, botin: 1,
    }),
    viejo: mezclar(mezclar(BASE, VIEJO), { cuerpo: { cadera: 0.62, gPierna: 0.8, gBrazo: 0.8, ancho: 0.85 }, boca: 'dientes', dientes: 1 }),
  }),
  // el hondero: tira piedritas con la honda
  tirador: () => ({
    travieso: mezclar(BASE, {
      piel: { col: '#9a8262' }, cab: 0.24,
      gorro: { col: '#4e5a34', alto: 3.8, caida: 0.35, hongos: 2 },
      cuerpo: { torso: 0.5, cadera: 0.56, ancho: 0.92 },
      ropa: { saco: '#3e4a2e', bufanda: '#8a3c2a' },
      barba: { tipo: 'chiva', col: '#94a478', largo: 0.8, liquen: 1 },
      capa: { tipo: 'hojas', col: '#8a5a22', corta: 1 }, objeto: 'honda',
    }),
    viejo: mezclar(mezclar(BASE, VIEJO), { objeto: 'honda', gorro: { alto: 3.8 } }),
  }),
  // el panzón: lento, con la calabaza de esporas que escupe
  escupidor: () => ({
    travieso: mezclar(BASE, {
      cab: 0.26, piel: { col: '#a08a62' }, nariz: { largo: 1.4, punta: 1.6, forma: 'papa' },
      gorro: { col: '#5a4030', alto: 2.8, caida: 0.7, hongos: 4 },
      cuerpo: { torso: 0.5, panza: 0.2, ancho: 1.2, cadera: 0.52, gPierna: 1.2 },
      ropa: { saco: '#4e5a34', pantalon: '#3e3424' },
      barba: { tipo: 'corta', col: '#94a478', largo: 1.1, liquen: 1, musgo: 0.4 },
      objeto: 'calabaza',
    }),
    viejo: mezclar(mezclar(BASE, VIEJO), { cuerpo: { panza: 0.16, ancho: 1.15 }, objeto: 'calabaza' }),
  }),
  // el grandote: siempre viejo, con el garrote de raíz
  bruto: () => {
    const v = mezclar(mezclar(BASE, VIEJO), {
      cab: 0.21, cuerpo: { torso: 0.58, panza: 0.1, ancho: 1.3, cadera: 0.6, brazo: 1.3, gBrazo: 1.5, gPierna: 1.4, encorvado: 0.4 },
      ojos: { brillo: '#c8ff5a' }, gorro: { alto: 2.6, caida: 1.2 }, objeto: 'garrote',
    });
    return { travieso: v, viejo: v };
  },
  // el topo: encorvado, de manos grandes y la pala de madera
  excavador: () => ({
    travieso: mezclar(BASE, {
      piel: { col: '#8a7458' }, nariz: { largo: 1.5, punta: 1.5, forma: 'papa' },
      gorro: { col: '#5a4030', puno: '#3a2a1c', alto: 2.4, caida: 0.3, hongos: 2, musgo: 0.3 },
      cuerpo: { torso: 0.46, panza: 0.08, ancho: 1.1, encorvado: 0.45, gBrazo: 1.3 },
      ropa: { saco: '#5a4a2e', pantalon: '#3e3424', remiendos: ['#6b5a44', '#8a6d4b'] },
      manos: { nudosas: 0.6, dedos: 1.3 }, capa: null, objeto: 'pala',
    }),
    viejo: mezclar(mezclar(BASE, VIEJO), { objeto: 'pala', manos: { dedos: 1.5 } }),
  }),
  // el jinete de la lechuza (la lechuza se arma aparte)
  volador: () => ({
    travieso: mezclar(BASE, { gorro: { alto: 2.6, caida: 1.0 }, capa: { tipo: 'hojas', col: '#8a5a22', corta: 1 }, hojas: 0 }),
    viejo: mezclar(mezclar(BASE, VIEJO), { capa: { tipo: 'musgo', col: '#3e5a2a', corta: 1, musgo: 1 } }),
  }),
  // el Mandamás: el jefe de nido, con la joroba de musgo y los hongos de luz en la espalda (el punto débil)
  jefe: () => {
    const v = mezclar(mezclar(BASE, VIEJO), {
      cab: 0.2, ojos: { brillo: '#ffb030', fuerza: 3.4, halo: 1.3 },
      cuerpo: { torso: 0.62, panza: 0.08, ancho: 1.35, cadera: 0.6, brazo: 1.35, gBrazo: 1.4, gPierna: 1.35, encorvado: 0.45 },
      gorro: { alto: 2.4, caida: 1.4, hongos: 8 }, barba: { largo: 1.7 },
      capa: { tipo: 'musgo', col: '#3e5a2a', musgo: 1 }, objeto: 'baston', joroba: 1,
    });
    return { travieso: v, viejo: v };
  },
};

// Arma un duende en reposo. Devuelve { geo, huesos: [Vector3 de reposo], ojos: [en el espacio de la
// figura], alto, mano }.
export function armarDuende(P, semilla = 1, detalle = 1) {
  DET = detalle;
  try { return armar(P, semilla); } finally { DET = 1; }
}
function armar(P, semilla) {
  const r = azar(semilla * 97 + 13);
  const piezas = [];
  const C = P.cuerpo, R = P.cab;
  const montado = !!P.montado;
  const reposo = Array.from({ length: N_HUESOS }, () => V3());
  // ---- la pelvis y el torso
  const caderaY = montado ? 0.5 : C.cadera;
  const pelvis = V3(0, caderaY, 0);
  const incl = C.encorvado + (montado ? 0.12 : 0.04);
  const Qt = new THREE.Quaternion().setFromEuler(new THREE.Euler(incl, 0, 0, 'YXZ'));
  const Mt = new THREE.Matrix4().compose(pelvis, Qt, V3(1, 1, 1));
  const L = C.torso, anchoT = C.ancho;
  const enT = (x, y, z) => V3(x, y, z).applyMatrix4(Mt);
  reposo[HUESO.pelvis].copy(pelvis); reposo[HUESO.pecho].copy(pelvis).add(V3(0, 0.06, 0));
  const piel = P.piel;
  const pintaPiel = (c, p, n, l) => {
    const rr = ruido(l.x * 9, l.y * 9, l.z * 9);
    c.multiplyScalar(1 + rr * piel.ruido);
    // corteza: grietas a lo largo y el liquen en manchas
    const f = Math.abs(Math.sin(Math.atan2(l.x, l.z) * 7 + 3 * ruido(l.x * 5, l.y * 2, l.z * 5) + l.y * 3));
    c.multiplyScalar(0.62 + 0.42 * sv(0.05, 0.45, f));
    tinta(c, '#9aa878', 0.35 * sv(0.35, 0.8, ruido(l.x * 11, l.y * 11 + 2, l.z * 11)));
  };
  const H = HUESO;
  // el saco: torno de la cadera a los hombros, con la falda abierta abajo (la falda va con la pelvis)
  {
    const perf = afinar([[0.27 + P.ropa.largo * 0.15, -0.06 - P.ropa.largo], [0.26, -0.06], [0.25 + C.panza * 0.4, 0.08], [0.255 + C.panza, 0.18], [0.24 + C.panza * 0.5, L * 0.55], [0.21, L * 0.8], [0.15, L * 0.97], [0.075, L + 0.04], [0.06, L + 0.065]], 3);
    const g = lathe(perf, 24);
    const yb = -0.06 - P.ropa.largo;
    deform(g, (v) => {
      v.x *= anchoT; v.z *= 0.8;
      if (v.z > 0) v.z *= 1 + C.panza * 1.6 * Math.exp(-(((v.y - 0.15) / 0.18) ** 2));
      if (v.y < -0.02) { const t = (-0.02 - v.y) / (P.ropa.largo + 0.04); v.x *= 1 + 0.12 * t; v.z *= 1 + 0.18 * t; v.y += 0.03 * t * Math.sin(Math.atan2(v.x, v.z) * 5 + semilla); }
    });
    piezas.push(pieza(g, Mt, P.ropa.saco, {
      tela: P.ropa.tela, hueso: (l) => (l.y < 0.07 ? H.pelvis : H.pecho),
      pintar: (c, p, n, l) => { c.multiplyScalar(0.94 + 0.08 * ruido(l.x * 7, l.y * 7, l.z * 7)); tinta(c, '#5a6a32', 0.25 * sv(0.2, 0.8, ruido(l.x * 9, l.y * 9 + 1, l.z * 9))); },
      guarda: (l) => { const [t, a] = P.ropa.guardaSaco; return [t, l.y - yb, Math.atan2(l.x, l.z) * 0.26, a]; },
    }));
    const gc = lathe([[0.262 + C.panza * 0.7, 0.05], [0.272 + C.panza * 0.8, 0.075], [0.262 + C.panza * 0.7, 0.1]], 24);
    deform(gc, (v) => { v.x *= anchoT; v.z *= 0.8; if (v.z > 0) v.z *= 1 + C.panza * 1.6 * Math.exp(-(((v.y - 0.15) / 0.18) ** 2)); });
    piezas.push(pieza(gc, Mt, P.ropa.cinto, { tela: 3, hueso: H.pelvis }));
    const zh = (0.27 + C.panza * 0.8) * 0.8 * (1 + C.panza * 1.6 * Math.exp(-(((0.075 - 0.15) / 0.18) ** 2)));
    piezas.push(pieza(new THREE.BoxGeometry(0.075, 0.055, 0.02), mul(Mt, M4([0, 0.075, zh + 0.006])), P.ropa.hebilla, { tela: 12, hueso: H.pelvis }));
    // los remiendos
    const nr = fino() && P.ropa.remiendos.length ? 2 + Math.floor(r() * 2) : 0;
    for (let i = 0; i < nr; i++) {
      const a = (r() - 0.5) * 2.4 + (i % 2 ? Math.PI : 0) * 0.35, y = 0.15 + r() * (L * 0.55);
      const perfR = 0.24 + C.panza * 0.5 * Math.exp(-(((y - 0.15) / 0.2) ** 2));
      const x = Math.sin(a) * perfR * anchoT, z = Math.cos(a) * perfR * 0.8 * (Math.cos(a) > 0 ? 1 + C.panza * 1.6 * Math.exp(-(((y - 0.15) / 0.18) ** 2)) : 1);
      const gp = new THREE.BoxGeometry(0.08 + r() * 0.04, 0.07 + r() * 0.04, 0.012, 2, 2, 1);
      piezas.push(pieza(gp, mul(Mt, M4([x, y, z], [0, a, (r() - 0.5) * 0.5])), P.ropa.remiendos[i % P.ropa.remiendos.length], { tela: 2, hueso: H.pecho, pintar: (c, p, n, l) => { if (Math.abs(Math.abs(l.x) - 0.045) < 0.008 || Math.abs(Math.abs(l.y) - 0.04) < 0.008) c.multiplyScalar(0.7); } }));
    }
    if (P.ropa.bufanda) {
      const gb = lathe([[0.1, L - 0.02], [0.16, L], [0.17, L + 0.04], [0.13, L + 0.08], [0.09, L + 0.08]], 20);
      deform(gb, (v) => { v.x *= anchoT; v.z *= 0.9; v.y += 0.01 * Math.sin(Math.atan2(v.x, v.z) * 3); });
      piezas.push(pieza(gb, Mt, P.ropa.bufanda, { tela: 1, hueso: H.pecho, guarda: (l) => [P.ropa.guardaBufanda[0], l.y - (L - 0.02), Math.atan2(l.x, l.z) * 0.15, 0.1] }));
      piezas.push(pieza(husoG([[0.06, L + 0.02, 0.13], [0.08, L - 0.08, 0.2], [0.07, L - 0.22, 0.24]], [0.035, 0.04, 0.03], 8, 8), Mt, P.ropa.bufanda, { tela: 1, hueso: H.pecho }));
    }
  }
  // ---- la capa (musgo u hojas): cuelga de los hombros
  if (P.capa) {
    const cp = P.capa, corta = cp.corta ? 0.45 : 1;
    const top = enT(0, L - 0.02, -0.02);
    const alto = top.y - (corta < 1 ? top.y * 0.55 : 0.08);
    const g = grilla((u, v, p) => {
      const a = (u - 0.5) * (corta < 1 ? 4.2 : 3.6);
      const y = top.y - v * alto;
      const rad = (0.12 + 0.24 * sv(0, 0.25, v) + 0.12 * v) * (1 + 0.15 * Math.sin(u * 23 + v * 3) * v);
      const ragged = v > 0.9 ? 0.06 * Math.sin(u * 47 + semilla) : 0;
      p.set(Math.sin(a) * rad * anchoT * 1.1 + top.x, y + ragged * alto, -Math.cos(a) * rad * 0.95 + top.z - v * 0.05);
    }, 22, 14, 1);
    const top0 = top.clone();
    piezas.push(pieza(g, null, cp.col, {
      tela: cp.tipo === 'hojas' ? 0 : 3, hueso: H.pecho,
      pintar: (c, p, n, l) => {
        if (cp.tipo === 'hojas') {
          // hojas superpuestas como escamas, cada una de su color de otoño, con la nervadura
          const fila = Math.floor(l.y * 14), col = Math.floor((Math.atan2(l.x - top0.x, -(l.z - top0.z)) * 4.5) + (fila % 2) * 0.5);
          const h = Math.abs(Math.sin(fila * 12.9898 + col * 78.233) * 43758.5453) % 1;
          c.copy(colorDe(['#8a5a22', '#a8742a', '#6b4a1e', '#7a6a2a', '#5e6a2a', '#9a4a22'][Math.floor(h * 5.99)]));
          const fy = l.y * 14 - fila, fx = (Math.atan2(l.x - top0.x, -(l.z - top0.z)) * 4.5 + (fila % 2) * 0.5) % 1;
          c.multiplyScalar(0.6 + 0.5 * sv(0, 0.5, fy) * (1 - 0.35 * sv(0.4, 0.5, 1 - Math.abs(fx - 0.5))));
        } else {
          c.multiplyScalar(0.75 + 0.35 * (ruido(l.x * 30, l.y * 30, l.z * 30) * 0.5 + 0.5));
          tinta(c, '#7a8a3a', 0.3 * sv(0.3, 0.9, ruido(l.x * 7, l.y * 7, l.z * 7)));
        }
        if (cp.musgo) tinta(c, '#4e6a2a', cp.musgo * sv(0.0, 0.7, ruido(l.x * 7 + 4, l.y * 5, l.z * 7)) * 0.6);
      },
    }));
    // los bultos del musgo sobre los hombros
    if (cp.tipo === 'musgo') for (let i = 0; i < (fino() ? 9 : 5); i++) {
      const a = (i / 8 - 0.5) * 3.2, rad = 0.2;
      const gm = deform(esfera(10, 8), (v) => { v.multiplyScalar(1 + 0.25 * ruido(v.x * 5 + i, v.y * 5, v.z * 5)); });
      piezas.push(pieza(gm, M4([Math.sin(a) * rad * anchoT + top.x, top.y - 0.02 - r() * 0.08, -Math.cos(a) * rad * 0.9 + top.z], [0, 0, 0], [0.09, 0.05, 0.08]), '#4a6a2a', { tela: 5, hueso: H.pecho, pintar: (c, p, n, l) => c.multiplyScalar(0.7 + 0.4 * (ruido(l.x * 40, l.y * 40, l.z * 40) * 0.5 + 0.5)) }));
    }
  }
  // ---- el cuello de hojas (que se lea de bosque desde lejos): hojas de otoño en abanico
  if (P.hojas) {
    const n = fino() ? 11 : 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + 0.2;
      const base = enT(Math.sin(a) * 0.13 * anchoT, L + 0.02, Math.cos(a) * 0.11);
      const dir = V3(Math.sin(a), -0.55, Math.cos(a)).normalize();
      const lado = V3(Math.cos(a), 0, -Math.sin(a));
      const largo = 0.17 + r() * 0.05, anchoH = 0.06;
      const g = grilla((u, v, p, cara) => {
        const w = Math.sin(v * Math.PI) * anchoH * (1 - v * 0.3) * (u - 0.5) * 2;
        p.copy(base).addScaledVector(dir, v * largo).addScaledVector(lado, w).addScaledVector(V3(0, 1, 0), (cara ? -0.006 : 0) + 0.02 * Math.sin(v * Math.PI) - Math.abs(u - 0.5) * 0.02);
      }, 4, 5, 1);
      const col = ['#a8742a', '#8a5a22', '#9a4a22', '#7a6a2a'][i % 4];
      piezas.push(pieza(g, null, col, { hueso: H.pecho, ao: 0.9, pintar: (c, p, n2, l) => { const u = Math.abs((l.x - base.x) * lado.x + (l.z - base.z) * lado.z); if (u < 0.006) c.multiplyScalar(0.65); } }));
    }
  }
  // ---- las piernas y las botitas
  for (let s = 0; s < 2; s++) {
    const sx = s === 0 ? 1 : -1;
    const hm = s === 0 ? H.musloI : H.musloD, hr = s === 0 ? H.rodillaI : H.rodillaD, ht = s === 0 ? H.tobilloI : H.tobilloD;
    const cad = pelvis.clone().add(V3(sx * 0.11 * anchoT, -0.03, 0));
    const pie = montado ? V3(sx * 0.3, 0.28 + 0.075, 0.2) : V3(sx * 0.13, 0.075, 0.02);
    const l1 = (caderaY - 0.075) * 0.52, l2 = (caderaY - 0.075) * 0.5;
    const lp1 = montado ? 0.36 : l1, lp2 = montado ? 0.42 : l2;
    const rod = ik(cad, pie, lp1, lp2, V3(sx * 0.15, montado ? 0.6 : 0, 1));
    reposo[hm].copy(cad); reposo[hr].copy(rod); reposo[ht].copy(pie);
    const gp = C.gPierna;
    piezas.push(pieza(husoG([cad, cad.clone().lerp(rod, 0.5), rod, rod.clone().lerp(pie, 0.5), pie.clone().add(V3(0, 0.04, 0))], [0.1 * gp, 0.09 * gp, 0.078 * gp, 0.068 * gp, 0.066 * gp], 12, 10), null, P.ropa.pantalon, { tela: P.ropa.telaPant, hueso: tramo(cad, rod, pie, hm, hr) }));
    const eje = rod.clone().sub(pie).normalize();
    const qb = quatDe(V3(0, 1, 0), eje);
    const gcb = lathe([[0.072, -0.02], [0.074, 0.06], [0.082, 0.1], [0.09, 0.13], [0.08, 0.14], [0.07, 0.13]], 14);
    deform(gcb, (v) => { v.x *= gp; v.z *= gp; });
    piezas.push(pieza(gcb, new THREE.Matrix4().compose(pie, qb, V3(1, 1, 1)), P.ropa.botas, { tela: 3, ao: 0.85, hueso: hr }));
    const qp = new THREE.Quaternion().setFromEuler(new THREE.Euler(montado ? -0.4 : 0, sx * 0.15, 0, 'YXZ'));
    const gpie = husoG([[0, -0.03, -0.07], [0, -0.03, 0.04], [0, -0.025, 0.14], [0, 0.02, 0.21], [0, 0.075, 0.22]], [0.06, 0.066, 0.052, 0.03, 0.008], 14, 10);
    deform(gpie, (v) => { if (v.y < -0.07) v.y = -0.07 + (v.y + 0.07) * 0.2; });
    piezas.push(pieza(gpie, new THREE.Matrix4().compose(pie, qp, V3(gp, 1, 1)), P.ropa.botas, { tela: 3, hueso: ht, pintar: (c, p, n, l) => { if (l.y < -0.055) c.multiplyScalar(0.55); } }));
  }
  // ---- los brazos y las manos
  const manos = [];
  for (let s = 0; s < 2; s++) {
    const sx = s === 0 ? 1 : -1;
    const hh = s === 0 ? H.hombroI : H.hombroD, hc = s === 0 ? H.codoI : H.codoD;
    const hombro = enT(sx * 0.2 * anchoT, L - 0.06, -0.01);
    const mano = montado ? V3(sx * 0.2, 0.86, 0.42) : V3(sx * 0.3 * (0.9 + 0.1 * anchoT), 0.62 + (C.cadera - 0.6) * 0.8, 0.08);
    if (C.encorvado && !montado) { mano.z += C.encorvado * 0.25; mano.y -= C.encorvado * 0.18; }
    const la = 0.27 * C.brazo, lb = 0.25 * C.brazo;
    const d = mano.clone().sub(hombro); if (d.length() > (la + lb) * 0.98) mano.copy(hombro).addScaledVector(d.normalize(), (la + lb) * 0.98);
    const codo = ik(hombro, mano, la, lb, V3(sx * 0.6, -0.3, -1));
    reposo[hh].copy(hombro); reposo[hc].copy(codo);
    const gb = C.gBrazo;
    piezas.push(pieza(husoG([hombro.clone().add(V3(-sx * 0.03, 0.02, 0)), hombro.clone().lerp(codo, 0.5), codo, codo.clone().lerp(mano, 0.5), mano], [0.085 * gb, 0.075 * gb, 0.066 * gb, 0.064 * gb, 0.07 * gb], 12, 10), null, P.ropa.saco, { tela: P.ropa.tela, hueso: tramo(hombro, codo, mano, hh, hc) }));
    const dirA = mano.clone().sub(codo).normalize();
    const gpu = lathe([[0.072, -0.03], [0.078, 0.0], [0.072, 0.02]], 12);
    piezas.push(pieza(gpu, new THREE.Matrix4().compose(mano.clone().addScaledVector(dirA, -0.02), quatDe(V3(0, 1, 0), dirA), V3(gb, 1, gb)), P.gorro.puno, { tela: 1, hueso: hc, guarda: (l) => [P.gorro.guarda[0], l.y + 0.03, Math.atan2(l.x, l.z) * 0.075, 0.05] }));
    manos.push({ p: mano.clone().addScaledVector(dirA, 0.02), dir: dirA, sx, hc });
    // la mano: palma y dedos (nudosos en los viejos); de lejos, una manopla
    const mh = P.manos, gd = mh.dedos, nud = mh.nudosas;
    const piezasMano = [];
    piezasMano.push([deform(esfera(12, 9), () => {}), M4([0, -0.045, 0], [0, 0, 0], fino() ? [0.05, 0.06, 0.03] : [0.055, 0.1, 0.035])]);
    if (fino()) {
      for (let f = 0; f < 4; f++) {
        const x = (f - 1.5) * 0.022, lf = (0.055 + (f === 1 || f === 2 ? 0.012 : 0)) * gd;
        const curva = 0.35 + 0.1 * f;
        const pts = [[x, -0.08, 0.0], [x * 1.1, -0.08 - lf * 0.45, curva * 0.02], [x * 1.15, -0.08 - lf * 0.85, curva * 0.045], [x * 1.18, -0.08 - lf * 1.05 + curva * 0.015, curva * 0.07]];
        const rd = nud ? [0.014, 0.018 * (1 + 0.2 * nud), 0.012, 0.015 * (1 + 0.2 * nud)] : [0.015, 0.014, 0.013, 0.012];
        piezasMano.push([husoG(pts, rd, 6, 6), null]);
      }
      piezasMano.push([husoG([[sx * 0.03, -0.03, 0.015], [sx * 0.05, -0.06, 0.035], [sx * 0.05, -0.09, 0.05]], [0.016, 0.015, 0.01], 6, 6), null]);
    }
    const Mm = new THREE.Matrix4().compose(mano, quatDe(V3(0, -1, 0), dirA).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sx * Math.PI / 2, 0))), V3(1, 1, 1));
    for (const [g, Ml] of piezasMano) {
      if (Ml) g.applyMatrix4(Ml);
      piezas.push(pieza(g, Mm, piel.col, { piel: 1, hueso: hc, pintar: pintaPiel }));
    }
  }
  // ---- la cabeza
  const cuello = enT(0, L + 0.04, 0.02);
  reposo[H.cabeza].copy(cuello);
  const Qc = Qt.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.05 - (montado ? 0.25 : 0) - C.encorvado * 0.95, 0, 0, 'YXZ')));
  const cc = cuello.clone().add(V3(0, R * 0.92, R * 0.12).applyQuaternion(Qc));
  const Mc = new THREE.Matrix4().compose(cc, Qc, V3(1, 1, 1));
  reposo[H.mandibula].copy(V3(0, -0.3 * R, 0.25 * R).applyMatrix4(Mc));
  const [ex, ey, ez] = P.cabEsc;
  const boca = P.boca, parpado = P.ojos.parpado;
  const ojoP = (sx) => V3(sx * 0.37 * R * ex, 0.12 * R * ey, 0.8 * R * ez);
  const hc = H.cabeza;
  {
    const g = deform(esfera(30, 24), (v) => {
      const y = v.y;
      v.x *= R * ex * (1 + 0.08 * Math.exp(-(((y + 0.35) / 0.3) ** 2)));
      v.y *= R * ey * 1.02;
      v.z *= R * ez * (v.z < 0 ? 0.95 : 1);
      for (const sx of [-1, 1]) { const o = ojoP(sx), d2 = ((v.x - o.x) / (0.2 * R)) ** 2 + ((v.y - o.y) / (0.17 * R)) ** 2; if (v.z > 0) v.z -= 0.08 * R * Math.exp(-d2) * 1.6; }
    });
    piezas.push(pieza(g, Mc, piel.col, {
      piel: 1, hueso: hc,
      pintar: (c, p, n, l) => {
        pintaPiel(c, p, n, l);
        for (const sx of [-1, 1]) { const o = ojoP(sx), d2 = ((l.x - o.x) / (0.24 * R)) ** 2 + ((l.y - o.y) / (0.2 * R)) ** 2; if (l.z > 0) c.multiplyScalar(1 - 0.5 * Math.exp(-d2)); }
      },
      ao: (p, n, l) => 1 - 0.4 * sv(0.3, -0.6, l.y / R) * (l.z < 0.5 * R ? 1 : 0.4),
    }));
  }
  // la nariz: de papa, ganchuda o larga
  {
    const nz = P.nariz, pu = nz.punta, k = nz.largo - 1;
    let pts, rad;
    if (nz.forma === 'papa') { pts = [[0, 0.16 * R, 0.8 * R], [0, 0.02 * R, 1.08 * R + 0.15 * R * k], [0, -0.16 * R, 1.3 * R + 0.3 * R * k], [0, -0.26 * R, 1.26 * R + 0.3 * R * k]]; rad = [0.12 * R, 0.16 * R, 0.28 * R * pu, 0.22 * R * pu]; }
    else if (nz.forma === 'gancho') { pts = [[0, 0.2 * R, 0.82 * R], [0, 0.04 * R, 1.18 * R + 0.25 * R * k], [0, -0.24 * R, 1.48 * R + 0.4 * R * k], [0, -0.5 * R, 1.36 * R + 0.35 * R * k]]; rad = [0.12 * R, 0.15 * R, 0.17 * R * pu, 0.08 * R * pu]; }
    else { pts = [[0, 0.16 * R, 0.82 * R], [0, 0.0, 1.2 * R + 0.3 * R * k], [0, -0.14 * R, 1.55 * R + 0.55 * R * k], [0, -0.22 * R, 1.75 * R + 0.7 * R * k]]; rad = [0.11 * R, 0.13 * R, 0.1 * R * pu, 0.04 * R * pu]; }
    piezas.push(pieza(husoG(pts, rad, 12, 12), Mc, piel.col, { piel: 1, hueso: hc, pintar: (c, p, n, l) => { pintaPiel(c, p, n, l); tinta(c, '#9a6a4a', 0.3 * sv(0.9 * R, 1.25 * R, l.z)); } }));
  }
  // la frente: el arco de las cejas
  {
    const o = ojoP(1), fr = 1.25;
    const pts = [[-0.62 * R * ex, o.y + 0.12 * R, 0.6 * R * ez], [-0.3 * R * ex, o.y + 0.2 * R, 0.86 * R * ez], [0, o.y + 0.16 * R, 0.9 * R * ez], [0.3 * R * ex, o.y + 0.2 * R, 0.86 * R * ez], [0.62 * R * ex, o.y + 0.12 * R, 0.6 * R * ez]];
    piezas.push(pieza(husoG(pts, [0.08 * R, 0.13 * R * fr, 0.1 * R, 0.13 * R * fr, 0.08 * R], 14, 10), Mc, piel.col, { piel: 1, hueso: hc, pintar: pintaPiel }));
  }
  if (fino()) for (const sx of [-1, 1]) piezas.push(pieza(deform(esfera(12, 9), () => {}), mul(Mc, M4([sx * 0.42 * R * ex, -0.18 * R, 0.62 * R * ez], [0, 0, 0], [0.2 * R, 0.17 * R, 0.16 * R])), piel.col, { piel: 1, hueso: hc, pintar: pintaPiel }));
  // los ojos: la cuenca honda y la brasa que brilla; el párpado de arriba (pícaro) y la ceja
  const ojos = [];
  for (const sx of [-1, 1]) {
    const o = ojoP(sx), t = P.ojos.tam * 0.15 * R;
    piezas.push(pieza(deform(esfera(12, 10), () => {}), mul(Mc, M4([o.x, o.y, o.z - t * 0.1], [0, 0, 0], [t * 1.05, t * 0.95, t * 0.7])), '#1a120c', { ao: 0.3, hueso: hc }));
    piezas.push(pieza(deform(esfera(12, 10), () => {}), mul(Mc, M4([o.x, o.y - 0.01 * R, o.z + t * 0.32], [0, 0, 0], [t * 0.8 * P.ojos.tam, t * 0.62, t * 0.42])), P.ojos.brillo, { fuerza: P.ojos.fuerza, parte: PARTE.ojo, hueso: hc }));
    piezas.push(pieza(deform(esfera(8, 6), () => {}), mul(Mc, M4([o.x, o.y - 0.01 * R, o.z + t * 0.62], [0, 0, 0], [t * 0.2, t * 0.42, t * 0.15])), '#100804', { hueso: hc }));
    ojos.push(V3(o.x, o.y, o.z + t * 0.9).applyMatrix4(Mc));
    const gl = new THREE.SphereGeometry(1, nn(14, 6), nn(8, 3), 0, TAU, 0, Math.PI / 2);
    const cierra = -0.6 + parpado * 0.9;
    piezas.push(pieza(gl, mul(Mc, M4([o.x, o.y, o.z], [cierra, 0, -sx * (0.22 + (P.cejas.angulo > 0 ? 0.15 : -0.2))], [t * 1.12, t * 1.12, t * 0.95])), piel.col, { piel: 1, hueso: hc, pintar: (c, p, n, l) => { pintaPiel(c, p, n, l); c.multiplyScalar(0.92); } }));
    const ang = P.cejas.angulo, gr = P.cejas.grosor;
    const pc = [[sx * 0.12 * R * ex, o.y + 0.22 * R - ang * 0.08 * R, 1.0 * R * ez], [sx * 0.34 * R * ex, o.y + 0.3 * R, 0.98 * R * ez], [sx * 0.58 * R * ex, o.y + 0.27 * R + ang * 0.14 * R, 0.72 * R * ez]];
    piezas.push(pieza(husoG(pc, [0.05 * R * gr, 0.07 * R * gr, 0.05 * R * gr], 8, 8), Mc, P.cejas.col, { tela: 6, hueso: hc, hebra: (l) => [l.y * 3, l.x * 2] }));
  }
  // la boca (el labio de abajo va con la mandíbula: al reírse se abre)
  {
    const yb = -0.42 * R, zb = 0.86 * R * ez;
    const sonr = boca === 'mueca' ? -0.06 : 0.12;
    const pts = [[-0.34 * R, yb + sonr * R + (boca === 'mueca' ? 0 : 0.04 * R), zb - 0.12 * R], [-0.15 * R, yb - 0.02 * R, zb + 0.01 * R], [0.15 * R, yb - 0.02 * R + (boca === 'mueca' ? 0.04 * R : 0), zb + 0.01 * R], [0.36 * R, yb + sonr * R * 1.4 + 0.05 * R, zb - 0.12 * R]];
    piezas.push(pieza(husoG(pts, [0.03 * R, 0.045 * R, 0.045 * R, 0.03 * R], 10, 8), Mc, '#3a1a14', { ao: 0.4, hueso: hc }));
    piezas.push(pieza(husoG(pts.map((p) => [p[0] * 0.92, p[1] - 0.07 * R, p[2] - 0.01 * R]), [0.04 * R, 0.07 * R, 0.07 * R, 0.04 * R], 10, 8), Mc, piel.col, { piel: 1, hueso: H.mandibula, pintar: (c, p, n, l) => { pintaPiel(c, p, n, l); tinta(c, '#9a5048', 0.25); } }));
    if ((boca === 'dientes' || P.dientes) && fino()) for (let i = -2; i <= 2; i++) {
      piezas.push(pieza(new THREE.ConeGeometry(0.035 * R, 0.1 * R, 5), mul(Mc, M4([i * 0.09 * R, yb - 0.005 * R + Math.abs(i) * 0.02 * R, zb + 0.02 * R - Math.abs(i) * 0.03 * R], [Math.PI, 0, 0])), '#d8ccb0', { ao: 0.8, hueso: hc }));
    }
  }
  // las orejas puntiagudas
  for (const sx of [-1, 1]) {
    const o = P.orejas, la = o.largo, an = o.ancho;
    const pts = [[0, 0, 0], [0.02 * R, 0.35 * R * la, 0], [0, 0.75 * R * la, 0], [-0.08 * R, 1.15 * R * la, 0]];
    const g = deform(husoG(pts, [0.2 * R * an, 0.24 * R * an, 0.13 * R * an, 0.015 * R], 10, 9), (v) => { v.z *= 0.32; });
    const Mo = mul(Mc, M4([sx * 0.9 * R * ex, 0.0, -0.05 * R], [0, sx * 0.35, -sx * o.abre]));
    piezas.push(pieza(g, Mo, piel.col, { piel: 1, hueso: hc, pintar: pintaPiel }));
    if (fino()) {
      const gi = deform(husoG(pts.map((p) => [p[0], p[1] * 0.85 + 0.06 * R, 0.035 * R]), [0.1 * R * an, 0.14 * R * an, 0.07 * R * an, 0.01 * R], 8, 8), (v) => { v.z = 0.035 * R + (v.z - 0.035 * R) * 0.25; });
      piezas.push(pieza(gi, Mo, piel.col, { piel: 1, ao: 0.6, hueso: hc, pintar: (c, p, n, l) => { pintaPiel(c, p, n, l); c.multiplyScalar(0.7); } }));
    }
  }
  // el pelo que asoma bajo el gorro
  const mech = fino() ? P.pelo.mechones : Math.min(3, P.pelo.mechones);
  for (let i = 0; i < mech; i++) {
    const a = (i / Math.max(1, mech - 1) - 0.5) * 3.4 + Math.PI;
    const b0 = [Math.sin(a) * 0.85 * R, 0.25 * R, Math.cos(a) * 0.85 * R];
    const b1 = [Math.sin(a) * 1.05 * R, 0.05 * R - r() * 0.15 * R, Math.cos(a) * 1.0 * R];
    const b2 = [Math.sin(a) * 1.15 * R, -0.15 * R - r() * 0.2 * R, Math.cos(a) * 1.08 * R];
    piezas.push(pieza(husoG([b0, b1, b2], [0.12 * R, 0.09 * R, 0.02 * R], 8, 7), Mc, P.pelo.col, { tela: 6, hueso: hc, hebra: (l) => [Math.atan2(l.x, l.z) * R, l.y] }));
  }
  // la barba y el bigote (la barba va con la mandíbula: se sacude cuando se ríe)
  if (P.barba) {
    const b = P.barba, tela = b.liquen ? 6 : 8 + 0.4 * (b.canas || 0);
    const pinta = (c, p, n, l) => {
      c.multiplyScalar(0.92 + 0.12 * Math.abs(Math.sin(l.x * 160 + 4 * ruido(l.x * 9, l.y * 4, l.z * 9))));
      if (b.musgo) tinta(c, '#5a7a3a', b.musgo * sv(0.1, 0.8, ruido(l.x * 12, l.y * 8 + 3, l.z * 12)));
      if (b.liquen) tinta(c, '#d8dcc0', 0.3 * sv(0.3, 0.9, ruido(l.x * 25, l.y * 25, l.z * 25)));
    };
    const heb = (l) => [l.x * 1.2 + l.z * 0.4, l.y];
    if (b.tipo === 'corta') {
      const g = deform(esfera(16, 12), (v) => { v.multiplyScalar(1 + 0.12 * ruido(v.x * 6, v.y * 6, v.z * 6)); if (v.y < 0) v.y *= 1.2; });
      piezas.push(pieza(g, mul(Mc, M4([0, -0.52 * R, 0.42 * R], [0.2, 0, 0], [0.62 * R * ex * b.largo, 0.44 * R * b.largo, 0.48 * R])), b.col, { tela, hebra: heb, pintar: pinta, hueso: H.mandibula }));
    } else if (b.tipo === 'chiva') {
      piezas.push(pieza(husoG([[0, -0.5 * R, 0.62 * R], [0, -0.75 * R, 0.7 * R], [0, -1.0 * R * b.largo, 0.62 * R]], [0.18 * R, 0.14 * R, 0.02 * R], 10, 9), Mc, b.col, { tela, hebra: heb, pintar: pinta, hueso: H.mandibula }));
    } else {
      const lb = b.largo;
      const g = grilla((u, v, p, cara) => {
        const a = (u - 0.5) * 2.6;
        const y = -0.2 * R - v * 2.4 * R * lb;
        const ancho = (0.85 - 0.55 * v ** 1.4) * R * ex;
        const z0 = Math.cos(a) * ancho * 0.7 + 0.25 * R + v * 0.35 * R;
        p.set(Math.sin(a) * ancho + 0.04 * R * Math.sin(v * 9 + u * 7), y + (v > 0.85 ? 0.12 * R * Math.sin(u * 19) : 0), z0 - (cara ? 0.07 * R : 0) + 0.03 * R * Math.sin(u * 23 + v * 5));
      }, 16, 14, 1);
      piezas.push(pieza(g, Mc, b.col, { tela, hebra: heb, pintar: pinta, hueso: H.mandibula }));
      if (fino()) for (let i = 0; i < 7; i++) {
        const u = (i / 6 - 0.5) * 2.2, x = Math.sin(u) * 0.6 * R;
        piezas.push(pieza(husoG([[x, -0.3 * R, Math.cos(u) * 0.62 * R + 0.2 * R], [x * 1.05, -1.2 * R * lb, 0.75 * R], [x * 0.8 + (r() - 0.5) * 0.2 * R, -(2.2 + r() * 0.4) * R * lb, 0.62 * R]], [0.12 * R, 0.1 * R, 0.015 * R], 10, 7), Mc, b.col, { tela, hebra: heb, pintar: pinta, hueso: H.mandibula }));
      }
    }
    if (P.bigote) for (const sx of [-1, 1]) piezas.push(pieza(husoG([[sx * 0.02 * R, -0.25 * R, 1.0 * R], [sx * 0.25 * R, -0.33 * R, 0.9 * R], [sx * 0.45 * R, -0.55 * R, 0.72 * R]], [0.08 * R, 0.09 * R, 0.02 * R], 9, 8), Mc, P.bigote.col, { tela, hebra: heb, pintar: pinta, hueso: hc }));
  }
  // el gorro en punta: el puño de lana con la guarda y el cono de fieltro musgoso que cae (la punta
  // es otro hueso: se bambolea al correr)
  let topeGorro = 0;
  {
    const G = P.gorro, rr = 1.02 * R * Math.max(ex, ez), alto = G.alto * R, y0 = 0.22 * R;
    const perf = afinar([[rr, 0], [rr * 0.99, alto * 0.08], [rr * 0.9, alto * 0.25], [rr * 0.68, alto * 0.48], [rr * 0.4, alto * 0.72], [rr * 0.15, alto * 0.92], [0.001, alto]], 4);
    const g = lathe(perf, 24);
    deform(g, (v) => {
      const t = v.y / alto;
      const rad = 1 + 0.06 * Math.sin(v.y * 40 / R + Math.atan2(v.x, v.z) * 2) * sv(0.1, 0.5, t);
      v.x *= rad; v.z *= rad;
      const caida = G.caida * sv(0.25, 1, t) ** 1.6;
      v.x += caida * alto * 0.42; v.z -= caida * alto * 0.12; v.y -= caida * alto * 0.3 * t;
    });
    const Mg = mul(Mc, M4([0, y0, -0.06 * R], [-0.12, 0, 0.06]));
    reposo[H.gorro].copy(V3(0, alto * 0.42, 0).applyMatrix4(Mg));
    const corte = alto * 0.4;
    piezas.push(pieza(g, Mg, G.col, {
      tela: G.tela, hueso: (l) => (l.y > corte ? H.gorro : hc),
      pintar: (c, p, n, l) => {
        c.multiplyScalar(0.9 + 0.15 * ruido(l.x * 8, l.y * 6, l.z * 8));
        if (G.musgo) tinta(c, '#4e6a2a', G.musgo * sv(0.15, 0.8, ruido(l.x * 9 + 2, l.y * 9, l.z * 9)) * sv(0.3, 0.9, n.y + 0.4));
      },
    }));
    const gp = lathe([[rr * 0.98, -0.02 * R], [rr * 1.08, 0.02 * R], [rr * 1.1, 0.12 * R], [rr * 1.06, 0.2 * R], [rr * 0.97, 0.22 * R]], 24);
    piezas.push(pieza(gp, Mg, G.puno, { tela: 1, hueso: hc, guarda: (l) => [G.guarda[0], l.y + 0.02 * R, Math.atan2(l.x, l.z) * rr, 0.24 * R] }));
    // los hongos en el gorro: panes de indio que de noche brillan y hongos de sombrero
    const nh = fino() ? G.hongos : Math.min(2, G.hongos);
    for (let i = 0; i < nh; i++) {
      const t = 0.15 + r() * 0.35, a = (r() - 0.5) * 2.4 + (i % 2 ? 1.2 : -1.2);
      const rad = (rr * (1 - t * 0.9));
      const base = V3(Math.sin(a) * rad, alto * t, Math.cos(a) * rad).applyMatrix4(Mg);
      const tam = (0.05 + r() * 0.05) * R / 0.2;
      const hu = alto * t > corte ? H.gorro : hc;
      if (i % 3 === 0) {
        piezas.push(pieza(deform(esfera(10, 8), () => {}), M4(base, [0, 0, 0], [tam * 0.45, tam * 0.45, tam * 0.45]), '#e09a3a', { hueso: hu, pintar: (c, p, n, l) => { if (Math.sin(l.x * 60) * Math.sin(l.y * 60) * Math.sin(l.z * 60) > 0.25) c.multiplyScalar(0.6); } }));
        piezas.push(pieza(deform(esfera(8, 6), () => {}), M4(base.clone().add(V3(0, 0, tam * 0.2)), [0, 0, 0], [tam * 0.32, tam * 0.32, tam * 0.32]), '#ffb84a', { fuerza: 0.8, parte: PARTE.brillo, hueso: hu }));
      } else {
        const ga = lathe([[0.001, 0], [0.18, 0], [0.18, 0.5], [0.5, 0.55], [0.6, 0.7], [0.4, 0.9], [0.001, 0.95]], 10);
        piezas.push(pieza(ga, M4(base, [0, 0, (r() - 0.5) * 0.6], [tam, tam, tam]), '#d8c8a4', { hueso: hu, pintar: (c, p, n, l) => { if (l.y > 0.52) c.copy(colorDe(i % 2 ? '#a0522d' : '#c8a464')).multiplyScalar(n.y > 0.3 ? 1 : 0.7); } }));
      }
    }
    // hasta dónde llega el gorro (para la altura del duende)
    const pp = g.attributes.position;
    for (let i = 0; i < pp.count; i++) topeGorro = Math.max(topeGorro, pp.getY(i));
  }
  // ---- la joroba del Mandamás: musgo con hongos de luz (el punto débil)
  if (P.joroba) {
    const cen = enT(0, L * 0.62, -0.26);
    const gj = deform(esfera(20, 14), (v) => { v.multiplyScalar(1 + 0.18 * ruido(v.x * 4, v.y * 4, v.z * 4)); v.x *= 0.3 * anchoT; v.y *= 0.3; v.z *= 0.22; });
    piezas.push(pieza(gj, M4(cen), '#3e5a2a', { tela: 5, hueso: H.pecho, pintar: (c, p, n, l) => { c.multiplyScalar(0.7 + 0.4 * (ruido(l.x * 30, l.y * 30, l.z * 30) * 0.5 + 0.5)); tinta(c, '#6b7a3a', 0.3 * sv(0.3, 0.9, ruido(l.x * 9, l.y * 9, l.z * 9))); } }));
    for (const [x, y, s] of [[-0.12, 0.08, 1], [0.13, 0.04, 0.9], [0, 0.16, 1.2], [-0.15, -0.08, 0.8], [0.12, -0.1, 0.85], [0.02, -0.02, 0.7]]) {
      const pb = cen.clone().add(V3(x * anchoT, y, -0.2));
      const gh = lathe([[0.001, 0], [0.15, 0], [0.12, 0.6], [0.5, 0.65], [0.6, 0.8], [0.35, 0.98], [0.001, 1.02]], 10);
      piezas.push(pieza(gh, M4(pb, [-1.0, 0, x * 2], [0.09 * s, 0.09 * s, 0.09 * s]), '#c8ff5e', { fuerza: 1.3, parte: PARTE.debil, hueso: H.pecho }));
    }
  }
  // ---- lo que lleva en las manos
  const mD = manos[1], mI = manos[0];
  const pieza2 = (g, M, col, o) => piezas.push(pieza(g, M, col, o));
  const madera = (c, p, n, l) => { c.multiplyScalar(0.8 + 0.3 * Math.abs(Math.sin(l.y * 40 + 3 * ruido(l.x * 6, l.y, l.z * 6)))); tinta(c, '#4e6a2a', 0.5 * sv(0.2, 0.8, n.y + 0.3 * ruido(l.x * 5, l.y * 5, l.z * 5))); };
  if (P.objeto === 'garrote') {
    const a = mD.p.clone(), b = a.clone().add(V3(0.02, -0.22, 0.28)), c = a.clone().add(V3(0.04, -0.5, 0.55));
    pieza2(deform(husoG([a.clone().add(V3(0, 0.08, -0.06)), a, b, c], [0.05, 0.06, 0.1, 0.14], 10, 9), (v) => { v.addScaledVector(V3(ruido(v.x * 9, v.y * 9, v.z * 9), ruido(v.y * 9, v.z * 9, v.x * 9), 0), 0.015); }), null, '#5a4232', { hueso: mD.hc, pintar: madera });
  } else if (P.objeto === 'pala') {
    const a = mD.p.clone().add(V3(0, 0.25, -0.1)), b = mD.p.clone().add(V3(0.02, -0.45, 0.22));
    pieza2(husoG([a, b], [0.022, 0.022], 6, 6), null, '#7a5a3a', { hueso: mD.hc, pintar: madera });
    const hoja = new THREE.BoxGeometry(0.2, 0.26, 0.025, 2, 2, 1);
    pieza2(deform(hoja, (v) => { v.z += 0.04 * (v.x / 0.1) ** 2; if (v.y < -0.08) v.x *= 0.7 + (v.y + 0.13) * 6; }), new THREE.Matrix4().compose(b.clone().add(V3(0.01, -0.1, 0.06)), quatDe(V3(0, 1, 0), a.clone().sub(b)), V3(1, 1, 1)), '#8a6a42', { hueso: mD.hc, pintar: madera });
  } else if (P.objeto === 'baston') {
    const a = mD.p.clone().add(V3(0, 0.55, 0.05)), b = mD.p.clone().add(V3(0.05, -0.62, 0.1));
    pieza2(deform(husoG([b, mD.p, a], [0.03, 0.035, 0.045], 10, 7), (v) => { v.x += 0.01 * Math.sin(v.y * 30); }), null, '#4a3828', { hueso: mD.hc, pintar: madera });
    pieza2(deform(esfera(10, 8), () => {}), M4(a.clone().add(V3(0, 0.07, 0)), [0, 0, 0], [0.09, 0.09, 0.09]), '#e09a3a', { hueso: mD.hc });
    pieza2(deform(esfera(10, 8), () => {}), M4(a.clone().add(V3(0, 0.09, 0.04)), [0, 0, 0], [0.07, 0.07, 0.07]), '#ffb84a', { fuerza: 1.5, parte: PARTE.brillo, hueso: mD.hc });
  } else if (P.objeto === 'honda') {
    // la honda colgando de la mano y la bolsa de piedritas al cinto
    const a = mD.p.clone(), b = a.clone().add(V3(0.0, -0.28, 0.04));
    pieza2(husoG([a, a.clone().lerp(b, 0.5).add(V3(0.02, 0, 0)), b], [0.008, 0.008, 0.008], 6, 4), null, '#5a3a22', { tela: 3, hueso: mD.hc });
    pieza2(deform(esfera(10, 8), (v) => { v.y *= 0.6; }), M4(b, [0, 0, 0], [0.05, 0.04, 0.04]), '#6b4a2e', { tela: 3, hueso: mD.hc });
    pieza2(deform(esfera(12, 9), (v) => { if (v.y > 0.6) v.multiplyScalar(0.7); }), mul(Mt, M4([-0.25 * anchoT, -0.02, 0.06], [0, 0, 0.2], [0.08, 0.1, 0.07])), '#7a5a3a', { tela: 3, hueso: H.pelvis });
  } else if (P.objeto === 'calabaza') {
    // la calabaza de esporas, colgada adelante: la boca brilla (el "buche" del que escupe)
    const cen = enT(0.0, 0.18, 0.34 + C.panza * 0.9);
    pieza2(deform(lathe(afinar([[0.001, -0.17], [0.14, -0.14], [0.17, -0.04], [0.13, 0.06], [0.07, 0.1], [0.06, 0.16], [0.001, 0.17]], 3), 16), (v) => { const a = Math.atan2(v.x, v.z); const k = 1 + 0.06 * Math.cos(a * 8); v.x *= k; v.z *= k; }), M4(cen, [0.3, 0, 0]), '#b88a3a', { hueso: H.pecho, pintar: (c, p, n, l) => { c.multiplyScalar(0.8 + 0.25 * Math.abs(Math.cos(Math.atan2(l.x, l.z) * 8))); } });
    pieza2(deform(esfera(10, 8), () => {}), M4(cen.clone().add(V3(0, 0.16, 0.05)), [0, 0, 0], [0.06, 0.03, 0.06]), '#d9ff7a', { fuerza: 1.4, parte: PARTE.brillo, hueso: H.pecho });
    pieza2(husoG([enT(-0.2, L * 0.8, 0.1), cen.clone().add(V3(-0.1, 0.12, -0.04))], [0.012, 0.012], 6, 4), null, '#5a3a22', { tela: 3, hueso: H.pecho });
  }
  // el botín (lo que se roba): un atadito de tela con una semilla que brilla; sólo se ve al robar
  if (P.botin) {
    const c0 = mI.p.clone().add(V3(0.02, -0.08, 0.04));
    pieza2(deform(esfera(12, 9), (v) => { v.multiplyScalar(1 + 0.12 * ruido(v.x * 5, v.y * 5, v.z * 5)); if (v.y > 0.7) v.x *= 0.5; }), M4(c0, [0, 0, 0], [0.09, 0.08, 0.08]), '#c8b48a', { tela: 2, parte: PARTE.botin, hueso: mI.hc, guarda: (l) => [3, Math.abs(l.y) * 0.1, Math.atan2(l.x, l.z) * 0.1, 0.02] });
    pieza2(deform(esfera(8, 6), (v) => { v.y *= 1.3; }), M4(c0.clone().add(V3(0, 0.08, 0.03)), [0, 0, 0], [0.03, 0.03, 0.03]), '#ffc840', { fuerza: 1.4, parte: PARTE.botin, hueso: mI.hc });
  }
  const geo = fundirPiezas(piezas);
  // la altura (con el gorro) en unidades de figura: el gorro se ubicó en Mg; se mide de la malla
  let alto = 0;
  { const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) alto = Math.max(alto, pa.getY(i)); }
  return { geo, reposo, padres: PADRE, ojos, alto, topeGorro, manos: manos.map((m) => m.p) };
}

// ---------------------------------------------------------------- la lechuza con su jinete
// Un concón (la lechuza del bosque): parda con barras, el disco de la cara ocre con el borde oscuro y
// los ojos de ámbar; las alas son dos huesos (aletean) y el jinete va sentado en la montura. En
// unidades de figura (el cuerpo de la lechuza ~1,1 de largo). Mira a +z.
export function armarLechuza(P, semilla = 5, detalle = 1) {
  DET = detalle;
  try {
    const piezas = [];
    const pardo = '#8a6442', claro = '#d8b080';   // 3.8.0: más claro que en el prototipo: al anochecer se perdía
    const H = HUESO;
    const Y0 = 0.62;   // la lechuza vuela con el cuerpo a esta altura sobre el origen
    const barras = (c, p, n, l) => {
      const fy = l.y * 26 + l.z * 8, fila = Math.floor(fy), fx = l.x * 22 + Math.atan2(l.x, l.z) * 3 + (fila % 2) * 0.5;
      const ty = fy - fila, tx = fx - Math.floor(fx);
      c.multiplyScalar(0.62 + 0.45 * sv(0.0, 0.7, ty) * (1 - 0.4 * sv(0.35, 0.5, Math.abs(tx - 0.5))));
      if (ty > 0.75) tinta(c, '#d8b888', 0.35);
      if (n.y < -0.3 || (n.z > 0.5 && l.y < 0.05)) { tinta(c, claro, 0.5); if (Math.sin(l.y * 70) > 0.6) c.multiplyScalar(0.7); }
    };
    const T = (x, y, z) => [x, y + Y0, z];
    const cuerpo = deform(esfera(30, 22), (v) => { v.x *= 0.28; v.y *= 0.27; v.z *= 0.56; if (v.y < 0) v.y *= 1.1; if (v.z < 0) { v.x *= 1 + v.z * 0.6; v.y *= 1 + v.z * 0.4; } });
    piezas.push(pieza(cuerpo, M4(T(0, 0, 0), [0.25, 0, 0]), pardo, { pintar: barras, hueso: H.montura }));
    const hc = V3(...T(0, 0.3, 0.42));
    piezas.push(pieza(deform(esfera(24, 18), (v) => { v.multiplyScalar(0.27); v.x *= 1.1; }), M4(hc), pardo, { pintar: barras, hueso: H.montura }));
    piezas.push(pieza(deform(esfera(16, 12), (v) => { v.x *= 0.25; v.y *= 0.22; v.z *= 0.07; if (v.z > 0) v.z -= 0.05 * Math.max(0, 1 - (v.x / 0.25) ** 2 - (v.y / 0.22) ** 2); }), M4(hc.clone().add(V3(0, -0.01, 0.19))), claro, { tela: 6, hueso: H.montura, hebra: (l) => [Math.atan2(l.y, l.x) * 0.2, Math.hypot(l.x, l.y)], pintar: (c, p, n, l) => { const d = Math.hypot(l.x / 0.25, l.y / 0.22); if (d > 0.85) c.copy(colorDe('#3a2418')); c.multiplyScalar(0.85 + 0.2 * Math.sin(Math.atan2(l.y, l.x) * 30)); } }));
    piezas.push(pieza(husoG([T(0, 0.31, 0.62), T(0, 0.26, 0.69), T(0, 0.2, 0.68)], [0.035, 0.025, 0.004], 8, 8), null, '#c8b070', { tela: 12, hueso: H.montura }));
    const ojos = [];
    for (const sx of [-1, 1]) {
      const o = hc.clone().add(V3(sx * 0.085, 0.03, 0.235));
      piezas.push(pieza(deform(esfera(12, 10), () => {}), M4(o, [0, 0, 0], [0.048, 0.048, 0.03]), '#1a0e06', { hueso: H.montura }));
      piezas.push(pieza(deform(esfera(12, 10), () => {}), M4(o.clone().add(V3(0, 0, 0.014)), [0, 0, 0], [0.04, 0.04, 0.022]), '#ffa020', { fuerza: 2.4, parte: PARTE.ojo, hueso: H.montura }));
      piezas.push(pieza(deform(esfera(8, 6), () => {}), M4(o.clone().add(V3(0, 0, 0.034)), [0, 0, 0], [0.017, 0.017, 0.008]), '#100600', { hueso: H.montura }));
      ojos.push(o.clone().add(V3(0, 0, 0.05)));
    }
    // las alas: extendidas a los costados (el reposo es la mitad del aleteo), con las primarias en dedos
    const hombros = [];
    for (const sx of [-1, 1]) {
      const hueso = sx > 0 ? H.alaI : H.alaD;
      const hom = V3(sx * 0.14, Y0 + 0.12, 0.12);
      hombros.push(hom);
      const ala = grilla((u, v, p, cara) => {
        const sp = 0.05 + u * 1.25;
        const cuerda = (0.24 + 0.46 * Math.sqrt(Math.max(0, 1 - u * u * 0.8))) + (u > 0.7 ? 0.12 * Math.max(0, Math.sin(v * 7 * Math.PI)) * (u - 0.7) * 3 * v : 0);
        const borde = 0.2 - 0.12 * u * u;
        const z = borde - v * cuerda - sv(0.55, 1, v) * (0.03 + 0.12 * sv(0.55, 1, u)) * (1 - Math.abs(Math.cos(u * Math.PI * 9.5)));
        // 3.8.0: el borde de atrás cae (el ala combada) y la punta sube: de frente se ve el ala, no una tabla
        const y = 0.06 * Math.sin(v * Math.PI) + 0.16 * u * u - 0.22 * v * (1 - 0.4 * u) - (cara ? 0.025 * (1 - u) : 0);
        p.set(hom.x + sx * sp, hom.y + y - 0.04, hom.z - 0.12 + z);
      }, 40, 12, 1);
      const NU = nn(40, 3) + 1, NV = nn(12, 2) + 1;
      piezas.push(pieza(ala, null, pardo, {
        hueso,
        pintar: (c, p, n, l, i) => {
          const cara = Math.floor(i / (NU * NV)), j = i % (NU * NV);
          const u = (j % NU) / (NU - 1), v = Math.floor(j / NU) / (NV - 1);
          if (v < 0.36) {
            const fila = Math.floor(v * 14), k = (u * 22 + (fila % 2) * 0.5) % 1, t = (v * 14) % 1;
            c.multiplyScalar(0.72 + 0.4 * sv(0, 0.7, t) * (1 - 0.45 * sv(0.32, 0.5, Math.abs(k - 0.5))));
            tinta(c, '#9a7048', 0.3);
            if (Math.abs(k - 0.5) < 0.12 && t > 0.4 && t < 0.7) tinta(c, '#e8d4a8', 0.5);
          } else {
            const k = (u * 9.5) % 1;
            c.multiplyScalar(0.85 + 0.25 * (1 - sv(0.3, 0.5, Math.abs(k - 0.5))));
            if (Math.sin((v - u * 0.15) * 30) > 0.25) c.multiplyScalar(0.5);
            if (u > 0.7) c.multiplyScalar(0.85);
          }
          if (cara) tinta(c, '#d8b888', 0.45);
        },
      }));
    }
    piezas.push(pieza(grilla((u, v, p, cara) => { const a = (u - 0.5) * 0.9; p.set(Math.sin(a) * (0.1 + v * 0.35), Y0 - 0.08 + v * 0.05 - (cara ? 0.015 : 0), -0.5 - Math.cos(a) * v * 0.35); }, 10, 6, 1), null, pardo, { tela: 6, hueso: H.montura, hebra: (l) => [l.x, l.z], pintar: (c, p, n, l) => { if (Math.sin(l.z * 50) > 0.5) c.multiplyScalar(0.6); } }));
    for (const sx of [-1, 1]) {
      piezas.push(pieza(husoG([T(sx * 0.1, -0.25, 0.1), T(sx * 0.11, -0.35, 0.05), T(sx * 0.11, -0.4, 0.0)], [0.05, 0.045, 0.03], 8, 8), null, '#c8a878', { tela: 6, hueso: H.montura, hebra: (l) => [l.x * 3, l.y] }));
      if (fino()) for (let f = 0; f < 3; f++) piezas.push(pieza(husoG([T(sx * 0.11 + (f - 1) * 0.025, -0.4, 0.0), T(sx * 0.11 + (f - 1) * 0.04, -0.43, 0.04), T(sx * 0.11 + (f - 1) * 0.045, -0.46, 0.03)], [0.012, 0.01, 0.002], 6, 6), null, '#2a2420', { hueso: H.montura }));
    }
    piezas.push(pieza(grilla((u, v, p, cara) => { const a = (u - 0.5) * 2.2; p.set(Math.sin(a) * 0.4, Y0 + 0.2 + Math.cos(a) * 0.17 - (cara ? 0.015 : 0), 0.05 - v * 0.4); }, 14, 6, 1), null, '#8a3c2a', { tela: 1, hueso: H.montura, guarda: (l) => [3, Math.min(Math.abs(Math.abs(l.x) - 0.32), 0.2), l.z * 2, 0.07] }));
    // el jinete: un duende sentado, más chico, en la montura
    const kj = 0.68;   // 3.8.0: el jinete más grande y más alto, que asome por encima de la cabeza de la lechuza
    const jin = armar(mezclar(P, { montado: 1 }), semilla);
    const dy = Y0 + 0.3 - 0.5 * kj, dz = -0.08;
    // las piezas del jinete: se pasan a la lechuza (escala kj, corridas a la montura)
    const pj = jin.geo.attributes.position;
    for (let i = 0; i < pj.count; i++) pj.setXYZ(i, pj.getX(i) * kj, pj.getY(i) * kj + dy, pj.getZ(i) * kj + dz);
    const geoL = fundirPiezas(piezas);
    const geo = juntar(geoL, jin.geo);
    const reposo = jin.reposo.map((v) => V3(v.x * kj, v.y * kj + dy, v.z * kj + dz));
    reposo[H.montura].set(0, Y0, 0);
    reposo[H.alaI].copy(hombros[1]); reposo[H.alaD].copy(hombros[0]);
    let alto = 0;
    { const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) alto = Math.max(alto, pa.getY(i)); }
    return { geo, reposo, padres: PADRE, ojos: ojos.concat(jin.ojos.map((v) => V3(v.x * kj, v.y * kj + dy, v.z * kj + dz))), alto, lechuza: true, manos: [] };
  } finally { DET = 1; }
}
// dos geometrías con los mismos atributos en una
function juntar(a, b) {
  const g = new THREE.BufferGeometry();
  for (const k of Object.keys(a.attributes)) {
    const A = a.attributes[k], B = b.attributes[k];
    const arr = new Float32Array(A.array.length + B.array.length);
    arr.set(A.array, 0); arr.set(B.array, A.array.length);
    g.setAttribute(k, new THREE.BufferAttribute(arr, A.itemSize));
  }
  const ia = a.index.array, ib = b.index.array, na = a.attributes.position.count;
  const idx = na + b.attributes.position.count > 65535 ? new Uint32Array(ia.length + ib.length) : new Uint16Array(ia.length + ib.length);
  idx.set(ia, 0); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + na;
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  a.dispose(); b.dispose();
  return g;
}

// ---------------------------------------------------------------- el nido y la madriguera (fijos)
// Las piezas de madera con su veta (el material de corteza del prototipo), las de tela y musgo con el
// de la gente, y los brillos (hongos de luz, faroles) con uno sin luz. Se arman una vez y se comparten.
let MAT_CORTEZA = null, MAT_BRILLO = null;
export function matCorteza() {
  if (MAT_CORTEZA) return MAT_CORTEZA;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aVeta; varying vec3 vVeta;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvVeta = aVeta;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vVeta;
        float hC(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float nC(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hC(i), hC(i + vec2(1.0, 0.0)), f.x), mix(hC(i + vec2(0.0, 1.0)), hC(i + vec2(1.0, 1.0)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec2 u = vVeta.xy;
          float w = nC(vec2(u.x * 2.2, u.y * 0.25)) * 0.6 + nC(vec2(u.x * 5.0, u.y * 0.6)) * 0.4;
          float grieta = smoothstep(0.08, 0.0, abs(fract(u.x * 1.6 + w * 1.4) - 0.5) - 0.38);
          float placa = nC(vec2(u.x * 1.6, u.y * 0.9)) * 0.25;
          diffuseColor.rgb *= mix(1.0, (0.8 + placa) * (1.0 - 0.62 * grieta), vVeta.z);
          diffuseColor.rgb *= 0.92 + 0.16 * nC(u * 9.0);
        }`);
  };
  m.customProgramCacheKey = () => 'duendes-corteza-38';
  return (MAT_CORTEZA = m);
}
export const matBrilloFijo = () => MAT_BRILLO || (MAT_BRILLO = new THREE.MeshBasicMaterial({ vertexColors: true }));
function fundirCorteza(piezas) {
  let nv = 0, ni = 0;
  for (const q of piezas) { nv += q.geo.attributes.position.count; ni += q.geo.index ? q.geo.index.count : q.geo.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), veta = new Float32Array(nv * 3);
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0;
  for (const q of piezas) {
    const P = q.geo.attributes.position, N = q.geo.attributes.normal, L = q.local, n = P.count;
    const fijo = typeof q.col === 'string' ? colorDe(q.col) : null;
    for (let i = 0; i < n; i++) {
      _p.fromBufferAttribute(P, i); _n.fromBufferAttribute(N, i); _l.set(L[i * 3], L[i * 3 + 1], L[i * 3 + 2]);
      if (fijo) _c.copy(fijo); else _c.setRGB(1, 1, 1);
      if (q.pintar) q.pintar(_c, _p, _n, _l);
      const k = ov + i;
      pos[k * 3] = _p.x; pos[k * 3 + 1] = _p.y; pos[k * 3 + 2] = _p.z;
      nor[k * 3] = _n.x; nor[k * 3 + 1] = _n.y; nor[k * 3 + 2] = _n.z;
      col[k * 3] = _c.r; col[k * 3 + 1] = _c.g; col[k * 3 + 2] = _c.b;
      const w = q.veta ? q.veta(_l, _p) : [Math.atan2(_l.x, _l.z) * 0.5, _l.y, 1];
      veta[k * 3] = w[0]; veta[k * 3 + 1] = w[1]; veta[k * 3 + 2] = w[2] ?? 1;
    }
    if (q.geo.index) { const I = q.geo.index.array; for (let j = 0; j < I.length; j++) idx[oi + j] = I[j] + ov; oi += I.length; } else { for (let j = 0; j < n; j++) idx[oi + j] = ov + j; oi += n; }
    ov += n;
    q.geo.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aVeta', new THREE.BufferAttribute(veta, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}
function fundirBrillo(piezas) {
  let nv = 0, ni = 0;
  for (const q of piezas) { nv += q.geo.attributes.position.count; ni += q.geo.index ? q.geo.index.count : q.geo.attributes.position.count; }
  const pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0;
  for (const q of piezas) {
    const P = q.geo.attributes.position, N = q.geo.attributes.normal, n = P.count, c = colorDe(q.col), f = q.fuerza ?? 1;
    for (let i = 0; i < n; i++) {
      const k = ov + i, nz = N ? Math.abs(N.getZ(i)) * 0.5 + 0.5 : 1;
      pos[k * 3] = P.getX(i); pos[k * 3 + 1] = P.getY(i); pos[k * 3 + 2] = P.getZ(i);
      col[k * 3] = c.r * f * (0.75 + 0.35 * nz); col[k * 3 + 1] = c.g * f * (0.75 + 0.35 * nz); col[k * 3 + 2] = c.b * f * (0.75 + 0.35 * nz);
    }
    if (q.geo.index) { const I = q.geo.index.array; for (let j = 0; j < I.length; j++) idx[oi + j] = I[j] + ov; oi += I.length; } else { for (let j = 0; j < n; j++) idx[oi + j] = ov + j; oi += n; }
    ov += n;
    q.geo.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}
// una malla fija de la gente (tela y musgo), sin huesos
function fundirTela(piezas) {
  const g = fundirPiezas(piezas);
  g.deleteAttribute('aHuesoParte');
  return g;
}
function raiz(pts, rad, col = '#4a3a2c', o = {}) {
  const g = husoG(pts, rad, o.tramos || 16, o.lados || 9);
  if (o.nudos) deform(g, (v) => { v.addScaledVector(V3(ruido(v.x * 3, v.y * 3, v.z * 3), ruido(v.y * 3 + 1, v.z * 3, v.x * 3), ruido(v.z * 3 + 2, v.x * 3, v.y * 3)), o.nudos); });
  return pieza(g, o.M || null, col, { veta: (l) => [Math.atan2(l.x - pts[0][0], l.z - pts[0][2]) * 0.3 + l.x * 0.5, l.y + l.x * 0.3 + l.z * 0.3, 0.8], pintar: o.pintar });
}
const musgoEn = (c, p, n, k = 1, s = 1) => tinta(c, '#4e6a2a', k * sv(0.15, 0.7, n.y + 0.25 * ruido(p.x * 3 * s, p.y * 3 * s, p.z * 3 * s)) * 0.85);
// un grupo con las tres mallas (las que haya); las geometrías quedan cacheadas por nombre
const FIJOS = new Map();
function grupoFijo(nombre, armarFn) {
  let geos = FIJOS.get(nombre);
  if (!geos) { geos = armarFn(); FIJOS.set(nombre, geos); }
  const g = new THREE.Group();
  if (geos.tela) { const m = new THREE.Mesh(geos.tela, materialGente()); m.castShadow = true; m.receiveShadow = true; g.add(m); }
  if (geos.corteza) { const m = new THREE.Mesh(geos.corteza, matCorteza()); m.castShadow = true; m.receiveShadow = true; g.add(m); }
  if (geos.brillo) { const m = new THREE.Mesh(geos.brillo, geos.matBrillo || matBrilloFijo()); g.add(m); }
  g.userData.halos = geos.halos || [];
  return g;
}
// El nido de hongos y musgo (lo que eran los capullos): un montículo de musgo con ramitas tejidas y
// bolsas de hongo (bejines) abiertas donde asoma la punta de un gorrito. ~1,9 m de ancho, ~1,4 de alto.
export function mallaNido() {
  return grupoFijo('nido', () => {
    const tela = [], brillos = [], cort = [], halos = [];
    const r = azar(55);
    const E = 1.25;   // un poco más grande que el del prototipo: tiene que leerse de lejos
    // 3.8.0: una loma de musgo redondeada (no un almohadón de costados rectos)
    const gm = deform(lathe(afinar([[0.001, 0.56], [0.45, 0.55], [0.72, 0.46], [0.9, 0.32], [1.05, 0.16], [1.18, 0.04], [1.26, -0.04]], 4), 32), (v) => { v.multiplyScalar(1 + 0.1 * ruido(v.x * 4, v.y * 4, v.z * 4)); if (Math.hypot(v.x, v.z) < 0.5 && v.y > 0.4) v.y -= 0.14 * (1 - Math.hypot(v.x, v.z) / 0.5); });
    tela.push(pieza(gm, M4([0, 0, 0], [0, 0, 0], [E, E, E]), '#5e7e34', { tela: 5, pintar: (c, p, n, l) => { c.multiplyScalar(0.7 + 0.45 * (ruido(l.x * 18, l.y * 18, l.z * 18) * 0.5 + 0.5)); tinta(c, '#7a8a3a', 0.3 * sv(0.4, 0.9, ruido(l.x * 6, l.y * 6, l.z * 6))); if (l.y < 0.08) tinta(c, '#3a2a1e', 0.6); } }));
    for (let i = 0; i < 26; i++) {
      const a = r() * TAU, a2 = a + 0.6 + r() * 0.8;
      cort.push(raiz([[Math.sin(a) * 0.72 * E, (0.5 + r() * 0.08) * E, Math.cos(a) * 0.72 * E], [Math.sin((a + a2) / 2) * 0.86 * E, (0.58 + r() * 0.08) * E, Math.cos((a + a2) / 2) * 0.86 * E], [Math.sin(a2) * 0.7 * E, (0.46 + r() * 0.1) * E, Math.cos(a2) * 0.7 * E]], [0.022, 0.02, 0.012], '#5a4232'));
    }
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7 + 0.3, d = i === 0 ? 0 : 0.32;
      const p = V3(Math.sin(a) * d * E, 0.5 * E, Math.cos(a) * d * E);
      const s = (i === 0 ? 0.26 : 0.16 + r() * 0.05) * E;
      const abierto = i < 2;
      const gb = deform(lathe(afinar([[0.001, 0], [0.8, 0.1], [1, 0.55], [0.9, 0.95], [abierto ? 0.55 : 0.4, 1.15], [abierto ? 0.45 : 0.001, abierto ? 1.05 : 1.2]], 3), 20), (v) => { const a2 = Math.atan2(v.x, v.z); if (abierto && v.y > 0.95) v.y += 0.12 * Math.sin(a2 * 6); });
      tela.push(pieza(gb, M4(p, [0, a, 0], [s, s, s]), '#e2d6bd', { tela: 4, pintar: (c, pp, n, l) => { c.multiplyScalar(0.85 + 0.2 * ruido(l.x * 30, l.y * 30, l.z * 30)); if (l.y > 0.95 && abierto) c.multiplyScalar(0.7); tinta(c, '#a08a6a', 0.3 * sv(0.4, 0, l.y)); } }));
      if (abierto) {
        const gg = deform(lathe(afinar([[0.4, 0], [0.3, 0.35], [0.12, 0.7], [0.001, 1]], 3), 14), (v) => { v.z -= 0.25 * sv(0.4, 1, v.y) * v.y; });
        tela.push(pieza(gg, M4(p.clone().add(V3(0, s * 0.95, 0)), [0.1, a, 0], [s * 0.95, s * 1.4, s * 0.95]), i === 0 ? '#6b5232' : '#4e5a34', { tela: 5 }));
        brillos.push(pieza(deform(esfera(10, 6), () => {}), M4(p.clone().add(V3(0, s * 1.05, 0)), [0, 0, 0], [s * 0.42, s * 0.08, s * 0.42]), '#ffd070', { fuerza: 1.4 }));
        halos.push({ p: p.clone().add(V3(0, s * 1.2, 0)), col: '#ffd070', tam: 0.9 });
      }
    }
    for (let i = 0; i < 12; i++) {
      const a = r() * TAU, d = (0.85 + r() * 0.5) * E;
      const p = V3(Math.sin(a) * d, 0.0, Math.cos(a) * d);
      const s = 0.07 + r() * 0.08;
      const gh = lathe([[0.001, 0], [0.15, 0], [0.12, 0.6], [0.5, 0.65], [0.6, 0.8], [0.35, 0.98], [0.001, 1.02]], 10);
      tela.push(pieza(gh, M4(p, [(r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4], [s * 1.6, s * 1.6, s * 1.6]), '#d8d0b0', { tela: 4 }));
      brillos.push(pieza(deform(esfera(8, 6), (v) => { if (v.y < 0) v.y *= 0.3; }), M4(p.clone().add(V3(0, s * 1.15, 0)), [0, 0, 0], [s * 0.9, s * 0.5, s * 0.9]), i % 3 ? '#b8ff5a' : '#ffb040', { fuerza: 1.2 }));
      if (i % 2 === 0) halos.push({ p: p.clone().add(V3(0, s * 1.3, 0)), col: i % 3 ? '#b8ff5a' : '#ffb040', tam: 0.6 });
    }
    return { tela: fundirTela(tela), corteza: fundirCorteza(cort), brillo: fundirBrillo(brillos), halos };
  });
}
// La madriguera (lo que eran los puestos invasores). `tipo`: la estructura del puesto.
//   · aguja → el tocón hueco grande, quebrado arriba, con la puertita, la escalerita y el farol de
//     hongo en la punta (5 m: la marca del puesto, se ve de lejos);
//   · vaina → un nido de hongos y musgo (como el de afuera, más chico);
//   · generador → el cesto de raíces con las semillas doradas que blinda lo demás;
//   · suelo → el montículo de tierra y raíces del puesto.
export function mallaMadriguera(tipo) {
  if (tipo === 'vaina') { const g = mallaNido(); g.scale.set(0.95, 1.15, 0.95); return g; }
  if (tipo === 'generador') return grupoFijo('madriguera-cesto', armarCesto);
  if (tipo === 'suelo') return grupoFijo('madriguera-suelo', armarSuelo);
  return grupoFijo('madriguera-tocon', armarTocon);
}
function armarTocon() {
  const cort = [], brillos = [], tela = [], halos = [];
  const r = azar(66);
  const A = 2.15;   // del tocón del prototipo (2,3 m) al de la aguja (~5 m)
  const gt = deform(lathe(afinar([[1.25, -0.2], [1.1, 0.2], [0.95, 0.6], [0.9, 1.4], [0.88, 2.0], [0.7, 2.25], [0.001, 2.3]], 4), 40), (v) => {
    const a = Math.atan2(v.x, v.z), y = v.y;
    let k = 1 + 0.08 * ruido(a * 2, y * 0.6, 1) + 0.04 * Math.sin(a * 11 + y);
    k *= 1 + 0.35 * Math.exp(-y / 0.6) * Math.max(0, Math.sin(a * 4 + 0.6));
    if (Math.cos(a) > 0.6 && y < 1.0) k -= 0.35 * sv(1.0, 0.3, y) * sv(0.6, 0.95, Math.cos(a));
    v.x *= k * 0.62; v.z *= k * 0.62;
    if (y > 1.9) v.y += 0.35 * Math.sin(a * 3) * sv(1.9, 2.3, y);
    v.y *= A;
  });
  cort.push(pieza(gt, null, '#6e5440', { veta: (l) => [Math.atan2(l.x, l.z) * 1.0, l.y * 0.5, l.y > 2.1 * A ? 0.3 : 1], pintar: (c, p, n, l) => { musgoEn(c, p, n, 0.9); c.multiplyScalar(0.75 + 0.35 * sv(0, 2 * A, l.y)); if (l.y > 2.05 * A && n.y > 0.4) c.copy(colorDe('#9a6a42')); } }));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.45;
    cort.push(raiz([[Math.sin(a) * 0.6, 0.9, Math.cos(a) * 0.6], [Math.sin(a) * 1.25, 0.6, Math.cos(a) * 1.25], [Math.sin(a) * 1.9, -0.05, Math.cos(a) * 1.9]], [0.3, 0.22, 0.08], '#5e4634', { nudos: 0.06, pintar: (c, p, n) => musgoEn(c, p, n, 0.8) }));
  }
  cort.push(raiz([[-0.5, 0.0, 0.6], [-0.45, 0.85, 0.85], [0.0, 1.15, 0.95], [0.45, 0.85, 0.85], [0.52, 0.0, 0.6]], [0.18, 0.15, 0.14, 0.15, 0.18], '#4a3828', { nudos: 0.04, tramos: 22, pintar: (c, p, n) => musgoEn(c, p, n, 0.7) }));
  brillos.push(pieza(deform(esfera(20, 12), () => {}), M4([0, 0.45, 0.6], [0, 0, 0], [0.42, 0.45, 0.1]), '#0c0806', { fuerza: 1 }));
  brillos.push(pieza(deform(esfera(14, 8), () => {}), M4([0.08, 0.32, 0.55], [0, 0, 0], [0.16, 0.11, 0.05]), '#ffb040', { fuerza: 0.6 }));
  const puerta = lathe([[0.001, -0.02], [0.4, -0.02], [0.4, 0.02], [0.001, 0.02]], 24);
  puerta.rotateX(Math.PI / 2);
  cort.push(pieza(puerta, M4([-0.55, 0.42, 0.85], [0, -1.15, 0]), '#7a4a2a', { veta: (l) => [l.x * 6, l.y, 0.6], pintar: (c, p, n, l) => { if (Math.abs(Math.sin(l.x * 22)) < 0.12) c.multiplyScalar(0.6); } }));
  for (const y of [0.25, 0.6]) cort.push(pieza(new THREE.BoxGeometry(0.38, 0.04, 0.05), M4([-0.55, y, 0.85], [0, -1.15, 0]), '#2a2420', { veta: () => [0, 0, 0] }));
  // las ventanitas encendidas, más arriba
  for (const [a, y] of [[0.5, 1.9], [-0.9, 2.9], [2.2, 3.6]]) {
    const p = V3(Math.sin(a) * 0.62, y, Math.cos(a) * 0.62);
    brillos.push(pieza(deform(esfera(10, 8), () => {}), M4(p, [0, a, 0], [0.12, 0.16, 0.05]), '#ffb84a', { fuerza: 1.3 }));
    halos.push({ p: p.clone().add(V3(Math.sin(a) * 0.1, 0, Math.cos(a) * 0.1)), col: '#ffb84a', tam: 0.9 });
  }
  // el farol de hongo de la punta (lo que era el orbe)
  const fl = V3(0.1, 2.35 * A + 0.15, 0.1);
  brillos.push(pieza(deform(esfera(14, 10), (v) => { v.multiplyScalar(1 + 0.12 * Math.sin(v.x * 20) * Math.sin(v.y * 20)); }), M4(fl, [0, 0, 0], [0.24, 0.3, 0.24]), '#ffb040', { fuerza: 1.8 }));
  halos.push({ p: fl, col: '#ffb040', tam: 2.4 });
  // la escalerita de ramitas
  for (const sx of [-1, 1]) cort.push(raiz([[0.75 + sx * 0.12, 0, 0.6], [0.6 + sx * 0.1, 1.8, 0.35]], [0.025, 0.02], '#6a5040'));
  for (let k = 0; k < 6; k++) { const t = (k + 0.5) / 6; cort.push(raiz([[0.75 - 0.15 * t - 0.12, t * 1.8, 0.6 - 0.25 * t], [0.75 - 0.15 * t + 0.12, t * 1.8, 0.6 - 0.25 * t]], [0.015, 0.015], '#6a5040')); }
  // lo que se robaron, amontonado en la entrada: un ovillo, una media, una cuchara y botones
  tela.push(pieza(deform(esfera(14, 10), () => {}), M4([0.4, 0.12, 1.15], [0, 0, 0], [0.12, 0.12, 0.12]), '#a8562e', { tela: 1, guarda: (l) => [3, l.y + 0.12, Math.atan2(l.x, l.z) * 0.1, 0.06] }));
  tela.push(pieza(husoG([[0.1, 0.04, 1.3], [0.3, 0.05, 1.45], [0.5, 0.06, 1.35], [0.57, 0.08, 1.23]], [0.06, 0.065, 0.06, 0.055], 10, 8), null, '#d8c8a4', { tela: 4 }));
  tela.push(pieza(husoG([[-0.25, 0.03, 1.2], [0.0, 0.035, 1.35]], [0.018, 0.012], 6, 6), null, '#c8c8c8', { tela: 12 }));
  for (let i = 0; i < 5; i++) tela.push(pieza(new THREE.CylinderGeometry(0.025, 0.025, 0.008, 10), M4([-0.15 + r() * 0.4, 0.01, 1.05 + r() * 0.3], [0.1, 0, 0.1]), ['#7a2e2e', '#2c3446', '#c9a64a', '#e2d6bd'][i % 4], { tela: 12 }));
  for (let i = 0; i < 6; i++) { const a = -0.6 - i * 0.9, y = 1.2 + i * 0.55; cort.push(pieza(deform(esfera(12, 6), (v) => { if (v.y > 0) v.y *= 0.35; else v.y *= 0.2; }), M4([Math.sin(a) * 0.62, y, Math.cos(a) * 0.62], [0, a, 0], [0.24, 0.13, 0.2]), '#c8a070', { veta: () => [0, 0, 0.1] })); }
  return { corteza: fundirCorteza(cort), tela: fundirTela(tela), brillo: fundirBrillo(brillos), halos };
}
function armarCesto() {
  const cort = [], brillos = [], halos = [];
  const r = azar(301);
  const E = 2.0;
  // el cuenco de raíz con musgo, bajo
  const gc = deform(lathe(afinar([[0.001, 0.05], [0.25, 0.04], [0.42, 0.12], [0.5, 0.26], [0.46, 0.32], [0.36, 0.24], [0.001, 0.14]], 3), 28), (v) => { v.multiplyScalar(E * (1 + 0.08 * ruido(v.x * 6, v.y * 6, v.z * 6))); });
  cort.push(pieza(gc, null, '#6a5040', { veta: (l) => [Math.atan2(l.x, l.z), l.y * 4, 0.8], pintar: (c, p, n) => musgoEn(c, p, n, 1, 2) }));
  // raíces que trepan el borde y se enroscan para adentro
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3; cort.push(raiz([[Math.sin(a) * 0.62 * E, 0.0, Math.cos(a) * 0.62 * E], [Math.sin(a) * 0.56 * E, 0.26 * E, Math.cos(a) * 0.56 * E], [Math.sin(a + 0.25) * 0.42 * E, 0.36 * E, Math.cos(a + 0.25) * 0.42 * E]], [0.11, 0.08, 0.03], '#5e4634', { nudos: 0.03, pintar: (c, p, nn2) => musgoEn(c, p, nn2, 0.8, 2) })); }
  // el tallo de raíz trenzada que sostiene la semilla grande (la que blinda el puesto)
  const top = V3(0, 0.95 * E, 0);
  for (let k = 0; k < 3; k++) {
    const a = k * 2.09;
    cort.push(raiz([[Math.sin(a) * 0.12, 0.2 * E, Math.cos(a) * 0.12], [Math.sin(a + 1.2) * 0.1, 0.5 * E, Math.cos(a + 1.2) * 0.1], [Math.sin(a + 2.4) * 0.12, 0.8 * E, Math.cos(a + 2.4) * 0.12], [Math.sin(a) * 0.2, top.y + 0.05, Math.cos(a) * 0.2], [Math.sin(a) * 0.14, top.y + 0.32, Math.cos(a) * 0.14]], [0.07, 0.06, 0.055, 0.04, 0.012], '#5e4634', { tramos: 20, pintar: (c, p, nn2) => musgoEn(c, p, nn2, 0.6, 2) }));
  }
  const gota = () => lathe(afinar([[0.001, -1], [0.55, -0.75], [0.72, -0.2], [0.55, 0.45], [0.18, 0.9], [0.001, 1.1]], 3), 14);
  const semilla = (p, s, rot, col, f) => brillos.push(pieza(deform(gota(), (v) => { const k = 1 + 0.12 * Math.cos(Math.atan2(v.x, v.z) * 8); v.x *= k; v.z *= k; }), M4(p, rot, [s, s * 1.2, s]), col, { fuerza: f }));
  // el montón de semillas doradas en el cuenco
  for (let i = 0; i < 16; i++) {
    const a = r() * TAU, d = (0.05 + r() * 0.32) * E;
    const p = V3(Math.sin(a) * d, (0.26 + 0.12 * (1 - d / (0.37 * E)) + r() * 0.03) * E, Math.cos(a) * d);
    semilla(p, (0.03 + r() * 0.018) * E, [1.2 + r() * 0.6, r() * 6, 0], i % 3 ? '#ffb22e' : '#ffd060', 1.15);
    if (i % 3 === 0) halos.push({ p: p.clone(), col: '#ffb22e', tam: 0.8 });
  }
  semilla(top.clone().add(V3(0, 0.12, 0)), 0.16, [0.1, 0, 0.15], '#ffd860', 1.45);
  halos.push({ p: top.clone().add(V3(0, 0.15, 0)), col: '#ffc840', tam: 2.2 });
  return { corteza: fundirCorteza(cort), brillo: fundirBrillo(brillos), halos };
}
function armarSuelo() {
  const tela = [], cort = [];
  const r = azar(77);
  const g = deform(lathe(afinar([[0.001, 0.22], [3.5, 0.2], [5.8, 0.1], [7.0, -0.06]], 4), 36), (v) => { v.y += 0.08 * ruido(v.x * 0.8, 0, v.z * 0.8); });
  tela.push(pieza(g, null, '#4a3a28', { tela: 5, pintar: (c, p, n, l) => { c.multiplyScalar(0.7 + 0.35 * (ruido(l.x * 2, 0, l.z * 2) * 0.5 + 0.5)); musgoEn(c, l, n, 0.6 * sv(-0.3, 0.6, ruido(l.x * 0.7, 1, l.z * 0.7)), 0.3); } }));
  for (let i = 0; i < 14; i++) {
    const a = r() * TAU, d0 = 1.5 + r() * 2.5, d1 = d0 + 1.5 + r() * 2;
    cort.push(raiz([[Math.sin(a) * d0, 0.25, Math.cos(a) * d0], [Math.sin(a + 0.15) * (d0 + d1) / 2, 0.32, Math.cos(a + 0.15) * (d0 + d1) / 2], [Math.sin(a + 0.25) * d1, -0.05, Math.cos(a + 0.25) * d1]], [0.16, 0.12, 0.04], '#4a3828', { nudos: 0.05, pintar: (c, p, n) => musgoEn(c, p, n, 0.8) }));
  }
  return { tela: fundirTela(tela), corteza: fundirCorteza(cort) };
}

// ---------------------------------------------------------------- 3.8.0: el cofre del alba
// En vez de la caja que caía en paracaídas: un cofre viejo que brota del suelo entre raíces, con la tapa
// entreabierta y la luz dorada de adentro, y un hilo de luz que sube para encontrarlo de lejos. Nada vuela.
// `userData.cofre` sube desde abajo de la tierra; `userData.raices` lo abrazan y crecen con él.
let MAT_HAZ_COFRE = null;
export function mallaCofre() {
  const g = new THREE.Group();
  const raices = grupoFijo('cofre-raices', armarRaicesCofre);
  const cofre = grupoFijo('cofre-caja', armarCajaCofre);
  if (!MAT_HAZ_COFRE) MAT_HAZ_COFRE = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 7, 8, 1, true).translate(0, 4.4, 0), MAT_HAZ_COFRE);
  haz.frustumCulled = false;
  g.add(raices, cofre, haz);
  g.userData.raices = raices; g.userData.cofre = cofre; g.userData.haz = haz;
  g.userData.halos = cofre.userData.halos;
  cofre.userData.halos = [];
  g.name = 'cofre-alba';
  return g;
}
function armarCajaCofre() {
  const cort = [], brillos = [], tela = [], halos = [];
  const madera = (c, p, n, l) => { musgoEn(c, p, n, 0.55, 3); };
  // el cajón (con las tablas marcadas) y la tapa redonda entreabierta
  cort.push(pieza(new THREE.BoxGeometry(0.9, 0.48, 0.6, 3, 2, 2), M4([0, 0.24, 0]), '#9a6e44', { veta: (l) => [l.x * 1.4, l.y * 8 + (l.z > 0 ? 0.5 : 0), 0.7], pintar: madera }));
  // la tapa combada, abierta un poco desde la bisagra de atrás
  const tapa = deform(new THREE.BoxGeometry(0.94, 0.1, 0.64, 4, 1, 6), (v) => { v.y += 0.13 * (1 - (v.z / 0.32) ** 2) * (v.y > 0 ? 1 : 0.6); });
  tapa.translate(0, 0.05, 0.32);
  cort.push(pieza(tapa, M4([0, 0.48, -0.31], [-0.38, 0, 0]), '#8a6040', { veta: (l) => [l.x * 1.4, l.z * 6, 0.7], pintar: madera }));
  // los herrajes oscuros y la cerradura
  for (const x of [-0.32, 0.32]) cort.push(pieza(new THREE.BoxGeometry(0.07, 0.5, 0.62), M4([x, 0.24, 0]), '#3a3430', { veta: () => [0, 0, 0] }));
  cort.push(pieza(new THREE.BoxGeometry(0.1, 0.12, 0.04), M4([0, 0.4, 0.31]), '#b0903e', { veta: () => [0, 0, 0] }));
  // la luz dorada que sale por la rendija, y unas semillas asomadas
  brillos.push(pieza(new THREE.BoxGeometry(0.84, 0.03, 0.54), M4([0, 0.47, 0.0]), '#ffc850', { fuerza: 1.7 }));
  const r = azar(91);
  for (let i = 0; i < 5; i++) {
    const p = V3((r() - 0.5) * 0.6, 0.53 + r() * 0.03, (r() - 0.5) * 0.3);
    brillos.push(pieza(deform(esfera(8, 6), (v) => { v.y *= 1.3; }), M4(p, [r(), r() * 6, 0], [0.04, 0.04, 0.04]), '#ffd860', { fuerza: 1.5 }));
  }
  halos.push({ p: V3(0, 0.62, 0), col: '#ffc840', tam: 3 });
  // un poco de musgo y tierra encima (vino de abajo)
  tela.push(pieza(deform(esfera(10, 6), (v) => { v.multiplyScalar(1 + 0.2 * ruido(v.x * 5, v.y * 5, v.z * 5)); if (v.y < 0) v.y *= 0.3; }), M4([-0.2, 0.66, -0.12], [0, 0, 0], [0.22, 0.07, 0.16]), '#5e7e34', { tela: 5 }));
  return { corteza: fundirCorteza(cort), brillo: fundirBrillo(brillos), tela: fundirTela(tela), halos };
}
function armarRaicesCofre() {
  const cort = [], tela = [];
  const r = azar(92);
  // la tierra removida
  const g = deform(lathe(afinar([[0.001, 0.12], [0.6, 0.1], [1.0, 0.05], [1.35, -0.04]], 3), 24), (v) => { v.y += 0.04 * ruido(v.x * 3, 0, v.z * 3); });
  tela.push(pieza(g, null, '#7a6248', { tela: 5, pintar: (c, p, n, l) => { c.multiplyScalar(0.75 + 0.3 * (ruido(l.x * 6, 0, l.z * 6) * 0.5 + 0.5)); } }));
  // las raíces que salen de la tierra y lo abrazan
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + r() * 0.3, d0 = 0.75 + r() * 0.25;
    // finitas, pegadas al cajón: lo agarran de abajo (no son patas)
    cort.push(raiz([[Math.sin(a) * d0, -0.04, Math.cos(a) * d0 * 0.8], [Math.sin(a) * 0.6, 0.04 + r() * 0.04, Math.cos(a) * 0.48], [Math.sin(a + 0.25) * 0.5, 0.26 + r() * 0.1, Math.cos(a + 0.25) * 0.37], [Math.sin(a + 0.5) * 0.46, 0.36, Math.cos(a + 0.5) * 0.33]], [0.05, 0.04, 0.026, 0.008], '#7a5a40', { nudos: 0.015, pintar: (c, p, n) => musgoEn(c, p, n, 0.7, 2) }));
  }
  return { corteza: fundirCorteza(cort), tela: fundirTela(tela) };
}
