// 4.12.2: los animales con huesos (caballo, ciervo, huemul y perro). Hasta la 4.12.1 cada uno se animaba por grupos rígidos: una malla para el
// cuerpo, otra para el cuello y la cabeza y una por pata, girando cada una sobre su pivote (seis o siete dibujos por animal). Acá, cerca (menos
// de ~40 m) y sólo en calidad Media y Alta, el mismo animal se dibuja con UNA malla con piel por huesos —la misma técnica de la gente
// (gente-cuerpo.js): `isSkinnedMesh` con un esqueleto mínimo y los huesos en una textura compartida— armada con los mismos vértices, normales y
// colores pintados de las mallas rígidas ya fundidas (nada de forma, tamaño ni pelaje cambia). Así la columna se flexiona, el cuello se curva en
// tres tramos, las patas doblan carpo y garrón, y la cola y las orejas se mueven. De lejos, y en Baja y Mínima, queda la versión rígida de siempre
// (más barata de dibujar de lejos y sin ningún programa de shader nuevo).
//
// Cómo está armado:
//   · `armarPiel(m, esp)` toma al animal ya fundido (`m.g` con sus grupos: cuerpo, cuello, cabeza, patas, cola), junta todas las mallas
//     MAT_FAUNA en una sola, en el espacio de `m.g`, y le da a cada vértice hasta cuatro huesos según el grupo de donde vino, su etiqueta
//     (formas.js: cola, oreja, cuello) y dónde está. Los grupos rígidos siguen ahí (son el respaldo y la fuente de la pose: lo que la IA y el
//     movimiento les ponen a los pivotes no se toca); la malla rígida se esconde cuando la piel se ve, y al revés.
//   · Los huesos no están en la escena: son una cadena de matrices que `Esqueleto.update` arma sólo cuando se dibuja la malla.
//   · `posar` pone los huesos cada cuadro (marchas con mezcla continua entre paso, trote y galope, columna, cuello, cola, orejas, respiración).
// Un esqueleto son 22 huesos (24 lugares) en una página compartida de 64 × 64 texeles (42 animales).
import * as THREE from 'three';
import { ETIQUETA } from './formas.js';

// El material de los animales (MAT_FAUNA, de vida.js) lo trae `fijarMaterialPiel`: vida.js importa este módulo (el huemul), así que éste no
// puede importar vida.js (sería un ciclo). vida.js lo fija al definirlo.
let MAT_FAUNA = null;
export function fijarMaterialPiel(mat) { MAT_FAUNA = mat; }

// ---------------------------------------------------------------- reglas
export const CERCA_PIEL = 40;        // hasta acá se dibuja con piel (y se queda hasta CERCA_PIEL + HISTERESIS)
export const HISTERESIS_PIEL = 6;
export const MEZCLA_CUELLO = 12;     // 4.12.2: el cuello llega a su curva entera 12 m antes del límite (a 28 m)
export const HUESOS_ANIMAL = 24;     // lugares por esqueleto en la textura
export const LADO_PAGINA = 64;
export const CAP_PAGINA = ((LADO_PAGINA * LADO_PAGINA) / 4 / HUESOS_ANIMAL) | 0;

// Los huesos (índices fijos para las tres especies)
export const HUESO = { PELVIS: 0, TORAX: 1, CUELLO1: 2, CUELLO2: 3, CABEZA: 4, OREJA_I: 5, OREJA_D: 6, COLA1: 7, COLA2: 8, COLA3: 9, PATA: 10 };
export const NUM_HUESOS = HUESO.PATA + 12;
export const hueso = (pata, tramo) => HUESO.PATA + pata * 3 + tramo;   // tramo 0 = arriba, 1 = carpo/garrón, 2 = menudillo y casco

const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mezcla = (a, b, t) => a + (b - a) * t;
const suavizado = (dt, k) => 1 - Math.exp(-dt * k);

// ---------------------------------------------------------------- calidad y observador
// Sólo Media y Alta pagan la piel. La calidad que corre la dice la configuración guardada (la automática también la guarda al bajar), que se
// vuelve a mirar cada tanto: si baja a Baja o Mínima en vivo, los animales vuelven solos a la versión rígida. `?piel=0` la apaga (para medir).
let forzada = null;
let calidadVista = null, calidadT = -1e9;
// 4.12.2 (bugs, K4): la calidad con la que corre el mundo, que fija main.js al arrancar y cada vez que la automática la baja. Con ésta fijada ya no se mira
// lo guardado en Ajustes: elegir otra calidad en vivo (que "pide reiniciar") no apaga la piel ni arma una nueva a mitad del juego.
let calidadMundo = null;
export function fijarCalidadPiel(c) { calidadMundo = typeof c === 'string' ? c : null; }
export function fijarPielFauna(v) { forzada = v === null || v === undefined ? null : !!v; calidadT = -1e9; }
export function calidadConPiel(c) { return c === 'media' || c === 'alta'; }
function leerCalidad() {
  try {
    const t = typeof localStorage !== 'undefined' ? localStorage.getItem('hojarasca-ajustes-v1') : null;
    const c = t ? JSON.parse(t).calidad : null;
    return typeof c === 'string' ? c : 'media';
  } catch { return 'media'; }
}
function apagadaPorUrl() {
  try { return typeof location !== 'undefined' && /[?&]piel=0\b/.test(location.search || ''); } catch { return false; }
}
export function pielPermitida() {
  if (forzada !== null) return forzada;
  if (apagadaPorUrl()) return false;
  if (calidadMundo !== null) return calidadConPiel(calidadMundo);
  const t = typeof performance !== 'undefined' ? performance.now() : 0;
  if (calidadVista === null || t - calidadT > 3000 || t < calidadT) { calidadVista = leerCalidad(); calidadT = t; }
  return calidadConPiel(calidadVista);
}
// Dónde está la cámara (la actualizan bichos.js y perro.js cada cuadro): de ahí sale el LOD de cada animal.
const OBS = { x: 1e9, y: 0, z: 1e9, listo: false };
export function observar(pos) { if (pos) { OBS.x = pos.x; OBS.y = pos.y; OBS.z = pos.z; OBS.listo = true; } }
export const observador = () => OBS;

