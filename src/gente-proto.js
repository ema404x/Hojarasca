// PROTOTIPO (rama proto-personajes, no va al juego todavía): cuatro maneras de hacer más realista a
// la gente, detrás de un ajuste de depuración (`?personajes=A|B|C|D`). Sin el ajuste, gente.js arma
// a todos como siempre. Las cuatro devuelven lo mismo que mallaPersona (g, cabeza, torso, patas,
// brazos, mano, muneca, mateVisible) y usan los mismos pivotes (cadera 0,82, hombros 1,30, cabeza
// 1,46): las animaciones, los gestos y lo que llevan en la mano no cambian.
//   A · proporciones y cara: cabeza más chica (7,5 cabezas), hombros, cintura y caderas de adulto,
//       brazos más largos, manos con dedos, y una cara esculpida en una esfera con los vértices
//       juntos donde hace falta (nariz con volumen, pómulos, mentón, labios) y pintada por vértice;
//       ojos de verdad (globo con iris, pupila y brillo) dentro de párpados con forma de almendra.
//   B · A + ropa y pelo con volumen: pliegues pintados, cuello de camisa, puños, botones,
//       cinturón con hebilla, bolsillos, moño del delantal; pelo de mechones, rodete, trenzas
//       trenzadas, barba con forma.
//   C · A + cuerpo continuo: una sola malla por persona con piel por huesos (los huesos son los
//       grupos de siempre más codos, tobillos, ojos y párpados); sin juntas en hombros, codos ni
//       rodillas, y los codos y los pies acompañan el paso.
//   D · B + C + sombreado de piel (la luz se cuela tibia en el borde de la sombra), matiz por zona,
//       oclusión en los pliegues, y ojos que miran al jugador, con parpadeo.
import * as THREE from 'three';
import { bola, tubo, torno, huso, deformar, coser, colorear, matiz, mezcla, color, puntasBufanda } from './formas.js';
import { compactar, MAT_FAUNA } from './vida.js';

const pedido = typeof location !== 'undefined' && location.search ? new URLSearchParams(location.search).get('personajes') : null;
export const VARIANTE_PERSONAJES = /^[ABCD]$/.test(pedido || '') ? pedido : null;
if (VARIANTE_PERSONAJES && typeof window !== 'undefined') window.__protoPersonajes = VARIANTE_PERSONAJES;

const OPC = {
  A: { cara: 1 },
  B: { cara: 1, ropa: 1, pelo: 1 },
  C: { cara: 1, continuo: 1 },
  D: { cara: 1, ropa: 1, pelo: 1, continuo: 1, piel: 1, mirar: 1 },
};

const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x, y, sx, sy) => Math.exp(-((x / sx) ** 2 + (y / sy) ** 2));
const _c = new THREE.Color(), _c2 = new THREE.Color();
const tinta = (c, hex, t) => { if (t > 0) c.lerp(_c2.set(hex), Math.min(1, t)); };
function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }

