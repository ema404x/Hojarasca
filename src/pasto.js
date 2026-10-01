// Pasto instanciado en GPU: cada hoja conserva su lugar en el mundo mientras el jugador camina
// 3.2: estilo pintado. El pasto es más vivo (pie turquesa oscuro, punta verde clara y
// dorada) y más liviano (dos tramos por hoja en vez de tres). Se suman, con la misma idea
// (anillo que rodea a la cámara, todo en el vertex shader, una sola malla por clase):
//   · manchones de flores blancas y violetas en el prado, que coinciden con el tinte del
//     suelo (GLSL_FLORES): de lejos el prado se ve salpicado, de cerca hay flores;
//   · matas de helecho en el piso del bosque.
// Son hijas de la malla del pasto: se agregan y se ocultan con ella (dos dibujos más).
// 3.4 (sotobosque), al estilo HushWood:
//   · el pasto va en matas de tres hojas anchas que salen de un mismo pie, con la raíz oscura
//     (se lee alfombra de pasto pintado, no púas sueltas) y más tupido cerca de la cámara:
//     cada mata tiene su propio anillo (unas lo repiten cada 0,9R, otras cada 1,4R, otras cada
//     2R), así la densidad baja con la distancia sin sumar dibujos ni vértices;
//   · las flores son matas grandes pintadas en el atlas de cartas (vegetacion.js): lupinos
//     violetas y rosados en los manchones lilas, margaritas blancas en los blancos y amancay
//     amarillo anaranjado en los bordes del bosque; cada mata, dos cartas que miran a la cámara;
//   · los helechos son frondas texturadas (la fronda plumosa del atlas), no triángulos.
import * as THREE from 'three';
import { U, GLSL_COMUN, GLSL_MANCHAS, GLSL_FLORES, GLSL_ESTILO } from './materiales.js';
import { nivelTexturas, texturaManchas } from './texturas.js';
import { rng } from './ruido.js';
import { texturaCartas, CELDAS_CARTA, FILAS_CARTA } from './vegetacion.js';
import { PLANTAS_MAX } from './config.js';

// el anillo: cada instancia tiene un lugar fijo en el mundo que se repite cada 2R metros
const GLSL_ANILLO = /* glsl */`
  uniform float uR; uniform vec3 uCam; uniform vec3 uMira;
  vec2 lugarAnillo(vec2 offset) { return uCam.xz + mod(offset - uCam.xz + uR, 2.0 * uR) - uR; }
  // 3.4 (sotobosque): el mismo anillo con su propio radio (r ≤ uR)
  vec2 lugarAnilloR(vec2 offset, float r) { return uCam.xz + mod(offset - uCam.xz + r, 2.0 * r) - r; }
  // lo que queda bien atrás de la cámara no se dibuja
  float enPantallaAnillo(vec2 b) {
    vec2 haciaHoja = b - uCam.xz;
    float dPlano = max(length(haciaHoja), 0.001);
    float deFrente = dot(haciaHoja / dPlano, normalize(uMira.xz + vec2(1e-5)));
    return min(step(-0.45, deFrente) + step(dPlano, 2.5), 1.0);
  }
  // la misma racha que cruza el pastizal (y las copas)
  float rachaViento(vec2 b, float uTiempo) {
    vec2 dirV = normalize(vec2(1.0, 0.35));
    float avance = dot(b, dirV);
    float racha = sin(avance * 0.055 - uTiempo * 1.15) * 0.5 + 0.5;
    racha *= sin(avance * 0.021 - uTiempo * 0.55 + 1.7) * 0.5 + 0.5;
    return smoothstep(0.08, 0.85, racha);
  }
`;