// ---------------------------------------------------------------- huesos en una textura compartida
const paginas = [];
function lugarHuesos() {
  for (const p of paginas) if (p.libres.length) return reservar(p, p.libres.pop());
  for (const p of paginas) if (p.usados < CAP_PAGINA) return reservar(p, p.usados++);
  const matrices = new Float32Array(LADO_PAGINA * LADO_PAGINA * 4);
  const tex = new THREE.DataTexture(matrices, LADO_PAGINA, LADO_PAGINA, THREE.RGBAFormat, 1015 /* FloatType */);
  tex.needsUpdate = true;
  const p = { matrices, tex, usados: 1, libres: [] };
  paginas.push(p);
  return reservar(p, 0);
}
function reservar(p, i) {
  const base = i * HUESOS_ANIMAL;
  for (let b = 0; b < HUESOS_ANIMAL; b++) { const o = (base + b) * 16; p.matrices.fill(0, o, o + 16); p.matrices[o] = p.matrices[o + 5] = p.matrices[o + 10] = p.matrices[o + 15] = 1; }
  return { pagina: p, base, suelto: false };
}
function soltarHuesos(lugar) {
  if (!lugar || lugar.suelto) return;
  lugar.suelto = true;
  lugar.pagina.libres.push(lugar.base / HUESOS_ANIMAL);
}
// (para las pruebas y el diagnóstico)
export function esqueletosEnUso() { return paginas.reduce((s, p) => s + p.usados - p.libres.length, 0); }

// El esqueleto que ve three: `update()` arma las matrices de los huesos (sólo cuando se dibuja la malla) y las escribe en el tramo del animal.
const _l = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _p = new THREE.Vector3(), _s = new THREE.Vector3();
class Esqueleto {
  constructor(huesos, lugar) {
    this.huesos = huesos; this.lugar = lugar;
    this.boneMatrices = lugar.pagina.matrices; this.boneTexture = lugar.pagina.tex; this.base = lugar.base;
    this.rel = Array.from({ length: huesos.n }, () => new THREE.Matrix4());
  }
  computeBoneTexture() { return this; }
  update() {
    const H = this.huesos, rel = this.rel, out = this.boneMatrices, base = this.base;
    for (let i = 0; i < H.n; i++) {
      const rx = H.rot[i * 3], ry = H.rot[i * 3 + 1], rz = H.rot[i * 3 + 2];
      if (rx === 0 && ry === 0 && rz === 0) _q.identity(); else _q.setFromEuler(_e.set(rx, ry, rz));
      _p.set(H.loc[i * 3], H.loc[i * 3 + 1], H.loc[i * 3 + 2]);
      _s.set(H.esc[i * 3], H.esc[i * 3 + 1], H.esc[i * 3 + 2]);
      _l.compose(_p, _q, _s);
      const pa = H.padre[i];
      if (pa < 0) rel[i].copy(_l); else rel[i].multiplyMatrices(rel[pa], _l);
      // matriz del hueso = (su pose respecto de la malla) × (la inversa de su pose de reposo, que es una traslación)
      const e = rel[i].elements, o = (base + i) * 16;
      for (let k = 0; k < 16; k++) out[o + k] = e[k];
      const ax = H.reposo[i * 3], ay = H.reposo[i * 3 + 1], az = H.reposo[i * 3 + 2];
      out[o + 12] = e[12] - (e[0] * ax + e[4] * ay + e[8] * az);
      out[o + 13] = e[13] - (e[1] * ax + e[5] * ay + e[9] * az);
      out[o + 14] = e[14] - (e[2] * ax + e[6] * ay + e[10] * az);
    }
    this.boneTexture.needsUpdate = true;   // (sube una vez por cuadro: la primera vez que se usa)
  }
  dispose() { soltarHuesos(this.lugar); }
}
// Una malla con piel para el three del juego (que no trae SkinnedMesh): lo que el dibujante mira de una malla con huesos.
class MallaConPiel extends THREE.Mesh {
  constructor(geo, mat, esfera) {
    super(geo, mat);
    this.isSkinnedMesh = true;
    this.bindMode = 'attached';
    this.bindMatrix = new THREE.Matrix4(); this.bindMatrixInverse = new THREE.Matrix4();
    this.boundingSphere = esfera;
  }
  computeBoundingSphere() { return this.boundingSphere; }
  applyBoneTransform(i, v) { return v; }
  raycast() {}
}

