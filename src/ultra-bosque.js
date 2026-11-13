// 4.28.0 (B): el bosque, el pasto y el suelo del nivel Ultra (ver ultra.js). Nada de esto existe con Ultra apagado: los materiales
// quedan con su onBeforeCompile, su clave de programa y sus uniformes de siempre, no se arma ninguna malla ni textura, y Alta, Media
// y Baja dibujan exactamente lo de la 4.27.0. Con Ultra prendido (y sólo mientras la calidad que corre es Alta):
//   · viento: el pasto y las copas se mueven con una ola de ráfaga que barre el campo en la dirección del viento (la misma ola en el
//     pasto y en los árboles), más fuerte con lluvia y temporal; el pasto que dobla la ráfaga brilla un poco (la hoja muestra el
//     lomo). Los troncos quedan quietos: la madera cerca del eje del árbol no se dobla, las ramas de afuera apenas;
//   · pasto: el doble de matas a menos de ~20 m (una malla más que comparte el material del pasto: ningún programa más) y el pasto
//     que pisaste queda un rato aplastado (una textura chica que sigue al jugador y se recupera sola en unos veinte segundos);
//   · suelo: el grano de menos de 4 m cerca de la cámara (terrones, piedritas, hojitas) con relieve por píxel, y el borde blando
//     donde `marcarPisos` corta el pasto (el corte se quiebra con ruido, el pasto se achica antes del piso y el borde se pisotea);
//   · follaje: la luz del sol que atraviesa las hojas, en un cono más ancho y más clara a contraluz y en el borde de la copa.
// Todo entra por `parcharUltra`: envuelve el onBeforeCompile del material (lo de Ultra se suma después de lo de siempre) y le da una
// clave de programa propia (la de siempre + CLAVE_ULTRA_B), así los programas de Alta no cambian. `quitarUltra` lo deja como estaba.
import * as THREE from 'three';
import { U, REGISTRO_ULTRA_B, GLSL_COMUN } from './materiales.js';
import { esUltra } from './ultra.js';

export const CLAVE_ULTRA_B = 'ultra-b-4.28.0';

// la ola de ráfaga: un frente que avanza con el viento (unos 10 m/s) y se corta a lo ancho con un ruido lento; la misma en el pasto y en
// las copas. 0 entre ola y ola, 1 en la cresta.
export const GLSL_OLA_UB = /* glsl */`
  float olaUltraB(vec2 b, float tiempo) {
    vec2 dirU = normalize(vec2(1.0, 0.35));
    float frente = sin(dot(b, dirU) * 0.035 - tiempo * 0.36);
    float ancho = 0.55 + 0.45 * sin(dot(b, vec2(-dirU.y, dirU.x)) * 0.021 + tiempo * 0.11);
    return pow(frente * 0.5 + 0.5, 3.0) * ancho;
  }
`;

// Cambia `de` por `a` en el texto del programa; si no está, avisa una vez (el programa queda como el de siempre en esa parte)
const avisados = new Set();
function cambiar(texto, de, a, donde) {
  if (!texto.includes(de)) {
    if (!avisados.has(donde)) { avisados.add(donde); console.warn('ultra-bosque: no encontré «' + de.slice(0, 50) + '» en ' + donde); }
    return texto;
  }
  return texto.split(de).join(a);
}

