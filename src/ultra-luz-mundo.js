// 4.28.0 (Ultra, A): la luz y el cielo del nivel Ultra. Todo se arma sólo cuando Ultra se prende (`sincronizar(true)`) y se desarma
// entero al apagarlo (o al bajar la calidad, también la autocalidad): con Ultra apagado no existe ningún material, textura ni programa
// de acá, y el cielo, las sombras y el postproceso son los de Alta, sin tocar.
//   · sombras: el mapa de 4096 con el borde suave ancho (cielo.sombraUltra);
//   · cielo: el mismo cielo pintado con dispersión de la atmósfera encima (otro material, otro programa: el de Alta no cambia);
//   · la escena se dibuja a un destino con textura de profundidad; de ahí salen la oclusión ambiental (a media resolución) y la
//     niebla de altura de los valles, las dos en una composición propia (la de Alta con un agregado; otro programa).
import * as THREE from 'three';
import { SOMBRA_ULTRA, AO_ULTRA, NIEBLA_VOLUMEN, nieblaDeValle, mezclaCielo } from './ultra-luz.js';
import { LAGO } from './config.js';
import { crearAliento, frioDelAire, ALIENTO } from './ultra-aliento.js';

const NL = String.fromCharCode(10);

// ------------------------------------------------------------------ el cielo con dispersión (Rayleigh, Mie y ozono, de una sola pasada)
const GLSL_CIELO_FUNCIONES = `
uniform float uUltraCielo;
float masaAireU(float c) { c = max(c, 0.0); float z = degrees(acos(min(c, 1.0))); return 1.0 / (c + 0.15 * pow(max(93.885 - z, 0.01), -1.253)); }
vec3 cieloFisicoU(vec3 d, vec3 s) {
  const vec3 TR = vec3(0.062775, 0.1458, 0.35775);
  const float TM = 0.021;
  const vec3 TO = vec3(0.03, 0.09, 0.0039);
  float mu = dot(d, s);
  float mV = masaAireU(d.y + 0.02);
  float mS = masaAireU(s.y + 0.035 + 0.2 * sqrt(max(d.y, 0.0))) * 0.9;
  float pR = 0.0597 * (1.0 + mu * mu);
  float pM = (1.0 - 0.5776) / (12.566 * pow(1.5776 - 1.52 * mu, 1.5));
  float E = 10.0 * smoothstep(-0.16, 0.02, s.y);
  vec3 tau = TR + TM + TO;
  vec3 trans = exp(-(TR + TM) * mV);
  vec3 c = (TR * pR + TM * pM * 0.35) / (TR + TM) * (1.0 - trans) * exp(-tau * mS) * E;
  c += TR / (TR + TM) * (1.0 - trans) * exp(-tau * 3.0) * E * 0.03;
  float lu = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return max(vec3(lu) + (c - vec3(lu)) * 1.6, vec3(0.0));
}
`;
// (se suma justo antes de las estrellas: abajo quedan el degradado pintado y el sol; arriba, las estrellas, la luna y las nubes pintadas)
const GLSL_CIELO_MEZCLA = `
        if (uUltraCielo > 0.001) {
          vec3 fisico = cieloFisicoU(d, uSol);
          fisico = mix(fisico, uSolColor * 2.4 + vec3(0.5, 0.42, 0.3), disco_sol * (1.0 - uNublado * 0.85));
          fisico += uSolColor * pow(ds, 900.0) * 5.0 * (1.0 - uNublado);
          col = mix(col, fisico, uUltraCielo * smoothstep(-0.08, 0.02, h));
        }
`;

