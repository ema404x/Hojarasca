// 3.8.0: los duendes del Desafío (los que eran los invasores): el esqueleto, la animación y el dibujo.
// Los modelos se arman en duendes-modelo.js (estilo C, bosque y musgo); las reglas nuevas (viejos,
// crecer, el robo) en desafio-duendes-reglas.js. El juego (vida, daño, cajas de golpe, IA, oleadas,
// reciclado) es el de siempre: `crearDuende(tipo)` devuelve lo mismo que devolvía crearAlien.
//
// Rendimiento (lo pendiente del prototipo: 30 duendes eran ~76 dibujos y ~2,5 ms):
//   · Instanciado: todos los duendes que comparten modelo (tipo, travieso o viejo, cerca o lejos) se
//     dibujan en UNA llamada (InstancedMesh). El esqueleto de cada uno va en una fila de una textura
//     compartida (18 huesos × 4 texeles), que el shader lee con texelFetch: una sola subida por cuadro,
//     como los huesos de la gente (gente-cuerpo.js). Lo que cambia por duende (el destello, la
//     disolución, los ojos, la mirada, la silueta, la linterna, el punto débil, el borde de los
//     adaptados, el robo) va en atributos por instancia.
//   · LOD: de lejos, el modelo con menos gajos y sin lo fino (dedos, remiendos, mechones).
//   · Las sombras de mancha, todas en una llamada; los halos de los ojos, en una.
//   · Todo se vuelca antes de dibujar (onBeforeRender de la escena): el juego mueve el grupo `g` de
//     cada duende como siempre y acá se lee.
import * as THREE from 'three';
import { mirada, silueta, acercar } from './mirada.js';
import { VENA_MUTADO } from './desafio-noche2.js';
import { TIPOS_ALIEN } from './desafio-reglas.js';
import { armarDuende, armarLechuza, DUENDES, HUESO, N_HUESOS, mallaNido, mallaMadriguera } from './duendes-modelo.js';
import { materialGente } from './gente-cuerpo.js';
import { ETAPAS } from './desafio-duendes-reglas.js';

const H = HUESO;
// El detalle de cerca y de lejos, y desde dónde se usa el de lejos (con un margen para no titilar).
export const DETALLE_CERCA = 0.56, DETALLE_LEJOS = 0.26;
export const DISTANCIA_LOD = 12;
const MARGEN_LOD = 3;
// cuánto del alto del invasor llena el duende (con el gorro): un poco menos, la punta cae
const LLENA = 0.98;
const LOOKS = { rastreador: 2 };

// ---------------------------------------------------------------- el material (uno para todos)
const GLSL_RUIDO = `
  float azarD(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float ruidoD(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(azarD(i), azarD(i + vec3(1,0,0)), f.x), mix(azarD(i + vec3(0,1,0)), azarD(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(azarD(i + vec3(0,0,1)), azarD(i + vec3(1,0,1)), f.x), mix(azarD(i + vec3(0,1,1)), azarD(i + vec3(1,1,1)), f.x), f.y), f.z);
  }`;
let MAT = null;
const U = { uHuesos: { value: null }, uTiempoD: { value: 0 } };
function materialDuendes() {
  if (MAT) return MAT;
  const gente = materialGente();
  MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
  MAT.onBeforeCompile = (sh) => {
    // primero el de la gente (el atlas: telas, guardas, la piel pintada), después lo de los duendes
    gente.onBeforeCompile(sh);
    sh.uniforms.uHuesos = U.uHuesos; sh.uniforms.uTiempoD = U.uTiempoD;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aHuesoParte; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC;
        uniform sampler2D uHuesos;
        varying float vParteD; varying vec3 vObjD; varying vec4 vIA; varying vec4 vIB; varying vec4 vIC;
        mat4 huesoD(float h) {
          int x = int(h + 0.5) * 4, y = int(iA.x + 0.5);
          return mat4(texelFetch(uHuesos, ivec2(x, y), 0), texelFetch(uHuesos, ivec2(x + 1, y), 0), texelFetch(uHuesos, ivec2(x + 2, y), 0), texelFetch(uHuesos, ivec2(x + 3, y), 0));
        }`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float parteD = floor(aHuesoParte / 32.0 + 0.001);
        mat4 mHuesoD = huesoD(aHuesoParte - parteD * 32.0);
        objectNormal = normalize(mat3(mHuesoD) * objectNormal);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vObjD = position; vParteD = parteD; vIA = iA; vIB = iB; vIC = iC;
        // el botín sólo se ve mientras lo lleva (iC.w: 1 = robando, 2 = mutado)
        if (parteD > 2.5 && parteD < 3.5 && mod(iC.w, 2.0) < 0.5) transformed = vec3(0.0);
        transformed = (mHuesoD * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTiempoD;
        varying float vParteD; varying vec3 vObjD; varying vec4 vIA; varying vec4 vIB; varying vec4 vIC;
        ${GLSL_RUIDO}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        // al caer se deshace en hojas que se queman (vIA.z: cuánto)
        float nDisD = ruidoD(vObjD * 11.0) * 0.7 + ruidoD(vObjD * 31.0) * 0.3;
        if (nDisD < vIA.z) discard;
        float bordeDisD = vIA.z > 0.001 ? 1.0 - smoothstep(vIA.z, vIA.z + 0.07, nDisD) : 0.0;`)
      .replace('#include <opaque_fragment>', `
        vec3 VdD = normalize(vViewPosition);
        // el borde de los que aprendieron (vIC.rgb: el color de la costra; negro = nada)
        outgoingLight += vIC.rgb * pow(1.0 - saturate(dot(normal, VdD)), 3.0) * (0.25 + vIA.w * 0.35);
        // de lejos y de noche el cuerpo se apaga: lo primero que se ve de un duende son los ojos
        outgoingLight *= 1.0 - vIB.y * 0.72;
        // los brillos (ojos, hongos de luz, el punto débil): luz propia, del color del vértice
        if (vParteD > 0.5 && (vParteD < 2.5 || vParteD > 3.5)) {
          float ojoD = step(1.5, vParteD) * step(vParteD, 2.5);
          float debilD = step(3.5, vParteD);
          float mutD = step(1.5, vIC.w);
          float kD = 0.3 + 0.7 * vIA.w;
          kD += ojoD * vIB.x * 1.6;
          kD += debilD * vIB.w * (0.6 + 0.5 * sin(uTiempoD * 3.1));
          vec3 colD = mix(vColor.rgb, vec3(1.0, 0.35, 0.16) * 2.6, ojoD * mutD);
          outgoingLight = mix(outgoingLight, colD * kD, 0.88);
          // la linterna: los ojos devuelven la luz (como los de un zorro en la ruta)
          outgoingLight += mix(colD, vec3(1.0, 0.96, 0.74), 0.55) * vIB.z * ojoD * 2.2;
        }
        outgoingLight = mix(outgoingLight, vec3(1.0, 1.0, 0.95), vIA.y * 0.65);
        outgoingLight += vec3(0.95, 0.72, 0.3) * bordeDisD * 2.2;
        #include <opaque_fragment>`);
  };
  MAT.customProgramCacheKey = () => 'duendes-esqueleto-38';
  return MAT;
}

