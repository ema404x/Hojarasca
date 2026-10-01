// 3.4: formas suaves para la gente y los animales, al estilo pintado de HushWood/Firewatch.
// Son piezas sueltas (esferas, tubos y tornos con más lados) que después `compactar(g,
// opciones)` de vida.js funde en una malla por grupo con colores por vértice: el material
// de cada pieza sólo dice su color, no se compila nunca (todo termina en MAT_FAUNA).
// Nada de texturas: los degradés del pelaje y de la ropa se pintan en los vértices.
import * as THREE from 'three';

// Un material por color, sólo para llevarle el color a la fundición
const MATS = new Map();
export function color(c) {
  const k = typeof c === 'string' ? c : `#${new THREE.Color(c).getHexString()}`;
  let m = MATS.get(k);
  if (!m) { m = new THREE.MeshLambertMaterial({ color: k }); MATS.set(k, m); }
  return m;
}

// Un color más claro u oscuro (k > 1 aclara), y la mezcla de dos colores, en hex
export function matiz(hex, k) {
  const c = new THREE.Color(hex);
  if (k >= 1) c.lerp(new THREE.Color('#ffffff'), Math.min(1, k - 1));
  else c.multiplyScalar(k);
  return `#${c.getHexString()}`;
}
export function mezcla(a, b, t) { return `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`; }

function ubicar(m, pos, rot, esc) {
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  if (esc) m.scale.set(esc[0], esc[1], esc[2]);
  return m;
}

// Esfera (elipsoide con `esc`). Los lados van según el tamaño: lo chico, liviano.
export function bola(c, esc, pos, rot = null, seg = null) {
  const s = Math.max(esc[0], esc[1], esc[2]);
  const [a, b] = seg || (s > 0.2 ? [16, 12] : s > 0.075 ? [13, 10] : s > 0.03 ? [10, 7] : [7, 5]);
  return ubicar(new THREE.Mesh(new THREE.SphereGeometry(1, a, b), color(c)), pos, rot, esc);
}

// Tubo de r1 (arriba) a r2 (abajo), abierto en las puntas (las tapan las articulaciones)
export function tubo(c, r1, r2, largo, pos, rot = null, lados = null, tapas = false) {
  const n = lados || (Math.max(r1, r2) > 0.05 ? 12 : 9);
  return ubicar(new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, largo, n, 1, !tapas), color(c)), pos, rot);
}

// Torno: `perfil` es [[radio, y], ...] de abajo hacia arriba; `esc` lo achata (z) o lo
// estira. `desde`/`arco` dejan una abertura (un chaleco abierto adelante).
export function torno(c, perfil, pos, rot = null, esc = null, lados = 14, desde = 0, arco = Math.PI * 2) {
  const pts = perfil.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y));
  return ubicar(new THREE.Mesh(new THREE.LatheGeometry(pts, lados, desde, arco), color(c)), pos, rot, esc);
}

// Un tubo de `a` a `b` (para patas y cuellos en ángulo)
const _eje = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0);
export function entre(c, r1, r2, a, b, lados = null) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  _eje.subVectors(vb, va);
  const largo = _eje.length();
  const m = tubo(c, r2, r1, largo, null, null, lados);
  m.position.copy(va).addScaledVector(_eje, 0.5);
  m.quaternion.setFromUnitVectors(_y, _eje.normalize());
  return m;
}

