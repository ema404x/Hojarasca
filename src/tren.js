// 3.7.3 (tren): "La trochita" mejorada en el juego (sólo en el Relax; el Desafío sigue con el tren de siempre de
// trochita.js). Nació como el prototipo de imágenes aprobado por el usuario (`?tren=proto`, rama proto-tren).
// La Baldwin 2-8-2 "La Hojarasca" con su ténder de leña y los vagones que se ven según lo que hiciste en el taller
// ferroviario (src/tren-mejoras.js; las reglas de acá, en tren-viaje.js):
//   · la locomotora: sin mejoras es la vieja (un farolito de kerosén, el quitapiedras, sin arenero, sin banderines,
//     sin nombre pintado); con el taller aparecen el farol con su haz, el quitanieves, el arenero, los banderines,
//     la pintura (cuerpo, franja y ruedas) y el nombre;
//   · los vagones: ténder + hasta 4 de la composición (pasajeros con salamandra, comedor, dormitorio, mirador,
//     furgón de carga, jaula del caballo) o, sin ninguno, los dos coches de segunda de siempre;
//   · `aplicarMejoras(estado)` lo rearma sin tirón: no se arma geometría nueva, sólo cambia qué partes se dibujan
//     (los índices de cada parte, ver abajo), la pintura de los vértices y el nombre del lienzo.
//
// Cómo está hecho (pensado para que cueste poco en la Radeon integrada):
//   · Todo el tren (locomotora, ténder y los diez vagones posibles, por dentro y por fuera) es UNA malla por
//     material, con "piel por huesos" (como la gente de gente-cuerpo.js: el three del juego no trae SkinnedMesh):
//     cada vagón es un hueso (trochita.js lo pone en la vía con `colocar`), cada eje es un hueso hijo que gira, y
//     las bielas, las crucetas y los vástagos son huesos que se mueven con las ruedas. Seis dibujos para todo el
//     tren (estructura, vidrios, fuego, faroles, letras pintadas y el haz del farol de noche).
//   · Las partes: cada triángulo sabe de qué parte es (el vagón, su interior, el farol, el quitanieves, la olla del
//     comedor…) y los índices quedan ordenados por parte. Lo que se dibuja es un tramo del arreglo de índices que se
//     rehace sólo cuando cambia qué partes van (una mejora, la cocina del comedor, el interior que se apaga de lejos).
//     Lo que no va no se dibuja ni pasa por el procesador de vértices.
//   · Los interiores (bancos, mesas, camas, la cocina, la paja de la jaula) se apagan a más de 45 m de la cámara,
//     como el LOD de la aldea; el caballo de la jaula y los vecinos que viajan, igual.
//   · El material es el de la aldea (prepararMaterialAldea: tablas, chapa, piedra con juntas, vetas, musgo y óxido
//     en el shader) con tipos propios del tren (aSuperficie 20 a 27): hierro pintado con hollín que chorrea y óxido
//     abajo, hierro crudo, bronce con brillo de sol, machimbre de 9 cm afuera (gastado) y adentro (barnizado), tela,
//     lona embreada del techo y hollín de la caja de humo. Todo se arma y se compila en la carga.
//   · El haz del farol sigue la vía (cinco huesos puestos sobre la vía, adelante): en las curvas no se va derecho
//     contra el bosque. El foco apunta a la vía 14 m adelante, bajo y angosto: no ilumina las copas.
//   · Escala real: trocha de 75 cm, ruedas motrices de 84 cm, caldera de 1,10 m, coches de 2,10 m de ancho y 8,8 m
//     de caja (10,9 m con las plataformas). Con ténder y 4 vagones mide unos 57 m.
import * as THREE from 'three';
import { Constructor, matriz, abollar } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { prepararMaterialAldea, SUPERFICIES_ALDEA } from './aldea-arquitectura.js';
import { registrarLuz } from './luces.js';
import { mallaCaballo } from './caballo-mundo.js';
import { VECINOS_ALDEA } from './aldea.js';
import { bajaSentado, __mallaPersona } from './gente.js';
import { sanearEstadoTren, composicionDe, viajaEn } from './tren-viaje.js';

const PI = Math.PI;
const RT = 0.135;   // la cara de arriba del riel, sobre el punto de la vía (trochita.js)
const SA = SUPERFICIES_ALDEA;
// los tipos de superficie propios del tren (el shader de abajo; 24 y 25 son de adentro: sin nieve)
const ST = { pintado: 20, hierro: 21, bronce: 22, tablas: 23, tablasAdentro: 24, tela: 25, lona: 26, hollin: 27 };

// ---------------------------------------------------------------- colores
const K = {
  negro: '#2e3133', humo: '#1f1d1b', rojo: '#9a3324', rojoOscuro: '#6e2219', crema: '#e4d3a6', bronce: '#c0913e',
  acero: '#7a766e', aroBlanco: '#dcd5c4', hierro: '#3b3733', madera: '#8d4a2e', maderaClara: '#a8683e', marco: '#5a2c1c',
  techo: '#544e48', cielorraso: '#e6dcc2', adentro: '#9c6a40', piso: '#7a5a3c', asiento: '#a8743f', lona: '#4d4944',
  furgon: '#6c4632', chapa: '#9a9c98', listones: '#94744e', lena: '#5e4a36', lenaCorte: '#c49a68',
};
const color = (hex, f = 1) => new THREE.Color(hex).multiplyScalar(f);

// ---------------------------------------------------------------- el constructor (con superficie, hueso, parte y tinta)
// `pieza`: la parte (un número; ver `contexto`) de cada vértice: los índices salen ordenados por parte, y cada
// parte guarda su tramo (`geometry.userData.tramos`). `tinta`: qué pintura del taller lo tiñe (TINTAS).
const TINTAS = { cuerpo: 1, franja: 2, ruedas: 3, coches: 4, franjaCoches: 5 };
class CT extends Constructor {
  constructor() { super(); this.sup = []; this.hueso = []; this.pieza = []; this.tinta = []; this.supActual = 0; this.huesoActual = 0; this.piezaActual = 0; }
  agregar(geo, o = {}) {
    const n0 = this.tipo.length;
    super.agregar(geo, o);
    const s = o.sup ?? this.supActual, h = o.hueso ?? this.huesoActual, t = o.tinta ?? 0;
    for (let i = n0; i < this.tipo.length; i++) { this.sup.push(s); this.hueso.push(h); this.pieza.push(this.piezaActual); this.tinta.push(t); }
    return this;
  }
  // un triángulo suelto, con su normal por vértice y un color
  tri(p0, p1, p2, n0, n1, n2, k, tipo = 0, sup = this.supActual) {
    const t = tintaDe(k);
    for (const [p, n] of [[p0, n0], [p1, n1], [p2, n2]]) {
      this.pos.push(p[0], p[1], p[2]); this.nor.push(n[0], n[1], n[2]); this.col.push(k.r, k.g, k.b);
      this.tipo.push(tipo); this.sup.push(sup); this.hueso.push(this.huesoActual); this.pieza.push(this.piezaActual); this.tinta.push(t);
    }
  }
  // lo de `otro`, pasado por la matriz `m` (el loco quieto del taller)
  anexar(otro, m) {
    const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(m);
    for (let i = 0; i < otro.tipo.length; i++) {
      v.set(otro.pos[i * 3], otro.pos[i * 3 + 1], otro.pos[i * 3 + 2]).applyMatrix4(m);
      n.set(otro.nor[i * 3], otro.nor[i * 3 + 1], otro.nor[i * 3 + 2]).applyMatrix3(nm).normalize();
      this.pos.push(v.x, v.y, v.z); this.nor.push(n.x, n.y, n.z);
      this.col.push(otro.col[i * 3], otro.col[i * 3 + 1], otro.col[i * 3 + 2]);
      this.tipo.push(otro.tipo[i]); this.sup.push(otro.sup[i]); this.hueso.push(this.huesoActual); this.pieza.push(this.piezaActual); this.tinta.push(otro.tinta?.[i] || 0);
    }
  }
  // geometría soldada (cada vértice repetido una sola vez), con aSuperficie, aLocal y, si `piel`, los
  // índices de hueso (uno por vértice, peso 1). Los triángulos, ordenados por parte.
  armar({ piel = false } = {}) {
    const mapa = new Map(), P = [], N = [], C = [], T = [], S = [], H = [], TI = [];
    const porPieza = new Map();
    const q = (x, k) => Math.round(x * k);
    for (let i = 0, n = this.tipo.length; i < n; i++) {
      const i3 = i * 3;
      const clave = q(this.pos[i3], 1e4) + ',' + q(this.pos[i3 + 1], 1e4) + ',' + q(this.pos[i3 + 2], 1e4) + '|' + q(this.nor[i3], 500) + ',' + q(this.nor[i3 + 1], 500) + ',' + q(this.nor[i3 + 2], 500)
        + '|' + q(this.col[i3], 1e3) + ',' + q(this.col[i3 + 1], 1e3) + ',' + q(this.col[i3 + 2], 1e3) + '|' + this.tipo[i] + '|' + this.sup[i] + '|' + this.hueso[i] + '|' + this.tinta[i];
      let j = mapa.get(clave);
      if (j === undefined) {
        j = T.length; mapa.set(clave, j);
        P.push(this.pos[i3], this.pos[i3 + 1], this.pos[i3 + 2]); N.push(this.nor[i3], this.nor[i3 + 1], this.nor[i3 + 2]);
        C.push(this.col[i3], this.col[i3 + 1], this.col[i3 + 2]); T.push(this.tipo[i]); S.push(this.sup[i]); H.push(this.hueso[i]); TI.push(this.tinta[i]);
      }
      const pz = this.pieza[i - (i % 3)];
      let lista = porPieza.get(pz);
      if (!lista) { lista = []; porPieza.set(pz, lista); }
      lista.push(j);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.setAttribute('aTipo', new THREE.Float32BufferAttribute(T, 1));
    g.setAttribute('aSuperficie', new THREE.Float32BufferAttribute(S, 1));
    g.setAttribute('aLocal', new THREE.Float32BufferAttribute(P.slice(), 3));
    if (piel) {
      const si = new Uint16Array(T.length * 4), sw = new Float32Array(T.length * 4);
      for (let i = 0; i < T.length; i++) { si[i * 4] = H[i]; sw[i * 4] = 1; }
      g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    }
    indicesPorPieza(g, porPieza, T.length);
    g.userData.tinta = Uint8Array.from(TI);
    g.userData.colorBase = Float32Array.from(C);
    g.computeBoundingSphere();
    return g;
  }
}
// El arreglo de índices ordenado por parte (cada parte, su tramo), y una copia (`base`) de la que se arma lo
// que se dibuja (ver `mostrarPiezas`)
function indicesPorPieza(g, porPieza, nVertices) {
  const piezas = [...porPieza.keys()].sort((a, b) => a - b);
  let total = 0;
  for (const pz of piezas) total += porPieza.get(pz).length;
  const Tipo = nVertices > 65535 ? Uint32Array : Uint16Array;   // (el three del juego no trae Uint16/32BufferAttribute)
  const base = new Tipo(total), tramos = new Map();
  let k = 0;
  for (const pz of piezas) { const l = porPieza.get(pz); tramos.set(pz, [k, l.length]); base.set(l, k); k += l.length; }
  const vivo = new THREE.BufferAttribute(base.slice(), 1);
  vivo.setUsage(35048);   // (DynamicDrawUsage: el three del juego no trae la constante)
  g.setIndex(vivo);
  g.userData.base = base;
  g.userData.tramos = tramos;
}
// Deja en los índices sólo las partes de `visibles` (un Set de números).
function mostrarPiezas(g, visibles) {
  const { base, tramos } = g.userData;
  if (!base) return;
  const arr = g.index.array;
  let k = 0;
  for (const [pz, [desde, n]] of tramos) {
    if (!n || !visibles.has(pz)) continue;
    arr.set(base.subarray(desde, desde + n), k);
    k += n;
  }
  g.setDrawRange(0, k);
  g.index.needsUpdate = true;
}
// Lo pintable en el taller (la locomotora y el ténder: 'loco'; los coches: 'coche'). Las tintas salen del color
// de cada primitiva; los triángulos sueltos (`tri`), del color ya convertido.
let modoTinta = null;
function tintaHex(hex) {
  if (typeof hex !== 'string') return 0;
  if (hex === K.aroBlanco) return TINTAS.ruedas;
  if (modoTinta === 'loco') return hex === K.rojo || hex === K.rojoOscuro || hex === '#b0452c' ? TINTAS.cuerpo : hex === K.crema ? TINTAS.franja : 0;
  if (modoTinta === 'coche') return hex === K.madera || hex === K.maderaClara ? TINTAS.coches : hex === K.crema ? TINTAS.franjaCoches : 0;
  return 0;
}
const _kT = new THREE.Color();
const parecido = (k, hex) => { _kT.set(hex); return Math.abs(k.r - _kT.r) + Math.abs(k.g - _kT.g) + Math.abs(k.b - _kT.b) < 0.03; };
function tintaDe(k) {
  if (!modoTinta || !k) return 0;
  if (modoTinta === 'loco' && (parecido(k, K.rojo) || parecido(k, '#b0452c'))) return TINTAS.cuerpo;
  if (modoTinta === 'coche' && parecido(k, K.madera)) return TINTAS.coches;
  return 0;
}

// ---------------------------------------------------------------- primitivas
// (o: rx, ry, rz, tipo, sup, hueso, variar, bajo, alto (el degradado de abajo hacia arriba), abollar, esc)
function agregarCon(c, g, hex, p, o = {}) {
  const k = new THREE.Color(hex);
  c.agregar(g, {
    tipo: o.tipo ?? 0, variar: o.variar ?? 0.05, sup: o.sup, hueso: o.hueso, suave: o.suave, tinta: o.tinta ?? tintaHex(hex),
    degradado: [k.clone().multiplyScalar(o.bajo ?? 0.82), k.clone().multiplyScalar(o.alto ?? 1.05)],
    matriz: o.m || matriz(p, [o.rx ?? 0, o.ry ?? 0, o.rz ?? 0], o.esc ?? [1, 1, 1]),
  });
  g.dispose();
}
function caja(c, p, t, hex, o = {}) {
  const g = new THREE.BoxGeometry(t[0], t[1], t[2]);
  const ab = o.abollar ?? 0;
  if (ab > 0) abollar(g, ab, 2.3);
  agregarCon(c, g, hex, p, o);
}
// cilindro sobre su eje Y (rx: PI/2 lo pone sobre Z; rz: PI/2, sobre X). r: radio abajo; o.r1: arriba
function cil(c, p, r, h, hex, o = {}) {
  agregarCon(c, new THREE.CylinderGeometry(o.r1 ?? r, r, h, o.lados ?? 12, 1, o.abierto ?? false, o.desde ?? 0, o.arco ?? PI * 2), hex, p, { suave: true, ...o });
}
function bola(c, p, esc, hex, o = {}) {
  agregarCon(c, new THREE.SphereGeometry(1, o.lados ?? 10, o.filas ?? 7), hex, p, { suave: true, ...o, esc });
}
// torno: perfil [[radio, y], ...] alrededor de Y
function torno(c, p, perfil, hex, o = {}) {
  agregarCon(c, new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), o.lados ?? 14), hex, p, { suave: true, ...o });
}
// una barra (cilindro) de a hasta b
const _ab = new THREE.Vector3(), _q = new THREE.Quaternion(), _y = new THREE.Vector3(0, 1, 0);
function barra(c, a, b, r, hex, o = {}) {
  _ab.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const largo = _ab.length();
  if (largo < 1e-4) return;
  _q.setFromUnitVectors(_y, _ab.clone().normalize());
  const m = new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), _q, new THREE.Vector3(1, 1, 1));
  agregarCon(c, new THREE.CylinderGeometry(o.r1 ?? r, r, largo, o.lados ?? 6, 1, o.abierto ?? false), hex, null, { suave: true, ...o, m });
}
// un tablón (caja) de a hasta b, con su sección [ancho, alto] (el alto, hacia `arriba`)
function viga(c, a, b, ancho, alto, hex, o = {}) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const largo = d.length();
  const z = d.normalize();
  const arriba = new THREE.Vector3(...(o.arriba || [0, 1, 0]));
  let x = new THREE.Vector3().crossVectors(arriba, z);
  if (x.lengthSq() < 1e-6) x.set(1, 0, 0);
  x.normalize();
  const y = new THREE.Vector3().crossVectors(z, x);
  const m = new THREE.Matrix4().makeBasis(x, y, z).setPosition((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  const g = new THREE.BoxGeometry(ancho, alto, largo);
  if (o.abollar) abollar(g, o.abollar, 2.3);
  agregarCon(c, g, hex, null, { ...o, m });
}
function tubo(c, puntos, r, hex, o = {}) {
  const curva = new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(...p)));
  agregarCon(c, new THREE.TubeGeometry(curva, o.tramos ?? puntos.length * 4, r, o.lados ?? 6, false), hex, null, { suave: true, ...o, m: new THREE.Matrix4() });
}
// un anillo plano en el plano YZ (de cara hacia +X si s = 1, -X si s = -1)
function anillo(c, p, r0, r1, hex, s, o = {}) {
  const g = new THREE.RingGeometry(r0, r1, o.lados ?? 20, 1);
  agregarCon(c, g, hex, p, { ...o, ry: s > 0 ? PI / 2 : -PI / 2 });
}
// un disco plano mirando a +Z (o según ry)
function disco(c, p, r, hex, o = {}) {
  agregarCon(c, new THREE.CircleGeometry(r, o.lados ?? 16), hex, p, o);
}
// un plano con sus dos caras (para banderas, cortinas, la tela): `forma(v)` puede deformar los vértices
function lamina(c, p, ancho, alto, hex, o = {}) {
  const g = new THREE.PlaneGeometry(ancho, alto, o.sx ?? 1, o.sy ?? 1);
  if (o.forma) { const a = g.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i); o.forma(v); a.setXYZ(i, v.x, v.y, v.z); } }
  const atras = g.clone();
  const idx = atras.index.array;
  for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  agregarCon(c, g, hex, p, { ...o, suave: true });
  agregarCon(c, atras, hex, p, { ...o, suave: true });
}
// un techo en arco a lo largo de Z: medio ancho `a`, alero a la altura `y0`, flecha `f`, espesor `e`.
// Afuera y adentro pueden tener color y superficie propios. También las tapas de las puntas.
function techoArco(c, { z0, z1, a, y0, f, e = 0.05, fuera, dentro, supFuera = ST.lona, supDentro = ST.tablasAdentro, tipoFuera = 4, segs = 10, tapas = true }) {
  const R = (a * a + f * f) / (2 * f), yc = y0 + f - R, th = Math.asin(a / R);
  const kF = color(fuera), kD = color(dentro);
  const pto = (t, rr, z) => [rr * Math.sin(t), yc + rr * Math.cos(t), z];
  const nrm = (t, s) => [s * Math.sin(t), s * Math.cos(t), 0];
  for (let i = 0; i < segs; i++) {
    const t0 = -th + (2 * th * i) / segs, t1 = -th + (2 * th * (i + 1)) / segs;
    const kf0 = kF.clone().multiplyScalar(0.92 + 0.12 * Math.cos(t0 * 3)), kf1 = kF.clone().multiplyScalar(0.92 + 0.12 * Math.cos(t1 * 3));
    // afuera (de cara arriba)
    c.tri(pto(t0, R, z0), pto(t1, R, z1), pto(t1, R, z0), nrm(t0, 1), nrm(t1, 1), nrm(t1, 1), kf0, tipoFuera, supFuera);
    c.tri(pto(t0, R, z0), pto(t0, R, z1), pto(t1, R, z1), nrm(t0, 1), nrm(t0, 1), nrm(t1, 1), kf1, tipoFuera, supFuera);
    // adentro (de cara abajo)
    const ri = R - e;
    c.tri(pto(t0, ri, z0), pto(t1, ri, z0), pto(t1, ri, z1), nrm(t0, -1), nrm(t1, -1), nrm(t1, -1), kD, 0, supDentro);
    c.tri(pto(t0, ri, z0), pto(t1, ri, z1), pto(t0, ri, z1), nrm(t0, -1), nrm(t1, -1), nrm(t0, -1), kD, 0, supDentro);
    if (tapas) for (const [z, s] of [[z0, -1], [z1, 1]]) {
      const n = [0, 0, s];
      const A = pto(t0, R, z), B = pto(t1, R, z), Cc = pto(t1, ri, z), D = pto(t0, ri, z);
      if (s > 0) { c.tri(A, Cc, B, n, n, n, kF, 0, supFuera); c.tri(A, D, Cc, n, n, n, kF, 0, supFuera); }
      else { c.tri(A, B, Cc, n, n, n, kF, 0, supFuera); c.tri(A, Cc, D, n, n, n, kF, 0, supFuera); }
    }
  }
  // los cantos del alero
  for (const s of [-1, 1]) {
    const t = s * th, A = pto(t, R, z0), B = pto(t, R, z1), Cc = pto(t, R - e, z1), D = pto(t, R - e, z0);
    const n = [s * Math.cos(t), -Math.sin(Math.abs(t)), 0];
    if (s > 0) { c.tri(A, B, Cc, n, n, n, kF, 0, supFuera); c.tri(A, Cc, D, n, n, n, kF, 0, supFuera); }
    else { c.tri(A, Cc, B, n, n, n, kF, 0, supFuera); c.tri(A, D, Cc, n, n, n, kF, 0, supFuera); }
  }
  return { R, yc, th };
}
// el tímpano en arco de una punta (de y0 hasta el arco), en z, mirando hacia `s` (+1/-1)
function timpano(c, z, a, y0, f, e, hex, s, sup) {
  const R = (a * a + f * f) / (2 * f), yc = y0 + f - R, th = Math.asin(a / R), ri = R - e;
  const k = color(hex), n = [0, 0, s], segs = 8;
  for (let i = 0; i < segs; i++) {
    const t0 = -th + (2 * th * i) / segs, t1 = -th + (2 * th * (i + 1)) / segs;
    const A = [ri * Math.sin(t0), y0, z], B = [ri * Math.sin(t1), y0, z];
    const Cc = [ri * Math.sin(t1), yc + ri * Math.cos(t1), z], D = [ri * Math.sin(t0), yc + ri * Math.cos(t0), z];
    if (s > 0) { c.tri(A, B, Cc, n, n, n, k, 0, sup); c.tri(A, Cc, D, n, n, n, k, 0, sup); }
    else { c.tri(A, Cc, B, n, n, n, k, 0, sup); c.tri(A, D, Cc, n, n, n, k, 0, sup); }
  }
}
// un cuadrilátero (con su espesor en ambas caras: dos triángulos de cada lado)
function cuad(c, A, B, Cc, D, hex, o = {}) {
  const k = color(hex);
  const u = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]), v = new THREE.Vector3(D[0] - A[0], D[1] - A[1], D[2] - A[2]);
  const n = u.cross(v).normalize().toArray(), m = n.map((x) => -x);
  c.tri(A, B, Cc, n, n, n, k, o.tipo ?? 0, o.sup ?? c.supActual); c.tri(A, Cc, D, n, n, n, k, o.tipo ?? 0, o.sup ?? c.supActual);
  if (o.dos !== false) { const k2 = color(o.atras ?? hex); c.tri(A, Cc, B, m, m, m, k2, 0, o.sup ?? c.supActual); c.tri(A, D, Cc, m, m, m, k2, 0, o.sup ?? c.supActual); }
}

