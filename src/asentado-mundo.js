// 4.12.1 · LO QUE SE VE DE EDIFICIOS Y LUZ (Media y Alta): la sombra de contacto al pie de cada edificio y los halos de noche del valle.
// Módulo de render (la parte pura, el oscurecido de esquinas y el desgaste, está en asentado.js). Ninguna luz nueva, ningún shader nuevo:
//   · la sombra de contacto es UNA malla para todo el valle (un dibujo): un anillo suave alrededor del pie de cada edificio, pegado al terreno,
//     con un material básico de color por vértice que RESTA (el centro del anillo oscurece, el borde no resta nada). El material se crea al armar
//     el mundo y entra en la compilación de la carga;
//   · los halos son UNA malla con el mismo material de halos de la aldea y la casa de té (casa-te-luz.js): mismo programa, un dibujo, sólo de
//     noche y sólo si hay alguno cerca.
// Sin textos. No se prueba en Node (no hay GPU): las pruebas miran el código y la parte pura.
import * as THREE from 'three';
import { crearMaterialHalo, geoHalos } from './casa-te-luz.js';

const POS_VACIA = new Float32Array(9);
const BLEND_RESTA = 3;   // el valor de SubtractiveBlending
// 4.12.2 (bugs, W3): el anillo no lleva niebla (fog: false: con la mezcla que resta, el color de la niebla restaría de más), así que de lejos se apaga
// a mano: pleno hasta la mitad del corte y cero en el corte. Los edificios lejanos con neblina ya no quedan con un halo oscuro.
export const FADE_LEJOS = 0.5;
export function fuerzaPorDistancia(d, corte) {
  const a = corte * FADE_LEJOS, t = Math.min(1, Math.max(0, (d - a) / Math.max(1e-6, corte - a)));
  return 1 - t * t * (3 - 2 * t);
}

