// Los invasores, modelados por código con anatomía propia: cuerpo magro y encorvado,
// cráneo alargado, ojos negros enormes con brillo húmedo, costillas y vértebras
// marcadas, dedos larguísimos con garras y piernas digitígradas (la rodilla hacia atrás).
//
// Rendimiento: cada invasor es UNA sola malla. El runtime de Three.js del juego no trae
// SkinnedMesh, así que el esqueleto (14 huesos rígidos) se resuelve en el shader: cada
// vértice sabe a qué hueso pertenece (aHueso) y el vertex shader lo transforma con la
// matriz de ese hueso. Antes eran ~14 llamadas de dibujo por invasor; ahora es una.
//
// Piel: Lambert con agregados (onBeforeCompile) — reflejo húmedo, contorno bioluminiscente,
// venas que laten de noche, destello al recibir un golpe y disolución al morir.
import * as THREE from 'three';
import { mirada, silueta, acercar } from './mirada.js';
import { VENA_MUTADO } from './desafio-noche2.js';

const N_HUESOS = 14;
const H = { pelvis: 0, pecho: 1, cabeza: 2, mandibula: 3, hombroI: 4, codoI: 5, hombroD: 6, codoD: 7, musloI: 8, rodillaI: 9, tobilloI: 10, musloD: 11, rodillaD: 12, tobilloD: 13 };

// ---------------------------------------------------------------- material
const GLSL_RUIDO = `
  float azarA(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float ruidoA(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(azarA(i), azarA(i + vec3(1,0,0)), f.x), mix(azarA(i + vec3(0,1,0)), azarA(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(azarA(i + vec3(0,0,1)), azarA(i + vec3(1,0,1)), f.x), mix(azarA(i + vec3(0,1,1)), azarA(i + vec3(1,1,1)), f.x), f.y), f.z);
  }`;

