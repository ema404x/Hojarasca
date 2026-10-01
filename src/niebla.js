// La bruma que se acuesta sobre el lago y el mallín en las primeras horas
// y se quema cuando sube el sol.
import * as THREE from 'three';
import { rng } from './ruido.js';
import { U } from './materiales.js';
import { perfilHabitatPatagonico } from './patagonia.js';

const VERT = `
  uniform float uTiempo;
  uniform float uRafaga;
  attribute float aFase;
  varying vec2 vUv;
  varying float vFase;
  void main() {
    vUv = uv;
    vFase = aFase;
    vec3 p = position;
    // la bruma se desplaza despacio y respira
    vec4 mundo = modelMatrix * vec4(p, 1.0);
    mundo.x += sin(uTiempo * 0.06 + aFase * 6.28) * (6.0 + uRafaga * 2.5);
    mundo.z += cos(uTiempo * 0.05 + aFase * 4.71) * (6.0 + uRafaga * 1.8);
    mundo.y += sin(uTiempo * 0.11 + aFase * 3.14) * 0.35;
    gl_Position = projectionMatrix * viewMatrix * mundo;
  }
`;

const FRAG = `
  uniform float uOpacidad;
  uniform vec3 uColor;
  uniform float uTiempo;
  varying vec2 vUv;
  varying float vFase;
  void main() {
    // mancha suave, con el borde deshilachado
    vec2 d = vUv - 0.5;
    float r = length(d) * 2.0;
    float borde = 1.0 - smoothstep(0.35, 1.0, r);
    float ondas = 0.75 + 0.25 * sin(vUv.x * 9.0 + uTiempo * 0.25 + vFase * 6.0) * sin(vUv.y * 7.0 - uTiempo * 0.2);
    float a = borde * ondas * uOpacidad;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

export function crearNiebla(T, escena, calidad) {
  const r = rng(3131);
  const cantidad = calidad.niebla > 1.2 ? 26 : 46;
  const pos = [], uvs = [], ind = [], fases = [];
  let k = 0;
  const poner = (x, z, y, ancho, alto) => {
    // cada jirón es un plano horizontal, apenas inclinado
    const a = ancho / 2, b = alto / 2;
    const gir = r() * Math.PI;
    const c = Math.cos(gir), s = Math.sin(gir);
    const esquinas = [[-a, -b], [a, -b], [a, b], [-a, b]];
    for (const [ex, ez] of esquinas) pos.push(x + ex * c - ez * s, y, z + ex * s + ez * c);
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    const f = r();
    for (let i = 0; i < 4; i++) fases.push(f);
    ind.push(k, k + 1, k + 2, k, k + 2, k + 3);
    k += 4;
  };

  // sobre el lago
  for (let i = 0; i < cantidad; i++) {
    const ang = r() * Math.PI * 2, rad = Math.sqrt(r()) * T.radioLago(ang) * 0.95;
    const x = 150 + Math.cos(ang) * rad, z = 110 + Math.sin(ang) * rad;
    poner(x, z, 0.5 + r() * 1.6, 34 + r() * 40, 28 + r() * 36);
  }
  // sobre el mallín y el arroyo
  for (let i = 0; i < cantidad; i++) {
    let x = 0, z = 0, intentos = 0;
    do {
      const p = T.rio[Math.floor(r() * T.rio.length)];
      x = p.x + (r() - 0.5) * 60; z = p.z + (r() - 0.5) * 60;
      intentos++;
    } while (intentos < 6 && (Math.abs(x) > 430 || Math.abs(z) > 430));
    const y = T.altura(x, z);
    if (y < 0.4) continue;
    poner(x, z, y + 0.6 + r() * 1.8, 26 + r() * 34, 22 + r() * 30);
  }

  // RC18: bolsillos de niebla baja específicamente alrededor del mallín.
  // Son pocos y anchos: sugieren aire frío/húmedo acumulado sin llenar todo el valle.
  const mallin = T.lugares?.mallin;
  if (mallin) {
    const extra = Math.max(6, Math.floor(cantidad * 0.35));
    for (let i = 0; i < extra; i++) {
      const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * (18 + r() * 34);
      const x = mallin.x + Math.cos(a) * rr, z = mallin.z + Math.sin(a) * rr;
      const y = T.altura(x, z);
      if (Math.abs(x) > 430 || Math.abs(z) > 430 || y < 0.15) continue;
      poner(x, z, y + 0.28 + r() * 0.85, 24 + r() * 30, 18 + r() * 24);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aFase', new THREE.Float32BufferAttribute(fases, 1));
  geo.setIndex(ind);
  geo.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { uTiempo: U.uTiempo, uRafaga: { value: 0 }, uOpacidad: { value: 0 }, uColor: { value: new THREE.Color('#e8eef2') } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const malla = new THREE.Mesh(geo, material);
  malla.renderOrder = 6;
  malla.frustumCulled = false;
  escena.add(malla);

  function actualizar(horas, clima, invierno, cam = null) {
    // más densa al amanecer, cuando el aire está quieto; se quema con el sol
    const amanecer = Math.exp(-Math.pow((horas - 7.4) / 1.5, 2));
    const anochecer = Math.exp(-Math.pow((horas - 20.2) / 1.1, 2)) * 0.5;
    const quieto = 1 - Math.min(1, clima.viento * 1.05);
    const humedo = 0.55 + clima.nublado * 0.5;
    let humedadLocal = 0.35;
    if (cam) {
      const p = perfilHabitatPatagonico(T, cam.x, cam.z);
      humedadLocal = Math.min(1, p.mallin * 0.9 + p.ribera * 0.72 + p.bosqueHumedo * 0.18);
    }
    // Mallines y riberas sostienen una capa baja algo más tiempo que una ladera expuesta.
    const persistenciaLocal = 0.68 + humedadLocal * 0.62;
    const v = (amanecer + anochecer) * quieto * humedo * persistenciaLocal * (1 + invierno * 0.4);
    material.uniforms.uOpacidad.value = Math.min(0.56, v * 0.52);
    material.uniforms.uRafaga.value = Math.max(0, clima.rafaga || 0);
    malla.visible = material.uniforms.uOpacidad.value > 0.006;
    // 3.2: la bruma baja toma un poco del color del aire del estilo (turquesa de mañana)
    // 3.4: más del aire (0.3 → 0.42): gris azulada de día, durazno en la hora dorada
    // 3.4: y se apaga con la luz (el material no pasa por la curva de tono): al anochecer no
    // queda una sábana clara sobre el lago
    material.uniforms.uColor.value.setRGB(0.91 - invierno * 0.02, 0.93, 0.95).lerp(U.uBruma.value, 0.42).multiplyScalar(1 - U.uNoche.value * 0.6);
  }

  return { actualizar, malla };
}
