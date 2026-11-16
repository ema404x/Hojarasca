// 4.29.0 (B): fuego, rastros y vida chica del nivel Ultra (ver ultra.js). Nada de esto existe con Ultra apagado: no se arma ninguna malla,
// textura ni programa, las luces se copian como siempre, el humo sube como siempre y las huellas son las de la 4.28.0 (Alta, Media y Baja
// quedan exactamente igual). Con Ultra prendido (y sólo mientras la calidad que corre es Alta):
//   · fuego: los fogones, las estufas, los hogares, la parrilla y el horno de la cocina con llamas que se mueven (tres lenguas por fuego que
//     miran a la cámara, con un ruido que sube), chispas que suben y se las lleva el viento, y la luz que titila de verdad (un ruido, no un
//     seno parejo, y se corre unos centímetros: lo que está cerca tiembla); el humo se dobla con el viento (en clima.js, `ponerUltraB`);
//     las velas y los faroles (las luces tibias) tiemblan apenas;
//   · rastros: huellas en la nieve y en el barro con forma de pisada (una textura más fina que la de Alta, que sigue al jugador y se corre
//     sin borrar lo pisado), las tuyas, las de la gente cercana y las de los animales; se borran solas en unos minutos (más rápido si nieva);
//     salpicaduras al pisar el suelo mojado (vos y la gente) y gotas que rebotan en los techos, las piedras y la plaza cuando llueve;
//   · vida chica: luciérnagas que se prenden y se apagan en las noches de verano, en los prados y los bordes del bosque (en lugar de las de
//     siempre, que brillan parejo en todos lados); telarañas con rocío a la mañana en los arbustos y los cercos; bandadas de pájaros en el
//     suelo que se espantan cuando pasás cerca.
// Programas de Ultra: las llamas, los puntos (chispas, gotas, salpicaduras, luciérnagas y pájaros: uno solo) y las telarañas; y el suelo
// (ultra-bosque.js) suma el barro pisado a su parche.
import * as THREE from 'three';
import { U } from './materiales.js';
import { esUltra } from './ultra.js';
import { RUMBO_VIENTO } from './bandera-viento.js';

export const CLAVE_ULTRA_VIDA = 'ultra-vida-4.29.0';
const RX = RUMBO_VIENTO.x, RZ = RUMBO_VIENTO.z;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const hash = (x) => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const hash2 = (x, z) => hash(x * 12.9898 + z * 78.233);
// un ruido de una dimensión, suave (para el titilar de las luces)
function ruido1(t) { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; }

// ---------------------------------------------------------------- las llamas que anota otro módulo (la parrilla y el horno de la cocina)
// cocina-mundo.js anota sus llamas (unos conos) con `anotarLlamaUltra(malla, alto)`; con Ultra, los conos se esconden (su máscara de capas en 0)
// y en su lugar arde una llama de verdad. Al apagar Ultra vuelven los conos.
const LLAMAS_ANOTADAS = [];
export function anotarLlamaUltra(malla, alto = 0.62) {
  if (malla) LLAMAS_ANOTADAS.push({ ref: new WeakRef(malla), alto });
  return malla;
}

// ---------------------------------------------------------------- las llamas
export const MAX_LLAMAS = 10;   // fuegos a la vez (cuatro fogatas y la cocina); cada uno tres lenguas
export const GLSL_LLAMA_V = /* glsl */`
  #include <common>
  #include <fog_pars_vertex>
  uniform float uViento; uniform vec2 uRumbo;
  attribute vec4 aLlama;
  varying vec2 vUv; varying vec4 vLlama;
  void main() {
    vec3 centro = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 aCam = cameraPosition - centro; aCam.y = 0.0;
    vec3 der = normalize(vec3(aCam.z, 0.0, -aCam.x) + vec3(1e-5, 0.0, 0.0));
    vec3 p = centro + der * position.x * aLlama.z + vec3(0.0, position.y * aLlama.y, 0.0);
    // el viento acuesta la punta
    p.xz += uRumbo * uViento * position.y * position.y * aLlama.y * 0.4;
    vUv = vec2(position.x + 0.5, position.y); vLlama = aLlama;
    vec4 mvPosition = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
export const GLSL_LLAMA_F = /* glsl */`
  #include <common>
  #include <fog_pars_fragment>
  float nieblaUV() {
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        return 1.0 - exp(- fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        return smoothstep(fogNear, fogFar, vFogDepth);
      #endif
    #else
      return 0.0;
    #endif
  }
  uniform float uTiempo;
  varying vec2 vUv; varying vec4 vLlama;
  float hL(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float nL(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hL(i), hL(i + vec2(1.0, 0.0)), f.x), mix(hL(i + vec2(0.0, 1.0)), hL(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbmL(vec2 p) { return nL(p) * 0.55 + nL(p * 2.1 + 3.7) * 0.3 + nL(p * 4.3 + 1.3) * 0.15; }
  void main() {
    float t = uTiempo, s = vLlama.x * 37.0, y = vUv.y;
    // la turbulencia sube (más rápida arriba) y tuerce el cuerpo de la llama más cuanto más alto
    float n = fbmL(vec2(vUv.x * 2.4 + s, y * 1.7 - t * 2.1));
    float n2 = fbmL(vec2(vUv.x * 5.0 - s, y * 3.4 - t * 3.7));
    float x = (vUv.x - 0.5) + (n - 0.5) * 0.6 * y + sin(y * 5.0 - t * 4.6 + s) * 0.04 * y;
    // el perfil: redondo abajo, en punta arriba; el ruido se come el borde (más arriba): lenguas sueltas
    float perfil = 0.38 * pow(max(1.0 - y, 0.0), 0.75) * smoothstep(-0.05, 0.12, y);
    float d = abs(x) / max(perfil, 1e-3) + (n2 - 0.5) * 1.9 * y + (n - 0.5) * 0.35;
    float forma = 1.0 - smoothstep(0.55, 0.82, d);
    float corazon = (1.0 - smoothstep(0.1, 0.7, d)) * (1.0 - smoothstep(0.15, 0.55, y));
    // rojo en las puntas y el borde, naranja, amarillo adentro y un corazón casi blanco abajo
    float calor = clamp((1.0 - d) * 1.4 * (1.0 - y * 0.85), 0.0, 1.0);
    vec3 col = mix(vec3(0.62, 0.08, 0.01), vec3(1.0, 0.36, 0.04), smoothstep(0.05, 0.4, calor));
    col = mix(col, vec3(1.0, 0.68, 0.22), smoothstep(0.4, 0.8, calor));
    col = mix(col, vec3(1.0, 0.9, 0.62), corazon * 0.75);
    col *= 1.05;
    float a = forma * (0.35 + 0.65 * calor) * vLlama.w;
    float f = 0.0;
    #ifdef USE_FOG
      f = nieblaUV();
    #endif
    a *= 1.0 - f;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col * a, 0.0);   // (suma: la llama alumbra, no tapa)
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
export function crearLlamas() {
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const datos = new Float32Array(MAX_LLAMAS * 3 * 4);
  const attr = new THREE.InstancedBufferAttribute(datos, 4);
  geo.setAttribute('aLlama', attr);
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTiempo: { value: 0 }, uViento: { value: 0 }, uRumbo: { value: new THREE.Vector2(RX, RZ) } }]),
    vertexShader: GLSL_LLAMA_V, fragmentShader: GLSL_LLAMA_F,
    transparent: true, depthWrite: false, premultipliedAlpha: true, blending: THREE.NormalBlending, fog: true, side: THREE.DoubleSide,
  });
  mat.uniforms.uTiempo = U.uTiempo; mat.uniforms.uViento = U.uViento;
  mat.customProgramCacheKey = () => CLAVE_ULTRA_VIDA + '|llamas';
  const malla = new THREE.InstancedMesh(geo, mat, MAX_LLAMAS * 3);
  malla.name = 'llamas-ultra';
  malla.frustumCulled = false;
  malla.renderOrder = 4;
  malla.count = 0; malla.visible = false;
  const m4 = new THREE.Matrix4();
  // `fuegos`: [{ x, y, z, alto, ancho, brillo, semilla }]
  function poner(fuegos) {
    let k = 0;
    for (const f of fuegos) {
      if (k >= MAX_LLAMAS * 3) break;
      // tres lenguas: la grande en el medio y dos más bajas a los costados (corridas un poco, así de cualquier lado se ven varias)
      for (let capa = 0; capa < 3; capa++) {
        const a = f.semilla * 7 + capa * 2.1, r = capa ? f.ancho * 0.2 : 0;
        m4.makeTranslation(f.x + Math.cos(a) * r, f.y, f.z + Math.sin(a) * r);
        malla.setMatrixAt(k, m4);
        datos[k * 4] = f.semilla + capa * 0.37;
        datos[k * 4 + 1] = f.alto * (capa ? 0.62 + 0.12 * capa : 1);
        datos[k * 4 + 2] = f.ancho * (capa ? 0.7 : 1);
        datos[k * 4 + 3] = f.brillo * (capa ? 0.8 : 1);
        k++;
      }
    }
    malla.count = k; malla.visible = k > 0;
    if (k) { malla.instanceMatrix.needsUpdate = true; attr.needsUpdate = true; }
  }
  return { malla, poner, dispose() { geo.dispose(); mat.dispose(); } };
}

