// 4.0 (prototipo de agua y cielo): rayos de sol entre los árboles con el sol bajo (alba y hora dorada).
// Son cintas aditivas (una sola malla, un solo dibujo, sin luces ni sombras nuevas) que siguen la dirección del sol y se
// giran hacia vos alrededor de su eje. Nacen sólo donde hay bosque (T.bosque) y se reubican cuando quedan lejos.
// Sólo en calidad media y alta (calidad.post); en baja no se crean.
import * as THREE from 'three';
import { rng } from './ruido.js';
import { U } from './materiales.js';

const CUANTOS = 40;
const RADIO_MIN = 9, RADIO_MAX = 90;

const VERT = `
  uniform vec3 uDirSol;
  attribute vec3 aAncla;     // el pie del rayo, en el suelo
  attribute vec3 aForma;     // ancho, largo, fase
  varying vec2 vUv;
  varying float vFase;
  varying vec3 vMundo;
  void main() {
    vUv = uv;
    vFase = aForma.z;
    vec3 eje = normalize(uDirSol);
    vec3 centro = aAncla + eje * aForma.y * 0.5;
    vec3 haciaCam = cameraPosition - centro;
    vec3 lado = cross(eje, haciaCam);
    float l = length(lado);
    lado = l > 1e-3 ? lado / l : vec3(1.0, 0.0, 0.0);
    // x en -1..1 a lo ancho, y en 0..1 a lo largo (del suelo hacia el sol)
    vec3 p = aAncla + eje * (uv.y * aForma.y) + lado * ((uv.x - 0.5) * 2.0 * aForma.x * (0.6 + 0.7 * uv.y));
    vMundo = p;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = `
  uniform float uFuerza;
  uniform float uTiempo;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying float vFase;
  varying vec3 vMundo;
  void main() {
    // borde blando a los lados, nace en el suelo y se desvanece hacia arriba
    float x = abs(vUv.x * 2.0 - 1.0);
    float lado = 1.0 - smoothstep(0.15, 1.0, x);
    float largo = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.5, 1.0, vUv.y));
    // el polvo en el aire hace que el rayo titile despacito y tenga vetas
    float veta = 0.62 + 0.38 * sin(vUv.x * 11.0 + vFase * 40.0 + uTiempo * 0.22) * sin(vUv.y * 5.0 - uTiempo * 0.15 + vFase * 17.0);
    float respira = 0.78 + 0.22 * sin(uTiempo * 0.35 + vFase * 30.0);
    // ni encima de la cámara ni muy lejos
    float dc = length(vMundo - cameraPosition);
    float cerca = smoothstep(3.0, 16.0, dc);
    float lejos = 1.0 - smoothstep(70.0, 125.0, dc);
    float a = lado * lado * largo * veta * respira * cerca * lejos * uFuerza;
    if (a < 0.002) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

export function crearRayosBosque(T, escena, calidad) {
  if (!calidad.post) return null;
  const r = rng(40404);
  const pos = [], uvs = [], ind = [], ancla = [], forma = [];
  for (let i = 0; i < CUANTOS; i++) {
    const k = i * 4;
    pos.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    const ancho = 1.6 + r() * 3.2, largo = 26 + r() * 22, fase = r();
    for (let v = 0; v < 4; v++) { ancla.push(0, -9999, 0); forma.push(ancho, largo, fase); }
    ind.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aAncla', new THREE.Float32BufferAttribute(ancla, 3));
  geo.setAttribute('aForma', new THREE.Float32BufferAttribute(forma, 3));
  geo.setIndex(ind);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { uDirSol: U.uSolDir, uTiempo: U.uTiempo, uFuerza: { value: 0 }, uColor: { value: new THREE.Color(1.0, 0.72, 0.38) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const malla = new THREE.Mesh(geo, material);
  malla.frustumCulled = false;
  malla.renderOrder = 8;
  malla.visible = false;
  escena.add(malla);

  const aA = geo.attributes.aAncla;
  const sitios = Array.from({ length: CUANTOS }, () => ({ x: 0, z: 0, ok: false }));
  let colocado = false;

  const poner = (i, x, z) => {
    sitios[i].x = x; sitios[i].z = z; sitios[i].ok = true;
    const y = T.altura(x, z);
    for (let v = 0; v < 4; v++) aA.setXYZ(i * 4 + v, x, y - 0.3, z);
  };
  // busca un sitio con bosque en el anillo alrededor de la cámara
  const buscar = (cam) => {
    for (let t = 0; t < 10; t++) {
      const a = r() * Math.PI * 2, d = RADIO_MIN + Math.sqrt(r()) * (RADIO_MAX - RADIO_MIN);
      const x = cam.x + Math.cos(a) * d, z = cam.z + Math.sin(a) * d;
      if (Math.abs(x) > 430 || Math.abs(z) > 430) continue;
      const h = T.altura(x, z);
      if (h < 0.6) continue;   // no sobre el lago
      const b = T.bosque ? T.bosque[T.indice(x, z)] : 0;
      if (b > 0.42) return [x, z];
    }
    return null;
  };

  // `luz`: lo que devuelve cielo.actualizar ({ dia, solDir }); `clima`: clima.estado
  function actualizar(cam, luz, clima, bajoTecho, factor = 1) {
    const y = luz && luz.solDir ? luz.solDir.y : -1;
    // sol bajo: a partir de unos 6° y hasta unos 40° (al mediodía no hay rayos)
    const sube = Math.min(1, Math.max(0, (y - 0.05) / 0.09));
    const baja = 1 - Math.min(1, Math.max(0, (y - 0.36) / 0.34));
    const nubes = (1 - clima.nublado * 0.8) * (1 - clima.lluvia * 0.9);
    const fuerza = sube * baja * nubes * (luz ? luz.dia : 0) * factor * (bajoTecho ? 0 : 1);
    material.uniforms.uFuerza.value = fuerza * 0.7;
    malla.visible = fuerza > 0.02;
    if (!malla.visible) return;
    // el color: naranja con el sol casi en el horizonte, dorado más arriba
    material.uniforms.uColor.value.setRGB(1.0, 0.56 + 0.26 * Math.min(1, y / 0.4), 0.2 + 0.22 * Math.min(1, y / 0.4));
    let cambio = false;
    for (let i = 0; i < CUANTOS; i++) {
      const s = sitios[i];
      const lejos = !s.ok || (s.x - cam.x) * (s.x - cam.x) + (s.z - cam.z) * (s.z - cam.z) > RADIO_MAX * RADIO_MAX * 1.2;
      if (!lejos) continue;
      const p = buscar(cam);
      if (p) { poner(i, p[0], p[1]); cambio = true; }
      else if (s.ok && !colocado) { /* nada */ }
    }
    if (cambio) { aA.needsUpdate = true; colocado = true; }
  }
  return { actualizar, malla };
}