// ---------------------------------------------------------------- la sombra de contacto
// Un anillo de rectángulo redondeado: el borde de adentro (a `margen` del pie) con la fuerza plena, el de afuera (a `margen + radio`) en cero.
// Devuelve { pos, col, ind } para una huella { x, z, rot, w, d } y la altura del suelo en cada punto.
export function anilloDeContacto(e, altura, hacer = { pasoMax: 1.4, esquina: 5 }) {
  const { x, z, rot = 0, w, d, radio = 1.0, fuerza = 0.3, margen = 0.04 } = e;
  const c = Math.cos(rot), s = Math.sin(rot);
  const rc = Math.min(radio * 0.8, Math.min(w, d) * 0.5 + 0.1);        // el radio de la esquina del borde de adentro
  const hw = w / 2 + margen, hd = d / 2 + margen;
  // el recorrido del perímetro: (punto del borde, normal hacia afuera) en el marco local de la huella, en sentido antihorario visto desde arriba
  const pts = [];
  const arco = (cx, cz, a0, a1) => {
    for (let k = 0; k <= hacer.esquina; k++) { const a = a0 + (a1 - a0) * (k / hacer.esquina); pts.push([cx + rc * Math.cos(a), cz + rc * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  };
  const recta = (x0, z0, x1, z1, nx, nz) => {
    const largo = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(largo / hacer.pasoMax));
    for (let k = 1; k < n; k++) pts.push([x0 + (x1 - x0) * (k / n), z0 + (z1 - z0) * (k / n), nx, nz]);
  };
  arco(hw - rc, hd - rc, 0, Math.PI / 2);
  recta(hw - rc, hd, -hw + rc, hd, 0, 1);
  arco(-hw + rc, hd - rc, Math.PI / 2, Math.PI);
  recta(-hw, hd - rc, -hw, -hd + rc, -1, 0);
  arco(-hw + rc, -hd + rc, Math.PI, Math.PI * 1.5);
  recta(-hw + rc, -hd, hw - rc, -hd, 0, -1);
  arco(hw - rc, -hd + rc, Math.PI * 1.5, Math.PI * 2);
  recta(hw, -hd + rc, hw, hd - rc, 1, 0);
  const pos = [], col = [], ind = [];
  const lej = (lx, lz) => ({ x: x + lx * c + lz * s, z: z - lx * s + lz * c });
  // `y`: el suelo parejo de un lote nivelado (la aldea); sin `y`, el terreno punto por punto
  const suelo = Number.isFinite(e.y) ? () => e.y + 0.04 : (px, pz) => altura(px, pz) + 0.05;
  for (const [lx, lz, nx, nz] of pts) {
    const a = lej(lx, lz), b = lej(lx + nx * radio, lz + nz * radio);
    pos.push(a.x, suelo(a.x, a.z), a.z, b.x, suelo(b.x, b.z), b.z);
    col.push(fuerza * 0.9, fuerza * 0.96, fuerza, 0, 0, 0);
  }
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a0 = i * 2, a1 = i * 2 + 1, b0 = j * 2, b1 = j * 2 + 1;
    ind.push(a0, a1, b1, a0, b1, b0);
  }
  return { pos, col, ind };
}

// `altura(x, z)`: el terreno. `lejos()`: hasta dónde se arma (metros desde la cámara). La malla nace con un triángulo degenerado para que la
// compilación de la carga ya conozca su programa.
export function crearAsiento(escena, { altura, lejos = () => 230 }) {
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, forceSinglePass: true,   // (doble cara y transparente son DOS dibujos si no)
    // SubtractiveBlending (3; el three local no exporta la constante): el destino se multiplica por (1 − color), así el color de vértice es cuánto oscurece. r186 lo
    // pide con premultipliedAlpha (la opacidad es 1: el color sale igual)
    blending: BLEND_RESTA, premultipliedAlpha: true,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
  });
  const geoVacia = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(POS_VACIA.slice(), 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(POS_VACIA.slice(), 3));
    return g;
  };
  const malla = new THREE.Mesh(geoVacia(), mat);
  malla.name = 'sombras-de-contacto'; malla.frustumCulled = false; malla.renderOrder = -1; malla.visible = false;   // 4.12.2 (W3): la primera de las transparentes (antes 1: restaba también sobre lo transparente de orden 0, como el humo y la lluvia)
  escena.add(malla);
  const huellas = new Map();     // clave → { x, z, rot, w, d, radio, fuerza }
  let sucio = false, ultimo = { x: 1e9, z: 1e9 }, reloj = 0, activos = 0, rebuilds = 0;

  function poner(clave, h) {
    if (!clave || !h || !(h.w > 0) || !(h.d > 0)) return false;
    huellas.set(clave, h);
    sucio = true;
    return true;
  }
  function quitar(clave) { if (huellas.delete(clave)) { sucio = true; return true; } return false; }
  function limpiar() { if (huellas.size) { huellas.clear(); sucio = true; } }

  function rehacer(cam) {
    const corte = lejos(), c2 = corte * corte;
    const pos = [], col = [], ind = [];
    activos = 0;
    for (const h of huellas.values()) {
      const d2 = cam ? (h.x - cam.x) * (h.x - cam.x) + (h.z - cam.z) * (h.z - cam.z) : 0;
      if (cam && d2 > c2) continue;
      const f = cam ? fuerzaPorDistancia(Math.sqrt(d2), corte) : 1;   // 4.12.2 (W3)
      if (f < 0.02) continue;
      const a = anilloDeContacto(f < 1 ? { ...h, fuerza: (h.fuerza ?? 0.3) * f } : h, altura), base = pos.length / 3;
      for (const v of a.pos) pos.push(v);
      for (const v of a.col) col.push(v);
      for (const i of a.ind) ind.push(base + i);
      activos++;
    }
    const viejo = malla.geometry;
    if (!pos.length) { malla.geometry = geoVacia(); malla.visible = false; } else {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(ind);
      g.computeBoundingSphere();
      malla.geometry = g;
      malla.visible = true;
    }
    viejo.dispose();
    sucio = false; rebuilds++;
    if (cam) { ultimo.x = cam.x; ultimo.z = cam.z; }
  }

  // cada cuadro (barato): cuánto se nota la sombra según la luz del día, y la malla se rehace si cambió algo o la cámara se fue lejos
  // `dia`: 0 a 1 · `nublado`: 0 a 1 (con cielo cubierto la sombra de contacto es más tenue)
  function actualizar(dt, cam, { dia = 1, nublado = 0, pleno = true } = {}) {
    reloj += dt;
    if (!pleno) { malla.visible = false; return; }
    const movido = Math.hypot(cam.x - ultimo.x, cam.z - ultimo.z) > 28;
    if ((sucio && reloj > 0.35) || (movido && reloj > 1.5)) { reloj = 0; rehacer(cam); }
    mat.color.setScalar(0.28 + 0.72 * dia * (1 - nublado * 0.35));
    if (!activos) malla.visible = false;
  }
  return { malla, mat, poner, quitar, limpiar, actualizar, rehacer, estado: () => ({ huellas: huellas.size, activos, rebuilds, visible: malla.visible }) };
}