const FRAG_SIMPLE = /* glsl */`
  #include <common>
  #include <fog_pars_fragment>
  uniform vec3 uSolDir; uniform vec3 uSolColor; uniform vec3 uAmbiente;
  ${GLSL_ESTILO}
  varying vec3 vColor; varying float vT; varying vec3 vNormal2;
  void main() {
    float difusa = max(dot(vNormal2, uSolDir), 0.0) * 0.75 + 0.25;
    vec3 luz = uAmbiente + uSolColor * difusa * (0.55 + 0.45 * vT);
    gl_FragColor = vec4(gradoEstilo(vColor * luz), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;

// 3.4 (sotobosque): flores y helechos con carta del atlas, recortadas. En las celdas de flores
// G marca tallo y hoja y B el centro de la flor: el color sale de los tres tonos de la mata
// (vColor pétalo, vVerde, vCentro). El helecho usa sólo la luz pintada (R).
const FRAG_CARTA = /* glsl */`
  #include <common>
  #include <fog_pars_fragment>
  uniform vec3 uSolDir; uniform vec3 uSolColor; uniform vec3 uAmbiente;
  uniform sampler2D uCartas;
  ${GLSL_ESTILO}
  varying vec3 vColor; varying float vT; varying vec3 vNormal2; varying vec2 vUvCarta; varying vec3 vVerde; varying vec3 vCentro;
  void main() {
    vec4 carta = texture2D(uCartas, vUvCarta);
    if (carta.a < 0.5) discard;
    vec3 base = mix(mix(vColor, vCentro, carta.b), vVerde, carta.g);
    float difusa = max(dot(vNormal2, uSolDir), 0.0) * 0.75 + 0.25;
    vec3 luz = uAmbiente + uSolColor * difusa * (0.55 + 0.45 * vT);
    gl_FragColor = vec4(gradoEstilo(base * mix(0.56, 1.12, carta.r) * luz), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;
// lugar de una celda del atlas (u0, v0 de su esquina; las celdas miden 0,25 × 1/FILAS)
const celdaUV = (celda) => [(celda % 4) * 0.25, Math.floor(celda / 4) / FILAS_CARTA];

function uniformesAnillo(R, fino) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uR: { value: R }, uCam: { value: new THREE.Vector3() }, uMira: { value: new THREE.Vector3(0, 0, -1) } }]);
  Object.assign(uniforms, {
    uTiempo: U.uTiempo, uViento: U.uViento, uOtono: U.uOtono, uInvierno: U.uInvierno, uJugador: U.uJugador, uEscarcha: U.uEscarcha,
    uAlturas: U.uAlturas, uMascara: U.uMascara, uEstepa: U.uEstepa, uSolDir: U.uSolDir, uSolColor: U.uSolColor, uAmbiente: U.uAmbiente,
    uBruma: U.uBruma, uBrumaSol: U.uBrumaSol, uBrumaFuerza: U.uBrumaFuerza, uGradoMat: U.uGradoMat, uSolDirEst: U.uSolDir,
  });
  if (fino) uniforms.uManchas = { value: texturaManchas() };
  return uniforms;
}