// ---------------------------------------------------------------- el material (la aldea + el tren)
const GLSL_TREN_COLOR = /* glsl */`
  {
    float sT = floor(vSupA + 0.5);
    if (sT > 19.5) {
      float kT = sT - 20.0;
      vec3 pT = vLocA;
      vec3 nT = normalize(cross(dFdx(pT), dFdy(pT)) + vec3(0.0, 1e-6, 0.0));
      float horT = step(0.7, abs(nT.y));
      vec2 tgT = normalize(vec2(-nT.z, nT.x) + vec2(1e-5, 0.0));
      float aT = dot(pT.xz, tgT);
      vec2 uvT = mix(vec2(aT, pT.y), pT.xz, horT);
      vec3 alb = diffuseColor.rgb;
      float m1 = nA(uvT * 2.3 + vec2(sT * 3.1));
      float m2 = nA(uvT * 9.0 + 7.0);
      float chorreo = smoothstep(0.5, 0.95, nA(vec2(uvT.x * 6.0, uvT.y * 0.7))) * (1.0 - horT);
      if (kT < 0.5) {
        // hierro pintado: el tono varía, el hollín chorrea y el óxido asoma abajo
        alb *= 0.94 + 0.1 * m1;
        alb = mix(alb, alb * 0.7, chorreo * 0.3);
        float ox = smoothstep(0.7, 0.9, nA(vec2(uvT.x * 5.0, uvT.y * 1.2) + 11.0)) * (1.0 - smoothstep(0.2, 1.3, pT.y));
        alb = mix(alb, vec3(0.23, 0.09, 0.035), ox * 0.5);
      } else if (kT < 1.5) {
        // hierro crudo, con óxido
        alb = mix(alb, vec3(0.26, 0.11, 0.04), smoothstep(0.3, 0.8, m1) * 0.65);
        alb *= 0.8 + 0.35 * m2;
      } else if (kT < 2.5) {
        // bronce: algo de verdín
        alb *= 0.92 + 0.16 * m1;
        alb = mix(alb, vec3(0.16, 0.24, 0.17), smoothstep(0.72, 0.95, m2) * 0.3);
      } else if (kT < 4.5) {
        // machimbre de 9 cm: afuera gastado y con churretes, adentro barnizado
        float dentroT = step(3.5, kT);
        float u = (horT > 0.5 ? pT.x : aT) / 0.09, id = floor(u);
        float jT = juntaA(u, 0.06);
        alb *= (0.9 + 0.18 * hA(vec2(id, 4.2))) * (0.92 + 0.16 * nA(vec2(u * 0.3 + id, (horT > 0.5 ? pT.z : pT.y) * 14.0)));
        alb *= 1.0 - jT * 0.5;
        float borde = min(fract(u), 1.0 - fract(u));
        float gasto = (1.0 - smoothstep(0.02, 0.12, borde)) * step(0.5, nA(uvT * 6.0)) * (1.0 - dentroT);
        alb = mix(alb, vec3(0.32, 0.22, 0.14), gasto * 0.5);
        alb = mix(alb, alb * 0.62, chorreo * 0.35 * (1.0 - dentroT));
        alb *= mix(vec3(1.0), vec3(1.06, 1.0, 0.9), dentroT);
      } else if (kT < 5.5) {
        // tela: trama y un cuadrillé apagado
        vec2 q = uvT / 0.06;
        float cuad = step(0.5, fract(q.x * 0.5)) + step(0.5, fract(q.y * 0.5));
        alb *= 0.9 + 0.09 * mod(cuad, 2.0) + 0.06 * nA(uvT * 40.0);
      } else if (kT < 6.5) {
        // lona embreada del techo
        alb *= 0.85 + 0.25 * m1;
        alb = mix(alb, alb * 0.7, smoothstep(0.6, 0.9, m2) * 0.4);
      } else {
        // hollín, con ceniza
        alb *= 0.85 + 0.2 * nA(vec2(uvT.x * 7.0, uvT.y * 0.9));
        alb = mix(alb, vec3(0.3, 0.28, 0.26), smoothstep(0.7, 0.95, nA(vec2(uvT.x * 9.0, uvT.y * 0.6) + 5.0)) * 0.18);
      }
      diffuseColor.rgb = alb;
    }
  }
`;
const GLSL_TREN_BRILLO = /* glsl */`
  {
    float sB = floor(vSupA + 0.5);
    if (sB > 19.5 && sB < 22.5) {
      vec3 vB = normalize(cameraPosition - vPosMundoVeg);
      vec3 nB = normalize(vNormWA);
      vec3 rB = reflect(-normalize(uSolDirVeg), nB);
      float bronce = step(21.5, sB);
      float eB = pow(max(dot(rB, vB), 0.0), mix(10.0, 22.0, bronce));
      float fres = pow(1.0 - max(dot(nB, vB), 0.0), 3.0);
      gl_FragColor.rgb += uSolColorVeg * eB * mix(0.1, 0.8, bronce) * mix(vec3(1.0), vec3(1.0, 0.8, 0.45), bronce);
      gl_FragColor.rgb += uCieloBajoVeg * fres * mix(0.03, 0.1, bronce);
    }
  }
`;
let materialesHechos = null;
function materiales() {
  if (materialesHechos) return materialesHechos;
  const estructura = prepararMaterialAldea(materialVegetal({ flex: 0 }));
  const previo = estructura.onBeforeCompile;
  const clave = estructura.customProgramCacheKey();
  estructura.customProgramCacheKey = () => clave + '|tren-3.7.3';
  estructura.onBeforeCompile = (sh, r) => {
    previo(sh, r);
    const f0 = sh.fragmentShader, v0 = sh.vertexShader;
    sh.fragmentShader = sh.fragmentShader
      .replace('float sA = floor(vSupA + 0.5);', 'float sA = floor(vSupA + 0.5); if (sA > 19.5) sA = (sA > 23.5 && sA < 25.5) ? 10.0 : 0.0;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + GLSL_TREN_COLOR)
      .replace('#include <opaque_fragment>', '#include <opaque_fragment>\n' + GLSL_TREN_BRILLO);
    sh.vertexShader = sh.vertexShader.replace('uInvierno * arriba * 0.9 * (1.0 - step(9.5, aSuperficie)));',
      'uInvierno * arriba * 0.9 * clamp(1.0 - step(9.5, aSuperficie) * (1.0 - step(19.5, aSuperficie)) - step(23.5, aSuperficie) * (1.0 - step(25.5, aSuperficie)), 0.0, 1.0));');
    if (sh.fragmentShader === f0 || sh.vertexShader === v0) console.warn('[tren] el shader de la aldea cambió: revisar los reemplazos');
  };
  estructura.needsUpdate = true;
  // los vidrios: casi transparentes de día (se ve el valle de adentro) y tibios de noche
  const vidrio = new THREE.MeshBasicMaterial({ color: 0x9fb0bc, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
  // el fuego (salamandra, cocina, fragua, la caldera): siempre prendido, titila
  const fuego = new THREE.MeshBasicMaterial({ vertexColors: true });
  // los faroles (el de la locomotora, los de los coches): de día apagados, de noche encendidos
  const faroles = new THREE.MeshBasicMaterial({ vertexColors: true });
  // el haz del farol, de noche
  const haz = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const atlas = atlasTren();
  const letras = new THREE.MeshLambertMaterial({ map: atlas.tex, transparent: true, alphaTest: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  materialesHechos = { estructura, vidrio, fuego, faroles, haz, letras, atlas };
  return materialesHechos;
}

// ---------------------------------------------------------------- lo pintado (letras y guardas)
// Un lienzo con el nombre de la locomotora, la guarda (greca escalonada) y el letrero de cada coche.
function atlasTren() {
  const W = 1024, H = 704;
  const lienzo = document.createElement('canvas');
  lienzo.width = W; lienzo.height = H;
  const ctx = lienzo.getContext('2d');
  const R = (x, y, w, h) => [x / W, 1 - (y + h) / H, (x + w) / W, 1 - y / H];
  const rect = {
    nombre: R(0, 0, 1024, 192), guarda: R(0, 192, 1024, 64),
    furgon: R(0, 256, 512, 96), jaula: R(512, 256, 512, 96), primera: R(0, 352, 512, 96), comedor: R(512, 352, 512, 96),
    dormitorio: R(0, 448, 512, 96), mirador: R(512, 448, 512, 96), taller: R(0, 544, 1024, 96), numero: R(0, 640, 256, 64),
    segunda: R(512, 640, 512, 64),
  };
  let nombreLoco = 'La Hojarasca';
  const pintar = () => {
    ctx.clearRect(0, 0, W, H);
    // el nombre: filete doble con esquinas y letras de pincel doradas
    ctx.save();
    ctx.strokeStyle = '#e2c27a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(10, 10, W - 20, 172, 34); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(24, 24, W - 48, 144, 24); ctx.stroke();
    for (const x of [44, W - 44]) { ctx.beginPath(); ctx.arc(x, 96, 10, 0, PI * 2); ctx.fillStyle = '#e2c27a'; ctx.fill(); }
    ctx.font = '700 132px "Caveat", "Spectral", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // (los nombres largos, con letra más chica)
    ctx.font = `700 ${Math.round(Math.min(132, 132 * 12 / Math.max(12, nombreLoco.length)))}px "Caveat", "Spectral", serif`;
    ctx.lineWidth = 10; ctx.strokeStyle = '#3a1810'; ctx.strokeText(nombreLoco, W / 2, 100);
    const grad = ctx.createLinearGradient(0, 40, 0, 150); grad.addColorStop(0, '#f6e2a4'); grad.addColorStop(1, '#c99a48');
    ctx.fillStyle = grad; ctx.fillText(nombreLoco, W / 2, 100);
    ctx.restore();
    // la guarda: greca escalonada (como las del telar) en crema y ocre
    ctx.save();
    ctx.translate(0, 192);
    ctx.fillStyle = '#e8d8a8'; ctx.fillRect(0, 4, W, 5); ctx.fillRect(0, 55, W, 5);
    for (let x = 0; x < W; x += 64) {
      ctx.fillStyle = '#e8d8a8';
      // un rombo escalonado
      for (let k = 0; k < 4; k++) { const w = 8 + k * 12; ctx.fillRect(x + 32 - w / 2, 14 + k * 4, w, 4); ctx.fillRect(x + 32 - w / 2, 46 - k * 4 - 4, w, 4); }
      ctx.fillStyle = '#b8742e'; ctx.fillRect(x + 28, 28, 8, 8);
      ctx.fillStyle = '#e8d8a8'; ctx.fillRect(x + 2, 26, 6, 12); ctx.fillRect(x + 56, 26, 6, 12);
    }
    ctx.restore();
    // los letreros de los coches
    const letrero = (texto, x, y, w, tinta = '#ead9ac', sombra = '#2a120a') => {
      ctx.font = '600 58px "Spectral", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 6; ctx.strokeStyle = sombra; ctx.strokeText(texto, x + w / 2, y + 50);
      ctx.fillStyle = tinta; ctx.fillText(texto, x + w / 2, y + 50);
    };
    const espaciar = (t) => t.split('').join(' ');
    letrero(espaciar('FURGÓN'), 0, 256, 512); letrero(espaciar('JAULA'), 512, 256, 512);
    letrero(espaciar('PRIMERA'), 0, 352, 512); letrero(espaciar('COMEDOR'), 512, 352, 512);
    letrero(espaciar('DORMITORIO'), 0, 448, 512); letrero(espaciar('MIRADOR'), 512, 448, 512);
    letrero(espaciar('SEGUNDA'), 512, 622, 512);
    // el cartel del taller: letras oscuras sobre la tabla pintada
    ctx.font = '700 64px "Spectral", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#3a2416'; ctx.fillText(espaciar('TALLER FERROVIARIO'), 512, 594);
    // el número de la locomotora
    ctx.font = '700 50px "Spectral", serif'; ctx.fillStyle = '#f0dca0'; ctx.fillText('Nº 3', 128, 672);
  };
  pintar();
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  // con las letras del juego cargadas, se vuelve a pintar
  try { Promise.all(['700 132px "Caveat"', '600 58px "Spectral"'].map((f) => document.fonts.load(f))).then(() => { pintar(); tex.needsUpdate = true; }).catch(() => {}); } catch { /* sin fuentes */ }
  // el nombre de la locomotora (del taller o de "Personalizar"): se vuelve a pintar el lienzo
  const ponerNombre = (n) => { const nuevo = typeof n === 'string' && n.trim() ? n.trim().slice(0, 18) : 'La Hojarasca'; if (nuevo === nombreLoco) return false; nombreLoco = nuevo; pintar(); tex.needsUpdate = true; return true; };
  return { tex, rect, ponerNombre, nombre: () => nombreLoco };
}
// las calcomanías: cuadriláteros con su rectángulo del atlas, con hueso y parte
class Calcos {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.hueso = []; this.pieza = []; this.huesoActual = 0; this.piezaActual = 0; }
  // centro c, ejes u (a lo ancho) y v (a lo alto), unitarios; normal = u × v
  poner(c, u, v, ancho, alto, r) {
    const n = new THREE.Vector3(...u).cross(new THREE.Vector3(...v)).normalize();
    const P = (su, sv) => [c[0] + u[0] * su * ancho / 2 + v[0] * sv * alto / 2, c[1] + u[1] * su * ancho / 2 + v[1] * sv * alto / 2, c[2] + u[2] * su * ancho / 2 + v[2] * sv * alto / 2];
    const esq = [[P(-1, -1), r[0], r[1]], [P(1, -1), r[2], r[1]], [P(1, 1), r[2], r[3]], [P(-1, -1), r[0], r[1]], [P(1, 1), r[2], r[3]], [P(-1, 1), r[0], r[3]]];
    for (const [p, a, b] of esq) { this.pos.push(...p); this.nor.push(n.x, n.y, n.z); this.uv.push(a, b); this.hueso.push(this.huesoActual); this.pieza.push(this.piezaActual); }
  }
  // en un costado (x = ±xc) de algo a lo largo de Z, leyéndose desde afuera
  costado(s, xc, y, z, ancho, alto, r) {
    this.poner([s * xc, y, z], [0, 0, -s], [0, 1, 0], ancho, alto, r);
  }
  anexar(otro, m) {
    const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(m);
    for (let i = 0; i < otro.hueso.length; i++) {
      v.set(otro.pos[i * 3], otro.pos[i * 3 + 1], otro.pos[i * 3 + 2]).applyMatrix4(m);
      n.set(otro.nor[i * 3], otro.nor[i * 3 + 1], otro.nor[i * 3 + 2]).applyMatrix3(nm).normalize();
      this.pos.push(v.x, v.y, v.z); this.nor.push(n.x, n.y, n.z); this.uv.push(otro.uv[i * 2], otro.uv[i * 2 + 1]); this.hueso.push(this.huesoActual); this.pieza.push(this.piezaActual);
    }
  }
  armar({ piel = false } = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    const n = this.hueso.length;
    if (piel) {
      const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { si[i * 4] = this.hueso[i]; sw[i * 4] = 1; }
      g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    }
    const porPieza = new Map();
    for (let i = 0; i < n; i++) { const pz = this.pieza[i - (i % 3)]; let l = porPieza.get(pz); if (!l) { l = []; porPieza.set(pz, l); } l.push(i); }
    indicesPorPieza(g, porPieza, n);
    g.computeBoundingSphere();
    return g;
  }
}

// ---------------------------------------------------------------- piel por huesos (sin SkinnedMesh)
// Como en gente-cuerpo.js: una malla con isSkinnedMesh y un esqueleto mínimo (update y boneTexture).
// Los huesos son los Object3D de los vagones, los ejes y las bielas; `inversas`, la inversa de su lugar
// en la pose de armado (cada vagón armado en el origen).
class EsqueletoTren {
  constructor(huesos, inversas, malla) {
    this.huesos = huesos; this.inversas = inversas; this.malla = malla;
    let lado = 4;
    while (lado * lado < huesos.length * 4) lado *= 2;
    this.boneMatrices = new Float32Array(lado * lado * 4);
    this.boneTexture = new THREE.DataTexture(this.boneMatrices, lado, lado, THREE.RGBAFormat, 1015 /* FloatType */);
    this.boneTexture.needsUpdate = true;
    this._inv = new THREE.Matrix4(); this._m = new THREE.Matrix4();
  }
  computeBoneTexture() { return this; }
  // (las seis mallas lo comparten: three lo actualiza una vez por cuadro, con skeleton.frame)
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
class MallaTren extends THREE.Mesh {
  constructor(geo, mat, esqueleto) {
    super(geo, mat);
    this.isSkinnedMesh = true;
    this.bindMode = 'attached';
    this.bindMatrix = new THREE.Matrix4(); this.bindMatrixInverse = new THREE.Matrix4();
    this.skeleton = esqueleto;
    this.frustumCulled = false;   // (el tren entero se oculta lejos en trochita.js)
  }
  applyBoneTransform(i, v) { return v; }
  raycast() {}
}

// ---------------------------------------------------------------- el contexto de armado
// K.E estructura, K.V vidrios, K.F fuego, K.L faroles, K.H haz, K.D letras. `hueso(padre, [x,y,z])` da un
// hueso nuevo (hijo del vagón `padre`, en esa posición en la pose de armado). Para lo quieto (el loco
// del taller), `hueso` devuelve 0 y nada se mueve. `pieza(nombre)`: lo que sigue es de esa parte (el número de
// cada nombre, en `piezas`); `conPieza(nombre, fn)` arma `fn` en esa parte y vuelve a la de antes.
function contexto(conHuesos) {
  const ctx = { E: new CT(), V: new CT(), F: new CT(), L: new CT(), H: new CT(), D: new Calcos(), huesos: [], moviles: [], piezas: new Map([['', 0]]), piezaActual: '' };
  const todos = () => [ctx.E, ctx.V, ctx.F, ctx.L, ctx.H, ctx.D];
  ctx.poner = (h) => { for (const c of todos()) c.huesoActual = h; };
  ctx.pieza = (nombre) => {
    if (!ctx.piezas.has(nombre)) ctx.piezas.set(nombre, ctx.piezas.size);
    const id = ctx.piezas.get(nombre);
    ctx.piezaActual = nombre;
    for (const c of todos()) c.piezaActual = id;
    return id;
  };
  ctx.conPieza = (nombre, fn) => { const antes = ctx.piezaActual; ctx.pieza(nombre); try { return fn(); } finally { ctx.pieza(antes); } };
  ctx.hueso = (padre, pos, datos = {}) => {
    if (!conHuesos) return 0;
    const o = new THREE.Object3D();
    o.position.set(...pos);
    const i = ctx.huesos.length;
    ctx.huesos.push({ o, padre, ref: pos.slice(), inversa: new THREE.Matrix4().makeTranslation(-pos[0], -pos[1], -pos[2]) });
    ctx.moviles.push({ i, o, ...datos });
    return i;
  };
  // un hueso suelto (hijo del grupo del tren, no de un vagón): los del haz del farol
  ctx.huesoLibre = (pos) => {
    if (!conHuesos) return 0;
    const o = new THREE.Object3D();
    o.position.set(...pos);
    const i = ctx.huesos.length;
    ctx.huesos.push({ o, padre: -1, ref: pos.slice(), inversa: new THREE.Matrix4().makeTranslation(-pos[0], -pos[1], -pos[2]) });
    return i;
  };
  ctx.vagon = (nombre) => {
    ctx.pieza(nombre);
    if (!conHuesos) return 0;
    const o = new THREE.Group(); o.name = nombre;
    const i = ctx.huesos.length;
    ctx.huesos.push({ o, padre: -1, ref: [0, 0, 0], inversa: new THREE.Matrix4() });
    return i;
  };
  return ctx;
}

// ---------------------------------------------------------------- ruedas
// rueda motriz de rayos con la llanta pintada de blanco (como las de la Trochita), contrapeso y muñón;
// a0: el ángulo del muñón en la pose de armado (a la derecha 0, a la izquierda −π/2: van "a 90°")
function ruedaRayos(c, x, cy, z, r, s, { rayos = 12, muñon = 0, a0 = 0, largoMuñon = 0.22 } = {}) {
  const ancho = 0.1;
  cil(c, [x, cy, z], r, ancho, K.acero, { lados: 24, abierto: true, rz: PI / 2, sup: ST.hierro, variar: 0.03 });
  cil(c, [x - s * 0.055, cy, z], r + 0.028, 0.022, '#3a3733', { lados: 24, rz: PI / 2, sup: ST.hierro });
  anillo(c, [x + s * (ancho / 2 + 0.002), cy, z], r * 0.83, r, K.aroBlanco, s, { lados: 24, sup: ST.pintado, variar: 0.03 });
  anillo(c, [x - s * (ancho / 2 + 0.002), cy, z], r * 0.83, r, '#2a2826', -s, { lados: 24 });
  const rm = (r * 0.2 + r * 0.84) / 2;
  for (let i = 0; i < rayos; i++) {
    const a = (i / rayos) * PI * 2;
    caja(c, [x + s * 0.005, cy + Math.sin(a) * rm, z + Math.cos(a) * rm], [0.04, r * 0.66, 0.045], K.negro, { rx: PI / 2 - a, sup: ST.pintado, bajo: 0.9, alto: 1 });
  }
  cil(c, [x + s * 0.02, cy, z], r * 0.2, 0.14, K.negro, { lados: 12, rz: PI / 2, sup: ST.pintado });
  // el contrapeso, opuesto al muñón
  if (muñon > 0) {
    const g = new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.07, 8, 1, false, a0 + PI - 0.75, 1.5);
    agregarCon(c, g, K.negro, [x + s * 0.01, cy, z], { rz: PI / 2, sup: ST.pintado });
    const pz = z + Math.cos(a0) * muñon, py = cy + Math.sin(a0) * muñon;
    cil(c, [x + s * (0.05 + largoMuñon / 2), py, pz], 0.038, largoMuñon, K.acero, { lados: 10, rz: PI / 2, sup: ST.hierro });
    cil(c, [x + s * 0.06, py, pz], 0.07, 0.04, K.negro, { lados: 10, rz: PI / 2, sup: ST.pintado });
  } else {
    // sin muñón: un contrapeso chico igual (los ejes portadores no llevan)
  }
}
// rueda llena (de los coches y del ténder)
function ruedaLlena(c, x, cy, z, r, s) {
  cil(c, [x, cy, z], r, 0.09, K.acero, { lados: 16, rz: PI / 2, sup: ST.hierro, variar: 0.04 });
  cil(c, [x - s * 0.05, cy, z], r + 0.025, 0.02, '#3a3733', { lados: 16, rz: PI / 2, sup: ST.hierro });
  anillo(c, [x + s * 0.047, cy, z], r * 0.82, r * 0.98, K.aroBlanco, s, { lados: 16, sup: ST.pintado });
  cil(c, [x + s * 0.03, cy, z], r * 0.82, 0.03, '#2c2a28', { lados: 14, rz: PI / 2, sup: ST.pintado });
  cil(c, [x + s * 0.05, cy, z], r * 0.22, 0.08, K.negro, { lados: 10, rz: PI / 2, sup: ST.pintado });
}
// un bogie de dos ejes (los ejes son huesos que giran), con bastidor, resortes y cajas de grasa
function bogie(ctx, vag, zb, r, paso = 1.0) {
  const c = ctx.E;
  const cy = RT + r;
  for (const s of [-1, 1]) {
    caja(c, [s * 0.53, cy + 0.02, zb], [0.07, 0.14, paso + r * 2 + 0.1], K.negro, { sup: ST.pintado });
    viga(c, [s * 0.53, cy + 0.08, zb - paso / 2 - r], [s * 0.53, cy + 0.2, zb - paso / 2 + 0.05], 0.06, 0.08, K.negro, { sup: ST.pintado });
    viga(c, [s * 0.53, cy + 0.08, zb + paso / 2 + r], [s * 0.53, cy + 0.2, zb + paso / 2 - 0.05], 0.06, 0.08, K.negro, { sup: ST.pintado });
    for (const e of [-1, 1]) {
      caja(c, [s * 0.54, cy, zb + e * paso / 2], [0.13, 0.17, 0.19], K.hierro, { sup: ST.hierro });
      caja(c, [s * 0.6, cy, zb + e * paso / 2], [0.02, 0.12, 0.13], '#4a443c', { sup: ST.hierro });
    }
    for (const dz of [-0.12, 0.12]) cil(c, [s * 0.53, cy + 0.17, zb + dz], 0.045, 0.14, '#4a4640', { lados: 8, sup: ST.hierro });
  }
  caja(c, [0, cy + 0.24, zb], [1.16, 0.12, 0.3], K.negro, { sup: ST.pintado });
  for (const e of [-1, 1]) {
    const z = zb + e * paso / 2;
    const h = ctx.hueso(vag, [0, cy, z], { tipo: 'eje', r });
    ctx.poner(h);
    for (const s of [-1, 1]) ruedaLlena(c, s * 0.375, cy, z, r, s);
    cil(c, [0, cy, z], 0.05, 0.66, K.hierro, { lados: 8, rz: PI / 2, sup: ST.hierro });
    ctx.poner(vag);
  }
}

// ---------------------------------------------------------------- la locomotora
// Una Baldwin 2-8-2 de trocha angosta: 4 ejes motrices de 84 cm, eje guía y eje portador, caldera con
// arenero, domo de vapor de bronce, campana y silbato, farol de caja, quitanieves en punta, banderines,
// freno de vacío con su cilindro grande bajo la cabina y el nombre pintado en la cabina.
export const LOCO = { largo: 8.6, bogies: 2.2, boca: [0, 3.18, 3.25], farol: [0, 2.5, 3.9] };
// el haz del farol: arranca en el farol (z0), mide `largo` y se abre hasta `radio`; `huesos` tramos de `paso` m
const HAZ = { y: 2.6, z0: 3.9, largo: 14, radio: 1.5, huesos: 4, paso: 3.5 };
function armarLoco(ctx) {
  const c = ctx.E;
  const vag = ctx.vagon('loco');
  ctx.poner(vag);
  modoTinta = 'loco';
  const R = 0.42, cy = RT + R, rc = 0.2;
  const ejes = [1.45, 0.5, -0.45, -1.4];
  // ---- bastidor, viga de choque, estribos y faldón rojo
  for (const s of [-1, 1]) caja(c, [s * 0.22, 0.68, 0.3], [0.06, 0.5, 7.2], K.negro, { sup: ST.pintado });
  caja(c, [0, 0.72, 3.97], [2.0, 0.42, 0.16], K.rojo, { sup: ST.pintado });
  caja(c, [0, 0.72, -3.58], [1.9, 0.36, 0.14], K.rojo, { sup: ST.pintado });
  for (const z of [3.97, -3.58]) caja(c, [0, 0.7, z + Math.sign(z) * 0.15], [0.2, 0.14, 0.18], K.hierro, { sup: ST.hierro });
  for (const s of [-1, 1]) {
    caja(c, [s * 0.74, 1.145, 1.15], [0.54, 0.05, 5.5], '#3b3631', { sup: ST.hierro, tipo: 4 });
    caja(c, [s * 1.0, 1.06, 1.15], [0.03, 0.12, 5.5], K.rojo, { sup: ST.pintado });
    caja(c, [s * 1.01, 1.06, 1.15], [0.01, 0.025, 5.5], K.crema, { sup: ST.pintado });
  }
  // ---- caldera, caja de humo y puerta
  cil(c, [0, 1.72, 0.6], 0.55, 4.3, K.negro, { lados: 24, rx: PI / 2, sup: ST.pintado, bajo: 0.75, alto: 1.15 });
  for (const z of [-1.1, -0.05, 1.0, 2.1]) cil(c, [0, 1.72, z], 0.562, 0.05, K.bronce, { lados: 24, rx: PI / 2, sup: ST.bronce });
  cil(c, [0, 1.72, 3.25], 0.58, 1.0, K.humo, { lados: 24, rx: PI / 2, sup: ST.hollin, bajo: 0.7, alto: 1.1 });
  cil(c, [0, 1.72, 3.77], 0.6, 0.06, K.humo, { lados: 24, rx: PI / 2, sup: ST.hollin });
  cil(c, [0, 1.72, 3.81], 0.47, 0.05, '#262321', { lados: 24, rx: PI / 2, sup: ST.hollin });
  for (const dy of [0.22, -0.22]) caja(c, [0.18, 1.72 + dy, 3.84], [0.5, 0.05, 0.02], '#3a3530', { sup: ST.hierro });
  cil(c, [0, 1.72, 3.86], 0.05, 0.06, K.bronce, { lados: 10, rx: PI / 2, sup: ST.bronce });
  cil(c, [0, 2.0, 3.85], 0.12, 0.02, K.bronce, { lados: 16, rx: PI / 2, sup: ST.bronce });
  ctx.D.poner([0, 2.0, 3.862], [1, 0, 0], [0, 1, 0], 0.2, 0.05, materiales().atlas.rect.numero);
  caja(c, [0, 1.12, 3.25], [0.9, 0.3, 0.8], K.negro, { sup: ST.pintado });
  // ---- chimenea
  cil(c, [0, 2.31, 3.25], 0.28, 0.12, K.humo, { r1: 0.19, lados: 16, sup: ST.hollin });
  cil(c, [0, 2.75, 3.25], 0.17, 0.8, K.humo, { r1: 0.19, lados: 16, sup: ST.hollin });
  cil(c, [0, 3.16, 3.25], 0.2, 0.08, K.humo, { r1: 0.25, lados: 16, sup: ST.hollin });
  cil(c, [0, 3.2, 3.25], 0.25, 0.03, '#2a2622', { lados: 16, sup: ST.hollin });
  disco(c, [0, 3.18, 3.25], 0.17, '#0c0a09', { rx: -PI / 2, lados: 14 });
  // ---- arenero (domo arriba de la caldera) y sus caños hasta delante de las ruedas (del taller)
  ctx.conPieza('loco.arenero', () => {
    cil(c, [0, 2.32, 1.9], 0.26, 0.32, K.negro, { lados: 18, sup: ST.pintado });
    torno(c, [0, 2.47, 1.9], [[0.27, 0], [0.26, 0.05], [0.2, 0.12], [0.08, 0.16], [0, 0.17]], K.negro, { lados: 18, sup: ST.pintado });
    cil(c, [0, 2.46, 1.9], 0.272, 0.04, K.bronce, { lados: 18, sup: ST.bronce });
    cil(c, [0, 2.65, 1.9], 0.05, 0.04, K.bronce, { lados: 10, sup: ST.bronce });
    for (const s of [-1, 1]) tubo(c, [[s * 0.2, 2.3, 1.9], [s * 0.58, 1.95, 1.94], [s * 0.64, 1.25, 1.96], [s * 0.44, 0.5, 1.98], [s * 0.38, 0.27, 1.99]], 0.022, '#3a3632', { sup: ST.hierro, tramos: 18 });
  });
  // ---- campana
  barra(c, [-0.14, 2.27, 1.2], [-0.14, 2.62, 1.2], 0.025, K.negro, { sup: ST.pintado });
  barra(c, [0.14, 2.27, 1.2], [0.14, 2.62, 1.2], 0.025, K.negro, { sup: ST.pintado });
  barra(c, [-0.16, 2.62, 1.2], [0.16, 2.62, 1.2], 0.025, K.negro, { sup: ST.pintado });
  torno(c, [0, 2.36, 1.2], [[0.15, 0], [0.13, 0.04], [0.1, 0.14], [0.07, 0.22], [0.02, 0.25], [0, 0.25]], K.bronce, { lados: 14, sup: ST.bronce });
  // ---- domo de vapor (bronce) y silbato
  torno(c, [0, 2.12, 0.5], [[0.4, 0], [0.34, 0.06], [0.3, 0.14], [0.29, 0.34], [0.26, 0.42], [0.17, 0.48], [0, 0.5]], K.bronce, { lados: 22, sup: ST.bronce });
  cil(c, [0, 2.32, -1.15], 0.05, 0.15, K.bronce, { lados: 10, sup: ST.bronce });
  cil(c, [0, 2.5, -1.15], 0.06, 0.22, K.bronce, { lados: 12, sup: ST.bronce });
  torno(c, [0, 2.61, -1.15], [[0.075, 0], [0.07, 0.03], [0.03, 0.07], [0, 0.08]], K.bronce, { lados: 12, sup: ST.bronce });
  barra(c, [0.06, 2.55, -1.15], [0.3, 2.62, -1.6], 0.01, K.hierro, { sup: ST.hierro });
  for (const s of [-1, 1]) {
    cil(c, [s * 0.11, 2.36, -0.6], 0.055, 0.2, K.bronce, { lados: 10, sup: ST.bronce });
    cil(c, [s * 0.11, 2.47, -0.6], 0.07, 0.03, K.bronce, { lados: 10, sup: ST.bronce });
  }
  // ---- pasamanos de bronce a lo largo de la caldera, y el caño del eyector
  for (const s of [-1, 1]) {
    barra(c, [s * 0.64, 1.98, -1.55], [s * 0.64, 1.98, 3.6], 0.016, K.bronce, { sup: ST.bronce, lados: 6 });
    for (const z of [-1.0, 0.4, 1.8, 3.2]) barra(c, [s * 0.5, 1.98, z], [s * 0.64, 1.98, z], 0.012, K.hierro, { sup: ST.hierro });
  }
  barra(c, [0.48, 2.12, -1.55], [0.48, 2.12, 2.75], 0.028, K.bronce, { sup: ST.bronce, lados: 6 });
  // ---- farol de caja sobre la caja de humo (del taller)
  ctx.conPieza('loco.farol', () => {
    caja(c, [0, 2.35, 3.62], [0.2, 0.08, 0.3], K.negro, { sup: ST.pintado });
    caja(c, [0, 2.6, 3.68], [0.36, 0.38, 0.36], K.negro, { sup: ST.pintado });
    cil(c, [0, 2.79, 3.68], 0.18, 0.36, K.negro, { lados: 12, rx: PI / 2, desde: PI / 2, arco: PI, sup: ST.pintado });
    cil(c, [0, 2.92, 3.62], 0.04, 0.12, K.negro, { lados: 8, sup: ST.pintado });
    cil(c, [0, 2.6, 3.87], 0.155, 0.04, K.bronce, { lados: 18, rx: PI / 2, sup: ST.bronce });
    disco(ctx.L, [0, 2.6, 3.892], 0.13, '#fff1c8', { lados: 18 });
    for (const s of [-1, 1]) caja(c, [s * 0.185, 2.6, 3.68], [0.01, 0.18, 0.2], K.bronce, { sup: ST.bronce });
  });
  // ---- sin el farol: el farolito de kerosén de siempre, chico, sobre la caja de humo
  ctx.conPieza('loco.farolViejo', () => {
    caja(c, [0, 2.33, 3.6], [0.12, 0.04, 0.2], K.negro, { sup: ST.pintado });
    caja(c, [0, 2.47, 3.62], [0.2, 0.22, 0.2], '#2a2826', { sup: ST.pintado });
    cil(c, [0, 2.62, 3.62], 0.07, 0.08, '#2a2826', { r1: 0.02, lados: 8, sup: ST.pintado });
    torno(c, [0, 2.66, 3.62], [[0.02, 0], [0.025, 0.02], [0, 0.05]], K.bronce, { lados: 8, sup: ST.bronce });
    disco(ctx.L, [0, 2.47, 3.722], 0.06, '#ffd890', { lados: 12 });
  });
  // el haz (de noche): un cono que se abre hacia adelante y se apaga en la punta. Va con sus huesos a lo largo
  // de la vía (`ctx.haz`, cada HAZ.paso metros): en las curvas se dobla con la vía (ver `curvarHaz`)
  ctx.conPieza('loco.haz', () => {
    const g = new THREE.CylinderGeometry(0.13, HAZ.radio, HAZ.largo, 18, 8, true);
    g.rotateX(-PI / 2); g.translate(0, HAZ.y, HAZ.z0 + HAZ.largo / 2);
    const n0 = ctx.H.tipo.length;
    ctx.H.agregar(g, { color: '#ffffff', variar: 0 });
    // (Constructor pinta todo de un color: el degradado, de tibio junto al farol a nada en la punta)
    for (let i = n0; i < ctx.H.tipo.length; i++) {
      const t = Math.min(1, Math.max(0, 1 - (ctx.H.pos[i * 3 + 2] - HAZ.z0) / HAZ.largo)), k = Math.pow(t, 3.0) * 0.035;
      ctx.H.col[i * 3] = k; ctx.H.col[i * 3 + 1] = k * 0.86; ctx.H.col[i * 3 + 2] = k * 0.6;
    }
    g.dispose();
    ctx.haz = [];
    for (let k = 0; k <= HAZ.huesos; k++) ctx.haz.push(ctx.huesoLibre([0, HAZ.y, HAZ.z0 + k * HAZ.paso]));
  });
  // ---- cilindros, cajas de vapor, caños y guías de cruceta
  for (const s of [-1, 1]) {
    const x = s * 0.66;
    cil(c, [x, 0.62, 2.7], 0.2, 0.72, K.negro, { lados: 16, rx: PI / 2, sup: ST.pintado });
    for (const z of [2.33, 3.07]) cil(c, [x, 0.62, z], 0.215, 0.04, K.bronce, { lados: 16, rx: PI / 2, sup: ST.bronce });
    caja(c, [x, 0.92, 2.7], [0.3, 0.2, 0.62], K.negro, { sup: ST.pintado });
    cil(c, [x, 0.92, 3.03], 0.06, 0.06, K.bronce, { lados: 10, rx: PI / 2, sup: ST.bronce });
    tubo(c, [[s * 0.42, 1.5, 3.05], [s * 0.6, 1.28, 2.98], [s * 0.66, 1.05, 2.85]], 0.06, K.negro, { sup: ST.pintado, tramos: 8, lados: 8 });
    for (const dy of [-0.075, 0.075]) caja(c, [x, 0.62 + dy, 1.95], [0.06, 0.03, 0.8], K.acero, { sup: ST.hierro });
    caja(c, [x, 0.62, 2.33], [0.12, 0.24, 0.04], K.negro, { sup: ST.pintado });
  }
  // ---- cilindro de cola, ejes portadores, frenos (zapatas y tirantes) y el freno de vacío
  for (const s of [-1, 1]) {
    for (const z of ejes) {
      caja(c, [s * 0.375, cy, z - R - 0.04], [0.09, 0.3, 0.07], K.hierro, { sup: ST.hierro });
      viga(c, [s * 0.3, cy + 0.32, z - R + 0.05], [s * 0.36, cy + 0.12, z - R - 0.05], 0.035, 0.04, K.hierro, { sup: ST.hierro });
    }
    barra(c, [s * 0.3, 0.3, -1.95], [s * 0.3, 0.3, 1.2], 0.02, K.hierro, { sup: ST.hierro });
  }
  cil(c, [0.74, 0.78, -2.85], 0.22, 0.5, K.negro, { lados: 16, sup: ST.pintado });
  cil(c, [0.74, 1.04, -2.85], 0.235, 0.04, K.bronce, { lados: 16, sup: ST.bronce });
  cil(c, [0.74, 0.52, -2.85], 0.06, 0.06, K.bronce, { lados: 10, sup: ST.bronce });
  barra(c, [0.74, 0.5, -2.85], [0.3, 0.3, -1.95], 0.02, K.hierro, { sup: ST.hierro });
  cil(c, [-0.74, 0.8, -2.8], 0.2, 0.9, K.negro, { lados: 14, rx: PI / 2, sup: ST.pintado });
  for (const z of [-3.25, -2.35]) cil(c, [-0.74, 0.8, z], 0.205, 0.03, K.bronce, { lados: 14, rx: PI / 2, sup: ST.bronce });
  // ---- la cabina
  const cabZ0 = -3.45, cabZ1 = -1.6;
  caja(c, [0, 1.2, (cabZ0 + cabZ1) / 2], [2.04, 0.08, cabZ1 - cabZ0], '#5a4632', { sup: SA.piso + SA.adentro });
  for (const s of [-1, 1]) {
    const x = s * 1.02;
    caja(c, [x, 1.65, (cabZ0 + cabZ1) / 2], [0.05, 0.9, cabZ1 - cabZ0], K.rojo, { sup: ST.pintado });
    caja(c, [x, 2.42, -1.72], [0.05, 0.64, 0.24], K.rojo, { sup: ST.pintado });
    caja(c, [x, 2.42, -2.55], [0.05, 0.64, 0.1], K.rojo, { sup: ST.pintado });
    caja(c, [x, 2.42, -3.33], [0.05, 0.64, 0.24], K.rojo, { sup: ST.pintado });
    caja(c, [x, 2.88, (cabZ0 + cabZ1) / 2], [0.05, 0.28, cabZ1 - cabZ0], K.rojo, { sup: ST.pintado });
    // filete crema alrededor del panel del nombre
    caja(c, [s * 1.046, 2.11, (cabZ0 + cabZ1) / 2], [0.01, 0.03, cabZ1 - cabZ0 - 0.04], K.crema, { sup: ST.pintado });
    caja(c, [s * 1.046, 1.24, (cabZ0 + cabZ1) / 2], [0.01, 0.06, cabZ1 - cabZ0], K.negro, { sup: ST.pintado });
    // marcos de las ventanas
    for (const z of [-1.84, -2.5, -2.6, -3.21]) caja(c, [s * 1.05, 2.42, z], [0.02, 0.64, 0.03], K.marco, { sup: ST.pintado });
    for (const y of [2.12, 2.72]) caja(c, [s * 1.05, y, -2.52], [0.02, 0.03, 1.4], K.marco, { sup: ST.pintado });
    for (const [z0, z1] of [[-1.84, -2.5], [-2.6, -3.21]]) ctx.V.agregar(new THREE.PlaneGeometry(Math.abs(z1 - z0), 0.6), { color: '#ffffff', matriz: matriz([x, 2.42, (z0 + z1) / 2], [0, PI / 2, 0]) });
    // el nombre pintado (del taller, o el de "Personalizar")
    ctx.conPieza('loco.nombre', () => ctx.D.costado(s, 1.051, 1.66, -2.52, 1.72, 0.32, materiales().atlas.rect.nombre));
    // agarraderas de bronce en las puntas
    barra(c, [s * 1.07, 1.35, -3.42], [s * 1.07, 2.6, -3.42], 0.016, K.bronce, { sup: ST.bronce });
    barra(c, [s * 1.07, 1.35, -1.66], [s * 1.07, 2.4, -1.66], 0.016, K.bronce, { sup: ST.bronce });
    // escalón de subida
    caja(c, [s * 0.95, 0.72, -3.3], [0.3, 0.04, 0.32], K.hierro, { sup: ST.hierro });
    barra(c, [s * 0.95, 0.72, -3.42], [s * 0.95, 1.18, -3.42], 0.015, K.hierro, { sup: ST.hierro });
  }
  // el frente de la cabina, con sus dos ventanitas a los lados de la caldera
  for (const s of [-1, 1]) {
    caja(c, [s * 0.785, 1.675, cabZ1 - 0.03], [0.47, 0.95, 0.06], K.rojo, { sup: ST.pintado });
    caja(c, [s * 0.585, 2.44, cabZ1 - 0.03], [0.07, 0.6, 0.06], K.rojo, { sup: ST.pintado });
    caja(c, [s * 0.985, 2.44, cabZ1 - 0.03], [0.07, 0.6, 0.06], K.rojo, { sup: ST.pintado });
    ctx.V.agregar(new THREE.PlaneGeometry(0.33, 0.57), { color: '#ffffff', matriz: matriz([s * 0.785, 2.44, cabZ1 - 0.02]) });
  }
  caja(c, [0, 2.86, cabZ1 - 0.03], [2.04, 0.28, 0.06], K.rojo, { sup: ST.pintado });
  caja(c, [0, 2.48, cabZ1 - 0.03], [1.1, 0.48, 0.06], K.rojo, { sup: ST.pintado });
  techoArco(c, { z0: -3.75, z1: -1.42, a: 1.16, y0: 3.0, f: 0.22, e: 0.05, fuera: '#3b3530', dentro: '#5a2a20', supFuera: ST.pintado, supDentro: ST.pintado, segs: 10 });
  timpano(c, cabZ1 - 0.06, 1.02, 3.0, 0.18, 0.0, K.rojo, 1, ST.pintado);
  caja(c, [0, 3.29, -2.55], [0.6, 0.06, 0.5], '#3b3530', { sup: ST.pintado, tipo: 4 });
  // adentro: el fondo de la caldera con la puerta del hogar encendida, manómetros, regulador, bancos
  caja(c, [0, 1.75, -1.7], [1.18, 1.1, 0.12], '#262321', { sup: ST.hollin });
  caja(c, [0, 1.55, -1.775], [0.44, 0.34, 0.02], K.hierro, { sup: ST.hierro });
  ctx.F.agregar(new THREE.PlaneGeometry(0.34, 0.24), { color: '#ff9a3a', matriz: matriz([0, 1.55, -1.79], [0, PI, 0]) });
  for (const s of [-1, 1]) {
    cil(c, [s * 0.22, 2.38, -1.78], 0.075, 0.04, K.bronce, { lados: 14, rx: PI / 2, sup: ST.bronce });
    disco(c, [s * 0.22, 2.38, -1.802], 0.06, '#efe6cc', { ry: PI, lados: 14 });
    caja(c, [s * 0.75, 1.6, -2.85], [0.4, 0.06, 0.5], '#6a4a30', { sup: SA.tosca + SA.adentro });
    caja(c, [s * 0.75, 1.42, -2.85], [0.36, 0.38, 0.44], '#4a3a2a', { sup: SA.tosca + SA.adentro });
  }
  cil(c, [0.42, 2.0, -1.8], 0.02, 0.4, '#e8f0f0', { lados: 6, sup: ST.bronce });
  barra(c, [0, 2.2, -1.78], [-0.28, 2.32, -2.0], 0.02, K.bronce, { sup: ST.bronce });
  barra(c, [0.62, 1.22, -2.1], [0.6, 1.95, -2.2], 0.025, K.acero, { sup: ST.hierro });
  barra(c, [-0.75, 1.22, -3.3], [-0.75, 1.95, -3.3], 0.03, K.negro, { sup: ST.pintado });
  cil(c, [-0.75, 1.97, -3.3], 0.16, 0.025, K.hierro, { lados: 14, sup: ST.hierro });
  // ---- quitanieves en punta (la cuña abre la nieve hacia los dos lados; del taller)
  ctx.conPieza('loco.quitanieves', () => {
    const zt = 5.25, zb = 4.08, yb = RT + 0.04, yt = 1.15, yf = yb + 0.16;
    const tipB = [0, yb, zt], tipF = [0, yf, zt - 0.06], tipT = [0, yt, zt - 0.42];
    for (const s of [-1, 1]) {
      const exB = [s * 1.06, yb, zb + 0.02], exF = [s * 1.06, yf, zb], exT = [s * 1.06, yt, zb - 0.08];
      // el filo de acero (abajo) y la chapa roja (arriba), con el revés oscuro
      if (s > 0) { cuad(c, tipB, exB, exF, tipF, '#5a5650', { sup: ST.hierro, atras: '#2a2624' }); cuad(c, tipF, exF, exT, tipT, '#b0452c', { sup: ST.pintado, tipo: 4, atras: '#3a2a22' }); }
      else { cuad(c, exB, tipB, tipF, exF, '#5a5650', { sup: ST.hierro, atras: '#2a2624' }); cuad(c, exF, tipF, tipT, exT, '#b0452c', { sup: ST.pintado, tipo: 4, atras: '#3a2a22' }); }
      // remaches en hilera y la costilla
      for (let k = 1; k <= 5; k++) { const t = k / 6; bola(c, [s * 1.06 * t, yf + 0.03, zt - 0.06 + (zb - zt + 0.06) * t + 0.02], [0.018, 0.018, 0.018], '#3a3632', { sup: ST.hierro, lados: 5, filas: 3 }); }
      viga(c, [0, (yf + yt) / 2 + 0.05, zt - 0.24], [s * 1.04, (yf + yt) / 2 + 0.05, zb - 0.04], 0.035, 0.05, '#7a2a1c', { sup: ST.pintado });
      viga(c, [s * 0.7, 0.85, 3.98], [s * 0.4, 0.5, 4.6], 0.05, 0.06, K.negro, { sup: ST.pintado });
    }
    viga(c, tipB, tipT, 0.06, 0.06, '#4a4742', { sup: ST.hierro });
    caja(c, [0, yt + 0.02, zb + 0.05], [2.12, 0.05, 0.3], '#2c2a28', { sup: ST.pintado, tipo: 4 });
  });
  // ---- sin quitanieves: el quitapiedras de barrotes de siempre
  ctx.conPieza('loco.quitapiedras', () => {
    const zp = 4.05, punta = 4.75, yb = RT + 0.06, yt = 0.92;
    caja(c, [0, yt, zp + 0.02], [1.7, 0.08, 0.1], K.negro, { sup: ST.pintado });
    for (let k = -4; k <= 4; k++) {
      const x = k * 0.2, z = punta - Math.abs(k) * 0.16;
      barra(c, [x * 0.92, yt, zp + 0.04], [x, yb, z], 0.022, '#3a3632', { sup: ST.hierro });
    }
    for (const s of [-1, 1]) barra(c, [0, yb + 0.02, punta], [s * 0.82, yb + 0.02, zp + 0.1], 0.025, '#3a3632', { sup: ST.hierro });
  });
  // ---- banderines: dos banderas celeste y blanca al frente, y una guirnalda de banderitas de fiesta (del taller)
  ctx.pieza('loco.banderines');
  for (const s of [-1, 1]) {
    barra(c, [s * 0.92, 1.12, 3.98], [s * 0.92, 2.05, 3.98], 0.016, K.bronce, { sup: ST.bronce });
    bola(c, [s * 0.92, 2.07, 3.98], [0.03, 0.03, 0.03], K.bronce, { sup: ST.bronce });
    const ola = (fase) => (v) => { const t = (v.x + 0.21) / 0.42; v.z = Math.sin(t * 5 + fase) * 0.04 * t; };
    const franjas = [['#8ec3e6', 0.09], ['#f4f1e8', 0.0], ['#8ec3e6', -0.09]];
    for (const [hex, dy] of franjas) lamina(c, [s * 0.92, 1.88 + dy, 3.98 - 0.21], 0.42, 0.09, hex, { ry: PI / 2, sx: 6, forma: ola(s), sup: SA.adentro, variar: 0.02 });
  }
  {
    const pts = [];
    const a = [-1.05, 3.02, -1.5], b = [0, 3.12, 3.25], n = 13;
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * PI) * 0.35, a[2] + (b[2] - a[2]) * t]); }
    const cols = ['#c0392b', '#f2e6c4', '#3c8fc4', '#e2b23c'];
    for (const lado of [-1, 1]) {
      const P = pts.map(([x, y, z]) => [x * -lado, y, z]);
      tubo(c, P, 0.006, '#d8d0c0', { sup: SA.adentro, lados: 3 });
      for (let i = 0; i < n; i++) {
        const p0 = P[i], p1 = P[i + 1], m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 0.1, (p0[2] + p1[2]) / 2];
        cuad(c, p0, p1, m, m, cols[(i + (lado > 0 ? 1 : 0)) % 4], { sup: SA.adentro });
      }
    }
  }
  ctx.pieza('loco');
  // ---- ejes: 4 motrices (con muñón), uno guía y uno portador
  const ejesH = [];
  for (const z of ejes) {
    const h = ctx.hueso(vag, [0, cy, z], { tipo: 'eje', r: R });
    ctx.poner(h);
    for (const s of [-1, 1]) ruedaRayos(c, s * 0.375, cy, z, R, s, { muñon: rc, a0: s > 0 ? 0 : -PI / 2, largoMuñon: z === -0.45 ? 0.3 : 0.18 });
    cil(c, [0, cy, z], 0.07, 0.66, K.hierro, { lados: 8, rz: PI / 2, sup: ST.hierro });
    ctx.poner(vag);
    ejesH.push(h);
  }
  for (const z of [2.62, -2.48]) {
    const r = 0.27, cyp = RT + r;
    const h = ctx.hueso(vag, [0, cyp, z], { tipo: 'eje', r });
    ctx.poner(h);
    for (const s of [-1, 1]) ruedaRayos(c, s * 0.375, cyp, z, r, s, { rayos: 9 });
    cil(c, [0, cyp, z], 0.05, 0.66, K.hierro, { lados: 8, rz: PI / 2, sup: ST.hierro });
    ctx.poner(vag);
    for (const s of [-1, 1]) caja(c, [s * 0.5, cyp + 0.05, z], [0.06, 0.2, 0.7], K.negro, { sup: ST.pintado });
  }
  // ---- bielas: de acoplamiento (une los muñones), motriz (cruceta → 3er eje), cruceta con su vástago
  const L = 2.25, zMotriz = -0.45;
  for (const s of [-1, 1]) {
    const a0 = s > 0 ? 0 : -PI / 2;
    const zMid = (ejes[0] + ejes[3]) / 2;
    const xA = s * 0.53;
    const hA = ctx.hueso(vag, [xA, cy, zMid], { tipo: 'acople', a0, rc, zMid, cy });
    ctx.poner(hA);
    caja(c, [xA, cy, zMid], [0.05, 0.085, ejes[0] - ejes[3] + 0.16], '#55524c', { sup: ST.hierro });
    for (const z of ejes) cil(c, [xA, cy, z], 0.065, 0.06, '#55524c', { lados: 12, rz: PI / 2, sup: ST.hierro });
    ctx.poner(vag);
    const xM = s * 0.66;
    const hM = ctx.hueso(vag, [xM, cy, zMotriz], { tipo: 'motriz', a0, rc, L, zMotriz, cy });
    ctx.poner(hM);
    caja(c, [xM, cy, zMotriz + L / 2], [0.05, 0.1, L - 0.1], '#5e5a52', { sup: ST.hierro });
    cil(c, [xM, cy, zMotriz], 0.085, 0.07, '#5e5a52', { lados: 12, rz: PI / 2, sup: ST.hierro });
    cil(c, [xM, cy, zMotriz + L], 0.06, 0.07, '#5e5a52', { lados: 10, rz: PI / 2, sup: ST.hierro });
    ctx.poner(vag);
    const zc0 = zMotriz + rc + L;
    const hC = ctx.hueso(vag, [xM, 0.62, zc0], { tipo: 'cruceta', a0, rc, L, zMotriz, cy });
    ctx.poner(hC);
    caja(c, [xM, 0.62, zc0], [0.1, 0.18, 0.16], K.acero, { sup: ST.hierro });
    barra(c, [xM, 0.62, zc0 + 0.08], [xM, 0.62, zc0 + 0.95], 0.03, '#b8b4aa', { sup: ST.hierro, lados: 8 });
    ctx.poner(vag);
  }
  modoTinta = null;
  return { vag, ejes: ejesH };
}