// ---------------------------------------------------------------- los parches (texto de los programas)
// El material del bosque (materialVegetal): viento de Ultra y la luz que atraviesa las hojas
export function parcheVegetal(sh) {
  sh.uniforms.uLluviaUB = U.uLluvia;
  let v = sh.vertexShader;
  v = cambiar(v, '#include <common>', '#include <common>\n        uniform float uLluviaUB;\n' + GLSL_OLA_UB, 'vegetal: common');
  // los troncos quietos: la madera cerca del eje del árbol (a menos de ~0,4 m) no se dobla; las ramas de afuera, de a poco
  v = cambiar(v, 'float rigidez = mix(0.26, 1.0, esFollajeV);',
    'float rigidez = mix(0.26 * smoothstep(0.4, 2.4, length(position.xz)), 1.0, esFollajeV);', 'vegetal: rigidez');
  // la ola que barre el bosque: dobla la copa en la dirección del viento (más con lluvia y temporal) y agita las hojas
  v = cambiar(v, 'cos(uTiempo * 1.55 + fase * 0.9) * torsionAlta * alt * 0.65;', `cos(uTiempo * 1.55 + fase * 0.9) * torsionAlta * alt * 0.65;
          float olaUB = olaUltraB(posI.xz, uTiempo);
          float fuerzaUB = uViento * (1.0 + 0.9 * uLluviaUB);
          transformed.xz += dirV * olaUB * fuerzaUB * min(alt, 14.0) * 0.03 * rigidez * anclajeRaiz * uFlex;`, 'vegetal: ola');
  v = cambiar(v, 'float hojaFina = 0.018 + 0.022 * rafaga;', 'float hojaFina = (0.018 + 0.022 * rafaga) * (1.6 + 0.6 * uLluviaUB) + 0.05 * olaUB;', 'vegetal: hojas');
  sh.vertexShader = v;
  let f = sh.fragmentShader;
  // la luz que atraviesa la copa: un cono más ancho que el de Alta (toda la copa a contraluz se ilumina, no sólo la que tapa el sol),
  // más en el borde (donde hay menos hojas encimadas) y la cara de la sombra recibe la luz que pasa (la copa no es negra del otro lado)
  f = cambiar(f, 'float brillo = pow(atras, 8.0) * uTrasluz * vHojas * (1.0 - uInvierno * 0.75) * (1.0 - vNieveVeg);', `float espesorUB = 0.5 + 0.5 * (1.0 - max(dot(nMV, vistaM), 0.0));
            float pasaUB = max(dot(-nMV, normalize(uSolDirVeg)), 0.0) * 0.32 * smoothstep(-0.05, 0.2, uSolDirVeg.y);
            float brillo = (pow(atras, 8.0) * 1.35 + pow(atras, 2.5) * 0.6 * espesorUB + pasaUB) * uTrasluz * vHojas * (1.0 - uInvierno * 0.75) * (1.0 - vNieveVeg);`, 'vegetal: trasluz');
  f = cambiar(f, 'gl_FragColor.rgb += directionalLights[0].color * brillo * (diffuseColor.rgb * 2.4 + 0.02) * vec3(1.0, 0.92, 0.5) * 0.5;',
    'gl_FragColor.rgb += directionalLights[0].color * brillo * (diffuseColor.rgb * 2.6 + vec3(0.03, 0.035, 0.0)) * vec3(1.0, 0.95, 0.52) * 0.55;', 'vegetal: trasluz color');
  // (agregado del usuario) las gotas que brillan en las hojas después de la lluvia y con el rocío de la mañana: puntitos de unos 2 cm en una
  // de cada catorce celdas de 4,5 cm, de cerca (se apagan de 6 a 14 m), con el brillo del sol que rebota en la gota y algo del cielo
  sh.uniforms.uGotasUB = UB.uGotas;
  f = cambiar(f, '#include <common>', '#include <common>\n        uniform float uGotasUB;', 'vegetal: gotas (uniforme)');
  f = cambiar(f, 'gl_FragColor.rgb = mix(gl_FragColor.rgb, colorBruma(-vistaM)', `if (uGotasUB > 0.01 && esHoja > 0.5 && dOjo < 14.0) {
            vec3 qGU = vPosMundoVeg * 22.0, fGU = fract(qGU) - 0.5;
            float hGU = hash12(floor(qGU).xz + floor(qGU).y * 7.13);
            float puntoGU = (1.0 - smoothstep(0.1, 0.24, length(fGU))) * step(0.93, hGU) * (1.0 - smoothstep(6.0, 14.0, dOjo)) * (1.0 - vNieveVeg);
            float rebotaGU = pow(max(dot(reflect(-normalize(uSolDirVeg), nMV), vistaM), 0.0), 6.0) * 2.5 + 0.3;
            gl_FragColor.rgb += (uSolColorVeg * rebotaGU + uCieloBajoVeg * 0.4) * puntoGU * uGotasUB;
          }
          gl_FragColor.rgb = mix(gl_FragColor.rgb, colorBruma(-vistaM)`, 'vegetal: gotas');
  sh.fragmentShader = f;
}

