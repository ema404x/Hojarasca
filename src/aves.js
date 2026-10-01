// Las aves que se ven de lejos: bandadas que planean alto sobre el valle.
// Son puntos con forma de silueta, así que cuestan un solo dibujo.
import * as THREE from 'three';
import { U } from './materiales.js';

const VERT = /* glsl */`
  attribute float aSemilla;
  attribute float aGrupo;
  uniform float uTiempo;
  uniform vec3 uCentro;
  uniform float uPresupuesto;
  varying float vAleteo;
  varying float vAlfa;
  void main() {
    // cada bandada gira en su propio círculo, a su altura y su velocidad
    float radio = 38.0 + aGrupo * 30.0 + aSemilla * 18.0;
    float vel = 0.055 + aGrupo * 0.018;
    float ang = uTiempo * vel + aSemilla * 6.28 + aGrupo * 2.1;
    float alto = 26.0 + aGrupo * 16.0 + sin(uTiempo * 0.3 + aSemilla * 5.0) * 5.0;
    vec3 p = uCentro + vec3(cos(ang) * radio, alto, sin(ang) * radio);
    // dentro de la bandada, cada una en su lugar
    p.x += sin(aSemilla * 12.0) * 9.0;
    p.z += cos(aSemilla * 9.0) * 9.0;
    p.y += sin(aSemilla * 7.0) * 4.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = length(mv.xyz);
    vAleteo = sin(uTiempo * (2.2 + aSemilla * 1.5) + aSemilla * 10.0) * 0.5 + 0.5;
    float activo = step(aSemilla, clamp(uPresupuesto, 0.0, 1.0));
    vAlfa = smoothstep(340.0, 190.0, dist) * smoothstep(18.0, 40.0, dist) * activo;
    gl_PointSize = (230.0 + aSemilla * 80.0) / max(1.0, dist * 0.42);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */`
  uniform vec3 uCieloBajo;
  varying float vAleteo;
  varying float vAlfa;
  void main() {
    if (vAlfa < 0.01) discard;
    vec2 d = gl_PointCoord - 0.5;
    // silueta de ave: dos alas curvas que suben y bajan al aletear
    float caida = 0.55 + vAleteo * 0.9;
    float ala = abs(d.y + (abs(d.x) - 0.12) * caida * 0.8);
    float dentro = smoothstep(0.075, 0.015, ala) * step(abs(d.x), 0.46) * step(0.02, abs(d.x));
    float cuerpo = smoothstep(0.09, 0.02, length(d * vec2(2.4, 1.0)));
    float forma = clamp(dentro + cuerpo, 0.0, 1.0);
    if (forma < 0.02) discard;
    gl_FragColor = vec4(mix(vec3(0.16, 0.17, 0.2), uCieloBajo * 0.5, 0.35), forma * vAlfa * 0.75);
  }
`;

export function crearAves(escena, calidad) {
  const N = calidad.aves ?? 14;
  if (N <= 0) return { actualizar: () => {}, puntos: null };
  const pos = new Float32Array(N * 3);
  const semilla = new Float32Array(N);
  const grupo = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    semilla[i] = Math.random();
    grupo[i] = i % 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSemilla', new THREE.BufferAttribute(semilla, 1));
  geo.setAttribute('aGrupo', new THREE.BufferAttribute(grupo, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { uTiempo: U.uTiempo, uCentro: { value: new THREE.Vector3() }, uCieloBajo: U.uCieloBajo, uPresupuesto: { value: 1 } },
    transparent: true, depthWrite: false,
  });
  const puntos = new THREE.Points(geo, material);
  puntos.frustumCulled = false;
  escena.add(puntos);

  function actualizar(cam, dia, lluvia, factorPresupuesto = 1) {
    material.uniforms.uCentro.value.set(Math.round(cam.x / 40) * 40, 0, Math.round(cam.z / 40) * 40);
    // planean con luz y buen tiempo: con tormenta se guardan
    material.uniforms.uPresupuesto.value = Math.max(0.65, Math.min(1, factorPresupuesto));
    puntos.visible = dia > 0.25 && lluvia < 0.45;
  }

  return { actualizar, puntos };
}