// ---------------------------------------------------------------- el ténder (agua y leña)
function armarTender(ctx) {
  const c = ctx.E;
  const vag = ctx.vagon('tender');
  ctx.poner(vag);
  modoTinta = 'loco';
  caja(c, [0, 0.74, 0], [1.9, 0.18, 4.9], K.negro, { sup: ST.pintado });
  for (const z of [2.45, -2.45]) caja(c, [0, 0.7, z], [1.9, 0.3, 0.12], K.rojo, { sup: ST.pintado });
  // tanque en U: atrás entero, a los lados largo; adelante, el lugar de la leña
  caja(c, [0, 1.42, -1.8], [1.9, 1.18, 1.2], K.rojo, { sup: ST.pintado });
  for (const s of [-1, 1]) caja(c, [s * 0.79, 1.36, 0.5], [0.32, 1.06, 3.4], K.rojo, { sup: ST.pintado });
  caja(c, [0, 1.08, 2.32], [1.9, 0.5, 0.12], K.rojo, { sup: ST.pintado });
  caja(c, [0, 0.9, 0.5], [1.26, 0.06, 3.4], '#3a322a', { sup: ST.hierro });
  // borde de arriba (crema) y la guarda pintada a los costados
  for (const s of [-1, 1]) {
    caja(c, [s * 0.95, 1.92, -0.05], [0.04, 0.05, 4.5], K.crema, { sup: ST.pintado });
    caja(c, [s * 0.956, 0.88, -0.05], [0.01, 0.03, 4.6], K.crema, { sup: ST.pintado });
    ctx.D.costado(s, 0.957, 1.45, -0.05, 4.2, 0.22, materiales().atlas.rect.guarda);
  }
  caja(c, [0, 2.03, -1.8], [1.9, 0.04, 1.22], '#3b3530', { sup: ST.pintado, tipo: 4 });
  // boca del agua con tapa de bronce, caja de herramientas y escalera de atrás
  cil(c, [0, 2.1, -1.95], 0.2, 0.12, K.negro, { lados: 14, sup: ST.pintado });
  cil(c, [0, 2.17, -1.95], 0.21, 0.03, K.bronce, { lados: 14, sup: ST.bronce });
  caja(c, [0.55, 2.16, -1.55], [0.5, 0.22, 0.32], '#5a4a36', { sup: SA.tosca });
  for (const s of [-1, 1]) barra(c, [s * 0.25, 0.75, -2.44], [s * 0.25, 2.05, -2.44], 0.018, K.hierro, { sup: ST.hierro });
  for (let y = 0.95; y < 2.0; y += 0.25) barra(c, [-0.25, y, -2.45], [0.25, y, -2.45], 0.014, K.hierro, { sup: ST.hierro });
  // el farol rojo de cola
  caja(c, [-0.68, 2.18, -2.38], [0.18, 0.22, 0.16], K.negro, { sup: ST.pintado });
  disco(ctx.L, [-0.68, 2.18, -2.462], 0.06, '#ff3a26', { ry: PI });
  // la leña: troncos apilados de costado
  let semilla = 7;
  const az = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
  for (let fila = 0; fila < 4; fila++) {
    const y = 1.02 + fila * 0.17;
    const z0 = -1.15 + fila * 0.35, z1 = 2.15 - fila * 0.25;
    for (let z = z0; z < z1; z += 0.2) {
      const r = 0.075 + az() * 0.035, largo = 1.0 + az() * 0.2;
      const x = (az() - 0.5) * 0.1;
      cil(c, [x, y + r * 0.6, z], r, largo, K.lena, { lados: 7, rz: PI / 2, sup: SA.tosca, variar: 0.12, abierto: true });
      for (const s of [-1, 1]) disco(c, [x + s * largo / 2, y + r * 0.6, z], r, K.lenaCorte, { ry: s * PI / 2, lados: 7, variar: 0.1 });
    }
  }
  modoTinta = null;
  bogie(ctx, vag, 1.55, 0.27);
  bogie(ctx, vag, -1.55, 0.27);
  return { vag };
}

