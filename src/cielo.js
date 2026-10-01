// Cielo, ciclo del día, luces, niebla y la cordillera en el horizonte
import * as THREE from 'three';
import { U, GLSL_COMUN, GLSL_ESTILO } from './materiales.js';
import { crearRuido, smoothstep, clamp } from './ruido.js';
import { factorLuzRasante } from './profundidad.js';

const C = (hex) => new THREE.Color(hex);
// 3.2: paleta pintada (HushWood): cielo de día más saturado con el horizonte turquesa
// claro, la tarde dorada con el cenit lavanda y la noche azul (legible para el Desafío)
const PALETA = {
  cenitDia: C('#3b82cc'), horizDia: C('#c6e2e4'),
  cenitTarde: C('#5b64a2'), horizTarde: C('#f3ae70'),
  cenitNoche: C('#071024'), horizNoche: C('#17264a'),
  bandaAlba: C('#f6b98c'), frioAlba: C('#8fa9d6'),
  gris: C('#8d949a'),
};

export function crearCielo(escena, calidad) {
  const uniforms = {
    uSol: { value: new THREE.Vector3() }, uLuna: { value: new THREE.Vector3() },
    uCenit: U.uCenit, uHorizonte: U.uHorizonte, uSolColor: U.uSolColor,
    uDia: { value: 1 }, uTarde: { value: 0 }, uDorada: { value: 0 }, uNublado: { value: 0 }, uTiempo: U.uTiempo,
    // 2.0: la fase de la luna (0 nueva, 0.5 llena) y lo que hace con las estrellas
    uFaseLuna: { value: 0.5 }, uIluminada: { value: 1 }, uEstrellas: { value: 1 }, uVia: { value: 1 },
    uFrente: { value: 0 },   // 2.1: el frente que se ve venir (ver `pronostico.js`)
    uBruma: U.uBruma, uBrumaSol: U.uBrumaSol, uBrumaFuerza: U.uBrumaFuerza, uGradoMat: U.uGradoMat, uSolDirEst: U.uSolDir,
  };
  const matCielo = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMUN}
      ${GLSL_ESTILO}
      uniform vec3 uSol; uniform vec3 uLuna; uniform vec3 uCenit; uniform vec3 uHorizonte; uniform vec3 uSolColor;
      uniform float uDia; uniform float uTarde; uniform float uDorada; uniform float uNublado; uniform float uTiempo;
      uniform float uFaseLuna; uniform float uIluminada; uniform float uEstrellas; uniform float uVia; uniform float uFrente;
      varying vec3 vDir;
      float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
      // 3.2: tres octavas (antes cinco): nubes de pincel, blandas, y la mitad de cuentas
      float fbm(vec2 p) { float s = 0.0, a = 0.54; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.02 + 3.1; a *= 0.5; } return s * 1.08; }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        // 3.2: degradado pintado: el horizonte se abre ancho y claro antes de subir al cenit
        vec3 col = mix(uHorizonte, uCenit, pow(smoothstep(0.0, 0.7, h), 0.9));
        col = mix(col, uHorizonte * 0.75, smoothstep(0.0, -0.25, h));
        float ds = max(dot(d, uSol), 0.0);
        float haze = smoothstep(-0.04, 0.22, h) * (1.0 - smoothstep(0.22, 0.72, h));
        vec3 aire = mix(uHorizonte * 1.04, vec3(1.0), uDia * 0.15 + uTarde * 0.08);
        col = mix(col, aire, haze * (0.16 + uNublado * 0.1));
        // 3.5: el cielo del alba y del ocaso en franjas de acuarela: sobre el horizonte
        // durazno sube una franja rosa (más ancha del lado del sol) antes del lavanda del
        // cenit. Antes era un degradado de dos colores, parejo y lavado.
        {
          float haciaSol = max(dot(normalize(d.xz + vec2(1e-4, 0.0)), normalize(uSol.xz + vec2(1e-4, 0.0))), 0.0);
          float franjaRosa = smoothstep(0.015, 0.13, h) * (1.0 - smoothstep(0.16 + 0.12 * haciaSol, 0.5, h));
          vec3 rosa = mix(vec3(0.86, 0.36, 0.40), vec3(0.98, 0.50, 0.30), haciaSol) * (0.55 + 0.45 * uDia);
          col = mix(col, rosa, franjaRosa * max(uTarde, uDorada * 0.4) * (0.22 + 0.2 * haciaSol) * (1.0 - uNublado * 0.85));
        }
        // 3.4: el resplandor es de color (naranja dorado, no blanco) y no se quema: lo ancho
        // queda por debajo del blanco y sólo el disco y su corona chica llegan a brillar
        vec3 tinteHalo = uSolColor * mix(vec3(1.0, 0.86, 0.66), vec3(1.0, 0.72, 0.42), max(uTarde, uDorada * 0.8));
        col += tinteHalo * pow(ds, 6.0) * (0.12 + uTarde * 0.4 + uDorada * 0.22) * (1.0 - uNublado * 0.6);
        // 3.2: el resplandor dorado alrededor del sol (ancho y suave)
        col += tinteHalo * pow(ds, 24.0) * (0.18 + uTarde * 0.3 + uDorada * 0.2) * (1.0 - uNublado * 0.7);
        // el disco del sol, con el borde difuso y su corona
        float disco_sol = smoothstep(0.99975, 0.99992, ds);
        col = mix(col, uSolColor * 2.4 + vec3(0.5, 0.42, 0.3), disco_sol * (1.0 - uNublado * 0.85));
        col += uSolColor * pow(ds, 900.0) * 5.0 * (1.0 - uNublado);
        col += tinteHalo * pow(ds, 60.0) * 0.4 * (1.0 - uNublado * 0.7);
        // estrellas
        float noche = 1.0 - uDia;
        if (noche > 0.02 && h > 0.0) {
          vec3 q = d * 260.0; vec3 id = floor(q); vec3 f = fract(q) - 0.5;
          float rnd = hash31(id);
          float estrella = smoothstep(0.9975, 1.0, rnd) * smoothstep(0.45, 0.05, length(f));
          float titila = 0.6 + 0.4 * sin(uTiempo * (1.0 + rnd * 4.0) + rnd * 60.0);
          vec3 q2 = d * 90.0; vec3 id2 = floor(q2); vec3 f2 = fract(q2) - 0.5;
          float r2 = hash31(id2 + 7.0);
          estrella += smoothstep(0.9993, 1.0, r2) * smoothstep(0.35, 0.0, length(f2)) * 1.6;
          float via = smoothstep(0.35, 0.0, abs(dot(d, normalize(vec3(0.3, 0.45, 0.84))))) * vnoise(d.xz * 18.0) * 0.08;
          col += (vec3(estrella * titila * uEstrellas) + vec3(0.6, 0.65, 0.8) * via * uVia) * noche * smoothstep(0.0, 0.15, h) * (1.0 - uNublado);
        }
        // luna
        float dl = dot(d, uLuna);
        float disco = smoothstep(0.99955, 0.9997, dl);
        vec3 derechaL = normalize(cross(uLuna, vec3(0.0, 1.0, 0.0)));
        vec3 arribaL = cross(derechaL, uLuna);
        vec2 mancha = vec2(dot(d, derechaL), d.y - uLuna.y) * 900.0;
        float crateres = 0.82 + 0.18 * vnoise(mancha * 0.12);
        // 2.0: la fase. Sobre el disco, x va de izquierda a derecha y la línea de sombra
        // es una elipse. En el sur, creciendo, la luz está a la izquierda: la C.
        vec2 enDisco = vec2(dot(d, derechaL), dot(d, arribaL)) / 0.0276;
        float sombraL = cos(uFaseLuna * 6.2831853) * sqrt(max(0.0, 1.0 - enDisco.y * enDisco.y));
        float ladoL = uFaseLuna < 0.5 ? -enDisco.x : enDisco.x;
        float alSol = smoothstep(sombraL - 0.07, sombraL + 0.07, ladoL);
        // la cara a oscuras no es negra del todo: la ilumina la Tierra
        vec3 caraLuna = vec3(0.92, 0.9, 0.82) * crateres * mix(0.045, 1.0, alSol);
        col = mix(col, caraLuna, disco * noche * (1.0 - uNublado * 0.8));
        col += vec3(0.35, 0.4, 0.55) * pow(max(dl, 0.0), 180.0) * 0.5 * noche * uIluminada;
        // nubes
        if (h > -0.02) {
          vec2 uv = d.xz / (h + 0.18);
          // 3.4: nubes pintadas: más grandes (frecuencia 1.4 → 1.05) y de borde definido pero
          // blando, con el contorno en copos (una muestra de ruido fino sólo para el borde).
          // Antes el borde ocupaba casi toda la nube y se leían como manchas.
          vec2 viento = vec2(uTiempo * 0.006, uTiempo * 0.002);
          float n = fbm(uv * 1.05 + viento);
          float copos = vnoise(uv * 5.5 + viento * 2.0) - 0.5;
          // 2.1: el frente que viene entra por el oeste (-x), sobre la cordillera, y
          // cuanto más bajo en el cielo más cargado: se lo ve asomar antes de que llegue
          float delFrente = uFrente * smoothstep(0.15, -0.85, d.x) * (1.0 - smoothstep(0.1, 0.55, h) * 0.6);
          float nubLocal = clamp(uNublado + delFrente, 0.0, 1.0);
          // las nubes andan en grupos, con cielo limpio entre uno y otro
          float grupo = smoothstep(0.25, 0.75, vnoise(uv * 0.32 - viento * 0.5 + 4.0));
          float umbral = 0.63 + (1.0 - grupo) * 0.14 * (1.0 - nubLocal) - nubLocal * 0.42;
          // 3.5: el contorno en copos un poco más marcado (0.09 → 0.13): nubes de pincel con
          // borde de algodón, no manchas corridas
          float cobertura = smoothstep(umbral, umbral + 0.045 + nubLocal * 0.2, n + copos * 0.13);
          // 3.4: la luz de la nube. Se compara la densidad un paso hacia la luz (hacia el sol y
          // hacia arriba, que en este plano es hacia el centro): el lado que da a la luz es
          // claro y tibio, la panza que mira al horizonte queda lavanda. Misma cantidad de
          // muestras que antes (el paso hacia el sol ya estaba).
          vec2 solUV = uSol.xz / (max(uSol.y, 0.02) + 0.18);   // dónde cae el sol en este plano
          vec2 haciaLuz = normalize(solUV - uv + vec2(1e-4, 0.0)) * 0.24;
          float nLuz = fbm((uv + haciaLuz) * 1.05 + viento);
          float luzN = smoothstep(-0.1, 0.12, n - nLuz + copos * 0.05);
          vec3 luzNube = mix(uHorizonte * 1.12, vec3(1.0, 0.98, 0.94), uDia * 0.62) * (0.55 + 0.45 * uDia);
          luzNube = mix(luzNube, uSolColor * 0.85 + uHorizonte * 0.45, uTarde * 0.55);
          vec3 sombraNube = mix(uHorizonte, uCenit, 0.45) * vec3(0.74, 0.72, 0.84) * (0.6 + 0.4 * uDia);
          // 3.5: la luz de la nube en dos tonos de pincel (sombra y luz con un paso blando)
          // en vez de un degradado continuo: se lee pintada, como en HushWood
          float luzP = smoothstep(0.28, 0.5, luzN) * 0.62 + smoothstep(0.62, 0.8, luzN) * 0.38;
          vec3 nube = mix(sombraNube, luzNube, 0.2 + 0.8 * mix(luzN, luzP, 0.6));
          // al ocaso la panza de la nube toma el rosa anaranjado del sol que la ilumina de abajo
          nube = mix(nube, uSolColor * vec3(1.6, 0.9, 0.75) + sombraNube * 0.4, uTarde * (1.0 - luzN) * 0.35 * (1.0 - uNublado * 0.6) * smoothstep(-0.05, 0.03, uSol.y));
          nube = mix(nube, sombraNube * 0.85, smoothstep(0.75, 1.0, n) * 0.4 + nubLocal * 0.35 + delFrente * 0.3);
          // el borde que da al sol se enciende
          float borde = clamp((n - nLuz) * 2.2, 0.0, 1.0) * (1.0 - smoothstep(umbral + 0.05, umbral + 0.3, n) * 0.5);
          nube += uSolColor * borde * (0.35 + uTarde * 1.0) * (1.0 - uNublado * 0.4) * smoothstep(0.0, 0.25, uDia);
          // y el halo alrededor del sol, cuando el sol está detrás de la nube
          nube += uSolColor * pow(ds, 22.0) * 0.5 * (1.0 - uNublado * 0.5);
          // 3.5: de noche la luna platea las nubes que tiene cerca (antes eran manchas negras)
          float alLuna = max(dot(d, uLuna), 0.0);
          nube += vec3(0.30, 0.36, 0.52) * (pow(alLuna, 10.0) * 0.32 + borde * 0.1) * (1.0 - uDia) * uIluminada * (1.0 - uNublado * 0.5);
          col = mix(col, nube, cobertura * smoothstep(-0.02, 0.2, h) * 0.94);
        }
        if (h > 0.14) {
          vec2 uv2 = d.xz / (h + 0.55);
          float cir = fbm(uv2 * 3.4 + vec2(uTiempo * 0.009, -uTiempo * 0.004));
          cir *= 0.75 + 0.25 * fbm(uv2 * 7.0 - vec2(uTiempo * 0.015, 0.0));
          cir = smoothstep(0.64 - uNublado * 0.08, 0.9, cir);
          vec3 cirCol = mix(uCenit * 1.08, vec3(1.0), uDia * 0.28 + uTarde * 0.2);
          cirCol += uSolColor * pow(ds, 8.0) * 0.18;
          col = mix(col, cirCol, cir * (0.08 + 0.16 * uDia) * (1.0 - uNublado * 0.45));
        }
        // 3.2: alfa 0 = cielo. El postproceso lo usa para saber por dónde entra la luz
        // (los rayos de sol salen del cielo que se ve entre las copas). En pantalla no se nota.
        gl_FragColor = vec4(gradoEstilo(col), 0.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(4000, 32, 16), matCielo);
  cielo.frustumCulled = false;
  cielo.renderOrder = 900;   // último de los opacos: no pinta lo que ya tapan los árboles
  escena.add(cielo);

  // ---------------------------------------------------------------- cordillera
  const { fbm, simplex } = crearRuido(4242);
  // 3.4: la cordillera patagónica. La grilla radial de antes (30 anillos de 192 lados) tenía
  // el ruido más fino que la malla y salían dientes de sierra parejos. Ahora son cordones:
  // una franja por cordón que sigue su cresta (la silueta cae justo en los vértices: picos
  // irregulares, macizos y portezuelos, sin dientes) sobre un piedemonte bajo que tapa los
  // huecos. Del más cercano (cerros con bosque) al más lejano (macizos con nieve y
  // glaciares), cada uno más alto, más claro y más azul. Un solo dibujo, como antes.
  // (384 lados en los cordones y 192 en el piedemonte, que es liso)
  const LADOS_CORD = 384, LADOS_PIE = 192;
  const pos = [], ind = [], costuras = [];
  // ruido sobre el círculo (sin costura en el oeste); `s` es el radio en unidades de ruido:
  // con 384 lados, hasta s ≈ 12 cada rasgo lleva cinco vértices o más (nada de dientes)
  const circ = (a, s, ox, oy) => simplex(Math.cos(a) * s + ox, Math.sin(a) * s + oy);
  const circFbm = (a, s, ox, oy, oct) => fbm(Math.cos(a) * s + ox, Math.sin(a) * s + oy, oct);
  // superelipse: los cordones cercanos siguen la forma cuadrada del valle
  const supEl = (a, R, p) => R / Math.pow(Math.pow(Math.abs(Math.cos(a)), p) + Math.pow(Math.abs(Math.sin(a)), p), 1 / p);
  // el lado alto (-x, por donde entra el frente) y el bajo (+x, donde se pone el sol)
  const ladoAlto = (a) => { const x = Math.cos(a); return 0.8 + 0.45 * smoothstep(-0.1, -0.85, x) - 0.08 * smoothstep(0.3, 0.9, x); };
  // piedemonte: lomas bajas que van subiendo hacia afuera, debajo de todos los cordones
  const piedemonte = (a, r) => {
    const ondula = circFbm(a, 1.6, r * 0.0009, 3.1, 3) * 0.5 + 0.5;
    return 18 + smoothstep(560, 1700, r) * (40 + 70 * ondula) * (0.7 + 0.3 * ladoAlto(a)) + smoothstep(2600, 3800, r) * 60;
  };
  const filas = (nFilas, lados, punto) => {
    const base = pos.length / 3;
    for (let j = 0; j < nFilas; j++) {
      for (let i = 0; i <= lados; i++) {
        const a = (i / lados) * Math.PI * 2;
        const [r, y] = punto(a, j);
        pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
      }
      costuras.push([base + j * (lados + 1), base + j * (lados + 1) + lados]);
    }
    for (let j = 0; j < nFilas - 1; j++) for (let i = 0; i < lados; i++) {
      const v = base + j * (lados + 1) + i, w = v + lados + 1;
      ind.push(v, v + 1, w, v + 1, w + 1, w);
    }
  };
  // el piedemonte: 14 anillos de 520 a 3800 m
  filas(14, LADOS_PIE, (a, j) => { const r = 520 * Math.pow(3800 / 520, j / 13); return [r, piedemonte(a, r)]; });
  // los cordones: radio, forma, ancho del faldeo (adelante y atrás), altura de cresta y agujas
  // (el borde del valle es una loma de unos 100 m: desde el valle tapa hasta ~11° de altura;
  // el primer cordón asoma apenas y los de atrás se levantan cada vez más)
  const CORDONES = [
    { R: 800, p: 4, wf: 300, wb: 170, alto: 215, picos: 0.5, s: 11, lado: 0.4 },
    { R: 1250, p: 3, wf: 640, wb: 280, alto: 500, picos: 0.55, s: 23, lado: 0.7 },
    { R: 2100, p: 2, wf: 950, wb: 400, alto: 850, picos: 0.75, s: 37 },
    { R: 3200, p: 2, wf: 1200, wb: 480, alto: 1250, picos: 0.9, s: 53 },
  ];
  // (faldeos anchos: abajo tendidos, con bosque; arriba empinados, de roca)
  // de la cresta al pie, por delante; el faldeo es cóncavo (empinado arriba, tendido abajo)
  const T_FALDEO = [1, 0.8, 0.6, 0.42, 0.26, 0.12, 0];
  for (const c of CORDONES) {
    const crestaDe = (a) => {
      const masa = smoothstep(-0.5, 0.55, circFbm(a, 1.6, c.s, c.s * 0.7, 3));   // macizos y portezuelos
      const arista = 1 - Math.abs(circ(a, 3.6, c.s * 1.3, 5.2));
      const aguja = Math.pow(1 - Math.abs(circ(a, 6.5, c.s * 2.1, 9.7)), 3);   // agujas sueltas (como el Catedral)
      const quiebre = circ(a, 11, c.s * 5.3, 4.4) * 0.045;   // la cresta de roca no es una recta
      // (el primer cordón casi no crece del lado alto: los cerros grandes quedan atrás)
      return c.alto * Math.pow(ladoAlto(a), c.lado ?? 1) * (0.4 + 0.6 * masa) * (0.75 + c.picos * (0.3 * arista * arista + 0.28 * aguja * masa) + quiebre);
    };
    filas(T_FALDEO.length + 1, LADOS_CORD, (a, j) => {
      const rc = supEl(a, c.R * (1 + 0.1 * circ(a, 1.8, c.s * 3.3, 1.1)), c.p);
      const hc = crestaDe(a);
      if (j === T_FALDEO.length) { const r = rc + c.wb; return [r, piedemonte(a, r) - 25]; }
      const t = T_FALDEO[j];
      // contrafuertes y cañadones que bajan de la cresta
      const espolon = circ(a, 7.5, c.s * 4.1, 2.3);
      const r = rc - c.wf * t * (1 + 0.22 * espolon);
      const piso = piedemonte(a, r) - 25;
      if (t >= 1) return [r, piso];
      return [r, Math.max(piso, hc * Math.pow(1 - t, 1.5) * (1 + 0.6 * espolon * t * (1 - t)))];
    });
  }
  const gC = new THREE.BufferGeometry();
  gC.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  gC.setIndex(ind);
  gC.computeVertexNormals();
  // 2.7: el primer y el último vértice de cada anillo son el mismo punto: se promedia su
  // normal para que no quede una costura de luz en el oeste
  {
    const nC = gC.attributes.normal;
    for (const [a, b] of costuras) {
      const x = nC.getX(a) + nC.getX(b), y = nC.getY(a) + nC.getY(b), z = nC.getZ(a) + nC.getZ(b), l = Math.hypot(x, y, z) || 1;
      nC.setXYZ(a, x / l, y / l, z / l); nC.setXYZ(b, x / l, y / l, z / l);
    }
    // 3.5: facetas. La cresta sube y baja de un vértice al otro y las filas de abajo son
    // lisas: cada triángulo largo del faldeo tenía su propia normal y la ladera se leía como
    // un poliedro (caras claras y oscuras en punta). Se suavizan las normales a lo largo de
    // cada anillo (tres pasadas de un filtro 1-2-1, sin costura): la luz sigue la forma
    // grande del cordón (contrafuertes, cañadones) y no cada vértice. Sólo al armarla.
    const arr = nC.array, tmpN = new Float32Array(arr.length);
    for (let pasada = 0; pasada < 3; pasada++) {
      tmpN.set(arr);
      for (const [a, b] of costuras) {
        const lados = b - a;
        for (let i = 0; i <= lados; i++) {
          const ia = a + ((i - 1 + lados) % lados), ib = a + ((i + 1) % lados), ic = a + (i % lados);
          let x = tmpN[ia * 3] + 2 * tmpN[ic * 3] + tmpN[ib * 3];
          let y = tmpN[ia * 3 + 1] + 2 * tmpN[ic * 3 + 1] + tmpN[ib * 3 + 1];
          let z = tmpN[ia * 3 + 2] + 2 * tmpN[ic * 3 + 2] + tmpN[ib * 3 + 2];
          const l = Math.hypot(x, y, z) || 1;
          arr[(a + i) * 3] = x / l; arr[(a + i) * 3 + 1] = y / l; arr[(a + i) * 3 + 2] = z / l;
        }
      }
    }
    nC.needsUpdate = true;
  }
  const matCord = new THREE.ShaderMaterial({
    uniforms: { uSolDir: U.uSolDir, uSolColor: U.uSolColor, uAmbiente: U.uAmbiente, uHorizonte: U.uHorizonte, uCenit: U.uCenit, uInvierno: U.uInvierno, uOtono: U.uOtono, uNiebla: { value: 1 }, uRasante: { value: 0 }, uHumedadAire: { value: 0 }, uAlturaCam: { value: 0 }, uTardeCord: { value: 0 },
      uColorNiebla: { value: new THREE.Color(0.6, 0.7, 0.75) },
      uBruma: U.uBruma, uBrumaSol: U.uBrumaSol, uBrumaFuerza: U.uBrumaFuerza, uGradoMat: U.uGradoMat, uSolDirEst: U.uSolDir },
    vertexShader: /* glsl */`
      varying vec3 vPos; varying vec3 vN;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vPos = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMUN}
      ${GLSL_ESTILO}
      uniform vec3 uSolDir; uniform vec3 uSolColor; uniform vec3 uAmbiente; uniform vec3 uHorizonte; uniform vec3 uCenit; uniform float uInvierno; uniform float uOtono; uniform float uNiebla; uniform float uRasante; uniform float uHumedadAire; uniform float uAlturaCam; uniform float uTardeCord;
      uniform vec3 uColorNiebla;
      varying vec3 vPos; varying vec3 vN;
      void main() {
        vec3 n = normalize(vN);
        // 3.4: los Andes patagónicos pintados. Bosque abajo (coihue oscuro y, en la franja alta,
        // lenga más clara que en otoño se pone roja), roca gris violácea arriba, acarreo claro
        // al pie de las paredes y nieve en las cumbres y bajando por las canaletas. Manchas de
        // pincel de cientos de metros, nada de grano.
        float m1 = vnoise(vPos.xz * 0.0045);
        float m2 = vnoise(vPos.xz * 0.013 + 7.0);
        // canaletas: franjas que bajan por la ladera (cambian rápido a lo largo del cordón y
        // despacio con la altura); el ruido va sobre el círculo, sin costura
        vec2 rumbo = normalize(vPos.xz);
        float canal = smoothstep(0.52, 0.86, vnoise(rumbo * (36.0 + vPos.y * 0.004)));
        // nervios y surcos que bajan por la ladera: la cara grande no se lee plana
        float surco = vnoise(rumbo * (58.0 + vPos.y * 0.012) + 11.0);
        float pend = 1.0 - n.y;   // 0.13 ≈ 30°, 0.29 ≈ 45°, 0.5 ≈ 60°
        float lineaBosque = 430.0 + (m1 - 0.5) * 150.0 - pend * 170.0 - canal * 60.0;
        float bosque = (1.0 - smoothstep(lineaBosque - 40.0, lineaBosque + 30.0, vPos.y)) * (1.0 - smoothstep(0.36, 0.52, pend + (m2 - 0.5) * 0.16));
        float lineaNieve = mix(740.0, 190.0, uInvierno) + (m1 - 0.5) * 200.0 + (surco - 0.5) * 40.0 - canal * 280.0;
        // la nieve se queda en lo tendido y en las canaletas; las paredes muestran la roca
        float nieve = smoothstep(lineaNieve, lineaNieve + 70.0, vPos.y) * (1.0 - smoothstep(0.3, 0.46, pend + (surco - 0.5) * 0.1 - canal * 0.3) * (1.0 - uInvierno * 0.5));
        vec3 cBosque = mix(srgb(vec3(0.13, 0.25, 0.22)), srgb(vec3(0.20, 0.31, 0.21)), m2);
        float lenga = smoothstep(lineaBosque - 210.0, lineaBosque - 40.0, vPos.y);
        vec3 cLenga = mix(srgb(vec3(0.27, 0.36, 0.21)), mix(srgb(vec3(0.60, 0.19, 0.07)), srgb(vec3(0.72, 0.42, 0.12)), m1), uOtono);
        cBosque = mix(cBosque, cLenga, lenga * 0.75);
        // las copas del bosque, en manchones (se pierden solas con la distancia y la bruma)
        cBosque *= 0.8 + 0.34 * vnoise(vPos.xz * 0.03 + 3.0);
        vec3 cRoca = mix(srgb(vec3(0.40, 0.39, 0.48)), srgb(vec3(0.56, 0.53, 0.56)), m1);
        vec3 col = mix(cRoca, srgb(vec3(0.63, 0.60, 0.56)), smoothstep(0.3, 0.1, pend) * m2 * 0.6);
        col = mix(col, cBosque, bosque);
        // en invierno el bosque de las laderas queda escarchado
        col = mix(col, srgb(vec3(0.76, 0.80, 0.85)), uInvierno * bosque * (0.35 + 0.25 * m2));
        col *= mix(0.88, 1.07, surco) * (1.0 - canal * 0.1 * (1.0 - nieve));
        col = mix(col, srgb(vec3(0.95, 0.96, 0.99)), nieve);
        // luz envolvente pintada: la ladera al sol clara y tibia, la de sombra toma el azul
        // del cielo (la nieve a la sombra queda lavanda, no gris). El paso de luz a sombra es
        // de pincel: un escalón blando que se quiebra con las manchas.
        float nl = dot(n, uSolDir);
        vec3 solLejos = mix(uSolColor, vec3(dot(uSolColor, vec3(0.3333))), 0.35);
        float nlPincel = nl + (m2 - 0.5) * 0.22 + (surco - 0.5) * 0.18;
        float alSol = mix(smoothstep(-0.25, 0.65, nl), smoothstep(0.0, 0.16, nlPincel) * 0.62 + smoothstep(0.4, 0.55, nlPincel) * 0.38, 0.45);
        vec3 luz = uAmbiente * 3.14 * 1.1 * mix(vec3(0.9, 0.94, 1.1), vec3(1.0), alSol) + solLejos * 3.14 * alSol * 0.95;
        col *= luz / 3.14;
        vec3 vista = normalize(cameraPosition - vPos);
        float borde = pow(max(dot(vista, -uSolDir), 0.0), 4.0) * (1.0 - max(nl, 0.0));
        col += uSolColor * borde * (0.07 + uRasante * 0.08);
        // RC30 → 3.4: perspectiva aérea por capas. Cada cordón más lejos es más claro y más
        // azul; cerca, el aire es el mismo de la niebla del valle (la loma del borde y el
        // primer cordón se funden sin escalón) y el aire se junta en el pie de cada cordón.
        float d = length(vPos.xz - cameraPosition.xz);
        float aireLejos = 1.0 - exp(-d * 0.0005 * uNiebla);
        float aireValle = exp(-max(vPos.y - uAlturaCam + 20.0, 0.0) / 130.0) * smoothstep(300.0, 1200.0, d) * (0.4 + uHumedadAire);
        float contraSol = pow(max(dot(-vista, uSolDir), 0.0), 5.0) * uRasante;
        vec3 azulLejos = mix(uHorizonte, uCenit, 0.45);
        vec3 colorAire = mix(uColorNiebla, azulLejos, smoothstep(900.0, 3400.0, d) * 0.6);
        colorAire = mix(colorAire, colorBruma(-vista), 0.15 + contraSol * 0.5);
        float aire = clamp(0.06 + aireLejos * 0.74, 0.0, 0.72);
        aire = clamp(aire + aireValle * 0.3, 0.0, 0.86);
        // con lluvia la cordillera se borra detrás de la cortina de agua (y no queda más oscura
        // que la niebla del valle)
        aire = mix(aire, 0.97, smoothstep(3.2, 5.0, uNiebla) * aireLejos);
        // 3.5: al alba y al ocaso el aire tapaba los cordones con un durazno parejo (el
        // piedemonte y la cordillera quedaban pálidos, sin planos). Ahora, con el sol bajo, hay
        // algo menos de aire y el de lejos es lavanda (del cenit): cada cordón se separa del de
        // atrás como en una acuarela, cerca más hondo y tibio, lejos más claro y frío.
        float tardeC = uTardeCord * (1.0 - smoothstep(3.2, 5.0, uNiebla));
        aire *= 1.0 - tardeC * 0.24;
        vec3 lavandaLejos = mix(uCenit, uHorizonte, 0.42) * vec3(1.02, 0.94, 1.12);
        colorAire = mix(colorAire, lavandaLejos, tardeC * smoothstep(700.0, 3000.0, d) * 0.55);
        col = mix(col, colorAire, aire);
        // el arrebol: las cumbres que miran al sol bajo se encienden rosa anaranjado (la nieve
        // más que la roca) y se ven a través del aire. Sin cuentas nuevas de luz.
        float arrebol = tardeC * smoothstep(260.0, 820.0, vPos.y) * smoothstep(-0.05, 0.45, nl) * (0.45 + 0.55 * nieve);
        vec3 tonoArrebol = normalize(uSolColor + vec3(1e-4)) * vec3(1.0, 0.72, 0.62) * 1.25;
        col = mix(col, col * 0.5 + tonoArrebol * (0.42 + 0.3 * nieve), arrebol * (1.0 - aire * 0.45) * 0.62);
        // Una cresta a luz rasante conserva una línea cálida muy sutil incluso
        // cuando el valle de detrás ya entra en perspectiva aérea.
        float cresta = smoothstep(0.18, 0.62, n.y) * smoothstep(0.0, 0.35, max(nl, 0.0));
        col += uSolColor * cresta * uRasante * (1.0 - aire) * 0.07;
        gl_FragColor = vec4(gradoEstilo(col), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const cordillera = new THREE.Mesh(gC, matCord);
  cordillera.frustumCulled = false;
  // 3.4: la última de los opacos antes del cielo: lo que tapan el terreno y el bosque ni se pinta
  cordillera.renderOrder = 899;
  escena.add(cordillera);

  // ---------------------------------------------------------------- luces
  const sol = new THREE.DirectionalLight(0xffffff, 2.5);
  if (calidad.sombras) {
    sol.castShadow = true;
    sol.shadow.mapSize.set(calidad.sombras, calidad.sombras);
    const s = calidad.sombras >= 2048 ? 55 : 40;
    Object.assign(sol.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 400 });
    sol.shadow.bias = -0.0006;
    // 2.7: borde de sombra suave (PCF con radio) en calidad media y alta. El filtro
    // ancho muestrea téxeles vecinos: el corrimiento por normal crece con el radio para
    // que no aparezca acné en troncos y laderas a luz rasante.
    sol.shadow.radius = calidad.sombraSuave || 1;
    sol.shadow.normalBias = 0.06 + 0.035 * (sol.shadow.radius - 1) * (2048 / Math.max(512, calidad.sombras));
    // la capa 1 tiene las siluetas livianas que solo se usan para las sombras
    sol.shadow.camera.layers.enable(1);
  }
  // 1.8: la calidad automática puede cambiar el mapa de sombras sin reiniciar el
  // mundo. Cambiar el tamaño obliga a tirar el mapa viejo: three arma uno nuevo solo.
  function ajustarSombras(tam) {
    const n = Math.max(0, Math.floor(tam) || 0);
    if (n === (sol.castShadow ? sol.shadow.mapSize.width : 0)) return false;
    if (!n) { sol.castShadow = false; return true; }
    sol.castShadow = true;
    sol.shadow.mapSize.set(n, n);
    sol.shadow.radius = n >= 2048 ? 2.6 : 2.2;   // 2.7: el mismo borde suave que al arrancar
    sol.shadow.normalBias = 0.06 + 0.035 * (sol.shadow.radius - 1) * (2048 / Math.max(512, n));
    const s = n >= 2048 ? 55 : 40;
    Object.assign(sol.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 400 });
    sol.shadow.camera.updateProjectionMatrix();
    sol.shadow.camera.layers.enable(1);
    if (sol.shadow.map) { sol.shadow.map.dispose(); sol.shadow.map = null; }
    return true;
  }

  escena.add(sol, sol.target);
  const hemi = new THREE.HemisphereLight(0xbcd4e6, 0x3a3222, 1);
  escena.add(hemi);
  escena.fog = new THREE.FogExp2(0xb9d3e3, 0.005);

  const tmp = new THREE.Color(), tmp2 = new THREE.Color();
  const AMBIENTE_NOCHE = C('#2c3752');
  // 2.6.1: vectores y colores fijos reutilizados: antes se creaban/parseaban en cada cuadro
  const solDir = new THREE.Vector3(), lunaDir = new THREE.Vector3();
  // 3.2: sol dorado (cálido también a mediodía) y ambiente de color: el cielo turquesa
  // rellena las sombras y el suelo devuelve verde. Al ocaso las sombras tiran a lavanda.
  // 3.4: el sol bajo es naranja, el de la tarde dorado (SOL_DORADO) y el del mediodía crema;
  // el suelo devuelve una luz parda tibia (troncos y caras de abajo con color, no negras).
  const SOL_BAJO = C('#ff8f40'), SOL_ALTO = C('#ffe9c6'), SOL_DORADO = C('#ffbb66'), LUZ_LUNA = C('#8aa2d6');
  const AMBIENTE_OCASO = C('#b8a6d2'), SUELO_HEMI = C('#6e5c3e'), CIELO_TURQUESA = C('#a6cdd6');
  // 3.2: la bruma del estilo: turquesa de día, dorada a la tarde; hacia el sol, más cálida
  // 3.4: de día la bruma es gris azulada pálida (funde el bosque lejano en siluetas); a la
  // tarde, durazno hacia el sol y lavanda lejos de él
  const BRUMA_DIA = C('#a7c1cb'), BRUMA_TARDE = C('#cfa9a8'), BRUMA_SOL = C('#ffd49a');
  // 3.4: cielo de la hora dorada (de las 16 a la puesta): cenit lavanda azulado, horizonte durazno
  const CENIT_DORADO = C('#6a7cbc'), HORIZ_DORADO = C('#f4bb8a');
  // 3.2: la niebla del estilo es algo más espesa que la de la 2.7 (de color, no gris)
  // 3.4: más espesa todavía: la perspectiva aérea separa los planos (cerca, medio, lejos)
  const NIEBLA_ESTILO = 1.5;
  let luzLuna = 1;

  function actualizar(horas, clima, cam, extraNiebla) {
    // días largos de verano patagónico: sale a las 6:30 y se pone a las 20:30
    const h = ((horas % 24) + 24) % 24;
    const ang = h >= 6.5 && h < 20.5 ? ((h - 6.5) / 14) * Math.PI : Math.PI + ((((h - 20.5) % 24) + 24) % 24 / 10) * Math.PI;
    solDir.set(-Math.cos(ang), Math.sin(ang) * 0.9, 0.38).normalize();
    lunaDir.set(Math.cos(ang) * 0.8, -Math.sin(ang) * 0.75 + 0.18, -0.45).normalize();
    const dia = smoothstep(-0.14, 0.18, solDir.y);
    const tarde = Math.exp(-Math.pow(solDir.y / 0.16, 2)) * smoothstep(-0.25, -0.02, solDir.y);
    const nub = clamp(clima.nublado, 0, 1);
    // 3.4: la hora dorada. `tarde` sólo vale cerca del horizonte (a las 18:30 el sol todavía
    // está alto en el verano patagónico): la tarde larga se dora por la hora, no por la altura
    const dorada = smoothstep(15.8, 18.8, h) * (1 - smoothstep(20.4, 21.1, h)) * (1 - nub * 0.7);

    uniforms.uSol.value.copy(solDir);
    uniforms.uLuna.value.copy(lunaDir);
    uniforms.uDia.value = dia;
    uniforms.uTarde.value = tarde;
    uniforms.uDorada.value = dorada;
    uniforms.uNublado.value = nub;

    const cenit = U.uCenit.value, horiz = U.uHorizonte.value;
    const alba = Math.exp(-Math.pow((solDir.y - 0.015) / 0.12, 2)) * Math.max(0, 1 - dia * 0.35);
    cenit.copy(PALETA.cenitNoche).lerp(PALETA.cenitDia, dia).lerp(PALETA.cenitTarde, tarde * 0.55).lerp(PALETA.frioAlba, alba * 0.28);
    horiz.copy(PALETA.horizNoche).lerp(PALETA.horizDia, dia).lerp(PALETA.horizTarde, tarde * 0.55).lerp(PALETA.bandaAlba, alba * 0.3);
    // 3.4: la hora dorada tiñe el cielo antes de que el sol llegue al horizonte
    cenit.lerp(CENIT_DORADO, dorada * dia * 0.5 * (1 - tarde));
    horiz.lerp(HORIZ_DORADO, dorada * dia * 0.55 * (1 - tarde));
    tmp.copy(PALETA.gris).multiplyScalar(0.12 + 0.75 * dia);
    cenit.lerp(tmp, nub * 0.75);
    horiz.lerp(tmp, nub * 0.65);

    // sol de día, luna de noche
    const deDia = solDir.y > -0.04;
    const dirLuz = deDia ? solDir : lunaDir;
    // 3.2: el dorado dura toda la tarde (no sólo el último rato antes de ponerse)
    const colorSol = tmp.copy(SOL_BAJO).lerp(SOL_ALTO, smoothstep(0.02, 0.62, solDir.y));
    colorSol.lerp(SOL_DORADO, dorada * 0.75 * smoothstep(0.02, 0.2, solDir.y));   // 3.4
    let intensidad;
    if (deDia) {
      intensidad = 3.4 * smoothstep(-0.04, 0.22, solDir.y) * (1 - nub * 0.72);
      sol.color.copy(colorSol);
    } else {
      intensidad = 0.7 * smoothstep(-0.02, 0.2, -solDir.y) * (1 - nub * 0.6) * luzLuna;
      sol.color.copy(LUZ_LUNA);
    }
    sol.intensity = intensidad;
    sol.position.set(cam.x + dirLuz.x * 150, cam.y + dirLuz.y * 150, cam.z + dirLuz.z * 150);
    sol.target.position.set(cam.x, cam.y, cam.z);
    if (calidad.sombras) {
      // encaja la cámara de sombras en téxeles para que no titile al caminar
      const paso = (sol.shadow.camera.right * 2) / calidad.sombras;
      sol.target.position.x = Math.round(cam.x / paso) * paso;
      sol.target.position.z = Math.round(cam.z / paso) * paso;
      sol.position.x = sol.target.position.x + dirLuz.x * 150;
      sol.position.z = sol.target.position.z + dirLuz.z * 150;
    }

    hemi.color.copy(AMBIENTE_NOCHE).lerp(tmp2.copy(cenit).lerp(horiz, 0.5).lerp(CIELO_TURQUESA, 0.35).multiplyScalar(1.1), smoothstep(0, 0.6, dia));
    hemi.color.lerp(tmp2.copy(AMBIENTE_OCASO), 0.5 * Math.max(tarde, dorada * 0.7));   // el ambiente del ocaso, lavanda (3.4: toda la hora dorada)
    hemi.groundColor.copy(SUELO_HEMI).multiplyScalar(0.4 + 0.6 * dia);
    // 3.2: de día el ambiente pesa un poco menos que el sol: más contraste, sombras de color
    hemi.intensity = 0.78 + 0.95 * dia;

    U.uSolDir.value.copy(dirLuz);
    U.uSolColor.value.copy(sol.color).multiplyScalar(intensidad / Math.PI);
    U.uCieloBajo.value.copy(horiz);   // para los reflejos del suelo mojado
    U.uAmbiente.value.copy(hemi.color).lerp(hemi.groundColor, 0.35).multiplyScalar(hemi.intensity / Math.PI);
    U.uNoche.value = 1 - dia;

    // 3.2: la bruma del estilo (ver materiales.js). De día turquesa, a la tarde dorada, de
    // noche el azul del horizonte; con nubes se agrisa. Hacia el sol, un aire más cálido.
    const tardeAire = Math.max(tarde, dorada * 0.8);   // 3.4
    const bruma = U.uBruma.value.copy(horiz).lerp(tmp2.copy(BRUMA_DIA), 0.6 * dia * (1 - tardeAire)).lerp(tmp2.copy(BRUMA_TARDE), 0.6 * tardeAire);
    bruma.lerp(tmp2.copy(PALETA.gris).multiplyScalar(0.2 + 0.8 * dia), nub * 0.5);
    U.uBrumaSol.value.copy(bruma).lerp(tmp2.copy(BRUMA_SOL).lerp(SOL_BAJO, tardeAire * 0.5), 0.65 * dia * (1 - nub * 0.7));
    U.uBrumaFuerza.value = 1 + nub * 0.25 + clima.lluvia * 0.4;
    // 3.4: la hoja a contraluz brilla menos (sobre todo en la hora dorada): el bosque contra
    // el sol se lee como silueta con borde de luz, no como una pared verde lima encendida
    U.uTrasluz.value = 0.85 - 0.4 * tardeAire;
    // la niebla de siempre toma el mismo color que la bruma: el paisaje lejano se funde
    // con el aire, no con un gris
    escena.fog.color.copy(bruma).multiplyScalar(0.96);
    // 3.5: con el sol bajo el aire del valle recibe poca luz: la niebla no puede ser más clara
    // que lo que tapa (el lago y las lomas del borde quedaban como una sábana durazno pálida
    // al alba y al ocaso). Se oscurece y se enfría un poco hacia el lavanda del cenit.
    {
      const bajo = tardeAire * (1 - nub * 0.6) * smoothstep(-0.1, 0.05, solDir.y);
      escena.fog.color.lerp(tmp2.copy(cenit).lerp(horiz, 0.55), bajo * 0.38).multiplyScalar(1 - bajo * 0.3);
    }
    const neblinaManana = smoothstep(5, 7.5, h) * (1 - smoothstep(8.5, 11, h));
    const claridadMediodia = smoothstep(0.22, 0.7, solDir.y);
    // Hotfix visual RC30: la densidad anterior lavaba casi por completo el terreno
    // medio a 250-350 m. Mantener atmósfera sin convertir el valle en una pared gris.
    // 3.5: `nieblaDistancia` (main.js): con otra distancia de dibujo la niebla se estira o se
    // acorta con el borde del bosque (1 con la distancia de la calidad)
    escena.fog.density = (0.00185 + neblinaManana * 0.0029 + nub * 0.0009 + clima.lluvia * 0.0028 + extraNiebla * 0.55 - claridadMediodia * 0.00025) * calidad.niebla * (calidad.nieblaDistancia || 1) * NIEBLA_ESTILO;
    const rasante = factorLuzRasante(solDir.y, nub);
    const humedadAire = clamp(nub * 0.5 + clima.lluvia * 0.85 + neblinaManana * 0.42 + extraNiebla * 18, 0, 1);
    matCord.uniforms.uNiebla.value = 1 + nub * 2.1 + clima.lluvia * 3.2;
    matCord.uniforms.uRasante.value = rasante;
    matCord.uniforms.uHumedadAire.value = humedadAire;
    matCord.uniforms.uAlturaCam.value = cam.y;
    matCord.uniforms.uTardeCord.value = Math.max(tarde, dorada * 0.6) * (1 - nub * 0.8) * smoothstep(-0.06, 0.02, solDir.y);   // 3.5
    matCord.uniforms.uColorNiebla.value.copy(escena.fog.color);
    // 3.4: sin postproceso, la gradación de los materiales (gradoEstilo) también dora la
    // tarde: lo que pasa de 1 en uGradoMat es la tarde (la misma cuenta que le llega a la
    // composición del postproceso). El postproceso lo pone en 0 mientras dibuja.
    U.uGradoMat.value = 1 + Math.max(tarde, dorada * 0.75);

    cielo.position.copy(cam);
    return { dia, tarde, dorada, solDir, lunaDir, rasante, humedadAire };
  }

  // 2.0: la luna de esta noche (ver `cielo-noche.js`)
  function ponerLuna(fase, efecto) {
    uniforms.uFaseLuna.value = fase;
    uniforms.uIluminada.value = efecto.iluminada;
    uniforms.uEstrellas.value = efecto.estrellas;
    uniforms.uVia.value = efecto.via;
    luzLuna = efecto.luz;
  }

  return { actualizar, sol, hemi, ajustarSombras, ponerLuna, uniforms };
}

// ---------------------------------------------------------------- constelaciones del sur
// Direcciones en el cielo del juego: norte es -z, sur +z, este -x, oeste +x.
const dir = (acimut, altura) => {
  const a = (acimut * Math.PI) / 180, h = (altura * Math.PI) / 180;
  return new THREE.Vector3(-Math.sin(a) * Math.cos(h), Math.sin(h), -Math.cos(a) * Math.cos(h)).normalize();
};

export const CONSTELACIONES = [
  {
    id: 'cruz-del-sur', nombre: 'Cruz del Sur',
    estrellas: [[178, 34], [182, 26], [174, 30], [186, 31], [181, 29]],
    lineas: [[0, 1], [2, 3]],
  },
  {
    id: 'tres-marias', nombre: 'Las Tres Marías',
    estrellas: [[38, 47], [41, 44], [44, 41], [33, 53], [49, 35]],
    lineas: [[0, 1], [1, 2], [3, 0], [2, 4]],
  },
  {
    id: 'magallanes', nombre: 'Nubes de Magallanes',
    estrellas: [[205, 52], [212, 49], [208, 51], [232, 40], [236, 38]],
    lineas: [],
  },
  {
    id: 'escorpio', nombre: 'Escorpio',
    estrellas: [[104, 30], [100, 25], [97, 20], [96, 14], [101, 34], [108, 36], [112, 33]],
    lineas: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6]],
  },
];

// 2.0: las estrellas fugaces. Cada una es un trazo de dos puntas —la cabeza brillante,
// la cola que se apaga— sobre la esfera del cielo. Hay pocas a la vez, así que alcanza
// con un puñado de líneas que se reciclan; la receta de cada una sale de
// `cielo-noche.js`.
export function crearFugaces(escena, cuantas = 4) {
  const R = 3000;
  const grupo = new THREE.Group();
  grupo.frustumCulled = false;
  escena.add(grupo);
  const lista = [];
  for (let i = 0; i < cuantas; i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const l = new THREE.Line(g, m);
    l.frustumCulled = false; l.visible = false; l.renderOrder = 901;
    grupo.add(l);
    lista.push({ linea: l, t: 0, f: null });
  }
  const punto = (acimut, altura, v) => {
    const a = (acimut * Math.PI) / 180, h = (altura * Math.PI) / 180;
    return v.set(-Math.sin(a) * Math.cos(h), Math.sin(h), -Math.cos(a) * Math.cos(h)).multiplyScalar(R);
  };
  const cabeza = new THREE.Vector3(), cola = new THREE.Vector3();
  function lanzar(f) {
    const libre = lista.find((x) => !x.f);
    if (!libre) return null;
    libre.f = f; libre.t = 0; libre.linea.visible = true;
    return libre;
  }
  // `v` es cuánto se ve el cielo (noche y sin nubes)
  function actualizar(dt, cam, v = 1) {
    grupo.position.copy(cam);
    let activas = 0;
    for (const x of lista) {
      if (!x.f) continue;
      x.t += dt;
      const f = x.f, k = x.t / f.dur;
      if (k >= 1) { x.f = null; x.linea.visible = false; continue; }
      activas++;
      // la cabeza corre a lo largo del rumbo; la cola la sigue a un tercio del largo
      const avance = f.largo * k, ancho = 1 / Math.max(0.25, Math.cos((f.altura * Math.PI) / 180));
      const dA = Math.cos(f.rumbo) * ancho, dH = Math.sin(f.rumbo);
      punto(f.acimut + dA * avance, f.altura + dH * avance, cabeza);
      const atras = Math.max(0, avance - f.largo * 0.35);
      punto(f.acimut + dA * atras, f.altura + dH * atras, cola);
      const p = x.linea.geometry.attributes.position;
      p.setXYZ(0, cabeza.x, cabeza.y, cabeza.z); p.setXYZ(1, cola.x, cola.y, cola.z);
      p.needsUpdate = true;
      // se enciende de golpe y se apaga al final, como una de verdad
      x.linea.material.opacity = f.brillo * v * Math.min(1, k * 8) * (1 - Math.pow(k, 3));
    }
    return activas;
  }
  return { lanzar, actualizar, lista };
}

export function crearConstelaciones(escena) {
  const grupo = new THREE.Group();
  grupo.frustumCulled = false;
  escena.add(grupo);
  const R = 3200;
  // textura redonda y difusa: si no, los puntos salen cuadrados
  const lienzoEstrella = document.createElement('canvas');
  lienzoEstrella.width = lienzoEstrella.height = 64;
  {
    const cx = lienzoEstrella.getContext('2d');
    const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(235,245,255,0.75)');
    g.addColorStop(0.6, 'rgba(200,220,255,0.18)');
    g.addColorStop(1, 'rgba(180,210,255,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, 64, 64);
  }
  const texEstrella = new THREE.CanvasTexture(lienzoEstrella);
  const matEstrella = new THREE.PointsMaterial({ color: 0xffffff, map: texEstrella, size: 150, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const matLinea = new THREE.LineBasicMaterial({ color: 0xbcd6f5, transparent: true, opacity: 0, depthWrite: false });
  const lista = [];
  for (const c of CONSTELACIONES) {
    const dirs = c.estrellas.map(([a, h]) => dir(a, h));
    const pos = [];
    for (const d of dirs) pos.push(d.x * R, d.y * R, d.z * R);
    const gEstrellas = new THREE.BufferGeometry();
    gEstrellas.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const puntos = new THREE.Points(gEstrellas, matEstrella);
    puntos.frustumCulled = false;
    grupo.add(puntos);
    const lineas = [];
    for (const [a, b] of c.lineas) lineas.push(...pos.slice(a * 3, a * 3 + 3), ...pos.slice(b * 3, b * 3 + 3));
    if (lineas.length) {
      const gl = new THREE.BufferGeometry();
      gl.setAttribute('position', new THREE.Float32BufferAttribute(lineas, 3));
      const l = new THREE.LineSegments(gl, matLinea);
      l.frustumCulled = false;
      grupo.add(l);
    }
    const centro = dirs.reduce((a, b) => a.add(b), new THREE.Vector3()).normalize();
    lista.push({ ...c, centro, dirs });
  }
  function actualizar(cam, noche, nublado) {
    grupo.position.copy(cam);
    const v = Math.max(0, noche - 0.35) * 1.5 * (1 - nublado * 0.9);
    matEstrella.opacity = Math.min(0.9, v);
    matLinea.opacity = Math.min(0.5, v * 0.5);
    grupo.visible = v > 0.02;
    return v;
  }
  return { lista, actualizar };
}
