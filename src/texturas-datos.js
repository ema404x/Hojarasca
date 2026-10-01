// 2.7.4: los DATOS de las texturas procedurales (ver `texturas.js`), sin three. Salen
// byte por byte iguales a los de la 2.7.0: se cambió cómo se calculan, no qué. Cada
// función que cambió por dentro lo dice con su comentario 2.7.4; una prueba
// (`pruebas/verificar-2-7-4-carga.mjs`) compara el resultado con la huella de antes.
//
// Todo lo que está acá se puede copiar tal cual a un Worker: las funciones sólo se
// llaman entre ellas y con `rng`, y no tocan nada del módulo. `fuenteGenerador()`
// arma ese código con el texto de las funciones mismas (así no hay dos copias que se
// puedan desincronizar), y su huella entra en la clave de la caché de la carga.
import { rng } from './ruido.js';

// ---------------------------------------------------------------- ruido periódico
function rejilla(nx, ny, r) {
  const g = new Float32Array(nx * ny);
  for (let i = 0; i < g.length; i++) g[i] = r();
  return { g, nx, ny };
}
// ruido de valor periódico: x e y en [0,1) recorren la textura entera
// 2.7.4: la misma cuenta, más barata: el módulo de enteros se corrige con una suma en vez
// de dos `%` más, el vecino de la derecha no divide, y la mezcla de arriba (a–b) se
// calcula una sola vez (antes se calculaba dos veces, con el mismo resultado).
function valor(R, x, y) {
  const nx = R.nx, ny = R.ny;
  const fx = x * nx, fy = y * ny;
  const xi = Math.floor(fx), yi = Math.floor(fy);
  let tx = fx - xi, ty = fy - yi;
  tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
  let x0 = xi % nx; if (x0 < 0) x0 += nx;
  let y0 = yi % ny; if (y0 < 0) y0 += ny;
  const x1 = x0 + 1 === nx ? 0 : x0 + 1, y1 = y0 + 1 === ny ? 0 : y0 + 1;
  const g = R.g, f0 = y0 * nx, f1 = y1 * nx;
  const a = g[f0 + x0], b = g[f0 + x1], c = g[f1 + x0], d = g[f1 + x1];
  const ab = a + (b - a) * tx;
  return ab + ((c + (d - c) * tx) - ab) * ty;
}
function crearFbm(r, nx, ny, octavas, ganancia = 0.5) {
  const capas = [];
  for (let o = 0; o < octavas; o++) capas.push(rejilla(nx << o, ny << o, r));
  let norma = 0, amp = 1;
  for (let o = 0; o < octavas; o++) { norma += amp; amp *= ganancia; }
  // 2.7.4: el peso de cada octava (1, g, g², …) se multiplica una vez acá, en el mismo
  // orden que antes en cada llamada: son los mismos números
  const pesos = new Float64Array(octavas);
  for (let o = 0, a = 1; o < octavas; o++) { pesos[o] = a; a *= ganancia; }
  return (x, y) => {
    let s = 0;
    for (let o = 0; o < octavas; o++) s += valor(capas[o], x, y) * pesos[o];
    return s / norma;
  };
}
// celdas (Worley) periódicas: devuelve [F1, F2, id] en unidades de celda
// 2.7.4: el mismo recorrido de los nueve vecinos; la fila se envuelve una vez por fila
function crearCeldas(r, nx, ny) {
  const px = new Float32Array(nx * ny), py = new Float32Array(nx * ny), id = new Float32Array(nx * ny);
  for (let i = 0; i < nx * ny; i++) { px[i] = r(); py[i] = r(); id[i] = r(); }
  const out = [0, 0, 0];
  return (x, y) => {
    const fx = x * nx, fy = y * ny;
    const cx = Math.floor(fx), cy = Math.floor(fy);
    let f1 = 9, f2 = 9, idm = 0;
    for (let j = -1; j <= 1; j++) {
      const gy = cy + j;
      let wy = gy % ny; if (wy < 0) wy += ny;
      const fila = wy * nx;
      for (let i = -1; i <= 1; i++) {
        const gx = cx + i;
        let wx = gx % nx; if (wx < 0) wx += nx;
        const k = fila + wx;
        const dx = gx + px[k] - fx, dy = gy + py[k] - fy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < f1) { f2 = f1; f1 = d; idm = id[k]; } else if (d < f2) f2 = d;
      }
    }
    out[0] = f1; out[1] = f2; out[2] = idm;
    return out;
  };
}
const sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const suave = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// Estampa trazos cortos (hebras de pasto, fibras) en un campo periódico
function trazos(campo, lado, r, cuantos, largoMin, largoMax, anguloBase = null) {
  for (let n = 0; n < cuantos; n++) {
    const x0 = r() * lado, y0 = r() * lado;
    const ang = anguloBase === null ? r() * Math.PI * 2 : anguloBase + (r() - 0.5) * 0.9;
    const largo = largoMin + r() * (largoMax - largoMin);
    const v = r() < 0.5 ? -(0.35 + r() * 0.5) : (0.25 + r() * 0.5);
    const dx = Math.cos(ang), dy = Math.sin(ang);
    for (let s = 0; s < largo; s += 0.7) {
      const k = 1 - s / largo;   // la punta se afina
      const x = Math.round(x0 + dx * s), y = Math.round(y0 + dy * s);
      const i = ((((y % lado) + lado) % lado) * lado) + (((x % lado) + lado) % lado);
      campo[i] += v * (0.45 + 0.55 * k);
    }
  }
}