// ---------------------------------------------------------------- geometrías propias
// n+1 valores entre `desde` y `hasta`, más juntos cerca de `centro` (para que la cara tenga
// vértices donde se esculpe la nariz o los labios, y la nuca no gaste)
function mapaDenso(n, desde, hasta, centro, ancho, extra) {
  const K = 600, acum = [0];
  for (let i = 1; i <= K; i++) { const t = desde + (hasta - desde) * (i - 0.5) / K; acum.push(acum[i - 1] + 1 + extra * Math.exp(-(((t - centro) / ancho) ** 2))); }
  const total = acum[K], out = [];
  let k = 0;
  for (let j = 0; j <= n; j++) {
    const obj = total * j / n;
    while (k < K - 1 && acum[k + 1] < obj) k++;
    const f = Math.min(1, Math.max(0, (obj - acum[k]) / ((acum[k + 1] - acum[k]) || 1)));
    out.push(desde + (hasta - desde) * (k + f) / K);
  }
  return out;
}
// Esfera unidad con el frente en +z y los vértices apretados en la cara
function esferaDensa(nAz, nPol, densAz = 2.6, densPol = 2.2) {
  const az = mapaDenso(nAz, -Math.PI, Math.PI, 0, 0.75, densAz);
  const pol = mapaDenso(nPol, 0, Math.PI, Math.PI * 0.58, 0.42, densPol);
  const pos = [], idx = [];
  for (let j = 0; j <= nPol; j++) for (let i = 0; i <= nAz; i++) {
    const t = pol[j], p = az[i];
    pos.push(Math.sin(t) * Math.sin(p), Math.cos(t), Math.sin(t) * Math.cos(p));
  }
  const W = nAz + 1;
  for (let j = 0; j < nPol; j++) for (let i = 0; i < nAz; i++) { const a = j * W + i, b = a + W; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  return orientar(geoDe(pos, idx));
}
function geoDe(pos, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
// que los triángulos miren para afuera (desde el origen de la pieza)
function orientar(g) {
  const P = g.attributes.position, I = g.index.array;
  let bien = 0, mal = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), m = new THREE.Vector3();
  for (let t = 0; t < I.length; t += 3) {
    a.fromBufferAttribute(P, I[t]); b.fromBufferAttribute(P, I[t + 1]); c.fromBufferAttribute(P, I[t + 2]);
    n.subVectors(b, a).cross(m.subVectors(c, a));
    if (n.lengthSq() < 1e-16) continue;
    m.copy(a).add(b).add(c);
    if (n.dot(m) > 0) bien++; else mal++;
  }
  if (mal > bien) { const arr = g.index.array; for (let t = 0; t < arr.length; t += 3) { const x = arr[t + 1]; arr[t + 1] = arr[t + 2]; arr[t + 2] = x; } }
  return g;
}
// saca los triángulos con los tres vértices ocultos (lo que queda adentro de la cabeza)
function recortar(g, oculto) {
  const I = g.index.array, out = [];
  for (let t = 0; t < I.length; t += 3) if (!(oculto[I[t]] && oculto[I[t + 1]] && oculto[I[t + 2]])) out.push(I[t], I[t + 1], I[t + 2]);
  g.setIndex(out);
  return g;
}
function mallaDe(geo, hex, colores = null) {
  geo.computeVertexNormals();
  coser(geo);
  const m = new THREE.Mesh(geo, color(hex));
  if (colores) geo.setAttribute('color', new THREE.BufferAttribute(colores, 3));
  return m;
}
// pinta cada vértice (en el espacio de la pieza, con su normal): fn(c, p, n, i)
function pintarPieza(m, fn) {
  const g = m.geometry; if (!g.attributes.normal) g.computeVertexNormals();
  const P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color;
  const out = new Float32Array(P.count * 3), p = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) {
    p.fromBufferAttribute(P, i); n.fromBufferAttribute(N, i);
    if (C) c.setRGB(C.getX(i), C.getY(i), C.getZ(i)); else c.copy(m.material.color);
    fn(c, p, n, i);
    out[i * 3] = c.r; out[i * 3 + 1] = c.g; out[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(out, 3));
  return m;
}
const piel = (m) => { m.userData.piel = 1; return m; };
const noTapa = (m) => { m.userData.noTapa = 1; return m; };

// ---------------------------------------------------------------- la cabeza
// Todo en el espacio del grupo de la cabeza (pivote a 1,46 m): el centro del cráneo, 5 cm más arriba.
function medidasCara(mujer, chico) {
  // los chicos: cara más redonda, nariz chica, cachetes llenos y ojos un poco más grandes
  const rx = chico ? 0.074 : mujer ? 0.072 : 0.077, ry = chico ? 0.098 : mujer ? 0.102 : 0.107, rz = mujer ? 0.095 : 0.1;
  return { mujer, chico, rx, ry, rz, nariz: chico ? 0.62 : 1, cachete: chico ? 1.6 : 1, re: chico ? 0.0124 : 0.0118, cy: 0.05, ex: mujer ? 0.031 : 0.0325, ey: 0.0, ceja: 0.021, punta: -0.035, base: -0.045, boca: -0.062, menton: mujer ? -0.097 : -0.103, frente: 0.068 };
}
// la forma del cráneo y de la cara (sin los rasgos): v relativo al centro
function formaCraneo(v, F) {
  const zf = 0.55 * F.rz;
  if (v.z > zf) v.z = zf + (v.z - zf) * 0.6;                                   // la cara, más plana
  if (v.z < 0) { v.z *= 1.06; v.y += 0.006 * Math.max(0, -v.z / F.rz); }        // la nuca
  const fr = sv(0.0, 0.5, v.z / F.rz);
  if (v.y < -0.015) { const s = sv(-0.015, -0.1, v.y); v.x *= 1 - 0.3 * s * s * (0.55 + 0.45 * fr); }   // la mandíbula
  v.z += (F.mujer ? 0.008 : 0.012) * gauss(v.x, v.y - F.menton - 0.012, 0.022, 0.02) * fr;              // el mentón
  // abajo, la mandíbula sube hacia la nuca (lo de abajo queda en el cuello)
  const piso = F.menton + (-0.052 - F.menton) * sv(0.06, -0.01, v.z);
  if (v.y < piso) v.y = piso + (v.y - piso) * 0.12;
  // los pómulos
  const pom = gauss(Math.abs(v.x) - 0.043, v.y + 0.017, 0.019, 0.014) * fr;
  v.z += 0.0048 * pom * F.cachete; v.x += Math.sign(v.x) * 0.002 * pom * F.cachete;
  return v;
}
// los rasgos esculpidos (sólo el cráneo y la barba, no el pelo)
function rasgos(v, F) {
  const fr = sv(0.25, 0.75, v.z / F.rz), ax = Math.abs(v.x), y = v.y;
  v.z -= 0.0078 * gauss(ax - F.ex, y - F.ey - 0.001, 0.0175, 0.0115) * fr;                    // las cuencas
  v.z += (F.mujer ? 0.0022 : 0.0042) * gauss(ax - 0.031, y - F.ceja + 0.001, 0.022, 0.0065) * fr;   // el arco de las cejas
  // la nariz: el tabique sube de entre los ojos hasta la punta, y abajo se corta en la base
  const top = 0.01;
  if (y < top + 0.01 && y > F.base - 0.008) {
    const s = sv(top, F.punta, y);
    const h = (0.003 + 0.0105 * s) * (1 - sv(F.punta + 0.002, F.base - 0.006, y));
    const w = 0.0058 + 0.0038 * s;
    v.z += h * F.nariz * Math.exp(-((v.x / w) ** 2)) * fr * sv(top + 0.01, top, y);
  }
  v.z += 0.0045 * F.nariz * gauss(v.x, y - F.punta - 0.001, 0.008, 0.008) * fr;                        // la punta
  v.z += 0.0032 * F.nariz * gauss(ax - 0.0115, y - F.base - 0.005, 0.005, 0.005) * fr;                  // las aletas
  // los labios, las comisuras, el surco bajo el labio y el filtrum
  v.z += 0.0024 * gauss(v.x, y - F.boca - 0.0055, 0.019, 0.0045) * fr;
  v.z += 0.0030 * gauss(v.x, y - F.boca + 0.0065, 0.016, 0.0048) * fr;
  v.z -= 0.0018 * gauss(ax - 0.024, y - F.boca, 0.005, 0.005) * fr;
  v.z -= 0.0016 * gauss(v.x, y - F.boca + 0.018, 0.02, 0.0045) * fr;
  v.z -= 0.0008 * gauss(v.x, y - F.boca - 0.016, 0.0035, 0.006) * fr;
  return v;
}
// el punto de la superficie de la cara en (x, y): para los ojos y las cejas
function superficie(x, y, F, conRasgos = true) {
  const k = 1 - (x / F.rx) ** 2 - (y / F.ry) ** 2;
  const v = new THREE.Vector3(x, y, F.rz * Math.sqrt(Math.max(0.0001, k)));
  formaCraneo(v, F);
  if (conRasgos) rasgos(v, F);
  return v;
}
// la cara pintada: rubor, labios, la sombra bajo la nariz, las fosas, el párpado y la barba de días
function pintarCara(c, p, n, F, colPiel, op) {
  const ax = Math.abs(p.x), fr = sv(0.2, 0.7, p.z / F.rz), y = p.y;
  // la forma pintada, como con una luz de arriba y de frente: los costados de la nariz, las sienes,
  // bajo el pómulo y los lados de la cara más oscuros y fríos; el puente de la nariz, la frente,
  // los pómulos y el mentón, más claros (la cara toma volumen con cualquier luz)
  const forma = 0.55 * n.z + 0.35 * n.y;
  c.multiplyScalar(0.86 + 0.2 * sv(-0.1, 0.85, forma));
  tinta(c, mezcla(matiz(colPiel, 0.75), '#6a4a52', 0.25), 0.22 * gauss(ax - 0.05, y + 0.035, 0.012, 0.02) * fr);   // bajo el pómulo
  tinta(c, mezcla(matiz(colPiel, 0.8), '#6a4a4a', 0.2), 0.3 * gauss(ax - 0.012, y + 0.012, 0.004, 0.018) * fr);    // los costados de la nariz
  tinta(c, mezcla(colPiel, '#f2d2b4', 0.5), 0.3 * (gauss(p.x, y + 0.01, 0.004, 0.02) + gauss(ax - 0.04, y + 0.012, 0.012, 0.008)) * fr);   // las luces
  const rub = mezcla(colPiel, '#c4544a', 0.55);
  tinta(c, rub, (F.chico ? 0.42 : 0.3) * gauss(ax - 0.04, y + 0.022, 0.02, 0.016) * fr);
  tinta(c, rub, 0.18 * gauss(p.x, y - F.punta, 0.011, 0.01) * fr);
  tinta(c, mezcla(colPiel, '#d8b090', 0.4), 0.25 * gauss(p.x, y - 0.045, 0.03, 0.02) * fr);   // la frente, apenas más clara
  // los labios (las mujeres, un poco más marcados) y la línea de la boca, con las comisuras arriba
  const wx = Math.exp(-((p.x / 0.0235) ** 4));
  const labio = Math.max(Math.exp(-(((y - F.boca - 0.0048) / 0.0042) ** 2)), Math.exp(-(((y - F.boca + 0.0058) / 0.005) ** 2)));
  tinta(c, mezcla(colPiel, '#a04842', F.mujer ? 0.62 : 0.42), labio * wx * fr * 0.9);
  const linea = Math.exp(-(((y - F.boca - 0.0036 * (p.x / 0.022) ** 2) / 0.0017) ** 2)) * Math.exp(-((p.x / 0.023) ** 4));
  tinta(c, mezcla(colPiel, '#4a2420', 0.6), linea * fr * 0.8);
  // la sombra suave bajo la punta de la nariz y las fosas (sólo lo que mira para abajo)
  const abajo = sv(-0.1, -0.6, n.y);
  tinta(c, mezcla(matiz(colPiel, 0.72), '#5a3434', 0.2), 0.3 * gauss(p.x, y - F.base, 0.011, 0.004) * fr * abajo);
  tinta(c, '#4a2a26', 0.4 * gauss(ax - 0.0068, y - F.base - 0.002, 0.003, 0.0022) * fr * abajo);
  // el pliegue del párpado, arriba del ojo, y la ojera suave
  tinta(c, mezcla(matiz(colPiel, 0.84), '#7a4a46', 0.15), 0.18 * gauss(ax - F.ex, y - F.ey - 0.0125, 0.016, 0.0045) * fr);
  tinta(c, mezcla(matiz(colPiel, 0.9), '#6a4a5a', 0.1), 0.08 * gauss(ax - F.ex, y - F.ey + 0.014, 0.014, 0.005) * fr);
  // lo que mira para abajo en la cara recibe luz rebotada (tibia); bajo la mandíbula, sombra
  const rebote = sv(-0.15, -0.7, n.y) * fr * (y > F.menton + 0.012 ? 1 : 0);
  tinta(c, mezcla(colPiel, '#f0c0a0', 0.35), 0.45 * rebote);
  c.multiplyScalar(1 - 0.16 * sv(-0.2, -0.8, n.y) * (1 - rebote));
  if (op.barbaDias) tinta(c, '#4a3a32', 0.14 * sv(-0.03, -0.06, y) * (1 - Math.exp(-((p.x / 0.02) ** 2)) * Math.exp(-(((y - F.boca) / 0.012) ** 2))));
}
// el cráneo con la cara
// (la forma es la misma para todas las mujeres, todos los varones, todos los chicos: se esculpe una
// vez y se copia; cada uno la pinta con lo suyo)
const MOLDES = new Map();
const molde = (clave, hacer) => { let g = MOLDES.get(clave); if (!g) { g = hacer(); MOLDES.set(clave, g); } return g.clone(); };
const claveCara = (F) => `${F.mujer ? 'm' : 'v'}${F.chico ? 'c' : ''}`;
function craneo(F, colPiel, op) {
  const g = molde('craneo' + claveCara(F), () => {
    const g = esferaDensa(46, 38);
    const P = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i); v.set(v.x * F.rx, v.y * F.ry, v.z * F.rz);
      formaCraneo(v, F); rasgos(v, F);
      P.setXYZ(i, v.x, v.y + F.cy, v.z);
    }
    g.computeVertexNormals(); coser(g);
    return g;
  });
  const m = piel(new THREE.Mesh(g, color(colPiel)));
  return pintarPieza(m, (c, p, n) => { p.y -= F.cy; pintarCara(c, p, n, F, colPiel, op); });
}
// Párpados: un casquete alrededor del ojo con la abertura en almendra (el borde del casquete ES el
// borde del párpado: un anillo exacto, sin los dientes de la grilla). `lat`: 1 el ojo derecho.
function almendra(u, v) {
  if (Math.abs(u) >= 0.93) return false;
  const t = (u + 0.93) / 1.86, eje = -0.05 + 0.1 * t, q = 1 - (u / 0.93) ** 2;
  const arriba = eje + 0.37 * Math.pow(q, 0.8) * (1 - 0.1 * u), abajo = eje - 0.27 * Math.pow(q, 0.9) * (1 + 0.12 * u);
  return v < arriba && v > abajo;
}
function parpados(F, lat, colPiel, colPelo, E) {
  const clave = `parp${lat}${claveCara(F)}${colPiel}${colPelo}`;
  if (MOLDES.has(clave)) { const m = MOLDES.get(clave); const c = new THREE.Mesh(m.geometry.clone(), m.material); c.userData = { ...m.userData }; return c; }
  const m = parpadosNuevos(F, lat, colPiel, colPelo, E);
  MOLDES.set(clave, m);
  const c = new THREE.Mesh(m.geometry.clone(), m.material); c.userData = { ...m.userData }; return c;
}
function parpadosNuevos(F, lat, colPiel, colPelo, E) {
  const re = F.re, N = 30, aros = [[-0.035, 1.004], [0, 1.045], [0.05, 1.11], [0.14, 1.12], [0.27, 1.11], [0.45, 1.09], [0.68, 1.06], [1, 1.02]];
  const tMax = 1.42, pos = [], col = [], sup = [];
  const pestana = mezcla(colPelo, '#140d09', 0.65), interior = mezcla(colPiel, '#b4625a', 0.45), pliegue = mezcla(matiz(colPiel, 0.84), '#6a3c38', 0.15);
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2, cu = Math.cos(a), sn = Math.sin(a);
    let lo = 0, hi = 0.999;
    for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (almendra(cu * m, sn * m)) lo = m; else hi = m; }
    const tb = Math.asin(lo);
    aros.forEach(([f, r], j) => {
      const t = f < 0 ? tb + f : tb + (tMax - tb) * f;
      let px = Math.sin(t) * cu * lat * re * r, py = Math.sin(t) * sn * re * r, pz = Math.cos(t) * re * r;
      // los aros de afuera se apoyan en la cara (sin el borde de antiparras alrededor del ojo)
      const pega = [0, 0, 0, 0.25, 0.65, 1, 1, 1][j];
      if (pega && E) {
        const zs = superficie(E.x + px, E.y + py, F).z - E.z - 0.0012;
        pz = pz + (Math.min(pz, zs) - pz) * pega;
        // pero nunca por debajo del globo (si no, el ojo asoma blanco fuera de la almendra)
        const r2 = (re * 1.035) ** 2 - px * px - py * py;
        if (r2 > 0) pz = Math.max(pz, Math.sqrt(r2));
      }
      pos.push(px, py, pz);
      _c.set(colPiel);
      const arriba = sn > -0.1;
      if (j <= 1) _c.set(arriba ? pestana : interior);
      else if (j === 2) tinta(_c, arriba ? pestana : interior, arriba ? 0.45 : 0.25);
      else if (j === 4 && arriba) tinta(_c, pliegue, 0.6);
      if (cu < -0.85 && j <= 2) tinta(_c, '#c07068', 0.4);   // el lagrimal
      col.push(_c.r, _c.g, _c.b);
      sup.push(sv(-0.12, 0.3, sn) * (j <= 5 ? 1 : 1 - (j - 5) / 3));
    });
  }
  const idx = [], A = aros.length;
  for (let i = 0; i < N; i++) for (let j = 0; j < A - 1; j++) { const a = i * A + j, b = (i + 1) * A + j; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = orientar(geoDe(pos, idx));
  const m = piel(mallaDe(g, colPiel, new Float32Array(col)));
  m.userData.superior = sup;   // cuánto de cada vértice baja con el parpadeo
  return m;
}
const IRIS = ['#4a2e1c', '#5b3a22', '#3c2618', '#6a4a2a', '#4a4630', '#3a4656', '#2e2018'];
function globoOjo(F, iris) {
  const g = new THREE.SphereGeometry(F.re, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.62);
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, color('#e8e0d4'));
  const brillo = new THREE.Vector3(0.38, 0.45, 0.81).normalize(), d = new THREE.Vector3();
  return pintarPieza(m, (c, p) => {
    d.copy(p).normalize();
    const a = Math.acos(Math.min(1, d.z));
    if (a < 0.19) c.set('#0c0807');
    else if (a < 0.5) { c.set(iris); if (a > 0.41) tinta(c, '#120c08', 0.5); else tinta(c, matiz(iris, 1.25), 0.25 * sv(0.3, 0.2, a)); }
    else { c.set('#e6ddd0'); tinta(c, '#d0a49a', 0.35 * sv(0.9, 1.3, a)); }
    if (d.angleTo(brillo) < 0.13) c.set('#fbf6ee');
  });
}
// El pelo y la barba salen de la misma forma de la cabeza, inflada: lo que no es pelo se esconde
// adentro del cráneo y esos triángulos se sacan
function casco(F, hex, conRasgos, grosor, oculta, pinta, nAz = 34, nPol = 26, clave = null) {
  if (clave) {
    const g = molde(clave + claveCara(F), () => casco(F, '#ffffff', conRasgos, grosor, oculta, null, nAz, nPol).geometry);
    return pintarPieza(new THREE.Mesh(g, color(hex)), (c, p, n) => { p.y -= F.cy; pinta(c, p, n); });
  }
  const g = esferaDensa(nAz, nPol, conRasgos ? 2.6 : 1.4, conRasgos ? 2.2 : 1.1);
  const P = g.attributes.position, v = new THREE.Vector3(), oc = [];
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i);
    v.set(v.x * F.rx, v.y * F.ry, v.z * F.rz);
    formaCraneo(v, F); if (conRasgos) rasgos(v, F);
    const n = v.clone().normalize();
    // `oculta` da cuánto es pelo (0..1, suave): el borde es donde el casco cruza la piel (sin dientes)
    const m = oculta(v);
    oc.push(m < 0.02);
    v.addScaledVector(n, -0.0035 + (grosor(v) + 0.0035) * m);
    P.setXYZ(i, v.x, v.y + F.cy, v.z);
  }
  recortar(g, oc);
  const m = mallaDe(g, hex);
  return pinta ? pintarPieza(m, (c, p, n) => { p.y -= F.cy; pinta(c, p, n); }) : m;
}
function pelo(F, colPelo, R, op, gorro) {
  const corto = !(R.rodete || R.trenza);
  const linea = (x) => F.frente - 5.5 * x * x;
  const piezas = [];
  // cuánto es pelo cada punto: arriba de la línea de la frente; a los costados hasta la patilla
  // (los varones) o por detrás de la oreja; atrás, hasta la nuca; nunca sobre la oreja
  const patilla = F.mujer || F.chico ? 0.03 : -0.008, nuca = corto ? -0.056 : -0.07;
  const ocultaPelo = (v) => {
    const ax = Math.abs(v.x);
    const alto = linea(Math.min(ax, 0.052)) + (patilla - linea(0.052)) * sv(0.052, 0.068, ax);
    const frente = sv(alto - 0.008, alto + 0.008, v.y);
    const atras = sv(nuca - 0.006, nuca + 0.006, v.y);
    let m = frente + (atras - frente) * sv(-0.004, -0.02, v.z);
    m *= 1 - gauss(v.y + 0.012, v.z + 0.01, 0.03, 0.024) * sv(0.045, 0.06, ax);   // la oreja
    return Math.max(0, Math.min(1, m));
  };
  const vetas = (c, p, n) => {
    const a = Math.atan2(p.x, p.z), fino = Math.sin(a * 46 + p.y * 30) * 0.5 + Math.sin(a * 97 - p.y * 11) * 0.3;
    c.multiplyScalar(1 + (op.pelo ? 0.12 : 0.05) * fino);
    c.multiplyScalar(0.8 + 0.28 * sv(-0.6, 0.8, n.y));                       // arriba le da la luz
  };
  piezas.push(casco(F, colPelo, false, (v) => 0.007 + 0.004 * sv(0, F.ry, v.y) + (corto ? 0 : 0.002), ocultaPelo, vetas, 34, 26, `pelo${corto ? 'c' : 'l'}`));
  if (op.pelo) {
    // mechones: husos que salen de la raya y se apoyan en el casco, de distinto largo
    const n = gorro ? 6 : 12, s = hash(colPelo + F.rx);
    for (let i = 0; i < n; i++) {
      const lado = i % 2 ? 1 : -1, k = Math.floor(i / 2) / (n / 2);
      const a0 = lado * (0.15 + k * 1.2), largo = 0.6 + 0.4 * ((s * 7 + i * 0.37) % 1);
      const pts = [];
      for (let t = 0; t <= 3; t++) {
        const ang = a0 + lado * t * 0.18, el = 1.25 - t * (corto ? 0.28 : 0.36) * largo;
        const x = Math.sin(ang) * Math.cos(el) * (F.rx + 0.011), z = Math.cos(ang) * Math.cos(el) * (F.rz + 0.011) - (corto ? 0 : t * 0.006), y = Math.sin(el) * (F.ry + 0.009);
        pts.push([x, y + F.cy, z - (corto ? 0 : 0.012)]);
      }
      const m = huso(matiz(colPelo, 0.94 + 0.12 * ((s * 13 + i * 0.61) % 1)), pts, [0.004, 0.011, 0.009, 0.003], 8, 7);
      piezas.push(pintarPieza(m, (c, p, nn) => { c.multiplyScalar(0.82 + 0.3 * sv(-0.5, 0.9, nn.y)); }));
    }
  }
  if (R.rodete) {
    if (op.pelo) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.014, 10, 22), color(colPelo));   // el rodete
      t.position.set(0, F.cy + 0.018, -F.rz - 0.008); t.rotation.set(0.25, 0, 0);
      piezas.push(pintarPieza(t, (c, p) => { c.multiplyScalar(1 + 0.16 * Math.sin(Math.atan2(p.y, p.x) * 7 + Math.atan2(p.z, Math.hypot(p.x, p.y) - 0.026) * 2)); }));
      piezas.push(bola(matiz(colPelo, 0.9), [0.024, 0.022, 0.014], [0, F.cy + 0.018, -F.rz - 0.012]));
    } else piezas.push(bola(colPelo, [0.042, 0.038, 0.034], [0, F.cy + 0.02, -F.rz - 0.006]));
  }
  if (R.trenza) {
    // los chicos, dos trenzas a los costados; las grandes, una por la espalda
    for (const l of F.chico ? [-1, 1] : [0]) {
      const x0 = l * (F.rx + 0.004), z0 = l ? -0.018 : -F.rz - 0.004, y0 = F.cy - 0.045;
      const n = op.pelo ? (F.chico ? 7 : 9) : (F.chico ? 5 : 6), paso = op.pelo ? 0.0165 : 0.034;
      const atras = (i) => (l ? 0 : i * 0.006);
      for (let i = 0; i < n; i++) {
        const y = y0 - i * paso, r = 1 - i * (op.pelo ? 0.035 : 0.05);
        if (op.pelo) piezas.push(bola(matiz(colPelo, i % 2 ? 0.9 : 1.05), [0.0125 * r, 0.019 * r, 0.011 * r], [x0 + (i % 2 ? 0.0045 : -0.0045), y, z0 - atras(i)], [0, 0, i % 2 ? 0.6 : -0.6]));
        else piezas.push(bola(colPelo, [0.018 * r, 0.024, 0.016 * r], [x0, y, z0 - atras(i)]));
      }
      const yf = y0 - n * paso;
      piezas.push(bola(F.chico ? '#c8443a' : matiz(colPelo, 0.7), [0.01, 0.006, 0.01], [x0, yf + 0.008, z0 - atras(n)]));   // la gomita
      if (op.pelo) {
        const pun = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 7, 1), color(colPelo)), (v) => { v.x *= 1 + 0.4 * Math.sin(v.y * 90); });
        pun.position.set(x0, yf - 0.006, z0 - atras(n)); pun.rotation.set(Math.PI, 0, 0);
        piezas.push(pun);
      }
    }
  }
  return piezas;
}
function barba(F, colBarba, op) {
  const oculta = (v) => {
    const ax = Math.abs(v.x);
    // el borde sobre los cachetes baja en diagonal hasta la comisura; arriba se une a la patilla
    const techo = ax > 0.058 ? F.ey + 0.0 : F.ey - 0.024 - 0.55 * Math.max(0, 0.05 - ax) + 0.4 * Math.max(0, ax - 0.045);
    let m = sv(techo + 0.009, techo - 0.009, v.y) * sv(-0.045, -0.015, v.z);
    const e = (v.x / 0.025) ** 2 + ((v.y - F.boca + 0.003) / 0.0105) ** 2;              // la boca, a la vista
    m *= sv(0.8, 1.2, e);
    m *= 1 - sv(F.base - 0.004, F.base + 0.001, v.y) * (1 - sv(0.028, 0.04, ax));        // la nariz
    return Math.max(0, Math.min(1, m));
  };
  const grosor = (v) => (Math.abs(v.x) < 0.03 && v.y > F.boca && v.y < F.base ? 0.005 : 0.008 + 0.005 * sv(-0.03, -0.09, v.y));
  const m = casco(F, colBarba, true, grosor, oculta, (c, p, n) => {
    c.multiplyScalar(1 + (op.pelo ? 0.16 : 0.05) * Math.sin(p.x * 260 + p.y * 40));
    c.multiplyScalar(0.8 + 0.25 * sv(-0.6, 0.6, n.y));
  }, 46, 38, 'barba');
  // la barba cae un poco bajo el mentón, con el borde desparejo
  deformar(m, (v) => { const y = v.y - F.cy; if (y < F.menton + 0.03 && v.z > 0.0) v.y -= (0.012 + (op.pelo ? 0.005 * Math.abs(Math.sin(v.x * 170)) : 0)) * sv(F.menton + 0.03, F.menton - 0.005, y); });
  return m;
}
function armarCabeza(cabeza, F, colores, R, op, colPiel) {
  const colPelo = colores.pelo || '#3a2a1e';
  const cuello = torno(colPiel, [[0.052, -0.13], [0.047, -0.09], [0.043, -0.06], [0.045, -0.03], [0.036, -0.0], [0.02, 0.01]].map(([r, y]) => [r * (F.mujer ? 0.95 : 1.06), y]), [0, 0, -0.012], null, [1, 1, 1.06], 16);
  cabeza.add(piel(pintarPieza(cuello, (c, p) => { c.multiplyScalar(1 - 0.18 * sv(-0.08, -0.03, p.y) * sv(-0.02, 0.03, p.z)); })));
  cabeza.add(craneo(F, colPiel, { barbaDias: !F.mujer && !F.chico && !colores.barba }));
  const ojos = [], parp = [];
  for (const l of [-1, 1]) {
    const s = superficie(l * F.ex, F.ey, F, false);
    const ojo = new THREE.Group(); ojo.position.set(s.x, F.ey + F.cy, s.z - F.re * 0.85);
    ojo.add(noTapa(globoOjo(F, IRIS[Math.floor(hash(colPelo + colPiel) * IRIS.length)])));
    const pp = new THREE.Group(); pp.position.copy(ojo.position);
    pp.add(noTapa(parpados(F, l, colPiel, colPelo, { x: ojo.position.x, y: F.ey, z: ojo.position.z })));
    cabeza.add(ojo); cabeza.add(pp); ojos.push(ojo); parp.push(pp);
    // la ceja: un trazo fino sobre el arco, apoyado en la piel
    const pts = [[0.012, -0.003], [0.024, 0.003], [0.038, 0.0045], [0.051, -0.002]].map(([u, dy]) => {
      const xx = l * (u + (F.ex - 0.031)), yy = F.ceja + dy * (F.mujer ? 0.9 : 0.5), q = superficie(xx, yy, F);
      return [q.x, yy + F.cy, q.z + 0.0014];
    });
    const k = F.mujer ? 0.72 : 0.95;
    const ceja = huso(mezcla(colPelo, colPiel, 0.22), pts, [0.0028 * k, 0.0034 * k, 0.0029 * k, 0.0017 * k], 10, 7);
    deformar(ceja, (v) => { const q = superficie(v.x, v.y - F.cy, F); v.z = q.z + 0.0012 + (v.z - q.z - 0.0012) * 0.4; });
    ceja.userData.noTapa = 1; cabeza.add(ceja);
    // la oreja, con el hueco pintado
    const oreja = bola(colPiel, [0.011, 0.027, 0.0165], [l * (F.rx * 0.93), F.cy - 0.012, -0.01], [0, l * 0.28, 0], [12, 10]);
    deformar(oreja, (v) => { if (v.x * l > 0) v.x -= l * 0.55 * Math.exp(-((v.y / 0.6) ** 2 + (v.z / 0.55) ** 2)); });
    cabeza.add(piel(pintarPieza(oreja, (c, p) => { if (p.x * l > -0.2 && Math.abs(p.y) < 0.65 && Math.abs(p.z) < 0.6) tinta(c, mezcla(colPiel, '#7a3a34', 0.4), 0.5); tinta(c, mezcla(colPiel, '#c4544a', 0.5), 0.25); })));
  }
  cabeza.userData.ojos = ojos; cabeza.userData.parpados = parp;
  for (const p of pelo(F, colPelo, R, op, !!colores.gorro)) cabeza.add(p);
  if (colores.barba) cabeza.add(barba(F, colores.barba, op));
  sombreros(cabeza, F, colores, op);
}
function sombreros(cabeza, F, colores, op) {
  const abrigo = colores.abrigo || '#4a3a30', ropa = colores.ropa || '#7a6a5a';
  const kx = F.rx + 0.008, kz = F.rz + 0.008;
  if (colores.gorro === 'boina') {
    const b = torno(abrigo, [[1.0, 0.0], [1.14, 0.012], [1.28, 0.03], [1.24, 0.05], [0.96, 0.066], [0.48, 0.074], [0.0, 0.076]], [0.004, F.cy + 0.052, -0.006], [-0.12, 0, -0.14], [kx, 1, kz], 20);
    if (op.ropa) pintarPieza(b, (c, p) => { c.multiplyScalar(1 + 0.05 * Math.sin(Math.atan2(p.x, p.z) * 30) - 0.12 * sv(0.03, 0.0, p.y)); });
    cabeza.add(b);
    cabeza.add(bola(abrigo, [0.009, 0.015, 0.009], [0.012, F.cy + 0.132, -0.014]));
  } else if (colores.gorro === 'sombrero') {
    const fieltro = '#5f4730', cinta = '#3a2d21', y0 = F.cy + 0.07;
    const copa = torno(fieltro, [[1.0, 0.0], [1.0, 0.026], [1.0, 0.03], [1.0, 0.06], [0.94, 0.096], [0.75, 0.11], [0.0, 0.116]], [0, y0, -0.004], null, [kx + 0.002, 1, kz + 0.002], 18);
    deformar(copa, (v) => { if (v.y > 0.09) v.y -= 0.02 * Math.max(0, 1 - Math.abs(v.x) / 0.6); });
    pintarPieza(copa, (c, p) => { if (p.y > -0.002 && p.y < 0.027) c.set(cinta); });
    cabeza.add(copa);
    for (const s of [1, -1]) {
      const ala = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.22, 26, 3), color(s > 0 ? fieltro : matiz(fieltro, 0.8)));
      ala.rotation.x = -s * Math.PI / 2;
      deformar(ala, (v) => { const r = Math.hypot(v.x, v.y); if (r > 0.14) v.z += (r - 0.14) * (r - 0.14) * 1.6 * (0.45 + 0.55 * Math.abs(v.x) / r) * s; });
      ala.position.set(0, y0 + 0.002 + (s > 0 ? 0.004 : -0.004), -0.004);
      cabeza.add(ala);
    }
  } else if (colores.gorro === 'gorro') {
    const y0 = F.cy + 0.04;
    const gor = torno(ropa, [[1.0, 0.0], [1.05, 0.026], [1.03, 0.05], [0.86, 0.078], [0.48, 0.094], [0.0, 0.098]], [0, y0, -0.006], [-0.09, 0, 0], [kx, 1, kz], 18);
    if (op.ropa) pintarPieza(gor, (c, p) => {
      const a = Math.atan2(p.x, p.z);
      c.multiplyScalar(1 - 0.22 * Math.exp(-((Math.sin(a * 3) / 0.08) ** 2)) * sv(0.03, 0.06, p.y));   // las costuras de los gajos
      c.multiplyScalar(1 - 0.1 * sv(0.012, 0.0, p.y));                                                      // la vincha
      c.multiplyScalar(0.86 + 0.18 * sv(0.0, 0.09, p.y));
    });
    cabeza.add(gor);
    cabeza.add(deformar(bola(matiz(ropa, 0.72), [0.072, 0.009, 0.062], [0, y0 + 0.006, kz * 0.86], [-0.2, 0, 0], [16, 6]), (v) => { if (v.z < 0) v.z *= 0.15; }));   // la visera
    if (op.ropa) cabeza.add(bola(matiz(ropa, 0.8), [0.008, 0.005, 0.008], [0, y0 + 0.096, -0.014]));
  }
}

