// Especies del bosque andino patagónico, sotobosque y su distribución en chunks
import * as THREE from 'three';
import { rng, smoothstep, clamp } from './ruido.js';
import { Constructor, abollar, matriz, troncoCurvo, lamina, h3 } from './geometria.js';
import { materialVegetal, U } from './materiales.js';
import { crearImpostores } from './impostores.js';
import { MITAD, LAGO } from './config.js';
import { perfilHabitatPatagonico, elegirArbolPatagonico, formaArbolPatagonico } from './patagonia.js';
import { crearIndiceEspacial2D } from './rendimiento.js';
import { bordeBosqueNatural, corredorEscenico, factorRodalPatagonico, firmaComposicionPaisaje } from './paisaje.js';

const TAM_CHUNK = 120;   // tramos más grandes: menos dibujos por cuadro

// 3.2: estilo pintado (HushWood). Las copas son bultos con un degradado propio (base
// oscura y fría, puntas claras y cálidas) y normales esféricas suaves; las coníferas son
// pisos de faldas en punta. Se fueron las cartas de hojas y el calado de la 2.7. El LOD
// lejano sigue más liviano que el cercano en todas las calidades.
// 3.4: tercera vuelta de HushWood. Las copas son racimos: de cerca, un núcleo oscuro con una
// corona de cartas pintadas (ramilletes de hojas, escamas o agujas recortados, que miran a la
// cámara) colgados de ramas que se ven; de lejos, manchas redondas de borde lobulado que
// también miran a la cámara. Normales de follaje por racimo (sin facetas). Cada especie con
// su porte real: coihue en capas, lenga y ñire abiertos, maitén llorón, arrayán canela,
// ciprés cónico escamoso, pehuén en paraguas con cepillos.
// 3.4 (sotobosque): helechos de frondas texturadas, las flores del prado en el atlas (ver
// pasto.js), el ciprés tapado de ramitas de escamas, el pehuén de brazos gruesos en pisos,
// las manchas lejanas con hojas pintadas adentro y el sotobosque dibujado en bloques (una
// malla por tipo, no un pedazo por chunk).
const LIGERO = true;

// 2.7.1: fuste del LOD lejano más liviano (menos lados y tramos): a más de 44 m no se
// distingue, y es la geometría que más se repite en pantalla
const ladosLejos = (lados, detalle) => (!detalle && LIGERO ? Math.min(lados, 5) : lados);
const filasLejos = (filas, detalle) => (!detalle && LIGERO ? Math.min(filas, 2) : filas);

// 3.2: el degradado de un bulto de follaje a partir del verde de la especie: un poco más
// saturado (verdes vivos), la base oscura y hacia el turquesa, las puntas claras y doradas.
// (Los colores de three son lineales: los factores se multiplican en lineal.)
const _gA = new THREE.Color(), _gL = new THREE.Color();
function gradHoja(hex, oscuro = 1) {
  const c = _gA.set(hex);
  const l = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
  c.setRGB(Math.max(0, l + (c.r - l) * 1.2), Math.max(0, l + (c.g - l) * 1.2), Math.max(0, l + (c.b - l) * 1.2));
  const bajo = c.clone().multiply(_gL.setRGB(0.40, 0.50, 0.66)).multiplyScalar(oscuro);
  const alto = c.clone().multiply(_gL.setRGB(1.5, 1.4, 0.9));
  alto.r += 0.012; alto.g += 0.01;
  return [bajo, alto];
}
// 3.2: corteza pintada: el pie más oscuro y frío, arriba más claro y tibio
function gradTronco(hex) {
  const c = _gA.set(hex);
  return [c.clone().multiply(_gL.setRGB(0.62, 0.66, 0.74)), c.clone().multiply(_gL.setRGB(1.18, 1.1, 0.98))];
}

// ---------------------------------------------------------------- 3.4: cartas de follaje
// HushWood viste las copas con ramilletes pintados: cartas recortadas con hojitas, agujas o
// escamas, colgadas de ramas que se ven. Acá se pintan al cargar, por código (sin archivos
// ni canvas), en un atlas de 1024×512 con 8 celdas de 256²: RGB = la luz pintada de la hoja
// (0 sombra · 1 luz) y A = el recorte. El color lo sigue poniendo el vértice (especie,
// degradado, otoño, nieve): la carta sólo lo modula y le da el borde de ramillete.
// 3.4 (sotobosque): el atlas pasa a 1024×1024 (16 celdas) y suma la fronda del helecho y las
// matas de flores del prado (lupinos, margaritas, amancay). En las celdas de flores el color
// va por canal: R = luz pintada, G = tallo y hoja (verde), B = centro de la flor, A = recorte;
// quien las dibuja (pasto.js) arma el color con los tres tonos de la especie.
export const CELDAS_CARTA = { densa: 0, abierta: 1, colgante: 2, escamas: 3, cepillo: 4, mata: 5, fronda: 6, lupino: 7, margarita: 8, amancay: 9 };
const CARTA_ANCHO = 1024, CARTA_ALTO = 1024, CARTA_CELDA = 256;
export const FILAS_CARTA = CARTA_ALTO / CARTA_CELDA;
// el ancho de la hoja a lo largo de su largo (t: 0 en el pie, 1 en la punta), en tablas de
// 65 muestras (pintar el atlas tiene que ser rápido: es parte de la carga)
const tablaHoja = (f) => Float32Array.from({ length: 65 }, (_, i) => f(i / 64));
const perfilHoja = {
  oval: tablaHoja((t) => Math.pow(Math.sin(Math.PI * t), 0.75)),
  redonda: tablaHoja((t) => Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.55) * (0.9 + 0.1 * Math.cos(t * 38))),
  escama: tablaHoja((t) => Math.pow(Math.sin(Math.PI * t), 0.45)),
  aguja: tablaHoja((t) => (t < 0.12 ? t / 0.12 : (1 - t) / 0.88)),
  fina: tablaHoja((t) => Math.sin(Math.PI * t)),
  tallo: tablaHoja(() => 1),
};
// (`gb`, opcional: [verde, centro] en 0..1 para las celdas de flores; sin él, G y B copian a R)
function pintarHoja(D, celda, bx, by, ang, largo, ancho, l0, l1, forma, gb = null) {
  // los tallos largos se pintan en tramos cortos (la caja de un trazo en diagonal es enorme)
  if (forma === 'tallo' && largo > 14) {
    const n = Math.ceil(largo / 12), paso = largo / n;
    for (let k = 0; k < n; k++) pintarHoja(D, celda, bx + Math.cos(ang) * paso * k, by + Math.sin(ang) * paso * k, ang, paso + 0.5, ancho, l0, l1, forma, gb);
    return;
  }
  const ox = (celda % 4) * CARTA_CELDA, oy = Math.floor(celda / 4) * CARTA_CELDA;
  const perfil = perfilHoja[forma], ca = Math.cos(ang), sa = Math.sin(ang), hoja = forma !== 'tallo';
  const tx = bx + ca * largo, ty = by + sa * largo, m = ancho + 2;
  const y0 = Math.max(4, Math.floor(Math.min(by, ty) - m)), y1 = Math.min(CARTA_CELDA - 5, Math.ceil(Math.max(by, ty) + m));
  for (let y = y0; y <= y1; y++) {
    const dy = y + 0.5 - by;
    // en cada fila, sólo el tramo de x que cae adentro del rectángulo de la hoja (girado)
    let a0 = -1e9, a1 = 1e9;
    if (Math.abs(ca) > 1e-6) { const p = -dy * sa / ca, q = (largo - dy * sa) / ca; a0 = Math.max(a0, Math.min(p, q)); a1 = Math.min(a1, Math.max(p, q)); } else if (dy * sa < 0 || dy * sa > largo) continue;
    if (Math.abs(sa) > 1e-6) { const p = (dy * ca - m) / sa, q = (dy * ca + m) / sa; a0 = Math.max(a0, Math.min(p, q)); a1 = Math.min(a1, Math.max(p, q)); } else if (Math.abs(dy * ca) > m) continue;
    const x0 = Math.max(4, Math.floor(bx + a0 - 0.5)), x1 = Math.min(CARTA_CELDA - 5, Math.ceil(bx + a1 - 0.5));
    let i = ((oy + y) * CARTA_ANCHO + ox + x0) * 4;
    for (let x = x0; x <= x1; x++, i += 4) {
      const dx = x + 0.5 - bx;
      const t = (dx * ca + dy * sa) / largo;
      if (t < 0 || t > 1) continue;
      const v = -dx * sa + dy * ca, w = ancho * perfil[(t * 64 + 0.5) | 0], av = v < 0 ? -v : v;
      if (av > w + 0.7) continue;
      let a = (w - av) / 1.4 + 0.5; if (a > 1) a = 1;
      let l = l0 + (l1 - l0) * t;
      // nervio más oscuro, una mitad de la hoja más clara que la otra y el borde apagado:
      // la hoja pintada de a dos tonos
      if (hoja) { if (av < w * 0.14 && t < 0.88) l *= 0.8; l *= v > 0 ? 1.07 : 0.93; if (av > w * 0.78) l *= 0.9; }
      const previo = D[i + 3] / 255, nuevo = (l > 1 ? 1 : l < 0 ? 0 : l) * 255;
      if (gb) {
        D[i] = previo > 0 ? D[i] + (nuevo - D[i]) * a : nuevo;
        D[i + 1] = previo > 0 ? D[i + 1] + (gb[0] * 255 - D[i + 1]) * a : gb[0] * 255;
        D[i + 2] = previo > 0 ? D[i + 2] + (gb[1] * 255 - D[i + 2]) * a : gb[1] * 255;
      } else D[i] = D[i + 1] = D[i + 2] = previo > 0 ? D[i] + (nuevo - D[i]) * a : nuevo;
      D[i + 3] = (previo > a ? previo : a) * 255;
    }
  }
}
function generarCartas() {
  const D = new Uint8Array(CARTA_ANCHO * CARTA_ALTO * 4);
  // fondo transparente con un gris medio: los mipmaps no oscurecen el borde de las hojas
  for (let i = 0; i < D.length; i += 4) D[i] = D[i + 1] = D[i + 2] = 105;
  const r = rng(3404), azar = (a, b) => a + r() * (b - a);
  const H = (celda, x, y, ang, largo, ancho, luz, forma) => pintarHoja(D, celda, x, y, ang, largo, ancho, luz * 0.84, Math.min(1, luz * 1.12), forma);
  // hojas sueltas en una elipse, apuntando hacia afuera de un centro
  const relleno = (celda, n, cx, cy, rx, ry, fx, fy, hoja, luz, forma) => {
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      H(celda, x, y, Math.atan2(y - fy, x - fx) + azar(-0.5, 0.5), azar(hoja[0], hoja[1]), azar(hoja[2], hoja[3]), azar(luz[0], luz[1]), forma);
    }
  };
  // ramillete: ramitas en abanico (hacia abajo) desde un punto, con hojas alternas
  const ramillete = (celda, ax, ay, n, abanico, largo, hoja, paso, forma, luz) => {
    for (let k = 0; k < n; k++) {
      const a = Math.PI / 2 + (k / Math.max(1, n - 1) - 0.5) * abanico + azar(-0.12, 0.12);
      const L = azar(largo[0], largo[1]);
      pintarHoja(D, celda, ax, ay, a, L, 1.5, 0.2, 0.32, 'tallo');
      let lado = r() < 0.5 ? 1 : -1;
      for (let s = paso * 1.3; s < L; s += paso * azar(0.85, 1.15)) {
        const f = s / L;
        H(celda, ax + Math.cos(a) * s, ay + Math.sin(a) * s, a + lado * azar(0.55, 1.0), azar(hoja[0], hoja[1]), azar(hoja[2], hoja[3]), luz[0] + (luz[1] - luz[0]) * (0.35 + 0.65 * f) * azar(0.85, 1.1), forma);
        lado = -lado;
      }
      H(celda, ax + Math.cos(a) * L, ay + Math.sin(a) * L, a + azar(-0.2, 0.2), hoja[1], hoja[3], luz[1] * azar(0.9, 1.05), forma);
    }
  };
  // 0 · hojas chicas, en punta y densas (coihue, arrayán, maitén): ramillete lleno que cuelga
  relleno(0, 70, 128, 128, 86, 84, 128, 60, [20, 27, 5, 6.5], [0.38, 0.55], 'oval');
  ramillete(0, 128, 38, 7, 2.0, [118, 168], [19, 26, 5, 6.5], 9, 'oval', [0.5, 0.9]);
  relleno(0, 34, 124, 104, 72, 52, 128, 70, [18, 24, 5, 6.5], [0.76, 0.98], 'oval');
  // 1 · hojitas redondeadas y aserradas, más abierto (lenga, ñire)
  relleno(1, 30, 128, 120, 72, 70, 128, 50, [15, 19, 6.5, 8], [0.38, 0.52], 'redonda');
  ramillete(1, 128, 40, 8, 2.5, [104, 158], [14, 19, 6.5, 8], 11, 'redonda', [0.52, 0.95]);
  relleno(1, 14, 126, 104, 62, 46, 128, 70, [14, 18, 6.5, 8], [0.76, 0.98], 'redonda');
  // 2 · cortina colgante (maitén): una franja de hojas arriba y hebras que caen
  relleno(2, 34, 128, 50, 100, 30, 128, 20, [20, 26, 7, 9], [0.34, 0.76], 'oval');
  for (let k = 0; k < 10; k++) {
    let x = 22 + k * 21 + azar(-6, 6), y = 34 + azar(0, 22), a = Math.PI / 2 + azar(-0.12, 0.12);
    const L = azar(140, 205);
    for (let s = 0; s < L; s += 8) {
      const f = s / L;
      pintarHoja(D, 2, x, y, a, 9, 0.9, 0.22, 0.3, 'tallo');
      H(2, x, y, a + (s % 16 ? 0.45 : -0.45), azar(15, 20), azar(4.5, 5.6), 0.45 + 0.5 * f, 'fina');
      x += Math.cos(a) * 8; y += Math.sin(a) * 8; a += azar(-0.05, 0.05);
    }
  }
  // 3 · escamas (ciprés de la cordillera): rama aplanada con ramitas de escamas
  relleno(3, 34, 128, 128, 46, 88, 128, 20, [13, 16, 6, 7], [0.3, 0.45], 'escama');
  for (let s = 14; s < 214; s += 25) {
    const f = s / 214, ax = 128 + Math.sin(f * 2.2) * 6, ay = 22 + s;
    for (const lado of [-1, 1]) {
      const a = Math.PI / 2 + lado * azar(0.85, 1.1), L = (1 - 0.4 * f) * azar(68, 86);
      for (let u = 0; u < L; u += 5.5) H(3, ax + Math.cos(a) * u, ay + Math.sin(a) * u, a + azar(-0.25, 0.25), azar(12, 15), azar(6, 7), 0.36 + 0.6 * (u / L), 'escama');
    }
    H(3, ax, ay, Math.PI / 2 + azar(-0.2, 0.2), 15, 7, 0.5 + 0.3 * f, 'escama');
  }
  // 4 · cepillo (pehuén): hojas duras en punta, imbricadas alrededor de un eje que sube
  for (const capa of [0, 1]) {
    for (let s = 0; s < 228; s += 6) {
      const f = s / 228, ax = 128 + Math.sin(f * 2.6) * 7, ay = 244 - s;
      const fin = 0.55 + 0.45 * smoothstep(1, 0.72, f);
      for (let q = 0; q < 2; q++) {
        const lado = q ? 1 : -1, a = -Math.PI / 2 + lado * azar(0.55, 1.25) * (capa ? 0.7 : 1);
        H(4, ax, ay, a, azar(26, 34) * fin, azar(8, 10), capa ? azar(0.62, 1.0) : azar(0.26, 0.46), 'aguja');
      }
    }
  }
  // 5 · mata (arbustos): hojas medianas que salen de un centro, redonda y llena
  relleno(5, 60, 128, 140, 86, 78, 128, 140, [28, 35, 11, 14], [0.26, 0.45], 'oval');
  relleno(5, 44, 128, 136, 78, 70, 128, 150, [27, 34, 11, 13.5], [0.45, 0.72], 'oval');
  relleno(5, 28, 124, 112, 58, 44, 128, 150, [25, 31, 11, 13], [0.74, 1.0], 'oval');
  pintarSotobosque(D, r, azar);
  return D;
}

