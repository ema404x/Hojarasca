// 3.7.2: la cocina en el mundo (las reglas son de cocina-pasos.js; el juego, de cocina-juego.js). Lo que se ve:
//   · en la parrilla con cruz: el fuego (llamas al prender, brasas después), la carne en la cruz (el costillar o el
//     cordero abierto, que se dora al darlo vuelta) y los chorizos en la parrilla (uno menos si el perro pasó);
//   · en el horno de barro: el fuego en la boca al calentarlo, y la tapa y la pala mientras se hornea;
//   · en la cocina a leña: el resplandor de la puerta del fuego y la olla en la plancha (la de cobre para los
//     dulces, la grande negra para el locro y el curanto, el jarro para el chocolate), con su vapor;
//   · el humo: sale de cada estación con algo al fuego, mucho más del asado (se ve de lejos: es lo que trae a los
//     vecinos), con una sola nube de puntos para todas;
//   · la alacena: los frascos, los paquetes, los panes, las fuentes y las ollas de lo que tenés, acomodados en sus
//     estantes (una sola malla que se rehace cuando cambia lo que hay);
//   · el chorizo en la boca del perro.
// Fluidez: lo sólido va con el material de las estructuras (sin programas nuevos); el fuego, las brasas y el humo
// usan tres materiales propios que se compilan en la carga (`semillas`, como la aldea), nada a mitad de juego. Lo
// lejano (más de 45 m) no se dibuja; el humo sí (de lejos se ve), sólo el de las estaciones encendidas.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { CRUZ, BRASAS_PARRILLA, GRILLA, COCINA_LENA, HORNO_BOCA, ALACENA, centroCruz } from './planos-cocina.js';
import { RECETA_PASOS, alacenaDe } from './cocina-pasos.js';
import { registrarLuz } from './luces.js';

const PI = Math.PI;
const VER = 45;          // a cuántos metros se ve lo de las estaciones
const VER_ALACENA = 26;  // y lo de la alacena
const NH = 56;           // las bocanadas de humo (para todas las estaciones juntas)

// ---------------------------------------------------------------- piezas (tipo 0/4, como las obras)
function cj(c, pos, tam, color, rot = [0, 0, 0], tipo = 4, variar = 0.06) { c.agregar(new THREE.BoxGeometry(...tam), { color, tipo, variar, matriz: matriz(pos, rot) }); }
function cil(c, pos, r0, r1, alto, color, rot = [0, 0, 0], lados = 8, tipo = 4, variar = 0.05) { c.agregar(new THREE.CylinderGeometry(r0, r1, alto, lados), { color, tipo, variar, matriz: matriz(pos, rot) }); }
function bola(c, pos, r, color, esc = [1, 1, 1], rot = [0, 0, 0], variar = 0.06) { c.agregar(new THREE.SphereGeometry(r, 9, 7), { color, tipo: 4, variar, matriz: matriz(pos, rot, esc) }); }

