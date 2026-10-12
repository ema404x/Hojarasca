// 3.8.8: las banderas flamean con el viento y el clima. Antes eran un paño quieto con una onda pintada (las de la aldea) o un plano
// fijo (las de la casa de té). Ahora todas usan el mismo material, que mueve el paño en el vertex shader con lo que ya manda el
// clima (U.uViento, con las rachas, y U.uLluvia) y con el tiempo:
//   · en calma el paño CUELGA del mástil, junto a él, con unos pliegues blandos que casi no se mueven;
//   · con brisa se levanta y ondula con una onda que viaja del mástil a la punta; con viento fuerte se tiende, aletea rápido y se
//     agita más con cada racha;
//   · con lluvia el paño se moja: pesa, cuelga un poco más y aletea menos;
//   · y se orienta con el viento (el mismo rumbo de siempre, el del pasto: de +x hacia +z un poco), con un vaivén lento que se
//     afloja cuando hay poco viento.
// El paño es una malla con tres atributos que se calculan acá (`prepararPano`): `aBand` (a, b, L, A: metros hacia la punta y hacia
// abajo desde la esquina de arriba junto al mástil, y el largo y el alto del paño), `aAlong` (hacia la punta) y `aLat` (el lado).
import * as THREE from 'three';
import { U, conTechoNiebla } from './materiales.js';

// el rumbo del viento (el mismo que usa pasto.js: normalize(1, 0.35) en x, z) y el ángulo de giro sobre Y que le toca a un paño
// que, sin girar, apunta a +x: (cos ψ, −sin ψ) = rumbo
const NORM = Math.hypot(1, 0.35);
export const RUMBO_VIENTO = { x: 1 / NORM, z: 0.35 / NORM };
export const ANGULO_VIENTO = Math.atan2(-RUMBO_VIENTO.z, RUMBO_VIENTO.x);

