// 3.3: impostores de los árboles lejanos. Cada especie y variante se fotografía al
// arrancar desde unos pocos ángulos horizontales (un atlas de color y otro de normales),
// y más allá de ~120 m el árbol 3D se cambia por un cartel que mira a la cámara y toma la
// foto del ángulo más cercano (3.4: funde las dos fotos que rodean el ángulo de la cámara,
// así el cartel no salta al caminar). El cartel se ilumina con la misma luz Lambert y los mismos
// términos de estilo de la 3.2 (el atlas guarda color y normal, no la luz), así que la
// hora del día, la bruma, el otoño y la nieve siguen funcionando. Todos los impostores
// del valle son UNA sola malla instanciada: una llamada de dibujo para el bosque lejano.
// Las fotos salen de las geometrías de especie vigentes: si cambia la forma de un árbol,
// cambia su impostor sin tocar nada acá.
import * as THREE from 'three';
import { U, GLSL_COMUN, GLSL_ESTILO, conTechoNiebla } from './materiales.js';

export const ANGULOS_IMPOSTOR = 8;
// 3.5: 80×160 → 112×204 (el alto que entra en 4096 con las 20 especies): en alta (1,5 de
// resolución) un coihue a 110 m, donde entra el cartel, ocupa ~175 px de alto y la foto tenía
// 150: el cartel se veía blando justo en el relevo. Son ~35 MB más de placa entre verano e
// invierno (con sus mipmaps); el horneado sigue siendo un dibujo por pasada.
const CELDA_ANCHO = 112, CELDA_ALTO_MAX = 204;
const MIPMAP_LINEAL = 1008;
// 3.3: las fotos se toman un poco desde arriba (10°): de lejos el bosque casi siempre se ve
// desde una loma o un mirador, y las copas en estantes se leen por arriba, no de canto
const ELEVACION = 0.18;

// 3.3: el ángulo del atlas que corresponde a una cámara en (camX, camZ) mirando el árbol
// de matriz `m` (elementos de una Matrix4, en columnas). Se descuenta el giro propio del
// árbol: la foto k se tomó desde (sen θk, 0, cos θk) en el espacio local de la especie.
// El shader hace esta misma cuenta (3.4: y mezcla esa foto con la vecina; la que elige esta
// función es la de mayor peso).
export function anguloImpostor(m, camX, camZ, angulos = ANGULOS_IMPOSTOR) {
  const wx = camX - m[12], wz = camZ - m[14];
  const l0 = Math.hypot(m[0], m[2]) || 1, l2 = Math.hypot(m[8], m[10]) || 1;
  const lx = (m[0] * wx + m[2] * wz) / l0, lz = (m[8] * wx + m[10] * wz) / l2;
  const paso = (Math.PI * 2) / angulos;
  const k = Math.round(Math.atan2(lx, lz) / paso);
  return ((k % angulos) + angulos) % angulos;
}

// 3.3: los límites de una especie para encuadrar su foto: radio horizontal máximo y alto
export function cajaImpostor(geo) {
  const p = geo.attributes.position, k = geo.attributes.aCarta;
  let r = 0.01, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // 3.4: las cartas de follaje se abren alrededor de su punto (miran a la cámara)
    const e = k ? Math.hypot(k.getX(i), k.getY(i)) : 0;
    r = Math.max(r, Math.hypot(x, z) + e);
    if (y - e < y0) y0 = y - e;
    if (y + e > y1) y1 = y + e;
  }
  if (!(y1 > y0)) { y0 = 0; y1 = 1; }
  return { r: r * 1.02, y0, y1: y1 + (y1 - y0) * 0.01 };
}

