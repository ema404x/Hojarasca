// Post-procesado: se dibuja la escena a una textura y después se compone
// el brillo de las luces, los rayos de sol, la curva de color, la viñeta y el grano.
// 3.2: gradación pintada (sombras turquesa, luces doradas, verdes vivos; mediodía cálido,
// tarde dorada, noche azul) y rayos de sol que salen del cielo que se ve entre las copas
// (el cielo se dibuja con alfa 0: sin buffer de profundidad ni pasadas nuevas).
import * as THREE from 'three';
import { U } from './materiales.js';

const VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// Separa lo que brilla de más: es lo único que va a florecer.
// 3.2: en el alfa deja la fuente de los rayos: el cielo (alfa 0 en la escena) cerca del
// sol, con su brillo. Los troncos y las copas lo tapan: de ahí salen los haces.
const BRILLO = `
  uniform sampler2D uColor;
  uniform float uUmbral;
  uniform float uSuavidad;
  uniform vec2 uSol;
  uniform float uAspecto;
  uniform float uDia;
  uniform float uArriba;
  varying vec2 vUv;
  void main() {
    vec4 t = texture2D(uColor, vUv);
    vec3 c = t.rgb;
    float luz = max(c.r, max(c.g, c.b));
    float cielo = 1.0 - clamp(t.a, 0.0, 1.0);
    // 3.5.2: de día la nieve al sol (blanca, ancha) pasaba el umbral y florecía entera: árboles
    // nevados y laderas con un halo lechoso. Lo blanco que no es cielo necesita más luz para
    // florecer; los destellos del agua, el sol y las luces (con color, o de noche) quedan igual.
    float blanco352 = 1.0 - smoothstep(0.1, 0.35, (luz - min(c.r, min(c.g, c.b))) / max(luz, 1e-3));
    float umbral352 = uUmbral + 0.6 * blanco352 * (1.0 - cielo) * uDia;
    float f = smoothstep(umbral352, umbral352 + uSuavidad, luz);
    // 3.3: la fuente llega más lejos del sol (los huecos del dosel rara vez están justo
    // sobre él) y cae más suave; los rayos débiles se refuerzan en la composición.
    float cerca = 1.0 - smoothstep(0.0, 0.85, length((vUv - uSol) * vec2(uAspecto, 1.0)));
    float fuente = cielo * cerca * cerca * min(luz, 3.0);
    // 3.5.2: los rayos del mediodía (fuente en el borde de arriba) salían también del cielo
    // abierto: sobre un paisaje sin copas el haz era un velo parejo y los cerros del borde
    // quedaban lavados. Ahora, con la fuente arriba, sólo da luz el cielo que se ve entre algo
    // (huecos del dosel, bordes de las copas); el cielo abierto alrededor casi no.
    if (uArriba > 0.0) {
      vec2 r352 = vec2(0.025 / uAspecto, 0.025);
      float abierto352 = (texture2D(uColor, vUv + vec2(r352.x, 0.0)).a + texture2D(uColor, vUv - vec2(r352.x, 0.0)).a
        + texture2D(uColor, vUv + vec2(0.0, r352.y)).a + texture2D(uColor, vUv - vec2(0.0, r352.y)).a) * 0.25;
      fuente *= 1.0 - uArriba * smoothstep(0.5, 0.95, 1.0 - clamp(abierto352, 0.0, 1.0)) * 0.85;
    }
    gl_FragColor = vec4(c * f, fuente);
  }
`;

// Desenfoque en una dirección; se aplica dos veces, horizontal y vertical
const BORRON = `
  uniform sampler2D uColor;
  uniform vec2 uPaso;
  varying vec2 vUv;
  void main() {
    vec4 s = texture2D(uColor, vUv) * 0.227027;
    s += texture2D(uColor, vUv + uPaso * 1.3846) * 0.316216;
    s += texture2D(uColor, vUv - uPaso * 1.3846) * 0.316216;
    s += texture2D(uColor, vUv + uPaso * 3.2307) * 0.070270;
    s += texture2D(uColor, vUv - uPaso * 3.2307) * 0.070270;
    gl_FragColor = s;
  }
`;