const DECLARACION = /* glsl */`
  attribute vec4 aBand; attribute vec3 aAlong; attribute vec3 aLat;
  uniform float uTiempo; uniform float uViento; uniform float uLluvia;
  varying float vTonoBandera;
`;
const FLAMEO = /* glsl */`
  vec3 transformed = vec3(position);
  {
    float a = aBand.x, b = aBand.y, L = max(aBand.z, 0.01);
    float u = clamp(a / L, 0.0, 1.0);
    float t = uTiempo;
    // cuánto viento hay para el paño (la lluvia lo moja y lo aplasta); las rachas ya vienen en uViento
    float fuerza = smoothstep(0.06, 0.82, uViento - uLluvia * 0.2);
    float calma = 1.0 - fuerza;
    float racha = clamp(uViento - 0.7, 0.0, 0.6);
    // en calma el paño cuelga: se junta contra el mástil (el largo se acorta) y la punta baja
    float cae = calma * (1.05 + uLluvia * 0.25);
    float a2 = a * cos(cae * 0.92);
    float b2 = b - a * sin(cae) * 0.5;
    // pliegues blandos de la tela que cuelga
    float pliegue = calma * 0.075 * sin(a * 7.5 + b * 2.5 + t * 0.35 + aBand.w) * (0.3 + u);
    // la onda que viaja del mástil a la punta; más larga y más lenta con poco viento
    float fase = a * (4.0 + 2.2 * fuerza) - t * (2.2 + 8.0 * fuerza) + b * 1.8;
    float amp = (0.025 + 0.17 * fuerza) * (0.82 + 0.3 * sin(t * 0.9 + 1.7)) * (1.0 + racha * 1.1) * (1.0 - uLluvia * 0.3);
    float ondas = amp * pow(u, 1.15) * (sin(fase) + 0.28 * sin(fase * 2.3 + 1.1));
    // el aleteo del borde libre y el vaivén vertical
    b2 += 0.04 * fuerza * (1.0 + racha) * u * sin(fase * 1.3 + 2.0);
    a2 -= 0.03 * fuerza * u * u * (0.5 + 0.5 * sin(fase * 0.7));
    vec3 pie = position - aAlong * a - vec3(0.0, 1.0, 0.0) * b;
    transformed = pie + aAlong * a2 + vec3(0.0, 1.0, 0.0) * b2 + aLat * (ondas + pliegue);
    // el tono sigue la pendiente de la onda: las crestas toman la luz y los valles quedan en sombra
    vTonoBandera = 1.0 + 0.2 * cos(fase) * fuerza * u + 0.08 * calma * sin(a * 7.5 + b * 2.5 + t * 0.35 + aBand.w);
  }
`;
// El material: un Lambert con colores por vértice o textura, de dos caras, con el flameo. Un solo programa para todas las banderas.
export function materialBandera(opciones = {}) {
  const m = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, ...opciones });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTiempo = U.uTiempo; sh.uniforms.uViento = U.uViento; sh.uniforms.uLluvia = U.uLluvia;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${DECLARACION}`).replace('#include <begin_vertex>', FLAMEO);
    sh.fragmentShader = conTechoNiebla(sh.fragmentShader)   // (la niebla de siempre: este onBeforeCompile pisa el de fábrica)
      .replace('#include <common>', '#include <common>\nvarying float vTonoBandera;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= vTonoBandera;');
  };
  m.customProgramCacheKey = () => 'bandera-viento-3.8.8';
  return m;
}

// Calcula los tres atributos de un paño. `along` y `lat`: ejes unitarios en el plano horizontal ([x, 0, z]); `esquina`: la esquina de
// arriba junto al mástil, en las coordenadas de la malla; `L`, `A`: el largo y el alto del paño.
export function prepararPano(geo, { along = [1, 0, 0], lat = [0, 0, 1], esquina = [0, 0, 0], L, A }) {
  const p = geo.attributes.position, n = p.count;
  const band = new Float32Array(n * 4), al = new Float32Array(n * 3), la = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const dx = p.getX(i) - esquina[0], dz = p.getZ(i) - esquina[2];
    const a = dx * along[0] + dz * along[2], b = p.getY(i) - esquina[1];
    band.set([a, b, L, (i * 0.37) % 6.28], i * 4);   // (el cuarto valor es una fase propia de cada punto, para que los pliegues no sean regulares)
    al.set(along, i * 3); la.set(lat, i * 3);
  }
  geo.setAttribute('aBand', new THREE.BufferAttribute(band, 4));
  geo.setAttribute('aAlong', new THREE.BufferAttribute(al, 3));
  geo.setAttribute('aLat', new THREE.BufferAttribute(la, 3));
  return geo;
}
// Un paño suelto (la bandera de un mástil de la casa de té): un grupo cuyo origen es la esquina de arriba junto al mástil, con el
// paño hacia +x. Se gira con `orientarBandera`.
export function crearPanoBandera(L, A, textura) {
  const g = new THREE.PlaneGeometry(L, A, 28, 8);
  g.translate(L / 2, -A / 2, 0);
  prepararPano(g, { along: [1, 0, 0], lat: [0, 0, 1], esquina: [0, 0, 0], L, A });
  const mat = materialBandera({ map: textura });
  const malla = new THREE.Mesh(g, mat);
  malla.castShadow = false; malla.frustumCulled = false;
  const grupo = new THREE.Group();
  grupo.add(malla);
  return grupo;
}

// ---------------------------------------------------------------- orientación
// Gira el objeto (un grupo en el mástil) sobre Y para que su paño apunte con el viento. `giroBase`: hacia dónde apunta el paño con el
// objeto sin girar (en el marco del padre); el giro del padre se toma de `objeto.parent`. Con poco viento sigue más flojo y cambia de
// lado con un vaivén lento; con viento fuerte, firme.
export function orientarBandera(objeto, giroBase, dt, viento = U.uViento.value, t = U.uTiempo.value) {
  const firme = Math.min(1, Math.max(0, (viento - 0.1) / 0.7));
  const vaiven = Math.sin(t * 0.31 + (objeto.id || 0) * 1.7) * (0.55 - 0.4 * firme) + Math.sin(t * 0.83 + (objeto.id || 0)) * 0.12 * (1 - firme);
  const objetivo = ANGULO_VIENTO + vaiven - giroBase - (objeto.parent ? objeto.parent.rotation.y : 0);
  let d = objetivo - objeto.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  objeto.rotation.y += d * Math.min(1, dt * (0.5 + 2.5 * firme));
}
// Las banderas sueltas (las de la casa de té) se registran y se orientan juntas, una vez por cuadro.
const SUELTAS = [];
export function registrarBandera(grupo, giroBase = 0) { SUELTAS.push({ grupo, giroBase }); return grupo; }
export function actualizarBanderas(dt) { for (const b of SUELTAS) orientarBandera(b.grupo, b.giroBase, dt); }
export const cuantasBanderas = () => SUELTAS.length;