// Cada invasor tiene su material (sus huesos y su destello), pero todos comparten el
// mismo programa compilado: la clave de caché es fija y el código del shader, idéntico.
function materialAlien(uniformes) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.userData.u = uniformes;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aHueso; attribute float aEmision; attribute float aVena; attribute float aDebil;
        uniform mat4 uHuesos[${N_HUESOS}];
        varying float vEmision; varying float vVenaA; varying vec3 vObjA; varying float vDebilA;`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        mat4 huesoA = uHuesos[int(aHueso + 0.5)];
        objectNormal = normalize(mat3(huesoA) * objectNormal);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vObjA = position; vEmision = aEmision; vVenaA = aVena; vDebilA = aDebil;
        transformed = (huesoA * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uFlash; uniform float uDisolver; uniform float uVenas; uniform float uTiempo; uniform float uOjos;
        uniform float uDebil; uniform vec3 uVena; uniform vec3 uBorde;
        uniform float uMirada; uniform float uSilueta; uniform vec3 uOjoColor; uniform float uReflejo;
        varying float vEmision; varying float vVenaA; varying vec3 vObjA; varying float vDebilA;
        ${GLSL_RUIDO}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        // disolución al morir: se deshace en brasas verdes
        float nDis = ruidoA(vObjA * 11.0) * 0.7 + ruidoA(vObjA * 31.0) * 0.3;
        if (nDis < uDisolver) discard;
        float bordeDis = uDisolver > 0.001 ? 1.0 - smoothstep(uDisolver, uDisolver + 0.07, nDis) : 0.0;`)
      .replace('#include <opaque_fragment>', `
        vec3 Va = normalize(vViewPosition);
        float cara = saturate(dot(normal, Va));
        // contorno: la piel húmeda recoge luz fría en los bordes de la silueta
        outgoingLight += uBorde * pow(1.0 - cara, 4.0) * (0.12 + uOjos * 0.3 + uMirada * 0.22);
        #if NUM_DIR_LIGHTS > 0
          vec3 Ha = normalize(directionalLights[0].direction + Va);
          // brillo húmedo, fino y cortado por la piel moteada (no es plástico parejo)
          float humedad = 0.55 + 0.45 * ruidoA(vObjA * 38.0);
          outgoingLight += directionalLights[0].color * pow(saturate(dot(normal, Ha)), 70.0) * 0.16 * humedad;
        #endif
        // venas finas bajo la piel: de día oscurecen, de noche laten con luz propia
        float trazo = abs(ruidoA(vObjA * 24.0 + vec3(0.0, uTiempo * 0.04, 0.0)) - 0.5);
        float trazo2 = abs(ruidoA(vObjA * 47.0 + vec3(3.1)) - 0.5);
        float venas = smoothstep(0.014, 0.0, trazo) * smoothstep(0.4, 0.55, ruidoA(vObjA * 5.0 + trazo2)) * vVenaA;
        float latido = 0.5 + 0.5 * sin(uTiempo * 2.3 + vObjA.y * 6.0);
        outgoingLight *= 1.0 - venas * 0.18;
        outgoingLight += uVena * venas * uVenas * latido;
        // cavidades más oscuras (oclusión barata: donde la normal mira hacia abajo)
        outgoingLight *= 0.78 + 0.22 * saturate(normal.y * 0.5 + 0.6);
        // De lejos el cuerpo se apaga hasta quedar en sombra: lo primero que se ve de
        // un invasor no es el invasor, son los ojos. Esto va antes de sumar el brillo
        // propio, así que los ojos sobreviven al oscurecimiento.
        outgoingLight *= 1.0 - uSilueta * 0.72;
        // ojos, sacos y orbes: brillo propio. Cuando el bicho te está mirando de frente,
        // los ojos se le prenden.
        // El color de los ojos NO se le suma al punto débil: los sacos del jefe tienen
        // que quedar verdes para que se lean como lo que hay que reventar, y sus ojos
        // son rojos. Por eso va multiplicado por (1 - vDebilA).
        outgoingLight += diffuseColor.rgb * vEmision * 1.6
          + uOjoColor * vEmision * (1.0 - vDebilA) * (uOjos + uMirada * 2.6);
        // punto débil: los sacos del jefe laten fuerte para que se vean de lejos
        outgoingLight += vec3(0.72, 1.0, 0.28) * vDebilA * uDebil * (1.1 + 0.7 * sin(uTiempo * 3.1));
        // 2.0: el reflejo de la linterna. Los ojos devuelven la luz hacia donde vino, como
        // los de un zorro en la ruta: se prende el ojo entero (la almendra, marcada con
        // emisión 0.015) y el punto húmedo. Ver desafio-sentidos.js.
        float ojoA = 1.0 - smoothstep(0.0, 0.006, abs(vEmision - 0.015));
        float puntoA = smoothstep(0.6, 0.72, vEmision) * (1.0 - vDebilA);
        outgoingLight += mix(uOjoColor, vec3(1.0, 0.96, 0.74), 0.55) * (ojoA * 2.4 + puntoA * 1.6) * uReflejo;
        outgoingLight = mix(outgoingLight, vec3(1.0, 1.0, 0.95), uFlash * 0.65);
        outgoingLight += vec3(0.5, 1.0, 0.45) * bordeDis * 2.2;
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'invasor-esqueleto-v4';
  return m;
}

// ---------------------------------------------------------------- armado de la malla
function h3(x, y, z) { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); }
function deformar(geo, fn) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  return geo;
}
class Armador {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.hue = []; this.emi = []; this.ven = []; this.deb = []; }
  agregar(geoOriginal, { hueso, color, emision = 0, vena = 0, debil = 0, matriz = null, variar = 0.1, manchas = 0.12 }) {
    const geo = geoOriginal.index ? geoOriginal.toNonIndexed() : geoOriginal.clone();
    if (!geo.attributes.normal) geo.computeVertexNormals();
    if (matriz) geo.applyMatrix4(matriz);
    const p = geo.attributes.position, n = geo.attributes.normal, c = new THREE.Color(color);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      // piel moteada: manchas grandes + variación fina
      const f = 1 - variar + 2 * variar * h3(x * 7.1, y * 5.3, z * 6.7) - manchas * Math.max(0, h3(Math.floor(x * 9), Math.floor(y * 9), Math.floor(z * 9)) - 0.6);
      this.pos.push(x, y, z); this.nor.push(n.getX(i), n.getY(i), n.getZ(i));
      this.col.push(c.r * f, c.g * f, c.b * f);
      this.hue.push(hueso); this.emi.push(emision); this.ven.push(vena); this.deb.push(debil);
    }
  }
  geometria() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aHueso', new THREE.Float32BufferAttribute(this.hue, 1));
    g.setAttribute('aEmision', new THREE.Float32BufferAttribute(this.emi, 1));
    g.setAttribute('aVena', new THREE.Float32BufferAttribute(this.ven, 1));
    g.setAttribute('aDebil', new THREE.Float32BufferAttribute(this.deb, 1));
    return g;
  }
}
const M = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
// segmento que cuelga del hueso hacia -Y
const segmento = (r0, r1, largo, lados = 8) => new THREE.CylinderGeometry(r1, r0, largo, lados, 3).translate(0, -largo / 2, 0);

// Proporciones por tipo. "grosor" engorda miembros y torso; "escala" agranda todo.
const TIPOS = {
  rastreador: {
    piel: '#404a44', oscura: '#1e2420', garra: '#26221f', ojos: '#010101', brillo: '#d8ffe6', escala: 1, grosor: 1, inclinacion: 0.42,
    brazo: [0.36, 0.4], pierna: [0.44, 0.46, 0.22], hombros: 0.15, cadera: 0.085, torso: 0.55, cabeza: 1, venas: 0.5,
  },
  tirador: {
    piel: '#39434f', oscura: '#1b2028', garra: '#1f2227', ojos: '#010102', brillo: '#d0f6ff', escala: 1.1, grosor: 0.9, inclinacion: 0.2,
    brazo: [0.38, 0.42], pierna: [0.48, 0.5, 0.24], hombros: 0.15, cadera: 0.08, torso: 0.6, cabeza: 1.08, venas: 0.35, cresta: true, sacos: true, orbe: true,
  },
  bruto: {
    piel: '#332f31', oscura: '#140f0e', garra: '#15110f', ojos: '#120804', brillo: '#ffb347', escala: 1.28, grosor: 1.85, inclinacion: 0.55,
    brazo: [0.42, 0.46], pierna: [0.42, 0.44, 0.2], hombros: 0.24, cadera: 0.12, torso: 0.62, cabeza: 0.82, venas: 0.25, placas: true,
  },
  // Saltador: chiquito, encorvado y con patas de langosta. Los espolones de los
  // talones son lo único macizo que tiene.
  saltador: {
    piel: '#4a5936', oscura: '#242c1b', garra: '#231f18', ojos: '#040502', brillo: '#e6ffa8', escala: 0.75, grosor: 0.78, inclinacion: 0.68,
    brazo: [0.28, 0.3], pierna: [0.52, 0.56, 0.26], hombros: 0.12, cadera: 0.075, torso: 0.48, cabeza: 0.94, venas: 0.6, espolones: true,
  },
  // Escupidor: panzón, patas cortas y una glándula de ácido que se le trasluce
  // en la garganta y el buche.
  escupidor: {
    piel: '#454c2a', oscura: '#232713', garra: '#2a2a18', ojos: '#0a0c04', brillo: '#d9ff7a', escala: 1.15, grosor: 1.3, inclinacion: 0.36,
    brazo: [0.34, 0.36], pierna: [0.42, 0.44, 0.2], hombros: 0.16, cadera: 0.1, torso: 0.66, cabeza: 1, venas: 0.45, buche: true,
  },
  // 2.1: excavador. Bajo, muy encorvado, color de tierra removida, brazos cortos y
  // gruesos como palas y placas en el lomo para abrirse paso.
  excavador: {
    piel: '#4a3c2c', oscura: '#211a12', garra: '#1a140e', ojos: '#0a0602', brillo: '#ffcf8a', escala: 0.95, grosor: 1.35, inclinacion: 0.78,
    brazo: [0.3, 0.32], pierna: [0.38, 0.4, 0.2], hombros: 0.19, cadera: 0.1, torso: 0.5, cabeza: 0.88, venas: 0.4, placas: true,
  },
  // 2.3: volador. Flaco y liviano, de patas cortas recogidas, piel morada casi negra
  // y cresta; las alas son membranas aparte que cuelgan del cuerpo (ver desafio.js).
  volador: {
    piel: '#3a3346', oscura: '#1a1622', garra: '#1c1820', ojos: '#050308', brillo: '#e2c8ff', escala: 0.85, grosor: 0.72, inclinacion: 0.3,
    brazo: [0.3, 0.34], pierna: [0.32, 0.34, 0.18], hombros: 0.13, cadera: 0.07, torso: 0.5, cabeza: 0.9, venas: 0.55, cresta: true,
  },
  // Jefe de nido: el bruto llevado al extremo, con placas, cresta y los sacos
  // bioluminiscentes de la espalda al descubierto (el punto débil).
  jefe: {
    piel: '#292321', oscura: '#0f0b09', garra: '#100c0a', ojos: '#1a0a02', brillo: '#ffe08a', escala: 2.1, grosor: 2.2, inclinacion: 0.5,
    brazo: [0.46, 0.5], pierna: [0.5, 0.52, 0.24], hombros: 0.28, cadera: 0.14, torso: 0.7, cabeza: 0.95, venas: 1,
    placas: true, cresta: true, sacosDebiles: true,
  },
};

// 1.8: la misma malla, con menos gajos, para los invasores que están lejos. No es
// otra criatura ni otro esqueleto: son las mismas primitivas con menos segmentos, así
// que el shader, los huesos y las poses siguen siendo los de siempre.
function menosGajos(f) {
  const n = (v, min) => Math.max(min, Math.round(v * f));
  return {
    SphereGeometry: class extends THREE.SphereGeometry {
      constructor(r, w = 8, h = 6, ...resto) { super(r, n(w, 5), n(h, 4), ...resto); } },
    CylinderGeometry: class extends THREE.CylinderGeometry {
      constructor(rt, rb, alto, radial = 8, altoSeg = 1, ...resto) { super(rt, rb, alto, n(radial, 4), altoSeg, ...resto); } },
    ConeGeometry: class extends THREE.ConeGeometry {
      constructor(r, alto, radial = 8, altoSeg = 1, ...resto) { super(r, alto, n(radial, 4), altoSeg, ...resto); } },
    TorusGeometry: class extends THREE.TorusGeometry {
      constructor(r, tubo, radial = 8, tubular = 6, arco) { super(r, tubo, n(radial, 3), n(tubular, 5), arco); } },
    LatheGeometry: class extends THREE.LatheGeometry {
      constructor(puntos, seg = 12, ...resto) { super(puntos, n(seg, 6), ...resto); } },
    IcosahedronGeometry: class extends THREE.IcosahedronGeometry {
      constructor(r, detalle = 0) { super(r, f < 0.9 ? 0 : detalle); } },
    CircleGeometry: class extends THREE.CircleGeometry {
      constructor(r, seg = 8, ...resto) { super(r, n(seg, 5), ...resto); } },
    BoxGeometry: THREE.BoxGeometry,
    Vector2: THREE.Vector2, Vector3: THREE.Vector3, Matrix4: THREE.Matrix4,
  };
}
const DETALLE_LEJOS = 0.5;
// A partir de acá el invasor es una silueta que se mueve: los gajos no se ven.
export const DISTANCIA_LOD = 42;
const cacheGeo = new Map();
function construirGeometria(tipo, detalle = 1) {
  const clave = `${tipo}|${detalle}`;
  if (cacheGeo.has(clave)) return cacheGeo.get(clave);
  const TH = detalle >= 1 ? THREE : menosGajos(detalle);
  const P = TIPOS[tipo], A = new Armador(), G = P.grosor;
  const piel = P.piel, oscura = P.oscura;
  // ---- pelvis
  A.agregar(new TH.SphereGeometry(0.08, 14, 10), { hueso: H.pelvis, color: piel, matriz: M(0, 0.03, -0.005, 0, 0, 0, 1.1 * G, 0.72, 0.72 * Math.sqrt(G)) });
  // crestas ilíacas: huesos de la cadera que asoman
  for (const s of [-1, 1]) A.agregar(new TH.SphereGeometry(0.02, 8, 6), { hueso: H.pelvis, color: piel, matriz: M(s * 0.06 * G, 0.06, 0.035, 0, 0, s * 0.4, 1.2, 0.6, 0.8) });
  // ---- torso: talle finísimo, caja torácica marcada, hombros huesudos
  const perfil = [[0.001, 0], [0.06, 0.01], [0.075, 0.06], [0.058, 0.14], [0.1, 0.24], [0.14, 0.33], [0.15, 0.41], [0.135, 0.48], [0.085, 0.53], [0.03, 0.56]]
    .map(([r, y]) => new THREE.Vector2(r * G, y * P.torso / 0.55));
  const torso = deformar(new TH.LatheGeometry(perfil, 22), (v) => {
    v.z *= 0.64;
    const y = v.y / (P.torso / 0.55);
    // costillas: surcos horizontales en el frente y los costados
    if (y > 0.2 && y < 0.46 && v.z > -0.02) { const k = 1 + 0.07 * Math.max(0, Math.sin((y - 0.2) * 58)); v.x *= k; v.z *= k; }
    // esternón hundido
    if (v.z > 0 && Math.abs(v.x) < 0.025 * G && y > 0.22 && y < 0.46) v.z -= 0.012;
    // vientre hundido bajo las costillas
    if (y > 0.08 && y < 0.2 && v.z > 0) v.z *= 0.78;
  });
  A.agregar(torso, { hueso: H.pecho, color: piel, vena: 1 });
  const radioTorso = (yn) => { for (let i = 1; i < perfil.length; i++) { const a = perfil[i - 1], b = perfil[i]; const ya = a.y / (P.torso / 0.55), yb = b.y / (P.torso / 0.55);
    if (yn <= yb) return a.x + (b.x - a.x) * ((yn - ya) / (yb - ya)); } return perfil[perfil.length - 1].x; };
  for (let i = 0; i < 5; i++) {
    const yn = 0.27 + i * 0.043, r = radioTorso(yn) * 0.995;
    A.agregar(new TH.TorusGeometry(r, 0.0052 * Math.sqrt(G), 4, 22, Math.PI * 0.92), { hueso: H.pecho, color: piel,
      matriz: M(0, yn * P.torso / 0.55, 0, Math.PI / 2 + 0.22, 0, Math.PI * 0.04, 1, 1, 0.66) });
  }
  // vértebras y omóplatos salientes en la espalda
  for (let i = 0; i < 9; i++) {
    const y = (0.04 + i * 0.058) * P.torso / 0.55;
    const r = y / (P.torso / 0.55);
    A.agregar(new TH.SphereGeometry(0.02 * Math.sqrt(G), 6, 5), { hueso: H.pecho, color: oscura, matriz: M(0, y, -(r > 0.2 ? 0.088 : 0.05) * G * 0.64 - 0.006, 0, 0, 0, 1, 0.8, 1.2) });
  }
  for (const s of [-1, 1]) {
    A.agregar(new TH.SphereGeometry(0.05, 10, 6), { hueso: H.pecho, color: piel, matriz: M(s * 0.068 * G, 0.4 * P.torso / 0.55, -0.078 * G, -0.2, s * 0.5, 0, 0.8 * G, 1.2, 0.14) });
    // clavículas
    A.agregar(new TH.CylinderGeometry(0.008, 0.01, P.hombros * 0.95, 6), { hueso: H.pecho, color: piel, matriz: M(s * P.hombros * 0.47, 0.49 * P.torso / 0.55, 0.045 * G, 0, 0, Math.PI / 2 - s * 0.18) });
  }
  if (P.placas) {
    // bruto: placas de quitina en la espalda y los hombros
    // placas superpuestas como las de un escarabajo, con borde filoso
    for (let i = 0; i < 6; i++) A.agregar(new TH.ConeGeometry(0.16, 0.1, 5), { hueso: H.pecho, color: oscura, variar: 0.2, manchas: 0,
      matriz: M(0, (0.1 + i * 0.085) * P.torso / 0.55, -0.1 * G - 0.01, -1.35, i * 0.4, 0, 1.25 - i * 0.05, 0.7, 1) });
    for (const s of [-1, 1]) {
      A.agregar(new TH.ConeGeometry(0.13, 0.08, 5), { hueso: H.pecho, color: oscura, variar: 0.2, manchas: 0, matriz: M(s * P.hombros * 0.95, 0.53 * P.torso / 0.55, -0.01, 0, 0, s * 0.9, 1.3, 1, 1.1) });
      for (let k = 0; k < 3; k++) A.agregar(new TH.ConeGeometry(0.018, 0.09, 4), { hueso: H.pecho, color: P.garra, manchas: 0, matriz: M(s * (P.hombros * 0.9 + k * 0.03), 0.6 * P.torso / 0.55, -0.03 - k * 0.03, -0.3, 0, s * 0.5) });
    }
  }
  if (P.sacos) {
    // tirador: sacos bioluminiscentes en la espalda
    for (const [x, y] of [[-0.06, 0.34], [0.07, 0.3], [0, 0.22], [-0.03, 0.43]]) A.agregar(new TH.SphereGeometry(0.038, 10, 8), { hueso: H.pecho, color: '#7dfff0', emision: 0.9, variar: 0.05, manchas: 0, matriz: M(x, y, -0.085) });
  }
  if (P.sacosDebiles) {
    // jefe: cinco sacos enormes que asoman entre las placas de la espalda. Llevan
    // aDebil = 1, así que el shader los hace latir: es el punto débil a la vista.
    for (const [x, y, r] of [[-0.085, 0.24, 1], [0.095, 0.2, 0.9], [0, 0.34, 1.2], [-0.1, 0.45, 0.85], [0.085, 0.46, 0.9]]) {
      const yy = y * P.torso / 0.55, z = -0.1 * G - 0.06;
      A.agregar(new TH.SphereGeometry(0.078 * r, 12, 9), { hueso: H.pecho, color: '#c8ff5e', emision: 0.85, debil: 1, variar: 0.05, manchas: 0,
        matriz: M(x * G, yy, z, 0, 0, 0, 1, 1, 0.85) });
      // anillo de quitina abierto alrededor: se ve que la placa no llega a taparlo
      A.agregar(new TH.TorusGeometry(0.078 * r + 0.016, 0.014, 4, 14), { hueso: H.pecho, color: oscura, variar: 0.15, manchas: 0, matriz: M(x * G, yy, z + 0.03) });
    }
  }
  if (P.buche) {
    // escupidor: la glándula de ácido se trasluce en el buche y en la garganta
    A.agregar(new TH.SphereGeometry(0.085, 12, 9), { hueso: H.pecho, color: '#d6ff4a', emision: 0.5, vena: 0.4, variar: 0.06, manchas: 0,
      matriz: M(0, 0.17 * P.torso / 0.55, 0.05 * G, 0, 0, 0, 0.85 * G, 1.1, 0.85) });
  }
  // ---- cabeza: cráneo alargado hacia atrás, cara que se afina en un mentón chico,
  // cuencas hundidas donde asoman ojos negros enormes
  const C = P.cabeza, CY = 0.32 * C;
  const ojoX = 0.064 * C, ojoY = CY + 0.012 * C;
  const craneo = deformar(new TH.SphereGeometry(0.16, 34, 26), (v) => {
    if (v.y > -0.02) { v.y *= 1.22; if (v.z < 0) v.z *= 1.55; v.z -= Math.max(0, v.y) * 0.45; }
    else { const k = Math.min(1, -v.y / 0.16); v.x *= 1 - k * 0.6; v.y *= 1.35; v.z = v.z * (1 - k * 0.2) + k * 0.03; }
    if (v.z > 0.04 && v.y < -0.02 && v.y > -0.14) v.x *= 0.84;                         // mejillas chupadas
    if (v.z > 0.07 && v.y > 0.03 && v.y < 0.075) v.z += 0.01 * (1 - Math.abs(v.x) / 0.16); // arco superciliar
    // cuencas: hundimientos grandes donde van los ojos
    for (const s of [-1, 1]) {
      const d = Math.hypot((v.x - s * 0.064) / 0.07, (v.y - 0.012) / 0.042);
      if (v.z > 0.05 && d < 1) v.z -= 0.032 * (1 - d * d);
    }
    v.multiplyScalar(C);
  });
  A.agregar(craneo, { hueso: H.cabeza, color: piel, vena: 0.5, matriz: M(0, CY, 0.02 * C) });
  if (P.cresta) A.agregar(new TH.ConeGeometry(0.03, 0.22, 5), { hueso: H.cabeza, color: oscura, matriz: M(0, CY + 0.2 * C, -0.13 * C, -1.2, 0, 0, 1, 1, 0.4) });
  if (P.buche) A.agregar(new TH.SphereGeometry(0.038, 10, 8), { hueso: H.cabeza, color: '#d6ff4a', emision: 0.65, variar: 0.05, manchas: 0, matriz: M(0, 0.1, 0.03, 0, 0, 0, 1.2, 1.7, 1) });
  // cuello largo y fino, con los tendones marcados
  A.agregar(segmento(0.026 * Math.sqrt(G), 0.034 * Math.sqrt(G), 0.2, 9), { hueso: H.cabeza, color: piel, vena: 0.6, matriz: M(0, 0.15, 0.01) });
  for (const s of [-1, 1]) A.agregar(segmento(0.007, 0.01, 0.17, 5), { hueso: H.cabeza, color: piel, matriz: M(s * 0.018, 0.14, 0.022, 0.12, 0, s * 0.18) });
  // ojos: almendras negras enormes y rasgadas, con un brillo húmedo; de noche reflejan verde
  for (const s of [-1, 1]) {
    A.agregar(new TH.SphereGeometry(1, 20, 14), { hueso: H.cabeza, color: P.ojos, variar: 0.02, manchas: 0, emision: 0.015,
      matriz: M(s * ojoX, ojoY, 0.15 * C, -0.12, s * 0.55, s * 0.62, 0.06 * C, 0.024 * C, 0.036 * C) });
    A.agregar(new TH.SphereGeometry(0.0045 * C, 6, 4), { hueso: H.cabeza, color: P.brillo, emision: 0.7, variar: 0, manchas: 0, matriz: M(s * (ojoX - 0.012 * C), ojoY + 0.008 * C, 0.182 * C) });
    // fosas nasales: dos ranuras, sin nariz
    A.agregar(new TH.SphereGeometry(0.006 * C, 5, 4), { hueso: H.cabeza, color: '#15130f', variar: 0, manchas: 0, matriz: M(s * 0.011 * C, CY - 0.07 * C, 0.162 * C, 0, 0, s * 0.4, 0.6, 1.4, 0.8) });
  }
  // boca: una ranura fina con dientes como agujas (la mandíbula es otro hueso)
  A.agregar(new THREE.BoxGeometry(0.046 * C, 0.005, 0.02), { hueso: H.cabeza, color: '#120e0c', variar: 0, manchas: 0, matriz: M(0, CY - 0.155 * C, 0.125 * C) });
  for (let i = 0; i < 7; i++) A.agregar(new TH.ConeGeometry(0.003 * C, 0.018 * C, 4), { hueso: H.cabeza, color: '#d6cdb4', variar: 0.05, manchas: 0, matriz: M((i - 3) * 0.0068 * C, CY - 0.16 * C, 0.126 * C, Math.PI, 0, 0) });
  // mandíbula: labio inferior fino, garganta oscura y dientes de abajo
  A.agregar(new TH.SphereGeometry(0.028 * C, 12, 8), { hueso: H.mandibula, color: piel, matriz: M(0, -0.004, 0.012 * C, 0, 0, 0, 1.1, 0.35, 0.8) });
  A.agregar(new THREE.BoxGeometry(0.04 * C, 0.022 * C, 0.04 * C), { hueso: H.mandibula, color: '#2a0f10', variar: 0, manchas: 0, matriz: M(0, 0.006, -0.002) });
  for (let i = 0; i < 6; i++) A.agregar(new TH.ConeGeometry(0.003 * C, 0.016 * C, 4), { hueso: H.mandibula, color: '#d6cdb4', variar: 0.05, manchas: 0, matriz: M((i - 2.5) * 0.0068 * C, 0.008 * C, 0.02 * C) });
  // ---- brazos: largos, huesudos, con codos y nudillos marcados y tres dedos con garra
  const [lb, la] = P.brazo, rg = Math.sqrt(G);
  for (const [h, hc, s] of [[H.hombroI, H.codoI, -1], [H.hombroD, H.codoD, 1]]) {
    A.agregar(new TH.SphereGeometry(0.032 * rg, 10, 8), { hueso: h, color: piel });
    A.agregar(segmento(0.026 * G, 0.034 * G, lb, 9), { hueso: h, color: piel, vena: 0.8 });
    A.agregar(new TH.SphereGeometry(0.03 * rg, 8, 6), { hueso: hc, color: piel });
    A.agregar(segmento(0.017 * G, 0.027 * G, la, 9), { hueso: hc, color: piel, vena: 0.8 });
    if (P.placas) A.agregar(new TH.IcosahedronGeometry(0.07, 0), { hueso: hc, color: oscura, matriz: M(0, -la * 0.45, -0.03, 0, 0, 0, 0.9, 2.4, 0.7) });
    // mano: palma angosta y tres dedos larguísimos que se curvan hacia adelante
    A.agregar(new TH.SphereGeometry(0.03 * rg, 8, 6), { hueso: hc, color: piel, matriz: M(0, -la - 0.02, 0.005, 0, 0, 0, 0.9, 1.3, 0.55) });
    for (const [dx, rz, largo] of [[-0.018, 0.22, 0.15], [0, 0, 0.18], [0.018, -0.22, 0.15], [0.02 * s, -0.8 * s, 0.09]]) {
      const base = M(dx * rg, -la - 0.04, 0.01, 0.35, 0, rz);
      A.agregar(segmento(0.006 * rg, 0.009 * rg, largo, 5).applyMatrix4(base), { hueso: hc, color: piel });
      const punta = new THREE.Vector3(0, -largo, 0).applyMatrix4(base);
      A.agregar(new TH.ConeGeometry(0.007 * rg, 0.05, 5).rotateX(Math.PI), { hueso: hc, color: P.garra, variar: 0.05, manchas: 0, matriz: M(punta.x, punta.y - 0.018, punta.z + 0.01, 0.55, 0, rz) });
    }
  }
  if (P.orbe) A.agregar(new TH.IcosahedronGeometry(0.075, 2), { hueso: H.codoD, color: '#7dfff0', emision: 1, variar: 0, manchas: 0, matriz: M(0, -P.brazo[1] - 0.09, 0.07) });
  // ---- piernas digitígradas: muslo, canilla larga y metatarso, con tres garras por pie
  const [lm, lc, lt] = P.pierna;
  for (const [hm, hr, ht] of [[H.musloI, H.rodillaI, H.tobilloI], [H.musloD, H.rodillaD, H.tobilloD]]) {
    A.agregar(new TH.SphereGeometry(0.043 * Math.sqrt(G), 10, 8), { hueso: hm, color: piel });
    A.agregar(segmento(0.03 * G, 0.045 * G, lm, 10), { hueso: hm, color: piel, vena: 0.7 });
    // saltador: el músculo del muslo y el espolón del talón, de saltamontes
    if (P.espolones) {
      A.agregar(new TH.SphereGeometry(0.062, 10, 8), { hueso: hm, color: piel, vena: 0.7, matriz: M(0, -lm * 0.34, -0.022, 0, 0, 0, 1, 1.7, 1.25) });
      A.agregar(new TH.ConeGeometry(0.019 * rg, 0.14, 5), { hueso: ht, color: P.garra, variar: 0.05, manchas: 0, matriz: M(0, -lt * 0.3, -0.03, -0.55, 0, 0) });
    }
    A.agregar(new TH.SphereGeometry(0.038 * rg, 8, 6), { hueso: hr, color: piel });
    A.agregar(segmento(0.022 * G, 0.036 * G, lc, 9), { hueso: hr, color: piel, vena: 0.6 });
    A.agregar(new TH.SphereGeometry(0.026 * rg, 8, 6), { hueso: ht, color: piel });
    A.agregar(segmento(0.017 * G, 0.024 * G, lt, 8), { hueso: ht, color: oscura });
    for (const rz of [-0.4, 0, 0.4]) {
      const base = M(0, -lt, 0.01, Math.PI / 2 - 0.15, rz, 0);
      A.agregar(segmento(0.01 * rg, 0.014 * rg, 0.1, 5).applyMatrix4(base), { hueso: ht, color: oscura });
      const punta = new THREE.Vector3(0, -0.1, 0).applyMatrix4(base);
      A.agregar(new TH.ConeGeometry(0.01 * rg, 0.045, 5).rotateX(-Math.PI / 2 + 0.3), { hueso: ht, color: P.garra, variar: 0.05, manchas: 0, matriz: M(punta.x, punta.y - 0.005, punta.z + 0.015, 0, rz, 0) });
    }
  }
  const g = A.geometria();
  cacheGeo.set(clave, g);
  return g;
}

// ---------------------------------------------------------------- esqueleto
function esqueleto(P) {
  const raiz = new THREE.Object3D();
  const huesos = Array.from({ length: N_HUESOS }, () => new THREE.Object3D());
  const [lm, lc, lt] = P.pierna;
  const alturaCadera = lm * Math.cos(0.45) + lc * Math.cos(0.6) + lt * Math.cos(0.05) + 0.03;
  const colgar = (h, padre, x, y, z, rx = 0, ry = 0, rz = 0) => { huesos[padre === -1 ? 0 : padre].add(huesos[h]); huesos[h].position.set(x, y, z); huesos[h].rotation.set(rx, ry, rz); huesos[h].userData.reposo = new THREE.Euler(rx, ry, rz); };
  raiz.add(huesos[H.pelvis]);
  huesos[H.pelvis].position.set(0, alturaCadera, 0); huesos[H.pelvis].userData.reposo = new THREE.Euler();
  colgar(H.pecho, H.pelvis, 0, 0.05, 0, P.inclinacion);
  colgar(H.cabeza, H.pecho, 0, P.torso - 0.04, 0.03, -P.inclinacion * 0.8);
  colgar(H.mandibula, H.cabeza, 0, 0.32 * P.cabeza - 0.158 * P.cabeza, 0.108 * P.cabeza);
  colgar(H.hombroI, H.pecho, -P.hombros, P.torso * 0.9, 0.01, -0.1, 0, -0.14);
  colgar(H.codoI, H.hombroI, 0, -P.brazo[0], 0, -0.35);
  colgar(H.hombroD, H.pecho, P.hombros, P.torso * 0.9, 0.01, -0.1, 0, 0.14);
  colgar(H.codoD, H.hombroD, 0, -P.brazo[0], 0, -0.35);
  colgar(H.musloI, H.pelvis, -P.cadera * P.grosor ** 0.5, 0, 0, -0.45);
  colgar(H.rodillaI, H.musloI, 0, -lm, 0, 1.05);
  colgar(H.tobilloI, H.rodillaI, 0, -lc, 0, -0.65);
  colgar(H.musloD, H.pelvis, P.cadera * P.grosor ** 0.5, 0, 0, -0.45);
  colgar(H.rodillaD, H.musloD, 0, -lm, 0, 1.05);
  colgar(H.tobilloD, H.rodillaD, 0, -lc, 0, -0.65);
  return { raiz, huesos, alturaCadera };
}

// ---------------------------------------------------------------- el invasor
const geoSombra = new THREE.CircleGeometry(0.55, 18).rotateX(-Math.PI / 2);
const matSombra = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
// 2.6.1: las listas de huesos, fijas: `animar` y `caer` corren por invasor y por cuadro, y
// armarlas ahí era basura para el recolector en cada uno
const PIERNAS = [[H.musloI, H.rodillaI, H.tobilloI, 1], [H.musloD, H.rodillaD, H.tobilloD, -1]];
const BRAZOS = [[H.hombroI, H.codoI, -1], [H.hombroD, H.codoD, 1]];
const MUSLOS = [H.musloI, H.musloD], RODILLAS = [H.rodillaI, H.rodillaD];
const _mirada = { dif: 0, distancia: 0, noche: 0, ataca: false };

export function crearAlien(tipo) {
  const P = TIPOS[tipo] || TIPOS.rastreador;
  const g = new THREE.Group();
  const VENA = { bruto: '#ffb347', jefe: '#ffcb52', escupidor: '#d6ff4a', saltador: '#b6ff7a', excavador: '#ff9a4a', volador: '#c89aff' };
  const BORDE = { tirador: '#6f9fc0', escupidor: '#9fc06f', jefe: '#c08a5f', saltador: '#8fc07a', excavador: '#a88a5f', volador: '#8a7aa8' };
  // El color de los ojos cuando se prenden. Es lo único que se ve de noche a treinta
  // metros, así que es lo que le da la cara a cada tipo.
  const OJO = {
    rastreador: '#9dff7a', tirador: '#7ad4ff', bruto: '#ff7a2e',
    saltador: '#d8ff4a', escupidor: '#b6ff3a', jefe: '#ff3b18', excavador: '#ffb070', volador: '#d9b0ff',
  };
  const mat = materialAlien({
    uHuesos: { value: Array.from({ length: N_HUESOS }, () => new THREE.Matrix4()) },
    uFlash: { value: 0 }, uDisolver: { value: 0 }, uVenas: { value: P.venas }, uTiempo: { value: Math.random() * 50 }, uOjos: { value: 0.3 },
    uDebil: { value: P.sacosDebiles ? 1 : 0 },
    uMirada: { value: 0 }, uSilueta: { value: 0 }, uReflejo: { value: 0 },
    uOjoColor: { value: new THREE.Color(OJO[tipo] || '#9dff7a') },
    uVena: { value: new THREE.Color(VENA[tipo] || '#7dff9a') }, uBorde: { value: new THREE.Color(BORDE[tipo] || '#5fa88a') },
  });
  const geoCerca = construirGeometria(tipo, 1);
  const geoLejos = construirGeometria(tipo, DETALLE_LEJOS);
  const malla = new THREE.Mesh(geoCerca, mat);
  let lejos = false;
  malla.scale.setScalar(P.escala);
  malla.frustumCulled = false;   // la esfera de la pose de reposo no acompaña los movimientos
  malla.castShadow = false;
  g.add(malla);
  const sombra = new THREE.Mesh(geoSombra, matSombra);
  sombra.position.y = 0.04; sombra.scale.setScalar(P.escala * (tipo === 'bruto' ? 1.5 : tipo === 'jefe' ? 1.7 : 1));
  sombra.renderOrder = -1;
  g.add(sombra);
  const esq = esqueleto(P);
  const u = mat.userData.u;
  esq.huesos.forEach((h, i) => { u.uHuesos.value[i] = h.matrixWorld; });
  const B = esq.huesos;
  const rep = (i) => B[i].userData.reposo;
  // 2.0: mutado (las noches después del nido)
  let mutado = false;
  const venaNormal = u.uVena.value.clone(), venaMutada = new THREE.Color(VENA_MUTADO);
  const pose = { tic: 0, ticObjetivo: new THREE.Vector2(), ticVel: 0, chillido: 0, fase: Math.random() * 10, respiro: Math.random() * 6, golpeDebil: 0 };

  function aplicar(i, rx = 0, ry = 0, rz = 0) { const r = rep(i); B[i].rotation.set(r.x + rx, r.y + ry, r.z + rz); }

  // Una pose por cuadro a partir del estado del invasor.
  // 1.8: a partir de cierta distancia se dibuja la malla de menos gajos. Es la misma
  // criatura, con el mismo esqueleto: sólo tiene menos triángulos donde no se notan.
  function detalle(distancia) {
    const quiere = distancia > DISTANCIA_LOD;
    if (quiere === lejos) return lejos;
    lejos = quiere;
    malla.geometry = quiere ? geoLejos : geoCerca;
    return lejos;
  }

  function animar(e) {
    const dt = e.dt;
    pose.fase += dt;
    pose.respiro += dt * (e.noche ? 1.4 : 1);
    u.uTiempo.value += dt;
    u.uOjos.value = 0.15 + e.noche * 0.85;
    // 2.0: los mutados tienen las venas de otro color y encendidas aun de día
    u.uVenas.value = P.venas * e.noche * 0.8 * (e.ataca ? 1.8 : 1) * (mutado ? 2.2 : 1) + (mutado ? 0.3 : 0);
    // el reflejo de la linterna sube y baja rápido: es luz que rebota, no una brasa
    u.uReflejo.value += ((e.reflejo || 0) - u.uReflejo.value) * Math.min(1, dt * 14);
    // ¿Te está mirando? Se mide el ángulo entre hacia dónde apunta el bicho y hacia
    // dónde estás vos. De frente y cerca, se le prenden los ojos; si gira la cabeza
    // para otro lado, se apagan. Es lo que convierte un bicho en algo que te vio.
    if (e.jugador) {
      const dx = e.jugador.x - g.position.x, dz = e.jugador.z - g.position.z;
      const dist = Math.hypot(dx, dz);
      const dif = Math.atan2(dx, dz) - g.rotation.y;
      _mirada.dif = dif; _mirada.distancia = dist; _mirada.noche = e.noche; _mirada.ataca = e.ataca;   // 2.6.1: sin objeto nuevo
      const quiere = mirada(_mirada);
      u.uMirada.value = acercar(u.uMirada.value, quiere, dt);
      // y de lejos el cuerpo se apaga hasta quedar en sombra
      u.uSilueta.value = silueta(dist, e.noche);
    }
    // los sacos del jefe brillan siempre, y más fuerte el rato que sigue a un golpe ahí
    pose.golpeDebil = Math.max(0, pose.golpeDebil - dt * 2);
    if (P.sacosDebiles) u.uDebil.value = 1 + pose.golpeDebil * 2.2;
    // tics de cabeza: quietud, y de golpe un giro seco a otro lado (lo más inquietante)
    pose.tic -= dt;
    if (pose.tic <= 0) { pose.tic = 0.6 + Math.random() * 2.8; pose.ticObjetivo.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.5); }
    pose.chillido = Math.max(0, pose.chillido - dt);
    const vel = Math.max(0, e.velocidad || 0);
    const anda = vel > 0.2;
    const carrera = e.carrera && anda;
    const t = pose.fase * (1.6 + vel * (carrera ? 1.35 : 1.9));
    const paso = Math.sin(t), paso2 = Math.cos(t);
    const amp = anda ? Math.min(1, 0.35 + vel * 0.14) : 0;
    const respiro = Math.sin(pose.respiro * 1.3) * 0.03;
    const golpe = e.golpe || 0;
    // pelvis: rebote y vaivén
    B[H.pelvis].position.y = esq.alturaCadera - (e.agazapado ? 0.12 : 0) - (carrera ? 0.08 : 0) + (anda ? Math.abs(paso2) * 0.045 * amp : 0);
    B[H.pelvis].rotation.set(0, paso * 0.12 * amp, paso * 0.05 * amp);
    // torso: encorvado; en carrera se tira hacia adelante como un animal
    const lean = carrera ? 1.05 : e.ataca ? 0.25 : e.agazapado ? 0.3 : 0;
    aplicar(H.pecho, lean + respiro - golpe * 0.25 + (e.apuntando ? -0.15 : 0), -paso * 0.14 * amp, 0);
    // cabeza: compensa la inclinación para mirar adelante, más los tics
    const mira = carrera ? -0.95 : e.ataca ? 0.12 : 0;
    const ticX = e.ataca || carrera ? 0 : pose.ticObjetivo.y, ticY = e.ataca || carrera ? 0 : pose.ticObjetivo.x;
    const chill = pose.chillido > 0 ? Math.sin((1 - pose.chillido / 0.9) * Math.PI) : 0;
    aplicar(H.cabeza, mira + ticX - chill * 0.22 + (anda ? paso2 * 0.04 : 0), ticY, ticY * 0.3);
    // mandíbula: se abre al chillar y al atacar
    aplicar(H.mandibula, Math.max(chill * 0.75, golpe * 0.6, e.ataca ? 0.25 + Math.sin(pose.fase * 9) * 0.1 : 0.03));
    // piernas digitígradas: la canilla acompaña el vuelo y el metatarso apoya
    const zancada = carrera ? 1.25 : 0.62;
    for (const [hm, hr, ht, s] of PIERNAS) {
      const f = s * paso, fc = s * paso2;
      aplicar(hm, -f * zancada * amp - (e.agazapado ? 0.35 : 0) - (carrera ? 0.25 : 0));
      aplicar(hr, Math.max(0, fc) * 0.9 * amp + (e.agazapado ? 0.5 : 0));
      aplicar(ht, -Math.max(0, fc) * 0.5 * amp + f * 0.2 * amp);
    }
    // brazos: cuelgan sueltos y se balancean; en carrera "caminan" como patas;
    // al atacar suben y bajan en un zarpazo; el tirador apunta con el orbe
    for (const [hh, hc, s] of BRAZOS) {
      let rx = 0, rz = 0, cx = 0;
      if (carrera) { rx = -1.25 + s * paso * 0.9; cx = -0.3 - Math.max(0, -s * paso2) * 0.6; }
      else if (golpe > 0 || e.ataca) { rx = -1.9 * golpe - (e.ataca ? 0.9 : 0) + (s > 0 ? 0 : 0.2 * Math.sin(pose.fase * 5)); cx = -0.6 + golpe * 0.5; rz = -s * 0.15; }
      else if (e.apuntando && s > 0) { rx = -1.45 - golpe * 0.1; cx = 0.25; }
      else { rx = -s * paso * 0.45 * amp + Math.sin(pose.respiro + s) * 0.04; cx = -0.15 - Math.abs(paso) * 0.2 * amp; }
      if (e.enredado) { rx = -0.8 + Math.sin(pose.fase * 11 + s) * 0.5; cx = -0.5; }
      aplicar(hh, rx, 0, rz);
      aplicar(hc, cx);
    }
    if (e.enredado) { for (const hm of MUSLOS) aplicar(hm, 0.1); for (const hr of RODILLAS) aplicar(hr, 0.1); }
    // en el aire (salto del saltador): se agrupa al despegar y estira las patas al caer
    if (e.saltando > 0) {
      const k = Math.min(1, e.saltando), recoger = Math.sin(k * Math.PI);
      B[H.pelvis].position.y = esq.alturaCadera + recoger * 0.05;
      B[H.pelvis].rotation.set(0, 0, 0);
      aplicar(H.pecho, 0.5 - k * 0.3);
      aplicar(H.cabeza, -0.4);
      for (const [hm, hr, ht] of PIERNAS) {
        aplicar(hm, -0.45 - recoger * 0.95); aplicar(hr, 0.25 + recoger * 1.5); aplicar(ht, -0.2 - recoger * 0.55);
      }
      for (const [hh, hc, s] of BRAZOS) { aplicar(hh, -0.55 - recoger * 0.8, 0, -s * 0.3); aplicar(hc, -0.5); }
    }
    esq.raiz.updateMatrixWorld(true);
  }
  // Se desploma: rodillas que ceden, torso que cae hacia adelante.
  function caer(t) {
    const k = Math.min(1, t / 0.7);
    B[H.pelvis].position.y = esq.alturaCadera * (1 - k * 0.8);
    aplicar(H.pecho, k * 1.3);
    aplicar(H.cabeza, k * 0.4, 0, k * 0.5);
    aplicar(H.mandibula, 0.5 * k);
    for (const [hm, hr] of PIERNAS) { aplicar(hm, -k * 1.1); aplicar(hr, k * 1.2); }
    for (const [hh, hc] of BRAZOS) { aplicar(hh, -k * 0.6); aplicar(hc, -k * 0.4); }
    esq.raiz.updateMatrixWorld(true);
  }

  // pose inicial
  esq.raiz.updateMatrixWorld(true);
  return {
    g, malla, esc: 1, tipo,
    // para el banco visual: cuánto se le prendieron los ojos y cuánto se apagó el cuerpo
    uniformes: () => u,
    // compatibilidad: estos huesos también se pueden mover desde afuera
    cuerpo: B[H.pecho], cabeza: B[H.cabeza], piernas: [B[H.musloI], B[H.musloD]], brazos: [B[H.hombroI], B[H.hombroD]],
    animar, detalle, caer,
    chillar() { pose.chillido = 0.9; },
    flash(v) { u.uFlash.value = v; },
    mutar(si) { mutado = !!si; u.uVena.value.copy(si ? venaMutada : venaNormal); },
    get mutado() { return mutado; },
    // un golpe en los sacos: se encienden un instante
    golpeDebil() { pose.golpeDebil = 1; },
    disolver(v) { u.uDisolver.value = v; sombra.visible = v < 0.5; },
    // Los invasores se reciclan de una oleada a la otra, así que hay que apagarle todo
    // lo que quedó prendido de la vida anterior: si no, el que baja de nuevo a sesenta
    // metros aparece con los ojos encendidos porque el anterior te estaba mirando.
    reiniciar() {
      u.uDisolver.value = 0; u.uFlash.value = 0; pose.golpeDebil = 0;
      u.uDebil.value = P.sacosDebiles ? 1 : 0;
      u.uMirada.value = 0; u.uSilueta.value = 0; u.uReflejo.value = 0;
      mutado = false; u.uVena.value.copy(venaNormal);
      sombra.visible = true; malla.visible = true;
    },
  };
}
export const ALTURAS_ALIEN = { rastreador: 1.72, tirador: 2.02, bruto: 2.55, saltador: 1.38, escupidor: 2.1, jefe: 4.2, excavador: 1.6, volador: 1.1 };
