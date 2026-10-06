// 3.8 (prototipo de imágenes, NO va al juego): los duendes del Desafío al estilo P, para que el usuario
// y su equipo elijan. Sólo se arma con `?debug=1&duendes=proto` (ver main.js) y lo maneja el visor
// (pruebas/visor-duendes-proto.cjs): cada escena se arma en un claro del bosque del valle real, con la
// luz, la niebla y el cielo del juego.
//   · Los duendes se arman con piezas (formas.js) fundidas en UNA malla por duende con el material de
//     la gente (materialGente: el atlas pintado por código de gente-atlas.js: telas, guardas, la
//     pincelada de la piel, las hebras del pelo). Los ojos que brillan y los hongos de luz van en otra
//     malla (MeshBasic) y los halos en unos Points compartidos por toda la escena.
//   · Cuatro estilos (A tallado rústico, B cuento ilustrado, C bosque y musgo, D oscuro de leyenda),
//     cada uno con el travieso (60-80 cm) y el viejo de las noches grandes (1,2-1,5 m).
//   · El Rey (3 opciones), el Coihue Viejo (3 opciones, afuera, y su corazón por dentro), la lechuza
//     con su jinete, el nido de hongos, la madriguera y las semillas (2 opciones).
import * as THREE from 'three';
import { materialGente } from './gente-cuerpo.js';
import { huso, coser } from './formas.js';
import { registrarLuz } from './luces.js';

