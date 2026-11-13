// 4.28.0 (C): el nivel Ultra en los materiales: relieve de madera, piedra, chapa, revoque y tejas, desgaste y suciedad, la tela y la piel de la
// gente de cerca y los vidrios que reflejan el cielo. Nada de esto existe con Ultra apagado (Alta, Media y Baja quedan como en la 4.27.0):
//   · Cada material que tiene detalle de Ultra se registra acá (`conUltraC`): su `customProgramCacheKey` suma `|ultra-c-<tipo>` SÓLO con Ultra
//     prendido, y su `onBeforeCompile` agrega el código de Ultra SÓLO con Ultra prendido. Apagado, la clave y el programa son los de antes
//     (mismos programas de shader, mismo dibujo).
//   · `sincronizarUltraC(ajustes)` (main.js, al abrir y en cada cuadro: es una comparación) mira `esUltra(ajustes)`; si cambió, marca
//     `needsUpdate` en los materiales registrados (el programa de Ultra se arma al prenderlo; al apagarlo vuelven los de Alta) y avisa a los
//     oyentes (la cara de cerca de la gente pasa de 7 a 10 m). Se apaga también si la calidad baja de Alta (a mano o la automática).
// Todo es procedural, en el shader: ni texturas ni geometría ni dibujos de más.
import { esUltra } from './ultra.js';

const estado = { on: false, mats: new Set(), oyentes: new Set(), cambios: 0 };

export function ultraDetalle() { return estado.on; }
export function claveUltraC(tipo) { return estado.on ? '|ultra-c-' + tipo : ''; }
export function alCambiarUltraC(fn) { estado.oyentes.add(fn); return () => estado.oyentes.delete(fn); }
export function infoUltraC() { return { on: estado.on, materiales: estado.mats.size, cambios: estado.cambios }; }
// (para las pruebas: forzar el estado sin ajustes)
export function __ponerUltraC(on) { return sincronizarUltraC({ ultra: !!on, calidad: 'alta' }); }

export function sincronizarUltraC(ajustes) {
  const on = esUltra(ajustes);
  if (on === estado.on) return false;
  estado.on = on;
  estado.cambios++;
  for (const m of estado.mats) m.needsUpdate = true;
  for (const fn of estado.oyentes) { try { fn(on); } catch { /* un oyente roto no frena a los demás */ } }
  return true;
}

// Le suma a `mat` el detalle de Ultra: `inyectar(sh)` cambia el shader (sólo se llama con Ultra prendido). `tipo` va en la clave del
// programa (cada inyección distinta, su clave). La clave de antes se toma de la función que tenía el material, en cada llamada (otro
// envoltorio encima, como el del tren, sigue andando).
export function conUltraC(mat, tipo, inyectar) {
  if (!mat || mat.userData?.ultraC) return mat;
  const previo = mat.onBeforeCompile;
  const claveDe = mat.customProgramCacheKey;
  // (sin clave propia, la de three es el texto de onBeforeCompile: se guarda el de antes, así apagado la clave es la misma)
  const fija = claveDe === Object.getPrototypeOf(mat).customProgramCacheKey ? claveDe.call(mat) : null;
  mat.customProgramCacheKey = () => (fija !== null ? fija : claveDe.call(mat)) + claveUltraC(tipo);
  mat.onBeforeCompile = (sh, r) => {
    if (typeof previo === 'function') previo.call(mat, sh, r);
    if (estado.on) inyectar(sh, r);
  };
  mat.userData.ultraC = tipo;
  estado.mats.add(mat);
  return mat;
}