// ---------------------------------------------------------------- los huesos de todos (una textura)
const ANCHO = N_HUESOS * 4;
let filas = 0, datos = null, tex = null, usadas = 0;
function crecerTextura(min) {
  let n = filas || 32;
  while (n < min) n *= 2;
  if (n === filas) return;
  const nuevo = new Float32Array(ANCHO * n * 4);
  if (datos) nuevo.set(datos);
  datos = nuevo; filas = n;
  const viejo = tex;
  tex = new THREE.DataTexture(datos, ANCHO, n, THREE.RGBAFormat, 1015 /* FloatType */);
  tex.magFilter = tex.minFilter = 1003;   // NearestFilter (el three local no trae la constante)
  tex.needsUpdate = true;
  U.uHuesos.value = tex;
  if (viejo) viejo.dispose();
}
function tomarFila() { if (usadas >= filas) crecerTextura(usadas + 1); return usadas++; }

// ---------------------------------------------------------------- los modelos (cacheados)
// clave: tipo|viejo|look|lejos → { geo, reposo, ojos, k, malla (InstancedMesh) }
const MODELOS = new Map();
const sv = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function modelo(tipo, viejo, look, lejos) {
  const clave = `${tipo}|${viejo ? 1 : 0}|${look}|${lejos ? 1 : 0}`;
  let m = MODELOS.get(clave);
  if (m) return m;
  const spec = (DUENDES[tipo] || DUENDES.rastreador)(look);
  const P = viejo ? spec.viejo : spec.travieso;
  const det = lejos ? DETALLE_LEJOS : DETALLE_CERCA;
  const semilla = 11 + look * 7 + (viejo ? 3 : 0);
  const r = tipo === 'volador' ? armarLechuza(P, semilla, det) : armarDuende(P, semilla, det);
  const def = TIPOS_ALIEN[tipo] || TIPOS_ALIEN.rastreador;
  // la escala: el de cerca manda (el de lejos usa la misma, así no salta al cambiar)
  const cerca = lejos ? modelo(tipo, viejo, look, false) : null;
  const k = cerca ? cerca.k : tipo === 'volador' ? 1.05 : (def.altura * LLENA) / r.alto;
  const colorOjos = new THREE.Color(tipo === 'volador' ? '#ffa020' : P.ojos.brillo);
  m = { clave, tipo, geo: r.geo, reposo: r.reposo, padres: r.padres, ojos: r.ojos, k, lejos, malla: null, n: 0, colorOjos };
  MODELOS.set(clave, m);
  return m;
}
export function lookDe(tipo, i) { return (i | 0) % (LOOKS[tipo] || 1); }