// El pasto de las matas (el anillo grande de pasto.js): ola de ráfaga, el aplastado, el borde blando de los pisos
export function parchePasto(sh) {
  Object.assign(sh.uniforms, { uLluviaUB: U.uLluvia, uPisadoUB: UB.uPisado, uPisadoCentroUB: UB.uPisadoCentro, uPisadoLadoUB: UB.uPisadoLado, uGotasUB: UB.uGotas });
  let v = sh.vertexShader;
  v = cambiar(v, 'void main() {', `uniform float uLluviaUB; uniform sampler2D uPisadoUB; uniform vec2 uPisadoCentroUB; uniform float uPisadoLadoUB; varying vec3 vPosUB;
      ${GLSL_OLA_UB}
      void main() {`, 'pasto: main');
  // el borde de los pisos: el corte se quiebra con ruido (sólo hacia afuera del corte de siempre: nunca sale pasto dentro de un piso,
  // ni en las obras chicas) y el pasto se achica antes de llegar
  v = cambiar(v, '* enPantallaAnillo(b) * (1.0 - step(0.4, estT.b));', '* enPantallaAnillo(b) * (1.0 - step(0.4 - 0.16 * vnoise(b * 1.7), estT.b));', 'pasto: corte');
  v = cambiar(v, 'float ang = rnd * 6.2831 + aHoja * 2.094 + (rh - 0.5) * 0.9;', `alto *= mix(0.3, 1.0, 1.0 - smoothstep(0.02, 0.3, estT.b));
        // (agregado del usuario) de cerca (hasta ~12 m), la hoja del medio de algunas matas es otra cosa: un tallo fino y más alto con la
        // espiga dorada (4,5 %) o con una florcita en la punta, blanca, amarilla o lila (4 %; no en la estepa, ni en invierno)
        float claseUB = fract(rnd * 41.3 + aAzar * 5.17);
        float medioUB = step(0.5, aHoja) * step(aHoja, 1.5) * (1.0 - smoothstep(9.0, 14.0, length(b - uCam.xz))) * (1.0 - estepa);
        float espigaUB = step(claseUB, 0.045) * medioUB;
        float florUB = step(0.045, claseUB) * step(claseUB, 0.085) * medioUB * (1.0 - smoothstep(0.1, 0.5, uInvierno)) * (1.0 - uOtono * 0.6);
        alto *= 1.0 + 0.45 * espigaUB + 0.25 * florUB;
        ancho *= 1.0 - 0.6 * max(espigaUB, florUB);
        float ang = rnd * 6.2831 + aHoja * 2.094 + (rh - 0.5) * 0.9;`, 'pasto: alto en el borde');
  // (el tallo: el par del medio de la hoja sube a 0,92 del alto, así la cabeza —de 0,92 a la punta— es chica y el resto es tallo verde)
  v = cambiar(v, 'vec3 p = vec3(b.x, h, b.y) + frente * (0.025', `t = mix(t, 0.92, step(0.4, t) * step(t, 0.6) * max(espigaUB, florUB));
        vec3 p = vec3(b.x, h, b.y) + frente * (0.025`, 'pasto: tallo');
  v = cambiar(v, 'float fuerzaV = uViento * (0.45 + racha * 1.25) * (1.0 + estepa * 0.32);', `float olaUB = olaUltraB(b, uTiempo);
        float fuerzaV = uViento * (1.0 + 0.9 * uLluviaUB) * (0.45 + racha * 1.25 + olaUB * 1.1) * (1.0 + estepa * 0.32);`, 'pasto: ola');
  v = cambiar(v, 'vec4 mvPosition = viewMatrix * vec4(p, 1.0);', `float pisadoUB = 0.0;
        {
          vec2 uvPU = (b - uPisadoCentroUB) / uPisadoLadoUB + 0.5;
          float dentroPU = step(0.0, uvPU.x) * step(uvPU.x, 1.0) * step(0.0, uvPU.y) * step(uvPU.y, 1.0);
          pisadoUB = texture2D(uPisadoUB, clamp(uvPU, 0.0, 1.0)).r * dentroPU;
          p.y -= t * alto * pisadoUB * 0.55;
          p.xz += frente.xz * t * alto * pisadoUB * 0.5;
        }
        p += derecha * position.x * ancho * step(0.99, t) * (florUB * 2.2 + espigaUB * 1.2);   // (la cabeza de la flor y de la espiga)
        vPosUB = p;
        vec4 mvPosition = viewMatrix * vec4(p, 1.0);`, 'pasto: pisado');
  // la hoja que dobla la ola muestra el lomo (más clara) y la aplastada queda un poco más pálida
  v = cambiar(v, 'vT = t;', `vColor *= 1.0 + olaUB * min(uViento, 1.0) * 0.24 * smoothstep(0.3, 1.0, t);
        vColor = mix(vColor, vColor * vec3(1.08, 1.06, 0.9), pisadoUB * 0.6);
        vec3 florColUB = fract(rnd * 13.7) < 0.4 ? vec3(0.95, 0.93, 0.86) : (fract(rnd * 13.7) < 0.72 ? vec3(0.95, 0.78, 0.18) : vec3(0.64, 0.5, 0.86));
        vColor = mix(vColor, srgb(florColUB), florUB * smoothstep(0.95, 1.0, t));
        vColor = mix(vColor, srgb(vec3(0.62, 0.5, 0.26)), espigaUB * smoothstep(0.7, 1.0, t) * 0.8);
        vT = t;`, 'pasto: color');
  // las gotas en el pasto (después de la lluvia y con rocío): puntitos de unos 1,5 cm en las hojas, de cerca, que brillan con el sol
  let fr = sh.fragmentShader;
  fr = cambiar(fr, 'void main() {', `uniform float uGotasUB; varying vec3 vPosUB;
  float hashUB(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  void main() {`, 'pasto: gotas (main)');
  fr = cambiar(fr, 'gl_FragColor = vec4(gradoEstilo(vColor * luz), 1.0);', `vec3 colUB = vColor * luz;
    if (uGotasUB > 0.01) {
      vec3 qGU = vPosUB * 30.0, fGU = fract(qGU) - 0.5;
      float dGU = length(cameraPosition - vPosUB);
      float puntoGU = (1.0 - smoothstep(0.12, 0.32, length(fGU.xz))) * step(0.9, hashUB(floor(qGU).xz + floor(qGU).y * 3.7)) * smoothstep(0.25, 0.6, vT) * (1.0 - smoothstep(5.0, 12.0, dGU));
      float rebotaGU = pow(max(dot(reflect(-uSolDir, normalize(vNormal2)), normalize(cameraPosition - vPosUB)), 0.0), 4.0) * 3.0 + 0.3;
      colUB += (uSolColor * rebotaGU + uAmbiente) * puntoGU * uGotasUB;
    }
    gl_FragColor = vec4(gradoEstilo(colUB), 1.0);`, 'pasto: gotas');
  sh.fragmentShader = fr;
  sh.vertexShader = v;
}