// ---------------------------------------------------------------- el cuerpo
const CODO_MATE = -2.3;
const DIR_MATE = (() => { const c = Math.cos(CODO_MATE), s = Math.sin(CODO_MATE); return new THREE.Vector3(-0.4, -c, -s).normalize(); })();

function figura(colores, clave, conMate, R, op) {
  const mujer = !!(R.pollera || R.trenza || R.rodete);
  const chico = /^aldea-nen[ae]$/.test(clave);
  const g = new THREE.Group();
  const colPiel = colores.piel || R.piel || '#c49a70';
  const ropa = colores.ropa || '#7a6a5a', abrigo = colores.abrigo || '#4a3a30';
  const pantalon = colores.pantalon || R.pantalon || '#3f3a33';
  const bota = R.botas === 'goma' ? '#2a2d2c' : R.botas === 'trekking' ? '#5a4632' : '#3b2f26';
  const manga = R.chaleco ? ropa : abrigo;
  const k = mujer ? 1 : 1.06;         // los varones, un poco más anchos
  const hx = mujer ? 0.166 : 0.18;    // el hombro (pivote del brazo)
  // pliegues: la tela que se junta (más oscura en el fondo del pliegue, más clara en el lomo)
  const surcos = (c, s, fuerza = 0.18) => { c.multiplyScalar(1 - fuerza * Math.max(0, -s) + fuerza * 0.4 * Math.max(0, s)); };

  // ---- piernas (muslo en la cadera, canilla y bota en la rodilla, el pie en el tobillo)
  const altas = R.botas === 'altas' || R.botas === 'goma';
  const RODILLA = 0.37, TOBILLO = -0.39;
  const lx = mujer ? 0.086 : 0.094;
  const perfilMuslo = R.bombacha
    ? [[0.0, -0.49], [0.058, -0.475], [0.083, -0.44], [0.096, -0.3], [0.096, -0.17], [0.088, -0.04], [0.07, 0.06]]
    : [[0.0, -0.47], [0.048, -0.457], [0.06, -0.43], [0.064, -0.39], [0.072 * k, -0.28], [0.081 * k, -0.12], [0.083 * k, 0.0], [0.07, 0.06]];
  const perfilCanilla = (R.bombacha
    ? [[0.05, -0.7], [0.055, -0.6], [0.064, -0.5], [0.08, -0.43], [0.082, -0.38], [0.062, -0.335], [0.0, -0.32]]
    : [[0.047, -0.7], [0.051, -0.62], [0.057 * k, -0.52], [0.06 * k, -0.45], [0.058, -0.37], [0.044, -0.335], [0.0, -0.325]]).map(([r, y]) => [r, y + RODILLA]);
  const perfilBota = (altas
    ? [[0.05, -0.76], [0.057, -0.72], [0.063, -0.6], [0.067, -0.5], [0.072, -0.44], [0.067, -0.435]]
    : [[0.05, -0.76], [0.055, -0.74], [0.059, -0.66], [0.063, -0.62], [0.059, -0.615]]).map(([r, y]) => [r, y + RODILLA]);
  const patas = [];
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(l * lx, 0.82, 0);
    const muslo = torno(pantalon, perfilMuslo, null, null, [1, 1, 0.92], 12);
    if (op.ropa) pintarPieza(muslo, (c, p) => { surcos(c, Math.sin(p.y * 70 + p.x * 40) * sv(-0.32, -0.42, p.y), 0.14); c.multiplyScalar(1 - 0.12 * sv(-0.02, 0.05, p.y)); });
    piv.add(muslo);
    const rodilla = new THREE.Group(); rodilla.position.set(0, -RODILLA, 0);
    const canilla = torno(pantalon, perfilCanilla, null, null, [1, 1, 0.92], 12);
    if (op.ropa) pintarPieza(canilla, (c, p) => { surcos(c, Math.sin(p.y * 90 - p.x * 30) * sv(-0.2, -0.3, p.y), 0.16); });
    rodilla.add(canilla);
    const caña = torno(bota, perfilBota, null, null, null, 12);
    if (op.ropa) pintarPieza(caña, (c, p) => { if (p.y > (altas ? -0.075 : -0.255)) c.multiplyScalar(0.82); c.multiplyScalar(1 + 0.06 * Math.sin(p.y * 120)); });
    rodilla.add(caña);
    const tobillo = new THREE.Group(); tobillo.position.set(0, TOBILLO, 0.0);
    tobillo.add(bola(bota, [0.056, 0.046, 0.122], [0, -0.39 - TOBILLO, 0.05]));                       // el empeine
    tobillo.add(bola(matiz(bota, 0.5), [0.059, 0.017, 0.125], [0, -0.425 - TOBILLO, 0.045]));         // la suela
    if (op.ropa && R.botas === 'trekking') for (let i = 0; i < 3; i++) tobillo.add(bola('#c8b89a', [0.022, 0.0035, 0.005], [0, -0.36 - TOBILLO + i * 0.016, 0.09 - i * 0.012], [0.5, 0, 0]));
    rodilla.add(tobillo); rodilla.userData.tobillo = tobillo;
    piv.add(rodilla); piv.userData.rodilla = rodilla;
    g.add(piv); patas.push(piv);
  }

  // ---- torso: cintura y caderas de adulto, pecho, hombros; la ropa de cada uno
  const torso = new THREE.Group(); torso.position.set(0, 0.82, 0);
  const pechoK = mujer ? 0.17 : 0.07;
  const zPecho = (x, y) => 1 + pechoK * Math.exp(-(((y - 0.325) / 0.075) ** 2)) * (mujer ? Math.exp(-((x / 0.11) ** 2)) * 1.4 : 1);
  const capa = (c, perfil, lados = 18, desde = 0, arco = Math.PI * 2, zBase = 0.7, ondas = 0) => deformar(torno(c, perfil, null, null, null, lados, desde, arco), (v) => {
    const hombro = Math.max(0, 1 - Math.abs(v.y - 0.46) / 0.07);
    if (ondas) { const q = 1 + ondas * Math.sin(Math.atan2(v.x, v.z) * 9 + 0.3) * Math.min(1, Math.max(0, -v.y / 0.4)); v.x *= q; v.z *= q; }
    v.z *= zBase * (v.z > 0 ? zPecho(v.x, v.y) : 0.97) * (v.y > 0.44 ? 0.84 : 1);
    v.x *= 1 + 0.05 * hombro;
  });
  const cuerpoAlto = mujer
    ? [[0.15, 0.03], [0.139, 0.11], [0.126, 0.19], [0.13, 0.25], [0.146, 0.31], [0.151, 0.36], [0.155, 0.42], [0.16, 0.462], [0.15, 0.5], [0.116, 0.528], [0.075, 0.545], [0.05, 0.553]]
    : [[0.15, 0.03], [0.144, 0.11], [0.141, 0.19], [0.15, 0.26], [0.163, 0.33], [0.172, 0.39], [0.178, 0.44], [0.181, 0.468], [0.17, 0.503], [0.13, 0.532], [0.082, 0.55], [0.058, 0.558]];
  torso.add(bola(pantalon, [0.145 * (mujer ? 1.02 : 1), 0.115, 0.102], [0, 0.02, 0]));
  const faldon = R.campera === 'larga' ? [[0.17, -0.22], [0.16, -0.1]] : [[0.152, -0.07]];
  let capaHombro;
  const arrugasTorso = (c, p) => {
    if (!op.ropa) return;
    // la tela se junta en la cintura y bajo los brazos; tirones en diagonal desde el hombro
    surcos(c, Math.sin(p.y * 110 + Math.abs(p.x) * 30) * Math.exp(-(((p.y - 0.17) / 0.05) ** 2)), 0.18);
    surcos(c, Math.sin((p.y + Math.abs(p.x) * 1.4) * 60) * sv(0.08, 0.13, Math.abs(p.x)) * Math.exp(-(((p.y - 0.36) / 0.08) ** 2)), 0.12);
    if (p.z < 0) surcos(c, Math.sin(p.x * 50) * sv(0.2, 0.0, p.y), 0.08);
  };
  if (R.chaleco || R.abierta) {
    capaHombro = pintarPieza(capa(ropa, [[0.142, -0.02], ...cuerpoAlto.map(([r, y]) => [r - 0.006, y])], 16), (c, p) => {
      arrugasTorso(c, p);
      if (op.ropa && p.z > 0 && Math.abs(p.x) < 0.012 && p.y > 0.05 && p.y < 0.5) c.multiplyScalar(0.9);   // la tapeta de la camisa
    });
    torso.add(capaHombro);
  }
  if (R.chaleco) {
    torso.add(pintarPieza(capa(abrigo, [[0.158, -0.06], [0.157, 0.02], [0.148, 0.12], [0.162, 0.24], [0.188, 0.35], [0.196, 0.43], [0.188, 0.478]].map(([r, y]) => [r * (mujer ? 0.92 : 1), y]), 16, 0.4, Math.PI * 2 - 0.8), (c, p) => {
      if (op.ropa) { if (Math.abs(Math.atan2(p.x, p.z)) < 0.5) c.multiplyScalar(0.82); arrugasTorso(c, p); }
    }));
    if (R.bombacha) torso.add(capa('#7a2e26', [[0.155, -0.05], [0.161, -0.038], [0.162, 0.028], [0.157, 0.042]], 18));
    else torso.add(capa('#4a3626', [[0.16, -0.035], [0.16, 0.02]], 16));
    if (op.ropa) for (const y of [0.1, 0.2, 0.3]) torso.add(bola('#2a2018', [0.008, 0.008, 0.005], [0.064, y, 0.118 * zPecho(0.064, y) + 0.004]));
  } else {
    capaHombro = pintarPieza(capa(abrigo, [...faldon, ...cuerpoAlto], R.campera === 'larga' ? 26 : 18, R.abierta ? 0.3 : 0, R.abierta ? Math.PI * 2 - 0.6 : Math.PI * 2, 0.7, R.campera === 'larga' ? 0.03 : 0), (c, p) => {
      arrugasTorso(c, p);
      if (op.ropa && R.campera === 'larga') surcos(c, Math.sin(Math.atan2(p.x, p.z) * 9 + 0.3) * sv(0.0, -0.2, p.y), 0.16);
    });
    torso.add(capaHombro);
    torso.add(capa(matiz(abrigo, 0.88), [[0.078, 0.525], [0.08, 0.565], [0.07, 0.58]], 16, 0, Math.PI * 2, 0.95));   // el cuello
    if (!R.campera && !R.pollera && !colores.poncho) {
      // el cinturón (B: con hebilla)
      torso.add(capa('#3a2a1e', [[0.152, -0.04], [0.153, -0.005], [0.15, 0.0]], 18));
      if (op.ropa) { torso.add(bola('#b8a070', [0.022, 0.016, 0.006], [0, -0.022, 0.108])); torso.add(bola('#3a2a1e', [0.014, 0.009, 0.004], [0, -0.022, 0.112])); }
    }
  }
  if (op.ropa && !colores.poncho && !(colores.bufanda || R.panuelo) && !colores.barba) {
    // el cuello de la camisa: dos solapas en punta
    const tela = R.chaleco || R.abierta ? ropa : matiz(abrigo, 0.95);
    torso.add(capa(tela, [[0.066, 0.528], [0.07, 0.548], [0.066, 0.572], [0.06, 0.578]], 16, 0.35, Math.PI * 2 - 0.7, 0.98));
    for (const l of [-1, 1]) torso.add(bola(tela, [0.02, 0.028, 0.0035], [l * 0.027, 0.53, 0.066], [0.55, l * 0.3, l * 0.7]));
  }
  if (R.pollera) {
    torso.add(pintarPieza(capa(mezcla(ropa, '#2a2420', 0.35), [[0.24, -0.52], [0.227, -0.42], [0.198, -0.24], [0.174, -0.08], [0.162, 0.02], [0.146, 0.1], [0.132, 0.18], [0.129, 0.21]], 36, 0, Math.PI * 2, 0.78, 0.045), (c, p) => {
      if (!op.ropa) return;
      surcos(c, Math.sin(Math.atan2(p.x, p.z) * 9 + 0.3) * sv(0.1, -0.3, p.y), 0.3);
      if (p.y < -0.48) c.multiplyScalar(0.84);                       // el ruedo
      if (p.y > 0.17) c.multiplyScalar(0.9);                         // la pretina
    }));
  }
  if (R.delantal) {
    const perfil = R.pollera
      ? [[0.245, -0.4], [0.226, -0.28], [0.198, -0.14], [0.178, -0.04], [0.166, 0.04], [0.158, 0.12], [0.168, 0.24], [0.188, 0.36]]
      : [[0.186, -0.4], [0.178, -0.2], [0.166, -0.04], [0.162, 0.04], [0.158, 0.12], [0.168, 0.24], [0.19, 0.36]];
    torso.add(pintarPieza(capa(R.delantal, perfil.map(([r, y]) => [r * (mujer ? 1 : 1.03), y]), 14, -0.68, 1.36, R.pollera ? 0.79 : 0.72), (c, p) => {
      if (!op.ropa) return;
      surcos(c, Math.sin(p.x * 70 + 0.5) * sv(0.05, -0.3, p.y), 0.14);
      if (p.y < -0.37) c.multiplyScalar(0.88);
      if (p.y > -0.2 && p.y < -0.08 && Math.abs(p.x - 0.06) < 0.05) c.multiplyScalar(0.92);    // el bolsillo
      if (Math.abs(p.y + 0.08) < 0.004 && Math.abs(p.x - 0.06) < 0.05) c.multiplyScalar(0.75);
    }));
    if (op.ropa) {
      // la tira a la cintura y el moño atrás
      torso.add(capa(matiz(R.delantal, 0.9), [[0.137, 0.17], [0.138, 0.19]], 18));
      for (const l of [-1, 1]) torso.add(bola(matiz(R.delantal, 0.92), [0.03, 0.016, 0.01], [l * 0.025, 0.18, -0.1], [0, 0, l * 0.4]));
      for (const l of [-1, 1]) torso.add(bola(matiz(R.delantal, 0.88), [0.008, 0.06, 0.006], [l * 0.012, 0.12, -0.103], [0.1, 0, l * 0.15]));
    }
  }
  if (R.bolsillos) for (const l of [-1, 1]) {
    torso.add(bola(matiz(abrigo, 0.88), [0.034, 0.032, 0.004], [l * 0.072, 0.325, 0.128], [-0.1, l * 0.36, 0]));
    torso.add(bola(matiz(abrigo, 0.74), [0.037, 0.011, 0.006], [l * 0.073, 0.36, 0.128], [-0.1, l * 0.36, 0]));
  }
  if (R.botones) for (const l of [-1, 1]) for (const y of [0.16, 0.27, 0.38]) torso.add(bola(R.botones, [0.01, 0.01, 0.007], [l * 0.045, y, 0.112 * zPecho(0.045, y) + 0.002]));
  if (op.ropa && !R.botones && !R.chaleco && !R.abierta && !R.delantal && !colores.poncho) for (const y of [0.1, 0.2, 0.3, 0.4]) torso.add(bola(matiz(abrigo, 0.6), [0.0065, 0.0065, 0.004], [0, y, 0.1 * zPecho(0, y) + 0.002]));
  if (colores.poncho) {
    const claroP = mezcla(abrigo, '#e3d6b8', 0.7), oscuroP = matiz(abrigo, 0.55), listaP = matiz(abrigo, 0.78);
    const caida = (v) => {
      const r = Math.hypot(v.x, v.z), cz = r > 1e-4 ? v.z / r : 0, fi = Math.atan2(v.x, v.z);
      const pl = 1 + 0.04 * Math.sin(fi * 7 + 0.4) * Math.min(1, Math.max(0, (0.36 - v.y) / 0.45));
      v.x *= pl; v.z *= pl;
      if (v.y < 0.12) v.y -= 0.075 * cz * cz * Math.min(1, (0.12 - v.y) / 0.25);
      v.z *= 0.64;
    };
    const sx = hx / 0.225 * 1.05;
    const perfilP = [[0.35, -0.18], [0.348, -0.15], [0.347, -0.146], [0.345, -0.12], [0.344, -0.116], [0.342, -0.09], [0.341, -0.086],
      [0.335, 0.05], [0.325, 0.2], [0.31, 0.33], [0.29, 0.43], [0.255, 0.49], [0.2, 0.53], [0.14, 0.56], [0.09, 0.582], [0.074, 0.596]].map(([r, y]) => [r * (y < 0.53 ? sx : 1), y]);
    const p = torno(abrigo, perfilP, null, null, null, 30);
    colorear(p, (c, v, i) => {
      if (v.y >= -0.1465 && v.y <= -0.1195) c.set(claroP);
      else if (v.y >= -0.1165 && v.y <= -0.0895) c.set(oscuroP);
      else if (Math.floor(i / perfilP.length) % 7 === 3) c.set(listaP);
    });
    torso.add(deformar(p, caida));
    const flecos = torno(abrigo, [[0.352 * sx, -0.215], [0.35 * sx, -0.178]], null, null, null, 56);
    colorear(flecos, (c, v, i) => { c.multiplyScalar(Math.floor(i / 2) % 2 ? 0.6 : 1.08); });
    torso.add(deformar(flecos, caida));
    torso.add(torno(matiz(abrigo, 0.8), [[0.08, 0.578], [0.077, 0.605], [0.066, 0.612]], null, null, null, 14));
  }
  const cuello = colores.bufanda || R.panuelo;
  if (cuello && !colores.poncho) {
    const vuelta = new THREE.Mesh(new THREE.TorusGeometry(0.07, R.panuelo ? 0.016 : 0.027, 8, 22), color(cuello));
    vuelta.position.set(0, 0.548, 0.008); vuelta.rotation.set(Math.PI / 2 - 0.16, 0, 0); vuelta.scale.set(1, 0.9, 1);
    if (op.ropa) pintarPieza(vuelta, (c, p) => { c.multiplyScalar(1 + 0.1 * Math.sin(Math.atan2(p.y, p.x) * 18)); });
    torso.add(vuelta);
    if (R.panuelo) {
      torso.add(bola(cuello, [0.02, 0.017, 0.015], [0, 0.515, 0.112]));
      for (const l of [-1, 1]) {
        const punta = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.07, 3, 1), color(matiz(cuello, 0.92))), (v) => { v.z *= 0.3; });
        punta.position.set(l * 0.011, 0.48, 0.118); punta.rotation.set(Math.PI - 0.32, 0, -l * 0.28); torso.add(punta);
      }
    } else {
      const v2 = new THREE.Mesh(new THREE.TorusGeometry(0.067, 0.023, 8, 22), color(matiz(cuello, 0.93)));
      v2.position.set(0, 0.52, 0.012); v2.rotation.set(Math.PI / 2 - 0.1, 0.12, 0);
      torso.add(v2);
      for (const pz of puntasBufanda(cuello, { x: -0.088, y: 0.512, pecho: 0.142 + (mujer ? 0.012 : 0), largo: 0.16 })) torso.add(pz);
    }
  }

  // ---- brazos: hombro, codo (grupo propio: hueso en C y D), muñeca y mano con dedos
  const brazos = [];
  let muneca = null;
  const kb = mujer ? 1 : 1.1;
  const manoCon5 = (grupo, W, l) => {
    // la palma (de canto, mirando al muslo), cuatro dedos un poco curvos y el pulgar adelante
    grupo.add(piel(bola(colPiel, [0.0125 * kb, 0.04 * kb, 0.024 * kb], [W[0] - l * 0.002, W[1] - 0.045, W[2] + 0.003], [0.05, 0, 0], [12, 9])));
    for (const [dz, L] of [[0.015, 0.06], [0.0055, 0.068], [-0.0045, 0.064], [-0.0135, 0.052]]) {
      const y0 = W[1] - 0.074 * kb, z0 = W[2] + dz * kb, Lk = L * kb;
      const pts = [[W[0] - l * 0.001, y0 + 0.006, z0], [W[0] - l * 0.003, y0 - Lk * 0.45, z0 + 0.004], [W[0] - l * 0.011, y0 - Lk * 0.85, z0 + 0.003], [W[0] - l * 0.017, y0 - Lk, z0 + 0.001]];
      const d = huso(colPiel, pts, [0.0064 * kb, 0.0058 * kb, 0.0052 * kb, 0.0047 * kb], 6, 6);
      grupo.add(piel(pintarPieza(d, (c, p) => { tinta(c, mezcla(colPiel, '#c4544a', 0.4), 0.25 * sv(y0 - Lk * 0.6, y0 - Lk, p.y)); })));
    }
    grupo.add(piel(huso(colPiel, [[W[0] - l * 0.006, W[1] - 0.03, W[2] + 0.02], [W[0] - l * 0.012, W[1] - 0.055, W[2] + 0.029], [W[0] - l * 0.012, W[1] - 0.077, W[2] + 0.03]], [0.0095 * kb, 0.0068 * kb, 0.0055 * kb], 6, 6)));
  };
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(l * hx, 1.3, 0);
    const codo = new THREE.Group(); codo.position.set(l * 0.004, -0.27, 0.004);
    const arrugaManga = (c, p) => { if (op.ropa) surcos(c, Math.sin(p.y * 160) * Math.exp(-(((p.y + 0.27) / 0.035) ** 2)), 0.2); };
    let conCodo = true;
    if (conMate && l === 1) {
      conCodo = false;
      const codoP = [l * 0.012, -0.28, 0.0], D = DIR_MATE;
      const en = (t) => [codoP[0] + D.x * t, codoP[1] + D.y * t, codoP[2] + D.z * t];
      const W = en(0.25);
      const brazo = colores.poncho
        ? [[[codoP[0], -0.24, 0.0], codoP, en(0.06), en(0.15), W], [0.042, 0.045, 0.044, 0.042, 0.036]]
        : [[[-l * 0.035, 0.012, 0], [-l * 0.012, -0.02, 0], [l * 0.002, -0.1, 0.0], [codoP[0], -0.235, 0.0], codoP, en(0.05), en(0.14), W],
          [0.032, 0.046 * kb, 0.043 * kb, 0.038 * kb, 0.036 * kb, 0.036 * kb, 0.033 * kb, 0.028]];
      piv.add(pintarPieza(huso(manga, brazo[0], brazo[1], colores.poncho ? 12 : 22, 12), arrugaManga));
      const puno = torno(matiz(manga, 0.82), [[0.031, -0.02], [0.034, -0.004], [0.033, 0.016], [0.029, 0.02]], W, null, null, 12);
      puno.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), D);
      piv.add(puno);
      muneca = new THREE.Group(); muneca.position.set(W[0], W[1], W[2]);
      const MC = [-0.045, 0.035, 0.03], en2 = (a, b, c) => [MC[0] + a, MC[1] + b, MC[2] + c];
      const mano = [
        piel(bola(colPiel, [0.02, 0.04, 0.031], [0.01, 0.02, 0.016], [0.35, 0, -0.25])),
        piel(bola(colPiel, [0.02, 0.028, 0.046], en2(0.02, -0.011, 0.037), [0, -0.75, 0])),
        piel(bola(colPiel, [0.011, 0.028, 0.013], en2(0.018, 0.011, -0.042), [0.3, 0, 0.5])),
      ];
      for (const m of mano) muneca.add(m);
      for (const m of [
        torno('#6b4a2c', [[0.0, -0.055], [0.04, -0.05], [0.058, -0.015], [0.056, 0.025], [0.045, 0.05], [0.042, 0.058]], MC, null, null, 14),
        torno('#b8b2a4', [[0.042, 0.056], [0.045, 0.06], [0.045, 0.072], [0.041, 0.074]], MC, null, null, 14),
        bola('#3b4a2a', [0.04, 0.008, 0.04], en2(0, 0.064, 0)),
        tubo('#b9b2a0', 0.006, 0.006, 0.16, en2(0.02, 0.11, 0.01), [0.25, 0, 0.2], 6, true),
      ]) { m.userData.mate = 1; muneca.add(m); }
      muneca.userData.indicesMano = mano.reduce((s, m) => s + m.geometry.index.count, 0);
      piv.add(muneca); piv.userData.muneca = muneca;
    } else {
      const W = [l * 0.012, -0.49, 0.03];
      const pts = colores.poncho
        ? [[l * 0.006, -0.26, 0.004], [l * 0.008, -0.32, 0.01], [l * 0.01, -0.42, 0.02], W]
        : [[-l * 0.035, 0.012, 0], [-l * 0.012, -0.02, 0], [0, -0.06, 0], [l * 0.002, -0.14, 0.0], [l * 0.004, -0.25, 0.004], [l * 0.006, -0.29, 0.008], [l * 0.008, -0.37, 0.018], W];
      const rad = colores.poncho ? [0.038, 0.037, 0.034, 0.028] : [0.032, 0.046 * kb, 0.045 * kb, 0.041 * kb, 0.035 * kb, 0.034 * kb, 0.034 * kb, 0.027];
      piv.add(pintarPieza(huso(manga, pts, rad, colores.poncho ? 10 : 22, 12), arrugaManga));
      // el puño y la mano, en el codo (así en C y D el antebrazo dobla)
      const Wc = [W[0] - codo.position.x, W[1] - codo.position.y, W[2] - codo.position.z];
      const puno = torno(matiz(manga, 0.82), [[0.03, -0.02], [0.033, -0.004], [0.032, 0.016], [0.028, 0.02]], [Wc[0], Wc[1] - 0.004, Wc[2]], [-0.1, 0, 0], null, 12);
      if (op.ropa) pintarPieza(puno, (c, p) => { if (Math.abs(p.y) < 0.003) c.multiplyScalar(0.8); });
      codo.add(puno);
      if (op.ropa) codo.add(bola('#d8d0c0', [0.004, 0.004, 0.003], [Wc[0] + l * 0.03, Wc[1] + 0.004, Wc[2] + 0.004]));
      manoCon5(codo, Wc, l);
      piv.add(codo);
    }
    const ante = new THREE.Group(); ante.position.set(0, -0.28, 0);
    piv.add(ante);
    piv.userData.ante = ante; piv.userData.codo = conCodo ? codo : null;
    g.add(piv); brazos.push(piv);
  }
  g.add(torso);

  // ---- cabeza
  const cabeza = new THREE.Group(); cabeza.position.set(0, 1.46, 0);
  const F = medidasCara(mujer, chico);
  armarCabeza(cabeza, F, colores, R, op, colPiel);
  if (chico) cabeza.scale.setScalar(1.42);   // los chicos: la cabeza grande para el cuerpo
  g.add(cabeza);
  return { g, cabeza, torso, patas, brazos, muneca, mujer, chico, escala: mujer || chico ? 1 : 1.07 };
}

