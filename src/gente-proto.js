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
//   S · "tipo Sims, pero más simple": B (ropa y pelo, más limpios) + C (cuerpo continuo), con
//       proporciones de persona apenas idealizadas (la cabeza un poco grande; Anselmo robusto,
//       Rosa mediana, Lucía de 9 años) y una cara suave y redonda: ojos algo grandes con iris de
//       color, brillo y pestañas; cejas marcadas; nariz chica; boca chica y nítida (labios de
//       geometría, no pintados) y gestos (neutral, sonrisa, risa) con formas de mezcla.
//   M · S "a lo Sims Medieval": telas pintadas en el shader (lana, lienzo, cuero, punto, fieltro,
//       con trama, costuras, remiendos y mugre abajo), ropa en capas (camisa arremangada, chaleco o
//       delantal, cinturón con bolsita, botas de cuero), paleta de tierra, caras con más carácter
//       (pómulos, mandíbula, arrugas de la risa, pecas, canas), hebras pintadas en el pelo y poses de
//       quietud (manos en la cintura, brazos cruzados, rascarse la barba, acomodarse el gorro).
//   P · M con un atlas pintado por código al cargar (gente-proto-atlas.js) y mapeado con UV: telas,
//       guardas patagónicas en los bordes (telar mapuche, trarüwe, bordados de amancay y lupino),
//       la cara pintada, labios con brillo, cejas con pelito, plata (trarilonko, trapelacucha, aros) y
//       una pobladora nueva de fiesta: Inés Ancalao, la herbolaria.
import * as THREE from 'three';
import { bola, tubo, torno, huso, deformar, coser, colorear, matiz, mezcla, color, puntasBufanda } from './formas.js';
import { compactar, MAT_FAUNA } from './vida.js';
import { atlasPersonajes } from './gente-proto-atlas.js';

const pedido = typeof location !== 'undefined' && location.search ? new URLSearchParams(location.search).get('personajes') : null;
export const VARIANTE_PERSONAJES = /^[ABCDSMP]$/.test(pedido || '') ? pedido : null;
if (VARIANTE_PERSONAJES && typeof window !== 'undefined') window.__protoPersonajes = VARIANTE_PERSONAJES;