export function crearPasto(calidad) {
  const R = calidad.radioPasto;
  const n = calidad.pasto;
  // 2.7: con detalle material, hojas más finas (y más anchas sólo a lo lejos, donde
  // una hoja fina titilaría), color por hoja y las manchas del prado
  const fino = nivelTexturas() > 0;

  // hoja: 2 tramos + punta (3.2: antes 3; con el doblez del viento no se nota)
  // 3.4 (sotobosque): tres hojas por mata (aHoja: cuál), que salen del mismo pie
  const HOJAS_MATA = 3;
  const base = new THREE.BufferGeometry();
  const pos = [], ind = [], cualHoja = [];
  const tramos = 2;
  for (let h = 0; h < HOJAS_MATA; h++) {
    const i0 = pos.length / 3;
    for (let i = 0; i <= tramos; i++) {
      const t = i / tramos;
      pos.push(-0.5, t, 0, 0.5, t, 0);
      cualHoja.push(h, h);
    }
    pos.push(0, 1.12, 0); cualHoja.push(h);
    for (let i = 0; i < tramos; i++) {
      const a = i0 + i * 2;
      ind.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const top = i0 + tramos * 2;
    ind.push(top, top + 1, top + 2);
  }

  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aHoja', new THREE.Float32BufferAttribute(cualHoja, 1));
  geo.setIndex(ind);
  // 3.4 (sotobosque): un tercio de las hojas de antes en matas de a tres (las mismas hojas,
  // un 8 % más de vértices) y cada mata con su anillo: 38 % cada 0,9R, 30 % cada 1,4R y el
  // resto cada 2R. Cerca de la cámara hay casi tres veces más hojas que antes; lejos, menos
  // (pero más anchas, y el pasto rasante se tapa solo).
  // 3.5: la distancia de plantas (factor `fp`) estira el anillo de afuera: con fp > 1 el de
  // afuera llega a fp·R con más matas (las mismas por metro cuadrado: el pasto de cerca queda
  // igual y el de lejos tan tupido como el borde de antes); con fp < 1 se achican los tres
  // anillos y quedan fp² de las matas. Con fp = 1 salen exactamente las mismas matas de antes.
  // Los búferes se arman para el máximo y se rellenan al cambiar el ajuste (sin shaders nuevos).
  const nMatas = Math.round(n * 0.36);
  const capacidad = nMatas + Math.ceil(nMatas * (PLANTAS_MAX * PLANTAS_MAX - 1)) + 16;
  const offs = new Float32Array(capacidad * 2), azar = new Float32Array(capacidad), radio = new Float32Array(capacidad);
  function llenarMatas(fp) {
    const r = rng(99);
    let k = 0, afuera = 0;
    const quedan = fp < 1 ? Math.round(nMatas * fp * fp) : nMatas;
    for (let i = 0; i < nMatas; i++) {
      const kk = r(), f = kk < 0.38 ? 0.45 : kk < 0.68 ? 0.7 : 1;
      const ox = r() * 2 - 1, oz = r() * 2 - 1, az = r();
      if (f === 1) afuera++;
      if (i >= quedan) continue;
      // radio del anillo de esta mata en metros, y relativo al uR (= R·fp)
      const rm = R * f * (fp < 1 || f === 1 ? fp : 1);
      offs[k * 2] = ox * rm; offs[k * 2 + 1] = oz * rm; azar[k] = az; radio[k] = rm / (R * fp);
      k++;
    }
    if (fp > 1) {
      const r2 = rng(199);
      const extra = Math.round(afuera * (fp * fp - 1));
      for (let i = 0; i < extra && k < capacidad; i++) {
        offs[k * 2] = (r2() * 2 - 1) * R * fp; offs[k * 2 + 1] = (r2() * 2 - 1) * R * fp; azar[k] = r2(); radio[k] = 1;
        k++;
      }
    }
    return k;
  }
  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offs, 2));
  geo.setAttribute('aAzar', new THREE.InstancedBufferAttribute(azar, 1));
  geo.setAttribute('aRadio', new THREE.InstancedBufferAttribute(radio, 1));
  geo.instanceCount = llenarMatas(1);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

  const uniforms = uniformesAnillo(R, fino);
  // 3.5: el presupuesto adaptativo acorta el pasto con el fundido del borde (uCorte), no con el
  // radio del anillo: cambiar uR corre el lugar de todas las matas (el pasto entero "saltaba")
  uniforms.uCorte = { value: 1 };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    fog: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      ${GLSL_COMUN}
      ${GLSL_ANILLO}
      ${fino ? `#define PASTO_FINO 1
      ${GLSL_MANCHAS}` : ''}
      uniform float uTiempo; uniform float uViento;
      uniform float uOtono; uniform float uInvierno; uniform vec3 uJugador; uniform float uEscarcha;
      uniform sampler2D uAlturas; uniform sampler2D uMascara; uniform sampler2D uEstepa;
      uniform float uCorte;
      attribute vec2 aOffset; attribute float aAzar; attribute float aHoja; attribute float aRadio;
      varying vec3 vColor; varying float vT; varying vec3 vNormal2; varying float vLuzExtra; varying float vEstepa;
      void main() {
        float rMata = uR * aRadio;
        vec2 b = lugarAnilloR(aOffset, rMata);
        vec2 uv = uvTerreno(b);
        float h = texture2D(uAlturas, uv).r;
        vec4 m = texture2D(uMascara, uv);
        // (3.5: el canal azul marca los pisos de las construcciones: ahí no sale pasto)
        vec4 estT = texture2D(uEstepa, uv);
        float estepa = estT.r;
        float rnd = hash12(floor(b * 7.0) + aAzar * 13.0);
        // En el bosque domina el pasto fino; en la estepa quedan matas ralas tipo coirón
        // aun cuando la máscara de pasto verde es baja.
        float baseVerde = m.r * (1.0 - estepa * 0.78);
        float baseCoiron = estepa * (0.16 + 0.12 * hash12(floor(b * 0.45)));
        float dens = max(baseVerde, baseCoiron) * (1.0 - smoothstep(0.1, 0.7, uInvierno) * mix(0.93, 0.35, estepa));
        float d = length(b - uCam.xz);
        // (3.4: cada mata se desvanece en el borde de su propio anillo: ahí es donde salta)
        // (3.5: uCorte, el presupuesto adaptativo: acerca el fundido, no mueve el anillo)
        float desvanecer = 1.0 - smoothstep(rMata * 0.6 * uCorte, rMata * uCorte, d);
        float vivo = step(rnd, dens) * desvanecer * step(0.05, h) * enPantallaAnillo(b) * (1.0 - step(0.4, estT.b));
        // 3.4 (sotobosque): cada hoja de la mata con su azar, su giro y su pie (corrido unos
        // centímetros del centro, hacia donde se abre)
        float rh = hash12(vec2(rnd * 91.7 + aHoja * 13.1, aAzar * 37.3 + aHoja));
        float altoBase = (0.2 + 0.4 * aAzar + 0.24 * m.r) * (0.72 + 0.5 * rh);
        float altoCoiron = (0.34 + 0.42 * aAzar) * (0.8 + 0.35 * rh);
        float alto = mix(altoBase, altoCoiron, estepa) * vivo * (1.0 - smoothstep(0.2, 0.8, m.g) * 0.7);
        float ancho = (0.07 + 0.05 * fract(rnd * 7.31)) * (1.0 + (1.0 - desvanecer) * 1.5);
        #ifdef PASTO_FINO
          // (3.4: más anchas que la hoja fina de antes: la mata se lee llena)
          ancho = (0.046 + 0.036 * rh) * mix(1.0, 1.8, smoothstep(3.0, 18.0, d)) * (1.0 + (1.0 - desvanecer) * 1.5);
        #endif
        float ang = rnd * 6.2831 + aHoja * 2.094 + (rh - 0.5) * 0.9;
        vec3 derecha = vec3(cos(ang), 0.0, sin(ang));
        vec3 frente = vec3(-sin(ang), 0.0, cos(ang));
        float t = position.y;
        vec3 p = vec3(b.x, h, b.y) + frente * (0.025 + 0.05 * rh) * vivo + derecha * position.x * ancho * (1.0 - t * 0.85);
        p.y += t * alto;
        // (se abre hacia afuera de la mata, cada hoja distinto)
        p += frente * t * t * alto * (0.22 + 0.42 * fract(rh * 3.7));
        vec2 dirV = normalize(vec2(1.0, 0.35));
        float fase = uTiempo * (1.6 + uViento) + b.x * 0.12 + b.y * 0.09;
        float onda = sin(fase) * 0.6 + sin(fase * 2.3 + b.x * 0.3) * 0.25 + 0.4;
        // Las ráfagas: ondas largas que cruzan el pastizal en la dirección del
        // viento, una lenta y ancha y otra más corta encima. Es lo que se ve
        // en un pastizal de verdad cuando viene una racha.
        float racha = rachaViento(b, uTiempo);
        float fuerzaV = uViento * (0.45 + racha * 1.25) * (1.0 + estepa * 0.32);
        p.xz += dirV * t * t * alto * onda * fuerzaV * 0.55;
        // al doblarse, la brizna también baja un poco
        p.y -= t * t * alto * racha * uViento * 0.12;
        vec2 aleja = b - uJugador.xz;
        float pd = length(aleja);
        float empuje = smoothstep(1.3, 0.0, pd) * t * t;
        p.xz += normalize(aleja + 0.0001) * empuje * 0.55 * alto;
        p.y -= empuje * 0.35 * alto;
        vec4 mvPosition = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>

        // 3.2: pie turquesa oscuro, punta verde clara que tira al oro
        vec3 raiz = mix(srgb(vec3(0.08, 0.19, 0.11)), srgb(vec3(0.33, 0.29, 0.13)), estepa);
        // 3.4: verde vivo pero no lima (menos rojo, un poco más de azul)
        vec3 punta = mix(srgb(vec3(0.29, 0.49, 0.20)), srgb(vec3(0.42, 0.55, 0.23)), fract(rnd * 5.1));
        vec3 seco = mix(srgb(vec3(0.74, 0.60, 0.26)), srgb(vec3(0.66, 0.44, 0.16)), fract(rnd * 2.9));
        punta = mix(punta, mix(srgb(vec3(0.74, 0.64, 0.32)), srgb(vec3(0.56, 0.46, 0.20)), fract(rnd * 4.4)), estepa * 0.9);
        punta = mix(punta, seco, max(uOtono * 0.75, uInvierno * 0.9));
        raiz = mix(raiz, srgb(vec3(0.35, 0.3, 0.2)), uInvierno * 0.6);
        // cada mata sale distinta: unas más amarillas, otras más hondas,
        // y las puntas se secan un poco, como el pasto de verdad
        float tono = fract(rnd * 17.3);
        // (3.4 sotobosque: 0.35 → 0.25, el prado menos amarillo)
        punta = mix(punta, mix(srgb(vec3(0.54, 0.56, 0.26)), srgb(vec3(0.28, 0.46, 0.21)), fract(rnd * 7.7)), 0.25);
        // la punta dorada (la luz del estilo la agarra ahí)
        // (3.4: menos oro en la punta: 0.2 + 0.3 → 0.12 + 0.22; el dorado lo pone la luz)
        punta = mix(punta, srgb(vec3(0.74, 0.66, 0.30)), smoothstep(0.6, 1.0, t) * (0.12 + tono * 0.22));
        float brillo = 0.84 + 0.26 * vnoise(b * 0.15) + (tono - 0.5) * 0.18;
        #ifdef PASTO_FINO
        {
          // cada hoja con su verde (unas azuladas, otras amarillentas), la punta seca en
          // proporción distinta y las manchas del prado: donde el suelo es pasto seco,
          // las hojas también
          vec3 manchas = manchasPrado(b);
          float h1 = fract(rnd * 23.7), h2 = fract(rnd * 31.3);
          punta *= mix(vec3(0.9, 1.0, 1.08), vec3(1.1, 1.04, 0.84), h1);
          punta = mix(punta, seco, manchas.x * (0.3 + 0.3 * h2) * (1.0 - estepa));
          punta = mix(punta, punta * vec3(0.8, 0.9, 0.84), manchas.y * 0.5);
          punta = mix(punta, seco * 1.08, smoothstep(0.6, 1.0, t) * (0.08 + 0.4 * h2 * h2));
          raiz *= 0.85 + 0.3 * h1;
          brillo *= 1.0 + (manchas.z - 0.5) * 0.16;
        }
        #endif
        // 3.4 (sotobosque): la raíz de la mata más honda (la alfombra tiene fondo) y cada hoja
        // de la mata con su tono
        raiz *= 0.78;
        punta *= 0.92 + 0.16 * rh;
        vColor = mix(raiz, punta, smoothstep(0.0, 0.9, t)) * brillo;
        // 3.4: bajo las copas el pasto está a la sombra: más oscuro y verde azulado (como el
        // piso del bosque), no el verde del prado al sol
        vColor *= mix(vec3(1.0), vec3(0.7, 0.79, 0.84), smoothstep(0.4, 0.9, m.a));
        // 2.0: la escarcha agarra la punta de cada hoja, no la base; y no todas las
        // matas por igual, que si no parece pintura
        float helada = uEscarcha * smoothstep(0.35, 1.0, t) * (0.55 + 0.45 * fract(rnd * 11.7));
        vColor = mix(vColor, srgb(vec3(0.86, 0.9, 0.95)), helada * 0.85);
        vT = t;
        vNormal2 = normalize(vec3(0.0, 1.0, 0.0) + frente * 0.4);
        vEstepa = estepa;
      }`,
    fragmentShader: FRAG_SIMPLE,
  });

  const malla = new THREE.Mesh(geo, mat);
  malla.frustumCulled = false;
  malla.renderOrder = 1;

  // ---------------------------------------------------------------- 3.2: flores
  // 3.4 (sotobosque): una mata = dos cartas del atlas que miran a la cámara (la segunda más
  // chica, corrida a un costado y espejada): lupinos (violetas, rosados, lilas, alguno casi
  // blanco) donde el campo del suelo es lila, margaritas donde es blanco, y amancay amarillo
  // anaranjado en manchones del borde del bosque. Antes eran cinco corolas chicas (puntitos).
  const Rf = R * 0.72;
  const nFlores = Math.max(0, Math.round(n * 0.05));
  const uFila = (1 / FILAS_CARTA).toFixed(5);
  const [luU, luV] = celdaUV(CELDAS_CARTA.lupino), [maU, maV] = celdaUV(CELDAS_CARTA.margarita), [amU, amV] = celdaUV(CELDAS_CARTA.amancay);
  const flores = nFlores ? crearAnillo({
    R: Rf, cantidad: nFlores, semilla: 131, fino, cartas: true,
    geometria: () => {
      const esq = [], ind2 = [];
      for (let k = 0; k < 2; k++) {
        const i0 = esq.length / 3;
        esq.push(-1, 0, k, 1, 0, k, 1, 1, k, -1, 1, k);
        ind2.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
      }
      const g = new THREE.InstancedBufferGeometry();
      // (la posición no se usa: la carta se arma en el shader con aEsquina)
      g.setAttribute('position', new THREE.Float32BufferAttribute(esq, 3));
      g.setAttribute('aEsquina', new THREE.Float32BufferAttribute(esq, 3));
      g.setIndex(ind2);
      return g;
    },
    vertice: /* glsl */`
      attribute vec3 aEsquina;
      ${GLSL_FLORES}
      void main() {
        vec2 b = lugarAnillo(aOffset);
        vec2 uv = uvTerreno(b);
        float h = texture2D(uAlturas, uv).r;
        vec4 m = texture2D(uMascara, uv);
        vec4 est = texture2D(uEstepa, uv);
        vec2 campo = camposFlores(b);
        float prado = smoothstep(0.35, 0.75, m.r) * (1.0 - smoothstep(0.2, 0.5, m.g)) * (1.0 - est.r) * (1.0 - m.a * 0.6) * (1.0 - est.g);
        float temporada = (1.0 - smoothstep(0.1, 0.6, uInvierno)) * (1.0 - smoothstep(0.2, 0.9, uOtono) * 0.8);
        // el amancay: en el borde del bosque (ni adentro ni en el prado abierto), en manchones
        float borde = smoothstep(0.12, 0.3, m.a) * (1.0 - smoothstep(0.55, 0.8, m.a)) * (1.0 - smoothstep(0.2, 0.5, m.g)) * (1.0 - est.r) * (1.0 - est.g);
        float amancay = borde * smoothstep(0.62, 0.8, vnoise(b * 0.045 + vec2(31.0, 5.0))) * smoothstep(0.35, 0.65, vnoise(b * 0.21 + vec2(7.0, 2.0))) * 0.5;
        float densPrado = max(campo.x, campo.y) * prado;
        float dens = max(densPrado, amancay) * temporada;
        // 0 lupino · 1 margarita · 2 amancay
        float especie = amancay > densPrado ? 2.0 : (campo.y >= campo.x ? 0.0 : 1.0);
        float rnd = hash12(floor(b * 3.0) + aAzar * 17.0);
        float d = length(b - uCam.xz);
        float desvanecer = 1.0 - smoothstep(uR * 0.7, uR, d);
        float vivo = step(rnd, dens * 1.1) * step(0.05, h) * enPantallaAnillo(b) * step(0.02, desvanecer) * (1.0 - step(0.4, est.b));
        float tam = fract(aAzar * 7.3);
        float alto = especie < 0.5 ? 0.85 + 0.4 * tam : (especie < 1.5 ? 0.6 + 0.2 * tam : 0.72 + 0.3 * tam);
        // (3.5: crece desde cero en el borde del anillo; antes entraba de golpe al 30%)
        alto *= desvanecer * vivo;
        float segunda = aEsquina.z;
        float esc = alto * (segunda > 0.5 ? 0.78 : 1.0);
        vec2 haciaCam = normalize(uCam.xz - b + vec2(1e-4, 0.0));
        vec3 der = vec3(haciaCam.y, 0.0, -haciaCam.x);
        vec3 q = der * aEsquina.x * esc * 0.5 + vec3(0.0, aEsquina.y * esc, 0.0);
        float lado2 = fract(aAzar * 5.1) > 0.5 ? 1.0 : -1.0;
        q += segunda * (der * lado2 * alto * 0.34 - vec3(haciaCam.x, 0.0, haciaCam.y) * 0.12 * alto);
        float racha = rachaViento(b, uTiempo);
        vec2 dirV = normalize(vec2(1.0, 0.35));
        q.xz += dirV * aEsquina.y * aEsquina.y * esc * uViento * (0.1 + 0.28 * racha) * (0.8 + 0.4 * sin(uTiempo * 3.1 + b.x));
        vec2 aleja = b - uJugador.xz;
        q.xz += normalize(aleja + 0.0001) * smoothstep(1.2, 0.0, length(aleja)) * aEsquina.y * esc * 0.5;
        vec3 p = vec3(b.x, h - 0.03, b.y) + q;
        vec4 mvPosition = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
        vec2 c0 = especie < 0.5 ? vec2(${luU}, ${luV}) : (especie < 1.5 ? vec2(${maU}, ${maV}) : vec2(${amU}, ${amV}));
        float sx = segunda > 0.5 ? -aEsquina.x : aEsquina.x;
        vUvCarta = c0 + vec2((0.03 + (sx * 0.5 + 0.5) * 0.94) * 0.25, (0.03 + (1.0 - aEsquina.y) * 0.94) * ${uFila});
        float tono = fract(aAzar * 13.1);
        vec3 petalo, centro, verde = srgb(vec3(0.24, 0.42, 0.17));
        if (especie < 0.5) {
          // lupinos: casi todos violetas o rosados, algunos lilas y alguno casi blanco
          petalo = tono < 0.45 ? vec3(0.44, 0.31, 0.80) : (tono < 0.75 ? vec3(0.88, 0.47, 0.68) : (tono < 0.93 ? vec3(0.72, 0.60, 0.92) : vec3(0.95, 0.88, 0.94)));
          centro = mix(petalo, vec3(0.97, 0.95, 0.97), 0.7);
        } else if (especie < 1.5) {
          petalo = vec3(0.97, 0.96, 0.92); centro = vec3(0.98, 0.76, 0.16);
        } else {
          petalo = mix(vec3(0.95, 0.48, 0.08), vec3(0.98, 0.64, 0.14), tono); centro = vec3(1.0, 0.82, 0.26);
          verde = srgb(vec3(0.24, 0.45, 0.16));
        }
        vColor = srgb(petalo);
        vCentro = srgb(centro);
        vVerde = verde * (0.9 + 0.2 * tono);
        vT = aEsquina.y;
        vNormal2 = normalize(vec3(haciaCam.x, 1.4, haciaCam.y));
      }`,
  }) : null;

  // ---------------------------------------------------------------- 3.2: helechos
  // Una mata de frondas arqueadas, del verde hondo del pie al claro de la punta.
  // Van donde el piso es de bosque (y en los bajos húmedos), en grupos.
  // 3.3: frondas plumosas en vez de la estrella de hojas en punta.
  // 3.4 (sotobosque): seis frondas por mata, cada una una tira arqueada de cuatro tramos con la
  // fronda pintada del atlas (recortada): se lee plumosa de verdad, no como triángulos.
  const Rh = R * 0.8;
  const nHelechos = Math.max(0, Math.round(n * 0.019));
  const [frU, frV] = celdaUV(CELDAS_CARTA.fronda);
  const helechos = nHelechos ? crearAnillo({
    R: Rh, cantidad: nHelechos, semilla: 177, fino, cartas: true,
    geometria: () => {
      const p = [], tt = [], uvs = [], ind2 = [];
      const rf = rng(11);
      const frondas = 6;
      for (let k = 0; k < frondas; k++) {
        const ang = (k / frondas) * Math.PI * 2 + rf() * 0.6, largo = 0.78 + rf() * 0.4, arco = 0.5 + rf() * 0.3, eleva = 0.3 + rf() * 0.35;
        const dx = Math.cos(ang), dz = Math.sin(ang), ce = Math.cos(eleva), se = Math.sin(eleva), w = (0.26 + rf() * 0.06) * largo;
        const i0 = p.length / 3;
        for (let j = 0; j <= 4; j++) {
          const t = j / 4, a = t * largo, u = arco * (t * 1.4 - t * t * 1.25) * largo;
          const al = a * ce - u * se, up = a * se + u * ce + 0.03;
          const ww = w * (j === 0 ? 0.4 : 1), caida = ww * 0.24;
          p.push(dx * al - dz * ww, up - caida, dz * al + dx * ww, dx * al + dz * ww, up - caida, dz * al - dx * ww);
          tt.push(t, t);
          const v = frV + (0.03 + (1 - t) * 0.94) / FILAS_CARTA;
          uvs.push(frU + 0.03 * 0.25, v, frU + 0.97 * 0.25, v);
        }
        for (let j = 0; j < 4; j++) {
          const a = i0 + j * 2;
          ind2.push(a, a + 1, a + 3, a, a + 3, a + 2);
        }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1));
      g.setAttribute('aUvCarta', new THREE.Float32BufferAttribute(uvs, 2));
      g.setIndex(ind2);
      return g;
    },
    vertice: /* glsl */`
      attribute float aT; attribute vec2 aUvCarta;
      void main() {
        vec2 b = lugarAnillo(aOffset);
        vec2 uv = uvTerreno(b);
        float h = texture2D(uAlturas, uv).r;
        vec4 m = texture2D(uMascara, uv);
        vec4 est = texture2D(uEstepa, uv);
        // piso de bosque (o bajo húmedo), fuera del sendero y de la estepa, en grupos
        float suelo = max(smoothstep(0.35, 0.7, m.a), smoothstep(0.4, 0.8, m.b) * 0.7);
        float grupos = smoothstep(0.36, 0.62, vnoise(b * 0.16 + 3.7));
        float dens = suelo * grupos * (1.0 - smoothstep(0.15, 0.45, m.g)) * (1.0 - est.r) * (1.0 - est.g) * (1.0 - smoothstep(0.3, 0.9, uInvierno));
        float rnd = hash12(floor(b * 2.0) + aAzar * 23.0);
        float d = length(b - uCam.xz);
        float desvanecer = 1.0 - smoothstep(uR * 0.65, uR, d);
        float vivo = step(rnd, dens * 0.85) * step(0.05, h) * enPantallaAnillo(b) * step(0.02, desvanecer) * (1.0 - step(0.4, est.b));
        float ang = aAzar * 6.2831;
        mat2 giro = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
        // (3.5: crece desde cero en el borde del anillo; antes entraba de golpe al 20%)
        float esc = (1.0 + 0.9 * fract(aAzar * 5.7)) * desvanecer * vivo;
        vec3 q = position * esc;
        q.xz = giro * q.xz;
        float racha = rachaViento(b, uTiempo);
        vec2 dirV = normalize(vec2(1.0, 0.35));
        q.xz += dirV * aT * aT * esc * uViento * (0.12 + racha * 0.25) * (0.8 + 0.4 * sin(uTiempo * 2.3 + b.y));
        vec2 aleja = b - uJugador.xz;
        q += vec3(normalize(aleja + 0.0001).x, -0.4, normalize(aleja + 0.0001).y) * smoothstep(1.4, 0.0, length(aleja)) * aT * 0.4 * esc;
        vec3 p = vec3(b.x, h, b.y) + q;
        vec4 mvPosition = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
        vec3 pie = srgb(vec3(0.07, 0.17, 0.10));
        // 3.4: verde de helecho más hondo (sin lima) y a la sombra bajo las copas
        vec3 punta = mix(srgb(vec3(0.24, 0.46, 0.19)), srgb(vec3(0.34, 0.54, 0.21)), fract(aAzar * 9.1));
        punta = mix(punta, mix(srgb(vec3(0.70, 0.46, 0.14)), srgb(vec3(0.58, 0.30, 0.10)), fract(aAzar * 3.3)), uOtono * 0.85);
        vColor = mix(pie, punta, smoothstep(0.0, 0.8, aT) * 0.85 + 0.15);
        vColor *= mix(vec3(1.0), vec3(0.78, 0.86, 0.9), smoothstep(0.4, 0.9, m.a));
        // (la fronda usa sólo la luz pintada: verde y centro, el mismo color)
        vVerde = vColor; vCentro = vColor;
        vUvCarta = aUvCarta;
        vT = aT;
        vNormal2 = normalize(vec3(0.0, 1.0, 0.0) + vec3(q.x, 0.0, q.z) * 0.8);
      }`,
  }) : null;
  if (flores) malla.add(flores.malla);
  if (helechos) malla.add(helechos.malla);
  const anillos = [flores, helechos].filter(Boolean);

  // 3.5: la distancia de plantas en vivo: se rellenan los búferes (los mismos programas)
  let factorPlantas = 1;
  function ajustar(fp) {
    const f = Math.min(PLANTAS_MAX, Math.max(0.3, Number(fp) || 1));
    if (f === factorPlantas) return false;
    factorPlantas = f;
    geo.instanceCount = llenarMatas(f);
    for (const nombre of ['aOffset', 'aAzar', 'aRadio']) geo.attributes[nombre].needsUpdate = true;
    uniforms.uR.value = R * f;
    for (const a of anillos) a.ajustar(f);
    return true;
  }
  return {
    malla,
    ajustar,
    get factorPlantas() { return factorPlantas; },
    get radio() { return R * factorPlantas; },
    get matas() { return geo.instanceCount; },
    actualizar(cam, mira, factorDetalle = 1) {
      uniforms.uCam.value.copy(cam);
      if (mira) uniforms.uMira.value.copy(mira);
      // RC22: bajo presión sostenida sólo se acorta el anillo lejano de pasto.
      // La densidad/calidad cercana permanece intacta.
      // 3.5: con el fundido del borde (uCorte), de a poco: el radio del anillo no se toca
      const corte = Math.max(0.78, Math.min(1, factorDetalle || 1));
      const u = uniforms.uCorte;
      u.value += Math.max(-0.004, Math.min(0.004, corte - u.value));
      // 3.2: flores y helechos siguen al pasto (su anillo propio no se acorta: es chico)
      for (const a of anillos) { a.uniforms.uCam.value.copy(cam); if (mira) a.uniforms.uMira.value.copy(mira); }
    },
  };
}

// 3.2: una malla instanciada que rodea a la cámara (flores, helechos). `vertice` es el
// main() del vertex shader: tiene lugarAnillo, enPantallaAnillo, rachaViento, las
// texturas del valle y los atributos aOffset/aAzar.
// 3.4 (sotobosque): `cartas`: la malla lee el atlas de cartas (vUvCarta, vVerde, vCentro)
// 3.5: `ajustar(f)` estira el anillo a f·R con f² de las matas (la misma densidad); con f = 1,
// las mismas de antes. Los búferes ya vienen del tamaño del máximo.
function crearAnillo({ R, cantidad, semilla, geometria, vertice, fino, cartas = false }) {
  const geo = geometria();
  const capacidad = Math.ceil(cantidad * PLANTAS_MAX * PLANTAS_MAX) + 4;
  const offs = new Float32Array(capacidad * 2), azar = new Float32Array(capacidad);
  function llenar(f) {
    const r = rng(semilla), r2 = rng(semilla + 1000);
    const n = Math.min(capacidad, Math.round(cantidad * f * f));
    for (let i = 0; i < n; i++) {
      const q = i < cantidad ? r : r2;
      offs[i * 2] = (q() * 2 - 1) * R * f;
      offs[i * 2 + 1] = (q() * 2 - 1) * R * f;
      azar[i] = q();
    }
    return n;
  }
  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offs, 2));
  geo.setAttribute('aAzar', new THREE.InstancedBufferAttribute(azar, 1));
  geo.instanceCount = llenar(1);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const uniforms = uniformesAnillo(R, fino);
  if (cartas) uniforms.uCartas = { value: texturaCartas() };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    fog: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      ${GLSL_COMUN}
      ${GLSL_ANILLO}
      uniform float uTiempo; uniform float uViento; uniform float uOtono; uniform float uInvierno; uniform vec3 uJugador;
      uniform sampler2D uAlturas; uniform sampler2D uMascara; uniform sampler2D uEstepa;
      attribute vec2 aOffset; attribute float aAzar;
      varying vec3 vColor; varying float vT; varying vec3 vNormal2;
      ${cartas ? 'varying vec2 vUvCarta; varying vec3 vVerde; varying vec3 vCentro;' : ''}
      ${vertice}`,
    fragmentShader: cartas ? FRAG_CARTA : FRAG_SIMPLE,
  });
  const malla = new THREE.Mesh(geo, mat);
  malla.frustumCulled = false;
  malla.renderOrder = 1;
  function ajustar(f) {
    geo.instanceCount = llenar(f);
    geo.attributes.aOffset.needsUpdate = true;
    geo.attributes.aAzar.needsUpdate = true;
    uniforms.uR.value = R * f;
  }
  return { malla, uniforms, ajustar };
}