// 3.4 (sotobosque): las celdas nuevas, pintadas después de las de los árboles (con el mismo
// azar, que sigue de largo: las de antes salen iguales). Coordenadas de la celda: x a la
// derecha, y hacia abajo; el pie de las plantas abajo (y ≈ 250), la punta arriba.
function pintarSotobosque(D, r, azar) {
  const VERDE = [1, 0], FLOR = [0, 0], CENTRO = [0, 1];
  const trazo = (celda, x, y, ang, largo, ancho, luz, forma, gb) => pintarHoja(D, celda, x, y, ang, largo, ancho, luz * 0.86, Math.min(1, luz * 1.1), forma, gb);
  const ARRIBA = -Math.PI / 2;
  // tallo en tres tramos que se curvan (de abajo hacia arriba)
  const tallo = (celda, x0, y0, x1, y1, ancho, gb = VERDE) => {
    const mx = (x0 + x1) / 2 + azar(-6, 6), my = (y0 + y1) / 2;
    for (const [ax, ay, bx, by] of [[x0, y0, mx, my], [mx, my, x1, y1]]) {
      pintarHoja(D, celda, ax, ay, Math.atan2(by - ay, bx - ax), Math.hypot(bx - ax, by - ay) + 1, ancho, 0.24, 0.42, 'tallo', gb);
    }
  };

  // 6 · fronda de helecho (la costilla de vaca y el helecho del bosque húmedo): un raquis que
  // sube por el medio y pinnas alternas, largas en el tercio de abajo y cortas en la punta;
  // cada pinna con sus pínnulas a los dos lados: el borde se lee plumoso, no en punta.
  {
    const pie = 250, L = 242;
    pintarHoja(D, 6, 128, pie, ARRIBA, L, 2.4, 0.2, 0.5, 'tallo');
    let lado = 1;
    for (let s = 9; s < L - 6; s += 8.2) {
      const f = s / L, y = pie - s, x = 128 + Math.sin(f * 3.1) * 2.5;
      const largoP = 108 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + f * 0.92)), 0.8) * (1 - 0.32 * f) + 7;
      // (hacia afuera y un poco hacia la punta de la fronda)
      const a = ARRIBA + lado * (1.22 - 0.4 * f) + azar(-0.06, 0.06);
      pintarHoja(D, 6, x, y, a, largoP, 1.1, 0.26, 0.45, 'tallo');
      const tam = 0.55 + 0.45 * (largoP / 115);
      for (let u = 4; u < largoP - 3; u += 6.2) {
        const g = u / largoP, px = x + Math.cos(a) * u, py = y + Math.sin(a) * u;
        const lp = (12.5 - 6.5 * g) * tam * azar(0.9, 1.1), wp = (4.6 - 1.6 * g) * tam;
        // la pínnula de arriba (hacia la punta de la fronda) más clara que la de abajo
        const luz = 0.42 + 0.4 * f + 0.18 * (1 - g) * azar(0.6, 1);
        trazo(6, px, py, a - lado * 0.95, lp, wp, Math.min(1, luz * 1.12), 'oval');
        trazo(6, px, py, a + lado * 0.95, lp * 0.92, wp, luz * 0.86, 'oval');
      }
      trazo(6, x + Math.cos(a) * largoP, y + Math.sin(a) * largoP, a, 9 * tam, 3.8 * tam, 0.7 + 0.25 * f, 'oval');
      lado = -lado;
    }
    trazo(6, 128, 10, ARRIBA, 10, 3.5, 0.95, 'oval');
  }

  // 7 · lupinos: espigas de flores apretadas en verticilos que se afinan hacia la punta (los
  // pimpollos), sobre tallos verdes con hojas palmeadas abajo. Hasta tres tonos por mata los
  // pone quien la dibuja; acá B marca el estandarte claro de algunas flores.
  {
    const espigas = [[92, 58, 0.95], [140, 26, 1.05], [186, 70, 0.9], [116, 100, 0.8]];
    for (const [x, yt, k] of espigas) {
      const yb = yt + 118 * k;
      tallo(7, x + azar(-8, 8), 251, x, yb + 6, 2.6);
      // hojas palmeadas: siete folíolos en abanico, a la altura del pie
      const hy = 214 + azar(-14, 14), hx = x + azar(-10, 10);
      for (let j = 0; j < 7; j++) {
        const ang = -Math.PI + 0.25 + (j / 6) * (Math.PI - 0.5) + azar(-0.1, 0.1);
        trazo(7, hx, hy, ang, azar(26, 34), 5.2, azar(0.32, 0.62), 'oval', VERDE);
      }
      for (let s = 0; s < yb - yt; s += 6) {
        const f = s / (yb - yt), y = yb - s, w = (17 - 10 * f) * k;
        if (f > 0.86) { trazo(7, x, y, ARRIBA + azar(-0.3, 0.3), w * 0.9, w * 0.45, 0.82, 'oval', FLOR); continue; }
        for (const ang of [Math.PI + 0.28, -0.28]) trazo(7, x, y, ang + azar(-0.15, 0.15), w, w * 0.56, azar(0.5, 0.72) + 0.25 * f, 'oval', FLOR);
        trazo(7, x + azar(-2, 2), y - 2, ARRIBA + azar(-0.4, 0.4), w * 0.55, w * 0.42, azar(0.72, 0.95), 'oval', r() < 0.4 ? [0, 0.8] : FLOR);
      }
    }
  }

  // 8 · margaritas: cabezas blancas de muchos pétalos con el botón amarillo, vistas un poco
  // desde arriba, sobre tallos finos con hojas angostas abajo
  {
    const cabezas = [[66, 64, 1.3], [134, 40, 1.36], [196, 78, 1.24], [102, 118, 1.2], [172, 132, 1.12], [50, 156, 1.02], [216, 170, 0.96], [136, 178, 0.92]];
    for (let j = 0; j < 9; j++) {
      const x = 40 + j * 22 + azar(-6, 6);
      trazo(8, x, 251, ARRIBA + azar(-0.7, 0.7), azar(28, 44), 4.2, azar(0.3, 0.6), 'fina', VERDE);
    }
    for (const [x, y, k] of cabezas) tallo(8, x + azar(-10, 10), 251, x, y + 8, 2.2);
    for (const [x, y, k] of cabezas) {
      const n = 17, a0 = azar(0, 1);
      for (let p = 0; p < n; p++) {
        const ang = ((p + a0) / n) * Math.PI * 2, dx = Math.cos(ang), dy = Math.sin(ang) * 0.6;
        const largo = 22 * k * Math.hypot(dx, dy);
        trazo(8, x, y, Math.atan2(dy, dx), largo, 4.6 * k, dy > 0 ? azar(0.74, 0.86) : azar(0.88, 1.0), 'oval', FLOR);
      }
      trazo(8, x - 6 * k, y, 0, 12 * k, 4.8 * k, 0.76, 'redonda', CENTRO);
      trazo(8, x - 4 * k, y - 1.5, 0, 8 * k, 3.4 * k, 0.95, 'redonda', CENTRO);
    }
  }

  // 9 · amancay: varas con hojas angostas retorcidas y arriba la umbela de flores en
  // embudo: seis tépalos anchos; los de adentro con la garganta (B) y sus rayitas oscuras
  {
    const umbelas = [[94, 80], [166, 62], [132, 116]];
    for (const [x, y] of umbelas) {
      tallo(9, x + azar(-10, 10), 251, x, y + 12, 2.8);
      let lado = r() < 0.5 ? 1 : -1;
      for (let yy = 238; yy > y + 70; yy -= azar(26, 36)) {
        trazo(9, x + azar(-3, 3), yy, ARRIBA + lado * azar(0.55, 1.0), azar(30, 40), 6.2, azar(0.34, 0.66), 'oval', VERDE);
        lado = -lado;
      }
      const n = 3 + (r() < 0.5 ? 1 : 0), a0 = azar(0, 6.28);
      for (let k = 0; k < n; k++) {
        const da = a0 + (k / n) * Math.PI * 2, fx = x + Math.cos(da) * 28, fy = y + Math.sin(da) * 17;
        pintarHoja(D, 9, x, y + 10, Math.atan2(fy - y - 10, fx - x), Math.hypot(fx - x, fy - y - 10), 1.3, 0.28, 0.4, 'tallo', VERDE);
        const mira = Math.atan2(fy - y + 4, fx - x);
        for (let t = 0; t < 6; t++) {
          const ang = mira + (t / 5 - 0.5) * 2.5 + azar(-0.1, 0.1), adentro = t === 2 || t === 3;
          trazo(9, fx, fy, ang, azar(27, 32), azar(10, 12.5), adentro ? azar(0.8, 0.95) : azar(0.68, 0.9), 'oval', adentro ? [0, 0.7] : FLOR);
          if (adentro) for (let q = 0; q < 2; q++) pintarHoja(D, 9, fx + Math.cos(ang) * 4, fy + Math.sin(ang) * 4, ang + azar(-0.25, 0.25), azar(8, 12), 0.7, 0.18, 0.3, 'tallo', [0, 0.7]);
        }
      }
    }
  }
}
let atlasCartas = null;
// 3.4: el atlas de cartas (uno solo, se pinta la primera vez que se pide: al armar el bosque)
export function texturaCartas() {
  if (atlasCartas) return atlasCartas;
  const t0 = performance.now();
  const t = new THREE.DataTexture(generarCartas(), CARTA_ANCHO, CARTA_ALTO, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.generateMipmaps = true;
  t.minFilter = 1008;   // LinearMipmapLinearFilter (el three local no exporta la constante)
  t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = 1001;   // ClampToEdgeWrapping
  t.needsUpdate = true;
  t.userData.ms = performance.now() - t0;
  atlasCartas = t;
  return t;
}

// 3.4: las cartas del LOD cercano, sobre el material vegetal (sin tocarlo, como el relevo
// del impostor). Cada esquina de carta lleva su desplazamiento en el plano de la vista
// (aCarta.xy, en metros) y su lugar en el atlas (aCarta.zw): la carta mira siempre a la
// cámara, se recorta con el alfa del atlas y modula el color del vértice con la luz pintada.
// Lo que no es carta (troncos, ramas, núcleos de los racimos) lleva aCarta en cero: no se
// mueve, no lee la textura y no recorta. El recorte vive sólo en el LOD cercano.
// En el LOD lejano (`recorte: false`) no hay textura ni recorte: las cartas son manchas
// lisas de borde lobulado (ver `mancha`; aCarta.z = su radio, aCarta.w = 1) y la normal de
// cada vértice se rehace en la vista como la de una bola (hacia la cámara en el centro,
// abierta hacia el borde): de lejos cada racimo es una masa redonda con luz suave.
function conCartas(m, textura, { recorte = true } = {}) {
  const previo = m.onBeforeCompile;
  // (el cercano y el lejano comparten el texto de esta función: la clave del programa tiene
  // que distinguirlos, si no three les daría el mismo shader)
  const clavePrevia = m.customProgramCacheKey();
  m.customProgramCacheKey = () => clavePrevia + '|cartas-3.4-' + (recorte ? 'recorte' : 'manchas');
  const uCartasVeg = { value: textura };
  m.userData.cartas = textura;
  m.onBeforeCompile = (sh, r) => {
    previo(sh, r);
    sh.uniforms.uCartasVeg = uCartasVeg;
    sh.uniforms.uInviernoCarta = U.uInvierno;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 aCarta; uniform float uInviernoCarta; varying vec3 vCartaVeg;${recorte ? '' : ' varying vec3 vDiscoVeg;'}`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        {
          float esCarta = step(1e-6, dot(aCarta.xy, aCarta.xy));
          float escCarta = 1.0;
          mat4 mundoCarta = modelMatrix;
          #ifdef USE_INSTANCING
            escCarta = (length(instanceMatrix[0].xyz) + length(instanceMatrix[1].xyz) + length(instanceMatrix[2].xyz)) / 3.0;
            mundoCarta = modelMatrix * instanceMatrix;
          #endif
          // el invierno pela a los caducos: sus cartas se cierran junto con el follaje
          float vivaCarta = (aTipo > 1.5 && aTipo < 3.5 && uInviernoCarta > 0.5) ? 0.0 : 1.0;
          mvPosition.xy += aCarta.xy * escCarta * vivaCarta;
          gl_Position = projectionMatrix * mvPosition;
          // 3.4 (sotobosque): también llevan textura las piezas fijas con su lugar en el atlas
          // y sin desplazamiento (las frondas de los helechos: aCarta = 0, 0, u, v)
          vCartaVeg = vec3(aCarta.zw, max(esCarta, step(1e-6, aCarta.z + aCarta.w)));
          ${recorte ? '' : `if (aCarta.w > 0.5) {
            // 3.4 (lod): la coordenada de la mancha (0 en el centro, ≈1.1 en el borde de la
            // geometría): aCarta.z es el radio de cada vértice, así la elipse queda redonda acá
            vec2 discoM = aCarta.xy / max(aCarta.z, 1e-3);
            vec3 nVistaC = normalize(vec3(discoM * 0.86, 0.6) + transformedNormal * 0.55);
            transformedNormal = nVistaC;
            vNormal = nVistaC;
            objectNormal = inverse(mat3(mundoCarta)) * (vec4(nVistaC, 0.0) * viewMatrix).xyz;
            // 3.4 (sotobosque): la mancha lleva adentro las hojas pintadas de la celda de su
            // racimo (aCarta.w = 1 + celda), sin recorte: de lejos se lee follaje, no una nube
            float celdaM = floor(aCarta.w - 0.5);
            vec2 cuM = vec2(mod(celdaM, 4.0) + 0.5, floor(celdaM / 4.0) + 0.5) * 0.25;
            vCartaVeg = vec3(cuM + vec2(discoM.x, -discoM.y) * 0.1, 1.0);
            // 3.4 (lod): las celdas redondas (densa, abierta) recortan el borde con sus hojas
            vDiscoVeg = vec3(discoM, celdaM < 1.5 ? 1.0 : 0.0);
          } else { vCartaVeg = vec3(0.0); vDiscoVeg = vec3(0.0); }`}
        }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uCartasVeg; varying vec3 vCartaVeg;`);
    if (!recorte) {
      sh.fragmentShader = sh.fragmentShader
        .replace('varying vec3 vCartaVeg;', 'varying vec3 vCartaVeg; varying vec3 vDiscoVeg;')
        .replace('#include <color_fragment>', `#include <color_fragment>
        float pincelM = 0.0;
        if (vCartaVeg.z > 0.5) {
          vec4 manchaVeg = texture2D(uCartasVeg, vCartaVeg.xy);
          // 3.4 (lod): el contorno no es un disco: hacia el borde la mancha se recorta con el
          // alfa de sus hojas pintadas (el umbral crece del centro al borde: el centro queda
          // macizo y el borde sale en puntas de hoja, como las cartas de cerca)
          float bordeM = smoothstep(0.5, 0.9, length(vDiscoVeg.xy)) * vDiscoVeg.z;
          if (manchaVeg.a < bordeM * mix(0.42, 0.28, smoothstep(40.0, 110.0, length(vViewPosition)))) discard;
          diffuseColor.rgb *= mix(0.86, mix(0.68, 1.12, manchaVeg.r), manchaVeg.a);
          pincelM = (manchaVeg.r - 0.55) * manchaVeg.a;
        }`)
        // 3.4 (lod): pincelada en la luz: cada hoja pintada clara gira su normal hacia el sol y
        // cada oscura en contra; el borde luz/sombra de la mancha sale quebrado por hojas, no
        // como el degradado liso de una bola
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (vCartaVeg.z > 0.5) normal = normalize(normal + normalize((viewMatrix * vec4(uSolDirVeg, 0.0)).xyz) * pincelM * 1.3);`);
      return;
    }
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        if (vCartaVeg.z > 0.5) {
          vec4 cartaVeg = texture2D(uCartasVeg, vCartaVeg.xy);
          // de lejos el mipmap promedia el alfa: el umbral baja para que la carta no adelgace
          if (cartaVeg.a < mix(0.5, 0.3, smoothstep(14.0, 70.0, length(vViewPosition)))) discard;
          diffuseColor.rgb *= mix(0.66, 1.1, cartaVeg.r);
        }`);
  };
  return m;
}