// ---------------------------------------------------------------- armar la piel
// `esp` (en el espacio de m.g, en reposo):
//   espina { centro:[x,y,z], zc, mitad }   dónde se articulan pelvis y tórax y cuánto dura el cambio de uno a otro
//   cuello { base, cabeza }                el eje del cuello (el hueso del medio queda al 55 %)
//   cabezaG, cuelloG, colaG                los grupos rígidos de la cabeza, del cuello (o null) y de la cola (o null)
//   cuelloEnCabeza                         el cuello vive dentro del grupo de la cabeza (el perro)
//   orejas [[x,y,z],[x,y,z]]               la base de cada oreja (izquierda = x menor)
//   cola [[..],[..],[..]], colaDir         los tres huesos de la cola y hacia dónde apunta
//   patas [{ grupo, rodilla:[dy,dz], menudillo:[dy,dz] }] ×4   (adelante izquierda, adelante derecha, atrás izquierda, atrás derecha)
export function armarPiel(m, esp) {
  const g = m.g;
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  const fuentes = [];
  g.traverse((o) => { if (o.isMesh && o.material === MAT_FAUNA && o.geometry?.attributes?.color) fuentes.push(o); });
  if (!fuentes.length) return null;
  let nv = 0, ni = 0;
  for (const f of fuentes) { nv += f.geometry.attributes.position.count; ni += f.geometry.index ? f.geometry.index.count : f.geometry.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  const si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4);
  const ind = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);

  const H = armarHuesos(esp);
  // el tramo de la textura que le toca: los índices de hueso de los vértices ya van corridos (`base`), como en la gente (el shader lee la textura
  // compartida con el índice tal cual)
  const lugar = lugarHuesos(), baseH = lugar.base;
  const ejeC = new THREE.Vector3(...esp.cuello.cabeza).sub(new THREE.Vector3(...esp.cuello.base));
  const baseC = new THREE.Vector3(...esp.cuello.base);
  const largoC2 = ejeC.lengthSq();
  const colaDir = new THREE.Vector3(...esp.colaDir).normalize(), colaC1 = new THREE.Vector3(...esp.cola[0]);
  const sCola = [-esp.colaRaiz, 0, new THREE.Vector3(...esp.cola[1]).sub(colaC1).dot(colaDir), new THREE.Vector3(...esp.cola[2]).sub(colaC1).dot(colaDir)];
  const hs = new Int32Array(8), ws = new Float32Array(8);
  let nh = 0;
  const sumar = (h, w) => {
    if (w <= 1e-4) return;
    for (let a = 0; a < nh; a++) if (hs[a] === h) { ws[a] += w; return; }
    if (nh < 8) { hs[nh] = h; ws[nh] = w; nh++; }
  };
  // la mezcla a lo largo de una cadena de huesos: `nodos` = [[hueso, s], ...] con s creciente
  const cadena = (s, nodos, w = 1) => {
    if (s <= nodos[0][1]) { sumar(nodos[0][0], w); return; }
    for (let k = 1; k < nodos.length; k++) if (s <= nodos[k][1]) {
      const f = (s - nodos[k - 1][1]) / (nodos[k][1] - nodos[k - 1][1]);
      sumar(nodos[k - 1][0], w * (1 - f)); sumar(nodos[k][0], w * f);
      return;
    }
    sumar(nodos[nodos.length - 1][0], w);
  };
  const nodosCuello = [[HUESO.TORAX, -esp.cuelloTorax], [HUESO.CUELLO1, 0.05], [HUESO.CUELLO2, 0.55], [HUESO.CABEZA, 1.0]];
  const v = new THREE.Vector3(), n = new THREE.Vector3(), _t = new THREE.Vector3(), rel = new THREE.Matrix4(), nm = new THREE.Matrix3();
  let ov = 0, oi = 0;
  for (const f of fuentes) {
    const geo = f.geometry, P = geo.attributes.position, N = geo.attributes.normal, C = geo.attributes.color, E = geo.attributes.etiqueta;
    f.updateWorldMatrix(true, false);
    rel.multiplyMatrices(inv, f.matrixWorld); nm.getNormalMatrix(rel);
    const origen = f.parent;
    const k = esp.patas.findIndex((q) => bajoDe(origen, q.grupo));
    const enCabeza = bajoDe(origen, esp.cabezaG), enCuello = !!esp.cuelloG && bajoDe(origen, esp.cuelloG), enCola = !!esp.colaG && bajoDe(origen, esp.colaG);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(rel);
      n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      const j = ov + i;
      pos[j * 3] = v.x; pos[j * 3 + 1] = v.y; pos[j * 3 + 2] = v.z;
      nor[j * 3] = n.x; nor[j * 3 + 1] = n.y; nor[j * 3 + 2] = n.z;
      col[j * 3] = C.getX(i); col[j * 3 + 1] = C.getY(i); col[j * 3 + 2] = C.getZ(i);
      const tag = E ? E.getX(i) : 0;
      nh = 0;
      if (k >= 0) {
        // una pata: arriba (hasta el carpo o el garrón), el tramo de en medio y el menudillo con el casco; la parte de arriba se funde con la columna
        const q = esp.patas[k], dy = q.pivote[1] - v.y, e = q.pivote[1] / 1.05;   // (e: todo lo de la pata escala con su largo; el caballo es 1)
        const bajo = sv(q.rodilla[0] - 0.07 * e, q.rodilla[0] + 0.07 * e, dy), pie = sv(q.menudillo[0] - 0.06 * e, q.menudillo[0] + 0.06 * e, dy);
        const arriba = sv(-0.28 * e, 0.12 * e, -dy);   // 0 bien abajo, 1 en la ingle
        const espina = k < 2 ? HUESO.TORAX : HUESO.PELVIS;
        sumar(espina, arriba);
        const resto = 1 - arriba;
        sumar(hueso(k, 0), resto * (1 - bajo)); sumar(hueso(k, 1), resto * bajo * (1 - pie)); sumar(hueso(k, 2), resto * bajo * pie);
      } else if (enCabeza && tag === ETIQUETA.oreja) {
        const lado = v.x < (esp.orejas[0][0] + esp.orejas[1][0]) / 2 ? 0 : 1;
        const base = esp.orejas[lado], sube = sv(0.0, 0.07, v.y - base[1]);
        sumar(lado ? HUESO.OREJA_D : HUESO.OREJA_I, sube); sumar(HUESO.CABEZA, 1 - sube);
      } else if (enCabeza) {
        if (esp.cuelloEnCabeza) cadena(_t.copy(v).sub(baseC).dot(ejeC) / largoC2, nodosCuello); else sumar(HUESO.CABEZA, 1);
      } else if (enCuello || tag === ETIQUETA.cuello) {
        cadena(_t.copy(v).sub(baseC).dot(ejeC) / largoC2, nodosCuello);
      } else if (enCola || tag === ETIQUETA.cola) {
        cadena(_t.copy(v).sub(colaC1).dot(colaDir), [[HUESO.PELVIS, sCola[0]], [HUESO.COLA1, sCola[1]], [HUESO.COLA2, sCola[2]], [HUESO.COLA3, sCola[3]]]);
      } else {
        // el cuerpo (el recado, las alforjas...): de la pelvis al tórax según dónde esté a lo largo
        const t = sv(esp.espina.zc - esp.espina.mitad, esp.espina.zc + esp.espina.mitad, v.z);
        sumar(HUESO.TORAX, t); sumar(HUESO.PELVIS, 1 - t);
      }
      // los cuatro más pesados, normalizados
      for (let a = 0; a < nh; a++) for (let b = a + 1; b < nh; b++) if (ws[b] > ws[a]) { const x = ws[a]; ws[a] = ws[b]; ws[b] = x; const y = hs[a]; hs[a] = hs[b]; hs[b] = y; }
      let usados = 0, tot = 0;
      for (let r = 0; r < nh && usados < 4; r++) if (ws[r] > 1e-3) { tot += ws[r]; usados++; }
      tot = tot || 1;
      if (!usados) { hs[0] = HUESO.PELVIS; ws[0] = 1; usados = 1; tot = 1; }
      for (let r = 0; r < 4; r++) { const vale = r < usados; si[j * 4 + r] = (vale ? hs[r] : 0) + baseH; sw[j * 4 + r] = vale ? ws[r] / tot : 0; }
    }
    if (geo.index) for (let i = 0; i < geo.index.count; i++) ind[oi++] = geo.index.getX(i) + ov;
    else for (let i = 0; i < P.count; i++) ind[oi++] = i + ov;
    ov += P.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  geo.setIndex(new THREE.BufferAttribute(ind, 1));
  geo.computeBoundingSphere();
  // (la esfera de la malla cubre al animal en cualquier pose: un poco más grande que la de reposo)
  const esfera = new THREE.Sphere(geo.boundingSphere.center.clone(), geo.boundingSphere.radius * 1.3 + 0.3);
  const malla = new MallaConPiel(geo, MAT_FAUNA, esfera);
  malla.castShadow = true;
  malla.frustumCulled = true;
  malla.visible = false;
  malla.name = 'piel-' + (esp.nombre || 'animal');
  malla.skeleton = new Esqueleto(H, lugar);
  g.add(malla);
  return crearPiel(malla, fuentes, H, esp);
}

