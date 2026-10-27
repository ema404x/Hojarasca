// 4.12.1 · EDIFICIOS ASENTADOS: oscurecido de esquinas y aleros, humedad al pie, musgo y manchas por edificio.
//
// Módulo puro (sin three ni DOM): trabaja sobre una geometría armada por el Constructor (geometria.js), es decir sin índice, con
// `position`, `normal` y `color` (un color por vértice, lineal) en el marco local de la obra. Sólo cambia el atributo `color`:
// ni luces, ni shaders, ni texturas, ni triángulos, ni dibujos nuevos. Las colisiones y los tamaños no se tocan.
//
//   · `ocluirGeometria`: oclusión ambiental pintada en los vértices. Se marca en una grilla de celdas (25 a 40 cm) todo lo que ocupa la
//     geometría y cada vértice mira alrededor: las celdas ocupadas que están por delante de su cara (esquina entrante, pared contra
//     pared, piso contra pared) lo oscurecen; el alero o el techo que sobresale por encima oscurece lo de abajo; las caras que miran
//     al suelo (panza de un alero) quedan en sombra; y lo que está pegado al piso se asienta con un pie más oscuro.
//   · `desgastarGeometria`: el aspecto propio de cada edificio, DETERMINISTA por posición e id (nunca usa el azar del juego): un
//     tono distinto, manchas de intemperie, humedad que sube del suelo y musgo en los techos y del lado de la sombra (el sol del
//     juego pasa siempre del lado de +z: la sombra cae hacia −z). `nivel` va de 0 (recién construido, casi nada) a 1.
//   · `huellaDe`: el rectángulo del pie del edificio (para la sombra de contacto, ver asentado-mundo.js).
//
// Todo es de Media y Alta: con `fijarAsentado({ ocluir: false })` (Baja y Mínima) las funciones de ahora no hacen nada.

const CONFIG = { ocluir: false, contacto: false, halos: false };
export function fijarAsentado(o = {}) {
  CONFIG.ocluir = !!o.ocluir; CONFIG.contacto = !!o.contacto; CONFIG.halos = !!o.halos;
  return { ...CONFIG };
}
export const asentadoActivo = () => CONFIG;

