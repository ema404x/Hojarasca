// Lago y arroyo: color por profundidad, reflejo del cielo, brillo del sol y corriente
import * as THREE from 'three';
import { U, GLSL_COMUN, cuentaNiebla } from './materiales.js';
import { LAGO } from './config.js';
import { construirCintaArroyo } from './cinta-arroyo.js';

// (lo fija main.js antes de crear el lago, según la calidad)
let aguaNueva = false;
export const ajustarAguaNueva = (v) => { aguaNueva = !!v; };
function materialAgua(nuevo = false) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
  Object.assign(uniforms, {
    uTiempo: U.uTiempo, uAlturas: U.uAlturas, uSolDir: U.uSolDir, uSolColor: U.uSolColor,
    uCenit: U.uCenit, uHorizonte: U.uHorizonte, uAmbiente: U.uAmbiente, uLluvia: U.uLluvia, uViento: U.uViento, uInvierno: U.uInvierno, uJugador: U.uJugador,
  });
  return new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec2 aFlujo;
      attribute vec2 aCauce;
      varying vec3 vPos; varying vec2 vFlujo; varying vec2 vCauce;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vPos = w.xyz; vFlujo = aFlujo; vCauce = aCauce;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_COMUN}
      uniform float uTiempo; uniform sampler2D uAlturas; uniform vec3 uSolDir; uniform vec3 uSolColor;
      uniform vec3 uCenit; uniform vec3 uHorizonte; uniform vec3 uAmbiente; uniform float uLluvia; uniform float uViento; uniform float uInvierno; uniform vec3 uJugador;
      varying vec3 vPos; varying vec2 vFlujo; varying vec2 vCauce;
      float ondas(vec2 p, float detalle) {
        vec2 f = vFlujo * uTiempo;
        float a = vnoise(p * 0.35 - f * 0.35 + uTiempo * 0.05);
        // 3.5: las octavas finas entran de a poco (antes con un corte: a ~80 m y a ~130 m se veía
        // una línea recta en el agua, más clara de un lado, sobre todo con el sol bajo)
        float b = detalle > 0.01 ? mix(a, vnoise(p * 1.1 + vec2(uTiempo * 0.23, -uTiempo * 0.17) - f), smoothstep(0.01, 0.2, detalle)) : a;
        float c = detalle > 0.25 ? mix(b, vnoise(p * 3.2 - vec2(uTiempo * 0.4, uTiempo * 0.31) - f * 2.0), smoothstep(0.25, 0.85, detalle)) : b;
        float gotas = 0.0;
        if (uLluvia > 0.01 && detalle > 0.3) {
          vec2 celda = floor(p * 1.5); vec2 lf = fract(p * 1.5) - 0.5;
          float fase = fract(uTiempo * 0.8 + hash12(celda));
          float anillo = abs(length(lf) - fase * 0.5);
          gotas = smoothstep(0.05, 0.0, anillo) * (1.0 - fase) * uLluvia * smoothstep(0.3, 0.75, detalle);   // 3.5: sin corte
        }
        // las ondas que salen de vos cuando estás metido en el agua
        float estela = 0.0;
        if (detalle > 0.3) {
          float dj = length(p - uJugador.xz);
          float anillos = sin(dj * 7.0 - uTiempo * 5.5) * 0.5 + 0.5;
          estela = anillos * smoothstep(3.4, 0.25, dj) * smoothstep(0.0, 0.4, dj);
        }
        return a * 0.5 + b * 0.35 + c * 0.15 * (0.5 + uViento) + gotas * 0.35 + estela * 0.5;
      }
      void main() {
        float fondo = texture2D(uAlturas, uvTerreno(vPos.xz)).r;
        float prof = vPos.y - fondo;
        if (prof < 0.0) discard;
        vec3 V = normalize(cameraPosition - vPos);
        // el detalle de las ondas baja con la distancia: el agua lejana cuesta mucho menos
        float dist = length(cameraPosition - vPos);
        float detalle = 1.0 - smoothstep(35.0, 130.0, dist);
        float e = 0.08;
        float n0 = ondas(vPos.xz, detalle), nx = ondas(vPos.xz + vec2(e, 0.0), detalle), nz = ondas(vPos.xz + vec2(0.0, e), detalle);
        // 3.4: el agua lejana es más lisa (un lago pintado, no ruido de ondas a 300 m)
        float fuerza = (1.2 + uViento * 1.5 + length(vFlujo) * 1.5) * (0.55 + 0.45 * detalle);
        vec3 N = normalize(vec3((n0 - nx) / e * fuerza * 0.08, 1.0, (n0 - nz) / e * fuerza * 0.08));
        // 3.5.2: el arroyo en la cuesta (ver abajo). Coordenadas a lo largo y a lo ancho de la
        // corriente: vetas que bajan con el agua y olas paradas sobre las piedras del fondo; las
        // dos quiebran el reflejo en franjas.
        float corre352 = smoothstep(1.0, 2.8, length(vFlujo));
        float vetas352 = 0.5, rapido352 = 0.0;
        if (corre352 > 0.01) {
          vec2 dirF352 = vFlujo / max(length(vFlujo), 1e-3);
          // (a lo largo: metros río abajo; a lo ancho: metros desde el centro del cauce)
          vec2 fl352 = vCauce;
          float tf352 = uTiempo * (0.9 + length(vFlujo) * 1.3);
          vetas352 = vnoise(vec2(fl352.x * 0.4 - tf352 * 0.8, fl352.y * 1.7)) * 0.6 + vnoise(vec2(fl352.x * 1.2 - tf352 * 1.5, fl352.y * 4.2 + 3.0)) * 0.4;
          float ola352 = vnoise(fl352 * vec2(0.55, 0.8) + 9.0);
          rapido352 = smoothstep(0.55, 0.85, ola352 * 0.55 + vetas352 * 0.45) * corre352;
          N = normalize(N + vec3(-dirF352.y, 0.0, dirF352.x) * (vetas352 - 0.5) * 0.9 * corre352 + vec3(dirF352.x, 0.0, dirF352.y) * (ola352 - 0.5) * 0.6 * corre352);
        }
        float fres = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N);
        vec3 cielo = mix(uHorizonte, uCenit, smoothstep(0.0, 0.6, R.y));
        // 3.4: el reflejo pintado. Lo que se refleja rasante no es el cielo: abajo la costa con
        // su bosque (verde azulado oscuro), arriba los cordones de la cordillera (azules, con el
        // aire de la lejanía) y recién después el cielo. La silueta de los cerros cambia con el
        // rumbo (ruido sobre el círculo, sin costura).
        vec2 rumboR = normalize(R.xz + vec2(1e-4, 0.0));
        float alturaCerros = 0.09 + 0.15 * vnoise(rumboR * 4.0 + 3.0);
        vec3 aireLejos = mix(uHorizonte, uCenit, 0.45);
        vec3 luzLejos = uAmbiente * 3.0 + uSolColor * 0.6;
        vec3 cerros = mix(srgb(vec3(0.22, 0.30, 0.34)) * luzLejos, aireLejos, 0.58);
        vec3 costa = mix(srgb(vec3(0.08, 0.15, 0.12)) * luzLejos, aireLejos, 0.22);
        cielo = mix(cerros, cielo, smoothstep(alturaCerros - 0.03, alturaCerros + 0.05, R.y));
        cielo = mix(costa, cielo, smoothstep(0.012, 0.075, R.y));
        // 3.5: el camino de luz. Con el sol bajo el lago refleja el resplandor ancho del cielo
        // alrededor del sol (dorado al ocaso, plateado con la luna), no sólo el disco: una
        // franja tibia que viene hacia vos y se rompe en las ondas.
        float haloR = max(dot(R, uSolDir), 0.0);
        float solBajo = 0.3 + 0.7 * (1.0 - smoothstep(0.08, 0.5, uSolDir.y));
        cielo += uSolColor * (pow(haloR, 7.0) * 0.32 + pow(haloR, 36.0) * 0.55) * solBajo * (1.0 - uLluvia * 0.7);
        // 3.4: verde azulado hondo; la orilla, turquesa claro sobre la arena
        vec3 aguaSomera = srgb(vec3(0.30, 0.42, 0.36));
        vec3 aguaProfunda = srgb(vec3(0.02, 0.085, 0.09));
        vec3 absorcion = exp(-vec3(0.36, 0.16, 0.08) * max(prof, 0.0));
        vec3 agua = mix(aguaProfunda, aguaSomera, absorcion);
        // En la orilla aparece una turbidez terrosa muy suave: sedimento en suspensión,
        // no una franja pintada. Desaparece enseguida al ganar profundidad.
        float sedimento = (1.0 - smoothstep(0.10, 1.05, prof)) * (0.55 + 0.45 * vnoise(vPos.xz * 0.17));
        agua = mix(agua, srgb(vec3(0.30, 0.31, 0.23)), sedimento * 0.22);
        // cáusticas: la luz que atraviesa las ondas y dibuja la red sobre el fondo
        if (detalle > 0.2 && prof < 3.2) {
          vec2 q = vPos.xz * 1.35 - vFlujo * uTiempo * 0.5;
          float c1 = vnoise(q + vec2(uTiempo * 0.21, -uTiempo * 0.13));
          float c2 = vnoise(q * 1.7 - vec2(uTiempo * 0.17, uTiempo * 0.23));
          float red = pow(max(0.0, 1.0 - abs(c1 - c2) * 3.4), 3.0);
          // 3.4: más suaves (0.5 → 0.28): una red tenue, no garabatos blancos
          agua += uSolColor * red * max(uSolDir.y, 0.0) * smoothstep(3.2, 0.2, prof) * 0.28 * detalle * smoothstep(0.2, 0.6, detalle);   // 3.5: entra de a poco (antes saltaba en detalle 0.35)
        }
        vec3 luzAgua = uAmbiente * 2.2 + uSolColor * max(uSolDir.y, 0.0) * 0.9;
        vec3 col = mix(agua * luzAgua, cielo, clamp(fres * 0.85 + 0.12, 0.0, 1.0) * (1.0 - corre352 * 0.5));
        // 3.4: el lago patagónico es verde azulado aun cuando refleja el cielo
        col *= vec3(0.9, 1.0, 0.95);
        // 4.0 (prototipo de agua y cielo, sólo media y alta): reflejo de la orilla por color. Cerca de la costa lo que se ve
        // en el agua es la costa misma, boca abajo: una franja verde oscura (el bosque) estirada en el rumbo de la vista y rota por las
        // ondas. Y el espejo toma un poco más del cielo del momento (dorado al ocaso, rosado al alba).
        ${nuevo ? `
        vec2 vistaXZ = normalize(vPos.xz - cameraPosition.xz + vec2(1e-4, 0.0));
        float aLo = dot(vPos.xz, vistaXZ), aAn = dot(vPos.xz, vec2(-vistaXZ.y, vistaXZ.x));
        float tira = vnoise(vec2(aAn * 0.9, aLo * 0.06 + uTiempo * 0.05)) * 0.6 + vnoise(vec2(aAn * 2.7 + 5.0, aLo * 0.15 - uTiempo * 0.04)) * 0.4;
        float cercaOrilla = smoothstep(3.4, 0.2, prof) * (1.0 - corre352);
        float rasante4 = pow(1.0 - clamp(V.y, 0.0, 1.0), 1.5);
        vec3 verdeOrilla = mix(srgb(vec3(0.07, 0.17, 0.13)) * luzLejos * 1.7, cielo, 0.18);
        float refOrilla = cercaOrilla * (0.28 + 0.6 * rasante4) * (0.4 + 0.8 * smoothstep(0.22, 0.8, tira)) * (1.0 - uInvierno * 0.4);
        col = mix(col, verdeOrilla, clamp(refOrilla, 0.0, 0.66));
        col = mix(col, cielo * 0.97, 0.13 * (1.0 - corre352 * 0.6) * (1.0 - cercaOrilla) * (1.0 - uLluvia * 0.4));
        ` : ''}
        // 3.5.2: el arroyo que baja por la cuesta se leía como una losa inclinada (el mismo espejo
        // liso que el agua quieta). Donde corre rápido el agua está batida: refleja menos, se
        // aclara a un turquesa lechoso y se abre en vetas blancas que bajan con la corriente y en
        // espuma sobre las olas paradas. La cinta del agua y el terreno no cambian.
        if (corre352 > 0.01) {
          vec3 batida352 = (uAmbiente * 2.3 + uSolColor * max(uSolDir.y, 0.0) * 0.85) * srgb(vec3(0.62, 0.78, 0.76));
          col = mix(col, batida352, corre352 * 0.2);
          float lineas352 = smoothstep(0.64, 0.86, vetas352);
          vec3 blanco352 = uAmbiente * 2.5 + uSolColor * max(uSolDir.y, 0.0) * 0.9 + uHorizonte * 0.1;
          // lo más empinado (una cascada) es casi todo espuma; en la cuesta suave, vetas sueltas
          float cascada352 = smoothstep(2.5, 3.05, length(vFlujo));
          col = mix(col, blanco352, clamp((rapido352 * 0.55 + lineas352 * corre352 * 0.22) * (0.55 + 0.45 * cascada352), 0.0, 0.7));
        }
        float alineadoSol = max(dot(R, uSolDir), 0.0);
        float brillo = pow(alineadoSol, 240.0) * 5.3 + pow(alineadoSol, 20.0) * 0.11;
        // Destellos pequeños repartidos por las ondas: sólo cerca/mediana distancia,
        // para que el lago gane escala sin llenar el horizonte de ruido especular.
        float chispa = pow(alineadoSol, 70.0) * smoothstep(0.42, 0.88, vnoise(vPos.xz * 5.2 + vec2(uTiempo * 0.18, -uTiempo * 0.11))) * detalle;
        col += uSolColor * (brillo + chispa * 1.4) * (1.0 - uLluvia * 0.8);
        float espuma = smoothstep(0.26, 0.0, prof) * (0.38 + 0.62 * vnoise(vPos.xz * 1.3 + vec2(uTiempo * 0.08, 0.0)));
        espuma += length(vFlujo) * smoothstep(0.55, 0.85, n0) * 0.35;
        float dj2 = length(vPos.xz - uJugador.xz);
        espuma += smoothstep(1.4, 0.25, dj2) * (0.35 + 0.35 * sin(dj2 * 9.0 - uTiempo * 6.0)) * 0.5;
        // 3.5: la orilla con su espuma: una línea que va y viene con las olitas (más marcada con
        // viento), blanca con la luz del momento. Sólo cerca: de lejos no se vería.
        float ola = sin(prof * 16.0 - uTiempo * 1.7 + vnoise(vPos.xz * 0.35) * 7.0) * 0.5 + 0.5;
        float lineaOrilla = smoothstep(0.42, 0.04, prof) * smoothstep(0.62, 0.95, ola) * (0.5 + 0.5 * vnoise(vPos.xz * 2.1 - uTiempo * 0.1));
        espuma += lineaOrilla * (0.6 + uViento * 0.6) * detalle * (1.0 - length(vFlujo) * 0.5);
        vec3 blancoEspuma = uAmbiente * 2.4 + uSolColor * max(uSolDir.y, 0.0) * 0.95 + uHorizonte * 0.12;
        col = mix(col, uHorizonte * 0.9 + uAmbiente, espuma * 0.35 * (1.0 - lineaOrilla));
        col = mix(col, blancoEspuma, clamp(lineaOrilla * detalle * 0.55, 0.0, 0.6));
        ${nuevo ? `
        // 4.0: puntillas de espuma: un encaje ancho que sube y baja por la orilla (además de la línea fina de siempre)
        float ola4 = sin(prof * 9.0 - uTiempo * 1.1 + vnoise(vPos.xz * 0.9) * 6.0) * 0.5 + 0.5;
        float puntillas = smoothstep(1.0, 0.3, prof) * smoothstep(0.66, 0.94, ola4) * (0.45 + 0.55 * vnoise(vPos.xz * 3.4 + uTiempo * 0.12)) * (0.55 + 0.45 * detalle) * (1.0 - corre352 * 0.6);
        col = mix(col, blancoEspuma, clamp(puntillas * 0.7, 0.0, 0.7));
        ` : ''}
        col = mix(col, vec3(0.75, 0.8, 0.85) * (uAmbiente * 2.5 + 0.2), uInvierno * smoothstep(0.35, 0.0, prof) * 0.5);
        float transparenciaSomera = smoothstep(0.0, 1.3, prof);
        col = mix(col, col + uHorizonte * 0.035, (1.0 - transparenciaSomera) * (1.0 - uLluvia * 0.55));
        float alfa = smoothstep(0.0, 0.3, prof) * mix(0.58, 0.95, smoothstep(0.0, 2.5, prof));
        alfa = max(alfa, fres * smoothstep(0.0, 0.08, prof));
        alfa = max(alfa, lineaOrilla * detalle * 0.75 * smoothstep(0.0, 0.035, prof));
        ${nuevo ? `alfa = max(alfa, puntillas * 0.78 * smoothstep(0.0, 0.03, prof));` : ''}   // 3.5: la espuma se ve
        alfa = max(alfa, (0.72 + 0.25 * rapido352) * corre352 * smoothstep(0.0, 0.06, prof));   // 3.5.2: el agua batida no se transparenta
        gl_FragColor = vec4(col, alfa);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        // 3.4: la niebla con techo (ver materiales.js), y sobre el agua un poco menos: el
        // lago lejano conserva su color y no queda una sábana pálida entre el valle y los cerros
        // 3.5.2: la misma niebla por altura del resto (con bancos que se corren sobre el lago)
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            ${cuentaNiebla('vPos', 'uTiempo')}
            float nieblaAgua = min(fogFactor, techo352 * techoAlto352 * 0.8);
          #else
            float nieblaAgua = smoothstep(fogNear, fogFar, vFogDepth);
          #endif
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, nieblaAgua);
        #endif
      }`,
  });
}

// La cascada. 3.8.8: «parece sacada de lego». Era un plano vertical liso con un disco y puntitos; ahora es una cortina curva que
// sale del labio en caída libre (la distancia horizontal crece con la raíz de la caída), con hilos de agua suaves, aireada y más
// blanca hacia abajo, bordes deshilachados y un velo de bruma blanda al pie; la poza tiene su espuma con ondas que se abren; y
// el escalón del terreno, que es un corte recto, queda entre rocas de varios tamaños con su musgo.
const hashC = (k) => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const GLSL_RUIDO_C = /* glsl */`
  float hC(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float vC(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hC(i), hC(i + vec2(1.0, 0.0)), f.x), mix(hC(i + vec2(0.0, 1.0)), hC(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
// las rocas del salto: icosaedros abollados, grises y pardos, con musgo arriba; todas en una malla (un solo dibujo)
function rocasDelSalto(T, s) {
  const dx = Math.sin(s.ang), dz = Math.cos(s.ang), nx = Math.cos(s.ang), nz = -Math.sin(s.ang);
  const lista = [];
  const poner = (along, lat, r, hundir = 0.25) => lista.push({ x: s.x + dx * along + nx * lat, z: s.z + dz * along + nz * lat, r, hundir });
  // las dos orillas del labio, y las paredes a los lados de la caída
  for (const lado of [-1, 1]) {
    poner(-1.2, lado * (s.ancho + 0.3), 1.0); poner(0.2, lado * (s.ancho + 1.0), 1.35); poner(-3.0, lado * (s.ancho + 0.7), 0.85);
    poner(1.4, lado * (s.ancho + 1.9), 1.2); poner(2.6, lado * (s.ancho + 0.8), 0.95); poner(0.7, lado * (s.ancho * 0.8), 0.55, 0.1);
  }
  // en el pie: rocas medio hundidas en la poza y al borde
  for (let k = 0; k < 9; k++) poner(2.6 + hashC(k + 1) * 6.0, (hashC(k + 20) - 0.5) * 2 * (s.ancho * 0.95), 0.55 + hashC(k + 40) * 0.8, -0.7);
  // en el labio, una hilera de piedras sueltas contra la corriente
  for (let k = 0; k < 5; k++) poner(-2.4 - hashC(k + 70) * 1.2, (hashC(k + 90) - 0.5) * 2 * s.ancho * 0.8, 0.28 + hashC(k + 110) * 0.3, 0.3);
  const pos = [], col = [], nor = [];
  const c = new THREE.Color(), musgo = new THREE.Color(0.2, 0.3, 0.12);
  lista.forEach((q, n) => {
    const g = new THREE.IcosahedronGeometry(1, 3).toNonIndexed();
    const p = g.attributes.position, normales = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      // forma: un elipsoide achatado, abollado en grande (poca frecuencia: sin facetas) y con grano fino
      const r = 1 + 0.2 * Math.sin(x * 2.3 + n * 1.7) * Math.cos(z * 2.1 + n * 0.6) + 0.12 * Math.sin(y * 3.7 + x * 2.9 + n) + 0.035 * (hashC(Math.round(x * 9 + n * 7) * 31 + Math.round(y * 9) * 17 + Math.round(z * 9) * 5) - 0.5);
      p.setXYZ(i, x * r * q.r * 1.1, y * r * q.r * 0.68, z * r * q.r);
      // la normal del elipsoide (suave, sin facetas)
      const nn = new THREE.Vector3(x / 1.21, y / 0.4624, z).normalize();
      normales.set([nn.x, nn.y, nn.z], i * 3);
    }
    g.setAttribute('normal', new THREE.BufferAttribute(normales, 3));
    g.rotateY(hashC(n + 3) * 6.28);
    const y0 = T.altura(q.x, q.z) - q.r * 0.68 * q.hundir;
    const gp = g.attributes.position, gn = g.attributes.normal;
    const base = 0.3 + hashC(n + 9) * 0.1;
    for (let i = 0; i < gp.count; i++) {
      pos.push(gp.getX(i) + q.x, gp.getY(i) + y0 + q.r * 0.45, gp.getZ(i) + q.z);
      nor.push(gn.getX(i), gn.getY(i), gn.getZ(i));
      const alto = gn.getY(i);
      const grano = 0.86 + 0.28 * hashC(Math.round(gp.getX(i) * 6) * 13 + Math.round(gp.getY(i) * 6) * 7 + Math.round(gp.getZ(i) * 6) * 3 + n);
      const veta = 0.9 + 0.2 * Math.sin(gp.getY(i) * 5 + gp.getX(i) * 2 + n * 3);
      c.setRGB(base * 0.95, base * 0.92, base * 0.84).multiplyScalar(grano * veta);
      // más oscura y húmeda cerca del agua, musgo donde mira para arriba
      c.multiplyScalar(1 - Math.max(0, 0.4 - gp.getY(i) / (q.r + 0.1)) * 0.5);
      if (alto > 0.4) c.lerp(musgo, Math.min(1, (alto - 0.4) * 1.6) * 0.65 * (0.6 + 0.4 * hashC(n + gp.getX(i) * 3)));
      col.push(c.r, c.g, c.b);
    }
    g.dispose();
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const malla = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  malla.frustumCulled = true;
  return malla;
}

export function crearCascada(T, escena, U) {
  const s = T.saltoAgua;
  if (!s) return { actualizar: () => null, pos: null };
  const grupo = new THREE.Group();
  const dx = Math.sin(s.ang), dz = Math.cos(s.ang), nx = Math.cos(s.ang), nz = -Math.sin(s.ang);
  const ancho = s.ancho * 1.45;
  const luzU = { uAmbiente: U.uAmbiente, uSolColor: U.uSolColor, uSolDir: U.uSolDir, uTiempo: U.uTiempo };
  // ---- la cortina: una malla curva (nu × nv) desde el labio hasta la poza
  const NU = 36, NV = 20, W0 = s.ancho * 2.0, DESV = 1.7;
  const alto = s.arriba - s.abajo, pie = s.abajo + 0.1;
  const pos = [], uv = [], ind = [];
  for (let j = 0; j <= NV; j++) {
    const f = j / NV;
    // en caída libre la distancia al labio crece con la raíz de lo caído; y la lámina se ensancha un poco al caer
    const d = 0.12 + DESV * Math.sqrt(f), y = s.arriba + 0.12 - f * (s.arriba + 0.12 - pie);
    const ancha = W0 * (1 + 0.14 * f);
    for (let i = 0; i <= NU; i++) {
      const u = i / NU, lat = (u - 0.5) * ancha;
      // hilos: la lámina se abolla un poco más hacia afuera en cada hilo, más abajo
      const hilo = 0.1 * f * Math.sin(u * 19 + hashC(i) * 2) + 0.06 * f * Math.sin(u * 41);
      pos.push(s.x + dx * (d + hilo) + nx * lat, y, s.z + dz * (d + hilo) + nz * lat);
      uv.push(u, f);
    }
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, e = c + 1; ind.push(a, c, b, b, c, e); }
  const gC = new THREE.BufferGeometry();
  gC.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  gC.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  gC.setIndex(ind);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...luzU, uAlto: { value: alto } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float uTiempo; uniform float uAlto; uniform vec3 uAmbiente; uniform vec3 uSolColor; uniform vec3 uSolDir;
      varying vec2 vUv; varying vec3 vW;
      ${GLSL_RUIDO_C}
      void main(){
        float f = vUv.y, y = f * uAlto;
        // el agua acelera al caer: los hilos corren más rápido abajo
        float fase = uTiempo * (3.2 + f * 5.5) * 1.6;
        float fino = vC(vec2(vUv.x * 80.0, y * 0.32 + fase * 0.5)) * 0.5 + vC(vec2(vUv.x * 38.0 + 5.0, y * 0.2 + fase * 0.4)) * 0.5;
        float grueso = vC(vec2(vUv.x * 14.0 + 2.0, y * 0.09 + fase * 0.3));
        float hilos = clamp(fino * 0.7 + grueso * 0.5, 0.0, 1.0);
        float espuma = smoothstep(0.42, 0.85, hilos) * (0.25 + 0.75 * smoothstep(0.0, 0.85, f));
        // arriba, agua lisa y casi clara; abajo, aireada y blanca; al pie, nube de espuma
        float pieEspuma = smoothstep(0.78, 1.0, f);
        float aire = clamp(espuma + pieEspuma * (0.55 + 0.45 * vC(vec2(vUv.x * 22.0, uTiempo * 2.4))), 0.0, 1.0);
        vec3 agua = mix(vec3(0.38, 0.62, 0.68), vec3(0.62, 0.8, 0.84), smoothstep(0.0, 0.5, f));
        vec3 luz = uAmbiente * 2.3 + uSolColor * max(uSolDir.y, 0.0) * 0.9 + 0.04;
        vec3 col = mix(agua, vec3(0.97, 0.99, 1.0), aire) * luz;
        // los bordes se deshilachan: no son una línea recta
        float orilla = min(vUv.x, 1.0 - vUv.x);
        float borde = smoothstep(0.0, 0.05 + 0.05 * vC(vec2(y * 0.9, 3.0 + vUv.x * 4.0)), orilla + (vC(vec2(y * 1.3, vUv.x * 9.0)) - 0.5) * 0.06);
        // el labio de arriba: la lámina nace gruesa y clara
        float labio = smoothstep(0.0, 0.025, f);
        float a = (0.42 + 0.3 * aire + 0.12 * hilos) * borde * (0.55 + 0.45 * labio);
        gl_FragColor = vec4(col, clamp(a, 0.0, 0.88));
      }`,
  });
  const cortina = new THREE.Mesh(gC, mat);
  cortina.renderOrder = 6;
  cortina.frustumCulled = false;
  grupo.add(cortina);
  // ---- la poza: espuma que se deshace y ondas que se abren desde donde cae
  const px = s.x + dx * (0.12 + DESV + 0.9), pz = s.z + dz * (0.12 + DESV + 0.9);
  const R = ancho * 0.62;
  const espuma = new THREE.Mesh(new THREE.CircleGeometry(R, 32), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { ...luzU, uOp: { value: 0.6 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uTiempo; uniform float uOp; uniform vec3 uAmbiente; uniform vec3 uSolColor; uniform vec3 uSolDir; varying vec2 vP;
      ${GLSL_RUIDO_C}
      void main(){
        float r = length(vP) / ${R.toFixed(3)};
        float n = vC(vP * 1.7 + vec2(uTiempo * 0.7, -uTiempo * 0.5)) * 0.6 + vC(vP * 4.1 - vec2(uTiempo * 0.9, uTiempo * 0.3)) * 0.4;
        float masa = smoothstep(1.0, 0.1, r) * (0.3 + 0.7 * smoothstep(0.3, 0.78, n));
        // anillos que se abren desde el centro
        float anillo = smoothstep(0.1, 0.0, abs(fract(r * 2.2 - uTiempo * 0.35) - 0.5) - 0.38) * smoothstep(1.0, 0.25, r) * 0.35;
        vec3 luz = uAmbiente * 2.4 + uSolColor * max(uSolDir.y, 0.0) * 0.9 + 0.05;
        gl_FragColor = vec4(vec3(0.94, 0.98, 0.99) * luz, (masa + anillo) * uOp);
      }`,
  }));
  espuma.rotation.x = -Math.PI / 2;
  espuma.position.set(px, s.abajo + 0.07, pz);
  espuma.renderOrder = 6;
  grupo.add(espuma);
  // ---- la bruma al pie: nubecitas blandas que suben y se van con el aire, y gotas finas
  const N = 70, M = 80;
  const nubes = new THREE.BufferGeometry();
  const aN = new Float32Array(N * 3), tamN = new Float32Array(N), alN = new Float32Array(N);
  nubes.setAttribute('position', new THREE.BufferAttribute(aN, 3));
  nubes.setAttribute('aTam', new THREE.BufferAttribute(tamN, 1));
  nubes.setAttribute('aAlfa', new THREE.BufferAttribute(alN, 1));
  const matNube = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { ...luzU },
    vertexShader: 'attribute float aTam; attribute float aAlfa; varying float vA; void main(){ vA = aAlfa; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(aTam * 620.0 / max(-mv.z, 1.0), 1.0, 160.0); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uAmbiente; uniform vec3 uSolColor; uniform vec3 uSolDir; varying float vA; void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, r); a *= a; vec3 luz = uAmbiente * 2.4 + uSolColor * max(uSolDir.y, 0.0) * 0.9 + 0.05; gl_FragColor = vec4(vec3(0.95, 0.98, 1.0) * luz, a * vA); }',
  });
  const nube = new THREE.Points(nubes, matNube);
  nube.frustumCulled = false; nube.renderOrder = 7;
  grupo.add(nube);
  const gotasGeo = new THREE.BufferGeometry();
  const arr = new Float32Array(M * 3);
  gotasGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const gotas = new THREE.Points(gotasGeo, new THREE.PointsMaterial({ color: 0xe6f2f4, size: 0.1, transparent: true, opacity: 0.6, depthWrite: false }));
  gotas.frustumCulled = false;
  grupo.add(gotas);
  grupo.add(rocasDelSalto(T, s));
  const vidasN = Array.from({ length: N }, (_, i) => hashC(i + 5)), vidas = Array.from({ length: M }, (_, i) => hashC(i + 55));
  escena.add(grupo);

  function actualizar(dt, cam) {
    const d = Math.hypot(cam.x - s.x, cam.z - s.z);
    grupo.visible = d < 170;
    if (!grupo.visible) return s;
    for (let i = 0; i < N; i++) {
      vidasN[i] += dt * (0.12 + hashC(i) * 0.1);
      if (vidasN[i] > 1) vidasN[i] -= 1;
      const v = vidasN[i], lat = (hashC(i + 200) - 0.5) * s.ancho * 1.7, fuera = 0.4 + v * 3.2 * (0.4 + hashC(i + 300));
      aN[i * 3] = px + nx * lat + dx * fuera;
      aN[i * 3 + 1] = s.abajo + 0.3 + v * (2.2 + hashC(i + 400) * 2.4);
      aN[i * 3 + 2] = pz + nz * lat + dz * fuera;
      tamN[i] = 1.2 + v * 2.6 + hashC(i + 500);
      alN[i] = Math.sin(v * Math.PI) * (0.1 + 0.11 * hashC(i + 600));
    }
    nubes.attributes.position.needsUpdate = true; nubes.attributes.aTam.needsUpdate = true; nubes.attributes.aAlfa.needsUpdate = true;
    for (let i = 0; i < M; i++) {
      vidas[i] += dt * (0.5 + (i % 5) * 0.12);
      if (vidas[i] > 1) vidas[i] -= 1;
      const v = vidas[i], lat = (hashC(i + 700) - 0.5) * s.ancho * 1.6, fuera = 0.3 + v * 2.4;
      arr[i * 3] = px + nx * lat + dx * fuera;
      arr[i * 3 + 1] = s.abajo + 0.1 + Math.sin(v * Math.PI) * (0.8 + hashC(i + 800) * 1.4);
      arr[i * 3 + 2] = pz + nz * lat + dz * fuera;
    }
    gotas.geometry.attributes.position.needsUpdate = true;
    espuma.material.uniforms.uOp.value = 0.62 + Math.sin(U.uTiempo.value * 2.0) * 0.08;
    return s;
  }
  return { actualizar, pos: { x: s.x, y: s.abajo, z: s.z }, salto: s };
}