// ---------------------------------------------------------------- horneado del atlas
// Todo el atlas sale en un único render por pasada: cada especie es una malla instanciada
// con una instancia por ángulo, y el vertex shader ubica cada copia en su celda (en
// coordenadas de recorte, proyección ortográfica). Pasada 0: color (en raíz cuadrada, para
// que los verdes oscuros no se escalonen en 8 bits); pasada 1: normal local y tipo.
// 3.4: las cartas de follaje se abren en el plano de cada foto (miran a la cámara del horno,
// como en el juego) y se recortan con el atlas de cartas.
const VERT_HORNO = /* glsl */`
uniform vec4 uCaja;      // radio, y0, y1 (ya proyectados con la elevación), fila
uniform float uAngulos, uFilas, uInv, uElev, uProf;
attribute float aTipo;
attribute vec4 aCarta;
varying vec3 vC; varying vec3 vN; varying float vT; varying vec3 vCarta;
void main() {
  vec3 p = position;
  float viva = 1.0;
  // el invierno deja pelados a los caducos (lo mismo que hace el material del árbol)
  if (uInv > 0.5 && aTipo > 1.5 && aTipo < 3.5) { p = vec3(0.0, position.y, 0.0); viva = 0.0; }
  float ao = mix(0.62, 1.0, smoothstep(0.0, 1.6, position.y));
  vC = color * ao; vN = normal; vT = aTipo;
  vCarta = vec3(aCarta.zw, step(1e-6, dot(aCarta.xy, aCarta.xy)));
  float k = float(gl_InstanceID);
  float th = k * 6.28318530718 / uAngulos;
  float ce = cos(uElev), se = sin(uElev);
  vec3 dH = vec3(sin(th), 0.0, cos(th));
  vec3 der = vec3(dH.z, 0.0, -dH.x);
  vec3 arriba = vec3(-se * dH.x, ce, -se * dH.z);
  vec3 d = vec3(dH.x * ce, se, dH.z * ce);
  p += (der * aCarta.x + arriba * aCarta.y) * viva;
  float u = dot(p, der) / uCaja.x * 0.48 + 0.5;
  float v = 0.01 + 0.98 * (dot(p, arriba) - uCaja.y) / (uCaja.z - uCaja.y);
  float prof = dot(p, d) / uProf;
  gl_Position = vec4((k + u) / uAngulos * 2.0 - 1.0, (uCaja.w + v) / uFilas * 2.0 - 1.0, -prof, 1.0);
}`;
const FRAG_HORNO = /* glsl */`
uniform float uModo;
uniform sampler2D uCartas;
varying vec3 vC; varying vec3 vN; varying float vT; varying vec3 vCarta;
void main() {
  vec3 c = vC;
  if (vCarta.z > 0.5) {
    // (la foto es chica: el mipmap ya promedió el alfa, así que el umbral es más bajo)
    vec4 t = texture2D(uCartas, vCarta.xy);
    if (t.a < 0.32) discard;
    c *= mix(0.66, 1.1, t.r);
  }
  if (uModo < 0.5) gl_FragColor = vec4(sqrt(max(c, vec3(0.0))), 1.0);
  else gl_FragColor = vec4(normalize(vN) * 0.5 + 0.5, vT / 4.0);
}`;

function crearAtlas(ancho, alto) {
  const rt = new THREE.WebGLRenderTarget(ancho, alto, { depthBuffer: true, stencilBuffer: false });
  rt.texture.generateMipmaps = true;
  rt.texture.minFilter = MIPMAP_LINEAL;
  rt.texture.magFilter = THREE.LinearFilter;
  return rt;
}

// especies: [{ nombre, geo }] (las geometrías del LOD cercano de cada especie)
// 3.4: `cartas`: el atlas de cartas de follaje (vegetacion.js), si las geometrías las traen
// 3.5.1: `destino`: los atlas de antes ({ color, normal }), para volver a hornear en los mismos
// (después de perder el contexto 3D; ver rehornear en crearImpostores)
export function hornearImpostores(renderer, especies, invierno = false, cartas = null, destino = null) {
  const t0 = performance.now();
  const filas = especies.length;
  const celdaAlto = Math.max(64, Math.min(CELDA_ALTO_MAX, Math.floor(4096 / Math.max(1, filas))));
  const ancho = CELDA_ANCHO * ANGULOS_IMPOSTOR, alto = celdaAlto * filas;
  const escena = new THREE.Scene();
  const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uModo = { value: 0 }, uInv = { value: invierno ? 1 : 0 }, uCartas = { value: cartas };
  const cajas = [];
  const mallas = especies.map((e, fila) => {
    const c0 = cajaImpostor(e.geo);
    const ce = Math.cos(ELEVACION), se = Math.sin(ELEVACION);
    // lo que ocupa la foto vista desde arriba: el alto se acorta y se suma el radio inclinado
    const caja = { r: c0.r, y0: c0.y0 * ce - c0.r * se, y1: c0.y1 * ce + c0.r * se };
    cajas.push(caja);
    const prof = (c0.r * ce + Math.max(Math.abs(c0.y0), Math.abs(c0.y1)) * se) * 1.05;
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT_HORNO, fragmentShader: FRAG_HORNO, vertexColors: true,
      uniforms: { uCaja: { value: [caja.r, caja.y0, caja.y1, fila] }, uAngulos: { value: ANGULOS_IMPOSTOR }, uFilas: { value: filas }, uInv, uModo, uCartas, uElev: { value: ELEVACION }, uProf: { value: prof } },
    });
    const im = new THREE.InstancedMesh(e.geo, mat, ANGULOS_IMPOSTOR);
    im.frustumCulled = false;
    escena.add(im);
    return im;
  });
  const color = destino?.color || crearAtlas(ancho, alto), normal = destino?.normal || crearAtlas(ancho, alto);
  const previo = renderer.getRenderTarget();
  const fondo = new THREE.Color(); renderer.getClearColor(fondo);
  const alfa = renderer.getClearAlpha(), autoClear = renderer.autoClear, sombras = renderer.shadowMap.autoUpdate;
  renderer.autoClear = true; renderer.shadowMap.autoUpdate = false;
  renderer.setClearColor(0x000000, 0);
  for (const [modo, rt] of [[0, color], [1, normal]]) {
    uModo.value = modo;
    renderer.setRenderTarget(rt);
    renderer.render(escena, camara);
  }
  renderer.setRenderTarget(previo);
  renderer.setClearColor(fondo, alfa);
  renderer.autoClear = autoClear; renderer.shadowMap.autoUpdate = sombras;
  for (const m of mallas) m.material.dispose();
  return { color, normal, cajas, filas, ms: performance.now() - t0 };
}

