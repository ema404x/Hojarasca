// 4.29.0 (Ultra, A): lo que el cielo de Ultra suma al cielo pintado (cielo.js), además de la dispersión de la 4.28.0. Sólo texto de shader:
// lo inserta `fragmentoCieloUltra` (ultra-luz-mundo.js) en el material del cielo de Ultra (otro programa; el de Alta no cambia).
//   · nubes con volumen: la luz del sol las atraviesa y se apaga con lo que encuentra (dos pasos más hacia el sol), la panza espesa más
//     oscura, el borde fino plateado a contraluz, el contorno en coliflor;
//   · de noche, la Vía Láctea (una banda con nudos de estrellas y franjas de polvo, más ancha y tibia hacia el centro) y estrellas finitas y
//     brillantes que titilan, cada una a su ritmo, más cerca del horizonte, con un dejo de color;
//   · el halo de la luna con humedad (la corona suave y el anillo grande de 22 grados);
//   · el relámpago: el cielo se enciende un instante, más del lado donde cae, con el rayo quebrado bajando de las nubes.
// También el texto de las sombras de las nubes en el valle (lo usa la pasada de la niebla, que ya tiene la posición de cada píxel).
import { NUBES_ULTRA } from './ultra-luz.js';

export const CIELO_UNIFORMES = `
uniform float uUltraNubesU;
uniform float uUltraNocheU;
uniform float uHumedadLunaU;
uniform vec4 uRelampagoU;
uniform float uSemillaRayoU;
`;

// (antes del main: el ruido 3D de la Vía Láctea; hash31 es el del cielo)
export const CIELO_FUNCIONES = `
      float vn3U(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
      }
`;

// (antes de mezclar la nube con el cielo)
export const CIELO_VOLUMEN = `
          if (uUltraNubesU > 0.5) {
            // 4.29.0 (Ultra): la nube con volumen: la luz del sol la atraviesa y se apaga con lo que encuentra (dos pasos más hacia el sol), la
            // panza espesa queda gris azulada, el borde que da al sol se enciende y, con el sol detrás, el borde fino se platea; contorno en coliflor
            float espU = smoothstep(umbral, umbral + 0.28, n);
            float n2U = fbm((uv + haciaLuz * 2.4) * 1.05 + viento);
            float odU = max(nLuz - umbral, 0.0) * 1.2 + max(n2U - umbral, 0.0) + espU * 0.3;
            float tranU = exp(-odU * 7.0);
            float polvoU = 1.0 - exp(-espU * 4.0 - 0.25);
            float colifU = vnoise(uv * 12.0 + viento * 3.0);
            cobertura = clamp(cobertura + (colifU - 0.5) * 0.3 * (1.0 - espU), 0.0, 1.0);
            vec3 solU = uSolColor * mix(vec3(1.0), vec3(1.0, 0.84, 0.7), uTarde) * 1.45;
            vec3 panzaU = mix(uHorizonte, uCenit, 0.35) * vec3(0.8, 0.82, 0.92) * (0.66 - 0.26 * espU);
            vec3 volU = panzaU + solU * tranU * polvoU * (0.55 + 0.45 * uDia) * (0.85 + 0.3 * colifU);
            volU += solU * pow(ds, 8.0) * (1.0 - espU) * 1.4;
            nube = mix(nube, volU, 0.8 * smoothstep(0.05, 0.4, uDia) * (1.0 - nubLocal * 0.5));
          }
`;

// (antes de la luna)
export const CIELO_NOCHE = `
        if (uUltraNocheU > 0.001 && noche > 0.02 && h > -0.02) {
          // 4.29.0 (Ultra): la Vía Láctea (nubes de estrellas, el polvo fino y las franjas oscuras, más ancha y tibia hacia el centro) y las estrellas
          // que titilan. El ruido es 3D, sobre la dirección: sin costuras ni rayas
          float verU = noche * smoothstep(0.0, 0.18, h) * (1.0 - uNublado) * uEstrellas * uUltraNocheU;
          vec3 poloU = normalize(vec3(0.3, 0.45, 0.84));
          vec3 ejeAU = normalize(cross(poloU, vec3(0.0, 1.0, 0.0)));
          vec3 ejeBU = cross(poloU, ejeAU);
          float bU = dot(d, poloU);
          vec2 eU = vec2(dot(d, ejeAU), dot(d, ejeBU));
          float centroU = 0.5 + 0.5 * dot(eU / max(length(eU), 1e-4), vec2(0.6216, 0.7833));
          float anchoU = 0.09 + 0.1 * centroU;
          float bandaU = exp(-bU * bU / (anchoU * anchoU));
          float viaU = 0.0, polvoU = 0.0;
          if (bandaU > 0.01) {
            float grumosU = vn3U(d * 8.0 + 3.0) * 0.6 + vn3U(d * 17.0 + 7.0) * 0.4;
            float granoU = vn3U(d * 90.0 + 1.0);
            polvoU = smoothstep(0.5, 0.7, vn3U(d * 6.0 + 11.0) * 0.6 + vn3U(d * 14.0 + 5.0) * 0.4) * exp(-bU * bU / (anchoU * anchoU * 0.45));
            viaU = bandaU * (0.3 + 0.7 * centroU) * (0.1 + grumosU) * (0.6 + 0.8 * granoU) * (1.0 - 0.8 * polvoU);
          }
          vec3 colViaU = mix(vec3(0.5, 0.56, 0.78), vec3(0.95, 0.85, 0.7), centroU * bandaU);
          vec3 qU = d * 700.0;
          float rU = hash31(floor(qU) + 13.0);
          float finasU = smoothstep(0.9986 - 0.007 * bandaU * (1.0 - polvoU), 1.0, rU) * smoothstep(0.5, 0.1, length(fract(qU) - 0.5));
          vec3 q2U = d * 170.0;
          float r2U = hash31(floor(q2U) + 29.0);
          float brillanteU = smoothstep(0.9975, 1.0, r2U) * smoothstep(0.42, 0.0, length(fract(q2U) - 0.5));
          float titU = pow(0.5 + 0.5 * sin(uTiempo * (2.0 + r2U * 9.0) + r2U * 90.0), 2.0);
          titU = mix(1.0, 0.15 + 0.85 * titU, 0.55 + 0.45 * (1.0 - smoothstep(0.1, 0.6, h)));
          vec3 tonoU = mix(vec3(0.72, 0.84, 1.0), vec3(1.0, 0.84, 0.62), fract(r2U * 37.0));
          col += (colViaU * viaU * 0.085 + vec3(finasU) * 0.5 + tonoU * brillanteU * titU * 1.5) * verU;
        }
`;