// ---------------------------------------------------------------- vegetal (256²)
function datosVegetal() {
  const L = 256, r = rng(27011);
  const d = new Uint8Array(L * L * 4);
  // corteza: placas alargadas en vertical y grietas finas
  const placas = crearFbm(r, 12, 3, 4, 0.55);
  const celdasCorteza = crearCeldas(r, 9, 2);
  const torcer = crearFbm(r, 4, 2, 3, 0.5);
  const fino = crearFbm(r, 48, 24, 2, 0.5);
  const fibras = crearFbm(r, 40, 3, 2, 0.5);
  // madera: veta larga en u, nudos ocasionales
  const veta = crearFbm(r, 2, 40, 3, 0.55);
  const onda = crearFbm(r, 3, 6, 2, 0.5);
  const nudos = crearCeldas(r, 3, 3);
  // roca: grietas de celdas, bultos y grano
  const bultos = crearFbm(r, 5, 5, 5, 0.55);
  const fisuras = crearCeldas(r, 5, 5);
  const desvio = crearFbm(r, 4, 4, 3, 0.5), desvio2 = crearFbm(r, 4, 4, 3, 0.5);
  const grano = crearFbm(r, 64, 64, 1, 0.5);
  // follaje: manojo de hojitas (celdas) con huecos oscuros
  const hojitas = crearCeldas(r, 16, 16);
  const mancha = crearFbm(r, 6, 6, 3, 0.5);
  const revuelto = crearFbm(r, 8, 8, 2, 0.5), revuelto2 = crearFbm(r, 8, 8, 2, 0.5);
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    const u = x / L, v = y / L, i = (y * L + x) * 4;
    // R corteza
    const tw = torcer(u, v) - 0.5;
    // 2.7.4: las celdas se leen por índice (sin desarmar el arreglo): los mismos valores
    const cc = celdasCorteza(u + tw * 0.06, v + tw * 0.03);
    const c1 = cc[0], c2 = cc[1], cid = cc[2];
    const surco = 1 - suave(0.0, 0.34, c2 - c1);
    const cort = sat(0.36 + 0.3 * suave(0.2, 0.8, placas(u, v)) + 0.1 * (cid - 0.5) - 0.42 * surco * surco + 0.22 * (fibras(u, v) - 0.5) + 0.05 * (fino(u, v) - 0.5));
    // G tablas (2.7.4: la onda se pide una vez; antes dos veces en el mismo punto)
    const on = onda(u, v);
    const w = veta(u + on * 0.04, v);
    const n1 = nudos(u, v)[0];
    const nudo = 1 - suave(0.0, 0.16, n1);
    const anillo = 0.5 + 0.5 * Math.sin(n1 * 90);
    const mad = sat(0.52 + 0.55 * (w - 0.5) + 0.1 * (on - 0.5) - nudo * (0.3 + 0.15 * anillo));
    // B roca
    const du = desvio(u, v) - 0.5, dv = desvio2(u, v) - 0.5;
    const fz = fisuras(u + du * 0.22, v + dv * 0.22);
    const f1 = fz[0], f2 = fz[1];
    const marca = suave(0.35, 0.7, desvio(v + 0.37, u + 0.11));
    const borde = 1 - (1 - suave(0.0, 0.06, f2 - f1)) * marca;
    const roc = sat(0.14 + 0.66 * bultos(u, v) * (0.6 + 0.4 * borde) + 0.18 * (grano(u, v) - 0.5) + 0.1 * borde);
    // A follaje
    const hz = hojitas(u + (revuelto(u, v) - 0.5) * 0.09, v + (revuelto2(u, v) - 0.5) * 0.09);
    const h1 = hz[0], h2 = hz[1], hid = hz[2];
    const hoja = suave(0.75, 0.1, h1) * (0.45 + 0.55 * hid) * suave(0.0, 0.12, h2 - h1 + 0.03);
    const fol = sat(0.18 + 0.72 * hoja + 0.2 * (mancha(u, v) - 0.5));
    d[i] = Math.round(cort * 255); d[i + 1] = Math.round(mad * 255); d[i + 2] = Math.round(roc * 255); d[i + 3] = Math.round(fol * 255);
  }
  // 2.7: relieve de corteza y roca como pendiente ya calculada (diferencias centradas,
  // repetibles). El shader la proyecta con los mismos ejes del triplanar: no usa
  // derivadas de pantalla, así no aparecen costuras en las aristas de los troncos.
  const g = new Uint8Array(L * L * 4);
  const en = (x, y, c) => d[((((y + L) % L) * L + ((x + L) % L)) * 4) + c] / 255;
  const cod = (v) => Math.round(sat(0.5 + v * 2.2) * 255);
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    const i = (y * L + x) * 4;
    g[i] = cod((en(x + 1, y, 0) - en(x - 1, y, 0)) * 0.5); g[i + 1] = cod((en(x, y + 1, 0) - en(x, y - 1, 0)) * 0.5);
    g[i + 2] = cod((en(x + 1, y, 2) - en(x - 1, y, 2)) * 0.5); g[i + 3] = cod((en(x, y + 1, 2) - en(x, y - 1, 2)) * 0.5);
  }
  return { vegetal: d, vegetalRelieve: g };
}