// ---------------------------------------------------------------- el material del cartel
// Lambert de three (la misma luz que los árboles 3D) con el color y la normal del atlas.
function materialImpostor(estado) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, {
      uAtlasColor: estado.uColor, uAtlasNormal: estado.uNormal,
      uAngulosImp: { value: ANGULOS_IMPOSTOR }, uFilasImp: estado.uFilas,
      uImpInicio: estado.uInicio, uImpFin: estado.uFin, uImpLejos: estado.uLejos,
      uOtonoImp: U.uOtono, uInviernoImp: U.uInvierno, uTrasluzImp: U.uTrasluz, uLluviaImp: U.uLluvia, uNubesImp: U.uNubes,
      // 3.5.2: el tiempo, para los bancos de niebla que se corren (la niebla por altura del paisaje lo
      // declara en conTechoNiebla si el fragmento no lo tiene; sin el valor, los bancos quedaban quietos
      // en los carteles y se movían en el resto del bosque)
      uTiempo: U.uTiempo,
      uSolDirImp: U.uSolDir, uSolColorImp: U.uSolColor, uCieloBajoImp: U.uCieloBajo,
      uBruma: U.uBruma, uBrumaSol: U.uBrumaSol, uBrumaFuerza: U.uBrumaFuerza, uGradoMat: U.uGradoMat, uSolDirEst: U.uSolDir,
    });
    // 3.4: la misma niebla con techo que los árboles 3D y el suelo (si no, los carteles de
    // 270–310 m quedan más pálidos que el piso que los rodea)
    sh.fragmentShader = conTechoNiebla(sh.fragmentShader);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uAngulosImp; uniform float uFilasImp; uniform float uImpInicio; uniform float uImpFin; uniform float uImpLejos;
        attribute vec4 aCelda;   // fila, radio, y0, y1
        varying vec2 vUvImp; varying vec2 vUvImp1; varying float vMezclaImp; varying vec3 vRot0Imp; varying vec3 vRot2Imp; varying float vAzarImp; varying float vAlturaImp; varying vec3 vPosMundoImp;
        ${GLSL_COMUN}`)
      .replace('#include <project_vertex>', `
        vec3 baseImp = instanceMatrix[3].xyz;
        vec3 c0Imp = instanceMatrix[0].xyz, c1Imp = instanceMatrix[1].xyz, c2Imp = instanceMatrix[2].xyz;
        float sxImp = length(c0Imp), syImp = length(c1Imp), szImp = length(c2Imp);
        vec2 wImp = cameraPosition.xz - baseImp.xz;
        float dImp = length(wImp);
        vec2 wnImp = wImp / max(dImp, 1e-3);
        // 3.3: el ángulo de la cámara en el espacio del árbol (la misma cuenta que
        // anguloImpostor en JS). 3.4: se funden las dos fotos que lo rodean: el cartel ya no
        // salta de una a otra al caminar (el peso pasa en la mitad del tramo; la más cercana
        // es la que anguloImpostor elige)
        vec2 locImp = vec2(dot(c0Imp.xz, wnImp) / max(sxImp, 1e-5), dot(c2Imp.xz, wnImp) / max(szImp, 1e-5));
        float pasoImp = 6.28318530718 / uAngulosImp;
        float aImp = atan(locImp.x, locImp.y) / pasoImp;
        float kImp = floor(aImp);
        vMezclaImp = smoothstep(0.15, 0.85, aImp - kImp);
        kImp = mod(kImp + uAngulosImp, uAngulosImp);
        float k1Imp = mod(kImp + 1.0, uAngulosImp);
        // 3.3: relevo con el árbol 3D: el mismo umbral por árbol que usa el LOD (hash de la
        // base), así cada árbol es 3D o cartel, nunca los dos ni ninguno. En el borde del
        // alcance el cartel se achica hacia su base como el LOD simplificado.
        float mascImp = hash12(floor(baseImp.xz * 4.0) + 17.0);
        float entraImp = smoothstep(uImpInicio, uImpFin, dImp);
        float quedaImp = 1.0 - smoothstep(uImpLejos - 30.0, uImpLejos, dImp);
        float vivoImp = (mascImp < entraImp && sxImp > 1e-4) ? quedaImp : 0.0;
        vec3 derImp = vec3(wnImp.y, 0.0, -wnImp.x);
        float altoImp = mix(aCelda.z, aCelda.w, position.y);
        vec3 mundoImp = baseImp + (derImp * position.x * 2.0 * aCelda.y * 0.5 * (sxImp + szImp) + vec3(0.0, altoImp * syImp, 0.0)) * vivoImp;
        vec4 mvPosition = viewMatrix * vec4(mundoImp, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vUvImp = vec2((kImp + position.x * 0.96 + 0.5) / uAngulosImp, (aCelda.x + 0.01 + 0.98 * position.y) / uFilasImp);
        vUvImp1 = vec2((k1Imp + position.x * 0.96 + 0.5) / uAngulosImp, vUvImp.y);
        vRot0Imp = c0Imp / max(sxImp, 1e-5); vRot2Imp = c2Imp / max(szImp, 1e-5);
        vAzarImp = fract(sin(dot(baseImp.xz, vec2(12.9898, 78.233))) * 43758.5453);
        vAlturaImp = altoImp * syImp;
        vPosMundoImp = mundoImp;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uAtlasColor; uniform sampler2D uAtlasNormal;
        uniform float uOtonoImp; uniform float uInviernoImp; uniform float uTrasluzImp; uniform float uLluviaImp; uniform float uNubesImp;
        uniform vec3 uSolDirImp; uniform vec3 uSolColorImp; uniform vec3 uCieloBajoImp;
        varying vec2 vUvImp; varying vec2 vUvImp1; varying float vMezclaImp; varying vec3 vRot0Imp; varying vec3 vRot2Imp; varying float vAzarImp; varying float vAlturaImp; varying vec3 vPosMundoImp;
        ${GLSL_ESTILO}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        // (un poco más nítido que el mipmap que toca y con umbral bajo: las copas finas de
        // canto no se comen al alejarse). 3.4: las dos fotos vecinas, fundidas (el atlas
        // está premultiplicado por su fondo transparente: se mezcla y después se divide)
        vec4 texCImp = mix(texture2D(uAtlasColor, vUvImp, -0.7), texture2D(uAtlasColor, vUvImp1, -0.7), vMezclaImp);
        if (texCImp.a < 0.4) discard;
        vec4 texNImp = mix(texture2D(uAtlasNormal, vUvImp, -0.7), texture2D(uAtlasNormal, vUvImp1, -0.7), vMezclaImp) / texCImp.a;
        vec3 nObjImp = normalize(texNImp.rgb * 2.0 - 1.0);
        float tipoImp = floor(texNImp.a * 4.0 + 0.5);
        vec3 albedoImp = texCImp.rgb / texCImp.a;
        diffuseColor.rgb *= albedoImp * albedoImp;
        // 3.3: el otoño y la nieve, como en el material del árbol (por tipo de pieza)
        if (tipoImp > 1.5 && tipoImp < 2.5) {
          float azar = vAzarImp;
          vec3 otono = azar < 0.45 ? mix(vec3(0.42, 0.05, 0.012), vec3(0.62, 0.09, 0.015), azar * 2.2) : mix(vec3(0.70, 0.20, 0.012), vec3(0.82, 0.42, 0.03), (azar - 0.45) * 1.8);
          float lumV = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          diffuseColor.rgb = mix(diffuseColor.rgb, otono * clamp(lumV / 0.12, 0.45, 1.3), uOtonoImp);
        }
        // (3.5: el follaje con el mismo umbral que el árbol 3D: la normal horneada es la del racimo,
        // corrida como en promedio las cartas cercanas, que se nievan sólo en su mitad de arriba)
        // (3.5.2: la nieve del follaje, el mismo color que en materialVegetal)
        // (3.5.2: y cuánta nieve tiene, para bajarle el trasluz y el dorado como en materialVegetal)
        float nieveImp = (tipoImp < 2.5 && tipoImp > 0.5 || tipoImp > 3.5) ? uInviernoImp * (tipoImp > 3.5 ? smoothstep(0.3, 0.85, nObjImp.y) : smoothstep(0.5, 0.95, nObjImp.y - 0.2)) * 0.9 : 0.0;
        diffuseColor.rgb = mix(diffuseColor.rgb, tipoImp > 3.5 ? vec3(0.80, 0.84, 0.90) : vec3(0.72, 0.76, 0.83), nieveImp);
        vec3 nMundoImp = normalize(vRot0Imp * nObjImp.x + vec3(0.0, 1.0, 0.0) * nObjImp.y + vRot2Imp * nObjImp.z);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal = normalize((viewMatrix * vec4(nMundoImp, 0.0)).xyz);`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        {
          // 3.3: los términos de estilo de la vegetación (3.2), sin el detalle de cerca
          vec3 haciaOjoM = cameraPosition - vPosMundoImp;
          vec3 vistaM = haciaOjoM / max(length(haciaOjoM), 1e-3);
          float esHoja = (tipoImp > 0.5 && tipoImp < 3.5) ? 1.0 : 0.0;
          float esMadera = 1.0 - step(0.5, tipoImp);
          gl_FragColor.rgb *= mix(vec3(1.0), vec3(1.08, 1.0, 0.86), esMadera);
          if (esHoja > 0.5) {
            float arribaHoja = max(nMundoImp.y, 0.0);
            float luzLateral = max(dot(nMundoImp, normalize(uSolDirImp)), 0.0);
            float alturaCopa = smoothstep(0.7, 7.0, vAlturaImp);
            gl_FragColor.rgb *= mix(0.88, 1.025, alturaCopa * 0.72 + arribaHoja * 0.28);
            gl_FragColor.rgb += uCieloBajoImp * arribaHoja * 0.018;
            vec3 temple352 = mix(vec3(0.86, 0.97, 1.06), vec3(1.1, 1.04, 0.84), smoothstep(0.0, 0.8, luzLateral));
            gl_FragColor.rgb *= mix(temple352, min(temple352, vec3(1.0)), nieveImp);   // 3.5.2
            if (uLluviaImp > 0.01) gl_FragColor.rgb *= mix(1.0, 0.78, uLluviaImp * 0.8);
          } else if (uInviernoImp > 0.05) {
            float acumula = smoothstep(0.45, 0.95, nMundoImp.y) * uInviernoImp * 0.82;
            gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.92, 0.94, 0.97) * (0.7 + 0.5 * max(nMundoImp.y, 0.0)), acumula * 0.85);
          }
          #if NUM_DIR_LIGHTS > 0
          {
            float atras = max(0.0, dot(-vistaM, normalize(uSolDirImp)));
            float brillo = pow(atras, 8.0) * uTrasluzImp * esHoja * (1.0 - uInviernoImp * 0.75) * (1.0 - nieveImp);   // (3.5.2)
            gl_FragColor.rgb += directionalLights[0].color * brillo * (diffuseColor.rgb * 2.4 + 0.02) * vec3(1.0, 0.92, 0.5) * 0.5;
          }
          #endif
          float rasanteVeg = 1.0 - smoothstep(0.07, 0.36, abs(uSolDirImp.y));
          float bordeSolVeg = pow(max(dot(-vistaM, uSolDirImp), 0.0), 4.0);
          // 3.5.2: el aire del suelo, con la misma cuenta que el árbol 3D (materialVegetal) y que
          // materialTerreno: el bosque lejano ya no queda pálido y despegado de la ladera
          float dAireVeg = length(vPosMundoImp.xz - cameraPosition.xz);
          float aireVeg = smoothstep(70.0, 380.0, dAireVeg) * (1.0 + uNubesImp * 0.4 + uLluviaImp * 0.5);
          float bajoVeg = 1.0 - pow(max(dot(-vistaM, normalize(uSolDirImp)), 0.0), 3.0) * (1.0 - smoothstep(0.06, 0.4, uSolDirImp.y)) * step(0.0, uSolDirImp.y) * 0.45 * (1.0 - uNubesImp * 0.6);
          bajoVeg *= 0.6 + 0.4 * exp(-max(vPosMundoImp.y - vAlturaImp - 14.0, 0.0) / 90.0);   // (la altura del pie)
          gl_FragColor.rgb += uSolColorImp * bordeSolVeg * rasanteVeg * esHoja * (1.0 - min(aireVeg, 1.0) * 0.65) * (1.0 - nieveImp) * 0.07;
          gl_FragColor.rgb = gradoEstilo(gl_FragColor.rgb);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, colorBruma(-vistaM), clamp(aireVeg * bajoVeg * 0.2 * uBrumaFuerza, 0.0, 0.4));
        }`);
  };
  m.customProgramCacheKey = () => 'impostor-3.4';
  return m;
}

