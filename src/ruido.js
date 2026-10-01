// Ruido simplex 2D con semilla, fbm y utilidades

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const GRAD = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
// 2.7.4: los gradientes en dos tablas planas (las mismas componentes de GRAD): leer un
// número de un arreglo tipado es más barato que buscar el par y después su elemento
const GX = new Float64Array(GRAD.map((g) => g[0])), GY = new Float64Array(GRAD.map((g) => g[1]));

export function crearRuido(seed) {
  const r = rng(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  // 2.7.4: el índice de gradiente ya reducido (perm & 7), para no enmascarar en cada vértice
  const perm8 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm8[i] = perm[i] & 7;

  // 2.7.4: la misma cuenta, paso por paso, que la de siempre (mismo orden de sumas y
  // productos): sólo cambió de dónde salen los gradientes
  function simplex(xin, yin) {
    let n0 = 0, n1 = 0, n2 = 0;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { const g = perm8[ii + perm[jj]]; t0 *= t0; n0 = t0 * t0 * (GX[g] * x0 + GY[g] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { const g = perm8[ii + i1 + perm[jj + j1]]; t1 *= t1; n1 = t1 * t1 * (GX[g] * x1 + GY[g] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { const g = perm8[ii + 1 + perm[jj + 1]]; t2 *= t2; n2 = t2 * t2 * (GX[g] * x2 + GY[g] * y2); }
    return 70 * (n0 + n1 + n2);
  }

  function fbm(x, y, octavas = 4) {
    let suma = 0, amp = 0.5, frec = 1, norm = 0;
    for (let o = 0; o < octavas; o++) {
      suma += amp * simplex(x * frec, y * frec);
      norm += amp; amp *= 0.5; frec *= 2.03;
    }
    return suma / norm;
  }

  return { simplex, fbm };
}

// 2.7.4: el texto de todo lo que decide los números del ruido (funciones y constantes).
// Entra en la huella del terreno: si algo de esto cambia, la caché de la carga no sirve.
export function fuenteRuido() {
  return [rng, crearRuido, smoothstep, String(clamp), String(lerp)].map(String).join('\n') + JSON.stringify([F2, G2, GRAD]);
}
