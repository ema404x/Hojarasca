// 3.8.0: el Coihue Viejo, el Rey Duende y las semillas doradas, al estilo P (los del prototipo
// aprobado por el usuario el 08-10: Coihue 3 · musgo, puertitas y ventanas encendidas; Rey 2 · gigante de
// corteza con cuernos de ámbar; semillas doradas). Sólo arma mallas: lo que hacen en el Desafío está en
// desafio-eventos.js (la noche final), desafio-asedio-mundo.js (el asedio) y desafio-nave-mundo.js (el
// corazón del Coihue, adentro).
//   · Las piezas se funden en pocas mallas: la corteza (vetas por shader, `matCorteza`), la ropa y la
//     piel del Rey con el material de la gente (el atlas de gente-atlas.js), y lo que brilla (MeshBasic).
//   · La copa del Coihue se arma con las cartas de hojas del bosque (vegetacion.js) y el material del
//     sotobosque y los frutales: el mismo programa, nada nuevo que compilar.
//   · El Rey lleva huesos (torso, cabeza y los dos brazos, con los pivotes de la gente: cuello y hombros):
//     cada uno es una malla que se mueve entera, para sus poses (llamar, golpear el piso, señalar).
//   · `testigosCoihue` arma una malla chiquita de cada material, para compilarlos en la carga.
import * as THREE from 'three';
import { materialGente } from './gente-cuerpo.js';
import { huso, coser } from './formas.js';
import { ConstructorArbol, racimo, rama, conCartas, texturaCartas, CELDAS_CARTA } from './vegetacion.js';
import { materialVegetal, U } from './materiales.js';

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
let MAT_BRILLO = null, MAT_CORTEZA = null, TEX_HALO = null;
const matBrillo = () => MAT_BRILLO || (MAT_BRILLO = new THREE.MeshBasicMaterial({ vertexColors: true }));
// la corteza: vetas hondas a lo largo (en el espacio de la pieza), musgo arriba y el color pintado
function matCorteza() {
  if (MAT_CORTEZA) return MAT_CORTEZA;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uNocheC = U.uNoche;   // 3.8.4: la noche (la luna en el borde, el ámbar en las grietas)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aVeta; varying vec3 vVeta; varying vec3 vNorC; varying float vAltC;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvVeta = aVeta; vNorC = normal; vAltC = (modelMatrix * vec4(position, 1.0)).y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vVeta; varying vec3 vNorC; varying float vAltC; uniform float uNocheC;
        float grietaC = 0.0, finoC = 1.0, placaLejosC = 0.0;
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
          // 3.8.4: de lejos las grietas finas (más finas que un píxel) titilaban y la corteza quedaba como un barro
          // oscuro y parejo: cuando se achican se funden en su promedio y quedan las placas grandes, que sí se
          // leen de lejos (un poco más marcadas)
          finoC = clamp(1.6 - fwidth(u.x * 1.6) * 3.0, 0.0, 1.0);
          grietaC = grieta * finoC;
          placaLejosC = nC(vec2(u.x * 0.55, u.y * 0.12));
          diffuseColor.rgb *= mix(1.0, (0.8 + placa) * mix(0.87, 1.0 - 0.62 * grieta, finoC) * (1.0 + (1.0 - finoC) * (placaLejosC - 0.5) * 0.45), k);
          diffuseColor.rgb *= 0.92 + 0.16 * mix(0.5, nC(u * 9.0), finoC);
          // 3.8.0: la luz propia sigue el color y las vetas (no aplana la corteza de noche)
          totalEmissiveRadiance *= diffuseColor.rgb * 3.0;
          // y de lejos un poco más (de noche se lee la silueta del Coihue contra el bosque; de día no se nota)
          totalEmissiveRadiance += diffuseColor.rgb * 0.09 * smoothstep(40.0, 150.0, length(vViewPosition));
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        // 3.8.4: de noche, afuera (adentro del Coihue no hay luna: la sala está a más de 400 m de alto), la luna
        // marca en frío el borde del tronco y de las raíces y las placas de la corteza, y en el fondo de las
        // grietas late un ámbar apenas (la casa de los duendes está viva): de lejos se lee un árbol con corteza,
        // no una mancha negra
        {
          float afueraC = uNocheC * step(vAltC, 400.0) * vVeta.z;
          float bordeC = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.2);
          totalEmissiveRadiance += vec3(0.3, 0.38, 0.52) * (bordeC * 0.03 + 0.004 * placaLejosC * (1.0 - finoC * 0.5)) * afueraC;
          totalEmissiveRadiance += vec3(1.0, 0.5, 0.14) * grietaC * afueraC * 0.012;
        }`);
  };
  // 3.8.0: un poco de luz propia, tibia: de noche la corteza no queda negra (el musgo y las vetas se leen)
  m.emissive.set('#3a2618');
  m.customProgramCacheKey = () => 'coihue-corteza-38';   // 3.8.0: clave propia (los duendes comunes tienen la suya)
  return (MAT_CORTEZA = m);
}
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
// ---------------------------------------------------------------- las poses
// Las metas de las manos y los pies, en el espacio de la figura (escala de persona; mira a +z).
// `inclina` (adelante +), `gira`, `cabeza` [cabeceo (abajo +), giro, ladeo]. `foco`: lo que lleva en
// las manos (queso, farol, bastón...).
const POSES = {
  trono: () => ({ inclina: -0.05, cabeza: [0.08, 0, 0], sentado: 1, cadera: 0,
    manos: [[0.42, 0.62, 0.32], [-0.42, 0.64, 0.32]], pies: [[0.2, 0, 0.42, 0.2], [-0.2, 0, 0.42, -0.2]] }),
};

// ---------------------------------------------------------------- un duende
// Devuelve { g (grupo, en metros), ojos [posiciones locales], brillos [{p, col, tam}] }
function armarDuende(P, poseNombre = 'parado', semilla = 1, conHuesos = false) {
  const pose = (POSES[poseNombre] || POSES.parado)();
  const r = azar(semilla * 97 + 13);
  const piezas = [], brillos = [], halos = [];
  // 3.8.0: cada pieza sabe de qué hueso es (torso, cabeza, brazo0, brazo1)
  let hueso = 'torso';
  const pivotes = { torso: V3(), cabeza: V3(), brazo0: V3(), brazo1: V3() };
  for (const lista of [piezas, brillos]) { const push = lista.push.bind(lista); lista.push = (...q) => { for (const x of q) x.hueso = hueso; return push(...q); }; }
  const C = P.cuerpo, R = P.cab, F = P.faceta;
  const sentado = !!pose.sentado;
  // ---- la pelvis y el torso
  const caderaY = sentado ? 0.5 : C.cadera + (pose.cadera || 0) * (pose.cadera > 0.3 ? 1 : 0.6);
  const pelvis = V3(0, caderaY, sentado ? -0.05 : 0);
  if (pose.cadera > 0.3) pelvis.z -= 0.05;
  pivotes.torso.copy(pelvis);
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
    hueso = 'brazo' + s; pivotes[hueso].copy(hombro);
    const meta = pose.manos[s];
    const mano = V3(meta[0] * (0.9 + 0.1 * anchoT), meta[1] * (sentado ? 1 : 1) + (sentado ? 0 : (C.cadera - 0.6) * 0.8), meta[2]);
    if (C.encorvado && !sentado) { mano.z += C.encorvado * 0.25; mano.y -= C.encorvado * 0.18; }
    const la = 0.27 * C.brazo, lb = 0.25 * C.brazo;
    // la mano no puede quedar más lejos que el brazo: se acerca
    const d = mano.clone().sub(hombro); if (d.length() > (la + lb) * 0.98) mano.copy(hombro).addScaledVector(d.normalize(), (la + lb) * 0.98);
    const codo = ik(hombro, mano, la, lb, V3(sx * 0.6, -0.3, -1));
    // 3.8.4: el codo y la muñeca, para la piel por huesos del Rey
    pivotes['codo' + s] = codo.clone(); pivotes['mano' + s] = mano.clone();
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
  hueso = 'cabeza'; pivotes.cabeza.copy(cuello);
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
  hueso = 'torso';
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
  const g = new THREE.Group();
  if (conHuesos) {
    // 3.8.4: piel por huesos (antes, una malla rígida por hueso: el brazo giraba entero desde el hombro, como
    // un muñeco articulado). Una sola malla con su esqueleto: el torso, la cabeza y en cada brazo el hombro, el
    // codo y la mano; cada vértice reparte su peso entre los huesos vecinos (el hombro tira de la ropa del
    // torso, el codo se dobla de verdad, la muñeca acompaña). Las mismas cuentas de piel que la gente.
    // (la cabeza y los brazos cuelgan del torso: si el torso se inclina, lo siguen)
    const huesos = {};
    const nuevo = (h, padre, pos) => { const b = new THREE.Group(); b.name = 'rey-' + h; b.position.copy(pos); padre.add(b); huesos[h] = b; return b; };
    nuevo('torso', g, pivotes.torso);
    nuevo('cabeza', huesos.torso, pivotes.cabeza.clone().sub(pivotes.torso));
    for (const s of [0, 1]) {
      nuevo('brazo' + s, huesos.torso, pivotes['brazo' + s].clone().sub(pivotes.torso));
      nuevo('codo' + s, huesos['brazo' + s], pivotes['codo' + s].clone().sub(pivotes['brazo' + s]));
      nuevo('mano' + s, huesos['codo' + s], pivotes['mano' + s].clone().sub(pivotes['codo' + s]));
    }
    // de qué hueso es cada vértice (en el orden en que `fundir` los junta)
    const tags = [];
    for (const q of piezas) for (let i = 0, n = q.geo.attributes.position.count; i < n; i++) tags.push(q.hueso);
    const cuerpo = fundir(piezas, materialGente());
    const malla = new MallaRey(cuerpo.geometry, cuerpo.material);
    malla.castShadow = cuerpo.castShadow; malla.receiveShadow = true;
    pesosRey(malla.geometry, tags, pivotes);
    g.add(malla);
    // lo que brilla va rígido en su hueso (los brillos de un brazo, en la mano)
    for (const h of ['torso', 'cabeza', 'brazo0', 'brazo1']) {
      const b = fundirBrillo(brillos.filter((q) => q.hueso === h));
      if (!b) continue;
      const en = h.startsWith('brazo') ? 'mano' + h.slice(-1) : h;
      b.position.copy(pivotes[en]).negate();
      huesos[en].add(b);
    }
    g.updateMatrixWorld(true);
    malla.skeleton = new EsqueletoRey(HUESOS_REY.map((h) => huesos[h]), malla);
    g.userData.huesos = huesos;
    g.userData.pivotes = pivotes;
    g.userData.piel = malla;
  } else {
    const cuerpo = fundir(piezas, materialGente());
    const brillo = fundirBrillo(brillos);
    g.add(cuerpo); if (brillo) g.add(brillo);
  }
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


// ---------------------------------------------------------------- 3.8.0: los halos
// Unos Points con la textura suave, sumados (ojos, faroles, ámbar): uno por tamaño parecido. `escala`: la
// del mundo de lo que los lleva (el tamaño de un punto no sigue a la escala del padre).
const MAT_HALO = new Map();
function matHalo(tam) {
  const k = Math.round(tam * 100);
  let m = MAT_HALO.get(k);
  if (!m) {
    m = new THREE.PointsMaterial({ size: tam, map: texHalo(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false });
    MAT_HALO.set(k, m);
  }
  return m;
}
export function halosDe(lista, escala = 1) {
  const g = new THREE.Group();
  const grupos = new Map();
  for (const h of lista || []) { const k = Math.round(Math.log2(Math.max(0.05, h.tam * escala)) * 2); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(h); }
  for (const [k, hs] of grupos) {
    const pos = [], col = [];
    for (const h of hs) { const c = colorDe(h.col); pos.push(h.p.x, h.p.y, h.p.z); col.push(c.r, c.g, c.b); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const p = new THREE.Points(geo, matHalo(2 ** (k / 2) * 0.9));
    p.frustumCulled = false; p.renderOrder = 5;
    g.add(p);
  }
  return g;
}

// ---------------------------------------------------------------- 3.8.4: la piel por huesos del Rey
// Como en gente-cuerpo.js y tren.js (el three del juego no trae SkinnedMesh): una malla con `isSkinnedMesh` y un
// esqueleto mínimo (update y boneTexture; three lo actualiza una vez por cuadro). Los huesos son los grupos de la
// figura; `inversas`, la inversa de cada uno en la pose de armado.
export const HUESOS_REY = ['torso', 'cabeza', 'brazo0', 'codo0', 'mano0', 'brazo1', 'codo1', 'mano1'];
class EsqueletoRey {
  constructor(huesos, malla) {
    this.huesos = huesos; this.malla = malla;
    const inv = new THREE.Matrix4().copy(malla.matrixWorld).invert();
    this.inversas = huesos.map((h) => new THREE.Matrix4().multiplyMatrices(inv, h.matrixWorld).invert());
    this.boneMatrices = new Float32Array(8 * 8 * 4);   // (una textura de 8 × 8: cuatro téxeles por hueso, hasta 16 huesos)
    this.boneTexture = new THREE.DataTexture(this.boneMatrices, 8, 8, THREE.RGBAFormat, 1015 /* FloatType */);
    this._inv = new THREE.Matrix4(); this._m = new THREE.Matrix4();
    this.update();
  }
  computeBoneTexture() { return this; }
  update() {
    this._inv.copy(this.malla.matrixWorld).invert();
    for (let i = 0; i < this.huesos.length; i++) {
      this._m.multiplyMatrices(this._inv, this.huesos[i].matrixWorld).multiply(this.inversas[i]);
      this._m.toArray(this.boneMatrices, i * 16);
    }
    this.boneTexture.needsUpdate = true;
  }
  dispose() { this.boneTexture.dispose(); }
}
class MallaRey extends THREE.Mesh {
  constructor(geo, mat) {
    super(geo, mat);
    this.isSkinnedMesh = true;
    this.bindMode = 'attached';
    this.bindMatrix = new THREE.Matrix4(); this.bindMatrixInverse = new THREE.Matrix4();
    this.frustumCulled = false;   // (la caja de la pose de armado no sigue a los brazos levantados)
  }
  applyBoneTransform(i, v) { return v; }
  raycast() {}
}
// Los pesos de cada vértice (en el espacio de la figura, en la pose de armado). `tags`: el hueso de la pieza de
// cada vértice ('torso', 'cabeza', 'brazo0', 'brazo1'). El brazo se reparte entre el hombro, el codo y la mano según
// en qué tramo cae; cerca de cada articulación se mezcla con el vecino. La ropa del torso pegada al hombro sigue un
// poco al brazo. La cabeza va entera (la barba y el cuello de hojas tapan la unión).
const _aRey = V3(), _bRey = V3(), _qRey = V3();
function tramoRey(p, a, b) {
  _bRey.subVectors(b, a); _qRey.subVectors(p, a);
  const t = _qRey.dot(_bRey) / Math.max(1e-9, _bRey.lengthSq());
  _aRey.copy(a).addScaledVector(_bRey, cl(t, 0, 1));
  return { t, d: _aRey.distanceTo(p) };
}
function pesosRey(geo, tags, piv) {
  const P = geo.attributes.position, n = P.count;
  const si = new Float32Array(n * 4), sw = new Float32Array(n * 4);
  const I = Object.fromEntries(HUESOS_REY.map((h, i) => [h, i]));
  const p = V3();
  for (let i = 0; i < n; i++) {
    p.fromBufferAttribute(P, i);
    const w = new Map();
    const sumar = (h, x) => { if (x > 1e-3) w.set(h, (w.get(h) || 0) + x); };
    const tag = tags[i] || 'torso';
    if (tag === 'cabeza') sumar('cabeza', 1);
    else if (tag === 'torso') {
      let resto = 1;
      for (const s of [0, 1]) {
        const k = 0.45 * (1 - sv(0.05, 0.16, p.distanceTo(piv['brazo' + s])));
        if (k > 0) { sumar('brazo' + s, k); resto -= k; }
      }
      sumar('torso', Math.max(0, resto));
    } else {
      const s = tag.slice(-1), H = piv['brazo' + s], C = piv['codo' + s], M = piv['mano' + s];
      const u = tramoRey(p, H, C), f = tramoRey(p, C, M);
      if (f.t > 0.92 && f.d < u.d + 0.05) {
        // la mano (y el puño): pasando la muñeca, toda de la mano
        const k = sv(0.92, 1.04, f.t);
        sumar('mano' + s, k); sumar('codo' + s, 1 - k);
      } else if (u.d <= f.d) {
        // el brazo: cerca del hombro tira del torso, cerca del codo acompaña al antebrazo
        const kt = 0.4 * (1 - sv(0.0, 0.28, u.t)), kc = 0.5 * sv(0.7, 1.0, u.t);
        sumar('torso', kt); sumar('codo' + s, kc); sumar('brazo' + s, 1 - kt - kc);
      } else {
        const kh = 0.5 * (1 - sv(0.0, 0.25, f.t));
        sumar('brazo' + s, kh); sumar('codo' + s, 1 - kh);
      }
    }
    const lista = [...w.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4);
    const tot = lista.reduce((a, x) => a + x[1], 0) || 1;
    for (let r = 0; r < 4; r++) {
      si[i * 4 + r] = r < lista.length ? I[lista[r][0]] : 0;
      sw[i * 4 + r] = r < lista.length ? lista[r][1] / tot : 0;
    }
  }
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
}

// ---------------------------------------------------------------- 3.8.0: el Rey Duende (opción 2)
// Gigante de corteza con cuernos de ámbar, en su trono de raíces. En metros (sentado, unos 2,7 m: en el
// corazón del Coihue va agrandado, ver desafio-nave-mundo.js). Mira a +z. Devuelve el grupo con
// `userData.huesos` (torso, cabeza, brazo0 = el de +x, brazo1) para las poses.
const REY = mezclar(BASE, {
  k: 2.05, cab: 0.2, cabEsc: [1.05, 1.0, 1.0], piel: { col: '#7a6450', tipo: 'corteza', mejillas: null, ruido: 0.08 },
  nariz: { largo: 1.2, punta: 1.3, forma: 'papa' }, orejas: { largo: 1.1, ancho: 1.3 },
  ojos: { brillo: '#ffb030', fuerza: 3.2, parpado: 0.4, halo: 1.2 }, cejas: { col: '#4a3a2a', grosor: 2.4, angulo: -0.3 }, boca: 'mueca',
  gorro: { sin: 1 }, pelo: { col: '#4a5a32', mechones: 0 },
  barba: { tipo: 'larga', col: '#7a8a5a', largo: 1.1, liquen: 1, musgo: 0.6 }, bigote: null,
  cuerpo: { torso: 0.58, panza: 0.16, ancho: 1.35, brazo: 1.15, gBrazo: 1.5, gPierna: 1.4 },
  ropa: { saco: '#4a3a2a', tela: 3, guardaSaco: [11, 0.1], pantalon: '#3a2e22', botas: '#2a2016', remiendos: [], largo: 0.25 },
  capa: { tipo: 'musgo', col: '#3e5a2a', musgo: 1 }, manos: { nudosas: 1, dedos: 1.3 },
});
export function armarRey(escala = 1) {
  const g = new THREE.Group();
  const piezas = [], brillos = [];
  trono(piezas, brillos);
  g.add(fundirCorteza(piezas));
  { const b = fundirBrillo(brillos); if (b) g.add(b); }
  const P = REY;
  const d = armarDuende(P, 'trono', 33, true);
  // sentado en el trono (el asiento a 0,93 m; la pelvis del duende a 0,5 × k)
  d.position.set(0, 0.93 - 0.5 * P.k + 0.06, 0.15);
  g.add(d);
  const yc = d.position.y + d.userData.cabeza.y, zc = d.position.z + d.userData.cabeza.z, k = P.k;
  const piezas2 = [], brillos2 = [], halos = [];
  // los cuernos de hueso con puntas de ámbar que brillan, y la corona de raíz
  for (const sx of [-1, 1]) {
    const pts = [[sx * 0.14 * k, yc + 0.12 * k, zc - 0.02 * k], [sx * 0.3 * k, yc + 0.3 * k, zc - 0.06 * k], [sx * 0.38 * k, yc + 0.5 * k, zc + 0.04 * k], [sx * 0.33 * k, yc + 0.66 * k, zc + 0.14 * k]];
    piezas2.push(pieza(husoG(pts, [0.06, 0.05, 0.035, 0.005].map((v) => v * k), 14, 9), null, '#d8c8a8', { veta: (l) => [Math.atan2(l.x, l.z) * 0.1, l.y * 3, 0.25], pintar: (c, p) => { if (Math.sin(p.y * 90) > 0.6) c.multiplyScalar(0.8); } }));
    brillos2.push(pieza(husoG([pts[2], pts[3]], [0.04 * k, 0.008 * k], 8, 8), null, '#ff9a20', { fuerza: 2 }));
    halos.push({ p: V3(...pts[2]).lerp(V3(...pts[3]), 0.5), col: '#ff9a20', tam: 1.6 });
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    piezas2.push(raiz([[Math.sin(a) * 0.19 * k, yc + 0.14 * k, zc + Math.cos(a) * 0.19 * k], [Math.sin(a + 0.4) * 0.22 * k, yc + 0.24 * k, zc + Math.cos(a + 0.4) * 0.22 * k], [Math.sin(a + 0.6) * 0.18 * k, yc + 0.3 * k, zc + Math.cos(a + 0.6) * 0.18 * k]], [0.03, 0.025, 0.006].map((v) => v * k), '#4a3626', { nudos: 0.01, pintar: (c, p, n) => musgoEn(c, p, n, 0.8) }));
  }
  // los cuernos van en el hueso de la cabeza: del espacio del grupo al del hueso
  const cab = d.userData.huesos.cabeza, piv = d.userData.pivotes.cabeza;
  const enCabeza = (m) => { m.scale.setScalar(1 / k); m.position.set(-d.position.x / k - piv.x, -d.position.y / k - piv.y, -d.position.z / k - piv.z); cab.add(m); };
  enCabeza(fundirCorteza(piezas2));
  enCabeza(fundirBrillo(brillos2));
  enCabeza(halosDe(halos, escala));
  // el brillo de los ojos (también en la cabeza: los ojos de la figura, sin la escala)
  cab.add(halosDe(d.userData.ojos.map((o) => ({ p: o.clone().divideScalar(k).sub(piv), col: '#ffb030', tam: 0.32 * 1.2 * k })), escala));
  g.userData.huesos = d.userData.huesos;
  g.userData.figura = d;
  g.userData.cabeza = V3(0, yc, zc);
  return g;
}

// ---------------------------------------------------------------- 3.8.0: el Coihue Viejo (opción 3)
// Un coihue gigante y hueco, casa de los duendes: cubierto de musgo, con puertitas y ventanas encendidas,
// que camina con sus raíces. En metros (el fuste de 24 m, sostenido 3 m sobre el piso por seis raíces-patas;
// en el juego va agrandado, `COIHUE.escala`). Mira a +z: adelante está la puerta grande, con su escalera de
// raíces hasta el piso. Devuelve { g (en el piso), cuerpo (lo que se mece y sube al andar), patas (los
// pivotes de las raíces), copa, brasas (dónde van los tres núcleos de la noche final), puerta (la luz de la
// puerta grande), farol (dónde va la luz de la puerta) }.
export const COIHUE = { alto: 24, alza: 3, escala: 1.7 };
let MAT_COPA = null;
const matCopa = () => MAT_COPA || (MAT_COPA = conCartas(materialVegetal({ flex: 1, copa: true, doble: true }), texturaCartas()));
export function armarCoihueViejo() {
  const g = new THREE.Group(), cuerpo = new THREE.Group();
  g.add(cuerpo);
  const piezas = [], brillos = [], halos = [];
  const r = azar(451);
  const H = COIHUE.alto, alza = COIHUE.alza;
  const radio = (y) => { const t = y / H; return 2.6 * (1 - 0.5 * t) * (1 + 0.55 * Math.exp(-((y / 1.6) ** 2))) * (t > 0.85 ? 1 - (t - 0.85) * 3 : 1); };
  // el fuste: la corteza con vetas, el musgo casi por todo
  {
    const lados = 56, filas = 70;
    const perf = []; for (let j = 0; j <= filas; j++) perf.push([1, (j / filas) * H]);
    const gt = lathe(perf, lados);
    deform(gt, (v) => {
      const y = v.y, a = Math.atan2(v.x, v.z);
      let rr = radio(y) * (1 + 0.1 * ruido(a * 2, y * 0.25, 0) + 0.05 * Math.sin(a * 13 + y * 0.3) + 0.03 * Math.sin(a * 31 + y * 0.9));
      rr *= 1 + 0.25 * Math.exp(-y / 2.2) * Math.max(0, Math.sin(a * 5 + 0.5));
      v.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
    });
    piezas.push(pieza(gt, M4([0, alza, 0]), '#4d3b2c', {
      veta: (l) => [Math.atan2(l.x, l.z) * 2.2, l.y, 1],
      pintar: (c, p, n, l) => {
        const a = Math.atan2(l.x, l.z), y = l.y;
        c.multiplyScalar(0.7 + 0.45 * sv(0, H * 0.6, y));
        tinta(c, '#6a5a48', 0.3 * sv(0.2, 0.8, ruido(a * 3, y * 0.4, 1)));
        const mus = 0.85 * sv(-0.4, 0.5, ruido(a * 2, y * 0.35, 3) + 0.3);
        tinta(c, '#4a6a2c', mus);
        c.multiplyScalar(0.85 + 0.3 * (ruido(a * 20, y * 4, 2) * 0.5 + 0.5) * mus);
      },
    }));
    // la panza del tronco (lo que se ve desde abajo, entre las raíces): un disco de madera
    piezas.push(pieza(new THREE.CircleGeometry(radio(0) * 1.05, 32).rotateX(Math.PI / 2), M4([0, alza + 0.05, 0]), '#3a2a1e', { veta: (l) => [l.x, l.z, 0.6] }));
  }
  // las raíces-patas: seis, que levantan el tronco. Cada una en su pivote (donde sale del tronco)
  const patas = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.5 + (r() - 0.5) * 0.3;
    const s = Math.sin(a), c = Math.cos(a);
    const r0 = 2.0, r1 = 4.8 + r() * 0.8, r2 = 6.6 + r() * 1.2;
    const pts = [[s * r0, alza + 1.5, c * r0], [s * (r0 + 1.4), alza + 1.1, c * (r0 + 1.4)], [s * r1, alza + 1.2, c * r1], [s * (r1 + 0.9), (alza + 1.2 - 0.3) * 0.5, c * (r1 + 0.9)], [s * r2, -0.3, c * r2]];
    const pz = [raiz(pts, [1.15, 0.95, 0.75, 0.55, 0.38], '#4a3828', { nudos: 0.18, tramos: 22, lados: 12, pintar: (cc, p, nn) => musgoEn(cc, p, nn, 1, 0.6) })];
    for (let k = 0; k < 3; k++) {
      const b = a + (k - 1) * 0.35, e = V3(...pts[4]);
      pz.push(raiz([[e.x, e.y + 0.2, e.z], [e.x + Math.sin(b) * 0.9, e.y - 0.1, e.z + Math.cos(b) * 0.9], [e.x + Math.sin(b) * 1.7, e.y - 0.25, e.z + Math.cos(b) * 1.7]], [0.32, 0.2, 0.04], '#43332a', { nudos: 0.06 }));
    }
    const piv = new THREE.Group();
    piv.position.set(...pts[0]);
    const m = fundirCorteza(pz);
    m.position.set(-pts[0][0], -pts[0][1], -pts[0][2]);
    piv.add(m);
    g.add(piv);
    // el eje para levantarla (horizontal, de costado a la raíz) y la fase del paso (de a tres, alternadas)
    patas.push({ piv, a, eje: V3(Math.cos(a), 0, -Math.sin(a)), fase: (i % 2) * Math.PI, alcance: r2 });
  }
  // las ramas y la copa en pisos, con las cartas de hojas del bosque
  const cc = new ConstructorArbol();
  for (let i = 0; i < 9; i++) {
    const t = i / 8, y = H * (0.55 + 0.4 * t);
    const a = i * 2.3 + r() * 0.5;
    const largo = (7 - 3.5 * t) * (0.85 + r() * 0.3);
    const fin = [Math.sin(a) * largo, y + alza + 1.5 + r() * 1.5, Math.cos(a) * largo];
    piezas.push(raiz([[Math.sin(a) * 0.8, y + alza - 1, Math.cos(a) * 0.8], [Math.sin(a) * largo * 0.5, y + alza + 0.4, Math.cos(a) * largo * 0.5], fin], [0.55 - 0.2 * t, 0.32, 0.12], '#4a3828', { nudos: 0.08 }));
    const rx = (4.0 - 1.6 * t) * (0.9 + r() * 0.2), ry = rx * (0.5 + r() * 0.12);
    racimo(cc, 4511 + i * 13, [fin[0], fin[1] + ry * 0.2, fin[2]], [rx, ry, rx * (0.85 + r() * 0.15)], { color: i % 2 ? '#2b5126' : '#34602c', tipo: 1, detalle: true, celda: CELDAS_CARTA.densa, cartas: 22, tam: 0.6, luz: 0.8 + 0.14 * t });
    // un racimo más chico, a media rama (la copa no queda en bolas sueltas)
    const med = [Math.sin(a + 0.3) * largo * 0.55, y + alza + 0.8, Math.cos(a + 0.3) * largo * 0.55];
    racimo(cc, 4613 + i * 17, med, [rx * 0.6, ry * 0.7, rx * 0.55], { color: i % 2 ? '#34602c' : '#24461f', tipo: 1, detalle: true, celda: CELDAS_CARTA.densa, cartas: 12, tam: 0.58, luz: 0.74 + 0.12 * t });
  }
  rama(cc, [0, H + alza - 2, 0], [0, H + alza + 0.4, 0], 0.4, 0.15, '#4a3828');
  racimo(cc, 4799, [0, H + alza + 1.2, 0], [2.8, 1.9, 2.8], { color: '#3c6a30', tipo: 1, detalle: true, celda: CELDAS_CARTA.densa, cartas: 18, tam: 0.6, luz: 0.95 });
  const copa = new THREE.InstancedMesh(cc.geometria(), matCopa(), 1);
  copa.setMatrixAt(0, new THREE.Matrix4());
  copa.frustumCulled = false; copa.castShadow = false; copa.receiveShadow = true;
  copa.name = 'coihue-copa';
  cuerpo.add(copa);
  // las puertitas y ventanas de duendes, encendidas
  const ventana = (a, y, w, h, prender) => {
    const rr = radio(y) * 1.04;
    const p = V3(Math.sin(a) * rr, y + alza, Math.cos(a) * rr);
    piezas.push(pieza(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.14), M4(p, [0, a, 0]), '#6b4a2a', { veta: (l) => [l.x * 3, l.y * 3, 0.3] }));
    const q = p.clone().add(V3(Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08)), q2 = p.clone().add(V3(Math.sin(a) * 0.1, 0, Math.cos(a) * 0.1));
    if (prender) {
      brillos.push(pieza(new THREE.PlaneGeometry(w, h), M4(q, [0, a, 0]), '#ffb860', { fuerza: 1.5 }));
      piezas.push(pieza(new THREE.BoxGeometry(0.05, h, 0.05), M4(q2, [0, a, 0]), '#4a3020', { veta: () => [0, 0, 0.2] }));
      piezas.push(pieza(new THREE.BoxGeometry(w, 0.05, 0.05), M4(q2, [0, a, 0]), '#4a3020', { veta: () => [0, 0, 0.2] }));
      halos.push({ p: p.clone().add(V3(Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3)), col: '#ffb860', tam: 2.2 });
    } else piezas.push(pieza(new THREE.PlaneGeometry(w, h), M4(q, [0, a, 0]), '#1a120c', { veta: () => [0, 0, 0] }));
    piezas.push(pieza(new THREE.BoxGeometry(w + 0.4, 0.06, 0.4), M4(p.clone().add(V3(Math.sin(a) * 0.2, h / 2 + 0.14, Math.cos(a) * 0.2)), [0.25, a, 0]), '#5a3a22', { veta: (l) => [l.x * 3, l.z * 3, 0.5], pintar: (c, pp, nn) => musgoEn(c, pp, nn, 1) }));
  };
  for (const v of [[0.2, 5.5, 0.6, 0.8, 1], [-0.7, 8.2, 0.5, 0.65, 1], [0.9, 11.0, 0.5, 0.6, 1], [-0.1, 13.6, 0.45, 0.55, 1], [1.6, 7.0, 0.5, 0.6, 1], [-1.5, 10.5, 0.45, 0.6, 1], [0.5, 16.0, 0.4, 0.5, 1], [-0.9, 4.2, 0.5, 0.6, 0], [2.6, 12.5, 0.4, 0.5, 1], [-2.4, 14.4, 0.4, 0.5, 1], [3.4, 6.2, 0.5, 0.6, 1], [-3.2, 8.8, 0.45, 0.55, 1], [2.2, 17.6, 0.4, 0.5, 1], [4.4, 10.0, 0.45, 0.55, 0], [-4.6, 12.2, 0.45, 0.6, 1]]) ventana(...v);
  // las puertitas al pie del tronco, cada una con su farol; la de adelante es la grande (la entrada)
  const faroles = [];
  for (const [a, w, h] of [[0, 1.3, 1.9], [-1.1, 0.7, 1.0], [1.3, 0.8, 1.1], [2.6, 0.7, 0.95], [-2.5, 0.75, 1.05]]) {
    const y = 0.9, rr = radio(y) * 1.05;
    const p = V3(Math.sin(a) * rr, y + alza + h / 2 - 0.2, Math.cos(a) * rr);
    piezas.push(pieza(new THREE.BoxGeometry(w + 0.2, h + 0.15, 0.16), M4(p, [0, a, 0]), '#5a3a22', { veta: (l) => [l.x * 3, l.y * 3, 0.4] }));
    piezas.push(pieza(new THREE.BoxGeometry(w, h, 0.08), M4(p.clone().add(V3(Math.sin(a) * 0.06, 0, Math.cos(a) * 0.06)), [0, a, 0]), '#7a4a2a', { veta: (l) => [l.x * 6, l.y, 0.6], pintar: (c, pp, nn, l) => { if (Math.abs(Math.sin(l.x * 18)) < 0.15) c.multiplyScalar(0.6); } }));
    const fl = p.clone().add(V3(Math.sin(a) * 0.35 + Math.cos(a) * (w / 2 + 0.25), h * 0.2, Math.cos(a) * 0.35 - Math.sin(a) * (w / 2 + 0.25)));
    brillos.push(pieza(deform(esfera(10, 8), () => {}), M4(fl, [0, 0, 0], [0.13, 0.17, 0.13]), '#ffb040', { fuerza: 1.8 }));
    halos.push({ p: fl, col: '#ffb040', tam: 2.4 });
    faroles.push(fl);
  }
  // la escalera de raíces de la puerta grande al piso (adelante, +z)
  {
    const z0 = radio(0.9) * 1.05 + 0.3;
    for (let k = 0; k < 7; k++) {
      const t = k / 6, y = alza + 0.35 - t * (alza + 0.2), z = z0 + t * 4.2;
      const gp = deform(esfera(12, 8), (v) => { v.multiplyScalar(1 + 0.12 * ruido(v.x * 4 + k, v.y * 4, v.z * 4)); if (v.y > 0) v.y *= 0.3; });
      piezas.push(pieza(gp, M4([Math.sin(k * 1.7) * 0.15, y, z], [0, (r() - 0.5) * 0.3, 0], [0.95, 0.24, 0.42]), '#6a4630', { veta: (l) => [l.x * 2, l.z * 2, 0.8], pintar: (c, pp, n) => { if (n.y > 0.6) c.multiplyScalar(1.2); musgoEn(c, pp, n, 0.35); } }));
    }
    for (const sx of [-1, 1]) piezas.push(raiz([[sx * 0.9, alza + 1.2, z0 - 0.2], [sx * 1.0, alza * 0.55 + 0.8, z0 + 2.0], [sx * 0.95, 0.9, z0 + 4.2], [sx * 1.1, -0.2, z0 + 4.7]], [0.16, 0.13, 0.11, 0.1], '#4a3020', { nudos: 0.04, tramos: 20 }));
  }
  // el balconcito
  {
    const a = 0.55, y = 9.2, rr = radio(y) + 0.25;
    const p = V3(Math.sin(a) * rr, y + alza - 0.5, Math.cos(a) * rr);
    piezas.push(pieza(new THREE.BoxGeometry(1.4, 0.08, 0.7), M4(p, [0, a, 0]), '#6b4a2a', { veta: (l) => [l.x * 3, l.z * 3, 0.5] }));
    for (let k = 0; k < 5; k++) piezas.push(pieza(new THREE.BoxGeometry(0.05, 0.45, 0.05), M4(p.clone().add(V3(Math.sin(a) * 0.32 + Math.cos(a) * (k - 2) * 0.32, 0.25, Math.cos(a) * 0.32 - Math.sin(a) * (k - 2) * 0.32)), [0, a, 0]), '#5a3a22', { veta: () => [0, 0, 0.3] }));
  }
  // bultos de musgo colgando
  for (let i = 0; i < 30; i++) {
    const a = r() * TAU, y = 2 + r() * 16, rr = radio(y);
    const gm = deform(esfera(10, 8), (v) => { v.multiplyScalar(1 + 0.3 * ruido(v.x * 4 + i, v.y * 4, v.z * 4)); if (v.y < 0) v.y *= 2.2; });
    piezas.push(pieza(gm, M4([Math.sin(a) * rr, y + alza, Math.cos(a) * rr], [0, a, 0], [0.7 + r() * 0.5, 0.35, 0.5]), '#4a6a2c', { veta: () => [0, 0, 0.2], pintar: (c, p, nn, l) => c.multiplyScalar(0.7 + 0.4 * (ruido(l.x * 30, l.y * 30, l.z * 30) * 0.5 + 0.5)) }));
  }
  // dónde van los tres núcleos de la noche final: nudos de ámbar en el tronco, uno cada tercio de vuelta
  const brasas = [0, 1, 2].map((i) => { const a = 0.35 + (i / 3) * TAU, y = [11.5, 9.6, 13.2][i]; const rr = radio(y) + 0.35; return V3(Math.sin(a) * rr, y + alza, Math.cos(a) * rr); });
  cuerpo.add(fundirCorteza(piezas));
  const mb = fundirBrillo(brillos); if (mb) cuerpo.add(mb);
  cuerpo.add(halosDe(halos, COIHUE.escala));
  // la luz de la puerta grande (se prende cuando se puede entrar)
  const pz = radio(0.9) * 1.05;
  const geoPuerta = new THREE.PlaneGeometry(1.25, 1.85, 6, 8);
  {
    const P = geoPuerta.attributes.position, col = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i);
      // el arco de arriba: las esquinas bajan (redondeado) y la luz sale del medio, más fuerte abajo
      if (y > 0.3) P.setY(i, 0.3 + (y - 0.3) * Math.sqrt(Math.max(0, 1 - (x / 0.625) ** 2)));
      const k = Math.max(0, 1 - Math.abs(x) / 0.7) * (0.75 + 0.25 * sv(0.9, -0.9, y));
      col[i * 3] = k; col[i * 3 + 1] = k * 0.72; col[i * 3 + 2] = k * 0.32;
    }
    geoPuerta.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const puerta = new THREE.Mesh(geoPuerta, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  puerta.position.set(0, alza + 0.9 + 1.9 / 2 - 0.2, pz + 0.16);
  puerta.visible = false;
  cuerpo.add(puerta);
  g.userData.coihue = true;
  return { g, cuerpo, patas, copa, brasas, puerta, farol: faroles[0].clone().add(V3(0, 0, 0.8)), alto: H + alza + 3, radio };
}
// Dónde chocan sus raíces con el piso (el tronco va alto: por debajo se pasa): dos círculos por raíz, el pie
// y el codo bajo. En el mundo: `x`, `z` (el pie del árbol), `giro` (hacia dónde mira) y `escala`.
export function piesCoihue(co, x, z, giro = 0, escala = COIHUE.escala) {
  const lista = [];
  for (const p of co.patas) {
    const a = p.a + giro;
    for (const [d, r] of [[p.alcance, 0.75], [p.alcance - 1.5, 0.6]]) lista.push({ x: x + Math.sin(a) * d * escala, z: z + Math.cos(a) * d * escala, r: r * escala });
  }
  return lista;
}
// El andar: `paso` de 0 (quieto, apenas se mece) a 1 (camina); `t` el reloj. Las raíces se levantan de a
// tres (las pares y las impares) y el tronco sube y baja con cada paso.
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _Y = new THREE.Vector3(0, 1, 0);
export function animarCoihue(co, t, paso = 0) {
  const f = t * 2.2;
  for (const p of co.patas) {
    const s = Math.sin(f + p.fase);
    const alza = Math.max(0, s) * paso * 0.32 + Math.sin(t * 0.7 + p.a) * 0.012;
    _q1.setFromAxisAngle(p.eje, -alza);
    _q2.setFromAxisAngle(_Y, Math.cos(f + p.fase) * 0.1 * paso);
    p.piv.quaternion.multiplyQuaternions(_q2, _q1);
  }
  co.cuerpo.position.y = Math.abs(Math.sin(f)) * 0.35 * paso + Math.sin(t * 0.5) * 0.05;
  co.cuerpo.rotation.z = Math.sin(f) * 0.025 * paso + Math.sin(t * 0.37) * 0.008;
  co.cuerpo.rotation.x = 0.03 * paso + Math.sin(t * 0.29) * 0.006;
}

// ---------------------------------------------------------------- 3.8.0: la subida por adentro (se camina)
// El fuste hueco por dentro: una escalera de raíces que sube en espiral entre la pared de madera roja y el
// tronco de raíces trenzadas del medio (el borde: no hay vacío por donde caerse). Cada tanto un descanso
// llano con su farol (si te caés, volvés al último), faroles de hongos y casitas de duendes en la pared.
// Abajo la puertita al valle; arriba, la puerta del corazón. En metros, el piso en y = 0, el centro en 0.
// Devuelve la malla y lo que hace falta para la física: los tramos (plataformas rectangulares), la pared,
// la columna, los descansos y las dos puertas.
export const SUBIDA = { radio: 4.4, columna: 1.45, vueltas: 8, altoVuelta: 4.3, paso: 0.3, descansos: [2, 4, 6], llano: 3 };
export function armarSubida() {
  const g = new THREE.Group(), piezas = [], brillos = [], halos = [];
  const r = azar(903);
  const RA = SUBIDA.radio, RC = SUBIDA.columna, rIn = RC + 0.1, rOut = RA - 0.25, rMed = (rIn + rOut) / 2, ancho = rOut - rIn;
  const paso = SUBIDA.paso, k = SUBIDA.altoVuelta / TAU;
  // el camino: un tramo cada `paso` radianes; sube parejo, menos en los descansos (llanos)
  const tramos = [], descansos = [];
  let a = 0, y = 0.2, subido = 0, sigue = 0;
  const total = SUBIDA.vueltas * TAU;
  while (subido < total) {
    tramos.push({ a, y });
    if (sigue < SUBIDA.descansos.length && subido / TAU >= SUBIDA.descansos[sigue]) {
      descansos.push({ a: a + paso * (SUBIDA.llano / 2), y });
      for (let j = 0; j < SUBIDA.llano; j++) { a += paso; tramos.push({ a, y, llano: true }); }
      sigue++;
    }
    a += paso; y += k * paso; subido += paso;
  }
  // el descanso de arriba, más largo: ahí está la puerta del corazón
  const arriba = { a, y };
  for (let j = 0; j < SUBIDA.llano + 3; j++) { tramos.push({ a, y, llano: true }); a += paso; }
  const aPuerta = arriba.a + paso * 2.5, alto = arriba.y;
  const TECHO = alto + 4.6;
  // la pared: un torno mirando hacia adentro
  {
    const perf = []; for (let j = 0; j <= 90; j++) perf.push([1, -0.3 + (j / 90) * (TECHO + 0.3)]);
    const gw = lathe(perf, 56);
    const I = gw.index.array; for (let t = 0; t < I.length; t += 3) { const q = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = q; }
    deform(gw, (v) => { const an = Math.atan2(v.x, v.z), rr = RA * (1 + 0.05 * ruido(an * 3, v.y * 0.3, 0) + 0.025 * Math.sin(an * 17 + v.y * 0.6)); v.set(Math.sin(an) * rr, v.y, Math.cos(an) * rr); });
    piezas.push(pieza(gw, null, '#6e4632', {
      veta: (l) => [Math.atan2(l.x, l.z) * RA, l.y, 0.75],
      pintar: (c, p, n, l) => {
        const an = Math.atan2(l.x, l.z);
        c.multiplyScalar(0.8 + 0.3 * Math.sin(an * 23 + 4 * ruido(an * 2, l.y * 0.5, 2)) * 0.5 + 0.15);
        tinta(c, '#5a6a2a', 0.35 * sv(0.4, 0.9, ruido(an * 4, l.y * 0.6, 7)));
        tinta(c, '#3a2014', 0.5 * sv(alto - 2, TECHO, l.y));
      },
    }));
    // el techo, arriba de la puerta del corazón
    const gt = lathe([[RA * 1.08, TECHO - 0.05], [RA * 0.7, TECHO + 0.6], [0.001, TECHO + 0.85]], 32);
    const J = gt.index.array; for (let t = 0; t < J.length; t += 3) { const q = J[t + 1]; J[t + 1] = J[t + 2]; J[t + 2] = q; }
    gt.computeVertexNormals();
    piezas.push(pieza(gt, null, '#3a2418', { veta: (l) => [Math.atan2(l.x, l.z) * 2, l.y, 0.6] }));
  }
  // el piso de abajo
  piezas.push(pieza(new THREE.CircleGeometry(RA * 1.04, 40).rotateX(-Math.PI / 2), null, '#3a2a1e', { veta: (l) => [l.x, l.z, 0.4] }));
  // el tronco del medio: cuatro raíces trenzadas que suben hasta el techo (el borde de la escalera)
  for (let s = 0; s < 4; s++) {
    const pts = [], n = 60;
    for (let j = 0; j <= n; j++) { const t = j / n, an = s * (TAU / 4) + t * 9; pts.push([Math.sin(an) * RC * 0.62, -0.3 + t * (TECHO + 0.6), Math.cos(an) * RC * 0.62]); }
    piezas.push(raiz(pts, pts.map((_, j) => 0.62 + 0.08 * Math.sin(j * 1.7 + s)), s % 2 ? '#7a5238' : '#6a4630', { nudos: 0.06, tramos: 140, lados: 9, pintar: (c, p, nn) => musgoEn(c, p, nn, 0.5) }));
  }
  // los peldaños: losas de raíz de la pared al tronco, con la raíz que las sostiene
  tramos.forEach((q, i) => {
    const p = V3(Math.sin(q.a) * rMed, q.y - 0.14, Math.cos(q.a) * rMed);
    const gp = deform(esfera(10, 6), (v) => { v.multiplyScalar(1 + 0.1 * ruido(v.x * 4 + i, v.y * 4, v.z * 4)); if (v.y > 0) v.y *= 0.45; });
    piezas.push(pieza(gp, M4(p, [0, q.a - Math.PI / 2, 0], [ancho / 2 + 0.12, 0.2, 0.56]), q.llano ? '#7a5238' : '#6a4630', { veta: (l) => [l.x * 2, l.z * 2, 0.8], pintar: (c, pp, n) => { if (n.y > 0.6) c.multiplyScalar(1.2); musgoEn(c, pp, n, q.llano ? 0.45 : 0.2); } }));
    if (i % 2 === 0) piezas.push(raiz([[Math.sin(q.a) * (RA + 0.1), q.y + 0.3, Math.cos(q.a) * (RA + 0.1)], [Math.sin(q.a) * (rOut - 0.1), q.y - 0.4, Math.cos(q.a) * (rOut - 0.1)], [Math.sin(q.a) * (rMed + 0.3), q.y - 0.3, Math.cos(q.a) * (rMed + 0.3)]], [0.2, 0.15, 0.07], '#5a3a26', { nudos: 0.03 }));
  });
  // los faroles de hongos en la pared (cada media vuelta) y en cada descanso uno grande
  const farol = (an, fy, col, tam = 1) => {
    const p = V3(Math.sin(an) * (RA - 0.18), fy, Math.cos(an) * (RA - 0.18));
    piezas.push(pieza(deform(esfera(14, 6), (v) => { if (v.y > 0) v.y *= 0.4; else v.y *= 0.25; }), M4(p.clone().add(V3(0, -0.12 * tam, 0)), [0, an, 0], [0.45 * tam, 0.2 * tam, 0.35 * tam]), '#c8a070', { veta: () => [0, 0, 0.1], pintar: (c, pp, n) => { if (n.y < 0) c.multiplyScalar(0.55); } }));
    for (let i = 0; i < 4; i++) {
      const q = p.clone().add(V3((r() - 0.5) * 0.35 * tam, 0.05 + r() * 0.15 * tam, (r() - 0.5) * 0.35 * tam)).addScaledVector(V3(Math.sin(an), 0, Math.cos(an)), -0.12);
      const s = (0.09 + r() * 0.06) * tam;
      brillos.push(pieza(deform(esfera(10, 8), () => {}), M4(q, [0, 0, 0], [s, s, s]), col, { fuerza: 1.7 }));
    }
    halos.push({ p: p.clone().addScaledVector(V3(Math.sin(an), 0, Math.cos(an)), -0.2).add(V3(0, 0.1, 0)), col, tam: 1.6 * tam });
  };
  for (let i = 0; i < tramos.length; i += 7) farol(tramos[i].a + 0.15, tramos[i].y + 1.6, i % 2 ? '#c8ff6a' : '#ffb040', 1);
  // hongos de luz en el tronco del medio, mirando a la escalera (se ve por dónde se pisa)
  for (let i = 3; i < tramos.length; i += 9) {
    const q = tramos[i], an = q.a + 0.1, col = i % 2 ? '#ffb040' : '#c8ff6a';
    for (let j = 0; j < 4; j++) {
      const p = V3(Math.sin(an + (j - 1.5) * 0.25) * (RC + 0.05), q.y + 0.9 + (j % 2) * 0.35, Math.cos(an + (j - 1.5) * 0.25) * (RC + 0.05));
      const s = 0.07 + (j % 3) * 0.025;
      brillos.push(pieza(deform(lathe([[0.001, -0.2], [0.8, -0.1], [1, 0.05], [0.6, 0.3], [0.001, 0.4]], 10), () => {}), M4(p, [0, an, 0], [s * 1.3, s, s * 1.3]), col, { fuerza: 1.15 }));
    }
    halos.push({ p: V3(Math.sin(an) * (RC + 0.4), q.y + 1.1, Math.cos(an) * (RC + 0.4)), col, tam: 2.2 });
  }
  for (const d of descansos) farol(d.a, d.y + 1.5, '#ffb040', 1.5);
  // las casitas de los duendes en la pared: una puertita con su ventana encendida (de algunas asoman)
  const casitas = [];
  for (let i = 5; i < tramos.length - 8; i += 17) {
    const q = tramos[i], an = q.a + 0.12, p = V3(Math.sin(an) * (RA - 0.08), q.y + 0.75, Math.cos(an) * (RA - 0.08));
    casitas.push({ a: an, y: q.y });
    piezas.push(pieza(new THREE.BoxGeometry(0.62, 0.95, 0.12), M4(p, [0, an + Math.PI, 0]), '#5a3a22', { veta: (l) => [l.x * 3, l.y * 3, 0.4] }));
    brillos.push(pieza(new THREE.PlaneGeometry(0.42, 0.3), M4(p.clone().addScaledVector(V3(Math.sin(an), 0, Math.cos(an)), -0.08).add(V3(0, 0.15, 0)), [0, an + Math.PI, 0]), '#ffb860', { fuerza: 1.3 }));
  }
  // las dos puertas: abajo, la puertita al valle; arriba, la del corazón (grande, con el ámbar que se filtra)
  const aAbajo = -1.1;
  const puerta = (an, py, w, h, brilloCol, fuerza) => {
    const p = V3(Math.sin(an) * (RA - 0.1), py + h / 2, Math.cos(an) * (RA - 0.1)), ad = V3(Math.sin(an), 0, Math.cos(an));
    piezas.push(pieza(new THREE.BoxGeometry(w, h, 0.12), M4(p, [0, an + Math.PI, 0]), '#7a4a2a', { veta: (l) => [l.x * 6, l.y, 0.6], pintar: (c, pp, n, l) => { if (Math.abs(Math.sin(l.x * 12)) < 0.15) c.multiplyScalar(0.6); } }));
    for (const lado of [-1, 1]) {
      const b = V3(Math.cos(an) * lado * (w / 2 + 0.15), 0, -Math.sin(an) * lado * (w / 2 + 0.15));
      piezas.push(raiz([[p.x + b.x, py - 0.1, p.z + b.z], [p.x + b.x * 1.05, py + h * 0.7, p.z + b.z * 1.05], [p.x + b.x * 0.4, py + h + 0.3, p.z + b.z * 0.4]], [0.22, 0.19, 0.15], '#5a3a26', { nudos: 0.04 }));
    }
    // la luz que se filtra por las rendijas
    brillos.push(pieza(new THREE.BoxGeometry(0.08, h, 0.05), M4(p.clone().addScaledVector(ad, -0.08).add(V3(Math.cos(an) * w * 0.25, 0, -Math.sin(an) * w * 0.25)), [0, an + Math.PI, 0]), brilloCol, { fuerza }));
    brillos.push(pieza(new THREE.BoxGeometry(w, 0.06, 0.05), M4(p.clone().addScaledVector(ad, -0.08).add(V3(0, -h / 2 + 0.03, 0)), [0, an + Math.PI, 0]), brilloCol, { fuerza }));
    halos.push({ p: p.clone().addScaledVector(ad, -0.5), col: brilloCol, tam: 3 * h / 2 });
    return p.clone().addScaledVector(ad, -1.1);
  };
  const abajo = puerta(aAbajo, 0, 1.1, 1.8, '#ffe0a0', 1.4);
  const corazon = puerta(aPuerta, alto, 1.8, 2.9, '#ffa020', 2.2);
  g.add(fundirCorteza(piezas));
  { const b = fundirBrillo(brillos); if (b) g.add(b); }
  g.add(halosDe(halos));
  return {
    g, radio: RA, columna: RC, techo: TECHO, alto,
    // los tramos de la física: rectángulos a lo largo del camino (se pisan un poco: no quedan rendijas)
    tramos: tramos.map((q) => ({ x: Math.sin(q.a) * rMed, z: Math.cos(q.a) * rMed, alto: q.y, largo: 1.5, ancho: ancho + 0.3, ang: -q.a })),
    descansos: [{ x: Math.sin(0.3) * rMed, z: Math.cos(0.3) * rMed, y: 0.2 }, ...descansos.map((d) => ({ x: Math.sin(d.a) * rMed, z: Math.cos(d.a) * rMed, y: d.y }))],
    puertaAbajo: { x: abajo.x, z: abajo.z, y: 0 },
    puertaArriba: { x: corazon.x, z: corazon.z, y: alto, a: aPuerta },
    // dónde van las luces (abajo, los descansos y arriba)
    // (una cada 12 tramos, a lo largo de toda la escalera: el presupuesto fijo prende las 4 más cerca)
    luces: [V3(abajo.x, 1.8, abajo.z), ...tramos.filter((_, i) => i % 12 === 6).map((q) => V3(Math.sin(q.a + 0.2) * rMed, q.y + 2.4, Math.cos(q.a + 0.2) * rMed)), V3(corazon.x, alto + 2.2, corazon.z)],
    largo: tramos.length,
    casitas,
  };
}

// ---------------------------------------------------------------- 3.8.0: las semillas doradas
// Una semilla (lo que juntás): una gota con estrías, dorada, que brilla por dentro. Geometría con color por
// vértice (para MeshBasic): la punta más clara, las estrías más oscuras. `escala`: el largo (m).
export function geoSemilla(escala = 0.3) {
  const g = lathe(afinar([[0.001, -1], [0.55, -0.75], [0.72, -0.2], [0.55, 0.45], [0.18, 0.9], [0.001, 1.1]], 3), 12);
  const P = g.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = 1 + 0.12 * Math.cos(Math.atan2(x, z) * 8);
    P.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  // la luz pintada (es MeshBasic: brilla igual de noche): arriba y de frente más clara, las estrías oscuras
  const N = g.attributes.normal;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), a = Math.atan2(x, z);
    c.set('#d8901e').lerp(colorDe('#ffd870'), sv(-0.2, 0.9, y) * 0.7);
    c.multiplyScalar(0.62 + 0.3 * Math.max(0, N.getY(i)) + 0.22 * Math.max(0, N.getZ(i) * 0.7 + N.getX(i) * 0.7));
    if (Math.cos(a * 8) < -0.6) c.multiplyScalar(0.55);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.scale(escala * 0.5, escala * 0.5, escala * 0.5);
  g.computeBoundingSphere();
  return g;
}

// Una piedra de ámbar facetada (para MeshBasic con color por vértice): cada cara con su luz pintada y el
// centro más claro, como un ámbar con la luz adentro. `escala`: [x, y, z] en metros.
export function geoAmbar(escala = [1, 1, 1], semilla = 7) {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const P = g.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color(), r = azar(semilla);
  const nf = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
  for (let t = 0; t < P.count; t += 3) {
    a.fromBufferAttribute(P, t); b.fromBufferAttribute(P, t + 1); d.fromBufferAttribute(P, t + 2);
    nf.copy(a).add(b).add(d).normalize();
    const luz = 0.55 + 0.35 * Math.max(0, nf.y * 0.6 + nf.z * 0.6 + nf.x * 0.3) + 0.25 * Math.max(0, nf.z) ** 3 + (r() - 0.5) * 0.12;
    c.set('#e07a10').lerp(colorDe('#ffd060'), Math.max(0, nf.z) ** 2 * 0.8).multiplyScalar(luz);
    for (let j = 0; j < 3; j++) { col[(t + j) * 3] = c.r; col[(t + j) * 3 + 1] = c.g; col[(t + j) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.scale(escala[0], escala[1], escala[2]);
  return g;
}

// ---------------------------------------------------------------- 3.8.0: para compilar en la carga
// Una malla chiquita de cada material de acá (debajo del mundo, fuera de la vista): el juego las ve al
// compilar los programas en la carga y nunca a mitad de una partida.
export function testigosCoihue() {
  const g = new THREE.Group();
  g.name = 'coihue-testigos';
  const tri = () => new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.01, 0, 0, 0, 0.01, 0], 3));
  const q = () => pieza(new THREE.PlaneGeometry(0.01, 0.01), null, '#ffffff', { tela: 1 });
  g.add(fundirCorteza([q()]));
  g.add(fundir([q()], materialGente()));
  // 3.8.4: la piel del Rey (el material de la gente con huesos): se compila en la carga, no al entrar al corazón
  {
    const m = fundir([q()], materialGente()), geo = m.geometry, n = geo.attributes.position.count;
    const sw = new Float32Array(n * 4); for (let i = 0; i < n; i++) sw[i * 4] = 1;
    geo.setAttribute('skinIndex', new THREE.BufferAttribute(new Float32Array(n * 4), 4));
    geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    const hueso = new THREE.Group(), piel = new MallaRey(geo, m.material);
    g.add(hueso, piel); g.updateMatrixWorld(true);
    piel.skeleton = new EsqueletoRey([hueso], piel);
  }
  g.add(fundirBrillo([q()]));
  g.add(new THREE.Points(tri().setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1], 3)), matHalo(1)));
  const cc = new ConstructorArbol();
  racimo(cc, 1, [0, 0, 0], [0.01, 0.01, 0.01], { color: '#2b5126', tipo: 1, detalle: true, celda: CELDAS_CARTA.densa, cartas: 1, tam: 0.5 });
  const copa = new THREE.InstancedMesh(cc.geometria(), matCopa(), 1);
  copa.setMatrixAt(0, new THREE.Matrix4());
  g.add(copa);
  g.position.set(0, -600, 0);
  g.traverse((o) => { o.castShadow = false; o.receiveShadow = false; });
  return g;
}

// 3.8.0: las herramientas de acá, para el corazón del Coihue (desafio-nave-mundo.js)
export const herramientasCoihue = { matCorteza, pieza, raiz, fundirCorteza, fundirBrillo, deform, esfera, lathe, afinar, musgoEn, M4, V3, azar, ruido, sv, tinta, colorDe, husoG, halosDe, TAU };
