// 4.28.0 (Ultra, A): el aliento que se ve cuando hace frío (el tuyo y el de los vecinos cercanos). Sólo con Ultra: con Ultra apagado
// no existe nada de acá (ni la malla ni su programa). Un puñado de bocanadas recicladas en una sola nube de puntos (un dibujo).
import * as THREE from 'three';

const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ¿Cuánto frío hace? (0 a 1): el invierno siempre; el otoño a la noche y de madrugada; el verano, nada.
export function frioDelAire({ invierno = 0, otono = 0, horas = 12, lluvia = 0 } = {}) {
  const h = ((Number(horas) % 24) + 24) % 24;
  const noche = Math.min(1, 1 - suave(6, 10, h) + suave(19, 23, h));
  const f = Math.min(1, Math.max(0, invierno)) * (0.75 + 0.25 * noche) + Math.min(1, Math.max(0, otono)) * (0.15 + 0.55 * noche) + lluvia * 0.1 * otono;
  return Math.min(1, Math.max(0, f));
}
export const ALIENTO = { bocanadas: 64, cadaJugador: 3.4, cadaVecino: 3.9, vida: 1.7, radioVecinos: 16, vecinosMax: 6, umbral: 0.22 };

const VERT = `
  attribute float aEdad;
  attribute float aAlfa;
  varying float vAlfa;
  uniform float uEscala;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float t = clamp(aEdad, 0.0, 1.0);
    vAlfa = aAlfa * smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.35, 1.0, t));
    gl_PointSize = (0.08 + 0.42 * sqrt(t)) * uEscala / max(-mv.z, 0.1);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = `
  uniform vec3 uColor;
  varying float vAlfa;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d) * 2.0;
    float a = (1.0 - smoothstep(0.2, 1.0, r)) * vAlfa;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

export function crearAliento({ escena, renderer = null, camara = null }) {
  const n = ALIENTO.bocanadas;
  const pos = new Float32Array(n * 3), edad = new Float32Array(n).fill(2), alfa = new Float32Array(n);
  const vel = new Float32Array(n * 3), vida = new Float32Array(n).fill(1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aEdad', new THREE.BufferAttribute(edad, 1));
  geo.setAttribute('aAlfa', new THREE.BufferAttribute(alfa, 1));
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(0.9, 0.92, 0.95) }, uEscala: { value: 700 } } });
  const puntos = new THREE.Points(geo, mat);
  puntos.frustumCulled = false; puntos.renderOrder = 5; puntos.name = 'ultra-aliento';
  escena.add(puntos);
  if (renderer && camara) { try { renderer.compile(puntos, camara, escena); } catch { /* en el primer cuadro */ } }
  let siguiente = 0;
  const relojes = new Map();
  const stats = { soplos: 0 };

  function soplar(x, y, z, yaw, fuerza) {
    // tres bocanadas seguidas, hacia adelante y apenas hacia arriba
    for (let k = 0; k < 3; k++) {
      const i = siguiente; siguiente = (siguiente + 1) % n;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw), v = 0.45 + k * 0.12;
      pos[i * 3] = x + fx * 0.12; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z + fz * 0.12;
      vel[i * 3] = fx * v + (Math.random() - 0.5) * 0.08; vel[i * 3 + 1] = 0.05 + k * 0.03; vel[i * 3 + 2] = fz * v + (Math.random() - 0.5) * 0.08;
      edad[i] = -k * 0.08; vida[i] = ALIENTO.vida * (0.85 + Math.random() * 0.3); alfa[i] = 0.32 * fuerza;
    }
    stats.soplos++;
  }

  // `frio` 0 a 1; `jugador` = { x, y, z, yaw, rapido } (la boca) o null; `vecinos` = [{ id, x, y, z, yaw }]; `color` = la luz del aire
  function actualizar(dt, frio, jugador, vecinos, color, viento = 0) {
    const activo = frio > ALIENTO.umbral;
    if (activo) {
      const fuerza = Math.min(1, (frio - ALIENTO.umbral) / 0.4);
      if (jugador) {
        const r = (relojes.get('jugador') ?? 0) - dt * (jugador.rapido ? 1.8 : 1);
        if (r <= 0) { soplar(jugador.x, jugador.y, jugador.z, jugador.yaw, fuerza); relojes.set('jugador', ALIENTO.cadaJugador * (0.85 + Math.random() * 0.3)); } else relojes.set('jugador', r);
      }
      for (const v of vecinos || []) {
        const r = (relojes.get(v.id) ?? Math.random() * ALIENTO.cadaVecino) - dt;
        if (r <= 0) { soplar(v.x, v.y, v.z, v.yaw, fuerza); relojes.set(v.id, ALIENTO.cadaVecino * (0.8 + Math.random() * 0.4)); } else relojes.set(v.id, r);
      }
    }
    let vivas = 0;
    for (let i = 0; i < n; i++) {
      if (edad[i] >= 1) continue;
      edad[i] += dt / vida[i];
      if (edad[i] < 0) { vivas++; continue; }
      const fr = Math.exp(-dt * 1.6);
      vel[i * 3] = vel[i * 3] * fr + viento * 0.12 * dt; vel[i * 3 + 1] = vel[i * 3 + 1] * fr + 0.18 * dt; vel[i * 3 + 2] *= fr;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (edad[i] < 1) vivas++;
    }
    puntos.visible = vivas > 0;
    if (vivas > 0) {
      geo.attributes.position.needsUpdate = true; geo.attributes.aEdad.needsUpdate = true; geo.attributes.aAlfa.needsUpdate = true;
      if (color) mat.uniforms.uColor.value.copy(color);
      if (renderer) mat.uniforms.uEscala.value = renderer.domElement ? renderer.domElement.height * 0.9 : 700;
    }
    return vivas;
  }

  function desarmar() { escena.remove(puntos); geo.dispose(); mat.dispose(); }
  return { actualizar, desarmar, puntos, stats };
}
