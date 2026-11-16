// 4.29.0 (C): el cine de Ultra. En las cinemáticas (las escenas dirigidas de la Historia: escenas-mundo.js), con Ultra prendido, el fondo se
// desenfoca como en una película: la profundidad de campo enfoca el punto al que mira la cámara dirigida (el que habla: cada plano apunta a
// quien habla) y lo que queda más cerca o más lejos se va de foco. Sólo en Ultra y sólo en cinemáticas: fuera de ellas no se arma ni se
// dibuja nada (no hay tope de ms: es una pasada completa, pero corre sólo mientras dura la escena).
//   · `ponerCine(distancia)` (escenas-mundo.js, cada cuadro de una escena; `null` cuando no hay escena): a cuántos metros de la cámara está lo que
//     se enfoca. Es estado puro, no importa three.
//   · La pasada de desenfoque con la profundidad de la escena (three) está en ultra-cine-mundo.js, que arma ultra-luz-mundo.js junto con el resto de Ultra; acá quedan
//     el estado, la cuenta del círculo y el shader (texto), sin three, para que escenas-mundo.js (que también corre en las pruebas de Node) no lo necesite.
//     El círculo de confusión sigue una lente de verdad: crece con |z − foco| / z y baja con la distancia de enfoque (un plano general a 11 m casi
//     no desenfoca; un primer plano a 1,4 m deja el fondo bien blando). Lo que está más cerca de la cámara que el foco también se desenfoca, pero no
//     se derrama sobre lo que está nítido atrás (una muestra de adelante sólo cuenta si su propio círculo llega hasta ahí).
//   · La fuerza entra y sale de a poco (con las barras de cine) y el foco se mueve suave entre planos.

export const CINE = { distancia: null, fuerza: 0, foco: 3, ultimo: 0 };
if (typeof window !== 'undefined' && /debug=1/.test(String(window.location && window.location.search))) window.__cine = CINE;   // (QA: las capturas leen el estado)
export function ponerCine(distancia) {
  CINE.distancia = Number.isFinite(distancia) && distancia > 0.2 ? distancia : null;
}
// cuánto desenfoca a cada distancia (la misma cuenta que el shader; la usa la prueba): `k` es la apertura en píxeles a 1 m de enfoque
export function circuloCine(z, foco, k, max) {
  const c = k * Math.abs(z - foco) / Math.max(z, 0.1) / Math.max(foco, 0.3);
  return Math.min(max, c);
}
export const CINE_PARAMS = { radio: 0.021, apertura: 1.5, muestras: 28, entra: 1.1, sale: 1.6, sigue: 7 };   // radio: fracción del alto; apertura: múltiplo del radio a 1 m

export const FRAG_CINE = /* glsl */`
  uniform sampler2D uColor; uniform sampler2D uProf; uniform mat4 uProyInv; uniform vec2 uTexel;
  uniform float uFoco; uniform float uK; uniform float uMax; uniform float uFuerza;
  varying vec2 vUv;
  float zDe(vec2 uv) { float d = min(texture2D(uProf, uv).r, 0.99999); vec4 p = uProyInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return -p.z / p.w; }
  float cocDe(float z) { return min(uMax, uK * abs(z - uFoco) / max(z, 0.1) / max(uFoco, 0.3)) * uFuerza; }
  void main() {
    vec4 c0 = texture2D(uColor, vUv);
    float z0 = zDe(vUv);
    float r0 = cocDe(z0);
    if (r0 < 0.6) { gl_FragColor = c0; return; }
    vec4 acc = c0; float pesoT = 1.0;
    for (int i = 0; i < ${CINE_PARAMS.muestras}; i++) {
      float f = (float(i) + 0.5) / ${CINE_PARAMS.muestras}.0;
      float rr = sqrt(f), a = float(i) * 2.39996;
      float dist = rr * r0;
      vec2 uv = vUv + vec2(cos(a), sin(a)) * dist * uTexel;
      float zs = zDe(uv);
      float cs = cocDe(zs);
      // lo de adelante (más cerca que este píxel) sólo se derrama hasta donde llega su propio círculo: lo nítido no mancha al fondo
      float w = zs >= z0 - 0.15 ? 1.0 : clamp(cs / max(dist, 1.0), 0.0, 1.0);
      acc += texture2D(uColor, uv) * w; pesoT += w;
    }
    gl_FragColor = acc / pesoT;
  }
`;