// ---------------------------------------------------------------- los coches
// Caja de 8,8 m × 2,1 m (piso a 1 m del riel), plataformas abiertas en las puntas con baranda y
// escalones, techo en arco de lona, bogies a ±3 m con tensores. `tipo`: primera (salamandra),
// comedor, dormitorio, mirador; furgón y jaula se arman aparte (sin plataformas).
const COCHE = { L: 8.8, a: 1.05, piso: 1.0, ventana: [1.88, 2.58], cornisa: 2.98 };
function armarCoche(ctx, tipo, id = tipo) {
  const c = ctx.E, at = materiales().atlas.rect;
  const vag = ctx.vagon(id);
  ctx.poner(vag);
  modoTinta = 'coche';
  const { L, a, piso } = COCHE;
  const z1 = L / 2, abierto = tipo === 'mirador';
  // ---- bastidor, tensores con sus pendolones y piso
  for (const s of [-1, 1]) caja(c, [s * 0.97, 0.84, 0], [0.1, 0.18, L + 1.6], K.negro, { sup: ST.pintado });
  for (const e of [-1, 1]) caja(c, [0, 0.8, e * (z1 + 0.82)], [2.06, 0.26, 0.12], K.rojoOscuro, { sup: ST.pintado });
  for (const s of [-1, 1]) {
    tubo(c, [[s * 0.65, 0.82, -z1 + 0.1], [s * 0.65, 0.42, -1.3], [s * 0.65, 0.42, 1.3], [s * 0.65, 0.82, z1 - 0.1]], 0.016, K.hierro, { sup: ST.hierro, tramos: 24 });
    for (const z of [-1.3, 1.3]) caja(c, [s * 0.65, 0.6, z], [0.05, 0.36, 0.05], K.hierro, { sup: ST.hierro });
  }
  for (const z of [-1.3, 1.3]) caja(c, [0, 0.42, z], [1.3, 0.04, 0.05], K.hierro, { sup: ST.hierro });
  caja(c, [0, 0.69, 0], [0.7, 0.18, 1.1], '#2e2b28', { sup: ST.pintado });
  caja(c, [0, piso - 0.06, 0], [2.1, 0.12, L], K.piso, { sup: SA.piso + SA.adentro });
  for (const e of [-1, 1]) {
    caja(c, [0, piso - 0.06, e * (z1 + 0.4)], [2.0, 0.1, 0.8], '#6a5038', { sup: SA.piso, tipo: 4 });
    caja(c, [0, 0.74, e * (z1 + 0.98)], [0.18, 0.14, 0.24], K.hierro, { sup: ST.hierro });
    // barandas de la plataforma y escalones a los costados
    for (const s of [-1, 1]) {
      barra(c, [s * 0.98, piso, e * (z1 + 0.78)], [s * 0.98, piso + 1.02, e * (z1 + 0.78)], 0.022, K.negro, { sup: ST.pintado });
      barra(c, [s * 0.98, piso + 1.02, e * (z1 + 0.78)], [s * 0.98, piso + 1.02, e * (z1 + 0.5)], 0.02, K.negro, { sup: ST.pintado });
      for (const y of [0.62, 0.3]) caja(c, [s * 0.98, y, e * (z1 + 0.42)], [0.28, 0.04, 0.5], K.hierro, { sup: ST.hierro, tipo: 4 });
      barra(c, [s * 1.1, 0.28, e * (z1 + 0.18)], [s * 1.1, piso - 0.08, e * (z1 + 0.18)], 0.014, K.hierro, { sup: ST.hierro });
      barra(c, [s * 1.1, 0.28, e * (z1 + 0.66)], [s * 1.1, piso - 0.08, e * (z1 + 0.66)], 0.014, K.hierro, { sup: ST.hierro });
      barra(c, [s * 1.06, piso + 0.05, e * (z1 + 0.02)], [s * 1.06, piso + 1.6, e * (z1 + 0.02)], 0.015, K.bronce, { sup: ST.bronce });
    }
    barra(c, [-0.98, piso + 1.02, e * (z1 + 0.78)], [0.98, piso + 1.02, e * (z1 + 0.78)], 0.02, K.negro, { sup: ST.pintado });
    barra(c, [-0.98, piso + 0.55, e * (z1 + 0.78)], [0.98, piso + 0.55, e * (z1 + 0.78)], 0.014, K.negro, { sup: ST.pintado });
    for (let x = -0.85; x <= 0.86; x += 0.17) barra(c, [x, piso, e * (z1 + 0.78)], [x, piso + 1.02, e * (z1 + 0.78)], 0.008, K.negro, { sup: ST.pintado, lados: 4 });
  }
  // ---- techo en arco (sobre las plataformas también) y cielorraso claro
  const techo = techoArco(c, { z0: -z1 - 0.85, z1: z1 + 0.85, a: a + 0.13, y0: COCHE.cornisa, f: 0.3, e: 0.05, fuera: K.lona, dentro: abierto ? '#c9b48c' : K.cielorraso, supFuera: ST.lona, supDentro: ST.tablasAdentro, segs: 12 });
  void techo;
  if (abierto) armarMirador(ctx, vag);
  else {
    // ---- los costados: antepecho de machimbre, ventanas entre parantes, letrero arriba, cornisa
    const n = tipo === 'dormitorio' ? 6 : 7, wv = tipo === 'dormitorio' ? 0.72 : 0.78;
    const pil = (L - n * wv) / (n + 1);
    const [v0, v1] = COCHE.ventana;
    for (const s of [-1, 1]) {
      const x = s * (a - 0.03);
      caja(c, [x, (piso + v0) / 2, 0], [0.06, v0 - piso, L], K.madera, { sup: ST.tablas, bajo: 0.85 });
      caja(c, [s * (a + 0.004), v0 - 0.02, 0], [0.03, 0.07, L + 0.04], K.crema, { sup: ST.pintado });
      caja(c, [s * (a + 0.004), piso + 0.04, 0], [0.03, 0.06, L + 0.04], K.marco, { sup: ST.pintado });
      caja(c, [x, (v1 + COCHE.cornisa) / 2, 0], [0.06, COCHE.cornisa - v1, L], K.madera, { sup: ST.pintado, bajo: 0.95 });
      caja(c, [s * (a + 0.01), COCHE.cornisa - 0.02, 0], [0.05, 0.06, L + 0.1], K.marco, { sup: ST.pintado });
      caja(c, [s * (a + 0.004), v1 + 0.02, 0], [0.03, 0.04, L + 0.04], K.crema, { sup: ST.pintado });
      ctx.D.costado(s, a + 0.022, (piso + v0) / 2 + 0.12, 0, L - 0.4, 0.2, at.guarda);
      ctx.D.costado(s, a + 0.002, (v1 + COCHE.cornisa) / 2 + 0.01, 0, 1.9, 0.34, at[tipo]);
      // adentro: el forro barnizado
      caja(c, [s * (a - 0.075), (piso + v0) / 2, 0], [0.03, v0 - piso, L - 0.1], K.adentro, { sup: ST.tablasAdentro });
      caja(c, [s * (a - 0.075), (v1 + COCHE.cornisa) / 2, 0], [0.03, COCHE.cornisa - v1, L - 0.1], K.adentro, { sup: ST.tablasAdentro });
      caja(c, [s * (a - 0.1), v0 - 0.01, 0], [0.09, 0.03, L - 0.1], '#7a4e2e', { sup: ST.tablasAdentro });
      for (let i = 0; i <= n; i++) {
        const zc = -L / 2 + pil / 2 + i * (pil + wv);
        caja(c, [x, (v0 + v1) / 2, zc], [0.06, v1 - v0, pil], K.madera, { sup: ST.tablas });
        caja(c, [s * (a - 0.075), (v0 + v1) / 2, zc], [0.03, v1 - v0, pil - 0.02], K.adentro, { sup: ST.tablasAdentro });
        if (i < n) {
          const zv = zc + pil / 2 + wv / 2;
          ctx.V.agregar(new THREE.PlaneGeometry(wv, v1 - v0), { color: '#ffffff', matriz: matriz([s * (a - 0.04), (v0 + v1) / 2, zv], [0, PI / 2, 0]) });
          caja(c, [s * (a - 0.035), (v0 + v1) / 2 + 0.03, zv], [0.025, 0.03, wv], K.marco, { sup: ST.pintado });
          // persianas y cortinas: en el dormitorio cortinas corridas a medias, en el comedor recogidas
          if (tipo === 'dormitorio' || tipo === 'comedor') {
            const cortina = tipo === 'dormitorio' ? '#7a2e2a' : '#c8b07a';
            for (const lado of [-1, 1]) {
              const ancho = tipo === 'dormitorio' ? wv * 0.36 : wv * 0.18;
              lamina(c, [s * (a - 0.13), (v0 + v1) / 2 + 0.02, zv + lado * (wv / 2 - ancho / 2)], ancho, v1 - v0 + 0.06, cortina,
                { ry: PI / 2, sx: 5, sy: 1, sup: ST.tela, forma: (v) => { v.z = Math.sin(v.x * 40) * 0.018; } });
            }
            barra(c, [s * (a - 0.13), v1 + 0.05, zv - wv / 2 - 0.05], [s * (a - 0.13), v1 + 0.05, zv + wv / 2 + 0.05], 0.008, K.bronce, { sup: ST.bronce, lados: 4 });
          }
        }
      }
    }
    // ---- las puntas: testero con puerta (con ventanita) y el tímpano del techo
    for (const e of [-1, 1]) {
      const z = e * z1;
      for (const s of [-1, 1]) {
        caja(c, [s * 0.72, (piso + COCHE.cornisa) / 2, z], [0.66, COCHE.cornisa - piso, 0.06], K.madera, { sup: ST.tablas });
        caja(c, [s * 0.72, (piso + COCHE.cornisa) / 2, z - e * 0.045], [0.64, COCHE.cornisa - piso, 0.03], K.adentro, { sup: ST.tablasAdentro });
      }
      caja(c, [0, 2.75, z], [0.78, 0.46, 0.06], K.madera, { sup: ST.tablas });
      caja(c, [0, 2.75, z - e * 0.045], [0.78, 0.46, 0.03], K.adentro, { sup: ST.tablasAdentro });
      caja(c, [0, 1.48, z + e * 0.01], [0.76, 0.96, 0.045], '#6e3a24', { sup: ST.tablas });
      caja(c, [0, 2.36, z + e * 0.01], [0.76, 0.1, 0.045], '#6e3a24', { sup: ST.tablas });
      for (const s of [-1, 1]) caja(c, [s * 0.34, 2.13, z + e * 0.01], [0.08, 0.36, 0.045], '#6e3a24', { sup: ST.tablas });
      ctx.V.agregar(new THREE.PlaneGeometry(0.6, 0.36), { color: '#ffffff', matriz: matriz([0, 2.13, z]) });
      cil(c, [0.28, 1.5, z + e * 0.045], 0.03, 0.04, K.bronce, { lados: 8, rx: PI / 2, sup: ST.bronce });
      timpano(c, z + e * 0.03, a + 0.1, COCHE.cornisa, 0.28, 0.05, K.madera, e, ST.pintado);
      timpano(c, z - e * 0.05, a + 0.1, COCHE.cornisa, 0.28, 0.05, K.cielorraso, -e, ST.tablasAdentro);
      // farolito de la plataforma
      caja(c, [0.62, 2.55, z + e * 0.1], [0.12, 0.18, 0.12], K.negro, { sup: ST.pintado });
      caja(ctx.L, [0.62, 2.54, z + e * 0.1], [0.09, 0.11, 0.13], '#ffd890');
    }
    // ---- adentro, según el coche (se apaga de lejos: la parte `<id>.adentro`)
    modoTinta = null;
    ctx.conPieza(`${id}.adentro`, () => {
      if (tipo === 'primera') interiorPrimera(ctx, vag);
      else if (tipo === 'segunda') interiorSegunda(ctx, vag);
      else if (tipo === 'comedor') interiorComedor(ctx, vag);
      else if (tipo === 'dormitorio') interiorDormitorio(ctx, vag);
      // faroles del techo (dos), de bronce con tubo de vidrio
      for (const z of [-2.2, 2.2]) {
        barra(c, [0, 3.2, z], [0, 2.88, z], 0.01, K.bronce, { sup: ST.bronce });
        torno(c, [0, 2.68, z], [[0, 0], [0.07, 0.02], [0.08, 0.06], [0.05, 0.08]], K.bronce, { lados: 10, sup: ST.bronce });
        torno(ctx.L, [0, 2.76, z], [[0.05, 0], [0.075, 0.05], [0.07, 0.13], [0.04, 0.16]], '#ffe2a6', { lados: 10 });
        torno(c, [0, 2.92, z], [[0.09, 0], [0.05, 0.04], [0.02, 0.06]], K.bronce, { lados: 10, sup: ST.bronce });
      }
    });
  }
  modoTinta = null;
  bogie(ctx, vag, 3.0, 0.26);
  bogie(ctx, vag, -3.0, 0.26);
  return { vag };
}
// un banco de listones (asiento y respaldo), mirando hacia +z si `mira` = 1
function bancoListones(c, x, z, mira, ancho = 0.9) {
  const y = COCHE.piso;
  for (let k = 0; k < 4; k++) caja(c, [x, y + 0.44, z + mira * (-0.18 + k * 0.11)], [ancho, 0.035, 0.08], K.asiento, { sup: ST.tablasAdentro, abollar: 0.004 });
  for (let k = 0; k < 4; k++) caja(c, [x, y + 0.6 + k * 0.12, z - mira * 0.24 - mira * k * 0.015], [ancho, 0.08, 0.03], K.asiento, { sup: ST.tablasAdentro, rx: mira * 0.12, abollar: 0.004 });
  for (const s of [-1, 1]) {
    caja(c, [x + s * (ancho / 2 - 0.02), y + 0.22, z - mira * 0.02], [0.04, 0.44, 0.42], '#2e2a26', { sup: ST.hierro });
    caja(c, [x + s * (ancho / 2 - 0.02), y + 0.75, z - mira * 0.27], [0.04, 0.62, 0.05], '#2e2a26', { sup: ST.hierro, rx: mira * 0.12 });
  }
}
// La salamandra: estufa a leña de hierro, con su chapa en el piso, la baranda de bronce, la pava arriba,
// la boca encendida y el caño que sube y sale por el techo (con su sombrerete afuera)
function salamandra(ctx, x, z) {
  const c = ctx.E, y = COCHE.piso;
  caja(c, [x, y + 0.01, z], [0.78, 0.02, 0.78], '#6e4a34', { sup: ST.hierro });
  for (let k = 0; k < 3; k++) { const a = (k / 3) * PI * 2 + 0.5; barra(c, [x + Math.cos(a) * 0.17, y, z + Math.sin(a) * 0.17], [x + Math.cos(a) * 0.15, y + 0.14, z + Math.sin(a) * 0.15], 0.025, '#24211f', { sup: ST.hierro }); }
  torno(c, [x, y + 0.12, z], [[0.16, 0], [0.22, 0.04], [0.23, 0.12], [0.22, 0.5], [0.24, 0.54], [0.24, 0.58], [0.18, 0.62], [0.08, 0.66], [0, 0.66]], '#2a2725', { lados: 18, sup: ST.hierro });
  for (const y2 of [0.17, 0.66]) cil(c, [x, y + y2, z], 0.245, 0.03, K.bronce, { lados: 18, sup: ST.bronce });
  // la boca (de cara al pasillo) y su rejilla encendida
  const s = x > 0 ? -1 : 1;
  caja(c, [x + s * 0.205, y + 0.36, z], [0.04, 0.22, 0.22], '#1c1a18', { sup: ST.hierro });
  ctx.F.agregar(new THREE.PlaneGeometry(0.16, 0.12), { color: '#ff8a2a', matriz: matriz([x + s * 0.228, y + 0.36, z], [0, s * PI / 2, 0]) });
  for (let k = -2; k <= 2; k++) caja(c, [x + s * 0.232, y + 0.36, z + k * 0.032], [0.008, 0.13, 0.01], '#1c1a18', { sup: ST.hierro });
  ctx.F.agregar(new THREE.PlaneGeometry(0.3, 0.06), { color: '#ff7a20', matriz: matriz([x + s * 0.17, y + 0.2, z], [-PI / 2, 0, 0]) });
  // baranda de bronce alrededor
  const g = new THREE.TorusGeometry(0.36, 0.012, 5, 24);
  agregarCon(c, g, K.bronce, [x, y + 0.7, z], { rx: PI / 2, sup: ST.bronce, suave: true });
  for (let k = 0; k < 4; k++) { const a = (k / 4) * PI * 2 + PI / 4; barra(c, [x + Math.cos(a) * 0.36, y, z + Math.sin(a) * 0.36], [x + Math.cos(a) * 0.36, y + 0.7, z + Math.sin(a) * 0.36], 0.01, K.bronce, { sup: ST.bronce }); }
  // la pava tiznada
  torno(c, [x + 0.05, y + 0.78, z + 0.02], [[0, 0], [0.09, 0.0], [0.1, 0.05], [0.08, 0.12], [0.04, 0.14], [0, 0.15]], '#3a3632', { lados: 12, sup: ST.hierro });
  barra(c, [x + 0.12, y + 0.84, z + 0.02], [x + 0.2, y + 0.9, z + 0.02], 0.012, '#3a3632', { sup: ST.hierro });
  // el caño
  barra(c, [x, y + 0.78, z], [x, 3.2, z], 0.065, '#2a2725', { sup: ST.hierro, lados: 10 });
  for (const y2 of [1.6, 2.3]) cil(c, [x, y2, z], 0.07, 0.03, '#3a3632', { lados: 10, sup: ST.hierro });
  barra(c, [x, 3.15, z], [x, 3.75, z], 0.07, K.hollin ?? '#1f1d1b', { sup: ST.hollin, lados: 10 });
  cil(c, [x, 3.82, z], 0.2, 0.12, '#1f1d1b', { r1: 0.06, lados: 10, sup: ST.hollin, tipo: 4 });
  // leña al lado, en un cajón
  caja(c, [x + 0.05, y + 0.14, z + 0.6], [0.4, 0.28, 0.32], '#6a4a2e', { sup: SA.tosca + SA.adentro });
  for (let k = 0; k < 6; k++) cil(c, [x + 0.05 + (k % 3 - 1) * 0.11, y + 0.32 + Math.floor(k / 3) * 0.08, z + 0.6], 0.04, 0.38, K.lena, { lados: 6, rx: PI / 2, sup: SA.tosca + SA.adentro });
  return { x, y: y + 0.36, z };
}
// El coche de segunda de siempre: bancos de listones en las ocho filas, a los dos lados del pasillo, y el
// portaequipajes; sin estufa
function interiorSegunda(ctx) {
  const c = ctx.E;
  const filas = [-3.55, -2.65, -1.6, -0.7, 0.5, 1.4, 2.4, 3.3];
  filas.forEach((z, i) => { for (const s of [-1, 1]) bancoListones(c, s * 0.6, z, i % 2 ? -1 : 1, 0.7); });
  for (const s of [-1, 1]) {
    for (const dx of [0, 0.22]) barra(c, [s * (0.97 - dx), 2.62, -4.2], [s * (0.97 - dx), 2.62, 4.2], 0.01, K.bronce, { sup: ST.bronce, lados: 4 });
    caja(c, [s * 0.86, 2.6, 0], [0.2, 0.01, 8.3], '#8a7a5a', { sup: ST.tela });
    caja(c, [s * 0.86, 2.7, s * 1.5], [0.2, 0.18, 0.46], '#5a4a3a', { sup: SA.tosca + SA.adentro });
  }
}
function interiorPrimera(ctx) {
  const c = ctx.E;
  // ocho filas de bancos de listones de a dos, enfrentados de a pares, y un pasillo al medio
  const filas = [-3.55, -2.65, -1.6, -0.7, 1.3, 2.2, 3.25, 4.1];
  filas.forEach((z, i) => {
    for (const s of [-1, 1]) {
      if (s > 0 && Math.abs(z) < 1.1) continue;
      bancoListones(c, s * 0.6, z, i % 2 ? -1 : 1, 0.7);
    }
  });
  // la salamandra en el medio, del lado derecho
  ctx.salamandra = salamandra(ctx, 0.6, 0.3);
  // portaequipajes de bronce y red arriba de las ventanas
  for (const s of [-1, 1]) {
    for (const dx of [0, 0.22]) barra(ctx.E, [s * (0.97 - dx), 2.62, -4.2], [s * (0.97 - dx), 2.62, 4.2], 0.01, K.bronce, { sup: ST.bronce, lados: 4 });
    for (let z = -4.0; z <= 4.01; z += 1.0) barra(ctx.E, [s * 0.97, 2.75, z], [s * 0.75, 2.62, z], 0.008, K.bronce, { sup: ST.bronce, lados: 4 });
    caja(c, [s * 0.86, 2.6, 0], [0.2, 0.01, 8.3], '#8a7a5a', { sup: ST.tela });
    // valijas y un bolso de lana
    caja(c, [s * 0.86, 2.71, -2.5], [0.2, 0.2, 0.5], '#6a3e26', { sup: SA.tosca + SA.adentro });
    caja(c, [s * 0.86, 2.68, 1.8], [0.18, 0.14, 0.42], '#3e4a5a', { sup: ST.tela });
  }
  // dos farolitos de pared
  for (const z of [-3.1, 3.7]) {
    caja(c, [-0.98, 2.15, z], [0.06, 0.16, 0.08], K.bronce, { sup: ST.bronce });
    torno(ctx.L, [-0.9, 2.22, z], [[0.035, 0], [0.05, 0.04], [0.045, 0.1], [0.025, 0.12]], '#ffe0a0', { lados: 8 });
  }
}
function interiorComedor(ctx) {
  const c = ctx.E, y = COCHE.piso;
  // la cocina chica en la punta de atrás (z < −2.5): mesada, cocina económica de hierro con su caño,
  // estantes con frascos y ollas colgadas; un tabique con pasaplatos la separa del comedor
  const zt = -2.45;
  for (const s of [-1, 1]) caja(c, [s * 0.66, (y + 2.98) / 2, zt], [0.62, 1.98, 0.06], K.adentro, { sup: ST.tablasAdentro });
  caja(c, [0, 2.6, zt], [0.7, 0.75, 0.06], K.adentro, { sup: ST.tablasAdentro });
  // cocina económica
  caja(c, [0.62, y + 0.4, -3.5], [0.6, 0.8, 0.9], '#2a2725', { sup: ST.hierro });
  caja(c, [0.62, y + 0.81, -3.5], [0.64, 0.03, 0.94], '#3a3632', { sup: ST.hierro });
  for (const z of [-3.75, -3.3]) cil(c, [0.62, y + 0.835, z], 0.12, 0.015, '#4a4540', { lados: 14, sup: ST.hierro });
  caja(c, [0.315, y + 0.42, -3.5], [0.02, 0.32, 0.4], '#1e1c1a', { sup: ST.hierro });
  // el fuego de la puerta: sólo con algo cocinándose (la cocina del comedor, ver cocina-juego.js `registrarMovil`)
  ctx.conPieza('comedor.fuego', () => ctx.F.agregar(new THREE.PlaneGeometry(0.28, 0.12), { color: '#ff8a2a', matriz: matriz([0.3, y + 0.62, -3.6], [0, -PI / 2, 0]) }));
  for (let k = -2; k <= 2; k++) caja(c, [0.296, y + 0.62, -3.6 + k * 0.05], [0.006, 0.13, 0.012], '#1c1a18', { sup: ST.hierro });
  barra(c, [0.62, y + 0.85, -3.95], [0.62, 3.2, -3.95], 0.06, '#2a2725', { sup: ST.hierro, lados: 10 });
  barra(c, [0.62, 3.15, -3.95], [0.62, 3.7, -3.95], 0.065, '#1f1d1b', { sup: ST.hollin, lados: 10 });
  cil(c, [0.62, 3.77, -3.95], 0.18, 0.1, '#1f1d1b', { r1: 0.06, lados: 10, sup: ST.hollin, tipo: 4 });
  // la pava y una olla sobre la cocina; cocinando, la olla de lo que se hace (como en cocina-mundo.js: la de cobre
  // para los dulces, el jarro para el chocolate, la grande negra para el locro y el curanto)
  torno(c, [0.62, y + 0.85, -3.3], [[0, 0], [0.09, 0], [0.1, 0.05], [0.08, 0.12], [0.04, 0.14], [0, 0.15]], '#4a4640', { lados: 12, sup: ST.hierro });
  ctx.conPieza('comedor.ollaFija', () => cil(c, [0.62, y + 0.92, -3.75], 0.11, 0.14, '#5a5650', { lados: 12, sup: ST.hierro }));
  const yp = y + 0.845, zo = -3.75;
  ctx.conPieza('comedor.olla-grande', () => {
    cil(c, [0.62, yp + 0.12, zo], 0.18, 0.24, '#2e2c2a', { r1: 0.2, lados: 14, sup: ST.hierro });
    cil(c, [0.62, yp + 0.25, zo], 0.205, 0.02, '#3a3834', { lados: 14, sup: ST.hierro });
    cil(c, [0.62, yp + 0.28, zo], 0.03, 0.04, '#4a4642', { lados: 6, sup: ST.hierro });
    for (const sz of [-1, 1]) caja(c, [0.62, yp + 0.2, zo + sz * 0.22], [0.08, 0.03, 0.04], '#2e2c2a', { sup: ST.hierro });
  });
  ctx.conPieza('comedor.olla-dulce', () => {
    cil(c, [0.62, yp + 0.08, zo], 0.13, 0.16, '#b86a3a', { r1: 0.15, lados: 14, sup: ST.bronce });
    cil(c, [0.62, yp + 0.165, zo], 0.152, 0.012, '#c88a5a', { lados: 14, sup: ST.bronce });
    caja(c, [0.62, yp + 0.13, zo + 0.24], [0.03, 0.02, 0.18], '#4a3a2a', { sup: SA.tosca + SA.adentro });
    barra(c, [0.6, yp + 0.12, zo - 0.02], [0.66, yp + 0.32, zo + 0.06], 0.012, '#7a5a3a', { sup: SA.tosca + SA.adentro });
  });
  ctx.conPieza('comedor.olla-jarro', () => {
    cil(c, [0.62, yp + 0.08, zo], 0.09, 0.16, '#d8d4c8', { lados: 12, sup: SA.adentro });
    cil(c, [0.62, yp + 0.155, zo], 0.085, 0.01, '#5a3424', { lados: 12, sup: SA.adentro });
    agregarCon(c, new THREE.TorusGeometry(0.045, 0.012, 5, 10, PI), '#d8d4c8', [0.62, yp + 0.09, zo + 0.1], { sup: SA.adentro, rx: PI / 2, rz: -PI / 2 });
  });
  // mesada y estantes del otro lado
  caja(c, [-0.68, y + 0.85, -3.5], [0.6, 0.05, 1.8], '#8a6a46', { sup: SA.tosca + SA.adentro });
  caja(c, [-0.68, y + 0.42, -3.5], [0.56, 0.8, 1.76], '#7a5232', { sup: ST.tablasAdentro });
  for (const yy of [1.95, 2.35]) {
    caja(c, [-0.86, yy, -3.5], [0.22, 0.03, 1.6], '#8a6a46', { sup: SA.tosca + SA.adentro });
    for (let k = 0; k < 6; k++) {
      const z = -4.2 + k * 0.26;
      if (k % 2) cil(c, [-0.86, yy + 0.09, z], 0.05, 0.16, ['#c8a050', '#8a2e22', '#d8c8a0'][k % 3], { lados: 8, sup: ST.bronce });
      else cil(c, [-0.86, yy + 0.07, z], 0.06, 0.12, '#e6e0d0', { lados: 8, sup: SA.adentro });
    }
  }
  for (const z of [-3.1, -3.35, -3.6]) { barra(c, [-0.3, 2.6, z], [-0.3, 2.45, z], 0.006, K.hierro, { sup: ST.hierro }); cil(c, [-0.3, 2.38, z], 0.09, 0.12, '#6a625a', { lados: 10, sup: ST.hierro }); }
  // las mesas con mantel (a cuadros) y sus bancos de a dos; en cada una, mate, termo, pan y tazas
  const mesas = [-1.4, 0.6, 2.6];
  for (const z of mesas) for (const s of [-1, 1]) {
    const x = s * 0.6;
    caja(c, [x, y + 0.74, z], [0.66, 0.04, 0.8], '#7a5232', { sup: ST.tablasAdentro });
    caja(c, [x, y + 0.765, z], [0.7, 0.012, 0.84], s > 0 ? '#c8bfa8' : '#b84a3a', { sup: ST.tela });
    lamina(c, [x - s * 0.35, y + 0.68, z], 0.84, 0.16, s > 0 ? '#c8bfa8' : '#b84a3a', { ry: PI / 2, sup: ST.tela });
    barra(c, [x, y, z], [x, y + 0.72, z], 0.035, '#2e2a26', { sup: ST.hierro });
    caja(c, [x, y + 0.02, z], [0.4, 0.04, 0.4], '#2e2a26', { sup: ST.hierro });
    for (const m of [-1, 1]) {
      const zb = z + m * 0.78;
      caja(c, [x, y + 0.45, zb], [0.72, 0.06, 0.42], '#a07040', { sup: ST.tablasAdentro });
      caja(c, [x, y + 0.75, zb + m * 0.19], [0.72, 0.6, 0.05], '#a07040', { sup: ST.tablasAdentro });
      caja(c, [x, y + 0.22, zb], [0.66, 0.44, 0.38], '#7a5232', { sup: ST.tablasAdentro });
    }
    // el mate (calabaza con bombilla), el termo, un plato con tortas fritas, tazas
    const yt = y + 0.77;
    torno(c, [x - 0.05, yt, z - 0.12], [[0, 0], [0.035, 0.005], [0.048, 0.04], [0.042, 0.075], [0.03, 0.09], [0.032, 0.1]], s > 0 ? '#6a4a26' : '#4a5a2a', { lados: 10, sup: SA.adentro });
    barra(c, [x - 0.05, yt + 0.08, z - 0.12], [x - 0.02, yt + 0.19, z - 0.15], 0.004, '#d8d8d0', { sup: ST.bronce, lados: 4 });
    cil(c, [x + 0.16, yt + 0.12, z - 0.18], 0.045, 0.24, s > 0 ? '#3a5a4a' : '#8a2a22', { lados: 10, sup: ST.pintado });
    cil(c, [x + 0.16, yt + 0.25, z - 0.18], 0.035, 0.03, '#2a2826', { lados: 10, sup: ST.pintado });
    cil(c, [x, yt + 0.008, z + 0.12], 0.12, 0.012, '#e8e2d2', { lados: 14, sup: SA.adentro });
    for (let k = 0; k < 4; k++) bola(c, [x - 0.05 + (k % 2) * 0.08, yt + 0.025, z + 0.08 + Math.floor(k / 2) * 0.07], [0.045, 0.015, 0.04], '#c8964e', { sup: SA.adentro });
    for (const m of [-1, 1]) cil(c, [x - m * 0.2, yt + 0.035, z + m * 0.25], 0.035, 0.07, '#ece4d0', { lados: 10, sup: SA.adentro });
    // un farolito en la pared, sobre cada mesa
    caja(c, [s * 0.98, 2.2, z], [0.05, 0.14, 0.07], K.bronce, { sup: ST.bronce });
    torno(ctx.L, [s * 0.91, 2.26, z], [[0.03, 0], [0.045, 0.04], [0.04, 0.09], [0.02, 0.11]], '#ffe0a0', { lados: 8 });
  }
  ctx.cocina = { x: 0.62, y: y + 0.5, z: -3.5 };
}
function interiorDormitorio(ctx) {
  const c = ctx.E, y = COCHE.piso;
  // tres compartimientos con cuchetas de a dos del lado derecho (x > 0), con cortinas, y el pasillo a
  // la izquierda con asientos rebatibles; un farolito en cada compartimiento
  const bahias = [[-4.3, -1.5], [-1.4, 1.4], [1.5, 4.3]];
  const mantas = ['#8a3a2a', '#4a5a3a', '#b0803e'];
  bahias.forEach(([za, zb], i) => {
    const zm = (za + zb) / 2, largo = zb - za - 0.1;
    // tabiques
    for (const z of [za, zb]) caja(c, [0.5, (y + 2.95) / 2, z], [1.0, 1.95, 0.04], K.adentro, { sup: ST.tablasAdentro });
    for (const [yy, alto] of [[y + 0.42, 0.42], [y + 1.36, 0.08]]) {
      // la cama (caja abajo, tabla arriba) y el colchón con la manta y la almohada
      caja(c, [0.55, yy - (alto > 0.2 ? alto / 2 : 0), zm], [0.82, alto > 0.2 ? alto : 0.06, largo], '#7a5232', { sup: ST.tablasAdentro });
      const yc = yy + 0.04;
      caja(c, [0.56, yc + 0.06, zm], [0.76, 0.12, largo - 0.06], '#ded4bc', { sup: ST.tela, abollar: 0.01 });
      caja(c, [0.56, yc + 0.135, zm + 0.25], [0.78, 0.05, largo - 0.6], mantas[(i + (yy > 1.5 ? 1 : 0)) % 3], { sup: ST.tela, abollar: 0.012 });
      lamina(c, [0.17, yc + 0.03, zm + 0.25], largo - 0.6, 0.22, mantas[(i + (yy > 1.5 ? 1 : 0)) % 3], { ry: PI / 2, sup: ST.tela, sx: 4, forma: (v) => { v.z = Math.sin(v.x * 9) * 0.015; } });
      bola(c, [0.56, yc + 0.17, za + 0.4], [0.28, 0.06, 0.16], '#f0ead8', { sup: ST.tela });
    }
    // la baranda de la cucheta de arriba y la escalerita
    barra(c, [0.15, y + 1.55, za + 0.3], [0.15, y + 1.55, zb - 0.3], 0.015, K.bronce, { sup: ST.bronce });
    for (const z of [zb - 0.45, zb - 0.2]) barra(c, [0.12, y, z], [0.12, y + 1.4, z], 0.015, '#7a5232', { sup: ST.tablasAdentro });
    for (let k = 1; k < 5; k++) barra(c, [0.12, y + k * 0.28, zb - 0.45], [0.12, y + k * 0.28, zb - 0.2], 0.012, '#7a5232', { sup: ST.tablasAdentro });
    // las cortinas del compartimiento (en su barral), corridas a medias
    barra(c, [0.08, 2.62, za], [0.08, 2.62, zb], 0.01, K.bronce, { sup: ST.bronce, lados: 4 });
    const ancho = largo * 0.32;
    for (const lado of [-1, 1]) lamina(c, [0.08, 1.85, zm + lado * (largo / 2 - ancho / 2)], ancho, 1.5, '#7a2e2a', { ry: PI / 2, sx: 8, sup: ST.tela, forma: (v) => { v.z = Math.sin(v.x * 38) * 0.03; } });
    // el farolito colgado
    barra(c, [0.55, 2.95, zm], [0.55, 2.62, zm], 0.006, K.bronce, { sup: ST.bronce });
    torno(c, [0.55, 2.5, zm], [[0, 0], [0.05, 0.01], [0.055, 0.03]], K.bronce, { lados: 8, sup: ST.bronce });
    torno(ctx.L, [0.55, 2.53, zm], [[0.04, 0], [0.055, 0.04], [0.05, 0.09], [0.03, 0.11]], '#ffd890', { lados: 8 });
    torno(c, [0.55, 2.64, zm], [[0.06, 0], [0.03, 0.04], [0.01, 0.05]], K.bronce, { lados: 8, sup: ST.bronce });
    // asiento rebatible del pasillo y una mesita con un libro
    caja(c, [-0.88, y + 0.5, zm], [0.18, 0.04, 0.4], '#a07040', { sup: ST.tablasAdentro });
    caja(c, [-0.94, y + 0.75, zm], [0.04, 0.5, 0.4], '#a07040', { sup: ST.tablasAdentro });
  });
  caja(c, [0.55, y + 0.62, -4.25], [0.3, 0.02, 0.2], '#7a5232', { sup: ST.tablasAdentro });
  // una alfombra larga en el pasillo
  caja(c, [-0.5, y + 0.006, 0], [0.6, 0.01, 8.2], '#7a3a2e', { sup: ST.tela });
}
// El mirador: abierto a los costados, con baranda de balaustres, parantes que sostienen el techo, bancos
// en el medio mirando para afuera, toldos enrollados, y la baranda y el farol rojo de cola atrás
function armarMirador(ctx) {
  const c = ctx.E, { L, a, piso } = COCHE, y = piso;
  const zs = [-4.4, -3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3, 4.4];
  for (const s of [-1, 1]) {
    const x = s * (a - 0.04);
    caja(c, [x, y + 0.08, 0], [0.08, 0.16, L], K.madera, { sup: ST.tablas });
    caja(c, [x, y + 1.02, 0], [0.1, 0.06, L], K.madera, { sup: ST.pintado, tipo: 4 });
    caja(c, [x, y + 0.55, 0], [0.04, 0.04, L], K.madera, { sup: ST.pintado });
    for (let z = -L / 2 + 0.08; z <= L / 2 - 0.07; z += 0.16) caja(c, [x, y + 0.58, z], [0.035, 0.85, 0.035], z % 1.1 < 0.1 ? K.crema : '#d8c8a0', { sup: ST.pintado, variar: 0.03 });
    for (const z of zs) {
      caja(c, [x, (y + COCHE.cornisa) / 2, z], [0.1, COCHE.cornisa - y, 0.1], K.madera, { sup: ST.pintado });
      viga(c, [x, COCHE.cornisa - 0.35, z - 0.3 * Math.sign(z || 1)], [x, COCHE.cornisa - 0.04, z], 0.06, 0.06, K.madera, { sup: ST.pintado });
    }
    caja(c, [s * (a + 0.005), COCHE.cornisa - 0.05, 0], [0.06, 0.1, L + 0.1], K.marco, { sup: ST.pintado });
    // toldo enrollado (rayado)
    for (let k = 0; k < 8; k++) cil(c, [s * (a - 0.02), COCHE.cornisa - 0.18, -L / 2 + 0.55 + k * 1.1], 0.07, 1.06, k % 2 ? '#d8cfb4' : '#a24a34', { lados: 10, rx: PI / 2, sup: ST.tela });
    caja(c, [s * (a - 0.01), COCHE.cornisa - 0.3, 0.55], [0.04, 0.3, 1.0], K.madera, { sup: ST.pintado });
    ctx.D.costado(s, a + 0.016, COCHE.cornisa - 0.3, 0.55, 0.95, 0.18, materiales().atlas.rect.mirador);
  }
  // bancos espalda con espalda en el medio, mirando para afuera
  for (const s of [-1, 1]) for (const z of [-3.0, -1.0, 1.0, 3.0]) {
    caja(c, [s * 0.25, y + 0.45, z], [0.42, 0.05, 1.6], K.asiento, { sup: ST.tablasAdentro });
    caja(c, [s * 0.06, y + 0.78, z], [0.05, 0.6, 1.6], K.asiento, { sup: ST.tablasAdentro, rz: s * -0.1 });
    for (const dz of [-0.7, 0.7]) caja(c, [s * 0.25, y + 0.22, z + dz], [0.38, 0.44, 0.05], '#2e2a26', { sup: ST.hierro });
  }
  // las puntas: a la de adelante, la puerta del coche anterior (sólo baranda); atrás, el farol rojo
  for (const e of [-1, 1]) {
    for (const s of [-1, 1]) caja(c, [s * 0.98, (y + COCHE.cornisa) / 2, e * L / 2], [0.1, COCHE.cornisa - y, 0.1], K.madera, { sup: ST.pintado });
    timpano(c, e * L / 2, a + 0.1, COCHE.cornisa, 0.28, 0.05, K.madera, e, ST.pintado);
    timpano(c, e * L / 2 - e * 0.02, a + 0.1, COCHE.cornisa, 0.28, 0.05, '#c9b48c', -e, ST.tablasAdentro);
  }
  caja(c, [-0.7, y + 1.35, -L / 2 - 0.82], [0.14, 0.2, 0.12], K.negro, { sup: ST.pintado });
  disco(ctx.L, [-0.7, y + 1.35, -L / 2 - 0.882], 0.05, '#ff3a26', { ry: PI });
  barra(c, [0.75, y + 1.02, -L / 2 - 0.78], [0.75, y + 1.9, -L / 2 - 0.78], 0.012, K.bronce, { sup: ST.bronce });
  for (const [hex, dy] of [['#8ec3e6', 0.07], ['#f4f1e8', 0], ['#8ec3e6', -0.07]]) lamina(c, [0.75, y + 1.78 + dy, -L / 2 - 0.78 - 0.16], 0.32, 0.07, hex, { ry: PI / 2, sx: 4, sup: SA.adentro, forma: (v) => { v.z = Math.sin((v.x + 0.16) * 14) * 0.02; } });
  for (const z of [-2.2, 2.2]) {
    torno(ctx.L, [0, 2.76, z], [[0.05, 0], [0.075, 0.05], [0.07, 0.13], [0.04, 0.16]], '#ffe2a6', { lados: 10 });
    torno(c, [0, 2.92, z], [[0.09, 0], [0.05, 0.04], [0.02, 0.1]], K.bronce, { lados: 10, sup: ST.bronce });
  }
}
// El furgón: caja cerrada de tablas, techo de chapa, puerta corrediza a cada lado (la de la derecha
// abierta, se ven los cajones); sin plataformas
function armarFurgon(ctx) {
  const c = ctx.E;
  const vag = ctx.vagon('carga');
  ctx.poner(vag);
  const L = 8.0, a = 1.05, y = COCHE.piso, tope = 2.85;
  for (const s of [-1, 1]) caja(c, [s * 0.97, 0.84, 0], [0.1, 0.18, L + 0.2], K.negro, { sup: ST.pintado });
  for (const e of [-1, 1]) { caja(c, [0, 0.8, e * (L / 2 + 0.08)], [2.06, 0.26, 0.12], K.rojoOscuro, { sup: ST.pintado }); caja(c, [0, 0.74, e * (L / 2 + 0.22)], [0.18, 0.14, 0.24], K.hierro, { sup: ST.hierro }); }
  caja(c, [0, y - 0.06, 0], [2.1, 0.12, L], K.piso, { sup: SA.piso + SA.adentro });
  for (const s of [-1, 1]) tubo(c, [[s * 0.65, 0.82, -L / 2 + 0.1], [s * 0.65, 0.42, -1.2], [s * 0.65, 0.42, 1.2], [s * 0.65, 0.82, L / 2 - 0.1]], 0.016, K.hierro, { sup: ST.hierro, tramos: 24 });
  const hueco = [-0.8, 0.8];
  for (const s of [-1, 1]) {
    const x = s * (a - 0.03);
    // paredes con el hueco de la puerta
    for (const [z0, z1] of [[-L / 2, hueco[0]], [hueco[1], L / 2]]) {
      caja(c, [x, (y + tope) / 2, (z0 + z1) / 2], [0.06, tope - y, z1 - z0], K.furgon, { sup: ST.tablas, bajo: 0.8 });
      caja(c, [s * (a - 0.075), (y + tope) / 2, (z0 + z1) / 2], [0.03, tope - y, z1 - z0], '#5a3e2a', { sup: ST.tablasAdentro });
      // herrajes en cruz (diagonales negras)
      viga(c, [s * (a + 0.006), y + 0.1, z0 + 0.1], [s * (a + 0.006), tope - 0.1, z1 - 0.1], 0.06, 0.012, K.negro, { sup: ST.pintado, arriba: [s, 0, 0] });
    }
    caja(c, [x, tope - 0.05, 0], [0.06, 0.1, 1.6], K.furgon, { sup: ST.tablas });
    for (const z of [-L / 2 + 0.05, L / 2 - 0.05, hueco[0] - 0.04, hueco[1] + 0.04]) caja(c, [s * (a + 0.01), (y + tope) / 2, z], [0.04, tope - y, 0.08], K.negro, { sup: ST.pintado });
    caja(c, [s * (a + 0.01), y + 0.05, 0], [0.04, 0.1, L], K.negro, { sup: ST.pintado });
    // el riel de la puerta y la puerta (abierta a la derecha, cerrada a la izquierda)
    caja(c, [s * (a + 0.06), tope + 0.02, 0.6], [0.04, 0.06, 3.4], K.hierro, { sup: ST.hierro });
    const zp = s > 0 ? 1.62 : 0;
    caja(c, [s * (a + 0.07), (y + tope) / 2, zp], [0.05, tope - y - 0.06, 1.66], '#7a5038', { sup: ST.tablas });
    viga(c, [s * (a + 0.1), y + 0.12, zp - 0.75], [s * (a + 0.1), tope - 0.12, zp + 0.75], 0.07, 0.015, K.negro, { sup: ST.pintado, arriba: [s, 0, 0] });
    for (const yy of [y + 0.1, tope - 0.1, (y + tope) / 2]) caja(c, [s * (a + 0.1), yy, zp], [0.015, 0.07, 1.62], K.negro, { sup: ST.pintado });
    for (const dz of [-0.6, 0.6]) cil(c, [s * (a + 0.06), tope + 0.02, zp + dz], 0.05, 0.04, K.hierro, { lados: 8, rz: PI / 2, sup: ST.hierro });
    caja(c, [s * (a + 0.12), y + 0.9, zp - s * 0.7], [0.03, 0.3, 0.03], K.hierro, { sup: ST.hierro });
    ctx.D.costado(s, a + 0.004, tope - 0.32, s > 0 ? -2.4 : 2.4, 1.5, 0.28, materiales().atlas.rect.furgon);
  }
  for (const e of [-1, 1]) {
    caja(c, [0, (y + tope) / 2, e * L / 2], [2.1, tope - y, 0.06], K.furgon, { sup: ST.tablas });
    caja(c, [0, (y + tope) / 2, e * (L / 2 - 0.045)], [2.0, tope - y, 0.03], '#5a3e2a', { sup: ST.tablasAdentro });
    timpano(c, e * L / 2, a + 0.05, tope, 0.24, 0.0, K.furgon, e, ST.tablas);
    for (const x of [-0.6, 0.6]) barra(c, [x, y + 0.1, e * (L / 2 + 0.05)], [x, tope - 0.1, e * (L / 2 + 0.05)], 0.015, K.hierro, { sup: ST.hierro });
  }
  techoArco(c, { z0: -L / 2 - 0.12, z1: L / 2 + 0.12, a: a + 0.1, y0: tope, f: 0.25, e: 0.04, fuera: K.chapa, dentro: '#4a3a2a', supFuera: SA.chapa, supDentro: ST.tablasAdentro, segs: 12 });
  // adentro: cajones de fruta y de herramientas, bolsas de harina, un tambor y un tarro de leche
  ctx.pieza('carga.adentro');
  let sem = 31;
  const az = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  const cajon = (x, yy, z, w, h, d, g) => {
    caja(c, [x, yy + h / 2, z], [w, h, d], '#9a7a50', { sup: SA.tosca + SA.adentro, ry: g, abollar: 0.01 });
    for (const dy of [0.25, 0.75]) caja(c, [x, yy + h * dy, z], [w + 0.01, 0.03, d + 0.01], '#6a4e30', { sup: SA.tosca + SA.adentro, ry: g });
  };
  for (let k = 0; k < 9; k++) {
    const x = 0.35 + (k % 3) * 0.2 - 0.6 + az() * 0.1, z = -2.6 + Math.floor(k / 3) * 0.55 + az() * 0.1;
    cajon(x, y, z, 0.5, 0.36, 0.42, (az() - 0.5) * 0.3);
    if (k % 2) cajon(x + 0.02, y + 0.36, z, 0.48, 0.34, 0.4, (az() - 0.5) * 0.4);
  }
  for (let k = 0; k < 5; k++) cajon(-0.55 + (k % 2) * 0.05, y + Math.floor(k / 2) * 0.38, 1.5 + (k % 2) * 0.55 + az() * 0.1, 0.55, 0.38, 0.5, (az() - 0.5) * 0.3);
  for (let k = 0; k < 4; k++) bola(c, [0.45 + (k % 2) * 0.12, y + 0.16 + Math.floor(k / 2) * 0.22, 1.1 + (k % 2) * 0.35], [0.24, 0.13, 0.32], '#d8ccb0', { sup: ST.tela, rx: 0.2 });
  cil(c, [0.55, y + 0.38, 2.6], 0.24, 0.76, '#5a4a36', { lados: 14, sup: SA.tosca + SA.adentro });
  for (const yy of [0.1, 0.38, 0.66]) cil(c, [0.55, y + yy, 2.6], 0.25, 0.04, K.hierro, { lados: 14, sup: ST.hierro });
  cil(c, [0.2, y + 0.28, 2.9], 0.15, 0.5, '#b0b0aa', { lados: 12, sup: ST.hierro });
  cil(c, [0.2, y + 0.58, 2.9], 0.08, 0.1, '#b0b0aa', { lados: 12, sup: ST.hierro });
  ctx.pieza('carga');
  bogie(ctx, vag, 2.7, 0.26);
  bogie(ctx, vag, -2.7, 0.26);
  return { vag, L };
}
// La jaula (para el caballo): de listones con luz entre uno y otro, techo de chapa, paja en el piso, el
// pesebre con pasto y el balde; adentro, tu caballo (si se pide)
function armarJaula(ctx) {
  const c = ctx.E;
  const vag = ctx.vagon('caballo');
  ctx.poner(vag);
  const L = 8.0, a = 1.05, y = COCHE.piso, tope = 2.8;
  for (const s of [-1, 1]) caja(c, [s * 0.97, 0.84, 0], [0.1, 0.18, L + 0.2], K.negro, { sup: ST.pintado });
  for (const e of [-1, 1]) { caja(c, [0, 0.8, e * (L / 2 + 0.08)], [2.06, 0.26, 0.12], K.rojoOscuro, { sup: ST.pintado }); caja(c, [0, 0.74, e * (L / 2 + 0.22)], [0.18, 0.14, 0.24], K.hierro, { sup: ST.hierro }); }
  caja(c, [0, y - 0.06, 0], [2.1, 0.12, L], '#6a5038', { sup: SA.piso });
  for (const s of [-1, 1]) tubo(c, [[s * 0.65, 0.82, -L / 2 + 0.1], [s * 0.65, 0.42, -1.2], [s * 0.65, 0.42, 1.2], [s * 0.65, 0.82, L / 2 - 0.1]], 0.016, K.hierro, { sup: ST.hierro, tramos: 24 });
  for (const s of [-1, 1]) {
    for (let z = -L / 2; z <= L / 2 + 0.01; z += 1.0) caja(c, [s * (a - 0.03), (y + tope) / 2, z], [0.1, tope - y, 0.1], '#3a3530', { sup: ST.pintado });
    for (let k = 0; k < 8; k++) {
      const yy = y + 0.12 + k * 0.22;
      caja(c, [s * (a - 0.02), yy, 0], [0.04, 0.12, L], K.listones, { sup: SA.tosca, abollar: 0.006, variar: 0.1 });
    }
    viga(c, [s * (a + 0.01), y + 0.1, -L / 2 + 0.5], [s * (a + 0.01), tope - 0.1, -0.5], 0.06, 0.012, K.negro, { sup: ST.pintado, arriba: [s, 0, 0] });
    viga(c, [s * (a + 0.01), y + 0.1, L / 2 - 0.5], [s * (a + 0.01), tope - 0.1, 0.5], 0.06, 0.012, K.negro, { sup: ST.pintado, arriba: [s, 0, 0] });
    ctx.D.costado(s, a + 0.016, tope - 0.18, 2.4 * -s, 1.4, 0.26, materiales().atlas.rect.jaula);
    caja(c, [s * (a + 0.0), tope - 0.18, 2.4 * -s], [0.02, 0.3, 1.55], K.madera, { sup: ST.pintado });
  }
  for (const e of [-1, 1]) for (let k = 0; k < 8; k++) caja(c, [0, y + 0.12 + k * 0.22, e * (L / 2 - 0.02)], [2.1, 0.12, 0.04], K.listones, { sup: SA.tosca, abollar: 0.006, variar: 0.1 });
  for (const e of [-1, 1]) timpano(c, e * L / 2, a + 0.05, tope, 0.24, 0.0, K.listones, e, SA.tosca);
  techoArco(c, { z0: -L / 2 - 0.12, z1: L / 2 + 0.12, a: a + 0.1, y0: tope, f: 0.25, e: 0.04, fuera: K.chapa, dentro: '#4a3a2a', supFuera: SA.chapa, supDentro: ST.tablasAdentro, segs: 12 });
  // paja, pesebre con pasto, balde
  ctx.pieza('caballo.adentro');
  let sem = 5;
  const az = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  for (let k = 0; k < 18; k++) bola(c, [(az() - 0.5) * 1.6, y + 0.02, (az() - 0.5) * 7.4], [0.35 + az() * 0.3, 0.05, 0.3 + az() * 0.3], '#c8a85a', { sup: SA.adentro, variar: 0.15, lados: 7, filas: 4 });
  caja(c, [0, y + 1.0, -3.6], [1.6, 0.1, 0.5], '#7a5a3a', { sup: SA.tosca });
  for (const s of [-1, 1]) caja(c, [s * 0.75, y + 0.5, -3.6], [0.08, 1.0, 0.5], '#7a5a3a', { sup: SA.tosca });
  for (let k = 0; k < 7; k++) bola(c, [-0.6 + k * 0.2, y + 1.14, -3.6], [0.16, 0.1, 0.22], '#9a9a52', { sup: SA.adentro, variar: 0.2, lados: 7, filas: 4 });
  torno(c, [0.6, y, -2.9], [[0, 0], [0.13, 0], [0.16, 0.28], [0.15, 0.29]], '#8a8a84', { lados: 12, sup: ST.hierro });
  ctx.pieza('caballo');
  bogie(ctx, vag, 2.7, 0.26);
  bogie(ctx, vag, -2.7, 0.26);
  return { vag, L };
}