// ------------------------------------------------------------------ la oclusión ambiental (a media resolución, de la profundidad sola)
const VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const FRAG_AO = `
  uniform sampler2D uProf;
  uniform mat4 uProyInv;
  uniform vec2 uTexel;
  uniform float uRadio;
  uniform float uEscalaProy;
  uniform float uAspecto;
  uniform float uIntensidad;
  uniform float uLejosAO;
  varying vec2 vUv;
  vec3 posVista(vec2 uv) { float d = texture2D(uProf, uv).r; vec4 p = uProyInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
  void main() {
    float d0 = texture2D(uProf, vUv).r;
    if (d0 >= 0.999999) { gl_FragColor = vec4(1.0); return; }
    vec3 P = posVista(vUv);
    float z = -P.z;
    if (z > uLejosAO) { gl_FragColor = vec4(1.0); return; }
    // la normal sale de la profundidad: de cada lado, el vecino más parecido (así los bordes no inventan una pared)
    vec3 pr = posVista(vUv + vec2(uTexel.x, 0.0)), pl = posVista(vUv - vec2(uTexel.x, 0.0));
    vec3 pu = posVista(vUv + vec2(0.0, uTexel.y)), pd = posVista(vUv - vec2(0.0, uTexel.y));
    vec3 dx = abs(pr.z - P.z) < abs(P.z - pl.z) ? pr - P : P - pl;
    vec3 dy = abs(pu.z - P.z) < abs(P.z - pd.z) ? pu - P : P - pd;
    vec3 n = normalize(cross(dx, dy));
    float rP = uRadio * uEscalaProy / z;
    if (rP < uTexel.y * 1.5) { gl_FragColor = vec4(1.0); return; }
    rP = min(rP, 0.09);
    // ruido entrelazado: cada píxel gira el abanico de muestras (la composición lo promedia con sus vecinos)
    float a0 = 6.2831853 * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float suma = 0.0;
    float r2 = uRadio * uRadio;
    for (int i = 0; i < ${AO_ULTRA.muestras}; i++) {
      float t = (float(i) + 0.5) / ${AO_ULTRA.muestras}.0;
      float a = a0 + float(i) * 2.3999632;
      vec2 o = vec2(cos(a) / uAspecto, sin(a)) * rP * sqrt(t);
      vec3 v = posVista(vUv + o) - P;
      float vv = dot(v, v);
      suma += max(dot(v, n) - 0.04 * uRadio, 0.0) / (vv + 0.01) * (1.0 - smoothstep(r2, r2 * 4.0, vv));
    }
    float ao = max(0.0, 1.0 - uIntensidad * suma * uRadio / ${AO_ULTRA.muestras}.0);
    ao = mix(ao, 1.0, smoothstep(uLejosAO * 0.55, uLejosAO, z));
    gl_FragColor = vec4(ao, ao, ao, 1.0);
  }
`;