// ---------------------------------------------------------------- suelo (512²)
function datosSuelo() {
  const L = 512, r = rng(51207);
  const d = new Uint8Array(L * L * 4);
  const terrones = crearFbm(r, 8, 8, 5, 0.55);
  const piedritas = crearCeldas(r, 40, 40);
  const polvo = crearFbm(r, 96, 96, 1, 0.5);
  const hebras = new Float32Array(L * L);
  trazos(hebras, L, r, 26000, 3, 11);
  const matas = crearFbm(r, 10, 10, 3, 0.5);
  const bultos = crearFbm(r, 4, 4, 5, 0.55);
  const fisuras = crearCeldas(r, 6, 6);
  const fisurasFinas = crearCeldas(r, 17, 17);
  const desvioS = crearFbm(r, 5, 5, 3, 0.5), desvioS2 = crearFbm(r, 5, 5, 3, 0.5);
  const macro = crearFbm(r, 3, 3, 3, 0.5);
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    const u = x / L, v = y / L, k = y * L + x, i = k * 4;
    // R tierra: terrones y piedritas sueltas
    const pz = piedritas(u, v);
    const p1 = pz[0], pid = pz[2];
    const tamP = 0.16 + 0.3 * ((pid * 7.31) % 1);
    const piedra = pid > 0.86 ? suave(tamP, tamP * 0.45, p1) : 0;
    const rodete = pid > 0.86 ? suave(tamP * 1.5, tamP, p1) * (1 - piedra) : 0;
    // 2.7.4: el polvo se pide una vez (antes, dos veces en el mismo punto)
    const pol = polvo(u, v);
    const tierra = sat(0.36 + 0.46 * terrones(u, v) + 0.12 * piedra - 0.08 * rodete + 0.12 * (pol - 0.5));
    // G pasto / hojarasca: hebras sobre matas
    const pasto = sat(0.5 + hebras[k] * 0.32 + 0.3 * (matas(u, v) - 0.5));
    // B roca
    const du = (desvioS(u, v) - 0.5) * 0.2, dv = (desvioS2(u, v) - 0.5) * 0.2;
    const fz = fisuras(u + du, v + dv);
    const f1 = fz[0], f2 = fz[1];
    const gz = fisurasFinas(u + du * 1.6, v + dv * 1.6);
    const g1 = gz[0], g2 = gz[1];
    const marca = suave(0.3, 0.68, desvioS(v + 0.29, u + 0.61));
    const grieta = (1 - suave(0.0, 0.05, f2 - f1)) * marca + (1 - suave(0.0, 0.04, g2 - g1)) * marca * 0.4;
    const roca = sat(0.18 + 0.66 * bultos(u, v) - 0.3 * grieta + 0.08 * (pol - 0.5));
    d[i] = Math.round(tierra * 255); d[i + 1] = Math.round(pasto * 255); d[i + 2] = Math.round(roca * 255); d[i + 3] = Math.round(macro(u, v) * 255);
  }
  return { suelo: d };
}