// ---------------------------------------------------------------- A y B: fundido como siempre
// (una malla por grupo, MAT_FAUNA: las mismas llamadas de dibujo que hoy)
function soltarEn(grupo) {
  // pasa los hijos de un grupo sin giro a su padre (para que no sume una llamada de dibujo)
  const padre = grupo.parent;
  for (const h of [...grupo.children]) { if (h.isGroup) continue; h.position.add(grupo.position); padre.add(h); }
}
function fundidoSimple(f) {
  const { g, cabeza, brazos, patas } = f;
  for (const o of [...cabeza.userData.ojos, ...cabeza.userData.parpados]) soltarEn(o);
  for (const b of brazos) if (b.userData.codo) soltarEn(b.userData.codo);
  for (const p of patas) soltarEn(p.userData.rodilla.userData.tobillo);
  compactar(g, { alto: 1.75, pie: 0.8, panza: 0.1, todo: true });
}

// ---------------------------------------------------------------- C y D: piel por huesos
// El three del juego no trae SkinnedMesh: una malla con `isSkinnedMesh` y un esqueleto mínimo
// (lo que el dibujante usa: update() y boneTexture). Los huesos son los grupos de la figura.
class Esqueleto {
  constructor(huesos, malla) {
    this.huesos = huesos; this.malla = malla;
    const inv = new THREE.Matrix4().copy(malla.matrixWorld).invert();
    this.inversas = huesos.map((h) => new THREE.Matrix4().multiplyMatrices(inv, h.matrixWorld).invert());
    let lado = 4; while (lado * lado < huesos.length * 4) lado *= 2;
    this.boneMatrices = new Float32Array(lado * lado * 4);
    this.boneTexture = new THREE.DataTexture(this.boneMatrices, lado, lado, THREE.RGBAFormat, 1015 /* FloatType */);
    this.boneTexture.needsUpdate = true;
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
class MallaConPiel extends THREE.Mesh {
  constructor(geo, mat) {
    super(geo, mat);
    this.isSkinnedMesh = true;
    this.bindMode = 'attached';
    this.bindMatrix = new THREE.Matrix4(); this.bindMatrixInverse = new THREE.Matrix4();
    this.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.85, 0), 1.15);
  }
  computeBoundingSphere() { return this.boundingSphere; }
  applyBoneTransform(i, v) { return v; }
  raycast() {}
}

