// 3.7.0: la gente del juego, al estilo P (elegido por el usuario entre las variantes del prototipo
// de la 3.6.2: A, B, C, D, S, M y P). Ya no va detrás de un ajuste de depuración: así se arma TODA la gente
// (los vecinos del valle, los de la aldea, los pobladores, las visitas y los compañeros del
// Desafío, que son los mismos vecinos). Base "tipo Sims, pero más simple" (S) a lo Sims Medieval
// (M), con un atlas pintado por código (gente-atlas.js): telas, guardas patagónicas, la cara
// pintada, labios con brillo, cejas con pelito, hebras de pelo y plata.
//   · El cuerpo es una sola malla por persona con piel por huesos (los huesos son los grupos de
//     siempre: torso, cabeza, hombros, codos, caderas, rodillas, tobillos, ojos, párpados, la
//     muñeca del mate), así las animaciones de gente.js (posar, caminar, el mate) no cambian.
//     Los huesos de todos van en una textura compartida (una subida por cuadro).
//   · De cerca (7 m) la cara se dibuja aparte con sus gestos (neutral, sonrisa y risa con formas
//     de mezcla); de lejos los rasgos van fundidos en el cuerpo, y más lejos todavía se dibuja el
//     cuerpo sin las piezas chicas (dedos, ojos, pestañas, plata).
//   · La ropa y el aspecto de cada uno salen de gente-ropa.js (por clave), con la ropa de abrigo
//     del invierno.
// Devuelve lo mismo que la gente vieja (g, cabeza, torso, patas, brazos, mano, muneca,
// mateVisible) y usa los mismos pivotes (cadera 0,82, hombros 1,30, cabeza 1,46).
import * as THREE from 'three';
import { bola, tubo, torno, huso, deformar, coser, matiz as matizF, mezcla as mezclaF, color, puntasBufanda } from './formas.js';
import { MAT_FAUNA } from './vida.js';
import { atlasPersonajes } from './gente-atlas.js';
import { aspectoGente } from './gente-ropa.js';