// ---------------------------------------------------------------- el cielo que se refleja (vidrios, charcos)
// Los uniformes de materiales.js (U: los pone cielo.js) se conocen acá con `conocerCieloUltraC(U)` (lo llaman aldea-mundo.js y estructuras.js,
// que ya importan U): ultra-materiales no importa el motor.
const cielo = { U: null };
export function conocerCieloUltraC(U) { if (U && !cielo.U) cielo.U = U; return cielo.U; }
function uniformesCielo(sh) {
  const U = cielo.U; if (!U) return;
  Object.assign(sh.uniforms, { uCenitU: U.uCenit, uHorizonteU: U.uHorizonte, uSolDirU: U.uSolDir, uSolColorU: U.uSolColor, uTiempoU: U.uTiempo, uLluviaU: U.uLluvia, uNocheU: U.uNoche });
}
// `reflejoU(r)`: lo que devuelve un espejo de agua o un vidrio en la dirección r: abajo el paisaje de enfrente (oscuro, tibio), arriba el cielo del
// horizonte al cenit con nubes suaves. `ondasU(xz)`: los anillos de las gotas que caen en un charco (inclinan la normal; sólo con lluvia).
export const GLSL_CIELO_U = /* glsl */`
  uniform vec3 uCenitU; uniform vec3 uHorizonteU; uniform vec3 uSolDirU; uniform vec3 uSolColorU; uniform float uTiempoU; uniform float uLluviaU; uniform float uNocheU;
  float hCU(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 reflejoU(vec3 r) {
    float yU = max(r.y, 0.08);
    vec2 pU = r.xz / yU;
    float nubU = smoothstep(0.35, 0.9, 0.5 + 0.25 * sin(pU.x * 1.9 + sin(pU.y * 1.3)) + 0.25 * sin(pU.y * 2.7 - pU.x * 0.7));
    vec3 cieloU = mix(uHorizonteU, uCenitU, smoothstep(0.05, 0.7, r.y));
    cieloU = mix(cieloU, mix(uHorizonteU, vec3(1.0), 0.5), nubU * 0.35 * smoothstep(0.08, 0.3, r.y));
    vec3 paisU = mix(uHorizonteU, vec3(0.11, 0.12, 0.08), 0.72) * (0.6 + 0.4 * smoothstep(-0.4, 0.1, r.y));
    return mix(paisU, cieloU, smoothstep(0.03, 0.22, r.y + 0.04 * sin(r.x * 14.0 + r.z * 9.0)));
  }
  float solReflejoU(vec3 r, float pot) { return pow(max(dot(r, normalize(uSolDirU)), 0.0), pot) * smoothstep(-0.02, 0.08, uSolDirU.y); }
  vec2 ondasU(vec2 xz) {
    vec2 g = vec2(0.0);
    for (int k = 0; k < 2; k++) {
      vec2 c = xz * (2.6 + float(k) * 1.3) + float(k) * 3.7, id = floor(c), f = fract(c) - 0.5 - (vec2(hCU(id), hCU(id + 2.3)) - 0.5) * 0.5;
      float t = fract(uTiempoU * 0.9 + hCU(id + 7.1)), r = length(f), fr = r - t * 0.45;
      g += f / max(r, 1e-3) * cos(fr * 55.0) * (1.0 - t) * (1.0 - smoothstep(0.0, 0.07, abs(fr)));
    }
    return g * uLluviaU * 0.25;
  }
`;

// ---------------------------------------------------------------- lo común: relieve por la derivada de una altura y un brillo de sol
// `alturaU` (metros) se calcula en el color del material; acá inclina la normal según cómo cambia en la pantalla (el mismo método que el
// relieve de three, pero con una altura procedural). Va después de las normales del material, antes de la luz.
export const GLSL_RELIEVE_U = /* glsl */`
  {
    vec3 pVU = -vViewPosition;
    vec3 sxU = dFdx(pVU), syU = dFdy(pVU);
    float hxU = dFdx(alturaU), hyU = dFdy(alturaU);
    vec3 r1U = cross(syU, normal), r2U = cross(normal, sxU);
    float detU = dot(sxU, r1U) * faceDirection;
    vec3 gradU = sign(detU) * (hxU * r1U + hyU * r2U);
    vec3 nU = normalize(abs(detU) * normal - gradU);
    if (nU == nU) normal = nU;
  }
`;
// Un brillo del sol (Lambert no tiene): `brilloU` cuánto y `potU` qué tan concentrado (la rugosidad: chapa nueva concentrado, piedra mojada
// ancho). La sombra se estima con lo que llegó de luz directa contra lo que llegaría sin sombra: a la sombra no brilla.
export const GLSL_BRILLO_U = /* glsl */`
  #if NUM_DIR_LIGHTS > 0
  if (brilloU > 0.001) {
    vec3 ldU = directionalLights[0].direction;
    float ndlU = max(dot(normal, ldU), 0.0);
    vec3 esperaU = directionalLights[0].color * ndlU * RECIPROCAL_PI * max(diffuseColor.rgb, vec3(0.02));
    float solU = clamp(dot(reflectedLight.directDiffuse, vec3(1.0)) / max(dot(esperaU, vec3(1.0)), 1e-4), 0.0, 1.0) * step(0.0005, ndlU);
    vec3 hvU = normalize(ldU + normalize(vViewPosition));
    float spU = pow(max(dot(normal, hvU), 0.0), potU) * (potU + 2.0) / 8.0;
    float frU = 0.04 + 0.96 * pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 5.0);
    reflectedLight.directDiffuse += directionalLights[0].color * spU * frU * brilloU * solU * ndlU;
  }
  #endif
`;

