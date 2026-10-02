// Materiales y uniformes compartidos: viento, estaciones y suelo
// 3.2: estilo pintado (HushWood/Firewatch). El color sale de degradados amplios por vértice
// (base oscura y fría, puntas claras y cálidas) y de la luz; se sacaron las texturas de
// detalle, las cartas de hojas y el calado por píxel de la 2.7: menos muestras de textura,
// ningún `discard` en la vegetación (vuelve el descarte temprano por profundidad) y shaders
// más cortos.
import * as THREE from 'three';
import { nivelTexturas, texturaManchas } from './texturas.js';

// 3.4: la niebla de three (exponencial al cuadrado) satura: a 400-500 m las lomas del borde
// del valle y el lago quedaban del color pleno de la niebla, más claros que la cordillera de
// atrás (una sábana pálida entre el valle y los cerros). Se le pone un techo que sube con la
// densidad (neblina de la mañana, lluvia, nublado). Hasta unos 250 m no cambia nada.
// El three incluido no exporta ShaderChunk: se cambia el `#include` antes de compilar, en
// todos los materiales (el onBeforeCompile de fábrica) y en los que tienen el suyo propio
// de este archivo y de agua.js.
// 3.5.2: niebla por altura, con bancos que se corren. Hasta la 3.5.1 dependía sólo de la
// distancia: desde el mirador al alba todo lo que pasaba los ~150 m quedaba en el techo y el
// valle entero era una franja plana y pareja. Ahora el aire es más denso abajo (los bajos, el
// lago) y se afina con la altura: se usa la densidad media a lo largo del rayo de la cámara al
// punto (una exponencial con la altura, integrada en forma cerrada), y el techo también sigue a
// la altura del punto (el lago puede quedar tapado y las lomas asomar). Cuando la niebla es
// espesa (neblina de la mañana, lluvia) se junta en bancos que se corren despacio con el
// tiempo. Desde el piso del valle, mirando a la misma altura, queda casi igual que antes.
// Sólo cuentas en el lugar de siempre: sin pasadas, texturas ni programas nuevos.
// `pos` es la posición del punto en el mundo y `t` el tiempo (0 si el material no lo tiene).
export const cuentaNiebla = (pos, t) => /* glsl */`
    float techo352 = clamp(0.3 + fogDensity * 60.0, 0.0, 1.0);
    float espesa352 = smoothstep(0.0032, 0.009, fogDensity);
    float escala352 = mix(90.0, 30.0, espesa352);
    float yc352 = clamp((cameraPosition.y - 14.0) / escala352, -1.5, 6.0);
    float yp352 = clamp((${pos}.y - 14.0) / escala352, -1.5, 6.0);
    float ec352 = exp(-yc352), ep352 = exp(-yp352);
    float dy352 = yp352 - yc352;
    float alto352 = abs(dy352) > 0.01 ? (ec352 - ep352) / (abs(dy352) > 0.01 ? dy352 : 1.0) : 0.5 * (ec352 + ep352);
    float banco352 = 0.5, mueve352 = 0.0;
    if (espesa352 > 0.01) {
      vec2 q352 = ${pos}.xz * 0.0075 + vec2(${t} * 0.0045, ${t} * 0.0028);
      banco352 = sin(q352.x * 3.1 + sin(q352.y * 2.3) * 1.7) * sin(q352.y * 2.7 - sin(q352.x * 1.9) * 1.3) * 0.5 + 0.5;
      mueve352 = espesa352 * 0.6 * min(ep352, 1.0);
    }
    alto352 = clamp(alto352 * mix(1.0, 0.45 + 1.1 * banco352, mueve352), 0.15, 1.6);
    float techoAlto352 = clamp(0.3 + 0.35 * (alto352 + ep352 * mix(1.0, 0.5 + banco352, mueve352)), 0.35, 1.1);
    float fogFactor = min(1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * alto352), techo352 * techoAlto352);`;
// (la posición del punto sale de vViewPosition, que tienen Lambert, Phong, Standard, Toon y
// Matcap; en los demás, como el pasto, se toma la altura de la cámara)
const NIEBLA_CON_TECHO = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    #if defined(LAMBERT) || defined(PHONG) || defined(STANDARD) || defined(TOON) || defined(MATCAP)
      vec3 pN352 = cameraPosition + (vec4(-vViewPosition, 0.0) * viewMatrix).xyz;
    #else
      vec3 pN352 = cameraPosition;
    #endif
    ${cuentaNiebla('pN352', 'NIEBLA_T')}
  #else
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
#endif`;
// 3.5.2: los bancos se corren con uTiempo. Si el fragmento ya lo declara se usa ése; si no, se
// declara junto a la niebla (el material que no lo pasa queda con los bancos quietos).
const DECLARA_TIEMPO = /uniform\s+float\s+[\w\s,]*\buTiempo\b/;
export const conTechoNiebla = (fuente) => {
  let f = fuente, conTiempo = DECLARA_TIEMPO.test(f);
  if (!conTiempo && f.includes('#include <fog_pars_fragment>')) {
    f = f.replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\nuniform float uTiempo;');
    conTiempo = true;
  }
  return f.replace('#include <fog_fragment>', `#define NIEBLA_T ${conTiempo ? 'uTiempo' : '0.0'}\n${NIEBLA_CON_TECHO}`);
};
Object.getPrototypeOf(THREE.MeshBasicMaterial.prototype).onBeforeCompile = function (sh) {
  sh.fragmentShader = conTechoNiebla(sh.fragmentShader);
  if (!sh.uniforms.uTiempo) sh.uniforms.uTiempo = U.uTiempo;   // 3.5.2: los bancos de niebla
};

export const U = {
  uTiempo: { value: 0 },
  uTrasluz: { value: 1 },
  uNubes: { value: 0 },
  uDetalleSuelo: { value: 1 },
  uEstepa: { value: null },
  uHuellas: { value: null },
  uHuellasCentro: { value: new THREE.Vector2() },
  uHuellasLado: { value: 64 },
  uViento: { value: 0.5 },
  uOtono: { value: 0 },
  uInvierno: { value: 0 },
  uLluvia: { value: 0 },
  uMojado: { value: 0 },
  // 2.0: cuánta escarcha hay en el suelo esta mañana (ver `escarcha.js`)
  uEscarcha: { value: 0 },
  uJugador: { value: new THREE.Vector3() },
  uAlturas: { value: null },
  uMascara: { value: null },
  uSolDir: { value: new THREE.Vector3(0, 1, 0) },
  uSolColor: { value: new THREE.Color(1, 1, 1) },
  uCieloBajo: { value: new THREE.Color(0.6, 0.68, 0.78) },
  uCenit: { value: new THREE.Color() },
  uHorizonte: { value: new THREE.Color() },
  uAmbiente: { value: new THREE.Color(0.3, 0.3, 0.3) },
  uNoche: { value: 0 },
  // RC31.2: alcance del LOD lejano de árboles (calidad.lejos). Más allá, el terreno
  // boscoso se tiñe de copas para que las laderas lejanas no se lean peladas.
  uBosqueLejos: { value: 230 },
  // 3.2: la bruma de estilo. Color del aire lejos del sol (turquesa de día, dorado al
  // atardecer, azul de noche) y color del aire mirando hacia el sol (lo pone cielo.js).
  uBruma: { value: new THREE.Color(0.55, 0.68, 0.72) },
  uBrumaSol: { value: new THREE.Color(0.95, 0.82, 0.6) },
  uBrumaFuerza: { value: 1 },
  // 3.2: gradación de color dentro de los materiales propios. Vale 1 cuando se dibuja
  // directo a la pantalla (calidades sin postproceso) y 0 mientras dibuja el postproceso,
  // que tiene su propia gradación: así se ve la misma paleta en todas las calidades.
  uGradoMat: { value: 1 },
};