export function crearAgua(T, escena) {
  const mat = materialAgua(aguaNueva);

  // Lago: plano grande; se descarta donde el fondo queda sobre el nivel
  const gLago = new THREE.PlaneGeometry(420, 420, 1, 1);
  gLago.rotateX(-Math.PI / 2);
  gLago.setAttribute('aFlujo', new THREE.Float32BufferAttribute(new Float32Array(8), 2));
  gLago.setAttribute('aCauce', new THREE.Float32BufferAttribute(new Float32Array(8), 2));   // 3.5.2
  const lago = new THREE.Mesh(gLago, mat);
  lago.position.set(LAGO.x, 0, LAGO.z);
  lago.renderOrder = 5;
  escena.add(lago);

  // Arroyo: cinta que sigue el cauce y baja con el terreno (cada tramo, su rectángulo; ver cinta-arroyo.js)
  // en el salto de agua se corta sólo el escalón: la caída la hace la cortina, y la poza de abajo tiene su agua
  const { pos, flujo, ind, cauce } = construirCintaArroyo(T.rio, T.saltoAgua ? T.saltoAgua.i : -1);
  const gRio = new THREE.BufferGeometry();
  gRio.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  gRio.setAttribute('aFlujo', new THREE.Float32BufferAttribute(flujo, 2));
  gRio.setAttribute('aCauce', new THREE.Float32BufferAttribute(cauce, 2));   // 3.5.2
  gRio.setIndex(ind);
  gRio.computeBoundingSphere();
  const arroyo = new THREE.Mesh(gRio, mat);
  arroyo.renderOrder = 5;
  escena.add(arroyo);

  return { lago, arroyo, mat };
}
