// Más vida en el bosque: huemules, zorros, cisnes, patos de los torrentes, martines pescadores,
// picaflores, bandurrias y truchas que saltan con poca luz
import * as THREE from 'three';
import { rng, lerp, clamp } from './ruido.js';
import { LAGO, LIMITE } from './config.js';
import { perfilHabitatPatagonico } from './patagonia.js';
import { percepcionMamifero, firmaSonoraJugador, calmaDe, puntoDeCuriosidad, CURIOSIDAD, anotarAcercamiento } from './percepcion.js';
import { publicarAnimal, animalMasCercano, destinoEscapeConCobertura, actividadFaunaPatagonica } from './ecosistema.js';
import { crearSombraContacto, actualizarSombraContacto } from './naturaleza-reactiva.js';
import { actualizarMicroconducta, gestoMicroconducta } from './microconductas.js';
import { crearPoolPosicional, limitarSombrasPorDistancia, consumirPresupuestoIA } from './rendimiento.js';
import { bola, miembro, huso, deformar, pintar, lomo, pata, ruido3, cuerpoZ, perfilHuso, matiz, color as matDe } from './formas.js';

// Los materiales de los animales llevan una luz de borde: el contorno se
// enciende apenas cuando el sol viene de atrás, y así se recortan del fondo.
const bordeLuz = (sh) => {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\n varying vec3 vNormVista; varying vec3 vPosVistaB; varying vec3 vPosObjFauna;')
    .replace('#include <project_vertex>', `#include <project_vertex>
      vNormVista = normalize(normalMatrix * objectNormal);
      vPosVistaB = mvPosition.xyz;
      vPosObjFauna = position;`);
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\n varying vec3 vNormVista; varying vec3 vPosVistaB; varying vec3 vPosObjFauna;')
    .replace('#include <dithering_fragment>', `#include <dithering_fragment>
      {
        // Microvariación muy sutil: rompe superficies plásticas sin introducir texturas externas.
        float pelo = sin(vPosObjFauna.y * 29.0 + vPosObjFauna.z * 17.0) * sin(vPosObjFauna.x * 23.0 - vPosObjFauna.y * 11.0);
        float fibraPelo = sin(vPosObjFauna.y * 61.0 + vPosObjFauna.x * 19.0) * sin(vPosObjFauna.z * 43.0 - vPosObjFauna.y * 7.0);
        gl_FragColor.rgb *= 0.970 + pelo * 0.021 + fibraPelo * 0.012;
      }
      #if NUM_DIR_LIGHTS > 0
      {
        vec3 V = normalize(-vPosVistaB);
        float ndv = clamp(dot(normalize(vNormVista), V), 0.0, 1.0);
        vec3 luzDir = normalize(directionalLights[0].direction);
        float contraluz = clamp(dot(V, -luzDir), 0.0, 1.0);
        #ifdef USE_COLOR
          // 3.4: la gente y los animales (MAT_FAUNA, color por vértice) tienen normales suaves:
          // con la luz de borde de antes se encendía todo el contorno, como un halo de recorte.
          // Ahora es un borde fino, del color de la pieza, que se nota sobre todo a contraluz.
          float borde = pow(1.0 - ndv, 4.0);
          gl_FragColor.rgb += directionalLights[0].color * gl_FragColor.rgb * borde * (0.05 + contraluz * 0.3);
        #else
          float borde = pow(1.0 - ndv, 3.0);
          gl_FragColor.rgb += directionalLights[0].color * borde * (0.12 + contraluz * 0.5);
        #endif
      }
      #endif`);
};

export const lam = (color, extra = {}) => {
  const m = new THREE.MeshLambertMaterial({ color, ...extra });
  m.onBeforeCompile = bordeLuz;
  return m;
};

// Un solo material para toda la fauna: el color va en los vértices
export const MAT_FAUNA = new THREE.MeshLambertMaterial({ vertexColors: true });
MAT_FAUNA.onBeforeCompile = bordeLuz;

// Junta en una sola malla las partes que no se mueven, para dibujar mucho menos
// 3.4: con `opciones` (gente y animales) la malla fundida queda suave y pintada: ver fundirSuave.
export function compactar(raiz, opciones = null) {
  if (opciones) return fundirSuave(raiz, opciones);
  const grupos = [];
  raiz.traverse((o) => { if (o.isGroup || o === raiz) grupos.push(o); });
  const _c = new THREE.Color();
  for (const g of grupos) {
    const mallas = g.children.filter((o) => o.isMesh && o.material.isMeshLambertMaterial && !o.material.transparent && !o.material.vertexColors);
    if (mallas.length < 2) continue;
    const pos = [], nor = [], col = [];
    for (const m of mallas) {
      m.updateMatrix();
      const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      geo.applyMatrix4(m.matrix);
      geo.computeVertexNormals();
      const p = geo.attributes.position, n = geo.attributes.normal;
      _c.copy(m.material.color);
      for (let i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i));
        nor.push(n.getX(i), n.getY(i), n.getZ(i));
        col.push(_c.r, _c.g, _c.b);
      }
      geo.dispose();
      g.remove(m);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    const unida = new THREE.Mesh(geo, MAT_FAUNA);
    unida.castShadow = true;
    g.add(unida);
  }
  return raiz;
}

// 3.4: la fundición de la gente y los animales, al estilo pintado de HushWood. Igual que
// `compactar` junta las piezas de cada grupo en una malla con MAT_FAUNA, pero:
//   · conserva las normales de cada pieza (antes se recalculaban por cara: facetas duras);
//   · queda indexada (cada vértice se procesa una vez, no una por triángulo);
//   · pinta el color de cada vértice: `pieza.userData.pintar(color, p, n)` (p y n en el
//     espacio de la figura) para pelajes y telas, y una sombra pintada que oscurece y
//     enfría lo de abajo (pies, panza, debajo de los brazos) según `opciones.alto`.
// opciones: { alto (m), pie (cuánto queda de color abajo, 0..1), panza (oscuro de lo que
// mira para abajo), todo (fundir también los grupos de una sola pieza) }.
const _mGrupo = new THREE.Matrix4(), _mInv = new THREE.Matrix4(), _nm = new THREE.Matrix3();
const _pv = new THREE.Vector3(), _nv = new THREE.Vector3(), _cv = new THREE.Color();
const _frio = new THREE.Color('#2b3442'), _tibio = new THREE.Color('#fff1d8');
function sombraPintada(c, p, n, op) {
  const t = Math.min(1, Math.max(0, p.y / (op.alto * 0.5)));
  const s = t * t * (3 - 2 * t);
  let f = (op.pie ?? 0.74) + (1 - (op.pie ?? 0.74)) * s;
  f *= 1 - (op.panza ?? 0.14) * Math.max(0, -n.y);
  c.multiplyScalar(f).lerp(_frio, (1 - f) * 0.2);
  // lo que mira al cielo toma un poco de luz tibia, como pincelada
  if (n.y > 0.35) c.lerp(_tibio, (n.y - 0.35) * 0.05);
}
function fundirSuave(raiz, op) {
  raiz.updateMatrixWorld(true);
  _mInv.copy(raiz.matrixWorld).invert();
  const grupos = [];
  raiz.traverse((o) => { if (o.isGroup || o === raiz) grupos.push(o); });
  for (const g of grupos) {
    const mallas = g.children.filter((o) => o.isMesh && o.material && o.material.isMeshLambertMaterial && !o.material.transparent && !o.material.vertexColors && !o.userData.aparte);
    if (mallas.length < (op.todo ? 1 : 2)) continue;
    _mGrupo.multiplyMatrices(_mInv, g.matrixWorld);
    _nm.getNormalMatrix(_mGrupo);
    let nv = 0, ni = 0;
    for (const m of mallas) { const q = m.geometry; nv += q.attributes.position.count; ni += q.index ? q.index.count : q.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
    const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let ov = 0, oi = 0;
    for (const m of mallas) {
      m.updateMatrix();
      const geo = m.geometry.clone();
      geo.applyMatrix4(m.matrix);
      if (!geo.attributes.normal) geo.computeVertexNormals();
      const P = geo.attributes.position, N = geo.attributes.normal, C = geo.attributes.color;
      const pintar = m.userData.pintar;
      for (let i = 0; i < P.count; i++) {
        const k = (ov + i) * 3;
        pos[k] = P.getX(i); pos[k + 1] = P.getY(i); pos[k + 2] = P.getZ(i);
        nor[k] = N.getX(i); nor[k + 1] = N.getY(i); nor[k + 2] = N.getZ(i);
        // (una pieza puede traer sus propios colores por vértice: ver colorear en formas.js)
        if (C) _cv.setRGB(C.getX(i), C.getY(i), C.getZ(i)); else _cv.copy(m.material.color);
        _pv.set(pos[k], pos[k + 1], pos[k + 2]).applyMatrix4(_mGrupo);
        _nv.set(nor[k], nor[k + 1], nor[k + 2]).applyMatrix3(_nm).normalize();
        if (pintar) pintar(_cv, _pv, _nv);
        if (op.alto) sombraPintada(_cv, _pv, _nv, op);
        col[k] = _cv.r; col[k + 1] = _cv.g; col[k + 2] = _cv.b;
      }
      if (geo.index) for (let i = 0; i < geo.index.count; i++) idx[oi++] = geo.index.getX(i) + ov;
      else for (let i = 0; i < P.count; i++) idx[oi++] = i + ov;
      ov += P.count;
      geo.dispose();
      g.remove(m);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    const unida = new THREE.Mesh(geo, MAT_FAUNA);
    unida.castShadow = true;
    g.add(unida);
  }
  return raiz;
}
export const esfera = (mat, esc, pos) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat); m.scale.set(...esc); m.position.set(...pos); return m; };
export const cono = (mat, r, h, pos, rot = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mat); m.position.set(...pos); m.rotation.set(...rot); return m; };
export const palo = (mat, r, h, pos, rot = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, h, 8), mat); m.position.set(...pos); m.rotation.set(...rot); return m; };

export function patas(g, mat, largo, x, z, r) {
  const lista = [];
  for (const [px, pz] of [[-x, z], [x, z], [-x, -z], [x, -z]]) {
    const piv = new THREE.Group(); piv.position.set(px, largo, pz);
    const p = palo(mat, r, largo, [0, -largo / 2, 0]); piv.add(p); g.add(piv); lista.push(piv);
  }
  return lista;
}