const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x, y, sx, sy) => Math.exp(-((x / sx) ** 2 + (y / sy) ** 2));
const _c = new THREE.Color();
// 3.7.0: los colores se calculan una vez (armar a alguien pinta miles de vértices: leer un "#rrggbb" o
// mezclar dos colores en cada uno era la mitad de lo que tardaba)
const memo = (fn) => { const m = new Map(); return (...a) => { const k = a.join('|'); let v = m.get(k); if (v === undefined) { v = fn(...a); if (m.size > 4000) m.clear(); m.set(k, v); } return v; }; };
const matiz = memo(matizF), mezcla = memo(mezclaF);
const COLORES = new Map();
const colorDe = (hex) => { let c = COLORES.get(hex); if (!c) { c = new THREE.Color(hex); COLORES.set(hex, c); } return c; };
const tinta = (c, hex, t) => { if (t > 0) c.lerp(colorDe(hex), Math.min(1, t)); };
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
// 3.7.0 (integración): lo mismo, cortando cada `lote` vértices (la cara: miles de vértices pintados uno por uno)
function* pintarPiezaPasos(m, fn, lote = 500) {
  const g = m.geometry; if (!g.attributes.normal) g.computeVertexNormals();
  const P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color;
  const out = new Float32Array(P.count * 3), p = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) {
    if (i && i % lote === 0) yield;
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
// 3.7.0: las piezas chicas que de lejos no se ven (dedos, pestañas, ojos, plata, botones): van al
// final de la malla y lejos se dibuja sin ellas (ver `detalle` en continuo y en alPosar)
const fino = (m) => { m.userData.fino = 1; return m; };
const rol = (m, nombre, a, b) => { m.userData.rol = nombre; m.userData.dims = [a, b]; return m; };

// ---------------------------------------------------------------- las telas del atlas
// Cada vértice trae `aTela` = (tipo + 0,4 × borde, y, z). Los tipos: 1 lana tejida, 2 lienzo, 3 cuero,
// 4 punto, 5 fieltro, 6 pelo, 7 lienzo con harina, 8 barba (con canas: 8 + 0,4 × cuántas), 12 plata,
// 13 labio, 14 ceja, 15 paño de fiesta, 16 lienzo con lunares (el pañuelo de la cabeza), 17 pelo con canas (17 + 0,4 × cuántas) y la cara, de 20 a 51
// (20 + las marcas: 1 pecas, 2 arrugas de la risa, 4 las de los mayores, 8 cicatriz, 16 ojeras).
const TELA = { lana: 1, lienzo: 2, cuero: 3, punto: 4, fieltro: 5, pelo: 6, harina: 7, barba: 8, plata: 12, labio: 13, ceja: 14, fiesta: 15, lunares: 16, canas: 17, cara: 20 };
const MARCA_CARA = { pecas: 1, risa: 2, mayor: 4, cicatriz: 8, ojeras: 16 };
const esCara = (t) => t >= TELA.cara && t < TELA.cara + 32;
const conTela = (m, t) => { m.userData.tela = t; return m; };

// ---------------------------------------------------------------- la cabeza
// Todo en el espacio del grupo de la cabeza (pivote a 1,46 m): el centro del cráneo, 5 cm más arriba.
// La cara de cada uno: las medidas de base (mujer, varón, chico) por lo que diga su `cara` en
// gente-ropa.js (ancho, largo, nariz, ojos, boca, mandíbula, mentón, pómulos, cejas, el gesto en reposo).
function medidas(mujer, chico, cara = {}) {
  // (las diferencias de gente-ropa.js se marcan casi al doble: con ±5 % todas las caras se parecían)
  const k = (n, d = 1) => (Number.isFinite(cara[n]) ? (d === 1 && n !== 'sonrisa' && n !== 'parpado' && n !== 'mand' ? 1 + (cara[n] - 1) * 1.9 : cara[n]) : d);
  const ancho = k('ancho'), largo = k('largo');
  const F = {
    mujer, chico, cy: 0.05, frente: 0.068 * largo,
    rx: (chico ? 0.077 : mujer ? 0.074 : 0.079) * ancho,
    ry: (chico ? 0.095 : mujer ? 0.1 : 0.105) * largo,
    rz: (chico ? 0.092 : mujer ? 0.094 : 0.099) * (0.6 + 0.4 * ancho),
    re: (chico ? 0.0152 : mujer ? 0.0146 : 0.014) * 0.9 * k('ojos'),
    ex: (chico ? 0.031 : mujer ? 0.0325 : 0.0335) * (0.5 + 0.5 * ancho),
    ey: chico ? -0.006 : -0.002,
    nariz: (chico ? 0.62 : mujer ? 0.78 : 0.92) * 1.22 * k('nariz'),
    cachete: (chico ? 1.2 : mujer ? 0.7 : 0.6) * 0.6,
    mand: k('mand', chico ? 0.2 : mujer ? 0.3 : 0.34),
    menton2: k('menton'), pom: k('pomulos'), cejaK: k('cejas'),
    abre: (chico ? 0.5 : mujer ? 0.47 : 0.43) * 0.94 * k('abre'),
    bocaW: (chico ? 0.0158 : mujer ? 0.0182 : 0.019) * 1.03 * k('boca'),
    s0: k('sonrisa', 0.14), parpado: k('parpado', 0),
    // 3.7.0: más de qué distinguir: el arco de las cejas, los ojos rasgados y los labios más llenos
    arco: k('arco', 1), rasgado: k('rasgado', 0), labios: k('labios', 1),
  };
  F.ceja = F.ey + (chico ? 0.025 : 0.024) * largo;
  F.punta = F.ey - (chico ? 0.027 : 0.032) * largo;
  F.base = F.punta - (chico ? 0.008 : 0.009) * largo;
  F.boca = F.base - (chico ? 0.014 : 0.016) * largo;
  F.menton = F.boca - (chico ? 0.032 : mujer ? 0.035 : 0.04) * largo;
  const r = (x) => Math.round(x * 1000);
  F.clave = [mujer ? 'm' : 'v', chico ? 'c' : '', r(F.rx), r(F.ry), r(F.rz), r(F.re * 10), r(F.nariz), r(F.mand), r(F.menton2), r(F.pom), r(F.cejaK), r(F.abre), r(F.bocaW * 10), r(F.s0), r(F.arco), r(F.rasgado), r(F.labios)].join(':');
  return F;
}
// la forma del cráneo y de la cara (sin los rasgos): v relativo al centro
function formaCraneo(v, F) {
  const zf = 0.55 * F.rz;
  if (v.z > zf) v.z = zf + (v.z - zf) * 0.6;                                   // la cara, más plana
  if (v.z < 0) { v.z *= 1.06; v.y += 0.006 * Math.max(0, -v.z / F.rz); }        // la nuca
  const fr = sv(0.0, 0.5, v.z / F.rz);
  if (v.y < -0.015) { const s = sv(-0.015, -0.1, v.y); v.x *= 1 - F.mand * s * s * (0.55 + 0.45 * fr); }   // la mandíbula
  v.z += (F.mujer ? 0.005 : 0.008) * F.menton2 * gauss(v.x, v.y - F.menton - 0.012, 0.022, 0.02) * fr;   // el mentón
  // abajo, la mandíbula sube hacia la nuca (lo de abajo queda en el cuello), suave, sin escalones
  const piso = F.menton + (-0.052 - F.menton) * sv(0.06, -0.01, v.z);
  { const d = v.y - piso, w = 0.004; v.y = piso + 0.12 * d + 0.88 * w * Math.log1p(Math.exp(d / w)) - 0.88 * w * Math.LN2; }
  // los pómulos
  const pom = gauss(Math.abs(v.x) - 0.043, v.y + 0.017, 0.019, 0.014) * fr;
  v.z += 0.0048 * pom * F.cachete; v.x += Math.sign(v.x) * 0.002 * pom * F.cachete;
  return v;
}
// Los rasgos, suaves: cuencas poco hondas, la nariz chica con la punta redonda, el morro donde
// apoyan los labios, los cachetes llenos; los pómulos, la mandíbula y el mentón con carácter
function rasgos(v, F) {
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
  const k = (F.chico ? 0.45 : 1) * F.pom;
  v.z += 0.0034 * k * gauss(ax - 0.046, y + 0.008, 0.014, 0.011) * fr;                       // los pómulos
  v.x += Math.sign(v.x) * 0.0022 * k * gauss(ax - 0.052, y + 0.008, 0.014, 0.012) * fr;
  v.z -= 0.0018 * k * gauss(ax - 0.046, y + 0.036, 0.012, 0.01) * fr;                        // bajo el pómulo
  if (!F.chico) v.x += Math.sign(v.x) * (F.mujer ? 0.0018 : 0.0042) * gauss(ax - 0.058, y - F.menton - 0.03, 0.014, 0.016);   // la mandíbula
  v.z += (F.mujer || F.chico ? 0.0014 : 0.0028) * F.menton2 * gauss(v.x, y - F.menton - 0.01, 0.012, 0.01) * fr;               // el mentón
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
// La piel pareja y tibia: poca forma pintada, mejillas apenas rosadas, la sombra bajo la nariz
function pintarCara(c, p, n, F, colPiel) {
  const ax = Math.abs(p.x), fr = sv(0.2, 0.7, p.z / F.rz), y = p.y;
  c.multiplyScalar(0.92 + 0.11 * sv(-0.2, 0.9, 0.5 * n.z + 0.4 * n.y));
  const rub = mezcla(colPiel, '#d8645a', 0.55);
  tinta(c, rub, (F.chico ? 0.36 : F.mujer ? 0.3 : 0.24) * gauss(ax - 0.039, y + 0.02, 0.018, 0.013) * fr);
  if (!F.chico) tinta(c, mezcla(matiz(colPiel, 0.8), '#6a4a48', 0.2), 0.16 * gauss(ax - 0.048, y + 0.036, 0.012, 0.009) * fr);
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
// el cráneo con la cara (la forma se esculpe una vez por cara y se copia; cada uno la pinta con lo suyo)
const MOLDES = new Map();
const molde = (clave, hacer) => { let g = MOLDES.get(clave); if (!g) { g = hacer(); MOLDES.set(clave, g); } return g.clone(); };
// (3.7.0 (integración): de a partes, ver figuraPasos)
function* craneoPasos(F, colPiel, marcas) {
  const nuevo = !MOLDES.has('craneo' + F.clave);
  const g = molde('craneo' + F.clave, () => {
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
  if (nuevo) yield;
  const m = yield* pintarPiezaPasos(piel(new THREE.Mesh(g, color(colPiel))), (c, p, n) => { p.y -= F.cy; pintarCara(c, p, n, F, colPiel); });
  m.userData.tela = TELA.cara + marcas;
  return m;
}
// el punto de la cara en (x, y) (la mandíbula angosta la x: se corrige)
function sobreCara(x, y, F) {
  let x0 = x, v = null;
  for (let i = 0; i < 4; i++) { v = superficie(x0, y, F); x0 += x - v.x; }
  return v;
}
// Los gestos: s sonrisa (las comisuras arriba), o boca abierta, b cejas arriba, q ojos achinados.
// 3.7.0: el neutral de cada uno (`sonrisa` en gente-ropa.js): Malena casi seria, Martina y Pocha
// con la sonrisa puesta
const gestosDe = (F) => [
  { s: F.s0, o: 0, b: 0, q: 0 },          // neutral
  { s: 1.25, o: 0.3, b: 0.15, q: 0.55 },  // sonrisa
  { s: 0.95, o: 1, b: 0.5, q: 0.8 },      // risa
];
// Los rasgos que se mueven, en una malla aparte, hija de la cabeza, con formas de mezcla (sonrisa y
// risa): los labios (geometría: el borde es nítido), la boca por dentro, los dientes, las cejas, el
// párpado de abajo que sube al sonreír y, con barba, el bigote. Cada parte es una grilla (u, v).
const _arriba = new THREE.Vector3(0, 1, 0);
const PARTES = { labioSup: 0, labioInf: 1, boca: 2, dientes: 3, ceja: 4, parpado: 5, bigote: 6 };
function formaRostro(F, P, barba, ojos) {
  const pos = [], idx = [], partes = [];
  const o = P.o * (barba ? 0.62 : 1);
  const W = F.bocaW * (1 + 0.16 * P.s + 0.06 * o);
  const cen = (u) => F.boca + 0.0011 + P.s * 0.0056 * u * u - P.s * 0.0006;
  const arribaL = (u) => cen(u) + o * 0.0032 * (1 - u * u);
  const abajoL = (u) => cen(u) - o * 0.0135 * Math.pow(Math.max(0, 1 - u * u), 0.75);
  const hU = (u) => { const q = Math.max(0, 1 - u * u); return (F.mujer && !F.chico ? 0.0048 : F.chico ? 0.0042 : 0.0039) * F.labios * (1 - 0.22 * P.s) * Math.sqrt(q) * (1 + 0.22 * Math.exp(-(((Math.abs(u) - 0.3) / 0.16) ** 2)) - 0.14 * Math.exp(-((u / 0.09) ** 2))); };
  const hL = (u) => { const q = Math.max(0, 1 - u * u); return (F.mujer && !F.chico ? 0.0064 : F.chico ? 0.0056 : 0.005) * F.labios * (1 - 0.18 * P.s) * Math.pow(q, 0.55); };
  const lev = 0.0003 + (barba ? 0.0042 : 0);
  const bulto = (w, u) => 1.45 * Math.sin(Math.PI * (0.18 + 0.82 * w)) * Math.sqrt(Math.max(0, 1 - u * u));
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
  tira(PARTES.labioSup, 16, 5, -1, 1, (u, v) => sobre(u * W, arribaL(u) + v * hU(u), lev + 0.0005 + 0.0024 * bulto(v, u)));
  tira(PARTES.labioInf, 16, 5, -1, 1, (u, v) => sobre(u * W, abajoL(u) - (1 - v) * hL(u), lev + 0.0005 + 0.003 * bulto(1 - v, u)));
  // la boca por dentro (entre las dos líneas: sin área si está cerrada) y los dientes de arriba
  tira(PARTES.boca, 14, 3, -1, 1, (u, v) => sobre(u * W * 0.98, abajoL(u) + v * (arribaL(u) - abajoL(u)), lev + 0.0002));
  tira(PARTES.dientes, 10, 2, -1, 1, (u, v) => {
    const uu = u * 0.8, top = arribaL(uu) + 0.0006, h = Math.min((arribaL(uu) - abajoL(uu)) * 0.8, 0.0042 * (1 - 0.45 * u * u));
    return sobre(u * W * 0.8, top - h + v * h, lev + 0.0005 + 0.0004 * Math.sqrt(1 - u * u));
  });
  // las cejas: del lado de adentro a la cola, más gruesas adentro
  for (const l of [-1, 1]) {
    tira(PARTES.ceja, 10, 2, 0, 1, (u, v) => {
      const arco = (F.mujer || F.chico ? 1 : 0.75) * 0.0042 * F.arco * Math.sin(Math.PI * Math.pow(u, 1.25)) - (0.0022 - F.rasgado * 0.004) * u - 0.0012 * (1 - u);
      const grueso = (F.chico ? 0.0042 : F.mujer ? 0.0046 : 0.0066) * F.cejaK * Math.min(1, 0.8 + u * 1.5) * (1 - 0.72 * sv(0.5, 1, u));
      const y = F.ceja + arco + P.b * 0.0042 * (1 - 0.35 * u) + P.s * 0.0006 + (v - 0.42) * grueso;
      return sobre(l * (F.ex - 0.016 + u * 0.037), y, 0.0008 + 0.0007 * Math.sin(Math.PI * v));
    }, l < 0);
  }
  // el párpado de abajo (sube con la sonrisa), sobre el globo, apenas fuera de él
  for (const [l, E] of ojos) {
    tira(PARTES.parpado, 12, 3, -0.93, 0.93, (u, v) => {
      const [ar, ab] = bordesAlmendra(u, F), q = Math.max(0, 1 - (u / 0.93) ** 2);
      const arriba = ab - 0.012 + P.q * (ar - ab) * 0.52 * Math.pow(q, 0.45), abajoV = ab - 0.14;
      const vv = abajoV + v * (arriba - abajoV), r = F.re * 1.058, z = Math.sqrt(Math.max(0.02, 1 - u * u - vv * vv));
      return [E.x + l * u * r, E.y + F.cy + vv * r, E.z + z * r];
    }, l < 0);
  }
  // el bigote: sobre el labio de arriba, más allá de las comisuras cae un poco
  if (barba) tira(PARTES.bigote, 16, 3, -1.3, 1.3, (u, v) => {
    const uc = Math.max(-1, Math.min(1, u)), fuera = Math.max(0, Math.abs(u) - 1);
    const y0 = arribaL(uc) + hU(uc) + 0.0003 - fuera * 0.013;
    const h = 0.0078 * (1 - 0.5 * (u / 1.3) ** 2) * (1 - 0.15 * P.s);
    const y = Math.min(F.base - 0.0012, y0 + v * h);
    return sobre(u * W * 1.06, y, lev + 0.0012 + 0.0032 * Math.sin(Math.PI * (0.15 + 0.85 * v)) * Math.sqrt(Math.max(0, 1 - (u / 1.32) ** 2)));
  });
  return { pos, idx, partes };
}
function rostro(F, colPiel, colCeja, colBarba, ojos, canasBarba) {
  const barba = !!colBarba;
  const datos = (() => {
    const clave = 'rostro' + F.clave + (barba ? 'b' : '');
    let d = MOLDES.get(clave);
    if (d) return d;
    const vs = gestosDe(F).map((P) => formaRostro(F, P, barba, ojos));
    const normales = vs.map((v) => { const g = geoDe(v.pos, v.idx); g.computeVertexNormals(); return g.attributes.normal.array; });
    d = { vs, normales };
    MOLDES.set(clave, d);
    return d;
  })();
  const { vs, normales } = datos, partes = vs[0].partes, n = partes.length / 3;
  // los colores de cada uno
  const labio = mezcla(colPiel, '#d0566a', F.chico ? 0.46 : F.mujer ? 0.58 : 0.3), labioSup = mezcla(matiz(labio, 0.8), '#8a3040', 0.12);
  const linea = mezcla(labio, '#2a0c0e', 0.72), col = new Float32Array(n * 3), zona = new Float32Array(n * 2), at = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const parte = partes[i * 3], u = partes[i * 3 + 1], v = partes[i * 3 + 2];
    let esPiel = 1;
    if (parte === PARTES.labioSup || parte === PARTES.labioInf) {
      const w = parte === PARTES.labioSup ? v : 1 - v;           // 0 en la línea de la boca
      _c.set(parte === PARTES.labioSup ? labioSup : labio);
      if (parte === PARTES.labioInf) tinta(_c, '#f4c8c0', 0.16 * gauss(u, w - 0.45, 0.45, 0.25));   // el brillo del labio de abajo
      tinta(_c, linea, (w < 0.01 ? 0.95 : 0.45 * sv(0.3, 0.1, w)) + 0.35 * sv(0.75, 1, Math.abs(u)));
      tinta(_c, colPiel, 0.25 * sv(0.85, 1, w));                    // el borde se funde apenas con la piel
      at.set([TELA.labio, u, parte === PARTES.labioSup ? 0.5 - 0.5 * v : 1 - 0.5 * v], i * 3);
    } else if (parte === PARTES.boca) {
      _c.set('#3a1718'); if (v < 0.4 && Math.abs(u) < 0.65) tinta(_c, '#9a4448', 0.7 * sv(0.4, 0.05, v) * sv(0.65, 0.2, Math.abs(u)));
      esPiel = 0;
    } else if (parte === PARTES.dientes) {
      _c.set('#f2ede4'); tinta(_c, '#b8aca0', 0.55 * sv(0.55, 1, Math.abs(u)) + 0.25 * sv(0.4, 0, v)); esPiel = 0;
    } else if (parte === PARTES.ceja) {
      _c.set(colCeja); tinta(_c, matiz(colCeja, 1.35), 0.3 * sv(0.15, 0, u)); esPiel = 0;
      at.set([TELA.ceja, u, 1 - v], i * 3);
    } else if (parte === PARTES.parpado) {
      _c.set(colPiel); telaS(_c, _arriba, true); tinta(_c, mezcla(colPiel, '#6a3a34', 0.5), 0.55 * sv(0.6, 1, v));
    } else {
      _c.set(colBarba); _c.multiplyScalar(0.92 + 0.16 * Math.sin(u * 15) * (0.5 + 0.5 * v) + 0.08 * v); esPiel = 0;
      at.set([TELA.barba + 0.4 * canasBarba, u * 0.04, v * 0.01], i * 3);
    }
    col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
    zona[i * 2] = esPiel; zona[i * 2 + 1] = 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vs[0].pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normales[0], 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('zona', new THREE.BufferAttribute(zona, 2));
  geo.setAttribute('aTela', new THREE.BufferAttribute(at, 3));   // (los labios, las cejas y el bigote leen el atlas)
  geo.setIndex(vs[0].idx);
  geo.morphAttributes.position = [1, 2].map((k) => new THREE.Float32BufferAttribute(vs[k].pos, 3));
  geo.morphAttributes.normal = [1, 2].map((k) => new THREE.Float32BufferAttribute(normales[k], 3));
  geo.computeBoundingSphere(); geo.boundingSphere.radius += 0.02;
  const m = new THREE.Mesh(geo, materialAtlas());
  m.updateMorphTargets(); m.morphTargetInfluences[0] = 0; m.morphTargetInfluences[1] = 0;
  m.userData.aparte = 1; m.raycast = () => {};
  return m;
}
// La barba con forma: llena, prolija, con mechones grandes; la boca a la vista (el bigote va en el rostro)
function barba(F, colBarba, colPiel, canas) {
  const oculta = (v) => {
    const ax = Math.abs(v.x);
    // el borde en el cachete baja de la patilla (al costado, junto a la oreja) hasta la comisura
    const frente = F.base - 0.006 + 0.55 * Math.max(0, ax - 0.03) + 0.0035 * Math.sin(v.x * 430 + v.z * 200) - 0.004;
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
    tinta(c, colPiel, 0.6 * (1 - sv(0.08, 0.7, oculta(p))));   // en el borde, la piel asoma
  }, 36, 30, 'barba');
  m.userData.tela = TELA.barba; m.userData.canas = canas;
  // abajo, redonda (sin flecos)
  deformar(m, (v) => { const y = v.y - F.cy; if (y < F.menton + 0.03 && v.z > -0.01) v.y -= 0.015 * sv(F.menton + 0.03, F.menton - 0.005, y) * Math.exp(-((v.x / 0.06) ** 2)); });
  return m;
}
// 3.7.0: la trenza fina, trenzada de verdad: tres mechones finos que se cruzan a lo largo de un eje
// (antes eran bolas en fila). `eje`: los puntos de arriba a abajo; `lado`: hacia dónde abre la
// trenza; `ancho`: el medio ancho arriba; `cruces`: cuántas vueltas.
function trenzaFina(colPelo, eje, lado, ancho, cruces = 6) {
  const curva = new THREE.CatmullRomCurve3(eje.map((p) => new THREE.Vector3(...p)));
  const L = new THREE.Vector3(...lado).normalize(), piezas = [], N = cruces * 4, P = new THREE.Vector3(), T = new THREE.Vector3(), D = new THREE.Vector3();
  for (let k = 0; k < 3; k++) {
    const pts = [], rad = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, w = ancho * (1 - 0.45 * t), fase = t * cruces * Math.PI * 2 + k * Math.PI * 2 / 3;
      curva.getPointAt(Math.min(0.999, t), P); curva.getTangentAt(Math.min(0.999, t), T);
      D.crossVectors(T, L).normalize();   // la profundidad (adelante y atrás de la trenza)
      const q = P.clone().addScaledVector(L, w * Math.sin(fase)).addScaledVector(D, w * 0.55 * Math.sin(2 * fase));
      pts.push([q.x, q.y, q.z]); rad.push(ancho * (0.62 - 0.22 * t));
    }
    const m = huso(matiz(colPelo, k === 1 ? 1.08 : k === 2 ? 0.92 : 1), pts, rad, N, 4);
    piezas.push(pintarPieza(m, (c, p, nn) => { c.multiplyScalar(0.86 + 0.24 * sv(-0.5, 0.9, nn.y)); }));
  }
  return piezas;
}
// El pelo: un casco con mechones grandes esculpidos, más los mechones sueltos que asoman bajo el
// gorro, el rodete, la coleta, la melena o las trenzas
function peloDe(F, colPelo, R, gorro) {
  const piezas = peloBase(F, colPelo, R, gorro);
  if (!gorro && (R.rodete || R.trenza || R.coleta)) { piezas[0].userData.raya = true; for (const p of piezas.slice(1, 3)) if (p.geometry.type === 'TubeGeometry') p.userData.raya = true; }   // (las hebras salen de la raya)
  const canas = Math.max(0, Math.min(1, R.canas || 0));
  for (const p of piezas) if (p.userData.tela === undefined && !p.userData.mono) { p.userData.tela = canas > 0 ? TELA.canas : TELA.pelo; p.userData.canas = canas; }
  return piezas;
}
function peloBase(F, colPelo, R, gorro) {
  const largo = !!(R.rodete || R.trenza || R.coleta || R.melena);
  const corto = !largo;
  const linea = (x) => F.frente - 5.5 * x * x;
  const piezas = [];
  const patilla = F.mujer || F.chico ? 0.024 : -0.004, nuca = R.melena ? -0.085 : corto ? -0.056 : -0.072;
  const ocultaPelo = (v) => {
    const ax = Math.abs(v.x);
    const alto = linea(Math.min(ax, 0.052)) + (patilla - linea(0.052)) * sv(0.052, 0.068, ax) - (R.flequillo ? 0.026 * Math.exp(-((ax / 0.045) ** 2)) : 0);
    const frente = sv(alto - 0.007, alto + 0.007, v.y);
    const atras = sv(nuca - 0.006, nuca + 0.006, v.y);
    let m = frente + (atras - frente) * sv(-0.004, -0.02, v.z);
    if (!R.melena) m *= 1 - gauss(v.y + 0.012, v.z + 0.01, 0.028, 0.022) * sv(0.045, 0.06, ax);   // la oreja a la vista
    return Math.max(0, Math.min(1, m));
  };
  const mechon = (v) => Math.max(0, Math.sin(Math.atan2(v.x, v.z) * 7 + v.y * 22));
  const brillo = mezcla(colPelo, '#e8c8a0', 0.22);
  const extra = R.melena ? 0.006 : corto ? 0 : 0.003;
  piezas.push(casco(F, colPelo, true, (v) => 0.007 + 0.004 * sv(0, F.ry, v.y) + extra + 0.0026 * mechon(v) + (R.melena ? 0.006 * sv(0.0, -0.06, v.y) : 0), ocultaPelo, (c, p, n) => {
    const a = Math.atan2(p.x, p.z);
    c.multiplyScalar(0.94 + 0.12 * Math.max(0, Math.sin(a * 7 + p.y * 22)));
    tinta(c, brillo, 0.22 * gauss(p.y - 0.035, 0, 0.02, 1) * sv(-0.2, 0.5, n.y + n.z * 0.3));
    if (!gorro && !corto && !R.melena) tinta(c, matiz(colPelo, 0.5), 0.7 * Math.exp(-(((p.x - (R.rayaCostado ? 0.022 : 0)) / 0.0028) ** 2)) * sv(0.02, 0.06, p.y) * sv(-0.06, 0.0, p.z));   // la raya al medio
    c.multiplyScalar(0.84 + 0.22 * sv(-0.6, 0.8, n.y));
  }, 36, 30, `pelo${R.melena ? 'm' : corto ? 'c' : 'l'}${R.flequillo ? 'f' : ''}`));
  // las mujeres y los chicos: un mechón grande a cada lado, de la sien a detrás de la oreja
  if (largo && !R.melena) for (const l of [-1, 1]) {
    const pts = [[l * 0.052, 0.04, 0.05], [l * 0.068, 0.022, 0.034], [l * 0.077, 0.002, 0.01], [l * 0.074, -0.02, -0.018]].map(([x, y, z]) => [x * F.rx / 0.074, y + F.cy, z]);
    const m = huso(matiz(colPelo, 1.06), pts, [0.006, 0.0105, 0.009, 0.004], 10, 8);
    piezas.push(pintarPieza(m, (c, p, nn) => { c.multiplyScalar(0.86 + 0.24 * sv(-0.5, 0.9, nn.y)); }));
  }
  if (R.melena) {
    // 3.7.0: la melena: el pelo suelto que cae por los costados y la espalda hasta los hombros (una
    // cortina abierta adelante, más ancha abajo), con las puntas desparejas
    const rx = F.rx + 0.014, perfil = [[rx * 0.95, -0.15], [rx * 1.08, -0.12], [rx * 1.06, -0.07], [rx * 1.0, -0.03], [rx * 0.96, 0.0], [rx * 0.86, 0.03]];
    const cortina = torno(colPelo, perfil, [0, F.cy, -0.012], null, [1, 1, (F.rz + 0.016) / rx], 22, Math.PI * 0.5 - 0.42, Math.PI + 0.84);
    deformar(cortina, (v) => { if (v.y < -0.11) v.y += 0.012 * Math.sin(Math.atan2(v.x, v.z) * 11) + (R.despeinada ? 0.01 * Math.sin(Math.atan2(v.x, v.z) * 23) : 0); });
    piezas.push(pintarPieza(cortina, (c, p) => {
      c.multiplyScalar(0.9 + 0.14 * Math.max(0, Math.sin(Math.atan2(p.x, p.z) * 13 + p.y * 9)));
      c.multiplyScalar(0.82 + 0.2 * sv(-0.15, 0.03, p.y));
    }));
    // los mechones de adelante, a los costados de la cara
    for (const l of [-1, 1]) {
      const pts = [[l * 0.05, 0.05, 0.055], [l * 0.072, 0.02, 0.04], [l * 0.082, -0.03, 0.022], [l * 0.086, -0.09, 0.012]].map(([x, y, z]) => [x * F.rx / 0.074, y + F.cy, z]);
      piezas.push(pintarPieza(huso(matiz(colPelo, 1.05), pts, [0.007, 0.012, 0.012, 0.006], 10, 8), (c, p, nn) => { c.multiplyScalar(0.86 + 0.24 * sv(-0.5, 0.9, nn.y)); }));
    }
  }
  if (R.rodete) {
    // el rodete: un rollo retorcido, con un mechón que lo cruza
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.0155, 10, 24), color(colPelo));
    deformar(t, (v) => { const a = Math.atan2(v.y, v.x), r = Math.hypot(v.x, v.y), b = Math.atan2(v.z, r - 0.027); const k = 1 + 0.12 * Math.sin(a * 6 + b); v.x = Math.cos(a) * (0.027 + (r - 0.027) * k); v.y = Math.sin(a) * (0.027 + (r - 0.027) * k); v.z *= k; });
    t.position.set(0, F.cy - 0.012, -F.rz - 0.006); t.rotation.set(0.35, 0, 0);
    piezas.push(pintarPieza(t, (c, p, n) => { c.multiplyScalar(0.9 + 0.16 * Math.max(0, Math.sin(Math.atan2(p.y, p.x) * 6 + Math.atan2(p.z, Math.hypot(p.x, p.y) - 0.027)))); c.multiplyScalar(0.86 + 0.2 * sv(-0.6, 0.8, n.y)); }));
    piezas.push(bola(matiz(colPelo, 0.92), [0.024, 0.022, 0.014], [0, F.cy - 0.012, -F.rz - 0.01], [0.35, 0, 0], [12, 9]));
  }
  if (R.coleta) {
    // 3.7.0: la coleta (el pelo atado atrás): la gomita y la cola que cae por la espalda
    const z0 = -F.rz - 0.004, y0 = F.cy - 0.005;
    const cola = huso(colPelo, [[0, y0 + 0.004, z0 + 0.012], [0, y0 - 0.012, z0 - 0.016], [0, y0 - 0.06, z0 - 0.026], [0.004, y0 - 0.12, z0 - 0.018], [0.006, y0 - 0.16, z0 - 0.008]], [0.012, 0.019, 0.017, 0.011, 0.003], 14, 9);
    piezas.push(pintarPieza(cola, (c, p, n) => { c.multiplyScalar(0.88 + 0.14 * Math.max(0, Math.sin(Math.atan2(p.x, p.z - z0) * 5 + p.y * 30))); c.multiplyScalar(0.86 + 0.2 * sv(-0.6, 0.8, n.y)); }));
    const goma = new THREE.Mesh(new THREE.TorusGeometry(0.0125, 0.0035, 6, 14), color('#7a2e26'));
    goma.position.set(0, y0 - 0.006, z0 - 0.01); goma.rotation.set(Math.PI / 2 - 0.5, 0, 0);
    piezas.push(conTela(goma, TELA.punto));
  }
  if (R.trenza) {
    // los chicos, dos trenzas a los costados; las grandes, una por la espalda o dos por delante
    const dos = F.chico || R.dosTrenzas, larga = !F.chico && R.dosTrenzas;
    for (const l of dos ? [-1, 1] : [0]) {
      const x0 = l * (F.rx - 0.006), z0 = l ? -0.026 : -F.rz - 0.004, y0 = F.cy - 0.03;
      let eje;
      if (larga) { const p = R.sobrePoncho ? 0.06 : 0; eje = [[x0, y0 + 0.01, z0], [x0 + l * 0.012, y0 - 0.06, z0 + 0.004 + p * 0.3], [x0 + l * (0.026 + p * 0.3), y0 - 0.13, z0 + 0.05 + p], [x0 + l * (0.03 + p * 0.4), y0 - 0.2, z0 + 0.11 + p * 1.1], [x0 + l * (0.03 + p * 0.4), y0 - 0.29 + p * 0.3, z0 + 0.14 + p * 1.2]]; }
      else if (l) eje = [[x0, y0 + 0.01, z0], [x0 + l * 0.006, y0 - 0.05, z0 + 0.004], [x0 + l * 0.012, y0 - 0.1, z0 + 0.012], [x0 + l * 0.014, y0 - 0.13, z0 + 0.018]];
      else eje = [[0, y0 + 0.012, z0 + 0.004], [0, y0 - 0.05, z0 - 0.012], [0, y0 - 0.13, z0 - 0.024], [0, y0 - 0.21, z0 - 0.02], [0, y0 - 0.26, z0 - 0.012]];
      piezas.push(...trenzaFina(colPelo, eje, l ? [0, 0, 1] : [1, 0, 0], larga ? 0.0105 : l ? 0.0095 : 0.0115, larga ? 9 : l ? 4 : 7));
      const [xf, yf, zf] = eje[eje.length - 1];
      if (F.chico && !larga) {
        // un moño
        for (const s of [-1, 1]) { const m = bola('#c8443a', [0.013, 0.008, 0.005], [xf + s * 0.011, yf, zf + 0.003], [0, l * 0.5, s * 0.35], [8, 6]); m.userData.mono = 1; piezas.push(m); }
        const m = bola('#a8342c', [0.005, 0.005, 0.005], [xf, yf, zf + 0.004], null, [7, 5]); m.userData.mono = 1; piezas.push(m);
      } else {
        // la lana colorada que ata la punta
        const lana = torno('#a8302a', [[0.0065, -0.008], [0.0075, -0.004], [0.0075, 0.004], [0.0065, 0.008]], [xf, yf, zf], null, null, 10);
        lana.userData.tela = TELA.punto; piezas.push(lana);
      }
      // el mechón de la punta
      const pun = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.024, 8, 1), color(colPelo)), (v) => { v.x *= 1 + 0.35 * Math.sin(v.y * 90); });
      pun.position.set(xf, yf - 0.016, zf); pun.rotation.set(Math.PI, 0, 0);
      piezas.push(pun);
    }
  }
  return piezas;
}
// Párpados: un casquete alrededor del ojo con la abertura en almendra (el borde del casquete ES el
// borde del párpado: un anillo exacto, sin los dientes de la grilla). `lat`: 1 el ojo derecho.
const bordesAlmendra = (u, F) => {
  const t = (u + 0.93) / 1.86, q = 1 - (u / 0.93) ** 2;
  const eje = -0.07 + (0.14 + F.rasgado) * t - F.rasgado * 0.5;
  return [eje + F.abre * Math.pow(q, 0.62) * (1 - 0.12 * u), eje - F.abre * 0.66 * Math.pow(q, 0.8) * (1 + 0.1 * u)];
};
function almendra(u, v, F) {
  if (Math.abs(u) >= 0.93) return false;
  const [arriba, abajo] = bordesAlmendra(u, F);
  return v < arriba && v > abajo;
}
function parpados(F, lat, colPiel, colPelo, E) {
  const clave = `parp${lat}${F.clave}${colPiel}${colPelo}`;
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
  // las pestañas: una tira aparte (con sus propias caras), sumada a la misma malla
  const idx2 = Array.from(g.index.array);
  pestanas(F, lat, pos, col, sup, idx2, mezcla(colPelo, '#0e0907', 0.8));
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx2);
  const m = piel(mallaDe(g, colPiel, new Float32Array(col)));
  m.userData.superior = sup;   // cuánto de cada vértice baja con el parpadeo
  return m;
}
// las pestañas de arriba, una tira fina por el borde del párpado (más larga hacia el rabillo, y en
// las mujeres más marcada); dos caras (adelante y atrás), apenas separadas
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
// El ojo en aros (los bordes de la pupila y del iris son aros de vértices repetidos: nítidos), el
// iris de color, más claro abajo, con el anillo oscuro; y un brillo aparte
const IRIS = ['#6b4526', '#7a5a2c', '#4e6a3c', '#4c6c8a', '#5c3b22', '#6a5a36'];
function ojo(F, iris) {
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
  for (const [rb, dd, kk] of [[0.15, new THREE.Vector3(0.34, 0.4, 0.85).normalize(), 1.007], [0.07, new THREE.Vector3(-0.22, -0.26, 0.94).normalize(), 1.006]]) {
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
// El pelo, la barba y el pañuelo salen de la misma forma de la cabeza, inflada: lo que no es pelo se
// esconde adentro del cráneo y esos triángulos se sacan
function casco(F, hex, conRasgos, grosor, oculta, pinta, nAz = 34, nPol = 26, clave = null) {
  if (clave) {
    const g = molde(clave + F.clave, () => casco(F, '#ffffff', conRasgos, grosor, oculta, null, nAz, nPol).geometry);
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
// (3.7.0 (integración): de a partes, ver figuraPasos)
function* armarCabezaPasos(cabeza, F, colores, R, colPiel, marcas) {
  const colPelo = colores.pelo || '#3a2a1e';
  // 3.7.0: el cuello, más fino (se leía grueso, sobre todo de lejos)
  const kc = R.robusto ? 1.04 : F.chico ? 0.82 : F.mujer ? 0.84 : 0.93;
  const cuello = torno(colPiel, [[0.05, -0.13], [0.045, -0.09], [0.04, -0.06], [0.041, -0.03], [0.034, -0.0], [0.02, 0.01]].map(([r, y]) => [r * kc, y]), [0, 0, -0.012], null, [1, 1, 1.06], 14);
  cabeza.add(piel(pintarPieza(cuello, (c, p) => { c.multiplyScalar(1 - 0.14 * sv(-0.08, -0.03, p.y) * sv(-0.02, 0.03, p.z)); })));
  yield;
  cabeza.add(yield* craneoPasos(F, colPiel, marcas));
  yield;
  const ojos = [], parp = [], centros = [];
  const iris = colores.iris || IRIS[Math.floor(hash(colPelo + colPiel + (colores.ropa || '')) * IRIS.length)];
  for (const l of [-1, 1]) {
    const s = superficie(l * F.ex, F.ey, F, false);
    const E = { x: s.x, y: F.ey, z: s.z - F.re * 0.85 };
    const o = new THREE.Group(); o.position.set(E.x, E.y + F.cy, E.z);
    o.add(fino(noTapa(ojo(F, iris))));
    const pp = new THREE.Group(); pp.position.copy(o.position);
    pp.add(noTapa(parpados(F, l, colPiel, colPelo, E)));
    cabeza.add(o); cabeza.add(pp); ojos.push(o); parp.push(pp); centros.push([l, E]);
    // la oreja: chica, con el borde y el hueco
    const oreja = bola(colPiel, [0.0098, 0.023, 0.0145], [l * (F.rx * 0.94), F.cy - 0.014, -0.012], [0, l * 0.3, 0], [10, 7]);
    deformar(oreja, (v) => { if (v.x * l > 0) v.x -= l * 0.5 * Math.exp(-((v.y / 0.6) ** 2 + (v.z / 0.55) ** 2)); });
    cabeza.add(piel(pintarPieza(oreja, (c, p) => { if (p.x * l > -0.2 && Math.abs(p.y) < 0.62 && Math.abs(p.z) < 0.58) tinta(c, mezcla(colPiel, '#8a4038', 0.4), 0.38); tinta(c, mezcla(colPiel, '#d8605a', 0.5), 0.22); })));
    const ox = l * (F.rx * 0.94 + 0.006), oy = F.cy - 0.014, oz = -0.012;
    const borde = [[0.019, 0.006], [0.023, -0.005], [0.016, -0.015], [0.002, -0.018], [-0.012, -0.013], [-0.019, -0.004]].map(([dy, dz]) => [ox, oy + dy, oz + dz]);
    cabeza.add(fino(piel(huso(mezcla(colPiel, '#e08a78', 0.2), borde, [0.0025, 0.0032, 0.0034, 0.0032, 0.003, 0.0036], 8, 5))));
    yield;
  }
  cabeza.userData.ojos = ojos; cabeza.userData.parpados = parp;
  const colCeja = mezcla(colPelo, '#120c08', 0.25);
  const colBarba = colores.barba ? mezcla(colores.barba, '#5e3f28', 0.35) : null;
  const canas = Math.max(0, Math.min(1, R.canas || 0));
  const r = rostro(F, colPiel, colCeja, colBarba, centros, Math.max(0.3, canas));
  yield;
  r.visible = false;   // (se muestra de cerca: ver alPosar)
  cabeza.add(r); cabeza.userData.rostro = r;
  // De lejos, los rasgos quietos (neutral) van fundidos en el cuerpo, en un hueso propio; de cerca
  // ese hueso se achica a nada (adentro de la cabeza) y se dibuja el rostro con gestos. Así lejos
  // cada persona es un solo dibujo.
  const ras = new THREE.Group(); ras.position.set(0, F.cy, -0.03);
  const gf = r.geometry.clone(); gf.morphAttributes = {};
  const fijo = new THREE.Mesh(gf, color('#ffffff')); fijo.position.set(0, -F.cy, 0.03);
  fijo.userData.crudo = 1; fijo.userData.noTapa = 1; fijo.userData.fino = 1;
  ras.add(fijo); cabeza.add(ras); cabeza.userData.rasgos = ras;
  yield;
  for (const p of peloDe(F, colPelo, R, !!colores.gorro)) cabeza.add(p);
  yield;
  if (colBarba) cabeza.add(barba(F, colBarba, colPiel, Math.max(0.3, canas)));
  sombreros(cabeza, F, colores, R);
  cabeza.userData.esCabeza = true;
  cabeza.traverse((o) => { if (o.isMesh && o.userData.tela === undefined && !o.userData.piel) o.userData.tela = 0; });
}
// los gorros, el pañuelo, la plata de la cabeza y los anteojos
function sombreros(cabeza, F, colores, R) {
  const ropa = colores.gorroColor || colores.ropa || '#7a6a5a';
  const antes = cabeza.children.length;
  const kx = F.rx + 0.008, kz = F.rz + 0.008;
  if (colores.gorro === 'boina') {
    const b = torno(ropa, [[1.0, 0.0], [1.14, 0.012], [1.28, 0.03], [1.24, 0.05], [0.96, 0.066], [0.48, 0.074], [0.0, 0.076]], [0.004, F.cy + 0.052, -0.006], [-0.12, 0, -0.14], [kx, 1, kz], 20);
    pintarPieza(b, (c, p) => { c.multiplyScalar(1 + 0.05 * Math.sin(Math.atan2(p.x, p.z) * 30) - 0.12 * sv(0.03, 0.0, p.y)); });
    cabeza.add(b);
    cabeza.add(bola(ropa, [0.009, 0.015, 0.009], [0.012, F.cy + 0.132, -0.014]));
  } else if (colores.gorro === 'sombrero') {
    const fieltro = '#5f4730', cinta = '#3a2d21', y0 = F.cy + 0.07;
    const copa = torno(fieltro, [[1.0, 0.0], [1.0, 0.026], [1.0, 0.03], [1.0, 0.06], [0.94, 0.096], [0.75, 0.11], [0.0, 0.116]], [0, y0, -0.004], null, [kx + 0.002, 1, kz + 0.002], 18);
    deformar(copa, (v) => { if (v.y > 0.09) v.y -= 0.02 * Math.max(0, 1 - Math.abs(v.x) / 0.6); });
    pintarPieza(copa, (c, p) => { if (p.y > -0.002 && p.y < 0.027) c.set(cinta); });
    cabeza.add(copa);
    for (const s of [1, -1]) {
      const ala = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.22, 26, 3), color(s > 0 ? fieltro : matiz(fieltro, 1.25)));   // (3.7.0: el ala de abajo, más clara: a la sombra se leía negra)
      ala.rotation.x = -s * Math.PI / 2;
      deformar(ala, (v) => { const r = Math.hypot(v.x, v.y); if (r > 0.14) v.z += (r - 0.14) * (r - 0.14) * 1.6 * (0.45 + 0.55 * Math.abs(v.x) / r) * s; });
      ala.position.set(0, y0 + 0.002 + (s > 0 ? 0.004 : -0.004), -0.004);
      cabeza.add(ala);
    }
  } else if (colores.gorro === 'gorro') {
    const y0 = F.cy + 0.04;
    const gor = torno(ropa, [[1.0, 0.0], [1.05, 0.026], [1.03, 0.05], [0.86, 0.078], [0.48, 0.094], [0.0, 0.098]], [0, y0, -0.006], [-0.09, 0, 0], [kx, 1, kz], 18);
    pintarPieza(gor, (c, p) => {
      const a = Math.atan2(p.x, p.z);
      c.multiplyScalar(1 - 0.22 * Math.exp(-((Math.sin(a * 3) / 0.08) ** 2)) * sv(0.03, 0.06, p.y));   // las costuras de los gajos
      c.multiplyScalar(1 - 0.1 * sv(0.012, 0.0, p.y));                                                      // la vincha
      c.multiplyScalar(0.86 + 0.18 * sv(0.0, 0.09, p.y));
    });
    cabeza.add(gor);
    cabeza.add(deformar(bola(matiz(ropa, 0.72), [0.072, 0.009, 0.062], [0, y0 + 0.006, kz * 0.86], [-0.2, 0, 0], [16, 6]), (v) => { if (v.z < 0) v.z *= 0.15; }));   // la visera
    cabeza.add(bola(matiz(ropa, 0.8), [0.008, 0.005, 0.008], [0, y0 + 0.096, -0.014]));
  } else if (colores.gorro === 'panuelo') {
    // 3.7.0: el pañuelo atado a la cabeza (Rosa, Malena): la tela pegada al cráneo desde un poco
    // atrás de la frente (se ve el pelo adelante) hasta la nuca, el nudo atrás con sus dos puntas y
    // el triángulo suelto sobre la nuca. Antes era un torno con borde y se leía como un gorro.
    const linea = (x) => F.frente - 0.02 - 4.2 * x * x;
    const oculta = (v) => {
      const ax = Math.abs(v.x);
      const borde = linea(Math.min(ax, 0.06)) - 0.35 * Math.max(0, ax - 0.045);
      const frente = sv(borde - 0.004, borde + 0.004, v.y);
      const atras = sv(-0.048, -0.04, v.y);
      let m = frente + (atras - frente) * sv(0.0, -0.025, v.z);
      m *= 1 - gauss(v.y + 0.01, v.z + 0.008, 0.026, 0.02) * sv(0.05, 0.064, ax);   // la oreja afuera
      return Math.max(0, Math.min(1, m));
    };
    cabeza.add(conTela(casco(F, ropa, false, (v) => 0.0085 + 0.002 * sv(0.0, F.ry, v.y) + 0.0015 * Math.sin(Math.atan2(v.x, v.z) * 5 + v.y * 40), oculta, (c, q, n) => {
      c.multiplyScalar(0.9 + 0.1 * Math.sin(Math.atan2(q.x, q.z) * 6 + q.y * 50));   // los pliegues de la tela
      c.multiplyScalar(0.84 + 0.2 * sv(-0.6, 0.8, n.y));
    }, 34, 26, 'panueloC'), TELA.lunares));
    const zn = -F.rz - 0.016, yn = F.cy - 0.03;
    cabeza.add(bola(matiz(ropa, 0.92), [0.017, 0.014, 0.012], [0, yn, zn], null, [8, 6]));   // el nudo
    for (const l of [-1, 1]) {
      // las puntas del nudo, que caen
      const m = huso(matiz(ropa, 0.95), [[l * 0.006, yn - 0.004, zn - 0.004], [l * 0.014, yn - 0.03, zn - 0.006], [l * 0.02, yn - 0.06, zn + 0.002]], [0.008, 0.012, 0.004], 6, 6);
      deformar(m, (v) => { v.z = zn + (v.z - zn) * 0.4; });
      cabeza.add(m);
    }
    // el triángulo de la tela que queda suelto sobre la nuca
    const tri = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.06, 4, 1), color(matiz(ropa, 0.9))), (v) => { v.z *= 0.18; });
    tri.position.set(0, yn - 0.022, -F.rz - 0.006); tri.rotation.set(Math.PI + 0.22, Math.PI / 4, 0);
    cabeza.add(tri);
  } else if (colores.gorro === 'gorroPunto') {
    // el gorro tejido, con el borde doblado y un pompón
    const y0 = F.cy + 0.03;
    const gp = torno(ropa, [[1.03, 0.0], [1.07, 0.012], [1.07, 0.028], [1.02, 0.032], [0.99, 0.06], [0.84, 0.088], [0.46, 0.104], [0.0, 0.108]], [0, y0, -0.006], [-0.12, 0, 0], [kx, 1, kz], 18);
    pintarPieza(gp, (c, q) => { if (q.y < 0.03) c.multiplyScalar(0.9); });
    cabeza.add(gp);
    cabeza.add(bola(mezcla(ropa, '#e8d8b0', 0.45), [0.019, 0.017, 0.019], [0, y0 + 0.11, -0.02], null, [8, 6]));
  }
  const t = colores.gorro === 'panuelo' ? TELA.lunares : colores.gorro === 'gorroPunto' ? TELA.punto : TELA.fieltro;
  for (let i = antes; i < cabeza.children.length; i++) { const o = cabeza.children[i]; if (o.isMesh && o.userData.tela === undefined) o.userData.tela = t; }
  const plata = '#8e9298', pl = [];
  if (colores.trarilonko) {
    // el trarilonko: la cinta de plata en la frente, con sus colgantes
    const yb = 0.042, fb = Math.sqrt(1 - (yb / F.ry) ** 2) * 1.02;   // (la cabeza se angosta arriba: la cinta la abraza)
    pl.push(torno(plata, [[1.0, -0.004], [1.025, -0.002], [1.025, 0.002], [1.0, 0.004]], [0, F.cy + yb, -0.006], [-0.12, 0, 0], [(F.rx + 0.01) * fb, 1, (F.rz + 0.01) * fb], 26));
    // 3.7.0: los colgantes cuelgan de la cinta (antes eran puntos pegados a la frente): cada uno con
    // su argolla en el borde de la cinta, el eslabón y la plaquita en gota que cae, apenas separada
    // de la piel
    for (let i = -3; i <= 3; i++) {
      const x = i * 0.0115, ytop = yb - 0.0045 - Math.abs(i) * 0.0009, q = superficie(x, ytop - 0.008, F), z = q.z + 0.0032;
      const largo = 0.012 + (i === 0 ? 0.004 : 0) - Math.abs(i) * 0.0008;
      const argolla = new THREE.Mesh(new THREE.TorusGeometry(0.0022, 0.0006, 4, 8), color(plata)); argolla.position.set(x, F.cy + ytop, z - 0.0005); argolla.rotation.y = 0.2 * i;
      pl.push(argolla);
      pl.push(tubo(plata, 0.0004, 0.0004, largo * 0.55, [x, F.cy + ytop - largo * 0.32, z], [-0.08, 0, 0], 4));
      pl.push(deformar(bola(plata, [0.0026, 0.0048, 0.0008], [x, F.cy + ytop - largo * 0.78, z + 0.0008], [-0.12, 0, 0], [7, 5]), (v) => { v.x *= 1 - 0.35 * Math.max(0, v.y); }));
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
  for (const m of pl) { m.userData.tela = TELA.plata; m.userData.fino = 1; cabeza.add(m); }
  if (colores.anteojos) {
    // 3.7.0: los anteojos (la modista, el telegrafista, la maestra, la astrónoma, Ercilia): dos aros
    // finos delante de los ojos, el puente y las patillas hasta las orejas
    const marco = R.marcoAnteojos || '#3a2a1e', yo = F.ey + F.cy + 0.001, ex = Math.abs(superficie(F.ex, F.ey, F, false).x);
    const zo = superficie(F.ex, F.ey, F).z + 0.011;
    for (const l of [-1, 1]) {
      const aro = new THREE.Mesh(new THREE.TorusGeometry(F.re * 1.45, 0.0012, 5, 18), color(marco));
      aro.position.set(l * ex, yo, zo); aro.scale.set(1.08, 0.86, 1); cabeza.add(fino(conTela(aro, 0)));
      cabeza.add(fino(conTela(huso(marco, [[l * (ex + F.re * 1.5), yo + 0.002, zo - 0.002], [l * (F.rx + 0.004), yo + 0.004, zo - 0.04], [l * (F.rx + 0.006), yo - 0.006, -0.012]], [0.0012, 0.0012, 0.0011], 6, 4), 0)));
    }
    cabeza.add(fino(conTela(huso(marco, [[-ex + F.re * 1.4, yo + 0.002, zo], [0, yo + 0.006, zo + 0.004], [ex - F.re * 1.4, yo + 0.002, zo]], [0.0011, 0.0011, 0.0011], 6, 4), 0)));
  }
}

// ---------------------------------------------------------------- ayudas de la ropa
// el borde de una pieza de torno (0 en el borde, 1 a un segmento): para el cuero gastado y el dobladillo
// (los vértices de LatheGeometry van por gajo: i·npts + j)
function bordeTorno(m, npts, segs, lados, abajo, arriba = abajo) {
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
function arremangar(piv, pts, rad, iCorte, manga, colPiel, tramos, lados, telaManga = TELA.lienzo) {
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
    tel[i] = esPiel ? 0 : telaManga; zon[i * 2] = esPiel ? 1 : 0; zon[i * 2 + 1] = 1;
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
  piv.add(conTela(rollo, telaManga));
}
// a cada pieza de ropa, su tela: por el color más parecido de la paleta (la pieza conserva el color
// de base en su material)
function telasPorColor(g, colores, R, bota, pantalon) {
  const lista = [
    [colores.ropa, TELA.lienzo], [colores.abrigo, R.telaChaleco ? TELA[R.telaChaleco] : R.telaCampera ? TELA[R.telaCampera] : TELA.lana], [pantalon, TELA.lana],
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
// 3.7.0: las marcas del oficio en las manos (por vértice): la brea de la botera, la pintura de la pintora
function marcasManos(R) {
  if (R.brea) return (c, p) => { const n = Math.sin(p.x * 310 + p.y * 170) * Math.sin(p.z * 260 - p.y * 90) + 0.3 * Math.sin(p.y * 60); tinta(c, '#1e1812', 0.85 * sv(-0.05, 0.4, n)); };
  if (R.pintura) return (c, p) => {
    const n = Math.sin(p.x * 400 + p.y * 230) * Math.sin(p.z * 330 - p.y * 120);
    if (n > 0.45) tinta(c, ['#3b5a8a', '#c89a38', '#a83a2a'][Math.floor(Math.abs(p.y * 97)) % 3], 0.85);
  };
  return null;
}
// La paleta de tierra, para quien no tiene ropa propia en gente-ropa.js: el tono se corre hacia el
// ocre (unos 30°) y se apaga un poco
const _hsl = { h: 0, s: 0, l: 0 };
function aTierra(hex) {
  if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex;
  const c = new THREE.Color(hex); c.getHSL(_hsl);
  const h = _hsl.h; let d = 0.085 - h; if (d > 0.5) d -= 1; if (d < -0.5) d += 1;
  c.setHSL((h + d * 0.3 + 1) % 1, _hsl.s * 0.72, _hsl.l);
  return `#${c.getHexString()}`;
}

// ---------------------------------------------------------------- el cuerpo
const CODO_MATE = -2.3;
const DIR_MATE = (() => { const c = Math.cos(CODO_MATE), s = Math.sin(CODO_MATE); return new THREE.Vector3(-0.4, -c, -s).normalize(); })();

// 3.7.0 (integración): `figuraPasos` y `continuoPasos` arman de a partes (generadores: cada `yield` es un buen
// lugar para cortar): `armarPersonaDeAPoco` reparte el armado de una persona en varios cuadros, unos pocos ms por
// cuadro (armarla entera costaba 20 a 30 ms en un solo cuadro: el tirón al llegar a la aldea). `figura` y
// `continuo` las corren de una (como antes).
function correr(it) { for (;;) { const r = it.next(); if (r.done) return r.value; } }
function figura(...a) { return correr(figuraPasos(...a)); }
function* figuraPasos(colores, clave, conMate, R, A, talla) {
  const mujer = R.mujer !== undefined ? !!R.mujer : !!(R.pollera || R.trenza || R.rodete);
  const chico = R.chico !== undefined ? !!R.chico : /^aldea-nen[ae]$/.test(clave);
  const C = A.cuerpo || {};
  const g = new THREE.Group();
  const colPiel = colores.piel || R.piel || '#c49a70';
  const ropa = colores.ropa || '#7a6a5a', abrigo = colores.abrigo || '#4a3a30';
  const pantalon = colores.pantalon || R.pantalon || '#3f3a33';
  const bota = R.botaCol || (R.botas === 'goma' ? '#2a2d2c' : R.botas === 'trekking' ? '#5a4632' : '#3b2f26');
  const conPoncho = !!colores.poncho, colPoncho = typeof colores.poncho === 'string' ? colores.poncho : abrigo;
  const manga = R.chaleco ? ropa : abrigo;
  const k = mujer ? 1 : 1.06;         // los varones, un poco más anchos
  // la contextura de cada uno (gente-ropa.js): el ancho del torso, los brazos y las piernas va en la
  // escala de cada grupo (y = 1: los pivotes no cambian)
  const robusto = !!C.robusto;
  const anchoT = [C.ancho ?? (chico ? 0.84 : 1), C.fondo ?? C.ancho ?? (chico ? 0.86 : 1)];
  const anchoB = C.brazos ?? (chico ? 0.84 : 1), anchoP = C.piernas ?? (chico ? 0.84 : 1);
  const hx = (mujer ? 0.166 : 0.18) * anchoT[0];    // el hombro (pivote del brazo)
  // pliegues: la tela que se junta (más oscura en el fondo del pliegue, más clara en el lomo), suaves
  const surcos = (c, s, fuerza = 0.18) => { const f = fuerza * 0.45; c.multiplyScalar(1 - f * Math.max(0, -s) + f * 0.4 * Math.max(0, s)); };

  // ---- piernas (muslo en la cadera, canilla y bota en la rodilla, el pie en el tobillo)
  const altas = R.botas === 'altas' || R.botas === 'goma';
  const RODILLA = 0.37, TOBILLO = -0.39;
  const lx = (mujer ? 0.086 : 0.094) * anchoT[0];
  const perfilMuslo = R.bombacha
    ? [[0.0, -0.49], [0.058, -0.475], [0.083, -0.44], [0.096, -0.3], [0.096, -0.17], [0.088, -0.04], [0.07, 0.06]]
    : [[0.0, -0.47], [0.048, -0.457], [0.06, -0.43], [0.064, -0.39], [0.072 * k, -0.28], [0.081 * k, -0.12], [0.083 * k, 0.0], [0.07, 0.06]];
  const perfilCanilla = (R.bombacha
    ? [[0.05, -0.7], [0.055, -0.6], [0.064, -0.5], [0.08, -0.43], [0.082, -0.38], [0.062, -0.335], [0.0, -0.32]]
    : [[0.047, -0.7], [0.051, -0.62], [0.057 * k, -0.52], [0.06 * k, -0.45], [0.058, -0.37], [0.044, -0.335], [0.0, -0.325]]).map(([r, y]) => [r, y + RODILLA]);
  const perfilBota = (altas
    ? [[0.05, -0.76], [0.057, -0.72], [0.063, -0.6], [0.067, -0.5], [0.072, -0.44], [0.067, -0.435]]
    : [[0.05, -0.76], [0.055, -0.74], [0.059, -0.66], [0.063, -0.62], [0.059, -0.615]]).map(([r, y]) => [r, y + RODILLA]);
  const barroPie = R.barroBotas ? (c) => tinta(c, '#5a4632', 0.55) : null;
  const colPollera = R.colPollera || mezcla(ropa, '#2a2420', 0.35);
  const patas = [];
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(l * lx, 0.82, 0); piv.scale.set(anchoP, 1, anchoP);
    // (3.7.0: con pollera, el muslo es de la tela de la pollera: sentada, la pollera cubre las piernas)
    const muslo = torno(R.pollera ? colPollera : pantalon, perfilMuslo, null, null, [1, 1, 0.92], 12);
    pintarPieza(muslo, (c, p) => { surcos(c, Math.sin(p.y * 70 + p.x * 40) * sv(-0.32, -0.42, p.y), 0.14); c.multiplyScalar(1 - 0.12 * sv(-0.02, 0.05, p.y)); });
    piv.add(muslo);
    const rodilla = new THREE.Group(); rodilla.position.set(0, -RODILLA, 0);
    const canilla = torno(pantalon, perfilCanilla, null, null, [1, 1, 0.92], 12);
    pintarPieza(canilla, (c, p) => { surcos(c, Math.sin(p.y * 90 - p.x * 30) * sv(-0.2, -0.3, p.y), 0.16); });
    rodilla.add(canilla);
    const caña = torno(bota, perfilBota, null, null, null, 12);
    pintarPieza(caña, (c, p) => { if (p.y > (altas ? -0.075 : -0.255)) c.multiplyScalar(0.82); c.multiplyScalar(1 + 0.06 * Math.sin(p.y * 120)); });
    rodilla.add(rol(caña, 'bota', perfilBota.length, 12));
    const tobillo = new THREE.Group(); tobillo.position.set(0, TOBILLO, 0.0);
    const empeine = bola(bota, [0.056, 0.046, 0.122], [0, -0.39 - TOBILLO, 0.05], null, [10, 7]);
    if (barroPie) pintarPieza(empeine, barroPie);
    tobillo.add(empeine);
    tobillo.add(bola(matiz(bota, 0.5), [0.059, 0.017, 0.125], [0, -0.425 - TOBILLO, 0.045], null, [10, 6]));         // la suela
    const yTop = (altas ? -0.435 : -0.615) + RODILLA;
    rodilla.add(conTela(torno(matiz(bota, 1.2), [[altas ? 0.07 : 0.06, yTop - 0.03], [altas ? 0.078 : 0.066, yTop - 0.012], [altas ? 0.075 : 0.064, yTop + 0.004], [altas ? 0.066 : 0.058, yTop + 0.008]], null, null, null, 12), TELA.cuero));
    if (!altas) for (let i = 0; i < 3; i++) for (const s of [-1, 1]) rodilla.add(fino(bola('#2e2216', [0.016, 0.0028, 0.003], [0, yTop - 0.022 - i * 0.017, 0.056 - i * 0.002], [0.25, 0, s * 0.5], [5, 3])));
    if (R.botas === 'trekking') for (let i = 0; i < 3; i++) tobillo.add(fino(bola('#c8b89a', [0.022, 0.0035, 0.005], [0, -0.36 - TOBILLO + i * 0.016, 0.09 - i * 0.012], [0.5, 0, 0])));
    rodilla.add(tobillo); rodilla.userData.tobillo = tobillo;
    piv.add(rodilla); piv.userData.rodilla = rodilla;
    g.add(piv); patas.push(piv);
  }
  yield;

  // ---- torso: cintura y caderas de adulto, pecho, hombros; la ropa de cada uno
  const torso = new THREE.Group(); torso.position.set(0, 0.82, 0); torso.scale.set(anchoT[0], 1, anchoT[1]);
  const pechoK = chico ? 0 : mujer ? 0.17 : 0.07;
  const panza = C.panza ?? 0;   // la panza de buen comer (Anselmo, Pocha)
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
    // la tela se junta en la cintura y bajo los brazos; tirones en diagonal desde el hombro
    surcos(c, Math.sin(p.y * 110 + Math.abs(p.x) * 30) * Math.exp(-(((p.y - 0.17) / 0.05) ** 2)), 0.18);
    surcos(c, Math.sin((p.y + Math.abs(p.x) * 1.4) * 60) * sv(0.08, 0.13, Math.abs(p.x)) * Math.exp(-(((p.y - 0.36) / 0.08) ** 2)), 0.12);
    if (p.z < 0) surcos(c, Math.sin(p.x * 50) * sv(0.2, 0.0, p.y), 0.08);
  };
  if (R.chaleco || R.abierta) {
    const perfilCamisa = [[0.142, -0.02], ...cuerpoAlto.map(([r, y]) => [r - 0.006, y])];
    capaHombro = pintarPieza(capa(ropa, perfilCamisa, 16), (c, p) => {
      arrugasTorso(c, p);
      if (p.z > 0 && Math.abs(p.x) < 0.012 && p.y > 0.05 && p.y < 0.5) c.multiplyScalar(0.9);   // la tapeta de la camisa
    });
    torso.add(rol(capaHombro, 'camisa', perfilCamisa.length, 16));
  }
  if (R.chaleco) {
    const perfilChaleco = R.chamal
      ? [[0.158, -0.06], [0.157, 0.02], [0.148, 0.12], [0.162, 0.24], [0.188, 0.35], [0.192, 0.43], [0.172, 0.478], [0.13, 0.5]]
      : [[0.158, -0.06], [0.157, 0.02], [0.148, 0.12], [0.162, 0.24], [0.188, 0.35], [0.196, 0.43], [0.188, 0.478]];
    torso.add(rol(bordeTorno(conTela(pintarPieza(capa(abrigo, perfilChaleco.map(([r, y]) => [r * (mujer ? 0.92 : 1), y]), 16, R.chamal ? 0 : 0.4, R.chamal ? Math.PI * 2 : Math.PI * 2 - 0.8), (c, p) => {
      arrugasTorso(c, p);
    }), TELA[R.telaChaleco || 'lana']), perfilChaleco.length, 16, !R.chamal, true), 'chaleco', perfilChaleco.length, 16));
    if (R.bombacha) torso.add(rol(capa(R.faja || '#7a2e26', [[0.155, -0.05], [0.161, -0.038], [0.162, 0.028], [0.157, 0.042]], 18), 'faja', 4, 18));
    else torso.add(capa('#4a3626', [[0.16, -0.035], [0.16, 0.02]], 16));
    if (!R.delantal) for (const y of [0.1, 0.2, 0.3]) torso.add(fino(bola('#2a2018', [0.008, 0.008, 0.005], [0.064, y, 0.118 * zPecho(0.064, y) + 0.004])));
  } else {
    const perfilCampera = [...faldon, ...cuerpoAlto], lados = R.campera === 'larga' ? 26 : 18;
    capaHombro = pintarPieza(capa(abrigo, perfilCampera, lados, R.abierta ? 0.3 : 0, R.abierta ? Math.PI * 2 - 0.6 : Math.PI * 2, 0.7, R.campera === 'larga' ? 0.03 : 0), (c, p) => {
      arrugasTorso(c, p);
      if (R.campera === 'larga') surcos(c, Math.sin(Math.atan2(p.x, p.z) * 9 + 0.3) * sv(0.0, -0.2, p.y), 0.16);
    });
    if (R.telaCampera) conTela(capaHombro, TELA[R.telaCampera]);
    torso.add(rol(capaHombro, 'campera', perfilCampera.length, lados));
    torso.add(rol(capa(matiz(abrigo, 0.88), [[0.078, 0.525], [0.08, 0.565], [0.07, 0.58]], 16, 0, Math.PI * 2, 0.95), 'cuello', 3, 16));   // el cuello
    if (!R.campera && !R.pollera && !conPoncho && !R.pechera) {
      // el cinturón con hebilla
      torso.add(capa('#3a2a1e', [[0.152, -0.04], [0.153, -0.005], [0.15, 0.0]], 18));
      torso.add(fino(bola('#b8a070', [0.022, 0.016, 0.006], [0, -0.022, 0.108]))); torso.add(fino(bola('#3a2a1e', [0.014, 0.009, 0.004], [0, -0.022, 0.112])));
    }
  }
  if (!conPoncho && !(colores.bufanda || R.panuelo || R.centimetro) && !R.fiesta) {
    // el cuello de la camisa: dos solapas en punta
    const tela = R.chaleco || R.abierta ? ropa : matiz(abrigo, 0.95);
    torso.add(rol(capa(tela, [[0.066, 0.528], [0.07, 0.548], [0.066, 0.572], [0.06, 0.578]], 16, 0.35, Math.PI * 2 - 0.7, 0.98), 'cuello', 4, 16));
    for (const l of [-1, 1]) torso.add(bola(tela, [0.015, 0.021, 0.003], [l * 0.027, 0.535, 0.066], [0.55, l * 0.3, l * 0.7]));
  }
  if (R.pollera) {
    const perfilPollera = [[0.24, -0.52], [0.227, -0.42], [0.198, -0.24], [0.174, -0.08], [0.162, 0.02], [0.146, 0.1], [0.132, 0.18], [0.129, 0.21]];
    if (R.chamal) perfilPollera.splice(0, 1, [0.262, -0.71], [0.25, -0.6], [0.238, -0.5]);   // el chamal, hasta los tobillos
    torso.add(rol(bordeTorno(pintarPieza(capa(colPollera, perfilPollera, 36, 0, Math.PI * 2, 0.78, 0.045), (c, p) => {
      surcos(c, Math.sin(Math.atan2(p.x, p.z) * 9 + 0.3) * sv(0.1, -0.3, p.y), 0.3);
      if (p.y < perfilPollera[0][1] + 0.04) c.multiplyScalar(0.84);  // el ruedo
      if (p.y > 0.17) c.multiplyScalar(0.9);                         // la pretina
    }), perfilPollera.length, 36, false, true), 'pollera', perfilPollera.length, 36));
  }
  if (R.pechera) {
    // 3.7.0: el pantalón con pechera (la botera): el peto sobre el pecho y los dos tiradores
    const perfil = [[0.158, -0.02], [0.152, 0.08], [0.148, 0.18], [0.16, 0.28], [0.172, 0.36]];
    torso.add(rol(bordeTorno(conTela(capa(R.pechera, perfil, 10, -0.62, 1.24, 0.72), TELA.lienzo), perfil.length, 10, true, true), 'pechera', perfil.length, 10));
    for (const l of [-1, 1]) {
      const pts = [[l * 0.07, 0.355, 0.13], [l * 0.1, 0.47, 0.1], [l * 0.11, 0.53, 0.0], [l * 0.1, 0.46, -0.11], [l * 0.06, 0.3, -0.125]];
      torso.add(conTela(huso(R.pechera, pts, [0.014, 0.014, 0.014, 0.014, 0.014], 10, 4), TELA.lienzo));
      torso.add(fino(bola('#b8a070', [0.009, 0.009, 0.004], [l * 0.07, 0.35, 0.136])));
    }
  }
  if (R.delantal && !conPoncho) {   // (3.7.0: con poncho, el delantal no: asomaba por el pecho)
    let perfil = R.pollera
      ? [[0.245, -0.4], [0.226, -0.28], [0.198, -0.14], [0.178, -0.04], [0.166, 0.04], [0.158, 0.12], [0.168, 0.24], [0.188, 0.36]]
      : [[0.186, -0.4], [0.178, -0.2], [0.166, -0.04], [0.162, 0.04], [0.158, 0.12], [0.168, 0.24], [0.19, 0.36]];
    torso.add(rol(bordeTorno(conTela(pintarPieza(capa(R.delantal, perfil.map(([r, y]) => [r * (mujer ? 1 : 1.03), y]), 14, -0.68, 1.36, R.pollera ? 0.79 : 0.72), (c, p) => {
      surcos(c, Math.sin(p.x * 70 + 0.5) * sv(0.05, -0.3, p.y), 0.14);
      if (p.y < -0.37) c.multiplyScalar(0.88);
      if (p.y > -0.2 && p.y < -0.08 && Math.abs(p.x - 0.06) < 0.05) c.multiplyScalar(0.92);    // el bolsillo
      if (Math.abs(p.y + 0.08) < 0.004 && Math.abs(p.x - 0.06) < 0.05) c.multiplyScalar(0.75);
    }), TELA[R.telaDelantal || 'lienzo']), perfil.length, 14, true, true), 'delantal', perfil.length, 14));
    // la tira a la cintura y el moño atrás
    if (!conPoncho) {
      torso.add(capa(matiz(R.delantal, 0.9), [[0.137, 0.17], [0.138, 0.19]], 18));
      for (const l of [-1, 1]) torso.add(bola(matiz(R.delantal, 0.92), [0.03, 0.016, 0.01], [l * 0.025, 0.18, -0.1], [0, 0, l * 0.4]));
      for (const l of [-1, 1]) torso.add(bola(matiz(R.delantal, 0.88), [0.008, 0.06, 0.006], [l * 0.012, 0.12, -0.103], [0.1, 0, l * 0.15]));
    }
  }
  if (R.bolsillos) for (const l of [-1, 1]) {
    torso.add(bola(matiz(abrigo, 0.88), [0.034, 0.032, 0.004], [l * 0.072, 0.325, 0.128], [-0.1, l * 0.36, 0]));
    torso.add(bola(matiz(abrigo, 0.74), [0.037, 0.011, 0.006], [l * 0.073, 0.36, 0.128], [-0.1, l * 0.36, 0]));
  }
  if (R.botones) for (const l of [-1, 1]) for (const y of [0.16, 0.27, 0.38]) torso.add(fino(bola(R.botones, [0.01, 0.01, 0.007], [l * 0.045, y, 0.112 * zPecho(0.045, y) + 0.002])));
  if (!R.botones && !R.chaleco && !R.abierta && !R.delantal && !conPoncho && !R.pechera) for (const y of [0.1, 0.2, 0.3, 0.4]) torso.add(fino(bola(matiz(abrigo, 0.6), [0.0065, 0.0065, 0.004], [0, y, 0.1 * zPecho(0, y) + 0.002])));
  // el cuello de la ropa, por arriba del poncho o de la campera (para la bufanda)
  let yCuello = 0.548, rCuello = 0.07, pechoBuf = 0.142 + (mujer ? 0.012 : 0);
  if (conPoncho) {
    const claroP = mezcla(colPoncho, '#e3d6b8', 0.7), oscuroP = matiz(colPoncho, 0.55), listaP = matiz(colPoncho, 0.78);
    const conGuarda = !!(A.guardas && A.guardas.poncho);
    const caida = (v) => {
      const r = Math.hypot(v.x, v.z), cz = r > 1e-4 ? v.z / r : 0, fi = Math.atan2(v.x, v.z);
      const pl = 1 + 0.04 * Math.sin(fi * 7 + 0.4) * Math.min(1, Math.max(0, (0.36 - v.y) / 0.45));
      v.x *= pl; v.z *= pl;
      if (v.y < 0.12) v.y -= 0.075 * cz * cz * Math.min(1, (0.12 - v.y) / 0.25);
      v.z *= 0.7;   // (3.7.0: un poco más de vuelo adelante: las manos no asoman por el poncho)
    };
    const sx = hx / 0.225 * 1.05;
    const perfilP = [[0.35, -0.18], [0.348, -0.15], [0.347, -0.146], [0.345, -0.12], [0.344, -0.116], [0.342, -0.09], [0.341, -0.086],
      [0.335, 0.05], [0.325, 0.2], [0.31, 0.33], [0.29, 0.43], [0.255, 0.49], [0.2, 0.53], [0.14, 0.56], [0.09, 0.582], [0.074, 0.596]].map(([r, y]) => [r * (y < 0.53 ? sx : 1), y]);
    const p = torno(colPoncho, perfilP, null, null, null, 30);
    pintarPieza(p, (c, v, nn, i) => {
      // con guarda de telar (el atlas) quedan sólo las listas del tejido; si no, las franjas de siempre
      if (!conGuarda && v.y >= -0.1465 && v.y <= -0.1195) c.set(claroP);
      else if (!conGuarda && v.y >= -0.1165 && v.y <= -0.0895) c.set(oscuroP);
      else if (Math.floor(i / perfilP.length) % 7 === 3) c.set(listaP);
    });
    torso.add(rol(conTela(deformar(p, caida), TELA.lana), 'poncho', perfilP.length, 30));
    const flecos = torno(colPoncho, [[0.352 * sx, -0.215], [0.35 * sx, -0.178]], null, null, null, 56);
    pintarPieza(flecos, (c, v, nn, i) => { c.multiplyScalar(Math.floor(i / 2) % 2 ? 0.6 : 1.08); });
    torso.add(conTela(deformar(flecos, caida), TELA.lana));
    torso.add(conTela(torno(matiz(colPoncho, 0.8), [[0.08, 0.578], [0.077, 0.605], [0.066, 0.612]], null, null, null, 14), TELA.lana));
    yCuello = 0.6; rCuello = 0.078; pechoBuf = 0.2;
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
  } else if (R.faja && !R.bombacha && !conPoncho) {
    // la faja tejida a la cintura (la tejedora, sobre el chamal)
    const yf = R.pollera ? 0.15 : 0.0, perfilFaja = [[0.15, yf - 0.045], [0.155, yf - 0.035], [0.156, yf + 0.035], [0.151, yf + 0.045]];
    torso.add(rol(capa(R.faja, perfilFaja, 24), 'faja', perfilFaja.length, 24));
  }
  if (!conPoncho && !R.fiesta && !R.pechera) {
    const yc = R.pollera ? 0.19 : 0.005, rc = R.pollera ? 0.152 : R.chaleco ? 0.166 : 0.158, cuero = '#4e3420';
    torso.add(conTela(capa(cuero, [[rc - 0.002, yc - 0.013], [rc + 0.002, yc - 0.008], [rc + 0.002, yc + 0.008], [rc - 0.002, yc + 0.013]], 20), TELA.cuero));
    const zf = rc * 0.75 * zPecho(0, yc) + 0.004;
    // la hebilla: adelante, o al costado si hay delantal
    const ah = R.delantal ? 1.15 : 0, hx0 = Math.sin(ah) * rc * 1.02, hz0 = Math.cos(ah) * (R.delantal ? rc * 0.8 : zf);
    torso.add(fino(conTela(torno('#a08a58', [[0.014, -0.012], [0.016, 0], [0.014, 0.012]], [hx0, yc, hz0], [Math.PI / 2, 0, -ah], [1, 0.25, 1], 8), 0)));
    torso.add(fino(bola('#3a2616', [0.008, 0.007, 0.004], [hx0 + Math.sin(ah) * 0.004, yc, hz0 + Math.cos(ah) * 0.004], [0, ah, 0])));
    // la bolsita, colgada a la izquierda
    const bx = -rc * 0.86, bz = rc * 0.32;
    torso.add(conTela(bola('#7a5434', [0.03, 0.03, 0.016], [bx - 0.01, yc - 0.058, bz], [0, -0.5, 0.08], [8, 6]), TELA.cuero));   // la bolsa
    torso.add(conTela(bola('#684628', [0.014, 0.012, 0.009], [bx - 0.01, yc - 0.026, bz], [0, -0.5, 0], [7, 5]), TELA.cuero));    // el cuello atado
    torso.add(fino(bola('#c8b088', [0.017, 0.003, 0.011], [bx - 0.01, yc - 0.031, bz], [0, -0.5, 0], [7, 3])));                 // el cordón
    torso.add(conTela(bola(cuero, [0.004, 0.024, 0.003], [bx - 0.012, yc - 0.015, bz - 0.006], [0, -0.5, 0]), TELA.cuero));
  }
  yield;
  const cuello = colores.bufanda || R.panuelo;
  if (cuello) {
    // (3.7.0: la bufanda también sobre el poncho, en invierno)
    const soloPanuelo = R.panuelo && !colores.bufanda;
    const vuelta = new THREE.Mesh(new THREE.TorusGeometry(rCuello, soloPanuelo ? 0.011 : 0.027, 8, 22), color(cuello));
    vuelta.position.set(0, yCuello, 0.008); vuelta.rotation.set(Math.PI / 2 - 0.16, 0, 0); vuelta.scale.set(1, 0.9, soloPanuelo ? 0.6 : 1);
    pintarPieza(vuelta, (c, p) => { c.multiplyScalar(1 + 0.1 * Math.sin(Math.atan2(p.y, p.x) * 18)); });
    torso.add(conTela(vuelta, colores.bufanda ? TELA.punto : TELA.lienzo));
    if (R.panuelo && !colores.bufanda) {
      torso.add(conTela(bola(cuello, [0.02, 0.017, 0.015], [0, yCuello - 0.033, 0.112]), TELA.lienzo));
      for (const l of [-1, 1]) {
        const punta = deformar(new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.07, 3, 1), color(matiz(cuello, 0.92))), (v) => { v.z *= 0.3; });
        punta.position.set(l * 0.011, yCuello - 0.068, 0.118); punta.rotation.set(Math.PI - 0.32, 0, -l * 0.28); torso.add(conTela(punta, TELA.lienzo));
      }
    } else {
      const v2 = new THREE.Mesh(new THREE.TorusGeometry(rCuello - 0.003, 0.023, 8, 22), color(matiz(cuello, 0.93)));
      v2.position.set(0, yCuello - 0.028, 0.012); v2.rotation.set(Math.PI / 2 - 0.1, 0.12, 0);
      torso.add(conTela(v2, TELA.punto));
      for (const pz of puntasBufanda(cuello, { x: -0.088, y: yCuello - 0.036, pecho: pechoBuf, largo: conPoncho ? 0.14 : 0.16 })) torso.add(conTela(pz, TELA.punto));
    }
  }
  if (R.centimetro && !conPoncho) {
    // 3.7.0: el centímetro de la modista, colgado al cuello: una cinta amarilla, chata, que cae a los dos lados
    for (const l of [-1, 1]) {
      const pts = [[l * 0.05, 0.56, -0.02], [l * 0.066, 0.545, 0.06], [l * 0.07, 0.5, 0.118], [l * 0.072, 0.4, 0.15], [l * 0.07 - l * 0.004, 0.3, 0.15]];
      const cinta = huso('#d8c050', pts, [0.0075, 0.0075, 0.0075, 0.0075, 0.0075], 14, 4);
      deformar(cinta, (v) => { if (v.y < 0.52) v.z = 0.118 + (v.z - 0.118) * 0.25 + (v.y < 0.45 ? 0.032 * sv(0.45, 0.35, v.y) : 0); });
      torso.add(pintarPieza(cinta, (c, p) => { if (Math.floor(p.y * 400) % 4 === 0) c.multiplyScalar(0.55); }));
    }
  }
  if (R.camara && !conPoncho) {
    // 3.7.0: la cámara de la fotógrafa, colgada al pecho: la correa por detrás del cuello, el cuerpo y el lente
    for (const l of [-1, 1]) torso.add(conTela(huso('#3a2a1e', [[l * 0.045, 0.555, -0.03], [l * 0.075, 0.52, 0.07], [l * 0.06, 0.4, 0.15], [l * 0.04, 0.33, 0.165]], [0.006, 0.006, 0.006, 0.006], 8, 4), TELA.cuero));
    const cam = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.065, 0.045), color('#2a2622')); cam.position.set(0, 0.31, 0.175);
    torso.add(conTela(cam, TELA.cuero));
    torso.add(tubo('#3a3a38', 0.022, 0.024, 0.04, [0.004, 0.304, 0.215], [Math.PI / 2, 0, 0], 12, true));
    torso.add(fino(tubo('#9a9a96', 0.0245, 0.0245, 0.006, [0.004, 0.304, 0.236], [Math.PI / 2, 0, 0], 12, true)));
    torso.add(fino(bola('#9a9a96', [0.009, 0.004, 0.009], [0.034, 0.345, 0.17])));
  }
  if (R.soga && !conPoncho) {
    // 3.7.0: la soga de la andinista, en rollo, cruzada del hombro derecho a la cadera izquierda
    const soga = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.017, 6, 32), color('#b8963e'));
    soga.position.set(0, 0.3, 0.004); soga.rotation.set(Math.PI / 2, 0.66, 0); soga.scale.set(1.0, 0.82, 1);
    pintarPieza(soga, (c, p) => { c.multiplyScalar(0.85 + 0.25 * Math.max(0, Math.sin(Math.atan2(p.y, p.x) * 60 + Math.atan2(p.z, Math.hypot(p.x, p.y) - 0.2) * 2))); });
    torso.add(conTela(soga, TELA.punto));
  }

  yield;
  // ---- brazos: hombro, codo (grupo propio: hueso), muñeca y mano con dedos
  const brazos = [];
  let muneca = null;
  const kb = mujer ? 1 : 1.1;
  const marcaMano = marcasManos(R);
  const telaManga = R.chaleco ? TELA.lienzo : R.telaCampera ? TELA[R.telaCampera] : TELA.lana;
  // (3.7.0: con guantes, la mano es de lana)
  const colMano = R.guantes || colPiel, deMano = (m) => (R.guantes ? conTela(m, TELA.punto) : piel(m));
  const manoCon5 = (grupo, W, l) => {
    // la palma (de canto, mirando al muslo), cuatro dedos un poco curvos y el pulgar adelante
    const palma = deMano(bola(colMano, [0.015 * kb, 0.043 * kb, 0.029 * kb], [W[0] - l * 0.002, W[1] - 0.045, W[2] + 0.003], [0.05, 0, 0], [9, 7]));
    if (marcaMano) pintarPieza(palma, marcaMano);
    grupo.add(palma);
    const dedos = [[0.016, 0.041], [0.0055, 0.046], [-0.005, 0.044], [-0.015, 0.037]];
    const kd = 1.25, curva = 2.1;
    for (const [dz, L] of dedos) {
      const y0 = W[1] - 0.078 * kb, z0 = W[2] + dz * kb, Lk = L * kb;
      const pts = [[W[0] - l * 0.001, y0 + 0.006, z0], [W[0] - l * 0.003 * curva, y0 - Lk * 0.45, z0 + 0.004], [W[0] - l * 0.011 * curva, y0 - Lk * 0.85, z0 + 0.003], [W[0] - l * 0.017 * curva, y0 - Lk, z0 + 0.001]];
      const d = huso(colMano, pts, [0.0064 * kb * kd, 0.0058 * kb * kd, 0.0052 * kb * kd, 0.0047 * kb * kd], 4, 5);
      grupo.add(fino(deMano(pintarPieza(d, (c, p) => { if (!R.guantes) tinta(c, mezcla(colPiel, '#c4544a', 0.4), 0.25 * sv(y0 - Lk * 0.6, y0 - Lk, p.y)); if (marcaMano) marcaMano(c, p); }))));
    }
    grupo.add(fino(deMano(huso(colMano, [[W[0] - l * 0.006, W[1] - 0.03, W[2] + 0.02], [W[0] - l * 0.012, W[1] - 0.055, W[2] + 0.029], [W[0] - l * 0.012, W[1] - 0.077, W[2] + 0.03]], [0.0095 * kb, 0.0068 * kb, 0.0055 * kb], 4, 5))));
  };
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(l * hx, 1.3, 0); piv.scale.set(anchoB, 1, anchoB);
    const codo = new THREE.Group(); codo.position.set(l * 0.004, -0.27, 0.004);
    const arrugaManga = (c, p) => { surcos(c, Math.sin(p.y * 160) * Math.exp(-(((p.y + 0.27) / 0.035) ** 2)), 0.2); };
    let conCodo = true;
    const remango = R.arremangado && !conPoncho;
    if (conMate && l === 1) {
      conCodo = false;
      const codoP = [l * 0.012, -0.28, 0.0], D = DIR_MATE;
      const en = (t) => [codoP[0] + D.x * t, codoP[1] + D.y * t, codoP[2] + D.z * t];
      const W = en(0.25);
      const brazo = conPoncho
        ? [[[codoP[0], -0.24, 0.0], codoP, en(0.06), en(0.15), W], [0.042, 0.045, 0.044, 0.042, 0.036]]
        : [[[-l * 0.035, 0.012, 0], [-l * 0.012, -0.02, 0], [l * 0.002, -0.1, 0.0], [codoP[0], -0.235, 0.0], codoP, en(0.05), en(0.14), W],
          [0.032, 0.046 * kb, 0.043 * kb, 0.038 * kb, 0.036 * kb, 0.036 * kb, 0.033 * kb, 0.028]];
      if (remango) { arremangar(piv, brazo[0], brazo[1], 3, manga, colPiel, 14, 10, telaManga); piv.add(piel(bola(colPiel, [0.022, 0.022, 0.022], W, null, [8, 6]))); }
      else {
        const tramos = conPoncho ? 12 : 14;
        piv.add(rol(pintarPieza(huso(manga, brazo[0], brazo[1], tramos, 10), arrugaManga), 'manga', tramos, 10));
        const puno = torno(matiz(manga, 0.82), [[0.031, -0.02], [0.034, -0.004], [0.033, 0.016], [0.029, 0.02]], W, null, null, 12);
        puno.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), D);
        piv.add(rol(puno, 'puno', 4, 12));
      }
      muneca = new THREE.Group(); muneca.position.set(W[0], W[1], W[2]);
      const MC = [-0.045, 0.035, 0.03], en2 = (a, b, c) => [MC[0] + a, MC[1] + b, MC[2] + c];
      const mano = [
        deMano(bola(colMano, [0.02, 0.04, 0.031], [0.01, 0.02, 0.016], [0.35, 0, -0.25])),
        deMano(bola(colMano, [0.02, 0.028, 0.046], en2(0.02, -0.011, 0.037), [0, -0.75, 0])),
        deMano(bola(colMano, [0.011, 0.028, 0.013], en2(0.018, 0.011, -0.042), [0.3, 0, 0.5])),
      ];
      for (const m of mano) { if (marcaMano) pintarPieza(m, marcaMano); muneca.add(m); }
      for (const m of [
        torno('#6b4a2c', [[0.0, -0.055], [0.04, -0.05], [0.058, -0.015], [0.056, 0.025], [0.045, 0.05], [0.042, 0.058]], MC, null, null, 14),
        torno('#b8b2a4', [[0.042, 0.056], [0.045, 0.06], [0.045, 0.072], [0.041, 0.074]], MC, null, null, 14),
        bola('#3b4a2a', [0.04, 0.008, 0.04], en2(0, 0.064, 0)),
        tubo('#b9b2a0', 0.006, 0.006, 0.16, en2(0.02, 0.11, 0.01), [0.25, 0, 0.2], 6, true),
      ]) { m.userData.mate = 1; muneca.add(m); }
      piv.add(muneca); piv.userData.muneca = muneca;
    } else {
      const W = [l * 0.012, -0.49, 0.03];
      const pts = conPoncho
        ? [[l * 0.006, -0.26, 0.004], [l * 0.008, -0.32, 0.01], [l * 0.01, -0.42, 0.02], W]
        : [[-l * 0.035, 0.012, 0], [-l * 0.012, -0.02, 0], [0, -0.06, 0], [l * 0.002, -0.14, 0.0], [l * 0.004, -0.25, 0.004], [l * 0.006, -0.29, 0.008], [l * 0.008, -0.37, 0.018], W];
      const rad = conPoncho ? [0.038, 0.037, 0.034, 0.028] : [0.032, 0.046 * kb, 0.045 * kb, 0.041 * kb, 0.035 * kb, 0.034 * kb, 0.034 * kb, 0.027];
      const colManga = manga;
      if (remango) { arremangar(piv, pts, rad, 4, manga, colPiel, 14, 10, telaManga); const Wm = [W[0] - codo.position.x, W[1] - codo.position.y, W[2] - codo.position.z]; codo.add(piel(bola(colPiel, [0.023 * kb, 0.03, 0.02 * kb], [Wm[0], Wm[1] + 0.006, Wm[2]], null, [8, 6]))); }
      else piv.add(rol(pintarPieza(huso(colManga, pts, rad, conPoncho ? 10 : 14, 10), arrugaManga), 'manga', conPoncho ? 10 : 14, 10));
      // el puño y la mano, en el codo (así el antebrazo dobla)
      const Wc = [W[0] - codo.position.x, W[1] - codo.position.y, W[2] - codo.position.z];
      if (!remango) {
        const puno = torno(matiz(colManga, 0.82), [[0.03, -0.02], [0.033, -0.004], [0.032, 0.016], [0.028, 0.02]], [Wc[0], Wc[1] - 0.004, Wc[2]], [-0.1, 0, 0], null, 12);
        pintarPieza(puno, (c, p) => { if (Math.abs(p.y) < 0.003) c.multiplyScalar(0.8); });
        codo.add(rol(puno, 'puno', 4, 12));
        codo.add(fino(bola('#d8d0c0', [0.004, 0.004, 0.003], [Wc[0] + l * 0.03, Wc[1] + 0.004, Wc[2] + 0.004])));
      }
      manoCon5(codo, Wc, l);
      piv.add(codo);
    }
    const ante = new THREE.Group(); ante.position.set(0, -0.28, 0);
    piv.add(ante);
    piv.userData.ante = ante; piv.userData.codo = conCodo ? codo : null;
    g.add(piv); brazos.push(piv);
    yield;
  }
  g.add(torso);

  // ---- cabeza
  const cabeza = new THREE.Group(); cabeza.position.set(0, 1.46, 0);
  const F = medidas(mujer, chico, A.cara || {});
  const cara = A.cara || {};
  const marcas = (cara.pecas || R.pecas ? MARCA_CARA.pecas : 0) + (cara.arrugas === 'risa' ? MARCA_CARA.risa : 0) + (cara.arrugas === 'mayor' ? MARCA_CARA.risa + MARCA_CARA.mayor : 0)
    + (cara.cicatriz ? MARCA_CARA.cicatriz : 0) + (cara.ojeras ? MARCA_CARA.ojeras : 0);
  yield* armarCabezaPasos(cabeza, F, { ...colores, iris: cara.iris || null }, conPoncho ? { ...R, sobrePoncho: true } : R, colPiel, marcas);
  yield;
  // la cabeza apenas grande (estilo Sims Medieval); los chicos, la de un chico de su edad (cuanto más
  // chico, más grande la cabeza para el cuerpo)
  const t = Number.isFinite(talla) && talla > 0.3 && talla < 1 ? talla : 0.76;
  cabeza.scale.setScalar(chico ? 1.2 * Math.pow(0.76 / t, 0.35) : 1.05);
  telasPorColor(g, colores, R, bota, pantalon);
  guardasDe(g, A.guardas || {});
  g.add(cabeza);
  const escala = (mujer || chico ? 1 : 1.07) * (Number.isFinite(C.alto) ? C.alto : 1);
  return { g, cabeza, torso, patas, brazos, muneca, mujer, chico, escala, conPoncho, F };
}