// ---------------------------------------------------------------- la aldea (y el tren, el almacén y la casa de té): prepararMaterialAldea
// Se mete adentro del bloque de color de la aldea (aldea-arquitectura.js), justo antes de `diffuseColor.rgb = alb;`: ahí están a mano el tipo
// de superficie, las coordenadas locales (pL, uv, tA) y la junta. Por tipo: tablas con el canto redondeado y la veta, tablas solapadas (la de
// arriba monta sobre la de abajo), tejuelas, piedra que abomba entre juntas hundidas, revoque con su grano, madera tosca, piso y laja.
// Además: el salpicado de barro al pie de las paredes, el chorreado oscuro que baja de los aleros y las juntas, la pintura gastada en los cantos
// y, con lluvia, la madera y la piedra oscurecidas con brillo de mojado. La chapa: brillo de metal (menos donde hay óxido).
export const GLSL_ALDEA_ULTRA_COMUN = /* glsl */`
  float alturaU = 0.0; float brilloU = 0.0; float potU = 8.0; float charcoU = 0.0;
`;
// (el ruido de Ultra, para la nieve pegada y el brillo de la nieve: sirve en la aldea y en las estructuras)
export const GLSL_RUIDO_U = /* glsl */`
  float hUc(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float nUc(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hUc(i), hUc(i + vec2(1.0, 0.0)), f.x), mix(hUc(i + vec2(0.0, 1.0)), hUc(i + vec2(1.0, 1.0)), f.x), f.y);
  }
`;
export const MARCA_ALDEA_ULTRA = 'diffuseColor.rgb = alb;';
export const GLSL_ALDEA_ULTRA = /* glsl */`
      {
        // (el relieve se apaga cuando un píxel cubre más de ~2 cm: de lejos no titila)
        float fwU = max(fwidth(uv.x), fwidth(uv.y));
        float vivoU = 1.0 - smoothstep(0.006, 0.03, fwU);
        float hU = 0.0, porosoU = 0.6;
        if (tipo < 1.5) {
          float u = uv.x / 0.18, b = min(fract(u), 1.0 - fract(u));
          hU = smoothstep(0.0, 0.16, b) * 0.007 + nA(vec2(uv.x * 70.0, uv.y * 2.4 + floor(u) * 7.0)) * 0.0014;
        } else if (tipo < 2.5) {
          float v = uv.y / 0.18;
          hU = (1.0 - fract(v)) * 0.014 * smoothstep(0.0, 0.04, fract(v)) + nA(vec2(uv.x * 2.4 + floor(v) * 5.0, uv.y * 70.0)) * 0.0012;
        } else if (tipo < 3.5) {
          float v = uv.y / 0.18, id = floor(v), u = uv.x / 0.15 + mod(id, 2.0) * 0.5 + hA(vec2(id, 9.0)) * 0.3;
          hU = (1.0 - fract(v)) * 0.012 * smoothstep(0.0, 0.05, fract(v)) + hA(vec2(floor(u), id)) * 0.003 + nA(vec2(uv.x * 40.0, uv.y * 9.0)) * 0.0012;
        } else if (tipo < 4.5) {
          porosoU = 0.0;
          float oxU = smoothstep(0.55, 0.85, nA(pL.xz * 1.4 + pL.y * 0.7)) * (1.0 - dentro);
          brilloU = 0.55 * (1.0 - oxU) * (1.0 - dentro * 0.7); potU = 28.0;
          hU = nA(uv * 23.0) * 0.0008 * oxU;
        } else if (tipo < 5.5) {
          vec2 q = uv + vec2(nA(uv * 2.1) * 0.12, nA(uv * 1.7 + 4.0) * 0.06);
          float rr = q.y / 0.16, rid = floor(rr);
          float cc = q.x / 0.34 + hA(vec2(rid, 5.0)) * 0.8 + nA(q * 3.0) * 0.25;
          float d = min(min(fract(rr), 1.0 - fract(rr)) * 0.16, min(fract(cc), 1.0 - fract(cc)) * 0.34);
          hU = smoothstep(0.0, 0.05, d) * 0.03 * (0.65 + 0.35 * hA(vec2(floor(cc), rid))) + nA(uv * 9.0) * 0.006 + nA(uv * 37.0) * 0.0018;
          porosoU = 1.0;
        } else if (tipo < 6.5) {
          hU = nA(uv * 5.0) * 0.005 + nA(uv * 19.0) * 0.0018 + nA(uv * 67.0) * 0.0007;
          porosoU = 0.8;
        } else if (tipo < 7.5) {
          vec2 g = horiz > 0.5 ? vec2(pL.x * 1.2, pL.z * 28.0) : vec2(tA * 28.0, pL.y * 1.2);
          hU = nA(g) * 0.004 + nA(g * 3.1) * 0.0015;
        } else if (tipo < 8.5) {
          float v = pL.z / 0.15, b = min(fract(v), 1.0 - fract(v));
          hU = smoothstep(0.0, 0.12, b) * 0.004 + nA(vec2(pL.x * 1.1 + floor(v) * 3.0, pL.z * 40.0)) * 0.001;
          porosoU = 0.4;
        } else if (tipo < 9.5) {
          hU = nA(pL.xz * 3.1 + pL.y) * 0.012 + nA(pL.xz * 14.0) * 0.003;
          porosoU = 1.0;
        }
        hU -= junta * 0.006;
        alturaU = hU * vivoU * 2.2;
        // lo hundido se ve también a la sombra (la luz del cielo no le llega igual): el color baja en el fondo de las juntas y entre piedras
        float escU = tipo < 1.5 ? 0.008 : tipo < 2.5 ? 0.015 : tipo < 3.5 ? 0.016 : tipo < 4.5 ? 1.0 : tipo < 5.5 ? 0.034 : tipo < 6.5 ? 0.007 : tipo < 7.5 ? 0.0055 : tipo < 8.5 ? 0.005 : 0.015;
        alb *= mix(1.0, 0.7 + 0.4 * clamp(hU / escU, 0.0, 1.0), vivoU);
        if (dentro < 0.5 && tipo < 9.5) {
          float h = pL.y;
          // el barro salpicado al pie (gotitas, no un degradé)
          float altoU = 1.0 - smoothstep(0.0, 0.36 + 0.1 * nA(uv * 3.0), h);
          vec2 cgU = uv * 70.0, igU = floor(cgU);
          float gotaU = (1.0 - smoothstep(0.1, 0.32, length(fract(cgU) - 0.5 - (vec2(hA(igU), hA(igU + 1.7)) - 0.5) * 0.5))) * step(1.0 - altoU * 0.85, hA(igU + 4.1)) * (1.0 - smoothstep(0.004, 0.012, fwU));
          float franjaU = 1.0 - smoothstep(0.0, 0.07 + 0.05 * nA(uv * 7.0), h);
          alb = mix(alb, vec3(0.19, 0.15, 0.11), clamp(gotaU * 0.6 + franjaU * 0.35, 0.0, 0.7) * (1.0 - horiz));
          // el chorreado: rayas oscuras finas que bajan (de los aleros, los clavos, las juntas)
          float rayaU = smoothstep(0.62, 0.92, nA(vec2(tA * 9.0, h * 0.4))) * smoothstep(0.35, 1.2, h) * (1.0 - horiz);
          alb *= 1.0 - rayaU * 0.22 * (0.6 + 0.4 * nA(vec2(tA * 40.0, h * 3.0)));
          // la pintura gastada: a lo largo del canto de cada tabla y en manchas donde más se roza (abajo)
          if (madera > 0.0) {
            float roceU = (1.0 - smoothstep(0.0, 0.035, bordeTabla)) * smoothstep(0.35, 0.65, nA(uv * 13.0)) + (1.0 - smoothstep(0.1, 0.9, h)) * smoothstep(0.62, 0.8, nA(uv * 6.0));
            alb = mix(alb, vec3(0.33, 0.24, 0.15) * (0.8 + 0.4 * nA(uv * 30.0)), clamp(roceU, 0.0, 1.0) * 0.4);
          }
          // con lluvia: lo poroso se oscurece y lo mojado brilla (más en lo que mira al cielo)
          float mojU = uMojadoVeg * (0.55 + 0.45 * smoothstep(0.3, 0.9, vNormWA.y));
          alb *= 1.0 - mojU * 0.28 * porosoU;
          brilloU = max(brilloU, mojU * 0.45);
          potU = mix(potU, 40.0, mojU);
          // musgo y líquenes del lado húmedo (al sur y a la sombra, cerca del suelo y arriba) en la piedra, la laja, las tejuelas y la madera tosca
          float viejoU = (((tipo > 2.5 && tipo < 3.5) || (tipo > 4.5 && tipo < 5.5) || (tipo > 6.5 && tipo < 7.5) || tipo > 8.5) ? 1.0 : 0.25) * (abs(tipo - 8.0) < 0.5 ? 0.0 : 1.0);
          float humedoU = clamp((1.0 - smoothstep(-0.6, 0.1, vNormWA.z)) * 0.6 + (1.0 - smoothstep(0.0, 0.8, h)) * 0.5 + smoothstep(0.4, 0.9, vNormWA.y) * 0.3, 0.0, 1.0);
          float musgoU = smoothstep(0.55, 0.78, nA(pL.xz * 1.9 + pL.y * 1.3 + 11.0) * 0.7 + nA(uv * 6.0) * 0.3) * humedoU * viejoU;
          alb = mix(alb, mix(vec3(0.07, 0.11, 0.04), vec3(0.17, 0.22, 0.07), nA(uv * 23.0)) * clamp(dot(alb, vec3(0.333)) / 0.25, 0.7, 1.3), musgoU * 0.7);
          alturaU += musgoU * nA(uv * 120.0) * 0.003 * vivoU;
          float liqU = smoothstep(0.8, 0.9, nA(uv * 7.0 + 31.0)) * smoothstep(0.5, 0.75, nA(uv * 31.0)) * viejoU * (1.0 - musgoU);
          alb = mix(alb, vec3(0.55, 0.58, 0.48), liqU * 0.5);
          // charcos en lo plano de afuera (la laja y la piedra de la plaza y las veredas): ver GLSL_CHARCO_ALDEA_U
          if (horiz > 0.5 && ((tipo > 4.5 && tipo < 5.5) || tipo > 8.5)) charcoU = uMojadoVeg * smoothstep(0.6, 0.75, nA(pL.xz * 0.7 + 5.0) * 0.75 + nA(pL.xz * 4.0) * 0.25) * (1.0 - uInvierno);
          alb *= 1.0 - charcoU * 0.5;
        }
      }
`;
// El charco de la aldea: devuelve el cielo y el paisaje (con los anillos de las gotas si llueve) y el sol. Antes de la salida del material.
export const GLSL_CHARCO_ALDEA_U = /* glsl */`
  if (charcoU > 0.01) {
    vec3 vdC = normalize(cameraPosition - vPosMundoVeg);
    vec2 oC = ondasU(vPosMundoVeg.xz);
    vec3 nC = normalize(vec3(oC.x, 1.0, oC.y));
    vec3 rC = reflect(-vdC, nC);
    float frC = 0.03 + 0.97 * pow(1.0 - clamp(dot(nC, vdC), 0.0, 1.0), 5.0);
    outgoingLight = mix(outgoingLight, reflejoU(rC) * 0.85, charcoU * clamp(0.25 + frC, 0.0, 0.95)) + uSolColorU * solReflejoU(rC, 300.0) * 3.0 * charcoU;
  }
`;
// La nieve (materialVegetal: aldea y estructuras): además de la que se junta arriba, la que el viento pega en las paredes y los postes del lado
// del viento, en manchones; y el brillo de los cristales al sol, que titila al moverse. `extra`: un factor más (la aldea: nada adentro).
export const NIEVE_JUNTA_U = 'acumula *= 0.65 + 0.35 * rug;';
export const NIEVE_PINTA_U = 'gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.92, 0.94, 0.97) * (0.7 + 0.5 * haciaArriba), acumula * 0.85);';
export const glslNieveU = (extra) => `
              {
                vec3 nNU = normalize(vNormMundoVeg);
                float costadoNU = 1.0 - smoothstep(0.3, 0.6, abs(nNU.y));
                float pegadaNU = smoothstep(0.45, 0.75, nUc(vPosMundoVeg.xz * 1.7 + vPosMundoVeg.y * 2.3) * 0.7 + nUc(vPosMundoVeg.xz * 9.0 + vPosMundoVeg.y * 7.0) * 0.3)
                  * max(0.45, smoothstep(-0.6, 0.6, dot(normalize(nNU.xz + vec2(1e-4)), normalize(vec2(1.0, 0.35))))) * costadoNU * uInvierno * 0.8;
                acumula = max(acumula, pegadaNU * (1.0 - texture2D(uEstepaVeg, vec2(vPosMundoVeg.x / 1024.0 + 0.5, vPosMundoVeg.z / 1024.0 + 0.5)).g) * ${extra});
              }`;