// 3.4: constructor de árboles: el de siempre, más el atributo de las cartas. Lo que entra
// por `agregar` (troncos, raíces, bultos viejos) lleva la carta en cero; `vertice` escribe un
// vértice a mano (racimos, tubos y cartas, con sus normales de follaje).
class ConstructorArbol extends Constructor {
  constructor() { super(); this.carta = []; }
  agregar(geo, o) {
    super.agregar(geo, o);
    while (this.carta.length < this.tipo.length * 4) this.carta.push(0, 0, 0, 0);
    return this;
  }
  vertice(x, y, z, nx, ny, nz, cr, cg, cb, tipo, k0 = 0, k1 = 0, k2 = 0, k3 = 0) {
    this.pos.push(x, y, z); this.nor.push(nx, ny, nz); this.col.push(cr, cg, cb); this.tipo.push(tipo); this.carta.push(k0, k1, k2, k3);
  }
  // soldada, como la del Constructor, con la carta en la clave
  geometria() {
    const mapa = new Map(), ind = [], P = [], Nn = [], Cc = [], Tt = [], K = [];
    const q = (v, k) => Math.round(v * k);
    for (let i = 0, n = this.pos.length / 3; i < n; i++) {
      const i3 = i * 3, i4 = i * 4;
      const clave = q(this.pos[i3], 1e4) + ',' + q(this.pos[i3 + 1], 1e4) + ',' + q(this.pos[i3 + 2], 1e4) + '|'
        + q(this.nor[i3], 1e3) + ',' + q(this.nor[i3 + 1], 1e3) + ',' + q(this.nor[i3 + 2], 1e3) + '|'
        + q(this.col[i3], 1e3) + ',' + q(this.col[i3 + 1], 1e3) + ',' + q(this.col[i3 + 2], 1e3) + '|' + this.tipo[i] + '|'
        + q(this.carta[i4], 1e4) + ',' + q(this.carta[i4 + 1], 1e4) + ',' + q(this.carta[i4 + 2], 1e5) + ',' + q(this.carta[i4 + 3], 1e5);
      let j = mapa.get(clave);
      if (j === undefined) {
        j = P.length / 3; mapa.set(clave, j);
        P.push(this.pos[i3], this.pos[i3 + 1], this.pos[i3 + 2]); Nn.push(this.nor[i3], this.nor[i3 + 1], this.nor[i3 + 2]);
        Cc.push(this.col[i3], this.col[i3 + 1], this.col[i3 + 2]); Tt.push(this.tipo[i]);
        K.push(this.carta[i4], this.carta[i4 + 1], this.carta[i4 + 2], this.carta[i4 + 3]);
      }
      ind.push(j);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
    g.setAttribute('aTipo', new THREE.Float32BufferAttribute(Tt, 1));
    g.setAttribute('aCarta', new THREE.Float32BufferAttribute(K, 4));
    g.setIndex(ind);
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

// 3.4: una carta suelta: cuatro esquinas en el mismo punto, abiertas en la vista por aCarta.
// `tinte(dy)` da el color de la esquina según su altura en la carta (abajo más oscuro).
function carta(c, x, y, z, n, ancho, alto, giro, cuelga, celda, tipo, tinte) {
  const cu = (celda % 4) * 0.25, cv = Math.floor(celda / 4) / FILAS_CARTA, cg = Math.cos(giro), sg = Math.sin(giro);
  const esq = [];
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const ox = sx * ancho, oy = sy * alto - cuelga;
    const col = tinte(oy);
    esq.push([ox * cg - oy * sg, ox * sg + oy * cg, cu + (0.03 + (sx * 0.5 + 0.5) * 0.94) * 0.25, cv + (0.03 + (0.5 - sy * 0.5) * 0.94) / FILAS_CARTA, col.r, col.g, col.b]);
  }
  for (const j of [0, 1, 2, 0, 2, 3]) { const e = esq[j]; c.vertice(x, y, z, n.x, n.y, n.z, e[4], e[5], e[6], tipo, e[0], e[1], e[2], e[3]); }
}

// 3.4: una mancha del LOD lejano: un disco de borde lobulado (17 vértices) en el punto del
// racimo, abierto en el plano de la vista por aCarta; el material lejano lo sombrea como una
// bola. El contorno queda redondo y en racimo desde cualquier lado (el icosaedro chico de
// antes se leía como un hexágono facetado).
// (3.4 sotobosque: `celda` es la del racimo: la mancha lleva adentro sus hojas pintadas)
function mancha(c, r, x, y, z, n, rx, ry, tipo, tinte, celda = 0) {
  // 16 puntos de borde: a 50 px un borde de 12 todavía se leía poligonal. El radio sube y
  // baja con dos ondas suaves (lóbulos redondeados, no puntas)
  // 3.4 (lod): la geometría es un poco más grande que la mancha que se ve (×1.12) y casi sin
  // lóbulos: el borde de verdad lo recorta el alfa de las hojas en el material lejano. Cada
  // vértice de borde lleva en aCarta.z su propio radio: el shader ve la elipse como círculo.
  const lados = 16, a0 = r() * Math.PI * 2, R = Math.max(rx, ry);
  const f1 = r() * 6.28, f2 = r() * 6.28, l1 = 4 + Math.floor(r() * 2);
  const cc = tinte(0), centro = [cc.r, cc.g, cc.b], borde = [];
  for (let k = 0; k < lados; k++) {
    const a = a0 + (k / lados) * Math.PI * 2, f = 1.12 + 0.04 * Math.sin(a * l1 + f1) + 0.03 * Math.sin(a * 3 + f2);
    const ox = Math.cos(a) * rx * f, oy = Math.sin(a) * ry * f, col = tinte(oy);
    borde.push([ox, oy, col.r, col.g, col.b, Math.hypot(ox, oy) / f]);
  }
  for (let k = 0; k < borde.length; k++) {
    const p = borde[k], q = borde[(k + 1) % borde.length];
    c.vertice(x, y, z, n.x, n.y, n.z, centro[0], centro[1], centro[2], tipo, 0, 0, R, 1 + celda);
    c.vertice(x, y, z, n.x, n.y, n.z, p[2], p[3], p[4], tipo, p[0], p[1], p[5], 1 + celda);
    c.vertice(x, y, z, n.x, n.y, n.z, q[2], q[3], q[4], tipo, q[0], q[1], q[5], 1 + celda);
  }
}
// 3.4: mientras se arma la geometría de la malla de sombras, los racimos lejanos son bultos
let paraSombra = false;
function geometriaSombra(armar) {
  paraSombra = true;
  try { return armar().geo; } finally { paraSombra = false; }
}

// 3.4: un racimo de follaje al estilo HushWood: un núcleo macizo (un bulto chico) y, en el LOD
// cercano, una corona de cartas pintadas que le dan el borde de ramillete. Las normales son
// de follaje: salen del centro del racimo como las de un elipsoide (un poco hacia el cielo),
// las mismas para el núcleo y las cartas, así el racimo se sombrea como una sola masa suave,
// sin facetas ni costuras entre piezas. El degradado también es del racimo: abajo y adentro
// oscuro y frío, arriba y afuera claro y tibio. Tiene su propio azar (`semilla`): el LOD
// cercano y el lejano salen con el mismo núcleo en el mismo lugar.
function racimo(c, semilla, cen, rad, o) {
  const r = rng(semilla);
  const tipo = o.tipo ?? 1, detalle = !!o.detalle, luz = o.luz ?? 1, cielo = o.cielo ?? 0.25;
  const [bajo, alto] = gradHoja(o.color, o.oscuro ?? 1);
  const col = new THREE.Color(), n = new THREE.Vector3(), p = new THREE.Vector3();
  const normal = (x, y, z) => {
    n.set((x - cen[0]) / (rad[0] * rad[0]), (y - cen[1]) / (rad[1] * rad[1]), (z - cen[2]) / (rad[2] * rad[2])).normalize();
    n.y += cielo;
    return n.normalize();
  };
  const tinte = (x, y, z, prof) => {
    const h = smoothstep(cen[1] - rad[1], cen[1] + rad[1] * 0.9, y);
    const t = clamp(0.1 + 0.62 * h + 0.55 * (prof - 0.72), 0, 1);
    return col.copy(bajo).lerp(alto, t).multiplyScalar((0.95 + 0.1 * h3(x * 3.1, y * 2.7, z * 3.9)) * luz);
  };
  // de lejos el racimo entero es una mancha que mira a la cámara (ver `mancha`), con el tono
  // medio de las cartas, más alta que el racimo (si no, se lee como un plato). Para la malla
  // de sombras (`paraSombra`) sigue siendo un bulto: la sombra no se arma con la vista.
  if (!detalle && !paraSombra) {
    // (del tamaño del racimo con sus cartas, que sobresalen del núcleo)
    const sx = (rad[0] + rad[2]) * 0.5 * (o.lejos ?? 1.25), sy = o.chato ? rad[1] * 1.3 : Math.max(rad[1] * 1.4, sx * 0.66);
    const nm = new THREE.Vector3(cen[0] * 0.25, 1, cen[2] * 0.25).normalize();
    mancha(c, r, cen[0], cen[1], cen[2], nm, sx, sy, tipo, (dy) => tinte(cen[0], cen[1] + dy * 0.7, cen[2], 0.86).multiplyScalar(0.9), o.celda ?? 0);
    return;
  }
  // el núcleo. De cerca es la sombra de adentro del racimo: más chico y más oscuro (la masa
  // y el borde los hacen las cartas). Para la sombra, del tamaño del racimo.
  // (3.4 sotobosque: 0.5 → 0.4: de abajo, entre las cartas, asomaba con borde duro)
  const k = detalle ? (o.nucleo ?? 0.4) : 1;
  const ky = detalle ? 1 : Math.max(1.25, (rad[0] * 0.66) / rad[1]);
  // (un icosaedro chico: de cerca queda oscuro y tapado por las cartas; si el racimo no
  // lleva cartas, uno más redondo)
  const g = abollar(new THREE.IcosahedronGeometry(1, detalle && !o.cartas ? 1 : 0), detalle ? 0.14 : 0.22, 1.3);
  const giro = new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28));
  const P = g.attributes.position, profNucleo = detalle ? 0.5 : 0.86;
  for (let i = 0; i < P.count; i++) {
    p.fromBufferAttribute(P, i).applyQuaternion(giro);
    const x = cen[0] + p.x * rad[0] * k, y = cen[1] + p.y * rad[1] * k * ky * (p.y < 0 ? 0.82 : 1), z = cen[2] + p.z * rad[2] * k;
    normal(x, y, z); tinte(x, y, z, profNucleo);
    // de cerca el núcleo es el adentro del racimo: hojas a la sombra, manchado y con la normal
    // casi hacia abajo (el sol no lo enciende entre las cartas, no se lee como una almohada
    // lisa); si el racimo no lleva cartas, el bulto normal. (3.4 sotobosque: menos hundido y
    // menos oscuro: entre los huecos de las cartas se leía como una masa negra)
    if (detalle && o.cartas) { n.set(n.x * 0.55, n.y * 0.55 - 0.6, n.z * 0.55).normalize(); col.multiplyScalar(0.86 + 0.34 * h3(x * 1.7, y * 1.9, z * 1.3)); } else if (!detalle) col.multiplyScalar(0.9);
    c.vertice(x, y, z, n.x, n.y, n.z, col.r, col.g, col.b, tipo);
  }
  g.dispose();
  if (!detalle || !o.cartas) return;
  // la corona de cartas: repartidas parejo sobre el racimo (espiral de Fibonacci) con azar
  const medio = (rad[0] + rad[1] + rad[2]) / 3, [ax, ay] = o.aspecto || [1, 1], N = o.cartas;
  for (let i = 0; i < N; i++) {
    // (corridas un poco hacia abajo: desde el piso del bosque se ve el fondo de los racimos)
    // (3.4 sotobosque: 0.08 → 0.14, más cartas abajo: tapan el núcleo desde el piso)
    const yy = clamp(1 - (2 * (i + 0.5)) / N - (o.bajar ?? 0.14), -1, 1), rr = Math.sqrt(1 - yy * yy), ph = i * 2.39996 + r() * 0.8;
    const prof = 0.8 + r() * 0.24;
    const x = cen[0] + Math.cos(ph) * rr * rad[0] * prof, y = cen[1] + yy * rad[1] * prof, z = cen[2] + Math.sin(ph) * rr * rad[2] * prof;
    const tam = medio * (o.tam ?? 0.5) * (0.82 + r() * 0.36);
    normal(x, y, z);
    carta(c, x, y, z, n, tam * ax, tam * ay, (r() - 0.5) * (o.giro ?? 0.6), tam * ay * (o.colgar ?? 0.25), o.celda ?? 0, tipo, (dy) => tinte(x, y + dy * 0.5, z, prof));
  }
}

// 3.4: un tubo a lo largo de un camino de puntos (ramas, brazos del pehuén), con anillos de
// `lados` lados. `o.normal(x, y, z)` (opcional) pone normales de follaje; si no, las del tubo.
// `o.color(x, y, z, t)` da el color (t: 0 al pie, 1 en la punta).
function tubo(c, camino, radios, lados, o) {
  const T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), R = new THREE.Vector3();
  const u = camino.length - 1;
  R.set(camino[u][0] - camino[0][0], camino[u][1] - camino[0][1], camino[u][2] - camino[0][2]).normalize();
  const ref = Math.abs(R.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const anillos = camino.map((p, j) => {
    const a = camino[Math.max(0, j - 1)], b = camino[Math.min(u, j + 1)];
    T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    A.crossVectors(T, ref).normalize(); B.crossVectors(T, A);
    const anillo = [];
    for (let k = 0; k <= lados; k++) {
      const th = ((k % lados) / lados) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
      const nx = A.x * cs + B.x * sn, ny = A.y * cs + B.y * sn, nz = A.z * cs + B.z * sn;
      anillo.push([p[0] + nx * radios[j], p[1] + ny * radios[j], p[2] + nz * radios[j], nx, ny, nz, j / u]);
    }
    return anillo;
  });
  const tipo = o.tipo ?? 0;
  const poner = (v) => {
    // (3.4 sotobosque: `o.normal` recibe también la normal del tubo, por si la quiere mezclar)
    const n = o.normal ? o.normal(v[0], v[1], v[2], v[3], v[4], v[5]) : { x: v[3], y: v[4], z: v[5] };
    const col = o.color(v[0], v[1], v[2], v[6]);
    c.vertice(v[0], v[1], v[2], n.x, n.y, n.z, col.r, col.g, col.b, tipo);
  };
  for (let j = 0; j < u; j++) {
    for (let k = 0; k < lados; k++) {
      const a = anillos[j][k], b = anillos[j][k + 1], cc = anillos[j + 1][k + 1], d = anillos[j + 1][k];
      poner(a); poner(b); poner(cc); poner(a); poner(cc); poner(d);
    }
  }
}

// 3.4: una rama de madera que sale del tronco y termina adentro de su racimo (no lo
// atraviesa). Marrón rojizo, más oscura al pie; un poco arqueada hacia arriba.
function rama(c, desde, hasta, r0, r1, color, lados = 5) {
  const [bajo, alto] = gradTronco(color), col = new THREE.Color();
  const medio = [(desde[0] + hasta[0]) / 2, (desde[1] + hasta[1]) / 2 + Math.hypot(hasta[0] - desde[0], hasta[2] - desde[2]) * 0.08, (desde[2] + hasta[2]) / 2];
  tubo(c, [desde, medio, hasta], [r0, (r0 + r1) / 2, r1], lados, {
    color: (x, y, z, t) => col.copy(bajo).lerp(alto, 0.25 + 0.55 * t).multiplyScalar(0.94 + 0.12 * h3(x * 3.1, y * 2.7, z * 3.9)),
  });
}

// 3.4: el fuste con corteza pintada: el degradado de siempre (pie oscuro, arriba tibio) más
// una veta por columna de lados, que de cerca se lee como corteza con vetas verticales.
// `o.manchas` (arrayán): manchones claros sobre la corteza canela; `o.placas` (pehuén):
// la corteza en placas. `o.degradado` reemplaza el degradado de la corteza.
const ejeCurvo = (largo, curva) => (y) => { const t = clamp(y / largo, 0, 1); return [curva[0] * t * t, curva[1] * t * t]; };
function fuste(c, alto, r0, r1, curva, lados, filas, color, semilla, o = {}) {
  const eje = ejeCurvo(alto, curva), base = o.base || [0, 0, 0];
  const tono = (x, y, z) => {
    const [ex, ez] = eje(y);
    const ang = Math.atan2(z - ez, x - ex), columna = Math.round((ang / (Math.PI * 2) + 0.5) * lados) % lados;
    let t = 0.12 + 0.55 * smoothstep(0, alto * 0.75, y) + 0.6 * (h3(columna * 1.7 + semilla, semilla * 0.37, 2.1) - 0.5);
    if (o.placas) t += 0.3 * (h3(columna * 2.3, Math.floor(y / 0.9 + (columna % 2) * 0.5), semilla) - 0.5);
    if (o.manchas) t += 0.55 * smoothstep(0.35, 0.75, Math.sin(ang * 2 + y * 1.3 + semilla) * Math.sin(y * 0.8 - ang * 1.1 + semilla * 0.5));
    return t;
  };
  c.agregar(troncoCurvo(alto, r0, r1, curva, lados, filas), { color, degradado: o.degradado || gradTronco(color), tono, tipo: 0, variar: 0.05, matriz: matriz(base) });
}

// ---------------------------------------------------------------- especies
function copa(c, r, radio, pos, esc, color, tipo, detalle) {
  // 3.2: un bulto pintado: icosaedro con la silueta apenas abollada, normales esféricas
  // (luz suave, sin facetas) y el degradado de la base a las puntas. El LOD cercano va más
  // subdividido (la silueta se lee redonda, no poligonal); los vértices se sueldan, así
  // que el costo en la placa es de ~160 vértices por bulto.
  const g = abollar(new THREE.IcosahedronGeometry(radio, detalle ? 2 : 0), radio * (detalle ? 0.07 : 0.1), 0.9);
  // la base del bulto se aplana un poco: se lee como un estante de follaje, no como una bola
  aplanarBase(g, 0.62);
  const Mc = matriz(pos, [0, r() * 6.28, 0], esc);
  c.agregar(g, { color, degradado: gradHoja(color), rangoY: [-radio * 0.95, radio * 0.8], tipo, matriz: Mc, esferica: 1, variar: 0.05 });
  // RC15: un lóbulo secundario sólo en el LOD cercano rompe la silueta esférica
  // y da profundidad a la copa sin sumar draw calls (se fusiona en la geometría).
  if (detalle) {
    const ang = r() * Math.PI * 2;
    const rr = radio * (0.46 + r() * 0.12);
    const off = radio * (0.35 + r() * 0.18);
    const interior = '#' + new THREE.Color(color).multiplyScalar(0.74 + r() * 0.08).getHexString();
    // 3.2: el lóbulo también se subdivide y se aplana abajo (sin facetas)
    const sat = aplanarBase(abollar(new THREE.IcosahedronGeometry(rr, 1), rr * 0.08, 0.9), 0.62);
    c.agregar(sat, { color: interior, degradado: gradHoja(interior), rangoY: [-rr, rr * 0.8], tipo, matriz: matriz([pos[0] + Math.cos(ang) * off, pos[1] - radio * (0.05 + r() * 0.12), pos[2] + Math.sin(ang) * off], [0, r() * 6.28, 0], [esc[0] * 0.95, esc[1] * 0.88, esc[2] * 0.95]), esferica: 1, variar: 0.05 });
  }
}

// 3.2: aplana la mitad de abajo de una pieza centrada en el origen
function aplanarBase(g, f) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 0) p.setY(i, y * f); }
  return g;
}

// 3.2: un piso de conífera: una falda cónica cuyo borde termina en puntas (las ramas) y
// cuya cara de abajo se hunde hacia el tronco (de abajo se ve la sombra, no una tapa).
// El degradado va de adentro/abajo (oscuro) a las puntas de arriba (claro).
function pisoConifera(radio, h, lados) {
  const cima = [0, h * 0.5, 0], hueco = [0, -h * 0.18, 0];
  const borde = [];
  for (let i = 0; i < lados * 2; i++) {
    const a = (i / (lados * 2)) * Math.PI * 2;
    const punta = i % 2 === 0;
    const rr = radio * (punta ? 1 : 0.72) * (0.93 + 0.14 * h3(radio * 3.1, i * 1.7, h));
    // las puntas cuelgan (la falda del abeto) y los entrantes suben hacia el tronco
    borde.push([Math.cos(a) * rr, -h * 0.5 + (punta ? -h * 0.16 : h * 0.14), Math.sin(a) * rr]);
  }
  const pos = [];
  for (let i = 0; i < borde.length; i++) {
    const p = borde[i], q = borde[(i + 1) % borde.length];
    pos.push(...cima, ...q, ...p);    // cara de arriba, hacia afuera
    pos.push(...hueco, ...p, ...q);   // cara de abajo, hacia el suelo
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
const tonoPiso = (radio, h) => (x, y, z) => Math.hypot(x, z) / radio * 0.8 + smoothstep(-h * 0.2, h * 0.5, y) * 0.5;

// Ensanche basal y raíces superficiales: evita que los troncos parezcan clavados en el terreno.
function baseRaices(c, r, color, radio, detalle) {
  // 2.7.1: en el LOD lejano el ensanche no se llega a ver: se omite y se consume el
  // mismo azar, así el resto del árbol no cambia
  if (!detalle && LIGERO) { r(); return; }
  c.agregar(new THREE.CylinderGeometry(radio * 0.72, radio * 1.35, radio * 1.05, detalle ? 7 : 5), {
    color, degradado: gradTronco(color), rangoY: [-radio * 0.9, radio * 0.9], tipo: 0, variar: 0.06, suave: true, matriz: matriz([0, radio * 0.42, 0], [0, r() * 6.28, 0], [1, 1, 1]),
  });
  if (!detalle) return;
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2 + r() * 0.45;
    const largo = radio * (1.5 + r() * 0.65);
    const raiz = new THREE.CylinderGeometry(radio * 0.10, radio * 0.24, largo, 5);
    c.agregar(raiz, { color: gradTronco(color)[0], tipo: 0, variar: 0.06, suave: true, matriz: matriz([Math.cos(ang) * largo * 0.36, radio * 0.12, Math.sin(ang) * largo * 0.36], [Math.PI / 2 - 0.10, -ang, 0]) });
  }
}

// 3.4: colores de las ramas: marrón rojizo (las ramas que sostienen los racimos se ven)
const COLOR_RAMA = { coihue: '#5c3f2d', lenga: '#644634', nire: '#5a4131', maiten: '#66503c', arrayan: '#9c5a32', pehuen: '#5f5246', seco: '#5b5149' };

// 3.4: el coihue es el gigante del bosque húmedo: fuste recto y alto, la copa arriba en
// capas. Las capas son racimos anchos colgados de sus ramas que suben en espiral alrededor
// del fuste (cada uno corrido hacia otro lado y montado sobre el de abajo): se lee en pisos
// irregulares, con masa y borde de ramillete, no en platos apilados. Arriba, una cúpula. El
// LOD lejano tiene los mismos racimos (sin cartas ni ramas, un poco más grandes).
function coihue(semilla, detalle) {
  const r = rng(semilla), c = new ConstructorArbol();
  const alto = 23 + r() * 7;
  const curva = [(r() - 0.5) * 1.2, (r() - 0.5) * 1.2];
  fuste(c, alto * 0.92, 0.66, 0.2, curva, detalle ? 10 : ladosLejos(6, detalle), detalle ? 6 : filasLejos(4, detalle), '#4d3b2c', semilla);
  const eje = ejeCurvo(alto * 0.92, curva);
  const n = alto > 27 ? 9 : 8;
  let ang = r() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), ultimo = i === n - 1;
    const y = alto * (0.5 + 0.44 * t) + (r() - 0.5) * 0.8;
    const [ex, ez] = eje(y);
    const rx = (ultimo ? 2.1 : 3.1 - 1.2 * t) * (0.85 + r() * 0.3);
    const ry = rx * (ultimo ? 0.7 : 0.56 + r() * 0.12);
    const d = ultimo ? 0.2 : rx * (0.5 + r() * 0.3);
    const cen = [ex + Math.cos(ang) * d, y, ez + Math.sin(ang) * d];
    if (detalle && !ultimo) rama(c, [ex, y - ry * 1.4, ez], [cen[0] - Math.cos(ang) * rx * 0.15, cen[1] - ry * 0.25, cen[2] - Math.sin(ang) * rx * 0.15], 0.18 - 0.07 * t, 0.07, COLOR_RAMA.coihue);
    racimo(c, semilla * 7 + i * 13, cen, [rx, ry, rx * (0.85 + r() * 0.15)], { color: i % 2 ? '#2b5126' : '#34602c', tipo: 1, detalle, celda: CELDAS_CARTA.densa, cartas: 15, tam: 0.58, luz: 0.86 + 0.14 * t });
    ang += 2.4 + (r() - 0.5) * 0.7;
  }
  baseRaices(c, r, '#4d3b2c', 0.62, detalle);
  return { geo: c.geometria(), radio: 0.62, alto };
}