// 3.4: el huemul con su anatomía: compacto y robusto (no estilizado como un ciervo europeo),
// patas cortas y fuertes, cuello grueso, cabeza corta con la "Y" oscura de la frente, orejas
// grandes y, el macho, cuernos cortos en horqueta. Pelaje pardo grisáceo pintado en los
// vértices (más oscuro en la cara y las cañas, más claro en la garganta). Mismos pivotes.
function mallaHuemul(macho) {
  const g = new THREE.Group();
  const pelo = '#776957', oscuro = '#3d342b', asta = '#584938';
  const cOsc = new THREE.Color('#2f2822'), claro = new THREE.Color('#b8aa91');
  const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const pelaje = (c, p, n) => {
    c.multiplyScalar(1 + ruido3(p.x * 18, p.y * 16, p.z * 17) * 0.05 + 0.06 * Math.max(0, n.y));
    if (p.z > 0.38 && p.y > 0.95 && p.y < 1.32) c.lerp(claro, 0.5 * sv(-0.1, 0.6, n.z - n.y));   // la garganta
    if (p.y < 0.4) c.lerp(cOsc, 0.6 * (1 - sv(0.15, 0.4, p.y)));                                 // las cañas
    if (p.y < 0.9 && p.y > 0.6) c.lerp(claro, 0.25 * sv(-0.3, -0.8, n.y));                      // la panza
  };
  const conPelaje = (m) => pintar(m, pelaje);
  g.add(conPelaje(lomo(pelo, { y: 0.94, atras: -0.64, adelante: 0.56, ancho: 0.27, alto: 0.3, pecho: 0.12, panza: 0.08 }, 16)));
  g.add(miembro(oscuro, [[0, 1.02, -0.6], [0, 0.98, -0.66], [0, 0.9, -0.68]], [0.04, 0.05, 0.02], 5, 8));         // la cola
  const cabeza = new THREE.Group(); cabeza.position.set(0, 1.4, 0.65);
  const testa = miembro(pelo, [[0, 0.04, -0.08], [0, 0.02, 0.06], [0, -0.03, 0.2], [0, -0.045, 0.3]], [0.1, 0.11, 0.075, 0.05], 8, 12);
  testa.scale.set(0.85, 1, 1);
  // la "Y" oscura: del hocico sube por la frente y se abre hacia los ojos
  cabeza.add(pintar(testa, (c, p, n) => {
    const x = Math.abs(p.x), z = p.z - 0.65;
    const tallo = Math.max(0, 1 - x / 0.03) * sv(0.1, 0.18, z) * Math.max(0, n.y);
    const brazos = Math.max(0, 1 - Math.abs(x - (0.12 - z) * 0.55) / 0.025) * sv(0.13, 0.03, z) * sv(-0.02, 0.06, z) * Math.max(0, n.y + 0.3);
    c.lerp(cOsc, Math.min(1, (tallo + brazos) * 0.9));
    if (z > 0.22) c.lerp(cOsc, 0.6);
  }));
  cabeza.add(bola(oscuro, [0.045, 0.035, 0.04], [0, -0.04, 0.31]));
  const orejas = [];
  for (const l of [-1, 1]) {
    cabeza.add(bola('#11100e', [0.015, 0.016, 0.013], [l * 0.078, 0.04, 0.11]));
    const pivOreja = new THREE.Group(); pivOreja.position.set(l * 0.095, 0.13, -0.03); pivOreja.rotation.z = -l * 0.68; pivOreja.rotation.x = -0.12;
    pivOreja.add(pintar(bola(pelo, [0.034, 0.12, 0.062], [0, 0, 0]), (c, p, n) => { if (n.z > 0.4) c.lerp(claro, 0.35); }));
    cabeza.add(pivOreja); orejas.push(pivOreja);
    if (macho) {
      const base = [l * 0.05, 0.13, 0.03], medio = [l * 0.09, 0.27, 0.0];
      cabeza.add(miembro(asta, [base, medio, [l * 0.11, 0.4, -0.06]], [0.022, 0.016, 0.005], 6, 7));
      cabeza.add(miembro(asta, [medio, [l * 0.1, 0.33, 0.07], [l * 0.1, 0.38, 0.1]], [0.014, 0.01, 0.004], 4, 6));
    }
  }
  // 3.5: el cuello grueso va con la cabeza y el pivote baja a su base, adentro del pecho: al
  // pastar se baja todo el cuello (antes el cuello quedaba fijo y la cabeza se doblaba arriba,
  // con un escalón en la nuca y la boca del tubo a la vista). Mismo lugar en reposo.
  const BASE = new THREE.Vector3(0, 1.0, 0.36), OFF = new THREE.Vector3().subVectors(cabeza.position, BASE);
  for (const c of cabeza.children) c.position.add(OFF);
  cabeza.position.copy(BASE);
  cabeza.add(conPelaje(miembro(pelo, [[0, -0.14, -0.1], [0, -0.02, -0.02], [0, 0.16, 0.1], [0, 0.32, 0.22], [0, 0.42, 0.29]], [0.21, 0.19, 0.155, 0.12, 0.1], 10, 14)));
  g.add(cabeza);
  const ps = [];
  for (const [x, z] of [[-0.14, 0.34], [0.14, 0.34], [-0.14, -0.36], [0.14, -0.36]]) {
    const piv = new THREE.Group(); piv.position.set(x, 0.72, z);
    piv.add(conPelaje(pata(pelo, 0.7, z > 0, 0.075, 9)));
    piv.add(bola(oscuro, [0.04, 0.032, 0.055], [0, -0.69, 0.03]));
    g.add(piv); ps.push(piv);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 1.3, pie: 0.86, todo: true });
  return { g, cabeza, patas: ps, orejas };
}

// 3.4: el zorro colorado (culpeo): cuerpo esbelto rojizo con el lomo canoso, garganta y
// cachetes blancos, hocico fino, orejas en punta con el dorso oscuro, patas finas con medias
// negras y la cola tupida gris con la punta negra (su pivote se mueve igual que antes).
function mallaZorro() {
  const g = new THREE.Group();
  const rojizo = '#a85f35', gris = new THREE.Color('#6d675f'), negro = new THREE.Color('#201b18'), blanco = new THREE.Color('#d8d0c1');
  const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const pelaje = (c, p, n) => {
    c.lerp(gris, 0.55 * sv(0.2, 0.8, n.y) * sv(0.5, 0.6, p.y));                                  // el lomo canoso
    if (p.z > 0.2 && p.y < 0.6) c.lerp(blanco, 0.85 * sv(-0.1, 0.5, n.z - n.y) * sv(0.35, 0.45, p.y));   // la garganta
    if (p.y < 0.2) c.lerp(negro, 0.85 * (1 - sv(0.1, 0.2, p.y)));                                  // las medias
  };
  const conPelaje = (m) => pintar(m, pelaje);
  g.add(conPelaje(lomo(rojizo, { y: 0.5, atras: -0.38, adelante: 0.36, ancho: 0.12, alto: 0.14, pecho: 0.12, panza: 0.2 }, 14)));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.64, 0.43);
  cabeza.add(conPelaje(miembro(rojizo, [[0, -0.16, -0.16], [0, -0.07, -0.07], [0, -0.01, -0.01]], [0.08, 0.068, 0.06], 6, 10)));   // el cuello
  cabeza.add(conPelaje(bola(rojizo, [0.075, 0.068, 0.085], [0, 0.0, 0.0])));
  cabeza.add(pintar(miembro(rojizo, [[0, -0.01, 0.05], [0, -0.025, 0.14], [0, -0.03, 0.22]], [0.05, 0.03, 0.014], 6, 9), (c, p) => { if (p.y < 0.62) c.lerp(blanco, 0.8); }));   // el hocico
  cabeza.add(bola('#201b18', [0.016, 0.014, 0.014], [0, -0.027, 0.232]));
  for (const l of [-1, 1]) cabeza.add(pintar(bola(rojizo, [0.04, 0.035, 0.05], [l * 0.045, -0.03, 0.05]), (c) => c.lerp(blanco, 0.85)));   // los cachetes
  const orejas = [];
  for (const l of [-1, 1]) {
    cabeza.add(bola('#090807', [0.012, 0.013, 0.01], [l * 0.05, 0.026, 0.07]));
    const pivOreja = new THREE.Group(); pivOreja.position.set(l * 0.05, 0.08, -0.02); pivOreja.rotation.z = -l * 0.24;
    pivOreja.add(pintar(deformar(new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.12, 8, 2), matDe(rojizo)), (v) => { v.z *= 0.5; }), (c, p, n) => { if (n.z < 0) c.lerp(negro, 0.8); }));
    cabeza.add(pivOreja); orejas.push(pivOreja);
  }
  g.add(cabeza);
  const cola = new THREE.Group(); cola.position.set(0, 0.52, -0.34); cola.rotation.x = 0.5;
  cola.add(pintar(miembro(rojizo, [[0, 0, 0.02], [0, 0, -0.18], [0, 0, -0.42], [0, 0, -0.64]], [0.05, 0.085, 0.08, 0.035], 10, 10), (c, p) => {
    c.lerp(gris, 0.5);
    if (p.z < -0.72 || p.y < 0.2) c.lerp(negro, 0.9);
  }));
  g.add(cola);
  const ps = [];
  for (const [x, z] of [[-0.075, 0.22], [0.075, 0.22], [-0.075, -0.23], [0.075, -0.23]]) {
    const piv = new THREE.Group(); piv.position.set(x, 0.36, z);
    piv.add(conPelaje(pata(rojizo, 0.36, z > 0, 0.035, 8)));
    piv.add(bola('#201b18', [0.022, 0.016, 0.03], [0, -0.355, 0.015]));
    g.add(piv); ps.push(piv);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 0.65, pie: 0.86, todo: true });
  return { g, cabeza, patas: ps, cola, orejas };
}

