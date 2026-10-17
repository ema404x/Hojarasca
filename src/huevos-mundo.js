// 4.2 (huevos de pascua): lo que se ve de los easter eggs (las reglas, en huevos.js; el enganche, en huevos-juego.js).
//   · la rueda de hongos al pie del coihue de los duendes, la pilita de yerba y el bultito atado con hilo;
//   · (se suman el montículo del hueso y el huemul blanco).
// Todo con MAT_FAUNA (color por vértice, el de la gente y los animales: no compila nada nuevo), una malla por cosa y sólo a la vista
// cuando hace falta (lejos no se dibuja). Nada se mueve por cuadro.
import * as THREE from 'three';
import { MAT_FAUNA } from './vida.js';

const ruido = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _n3 = new THREE.Matrix3();
const _v = new THREE.Vector3(), _nn = new THREE.Vector3();

// Un armador de piezas con color por vértice (el de rincones-mundo.js, en chico)
class Pieza {
  constructor() { this.p = []; this.n = []; this.c = []; }
  geo(g, color, pos = [0, 0, 0], rot = [0, 0, 0], esc = [1, 1, 1], pin = 0.12) {
    const gg = g.index ? g.toNonIndexed() : g;
    _q.setFromEuler(_e.set(rot[0], rot[1], rot[2]));
    _m.compose(_p.set(pos[0], pos[1], pos[2]), _q, _s.set(esc[0], esc[1], esc[2]));
    _n3.getNormalMatrix(_m);
    const P = gg.attributes.position, N = gg.attributes.normal, base = new THREE.Color(color);
    for (let i = 0; i < P.count; i++) {
      _v.fromBufferAttribute(P, i).applyMatrix4(_m);
      _nn.fromBufferAttribute(N, i).applyMatrix3(_n3).normalize();
      this.p.push(_v.x, _v.y, _v.z); this.n.push(_nn.x, _nn.y, _nn.z);
      const k = 1 + pin * (ruido(Math.floor(_v.x * 14), Math.floor(_v.y * 14), Math.floor(_v.z * 14)) - 0.5) * 2 + 0.08 * _nn.y;
      this.c.push(base.r * k, base.g * k, base.b * k);
    }
    if (gg !== g) gg.dispose();
    g.dispose();
    return this;
  }
  cil(color, r1, r2, h, pos, lados = 6) { return this.geo(new THREE.CylinderGeometry(r1, r2, h, lados, 1, false), color, pos); }
  bola(color, r, pos, esc = [1, 1, 1], seg = [8, 5]) { return this.geo(new THREE.SphereGeometry(r, seg[0], seg[1]), color, pos, [0, 0, 0], esc); }
  caja(color, a, h, f, pos, rot = [0, 0, 0]) { return this.geo(new THREE.BoxGeometry(a, h, f), color, pos, rot); }
  malla() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, MAT_FAUNA);
    m.castShadow = false; m.receiveShadow = false; m.visible = false; m.frustumCulled = true; m.matrixAutoUpdate = false;
    return m;
  }
}

// La rueda de hongos: nueve, de dos tamaños, en un anillo parejo (aire de rueda de duendes, no de maceta)
function armarRueda(c, altura) {
  const P = new Pieza();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + (ruido(i, 1, 2) - 0.5) * 0.35, r = 2.3 + (ruido(i, 3, 4) - 0.5) * 0.6, k = (i % 3 === 0 ? 1.35 : 1) * 1.5;   // (a la altura del helecho: chicos, pero se ven)
    const x = Math.cos(a) * r, z = Math.sin(a) * r, y = altura(c.x + x, c.z + z) - altura(c.x, c.z);   // (cada hongo, a la altura del suelo)
    P.cil('#e8dcc0', 0.035 * k, 0.05 * k, 0.12 * k, [x, y + 0.06 * k, z]);
    P.bola(i % 2 ? '#b4412f' : '#c9553a', 0.1 * k, [x, y + 0.13 * k, z], [1, 0.55, 1], [8, 4]);
  }
  return P.malla();
}
// La pilita de yerba que se deja: un montoncito verde-pardo, aplastado
function armarPila() {
  const P = new Pieza();
  P.bola('#7d8a3c', 0.26, [0, 0.02, 0], [1.25, 0.55, 1.1], [8, 4]);
  P.bola('#9aa650', 0.15, [0.1, 0.1, 0.03], [1, 0.6, 1], [6, 3]);
  return P.malla();
}
// El bulto de la mañana: una tela clara atada con un hilo rojo (se ve de lejos, a un paso)
function armarBulto() {
  const P = new Pieza();
  P.bola('#d9ceb0', 0.14, [0, 0.12, 0], [1, 0.9, 1], [8, 5]);
  P.cil('#d9ceb0', 0.03, 0.06, 0.1, [0, 0.26, 0]);
  P.caja('#b13a2e', 0.2, 0.03, 0.2, [0, 0.14, 0], [0, 0.7, 0]);
  return P.malla();
}

export function crearHuevosMundo({ escena, altura }) {
  const grupo = new THREE.Group();
  grupo.name = 'huevos';
  escena.add(grupo);
  let rueda = null;
  const pila = armarPila(), bulto = armarBulto();
  for (const m of [pila, bulto]) grupo.add(m);
  const ponerEn = (m, x, z, giro = 0, dy = 0) => {
    m.position.set(x, altura(x, z) + dy, z); m.rotation.y = giro; m.scale.set(1, 1, 1);
    m.updateMatrix(); m.updateMatrixWorld(true);
  };
  const api = {
    grupo, rueda: null, pila, bulto,
    // el pie del coihue: la rueda alrededor del árbol y el convite a un paso, del lado del refugio
    ponerCoihue(c, haciaX, haciaZ) {
      if (!rueda) { rueda = armarRueda(c, altura); grupo.add(rueda); api.rueda = rueda; }
      ponerEn(rueda, c.x, c.z, 0);
      const dx = haciaX - c.x, dz = haciaZ - c.z, d = Math.hypot(dx, dz) || 1;
      const px = c.x + (dx / d) * 1.7, pz = c.z + (dz / d) * 1.7;
      ponerEn(pila, px, pz, 0.6); ponerEn(bulto, px, pz, 0.3);
      api.puntoConvite = { x: px, z: pz };
    },
    puntoConvite: null,
    ver(estado) {   // { rueda, pila, bulto }: sí o no
      if (rueda) rueda.visible = !!estado.rueda;
      pila.visible = !!estado.pila; bulto.visible = !!estado.bulto;
    },
  };
  return api;
}