// ¿`grupo` es `origen` o uno de sus ancestros? (las orejas del huemul son grupos dentro del de la cabeza)
function bajoDe(origen, grupo) {
  for (let o = origen; o; o = o.parent) if (o === grupo) return true;
  return false;
}

// Los huesos en reposo: posición absoluta, la del padre y lo que falta (el desplazamiento local); rotaciones y escalas en cero.
function armarHuesos(esp) {
  const n = NUM_HUESOS;
  const reposo = new Float32Array(n * 3), loc = new Float32Array(n * 3), rot = new Float32Array(n * 3), esc = new Float32Array(n * 3).fill(1);
  const padre = new Int8Array(n).fill(-1);
  const poner = (i, p, pa) => { reposo.set(p, i * 3); padre[i] = pa; };
  const C = esp.espina.centro;
  const A = esp.cuello.base, B = esp.cuello.cabeza;
  poner(HUESO.PELVIS, C, -1); poner(HUESO.TORAX, C, -1);
  poner(HUESO.CUELLO1, A, HUESO.TORAX);
  poner(HUESO.CUELLO2, [A[0] + (B[0] - A[0]) * 0.55, A[1] + (B[1] - A[1]) * 0.55, A[2] + (B[2] - A[2]) * 0.55], HUESO.CUELLO1);
  poner(HUESO.CABEZA, B, HUESO.CUELLO2);
  poner(HUESO.OREJA_I, esp.orejas[0], HUESO.CABEZA); poner(HUESO.OREJA_D, esp.orejas[1], HUESO.CABEZA);
  poner(HUESO.COLA1, esp.cola[0], HUESO.PELVIS); poner(HUESO.COLA2, esp.cola[1], HUESO.COLA1); poner(HUESO.COLA3, esp.cola[2], HUESO.COLA2);
  esp.patas.forEach((q, k) => {
    const p = q.pivote;
    poner(hueso(k, 0), p, k < 2 ? HUESO.TORAX : HUESO.PELVIS);
    poner(hueso(k, 1), [p[0], p[1] - q.rodilla[0], p[2] + q.rodilla[1]], hueso(k, 0));
    poner(hueso(k, 2), [p[0], p[1] - q.menudillo[0], p[2] + q.menudillo[1]], hueso(k, 1));
  });
  for (let i = 0; i < n; i++) {
    const pa = padre[i];
    for (let c = 0; c < 3; c++) loc[i * 3 + c] = reposo[i * 3 + c] - (pa >= 0 ? reposo[pa * 3 + c] : 0);
  }
  return { n, reposo, loc, rot, esc, padre };
}