export const GLSL_COMUN = /* glsl */`
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 srgb(vec3 c) { return pow(c, vec3(2.2)); }
vec2 uvTerreno(vec2 xz) { return ((xz + 512.0) / 2.0 + 0.5) / 513.0; }
`;

// 2.7: manchas grandes del prado (decenas de metros): pasto seco y amarillento, bajos
// húmedos más oscuros. La usan el suelo y las hojas del pasto, así coinciden. Devuelve (seco, húmedo, tono)
// en 0..1, leídos de texturaManchas (el material tiene que pasar el uniforme uManchas).
export const GLSL_MANCHAS = /* glsl */`
uniform sampler2D uManchas;
vec3 manchasPrado(vec2 p) { return texture2D(uManchas, (p + 512.0) / 1024.0).rgb; }
`;

// 3.2: los manchones de flores del prado (blancas y violetas). Es la MISMA cuenta en el
// suelo (que los pinta de lejos) y en las flores instanciadas cerca del jugador (pasto.js):
// donde el suelo se ve lila, de cerca hay flores violetas. Necesita GLSL_COMUN.
// Devuelve (blancas, violetas) en 0..1, antes de la máscara de pasto.
export const GLSL_FLORES = /* glsl */`
vec2 camposFlores(vec2 p) {
  float a = vnoise(p * 0.071 + vec2(13.1, 7.7));
  float b = vnoise(p * 0.059 - vec2(4.3, 21.9));
  return vec2(smoothstep(0.64, 0.8, a), smoothstep(0.66, 0.82, b));
}
`;

// 3.2: estilo común: la bruma coloreada (turquesa lejos del sol, dorada hacia él) y la
// gradación de color para cuando no hay postproceso. Declara sus propios uniformes: el
// material tiene que pasar uBruma, uBrumaSol, uBrumaFuerza, uGradoMat y uSolDirEst.
export const GLSL_ESTILO = /* glsl */`
uniform vec3 uBruma; uniform vec3 uBrumaSol; uniform float uBrumaFuerza; uniform float uGradoMat; uniform vec3 uSolDirEst;
vec3 colorBruma(vec3 haciaPunto) {
  float alSol = max(dot(normalize(haciaPunto), normalize(uSolDirEst)), 0.0);
  return mix(uBruma, uBrumaSol, pow(alSol, 5.0) * 0.85);
}
// sombras hacia el turquesa, luces hacia el oro y verdes un poco más vivos
// 3.4: la misma paleta que la composición del postproceso: saturación moderada y los verdes
// muy saturados (lima) más quietos y menos amarillos
// 3.4: sin postproceso uGradoMat vale 1 + la tarde (cielo.js): la parte entera prende la
// gradación y lo que sobra dora la imagen como lo hace la composición del postproceso
// (sombras lavanda, luces doradas). Y el verde lima de las caducas al sol se corrige igual
// que allá: menos croma en los verdes muy saturados y el amarillo lima hacia el verde hondo.
vec3 gradoEstilo(vec3 c) {
  float grado = min(uGradoMat, 1.0);
  float tardeG = clamp(uGradoMat - 1.0, 0.0, 1.0);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float verde = clamp((c.g - max(c.r, c.b)) * 8.0, 0.0, 1.0);
  float croma = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  vec3 g = mix(vec3(l), c, 1.06 - verde * 0.2 - smoothstep(0.06, 0.32, croma) * verde * 0.22);
  g.r -= (g.r - g.b) * 0.18 * verde;
  float lima = verde * smoothstep(0.5, 0.8, g.r / max(g.g, 1e-4)) * smoothstep(0.55, 0.85, (g.g - g.b) / max(g.g, 1e-4));
  g = mix(g, vec3(g.r - (g.r - g.b) * 0.3, g.g * 0.95, g.b + (g.g - g.b) * 0.1), lima);
  // (los tintes de la tarde son los de la composición elevados a 2.2: allá se aplican sobre
  // la imagen ya en pantalla, acá sobre la luz lineal, antes de la curva de tono)
  float altas = smoothstep(0.02, 0.5, l);
  g *= mix(mix(vec3(0.9, 1.0, 1.07), vec3(0.89, 0.79, 1.18), tardeG), mix(vec3(1.05, 1.01, 0.93), vec3(1.23, 0.98, 0.65), tardeG), altas);
  g = mix(g, g * vec3(1.23, 0.98, 0.68), tardeG * 0.32);
  // la curva de pantalla sin postproceso (ACES) quema a blanco los claros pastel (el cielo
  // durazno de la tarde): de tarde se los baja un poco antes, para que conserven el color
  g *= 1.0 - smoothstep(0.3, 1.0, l) * 0.2 * tardeG;
  return mix(c, max(g, vec3(0.0)), grado);
}
`;
const uniformesEstilo = () => ({ uBruma: U.uBruma, uBrumaSol: U.uBrumaSol, uBrumaFuerza: U.uBrumaFuerza, uGradoMat: U.uGradoMat, uSolDirEst: U.uSolDir });