// el material de D: piel tibia (la luz se cuela en el borde de la sombra), la oclusión en la luz
// del cielo y un toque de calor en la piel a la sombra. `zona` = (piel, oclusión).
let MAT_PIEL = null;
function materialPiel() {
  if (MAT_PIEL) return MAT_PIEL;
  MAT_PIEL = new THREE.MeshLambertMaterial({ vertexColors: true });
  MAT_PIEL.onBeforeCompile = (sh) => {
    MAT_FAUNA.onBeforeCompile(sh);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 zona; varying vec2 vZona;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvZona = zona;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vZona;')
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.indirectDiffuse *= mix(1.0, vZona.y, 0.9);
        reflectedLight.indirectDiffuse += vZona.x * diffuseColor.rgb * vec3(0.05, 0.018, 0.008);
        #if NUM_DIR_LIGHTS > 0
        {
          float ndl = dot(normal, directionalLights[0].direction);
          float envuelve = clamp((ndl + 0.42) / 1.42, 0.0, 1.0) - clamp(ndl, 0.0, 1.0);
          reflectedLight.directDiffuse += directionalLights[0].color * diffuseColor.rgb * vec3(0.85, 0.4, 0.3) * envuelve * vZona.x * 0.4 * vZona.y;
        }
        #endif`);
  };
  MAT_PIEL.customProgramCacheKey = () => 'proto-piel-1';
  return MAT_PIEL;
}

