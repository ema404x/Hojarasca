// 3.7.3 (PROTOTIPO, sólo imágenes): "La trochita" mejorada y el taller ferroviario de la aldea, para ver
// cómo quedarían con los gráficos del juego antes de hacerlos de verdad. Se prende con
// `?debug=1&tren=proto` (ver main.js): reemplaza al tren de trochita.js en la vía y pone el taller al otro
// lado de la vía, frente a la estación de la Aldea de los Duendes. Sin el ajuste, nada de esto se arma.
//
// Cómo está hecho (pensado para que cueste poco en la Radeon integrada):
//   · Todo el tren (locomotora, ténder y seis coches, por dentro y por fuera) es UNA malla por material,
//     con "piel por huesos" (como la gente de gente-cuerpo.js: el three del juego no trae SkinnedMesh):
//     cada vagón es un hueso (trochita.js lo pone en la vía con `colocar`), cada eje es un hueso hijo que
//     gira, y las bielas, las crucetas y los vástagos son huesos que se mueven con las ruedas. Cinco
//     dibujos para todo el tren (estructura, vidrios, fuego, faroles, letras pintadas) más el haz del
//     farol de noche; el tren de antes eran unos 80.
//   · El material es el de la aldea (prepararMaterialAldea: tablas, chapa, piedra con juntas, vetas,
//     musgo y óxido en el shader) con tipos propios del tren (aSuperficie 20 a 27): hierro pintado con
//     hollín que chorrea y óxido abajo, hierro crudo, bronce con brillo de sol, machimbre de 9 cm afuera
//     (gastado) y adentro (barnizado), tela, lona embreada del techo y hollín de la caja de humo.
//   · Escala real: trocha de 75 cm, ruedas motrices de 84 cm, caldera de 1,10 m, coches de 2,10 m de
//     ancho y 8,8 m de caja (10,9 m con las plataformas). El tren entero mide unos 70 m.
import * as THREE from 'three';
import { Constructor, matriz, abollar } from './geometria.js';
import { materialVegetal, U } from './materiales.js';
import { prepararMaterialAldea, SUPERFICIES_ALDEA } from './aldea-arquitectura.js';
import { registrarLuz } from './luces.js';
import { crearPersona } from './gente-cuerpo.js';
import { mallaCaballo } from './caballo-mundo.js';
import { marcoAldea } from './aldea.js';

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

