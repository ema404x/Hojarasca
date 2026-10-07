// 3.7.5 (rincones): lo que se ve de los rincones (las reglas, en rincones.js, futbol.js, sulky.js y casa-propia.js; el
// enganche, en rincones-juego.js):
//   · los doce duendes tallados (una sola malla instanciada para todo el valle: 1 dibujo);
//   · el potrero con sus arcos de palo y la pelota de cuero;
//   · la huerta comunitaria (cuatro canteros con cerco) y la de los chicos detrás de la escuela (las matas van en la
//     malla de la huerta de siempre, huerta-malla.js: no suman dibujos);
//   · el retablo de los títeres en la plaza (con el zorro y el pudú cuando hay función), tu talla al lado del duende
//     de la plaza, el atril con tu cuaderno en la biblioteca;
//   · el fuerte del bosque (en tres etapas) y el campamento (carpa y fogón);
//   · el camino refugio–aldea pintado en el suelo (como el sendero: sin dibujos), con su puentecito sobre el arroyo,
//     los faroles (con la minga) y el sulky;
//   · el taller del refugio (banco, herramientas y el estante con lo que hiciste);
//   · tu casa en la calle de la Loma: el lote con estacas, la obra y la casa (las de la aldea, aldea-arquitectura.js,
//     con sus materiales: no compila nada nuevo), sobre un zócalo de piedra (el terreno no se toca).
// Todo con MAT_FAUNA (color por vértice, el de la gente y los animales) salvo la casa y el vidrio de los faroles. Las
// mallas se crean al cargar y se compilan con lo demás (`paraCompilar` / `trasCompilar`); lejos, no se dibuja nada.
import * as THREE from 'three';
import { MAT_FAUNA } from './vida.js';
import { armarEdificio, registrarEnMundo } from './aldea-arquitectura.js';
import { U } from './materiales.js';
import { registrarLuz } from './luces.js';
import { RES, N } from './config.js';
import { LUGARES_RINCONES, lugarEnMundo, puntoDeLugar, ubicarDuendes, PISO_ALDEA_RINCONES, adornosDelEstante, RINCONES, CULTIVOS_COMUNITARIA, CULTIVOS_CHICOS } from './rincones.js';
import { CANCHA, PELOTA } from './futbol.js';
import { CAMINO, trazarCamino, recorrido, enCamino, farolesDelCamino, puentesDelCamino } from './sulky.js';
import { CASA_PROPIA, loteEnMundo } from './casa-propia.js';
import { marcoAldea, EDIFICIOS_ALDEA } from './aldea.js';

const PI = Math.PI;
const VER_ALDEA = 160;       // a cuántos metros se ven los rincones de la aldea
const VER_CERCA = 70;        // lo chico (el atril, los títeres, los adornos)
const VER_ADENTRO = 25;      // adentro de tu casa (como la aldea)
const VER_FAROLES = 260;

// ---------------------------------------------------------------- un armador de piezas con color por vértice
const ruido = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _n3 = new THREE.Matrix3();
const _v = new THREE.Vector3(), _nn = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0);
class Pieza {
  constructor() { this.p = []; this.n = []; this.c = []; }
  geo(g, color, pos = [0, 0, 0], rot = [0, 0, 0], esc = [1, 1, 1], o = {}) {
    const gg = g.index ? g.toNonIndexed() : g;
    if (o.quat) _q.copy(o.quat); else _q.setFromEuler(_e.set(rot[0], rot[1], rot[2]));
    _m.compose(_p.set(pos[0], pos[1], pos[2]), _q, _s.set(esc[0], esc[1], esc[2]));
    _n3.getNormalMatrix(_m);
    const P = gg.attributes.position, Nn = gg.attributes.normal, base = new THREE.Color(color), pin = o.pincel ?? 0.12, arriba = o.arriba ?? 0.08;
    for (let i = 0; i < P.count; i++) {
      _v.fromBufferAttribute(P, i).applyMatrix4(_m);
      _nn.fromBufferAttribute(Nn, i).applyMatrix3(_n3).normalize();
      this.p.push(_v.x, _v.y, _v.z); this.n.push(_nn.x, _nn.y, _nn.z);
      // la pincelada: un poco de ruido grande y la luz de arriba, como lo pintado de la gente y los animales
      const k = 1 + pin * (ruido(Math.floor(_v.x * 9), Math.floor(_v.y * 9), Math.floor(_v.z * 9)) - 0.5) * 2 + arriba * _nn.y - (o.oscuroAbajo ? o.oscuroAbajo * Math.max(0, 0.4 - _v.y) : 0);
      this.c.push(base.r * k, base.g * k, base.b * k);
    }
    if (gg !== g) gg.dispose();
    g.dispose();
    return this;
  }
  caja(color, a, h, f, pos, rot = [0, 0, 0], o = {}) { return this.geo(new THREE.BoxGeometry(a, h, f), color, pos, rot, [1, 1, 1], o); }
  cil(color, r1, r2, h, pos, rot = [0, 0, 0], lados = 7, o = {}) { return this.geo(new THREE.CylinderGeometry(r1, r2, h, lados, 1, false), color, pos, rot, [1, 1, 1], o); }
  bola(color, r, pos, esc = [1, 1, 1], seg = [8, 6], o = {}) { return this.geo(new THREE.SphereGeometry(r, seg[0], seg[1]), color, pos, [0, 0, 0], esc, o); }
  cono(color, r, h, pos, rot = [0, 0, 0], lados = 8, o = {}) { return this.geo(new THREE.ConeGeometry(r, h, lados, 1, false), color, pos, rot, [1, 1, 1], o); }
  // un palo de `a` a `b` (puntos [x, y, z])
  palo(color, a, b, r = 0.04, lados = 6, o = {}) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), eje = vb.clone().sub(va), largo = eje.length();
    if (largo < 1e-4) return this;
    const q = new THREE.Quaternion().setFromUnitVectors(_y, eje.normalize());
    const medio = va.clone().addScaledVector(eje, largo / 2);
    return this.geo(new THREE.CylinderGeometry(r * (o.punta ?? 1), r, largo, lados, 1, false), color, [medio.x, medio.y, medio.z], null, [1, 1, 1], { ...o, quat: q });
  }
  vacia() { return this.p.length === 0; }
  geometria() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}
const malla = (geo, mat = MAT_FAUNA, sombra = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = sombra; m.receiveShadow = true; return m; };
const MADERA = '#7a5a3c', MADERA_CLARA = '#a07850', LENGA = '#8a6446', PIEDRA = '#7d776c', TIERRA = '#5b4632';