// ---------------------------------------------------------------- los puntos (chispas, gotas, salpicaduras, luciérnagas, pájaros)
// Un solo dibujo de puntos con un solo programa. Cada punto: posición, color y alfa (aColor), tamaño en metros y forma (aDatos: la parte
// entera es la forma, la fraccionaria un dato de la forma). Formas: 0 gota (disco suave), 1 brillo (núcleo y halo, suma: chispa, luciérnaga),
// 2 pájaro volando (el dato: el aleteo), 3 corona de la gota que rebota (el dato: la vida), 4 pájaro posado (el dato: la cabeza y el lado).
export const FORMA = { gota: 0, brillo: 1, vuelo: 2, corona: 3, posado: 4 };
export const GLSL_PUNTOS_V = /* glsl */`
  #include <common>
  #include <fog_pars_vertex>
  uniform float uAltoPx;
  attribute vec4 aColor; attribute vec2 aDatos;
  varying vec4 vColor; varying float vForma; varying float vEsc;
  void main() {
    vColor = aColor; vForma = aDatos.y;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float px = aDatos.x * projectionMatrix[1][1] * uAltoPx * 0.5 / max(-mvPosition.z, 0.05);
    gl_PointSize = clamp(px, 1.5, 180.0);
    vEsc = clamp(px / 1.5, 0.0, 1.0);
    if (aColor.a < 0.003 || -mvPosition.z < 0.1) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    #include <fog_vertex>
  }`;