export const GLSL_NIEVE_BRILLO_U = `
              gl_FragColor.rgb += uSolColorVeg * step(0.992, hUc(floor(vPosMundoVeg.xz * 55.0 + vPosMundoVeg.y * 55.0) + floor(cameraPosition.xz * 3.0))) * acumula * 0.9 * clamp(uSolDirVeg.y * 2.0, 0.0, 1.0);`;

// ---------------------------------------------------------------- la gente de cerca (materialAtlas de gente-cuerpo.js)
// Antes de `diffuseColor.rgb = alb * det;`: el relieve de la tela (del mismo tejido del atlas que ya se pinta: lana, lienzo, cuero, punto,
// fieltro), los poros de la piel, las hebras del pelo, la boca con relieve; y un brillo suave en la piel (más en la frente, la nariz y los
// pómulos) y húmedo en los labios. Sólo de cerca (`cerca`: menos de 6 mm por píxel), como el resto del detalle de la gente.
export const MARCA_GENTE_ULTRA = 'diffuseColor.rgb = alb * det;';
export const GLSL_GENTE_ULTRA = /* glsl */`
      if (cerca) {
        if (tela) { alturaU = (det - 1.0) * 0.0035 + pin * 0.0008; alb *= 0.9 + 0.12 * clamp(det, 0.0, 1.6); brilloU = abs(tipo - 3.0) < 0.5 ? 0.3 : 0.04; potU = abs(tipo - 3.0) < 0.5 ? 14.0 : 4.0; }
        else if (pelo) { alturaU = det * 0.0007; brilloU = 0.22; potU = 18.0; }
        else if (labio) { alturaU = det * 0.0004; brilloU = 0.9; potU = 40.0; }
        else if (ceja) { alturaU = det * 0.0003; }
        else if (cara) {
          vec2 fcU = vTela.yz;
          alturaU = nT(fcU * 900.0) * 0.00009 + nT(fcU * 260.0) * 0.00012;
          // la zona T (frente, nariz) y los pómulos brillan un poco más
          float zonaU = exp(-pow(fcU.x / 0.02, 2.0)) * smoothstep(-0.05, 0.03, fcU.y) + 0.6 * exp(-pow((abs(fcU.x) - 0.04) / 0.015, 2.0) - pow((fcU.y + 0.03) / 0.015, 2.0));
          brilloU = 0.1 + 0.22 * clamp(zonaU, 0.0, 1.0); potU = 22.0;
        } else if (esPiel) {
          alturaU = nT(uvp * 700.0) * 0.0001 + nT(uvp * 180.0) * 0.00012;
          brilloU = 0.1; potU = 16.0;
        }
      }
`;