const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a || 1))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- la semilla de cada edificio
// Un número de 32 bits que sale de la posición (al decímetro) y del id de la obra: la misma partida da el mismo aspecto.
export function semillaDe(x, z, clave = '') {
  let h = 2166136261 >>> 0;
  const mezclar = (n) => { h = (h ^ (n >>> 0)) >>> 0; h = Math.imul(h, 16777619) >>> 0; };
  mezclar(Math.round((Number(x) || 0) * 10) | 0);
  mezclar(Math.round((Number(z) || 0) * 10) | 0);
  const s = String(clave);
  for (let i = 0; i < s.length; i++) mezclar(s.charCodeAt(i));
  h = (h ^ (h >>> 15)) >>> 0; h = Math.imul(h, 2246822519) >>> 0; h = (h ^ (h >>> 13)) >>> 0;
  return h >>> 0;
}
// un número entre 0 y 1 que sólo depende de la semilla y del índice
export function azarDe(sem, i = 0) {
  let n = (Math.imul((sem | 0) ^ 0x9e3779b9, 374761393) + Math.imul(i | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function celda(sem, a, b, c) {
  let n = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1440670441) + Math.imul(sem | 0, 1274126177)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
// ruido de valor suave en 3D, 0 a 1
export function ruido3(sem, x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const a = (dx, dy, dz) => celda(sem, ix + dx, iy + dy, iz + dz);
  const x00 = a(0, 0, 0) + (a(1, 0, 0) - a(0, 0, 0)) * fx, x10 = a(0, 1, 0) + (a(1, 1, 0) - a(0, 1, 0)) * fx;
  const x01 = a(0, 0, 1) + (a(1, 0, 1) - a(0, 0, 1)) * fx, x11 = a(0, 1, 1) + (a(1, 1, 1) - a(0, 1, 1)) * fx;
  const y0 = x00 + (x10 - x00) * fy, y1 = x01 + (x11 - x01) * fy;
  return y0 + (y1 - y0) * fz;
}

// ---------------------------------------------------------------- la geometría que se puede tratar
// Devuelve { pos, nor, col, n } o null si no sirve (sin índice, con los tres atributos y un tamaño razonable).
function leer(geo, maxVerts) {
  const A = geo && geo.attributes;
  if (!A || geo.index || !A.position || !A.normal || !A.color) return null;
  const n = A.position.count;
  if (!(n >= 9) || n > maxVerts || A.color.count !== n || A.normal.count !== n || A.color.itemSize !== 3) return null;
  return { pos: A.position.array, nor: A.normal.array, col: A.color.array, n };
}

// ---------------------------------------------------------------- más vértices donde hacen falta
// Una pared de una caja tiene cuatro vértices: el color de los vértices no alcanza para una sombra al pie ni bajo el alero. Se
// parten (por el lado más largo, hasta `largo` metros) los triángulos grandes, con todos sus atributos promediados en el punto
// medio: la forma y los colores que ya tenían quedan EXACTAMENTE igual, sólo hay más vértices donde pintar. Los triángulos
// finos (listones, tablas) no se parten. Devuelve { tris, desde } (desde[i] = primer vértice nuevo del triángulo viejo i: el orden se conserva) o null
// si no hizo nada.
export const TESELADO = { largo: 0.8, areaMin: 0.12, maxVerts: 12000, tope: 40000 };
export function teselarGeometria(geo, o = {}) {
  const A = geo && geo.attributes;
  if (!A || geo.index || !A.position || !A.normal || !A.color) return null;
  const n0 = A.position.count;
  if (n0 < 9 || n0 > (o.maxVerts ?? TESELADO.maxVerts) || n0 % 3) return null;
  const nombres = Object.keys(A);
  let stride = 0;
  const offs = {};
  for (const k of nombres) { if (A[k].count !== n0 || !(A[k].array instanceof Float32Array)) return null; offs[k] = stride; stride += A[k].itemSize; }
  const oN = offs.normal, tope = o.tope ?? TESELADO.tope;
  let largo = o.largo ?? TESELADO.largo;
  const areaMin = o.areaMin ?? TESELADO.areaMin;
  // el pozo de vértices: todos los atributos de cada vértice juntos (la posición primero); los puntos medios se agregan al final
  let pozo = new Float32Array(Math.ceil(n0 * 2.6) * stride), np = n0;
  for (const k of nombres) { const at = A[k], sz = at.itemSize, ar = at.array, o0 = offs[k]; for (let i = 0; i < n0; i++) for (let c = 0; c < sz; c++) pozo[i * stride + o0 + c] = ar[i * sz + c]; }
  const medio = (p, q) => {
    if ((np + 1) * stride > pozo.length) { const nuevo = new Float32Array(pozo.length * 2); nuevo.set(pozo); pozo = nuevo; }
    const r = np * stride, P = p * stride, Q = q * stride;
    for (let c = 0; c < stride; c++) pozo[r + c] = (pozo[P + c] + pozo[Q + c]) / 2;
    const l = Math.hypot(pozo[r + oN], pozo[r + oN + 1], pozo[r + oN + 2]) || 1;
    pozo[r + oN] /= l; pozo[r + oN + 1] /= l; pozo[r + oN + 2] /= l;
    return np++;
  };
  const dist = (p, q) => { const dx = pozo[p * stride] - pozo[q * stride], dy = pozo[p * stride + 1] - pozo[q * stride + 1], dz = pozo[p * stride + 2] - pozo[q * stride + 2]; return Math.sqrt(dx * dx + dy * dy + dz * dz); };
  const nTri0 = n0 / 3;
  // devuelve { out, nOut, desde } (desde[i]: el primer triángulo nuevo que salió del viejo i; el orden se conserva) o null si se pasa del tope
  const partir = (largo) => {
    np = n0;
    let out = new Int32Array(nTri0 * 6), nOut = 0;
    const desde = new Uint32Array(nTri0 + 1);
    const pila = [];
    for (let q = 0; q < nTri0; q++) {
      desde[q] = nOut;
      pila.length = 0; pila.push(q * 3, q * 3 + 1, q * 3 + 2);
      while (pila.length) {
        const c = pila.pop(), b = pila.pop(), a = pila.pop();
        const ab = dist(a, b), bc = dist(b, c), ca = dist(c, a);
        const mayor = Math.max(ab, bc, ca);
        let cortar = mayor > largo;
        if (cortar) {
          // área (por el producto vectorial) para no partir listones finos
          const A0 = a * stride, B0 = b * stride, C0 = c * stride;
          const ux = pozo[B0] - pozo[A0], uy = pozo[B0 + 1] - pozo[A0 + 1], uz = pozo[B0 + 2] - pozo[A0 + 2], vx = pozo[C0] - pozo[A0], vy = pozo[C0 + 1] - pozo[A0 + 1], vz = pozo[C0 + 2] - pozo[A0 + 2];
          const kx = uy * vz - uz * vy, ky = uz * vx - ux * vz, kz = ux * vy - uy * vx;
          const area = 0.5 * Math.sqrt(kx * kx + ky * ky + kz * kz);
          cortar = area >= areaMin && (2 * area) / mayor >= 0.15;   // ni chicos ni finos: un listón de 5 cm no gana nada con más vértices
        }
        if (!cortar) {
          if ((nOut + 1) * 3 > out.length) { const nuevo = new Int32Array(out.length * 2); nuevo.set(out); out = nuevo; }
          out[nOut * 3] = a; out[nOut * 3 + 1] = b; out[nOut * 3 + 2] = c; nOut++;
          continue;
        }
        // el lado más largo pasa a ser el primero (rotación cíclica: no cambia el giro del triángulo)
        let pa = a, pb = b, pc = c;
        if (bc >= ab && bc >= ca) { pa = b; pb = c; pc = a; } else if (ca >= ab && ca >= bc) { pa = c; pb = a; pc = b; }
        const m = medio(pa, pb);
        pila.push(m, pb, pc, pa, m, pc);   // (sale primero [pa, m, pc])
        if (nOut + pila.length / 3 > tope / 3) return null;
      }
    }
    desde[nTri0] = nOut;
    return { out, nOut, desde };
  };
  let res = null;
  for (let intento = 0; intento < 4 && !res; intento++, largo *= 1.6) res = partir(largo);
  if (!res || res.nOut === nTri0) return null;
  const total = res.nOut * 3;
  for (const k of nombres) {
    const at = A[k], sz = at.itemSize, o0 = offs[k], arr = new Float32Array(total * sz);
    for (let i = 0; i < total; i++) { const v = res.out[i] * stride + o0; for (let c = 0; c < sz; c++) arr[i * sz + c] = pozo[v + c]; }
    geo.setAttribute(k, new at.constructor(arr, sz, at.normalized));
  }
  const desde = new Uint32Array(res.desde.length);
  for (let i = 0; i < desde.length; i++) desde[i] = res.desde[i] * 3;   // en vértices
  return { tris: res.nOut, desde };
}

// Los rangos de vértices [v0, v1) que otro código guardó de la geometría vieja (ver marcarConstructor de estilo-casa.js) pasan a los nuevos.
export function remarcarRangos(marcas, tesela) {
  if (!tesela || !marcas) return;
  for (const m of marcas) {
    if (!(m.v0 % 3 === 0 && m.v1 % 3 === 0)) continue;
    m.v0 = tesela.desde[m.v0 / 3]; m.v1 = tesela.desde[m.v1 / 3];
  }
}

// ---------------------------------------------------------------- oclusión en las esquinas y bajo los aleros
// Las celdas vecinas que cuentan: hasta `RADIO` celdas a la redonda, con su distancia (en celdas) precalculada.
const RADIO = 2;
const VECINAS = (() => {
  const l = [];
  for (let dy = -RADIO; dy <= RADIO; dy++) for (let dz = -RADIO; dz <= RADIO; dz++) for (let dx = -RADIO; dx <= RADIO; dx++) {
    const d = Math.hypot(dx, dy, dz);
    if (d > 0 && d <= RADIO + 0.45) l.push({ dx, dy, dz, d });
  }
  return l;
})();

// Marca en `ocu` todas las celdas que toca la superficie (los triángulos se recorren con una trama más fina que la celda).
function marcarCeldas(pos, n, g) {
  const { x0, y0, z0, h, nx, ny, nz, pad, ocu } = g;
  const inv = 1 / h;
  const marca = (x, y, z) => {
    const ix = Math.floor((x - x0) * inv) + pad, iy = Math.floor((y - y0) * inv) + pad, iz = Math.floor((z - z0) * inv) + pad;
    if (ix >= 0 && iy >= 0 && iz >= 0 && ix < nx && iy < ny && iz < nz) ocu[ix + nx * (iz + nz * iy)] = 1;
  };
  for (let i = 0; i + 8 < n * 3; i += 9) {
    const ax = pos[i], ay = pos[i + 1], az = pos[i + 2], bx = pos[i + 3], by = pos[i + 4], bz = pos[i + 5], cx = pos[i + 6], cy = pos[i + 7], cz = pos[i + 8];
    const mayor = Math.max(Math.hypot(bx - ax, by - ay, bz - az), Math.hypot(cx - ax, cy - ay, cz - az), Math.hypot(cx - bx, cy - by, cz - bz));
    const pasos = Math.min(160, Math.ceil(mayor / (h * 0.7)));
    if (pasos <= 1) { marca(ax, ay, az); marca(bx, by, bz); marca(cx, cy, cz); marca((ax + bx + cx) / 3, (ay + by + cy) / 3, (az + bz + cz) / 3); continue; }
    for (let a = 0; a <= pasos; a++) {
      const u = a / pasos;
      for (let b = 0; b <= pasos - a; b++) {
        const v = b / pasos, w = 1 - u - v;
        marca(ax * w + bx * u + cx * v, ay * w + by * u + cy * v, az * w + bz * u + cz * v);
      }
    }
  }
}

export const OCLUSION = { celda: 0.28, fuerza: 0.7, pie: 0.6, maxVerts: 48000, tope: 120 };

// Pinta la oclusión en el color de los vértices. Devuelve cuántos vértices se tocaron (0 si no hizo nada).
//   o.base: altura del suelo en el marco local (0 por defecto) · o.fuerza: cuánto oscurece lo más tapado (0 a 1)
export function ocluirGeometria(geo, o = {}) {
  const m = leer(geo, o.maxVerts ?? OCLUSION.maxVerts);
  if (!m) return 0;
  const { pos, nor, col, n } = m;
  const fuerza = o.fuerza ?? OCLUSION.fuerza, base = o.base ?? 0, pie = o.pie ?? OCLUSION.pie;
  let xa = Infinity, xb = -Infinity, ya = Infinity, yb = -Infinity, za = Infinity, zb = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    if (x < xa) xa = x; if (x > xb) xb = x; if (y < ya) ya = y; if (y > yb) yb = y; if (z < za) za = z; if (z > zb) zb = z;
  }
  const extension = Math.max(xb - xa, yb - ya, zb - za);
  if (!(extension > 0.2)) return 0;
  const h = Math.max(o.celda ?? OCLUSION.celda, extension / (o.tope ?? OCLUSION.tope));
  const pad = RADIO + 2;
  const nx = Math.floor((xb - xa) / h) + 1 + pad * 2, ny = Math.floor((yb - ya) / h) + 1 + pad * 2, nz = Math.floor((zb - za) / h) + 1 + pad * 2;
  const g = { x0: xa, y0: ya, z0: za, h, nx, ny, nz, pad, ocu: new Uint8Array(nx * ny * nz) };
  marcarCeldas(pos, n, g);
  const { ocu } = g, inv = 1 / h;
  const salto = [], dist = [];
  for (const v of VECINAS) { salto.push(v.dx + nx * (v.dz + nz * v.dy)); dist.push(v.d * h); }
  const R = (RADIO + 0.45) * h;
  let tocados = 0;
  // el mismo vértice (misma posición y misma cara) sale en cuatro o seis triángulos: se calcula una vez
  const memo = new Map();
  for (let i = 0; i < n; i++) {
    const px = pos[i * 3], py = pos[i * 3 + 1], pz = pos[i * 3 + 2], ux = nor[i * 3], uy = nor[i * 3 + 1], uz = nor[i * 3 + 2];
    const clave = (Math.imul(Math.round(px * 400), 73856093) ^ Math.imul(Math.round(py * 400), 19349663) ^ Math.imul(Math.round(pz * 400), 83492791))
      + (Math.round(ux * 8) + 8) * 289 + (Math.round(uy * 8) + 8) * 17 + (Math.round(uz * 8) + 8);
    let f = memo.get(clave);
    if (f === undefined) { f = factorOclusion(px, py, pz, ux, uy, uz); memo.set(clave, f); }
    if (f >= 0.999) continue;
    // la sombra es un poco fría: el azul se oscurece menos
    col[i * 3] *= Math.pow(f, 1.08); col[i * 3 + 1] *= f; col[i * 3 + 2] *= Math.pow(f, 0.88);
    tocados++;
  }
  function factorOclusion(px, py, pz, ux, uy, uz) {
    const fx = (px - xa) * inv, fy = (py - ya) * inv, fz = (pz - za) * inv;
    const cx = Math.floor(fx) + pad, cy = Math.floor(fy) + pad, cz = Math.floor(fz) + pad;
    const centro = cx + nx * (cz + nz * cy);
    // el centro de la celda de este vértice (para medir hacia dónde queda cada vecina, con el vértice donde está)
    const ox = xa + (Math.floor(fx) + 0.5) * h - px, oy = ya + (Math.floor(fy) + 0.5) * h - py, oz = za + (Math.floor(fz) + 0.5) * h - pz;
    // 1) las celdas ocupadas por delante de la cara (a más de una celda de ella): esquinas entrantes, pared contra pared
    let suma = 0;
    for (let k = 0; k < salto.length; k++) {
      if (!ocu[centro + salto[k]]) continue;
      const v = VECINAS[k];
      const dx = ox + v.dx * h, dy = oy + v.dy * h, dz = oz + v.dz * h;
      const delante = dx * ux + dy * uy + dz * uz;
      if (delante < h * 0.95) continue;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      suma += (1 - d / R) * Math.min(1, (delante / d) * 1.3);
    }
    let oc = suma / 5.2;
    // 2) el alero: en una cara que mira de costado, lo que sobresale por encima y por delante la deja en sombra
    if (Math.abs(uy) < 0.55) {
      const lh = Math.sqrt(ux * ux + uz * uz) || 1, hx = ux / lh, hz = uz / lh;
      let alero = 0;
      for (const [fuera, peso] of [[1.7, 0.62], [2.8, 0.38]]) {
        const sx = Math.floor((px + hx * fuera * h - xa) * inv) + pad, sz = Math.floor((pz + hz * fuera * h - za) * inv) + pad;
        for (let j = 1; j <= 5; j++) {
          const sy = Math.floor((py + j * h * 1.1 - ya) * inv) + pad;
          if (sx >= 0 && sz >= 0 && sy >= 0 && sx < nx && sz < nz && sy < ny && ocu[sx + nx * (sz + nz * sy)]) { alero += peso * (1 - (j - 1) / 5.5); break; }
        }
      }
      oc += alero * 0.9;
    }
    // 3) lo que mira al suelo (panza de aleros, cielos): en sombra
    if (uy < -0.5) oc += 0.55 * Math.min(1, (-uy - 0.5) * 3);
    // 4) el pie: pegado al suelo, en las caras que no miran hacia arriba
    const alto = py - base;
    const pegado = (1 - suave(0, pie, alto)) * (1 - Math.max(0, uy)) * (alto > -0.8 ? 1 : 0.6);
    oc += pegado * 0.7;
    if (oc <= 0.004) return 1;
    return 1 - fuerza * Math.min(1, oc);
  }
  if (geo.attributes.color.needsUpdate !== undefined) geo.attributes.color.needsUpdate = true;
  return tocados;
}

// ---------------------------------------------------------------- el desgaste propio de cada edificio
// el musgo es un verde con la MISMA luz que la superficie que cubre (un poco menos): cambia el matiz, no aclara ni oscurece un techo oscuro
const MUSGO = [0.67, 1.16, 0.37];           // el matiz (su luminancia vale 1)
const HUMEDAD = [0.6, 0.58, 0.52];
// o.semilla (de semillaDe) · o.rot (giro de la obra, para saber de qué lado queda la sombra) · o.nivel (0 nuevo … 1 viejo) · o.base
export function desgastarGeometria(geo, o = {}) {
  const m = leer(geo, o.maxVerts ?? 90000);
  if (!m) return 0;
  const { pos, nor, col, n } = m;
  const sem = (o.semilla ?? 1) | 0, nivel = Math.min(1, Math.max(0, o.nivel ?? 0.3)), base = o.base ?? 0;
  const rot = Number(o.rot) || 0, sr = Math.sin(rot), cr = Math.cos(rot);
  // lo que hace distinta a cada casa aunque sea nueva: un matiz y un brillo propios (±3 %)
  const tono = 1 + (azarDe(sem, 1) - 0.5) * 0.06;
  const calido = (azarDe(sem, 2) - 0.5) * 0.05;
  const cuantoMusgo = 0.55 + azarDe(sem, 3) * 0.9;     // hay casas más verdes que otras
  const cuantoMancha = 0.55 + azarDe(sem, 4) * 0.9;
  const cuantoPie = 0.6 + azarDe(sem, 5) * 0.8;
  const s1 = sem ^ 0x1234567, s2 = sem ^ 0x2345678, s3 = sem ^ 0x3456789;
  let tocados = 0;
  // el mismo vértice sale en cuatro o seis triángulos: los ruidos (lo caro) se calculan una vez por posición
  const memo = new Map();
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], ux = nor[i * 3], uy = nor[i * 3 + 1], uz = nor[i * 3 + 2];
    let rr = null;
    if (nivel > 0.001) {
      const clave = Math.imul(Math.round(x * 400), 73856093) ^ Math.imul(Math.round(y * 400), 19349663) ^ Math.imul(Math.round(z * 400), 83492791);
      rr = memo.get(clave);
      if (rr === undefined) {
        rr = [ruido3(s1, x * 0.62, y * 0.8, z * 0.62), ruido3(s2, x * 1.7 + 3, y * 1.4, z * 1.7), ruido3(s3, x * 2.2, 0, z * 2.2), ruido3(s1 ^ 77, x * 3.1, y * 2.0, z * 3.1), ruido3(s2 ^ 91, x * 1.25, y * 1.05, z * 1.25)];
        memo.set(clave, rr);
      }
    }
    let r = col[i * 3] * tono * (1 + calido), g = col[i * 3 + 1] * tono, b = col[i * 3 + 2] * tono * (1 - calido);
    if (nivel > 0.001) {
      const alto = y - base;
      // manchas de intemperie: oscuras, anchas y poco marcadas
      const mancha = suave(0.56, 0.86, rr[0]);
      const aclarada = suave(0.62, 0.9, rr[1]) * 0.5;
      const mm = nivel * cuantoMancha;
      const fm = 1 - 0.16 * mancha * mm + 0.07 * aclarada * mm;
      r *= fm; g *= fm; b *= fm;
      // humedad que sube del suelo (paredes) con un poco de verdín
      if (Math.abs(uy) < 0.8 && alto < 0.9) {
        const k = nivel * cuantoPie * (1 - suave(0.05, 0.85, alto + (rr[2] - 0.5) * 0.5)) * 0.62;
        r += (r * HUMEDAD[0] - r) * k; g += (g * HUMEDAD[1] - g) * k; b += (b * HUMEDAD[2] - b) * k;
        const verdin = suave(0.55, 0.8, rr[3]) * k * 0.45;
        const lv = (0.2126 * r + 0.7152 * g + 0.0722 * b) * 0.9 + 0.008;
        r += (MUSGO[0] * lv - r) * verdin; g += (MUSGO[1] * lv - g) * verdin; b += (MUSGO[2] * lv - b) * verdin;
      }
      // musgo: en lo que mira para arriba (techos) y del lado de la sombra (−z en el mundo)
      const wnz = -ux * sr + uz * cr;
      const sombra = suave(0.05, 0.75, -wnz);
      const arriba = suave(0.2, 0.7, uy);
      const dispone = arriba * 0.6 + sombra * 0.4 * (1 - suave(0.4, 2.8, alto)) + sombra * arriba * 0.3;
      if (dispone > 0.01) {
        const rodal = suave(0.57, 0.82, rr[4]);
        const k = Math.min(0.62, nivel * cuantoMusgo * dispone * rodal * 0.85);
        const lv = (0.2126 * r + 0.7152 * g + 0.0722 * b) * 0.9 + 0.008;
        r += (MUSGO[0] * lv - r) * k; g += (MUSGO[1] * lv - g) * k; b += (MUSGO[2] * lv - b) * k;
      }
    }
    col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
    tocados++;
  }
  if (geo.attributes.color.needsUpdate !== undefined) geo.attributes.color.needsUpdate = true;
  return tocados;
}