// ---------------------------------------------------------------- la piel de un animal
function crearPiel(malla, rigidas, H, esp) {
  const p = {
    malla, rigidas, huesos: H, esp, S: { listo: false, t: Math.random() * 100, amp: 0, gal: 0, post: 0, anda: 0, v: 0, cola: [0, 0], oreja: [0, 0], semilla: Math.random() * 40 },
    activa: false,
    // 4.12.2 (bugs, K1): 0 = el cuello y la cabeza posados como el animal rígido (a 40 m, donde cambia una versión por la otra), 1 = el cuello curvado en tres
    // huesos. Sube con la cercanía (de 40 a 28 m): así el cambio de una versión a otra no mueve la cabeza (antes saltaba hasta 0,85 m)
    mezcla: 1,
    // pone un hueso: rotación (rx, ry, rz) en radianes
    r(i, x, y, z) { const o = i * 3; H.rot[o] = x; H.rot[o + 1] = y; H.rot[o + 2] = z; },
    e(i, x, y, z) { const o = i * 3; H.esc[o] = x; H.esc[o + 1] = y; H.esc[o + 2] = z; },
    posar(dt, m, c) { if (!p.activa || !p.pose) return false; p.pose(p, dt, m, c); return true; },
    // ¿se ve con piel? por la distancia al observador, con histéresis
    lod(g) {
      if (!pielPermitida()) return p.mostrar(false);
      if (!OBS.listo) return p.activa;
      const dx = g.position.x - OBS.x, dz = g.position.z - OBS.z, d2 = dx * dx + dz * dz;
      const lim = p.activa ? CERCA_PIEL + HISTERESIS_PIEL : CERCA_PIEL;
      p.mezcla = 1 - sv(CERCA_PIEL - MEZCLA_CUELLO, CERCA_PIEL, Math.sqrt(d2));
      return p.mostrar(d2 < lim * lim);
    },
    mostrar(si) {
      if (si === p.activa) return si;
      p.activa = si;
      malla.visible = si;
      for (const r of rigidas) r.visible = !si;
      if (si) p.S.listo = false;   // al volver a verse, la pose arranca de donde está ahora
      return si;
    },
    // apagado total (el animal no se ve o no hay piel): vuelve la rígida
    liberar() {
      p.mostrar(false);
      malla.skeleton?.dispose?.();
      malla.skeleton = null;
    },
  };
  return p;
}

// ---------------------------------------------------------------- poses
// Cuánto está en el aire la pata en la fase `ph` (0 apoyada, 1 en lo más alto de la zancada): la parte en que se adelanta (cos < 0), con el borde
// redondeado para que doblar el carpo y el garrón no tenga quiebres.
export function levantada(ph) { const c = Math.max(0, -Math.cos(ph)); return c * c * (3 - 2 * c); }
// Las patas: `a` = ángulo de la cadera (+ = hacia atrás), `lev` = cuánto se levanta (0 a 1, el tramo del aire), `delante` = mano o pata.
function pata(p, k, a, lev, flex) {
  const delante = k < 2;
  const med = (delante ? 1 : -1) * flex * lev;
  p.r(hueso(k, 0), a, 0, 0);
  p.r(hueso(k, 1), med, 0, 0);
  p.r(hueso(k, 2), -0.55 * med - 0.3 * a * lev, 0, 0);
}
// cómo andan juntas las cuatro: fase de cada una para el paso/trote (diagonales) y para el galope (de a pares)
const DIAG = [0, Math.PI, Math.PI, 0];
// La columna, el cuello y la cola que acompañan la marcha. `intens` 0..1 es cuánto camina o corre; `gal` 0..1 cuánto galopa.
function cuerpoEnMarcha(p, fase, intens, gal) {
  const lat = (1 - gal) * intens;
  p.r(HUESO.PELVIS, gal * 0.075 * Math.sin(fase + 1.0), -0.055 * lat * Math.sin(fase + 0.35), 0.02 * lat * Math.sin(fase));
  p.r(HUESO.TORAX, -gal * 0.065 * Math.sin(fase + 1.0), 0.045 * lat * Math.sin(fase + 0.35), -0.02 * lat * Math.sin(fase));
}
// respirar, mover la cola y las orejas: lo que hace un animal parado
function vidaQuieta(p, S, t, dt, o) {
  const resp = Math.sin(t * 2.1 + S.semilla);
  p.e(HUESO.TORAX, 1 + 0.012 * resp, 1 + 0.01 * resp, 1 + 0.006 * resp);
  // la cola: un vaivén lento y, a veces, un espantamoscas
  if (!o.sinCola) {   // (el perro mueve la cola como la mueve su pivote rígido)
    const mosca = Math.max(0, Math.sin(t * 0.55 + S.semilla * 1.7) * Math.sin(t * 1.3 + S.semilla) - 0.55) * 2.2;
    S.cola[0] = mezcla(S.cola[0], o.colaZ + 0.09 * Math.sin(t * 1.6 + S.semilla) + mosca * 0.5 * Math.sin(t * 16), suavizado(dt, 9));
    S.cola[1] = mezcla(S.cola[1], o.colaX, suavizado(dt, 6));
  }
  // las orejas: un tic cada tanto, cada una por su lado, y hacia adelante si algo llama la atención
  for (let i = 0; i < 2; i++) {
    const tic = Math.max(0, Math.sin(t * (0.43 + i * 0.11) + S.semilla * (2 + i)) * Math.sin(t * 1.9 + S.semilla * 3) - 0.7) * 3.3;
    const objetivo = o.orejaAdelante * 0.45 + tic * 0.35 * Math.sin(t * 20 + i * 2.1);
    S.oreja[i] = mezcla(S.oreja[i], objetivo, suavizado(dt, 12));
  }
}
// la cola en tres tramos (cada uno sigue al anterior con un poco de atraso) y las orejas (abren hacia los lados al mirar)
function aplicarColaOrejas(p, S, o) {
  const z = S.cola[0], x = S.cola[1];
  p.r(HUESO.COLA1, x, 0, z * 0.5);
  p.r(HUESO.COLA2, x * 0.55 + o.colaCurva, 0, z * 0.9);
  p.r(HUESO.COLA3, x * 0.35 + o.colaCurva, 0, z * 0.9);
  p.r(HUESO.OREJA_I, S.oreja[0] + o.orejaX, 0, o.orejaAbre);
  p.r(HUESO.OREJA_D, S.oreja[1] + o.orejaX, 0, -o.orejaAbre);
}
// El cuello y la cabeza: el ángulo que ya ponen la IA y el movimiento en los pivotes rígidos (baja, mira) se reparte en tres huesos: se curva en vez de
// girar entero. `curva` > 1 agacha más (pastar).
function cuelloYCabeza(p, ang, giro, extra, curva) {
  const t = ang * curva, k = p.mezcla;
  // 4.12.2 (bugs, K1): lo que hace el animal rígido con el mismo ángulo. El caballo, el huemul y el perro giran el cuello entero sobre su base; el ciervo
  // sólo gira la cabeza sobre su pivote (el cuello queda quieto). A 40 m, donde se cambia de versión, la piel está posada así (k = 0)
  const entero = !!(p.esp.cuelloG || p.esp.cuelloEnCabeza);
  p.r(HUESO.CUELLO1, mezcla(entero ? ang : 0, 0.34 * t + extra.c1, k), mezcla(entero ? giro : 0, 0.2 * giro, k), 0);
  p.r(HUESO.CUELLO2, mezcla(0, 0.36 * t + extra.c2, k), mezcla(0, 0.3 * giro, k), 0);
  p.r(HUESO.CABEZA, mezcla(entero ? 0 : ang, 0.3 * t + extra.c3, k), mezcla(entero ? 0 : giro, 0.5 * giro, k), 0);
}