// Rayos de sol: se estira la fuente (el cielo junto al sol) desde el sol hacia afuera.
// 3.2: la fuente es un solo canal (uCanal elige cuál): la primera pasada lee el alfa del
// brillo, la segunda el resultado de la primera. Doce muestras por pasada.
const RAYOS = `
  uniform sampler2D uColor;
  uniform vec2 uSol;
  uniform float uFuerza;
  uniform vec4 uCanal;
  varying vec2 vUv;
  void main() {
    vec2 dir = (vUv - uSol) * 0.3;
    float suma = 0.0;
    float peso = 1.0;
    float total = 0.0;
    vec2 uv = vUv;
    for (int i = 0; i < 12; i++) {
      uv -= dir * 0.0833;
      suma += dot(texture2D(uColor, uv), uCanal) * peso;
      total += peso;
      peso *= 0.92;
    }
    gl_FragColor = vec4(vec3(suma / total * uFuerza), 1.0);
  }
`;

// Composición final: color + brillo + rayos, curva filmica, paleta, viñeta y grano
const COMPONER = `
  uniform sampler2D uColor;
  uniform sampler2D uBrillo;
  uniform sampler2D uRayos;
  uniform float uBloom;
  uniform float uRayosFuerza;
  uniform vec3 uColorRayos;
  uniform float uVineta;
  uniform float uGrano;
  uniform float uTiempo;
  uniform float uNoche;
  uniform float uExposicion;
  uniform float uTarde;
  uniform float uNublado;
  uniform float uHumedad;
  uniform float uInterior;
  varying vec2 vUv;

  // curva filmica: conserva detalle en las luces sin lavar los colores
  vec3 filmico(vec3 x) {
    x = max(vec3(0.0), x - 0.004);
    return (x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06);
  }

  void main() {
    vec3 c = texture2D(uColor, vUv).rgb;
    c += texture2D(uBrillo, vUv).rgb * uBloom;
    // 3.3: los haces que salen de huecos chicos del dosel son débiles: se levantan con una
    // raíz (sqrt(r * k)) sin tocar los fuertes del cielo abierto (r > k queda igual).
    vec3 rayos33 = texture2D(uRayos, vUv).rgb;
    // 3.4: más levantados todavía (k 0.25 → 0.42): en el bosque cerrado se leen los haces
    rayos33 = max(rayos33, sqrt(rayos33 * 0.42));
    c += rayos33 * uColorRayos * uRayosFuerza;
    c *= uExposicion;
    c = filmico(c);

    // 3.2: paleta pintada (HushWood): sombras turquesa, medios de verde vivo, luces
    // doradas; la tarde entera se dora y la noche tira al azul. Un aire húmedo cuando el
    // clima lo pide.
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    // 3.4: paleta de HushWood. Los verdes no son lima: la croma muy alta de los verdes se
    // comprime, el verde amarillo gira hacia el verde hondo (menos rojo) y en la sombra
    // hacia el verde azulado (más azul). Las luces conservan el dorado.
    float verde34 = clamp((c.g - max(c.r * 0.85, c.b)) * 5.0, 0.0, 1.0) * (1.0 - uNoche);
    float croma34 = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
    c = mix(vec3(luma), c, 1.0 - smoothstep(0.2, 0.7, croma34) * (0.1 + 0.38 * verde34));
    float altas34 = smoothstep(0.42, 0.85, luma);
    c.r -= (c.r - c.b) * 0.24 * verde34 * (1.0 - altas34 * 0.4);
    c.b += (c.g - c.b) * 0.2 * verde34 * (1.0 - smoothstep(0.08, 0.5, luma));
    // el amarillo lima (mucho rojo y casi nada de azul) se corrige aparte, también al sol
    float lima34 = verde34 * smoothstep(0.55, 0.85, c.r / max(c.g, 1e-3)) * smoothstep(0.4, 0.7, (c.g - c.b) / max(c.g, 1e-3));
    c = mix(c, vec3(c.r - (c.r - c.b) * 0.32, c.g * 0.94, c.b + 0.04), lima34);
    c *= 1.0 - verde34 * 0.07 * smoothstep(0.25, 0.7, luma);
    // sombras de color (verde azulado de día, lavanda en la hora dorada), luces doradas
    vec3 sombra = mix(mix(vec3(0.84, 0.97, 1.05), vec3(0.95, 0.9, 1.08), uTarde), vec3(0.88, 0.92, 1.08), uNoche);
    vec3 media = vec3(0.99, 1.0, 1.0);
    vec3 alta = mix(vec3(1.045, 1.02, 0.95), vec3(1.1, 0.99, 0.82), uTarde);
    c *= mix(sombra, media, smoothstep(0.04, 0.42, luma));
    c *= mix(vec3(1.0), alta, smoothstep(0.4, 0.92, luma));
    // 3.4: saturación moderada (antes 1.16): el color lo dan la luz y la paleta
    c = mix(vec3(luma), c, 1.06 - uNoche * 0.06);
    c = pow(max(c, vec3(0.0)), vec3(0.97));
    c = mix(c, c * vec3(1.1, 0.99, 0.84), uTarde * 0.32);
    c = mix(c, c * vec3(0.97, 0.995, 1.03), uNublado * 0.08 + uHumedad * 0.06);
    // Dentro de una construcción el rebote se vuelve un poco más cálido y
    // comprimido, como una cámara que deja de mirar el cielo directamente.
    // 3.2: adentro, la madera y la luz de las lámparas se leen cálidas
    c = mix(c, c * vec3(1.1, 1.0, 0.84), uInterior * 0.4);
    c = mix(c, filmico(c * 1.055), uInterior * 0.055);
    // de noche el ojo pierde color y gana grano
    // 3.5.2: pero lo que brilla conserva su color (los núcleos rojos de la nodriza, las luces de
    // la nave, el fuego y los faroles se veían color durazno pálido): sólo se apaga lo tenue
    c = mix(c, vec3(dot(c, vec3(0.3, 0.59, 0.11))), uNoche * 0.42 * (1.0 - smoothstep(0.3, 0.75, max(c.r, max(c.g, c.b)))));

    // viñeta
    vec2 d = vUv - 0.5;
    float v = 1.0 - dot(d, d) * uVineta;
    c *= clamp(v, 0.0, 1.0);

    // grano fino, un poco más marcado de noche
    float g = fract(sin(dot(vUv * uTiempo, vec2(12.9898, 78.233))) * 43758.5453);
    c += (g - 0.5) * uGrano * (1.0 + uNoche * 1.6);

    gl_FragColor = vec4(c, 1.0);
  }
`;