// La carne en la cruz, en el marco de la cruz (y a lo largo del palo; z hacia el fuego). `tono`: de 0 (recién puesta,
// dorada clara) a 3 (bien tostada): se va oscureciendo con la cocción. Nada crudo ni cruento: el color del asado.
const TONOS_CARNE = [['#a8683a', '#d29a5c'], ['#94582e', '#c0844a'], ['#7c4622', '#ac6c36'], ['#643618', '#94582a']];
const TONOS_HUESO = ['#e2d0a6', '#d8c294', '#cbb080', '#bca070'];
// una lonja: la placa de carne abierta (los bordes irregulares, más finos; más ancha arriba que abajo)
function lonja(c, ancho, alto, grueso, colores, pos, rot = [0, 0, 0], cintura = 0) {
  const g = new THREE.BoxGeometry(ancho, alto, grueso, 10, 8, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (ancho / 2), y = p.getY(i) / (alto / 2), z = p.getZ(i);
    const borde = Math.max(0, 1 - 0.6 * (x * x * x * x + y * y * y * y));
    p.setZ(i, z * (0.3 + 0.7 * borde));
    const ondula = 1 + 0.05 * Math.sin(y * 7.3 + x * 2) + 0.03 * Math.sin(y * 13);
    p.setX(i, p.getX(i) * ondula * (1 - 0.1 * Math.max(0, -y) - cintura * (1 - y * y)));
    p.setY(i, p.getY(i) * (1 - 0.04 * x * x) + 0.02 * Math.sin(x * 9));
  }
  c.agregar(g, { color: colores[1], degradado: colores, tipo: 4, variar: 0.09, suave: true, matriz: matriz(pos, rot) });
}
// un tramo entre dos puntos (x, y) del plano de la carne, a la altura z
function tramo(c, a, b, z, r0, r1, color, lados = 6) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
  c.agregar(new THREE.CylinderGeometry(r1, r0, l, lados), { color, tipo: 4, variar: 0.06, matriz: matriz([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z], [0, 0, Math.atan2(-dx, dy)]) });
}
function geoCostillar(tono) {
  const c = new Constructor();
  const carne = TONOS_CARNE[tono], hueso = TONOS_HUESO[tono];
  const marca = new THREE.Color(carne[1]).lerp(new THREE.Color('#e8c890'), 0.25).getStyle();
  // el costillar abierto, a lo alto de la cruz (las costillas de arriba abajo, la falda abajo)
  lonja(c, 0.86, 1.0, 0.07, carne, [0, 0, 0]);
  // las costillas que se marcan del lado del fuego, con las puntas de hueso que asoman abajo
  for (let i = 0; i < 8; i++) {
    const x = -0.33 + i * 0.094, abre = (i - 3.5) * 0.008;   // casi paralelas, apenas abiertas abajo
    tramo(c, [x - abre, 0.4], [x + abre, -0.38], 0.03, 0.017, 0.014, marca);
    tramo(c, [x + abre, -0.39], [x + abre * 1.3, -0.47], 0.014, 0.016, 0.014, hueso);
  }
  // la costra tostada de los bordes, arriba
  tramo(c, [-0.4, 0.46], [0.4, 0.47], 0.0, 0.03, 0.03, carne[0], 7);
  // los alambres que la atan a las puntas de los travesaños
  for (const y of [0.46, -0.46]) for (const s of [-1, 1]) tramo(c, [s * 0.38, y], [s * 0.5, y], 0.0, 0.006, 0.006, '#3a3632', 4);
  return c.geometria();
}
function geoCordero(tono) {
  const c = new Constructor();
  const carne = TONOS_CARNE[Math.max(0, tono - 1)].map((x) => new THREE.Color(x).lerp(new THREE.Color('#e0b070'), 0.12).getStyle());
  const hueso = TONOS_HUESO[tono];
  const marca = new THREE.Color(carne[1]).lerp(new THREE.Color('#e8c890'), 0.25).getStyle();
  // el cordero abierto y estirado: el cuerpo (con la cintura) y las cuatro patas atadas a las puntas de la cruz
  lonja(c, 0.6, 0.98, 0.08, carne, [0, 0, 0], [0, 0, 0], 0.14);
  for (let i = 0; i < 7; i++) {
    const y = 0.3 - i * 0.075, l = 0.22 - Math.abs(i - 3) * 0.02;
    tramo(c, [-l, y], [l, y - 0.01], 0.035, 0.012, 0.012, marca);
  }
  // el espinazo, al medio
  tramo(c, [0, 0.42], [0, -0.42], 0.03, 0.022, 0.02, marca, 7);
  for (const [s, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const a = [s * 0.2, sy * 0.3], b = [s * 0.46, sy * 0.46];
    tramo(c, a, b, 0.0, 0.07, 0.04, carne[1], 7);
    tramo(c, b, [s * 0.52, sy * 0.48], 0.0, 0.03, 0.025, hueso, 5);
  }
  for (const y of [0.47, -0.47]) for (const s of [-1, 1]) tramo(c, [s * 0.5, y], [s * 0.51, y], 0.0, 0.008, 0.008, '#3a3632', 4);
  return c.geometria();
}
// Los leños que arden en el lecho (carbonizados)
function geoLenos() {
  const c = new Constructor();
  for (const [x, z, ry, l] of [[-0.12, 0.05, 0.4, 0.7], [0.14, -0.04, -0.7, 0.62], [0.0, 0.14, 1.6, 0.55]]) {
    cil(c, [x, 0.07, z], 0.06, 0.065, l, '#2a1e16', [PI / 2, ry, 0], 7, 0, 0.12);
  }
  return c.geometria();
}
// Los chorizos en la parrilla (n de 4)
function geoChorizos(n) {
  const c = new Constructor();
  for (let i = 0; i < n; i++) cil(c, [(i - (n - 1) / 2) * 0.16, 0.03, 0], 0.028, 0.028, 0.34, i % 2 ? '#7a2e22' : '#8a3424', [PI / 2, 0, 0], 7);
  return c.geometria();
}
// Las ollas de la cocina a leña
function geoOlla(tipo) {
  const c = new Constructor();
  if (tipo === 'dulce') {
    cil(c, [0, 0.08, 0], 0.15, 0.13, 0.16, '#b86a3a', [0, 0, 0], 12);   // la de cobre
    cil(c, [0, 0.165, 0], 0.152, 0.152, 0.012, '#c88a5a', [0, 0, 0], 12);
    cj(c, [0.24, 0.13, 0], [0.18, 0.02, 0.03], '#4a3a2a');
    cj(c, [0.02, 0.22, 0.04], [0.02, 0.2, 0.02], '#7a5a3a', [0.3, 0, 0.2], 0);   // la cuchara de madera
  } else if (tipo === 'jarro') {
    cil(c, [0, 0.08, 0], 0.09, 0.09, 0.16, '#d8d4c8', [0, 0, 0], 10);
    cil(c, [0, 0.155, 0], 0.085, 0.085, 0.01, '#5a3424', [0, 0, 0], 10);
    c.agregar(new THREE.TorusGeometry(0.045, 0.012, 5, 10, PI), { color: '#d8d4c8', tipo: 4, variar: 0.02, matriz: matriz([0.1, 0.09, 0], [0, 0, -PI / 2]) });
  } else {
    cil(c, [0, 0.12, 0], 0.2, 0.18, 0.24, '#2e2c2a', [0, 0, 0], 12);   // la grande, negra
    cil(c, [0, 0.25, 0], 0.205, 0.205, 0.02, '#3a3834', [0, 0, 0], 12);
    cil(c, [0, 0.28, 0], 0.03, 0.03, 0.04, '#4a4642', [0, 0, 0], 6);
    for (const s of [-1, 1]) cj(c, [s * 0.22, 0.2, 0], [0.04, 0.03, 0.08], '#2e2c2a');
  }
  return c.geometria();
}
// La tapa de la boca del horno y la pala apoyada
function geoTapaHorno() {
  const c = new Constructor();
  cj(c, [0, 0, 0], [0.4, 0.34, 0.04], '#6b5238', [0.08, 0, 0], 0);
  cj(c, [0, 0.0, 0.03], [0.06, 0.06, 0.04], '#4a3b2c', [0, 0, 0], 0);
  cj(c, [0.5, -0.3, 0.05], [0.04, 1.3, 0.025], '#7a5a3a', [0.0, 0, -0.32], 0);
  cj(c, [0.74, 0.42, 0.05], [0.2, 0.26, 0.02], '#8a6a48', [0.0, 0, -0.32], 0);   // (la pala, apoyada al costado de la boca)
  return c.geometria();
}
// Las brasas: el color de cada vértice entre la ceniza y el rojo vivo (fijo por posición: siempre igual)
function conBrasas(g, borde = 0) {
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  const ceniza = new THREE.Color('#2a1c16'), rojo = new THREE.Color('#b8361a'), vivo = new THREE.Color('#ff9a40'), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), k = Math.abs(Math.sin(x * 37.1 + y * 53.7) * 43758.5) % 1, r = Math.hypot(x, y);
    c.copy(ceniza).lerp(rojo, Math.min(1, Math.max(0, k - 0.25) * 1.6)).lerp(vivo, Math.max(0, k - 0.72) * 2.8);
    if (borde > 0) c.lerp(ceniza, Math.min(1, Math.max(0, (r / borde - 0.7) * 2.5)));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
function geoBrasas(r) { return conBrasas(new THREE.RingGeometry(0.001, r, 22, 5), r); }
// La boca del horno encendida: el arco (rectángulo abajo, medio círculo arriba), con el fuego adentro
function geoBocaHorno() {
  const a = new THREE.PlaneGeometry(0.33, 0.15, 4, 2); a.translate(0, -0.075, 0);
  const b = new THREE.CircleGeometry(0.165, 12, 0, PI);
  const pos = [...a.toNonIndexed().attributes.position.array, ...b.toNonIndexed().attributes.position.array];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return conBrasas(g);
}
// Las llamas (un manojo de conos)
function geoLlamas() {
  const g = new Constructor();
  for (const [x, z, h, r] of [[0, 0, 0.62, 0.17], [0.16, 0.08, 0.46, 0.12], [-0.15, 0.06, 0.5, 0.13], [0.05, -0.15, 0.4, 0.1], [-0.08, -0.1, 0.34, 0.09]]) {
    g.agregar(new THREE.ConeGeometry(r, h, 6), { color: '#ffffff', tipo: 4, variar: 0, matriz: matriz([x, h / 2, z]) });
  }
  return g.geometria();
}

// ---------------------------------------------------------------- la alacena
// Una pieza de la alacena (en x, y, z del mueble)
function piezaAlacena(c, it, cx, y, z) {
  if (it.forma === 'frasco') {
    cil(c, [cx, y + 0.07, z], 0.042, 0.042, 0.13, it.color, [0, 0, 0], 8);
    cil(c, [cx, y + 0.145, z], 0.045, 0.045, 0.025, '#d8c8a0', [0, 0, 0], 8);
    cj(c, [cx, y + 0.165, z], [0.07, 0.01, 0.07], '#c84a3a', [0, 0.6, 0]);   // la tela de la tapa
  } else if (it.forma === 'jarra') {
    cil(c, [cx, y + 0.08, z], 0.045, 0.05, 0.16, '#d8d4c8', [0, 0, 0], 8);
    cil(c, [cx, y + 0.155, z], 0.042, 0.042, 0.01, it.color, [0, 0, 0], 8);
  } else if (it.forma === 'paquete') {
    cj(c, [cx, y + 0.1, z], [0.1, 0.2, 0.08], it.color);
    cj(c, [cx, y + 0.205, z], [0.1, 0.02, 0.06], '#b8a882');
  } else if (it.forma === 'pan') {
    bola(c, [cx, y + 0.06, z], 0.085, it.color, [1.1, 0.65, 0.8]);
  } else if (it.forma === 'empanada') {
    bola(c, [cx, y + 0.025, z], 0.055, it.color, [1, 0.45, 0.65]);
  } else if (it.forma === 'fuente') {
    cil(c, [cx, y + 0.015, z], 0.13, 0.11, 0.03, '#d8d0c0', [0, 0, 0], 10);
    bola(c, [cx, y + 0.05, z], 0.09, it.color, [1.2, 0.45, 0.8]);
    cj(c, [cx, y + 0.075, z], [0.2, 0.01, 0.15], '#e8e0d0', [0.1, 0.3, 0]);   // el repasador encima
  } else if (it.forma === 'olla') {
    cil(c, [cx, y + 0.08, z], 0.1, 0.09, 0.16, '#3a3632', [0, 0, 0], 10);
    cil(c, [cx, y + 0.165, z], 0.102, 0.102, 0.012, '#4a4642', [0, 0, 0], 10);
  }
}
const ANCHO_PIEZA = { fuente: 0.27, olla: 0.22, pan: 0.18, paquete: 0.115, empanada: 0.11, frasco: 0.095, jarra: 0.1 };
// Arma lo de adentro según `lista` (alacenaDe): arriba los frascos y las jarras, al medio los paquetes, abajo los panes
// y las empanadas, y en el bajomesada las fuentes y las ollas. Cada estante tiene dos filas (atrás y adelante).
// Primero va una de cada cosa (así todo lo que hay se ve) y después las demás, hasta llenar. Una sola geometría.
function geoAlacena(lista) {
  const c = new Constructor();
  const A = ALACENA, ancho = A.ancho - 0.1;
  const estantes = [A.base, ...A.estantes];   // 0: el bajomesada, 1: abajo, 2: al medio, 3: arriba
  const filaDe = (f) => (f === 'frasco' || f === 'jarra' ? 3 : f === 'paquete' ? 2 : f === 'pan' || f === 'empanada' ? 1 : 0);
  estantes.forEach((y, fi) => {
    const items = lista.filter((x) => filaDe(x.forma) === fi);
    if (!items.length) return;
    // las piezas en orden: una de cada una, después la segunda de cada una, etc. (hasta 3)
    const piezas = [];
    for (let k = 0; k < 3; k++) for (const it of items) if (it.n > k) piezas.push(it);
    const lineas = [{ z: -0.07, x: -ancho / 2 }, { z: 0.07, x: -ancho / 2 }];
    let l = 0;
    for (const it of piezas) {
      const w = ANCHO_PIEZA[it.forma] || 0.1;
      if (lineas[l].x + w > ancho / 2) { l++; if (l >= lineas.length) break; }
      const L = lineas[l];
      piezaAlacena(c, it, L.x + w / 2, y, L.z);
      L.x += w + 0.012;
    }
  });
  return c.geometria();
}

// Qué tan tostada está la carne (0 recién puesta … 3 a punto): por el paso y lo que falta de él
function tonoDe(c) {
  const rc = c && RECETA_PASOS[c.receta];
  if (!rc?.enCruz || c.paso < rc.enCruz) return 0;
  const espera = rc.pasos[c.paso - 1]?.espera || 1;
  return Math.max(0, Math.min(3, (c.paso - rc.enCruz) * 2 + (c.falta < espera / 2 ? 1 : 0)));
}
// ---------------------------------------------------------------- el mundo
// `ctx`: T, escena, mat (el de las estructuras), cocina() (cocina-juego), progreso(), camara() (la posición), noche(),
// viento(), perro() (para el chorizo en la boca), jugador().
export function crearCocinaMundo(ctx) {
  const { escena, mat } = ctx;
  const raiz = new THREE.Group();
  raiz.name = 'cocina-mundo';
  escena.add(raiz);
  // los materiales propios: el fuego (sumado), las brasas y el humo
  const matFuego = new THREE.MeshBasicMaterial({ color: '#ff9a3a', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
  const matBrasas = new THREE.MeshBasicMaterial({ color: '#ffffff', vertexColors: true, fog: true });   // (el color de cada brasa va en los vértices; el del material, el pulso)
  const matHumo = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uColor: { value: new THREE.Color('#a29e98') }, uLuz: { value: new THREE.Color(1, 1, 1) }, uOpacidad: { value: 0.42 } }]),
    fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute float aVida; attribute float aPeso;
      varying float vVida; varying float vPeso;
      void main() {
        vVida = aVida; vPeso = aPeso;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        // (las de poco peso, el vapor de la olla o el humito de las brasas ahogadas, son chicas: se ven de cerca)
        float chica = step(aPeso, 0.45);
        gl_PointSize = (0.5 + 2.8 * aVida) * (300.0 / -mvPosition.z) * step(0.001, aPeso) * mix(1.0, 0.22, chica);
        // pegada a la cámara se borra (no tapa la vista)
        vPeso *= mix(smoothstep(2.0, 6.0, -mvPosition.z), smoothstep(0.5, 1.4, -mvPosition.z), chica);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uColor; uniform vec3 uLuz; uniform float uOpacidad;
      varying float vVida; varying float vPeso;
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float r = length(q);
        if (r > 0.5) discard;
        float a = smoothstep(0.5, 0.1, r) * uOpacidad * vPeso * smoothstep(0.0, 0.12, vVida) * (1.0 - smoothstep(0.55, 1.0, vVida));
        gl_FragColor = vec4(uColor * uLuz, a);
        #include <fog_fragment>
      }`,
  });
  // el humo: una nube de puntos para todas las estaciones
  const geoH = new THREE.BufferGeometry();
  const posH = new Float32Array(NH * 3), vidaH = new Float32Array(NH), pesoH = new Float32Array(NH);
  const azarH = new Float32Array(NH).map((_, i) => ((i * 0.6180339887) % 1));
  for (let i = 0; i < NH; i++) vidaH[i] = azarH[(i * 7) % NH];
  geoH.setAttribute('position', new THREE.BufferAttribute(posH, 3));
  geoH.setAttribute('aVida', new THREE.BufferAttribute(vidaH, 1));
  geoH.setAttribute('aPeso', new THREE.BufferAttribute(pesoH, 1));
  const humo = new THREE.Points(geoH, matHumo);
  humo.frustumCulled = false;
  humo.renderOrder = 3;
  raiz.add(humo);
  // la luz del fuego (una, en la estación encendida más cercana)
  const luz = new THREE.PointLight(0xff8a3a, 0, 9, 1.6);
  luz.position.set(0, -500, 0);
  raiz.add(luz);
  registrarLuz(luz);

  // las semillas: una malla de cada material propio, para que se compilen en la carga (después se sacan)
  let semillas = new THREE.Group();
  {
    const g = new THREE.BoxGeometry(0.01, 0.01, 0.01);
    for (const m of [matFuego, matBrasas]) { const s = new THREE.Mesh(g, m); s.frustumCulled = false; semillas.add(s); }
    const p = jugadorPos();
    semillas.position.set(p.x, p.y - 30, p.z);
    escena.add(semillas);
  }
  function jugadorPos() { const j = ctx.jugador?.(); return j?.pos ? { x: j.pos.x, y: j.pos.y, z: j.pos.z } : { x: 0, y: 0, z: 0 }; }
  function trasCompilar() {
    if (!semillas) return;
    semillas.parent?.remove(semillas);
    semillas.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
    semillas = null;
  }

  // geometrías compartidas (se arman una vez, cuando hacen falta)
  const geos = {};
  const geo = (k, fn) => geos[k] || (geos[k] = fn());

  // ---------------------------------------------------------------- lo de cada estación
  const props = new Map();   // obra.datos → { g, tipo, partes, firma }
  function propsDe(e) {
    let p = props.get(e.o.datos);
    if (!p) {
      const g = new THREE.Group();
      g.name = `cocina-${e.tipo}`;
      raiz.add(g);
      p = { g, tipo: e.tipo, firma: '', partes: {} };
      props.set(e.o.datos, p);
    }
    return p;
  }
  function quitar(p) {
    raiz.remove(p.g);
    p.g.clear();
  }
  function malla(geom, m, pos, rot = [0, 0, 0]) {
    const x = new THREE.Mesh(geom, m);
    x.position.set(...pos); x.rotation.set(rot[0], rot[1], rot[2], 'YXZ');
    x.castShadow = m === mat; x.receiveShadow = false;
    return x;
  }
  // Rehace lo de la estación según el paso (firma: lo que se ve)
  function armar(p, e) {
    const c = e.coccion;
    const rc = c ? RECETA_PASOS[c.receta] : null;
    const firma = c ? `${c.receta}|${c.paso}|${c.robado ? 1 : 0}|${c.pausa ? 1 : 0}|${tonoDe(c)}` : '';
    if (firma === p.firma) return;
    p.firma = firma;
    p.g.clear();
    p.partes = {};
    if (!c) return;
    const fuego = !c.pausa;
    if (e.tipo === 'parrilla') {
      const B = BRASAS_PARRILLA;
      const brasas = malla(geo('brasas', () => geoBrasas(B.r * 0.92)), matBrasas, [B.x, 0.06, B.z], [-PI / 2, 0, 0]);
      brasas.visible = fuego;
      p.g.add(brasas); p.partes.brasas = brasas;
      p.g.add(malla(geo('lenos', geoLenos), mat, [B.x, 0.0, B.z]));
      const llamas = malla(geo('llamas', geoLlamas), matFuego, [B.x, 0.05, B.z]);
      llamas.visible = fuego;
      p.g.add(llamas); p.partes.llamas = llamas;
      p.partes.grande = c.paso <= 1;   // al prender, llamas altas; después, brasa
      if (rc.enCruz && c.paso >= rc.enCruz) {
        const tono = tonoDe(c);
        const k = `${rc.id === 'cordero-asador' ? 'cordero' : 'costillar'}${tono}`;
        const cc = centroCruz();
        // la carne en el plano de la cruz, del lado del fuego (se va tostando: ver tonoDe)
        const carne = malla(geo(k, () => (rc.id === 'cordero-asador' ? geoCordero(tono) : geoCostillar(tono))), mat, [cc.x, cc.y + 0.02 * Math.sin(CRUZ.inclina), cc.z + 0.05 * Math.cos(CRUZ.inclina)], [CRUZ.inclina, 0, 0]);
        p.g.add(carne); p.partes.carne = carne;
        if (rc.chorizos) {
          const n = c.robado ? 3 : 4;
          p.g.add(malla(geo(`chorizos${n}`, () => geoChorizos(n)), mat, [GRILLA.x, GRILLA.y + 0.02, GRILLA.z]));
        }
      }
    } else if (e.tipo === 'horno') {
      const boca = malla(geo('bocaHorno', geoBocaHorno), matBrasas, [0, HORNO_BOCA.y, HORNO_BOCA.z]);
      boca.visible = fuego;
      p.g.add(boca); p.partes.brasas = boca;
      if (c.paso <= 1) {
        const llamas = malla(geo('llamas', geoLlamas), matFuego, [0, HORNO_BOCA.y - 0.13, HORNO_BOCA.z - 0.04], [0, 0, 0]);
        llamas.scale.setScalar(0.45);
        p.g.add(llamas); p.partes.llamas = llamas; p.partes.chica = true;
      } else {
        p.g.add(malla(geo('tapaHorno', geoTapaHorno), mat, [0, HORNO_BOCA.y - 0.02, HORNO_BOCA.z + 0.03]));
        boca.visible = false;
      }
    } else if (e.tipo === 'cocina-lena') {
      const K = COCINA_LENA;
      const boca = malla(geo('bocaCocina', () => conBrasas(new THREE.PlaneGeometry(0.2, 0.12, 4, 2))), matBrasas, [K.boca.x, K.boca.y - 0.02, K.boca.z + 0.012]);
      boca.visible = fuego;
      p.g.add(boca); p.partes.brasas = boca;
      if (c.paso >= 2) {
        const tipo = rc.olor === 'dulce' && rc.id !== 'chocolate-caliente' ? 'dulce' : rc.id === 'chocolate-caliente' ? 'jarro' : 'grande';
        const [hx, hz] = K.hornallas[tipo === 'grande' ? 0 : 1];
        p.g.add(malla(geo(`olla-${tipo}`, () => geoOlla(tipo)), mat, [hx, K.plancha, hz]));
        p.partes.vapor = { x: hx, y: K.plancha + 0.3, z: hz };
      }
    }
  }

  // ---------------------------------------------------------------- la alacena
  const alacenas = new Map();   // obra.datos → { g, firma }
  let firmaLista = '', listaAlacena = [];
  function armarAlacena(o) {
    let a = alacenas.get(o.datos);
    if (!a) { a = { malla: null, firma: '' }; alacenas.set(o.datos, a); }
    if (a.firma === firmaLista && a.malla) return a;
    if (a.malla) { raiz.remove(a.malla); a.malla.geometry.dispose(); a.malla = null; }
    a.firma = firmaLista;
    if (!listaAlacena.length) return a;
    a.malla = new THREE.Mesh(geoAlacena(listaAlacena), mat);
    a.malla.castShadow = false; a.malla.receiveShadow = true;
    raiz.add(a.malla);
    return a;
  }

  // ---------------------------------------------------------------- el chorizo del perro
  let chorizoPerro = null, cabezaVista = null, conChorizo = false;
  function chorizoEnBoca(si) {
    conChorizo = !!si;
    const perro = ctx.perro?.();
    const cab = perro?.malla?.cabeza;
    if (!cab) return;
    if (!chorizoPerro) chorizoPerro = malla(geo('chorizoPerro', () => geoChorizos(1)), mat, [0, 0, 0]);
    if (cabezaVista !== cab) {
      chorizoPerro.parent?.remove(chorizoPerro);
      const pal = perro.malla.palito;
      if (pal) chorizoPerro.position.copy(pal.position).add(new THREE.Vector3(0, -0.03, 0));
      else chorizoPerro.position.set(0, 0.135, 0.27);
      chorizoPerro.rotation.set(0, PI / 2, 0);
      chorizoPerro.scale.setScalar(0.8);
      cab.add(chorizoPerro);
      cabezaVista = cab;
    }
    chorizoPerro.visible = conChorizo;
  }

  // ---------------------------------------------------------------- cada cuadro
  let t = 0, cadaTanto = 99, estado = [], refrescarYa = true;
  function refrescar() { refrescarYa = true; }
  function actualizar(dt) {
    t += dt;
    cadaTanto += dt;
    const cam = ctx.camara?.();
    if (!cam) return;
    if (refrescarYa || cadaTanto > 0.5) {
      cadaTanto = 0; refrescarYa = false;
      estado = ctx.cocina?.()?.estadoMundo?.() || [];
      const vivos = new Set(estado.map((e) => e.o.datos));
      for (const [d, p] of props) if (!vivos.has(d)) { quitar(p); props.delete(d); }
      // la alacena: lo que hay
      const lista = alacenaDe(ctx.progreso());
      const firma = lista.map((x) => `${x.id}:${Math.min(4, x.n)}`).join(',');
      if (firma !== firmaLista) { firmaLista = firma; listaAlacena = lista; }
      const obrasAlacena = (ctx.obras?.()?.obras || []).filter((o) => o.plano.id === 'alacena' && o.datos.etapas >= o.plano.etapas.length);
      const vivasA = new Set(obrasAlacena.map((o) => o.datos));
      for (const [d, a] of alacenas) if (!vivasA.has(d)) { if (a.malla) { raiz.remove(a.malla); a.malla.geometry.dispose(); } alacenas.delete(d); }
      for (const o of obrasAlacena) {
        const cerca = Math.hypot(o.datos.x - cam.x, o.datos.z - cam.z) < VER_ALACENA;
        const a = cerca ? armarAlacena(o) : alacenas.get(o.datos);
        if (a?.malla) {
          a.malla.visible = cerca;
          a.malla.position.copy(o.grupo.position); a.malla.rotation.y = o.grupo.rotation.y;
        }
      }
      if (conChorizo) chorizoEnBoca(true);
    }
    // las estaciones: lo de cada una, el fuego que tiembla, la luz y el humo
    let mejor = null, dLuz = 30, k = 0;
    const noche = ctx.noche?.() ?? 0, viento = ctx.viento?.() ?? 0.3;
    for (const e of estado) {
      const p = propsDe(e);
      const d = Math.hypot(e.o.datos.x - cam.x, e.o.datos.z - cam.z);
      const cerca = d < VER;
      p.g.visible = cerca && !!e.coccion;
      if (cerca) {
        armar(p, e);
        p.g.position.copy(e.o.grupo.position); p.g.rotation.y = e.o.grupo.rotation.y;
        if (p.partes.llamas?.visible) {
          const alto = p.partes.chica ? 0.45 : p.partes.grande ? 1 : 0.45;
          p.partes.llamas.scale.set(alto * (0.92 + Math.sin(t * 11) * 0.06), alto * (0.85 + Math.sin(t * 17.3) * 0.12 + Math.sin(t * 6.1) * 0.06), alto * (0.92 + Math.cos(t * 9.7) * 0.06));
          matFuego.opacity = 0.75 + Math.sin(t * 13) * 0.1;
        }
      }
      if (e.coccion && !e.coccion.pausa) {
        matBrasas.color.setRGB(1, 0.36 + Math.sin(t * 4.3) * 0.06, 0.1);
        if (d < dLuz) { dLuz = d; mejor = e; }
      }
      // el humo: las bocanadas se reparten entre las estaciones encendidas, por cuánto humo echa cada una. La parrilla, una
      // columna alta (se ve de lejos); el horno, por el respiradero; la cocina a leña, por el caño (afuera, arriba del
      // techo) y, con la olla puesta, un vapor bajito que no pasa de la olla
      if (e.humo.humo > 0 && d < 260) {
        const r = e.o.grupo.rotation.y, base = e.o.grupo.position;
        const pausa = e.coccion.pausa;
        const emisores = e.tipo === 'parrilla' ? [[BRASAS_PARRILLA.x, 0.6, BRASAS_PARRILLA.z, Math.round(26 * e.humo.humo), 7, 0.16, 1]]
          : e.tipo === 'horno' ? [[0.16, 1.3, -0.18, 10, 4, 0.22, 0.7]]
          : [[COCINA_LENA.caño.x, COCINA_LENA.plancha + 2.25, COCINA_LENA.caño.z, 8, 4, 0.22, 0.7], ...(p.partes.vapor && e.coccion.paso >= 2 ? [[p.partes.vapor.x, p.partes.vapor.y - 0.1, p.partes.vapor.z, 6, 0.7, 0.45, 0.4]] : [])];
        for (const [lx, ly, lz, cuantas, sube, ritmo, peso] of emisores) {
          const sx = base.x + lx * Math.cos(r) + lz * Math.sin(r), sz = base.z - lx * Math.sin(r) + lz * Math.cos(r), sy = base.y + ly;
          const bajo = sube < 2;
          for (let j = 0; j < cuantas && k < NH; j++, k++) {
            vidaH[k] += dt * ritmo;
            if (vidaH[k] > 1) vidaH[k] -= 1;
            const v = vidaH[k], az = azarH[k];
            const abre = bajo ? 0.04 + v * 0.18 : 0.12 + v * v * 1.6;
            posH[k * 3] = sx + (bajo ? v * 0.1 : v * 1.0 + v * v * 4.5) * viento + Math.sin(v * 8 + k) * abre;
            posH[k * 3 + 1] = sy + Math.max(bajo ? 0.02 : 0.2, sube * v * (1 - 0.3 * v));
            posH[k * 3 + 2] = sz + Math.cos(v * 6 + k * 1.7) * abre + (az - 0.5) * (bajo ? 0.05 : 0.2);
            pesoH[k] = pausa ? 0.35 : peso;
          }
        }
      }
    }
    for (let j = k; j < NH; j++) pesoH[j] = 0;
    humo.visible = k > 0;
    if (k > 0) {
      geoH.attributes.position.needsUpdate = true; geoH.attributes.aVida.needsUpdate = true; geoH.attributes.aPeso.needsUpdate = true;
      const l = 0.35 + (1 - noche) * 0.65;
      matHumo.uniforms.uLuz.value.setRGB(l, l * 0.98, l * 0.95);
    }
    // la luz del fuego
    if (mejor && dLuz < 30) {
      const b = mejor.o.grupo.position, r = mejor.o.grupo.rotation.y;
      const L = mejor.tipo === 'parrilla' ? { x: BRASAS_PARRILLA.x, y: 0.5, z: BRASAS_PARRILLA.z } : mejor.tipo === 'horno' ? { x: 0, y: 0.8, z: 0.9 } : { x: COCINA_LENA.boca.x, y: 0.5, z: 0.7 };
      luz.position.set(b.x + L.x * Math.cos(r) + L.z * Math.sin(r), b.y + L.y, b.z - L.x * Math.sin(r) + L.z * Math.cos(r));
      const fuerza = mejor.tipo === 'parrilla' ? (mejor.coccion.paso <= 1 ? 5 : 3) : 1.6;
      luz.intensity = fuerza * (0.35 + noche * 0.9) * (0.9 + Math.sin(t * 13) * 0.06 + Math.sin(t * 23.7) * 0.04);
    } else if (luz.intensity) { luz.intensity = 0; luz.position.set(0, -500, 0); }
  }

  // Dónde está la parrilla de los chorizos (en el mundo), adelante: para el perro
  function puntoGrilla(o) {
    const r = o.datos.rot || 0, lx = GRILLA.x, lz = GRILLA.z + 0.55;
    return { x: o.datos.x + lx * Math.cos(r) + lz * Math.sin(r), z: o.datos.z - lx * Math.sin(r) + lz * Math.cos(r) };
  }

  // Para las pruebas y F3: lo que hay dibujado
  function medir() {
    let mallas = 0, tris = 0;
    raiz.traverse((o) => { if ((o.isMesh || o.isPoints) && o.visible) { mallas++; const g = o.geometry; tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3; } });
    return { mallas, tris: Math.round(tris), humo: humo.visible ? pesoH.reduce((s, v) => s + (v > 0 ? 1 : 0), 0) : 0, luz: luz.intensity, alacenas: [...alacenas.values()].filter((a) => a.malla).length, chorizo: !!chorizoPerro?.visible };
  }

  return { actualizar, refrescar, trasCompilar, chorizoEnBoca, puntoGrilla, medir, raiz, materiales: { matFuego, matBrasas, matHumo } };
}