// Las dos juntas, como las usan la construcción y las estructuras: oclusión si la calidad la permite, y desgaste siempre
// que haya `nivel` (el aspecto propio de cada obra se lo lleva también Baja: es un color por vértice, no cuesta nada).
export function asentarGeometria(geo, o = {}) {
  let ocl = 0, des = 0;
  if (o.semilla !== undefined) des = desgastarGeometria(geo, o);
  if (CONFIG.ocluir && o.ocluir !== false) ocl = ocluirGeometria(geo, o);
  return { ocluidos: ocl, desgastados: des };
}

// ---------------------------------------------------------------- la huella del edificio (para su sombra de contacto)
// Los vértices bajos (entre `base − 0.45` y `base + banda`) dan el rectángulo del pie en el marco local: { cx, cz, w, d } o null.
export function huellaDe(geo, o = {}) {
  const A = geo && geo.attributes;
  if (!A || !A.position) return null;
  const pos = A.position.array, n = A.position.count, base = o.base ?? 0, banda = o.banda ?? 0.55;
  let xa = Infinity, xb = -Infinity, za = Infinity, zb = -Infinity, k = 0;
  for (let i = 0; i < n; i++) {
    const y = pos[i * 3 + 1];
    if (y < base - 0.45 || y > base + banda) continue;
    const x = pos[i * 3], z = pos[i * 3 + 2];
    if (x < xa) xa = x; if (x > xb) xb = x; if (z < za) za = z; if (z > zb) zb = z;
    k++;
  }
  if (k < 4) return null;
  const w = xb - xa, d = zb - za;
  if (!(w >= (o.minimo ?? 0.7) && d >= (o.minimo ?? 0.7)) || w > (o.maximo ?? 40) || d > (o.maximo ?? 40)) return null;
  return { cx: (xa + xb) / 2, cz: (za + zb) / 2, w, d };
}