// ---- el caballo. c = { fase, modo, amplitud, galope, montado }
function posarCaballo(p, dt, m, c) {
  const S = p.S, t = (S.t += dt);
  const objAmp = c.modo === 'quieto' ? 0 : c.amplitud;
  if (!S.listo) { S.amp = objAmp; S.gal = c.galope ? 1 : 0; S.listo = true; }
  S.amp = mezcla(S.amp, objAmp, suavizado(dt, 9));
  S.gal = mezcla(S.gal, c.galope ? 1 : 0, suavizado(dt, 4.5));
  const intens = Math.min(1, S.amp / 0.7);
  for (let k = 0; k < 4; k++) {
    const par = k < 2 ? 0 : Math.PI * 0.6;
    const off = mezcla(DIAG[k], par, S.gal), ph = c.fase + off;
    pata(p, k, S.amp * Math.sin(ph), levantada(ph) * intens, 0.35 + 0.75 * intens);
  }
  cuerpoEnMarcha(p, c.fase, intens, S.gal);
  // el cuello: lo que pide el rígido (pasta, galopa) más el cabeceo del paso
  const cabeceo = 0.05 * intens * (1 - S.gal) * Math.sin(c.fase * 2 + 0.6);
  cuelloYCabeza(p, m.cuello.rotation.x, m.cuello.rotation.y, { c1: cabeceo * 0.5, c2: cabeceo, c3: -cabeceo * 0.8 + 0.04 * S.gal }, 1.35);
  // la cola: al galope se levanta y flamea; al paso, un vaivén suave
  const o = { colaX: 0.12 * intens + 0.32 * S.gal, colaCurva: 0.12 * S.gal * Math.sin(c.fase * 2), colaZ: 0.08 * intens * Math.sin(c.fase), orejaAdelante: c.montado ? 0.5 : 0.1 + intens * 0.5, orejaX: 0, orejaAbre: 0.12 };
  vidaQuieta(p, S, t, dt, o);
  aplicarColaOrejas(p, S, o);
}

// ---- el ciervo y el huemul. c = { fase, amplitud (ya por el paso), posterior, rebote, estado, galope }
function posarCiervo(p, dt, m, c) {
  const S = p.S, t = (S.t += dt);
  if (!S.listo) { S.amp = c.amplitud; S.post = c.posterior; S.gal = c.galope ? 1 : 0; S.listo = true; }
  S.amp = mezcla(S.amp, c.amplitud, suavizado(dt, 9));
  S.post = mezcla(S.post, c.posterior, suavizado(dt, 6));
  S.gal = mezcla(S.gal, c.galope ? 1 : 0, suavizado(dt, 4.5));
  const intens = Math.min(1, S.amp / 0.72);
  for (let k = 0; k < 4; k++) {
    const ph = c.fase + (k % 2 ? Math.PI : 0) + (k > 1 ? S.post : 0);
    pata(p, k, S.amp * Math.sin(ph), levantada(ph) * intens, 0.4 + 0.7 * intens);
  }
  cuerpoEnMarcha(p, c.fase, intens, S.gal);
  const alerta = c.estado === 'alerta' ? 1 : 0;
  const cabeceo = 0.04 * intens * Math.sin(c.fase * 2 + 0.6);
  cuelloYCabeza(p, m.cabeza.rotation.x, m.cabeza.rotation.y, { c1: cabeceo * 0.5 - alerta * 0.12, c2: cabeceo, c3: -cabeceo * 0.8 }, 1.55);
  const o = { colaX: 0.1 * intens, colaCurva: 0, colaZ: 0.1 * Math.sin(t * 2.2), orejaAdelante: alerta, orejaX: -alerta * 0.1, orejaAbre: 0.2 - alerta * 0.12 };
  vidaQuieta(p, S, t, dt, o);
  aplicarColaOrejas(p, S, o);
}