// ---------------------------------------------------------------- el tren entero
// Los lugares de cada vagón (en su marco: x al costado, z hacia adelante, y sobre el riel) donde va el jugador:
// los bancos, la mesa del comedor, la cocina, las camas, el mirador y la plataforma de atrás. `calor`: al lado de
// la salamandra; `mesa`: se matea; `cocina`: se cocina; `cama`: se duerme; `mirador`: mejor vista para las fotos.
const SALAMANDRA = { x: 0.6, z: 0.3 };
const FILAS = {
  segunda: [-3.55, -2.65, -1.6, -0.7, 0.5, 1.4, 2.4, 3.3],
  primera: [-3.55, -2.65, -1.6, -0.7, 1.3, 2.2, 3.25, 4.1],
};
function lugaresDe(tipo) {
  const y = COCHE.piso, sentado = y + 0.44, lugares = [];
  const atras = { x: 0, z: -(COCHE.L / 2 + 0.45), y, lado: 0, plataforma: true };   // 3.8.3: sin `lado`, moverse daba NaN y nunca se llegaba
  if (tipo === 'segunda' || tipo === 'primera') {
    FILAS[tipo].forEach((z) => {
      for (const s of [-1, 1]) {
        if (tipo === 'primera' && s > 0 && Math.abs(z) < 1.1) continue;
        if (tipo === 'primera' && s < 0 && (z === -1.6 || z === -0.7)) continue;   // (ahí van los vecinos que viajan)
        const x = s * 0.6;
        lugares.push({ x, z, y: sentado, lado: s, calor: tipo === 'primera' && Math.hypot(x - SALAMANDRA.x, z - SALAMANDRA.z) < 1.75 });
      }
    });
  } else if (tipo === 'comedor') {
    for (const zm of [-1.4, 0.6, 2.6]) for (const s of [-1, 1]) for (const m of [-1, 1]) lugares.push({ x: s * 0.6, z: zm + m * 0.78, y: y + 0.48, lado: s, mesa: true });
    lugares.push({ x: 0.0, z: -3.45, y: y + 0.55, lado: 1, cocina: true });
  } else if (tipo === 'dormitorio') {
    for (const zm of [-2.9, 0, 2.9]) {
      lugares.push({ x: -0.8, z: zm, y: y + 0.5, lado: -1 });
      lugares.push({ x: 0.55, z: zm, y: y + 0.62, lado: 1, cama: true });
    }
  } else if (tipo === 'mirador') {
    for (const z of [-3.0, -1.0, 1.0, 3.0]) for (const s of [-1, 1]) lugares.push({ x: s * 0.42, z, y: y + 0.45, lado: s, mirador: true });
    atras.z = -(COCHE.L / 2 + 0.5);
  }
  if (lugares.length) lugares.push(atras);
  return lugares;
}
// el tipo de coche de cada vagón y su largo (de enganche a enganche) y medio paso entre bogies
const TIPO_VAGON = { pasajeros: 'primera', comedor: 'comedor', dormitorio: 'dormitorio', mirador: 'mirador', segunda: 'segunda', segunda2: 'segunda', carga: 'furgon', caballo: 'jaula' };
const MEDIDAS = { loco: { largo: [4.15, 3.72], b: LOCO.bogies }, tender: { largo: [2.6, 2.6], b: 1.55 }, furgon: { largo: [4.3, 4.3], b: 2.7 }, jaula: { largo: [4.3, 4.3], b: 2.7 }, coche: { largo: [5.5, 5.5], b: 3.0 } };
const medidasDe = (id) => MEDIDAS[id] || MEDIDAS[TIPO_VAGON[id]] || MEDIDAS.coche;
const LEJOS_ADENTRO = 45;   // a más de esto, los interiores no se dibujan (con 7 m de margen para volver)

