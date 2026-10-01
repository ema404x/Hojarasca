// Lo que flota en el aire: hojas que bajan girando en otoño y la pelusa
// que se ve en los rayos de sol. Todo en una sola malla de puntos.
import * as THREE from 'three';
import { U } from './materiales.js';

const VERT = /* glsl */`
  attribute float aTipo;      // 0 = pelusa, 1 = hoja, 2 = brizna/semilla seca
  attribute float aSemilla;
  attribute float aTam;
  uniform float uTiempo;
  uniform float uOtono;
  uniform float uViento;
  uniform float uEstepa;
  uniform float uBosque;
  uniform float uPresupuesto;
  uniform vec3 uCentro;
  varying float vTipo;
  varying float vSemilla;
  varying float vAlfa;
  void main() {
    vTipo = aTipo;
    vSemilla = aSemilla;
    vec3 p = position;
    float seca = step(1.5, aTipo);
    float hoja = step(0.5, aTipo) * (1.0 - seca);
    float caida = seca > 0.5 ? 0.16 + aSemilla * 0.16 : (hoja > 0.5 ? 0.55 + aSemilla * 0.5 : 0.06);
    // cada partícula recorre su caja y vuelve a empezar arriba
    float t = fract(uTiempo * caida * 0.06 + aSemilla);
    p.y = seca > 0.5 ? mix(5.5, -0.4, t) : mix(14.0, -1.0, t);
    float bamboleo = seca > 0.5 ? 0.9 : (hoja > 0.5 ? 1.6 : 0.5);
    float arrastre = seca > 0.5 ? 11.0 : 6.0;
    p.x += sin(uTiempo * (0.5 + aSemilla) + aSemilla * 6.28) * bamboleo + uViento * t * arrastre;
    p.z += cos(uTiempo * (0.4 + aSemilla * 0.8) + aSemilla * 3.14) * bamboleo + seca * sin(uTiempo * 0.17 + aSemilla * 9.0) * uViento * 2.4;
    vec3 mundo = p + uCentro;
    vec4 mv = modelViewMatrix * vec4(mundo, 1.0);
    // se desvanecen al nacer y al morir, y la pelusa solo se ve de cerca
    float vida = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.88, t);
    float dist = length(mv.xyz);
    float cerca = seca > 0.5 ? smoothstep(34.0, 9.0, dist) : (hoja > 0.5 ? smoothstep(42.0, 14.0, dist) : smoothstep(20.0, 5.0, dist));
    float alfaTipo = seca > 0.5 ? uEstepa * (0.25 + smoothstep(0.15, 0.75, uViento) * 0.75) : (hoja > 0.5 ? uOtono * uOtono * (1.0 - uEstepa * 0.7) : 0.85 * (0.45 + uBosque * 0.55));
    float activo = step(aSemilla, clamp(uPresupuesto, 0.0, 1.0));
    vAlfa = vida * cerca * alfaTipo * activo;
    gl_PointSize = aTam * (seca > 0.5 ? 10.0 : (hoja > 0.5 ? 15.0 : 6.0)) / max(1.0, dist * 0.45);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */`
  uniform vec3 uSolColor;
  varying float vTipo;
  varying float vSemilla;
  varying float vAlfa;
  void main() {
    if (vAlfa < 0.01) discard;
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (vTipo > 1.5) {
      // semilla/brizna seca de estepa: fina, dorada y muy liviana
      float forma = smoothstep(0.48, 0.08, abs(d.y) * 0.55 + abs(d.x) * 1.8);
      if (forma < 0.02) discard;
      vec3 col = mix(vec3(0.62, 0.46, 0.20), vec3(0.82, 0.68, 0.34), fract(vSemilla * 5.7));
      gl_FragColor = vec4(col, forma * vAlfa * 0.62);
    } else if (vTipo > 0.5) {
      // hoja: una manchita alargada, ocre o rojiza
      float forma = smoothstep(0.5, 0.12, r + abs(d.x) * 0.5);
      if (forma < 0.02) discard;
      vec3 col = mix(vec3(0.72, 0.42, 0.14), vec3(0.85, 0.66, 0.22), fract(vSemilla * 7.3));
      col = mix(col, vec3(0.55, 0.22, 0.12), step(0.7, fract(vSemilla * 3.1)));
      gl_FragColor = vec4(col, forma * vAlfa * 0.8);
    } else {
      // pelusa: un punto difuso que brilla a contraluz
      float forma = smoothstep(0.5, 0.0, r);
      // apenas por debajo del umbral del brillo: si se pasa, el post la infla
      gl_FragColor = vec4(uSolColor * 0.75 + vec3(0.16), forma * vAlfa * 0.3);
    }
  }
`;

export function crearFlotantes(escena, calidad, T = null) {
  const N = calidad.flotantes ?? 260;
  const pos = new Float32Array(N * 3);
  const tipo = new Float32Array(N);
  const semilla = new Float32Array(N);
  const tam = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() * 2 - 1) * 20;
    pos[i * 3 + 1] = 0;
    pos[i * 3 + 2] = (Math.random() * 2 - 1) * 20;
    tipo[i] = i % 7 === 0 ? 2 : (i % 3 === 0 ? 1 : 0); // algunas briznas secas, hojas y pelusa
    semilla[i] = Math.random();
    tam[i] = 0.6 + Math.random() * 0.8;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aTipo', new THREE.BufferAttribute(tipo, 1));
  geo.setAttribute('aSemilla', new THREE.BufferAttribute(semilla, 1));
  geo.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {
      uTiempo: U.uTiempo, uOtono: U.uOtono, uViento: U.uViento,
      uEstepa: { value: 0 }, uBosque: { value: 0.5 }, uPresupuesto: { value: 1 },
      uSolColor: U.uSolColor, uCentro: { value: new THREE.Vector3() },
    },
    transparent: true, depthWrite: false,
  });
  const puntos = new THREE.Points(geo, material);
  puntos.frustumCulled = false;
  puntos.renderOrder = 7;
  escena.add(puntos);

  function actualizar(cam, dia, bajoTecho, factorPresupuesto = 1) {
    // la caja de partículas sigue al jugador, pegada a la grilla para no arrastrarse
    material.uniforms.uCentro.value.set(Math.round(cam.x / 6) * 6, 0, Math.round(cam.z / 6) * 6);
    if (T) {
      const k = T.indice(cam.x, cam.z);
      material.uniforms.uEstepa.value = Math.max(0, Math.min(1, T.estepa?.[k] || 0));
      material.uniforms.uBosque.value = Math.max(0, Math.min(1, T.bosque?.[k] || 0));
    }
    material.uniforms.uPresupuesto.value = Math.max(0.58, Math.min(1, factorPresupuesto));
    puntos.visible = dia > 0.12 && !bajoTecho;
  }

  return { actualizar, puntos };
}