// (antes de las nubes: después de la luna)
export const CIELO_LUNA = `
        if (uUltraNocheU > 0.001 && noche > 0.02) {
          // 4.29.0 (Ultra): el halo de la luna con humedad: la corona suave y el anillo de 22 grados (rojizo por dentro)
          float aU = acos(clamp(dl, -1.0, 1.0));
          float coronaU = exp(-aU / 0.03) * 0.5 + exp(-aU / 0.11) * 0.28 + exp(-aU / 0.35) * 0.08;
          float anilloU = exp(-pow((aU - 0.384) / 0.022, 2.0));
          vec3 colAnU = mix(vec3(1.0, 0.76, 0.58), vec3(0.76, 0.86, 1.0), smoothstep(-0.02, 0.03, aU - 0.384));
          col += (vec3(0.62, 0.7, 0.88) * coronaU * (0.2 + 0.8 * uHumedadLunaU) + colAnU * anilloU * 0.16 * uHumedadLunaU)
            * noche * uIluminada * smoothstep(-0.05, 0.05, uLuna.y) * (1.0 - uNublado * 0.55) * uUltraNocheU;
        }
`;

// (antes de escribir el color)
export const CIELO_RELAMPAGO = `
        if (uRelampagoU.w > 0.001) {
          // 4.29.0 (Ultra): el relámpago enciende el cielo, más del lado donde cae, y se ve el rayo quebrado
          float drU = max(dot(d, normalize(uRelampagoU.xyz)), 0.0);
          col += (col * 0.5 + vec3(0.76, 0.83, 1.0) * (0.08 + 1.2 * pow(drU, 5.0))) * uRelampagoU.w * smoothstep(-0.12, 0.08, h);
          float topeU = uRelampagoU.y + 0.03;
          if (h > -0.02 && h < topeU) {
            float azU = atan(d.x, d.z) - atan(uRelampagoU.x, uRelampagoU.z);
            azU = mod(azU + 3.14159265, 6.2831853) - 3.14159265;
            float zigU = (vnoise(vec2(h * 38.0, uSemillaRayoU)) - 0.5) * 0.035 + (vnoise(vec2(h * 150.0, uSemillaRayoU + 5.0)) - 0.5) * 0.009;
            float lineaU = smoothstep(0.0045, 0.0, abs(azU * cos(h) - zigU)) * smoothstep(topeU, topeU - 0.03, h);
            col += vec3(0.92, 0.95, 1.0) * lineaU * uRelampagoU.w * 12.0;
          }
        }
`;

// ------------------------------------------------------------------ las sombras de las nubes en el valle (pasada de la niebla)
// Para el punto `p` del suelo (o de una casa, un árbol): dónde corta el rayo hacia el sol el plano de las nubes y cuánta nube hay ahí: manchas
// de unos cientos de metros, en grupos con cielo limpio entre uno y otro, más con el cielo más cargado, que el viento arrastra despacio.
export const GLSL_SOMBRA_NUBES = `
  uniform vec4 uNubesF;   // tiempo del cielo, nublado, fuerza de la sombra, altura de las nubes
  uniform vec2 uVientoNubesF;   // m/s
  float hNF(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vNF(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hNF(i), hNF(i + vec2(1.0, 0.0)), u.x), mix(hNF(i + vec2(0.0, 1.0)), hNF(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float nubeSobre(vec3 p) {
    vec3 sd = normalize(uSolDir);
    if (sd.y < 0.05) return 0.0;
    vec2 c = p.xz + sd.xz * ((uNubesF.w - p.y) / sd.y);
    vec2 q = (c - uVientoNubesF * uNubesF.x) / ${NUBES_ULTRA.escala.toFixed(1)};
    float n = vNF(q) * 0.55 + vNF(q * 2.1 + 3.1) * 0.3 + vNF(q * 4.3 + 7.7) * 0.15;
    float grupo = smoothstep(0.2, 0.7, vNF(q * 0.27 + 13.0));
    float umbral = 0.64 - uNubesF.y * 0.36 + (1.0 - grupo) * 0.12;
    // el borde de la sombra es blando (la penumbra de algo que está a un kilómetro y medio)
    return smoothstep(umbral, umbral + 0.13, n);
  }
`;