// 3.5.2: el cisne de cuello negro como es: cuerpo blanco de bote, con la cola corta en punta y
// las alas plegadas apenas levantadas; el cuello largo en S, negro, que nace del pecho sin
// escalón; la cabeza negra con la raya blanca detrás del ojo, el pico gris azulado y la
// carúncula roja de dos lóbulos en la base. Los pichones grises van montados en el lomo. Antes
// eran una esfera, un cono y un tubo de seis lados. Mismos pivotes (la cabeza).
function mallaCisne(pichones) {
  const g = new THREE.Group();
  const blanco = '#f0efe8', negro = '#141414';
  const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const sombraPluma = new THREE.Color('#c9cdd2');
  const plumaje = (c, p, n) => {
    c.multiplyScalar(1 + ruido3(p.x * 20, p.y * 22, p.z * 19) * 0.025);
    if (n.y < 0.2) c.lerp(sombraPluma, 0.3 * sv(0.2, -0.5, n.y));   // el blanco en sombra, frío
  };
  // el cuerpo: más lleno en el pecho, la panza chata (flota) y la cola que sube en punta
  g.add(pintar(cuerpoZ(blanco, [[0, -0.54], [0.05, -0.5], [0.11, -0.42], [0.17, -0.31], [0.215, -0.16], [0.235, 0.0], [0.232, 0.12], [0.215, 0.24], [0.18, 0.33], [0.12, 0.4], [0.0, 0.44]], [0, 0.1, 0], 18, (v) => {
    v.y *= v.y > 0 ? 0.78 : 0.62;
    if (v.z < -0.28) v.y += (-0.28 - v.z) * 0.55;
    if (v.z > 0.2 && v.y < 0) v.y *= 1 + (v.z - 0.2) * 0.8;   // el pecho
  }), plumaje));
  // las alas plegadas sobre el lomo, con las puntas cruzadas encima de la cola
  for (const l of [-1, 1]) g.add(pintar(bola(blanco, [0.1, 0.06, 0.3], [l * 0.085, 0.16, -0.14], [-0.14, l * 0.06, l * 0.2]), plumaje));
  // el cuello: nace adentro del pecho (blanco) y sube en S hasta la cabeza
  g.add(pintar(huso(negro, [[0, 0.06, 0.28], [0, 0.2, 0.39], [0, 0.4, 0.44], [0, 0.6, 0.42], [0, 0.74, 0.45], [0, 0.82, 0.52]], [0.09, 0.07, 0.05, 0.046, 0.044, 0.04], 18, 10), (c, p) => {
    c.lerp(new THREE.Color(blanco), sv(0.16, 0.1, p.y));
  }));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.82, 0.56);
  cabeza.add(deformar(bola(negro, [0.055, 0.058, 0.085], [0, 0, 0.0]), (v) => { if (v.z > 0.5) v.y *= 0.85; }));
  for (const l of [-1, 1]) {
    cabeza.add(bola('#e9e7df', [0.004, 0.007, 0.034], [l * 0.05, 0.012, -0.022], [0.1, l * 0.12, 0]));   // la raya blanca
    cabeza.add(bola('#2a1a12', [0.008, 0.008, 0.007], [l * 0.045, 0.008, 0.026]));                     // el ojo
  }
  cabeza.add(miembro('#8d99a5', [[0, -0.012, 0.06], [0, -0.018, 0.11], [0, -0.026, 0.16], [0, -0.032, 0.172]], [0.024, 0.018, 0.011, 0.006], 8, 8));   // el pico
  for (const l of [-1, 1]) cabeza.add(bola('#c41d2a', [0.012, 0.014, 0.019], [l * 0.007, 0.01, 0.074]));    // la carúncula
  g.add(cabeza);
  if (pichones) for (const l of [-1, 1]) {
    // los pichones, grises y de plumón, asomando entre las alas
    g.add(bola('#b9b8b2', [0.06, 0.05, 0.08], [l * 0.06, 0.24, -0.1]));
    g.add(bola('#a9a8a2', [0.03, 0.032, 0.036], [l * 0.065, 0.3, -0.03]));
    g.add(miembro('#3c3c3a', [[l * 0.065, 0.296, -0.0], [l * 0.065, 0.292, 0.02]], [0.009, 0.004], 2, 5));
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 0.9, pie: 0.9, panza: 0.08, todo: true });
  return { g, cabeza };
}

export function alas(g, color, largo, ancho, y = 0, z = 0) {
  const lista = [];
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0, y, z);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, ancho * 0.5, l * largo, 0, 0, 0, 0, -ancho * 0.5], 3));
    geo.computeVertexNormals();
    piv.add(new THREE.Mesh(geo, lam(color, { side: THREE.DoubleSide })));
    g.add(piv); lista.push(piv);
  }
  return lista;
}

// 3.5.2: el pato de los torrentes (el macho): cuerpo de nadador de correntada, bajo y largo, con
// el plumaje gris rayado de negro a lo largo y la cola larga y dura, negra; la cabeza blanca con
// la gorra negra, la raya negra que sale del ojo y baja por el cuello, y el pico rojo, angosto.
// Mismos pivotes (la cabeza mira a los costados).
function mallaPato() {
  const g = new THREE.Group();
  const negro = new THREE.Color('#161514'), canela = new THREE.Color('#7a5a44');
  g.add(pintar(cuerpoZ('#6c655c', [[0, -0.2], [0.035, -0.18], [0.06, -0.12], [0.074, -0.04], [0.076, 0.04], [0.068, 0.1], [0.05, 0.15], [0.0, 0.18]], [0, 0.075, 0], 18, (v) => {
    v.y *= v.y > 0 ? 0.85 : 0.7;
  }), (c, p, n) => {
    // las rayas largas del lomo y los flancos (finas, como lanzas)
    const fi = Math.atan2(p.x, p.y - 0.075);
    c.lerp(negro, 0.55 * Math.max(0, Math.sin(fi * 9 + p.z * 6)) ** 3);
    if (n.y < -0.4) c.lerp(canela, 0.45);
  }));
  g.add(deformar(miembro('#1c1b19', [[0, 0.09, -0.15], [0, 0.1, -0.22], [0, 0.11, -0.27]], [0.03, 0.022, 0.006], 6, 8), (v) => { v.x *= 1.3; v.y = 0.1 + (v.y - 0.1) * 0.35; }));   // la cola dura
  // el cuello blanco, con la raya negra por detrás
  g.add(pintar(huso('#efede6', [[0, 0.09, 0.09], [0, 0.13, 0.13], [0, 0.165, 0.15]], [0.04, 0.034, 0.03], 8, 10), (c, p, n) => { if (n.z < -0.3) c.lerp(negro, 0.9); }));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.17, 0.15);
  cabeza.add(pintar(bola('#f0eee8', [0.04, 0.043, 0.054], [0, 0, 0.0]), (c, p, n) => {
    const y = p.y - 0.17, z = p.z - 0.15;
    if (y > 0.02 && n.y > 0.35) c.lerp(negro, 0.92);                                     // la gorra
    if (Math.abs(y + 0.005 + z * 0.35) < 0.007 && Math.abs(n.x) > 0.5 && z < 0.03) c.lerp(negro, 0.9);   // la raya del ojo
  }));
  for (const l of [-1, 1]) cabeza.add(bola('#2a1610', [0.006, 0.006, 0.006], [l * 0.035, 0.006, 0.026]));
  cabeza.add(miembro('#c4302a', [[0, -0.008, 0.045], [0, -0.013, 0.08], [0, -0.02, 0.1], [0, -0.024, 0.104]], [0.015, 0.01, 0.005, 0.003], 7, 7));   // el pico
  g.add(cabeza);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 0.25, pie: 0.92, todo: true });
  return { g, cabeza };
}

// 3.5.2: el martín pescador grande (el macho) en su rama, erguido: el lomo y las alas gris
// azulado con puntitos claros, el pecho y la panza rufos, el collar blanco, la cabeza grande con
// el copete desgreñado, la mancha blanca delante del ojo y el pico largo y pesado de daga. Mismos
// pivotes (la cabeza gira; el cuerpo se tira de cabeza al agua).
function mallaMartin() {
  const g = new THREE.Group();
  const azul = '#5b6f80', rufo = new THREE.Color('#b8582f'), blanco = new THREE.Color('#ece8de');
  const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const plumaje = (c, p, n) => {
    if (n.z > -0.15 && p.y < 0.065) c.lerp(rufo, sv(-0.15, 0.25, n.z));      // el pecho rufo
    if (p.y > 0.055 && p.y < 0.09 && n.z > -0.4) c.lerp(blanco, 0.95);      // el collar
  };
  const cuerpo = pintar(cuerpoZ(azul, perfilHuso(-0.14, 0.12, 0.07, 12, 0.9, 0.7), null, 14), plumaje);
  cuerpo.rotation.x = -0.95; g.add(cuerpo);
  for (const l of [-1, 1]) {
    // las alas plegadas, con los puntitos claros de las cubiertas
    g.add(pintar(bola(azul, [0.026, 0.1, 0.045], [l * 0.056, -0.01, -0.035], [0.55, 0, l * 0.08]), (c, p) => {
      if (Math.sin(p.y * 160) * Math.sin(p.z * 150) > 0.75) c.lerp(blanco, 0.6);
    }));
  }
  g.add(bola(azul, [0.034, 0.1, 0.012], [0, -0.15, -0.085], [-0.35, 0, 0]));   // la cola
  for (const l of [-1, 1]) g.add(bola('#4a4440', [0.01, 0.008, 0.016], [l * 0.02, -0.105, 0.03]));   // las patitas en la rama
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.12, 0.04);
  cabeza.add(pintar(bola(azul, [0.05, 0.054, 0.06], [0, 0, 0]), (c, p, n) => { if (p.y < 0.11 && n.z > 0.1) c.lerp(blanco, 0.9); }));
  // el copete desgreñado, hacia atrás
  cabeza.add(bola(azul, [0.018, 0.016, 0.05], [0, 0.045, -0.035], [0.75, 0, 0]));
  for (const l of [-1, 1]) cabeza.add(bola(azul, [0.012, 0.012, 0.038], [l * 0.018, 0.035, -0.045], [0.55, l * 0.35, 0]));
  for (const l of [-1, 1]) {
    cabeza.add(bola('#100c0a', [0.009, 0.009, 0.008], [l * 0.041, 0.012, 0.028]));
    cabeza.add(bola('#f2efe6', [0.007, 0.006, 0.006], [l * 0.032, 0.014, 0.048]));   // la mancha blanca
  }
  cabeza.add(miembro('#2b2b2b', [[0, -0.006, 0.045], [0, -0.01, 0.1], [0, -0.016, 0.15], [0, -0.019, 0.162]], [0.019, 0.012, 0.004, 0.002], 8, 7));   // el pico
  g.add(cabeza);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { todo: true });
  return { g, cabeza };
}

function mallaPicaflor() {
  const g = new THREE.Group();
  const verde = lam('#3f7a3c');
  g.add(esfera(verde, [0.016, 0.018, 0.038], [0, 0, 0]));
  g.add(esfera(verde, [0.014, 0.014, 0.014], [0, 0.012, 0.03]));
  g.add(esfera(lam('#e0301e', { emissive: '#5a0a05' }), [0.011, 0.006, 0.011], [0, 0.024, 0.03]));
  g.add(cono(lam('#1a1a1a'), 0.003, 0.035, [0, 0.008, 0.06], [Math.PI / 2, 0, 0]));
  const a = alas(g, '#6a7f62', 0.05, 0.02, 0.01, 0);
  return { g, alas: a };
}