// 3.4: la lenga abre la copa en ramas largas que salen del fuste en pisos; cada rama termina
// en un abanico ancho y chato de hojitas aserradas (la carta abierta). Copa más rala que la
// del coihue, que deja ver ramas. Caduca: en invierno quedan el fuste y las ramas.
function lenga(semilla, detalle) {
  const r = rng(semilla), c = new ConstructorArbol();
  const alto = 13 + r() * 5;
  const curva = [(r() - 0.5) * 1.5, (r() - 0.5) * 1.5];
  fuste(c, alto * 0.8, 0.45, 0.16, curva, detalle ? 9 : ladosLejos(6, detalle), detalle ? 5 : filasLejos(3, detalle), '#5a4a3e', semilla);
  const eje = ejeCurvo(alto * 0.8, curva);
  const n = 6;
  let ang = r() * Math.PI * 2;
  for (let i = 0; i <= n; i++) {
    const t = i / n, cima = i === n;
    const y0 = alto * (cima ? 0.78 : 0.42 + 0.34 * t);
    const [ex, ez] = eje(y0);
    const rx = (cima ? 2.0 : 2.7 - 0.7 * t) * (0.85 + r() * 0.3);
    const d = cima ? 0.3 : rx * (0.6 + r() * 0.3);
    const cen = [ex + Math.cos(ang) * d, y0 + (cima ? 1.2 : 1.5 + r() * 0.9), ez + Math.sin(ang) * d];
    const rad = [rx, rx * (cima ? 0.66 : 0.54), rx * (0.85 + r() * 0.15)];
    if (detalle && !cima) rama(c, [ex, y0, ez], [cen[0] - Math.cos(ang) * rx * 0.2, cen[1] - rad[1] * 0.3, cen[2] - Math.sin(ang) * rx * 0.2], 0.15, 0.05, COLOR_RAMA.lenga);
    racimo(c, semilla * 7 + i * 11, cen, rad, { color: i % 3 ? '#4f7a2c' : '#5c8a32', tipo: 2, detalle, celda: CELDAS_CARTA.abierta, cartas: 13, tam: 0.58, luz: 0.88 + 0.12 * t });
    ang += 2.4 + (r() - 0.5) * 0.5;
  }
  baseRaices(c, r, '#5a4a3e', 0.45, detalle);
  return { geo: c.geometria(), radio: 0.45, alto };
}

// Ñire: chico y retorcido, aguanta el frío y el suelo mojado
// 3.4: fuste corto y torcido que se abre en brazos (que se ven en los dos LOD: la copa es
// rala y los racimos no tocan el fuste), cada uno con su racimo de hojitas aserradas.
function nire(semilla, detalle) {
  const r = rng(semilla), c = new ConstructorArbol();
  const alto = 6.5 + r() * 3;
  const curva = [(r() - 0.5) * 2.6, (r() - 0.5) * 2.6];
  fuste(c, alto * 0.55, 0.34, 0.14, curva, detalle ? 8 : ladosLejos(6, detalle), detalle ? 4 : filasLejos(3, detalle), '#4e4136', semilla);
  const [ex, ez] = ejeCurvo(alto * 0.55, curva)(alto * 0.42);
  const brazos = 4 + (r() < 0.4 ? 1 : 0);
  for (let i = 0; i < brazos; i++) {
    const ang = (i / brazos) * Math.PI * 2 + r() * 0.8;
    const d = 1.4 + r() * 1.2, y = alto * (0.62 + r() * 0.26);
    const rx = 1.5 + r() * 0.6;
    const cen = [ex + Math.cos(ang) * d, y, ez + Math.sin(ang) * d];
    rama(c, [ex, alto * 0.42, ez], [cen[0] - Math.cos(ang) * rx * 0.3, cen[1] - rx * 0.2, cen[2] - Math.sin(ang) * rx * 0.3], 0.13, 0.05, COLOR_RAMA.nire, detalle ? 5 : 3);
    racimo(c, semilla * 5 + i * 17, cen, [rx, rx * 0.62, rx * 0.9], { color: i % 2 ? '#628a36' : '#73993c', tipo: 2, detalle, celda: CELDAS_CARTA.abierta, cartas: 11, tam: 0.55 });
  }
  baseRaices(c, r, '#4e4136', 0.34, detalle);
  return { geo: c.geometria(), radio: 0.32, alto };
}

// Maitén: copa redonda y ramas colgantes, en los claros y junto al agua
// 3.4: copa redonda y llena de hojitas verde claro, y alrededor, colgando del borde, la
// cortina de ramitas finas que le da el aire de sauce (cartas colgantes, sólo de cerca).
function maiten(semilla, detalle) {
  const r = rng(semilla), c = new ConstructorArbol();
  const alto = 10 + r() * 4;
  const curva = [(r() - 0.5) * 0.8, (r() - 0.5) * 0.8];
  fuste(c, alto * 0.62, 0.42, 0.16, curva, detalle ? 8 : ladosLejos(6, detalle), detalle ? 4 : filasLejos(3, detalle), '#6b5c4a', semilla);
  const [ex, ez] = ejeCurvo(alto * 0.62, curva)(alto * 0.62);
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const cima = i === n, ang = (i / n) * Math.PI * 2 + r() * 0.6, d = cima ? 0 : 1.9 + r() * 0.6;
    const y = alto * (cima ? 0.88 : 0.7 + r() * 0.1), rx = cima ? 2.4 : 2.1 + r() * 0.5;
    const cen = [ex + Math.cos(ang) * d, y, ez + Math.sin(ang) * d];
    if (detalle && !cima) rama(c, [ex, alto * 0.58, ez], [cen[0] * 0.75 + ex * 0.25, y - rx * 0.3, cen[2] * 0.75 + ez * 0.25], 0.14, 0.06, COLOR_RAMA.maiten);
    racimo(c, semilla * 3 + i * 19, cen, [rx, rx * 0.72, rx], { color: i % 2 ? '#6d9140' : '#7da34a', tipo: 2, detalle, celda: CELDAS_CARTA.densa, cartas: 12, tam: 0.5 });
  }
  if (detalle) {
    // la cortina: cartas largas que cuelgan del borde de la copa
    const [bajo, altoC] = gradHoja('#6d9140'), col = new THREE.Color(), nor = new THREE.Vector3();
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 + r() * 0.5, d = 3.0 + r() * 0.7, y = alto * (0.68 + r() * 0.06);
      nor.set(Math.cos(ang), 0.35, Math.sin(ang)).normalize();
      const largo = 0.7 + r() * 0.3;   // (medio alto de la carta)
      carta(c, ex + Math.cos(ang) * d, y, ez + Math.sin(ang) * d, nor, largo * 0.8, largo, (r() - 0.5) * 0.2, largo * 0.75, CELDAS_CARTA.colgante, 2,
        (dy) => col.copy(bajo).lerp(altoC, clamp(0.55 + dy * 0.25, 0, 1)));
    }
  }
  return { geo: c.geometria(), radio: 0.4, alto };
}

// Coirón: la mata dura y amarillenta que cubre la estepa
function coiron(semilla) {
  const r = rng(semilla), c = new Constructor();
  const hojas = 26 + Math.floor(r() * 12);
  for (let i = 0; i < hojas; i++) {
    const ang = r() * Math.PI * 2;
    const inclina = 0.12 + r() * 0.5;
    const largo = 0.55 + r() * 0.75;
    const color = i % 3 === 0 ? '#b8a46a' : i % 3 === 1 ? '#9c8f56' : '#c6b57e';
    c.agregar(new THREE.ConeGeometry(0.022, largo, 3), {
      color, tipo: 3, variar: 0.16,
      matriz: matriz([Math.cos(ang) * 0.09, largo * 0.45, Math.sin(ang) * 0.09],
        [Math.cos(ang) * inclina, ang, Math.sin(ang) * inclina]),
    });
  }
  return c.geometria({ soldar: true });
}

// 3.4: el ciprés de la cordillera: cónico y angosto, de follaje escamoso y denso. Los pisos
// son las faldas en punta de la 3.2 y, de cerca, cada falda lleva en el borde ramitas de
// escamas (cartas) que le rompen el contorno, con la misma normal de follaje del piso.
function cipres(semilla, detalle) {
  const r = rng(semilla), c = new ConstructorArbol();
  const alto = 14 + r() * 5;
  fuste(c, 3, 0.35, 0.28, [0, 0], detalle ? 7 : 6, 1, '#4a3a2e', semilla);
  // 3.2: más pisos (el abeto pintado se lee por capas)
  const pisos = detalle ? 8 : 5;
  const col = new THREE.Color(), nor = new THREE.Vector3(), rc = rng(semilla * 13 + 5);
  for (let i = 0; i < pisos; i++) {
    const t = i / pisos;
    const radio = 2.6 * (1 - t * 0.78);
    const h = alto * (0.34 - t * 0.08);
    // 3.2: cada piso es una falda con el borde en puntas (ver `pisoConifera`), como los
    // abetos pintados: se lee por capas y por silueta
    // 3.4 (sotobosque): de cerca la falda es el adentro del piso: un poco más chica y más
    // honda, así lo que se ve son las ramitas de escamas que la cubren (antes asomaban sus
    // caras planas grandes debajo de las cartas)
    const cono = pisoConifera(radio * (detalle ? 0.9 : 1.1), h, detalle ? 11 : 7);
    // 2.7: verde de ciprés más natural (antes casi negro a contraluz); 3.2: más turquesa
    const colorPiso = i % 2 ? '#214636' : '#284f3c';
    const px = (r() - 0.5) * 0.3, py = 2.2 + alto * t * 0.82 + h * 0.5, pz = (r() - 0.5) * 0.3;
    const Mp = matriz([px, py, pz], [0, r() * 6, 0]);
    // 2.7: la normal sale de un punto bajo el piso: mira hacia afuera y hacia arriba,
    // así el cono recibe el cielo como un árbol y no se sombrea como una bola
    c.agregar(cono, { color: colorPiso, degradado: gradHoja(colorPiso, detalle ? 0.8 : 1), tono: tonoPiso(radio * 1.08, h), tipo: 1, esferica: 1, centro: [0, -h * 0.9, 0], matriz: Mp, variar: 0.04 });
    if (!detalle) continue;
    // 3.4: las ramitas de escamas del borde del piso (con su propio azar: así los pisos del
    // LOD lejano quedan donde los del cercano)
    // 3.4 (sotobosque): más y más grandes, colgando del borde (los racimos colgantes de las
    // coníferas pintadas), y una segunda vuelta sobre la falda
    // (cuántas: lo justo para tapar la falda; cada carta recortada de más cuesta relleno de
    // pantalla cuando el ciprés está al lado)
    const [bajo, altoC] = gradHoja(colorPiso), n = Math.max(8, Math.round(17 - t * 9)), n2 = Math.max(3, Math.round(6 - t * 3)), a0 = rc() * 6.28;
    for (let k = 0; k < n + n2; k++) {
      const borde = k < n, a = a0 + (borde ? k / n : (k - n + 0.5) / n2) * Math.PI * 2 + (rc() - 0.5) * 0.5, d = radio * (borde ? 0.8 + rc() * 0.2 : 0.42 + rc() * 0.2);
      const x = px + Math.cos(a) * d, y = py - h * (borde ? 0.38 + rc() * 0.12 : 0.02 - rc() * 0.1), z = pz + Math.sin(a) * d;
      nor.set(x - px, y - (py - h * 0.9), z - pz).normalize();
      const tam = Math.max(0.5, radio * 0.52);
      carta(c, x, y, z, nor, tam * 0.9, tam, (rc() - 0.5) * 0.5, tam * (borde ? 0.45 : 0.25), CELDAS_CARTA.escamas, 1,
        (dy) => col.copy(bajo).lerp(altoC, clamp((borde ? 0.62 : 0.72) + dy * 0.3, 0, 1)));
    }
  }
  if (detalle) {
    // la punta: una ramita de escamas que sube
    const [bajo, altoC] = gradHoja('#284f3c');
    carta(c, 0, 2.2 + alto * 0.86 + 0.4, 0, nor.set(0, 1, 0.3).normalize(), 0.35, 0.75, 0, -0.3, CELDAS_CARTA.escamas, 1, (dy) => col.copy(bajo).lerp(altoC, clamp(0.7 + dy * 0.3, 0, 1)));
  }
  baseRaices(c, r, '#4a3a2e', 0.35, detalle);
  return { geo: c.geometria(), radio: 0.35, alto };
}

// 3.4: el arrayán: dos o tres troncos finos y retorcidos de corteza canela, lisa, con
// manchones claros; arriba, una copa densa de hojitas chicas verde oscuro (dos racimos por
// tronco, en los dos LOD).
function arrayan(semilla, detalle) {
  const r = rng(semilla), c = new ConstructorArbol();
  const troncos = 2 + Math.floor(r() * 2);
  const alto = 7 + r() * 3;
  for (let i = 0; i < troncos; i++) {
    const ang = (i / troncos) * Math.PI * 2 + r();
    const lean = [Math.cos(ang) * 1.6, Math.sin(ang) * 1.6], base = [Math.cos(ang) * 0.25, 0, Math.sin(ang) * 0.25];
    fuste(c, alto, 0.22, 0.08, lean, detalle ? 8 : ladosLejos(5, detalle) - (!detalle && LIGERO ? 1 : 0), detalle ? 6 : filasLejos(4, detalle), '#a6653c', semilla + i,
      { base, manchas: detalle, degradado: ['#874521', '#e2ad76'] });
    for (let k = 0; k < 2; k++) {
      const cen = [base[0] + lean[0] + (r() - 0.5) * 1.8, alto * (0.8 + r() * 0.2), base[2] + lean[1] + (r() - 0.5) * 1.8];
      const rx = 1.9 + r() * 0.6;
      racimo(c, semilla * 3 + i * 7 + k, cen, [rx, rx * 0.72, rx], { color: '#3a6030', tipo: 1, detalle, celda: CELDAS_CARTA.densa, cartas: 13, tam: 0.5 });
    }
  }
  return { geo: c.geometria(), radio: 0.4, alto };
}