// ---------------------------------------------------------------- lo que se dibuja
let raiz = null, escenaD = null;
const todos = [];
let sombras = null, halos = null, haloPos = null, haloCol = null, haloTam = 0;
const MAX_HALOS = 512;
const fijos = new Set();   // nidos y madrigueras con halos
const geoSombra = new THREE.CircleGeometry(0.55, 18).rotateX(-Math.PI / 2);
const matSombra = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
let MAX_SOMBRAS = 64;
function texHalo() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
// Se llama una vez, con la escena (después de que el Desafío anotó lo que es "del valle": adentro del
// Coihue lo del valle se esconde, los duendes no).
export function instalarDuendes(escena) {
  if (raiz && escenaD === escena) return raiz;
  escenaD = escena;
  raiz = new THREE.Group();
  raiz.name = 'duendes';
  escena.add(raiz);
  crecerTextura(32);
  sombras = new THREE.InstancedMesh(geoSombra, matSombra, MAX_SOMBRAS);
  sombras.frustumCulled = false; sombras.renderOrder = -1; sombras.count = 0;
  raiz.add(sombras);
  const gh = new THREE.BufferGeometry();
  haloPos = new Float32Array(MAX_HALOS * 3); haloCol = new Float32Array(MAX_HALOS * 3);
  gh.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
  gh.setAttribute('color', new THREE.BufferAttribute(haloCol, 3));
  halos = new THREE.Points(gh, new THREE.PointsMaterial({ size: 0.42, map: texHalo(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false }));
  halos.frustumCulled = false; halos.renderOrder = 5;
  raiz.add(halos);
  const antes = escena.onBeforeRender;
  escena.onBeforeRender = function (renderer, sc, cam, rt) {
    try { volcar(cam); } catch (e) { console.warn('duendes:', e && e.message); }
    return antes.call(this, renderer, sc, cam, rt);
  };
  return raiz;
}
// el InstancedMesh de un modelo (se crea la primera vez; crece de a 8)
function mallaDe(m, cuantos) {
  if (m.malla && m.malla.instanceMatrix.count >= cuantos) return m.malla;
  const cap = Math.max(8, Math.ceil(cuantos / 8) * 8);
  if (m.malla) { raiz.remove(m.malla); m.malla.dispose(); }
  const g = m.geo;
  for (const [n, k] of [['iA', 4], ['iB', 4], ['iC', 4]]) g.setAttribute(n, new THREE.InstancedBufferAttribute(new Float32Array(cap * k), k));
  const im = new THREE.InstancedMesh(g, materialDuendes(), cap);
  im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; im.count = 0;
  im.instanceMatrix.setUsage(35048);   // DynamicDrawUsage (el three local no trae la constante)
  im.name = 'duendes:' + m.clave;
  raiz.add(im);
  m.malla = im;
  return im;
}
const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _col = new THREE.Color();
function visibleEnEscena(o) {
  for (let x = o; x; x = x.parent) { if (!x.visible) return false; if (x === escenaD) return true; }
  return false;
}
// Antes de cada dibujo: cada duende visible a su modelo, con su esqueleto y sus valores.
let ultimoT = 0;
function volcar(cam) {
  if (!raiz) return;
  if (precompilar && ++cuadros > 20) { raiz.remove(precompilar); precompilar = null; }
  const ahora = performance.now();
  U.uTiempoD.value += Math.min(0.1, Math.max(0, (ahora - (ultimoT || ahora)) / 1000));
  ultimoT = ahora;
  for (const m of MODELOS.values()) m.n = 0;
  let ns = 0, nh = 0, hayNoche = 0;
  const ms = sombras.instanceMatrix.array;
  // cuántos de cada modelo (para agrandar las mallas antes de escribir)
  for (const d of todos) d._dibujar = d.g.parent && visibleEnEscena(d.g) && d.malla.visible;
  for (const d of todos) if (d._dibujar) d._mod = d.modeloActual(), d._mod.n++;
  for (const m of MODELOS.values()) { if (m.n) mallaDe(m, m.n); m.n = 0; }
  for (const d of todos) {
    const ves = d.g.parent && visibleEnEscena(d.g);
    if (!ves) continue;
    d.malla.updateWorldMatrix(true, false);
    // la sombra de mancha (no la del que vuela, ni la del que se deshace)
    if (d.conSombra() && ns < MAX_SOMBRAS) {
      const e = d.g.matrixWorld.elements;
      _m.makeScale(d.escSombra, 1, d.escSombra).setPosition(e[12], e[13] + 0.04, e[14]);
      _m.toArray(ms, ns * 16); ns++;
    }
    if (!d._dibujar) continue;
    const m = d._mod, im = m.malla, i = m.n++;
    im.setMatrixAt(i, d.malla.matrixWorld);
    d.volcarHuesos(m);
    const g = m.geo, A = g.attributes.iA.array, B = g.attributes.iB.array, C = g.attributes.iC.array;
    const u = d.u;
    A[i * 4] = d.fila; A[i * 4 + 1] = u.uFlash.value; A[i * 4 + 2] = u.uDisolver.value; A[i * 4 + 3] = u.uOjos.value;
    B[i * 4] = u.uMirada.value; B[i * 4 + 1] = u.uSilueta.value; B[i * 4 + 2] = u.uReflejo.value; B[i * 4 + 3] = u.uDebil.value;
    const b = u.uBorde.value;
    C[i * 4] = b.r; C[i * 4 + 1] = b.g; C[i * 4 + 2] = b.b; C[i * 4 + 3] = (d.robando ? 1 : 0) + (d.mutado ? 2 : 0);
    // los halos de los ojos (de noche)
    const ojos = u.uOjos.value;
    if (ojos > 0.45 && u.uDisolver.value < 0.3 && nh < MAX_HALOS - 2) {
      hayNoche = 1;
      const kk = (ojos - 0.4) * (0.35 + u.uMirada.value * 0.8) * (1 - u.uSilueta.value * 0.3) * d.halo;
      _col.copy(d.mutado ? COL_MUTADO : m.colorOjos || COL_OJO);
      for (const o of m.ojos) {
        _v.copy(o).applyMatrix4(d.matrizOjo(m)).applyMatrix4(d.malla.matrixWorld);
        haloPos[nh * 3] = _v.x; haloPos[nh * 3 + 1] = _v.y; haloPos[nh * 3 + 2] = _v.z;
        haloCol[nh * 3] = _col.r * kk; haloCol[nh * 3 + 1] = _col.g * kk; haloCol[nh * 3 + 2] = _col.b * kk;
        nh++;
      }
    }
  }
  // los halos de lo fijo (nidos, madrigueras)
  for (const o of fijos) {
    if (!visibleEnEscena(o)) continue;
    o.updateWorldMatrix(true, false);
    for (const h of o.userData.halos || []) {
      if (nh >= MAX_HALOS) break;
      _v.copy(h.p).applyMatrix4(o.matrixWorld);
      const c = h._c || (h._c = new THREE.Color(h.col)), kk = 0.55 * (h.tam || 1) * (o.userData.brilloHalos ?? 1);
      haloPos[nh * 3] = _v.x; haloPos[nh * 3 + 1] = _v.y; haloPos[nh * 3 + 2] = _v.z;
      haloCol[nh * 3] = c.r * kk; haloCol[nh * 3 + 1] = c.g * kk; haloCol[nh * 3 + 2] = c.b * kk;
      nh++;
    }
  }
  let alguno = false;
  for (const m of MODELOS.values()) {
    if (!m.malla) continue;
    m.malla.count = m.n;
    m.malla.visible = m.n > 0;
    if (m.n) {
      alguno = true;
      m.malla.instanceMatrix.needsUpdate = true;
      const g = m.geo;
      g.attributes.iA.needsUpdate = g.attributes.iB.needsUpdate = g.attributes.iC.needsUpdate = true;
    }
  }
  if (alguno) tex.needsUpdate = true;
  sombras.count = ns; sombras.visible = ns > 0;
  if (ns) sombras.instanceMatrix.needsUpdate = true;
  // (siempre al menos un punto mientras haya duendes: así el programa de los halos se compila en la
  // carga, con los precalentados, y no la primera noche)
  if (!nh && alguno) { haloPos[0] = haloPos[1] = haloPos[2] = 0; haloCol[0] = haloCol[1] = haloCol[2] = 0; nh = 1; }
  halos.geometry.setDrawRange(0, nh);
  halos.visible = nh > 0;
  if (nh) { halos.geometry.attributes.position.needsUpdate = true; halos.geometry.attributes.color.needsUpdate = true; }
  void hayNoche;
}
// 3.8.0: el borde de siempre: un filo frío, de luna, para que de noche se lea la silueta (los que
// aprendieron lo cambian por el color de su costra)
const BORDE_LUNA = '#3a4656';
const COL_OJO = new THREE.Color('#d8ff6a'), COL_MUTADO = new THREE.Color(VENA_MUTADO);

// ---------------------------------------------------------------- el duende
const ESC_SOMBRA = { bruto: 1.5, jefe: 2.4, escupidor: 1.15, saltador: 0.8 };
const PIERNAS = [[H.musloI, H.rodillaI, H.tobilloI, 1], [H.musloD, H.rodillaD, H.tobilloD, -1]];
const BRAZOS = [[H.hombroI, H.codoI, 1], [H.hombroD, H.codoD, -1]];
const _mirada = { dif: 0, distancia: 0, noche: 0, ataca: false };
let cuentaLooks = {};

export function crearDuende(tipo) {
  if (!TIPOS_ALIEN[tipo]) tipo = 'rastreador';
  const look = lookDe(tipo, cuentaLooks[tipo] = (cuentaLooks[tipo] || 0) + 1);
  const g = new THREE.Group();
  // el "cuerpo" del duende (lo que mueve la escala del modelo y el crecer): no se dibuja acá, se
  // dibuja instanciado; su `visible` sigue sirviendo (el jefe sombra, el que cava)
  const malla = new THREE.Object3D();
  malla.name = 'duende';
  g.add(malla);
  // el esqueleto: los huesos en la jerarquía de la gente, en el reposo del modelo
  const B = Array.from({ length: N_HUESOS }, () => new THREE.Object3D());
  const raizEsq = B[H.montura];
  const inversas = Array.from({ length: N_HUESOS }, () => new THREE.Matrix4());
  const skin = Array.from({ length: N_HUESOS }, () => new THREE.Matrix4());
  let reposoAct = null;
  function armarEsqueleto(m) {
    if (reposoAct === m.reposo) return;
    reposoAct = m.reposo;
    for (let i = 0; i < N_HUESOS; i++) {
      const p = m.padres[i];
      if (p >= 0 && B[i].parent !== B[p]) B[p].add(B[i]);
      const r = m.reposo[i], rp = p >= 0 ? m.reposo[p] : null;
      B[i].position.set(r.x - (rp ? rp.x : 0), r.y - (rp ? rp.y : 0), r.z - (rp ? rp.z : 0));
      B[i].userData.reposo = B[i].position.clone();
      B[i].rotation.set(0, 0, 0);
      inversas[i].makeTranslation(-r.x, -r.y, -r.z);
    }
    raizEsq.updateMatrixWorld(true);
  }
  const fila = tomarFila();
  const P = TIPOS_ALIEN[tipo];
  const u = {
    uFlash: { value: 0 }, uDisolver: { value: 0 }, uOjos: { value: 0.3 }, uMirada: { value: 0 }, uSilueta: { value: 0 }, uReflejo: { value: 0 },
    uDebil: { value: P.puntoDebil ? 1 : 0 }, uTiempo: { value: Math.random() * 50 },
    uBorde: { value: new THREE.Color(BORDE_LUNA) }, uVena: { value: new THREE.Color('#9aff6a') }, uOjoColor: { value: new THREE.Color('#d8ff6a') },
  };
  const venaNormal = u.uVena.value.clone(), venaMutada = new THREE.Color(VENA_MUTADO);
  const st = { viejo: tipo === 'bruto' || tipo === 'jefe', etapa: 1, lejos: false };
  let mutado = false;
  const pose = { fase: Math.random() * 10, respiro: Math.random() * 6, tic: 0, ticX: 0, ticY: 0, risa: 0, golpeDebil: 0, gorro: 0, faseAla: 0, robaRisa: 0 };
  const modeloActual = () => modelo(tipo, st.viejo, look, st.lejos);
  function vestir() {
    const m = modelo(tipo, st.viejo, look, false);
    modelo(tipo, st.viejo, look, true);
    armarEsqueleto(m);
    malla.scale.setScalar(m.k * (tipo === 'volador' ? 1 : ETAPAS[st.etapa]?.escala || 1));
  }
  vestir();
  const d = {
    g, malla, u, fila, tipo, robando: false,
    get mutado() { return mutado; },
    halo: 1, escSombra: ESC_SOMBRA[tipo] || 1,
    modeloActual,
    conSombra: () => tipo !== 'volador' && u.uDisolver.value < 0.5,
    volcarHuesos(m) {
      // la fila de este duende: (hueso · inversa de reposo), 4 texeles por hueso
      armarEsqueleto(modelo(tipo, st.viejo, look, false));
      const o = fila * ANCHO * 4;
      for (let i = 0; i < N_HUESOS; i++) {
        skin[i].multiplyMatrices(B[i].matrixWorld, inversas[i]);
        skin[i].toArray(datos, o + i * 16);
      }
      void m;
    },
    matrizOjo(m) { return m.tipo === 'volador' ? skin[H.montura] : skin[H.cabeza]; },
  };
  d.halo = tipo === 'volador' ? 0.8 : st.viejo ? 1.2 : 0.8;
  todos.push(d);

  function rot(i, x = 0, y = 0, z = 0) { B[i].rotation.set(x, y, z); }
  function reposoPos(i) { B[i].position.copy(B[i].userData.reposo); }

  function detalle(distancia) {
    const quiere = st.lejos ? distancia > DISTANCIA_LOD - MARGEN_LOD : distancia > DISTANCIA_LOD + MARGEN_LOD;
    st.lejos = quiere;
    return st.lejos;
  }

  // ---- una pose por cuadro, a partir de lo que está haciendo
  function animar(e) {
    const dt = e.dt || 0;
    pose.fase += dt;
    pose.respiro += dt * (e.noche ? 1.4 : 1);
    u.uTiempo.value += dt;
    u.uOjos.value = 0.15 + (e.noche || 0) * 0.85;
    u.uReflejo.value += ((e.reflejo || 0) - u.uReflejo.value) * Math.min(1, dt * 14);
    if (e.jugador) {
      const dx = e.jugador.x - g.position.x, dz = e.jugador.z - g.position.z;
      const dist = Math.hypot(dx, dz);
      _mirada.dif = Math.atan2(dx, dz) - g.rotation.y; _mirada.distancia = dist; _mirada.noche = e.noche; _mirada.ataca = e.ataca;
      u.uMirada.value = acercar(u.uMirada.value, mirada(_mirada), dt);
      u.uSilueta.value = silueta(dist, e.noche);
    }
    pose.golpeDebil = Math.max(0, pose.golpeDebil - dt * 2);
    if (P.puntoDebil) u.uDebil.value = 1 + pose.golpeDebil * 2.2;
    pose.risa = Math.max(0, pose.risa - dt);
    for (let i = 0; i < N_HUESOS; i++) { B[i].rotation.set(0, 0, 0); reposoPos(i); }
    if (tipo === 'volador') return animarJinete(e, dt);
    const viejo = st.viejo;
    const vel = Math.max(0, e.velocidad || 0);
    const anda = vel > 0.2;
    const carrera = (e.carrera || d.robando) && anda;
    // los viejos van más pesados; los traviesos a los saltitos
    const cad = viejo ? 1.35 + vel * 0.9 : 2.2 + vel * (carrera ? 1.6 : 1.9);
    pose.paso = (pose.paso || 0) + dt * cad;
    const t = pose.paso, s1 = Math.sin(t), c1 = Math.cos(t);
    const amp = anda ? Math.min(1, 0.4 + vel * 0.15) : 0;
    const respiro = Math.sin(pose.respiro * 1.3) * 0.03;
    const golpe = e.golpe || 0;
    // la pelvis: el saltito del travieso y el bamboleo del viejo
    const yb = B[H.pelvis].userData.reposo.y;
    B[H.pelvis].position.y = yb + (anda ? (viejo ? Math.abs(c1) * 0.02 : Math.abs(s1) * (carrera ? 0.07 : 0.045)) * amp : 0) - (e.agazapado ? yb * 0.28 : 0);
    rot(H.pelvis, 0, s1 * (viejo ? 0.08 : 0.14) * amp, (viejo ? s1 * 0.07 : 0) * amp);
    // el torso
    const lean = carrera ? 0.38 : e.ataca ? 0.18 : e.agazapado ? 0.5 : anda ? 0.1 : 0;
    rot(H.pecho, lean + respiro - golpe * 0.2 + (e.apuntando ? -0.1 : 0), -s1 * 0.16 * amp, viejo ? Math.sin(pose.respiro * 0.7) * 0.04 : 0);
    // la cabeza: el travieso mira para todos lados (pícaro); el viejo cuelga la cabeza y te busca
    pose.tic -= dt;
    if (pose.tic <= 0) { pose.tic = (viejo ? 1.4 : 0.5) + Math.random() * (viejo ? 3 : 2); pose.ticX = (Math.random() - 0.5) * (viejo ? 0.6 : 1.1); pose.ticY = (Math.random() - 0.5) * 0.4; }
    pose.cx = (pose.cx || 0) + (pose.ticX - (pose.cx || 0)) * Math.min(1, dt * (viejo ? 3 : 8));
    const quieto = e.ataca || carrera;
    const risa = pose.risa > 0 ? Math.sin((1 - pose.risa / 0.9) * Math.PI) : 0;
    // el que roba se ríe a carcajadas mientras corre
    if (d.robando) { pose.robaRisa -= dt; if (pose.robaRisa <= 0) { pose.robaRisa = 1.2 + Math.random(); pose.risa = 0.9; } }
    rot(H.cabeza, -lean * 0.75 + (quieto ? 0 : pose.ticY * 0.5) - risa * 0.45 + (anda ? c1 * 0.04 : 0) + (viejo ? 0.12 : 0), quieto ? 0 : pose.cx, (quieto ? 0 : pose.cx * 0.25) + risa * Math.sin(pose.fase * 26) * 0.08);
    rot(H.mandibula, Math.max(risa * 0.5 * (0.6 + 0.4 * Math.abs(Math.sin(pose.fase * 22))), golpe * 0.35, e.ataca ? 0.12 + Math.sin(pose.fase * 9) * 0.06 : 0));
    // la punta del gorro: se queda atrás al correr y rebota
    pose.gorro += ((carrera ? 0.5 : anda ? 0.22 : 0) - pose.gorro) * Math.min(1, dt * 4);
    rot(H.gorro, pose.gorro * 0.6 + Math.sin(t * 2) * 0.1 * amp, 0, Math.sin(t) * 0.12 * amp + Math.sin(pose.respiro) * 0.03);
    // las piernas (rodillas de persona: la canilla dobla para atrás)
    const zanc = carrera ? 0.85 : viejo ? 0.42 : 0.6;
    for (const [hm, hr, ht, s] of PIERNAS) {
      const f = s * s1, fc = s * c1;
      let m = -f * zanc * amp, r = (0.08 + Math.max(0, fc) * (carrera ? 1.3 : 0.9)) * amp, a = -r * 0.45 + f * 0.15 * amp;
      if (e.agazapado) { m = -0.95; r = 1.55; a = -0.6; }
      rot(hm, m, 0, 0); rot(hr, r); rot(ht, a);
    }
    // los brazos
    for (const [hh, hc, s] of BRAZOS) {
      let x = s * s1 * (viejo ? 0.35 : 0.6) * amp + Math.sin(pose.respiro + s) * 0.04, z = 0, c = -0.18 - Math.abs(s1) * 0.25 * amp;
      if (carrera) { x = s * s1 * 0.9; c = -1.25; }
      if (viejo && !carrera) { x -= 0.25; c -= 0.15; }
      // el pillo que se lleva algo lo lleva en alto (la mano izquierda)
      if (d.robando && s > 0) { x = -2.5 + Math.sin(pose.fase * 9) * 0.15; c = -0.35; z = 0.25; }
      if ((golpe > 0 || e.ataca) && s < 0) { x = -2.1 * golpe - (e.ataca ? 0.7 : 0) - 0.2; c = -0.5 + golpe * 0.4; z = 0.15; }
      else if (golpe > 0 && s > 0 && (tipo === 'bruto' || tipo === 'jefe')) { x = -1.6 * golpe - 0.3; c = -0.6; }
      if (e.apuntando && s < 0) { x = -2.7; z = 0.2; c = -0.4 + Math.sin(pose.fase * 15) * 0.6; }
      if (e.agazapado && !e.ataca) { x = -0.75; c = -0.6; }
      if (e.enredado) { x = -2.2 + Math.sin(pose.fase * 11 + s) * 0.5; c = -0.5; z = s * 0.3; }
      rot(hh, x, 0, z * s); rot(hc, c);
    }
    if (e.enredado) for (const [hm, hr] of PIERNAS) { rot(hm, Math.sin(pose.fase * 13) * 0.3); rot(hr, 0.4 + Math.sin(pose.fase * 13 + 1) * 0.3); }
    // en el aire (el saltarín): se hace bolita al despegar y estira las piernas al caer
    if (e.saltando > 0) {
      const k = Math.min(1, e.saltando), rec = Math.sin(k * Math.PI);
      B[H.pelvis].position.y = yb;
      rot(H.pelvis, 0, 0, 0);
      rot(H.pecho, 0.45 - k * 0.3);
      rot(H.cabeza, -0.3);
      for (const [hm, hr, ht] of PIERNAS) { rot(hm, -0.3 - rec * 1.1); rot(hr, 0.2 + rec * 1.6); rot(ht, -0.2 - rec * 0.4); }
      for (const [hh, hc, s] of BRAZOS) { rot(hh, -2.2 - rec * 0.4, 0, s * 0.4); rot(hc, -0.3); }
      rot(H.gorro, -0.4 * rec);
    }
    raizEsq.updateMatrixWorld(true);
  }
  // el jinete de la lechuza: el duende sentado con las riendas y la lechuza que aletea
  function animarJinete(e, dt) {
    const f = pose.faseAla;
    const ala = 0.12 + Math.sin(f) * 0.62;
    rot(H.alaI, 0, 0, ala); rot(H.alaD, 0, 0, -ala);
    B[H.montura].position.y = B[H.montura].userData.reposo.y - Math.sin(f) * 0.04;
    rot(H.montura, Math.cos(f) * 0.04, 0, 0);
    rot(H.pecho, 0.08 + Math.sin(f + 0.6) * 0.05 + (e.golpe || 0) * 0.3);
    const risa = pose.risa > 0 ? Math.sin((1 - pose.risa / 0.9) * Math.PI) : 0;
    rot(H.cabeza, -0.1 - risa * 0.35, Math.sin(pose.fase * 0.7) * 0.4, 0);
    rot(H.mandibula, risa * 0.45);
    rot(H.gorro, 0.5 + Math.sin(f * 2) * 0.12);
    for (const [hh, hc, s] of BRAZOS) rot(hh, -0.15 + Math.sin(f) * 0.06, 0, 0), rot(hc, -0.4);
    if (e.golpe > 0) rot(H.hombroD, -1.8 * e.golpe, 0, 0);
    void dt;
    raizEsq.updateMatrixWorld(true);
  }
  // Se cae: el travieso de espaldas (las patitas al aire), el viejo para adelante.
  function caer(t) {
    const k = Math.min(1, t / 0.7);
    for (let i = 0; i < N_HUESOS; i++) { B[i].rotation.set(0, 0, 0); reposoPos(i); }
    if (tipo === 'volador') {
      rot(H.alaI, 0, 0, -0.9 * k); rot(H.alaD, 0, 0, 0.9 * k); rot(H.montura, 0.7 * k, 0, 0.3 * k);
      rot(H.cabeza, 0.5 * k); rot(H.gorro, 0.8 * k);
      raizEsq.updateMatrixWorld(true);
      return;
    }
    const atras = !st.viejo;
    const yb = B[H.pelvis].userData.reposo.y;
    B[H.pelvis].position.y = yb * (1 - k * 0.7);
    rot(H.pecho, (atras ? -1.05 : 1.2) * k);
    rot(H.cabeza, (atras ? -0.4 : 0.35) * k, 0, 0.4 * k);
    rot(H.mandibula, 0.4 * k);
    rot(H.gorro, (atras ? -0.6 : 0.9) * k);
    for (const [hm, hr] of PIERNAS) { rot(hm, (atras ? -1.5 : -0.9) * k); rot(hr, (atras ? 0.4 : 1.4) * k); }
    for (const [hh, hc, s] of BRAZOS) { rot(hh, (atras ? -2.4 : -0.7) * k, 0, s * 0.5 * k); rot(hc, -0.4 * k); }
    raizEsq.updateMatrixWorld(true);
  }

  raizEsq.updateMatrixWorld(true);
  return {
    g, malla, esc: 1, tipo,
    uniformes: () => u,
    cuerpo: B[H.pecho], cabeza: B[H.cabeza], piernas: [B[H.musloI], B[H.musloD]], brazos: [B[H.hombroI], B[H.hombroD]],
    animar, detalle, caer,
    // 3.8.0: el duende se ríe (era el chillido)
    chillar() { pose.risa = 0.9; },
    flash(v) { u.uFlash.value = v; },
    mutar(si) { mutado = !!si; u.uVena.value.copy(si ? venaMutada : venaNormal); if (si && !st.viejo) { st.viejo = true; vestir(); } },
    get mutado() { return mutado; },
    golpeDebil() { pose.golpeDebil = 1; },
    disolver(v) { u.uDisolver.value = v; },
    // 3.8.0: cómo viene esta vez: de viejo (las noches grandes) o de travieso, y de qué tamaño
    vestir(viejo, etapa = 1) {
      st.viejo = !!viejo || tipo === 'bruto' || tipo === 'jefe';
      st.etapa = Math.max(0, Math.min(ETAPAS.length - 1, etapa | 0));
      d.halo = tipo === 'volador' ? 0.8 : st.viejo ? 1.2 : 0.8;
      vestir();
    },
    get viejo() { return st.viejo; },
    get etapa() { return st.etapa; },
    // 3.8.0: el robo (se ve el botín en la mano y corre riéndose)
    robar(si) { d.robando = !!si; if (si) pose.risa = 0.9; },
    get robando() { return d.robando; },
    // 3.8.0: la lechuza tiene sus alas (no hacen falta las membranas de antes)
    alasPropias: tipo === 'volador',
    aletear(fase) { pose.faseAla = fase; },
    // Los duendes se reciclan de una oleada a la otra: todo lo que quedó de la vida anterior se apaga
    // acá (los ojos encendidos, el destello, la disolución, el robo, el borde, la pinta de viejo).
    reiniciar() {
      u.uDisolver.value = 0; u.uFlash.value = 0; pose.golpeDebil = 0;
      u.uDebil.value = P.puntoDebil ? 1 : 0;
      u.uMirada.value = 0; u.uSilueta.value = 0; u.uReflejo.value = 0;
      mutado = false; u.uVena.value.copy(venaNormal);
      d.robando = false; pose.risa = 0; pose.robaRisa = 0; pose.faseAla = 0;
      st.viejo = tipo === 'bruto' || tipo === 'jefe'; st.etapa = 1; st.lejos = false;
      vestir();
      malla.visible = true;
    },
  };
}

// ---------------------------------------------------------------- precalentar
// Arma todos los modelos de una vez (en la carga del Desafío: si no, el primero de cada uno trabaría
// el juego en plena noche) y el nido y la madriguera.
export function precalentarDuendes() {
  const t0 = performance.now();
  for (const tipo of Object.keys(TIPOS_ALIEN)) {
    for (let look = 0; look < (LOOKS[tipo] || 1); look++) for (const viejo of [false, true]) for (const lejos of [false, true]) {
      const m = modelo(tipo, viejo, look, lejos);
      // la malla instanciada, ya en la escena y visible: la compilación de la carga (compileAsync) la ve
      if (raiz) mallaDe(m, 8).visible = true;
    }
  }
  // el nido, la madriguera y el atadito de lo robado: sus materiales se compilan en la carga (unos
  // cuadros bajo tierra) y sus geometrías quedan armadas
  if (raiz && !precompilar) {
    precompilar = new THREE.Group();
    precompilar.position.set(0, -600, 0);
    const piezas = [mallaNido(), mallaMadriguera('aguja'), mallaMadriguera('generador'), mallaMadriguera('suelo'), mallaAtadito()];
    for (const p of piezas) { p.traverse((o) => { o.frustumCulled = false; }); precompilar.add(p); }
    raiz.add(precompilar);
  }
  return performance.now() - t0;
}
let precompilar = null, cuadros = 0;
// El atadito de lo robado, tirado en el suelo (brilla: se ve de noche y se levanta pasando cerca).
let geoAtado = null, geoSemilla = null, matAtado = null, matSemilla = null;
export function mallaAtadito() {
  if (!geoAtado) {
    geoAtado = new THREE.SphereGeometry(0.16, 10, 8); geoAtado.scale(1, 0.8, 1); geoAtado.translate(0, 0.12, 0);
    geoSemilla = new THREE.SphereGeometry(0.06, 8, 6); geoSemilla.scale(1, 1.3, 1); geoSemilla.translate(0.02, 0.28, 0.04);
    matAtado = new THREE.MeshLambertMaterial({ color: '#c8b48a' });
    matSemilla = new THREE.MeshBasicMaterial({ color: '#ffc840' });
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geoAtado, matAtado), new THREE.Mesh(geoSemilla, matSemilla));
  g.userData.halos = [{ p: new THREE.Vector3(0.02, 0.3, 0.04), col: '#ffc840', tam: 0.8 }];
  g.name = 'atadito';
  return g;
}
// Los nidos y las madrigueras con sus halos (se registran al armarse).
export function registrarHalos(o) { if (o?.userData?.halos?.length) fijos.add(o); }
export function soltarHalos(o) { fijos.delete(o); }
// Para las pruebas y el diagnóstico: los modelos armados y cuántos duendes se dibujan de cada uno.
export function estadoDuendes() {
  const modelos = [];
  for (const m of MODELOS.values()) modelos.push({ clave: m.clave, tri: Math.round((m.geo.index ? m.geo.index.count : m.geo.attributes.position.count) / 3), dibujados: m.malla?.count || 0, k: +m.k.toFixed(3) });
  return { modelos, duendes: todos.length, filas, usadas };
}
void sv;