// 3.5.2: la bandurria austral: cuerpo de ibis, gris en el lomo con las cubiertas claras, las
// primarias y la panza negras; el cuello y la cabeza ocres, la cara pelada negra con la barbilla
// colgante, el pico largo y curvo hacia abajo y las patas largas rojizas con los dedos. En vuelo,
// alas anchas de punta negra y cubiertas claras, de dos caras y pintadas (antes, triángulos).
// Mismos pivotes: cabeza, patas y alas (que sólo se ven en vuelo).
function alasBandurria(g, y, z) {
  const lista = [];
  const contorno = [[0, 0.11], [0.3, 0.12], [0.62, 0.08], [0.86, 0.02], [1.0, -0.06], [0.9, -0.1], [0.97, -0.13], [0.82, -0.14], [0.88, -0.18], [0.7, -0.18], [0.45, -0.2], [0.2, -0.19], [0, -0.16]];
  const w = 0.5;
  const tinta = (x, zz, arriba) => {
    const c = new THREE.Color('#6a665e');
    if (x > 0.68) c.set('#1e1c1a');                                     // las primarias
    else if (zz < -0.1) c.lerp(new THREE.Color('#2a2826'), 0.75);        // el borde de las secundarias
    else if (arriba && zz > -0.06) c.lerp(new THREE.Color('#cfc7b6'), 0.45);   // las cubiertas claras
    if (!arriba) c.multiplyScalar(0.62);
    return c;
  };
  for (const lado of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0, y, z);
    const pos = [], col = [], idx = [];
    for (const arriba of [true, false]) {
      const base = pos.length / 3;
      pos.push(0, 0, 0); { const c = tinta(0, 0, arriba); col.push(c.r, c.g, c.b); }
      for (const [x, zz] of contorno) {
        pos.push(lado * x * w, (arriba ? 0.003 : -0.003) + Math.sin(x * Math.PI) * 0.02, zz * 0.9);
        const c = tinta(x, zz, arriba); col.push(c.r, c.g, c.b);
      }
      for (let i = 1; i < contorno.length; i++) {
        const haciaArriba = (lado > 0) === arriba;
        if (haciaArriba) idx.push(base, base + i, base + i + 1); else idx.push(base, base + i + 1, base + i);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, MAT_FAUNA); m.castShadow = true;
    piv.add(m); g.add(piv); lista.push(piv);
  }
  return lista;
}
function mallaBandurria() {
  const g = new THREE.Group();
  const gris = '#6e6a62', ocre = '#c99d62';
  const negro = new THREE.Color('#24211e'), claro = new THREE.Color('#d2cab9');
  // las alas plegadas van pintadas sobre el cuerpo (como bultos aparte se leían como dos
  // almohadones): la franja clara de las cubiertas en el costado y las primarias negras atrás
  const plumaje = (c, p, n) => {
    if (n.y < -0.35) c.lerp(negro, 0.8 * Math.min(1, (-n.y - 0.35) * 2));                                   // la panza negra
    const costado = Math.max(0, Math.min(1, (Math.abs(n.x) - 0.25) * 3)) * Math.max(0, Math.min(1, (n.y + 0.2) * 3));
    if (p.z > -0.12 && p.z < 0.08) c.lerp(claro, 0.55 * costado * Math.min(1, (0.08 - p.z) * 12, (p.z + 0.12) * 12));   // las cubiertas
    if (p.z < -0.13 && n.y > -0.3) c.lerp(negro, 0.85 * Math.min(1, (-0.13 - p.z) * 14));                  // las primarias
  };
  const cuerpo = pintar(cuerpoZ(gris, perfilHuso(-0.27, 0.17, 0.092, 14, 0.85, 0.7), null, 16, (v) => { v.y *= 1.08; }), plumaje);
  cuerpo.position.set(0, 0.43, 0); cuerpo.rotation.x = -0.14;
  g.add(cuerpo);
  // las puntas de las alas, negras, cruzadas sobre la cola
  for (const l of [-1, 1]) g.add(bola('#24211e', [0.026, 0.016, 0.1], [l * 0.022, 0.475, -0.25], [-0.2, l * 0.12, 0]));
  g.add(bola('#3a3632', [0.045, 0.018, 0.07], [0, 0.45, -0.28], [-0.2, 0, 0]));   // la cola
  // el cuello ocre, que nace del pecho y sube en curva hasta la cabeza
  g.add(pintar(huso(ocre, [[0, 0.43, 0.08], [0, 0.5, 0.16], [0, 0.57, 0.2], [0, 0.61, 0.215]], [0.07, 0.045, 0.036, 0.034], 10, 10), (c, p, n) => { if (p.y < 0.47) c.lerp(new THREE.Color(gris), 0.5); }));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.6, 0.22);
  cabeza.add(pintar(bola(ocre, [0.042, 0.045, 0.058], [0, 0.0, 0.0]), (c, p, n) => {
    // la cara pelada negra, del ojo a la base del pico
    if (n.z > 0.25 && p.y < 0.615 && Math.abs(p.x) < 0.04) c.lerp(negro, 0.9 * Math.min(1, (n.z - 0.25) * 3));
  }));
  cabeza.add(bola('#2a2622', [0.011, 0.02, 0.012], [0, -0.04, 0.03]));                                   // la barbilla
  for (const l of [-1, 1]) cabeza.add(bola('#5a1a14', [0.007, 0.007, 0.006], [l * 0.036, 0.01, 0.022]));
  cabeza.add(miembro('#1d1c1b', [[0, -0.006, 0.045], [0, -0.016, 0.1], [0, -0.04, 0.16], [0, -0.075, 0.205], [0, -0.11, 0.23]], [0.016, 0.011, 0.008, 0.005, 0.0025], 12, 6));   // el pico curvo
  g.add(cabeza);
  const p = [];
  for (const l of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(l * 0.04, 0.34, 0);
    // la pata: el tarso largo rojizo con el talón, y tres dedos adelante y uno atrás
    piv.add(miembro('#b0503e', [[0, 0.04, 0.0], [0, -0.06, 0.012], [0, -0.16, 0.0], [0, -0.335, 0.01]], [0.013, 0.01, 0.009, 0.008], 8, 6));
    for (const [dx, dz] of [[-0.03, 0.05], [0, 0.06], [0.03, 0.05], [0, -0.035]]) piv.add(miembro('#9e4636', [[0, -0.336, 0.01], [dx, -0.339, 0.01 + dz]], [0.006, 0.004], 2, 4));
    g.add(piv); p.push(piv);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compactar(g, { alto: 0.65, pie: 0.9, todo: true });
  const a = alasBandurria(g, 0.44, -0.02);
  a.forEach((w) => { w.visible = false; });
  return { g, cabeza, patas: p, alas: a };
}

function mallaTrucha() {
  const g = new THREE.Group();
  const cuerpo = esfera(lam('#8f978f'), [0.05, 0.07, 0.22], [0, 0, 0]);
  g.add(cuerpo);
  g.add(esfera(lam('#c7727a'), [0.051, 0.02, 0.18], [0, 0, 0]));
  g.add(cono(lam('#6f766e'), 0.06, 0.1, [0, 0, -0.24], [-Math.PI / 2, 0, 0]));
  compactar(g, { suave: true });
  return g;
}

// ------------------------------------------------------------------ comportamiento de ciervos
// Inclinación corporal según la pendiente real del terreno.
// Devuelve pitch/roll en el sistema local del animal para evitar el efecto de "figura vertical pegada a una ladera".
export function inclinacionTerrenoMamifero(T, pos, rumbo, limite = 0.28) {
  const n = T.normal(pos.x, pos.z);
  const adelante = n.x * Math.sin(rumbo) + n.z * Math.cos(rumbo);
  const lateral = n.x * Math.cos(rumbo) - n.z * Math.sin(rumbo);
  return {
    pitch: clamp(Math.atan2(adelante, Math.max(0.2, n.y)), -limite, limite),
    roll: clamp(-Math.atan2(lateral, Math.max(0.2, n.y)), -limite * 0.8, limite * 0.8),
  };
}

// RC15: locomoción por marchas. En vez de escalar una única senoide,
// cada rango de velocidad tiene cadencia, amplitud y rebote propios.
export function marchaMamifero(vel, estado, paseo = 1, carrera = 4) {
  const v = Math.max(0, vel);
  if (v < 0.08) return { modo: 'quieto', cadencia: 1.2, amplitud: 0, rebote: 0, posterior: 0.35 };
  if (estado === 'huir' || v > carrera * 0.72) {
    return { modo: 'galope', cadencia: 8.5 + v * 1.15, amplitud: 0.72, rebote: 0.055, posterior: 0.18 };
  }
  if (v > paseo * 1.35) {
    return { modo: 'trote', cadencia: 6.0 + v * 1.4, amplitud: 0.60, rebote: 0.032, posterior: 0.42 };
  }
  return { modo: 'paso', cadencia: 3.0 + v * 2.8, amplitud: 0.46, rebote: 0.016, posterior: Math.PI / 2 };
}