// Un miembro de una sola pieza (pata, cola, cuello) que sigue una curva por `puntos` y se
// afina según `radios` (uno por punto): sin anillos ni costuras en las articulaciones.
export function miembro(c, puntos, radios, tramos = 10, lados = 9) {
  const curva = new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curva, tramos, 1, lados, false);
  const P = geo.attributes.position, v = new THREE.Vector3(), centro = new THREE.Vector3();
  const n = radios.length - 1;
  for (let i = 0; i <= tramos; i++) {
    const t = i / tramos;
    curva.getPointAt(t, centro);
    const k = Math.min(n - 1, Math.floor(t * n)), f = t * n - k;
    const r = radios[k] + (radios[k + 1] - radios[k]) * f;
    for (let j = 0; j <= lados; j++) {
      const idx = i * (lados + 1) + j;
      v.fromBufferAttribute(P, idx).sub(centro).multiplyScalar(r).add(centro);
      P.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  coser(geo);
  return new THREE.Mesh(geo, color(c));
}

// El cuerpo de un cuadrúpedo: un torno acostado de `atras` a `adelante` (z), con el lomo a la
// altura `y`. `ancho` y `alto` son los radios; `pecho` ahonda el pecho, `panza` recoge la
// cintura, `grupa` levanta el anca (el pudú, la liebre).
export function lomo(c, { y, atras, adelante, ancho, alto, pecho = 0.15, panza = 0.15, grupa = 0 }, lados = 16) {
  const forma = [[0, 0], [0.04, 0.5], [0.12, 0.84], [0.24, 0.98], [0.44, 0.93], [0.62, 0.97], [0.78, 1.0], [0.9, 0.86], [0.97, 0.52], [1, 0]];
  const L = adelante - atras, R = Math.max(ancho, alto);
  const m = torno(c, forma.map(([u, r]) => [r * R, atras + u * L]), [0, y, 0], [Math.PI / 2, 0, 0], null, lados);
  const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  return deformar(m, (v) => {
    const u = (v.y - atras) / L;
    let h = -v.z;
    h *= alto / R;
    if (h < 0) h *= (1 + pecho * sv(0.5, 0.85, u)) * (1 - panza * Math.max(0, 1 - Math.abs(u - 0.42) / 0.22));
    h += grupa * R * sv(0.55, 0.2, u) * (h > 0 ? 1 : 0.5);
    v.x *= ancho / R;
    v.z = -h;
  });
}
// Una pata que cuelga de su pivote (0, 0, 0) y llega al piso a `largo` metros: la de adelante
// derecha, con rodilla; la de atrás con muslo y garrón. `grosor` es el radio de arriba.
export function pata(c, largo, delantera, grosor, lados = 9) {
  const L = largo;
  if (delantera) return miembro(c, [[0, 0.12 * L, -0.01 * L], [0, -0.28 * L, 0], [0, -0.55 * L, 0.012 * L], [0, -0.82 * L, 0], [0, -0.97 * L, 0.03 * L]], [grosor, grosor * 0.78, grosor * 0.55, grosor * 0.45, grosor * 0.44], 12, lados);
  return miembro(c, [[0, 0.14 * L, 0.02 * L], [0, -0.16 * L, -0.04 * L], [0, -0.44 * L, -0.12 * L], [0, -0.62 * L, -0.08 * L], [0, -0.86 * L, -0.01 * L], [0, -0.97 * L, 0.03 * L]], [grosor * 1.2, grosor * 0.95, grosor * 0.55, grosor * 0.46, grosor * 0.43, grosor * 0.43], 14, lados);
}

// Mueve los vértices de una pieza (en su espacio, antes de escalar) y recalcula normales
// suaves, cosiendo la costura de la esfera para que no quede una raya.
export function deformar(m, fn) {
  const geo = m.geometry, P = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); fn(v); P.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  coser(geo);
  return m;
}
export function coser(geo) {
  const P = geo.attributes.position, N = geo.attributes.normal, mapa = new Map();
  const clave = (i) => `${Math.round(P.getX(i) * 1e4)},${Math.round(P.getY(i) * 1e4)},${Math.round(P.getZ(i) * 1e4)}`;
  for (let i = 0; i < P.count; i++) {
    const k = clave(i);
    const s = mapa.get(k);
    if (s) { s[0] += N.getX(i); s[1] += N.getY(i); s[2] += N.getZ(i); s.push(i); } else mapa.set(k, [N.getX(i), N.getY(i), N.getZ(i), i]);
  }
  for (const s of mapa.values()) {
    if (s.length < 5) continue;
    const l = Math.hypot(s[0], s[1], s[2]) || 1;
    for (let j = 3; j < s.length; j++) N.setXYZ(s[j], s[0] / l, s[1] / l, s[2] / l);
  }
  N.needsUpdate = true;
}

// Colores propios de una pieza, decididos en su espacio y antes de deformarla (así una guarda
// sigue al borde aunque después se lo baje). fn(c, v, i): c arranca con el color de la pieza.
export function colorear(m, fn) {
  const P = m.geometry.attributes.position, v = new THREE.Vector3(), c = new THREE.Color();
  const col = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i); c.copy(m.material.color);
    fn(c, v, i);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  m.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return m;
}

// Pintura por vértice (para `pieza.userData.pintar`). Todas reciben (color, p, n) con p y n
// en el espacio de la figura y cambian `color` en el lugar.
const _a = new THREE.Color();
// bandas horizontales: [[y0, y1, color], ...] (la cinta de un sombrero)
export function franjas(lista) {
  const fs = lista.map(([y0, y1, h]) => [y0, y1, new THREE.Color(h)]);
  return (c, p) => { for (const [y0, y1, h] of fs) if (p.y >= y0 && p.y <= y1) { c.copy(h); return; } };
}
// un ruido suave y fijo (para el pelaje moteado), entre -1 y 1
export function ruido3(x, y, z) {
  return Math.sin(x * 12.9 + y * 7.3) * Math.sin(y * 9.7 - z * 11.1) * 0.6 + Math.sin(z * 15.3 + x * 5.1) * 0.4;
}
export function pintar(m, fn) { m.userData.pintar = fn; return m; }
// mezcla `hacia` en el color con peso t (0..1)
export function entintar(c, hacia, t) { if (t > 0) c.lerp(_a.set(hacia), Math.min(1, t)); }
