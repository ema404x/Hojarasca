// 4.3 · El empleo fijo: lo que se ve en el mundo (las reglas, en empleo.js; el enganche con el juego, en empleo-juego.js).
//   · el cartel de turnos de cada local (un poste con una tablilla y un papel), donde se ficha: sólo se dibuja de cerca;
//   · la marca de la tarea que toca: una flechita dorada sobre el lugar y un aro en el piso.
// Todo con MAT_FAUNA (color por vértice, el de la gente y los animales: no compila nada nuevo), una malla por cosa, estática: se mueve
// sólo cuando cambia la tarea. Nada corre por cuadro.
import * as THREE from 'three';
import { MAT_FAUNA } from './vida.js';

const ruido = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _n3 = new THREE.Matrix3();
const _v = new THREE.Vector3(), _nn = new THREE.Vector3();

// Un armador de piezas con color por vértice (el de huevos-mundo.js)
class Pieza {
  constructor() { this.p = []; this.n = []; this.c = []; }
  geo(g, color, pos = [0, 0, 0], rot = [0, 0, 0], pin = 0.1) {
    const gg = g.index ? g.toNonIndexed() : g;
    _q.setFromEuler(_e.set(rot[0], rot[1], rot[2]));
    _m.compose(_p.set(pos[0], pos[1], pos[2]), _q, _s.set(1, 1, 1));
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
  cil(color, r1, r2, h, pos, lados = 6, rot = [0, 0, 0]) { return this.geo(new THREE.CylinderGeometry(r1, r2, h, lados, 1, false), color, pos, rot); }
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

// El cartel de turnos: un poste de madera, una tablilla con el papel clavado y unas rayas de tinta (no hay texto: lo dice el aviso)
function armarCartel() {
  const P = new Pieza();
  P.cil('#5a4128', 0.045, 0.055, 1.25, [0, 0.625, 0], 6);
  P.caja('#6e4f30', 0.66, 0.46, 0.05, [0, 1.12, 0]);
  P.caja('#4a3520', 0.7, 0.04, 0.07, [0, 1.36, 0]);
  P.caja('#4a3520', 0.7, 0.04, 0.07, [0, 0.88, 0]);
  P.caja('#e6d9b8', 0.5, 0.32, 0.012, [0, 1.12, 0.032]);
  for (let i = 0; i < 4; i++) P.caja('#4b3a22', i === 0 ? 0.34 : 0.4 - i * 0.05, 0.022, 0.006, [i === 0 ? -0.05 : -0.02 - i * 0.02, 1.24 - i * 0.075, 0.04]);
  P.caja('#a13a2c', 0.07, 0.07, 0.01, [0.17, 1.24, 0.04]);   // el sello rojo
  return P.malla();
}
// La marca: una flechita dorada que apunta al lugar y un aro bajo, en el piso
function armarMarca() {
  const P = new Pieza();
  P.cil('#e8c46a', 0.0, 0.1, 0.2, [0, 1.55, 0], 4, [Math.PI, 0, 0]);
  P.cil('#e8c46a', 0.018, 0.018, 0.3, [0, 1.75, 0], 4);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    P.caja('#e8c46a', 0.18, 0.02, 0.05, [Math.cos(a) * 0.58, 0.035, Math.sin(a) * 0.58], [0, -a, 0]);
  }
  return P.malla();
}

export function crearEmpleoMundo({ escena }) {
  const grupo = new THREE.Group();
  grupo.name = 'empleo';
  escena.add(grupo);
  const carteles = new Map();
  const marca = armarMarca();
  grupo.add(marca);
  const poner = (m, x, y, z, giro = 0) => { m.position.set(x, y, z); m.rotation.y = giro; m.scale.set(1, 1, 1); m.updateMatrix(); m.updateMatrixWorld(true); };
  return {
    grupo, marca,
    // el cartel del local `id` en (x, y, z), con la cara hacia `giro`
    ponerCartel(id, x, y, z, giro) {
      let c = carteles.get(id);
      if (!c) { c = armarCartel(); carteles.set(id, c); grupo.add(c); }
      poner(c, x, y, z, giro);
    },
    verCartel(id, si) { const c = carteles.get(id); if (c && c.visible !== !!si) c.visible = !!si; },
    carteles: () => [...carteles.keys()],
    // la marca de la tarea
    marcar(x, y, z) { poner(marca, x, y, z, 0); marca.visible = true; },
    quitarMarca() { marca.visible = false; },
    marcaVisible: () => marca.visible,
  };
}