const OPC = {
  A: { cara: 1 },
  B: { cara: 1, ropa: 1, pelo: 1 },
  C: { cara: 1, continuo: 1 },
  D: { cara: 1, ropa: 1, pelo: 1, continuo: 1, piel: 1, mirar: 1 },
  S: { cara: 1, ropa: 1, pelo: 1, continuo: 1, piel: 1, mirar: 1, sims: 1 },
  M: { cara: 1, ropa: 1, pelo: 1, continuo: 1, piel: 1, mirar: 1, sims: 1, medieval: 1 },
  P: { cara: 1, ropa: 1, pelo: 1, continuo: 1, piel: 1, mirar: 1, sims: 1, medieval: 1, atlas: 1 },
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
  if (v.y < -0.015) { const s = sv(-0.015, -0.1, v.y); v.x *= 1 - (F.mand ?? 0.3) * s * s * (0.55 + 0.45 * fr); }   // la mandíbula
  v.z += (F.sims ? (F.mujer ? 0.005 : 0.008) : F.mujer ? 0.008 : 0.012) * gauss(v.x, v.y - F.menton - 0.012, 0.022, 0.02) * fr;   // el mentón
  // abajo, la mandíbula sube hacia la nuca (lo de abajo queda en el cuello)
  const piso = F.menton + (-0.052 - F.menton) * sv(0.06, -0.01, v.z);
  if (F.sims) { const d = v.y - piso, w = 0.004; v.y = piso + 0.12 * d + 0.88 * w * Math.log1p(Math.exp(d / w)) - 0.88 * w * Math.LN2; }   // S: suave, sin escalones
  else if (v.y < piso) v.y = piso + (v.y - piso) * 0.12;
  // los pómulos
  const pom = gauss(Math.abs(v.x) - 0.043, v.y + 0.017, 0.019, 0.014) * fr;
  v.z += 0.0048 * pom * F.cachete; v.x += Math.sign(v.x) * 0.002 * pom * F.cachete;
  return v;
}
// los rasgos esculpidos (sólo el cráneo y la barba, no el pelo)
function rasgos(v, F) {
  if (F.sims) return rasgosS(v, F);
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
const claveCara = (F) => `${F.mujer ? 'm' : 'v'}${F.chico ? 'c' : ''}${F.sims ? 's' + (F.robusto ? 'r' : '') : ''}${F.medieval ? 'M' : ''}${F.atlas ? 'P' : ''}`;
function craneo(F, colPiel, op) {
  if (F.sims) return craneoS(F, colPiel);
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
// ---------------------------------------------------------------- S: la cara tipo Sims
// Las medidas: la cara más redonda y llena, los ojos algo grandes, la nariz chica y la boca chica.
function medidasS(mujer, chico, robusto) {
  const F = medidasCara(mujer, chico);
  Object.assign(F, {
    sims: true, robusto,
    rx: chico ? 0.077 : mujer ? 0.074 : 0.079,
    ry: chico ? 0.095 : mujer ? 0.1 : 0.105,
    rz: chico ? 0.092 : mujer ? 0.094 : 0.099,
    re: chico ? 0.0152 : mujer ? 0.0146 : 0.014,
    ex: chico ? 0.031 : mujer ? 0.0325 : 0.0335,
    ey: chico ? -0.006 : -0.002,
    nariz: chico ? 0.62 : mujer ? 0.78 : 0.92,
    cachete: chico ? 1.2 : mujer ? 0.7 : 0.6,
    mand: chico ? 0.18 : mujer ? 0.27 : robusto ? 0.2 : 0.24,
    abre: chico ? 0.5 : mujer ? 0.47 : 0.43,
    bocaW: chico ? 0.0158 : mujer ? 0.0182 : 0.019,
  });
  F.ceja = F.ey + (chico ? 0.025 : 0.024);
  F.punta = F.ey - (chico ? 0.027 : 0.032);
  F.base = F.punta - (chico ? 0.008 : 0.009);
  F.boca = F.base - (chico ? 0.014 : 0.016);
  F.menton = F.boca - (chico ? 0.032 : mujer ? 0.035 : 0.04);
  return F;
}
// Los rasgos, suaves: cuencas poco hondas, la nariz chica con la punta redonda, el morro donde
// apoyan los labios, los cachetes llenos
function rasgosS(v, F) {
  const fr = sv(0.25, 0.75, v.z / F.rz), ax = Math.abs(v.x), y = v.y;
  v.z -= 0.0052 * gauss(ax - F.ex, y - F.ey - 0.002, 0.019, 0.013) * fr;
  v.z += (F.mujer || F.chico ? 0.0014 : 0.0028) * gauss(ax - 0.03, y - F.ceja + 0.002, 0.024, 0.008) * fr;
  const top = F.ey - 0.004;
  if (y < top + 0.012 && y > F.base - 0.01) {
    const s = sv(top, F.punta, y);
    const h = (0.0012 + 0.0085 * s * s) * (1 - sv(F.punta + 0.001, F.base - 0.004, y));
    const w = 0.0058 + 0.003 * s;
    v.z += h * F.nariz * Math.exp(-((v.x / w) ** 2)) * fr * sv(top + 0.012, top, y);
  }
  v.z += 0.0055 * F.nariz * gauss(v.x, y - F.punta - 0.0015, 0.0074, 0.0074) * fr;      // la punta, redonda
  v.z += 0.0034 * F.nariz * gauss(ax - 0.0102, y - F.base - 0.0045, 0.0054, 0.0044) * fr;   // las aletas
  v.z += 0.003 * gauss(v.x, y - F.boca, 0.024, 0.012) * fr;                              // el morro
  v.z -= 0.0011 * gauss(v.x, y - F.boca + 0.016, 0.018, 0.004) * fr;                     // bajo el labio
  v.z += 0.003 * F.cachete * gauss(ax - 0.038, y + 0.024, 0.017, 0.015) * fr;            // los cachetes
  if (F.medieval) {
    const k = F.chico ? 0.45 : 1;
    v.z += 0.0034 * k * gauss(ax - 0.046, y + 0.008, 0.014, 0.011) * fr;                       // los pómulos
    v.x += Math.sign(v.x) * 0.0022 * k * gauss(ax - 0.052, y + 0.008, 0.014, 0.012) * fr;
    v.z -= 0.0018 * k * gauss(ax - 0.046, y + 0.036, 0.012, 0.01) * fr;                        // bajo el pómulo
    if (!F.chico) v.x += Math.sign(v.x) * (F.mujer ? 0.0018 : 0.0042) * gauss(ax - 0.058, y - F.menton - 0.03, 0.014, 0.016);   // la mandíbula
    v.z += (F.mujer || F.chico ? 0.0014 : 0.0028) * gauss(v.x, y - F.menton - 0.01, 0.012, 0.01) * fr;                         // el mentón
  }
  return v;
}
// La piel pareja y tibia: poca forma pintada, mejillas apenas rosadas, la sombra bajo la nariz
function pintarCaraS(c, p, n, F, colPiel) {
  const ax = Math.abs(p.x), fr = sv(0.2, 0.7, p.z / F.rz), y = p.y;
  c.multiplyScalar(0.92 + 0.11 * sv(-0.2, 0.9, 0.5 * n.z + 0.4 * n.y));
  const rub = mezcla(colPiel, F.medieval ? '#d8645a' : '#f6a2a2', 0.55);
  tinta(c, rub, (F.medieval ? (F.chico ? 0.36 : F.mujer ? 0.3 : 0.24) : F.chico ? 0.32 : F.mujer ? 0.24 : 0.1) * gauss(ax - 0.039, y + 0.02, 0.018, 0.013) * fr);
  if (F.medieval && !F.chico) tinta(c, mezcla(matiz(colPiel, 0.8), '#6a4a48', 0.2), 0.16 * gauss(ax - 0.048, y + 0.036, 0.012, 0.009) * fr);
  tinta(c, rub, 0.1 * gauss(p.x, y - F.punta, 0.01, 0.009) * fr);
  // la nariz definida: los costados apenas en sombra, la punta y el puente con luz
  const zonaNariz = gauss(p.x, y - F.punta - 0.008, 0.012, 0.016) * fr;
  c.multiplyScalar(1 - 0.22 * zonaNariz * sv(0.15, 0.6, Math.abs(n.x)));
  tinta(c, mezcla(colPiel, '#fff0e0', 0.6), 0.3 * gauss(p.x, y - F.punta - 0.0025, 0.0035, 0.004) * fr * sv(0.3, 0.9, n.z));
  tinta(c, mezcla(colPiel, '#fff0e0', 0.5), 0.14 * gauss(p.x, y - F.punta - 0.016, 0.0025, 0.01) * fr);
  tinta(c, mezcla(colPiel, '#ffe4cc', 0.5), 0.16 * gauss(p.x, y - 0.035, 0.03, 0.025) * fr);
  const abajo = sv(-0.1, -0.6, n.y);
  tinta(c, mezcla(matiz(colPiel, 0.75), '#7a4040', 0.2), 0.28 * gauss(p.x, y - F.base, 0.012, 0.004) * fr * abajo);
  tinta(c, '#5a3430', 0.4 * gauss(ax - 0.0064, y - F.base - 0.0015, 0.0026, 0.0019) * fr * abajo);   // las fosas
  if (F.mujer && !F.chico) tinta(c, mezcla(colPiel, '#8a5a52', 0.45), 0.2 * gauss(ax - F.ex - 0.003, y - F.ey - 0.012, 0.014, 0.005) * fr);
  tinta(c, mezcla(matiz(colPiel, 0.82), '#7a4a46', 0.2), 0.12 * gauss(ax - F.ex, y - F.ey - 0.015, 0.015, 0.0035) * fr);
  c.multiplyScalar(1 - 0.12 * sv(-0.2, -0.8, n.y) * sv(F.menton + 0.02, F.menton, y));   // sólo bajo la mandíbula
}
function craneoS(F, colPiel) {
  const g = molde('craneo' + claveCara(F), () => {
    const g = esferaDensa(36, 30);
    const P = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i); v.set(v.x * F.rx, v.y * F.ry, v.z * F.rz);
      formaCraneo(v, F); rasgos(v, F);
      P.setXYZ(i, v.x, v.y + F.cy, v.z);
    }
    g.computeVertexNormals(); coser(g);
    return g;
  });
  const m = pintarPieza(piel(new THREE.Mesh(g, color(colPiel))), (c, p, n) => { p.y -= F.cy; pintarCaraS(c, p, n, F, colPiel); });
  if (F.medieval) m.userData.tela = F.pecas ? TELA.pecas : F.chico ? TELA.cara : TELA.arrugas;
  return m;
}
// el punto de la cara en (x, y) (la mandíbula angosta la x: se corrige)
function sobreCara(x, y, F) {
  let x0 = x, v = null;
  for (let i = 0; i < 4; i++) { v = superficie(x0, y, F); x0 += x - v.x; }
  return v;
}
// Los gestos: s sonrisa (las comisuras arriba), o boca abierta, b cejas arriba, q ojos achinados
const GESTOS_S = [
  { s: 0.14, o: 0, b: 0, q: 0 },          // neutral (apenas amable)
  { s: 1.25, o: 0.3, b: 0.15, q: 0.55 },  // sonrisa
  { s: 0.95, o: 1, b: 0.5, q: 0.8 },      // risa
];
// Los rasgos que se mueven, en una malla aparte, hija de la cabeza, con formas de mezcla (sonrisa y
// risa): los labios (geometría: el borde es nítido), la boca por dentro, los dientes, las cejas, el
// párpado de abajo que sube al sonreír y, con barba, el bigote. Cada parte es una grilla (u, v).
const _arriba = new THREE.Vector3(0, 1, 0);
const PARTES_S = { labioSup: 0, labioInf: 1, boca: 2, dientes: 3, ceja: 4, parpado: 5, bigote: 6 };
function formaRostroS(F, P, barba, ojos) {
  const pos = [], idx = [], partes = [];
  const o = P.o * (barba ? 0.62 : 1);
  const W = F.bocaW * (1 + 0.16 * P.s + 0.06 * o);
  const cen = (u) => F.boca + 0.0011 + P.s * 0.0056 * u * u - P.s * 0.0006;
  const arribaL = (u) => cen(u) + o * 0.0032 * (1 - u * u);
  const abajoL = (u) => cen(u) - o * 0.0135 * Math.pow(Math.max(0, 1 - u * u), 0.75);
  const hU = (u) => { const q = Math.max(0, 1 - u * u); return (F.mujer && !F.chico ? 0.0048 : F.chico ? 0.0042 : 0.0039) * (1 - 0.22 * P.s) * Math.sqrt(q) * (1 + 0.22 * Math.exp(-(((Math.abs(u) - 0.3) / 0.16) ** 2)) - 0.14 * Math.exp(-((u / 0.09) ** 2))); };
  const hL = (u) => { const q = Math.max(0, 1 - u * u); return (F.mujer && !F.chico ? 0.0064 : F.chico ? 0.0056 : 0.005) * (1 - 0.18 * P.s) * Math.pow(q, 0.55); };
  const lev = 0.0003 + (barba ? 0.0042 : 0);
  const bulto = (w, u) => (F.atlas ? 1.45 : 1) * Math.sin(Math.PI * (0.18 + 0.82 * w)) * Math.sqrt(Math.max(0, 1 - u * u));
  const sobre = (x, y, alza) => { const q = sobreCara(x, y, F); return [x, y + F.cy, q.z + alza]; };
  // una grilla: f(u, v) -> [x, y, z]; con `voltear`, las caras al revés (que miren adelante)
  const tira = (parte, nu, nv, u0, u1, f, voltear = false) => {
    const base = pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = u0 + (u1 - u0) * (i / nu), v = j / nv;
      pos.push(...f(u, v)); partes.push(parte, u, v);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i, b = a + nu + 1;
      if (voltear) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  };
  // los labios: v = 0 en la línea de la boca
  tira(PARTES_S.labioSup, 16, 5, -1, 1, (u, v) => sobre(u * W, arribaL(u) + v * hU(u), lev + 0.0005 + 0.0024 * bulto(v, u)));
  tira(PARTES_S.labioInf, 16, 5, -1, 1, (u, v) => sobre(u * W, abajoL(u) - (1 - v) * hL(u), lev + 0.0005 + 0.003 * bulto(1 - v, u)));
  // la boca por dentro (entre las dos líneas: sin área si está cerrada) y los dientes de arriba
  tira(PARTES_S.boca, 14, 3, -1, 1, (u, v) => sobre(u * W * 0.98, abajoL(u) + v * (arribaL(u) - abajoL(u)), lev + 0.0002));
  tira(PARTES_S.dientes, 10, 2, -1, 1, (u, v) => {
    const uu = u * 0.8, top = arribaL(uu) + 0.0006, h = Math.min((arribaL(uu) - abajoL(uu)) * 0.8, 0.0042 * (1 - 0.45 * u * u));
    return sobre(u * W * 0.8, top - h + v * h + (v === 1 ? 0 : 0), lev + 0.0005 + 0.0004 * Math.sqrt(1 - u * u));
  });
  // las cejas: del lado de adentro a la cola, más gruesas adentro
  for (const l of [-1, 1]) {
    tira(PARTES_S.ceja, 10, 2, 0, 1, (u, v) => {
      const arco = F.medieval
        ? (F.mujer || F.chico ? 1 : 0.75) * 0.0042 * Math.sin(Math.PI * Math.pow(u, 1.25)) - 0.0022 * u - 0.0012 * (1 - u)
        : (F.mujer || F.chico ? 1 : 0.6) * (0.0034 * Math.sin(Math.PI * Math.pow(u, 0.75))) - 0.0018 * u;
      const grueso = (F.medieval ? (F.chico ? 0.0042 : F.mujer ? 0.0046 : 0.0066) : F.chico ? 0.0041 : F.mujer ? 0.0043 : 0.0058) * Math.min(1, 0.8 + u * 1.5) * (1 - 0.72 * sv(0.5, 1, u));
      const y = F.ceja + arco + P.b * 0.0042 * (1 - 0.35 * u) + P.s * 0.0006 + (v - 0.42) * grueso;
      return sobre(l * (F.ex - 0.016 + u * 0.037), y, 0.0008 + 0.0007 * Math.sin(Math.PI * v));
    }, l < 0);
  }
  // el párpado de abajo (sube con la sonrisa), sobre el globo, apenas fuera de él
  for (const [l, E] of ojos) {
    tira(PARTES_S.parpado, 12, 3, -0.93, 0.93, (u, v) => {
      const [ar, ab] = bordesAlmendra(u, F), q = Math.max(0, 1 - (u / 0.93) ** 2);
      const arriba = ab - 0.012 + P.q * (ar - ab) * 0.52 * Math.pow(q, 0.45), abajoV = ab - 0.14;
      const vv = abajoV + v * (arriba - abajoV), r = F.re * 1.058, z = Math.sqrt(Math.max(0.02, 1 - u * u - vv * vv));
      return [E.x + l * u * r, E.y + F.cy + vv * r, E.z + z * r];
    }, l < 0);
  }
  // el bigote: sobre el labio de arriba, más allá de las comisuras cae un poco
  if (barba) tira(PARTES_S.bigote, 16, 3, -1.3, 1.3, (u, v) => {
    const uc = Math.max(-1, Math.min(1, u)), fuera = Math.max(0, Math.abs(u) - 1);
    const y0 = arribaL(uc) + hU(uc) + 0.0003 - fuera * 0.013;
    const h = 0.0078 * (1 - 0.5 * (u / 1.3) ** 2) * (1 - 0.15 * P.s);
    const y = Math.min(F.base - 0.0012, y0 + v * h);
    return sobre(u * W * 1.06, y, lev + 0.0012 + 0.0032 * Math.sin(Math.PI * (0.15 + 0.85 * v)) * Math.sqrt(Math.max(0, 1 - (u / 1.32) ** 2)));
  });
  return { pos, idx, partes };
}
function rostroS(F, colPiel, colCeja, colBarba, ojos) {
  const barba = !!colBarba;
  const datos = (() => {
    const clave = 'rostro' + claveCara(F) + (barba ? 'b' : '');
    let d = MOLDES.get(clave);
    if (d) return d;
    const vs = GESTOS_S.map((P) => formaRostroS(F, P, barba, ojos));
    const normales = vs.map((v) => { const g = geoDe(v.pos, v.idx); g.computeVertexNormals(); return g.attributes.normal.array; });
    d = { vs, normales };
    MOLDES.set(clave, d);
    return d;
  })();
  const { vs, normales } = datos, partes = vs[0].partes, n = partes.length / 3;
  // los colores de cada uno
  const labio = mezcla(colPiel, '#d0566a', F.chico ? 0.46 : F.mujer ? 0.58 : 0.3), labioSup = mezcla(matiz(labio, 0.8), '#8a3040', 0.12);
  const linea = mezcla(labio, '#2a0c0e', 0.72), col = new Float32Array(n * 3), zona = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const parte = partes[i * 3], u = partes[i * 3 + 1], v = partes[i * 3 + 2];
    let esPiel = 1;
    if (parte === PARTES_S.labioSup || parte === PARTES_S.labioInf) {
      const w = parte === PARTES_S.labioSup ? v : 1 - v;           // 0 en la línea de la boca
      _c.set(parte === PARTES_S.labioSup ? labioSup : labio);
      if (parte === PARTES_S.labioInf) tinta(_c, '#f4c8c0', 0.16 * gauss(u, w - 0.45, 0.45, 0.25));   // el brillo del labio de abajo
      tinta(_c, linea, (w < 0.01 ? 0.95 : 0.45 * sv(0.3, 0.1, w)) + 0.35 * sv(0.75, 1, Math.abs(u)));
      tinta(_c, colPiel, 0.25 * sv(0.85, 1, w));                    // el borde se funde apenas con la piel
    } else if (parte === PARTES_S.boca) {
      _c.set('#3a1718'); if (v < 0.4 && Math.abs(u) < 0.65) tinta(_c, '#9a4448', 0.7 * sv(0.4, 0.05, v) * sv(0.65, 0.2, Math.abs(u)));
      esPiel = 0;
    } else if (parte === PARTES_S.dientes) {
      _c.set('#f2ede4'); tinta(_c, '#b8aca0', 0.55 * sv(0.55, 1, Math.abs(u)) + 0.25 * sv(0.4, 0, v)); esPiel = 0;
    } else if (parte === PARTES_S.ceja) {
      _c.set(colCeja); tinta(_c, matiz(colCeja, 1.35), 0.3 * sv(0.15, 0, u)); esPiel = 0;
    } else if (parte === PARTES_S.parpado) {
      _c.set(colPiel); telaS(_c, _arriba, true); tinta(_c, mezcla(colPiel, '#6a3a34', 0.5), 0.55 * sv(0.6, 1, v));
    } else {
      _c.set(colBarba); _c.multiplyScalar(0.92 + 0.16 * Math.sin(u * 15) * (0.5 + 0.5 * v) + 0.08 * v); esPiel = 0;
    }
    col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
    zona[i * 2] = esPiel; zona[i * 2 + 1] = 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vs[0].pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normales[0], 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('zona', new THREE.BufferAttribute(zona, 2));
  if (F.atlas) {
    // P: los labios y las cejas leen el atlas con su (u, v) de la grilla
    const at = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const parte = partes[i * 3], u = partes[i * 3 + 1], v = partes[i * 3 + 2];
      if (parte === PARTES_S.labioSup) at.set([TELA.labio, u, 0.5 - 0.5 * v], i * 3);
      else if (parte === PARTES_S.labioInf) at.set([TELA.labio, u, 1 - 0.5 * v], i * 3);
      else if (parte === PARTES_S.ceja) at.set([TELA.ceja, u, 1 - v], i * 3);
    }
    geo.setAttribute('aTela', new THREE.BufferAttribute(at, 3));
  }
  geo.setIndex(vs[0].idx);
  geo.morphAttributes.position = [1, 2].map((k) => new THREE.Float32BufferAttribute(vs[k].pos, 3));
  geo.morphAttributes.normal = [1, 2].map((k) => new THREE.Float32BufferAttribute(normales[k], 3));
  geo.computeBoundingSphere(); geo.boundingSphere.radius += 0.02;
  const m = new THREE.Mesh(geo, materialPiel());
  m.updateMorphTargets(); m.morphTargetInfluences[0] = 0; m.morphTargetInfluences[1] = 0;
  m.userData.aparte = 1; m.raycast = () => {};
  return m;
}
// La barba con forma: llena, prolija, con mechones grandes; la boca a la vista (el bigote va en el rostro)
function barbaS(F, colBarba, colPiel = null) {
  const M = !!F.medieval;
  const oculta = (v) => {
    const ax = Math.abs(v.x);
    // el borde en el cachete baja de la patilla (al costado, junto a la oreja) hasta la comisura
    const frente = F.base - 0.006 + 0.55 * Math.max(0, ax - 0.03) + (M ? 0.0035 * Math.sin(v.x * 430 + v.z * 200) - 0.004 : 0);
    const techo = frente + (F.ey + 0.006 - frente) * sv(0.035, 0.0, v.z);
    let m = sv(techo + 0.009, techo - 0.009, v.y) * sv(-0.05, -0.02, v.z);
    const e = (v.x / (F.bocaW * 1.25)) ** 2 + ((v.y - F.boca - 0.001) / 0.0058) ** 2;
    m *= sv(0.8, 1.15, e);
    m *= 1 - sv(F.base - 0.003, F.base + 0.002, v.y) * (1 - sv(0.026, 0.038, ax));
    return Math.max(0, Math.min(1, m));
  };
  const grosor = (v) => {
    const cerca = Math.exp(-(((v.y - F.boca + 0.004) / 0.03) ** 2) - (v.x / 0.032) ** 2);
    return 0.0035 + 0.0068 * (1 - cerca) + 0.005 * sv(-0.06, -0.11, v.y) + 0.0016 * Math.max(0, Math.sin(Math.atan2(v.x, v.z) * 9 + v.y * 40));
  };
  const m = casco(F, colBarba, true, grosor, oculta, (c, p, n) => {
    c.multiplyScalar(1 + 0.08 * Math.sin(Math.atan2(p.x, p.z) * 18 + p.y * 80));
    c.multiplyScalar(0.84 + 0.24 * sv(-0.6, 0.6, n.y));
    if (M && colPiel) tinta(c, colPiel, 0.6 * (1 - sv(0.08, 0.7, oculta(p))));   // en el borde, la piel asoma
  }, 36, 30, M ? 'barbaM' : 'barbaS');
  if (M) m.userData.tela = TELA.barba;   // (la misma grilla que el cráneo: el borde sale parejo)
  // abajo, redonda (sin flecos)
  deformar(m, (v) => { const y = v.y - F.cy; if (y < F.menton + 0.03 && v.z > -0.01) v.y -= 0.015 * sv(F.menton + 0.03, F.menton - 0.005, y) * Math.exp(-((v.x / 0.06) ** 2)); });
  return m;
}
// El pelo de S: un casco con mechones grandes esculpidos (sin hebras), más los mechones sueltos
// que asoman bajo el gorro, el rodete o las trenzas
function peloS(F, colPelo, R, gorro) {
  const piezas = peloS0(F, colPelo, R, gorro);
  if (F.atlas && !gorro && (R.rodete || R.trenza)) { piezas[0].userData.raya = true; for (const p of piezas.slice(1, 3)) if (p.geometry.type === 'TubeGeometry') p.userData.raya = true; }   // (P: las hebras salen de la raya)
  if (F.medieval) for (const p of piezas) if (p.userData.tela === undefined && p.material.color.getHexString() !== 'c8443a' && p.material.color.getHexString() !== 'a8342c') p.userData.tela = TELA.pelo;
  return piezas;
}
function peloS0(F, colPelo, R, gorro) {
  const corto = !(R.rodete || R.trenza);
  const linea = (x) => F.frente - 5.5 * x * x;
  const piezas = [];
  const patilla = F.mujer || F.chico ? 0.024 : -0.004, nuca = corto ? -0.056 : -0.072;
  const ocultaPelo = (v) => {
    const ax = Math.abs(v.x);
    const alto = linea(Math.min(ax, 0.052)) + (patilla - linea(0.052)) * sv(0.052, 0.068, ax);
    const frente = sv(alto - 0.007, alto + 0.007, v.y);
    const atras = sv(nuca - 0.006, nuca + 0.006, v.y);
    let m = frente + (atras - frente) * sv(-0.004, -0.02, v.z);
    m *= 1 - gauss(v.y + 0.012, v.z + 0.01, 0.028, 0.022) * sv(0.045, 0.06, ax);
    return Math.max(0, Math.min(1, m));
  };
  const mechon = (v) => Math.max(0, Math.sin(Math.atan2(v.x, v.z) * 7 + v.y * 22));
  const brillo = mezcla(colPelo, '#e8c8a0', 0.22);
  piezas.push(casco(F, colPelo, true, (v) => 0.007 + 0.004 * sv(0, F.ry, v.y) + (corto ? 0 : 0.003) + 0.0026 * mechon(v), ocultaPelo, (c, p, n) => {
    const a = Math.atan2(p.x, p.z);
    c.multiplyScalar(0.94 + 0.12 * Math.max(0, Math.sin(a * 7 + p.y * 22)));
    tinta(c, brillo, 0.22 * gauss(p.y - 0.035, 0, 0.02, 1) * sv(-0.2, 0.5, n.y + n.z * 0.3));
    if (!gorro && !corto) tinta(c, matiz(colPelo, 0.5), 0.7 * Math.exp(-((p.x / 0.0028) ** 2)) * sv(0.02, 0.06, p.y) * sv(-0.06, 0.0, p.z));   // la raya al medio
    c.multiplyScalar(0.84 + 0.22 * sv(-0.6, 0.8, n.y));
  }, 36, 30, `peloS${corto ? 'c' : 'l'}`));
  // las mujeres y los chicos: un mechón grande a cada lado, de la sien a detrás de la oreja
  if (!corto) for (const l of [-1, 1]) {
    const pts = [[l * 0.052, 0.04, 0.05], [l * 0.068, 0.022, 0.034], [l * 0.077, 0.002, 0.01], [l * 0.074, -0.02, -0.018]].map(([x, y, z]) => [x, y + F.cy, z]);
    const m = huso(matiz(colPelo, 1.06), pts, [0.006, 0.0105, 0.009, 0.004], 10, 8);
    piezas.push(pintarPieza(m, (c, p, nn) => { c.multiplyScalar(0.86 + 0.24 * sv(-0.5, 0.9, nn.y)); }));
  }
  if (R.rodete) {
    // el rodete: un rollo retorcido, con un mechón que lo cruza
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.0155, 10, 24), color(colPelo));
    deformar(t, (v) => { const a = Math.atan2(v.y, v.x), r = Math.hypot(v.x, v.y), b = Math.atan2(v.z, r - 0.027); const k = 1 + 0.12 * Math.sin(a * 6 + b); v.x = Math.cos(a) * (0.027 + (r - 0.027) * k); v.y = Math.sin(a) * (0.027 + (r - 0.027) * k); v.z *= k; });
    t.position.set(0, F.cy - 0.012, -F.rz - 0.006); t.rotation.set(0.35, 0, 0);
    piezas.push(pintarPieza(t, (c, p, n) => { c.multiplyScalar(0.9 + 0.16 * Math.max(0, Math.sin(Math.atan2(p.y, p.x) * 6 + Math.atan2(p.z, Math.hypot(p.x, p.y) - 0.027)))); c.multiplyScalar(0.86 + 0.2 * sv(-0.6, 0.8, n.y)); }));
    piezas.push(bola(matiz(colPelo, 0.92), [0.024, 0.022, 0.014], [0, F.cy - 0.012, -F.rz - 0.01], [0.35, 0, 0], [12, 9]));
  }
  if (R.trenza) {
    // los chicos, dos trenzas por delante de los hombros; las grandes, una por la espalda
    const dos = F.chico || R.dosTrenzas, larga = !F.chico && R.dosTrenzas;
    const zT = (i, l) => (larga ? Math.min(i, 7) * 0.019 + Math.max(0, i - 7) * 0.003 : l ? i * 0.0035 : -i * 0.006);
    const xT = (i, l) => l * (larga ? Math.min(i, 5) * 0.006 : Math.min(i, 3) * 0.003);
    for (const l of dos ? [-1, 1] : [0]) {
      const x0 = l * (F.rx - 0.006), z0 = l ? -0.026 : -F.rz - 0.004, y0 = F.cy - 0.04;
      const n = larga ? 13 : 7, paso = larga ? 0.021 : 0.0185;
      for (let i = 0; i < n; i++) {
        const y = y0 - i * paso, r = 1 - i * (larga ? 0.022 : 0.04);
        piezas.push(bola(matiz(colPelo, i % 2 ? 0.92 : 1.08), [0.0128 * r, 0.0185 * r, 0.0115 * r], [x0 + xT(i, l) + (i % 2 ? 0.0042 : -0.0042), y, z0 + zT(i, l)], [0, 0, i % 2 ? 0.55 : -0.55], [8, 6]));
      }
      const yf = y0 - n * paso + 0.006, xf = x0 + xT(n, l) + (larga ? 0 : l * 0.009), zf = z0 + zT(n, l);
      if (larga) {
        // la lana roja que ata la punta
        const lana = torno('#a8302a', [[0.0085, -0.014], [0.0095, -0.007], [0.0095, 0.007], [0.0085, 0.014]], [xf, yf + 0.008, zf], null, null, 10);
        lana.userData.tela = TELA.punto; piezas.push(lana);
      }
      if (F.chico && !larga) {
        // un moño
        for (const s of [-1, 1]) piezas.push(bola('#c8443a', [0.013, 0.008, 0.005], [xf + s * 0.011, yf, zf + 0.003], [0, l * 0.5, s * 0.35], [8, 6]));
        piezas.push(bola('#a8342c', [0.005, 0.005, 0.005], [xf, yf, zf + 0.004], null, [7, 5]));
      } else if (!larga) piezas.push(bola(matiz(colPelo, 0.7), [0.01, 0.006, 0.01], [xf, yf, zf]));
      const pun = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.026, 8, 1), color(colPelo)), (v) => { v.x *= 1 + 0.35 * Math.sin(v.y * 90); });
      pun.position.set(xf, yf - 0.014, zf); pun.rotation.set(Math.PI, 0, 0);
      piezas.push(pun);
    }
  }
  return piezas;
}
// Párpados: un casquete alrededor del ojo con la abertura en almendra (el borde del casquete ES el
// borde del párpado: un anillo exacto, sin los dientes de la grilla). `lat`: 1 el ojo derecho.
// (S: más abierta y redonda, el ojo grande; el rabillo apenas para arriba)
const bordesAlmendra = (u, F) => {
  const t = (u + 0.93) / 1.86, q = 1 - (u / 0.93) ** 2;
  if (F && F.sims) {
    const eje = -0.07 + 0.14 * t;
    return [eje + F.abre * Math.pow(q, 0.62) * (1 - 0.12 * u), eje - F.abre * 0.66 * Math.pow(q, 0.8) * (1 + 0.1 * u)];
  }
  const eje = -0.05 + 0.1 * t;
  return [eje + 0.37 * Math.pow(q, 0.8) * (1 - 0.1 * u), eje - 0.27 * Math.pow(q, 0.9) * (1 + 0.12 * u)];
};
function almendra(u, v, F) {
  if (Math.abs(u) >= 0.93) return false;
  const [arriba, abajo] = bordesAlmendra(u, F);
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
    for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (almendra(cu * m, sn * m, F)) lo = m; else hi = m; }
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
  if (F.sims) {
    // las pestañas: una tira aparte (con sus propias caras), sumada a la misma malla
    const idx2 = Array.from(g.index.array);
    pestanas(F, lat, pos, col, sup, idx2, mezcla(colPelo, '#0e0907', 0.8));
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx2);
  }
  const m = piel(mallaDe(g, colPiel, new Float32Array(col)));
  m.userData.superior = sup;   // cuánto de cada vértice baja con el parpadeo
  return m;
}
// S: las pestañas de arriba, una tira fina por el borde del párpado (más larga hacia el rabillo, y
// en las mujeres más marcada); dos caras (adelante y atrás), apenas separadas
function pestanas(F, lat, pos, col, sup, idx, colL) {
  const re = F.re, n = 12, c = new THREE.Color(colL);
  const punto = (u, k, atras) => {
    const [ar] = bordesAlmendra(u, F);
    const fuera = sv(0.2, 0.93, u);
    const largo = (F.chico ? 0.12 : F.mujer ? 0.17 : 0.09) * (0.75 + 0.7 * fuera);
    const uu = u + k * largo * 0.55 * fuera, vv = ar - 0.012 + k * largo * (1 - 0.35 * fuera);
    const r = re * (1.048 + k * 0.13) - (atras ? 0.00022 : 0);
    const z = Math.sqrt(Math.max(0.03, 1 - uu * uu - vv * vv));
    return [lat * uu * r, vv * r, z * r];
  };
  for (const atras of [0, 1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const u = -0.78 + 1.71 * (i / n);
      for (const k of [0, 1]) { pos.push(...punto(u, k, atras)); col.push(c.r, c.g, c.b); sup.push(1); }
    }
    for (let i = 0; i < n; i++) {
      const a = base + i * 2, b = a + 2;
      if (atras) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
}
// S: el ojo en aros (los bordes de la pupila y del iris son aros de vértices repetidos: nítidos),
// el iris de color, más claro abajo, con el anillo oscuro; y un brillo aparte
const IRIS_S = ['#6b4526', '#7a5a2c', '#4e6a3c', '#4c6c8a', '#5c3b22', '#6a5a36'];
function ojoS(F, iris) {
  const N = 18, A = [0, 0.2, 0.2, 0.33, 0.45, 0.53, 0.53, 0.7, 0.95, 1.2, 1.4];
  const claro = mezcla(iris, '#f0e0b0', 0.35), oscuro = mezcla(iris, '#0b0705', 0.7);
  const tonos = (k, sn) => {
    if (k <= 1) return '#0b0807';
    if (k <= 5) {
      const base = k === 2 ? mezcla(iris, '#1a120c', 0.25) : k === 3 ? iris : k === 4 ? mezcla(iris, claro, 0.3) : oscuro;
      return k === 5 ? base : mezcla(base, claro, 0.45 * Math.max(0, -sn));   // abajo, el iris más claro
    }
    return k <= 7 ? '#f6f1ea' : k === 8 ? '#eee6dc' : k === 9 ? '#e2d2c8' : '#cfb6ac';
  };
  const pos = [], col = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2, cu = Math.cos(a), sn = Math.sin(a);
    A.forEach((t, k) => {
      pos.push(Math.sin(t) * cu * F.re, Math.sin(t) * sn * F.re, Math.cos(t) * F.re);
      _c.set(tonos(k, sn)); col.push(_c.r, _c.g, _c.b);
    });
  }
  const K = A.length;
  for (let i = 0; i < N; i++) for (let k = 0; k < K - 1; k++) { const a = i * K + k, b = (i + 1) * K + k; idx.push(a, a + 1, b, a + 1, b + 1, b); }   // (hacia afuera)
  // el brillo: un disquito blanco apenas delante de la córnea, arriba a un costado (igual en los dos ojos)
  const d = new THREE.Vector3(0.34, 0.4, 0.85).normalize(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3();
  t1.crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize(); t2.crossVectors(t1, d).normalize();
  for (const [rb, dd, kk] of [[0.15, d, 1.007], [0.07, new THREE.Vector3(-0.22, -0.26, 0.94).normalize(), 1.006]]) {
    const c0 = pos.length / 3, centro = dd.clone().multiplyScalar(F.re * kk);
    const u1 = new THREE.Vector3().crossVectors(dd, new THREE.Vector3(0, 1, 0)).normalize(), u2 = new THREE.Vector3().crossVectors(u1, dd).normalize();
    pos.push(centro.x, centro.y, centro.z); col.push(1, 1, 1);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, p = centro.clone().addScaledVector(u1, Math.cos(a) * rb * F.re).addScaledVector(u2, Math.sin(a) * rb * F.re);
      pos.push(p.x, p.y, p.z); col.push(0.98, 0.97, 0.95);
    }
    for (let i = 0; i < 10; i++) idx.push(c0, c0 + 1 + ((i + 1) % 10), c0 + 1 + i);
  }
  const g = geoDe(pos, idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, color('#ffffff'));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
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
  const P = g.attributes.position, v = new THREE.Vector3(), oc = [], bordes = [];
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i);
    v.set(v.x * F.rx, v.y * F.ry, v.z * F.rz);
    formaCraneo(v, F); if (conRasgos) rasgos(v, F);
    const n = v.clone().normalize();
    // `oculta` da cuánto es pelo (0..1, suave): el borde es donde el casco cruza la piel (sin dientes)
    const m = oculta(v);
    oc.push(m < 0.02); bordes.push(m);
    v.addScaledVector(n, -0.0035 + (grosor(v) + 0.0035) * m);
    P.setXYZ(i, v.x, v.y + F.cy, v.z);
  }
  recortar(g, oc);
  g.setAttribute('borde', new THREE.Float32BufferAttribute(bordes, 1));
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
function armarCabezaS(cabeza, F, colores, R, op, colPiel) {
  const colPelo = colores.pelo || '#3a2a1e';
  const kc = F.robusto ? 1.14 : F.chico ? 0.9 : F.mujer ? 0.95 : 1.04;
  const cuello = torno(colPiel, [[0.052, -0.13], [0.047, -0.09], [0.043, -0.06], [0.045, -0.03], [0.036, -0.0], [0.02, 0.01]].map(([r, y]) => [r * kc, y]), [0, 0, -0.012], null, [1, 1, 1.06], 14);
  cabeza.add(piel(pintarPieza(cuello, (c, p) => { c.multiplyScalar(1 - 0.14 * sv(-0.08, -0.03, p.y) * sv(-0.02, 0.03, p.z)); })));
  cabeza.add(craneoS(F, colPiel));
  const ojos = [], parp = [], centros = [];
  const iris = IRIS_S[Math.floor(hash(colPelo + colPiel + (colores.ropa || '')) * IRIS_S.length)];
  for (const l of [-1, 1]) {
    const s = superficie(l * F.ex, F.ey, F, false);
    const E = { x: s.x, y: F.ey, z: s.z - F.re * 0.85 };
    const ojo = new THREE.Group(); ojo.position.set(E.x, E.y + F.cy, E.z);
    ojo.add(noTapa(ojoS(F, iris)));
    const pp = new THREE.Group(); pp.position.copy(ojo.position);
    pp.add(noTapa(parpados(F, l, colPiel, colPelo, E)));
    cabeza.add(ojo); cabeza.add(pp); ojos.push(ojo); parp.push(pp); centros.push([l, E]);
    // la oreja: chica, con el borde y el hueco
    const oreja = bola(colPiel, [0.0098, 0.023, 0.0145], [l * (F.rx * 0.94), F.cy - 0.014, -0.012], [0, l * 0.3, 0], [10, 7]);
    deformar(oreja, (v) => { if (v.x * l > 0) v.x -= l * 0.5 * Math.exp(-((v.y / 0.6) ** 2 + (v.z / 0.55) ** 2)); });
    cabeza.add(piel(pintarPieza(oreja, (c, p) => { if (p.x * l > -0.2 && Math.abs(p.y) < 0.62 && Math.abs(p.z) < 0.58) tinta(c, mezcla(colPiel, '#8a4038', 0.4), 0.38); tinta(c, mezcla(colPiel, '#d8605a', 0.5), 0.22); })));
    if (F.atlas) {
      const ox = l * (F.rx * 0.94 + 0.006), oy = F.cy - 0.014, oz = -0.012;
      const borde = [[0.019, 0.006], [0.023, -0.005], [0.016, -0.015], [0.002, -0.018], [-0.012, -0.013], [-0.019, -0.004]].map(([dy, dz]) => [ox, oy + dy, oz + dz]);
      cabeza.add(piel(huso(mezcla(colPiel, '#e08a78', 0.2), borde, [0.0025, 0.0032, 0.0034, 0.0032, 0.003, 0.0036], 8, 5)));
    }
  }
  cabeza.userData.ojos = ojos; cabeza.userData.parpados = parp;
  const colCeja = mezcla(colPelo, '#120c08', 0.25);
  const colBarba = colores.barba ? mezcla(colores.barba, '#5e3f28', 0.35) : null;
  const rostro = rostroS(F, colPiel, colCeja, colBarba, centros);
  rostro.visible = false;   // (se muestra de cerca: ver alPosar)
  if (F.medieval) rostro.material = F.atlas ? materialAtlas() : materialTela();
  cabeza.add(rostro); cabeza.userData.rostro = rostro;
  // De lejos, los rasgos quietos (neutral) van fundidos en el cuerpo, en un hueso propio; de cerca
  // ese hueso se achica a nada (adentro de la cabeza) y se dibuja el rostro con gestos. Así lejos
  // cada persona es un solo dibujo, como en C y D.
  const rasgos = new THREE.Group(); rasgos.position.set(0, F.cy, -0.03);
  const gf = rostro.geometry.clone(); gf.morphAttributes = {};
  const fijo = new THREE.Mesh(gf, color('#ffffff')); fijo.position.set(0, -F.cy, 0.03);
  fijo.userData.crudo = 1; fijo.userData.noTapa = 1;
  rasgos.add(fijo); cabeza.add(rasgos); cabeza.userData.rasgos = rasgos;
  for (const p of peloS(F, colPelo, R, !!colores.gorro)) cabeza.add(p);
  if (colBarba) cabeza.add(barbaS(F, colBarba, colPiel));
  sombreros(cabeza, F, colores, op);
  cabeza.userData.esCabeza = true;
  if (F.medieval) cabeza.traverse((o) => { if (o.isMesh && o.userData.tela === undefined && !o.userData.piel) o.userData.tela = 0; });
}
function armarCabeza(cabeza, F, colores, R, op, colPiel) {
  if (F.sims) return armarCabezaS(cabeza, F, colores, R, op, colPiel);
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
  const abrigo = colores.abrigo || '#4a3a30', ropa = colores.gorroColor || colores.ropa || '#7a6a5a';
  const M = !!F.medieval, antes = cabeza.children.length;
  sombreros0(cabeza, F, colores, op, abrigo, ropa);
  if (M) {
    const kx = F.rx + 0.008, kz = F.rz + 0.008, t = colores.gorro === 'panuelo' ? TELA.lienzo : colores.gorro === 'gorroPunto' ? TELA.punto : TELA.fieltro;
    if (colores.gorro === 'panuelo') {
      // el pañuelo atado atrás: cubre la cabeza hasta la nuca, con el nudo y las puntas
      const p = torno(ropa, [[1.03, 0.0], [1.07, 0.022], [1.05, 0.05], [0.88, 0.078], [0.46, 0.094], [0.0, 0.097]], [0, F.cy + 0.03, -0.01], [-0.42, 0, 0], [kx, 1, kz], 18);
      pintarPieza(p, (c, q) => { c.multiplyScalar(0.88 + 0.16 * sv(0.0, 0.09, q.y)); c.multiplyScalar(1 + 0.08 * Math.sin(Math.atan2(q.x, q.z) * 7 + q.y * 30)); if (q.y < 0.014) c.multiplyScalar(0.78); });   // (el dobladillo)
      cabeza.add(p);
      cabeza.add(bola(matiz(ropa, 0.9), [0.022, 0.017, 0.016], [0, F.cy + 0.012, -F.rz - 0.03], null, [8, 6]));
      for (const l of [-1, 1]) {
        const punta = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4, 1), color(matiz(ropa, 0.85))), (v) => { v.z *= 0.35; });
        punta.position.set(l * 0.014, F.cy - 0.018, -F.rz - 0.035); punta.rotation.set(Math.PI + 0.35, 0, l * 0.35); cabeza.add(punta);
      }
    } else if (colores.gorro === 'gorroPunto') {
      // el gorro tejido, con el borde doblado y un pompón
      const y0 = F.cy + 0.03;
      const gp = torno(ropa, [[1.03, 0.0], [1.07, 0.012], [1.07, 0.028], [1.02, 0.032], [0.99, 0.06], [0.84, 0.088], [0.46, 0.104], [0.0, 0.108]], [0, y0, -0.006], [-0.12, 0, 0], [kx, 1, kz], 18);
      pintarPieza(gp, (c, q) => { if (q.y < 0.03) c.multiplyScalar(0.9); });
      cabeza.add(gp);
      cabeza.add(bola(mezcla(ropa, '#e8d8b0', 0.45), [0.019, 0.017, 0.019], [0, y0 + 0.11, -0.02], null, [8, 6]));
    }
    for (let i = antes; i < cabeza.children.length; i++) { const o = cabeza.children[i]; if (o.isMesh) o.userData.tela = t; }
  }
  if (F.atlas) {
    const plata = '#8e9298', kx = F.rx + 0.006, kz = F.rz + 0.006, pl = [];
    if (colores.trarilonko) {
      // el trarilonko: la cinta de plata en la frente, con sus colgantes
      const yb = 0.042, fb = Math.sqrt(1 - (yb / F.ry) ** 2) * 1.02;   // (la cabeza se angosta arriba: la cinta la abraza)
      pl.push(torno(plata, [[1.0, -0.004], [1.025, -0.002], [1.025, 0.002], [1.0, 0.004]], [0, F.cy + yb, -0.006], [-0.12, 0, 0], [(F.rx + 0.01) * fb, 1, (F.rz + 0.01) * fb], 26));
      for (let i = -2; i <= 2; i++) {
        const x = i * 0.013, yy = yb - 0.0065 - Math.abs(i) * 0.0008, q = superficie(x, yy, F);
        pl.push(bola(plata, [0.0028, 0.0036, 0.0009], [x, F.cy + yy, q.z + 0.0018], [-0.15, 0, 0], [7, 5]));
      }
    }
    for (const l of colores.aros ? [-1, 1] : []) {
      const x = l * (F.rx * 0.97), y = F.cy - 0.038, z = -0.01;
      if (colores.aros === 'chawai') {
        // el chawai: el aro y la placa en trapecio que cuelga
        pl.push(new THREE.Mesh(new THREE.TorusGeometry(0.005, 0.0011, 5, 10), color(plata))); pl[pl.length - 1].position.set(x, y, z); pl[pl.length - 1].rotation.y = Math.PI / 2;
        pl.push(deformar(bola(plata, [0.0025, 0.014, 0.009], [x, y - 0.019, z], null, [6, 6]), (v) => { v.z *= 1 + 0.6 * Math.max(0, -v.y); }));   // (en la esfera unidad)
        for (const dz of [-0.008, 0, 0.008]) pl.push(bola(plata, [0.0015, 0.0035, 0.002], [x, y - 0.036, z + dz], null, [5, 4]));
      } else pl.push(bola(plata, [0.002, 0.0045, 0.0045], [x, y - 0.002, z], null, [6, 5]));
    }
    for (const m of pl) { m.userData.tela = TELA.plata; cabeza.add(m); }
  }
}
function sombreros0(cabeza, F, colores, op, abrigo, ropa) {
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

// ---------------------------------------------------------------- M: ayudas de la ropa y la cara
// el borde de una pieza de torno (0 en el borde, 1 a un segmento): para el cuero gastado y el dobladillo
// (los vértices de LatheGeometry van por gajo: i·npts + j)
function bordeTorno(activo, m, npts, segs, lados, abajo, arriba = abajo) {
  if (!activo) return m;
  const P = m.geometry.attributes.position, b = new Float32Array(P.count);
  for (let k = 0; k < P.count; k++) {
    const i = Math.floor(k / npts), j = k % npts;
    let d = 9;
    if (lados) d = Math.min(d, i, segs - i);
    if (abajo) d = Math.min(d, j);
    if (arriba) d = Math.min(d, npts - 1 - j);
    b[k] = Math.min(1, d);
  }
  m.geometry.setAttribute('borde', new THREE.BufferAttribute(b, 1));
  return m;
}
// la manga arremangada: camisa hasta pasado el codo (el punto `iCorte`), el antebrazo con la piel y el
// rollo de la manga en el corte
function arremangar(piv, pts, rad, iCorte, manga, colPiel, tramos, lados) {
  const V = pts.map((p) => new THREE.Vector3(...p)), acum = [0];
  for (let i = 1; i < V.length; i++) acum.push(acum[i - 1] + V[i].distanceTo(V[i - 1]));
  const tCorte = acum[iCorte] / acum[acum.length - 1];
  const r2 = rad.map((r, i) => (i > iCorte ? r * 0.82 : r));
  const m = huso(manga, pts, r2, tramos, lados);
  const P = m.geometry.attributes.position, n = P.count;
  const col = new Float32Array(n * 3), tel = new Float32Array(n), zon = new Float32Array(n * 2);
  const cS = new THREE.Color(manga), cP = new THREE.Color(colPiel);
  for (let i = 0; i < n; i++) {
    const tt = Math.floor(i / (lados + 1)) / tramos, esPiel = tt > tCorte + 0.02;
    const c = esPiel ? cP : cS;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    tel[i] = esPiel ? 0 : TELA.lienzo; zon[i * 2] = esPiel ? 1 : 0; zon[i * 2 + 1] = 1;
  }
  m.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  m.geometry.setAttribute('telaV', new THREE.BufferAttribute(tel, 1));
  m.geometry.setAttribute('zona', new THREE.BufferAttribute(zon, 2));
  piv.add(m);
  // el rollo
  const curva = new THREE.CatmullRomCurve3(V), c0 = curva.getPointAt(tCorte + 0.01), tg = curva.getTangentAt(tCorte + 0.01);
  const rr = rad[iCorte] * 1.0 + 0.003;
  const rollo = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.0095, 7, 16), color(matiz(manga, 0.94)));
  rollo.position.copy(c0); rollo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg);
  piv.add(conTela(rollo, TELA.lienzo));
}
// a cada pieza de ropa, su tela: por el color más parecido de la paleta (la pieza conserva el color
// de base en su material)
function telasPorColor(g, colores, R, bota, pantalon) {
  const lista = [
    [colores.ropa, TELA.lienzo], [colores.abrigo, R.telaChaleco ? TELA[R.telaChaleco] : TELA.lana], [pantalon, TELA.lana],
    [bota, TELA.cuero], [R.colPollera, TELA.lana], [colores.bufanda, TELA.punto], [R.faja, TELA.lana], ['#4e3420', TELA.cuero],
  ].filter(([h]) => h && typeof h === 'string').map(([h, t]) => [new THREE.Color(h), t]);
  const c = new THREE.Color();
  g.traverse((o) => {
    if (!o.isMesh || o.userData.tela !== undefined || o.userData.piel || o.userData.mate) return;
    let p = o.parent; while (p && p !== g) { if (p.userData.esCabeza) return; p = p.parent; }
    c.copy(o.material.color);
    let mejor = 0, dmin = Infinity;
    for (const [h, t] of lista) { const d = (h.r - c.r) ** 2 + (h.g - c.g) ** 2 + (h.b - c.b) ** 2; if (d < dmin) { dmin = d; mejor = t; } }
    o.userData.tela = mejor;
  });
}
// la cara de M: con más carácter que la de S (ojos un poco más chicos, nariz con más forma, pómulos y
// mandíbula; arrugas de la risa en los grandes y pecas en Lucía, en el shader)
function medidasM(F, R) {
  F.medieval = true; F.pecas = !!R.pecas;
  F.re *= 0.9; F.abre *= 0.94;
  F.nariz *= 1.22; F.cachete *= 0.6;
  F.mand = F.chico ? 0.2 : F.mujer ? 0.3 : 0.34;
  F.bocaW *= 1.03;
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
  const bota = (op.medieval && R.botaCol) || (R.botas === 'goma' ? '#2a2d2c' : R.botas === 'trekking' ? '#5a4632' : '#3b2f26');
  const med = !!op.medieval;
  const manga = R.chaleco ? ropa : abrigo;
  const k = mujer ? 1 : 1.06;         // los varones, un poco más anchos
  // S: cada cuerpo distinto (Anselmo robusto, Lucía de 9 años; el resto, como siempre): el ancho
  // del torso, los brazos y las piernas va en la escala de cada grupo (y = 1: los pivotes no cambian)
  const sims = !!op.sims, robusto = sims && /herrero/.test(clave);
  const anchoT = !sims ? [1, 1] : robusto ? [1.09, 1.13] : chico ? [0.84, 0.86] : [1, 1];
  const anchoB = !sims ? 1 : robusto ? 1.13 : chico ? 0.84 : 1, anchoP = !sims ? 1 : robusto ? 1.08 : chico ? 0.84 : 1;
  const hx = (mujer ? 0.166 : 0.18) * anchoT[0];    // el hombro (pivote del brazo)
  // pliegues: la tela que se junta (más oscura en el fondo del pliegue, más clara en el lomo); S, más suaves
  const surcos = (c, s, fuerza = 0.18) => { const f = fuerza * (sims ? 0.45 : 1); c.multiplyScalar(1 - f * Math.max(0, -s) + f * 0.4 * Math.max(0, s)); };

  // ---- piernas (muslo en la cadera, canilla y bota en la rodilla, el pie en el tobillo)
  const altas = R.botas === 'altas' || R.botas === 'goma';
  const RODILLA = 0.37, TOBILLO = -0.39;
  const lx = (mujer ? 0.086 : 0.094) * (sims ? anchoT[0] : 1);
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
    const piv = new THREE.Group(); piv.position.set(l * lx, 0.82, 0); piv.scale.set(anchoP, 1, anchoP);
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
    tobillo.add(bola(bota, [0.056, 0.046, 0.122], [0, -0.39 - TOBILLO, 0.05], null, sims ? [10, 7] : null));                       // el empeine
    tobillo.add(bola(matiz(bota, 0.5), [0.059, 0.017, 0.125], [0, -0.425 - TOBILLO, 0.045], null, sims ? [10, 6] : null));         // la suela
    if (med) {
      const yTop = (altas ? -0.435 : -0.615) + RODILLA;
      rodilla.add(conTela(torno(matiz(bota, 1.2), [[altas ? 0.07 : 0.06, yTop - 0.03], [altas ? 0.078 : 0.066, yTop - 0.012], [altas ? 0.075 : 0.064, yTop + 0.004], [altas ? 0.066 : 0.058, yTop + 0.008]], null, null, null, 12), TELA.cuero));
      if (!altas) for (let i = 0; i < 3; i++) for (const s of [-1, 1]) rodilla.add(bola('#2e2216', [0.016, 0.0028, 0.003], [0, yTop - 0.022 - i * 0.017, 0.056 - i * 0.002], [0.25, 0, s * 0.5], [5, 3]));
    }
    if (op.ropa && R.botas === 'trekking') for (let i = 0; i < 3; i++) tobillo.add(bola('#c8b89a', [0.022, 0.0035, 0.005], [0, -0.36 - TOBILLO + i * 0.016, 0.09 - i * 0.012], [0.5, 0, 0]));
    rodilla.add(tobillo); rodilla.userData.tobillo = tobillo;
    piv.add(rodilla); piv.userData.rodilla = rodilla;
    g.add(piv); patas.push(piv);
  }

  // ---- torso: cintura y caderas de adulto, pecho, hombros; la ropa de cada uno
  const torso = new THREE.Group(); torso.position.set(0, 0.82, 0); torso.scale.set(anchoT[0], 1, anchoT[1]);
  const pechoK = sims && chico ? 0 : mujer ? 0.17 : 0.07;
  const panza = robusto ? 0.13 : 0;   // Anselmo: la panza de buen comer
  const zPecho = (x, y) => (1 + pechoK * Math.exp(-(((y - 0.325) / 0.075) ** 2)) * (mujer ? Math.exp(-((x / 0.11) ** 2)) * 1.4 : 1)) * (1 + panza * Math.exp(-(((y - 0.15) / 0.12) ** 2)) * Math.exp(-((x / 0.16) ** 2)));
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
    const perfilChaleco = R.chamal
      ? [[0.158, -0.06], [0.157, 0.02], [0.148, 0.12], [0.162, 0.24], [0.188, 0.35], [0.192, 0.43], [0.172, 0.478], [0.13, 0.5]]
      : [[0.158, -0.06], [0.157, 0.02], [0.148, 0.12], [0.162, 0.24], [0.188, 0.35], [0.196, 0.43], [0.188, 0.478]];
    torso.add(rol(bordeTorno(med, conTela(pintarPieza(capa(abrigo, perfilChaleco.map(([r, y]) => [r * (mujer ? 0.92 : 1), y]), 16, R.chamal ? 0 : 0.4, R.chamal ? Math.PI * 2 : Math.PI * 2 - 0.8), (c, p) => {
      if (op.ropa) { if (!med && Math.abs(Math.atan2(p.x, p.z)) < 0.5) c.multiplyScalar(0.82); arrugasTorso(c, p); }
    }), med ? TELA[R.telaChaleco || 'lana'] : 0), perfilChaleco.length, 16, !R.chamal, true), 'chaleco', perfilChaleco.length, 16));
    if (R.bombacha) torso.add(capa(R.faja || '#7a2e26', [[0.155, -0.05], [0.161, -0.038], [0.162, 0.028], [0.157, 0.042]], 18));
    else torso.add(capa('#4a3626', [[0.16, -0.035], [0.16, 0.02]], 16));
    if (op.ropa && !(med && R.delantal)) for (const y of [0.1, 0.2, 0.3]) torso.add(bola('#2a2018', [0.008, 0.008, 0.005], [0.064, y, 0.118 * zPecho(0.064, y) + 0.004]));
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
  if (op.ropa && !colores.poncho && !(colores.bufanda || R.panuelo) && (sims || !colores.barba) && !R.fiesta) {
    // el cuello de la camisa: dos solapas en punta
    const tela = R.chaleco || R.abierta ? ropa : matiz(abrigo, 0.95);
    torso.add(capa(tela, [[0.066, 0.528], [0.07, 0.548], [0.066, 0.572], [0.06, 0.578]], 16, 0.35, Math.PI * 2 - 0.7, 0.98));
    for (const l of [-1, 1]) torso.add(bola(tela, med ? [0.015, 0.021, 0.003] : [0.02, 0.028, 0.0035], [l * 0.027, 0.535, 0.066], [0.55, l * 0.3, l * 0.7]));
  }
  if (R.pollera) {
    const perfilPollera = [[0.24, -0.52], [0.227, -0.42], [0.198, -0.24], [0.174, -0.08], [0.162, 0.02], [0.146, 0.1], [0.132, 0.18], [0.129, 0.21]];
    if (R.chamal) perfilPollera.splice(0, 1, [0.262, -0.71], [0.25, -0.6], [0.238, -0.5]);   // el chamal, hasta los tobillos
    torso.add(rol(bordeTorno(med, pintarPieza(capa(R.colPollera || mezcla(ropa, '#2a2420', 0.35), perfilPollera, 36, 0, Math.PI * 2, 0.78, 0.045), (c, p) => {
      if (!op.ropa) return;
      surcos(c, Math.sin(Math.atan2(p.x, p.z) * 9 + 0.3) * sv(0.1, -0.3, p.y), 0.3);
      if (p.y < perfilPollera[0][1] + 0.04) c.multiplyScalar(0.84);  // el ruedo
      if (p.y > 0.17) c.multiplyScalar(0.9);                         // la pretina
    }), perfilPollera.length, 36, false, true), 'pollera', perfilPollera.length, 36));
  }
  if (R.delantal) {
    const perfil = R.pollera
      ? [[0.245, -0.4], [0.226, -0.28], [0.198, -0.14], [0.178, -0.04], [0.166, 0.04], [0.158, 0.12], [0.168, 0.24], [0.188, 0.36]]
      : [[0.186, -0.4], [0.178, -0.2], [0.166, -0.04], [0.162, 0.04], [0.158, 0.12], [0.168, 0.24], [0.19, 0.36]];
    torso.add(rol(bordeTorno(med, conTela(pintarPieza(capa(R.delantal, perfil.map(([r, y]) => [r * (mujer ? 1 : 1.03), y]), 14, -0.68, 1.36, R.pollera ? 0.79 : 0.72), (c, p) => {
      if (!op.ropa) return;
      surcos(c, Math.sin(p.x * 70 + 0.5) * sv(0.05, -0.3, p.y), 0.14);
      if (p.y < -0.37) c.multiplyScalar(0.88);
      if (p.y > -0.2 && p.y < -0.08 && Math.abs(p.x - 0.06) < 0.05) c.multiplyScalar(0.92);    // el bolsillo
      if (Math.abs(p.y + 0.08) < 0.004 && Math.abs(p.x - 0.06) < 0.05) c.multiplyScalar(0.75);
    }), med ? TELA[R.telaDelantal || 'lienzo'] : 0), perfil.length, 14, true, true), 'delantal', perfil.length, 14));
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
  if (R.fiesta) {
    const perfilFaja = [[0.152, 0.1], [0.157, 0.112], [0.158, 0.2], [0.153, 0.212]];
    torso.add(rol(capa('#9a2c24', perfilFaja, 24), 'faja', perfilFaja.length, 24));
    // la trapelacucha: la placa de arriba, dos cadenas, la cruz y los colgantes
    const plata = '#8e9298', pz = (y) => 0.142 + 0.008 * Math.exp(-(((y - 0.36) / 0.08) ** 2));
    const pl = [bola(plata, [0.032, 0.016, 0.005], [0, 0.462, pz(0.462)], null, [10, 6])];
    for (const s of [-1, 1]) pl.push(huso(plata, [[s * 0.022, 0.455, pz(0.455)], [s * 0.019, 0.41, pz(0.41) + 0.002], [s * 0.014, 0.365, pz(0.365) + 0.003]], [0.0022, 0.0022, 0.0022], 6, 4));
    pl.push(bola(plata, [0.024, 0.024, 0.005], [0, 0.34, pz(0.34) + 0.004], [0, 0, Math.PI / 4], [8, 5]));
    pl.push(bola(plata, [0.009, 0.009, 0.006], [0, 0.34, pz(0.34) + 0.008], null, [6, 5]));
    for (const dx of [-0.016, 0, 0.016]) pl.push(bola(plata, [0.0065, 0.0085, 0.0015], [dx, 0.303 - Math.abs(dx) * 0.4, pz(0.3) + 0.004], null, [7, 5]));
    for (const m of pl) { m.userData.tela = TELA.plata; torso.add(m); }
  }
  if (med && !colores.poncho && !R.fiesta) {
    const yc = R.pollera ? 0.19 : 0.005, rc = R.pollera ? 0.152 : R.chaleco ? 0.166 : 0.158, cuero = '#4e3420';
    torso.add(conTela(capa(cuero, [[rc - 0.002, yc - 0.013], [rc + 0.002, yc - 0.008], [rc + 0.002, yc + 0.008], [rc - 0.002, yc + 0.013]], 20), TELA.cuero));
    const zf = rc * 0.75 * zPecho(0, yc) + 0.004;
    // la hebilla: adelante, o al costado si hay delantal
    const ah = R.delantal ? 1.15 : 0, hx0 = Math.sin(ah) * rc * 1.02, hz0 = Math.cos(ah) * (R.delantal ? rc * 0.8 : zf);
    torso.add(conTela(torno('#a08a58', [[0.014, -0.012], [0.016, 0], [0.014, 0.012]], [hx0, yc, hz0], [Math.PI / 2, 0, -ah], [1, 0.25, 1], 8), 0));
    torso.add(bola('#3a2616', [0.008, 0.007, 0.004], [hx0 + Math.sin(ah) * 0.004, yc, hz0 + Math.cos(ah) * 0.004], [0, ah, 0]));
    // la bolsita, colgada a la izquierda
    const bx = -rc * 0.86, bz = rc * 0.32;
    torso.add(conTela(bola('#7a5434', [0.03, 0.03, 0.016], [bx - 0.01, yc - 0.058, bz], [0, -0.5, 0.08], [8, 6]), TELA.cuero));   // la bolsa
    torso.add(conTela(bola('#684628', [0.014, 0.012, 0.009], [bx - 0.01, yc - 0.026, bz], [0, -0.5, 0], [7, 5]), TELA.cuero));    // el cuello atado
    torso.add(bola('#c8b088', [0.017, 0.003, 0.011], [bx - 0.01, yc - 0.031, bz], [0, -0.5, 0], [7, 3]));                       // el cordón
    torso.add(conTela(bola(cuero, [0.004, 0.024, 0.003], [bx - 0.012, yc - 0.015, bz - 0.006], [0, -0.5, 0]), TELA.cuero));
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
    grupo.add(piel(bola(colPiel, med ? [0.015 * kb, 0.043 * kb, 0.029 * kb] : [0.0125 * kb, 0.04 * kb, 0.024 * kb], [W[0] - l * 0.002, W[1] - 0.045, W[2] + 0.003], [0.05, 0, 0], sims ? [9, 7] : [12, 9])));
    const dedos = med ? [[0.016, 0.041], [0.0055, 0.046], [-0.005, 0.044], [-0.015, 0.037]] : [[0.015, 0.06], [0.0055, 0.068], [-0.0045, 0.064], [-0.0135, 0.052]];
    const kd = med ? 1.25 : 1, curva = med ? 2.1 : 1;
    for (const [dz, L] of dedos) {
      const y0 = W[1] - (med ? 0.078 : 0.074) * kb, z0 = W[2] + dz * kb, Lk = L * kb;
      const pts = [[W[0] - l * 0.001, y0 + 0.006, z0], [W[0] - l * 0.003 * curva, y0 - Lk * 0.45, z0 + 0.004], [W[0] - l * 0.011 * curva, y0 - Lk * 0.85, z0 + 0.003], [W[0] - l * 0.017 * curva, y0 - Lk, z0 + 0.001]];
      const d = huso(colPiel, pts, [0.0064 * kb * kd, 0.0058 * kb * kd, 0.0052 * kb * kd, 0.0047 * kb * kd], sims ? 4 : 6, sims ? 5 : 6);
      grupo.add(piel(pintarPieza(d, (c, p) => { tinta(c, mezcla(colPiel, '#c4544a', 0.4), 0.25 * sv(y0 - Lk * 0.6, y0 - Lk, p.y)); })));
    }
    grupo.add(piel(huso(colPiel, [[W[0] - l * 0.006, W[1] - 0.03, W[2] + 0.02], [W[0] - l * 0.012, W[1] - 0.055, W[2] + 0.029], [W[0] - l * 0.012, W[1] - 0.077, W[2] + 0.03]], [0.0095 * kb, 0.0068 * kb, 0.0055 * kb], sims ? 4 : 6, sims ? 5 : 6)));
  };
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(l * hx, 1.3, 0); piv.scale.set(anchoB, 1, anchoB);
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
      if (med && R.arremangado && !colores.poncho) { arremangar(piv, brazo[0], brazo[1], 3, manga, colPiel, 14, 10); piv.add(piel(bola(colPiel, [0.022, 0.022, 0.022], W, null, [8, 6]))); }
      else {
        piv.add(pintarPieza(huso(manga, brazo[0], brazo[1], colores.poncho ? 12 : sims ? 14 : 22, sims ? 10 : 12), arrugaManga));
        const puno = torno(matiz(manga, 0.82), [[0.031, -0.02], [0.034, -0.004], [0.033, 0.016], [0.029, 0.02]], W, null, null, 12);
        puno.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), D);
        piv.add(puno);
      }
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
      const remango = med && R.arremangado && !colores.poncho;
      if (remango) { arremangar(piv, pts, rad, 4, manga, colPiel, 14, 10); const Wm = [W[0] - codo.position.x, W[1] - codo.position.y, W[2] - codo.position.z]; codo.add(piel(bola(colPiel, [0.023 * kb, 0.03, 0.02 * kb], [Wm[0], Wm[1] + 0.006, Wm[2]], null, [8, 6]))); }
      else piv.add(rol(pintarPieza(huso(manga, pts, rad, colores.poncho ? 10 : sims ? 14 : 22, sims ? 10 : 12), arrugaManga), 'manga', colores.poncho ? 10 : sims ? 14 : 22, sims ? 10 : 12));
      // el puño y la mano, en el codo (así en C y D el antebrazo dobla)
      const Wc = [W[0] - codo.position.x, W[1] - codo.position.y, W[2] - codo.position.z];
      if (!remango) {
        const puno = torno(matiz(manga, 0.82), [[0.03, -0.02], [0.033, -0.004], [0.032, 0.016], [0.028, 0.02]], [Wc[0], Wc[1] - 0.004, Wc[2]], [-0.1, 0, 0], null, 12);
        if (op.ropa) pintarPieza(puno, (c, p) => { if (Math.abs(p.y) < 0.003) c.multiplyScalar(0.8); });
        codo.add(puno);
        if (op.ropa) codo.add(bola('#d8d0c0', [0.004, 0.004, 0.003], [Wc[0] + l * 0.03, Wc[1] + 0.004, Wc[2] + 0.004]));
      }
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
  const F = sims ? medidasS(mujer, chico, robusto) : medidasCara(mujer, chico);
  if (med) medidasM(F, R);
  if (op.atlas) F.atlas = true;
  armarCabeza(cabeza, F, colores, R, op, colPiel);
  if (chico) cabeza.scale.setScalar(1.42);   // los chicos: la cabeza grande para el cuerpo
  if (sims) cabeza.scale.setScalar(chico ? 1.24 : 1.08);   // S: la cabeza apenas grande (Lucía: la de una chica de 9)
  if (med) { cabeza.scale.setScalar(chico ? 1.2 : 1.05); telasPorColor(g, colores, R, bota, pantalon); }
  if (op.atlas) guardasP(g, clave);
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
// S: los huesos de todos en una textura compartida (por páginas de 170 personas): una sola subida por
// cuadro en vez de una por persona (era lo que más costaba de C y D: ~0,6 ms con 30). Cada persona
// tiene su tramo; el índice de hueso de sus vértices ya viene corrido (`base`).
const HUESOS_POR_PERSONA = 24, LADO_PAGINA = 128;
let paginaHuesos = null;
function lugarHuesos() {
  const cap = ((LADO_PAGINA * LADO_PAGINA) / 4 / HUESOS_POR_PERSONA) | 0;
  if (!paginaHuesos || paginaHuesos.usados >= cap) {
    const matrices = new Float32Array(LADO_PAGINA * LADO_PAGINA * 4);
    const tex = new THREE.DataTexture(matrices, LADO_PAGINA, LADO_PAGINA, THREE.RGBAFormat, 1015 /* FloatType */);
    tex.needsUpdate = true;
    paginaHuesos = { matrices, tex, usados: 0 };
  }
  return { pagina: paginaHuesos, base: paginaHuesos.usados++ * HUESOS_POR_PERSONA };
}
class Esqueleto {
  constructor(huesos, malla, lugar = null) {
    this.huesos = huesos; this.malla = malla;
    const inv = new THREE.Matrix4().copy(malla.matrixWorld).invert();
    this.inversas = huesos.map((h) => new THREE.Matrix4().multiplyMatrices(inv, h.matrixWorld).invert());
    if (lugar) {
      this.boneMatrices = lugar.pagina.matrices; this.boneTexture = lugar.pagina.tex; this.base = lugar.base; this.compartido = true;
    } else {
      let lado = 4; while (lado * lado < huesos.length * 4) lado *= 2;
      this.boneMatrices = new Float32Array(lado * lado * 4);
      this.boneTexture = new THREE.DataTexture(this.boneMatrices, lado, lado, THREE.RGBAFormat, 1015 /* FloatType */);
      this.boneTexture.needsUpdate = true; this.base = 0;
    }
    this._inv = new THREE.Matrix4(); this._m = new THREE.Matrix4();
    this.update();
  }
  computeBoneTexture() { return this; }
  update() {
    this._inv.copy(this.malla.matrixWorld).invert();
    for (let i = 0; i < this.huesos.length; i++) {
      this._m.multiplyMatrices(this._inv, this.huesos[i].matrixWorld).multiply(this.inversas[i]);
      this._m.toArray(this.boneMatrices, (this.base + i) * 16);
    }
    this.boneTexture.needsUpdate = true;   // (la compartida sube una vez: la primera vez que se usa en el cuadro)
  }
  dispose() { if (!this.compartido) this.boneTexture.dispose(); }
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

// ---------------------------------------------------------------- M: las telas pintadas en el shader
// Como el detalle de superficie de la aldea (aSuperficie): cada vértice trae `aTela` = (tipo + 0,4 ×
// borde, y, z). Los tipos: 1 lana tejida, 2 lienzo, 3 cuero, 4 punto, 5 fieltro, 6 pelo, 7 lienzo con
// harina, 8 barba (con canas), 9 cara con pecas, 10 cara con arrugas de la risa, 11 cara lisa. La ropa
// usa la posición de reposo (la tela no "nada" al moverse) y `borde` (0 en el borde de la pieza:
// cuero gastado, dobladillo cosido); el pelo, la barba y la cara usan (y, z) en el espacio de la
// cabeza. Todo procedural, con la pincelada ancha encima, y apagado con fwidth cuando la trama queda
// más chica que un par de píxeles (de lejos no titila). Una sola variante de programa más.
const GLSL_TELA = /* glsl */`
  varying vec3 vTela; varying vec3 vPosT; varying vec3 vNorT;
  float hT(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float nT(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hT(i), hT(i + vec2(1.0, 0.0)), f.x), mix(hT(i + vec2(0.0, 1.0)), hT(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fwT(vec2 g) { return max(fwidth(g.x), fwidth(g.y)); }
  // la trama: hilos que pasan por arriba y por abajo (damero de franjas)
  float tramaT(vec2 uv, float esc) {
    vec2 g = uv * esc;
    float a = sin(g.x * 6.2832), b = sin(g.y * 6.2832);
    float cel = step(0.5, fract(floor(g.x) * 0.5 + floor(g.y) * 0.5));
    return mix(mix(a * a, b * b, cel), 0.5, smoothstep(0.25, 0.7, fwT(g)));
  }
`;
const GLSL_TELA_COLOR = /* glsl */`
  {
    float tipo = floor(vTela.x + 0.5);
    float borde = clamp((vTela.x - tipo) / 0.4, 0.0, 1.0);
    if (tipo > 0.5) {
      vec3 alb = diffuseColor.rgb;
      vec3 an = abs(normalize(vNorT));
      vec2 uv = an.y > 0.75 ? vPosT.xz : (an.x > an.z ? vPosT.zy : vPosT.xy);
      bool cabeza = tipo > 5.5 && abs(tipo - 7.0) > 0.5;
      if (cabeza) uv = vTela.yz;
      bool tela = !cabeza;
      // la pincelada: manchas anchas, entre tibio y frío (nada fotográfico)
      float pin = nT(vec2(uv.x * 5.0 + 1.7 * nT(uv * 1.3), uv.y * 2.2)) * 0.65 + nT(uv * 13.0 + 7.3) * 0.35;
      if (tela) alb *= mix(vec3(0.86, 0.88, 0.95), vec3(1.08, 1.03, 0.93), pin);
      // de lejos (más de ~6 mm por píxel) la trama ya no se ve: sólo la pincelada y la mugre (más barato)
      float px = max(length(dFdx(vPosT)), length(dFdy(vPosT)));
      if (px > 0.006) {
        // (el mismo tono medio que de cerca, para que no salte al cruzar el umbral)
        if (tipo > 2.5 && tipo < 3.5) alb *= 0.8 + 0.3 * nT(uv * 3.0);
        else if (tipo < 8.5 && abs(tipo - 7.0) > 0.5 && tipo > 5.5) alb *= 0.885;
        else if (tela) alb *= 0.96;
      } else if (tipo < 1.5) {
        alb *= 0.88 + 0.16 * tramaT(uv, 210.0);                                   // lana tejida
      } else if (tipo < 2.5 || abs(tipo - 7.0) < 0.5) {
        alb *= 0.92 + 0.1 * tramaT(uv, 330.0);                                    // lienzo
        alb *= 0.95 + 0.08 * smoothstep(0.62, 0.9, nT(vec2(uv.x * 2.0, uv.y * 140.0)));
        if (tipo > 6.5) {                                                         // la harina
          float h = smoothstep(0.42, 0.7, nT(uv * 6.0 + 2.0)) * (0.5 + 0.5 * nT(uv * 40.0)) * smoothstep(0.55, 0.9, vPosT.y);
          alb = mix(alb, vec3(0.95, 0.93, 0.88), h * 0.9);
        }
      } else if (tipo < 3.5) {                                                    // cuero
        alb *= 0.7 + 0.5 * nT(uv * 18.0) * (0.75 + 0.5 * nT(uv * 3.0));
        float rasp = smoothstep(0.7, 0.9, nT(vec2(uv.x * 30.0, uv.y * 8.0)));
        alb = mix(alb, alb * 1.5 + 0.01, rasp * 0.45);
        float gasto = (1.0 - smoothstep(0.0, 0.3, borde)) * (0.55 + 0.45 * nT(uv * 60.0));
        alb = mix(alb, alb * vec3(1.8, 1.55, 1.25) + 0.015, gasto * 0.85);
        alb *= 1.0 - 0.55 * step(0.965, hT(floor(uv * 38.0))) * step(0.5, nT(uv * 4.0));   // marcas de chispas
      } else if (tipo < 4.5) {                                                    // punto (tejido)
        vec2 g = vec2(uv.x * 105.0, uv.y * 130.0);
        float v = abs(fract(g.x) - 0.5) * 2.0;
        float pt = sin((g.y + v * 0.6) * 6.2832);
        alb *= mix(0.8 + 0.28 * smoothstep(-0.4, 0.7, pt) - 0.12 * smoothstep(0.82, 1.0, v), 0.95, smoothstep(0.3, 0.8, fwT(g)));
      } else if (tipo < 5.5) {                                                    // fieltro
        alb *= 0.9 + 0.14 * nT(uv * 45.0) + 0.06 * nT(uv * 160.0);
      } else if (tipo < 6.5 || abs(tipo - 8.0) < 0.5) {                           // pelo y barba: hebras
        vec2 g = vec2(uv.x * 380.0 + 7.0 * nT(uv * vec2(18.0, 26.0)), uv.y * 16.0);
        float heb = nT(g) * 0.6 + nT(g * vec2(2.3, 1.7) + 5.0) * 0.4;
        heb = mix(heb, 0.5, smoothstep(0.35, 0.9, fwT(g)));
        float mech = nT(vec2(uv.x * 40.0, uv.y * 7.0));
        alb *= 0.6 + 0.6 * heb * (0.7 + 0.5 * mech);
        if (tipo > 7.5) {
          float cana = smoothstep(0.76, 0.88, nT(vec2(uv.x * 900.0, uv.y * 70.0))) * (0.35 + 0.65 * smoothstep(0.4, 0.75, nT(uv * 24.0)));
          cana *= 1.0 - smoothstep(0.35, 0.9, fwT(g));
          alb = mix(alb, vec3(0.3, 0.28, 0.26), cana * 0.5);
        }
      } else {                                                                    // la cara
        float ax = abs(uv.x), y = uv.y;
        alb *= 0.97 + 0.06 * nT(uv * 70.0);
        if (tipo < 9.5) {                                                         // pecas
          vec2 c = uv / 0.0042, id = floor(c);
          vec2 f = fract(c) - 0.5 - (vec2(hT(id), hT(id + 3.7)) - 0.5) * 0.5;
          float zona = exp(-pow((ax - 0.024) / 0.024, 2.0) - pow((y + 0.019) / 0.013, 2.0)) + exp(-pow(uv.x / 0.009, 2.0) - pow((y + 0.017) / 0.012, 2.0));
          float p = (1.0 - smoothstep(0.16, 0.3, length(f))) * step(0.4, hT(id + 9.1)) * clamp(zona, 0.0, 1.0);
          p *= 1.0 - smoothstep(0.3, 0.8, fwT(c));
          alb = mix(alb, alb * vec3(0.7, 0.52, 0.4), p * 0.75);
        } else if (tipo < 10.5) {                                                 // arrugas de la risa
          vec2 d = vec2(ax - 0.046, y + 0.002);
          float r = length(d), a = atan(d.y, d.x);
          float rayas = smoothstep(0.8, 0.98, cos(a * 9.0)) * step(abs(a), 0.7) * smoothstep(0.003, 0.006, r) * (1.0 - smoothstep(0.008, 0.012, r));
          float xs = 0.014 + (-0.039 - y) * 0.36;
          float surco = (1.0 - smoothstep(0.0006, 0.0018, abs(ax - xs))) * smoothstep(-0.058, -0.052, y) * (1.0 - smoothstep(-0.044, -0.039, y));
          float arr = max(rayas * 0.8, surco) * (1.0 - smoothstep(0.3, 0.8, fwT(uv * 400.0)));
          alb = mix(alb, alb * vec3(0.8, 0.68, 0.62), arr * 0.38);
        }
      }
      if (tela && px <= 0.006) {
        // el dobladillo cosido junto al borde
        float pesp = step(0.45, fract((uv.x + uv.y) * 230.0));
        float hilo = (1.0 - smoothstep(0.012, 0.03, abs(borde - 0.1))) * pesp * (1.0 - smoothstep(0.3, 0.8, fwT(uv * 230.0)));
        alb *= 1.0 - 0.35 * hilo;
        // algún remiendo, con su puntada alrededor (en la lana, el lienzo y el cuero)
        if (tipo < 3.5 || abs(tipo - 7.0) < 0.5) {
          vec2 q = uv / 0.13, cel = floor(q), l = fract(q);
          float dentro = step(0.22, l.x) * step(l.x, 0.78) * step(0.26, l.y) * step(l.y, 0.74) * step(0.972, hT(cel + 13.1)) * step(0.35, vPosT.y);
          alb = mix(alb, alb * vec3(1.12, 1.04, 0.88) * (0.92 + 0.16 * nT(uv * 90.0)), dentro);
          float dd = min(min(l.x - 0.22, 0.78 - l.x), min(l.y - 0.26, 0.74 - l.y));
          alb *= 1.0 - 0.45 * dentro * (1.0 - smoothstep(0.0, 0.025, abs(dd - 0.035))) * pesp;
        }
      }
      if (tela) {
        // abajo, la tela más sucia y oscura (barro y polvo)
        float suc = 1.0 - smoothstep(0.05, 0.5 + 0.3 * nT(uv * 3.0), vPosT.y);
        alb = mix(alb, alb * vec3(0.6, 0.52, 0.42), suc * 0.6);
      }
      diffuseColor.rgb = alb;
    }
  }
`;
let MAT_TELA = null;
function materialTela() {
  if (MAT_TELA) return MAT_TELA;
  MAT_TELA = new THREE.MeshLambertMaterial({ vertexColors: true });
  MAT_TELA.onBeforeCompile = (sh) => {
    materialPiel().onBeforeCompile(sh);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aTela; varying vec3 vTela; varying vec3 vPosT; varying vec3 vNorT;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTela = aTela; vPosT = position; vNorT = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL_TELA)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + GLSL_TELA_COLOR);
  };
  MAT_TELA.customProgramCacheKey = () => 'proto-tela-M1';
  return MAT_TELA;
}
const TELA = { lana: 1, lienzo: 2, cuero: 3, punto: 4, fieltro: 5, pelo: 6, harina: 7, barba: 8, pecas: 9, arrugas: 10, cara: 11, plata: 12, labio: 13, ceja: 14, fiesta: 15 };
const conTela = (m, t) => { m.userData.tela = t; return m; };
// La paleta de tierra y la ropa de M: ocres, verde oliva, marrones y rojos apagados. Los tres de la
// prueba tienen la suya; al resto se le corre el color hacia la tierra.
const PALETA_M = {
  'poblador-herrero': {
    colores: { ropa: '#b39466', abrigo: '#6b5a36', gorro: 'gorro', gorroColor: '#5c4a32', pelo: '#3a2a1e', barba: '#4a3626' },
    R: { pantalon: '#5e4c36', delantal: '#6c4a2c', telaDelantal: 'cuero', faja: '#8a3c2a', botaCol: '#5a3c26', arremangado: true },
  },
  'poblador-panadera': {
    colores: { ropa: '#d8c8a4', abrigo: '#66673a', gorro: 'panuelo', gorroColor: '#b05c38', pelo: '#3a2a22', bufanda: null },
    R: { chaleco: true, colPollera: '#9c7440', delantal: '#e2d8c0', telaDelantal: 'harina', botaCol: '#6a4a30', arremangado: true },
  },
  'aldea-nena': {
    colores: { ropa: '#d4c29c', abrigo: '#6c6e3e', gorro: 'gorroPunto', gorroColor: '#a8562e', pelo: '#4a2e1e', bufanda: '#c8a464' },
    R: { chaleco: true, telaChaleco: 'punto', colPollera: '#94443a', botas: 'altas', botaCol: '#5c3e2a', pecas: true },
  },
};
function aTierra(hex) {
  if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex;
  const c = new THREE.Color(hex); c.getHSL(_hsl);
  // el tono se corre hacia el ocre (unos 30°) y se apaga un poco
  const h = _hsl.h; let d = 0.085 - h; if (d > 0.5) d -= 1; if (d < -0.5) d += 1;
  c.setHSL((h + d * 0.3 + 1) % 1, _hsl.s * 0.72, _hsl.l);
  return `#${c.getHexString()}`;
}
function paletaM(clave, colores, R) {
  const p = PALETA_M[clave];
  if (p) return { colores: { ...colores, ...p.colores }, R: { ...R, ...p.R } };
  const c = { ...colores };
  for (const k of ['ropa', 'abrigo', 'pantalon', 'bufanda']) if (c[k]) c[k] = aTierra(c[k]);
  return { colores: c, R: { ...R, pantalon: aTierra(R.pantalon), delantal: aTierra(R.delantal), arremangado: !!(R.chaleco || R.delantal) } };
}