// ---- el perro. c = { paso (la fase), anda, movil (la velocidad), sentado, marcando, contento }
function posarPerro(p, dt, m, c) {
  const S = p.S, t = (S.t += dt);
  if (!S.listo) { S.anda = c.anda ? 1 : 0; S.v = c.vel; S.listo = true; }
  S.anda = mezcla(S.anda, c.anda ? 1 : 0, suavizado(dt, 9));
  S.v = mezcla(S.v, c.vel, suavizado(dt, 6));
  const intens = Math.min(1, S.v / 4), gal = sv(3.5, 7, S.v);
  for (let k = 0; k < 4; k++) {
    // lo que ponen los pivotes rígidos (el andar a los saltos y, si se sienta, la sentada) se cambia por el andar suavizado
    const ph = c.paso * 2 + (k % 2 ? Math.PI : 0) + (k > 1 ? 0.7 : 0);
    const crudo = c.anda ? Math.sin(ph) * 0.7 : 0;
    const a = m.patas[k].rotation.x - crudo + Math.sin(ph) * 0.7 * S.anda;
    pata(p, k, a, levantada(ph) * S.anda * (0.6 + 0.4 * intens), 0.5 + 0.55 * intens);
  }
  cuerpoEnMarcha(p, c.paso * 2, Math.min(1, S.anda * (0.5 + intens)), gal);
  const sentado = c.sentado || 0;
  // el cuello: lo que pide el rígido (olfatear, marcar, mirar); la sentada levanta un poco el pecho
  cuelloYCabeza(p, m.cabeza.rotation.x, m.cabeza.rotation.y, { c1: -0.08 * sentado, c2: 0, c3: 0 }, 1.2);
  vidaQuieta(p, S, t, dt, { sinCola: true, orejaAdelante: c.marcando ? 1 : 0 });
  // la cola sigue lo que le pone el rígido (mueve la cola contento, la baja...), en tres tramos con atraso
  S.cola[0] = mezcla(S.cola[0], m.cola.rotation.z, suavizado(dt, 22));
  S.cola[1] = mezcla(S.cola[1], m.cola.rotation.x, suavizado(dt, 14));
  p.r(HUESO.COLA1, S.cola[1], 0, S.cola[0] * 0.55);
  p.r(HUESO.COLA2, S.cola[1] * 0.5, 0, S.cola[0] * 0.75);
  p.r(HUESO.COLA3, S.cola[1] * 0.3, 0, S.cola[0] * 0.75);
  // las orejas: los tics de siempre, hacia adelante si marca y echadas atrás y abiertas al correr
  p.r(HUESO.OREJA_I, S.oreja[0] - 0.55 * gal, 0, 0.1 + 0.25 * gal);
  p.r(HUESO.OREJA_D, S.oreja[1] - 0.55 * gal, 0, -0.1 - 0.25 * gal);
}

export const POSES = { caballo: posarCaballo, ciervo: posarCiervo, perro: posarPerro };

// ---------------------------------------------------------------- las tres especies
const G = (v) => [v.x, v.y, v.z];
// grupo del cuerpo → posición de pata de un animal con los cuatro pivotes de siempre
function patasDe(m, rodilla, menudillo) {
  return m.patas.map((pv, k) => ({ grupo: pv, pivote: G(pv.position), rodilla: rodilla[k < 2 ? 0 : 1], menudillo: menudillo[k < 2 ? 0 : 1] }));
}
// El caballo: pivotes (±0.2, 1.05, ±0.62); cuello en (0, 1.55, 0.8) y cabeza en (0, 2.19, 1.2).
export function armarPielCaballo(m) {
  if (!pielPermitida()) return null;
  const cab = new THREE.Vector3().addVectors(m.cuello.position, m.cabeza.position);
  const o = G(cab);
  const esp = {
    nombre: 'caballo',
    espina: { centro: [0, 1.3, 0], zc: 0, mitad: 0.55 },
    cuello: { base: G(m.cuello.position), cabeza: o }, cuelloTorax: 0.45,
    cabezaG: m.cabeza, cuelloG: m.cuello, colaG: null, cuelloEnCabeza: false,
    orejas: [[o[0] - 0.06, o[1] + 0.1, o[2] - 0.04], [o[0] + 0.06, o[1] + 0.1, o[2] - 0.04]],
    cola: [[0, 1.5, -0.9], [0, 1.2, -1.02], [0, 0.92, -1.06]], colaDir: [0, -1, -0.12], colaRaiz: 0.14,
    patas: patasDe(m, [[0.52, 0.02], [0.52, -0.1]], [[0.88, 0.01], [0.88, 0.0]]),
  };
  const piel = armarPiel(m, esp);
  if (piel) piel.pose = POSES.caballo;
  return piel;
}
// El ciervo y el huemul (el mismo esqueleto). Ciervo: el cuello es una pieza del cuerpo (etiqueta `cuello`) y la cabeza un grupo. Huemul: el cuello
// va dentro del grupo de la cabeza, con el pivote en el pecho (`cuelloEnCabeza`, `cabezaPos` = dónde queda la cabeza).
export function armarPielCiervo(m, { centroY, cuello, cabezaPos = null, cuelloEnCabeza = false, cola, orejas, cuerpoZ = 0, nombre = 'ciervo' }) {
  if (!pielPermitida()) return null;
  const L = m.patas[0].position.y;   // alto del pivote = largo de la pata
  const esp = {
    nombre,
    espina: { centro: [0, centroY, cuerpoZ], zc: cuerpoZ, mitad: 0.5 },
    cuello: { base: cuello.base, cabeza: cabezaPos || G(m.cabeza.position) }, cuelloTorax: 0.45,
    cabezaG: m.cabeza, cuelloG: null, colaG: null, cuelloEnCabeza,
    orejas, cola: cola.huesos, colaDir: cola.dir, colaRaiz: 0.05,
    patas: patasDe(m, [[0.55 * L, 0.0], [0.5 * L, -0.08 * L]], [[0.84 * L, 0.0], [0.86 * L, -0.02 * L]]),
  };
  const piel = armarPiel(m, esp);
  if (piel) piel.pose = POSES.ciervo;
  return piel;
}
// El perro: el cuello es parte del grupo de la cabeza (pivote en el pecho) y la cola es un grupo propio.
export function armarPielPerro(m) {
  if (!pielPermitida()) return null;
  const cp = m.cola.position, dir = [0, 0.598, -0.8];
  const en = (s) => [cp.x, cp.y + dir[1] * s, cp.z + dir[2] * s];
  const base = G(m.cabeza.position);
  const esp = {
    nombre: 'perro',
    espina: { centro: [0, 0.52, 0], zc: 0, mitad: 0.3 },
    cuello: { base, cabeza: [base[0], base[1] + 0.18, base[2] + 0.12] }, cuelloTorax: 0.55,
    cabezaG: m.cabeza, cuelloG: null, colaG: m.cola, cuelloEnCabeza: true,
    orejas: [[-0.056, 0.77, 0.285], [0.056, 0.77, 0.285]],
    cola: [en(0), en(0.15), en(0.28)], colaDir: dir, colaRaiz: 0.05,
    patas: patasDe(m, [[0.3, 0.01], [0.24, -0.07]], [[0.33, 0.015], [0.33, -0.05]]),
  };
  const piel = armarPiel(m, esp);
  if (piel) piel.pose = POSES.perro;
  return piel;
}