let trenActual = null;
// Para el taller (src/tren-mejoras.js / el equipo del taller): al terminar una mejora, el tren de la vía se
// rearma con el estado nuevo, sin tirón (ver `aplicarMejoras` del tren). Devuelve si había tren.
export function aplicarMejoras(estado) {
  if (!trenActual) return false;
  trenActual.aplicarMejoras(estado);
  return true;
}

// `o`: { mat, trocha, escena, T } (lo que pasa trochita.js) y { estado (progreso.tren), personal (2.8),
// pasajeros (las claves de los vecinos que viajan hoy), caballo (la apariencia de tu caballo) }. Devuelve la
// forma que espera trochita.js.
export function armarTren(o = {}) {
  const M = materiales();
  const ctx = contexto(true);
  const loco = armarLoco(ctx);
  const tender = armarTender(ctx);
  const armados = { carga: armarFurgon(ctx), caballo: armarJaula(ctx), pasajeros: armarCoche(ctx, 'primera', 'pasajeros') };
  const salamandraPos = ctx.salamandra;
  armados.comedor = armarCoche(ctx, 'comedor');
  const cocinaPos = ctx.cocina;
  armados.dormitorio = armarCoche(ctx, 'dormitorio');
  armados.mirador = armarCoche(ctx, 'mirador');
  armados.segunda = armarCoche(ctx, 'segunda');
  armados.segunda2 = armarCoche(ctx, 'segunda', 'segunda2');
  const g = new THREE.Group();
  g.name = 'tren';
  // los huesos: los vagones (y los del haz) cuelgan de g; los ejes y las bielas, de su vagón
  for (const h of ctx.huesos) {
    if (h.padre < 0) g.add(h.o);
    else ctx.huesos[h.padre].o.add(h.o);
  }
  // cada vagón: su hueso, sus medidas, sus lugares y dónde va (`off`: metros detrás de la locomotora)
  const vagones = {};
  const nuevoVagon = (id, i) => { const m = medidasDe(id); vagones[id] = { nombre: id, id, i, o: ctx.huesos[i].o, largo: m.largo, b: m.b, off: 0, tipo: TIPO_VAGON[id] || id, lugares: lugaresDe(TIPO_VAGON[id] || id) }; };
  nuevoVagon('loco', loco.vag); nuevoVagon('tender', tender.vag);
  for (const [id, a] of Object.entries(armados)) nuevoVagon(id, a.vag);
  // las mallas, con la piel
  const huesos = ctx.huesos.map((h) => h.o), inversas = ctx.huesos.map((h) => h.inversa);
  const mallas = {};
  let esqueleto = null;
  const hacer = (nombre, geo, mat, sombra = false) => {
    const m = new MallaTren(geo, mat, null);
    if (!esqueleto) esqueleto = new EsqueletoTren(huesos, inversas, m);
    m.skeleton = esqueleto;
    m.castShadow = sombra; m.receiveShadow = true;
    m.name = 'tren-' + nombre;
    g.add(m);
    mallas[nombre] = m;
    return m;
  };
  hacer('estructura', ctx.E.armar({ piel: true }), M.estructura, true);
  hacer('vidrios', ctx.V.armar({ piel: true }), M.vidrio).renderOrder = 2;
  hacer('fuego', ctx.F.armar({ piel: true }), M.fuego);
  hacer('faroles', ctx.L.armar({ piel: true }), M.faroles);
  hacer('letras', ctx.D.armar({ piel: true }), M.letras).renderOrder = 1;
  const geoHaz = ctx.H.armar({ piel: true });
  curvarHaz(geoHaz, ctx.haz);
  hacer('haz', geoHaz, M.haz).renderOrder = 3;
  const huesosHaz = ctx.haz.map((i) => ctx.huesos[i].o);
  const pz = (nombre) => (ctx.piezas.has(nombre) ? ctx.piezas.get(nombre) : -1);

  // ---- tu caballo, en la jaula (mirando para adelante): el de "Personalizar", sólo si lo subiste
  let caballoJaula = null, firmaCaballo = '', caballoABordo = false;
  function ponerCaballo(apariencia) {
    const firma = JSON.stringify(apariencia || null);
    if (caballoJaula && firma === firmaCaballo) return;
    firmaCaballo = firma;
    const v = vagones.caballo.o;
    if (caballoJaula) { v.remove(caballoJaula.g); caballoJaula.g.traverse((m) => { if (m.isMesh) m.geometry.dispose(); }); caballoJaula = null; }
    try {
      caballoJaula = apariencia ? mallaCaballo(apariencia) : mallaCaballo();
      caballoJaula.g.position.set(0.05, COCHE.piso, 0.4);
      caballoJaula.g.scale.setScalar(0.95);
      caballoJaula.g.visible = false;
      caballoJaula.cuello.rotation.x = 0.35;
      v.add(caballoJaula.g);
    } catch (e) { console.warn('[tren] sin caballo en la jaula', e); caballoJaula = null; }
  }
  ponerCaballo(o.caballo || null);

  // ---- los vecinos que viajan en el coche de pasajeros, sentados enfrentados junto a la salamandra
  const viajeros = [];
  for (const [k, clave] of (o.pasajeros || []).slice(0, 2).entries()) {
    try {
      const def = VECINOS_ALDEA[clave];
      if (!def) continue;
      const r = __mallaPersona(def.colores || {}, `aldea-${clave}`, false, { invierno: !!o.invierno });
      const z = k === 0 ? -1.6 : -0.7, mira = k === 0 ? 1 : -1;
      r.g.position.set(-0.6, COCHE.piso, z - mira * 0.04);
      r.g.rotation.y = mira > 0 ? 0 : PI;
      sentar(r);
      r.g.visible = false;
      vagones.pasajeros.o.add(r.g);
      viajeros.push({ clave, r });
    } catch (e) { console.warn('[tren] sin vecinos en el coche', e); }
  }

  // ---- luces: el farol (foco que alumbra la vía), la de adentro del coche y la de la salamandra o la cocina
  const luzFaro = new THREE.SpotLight(0xffe2ab, 0, 32, 0.26, 0.75, 1.5);
  luzFaro.position.set(...LOCO.farol);
  vagones.loco.o.add(luzFaro);
  const blancoFaro = new THREE.Object3D();   // (en el grupo, sobre la vía 14 m adelante: ver alActualizar)
  g.add(blancoFaro);
  luzFaro.target = blancoFaro;
  const luzCabina = new THREE.PointLight(0xff9a4a, 0, 6, 1.6);
  luzCabina.position.set(0, 1.7, -2.2);
  vagones.loco.o.add(luzCabina);
  registrarLuz(luzCabina);
  const luzCoche = new THREE.PointLight(0xffc98a, 0, 8, 1.4);
  const luzFuego = new THREE.PointLight(0xff8a3a, 0, 6, 1.5);
  g.add(luzCoche, luzFuego);
  registrarLuz(luzFaro); registrarLuz(luzCoche); registrarLuz(luzFuego);
  // lo que trochita.js toca de los coches de antes (los faroles, la pintura): de mentira
  const falso = () => ({ material: { color: new THREE.Color() } });
  for (const v of Object.values(vagones)) v.o.userData.farol = falso();

  // ---- la nieve de la vía (la gran nevada): la malla de los tramos tapados y la nieve que salta del quitanieves
  const nieve = { malla: null, firma: '', spray: crearSpray(), mat: o.mat || null };
  nieve.spray.visible = false;
  g.add(nieve.spray);

  // ---- lo que dice el taller
  let estado = sanearEstadoTren(o.estado), personal = o.personal || null;
  let composicion = composicionDe(estado), lista = [];
  const adentro = new Map();   // id → si se dibuja su interior (de cerca)
  let cocinaVista = null;      // lo que se cocina en el comedor: { receta, olla, fuego } (ver `cocina`)
  let firmaPiezas = '', firmaPintura = '';
  const visibles = new Set();
  function rearmarLista() {
    composicion = composicionDe(estado);
    lista = [vagones.loco, vagones.tender, ...composicion.map((id) => vagones[id])];
    let z = 0;
    lista.forEach((v, k) => { if (k > 0) z -= lista[k - 1].largo[1] + v.largo[0]; v.off = z; });
    for (const v of Object.values(vagones)) if (!lista.includes(v)) { v.off = null; v.o.position.set(0, -2000, 0); }
    tren.version++;
  }
  function piezas() {
    const l = estado.loco;
    const nombres = ['', 'loco', 'tender', l.farol ? 'loco.farol' : 'loco.farolViejo', l.farol ? 'loco.haz' : '', l.quitanieves ? 'loco.quitanieves' : 'loco.quitapiedras'];
    if (l.arenero) nombres.push('loco.arenero');
    if (l.banderines) nombres.push('loco.banderines');
    if (nombreLoco()) nombres.push('loco.nombre');
    for (const id of composicion) {
      nombres.push(id);
      if (adentro.get(id)) {
        nombres.push(`${id}.adentro`);
        if (id === 'comedor') {
          if (cocinaVista?.fuego) nombres.push('comedor.fuego');
          nombres.push(cocinaVista?.olla ? `comedor.olla-${cocinaVista.olla}` : 'comedor.ollaFija');
        }
      }
    }
    const firma = nombres.join(',');
    if (firma === firmaPiezas) return false;
    firmaPiezas = firma;
    visibles.clear();
    for (const n of nombres) { const id = pz(n); if (id >= 0) visibles.add(id); }
    for (const m of Object.values(mallas)) mostrarPiezas(m.geometry, visibles);
    return true;
  }
  const nombreLoco = () => estado.loco.nombre || (personal?.nombre ? String(personal.nombre).trim().slice(0, 18) : '');
  // la pintura: la del taller (cuerpo, franja y ruedas de la locomotora y el ténder) y la de "Personalizar" (2.8: los
  // coches y su franja, y la cabina si el taller no la pintó). Lo que no se eligió, como salió de fábrica.
  function pinturaDe() {
    const p = estado.loco.pintura, d = personal || {};
    const elegido = (v, deFabrica) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) && v.toLowerCase() !== deFabrica ? v : null);
    return {
      [TINTAS.cuerpo]: p.cuerpo || elegido(d.cabina, '#6b4a2e'), [TINTAS.franja]: p.franja, [TINTAS.ruedas]: p.ruedas,
      [TINTAS.coches]: elegido(d.coches, '#6b4a2e'), [TINTAS.franjaCoches]: elegido(d.franja, '#7c2f22'),
    };
  }
  const ORIGINAL = { [TINTAS.cuerpo]: K.rojo, [TINTAS.franja]: K.crema, [TINTAS.ruedas]: K.aroBlanco, [TINTAS.coches]: K.madera, [TINTAS.franjaCoches]: K.crema };
  function pintar() {
    const colores = pinturaDe();
    const firma = JSON.stringify(colores);
    if (firma === firmaPintura) return false;
    firmaPintura = firma;
    const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    const factor = {}, nuevo = {};
    for (const [t, hex] of Object.entries(colores)) {
      if (!hex) continue;
      nuevo[t] = new THREE.Color(hex);
      factor[t] = 1 / Math.max(0.02, lum(new THREE.Color(ORIGINAL[t])));
    }
    const geo = mallas.estructura.geometry, { tinta, colorBase } = geo.userData, col = geo.attributes.color.array;
    for (let i = 0; i < tinta.length; i++) {
      const t = tinta[i];
      if (!t) continue;
      const i3 = i * 3;
      if (!nuevo[t]) { col[i3] = colorBase[i3]; col[i3 + 1] = colorBase[i3 + 1]; col[i3 + 2] = colorBase[i3 + 2]; continue; }
      const f = lum({ r: colorBase[i3], g: colorBase[i3 + 1], b: colorBase[i3 + 2] }) * factor[t];
      col[i3] = nuevo[t].r * f; col[i3 + 1] = nuevo[t].g * f; col[i3 + 2] = nuevo[t].b * f;
    }
    geo.attributes.color.needsUpdate = true;
    return true;
  }

  const tmp = new THREE.Vector3(), inv = new THREE.Matrix4();
  let t = 0;
  const tren = {
    g, loco: vagones.loco.o, tender: vagones.tender.o, ruedas: [], faro: falso(), luzFaro, luzCoche, luzFuego, mallas, materiales: M,
    boca: LOCO.boca, piso: COCHE.piso, version: 0, salamandra: salamandraPos, posCocina: cocinaPos,
    // dónde va el maquinista en la cabina (ver trochita.js: CAB)
    cabina: { z: -2.55, x: 0.68, y: 1.26 },
    viajeros: () => viajeros.map((v) => v.clave),
    get coches() { return composicion.map((id) => vagones[id].o); },
    get offCoches() { return composicion.map((id) => vagones[id].off); },
    get composicion() { return composicion.slice(); },
    get estado() { return estado; },
    get largoTotal() { const u = lista[lista.length - 1]; return lista[0].largo[0] - u.off + u.largo[1]; },
    // dónde para el tren automático: con el primer coche de pasajeros frente al andén (metros que la locomotora
    // queda adelante del poste)
    get adelanto() { const v = composicion.find((id) => viajaEn(id)); return v ? -vagones[v].off : 0; },
    // el índice (en la composición) del primer coche donde se viaja (ahí va la guarda)
    get primerCoche() { return Math.max(0, composicion.findIndex((id) => viajaEn(id))); },
    vagon: (n) => (typeof n === 'number' ? vagones[composicion[n]]?.o : vagones[n]?.o) || null,
    datos: (n) => vagones[n] || null,
    // los lugares de cada vagón de la composición donde se viaja (ver trochita.js: ASIENTOS)
    lugares() {
      const salida = [];
      composicion.forEach((id, coche) => { for (const l of vagones[id].lugares) salida.push({ ...l, coche, vagon: id }); });
      return salida;
    },
    // las puertas (plataformas y estribos) de los coches de la composición: [{ coche, z }] en el marco del vagón
    puertas() {
      const salida = [];
      composicion.forEach((id, coche) => {
        if (!viajaEn(id)) return;
        const e = COCHE.L / 2 + 0.42;
        salida.push({ coche, z: e }, { coche, z: -e });
      });
      return salida;
    },
    colocar(enVia, s) {
      for (const v of lista) {
        const pA = enVia(s + v.off + v.b), pB = enVia(s + v.off - v.b);
        v.o.position.set((pA.x + pB.x) / 2, (pA.y + pB.y) / 2, (pA.z + pB.z) / 2);
        const d = Math.hypot(pA.x - pB.x, pA.z - pB.z) || 1;
        v.o.rotation.set(-Math.atan2(pA.y - pB.y, d), Math.atan2(pA.x - pB.x, pA.z - pB.z), 0, 'YXZ');
      }
      // el haz: sus huesos, sobre la vía de adelante (se dobla con las curvas)
      if (estado.loco.farol) {
        for (let k = 0; k < huesosHaz.length; k++) {
          const z = HAZ.z0 + k * HAZ.paso, pA = enVia(s + z + 0.5), pB = enVia(s + z - 0.5);
          huesosHaz[k].position.set((pA.x + pB.x) / 2, (pA.y + pB.y) / 2 + HAZ.y, (pA.z + pB.z) / 2);
          huesosHaz[k].rotation.set(-Math.atan2(pA.y - pB.y, 1), Math.atan2(pA.x - pB.x, pA.z - pB.z), 0, 'YXZ');
        }
      }
      const pf = enVia(s + 14);
      blancoFaro.position.set(pf.x, pf.y + 0.3, pf.z);
    },
    // ---- lo del taller: el estado nuevo (y lo de "Personalizar"), sin armar nada
    aplicarMejoras(nuevo) {
      estado = sanearEstadoTren(nuevo);
      const antes = composicion.join(',');
      composicion = composicionDe(estado);
      if (composicion.join(',') !== antes || !lista.length) rearmarLista();
      M.atlas.ponerNombre(nombreLoco());
      pintar();
      piezas();
      return true;
    },
    personalizar(d) {
      personal = d || null;
      M.atlas.ponerNombre(nombreLoco());
      pintar();
      piezas();
      return true;
    },
    nombre: nombreLoco,
    // ---- la cocina del comedor: lo que se está cocinando (de cocina-juego.js) → el fuego y la olla
    cocina(coccion, receta) {
      const olla = coccion && coccion.paso >= 2 && receta ? (receta.id === 'chocolate-caliente' ? 'jarro' : receta.olor === 'dulce' ? 'dulce' : 'grande') : null;
      cocinaVista = coccion ? { fuego: !coccion.pausa, olla } : null;
      piezas();
    },
    // ---- tu caballo
    ponerCaballo,
    subirCaballo(si) { caballoABordo = !!si; },
    caballoABordo: () => caballoABordo,
    // ---- la vía nevada (tramos en metros de vía; `enVia` de trochita.js)
    nieve(tramos, enVia, largo) { armarNieveVia(nieve, tramos, enVia, largo, g); },
    // cada cuadro: las ruedas giran según lo andado, las bielas siguen a los muñones, las luces
    alActualizar({ dt, s, vel, noche, lejos, camara, enVia, enNieve }) {
      t += dt;
      for (const m of ctx.moviles) {
        if (m.tipo === 'eje') m.o.rotation.x = s / m.r;
      }
      const phi = s / 0.42;
      for (const m of ctx.moviles) {
        if (m.tipo === 'acople') m.o.position.set(m.o.position.x, m.cy + m.rc * Math.sin(m.a0 - phi), m.zMid + m.rc * Math.cos(m.a0 - phi));
        else if (m.tipo === 'motriz' || m.tipo === 'cruceta') {
          const py = m.cy + m.rc * Math.sin(m.a0 - phi), pz2 = m.zMotriz + m.rc * Math.cos(m.a0 - phi);
          const dy = m.cy - py, zc = pz2 + Math.sqrt(Math.max(0, m.L * m.L - dy * dy));
          if (m.tipo === 'motriz') { m.o.position.set(m.o.position.x, py, pz2); m.o.rotation.x = Math.asin((py - m.cy) / m.L); }
          else m.o.position.set(m.o.position.x, 0.62, zc);
        }
      }
      // ¿qué interiores se dibujan? (de cerca; con margen para no prender y apagar en el borde)
      const cam = camara?.position;
      if (cam) {
        for (const id of composicion) {
          const v = vagones[id];
          const d = Math.hypot(v.o.position.x - cam.x, v.o.position.z - cam.z);
          const antes = !!adentro.get(id);
          adentro.set(id, antes ? d < LEJOS_ADENTRO + 7 : d < LEJOS_ADENTRO);
        }
      }
      piezas();
      // el caballo y los vecinos: de cerca, como los interiores
      if (caballoJaula) caballoJaula.g.visible = caballoABordo && composicion.includes('caballo') && !!adentro.get('caballo');
      for (const p of viajeros) p.r.g.visible = composicion.includes('pasajeros') && !!adentro.get('pasajeros');
      // el fuego titila; los faroles se prenden con la noche; el haz sólo de noche y con el farol
      const tit = 1.7 + Math.sin(t * 13.1) * 0.18 + Math.sin(t * 7.3 + 1.2) * 0.22 + Math.sin(t * 23.7) * 0.1;
      M.fuego.color.setScalar(tit);
      M.faroles.color.setScalar(0.45 + noche * 2.6);
      mallas.haz.visible = estado.loco.farol && noche > 0.35 && lejos < 220;
      luzCabina.intensity = noche * (2.2 + (tit - 1.7) * 2) * (lejos < 90 ? 1 : 0);
      M.haz.opacity = 1;
      M.haz.color.setScalar(Math.min(1, (noche - 0.35) * 2.5));
      // (trochita.js prende el foco de noche; sin el farol del taller, la locomotora no alumbra la vía)
      luzFaro.intensity = estado.loco.farol ? luzFaro.intensity * 8 : 0;
      // ¿la cámara está adentro de un coche? (prende su luz; la salamandra o la cocina, la suya)
      let dentro = null;
      if (camara) {
        for (const id of composicion) {
          const v = vagones[id];
          if (!viajaEn(id)) continue;
          inv.copy(v.o.matrixWorld).invert();
          tmp.copy(camara.position).applyMatrix4(inv);
          if (Math.abs(tmp.x) < 1.05 && tmp.y > 0.9 && tmp.y < 3.2 && Math.abs(tmp.z) < (v.tipo === 'mirador' ? 5.3 : 4.4)) { dentro = v; break; }
        }
      }
      if (dentro) M.vidrio.color.setRGB(0.62 * (1 - noche) + 0.04 * noche, 0.69 * (1 - noche) + 0.05 * noche, 0.74 * (1 - noche) + 0.07 * noche);
      else M.vidrio.color.setRGB(0.62 + (1.0 - 0.62) * noche, 0.69 + (0.74 - 0.69) * noche, 0.74 + (0.45 - 0.74) * noche);
      M.vidrio.opacity = dentro ? 0.12 + noche * 0.5 : 0.22 + noche * 0.6;
      if (dentro) {
        const yL = dentro.tipo === 'mirador' ? 2.6 : 2.55;
        luzCoche.position.set(0, yL, 0).applyMatrix4(dentro.o.matrixWorld);
        luzCoche.intensity = 1.2 + noche * 3.2;
        const cocinando = dentro.tipo === 'comedor' && cocinaVista?.fuego;
        const f = dentro.tipo === 'primera' ? salamandraPos : cocinando ? cocinaPos : null;
        if (f) { luzFuego.position.set(f.x + (f.x > 0 ? -0.35 : 0.35), f.y + 0.1, f.z).applyMatrix4(dentro.o.matrixWorld); luzFuego.intensity = (1.4 + noche * 1.6) * (tit / 1.7); }
        // (3.7.3: el dormitorio de noche, con más luz: los farolitos de los compartimientos alumbran de verdad)
        else if (dentro.tipo === 'dormitorio') { luzFuego.position.set(0.3, 2.4, 0).applyMatrix4(dentro.o.matrixWorld); luzFuego.intensity = 2.2 + noche * 4.2; luzCoche.intensity = 1.8 + noche * 4.4; }
        else luzFuego.intensity = 0;
      } else {
        luzCoche.intensity = 0; luzFuego.intensity = 0;
      }
      // la nieve que salta del quitanieves, andando en un tramo nevado
      actualizarSpray(nieve.spray, dt, enNieve && estado.loco.quitanieves && vel > 0.3 && lejos < 160, vel, vagones.loco.o);
      tren.taller?.actualizar?.(dt, noche, camara);
    },
    // para las pruebas: los nombres de las partes que se dibujan
    piezasVisibles: () => [...ctx.piezas].filter(([, id]) => visibles.has(id)).map(([n]) => n).filter(Boolean),
    // para medir
    medir() {
      let tri = 0, dibujos = 0;
      g.traverse((m) => {
        if (!m.isMesh || !m.visible) return;
        let vis = true;
        for (let p = m.parent; p; p = p.parent) if (!p.visible) { vis = false; break; }
        if (!vis) return;
        dibujos++;
        const n = m.geometry.index ? Math.min(m.geometry.index.count, m.geometry.drawRange.count) : m.geometry.attributes.position.count;
        tri += n / 3;
      });
      return { dibujos, triangulos: Math.round(tri), huesos: huesos.length, largo: +tren.largoTotal.toFixed(1), composicion: composicion.slice() };
    },
  };
  rearmarLista();
  M.atlas.ponerNombre(nombreLoco());
  pintar();
  piezas();
  trenActual = tren;
  return tren;
}
// Los vértices del haz, repartidos entre los huesos a lo largo de la vía (dos por vértice, con su peso)
function curvarHaz(geo, haz) {
  if (!haz?.length) return;
  const pos = geo.attributes.position, si = geo.attributes.skinIndex.array, sw = geo.attributes.skinWeight.array;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, Math.min(haz.length - 1 - 1e-6, (pos.getZ(i) - HAZ.z0) / HAZ.paso));
    const k = Math.floor(t), w = t - k;
    si[i * 4] = haz[k]; si[i * 4 + 1] = haz[Math.min(haz.length - 1, k + 1)];
    sw[i * 4] = 1 - w; sw[i * 4 + 1] = w;
  }
}
// La figura sentada (como la pose 'sentado' de gente.js), una sola vez: la cadera a la altura del banco
function sentar(r) {
  const b = bajaSentado(0.44, r.g?.scale?.y);
  const cadera = 0.82 - b, recoge = cadera < 0.44 ? Math.acos(Math.max(0, cadera - 0.02) / 0.44) : 0;
  r.torso.position.y -= b; r.cabeza.position.y -= b;
  r.brazos[0].position.y -= b; r.brazos[1].position.y -= b;
  for (const p of r.patas) { p.position.y -= b; p.rotation.x = -1.45; if (p.userData.rodilla) p.userData.rodilla.rotation.x = 1.45 - recoge; }
  r.torso.rotation.x = -0.04;
  r.brazos[0].rotation.x = -0.45; r.brazos[1].rotation.x = -0.45;
}