// ------------------------------------------------------------------ la niebla volumétrica (a media resolución, marchando por el rayo)
// Capas de niebla con ruido 3D que el viento arrastra despacio, más espesa abajo (los valles, el lago al amanecer) y entre los árboles
// (el mapa del bosque del terreno); el sol entra con su mapa de sombras (los rayos entre las copas y por las ventanas) y las luces
// cercanas (la linterna, los faroles, el fuego) la iluminan de noche. Sale el color que suma la niebla (rgb) y lo que deja pasar (a).
const LUCES_NIEBLA = 6;
const FRAG_NIEBLA = `
  precision highp sampler2DShadow;
  uniform sampler2D uProf;
  uniform sampler2D uBosque;
  uniform sampler2DShadow uSombra;
  uniform mat4 uSombraMat;
  uniform float uHaySombra;
  uniform mat4 uProyInv;
  uniform mat4 uCamMundo;
  uniform vec3 uCamPos;
  uniform float uTiempo;
  uniform vec2 uViento;
  uniform float uDens;
  uniform float uAlto;
  uniform float uBase;
  uniform float uMax;
  uniform float uBosqueK;
  uniform float uPolvo;
  uniform float uInterior;
  uniform float uManana;
  uniform vec3 uLago;
  uniform float uLagoDens;
  uniform vec3 uColorAmb;
  uniform vec3 uSolCol;
  uniform vec3 uSolDir;
  uniform vec3 uLuzPos[${LUCES_NIEBLA}];
  uniform vec3 uLuzCol[${LUCES_NIEBLA}];
  uniform vec3 uLuzDir[${LUCES_NIEBLA}];
  uniform float uLuzCos[${LUCES_NIEBLA}];
  uniform float uLuzRad[${LUCES_NIEBLA}];
  uniform float uLargo;
  varying vec2 vUv;
  float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float ruido3(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y);
    float b = mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y);
    return mix(a, b, f.z);
  }
  float densidad(vec3 p) {
    vec3 q = p * vec3(0.022, 0.06, 0.022) + vec3(uViento.x, 0.0, uViento.y) * uTiempo * 0.012;
    float n = ruido3(q) * 0.62 + ruido3(q * 2.9 + vec3(5.2, 1.3, 7.7) - vec3(uViento.x, 0.0, uViento.y) * uTiempo * 0.01) * 0.38;
    float capas = smoothstep(0.28, 0.78, n);
    float bosque = texture2D(uBosque, (p.xz + 512.0) / 1024.0).r;
    float alt = exp(-max(p.y - uBase, -8.0) / uAlto);
    float d = uDens * alt * mix(0.12, 1.9, capas) * (1.0 + bosque * uBosqueK);
    // el polvo y la humedad del aire del bosque (lo que hace visibles los rayos), a la altura de las copas
    d += uPolvo * (0.2 + bosque) * mix(0.6, 1.3, capas) * exp(-max(p.y - uBase - 25.0, 0.0) / 30.0);
    // adentro de una casa, el polvo del aire (los rayos que entran por las ventanas)
    d += uInterior * 0.035 * mix(0.7, 1.2, capas);
    // los bancos de niebla sobre el lago y la orilla al amanecer: bajos y en jirones
    float lago = 1.0 - smoothstep(uLago.z * 0.55, uLago.z * 1.15, length(p.xz - uLago.xy));
    d += uLagoDens * uManana * lago * exp(-max(p.y - 0.3, 0.0) / 4.5) * mix(0.15, 1.6, smoothstep(0.35, 0.75, n));
    return d;
  }
  float sombraSol(vec3 p) {
    if (uHaySombra < 0.5) return 1.0;
    vec4 s = uSombraMat * vec4(p, 1.0);
    vec3 c = s.xyz / s.w;
    if (c.x <= 0.0 || c.x >= 1.0 || c.y <= 0.0 || c.y >= 1.0 || c.z >= 1.0) return 1.0;
    return texture(uSombra, vec3(c.xy, c.z - 0.0015));
  }
  void main() {
    float d = texture2D(uProf, vUv).r;
    vec4 pv = uProyInv * vec4(vUv * 2.0 - 1.0, min(d, 0.99999) * 2.0 - 1.0, 1.0);
    vec3 pw = (uCamMundo * vec4(pv.xyz / pv.w, 1.0)).xyz;
    vec3 rayo = pw - uCamPos;
    float L = length(rayo);
    vec3 dir = rayo / max(L, 1e-3);
    if (d >= 0.999999) L = 1500.0;
    float Lm = min(L, uLargo);
    float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float mu = dot(dir, uSolDir);
    float fase = 0.32 + 2.4 * pow(max(mu, 0.0), 6.0) + 0.5 * pow(max(mu, 0.0), 2.0);
    vec3 S = vec3(0.0);
    float Tr = 1.0;
    float tPrev = 0.0;
    const int PASOS = 7;
    for (int i = 0; i < PASOS; i++) {
      float u1 = (float(i) + 1.0) / float(PASOS);
      float t1 = Lm * u1 * u1;
      float tm = mix(tPrev, t1, jit);
      float dt = t1 - tPrev;
      tPrev = t1;
      vec3 p = uCamPos + dir * tm;
      float den = densidad(p);
      if (den < 1e-6) continue;
      vec3 luz = uColorAmb * (1.0 - 0.8 * uInterior) + uSolCol * fase * sombraSol(p);
      for (int k = 0; k < ${LUCES_NIEBLA}; k++) {
        vec3 dl = uLuzPos[k] - p;
        float d2 = dot(dl, dl);
        float r = uLuzRad[k];
        if (r <= 0.0 || d2 > r * r) continue;
        float cono = uLuzCos[k] > 0.0 ? smoothstep(uLuzCos[k], mix(uLuzCos[k], 1.0, 0.35), dot(-dl / sqrt(d2), uLuzDir[k])) : 1.0;
        luz += uLuzCol[k] * cono * (1.0 - smoothstep(r * 0.4, r, sqrt(d2))) / (d2 + 4.0);
      }
      float ext = den * dt;
      float Ts = exp(-ext);
      S += Tr * luz * (1.0 - Ts);
      Tr *= Ts;
    }
    // lo que queda más allá del tramo marchado: la niebla de altura de un tirón (sin sombras ni ruido)
    if (L > Lm) {
      float lr = L - Lm;
      float y0 = uCamPos.y + dir.y * Lm;
      float k = clamp(dir.y * lr / uAlto, -25.0, 25.0);
      float f = abs(k) > 1e-3 ? (1.0 - exp(-k)) / k : 1.0;
      float Tf = exp(-uDens * 0.9 * exp(-max(y0 - uBase, -8.0) / uAlto) * lr * f);
      S += Tr * (uColorAmb + uSolCol * fase * 0.6) * (1.0 - Tf);
      Tr *= Tf;
    }
    // lo más que tapa
    float tapa = 1.0 - Tr;
    if (tapa > uMax) { S *= uMax / tapa; Tr = 1.0 - uMax; }
    gl_FragColor = vec4(S, Tr);
  }
`;