export function actualizarCiervo(a, dt, js, prm, T, col, ambiente = {}) {
  const dx = a.pos.x - js.pos.x, dz = a.pos.z - js.pos.z;
  const d = Math.hypot(dx, dz);
  const vj = js.velocidadActual;
  const dtIA = consumirPresupuestoIA(a, dt, d, a.estado === 'huir' || a.estado === 'alerta' || d < prm.huida * 1.4);
  let sensor = a.__sensorIA;
  let actividad = a.__actividadIA ?? 1;
  if (dtIA > 0 || !sensor) {
    sensor = percepcionMamifero(T, a.pos, js, ambiente, prm.alerta, prm.alerta * 0.88);
    actividad = prm.especie ? actividadFaunaPatagonica(prm.especie, ambiente.horas ?? 12, ambiente) : 1;
    a.__sensorIA = sensor; a.__actividadIA = actividad;
  }
  const alerta = Math.max(js.agachado ? prm.alerta * 0.45 : js.corriendo ? prm.alerta * 1.8 : prm.alerta, sensor.radioVisual * 0.9, sensor.radioOido * 0.78);
  const huida = Math.max(js.agachado ? prm.huida * 0.4 : js.corriendo ? prm.huida * 2.4 : prm.huida, prm.huida * (0.7 + sensor.firma * 0.42));
  if (a.estado !== 'huir') {
    if ((d < huida && (vj > 0.6 || d < prm.huida * 0.3)) || sensor.riesgo > 0.76) {
      a.estado = 'huir'; a.t = 5; a.escapeT = 0;
    }
    else if ((d < alerta && vj > 0.4) || sensor.riesgo > 0.28) { if (a.estado !== 'alerta') { a.estado = 'alerta'; a.t = 2.5 + sensor.riesgo * 1.5; } }
  }
  a.percepcion = sensor;
  if (prm.especie && a.estado !== 'huir' && a.estado !== 'alerta' && sensor.riesgo < 0.18 && actividad < 0.31) {
    if (a.estado !== 'descansar') { a.estado = 'descansar'; a.t = 3 + (1 - actividad) * 5; }
  } else if (a.estado === 'descansar' && actividad > 0.42) { a.estado = 'pastar'; a.t = 2.5; }
  a.t -= dt;
  let vel = 0, rumbo = null;
  if (a.estado === 'descansar') {
    vel = 0;
    if (a.t <= 0 && actividad > 0.28) { a.estado = 'pastar'; a.t = 3 + Math.random() * 4; }
  } else if (a.estado === 'pastar') {
    if (a.t <= 0) {
      a.estado = 'caminar'; a.t = 5 + Math.random() * 6;
      // Con el jugador quieto, las especies curiosas a veces se acercan a mirar en vez
      // de dar su vuelta. Sólo las que tienen curiosidad anotada: el ciervo colorado y
      // el jabalí, que también pasan por acá, no se acercan nunca.
      const curioso = prm.especie ? puntoDeCuriosidad(a.pos, js.pos, calmaDe(js), CURIOSIDAD[prm.especie]) : null;
      if (curioso) { a.obj = curioso; a.t = 14 + Math.random() * 6; if (!a.acercandose) anotarAcercamiento(prm.especie); a.acercandose = true; }
      else { const ang = Math.random() * 6.28, r = Math.random() * prm.radio; a.obj = { x: a.casa.x + Math.cos(ang) * r, z: a.casa.z + Math.sin(ang) * r }; a.acercandose = false; }
    }
  } else if (a.estado === 'caminar') {
    vel = prm.paseo; rumbo = Math.atan2(a.obj.x - a.pos.x, a.obj.z - a.pos.z);
    if (a.t <= 0 || Math.hypot(a.obj.x - a.pos.x, a.obj.z - a.pos.z) < 1.2) { a.estado = 'pastar'; a.t = 4 + Math.random() * 8; }
  } else if (a.estado === 'alerta') {
    rumbo = Math.atan2(-dx, -dz);
    if (a.t <= 0) { a.estado = 'pastar'; a.t = 3; }
  } else {
    vel = prm.carrera;
    if (prm.coberturaEscape) {
      a.escapeT = (a.escapeT || 0) - dt;
      if (!a.escapeDestino || a.escapeT <= 0 || Math.hypot(a.escapeDestino.x - a.pos.x, a.escapeDestino.z - a.pos.z) < 2.5) {
        a.escapeDestino = destinoEscapeConCobertura(T, a.pos, js.pos, { radio: 19, muestras: 9, preferirCobertura: prm.coberturaEscape, evitarEstepa: 0.5, objetivoCobertura: 0.68, preferirBorde: 0.45 });
        a.escapeT = 1.6;
      }
      rumbo = a.escapeDestino ? Math.atan2(a.escapeDestino.x - a.pos.x, a.escapeDestino.z - a.pos.z) : Math.atan2(dx, dz);
    } else rumbo = Math.atan2(dx, dz);
    if (a.t <= 0) { a.estado = 'pastar'; a.t = 6; a.escapeDestino = null; }
  }
  if (rumbo !== null) { const del = Math.atan2(Math.sin(rumbo - a.rumbo), Math.cos(rumbo - a.rumbo)); a.rumbo += del * Math.min(1, dt * (a.estado === 'huir' ? 7 : 2)); }
  a.vel = lerp(a.vel, vel, 1 - Math.exp(-4 * dt));
  if (a.vel > 0.01) {
    const nx = a.pos.x + Math.sin(a.rumbo) * a.vel * dt, nz = a.pos.z + Math.cos(a.rumbo) * a.vel * dt;
    if (T.agua(nx, nz) || Math.abs(nx) > LIMITE || Math.abs(nz) > LIMITE) a.rumbo += 2.2;
    else { a.pos.x = nx; a.pos.z = nz; col.resolver(a.pos, prm.r); }
  }
  a.pos.y = T.altura(a.pos.x, a.pos.z);
  a.g.rotation.y = a.rumbo;
  const marcha = marchaMamifero(a.vel, a.estado, prm.paseo, prm.carrera);
  a.marcha = marcha.modo;
  a.fase += dt * marcha.cadencia;
  const paso = Math.min(1, a.vel * 0.9);
  a.patas.forEach((p, i) => {
    const posterior = i > 1 ? marcha.posterior : 0;
    p.rotation.x = Math.sin(a.fase + (i % 2 ? Math.PI : 0) + posterior) * marcha.amplitud * paso;
  });
  // El centro de masa acompaña cada marcha con una amplitud específica.
  if (a.estado !== 'huir') a.pos.y += Math.abs(Math.sin(a.fase * 0.5)) * marcha.rebote * paso;
  const suelo = inclinacionTerrenoMamifero(T, a.pos, a.rumbo, 0.30);
  const kSuelo = 1 - Math.exp(-dt * 7);
  a.g.rotation.x = lerp(a.g.rotation.x, suelo.pitch, kSuelo);
  a.g.rotation.z = lerp(a.g.rotation.z, suelo.roll + Math.sin(a.fase * 0.5) * 0.012 * paso, kSuelo);
  const microModo = actualizarMicroconducta(a, prm.especie || 'huemul', dt, { riesgo: sensor.riesgo, actividad, velocidad: a.vel, estado: a.estado, lluvia: ambiente.lluvia || 0 });
  const microGesto = gestoMicroconducta(prm.especie || 'huemul', microModo, a.microFase);
  const bajar = a.estado === 'pastar' ? prm.bajar : a.estado === 'descansar' ? Math.min(0.28, prm.bajar * 0.3) : a.estado === 'alerta' ? -0.2 : 0;
  const microPermitida = a.estado === 'pastar' || a.estado === 'descansar' ? 1 : a.estado === 'alerta' ? 0.35 : 0;
  a.cabeza.rotation.x = lerp(a.cabeza.rotation.x, bajar + microGesto.cabezaX * microPermitida, 1 - Math.exp(-3 * dt));
  const escucha = a.estado === 'alerta' ? Math.sin(a.fase * 0.42) * 0.32 : microGesto.cabezaY * microPermitida;
  a.cabeza.rotation.y = lerp(a.cabeza.rotation.y, escucha, 1 - Math.exp(-4 * dt));
  if (a.orejas) a.orejas.forEach((o, i) => { o.rotation.y = lerp(o.rotation.y, microGesto.orejaY * (i ? -1 : 1) * microPermitida, 1 - Math.exp(-dt * 7)); });
  if (a.estado === 'huir') a.pos.y += Math.abs(Math.sin(a.fase)) * prm.salto;
  return d;
}