// La nieve de la gran nevada sobre la vía: cada tramo tapado es una franja de nieve con su lomo sobre los rieles
// (con el material de la vía: nada que compilar). Se rearma sólo cuando cambian los tramos.
function armarNieveVia(nieve, tramos, enVia, largo, g) {
  const firma = (tramos || []).map((t) => `${Math.round(t.desde)}:${Math.round(t.hasta)}`).join(',');
  if (firma === nieve.firma) return;
  nieve.firma = firma;
  if (nieve.malla) { g.parent?.remove(nieve.malla); nieve.malla.geometry.dispose(); nieve.malla = null; }
  if (!tramos?.length || !nieve.mat) return;
  const c = new Constructor();
  const ruido = (x) => 0.04 * Math.sin(x * 2.3) + 0.03 * Math.sin(x * 5.1 + 1.3);
  for (const tr of tramos) {
    const L = tr.hasta - tr.desde, pasos = Math.max(2, Math.ceil(L / 0.6));
    const filas = [];
    for (let i = 0; i <= pasos; i++) {
      const ss = tr.desde + (L * i) / pasos;
      const p = enVia(ss % largo);
      const nx = Math.cos(p.ang), nz = -Math.sin(p.ang);
      // el lomo entra de a poco en las puntas
      const borde = Math.min(1, Math.min(ss - tr.desde, tr.hasta - ss) / 2.5);
      const h = (0.34 + ruido(ss)) * (0.25 + 0.75 * borde);
      const perfil = [[-2.6, -0.06], [-1.8, 0.1 + ruido(ss + 3) * borde], [-1.0, h * 0.9], [0, h + 0.02], [1.0, h * 0.92], [1.8, 0.12 + ruido(ss + 7) * borde], [2.6, -0.06]];
      filas.push(perfil.map(([d, y]) => [p.x + nx * d, p.y + y, p.z + nz * d]));
    }
    const pos = [];
    for (let i = 0; i < filas.length - 1; i++) for (let j = 0; j < filas[i].length - 1; j++) {
      const A = filas[i][j], B = filas[i][j + 1], C2 = filas[i + 1][j + 1], D = filas[i + 1][j];
      pos.push(...A, ...C2, ...B, ...A, ...D, ...C2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    // (las normales, para arriba: el orden de los triángulos depende del sentido de la vía)
    c.agregar(geo, { color: '#eef2f7', tipo: 4, variar: 0.05, suave: true });
    geo.dispose();
  }
  const gm = c.geometria();
  const n = gm.attributes.normal;
  for (let i = 0; i < n.count; i++) if (n.getY(i) < 0) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  const m = new THREE.Mesh(gm, nieve.mat);
  m.receiveShadow = true; m.castShadow = false;
  m.name = 'tren-nieve-via';
  (g.parent || g).add(m);
  nieve.malla = m;
}
// la nieve que salta a los costados del quitanieves (puntos que viven un segundo)
const SPRAY = 180;
function crearSpray() {
  const pos = new Float32Array(SPRAY * 3), vel = new Float32Array(SPRAY * 3), vida = new Float32Array(SPRAY);
  for (let i = 0; i < SPRAY; i++) { vida[i] = -0.001 - i / SPRAY; pos[i * 3 + 1] = -1e4; }   // (escalonadas, guardadas lejos)
  const gp = new THREE.BufferGeometry();
  gp.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sp = new THREE.Points(gp, new THREE.PointsMaterial({ color: 0xf4f7fb, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, map: texturaCopo() }));
  sp.frustumCulled = false;
  sp.userData = { vel, vida, sem: 3 };
  sp.name = 'tren-nieve-spray';
  return sp;
}
const _pS = new THREE.Vector3(), _vS = new THREE.Vector3();
function actualizarSpray(sp, dt, activo, vel, loco) {
  const u = sp.userData;
  if (!activo && !sp.visible) return;
  const pos = sp.geometry.attributes.position.array;
  let vivas = 0;
  const az = () => { u.sem = (u.sem * 16807) % 2147483647; return u.sem / 2147483647; };
  // nace en la punta de la cuña y sale para el costado y para arriba
  const nacer = (i) => {
    const lado = i % 2 ? 1 : -1;
    _pS.set(lado * (0.3 + az() * 0.7), 0.3 + az() * 0.4, 5.0 - az() * 0.8).applyMatrix4(loco.matrixWorld);
    pos[i * 3] = _pS.x; pos[i * 3 + 1] = _pS.y; pos[i * 3 + 2] = _pS.z;
    _vS.set(lado * (1.6 + az() * 2.2), 1.6 + az() * 2.4, 0.4 + az() * 1.2).transformDirection(loco.matrixWorld).multiplyScalar(2 + Math.min(3, vel));
    u.vel[i * 3] = _vS.x; u.vel[i * 3 + 1] = Math.abs(_vS.y) + 1.2; u.vel[i * 3 + 2] = _vS.z;
    u.vida[i] = 0;
  };
  for (let i = 0; i < SPRAY; i++) {
    if (u.vida[i] < 0) {
      if (!activo) continue;
      u.vida[i] += dt * 1.4;
      if (u.vida[i] < 0) continue;
      nacer(i);
    } else {
      u.vida[i] += dt * 1.4;
      if (u.vida[i] >= 1) {
        if (activo) nacer(i);
        else { u.vida[i] = -0.001 - i / SPRAY; pos[i * 3 + 1] = -1e4; continue; }
      }
    }
    vivas++;
    u.vel[i * 3 + 1] -= 6 * dt;
    pos[i * 3] += u.vel[i * 3] * dt; pos[i * 3 + 1] += u.vel[i * 3 + 1] * dt; pos[i * 3 + 2] += u.vel[i * 3 + 2] * dt;
  }
  sp.visible = activo || vivas > 0;
  sp.geometry.attributes.position.needsUpdate = true;
}

let copo = null;
function texturaCopo() {
  if (copo) return copo;
  const l = document.createElement('canvas'); l.width = l.height = 32;
  const g = l.getContext('2d'), gr = g.createRadialGradient(16, 16, 1, 16, 16, 15);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  copo = new THREE.CanvasTexture(l);
  return copo;
}

// 3.7.3 (taller): el taller del prototipo (crearTaller) se sacó: el del juego es el edificio 'taller-tren' de la aldea
// (aldea-arquitectura.js armarTallerTren, con su foso, el cuarto de Martín, colisiones y puerta; ver taller-tren-juego.js).