// ---------------------------------------------------------------- P: el atlas pintado (gente-proto-atlas.js)
// Como M, pero el detalle sale de un atlas pintado por código al cargar: las telas (en la posición de
// reposo, como M), las guardas a lo largo de los bordes (`aGuarda` = tipo, distancia al borde, largo
// a lo largo del borde, ancho de la guarda; en metros), la cara pintada (rubor, sombra de párpados,
// pecas), los labios (líneas y brillo), las cejas con pelito, las hebras del pelo y la plata (con un
// brillo suave). Tipos nuevos: 12 plata, 13 labio, 14 ceja, 15 paño de fiesta. De lejos (más de ~6 mm
// por píxel) no se lee el detalle de las telas, sólo las guardas (con su mipmap).
const GLSL_P = /* glsl */`
  uniform sampler2D uAtlas; varying vec4 vGuarda; float brilloT = 0.0;
  // un cuadro del atlas, repetido (fract) con su derivada propia (sin costura en el mip)
  vec4 cuadroA(vec2 o, vec2 s, vec2 uv) {
    vec2 base = (o + 4.0) / 2048.0, sz = (s - 8.0) / 2048.0;
    vec2 dx = dFdx(uv) * sz, dy = dFdy(uv) * sz;
    float m = max(length(dx), length(dy)) * 2048.0;
    if (m > 6.0) { dx *= 6.0 / m; dy *= 6.0 / m; }
    return textureGrad(uAtlas, base + fract(uv) * sz, dx, dy);
  }
  // un cuadro sin repetir (la cara, los labios, las cejas)
  vec4 unoA(vec2 o, vec2 s, vec2 uv) {
    vec2 base = (o + 2.0) / 2048.0, sz = (s - 4.0) / 2048.0;
    return textureGrad(uAtlas, base + clamp(uv, 0.0, 1.0) * sz, dFdx(uv) * sz, dFdy(uv) * sz);
  }
`;
const GLSL_P_COLOR = /* glsl */`
  {
    float tipo = floor(vTela.x + 0.5);
    float borde = clamp((vTela.x - tipo) / 0.4, 0.0, 1.0);
    float px = max(length(dFdx(vPosT)), length(dFdy(vPosT)));
    bool cerca = px < 0.006;
    vec3 alb = diffuseColor.rgb;
    if (tipo > 0.5 || vGuarda.x > 0.5) {
      vec3 an = abs(normalize(vNorT));
      vec2 uvp = an.y > 0.75 ? vPosT.xz : (an.x > an.z ? vPosT.zy : vPosT.xy);
      bool pelo = (tipo > 5.5 && tipo < 6.5) || (tipo > 7.5 && tipo < 8.5);
      bool cara = tipo > 8.5 && tipo < 11.5, plata = tipo > 11.5 && tipo < 12.5;
      bool labio = tipo > 12.5 && tipo < 13.5, ceja = tipo > 13.5 && tipo < 14.5;
      bool tela = !(pelo || cara || plata || labio || ceja);
      float det = 1.0;
      float pin = nT(vec2(uvp.x * 5.0 + 1.7 * nT(uvp * 1.3), uvp.y * 2.2)) * 0.65 + nT(uvp * 13.0 + 7.3) * 0.35;
      if (tela) {
        alb *= mix(vec3(0.88, 0.9, 0.96), vec3(1.07, 1.03, 0.94), pin);
        float k = tipo < 0.5 ? 1.0 : tipo < 1.5 ? 0.0 : (tipo < 2.5 || abs(tipo - 7.0) < 0.5) ? 1.0 : tipo < 3.5 ? 2.0 : tipo < 4.5 ? 3.0 : tipo < 5.5 ? 4.0 : 7.0;
        float esc = k < 0.5 ? 0.045 : k < 1.5 ? 0.03 : k < 2.5 ? 0.14 : k < 3.5 ? 0.045 : k < 4.5 ? 0.09 : 0.025;
        float con = abs(k - 2.0) < 0.5 ? 0.7 : 1.4;   // (el cuero, más parejo)
        if (cerca && tipo > 0.5) det = 1.0 - 0.5 * con + con * cuadroA(vec2(k * 256.0, 0.0), vec2(256.0), uvp / esc).r;
        if (abs(tipo - 7.0) < 0.5) {   // la harina
          float h = smoothstep(0.42, 0.7, nT(uvp * 6.0 + 2.0)) * (0.5 + 0.5 * nT(uvp * 40.0)) * smoothstep(0.55, 0.9, vPosT.y);
          alb = mix(alb, vec3(0.95, 0.93, 0.88), h * 0.9);
        }
        if (cerca && tipo > 0.5) {
          float pesp = step(0.45, fract((uvp.x + uvp.y) * 230.0));
          det *= 1.0 - 0.35 * (1.0 - smoothstep(0.012, 0.03, abs(borde - 0.1))) * pesp * (1.0 - smoothstep(0.3, 0.8, fwT(uvp * 230.0)));
        }
      } else if (pelo) {
        det = cerca ? 0.62 + 0.75 * cuadroA(vec2(1280.0, 0.0), vec2(256.0), vec2(vTela.y / 0.012, vTela.z / 0.05)).r : 0.97;
        if (tipo > 7.5 && cerca) {
          float cana = smoothstep(0.76, 0.88, nT(vec2(vTela.y * 900.0, vTela.z * 70.0))) * (0.35 + 0.65 * smoothstep(0.4, 0.75, nT(vTela.yz * 24.0)));
          alb = mix(alb, vec3(0.3, 0.28, 0.26), cana * 0.5);
        }
      } else if (cara) {
        vec2 fc = vTela.yz, uc = vec2((fc.x + 0.085) / 0.17, (0.085 - fc.y) / 0.2);
        vec4 m = unoA(vec2(0.0, 1024.0), vec2(512.0), uc);
        alb = mix(alb, alb * vec3(1.12, 0.72, 0.7), m.r * 0.5);
        alb *= mix(vec3(1.0), vec3(0.8, 0.64, 0.66), m.g * 0.6);
        if (tipo < 9.5) alb = mix(alb, alb * vec3(0.68, 0.5, 0.38), m.b * 0.8);
        alb *= 0.97 + 0.06 * nT(fc * 70.0);
      } else if (plata) {
        float g = cerca ? cuadroA(vec2(1536.0, 0.0), vec2(256.0), uvp / 0.04).r : 0.58;
        alb = vec3(0.5, 0.52, 0.56) * (0.45 + g);
        brilloT = 0.55;
      } else if (labio) {
        vec4 t = unoA(vec2(512.0, 1152.0), vec2(512.0, 256.0), vec2(vTela.y * 0.5 + 0.5, vTela.z));
        det = 0.45 + 1.1 * t.r; brilloT = t.g * 0.6;
      } else if (ceja) {
        vec4 t = unoA(vec2(512.0, 1024.0), vec2(512.0, 128.0), vTela.yz);
        det = 0.6 + 1.25 * (t.r - 0.3);
      }
      // la guarda: tejida (tapa la tela) o bordada (encima, donde hay hilo)
      if (vGuarda.x > 0.5 && vGuarda.y > -0.001 && vGuarda.y < vGuarda.w) {
        float g = floor(vGuarda.x + 0.5);
        vec2 o = vec2(mod(g - 1.0, 2.0) * 1024.0, 256.0 + floor((g - 1.0) / 2.0) * 128.0);
        vec4 t = cuadroA(o, vec2(1024.0, 128.0), vec2(vGuarda.z / (vGuarda.w * 8.0), vGuarda.y / vGuarda.w));
        vec3 cg = pow(t.rgb, vec3(2.2)) * (0.9 + 0.2 * pin);
        if (abs(g - 7.0) < 0.5) alb = mix(alb, alb * 0.35, t.a);
        else alb = mix(alb, cg, t.a);
      }
      if (tela) {
        float suc = 1.0 - smoothstep(0.05, 0.5 + 0.3 * nT(uvp * 3.0), vPosT.y);
        alb = mix(alb, alb * vec3(0.6, 0.52, 0.42), suc * 0.6);
      }
      diffuseColor.rgb = alb * det;
    }
  }
`;
// la plata y los labios: un brillo suave (Lambert no tiene; se suma uno chico de la luz del sol)
const GLSL_P_BRILLO = /* glsl */`
  #if NUM_DIR_LIGHTS > 0
  if (brilloT > 0.0) {
    vec3 hv = normalize(directionalLights[0].direction + normalize(vViewPosition));
    float sp = pow(max(dot(normal, hv), 0.0), 36.0);
    float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
    reflectedLight.directDiffuse += directionalLights[0].color * (sp * 0.9 + fr * 0.12) * brilloT;
  }
  #endif
`;
let MAT_ATLAS = null;
function materialAtlas() {
  if (MAT_ATLAS) return MAT_ATLAS;
  MAT_ATLAS = new THREE.MeshLambertMaterial({ vertexColors: true });
  const tex = atlasPersonajes();
  MAT_ATLAS.onBeforeCompile = (sh) => {
    materialPiel().onBeforeCompile(sh);
    sh.uniforms.uAtlas = { value: tex };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aTela; attribute vec4 aGuarda; varying vec3 vTela; varying vec3 vPosT; varying vec3 vNorT; varying vec4 vGuarda;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTela = aTela; vPosT = position; vNorT = normal; vGuarda = aGuarda;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL_TELA + GLSL_P)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + GLSL_P_COLOR)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + GLSL_P_BRILLO);
  };
  MAT_ATLAS.customProgramCacheKey = () => 'proto-atlas-P1';
  return MAT_ATLAS;
}
// las guardas: en una pieza de torno (los vértices van por gajo: i·npts + j) o de huso (por anillo)
function guardaTorno(m, npts, segs, tipo, ancho, desde = 'abajo') {
  const P = m.geometry.attributes.position, n = P.count, gu = new Float32Array(n * 4), a = new THREE.Vector3(), b = new THREE.Vector3();
  const d = [0];
  for (let j = 1; j < npts; j++) { a.fromBufferAttribute(P, j); b.fromBufferAttribute(P, j - 1); d.push(d[j - 1] + a.distanceTo(b)); }
  const total = d[npts - 1], jE = desde === 'arriba' ? npts - 1 : 0, largo = [0];
  for (let i = 1; i <= segs; i++) { a.fromBufferAttribute(P, i * npts + jE); b.fromBufferAttribute(P, (i - 1) * npts + jE); largo.push(largo[i - 1] + a.distanceTo(b)); }
  for (let k = 0; k < n; k++) {
    const i = Math.floor(k / npts), j = k % npts;
    const dist = desde === 'arriba' ? total - d[j] : d[j];
    gu.set([tipo, dist, largo[Math.min(i, segs)], desde === 'todo' ? total + 1e-4 : ancho], k * 4);
  }
  m.geometry.setAttribute('guarda', new THREE.BufferAttribute(gu, 4));
  return m;
}
function guardaHuso(m, tramos, lados, tipo, ancho) {
  const P = m.geometry.attributes.position, n = P.count, gu = new Float32Array(n * 4), K = lados + 1;
  const c = [], v = new THREE.Vector3();
  for (let r = 0; r <= tramos; r++) { const s = new THREE.Vector3(); for (let q = 0; q < K; q++) s.add(v.fromBufferAttribute(P, r * K + q)); c.push(s.divideScalar(K)); }
  const hasta = [0];   // la distancia al final del huso, anillo por anillo
  for (let r = tramos - 1; r >= 0; r--) hasta.unshift(hasta[0] + c[r].distanceTo(c[r + 1]));
  for (let k = 0; k < n; k++) {
    const r = Math.floor(k / K), q = k % K;
    const rad = v.fromBufferAttribute(P, r * K).distanceTo(c[r]);
    gu.set([tipo, hasta[r], (q / lados) * Math.PI * 2 * rad, ancho], k * 4);
  }
  m.geometry.setAttribute('guarda', new THREE.BufferAttribute(gu, 4));
  return m;
}
const rol = (m, nombre, a, b) => { m.userData.rol = nombre; m.userData.dims = [a, b]; return m; };
// La ropa de P: la de M con guardas (y la de fiesta de Inés)
const GUARDAS_P = {
  'poblador-panadera': { pollera: [2, 0.05], delantal: [1, 0.03] },
  'poblador-herrero': { delantal: [7, 0.06] },
  'aldea-nena': { pollera: [3, 0.06], chaleco: [2, 0.035] },
  'poblador-herbolaria': { pollera: [5, 0.1], manga: [6, 0.075], faja: [4, 0], chaleco: [1, 0.028, 'arriba'] },
};
function guardasP(g, clave) {
  const G = GUARDAS_P[clave] || { pollera: [1, 0.03] };
  g.traverse((o) => {
    const r = o.userData.rol; if (!r || !G[r]) return;
    const [tipo, ancho, desde] = G[r], [a, b] = o.userData.dims;
    if (r === 'manga') guardaHuso(o, a, b, tipo, ancho);
    else guardaTorno(o, a, b, tipo, ancho, r === 'faja' ? 'todo' : desde || 'abajo');
  });
}
// Inés Ancalao, la herbolaria (35): de fiesta, con chamal, faja tejida, trarilonko y trapelacucha
const PALETA_P = {
  'poblador-herbolaria': {
    colores: { ropa: '#e6dcc4', abrigo: '#2c2834', pelo: '#1c1410', gorro: null, bufanda: null, piel: '#b98a62', trarilonko: true, aros: 'chawai' },
    R: { pollera: true, chaleco: true, chamal: true, fiesta: true, dosTrenzas: true, trenza: true, colPollera: '#2c2834', telaChaleco: 'fiesta', botaCol: '#3a2a1e', piel: '#b98a62' },
  },
};
function paletaP(clave, colores, R) {
  const p = PALETA_P[clave];
  const base = p ? { colores: { ...colores, ...p.colores }, R: { ...R, ...p.R } } : paletaM(clave, colores, R);
  if (clave === 'poblador-panadera' || clave === 'aldea-nena') base.colores = { ...base.colores, aros: 'chicos' };
  return base;
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
// S: las telas con un poco más de color (y la piel apenas), y lo que mira arriba, tibio
const _hsl = { h: 0, s: 0, l: 0 };
function telaS(c, n, esPiel, medieval = false) {
  c.getHSL(_hsl);
  let l = Math.min(1, _hsl.l * (esPiel ? 1.06 : 1.04) + 0.008);
  if (!esPiel && l < 0.05) l += (0.05 - l) * 0.3;   // las telas casi negras, apenas levantadas (que se lea la forma; en lineal)
  c.setHSL(_hsl.h, Math.min(1, _hsl.s * (esPiel ? 0.9 : medieval ? 1.0 : 1.16)), l);   // (M: la paleta de tierra, sin avivar)
  if (!esPiel) c.lerp(_tibio, 0.06 * Math.max(0, n.y));
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
  sumar(cabeza.userData.rasgos);
  const lugar = op.sims ? lugarHuesos() : null, baseH = lugar ? lugar.base : 0;   // S: la textura de huesos compartida
  const mallas = [];
  g.traverse((o) => { if (o.isMesh && !o.userData.aparte) mallas.push(o); });   // (el rostro de S va aparte)
  // lo del mate va al final (para guardarlo con drawRange)
  mallas.sort((a, b) => (a.userData.mate ? 1 : 0) - (b.userData.mate ? 1 : 0));
  let nv = 0, ni = 0;
  for (const m of mallas) { nv += m.geometry.attributes.position.count; ni += m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), zona = new Float32Array(nv * 2);
  const aTela = op.medieval ? new Float32Array(nv * 3) : null;   // M: la tela de cada vértice
  const aGuarda = op.atlas ? new Float32Array(nv * 4) : null;    // P: la guarda
  const si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), pieza = new Uint16Array(nv), tapa = new Uint8Array(nv), crudo = new Uint8Array(nv);
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
    const sup = m.userData.superior, Z = geo.attributes.zona, esCrudo = !!m.userData.crudo;
    const TV = geo.attributes.telaV, B = geo.attributes.borde, telaPieza = m.userData.tela || 0, AT = geo.attributes.aTela, GU = geo.attributes.guarda;
    if (m.userData.mate && iMate < 0) iMate = oi;
    for (let i = 0; i < P.count; i++) {
      const j = ov + i;
      p.fromBufferAttribute(P, i).applyMatrix4(_mRel);
      q.fromBufferAttribute(P, i).applyMatrix4(m.matrix);   // en el espacio del grupo
      n.fromBufferAttribute(N, i).applyMatrix3(_nmRel).normalize();
      pos[j * 3] = p.x; pos[j * 3 + 1] = p.y; pos[j * 3 + 2] = p.z;
      nor[j * 3] = n.x; nor[j * 3 + 1] = n.y; nor[j * 3 + 2] = n.z;
      if (C) c.setRGB(C.getX(i), C.getY(i), C.getZ(i)); else c.copy(m.material.color);
      // (los rasgos de S ya vienen con su color: como el rostro de cerca, sin sombra pintada ni oclusión)
      const esPiel = Z ? Z.getX(i) > 0.5 : !!m.userData.piel;
      if (!esCrudo) { sombraPintada(c, p, n); if (op.sims) telaS(c, n, esPiel, !!op.medieval); }
      if (aTela) {
        const tp = TV ? TV.getX(i) : telaPieza;
        let x = tp, y = 0, z = 0;
        if (tp === TELA.pelo && m.userData.raya) { y = q.z; z = Math.atan2(Math.abs(q.x), q.y - 0.05) * 0.08; }   // (de la raya hacia los costados)
        else if (tp === TELA.pelo || tp === TELA.barba) { y = Math.atan2(q.x, q.z) * 0.08; z = q.y - 0.05; }
        else if (tp >= TELA.pecas) { y = q.x; z = q.y - 0.05; }
        else if (tp > 0) x = tp + 0.4 * (B ? B.getX(i) : 1);
        if (AT) { x = AT.getX(i); y = AT.getY(i); z = AT.getZ(i); }   // (el rostro trae la suya)
        aTela[j * 3] = x; aTela[j * 3 + 1] = y; aTela[j * 3 + 2] = z;
      }
      if (aGuarda && GU) { aGuarda[j * 4] = GU.getX(i); aGuarda[j * 4 + 1] = GU.getY(i); aGuarda[j * 4 + 2] = GU.getZ(i); aGuarda[j * 4 + 3] = GU.getW(i); }
      col[j * 3] = c.r; col[j * 3 + 1] = c.g; col[j * 3 + 2] = c.b;
      zona[j * 2] = Z ? Z.getX(i) : m.userData.piel ? 1 : 0; zona[j * 2 + 1] = 1; crudo[j] = esCrudo ? 1 : 0;
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
      lista.forEach(([h, v], r) => { si[j * 4 + r] = h + baseH; sw[j * 4 + r] = v / tot; });
      for (let r = lista.length; r < 4; r++) si[j * 4 + r] = baseH;
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
  if (op.piel) { oclusion(pos, nor, pieza, zona, col, tapa, op.sims ? 0.5 : 1, op.sims ? 0.35 : 1, crudo); geo.setAttribute('zona', new THREE.BufferAttribute(zona, 2)); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (aTela) geo.setAttribute('aTela', new THREE.BufferAttribute(aTela, 3));
  geo.setIndex(new THREE.BufferAttribute(ind, 1));
  geo.computeBoundingSphere();
  if (op.atlas) geo.setAttribute('aGuarda', new THREE.BufferAttribute(aGuarda, 4));
  const malla = new MallaConPiel(geo, op.atlas ? materialAtlas() : op.medieval ? materialTela() : op.piel ? materialPiel() : MAT_FAUNA);
  malla.castShadow = true;
  g.add(malla);
  g.updateMatrixWorld(true);
  malla.skeleton = new Esqueleto(H, malla, lugar);
  malla.userData.indicesSinMate = iMate;
  return malla;
}
// Oclusión por cercanía: cada vértice mira los vértices de otras piezas que tiene delante (en el
// hemisferio de su normal) a menos de 5 cm; cuantos más y más cerca, más oscuro (bajo el mentón,
// las axilas, entre las piernas, bajo la bufanda, el borde del gorro). Se hace una vez, al armar.
function oclusion(pos, nor, pieza, zona, col, tapa, fuerza = 1, fuerzaPiel = 1, crudo = null) {
  const n = pieza.length, R = 0.05, mapa = new Map();
  const clave = (x, y, z) => (x + 64) * 16384 + (y + 64) * 128 + (z + 64);
  for (let i = 0; i < n; i += 2) {
    if (!tapa[i]) continue;
    const k = clave(Math.floor(pos[i * 3] / R), Math.floor(pos[i * 3 + 1] / R), Math.floor(pos[i * 3 + 2] / R));
    let l = mapa.get(k); if (!l) mapa.set(k, l = []); l.push(i);
  }
  for (let i = 0; i < n; i++) {
    if (crudo && crudo[i]) continue;
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
    const ao = 1 - (zona[i * 2] ? fuerzaPiel : fuerza) * Math.min(zona[i * 2] ? 0.3 : 0.55, occ * (zona[i * 2] ? 0.025 : 0.045));
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
    // S: el gesto (neutral, sonrisa al charlar; `g.__gesto` lo fuerza: 'neutral' | 'sonrisa' | 'risa')
    if (op.sims && g.cara) {
      const pedido = g.__gesto || (charlando ? 'sonrisa' : 'neutral');
      const inf = g.cara.morphTargetInfluences, k = Math.min(1, dt * 7);
      inf[0] += ((pedido === 'sonrisa' ? 1 : 0) - inf[0]) * k;
      inf[1] += ((pedido === 'risa' ? 1 : 0) - inf[1]) * k;
      // de cerca (7 m), el rostro con gestos; de lejos, los rasgos fundidos en el cuerpo
      if (camara) {
        g.cabeza.getWorldPosition(_v);
        const cerca = !g.__lejos && _v.distanceToSquared(camara.position) < 49;   // (__lejos: para probar)
        if (cerca !== g.cara.visible) { g.cara.visible = cerca; g.cabeza.userData.rasgos.scale.setScalar(cerca ? 0.001 : 1); }
      }
    }
    if (op.medieval) quietudM(g, st, dt, andando, charlando);   // M: manos en la cintura, brazos cruzados...
    if (!op.mirar || !camara) return;
    // mirar al jugador: la cabeza gira la mitad y los ojos el resto; de vez en cuando miran a otro lado
    const cab = g.cabeza;
    cab.getWorldPosition(_v);
    _w.copy(camara.position).sub(_v);
    const dist = Math.hypot(_w.x, _w.z);
    let ang = Math.atan2(_w.x, _w.z) - g.g.rotation.y; ang = Math.atan2(Math.sin(ang), Math.cos(ang));
    const pitch = Math.atan2(_w.y, dist);
    st.desvioT -= dt;
    if (g.__gesto) st.desvioT = 1;   // (las fotos: mirando a la cámara)
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
    const achina = g.cara ? 0.07 * g.cara.morphTargetInfluences[0] + 0.2 * g.cara.morphTargetInfluences[1] : 0;   // S: al reír, los ojos se achinan
    for (const pp of cab.userData.parpados) pp.rotation.x = Math.min(0.95, 0.95 * cierre + Math.max(0, -st.pitch) * 0.45 + achina);
  };
}

// ---------------------------------------------------------------- M: las poses de quietud
// Cada brazo: x (adelante, negativo), yl (giro sobre su eje, hacia adentro negativo), zl (abrirlo),
// codo (doblar, negativo); yl y zl van espejados según el lado. `uno`: la pose usa un solo brazo
// (si esa mano tiene el mate, la hace la otra). El orden de los giros del hombro pasa a XZY (con y = 0
// es el mismo de siempre): primero el giro sobre el eje del brazo, después abrirlo, después adelante.
const POSES_M = {
  cintura: { izq: { x: 0.08, yl: -1.4, zl: 0.5, codo: -1.6 }, der: { x: 0.08, yl: -1.4, zl: 0.5, codo: -1.6 } },
  cruzados: { izq: { x: -0.62, yl: -1.3, zl: -0.06, codo: -2.05 }, der: { x: -0.72, yl: -1.38, zl: -0.04, codo: -1.95 } },
  barba: { uno: true, der: { x: -1.05, yl: -0.62, zl: -0.12, codo: -2.5 }, cabeza: -0.12 },
  gorro: { uno: true, der: { x: -2.35, yl: -0.35, zl: 0.42, codo: -1.75 }, cabeza: 0.1 },
  atras: { izq: { x: 0.5, yl: -1.45, zl: 0.08, codo: -1.3 }, der: { x: 0.5, yl: -1.45, zl: 0.08, codo: -1.3 } },
  delantal: { uno: true, izq: { x: -0.42, yl: -1.05, zl: -0.04, codo: -1.05 } },
};
const POSES_DE = { 'poblador-herrero': ['cintura', 'cruzados', 'barba'], 'poblador-panadera': ['cintura', 'gorro', 'delantal'], 'aldea-nena': ['atras', 'cruzados', 'gorro'] };
const posesDe = (clave) => POSES_DE[clave] || ['cintura', 'cruzados', 'atras'];
function quietudM(g, st, dt, andando, charlando) {
  const q = st.q || (st.q = { nombre: null, sig: null, w: 0, t: 2 + Math.random() * 4 });
  if (g.__quietud !== undefined) q.sig = g.__quietud;
  else if (!andando && !charlando && !g.pose) {
    q.t -= dt;
    if (q.t <= 0) {
      const lista = g.posesM || [];
      q.sig = Math.random() < 0.65 && lista.length ? lista[Math.floor(Math.random() * lista.length)] : null;
      q.t = q.sig ? 5 + Math.random() * 7 : 3 + Math.random() * 4;
    }
  } else q.sig = null;
  if (q.nombre !== q.sig) { q.w = Math.max(0, q.w - dt * 2.5); if (q.w === 0) q.nombre = q.sig; } else q.w = Math.min(1, q.w + dt * 2.5);
  const P = POSES_M[q.nombre];
  if (!P || q.w <= 0) return;
  const w = q.w * q.w * (3 - 2 * q.w);
  let defs = [P.izq || null, P.der || null];
  if (P.uno) {
    const lado = P.der ? 1 : 0, def = P.der || P.izq;
    defs = [null, null];
    defs[g.brazos[lado].userData.muneca ? 1 - lado : lado] = def;
  }
  g.brazos.forEach((b, s) => {
    const d = defs[s];
    if (!d || b.userData.muneca) return;
    const l = s ? 1 : -1;
    if (b.userData.z0 === undefined) b.userData.z0 = b.rotation.z;
    b.rotation.order = 'XZY';
    b.rotation.x += (d.x - b.rotation.x) * w;
    b.rotation.y = d.yl * l * w;
    b.rotation.z = b.userData.z0 + (d.zl * l - b.userData.z0) * w;
    const cd = b.userData.codo; if (cd) cd.rotation.x += (d.codo - cd.rotation.x) * w;
  });
  if (P.cabeza) g.cabeza.rotation.x += P.cabeza * w;
}
// ---------------------------------------------------------------- la entrada
const TALLA_CHICO_S = 0.76 / 0.58;
export function protoPersona(V, colores, clave = '', conMate = false, R = {}) {
  const op = OPC[V] || OPC.A;
  if (op.medieval) ({ colores, R } = (op.atlas ? paletaP : paletaM)(clave, colores || {}, R || {}));
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
  if (op.medieval) r.posesM = posesDe(clave);
  if (op.sims) {
    r.cara = cabeza.userData.rostro || null;
    // Lucía (y los chicos): de 9 años, no de 5. La talla de aldea.js (0,58) los deja de 1 m; en el
    // prototipo se corrige acá (si se elige S, va `talla: 0.76` en aldea.js y se saca esto)
    if (f.chico) {
      const poner = THREE.Vector3.prototype.setScalar;
      g.scale.setScalar = function (s) { return poner.call(this, s * TALLA_CHICO_S); };
      g.scale.setScalar(f.escala);
    }
  }
  return r;
}
export const __opcionesProto = OPC;
// (para el estudio: los triángulos de cada pieza, antes de fundir)
export function __piezasProto(V, colores, clave, conMate, R) {
  const f = figura(colores || {}, clave, conMate, R || {}, OPC[V] || OPC.A), out = new Map();
  f.g.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3;
    const k = `${o.parent === f.cabeza || o.parent?.parent === f.cabeza ? 'cabeza' : o.parent === f.torso ? 'torso' : 'miembros'}:${g.type}`;
    const e = out.get(k) || { tri: 0, ver: 0, n: 0 }; e.tri += n; e.ver += g.attributes.position.count; e.n++; out.set(k, e);
  });
  return [...out].sort((a, b) => b[1].tri - a[1].tri);
}