// ---------------------------------------------------------------- el constructor (con superficie y hueso)
class CT extends Constructor {
  constructor() { super(); this.sup = []; this.hueso = []; this.supActual = 0; this.huesoActual = 0; }
  agregar(geo, o = {}) {
    const n0 = this.tipo.length;
    super.agregar(geo, o);
    const s = o.sup ?? this.supActual, h = o.hueso ?? this.huesoActual;
    for (let i = n0; i < this.tipo.length; i++) { this.sup.push(s); this.hueso.push(h); }
    return this;
  }
  // un triángulo suelto, con su normal por vértice y un color
  tri(p0, p1, p2, n0, n1, n2, k, tipo = 0, sup = this.supActual) {
    for (const [p, n] of [[p0, n0], [p1, n1], [p2, n2]]) {
      this.pos.push(p[0], p[1], p[2]); this.nor.push(n[0], n[1], n[2]); this.col.push(k.r, k.g, k.b);
      this.tipo.push(tipo); this.sup.push(sup); this.hueso.push(this.huesoActual);
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
      this.tipo.push(otro.tipo[i]); this.sup.push(otro.sup[i]); this.hueso.push(this.huesoActual);
    }
  }
  // geometría soldada (cada vértice repetido una sola vez), con aSuperficie, aLocal y, si `piel`, los
  // índices de hueso (uno por vértice, peso 1)
  armar({ piel = false } = {}) {
    const mapa = new Map(), ind = [], P = [], N = [], C = [], T = [], S = [], H = [];
    const q = (x, k) => Math.round(x * k);
    for (let i = 0, n = this.tipo.length; i < n; i++) {
      const i3 = i * 3;
      const clave = q(this.pos[i3], 1e4) + ',' + q(this.pos[i3 + 1], 1e4) + ',' + q(this.pos[i3 + 2], 1e4) + '|' + q(this.nor[i3], 500) + ',' + q(this.nor[i3 + 1], 500) + ',' + q(this.nor[i3 + 2], 500)
        + '|' + q(this.col[i3], 1e3) + ',' + q(this.col[i3 + 1], 1e3) + ',' + q(this.col[i3 + 2], 1e3) + '|' + this.tipo[i] + '|' + this.sup[i] + '|' + this.hueso[i];
      let j = mapa.get(clave);
      if (j === undefined) {
        j = T.length; mapa.set(clave, j);
        P.push(this.pos[i3], this.pos[i3 + 1], this.pos[i3 + 2]); N.push(this.nor[i3], this.nor[i3 + 1], this.nor[i3 + 2]);
        C.push(this.col[i3], this.col[i3 + 1], this.col[i3 + 2]); T.push(this.tipo[i]); S.push(this.sup[i]); H.push(this.hueso[i]);
      }
      ind.push(j);
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
    g.setIndex(new THREE.BufferAttribute(T.length > 65535 ? new Uint32Array(ind) : new Uint16Array(ind), 1));   // (el three del juego no trae Uint16/32BufferAttribute)
    g.computeBoundingSphere();
    return g;
  }
}

// ---------------------------------------------------------------- primitivas
// (o: rx, ry, rz, tipo, sup, hueso, variar, bajo, alto (el degradado de abajo hacia arriba), abollar, esc)
function agregarCon(c, g, hex, p, o = {}) {
  const k = new THREE.Color(hex);
  c.agregar(g, {
    tipo: o.tipo ?? 0, variar: o.variar ?? 0.05, sup: o.sup, hueso: o.hueso, suave: o.suave,
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
    if (sh.fragmentShader === f0 || sh.vertexShader === v0) console.warn('[tren-proto] el shader de la aldea cambió: revisar los reemplazos');
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
  };
  const pintar = () => {
    ctx.clearRect(0, 0, W, H);
    // el nombre: filete doble con esquinas y letras de pincel doradas
    ctx.save();
    ctx.strokeStyle = '#e2c27a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(10, 10, W - 20, 172, 34); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(24, 24, W - 48, 144, 24); ctx.stroke();
    for (const x of [44, W - 44]) { ctx.beginPath(); ctx.arc(x, 96, 10, 0, PI * 2); ctx.fillStyle = '#e2c27a'; ctx.fill(); }
    ctx.font = '700 132px "Caveat", "Spectral", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 10; ctx.strokeStyle = '#3a1810'; ctx.strokeText('La Hojarasca', W / 2, 100);
    const grad = ctx.createLinearGradient(0, 40, 0, 150); grad.addColorStop(0, '#f6e2a4'); grad.addColorStop(1, '#c99a48');
    ctx.fillStyle = grad; ctx.fillText('La Hojarasca', W / 2, 100);
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
  return { tex, rect };
}
// las calcomanías: cuadriláteros con su rectángulo del atlas, con hueso
class Calcos {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.hueso = []; this.huesoActual = 0; }
  // centro c, ejes u (a lo ancho) y v (a lo alto), unitarios; normal = u × v
  poner(c, u, v, ancho, alto, r) {
    const n = new THREE.Vector3(...u).cross(new THREE.Vector3(...v)).normalize();
    const P = (su, sv) => [c[0] + u[0] * su * ancho / 2 + v[0] * sv * alto / 2, c[1] + u[1] * su * ancho / 2 + v[1] * sv * alto / 2, c[2] + u[2] * su * ancho / 2 + v[2] * sv * alto / 2];
    const esq = [[P(-1, -1), r[0], r[1]], [P(1, -1), r[2], r[1]], [P(1, 1), r[2], r[3]], [P(-1, -1), r[0], r[1]], [P(1, 1), r[2], r[3]], [P(-1, 1), r[0], r[3]]];
    for (const [p, a, b] of esq) { this.pos.push(...p); this.nor.push(n.x, n.y, n.z); this.uv.push(a, b); this.hueso.push(this.huesoActual); }
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
      this.pos.push(v.x, v.y, v.z); this.nor.push(n.x, n.y, n.z); this.uv.push(otro.uv[i * 2], otro.uv[i * 2 + 1]); this.hueso.push(this.huesoActual);
    }
  }
  armar({ piel = false } = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (piel) {
      const n = this.hueso.length, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { si[i * 4] = this.hueso[i]; sw[i * 4] = 1; }
      g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    }
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
// del taller), `hueso` devuelve 0 y nada se mueve.
function contexto(conHuesos) {
  const ctx = { E: new CT(), V: new CT(), F: new CT(), L: new CT(), H: new CT(), D: new Calcos(), huesos: [], moviles: [] };
  ctx.poner = (h) => { for (const c of [ctx.E, ctx.V, ctx.F, ctx.L, ctx.H, ctx.D]) c.huesoActual = h; };
  ctx.hueso = (padre, pos, datos = {}) => {
    if (!conHuesos) return 0;
    const o = new THREE.Object3D();
    o.position.set(...pos);
    const i = ctx.huesos.length;
    ctx.huesos.push({ o, padre, ref: pos.slice(), inversa: new THREE.Matrix4().makeTranslation(-pos[0], -pos[1], -pos[2]) });
    ctx.moviles.push({ i, o, ...datos });
    return i;
  };
  ctx.vagon = (nombre) => {
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
function armarLoco(ctx) {
  const c = ctx.E;
  const vag = ctx.vagon('loco');
  ctx.poner(vag);
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
  // ---- arenero (domo arriba de la caldera) y sus caños hasta delante de las ruedas
  cil(c, [0, 2.32, 1.9], 0.26, 0.32, K.negro, { lados: 18, sup: ST.pintado });
  torno(c, [0, 2.47, 1.9], [[0.27, 0], [0.26, 0.05], [0.2, 0.12], [0.08, 0.16], [0, 0.17]], K.negro, { lados: 18, sup: ST.pintado });
  cil(c, [0, 2.46, 1.9], 0.272, 0.04, K.bronce, { lados: 18, sup: ST.bronce });
  cil(c, [0, 2.65, 1.9], 0.05, 0.04, K.bronce, { lados: 10, sup: ST.bronce });
  for (const s of [-1, 1]) tubo(c, [[s * 0.2, 2.3, 1.9], [s * 0.58, 1.95, 1.94], [s * 0.64, 1.25, 1.96], [s * 0.44, 0.5, 1.98], [s * 0.38, 0.27, 1.99]], 0.022, '#3a3632', { sup: ST.hierro, tramos: 18 });
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
  // ---- farol de caja sobre la caja de humo
  caja(c, [0, 2.35, 3.62], [0.2, 0.08, 0.3], K.negro, { sup: ST.pintado });
  caja(c, [0, 2.6, 3.68], [0.36, 0.38, 0.36], K.negro, { sup: ST.pintado });
  cil(c, [0, 2.79, 3.68], 0.18, 0.36, K.negro, { lados: 12, rx: PI / 2, desde: PI / 2, arco: PI, sup: ST.pintado });
  cil(c, [0, 2.92, 3.62], 0.04, 0.12, K.negro, { lados: 8, sup: ST.pintado });
  cil(c, [0, 2.6, 3.87], 0.155, 0.04, K.bronce, { lados: 18, rx: PI / 2, sup: ST.bronce });
  disco(ctx.L, [0, 2.6, 3.892], 0.13, '#fff1c8', { lados: 18 });
  for (const s of [-1, 1]) caja(c, [s * 0.185, 2.6, 3.68], [0.01, 0.18, 0.2], K.bronce, { sup: ST.bronce });
  // el haz (de noche): un cono que se abre hacia adelante y se apaga en la punta
  {
    const g = new THREE.CylinderGeometry(0.13, 2.0, 16, 18, 4, true);
    g.rotateX(-PI / 2); g.translate(0, 2.6, 3.9 + 8);
    const n0 = ctx.H.tipo.length;
    ctx.H.agregar(g, { color: '#ffffff', variar: 0 });
    // (Constructor pinta todo de un color: el degradado, de tibio junto al farol a nada en la punta)
    for (let i = n0; i < ctx.H.tipo.length; i++) {
      const t = Math.min(1, Math.max(0, 1 - (ctx.H.pos[i * 3 + 2] - 3.9) / 16)), k = Math.pow(t, 3.0) * 0.035;
      ctx.H.col[i * 3] = k; ctx.H.col[i * 3 + 1] = k * 0.86; ctx.H.col[i * 3 + 2] = k * 0.6;
    }
    g.dispose();
  }
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
    // el nombre pintado
    ctx.D.costado(s, 1.051, 1.66, -2.52, 1.72, 0.32, materiales().atlas.rect.nombre);
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
  // ---- quitanieves en punta (la cuña abre la nieve hacia los dos lados)
  {
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
  }
  // ---- banderines: dos banderas celeste y blanca al frente, y una guirnalda de banderitas de fiesta
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
  return { vag, ejes: ejesH };
}

// ---------------------------------------------------------------- el ténder (agua y leña)
function armarTender(ctx) {
  const c = ctx.E;
  const vag = ctx.vagon('tender');
  ctx.poner(vag);
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
  bogie(ctx, vag, 1.55, 0.27);
  bogie(ctx, vag, -1.55, 0.27);
  return { vag };
}

// ---------------------------------------------------------------- los coches
// Caja de 8,8 m × 2,1 m (piso a 1 m del riel), plataformas abiertas en las puntas con baranda y
// escalones, techo en arco de lona, bogies a ±3 m con tensores. `tipo`: primera (salamandra),
// comedor, dormitorio, mirador; furgón y jaula se arman aparte (sin plataformas).
const COCHE = { L: 8.8, a: 1.05, piso: 1.0, ventana: [1.88, 2.58], cornisa: 2.98 };
function armarCoche(ctx, tipo) {
  const c = ctx.E, at = materiales().atlas.rect;
  const vag = ctx.vagon(tipo);
  ctx.poner(vag);
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
      ctx.D.costado(s, a + 0.002, (v1 + COCHE.cornisa) / 2 + 0.01, 0, 1.9, 0.34, at[tipo === 'primera' ? 'primera' : tipo]);
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
    // ---- adentro, según el coche
    if (tipo === 'primera') interiorPrimera(ctx, vag);
    else if (tipo === 'comedor') interiorComedor(ctx, vag);
    else if (tipo === 'dormitorio') interiorDormitorio(ctx, vag);
    // faroles del techo (dos), de bronce con tubo de vidrio
    for (const z of [-2.2, 2.2]) {
      barra(c, [0, 3.2, z], [0, 2.88, z], 0.01, K.bronce, { sup: ST.bronce });
      torno(c, [0, 2.68, z], [[0, 0], [0.07, 0.02], [0.08, 0.06], [0.05, 0.08]], K.bronce, { lados: 10, sup: ST.bronce });
      torno(ctx.L, [0, 2.76, z], [[0.05, 0], [0.075, 0.05], [0.07, 0.13], [0.04, 0.16]], '#ffe2a6', { lados: 10 });
      torno(c, [0, 2.92, z], [[0.09, 0], [0.05, 0.04], [0.02, 0.06]], K.bronce, { lados: 10, sup: ST.bronce });
    }
  }
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
  ctx.F.agregar(new THREE.PlaneGeometry(0.28, 0.12), { color: '#ff8a2a', matriz: matriz([0.3, y + 0.62, -3.6], [0, -PI / 2, 0]) });
  for (let k = -2; k <= 2; k++) caja(c, [0.296, y + 0.62, -3.6 + k * 0.05], [0.006, 0.13, 0.012], '#1c1a18', { sup: ST.hierro });
  barra(c, [0.62, y + 0.85, -3.95], [0.62, 3.2, -3.95], 0.06, '#2a2725', { sup: ST.hierro, lados: 10 });
  barra(c, [0.62, 3.15, -3.95], [0.62, 3.7, -3.95], 0.065, '#1f1d1b', { sup: ST.hollin, lados: 10 });
  cil(c, [0.62, 3.77, -3.95], 0.18, 0.1, '#1f1d1b', { r1: 0.06, lados: 10, sup: ST.hollin, tipo: 4 });
  // la pava y una olla sobre la cocina
  torno(c, [0.62, y + 0.85, -3.3], [[0, 0], [0.09, 0], [0.1, 0.05], [0.08, 0.12], [0.04, 0.14], [0, 0.15]], '#4a4640', { lados: 12, sup: ST.hierro });
  cil(c, [0.62, y + 0.92, -3.75], 0.11, 0.14, '#5a5650', { lados: 12, sup: ST.hierro });
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
  const vag = ctx.vagon('furgon');
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
  bogie(ctx, vag, 2.7, 0.26);
  bogie(ctx, vag, -2.7, 0.26);
  return { vag, L };
}
// La jaula (para el caballo): de listones con luz entre uno y otro, techo de chapa, paja en el piso, el
// pesebre con pasto y el balde; adentro, tu caballo (si se pide)
function armarJaula(ctx) {
  const c = ctx.E;
  const vag = ctx.vagon('jaula');
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
  let sem = 5;
  const az = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  for (let k = 0; k < 18; k++) bola(c, [(az() - 0.5) * 1.6, y + 0.02, (az() - 0.5) * 7.4], [0.35 + az() * 0.3, 0.05, 0.3 + az() * 0.3], '#c8a85a', { sup: SA.adentro, variar: 0.15, lados: 7, filas: 4 });
  caja(c, [0, y + 1.0, -3.6], [1.6, 0.1, 0.5], '#7a5a3a', { sup: SA.tosca });
  for (const s of [-1, 1]) caja(c, [s * 0.75, y + 0.5, -3.6], [0.08, 1.0, 0.5], '#7a5a3a', { sup: SA.tosca });
  for (let k = 0; k < 7; k++) bola(c, [-0.6 + k * 0.2, y + 1.14, -3.6], [0.16, 0.1, 0.22], '#9a9a52', { sup: SA.adentro, variar: 0.2, lados: 7, filas: 4 });
  torno(c, [0.6, y, -2.9], [[0, 0], [0.13, 0], [0.16, 0.28], [0.15, 0.29]], '#8a8a84', { lados: 12, sup: ST.hierro });
  bogie(ctx, vag, 2.7, 0.26);
  bogie(ctx, vag, -2.7, 0.26);
  return { vag, L };
}

// ---------------------------------------------------------------- el tren entero
// `o`: { mat, trocha, escena, T } (lo que pasa trochita.js). Devuelve la forma que espera trochita.js.
export function armarTrenProto(o = {}) {
  const M = materiales();
  const ctx = contexto(true);
  const loco = armarLoco(ctx);
  const tender = armarTender(ctx);
  const furgon = armarFurgon(ctx);
  const jaula = armarJaula(ctx);
  const primera = armarCoche(ctx, 'primera');
  const salamandraPos = ctx.salamandra;
  const comedor = armarCoche(ctx, 'comedor');
  const cocinaPos = ctx.cocina;
  const dormitorio = armarCoche(ctx, 'dormitorio');
  const mirador = armarCoche(ctx, 'mirador');
  const g = new THREE.Group();
  g.name = 'tren-proto';
  // los huesos: los vagones cuelgan de g; los ejes y las bielas, de su vagón
  for (const h of ctx.huesos) {
    if (h.padre < 0) g.add(h.o);
    else ctx.huesos[h.padre].o.add(h.o);
  }
  // largo de cada vagón (de enganche a enganche) y medio paso entre bogies; adelante la locomotora
  const lista = [
    { nombre: 'loco', i: loco.vag, largo: [4.15, 3.72], b: LOCO.bogies },
    { nombre: 'tender', i: tender.vag, largo: [2.6, 2.6], b: 1.55 },
    { nombre: 'furgon', i: furgon.vag, largo: [4.3, 4.3], b: 2.7 },
    { nombre: 'jaula', i: jaula.vag, largo: [4.3, 4.3], b: 2.7 },
    { nombre: 'primera', i: primera.vag, largo: [5.5, 5.5], b: 3.0 },
    { nombre: 'comedor', i: comedor.vag, largo: [5.5, 5.5], b: 3.0 },
    { nombre: 'dormitorio', i: dormitorio.vag, largo: [5.5, 5.5], b: 3.0 },
    { nombre: 'mirador', i: mirador.vag, largo: [5.5, 5.5], b: 3.0 },
  ];
  let z = 0;
  lista.forEach((v, k) => { if (k > 0) z -= lista[k - 1].largo[1] + v.largo[0]; v.off = z; v.o = ctx.huesos[v.i].o; });
  const largoTotal = -z + lista[0].largo[0] + lista[lista.length - 1].largo[1];
  // las mallas, con la piel
  const huesos = ctx.huesos.map((h) => h.o), inversas = ctx.huesos.map((h) => h.inversa);
  const mallas = {};
  let esqueleto = null;
  const hacer = (nombre, geo, mat, sombra = false) => {
    const m = new MallaTren(geo, mat, null);
    if (!esqueleto) esqueleto = new EsqueletoTren(huesos, inversas, m);
    m.skeleton = esqueleto;
    m.castShadow = sombra; m.receiveShadow = true;
    m.name = 'tren-proto-' + nombre;
    g.add(m);
    mallas[nombre] = m;
    return m;
  };
  hacer('estructura', ctx.E.armar({ piel: true }), M.estructura, true);
  hacer('vidrios', ctx.V.armar({ piel: true }), M.vidrio).renderOrder = 2;
  hacer('fuego', ctx.F.armar({ piel: true }), M.fuego);
  hacer('faroles', ctx.L.armar({ piel: true }), M.faroles);
  hacer('letras', ctx.D.armar({ piel: true }), M.letras).renderOrder = 1;
  hacer('haz', ctx.H.armar({ piel: true }), M.haz).renderOrder = 3;
  // el caballo, en la jaula (mirando para adelante)
  try {
    const cab = mallaCaballo();
    cab.g.position.set(0.05, COCHE.piso, 0.4);
    cab.g.scale.setScalar(0.95);
    ctx.huesos[jaula.vag].o.add(cab.g);
  } catch (e) { console.warn('[tren-proto] sin caballo', e); }
  // luces: el farol (foco que alumbra la vía), la de adentro del coche y la de la salamandra
  const luzFaro = new THREE.SpotLight(0xffe2ab, 0, 45, 0.42, 0.85, 1.5);
  luzFaro.position.set(...LOCO.farol);
  const blancoFaro = new THREE.Object3D(); blancoFaro.position.set(0, -1.2, 18);
  lista[0].o.add(luzFaro, blancoFaro);
  luzFaro.target = blancoFaro;
  const luzCabina = new THREE.PointLight(0xff9a4a, 0, 6, 1.6);
  luzCabina.position.set(0, 1.7, -2.2);
  lista[0].o.add(luzCabina);
  registrarLuz(luzCabina);
  const luzCoche = new THREE.PointLight(0xffc98a, 0, 7, 1.5);
  const luzFuego = new THREE.PointLight(0xff8a3a, 0, 5, 1.6);
  g.add(luzCoche, luzFuego);
  registrarLuz(luzFaro); registrarLuz(luzCoche); registrarLuz(luzFuego);
  // lo que trochita.js toca de los coches de antes (los faroles, la pintura): de mentira
  const falso = () => ({ material: { color: new THREE.Color() } });
  const coches = lista.slice(2).map((v) => { v.o.userData.farol = falso(); return v.o; });
  const porNombre = Object.fromEntries(lista.map((v) => [v.nombre, v]));
  // la nieve sobre la vía delante del quitanieves (sólo en invierno; la arma alActualizar)
  const nieve = { malla: null, s: null, spray: null };
  const tmp = new THREE.Vector3(), inv = new THREE.Matrix4();
  let t = 0;
  const tren = {
    proto: true, g, loco: lista[0].o, tender: lista[1].o, coches, ruedas: [], faro: falso(), luzFaro, luzCoche, luzFuego, mallas, lista,
    offCoches: lista.slice(2).map((v) => v.off), boca: LOCO.boca, largoTotal, materiales: M,
    vagon: (n) => (typeof n === 'number' ? lista[n + 2]?.o : porNombre[n]?.o) || null,
    datos: (n) => porNombre[n] || null,
    colocar(enVia, s) {
      for (const v of lista) {
        const pA = enVia(s + v.off + v.b), pB = enVia(s + v.off - v.b);
        v.o.position.set((pA.x + pB.x) / 2, (pA.y + pB.y) / 2, (pA.z + pB.z) / 2);
        const d = Math.hypot(pA.x - pB.x, pA.z - pB.z) || 1;
        v.o.rotation.set(-Math.atan2(pA.y - pB.y, d), Math.atan2(pA.x - pB.x, pA.z - pB.z), 0, 'YXZ');
      }
    },
    // cada cuadro: las ruedas giran según lo andado, las bielas siguen a los muñones, las luces
    alActualizar({ dt, s, noche, lejos, camara, enVia }) {
      t += dt;
      for (const m of ctx.moviles) {
        if (m.tipo === 'eje') m.o.rotation.x = s / m.r;
      }
      const phi = s / 0.42;
      for (const m of ctx.moviles) {
        if (m.tipo === 'acople') m.o.position.set(m.o.position.x, m.cy + m.rc * Math.sin(m.a0 - phi), m.zMid + m.rc * Math.cos(m.a0 - phi));
        else if (m.tipo === 'motriz' || m.tipo === 'cruceta') {
          const py = m.cy + m.rc * Math.sin(m.a0 - phi), pz = m.zMotriz + m.rc * Math.cos(m.a0 - phi);
          const dy = m.cy - py, zc = pz + Math.sqrt(Math.max(0, m.L * m.L - dy * dy));
          if (m.tipo === 'motriz') { m.o.position.set(m.o.position.x, py, pz); m.o.rotation.x = Math.asin((py - m.cy) / m.L); }
          else m.o.position.set(m.o.position.x, 0.62, zc);
        }
      }
      // el fuego titila; los faroles se prenden con la noche; el haz sólo de noche
      const tit = 1.7 + Math.sin(t * 13.1) * 0.18 + Math.sin(t * 7.3 + 1.2) * 0.22 + Math.sin(t * 23.7) * 0.1;
      M.fuego.color.setScalar(tit);
      M.faroles.color.setScalar(0.45 + noche * 2.6);
      mallas.haz.visible = noche > 0.35 && lejos < 220;
      luzCabina.intensity = noche * (2.2 + (tit - 1.7) * 2) * (lejos < 90 ? 1 : 0);
      M.haz.opacity = 1;
      M.haz.color.setScalar(Math.min(1, (noche - 0.35) * 2.5));
      if (luzFaro.intensity > 0) luzFaro.intensity *= 10;
      // ¿la cámara está adentro de un coche? (prende su luz; la salamandra o la cocina, la suya)
      let adentro = null;
      if (camara) {
        for (const v of lista.slice(2)) {
          inv.copy(v.o.matrixWorld).invert();
          tmp.copy(camara.position).applyMatrix4(inv);
          if (Math.abs(tmp.x) < 1.05 && tmp.y > 0.9 && tmp.y < 3.2 && Math.abs(tmp.z) < (v.nombre === 'mirador' ? 5.3 : 4.4)) { adentro = v; break; }
        }
      }
      if (adentro) M.vidrio.color.setRGB(0.62 * (1 - noche) + 0.04 * noche, 0.69 * (1 - noche) + 0.05 * noche, 0.74 * (1 - noche) + 0.07 * noche);
      else M.vidrio.color.setRGB(0.62 + (1.0 - 0.62) * noche, 0.69 + (0.74 - 0.69) * noche, 0.74 + (0.45 - 0.74) * noche);
      M.vidrio.opacity = adentro ? 0.12 + noche * 0.5 : 0.22 + noche * 0.6;
      if (adentro) {
        const yL = adentro.nombre === 'mirador' ? 2.6 : 2.55;
        luzCoche.position.set(0, yL, 0).applyMatrix4(adentro.o.matrixWorld);
        luzCoche.intensity = 1.2 + noche * 3.2;
        const f = adentro.nombre === 'primera' ? salamandraPos : adentro.nombre === 'comedor' ? cocinaPos : null;
        if (f) { luzFuego.position.set(f.x + (f.x > 0 ? -0.35 : 0.35), f.y + 0.1, f.z).applyMatrix4(adentro.o.matrixWorld); luzFuego.intensity = (1.4 + noche * 1.6) * (tit / 1.7); }
        else if (adentro.nombre === 'dormitorio') { luzFuego.position.set(0.5, 2.35, 0).applyMatrix4(adentro.o.matrixWorld); luzFuego.intensity = 1.2 + noche * 2.2; }
        else luzFuego.intensity = 0;
      } else {
        luzCoche.intensity = 0; luzFuego.intensity = 0;
      }
      // invierno: nieve sobre la vía adelante del quitanieves y bordos de nieve abierta atrás
      const invierno = U.uInvierno.value > 0.5;
      if (invierno && enVia && (nieve.s === null || Math.abs(nieve.s - s) > 2)) armarNieveVia(nieve, enVia, s, g);
      if (nieve.malla) nieve.malla.visible = invierno;
      if (nieve.spray) nieve.spray.visible = invierno;
      tren.taller?.actualizar?.(dt, noche, camara);
    },
    // para medir
    medir() {
      let tri = 0, dibujos = 0;
      g.traverse((m) => { if (m.isMesh && m.visible) { dibujos++; tri += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; } });
      return { dibujos, triangulos: Math.round(tri), huesos: huesos.length, largo: +largoTotal.toFixed(1) };
    },
  };
  return tren;
}

// La nieve de la gran nevada sobre la vía: adelante del quitanieves la vía va tapada (30 m), y lo que el
// quitanieves abrió queda a los costados en dos bordos; en la punta, la nieve que salta.
function armarNieveVia(nieve, enVia, s, g) {
  const M = materiales();
  if (nieve.malla) { g.remove(nieve.malla); nieve.malla.geometry.dispose(); }
  if (nieve.spray) { g.remove(nieve.spray); nieve.spray.geometry.dispose(); }
  const c = new CT();
  const k1 = color('#f2f4f8'), k2 = color('#d8e0ea');
  const banda = (desde, hasta, perfil) => {
    const pasos = Math.ceil((hasta - desde) / 0.5);
    const filas = [];
    for (let i = 0; i <= pasos; i++) {
      const ss = desde + (hasta - desde) * (i / pasos);
      const p = enVia(s + ss);
      const nx = Math.cos(p.ang), nz = -Math.sin(p.ang);
      filas.push(perfil(ss).map(([d, h]) => [p.x + nx * d, p.y + h, p.z + nz * d]));
    }
    for (let i = 0; i < filas.length - 1; i++) for (let j = 0; j < filas[i].length - 1; j++) {
      const A = filas[i][j], B = filas[i][j + 1], C2 = filas[i + 1][j + 1], D = filas[i + 1][j];
      const n = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]).cross(new THREE.Vector3(D[0] - A[0], D[1] - A[1], D[2] - A[2])).normalize();
      if (n.y < 0) n.negate();
      const nn = n.toArray();
      const k = (i + j) % 3 ? k1 : k2;
      c.tri(A, C2, B, nn, nn, nn, k, 0, 0); c.tri(A, D, C2, nn, nn, nn, k, 0, 0);
      c.tri(A, B, C2, nn, nn, nn, k, 0, 0); c.tri(A, C2, D, nn, nn, nn, k, 0, 0);
    }
  };
  const ruido = (x) => 0.04 * Math.sin(x * 2.3) + 0.03 * Math.sin(x * 5.1 + 1.3);
  // adelante: la vía tapada (de la punta del quitanieves en adelante), con una ola donde empuja
  banda(4.9, 34, (ss) => {
    const ola = Math.exp(-((ss - 5.6) ** 2) / 0.5) * 0.35;
    const h = 0.3 + ola + ruido(ss);
    return [[-2.6, -0.05], [-1.8, 0.12 + ruido(ss + 3)], [-1.0, h * 0.9], [0, h + 0.02], [1.0, h * 0.92], [1.8, 0.14 + ruido(ss + 7)], [2.6, -0.05]];
  });
  // atrás y a los costados de la locomotora: los bordos que dejó el quitanieves
  for (const lado of [-1, 1]) banda(-60, 5.0, (ss) => {
    const sube = Math.min(1, Math.max(0, (5.0 - ss) / 1.0));
    const h = (0.45 + ruido(ss * 1.3 + lado)) * sube;
    return [[lado * 1.3, -0.05], [lado * 1.55, h * 0.8], [lado * 1.95, h], [lado * 2.5, h * 0.6], [lado * 3.1, -0.06]];
  });
  const m = new THREE.Mesh(c.armar(), M.estructura);
  m.receiveShadow = true; m.castShadow = false; m.frustumCulled = false;
  m.name = 'tren-proto-nieve';
  g.add(m);
  nieve.malla = m;
  // la nieve que salta del quitanieves (puntos)
  const N = 260, pos = new Float32Array(N * 3);
  let sem = 3;
  const az = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  const p0 = enVia(s + 5.2);
  const nx = Math.cos(p0.ang), nz = -Math.sin(p0.ang), fx = Math.sin(p0.ang), fz = Math.cos(p0.ang);
  for (let i = 0; i < N; i++) {
    const lado = i % 2 ? 1 : -1, t = az();
    const lat = lado * (0.6 + t * 2.4), alto = 0.2 + Math.sin(t * PI) * (1.2 + az() * 0.6), adel = -0.5 + az() * 1.4 - t * 1.2;
    pos[i * 3] = p0.x + nx * lat + fx * adel; pos[i * 3 + 1] = p0.y + alto; pos[i * 3 + 2] = p0.z + nz * lat + fz * adel;
  }
  const gp = new THREE.BufferGeometry();
  gp.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sp = new THREE.Points(gp, new THREE.PointsMaterial({ color: 0xf4f7fb, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, map: texturaCopo() }));
  sp.frustumCulled = false;
  g.add(sp);
  nieve.spray = sp;
  nieve.s = s;
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

// ---------------------------------------------------------------- el taller ferroviario
// Galpón de 17 × 7,2 m al otro lado de la vía, frente a la estación de la aldea (en el marco de la aldea:
// x a lo largo de la vía, z alejándose; el taller va en z < 0). Zócalo de piedra, tablas abajo y chapa
// arriba, ventanas altas, claraboyas en el techo, portón abierto hacia la estación, un desvío que sale de
// la vía principal y entra por el portón, y adentro: la locomotora sobre el foso, banco de trabajo con
// morsa y herramientas en el tablero, fragua con su campana, yunque, un juego de ruedas de repuesto,
// rieles y piezas de hierro, aparejo colgado de una viga, faroles de taller; Ernesto y Martín trabajando.
export function crearTallerProto({ T, escena, parada, tren }) {
  const M = materiales();
  const marco = marcoAldea(parada);
  const centro = { lx: 20.5, lz: -8.5 };
  const W = 8.5, D = 3.6, alero = 4.6, cumbre = 6.3;
  const w0 = marco.aMundo(centro.lx, centro.lz);
  // el piso del taller: a la altura de la vía en la estación, un poco más alto (el desvío sube 30 cm)
  const Y0 = parada.y + 0.3;
  const rot = parada.ang;
  const aLocal = (x, z) => marco.aMundo(centro.lx + x, centro.lz + z);
  const suelo = (x, z) => { const w = aLocal(x, z); return T.altura(w.x, w.z) - Y0; };
  const ctx = contexto(false);
  const c = ctx.E;
  // ---- zócalo de piedra (del terreno al piso) y el piso de cemento con el foso
  let bajo = 0;
  for (let x = -W; x <= W; x += 1) for (const z of [-D, D]) bajo = Math.min(bajo, suelo(x, z));
  for (let z = -D; z <= D; z += 1) for (const x of [-W, W]) bajo = Math.min(bajo, suelo(x, z));
  const yz = bajo - 0.3;
  for (const s of [-1, 1]) {
    caja(c, [0, (yz + 0.15) / 2, s * (D + 0.12)], [2 * W + 0.5, 0.15 - yz, 0.3], '#857c6e', { sup: SA.piedra });
    caja(c, [s * (W + 0.12), (yz + 0.15) / 2, 0], [0.3, 0.15 - yz, 2 * D + 0.5], '#857c6e', { sup: SA.piedra });
  }
  // el foso: entre los rieles, 7 m de largo; tan hondo como deje el terreno de abajo
  const fx0 = -4.7, fx1 = 3.4, fa = 0.31;
  let tSuelo = -9;
  for (let x = fx0; x <= fx1; x += 0.5) tSuelo = Math.max(tSuelo, suelo(x, 0));
  const hondo = Math.max(0.55, Math.min(1.1, -tSuelo - 0.08));
  const piso = '#6f6a62';
  caja(c, [0, -0.06, (fa + D) / 2], [2 * W, 0.12, D - fa], piso, { sup: SA.revoque, variar: 0.12 });
  caja(c, [0, -0.06, -(fa + D) / 2], [2 * W, 0.12, D - fa], piso, { sup: SA.revoque, variar: 0.12 });
  caja(c, [(-W + fx0) / 2, -0.06, 0], [fx0 + W, 0.12, 2 * fa], piso, { sup: SA.revoque });
  caja(c, [(W + fx1) / 2, -0.06, 0], [W - fx1, 0.12, 2 * fa], piso, { sup: SA.revoque });
  for (const s of [-1, 1]) caja(c, [(fx0 + fx1) / 2, -hondo / 2, s * (fa + 0.04)], [fx1 - fx0, hondo, 0.08], '#77736a', { sup: SA.piedra });
  caja(c, [fx0 - 0.04, -hondo / 2, 0], [0.08, hondo, 2 * fa], '#77736a', { sup: SA.piedra });
  caja(c, [fx1 + 0.04, -hondo / 2, 0], [0.08, hondo, 2 * fa], '#77736a', { sup: SA.piedra });
  caja(c, [(fx0 + fx1) / 2, -hondo - 0.03, 0], [fx1 - fx0, 0.06, 2 * fa], '#4a463f', { sup: SA.revoque });
  for (let k = 0; k < 3; k++) caja(c, [fx1 - 0.2 - k * 0.25, -hondo + (k + 1) * hondo / 4 - 0.05, 0], [0.25, 0.1, 2 * fa - 0.02], '#77736a', { sup: SA.piedra });
  // manchas de aceite en el piso
  for (const [x, z, r] of [[-1.5, 0.8, 0.5], [1.2, -0.9, 0.6], [-5.5, 0.5, 0.4], [4.5, 1.2, 0.45]]) disco(c, [x, 0.003, z], r, '#3a3632', { rx: -PI / 2, lados: 10, variar: 0.1, sup: SA.revoque });
  // ---- las vías: adentro, sobre el piso; afuera, el desvío hasta la principal
  const viaLocal = [];
  for (let x = -W - 0.2; x <= W - 0.8; x += 0.5) viaLocal.push([x, 0, 0]);
  rieles(c, viaLocal, false);
  // ---- las paredes: tablas abajo (1,2 m), chapa arriba, ventanas altas; postes y cabriadas adentro
  const ventanas = [-6.2, -3.1, 0, 3.1, 6.2];
  const yv0 = 2.5, yv1 = 3.8;
  for (const s of [-1, 1]) {
    const z = s * D;
    caja(c, [0, 0.62, z], [2 * W, 1.24, 0.1], '#6a4e36', { sup: SA.tablasHorizontales });
    caja(c, [0, (1.24 + yv0) / 2, z], [2 * W, yv0 - 1.24, 0.08], '#9a4a32', { sup: SA.chapa });
    caja(c, [0, (yv1 + alero) / 2, z], [2 * W, alero - yv1, 0.08], '#9a4a32', { sup: SA.chapa });
    let x0 = -W;
    for (const xv of ventanas) {
      caja(c, [(x0 + xv - 0.8) / 2, (yv0 + yv1) / 2, z], [xv - 0.8 - x0, yv1 - yv0, 0.08], '#9a4a32', { sup: SA.chapa });
      x0 = xv + 0.8;
      // marco, parteluces y vidrio (la luz entra de verdad: el vidrio no hace sombra)
      for (const yy of [yv0, yv1]) caja(c, [xv, yy, z + s * 0.05], [1.7, 0.08, 0.06], '#d8cfb8', { sup: SA.nada });
      for (const dx of [-0.8, -0.27, 0.27, 0.8]) caja(c, [xv + dx, (yv0 + yv1) / 2, z + s * 0.05], [0.05, yv1 - yv0, 0.05], '#d8cfb8', { sup: SA.nada });
      caja(c, [xv, (yv0 + yv1) / 2, z + s * 0.05], [1.6, 0.04, 0.04], '#d8cfb8', { sup: SA.nada });
      ctx.V.agregar(new THREE.PlaneGeometry(1.6, yv1 - yv0), { color: '#ffffff', matriz: matriz([xv, (yv0 + yv1) / 2, z]) });
    }
    caja(c, [(x0 + W) / 2, (yv0 + yv1) / 2, z], [W - x0, yv1 - yv0, 0.08], '#9a4a32', { sup: SA.chapa });
    caja(c, [0, 1.26, z + s * 0.06], [2 * W + 0.1, 0.06, 0.06], '#3e2e22', { sup: SA.tosca });
  }
  // los testeros: el del portón (x = −W, hacia la estación) y el de atrás, con su puerta chica
  const testero = (x, s, portón) => {
    const huecoA = portón ? 1.4 : 0.5, huecoY = portón ? 4.0 : 2.1, zp = portón ? 0 : -1.8;
    caja(c, [x, alero / 2, (D + zp + huecoA) / 2], [0.1, alero, D - zp - huecoA], '#9a4a32', { sup: SA.chapa });
    caja(c, [x, alero / 2, (-D + zp - huecoA) / 2], [0.1, alero, D + zp - huecoA], '#9a4a32', { sup: SA.chapa });
    caja(c, [x, (huecoY + alero) / 2, zp], [0.1, alero - huecoY, 2 * huecoA], '#9a4a32', { sup: SA.chapa });
    // el triángulo del frontón
    const k = color('#9a4a32'), n = [s, 0, 0];
    const A = [x, alero, -D - 0.05], B = [x, alero, D + 0.05], C2 = [x, cumbre, 0];
    c.supActual = SA.chapa;
    if (s < 0) c.tri(A, B, C2, n, n, n, k, 0, SA.chapa); else c.tri(A, C2, B, n, n, n, k, 0, SA.chapa);
    const m = [-s, 0, 0];
    if (s < 0) c.tri(A, C2, B, m, m, m, k, 0, SA.chapa); else c.tri(A, B, C2, m, m, m, k, 0, SA.chapa);
    c.supActual = 0;
    // una ventana redonda arriba
    cil(c, [x + s * 0.05, 5.2, 0], 0.42, 0.06, '#d8cfb8', { lados: 18, rz: PI / 2, sup: SA.nada });
    ctx.V.agregar(new THREE.CircleGeometry(0.36, 16), { color: '#ffffff', matriz: matriz([x + s * 0.09, 5.2, 0], [0, s * PI / 2, 0]) });
    // marco del hueco
    for (const dz of [-huecoA, huecoA]) caja(c, [x + s * 0.06, huecoY / 2, zp + dz], [0.06, huecoY, 0.12], '#3e2e22', { sup: SA.tosca });
    caja(c, [x + s * 0.06, huecoY, zp], [0.06, 0.12, 2 * huecoA + 0.12], '#3e2e22', { sup: SA.tosca });
    return { huecoA, huecoY, zp };
  };
  const port = testero(-W, -1, true);
  testero(W, 1, false);
  // las hojas del portón, abiertas hacia afuera (tablas verdes con su cruz)
  for (const lado of [-1, 1]) {
    const bisagra = [-W - 0.06, lado * port.huecoA], ancho = port.huecoA, giro = lado * 1.95;
    const cx = bisagra[0] - Math.sin(giro) * ancho / 2 * lado, cz = bisagra[1] - Math.cos(giro) * ancho / 2 * lado;
    const g = new CT();
    caja(g, [0, port.huecoY / 2 - 0.05, 0], [0.07, port.huecoY - 0.15, ancho], '#4b6a51', { sup: SA.tablasVerticales });
    for (const yy of [0.4, port.huecoY / 2, port.huecoY - 0.4]) caja(g, [0.05, yy, 0], [0.04, 0.16, ancho - 0.06], '#3d5a42', { sup: SA.tablasHorizontales });
    viga(g, [0.06, 0.45, -ancho / 2 + 0.1], [0.06, port.huecoY - 0.45, ancho / 2 - 0.1], 0.04, 0.14, '#3d5a42', { sup: SA.tablasHorizontales, arriba: [1, 0, 0] });
    c.anexar(g, new THREE.Matrix4().compose(new THREE.Vector3(cx, 0, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, giro + PI / 2 * 0, 0)), new THREE.Vector3(1, 1, 1)));
  }
  // el cartel sobre el portón
  caja(c, [-W - 0.1, 4.35, 0], [0.06, 0.42, 3.2], '#d8c8a0', { sup: SA.nada });
  ctx.D.poner([-W - 0.135, 4.35, 0], [0, 0, 1], [0, 1, 0], 3.0, 0.3, M.atlas.rect.taller);
  // ---- el techo a dos aguas de chapa, con dos claraboyas por lado y la linterna de ventilación arriba
  const incl = Math.atan2(cumbre - alero, D);
  const yAlero = alero - (0.5 / D) * (cumbre - alero);
  const largoF = Math.hypot(D + 0.5, cumbre - yAlero);
  for (const s of [-1, 1]) {
    const zc = s * (D + 0.5) / 2, yc = (cumbre + yAlero) / 2 + 0.04;
    const pend = [0, -s * Math.sin(incl), Math.cos(incl)];   // a lo largo del faldón (local z del tablero)
    const enF = (k) => [yc + pend[1] * k * largoF, zc + pend[2] * k * largoF * s * s];
    const faldon = (x0, x1, k0, k1, sup = SA.chapa) => {
      const [y, z] = enF((k0 + k1) / 2 - 0.5 + 0.5);
      caja(c, [(x0 + x1) / 2, y, z], [x1 - x0, 0.05, (k1 - k0) * largoF], '#8a8e8c', { sup, rx: s * incl, tipo: 4 });
    };
    for (const [x0, x1] of [[-W - 0.4, -4.4], [-3.4, 2.0], [3.0, W + 0.4]]) faldon(x0, x1, -0.5, 0.5);
    for (const [x0, x1] of [[-4.4, -3.4], [2.0, 3.0]]) {
      faldon(x0, x1, -0.5, -0.25); faldon(x0, x1, 0.25, 0.5);
      const [y, z] = enF(0);
      ctx.V.agregar(new THREE.PlaneGeometry(x1 - x0, largoF * 0.5), { color: '#ffffff', matriz: matriz([(x0 + x1) / 2, y + 0.01, z], [s * incl - PI / 2, 0, 0]) });
      for (const k of [-0.25, 0.25]) { const [y2, z2] = enF(k); caja(c, [(x0 + x1) / 2, y2 + 0.03, z2], [x1 - x0, 0.06, 0.07], '#3e2e22', { sup: SA.tosca, rx: s * incl }); }
      for (const xx of [x0, x1]) caja(c, [xx, y + 0.03, z], [0.07, 0.06, largoF * 0.5], '#3e2e22', { sup: SA.tosca, rx: s * incl });
    }
  }
  caja(c, [0, cumbre + 0.05, 0], [2 * W + 0.8, 0.08, 0.3], '#6a6e6c', { sup: SA.chapa, tipo: 4 });
  // la linterna (ventilación del humo) y el caño de la campana de humo sobre la chimenea de la locomotora
  caja(c, [-1.25, cumbre + 0.45, 0], [2.4, 0.8, 1.0], '#3e2e22', { sup: SA.tablasHorizontales });
  caja(c, [-1.25, cumbre + 0.9, 0], [2.8, 0.06, 1.6], '#8a8e8c', { sup: SA.chapa, tipo: 4 });
  // ---- adentro: postes, cabriadas (pendolón y tornapuntas), la viga del aparejo
  for (let x = -W + 0.2; x <= W - 0.1; x += 2.83) {
    for (const s of [-1, 1]) caja(c, [x, alero / 2, s * (D - 0.12)], [0.16, alero, 0.16], '#5a4430', { sup: SA.tosca });
    viga(c, [x, alero, -D + 0.1], [x, alero, D - 0.1], 0.14, 0.18, '#5a4430', { sup: SA.tosca });
    for (const s of [-1, 1]) viga(c, [x, alero + 0.05, s * (D - 0.1)], [x, cumbre - 0.1, 0], 0.14, 0.16, '#5a4430', { sup: SA.tosca });
    viga(c, [x, alero, 0], [x, cumbre - 0.1, 0], 0.12, 0.12, '#5a4430', { sup: SA.tosca });
    for (const s of [-1, 1]) viga(c, [x, alero + 0.1, 0], [x, alero + (cumbre - alero) * 0.5, s * D * 0.5], 0.09, 0.09, '#5a4430', { sup: SA.tosca });
  }
  viga(c, [-3.4, alero - 0.25, -D + 0.15], [-3.4, alero - 0.25, D - 0.15], 0.2, 0.28, '#3a3632', { sup: ST.hierro });
  // el aparejo: carro, cadena y gancho
  caja(c, [-3.4, alero - 0.48, 0.3], [0.3, 0.2, 0.26], K.hierro, { sup: ST.hierro });
  cil(c, [-3.4, alero - 0.8, 0.3], 0.14, 0.3, '#5a2a1e', { lados: 12, rx: PI / 2, sup: ST.pintado });
  for (let k = 0; k < 14; k++) caja(c, [-3.4 + (k % 2) * 0.004, alero - 1.0 - k * 0.11, 0.24], [0.02, 0.1, 0.05], '#4a4640', { sup: ST.hierro, ry: (k % 2) * PI / 2 });
  for (let k = 0; k < 9; k++) caja(c, [-3.4, alero - 1.0 - k * 0.11, 0.36], [0.02, 0.1, 0.05], '#4a4640', { sup: ST.hierro, ry: (k % 2) * PI / 2 });
  torno(c, [-3.4, alero - 2.62, 0.24], [[0.0, 0], [0.06, 0.02], [0.07, 0.08], [0.03, 0.12]], K.hierro, { lados: 8, sup: ST.hierro });
  agregarCon(c, new THREE.TorusGeometry(0.09, 0.02, 6, 12, PI * 1.4), K.hierro, [-3.4, alero - 2.75, 0.24], { sup: ST.hierro, rz: PI * 0.8, ry: PI / 2 });
  // la campana de humo y su caño
  torno(c, [-1.25, 3.9, 0], [[0.6, 0], [0.5, 0.15], [0.2, 0.45], [0.18, 0.5]], '#2a2622', { lados: 14, sup: ST.hollin });
  barra(c, [-1.25, 4.35, 0], [-1.25, cumbre + 1.6, 0], 0.18, '#2a2622', { sup: ST.hollin, lados: 12 });
  cil(c, [-1.25, cumbre + 1.7, 0], 0.4, 0.15, '#2a2622', { r1: 0.12, lados: 12, sup: ST.hollin, tipo: 4 });
  // ---- el banco de trabajo con la morsa, el tablero de herramientas, estantes y tachos de aceite
  {
    const zb = -D + 0.45;
    caja(c, [4.3, 0.92, zb], [4.6, 0.08, 0.7], '#7a5a3a', { sup: SA.tosca, abollar: 0.01 });
    caja(c, [4.3, 0.3, zb + 0.15], [4.4, 0.04, 0.5], '#6a4e32', { sup: SA.tosca });
    for (const x of [2.1, 4.3, 6.5]) for (const dz of [-0.3, 0.3]) caja(c, [x, 0.45, zb + dz], [0.1, 0.9, 0.1], '#5a4430', { sup: SA.tosca });
    // morsa
    caja(c, [2.6, 1.05, zb + 0.3], [0.2, 0.18, 0.24], '#3a4a5a', { sup: ST.pintado });
    caja(c, [2.6, 1.05, zb + 0.46], [0.2, 0.18, 0.06], '#3a4a5a', { sup: ST.pintado });
    barra(c, [2.6, 1.0, zb + 0.5], [2.6, 1.0, zb + 0.7], 0.015, K.acero, { sup: ST.hierro });
    barra(c, [2.48, 1.0, zb + 0.7], [2.72, 1.0, zb + 0.7], 0.012, K.acero, { sup: ST.hierro });
    // el tablero con las herramientas (siluetas pintadas detrás, como en todo taller)
    caja(c, [4.3, 1.75, -D + 0.12], [3.6, 1.2, 0.04], '#c8b890', { sup: SA.tablasVerticales + SA.adentro });
    let sem = 11;
    const az = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
    for (let k = 0; k < 14; k++) {
      const x = 2.75 + k * 0.23, y = 1.45 + (k % 3) * 0.28, largo = 0.22 + az() * 0.2;
      caja(c, [x, y, -D + 0.15], [0.05, largo, 0.01], '#4a4038', { sup: SA.nada });
      caja(c, [x, y, -D + 0.17], [0.035, largo - 0.02, 0.025], k % 4 === 0 ? '#8a3a28' : K.acero, { sup: ST.hierro });
      if (k % 3 === 0) caja(c, [x, y + largo / 2, -D + 0.18], [0.1, 0.05, 0.04], K.acero, { sup: ST.hierro });
    }
    // sobre el banco: una aceitera, una caja de bulones, una pieza a medio limar, un farol de mano
    torno(c, [5.6, 0.96, zb + 0.1], [[0, 0], [0.08, 0], [0.08, 0.06], [0.03, 0.12], [0.012, 0.3]], '#b89a4a', { lados: 10, sup: ST.bronce });
    caja(c, [4.8, 1.02, zb], [0.4, 0.12, 0.26], '#5a6a4a', { sup: ST.pintado });
    for (let k = 0; k < 8; k++) cil(c, [4.66 + (k % 4) * 0.09, 1.09, zb - 0.06 + Math.floor(k / 4) * 0.1], 0.02, 0.04, K.acero, { lados: 6, sup: ST.hierro });
    caja(c, [3.4, 0.99, zb + 0.15], [0.7, 0.06, 0.12], '#55524c', { sup: ST.hierro, ry: 0.3 });
    caja(c, [6.4, 1.08, zb + 0.15], [0.16, 0.24, 0.16], K.negro, { sup: ST.pintado });
    caja(ctx.F, [6.4, 1.08, zb + 0.15], [0.12, 0.14, 0.17], '#ffd890');
    // tachos de aceite y un barril
    for (const [x, z] of [[7.4, -2.7], [7.8, -2.2]]) {
      cil(c, [x, 0.42, z], 0.28, 0.84, '#3a5a4a', { lados: 14, sup: ST.pintado });
      for (const yy of [0.2, 0.62]) cil(c, [x, yy, z], 0.29, 0.04, '#2e3a32', { lados: 14, sup: ST.pintado });
    }
  }
  // ---- la fragua: hogar de ladrillo con brasas, campana y caño, fuelle; el yunque en su tronco
  {
    const fx = 7.0, fz = 2.4;
    caja(c, [fx, 0.4, fz], [1.2, 0.8, 1.0], '#8a5a44', { sup: SA.piedra });
    caja(c, [fx, 0.82, fz], [1.0, 0.06, 0.8], '#3a2a22', { sup: SA.nada });
    for (let k = 0; k < 10; k++) bola(ctx.F, [fx - 0.25 + (k % 5) * 0.12, 0.88, fz - 0.1 + Math.floor(k / 5) * 0.2], [0.07, 0.04, 0.07], k % 3 ? '#ff6a1a' : '#ffb04a', { lados: 6, filas: 4 });
    torno(c, [fx, 1.7, fz], [[0.7, 0], [0.6, 0.1], [0.25, 0.6], [0.2, 0.7]], '#2a2622', { lados: 4, sup: ST.hollin, ry: PI / 4 });
    barra(c, [fx, 2.3, fz], [fx, cumbre + 1.2, fz], 0.16, '#2a2622', { sup: ST.hollin, lados: 10 });
    caja(c, [fx - 0.9, 0.7, fz + 0.2], [0.6, 0.3, 0.5], '#6a4a30', { sup: SA.tosca, rz: 0.2 });
    // yunque
    cil(c, [5.6, 0.32, 1.8], 0.28, 0.64, '#5a4430', { lados: 10, sup: SA.tosca });
    caja(c, [5.6, 0.72, 1.8], [0.5, 0.16, 0.2], '#3a3836', { sup: ST.hierro });
    cil(c, [5.95, 0.76, 1.8], 0.08, 0.2, '#3a3836', { r1: 0.0, lados: 8, rz: -PI / 2, sup: ST.hierro });
    caja(c, [5.6, 0.86, 1.8], [0.62, 0.12, 0.24], '#3a3836', { sup: ST.hierro });
    barra(c, [5.4, 0.94, 1.75], [5.75, 0.95, 1.9], 0.015, '#5a4430', { sup: SA.tosca });
    caja(c, [5.42, 0.95, 1.74], [0.12, 0.06, 0.06], K.hierro, { sup: ST.hierro });
  }
  // ---- piezas de hierro: un juego de ruedas de repuesto, rieles apilados, zapatas, una tapa de cilindro,
  // resortes, bulones, una biela nueva sobre caballetes
  {
    const g = new CT();
    for (const s of [-1, 1]) ruedaRayos(g, s * 0.375, 0.42, 0, 0.42, s, { muñon: 0.2, a0: s > 0 ? 0 : -PI / 2 });
    cil(g, [0, 0.42, 0], 0.07, 0.66, K.hierro, { lados: 8, rz: PI / 2, sup: ST.hierro });
    c.anexar(g, new THREE.Matrix4().compose(new THREE.Vector3(-6.4, 0, -2.3), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.15, 0)), new THREE.Vector3(1, 1, 1)));
    for (const dx of [-0.4, 0.4]) caja(c, [-6.4 + dx * 0.15, 0.05, -2.3 + dx], [0.9, 0.1, 0.18], '#4a3a2a', { sup: SA.tosca });
    for (let k = 0; k < 5; k++) for (const s of [-1, 1]) caja(c, [-1.2 + k * 0.012, 0.18 + k * 0.1, D - 0.55 + s * 0.08 * (k % 2 ? 1 : 0.4)], [5.2, 0.09, 0.07], '#5e5a54', { sup: ST.hierro });
    for (const x of [-3.2, -1.2, 0.8]) caja(c, [x, 0.07, D - 0.55], [0.18, 0.14, 0.6], '#4a3a2a', { sup: SA.tosca });
    for (let k = 0; k < 7; k++) caja(c, [-5.3 + (k % 3) * 0.22, 0.06 + Math.floor(k / 3) * 0.1, 2.7 + (k % 2) * 0.1], [0.2, 0.09, 0.32], '#4a3e34', { sup: ST.hierro, ry: k * 0.4 });
    cil(c, [-4.6, 0.04, 2.5], 0.24, 0.08, K.negro, { lados: 16, sup: ST.pintado });
    cil(c, [-4.6, 0.09, 2.5], 0.18, 0.04, K.bronce, { lados: 16, sup: ST.bronce });
    for (const [x, z] of [[-5.9, 1.6], [-5.6, 1.75]]) cil(c, [x, 0.2, z], 0.08, 0.4, '#5a5650', { lados: 10, sup: ST.hierro });
    for (const x of [-0.6, 1.6]) { caja(c, [x, 0.35, -2.4], [0.12, 0.7, 0.5], '#5a4430', { sup: SA.tosca }); caja(c, [x, 0.72, -2.4], [0.5, 0.06, 0.12], '#5a4430', { sup: SA.tosca }); }
    caja(c, [0.5, 0.8, -2.4], [2.4, 0.1, 0.06], '#6a665e', { sup: ST.hierro });
    cil(c, [-0.7, 0.8, -2.4], 0.09, 0.08, '#6a665e', { lados: 12, rx: PI / 2, sup: ST.hierro });
    cil(c, [1.7, 0.8, -2.4], 0.07, 0.08, '#6a665e', { lados: 12, rx: PI / 2, sup: ST.hierro });
    // cajones con trapos y estopa
    caja(c, [7.6, 0.25, -0.9], [0.6, 0.5, 0.5], '#8a6a46', { sup: SA.tosca, abollar: 0.01 });
    bola(c, [7.6, 0.52, -0.9], [0.25, 0.08, 0.2], '#d8d0b8', { sup: SA.adentro });
  }
  // ---- los faroles de taller colgados (pantalla esmaltada verde, lamparita)
  const lamparas = [[-5.6, 1.2], [0.5, -1.7], [4.3, -2.5], [5.5, 1.7]];
  for (const [x, z] of lamparas) {
    barra(c, [x, alero, z], [x, 3.6, z], 0.006, K.hierro, { sup: ST.hierro });
    torno(c, [x, 3.35, z], [[0.32, 0], [0.3, 0.04], [0.14, 0.2], [0.05, 0.26]], '#3e5a46', { lados: 14, sup: ST.pintado });
    torno(c, [x, 3.351, z], [[0.31, 0.0], [0.13, 0.19]], '#e8e2d2', { lados: 14, sup: SA.nada, esc: [1, 1, 1] });
    bola(ctx.F, [x, 3.42, z], [0.06, 0.07, 0.06], '#fff0c0');
  }
  // ---- la locomotora (quieta, sobre el foso, mirando al portón)
  const lc = contexto(false);
  armarLoco(lc);
  const mLoco = new THREE.Matrix4().compose(new THREE.Vector3(2.0, 0, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -PI / 2, 0)), new THREE.Vector3(1, 1, 1));
  c.anexar(lc.E, mLoco); ctx.V.anexar(lc.V, mLoco); ctx.F.anexar(lc.F, mLoco); ctx.L.anexar(lc.L, mLoco); ctx.D.anexar(lc.D, mLoco);
  // ---- el desvío: de la vía principal (en x de aldea ≈ −14) hasta el portón (x local = −W), en S
  const via = [];
  const enMarco = (lx, lz) => ({ x: lx - centro.lx, z: lz - centro.lz });
  const riel = T.riel;
  const rielLocal = (i) => { const p = riel[(i + riel.length) % riel.length]; const l = marco.aLocal(p.x, p.z); return { lx: l.lx, lz: l.lz, h: p.h }; };
  // el punto de la vía principal más cercano a lx = −14
  let mejor = null;
  for (let i = parada.indice - 30; i <= parada.indice + 30; i++) { const q = rielLocal(i); if (!mejor || Math.abs(q.lx + 14) < Math.abs(mejor.lx + 14)) mejor = q; }
  const A = mejor || { lx: -14, lz: 0, h: parada.y };
  const B = { lx: centro.lx - W, lz: centro.lz, h: Y0 };
  const pasos = 48;
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos, u = (1 - Math.cos(t * PI)) / 2;
    const lx = A.lx + (B.lx - A.lx) * t, lz = A.lz + (B.lz - A.lz) * u, h = A.h + (B.h - A.h) * t;
    const p = enMarco(lx, lz);
    via.push([p.x, h - Y0, p.z]);
  }
  rieles(c, via, true, suelo);
  const geoE = c.armar(), geoV = ctx.V.armar(), geoF = ctx.F.armar(), geoL = ctx.L.armar(), geoD = ctx.D.armar();
  const grupo = new THREE.Group();
  grupo.name = 'taller-proto';
  grupo.position.set(w0.x, Y0, w0.z);
  grupo.rotation.y = rot;
  const mE = new THREE.Mesh(geoE, M.estructura); mE.castShadow = true; mE.receiveShadow = true;
  const vidrio = M.vidrio.clone(); vidrio.opacity = 0.25;
  const mV = new THREE.Mesh(geoV, vidrio);
  const mF = new THREE.Mesh(geoF, M.fuego);
  const mL = new THREE.Mesh(geoL, M.faroles);
  const mD = new THREE.Mesh(geoD, M.letras);
  grupo.add(mE, mV, mF, mL, mD);
  // la luz del taller (dos lámparas) y el resplandor de la fragua
  const luz = new THREE.PointLight(0xffd6a0, 0, 16, 1.3); luz.position.set(-4.5, 3.0, 0.6);
  const luzFragua = new THREE.PointLight(0xff8a3a, 0, 6, 1.6); luzFragua.position.set(7.0, 1.3, 2.0);
  grupo.add(luz, luzFragua);
  registrarLuz(luz); registrarLuz(luzFragua);
  // Ernesto (el jefe de estación) y Martín (maquinista retirado: mameluco azul, gorra, bigote blanco)
  const gente = [];
  const poner = (persona, x, z, mira, extra) => {
    const g = persona.g;
    g.position.set(x, 0, z); g.rotation.y = mira;
    grupo.add(g);
    gente.push({ persona, ...extra });
  };
  try {
    poner(crearPersona({}, 'aldea-jefe'), -5.3, -1.7, -0.45, { nombre: 'Ernesto', pose: 'cintura' });
    const martin = crearPersona({}, 'martin', false, {}, {
      aspecto: {
        edad: 71, cuerpo: { ancho: 1.0, fondo: 1.02, panza: 0.1, alto: 0.98 },
        cara: { ancho: 1.04, largo: 1.0, nariz: 1.25, ojos: 0.85, mand: 0.3, sonrisa: 0.45, arrugas: 'mayor', iris: '#3a4a5a' },
        colores: { piel: '#c49470', pelo: '#d8d4cc', barba: '#e0dcd4', ropa: '#c8c0a8', abrigo: '#3b4a5e', gorro: 'gorro', gorroColor: '#2e3a4c' },
        R: { pechera: '#3b4a5e', pantalon: '#3b4a5e', panuelo: '#a83a2a', botas: 'altas', botaCol: '#3a2a1e', arremangado: true, canas: 1, brea: true },
        guardas: { cuello: [1, 0, 'todo'] }, poses: ['cintura'],
      },
    });
    poner(martin, -3.95, 0, PI / 2, { nombre: 'Martín', brazo: true });
    martin.g.position.y = -hondo;
  } catch (e) { console.warn('[tren-proto] sin gente en el taller', e); }
  escena.add(grupo);
  let t = 0;
  const taller = {
    grupo, gente, luz,
    // zonas a despejar (árboles y pasto): el galpón y el desvío
    zonas: [{ ...marco.aMundo(centro.lx, centro.lz), radio: 12 }, { ...marco.aMundo(-2, -4), radio: 9 }, { ...marco.aMundo(-12, -1.5), radio: 5 }],
    actualizar(dt, noche) {
      t += dt;
      luz.intensity = 3.5 + noche * 4;
      luzFragua.intensity = 1.6 + Math.sin(t * 9) * 0.2 + Math.sin(t * 5.3) * 0.3;
      // Martín ajusta la cruceta con la llave: el brazo levantado hacia la locomotora
      for (const p of gente) {
        const r = p.persona;
        if (p.brazo && r.brazos?.[1]) { r.brazos[1].rotation.x = -1.25 + Math.sin(t * 2.2) * 0.08; r.brazos[1].rotation.z = 0.15; if (r.brazos[0]) r.brazos[0].rotation.x = -0.5; }
        if (p.pose === 'cintura' && r.brazos) { for (const [i, b] of r.brazos.entries()) { b.rotation.z = (i ? -1 : 1) * 0.55; b.rotation.x = 0.1; } }
      }
    },
    medir() {
      let tri = 0, dibujos = 0;
      grupo.traverse((m) => { if (m.isMesh && m.visible) { dibujos++; tri += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; } });
      return { dibujos, triangulos: Math.round(tri), hondoFoso: +hondo.toFixed(2) };
    },
  };
  if (tren) tren.taller = taller;
  return taller;
}
// rieles con durmientes y balasto, a lo largo de una polilínea local [x, y, z] (y: la base del riel);
// `terraplen`: con `suelo(x, z)`, un terraplén de piedra baja hasta el terreno
function rieles(c, pts, balasto, suelo = null) {
  const izq = [], der = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0], tz = b[2] - a[2], l = Math.hypot(tx, tz) || 1;
    const nx = -tz / l, nz = tx / l, ang = Math.atan2(tx, tz);
    const p = pts[i];
    izq.push(new THREE.Vector3(p[0] + nx * 0.375, p[1] + 0.09, p[2] + nz * 0.375));
    der.push(new THREE.Vector3(p[0] - nx * 0.375, p[1] + 0.09, p[2] - nz * 0.375));
    if (i % 1 === 0) {
      caja(c, [p[0], p[1] - 0.02, p[2]], [1.5, 0.1, 0.2], i % 3 ? '#4a3b2c' : '#57452f', { ry: ang, sup: SA.tosca, tipo: 4, variar: 0.1 });
      if (balasto) {
        const fondo = suelo ? Math.min(-0.25, suelo(p[0], p[2]) - p[1] - 0.1) : -0.25;
        caja(c, [p[0], p[1] + (fondo - 0.06) / 2, p[2]], [2.4 - Math.max(0, -fondo - 0.25) * 0.3, -fondo - 0.06, 0.55], '#6f6960', { ry: ang, sup: SA.laja, tipo: 4, variar: 0.12 });
      }
    }
  }
  for (const lado of [izq, der]) {
    const curva = new THREE.CatmullRomCurve3(lado);
    agregarCon(c, new THREE.TubeGeometry(curva, Math.max(4, lado.length * 2), 0.045, 5, false), '#8a8378', null, { sup: ST.hierro, tipo: 4, m: new THREE.Matrix4(), suave: true });
  }
}