export const GLSL_PUNTOS_F = /* glsl */`
  #include <common>
  #include <fog_pars_fragment>
  float nieblaUV() {
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        return 1.0 - exp(- fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        return smoothstep(fogNear, fogFar, vFogDepth);
      #endif
    #else
      return 0.0;
    #endif
  }
  varying vec4 vColor; varying float vForma; varying float vEsc;
  void main() {
    vec2 p = gl_PointCoord - 0.5; p.y = -p.y;
    float tipo = floor(vForma + 0.001), dato = vForma - tipo;
    float a = 0.0, suma = 0.0;
    if (tipo < 0.5) {
      a = 1.0 - smoothstep(0.22, 0.5, length(p));
    } else if (tipo < 1.5) {
      float r2 = dot(p, p);
      a = (exp(-r2 * 70.0) + 0.45 * exp(-r2 * 12.0)) * (1.0 - smoothstep(0.3, 0.5, sqrt(r2)));   // (el halo llega a 0 antes del borde: de cerca no se ve el cuadrado)
      suma = 1.0;
    } else if (tipo < 2.5) {
      // pájaro volando: dos alas curvas que suben y bajan
      float caida = 0.5 + dato * 1.1;
      float ala = abs(p.y - (abs(p.x) - 0.1) * (caida - 0.8) * 0.9);
      float dentro = smoothstep(0.1, 0.04, ala) * step(abs(p.x), 0.47);
      float cuerpo = smoothstep(0.12, 0.05, length(p * vec2(2.2, 1.0)));
      a = clamp(dentro + cuerpo, 0.0, 1.0);
    } else if (tipo < 3.5) {
      // la corona: un anillo chato que se abre y unas gotitas que saltan arriba
      float r = 0.12 + 0.3 * dato;
      vec2 q = vec2(p.x, (p.y + 0.22) * 3.0);
      float anillo = 1.0 - smoothstep(0.0, 0.07, abs(length(q) - r));
      float puntas = 0.0;
      for (int k = 0; k < 5; k++) {
        float ang = (float(k) - 2.0) * 0.5;
        vec2 c = vec2(sin(ang) * r, -0.22 + 0.12 + 0.3 * sin(dato * 3.14159) * (1.0 - abs(float(k) - 2.0) * 0.18));
        puntas += 1.0 - smoothstep(0.02, 0.05, length(p - c));
      }
      a = clamp(anillo * 0.7 + puntas, 0.0, 1.0) * (1.0 - dato);
    } else {
      // pájaro posado, de costado: el cuerpo, la cabeza (arriba o picoteando) y la cola
      float lado = step(0.5, dato) * 2.0 - 1.0;
      float cabeza = fract(dato * 2.0);
      vec2 q = vec2(p.x * lado, p.y);
      float cuerpo = 1.0 - smoothstep(0.9, 1.05, length((q - vec2(0.0, -0.12)) / vec2(0.26, 0.15)));
      vec2 cc = mix(vec2(0.2, 0.06), vec2(0.27, -0.2), cabeza);
      float cab = 1.0 - smoothstep(0.075, 0.1, length(q - cc));
      float cola = step(q.x, -0.18) * step(-0.42, q.x) * (1.0 - smoothstep(0.0, 0.04, abs(q.y + 0.05 - (q.x + 0.18) * -0.35)));
      float patas = step(abs(q.x - 0.02), 0.015) * step(-0.4, q.y) * step(q.y, -0.25);
      a = clamp(cuerpo + cab + cola + patas, 0.0, 1.0);
    }
    vec3 c = vColor.rgb;
    float al = a * vColor.a * vEsc;
    #ifdef USE_FOG
      float f = nieblaUV();
      c = mix(c, fogColor, f * (1.0 - suma)); al *= 1.0 - f * suma;
    #endif
    if (al < 0.003) discard;
    gl_FragColor = vec4(c * al, al * (1.0 - suma));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
// los tramos del dibujo de puntos (fijos: cada cosa su lugar)
export const TRAMOS = { chispas: [0, 220], pasos: [220, 340], lluvia: [340, 1540], luciernagas: [1540, 1760], pajaros: [1760, 1800] };
export const N_PUNTOS = 1800;
export function crearPuntos() {
  const pos = new Float32Array(N_PUNTOS * 3), color = new Float32Array(N_PUNTOS * 4), datos = new Float32Array(N_PUNTOS * 2);
  const g = new THREE.BufferGeometry();
  const aPos = new THREE.BufferAttribute(pos, 3), aCol = new THREE.BufferAttribute(color, 4), aDat = new THREE.BufferAttribute(datos, 2);
  g.setAttribute('position', aPos); g.setAttribute('aColor', aCol); g.setAttribute('aDatos', aDat);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uAltoPx: { value: 1080 } }]),
    vertexShader: GLSL_PUNTOS_V, fragmentShader: GLSL_PUNTOS_F,
    transparent: true, depthWrite: false, premultipliedAlpha: true, blending: THREE.NormalBlending, fog: true,
  });
  mat.customProgramCacheKey = () => CLAVE_ULTRA_VIDA + '|puntos';
  const malla = new THREE.Points(g, mat);
  malla.name = 'puntos-ultra';
  malla.frustumCulled = false;
  malla.renderOrder = 4;
  const tam = new THREE.Vector2();
  malla.onBeforeRender = (renderer) => { renderer.getDrawingBufferSize(tam); mat.uniforms.uAltoPx.value = tam.y || 1080; };
  function poner(i, x, y, z, r, gg, b, a, tamM, forma) {
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    color[i * 4] = r; color[i * 4 + 1] = gg; color[i * 4 + 2] = b; color[i * 4 + 3] = a;
    datos[i * 2] = tamM; datos[i * 2 + 1] = forma;
  }
  function ocultar(i) { color[i * 4 + 3] = 0; }
  function subir() { aPos.needsUpdate = true; aCol.needsUpdate = true; aDat.needsUpdate = true; }
  return { malla, poner, ocultar, subir, pos, color, datos, dispose() { g.dispose(); mat.dispose(); } };
}

// ---------------------------------------------------------------- las telarañas
export const MAX_TELAS = 40;
export const GLSL_TELA_V = /* glsl */`
  #include <common>
  #include <fog_pars_vertex>
  uniform float uTiempo; uniform float uViento;
  attribute float aSemilla;
  varying vec2 vUv; varying float vSem; varying vec3 vPosM; varying vec3 vNorM;
  void main() {
    vUv = uv; vSem = aSemilla;
    vec3 p = position;
    // la tela se infla un poco con el viento (más en el medio que en el borde)
    float centro = 1.0 - clamp(length(position.xy) * 2.0, 0.0, 1.0);
    p.z += sin(uTiempo * (1.6 + aSemilla) + aSemilla * 9.0) * 0.03 * (0.4 + uViento) * centro;
    vec4 mundo = modelMatrix * instanceMatrix * vec4(p, 1.0);
    vPosM = mundo.xyz;
    vNorM = normalize(mat3(modelMatrix * instanceMatrix) * vec3(0.0, 0.0, 1.0));
    vec4 mvPosition = viewMatrix * mundo;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
export const GLSL_TELA_F = /* glsl */`
  #include <common>
  #include <fog_pars_fragment>
  float nieblaUV() {
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        return 1.0 - exp(- fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        return smoothstep(fogNear, fogFar, vFogDepth);
      #endif
    #else
      return 0.0;
    #endif
  }
  uniform float uRocio; uniform vec3 uSolDir; uniform vec3 uSolColor; uniform vec3 uAmbiente;
  varying vec2 vUv; varying float vSem; varying vec3 vPosM; varying vec3 vNorM;
  float hT(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float ang = atan(p.y, p.x), r = length(p);
    // el marco no es redondo: la tela se ata donde puede
    float borde = 0.8 + 0.12 * sin(ang * 3.0 + vSem * 20.0) + 0.07 * sin(ang * 5.0 + vSem * 7.0);
    if (r > borde) discard;
    float w = fwidth(r) * 0.8 + 0.003;
    // los rayos (catorce, un poco torcidos)
    float NR = 17.0;
    float idx = floor(ang / 6.2831853 * NR + 0.5);
    float angR = (idx + (hT(idx * 3.1 + vSem * 13.0) - 0.5) * 0.35) / NR * 6.2831853;
    float dRad = abs(sin(ang - angR)) * r;
    float rayo = 1.0 - smoothstep(0.0, w * 1.5, dRad);
    // la espiral (cada vuelta 0,12 más afuera), desde el cubo hasta cerca del marco
    float paso = 0.12;
    float esp = r / paso - ang / 6.2831853;
    float dEsp = abs(fract(esp) - 0.5) * paso;
    float espiral = (1.0 - smoothstep(0.0, w * 0.7, dEsp)) * step(0.16, r) * step(r, borde - 0.06) * 0.5;
    float cubo = 1.0 - smoothstep(0.0, w * 1.5, abs(r - 0.06));
    float hilo = max(max(rayo, espiral), cubo);
    // las gotas de rocío, enhebradas en la espiral
    float arco = ang * r / 0.05 + floor(esp) * 0.37;
    vec2 qG = vec2((fract(arco) - 0.5) * 0.05, dEsp);
    float gota = (1.0 - smoothstep(0.005, 0.005 + w * 1.6, length(qG))) * step(0.16, r) * step(r, borde - 0.06) * step(0.45, hT(floor(arco) + floor(esp) * 17.0 + vSem));
    // cada gota es una lente: devuelve el sol en un punto (según hacia dónde mira), y algo de cielo
    vec3 vista = normalize(cameraPosition - vPosM);
    vec3 nG = normalize(vNorM * sign(dot(vNorM, vista) + 1e-4) + vec3(hT(floor(arco) * 1.3) - 0.5, hT(floor(arco) * 2.7 + 1.0) - 0.5, hT(floor(arco) * 0.7 + 3.0) - 0.5) * 1.6);
    float brillo = pow(max(dot(reflect(-normalize(uSolDir), nG), vista), 0.0), 12.0) * 6.0 * smoothstep(-0.02, 0.15, uSolDir.y);
    vec3 luz = uAmbiente * 1.6 + uSolColor * 0.35;
    vec3 col = luz * (0.8 * hilo) + (luz * 1.3 + uSolColor * brillo) * gota;
    float a = clamp(hilo * 0.26 + gota * 0.9, 0.0, 1.0) * uRocio;
    float d = length(cameraPosition - vPosM);
    a *= 1.0 - smoothstep(9.0, 20.0, d);
    #ifdef USE_FOG
      float f = nieblaUV();
      col = mix(col, fogColor, f);
    #endif
    if (a < 0.004) discard;
    gl_FragColor = vec4(col * a, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
export function crearTelas() {
  const geo = new THREE.PlaneGeometry(1, 1);
  const sem = new Float32Array(MAX_TELAS);
  const aSem = new THREE.InstancedBufferAttribute(sem, 1);
  geo.setAttribute('aSemilla', aSem);
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTiempo: { value: 0 }, uViento: { value: 0 }, uRocio: { value: 0 }, uSolDir: { value: new THREE.Vector3() }, uSolColor: { value: new THREE.Color() }, uAmbiente: { value: new THREE.Color() } }]),
    vertexShader: GLSL_TELA_V, fragmentShader: GLSL_TELA_F,
    transparent: true, depthWrite: false, premultipliedAlpha: true, blending: THREE.NormalBlending, fog: true, side: THREE.DoubleSide,
  });
  Object.assign(mat.uniforms, { uTiempo: U.uTiempo, uViento: U.uViento, uSolDir: U.uSolDir, uSolColor: U.uSolColor, uAmbiente: U.uAmbiente });
  mat.customProgramCacheKey = () => CLAVE_ULTRA_VIDA + '|telas';
  const malla = new THREE.InstancedMesh(geo, mat, MAX_TELAS);
  malla.name = 'telas-ultra';
  malla.frustumCulled = false;
  malla.renderOrder = 3;
  malla.count = 0; malla.visible = false;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  // `telas`: [{ x, y, z, giro, inclina, tam, semilla }]
  function poner(telas) {
    let k = 0;
    for (const t of telas) {
      if (k >= MAX_TELAS) break;
      e.set(t.inclina, t.giro, 0, 'YXZ'); q.setFromEuler(e);
      m4.compose(v.set(t.x, t.y, t.z), q, s.set(t.tam, t.tam, 1));
      malla.setMatrixAt(k, m4); sem[k] = t.semilla; k++;
    }
    malla.count = k;
    malla.instanceMatrix.needsUpdate = true; aSem.needsUpdate = true;
  }
  return { malla, mat, poner, dispose() { geo.dispose(); mat.dispose(); } };
}

// ---------------------------------------------------------------- las huellas finas (nieve y barro)
// En Ultra, la textura de las huellas (la que lee el suelo: U.uHuellas) pasa a ser ésta: 512 × 512 sobre 24 m (4,7 cm por texel) en vez de
// 256 × 256 sobre 64 m, así cada pisada tiene forma de pie y no de mancha. Sigue al jugador corriendo lo marcado (no se borra al moverse).
// Las de Alta (huellas.js) quedan en pausa y vuelven al apagar Ultra.
export const HUELLAS_RES = 512;
export const HUELLAS_LADO = 24;
export function crearHuellasFinas() {
  const R = HUELLAS_RES, tam = HUELLAS_LADO / R;
  const datos = new Uint8Array(R * R);
  const tex = new THREE.DataTexture(datos, R, R, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const centro = new THREE.Vector2();
  let primero = true, sucia = false, acum = 0;
  function recentrar(x, z) {
    const nx = Math.round(x / tam) * tam, nz = Math.round(z / tam) * tam;
    const di = Math.round((nx - centro.x) / tam), dj = Math.round((nz - centro.y) / tam);
    if (primero || Math.abs(di) >= R || Math.abs(dj) >= R) datos.fill(0);
    else if (di || dj) {
      const copia = datos.slice();
      datos.fill(0);
      for (let j = 0; j < R; j++) {
        const jj = j + dj; if (jj < 0 || jj >= R) continue;
        const o = j * R, oo = jj * R;
        for (let i = 0; i < R; i++) { const ii = i + di; if (ii >= 0 && ii < R) datos[o + i] = copia[oo + ii]; }
      }
    }
    primero = false;
    centro.set(nx, nz);
    sucia = true;
  }
  // una pisada: un óvalo de ~26 × 11 cm a lo largo de `yaw` (talón y planta), `escala` para los animales chicos
  function pisada(x, z, yaw, fuerza = 1, escala = 1, redonda = false) {
    const u0 = (x - centro.x) / tam + R / 2 - 0.5, v0 = (z - centro.y) / tam + R / 2 - 0.5;
    const largo = (redonda ? 0.07 : 0.13) * escala / tam, ancho = (redonda ? 0.06 : 0.055) * escala / tam;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);   // adelante
    const rr = Math.ceil(Math.max(largo, ancho)) + 1;
    for (let j = Math.floor(v0 - rr); j <= Math.ceil(v0 + rr); j++) {
      if (j < 0 || j >= R) continue;
      for (let i = Math.floor(u0 - rr); i <= Math.ceil(u0 + rr); i++) {
        if (i < 0 || i >= R) continue;
        const du = i - u0, dv = j - v0;
        const a = (du * fx + dv * fz) / largo, b = (du * fz - dv * fx) / ancho;
        // el talón un poco más angosto que la planta
        const d = Math.hypot(a, b * (a < 0 && !redonda ? 1.25 : 1));
        if (d >= 1) continue;
        const k = j * R + i;
        datos[k] = Math.max(datos[k], Math.round(255 * fuerza * Math.min(1, (1 - d) * 3)));
      }
    }
    sucia = true;
  }
  function seguir(x, z) { if (primero || Math.abs(x - centro.x) > HUELLAS_LADO * 0.25 || Math.abs(z - centro.y) > HUELLAS_LADO * 0.25) recentrar(x, z); }
  // se borran solas: en unos dos minutos y medio (más rápido si nieva o llueve fuerte)
  function borrar(dt, nevando, lloviendo) {
    acum += dt;
    const cada = nevando ? 0.5 : 1.2, paso = nevando ? 4 : lloviendo ? 3 : 2;
    if (acum < cada) return;
    acum = 0;
    let algo = false;
    for (let k = 0; k < datos.length; k++) { const d = datos[k]; if (d) { datos[k] = d > paso ? d - paso : 0; algo = true; } }
    if (algo) sucia = true;
  }
  function subir() { if (sucia) { tex.needsUpdate = true; sucia = false; } }
  return { tex, datos, centro, pisada, seguir, borrar, subir, get primero() { return primero; }, dispose() { tex.dispose(); } };
}

// ---------------------------------------------------------------- reglas puras (también para las pruebas)
// las telarañas sólo con el rocío de la mañana (de 5 a 10, más al alba), sin lluvia ni nieve
export function rocioTelas(horas, lluvia, invierno) {
  const h = Number(horas);
  if (!Number.isFinite(h)) return 0;
  return clamp((1 - Math.abs(h - 7) / 3.2) * 1.4, 0, 1) * (1 - clamp(lluvia * 2, 0, 1)) * (1 - clamp((invierno - 0.3) * 3, 0, 1));
}
// las luciérnagas: noches de verano (no en otoño ni en invierno, ni con lluvia)
export function hayLuciernagas(noche, otono, invierno, lluvia) { return noche > 0.6 && otono < 0.5 && invierno < 0.5 && lluvia < 0.3; }
// el titilar de una luciérnaga: un destello cada `periodo` segundos (sube en 0,15 s y se apaga en casi un segundo)
export function destelloLuciernaga(t, periodo, fase) {
  const x = ((t / periodo + fase) % 1 + 1) % 1;
  const d = x * periodo;   // segundos desde que empezó el destello
  if (d < 0.15) return d / 0.15;
  if (d < 1.05) return Math.pow(1 - (d - 0.15) / 0.9, 1.6);
  return 0;
}
// el titilar de la luz del fuego (de 0,6 a 1,35 de la luz de siempre: un vaivén lento, otro rápido y bajones de golpe) y de las velas y
// faroles (± 7 %)
export function titilarFuego(t, semilla) {
  const lento = ruido1(t * 3.1 + semilla), rapido = ruido1(t * 11.3 + semilla * 3.1), golpe = ruido1(t * 23.7 + semilla * 7.7);
  return Math.min(1.35, Math.max(0.6, 0.45 + lento * 0.6 + rapido * 0.35 + (golpe > 0.75 ? -(golpe - 0.75) * 1.2 : golpe * 0.15)));
}
export function titilarVela(t, semilla) { return 1 + 0.14 * (ruido1(t * 5.7 + semilla) * 0.7 + ruido1(t * 13.9 + semilla * 2.3) * 0.3 - 0.5); }
export function esLuzTibia(c) { return !!c && c.r > 0.2 && c.r >= c.g && c.r > c.b * 1.45; }

const TIPOS_ARBUSTO = new Set(['chilco', 'notro', 'maqui', 'chaura', 'calafate', 'michay', 'mosqueta', 'zarza', 'neneo']);
const TIPOS_CERCO = new Set(['cerco', 'tranquera', 'corral']);

// ---------------------------------------------------------------- el conjunto
// `crearUltraVida({ escena, clima, T })`; en cada cuadro `revisarAjustes(ajustes, calidadActiva, dt, ctx)` con
// ctx = { cam, js, gente, veg, obras, horas, noche, dia, techos, huellas, fauna, presupuesto, bajoTecho }.
export function crearUltraVida({ escena, clima, T }) {
  let activo = false, llamas = null, puntos = null, telas = null, finas = null, presupuesto = null, huellasAlta = null;
  const lucesFuego = new Map();   // la luz de cada fogata → su semilla
  const semillasLuz = new WeakMap();
  const conos = new Set();        // los conos de la cocina escondidos (para devolverlos)
  const fuegos = [];
  // las chispas: un fondo fijo dentro de su tramo
  const [c0, c1] = TRAMOS.chispas, NCH = c1 - c0;
  const chispa = { x: new Float32Array(NCH), y: new Float32Array(NCH), z: new Float32Array(NCH), vx: new Float32Array(NCH), vy: new Float32Array(NCH), vz: new Float32Array(NCH), vida: new Float32Array(NCH), dura: new Float32Array(NCH) };
  let proxChispa = 0;
  const acumChispa = new Float32Array(MAX_LLAMAS);
  // las salpicaduras de los pasos (gotitas que saltan)
  const [p0, p1] = TRAMOS.pasos, NPA = p1 - p0;
  const gotita = { x: new Float32Array(NPA), y: new Float32Array(NPA), z: new Float32Array(NPA), vx: new Float32Array(NPA), vy: new Float32Array(NPA), vz: new Float32Array(NPA), vida: new Float32Array(NPA), piso: new Float32Array(NPA) };
  let proxGotita = 0;
  // la lluvia que rebota: corona + dos gotitas por impacto (tres puntos)
  const [l0, l1] = TRAMOS.lluvia, NIMP = Math.floor((l1 - l0) / 3);
  const imp = { x: new Float32Array(NIMP), y: new Float32Array(NIMP), z: new Float32Array(NIMP), vida: new Float32Array(NIMP).fill(1), dx: new Float32Array(NIMP), dz: new Float32Array(NIMP), tam: new Float32Array(NIMP) };
  let proxImp = 0, acumImp = 0;
  // las luciérnagas
  const [f0, f1] = TRAMOS.luciernagas, NLU = f1 - f0;
  const luci = { x: new Float32Array(NLU), y: new Float32Array(NLU), z: new Float32Array(NLU), alto: new Float32Array(NLU), per: new Float32Array(NLU), fase: new Float32Array(NLU), ok: new Uint8Array(NLU) };
  let luciListas = false;
  // los pájaros
  const [b0, b1] = TRAMOS.pajaros, NPJ = b1 - b0;
  const bandada = { estado: 'nada', espera: 4, x: 0, z: 0, t: 0, alfa: 0, n: 0 };
  const pj = { x: new Float32Array(NPJ), y: new Float32Array(NPJ), z: new Float32Array(NPJ), vx: new Float32Array(NPJ), vy: new Float32Array(NPJ), vz: new Float32Array(NPJ), salto: new Float32Array(NPJ), lado: new Float32Array(NPJ), fase: new Float32Array(NPJ) };
  // las huellas de la gente (la última pisada de cada uno)
  const pasosGente = new Map();
  const pasosFauna = new Map();
  const yo = { x: 1e9, z: 1e9, pie: false };
  // las telarañas
  let acumTelas = 99, telasCx = 1e9, telasCz = 1e9;
  const listaTelas = [];
  const info = { fuegos: 0, chispas: 0, gotitas: 0, impactos: 0, luciernagas: 0, pajaros: 'nada', telas: 0, huellas: 0, espantadas: 0 };

  function prender(ctx) {
    activo = true;
    llamas = crearLlamas(); escena.add(llamas.malla);
    puntos = crearPuntos(); escena.add(puntos.malla);
    telas = crearTelas(); escena.add(telas.malla);
    finas = crearHuellasFinas();
    for (let i = 0; i < NCH; i++) chispa.vida[i] = 1, chispa.dura[i] = 1;
    for (let i = 0; i < NPA; i++) gotita.vida[i] = 1;
    imp.vida.fill(1);
    for (let i = 0; i < puntos.color.length / 4; i++) puntos.ocultar(i);
    luciListas = false; bandada.estado = 'nada'; bandada.espera = 3;
    acumTelas = 99; telasCx = 1e9;
    clima?.ponerUltraB?.(true);
    // la luz que titila: el presupuesto de luces llama a `temblor` al copiar cada luz (sólo con Ultra)
    presupuesto = ctx?.presupuesto || escena.userData?.presupuestoLuces || null;
    if (presupuesto) presupuesto.temblor = temblor;
    lucesFuego.clear();
    (clima?.fogatas || []).forEach((f, i) => { if (f.luzFuego) lucesFuego.set(f.luzFuego, 11.3 * (i + 1)); });
  }
  function apagar() {
    activo = false;
    for (const o of [llamas, puntos, telas]) if (o) { o.malla.parent?.remove(o.malla); o.dispose(); }
    llamas = puntos = telas = null;
    if (finas) { finas.dispose(); finas = null; }
    if (huellasAlta) { huellasAlta.reponer?.(); huellasAlta = null; }
    for (const m of conos) { if (m.userData.capasUltraVida !== undefined) { m.layers.mask = m.userData.capasUltraVida; delete m.userData.capasUltraVida; } }
    conos.clear();
    clima?.ponerUltraB?.(false);
    if (presupuesto && presupuesto.temblor === temblor) presupuesto.temblor = null;
    presupuesto = null;
    pasosGente.clear(); pasosFauna.clear(); yo.x = 1e9;
  }

  // -------------------------------------------------------------- la luz que titila
  function temblor(fija, fuente) {
    const t = U.uTiempo.value;
    const s = lucesFuego.get(fuente);
    if (s !== undefined) {
      fija.intensity *= titilarFuego(t, s);
      // se corre unos centímetros: las sombras y la luz sobre lo que está cerca tiemblan
      const e = fija.matrixWorld.elements;
      e[12] += (ruido1(t * 6.1 + s) - 0.5) * 0.2; e[13] += (ruido1(t * 4.7 + s + 5) - 0.5) * 0.12; e[14] += (ruido1(t * 5.3 + s + 9) - 0.5) * 0.2;
      return;
    }
    if (fuente.isPointLight && esLuzTibia(fuente.color)) {
      let k = semillasLuz.get(fuente);
      if (k === undefined) { k = Math.random() * 100; semillasLuz.set(fuente, k); }
      fija.intensity *= titilarVela(t, k);
    }
  }

  // -------------------------------------------------------------- el fuego
  function juntarFuegos() {
    fuegos.length = 0;
    const fogatas = clima?.fogatas || [];
    for (let i = 0; i < fogatas.length; i++) {
      const f = fogatas[i];
      if (!f.activa || !f.fuego?.visible) continue;
      const brillo = clamp(f.vida / 40, 0, 1);
      if (brillo < 0.03) continue;
      if (f.luzFuego && !lucesFuego.has(f.luzFuego)) lucesFuego.set(f.luzFuego, 11.3 * (i + 1));
      const lluvia = f.contenida ? 1 : 1 - (clima.estado?.lluvia || 0) * 0.35;
      fuegos.push(f.contenida
        ? { x: f.pos.x, y: f.pos.y - 0.04, z: f.pos.z, alto: 0.42 * (0.6 + 0.4 * brillo), ancho: 0.36, brillo: brillo, semilla: i * 0.71 + 0.13, chispas: 3, sube: 0.6 }
        : { x: f.pos.x, y: f.pos.y + 0.06, z: f.pos.z, alto: 1.1 * (0.45 + 0.55 * brillo) * lluvia, ancho: 0.78, brillo: brillo * lluvia, semilla: i * 0.71 + 0.13, chispas: 18, sube: 2.6 });
    }
    // las llamas de la cocina (los conos se esconden mientras arda la de Ultra)
    for (let i = LLAMAS_ANOTADAS.length - 1; i >= 0; i--) {
      const a = LLAMAS_ANOTADAS[i], m = a.ref.deref();
      if (!m || !m.parent) { if (m && conos.has(m)) devolverCono(m); LLAMAS_ANOTADAS.splice(i, 1); continue; }
      let vis = m.visible;
      for (let o = m.parent; o && vis; o = o.parent) vis = o.visible;
      if (!vis) continue;
      if (!conos.has(m)) { m.userData.capasUltraVida = m.layers.mask; m.layers.mask = 0; conos.add(m); }
      m.updateWorldMatrix(true, false);
      const e = m.matrixWorld.elements, esc = Math.hypot(e[4], e[5], e[6]);
      fuegos.push({ x: e[12], y: e[13], z: e[14], alto: a.alto * esc * 1.25, ancho: a.alto * esc * 0.9, brillo: 1, semilla: 5.3 + i * 0.37, chispas: a.alto * esc > 0.4 ? 7 : 2, sube: a.alto * esc > 0.4 ? 1.6 : 0.5 });
    }
    info.fuegos = fuegos.length;
  }
  function devolverCono(m) {
    if (m.userData.capasUltraVida !== undefined) { m.layers.mask = m.userData.capasUltraVida; delete m.userData.capasUltraVida; }
    conos.delete(m);
  }
  function moverChispas(dt) {
    const vto = U.uViento.value, t = U.uTiempo.value;
    for (let k = 0; k < fuegos.length && k < MAX_LLAMAS; k++) {
      const f = fuegos[k];
      acumChispa[k] += dt * f.chispas * f.brillo;
      while (acumChispa[k] >= 1) {
        acumChispa[k] -= 1;
        const i = proxChispa; proxChispa = (proxChispa + 1) % NCH;
        const ang = Math.random() * 6.283, r = Math.random() * f.ancho * 0.3;
        chispa.x[i] = f.x + Math.cos(ang) * r; chispa.z[i] = f.z + Math.sin(ang) * r; chispa.y[i] = f.y + 0.1 + Math.random() * f.alto * 0.3;
        chispa.vx[i] = (Math.random() - 0.5) * 0.5; chispa.vz[i] = (Math.random() - 0.5) * 0.5; chispa.vy[i] = f.sube * (0.6 + Math.random() * 0.7);
        chispa.vida[i] = 0; chispa.dura[i] = 0.6 + Math.random() * 1.3;
      }
    }
    let vivas = 0;
    for (let i = 0; i < NCH; i++) {
      if (chispa.vida[i] >= 1) { puntos.ocultar(c0 + i); continue; }
      chispa.vida[i] += dt / chispa.dura[i];
      // el viento las lleva y el aire caliente las hace bailar
      chispa.vx[i] += (RX * vto * 1.6 + Math.sin(t * 9 + i) * 0.9) * dt;
      chispa.vz[i] += (RZ * vto * 1.6 + Math.cos(t * 8 + i * 1.7) * 0.9) * dt;
      chispa.vy[i] *= 1 - dt * 0.6;
      chispa.x[i] += chispa.vx[i] * dt; chispa.y[i] += chispa.vy[i] * dt; chispa.z[i] += chispa.vz[i] * dt;
      const v = chispa.vida[i];
      const centelleo = 0.65 + 0.35 * Math.sin(t * 31 + i * 2.3);
      const a = (1 - v) * (1 - v) * centelleo;
      puntos.poner(c0 + i, chispa.x[i], chispa.y[i], chispa.z[i], 4.5, 1.7 - v * 0.9, 0.35 - v * 0.25, a, 0.07, FORMA.brillo);
      vivas++;
    }
    info.chispas = vivas;
  }

  // -------------------------------------------------------------- huellas y salpicaduras
  function salpicar(x, y, z, n, fuerza) {
    for (let k = 0; k < n; k++) {
      const i = proxGotita; proxGotita = (proxGotita + 1) % NPA;
      const ang = Math.random() * 6.283, h = (0.6 + Math.random() * 0.9) * fuerza;
      gotita.x[i] = x + Math.cos(ang) * 0.06; gotita.z[i] = z + Math.sin(ang) * 0.06; gotita.y[i] = y + 0.02; gotita.piso[i] = y;
      gotita.vx[i] = Math.cos(ang) * h * 0.7; gotita.vz[i] = Math.sin(ang) * h * 0.7; gotita.vy[i] = 1.1 * h + Math.random() * 0.8;
      gotita.vida[i] = 0;
    }
  }
  function moverGotitas(dt, luzR, luzG, luzB) {
    let vivas = 0;
    for (let i = 0; i < NPA; i++) {
      if (gotita.vida[i] >= 1) { puntos.ocultar(p0 + i); continue; }
      gotita.vida[i] += dt / 0.55;
      gotita.vy[i] -= 9.8 * dt;
      gotita.x[i] += gotita.vx[i] * dt; gotita.y[i] += gotita.vy[i] * dt; gotita.z[i] += gotita.vz[i] * dt;
      if (gotita.y[i] < gotita.piso[i]) { gotita.vida[i] = 1; puntos.ocultar(p0 + i); continue; }
      puntos.poner(p0 + i, gotita.x[i], gotita.y[i], gotita.z[i], luzR, luzG, luzB, 0.85 * (1 - gotita.vida[i] * 0.5), 0.022, FORMA.gota);
      vivas++;
    }
    info.gotitas = vivas;
  }
  // ¿el suelo acá toma pisadas? nieve (invierno) o barro (mojado); el agua no
  function marcarPie(x, z, yaw, fuerza, escala, redonda) {
    if (T?.agua?.(x, z)) return;
    finas.pisada(x, z, yaw, fuerza, escala, redonda);
    info.huellas++;
  }
  function huellasYPasos(dt, ctx, mojado, invierno, nevando) {
    const js = ctx.js;
    if (js?.pos) finas.seguir(js.pos.x, js.pos.z);
    const charcos = mojado > 0.3 && invierno < 0.5;
    // (salpica donde se juntan los charcos: el camino, la tierra, el ripio y las lajas de la aldea; en el pasto, no)
    const charcoEn = (x, z) => charcos && !(T.pasto && T.val && T.val(T.pasto, x, z) > 0.55);
    // las tuyas: una cada medio paso, alternando el pie
    if (js?.pos && js.enSuelo !== false && !js.nadando && !js.enKayak && !js.enTren && !js.montado) {
      const d = Math.hypot(js.pos.x - yo.x, js.pos.z - yo.z);
      if (d > 0.42) {
        if (d < 3) {
          yo.pie = !yo.pie;
          const lado = yo.pie ? 0.12 : -0.12, c = Math.cos(js.yaw || 0), s = Math.sin(js.yaw || 0);
          const yaw = Math.atan2(-(js.pos.x - yo.x), -(js.pos.z - yo.z));
          const x = js.pos.x + c * lado, z = js.pos.z - s * lado;
          marcarPie(x, z, yaw, js.agachado ? 0.7 : 1, 1, false);
          if (charcoEn(x, z)) salpicar(x, T.altura(x, z), z, 5, (js.velocidadActual || 0) > 4 ? 1.3 : 0.8);
        }
        yo.x = js.pos.x; yo.z = js.pos.z;
      }
    }
    // las de la gente cercana (a menos de 24 m)
    const vistos = new Set();
    for (const g of ctx.gente?.gente || []) {
      if (!g?.pos || !g.g || !g.g.visible || g.dormido) continue;
      const id = g.clave || g.id || g;
      const dCam = Math.hypot(g.pos.x - ctx.cam.x, g.pos.z - ctx.cam.z);
      if (dCam > 24) continue;
      vistos.add(id);
      let u = pasosGente.get(id);
      if (!u) { u = { x: g.pos.x, z: g.pos.z, pie: false }; pasosGente.set(id, u); continue; }
      const d = Math.hypot(g.pos.x - u.x, g.pos.z - u.z);
      if (d < 0.55) continue;
      if (d < 3 && !(g.pos.y > T.altura(g.pos.x, g.pos.z) + 0.6)) {
        u.pie = !u.pie;
        const yaw = Math.atan2(-(g.pos.x - u.x), -(g.pos.z - u.z));
        const lado = u.pie ? 0.11 : -0.11, c = Math.cos(yaw), s = Math.sin(yaw);
        const x = g.pos.x + c * lado, z = g.pos.z - s * lado;
        marcarPie(x, z, yaw, 0.9, 1, false);
        if (dCam < 18 && charcoEn(x, z)) salpicar(x, T.altura(x, z), z, 5, 0.8);
      }
      u.x = g.pos.x; u.z = g.pos.z;
    }
    for (const id of [...pasosGente.keys()]) if (!vistos.has(id)) pasosGente.delete(id);
    // las de los animales (la lista que ya arma el juego para las huellas de siempre)
    const vistosF = new Set();
    for (const s of ctx.fauna || []) {
      if (!s?.pos || !s.id) continue;
      if (Math.abs(s.pos.x - finas.centro.x) > HUELLAS_LADO * 0.48 || Math.abs(s.pos.z - finas.centro.y) > HUELLAS_LADO * 0.48) continue;
      vistosF.add(s.id);
      const perfil = { huemul: [0.72, 0.8], zorro: [0.48, 0.55], guanaco: [0.82, 0.9], liebre: [0.58, 0.45], pudu: [0.42, 0.5] }[s.tipo] || [0.5, 0.5];
      let u = pasosFauna.get(s.id);
      if (!u) { pasosFauna.set(s.id, { x: s.pos.x, z: s.pos.z }); continue; }
      const d = Math.hypot(s.pos.x - u.x, s.pos.z - u.z);
      if (d >= perfil[0]) { if (d < 4) marcarPie(s.pos.x, s.pos.z, Math.atan2(-(s.pos.x - u.x), -(s.pos.z - u.z)), 0.7, perfil[1], true); u.x = s.pos.x; u.z = s.pos.z; }
    }
    for (const id of [...pasosFauna.keys()]) if (!vistosF.has(id)) pasosFauna.delete(id);
    finas.borrar(dt, nevando, mojado > 0.6 && invierno < 0.5);
    finas.subir();
    U.uHuellas.value = finas.tex; U.uHuellasLado.value = HUELLAS_LADO; U.uHuellasCentro.value.copy(finas.centro);
  }
  // la lluvia que rebota en el suelo, las piedras, la plaza y los techos: impactos alrededor de la cámara (más adelante que atrás)
  function rebotes(dt, ctx, lluvia, invierno, luzR, luzG, luzB) {
    const cam = ctx.cam;
    const cuantos = lluvia > 0.08 && invierno < 0.5 ? 1300 * lluvia : 0;
    acumImp += dt * cuantos;
    const adelanteX = -Math.sin(ctx.js?.yaw || 0), adelanteZ = -Math.cos(ctx.js?.yaw || 0);
    let n = 0;
    while (acumImp >= 1 && n < 120) {
      acumImp -= 1; n++;
      const i = proxImp; proxImp = (proxImp + 1) % NIMP;
      // dos de cada tres, delante de la cámara
      let dx = (Math.random() - 0.5) * 2, dz = (Math.random() - 0.5) * 2;
      const r = 1.2 + Math.sqrt(Math.random()) * 15;
      if (Math.random() < 0.67) { const a = Math.atan2(adelanteZ, adelanteX) + (Math.random() - 0.5) * 1.6; dx = Math.cos(a); dz = Math.sin(a); }
      else { const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; }
      const x = cam.x + dx * r, z = cam.z + dz * r;
      if (T.agua?.(x, z)) { imp.vida[i] = 1; continue; }   // (los anillos en el agua son del lago)
      let y = T.altura(x, z);
      const techo = ctx.techos?.techo?.(x, z);
      if (techo !== null && techo !== undefined && techo > y) y = techo;
      else if (ctx.bajoTecho) { imp.vida[i] = 1; continue; }
      imp.x[i] = x; imp.y[i] = y + 0.01; imp.z[i] = z; imp.vida[i] = 0;
      const ang = Math.random() * 6.283; imp.dx[i] = Math.cos(ang); imp.dz[i] = Math.sin(ang); imp.tam[i] = 0.09 + Math.random() * 0.07;
    }
    if (acumImp > 1) acumImp = 0;
    let vivos = 0;
    for (let i = 0; i < NIMP; i++) {
      const j = l0 + i * 3;
      if (imp.vida[i] >= 1) { puntos.ocultar(j); puntos.ocultar(j + 1); puntos.ocultar(j + 2); continue; }
      imp.vida[i] += dt / 0.3;
      const v = Math.min(imp.vida[i], 0.999);
      const x = imp.x[i], y = imp.y[i], z = imp.z[i];
      puntos.poner(j, x, y + imp.tam[i] * 0.2, z, luzR * 1.2, luzG * 1.2, luzB * 1.25, 0.9, imp.tam[i], FORMA.corona + Math.min(v * 1.6, 0.99));
      // dos gotitas que saltan en arco (de 6 a 14 cm)
      const h = Math.sin(Math.min(1, v * 1.3) * Math.PI) * imp.tam[i] * 1.3;
      const sep = v * imp.tam[i] * 1.4;
      puntos.poner(j + 1, x + imp.dx[i] * sep, y + h, z + imp.dz[i] * sep, luzR * 1.3, luzG * 1.3, luzB * 1.35, 0.8 * (1 - v), 0.016, FORMA.gota);
      puntos.poner(j + 2, x - imp.dx[i] * sep * 0.7, y + h * 0.8, z - imp.dz[i] * sep * 0.7, luzR * 1.3, luzG * 1.3, luzB * 1.35, 0.8 * (1 - v), 0.014, FORMA.gota);
      vivos++;
    }
    info.impactos = vivos;
  }

  // -------------------------------------------------------------- las luciérnagas
  function lugarLuciernaga(i, cam, cerca) {
    // en el prado y el borde del bosque (no adentro del bosque cerrado, ni en la estepa, ni en el agua); seis intentos
    for (let k = 0; k < 6; k++) {
      const a = Math.random() * 6.283, r = cerca ? 2.5 + Math.random() * 26 : 24 + Math.random() * 6;
      const x = cam.x + Math.cos(a) * r, z = cam.z + Math.sin(a) * r;
      if (T.agua?.(x, z)) continue;
      const bosque = T.val ? T.val(T.bosque, x, z) : 0.3, estepa = T.estepa && T.val ? T.val(T.estepa, x, z) : 0, pasto = T.pasto && T.val ? T.val(T.pasto, x, z) : 0.5;
      const borde = 1 - Math.abs(bosque - 0.42) / 0.42;
      const quiere = Math.max(borde, pasto * (1 - bosque) * 0.8) * (1 - estepa);
      if (Math.random() > quiere) continue;
      luci.x[i] = x; luci.z[i] = z; luci.alto[i] = 0.35 + Math.random() * 1.8; luci.ok[i] = 1;
      luci.per[i] = 1.6 + Math.random() * 2.6; luci.fase[i] = Math.random();
      return;
    }
    luci.ok[i] = 0;
  }
  function moverLuciernagas(dt, ctx, hay, noche) {
    if (!hay) { if (luciListas) { for (let i = 0; i < NLU; i++) puntos.ocultar(f0 + i); luciListas = false; } info.luciernagas = 0; return; }
    const cam = ctx.cam, t = U.uTiempo.value;
    if (!luciListas) { for (let i = 0; i < NLU; i++) lugarLuciernaga(i, cam, true); luciListas = true; }
    const fuerza = clamp((noche - 0.6) * 2.5, 0, 1);
    let prendidas = 0;
    for (let i = 0; i < NLU; i++) {
      if (Math.abs(luci.x[i] - cam.x) > 30 || Math.abs(luci.z[i] - cam.z) > 30) lugarLuciernaga(i, cam, false);
      if (!luci.ok[i]) { puntos.ocultar(f0 + i); continue; }
      luci.x[i] += Math.sin(t * 0.5 + i * 1.7) * 0.35 * dt;
      luci.z[i] += Math.cos(t * 0.43 + i * 2.3) * 0.35 * dt;
      const d = destelloLuciernaga(t, luci.per[i], luci.fase[i]);
      // mientras destella sube un poquito (la jota de la luciérnaga)
      const y = T.altura(luci.x[i], luci.z[i]) + luci.alto[i] + Math.sin(t * 0.7 + i) * 0.25 + d * 0.12;
      const a = (0.05 + 0.95 * d) * fuerza;
      puntos.poner(f0 + i, luci.x[i], y, luci.z[i], 1.5 + 3.4 * d, 2.6 + 3.8 * d, 0.45 + 0.7 * d, a, 0.14 + 0.12 * d, FORMA.brillo);
      if (d > 0.3) prendidas++;
    }
    info.luciernagas = prendidas;
  }

  // -------------------------------------------------------------- los pájaros
  function sitioBandada(cam, js) {
    const yaw = js?.yaw || 0;
    for (let k = 0; k < 30; k++) {
      const a = Math.atan2(-Math.cos(yaw), -Math.sin(yaw)) + (Math.random() - 0.5) * 1.5;
      const r = 13 + Math.random() * 12;
      const x = cam.x + Math.cos(a) * r, z = cam.z + Math.sin(a) * r;
      if (T.agua?.(x, z)) continue;
      const bosque = T.val ? T.val(T.bosque, x, z) : 0;
      if (bosque > 0.5) continue;
      // en el suelo abierto (el camino, la tierra, la plaza, el pasto corto): en el pasto alto no se los vería
      const pasto = T.pasto && T.val ? T.val(T.pasto, x, z) : 0, sendero = T.distSendero && T.val ? T.val(T.distSendero, x, z) : 99;
      if (!(sendero < 0.9 || pasto < 0.2)) continue;
      const h = T.altura(x, z);
      if (Math.abs(T.altura(x + 1.5, z) - h) > 0.6 || Math.abs(T.altura(x, z + 1.5) - h) > 0.6) continue;
      return { x, z };
    }
    return null;
  }
  function moverPajaros(dt, ctx, dia, lluvia) {
    const cam = ctx.cam, js = ctx.js, t = U.uTiempo.value;
    const puede = dia > 0.3 && lluvia < 0.45 && !ctx.bajoTecho;
    const ocultarTodos = () => { for (let i = 0; i < NPJ; i++) puntos.ocultar(b0 + i); };
    if (bandada.estado === 'nada') {
      ocultarTodos();
      bandada.espera -= dt;
      if (!puede || bandada.espera > 0) { info.pajaros = 'nada'; return; }
      const s = sitioBandada(cam, js);
      if (!s) { bandada.espera = 2; return; }
      bandada.estado = 'suelo'; bandada.x = s.x; bandada.z = s.z; bandada.t = 0; bandada.alfa = 0;
      bandada.n = 7 + Math.floor(Math.random() * (NPJ - 8));
      for (let i = 0; i < bandada.n; i++) {
        const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 1.7;
        pj.x[i] = s.x + Math.cos(a) * r; pj.z[i] = s.z + Math.sin(a) * r; pj.y[i] = T.altura(pj.x[i], pj.z[i]);
        pj.salto[i] = Math.random() * 3; pj.lado[i] = Math.random() < 0.5 ? 0 : 1; pj.fase[i] = Math.random() * 6.28;
      }
    }
    const dJug = Math.hypot((js?.pos?.x ?? cam.x) - bandada.x, (js?.pos?.z ?? cam.z) - bandada.z);
    if (bandada.estado === 'suelo') {
      bandada.t += dt;
      bandada.alfa = Math.min(1, bandada.alfa + dt * 0.7);
      const corre = (js?.velocidadActual || 0) > 4;
      // se espantan si te acercás (más lejos si venís corriendo), o si se hace de noche o llueve fuerte
      if (dJug < (corre ? 12 : 7.5) || !puede) {
        bandada.estado = 'vuelo'; bandada.t = 0; info.espantadas++;
        const px = js?.pos?.x ?? cam.x, pz = js?.pos?.z ?? cam.z;
        for (let i = 0; i < bandada.n; i++) {
          let ax = pj.x[i] - px, az = pj.z[i] - pz; const l = Math.hypot(ax, az) || 1; ax /= l; az /= l;
          const giro = (Math.random() - 0.5) * 1.1, c = Math.cos(giro), s = Math.sin(giro), v = 5 + Math.random() * 3.5;
          pj.vx[i] = (ax * c - az * s) * v; pj.vz[i] = (ax * s + az * c) * v; pj.vy[i] = 2.6 + Math.random() * 1.8;
          pj.salto[i] = Math.random() * 0.25;   // (no salen todos en el mismo instante)
        }
      } else if (Math.hypot(cam.x - bandada.x, cam.z - bandada.z) > 60) { bandada.estado = 'nada'; bandada.espera = 2; return; }
      for (let i = 0; i < bandada.n; i++) {
        // picotean y dan saltitos
        pj.salto[i] -= dt;
        let y = pj.y[i];
        if (pj.salto[i] < 0) {
          const k = -pj.salto[i];
          if (k < 0.18) { y += Math.sin(k / 0.18 * Math.PI) * 0.06; pj.x[i] += (pj.lado[i] ? -1 : 1) * 0.6 * dt; }
          else { pj.salto[i] = 0.8 + Math.random() * 3; if (Math.random() < 0.25) pj.lado[i] = 1 - pj.lado[i]; pj.y[i] = T.altura(pj.x[i], pj.z[i]); }
        }
        const pica = Math.sin(t * 4 + pj.fase[i]) > 0.55 ? 0.99 : 0;
        puntos.poner(b0 + i, pj.x[i], y + 0.1, pj.z[i], 0.07, 0.065, 0.06, 0.95 * bandada.alfa, 0.3, FORMA.posado + pj.lado[i] * 0.5 + pica * 0.49);
      }
      for (let i = bandada.n; i < NPJ; i++) puntos.ocultar(b0 + i);
      info.pajaros = 'suelo';
      return;
    }
    if (bandada.estado === 'vuelo') {
      bandada.t += dt;
      const fade = 1 - clamp((bandada.t - 4.5) / 1.5, 0, 1);
      for (let i = 0; i < bandada.n; i++) {
        if (bandada.t < pj.salto[i]) continue;
        pj.vy[i] = Math.max(0.6, pj.vy[i] - dt * 0.5);
        pj.vx[i] *= 1 + dt * 0.15; pj.vz[i] *= 1 + dt * 0.15;
        pj.x[i] += pj.vx[i] * dt; pj.y[i] += pj.vy[i] * dt; pj.z[i] += pj.vz[i] * dt;
        const aleteo = Math.sin(t * 26 + pj.fase[i]) * 0.5 + 0.5;
        puntos.poner(b0 + i, pj.x[i], pj.y[i] + 0.15, pj.z[i], 0.07, 0.065, 0.06, 0.95 * fade, 0.5, FORMA.vuelo + Math.min(aleteo, 0.99));
      }
      info.pajaros = 'vuelo';
      if (fade <= 0) { bandada.estado = 'nada'; bandada.espera = 10 + Math.random() * 18; }
    }
  }

  // -------------------------------------------------------------- las telarañas
  function buscarTelas(ctx) {
    listaTelas.length = 0;
    const cam = ctx.cam;
    const matas = ctx.veg?.matasCerca ? ctx.veg.matasCerca(cam.x, cam.z, 24, []) : [];
    for (const m of matas) {
      if (!m || !TIPOS_ARBUSTO.has(m.tipo) || m.sacado) continue;
      const hh = hash2(Math.round(m.x * 10), Math.round(m.z * 10));
      if (hh > 0.55) continue;
      const esc = m.esc || 1, giro = hh * 40;
      const off = 0.42 * esc;
      const x = m.x + Math.sin(giro) * off, z = m.z + Math.cos(giro) * off;
      listaTelas.push({ x, y: T.altura(m.x, m.z) + (0.45 + hash(hh * 7) * 0.4) * esc, z, giro, inclina: (hash(hh * 3) - 0.5) * 0.5, tam: 0.32 + hash(hh * 5) * 0.2, semilla: hh * 9, d: Math.hypot(x - cam.x, z - cam.z) });
    }
    for (const o of ctx.obras?.obras || []) {
      if (!o?.plano || !TIPOS_CERCO.has(o.plano.id) || !o.datos) continue;
      const { x, z } = o.datos;
      if (Math.hypot(x - cam.x, z - cam.z) > 24) continue;
      const hh = hash2(Math.round(x * 10) + 3, Math.round(z * 10));
      if (hh > 0.7) continue;
      const rot = o.datos.rot || 0, medio = (o.plano.ancho || 3) * 0.5 - 0.25;
      // en la esquina de un poste, en el plano del cerco
      const lado = hh < 0.35 ? 1 : -1;
      const px = x + Math.cos(rot) * medio * lado, pz = z - Math.sin(rot) * medio * lado;
      listaTelas.push({ x: px, y: (o.datos.y ?? T.altura(px, pz)) + 0.7 + hash(hh) * 0.3, z: pz, giro: rot, inclina: (hash(hh * 2) - 0.5) * 0.3, tam: 0.42 + hash(hh * 4) * 0.2, semilla: hh * 9, d: Math.hypot(px - cam.x, pz - cam.z) });
    }
    listaTelas.sort((a, b) => a.d - b.d);
    telas.poner(listaTelas);
    info.telas = Math.min(listaTelas.length, MAX_TELAS);
  }

  // -------------------------------------------------------------- cada cuadro
  function revisar(quiere, dt, ctx = {}) {
    if (quiere && !activo) prender(ctx);
    else if (!quiere && activo) apagar();
    if (!activo || !ctx.cam) return;
    dt = Math.min(Math.max(dt || 0, 0), 0.1);
    const lluvia = clima?.estado?.lluvia || 0, invierno = U.uInvierno.value, mojado = U.uMojado.value;
    const nevando = invierno > 0.5 && lluvia > 0.05;
    const amb = U.uAmbiente.value, sol = U.uSolColor.value;
    const luzR = amb.r * 2.2 + sol.r * 0.35, luzG = amb.g * 2.2 + sol.g * 0.35, luzB = amb.b * 2.2 + sol.b * 0.35;
    // las huellas de Alta en pausa: las finas las reemplazan
    if (ctx.huellas && huellasAlta !== ctx.huellas) { huellasAlta?.reponer?.(); huellasAlta = ctx.huellas; huellasAlta.pausar?.(true); }
    juntarFuegos();
    llamas.poner(fuegos);
    moverChispas(dt);
    huellasYPasos(dt, ctx, mojado, invierno, nevando);
    moverGotitas(dt, luzR, luzG, luzB);
    const cb = U.uCieloBajo.value;
    rebotes(dt, ctx, lluvia, invierno, luzR * 0.5 + cb.r * 1.1 + 0.08, luzG * 0.5 + cb.g * 1.1 + 0.08, luzB * 0.5 + cb.b * 1.1 + 0.09);
    moverLuciernagas(dt, ctx, hayLuciernagas(ctx.noche ?? 0, U.uOtono.value, invierno, lluvia) && !ctx.bajoTecho, ctx.noche ?? 0);
    moverPajaros(dt, ctx, ctx.dia ?? 1, lluvia);
    const rocio = rocioTelas(ctx.horas, lluvia, invierno);
    telas.mat.uniforms.uRocio.value = rocio;
    telas.malla.visible = rocio > 0.01 && telas.malla.count > 0;
    acumTelas += dt;
    if (rocio > 0.01 && (acumTelas > 2 || Math.hypot(ctx.cam.x - telasCx, ctx.cam.z - telasCz) > 4)) { acumTelas = 0; telasCx = ctx.cam.x; telasCz = ctx.cam.z; buscarTelas(ctx); telas.malla.visible = telas.malla.count > 0; }
    puntos.subir();
  }
  function revisarAjustes(ajustes, calidadActiva, dt, ctx) { revisar(esUltra(ajustes) && calidadActiva === 'alta', dt, ctx); }
  return {
    revisar, revisarAjustes, apagar, info,
    get activo() { return activo; }, get llamas() { return llamas; }, get puntos() { return puntos; }, get telas() { return telas; }, get finas() { return finas; },
    get bandada() { return bandada; }, get fuegos() { return fuegos; }, temblor,
  };
}