// 3.4: el pehuén: fuste recto y columnar, de corteza gris en placas, y arriba el paraguas:
// verticilos de brazos casi horizontales, gruesos y vestidos de hojas en todo su largo (una
// cuerda de follaje), que en la punta se curvan hacia arriba en un cepillo (el candelabro).
// Bajo los verticilos, una masa chata que llena el paraguas: de lejos se lee denso.
function pehuen(semilla, detalle) {
  const r = rng(semilla), c = new ConstructorArbol();
  const alto = 17 + r() * 3;
  fuste(c, alto, 0.6, 0.36, [0, 0], detalle ? 10 : ladosLejos(7, detalle), detalle ? 9 : filasLejos(4, detalle), '#6a5a4c', semilla, { placas: detalle });
  const copaCen = [0, alto * 0.81, 0], copaRad = [6.4, 3.6, 6.4];
  const colA = new THREE.Color(), nor = new THREE.Vector3(), rc = rng(semilla * 13 + 5), rs = rng(semilla * 17 + 3);
  // normales de follaje de todo el paraguas: arriba claro, abajo en sombra
  // (3.4 sotobosque: más cielo en las normales y la base más clara: de abajo los brazos se
  // veían casi negros)
  const normalCopa = (x, y, z) => nor.set(x / (copaRad[0] * copaRad[0]), (y - copaCen[1]) / (copaRad[1] * copaRad[1]) + 0.3, z / (copaRad[2] * copaRad[2])).normalize();
  const tinteCopa = (hex) => { const [bajo, altoC] = gradHoja(hex); return (x, y, z, t) => colA.copy(bajo).lerp(altoC, clamp(0.36 + 0.44 * smoothstep(copaCen[1] - 2.5, copaCen[1] + 2.0, y) + 0.2 * t, 0, 1)).multiplyScalar(0.95 + 0.1 * h3(x * 3.1, y * 2.7, z * 3.9)); };
  // (3.4 sotobosque: la masa chata que llena el paraguas, sólo de lejos: de cerca los
  // verticilos ya son tupidos y desde abajo se veía como un bulto negro)
  if (!detalle) racimo(c, semilla * 3 + 1, [0, alto * 0.83, 0], [2.3, 0.8, 2.3], { color: '#2a4c2c', tipo: 1, detalle, nucleo: 0.95, lejos: 1.6, chato: true, cielo: 0.1 });
  // 3.4 (sotobosque): cinco verticilos de brazos GRUESOS (cuerdas de hojas escamosas, como
  // cepillos), rectos y que suben apenas, con la punta levantada; los de abajo más largos (el
  // paraguas del pehuén viejo) y cada verticilo girado respecto del de abajo. Antes eran
  // cuerdas finas que caían y se leían como las hojas de una palmera.
  // [altura, brazos, largo, subida por metro]: cinco pisos SEPARADOS a lo largo del último
  // tercio del fuste (entre piso y piso se ve el tronco), todos casi horizontales (apenas
  // caídos, los de abajo un poco más) con la punta que se levanta: la cúpula chata del
  // pehuén viejo, abajo largos y arriba cortos. (Con pisos juntos y brazos que subían, desde
  // abajo se leía una palmera o un plumero.)
  const pisos = [[alto * 0.6, 7, 6.2, -0.09], [alto * 0.69, 6, 5.7, -0.07], [alto * 0.78, 6, 5.0, -0.05], [alto * 0.87, 5, 4.2, -0.03], [alto * 0.95, 5, 3.2, 0.0]];
  pisos.forEach(([y, brazos, largo, sube], p) => {
    for (let i = 0; i < brazos; i++) {
      const ang = (i / brazos + p * 0.37) * Math.PI * 2 + r() * 0.4, ca = Math.cos(ang), sa = Math.sin(ang);
      const colorB = i % 2 ? '#2e5532' : '#365e36', tinte = tinteCopa(colorB);
      // la cuerda: del fuste hacia afuera, recta y casi horizontal; la punta se levanta
      const en = (f, dy = 0) => [ca * largo * f, y + sube * largo * f + dy, sa * largo * f];
      const camino = [en(0, -0.1), en(0.35), en(0.7), en(0.9, 0.22), en(1, 0.8)];
      const radios = [0.26, 0.36, 0.37, 0.33, 0.2];
      // (de cerca la cuerda se sombrea redonda: mitad normal del tubo, mitad la de la copa)
      const normalBrazo = (x, y, z, nx, ny, nz) => { const q = normalCopa(x, y, z); return q.set(q.x * 0.5 + nx * 0.6, q.y * 0.5 + ny * 0.6 + 0.15, q.z * 0.5 + nz * 0.6).normalize(); };
      tubo(c, detalle ? camino : [camino[0], camino[2], camino[4]], detalle ? radios : [0.38, 0.5, 0.32], detalle ? 6 : 4, { tipo: 1, normal: detalle ? normalBrazo : normalCopa, color: tinte });
      // las ramas secundarias: cuerdas más cortas que salen del brazo a los costados, casi
      // horizontales: cada piso se lee como un plato tupido (no como brazos sueltos en abanico,
      // que de lejos parecían hojas de palmera). En los dos LOD (el cartel lejano sale de acá).
      const secundarias = p < 4 ? 3 : 2;
      for (let s = 0; s < secundarias; s++) {
        // (con su propio azar: en el LOD lejano salen en el mismo lugar que en el cercano)
        const f0 = 0.28 + s * (0.5 / secundarias) + rs() * 0.08, lado = s % 2 ? 1 : -1, giro = lado * (0.7 + rs() * 0.25);
        const dx = Math.cos(ang + giro), dz = Math.sin(ang + giro), L = largo * (0.44 - 0.18 * f0);
        const [x0, y0, z0] = en(f0);
        const ramita = [[x0, y0, z0], [x0 + dx * L * 0.55, y0 - 0.12, z0 + dz * L * 0.55], [x0 + dx * L, y0 + 0.18, z0 + dz * L]];
        tubo(c, detalle ? ramita : [ramita[0], ramita[2]], detalle ? [0.2, 0.22, 0.12] : [0.3, 0.2], detalle ? 5 : 3, { tipo: 1, normal: detalle ? normalBrazo : normalCopa, color: tinte });
        if (!detalle) continue;
        const nR = Math.max(2, Math.round(L / 0.5));
        for (let k = 1; k <= nR; k++) {
          const g = k / nR, x = x0 + dx * L * g, z = z0 + dz * L * g, yy = y0 + (g > 0.9 ? 0.32 : 0.02), tam = g > 0.9 ? 0.42 : 0.28 + 0.06 * rc();
          normalCopa(x, yy, z);
          carta(c, x, yy, z, nor, tam * 0.85, tam, (rc() - 0.5) * 1.2, -0.15 * tam, CELDAS_CARTA.cepillo, 1, (dy) => tinte(x, yy + dy * 0.3, z, 0.8));
        }
      }
      if (!detalle) continue;
      // el cepillo: a lo largo de toda la cuerda, cepillos chicos y tupidos de hojas duras
      // (la cuerda se lee erizada de escamas, gruesa); en la punta, uno más grande que sube;
      // y dos ramitas que cuelgan (las cuerdas secundarias)
      // (cepillos chicos: la cuerda queda gruesa pero no tapa el hueco entre pisos)
      const nC = Math.max(4, Math.round(largo / 0.45));
      for (let k = 1; k <= nC; k++) {
        const f = k / nC, punta = k === nC, tam = punta ? 0.62 : 0.32 + 0.08 * rc();
        const [x, yy, z] = en(f, punta ? 0.85 : f > 0.85 ? 0.25 : 0.06);
        normalCopa(x, yy, z);
        carta(c, x, yy, z, nor, tam * 0.85, tam, (rc() - 0.5) * (punta ? 0.3 : 1.2), -0.15 * tam, CELDAS_CARTA.cepillo, 1, (dy) => tinte(x, yy + dy * 0.3, z, 0.85));
      }
      // una ramita que cuelga, sólo en los pisos de abajo
      for (const f of p < 3 ? [0.55] : []) {
        const lado = rc() < 0.5 ? 1 : -1, [x0, y0, z0] = en(f, -0.3), x = x0 - sa * lado * 0.35, z = z0 + ca * lado * 0.35;
        normalCopa(x, y0, z);
        // (girada media vuelta: el cepillo cuelga del brazo; `cuelga` negativo la baja)
        carta(c, x, y0, z, nor, 0.55, 0.8, Math.PI + (rc() - 0.5) * 0.4, -0.7, CELDAS_CARTA.cepillo, 1, (dy) => tinte(x, y0 + dy * 0.5, z, 0.7));
      }
    }
  });
  // la guía de arriba: un cepillo que sube (de lejos, un racimo chico), sin la corona en
  // estrella de antes
  if (detalle) {
    const [x, yy, z] = [0, alto * 0.985, 0];
    normalCopa(x, yy + 1, z);
    carta(c, x, yy, z, nor, 0.5, 0.75, 0, -0.6, CELDAS_CARTA.cepillo, 1, tinteCopa('#365e36').bind(null, x, yy + 0.5, z, 0.9));
  } else racimo(c, semilla * 3 + 2, [0, alto * 0.985, 0], [1.0, 0.6, 1.0], { color: '#305630', tipo: 1, detalle, celda: CELDAS_CARTA.cepillo });
  return { geo: c.geometria(), radio: 0.62, alto };
}

// ---------------------------------------------------------------- sotobosque
// 3.4 (sotobosque): la fronda es una tira arqueada con la fronda pintada del atlas (raquis,
// pinnas y pínnulas, recortadas): la mata se lee plumosa como la costilla de vaca del bosque
// húmedo, no como una estrella de triángulos en punta. Cuatro tramos (8 triángulos) por
// fronda, con los bordes un poco caídos (la fronda tiene lomo). `ang`: hacia dónde sale;
// `eleva`: cuánto sube al salir; el arco la hace cabecear en la punta.
function frondaTexturada(c, x0, z0, ang, largo, ancho, arco, eleva, colorF, h0 = 0.05) {
  const [bajo, alto] = gradHoja(colorF), col = new THREE.Color(), nor = new THREE.Vector3();
  const cu = (CELDAS_CARTA.fronda % 4) * 0.25, cv = Math.floor(CELDAS_CARTA.fronda / 4) / FILAS_CARTA;
  const dx = Math.sin(ang), dz = Math.cos(ang), ce = Math.cos(eleva), se = Math.sin(eleva), w = ancho * 0.5;
  const filas = [];
  for (let j = 0; j <= 4; j++) {
    const t = j / 4, a = t * largo, u = arco * (t * 1.4 - t * t * 1.25) * largo;
    const al = a * ce - u * se, up = a * se + u * ce;
    const px = x0 + dx * al, py = h0 + up, pz = z0 + dz * al;
    nor.set(dx * 0.35, 1, dz * 0.35).normalize();
    col.copy(bajo).lerp(alto, 0.12 + 0.78 * t).multiplyScalar(0.93 + 0.14 * h3(px * 3.1, py * 2.7, pz * 3.9));
    const v = cv + (0.03 + (1 - t) * 0.94) / FILAS_CARTA;
    // (el pie, más angosto: la tira no asoma vacía al lado del raquis)
    const ww = w * (t === 0 ? 0.4 : 1), caida = ww * 0.24;
    filas.push([
      [px - dz * ww, py - caida, pz + dx * ww, cu + 0.03 * 0.25, v],
      [px + dz * ww, py - caida, pz - dx * ww, cu + 0.97 * 0.25, v],
      [nor.x, nor.y, nor.z, col.r, col.g, col.b],
    ]);
  }
  for (let j = 0; j < 4; j++) {
    const [a, b, k] = filas[j], [d, e, k2] = filas[j + 1];
    for (const [p, q] of [[a, k], [b, k], [e, k2], [a, k], [e, k2], [d, k2]]) c.vertice(p[0], p[1], p[2], q[0], q[1], q[2], q[3], q[4], q[5], 1, 0, 0, p[3], p[4]);
  }
}

function helecho(semilla) {
  const r = rng(semilla), c = new ConstructorArbol();
  // 3.3: 6 a 9 frondas (antes 7 a 10); 3.4 (sotobosque): 8 a 11, texturadas
  const n = 8 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + r() * 0.5;
    // 3.2: cada fronda va del verde hondo del pie al verde claro de la punta
    const largo = 1.05 + r() * 0.55, colorF = i % 2 ? '#43791f' : '#4f8826';
    frondaTexturada(c, Math.sin(ang) * 0.06, Math.cos(ang) * 0.06, ang, largo, 0.62 + r() * 0.14, 0.5 + r() * 0.3, 0.35 + r() * 0.4, colorF);
  }
  return c.geometria();
}

function nalca(semilla) {
  const r = rng(semilla), c = new Constructor();
  const n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + r();
    const largo = 0.55 + r() * 0.45, inc = 0.75 + r() * 0.35;
    const tx = Math.cos(ang) * Math.sin(inc) * largo, tz = Math.sin(ang) * Math.sin(inc) * largo, ty = Math.cos(inc) * largo;
    c.agregar(troncoCurvo(largo, 0.055, 0.035, [tx, tz], 5, 2), { color: '#6b5c2c', tipo: 0 });
    const hoja = new THREE.CircleGeometry(0.7 + r() * 0.3, 9, 0, Math.PI * 2);
    const p = hoja.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); p.setZ(k, (x * x + y * y) * 0.45 + Math.sin(Math.atan2(y, x) * 7) * 0.06); }
    const colorN = i % 2 ? '#3d7222' : '#477f28', radioN = 1.0;
    c.agregar(hoja, { color: colorN, degradado: gradHoja(colorN), tono: (x, y) => 0.3 + Math.hypot(x, y) / radioN * 0.7, tipo: 1, variar: 0.05, matriz: matriz([tx * 1.3, ty, tz * 1.3], [-Math.PI / 2 + 0.55, -ang + Math.PI / 2, 0]) });
  }
  return c.geometria({ soldar: true });
}

function colihue(semilla) {
  const r = rng(semilla), c = new Constructor();
  const n = 12 + Math.floor(r() * 6);
  for (let i = 0; i < n; i++) {
    const ang = r() * Math.PI * 2, d = r() * 0.5;
    const alto = 2.8 + r() * 2.2;
    const arco = [Math.cos(ang) * (0.8 + r() * 1.4), Math.sin(ang) * (0.8 + r() * 1.4)];
    const x0 = Math.cos(ang) * d, z0 = Math.sin(ang) * d;
    c.agregar(troncoCurvo(alto, 0.025, 0.012, arco, 3, 3), { color: '#9c9650', tipo: 0, matriz: matriz([x0, 0, z0]) });
    for (let k = 0; k < 2; k++) {
      const t = 0.62 + k * 0.22;
      c.agregar(lamina(0.55, 0.1, 0.2, 1), { color: '#6e8e38', tipo: 1, matriz: matriz([x0 + arco[0] * t * t, alto * t, z0 + arco[1] * t * t], [0.4 + r() * 0.5, r() * 6, 0]) });
    }
  }
  return c.geometria({ soldar: true });
}

function arbusto(semilla, colorHoja, colorFlor, flores, alto = 1) {
  const r = rng(semilla), c = new ConstructorArbol();
  const n = 4 + Math.floor(r() * 3);
  const puntos = [];
  for (let i = 0; i < n; i++) {
    const ang = r() * Math.PI * 2, d = r() * 0.55;
    const p = [Math.cos(ang) * d, (0.5 + r() * 0.5) * alto, Math.sin(ang) * d];
    puntos.push(p);
    // 3.4: matas de hojas (HushWood): cada bulto es un racimo con su corona de cartas de
    // hojas (la celda de la mata), con la base apoyada (sin facetas ni bola lisa)
    const rr = 0.62 + r() * 0.25;
    racimo(c, semilla * 31 + i, p, [rr, rr * 0.85, rr], { color: colorHoja, tipo: 1, detalle: true, celda: CELDAS_CARTA.mata, cartas: 8, tam: 0.62, nucleo: 0.62, bajar: 0, colgar: 0.1 });
    r(); r();   // (el giro del bulto de antes: así las flores quedan donde estaban)
  }
  for (let i = 0; i < flores; i++) {
    const b = puntos[i % puntos.length], ang = r() * Math.PI * 2, el = (r() - 0.3) * 1.2;
    const rr = 0.62;
    c.agregar(new THREE.TetrahedronGeometry(0.08, 0), { color: colorFlor, tipo: 3, variar: 0.2, matriz: matriz([b[0] + Math.cos(ang) * Math.cos(el) * rr, b[1] + Math.sin(el) * rr * 0.8, b[2] + Math.sin(ang) * Math.cos(el) * rr], [0, 0, 0], [1, 1.6, 1]) });
  }
  return c.geometria();
}

function notro(semilla) {
  const r = rng(semilla), c = new Constructor();
  const alto = 3 + r() * 1.5;
  c.agregar(troncoCurvo(alto, 0.12, 0.05, [r() - 0.5, r() - 0.5], 5, 3), { color: '#5b4a3a', tipo: 0 });
  for (let i = 0; i < 4; i++) {
    const p = [(r() - 0.5) * 1.4, alto * (0.6 + r() * 0.4), (r() - 0.5) * 1.4];
    copa(c, r, 0.8 + r() * 0.3, p, [1, 0.8, 1], '#3c5a26', 1, 0);
    for (let k = 0; k < 5; k++) {
      c.agregar(new THREE.ConeGeometry(0.07, 0.24, 3, 1, true), { color: '#c8261a', tipo: 3, variar: 0.15, matriz: matriz([p[0] + (r() - 0.5) * 1.3, p[1] + (r() - 0.3) * 0.9, p[2] + (r() - 0.5) * 1.3], [r() * 6, r(), r()]) });
    }
  }
  return c.geometria({ soldar: true });
}

// Hojarasca del piso del bosque: hojas secas, ramitas y pequeñas manchas de materia orgánica.
// Se instancia por parches para sumar detalle de contacto sin llenar la escena de objetos individuales.
function mantaHojarasca(semilla) {
  const r = rng(semilla), c = new Constructor();
  // 3.2: tonos cercanos al piso pintado del bosque (se integran, no salpican)
  const tonos = ['#6b5a37', '#76623c', '#5f5634', '#7d6a40'];
  for (let i = 0; i < 18; i++) {
    const ang = r() * Math.PI * 2, d = Math.sqrt(r()) * 1.25;
    const hoja = new THREE.CircleGeometry(0.09 + r() * 0.08, 5);
    c.agregar(hoja, { color: tonos[i % tonos.length], tipo: 0, variar: 0.08,
      matriz: matriz([Math.cos(ang) * d, 0.018 + r() * 0.012, Math.sin(ang) * d], [-Math.PI / 2 + (r() - 0.5) * 0.15, r() * 6.28, 0], [1.0, 0.45 + r() * 0.55, 1.0]) });
  }
  for (let i = 0; i < 3; i++) {
    const ang = r() * Math.PI * 2, largo = 0.45 + r() * 0.65;
    c.agregar(new THREE.CylinderGeometry(0.012, 0.018, largo, 4), { color: '#554535', tipo: 0, variar: 0.12,
      matriz: matriz([(r() - 0.5) * 1.4, 0.035, (r() - 0.5) * 1.4], [Math.PI / 2, -ang, 0]) });
  }
  return c.geometria({ soldar: true });
}

function arbolSeco(semilla, detalle) {
  // 3.4: con el constructor de árboles (el impostor lee las cartas, aunque acá no haya)
  const r = rng(semilla), c = new ConstructorArbol();
  const alto = 9 + r() * 7;
  const curva = [(r() - 0.5) * 1.3, (r() - 0.5) * 1.3];
  c.agregar(troncoCurvo(alto, 0.42 + r() * 0.16, 0.12, curva, 7, detalle ? 4 : 2), { color: '#665b50', degradado: gradTronco('#6b6055'), rangoY: [0, alto], tipo: 0, variar: 0.08 });
  const ramas = detalle ? 5 : 3;
  for (let i = 0; i < ramas; i++) {
    const ang = r() * Math.PI * 2;
    const y = alto * (0.45 + r() * 0.42);
    const largo = 1.4 + r() * 2.6;
    const rama = troncoCurvo(largo, 0.11, 0.025, [(r() - 0.5) * 0.5, (r() - 0.5) * 0.5], 5, 2);
    c.agregar(rama, { color: COLOR_RAMA.seco, tipo: 0, variar: 0.18, matriz: matriz([curva[0] * 0.4, y, curva[1] * 0.4], [0.9 + r() * 0.35, ang, 0]) });
  }
  return { geo: c.geometria(), radio: 0.42, alto };
}

function roca(semilla) {
  const r = rng(semilla), c = new Constructor();
  // 3.4: piedra redondeada y suave (HushWood): menos abollada y con las normales del todo
  // suaves (antes quedaban aristas)
  const g = abollar(new THREE.IcosahedronGeometry(1, 1), 0.15, 1.1);
  // 3.2: piedra gris azulada con un poco de musgo arriba (sin volverse una bola verde)
  c.agregar(g, { color: '#7a7e82', colorArriba: '#6d7452', tipo: 4, variar: 0.1, suave: 3, matriz: matriz([0, 0.15, 0], [r() * 0.3, r() * 6, r() * 0.3], [1 + r() * 0.4, 0.55 + r() * 0.2, 0.9 + r() * 0.3]) });
  return c.geometria({ soldar: true });
}

function troncoCaido(semilla) {
  const r = rng(semilla), c = new Constructor();
  const largo = 5 + r() * 4;
  const g = troncoCurvo(largo, 0.38, 0.28, [0, (r() - 0.5) * 0.6], 8, 4);
  c.agregar(g, { color: '#5b4635', colorArriba: '#4a6a2a', tipo: 4, variar: 0.12, matriz: matriz([0, 0.3, -largo / 2], [Math.PI / 2, 0, 0]) });
  c.agregar(new THREE.CircleGeometry(0.36, 8), { color: '#8a6f52', tipo: 0, matriz: matriz([0, 0.3, -largo / 2], [0, Math.PI, 0]) });
  return c.geometria({ soldar: true });
}


function discoContactoArbol() {
  const g = new THREE.CircleGeometry(1, 18);
  g.rotateX(-Math.PI / 2);
  return g;
}