const _mRel = new THREE.Matrix4(), _mInvRaiz = new THREE.Matrix4(), _nmRel = new THREE.Matrix3();
const _frio = new THREE.Color('#2b3442'), _tibio = new THREE.Color('#fff1d8');
function sombraPintada(c, p, n) {
  const t = Math.min(1, Math.max(0, p.y / 0.875)), s = t * t * (3 - 2 * t);
  let f = 0.8 + 0.2 * s;
  f *= 1 - 0.1 * Math.max(0, -n.y);
  c.multiplyScalar(f).lerp(_frio, (1 - f) * 0.2);
  if (n.y > 0.35) c.lerp(_tibio, (n.y - 0.35) * 0.05);
}
function continuo(f, op) {
  const { g, cabeza, torso, brazos, patas, muneca } = f;
  g.updateMatrixWorld(true);
  _mInvRaiz.copy(g.matrixWorld).invert();
  // los huesos
  const H = [torso, cabeza];
  const idx = new Map([[torso, 0], [cabeza, 1]]);
  const sumar = (o) => { if (o && !idx.has(o)) { idx.set(o, H.length); H.push(o); } };
  for (const b of brazos) { sumar(b); sumar(b.userData.codo); }
  for (const p of patas) { sumar(p); sumar(p.userData.rodilla); sumar(p.userData.rodilla.userData.tobillo); }
  for (const o of cabeza.userData.ojos) sumar(o);
  for (const o of cabeza.userData.parpados) sumar(o);
  sumar(muneca);
  const mallas = [];
  g.traverse((o) => { if (o.isMesh) mallas.push(o); });
  // lo del mate va al final (para guardarlo con drawRange)
  mallas.sort((a, b) => (a.userData.mate ? 1 : 0) - (b.userData.mate ? 1 : 0));
  let nv = 0, ni = 0;
  for (const m of mallas) { nv += m.geometry.attributes.position.count; ni += m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), zona = new Float32Array(nv * 2);
  const si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), pieza = new Uint16Array(nv), tapa = new Uint8Array(nv);
  const ind = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  const p = new THREE.Vector3(), q = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Color();
  const [hombroIzq, hombroDer] = brazos;
  const rodillas = patas.map((pt) => pt.userData.rodilla);
  let ov = 0, oi = 0, iMate = -1;
  mallas.forEach((m, k) => {
    const geo = m.geometry, P = geo.attributes.position, C = geo.attributes.color;
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const N = geo.attributes.normal;
    m.updateMatrix();
    _mRel.multiplyMatrices(_mInvRaiz, m.matrixWorld); _nmRel.getNormalMatrix(_mRel);
    const grupo = m.parent, hueso = idx.has(grupo) ? idx.get(grupo) : 0;
    const sup = m.userData.superior;
    if (m.userData.mate && iMate < 0) iMate = oi;
    for (let i = 0; i < P.count; i++) {
      const j = ov + i;
      p.fromBufferAttribute(P, i).applyMatrix4(_mRel);
      q.fromBufferAttribute(P, i).applyMatrix4(m.matrix);   // en el espacio del grupo
      n.fromBufferAttribute(N, i).applyMatrix3(_nmRel).normalize();
      pos[j * 3] = p.x; pos[j * 3 + 1] = p.y; pos[j * 3 + 2] = p.z;
      nor[j * 3] = n.x; nor[j * 3 + 1] = n.y; nor[j * 3 + 2] = n.z;
      if (C) c.setRGB(C.getX(i), C.getY(i), C.getZ(i)); else c.copy(m.material.color);
      sombraPintada(c, p, n);
      col[j * 3] = c.r; col[j * 3 + 1] = c.g; col[j * 3 + 2] = c.b;
      zona[j * 2] = m.userData.piel ? 1 : 0; zona[j * 2 + 1] = 1;
      pieza[j] = k; tapa[j] = m.userData.noTapa ? 0 : 1;
      // los pesos: el hueso de la pieza, y las mezclas en las juntas
      const w = new Map([[hueso, 1]]);
      const mezclar = (otro, t) => { if (otro == null || t <= 0) return; for (const [h, v] of w) w.set(h, v * (1 - t)); w.set(otro, (w.get(otro) || 0) + t); };
      if (grupo === hombroIzq || grupo === hombroDer) {
        if (!m.userData.mate) mezclar(0, 0.55 * sv(-0.07, 0.01, q.y));                     // el hombro, con el torso
        const cd = grupo.userData.codo;
        if (cd) mezclar(idx.get(cd), sv(-0.23, -0.31, q.y));                                // el codo
      } else if (grupo === torso) {
        for (const [b, s] of [[hombroIzq, -1], [hombroDer, 1]]) if (q.x * s > 0 && q.y < 0.56) mezclar(idx.get(b), 0.4 * sv(0.09, 0.16, Math.abs(q.x)) * sv(0.36, 0.44, q.y));
        for (const [pt, s] of [[patas[0], -1], [patas[1], 1]]) if (q.x * s > 0) {
          mezclar(idx.get(pt), 0.38 * sv(0.05, -0.07, q.y) * sv(0.0, 0.07, Math.abs(q.x)) * sv(-0.3, -0.1, q.y + 0.2));   // la cadera
          mezclar(idx.get(pt), 0.3 * sv(-0.12, -0.45, q.y) * sv(0.0, 0.08, Math.abs(q.x)));                               // la pollera sigue a la pierna
        }
      } else if (patas.includes(grupo)) {
        mezclar(0, 0.45 * sv(-0.08, 0.03, q.y));
        mezclar(idx.get(grupo.userData.rodilla), sv(-0.3, -0.385, q.y));
      } else if (rodillas.includes(grupo)) {
        mezclar(idx.get(grupo.parent), 0.5 * sv(-0.05, 0.03, q.y));
        mezclar(idx.get(grupo.userData.tobillo), sv(-0.34, -0.4, q.y));
      } else if (grupo === cabeza) {
        mezclar(0, sv(-0.075, -0.125, q.y));                                                // el cuello baja al torso
      } else if (sup) {
        // el párpado de abajo se queda con la cabeza; el de arriba, con su hueso (parpadea)
        w.clear(); w.set(idx.get(grupo), sup[i]); w.set(1, 1 - sup[i]);
      }
      const lista = [...w].filter(([, v]) => v > 1e-3).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const tot = lista.reduce((s, [, v]) => s + v, 0) || 1;
      lista.forEach(([h, v], r) => { si[j * 4 + r] = h; sw[j * 4 + r] = v / tot; });
    }
    if (geo.index) for (let i = 0; i < geo.index.count; i++) ind[oi++] = geo.index.getX(i) + ov;
    else for (let i = 0; i < P.count; i++) ind[oi++] = i + ov;
    ov += P.count;
  });
  for (const m of mallas) m.parent.remove(m);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  if (op.piel) { oclusion(pos, nor, pieza, zona, col, tapa); geo.setAttribute('zona', new THREE.BufferAttribute(zona, 2)); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(ind, 1));
  geo.computeBoundingSphere();
  const malla = new MallaConPiel(geo, op.piel ? materialPiel() : MAT_FAUNA);
  malla.castShadow = true;
  g.add(malla);
  g.updateMatrixWorld(true);
  malla.skeleton = new Esqueleto(H, malla);
  malla.userData.indicesSinMate = iMate;
  return malla;
}
// Oclusión por cercanía: cada vértice mira los vértices de otras piezas que tiene delante (en el
// hemisferio de su normal) a menos de 5 cm; cuantos más y más cerca, más oscuro (bajo el mentón,
// las axilas, entre las piernas, bajo la bufanda, el borde del gorro). Se hace una vez, al armar.
function oclusion(pos, nor, pieza, zona, col, tapa) {
  const n = pieza.length, R = 0.05, mapa = new Map();
  const clave = (x, y, z) => (x + 64) * 16384 + (y + 64) * 128 + (z + 64);
  for (let i = 0; i < n; i += 2) {
    if (!tapa[i]) continue;
    const k = clave(Math.floor(pos[i * 3] / R), Math.floor(pos[i * 3 + 1] / R), Math.floor(pos[i * 3 + 2] / R));
    let l = mapa.get(k); if (!l) mapa.set(k, l = []); l.push(i);
  }
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], nx = nor[i * 3], ny = nor[i * 3 + 1], nz = nor[i * 3 + 2];
    const cx = Math.floor(x / R), cy = Math.floor(y / R), cz = Math.floor(z / R);
    let occ = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let d = -1; d <= 1; d++) {
      const l = mapa.get(clave(cx + a, cy + b, cz + d)); if (!l) continue;
      for (const j of l) {
        if (pieza[j] === pieza[i]) continue;
        const dx = pos[j * 3] - x, dy = pos[j * 3 + 1] - y, dz = pos[j * 3 + 2] - z, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > R * R || d2 < 1e-8) continue;
        const dd = Math.sqrt(d2), fr = (dx * nx + dy * ny + dz * nz) / dd;
        if (fr < 0.15) continue;
        occ += fr * (1 - dd / R);
      }
    }
    const ao = 1 - Math.min(zona[i * 2] ? 0.3 : 0.55, occ * (zona[i * 2] ? 0.025 : 0.045));
    zona[i * 2 + 1] = ao;
    const kk = 0.6 + 0.4 * ao;
    col[i * 3] *= kk; col[i * 3 + 1] *= kk; col[i * 3 + 2] *= kk;
  }
}