export function crearVida(T, veg, col, escena, sonido, registrar, progreso) {
  const r = rng(9090);
  const tmp = new THREE.Vector3(), adelante = new THREE.Vector3();
  const picaAntes = new THREE.Vector3(), movPica = new THREE.Vector3();
  let cam = null, zoom = false;
  const mirando = (pos, cerca, lejos) => {
    tmp.subVectors(pos, cam.position);
    const d = tmp.length();
    const max = zoom ? lejos : cerca;
    if (d > max) return false;
    const umbral = zoom ? 0.985 : d < 4 ? 0.8 : 0.94;
    return tmp.divideScalar(d || 1).dot(adelante) > umbral;
  };
  const anotar = (id, pos, cerca, lejos) => { if (!progreso.entradas[id] && mirando(pos, cerca, lejos)) registrar(id); };
  const poolSujetos = crearPoolPosicional(() => new THREE.Vector3(), 32);
  const sujetos = poolSujetos.lista();

  // ---------------------------------------------------------------- huemules
  const huemules = [];
  const zonasHuemul = [];
  for (let i = 0; i < 600 && zonasHuemul.length < 4; i++) {
    const x = (r() * 2 - 1) * 440, z = (r() * 2 - 1) * 440;
    const perfil = perfilHabitatPatagonico(T, x, z);
    const h = perfil.h, k = perfil.k;
    // Huemul: bordes de bosque, laderas y claros montanos; evita bosque cerrado y estepa abierta.
    if (h < 32 || T.agua(x, z) || perfil.pendiente > 0.82 || perfil.bosque > 0.78 || perfil.estepa > 0.55) continue;
    if (perfil.alto < 0.12 && perfil.ecotono < 0.38) continue;
    if (zonasHuemul.some((c) => Math.hypot(c.x - x, c.z - z) < 110)) continue;
    zonasHuemul.push({ x, z });
  }
  zonasHuemul.forEach((casa, i) => {
    const m = mallaHuemul(i % 2 === 0);
    m.g.scale.setScalar(1.15);
    m.g.position.set(casa.x, T.altura(casa.x, casa.z), casa.z);
    escena.add(m.g);
    const sombra = crearSombraContacto(escena, 0.42, 0.78, 0.15);
    huemules.push({ ...m, sombra, casa, pos: m.g.position, rumbo: r() * 6, estado: 'pastar', t: 3, vel: 0, fase: 0 });
  });
  const PRM_HUEMUL = { especie: 'huemul', alerta: 40, huida: 18, radio: 50, paseo: 0.8, carrera: 6.5, zancada: 6, bajar: 0.9, salto: 0.25, r: 0.4, coberturaEscape: 0.82 };

  // ---------------------------------------------------------------- zorros
  const zorros = [];
  for (let i = 0; i < 3; i++) {
    const m = mallaZorro();
    escena.add(m.g);
    const idx = Math.floor(r() * T.sendero.length);
    const p = T.sendero[idx];
    m.g.position.set(p.x, T.altura(p.x, p.z), p.z);
    const sombra = crearSombraContacto(escena, 0.24, 0.48, 0.13);
    zorros.push({ ...m, sombra, pos: m.g.position, idx, sentido: r() < 0.5 ? 1 : -1, estado: 'andar', t: 0, rumbo: 0, vel: 0, fase: 0 });
  }

  // ---------------------------------------------------------------- cisnes
  const dentroLago = (x, z) => T.altura(x, z) < -1.4 && Math.hypot(x - LAGO.x, z - LAGO.z) < 200;
  const puntoLago = () => {
    for (let i = 0; i < 50; i++) {
      const a = r() * 6.28, d = r() * 90;
      const x = LAGO.x + Math.cos(a) * d, z = LAGO.z + Math.sin(a) * d;
      if (dentroLago(x, z)) return { x, z };
    }
    return { x: LAGO.x, z: LAGO.z };
  };
  const cisnes = [];
  for (let par = 0; par < 3; par++) {
    const ini = puntoLago();
    for (let i = 0; i < 2; i++) {
      const m = mallaCisne(par === 0 && i === 1);
      m.g.position.set(ini.x + i * 1.5, 0, ini.z + i);
      escena.add(m.g);
      cisnes.push({ ...m, pos: m.g.position, lider: i === 0 ? null : cisnes[cisnes.length - 1], obj: puntoLago(), rumbo: r() * 6, fase: r() * 6 });
    }
  }
  let proxCisne = 40;

  // ---------------------------------------------------------------- patos de los torrentes
  const patos = [];
  const rio = T.rio;
  for (let i = 12; i < rio.length - 5 && patos.length < 4; i += 3) {
    const caida = rio[i - 10].s - rio[i].s;
    if (caida < 2.2 || rio[i].s < 3) continue;
    if (patos.some((p) => Math.hypot(p.base.x - rio[i].x, p.base.z - rio[i].z) < 45)) continue;
    const a = rio[i - 1], b = rio[i + 1];
    const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
    const lado = r() < 0.5 ? -1 : 1;
    const base = { x: rio[i].x - (tz / l) * lado * rio[i].w * 0.45, z: rio[i].z + (tx / l) * lado * rio[i].w * 0.45, y: rio[i].s + 0.05 };
    const roca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), lam('#6f6c66'));
    roca.scale.set(1.2, 0.5, 1); roca.position.set(base.x, base.y - 0.08, base.z);
    escena.add(roca);
    const m = mallaPato();
    m.g.position.set(base.x, base.y + 0.18, base.z);
    m.g.rotation.y = Math.atan2(-tx, -tz);
    escena.add(m.g);
    patos.push({ ...m, base, i, t: 8 + r() * 10, buceo: 0, destino: null });
  }

  // ---------------------------------------------------------------- martines pescadores
  const martines = [];
  for (let i = 20; i < rio.length - 3 && martines.length < 4; i += 4) {
    const p = rio[i];
    if (p.s > 14 || p.s < 0.5) continue;
    if (martines.some((m) => Math.hypot(m.base.x - p.x, m.base.z - p.z) < 60)) continue;
    const a = rio[i - 1], b = rio[i + 1];
    const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
    const nx = -tz / l, nz = tx / l;
    const base = { x: p.x + nx * (p.w + 0.6), z: p.z + nz * (p.w + 0.6), y: p.s + 2.4 };
    const rama = palo(lam('#4d3b2c'), 0.03, 2.2, [base.x - nx * 0.7, base.y - 0.05, base.z - nz * 0.7], [0, 0, 0]);
    rama.rotation.set(Math.PI / 2, Math.atan2(nx, nz), 0, 'YXZ');
    const poste = palo(lam('#4d3b2c'), 0.05, base.y - T.altura(base.x + nx * 0.4, base.z + nz * 0.4) + 0.1, [base.x + nx * 0.4, (base.y + T.altura(base.x + nx * 0.4, base.z + nz * 0.4)) / 2, base.z + nz * 0.4]);
    escena.add(rama, poste);
    const m = mallaMartin();
    m.g.position.set(base.x, base.y + 0.1, base.z);
    m.g.rotation.y = Math.atan2(-nx, -nz);
    escena.add(m.g);
    martines.push({ ...m, base, agua: { x: p.x, y: p.s, z: p.z }, t: 15 + r() * 20, vuelo: -1 });
  }

  // ---------------------------------------------------------------- picaflor
  const chilcos = veg.plantas.filter((p) => !p.sacado && (p.tipo === 'chilco' || p.tipo === 'notro'));
  const pica = { ...mallaPicaflor(), chilco: null, obj: new THREE.Vector3(), t: 0, curioso: 0, zumbido: 0 };
  pica.g.visible = false && !sale(pica);
  escena.add(pica.g);
  let buscaChilco = 0;

  // ---------------------------------------------------------------- bandurrias
  const pastizales = [];
  for (let i = 0; i < 3000 && pastizales.length < 6; i++) {
    const x = (r() * 2 - 1) * 440, z = (r() * 2 - 1) * 440;
    const k = T.indice(x, z);
    if (T.pasto[k] < 0.75 || T.bosque[k] > 0.08 || T.agua(x, z) || T.distSendero[k] < 6) continue;
    if (pastizales.some((c) => Math.hypot(c.x - x, c.z - z) < 90)) continue;
    pastizales.push({ x, z });
  }
  if (T.lugares.mallin) pastizales.unshift({ x: T.lugares.mallin.x, z: T.lugares.mallin.z });
  const bandada = { aves: [], zona: 0, vuelo: null, t: 30 };
  for (let i = 0; i < 6; i++) {
    const m = mallaBandurria();
    const z0 = pastizales[0] || { x: 0, z: 0 };
    const x = z0.x + (r() - 0.5) * 16, zz = z0.z + (r() - 0.5) * 16;
    m.g.position.set(x, T.altura(x, zz), zz);
    escena.add(m.g);
    bandada.aves.push({ ...m, pos: m.g.position, rumbo: r() * 6, t: r() * 3, obj: null, fase: r() * 6, off: new THREE.Vector3((r() - 0.5) * 8, r() * 3, (r() - 0.5) * 8) });
  }

  // ---------------------------------------------------------------- truchas que saltan
  const saltos = [];
  for (let i = 0; i < 3; i++) {
    const pez = mallaTrucha(); pez.visible = false; escena.add(pez);
    const anillo = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 32), new THREE.MeshBasicMaterial({ color: 0xdfe8ea, transparent: true, opacity: 0, depthWrite: false }));
    anillo.rotation.x = -Math.PI / 2; escena.add(anillo);
    saltos.push({ pez, anillo, t: -1, pos: new THREE.Vector3() });
  }
  let proxSalto = 6;

  // ================================================================== actualización
  function actualizar(dt, jugador, camara, m) {
    // con lluvia fuerte o tormenta los animales se guardan y casi no se ven
    const malTiempo = (m.lluvia || 0) > 0.5 || m.tormenta;
    const escondidos = malTiempo ? (m.tormenta ? 0.85 : 0.6) : 0;
    // a cada animal le toca un número fijo; si cae bajo el umbral, hoy no sale
    const sale = (o) => { if (o.suerte === undefined) o.suerte = Math.random(); return o.suerte >= escondidos; };
    cam = camara; zoom = jugador.estado.zoom;
    camara.getWorldDirection(adelante);
    const js = jugador.estado;
    const h = m.horas;
    const penumbra = (h > 5.5 && h < 9.5) || (h > 18.5 && h < 22);
    poolSujetos.reiniciar();

    // huemules: máxima actividad crepuscular; fuera de ese pico pueden descansar en cobertura.
    const actividadHuemul = actividadFaunaPatagonica('huemul', h, m);
    for (let hi = 0; hi < huemules.length; hi++) {
      const a = huemules[hi];
      const dHuemul = Math.hypot(a.pos.x - js.pos.x, a.pos.z - js.pos.z);
      const cerca = dHuemul < 220;
      a.g.visible = (actividadHuemul > 0.27 && cerca) && sale(a);
      limitarSombrasPorDistancia(a.g, dHuemul, 58);
      if (!a.g.visible) { if (a.sombra) a.sombra.visible = false; continue; }
      actualizarCiervo(a, dt, js, PRM_HUEMUL, T, col, m);
      actualizarSombraContacto(a.sombra, T, a.pos, a.g.visible, a.estado === 'huir' ? 0.78 : 1);
      tmp.set(a.pos.x, a.pos.y + 1, a.pos.z);
      if (a.estado !== 'huir') anotar('huemul', tmp, 35, 120);
      publicarAnimal('huemul', `huemul-${hi}`, a.pos, { estado: a.estado, vel: a.vel });
      poolSujetos.agregar('huemul', tmp, 0, `huemul-${hi}`, a.vel);
    }

    // zorros: del atardecer al amanecer, recorren el sendero
    const actividadZorro = actividadFaunaPatagonica('zorro', h, m);
    const deNoche = actividadZorro > 0.30;
    for (let zi = 0; zi < zorros.length; zi++) {
      const z = zorros[zi];
      const d = Math.hypot(z.pos.x - js.pos.x, z.pos.z - js.pos.z);
      z.g.visible = (deNoche && d < 180) && sale(z);
      limitarSombrasPorDistancia(z.g, d, 50);
      if (!z.g.visible && z.sombra) z.sombra.visible = false;
      if (!deNoche) continue;
      z.t -= dt;
      const dtIAZ = consumirPresupuestoIA(z, dt, d, z.estado === 'irse' || z.estado === 'cazar' || d < 34);
      let sensorZ = z.__sensorIA;
      let liebre = z.__presaIA || null;
      if (dtIAZ > 0 || !sensorZ) {
        sensorZ = percepcionMamifero(T, z.pos, js, m, 18, 28);
        liebre = animalMasCercano('liebre', z.pos, 26);
        z.__sensorIA = sensorZ; z.__presaIA = liebre;
      }
      z.percepcion = sensorZ;
      if (z.estado !== 'irse' && sensorZ.riesgo < 0.22 && liebre && liebre.d < 22 && deNoche) {
        z.estado = 'cazar'; z.t = Math.min(z.t > 0 ? z.t : 4.5, 4.5);
      }
      let vel = 0, rumbo = null;
      if (z.estado === 'andar') {
        const obj = T.sendero[z.idx];
        rumbo = Math.atan2(obj.x - z.pos.x, obj.z - z.pos.z);
        vel = 1.1;
        if (Math.hypot(obj.x - z.pos.x, obj.z - z.pos.z) < 1.5) z.idx = (z.idx + z.sentido * 2 + T.sendero.length) % T.sendero.length;
        if ((d < 16 && d > 5) || sensorZ.riesgo > 0.26) { z.estado = 'mirar'; z.t = 2.5 + r() * 3.5; }
        if (d < 5 || (d < 25 && js.corriendo) || sensorZ.riesgo > 0.78) { z.estado = 'irse'; z.t = 5; z.escapeT = 0; }
      } else if (z.estado === 'cazar') {
        if (sensorZ.riesgo > 0.45 || d < 7 || js.corriendo) {
          z.estado = 'irse'; z.t = 5; z.escapeT = 0;
        } else if (!liebre || liebre.d > 30 || z.t <= 0) {
          z.estado = 'andar'; z.t = 2 + r() * 3;
        } else {
          rumbo = Math.atan2(liebre.x - z.pos.x, liebre.z - z.pos.z);
          vel = liebre.d < 8 ? 3.4 : 2.5;
        }
      } else if (z.estado === 'mirar') {
        rumbo = Math.atan2(js.pos.x - z.pos.x, js.pos.z - z.pos.z);
        if (d < 6 || js.corriendo || sensorZ.riesgo > 0.72) { z.estado = 'irse'; z.t = 5; z.escapeT = 0; }
        else if (z.t <= 0) { z.estado = 'irse'; z.t = 4; }
      } else if (z.estado === 'irse') {
        z.escapeT = (z.escapeT || 0) - dt;
        if (!z.escapeDestino || z.escapeT <= 0 || Math.hypot(z.escapeDestino.x - z.pos.x, z.escapeDestino.z - z.pos.z) < 2) {
          z.escapeDestino = destinoEscapeConCobertura(T, z.pos, js.pos, { radio: 15, muestras: 7, preferirCobertura: 0.7, evitarEstepa: 0.15, objetivoCobertura: 0.56, preferirBorde: 0.7 });
          z.escapeT = 1.4;
        }
        rumbo = z.escapeDestino ? Math.atan2(z.escapeDestino.x - z.pos.x, z.escapeDestino.z - z.pos.z) : Math.atan2(z.pos.x - js.pos.x, z.pos.z - js.pos.z);
        vel = 3.8;
        if (z.t <= 0) {
          // reaparece lejos, en otra parte del sendero
          for (let i = 0; i < 20; i++) {
            const idx = Math.floor(r() * T.sendero.length), p = T.sendero[idx];
            if (Math.hypot(p.x - js.pos.x, p.z - js.pos.z) > 90) { z.pos.set(p.x, T.altura(p.x, p.z), p.z); z.idx = idx; break; }
          }
          z.estado = 'andar';
        }
      }
      if (rumbo !== null) { const del = Math.atan2(Math.sin(rumbo - z.rumbo), Math.cos(rumbo - z.rumbo)); z.rumbo += del * Math.min(1, dt * 4); }
      z.vel = lerp(z.vel, vel, 1 - Math.exp(-5 * dt));
      const nx = z.pos.x + Math.sin(z.rumbo) * z.vel * dt, nz = z.pos.z + Math.cos(z.rumbo) * z.vel * dt;
      if (!T.agua(nx, nz)) { z.pos.x = nx; z.pos.z = nz; col.resolver(z.pos, 0.25); }
      z.pos.y = T.altura(z.pos.x, z.pos.z);
      z.g.rotation.y = z.rumbo;
      const marchaZ = marchaMamifero(z.vel, z.estado === 'irse' ? 'huir' : z.estado, 1.1, 3.8);
      z.marcha = marchaZ.modo;
      z.fase += dt * marchaZ.cadencia;
      z.patas.forEach((p, i) => { p.rotation.x = Math.sin(z.fase + (i % 2 ? Math.PI : 0) + (i > 1 ? marchaZ.posterior : 0)) * marchaZ.amplitud * Math.min(1, z.vel); });
      z.g.position.y += Math.abs(Math.sin(z.fase * 0.5)) * marchaZ.rebote * Math.min(1, z.vel);
      const sueloZ = inclinacionTerrenoMamifero(T, z.pos, z.rumbo, 0.24);
      const kSueloZ = 1 - Math.exp(-dt * 9);
      z.g.rotation.x = lerp(z.g.rotation.x, sueloZ.pitch, kSueloZ);
      z.g.rotation.z = lerp(z.g.rotation.z, sueloZ.roll + Math.sin(z.fase * 0.5) * 0.01 * Math.min(1, z.vel), kSueloZ);
      const microZ = actualizarMicroconducta(z, 'zorro', dt, { riesgo: sensorZ.riesgo, actividad: actividadZorro, velocidad: z.vel, estado: z.estado, lluvia: m.lluvia || 0 }, r);
      const gestoZ = gestoMicroconducta('zorro', microZ, z.microFase);
      const calmaZ = z.estado === 'andar' && z.vel < 1.25 && sensorZ.riesgo < 0.22 ? 1 : z.estado === 'mirar' ? 0.35 : 0;
      z.cola.rotation.y = Math.sin(z.fase * 0.5) * 0.15 + gestoZ.colaY * calmaZ;
      z.cabeza.rotation.x = lerp(z.cabeza.rotation.x, (z.estado === 'mirar' ? -0.15 : 0.1) + gestoZ.cabezaX * calmaZ, 1 - Math.exp(-dt * 5));
      z.cabeza.rotation.y = lerp(z.cabeza.rotation.y, z.estado === 'mirar' ? Math.sin(z.fase * 0.34) * 0.35 : gestoZ.cabezaY * calmaZ, 1 - Math.exp(-dt * 5));
      z.g.rotation.z += gestoZ.cuerpoZ * calmaZ;
      if (z.orejas) z.orejas.forEach((o, i) => { o.rotation.y = lerp(o.rotation.y, gestoZ.orejaY * (i ? -1 : 1) * Math.max(calmaZ, z.estado === 'mirar' ? 0.8 : 0), 1 - Math.exp(-dt * 8)); });
      actualizarSombraContacto(z.sombra, T, z.pos, z.g.visible, z.estado === 'irse' ? 0.72 : 0.95);
      if (z.g.visible) publicarAnimal('zorro', `zorro-${zi}`, z.pos, { estado: z.estado, vel: z.vel });
      if (z.g.visible) {
        tmp.set(z.pos.x, z.pos.y + 0.5, z.pos.z);
        anotar('zorro', tmp, 25, 80);
        poolSujetos.agregar('zorro', tmp, 0, `zorro-${zi}`, z.vel);
      }
    }

    // cisnes
    for (const c of cisnes) {
      c.fase += dt;
      let obj = c.obj;
      if (c.lider) obj = { x: c.lider.pos.x - Math.sin(c.lider.rumbo) * 2.2 + 1, z: c.lider.pos.z - Math.cos(c.lider.rumbo) * 2.2 };
      else if (Math.hypot(obj.x - c.pos.x, obj.z - c.pos.z) < 2) c.obj = puntoLago();
      const rumbo = Math.atan2(obj.x - c.pos.x, obj.z - c.pos.z);
      const del = Math.atan2(Math.sin(rumbo - c.rumbo), Math.cos(rumbo - c.rumbo));
      c.rumbo += del * Math.min(1, dt * 0.6);
      const vel = c.lider ? Math.min(0.6, Math.hypot(obj.x - c.pos.x, obj.z - c.pos.z) * 0.3) : 0.35;
      const nx = c.pos.x + Math.sin(c.rumbo) * vel * dt, nz = c.pos.z + Math.cos(c.rumbo) * vel * dt;
      if (dentroLago(nx, nz)) { c.pos.x = nx; c.pos.z = nz; } else if (!c.lider) c.obj = puntoLago();
      c.pos.y = Math.sin(c.fase * 1.3) * 0.02;
      c.g.rotation.y = c.rumbo;
      c.cabeza.rotation.x = Math.sin(c.fase * 0.4) * 0.15;
      tmp.set(c.pos.x, 0.5, c.pos.z);
      anotar('cisne', tmp, 35, 130);
      poolSujetos.agregar('cisne', tmp);
    }
    proxCisne -= dt;
    if (proxCisne <= 0 && cisnes.length) {
      const c = cisnes[Math.floor(r() * cisnes.length)];
      if (Math.hypot(c.pos.x - js.pos.x, c.pos.z - js.pos.z) < 90) sonido.cisnes(c.pos);
      proxCisne = 25 + r() * 40;
    }

    // patos de los torrentes
    const deDia = m.dia > 0.3;
    for (const p of patos) {
      p.g.visible = (deDia) && sale(p);
      if (!deDia) continue;
      p.t -= dt;
      if (p.buceo > 0) {
        p.buceo -= dt;
        if (p.buceo <= 0) {
          const j = Math.min(rio.length - 1, p.i + 2 + Math.floor(r() * 3));
          p.g.position.set(rio[j].x, rio[j].s + 0.02, rio[j].z);
          p.g.visible = (true) && sale(p); p.destino = 4;
          sonido.chapoteo(p.g.position, 0.4);
        } else p.g.visible = false && !sale(p);
      } else if (p.destino !== null) {
        p.destino -= dt;
        if (p.destino <= 0) {
          p.g.position.lerp(tmp.set(p.base.x, p.base.y + 0.18, p.base.z), 1 - Math.exp(-2 * dt));
          if (p.g.position.distanceTo(tmp) < 0.1) p.destino = null;
        }
        p.g.position.y += Math.sin(U_t(p) * 6) * 0.004;
      } else {
        p.cabeza.rotation.y = Math.sin(p.t * 1.7) * 0.5;
        if (p.t <= 0) { p.buceo = 2.5 + r() * 2; p.t = 12 + r() * 16; sonido.chapoteo(p.g.position, 0.5); }
      }
      if (p.g.visible) {
        tmp.copy(p.g.position);
        anotar('patotorrente', tmp, 22, 80);
        poolSujetos.agregar('pato', tmp);
      }
    }

    // martines pescadores
    for (const mp of martines) {
      mp.g.visible = (deDia) && sale(mp);
      if (!deDia) continue;
      mp.t -= dt;
      if (mp.vuelo >= 0) {
        mp.vuelo += dt / 1.4;
        const v = mp.vuelo;
        if (v < 0.35) { const k = v / 0.35; mp.g.position.set(lerp(mp.base.x, mp.agua.x, k), lerp(mp.base.y + 0.1, mp.agua.y, k * k), lerp(mp.base.z, mp.agua.z, k)); mp.g.rotation.x = 1.2; }
        else if (v < 1) { const k = (v - 0.35) / 0.65; mp.g.position.set(lerp(mp.agua.x, mp.base.x, k), lerp(mp.agua.y, mp.base.y + 0.1, Math.sqrt(k)), lerp(mp.agua.z, mp.base.z, k)); mp.g.rotation.x = -0.6; }
        else { mp.vuelo = -1; mp.g.rotation.x = 0; mp.g.position.set(mp.base.x, mp.base.y + 0.1, mp.base.z); }
        if (v >= 0.35 && v - dt / 1.4 < 0.35) sonido.chapoteo(mp.agua, 0.5);
      } else {
        mp.cabeza.rotation.y = Math.sin(mp.t * 0.9) * 0.4;
        if (mp.t <= 0) {
          const d = Math.hypot(mp.base.x - js.pos.x, mp.base.z - js.pos.z);
          if (d < 120) { mp.vuelo = 0; if (r() < 0.6) sonido.martin(mp.base); }
          mp.t = 18 + r() * 25;
        }
      }
      tmp.copy(mp.g.position);
      anotar('martin', tmp, 24, 90);
      poolSujetos.agregar('martin', tmp);
    }

    // picaflor alrededor del chilco más cercano
    buscaChilco -= dt;
    const hayPicaflor = deDia && m.invierno < 0.5 && m.lluvia < 0.6;
    if (buscaChilco <= 0) {
      buscaChilco = 1.5;
      let mejor = null, dm = 28;
      if (hayPicaflor) for (const c of chilcos) { const d = Math.hypot(c.x - js.pos.x, c.z - js.pos.z); if (d < dm) { dm = d; mejor = c; } }
      if (mejor !== pica.chilco) { pica.chilco = mejor; if (mejor) { pica.g.position.set(mejor.x, mejor.y + 1, mejor.z); pica.t = 0; } }
    }
    pica.g.visible = (!!pica.chilco && hayPicaflor) && sale(pica);
    if (pica.g.visible) {
      pica.t -= dt;
      pica.curioso -= dt;
      if (pica.t <= 0) {
        if (r() < 0.12 && Math.hypot(pica.chilco.x - js.pos.x, pica.chilco.z - js.pos.z) < 10) {
          camara.getWorldDirection(tmp);
          pica.obj.set(cam.position.x + tmp.x * 1.3, cam.position.y + 0.05, cam.position.z + tmp.z * 1.3);
          pica.curioso = 1.6; pica.t = 1.6;
          sonido.picaflor(pica.obj);
        } else {
          const a = r() * 6.28, rr = 0.5 + r() * 0.5;
          pica.obj.set(pica.chilco.x + Math.cos(a) * rr, pica.chilco.y + 0.6 + r() * 0.8, pica.chilco.z + Math.sin(a) * rr);
          pica.t = 0.5 + r() * 1.2;
          if (r() < 0.25 && Math.hypot(pica.chilco.x - js.pos.x, pica.chilco.z - js.pos.z) < 18) sonido.picaflor(pica.obj, r() < 0.6);
        }
      }
      picaAntes.copy(pica.g.position);
      pica.g.position.lerp(pica.obj, 1 - Math.exp(-7 * dt));
      pica.g.position.y += Math.sin(U_seg() * 9) * 0.004;
      movPica.copy(pica.g.position).sub(picaAntes);
      if (movPica.lengthSq() > 1e-6) pica.g.rotation.y = Math.atan2(movPica.x, movPica.z);
      if (pica.curioso > 0) pica.g.rotation.y = Math.atan2(cam.position.x - pica.g.position.x, cam.position.z - pica.g.position.z);
      const aleteo = Math.sin(U_seg() * 90);
      pica.alas[0].rotation.z = aleteo * 1.1; pica.alas[1].rotation.z = -aleteo * 1.1;
      tmp.copy(pica.g.position);
      anotar('picaflor', tmp, 7, 22);
      poolSujetos.agregar('picaflor', tmp);
    }

    // bandurrias: actividad diurna modulada por clima, no un simple on/off por luz.
    const actividadBandurria = actividadFaunaPatagonica('bandurria', h, m);
    const hayBandurrias = deDia && actividadBandurria > 0.30 && m.invierno < 0.5 && pastizales.length > 1;
    const zona = pastizales[bandada.zona] || { x: 0, z: 0 };
    bandada.t -= dt;
    for (const b of bandada.aves) b.g.visible = (hayBandurrias) && sale(b);
    if (hayBandurrias) {
      const dZona = Math.hypot(zona.x - js.pos.x, zona.z - js.pos.z);
      if (bandada.vuelo) {
        const v = bandada.vuelo;
        v.k += dt / v.dur;
        const k = Math.min(1, v.k);
        bandada.aves.forEach((b, i) => {
          b.pos.set(lerp(v.desde.x, v.hasta.x, k) + b.off.x, lerp(v.desde.y, v.hasta.y, k) + Math.sin(k * Math.PI) * 22 + b.off.y, lerp(v.desde.z, v.hasta.z, k) + b.off.z);
          b.g.rotation.y = Math.atan2(v.hasta.x - v.desde.x, v.hasta.z - v.desde.z);
          b.fase += dt * 12;
          b.alas.forEach((w, j) => { w.visible = true; w.rotation.z = (j ? -1 : 1) * Math.sin(b.fase + i) * 0.8; });
          b.patas.forEach((p) => { p.rotation.x = 1.3; });
        });
        if (k >= 1) {
          bandada.vuelo = null;
          bandada.aves.forEach((b) => { b.pos.y = T.altura(b.pos.x, b.pos.z); b.alas.forEach((w) => { w.visible = false; }); b.patas.forEach((p) => { p.rotation.x = 0; }); });
          sonido.bandurrias(bandada.aves[0].pos);
        }
      } else {
        const firmaBandurria = firmaSonoraJugador(js, m);
        const radioRuido = 14 + firmaBandurria * 30;
        const asustadas = (dZona < radioRuido && firmaBandurria > 0.34) || (dZona < 40 && js.corriendo);
        if (asustadas) {
          let otra = bandada.zona;
          while (otra === bandada.zona) otra = Math.floor(r() * pastizales.length);
          const destino = pastizales[otra];
          bandada.vuelo = { desde: new THREE.Vector3(zona.x, T.altura(zona.x, zona.z) + 1, zona.z), hasta: new THREE.Vector3(destino.x, T.altura(destino.x, destino.z), destino.z), k: 0, dur: Math.max(8, Math.hypot(destino.x - zona.x, destino.z - zona.z) / 12) };
          bandada.zona = otra;
          sonido.bandurrias(zona.x !== undefined ? { x: zona.x, y: T.altura(zona.x, zona.z) + 2, z: zona.z } : bandada.aves[0].pos);
        } else {
          for (const b of bandada.aves) {
            b.t -= dt;
            if (!b.obj || b.t <= 0) { b.obj = { x: zona.x + (r() - 0.5) * 22, z: zona.z + (r() - 0.5) * 22 }; b.t = 2 + r() * 5; }
            const rumbo = Math.atan2(b.obj.x - b.pos.x, b.obj.z - b.pos.z);
            const del = Math.atan2(Math.sin(rumbo - b.rumbo), Math.cos(rumbo - b.rumbo));
            b.rumbo += del * Math.min(1, dt * 3);
            const lejos = Math.hypot(b.obj.x - b.pos.x, b.obj.z - b.pos.z) > 0.5;
            const vel = lejos ? 0.5 : 0;
            b.pos.x += Math.sin(b.rumbo) * vel * dt; b.pos.z += Math.cos(b.rumbo) * vel * dt;
            b.pos.y = T.altura(b.pos.x, b.pos.z);
            b.g.rotation.y = b.rumbo;
            b.fase += dt * (vel ? 7 : 1.5);
            const microB = actualizarMicroconducta(b, 'bandurria', dt, { riesgo: 0, actividad: actividadBandurria, velocidad: vel, estado: vel ? 'caminar' : 'suelo', lluvia: m.lluvia || 0 }, r);
            const gestoB = gestoMicroconducta('bandurria', microB, b.microFase);
            b.patas.forEach((p, i) => { p.rotation.x = vel ? Math.sin(b.fase + i * Math.PI) * 0.4 : (microB === 'sondear' ? Math.sin(b.microFase * 3 + i * Math.PI) * 0.05 : 0); });
            b.cabeza.rotation.x = vel ? 0.1 : 0.42 + gestoB.cabezaX + Math.sin(b.fase * 2) * 0.08;
            b.cabeza.rotation.y = lerp(b.cabeza.rotation.y, gestoB.cabezaY, 1 - Math.exp(-dt * 5));
          }
          if (bandada.t <= 0) { if (dZona < 150) sonido.bandurrias({ x: zona.x, y: T.altura(zona.x, zona.z) + 2, z: zona.z }); bandada.t = 30 + r() * 50; }
        }
      }
      tmp.set(bandada.aves[0].pos.x, bandada.aves[0].pos.y + 0.4, bandada.aves[0].pos.z);
      anotar('bandurria', tmp, 35, 110);
      poolSujetos.agregar('bandurria', tmp);
    }

    // truchas que saltan al amanecer y al atardecer
    proxSalto -= dt;
    if (proxSalto <= 0) {
      proxSalto = 4 + r() * 9;
      if (penumbra && m.invierno < 0.5) {
        const libre = saltos.find((s) => s.t < 0);
        if (libre) {
          for (let i = 0; i < 12; i++) {
            const a = r() * 6.28, d = 10 + r() * 40;
            const x = cam.position.x + Math.cos(a) * d, z = cam.position.z + Math.sin(a) * d;
            if (dentroLago(x, z)) {
              libre.pos.set(x, 0, z); libre.t = 0; libre.rumbo = r() * 6.28;
              sonido.chapoteo(libre.pos, 0.6);
              break;
            }
          }
        }
      }
    }
    for (const s of saltos) {
      if (s.t < 0) continue;
      s.t += dt;
      const k = s.t / 0.7;
      s.pez.visible = k < 1;
      if (k < 1) {
        s.pez.position.set(s.pos.x + Math.sin(s.rumbo) * k * 0.9, Math.sin(k * Math.PI) * 0.6 - 0.05, s.pos.z + Math.cos(s.rumbo) * k * 0.9);
        s.pez.rotation.set(-Math.cos(k * Math.PI) * 1.1, s.rumbo, 0, 'YXZ');
        if (k > 0.95 && s.t - dt < 0.665) sonido.chapoteo(s.pez.position, 0.35);
      }
      const ka = Math.min(1, s.t / 2.6);
      s.anillo.position.set(s.pos.x + Math.sin(s.rumbo) * 0.5, 0.03, s.pos.z + Math.cos(s.rumbo) * 0.5);
      s.anillo.scale.setScalar(0.2 + ka * 1.8);
      s.anillo.material.opacity = (1 - ka) * 0.5;
      if (s.t > 2.6) { s.t = -1; s.anillo.material.opacity = 0; }
    }
  }

  let reloj = 0;
  function U_seg() { return reloj; }
  function U_t(p) { return reloj + p.i; }

  return {
    actualizar: (dt, jugador, camara, m) => { reloj += dt; actualizar(dt, jugador, camara, m); },
    sujetos: () => sujetos,
    _debug: { huemules, zorros, bandada, pica, cisnes, martines, patos },
  };
}