// ---------------------------------------------------------------- los vidrios (los de la aldea y los de las casas del valle: MeshBasic)
// Lo que refleja una ventana: abajo el paisaje de enfrente (oscuro, tibio), arriba el cielo (del horizonte al cenit, con nubes suaves) y el
// sol cuando el reflejo lo agarra; más cuanto más de costado se la mira (Fresnel). El vidrio viejo apenas ondula. De noche, con la luz de
// adentro (el color del material sube), el reflejo se apaga.
export const GLSL_VIDRIO_U_VERT = /* glsl */`
  vPWU = (modelMatrix * vec4(transformed, 1.0)).xyz; vNWU = normalize(mat3(modelMatrix) * normal);
`;
export const GLSL_VIDRIO_U_FRAG = /* glsl */`
  {
    vec3 vdU = normalize(cameraPosition - vPWU);
    vec3 nU = normalize(vNWU); if (dot(nU, vdU) < 0.0) nU = -nU;
    nU = normalize(nU + vec3(sin(vPWU.y * 11.0 + vPWU.x * 3.0), sin(vPWU.x * 7.0 + vPWU.z * 5.0) * 0.5, cos(vPWU.y * 9.0 - vPWU.z * 3.0)) * 0.018);
    vec3 rU = reflect(-vdU, nU);
    float frU = 0.04 + 0.96 * pow(1.0 - clamp(dot(nU, vdU), 0.0, 1.0), 5.0);
    float nocheU = clamp(uNocheU * 1.5, 0.0, 1.0) * smoothstep(0.25, 0.8, diffuse.r);   // (de día siempre refleja; de noche, la ventana prendida no)
    float cuantoU = clamp(0.18 + frU * 0.75, 0.0, 0.85) * (1.0 - nocheU);
    outgoingLight = mix(outgoingLight, reflejoU(rU), cuantoU) + uSolColorU * solReflejoU(rU, 600.0) * 2.5 * (1.0 - nocheU);
  }
`;
export function inyectarVidrioU(sh, U) {
  conocerCieloUltraC(U); uniformesCielo(sh);
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vPWU; varying vec3 vNWU;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + GLSL_VIDRIO_U_VERT);
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vPWU; varying vec3 vNWU;\n' + GLSL_CIELO_U)
    .replace('#include <opaque_fragment>', GLSL_VIDRIO_U_FRAG + '\n#include <opaque_fragment>');
}
// `U`: los uniformes de materiales.js (uCenit, uHorizonte, uSolDir, uSolColor; los pone cielo.js). Se pasan desde quien arma el vidrio.
export const vidrioUltra = (mat, U) => { conocerCieloUltraC(U); return conUltraC(mat, 'vidrio', (sh) => inyectarVidrioU(sh, U)); };