// (el three incluido no trae Vector4: un vec4 se sube igual desde {x, y, z, w})
const CANAL_ALFA = { x: 0, y: 0, z: 0, w: 1 }, CANAL_ROJO = { x: 1, y: 0, z: 0, w: 0 };

export function crearPostproceso(renderer, escena, camara, calidad) {
  const tam = new THREE.Vector2();
  renderer.getSize(tam);
  const pr = renderer.getPixelRatio();
  const tipo = renderer.capabilities.isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const opciones = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: tipo, depthBuffer: true };
  const escala = calidad.postEscala ?? 0.5;
  const pasadasBrillo = calidad.brilloPasadas ?? 2;

  const destino = new THREE.WebGLRenderTarget(tam.x * pr, tam.y * pr, opciones);
  const medio = () => new THREE.WebGLRenderTarget(Math.max(2, Math.floor(tam.x * pr * escala)), Math.max(2, Math.floor(tam.y * pr * escala)), { ...opciones, depthBuffer: false });
  const rtBrillo = medio(), rtBorron = medio(), rtRayos = medio(), rtRayos2 = medio();

  const escenaPlana = new THREE.Scene();
  const camaraPlana = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  escenaPlana.add(quad);

  const material = (fragmentShader, uniforms) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader, uniforms, depthTest: false, depthWrite: false });

  const matBrillo = material(BRILLO, { uColor: { value: null }, uUmbral: { value: 1.0 }, uSuavidad: { value: 0.4 }, uSol: { value: new THREE.Vector2(0.5, 2.0) }, uAspecto: { value: 16 / 9 }, uDia: { value: 1 }, uArriba: { value: 0 } });
  const matBorron = material(BORRON, { uColor: { value: null }, uPaso: { value: new THREE.Vector2() } });
  const matRayos = material(RAYOS, { uColor: { value: null }, uSol: { value: new THREE.Vector2(0.5, 0.5) }, uFuerza: { value: 1 }, uCanal: { value: CANAL_ALFA } });
  const matComponer = material(COMPONER, {
    uColor: { value: null }, uBrillo: { value: null }, uRayos: { value: null },
    uBloom: { value: calidad.bloom ?? 0.55 }, uRayosFuerza: { value: 0 },
    uColorRayos: { value: new THREE.Color('#ffd28a') },
    uVineta: { value: 0.34 }, uGrano: { value: 0.012 }, uTiempo: { value: 1 },
    uNoche: { value: 0 }, uExposicion: { value: 1 },
    uTarde: { value: 0 }, uNublado: { value: 0 }, uHumedad: { value: 0 }, uInterior: { value: 0 },
  });

  // 2.7.4: cada pasada es un cuadro opaco (sin mezcla ni profundidad) que cubre toda la
  // salida: borrarla antes (lo que hace `autoClear`) no cambia ningún píxel, así que no se
  // borra. Las cuentas y su orden quedan como estaban.
  const pasada = (mat, salida) => {
    quad.material = mat;
    renderer.setRenderTarget(salida || null);
    const borrar = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(escenaPlana, camaraPlana);
    renderer.autoClear = borrar;
  };

  const solPantalla = new THREE.Vector3();
  let exposicionSuave = 1;
  let interiorSuave = 0;

  function redimensionar(ancho, alto) {
    const p = renderer.getPixelRatio();
    destino.setSize(ancho * p, alto * p);
    for (const rt of [rtBrillo, rtBorron, rtRayos, rtRayos2]) {
      rt.setSize(Math.max(2, Math.floor(ancho * p * escala)), Math.max(2, Math.floor(alto * p * escala)));
    }
    tam.set(ancho, alto);
  }

  function render(estado) {
    // 1. la escena, a una textura (2.7.4: con `autoClear` la escena ya la borra al dibujarse;
    // antes se borraba dos veces)
    // 3.2: mientras dibuja el postproceso, los materiales propios no gradúan el color
    // (lo hace la composición de abajo); dibujando directo a la pantalla, sí
    // 3.4: uGradoMat lleva además la tarde (ver cielo.js): se guarda y se devuelve igual
    renderer.setRenderTarget(destino);
    if (!renderer.autoClear) renderer.clear();
    const gradoDirecto = U.uGradoMat.value;
    U.uGradoMat.value = 0;
    renderer.render(escena, camara);
    U.uGradoMat.value = gradoDirecto;

    // 3.2: dónde está el sol en pantalla (para la fuente de los rayos del paso 2)
    let fuerzaRayos = 0;
    matBrillo.uniforms.uArriba.value = 0;   // 3.5.2: 1 cuando la fuente es el borde de arriba
    if (estado.rayos > 0 && estado.solDir) {
      solPantalla.copy(estado.solDir).multiplyScalar(900).add(camara.position).project(camara);
      const dentro = Math.abs(solPantalla.x) < 1.5 && Math.abs(solPantalla.y) < 1.5 && solPantalla.z < 1;
      if (dentro) {
        const borde = Math.max(0, 1 - Math.max(Math.abs(solPantalla.x), Math.abs(solPantalla.y)) * 0.62);
        fuerzaRayos = estado.rayos * borde * 1.2;   // 3.4: antes 0.95
      }
      // 3.5: rayos del mediodía. Con el sol alto (arriba del cuadro) no había rayos: mirando
      // de frente entre las copas, la luz no bajaba nunca. Se toma la fuente en el borde de
      // arriba, sobre la vertical del sol, y los haces bajan desde ahí entre las copas; más
      // tenues cuanto más lejos queda el sol del cuadro. Mismas pasadas.
      if (solPantalla.z < 1 && solPantalla.y >= 1.0 && Math.abs(solPantalla.x) < 1.6 + solPantalla.y * 0.3) {
        const arriba = Math.max(0, 1 - Math.max(0, solPantalla.y - 1.0) / 3.2) * Math.max(0, 1 - Math.abs(solPantalla.x) / (1.6 + solPantalla.y * 0.3));
        const fuerzaArriba = estado.rayos * 0.62 * arriba;
        if (fuerzaArriba > fuerzaRayos) {
          fuerzaRayos = fuerzaArriba;
          matBrillo.uniforms.uArriba.value = 1;
          solPantalla.x = Math.max(-1.1, Math.min(1.1, solPantalla.x / Math.max(1, solPantalla.y * 0.6)));
          solPantalla.y = 1.22;
        }
      }
    }
    if (fuerzaRayos > 0) matBrillo.uniforms.uSol.value.set(solPantalla.x * 0.5 + 0.5, solPantalla.y * 0.5 + 0.5);
    else matBrillo.uniforms.uSol.value.set(0.5, 9);
    matBrillo.uniforms.uAspecto.value = tam.x / Math.max(1, tam.y);

    // 2. lo que brilla, desenfocado dos veces
    matBrillo.uniforms.uColor.value = destino.texture;
    matBrillo.uniforms.uUmbral.value = estado.noche > 0.5 ? 0.92 : 0.92;
    matBrillo.uniforms.uDia.value = 1 - (estado.noche || 0);   // 3.5.2
    pasada(matBrillo, rtBrillo);
    // el desenfoque del brillo: dos pasadas en Alta, una en Media
    for (let i = 0; i < pasadasBrillo; i++) {
      matBorron.uniforms.uColor.value = rtBrillo.texture;
      matBorron.uniforms.uPaso.value.set(1.0 / rtBrillo.width, 0);
      pasada(matBorron, rtBorron);
      matBorron.uniforms.uColor.value = rtBorron.texture;
      matBorron.uniforms.uPaso.value.set(0, 1.0 / rtBrillo.height);
      pasada(matBorron, rtBrillo);
    }

    // 3. rayos de sol, solo si el sol está en pantalla (o apenas afuera) y de día
    if (fuerzaRayos > 0) {
      matRayos.uniforms.uSol.value.copy(matBrillo.uniforms.uSol.value);
      matRayos.uniforms.uColor.value = rtBrillo.texture;
      matRayos.uniforms.uCanal.value = CANAL_ALFA;
      matRayos.uniforms.uFuerza.value = 1;
      pasada(matRayos, rtRayos);
      matRayos.uniforms.uColor.value = rtRayos.texture;
      matRayos.uniforms.uCanal.value = CANAL_ROJO;
      pasada(matRayos, rtRayos2);
    }

    // 4. composición final a la pantalla
    const u = matComponer.uniforms;
    u.uColor.value = destino.texture;
    u.uBrillo.value = rtBrillo.texture;
    u.uRayos.value = fuerzaRayos > 0 ? rtRayos2.texture : rtBrillo.texture;
    u.uRayosFuerza.value = fuerzaRayos;
    const dt = Math.min(0.1, Math.max(1 / 240, estado.dt || 1 / 60));
    const objetivoInterior = estado.interior ?? 0;
    interiorSuave += (objetivoInterior - interiorSuave) * (1 - Math.exp(-dt * (objetivoInterior > interiorSuave ? 2.4 : 3.2)));
    // El ojo tarda un instante en acomodarse al pasar de un exterior brillante a un interior.
    const objetivoExp = (estado.exposicion ?? 1) * (1 + interiorSuave * (0.055 + (1 - estado.noche) * 0.035));
    exposicionSuave += (objetivoExp - exposicionSuave) * (1 - Math.exp(-dt * (objetivoExp > exposicionSuave ? 1.8 : 2.8)));
    u.uNoche.value = estado.noche;
    u.uTiempo.value = 1 + (estado.tiempo % 10);
    u.uExposicion.value = exposicionSuave;
    u.uTarde.value = estado.tarde ?? 0;
    u.uNublado.value = estado.nublado ?? 0;
    u.uHumedad.value = estado.humedad ?? 0;
    u.uInterior.value = interiorSuave;
    if (estado.colorSol) u.uColorRayos.value.copy(estado.colorSol);
    pasada(matComponer, null);
    renderer.setRenderTarget(null);
  }

  // 2.7.4: `destino` para compilar los programas de la escena contra el mismo tipo de salida
  return { render, redimensionar, uniforms: matComponer.uniforms, destino };
}