// ---------------------------------------------------------------- los halos de noche del valle
// Un cuadrado que mira a la cámara por cada ventana encendida, farol o fogata fuera de la aldea (la aldea tiene los suyos, aldea-noche-luz.js).
// Las listas llegan por fuentes con nombre (`fijar('casas', [...])`); la malla se rehace sólo cuando cambia la unión.
export function crearHalosValle(escena) {
  const { mat, uniforms } = crearMaterialHalo();
  const geoVacia = () => geoHalos([{ pos: [0, -9999, 0], radio: 0.01, fluctua: 0, soloNoche: true }]);
  const malla = new THREE.Mesh(geoVacia(), mat);
  malla.name = 'halos-valle'; malla.renderOrder = 3; malla.visible = false;
  escena.add(malla);
  const fuentes = new Map();
  let firma = '', total = 0, centroides = [];
  function fijar(nombre, lista) {
    const l = (lista || []).filter((h) => h && Array.isArray(h.pos));
    fuentes.set(nombre, l);
    let f = '';
    for (const [k, v] of fuentes) { f += k + ':'; for (const h of v) f += Math.round(h.pos[0] * 10) + ',' + Math.round(h.pos[1] * 10) + ',' + Math.round(h.pos[2] * 10) + ',' + h.radio + ';'; }
    if (f === firma) return false;
    firma = f;
    const todo = [];
    for (const v of fuentes.values()) for (const h of v) todo.push({ pos: h.pos, radio: h.radio, fluctua: h.fluctua ?? 0.1, soloNoche: h.soloNoche !== false });
    total = todo.length;
    centroides = todo.map((h) => h.pos);
    const viejo = malla.geometry;
    malla.geometry = todo.length ? geoHalos(todo) : geoVacia();
    if (todo.length) { malla.geometry.computeBoundingSphere(); malla.geometry.boundingSphere.radius += 4; }
    viejo.dispose();
    return true;
  }
  // `enc`: 0 a 1, qué tan prendido el alumbrado · `pleno`: Media y Alta · cerca: hay algún halo a menos de `alcance` metros
  function actualizar({ enc, pleno, tiempo, cam, alcance = 150 }) {
    let cerca = false;
    if (pleno && enc > 0.02 && total) {
      const a2 = alcance * alcance;
      for (const p of centroides) { const dx = p[0] - cam.x, dz = p[2] - cam.z; if (dx * dx + dz * dz < a2) { cerca = true; break; } }
    }
    malla.visible = cerca;
    uniforms.uEnc.value = enc; uniforms.uBrillo.value = 0; uniforms.uTiempo.value = tiempo;
  }
  return { malla, mat, fijar, actualizar, estado: () => ({ total, visible: malla.visible }) };
}

// ---------------------------------------------------------------- ventanas de las estructuras, desde su vidrio
// Los vidrios de las estructuras son planos finos fusionados en una malla por material. De cada malla que use alguno de `materiales` se
// sacan los centros de las ventanas: los triángulos cuyos centros quedan a menos de `junta` metros se juntan en una ventana.
export function ventanasDeVidrio(raiz, materiales, { junta = 1.1, radioMin = 1.0, radioMax = 1.9 } = {}) {
  const set = new Set(materiales.filter(Boolean));
  const salida = [];
  const v = new THREE.Vector3();
  raiz.traverse((o) => {
    if (!o.isMesh || !set.has(o.material) || !o.geometry?.attributes?.position) return;
    o.updateWorldMatrix(true, false);
    const P = o.geometry.attributes.position, idx = o.geometry.index;
    const nTri = (idx ? idx.count : P.count) / 3;
    const grupos = [];
    for (let t = 0; t < nTri; t++) {
      let cx = 0, cy = 0, cz = 0;
      for (let k = 0; k < 3; k++) { const i = idx ? idx.getX(t * 3 + k) : t * 3 + k; v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); cx += v.x; cy += v.y; cz += v.z; }
      cx /= 3; cy /= 3; cz /= 3;
      let g = grupos.find((q) => Math.hypot(q.x / q.n - cx, q.y / q.n - cy, q.z / q.n - cz) < junta);
      if (!g) { g = { x: 0, y: 0, z: 0, n: 0, xa: cx, xb: cx, ya: cy, yb: cy, za: cz, zb: cz }; grupos.push(g); }
      g.x += cx; g.y += cy; g.z += cz; g.n++;
      g.xa = Math.min(g.xa, cx); g.xb = Math.max(g.xb, cx); g.ya = Math.min(g.ya, cy); g.yb = Math.max(g.yb, cy); g.za = Math.min(g.za, cz); g.zb = Math.max(g.zb, cz);
    }
    for (const g of grupos) {
      const ext = Math.max(g.xb - g.xa, g.yb - g.ya, g.zb - g.za);
      salida.push({ pos: [g.x / g.n, g.y / g.n, g.z / g.n], radio: Math.min(radioMax, Math.max(radioMin, ext * 0.9 + 0.55)), fluctua: 0.04, soloNoche: true });
    }
  });
  return salida;
}