// 3.3: el LOD simplificado le pasa el árbol al impostor con el mismo umbral por árbol del
// LOD (hash de la base): donde el cartel entra, el 3D sale. Mientras no hay impostores
// (antes de hornearlos) el relevo queda lejísimos y no cambia nada.
function conRelevoImpostor(m) {
  const previo = m.onBeforeCompile;
  m.userData.relevo = { uImpInicio: { value: 1e6 }, uImpFin: { value: 1e6 + 1 } };
  m.onBeforeCompile = (sh, r) => {
    previo(sh, r);
    Object.assign(sh.uniforms, m.userData.relevo);
    sh.vertexShader = 'uniform float uImpInicio; uniform float uImpFin;\n' + sh.vertexShader.replace(/\}\s*$/, `
  {
    float mascaraImp = hash12(floor(vRaizVeg * 4.0) + 17.0);
    if (mascaraImp < smoothstep(uImpInicio, uImpFin, length(vRaizVeg - cameraPosition.xz))) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
  }
}`);
  };
  return m;
}

// ---------------------------------------------------------------- distribución
export function generarVegetacion(T, calidad, escena) {
  const r = rng(777);
  const { fbm } = T.ruido;
  const dens = calidad.densidad;

  // RC31.2: anillo de 20 m en el que cada árbol cambia de LOD a su propia distancia
  // (umbral por instancia en el shader): el cambio se reparte y no hay dither en copa.
  const mezclaLod = 10;
  // 3.4: el atlas de cartas de follaje (se pinta acá, al cargar) y el LOD cercano que lo usa
  const cartas = texturaCartas();
  const mats = {
    arbol: {
      alta: conCartas(materialVegetal({ flex: 1, copa: true, lod: { modo: 1, inicio: Math.max(8, calidad.lod - mezclaLod), fin: calidad.lod + mezclaLod, lejos: calidad.lejos } }), cartas),
      baja: conCartas(conRelevoImpostor(materialVegetal({ flex: 1, copa: true, lod: { modo: 2, inicio: Math.max(8, calidad.lod - mezclaLod), fin: calidad.lod + mezclaLod, lejos: calidad.lejos } })), cartas, { recorte: false }),
    },
    // 3.4: las matas también llevan cartas de hojas (recortadas, como el LOD cercano)
    // 3.4 (sotobosque): de las dos caras, por las frondas de los helechos (las cartas miran a
    // la cámara: para ellas no cambia nada)
    arbusto: conCartas(materialVegetal({ flex: 3, copa: true, doble: true }), cartas),
    hierba: materialVegetal({ flex: 5, doble: true, detalle: false }),
    roca: materialVegetal({ flex: 0 }),
    suelo: materialVegetal({ flex: 0, doble: true, detalle: false }),
    contacto: new THREE.MeshBasicMaterial({ color: 0x211a14, transparent: true, opacity: 0.105, depthWrite: false, depthTest: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  };

  const tipos = {};
  const registrar = (nombre, alta, baja, mat, grupo, sombra = null) => {
    const compuesto = mat?.alta && mat?.baja;
    tipos[nombre] = { alta, baja, sombra, matAlta: compuesto ? mat.alta : mat, matBaja: compuesto ? mat.baja : mat, grupo };
  };
  // 3.4: cada árbol con sus tres geometrías: la cercana (cartas), la lejana (manchas que miran
  // a la cámara) y la de la malla de sombras (la lejana con bultos en vez de manchas)
  const arbol = (nombre, especie, semilla) => registrar(nombre, especie(semilla, true).geo, especie(semilla, false).geo, mats.arbol, 'arbol', geometriaSombra(() => especie(semilla, false)));
  for (let v = 0; v < 4; v++) {
    arbol('coihue' + v, coihue, 100 + v * 13);
    arbol('lenga' + v, lenga, 200 + v * 17);
    arbol('nire' + v, nire, 600 + v * 19);
  }
  for (let v = 0; v < 3; v++) arbol('cipres' + v, cipres, 300 + v * 23);
  arbol('arrayan', arrayan, 400);
  arbol('maiten', maiten, 700);
  arbol('pehuen', pehuen, 500);
  for (let v = 0; v < 2; v++) arbol('seco' + v, arbolSeco, 810 + v * 29);
  registrar('helecho', helecho(1), null, mats.arbusto, 'soto');
  registrar('nalca', nalca(2), null, mats.hierba, 'soto');
  registrar('colihue', colihue(3), null, mats.hierba, 'soto');
  registrar('chilco', arbusto(4, '#3a5d25', '#b31f55', 26, 1.1), null, mats.arbusto, 'soto');
  registrar('calafate', arbusto(5, '#4a5a2e', '#e0b12a', 10, 0.8), null, mats.arbusto, 'soto');
  registrar('notro', notro(6), null, mats.arbusto, 'soto');
  registrar('coiron', coiron(12), null, mats.arbusto, 'soto');
  registrar('neneo', arbusto(13, '#7d8a5a', '#c9b06a', 26, 0.7), null, mats.arbusto, 'soto');
  registrar('maqui', arbusto(9, '#37582a', '#2e2340', 22, 1.3), null, mats.arbusto, 'soto');
  registrar('chaura', arbusto(10, '#2f4a24', '#e8c3c6', 30, 0.55), null, mats.arbusto, 'soto');
  registrar('roca', roca(7), null, mats.roca, 'soto');
  registrar('tronco', troncoCaido(8), null, mats.roca, 'soto');
  registrar('hojarasca0', mantaHojarasca(31), null, mats.suelo, 'suelo');
  registrar('hojarasca1', mantaHojarasca(47), null, mats.suelo, 'suelo');
  registrar('contactoArbol', discoContactoArbol(), null, mats.contacto, 'contacto');

  const chunks = new Map();
  const colisiones = [];
  const arboles = [];     // para observar de cerca
  const plantas = [];     // sotobosque registrable
  const calafates = [];   // arbustos donde crecen frutos
  const matas = [];       // todo el sotobosque, para poder despejarlo si estorba

  const q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  function colocar(tipo, x, y, z, esc, rotY, inclinar = 0) {
    const cx = Math.floor((x + MITAD) / TAM_CHUNK), cz = Math.floor((z + MITAD) / TAM_CHUNK);
    const k = cx + ',' + cz;
    if (!chunks.has(k)) chunks.set(k, { cx, cz, x: (cx + 0.5) * TAM_CHUNK - MITAD, z: (cz + 0.5) * TAM_CHUNK - MITAD, listas: {}, mallas: [] });
    const ch = chunks.get(k);
    if (!ch.listas[tipo]) ch.listas[tipo] = [];
    e.set(inclinar * (r() - 0.5), rotY, inclinar * (r() - 0.5), 'YXZ');
    q.setFromEuler(e);
    const escala = typeof esc === 'number' ? s.set(esc, esc, esc) : s.set(esc[0], esc[1], esc[2]);
    ch.listas[tipo].push(new THREE.Matrix4().compose(p.set(x, y, z), q, escala));
    return { ch, tipo, i: ch.listas[tipo].length - 1 };
  }

  const lug = T.lugares;
  const miradorVista = lug.mirador;
  const finVistaMirador = { x: miradorVista.x + (LAGO.x - miradorVista.x) * 0.62, z: miradorVista.z + (LAGO.z - miradorVista.z) * 0.62 };
  const cerca = (l, x, z) => Math.hypot(x - l.x, z - l.z);
  const orillaLago = (x, z) => {
    const d = Math.hypot(x - LAGO.x, z - LAGO.z);
    return d - T.radioLago(Math.atan2(z - LAGO.z, x - LAGO.x)) * 0.95;
  };

  // ----- árboles
  const PASO = 6.4;
  for (let gz = -MITAD; gz < MITAD; gz += PASO) {
    for (let gx = -MITAD; gx < MITAD; gx += PASO) {
      const x = gx + r() * PASO, z = gz + r() * PASO;
      const azar = r();
      if (Math.abs(x) > 505 || Math.abs(z) > 505) continue;
      const b = T.val(T.bosque, x, z);
      const perfil = perfilHabitatPatagonico(T, x, z);
      // RC29: composición macro. El bosque deja de leerse como una densidad uniforme:
      // un ruido de gran escala consolida rodales y abre claros suaves. Desde el mirador
      // se conserva además una línea visual irregular hacia el lago.
      const macroRodal = fbm(x * 0.0046 + 18.7, z * 0.0046 - 11.2, 3) * 0.5 + 0.5;
      const corredorVista = corredorEscenico(x, z, miradorVista, finVistaMirador, 20);
      // En la estepa el bosque se disuelve: quedan árboles aislados de ecotono, no una grilla rala.
      const densidadArbol = (b * (1 - perfil.estepa * 0.82) + perfil.ecotono * 0.06)
        * factorRodalPatagonico(perfil, macroRodal, corredorVista);
      if (azar > densidadArbol * dens * 0.96) continue;
      if (T.agua(x, z)) continue;
      const h = perfil.h;
      const dArr = cerca(lug.arrayanes, x, z);
      const tirada = r();
      let especie = dArr < 75 && tirada < 0.9 ? 'arrayan' : elegirArbolPatagonico(perfil, tirada, r());
      if (!especie) continue;
      // Árboles muertos en pie: pocos, concentrados en rodales viejos/húmedos; aportan profundidad sin llenar el bosque de props.
      const seco = perfil.bosqueHumedo > 0.62 && r() < 0.018;
      let esc = 0.74 + r() * 0.48;
      // Edad/tamaño correlacionados en parches: un rodal viejo se lee como rodal, no como árboles aislados aleatorios.
      const edadParche = fbm(x * 0.008 + 71, z * 0.008 - 37, 2) * 0.5 + 0.5;
      esc *= 0.86 + edadParche * 0.3;
      if (especie === 'coihue' && perfil.bosqueHumedo > 0.68) esc *= 1.08;
      if (especie === 'lenga' && perfil.alto > 0.35) esc *= 0.72;
      if (especie === 'nire') esc *= perfil.alto > 0.45 ? 0.62 : 0.86;
      const forma = formaArbolPatagonico(especie, perfil, r());
      // El rodal comparte edad/porte, pero cada individuo conserva una silueta propia.
      // Se usa un hash espacial determinista para que la variedad no cambie entre partidas.
      const hashArbol = Math.abs((Math.floor(x * 1.73) * 73856093) ^ (Math.floor(z * 1.37) * 19349663));
      const variante4 = hashArbol % 4, variante3 = hashArbol % 3, variante2 = hashArbol % 2;
      let nombre = especie;
      if (seco) nombre = 'seco' + variante2;
      else if (especie === 'coihue' || especie === 'lenga' || especie === 'nire') nombre = especie + variante4;
      else if (especie === 'cipres') nombre = especie + variante3;
      const radioBase = seco ? 0.42 : ({ coihue: 0.62, lenga: 0.45, cipres: 0.35, arrayan: 0.45, nire: 0.32, maiten: 0.4 }[especie] || 0.4);
      const radio = radioBase * esc * Math.max(forma.sx, forma.sz) + 0.12;
      const escalaVisual = seco ? [esc * 0.92, esc * (0.78 + r() * 0.2), esc * 0.92] : [esc * forma.sx, esc * forma.sy, esc * forma.sz];
      const ref = colocar(nombre, x, h - 0.25, z, escalaVisual, r() * Math.PI * 2, (especie === 'arrayan' ? 0.05 : 0.025) + forma.inclinacion);
      // Mancha de contacto instanciada: oscurece la unión raíz/suelo sin añadir luces ni sombras dinámicas por árbol.
      const contactoRef = (!seco && perfil.estepa < 0.42 && esc > 0.66)
        ? colocar('contactoArbol', x, h + 0.018, z, [radio * 1.75, 1, radio * 1.45], r() * Math.PI * 2)
        : null;
      const choque = { x, z, r: radio };
      colisiones.push(choque);
      arboles.push({ x, z, y: h, especie: seco ? 'seco' : especie, esc, r: radio, ref, contactoRef, choque });
    }
  }

  // ----- pehuenes en el mirador
  {
    const m = lug.mirador;
    const vx = LAGO.x - m.x, vz = LAGO.z - m.z, vl = Math.hypot(vx, vz);
    const ubic = [[m.x - (vx / vl) * 13 + (vz / vl) * 7, m.z - (vz / vl) * 13 - (vx / vl) * 7, 1.15]];
    for (let i = 0; i < 7; i++) {
      const ang = r() * Math.PI * 2, d = 38 + r() * 40;
      ubic.push([m.x + Math.cos(ang) * d, m.z + Math.sin(ang) * d, 0.8 + r() * 0.3]);
    }
    for (const [x, z, esc] of ubic) {
      const h = T.altura(x, z);
      const ref = colocar('pehuen', x, h - 0.3, z, esc, r() * 6);
      const radioP = 0.62 * esc + 0.15;
      const contactoRef = colocar('contactoArbol', x, h + 0.018, z, [radioP * 1.8, 1, radioP * 1.5], r() * Math.PI * 2);
      const choque = { x, z, r: radioP };
      colisiones.push(choque);
      arboles.push({ x, z, y: h, especie: 'pehuen', esc, r: radioP, ref, contactoRef, choque });
    }
    lug.mirador.pehuen = { x: ubic[0][0], z: ubic[0][1] };
  }

  // ----- sotobosque
  const PASO_S = 3.3;
  for (let gz = -MITAD; gz < MITAD; gz += PASO_S) {
    for (let gx = -MITAD; gx < MITAD; gx += PASO_S) {
      const x = gx + r() * PASO_S, z = gz + r() * PASO_S;
      if (Math.abs(x) > 500 || Math.abs(z) > 500) continue;
      const k = T.indice(x, z);
      const b = T.bosque[k];
      const perfil = perfilHabitatPatagonico(T, x, z);
      const tirada = r();
      if (T.distSendero[k] < 2.2) continue;
      if (T.agua(x, z)) continue;
      const h = T.altura(x, z);
      const dAgua = Math.min(T.distRio[k] - T.anchoRio[k], Math.abs(orillaLago(x, z)));
      const humedo = smoothstep(16, 2, dAgua);
      const pend = T.pendiente[k];
      const parche = fbm(x * 0.03 + 3, z * 0.03, 2);
      let tipo = null, esc = 1;
      if (humedo > 0.2 && tirada < humedo * 0.22 * dens && dAgua > 1.2) { tipo = 'nalca'; esc = 0.8 + r() * 0.6; }
      else if (pend > 0.55 && tirada < 0.06) { tipo = 'roca'; esc = 0.6 + r() * 1.6; }
      const estepaAqui = perfil.estepa;
      // La estepa se arma en manchones de coirón/neneo y deja suelo expuesto entre matas.
      if (perfil.bioma === 'estepa' && r() < 0.5 + estepaAqui * 0.24) { tipo = r() < 0.78 ? 'coiron' : 'neneo'; esc = 0.72 + r() * 0.9; }
      else if (perfil.bioma === 'estepa' && r() < 0.64) { tipo = r() < 0.22 ? 'calafate' : null; esc = 0.8 + r() * 0.45; }
      else if (perfil.bioma === 'mallin' && r() < 0.28) { tipo = r() < 0.58 ? 'chaura' : 'helecho'; esc = 0.75 + r() * 0.55; }
      else if (perfil.bioma === 'ribera' && humedo > 0.35 && r() < 0.32) { tipo = r() < 0.58 ? 'nalca' : 'chilco'; esc = 0.8 + r() * 0.55; }
      else if (b > 0.28 && b < 0.85 && parche < -0.1 && r() < 0.16) { tipo = 'maqui'; esc = 0.85 + r() * 0.45; }
      else if (b > 0.45 && parche > 0.25 && tirada < 0.3 * dens) { tipo = 'colihue'; esc = 0.8 + r() * 0.4; }
      else if (b > 0.2 && tirada < (0.13 + humedo * 0.2) * dens) { tipo = 'helecho'; esc = 0.7 + r() * 0.6; }
      else if (bordeBosqueNatural(perfil) > 0.5 && (fbm(x * 0.017 + 41, z * 0.017 - 23, 2) * 0.5 + 0.5) > 0.6 && tirada < 0.075) { tipo = r() < 0.52 ? 'notro' : 'calafate'; esc = 0.78 + r() * 0.5; }
      else if (perfil.ecotono > 0.45 && tirada < 0.045) { tipo = r() < 0.58 ? 'notro' : 'calafate'; esc = 0.8 + r() * 0.45; }
      else if (h > 42 && b < 0.6 && tirada >= 0.075 && tirada < 0.115) { tipo = 'chaura'; esc = 0.8 + r() * 0.5; }
      else if (tirada < 0.012 + (dAgua < 6 ? 0.03 : 0)) { tipo = 'roca'; esc = 0.35 + r() * 1.1; }
      else if (b > 0.5 && tirada < 0.02) { tipo = 'tronco'; esc = 1; }
      if (!tipo) continue;
      const rot = r() * Math.PI * 2;
      const ref = colocar(tipo, x, h - (tipo === 'roca' ? 0.2 * esc : 0.05), z, esc, rot, tipo === 'tronco' ? 0 : 0.1);
      let choque = null;
      if (tipo === 'roca' && esc > 0.9) { choque = { x, z, r: esc * 0.9 }; colisiones.push(choque); }
      if (tipo === 'tronco') {
        const medio = 3.2 * esc, sx = Math.sin(rot) * medio, sz = Math.cos(rot) * medio;
        choque = { seg: true, ax: x - sx, az: z - sz, bx: x + sx, bz: z + sz, r: 0.45 };
        colisiones.push(choque);
      }
      matas.push({ x, z, tipo, ref, choque });
      if (tipo === 'calafate') calafates.push({ x, z, y: h, esc });
      if (['helecho', 'nalca', 'colihue', 'chilco', 'notro', 'maqui', 'chaura', 'coiron', 'neneo'].includes(tipo)) {
        const planta = { x, z, y: h, tipo };
        plantas.push(planta);
        matas[matas.length - 1].planta = planta;
      }
    }
  }

  // ----- piso orgánico del bosque
  // Parches bajos de hojas y ramitas integran visualmente troncos/sotobosque con el terreno.
  const PASO_H = 5.2;
  for (let gz = -MITAD; gz < MITAD; gz += PASO_H) {
    for (let gx = -MITAD; gx < MITAD; gx += PASO_H) {
      const x = gx + r() * PASO_H, z = gz + r() * PASO_H;
      if (Math.abs(x) > 495 || Math.abs(z) > 495 || T.agua(x, z)) continue;
      const k = T.indice(x, z), perfil = perfilHabitatPatagonico(T, x, z);
      if (T.distSendero[k] < 1.8 || perfil.estepa > 0.32 || perfil.bosque < 0.34) continue;
      const parche = clamp(perfil.bosque * 0.58 + perfil.bosqueHumedo * 0.36 - perfil.pendiente * 0.32, 0, 0.78);
      if (r() > parche * dens) continue;
      const escH = 0.65 + r() * 0.8;
      const variante = Math.abs((Math.floor(x * 0.9) * 31) ^ (Math.floor(z * 0.9) * 17)) % 2;
      colocar('hojarasca' + variante, x, T.altura(x, z) + 0.012, z, [escH * (0.85 + r() * 0.35), 1, escH], r() * Math.PI * 2);
    }
  }

  // ----- composición del paisaje RC29
  // Rocas y troncos caídos se agrupan a escala grande en vez de repartirse como ruido blanco.
  // Se registran en `matas` para que una obra futura pueda despejarlos, pero los ejemplares
  // decorativos pequeños no agregan colisión: mejor composición sin encarecer física.
  const composicionPaisaje = { rocas: 0, troncos: 0, gruposRoca: 0, gruposTronco: 0 };
  const PASO_P = 22;
  for (let gz = -MITAD + 11; gz < MITAD - 11; gz += PASO_P) {
    for (let gx = -MITAD + 11; gx < MITAD - 11; gx += PASO_P) {
      const cx = gx + (r() - 0.5) * 9, cz = gz + (r() - 0.5) * 9;
      if (Math.abs(cx) > 480 || Math.abs(cz) > 480 || T.agua(cx, cz)) continue;
      const perfil = perfilHabitatPatagonico(T, cx, cz);
      const macroRoca = fbm(cx * 0.0065 + 81, cz * 0.0065 - 19, 3) * 0.5 + 0.5;
      const macroMadera = fbm(cx * 0.0058 - 27, cz * 0.0058 + 64, 3) * 0.5 + 0.5;
      const firma = firmaComposicionPaisaje(perfil, macroRoca, macroMadera);
      const kCentro = T.indice(cx, cz);
      if (T.distSendero[kCentro] < 4.2) continue;

      if (r() < firma.roca * 0.15 * dens) {
        composicionPaisaje.gruposRoca++;
        const n = 2 + Math.floor(r() * 3);
        for (let j = 0; j < n; j++) {
          const a = r() * Math.PI * 2, d = 1.4 + r() * 6.5;
          const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
          if (T.agua(x, z) || T.distSendero[T.indice(x, z)] < 3.2) continue;
          const esc = 0.38 + r() * (0.7 + perfil.exposicion * 0.45);
          const ref = colocar('roca', x, T.altura(x, z) - 0.16 * esc, z,
            [esc * (0.78 + r() * 0.55), esc * (0.58 + r() * 0.38), esc * (0.82 + r() * 0.5)], r() * Math.PI * 2, 0.08);
          matas.push({ x, z, tipo: 'roca', ref, choque: null, decorativo: true });
          composicionPaisaje.rocas++;
        }
      }

      if (r() < firma.tronco * 0.13 * dens) {
        composicionPaisaje.gruposTronco++;
        const n = 1 + (r() < 0.28 ? 1 : 0);
        const direccion = r() * Math.PI * 2;
        for (let j = 0; j < n; j++) {
          const lateral = (j - (n - 1) * 0.5) * (2.0 + r() * 2.4);
          const x = cx + Math.cos(direccion + Math.PI / 2) * lateral + (r() - 0.5) * 2.0;
          const z = cz + Math.sin(direccion + Math.PI / 2) * lateral + (r() - 0.5) * 2.0;
          if (T.agua(x, z) || T.distSendero[T.indice(x, z)] < 3.0) continue;
          const esc = 0.72 + r() * 0.52;
          const ref = colocar('tronco', x, T.altura(x, z) - 0.04, z,
            [esc * (0.88 + r() * 0.22), esc * (0.9 + r() * 0.16), esc * (0.82 + r() * 0.26)], direccion + (r() - 0.5) * 0.45, 0.02);
          matas.push({ x, z, tipo: 'tronco', ref, choque: null, decorativo: true });
          composicionPaisaje.troncos++;
        }
      }
    }
  }

  // ----- mallas instanciadas por chunk
  const tinte = new THREE.Color();
  for (const ch of chunks.values()) {
    // 3.3: cada chunk es un grupo que entra a la escena sólo mientras tiene algo a la vista:
    // los chunks lejanos no se recorren en cada cuadro (ni para matrices ni para dibujar).
    ch.grupo = new THREE.Group();
    ch.grupo.matrixAutoUpdate = false;
    ch.grupo.updateMatrixWorld(true);
    ch.grupo.matrixWorldAutoUpdate = false;
    ch.enEscena = false;
    for (const [nombre, lista] of Object.entries(ch.listas)) {
      const t = tipos[nombre];
      const hacer = (geo, compartir, material) => {
        const im = new THREE.InstancedMesh(geo, material, lista.length);
        if (compartir) { im.instanceMatrix = compartir.instanceMatrix; if (compartir.instanceColor) im.instanceColor = compartir.instanceColor; }
        else {
          lista.forEach((M, i) => {
            im.setMatrixAt(i, M);
            // cada árbol con un tono apenas distinto
            if (t.grupo === 'arbol' || nombre === 'helecho' || nombre === 'colihue') {
              const v = 0.86 + r() * 0.26;
              im.setColorAt(i, tinte.setRGB(v * (0.95 + r() * 0.1), v, v * (0.92 + r() * 0.1)));
            }
          });
          im.instanceMatrix.needsUpdate = true;
          if (im.instanceColor) im.instanceColor.needsUpdate = true;
        }
        im.computeBoundingSphere();
        im.castShadow = false;
        im.receiveShadow = t.grupo === 'soto';
        im.matrixAutoUpdate = false;
        im.visible = false;
        // 3.3: la "alta" de un árbol sólo guarda datos (matrices y tintes que comparten la
        // simplificada, la de sombra, la compacta cercana y los impostores): no va a la escena.
        if (!(t.grupo === 'arbol' && !compartir)) ch.grupo.add(im);
        // Un chunk de vegetación no se mueve nunca: vive en el origen y lo que cambia
        // son las matrices de sus instancias, no su transformación. Con esto Three deja
        // de recorrerlo en el repaso de matrices de cada cuadro, y son casi cuatro mil
        // objetos: el repaso pasó de 1,22 ms a 0,47 ms por cuadro, dibujando lo mismo.
        im.updateMatrixWorld(true);
        im.matrixWorldAutoUpdate = false;
        return im;
      };
      const alta = hacer(t.alta, null, t.matAlta);
      const malla = { grupo: t.grupo, alta, baja: null, sombra: null };
      if (t.baja) {
        malla.baja = hacer(t.baja, alta, t.matBaja);
        if (calidad.sombras) {
          // silueta liviana que solo se usa para calcular sombras (3.4: con bultos, no manchas)
          malla.sombra = hacer(t.sombra || t.baja, alta, t.matBaja);
          malla.sombra.layers.set(1);
          malla.sombra.castShadow = true;
        }
      }
      ch.mallas.push(malla);
      if (!ch.porTipo) ch.porTipo = {};
      ch.porTipo[nombre] = [malla.alta, malla.baja, malla.sombra].filter(Boolean);
    }
    delete ch.listas;
  }

  // ----- 1.4: LOD cercano compacto
  // Antes, cada chunk de 120 m mandaba TODOS sus árboles con la geometría detallada
  // y el shader colapsaba los lejanos: ~1 millón de triángulos procesados de más en
  // calidad media. Ahora las mallas "alta" de cada chunk sólo guardan los datos
  // (matrices y tintes, compartidos con la simplificada y la de sombra) y se dibuja
  // una única malla por especie con los árboles que realmente están cerca.
  const radioCercano = calidad.lod + mezclaLod + 18;   // margen para lo que se camina entre actualizaciones
  const cercanas = {};
  for (const [nombre, t] of Object.entries(tipos)) {
    if (t.grupo !== 'arbol') continue;
    let total = 0;
    for (const ch of chunks.values()) for (const m of ch.mallas) if (m.alta && ch.porTipo?.[nombre]?.[0] === m.alta) total += m.alta.count;
    if (!total) continue;
    const capacidad = Math.min(total, 1400);
    const im = new THREE.InstancedMesh(t.alta, t.matAlta, capacidad);
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(capacidad * 3).fill(1), 3);
    im.count = 0;
    im.frustumCulled = false;   // las instancias rodean a la cámara: el culling por esfera no sirve
    im.castShadow = false;
    im.matrixAutoUpdate = false;
    escena.add(im);
    cercanas[nombre] = im;
  }
  let ultimaCam = null;
  // 2.2: la copia de los árboles cercanos se rehace cuando la cámara se movió de verdad
  // (el radio ya trae 18 m de margen para lo que se camina entre actualizaciones) o
  // cuando cambió alguna instancia. Antes se recopiaba y se volvía a subir a la placa
  // cada vez, aunque estuvieras quieto.
  const MOVIDA_PARA_COMPACTAR = 4;
  let compactoX = Infinity, compactoZ = Infinity, compactoSucio = true;
  function compactarCercanos(cam) {
    compactoX = cam.x; compactoZ = cam.z; compactoSucio = false;
    const r2 = radioCercano * radioCercano;
    for (const [nombre, im] of Object.entries(cercanas)) {
      const destM = im.instanceMatrix.array, destC = im.instanceColor.array, cap = im.instanceMatrix.count;
      let n = 0;
      for (const ch of chunks.values()) {
        if (Math.hypot(cam.x - ch.x, cam.z - ch.z) - TAM_CHUNK * 0.71 > radioCercano) continue;
        const fuente = ch.porTipo?.[nombre]?.[0];
        if (!fuente) continue;
        const M = fuente.instanceMatrix.array, C = fuente.instanceColor?.array;
        for (let i = 0; i < fuente.count && n < cap; i++) {
          const o = i * 16;
          if (M[o] === 0 && M[o + 5] === 0 && M[o + 10] === 0) continue;   // árbol despejado
          const dx = M[o + 12] - cam.x, dz = M[o + 14] - cam.z;
          if (dx * dx + dz * dz > r2) continue;
          destM.set(M.subarray(o, o + 16), n * 16);
          if (C) { destC[n * 3] = C[i * 3]; destC[n * 3 + 1] = C[i * 3 + 1]; destC[n * 3 + 2] = C[i * 3 + 2]; }
          n++;
        }
      }
      im.count = n;
      im.instanceMatrix.needsUpdate = true;
      im.instanceColor.needsUpdate = true;
    }
  }

  // ----- 3.4 (sotobosque): el sotobosque en bloques
  // Antes cada chunk dibujaba su pedazo de cada tipo (helechos, arbustos, piedras, troncos,
  // hojarasca, sombras de contacto): con 4 a 12 chunks a tiro, entre 50 y 150 dibujos sólo
  // para el piso del bosque. Ahora hay UNA malla por tipo, que junta las instancias de los
  // chunks a tiro (los mismos cortes por distancia de siempre, ver `actualizar`) que caen en
  // el cono de la vista (con margen) o a menos de 14 m. Se rehace antes de dibujar (en el
  // onBeforeRender de la escena, antes del recorte por cámara) cuando la cámara giró más de
  // 18°, se movió 4 m, cambió el campo visual o cambió algo a tiro (o se despejó una mata):
  // con el margen del cono, lo que entra a la pantalla ya está en la malla. Las mallas de
  // los chunks siguen guardando los datos (matrices y tintes), como las "alta" de los árboles.
  const sotoGrupo = new THREE.Group();
  sotoGrupo.name = 'sotobosque';
  sotoGrupo.matrixAutoUpdate = false;
  sotoGrupo.updateMatrixWorld(true);
  sotoGrupo.matrixWorldAutoUpdate = false;
  const bloques = [];
  for (const [nombre, t] of Object.entries(tipos)) {
    if (t.grupo === 'arbol') continue;
    let total = 0, conTinte = false;
    for (const ch of chunks.values()) { const f = ch.porTipo?.[nombre]?.[0]; if (f) { total += f.count; conTinte = conTinte || !!f.instanceColor; } }
    if (!total) continue;
    const im = new THREE.InstancedMesh(t.alta, t.matAlta, total);
    if (conTinte) im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(total * 3).fill(1), 3);
    im.count = 0;
    im.visible = false;
    im.frustumCulled = false;   // ya viene recortada por el cono de la vista
    im.castShadow = false;
    im.receiveShadow = t.grupo === 'soto';   // (como las de los chunks: el mismo programa)
    im.matrixAutoUpdate = false;
    im.updateMatrixWorld(true);
    im.matrixWorldAutoUpdate = false;
    im.name = 'soto-' + nombre;
    sotoGrupo.add(im);
    bloques.push({ nombre, im });
  }
  escena.add(sotoGrupo);
  const MOVIDA_SOTO = 4, GIRO_SOTO = 18 * Math.PI / 180, MARGEN_SOTO = 25 * Math.PI / 180, CERCA_SOTO = 14;
  let sotoSucio = true, sotoX = Infinity, sotoZ = Infinity, sotoRumbo = 0, sotoCono = -2, sotoClave = '';
  const statsSoto = { veces: 0, ms: 0, instancias: 0 };
  function compactarSoto(x, z, fx, fz, cosCono) {
    const t0 = performance.now();
    sotoSucio = false; sotoX = x; sotoZ = z;
    const c2 = CERCA_SOTO * CERCA_SOTO;
    let total = 0;
    for (const b of bloques) {
      const im = b.im, destM = im.instanceMatrix.array, destC = im.instanceColor?.array;
      let n = 0;
      for (const ch of chunks.values()) {
        const f = ch.porTipo?.[b.nombre]?.[0];
        if (!f || !f.userData.aTiro) continue;
        const M = f.instanceMatrix.array, C = f.instanceColor?.array;
        for (let i = 0; i < f.count; i++) {
          const o = i * 16;
          if (M[o] === 0 && M[o + 5] === 0 && M[o + 10] === 0) continue;   // despejada
          const dx = M[o + 12] - x, dz = M[o + 14] - z, d2 = dx * dx + dz * dz;
          if (d2 > c2 && dx * fx + dz * fz < cosCono * Math.sqrt(d2)) continue;
          destM.set(M.subarray(o, o + 16), n * 16);
          if (destC && C) { destC[n * 3] = C[i * 3]; destC[n * 3 + 1] = C[i * 3 + 1]; destC[n * 3 + 2] = C[i * 3 + 2]; }
          n++;
        }
      }
      im.count = n;
      im.visible = n > 0;
      // (se sube a la placa sólo lo usado)
      im.instanceMatrix.clearUpdateRanges();
      im.instanceMatrix.addUpdateRange(0, Math.max(16, n * 16));
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) { im.instanceColor.clearUpdateRanges(); im.instanceColor.addUpdateRange(0, Math.max(3, n * 3)); im.instanceColor.needsUpdate = true; }
      total += n;
    }
    statsSoto.veces++; statsSoto.ms = performance.now() - t0; statsSoto.instancias = total;
  }
  // antes de cada dibujo de la escena: ¿hace falta rehacer los bloques para esta cámara?
  function revisarSoto(camara) {
    if (!camara || !camara.isPerspectiveCamera || !bloques.length) return;
    const e = camara.matrixWorld.elements, x = e[12], z = e[14];
    // hacia dónde mira, en el plano (la columna z de la cámara apunta hacia atrás)
    let fx = -e[8], fz = -e[10];
    const h = Math.hypot(fx, fz);
    // el medio ángulo horizontal de la vista; mirando casi derecho arriba o abajo, sin cono
    const medio = Math.atan(Math.tan((camara.fov * Math.PI) / 360) * camara.aspect);
    const cono = h < 0.25 ? -2 : Math.cos(Math.min(Math.PI, medio + MARGEN_SOTO));
    if (h > 1e-6) { fx /= h; fz /= h; }
    const rumbo = Math.atan2(fx, fz);
    let giro = Math.abs(rumbo - sotoRumbo); if (giro > Math.PI) giro = 2 * Math.PI - giro;
    const clave = camara.fov + '|' + camara.aspect;
    if (sotoSucio || clave !== sotoClave || (cono > -1.5) !== (sotoCono > -1.5) || (cono > -1.5 && giro > GIRO_SOTO) || Math.hypot(x - sotoX, z - sotoZ) > MOVIDA_SOTO) {
      sotoClave = clave; sotoCono = cono; sotoRumbo = rumbo;
      compactarSoto(x, z, fx, fz, cono);
    }
  }
  const antesEscena = escena.onBeforeRender;
  escena.onBeforeRender = function (renderer, sc, camara, rt) {
    antesEscena.call(this, renderer, sc, camara, rt);
    revisarSoto(camara);
  };

  // ----- visibilidad según distancia
  function actualizar(cam, factorDetalle = 1) {
    const detalle = Math.max(0.68, Math.min(1, factorDetalle || 1));
    ultimaCam = cam;
    if (compactoSucio || Math.hypot(cam.x - compactoX, cam.z - compactoZ) > MOVIDA_PARA_COMPACTAR) compactarCercanos(cam);
    // 3.3: con impostores, el LOD simplificado sólo llega hasta donde entra el cartel y lo
    // dibuja una malla compacta por especie (como el LOD cercano), no un pedazo por chunk
    const alcanceArbol = calidad.lejos;
    impostores?.estacion();
    if (impostores && (medioSucio || Math.hypot(cam.x - medioX, cam.z - medioZ) > MOVIDA_MEDIA)) compactarMedios(cam);
    for (const ch of chunks.values()) {
      const d = Math.max(0, Math.hypot(cam.x - ch.x, cam.z - ch.z) - TAM_CHUNK * 0.7);
      let algo = false;
      for (const m of ch.mallas) {
        if (m.grupo === 'arbol') {
          // RC15: ambos LOD conviven sólo en un anillo acotado. El shader hace
          // un crossfade dither por distancia real al jugador, evitando popping.
          // 1.4: el LOD cercano lo dibuja la malla compacta de su especie.
          m.alta.visible = false;
          if (m.baja) m.baja.visible = !impostores && d < alcanceArbol + 8; // simplificada siempre disponible para que el crossfade no deje huecos dentro del chunk
          if (m.sombra) m.sombra.visible = d < 45;
          algo = algo || !!m.baja?.visible || !!m.sombra?.visible;
          continue;
        }
        // 3.4 (sotobosque): el sotobosque, la hojarasca y las sombras de contacto ya no se
        // dibujan por chunk: el chunk sólo dice si está a tiro (con los mismos cortes de
        // siempre) y las mallas en bloque de cada tipo juntan lo que hay a tiro y a la vista
        // (ver `compactarSoto`)
        let aTiro;
        if (m.grupo === 'suelo') {
          aTiro = d < Math.min(calidad.sotobosque, 52) * detalle;
        } else if (m.grupo === 'contacto') {
          aTiro = d < Math.min(calidad.sotobosque, 46) * detalle;
        } else {
          aTiro = d < calidad.sotobosque * detalle;
        }
        if (aTiro !== !!m.alta.userData.aTiro) { m.alta.userData.aTiro = aTiro; sotoSucio = true; }
        m.alta.visible = false;
      }
      // 3.3: el chunk entra o sale de la escena entero
      if (algo !== ch.enEscena) {
        ch.enEscena = algo;
        if (algo) escena.add(ch.grupo); else escena.remove(ch.grupo);
      }
    }
  }

  // ----- 3.3: impostores de los árboles lejanos (una sola malla para todo el valle)
  // Cada árbol tiene su instancia de cartel, con la misma matriz y el mismo tinte que su
  // instancia 3D; talar, el rayo, despejar y el rebrote la mueven junto con la del chunk.
  let impostores = null;
  const especiesImp = Object.entries(tipos).filter(([, t]) => t.grupo === 'arbol').map(([nombre, t]) => ({ nombre, geo: t.alta }));
  const filaImp = new Map(especiesImp.map((e, i) => [e.nombre, i]));
  function prepararImpostores(renderer) {
    if (impostores || !renderer) return impostores;
    const lista = [];
    for (const a of arboles) {
      const fila = filaImp.get(a.ref?.tipo);
      const m = mallasDe(a.ref)[0];
      if (fila === undefined || !m) continue;
      a.ref.imp = lista.length;
      const o = a.ref.i;
      lista.push({ fila, matriz: m.instanceMatrix.array.subarray(o * 16, o * 16 + 16), tinte: m.instanceColor ? m.instanceColor.array.subarray(o * 3, o * 3 + 3) : null });
    }
    const inicio = Math.max(calidad.lod + mezclaLod + 30, Math.min(110, calidad.lejos - 70));
    impostores = crearImpostores(renderer, especiesImp, lista, { inicio, fin: inicio + 25, lejos: calidad.lejos, cartas });
    mats.arbol.baja.userData.relevo.uImpInicio.value = inicio;
    mats.arbol.baja.userData.relevo.uImpFin.value = inicio + 25;
    escena.add(impostores.malla);
    crearMedias();
    if (ultimaCam) actualizar(ultimaCam);
    return impostores;
  }

  // ----- 3.3: banda media compacta. Con impostores, los árboles 3D simplificados quedan en
  // un anillo de ~35 a ~135 m: una malla por especie con los que caen en ese anillo (más un
  // margen para lo que se camina), en vez de un pedazo por chunk y especie.
  const medias = {};
  const MOVIDA_MEDIA = 12;
  let medioSucio = true, medioX = Infinity, medioZ = Infinity;
  function crearMedias() {
    for (const [nombre, t] of Object.entries(tipos)) {
      if (t.grupo !== 'arbol' || !t.baja) continue;
      let total = 0;
      for (const ch of chunks.values()) { const f = ch.porTipo?.[nombre]?.[0]; if (f) total += f.count; }
      if (!total) continue;
      const im = new THREE.InstancedMesh(t.baja, t.matBaja, total);
      im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(total * 3).fill(1), 3);
      im.count = 0;
      im.frustumCulled = false;   // rodea a la cámara, como la cercana
      im.castShadow = false; im.receiveShadow = false;
      im.matrixAutoUpdate = false;
      im.updateMatrixWorld(true);
      im.matrixWorldAutoUpdate = false;
      escena.add(im);
      medias[nombre] = im;
    }
    medioSucio = true;
  }
  function compactarMedios(cam) {
    medioX = cam.x; medioZ = cam.z; medioSucio = false;
    const radio = impostores.estado.uFin.value + 30, r2 = radio * radio;
    // adentro del LOD cercano el simplificado no se dibuja (el shader lo saca): no se copia
    const adentro = Math.max(0, Math.max(8, calidad.lod - mezclaLod) - MOVIDA_MEDIA - 4), a2 = adentro * adentro;
    for (const [nombre, im] of Object.entries(medias)) {
      const destM = im.instanceMatrix.array, destC = im.instanceColor.array, cap = im.instanceMatrix.count;
      let n = 0;
      for (const ch of chunks.values()) {
        if (Math.hypot(cam.x - ch.x, cam.z - ch.z) - TAM_CHUNK * 0.71 > radio) continue;
        const fuente = ch.porTipo?.[nombre]?.[0];
        if (!fuente) continue;
        const M = fuente.instanceMatrix.array, C = fuente.instanceColor?.array;
        for (let i = 0; i < fuente.count && n < cap; i++) {
          const o = i * 16;
          if (M[o] === 0 && M[o + 5] === 0 && M[o + 10] === 0) continue;   // talado o despejado
          const dx = M[o + 12] - cam.x, dz = M[o + 14] - cam.z, dd = dx * dx + dz * dz;
          if (dd > r2 || dd < a2) continue;
          destM.set(M.subarray(o, o + 16), n * 16);
          if (C) { destC[n * 3] = C[i * 3]; destC[n * 3 + 1] = C[i * 3 + 1]; destC[n * 3 + 2] = C[i * 3 + 2]; }
          n++;
        }
      }
      im.count = n;
      im.instanceMatrix.needsUpdate = true;
      im.instanceColor.needsUpdate = true;
    }
  }

  // RC22: índices estáticos para interacción y despeje. Árboles/matas no se mueven,
  // así que se construyen una sola vez y luego las consultas cercanas son locales.
  const indiceArboles = crearIndiceEspacial2D(24);
  const indiceMatas = crearIndiceEspacial2D(18);
  indiceArboles.reconstruir(arboles, (o) => o);
  indiceMatas.reconstruir(matas, (o) => o);
  const scratchArboles = [], scratchMatas = [];
  function arbolesCerca(x, z, radio, salida = scratchArboles) { return indiceArboles.consultar(x, z, radio, salida); }
  function matasCerca(x, z, radio, salida = scratchMatas) { return indiceMatas.consultar(x, z, radio, salida); }

  const cero = new THREE.Matrix4().makeScale(0, 0, 0);
  // Saca árboles y matas que hayan quedado encima de una construcción, y apaga su choque
  function despejar(x, z, radio, incluirSoto = true) {
    let sacados = 0;
    const quitar = (e) => {
      if (!e.ref || e.sacado) return;
      e.sacado = true; sacados++;
      for (const ref of [e.ref, e.contactoRef].filter(Boolean)) {
        for (const m of (ref.ch.porTipo?.[ref.tipo] || [])) {
          m.setMatrixAt(ref.i, cero);
          m.instanceMatrix.needsUpdate = true;
        }
        if (impostores && ref.imp !== undefined) impostores.ponerMatriz(ref.imp, cero.elements);
      }
      if (e.choque) e.choque.apagado = true;
      if (e.planta) e.planta.sacado = true;
      compactoSucio = true;
      medioSucio = true;
      sotoSucio = true;   // 3.4 (sotobosque): la mata sale también de su bloque
    };
    for (const a of arbolesCerca(x, z, radio + 4)) { const dx = a.x - x, dz = a.z - z; if (dx * dx + dz * dz < (radio + a.r) * (radio + a.r)) quitar(a); }
    if (incluirSoto) for (const m of matasCerca(x, z, radio + 1)) { const dx = m.x - x, dz = m.z - z; if (dx * dx + dz * dz < radio * radio) quitar(m); }
    return sacados;
  }

  // ---------------------------------------------------------------- talar y rebrotar
  // Al talar, el árbol no desaparece: se viene abajo hacia donde estás, queda el tocón,
  // y con los días el tocón rebrota hasta volver a ser el mismo árbol (misma instancia).
  const _M = new THREE.Matrix4(), _p2 = new THREE.Vector3(), _q2 = new THREE.Quaternion(), _s2 = new THREE.Vector3();
  const _qGiro = new THREE.Quaternion(), _eje = new THREE.Vector3();
  function mallasDe(ref) { return ref?.ch.porTipo?.[ref.tipo] || []; }
  // La matriz original se guarda la primera vez que hace falta: las listas de chunk
  // se descartan al construir las mallas, así que la fuente es la propia instancia.
  function matrizDe(a) {
    if (a.matriz0) return a.matriz0;
    const m = mallasDe(a.ref)[0];
    if (!m) return null;
    a.matriz0 = new THREE.Matrix4().fromArray(m.instanceMatrix.array, a.ref.i * 16);
    if (m.instanceColor) a.tinte0 = Array.from(m.instanceColor.array.subarray(a.ref.i * 3, a.ref.i * 3 + 3));
    const mc = mallasDe(a.contactoRef)[0];
    if (mc) a.matrizContacto = new THREE.Matrix4().fromArray(mc.instanceMatrix.array, a.contactoRef.i * 16);
    return a.matriz0;
  }
  function ponerMatriz(ref, M) {
    compactoSucio = true;
    for (const m of mallasDe(ref)) { m.setMatrixAt(ref.i, M); m.instanceMatrix.needsUpdate = true; }
    // 3.3: el impostor del árbol sigue a su instancia del chunk (y la banda media se rehace)
    if (impostores && ref.imp !== undefined) impostores.ponerMatriz(ref.imp, M.elements);
    medioSucio = true;
    // 3.4 (sotobosque): la sombra de contacto del árbol vive en su bloque
    if (tipos[ref.tipo]?.grupo !== 'arbol') sotoSucio = true;
  }
  function ocultarInstancia(a) {
    for (const ref of [a.ref, a.contactoRef].filter(Boolean)) ponerMatriz(ref, cero);
  }

  // ----- tocones (una sola malla instanciada para todos)
  const toconGeo = new THREE.CylinderGeometry(0.34, 0.44, 0.52, 9, 1);
  const toconMat = new THREE.MeshLambertMaterial({ color: 0x6b5336 });
  const MAX_TOCONES = 96;
  const tocones = [];
  let toconMalla = null;
  function refrescarTocones() {
    if (!toconMalla) {
      toconMalla = new THREE.InstancedMesh(toconGeo, toconMat, MAX_TOCONES);
      toconMalla.count = 0;
      toconMalla.receiveShadow = true;
      toconMalla.frustumCulled = false;
      escena.add(toconMalla);
    }
    tocones.forEach((t, i) => {
      _M.compose(_p2.set(t.x, t.y + 0.16, t.z), _q2.setFromAxisAngle(_eje.set(0, 1, 0), t.giro), _s2.set(t.esc, t.esc, t.esc));
      toconMalla.setMatrixAt(i, _M);
    });
    toconMalla.count = tocones.length;
    toconMalla.instanceMatrix.needsUpdate = true;
  }
  function ponerTocon(a) {
    if (tocones.some((t) => t.arbol === a)) return;
    if (tocones.length >= MAX_TOCONES) tocones.shift();
    const esc = Math.min(1.5, Math.max(0.55, (a.r || 0.4) * 1.7));
    tocones.push({ arbol: a, x: a.x, z: a.z, y: a.y ?? T.altura(a.x, a.z), esc, giro: (a.x * 0.7 + a.z) % 3.14 });
    refrescarTocones();
  }
  function sacarTocon(a) {
    const i = tocones.findIndex((t) => t.arbol === a);
    if (i < 0) return;
    tocones.splice(i, 1);
    refrescarTocones();
  }

  // ----- el árbol que se mueve: mientras tiembla o cae, se dibuja como una malla propia
  // de una sola instancia (misma geometría, mismo tinte) y la del chunk queda apagada.
  // Así no hay que recompactar el LOD cercano en cada cuadro.
  const animados = [];
  const DUR_CAIDA = 1.7, REPOSO_CAIDA = 5, DUR_SACUDIDA = 1.1;
  function copiaDe(a, M) {
    const t = tipos[a.ref.tipo];
    if (!t) return null;
    const im = new THREE.InstancedMesh(t.alta, t.matAlta, 1);
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(a.tinte0 || [1, 1, 1]), 3);
    im.frustumCulled = false;
    im.matrixAutoUpdate = false;
    im.setMatrixAt(0, M);
    im.instanceMatrix.needsUpdate = true;
    escena.add(im);
    return im;
  }
  function animarArbol(a, modo, dir) {
    const M = matrizDe(a);
    if (!M) return null;
    let an = animados.find((x) => x.a === a);
    if (!an) {
      if (animados.length > 4) return null;
      const im = copiaDe(a, M);
      if (!im) return null;
      ocultarInstancia(a);
      M.decompose(_p2, _q2, _s2);
      an = { a, im, pos: _p2.clone(), giro: _q2.clone(), esc: _s2.clone(), eje: new THREE.Vector3(1, 0, 0) };
      animados.push(an);
      if (ultimaCam) compactarCercanos(ultimaCam);
    }
    an.modo = modo;
    an.t = 0;
    if (dir) {
      const d = Math.hypot(dir.x || 0, dir.z || 0) || 1;
      // el eje de giro es perpendicular a la dirección de caída
      an.eje.set(-(dir.z || 0) / d, 0, (dir.x || 0) / d);
    }
    return an;
  }
  // Un hachazo que todavía no lo voltea: el árbol se estremece.
  function sacudir(a) { return !!animarArbol(a, 'sacude'); }

  // Se llama desde el bucle: casi siempre no hay nada que hacer.
  function actualizarCaidas(dt) {
    // 3.3: un árbol que empieza a caer (o rebrota) sale de la banda media en el mismo cuadro
    if (medioSucio && impostores && ultimaCam) compactarMedios(ultimaCam);
    if (!animados.length) return;
    for (let i = animados.length - 1; i >= 0; i--) {
      const an = animados[i];
      an.t += dt;
      if (an.modo === 'sacude') {
        const fin = an.t >= DUR_SACUDIDA;
        _qGiro.setFromAxisAngle(_eje.set(1, 0, 0), fin ? 0 : 0.038 * Math.exp(-an.t * 3.4) * Math.sin(an.t * 27));
        an.im.setMatrixAt(0, _M.compose(an.pos, _q2.copy(_qGiro).multiply(an.giro), an.esc));
        an.im.instanceMatrix.needsUpdate = true;
        if (fin) { terminarAnimado(i, true); continue; }
      } else {
        // el del rayo se queda en el suelo: acostado y quieto, no hay nada que recalcular
        if (an.modo === 'rayo' && an.quieto) continue;
        const u = Math.min(1, an.t / DUR_CAIDA);
        // arranca despacio (la fibra que todavía sostiene) y se acelera; al tocar el suelo, rebote corto
        let ang = (Math.PI / 2) * u * u * u;
        if (an.t > DUR_CAIDA) ang = Math.PI / 2 - Math.sin((an.t - DUR_CAIDA) * 9) * 0.06 * Math.max(0, 1 - (an.t - DUR_CAIDA) * 2.2);
        _qGiro.setFromAxisAngle(an.eje, ang);
        an.im.setMatrixAt(0, _M.compose(an.pos, _q2.copy(_qGiro).multiply(an.giro), an.esc));
        an.im.instanceMatrix.needsUpdate = true;
        if (an.modo === 'rayo') { if (an.t > DUR_CAIDA + 1) an.quieto = true; continue; }
        if (an.t > DUR_CAIDA + REPOSO_CAIDA) { terminarAnimado(i, false); continue; }
      }
    }
  }
  function terminarAnimado(i, devolver) {
    const an = animados[i];
    escena.remove(an.im);
    an.im.dispose();
    animados.splice(i, 1);
    // si el árbol sigue en pie, vuelve a su instancia del chunk (y con él su sombra
    // de contacto: la apagó `ocultarInstancia` al empezar a moverse).
    if (devolver && !an.a.sacado) {
      ponerMatriz(an.a.ref, an.a.matriz0);
      if (an.a.contactoRef && an.a.matrizContacto) ponerMatriz(an.a.contactoRef, an.a.matrizContacto);
      if (ultimaCam) compactarCercanos(ultimaCam);
    }
  }

  // 1.10: el rayo. El árbol se parte y queda tirado en el suelo hasta que lo hachás:
  // la malla de la caída no se descarta. `inmediato` lo deja acostado sin animar (al
  // cargar una partida con un árbol que el rayo tiró y todavía no hachaste).
  function derribarPorRayo(a, dir, inmediato = false) {
    if (!a || a.sacado || a.caido) return false;
    const an = animarArbol(a, 'rayo', dir);
    if (!an) return false;
    if (inmediato) an.t = DUR_CAIDA + 0.5;
    a.caido = true;
    if (a.choque) a.choque.apagado = true;
    return true;
  }

  // Un árbol talado con el hacha: se viene abajo y deja el tocón. `dir` es hacia dónde cae.
  function talar(a, dir) {
    if (!a || a.sacado) return false;
    // El que tiró el rayo ya está en el suelo: el hacha lo hace leña y queda el tocón.
    if (a.caido) {
      const i = animados.findIndex((x) => x.a === a);
      if (i >= 0) terminarAnimado(i, false);
      a.caido = false;
      a.sacado = true;
      ocultarInstancia(a);
      if (matrizDe(a)) ponerTocon(a);
      if (ultimaCam) compactarCercanos(ultimaCam);
      return true;
    }
    const an = animarArbol(a, 'cae', dir);
    a.sacado = true;
    ocultarInstancia(a);
    if (a.choque) a.choque.apagado = true;
    if (matrizDe(a)) ponerTocon(a);
    if (!an && ultimaCam) compactarCercanos(ultimaCam);
    return true;
  }

  // El rebrote: 0 = nada (sólo el tocón), entre 0 y 1 = renoval creciendo, 1 = el árbol
  // de siempre, con su choque y su madera otra vez.
  function crecer(a, escala) {
    const M = matrizDe(a);
    if (!M) return false;
    const i = animados.findIndex((x) => x.a === a);
    if (i >= 0) terminarAnimado(i, false);
    if (escala >= 1) {
      ponerMatriz(a.ref, M);
      if (a.contactoRef && a.matrizContacto) ponerMatriz(a.contactoRef, a.matrizContacto);
      a.sacado = false;
      if (a.choque) a.choque.apagado = false;
      sacarTocon(a);
    } else if (escala <= 0) {
      a.sacado = true;
      ocultarInstancia(a);
      ponerTocon(a);
    } else {
      a.sacado = true;
      M.decompose(_p2, _q2, _s2);
      ponerMatriz(a.ref, _M.compose(_p2, _q2, _s2.multiplyScalar(escala)));
      ponerTocon(a);
    }
    if (ultimaCam) compactarCercanos(ultimaCam);
    return true;
  }

  // En invierno el tocón queda tapado de nieve como todo lo demás.
  const colorTocon = new THREE.Color('#6b5336'), colorToconNieve = new THREE.Color('#d8dee2');
  let invernado = -1;
  function pintarTocones(invierno) {
    const v = Math.max(0, Math.min(1, invierno || 0));
    if (!toconMalla || Math.abs(v - invernado) < 0.02) return;
    invernado = v;
    toconMat.color.copy(colorTocon).lerp(colorToconNieve, v * 0.85);
  }

  const arbolesAnimados = () => animados.length;
  const impostoresListos = () => impostores;
  const cantidadTocones = () => tocones.length;

  return { actualizar, actualizarCaidas, arbolesAnimados, cantidadTocones, pintarTocones, colisiones, arboles, plantas, calafates, matas, chunks, mats, despejar, talar, sacudir, crecer, derribarPorRayo, arbolesCerca, matasCerca, composicionPaisaje, prepararImpostores, impostoresListos, statsSoto, revisarSoto };
}
