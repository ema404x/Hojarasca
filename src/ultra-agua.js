// 4.29.0 (Ultra, A): el agua del nivel Ultra. Nada de esto existe con Ultra apagado: el lago y el arroyo dibujan con su material de siempre
// (agua.js) y la composición es la de Alta. Con Ultra, ultra-luz-mundo.js le pone al lago y al arroyo OTRO material (el de siempre con estos
// agregados: otro programa, el de Alta no se toca) y suma el reflejo del lago a su composición:
//   · el lago refleja de verdad lo que hay en pantalla (la orilla de enfrente, los árboles, el cielo con sus nubes), ondulado por el viento,
//     buscando sobre la profundidad de la escena (en la composición: sólo cuesta donde hay agua);
//   · anillos en el agua cuando llueve y cuando caminás por la orilla o el agua baja (los mismos en el material y en el reflejo);
//   · el arroyo: espuma que corre y se junta donde el agua rompe (las piedras del fondo, las bajadas) y chispas del sol en el agua batida.
import * as THREE from 'three';
import { REFLEJO_LAGO, PISADAS_AGUA } from './ultra-luz.js';

const NL = String.fromCharCode(10);

// Los anillos (devuelven cuánto se inclina el agua en x y z). Necesitan `uPasosU` (x, z, cuándo, fuerza) y `uAhoraAU` (segundos).
export const GLSL_ANILLOS = `
  uniform vec4 uPasosU[${PISADAS_AGUA.max}];
  uniform float uAhoraAU;
  uniform float uLluviaAU;
  float hashAU(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnAU(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hashAU(i), hashAU(i + vec2(1.0, 0.0)), u.x), mix(hashAU(i + vec2(0.0, 1.0)), hashAU(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  vec2 anillosAguaU(vec2 xz) {
    vec2 g = vec2(0.0);
    // las gotas de la lluvia: tres capas de celdas chicas (unos 25 cm), cada gota abre dos o tres crestas que se ensanchan y se apagan (más
    // gotas cuanto más llueve)
    if (uLluviaAU > 0.02) {
      for (int k = 0; k < 3; k++) {
        vec2 c = xz * (3.4 + float(k) * 1.3) + float(k) * 7.3;
        vec2 id = floor(c);
        vec2 f = fract(c) - 0.5 - (vec2(hashAU(id), hashAU(id + 3.1)) - 0.5) * 0.5;
        float ciclo = uAhoraAU * (1.1 + 0.3 * float(k)) + hashAU(id + 9.7);
        float t = fract(ciclo);
        float r = length(f);
        float x = r - t * 0.48;
        float vivo = step(hashAU(id + 5.3 + floor(ciclo)), 0.25 + 0.75 * uLluviaAU);
        g += f / max(r, 1e-3) * sin(x * 75.0) * exp(-x * x * 260.0) * (1.0 - t) * (1.0 - t) * vivo;
      }
    }
    // tus pasos: de cada pisada salen anillos que se abren y se apagan
    for (int i = 0; i < ${PISADAS_AGUA.max}; i++) {
      vec4 p = uPasosU[i];
      float edad = uAhoraAU - p.z;
      if (p.w <= 0.0 || edad < 0.0 || edad > ${PISADAS_AGUA.vida.toFixed(1)}) continue;
      vec2 dv = xz - p.xy;
      float r = length(dv);
      float x = r - (0.08 + edad * 0.95);
      float vida = 1.0 - edad / ${PISADAS_AGUA.vida.toFixed(1)};
      g += dv / max(r, 1e-3) * sin(x * 24.0) * exp(-x * x * 14.0) * vida * vida * p.w * 1.4 / (1.0 + r * 0.8);
    }
    return g;
  }
`;