// Vegetación y estructuras: viento, temblor de hojas, otoño e invierno
// aTipo: 0 madera · 1 hoja perenne · 2 hoja caduca · 3 flor · 4 roca/techo
// 3.2: `copa` y `detalle` quedan por compatibilidad (el estilo pintado no cala copas ni
// lleva texturas: todas las copas se sombrean igual).
// 3.5: `soto`: { fin, banda } (uniformes compartidos) para el sotobosque: cada mata crece desde el
// suelo en los últimos `banda` metros antes de `fin` (de la cámara a su pie). Sin `soto`, nada.
// Los uniformes del LOD quedan en m.userData.lod: la distancia de dibujo los cambia en vivo.
// 3.5: el aTipo de las frondas de helecho del sotobosque: follaje perenne (entre 0.5 y 1.5), con su
// otoño herrumbre y menos nieve encima (ver color_vertex)
export const TIPO_HELECHO = 1.25;
export function materialVegetal({ flex = 1, doble = false, lod = null, copa = false, detalle = true, soto = null } = {}) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: doble ? THREE.DoubleSide : THREE.FrontSide });
  m.userData.estilo = { copa, detalle };
  const uLod = {
    uLodModo: { value: lod?.modo || 0 },
    uLodInicio: { value: lod?.inicio || 0 },
    uLodFin: { value: lod?.fin || 0 },
    uLodLejos: { value: lod?.lejos || 100000 },
    uSotoFin: soto?.fin || { value: 0 },
    uSotoBanda: soto?.banda || { value: 1 },
  };
  m.userData.lod = uLod;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, {
      uTiempo: U.uTiempo, uViento: U.uViento, uOtono: U.uOtono, uInvierno: U.uInvierno, uFlex: { value: flex },
      uJugadorVeg: U.uJugador, uCieloBajoVeg: U.uCieloBajo, uSolDirVeg: U.uSolDir, uSolColorVeg: U.uSolColor,
      uMojadoVeg: U.uMojado,
      // 3.4: 1 en árboles y arbustos (copa): la madera es corteza con vetas; 0 en
      // estructuras (tablas y vigas siguen con la pincelada de siempre)
      uCortezaVeg: { value: copa ? 1 : 0 },
    }, uLod, uniformesEstilo());
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTiempo; uniform float uViento; uniform float uOtono; uniform float uInvierno; uniform float uFlex;
        uniform float uLodModo; uniform float uLodInicio; uniform float uLodFin; uniform float uLodLejos;
        uniform float uSotoFin; uniform float uSotoBanda;
        attribute float aTipo;
        ${GLSL_COMUN}`)
      .replace('#include <color_vertex>', `#include <color_vertex>
        {
          vec3 posI = vec3(0.0);
          #ifdef USE_INSTANCING
            posI = instanceMatrix[3].xyz;
          #endif
          float azar = fract(sin(dot(posI.xz, vec2(12.9898, 78.233))) * 43758.5453);
          if (aTipo > 1.5 && aTipo < 2.5) {
            vec3 otono = azar < 0.45 ? mix(vec3(0.42, 0.05, 0.012), vec3(0.62, 0.09, 0.015), azar * 2.2) : mix(vec3(0.70, 0.20, 0.012), vec3(0.82, 0.42, 0.03), (azar - 0.45) * 1.8);
            // 3.2: el otoño conserva el degradado del bulto (base oscura, puntas claras)
            float lumV = dot(vColor.rgb, vec3(0.2126, 0.7152, 0.0722));
            vColor.rgb = mix(vColor.rgb, otono * clamp(lumV / 0.12, 0.45, 1.3), uOtono);
          }
          // 3.5: las frondas de helecho del sotobosque (aTipo ${TIPO_HELECHO}: perennes en todo lo
          // demás) se ponen herrumbre en otoño, como los helechos del pasto (no todas igual)
          bool helecho35 = aTipo > 1.2 && aTipo < 1.3;
          if (helecho35) {
            vec3 herrumbre = mix(vec3(0.40, 0.11, 0.012), vec3(0.24, 0.06, 0.007), azar);
            float lumF = dot(vColor.rgb, vec3(0.2126, 0.7152, 0.0722));
            vColor.rgb = mix(vColor.rgb, herrumbre * clamp(lumF / 0.1, 0.5, 1.3), uOtono * mix(0.6, 0.95, fract(azar * 4.7)));
          }
          // oclusión: lo que está cerca del suelo recibe menos luz del cielo
          float ao = mix(0.62, 1.0, smoothstep(0.0, 1.6, position.y));
          vColor.rgb *= ao;
          if (aTipo < 2.5 && aTipo > 0.5 || aTipo > 3.5) {
            // 3.5: la nieve del follaje sale de la normal del RACIMO (lo de arriba de cada racimo
            // se nieva, lo de abajo y el frente quedan verdes) y es la misma en los tres dibujos:
            // las cartas cercanas llevan la normal del racimo, las manchas lejanas la altura en la
            // mancha (conCartas cambia esta línea) y los carteles la normal horneada. Antes la
            // mancha lejana llevaba la normal hacia el cielo: de lejos el árbol entero era blanco
            // y de cerca verde, y cada árbol cambiaba al cruzar el LOD. Techos y piedras, igual.
            float nyNieve = normal.y;
            float arriba = aTipo > 3.5 ? smoothstep(0.3, 0.85, nyNieve) : smoothstep(0.5, 0.95, nyNieve) * (helecho35 ? 0.45 : 1.0);
            vColor.rgb = mix(vColor.rgb, vec3(0.80, 0.84, 0.90), uInvierno * arriba * 0.9);
          }
        }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          vec3 posI = vec3(0.0);
          #ifdef USE_INSTANCING
            posI = instanceMatrix[3].xyz;
          #endif
          float fase = posI.x * 0.13 + posI.z * 0.17;
          float alt = max(position.y, 0.0);
          // la misma racha que cruza el pastizal recorre las copas
          vec2 dirV = normalize(vec2(1.0, 0.35));
          float avance = dot(posI.xz, dirV);
          float rachaLarga = (sin(avance * 0.055 - uTiempo * 1.15) * 0.5 + 0.5) * (sin(avance * 0.021 - uTiempo * 0.55 + 1.7) * 0.5 + 0.5);
          float rafaga = mix(sin(uTiempo * 0.45 + fase * 0.2) * 0.5 + 0.5, smoothstep(0.08, 0.85, rachaLarga), 0.65);
          // Tronco y follaje no responden igual: el fuste cede poco y la copa absorbe la ráfaga.
          // Esto evita el efecto de árbol de goma cuando sopla fuerte.
          float esFollajeV = step(0.5, aTipo) * (1.0 - step(3.5, aTipo));
          float rigidez = mix(0.26, 1.0, esFollajeV);
          // RC15: anclaje por altura. La base del fuste casi no se mueve, mientras
          // las ramas altas reciben más recorrido y una torsión secundaria de ráfaga.
          float anclajeRaiz = smoothstep(0.10, 2.2, alt);
          float respuestaCopa = smoothstep(1.2, 8.5, alt);
          float flexion = alt * alt * 0.0022 * uFlex * uViento * (0.5 + rafaga) * rigidez * anclajeRaiz;
          float torsionAlta = respuestaCopa * rafaga * uViento * uFlex * 0.018;
          transformed.x += sin(uTiempo * 1.1 + fase) * flexion + sin(uTiempo * 1.9 + fase * 1.7) * torsionAlta * alt;
          transformed.z += cos(uTiempo * 0.8 + fase * 1.3) * flexion * 0.6 + cos(uTiempo * 1.55 + fase * 0.9) * torsionAlta * alt * 0.65;
          if (aTipo > 0.5 && aTipo < 3.5) {
            float t = uTiempo * 4.5 + position.x * 2.1 + position.z * 1.7 + fase;
            float hojaFina = 0.018 + 0.022 * rafaga;
            transformed += vec3(sin(t), sin(t * 1.3) * 0.5, cos(t * 0.9)) * hojaFina * uViento * min(alt, 4.0) * 0.25;
          }
          // (3.5: las flores (aTipo 3) se cierran antes, apenas empieza el invierno: en el pase
          // de estación quedaba alguna flor de los arbustos parada sobre la nieve)
          if ((aTipo > 1.5 && aTipo < 2.5 && uInvierno > 0.5) || (aTipo > 2.5 && aTipo < 3.5 && uInvierno > 0.2)) transformed = vec3(0.0, position.y, 0.0);
          // RC31.2: borde lejano del LOD simplificado. En vez de disolver la copa con
          // dither (ruido de píxeles sobre las laderas a 150–310 m) el árbol se achica
          // hacia su base en los últimos metros: el límite del bosque queda limpio.
          if (uLodModo > 1.5) {
            // La visibilidad depende de la cámara (menú, cámara libre, fotos), no del cuerpo del jugador.
            float dRaizLejos = length((modelMatrix * vec4(posI, 1.0)).xz - cameraPosition.xz);
            float quedaLejos = 1.0 - smoothstep(max(uLodFin + 1.0, uLodLejos - 30.0), uLodLejos, dRaizLejos);
            transformed *= quedaLejos;
          }
          // 3.5: el sotobosque entra y sale creciendo desde el suelo (por mata, en los últimos
          // metros de su alcance), no de golpe con el chunk
          if (uSotoFin > 0.5) {
            float dSoto = length((modelMatrix * vec4(posI, 1.0)).xz - cameraPosition.xz);
            transformed *= 1.0 - smoothstep(uSotoFin - uSotoBanda, uSotoFin, dSoto);
          }
        }`);
    // Follaje a contraluz: cuando el sol está detrás de la hoja, la atraviesa.
    // 3.2: todo el sombreado propio va en luz lineal, antes del tono de pantalla, para que
    // se vea igual con y sin postproceso.
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTrasluz;
        uniform float uInvierno;
        uniform float uLluviaVeg; uniform float uMojadoVeg;
        uniform sampler2D uEstepaVeg;
        uniform vec3 uJugadorVeg;
        uniform vec3 uCieloBajoVeg; uniform vec3 uSolDirVeg; uniform vec3 uSolColorVeg;
        uniform float uCortezaVeg;
        varying vec3 vNormVistaVeg;
        varying vec3 vPosMundoVeg;
        varying vec3 vNormMundoVeg;
        varying float vSueloVeg;
        varying vec3 vPosVista;
        varying float vHojas;
        varying float vTipoVeg;
        varying vec2 vRaizVeg;
        ${GLSL_COMUN}
        ${GLSL_ESTILO}`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        {
          // (RC15/RC31.2: el crossfade dither del LOD ya no descarta píxeles acá: la
          // decisión es por árbol y se toma en el vertex shader; ver abajo)
          float esHoja = vHojas;
          vec3 haciaOjoM = cameraPosition - vPosMundoVeg;
          float dOjo = length(haciaOjoM);
          vec3 nMV = normalize(vNormMundoVeg);
          vec3 vistaM = haciaOjoM / max(dOjo, 1e-3);
          // RC28 → 3.2: el material no lleva microdetalle (veta, grano): sólo una pincelada
          // amplia de un par de metros, de una muestra de ruido, y únicamente en madera y
          // piedra a media distancia. Lo lejano queda liso, sin brillo de píxeles.
          float detalleMaterial = 1.0 - smoothstep(30.0, 70.0, dOjo);
          float esMadera = 1.0 - step(0.5, vTipoVeg);
          float esMineral = step(3.5, vTipoVeg);
          // 3.4: corteza pintada (sólo árboles y arbustos, de cerca): vetas verticales fibrosas.
          // El ruido se lee sobre el círculo alrededor del pie del árbol (sin costura) y
          // casi no cambia con la altura: franjas largas que apenas se tuercen. Dos escalas:
          // vetas anchas y fibras finas (éstas se apagan antes, para que no titilen).
          float corteza34 = esMadera * uCortezaVeg * (1.0 - smoothstep(35.0, 60.0, dOjo));
          float rug = 0.5;
          if (esHoja < 0.5 && detalleMaterial > 0.01 && corteza34 < 0.99) rug = vnoise(vPosMundoVeg.xz * 0.6 + vPosMundoVeg.y * 0.45);
          float pincelada = mix(1.0, 0.88 + 0.24 * rug, detalleMaterial * (esMadera * 0.8 + esMineral));
          if (corteza34 > 0.01) {
            vec2 alrededor = normalize(vPosMundoVeg.xz - vRaizVeg + 1e-4);
            vec2 semilla34 = vRaizVeg * 0.37;
            float vetaAncha = vnoise(alrededor * 2.4 + semilla34 + vec2(vPosMundoVeg.y * 0.05, 0.0));
            float vetaFina = vnoise(alrededor * 7.0 + semilla34.yx + vec2(0.0, vPosMundoVeg.y * 0.09));
            float vetaCorteza = mix(vetaAncha, vetaAncha * 0.55 + vetaFina * 0.45, 1.0 - smoothstep(10.0, 24.0, dOjo));
            // (y de cerca, la grieta entre fibras: una línea oscura donde la fina pasa por el medio)
            float grieta = (1.0 - smoothstep(0.0, 0.07, abs(vetaFina - 0.5))) * (1.0 - smoothstep(8.0, 18.0, dOjo));
            pincelada = mix(pincelada, mix(0.5, 1.24, smoothstep(0.26, 0.74, vetaCorteza)) * (1.0 - grieta * 0.35), corteza34);
          }
          gl_FragColor.rgb *= pincelada;
          // 3.2: la madera tira a miel (interiores cálidos, troncos tibios)
          gl_FragColor.rgb *= mix(vec3(1.0), vec3(1.08, 1.0, 0.86), esMadera);
          // 3.3: luz dorada en el bosque. La mancha de sol que llega al tronco (la luz directa
          // que dejó pasar la sombra) se entibia, y el pie de los troncos toma un rebote dorado
          // suave del piso (más en el lado que da al sol). De noche uSolColor se apaga.
          gl_FragColor.rgb += reflectedLight.directDiffuse * vec3(0.22, 0.11, -0.03) * (esMadera + esHoja * 0.35);
          // 3.4: la corteza a la sombra no es negra: rebote tibio del piso del bosque y algo del
          // cielo, en proporción a su color (sombra parda, no negra). Se apaga hacia los 115 m,
          // donde el árbol pasa a ser cartel (impostores.js no lo tiene).
          {
            float rebote34 = esMadera * uCortezaVeg * (1.0 - smoothstep(70.0, 115.0, dOjo));
            gl_FragColor.rgb += diffuseColor.rgb * (uSolColorVeg * vec3(0.44, 0.35, 0.25) + uCieloBajoVeg * 0.12) * rebote34 * pincelada * 1.1;
            gl_FragColor.rgb += reflectedLight.directDiffuse * vec3(0.16, 0.06, -0.02) * rebote34;
          }
          if (esMadera > 0.5 && dOjo < 70.0) {
            float pieTronco = (1.0 - smoothstep(0.3, 4.5, vPosMundoVeg.y - vSueloVeg)) * (1.0 - abs(nMV.y)) * (1.0 - smoothstep(30.0, 70.0, dOjo));
            float ladoSol = 0.55 + 0.45 * max(dot(normalize(vec3(uSolDirVeg.x, 0.0, uSolDirVeg.z) + 1e-4), nMV), 0.0);
            gl_FragColor.rgb += diffuseColor.rgb * uSolColorVeg * vec3(1.0, 0.72, 0.36) * pieTronco * ladoSol * 0.16 * max(uSolDirVeg.y, 0.0);
          }
          if (esHoja > 0.5) {
            float arribaHoja = max(vNormMundoVeg.y, 0.0);
            float luzLateral = max(dot(nMV, normalize(uSolDirVeg)), 0.0);
            float alturaCopa = smoothstep(0.7, 7.0, vPosMundoVeg.y - vSueloVeg);
            // El interior de la copa queda un poco más oscuro y el exterior recibe
            // un relleno frío del cielo: gana volumen sin una luz adicional.
            gl_FragColor.rgb *= mix(0.88, 1.025, alturaCopa * 0.72 + arribaHoja * 0.28);
            gl_FragColor.rgb += uCieloBajoVeg * arribaHoja * 0.018;
            // 3.2: el lado que da al sol se entibia (verde amarillo) y el de la sombra se
            // enfría (verde turquesa): el volumen de la copa es de color, no sólo de brillo
            // 3.4: de cerca el límite entre luz y sombra se quiebra en manchas de follaje
            // pintado, y cada mancha sube o baja un poco el tono. De lejos (y en los
            // carteles de impostores.js) queda el degradé liso de siempre.
            float ladoLuz34 = smoothstep(0.0, 0.8, luzLateral);
            float cercaHoja34 = 1.0 - smoothstep(22.0, 60.0, dOjo);
            if (cercaHoja34 > 0.01) {
              // perennes (coníferas): trazos largos y angostos que bajan por la falda, como
              // matas de agujas; caducas: manchas redondas de hojas
              float pinc34 = vTipoVeg < 1.5
                ? vnoise(normalize(vPosMundoVeg.xz - vRaizVeg + 1e-4) * 9.0 + vec2(vRaizVeg.x * 0.37, vPosMundoVeg.y * 0.6))
                : vnoise(vPosMundoVeg.xz * 1.9 + vPosMundoVeg.y * 1.4 + vRaizVeg);
              ladoLuz34 = mix(ladoLuz34, smoothstep(0.12, 0.62, luzLateral + (pinc34 - 0.5) * 0.8), cercaHoja34);
              gl_FragColor.rgb *= 1.0 + (smoothstep(0.25, 0.75, pinc34) - 0.5) * 0.3 * cercaHoja34;
            }
            gl_FragColor.rgb *= mix(vec3(0.86, 0.97, 1.06), vec3(1.1, 1.04, 0.84), ladoLuz34);
            // 3.2: borde pintado. El contorno que da al sol se enciende cálido y el que queda
            // a la sombra toma el turquesa del cielo: la copa se lee por su silueta.
            float borde = 1.0 - max(dot(nMV, vistaM), 0.0);
            float borde3 = borde * borde * borde;
            // (teñido por el color propio de la hoja: el borde brilla verde dorado, no blanco)
            vec3 tinteBorde = diffuseColor.rgb * 2.2 + 0.015;
            gl_FragColor.rgb += uSolColorVeg * tinteBorde * borde3 * luzLateral * (0.35 + 0.25 * alturaCopa);
            gl_FragColor.rgb += uCieloBajoVeg * tinteBorde * borde3 * (1.0 - luzLateral) * 0.25;
            if (uLluviaVeg > 0.01) gl_FragColor.rgb *= mix(1.0, 0.78, uLluviaVeg * 0.8);
          } else {
            // Desgaste: lo que mira al cielo se destiñe con el sol y la lluvia,
            // y lo que está cerca del suelo junta musgo y verdín.
            float haciaArriba = clamp(vNormMundoVeg.y, 0.0, 1.0);
            float manchas = rug;
            gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 1.18 + vec3(0.015), haciaArriba * (0.35 + 0.45 * manchas) * 0.14);
            // en invierno, la nieve se junta sobre las caras que miran al cielo
            if (uInvierno > 0.05) {
              // solo lo que está a la intemperie: bajo techo no se junta nieve
              float acumula = smoothstep(0.45, 0.95, vNormMundoVeg.y) * uInvierno;
              acumula *= 1.0 - texture2D(uEstepaVeg, vec2(vPosMundoVeg.x / 1024.0 + 0.5, vPosMundoVeg.z / 1024.0 + 0.5)).g;
              acumula *= 0.65 + 0.35 * rug;
              gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.92, 0.94, 0.97) * (0.7 + 0.5 * haciaArriba), acumula * 0.85);
            }
            // RC28: la humedad de la superficie persiste después de la lluvia.
            // La cara superior se empapa más; la madera/piedra mojada gana un brillo tenue.
            if (uMojadoVeg > 0.01) {
              float mojadoMaterial = uMojadoVeg * (0.38 + 0.62 * haciaArriba);
              gl_FragColor.rgb *= mix(1.0, esMineral > 0.5 ? 0.68 : 0.73, mojadoMaterial);
              vec3 Vw = normalize(-vPosVista);
              float espW = pow(max(dot(normalize(vNormVistaVeg), normalize(Vw + normalize(-directionalLights[0].direction))), 0.0), esMineral > 0.5 ? 44.0 : 34.0);
              gl_FragColor.rgb += directionalLights[0].color * espW * mojadoMaterial * (esMineral > 0.5 ? 0.42 : 0.34);
            }
            float bajo = smoothstep(0.9, 0.02, vPosMundoVeg.y - vSueloVeg);
            float verdin = bajo * smoothstep(0.55, 0.9, manchas) * 0.5;
            float marcaHumedad = bajo * uMojadoVeg * (0.25 + 0.45 * manchas);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.62, 0.78, 0.55), verdin * 0.5 + marcaHumedad * 0.3);
          }
          #if NUM_DIR_LIGHTS > 0
          {
            // lo que se enciende es lo que tiene el sol justo detrás
            float atras = max(0.0, dot(-vistaM, normalize(uSolDirVeg)));
            // RC31.2: cono estrecho y aporte moderado, atenuado con nieve en la copa.
            float brillo = pow(atras, 8.0) * uTrasluz * vHojas * (1.0 - uInvierno * 0.75);
            // 3.2: la luz que atraviesa la hoja toma el color de la hoja (verde dorado), no blanquea
            gl_FragColor.rgb += directionalLights[0].color * brillo * (diffuseColor.rgb * 2.4 + 0.02) * vec3(1.0, 0.92, 0.5) * 0.5;
          }
          #endif
          // Luz rasante: recorta las copas de contraluz, sin sumar luces.
          float rasanteVeg = 1.0 - smoothstep(0.07, 0.36, abs(uSolDirVeg.y));
          float bordeSolVeg = pow(max(dot(-vistaM, uSolDirVeg), 0.0), 4.0);
          // RC30 → 3.2: perspectiva aérea con color (la bruma del estilo): el bosque medio
          // se aclara hacia el turquesa del aire, o hacia el dorado si se mira al sol.
          float dAireVeg = length(vPosMundoVeg.xz - cameraPosition.xz);
          float aireVeg = smoothstep(60.0, 300.0, dAireVeg);
          float bajoVeg = 1.0 - smoothstep(40.0, 220.0, max(0.0, vPosMundoVeg.y - cameraPosition.y));
          gl_FragColor.rgb += uSolColorVeg * bordeSolVeg * rasanteVeg * esHoja * (1.0 - aireVeg * 0.65) * 0.07;
          gl_FragColor.rgb = gradoEstilo(gl_FragColor.rgb);
          // lo lejano pierde color y se azula: el bosque de atrás no es el mismo verde de adelante
          float lumVeg = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(lumVeg), aireVeg * 0.4);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, colorBruma(-vistaM), aireVeg * bajoVeg * 0.34 * uBrumaFuerza);
        }`);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vPosVista; varying float vHojas; varying vec3 vPosMundoVeg; varying vec3 vNormMundoVeg; varying float vSueloVeg; varying vec3 vNormVistaVeg; varying float vTipoVeg; varying vec2 vRaizVeg;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vPosVista = mvPosition.xyz;
        // RC31.2: árboles y sotobosque son InstancedMesh. La posición/normal de mundo
        // debe incluir instanceMatrix; sin ella todas las instancias "vivían" en el
        // origen y el crossfade LOD las descartaba al alejarse del centro del valle.
        {
          mat4 matrizMundoVeg = modelMatrix;
          #ifdef USE_INSTANCING
            matrizMundoVeg = modelMatrix * instanceMatrix;
          #endif
          vPosMundoVeg = (matrizMundoVeg * vec4(transformed, 1.0)).xyz;
          vNormMundoVeg = normalize(mat3(matrizMundoVeg) * objectNormal);
          vec4 raizVeg = matrizMundoVeg * vec4(0.0, 0.0, 0.0, 1.0);
          vSueloVeg = raizVeg.y;
          vRaizVeg = raizVeg.xz;
        }
        // RC15: crossfade dither entre la geometría cercana y la simplificada, sin
        // blending. 3.2: como el umbral es por árbol (no por píxel), la decisión se toma
        // acá, una vez por vértice: el árbol que no le toca a este LOD sale del cuadro
        // entero y el fragment shader ya no necesita descartar (vuelve el descarte
        // temprano por profundidad en todo el bosque). El resultado es el mismo.
        if (uLodModo > 0.5) {
          // Distancia por árbol (base de la instancia): la copa entera cruza el LOD a la vez.
          float distanciaLod = length(vRaizVeg - cameraPosition.xz);
          float mezclaLod = smoothstep(uLodInicio, uLodFin, distanciaLod);
          float coberturaLod = uLodModo < 1.5 ? (1.0 - mezclaLod) : mezclaLod;
          // RC31.2: umbral por árbol (hash de la base de la instancia). Cada árbol cambia
          // de LOD completo a su propia distancia dentro del anillo. Cercano y lejano
          // leen el mismo valor, así que son exactamente complementarios.
          float mascaraLod = hash12(floor(vRaizVeg * 4.0) + 17.0);
          if (uLodModo < 1.5 ? (mascaraLod > coberturaLod) : (mascaraLod < 1.0 - coberturaLod)) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        }
        vNormVistaVeg = normalize(transformedNormal);
        vHojas = (aTipo > 0.5 && aTipo < 3.5) ? 1.0 : 0.0;
        vTipoVeg = aTipo;`);
    sh.uniforms.uTrasluz = U.uTrasluz;
    sh.uniforms.uInvierno = sh.uniforms.uInvierno || U.uInvierno;
    sh.uniforms.uLluviaVeg = U.uLluvia;
    sh.uniforms.uMojadoVeg = U.uMojado;
    sh.uniforms.uEstepaVeg = U.uEstepa;
    sh.fragmentShader = conTechoNiebla(sh.fragmentShader);   // 3.4
  };
  return m;
}