// ------------------------------------------------------------------ lo que se suma a la composición de Alta
const GLSL_COMPONER_FUNCIONES = `
  uniform sampler2D uProf;
  uniform sampler2D uAO;
  uniform sampler2D uNieblaTex;
  uniform mat4 uProyInv;
  uniform vec2 uTexelAO;
  uniform float uAOFuerza;
  vec3 posVistaC(vec2 uv, float d) { vec4 p = uProyInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
`;
const GLSL_COMPONER_ULTRA = `
    {
      float dU = texture2D(uProf, vUv).r;
      float zU = -posVistaC(vUv, min(dU, 0.99999)).z;
      // la oclusión y la niebla, con cuatro lecturas de la media resolución que pesan según la profundidad (no se corren por los bordes)
      float aoS = 0.0, wS = 0.0;
      vec4 nS = vec4(0.0);
      for (int i = 0; i < 4; i++) {
        vec2 o = vec2((i == 0 || i == 2) ? -0.5 : 0.5, i < 2 ? -0.5 : 0.5) * uTexelAO;
        float zT = -posVistaC(vUv + o, min(texture2D(uProf, vUv + o).r, 0.99999)).z;
        float w = 1.0 / (0.02 + abs(zT - zU) / max(zU, 0.2) * 30.0);
        aoS += texture2D(uAO, vUv + o).r * w; nS += texture2D(uNieblaTex, vUv + o) * w; wS += w;
      }
      if (dU < 0.999999) c *= mix(1.0, aoS / max(wS, 1e-4), uAOFuerza);
      vec4 nieblaU = nS / max(wS, 1e-4);
      c = c * nieblaU.a + nieblaU.rgb;
    }
`;

const insertar = (texto, marca, antes, agregado) => {
  const i = texto.indexOf(marca);
  if (i < 0) throw new Error('Ultra: no se encuentra «' + marca.trim().slice(0, 40) + '»');
  return antes ? texto.slice(0, i) + agregado + texto.slice(i) : texto.slice(0, i + marca.length) + agregado + texto.slice(i + marca.length);
};

export const FRAG_NIEBLA_PARA_PRUEBAS = FRAG_NIEBLA;
export function fragmentoCieloUltra(base) {
  let f = insertar(base, 'varying vec3 vDir;' + NL + '      float hash31', true, GLSL_CIELO_FUNCIONES + NL + '      ');
  f = insertar(f, '        // estrellas' + NL, true, GLSL_CIELO_MEZCLA);
  return f;
}
export function fragmentoComponerUltra(base) {
  let f = insertar(base, '  void main() {', true, GLSL_COMPONER_FUNCIONES + NL);
  f = insertar(f, '    c += texture2D(uBrillo, vUv).rgb * uBloom;', true, GLSL_COMPONER_ULTRA);
  return f;
}