// El agregado de Ultra al material de la aldea (lo llama prepararMaterialAldea, ya con el detalle de la 3.6 puesto).
export function inyectarAldeaUltra(sh) {
  uniformesCielo(sh);
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\n' + GLSL_ALDEA_ULTRA_COMUN + GLSL_RUIDO_U + GLSL_CIELO_U)
    .replace(NIEVE_JUNTA_U, NIEVE_JUNTA_U + glslNieveU('nieveA'))
    .replace(NIEVE_PINTA_U, NIEVE_PINTA_U + GLSL_NIEVE_BRILLO_U)
    .replace('#include <opaque_fragment>', GLSL_CHARCO_ALDEA_U + '\n#include <opaque_fragment>')
    .replace(MARCA_ALDEA_ULTRA, GLSL_ALDEA_ULTRA + '\n' + MARCA_ALDEA_ULTRA)
    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + GLSL_RELIEVE_U)
    .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + GLSL_BRILLO_U);
}
// El agregado de Ultra al material de la gente (lo llama materialAtlas de gente-cuerpo.js).
export function inyectarGenteUltra(sh) {
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\n' + GLSL_ALDEA_ULTRA_COMUN)
    .replace(MARCA_GENTE_ULTRA, GLSL_GENTE_ULTRA + '\n' + MARCA_GENTE_ULTRA)
    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + GLSL_RELIEVE_U)
    .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' + GLSL_BRILLO_U);
}
// 4.28.0 (C): la cara de cerca (con sus gestos) se dibuja hasta 10 m con Ultra (7 m sin Ultra); ver alPosar en gente-cuerpo.js.
export const CERCA_CARA_ULTRA = 10;