// 3.3: la malla única de impostores. `arboles`: [{ fila, matriz (Float32Array/array 16), tinte [r,g,b] }]
// 3.4: `cartas`: el atlas de cartas de follaje con que se hornean las copas
export function crearImpostores(renderer, especies, arboles, { inicio, fin, lejos, cartas = null }) {
  let verano = hornearImpostores(renderer, especies, false, cartas);
  let invierno = null;
  const estado = {
    uColor: { value: verano.color.texture }, uNormal: { value: verano.normal.texture }, uFilas: { value: verano.filas },
    uInicio: { value: inicio }, uFin: { value: fin }, uLejos: { value: lejos },
  };
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const n = Math.max(1, arboles.length);
  const celdas = new Float32Array(n * 4);
  arboles.forEach((a, i) => {
    const c = verano.cajas[a.fila];
    celdas.set([a.fila, c.r, c.y0, c.y1], i * 4);
  });
  geo.setAttribute('aCelda', new THREE.InstancedBufferAttribute(celdas, 4));
  const malla = new THREE.InstancedMesh(geo, materialImpostor(estado), n);
  malla.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3);
  arboles.forEach((a, i) => {
    malla.instanceMatrix.array.set(a.matriz, i * 16);
    if (a.tinte) malla.instanceColor.array.set(a.tinte, i * 3);
  });
  malla.count = arboles.length;
  malla.frustumCulled = false;   // cubre todo el valle; el shader descarta los cercanos
  malla.castShadow = false; malla.receiveShadow = false;
  malla.matrixAutoUpdate = false;
  malla.updateMatrixWorld(true);
  malla.matrixWorldAutoUpdate = false;
  malla.name = 'impostores';
  // el invierno pela a los caducos: se usa el atlas de invierno. Se hornea fuera del
  // render (desde actualizar, apenas el invierno se acerca) y acá sólo se elige cuál va.
  function estacion() {
    if (!invierno && U.uInvierno.value > 0.4) invierno = hornearImpostores(renderer, especies, true, cartas);
  }
  malla.onBeforeRender = () => {
    const atlas = U.uInvierno.value > 0.5 && invierno ? invierno : verano;
    estado.uColor.value = atlas.color.texture; estado.uNormal.value = atlas.normal.texture;
  };
  function ponerMatriz(i, elementos) {
    malla.instanceMatrix.array.set(elementos, i * 16);
    malla.instanceMatrix.needsUpdate = true;
  }
  // 3.5.1: si la placa pierde el contexto 3D, three rehace sus render targets vacíos: las fotos
  // de los árboles lejanos se pierden (quedarían carteles vacíos). Se hornean de nuevo en los
  // mismos atlas (three les vuelve a pedir memoria a la placa al dibujar en ellos; soltarlos
  // tocaría objetos del contexto viejo) y con las mismas cajas: las celdas no cambian.
  function rehornear() {
    verano = hornearImpostores(renderer, especies, false, cartas, verano);
    if (invierno) invierno = hornearImpostores(renderer, especies, true, cartas, invierno);
    estado.uColor.value = verano.color.texture; estado.uNormal.value = verano.normal.texture;
    return verano.ms + (invierno ? invierno.ms : 0);
  }
  return { malla, estado, ponerMatriz, estacion, rehornear, atlas: () => ({ verano, invierno }), msHorneado: verano.ms };
}