// ------------------------------------------------------------------ el material del agua de Ultra (el de agua.js con agregados)
const AGUA_UNIFORMES = `
      uniform vec4 uPasosU[${PISADAS_AGUA.max}];
      uniform float uAhoraAU;
      uniform float uLluviaAU;
`;
// (las funciones van después de GLSL_COMUN: usan sólo lo suyo)
const AGUA_FUNCIONES = GLSL_ANILLOS.replace(/\s*uniform [^;]+;/g, '');
// los anillos inclinan el agua (el cielo que espeja se rompe en círculos); en el arroyo que corre, no
const AGUA_ANILLOS = `
        {
          vec2 gU = anillosAguaU(vPos.xz) * (0.35 + 0.65 * detalle) * (1.0 - smoothstep(0.6, 1.6, length(vFlujo)));
          N = normalize(N + vec3(gU.x, 0.0, gU.y) * 0.32);
        }
`;
// el arroyo: espuma que corre y chispas de sol donde el agua va rápido
const AGUA_ARROYO = `
        float espumaU = 0.0;
        if (corre352 > 0.01) {
          vec2 flU = vCauce;
          float velU = length(vFlujo);
          float tfU = uTiempo * (0.9 + velU * 1.3);
          float bajadaU = smoothstep(2.2, 3.0, velU);
          // donde rompe: las olas paradas sobre las piedras del fondo (las mismas del agua de siempre) y las bajadas
          float rompeU = smoothstep(0.5, 0.78, vnoise(flU * vec2(0.55, 0.8) + 9.0));
          float cantU = corre352 * (0.3 + 0.7 * max(rompeU, bajadaU));
          // madejas de espuma estiradas a lo largo de la corriente, que bajan con el agua
          float madejaU = vnoise(vec2(flU.x * 1.1 - tfU * 1.6, flU.y * 3.2)) * 0.6 + vnoise(vec2(flU.x * 3.4 - tfU * 2.8, flU.y * 8.5 + 4.0)) * 0.4;
          espumaU = smoothstep(0.56 - 0.3 * cantU, 0.86, madejaU) * cantU;
          // burbujas sueltas que pasan
          vec2 cbU = vec2(flU.x * 5.0 - tfU * 4.0, flU.y * 8.0);
          vec2 ibU = floor(cbU);
          espumaU = clamp(espumaU + step(0.8, hash12(ibU)) * smoothstep(0.34, 0.1, length(fract(cbU) - 0.5)) * cantU * 0.7, 0.0, 1.0);
          vec3 blancoU = uAmbiente * 2.7 + uSolColor * max(uSolDir.y, 0.0) * 1.0 + uHorizonte * 0.12;
          col = mix(col, blancoU, espumaU * 0.85);
          // chispas: el sol en el agua batida titila rápido (cada celda a su ritmo)
          vec2 cgU = vec2(flU.x * 6.0 - tfU * 2.5, flU.y * 6.5);
          vec2 igU = floor(cgU);
          float hgU = hash12(igU + 3.7);
          float chispaU = step(0.86, hgU) * pow(max(0.0, sin(uTiempo * (8.0 + hgU * 13.0) + hgU * 60.0)), 8.0) * smoothstep(0.38, 0.04, length(fract(cgU) - 0.5));
          col += (uSolColor * 2.6 + uHorizonte * 0.4) * chispaU * corre352 * (0.45 + rompeU + bajadaU) * smoothstep(-0.02, 0.2, uSolDir.y) * (1.0 - uLluvia * 0.7) * (0.3 + 0.7 * detalle);
        }
`;
const AGUA_ALFA = `
        alfa = max(alfa, espumaU * 0.95 * smoothstep(0.0, 0.05, prof));   // 4.29.0 (Ultra): la espuma del arroyo tapa
`;

const insertar = (texto, marca, antes, agregado) => {
  const i = texto.indexOf(marca);
  if (i < 0) throw new Error('Ultra (agua): no se encuentra «' + marca.trim().slice(0, 40) + '»');
  return antes ? texto.slice(0, i) + agregado + texto.slice(i) : texto.slice(0, i + marca.length) + agregado + texto.slice(i + marca.length);
};

// El fragmento del agua de Ultra, a partir del de siempre (agua.js)
export function fragmentoAguaUltra(base) {
  let f = insertar(base, 'varying vec3 vPos; varying vec2 vFlujo; varying vec2 vCauce;' + NL + '      // 4.12.1', true, AGUA_UNIFORMES + '      ');
  f = insertar(f, '      float ondas(vec2 p, float detalle) {', true, AGUA_FUNCIONES + NL);
  f = insertar(f, '        vec3 N = normalize(vec3((n0 - nx) / e * fuerza * 0.08, 1.0, (n0 - nz) / e * fuerza * 0.08));' + NL, false, AGUA_ANILLOS);
  f = insertar(f, '        float alineadoSol = max(dot(R, uSolDir), 0.0);', true, AGUA_ARROYO.trimStart() + '        ');
  f = insertar(f, '        gl_FragColor = vec4(col, alfa);', true, AGUA_ALFA.trimStart() + '        ');
  return f;
}

// `comun`: { uPasosU, uAhoraAU, uLluviaAU } (los mismos objetos que usa la composición)
export function crearAguaUltra(base, comun) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...base.uniforms, ...comun },
    vertexShader: base.vertexShader, fragmentShader: fragmentoAguaUltra(base.fragmentShader),
    fog: base.fog, transparent: base.transparent, depthWrite: base.depthWrite,
  });
  m.name = 'agua-ultra';
  return m;
}