// ---------------------------------------------------------------- los modelos
// Un duende tallado (unos 30 cm con su tronquito): el gorro colorado, la barba, la túnica pintada y las botas.
function modeloDuende() {
  const P = new Pieza();
  P.cil('#5e4a38', 0.12, 0.14, 0.12, [0, 0.06, 0], [0, 0, 0], 9, { pincel: 0.2 });            // el tronquito
  P.cil('#6d5642', 0.118, 0.118, 0.012, [0, 0.122, 0], [0, 0, 0], 9);                          // el corte
  P.bola('#3a2c22', 0.028, [-0.03, 0.142, 0.015], [1, 0.6, 1.5]); P.bola('#3a2c22', 0.028, [0.03, 0.142, 0.015], [1, 0.6, 1.5]);   // las botas
  P.geo(new THREE.LatheGeometry([[0.001, 0.13], [0.062, 0.135], [0.058, 0.18], [0.046, 0.23], [0.034, 0.255], [0.001, 0.26]].map(([r, y]) => new THREE.Vector2(r, y)), 9), '#3f5a3a', [0, 0, 0], [0, 0, 0], [1, 1, 0.85], { pincel: 0.18 });   // la túnica
  P.caja('#6b4a2a', 0.13, 0.016, 0.11, [0, 0.19, 0], [0, 0, 0]);                                // el cinto
  P.bola('#d2a272', 0.042, [0, 0.29, 0.005], [1, 1.05, 1]);                                      // la cara
  P.bola('#c0835a', 0.012, [0, 0.288, 0.045], [1, 0.9, 1]);                                      // la nariz
  P.cono('#e6ddcc', 0.04, 0.09, [0, 0.245, 0.025], [PI, 0, 0], 8);                               // la barba
  P.cono('#a03a28', 0.046, 0.12, [0.006, 0.36, -0.006], [-0.18, 0, 0.12], 9, { pincel: 0.16 }); // el gorro
  P.bola('#a03a28', 0.047, [0, 0.318, 0], [1, 0.42, 1]);
  P.bola('#d2a272', 0.016, [-0.06, 0.2, 0.02]); P.bola('#d2a272', 0.016, [0.06, 0.2, 0.02]);       // las manos
  return P.geometria();
}
// Los arcos de palo de lenga del potrero (los dos) y las estacas de las esquinas, sobre el terreno. `suelo(u, v)`: la
// altura del piso en el marco de la cancha (relativa al centro).
function modeloPotrero(suelo) {
  const P = new Pieza(), A = CANCHA.arco, L2 = CANCHA.largo / 2, W2 = CANCHA.ancho / 2;
  for (const lado of [-1, 1]) {
    const v = lado * L2;
    for (const su of [-1, 1]) {
      const u = (su * A.ancho) / 2, y0 = suelo(u, v);
      P.palo(LENGA, [u, y0 - 0.2, v], [u + su * 0.02, y0 + A.alto + 0.04, v], A.palo, 7, { pincel: 0.22 });
      // el puntal de atrás
      P.palo('#6d5038', [u, y0 + A.alto * 0.9, v], [u, suelo(u, v + lado * A.fondo) - 0.1, v + lado * A.fondo], 0.035, 5);
    }
    const ya = (suelo(-A.ancho / 2, v) + suelo(A.ancho / 2, v)) / 2 + A.alto;
    P.palo(LENGA, [-A.ancho / 2 - 0.05, ya, v], [A.ancho / 2 + 0.05, ya + 0.02, v], A.palo * 0.95, 7, { pincel: 0.22 });
    // la red: unos tientos cruzados (lo justo para que se lea como red, sin transparencias)
    for (let i = 1; i < 6; i++) {
      const u = -A.ancho / 2 + (i / 6) * A.ancho;
      P.palo('#d8d0bc', [u, ya - 0.02, v], [u, suelo(u, v + lado * A.fondo) + 0.02, v + lado * A.fondo], 0.006, 3, { pincel: 0 });
    }
    for (let i = 1; i < 4; i++) {
      const t = i / 4, yy = ya - t * (A.alto - 0.05), vv = v + lado * A.fondo * t;
      P.palo('#d8d0bc', [-A.ancho / 2, yy, vv], [A.ancho / 2, yy, vv], 0.006, 3, { pincel: 0 });
    }
  }
  // las estacas de las esquinas, con un trapito
  for (const su of [-1, 1]) for (const sv of [-1, 1]) {
    const u = su * W2, v = sv * L2, y0 = suelo(u, v);
    P.palo('#6d5038', [u, y0 - 0.1, v], [u, y0 + 0.7, v], 0.025, 5);
    P.caja(su * sv > 0 ? '#b03a2a' : '#d8b040', 0.16, 0.1, 0.01, [u + 0.08, y0 + 0.62, v], [0, 0.4, 0], { pincel: 0.05 });
  }
  // un banco de troncos al costado, para los que esperan
  for (const dv of [-2, 2]) {
    const u = W2 + 1.6, y0 = suelo(u, dv);
    P.cil('#6b5040', 0.2, 0.2, 1.8, [u, y0 + 0.17, dv], [PI / 2, 0, 0], 8, { pincel: 0.2 });
  }
  return P.geometria();
}
function modeloPelota() {
  const g = new THREE.SphereGeometry(PELOTA.radio, 14, 10);
  const P = new Pieza();
  P.geo(g, '#e8dcc0', [0, 0, 0], [0, 0, 0], [1, 1, 1], { pincel: 0.05, arriba: 0.04 });
  // los gajos de cuero cosido: oscurece en bandas
  for (let i = 0; i < P.p.length; i += 3) {
    const x = P.p[i], y = P.p[i + 1], z = P.p[i + 2];
    const banda = Math.abs(Math.sin(Math.atan2(z, x) * 3)) < 0.18 || Math.abs(y) < 0.012;
    if (banda) { P.c[i] *= 0.45; P.c[i + 1] *= 0.38; P.c[i + 2] *= 0.3; }
  }
  return P.geometria();
}
// Un cantero de tablas con la tierra negra (2,2 × 0,9 m, 30 cm de alto), en el marco del cantero; `suelo(lx, lz)` el piso
function cantero(P, cx, cz, rot, suelo, ox = 0, oz = 0) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const w = (lx, lz) => [cx + lx * c + lz * s, cz - lx * s + lz * c];
  const [x, z] = w(0, 0), y0 = suelo(x, z);
  P.caja('#3b2a1e', 2.1, 0.08, 0.8, [x - ox, y0 + 0.3, z - oz], [0, rot, 0], { pincel: 0.25, arriba: 0 });   // la tierra
  for (const sz of [-1, 1]) { const [a, b] = w(0, sz * 0.43); P.caja('#7b5a3e', 2.3, 0.32, 0.06, [a - ox, y0 + 0.14, b - oz], [0, rot, 0], { pincel: 0.18 }); }
  for (const sx of [-1, 1]) { const [a, b] = w(sx * 1.13, 0); P.caja('#74553a', 0.06, 0.32, 0.86, [a - ox, y0 + 0.14, b - oz], [0, rot, 0], { pincel: 0.18 }); }
}
// La huerta comunitaria: cuatro canteros en 2 × 2, el cerco de palo con la tranquera abierta y el cartel
function modeloHuerta(canteros, sueloMundo, centro, rot) {
  const P = new Pieza(), ox = centro.x, oz = centro.z, oy = centro.y;
  const suelo = (x, z) => sueloMundo(x, z) - oy;
  for (const k of canteros) cantero(P, k.x, k.z, k.rot, suelo, ox, oz);
  // el cerco: postes cada 1,5 m alrededor (9 × 6), con dos varas; la tranquera, del lado de la calle
  const L = LUGARES_RINCONES.huerta, c = Math.cos(rot), s = Math.sin(rot);
  const w = (u, v) => ({ x: ox + u * c + v * s, z: oz - u * s + v * c });
  const esquinas = [[-L.ancho / 2, -L.largo / 2], [L.ancho / 2, -L.largo / 2], [L.ancho / 2, L.largo / 2], [-L.ancho / 2, L.largo / 2]];
  for (let i = 0; i < 4; i++) {
    const [u0, v0] = esquinas[i], [u1, v1] = esquinas[(i + 1) % 4], largo = Math.hypot(u1 - u0, v1 - v0), n = Math.max(2, Math.round(largo / 1.5));
    let prev = null;
    for (let j = 0; j <= n; j++) {
      const t = j / n, u = u0 + (u1 - u0) * t, v = v0 + (v1 - v0) * t;
      // la tranquera: un hueco de 1,5 m en el medio del lado de −u (el que da a la calle Norte)
      const hueco = i === 3 && Math.abs(v) < 0.8;
      const q = w(u, v), y0 = suelo(q.x, q.z);
      if (!hueco) P.palo('#6a4e36', [q.x - ox, y0 - 0.15, q.z - oz], [q.x - ox, y0 + 1.05, q.z - oz], 0.045, 5, { pincel: 0.25 });
      if (prev && !hueco && !prev.hueco) for (const h of [0.45, 0.9]) P.palo('#7d5c40', [prev.x - ox, prev.y + h, prev.z - oz], [q.x - ox, y0 + h, q.z - oz], 0.025, 4);
      prev = { x: q.x, z: q.z, y: y0, hueco };
    }
  }
  // el cartel «Huerta de todos» (una tabla pintada, sin letras: el nombre lo dice el aviso)
  const q = w(-L.ancho / 2 - 0.3, 1.4), y0 = suelo(q.x, q.z);
  P.palo('#6a4e36', [q.x - ox, y0 - 0.1, q.z - oz], [q.x - ox, y0 + 1.25, q.z - oz], 0.04, 5);
  P.caja('#c8b48a', 0.06, 0.32, 0.9, [q.x - ox - 0.05, y0 + 1.15, q.z - oz], [0, rot, 0], { pincel: 0.1 });
  for (let i = 0; i < 3; i++) P.caja(['#4a6a3a', '#a03a28', '#d8a040'][i], 0.065, 0.05, 0.16, [q.x - ox - 0.06, y0 + 1.15 + (i - 1) * 0.08, q.z - oz + (i - 1) * 0.22], [0, rot, 0], { pincel: 0 });
  // una regadera y un balde
  const r = w(L.ancho / 2 - 0.6, -L.largo / 2 + 0.5), yr = suelo(r.x, r.z);
  P.cil('#6e7a78', 0.13, 0.11, 0.26, [r.x - ox, yr + 0.13, r.z - oz], [0, 0, 0], 9);
  P.palo('#6e7a78', [r.x - ox + 0.1, yr + 0.2, r.z - oz], [r.x - ox + 0.32, yr + 0.34, r.z - oz], 0.015, 4);
  return P.geometria();
}
// La huerta de los chicos: dos canteros chicos con sus carteles pintados
function modeloHuertaChicos(canteros, sueloMundo, centro) {
  const P = new Pieza(), ox = centro.x, oz = centro.z, oy = centro.y;
  const suelo = (x, z) => sueloMundo(x, z) - oy;
  canteros.forEach((k, i) => {
    cantero(P, k.x, k.z, k.rot, suelo, ox, oz);
    const c = Math.cos(k.rot), s = Math.sin(k.rot), qx = k.x + 1.25 * c, qz = k.z - 1.25 * s, y0 = suelo(qx, qz);
    P.palo('#7a5a3c', [qx - ox, y0 - 0.1, qz - oz], [qx - ox, y0 + 0.6, qz - oz], 0.025, 5);
    P.caja(i === 0 ? '#e8b0b8' : '#a8c8e0', 0.36, 0.22, 0.03, [qx - ox, y0 + 0.62, qz - oz], [0, k.rot + PI / 2, 0], { pincel: 0.06 });
    P.bola(i === 0 ? '#c8322a' : '#3b2c5c', 0.04, [qx - ox, y0 + 0.62, qz - oz + 0.03]);
  });
  return P.geometria();
}
// El retablo de los títeres: un teatrito de tablas pintado de verde con la guarda, la boca con cortinas coloradas
function modeloRetablo() {
  const P = new Pieza();
  P.caja('#3e6a5a', 1.7, 1.55, 0.5, [0, 0.375, 0], [0, 0, 0], { pincel: 0.1 });                 // el cuerpo de abajo (entra 40 cm en el piso)
  for (let i = 0; i < 7; i++) P.caja(i % 2 ? '#d8b040' : '#a03a28', 0.22, 0.08, 0.02, [-0.66 + i * 0.22, 1.02, 0.26], [0, 0, 0], { pincel: 0 });   // la guarda
  for (const sx of [-1, 1]) P.caja('#3e6a5a', 0.22, 0.75, 0.5, [sx * 0.74, 1.52, 0], [0, 0, 0]);   // los costados de la boca
  P.caja('#3e6a5a', 1.7, 0.32, 0.5, [0, 2.05, 0], [0, 0, 0]);                                       // el dintel
  P.caja('#d8b040', 1.5, 0.06, 0.04, [0, 2.12, 0.26], [0, 0, 0], { pincel: 0 });
  P.cono('#a03a28', 0.22, 0.32, [0, 2.36, 0], [0, PI / 4, 0], 4);                                   // el remate
  for (const sx of [-1, 1]) P.caja('#b02a28', 0.24, 0.66, 0.04, [sx * 0.52, 1.5, 0.2], [0, 0, sx * 0.05], { pincel: 0.2 });   // las cortinas
  P.caja('#2a2420', 1.26, 0.7, 0.04, [0, 1.5, -0.2], [0, 0, 0], { pincel: 0 });                    // el fondo oscuro
  P.caja('#5a4a3a', 1.3, 0.05, 0.3, [0, 1.15, 0.05], [0, 0, 0]);                                    // la repisa
  return P.geometria();
}
// Los títeres (el zorro y el pudú), en el marco del retablo
function modeloTiteres() {
  const P = new Pieza();
  // el zorro colorado: hocico, orejas, pecho blanco
  P.cil('#b0562a', 0.07, 0.09, 0.28, [-0.25, 1.3, 0.05], [0, 0, 0], 8);
  P.bola('#c0602e', 0.085, [-0.25, 1.5, 0.05]);
  P.cono('#c0602e', 0.05, 0.12, [-0.25, 1.48, 0.15], [PI / 2, 0, 0], 6);
  P.bola('#1e1a18', 0.016, [-0.25, 1.48, 0.21]);
  for (const sx of [-1, 1]) P.cono('#9a4a24', 0.03, 0.08, [-0.25 + sx * 0.05, 1.6, 0.04], [0, 0, -sx * 0.3], 4);
  P.bola('#efe6d8', 0.05, [-0.25, 1.38, 0.1], [1, 1.2, 0.6]);
  // el pudú: marroncito, orejas redondas, cuernitos
  P.cil('#6e4a32', 0.07, 0.09, 0.28, [0.25, 1.3, 0.05], [0, 0, 0], 8);
  P.bola('#7a5236', 0.08, [0.25, 1.5, 0.05]);
  P.bola('#3a2a20', 0.025, [0.25, 1.48, 0.13]);
  for (const sx of [-1, 1]) { P.bola('#7a5236', 0.035, [0.25 + sx * 0.08, 1.56, 0.03], [1, 1, 0.4]); P.cono('#4a3a2a', 0.012, 0.06, [0.25 + sx * 0.03, 1.6, 0.04], [0, 0, 0], 4); }
  return P.geometria();
}
// Tu talla: una figura de madera de tu tamaño, con sombrero, mochila y el cuaderno bajo el brazo, sobre un tocón
function modeloTalla() {
  const P = new Pieza(), M = '#a07650', O = '#7d5a3a';
  P.cil('#5e4a38', 0.42, 0.48, 0.4, [0, 0.2, 0], [0, 0, 0], 10, { pincel: 0.2 });
  P.cil('#6d5642', 0.41, 0.41, 0.02, [0, 0.41, 0], [0, 0, 0], 10);
  for (const sx of [-1, 1]) { P.cil(O, 0.075, 0.085, 0.82, [sx * 0.11, 0.83, 0], [0, 0, 0], 7); P.caja('#5a4030', 0.14, 0.09, 0.26, [sx * 0.11, 0.46, 0.04], [0, 0, 0]); }
  P.geo(new THREE.LatheGeometry([[0.16, 1.2], [0.2, 1.3], [0.22, 1.55], [0.2, 1.7], [0.08, 1.78], [0.001, 1.8]].map(([r, y]) => new THREE.Vector2(r, y)), 10), M, [0, 0, 0], [0, 0, 0], [1, 1, 0.75], { pincel: 0.18 });
  P.caja('#6a4c32', 0.4, 0.5, 0.2, [0, 1.48, -0.2], [0, 0, 0], { pincel: 0.15 });                  // la mochila
  P.caja('#8a6a44', 0.36, 0.1, 0.16, [0, 1.76, -0.2], [0, 0, 0]);
  for (const sx of [-1, 1]) P.palo(O, [sx * 0.22, 1.66, 0], [sx * 0.27, 1.22, 0.06], 0.055, 6);
  P.caja('#c8a878', 0.03, 0.22, 0.16, [0.29, 1.3, 0.06], [0, 0, 0.1]);                             // el cuaderno bajo el brazo
  P.bola('#b88a5e', 0.11, [0, 1.93, 0.01], [1, 1.12, 1]);
  P.bola('#a87a50', 0.022, [0, 1.92, 0.115]);
  P.cil('#6a4c32', 0.24, 0.24, 0.02, [0, 2.03, 0], [0.08, 0, -0.06], 12);                          // el ala del sombrero, torcida
  P.cil('#6a4c32', 0.11, 0.12, 0.13, [0, 2.1, 0], [0.08, 0, -0.06], 10);
  return P.geometria();
}
// El atril con tu cuaderno (el cuaderno se ve aparte, cuando dejaste la copia)
function modeloAtril() {
  const P = new Pieza();
  P.caja('#5a4030', 0.42, 0.04, 0.42, [0, 0.02, 0], [0, 0, 0]);
  P.cil('#6b4c34', 0.04, 0.05, 1.0, [0, 0.52, 0], [0, 0, 0], 6);
  P.caja('#6b4c34', 0.5, 0.03, 0.38, [0, 1.05, 0], [-0.35, 0, 0], { pincel: 0.12 });
  return P.geometria();
}
function modeloCuaderno() {
  const P = new Pieza();
  for (const sx of [-1, 1]) P.caja('#e8dcc0', 0.2, 0.025, 0.28, [sx * 0.105, 1.085, 0.0], [-0.35, 0, sx * -0.05], { pincel: 0.04 });
  P.caja('#6a3a28', 0.43, 0.012, 0.3, [0, 1.068, 0.0], [-0.35, 0, 0]);
  return P.geometria();
}
// El fuerte del bosque, de una etapa (1 los palos, 2 las paredes de ramas, 3 el techo de colihue y la bandera). Todo en
// el marco del fuerte; `suelo(lx, lz)` relativo al centro.
function modeloFuerte(etapa, suelo) {
  const P = new Pieza();
  const R = 1.7, n = 13;
  if (etapa <= 0) {
    // el lugar elegido: unos palos cruzados y un círculo de piedras
    for (let i = 0; i < 5; i++) { const a = i * 1.3; P.palo('#6a4e36', [Math.cos(a) * 0.6, suelo(0, 0) + 0.05, Math.sin(a) * 0.6], [Math.cos(a + 2.4) * 0.7, suelo(0, 0) + 0.12, Math.sin(a + 2.4) * 0.7], 0.035, 5); }
    return P.geometria();
  }
  // los palos parados en un arco de 260° (la entrada mira a +Z)
  for (let i = 0; i <= n; i++) {
    const a = -PI / 2 - 0.4 + (i / n) * (PI * 2 - 1.4), x = Math.cos(a) * R, z = Math.sin(a) * R, y0 = suelo(x, z);
    const alto = 1.25 + ruido(i, 1, 2) * 0.35;
    P.palo(i % 3 ? '#6a4e36' : '#7b5c40', [x, y0 - 0.15, z], [x * 0.98, y0 + alto, z * 0.98], 0.05 + ruido(i, 2, 3) * 0.02, 5, { pincel: 0.3, punta: 0.7 });
  }
  if (etapa >= 2) {
    // las paredes: ramas atravesadas en tres alturas
    for (let f = 0; f < 3; f++) for (let i = 0; i < n; i++) {
      const a0 = -PI / 2 - 0.4 + (i / n) * (PI * 2 - 1.4), a1 = -PI / 2 - 0.4 + ((i + 1) / n) * (PI * 2 - 1.4);
      const h = 0.3 + f * 0.35 + ruido(i, f, 5) * 0.08;
      P.palo('#5e4a34', [Math.cos(a0) * (R + 0.06), suelo(Math.cos(a0) * R, Math.sin(a0) * R) + h, Math.sin(a0) * (R + 0.06)], [Math.cos(a1) * (R + 0.06), suelo(Math.cos(a1) * R, Math.sin(a1) * R) + h + 0.05, Math.sin(a1) * (R + 0.06)], 0.022, 4, { pincel: 0.3 });
    }
    // ramas con hojas de coihue apoyadas contra las paredes (de afuera, inclinadas)
    for (let i = 0; i < 16; i++) {
      const a = -PI / 2 - 0.3 + (i / 16) * (PI * 2 - 1.6), x0 = Math.cos(a) * (R + 0.55), z0 = Math.sin(a) * (R + 0.55), x1 = Math.cos(a + 0.12) * (R + 0.05), z1 = Math.sin(a + 0.12) * (R + 0.05);
      P.palo('#5a4632', [x0, suelo(x0, z0) - 0.05, z0], [x1, suelo(x1, z1) + 1.15 + ruido(i, 4, 2) * 0.3, z1], 0.025, 4, { pincel: 0.3 });
      P.cono(i % 2 ? '#3e5a2c' : '#4a6632', 0.2, 0.55, [(x0 + x1) / 2, suelo(x1, z1) + 0.75, (z0 + z1) / 2], [0.3, a, 0.5], 5, { pincel: 0.3 });
    }
  }
  if (etapa >= 3) {
    // el techo de colihue: cañas del borde al palo del medio
    const yc = suelo(0, 0) + 2.1;
    P.palo('#6a4e36', [0, suelo(0, 0) - 0.2, 0], [0, yc + 0.1, 0], 0.06, 6);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * PI * 2, x = Math.cos(a) * (R + 0.15), z = Math.sin(a) * (R + 0.15); P.palo('#b8a868', [x, suelo(x, z) + 1.3, z], [0, yc, 0], 0.018, 4, { pincel: 0.15 }); }
    // la bandera: una media a rayas en un palito
    P.palo('#7a5a3c', [0, yc, 0], [0, yc + 0.9, 0], 0.02, 4);
    P.caja('#c84a3a', 0.02, 0.18, 0.32, [0, yc + 0.78, 0.17], [0, 0, 0], { pincel: 0 });
    P.caja('#e8e0d0', 0.021, 0.06, 0.32, [0, yc + 0.78, 0.17], [0, 0, 0], { pincel: 0 });
  }
  return P.geometria();
}
// El fogón del campamento (siempre, una vez hecho el fuerte) y la carpa (sólo la noche del campamento)
function modeloFogon(suelo) {
  const P = new Pieza();
  for (let i = 0; i < 9; i++) { const a = (i / 9) * PI * 2, x = Math.cos(a) * 0.55, z = Math.sin(a) * 0.55; P.bola(i % 2 ? '#7d776c' : '#6a655c', 0.14, [x, suelo(x, z) + 0.06, z], [1.2, 0.7, 1], [6, 4], { pincel: 0.25 }); }
  for (let i = 0; i < 3; i++) { const a = i * 2.1; P.palo('#4a3426', [Math.cos(a) * 0.35, suelo(0, 0) + 0.06, Math.sin(a) * 0.35], [Math.cos(a + 3.2) * 0.3, suelo(0, 0) + 0.14, Math.sin(a + 3.2) * 0.3], 0.045, 5); }
  // dos troncos para sentarse
  for (const [x, z, r] of [[-1.5, 0.3, 0.3], [1.4, -0.4, -0.4]]) P.cil('#6b5040', 0.17, 0.17, 1.4, [x, suelo(x, z) + 0.15, z], [PI / 2, r, 0], 8, { pincel: 0.2 });
  return P.geometria();
}
function modeloCarpa(suelo) {
  const P = new Pieza(), y0 = suelo(0, -2.2), largo = 2.2, ancho = 1.8, alto = 1.25;
  for (const sx of [-1, 1]) P.caja('#b8823e', Math.hypot(ancho / 2, alto), 0.02, largo, [sx * ancho / 4, y0 + alto / 2, -2.2], [0, 0, -sx * Math.atan2(alto, ancho / 2)], { pincel: 0.12 });
  P.palo('#6a4e36', [0, y0 - 0.05, -2.2 - largo / 2], [0, y0 + alto + 0.06, -2.2 - largo / 2], 0.025, 5);
  P.palo('#6a4e36', [0, y0 - 0.05, -2.2 + largo / 2], [0, y0 + alto + 0.06, -2.2 + largo / 2], 0.025, 5);
  P.palo('#6a4e36', [0, y0 + alto + 0.03, -2.2 - largo / 2], [0, y0 + alto + 0.03, -2.2 + largo / 2], 0.02, 4);
  // la tapa del fondo (un triángulo hecho de una caja angosta girada) y la entrada abierta
  P.geo(new THREE.ConeGeometry(ancho * 0.58, alto, 3, 1, true), '#9a6a30', [0, y0 + alto / 2, -2.2 - largo / 2 + 0.02], [0, PI, 0], [1, 1, 0.02]);
  P.caja('#3e5a6a', 1.3, 0.05, 1.8, [0, y0 + 0.03, -2.2], [0, 0, 0], { pincel: 0.1 });   // la bolsa de dormir
  return P.geometria();
}
// El sulky: dos ruedas altas de rayos, el asiento de lenga, el respaldo y las varas hacia el caballo. Se arma en su
// marco: +Z adelante (hacia el caballo), el eje de las ruedas en y = 0,62.
function modeloSulky() {
  const cuerpo = new Pieza();
  cuerpo.caja('#8a6446', 1.1, 0.07, 0.55, [0, 0.95, -0.05], [0, 0, 0], { pincel: 0.15 });                 // el asiento
  cuerpo.caja('#7a5638', 1.1, 0.4, 0.05, [0, 1.18, -0.3], [-0.12, 0, 0], { pincel: 0.15 });              // el respaldo
  cuerpo.caja('#3e6a5a', 1.05, 0.2, 0.62, [0, 0.82, -0.05], [0, 0, 0], { pincel: 0.1 });                 // la caja, pintada
  for (const sx of [-1, 1]) cuerpo.caja('#d8b040', 0.02, 0.04, 0.6, [sx * 0.53, 0.86, -0.05], [0, 0, 0], { pincel: 0 });
  cuerpo.caja('#5a4030', 0.9, 0.05, 0.4, [0, 0.55, 0.45], [0.3, 0, 0]);                                   // el apoyapiés
  for (const sx of [-1, 1]) {
    cuerpo.palo('#6d5038', [sx * 0.42, 0.78, -0.4], [sx * 0.42, 0.95, 2.9], 0.035, 6);                   // las varas
    cuerpo.palo('#3a3430', [sx * 0.48, 0.62, 0], [sx * 0.42, 0.82, 0], 0.03, 5);                          // el elástico
  }
  cuerpo.palo('#3a3430', [-0.62, 0.62, 0], [0.62, 0.62, 0], 0.03, 6);                                     // el eje
  const rueda = new Pieza();
  rueda.geo(new THREE.TorusGeometry(0.6, 0.03, 5, 22), '#5a4030', [0, 0, 0], [0, PI / 2, 0], [1, 1, 1], { pincel: 0.1 });
  rueda.geo(new THREE.TorusGeometry(0.62, 0.012, 4, 22), '#2e2a28', [0, 0, 0], [0, PI / 2, 0]);
  rueda.cil('#4a3426', 0.07, 0.07, 0.1, [0, 0, 0], [0, 0, PI / 2], 8);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; rueda.palo('#6d5038', [0, 0, 0], [0, Math.cos(a) * 0.59, Math.sin(a) * 0.59], 0.012, 4, { pincel: 0 }); }
  return { cuerpo: cuerpo.geometria(), rueda: rueda.geometria() };
}
// El banco del taller del refugio: la mesa con morsa, el tablero con las herramientas y el estante de los adornos
function modeloTaller() {
  const P = new Pieza();
  P.caja('#8a6446', 1.9, 0.08, 0.7, [0, 0.86, 0], [0, 0, 0], { pincel: 0.15 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.caja('#6d5038', 0.08, 0.86, 0.08, [sx * 0.85, 0.43, sz * 0.28], [0, 0, 0]);
  P.caja('#6d5038', 1.7, 0.05, 0.55, [0, 0.25, 0], [0, 0, 0]);
  P.caja('#3a3836', 0.16, 0.14, 0.12, [0.75, 0.97, 0.28], [0, 0, 0]);                       // la morsa
  P.palo('#3a3836', [0.75, 0.97, 0.38], [0.75, 0.97, 0.5], 0.012, 4);
  // el tablero de las herramientas, atrás
  P.caja('#7a5638', 1.8, 0.9, 0.04, [0, 1.55, -0.38], [0, 0, 0], { pincel: 0.12 });
  for (const sx of [-1, 1]) P.caja('#6d5038', 0.07, 2.0, 0.07, [sx * 0.92, 1.0, -0.38], [0, 0, 0]);
  P.caja('#9aa0a4', 0.42, 0.12, 0.012, [-0.5, 1.62, -0.35], [0, 0, 0.1], { pincel: 0.05 });   // el serrucho
  P.caja('#5a3e2a', 0.05, 0.16, 0.02, [-0.27, 1.6, -0.35], [0, 0, 0.1]);
  P.palo('#5a3e2a', [0.05, 1.4, -0.34], [0.05, 1.72, -0.34], 0.018, 5);                         // el martillo
  P.caja('#3a3836', 0.16, 0.05, 0.05, [0.05, 1.74, -0.34], [0, 0, 0]);
  P.palo('#5a3e2a', [0.35, 1.45, -0.34], [0.42, 1.75, -0.34], 0.015, 5);                        // el formón
  P.caja('#9aa0a4', 0.03, 0.12, 0.012, [0.33, 1.38, -0.34], [0, 0, 0.2]);
  // el estante para lo que hacés
  P.caja('#8a6446', 1.6, 0.04, 0.24, [0, 2.05, -0.28], [0, 0, 0]);
  for (const sx of [-1, 1]) P.caja('#6d5038', 0.04, 0.16, 0.2, [sx * 0.7, 1.97, -0.28], [0, 0, 0]);
  // unas virutas en el piso
  for (let i = 0; i < 6; i++) P.bola('#c8a878', 0.035, [-0.6 + i * 0.25, 0.02, 0.3 + ruido(i, 1, 1) * 0.2], [1.6, 0.3, 1]);
  return P.geometria();
}
function modeloAdornos(lista) {
  const P = new Pieza();
  lista.forEach((k, i) => {
    const x = -0.6 + i * 0.24, y = 2.07;
    if (k === 'jarro') { P.cil(['#a8583a', '#9a6a4a', '#b07050'][i % 3], 0.06, 0.05, 0.14, [x, y + 0.07, -0.28], [0, 0, 0], 9); P.geo(new THREE.TorusGeometry(0.035, 0.008, 4, 8), '#a8583a', [x + 0.065, y + 0.08, -0.28], [0, 0, 0]); }
    else { P.caja('#5a4030', 0.2, 0.16, 0.02, [x, y + 0.09, -0.36], [-0.15, 0, 0]); P.caja(['#6a8aa8', '#7a9a5a', '#c8a050'][i % 3], 0.17, 0.13, 0.021, [x, y + 0.09, -0.355], [-0.15, 0, 0], { pincel: 0.3 }); }
  });
  return P.vacia() ? null : P.geometria();
}
// Un farol del camino: el poste de palo, el brazo y la caja del farol (el vidrio va aparte, con su brillo)
function modeloFarol() {
  const P = new Pieza();
  P.palo('#5a4030', [0, -0.3, 0], [0, 2.6, 0], 0.07, 6, { pincel: 0.2 });
  P.palo('#3a3430', [0, 2.4, 0], [0.42, 2.52, 0], 0.02, 4);
  P.caja('#2e2a26', 0.2, 0.04, 0.2, [0.45, 2.5, 0], [0, 0, 0]);
  P.cono('#2e2a26', 0.17, 0.14, [0.45, 2.53, 0], [0, PI / 4, 0], 4);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.palo('#2e2a26', [0.45 + sx * 0.08, 2.48, sz * 0.08], [0.45 + sx * 0.07, 2.22, sz * 0.07], 0.008, 3);
  P.caja('#2e2a26', 0.16, 0.03, 0.16, [0.45, 2.2, 0], [0, 0, 0]);
  return P.geometria();
}
function modeloVidrioFarol() {
  const g = new THREE.BoxGeometry(0.13, 0.24, 0.13);
  g.translate(0.45, 2.34, 0);
  const n = g.attributes.position.count, c = new Float32Array(n * 3).fill(1);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
// El puentecito de troncos sobre el arroyo (a lo largo de su Z), con barandas de palo
function modeloPuente(largo, ancho = 2.2) {
  const P = new Pieza();
  for (const sx of [-1, 1]) P.cil('#5e4636', 0.17, 0.19, largo + 0.6, [sx * (ancho / 2 - 0.15), -0.18, 0], [PI / 2, 0, 0], 8, { pincel: 0.2 });
  const n = Math.round(largo / 0.24);
  for (let i = 0; i <= n; i++) { const z = -largo / 2 + (i / n) * largo; P.caja(i % 3 ? '#7a5a40' : '#6d5038', ancho, 0.07, 0.22, [0, 0, z], [0, 0, (ruido(i, 1, 1) - 0.5) * 0.03], { pincel: 0.2 }); }
  for (const sx of [-1, 1]) {
    for (let i = 0; i <= 3; i++) { const z = -largo / 2 + (i / 3) * largo; P.palo('#6a4e36', [sx * (ancho / 2 - 0.05), -0.1, z], [sx * (ancho / 2 - 0.05), 0.95, z], 0.05, 5); }
    P.palo('#7b5c40', [sx * (ancho / 2 - 0.05), 0.92, -largo / 2], [sx * (ancho / 2 - 0.05), 0.92, largo / 2], 0.04, 5);
  }
  return P.geometria();
}
// El lote de tu casa: cuatro estacas con hilo y un cartelito
function modeloLote(suelo, ancho, fondo) {
  const P = new Pieza();
  const esq = [[-ancho / 2, -fondo / 2], [ancho / 2, -fondo / 2], [ancho / 2, fondo / 2], [-ancho / 2, fondo / 2]];
  for (let i = 0; i < 4; i++) {
    const [x, z] = esq[i], [x2, z2] = esq[(i + 1) % 4];
    P.palo('#8a6a4a', [x, suelo(x, z) - 0.1, z], [x, suelo(x, z) + 0.6, z], 0.03, 4);
    P.palo('#e8e0d0', [x, suelo(x, z) + 0.5, z], [x2, suelo(x2, z2) + 0.5, z2], 0.006, 3, { pincel: 0 });
  }
  const y0 = suelo(0.5, fondo / 2 + 0.8);
  P.palo('#6a4e36', [0.5, y0 - 0.1, fondo / 2 + 0.8], [0.5, y0 + 1.0, fondo / 2 + 0.8], 0.035, 5);
  P.caja('#c8b48a', 0.7, 0.4, 0.04, [0.5, y0 + 0.95, fondo / 2 + 0.8], [0, 0, 0], { pincel: 0.1 });
  return P.geometria();
}
// El zócalo de piedra de la casa (de abajo del terreno hasta el nivel del lote) y los escalones de la puerta
function modeloZocalo(ancho, fondo, bajo, escalones) {
  const P = new Pieza();
  const alto = Math.max(0.1, -bajo + 0.05);
  P.caja('#77716a', ancho + 0.5, alto, fondo + 0.5, [0, bajo + alto / 2 - 0.05, 0], [0, 0, 0], { pincel: 0.3, arriba: 0.04 });
  // piedras sueltas en la cara, para que no se lea como un bloque
  for (let i = 0; i < 26; i++) {
    const t = ruido(i, 2, 7), lado = i % 4, y = bajo + ruido(i, 5, 1) * Math.max(0.05, alto - 0.15);
    const [x, z] = lado === 0 ? [(t - 0.5) * ancho, fondo / 2 + 0.26] : lado === 1 ? [(t - 0.5) * ancho, -fondo / 2 - 0.26] : lado === 2 ? [ancho / 2 + 0.26, (t - 0.5) * fondo] : [-ancho / 2 - 0.26, (t - 0.5) * fondo];
    P.bola(i % 3 ? '#6e685f' : '#837c70', 0.14 + ruido(i, 3, 3) * 0.06, [x, y, z], [1.4, 0.7, 0.9], [6, 4], { pincel: 0.25 });
  }
  for (const e of escalones) P.caja('#857e72', e.ancho, e.alto, e.fondo, [e.x, e.y - e.alto / 2, e.z], [0, 0, 0], { pincel: 0.25 });
  return P.geometria();
}

// ================================================================ el mundo
// ctx: { T, escena, col, puertas, veg, aldeaMundo, refugio: () => { x, z, puerta, mira } (el refugio de estructuras.js),
//        evitar: () => [{ x, z, radio }] (las construcciones del valle), permitir() (el planificador antitirones) }
export function crearRinconesMundo(ctx) {
  const { T, escena } = ctx;
  const raiz = new THREE.Group(); raiz.name = 'rincones';
  escena.add(raiz);
  const alturaEn = (x, z) => T.altura(x, z);
  const est = {
    duendes: [], camino: null, puentes: [], faroles: [], sulkyParadas: null, tallerSitio: null, casa: null,
    estado: { minga: false, etapaFuerte: -1, etapaCasa: -1, adornos: '', talla: false, cuaderno: false, campamento: false, titeres: false },
  };
  const piezas = {};   // nombre → objeto (para medir y para compilar)
  const info = { dibujos: 0, montarMs: 0 };

  // ------------------------------------------------ los duendes (una malla instanciada para todo el valle)
  function montarDuendes() {
    est.duendes = ubicarDuendes(T, { refugio: ctx.refugio?.() || T.lugares.refugio });
    const geo = modeloDuende();
    const m = new THREE.InstancedMesh(geo, MAT_FAUNA, Math.max(1, est.duendes.length));
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.name = 'rincones-duendes';
    const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    const gorros = ['#ffffff', '#c8dcff', '#d8ffd0', '#fff0c8', '#ffd0d0'];
    est.duendes.forEach((d, i) => {
      M4.compose(new THREE.Vector3(d.x, d.y - 0.02, d.z), q.setFromAxisAngle(_y, d.rot), new THREE.Vector3(1.15, 1.15, 1.15));
      m.setMatrixAt(i, M4);
      m.setColorAt(i, c.set(gorros[i % gorros.length]));
    });
    m.count = est.duendes.length;
    m.instanceMatrix.needsUpdate = true;
    raiz.add(m); piezas.duendes = m;
    // que no los tape el pasto alto ni una mata: se pela un poquito alrededor
    for (const d of est.duendes) if (!d.adentro) { ctx.veg?.despejar?.(d.x, d.z, 0.6, true); pelar(d.x, d.z, 1.5, 0.3); }
  }

  // ------------------------------------------------ el suelo (la máscara del terreno: pasto y sendero, como main.js)
  let mascaraSucia = false;
  function pelar(x, z, radio, sendero = 0) {
    const tex = U.uMascara.value;
    if (!tex?.image?.data) return;
    const masc = tex.image.data;
    const i0 = Math.max(0, Math.floor((x - radio + 512) / 2)), i1 = Math.min(RES, Math.ceil((x + radio + 512) / 2));
    const j0 = Math.max(0, Math.floor((z - radio + 512) / 2)), j1 = Math.min(RES, Math.ceil((z + radio + 512) / 2));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const d = Math.hypot(i * 2 - 512 - x, j * 2 - 512 - z);
      if (d >= radio) continue;
      const k = (j * N + i) * 4, t = Math.min(1, (d / radio) ** 2);
      masc[k] *= t;
      if (sendero > 0) masc[k + 1] = Math.max(masc[k + 1], Math.round(255 * sendero * (1 - t)));
    }
    mascaraSucia = true;
  }
  // un rectángulo (en el marco de `rot`): adentro, el pasto queda en `pasto` (0..1) y el sendero sube a `sendero`; el
  // borde, un metro de transición
  function pelarRect(cx, cz, rot, ancho, largo, pasto = 0.15, sendero = 0) {
    const tex = U.uMascara.value;
    if (!tex?.image?.data) return;
    const masc = tex.image.data, c = Math.cos(rot), s = Math.sin(rot), R = Math.hypot(ancho, largo) / 2 + 1;
    const i0 = Math.max(0, Math.floor((cx - R + 512) / 2)), i1 = Math.min(RES, Math.ceil((cx + R + 512) / 2));
    const j0 = Math.max(0, Math.floor((cz - R + 512) / 2)), j1 = Math.min(RES, Math.ceil((cz + R + 512) / 2));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = i * 2 - 512 - cx, dz = j * 2 - 512 - cz, u = dx * c - dz * s, v = dx * s + dz * c;
      const fuera = Math.max(Math.abs(u) - ancho / 2, Math.abs(v) - largo / 2);
      if (fuera > 1) continue;
      const k = (j * N + i) * 4, w = fuera <= 0 ? 1 : 1 - fuera;
      masc[k] = Math.round(masc[k] * (1 - w * (1 - pasto)));
      if (sendero > 0) masc[k + 1] = Math.max(masc[k + 1], Math.round(255 * sendero * w));
    }
    mascaraSucia = true;
  }
  function subirMascara() { if (mascaraSucia && U.uMascara.value) { U.uMascara.value.needsUpdate = true; mascaraSucia = false; } }

  // ------------------------------------------------ el potrero
  const potrero = { centro: null, rot: 0, pelota: null, piso: null };
  function montarPotrero() {
    const L = lugarEnMundo('potrero');
    const y0 = alturaEn(L.x, L.z);
    potrero.centro = { x: L.x, y: y0, z: L.z }; potrero.rot = L.rotMundo;
    const c = Math.cos(L.rotMundo), s = Math.sin(L.rotMundo);
    // el marco de la cancha: u a lo ancho (la X del lugar), v a lo largo (su Z)
    potrero.aMundo = (u, v) => ({ x: L.x + u * c + v * s, z: L.z - u * s + v * c });
    potrero.aCancha = (x, z) => { const dx = x - L.x, dz = z - L.z; return { u: dx * c - dz * s, v: dx * s + dz * c }; };
    potrero.piso = (u, v) => { const w = potrero.aMundo(u, v); return alturaEn(w.x, w.z) - y0; };
    const g = new THREE.Group(); g.position.set(L.x, y0, L.z); g.rotation.y = L.rotMundo;
    g.add(malla(modeloPotrero(potrero.piso)));
    raiz.add(g); piezas.potrero = g;
    const pel = malla(modeloPelota(), MAT_FAUNA, true); pel.name = 'rincones-pelota';
    raiz.add(pel); piezas.pelota = pel; potrero.pelota = pel;
    // el pasto pelado de las áreas y del medio (un potrero de verdad)
    for (const [u, v, r] of [[0, -CANCHA.largo / 2 + 1.5, 3.4], [0, CANCHA.largo / 2 - 1.5, 3.4], [0, 0, 3], [-2, -5, 2.4], [2.5, 4, 2.6]]) { const w = potrero.aMundo(u, v); pelar(w.x, w.z, r, 0.8); }
    pelarRect(L.x, L.z, L.rotMundo, CANCHA.ancho + 1, CANCHA.largo + 1.5, 0.06, 0.45);
    for (const [u, v] of [[-CANCHA.ancho / 2 - 0.5, 0], [CANCHA.ancho / 2 + 1.6, -2], [CANCHA.ancho / 2 + 1.6, 2]]) { const w = potrero.aMundo(u, v); ctx.veg?.despejar?.(w.x, w.z, 2.5, true); }
    { const w = potrero.aMundo(0, 0); ctx.veg?.despejar?.(w.x, w.z, Math.hypot(CANCHA.largo, CANCHA.ancho) / 2 + 1.5, true); }
  }
  function ponerPelota(p) {
    const m = potrero.pelota;
    if (!m) return;
    const w = potrero.aMundo(p.u, p.v);
    m.position.set(w.x, potrero.centro.y + potrero.piso(p.u, p.v) + PELOTA.radio + p.y, w.z);
    m.rotation.set(p.giro, Math.atan2(p.vu, p.vv) + potrero.rot, 0);
  }

  // ------------------------------------------------ las huertas
  const huertas = { comunitaria: [], chicos: [] };
  function montarHuertas() {
    const L = lugarEnMundo('huerta'), rot = L.rotMundo;
    // los cuatro canteros, en 2 × 2 adentro del cerco (a lo largo de la v del lugar)
    for (let i = 0; i < RINCONES.huerta.canteros; i++) {
      const u = (i % 2 ? 1 : -1) * 1.3, v = (i < 2 ? -1 : 1) * 1.7, w = puntoDeLugar('huerta', u, v);
      huertas.comunitaria.push({ i, x: w.x, z: w.z, rot: rot + PI / 2, y: alturaEn(w.x, w.z), cultivo: CULTIVOS_COMUNITARIA[i] });
    }
    const centro = { x: L.x, y: alturaEn(L.x, L.z), z: L.z };
    const g1 = malla(modeloHuerta(huertas.comunitaria, alturaEn, centro, rot)); g1.position.set(centro.x, centro.y, centro.z);
    raiz.add(g1); piezas.huerta = g1;
    ctx.veg?.despejar?.(L.x, L.z, 5.6, true); pelarRect(L.x, L.z, rot, L.ancho, L.largo, 0.05, 0.3);
    const C = lugarEnMundo('huertaChicos');
    for (let i = 0; i < RINCONES.huertaChicos.canteros; i++) {
      const w = puntoDeLugar('huertaChicos', 0, (i ? 1 : -1) * 2.4);
      huertas.chicos.push({ i, x: w.x, z: w.z, rot: C.rotMundo + PI / 2, y: alturaEn(w.x, w.z), cultivo: CULTIVOS_CHICOS[i] });
    }
    const c2 = { x: C.x, y: alturaEn(C.x, C.z), z: C.z };
    const g2 = malla(modeloHuertaChicos(huertas.chicos, alturaEn, c2)); g2.position.set(c2.x, c2.y, c2.z);
    raiz.add(g2); piezas.huertaChicos = g2;
    ctx.veg?.despejar?.(C.x, C.z, 3.6, true); pelarRect(C.x, C.z, C.rotMundo, 2.6, 7, 0.1, 0.25);
  }

  // ------------------------------------------------ la plaza (retablo y talla), la biblioteca (atril), fuerte, campamento
  const objetos = {};
  function enLugar(id, obj, conPiso = true) {
    const L = lugarEnMundo(id);
    const y = L.piso && EDIFICIOS_ALDEA[L.piso] ? EDIFICIOS_ALDEA[L.piso].y + PISO_ALDEA_RINCONES : alturaEn(L.x, L.z);
    obj.position.set(L.x, y, L.z); obj.rotation.y = L.rotMundo;
    void conPiso;
    return { ...L, y };
  }
  function montarPlaza() {
    const ret = new THREE.Group(); ret.add(malla(modeloRetablo()));
    const tit = malla(modeloTiteres()); tit.visible = false; ret.add(tit);
    objetos.retablo = { g: ret, titeres: tit, L: enLugar('retablo', ret) };
    raiz.add(ret); piezas.retablo = ret;
    const talla = malla(modeloTalla()); talla.visible = false;
    objetos.talla = { g: talla, L: enLugar('talla', talla) };
    raiz.add(talla); piezas.talla = talla;
    const atril = new THREE.Group(); atril.add(malla(modeloAtril(), MAT_FAUNA, false));
    const libro = malla(modeloCuaderno(), MAT_FAUNA, false); libro.visible = false; atril.add(libro);
    objetos.atril = { g: atril, libro, L: enLugar('atril', atril) };
    raiz.add(atril); piezas.atril = atril;
  }
  function montarFuerte() {
    const L = lugarEnMundo('fuerte'), y0 = alturaEn(L.x, L.z), c = Math.cos(L.rotMundo), s = Math.sin(L.rotMundo);
    const suelo = (lx, lz) => alturaEn(L.x + lx * c + lz * s, L.z - lx * s + lz * c) - y0;
    const g = new THREE.Group(); g.position.set(L.x, y0, L.z); g.rotation.y = L.rotMundo;
    const etapas = [0, 1, 2, 3].map((e) => modeloFuerte(e, suelo));
    const m = malla(etapas[0]); g.add(m);
    objetos.fuerte = { g, m, etapas, L: { ...L, y: y0 } };
    raiz.add(g); piezas.fuerte = g;
    ctx.veg?.despejar?.(L.x, L.z, 3.4, true); pelar(L.x, L.z, 3.2, 0.15);
    const K = lugarEnMundo('campamento'), yk = alturaEn(K.x, K.z), ck = Math.cos(K.rotMundo), sk = Math.sin(K.rotMundo);
    const sueloK = (lx, lz) => alturaEn(K.x + lx * ck + lz * sk, K.z - lx * sk + lz * ck) - yk;
    const gk = new THREE.Group(); gk.position.set(K.x, yk, K.z); gk.rotation.y = K.rotMundo;
    const fogon = malla(modeloFogon(sueloK)); fogon.visible = false; gk.add(fogon);
    const carpa = malla(modeloCarpa(sueloK)); carpa.visible = false; gk.add(carpa);
    const geoFuego = new THREE.ConeGeometry(0.22, 0.6, 7, 1, true);
    geoFuego.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geoFuego.attributes.position.count * 3).fill(1), 3));
    const fuego = new THREE.Mesh(geoFuego, fuegoMat);
    fuego.position.set(0, sueloK(0, 0) + 0.32, 0); fuego.visible = false; gk.add(fuego);
    const luz = new THREE.PointLight(0xff9a48, 0, 9, 1.6);
    luz.position.set(0, sueloK(0, 0) + 0.8, 0); gk.add(luz); registrarLuz(luz);
    objetos.campamento = { g: gk, fogon, carpa, fuego, luz, L: { ...K, y: yk } };
    raiz.add(gk); piezas.campamento = gk;
    ctx.veg?.despejar?.(K.x, K.z, 3.6, true); pelar(K.x, K.z, 3.4, 0.12);
  }

  // ------------------------------------------------ el camino, el puentecito y los faroles
  const vidrioFarol = new THREE.MeshBasicMaterial({ color: 0xffc070, vertexColors: true });
  vidrioFarol.name = 'rincones-vidrio';
  const fuegoMat = new THREE.MeshBasicMaterial({ color: 0xff8a30, vertexColors: true });
  fuegoMat.name = 'rincones-fuego';
  function montarCamino() {
    const ref = ctx.refugio?.() || T.lugares.refugio;
    const paradas = paradasSulky(ref);
    est.sulkyParadas = paradas;
    const evitar = [...(ctx.evitar?.() || [])];
    const t0 = performance.now();
    let pts = trazarCamino(T, paradas.refugio.salida, paradas.aldea.salida, { evitar, bosque: (x, z) => T.bosque?.[T.indice(x, z)] ?? 0 });
    if (!pts) pts = [paradas.refugio.salida, paradas.aldea.salida];
    // de la parada a la salida del camino, derecho (las dos puntas)
    pts = [paradas.refugio.punto, ...pts, paradas.aldea.punto];
    est.camino = recorrido(pts);
    info.caminoMs = performance.now() - t0;
    est.puentes = puentesDelCamino(est.camino, T);
    // los árboles y las matas de la huella (desde el principio: es una huella vieja de carro)
    for (const p of est.camino.puntos) ctx.veg?.despejar?.(p.x, p.z, CAMINO.despejar, true);
    pintarCamino(false);
    // el puentecito (con su piso para caminar)
    for (const b of est.puentes) {
      const g = malla(modeloPuente(b.largo)); g.position.set(b.x, b.alto, b.z); g.rotation.y = b.ang;
      raiz.add(g); (piezas.puentes ??= []).push(g);
      ctx.col?.agregarPlataforma?.({ x: b.x, z: b.z, ang: -b.ang + PI / 2, largo: b.largo, ancho: 2.0, alto: b.alto + 0.035, duenio: 'rincones:puente' });
      for (const sx of [-1, 1]) {
        const a = { x: b.x + Math.cos(b.ang) * sx * 1.05 - Math.sin(b.ang) * b.largo / 2, z: b.z - Math.sin(b.ang) * sx * 1.05 - Math.cos(b.ang) * b.largo / 2 };
        const c2 = { x: b.x + Math.cos(b.ang) * sx * 1.05 + Math.sin(b.ang) * b.largo / 2, z: b.z - Math.sin(b.ang) * sx * 1.05 + Math.cos(b.ang) * b.largo / 2 };
        ctx.col?.agregar?.({ seg: true, ax: a.x, az: a.z, bx: c2.x, bz: c2.z, r: 0.08, alturaMin: b.alto - 0.5, alturaMax: b.alto + 1.1, duenio: 'rincones:puente' });
      }
    }
    // los faroles (aparecen con la minga)
    est.faroles = farolesDelCamino(est.camino).filter((f) => !T.agua?.(f.x, f.z));
    const n = Math.max(1, est.faroles.length);
    const postes = new THREE.InstancedMesh(modeloFarol(), MAT_FAUNA, n), vidrios = new THREE.InstancedMesh(modeloVidrioFarol(), vidrioFarol, n);
    const M4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    est.faroles.forEach((f, i) => {
      // el brazo mira al camino
      const haciaCamino = Math.atan2(enCamino(est.camino, f.s).x - f.x, enCamino(est.camino, f.s).z - f.z) - PI / 2;
      M4.compose(new THREE.Vector3(f.x, alturaEn(f.x, f.z), f.z), q.setFromAxisAngle(_y, haciaCamino), new THREE.Vector3(1, 1, 1));
      postes.setMatrixAt(i, M4); vidrios.setMatrixAt(i, M4);
    });
    for (const m of [postes, vidrios]) { m.count = est.faroles.length; m.frustumCulled = false; m.visible = false; m.instanceMatrix.needsUpdate = true; raiz.add(m); }
    postes.castShadow = true; vidrios.castShadow = false;
    piezas.faroles = postes; piezas.vidrios = vidrios;
    for (const f of est.faroles) ctx.veg?.despejar?.(f.x, f.z, 0.9, true);
  }
  // Dónde para el sulky en cada punta: el refugio (al lado del palenque) y la aldea (en la calle de la Vía, antes de la
  // estafeta). `punto`: donde queda el sulky; `salida`: donde empieza el camino de verdad (unos metros más allá).
  function paradasSulky(ref) {
    const p = ref?.puerta || ref, yaw = Number(ref?.mira) || 0;
    const ax = -Math.sin(yaw), az = -Math.cos(yaw), dx = Math.cos(yaw), dz = -Math.sin(yaw);
    const refPunto = { x: p.x + dx * 6.5 + ax * 6, z: p.z + dz * 6.5 + az * 6 };
    const refSalida = { x: refPunto.x + ax * 6, z: refPunto.z + az * 6 };
    const M = marcoAldea();
    const alPunto = M.aMundo(37, 21.5), alSalida = M.aMundo(37, 12);
    return { refugio: { punto: refPunto, salida: refSalida }, aldea: { punto: alPunto, salida: alSalida } };
  }
  // La huella en el suelo (el canal del sendero de la máscara): angosta y apenas marcada antes de la minga; ancha y de
  // ripio después. Se pinta en la textura de la máscara (no suma dibujos).
  function pintarCamino(minga) {
    if (!est.camino) return;
    const ancho = minga ? CAMINO.anchoMinga : CAMINO.ancho;
    for (const p of est.camino.puntos) {
      if (est.puentes.some((b) => Math.hypot(p.x - b.x, p.z - b.z) < b.largo / 2)) continue;
      pelar(p.x, p.z, ancho / 2 + 1.2, minga ? 0.95 : 0.6);
    }
    subirMascara();
  }

  // ------------------------------------------------ el sulky
  const sulky = { g: null, ruedas: [], giro: 0 };
  function montarSulky() {
    const m = modeloSulky();
    const g = new THREE.Group(); g.name = 'rincones-sulky';
    g.add(malla(m.cuerpo));
    for (const sx of [-1, 1]) { const r = malla(m.rueda); r.position.set(sx * 0.66, 0.62, 0); g.add(r); sulky.ruedas.push(r); }
    g.visible = false;
    raiz.add(g); piezas.sulky = g; sulky.g = g;
  }
  // `pose`: { x, z, rumbo, v } o null (no hay sulky)
  function ponerSulky(pose, dt = 0) {
    if (!sulky.g) return;
    if (!pose) { sulky.g.visible = false; return; }
    sulky.g.visible = true;
    const y = alturaEn(pose.x, pose.z);
    // la inclinación: lo que sube el camino entre las ruedas y el caballo
    const ad = { x: pose.x + Math.sin(pose.rumbo) * 1.4, z: pose.z + Math.cos(pose.rumbo) * 1.4 };
    const pitch = -Math.atan2(alturaEn(ad.x, ad.z) - y, 1.4) * 0.8;
    const enPuente = est.puentes.find((b) => Math.hypot(pose.x - b.x, pose.z - b.z) < b.largo / 2 + 0.3);
    sulky.g.position.set(pose.x, enPuente ? Math.max(y, enPuente.alto + 0.035) : y, pose.z);
    sulky.g.rotation.set(pitch, pose.rumbo, 0, 'YXZ');
    sulky.giro += ((pose.v || 0) * dt) / 0.62;
    for (const r of sulky.ruedas) r.rotation.x = sulky.giro;
  }

  // ------------------------------------------------ el taller del refugio
  const taller = { g: null, adornos: null };
  function montarTaller() {
    const ref = ctx.refugio?.() || T.lugares.refugio;
    const p = ref?.puerta || ref, yaw = Number(ref?.mira) || 0;
    const ax = -Math.sin(yaw), az = -Math.cos(yaw), dx = Math.cos(yaw), dz = -Math.sin(yaw);
    // del otro lado de la puerta que el palenque, contra la pared del frente, bajo el alero
    const x = p.x - dx * 2.75 - ax * 2.15, z = p.z - dz * 2.75 - az * 2.15;
    const g = new THREE.Group(); g.position.set(x, alturaEn(x, z), z); g.rotation.y = yaw + PI;
    g.add(malla(modeloTaller()));
    g.visible = false;
    raiz.add(g); piezas.taller = g; taller.g = g;
    est.tallerSitio = { x: x + ax * 0.75, z: z + az * 0.75, y: g.position.y, mira: yaw + PI };
    taller.choque = { x, z, r: 0.8, alturaMin: g.position.y - 0.2, alturaMax: g.position.y + 2.1, duenio: 'rincones:taller' };
  }
  function ponerAdornos(lista) {
    const k = lista.join(',');
    if (k === est.estado.adornos) return;
    est.estado.adornos = k;
    if (taller.adornos) { taller.g.remove(taller.adornos); taller.adornos.geometry.dispose(); taller.adornos = null; }
    const geo = modeloAdornos(lista);
    if (geo) { taller.adornos = malla(geo, MAT_FAUNA, false); taller.g.add(taller.adornos); }
  }

  // ------------------------------------------------ tu casa (las de la aldea, con sus materiales)
  const casa = { g: null, interior: null, etapa: -1, sitio: null, zocalo: null, lote: null, puertas: [] };
  function sitioCasa() {
    const L = loteEnMundo(ctx.parada);
    const { ancho, fondo } = CASA_PROPIA, c = Math.cos(L.rot), s = Math.sin(L.rot);
    let mx = -Infinity, mn = Infinity;
    for (let u = -ancho / 2 - 0.3; u <= ancho / 2 + 0.3; u += 0.5) for (let v = -fondo / 2 - 0.3; v <= fondo / 2 + 0.3; v += 0.5) {
      const h = alturaEn(L.x + u * c + v * s, L.z - u * s + v * c); mx = Math.max(mx, h); mn = Math.min(mn, h);
    }
    // el nivel del lote: arriba de todo (el zócalo salva lo que baja); la puerta (+Z del edificio) da a la calle
    const y = mx + 0.05;
    const frente = { u: 0, v: fondo / 2 + 0.9 };
    const yFrente = alturaEn(L.x + frente.u * c + frente.v * s, L.z - frente.u * s + frente.v * c);
    return { x: L.x, z: L.z, rot: L.rot, y, bajo: mn - y - 0.25, desnivelPuerta: y - yFrente };
  }
  function montarCasa(etapa) {
    const s = casa.sitio || (casa.sitio = sitioCasa());
    const mats = ctx.aldeaMundo?.materiales?.();
    // lo de antes, afuera
    if (casa.g) { raiz.remove(casa.g); casa.g.traverse((o) => { if (o.geometry && o !== casa.zocalo && o !== casa.lote) o.geometry.dispose(); }); casa.g = null; casa.interior = null; }
    ctx.col?.eliminarPorDuenio?.('rincones:casa');
    ctx.puertas?.eliminarPorDuenio?.('rincones:casa');
    for (const p of casa.puertas) p?.g?.parent?.remove(p.g);
    casa.puertas = [];
    const g = new THREE.Group(); g.position.set(s.x, s.y, s.z); g.rotation.y = s.rot; g.name = 'rincones-casa';
    const { ancho, fondo } = CASA_PROPIA;
    if (etapa <= 0 || !mats) {
      const suelo = (u, v) => alturaEn(s.x + u * Math.cos(s.rot) + v * Math.sin(s.rot), s.z - u * Math.sin(s.rot) + v * Math.cos(s.rot)) - s.y;
      casa.lote ??= malla(modeloLote(suelo, ancho, fondo));
      g.add(casa.lote);
    } else {
      const d = armarEdificio(etapa >= 4 ? CASA_PROPIA.modelo : CASA_PROPIA.obra, etapa >= 4 ? 4 : etapa, {});
      for (const [capa, geo] of Object.entries(d.exterior)) {
        const mat = capa === 'vidrios' ? mats.vidrios : capa === 'carteles' ? null : mats[capa] || mats.estructura;
        if (!geo || !mat) continue;
        const m = new THREE.Mesh(geo, mat); m.castShadow = capa !== 'vidrios'; m.receiveShadow = capa !== 'vidrios'; g.add(m);
      }
      const gi = new THREE.Group();
      for (const [capa, geo] of Object.entries(d.interior)) {
        if (!geo) continue;
        const m = new THREE.Mesh(geo, capa === 'brasas' ? mats.brasas : mats.muebles || mats.estructura); m.receiveShadow = capa !== 'brasas'; gi.add(m);
      }
      gi.visible = false; g.add(gi); casa.interior = gi;
      // el zócalo de piedra y los escalones hasta la calle
      const pasos = [], des = Math.max(0, s.desnivelPuerta), n = Math.ceil(des / 0.18);
      for (let i = 0; i < n; i++) pasos.push({ x: 0, z: fondo / 2 + 0.25 + 0.3 * (i + 0.5), y: -i * (des / Math.max(1, n)), alto: des / Math.max(1, n) + 0.1, ancho: 1.4, fondo: 0.32 });
      casa.zocalo ??= malla(modeloZocalo(ancho, fondo, s.bajo, pasos));
      g.add(casa.zocalo);
      const r = registrarEnMundo({ col: ctx.col, puertas: etapa >= 4 ? ctx.puertas : null }, d, s, { duenio: 'rincones:casa' });
      casa.puertas = r.puertas || [];
      // las plataformas del zócalo y de los escalones
      ctx.col?.agregarPlataforma?.({ x: s.x, z: s.z, ang: -s.rot, largo: ancho + 0.5, ancho: fondo + 0.5, alto: s.y, duenio: 'rincones:casa' });
      const c = Math.cos(s.rot), sn = Math.sin(s.rot);
      for (const p of pasos) ctx.col?.agregarPlataforma?.({ x: s.x + p.x * c + p.z * sn, z: s.z - p.x * sn + p.z * c, ang: -s.rot, largo: p.ancho, ancho: p.fondo, alto: s.y + p.y, duenio: 'rincones:casa' });
      if (s.bajo < -0.1) { const w = (u, v) => ({ x: s.x + u * c + v * sn, z: s.z - u * sn + v * c }); void w; }
    }
    raiz.add(g); casa.g = g; casa.etapa = etapa; piezas.casa = g;
  }

  // ------------------------------------------------ montar todo (en la carga)
  function montar() {
    const t0 = performance.now();
    montarDuendes();
    montarPotrero();
    montarHuertas();
    montarPlaza();
    montarFuerte();
    montarCamino();
    montarSulky();
    montarTaller();
    casa.sitio = sitioCasa();
    ctx.veg?.despejar?.(casa.sitio.x, casa.sitio.z, 4.6, true);
    pelarRect(casa.sitio.x, casa.sitio.z, casa.sitio.rot, CASA_PROPIA.ancho + 2, CASA_PROPIA.fondo + 5, 0.25, 0.12);
    subirMascara();
    info.montarMs = performance.now() - t0;
  }

  // ------------------------------------------------ cada cuadro
  // `e`: lo que manda rincones-juego.js: { pos (el jugador), noche (0..1), minga, etapaFuerte, campamento (la noche del
  // campamento: carpa y fuego), fuerteHecho, talla, cuaderno, titeres (función en curso), adornos, tallerArmado,
  // etapaCasa, pelota (estado de futbol.js o null), sulky (pose o null), tiempo }
  const _cam = new THREE.Vector3();
  function actualizar(dt, e) {
    const pos = e.pos;
    if (!pos) return;
    const lejos = (o, r) => Math.hypot(o.x - pos.x, o.z - pos.z) > r;
    // la aldea y sus rincones
    const enAldea = ctx.aldeaMundo ? !lejos(ctx.aldeaMundo.centro, 330) : true;
    if (piezas.potrero) piezas.potrero.visible = enAldea && !lejos(potrero.centro, VER_ALDEA);
    if (piezas.huerta) piezas.huerta.visible = enAldea && !lejos(piezas.huerta.position, VER_ALDEA);
    if (piezas.huertaChicos) piezas.huertaChicos.visible = enAldea && !lejos(piezas.huertaChicos.position, VER_CERCA + 30);
    if (objetos.retablo) {
      objetos.retablo.g.visible = enAldea && !lejos(objetos.retablo.L, VER_ALDEA);
      objetos.retablo.titeres.visible = !!e.titeres && objetos.retablo.g.visible;
      if (objetos.retablo.titeres.visible) { const t = e.tiempo || 0; objetos.retablo.titeres.position.y = Math.abs(Math.sin(t * 3.1)) * 0.12; objetos.retablo.titeres.rotation.z = Math.sin(t * 2.3) * 0.08; }
    }
    if (objetos.talla) objetos.talla.g.visible = !!e.talla && enAldea && !lejos(objetos.talla.L, VER_ALDEA);
    if (objetos.atril) { objetos.atril.g.visible = enAldea && !lejos(objetos.atril.L, VER_ADENTRO + 5); objetos.atril.libro.visible = !!e.cuaderno; }
    if (objetos.fuerte) {
      const et = Math.max(0, Math.min(3, e.etapaFuerte | 0));
      if (et !== est.estado.etapaFuerte) { objetos.fuerte.m.geometry = objetos.fuerte.etapas[et]; est.estado.etapaFuerte = et; }
      objetos.fuerte.g.visible = !lejos(objetos.fuerte.L, VER_ALDEA);
      const k = objetos.campamento, cerca = !lejos(k.L, VER_ALDEA);
      k.fogon.visible = cerca && (e.fuerteHecho || e.campamento);
      k.carpa.visible = cerca && !!e.campamento;
      k.fuego.visible = cerca && !!e.campamento && (e.noche || 0) > 0.2;
      if (k.fuego.visible) { const t = e.tiempo || 0; k.fuego.scale.set(1 + Math.sin(t * 13) * 0.08, 1 + Math.sin(t * 9.3) * 0.15, 1 + Math.cos(t * 11) * 0.08); }
      k.luz.intensity = k.fuego.visible ? 2.2 * (0.85 + Math.sin((e.tiempo || 0) * 11) * 0.1) : 0;
      k.luz.visible = k.fuego.visible;
    }
    // el camino: faroles con la minga (y la huella se ensancha)
    if (e.minga !== est.estado.minga) { est.estado.minga = !!e.minga; pintarCamino(!!e.minga); }
    if (piezas.faroles) {
      piezas.faroles.visible = !!e.minga;
      piezas.vidrios.visible = !!e.minga;
      const k = 0.25 + 0.95 * (e.noche || 0);
      vidrioFarol.color.setRGB(k, k * 0.72, k * 0.4);
    }
    if (piezas.puentes) for (const b of piezas.puentes) b.visible = !lejos(b.position, 220);
    // el taller del refugio
    if (taller.g) {
      // (el choque del banco, desde que existe)
      if (e.tallerArmado && taller.choque && !taller.conChoque) { ctx.col?.agregar?.(taller.choque); taller.conChoque = true; }
      taller.g.visible = !!e.tallerArmado && !lejos(taller.g.position, VER_CERCA);
      if (taller.g.visible) ponerAdornos(e.adornos || []);
    }
    // la pelota
    if (potrero.pelota) {
      potrero.pelota.visible = !!e.pelota && piezas.potrero.visible;
      if (e.pelota) ponerPelota(e.pelota);
    }
    // el sulky
    ponerSulky(e.sulky || null, dt);
    if (sulky.g?.visible && lejos(sulky.g.position, 240)) sulky.g.visible = false;
    // la casa
    const et = Number.isFinite(e.etapaCasa) ? e.etapaCasa : -1;
    if (et !== casa.etapa && et >= 0 && (casa.etapa < 0 || ctx.permitir?.() !== false)) montarCasa(et);
    if (casa.g) {
      casa.g.visible = enAldea && !lejos(casa.g.position, VER_ALDEA);
      if (casa.interior) casa.interior.visible = casa.g.visible && !lejos(casa.g.position, VER_ADENTRO);
    }
    subirMascara();
    void _cam;
  }

  // ------------------------------------------------ compilar en la carga (todo a la vista un momento)
  let guardado = null;
  function paraCompilar(camara) {
    guardado = [];
    raiz.traverse((o) => { guardado.push([o, o.visible]); o.visible = true; });
    void camara;
  }
  function trasCompilar() {
    if (guardado) for (const [o, v] of guardado) o.visible = v;
    guardado = null;
  }
  function medir() {
    let dibujos = 0, tris = 0;
    raiz.traverseVisible((o) => { if (o.isMesh) { dibujos++; const g = o.geometry, n = g.index ? g.index.count / 3 : g.attributes.position.count / 3; tris += n * (o.isInstancedMesh ? o.count : 1); } });
    return { dibujos, triangulos: Math.round(tris), ...info, duendes: est.duendes.length, camino: est.camino ? Math.round(est.camino.largo) : 0, faroles: est.faroles.length, puentes: est.puentes.length };
  }
  return {
    montar, actualizar, paraCompilar, trasCompilar, medir, raiz,
    duendes: () => est.duendes, camino: () => est.camino, paradas: () => est.sulkyParadas, puentes: () => est.puentes, faroles: () => est.faroles,
    potrero: () => potrero, huertas: () => huertas, taller: () => est.tallerSitio, casa: () => casa,
    lugar: (id) => (objetos[id] ? objetos[id].L : null), sulkyMalla: () => sulky.g,
    armarCasa: (etapa) => montarCasa(etapa),
  };
}