// ---------------------------------------------------------------- hojas (512×256, alfa)
// Cada mitad es un ramito visto de frente. R = brillo de la hoja (nervadura más oscura,
// borde un poco más claro), G = azar por hoja, A = cobertura. El fondo transparente
// guarda el brillo medio de las hojas: al filtrar no aparece un halo oscuro.
function datosHojas() {
  const AN = 512, AL = 256, r = rng(90417);
  const brillo = new Float32Array(AN * AL).fill(0.8);
  const azar = new Float32Array(AN * AL).fill(0.5);
  const alfa = new Float32Array(AN * AL);
  const pintar = (ox, cx, cy, ang, largo, ancho, dentado, b0, g0) => {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const rad = largo + 2;
    const xIni = Math.max(ox + 1, Math.floor(cx - rad)), xFin = Math.min(ox + 254, Math.ceil(cx + rad));
    // 2.7.4: la hoja es un rectángulo girado (0 ≤ s ≤ largo, |t| < ancho·(1+|dentado|) + 0,5:
    // fuera de eso la cobertura da cero y el píxel se saltea igual). En cada fila se
    // recorre sólo ese tramo, con dos píxeles de margen; adentro, la cuenta y las
    // condiciones son las mismas de siempre, así que se pintan los mismos píxeles.
    const W = ancho * (1 + Math.abs(dentado)) + 0.5;
    for (let y = Math.max(0, Math.floor(cy - rad)); y <= Math.min(AL - 1, Math.ceil(cy + rad)); y++) {
      const dy = y - cy;
      let x0 = xIni, x1 = xFin;
      if (Math.abs(ca) > 1e-9) {
        const a = (-dy * sa) / ca, b = (largo - dy * sa) / ca;
        x0 = Math.max(x0, Math.floor(cx + Math.min(a, b)) - 2); x1 = Math.min(x1, Math.ceil(cx + Math.max(a, b)) + 2);
      }
      if (Math.abs(sa) > 1e-9) {
        const a = (dy * ca - W) / sa, b = (dy * ca + W) / sa;
        x0 = Math.max(x0, Math.floor(cx + Math.min(a, b)) - 2); x1 = Math.min(x1, Math.ceil(cx + Math.max(a, b)) + 2);
      }
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const s = dx * ca + dy * sa, t = -dx * sa + dy * ca;
        if (s < 0 || s > largo) continue;
        const q = s / largo;
        let w = ancho * Math.pow(Math.sin(Math.PI * Math.min(1, q * 1.08)), 0.75) * (1 - 0.25 * q);
        w *= 1 + dentado * Math.sin(q * 38);
        const dist = w - Math.abs(t);
        // 2.7: la cobertura se apaga cerca del borde de la región: la tarjeta nunca
        // termina en un corte recto
        const bx = Math.min(x - ox, ox + 255 - x), by = Math.min(y, AL - 1 - y);
        const cob = sat(dist + 0.5) * suave(2, 16, Math.min(bx, by));
        if (cob <= 0) continue;
        const k = y * AN + x;
        const nerv = 1 - 0.28 * suave(1.3, 0.2, Math.abs(t)) * (1 - q * 0.6);
        const borde = 1 + 0.08 * suave(ancho * 0.5, 0.0, dist);
        const b = b0 * nerv * borde * (0.9 + 0.2 * (1 - Math.abs(t) / Math.max(1, w)));
        brillo[k] = brillo[k] * (1 - cob) + b * cob;
        azar[k] = azar[k] * (1 - cob) + g0 * cob;
        alfa[k] = Math.max(alfa[k], cob);
      }
    }
  };
  // mitad izquierda: ramitos de hojas anchas (ovadas, dentadas, como las del Nothofagus)
  {
    // 2.7: ~170 hojas repartidas en un óvalo, más densas al centro; cada una apunta
    // hacia afuera desde la base del ramito, como brotan de las ramitas.
    for (let h = 0; h < 170; h++) {
      const a = r() * Math.PI * 2, rr = Math.pow(r(), 0.7);
      const px = 128 + Math.cos(a) * rr * 104, py = 132 + Math.sin(a) * rr * 106;
      const angH = Math.atan2(py - 10, px - 128) + (r() - 0.5) * 1.3;
      pintar(0, px, py, angH, 19 + r() * 13, 6.5 + r() * 3.5, 0.05, 0.7 + r() * 0.42, r());
    }
  }
  // mitad derecha: ramitos de agujas / escamas (ciprés, pehuén, coníferas)
  {
    const ramas = 15;
    for (let b = 0; b < ramas; b++) {
      const base = [256 + 128 + (r() - 0.5) * 90, 22 + r() * 36];
      const ang = Math.PI / 2 + (b / (ramas - 1) - 0.5) * 2.3 + (r() - 0.5) * 0.3;
      const largoR = 110 + r() * 90;
      for (let s = 0; s < largoR; s += 1.8) {
        const px = base[0] + Math.cos(ang) * s, py = base[1] + Math.sin(ang) * s;
        const q = s / largoR;
        for (let lado = -1; lado <= 1; lado += 2) {
          const angH = ang + lado * (0.75 + r() * 0.3);
          pintar(256, px, py, angH, (14 + r() * 8) * (1 - q * 0.5), 1.6 + r() * 0.6, 0, 0.7 + r() * 0.35, r());
        }
      }
    }
  }
  const d = new Uint8Array(AN * AL * 4);
  for (let k = 0; k < AN * AL; k++) {
    const i = k * 4;
    d[i] = Math.round(sat(brillo[k] * 0.8) * 255);   // 1.0 de brillo = 204
    d[i + 1] = Math.round(sat(azar[k]) * 255);
    d[i + 2] = 128;
    d[i + 3] = Math.round(sat(alfa[k]) * 255);
  }
  return { hojas: d };
}