// ------------------------------------------------------------------ el reflejo del lago (en la composición de Ultra)
// Para cada píxel: si el rayo de la vista cruza el espejo del lago antes que lo que hay en la profundidad (el fondo bajo el agua), ese
// píxel es agua. Ahí se inclina el espejo con las ondas del viento y los anillos, y el rayo reflejado se busca en la pantalla (pasos que se
// alargan, con un afinado al final); si no pega en nada pero sale al cielo que se ve en pantalla, toma ese cielo. Se mezcla con Fresnel.
export const GLSL_REFLEJO_FUNCIONES = `
  uniform mat4 uCamMundoC;
  uniform mat4 uVistaC;
  uniform mat4 uProyC;
  uniform vec3 uCamPosC;
  uniform vec4 uLagoC;
  uniform float uLagoVis;
  uniform float uVientoC;
  ${GLSL_ANILLOS}
  vec2 olasVientoU(vec2 xz) {
    vec2 a = xz * 0.85 + vec2(uAhoraAU * 0.32, uAhoraAU * 0.11);
    vec2 b = xz * 2.7 - vec2(uAhoraAU * 0.47, -uAhoraAU * 0.29);
    const float e = 0.12;
    float h0 = vnAU(a) + 0.45 * vnAU(b);
    float hx = vnAU(a + vec2(e * 0.85, 0.0)) + 0.45 * vnAU(b + vec2(e * 2.7, 0.0));
    float hz = vnAU(a + vec2(0.0, e * 0.85)) + 0.45 * vnAU(b + vec2(0.0, e * 2.7));
    return vec2(hx - h0, hz - h0) / e;
  }
  vec2 aPantallaU(vec3 p, out float w) { vec4 q = uProyC * (uVistaC * vec4(p, 1.0)); w = q.w; return q.xy / q.w * 0.5 + 0.5; }
  float zEscenaU(vec2 uv) { float d = texture2D(uProf, uv).r; return d >= 0.999999 ? 1e6 : -posVistaC(uv, d).z; }
  vec3 reflejoLagoU(vec2 uv, vec3 c) {
    float dL = texture2D(uProf, uv).r;
    vec3 ro = uCamPosC;
    vec3 pw = (uCamMundoC * vec4(posVistaC(uv, min(dL, 0.99999)), 1.0)).xyz;
    vec3 rd = normalize(pw - ro);
    if (ro.y <= uLagoC.w + 0.03 || rd.y > -0.002) return c;
    float tP = (uLagoC.w - ro.y) / rd.y;
    float tS = dL >= 0.999999 ? 1e6 : length(pw - ro);
    if (tP > tS - 0.01 || tP > ${REFLEJO_LAGO.lejos.toFixed(1)}) return c;
    vec3 hp = ro + rd * tP;
    if (max(abs(hp.x - uLagoC.x), abs(hp.z - uLagoC.y)) > uLagoC.z) return c;
    float prof = (tS - tP) * -rd.y;
    float cerca = 1.0 - smoothstep(50.0, 220.0, tP);
    vec2 g = olasVientoU(hp.xz) * (0.01 + 0.025 * uVientoC) * (0.3 + 0.7 * cerca) + anillosAguaU(hp.xz) * 0.3 * cerca;
    vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
    vec3 r = reflect(rd, n);
    r.y = max(r.y, 0.012);
    vec3 hitC = vec3(0.0);
    float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float hit = 0.0, w = 1.0, tA = 0.0, t = 0.3 + 0.5 * jit;
    for (int i = 0; i < ${REFLEJO_LAGO.pasos}; i++) {
      vec2 s = aPantallaU(hp + r * t, w);
      if (w <= 0.0 || s.x < 0.0 || s.x > 1.0 || s.y < 0.0 || s.y > 1.0) break;
      float zs = zEscenaU(s);
      if (w > zs && w < zs + max(0.8, (t - tA) * 1.3)) {
        // afinar entre el paso de antes y éste
        float a = tA, b = t;
        for (int j = 0; j < 4; j++) { float m = 0.5 * (a + b); vec2 sm = aPantallaU(hp + r * m, w); if (w > zEscenaU(sm)) b = m; else a = m; }
        s = aPantallaU(hp + r * b, w);
        hitC = texture2D(uColor, s).rgb;
        vec2 bs = min(s, 1.0 - s);
        hit = smoothstep(0.0, 0.05, min(bs.x, bs.y)) * (1.0 - smoothstep(0.75, 1.0, float(i) / ${REFLEJO_LAGO.pasos}.0));
        break;
      }
      tA = t;
      t = t * 1.42 + 0.35;
    }
    if (hit < 0.01) {
      // no pegó en nada cerca: lo lejano que se ve en pantalla en esa dirección (los cerros, la cordillera, el cielo con sus nubes de verdad)
      vec4 q = uProyC * vec4(mat3(uVistaC) * r, 0.0);
      if (q.w > 0.0) {
        vec2 s = q.xy / q.w * 0.5 + 0.5;
        vec2 bs = min(s, 1.0 - s);
        if (min(bs.x, bs.y) > 0.0 && zEscenaU(s) > ${REFLEJO_LAGO.lejano.toFixed(1)}) { hitC = texture2D(uColor, s).rgb; hit = smoothstep(0.0, 0.05, min(bs.x, bs.y)) * 0.85; }
      }
    }
    if (hit < 0.01) return c;
    float fres = 0.02 + 0.98 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
    float k = hit * clamp(0.28 + fres * 1.2, 0.0, 0.88) * smoothstep(0.03, 0.4, prof);
    return mix(c, hitC * vec3(0.74, 0.84, 0.84), k);
  }
`;
export const GLSL_REFLEJO = `
    if (uLagoVis > 0.5) c = reflejoLagoU(vUv, c);
`;