// ---------------------------------------------------------------- las estructuras del valle y las obras del jugador (materialVegetal({ flex: 0 }))
// No traen tipo de superficie (son color por vértice y aTipo 0 madera / 4 piedra y techo): se reconoce por el color y el tipo. La madera
// (tibia y saturada) lleva veta y fibra a lo largo; la piedra (gris o aTipo 4 de las caras de costado) abomba y tiene grano; el resto, un
// grano fino. Al pie, el barro salpicado (del suelo de verdad: vSueloVeg) y el chorreado oscuro que baja por las paredes. Lo mojado, que ya
// brilla en materialVegetal, no se toca.
export const GLSL_ESTRUCTURA_ULTRA_COMUN = GLSL_ALDEA_ULTRA_COMUN + GLSL_RUIDO_U;
export const GLSL_ESTRUCTURA_ULTRA = /* glsl */`
  if (vTipoVeg < 0.5 || (vTipoVeg > 3.5 && vTipoVeg < 4.01)) {
    vec3 nWU = normalize(vNormMundoVeg), pWU = vPosMundoVeg;
    float horizU = step(0.7, abs(nWU.y));
    vec2 tgU = normalize(vec2(-nWU.z, nWU.x) + vec2(1e-5, 0.0));
    float tU = dot(pWU.xz, tgU);
    vec2 uvU = mix(vec2(tU, pWU.y), pWU.xz, horizU);
    vec3 cU = diffuseColor.rgb;
    float mxU = max(cU.r, max(cU.g, cU.b)), satU = mxU > 0.0 ? (mxU - min(cU.r, min(cU.g, cU.b))) / mxU : 0.0;
    float maderaU = smoothstep(0.18, 0.32, satU) * step(cU.b, cU.r) * (1.0 - step(3.5, vTipoVeg));
    float piedraU = max(1.0 - smoothstep(0.1, 0.22, satU), step(3.5, vTipoVeg) * (1.0 - horizU)) * (1.0 - maderaU);
    float fwU = max(fwidth(uvU.x), fwidth(uvU.y));
    float vivoU = 1.0 - smoothstep(0.006, 0.03, fwU);
    // la veta: a lo alto en las paredes (tablas paradas), a lo largo en lo horizontal
    // (en un tronco acostado la normal gira rápido a lo alto: la veta va a lo largo, acostada)
    float curvaU = length(fwidth(nWU)) / max(length(fwidth(pWU)), 1e-4);
    bool acostadaU = horizU > 0.5 || curvaU > 2.5;
    vec2 vetaU = acostadaU ? vec2(uvU.x * 1.6, uvU.y * 60.0) : vec2(uvU.x * 60.0, uvU.y * 1.6);
    float hU = maderaU * (nUc(vetaU) * 0.007 + nUc(vetaU * vec2(2.9, 2.9) + 3.0) * 0.002)
      + piedraU * (nUc(uvU * 6.0) * 0.008 + nUc(uvU * 23.0) * 0.0025 + nUc(uvU * 71.0) * 0.0008)
      + (1.0 - maderaU - piedraU) * nUc(uvU * 31.0) * 0.0009;
    alturaU = hU * vivoU * 2.2;
    diffuseColor.rgb *= mix(1.0, 0.74 + 0.36 * clamp(hU / max(maderaU * 0.009 + piedraU * 0.0113 + (1.0 - maderaU - piedraU) * 0.0009, 1e-4), 0.0, 1.0), vivoU);
    // la madera: la veta se lee también en el color (más oscura en el surco)
    diffuseColor.rgb *= 1.0 - maderaU * ((0.5 - nUc(vetaU)) * 0.32 + (0.5 - nUc(vetaU * vec2(0.5, 0.12) + 9.0)) * 0.2) * vivoU;
    if (horizU < 0.5) {
      float hS = pWU.y - vSueloVeg;
      // (gotitas de barro, más tupidas abajo, y una franja húmeda finita contra el suelo)
      float altoU = 1.0 - smoothstep(0.0, 0.34 + 0.1 * nUc(uvU * 3.0), hS);
      vec2 cgU = uvU * 70.0, igU = floor(cgU);
      float gotaU = (1.0 - smoothstep(0.1, 0.32, length(fract(cgU) - 0.5 - (vec2(hUc(igU), hUc(igU + 1.7)) - 0.5) * 0.5))) * step(1.0 - altoU * 0.85, hUc(igU + 4.1)) * (1.0 - smoothstep(0.004, 0.012, fwU));
      float franjaU = 1.0 - smoothstep(0.0, 0.07 + 0.05 * nUc(uvU * 7.0), hS);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.19, 0.15, 0.11), clamp(gotaU * 0.6 + franjaU * 0.35, 0.0, 0.7));
      float rayaU = smoothstep(0.64, 0.93, nUc(vec2(tU * 9.0, pWU.y * 0.4))) * smoothstep(0.4, 1.3, hS);
      diffuseColor.rgb *= 1.0 - rayaU * 0.18 * (0.6 + 0.4 * nUc(vec2(tU * 40.0, pWU.y * 3.0)));
    }
    // musgo y líquenes del lado húmedo (al sur, cerca del suelo, arriba de lo que junta agua) en la piedra y la madera
    {
      float hS = pWU.y - vSueloVeg;
      float humedoU = clamp((1.0 - smoothstep(-0.6, 0.1, nWU.z)) * 0.6 + (1.0 - smoothstep(0.0, 0.8, hS)) * 0.5 + smoothstep(0.4, 0.9, nWU.y) * 0.3, 0.0, 1.0);
      float musgoU = smoothstep(0.56, 0.8, nUc(pWU.xz * 1.9 + pWU.y * 1.3 + 11.0) * 0.7 + nUc(uvU * 6.0) * 0.3) * humedoU * max(piedraU, maderaU * 0.7);
      diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.10, 0.15, 0.05), vec3(0.24, 0.30, 0.09), nUc(uvU * 23.0)), musgoU * 0.7);
      alturaU += musgoU * nUc(uvU * 120.0) * 0.003 * vivoU;
      float liqU = smoothstep(0.8, 0.9, nUc(uvU * 7.0 + 31.0)) * smoothstep(0.5, 0.75, nUc(uvU * 31.0)) * piedraU * (1.0 - musgoU);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.58, 0.48), liqU * 0.5);
    }
  }
`;
export function inyectarEstructuraUltra(sh) {
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\n' + GLSL_ESTRUCTURA_ULTRA_COMUN)
    .replace('#include <color_fragment>', '#include <color_fragment>\n' + GLSL_ESTRUCTURA_ULTRA)
    .replace(NIEVE_JUNTA_U, NIEVE_JUNTA_U + glslNieveU('1.0'))
    .replace(NIEVE_PINTA_U, NIEVE_PINTA_U + GLSL_NIEVE_BRILLO_U)
    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + GLSL_RELIEVE_U);
}