// ---------------------------------------------------------------- cada cuadro (C y D)
// gente.js la llama con la persona (npc) después de ponerle los gestos de siempre
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function alPosar(op) {
  return (g, dt, camara, charlando, andando) => {
    const st = g.__mira || (g.__mira = { yaw: 0, pitch: 0, cab: 0, parpadeo: 2 + Math.random() * 3, cierra: 0, mira: 0, desvio: 0, desvioT: 0 });
    // los codos acompañan: un poco doblados siempre, más cuando el brazo va adelante
    g.brazos.forEach((b) => {
      const cd = b.userData.codo; if (!cd) return;
      const adelante = Math.max(0, -b.rotation.x);
      const obj = -(0.14 + (andando ? 0.2 : 0) + 0.55 * Math.min(1.4, adelante) + (charlando ? 0.25 : 0));
      cd.rotation.x += (obj - cd.rotation.x) * Math.min(1, dt * 10);
    });
    // los pies quedan de plano en el piso (el tobillo contra la pierna)
    g.patas.forEach((p) => { const r = p.userData.rodilla, t = r?.userData.tobillo; if (t) t.rotation.x = -(p.rotation.x + r.rotation.x) * 0.85; });
    if (!op.mirar || !camara) return;
    // mirar al jugador: la cabeza gira la mitad y los ojos el resto; de vez en cuando miran a otro lado
    const cab = g.cabeza;
    cab.getWorldPosition(_v);
    _w.copy(camara.position).sub(_v);
    const dist = Math.hypot(_w.x, _w.z);
    let ang = Math.atan2(_w.x, _w.z) - g.g.rotation.y; ang = Math.atan2(Math.sin(ang), Math.cos(ang));
    const pitch = Math.atan2(_w.y, dist);
    st.desvioT -= dt;
    if (st.desvioT <= 0) { st.desvio = Math.random() < 0.3 ? (Math.random() - 0.5) * 0.9 : 0; st.desvioT = st.desvio ? 0.7 + Math.random() : 2.5 + Math.random() * 4; }
    const mira = dist < 6 && Math.abs(ang) < 1.9 && !g.pose ? 1 : 0;
    st.mira += (mira - st.mira) * Math.min(1, dt * 3);
    const cabObj = Math.max(-0.6, Math.min(0.6, ang * 0.5)) * st.mira;
    st.cab += (cabObj - st.cab) * Math.min(1, dt * 4);
    cab.rotation.y += st.cab;
    const yawObj = mira ? Math.max(-0.42, Math.min(0.42, ang - st.cab + st.desvio)) : st.desvio * 0.5;
    const pitchObj = mira ? Math.max(-0.3, Math.min(0.25, pitch + cab.rotation.x * 0.5)) : 0;
    st.yaw += (yawObj - st.yaw) * Math.min(1, dt * 14); st.pitch += (pitchObj - st.pitch) * Math.min(1, dt * 14);
    for (const o of cab.userData.ojos) o.rotation.set(-st.pitch, st.yaw, 0);
    // parpadear (cada 2 a 6 s, 0,14 s) y el párpado acompaña la mirada hacia abajo
    st.parpadeo -= dt;
    if (st.parpadeo <= 0) { st.cierra = 0.14; st.parpadeo = 2 + Math.random() * 4; }
    let cierre = 0;
    if (st.cierra > 0) { st.cierra -= dt; cierre = Math.sin(Math.max(0, st.cierra) / 0.14 * Math.PI); }
    for (const pp of cab.userData.parpados) pp.rotation.x = 0.95 * cierre + Math.max(0, -st.pitch) * 0.45;
  };
}