// Suelo: mezcla por pendiente, humedad, sendero y estación
// Sombra de nubes: una mancha suave que corre con el viento sobre todo el valle
export const SOMBRA_NUBES = `
  float sombraNubes(vec2 p) {
    vec2 q = p * 0.0038 + vec2(uTiempo * 0.012, uTiempo * 0.007);
    float n = sin(q.x * 3.1 + sin(q.y * 2.3) * 1.7) * sin(q.y * 2.7 - sin(q.x * 1.9) * 1.3);
    n += 0.5 * sin(q.x * 6.7 - 1.3) * sin(q.y * 5.9 + 0.7);
    return 1.0 - uNubes * smoothstep(0.05, 0.75, n * 0.5 + 0.5) * 0.55;
  }
`;

// 3.2: el suelo pintado. Colores planos y saturados que se funden en manchas grandes
// (pasto vivo, pasto dorado, musgo, tierra del sendero, roca fría), los manchones de
// flores que coinciden con las flores instanciadas y la luz moteada bajo las copas.
// Se fueron el relieve por píxel (seis muestras de ruido), las texturas de detalle y el
// ruido fino: el suelo se lee limpio de cerca y de lejos, y cuesta mucho menos.
export function materialTerreno() {
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff });
  m.onBeforeCompile = (sh) => {
    const conManchas = nivelTexturas() > 0;
    if (conManchas) sh.uniforms.uManchas = { value: texturaManchas() };
    Object.assign(sh.uniforms, { uEscarcha: U.uEscarcha, uMascara: U.uMascara, uEstepa: U.uEstepa, uHuellas: U.uHuellas, uHuellasCentro: U.uHuellasCentro, uHuellasLado: U.uHuellasLado, uOtono: U.uOtono, uInvierno: U.uInvierno, uLluvia: U.uLluvia, uMojado: U.uMojado, uTiempo: U.uTiempo, uNubes: U.uNubes, uSolDir: U.uSolDir, uSolColor: U.uSolColor, uCieloBajo: U.uCieloBajo, uViento: U.uViento, uDetalleSuelo: U.uDetalleSuelo, uBosqueLejos: U.uBosqueLejos }, uniformesEstilo());
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vPosMundo; varying vec3 vNormMundo;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vPosMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vNormMundo = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uMascara; uniform sampler2D uEstepa; uniform sampler2D uHuellas; uniform vec2 uHuellasCentro; uniform float uHuellasLado; uniform float uOtono; uniform float uInvierno; uniform float uLluvia; uniform float uMojado;
        uniform float uEscarcha;
        uniform vec3 uSolDir; uniform vec3 uSolColor; uniform vec3 uCieloBajo; uniform float uViento;
        uniform float uDetalleSuelo; uniform float uBosqueLejos;
        uniform float uTiempo; uniform float uNubes;
        varying vec3 vPosMundo; varying vec3 vNormMundo;
        ${GLSL_COMUN}
        ${GLSL_FLORES}
        ${GLSL_ESTILO}
        ${SOMBRA_NUBES}
        ${conManchas ? `#define CON_MANCHAS 1
        ${GLSL_MANCHAS}` : ''}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float bosqueSuelo33 = 0.0;   // 3.3: lo usa la luz dorada del bosque (abajo)
        {
          vec4 m = texture2D(uMascara, uvTerreno(vPosMundo.xz));
          float pasto = m.r, sendero = m.g, humedo = m.b, bosque = m.a;
          bosqueSuelo33 = bosque;
          vec2 p = vPosMundo.xz;
          // dos escalas de ruido, las dos grandes (≈9 m y ≈30 m): pinceladas, no grano
          float n1 = vnoise(p * 0.11), n2 = vnoise(p * 0.032);
          float pend = 1.0 - vNormMundo.y;
          vec4 est = texture2D(uEstepa, uvTerreno(vPosMundo.xz));
          float estepa = est.r, bajoTechoT = est.g;
          // 3.4: paleta sin lima: musgo verde azulado, pasto verde hondo que se aclara a un
          // verde oliva tibio, pasto seco dorado
          vec3 cMusgo = mix(srgb(vec3(0.19, 0.33, 0.20)), srgb(vec3(0.29, 0.42, 0.21)), n1);
          vec3 cHojarasca = mix(srgb(vec3(0.38, 0.30, 0.20)), srgb(vec3(0.31, 0.29, 0.19)), n1);
          vec3 cPasto = mix(srgb(vec3(0.26, 0.43, 0.19)), srgb(vec3(0.42, 0.52, 0.23)), smoothstep(0.2, 0.8, n2 * 0.6 + n1 * 0.4));
          vec3 cPastoSeco = srgb(vec3(0.70, 0.60, 0.32));
          vec3 cTierra = mix(srgb(vec3(0.66, 0.52, 0.34)), srgb(vec3(0.58, 0.45, 0.30)), n1);
          vec3 cRoca = mix(srgb(vec3(0.56, 0.59, 0.61)), srgb(vec3(0.64, 0.62, 0.56)), n2);   // 3.4: roca gris clara
          vec3 cArena = srgb(vec3(0.74, 0.68, 0.52));
          vec3 cBarro = srgb(vec3(0.30, 0.27, 0.17));
          vec3 col = mix(cHojarasca, cMusgo, clamp(0.5 + smoothstep(0.3, 0.75, n2) * 0.45 + humedo * 0.2, 0.0, 1.0));
          col = mix(col, cPasto, smoothstep(0.28, 0.7, pasto + (n1 - 0.5) * 0.2));
          #ifdef CON_MANCHAS
            // 2.7: manchones de pasto seco y bajos húmedos (la textura del valle entero)
            vec3 manchas = manchasPrado(p);
            float enPrado = smoothstep(0.3, 0.75, pasto) * (1.0 - bosque * 0.7);
            col = mix(col, cPastoSeco, manchas.x * enPrado * 0.6);   // 3.4: manchas secas más marcadas (0.5 → 0.6)
            col = mix(col, col * vec3(0.78, 0.9, 0.82), manchas.y * enPrado * (1.0 - manchas.x) * 0.5);
            col *= 1.0 + (manchas.z - 0.5) * 0.14 * enPrado;
            // 3.4: pinceladas grandes de temperatura: unas manchas del prado más tibias
            // (oliva dorado) y otras más frías (verde azulado), no un verde parejo
            float temple34 = smoothstep(0.3, 0.7, n2 * 0.65 + n1 * 0.35);
            col *= mix(vec3(0.86, 0.97, 1.06), vec3(1.1, 1.03, 0.86), temple34) * enPrado + (1.0 - enPrado);
          #else
            col = mix(col, cPastoSeco, smoothstep(0.38, 0.78, pasto) * smoothstep(0.45, 0.05, humedo) * 0.25);
          #endif
          col = mix(col, cBarro, humedo * 0.5);
          col = mix(col, cArena, smoothstep(1.5, 0.35, vPosMundo.y) * (1.0 - bosque));
          col = mix(col, cTierra, smoothstep(0.25, 0.7, sendero + (n1 - 0.5) * 0.15));
          col = mix(col, cRoca, smoothstep(0.38, 0.6, pend + (n2 - 0.5) * 0.1));
          // 3.2: manchones de flores: el prado se tiñe de blanco y de lila donde hay flores
          {
            vec2 flor = camposFlores(p) * smoothstep(0.35, 0.75, pasto) * (1.0 - smoothstep(0.2, 0.5, sendero)) * (1.0 - estepa) * (1.0 - bosque * 0.6);
            flor *= (1.0 - uInvierno) * (1.0 - uOtono * 0.7);
            col = mix(col, srgb(vec3(0.86, 0.87, 0.80)), flor.x * 0.28);
            col = mix(col, srgb(vec3(0.60, 0.50, 0.74)), flor.y * 0.32);
          }
          vec3 hojas = mix(srgb(vec3(0.60, 0.33, 0.13)), srgb(vec3(0.68, 0.49, 0.20)), n1);
          col = mix(col, hojas, uOtono * smoothstep(0.35, 0.85, bosque + n2 * 0.35) * 0.45 * (1.0 - sendero));
          col = mix(col, mix(col, srgb(vec3(0.62, 0.56, 0.30)), 0.5), uOtono * smoothstep(0.3, 0.75, pasto) * (1.0 - bosque) * 0.45);
          float nieve = uInvierno * smoothstep(0.5, 0.22, pend + (n1 - 0.5) * 0.2) * smoothstep(0.3, 1.2, vPosMundo.y) * (1.0 - bajoTechoT);
          col = mix(col, srgb(vec3(0.93, 0.95, 0.98)) * (0.94 + 0.06 * n1), nieve);
          // 2.0: la escarcha. Fina y cristalina, sólo en lo que mira al cielo; más en el
          // pasto y en el bajo húmedo, menos bajo el bosque (las copas la atajan) y nada
          // bajo techo ni donde ya hay nieve. Queda en manchones, no en una alfombra pareja.
          float escarcha = uEscarcha * smoothstep(0.34, 0.1, pend) * (0.5 + 0.35 * pasto + 0.35 * humedo)
            * (1.0 - bosque * 0.72) * (1.0 - bajoTechoT) * (1.0 - nieve) * (1.0 - sendero * 0.6)
            * smoothstep(0.28, 0.72, n1 * 0.7 + n2 * 0.5);
          col = mix(col, srgb(vec3(0.84, 0.89, 0.95)), clamp(escarcha, 0.0, 1.0) * 0.78);
          // Pisadas sobre la nieve: la textura sigue al jugador y se desvanece
          // con el tiempo/nevada. Solo afecta nieve visible y nunca el suelo seco.
          vec2 uvHuella = (vPosMundo.xz - uHuellasCentro) / uHuellasLado + 0.5;
          float dentroHuella = step(0.0, uvHuella.x) * step(uvHuella.x, 1.0) * step(0.0, uvHuella.y) * step(uvHuella.y, 1.0);
          float pisada = texture2D(uHuellas, clamp(uvHuella, 0.0, 1.0)).r * dentroHuella * nieve;
          col = mix(col, col * vec3(0.58, 0.64, 0.70), pisada * 0.72);
          col *= 1.0 - uLluvia * 0.25 * (1.0 - nieve);
          col = mix(col, col * vec3(0.5, 0.62, 0.66), smoothstep(0.0, -2.5, vPosMundo.y));
          // el suelo se oscurece bajo el bosque y al pie de los troncos
          // 3.4: bajo las copas el piso es más oscuro y más frío (verde azulado), no negro
          vec3 sombraSuelo = mix(vec3(1.0), vec3(0.74, 0.8, 0.84), bosque * (0.6 + 0.4 * n2));
          // la estepa: pastizal seco, tierra ocre y matas ralas
          vec3 cEstepa = srgb(vec3(0.70, 0.62, 0.38));
          vec3 cEstepaSeca = srgb(vec3(0.78, 0.68, 0.44));
          // 3.5.2: el borde de la estepa sigue la altura (se termina entre los 26 y los 58 m): en
          // una ladera era una franja amarilla pareja y horizontal. Ahora el borde se quiebra en
          // lenguas con las dos pinceladas del suelo y pasa por un coirón verdoso antes del ocre.
          // En las laderas la estepa ocre se queda en las que miran al norte (al sol, más secas);
          // las otras son de matorral verdoso: el borde lo dibuja el relieve, no la altura.
          float ladera352 = smoothstep(0.03, 0.18, pend) * (1.0 - 0.6 * clamp(-vNormMundo.z * 2.5, 0.0, 1.0));
          float estepa352 = smoothstep(0.12, 0.88, estepa * (1.0 - ladera352 * 0.55) + (n2 - 0.5) * 0.5 + (n1 - 0.5) * 0.22) * smoothstep(0.0, 0.15, estepa);
          vec3 cEstepa352 = mix(srgb(vec3(0.43, 0.47, 0.27)), mix(cEstepa, cEstepaSeca, n1 * 0.5 + 0.5), smoothstep(0.35, 0.85, estepa352));
          col = mix(col, cEstepa352, estepa352 * 0.82 * (1.0 - nieve));
          col *= sombraSuelo;
          // RC31.2: manto de bosque lejano. Donde los árboles del LOD lejano se achican
          // y desaparecen (calidad.lejos), el suelo boscoso toma el tono de las copas con
          // manchas de rodal, otoño e invierno. Sin geometría extra: sólo color.
          {
            float dMantoLejos = length(cameraPosition.xz - vPosMundo.xz);
            // 3.5: el borde del manto era un anillo alrededor de la cámara (45 m de ancho): en
            // una ladera se leía como un arco o unas manchas redondas más claras. Ahora es más
            // ancho y se quiebra con las mismas copas (de pincel, sin una línea que lo marque).
            float copas = vnoise(p * 0.21);
            float manto = smoothstep(uBosqueLejos - 110.0, uBosqueLejos + 20.0, dMantoLejos + (copas - 0.5) * 70.0)
              * smoothstep(0.28, 0.72, bosque) * (1.0 - estepa) * smoothstep(0.55, 0.25, pend);
            if (manto > 0.001) {
              vec3 cCopa = mix(srgb(vec3(0.13, 0.25, 0.12)), srgb(vec3(0.24, 0.38, 0.14)), copas);
              vec3 cCopaOtono = mix(srgb(vec3(0.52, 0.15, 0.04)), srgb(vec3(0.66, 0.40, 0.07)), copas);
              cCopa = mix(cCopa, mix(cCopa, cCopaOtono, 0.5), uOtono);
              cCopa = mix(cCopa, mix(cCopa, srgb(vec3(0.84, 0.87, 0.91)), 0.55 + 0.25 * copas), uInvierno);
              col = mix(col, cCopa, manto * 0.88);   // la sombra de nubes se aplica justo después
            }
          }
          col *= sombraNubes(vPosMundo.xz);   // las nubes corren sobre el valle
          // Luz moteada: bajo el bosque, el sol se cuela entre las hojas y dibuja manchas
          // que se mueven con el viento. 3.2: manchas grandes y de borde suave (pintadas),
          // de una sola muestra de ruido.
          float cercaMoteado = uDetalleSuelo * (1.0 - smoothstep(40.0, 85.0, length(cameraPosition - vPosMundo)));
          if (cercaMoteado > 0.01) {
            float solAlto = max(uSolDir.y, 0.0);
            vec2 desliz = vec2(uTiempo * 0.16, uTiempo * 0.11) * (0.4 + uViento);
            // las manchas se corren con el ángulo del sol, como la sombra real
            vec2 pm = vPosMundo.xz + uSolDir.xz * 6.0 + desliz;
            float moteado = smoothstep(0.45, 0.8, vnoise(pm * 0.55));
            float bajoCopa = smoothstep(0.5, 0.9, bosque) * solAlto * (1.0 - uNubes * 0.5);
            // 3.3: las manchas de sol son doradas y la penumbra verde azulada (el clima del
            // bosque de HushWood); misma cuenta, sólo cambia el color del moteado
            col *= mix(vec3(1.0), mix(vec3(0.70, 0.76, 0.82), vec3(1.42, 1.24, 0.86), moteado), bajoCopa * 0.8 * cercaMoteado);
          }
          // RC28: humedad persistente. El suelo no se seca en el mismo frame en que
          // para de llover; los bajos y senderos conservan agua y aparecen charcos
          // irregulares sin añadir geometría ni texturas nuevas.
          if (uMojado > 0.01 && uDetalleSuelo > 0.01) {
            float bajo = smoothstep(0.55, 0.0, pend) * (0.45 + 0.55 * smoothstep(0.35, 0.75, humedo + n2 * 0.3));
            float mojado = uMojado * (0.30 + 0.70 * bajo);
            col = mix(col, col * 0.62, mojado * 0.78);
            vec3 V = normalize(cameraPosition - vPosMundo);
            vec3 Rs = reflect(-uSolDir, normalize(vNormMundo));
            float esp = pow(max(dot(Rs, V), 0.0), 26.0);
            float fres = pow(1.0 - max(dot(normalize(vNormMundo), V), 0.0), 3.0);
            col += uSolColor * esp * mojado * 0.52;
            col += uCieloBajo * mojado * (0.035 + fres * 0.055);
            float plano = smoothstep(0.16, 0.025, pend);
            float cuenca = smoothstep(0.64, 0.84, n2 * 0.7 + n1 * 0.3);
            float sueloCompacto = clamp(sendero * 0.75 + humedo * 0.55 + (1.0 - pasto) * 0.18, 0.0, 1.0);
            float charco = uMojado * plano * cuenca * smoothstep(0.18, 0.72, sueloCompacto);
            col = mix(col, col * 0.55 + uCieloBajo * (0.12 + fres * 0.14), charco * 0.42);
          }
          diffuseColor.rgb = col;
        }`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        {
          // RC30 → 3.2: el terreno medio pierde contraste hacia la bruma del estilo, que
          // tiene color (turquesa lejos del sol, dorada hacia él). Va después de la luz:
          // el aire no se oscurece con las sombras. Sin pases extra.
          float dAireSuelo = length(cameraPosition.xz - vPosMundo.xz);
          // 3.4: algo menos (0.32 → 0.2): ahora la niebla de lejos tiene techo y la loma del
          // borde tiene que quedar un poco más oscura que el primer cordón de la cordillera
          float aireSuelo = smoothstep(70.0, 380.0, dAireSuelo) * (0.2 + uNubes * 0.08 + uLluvia * 0.1) * uBrumaFuerza;
          // 3.5.2: como la niebla, la bruma pesa menos en lo alto (las lomas del borde al mediodía)
          aireSuelo *= 0.6 + 0.4 * exp(-max(vPosMundo.y - 14.0, 0.0) / 90.0);
          // 3.5: a contraluz con el sol bajo las lomas son siluetas, no una pared clara: la bruma
          // dorada del lado del sol pesa menos (antes el piedemonte quedaba pálido al ocaso)
          {
            vec3 haciaP = normalize(vPosMundo - cameraPosition);
            float contraluz35 = pow(max(dot(haciaP, normalize(uSolDirEst)), 0.0), 3.0) * (1.0 - smoothstep(0.06, 0.4, uSolDirEst.y)) * step(0.0, uSolDirEst.y);
            aireSuelo *= 1.0 - contraluz35 * 0.45 * (1.0 - uNubes * 0.6);
          }
          // 3.3: donde el sol atraviesa el dosel (la luz directa que dejó pasar la sombra)
          // el piso del bosque se enciende dorado. Sin texturas ni luces nuevas.
          {
            float bosqueOro = smoothstep(0.45, 0.85, bosqueSuelo33);
            gl_FragColor.rgb += reflectedLight.directDiffuse * vec3(0.38, 0.21, -0.02) * bosqueOro * (1.0 - smoothstep(60.0, 140.0, dAireSuelo));
          }
          gl_FragColor.rgb = gradoEstilo(gl_FragColor.rgb);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, colorBruma(vPosMundo - cameraPosition), clamp(aireSuelo, 0.0, 0.4));
        }`);
    sh.fragmentShader = conTechoNiebla(sh.fragmentShader);   // 3.4
  };
  return m;
}