// ---------------------------------------------------------------- piel por huesos
// El three del juego no trae SkinnedMesh: una malla con `isSkinnedMesh` y un esqueleto mínimo (lo que
// el dibujante usa: update() y boneTexture). Los huesos son los grupos de la figura. Los huesos de
// todos van en una textura compartida (por páginas de 170 personas): una sola subida por cuadro en vez
// de una por persona. Cada persona tiene su tramo; el índice de hueso de sus vértices ya viene corrido
// (`base`). 3.7.0: el tramo de quien se va (soltarPersona) queda libre para el que llega.
const HUESOS_POR_PERSONA = 24, LADO_PAGINA = 128, CAP_PAGINA = ((LADO_PAGINA * LADO_PAGINA) / 4 / HUESOS_POR_PERSONA) | 0;
const paginas = [];
function lugarHuesos() {
  for (const p of paginas) if (p.libres.length) return { pagina: p, base: p.libres.pop() * HUESOS_POR_PERSONA };
  for (const p of paginas) if (p.usados < CAP_PAGINA) return { pagina: p, base: p.usados++ * HUESOS_POR_PERSONA };
  const matrices = new Float32Array(LADO_PAGINA * LADO_PAGINA * 4);
  const tex = new THREE.DataTexture(matrices, LADO_PAGINA, LADO_PAGINA, THREE.RGBAFormat, 1015 /* FloatType */);
  tex.needsUpdate = true;
  const p = { matrices, tex, usados: 1, libres: [] };
  paginas.push(p);
  return { pagina: p, base: 0 };
}
function soltarHuesos(lugar) {
  if (!lugar || lugar.suelto) return;
  lugar.suelto = true;
  lugar.pagina.libres.push(lugar.base / HUESOS_POR_PERSONA);
}
// (para las pruebas y el diagnóstico: cuántos tramos hay ocupados)
export function huesosEnUso() { return paginas.reduce((s, p) => s + p.usados - p.libres.length, 0); }
class Esqueleto {
  constructor(huesos, malla, lugar) {
    this.huesos = huesos; this.malla = malla; this.lugar = lugar;
    const inv = new THREE.Matrix4().copy(malla.matrixWorld).invert();
    this.inversas = huesos.map((h) => new THREE.Matrix4().multiplyMatrices(inv, h.matrixWorld).invert());
    this.boneMatrices = lugar.pagina.matrices; this.boneTexture = lugar.pagina.tex; this.base = lugar.base;
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
  dispose() { soltarHuesos(this.lugar); }
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

// ---------------------------------------------------------------- los materiales
// La piel tibia (la luz se cuela en el borde de la sombra), la oclusión en la luz del cielo y un toque
// de calor en la piel a la sombra. `zona` = (piel, oclusión).
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
  MAT_PIEL.customProgramCacheKey = () => 'gente-piel-370';
  return MAT_PIEL;
}
// El atlas: las telas (en la posición de reposo: la tela no "nada" al moverse), las guardas a lo largo
// de los bordes (`aGuarda` = tipo, distancia al borde, largo a lo largo del borde, ancho de la
// guarda; en metros), la cara pintada (rubor, párpados, pecas, arrugas, cicatriz, la pincelada), los
// labios, las cejas, las hebras del pelo (con canas) y la plata (con un brillo suave). De lejos (más de
// ~6 mm por píxel) no se lee el detalle de las telas: sólo la pincelada, las guardas (con su mipmap) y la
// mugre.
const GLSL_COMUN = /* glsl */`
  uniform sampler2D uAtlas; varying vec3 vTela; varying vec3 vPosT; varying vec3 vNorT; varying vec4 vGuarda; float brilloT = 0.0;
  float hT(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float nT(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hT(i), hT(i + vec2(1.0, 0.0)), f.x), mix(hT(i + vec2(0.0, 1.0)), hT(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fwT(vec2 g) { return max(fwidth(g.x), fwidth(g.y)); }
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
const GLSL_COLOR = /* glsl */`
  {
    float tipo = floor(vTela.x + 0.5);
    float frac = clamp((vTela.x - tipo) / 0.4, 0.0, 1.0);   // el borde (las telas) o cuántas canas (el pelo)
    float px = max(length(dFdx(vPosT)), length(dFdy(vPosT)));
    bool cerca = px < 0.006;
    bool esPiel = vZona.x > 0.5;
    vec3 alb = diffuseColor.rgb;
    if (tipo > 0.5 || vGuarda.x > 0.5 || esPiel) {
      vec3 an = abs(normalize(vNorT));
      vec2 uvp = an.y > 0.75 ? vPosT.xz : (an.x > an.z ? vPosT.zy : vPosT.xy);
      bool pelo = abs(tipo - 6.0) < 0.5 || abs(tipo - 8.0) < 0.5 || abs(tipo - 17.0) < 0.5;
      bool cara = tipo > 19.5 && tipo < 51.5, plata = abs(tipo - 12.0) < 0.5;
      bool labio = abs(tipo - 13.0) < 0.5, ceja = abs(tipo - 14.0) < 0.5;
      bool tela = tipo > 0.5 && !(pelo || cara || plata || labio || ceja);
      float det = 1.0;
      float pin = nT(vec2(uvp.x * 5.0 + 1.7 * nT(uvp * 1.3), uvp.y * 2.2)) * 0.65 + nT(uvp * 13.0 + 7.3) * 0.35;
      if (tela) {
        alb *= mix(vec3(0.88, 0.9, 0.96), vec3(1.07, 1.03, 0.94), pin);
        bool lunares = abs(tipo - 16.0) < 0.5;
        float k = tipo < 1.5 ? 0.0 : (tipo < 2.5 || abs(tipo - 7.0) < 0.5 || lunares) ? 1.0 : tipo < 3.5 ? 2.0 : tipo < 4.5 ? 3.0 : tipo < 5.5 ? 4.0 : 7.0;
        if (lunares) {   // el pañuelo estampado, con lunares claros (así se lee como tela y no como gorro)
          vec2 c = uvp / 0.022, id = floor(c);
          float d = length(fract(c) - 0.5 - (vec2(hT(id), hT(id + 2.3)) - 0.5) * 0.2);
          alb = mix(alb, vec3(0.86, 0.8, 0.68), (1.0 - smoothstep(0.15, 0.2, d)) * (1.0 - smoothstep(0.3, 0.8, fwT(c))));
        }
        float esc = k < 0.5 ? 0.045 : k < 1.5 ? 0.03 : k < 2.5 ? 0.14 : k < 3.5 ? 0.045 : k < 4.5 ? 0.09 : 0.025;
        float con = abs(k - 2.0) < 0.5 ? 0.7 : 1.4;   // (el cuero, más parejo)
        if (cerca) det = 1.0 - 0.5 * con + con * cuadroA(vec2(k * 256.0, 0.0), vec2(256.0), uvp / esc).r;
        if (abs(tipo - 7.0) < 0.5) {   // la harina
          float h = smoothstep(0.42, 0.7, nT(uvp * 6.0 + 2.0)) * (0.5 + 0.5 * nT(uvp * 40.0)) * smoothstep(0.55, 0.9, vPosT.y);
          alb = mix(alb, vec3(0.95, 0.93, 0.88), h * 0.9);
        }
        if (cerca) {
          float pesp = step(0.45, fract((uvp.x + uvp.y) * 230.0));
          det *= 1.0 - 0.35 * (1.0 - smoothstep(0.012, 0.03, abs(frac - 0.1))) * pesp * (1.0 - smoothstep(0.3, 0.8, fwT(uvp * 230.0)));
        }
      } else if (pelo) {
        det = cerca ? 0.62 + 0.75 * cuadroA(vec2(1280.0, 0.0), vec2(256.0), vec2(vTela.y / 0.012, vTela.z / 0.05)).r : 0.97;
        float cn = abs(tipo - 6.0) < 0.5 ? 0.0 : frac;
        if (cn > 0.0) {
          float cana = cerca ? smoothstep(0.76 - 0.4 * cn, 0.88 - 0.3 * cn, nT(vec2(vTela.y * 900.0, vTela.z * 70.0))) * (0.35 + 0.65 * smoothstep(0.4, 0.75, nT(vTela.yz * 24.0))) : 0.45 * cn;
          alb = mix(alb, vec3(0.32, 0.3, 0.28), cana * (0.35 + 0.4 * cn));
        }
      } else if (cara) {
        vec2 fc = vTela.yz, uc = vec2((fc.x + 0.085) / 0.17, (0.085 - fc.y) / 0.2);
        float f = tipo - 20.0;
        float pecas = mod(f, 2.0), risa = mod(floor(f / 2.0), 2.0), mayor = mod(floor(f / 4.0), 2.0), cicatriz = mod(floor(f / 8.0), 2.0), ojeras = floor(f / 16.0);
        vec4 m = unoA(vec2(0.0, 1024.0), vec2(512.0), uc);
        alb = mix(alb, alb * vec3(1.12, 0.72, 0.7), m.r * 0.5);
        alb *= mix(vec3(1.0), vec3(0.8, 0.64, 0.66), m.g * 0.6);
        alb = mix(alb, alb * vec3(0.68, 0.5, 0.38), m.b * 0.8 * pecas);
        // las arrugas (la risa en los grandes; la frente, las ojeras y el surco en los mayores) y la cicatriz
        vec4 a = unoA(vec2(1024.0, 1024.0), vec2(512.0), uc);
        float arr = a.r * (0.4 * risa + 0.35 * mayor) + a.g * 0.6 * mayor;
        alb = mix(alb, alb * vec3(0.74, 0.6, 0.56), clamp(arr, 0.0, 1.0) * 0.55);
        alb = mix(alb, vec3(0.7, 0.36, 0.34), a.b * cicatriz * 0.95);   // (la cicatriz, más clara y rosada que la piel)
        float oj = exp(-pow((abs(fc.x) - 0.034) / 0.014, 2.0) - pow((fc.y + 0.017) / 0.006, 2.0));
        alb = mix(alb, alb * vec3(0.78, 0.68, 0.76), oj * ojeras * 0.55);
        // 3.7.0: la pincelada de la piel (antes la cara era lisa)
        if (cerca) { float b = cuadroA(vec2(1536.0, 1024.0), vec2(256.0), fc / 0.045).r - 0.5; alb *= vec3(1.0) + b * vec3(1.7, 1.45, 1.3); }
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
      } else if (esPiel) {
        // 3.7.0: la pincelada en la piel del cuerpo (las manos, el cuello, las orejas, los antebrazos)
        float b = cerca ? cuadroA(vec2(1536.0, 1024.0), vec2(256.0), uvp / 0.06).r - 0.5 : 0.0;
        alb *= mix(vec3(0.95, 0.92, 0.95), vec3(1.04, 1.02, 0.97), pin) * (vec3(1.0) + b * vec3(1.6, 1.4, 1.25));
      }
      // la guarda: tejida (tapa la tela), bordada (encima, donde hay hilo) o una mancha (barro, pintura, brea)
      if (vGuarda.x > 0.5 && vGuarda.y > -0.001 && vGuarda.y < vGuarda.w) {
        float g = floor(vGuarda.x + 0.5);
        vec2 o = g < 12.5 ? vec2(mod(g - 1.0, 2.0) * 1024.0, 256.0 + floor((g - 1.0) / 2.0) * 128.0) : vec2(mod(g - 13.0, 2.0) * 1024.0, 1536.0 + floor((g - 13.0) / 2.0) * 128.0);
        bool mancha = abs(g - 8.0) < 0.5 || abs(g - 9.0) < 0.5 || abs(g - 14.0) < 0.5;
        vec4 t = mancha ? cuadroA(o, vec2(128.0), uvp / 0.42) : cuadroA(o, vec2(1024.0, 128.0), vec2(vGuarda.z / (vGuarda.w * 8.0), vGuarda.y / vGuarda.w));
        if (abs(g - 9.0) < 0.5) t.a *= 1.0 - 0.75 * smoothstep(0.0, vGuarda.w, vGuarda.y);   // el barro, más abajo
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
const GLSL_BRILLO = /* glsl */`
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
      .replace('#include <common>', '#include <common>\n' + GLSL_COMUN)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + GLSL_COLOR)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + GLSL_BRILLO);
  };
  MAT_ATLAS.customProgramCacheKey = () => 'gente-atlas-370';
  return MAT_ATLAS;
}
export const materialGente = () => materialAtlas();

// ---------------------------------------------------------------- las guardas
// en una pieza de torno (los vértices van por gajo: i·npts + j) o de huso (por anillo)
function guardaTorno(m, npts, segs, tipo, ancho, desde = 'abajo') {
  const P = m.geometry.attributes.position, n = P.count, gu = new Float32Array(n * 4), a = new THREE.Vector3(), b = new THREE.Vector3();
  const d = [0];
  for (let j = 1; j < npts; j++) { a.fromBufferAttribute(P, j); b.fromBufferAttribute(P, j - 1); d.push(d[j - 1] + a.distanceTo(b)); }
  const total = d[npts - 1], jE = desde === 'arriba' ? npts - 1 : 0, largo = [0];
  for (let i = 1; i <= segs; i++) { a.fromBufferAttribute(P, i * npts + jE); b.fromBufferAttribute(P, (i - 1) * npts + jE); largo.push(largo[i - 1] + a.distanceTo(b)); }
  for (let k = 0; k < n; k++) {
    const i = Math.floor(k / npts), j = k % npts;
    const dist = desde === 'arriba' ? total - d[j] : d[j];
    gu.set([tipo, dist, largo[Math.min(i, segs)], desde === 'todo' || !(ancho > 0) ? total + 1e-4 : ancho], k * 4);
  }
  m.geometry.setAttribute('guarda', new THREE.BufferAttribute(gu, 4));
  return m;
}
function guardaHuso(m, tramos, lados, tipo, ancho) {
  const P = m.geometry.attributes.position, n = P.count, gu = new Float32Array(n * 4), K = lados + 1;
  const c = [], v = new THREE.Vector3();
  for (let r = 0; r <= tramos; r++) { const s = new THREE.Vector3(); for (let q = 0; q < K; q++) s.add(v.fromBufferAttribute(P, r * K + q)); c.push(s.divideScalar(K)); }
  const hasta = [0];   // la distancia al final del huso (la muñeca), anillo por anillo
  for (let r = tramos - 1; r >= 0; r--) hasta.unshift(hasta[0] + c[r].distanceTo(c[r + 1]));
  for (let k = 0; k < n; k++) {
    const r = Math.floor(k / K), q = k % K;
    const rad = v.fromBufferAttribute(P, r * K).distanceTo(c[r]);
    gu.set([tipo, hasta[r], (q / lados) * Math.PI * 2 * rad, ancho > 0 ? ancho : hasta[0] + 1e-4], k * 4);
  }
  m.geometry.setAttribute('guarda', new THREE.BufferAttribute(gu, 4));
  return m;
}
// `guardas` (gente-ropa.js): { pollera: [tipo, ancho, desde], manga: [...], puno: ..., cuello: ..., ... }
function guardasDe(g, guardas) {
  g.traverse((o) => {
    const r = o.userData.rol; if (!r || !guardas[r] || !o.userData.dims) return;
    const [tipo, ancho, desde] = guardas[r], [a, b] = o.userData.dims;
    if (r === 'manga') guardaHuso(o, a, b, tipo, ancho);
    else guardaTorno(o, a, b, tipo, ancho, r === 'faja' || r === 'puno' ? 'todo' : desde || 'abajo');
  });
}

// ---------------------------------------------------------------- todo junto: una malla por persona
const _mRel = new THREE.Matrix4(), _mInvRaiz = new THREE.Matrix4(), _nmRel = new THREE.Matrix3();
const _frio = new THREE.Color('#2b3442'), _tibio = new THREE.Color('#fff1d8');
function sombraPintada(c, p, n) {
  const t = Math.min(1, Math.max(0, p.y / 0.875)), s = t * t * (3 - 2 * t);
  let f = 0.8 + 0.2 * s;
  f *= 1 - 0.1 * Math.max(0, -n.y);
  c.multiplyScalar(f).lerp(_frio, (1 - f) * 0.2);
  if (n.y > 0.35) c.lerp(_tibio, (n.y - 0.35) * 0.05);
}
// las telas con su color (y la piel apenas más clara), y lo que mira arriba, tibio
function telaS(c, n, esPiel) {
  c.getHSL(_hsl);
  let l = Math.min(1, _hsl.l * (esPiel ? 1.06 : 1.04) + 0.008);
  if (!esPiel && l < 0.05) l += (0.05 - l) * 0.3;   // las telas casi negras, apenas levantadas (que se lea la forma; en lineal)
  c.setHSL(_hsl.h, Math.min(1, _hsl.s * (esPiel ? 0.9 : 1.0)), l);
  if (!esPiel) c.lerp(_tibio, 0.06 * Math.max(0, n.y));
}
function continuo(f) { return correr(continuoPasos(f)); }
function* continuoPasos(f) {
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
  const lugar = lugarHuesos(), baseH = lugar.base;
  const mallas = [];
  g.traverse((o) => { if (o.isMesh && !o.userData.aparte) mallas.push(o); });   // (el rostro va aparte)
  // 3.7.0: primero lo de siempre, después las piezas finas (lejos no se dibujan) y al final lo del mate
  // (para guardarlo con drawRange)
  const orden = (m) => (m.userData.mate ? 2 : m.userData.fino ? 1 : 0);
  mallas.sort((a, b) => orden(a) - orden(b));
  let nv = 0, ni = 0;
  for (const m of mallas) { nv += m.geometry.attributes.position.count; ni += m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), zona = new Float32Array(nv * 2);
  const aTela = new Float32Array(nv * 3), aGuarda = new Float32Array(nv * 4);
  const si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), pieza = new Uint16Array(nv), tapa = new Uint8Array(nv), crudo = new Uint8Array(nv);
  const ind = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  const p = new THREE.Vector3(), q = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Color();
  const [hombroIzq, hombroDer] = brazos;
  const rodillas = patas.map((pt) => pt.userData.rodilla);
  let ov = 0, oi = 0, iMate = -1, iFino = -1;
  const hs = new Int32Array(8), ws = new Float32Array(8);
  let nh = 0;
  const mezclar = (otro, t) => {
    if (otro == null || t <= 0) return;
    let k = -1;
    for (let a = 0; a < nh; a++) { ws[a] *= 1 - t; if (hs[a] === otro) k = a; }
    if (k < 0 && nh < 8) { k = nh++; hs[k] = otro; ws[k] = 0; }
    if (k >= 0) ws[k] += t;
  };
  // (3.7.0 (integración): pieza por pieza, cortando cada unos miles de vértices)
  let hechos = 0;
  for (let k = 0; k < mallas.length; k++) {
    const m = mallas[k];
    const geo = m.geometry, P = geo.attributes.position, C = geo.attributes.color;
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const N = geo.attributes.normal;
    m.updateMatrix();
    _mRel.multiplyMatrices(_mInvRaiz, m.matrixWorld); _nmRel.getNormalMatrix(_mRel);
    const grupo = m.parent, hueso = idx.has(grupo) ? idx.get(grupo) : 0;
    const sup = m.userData.superior, Z = geo.attributes.zona, esCrudo = !!m.userData.crudo;
    const TV = geo.attributes.telaV, B = geo.attributes.borde, telaPieza = m.userData.tela || 0, AT = geo.attributes.aTela, GU = geo.attributes.guarda;
    const canas = m.userData.canas || 0;
    if (m.userData.mate && iMate < 0) iMate = oi;
    if ((m.userData.fino || m.userData.mate) && iFino < 0) iFino = oi;
    for (let i = 0; i < P.count; i++) {
      const j = ov + i;
      p.fromBufferAttribute(P, i).applyMatrix4(_mRel);
      q.fromBufferAttribute(P, i).applyMatrix4(m.matrix);   // en el espacio del grupo
      n.fromBufferAttribute(N, i).applyMatrix3(_nmRel).normalize();
      pos[j * 3] = p.x; pos[j * 3 + 1] = p.y; pos[j * 3 + 2] = p.z;
      nor[j * 3] = n.x; nor[j * 3 + 1] = n.y; nor[j * 3 + 2] = n.z;
      if (C) c.setRGB(C.getX(i), C.getY(i), C.getZ(i)); else c.copy(m.material.color);
      // (los rasgos ya vienen con su color: como el rostro de cerca, sin sombra pintada ni oclusión)
      const esPiel = Z ? Z.getX(i) > 0.5 : !!m.userData.piel;
      if (!esCrudo) { sombraPintada(c, p, n); telaS(c, n, esPiel); }
      const tp = TV ? TV.getX(i) : telaPieza;
      let x = tp, y = 0, z = 0;
      if ((tp === TELA.pelo || tp === TELA.canas) && m.userData.raya) { y = q.z; z = Math.atan2(Math.abs(q.x), q.y - 0.05) * 0.08; }   // (de la raya hacia los costados)
      else if (tp === TELA.pelo || tp === TELA.canas || tp === TELA.barba) { y = Math.atan2(q.x, q.z) * 0.08; z = q.y - 0.05; }
      else if (esCara(tp) || tp === TELA.plata || tp === TELA.labio || tp === TELA.ceja) { y = q.x; z = q.y - 0.05; }
      else if (tp > 0) x = tp + 0.4 * (B ? B.getX(i) : 1);
      if (tp === TELA.canas || tp === TELA.barba) x = tp + 0.4 * canas;
      if (AT) { x = AT.getX(i); y = AT.getY(i); z = AT.getZ(i); }   // (el rostro trae la suya)
      aTela[j * 3] = x; aTela[j * 3 + 1] = y; aTela[j * 3 + 2] = z;
      if (GU) { aGuarda[j * 4] = GU.getX(i); aGuarda[j * 4 + 1] = GU.getY(i); aGuarda[j * 4 + 2] = GU.getZ(i); aGuarda[j * 4 + 3] = GU.getW(i); }
      col[j * 3] = c.r; col[j * 3 + 1] = c.g; col[j * 3 + 2] = c.b;
      zona[j * 2] = Z ? Z.getX(i) : m.userData.piel ? 1 : 0; zona[j * 2 + 1] = 1; crudo[j] = esCrudo ? 1 : 0;
      pieza[j] = k; tapa[j] = m.userData.noTapa ? 0 : 1;
      // los pesos: el hueso de la pieza, y las mezclas en las juntas (3.7.0: en arreglos chicos, sin
      // armar un Map por vértice)
      nh = 1; hs[0] = hueso; ws[0] = 1;
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
        mezclar(0, sv(-0.075, -0.125, q.y));                                                // el cuello (y las trenzas y la melena) baja al torso
      } else if (sup) {
        // el párpado de abajo se queda con la cabeza; el de arriba, con su hueso (parpadea)
        nh = 2; hs[0] = idx.get(grupo); ws[0] = sup[i]; hs[1] = 1; ws[1] = 1 - sup[i];
      }
      // los cuatro más pesados, normalizados
      for (let a = 0; a < nh; a++) for (let b = a + 1; b < nh; b++) if (ws[b] > ws[a]) { const x = ws[a]; ws[a] = ws[b]; ws[b] = x; const y = hs[a]; hs[a] = hs[b]; hs[b] = y; }
      let usados = 0, tot = 0;
      for (let r = 0; r < nh && usados < 4; r++) if (ws[r] > 1e-3) { tot += ws[r]; usados++; }
      tot = tot || 1;
      for (let r = 0; r < 4; r++) {
        const vale = r < usados;
        si[j * 4 + r] = (vale ? hs[r] : 0) + baseH; sw[j * 4 + r] = vale ? ws[r] / tot : 0;
      }
    }
    if (geo.index) for (let i = 0; i < geo.index.count; i++) ind[oi++] = geo.index.getX(i) + ov;
    else for (let i = 0; i < P.count; i++) ind[oi++] = i + ov;
    ov += P.count;
    hechos += P.count;
    if (hechos > 1500) { hechos = 0; yield; }
  }
  yield;
  for (const m of mallas) { m.parent.remove(m); m.geometry.dispose(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  yield* oclusionPasos(pos, nor, pieza, zona, col, tapa, 0.5, 0.35, crudo);
  geo.setAttribute('zona', new THREE.BufferAttribute(zona, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aTela', new THREE.BufferAttribute(aTela, 3));
  geo.setAttribute('aGuarda', new THREE.BufferAttribute(aGuarda, 4));
  geo.setIndex(new THREE.BufferAttribute(ind, 1));
  geo.computeBoundingSphere();
  const malla = new MallaConPiel(geo, materialAtlas());
  malla.castShadow = true;
  g.add(malla);
  g.updateMatrixWorld(true);
  malla.skeleton = new Esqueleto(H, malla, lugar);
  malla.userData.indicesSinMate = iMate;
  malla.userData.indicesSinFino = iFino < 0 ? ni : iFino;
  malla.userData.indices = ni;
  return malla;
}
// Oclusión por cercanía: cada vértice mira los vértices de otras piezas que tiene delante (en el
// hemisferio de su normal) a menos de 5 cm; cuantos más y más cerca, más oscuro (bajo el mentón,
// las axilas, entre las piernas, bajo la bufanda, el borde del gorro). Se hace una vez, al armar.
function oclusion(...a) { return correr(oclusionPasos(...a)); }
function* oclusionPasos(pos, nor, pieza, zona, col, tapa, fuerza = 1, fuerzaPiel = 1, crudo = null) {
  const n = pieza.length, R = 0.05, mapa = new Map();
  const clave = (x, y, z) => (x + 64) * 16384 + (y + 64) * 128 + (z + 64);
  for (let i = 0; i < n; i += 3) {   // (3.7.0: uno de cada tres alcanza para la sombra de contacto)
    if (!tapa[i]) continue;
    const k = clave(Math.floor(pos[i * 3] / R), Math.floor(pos[i * 3 + 1] / R), Math.floor(pos[i * 3 + 2] / R));
    let l = mapa.get(k); if (!l) mapa.set(k, l = []); l.push(i);
  }
  yield;
  for (let i = 0; i < n; i++) {
    if ((i & 1023) === 1023) yield;   // (3.7.0 (integración))
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
        occ += fr * (1 - dd / R) * 1.5;   // (compensa los vecinos que ya no se miran)
      }
      if (occ > 14) break;   // (ya está todo lo oscuro que puede estar)
    }
    const ao = 1 - (zona[i * 2] ? fuerzaPiel : fuerza) * Math.min(zona[i * 2] ? 0.3 : 0.55, occ * (zona[i * 2] ? 0.025 : 0.045));
    zona[i * 2 + 1] = ao;
    const kk = 0.6 + 0.4 * ao;
    col[i * 3] *= kk; col[i * 3 + 1] *= kk; col[i * 3 + 2] *= kk;
  }
}

// ---------------------------------------------------------------- cada cuadro
// gente.js la llama con la persona (npc) después de ponerle los gestos de siempre. 3.7.0: lo caro (la
// mirada, los ojos, el parpadeo, los gestos) sólo de cerca; la distancia sale de los pies (sin pedirle
// a three la posición de la cabeza en el mundo, que era lo que más costaba con 30 personas).
const CERCA_CARA = 7, CERCA_OJOS = 12, LEJOS_FINO = 17;
function alPosar(est) {
  return (g, dt, camara, charlando, andando) => {
    const st = g.__mira || (g.__mira = { yaw: 0, pitch: 0, cab: 0, parpadeo: 2 + Math.random() * 3, cierra: 0, mira: 0, desvio: 0, desvioT: 0, risa: 0, risaT: 4 + Math.random() * 6 });
    // los codos acompañan: un poco doblados siempre, más cuando el brazo va adelante
    for (const b of g.brazos) {
      const cd = b.userData.codo; if (!cd) continue;
      const adelante = Math.max(0, -b.rotation.x);
      const obj = -(0.14 + (andando ? 0.2 : 0) + 0.55 * Math.min(1.4, adelante) + (charlando ? 0.25 : 0));
      cd.rotation.x += (obj - cd.rotation.x) * Math.min(1, dt * 10);
    }
    // los pies quedan de plano en el piso (el tobillo contra la pierna)
    for (const p of g.patas) { const r = p.userData.rodilla, t = r?.userData.tobillo; if (t) t.rotation.x = -(p.rotation.x + r.rotation.x) * 0.85; }
    // la abuela, un poco encorvada
    if (est.encorvada && !g.pose) { g.torso.rotation.x += est.encorvada; g.cabeza.rotation.x -= est.encorvada * 0.75; }
    quietud(g, st, dt, andando, charlando);   // manos en la cintura, brazos cruzados...
    let dist = 99;
    if (camara) { const dx = camara.position.x - g.pos.x, dz = camara.position.z - g.pos.z; dist = Math.sqrt(dx * dx + dz * dz); }
    // de lejos, sin las piezas finas (una vez que cambia)
    const lejos = !g.__cerca && dist > LEJOS_FINO;
    if (lejos !== est.lejos) { est.lejos = lejos; est.rango(); }
    // el gesto (neutral, sonrisa al charlar, de vez en cuando una risa; `g.__gesto` lo fuerza)
    const cara = g.cara;
    if (cara) {
      const cercaCara = !g.__lejos && (g.__gesto || dist < CERCA_CARA);
      if (cercaCara !== cara.visible) { cara.visible = cercaCara; g.cabeza.userData.rasgos.scale.setScalar(cercaCara ? 0.001 : 1); }
      if (cercaCara) {
        const contento = charlando || g.charlaVecinos || g.pose === 'bailar' || g.pose === 'jugar';
        if (contento && !g.__gesto) {
          st.risaT -= dt;
          if (st.risaT <= 0) { st.risa = Math.random() < 0.4 ? 1.1 + Math.random() * 0.8 : 0; st.risaT = 5 + Math.random() * 7; }
        } else st.risa = 0;
        if (st.risa > 0) st.risa -= dt;
        const pedido = g.__gesto || (st.risa > 0 ? 'risa' : contento ? 'sonrisa' : 'neutral');
        const inf = cara.morphTargetInfluences, k = Math.min(1, dt * 7);
        inf[0] += ((pedido === 'sonrisa' ? 1 : 0) - inf[0]) * k;
        inf[1] += ((pedido === 'risa' ? 1 : 0) - inf[1]) * k;
      }
    }
    const cab = g.cabeza;
    if (!camara || dist > CERCA_OJOS) {
      // lejos: la cabeza vuelve al frente y los ojos quietos (sin cuentas)
      if (Math.abs(st.cab) > 0.002) { st.cab *= Math.max(0, 1 - dt * 4); cab.rotation.y += st.cab; }
      return;
    }
    // mirar al jugador: la cabeza gira la mitad y los ojos el resto; de vez en cuando miran a otro lado
    const s = g.g.scale.y, hy = g.pos.y + 1.52 * s;
    const wx = camara.position.x - g.pos.x, wz = camara.position.z - g.pos.z, wy = camara.position.y - hy;
    let ang = Math.atan2(wx, wz) - g.g.rotation.y; ang = Math.atan2(Math.sin(ang), Math.cos(ang));
    const pitch = Math.atan2(wy, dist);
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
    // parpadear (cada 2 a 6 s, 0,14 s) y el párpado acompaña la mirada hacia abajo; cada uno con su
    // párpado en reposo (la astrónoma, dormilona, a media asta)
    st.parpadeo -= dt;
    if (st.parpadeo <= 0) { st.cierra = 0.14; st.parpadeo = 2 + Math.random() * 4; }
    let cierre = 0;
    if (st.cierra > 0) { st.cierra -= dt; cierre = Math.sin(Math.max(0, st.cierra) / 0.14 * Math.PI); }
    const achina = cara ? 0.07 * cara.morphTargetInfluences[0] + 0.2 * cara.morphTargetInfluences[1] : 0;   // al reír, los ojos se achinan
    for (const pp of cab.userData.parpados) pp.rotation.x = Math.min(0.95, est.parpado + 0.95 * cierre + Math.max(0, -st.pitch) * 0.45 + achina);
  };
}

// ---------------------------------------------------------------- las poses de quietud
// Cada brazo: x (adelante, negativo), yl (giro sobre su eje, hacia adentro negativo), zl (abrirlo),
// codo (doblar, negativo); yl y zl van espejados según el lado. `uno`: la pose usa un solo brazo
// (si esa mano tiene el mate, la hace la otra). El orden de los giros del hombro pasa a XZY (con y = 0
// es el mismo de siempre): primero el giro sobre el eje del brazo, después abrirlo, después adelante.
// 3.7.0: "acomodar el gorro" ya no parece un saludo: el codo bien afuera, la mano arriba de la cabeza,
// al costado, y la cabeza que se inclina hacia la mano.
const POSES = {
  cintura: { izq: { x: 0.08, yl: -1.4, zl: 0.5, codo: -1.6 }, der: { x: 0.08, yl: -1.4, zl: 0.5, codo: -1.6 } },
  cruzados: { izq: { x: -0.62, yl: -1.3, zl: -0.06, codo: -2.05 }, der: { x: -0.72, yl: -1.38, zl: -0.04, codo: -1.95 } },
  barba: { uno: true, der: { x: -1.05, yl: -0.62, zl: -0.12, codo: -2.5 }, cabeza: -0.12 },
  gorro: { uno: true, der: { x: -0.15, yl: 1.5, zl: 2.5, codo: -1.8 }, cabeza: 0.04, ladea: 0.14 },
  atras: { izq: { x: 0.5, yl: -1.45, zl: 0.08, codo: -1.3 }, der: { x: 0.5, yl: -1.45, zl: 0.08, codo: -1.3 } },
  delantal: { uno: true, izq: { x: -0.42, yl: -1.05, zl: -0.04, codo: -1.05 } },
};
function quietud(g, st, dt, andando, charlando) {
  const q = st.q || (st.q = { nombre: null, sig: null, w: 0, t: 2 + Math.random() * 4 });
  if (g.__quietud !== undefined) q.sig = g.__quietud;
  else if (!andando && !charlando && !g.pose && !g.mate?.visible) {
    q.t -= dt;
    if (q.t <= 0) {
      const lista = g.posesM || [];
      q.sig = Math.random() < 0.65 && lista.length ? lista[Math.floor(Math.random() * lista.length)] : null;
      q.t = q.sig ? 5 + Math.random() * 7 : 3 + Math.random() * 4;
    }
  } else q.sig = null;
  if (q.nombre !== q.sig) { q.w = Math.max(0, q.w - dt * 2.5); if (q.w === 0) q.nombre = q.sig; } else q.w = Math.min(1, q.w + dt * 2.5);
  const P = POSES[q.nombre];
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
    if (P.ladea) g.cabeza.rotation.z += -l * P.ladea * w;
  });
  if (P.cabeza) g.cabeza.rotation.x += P.cabeza * w;
}

// ---------------------------------------------------------------- la entrada
// colores y R: los de quien la arma (gente.js, aldea.js); `opciones`: { talla, invierno, fiesta }.
// 3.7.0: `opciones.aspecto` (el cuerpo del jugador): el aspecto armado afuera, sin gente-ropa.js
export function crearPersona(colores = {}, clave = '', conMate = false, R = {}, opciones = {}) { return correr(crearPersonaPasos(colores, clave, conMate, R, opciones)); }
// 3.7.0 (integración): la misma persona, armada de a poco: `avanzar(ms)` arma hasta gastar unos `ms` (al menos un
// paso) y dice si terminó; `resultado`, lo mismo que devuelve crearPersona.
export function armarPersonaDeAPoco(colores = {}, clave = '', conMate = false, R = {}, opciones = {}) {
  const it = crearPersonaPasos(colores, clave, conMate, R, opciones);
  const tarea = { hecho: false, resultado: null, pasos: 0, msMax: 0, tiempos: [] };
  tarea.avanzar = (ms = 3) => {
    const t0 = performance.now();
    while (!tarea.hecho) {
      const t1 = performance.now();
      const r = it.next();
      tarea.pasos++;
      const ms1 = performance.now() - t1; tarea.msMax = Math.max(tarea.msMax, ms1); if (tarea.tiempos.length < 80) tarea.tiempos.push(+ms1.toFixed(2));
      if (r.done) { tarea.hecho = true; tarea.resultado = r.value; break; }
      if (performance.now() - t0 >= ms) break;
    }
    return tarea.hecho;
  };
  return tarea;
}
function* crearPersonaPasos(colores, clave, conMate, R, opciones) {
  const A = opciones.aspecto ? { conocido: true, cuerpo: {}, cara: {}, guardas: {}, poses: null, ...opciones.aspecto } : aspectoGente(clave, colores || {}, R || {}, opciones);
  let col = A.colores, ropa = A.R;
  if (!A.conocido) {
    // alguien sin ropa propia: los colores que trae, corridos hacia la tierra
    col = { ...col };
    for (const k of ['ropa', 'abrigo', 'pantalon', 'bufanda']) if (col[k]) col[k] = aTierra(col[k]);
    ropa = { ...ropa, pantalon: aTierra(ropa.pantalon), delantal: aTierra(ropa.delantal), arremangado: !!(ropa.chaleco || ropa.delantal) };
  }
  const f = yield* figuraPasos(col, clave, conMate, ropa, A, opciones.talla);
  const { g, cabeza, torso, patas, brazos } = f;
  const malla = yield* continuoPasos(f);
  g.scale.setScalar(f.escala);
  // lo que se dibuja: todo, sin lo fino (lejos) o sin el mate (guardado)
  const est = {
    mate: true, lejos: false, encorvada: Number(A.cuerpo?.encorvada) || 0, parpado: f.F.parpado || 0,
    rango() {
      const u = malla.userData, cuenta = this.mate ? (this.lejos && u.indicesSinMate < 0 ? u.indicesSinFino : Infinity) : (this.lejos ? u.indicesSinFino : u.indicesSinMate);
      malla.geometry.setDrawRange(0, cuenta);
    },
  };
  let mano = brazos[1].userData.ante, mateVisible = null;
  const muneca = f.muneca;
  if (muneca) {
    mano = muneca;
    mateVisible = new THREE.Object3D();
    Object.defineProperty(mateVisible, 'visible', { configurable: true, get: () => est.mate, set: (v) => { est.mate = !!v; est.rango(); } });
  }
  // lo que se lleva en la mano (la caña, la planilla, el arco) va en el antebrazo
  if (brazos[1].userData.codo) { const a = brazos[1].userData.ante; brazos[1].userData.codo.add(a); a.position.set(0, -0.01, 0); mano = a; }
  const r = { g, cabeza, torso, patas, brazos, mano, muneca, mateVisible, alPosar: alPosar(est), posesM: A.poses || ['cintura', 'cruzados', 'atras'], cara: cabeza.userData.rostro || null, conPoncho: f.conPoncho, edad: A.edad };
  r.soltar = () => soltarPersona(r);
  r.__est = est;
  return r;
}
// 3.7.0: cuando alguien se va del todo: su tramo de huesos queda libre y se sueltan sus geometrías
// (el material y el atlas son de todos)
export function soltarPersona(r) {
  if (!r?.g) return;
  r.g.traverse((o) => {
    if (o.isSkinnedMesh && o.skeleton) o.skeleton.dispose();
    if (o.isMesh && o.geometry) o.geometry.dispose();
  });
}
// (para el estudio: los triángulos de cada pieza, antes de fundir)
export function __piezasPersona(colores, clave, conMate, R) {
  const A = aspectoGente(clave, colores || {}, R || {});
  const f = figura(A.colores, clave, conMate, A.R, A), out = new Map();
  f.g.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3;
    const k = `${o.parent === f.cabeza || o.parent?.parent === f.cabeza ? 'cabeza' : o.parent === f.torso ? 'torso' : 'miembros'}:${o.userData.fino ? 'fino' : g.type}`;
    const e = out.get(k) || { tri: 0, ver: 0, n: 0 }; e.tri += n; e.ver += g.attributes.position.count; e.n++; out.set(k, e);
  });
  return [...out].sort((a, b) => b[1].tri - a[1].tri);
}

// ---------------------------------------------------------------- la mano del jugador
// 3.7.0: la mano y la manga en primera persona, al estilo de la gente: el puño cerrado (piel con la
// pincelada, o el guante de lana) y la manga con su tela y la guarda en el puño. Una malla fija (sin
// huesos) con el material de la gente; se compila en la carga (cuelga de la cámara, que está en la
// escena). `a`: { piel, manga, guantes, guarda }.
export function manoPrimeraPersona(a) {
  const colMano = a.guantes || a.piel || '#c49a70', manga = a.manga || '#6b4a3a';
  const deMano = (m) => (a.guantes ? conTela(m, TELA.punto) : piel(m));
  const piezas = [
    deMano(bola(colMano, [0.034, 0.046, 0.04], [0.006, -0.06, 0.014], [0, 0, -0.1], [12, 9])),                 // la palma y el dorso
    deMano(bola(colMano, [0.026, 0.058, 0.024], [-0.02, -0.062, 0.024], [0, 0, 0.05], [12, 9])),                // los dedos cerrados
    deMano(bola(colMano, [0.012, 0.03, 0.014], [-0.008, -0.026, 0.034], [0.25, 0, -0.6], [9, 7])),             // el pulgar, encima
    deMano(huso(colMano, [[0.012, -0.085, 0.026], [0.02, -0.11, 0.036], [0.03, -0.14, 0.05]], [0.031, 0.03, 0.031], 6, 12)),   // la muñeca
  ];
  for (let i = 0; i < 4; i++) piezas.push(deMano(bola(colMano, [0.011, 0.01, 0.012], [-0.03, -0.034 - i * 0.017, 0.03], null, [7, 5])));   // los nudillos
  const brazo = huso(manga, [[0.026, -0.12, 0.044], [0.045, -0.2, 0.075], [0.068, -0.3, 0.112], [0.088, -0.42, 0.15]], [0.042, 0.05, 0.056, 0.06], 10, 14);
  piezas.push(conTela(brazo, a.telaManga || TELA.lana));
  const puno = torno(matiz(manga, 0.82), [[0.04, -0.016], [0.045, 0.0], [0.044, 0.016], [0.038, 0.02]], [0.028, -0.128, 0.046], [0.5, 0, -0.28], null, 14);
  piezas.push(conTela(a.guarda ? guardaTorno(puno, 4, 14, a.guarda, 0, 'todo') : puno, a.telaManga || TELA.lana));
  // todo en una malla, con los mismos atributos que la gente (en el espacio de la mano)
  let nv = 0, ni = 0;
  for (const m of piezas) { m.updateMatrix(); nv += m.geometry.attributes.position.count; ni += m.geometry.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), zona = new Float32Array(nv * 2), aTela = new Float32Array(nv * 3), aGuarda = new Float32Array(nv * 4), ind = new Uint16Array(ni);
  const p = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Color(), nm = new THREE.Matrix3();
  let ov = 0, oi = 0;
  for (const m of piezas) {
    const geo = m.geometry, P = geo.attributes.position, N = geo.attributes.normal, C = geo.attributes.color, GU = geo.attributes.guarda;
    nm.getNormalMatrix(m.matrix);
    const esPiel = !!m.userData.piel, tp = m.userData.tela || 0;
    for (let i = 0; i < P.count; i++) {
      const j = ov + i;
      p.fromBufferAttribute(P, i).applyMatrix4(m.matrix); n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      pos.set([p.x, p.y, p.z], j * 3); nor.set([n.x, n.y, n.z], j * 3);
      if (C) c.setRGB(C.getX(i), C.getY(i), C.getZ(i)); else c.copy(m.material.color);
      telaS(c, n, esPiel);
      col.set([c.r, c.g, c.b], j * 3);
      zona.set([esPiel ? 1 : 0, 1], j * 2);
      aTela.set([tp > 0 ? tp + 0.4 : 0, 0, 0], j * 3);
      if (GU) aGuarda.set([GU.getX(i), GU.getY(i), GU.getZ(i), GU.getW(i)], j * 4);
    }
    for (let i = 0; i < geo.index.count; i++) ind[oi++] = geo.index.getX(i) + ov;
    ov += P.count;
    geo.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('zona', new THREE.BufferAttribute(zona, 2));
  geo.setAttribute('aTela', new THREE.BufferAttribute(aTela, 3));
  geo.setAttribute('aGuarda', new THREE.BufferAttribute(aGuarda, 4));
  geo.setIndex(new THREE.BufferAttribute(ind, 1));
  geo.computeBoundingSphere();
  const malla = new THREE.Mesh(geo, materialAtlas());
  malla.castShadow = false; malla.receiveShadow = false; malla.frustumCulled = false;
  return malla;
}