// ---------------------------------------------------------------- la entrada
export function protoPersona(V, colores, clave = '', conMate = false, R = {}) {
  const op = OPC[V] || OPC.A;
  const f = figura(colores || {}, clave, conMate, R || {}, op);
  const { g, cabeza, torso, patas, brazos } = f;
  let malla = null;
  if (op.continuo) malla = continuo(f, op);
  else fundidoSimple(f);
  g.scale.setScalar(f.escala);
  let mano = brazos[1].userData.ante, mateVisible = null;
  const muneca = f.muneca;
  if (muneca) {
    mano = muneca;
    const unida = malla || muneca.children.find((o) => o.isMesh);
    const corte = malla ? malla.userData.indicesSinMate : muneca.userData.indicesMano;
    mateVisible = new THREE.Object3D();
    let ver = true;
    Object.defineProperty(mateVisible, 'visible', { configurable: true, get: () => ver, set: (v) => { ver = !!v; if (unida && corte >= 0) unida.geometry.setDrawRange(0, ver ? Infinity : corte); } });
  }
  // en C y D, lo que se lleva en la mano (la caña, la planilla) va en el antebrazo
  if (op.continuo && brazos[1].userData.codo) { const a = brazos[1].userData.ante; brazos[1].userData.codo.add(a); a.position.set(0, -0.01, 0); mano = a; }
  const r = { g, cabeza, torso, patas, brazos, mano, muneca, mateVisible };
  if (op.continuo) r.alPosar = alPosar(op);
  return r;
}
export const __opcionesProto = OPC;