// Las flores y los helechos del pasto: sólo el borde blando de los pisos (el mismo corte quebrado)
export function parcheAnillo(sh) {
  sh.vertexShader = cambiar(sh.vertexShader, '(1.0 - step(0.4, est.b))', '(1.0 - step(0.4 - 0.16 * vnoise(b * 1.7), est.b))', 'anillo: corte');
}

// El suelo (materialTerreno): el grano de menos de 4 m con relieve y el borde pisoteado de los pisos
export function parcheTerreno(sh) {
  let f = sh.fragmentShader;
  f = cambiar(f, '#include <color_fragment>', 'float granoUB = 0.0; float pesoGranoUB = 0.0;\n        #include <color_fragment>', 'terreno: variables');
  f = cambiar(f, 'diffuseColor.rgb = col;', `{
            // 4.28.0 (B, Ultra): el grano cercano. Tres escalas (de unos 40, 16 y 7 cm), que se apagan con la distancia y con el tamaño del
            // píxel (sin titilar): terrones y pozos (el relieve), piedritas claras en la tierra y el camino, hojitas en el piso del bosque
            float dGU = length(cameraPosition - vPosMundo);
            pesoGranoUB = (1.0 - smoothstep(16.0, 28.0, dGU)) * (1.0 - nieve * 0.85);
            if (pesoGranoUB > 0.01) {
              float pieU = length(fwidth(vPosMundo.xz));
              float g1 = vnoise(p * 2.4 + 3.1), g2 = vnoise(p * 6.3 + 7.7), g3 = vnoise(p * 14.0 + 1.3);
              float fino2 = 1.0 - smoothstep(0.04, 0.12, pieU), fino3 = 1.0 - smoothstep(0.02, 0.06, pieU);
              float tierraU = clamp(sendero * 1.2 + (1.0 - pasto) * (1.0 - bosque) * 0.4 + pend * 1.5, 0.0, 1.0);
              float piedra = smoothstep(0.7, 0.86, g2) * tierraU * fino2;
              granoUB = ((g1 - 0.5) * 0.05 + (g2 - 0.5) * 0.022 * fino2 + (g3 - 0.5) * 0.008 * fino3 + piedra * 0.025) * (1.0 - nieve * 0.9);   // (sobre la nieve, casi liso: con el sol bajo el relieve la ponía azul)
              float cavidad = 0.78 + 0.4 * clamp(g1 * 0.6 + g2 * 0.4 * fino2, 0.0, 1.0);
              col *= mix(1.0, cavidad, pesoGranoUB);
              col = mix(col, mix(srgb(vec3(0.66, 0.62, 0.55)), srgb(vec3(0.54, 0.52, 0.48)), g3), piedra * 0.55 * pesoGranoUB);
              float hojitas = smoothstep(0.7, 0.82, g3) * smoothstep(0.3, 0.8, bosque) * fino3 * (1.0 - sendero) * (1.0 - nieve);
              col = mix(col, mix(srgb(vec3(0.44, 0.32, 0.17)), srgb(vec3(0.34, 0.28, 0.16)), g2), hojitas * 0.3 * pesoGranoUB);
              col *= mix(1.0, 0.82 + 0.18 * g2, smoothstep(0.55, 0.75, g1) * pasto * (1.0 - bosque) * 0.6 * pesoGranoUB);
            }
            // el borde de los pisos (donde marcarPisos corta el pasto): tierra pisoteada y pasto corto, sin línea recta
            float bordePisoU = smoothstep(0.03, 0.3, est.b) * (1.0 - smoothstep(0.55, 0.95, est.b)) * (1.0 - nieve);
            col = mix(col, col * mix(vec3(0.8, 0.86, 0.74), vec3(0.94, 0.86, 0.72), vnoise(p * 1.3)), bordePisoU * 0.45);
          }
          diffuseColor.rgb = col;`, 'terreno: grano');
  // el relieve del grano: la normal se inclina con la pendiente de la altura del grano (derivadas de pantalla, en la vista)
  f = cambiar(f, '#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (pesoGranoUB > 0.01) {
          vec3 dpxU = dFdx(-vViewPosition), dpyU = dFdy(-vViewPosition);
          float dhxU = dFdx(granoUB) * pesoGranoUB, dhyU = dFdy(granoUB) * pesoGranoUB;
          vec3 r1U = cross(dpyU, normal), r2U = cross(normal, dpxU);
          float detU = dot(dpxU, r1U);
          vec3 gradU = sign(detU) * (dhxU * r1U + dhyU * r2U);
          normal = normalize(abs(detU) * normal - gradU);
        }`, 'terreno: relieve');
  sh.fragmentShader = f;
}

// ---------------------------------------------------------------- poner y sacar Ultra de un material
// Envuelve el onBeforeCompile (lo de Ultra corre después de lo de siempre) y la clave del programa (la de siempre, calculada ANTES de
// envolver, + CLAVE_ULTRA_B: dos materiales que compartían programa en Alta lo comparten en Ultra, y ninguno de Ultra pisa uno de Alta)
export function parcharUltra(m, parche) {
  if (!m || m.userData.ultraB) return false;
  const propioObc = Object.hasOwn(m, 'onBeforeCompile'), propioClave = Object.hasOwn(m, 'customProgramCacheKey');
  const obc = m.onBeforeCompile, clave = m.customProgramCacheKey;
  const claveAlta = clave.call(m);
  const envoltura = function (sh, r) { obc.call(this, sh, r); parche(sh, this); };
  m.userData.ultraB = { obc, clave, propioObc, propioClave, envoltura };
  m.onBeforeCompile = envoltura;
  m.customProgramCacheKey = () => claveAlta + '|' + CLAVE_ULTRA_B;
  m.dispose();   // (suelta el programa de Alta de este material: no queda vivo de más)
  m.needsUpdate = true;
  return true;
}
export function quitarUltra(m) {
  const g = m?.userData?.ultraB;
  if (!g) return false;
  // (si alguien envolvió el material después, se deja la envoltura pero sin parche: el programa vuelve a ser el de siempre)
  if (m.onBeforeCompile === g.envoltura) {
    if (g.propioObc) m.onBeforeCompile = g.obc; else delete m.onBeforeCompile;
    if (g.propioClave) m.customProgramCacheKey = g.clave; else delete m.customProgramCacheKey;
  }
  delete m.userData.ultraB;
  if (m.uniforms) for (const k of ['uLluviaUB', 'uPisadoUB', 'uPisadoCentroUB', 'uPisadoLadoUB', 'uGotasUB']) delete m.uniforms[k];   // (ShaderMaterial: los uniformes son los suyos)
  m.dispose();
  m.needsUpdate = true;
  return true;
}

// ---------------------------------------------------------------- el pasto aplastado
// Una textura de 64 × 64 (texeles de 0,375 m) centrada en el jugador: donde pisa se marca y se va borrando sola.
export const PISADO_RES = 64;
export const PISADO_LADO = 24;
export const UB = { uPisado: { value: null }, uPisadoCentro: { value: new THREE.Vector2() }, uPisadoLado: { value: PISADO_LADO }, uGotas: { value: 0 } };

export function crearPisado() {
  const datos = new Uint8Array(PISADO_RES * PISADO_RES);
  const tex = new THREE.DataTexture(datos, PISADO_RES, PISADO_RES, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const tam = PISADO_LADO / PISADO_RES;
  const centro = new THREE.Vector2(0, 0);
  let primero = true, ultimoX = 1e9, ultimoZ = 1e9, borrar = 0;
  // corre lo marcado cuando el centro se mueve (de a texeles enteros: nada salta)
  function recentrar(x, z) {
    const nx = Math.round(x / tam) * tam, nz = Math.round(z / tam) * tam;
    const di = Math.round((nx - centro.x) / tam), dj = Math.round((nz - centro.y) / tam);
    if (primero || Math.abs(di) >= PISADO_RES || Math.abs(dj) >= PISADO_RES) datos.fill(0);
    else if (di || dj) {
      const copia = datos.slice();
      datos.fill(0);
      for (let j = 0; j < PISADO_RES; j++) {
        const jj = j + dj; if (jj < 0 || jj >= PISADO_RES) continue;
        for (let i = 0; i < PISADO_RES; i++) { const ii = i + di; if (ii >= 0 && ii < PISADO_RES) datos[j * PISADO_RES + i] = copia[jj * PISADO_RES + ii]; }
      }
    }
    primero = false;
    centro.set(nx, nz);
    UB.uPisadoCentro.value.copy(centro);
    tex.needsUpdate = true;
  }
  // una huella de pasto aplastado (unos 45 cm de radio, más fuerte en el medio)
  function marcar(x, z) {
    const u = (x - centro.x) / tam + PISADO_RES / 2 - 0.5, v = (z - centro.y) / tam + PISADO_RES / 2 - 0.5;
    const r = 0.45 / tam;
    for (let j = Math.floor(v - r); j <= Math.ceil(v + r); j++) {
      for (let i = Math.floor(u - r); i <= Math.ceil(u + r); i++) {
        if (i < 0 || j < 0 || i >= PISADO_RES || j >= PISADO_RES) continue;
        const d = Math.hypot(i - u, j - v) / r;
        if (d >= 1) continue;
        const k = j * PISADO_RES + i;
        datos[k] = Math.max(datos[k], Math.round(255 * Math.min(1, (1 - d) * 1.6)));
      }
    }
    tex.needsUpdate = true;
  }
  function actualizar(dt, js) {
    if (!js?.pos) return;
    const { x, z } = js.pos;
    if (primero || Math.abs(x - centro.x) > PISADO_LADO * 0.25 || Math.abs(z - centro.y) > PISADO_LADO * 0.25) recentrar(x, z);
    if (js.enSuelo !== false && !js.nadando && !js.montado && Math.hypot(x - ultimoX, z - ultimoZ) > 0.2) { marcar(x, z); ultimoX = x; ultimoZ = z; }
    // se recupera en ~18 s (de 255 a 0 de a 3 cada 0,2 s)
    borrar += dt;
    if (borrar > 0.2) {
      borrar = 0;
      let algo = false;
      for (let k = 0; k < datos.length; k++) if (datos[k]) { datos[k] = Math.max(0, datos[k] - 3); algo = true; }
      if (algo) tex.needsUpdate = true;
    }
  }
  UB.uPisado.value = tex;
  return { tex, datos, actualizar, marcar, centro, dispose() { tex.dispose(); if (UB.uPisado.value === tex) UB.uPisado.value = null; } };
}

// ---------------------------------------------------------------- (agregado del usuario) polvo y polen en los rayos del bosque, hojas que caen
// Un solo dibujo de puntos alrededor de la cámara (un programa sólo de Ultra). El polvo (MOTAS_POLVO) flota despacio en una caja de 22 m y
// se enciende sólo donde le da el sol entre las copas: las mismas manchas de sol que el suelo del bosque (materialTerreno, «luz moteada»)
// proyectadas desde el suelo hacia el sol, así brilla en los rayos y no en la sombra; más a contraluz (dispersión hacia adelante). Las
// hojas (MOTAS_HOJAS) caen de unos 13 m dando vueltas y derivando con el viento, en una caja de 36 m: sólo bajo el bosque, más en otoño
// y con viento, ninguna en invierno. Todo sale del tiempo y de las texturas del valle: nada por cuadro en la CPU.
export const MOTAS_POLVO = 520;
export const MOTAS_HOJAS = 0;   // (4.28.0: afuera al cerrar: las hojas que caen no se llegaron a ver en el juego; con 300 vuelven)
export function crearMotas() {
  const n = MOTAS_POLVO + MOTAS_HOJAS;
  const semilla = new Float32Array(n * 4), clase = new Float32Array(n);
  let r = 4281;
  const azar = () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; };
  for (let i = 0; i < n; i++) { for (let k = 0; k < 4; k++) semilla[i * 4 + k] = azar(); clase[i] = i < MOTAS_POLVO ? 0 : 1; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aSemilla', new THREE.Float32BufferAttribute(semilla, 4));
  g.setAttribute('aClase', new THREE.Float32BufferAttribute(clase, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const uniforms = { uTiempo: U.uTiempo, uViento: U.uViento, uOtono: U.uOtono, uInvierno: U.uInvierno, uLluvia: U.uLluvia, uSolDir: U.uSolDir, uSolColor: U.uSolColor,
    uAmbiente: U.uAmbiente, uMascara: U.uMascara, uAlturas: U.uAlturas, uAltoPx: { value: 1080 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, premultipliedAlpha: true, blending: THREE.NormalBlending, fog: false,
    vertexShader: /* glsl */`
      uniform float uTiempo; uniform float uViento; uniform float uOtono; uniform float uInvierno; uniform float uLluvia;
      uniform vec3 uSolDir; uniform vec3 uSolColor; uniform vec3 uAmbiente; uniform sampler2D uMascara; uniform sampler2D uAlturas; uniform float uAltoPx;
      attribute vec4 aSemilla; attribute float aClase;
      varying float vAlfa; varying vec3 vColorM; varying float vClase; varying float vGiro; varying float vVuelta;
      ${GLSL_COMUN}
      void main() {
        vec2 dirV = normalize(vec2(1.0, 0.35));
        bool polvo = aClase < 0.5;
        float caja = polvo ? 22.0 : 36.0;
        vec2 deriva = dirV * uTiempo * (polvo ? 0.08 + 0.2 * uViento : 0.3 + 1.2 * uViento) + vec2(sin(uTiempo * 0.21 + aSemilla.z * 6.28), cos(uTiempo * 0.17 + aSemilla.w * 6.28)) * 0.7;
        vec2 xz = cameraPosition.xz + mod(aSemilla.xy * caja + deriva - cameraPosition.xz + caja * 0.5, caja) - caja * 0.5;
        float suelo = texture2D(uAlturas, uvTerreno(xz)).r;
        float bosque = texture2D(uMascara, uvTerreno(xz)).a;
        float dia = smoothstep(0.0, 0.12, uSolDir.y);
        float alto = 0.0, alfa = 0.0;
        vec3 color = vec3(0.0);
        vec3 sol = normalize(uSolDir);
        vGiro = 0.0; vVuelta = 1.0;
        if (polvo) {
          alto = suelo + 0.3 + fract(aSemilla.z + uTiempo * 0.006 * (aSemilla.w - 0.5)) * 6.0;
          // el rayo: la mancha de sol del suelo, vista desde la mota hacia el sol
          vec2 piso = xz - sol.xz / max(sol.y, 0.15) * (alto - suelo);
          vec2 desliz = vec2(uTiempo * 0.16, uTiempo * 0.11) * (0.4 + uViento);
          float rayo = smoothstep(0.45, 0.8, vnoise((piso + uSolDir.xz * 6.0 + desliz) * 0.55));
          vec3 vista = normalize(vec3(xz.x, alto, xz.y) - cameraPosition);
          float adelante = pow(max(dot(vista, sol), 0.0), 5.0);
          alfa = smoothstep(0.45, 0.85, bosque) * dia * (1.0 - uLluvia) * (1.0 - uInvierno * 0.7) * (0.12 + 0.88 * rayo) * (0.35 + 1.6 * adelante);
          // polvo claro y algo de polen dorado
          color = uSolColor * mix(vec3(1.0, 0.94, 0.8), vec3(1.0, 0.82, 0.35), step(0.75, aSemilla.w)) * 2.6;
        } else {
          float caida = 13.0, vel = 0.5 + 0.4 * aSemilla.w;
          float fase = fract(aSemilla.z + uTiempo * vel / caida);
          alto = suelo + (1.0 - fase) * caida;
          xz += vec2(sin(uTiempo * 1.3 + aSemilla.w * 20.0), cos(uTiempo * 1.1 + aSemilla.z * 17.0)) * 0.45 + dirV * fase * caida * 0.3 * uViento;
          float cuantas = 0.15 + 0.6 * uOtono + 0.25 * min(uViento, 1.0);
          alfa = smoothstep(0.4, 0.8, bosque) * step(fract(aSemilla.w * 7.3), cuantas) * (1.0 - smoothstep(0.2, 0.6, uInvierno)) * smoothstep(0.0, 0.04, fase) * (1.0 - smoothstep(0.96, 1.0, fase));
          vec3 verano = mix(vec3(0.33, 0.36, 0.12), vec3(0.46, 0.36, 0.16), aSemilla.x);
          vec3 otono = mix(vec3(0.72, 0.22, 0.04), vec3(0.86, 0.56, 0.1), aSemilla.y);
          color = srgb(mix(verano, otono, uOtono)) * (uAmbiente * 1.6 + uSolColor * 0.55 * dia);
          vGiro = uTiempo * (1.2 + aSemilla.z * 2.4) + aSemilla.w * 6.28;
          vVuelta = cos(uTiempo * (2.0 + aSemilla.x * 2.0) + aSemilla.y * 6.28);
        }
        vec4 mv = viewMatrix * vec4(xz.x, alto, xz.y, 1.0);
        gl_Position = projectionMatrix * mv;
        alfa *= 1.0 - smoothstep(caja * 0.32, caja * 0.5, length(xz - cameraPosition.xz));
        gl_PointSize = clamp((polvo ? 0.034 : 0.085) * projectionMatrix[1][1] * uAltoPx * 0.5 / max(-mv.z, 0.2), polvo ? 1.5 : 2.0, 64.0);
        if (alfa < 0.004 || -mv.z < 0.3) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        vAlfa = clamp(alfa, 0.0, 1.0); vColorM = color; vClase = aClase;
      }`,
    fragmentShader: /* glsl */`
      varying float vAlfa; varying vec3 vColorM; varying float vClase; varying float vGiro; varying float vVuelta;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        if (vClase < 0.5) {
          float a = (1.0 - smoothstep(0.05, 0.5, length(c))) * vAlfa;
          gl_FragColor = vec4(vColorM * a, 0.0);   // (suma: el polvo brilla, no tapa)
        } else {
          vec2 q = mat2(cos(vGiro), -sin(vGiro), sin(vGiro), cos(vGiro)) * c;
          q.y /= max(abs(vVuelta), 0.25) * 0.42;
          if (dot(q, q) > 0.2 || vAlfa < 0.5) discard;
          gl_FragColor = vec4(vColorM * (0.8 + 0.4 * (q.x + 0.5)), 1.0);
        }
      }`,
  });
  const malla = new THREE.Points(g, mat);
  malla.name = 'motas-ultra';
  malla.frustumCulled = false;
  malla.renderOrder = 3;
  const tam = new THREE.Vector2();
  malla.onBeforeRender = (renderer) => { renderer.getDrawingBufferSize(tam); uniforms.uAltoPx.value = tam.y || 1080; };
  return { malla, dispose() { g.dispose(); mat.dispose(); } };
}

// cuántas gotas hay: lo que dejó la lluvia (uMojado) o el rocío de la mañana (de 5 a 10, más al alba; no con lluvia ni con nieve)
export function gotasAhora(horas, mojado, lluvia, invierno) {
  const h = Number(horas);
  const rocio = Number.isFinite(h) ? Math.max(0, 1 - Math.abs(h - 6.8) / 3.2) : 0;
  return Math.max(0, Math.min(1, Math.max(mojado * (1 - lluvia * 0.4), rocio * 0.85 * (1 - lluvia)) * (1 - invierno)));
}

// ---------------------------------------------------------------- el conjunto
// `revisar(activo, dt, js, pasto, horas)` una vez por cuadro: prende o apaga Ultra en los materiales anotados (REGISTRO_ULTRA_B), en el
// pasto (la malla densa), en el aplastado y en las motas; con Ultra prendido parcha también los materiales que se crearon después.
export function crearUltraBosque() {
  let activo = false, version = -1, pisado = null, pastoUltra = null, motas = null;
  const parchados = new Set();
  function vivos(lista) {
    const r = [];
    for (let i = lista.length - 1; i >= 0; i--) { const m = lista[i].deref(); if (m) r.push(m); else lista.splice(i, 1); }
    return r;
  }
  function parcharTodo() {
    for (const m of vivos(REGISTRO_ULTRA_B.veg)) if (parcharUltra(m, parcheVegetal)) parchados.add(m);
    for (const m of vivos(REGISTRO_ULTRA_B.suelo)) if (parcharUltra(m, parcheTerreno)) parchados.add(m);
    version = REGISTRO_ULTRA_B.version;
  }
  function prender(pasto) {
    activo = true;
    pisado = crearPisado();
    parcharTodo();
    if (pasto?.ponerUltra) { pasto.ponerUltra(true, { parchar: parcharUltra, parchePasto, parcheAnillo }); pastoUltra = pasto; }
    motas = crearMotas();
  }
  function apagar() {
    activo = false;
    for (const m of parchados) quitarUltra(m);
    parchados.clear();
    if (pastoUltra) { pastoUltra.ponerUltra(false, { quitar: quitarUltra }); pastoUltra = null; }
    pisado?.dispose(); pisado = null;
    if (motas) { motas.malla.parent?.remove(motas.malla); motas.dispose(); motas = null; }
    UB.uGotas.value = 0;
  }
  function revisar(quiere, dt, js, pasto, horas) {
    if (quiere && !activo) prender(pasto);
    else if (!quiere && activo) apagar();
    if (!activo) return;
    if (pasto && pasto !== pastoUltra && pasto.ponerUltra) { pasto.ponerUltra(true, { parchar: parcharUltra, parchePasto, parcheAnillo }); pastoUltra = pasto; }
    if (version !== REGISTRO_ULTRA_B.version) parcharTodo();
    pisado?.actualizar(dt, js);
    // las motas cuelgan de la malla del pasto (se esconden con ella)
    if (motas && pasto?.malla && motas.malla.parent !== pasto.malla) pasto.malla.add(motas.malla);
    UB.uGotas.value = gotasAhora(horas, U.uMojado.value, U.uLluvia.value, U.uInvierno.value);
  }
  // desde main.js: Ultra según el ajuste y la calidad que CORRE (con Alta elegida y Media corriendo hasta reiniciar, no se prende)
  function revisarAjustes(ajustes, calidadActiva, dt, js, pasto, horas) { revisar(esUltra(ajustes) && calidadActiva === 'alta', dt, js, pasto, horas); }
  return { revisar, revisarAjustes, apagar, get activo() { return activo; }, get pisado() { return pisado; }, get motas() { return motas; }, get parchados() { return parchados.size; } };
}