// `bocas`: () => { jugador: { x, y, z, yaw, rapido } | null, vecinos: [{ id, x, y, z, yaw }], invierno, otono } (para el aliento con frío)
export function crearUltraLuz({ renderer, escena, camara, cielo, post, T = null, bocas = null }) {
  let partes = null;
  const stats = { armados: 0, desarmados: 0 };
  const plano = new THREE.Scene(), camPlana = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  plano.add(quad);
  const solN = new THREE.Vector3(), tmpV = new THREE.Vector3(), tmpC = new THREE.Color(0.9, 0.92, 0.95);
  const BLANCO_ALIENTO = new THREE.Color(0.92, 0.94, 0.97);
  void ALIENTO;
  const medio = (w, h) => [Math.max(2, Math.floor(w / 2)), Math.max(2, Math.floor(h / 2))];

  // el mapa del bosque del terreno (dónde hay árboles), como textura: la niebla es más espesa entre los árboles
  function texturaBosque() {
    const n = Math.round(Math.sqrt(T && T.bosque ? T.bosque.length : 0));
    const datos = new Uint8Array(Math.max(1, n * n));
    if (n > 1) for (let i = 0; i < n * n; i++) datos[i] = Math.round(255 * Math.min(1, Math.max(0, T.bosque[i])));
    const t = new THREE.DataTexture(datos, Math.max(1, n), Math.max(1, n), THREE.RedFormat, THREE.UnsignedByteType);
    t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
    return t;
  }

  function armar() {
    const ancho = post.destino.width, alto = post.destino.height;
    const tipo = post.destino.texture.type;
    const destino = new THREE.WebGLRenderTarget(ancho, alto, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: tipo, depthBuffer: true,
      depthTexture: new THREE.DepthTexture(ancho, alto), samples: post.destino.samples || 0,
    });
    const [wa, ha] = medio(ancho, alto);
    const rtAO = new THREE.WebGLRenderTarget(wa, ha, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.UnsignedByteType, depthBuffer: false });
    const rtNiebla = new THREE.WebGLRenderTarget(wa, ha, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.HalfFloatType, depthBuffer: false });
    const proyInv = { value: new THREE.Matrix4() }, camMundo = { value: new THREE.Matrix4() }, camPos = { value: new THREE.Vector3() };
    const matAO = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG_AO, depthTest: false, depthWrite: false,
      uniforms: { uProf: { value: destino.depthTexture }, uProyInv: proyInv, uTexel: { value: new THREE.Vector2(1 / ancho, 1 / alto) },
        uRadio: { value: AO_ULTRA.radio }, uEscalaProy: { value: 1 }, uAspecto: { value: ancho / alto }, uIntensidad: { value: AO_ULTRA.intensidad }, uLejosAO: { value: AO_ULTRA.lejos } },
    });
    const bosque = texturaBosque();
    const lista = (n, f) => Array.from({ length: n }, f);
    const matNiebla = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG_NIEBLA, depthTest: false, depthWrite: false,
      uniforms: { uProf: { value: destino.depthTexture }, uBosque: { value: bosque }, uSombra: { value: null }, uSombraMat: { value: new THREE.Matrix4() }, uHaySombra: { value: 0 },
        uProyInv: proyInv, uCamMundo: camMundo, uCamPos: camPos, uTiempo: { value: 0 }, uViento: { value: new THREE.Vector2(0.8, 0.35) },
        uDens: { value: 0 }, uAlto: { value: 15 }, uBase: { value: 0 }, uMax: { value: 0.6 }, uBosqueK: { value: 1 }, uPolvo: { value: 0 }, uInterior: { value: 0 }, uManana: { value: 0 },
        uLago: { value: new THREE.Vector3(LAGO.x, LAGO.z, 200) }, uLagoDens: { value: NIEBLA_VOLUMEN.lago }, uColorAmb: { value: new THREE.Color() }, uSolCol: { value: new THREE.Color() },
        uSolDir: { value: new THREE.Vector3(0, 1, 0) }, uLuzPos: { value: lista(LUCES_NIEBLA, () => new THREE.Vector3()) }, uLuzCol: { value: lista(LUCES_NIEBLA, () => new THREE.Color()) },
        uLuzDir: { value: lista(LUCES_NIEBLA, () => new THREE.Vector3(0, -1, 0)) }, uLuzCos: { value: lista(LUCES_NIEBLA, () => 0) }, uLuzRad: { value: lista(LUCES_NIEBLA, () => 0) }, uLargo: { value: NIEBLA_VOLUMEN.largo } },
    });
    const base = post.materialComponer;
    const matComponer = new THREE.ShaderMaterial({
      vertexShader: base.vertexShader, fragmentShader: fragmentoComponerUltra(base.fragmentShader), depthTest: false, depthWrite: false,
      uniforms: { ...base.uniforms,
        uProf: { value: destino.depthTexture }, uAO: { value: rtAO.texture }, uNieblaTex: { value: rtNiebla.texture }, uProyInv: proyInv,
        uTexelAO: { value: new THREE.Vector2(1 / wa, 1 / ha) }, uAOFuerza: { value: AO_ULTRA.fuerza } },
    });
    const matCielo = new THREE.ShaderMaterial({
      uniforms: { ...cielo.material.uniforms, uUltraCielo: { value: 0 } },
      vertexShader: cielo.material.vertexShader, fragmentShader: fragmentoCieloUltra(cielo.material.fragmentShader),
      side: cielo.material.side, depthWrite: false, fog: false,
    });
    const aliento = crearAliento({ escena, renderer, camara });
    partes = { destino, rtAO, rtNiebla, bosque, matAO, matNiebla, matComponer, matCielo, cieloBase: cielo.material, luces: null, aliento, tUlt: 0 };
    cielo.malla.material = matCielo;
    cielo.sombraUltra(SOMBRA_ULTRA);
    cielo.ponerNieveUltra?.(true);   // la sombra de la nieve, celeste pálido (no el azul hondo de Alta)
    renderer.shadowMap.needsUpdate = true;
    post.ponerUltra(api);
    // los cuatro programas nuevos se compilan acá (al prender Ultra en el menú o al cargar), nunca a mitad de juego
    const previo = renderer.getRenderTarget();
    try {
      quad.material = matAO; renderer.setRenderTarget(rtAO); renderer.compile(plano, camPlana);
      quad.material = matNiebla; renderer.setRenderTarget(rtNiebla); renderer.compile(plano, camPlana);
      quad.material = matComponer; renderer.setRenderTarget(null); renderer.compile(plano, camPlana);
      renderer.setRenderTarget(destino); renderer.compile(cielo.malla, camara, escena);
    } catch { /* sin compile: se arman en el primer cuadro */ } finally { renderer.setRenderTarget(previo); }
    stats.armados++;
  }

  function desarmar() {
    const p = partes;
    partes = null;
    post.ponerUltra(null);
    cielo.malla.material = p.cieloBase;
    cielo.sombraUltra(null);
    cielo.ponerNieveUltra?.(false);
    renderer.shadowMap.needsUpdate = true;
    p.destino.depthTexture?.dispose(); p.destino.dispose(); p.rtAO.dispose(); p.rtNiebla.dispose(); p.bosque.dispose();
    p.matAO.dispose(); p.matNiebla.dispose(); p.matComponer.dispose(); p.matCielo.dispose();
    p.aliento.desarmar();
    stats.desarmados++;
  }

  // prende o apaga lo de Ultra (`pedido` = ultraPedido(...)); devuelve si quedó prendido
  function sincronizar(pedido) {
    if (pedido && !partes) armar();
    else if (!pedido && partes) desarmar();
    return !!partes;
  }

  // las luces que three ve de verdad (el presupuesto fijo de luces.js: cuatro puntuales y la linterna): la niebla las toma de ahí
  function lucesDeLaEscena() {
    const g = escena.getObjectByName && escena.getObjectByName('presupuesto-luces');
    return g ? g.children.filter((l) => l.isPointLight || l.isSpotLight).slice(0, LUCES_NIEBLA) : [];
  }

  // por cuadro, después de cielo.actualizar: lo que sigue a la hora, al clima y a la cámara
  function actualizar(pedido, luz, clima, horas) {
    if (!sincronizar(pedido)) return false;
    const p = partes;
    const solY = luz && luz.solDir ? luz.solDir.y : 1, nub = clima ? clima.nublado || 0 : 0, lluvia = clima ? clima.lluvia || 0 : 0;
    p.matCielo.uniforms.uUltraCielo.value = mezclaCielo(solY, nub);
    const n = nieblaDeValle({ horas, lluvia, nublado: nub });
    const u = p.matNiebla.uniforms;
    u.uDens.value = n.densidad; u.uAlto.value = n.alto; u.uBase.value = n.base; u.uMax.value = n.max; u.uManana.value = n.manana;
    u.uPolvo.value = n.polvo; u.uBosqueK.value = n.bosque;
    if (escena.fog) u.uColorAmb.value.copy(escena.fog.color).multiplyScalar(NIEBLA_VOLUMEN.ambiente);
    // la luz del sol (o de la luna) que entra en la niebla: lo que deja el cielo cubierto
    u.uSolCol.value.copy(cielo.sol.color).multiplyScalar(cielo.sol.intensity * NIEBLA_VOLUMEN.sol * (1 - nub * 0.75));
    if (luz && luz.solDir && luz.solDir.y > -0.04) solN.copy(luz.solDir); else if (luz && luz.lunaDir) solN.copy(luz.lunaDir); else solN.set(0, 1, 0);
    u.uSolDir.value.copy(solN);
    u.uTiempo.value = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    const viento = 0.5 + (Number(clima && clima.vientoBase) || 0.3) + lluvia * 0.6;
    u.uViento.value.set(0.8 * viento, 0.35 * viento);
    // el aliento con frío (el tuyo y el de los vecinos cercanos)
    const ahora = u.uTiempo.value, dt = p.tUlt ? Math.min(0.1, Math.max(0, ahora - p.tUlt)) : 0;
    p.tUlt = ahora;
    const b = bocas ? bocas() : null;
    const frio = b ? frioDelAire({ invierno: b.invierno, otono: b.otono, horas, lluvia }) : 0;
    if (escena.fog) tmpC.copy(escena.fog.color).lerp(BLANCO_ALIENTO, 0.55).multiplyScalar(0.35 + 0.65 * (luz ? luz.dia : 1));
    p.aliento.actualizar(dt, frio, b ? b.jugador : null, b ? b.vecinos : null, tmpC, viento);
    // las luces cercanas
    if (!p.luces || p.luces.length === 0) p.luces = lucesDeLaEscena();
    for (let k = 0; k < LUCES_NIEBLA; k++) {
      const l = p.luces[k];
      if (!l || !(l.intensity > 0) || !l.visible) { u.uLuzRad.value[k] = 0; continue; }
      tmpV.setFromMatrixPosition(l.matrixWorld);
      u.uLuzPos.value[k].copy(tmpV);
      u.uLuzCol.value[k].copy(l.color).multiplyScalar(l.intensity * NIEBLA_VOLUMEN.luces);
      u.uLuzRad.value[k] = l.distance > 0 ? l.distance : 20;
      if (l.isSpotLight && l.target) {
        u.uLuzDir.value[k].setFromMatrixPosition(l.target.matrixWorld).sub(tmpV).normalize();
        u.uLuzCos.value[k] = Math.cos(l.angle);
      } else u.uLuzCos.value[k] = 0;
    }
    return true;
  }

  // dentro del dibujo del postproceso, antes de componer: la oclusión, la niebla y la composición de Ultra a la pantalla
  function componer(dst, estado, pasada) {
    const p = partes;
    camara.updateMatrixWorld();
    p.matAO.uniforms.uProyInv.value.copy(camara.projectionMatrixInverse);
    p.matAO.uniforms.uEscalaProy.value = camara.projectionMatrix.elements[5] * 0.5;
    p.matAO.uniforms.uAspecto.value = dst.width / Math.max(1, dst.height);
    p.matNiebla.uniforms.uCamMundo.value.copy(camara.matrixWorld);
    p.matNiebla.uniforms.uCamPos.value.setFromMatrixPosition(camara.matrixWorld);
    const sol = cielo.sol, mapa = sol.castShadow && sol.shadow && sol.shadow.map ? sol.shadow.map.depthTexture : null;
    p.matNiebla.uniforms.uSombra.value = mapa;
    p.matNiebla.uniforms.uHaySombra.value = mapa ? 1 : 0;
    p.matNiebla.uniforms.uInterior.value = Math.min(1, Math.max(0, (estado && estado.interior) || 0));
    if (mapa) p.matNiebla.uniforms.uSombraMat.value.copy(sol.shadow.matrix);
    pasada(p.matAO, p.rtAO);
    pasada(p.matNiebla, p.rtNiebla);
    pasada(p.matComponer, null);
  }

  function redimensionar(w, h) {
    const p = partes;
    if (!p) return;
    p.destino.setSize(w, h);
    const [wa, ha] = medio(w, h);
    p.rtAO.setSize(wa, ha); p.rtNiebla.setSize(wa, ha);
    p.matAO.uniforms.uTexel.value.set(1 / w, 1 / h);
    p.matComponer.uniforms.uTexelAO.value.set(1 / wa, 1 / ha);
  }

  const api = {
    sincronizar, actualizar, componer, redimensionar, stats,
    get activo() { return !!partes; },
    get destino() { return partes ? partes.destino : post.destino; },
  };
  return api;
}