const TAU = Math.PI * 2;
const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const cl = (x, a, b) => Math.min(b, Math.max(a, x));
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const vv = (a) => (a.isVector3 ? a.clone() : V3(a[0], a[1], a[2]));
function azar(s) { s = Math.abs(Math.floor(s)) % 2147483646 + 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
// ruido suave fijo, de -1 a 1
function ruido(x, y, z) {
  return Math.sin(x * 1.9 + y * 1.3) * Math.sin(y * 1.7 - z * 2.1) * 0.5 + Math.sin(z * 2.3 + x * 0.9) * Math.sin(x * 2.9 - y * 0.6 + z * 0.4) * 0.3 + Math.sin(x * 4.1 + z * 3.7 + y * 2.9) * 0.2;
}
const COL = new Map();
const colorDe = (hex) => { let c = COL.get(hex); if (!c) { c = new THREE.Color(hex); COL.set(hex, c); } return c; };
const _c2 = new THREE.Color();
const tinta = (c, hex, t) => { if (t > 0) c.lerp(colorDe(hex), Math.min(1, t)); };

// ---------------------------------------------------------------- piezas y fundición
// Una pieza: la geometría (en el espacio de la figura) y lo que hace falta para pintarla. `local` son
// las posiciones antes de ubicarla (para las guardas, las hebras, las vetas).
// o: tela (tipo del atlas), piel, ao (número o fn), pintar(c, p, n, l), guarda(l, p) → [tipo, dist,
// largo, ancho], hebra(l, p) → [a lo ancho, a lo largo], faceta (0..1: golpes de formón).
function pieza(geo, M, col, o = {}) {
  if (o.faceta && geo.index) geo = geo.toNonIndexed();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const local = geo.attributes.position.array.slice();
  if (M) geo.applyMatrix4(M);
  if (o.faceta) facetar(geo, o.faceta);
  return { geo, local, col, ...o };
}
// las caras planas de una talla: la normal de cada triángulo, mezclada con la suave
function facetar(geo, k) {
  const P = geo.attributes.position, N = geo.attributes.normal;
  const a = V3(), b = V3(), c = V3(), f = V3(), n = V3();
  for (let t = 0; t < P.count; t += 3) {
    a.fromBufferAttribute(P, t); b.fromBufferAttribute(P, t + 1); c.fromBufferAttribute(P, t + 2);
    f.subVectors(b, a).cross(c.sub(a));
    if (f.lengthSq() < 1e-14) continue;
    f.normalize();
    for (let j = 0; j < 3; j++) { n.fromBufferAttribute(N, t + j); if (n.dot(f) < 0) continue; n.lerp(f, k).normalize(); N.setXYZ(t + j, n.x, n.y, n.z); }
  }
  N.needsUpdate = true;
}
const _p = V3(), _n = V3(), _l = V3(), _c = new THREE.Color();
function fundir(piezas, material, sombra = true) {
  let nv = 0, ni = 0;
  for (const q of piezas) { nv += q.geo.attributes.position.count; ni += q.geo.index ? q.geo.index.count : q.geo.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  const tela = new Float32Array(nv * 3), gua = new Float32Array(nv * 4), zona = new Float32Array(nv * 2);
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0;
  for (const q of piezas) {
    const P = q.geo.attributes.position, N = q.geo.attributes.normal, L = q.local, n = P.count;
    const fijo = typeof q.col === 'string' ? colorDe(q.col) : null;
    for (let i = 0; i < n; i++) {
      _p.fromBufferAttribute(P, i); _n.fromBufferAttribute(N, i); _l.set(L[i * 3], L[i * 3 + 1], L[i * 3 + 2]);
      if (fijo) _c.copy(fijo); else _c.setRGB(1, 1, 1);
      if (typeof q.col === 'function') q.col(_c, _p, _n, _l);
      if (q.pintar) q.pintar(_c, _p, _n, _l, i);
      const k = ov + i;
      pos[k * 3] = _p.x; pos[k * 3 + 1] = _p.y; pos[k * 3 + 2] = _p.z;
      nor[k * 3] = _n.x; nor[k * 3 + 1] = _n.y; nor[k * 3 + 2] = _n.z;
      col[k * 3] = _c.r; col[k * 3 + 1] = _c.g; col[k * 3 + 2] = _c.b;
      if (q.tela) {
        const h = q.hebra ? q.hebra(_l, _p) : [_l.x + _l.z * 0.5, _l.y];
        tela[k * 3] = q.tela; tela[k * 3 + 1] = h[0]; tela[k * 3 + 2] = h[1];
      }
      if (q.guarda) { const g = q.guarda(_l, _p); if (g) gua.set(g, k * 4); }
      zona[k * 2] = q.piel ? 1 : 0;
      zona[k * 2 + 1] = q.ao == null ? 1 : typeof q.ao === 'function' ? q.ao(_p, _n, _l) : q.ao;
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
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  const m = new THREE.Mesh(g, material);
  m.castShadow = sombra; m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------- geometrías
const M4 = (pos = [0, 0, 0], rot = [0, 0, 0], esc = [1, 1, 1]) => new THREE.Matrix4().compose(vv(pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')), vv(esc));
const esfera = (a = 20, b = 14) => new THREE.SphereGeometry(1, a, b);
function deform(geo, fn) {
  const P = geo.attributes.position, v = V3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); fn(v, i); P.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  if (geo.index) coser(geo);
  return geo;
}
const husoG = (pts, rad, tramos = 12, lados = 10) => huso('#ffffff', pts.map((p) => (p.isVector3 ? [p.x, p.y, p.z] : p)), rad, tramos, lados).geometry;
function lathe(perfil, lados = 16, desde = 0, arco = TAU) {
  return new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), lados, desde, arco);
}
// un perfil más fino: interpola los puntos (para que el torno se pueda deformar)
function afinar(perfil, n = 3) {
  const out = [];
  for (let i = 0; i < perfil.length - 1; i++) for (let j = 0; j < n; j++) { const t = j / n; out.push([perfil[i][0] + (perfil[i + 1][0] - perfil[i][0]) * t, perfil[i][1] + (perfil[i + 1][1] - perfil[i][1]) * t]); }
  out.push(perfil[perfil.length - 1]);
  return out;
}
// una superficie (u, v) ∈ [0,1]²; `grosor`: la cara de atrás, corrida hacia adentro (alas, hojas, capas)
function grilla(fn, nu, nv, grosor = 0) {
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

// ---------------------------------------------------------------- materiales
let MAT_BRILLO = null, MAT_CORTEZA = null, MAT_HOJA = null, TEX_HALO = null;
const matBrillo = () => MAT_BRILLO || (MAT_BRILLO = new THREE.MeshBasicMaterial({ vertexColors: true }));
// la corteza: vetas hondas a lo largo (en el espacio de la pieza), musgo arriba y el color pintado
function matCorteza() {
  if (MAT_CORTEZA) return MAT_CORTEZA;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aVeta; varying vec3 vVeta; varying vec3 vNorC;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvVeta = aVeta; vNorC = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vVeta; varying vec3 vNorC;
        float hC(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float nC(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hC(i), hC(i + vec2(1.0, 0.0)), f.x), mix(hC(i + vec2(0.0, 1.0)), hC(i + vec2(1.0, 1.0)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          // vVeta: x a lo ancho (m), y a lo largo (m), z cuánto se ve la veta (0 = madera lisa)
          vec2 u = vVeta.xy;
          float w = nC(vec2(u.x * 2.2, u.y * 0.25)) * 0.6 + nC(vec2(u.x * 5.0, u.y * 0.6)) * 0.4;
          float grieta = smoothstep(0.08, 0.0, abs(fract(u.x * 1.6 + w * 1.4) - 0.5) - 0.38);
          float placa = nC(vec2(u.x * 1.6, u.y * 0.9)) * 0.25;
          float k = vVeta.z;
          diffuseColor.rgb *= mix(1.0, (0.8 + placa) * (1.0 - 0.62 * grieta), k);
          diffuseColor.rgb *= 0.92 + 0.16 * nC(u * 9.0);
        }`);
  };
  m.customProgramCacheKey = () => 'duendes-corteza-38';
  return (MAT_CORTEZA = m);
}
const matHoja = () => MAT_HOJA || (MAT_HOJA = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
function texHalo() {
  if (TEX_HALO) return TEX_HALO;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  TEX_HALO = new THREE.CanvasTexture(c);
  return TEX_HALO;
}
// una malla de corteza: como `fundir`, con aVeta en vez de las telas
function fundirCorteza(piezas, sombra = true) {
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
      if (typeof q.col === 'function') q.col(_c, _p, _n, _l);
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
  const m = new THREE.Mesh(g, matCorteza());
  m.castShadow = sombra; m.receiveShadow = true;
  return m;
}
// una malla de brillo (ojos, hongos de luz, semillas): MeshBasic con el color por vértice (> 1 = más fuerte)
function fundirBrillo(piezas) {
  if (!piezas.length) return null;
  let nv = 0, ni = 0;
  for (const q of piezas) { nv += q.geo.attributes.position.count; ni += q.geo.index ? q.geo.index.count : q.geo.attributes.position.count; }
  const pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0;
  for (const q of piezas) {
    const P = q.geo.attributes.position, N = q.geo.attributes.normal, n = P.count, c = colorDe(q.col), f = q.fuerza ?? 1;
    for (let i = 0; i < n; i++) {
      const k = ov + i;
      pos[k * 3] = P.getX(i); pos[k * 3 + 1] = P.getY(i); pos[k * 3 + 2] = P.getZ(i);
      // el centro más claro (mira de frente: la normal), el borde del color
      const nz = N ? Math.abs(N.getZ(i)) * 0.5 + 0.5 : 1;
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
  return new THREE.Mesh(g, matBrillo());
}

// ---------------------------------------------------------------- los estilos
// Las medidas se arman "a escala de persona" (la cabeza toca 1,6) y la figura se achica con `k`: así
// las telas del atlas tienen el grano de la ropa de la gente.
const BASE = {
  k: 0.42, cab: 0.21, cabEsc: [1, 1.04, 0.98],
  nariz: { largo: 1, punta: 1, forma: 'papa' }, orejas: { largo: 1, ancho: 1, abre: 1.05 },
  ojos: { tam: 1, iris: '#3a2a1e', brillo: null, fuerza: 2.2, parpado: 0.35, halo: 0, blanco: '#e9e0cc' },
  cejas: { col: '#6b5a48', grosor: 1, angulo: 0.25 },
  boca: 'sonrisa', barba: null, bigote: null, pelo: { col: '#6b5a48', mechones: 5 },
  piel: { col: '#c99a72', tipo: 'lisa', mejillas: '#c86a5a', ruido: 0.06 },
  gorro: { alto: 2.3, caida: 0.5, col: '#8e2f22', puno: '#d9c49a', guarda: [2, 1], tela: 5, hongos: 0, musgo: 0 },
  cuerpo: { torso: 0.5, panza: 0.08, ancho: 1, cadera: 0.6, brazo: 1, gBrazo: 1, gPierna: 1, encorvado: 0 },
  ropa: { saco: '#5f6b3e', tela: 3, guardaSaco: [7, 0.05], cinto: '#3e2a1c', hebilla: '#b0903e', pantalon: '#6b4a3a', telaPant: 1, botas: '#3e2a1c', remiendos: ['#b0803e', '#8a6d4b'], bufanda: null, guardaBufanda: [3, 0], largo: 0.16 },
  capa: null, manos: { nudosas: 0, dedos: 1, uñas: null }, faceta: 0, gastado: 0, dientes: 0,
};
const mezclar = (a, b) => {
  const o = { ...a };
  for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? { ...a[k], ...v } : v;
  return o;
};
export const ESTILOS = {
  A: {
    nombre: 'Tallado rústico',
    travieso: (i = 0) => mezclar(BASE, {
      faceta: 0.7, gastado: 0.55, madera: 1,
      piel: { col: ['#c98d5c', '#b9844f', '#cf9a68'][i % 3], tipo: 'veta', mejillas: '#b8563e', ruido: 0.05 },
      gorro: { col: ['#8e2f22', '#5a4a2e', '#3e5a6a'][i % 3], puno: '#d6c29a', guarda: [[2, 1], [11, 1], [3, 1]][i % 3], alto: [2.3, 2.6, 2.1][i % 3], caida: [0.55, 0.85, 0.3][i % 3] },
      ropa: { saco: ['#5f6b3e', '#7a5434', '#6b5a36'][i % 3], tela: [3, 1, 3][i % 3], pantalon: ['#6b4a3a', '#5a5040', '#4e3a2e'][i % 3], remiendos: ['#b0803e', '#9a3c2a', '#d6c29a'], bufanda: i === 1 ? '#b0803e' : null },
      barba: i === 2 ? { tipo: 'corta', col: '#c9b48c', largo: 1 } : i === 0 ? { tipo: 'chiva', col: '#8a6d4b', largo: 0.7 } : null,
      cejas: { col: '#5a4030', angulo: 0.35 }, pelo: { col: '#5a4030' },
      ojos: { iris: '#2a1c12', parpado: 0.42 },
    }),
    viejo: () => mezclar(BASE, {
      k: 0.8, cab: 0.2, faceta: 0.7, gastado: 0.45, madera: 1,
      piel: { col: '#a07a52', tipo: 'veta', mejillas: null, ruido: 0.07 },
      nariz: { largo: 1.25, punta: 1.05, forma: 'gancho' }, orejas: { largo: 1.25 },
      ojos: { brillo: '#ffb03a', fuerza: 3, parpado: 0.5, halo: 1, iris: '#1a1008' },
      cejas: { col: '#8d8a7c', grosor: 1.6, angulo: -0.35 }, boca: 'mueca',
      gorro: { col: '#3a2c20', puno: '#5a4a3a', guarda: [11, 1], alto: 2.9, caida: 1.1, musgo: 0.4 },
      barba: { tipo: 'larga', col: '#a29c8a', largo: 1.3, canas: 0.4, musgo: 0.35 }, bigote: { col: '#a29c8a' },
      cuerpo: { torso: 0.56, panza: 0.02, ancho: 0.95, cadera: 0.62, brazo: 1.25, gBrazo: 0.9, gPierna: 0.95, encorvado: 0.55 },
      ropa: { saco: '#4a3a2c', tela: 1, pantalon: '#3a3028', botas: '#2a1e16', remiendos: ['#5a4a3a'], largo: 0.3 },
      capa: { tipo: 'corteza', col: '#4a3a2c', musgo: 0.6 }, manos: { nudosas: 1, dedos: 1.35 },
    }),
  },
  B: {
    nombre: 'Cuento ilustrado',
    travieso: (i = 0) => mezclar(BASE, {
      cab: 0.27, cabEsc: [1.05, 1.0, 1.0],
      nariz: { largo: 1.35, punta: 1.6, forma: 'papa' }, orejas: { largo: 1.15, ancho: 1.2 },
      piel: { col: ['#ebb08a', '#e0a07a', '#f0bc96'][i % 3], tipo: 'lisa', mejillas: '#e0604a', ruido: 0.03 },
      ojos: { tam: 1.35, iris: '#3a5a2a', parpado: 0.25, blanco: '#f4efe2' },
      gorro: { col: ['#c0392b', '#2f7a4a', '#d07a1a'][i % 3], puno: '#efe3c4', guarda: [13, 1], alto: 2.4, caida: [0.6, 1, 0.4][i % 3], tela: 4 },
      ropa: { saco: ['#2f7a4a', '#b8963e', '#3b5a8a'][i % 3], tela: 4, guardaSaco: [12, 0.06], pantalon: ['#3a5a8a', '#7a2e2e', '#5a6a3a'][i % 3], botas: '#6b3a1e', remiendos: ['#e0b12a', '#c0392b'], bufanda: ['#e0b12a', null, '#c0392b'][i % 3], hebilla: '#e0c040' },
      barba: i === 1 ? { tipo: 'corta', col: '#e8dcc4', largo: 1.1 } : null,
      cejas: { col: '#7a4a2a', grosor: 1.3, angulo: 0.3 }, pelo: { col: '#a0522d' },
      cuerpo: { panza: 0.14, ancho: 1.05 },
    }),
    viejo: () => mezclar(BASE, {
      k: 0.74, cab: 0.26, nariz: { largo: 1.5, punta: 1.55, forma: 'papa' }, orejas: { largo: 1.2, ancho: 1.2 },
      piel: { col: '#c8967a', tipo: 'lisa', mejillas: '#b8605a', ruido: 0.04 },
      ojos: { tam: 1.2, brillo: '#ffe066', fuerza: 2.6, parpado: 0.45, halo: 1 },
      cejas: { col: '#f0ece0', grosor: 2, angulo: -0.25 }, boca: 'mueca',
      gorro: { col: '#2c3446', puno: '#4a3a6a', guarda: [13, 1], alto: 3.0, caida: 1.2, tela: 5 },
      barba: { tipo: 'larga', col: '#eeeae0', largo: 1.35, canas: 0 }, bigote: { col: '#eeeae0' },
      cuerpo: { torso: 0.55, panza: 0.1, ancho: 1.05, cadera: 0.6, brazo: 1.15, encorvado: 0.4 },
      ropa: { saco: '#4a3a6a', tela: 15, guardaSaco: [13, 0.08], pantalon: '#2c3446', botas: '#3a2418', remiendos: ['#7a5a9a'], largo: 0.32 },
      capa: { tipo: 'lana', col: '#3b2f55', guarda: [13, 0.12] }, manos: { nudosas: 0.5, dedos: 1.15 },
    }),
  },
  C: {
    nombre: 'Bosque y musgo',
    travieso: (i = 0) => mezclar(BASE, {
      piel: { col: ['#a48a68', '#9a8262', '#ae9470'][i % 3], tipo: 'corteza', mejillas: null, ruido: 0.06 },
      ojos: { brillo: '#d8ff6a', fuerza: 1.8, iris: '#1a1a0a', parpado: 0.38, halo: 0.6 },
      gorro: { col: ['#6b5232', '#4e5a34', '#5a4030'][i % 3], puno: '#4e5a34', guarda: [11, 1], tela: 5, hongos: 3, musgo: 0.5, alto: [2.2, 2.5, 2.0][i % 3] },
      ropa: { saco: ['#4e5a34', '#5a4a2e', '#3e4a2e'][i % 3], tela: 1, guardaSaco: [11, 0.05], pantalon: '#4a3a28', botas: '#3a2a1c', remiendos: ['#7a8a4a', '#8a6d4b'] },
      barba: i !== 1 ? { tipo: 'corta', col: '#94a478', largo: 0.9, liquen: 1, musgo: 0.3 } : null,
      cejas: { col: '#a9b48a', grosor: 1.2 }, pelo: { col: '#7a8a5a' },
      capa: { tipo: 'musgo', col: '#4e6a2a', corta: 1, musgo: 0.6 },
    }),
    viejo: () => mezclar(BASE, {
      k: 0.82, cab: 0.2,
      piel: { col: '#7a6850', tipo: 'corteza', mejillas: null, ruido: 0.08 },
      nariz: { largo: 1.3, punta: 1.1, forma: 'gancho' }, orejas: { largo: 1.3 },
      ojos: { brillo: '#a8ff4a', fuerza: 3.2, parpado: 0.45, halo: 1, iris: '#0a1004' },
      cejas: { col: '#b8c2a0', grosor: 1.8, angulo: -0.3 }, boca: 'mueca',
      gorro: { col: '#3a3424', puno: '#3e5a2a', guarda: [11, 1], alto: 2.7, caida: 1.0, hongos: 6, musgo: 1 },
      barba: { tipo: 'larga', col: '#9aa880', largo: 1.45, liquen: 1, musgo: 0.5 }, bigote: { col: '#9aa880' },
      cuerpo: { torso: 0.56, panza: 0.02, ancho: 0.95, cadera: 0.62, brazo: 1.25, gBrazo: 0.9, encorvado: 0.55 },
      ropa: { saco: '#3a3a26', tela: 1, pantalon: '#2e2a20', botas: '#2a2218', remiendos: ['#4e5a34'], largo: 0.3 },
      capa: { tipo: 'musgo', col: '#3e5a2a', musgo: 1 }, manos: { nudosas: 1, dedos: 1.4 },
    }),
  },
  D: {
    nombre: 'Oscuro de leyenda',
    travieso: (i = 0) => mezclar(BASE, {
      cab: 0.19, cabEsc: [0.88, 1.18, 0.96],
      nariz: { largo: 1.45, punta: 0.8, forma: 'larga' }, orejas: { largo: 1.45, ancho: 0.85, abre: 1.25 },
      piel: { col: ['#9a9478', '#8e8a72', '#a49c80'][i % 3], tipo: 'gris', mejillas: null, ruido: 0.07 },
      ojos: { brillo: '#ffa830', fuerza: 2.2, parpado: 0.5, halo: 0.5, iris: '#1a0e04' },
      cejas: { col: '#3a3028', angulo: 0.45 }, boca: 'dientes', dientes: 1,
      gorro: { col: ['#4a2e2a', '#2e3430', '#3a2e22'][i % 3], puno: '#2a2420', guarda: [7, 1], alto: 2.8, caida: 1.1 },
      ropa: { saco: ['#3a3430', '#2e2a26', '#3e3428'][i % 3], tela: 3, guardaSaco: [9, 0.1], pantalon: '#2a2420', botas: '#1e1814', remiendos: ['#4a3a2a', '#3e4a3a'] },
      barba: i === 0 ? { tipo: 'chiva', col: '#3a3028', largo: 1.1 } : null,
      pelo: { col: '#2a2420', mechones: 7 },
      cuerpo: { torso: 0.5, panza: -0.04, ancho: 0.82, cadera: 0.66, brazo: 1.15, gBrazo: 0.75, gPierna: 0.78 },
      manos: { nudosas: 0.6, dedos: 1.35 },
    }),
    viejo: () => mezclar(BASE, {
      k: 0.9, cab: 0.19, cabEsc: [0.86, 1.22, 0.96],
      piel: { col: '#6e7064', tipo: 'gris', mejillas: null, ruido: 0.08 },
      nariz: { largo: 1.6, punta: 0.85, forma: 'gancho' }, orejas: { largo: 1.6, ancho: 0.9, abre: 1.3 },
      ojos: { brillo: '#9dff5a', fuerza: 3.4, parpado: 0.55, halo: 1.2, iris: '#050a02' },
      cejas: { col: '#8d8a82', grosor: 1.6, angulo: -0.45 }, boca: 'dientes', dientes: 1,
      gorro: { col: '#262420', puno: '#2a2a22', guarda: [9, 1], alto: 3.2, caida: 1.5, musgo: 0.6 },
      barba: { tipo: 'larga', col: '#8d8a82', largo: 1.6, canas: 0.5, musgo: 0.5 }, bigote: { col: '#8d8a82' },
      cuerpo: { torso: 0.6, panza: -0.06, ancho: 0.82, cadera: 0.7, brazo: 1.4, gBrazo: 0.7, gPierna: 0.72, encorvado: 0.65 },
      ropa: { saco: '#24221e', tela: 1, pantalon: '#1e1c18', botas: '#14100c', remiendos: ['#3a3428'], largo: 0.36 },
      capa: { tipo: 'corteza', col: '#2e2820', musgo: 0.8, larga: 1 }, manos: { nudosas: 1, dedos: 1.7 },
    }),
  },
};

// ---------------------------------------------------------------- las poses
// Las metas de las manos y los pies, en el espacio de la figura (escala de persona; mira a +z).
// `inclina` (adelante +), `gira`, `cabeza` [cabeceo (abajo +), giro, ladeo]. `foco`: lo que lleva en
// las manos (queso, farol, bastón...).
const POSES = {
  parado: () => ({ inclina: 0.06, cabeza: [-0.05, 0, 0], manos: [[0.3, 0.62, 0.06], [-0.3, 0.62, 0.06]], pies: [[0.13, 0, 0.02, 0.15], [-0.13, 0, -0.02, -0.15]] }),
  robando: () => ({ inclina: 0.18, gira: 0.25, cabeza: [0.05, -0.3, 0.14], cadera: -0.04,
    manos: [[0.16, 0.86, 0.3], [-0.14, 0.82, 0.32]], foco: 'queso',
    pies: [[0.14, 0.0, 0.2, 0.2], [-0.12, 0.14, -0.22, -0.1, 0.55]] }),
  riendo: () => ({ inclina: -0.22, cabeza: [-0.42, 0.15, -0.12], boca: 'risa', parpado: 0.75,
    manos: [[0.17, 0.8, 0.27], [-0.2, 0.74, 0.24]], pies: [[0.17, 0, 0.06, 0.4], [-0.15, 0, -0.04, -0.3]] }),
  trepando: () => ({ inclina: 0.28, gira: 0.15, cabeza: [-0.15, 0.85, 0.15], cadera: 0.42,
    manos: [[0.2, 1.62, 0.34], [-0.14, 1.36, 0.36]], pies: [[0.15, 0.62, 0.3, 0.2, -0.5], [-0.14, 0.2, 0.18, -0.1, -0.3]] }),
  acecho: () => ({ inclina: 0, cabeza: [0.02, 0.1, 0.06], cadera: -0.05,
    manos: [[0.34, 0.72, 0.42], [-0.3, 0.86, 0.46]], garra: 1, pies: [[0.2, 0, 0.12, 0.25], [-0.16, 0, -0.22, -0.2]] }),
  andando: () => ({ inclina: 0.12, cabeza: [-0.15, 0, 0], manos: [[0.28, 0.66, -0.12], [-0.28, 0.7, 0.18]], pies: [[0.12, 0, 0.24, 0.1], [-0.12, 0.06, -0.2, -0.1, 0.3]] }),
  corriendo: () => ({ inclina: 0.3, cabeza: [-0.35, 0, 0], manos: [[0.26, 0.8, -0.2], [-0.24, 0.9, 0.3]], pies: [[0.12, 0.0, 0.32, 0.05], [-0.12, 0.22, -0.3, -0.05, 0.8]] }),
  farol: () => ({ inclina: 0.1, cabeza: [-0.25, 0.1, 0], manos: [[0.34, 0.98, 0.4], [-0.3, 0.64, 0.05]], foco: 'farol', pies: [[0.14, 0, 0.1, 0.2], [-0.13, 0, -0.1, -0.15]] }),
  montado: () => ({ inclina: 0.2, cabeza: [-0.25, 0, 0], cadera: 0, sentado: 1,
    manos: [[0.2, 0.86, 0.42], [-0.2, 0.86, 0.42]], pies: [[0.3, 0.28, 0.2, 0.3, -0.4], [-0.3, 0.28, 0.2, -0.3, -0.4]] }),
  trono: () => ({ inclina: -0.05, cabeza: [0.08, 0, 0], sentado: 1, cadera: 0,
    manos: [[0.42, 0.62, 0.32], [-0.42, 0.64, 0.32]], pies: [[0.2, 0, 0.42, 0.2], [-0.2, 0, 0.42, -0.2]] }),
  bastón: () => ({ inclina: 0.05, cabeza: [0.0, -0.2, 0.05], sentado: 1, cadera: 0,
    manos: [[0.4, 0.9, 0.36], [-0.38, 0.62, 0.3]], foco: 'baston', pies: [[0.2, 0, 0.42, 0.2], [-0.2, 0, 0.42, -0.2]] }),
};

// ---------------------------------------------------------------- un duende
// Devuelve { g (grupo, en metros), ojos [posiciones locales], brillos [{p, col, tam}] }
export function armarDuende(P, poseNombre = 'parado', semilla = 1) {
  const pose = (POSES[poseNombre] || POSES.parado)();
  const r = azar(semilla * 97 + 13);
  const piezas = [], brillos = [], halos = [];
  const C = P.cuerpo, R = P.cab, F = P.faceta;
  const sentado = !!pose.sentado;
  // ---- la pelvis y el torso
  const caderaY = sentado ? 0.5 : C.cadera + (pose.cadera || 0) * (pose.cadera > 0.3 ? 1 : 0.6);
  const pelvis = V3(0, caderaY, sentado ? -0.05 : 0);
  if (pose.cadera > 0.3) pelvis.z -= 0.05;
  const incl = (pose.inclina || 0) + C.encorvado;
  const Qt = new THREE.Quaternion().setFromEuler(new THREE.Euler(incl, pose.gira || 0, 0, 'YXZ'));
  const Mt = new THREE.Matrix4().compose(pelvis, Qt, V3(1, 1, 1));
  const L = C.torso, anchoT = C.ancho;
  const enT = (x, y, z) => V3(x, y, z).applyMatrix4(Mt);
  // la piel: el color de cada estilo
  const piel = P.piel;
  const pintaPiel = (c, p, n, l) => {
    const rr = ruido(l.x * 9, l.y * 9, l.z * 9);
    c.multiplyScalar(1 + rr * piel.ruido);
    if (piel.tipo === 'veta') {
      const v = Math.sin(l.y * 34 + 9 * ruido(l.x * 3, l.y * 1.5, l.z * 3)) * 0.5 + 0.5;
      c.multiplyScalar(0.8 + 0.3 * v * v);
      if (P.gastado) tinta(c, '#a07a52', P.gastado * 0.25 * sv(0.3, 0.8, ruido(l.x * 14 + 3, l.y * 14, l.z * 14)));
    } else if (piel.tipo === 'corteza') {
      const f = Math.abs(Math.sin(Math.atan2(l.x, l.z) * 7 + 3 * ruido(l.x * 5, l.y * 2, l.z * 5) + l.y * 3));
      c.multiplyScalar(0.62 + 0.42 * sv(0.05, 0.45, f));
      tinta(c, '#9aa878', 0.35 * sv(0.35, 0.8, ruido(l.x * 11, l.y * 11 + 2, l.z * 11)));
    } else if (piel.tipo === 'gris') {
      tinta(c, '#4a5244', 0.2 * sv(0, 1, ruido(l.x * 6, l.y * 6, l.z * 6) + 0.3));
    }
  };
  // tela de la ropa, gastada (la talla: la madera aparece en los bordes)
  const gastar = (c, l) => { if (P.madera) c.multiplyScalar(0.78 + 0.3 * (Math.sin(l.y * 30 + 8 * ruido(l.x * 3, l.y * 1.5, l.z * 3)) * 0.5 + 0.5) ** 2); if (P.gastado) tinta(c, '#b88a5a', P.gastado * 0.8 * sv(0.35, 0.8, ruido(l.x * 16 + 5, l.y * 16, l.z * 16 + 1))); };
  // el saco: torno de la cadera a los hombros, con la falda abierta abajo
  {
    const perf = afinar([[0.27 + P.ropa.largo * 0.15, -0.06 - P.ropa.largo], [0.26, -0.06], [0.25 + C.panza * 0.4, 0.08], [0.255 + C.panza, 0.18], [0.24 + C.panza * 0.5, L * 0.55], [0.21, L * 0.8], [0.15, L * 0.97], [0.075, L + 0.04], [0.06, L + 0.065]], 3);
    const g = lathe(perf, 24);
    const yb = -0.06 - P.ropa.largo;
    deform(g, (v) => {
      v.x *= anchoT; v.z *= 0.8;
      if (v.z > 0) v.z *= 1 + C.panza * 1.6 * Math.exp(-(((v.y - 0.15) / 0.18) ** 2));
      // la falda: más abierta atrás y con el ruedo desparejo
      if (v.y < -0.02) { const t = (-0.02 - v.y) / (P.ropa.largo + 0.04); v.x *= 1 + 0.12 * t; v.z *= 1 + 0.18 * t; v.y += 0.03 * t * Math.sin(Math.atan2(v.x, v.z) * 5 + semilla); }
    });
    piezas.push(pieza(g, Mt, P.ropa.saco, {
      tela: P.ropa.tela, faceta: F * 0.6,
      pintar: (c, p, n, l) => { gastar(c, l); c.multiplyScalar(0.94 + 0.08 * ruido(l.x * 7, l.y * 7, l.z * 7)); },
      guarda: (l) => { const [t, a] = P.ropa.guardaSaco; return [t, l.y - yb, Math.atan2(l.x, l.z) * 0.26, a]; },
    }));
    // el cinto con su hebilla
    const gc = lathe([[0.262 + C.panza * 0.7, 0.05], [0.272 + C.panza * 0.8, 0.075], [0.262 + C.panza * 0.7, 0.1]], 24);
    deform(gc, (v) => { v.x *= anchoT; v.z *= 0.8; if (v.z > 0) v.z *= 1 + C.panza * 1.6 * Math.exp(-(((v.y - 0.15) / 0.18) ** 2)); });
    piezas.push(pieza(gc, Mt, P.ropa.cinto, { tela: 3 }));
    const zh = (0.27 + C.panza * 0.8) * 0.8 * (1 + C.panza * 1.6 * Math.exp(-(((0.075 - 0.15) / 0.18) ** 2)));
    const gh = new THREE.BoxGeometry(0.075, 0.055, 0.02);
    piezas.push(pieza(gh, new THREE.Matrix4().multiplyMatrices(Mt, M4([0, 0.075, zh + 0.006])), P.ropa.hebilla, { tela: 12, faceta: 0.3 }));
    // los remiendos: parches cosidos sobre el saco
    const nr = P.ropa.remiendos.length ? 2 + Math.floor(r() * 2) : 0;
    for (let i = 0; i < nr; i++) {
      const a = (r() - 0.5) * 2.4 + (i % 2 ? Math.PI : 0) * 0.35, y = 0.15 + r() * (L * 0.55);
      const perfR = 0.24 + C.panza * 0.5 * Math.exp(-(((y - 0.15) / 0.2) ** 2));
      const x = Math.sin(a) * perfR * anchoT, z = Math.cos(a) * perfR * 0.8 * (Math.cos(a) > 0 ? 1 + C.panza * 1.6 * Math.exp(-(((y - 0.15) / 0.18) ** 2)) : 1);
      const gp = new THREE.BoxGeometry(0.08 + r() * 0.04, 0.07 + r() * 0.04, 0.012, 2, 2, 1);
      piezas.push(pieza(gp, new THREE.Matrix4().multiplyMatrices(Mt, M4([x, y, z], [0, a, (r() - 0.5) * 0.5])), P.ropa.remiendos[i % P.ropa.remiendos.length], { tela: 2, faceta: 0.4, pintar: (c, p, n, l) => { if (Math.abs(Math.abs(l.x) - 0.045) < 0.008 || Math.abs(Math.abs(l.y) - 0.04) < 0.008) c.multiplyScalar(0.7); } }));
    }
    // la bufanda
    if (P.ropa.bufanda) {
      const gb = lathe([[0.1, L - 0.02], [0.16, L], [0.17, L + 0.04], [0.13, L + 0.08], [0.09, L + 0.08]], 20);
      deform(gb, (v) => { v.x *= anchoT; v.z *= 0.9; v.y += 0.01 * Math.sin(Math.atan2(v.x, v.z) * 3); });
      piezas.push(pieza(gb, Mt, P.ropa.bufanda, { tela: 1, guarda: (l) => [P.ropa.guardaBufanda[0], l.y - (L - 0.02), Math.atan2(l.x, l.z) * 0.15, 0.1] }));
      const pts = [[0.05, L + 0.02, 0.13], [0.08, L - 0.08, 0.2], [0.07, L - 0.22, 0.24]];
      piezas.push(pieza(deform(husoG(pts, [0.035, 0.04, 0.03], 8, 8), (v) => { v.x = 0.065 + (v.x - 0.065) * 1.4; v.z = 0.2 + (v.z - 0.2) * 0.5; }), Mt, P.ropa.bufanda, { tela: 1 }));
    }
  }
  // ---- la capa (corteza, musgo, hojas o lana): cuelga de los hombros
  if (P.capa) {
    const cp = P.capa, larga = cp.larga ? 1.15 : 1, corta = cp.corta ? 0.45 : 1;
    const top = enT(0, L - 0.02, -0.02);
    const alto = (top.y - (corta < 1 ? top.y * 0.55 : 0.08)) * larga;
    const nu = 22, nvv = 14;
    const g = grilla((u, v, p) => {
      const a = (u - 0.5) * (cp.envuelve ? 4.9 : corta < 1 ? 4.2 : 3.6);
      const y = top.y - v * alto;
      const rad = (0.12 + 0.24 * sv(0, 0.25, v) + 0.12 * v) * (1 + 0.15 * Math.sin(u * 23 + v * 3) * v);
      const ragged = v > 0.9 ? 0.06 * Math.sin(u * 47 + semilla) : 0;
      p.set(Math.sin(a) * rad * anchoT * 1.1 + top.x, y + ragged * alto, -Math.cos(a) * rad * 0.95 + top.z - v * 0.05);
    }, nu, nvv, 1);
    const colC = cp.col;
    piezas.push(pieza(g, null, colC, {
      tela: cp.tipo === 'lana' ? 15 : cp.tipo === 'hojas' ? 0 : 3,
      pintar: (c, p, n, l) => {
        const rr = ruido(l.x * 13, l.y * 13, l.z * 13);
        if (cp.tipo === 'corteza') { const f = Math.abs(Math.sin(l.x * 40 + rr * 3)); c.multiplyScalar(0.6 + 0.45 * sv(0.05, 0.5, f)); }
        if (cp.tipo === 'hojas') {
          // hojas superpuestas como escamas: cada una con su color y la nervadura
          const fila = Math.floor(l.y * 14), col = Math.floor((Math.atan2(l.x - top.x, -(l.z - top.z)) * 4.5) + (fila % 2) * 0.5);
          const h = Math.abs(Math.sin(fila * 12.9898 + col * 78.233) * 43758.5453) % 1;
          c.copy(colorDe(['#8a5a22', '#a8742a', '#6b4a1e', '#7a6a2a', '#5e6a2a', '#9a4a22'][Math.floor(h * 5.99)]));
          const fy = l.y * 14 - fila, fx = (Math.atan2(l.x - top.x, -(l.z - top.z)) * 4.5 + (fila % 2) * 0.5) % 1;
          c.multiplyScalar(0.6 + 0.5 * sv(0, 0.5, fy) * (1 - 0.35 * sv(0.4, 0.5, 1 - Math.abs(fx - 0.5))) );
        }
        if (cp.musgo) tinta(c, '#4e6a2a', cp.musgo * sv(0.0, 0.7, ruido(l.x * 7 + 4, l.y * 5, l.z * 7)) * 0.8);
        if (cp.tipo === 'musgo') { c.multiplyScalar(0.75 + 0.35 * (ruido(l.x * 30, l.y * 30, l.z * 30) * 0.5 + 0.5)); }
      },
      guarda: cp.guarda ? (l) => [cp.guarda[0], (l.y - (top.y - alto)) + 0.0, l.x * 2, cp.guarda[1]] : null,
    }));
    // los bultos del musgo sobre los hombros (y las hojas sueltas)
    if (cp.tipo === 'musgo') for (let i = 0; i < 9; i++) {
      const a = (i / 8 - 0.5) * 3.2, rad = 0.2;
      const gm = deform(esfera(10, 8), (v) => { v.multiplyScalar(1 + 0.25 * ruido(v.x * 5 + i, v.y * 5, v.z * 5)); });
      piezas.push(pieza(gm, M4([Math.sin(a) * rad * anchoT + top.x, top.y - 0.02 - r() * 0.08, -Math.cos(a) * rad * 0.9 + top.z], [0, 0, 0], [0.09, 0.05, 0.08]), '#4a6a2a', { tela: 5, pintar: (c, p, n, l) => c.multiplyScalar(0.7 + 0.4 * (ruido(l.x * 40, l.y * 40, l.z * 40) * 0.5 + 0.5)) }));
    }
  }
  // ---- las piernas y las botitas
  for (let s = 0; s < 2; s++) {
    const sx = s === 0 ? 1 : -1;
    const meta = pose.pies[s];
    const cad = pelvis.clone().add(V3(sx * 0.11 * anchoT, -0.03, 0).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, pose.gira || 0, 0))));
    const pie = V3(meta[0], meta[1] + 0.075, meta[2]);
    const l1 = (caderaY - 0.075) * 0.52, l2 = (caderaY - 0.075) * 0.5;
    const lp1 = sentado ? 0.36 : l1, lp2 = sentado ? 0.42 : l2;
    const rod = ik(cad, pie, lp1, lp2, V3(sx * 0.15, sentado ? 0.6 : 0, 1));
    const gp = C.gPierna;
    piezas.push(pieza(husoG([cad, cad.clone().lerp(rod, 0.5), rod, rod.clone().lerp(pie, 0.5), pie.clone().add(V3(0, 0.04, 0))], [0.1 * gp, 0.09 * gp, 0.078 * gp, 0.068 * gp, 0.066 * gp], 12, 10), null, P.ropa.pantalon, { tela: P.ropa.telaPant, faceta: F * 0.5, pintar: (c, p, n, l) => gastar(c, l) }));
    // la caña de la bota (más ancha arriba, con el doblez) y el pie con la punta enroscada
    const eje = rod.clone().sub(pie).normalize();
    const qb = quatDe(V3(0, 1, 0), eje);
    const gcb = lathe([[0.072, -0.02], [0.074, 0.06], [0.082, 0.1], [0.09, 0.13], [0.08, 0.14], [0.07, 0.13]], 14);
    deform(gcb, (v) => { v.x *= gp; v.z *= gp; });
    piezas.push(pieza(gcb, new THREE.Matrix4().compose(pie, qb, V3(1, 1, 1)), P.ropa.botas, { tela: 3, faceta: F * 0.6, ao: 0.85 }));
    const giro = meta[3] || 0, alzado = meta[4] || 0;
    const qp = new THREE.Quaternion().setFromEuler(new THREE.Euler(alzado, giro, 0, 'YXZ'));
    const largo = 1 + (P.k > 0.6 ? 0.15 : 0);
    const gpie = husoG([[0, -0.03, -0.07], [0, -0.03, 0.04 * largo], [0, -0.025, 0.14 * largo], [0, 0.02, 0.21 * largo], [0, 0.075, 0.22 * largo]], [0.06, 0.066, 0.052, 0.03, 0.008], 14, 10);
    deform(gpie, (v) => { if (v.y < -0.07) v.y = -0.07 + (v.y + 0.07) * 0.2; });
    piezas.push(pieza(gpie, new THREE.Matrix4().compose(pie, qp, V3(gp, 1, 1)), P.ropa.botas, { tela: 3, faceta: F * 0.6, pintar: (c, p, n, l) => { if (l.y < -0.055) c.multiplyScalar(0.55); } }));
  }
  // ---- los brazos y las manos
  const manos = [];
  for (let s = 0; s < 2; s++) {
    const sx = s === 0 ? 1 : -1;
    const hombro = enT(sx * 0.2 * anchoT, L - 0.06, -0.01);
    const meta = pose.manos[s];
    const mano = V3(meta[0] * (0.9 + 0.1 * anchoT), meta[1] * (sentado ? 1 : 1) + (sentado ? 0 : (C.cadera - 0.6) * 0.8), meta[2]);
    if (C.encorvado && !sentado) { mano.z += C.encorvado * 0.25; mano.y -= C.encorvado * 0.18; }
    const la = 0.27 * C.brazo, lb = 0.25 * C.brazo;
    // la mano no puede quedar más lejos que el brazo: se acerca
    const d = mano.clone().sub(hombro); if (d.length() > (la + lb) * 0.98) mano.copy(hombro).addScaledVector(d.normalize(), (la + lb) * 0.98);
    const codo = ik(hombro, mano, la, lb, V3(sx * 0.6, -0.3, -1));
    const gb = C.gBrazo;
    piezas.push(pieza(husoG([hombro.clone().add(V3(-sx * 0.03, 0.02, 0)), hombro.clone().lerp(codo, 0.5), codo, codo.clone().lerp(mano, 0.5), mano], [0.085 * gb, 0.075 * gb, 0.066 * gb, 0.064 * gb, 0.07 * gb], 12, 10), null, P.ropa.saco, { tela: P.ropa.tela, faceta: F * 0.6, pintar: (c, p, n, l) => gastar(c, l) }));
    // el puño de la manga, con su guarda
    const dirA = mano.clone().sub(codo).normalize();
    const gpu = lathe([[0.072, -0.03], [0.078, 0.0], [0.072, 0.02]], 12);
    piezas.push(pieza(gpu, new THREE.Matrix4().compose(mano.clone().addScaledVector(dirA, -0.02), quatDe(V3(0, 1, 0), dirA), V3(gb, 1, gb)), P.ropa.cinto === '#3e2a1c' ? P.gorro.puno : P.gorro.puno, { tela: 1, guarda: (l) => [P.gorro.guarda[0], l.y + 0.03, Math.atan2(l.x, l.z) * 0.075, 0.05] }));
    manos.push({ p: mano.clone().addScaledVector(dirA, 0.02), dir: dirA, sx });
    // la mano: palma y dedos (nudosos en los viejos); en la figura "colgando" a lo largo de dirA
    const mh = P.manos, gd = mh.dedos, nud = mh.nudosas;
    const piezasMano = [];
    piezasMano.push([deform(esfera(12, 9), () => {}), M4([0, -0.045, 0], [0, 0, 0], [0.05, 0.06, 0.03])]);
    const garra = pose.garra ? 1 : 0, cerrada = pose.foco && s === (pose.foco === 'farol' ? 0 : 9) ? 1 : 0;
    for (let f = 0; f < 4; f++) {
      const x = (f - 1.5) * 0.022, lf = (0.055 + (f === 1 || f === 2 ? 0.012 : 0)) * gd;
      const curva = garra ? 0.5 : cerrada ? 1.2 : 0.25 + 0.1 * f;
      const pts = [[x, -0.08, 0.0], [x * 1.1, -0.08 - lf * 0.45, curva * 0.02], [x * 1.15, -0.08 - lf * 0.85, curva * 0.045], [x * 1.18, -0.08 - lf * 1.05 + curva * 0.015, curva * 0.07]];
      const rd = nud ? [0.014, 0.018 * (1 + 0.2 * nud), 0.012, 0.015 * (1 + 0.2 * nud), 0.007] : [0.015, 0.014, 0.013, 0.012, 0.009];
      piezasMano.push([husoG(pts, rd.slice(0, 4), 8, 7), null]);
      if (mh.uñas || nud > 0.5) piezasMano.push([deform(esfera(6, 5), () => {}), M4(pts[3], [0, 0, 0], [0.008, 0.012, 0.006])]);
    }
    piezasMano.push([husoG([[sx * 0.03, -0.03, 0.015], [sx * 0.05, -0.06, 0.035], [sx * 0.05, -0.09, 0.05]], [0.016, 0.015, 0.01], 8, 7), null]);
    // de la mano local (colgando en -y, la palma hacia adentro) a la figura
    const Mm = new THREE.Matrix4().compose(mano, quatDe(V3(0, -1, 0), dirA).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sx * Math.PI / 2, 0))), V3(1, 1, 1));
    for (const [g, Ml] of piezasMano) {
      if (Ml) g.applyMatrix4(Ml);
      piezas.push(pieza(g, Mm, piel.col, { piel: 1, faceta: F * 0.4, pintar: pintaPiel }));
    }
  }
  // ---- la cabeza: centro, giro (torso + cabeza)
  const cuello = enT(0, L + 0.04, 0.02);
  const Qc = Qt.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pose.cabeza[0] - (sentado ? 0 : C.encorvado * 0.95), pose.cabeza[1], pose.cabeza[2], 'YXZ')));
  const cc = cuello.clone().add(V3(0, R * 0.92, R * 0.12).applyQuaternion(Qc));
  const Mc = new THREE.Matrix4().compose(cc, Qc, V3(1, 1, 1));
  const [ex, ey, ez] = P.cabEsc;
  const boca = pose.boca || P.boca, parpado = Math.max(P.ojos.parpado, pose.parpado || 0);
  const ojoP = (sx) => V3(sx * 0.37 * R * ex, 0.12 * R * ey, 0.8 * R * ez);
  // el cráneo: un huevo con la mandíbula más ancha, la frente y los cachetes
  {
    const g = deform(esfera(30, 24), (v) => {
      const y = v.y;
      v.x *= R * ex * (1 + 0.08 * Math.exp(-(((y + 0.35) / 0.3) ** 2)));
      v.y *= R * ey * 1.02;
      v.z *= R * ez * (v.z < 0 ? 0.95 : 1);
      // la órbita de los ojos, apenas hundida, y la frente
      for (const sx of [-1, 1]) { const o = ojoP(sx), d2 = ((v.x - o.x) / (0.2 * R)) ** 2 + ((v.y - o.y) / (0.17 * R)) ** 2; if (v.z > 0) v.z -= 0.08 * R * Math.exp(-d2) * (1 + (P.ojos.brillo ? 0.6 : 0)); }
    });
    piezas.push(pieza(g, Mc, piel.col, {
      piel: 1, faceta: F,
      pintar: (c, p, n, l) => {
        pintaPiel(c, p, n, l);
        if (piel.mejillas) for (const sx of [-1, 1]) tinta(c, piel.mejillas, 0.4 * Math.exp(-(((l.x - sx * 0.48 * R) / (0.2 * R)) ** 2 + ((l.y + 0.18 * R) / (0.18 * R)) ** 2)) * (l.z > 0 ? 1 : 0));
        // las ojeras hondas (más en los viejos y en los oscuros)
        const hondo = P.ojos.brillo ? 0.55 : 0.18;
        for (const sx of [-1, 1]) { const o = ojoP(sx), d2 = ((l.x - o.x) / (0.24 * R)) ** 2 + ((l.y - o.y) / (0.2 * R)) ** 2; if (l.z > 0) c.multiplyScalar(1 - hondo * Math.exp(-d2)); }
      },
      ao: (p, n, l) => 1 - 0.4 * sv(0.3, -0.6, l.y / R) * (l.z < 0.5 * R ? 1 : 0.4),
    }));
  }
  // la nariz: de papa, ganchuda o larga
  {
    const nz = P.nariz, la = nz.largo, pu = nz.punta;
    let pts, rad;
    const k = la - 1;
    if (nz.forma === 'papa') { pts = [[0, 0.16 * R, 0.8 * R], [0, 0.02 * R, 1.08 * R + 0.15 * R * k], [0, -0.16 * R, 1.3 * R + 0.3 * R * k], [0, -0.26 * R, 1.26 * R + 0.3 * R * k]]; rad = [0.12 * R, 0.16 * R, 0.28 * R * pu, 0.22 * R * pu]; }
    else if (nz.forma === 'gancho') { pts = [[0, 0.2 * R, 0.82 * R], [0, 0.04 * R, 1.18 * R + 0.25 * R * k], [0, -0.24 * R, 1.48 * R + 0.4 * R * k], [0, -0.5 * R, 1.36 * R + 0.35 * R * k]]; rad = [0.12 * R, 0.15 * R, 0.17 * R * pu, 0.08 * R * pu]; }
    else { pts = [[0, 0.16 * R, 0.82 * R], [0, 0.0, 1.2 * R + 0.3 * R * k], [0, -0.14 * R, 1.55 * R + 0.55 * R * k], [0, -0.22 * R, 1.75 * R + 0.7 * R * k]]; rad = [0.11 * R, 0.13 * R, 0.1 * R * pu, 0.04 * R * pu]; }
    const g = husoG(pts, rad, 12, 12);
    piezas.push(pieza(g, Mc, piel.col, { piel: 1, faceta: F, pintar: (c, p, n, l) => { pintaPiel(c, p, n, l); tinta(c, P.piel.tipo === 'gris' ? '#7a6a5a' : '#c0604a', 0.35 * sv(0.9 * R, 1.25 * R, l.z)); } }));
    // las aletas
    for (const sx of [-1, 1]) piezas.push(pieza(deform(esfera(10, 8), () => {}), new THREE.Matrix4().multiplyMatrices(Mc, M4([sx * 0.11 * R * pu, -0.15 * R, pts[2][2] - 0.08 * R], [0, 0, 0], [0.09 * R * pu, 0.08 * R, 0.1 * R])), piel.col, { piel: 1, faceta: F, pintar: pintaPiel }));
  }
  // los cachetes (de cuento, redondos) y el mentón
  for (const sx of [-1, 1]) {
    const tam = P.piel.mejillas ? (P.cab > 0.24 ? 0.32 : 0.26) : 0.2;
    piezas.push(pieza(deform(esfera(14, 10), () => {}), new THREE.Matrix4().multiplyMatrices(Mc, M4([sx * 0.42 * R * ex, -0.18 * R, 0.62 * R * ez], [0, 0, 0], [tam * R, tam * 0.85 * R, tam * 0.8 * R])), piel.col, { piel: 1, faceta: F, pintar: (c, p, n, l) => { pintaPiel(c, p, n, l); if (piel.mejillas) tinta(c, piel.mejillas, 0.35); } }));
  }
  // la frente: el arco de las cejas, salido (más en los viejos)
  {
    const o = ojoP(1), fr = P.ojos.brillo ? 1.25 : 1;
    const pts = [[-0.62 * R * ex, o.y + 0.12 * R, 0.6 * R * ez], [-0.3 * R * ex, o.y + 0.2 * R, 0.86 * R * ez], [0, o.y + 0.16 * R, 0.9 * R * ez], [0.3 * R * ex, o.y + 0.2 * R, 0.86 * R * ez], [0.62 * R * ex, o.y + 0.12 * R, 0.6 * R * ez]];
    piezas.push(pieza(husoG(pts, [0.08 * R, 0.13 * R * fr, 0.1 * R, 0.13 * R * fr, 0.08 * R], 14, 10), Mc, piel.col, { piel: 1, faceta: F, pintar: pintaPiel }));
  }
  // los ojos: el blanco, el iris (o la brasa que brilla) y los párpados
  const ojosMundo = [];
  for (const sx of [-1, 1]) {
    const o = ojoP(sx), t = P.ojos.tam * 0.15 * R;
    const brilla = !!P.ojos.brillo;
    if (!brilla) {
      piezas.push(pieza(deform(esfera(12, 10), () => {}), new THREE.Matrix4().multiplyMatrices(Mc, M4([o.x, o.y, o.z], [0, 0, 0], [t, t, t * 0.8])), P.ojos.blanco, { ao: 0.9 }));
      piezas.push(pieza(deform(esfera(10, 8), () => {}), new THREE.Matrix4().multiplyMatrices(Mc, M4([o.x + sx * -0.02 * R, o.y - 0.01 * R, o.z + t * 0.62], [0, 0, 0], [t * 0.62, t * 0.66, t * 0.35])), P.ojos.iris, {}));
      // el brillito del ojo vivo
      brillos.push(pieza(deform(esfera(6, 5), () => {}), new THREE.Matrix4().multiplyMatrices(Mc, M4([o.x + sx * 0.01 * R + 0.02 * R, o.y + 0.04 * R, o.z + t * 0.92], [0, 0, 0], [t * 0.17, t * 0.17, t * 0.1])), '#ffffff', { fuerza: 0.9 }));
    } else {
      // la cuenca honda y la brasa
      piezas.push(pieza(deform(esfera(12, 10), () => {}), new THREE.Matrix4().multiplyMatrices(Mc, M4([o.x, o.y, o.z - t * 0.1], [0, 0, 0], [t * 1.05, t * 0.95, t * 0.7])), '#1a120c', { ao: 0.3 }));
      brillos.push(pieza(deform(esfera(12, 10), () => {}), new THREE.Matrix4().multiplyMatrices(Mc, M4([o.x, o.y - 0.01 * R, o.z + t * 0.32], [0, 0, 0], [t * 0.8 * P.ojos.tam, t * 0.62, t * 0.42])), P.ojos.brillo, { fuerza: P.ojos.fuerza }));
      brillos.push(pieza(deform(esfera(8, 6), () => {}), new THREE.Matrix4().multiplyMatrices(Mc, M4([o.x, o.y - 0.01 * R, o.z + t * 0.62], [0, 0, 0], [t * 0.2, t * 0.42, t * 0.15])), '#100804', { fuerza: 1 }));
      ojosMundo.push(V3(o.x, o.y, o.z + t * 0.7).applyMatrix4(Mc));
    }
    // el párpado de arriba: una media esfera que baja (pícaro) y se ladea
    const gl = new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2);
    const cierra = -0.6 + parpado * 0.9;
    piezas.push(pieza(gl, new THREE.Matrix4().multiplyMatrices(Mc, M4([o.x, o.y, o.z], [cierra, 0, -sx * (0.22 + (P.cejas.angulo > 0 ? 0.15 : -0.2))], [t * 1.12, t * 1.12, t * 0.95])), piel.col, { piel: 1, faceta: F, pintar: (c, p, n, l) => { pintaPiel(c, p, n, l); c.multiplyScalar(0.92); } }));
    // el de abajo (en la risa sube: los ojos achinados)
    const gli = new THREE.SphereGeometry(1, 12, 6, 0, TAU, Math.PI / 2, Math.PI / 2);
    piezas.push(pieza(gli, new THREE.Matrix4().multiplyMatrices(Mc, M4([o.x, o.y, o.z], [boca === 'risa' ? -0.05 : 0.35, 0, 0], [t * 1.1, t * 1.1, t * 0.95])), piel.col, { piel: 1, faceta: F, pintar: pintaPiel }));
    // la ceja: un mechón tupido, levantado afuera (pícaro) o fruncido (viejo)
    const ang = P.cejas.angulo, gr = P.cejas.grosor;
    const pc = [[sx * 0.12 * R * ex, o.y + 0.22 * R - ang * 0.08 * R, 1.0 * R * ez], [sx * 0.34 * R * ex, o.y + 0.3 * R, 0.98 * R * ez], [sx * 0.58 * R * ex, o.y + 0.27 * R + ang * 0.14 * R, 0.72 * R * ez]];
    piezas.push(pieza(husoG(pc, [0.05 * R * gr, 0.07 * R * gr, 0.05 * R * gr], 8, 8), Mc, P.cejas.col, { tela: 6, hebra: (l) => [l.y * 3, l.x * 2] }));
  }
  // la boca
  {
    const yb = -0.42 * R, zb = 0.86 * R * ez;
    if (boca === 'risa') {
      piezas.push(pieza(deform(esfera(14, 10), (v) => { if (v.y > 0) v.y *= 0.4; }), new THREE.Matrix4().multiplyMatrices(Mc, M4([0, yb - 0.02 * R, zb - 0.02 * R], [-0.2, 0, 0], [0.3 * R, 0.17 * R, 0.14 * R])), '#2a120e', { ao: 0.2 }));
      piezas.push(pieza(deform(esfera(10, 6), () => {}), new THREE.Matrix4().multiplyMatrices(Mc, M4([0, yb - 0.1 * R, zb + 0.02 * R], [0, 0, 0], [0.17 * R, 0.06 * R, 0.08 * R])), '#a8484a', { ao: 0.5 }));
      piezas.push(pieza(new THREE.BoxGeometry(0.42 * R, 0.07 * R, 0.06 * R), new THREE.Matrix4().multiplyMatrices(Mc, M4([0, yb + 0.07 * R, zb + 0.06 * R], [0.2, 0, 0])), '#e8dcc0', { ao: 0.8 }));
    } else {
      const sonr = boca === 'mueca' ? -0.06 : boca === 'seria' ? 0 : 0.12;
      const pts = [[-0.34 * R, yb + sonr * R + (boca === 'mueca' ? 0 : 0.04 * R), zb - 0.12 * R], [-0.15 * R, yb - 0.02 * R, zb + 0.01 * R], [0.15 * R, yb - 0.02 * R + (boca === 'mueca' ? 0.04 * R : 0), zb + 0.01 * R], [0.36 * R, yb + sonr * R * 1.4 + 0.05 * R, zb - 0.12 * R]];
      piezas.push(pieza(husoG(pts, [0.03 * R, 0.045 * R, 0.045 * R, 0.03 * R], 10, 8), Mc, '#3a1a14', { ao: 0.4 }));
      piezas.push(pieza(husoG(pts.map((p) => [p[0] * 0.92, p[1] - 0.07 * R, p[2] - 0.01 * R]), [0.04 * R, 0.07 * R, 0.07 * R, 0.04 * R], 10, 8), Mc, piel.col, { piel: 1, faceta: F, pintar: (c, p, n, l) => { pintaPiel(c, p, n, l); tinta(c, '#9a5048', 0.25); } }));
      if (boca === 'dientes' || P.dientes) for (let i = -2; i <= 2; i++) {
        const gd = new THREE.ConeGeometry(0.035 * R, 0.1 * R, 5);
        piezas.push(pieza(gd, new THREE.Matrix4().multiplyMatrices(Mc, M4([i * 0.09 * R, yb - 0.005 * R + Math.abs(i) * 0.02 * R, zb + 0.02 * R - Math.abs(i) * 0.03 * R], [Math.PI, 0, 0])), '#d8ccb0', { ao: 0.8 }));
      }
    }
  }
  // las orejas puntiagudas: chatas, con la concha más oscura
  for (const sx of [-1, 1]) {
    const o = P.orejas, la = o.largo, an = o.ancho;
    const pts = [[0, 0, 0], [0.02 * R, 0.35 * R * la, 0], [0, 0.75 * R * la, 0], [-0.08 * R, 1.15 * R * la, 0]];
    const g = deform(husoG(pts, [0.2 * R * an, 0.24 * R * an, 0.13 * R * an, 0.015 * R], 10, 9), (v) => { v.z *= 0.32; });
    const Mo = new THREE.Matrix4().multiplyMatrices(Mc, M4([sx * 0.9 * R * ex, 0.0, -0.05 * R], [0, sx * 0.35, -sx * o.abre]));
    piezas.push(pieza(g, Mo, piel.col, { piel: 1, faceta: F, pintar: (c, p, n, l) => { pintaPiel(c, p, n, l); if (piel.tipo !== 'corteza') tinta(c, '#b06a5a', 0.15); } }));
    const gi = deform(husoG(pts.map((p) => [p[0], p[1] * 0.85 + 0.06 * R, 0.035 * R]), [0.1 * R * an, 0.14 * R * an, 0.07 * R * an, 0.01 * R], 8, 8), (v) => { v.z = 0.035 * R + (v.z - 0.035 * R) * 0.25; });
    piezas.push(pieza(gi, Mo, piel.col, { piel: 1, ao: 0.6, pintar: (c, p, n, l) => { pintaPiel(c, p, n, l); c.multiplyScalar(0.7); } }));
  }
  // el pelo que asoma bajo el gorro (mechones)
  for (let i = 0; i < P.pelo.mechones; i++) {
    const a = (i / Math.max(1, P.pelo.mechones - 1) - 0.5) * 3.4 + Math.PI;
    const b0 = [Math.sin(a) * 0.85 * R, 0.25 * R, Math.cos(a) * 0.85 * R];
    const b1 = [Math.sin(a) * 1.05 * R, 0.05 * R - r() * 0.15 * R, Math.cos(a) * 1.0 * R];
    const b2 = [Math.sin(a) * 1.15 * R, -0.15 * R - r() * 0.2 * R, Math.cos(a) * 1.08 * R];
    piezas.push(pieza(husoG([b0, b1, b2], [0.12 * R, 0.09 * R, 0.02 * R], 8, 7), Mc, P.pelo.col, { tela: 6, hebra: (l) => [Math.atan2(l.x, l.z) * R, l.y] }));
  }
  // la barba y el bigote
  if (P.barba) {
    const b = P.barba, tela = b.liquen ? 6 : 8 + 0.4 * (b.canas || 0);
    const pinta = (c, p, n, l) => {
      c.multiplyScalar(0.85 + 0.25 * Math.abs(Math.sin(l.x * 160 + 4 * ruido(l.x * 9, l.y * 4, l.z * 9))));
      if (b.musgo) tinta(c, '#5a7a3a', b.musgo * sv(0.1, 0.8, ruido(l.x * 12, l.y * 8 + 3, l.z * 12)));
      if (b.liquen) tinta(c, '#d8dcc0', 0.3 * sv(0.3, 0.9, ruido(l.x * 25, l.y * 25, l.z * 25)));
    };
    const heb = (l) => [l.x * 1.2 + l.z * 0.4, l.y];
    if (b.tipo === 'corta') {
      const g = deform(esfera(16, 12), (v) => { v.multiplyScalar(1 + 0.12 * ruido(v.x * 6, v.y * 6, v.z * 6)); if (v.y < 0) v.y *= 1.2; });
      piezas.push(pieza(g, new THREE.Matrix4().multiplyMatrices(Mc, M4([0, -0.52 * R, 0.42 * R], [0.2, 0, 0], [0.62 * R * ex * b.largo, 0.44 * R * b.largo, 0.48 * R])), b.col, { tela, hebra: heb, pintar: pinta }));
    } else if (b.tipo === 'chiva') {
      piezas.push(pieza(husoG([[0, -0.5 * R, 0.62 * R], [0, -0.75 * R, 0.7 * R], [0, -1.0 * R * b.largo, 0.62 * R]], [0.18 * R, 0.14 * R, 0.02 * R], 10, 9), Mc, b.col, { tela, hebra: heb, pintar: pinta }));
    } else {
      // la larga: una cortina que cae del mentón y la quijada, ondulada, con mechones sueltos
      const lb = b.largo;
      const g = grilla((u, v, p, cara) => {
        const a = (u - 0.5) * 2.6;
        const y = -0.2 * R - v * 2.4 * R * lb;
        const ancho = (0.85 - 0.55 * v ** 1.4) * R * ex;
        const z0 = Math.cos(a) * ancho * 0.7 + 0.25 * R + v * 0.35 * R;
        p.set(Math.sin(a) * ancho + 0.04 * R * Math.sin(v * 9 + u * 7), y + (v > 0.85 ? 0.12 * R * Math.sin(u * 19) : 0), z0 - (cara ? 0.07 * R : 0) + 0.03 * R * Math.sin(u * 23 + v * 5));
      }, 16, 14, 1);
      piezas.push(pieza(g, Mc, b.col, { tela, hebra: heb, pintar: pinta }));
      for (let i = 0; i < 7; i++) {
        const u = (i / 6 - 0.5) * 2.2, x = Math.sin(u) * 0.6 * R;
        piezas.push(pieza(husoG([[x, -0.3 * R, Math.cos(u) * 0.62 * R + 0.2 * R], [x * 1.05, -1.2 * R * lb, 0.75 * R], [x * 0.8 + (r() - 0.5) * 0.2 * R, -(2.2 + r() * 0.4) * R * lb, 0.62 * R]], [0.12 * R, 0.1 * R, 0.015 * R], 10, 7), Mc, b.col, { tela, hebra: heb, pintar: pinta }));
      }
    }
    if (P.bigote) for (const sx of [-1, 1]) piezas.push(pieza(husoG([[sx * 0.02 * R, -0.25 * R, 1.0 * R], [sx * 0.25 * R, -0.33 * R, 0.9 * R], [sx * 0.45 * R, -0.55 * R, 0.72 * R]], [0.08 * R, 0.09 * R, 0.02 * R], 9, 8), Mc, P.bigote.col, { tela, hebra: heb, pintar: pinta }));
  }
  // sin gorro (los reyes): el pelo, un casquete y la melena de atrás
  if (P.gorro.sin) {
    const gh = deform(new THREE.SphereGeometry(1, 24, 12, 0, TAU, 0, Math.PI * 0.58), (v) => { v.multiplyScalar(1 + 0.04 * ruido(v.x * 9, v.y * 9, v.z * 9)); });
    piezas.push(pieza(gh, new THREE.Matrix4().multiplyMatrices(Mc, M4([0, 0.02 * R, -0.04 * R], [-0.35, 0, 0], [R * ex * 1.05, R * ey * 1.06, R * ez * 1.04])), P.pelo.col, { tela: 17 + 0.4 * (P.pelo.canas || 0), hebra: (l) => [Math.atan2(l.x, l.z) * 0.6, l.y] }));
    for (let i = 0; i < 9; i++) {
      const a = (i / 8 - 0.5) * 3.0 + Math.PI;
      piezas.push(pieza(husoG([[Math.sin(a) * 0.9 * R, 0.3 * R, Math.cos(a) * 0.9 * R], [Math.sin(a) * 1.08 * R, -0.3 * R, Math.cos(a) * 1.05 * R], [Math.sin(a) * 1.1 * R, -1.0 * R - r() * 0.3 * R, Math.cos(a) * 1.0 * R - 0.1 * R]], [0.14 * R, 0.12 * R, 0.03 * R], 10, 8), Mc, P.pelo.col, { tela: 17 + 0.4 * (P.pelo.canas || 0), hebra: (l) => [Math.atan2(l.x, l.z) * R, l.y] }));
    }
  }
  // el gorro en punta: el puño de lana con la guarda y el cono de fieltro que cae
  if (!P.gorro.sin) {
    const G = P.gorro, rr = 1.02 * R * Math.max(ex, ez), alto = G.alto * R, y0 = 0.22 * R;
    const perf = afinar([[rr, 0], [rr * 0.99, alto * 0.08], [rr * 0.9, alto * 0.25], [rr * 0.68, alto * 0.48], [rr * 0.4, alto * 0.72], [rr * 0.15, alto * 0.92], [0.001, alto]], 4);
    const g = lathe(perf, 24);
    deform(g, (v) => {
      const t = v.y / alto;
      // arrugas del fieltro, y la punta que cae hacia atrás (y un poco al costado)
      const rad = 1 + 0.06 * Math.sin(v.y * 40 / R + Math.atan2(v.x, v.z) * 2) * sv(0.1, 0.5, t);
      v.x *= rad; v.z *= rad;
      const caida = G.caida * sv(0.25, 1, t) ** 1.6;
      v.x += caida * alto * 0.42; v.z -= caida * alto * 0.12; v.y -= caida * alto * 0.3 * t;
    });
    const Mg = new THREE.Matrix4().multiplyMatrices(Mc, M4([0, y0, -0.06 * R], [-0.12, 0, 0.06]));
    piezas.push(pieza(g, Mg, G.col, {
      tela: G.tela, faceta: F * 0.8,
      pintar: (c, p, n, l) => {
        gastar(c, l); c.multiplyScalar(0.9 + 0.15 * ruido(l.x * 8, l.y * 6, l.z * 8));
        if (G.musgo) tinta(c, '#4e6a2a', G.musgo * sv(0.15, 0.8, ruido(l.x * 9 + 2, l.y * 9, l.z * 9)) * sv(0.3, 0.9, n.y + 0.4));
      },
    }));
    const gp = lathe([[rr * 0.98, -0.02 * R], [rr * 1.08, 0.02 * R], [rr * 1.1, 0.12 * R], [rr * 1.06, 0.2 * R], [rr * 0.97, 0.22 * R]], 24);
    piezas.push(pieza(gp, Mg, G.puno, { tela: 1, faceta: F * 0.5, guarda: (l) => [G.guarda[0], l.y + 0.02 * R, Math.atan2(l.x, l.z) * rr, 0.24 * R], pintar: (c, p, n, l) => gastar(c, l) }));
    // los hongos (pan de indio y de sombrero) en el gorro
    for (let i = 0; i < G.hongos; i++) {
      const t = 0.15 + r() * 0.35, a = (r() - 0.5) * 2.4 + (i % 2 ? 1.2 : -1.2);
      const rad = (rr * (1 - t * 0.9));
      const base = V3(Math.sin(a) * rad, alto * t, Math.cos(a) * rad).applyMatrix4(Mg);
      const tam = (0.05 + r() * 0.05) * R / 0.2;
      if (i % 3 === 0) {
        // pan de indio: bola naranja con hoyitos, que de noche brilla
        piezas.push(pieza(deform(esfera(10, 8), () => {}), M4(base, [0, 0, 0], [tam * 0.45, tam * 0.45, tam * 0.45]), '#e09a3a', { pintar: (c, p, n, l) => { if (Math.sin(l.x * 60) * Math.sin(l.y * 60) * Math.sin(l.z * 60) > 0.25) c.multiplyScalar(0.6); } }));
        brillos.push(pieza(deform(esfera(8, 6), () => {}), M4(base, [0, 0, 0], [tam * 0.3, tam * 0.3, tam * 0.3]), '#ffb84a', { fuerza: 0.55 }));
      } else {
        const ga = lathe([[0.001, 0], [0.18, 0], [0.18, 0.5], [0.5, 0.55], [0.6, 0.7], [0.4, 0.9], [0.001, 0.95]], 10);
        piezas.push(pieza(ga, M4(base, [0, 0, (r() - 0.5) * 0.6], [tam, tam, tam]), '#d8c8a4', { pintar: (c, p, n, l) => { if (l.y > 0.52) c.copy(colorDe(i % 2 ? '#a0522d' : '#c8a464')).multiplyScalar(n.y > 0.3 ? 1 : 0.7); } }));
      }
    }
  }
  // ---- lo que lleva en las manos
  if (pose.foco === 'queso' && manos.length) {
    const c0 = manos[0].p.clone().lerp(manos[1].p, 0.5).add(V3(0, -0.02, 0.06));
    const g = lathe([[0.001, -0.06], [0.15, -0.06], [0.17, -0.03], [0.17, 0.03], [0.15, 0.06], [0.001, 0.06]], 24, 0.4, TAU - 0.8);
    piezas.push(pieza(g, M4(c0, [1.2, 0.2, 0.3]), '#e8c860', { tela: 4, pintar: (c, p, n, l) => { if (Math.hypot(l.x, l.z) > 0.155) c.copy(colorDe('#c8862a')); if (Math.sin(l.x * 90) * Math.sin(l.z * 80) > 0.85) c.multiplyScalar(0.75); } }));
  }
  if (pose.foco === 'farol' && manos.length) {
    const m = manos[0];
    const c0 = m.p.clone().add(V3(0, -0.18, 0.02));
    piezas.push(pieza(husoG([m.p, c0.clone().add(V3(0, 0.09, 0))], [0.008, 0.008], 4, 5), null, '#3a2a1c'));
    piezas.push(pieza(deform(esfera(10, 8), () => {}), M4(c0.clone().add(V3(0, 0.08, 0)), [0, 0, 0], [0.06, 0.03, 0.06]), '#3a2a1c', { tela: 3 }));
    brillos.push(pieza(deform(esfera(12, 10), (v) => { v.y *= 1.2; }), M4(c0, [0, 0, 0], [0.075, 0.075, 0.075]), '#ffb84a', { fuerza: 1.6 }));
    halos.push({ p: c0.clone(), col: '#ffb84a', tam: 1.4 });
  }
  const cuerpo = fundir(piezas, materialGente());
  const brillo = fundirBrillo(brillos);
  const g = new THREE.Group();
  g.add(cuerpo); if (brillo) g.add(brillo);
  g.scale.setScalar(P.k);
  g.userData.ojos = ojosMundo.map((o) => o.multiplyScalar(P.k));
  g.userData.brilloOjos = P.ojos.brillo;
  g.userData.haloOjos = P.ojos.halo;
  g.userData.halos = halos.map((h) => ({ ...h, p: h.p.multiplyScalar(P.k) }));
  g.userData.manos = manos.map((m) => m.p.clone().multiplyScalar(P.k));
  g.userData.cabeza = cc.clone().multiplyScalar(P.k); g.userData.cabR = R * P.k;
  return g;
}

// ---------------------------------------------------------------- las piezas del mundo
// raíces y troncos: un huso con corteza (en metros)
function raiz(pts, rad, col = '#4a3a2c', o = {}) {
  const g = husoG(pts, rad, o.tramos || 16, o.lados || 9);
  if (o.nudos) deform(g, (v) => { v.addScaledVector(V3(ruido(v.x * 3, v.y * 3, v.z * 3), ruido(v.y * 3 + 1, v.z * 3, v.x * 3), ruido(v.z * 3 + 2, v.x * 3, v.y * 3)), o.nudos); });
  return pieza(g, o.M || null, col, { veta: (l) => [Math.atan2(l.x - pts[0][0], l.z - pts[0][2]) * 0.3 + l.x * 0.5, l.y + l.x * 0.3 + l.z * 0.3, 0.8], pintar: o.pintar });
}
const musgoEn = (c, p, n, k = 1, s = 1) => tinta(c, '#4e6a2a', k * sv(0.15, 0.7, n.y + 0.25 * ruido(p.x * 3 * s, p.y * 3 * s, p.z * 3 * s)) * 0.85);
// el trono de raíces (en metros, el asiento a 0,9 m)
function trono(piezas, brillos, o = {}) {
  const r = azar(77);
  const col = '#5a4232';
  // el asiento: un tocón ancho y chato
  const g = deform(lathe(afinar([[1.0, 0], [0.95, 0.4], [0.9, 0.75], [0.85, 0.88], [0.6, 0.92], [0.001, 0.93]], 3), 28), (v) => { const a = Math.atan2(v.x, v.z); const k = 1 + 0.08 * Math.sin(a * 7) + 0.05 * ruido(v.x * 3, v.y * 3, v.z * 3); v.x *= k; v.z *= k * 0.85; });
  piezas.push(pieza(g, null, col, { veta: (l) => [Math.atan2(l.x, l.z) * 0.9, l.y, l.y > 0.88 ? 0.2 : 1], pintar: (c, p, n) => { if (n.y > 0.8) c.copy(colorDe('#8a6a4a')); musgoEn(c, p, n, 0.4); } }));
  // el respaldo: raíces que suben, se trenzan y se abren en abanico arriba
  for (let i = 0; i < 9; i++) {
    const a = (i / 8 - 0.5) * 2.4;
    const x0 = Math.sin(a) * 0.85, z0 = -Math.cos(a) * 0.65;
    const h = 2.6 + (1 - Math.abs(i / 8 - 0.5) * 2) * 1.2 + r() * 0.3;
    const pts = [[x0 * 1.3, 0, z0 * 1.3 - 0.1], [x0, 0.9, z0 - 0.05], [x0 * 0.9 + (r() - 0.5) * 0.2, 1.7, z0 - 0.1], [x0 * 1.15, h * 0.85, z0 - 0.25], [x0 * 1.5, h, z0 - 0.15 + (r() - 0.5) * 0.3]];
    piezas.push(raiz(pts, [0.2, 0.16, 0.13, 0.08, 0.02], i % 2 ? '#4a3626' : col, { nudos: 0.04, pintar: (c, p, n) => musgoEn(c, p, n, 0.5) }));
  }
  // los brazos: raíces que se enroscan en una espiral
  for (const sx of [-1, 1]) {
    const pts = [[sx * 0.95, 0, 0.1], [sx * 0.95, 0.9, -0.3], [sx * 0.9, 1.25, 0.1], [sx * 0.88, 1.3, 0.6], [sx * 0.86, 1.15, 0.82], [sx * 0.84, 1.0, 0.7], [sx * 0.84, 1.08, 0.58]];
    piezas.push(raiz(pts, [0.2, 0.18, 0.15, 0.13, 0.1, 0.07, 0.04], col, { nudos: 0.02, tramos: 22 }));
  }
  // raíces del pie, que se meten en el piso
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.3;
    piezas.push(raiz([[Math.sin(a) * 0.7, 0.4, Math.cos(a) * 0.6], [Math.sin(a) * 1.3, 0.15, Math.cos(a) * 1.1], [Math.sin(a) * 1.9, -0.1, Math.cos(a) * 1.6]], [0.18, 0.12, 0.05], '#4a3626', { nudos: 0.03, pintar: (c, p, n) => musgoEn(c, p, n, 0.7) }));
  }
  // y unos panes de indio que brillan en el respaldo
  if (o.hongos !== false) for (let i = 0; i < 5; i++) {
    const a = (i / 4 - 0.5) * 2.0, p = V3(Math.sin(a) * 0.95, 1.9 + r() * 1.4, -Math.cos(a) * 0.75 - 0.15);
    piezas.push(pieza(deform(esfera(10, 8), () => {}), M4(p, [0, 0, 0], [0.09, 0.09, 0.09]), '#e09a3a'));
    brillos.push(pieza(deform(esfera(8, 6), () => {}), M4(p.clone().add(V3(0, 0, 0.03)), [0, 0, 0], [0.075, 0.075, 0.075]), '#ffb84a', { fuerza: 1.1 }));
  }
}

// ---------------------------------------------------------------- el Rey Duende (3 opciones)
// 1: viejo y sabio con corona de ramas; 2: gigante de corteza con cuernos de ámbar; 3: flaco y astuto
// con capa de hojas y bastón. En su trono de raíces; `k` del Rey ≈ 1,6 (sentado, unos 2,3 m).
export function armarRey(n = 1) {
  const g = new THREE.Group();
  const piezas = [], brillos = [];
  trono(piezas, brillos);
  const tr = fundirCorteza(piezas);
  g.add(tr);
  const b0 = fundirBrillo(brillos); if (b0) g.add(b0);
  let P;
  if (n === 1) P = mezclar(BASE, {
    k: 1.75, cab: 0.21, piel: { col: '#b08a6a', tipo: 'lisa', mejillas: '#a05a4a', ruido: 0.07 },
    nariz: { largo: 1.25, punta: 1.2, forma: 'papa' }, orejas: { largo: 1.35 },
    ojos: { brillo: '#ffc85a', fuerza: 2.4, parpado: 0.55, halo: 0.8 }, cejas: { col: '#e8e4da', grosor: 2.2, angulo: 0.0 }, boca: 'seria',
    gorro: { sin: 1 }, pelo: { col: '#e8e4da', mechones: 0, canas: 0 },
    barba: { tipo: 'larga', col: '#e8e4da', largo: 1.6, canas: 0.2 }, bigote: { col: '#e8e4da' },
    cuerpo: { torso: 0.56, panza: 0.12, ancho: 1.12, brazo: 1.1 },
    ropa: { saco: '#6a2e2a', tela: 15, guardaSaco: [5, 0.12], pantalon: '#3a2a22', botas: '#2a1c12', remiendos: [], largo: 0.3, hebilla: '#d0a040' },
    capa: { tipo: 'lana', col: '#4a2a26', guarda: [3, 0.14] }, manos: { nudosas: 0.7, dedos: 1.2 },
  });
  else if (n === 2) P = mezclar(BASE, {
    k: 2.05, cab: 0.2, cabEsc: [1.05, 1.0, 1.0], piel: { col: '#7a6450', tipo: 'corteza', mejillas: null, ruido: 0.08 },
    nariz: { largo: 1.2, punta: 1.3, forma: 'papa' }, orejas: { largo: 1.1, ancho: 1.3 },
    ojos: { brillo: '#ffb030', fuerza: 3.2, parpado: 0.4, halo: 1.2 }, cejas: { col: '#4a3a2a', grosor: 2.4, angulo: -0.3 }, boca: 'mueca',
    gorro: { sin: 1 }, pelo: { col: '#4a5a32', mechones: 0 },
    barba: { tipo: 'larga', col: '#7a8a5a', largo: 1.1, liquen: 1, musgo: 0.6 }, bigote: null,
    cuerpo: { torso: 0.58, panza: 0.16, ancho: 1.35, brazo: 1.15, gBrazo: 1.5, gPierna: 1.4 },
    ropa: { saco: '#4a3a2a', tela: 3, guardaSaco: [11, 0.1], pantalon: '#3a2e22', botas: '#2a2016', remiendos: [], largo: 0.25 },
    capa: { tipo: 'musgo', col: '#3e5a2a', musgo: 1 }, manos: { nudosas: 1, dedos: 1.3 },
  });
  else P = mezclar(BASE, {
    k: 1.8, cab: 0.18, cabEsc: [0.85, 1.25, 0.95], piel: { col: '#8a8a70', tipo: 'gris', mejillas: null, ruido: 0.07 },
    nariz: { largo: 1.8, punta: 0.85, forma: 'larga' }, orejas: { largo: 1.7, ancho: 0.85, abre: 1.3 },
    ojos: { brillo: '#c8ff5a', fuerza: 2.8, parpado: 0.6, halo: 0.9 }, cejas: { col: '#3a3028', grosor: 1.3, angulo: 0.5 }, boca: 'sonrisa',
    gorro: { alto: 3.4, caida: 1.4, col: '#3a2a1a', puno: '#6b4a1e', guarda: [3, 1] },
    barba: { tipo: 'chiva', col: '#5a5048', largo: 1.6 }, pelo: { col: '#2a2420', mechones: 4 },
    cuerpo: { torso: 0.6, panza: -0.06, ancho: 0.8, brazo: 1.3, gBrazo: 0.7, gPierna: 0.72 },
    ropa: { saco: '#3a3226', tela: 1, guardaSaco: [3, 0.08], pantalon: '#2a241c', botas: '#1e1810', remiendos: [], largo: 0.3 },
    capa: { tipo: 'hojas', col: '#8a5a22', envuelve: 1 }, manos: { nudosas: 1, dedos: 1.6 },
  });
  const d = armarDuende(P, n === 3 ? 'bastón' : 'trono', 31 + n);
  // sentado en el trono (el asiento a 0,93 m; la pelvis del duende a 0,5 × k)
  d.position.set(0, 0.93 - 0.5 * P.k + 0.06, 0.15);
  g.add(d);
  const piezas2 = [], brillos2 = [];
  const cab = d.userData;
  // la cabeza del rey, en el grupo: la busco por la escala (cráneo a ~1,4 en escala de persona)
  const yc = d.position.y + d.userData.cabeza.y, zc = d.position.z + d.userData.cabeza.z;
  if (n === 1) {
    // la corona de ramas: un aro trenzado de ramitas que suben y se abren, con hojitas y un pan de indio
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * TAU, rad = 0.2 * P.k;
      const x = Math.sin(a) * rad, z = Math.cos(a) * rad * 0.95;
      const h = (0.22 + 0.12 * ((i * 7) % 3)) * P.k;
      piezas2.push(raiz([[x, yc + 0.17 * P.k, zc + z], [x * 1.2, yc + 0.17 * P.k + h * 0.5, zc + z * 1.2], [x * 1.5 + 0.02, yc + 0.17 * P.k + h, zc + z * 1.5]], [0.025, 0.018, 0.004].map((v) => v * P.k), '#6a4a2c', { nudos: 0.01 }));
    }
    piezas2.push(pieza(new THREE.TorusGeometry(0.205 * P.k, 0.03 * P.k, 8, 32), M4([0, yc + 0.17 * P.k, zc], [Math.PI / 2, 0, 0], [1, 0.95, 1]), '#5a3a22', { veta: (l) => [Math.atan2(l.x, l.y), l.z * 4, 1] }));
    const p = V3(0, yc + 0.2 * P.k, zc + 0.21 * P.k);
    brillos2.push(pieza(deform(esfera(12, 10), () => {}), M4(p, [0, 0, 0], [0.05 * P.k, 0.06 * P.k, 0.04 * P.k]), '#ffb84a', { fuerza: 1.6 }));
    g.userData.halos = [{ p, col: '#ffb84a', tam: 1.4 }];
  } else if (n === 2) {
    // los cuernos de hueso con puntas de ámbar que brillan, y la corona de raíz
    for (const sx of [-1, 1]) {
      const pts = [[sx * 0.14 * P.k, yc + 0.12 * P.k, zc - 0.02 * P.k], [sx * 0.3 * P.k, yc + 0.3 * P.k, zc - 0.06 * P.k], [sx * 0.38 * P.k, yc + 0.5 * P.k, zc + 0.04 * P.k], [sx * 0.33 * P.k, yc + 0.66 * P.k, zc + 0.14 * P.k]];
      piezas2.push(pieza(husoG(pts, [0.06, 0.05, 0.035, 0.005].map((v) => v * P.k), 14, 9), null, '#d8c8a8', { veta: (l) => [Math.atan2(l.x, l.z) * 0.1, l.y * 3, 0.25], pintar: (c, p) => { if (Math.sin(p.y * 90) > 0.6) c.multiplyScalar(0.8); } }));
      const pa = V3(...pts[2]).lerp(V3(...pts[3]), 0.5);
      brillos2.push(pieza(husoG([pts[2], pts[3]], [0.04 * P.k, 0.008 * P.k], 8, 8), null, '#ff9a20', { fuerza: 2 }));
      (g.userData.halos ||= []).push({ p: pa, col: '#ff9a20', tam: 1.6 });
    }
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      piezas2.push(raiz([[Math.sin(a) * 0.19 * P.k, yc + 0.14 * P.k, zc + Math.cos(a) * 0.19 * P.k], [Math.sin(a + 0.4) * 0.22 * P.k, yc + 0.24 * P.k, zc + Math.cos(a + 0.4) * 0.22 * P.k], [Math.sin(a + 0.6) * 0.18 * P.k, yc + 0.3 * P.k, zc + Math.cos(a + 0.6) * 0.18 * P.k]], [0.03, 0.025, 0.006].map((v) => v * P.k), '#4a3626', { nudos: 0.01, pintar: (c, p, n) => musgoEn(c, p, n, 0.8) }));
    }
  } else {
    // el bastón torcido con la semilla dorada en la punta (en la mano derecha)
    const m = d.userData.manos[0].clone().add(d.position);
    const pts = [[m.x + 0.02, 0.0, m.z + 0.1], [m.x, m.y * 0.5, m.z + 0.04], [m.x - 0.02, m.y, m.z], [m.x + 0.05, m.y + 0.6, m.z - 0.05], [m.x - 0.05, m.y + 0.85, m.z]];
    piezas2.push(raiz(pts, [0.035, 0.04, 0.04, 0.035, 0.03], '#4a3626', { nudos: 0.015, tramos: 20 }));
    const pr = V3(m.x - 0.05, m.y + 0.95, m.z);
    for (let i = 0; i < 4; i++) { const a = i * 1.57; piezas2.push(raiz([[m.x - 0.05, m.y + 0.82, m.z], [pr.x + Math.sin(a) * 0.08, pr.y, pr.z + Math.cos(a) * 0.08], [pr.x + Math.sin(a) * 0.03, pr.y + 0.12, pr.z + Math.cos(a) * 0.03]], [0.025, 0.018, 0.005], '#4a3626')); }
    brillos2.push(pieza(deform(lathe([[0.001, -0.06], [0.04, -0.03], [0.05, 0.01], [0.03, 0.05], [0.001, 0.08]], 12), () => {}), M4(pr, [0, 0, 0]), '#ffc840', { fuerza: 2.2 }));
    g.userData.halos = [{ p: pr, col: '#ffc840', tam: 1.8 }];
  }
  if (piezas2.length) g.add(fundirCorteza(piezas2));
  const b2 = fundirBrillo(brillos2); if (b2) g.add(b2);
  g.userData.n = n;
  void cab;
  return g;
}

// ---------------------------------------------------------------- la lechuza (con su jinete)
// Un concón (la lechuza del bosque): parda con barras, el disco de la cara ocre con el borde oscuro,
// las alas abiertas. En metros (1,2 m de largo, 3 m de envergadura). Mira a +z.
export function armarLechuza(estilo = 'A') {
  const g = new THREE.Group(), piezas = [], brillos = [];
  const pardo = '#6b4a30', claro = '#c8a070';
  // las plumas en escamas (cada una con el borde más claro y la punta oscura) y las rayas del pecho
  const barras = (c, p, n, l) => {
    const fy = l.y * 26 + l.z * 8, fila = Math.floor(fy), fx = l.x * 22 + Math.atan2(l.x, l.z) * 3 + (fila % 2) * 0.5;
    const ty = fy - fila, tx = fx - Math.floor(fx);
    c.multiplyScalar(0.62 + 0.45 * sv(0.0, 0.7, ty) * (1 - 0.4 * sv(0.35, 0.5, Math.abs(tx - 0.5))));
    if (ty > 0.75) tinta(c, '#d8b888', 0.35);
    if (n.y < -0.3 || (n.z > 0.5 && l.y < 0.05)) { tinta(c, claro, 0.5); if (Math.sin(l.y * 70) > 0.6) c.multiplyScalar(0.7); }
  };
  // el cuerpo: un huevo acostado
  const cuerpo = deform(esfera(48, 36), (v) => { v.x *= 0.28; v.y *= 0.27; v.z *= 0.56; if (v.y < 0) v.y *= 1.1; if (v.z < 0) { v.x *= 1 + v.z * 0.6; v.y *= 1 + v.z * 0.4; } });
  piezas.push(pieza(cuerpo, M4([0, 0, 0], [0.25, 0, 0]), pardo, { pintar: barras }));
  // la cabeza redonda con el disco de la cara
  const hc = V3(0, 0.3, 0.42);
  piezas.push(pieza(deform(esfera(40, 30), (v) => { v.multiplyScalar(0.27); v.x *= 1.1; }), M4(hc), pardo, { pintar: barras }));
  piezas.push(pieza(deform(esfera(22, 16), (v) => { v.x *= 0.25; v.y *= 0.22; v.z *= 0.07; if (v.z > 0) v.z -= 0.05 * Math.max(0, 1 - (v.x / 0.25) ** 2 - (v.y / 0.22) ** 2); }), M4(hc.clone().add(V3(0, -0.01, 0.19))), claro, { tela: 6, hebra: (l) => [Math.atan2(l.y, l.x) * 0.2, Math.hypot(l.x, l.y)], pintar: (c, p, n, l) => { const d = Math.hypot(l.x / 0.25, l.y / 0.22); if (d > 0.85) c.copy(colorDe('#3a2418')); c.multiplyScalar(0.85 + 0.2 * Math.sin(Math.atan2(l.y, l.x) * 30)); } }));
  // el pico ganchudo
  piezas.push(pieza(husoG([[0, 0.31, 0.62], [0, 0.26, 0.69], [0, 0.2, 0.68]], [0.035, 0.025, 0.004], 8, 8), null, '#c8b070', { tela: 12 }));
  // los ojos grandes que brillan (ámbar)
  for (const sx of [-1, 1]) {
    const o = hc.clone().add(V3(sx * 0.085, 0.03, 0.235));
    piezas.push(pieza(deform(esfera(12, 10), () => {}), M4(o, [0, 0, 0], [0.048, 0.048, 0.03]), '#1a0e06'));
    brillos.push(pieza(deform(esfera(12, 10), () => {}), M4(o.clone().add(V3(0, 0, 0.014)), [0, 0, 0], [0.04, 0.04, 0.022]), '#ffa020', { fuerza: 2.4 }));
    brillos.push(pieza(deform(esfera(8, 6), () => {}), M4(o.clone().add(V3(0, 0, 0.034)), [0, 0, 0], [0.017, 0.017, 0.008]), '#100600', { fuerza: 1 }));
    (g.userData.halos ||= []).push({ p: o.clone().add(V3(0, 0, 0.06)), col: '#ffa020', tam: 0.45 });
  }
  // las alas: una superficie con las primarias abiertas en dedos al final, la punta hacia arriba
  for (const sx of [-1, 1]) {
    const ala = grilla((u, v, p, cara) => {
      // el ala levantada (arriba del aleteo): se ve de frente, con las primarias abiertas en dedos
      const ang = 0.72 - 0.25 * u, sp = 0.15 + u * 1.4;
      const cuerda = (0.24 + 0.5 * Math.sqrt(Math.max(0, 1 - u * u * 0.8))) + (u > 0.7 ? 0.12 * Math.max(0, Math.sin(v * 7 * Math.PI)) * (u - 0.7) * 3 * v : 0);
      const borde = 0.26 - 0.14 * u * u;
      // el borde de atrás en festón (una pluma por diente), más hondo en las primarias de la punta
      const z = borde - v * cuerda - sv(0.55, 1, v) * (0.03 + 0.12 * sv(0.55, 1, u)) * (1 - Math.abs(Math.cos(u * Math.PI * 9.5)));
      const y = 0.12 + Math.sin(ang) * sp * 0.75 + 0.06 * Math.sin(v * Math.PI) - (cara ? 0.025 * (1 - u) : 0);
      p.set(sx * (0.12 + Math.cos(ang) * sp), y, z);
    }, 76, 18, 1);
    piezas.push(pieza(ala, null, pardo, {
      pintar: (c, p, n, l, i) => {
        // por (u, v) de la grilla: las cubiertas (adelante, escamas claras con pintas) y las remeras
        // (atrás: una pluma larga por diente del festón, con sus barras y el raquis)
        const NU = 77, NV = 19, cara = Math.floor(i / (NU * NV)), j = i % (NU * NV);
        const u = (j % NU) / 76, v = Math.floor(j / NU) / 18;
        if (v < 0.36) {
          const fila = Math.floor(v * 14), k = (u * 22 + (fila % 2) * 0.5) % 1, t = (v * 14) % 1;
          c.multiplyScalar(0.72 + 0.4 * sv(0, 0.7, t) * (1 - 0.45 * sv(0.32, 0.5, Math.abs(k - 0.5))));
          tinta(c, '#9a7048', 0.3);
          if (Math.abs(k - 0.5) < 0.12 && t > 0.4 && t < 0.7) tinta(c, '#e8d4a8', 0.5);
        } else {
          const k = (u * 9.5) % 1;
          c.multiplyScalar(0.85 + 0.25 * (1 - sv(0.3, 0.5, Math.abs(k - 0.5))));
          if (Math.sin((v - u * 0.15) * 30) > 0.25) c.multiplyScalar(0.5);
          if (Math.abs(k - 0.5) < 0.04) c.multiplyScalar(0.7);
          if (u > 0.7) c.multiplyScalar(0.85);
        }
        if (cara) tinta(c, '#d8b888', 0.45);
      },
    }));
  }
  // la cola en abanico
  piezas.push(pieza(grilla((u, v, p, cara) => { const a = (u - 0.5) * 0.9; p.set(Math.sin(a) * (0.1 + v * 0.35), -0.08 + v * 0.05 - (cara ? 0.015 : 0), -0.5 - Math.cos(a) * v * 0.35); }, 10, 6, 1), null, pardo, { tela: 6, hebra: (l) => [l.x, l.z], pintar: (c, p, n, l) => { if (Math.sin(l.z * 50) > 0.5) c.multiplyScalar(0.6); } }));
  // las patas con las garras, recogidas
  for (const sx of [-1, 1]) {
    piezas.push(pieza(husoG([[sx * 0.1, -0.25, 0.1], [sx * 0.11, -0.35, 0.05], [sx * 0.11, -0.4, 0.0]], [0.05, 0.045, 0.03], 8, 8), null, '#c8a878', { tela: 6, hebra: (l) => [l.x * 3, l.y] }));
    for (let f = 0; f < 3; f++) piezas.push(pieza(husoG([[sx * 0.11 + (f - 1) * 0.025, -0.4, 0.0], [sx * 0.11 + (f - 1) * 0.04, -0.43, 0.04], [sx * 0.11 + (f - 1) * 0.045, -0.46, 0.03]], [0.012, 0.01, 0.002], 6, 6), null, '#2a2420'));
  }
  // la manta de montar, con su guarda, y las riendas
  const manta = grilla((u, v, p, cara) => { const a = (u - 0.5) * 2.2; p.set(Math.sin(a) * 0.4, 0.2 + Math.cos(a) * 0.17 - (cara ? 0.015 : 0), 0.05 - v * 0.4); }, 14, 6, 1);
  piezas.push(pieza(manta, null, '#8a3c2a', { tela: 1, guarda: (l) => [3, Math.min(Math.abs(Math.abs(l.x) - 0.32), 0.2), l.z * 2, 0.07] }));
  g.add(fundir(piezas, materialGente()));
  { const b = fundirBrillo(brillos); if (b) g.add(b); }
  // el jinete: un travieso del estilo, montado
  const P = ESTILOS[estilo].travieso(0);
  P.k = 0.46;
  const d = armarDuende(P, 'montado', 5);
  d.position.set(0, 0.22 - 0.5 * P.k + 0.08, 0.02);
  g.add(d);
  // las riendas: de las manos del jinete al pico
  const pr = [];
  for (const m of d.userData.manos) {
    const a = m.clone().add(d.position);
    pr.push(pieza(husoG([a, a.clone().lerp(V3(0, 0.25, 0.6), 0.5).add(V3(0, -0.04, 0)), V3(m.x > 0 ? 0.08 : -0.08, 0.25, 0.6)], [0.006, 0.006, 0.006], 10, 4), null, '#3a2418', { tela: 3 }));
  }
  g.add(fundir(pr, materialGente(), false));
  return g;
}

// ---------------------------------------------------------------- el Coihue Viejo (3 opciones)
// 1: el árbol con la cara tallada que camina con las raíces; 2: encorvado, con brazos de ramas y
// faroles de hongos colgando; 3: cubierto de musgo, con puertitas y ventanas de duendes encendidas.
// En metros: el fuste de unos 24 m, sostenido 3 m sobre el piso por las raíces-patas. Mira a +z.
const FOLLAJE = ['#2b5126', '#34602c', '#24461f', '#3c6a30'];
function copa(piezasH, cen, rad, r, oscuro = 1) {
  const g = new THREE.IcosahedronGeometry(1, 3);
  const f = r() * 10;
  deform(g, (v) => { v.multiplyScalar(1 + 0.18 * ruido(v.x * 2.5 + f, v.y * 2.5, v.z * 2.5) + 0.08 * ruido(v.x * 7, v.y * 7 + f, v.z * 7)); if (v.y < 0) v.y *= 0.55; });
  const col = FOLLAJE[Math.floor(r() * FOLLAJE.length)];
  piezasH.push(pieza(g, M4(cen, [0, r() * 6, 0], rad), col, { pintar: (c, p, n, l) => { c.multiplyScalar((0.55 + 0.5 * sv(-0.6, 0.9, l.y)) * oscuro * (0.85 + 0.3 * (ruido(l.x * 9, l.y * 9, l.z * 9) * 0.5 + 0.5))); } }));
  // hojitas sueltas en el borde (cortan la silueta redonda)
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, b = (r() - 0.35) * 1.4;
    const p = V3(Math.cos(a) * Math.cos(b) * rad[0], Math.sin(b) * rad[1] * 0.6, Math.sin(a) * Math.cos(b) * rad[2]).multiplyScalar(1.0 + r() * 0.12).add(vv(cen));
    const s = 0.35 + r() * 0.3;
    const gh = grilla((u, v, q) => q.set((u - 0.5) * s * (1 - Math.abs(v - 0.5)), 0, (v - 0.5) * s * 1.6), 2, 2);
    piezasH.push(pieza(gh, M4(p, [r() * 1.2 - 0.6, a, r() * 0.8 - 0.4]), col, { pintar: (c) => c.multiplyScalar(0.8 * oscuro) }));
  }
}
export function armarCoihue(n = 1) {
  const g = new THREE.Group(), piezas = [], hojas = [], brillos = [], luces = [];
  const r = azar(400 + n * 17);
  const H = 24, alza = n === 2 ? 2.4 : 3.0;
  const enc = n === 2 ? 1 : 0;
  // el eje del fuste: recto (1 y 3) o encorvado hacia adelante (2)
  const eje = (y) => { const t = y / H; return [0, enc * (3.8 * t * t - 0.4 * t)]; };
  const radio = (y) => { const t = y / H; return 2.6 * (1 - 0.5 * t) * (1 + 0.55 * Math.exp(-((y / 1.6) ** 2))) * (t > 0.85 ? 1 - (t - 0.85) * 3 : 1); };
  // la cara: los ojos, la nariz y la boca, en el frente (+z), a 7-10 m
  const cara = n === 1 || n === 2;
  const ojos = [[-0.9, 9.6], [0.95, 9.4]];
  const enCara = (a, y) => {
    let dz = 0, oscuro = 0;
    if (!cara) return [0, 0];
    const x = a * 2.3;
    for (const [ox, oy] of ojos) { const d = ((x - ox) / 0.55) ** 2 + ((y - oy) / 0.38) ** 2; dz -= 0.75 * Math.exp(-d * 1.6); oscuro += sv(1.3, 0.3, d); }
    // las cejas, como nudos encima de los ojos
    for (const [ox, oy] of ojos) { const d = ((x - ox * 1.1) / 0.85) ** 2 + ((y - oy - 0.6) / 0.22) ** 2; dz += 0.4 * Math.exp(-d); }
    // la nariz: un nudo largo
    { const d = (x / 0.42) ** 2 + ((y - 8.4) / 1.0) ** 2; dz += 0.85 * Math.exp(-d) * sv(7.3, 8.6, y); }
    // la boca: una grieta ancha, torcida
    { const yb = 6.7 + 0.18 * (x * x) * 0.4 - 0.15 * x; const d = (x / 1.45) ** 2; const dd = ((y - yb) / 0.2) ** 2; dz -= 0.6 * Math.exp(-dd) * Math.exp(-d * d * 2); oscuro += sv(1.2, 0.2, dd) * Math.exp(-d * d * 2); }
    return [dz, Math.min(1, oscuro)];
  };
  {
    const lados = 56, filas = 70;
    const perf = []; for (let j = 0; j <= filas; j++) { const y = (j / filas) * H; perf.push([1, y]); }
    const gt = lathe(perf, lados);
    deform(gt, (v) => {
      const y = v.y, a = Math.atan2(v.x, v.z);
      let rr = radio(y) * (1 + 0.1 * ruido(a * 2, y * 0.25, 0) + 0.05 * Math.sin(a * 13 + y * 0.3) + 0.03 * Math.sin(a * 31 + y * 0.9));
      // los contrafuertes de la base
      rr *= 1 + 0.25 * Math.exp(-y / 2.2) * Math.max(0, Math.sin(a * 5 + 0.5));
      // la cara (sólo adelante)
      if (Math.cos(a) > 0.2) { const [dz] = enCara(a, y); rr += dz * sv(0.2, 0.7, Math.cos(a)); }
      const [ex, ez] = eje(y);
      v.set(Math.sin(a) * rr + ex, y, Math.cos(a) * rr + ez);
    });
    piezas.push(pieza(gt, M4([0, alza, 0]), '#4d3b2c', {
      veta: (l) => [Math.atan2(l.x, l.z) * 2.2, l.y, 1],
      pintar: (c, p, n, l) => {
        const a = Math.atan2(l.x, l.z), y = l.y;
        c.multiplyScalar(0.7 + 0.45 * sv(0, H * 0.6, y));
        tinta(c, '#6a5a48', 0.3 * sv(0.2, 0.8, ruido(a * 3, y * 0.4, 1)));
        if (cara && Math.cos(a) > 0.2) { const [, os] = enCara(a, y); c.multiplyScalar(1 - 0.85 * os); }
        // el musgo: en la opción 3 casi todo; en las otras, al pie y del lado de la sombra
        const mus = n === 3 ? 0.85 * sv(-0.4, 0.5, ruido(a * 2, y * 0.35, 3) + 0.3) : 0.6 * sv(0.3, 1, ruido(a * 2, y * 0.3, 5)) * sv(8, 1, y);
        tinta(c, n === 3 ? '#4a6a2c' : '#3e5226', mus);
        if (n === 3) c.multiplyScalar(0.85 + 0.3 * (ruido(a * 20, y * 4, 2) * 0.5 + 0.5) * mus);
      },
    }));
  }
  // las brasas en los ojos y la boca (ámbar: el fuego de adentro)
  if (cara) {
    for (const [ox, oy] of ojos) {
      const a = ox / 2.3, [ex, ez] = eje(oy);
      const rr = radio(oy) - 0.55;
      const p = V3(Math.sin(a) * rr + ex, oy + alza, Math.cos(a) * rr + ez);
      brillos.push(pieza(deform(esfera(14, 10), () => {}), M4(p, [0, a, 0], [0.32, 0.2, 0.12]), '#ffa830', { fuerza: 2.4 }));
      (g.userData.halos ||= []).push({ p, col: '#ffa830', tam: 5 });
    }
    const yb = 6.7, [ex, ez] = eje(yb), rr = radio(yb) - 0.45;
    brillos.push(pieza(deform(esfera(16, 8), () => {}), M4([ex, yb + alza, rr + ez], [0, 0, 0], [1.1, 0.1, 0.12]), '#ff8a20', { fuerza: 1.3 }));
    luces.push({ p: V3(ex, yb + alza, rr + ez + 1.2), col: 0xff9a40, i: 3, d: 14 });
  }
  // las raíces-patas: seis, que levantan el tronco; dos en el aire (da el paso)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.5 + (r() - 0.5) * 0.3;
    const paso = n !== 3 && (i === 0 || i === 3) ? 1 : 0;
    const s = Math.sin(a), c = Math.cos(a);
    const r0 = 2.0, r1 = 4.8 + r() * 0.8, r2 = 6.6 + r() * 1.2;
    const y1 = alza + 1.2 + paso * 1.8, y2 = paso ? 1.6 : -0.3;
    const adel = paso ? 1.8 : 0;
    const pts = [[s * r0, alza + 1.5, c * r0], [s * (r0 + 1.4), alza + 1.1, c * (r0 + 1.4)], [s * r1, y1, c * r1 + adel * 0.5], [s * (r1 + 0.9), (y1 + y2) * 0.5, c * (r1 + 0.9) + adel], [s * r2, y2, c * r2 + adel]];
    piezas.push(raiz(pts, [1.15, 0.95, 0.75, 0.55, 0.38], '#4a3828', { nudos: 0.18, tramos: 22, lados: 12, pintar: (cc, p, nn) => musgoEn(cc, p, nn, n === 3 ? 1 : 0.6, 0.6) }));
    // los dedos de la raíz
    for (let k = 0; k < 3; k++) {
      const b = a + (k - 1) * 0.35;
      const e = V3(...pts[4]);
      piezas.push(raiz([[e.x, e.y + 0.2, e.z], [e.x + Math.sin(b) * 0.9, e.y - (paso ? 0.4 : 0.1), e.z + Math.cos(b) * 0.9], [e.x + Math.sin(b) * 1.7, e.y - (paso ? 1.0 : 0.25), e.z + Math.cos(b) * 1.7]], [0.32, 0.2, 0.04], '#43332a', { nudos: 0.06 }));
    }
  }
  // las ramas y la copa en pisos
  const ramas = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8, y = H * (0.55 + 0.4 * t);
    const a = i * 2.3 + r() * 0.5;
    const [ex, ez] = eje(y);
    const largo = (7 - 3.5 * t) * (0.85 + r() * 0.3);
    const fin = [ex + Math.sin(a) * largo, y + alza + 1.5 + r() * 1.5, ez + Math.cos(a) * largo];
    ramas.push({ a, fin });
    piezas.push(raiz([[ex + Math.sin(a) * 0.8, y + alza - 1, ez + Math.cos(a) * 0.8], [ex + Math.sin(a) * largo * 0.5, y + alza + 0.4, ez + Math.cos(a) * largo * 0.5], fin], [0.55 - 0.2 * t, 0.32, 0.12], '#4a3828', { nudos: 0.08 }));
    copa(hojas, fin, [3.4 - 1.4 * t, 1.6 - 0.4 * t, 3.2 - 1.3 * t], r, n === 3 ? 0.85 : 1);
  }
  { const [ex, ez] = eje(H); copa(hojas, [ex, H + alza + 0.5, ez], [2.4, 1.6, 2.4], r); }
  // los brazos de ramas (opción 2): bajan hacia adelante, con dedos de ramitas y faroles de hongos
  if (n === 2) {
    for (const sx of [-1, 1]) {
      const y = 15, [ex, ez] = eje(y);
      const pts = [[ex + sx * 1.3, y + alza, ez + 0.4], [ex + sx * 4.5, y + alza + 1.2, ez + 1.6], [ex + sx * 6.8, y + alza - 2.5, ez + 3.6], [ex + sx * 7.2, y + alza - 6.5, ez + 5.4]];
      piezas.push(raiz(pts, [0.75, 0.6, 0.42, 0.3], '#4a3828', { nudos: 0.1, tramos: 22 }));
      const mano = V3(...pts[3]);
      for (let k = 0; k < 4; k++) {
        const b = (k - 1.5) * 0.5;
        piezas.push(raiz([[mano.x, mano.y + 0.3, mano.z], [mano.x + sx * Math.sin(b) * 1.2, mano.y - 1.0, mano.z + Math.cos(b) * 1.0], [mano.x + sx * Math.sin(b) * 1.5, mano.y - 2.3, mano.z + Math.cos(b) * 1.6]], [0.2, 0.12, 0.03], '#43332a', { nudos: 0.05 }));
      }
      // los faroles: panes de indio que brillan, colgando de lianas
      for (let k = 0; k < 4; k++) {
        const t = 0.25 + k * 0.22;
        const base = V3(...pts[1]).lerp(V3(...pts[2]), t);
        const largo = 1.5 + r() * 2.2;
        const fin = base.clone().add(V3(0, -largo, 0.1));
        piezas.push(pieza(husoG([base, base.clone().lerp(fin, 0.5).add(V3(0.1, 0, 0)), fin], [0.04, 0.035, 0.03], 8, 5), null, '#3a4a2a', { veta: () => [0, 0, 0.2] }));
        brillos.push(pieza(deform(esfera(12, 10), (v) => { v.multiplyScalar(1 + 0.12 * Math.sin(v.x * 20) * Math.sin(v.y * 20)); }), M4(fin.clone().add(V3(0, -0.3, 0)), [0, 0, 0], [0.38, 0.42, 0.38]), k % 2 ? '#ffb040' : '#c8ff6a', { fuerza: 1.5 }));
        (g.userData.halos ||= []).push({ p: fin.clone().add(V3(0, -0.3, 0)), col: k % 2 ? '#ffb040' : '#c8ff6a', tam: 3.2 });
        if (k % 2 === 0) luces.push({ p: fin.clone().add(V3(0, -0.6, 0.4)), col: k % 2 ? 0xffb040 : 0xb8ff6a, i: 2.2, d: 11 });
      }
    }
  }
  // las puertitas y ventanas de duendes (opción 3)
  if (n === 3) {
    const pz = [];
    const ventana = (a, y, w, h, prender) => {
      const [ex, ez] = eje(y), rr = radio(y) * (1 + 0.04);
      const p = V3(Math.sin(a) * rr + ex, y + alza, Math.cos(a) * rr + ez);
      // el marco de madera y el vano
      pz.push(pieza(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.14), M4(p, [0, a, 0]), '#6b4a2a', { veta: (l) => [l.x * 3, l.y * 3, 0.3] }));
      if (prender) {
        brillos.push(pieza(new THREE.PlaneGeometry(w, h), M4(p.clone().add(V3(Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08)), [0, a, 0]), '#ffb860', { fuerza: 1.5 }));
        // la cruz del marco
        pz.push(pieza(new THREE.BoxGeometry(0.05, h, 0.05), M4(p.clone().add(V3(Math.sin(a) * 0.1, 0, Math.cos(a) * 0.1)), [0, a, 0]), '#4a3020', { veta: () => [0, 0, 0.2] }));
        pz.push(pieza(new THREE.BoxGeometry(w, 0.05, 0.05), M4(p.clone().add(V3(Math.sin(a) * 0.1, 0, Math.cos(a) * 0.1)), [0, a, 0]), '#4a3020', { veta: () => [0, 0, 0.2] }));
        (g.userData.halos ||= []).push({ p: p.clone().add(V3(Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3)), col: '#ffb860', tam: 2.2 });
      } else pz.push(pieza(new THREE.PlaneGeometry(w, h), M4(p.clone().add(V3(Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08)), [0, a, 0]), '#1a120c', { veta: () => [0, 0, 0] }));
      // el alerito
      pz.push(pieza(new THREE.BoxGeometry(w + 0.4, 0.06, 0.4), M4(p.clone().add(V3(Math.sin(a) * 0.2, h / 2 + 0.14, Math.cos(a) * 0.2)), [0.25, a, 0]), '#5a3a22', { veta: (l) => [l.x * 3, l.z * 3, 0.5], pintar: (c, pp, nn) => musgoEn(c, pp, nn, 1) }));
    };
    const vs = [[0.2, 5.5, 0.6, 0.8, 1], [-0.7, 8.2, 0.5, 0.65, 1], [0.9, 11.0, 0.5, 0.6, 1], [-0.1, 13.6, 0.45, 0.55, 1], [1.6, 7.0, 0.5, 0.6, 1], [-1.5, 10.5, 0.45, 0.6, 1], [0.5, 16.0, 0.4, 0.5, 1], [-0.9, 4.2, 0.5, 0.6, 0], [2.6, 12.5, 0.4, 0.5, 1], [-2.4, 14.4, 0.4, 0.5, 1]];
    for (const v of vs) ventana(...v);
    // las puertitas al pie (en las raíces) con su farol
    for (const [a, w, h] of [[0.05, 1.0, 1.4], [-1.1, 0.7, 1.0], [1.3, 0.8, 1.1]]) {
      const y = 0.9, rr = radio(y) * 1.05;
      const p = V3(Math.sin(a) * rr, y + alza + h / 2 - 0.2, Math.cos(a) * rr);
      const gp = lathe([[0.001, 0], [w / 2, 0], [w / 2, h * 0.65], [w * 0.35, h * 0.9], [0.001, h]], 1, 0, Math.PI);
      pz.push(pieza(new THREE.BoxGeometry(w + 0.2, h + 0.15, 0.16), M4(p.clone().add(V3(0, 0, 0)), [0, a, 0]), '#5a3a22', { veta: (l) => [l.x * 3, l.y * 3, 0.4] }));
      pz.push(pieza(new THREE.BoxGeometry(w, h, 0.08), M4(p.clone().add(V3(Math.sin(a) * 0.06, 0, Math.cos(a) * 0.06)), [0, a, 0]), '#7a4a2a', { veta: (l) => [l.x * 6, l.y, 0.6], pintar: (c, pp, nn, l) => { if (Math.abs(Math.sin(l.x * 18)) < 0.15) c.multiplyScalar(0.6); } }));
      gp.dispose();
      const fl = p.clone().add(V3(Math.sin(a) * 0.35 + Math.cos(a) * (w / 2 + 0.25), h * 0.2, Math.cos(a) * 0.35 - Math.sin(a) * (w / 2 + 0.25)));
      brillos.push(pieza(deform(esfera(10, 8), () => {}), M4(fl, [0, 0, 0], [0.13, 0.17, 0.13]), '#ffb040', { fuerza: 1.8 }));
      (g.userData.halos ||= []).push({ p: fl, col: '#ffb040', tam: 2.4 });
      luces.push({ p: fl.clone().add(V3(Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5)), col: 0xffa850, i: 2.0, d: 9 });
    }
    // escalerita y balconcito
    {
      const a = 0.55, y = 9.2, [ex, ez] = eje(y), rr = radio(y) + 0.25;
      const p = V3(Math.sin(a) * rr + ex, y + alza - 0.5, Math.cos(a) * rr + ez);
      pz.push(pieza(new THREE.BoxGeometry(1.4, 0.08, 0.7), M4(p, [0, a, 0]), '#6b4a2a', { veta: (l) => [l.x * 3, l.z * 3, 0.5] }));
      for (let k = 0; k < 5; k++) pz.push(pieza(new THREE.BoxGeometry(0.05, 0.45, 0.05), M4(p.clone().add(V3(Math.sin(a) * 0.32 + Math.cos(a) * (k - 2) * 0.32, 0.25, Math.cos(a) * 0.32 - Math.sin(a) * (k - 2) * 0.32)), [0, a, 0]), '#5a3a22', { veta: () => [0, 0, 0.3] }));
    }
    for (const q of pz) piezas.push(q);
    // bultos de musgo colgando
    for (let i = 0; i < 26; i++) {
      const a = r() * TAU, y = 2 + r() * 16, [ex, ez] = eje(y), rr = radio(y);
      const gm = deform(esfera(10, 8), (v) => { v.multiplyScalar(1 + 0.3 * ruido(v.x * 4 + i, v.y * 4, v.z * 4)); if (v.y < 0) v.y *= 2.2; });
      piezas.push(pieza(gm, M4([Math.sin(a) * rr + ex, y + alza, Math.cos(a) * rr + ez], [0, a, 0], [0.7 + r() * 0.5, 0.35, 0.5]), '#4a6a2c', { veta: () => [0, 0, 0.2], pintar: (c, p, nn, l) => c.multiplyScalar(0.7 + 0.4 * (ruido(l.x * 30, l.y * 30, l.z * 30) * 0.5 + 0.5)) }));
    }
  }
  g.add(fundirCorteza(piezas));
  const mh = fundir(hojas, matHoja());
  g.add(mh);
  const mb = fundirBrillo(brillos); if (mb) g.add(mb);
  g.userData.luces = luces;
  g.userData.n = n;
  return g;
}
// (las hojas usan `fundir` con el material de las hojas: las telas y la zona no le importan)

// ---------------------------------------------------------------- adentro del Coihue: el corazón
// Una sala alta y redonda (7 m de ancho), las paredes de madera roja del corazón del coihue, la
// escalera de raíces que sube en espiral, faroles de hongos en repisas, y al fondo el corazón (un
// nudo de ámbar que late) con el trono del Rey debajo.
export function armarAdentro(nRey = 1) {
  const g = new THREE.Group(), piezas = [], brillos = [], luces = [];
  const r = azar(901);
  const RA = 3.6, HA = 14;
  // la pared: un torno mirando hacia adentro, con las vetas y nudos
  {
    const perf = []; for (let j = 0; j <= 50; j++) { const y = -0.3 + (j / 50) * HA; perf.push([1, y]); }
    const gw = lathe(perf, 64);
    // dar vuelta los triángulos: se ve desde adentro
    const I = gw.index.array; for (let t = 0; t < I.length; t += 3) { const k = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = k; }
    deform(gw, (v) => {
      const a = Math.atan2(v.x, v.z), y = v.y;
      const rr = RA * (1 - 0.28 * sv(HA * 0.55, HA, y)) * (1 + 0.07 * ruido(a * 3, y * 0.35, 0) + 0.035 * Math.sin(a * 17 + y * 0.6) + 0.06 * sv(1.5, 0, y));
      v.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
    });
    gw.computeVertexNormals();
    piezas.push(pieza(gw, null, '#7a4430', {
      veta: (l) => [Math.atan2(l.x, l.z) * RA, l.y, 0.75],
      pintar: (c, p, n, l) => {
        const a = Math.atan2(l.x, l.z);
        c.multiplyScalar(0.8 + 0.3 * Math.sin(a * 23 + 4 * ruido(a * 2, l.y * 0.5, 2)) * 0.5 + 0.15);
        tinta(c, '#4a2a1c', 0.5 * sv(HA * 0.4, HA, l.y));
        tinta(c, '#5a6a2a', 0.35 * sv(0.4, 0.9, ruido(a * 4, l.y * 0.6, 7)) * sv(2, 0, l.y));
      },
    }));
  }
  // el piso: raíces trenzadas en el suelo (un disco con bultos) y la tierra
  {
    const gp = deform(new THREE.CircleGeometry(RA * 1.05, 48, 0, TAU), (v) => { });
    gp.rotateX(-Math.PI / 2);
    piezas.push(pieza(gp, null, '#3a2a1e', { veta: (l) => [l.x, l.z, 0.4] }));
    for (let i = 0; i < 14; i++) {
      const a = r() * TAU, a2 = a + (r() - 0.5) * 1.5;
      piezas.push(raiz([[Math.sin(a) * RA * 0.95, 0.15, Math.cos(a) * RA * 0.95], [Math.sin((a + a2) / 2) * RA * 0.5, 0.12, Math.cos((a + a2) / 2) * RA * 0.5], [Math.sin(a2) * 0.6, 0.0, Math.cos(a2) * 0.6]], [0.28, 0.2, 0.05], '#5a3a26', { nudos: 0.05 }));
    }
  }
  // la escalera de raíces: peldaños que salen de la pared en espiral, con su baranda de raíz
  {
    const pasos = 34, desde = 2.0;
    const bar = [];
    for (let k = 0; k < pasos; k++) {
      const a = desde + k * 0.22, y = 0.35 + k * 0.33;
      const rr = RA * (1 - 0.28 * sv(HA * 0.55, HA, y)) - 0.7;
      const p = V3(Math.sin(a) * rr, y, Math.cos(a) * rr);
      const gp = deform(esfera(12, 8), (v) => { v.multiplyScalar(1 + 0.12 * ruido(v.x * 4 + k, v.y * 4, v.z * 4)); if (v.y > 0) v.y *= 0.3; });
      piezas.push(pieza(gp, M4(p, [0, a + Math.PI / 2, 0], [0.75, 0.22, 0.38]), '#6a4630', { veta: (l) => [l.x * 2, l.z * 2, 0.8], pintar: (c, pp, n) => { if (n.y > 0.6) c.multiplyScalar(1.25); musgoEn(c, pp, n, 0.25); } }));
      // la raíz que lo sostiene desde la pared
      piezas.push(raiz([[Math.sin(a) * (rr + 0.8), y + 0.3, Math.cos(a) * (rr + 0.8)], [Math.sin(a) * (rr + 0.4), y - 0.25, Math.cos(a) * (rr + 0.4)], [Math.sin(a) * (rr - 0.1), y - 0.08, Math.cos(a) * (rr - 0.1)]], [0.16, 0.12, 0.08], '#5a3a26', { nudos: 0.03 }));
      bar.push([Math.sin(a) * (rr - 0.62), y + 0.95, Math.cos(a) * (rr - 0.62)]);
      if (k % 3 === 0) piezas.push(raiz([[Math.sin(a) * (rr - 0.6), y, Math.cos(a) * (rr - 0.6)], [Math.sin(a + 0.05) * (rr - 0.64), y + 0.5, Math.cos(a + 0.05) * (rr - 0.64)], bar[bar.length - 1]], [0.05, 0.045, 0.04], '#4a3020', { nudos: 0.02 }));
    }
    for (let k = 0; k < bar.length - 6; k += 5) piezas.push(raiz(bar.slice(k, k + 7), [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05].slice(0, Math.min(7, bar.length - k)), '#4a3020', { tramos: 24 }));
  }
  // los faroles de hongos: panes de indio y hongos de repisa que brillan, en la pared
  const farol = (a, y, col, tam = 1, luz = false) => {
    const rr = RA * (1 - 0.28 * sv(HA * 0.55, HA, y)) - 0.15;
    const p = V3(Math.sin(a) * rr, y, Math.cos(a) * rr);
    // la repisa (hongo de repisa) y el racimo
    const gr = deform(esfera(14, 6), (v) => { if (v.y > 0) v.y *= 0.4; else v.y *= 0.25; });
    piezas.push(pieza(gr, M4(p.clone().add(V3(0, -0.12 * tam, 0)), [0, a, 0], [0.45 * tam, 0.2 * tam, 0.35 * tam]), '#c8a070', { veta: () => [0, 0, 0.1], pintar: (c, pp, n) => { if (n.y < 0) c.multiplyScalar(0.55); } }));
    for (let i = 0; i < 4; i++) {
      const q = p.clone().add(V3((r() - 0.5) * 0.35 * tam, 0.05 + r() * 0.15 * tam, (r() - 0.5) * 0.35 * tam)).addScaledVector(V3(Math.sin(a), 0, Math.cos(a)), -0.12);
      const s = (0.09 + r() * 0.06) * tam;
      brillos.push(pieza(deform(esfera(10, 8), (v) => { v.multiplyScalar(1 + 0.1 * Math.sin(v.x * 25) * Math.sin(v.y * 25)); }), M4(q, [0, 0, 0], [s, s, s]), col, { fuerza: 1.7 }));
    }
    (g.userData.halos ||= []).push({ p: p.clone().addScaledVector(V3(Math.sin(a), 0, Math.cos(a)), -0.2).add(V3(0, 0.1, 0)), col, tam: 1.6 * tam });
    if (luz) luces.push({ p: p.clone().addScaledVector(V3(Math.sin(a), 0, Math.cos(a)), -0.6), col: new THREE.Color(col).getHex(), i: 3, d: 9 });
  };
  luces.push({ p: V3(0, 2.2, 1.6), col: 0xffb070, i: 1.4, d: 9 });
  farol(0.6, 1.6, '#ffb040', 1.2, true); farol(-0.9, 2.0, '#c8ff6a', 1.1, true); farol(2.0, 3.3, '#ffb040', 1, true); farol(-2.2, 4.4, '#c8ff6a', 1, false);
  farol(3.0, 6.0, '#ffb040', 0.9, true); farol(-2.9, 7.4, '#c8ff6a', 0.9, false); farol(1.5, 8.6, '#ffb040', 0.8, false); farol(-1.0, 10.2, '#c8ff6a', 0.8, true);
  farol(0.2, 11.6, '#ffb040', 0.7, false);
  // el corazón: un nudo de ámbar en la pared del fondo (−z), envuelto en raíces, sobre el trono
  {
    const cz = -RA + 0.55, cy = 4.4;
    brillos.push(pieza(deform(esfera(24, 18), (v) => { v.multiplyScalar(1 + 0.1 * ruido(v.x * 3, v.y * 3, v.z * 3)); }), M4([0, cy, cz], [0, 0, 0], [0.75, 0.95, 0.5]), '#ffa020', { fuerza: 2.2 }));
    brillos.push(pieza(deform(esfera(16, 12), () => {}), M4([0, cy, cz + 0.25], [0, 0, 0], [0.4, 0.55, 0.35]), '#ffe080', { fuerza: 2.2 }));
    (g.userData.halos ||= []).push({ p: V3(0, cy, cz + 0.4), col: '#ffa020', tam: 7 });
    luces.push({ p: V3(0, cy - 0.6, cz + 1.6), col: 0xffa040, i: 7, d: 12 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      piezas.push(raiz([[Math.sin(a) * 1.6, cy + Math.cos(a) * 1.9, -RA + 0.1], [Math.sin(a) * 0.75, cy + Math.cos(a) * 0.95, cz + 0.35], [Math.sin(a + 1.3) * 0.5, cy + Math.cos(a + 1.3) * 0.6, cz + 0.42], [Math.sin(a + 2.2) * 0.9, cy + Math.cos(a + 2.2) * 1.2, -RA + 0.2]], [0.16, 0.1, 0.08, 0.12], '#5a3020', { nudos: 0.03, tramos: 18 }));
    }
  }
  // el techo: la oscuridad de arriba, con rayitos de luna por los agujeros
  {
    const gt = lathe([[RA * 0.72, HA - 0.1], [RA * 0.4, HA + 1.2], [0.001, HA + 1.8]], 32);
    const I = gt.index.array; for (let t = 0; t < I.length; t += 3) { const k = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = k; }
    gt.computeVertexNormals();
    piezas.push(pieza(gt, null, '#2a1810', { veta: (l) => [Math.atan2(l.x, l.z) * 2, l.y, 0.5] }));
    brillos.push(pieza(new THREE.CircleGeometry(0.3, 12), M4([1.2, HA + 0.6, 0.6], [Math.PI / 2, 0, 0]), '#a8c0d8', { fuerza: 0.8 }));
  }
  g.add(fundirCorteza(piezas));
  { const b = fundirBrillo(brillos); if (b) g.add(b); }
  // el Rey, en el trono, al fondo
  const rey = armarRey(nRey);
  rey.position.set(0, 0.0, -RA + 1.75);
  g.add(rey);
  g.userData.luces = luces;
  g.userData.radio = RA;
  return g;
}

// ---------------------------------------------------------------- el nido, la madriguera, las semillas
// El nido: un montículo de musgo con ramitas y hongos, con bolsas de hongo (bejines) abiertas donde
// asoma la punta de un gorrito (los duendes que nacen). En metros, ~1,6 m de ancho.
export function armarNido() {
  const g = new THREE.Group(), piezas = [], brillos = [], cort = [];
  const r = azar(55);
  const gm = deform(lathe(afinar([[0.001, 0.5], [0.5, 0.48], [0.75, 0.42], [0.85, 0.3], [0.9, 0.12], [0.95, 0.0]], 4), 32), (v) => { v.multiplyScalar(1 + 0.1 * ruido(v.x * 4, v.y * 4, v.z * 4)); if (Math.hypot(v.x, v.z) < 0.55 && v.y > 0.3) v.y -= 0.18 * (1 - Math.hypot(v.x, v.z) / 0.55); });
  piezas.push(pieza(gm, null, '#4a6a2a', { tela: 5, pintar: (c, p, n, l) => { c.multiplyScalar(0.7 + 0.45 * (ruido(l.x * 18, l.y * 18, l.z * 18) * 0.5 + 0.5)); tinta(c, '#7a8a3a', 0.3 * sv(0.4, 0.9, ruido(l.x * 6, l.y * 6, l.z * 6))); if (l.y < 0.08) tinta(c, '#3a2a1e', 0.6); } }));
  // las ramitas tejidas en el borde
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, a2 = a + 0.6 + r() * 0.8;
    cort.push(raiz([[Math.sin(a) * 0.72, 0.42 + r() * 0.08, Math.cos(a) * 0.72], [Math.sin((a + a2) / 2) * 0.86, 0.5 + r() * 0.08, Math.cos((a + a2) / 2) * 0.86], [Math.sin(a2) * 0.7, 0.4 + r() * 0.1, Math.cos(a2) * 0.7]], [0.018, 0.016, 0.01], '#5a4232'));
  }
  // los bejines (bolsas de hongo) en el medio: dos abiertos con un gorrito que asoma
  for (let i = 0; i < 4; i++) {
    const a = i * 1.7 + 0.3, d = i === 0 ? 0 : 0.32;
    const p = V3(Math.sin(a) * d, 0.42, Math.cos(a) * d);
    const s = i === 0 ? 0.24 : 0.15 + r() * 0.05;
    const abierto = i < 2;
    const gb = deform(lathe(afinar([[0.001, 0], [0.8, 0.1], [1, 0.55], [0.9, 0.95], [abierto ? 0.55 : 0.4, 1.15], [abierto ? 0.45 : 0.001, abierto ? 1.05 : 1.2]], 3), 20), (v) => { const a2 = Math.atan2(v.x, v.z); if (abierto && v.y > 0.95) v.y += 0.12 * Math.sin(a2 * 6); });
    piezas.push(pieza(gb, M4(p, [0, a, 0], [s, s, s]), '#e2d6bd', { tela: 4, pintar: (c, pp, n, l) => { c.multiplyScalar(0.85 + 0.2 * ruido(l.x * 30, l.y * 30, l.z * 30)); if (l.y > 0.95 && abierto) c.multiplyScalar(0.7); tinta(c, '#a08a6a', 0.3 * sv(0.4, 0, l.y)); } }));
    if (abierto) {
      // el gorrito que asoma (y su brillo adentro)
      const gg = deform(lathe(afinar([[0.4, 0], [0.3, 0.35], [0.12, 0.7], [0.001, 1]], 3), 14), (v) => { v.z -= 0.25 * sv(0.4, 1, v.y) * v.y; });
      piezas.push(pieza(gg, M4(p.clone().add(V3(0, s * 0.95, 0)), [0.1, a, 0], [s * 0.95, s * 1.4, s * 0.95]), i === 0 ? '#8e2f22' : '#5f6b3e', { tela: 5 }));
      brillos.push(pieza(deform(esfera(10, 6), () => {}), M4(p.clone().add(V3(0, s * 1.05, 0)), [0, 0, 0], [s * 0.42, s * 0.08, s * 0.42]), '#ffd070', { fuerza: 1.4 }));
      (g.userData.halos ||= []).push({ p: p.clone().add(V3(0, s * 1.2, 0)), col: '#ffd070', tam: 0.9 });
    }
  }
  // hongos de luz alrededor (verdes) y panes de indio
  for (let i = 0; i < 12; i++) {
    const a = r() * TAU, d = 0.8 + r() * 0.5;
    const p = V3(Math.sin(a) * d, 0.0, Math.cos(a) * d);
    const s = 0.06 + r() * 0.07;
    const gh = lathe([[0.001, 0], [0.15, 0], [0.12, 0.6], [0.5, 0.65], [0.6, 0.8], [0.35, 0.98], [0.001, 1.02]], 10);
    piezas.push(pieza(gh, M4(p, [(r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4], [s * 1.6, s * 1.6, s * 1.6]), '#d8d0b0', { tela: 4 }));
    brillos.push(pieza(deform(esfera(8, 6), (v) => { if (v.y < 0) v.y *= 0.3; }), M4(p.clone().add(V3(0, s * 1.15, 0)), [0, 0, 0], [s * 0.9, s * 0.5, s * 0.9]), i % 3 ? '#b8ff5a' : '#ffb040', { fuerza: 1.2 }));
    if (i % 2 === 0) (g.userData.halos ||= []).push({ p: p.clone().add(V3(0, s * 1.3, 0)), col: i % 3 ? '#b8ff5a' : '#ffb040', tam: 0.6 });
  }
  g.add(fundir(piezas, materialGente()));
  g.add(fundirCorteza(cort));
  { const b = fundirBrillo(brillos); if (b) g.add(b); }
  g.userData.luces = [{ p: V3(0, 1.0, 0.6), col: 0xffc870, i: 1.2, d: 6 }];
  return g;
}
// La madriguera: un tocón viejo de coihue con las raíces en arco, la puertita redonda entreabierta,
// el farol de hongo, una escalerita y lo que se robaron amontonado en la entrada. ~3 m de ancho.
export function armarMadriguera() {
  const g = new THREE.Group(), piezas = [], brillos = [], tela = [];
  const r = azar(66);
  // el tocón, quebrado arriba
  const gt = deform(lathe(afinar([[1.25, -0.2], [1.1, 0.2], [0.95, 0.6], [0.9, 1.4], [0.88, 2.0], [0.7, 2.25], [0.001, 2.3]], 4), 40), (v) => {
    const a = Math.atan2(v.x, v.z), y = v.y;
    let k = 1 + 0.08 * ruido(a * 2, y * 0.6, 1) + 0.04 * Math.sin(a * 11 + y);
    k *= 1 + 0.35 * Math.exp(-y / 0.6) * Math.max(0, Math.sin(a * 4 + 0.6));
    // la boca de la madriguera, adelante: el tocón se ahueca
    if (Math.cos(a) > 0.6 && y < 1.0) k -= 0.35 * sv(1.0, 0.3, y) * sv(0.6, 0.95, Math.cos(a));
    v.x *= k; v.z *= k;
    if (y > 1.9) v.y += 0.35 * Math.sin(a * 3) * sv(1.9, 2.3, y);
  });
  piezas.push(pieza(gt, null, '#4d3b2c', { veta: (l) => [Math.atan2(l.x, l.z) * 1.0, l.y, l.y > 2.1 ? 0.3 : 1], pintar: (c, p, n, l) => { musgoEn(c, p, n, 0.9); c.multiplyScalar(0.75 + 0.35 * sv(0, 2, l.y)); if (l.y > 2.05 && n.y > 0.4) c.copy(colorDe('#9a6a42')); } }));
  // las raíces en arco a los costados de la entrada
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.45;
    piezas.push(raiz([[Math.sin(a) * 0.95, 0.7, Math.cos(a) * 0.95], [Math.sin(a) * 1.55, 0.55, Math.cos(a) * 1.55], [Math.sin(a) * 2.2, -0.05, Math.cos(a) * 2.2]], [0.3, 0.22, 0.08], '#4a3828', { nudos: 0.06, pintar: (c, p, n) => musgoEn(c, p, n, 0.8) }));
  }
  piezas.push(raiz([[-0.6, 0.0, 0.95], [-0.55, 0.85, 1.25], [0.0, 1.15, 1.35], [0.55, 0.85, 1.25], [0.62, 0.0, 0.95]], [0.2, 0.17, 0.16, 0.17, 0.2], '#4a3828', { nudos: 0.04, tramos: 22, pintar: (c, p, n) => musgoEn(c, p, n, 0.7) }));
  // el hueco oscuro y la puertita redonda, entreabierta, con sus herrajes
  brillos.push(pieza(deform(esfera(20, 12), () => {}), M4([0, 0.42, 0.98], [0, 0, 0], [0.48, 0.48, 0.12]), '#0c0806', { fuerza: 1 }));
  brillos.push(pieza(deform(esfera(14, 8), () => {}), M4([0.1, 0.32, 0.9], [0, 0, 0], [0.18, 0.12, 0.05]), '#ffb040', { fuerza: 0.5 }));
  const puerta = lathe([[0.001, -0.02], [0.44, -0.02], [0.44, 0.02], [0.001, 0.02]], 24);
  puerta.rotateX(Math.PI / 2);
  piezas.push(pieza(puerta, M4([-0.62, 0.44, 1.2], [0, -1.15, 0]), '#7a4a2a', { veta: (l) => [l.x * 6, l.y, 0.6], pintar: (c, p, n, l) => { if (Math.abs(Math.sin(l.x * 22)) < 0.12) c.multiplyScalar(0.6); } }));
  for (const y of [0.25, 0.62]) piezas.push(pieza(new THREE.BoxGeometry(0.42, 0.04, 0.05), M4([-0.62, y, 1.2], [0, -1.15, 0]), '#2a2420', { veta: () => [0, 0, 0] }));
  // el farol de hongo colgado de la raíz
  const fl = V3(0.55, 0.85, 1.42);
  piezas.push(pieza(husoG([[0.5, 1.12, 1.35], [0.55, 0.98, 1.42]], [0.01, 0.01], 4, 4), null, '#3a2a1c', { veta: () => [0, 0, 0] }));
  brillos.push(pieza(deform(esfera(12, 10), (v) => { v.multiplyScalar(1 + 0.12 * Math.sin(v.x * 20) * Math.sin(v.y * 20)); }), M4(fl, [0, 0, 0], [0.09, 0.11, 0.09]), '#ffb040', { fuerza: 1.8 }));
  g.userData.halos = [{ p: fl, col: '#ffb040', tam: 1.3 }];
  // la escalerita de ramitas apoyada en el tocón
  for (const sx of [-1, 1]) piezas.push(raiz([[0.95 + sx * 0.12, 0, 0.85], [0.8 + sx * 0.1, 1.6, 0.55]], [0.025, 0.02], '#6a5040'));
  for (let k = 0; k < 6; k++) { const t = (k + 0.5) / 6; piezas.push(raiz([[0.95 - 0.15 * t - 0.12, t * 1.6, 0.85 - 0.3 * t], [0.95 - 0.15 * t + 0.12, t * 1.6, 0.85 - 0.3 * t]], [0.015, 0.015], '#6a5040')); }
  // lo robado: una cuchara, un ovillo de lana, una media, botones y un dedal
  tela.push(pieza(deform(esfera(14, 10), () => {}), M4([0.45, 0.12, 1.55], [0, 0, 0], [0.12, 0.12, 0.12]), '#a8562e', { tela: 1, guarda: (l) => [3, l.y + 0.12, Math.atan2(l.x, l.z) * 0.1, 0.06] }));
  tela.push(pieza(husoG([[0.15, 0.04, 1.75], [0.35, 0.05, 1.9], [0.55, 0.06, 1.8], [0.62, 0.08, 1.68]], [0.06, 0.065, 0.06, 0.055], 10, 8), null, '#d8c8a4', { tela: 4, guarda: (l) => [2, Math.abs(l.x - 0.15) < 0.03 ? 0.01 : 1, l.z, 0.05] }));
  tela.push(pieza(husoG([[-0.2, 0.03, 1.6], [0.05, 0.035, 1.75]], [0.018, 0.012], 6, 6), null, '#c8c8c8', { tela: 12 }));
  tela.push(pieza(deform(esfera(10, 6), (v) => { v.y *= 0.4; }), M4([0.1, 0.03, 1.78], [0, 0, 0], [0.05, 0.05, 0.035]), '#c8c8c8', { tela: 12 }));
  for (let i = 0; i < 5; i++) tela.push(pieza(new THREE.CylinderGeometry(0.025, 0.025, 0.008, 10), M4([-0.1 + r() * 0.4, 0.01, 1.45 + r() * 0.3], [0.1, 0, 0.1]), ['#7a2e2e', '#2c3446', '#c9a64a', '#e2d6bd'][i % 4], { tela: 12 }));
  // un hongo de repisa en el tocón
  for (let i = 0; i < 4; i++) { const a = -0.6 - i * 0.5, y = 1.0 + i * 0.28; piezas.push(pieza(deform(esfera(12, 6), (v) => { if (v.y > 0) v.y *= 0.35; else v.y *= 0.2; }), M4([Math.sin(a) * 0.98, y, Math.cos(a) * 0.98], [0, a, 0], [0.22, 0.12, 0.18]), '#c8a070', { veta: () => [0, 0, 0.1] })); }
  g.add(fundirCorteza(piezas));
  g.add(fundir(tela, materialGente()));
  { const b = fundirBrillo(brillos); if (b) g.add(b); }
  g.userData.luces = [{ p: V3(0.55, 0.95, 1.8), col: 0xffb050, i: 1.4, d: 6 }];
  return g;
}
// Las semillas (lo que juntás): 1, semillas doradas que brillan en un cuenco de musgo; 2, piedras de
// luz verde entre las raíces.
export function armarSemillas(n = 1) {
  const g = new THREE.Group(), piezas = [], brillos = [], tela = [];
  const r = azar(300 + n);
  // el cuenco: un nudo de raíz con musgo
  const gc = deform(lathe(afinar([[0.001, 0.05], [0.25, 0.04], [0.42, 0.12], [0.5, 0.22], [0.46, 0.26], [0.36, 0.2], [0.001, 0.12]], 3), 28), (v) => { v.multiplyScalar(1 + 0.08 * ruido(v.x * 6, v.y * 6, v.z * 6)); });
  piezas.push(pieza(gc, null, '#5a4232', { veta: (l) => [Math.atan2(l.x, l.z), l.y * 4, 0.8], pintar: (c, p, n) => musgoEn(c, p, n, 1, 2) }));
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.3; piezas.push(raiz([[Math.sin(a) * 0.42, 0.1, Math.cos(a) * 0.42], [Math.sin(a) * 0.8, 0.05, Math.cos(a) * 0.8], [Math.sin(a + 0.3) * 1.2, -0.04, Math.cos(a + 0.3) * 1.2]], [0.08, 0.06, 0.02], '#4a3828', { nudos: 0.02, pintar: (c, p, nn) => musgoEn(c, p, nn, 0.8, 2) })); }
  const gota = () => lathe(afinar([[0.001, -1], [0.55, -0.75], [0.72, -0.2], [0.55, 0.45], [0.18, 0.9], [0.001, 1.1]], 3), 16);
  if (n === 1) {
    // semillas doradas: gotas con estrías que brillan por dentro, alguna con la cáscara a medio abrir
    for (let i = 0; i < 9; i++) {
      const a = r() * TAU, d = 0.05 + r() * 0.2;
      const p = V3(Math.sin(a) * d, 0.17 + r() * 0.03, Math.cos(a) * d);
      const s = 0.035 + r() * 0.02, rot = [1.2 + r() * 0.6, r() * 6, 0];
      const gs = deform(gota(), (v) => { const k = 1 + 0.12 * Math.cos(Math.atan2(v.x, v.z) * 8); v.x *= k; v.z *= k; });
      brillos.push(pieza(gs, M4(p, rot, [s, s * 1.2, s]), i % 3 ? '#ffb22e' : '#ffd060', { fuerza: 1.15 }));
      // las vetas de la cáscara (oscuras, a lo largo)
      for (let k = 0; k < 4; k++) { const b = k * 1.57 + r(); tela.push(pieza(husoG([[Math.sin(b) * 0.7, -0.6, Math.cos(b) * 0.7], [Math.sin(b) * 0.76, 0, Math.cos(b) * 0.76], [Math.sin(b) * 0.4, 0.75, Math.cos(b) * 0.4]], [0.08, 0.1, 0.06], 6, 5), M4(p, rot, [s, s * 1.2, s]), '#7a4a12', {})); }
      if (i % 2 === 0) (g.userData.halos ||= []).push({ p: p.clone().add(V3(0, 0.02, 0)), col: '#ffb22e', tam: 0.35 });
    }
    // la grande, parada en el borde
    const p = V3(0.12, 0.31, 0.08);
    brillos.push(pieza(deform(gota(), (v) => { const k = 1 + 0.12 * Math.cos(Math.atan2(v.x, v.z) * 8); v.x *= k; v.z *= k; }), M4(p, [0.2, 0, 0.25], [0.06, 0.075, 0.06]), '#ffd860', { fuerza: 1.4 }));
    (g.userData.halos ||= []).push({ p, col: '#ffc840', tam: 0.9 });
    g.userData.luces = [{ p: V3(0, 0.5, 0.3), col: 0xffc860, i: 0.6, d: 4 }];
  } else {
    // piedras de luz: cantos tallados verdes, con la luz adentro y el borde más oscuro
    for (let i = 0; i < 8; i++) {
      const a = r() * TAU, d = 0.04 + r() * 0.22;
      const p = V3(Math.sin(a) * d, 0.18 + r() * 0.03, Math.cos(a) * d);
      const s = 0.03 + r() * 0.025;
      const gp = deform(new THREE.IcosahedronGeometry(1, 0).toNonIndexed(), (v) => { v.y *= 1.3; });
      gp.computeVertexNormals();
      brillos.push(pieza(gp, M4(p, [r(), r() * 6, r()], [s, s, s]), i % 3 ? '#4aff7a' : '#9aff6a', { fuerza: 1.1 }));
      if (i % 2 === 0) (g.userData.halos ||= []).push({ p, col: '#5aff8a', tam: 0.4 });
    }
    const p = V3(0.1, 0.32, 0.06);
    const gp = deform(new THREE.IcosahedronGeometry(1, 0).toNonIndexed(), (v) => { v.y *= 1.5; });
    gp.computeVertexNormals();
    brillos.push(pieza(gp, M4(p, [0.3, 0.4, 0.2], [0.055, 0.07, 0.055]), '#a8ffb0', { fuerza: 1.35 }));
    (g.userData.halos ||= []).push({ p, col: '#7aff9a', tam: 1.0 });
    g.userData.luces = [{ p: V3(0, 0.5, 0.3), col: 0x7aff9a, i: 0.6, d: 4 }];
  }
  g.add(fundirCorteza(piezas));
  if (tela.length) g.add(fundir(tela, materialGente()));
  { const b = fundirBrillo(brillos); if (b) g.add(b); }
  return g;
}
// La empalizada del fortín (para mirar desde adentro): postes aguzados y un farol
export function armarEmpalizada(largo = 10, conFarol = true, alto = 2.4) {
  const g = new THREE.Group(), piezas = [], brillos = [];
  const r = azar(12);
  const n = Math.round(largo / 0.32);
  for (let i = 0; i < n; i++) {
    const x = -largo / 2 + i * 0.32 + (r() - 0.5) * 0.04, h = alto + r() * 0.3 * (alto / 2.4), rad = 0.13 + r() * 0.03;
    const gp = lathe([[rad * 1.05, -0.3], [rad, h * 0.6], [rad * 0.95, h], [0.001, h + 0.35]], 9);
    piezas.push(pieza(gp, M4([x, 0, (r() - 0.5) * 0.05], [0, r() * 6, (r() - 0.5) * 0.04]), '#6a5040', { veta: (l) => [Math.atan2(l.x, l.z) * 0.2, l.y, l.y > h ? 0.2 : 1], pintar: (c, p, nn, l) => { if (l.y > h) c.copy(colorDe('#a8845a')); c.multiplyScalar(0.8 + 0.3 * sv(0, h, l.y)); } }));
  }
  for (const y of [alto * 0.25, alto * 0.75]) piezas.push(raiz([[-largo / 2, y, -0.2], [largo / 2, y + 0.05, -0.2]], [0.08, 0.08], '#5a4232'));
  if (conFarol) {
    const p = V3(largo * 0.18, alto * 0.88, -0.35);
    piezas.push(raiz([[p.x, p.y + 0.4, -0.15], [p.x, p.y + 0.4, -0.35], [p.x, p.y + 0.25, -0.35]], [0.02, 0.02, 0.02], '#2a2420'));
    brillos.push(pieza(deform(esfera(10, 8), (v) => { v.y *= 1.3; }), M4(p, [0, 0, 0], [0.09, 0.09, 0.09]), '#ffb050', { fuerza: 2 }));
    g.userData.halos = [{ p, col: '#ffb050', tam: 1.4 }];
    g.userData.luces = [{ p: p.clone().add(V3(0, 0, -0.6)), col: 0xffa850, i: 2.4, d: 10 }];
  }
  g.add(fundirCorteza(piezas));
  { const b = fundirBrillo(brillos); if (b) g.add(b); }
  return g;
}

// un poste de cerco con su travesaño (para el que trepa)
export function armarPoste() {
  const g = new THREE.Group(), piezas = [];
  piezas.push(raiz([[0, -0.2, 0], [0.01, 0.7, 0], [0, 1.35, 0.01]], [0.085, 0.08, 0.075], '#6a5040', { nudos: 0.01, pintar: (c, p, n) => { if (n.y > 0.8) c.copy(colorDe('#9a7a52')); musgoEn(c, p, n, 0.5, 2); } }));
  for (const y of [0.45, 1.05]) piezas.push(raiz([[-1.6, y + 0.02, -0.1], [0, y, -0.1], [1.4, y + 0.04, -0.1]], [0.05, 0.05, 0.05], '#5a4232'));
  g.add(fundirCorteza(piezas));
  return g;
}

// ---------------------------------------------------------------- las escenas para las capturas
export function crearDuendesProto({ escena, T, veg, camara, U }) {
  const raiz0 = new THREE.Group();
  raiz0.name = 'duendes-proto';
  escena.add(raiz0);
  let lugar = null, actual = new THREE.Group(), luces = [], haloPts = null;
  raiz0.add(actual);
  // el claro: un llano con árboles alrededor (cerca del bosque, lejos del lago y de la aldea)
  function buscarLugar() {
    if (lugar) return lugar;
    let mejor = null;
    const lista = [];
    for (let x = -380; x <= 380; x += 18) for (let z = -380; z <= 380; z += 18) {
      const y = T.altura(x, z);
      if (!(y > 3)) continue;
      let min = y, max = y;
      for (let a = 0; a < 8; a++) for (const d of [8, 16, 26]) { const h = T.altura(x + Math.cos(a * 0.785) * d, z + Math.sin(a * 0.785) * d); min = Math.min(min, h); max = Math.max(max, h); }
      if (max - min > 2.6) continue;
      const lejos = veg.arbolesCerca(x, z, 40, []).length, cerca = veg.arbolesCerca(x, z, 9, []).length;
      const pts = lejos - cerca * 6 - (max - min) * 4;
      lista.push({ x, z, y, pts, lejos, cerca, des: max - min });
      if (!mejor || pts > mejor.pts) mejor = { x, z, y, pts, lejos, cerca, des: max - min };
    }
    lugar = mejor;
    // el rumbo: la cámara mira hacia donde hay más árboles (el bosque de fondo)
    let ang = 0, mx = -1;
    for (let a = 0; a < 16; a++) {
      const t = a / 16 * TAU, cx = lugar.x + Math.sin(t) * 28, cz = lugar.z + Math.cos(t) * 28;
      const k = veg.arbolesCerca(cx, cz, 14, []).length;
      if (k > mx) { mx = k; ang = t; }
    }
    lugar.rumbo = ang;
    return lugar;
  }
  // del marco del claro (x al costado, z hacia el bosque) al mundo
  const aMundo = (lx, lz) => { const L = buscarLugar(), c = Math.cos(L.rumbo), s = Math.sin(L.rumbo); return { x: L.x + lx * c + lz * s, z: L.z - lx * s + lz * c }; };
  const poner = (obj, lx, lz, giro = 0, dy = 0) => {
    const w = aMundo(lx, lz);
    obj.position.set(w.x, T.altura(w.x, w.z) + dy, w.z);
    obj.rotation.y = buscarLugar().rumbo + Math.PI + giro;
    actual.add(obj);
    return obj;
  };
  const despejados = new Set();
  // sin árboles ni matas, y sin pasto ni helechos (el azul de uEstepa: los pisos de las construcciones)
  const despejar = (lx, lz, radio) => {
    const w = aMundo(lx, lz), k = `${Math.round(w.x)},${Math.round(w.z)},${radio}`;
    if (despejados.has(k)) return; despejados.add(k);
    veg.despejar(w.x, w.z, radio);
    pelados.push([w.x, w.z, radio]);
    pelar(w.x, w.z, radio);
  };
  // (el juego vuelve a pintar el azul cuando cambian sus pisos: `repintar` lo marca de nuevo)
  const pelados = [];
  const repintar = () => { for (const p of pelados) pelar(...p); };
  const pelar = (wx, wz, radio) => {
    const w = { x: wx, z: wz };
    const tex = U && U.uEstepa && U.uEstepa.value; if (!tex) return;
    const d = tex.image.data, n = tex.image.width;
    for (let j = Math.floor((w.z - radio + 512) / 2); j <= Math.ceil((w.z + radio + 512) / 2); j++) for (let i = Math.floor((w.x - radio + 512) / 2); i <= Math.ceil((w.x + radio + 512) / 2); i++) {
      if (i < 0 || j < 0 || i >= n || j >= n) continue;
      if (Math.hypot(i * 2 - 512 - w.x, j * 2 - 512 - w.z) < radio) d[(j * n + i) * 4 + 2] = 255;
    }
    tex.needsUpdate = true;
  };
  function limpiar() {
    raiz0.remove(actual);
    actual.traverse((o) => { if (o.isMesh || o.isPoints) { o.geometry.dispose(); } });
    actual = new THREE.Group(); raiz0.add(actual);
    for (const l of luces) { l.intensity = 0; l.visible = false; if (l.parent) l.parent.remove(l); }
    luces = [];
    haloPts = null;
  }
  // los halos (ojos, hongos, faroles) de todo lo que haya: unos Points con textura suave, sumados
  function juntarHalos() {
    const pos = [], col = [], tam = [];
    actual.updateMatrixWorld(true);
    actual.traverse((o) => {
      const hs = o.userData && o.userData.halos;
      if (hs) for (const h of hs) { const p = h.p.clone().applyMatrix4(o.matrixWorld); const c = colorDe(h.col); pos.push(p.x, p.y, p.z); col.push(c.r, c.g, c.b); tam.push(h.tam * o.matrixWorld.getMaxScaleOnAxis()); }
      if (o.userData && o.userData.ojos && o.userData.brilloOjos && o.userData.haloOjos) for (const e of o.userData.ojos) { const p = e.clone().divideScalar(o.scale.x).applyMatrix4(o.matrixWorld); const c = colorDe(o.userData.brilloOjos); pos.push(p.x, p.y, p.z); col.push(c.r, c.g, c.b); tam.push(0.32 * o.userData.haloOjos * o.matrixWorld.getMaxScaleOnAxis()); }
      if (o.userData && o.userData.luces) for (const L of o.userData.luces) {
        const l = new THREE.PointLight(L.col, L.i, L.d, 2);
        l.position.copy(L.p.clone().applyMatrix4(o.matrixWorld));
        escena.add(l); registrarLuz(l); luces.push(l);
      }
    });
    if (!pos.length) return;
    // dos tamaños: chicos (ojos) y grandes (faroles, el corazón): un Points por tamaño parecido
    const grupos = new Map();
    for (let i = 0; i < tam.length; i++) { const k = Math.round(Math.log2(Math.max(0.05, tam[i])) * 2); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(i); }
    for (const [k, ids] of grupos) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(ids.flatMap((i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]), 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(ids.flatMap((i) => [col[i * 3], col[i * 3 + 1], col[i * 3 + 2]]), 3));
      const m = new THREE.PointsMaterial({ size: 2 ** (k / 2) * 0.9, map: texHalo(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false });
      const p = new THREE.Points(g, m);
      p.frustumCulled = false; p.renderOrder = 5;
      actual.add(p);
      haloPts = p;
    }
  }
  const lado = (i, n, paso) => (i - (n - 1) / 2) * paso;
  // el portón abierto del fortín: la empalizada a los dos lados, con sus faroles
  const porton = () => { poner(armarEmpalizada(6, true, 2.3), -4.3, 0.6, -0.35); poner(armarEmpalizada(6, true, 2.3), 4.3, 0.6, 0.35); };
  // ---- las escenas. Cada una devuelve dónde va la cámara (ojo y mira, en el marco del claro, la
  // altura sobre el piso), la hora y el campo visual.
  const ESC = {
    // opción de estilo: el travieso y el viejo, lado a lado, a la caída del sol
    'opcion-duendes': ({ estilo = 'A' }) => {
      despejar(0, 6, 7);
      const E = ESTILOS[estilo];
      poner(armarDuende(E.travieso(0), 'robando', 3), -0.75, 5.75, -0.05);
      poner(armarDuende(E.viejo(), 'acecho', 4), 0.65, 6.6, -0.3);
      return { ojo: [0, 1.0, 3.2], a: [0, 0.62, 6.4], hora: 19.2, fov: 42 };
    },
    travieso: ({ estilo = 'A' }) => {
      despejar(0, 6, 7);
      const E = ESTILOS[estilo];
      // el poste del cerco: uno trepa, otro escapa con el queso, otro se ríe
      poner(armarPoste(), 1.2, 6.85, 0.0);
      poner(armarDuende(E.travieso(0), 'robando', 3), -0.95, 5.9, 0.2);
      poner(armarDuende(E.travieso(1), 'riendo', 7), 0.05, 6.3, -0.1);
      poner(armarDuende(E.travieso(2), 'trepando', 9), 1.0, 6.85, Math.PI / 2 + 0.25);
      return { ojo: [-0.1, 1.0, 3.9], a: [0.15, 0.62, 6.5], hora: 18.4, fov: 44 };
    },
    'viejo-noche': ({ estilo = 'A' }) => {
      despejar(0, 7, 6);
      const E = ESTILOS[estilo];
      poner(armarDuende(E.viejo(), 'acecho', 4), 0.1, 5.6, -0.1);
      poner(armarDuende(E.viejo(), 'andando', 8), -2.2, 10.0, 0.4);
      return { ojo: [0.3, 1.0, 3.0], a: [0, 1.05, 6.5], hora: 22.6, fov: 50, luna: 0.35 };
    },
    lechuza: ({ estilo = 'A' }) => {
      despejar(0, 8, 8);
      const l = poner(armarLechuza(estilo), 0.2, 5.2, 1.2, 1.55);
      l.rotation.z = -0.12;
      const l2 = poner(armarLechuza(estilo), -5, 16, 1.3, 7.5); l2.scale.setScalar(0.9); l2.rotation.z = 0.2;
      return { ojo: [-0.5, 1.65, 2.3], a: [0.3, 1.75, 5.6], hora: 19.6, fov: 52 };
    },
    rey: ({ n = 1 }) => {
      despejar(0, 6, 7);
      poner(armarRey(n), 0, 6.5, 0);
      return { ojo: [0.3, 1.65, 2.6], a: [0, 2.2, 6.5], hora: 20.0, fov: 54 };
    },
    'opcion-rey': ({ n = 1 }) => {
      despejar(0, 6, 7);
      poner(armarRey(n), 0, 6.5, 0);
      return { ojo: [0.3, 1.65, 2.6], a: [0, 2.2, 6.5], hora: 20.0, fov: 54 };
    },
    'opcion-coihue': ({ n = 1 }) => {
      despejar(0, 30, 16);
      despejar(0, 12, 9);
      poner(armarCoihue(n), 0, 22, 0);
      porton();
      return { ojo: [0.3, 1.65, -1.2], a: [0, 10.5, 22], hora: 20.75, fov: 64, luna: 0.9 };
    },
    'coihue-afuera': ({ n = 1, estilo = 'A' }) => {
      despejar(0, 30, 16);
      despejar(0, 12, 9);
      poner(armarCoihue(n), 0, 24, 0.1);
      porton();
      const E = ESTILOS[estilo];
      for (let i = 0; i < 7; i++) poner(armarDuende(i % 3 === 0 ? E.viejo() : E.travieso(i), i % 2 ? 'corriendo' : 'andando', 40 + i), lado(i, 7, 1.6) + (i % 2) * 0.5, 8 + (i % 3) * 2.6, Math.PI * 0 + (i - 3) * 0.08);
      return { ojo: [0.3, 1.65, -1.2], a: [0, 9.5, 24], hora: 21.6, fov: 64, luna: 1.6 };
    },
    'coihue-adentro': ({ n = 1 }) => {
      // la sala, en el claro (las paredes tapan el bosque); el piso apenas sobre la tierra
      despejar(0, 6, 7);
      const a = armarAdentro(n);
      poner(a, 0, 6, 0, 0.12);
      return { ojo: [0, 1.65, 3.4], a: [0, 1.9, 8.6], hora: 23, fov: 74 };
    },
    'nido-madriguera': () => {
      despejar(0, 5, 6);
      poner(armarNido(), -1.15, 4.6, 0.3);
      poner(armarMadriguera(), 1.6, 6.4, -0.45);
      return { ojo: [-0.2, 1.45, 1.6], a: [0.3, 0.5, 5.6], hora: 20.1, fov: 55 };
    },
    'opcion-semillas': ({ n = 1 }) => {
      despejar(0, 2, 3);
      poner(armarSemillas(n), 0, 2.2, 0);
      return { ojo: [0, 1.0, 1.05], a: [0, 0.2, 2.2], hora: 20.3, fov: 34 };
    },
    // la noche grande: 30 duendes salen del bosque hacia el fortín (con un par de lechuzas)
    ataque: ({ estilo = 'A', cuantos = 30 }) => {
      despejar(0, 14, 13);
      porton();
      const E = ESTILOS[estilo];
      const r = azar(3);
      // variantes: se arman 8 y se clonan (comparten geometría)
      const moldes = [];
      for (let i = 0; i < 8; i++) moldes.push(armarDuende(i % 4 === 3 ? E.viejo() : E.travieso(i), ['corriendo', 'andando', 'corriendo', 'acecho', 'farol', 'corriendo', 'andando', 'acecho'][i], 60 + i));
      for (let i = 0; i < cuantos; i++) {
        const fila = Math.floor(i / 6), col = i % 6;
        const m = moldes[(i * 5) % 8];
        const d = m.clone();
        d.userData = { ...m.userData };
        poner(d, (col - 2.5) * (1.3 + fila * 0.35) + (r() - 0.5) * 0.9, 3.6 + fila * 2.6 + r() * 1.2, (r() - 0.5) * 0.6);
      }
      const l1 = poner(armarLechuza(estilo), -3, 15, 0.3, 6.5); l1.rotation.z = -0.2;
      const l2 = poner(armarLechuza(estilo), 4.5, 22, -0.2, 9); l2.rotation.z = 0.25;
      return { ojo: [0.2, 1.65, -1.6], a: [0, 0.9, 12], hora: 22.0, fov: 62, luna: 1.1 };
    },
  };
  function armar(nombre, opciones = {}) {
    limpiar();
    buscarLugar();
    // la cámara con la luz a la espalda (un poco de costado): las caras se ven
    const sol = U && U.uSolDir && U.uSolDir.value;
    if (sol && opciones.contraluz == null) {
      // y de las direcciones cerca de esa, la que tenga más bosque adelante (no la vía ni el lago)
      const ideal = Math.atan2(-sol.x, -sol.z) + 0.45;
      let mejor = ideal, pts = -1e9;
      for (let d = -1.1; d <= 1.1; d += 0.1) {
        const ru = ideal + d;
        let k = 0;
        for (const dist of [16, 24, 32, 40]) for (const lat of [-0.45, -0.2, 0, 0.2, 0.45]) { const a = ru + lat; k += veg.arbolesCerca(lugar.x + Math.sin(a) * dist, lugar.z + Math.cos(a) * dist, 6, []).length > 0 ? 1 : 0; }
        const v = k - Math.abs(d) * 4;
        if (v > pts) { pts = v; mejor = ru; }
      }
      lugar.rumbo = mejor;
    }
    const f = ESC[nombre];
    if (!f) throw new Error('escena desconocida: ' + nombre);
    const t0 = performance.now();
    const cam = f(opciones);
    // la luna llena: una luz fría, de costado y de arriba (sólo en las escenas de noche)
    if (cam.luna) {
      const L = buscarLugar(), a = L.rumbo + Math.PI + 0.6;
      const luz = new THREE.DirectionalLight(0x9fb2dc, cam.luna);
      luz.position.set(L.x + Math.sin(a) * 40, L.y + 60, L.z + Math.cos(a) * 40);
      luz.target.position.set(L.x, L.y, L.z);
      actual.add(luz); actual.add(luz.target);
    }
    juntarHalos();
    const ms = performance.now() - t0;
    // la cámara al mundo
    let o, a;
    if (cam.ojoMundo) {
      const b = cam.base, c = Math.cos(buscarLugar().rumbo), s = Math.sin(buscarLugar().rumbo);
      const w = (v) => ({ x: b[0] + v[0] * c + v[2] * s, y: b[1] + v[1], z: b[2] - v[0] * s + v[2] * c });
      o = w(cam.ojo); a = w(cam.a);
    } else {
      const wo = aMundo(cam.ojo[0], cam.ojo[2]), wa = aMundo(cam.a[0], cam.a[2]);
      o = { x: wo.x, z: wo.z, y: T.altura(wo.x, wo.z) + cam.ojo[1] };
      a = { x: wa.x, z: wa.z, y: T.altura(wa.x, wa.z) + cam.a[1] };
    }
    return { o, a, hora: cam.hora, fov: cam.fov, ms: Math.round(ms) };
  }
  // lo que cuesta lo que está armado
  function medir() {
    let mallas = 0, tri = 0, vert = 0, duendes = 0;
    actual.traverse((o) => {
      if (o.isMesh) { mallas++; const g = o.geometry; tri += (g.index ? g.index.count : g.attributes.position.count) / 3; vert += g.attributes.position.count; }
      if (o.isPoints) mallas++;
      if (o.userData && o.userData.ojos !== undefined && o.isGroup) duendes++;
    });
    return { mallas, tri: Math.round(tri), vert, duendes, luces: luces.length };
  }
  return { armar, limpiar, medir, repintar, lugar: buscarLugar, ESTILOS, raiz: raiz0, actual: () => actual, camara };
}