// ---------------------------------------------------------------- montaña (256²)
// 2.7: crestas y canaletas para la cordillera lejana. Ruido "ridged" multifractal
// (cada octava pesa según la anterior: las crestas finas nacen sobre las grandes),
// y su pendiente ya calculada para inclinar la normal sin derivadas de pantalla.
function datosMontana() {
  const L = 256, r = rng(66031);
  const oct = [4, 8, 16, 32, 64].map((n) => rejilla(n, n, r));
  const nieve = crearFbm(r, 6, 6, 4, 0.55);
  const torcerA = crearFbm(r, 3, 3, 3, 0.5), torcerB = crearFbm(r, 3, 3, 3, 0.5);
  const alt = new Float32Array(L * L);
  let min = 9, max = -9;
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    // coordenadas deformadas; las octavas impares van giradas 45° (u+v, v−u sigue
    // siendo repetible) para que las crestas no se alineen con la grilla del ruido
    const u = x / L + (torcerA(x / L, y / L) - 0.5) * 0.22, v = y / L + (torcerB(x / L, y / L) - 0.5) * 0.22;
    let h = 0, peso = 1, amp = 0.55;
    for (let k = 0; k < oct.length; k++) {
      const a = k % 2 ? u + v : u, b = k % 2 ? v - u : v;
      let c = 1 - Math.abs(2 * valor(oct[k], a, b) - 1);
      c *= c * peso;
      peso = sat(c * 1.8);
      h += c * amp;
      amp *= 0.5;
    }
    alt[y * L + x] = h;
    if (h < min) min = h; if (h > max) max = h;
  }
  const d = new Uint8Array(L * L * 4);
  const en = (x, y) => (alt[(((y + L) % L) * L) + ((x + L) % L)] - min) / (max - min);
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    const i = (y * L + x) * 4;
    // pendiente por unidad de uv (una repetición entera = 1)
    const gx = (en(x + 1, y) - en(x - 1, y)) * L * 0.5, gz = (en(x, y + 1) - en(x, y - 1)) * L * 0.5;
    d[i] = Math.round(en(x, y) * 255);
    d[i + 1] = Math.round(sat(0.5 + gx / 48) * 255);
    d[i + 2] = Math.round(sat(0.5 + gz / 48) * 255);
    d[i + 3] = Math.round(nieve(x / L, y / L) * 255);
  }
  return { montana: d };
}