// ---------------------------------------------------------------- compilar los programas con la carga
// Con piel, MAT_FAUNA y la sombra son dos programas más (la variante «con huesos»). `renderer.compile` no arma los de las sombras y un animal
// que aparece a mitad del juego los armaría en ese cuadro: se dibuja un instante, en la carga, una malla mínima con huesos delante de la cámara
// (como la gente: gente.js la llama junto con su `precalentar`). Si la piel no corre en esta calidad, no hace nada.
// 4.12.2 (bugs, W1): el programa de la pasada de sombras sale del material de profundidad COMPARTIDO de three y su clave lleva los contadores de luces
// del momento y el tipo del objeto (rígido, con huesos, instanciado). El primer dibujo de la vida de la escena corre la pasada de sombras con los
// contadores en cero (three cuenta las luces después), así que lo compilado ahí no sirve; y el material compartido sólo pide programa nuevo cuando
// el objeto siguiente cambia de tipo. Por eso: (1) se dibuja DOS veces, y la segunda ya ve los contadores del juego; (2) se dejan en la escena las
// tres figuras que se alternan en el juego —rígida, con huesos e instanciada (la silueta de un árbol: capa 1, con color por instancia)— en ese
// orden, así cada cambio de tipo ocurre con las luces contadas. Todo en la carga: nada de esto se hace en el juego. Sin la piel (Baja y Mínima)
// no hace nada.
export function precalentarPiel(escena, camara, dibujar) {
  if (!pielPermitida() || !escena || !camara) return false;
  const triangulo = () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0.02, 0, 0, 0, 0.02, 0]), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(9).fill(0.5), 3));
    geo.setIndex([0, 1, 2]);
    return geo;
  };
  const geoRigida = triangulo(), geoInstancia = triangulo(), geo = triangulo();
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(12), 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]), 4));
  const lugar = lugarHuesos();
  const dir = new THREE.Vector3(); camara.getWorldDirection(dir);
  const ponerDelante = (o, lado) => { o.position.set(camara.position.x + dir.x * 3 + lado, camara.position.y - 1.2, camara.position.z + dir.z * 3); o.castShadow = true; o.frustumCulled = false; };
  // 1) rígida (los animales lejos, el resto de los casters)
  const rigida = new THREE.Mesh(geoRigida, MAT_FAUNA); ponerDelante(rigida, -0.3);
  // 2) con huesos
  const malla = new MallaConPiel(geo, MAT_FAUNA, new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1)); ponerDelante(malla, 0);
  malla.skeleton = { boneTexture: lugar.pagina.tex, boneMatrices: lugar.pagina.matrices, update() { lugar.pagina.tex.needsUpdate = true; }, computeBoundingSphere() {}, computeBoneTexture() { return this; }, dispose() {} };
  // 3) instanciada con color por instancia, en la capa 1 como las siluetas de los árboles (sólo la ve la pasada de sombras)
  const instancia = new THREE.InstancedMesh(geoInstancia, MAT_FAUNA, 1); ponerDelante(instancia, 0.3);
  instancia.setColorAt(0, new THREE.Color(0.5, 0.5, 0.5));
  instancia.layers.set(1);
  const figuras = [rigida, malla, instancia];
  for (const f of figuras) escena.add(f);
  try { dibujar(); dibujar(); } finally {
    for (const f of figuras) escena.remove(f);
    instancia.dispose();
    geo.dispose(); geoRigida.dispose(); geoInstancia.dispose();
    soltarHuesos(lugar);
  }
  return true;
}