// ---------------------------------------------------------------- las calles y la plaza de ripio de la aldea (materialRipio de aldea-mundo.js)
// Con lluvia, más charcos (los baches se llenan antes) y cada uno devuelve el cielo y el paisaje con los anillos de las gotas, y el sol.
export const CHARCO_RIPIO_ALTA = 'charcoR = uMojadoR * smoothstep(0.6, 0.82,';
export const GLSL_CHARCO_RIPIO_U = /* glsl */`
  if (charcoR > 0.01) {
    vec3 vdC = normalize(cameraPosition - vMundoR);
    vec2 oC = ondasU(vMundoR.xz);
    vec3 nC = normalize(vec3(oC.x, 1.0, oC.y));
    vec3 rC = reflect(-vdC, nC);
    float frC = 0.03 + 0.97 * pow(1.0 - clamp(dot(nC, vdC), 0.0, 1.0), 5.0);
    outgoingLight = mix(outgoingLight, reflejoU(rC) * mix(0.85, 0.3, uNocheR), charcoR * clamp(0.3 + frC, 0.0, 0.95)) + uSolColorU * solReflejoU(rC, 300.0) * 3.0 * charcoR;
  }
`;
export function inyectarRipioUltra(sh) {
  uniformesCielo(sh);
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\n' + GLSL_CIELO_U)
    .replace(CHARCO_RIPIO_ALTA, 'charcoR = uMojadoR * smoothstep(0.5, 0.74,')
    .replace('#include <opaque_fragment>', GLSL_CHARCO_RIPIO_U + '\n#include <opaque_fragment>');
}

// ---------------------------------------------------------------- el humo de las chimeneas y el vapor de la olla (ShaderMaterial de puntos)
// Cada bocanada deja de ser un disco liso: hebras que se deshacen (un ruido que cambia con la vida de la bocanada), más densas en el centro.
export const MARCA_HUMO_U = 'gl_FragColor = vec4(';
export const GLSL_HUMO_U_PARS = /* glsl */`
  float hHU(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float nHU(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hHU(i), hHU(i + vec2(1.0, 0.0)), f.x), mix(hHU(i + vec2(0.0, 1.0)), hHU(i + vec2(1.0, 1.0)), f.x), f.y); }
  float hebrasU(vec2 p, float vida, float semilla) {
    vec2 q = p * 3.2 + vec2(semilla * 17.0, semilla * 5.0 - vida * 2.2);
    float n = nHU(q) * 0.6 + nHU(q * 2.3 + 4.0) * 0.4;
    return clamp(0.2 + 1.5 * n - length(p) * 0.6, 0.0, 1.4);
  }
`;
// `semilla`: una expresión GLSL de azar por bocanada (vAzar en el clima; vPeso en la cocina)
export function inyectarHumoUltra(semilla) {
  return (sh) => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\n' + GLSL_HUMO_U_PARS)
      .replace(MARCA_HUMO_U, 'a *= hebrasU(gl_PointCoord - 0.5, vVida, ' + semilla + ');\n        ' + MARCA_HUMO_U);
  };
}