// ---------------------------------------------------------------- manchas del prado
// 2.7: manchones de decenas de metros sobre los 1024 m del valle (2 m por píxel). Se
// calculan una vez acá y el suelo y el pasto los leen con una sola muestra.
function datosManchas() {
  const L = 512, r = rng(40711);
  const seco = crearFbm(r, 11, 11, 3, 0.45), humedo = crearFbm(r, 14, 14, 3, 0.45), tono = crearFbm(r, 110, 110, 1, 0.5);
  const d = new Uint8Array(L * L * 4);
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    const u = x / L, v = y / L, i = (y * L + x) * 4;
    d[i] = Math.round(suave(0.52, 0.72, seco(u, v)) * 255);
    d[i + 1] = Math.round(suave(0.55, 0.74, humedo(u, v)) * 255);
    d[i + 2] = Math.round(tono(u, v) * 255);
    d[i + 3] = 255;
  }
  return { manchas: d };
}

// ---------------------------------------------------------------- el catálogo
// Cada textura: su generador (el vegetal da dos), su tamaño y cómo se muestrea. El orden
// de GENERADORES es el orden en que la carga las necesita: la montaña (el cielo), las
// manchas (el pasto) y el resto al compilar los materiales.
export const TEXTURAS = {
  montana: { gen: 'montana', ancho: 256, alto: 256, repetir: true, aniso: true },
  manchas: { gen: 'manchas', ancho: 512, alto: 512, repetir: false, aniso: false },
  vegetal: { gen: 'vegetal', ancho: 256, alto: 256, repetir: true, aniso: false },
  vegetalRelieve: { gen: 'vegetal', ancho: 256, alto: 256, repetir: true, aniso: false },
  hojas: { gen: 'hojas', ancho: 512, alto: 256, repetir: false, aniso: false },
  suelo: { gen: 'suelo', ancho: 512, alto: 512, repetir: true, aniso: true },
};
export const GENERADORES = ['montana', 'manchas', 'vegetal', 'hojas', 'suelo'];
// 3.3: los que el estilo pintado usa de verdad: las manchas del prado (suelo y pasto) y el
// vegetal (la madera de lo que llevás en la mano). Sólo ésos se calculan al cargar (y van a
// la caché). Los otros siguen acá, con los mismos bytes: si algún material vuelve a pedir
// uno, se calcula en el momento, como siempre.
export const GENERADORES_EN_USO = ['manchas', 'vegetal'];
const FUNCION_DE = { montana: datosMontana, manchas: datosManchas, vegetal: datosVegetal, hojas: datosHojas, suelo: datosSuelo };

// Corre un generador: { nombreDeTextura: Uint8Array, … }
export function generarDatos(gen) { return FUNCION_DE[gen](); }

// El código del Worker: las mismas funciones, copiadas de su propio texto. Recibe la
// lista de generadores y devuelve cada uno apenas lo termina (transfiriendo los bytes).
export function fuenteGenerador() {
  const funciones = [rng, rejilla, valor, crearFbm, crearCeldas, trazos, datosVegetal, datosSuelo, datosHojas, datosMontana, datosManchas];
  return [
    '"use strict";',
    `const sat = ${sat};`,
    `const suave = ${suave};`,
    ...funciones.map(String),
    'const FUNCION_DE = { montana: datosMontana, manchas: datosManchas, vegetal: datosVegetal, hojas: datosHojas, suelo: datosSuelo };',
    'self.onmessage = (e) => {',
    '  for (const gen of e.data.generadores) {',
    '    try {',
    '      const datos = FUNCION_DE[gen]();',
    '      self.postMessage({ gen, datos }, Object.values(datos).map((a) => a.buffer));',
    '    } catch (err) { self.postMessage({ gen, error: String(err && err.message || err) }); }',
    '  }',
    '};',
  ].join('\n');
}
