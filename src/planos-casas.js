// 3.8.8: la escalera de casas. Después de la casilla (4,4 × 3,6) y el puesto de troncos (5,2 × 4,2) vienen tres refugios
// prefabricados más grandes, cada uno con más de todo: la cabaña de tablas y piedra, la casa con galería y la casona de dos
// cuartos. Se levantan por etapas como la casilla (cimientos, piso, paredes, techo), son habitables (se duerme adentro con
// E) y traen su cama, su mesa y su hogar de piedra. Una sola fábrica arma las tres; lo que cambia es la medida y lo que
// llevan.
//
// Reglas del molde (las mismas de la casilla):
//   · la puerta mira siempre a -z (el frente); el piso termina a 0,62 m sobre el pie de la obra;
//   · los nombres de etapa llevan «Paredes… cerramiento» y «Techo…»: así la pintura (estilo-casa.js, tecla T) sabe qué teñir;
//   · el zócalo de piedra y los frontones van en la etapa que corresponde para que el tinte de las paredes no pise la piedra;
//   · la física sale de `fisicaCasa(k)`: lo que aparece en la etapa k (construccion.js la aplica una vez por etapa).
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { calce, zocalo, sueloMin } from './calces.js';

const MADERA_OSCURA = '#4a3b2c';
const TABLA = '#8a6b4a';
const PIEDRA = '#7d766c';
const TECHO = '#4e4038';
const TECHO_2 = '#44382f';
const PARED = '#745c43';
const VIDRIO = '#91a7a3';

export const PISO_Y = 0.62;      // cara de arriba del piso, desde el pie de la obra
const Y0 = 0.60;                 // donde arrancan las paredes
const PUERTA = 1.04;             // ancho del vano
const T_PARED = 0.10;
const ALTO_PUERTA = 2.49;        // cara de abajo del dintel (desde el pie de la obra)
const ZOCALO_ALTO = 0.55;        // lo que sube el zócalo de piedra sobre el piso

const caja = (c, w, h, d, pos, color, o = {}) => c.agregar(new THREE.BoxGeometry(w, h, d), {
  color, tipo: o.tipo ?? 4, variar: o.variar ?? 0.1, matriz: matriz(pos, o.rot),
});
const cilindro = (c, rs, ri, h, pos, color, o = {}) => c.agregar(new THREE.CylinderGeometry(rs, ri, h, o.lados ?? 7), {
  color, tipo: o.tipo ?? 4, variar: o.variar ?? 0.1, matriz: matriz(pos),
});
// un triángulo vertical visible de los dos lados (los frontones del techo)
function triangulo(c, a, b, v, color) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...v, ...b, ...a, ...v], 3));
  c.agregar(g, { color, tipo: 4, variar: 0.08, matriz: matriz([0, 0, 0]) });
}

// Las medidas derivadas de un plano: se calculan una vez por casa.
function medidas(P) {
  const W = P.ancho, D = P.fondo, H = P.alto, subida = P.subida;
  const alturaPared = H - 0.35;
  const techoPared = Y0 + alturaPared;            // dónde termina la pared (y apoya el techo)
  const eje = P.eje;                              // 'z': el frente es un frontón · 'x': el frente es el alero
  const luz = eje === 'z' ? W : D;                // lo que cubre el techo de lado a lado
  const largo = eje === 'z' ? D : W;              // lo que corre la cumbrera
  return { W, D, H, subida, alturaPared, techoPared, eje, luz, largo, g: P.galeria || 0, cumbre: techoPared + subida };
}

// Los postes de la galería: siempre una cantidad par, así nunca queda uno en el centro, delante de la puerta y del escalón.
function postesGaleria(W) {
  const n = 2 * Math.max(2, Math.round(W / 3.4));
  return Array.from({ length: n }, (_, i) => -W / 2 + 0.3 + i * (W - 0.6) / (n - 1));
}

// Los tramos del frente a cada lado de la puerta: [x0, x1].
function tramosFrente(W) {
  return [[-W / 2, -PUERTA / 2], [PUERTA / 2, W / 2]];
}
// Las paredes del perímetro (centro de cada lado) como segmentos [ax, az, bx, bz]; el frente con el vano de la puerta.
function perimetro(M) {
  const { W, D } = M;
  const [fa, fb] = tramosFrente(W);
  return [
    [fa[0], -D / 2, fa[1], -D / 2], [fb[0], -D / 2, fb[1], -D / 2],
    [-W / 2, D / 2, W / 2, D / 2],
    [-W / 2, -D / 2, -W / 2, D / 2],
    [W / 2, -D / 2, W / 2, D / 2],
  ];
}

// ---------------------------------------------------------------- las piezas de adentro
function cama(c, x, z) {
  // la cabecera mira a +z (a la pared del fondo); 1,0 de ancho por 2,0 de largo
  const yb = PISO_Y + 0.36;
  caja(c, 1.0, 0.16, 2.0, [x, yb, z], TABLA, { variar: 0.1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.1, 0.34, 0.1, [x + sx * 0.44, PISO_Y + 0.17, z + sz * 0.94], MADERA_OSCURA, { tipo: 0, variar: 0.06 });
  caja(c, 1.0, 0.5, 0.1, [x, PISO_Y + 0.62, z + 0.99], MADERA_OSCURA, { tipo: 0, variar: 0.06 });   // la cabecera
  caja(c, 0.92, 0.14, 1.86, [x, yb + 0.15, z - 0.02], '#b9ae9a', { variar: 0.08 });                   // el colchón
  caja(c, 0.94, 0.06, 1.15, [x, yb + 0.24, z - 0.42], '#7b4a3a', { variar: 0.1 });                    // la frazada
  caja(c, 0.6, 0.1, 0.34, [x, yb + 0.25, z + 0.7], '#d8d0c0', { variar: 0.06 });                      // la almohada
}
function mesa(c, x, z) {
  // 1,3 en x por 0,8 en z, con una banqueta a cada lado largo
  caja(c, 1.3, 0.08, 0.8, [x, PISO_Y + 0.75, z], TABLA, { variar: 0.1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.08, 0.74, 0.08, [x + sx * 0.56, PISO_Y + 0.37, z + sz * 0.32], MADERA_OSCURA, { tipo: 0, variar: 0.06 });
  for (const sz of [-1, 1]) {
    caja(c, 0.95, 0.06, 0.3, [x, PISO_Y + 0.45, z + sz * 0.66], TABLA, { variar: 0.1 });
    for (const sx of [-1, 1]) caja(c, 0.07, 0.43, 0.07, [x + sx * 0.38, PISO_Y + 0.22, z + sz * 0.66], MADERA_OSCURA, { tipo: 0, variar: 0.06 });
  }
}
function alfombra(c, x, z, w, d) {
  caja(c, w, 0.02, d, [x, PISO_Y + 0.012, z], '#8a4b3c', { variar: 0.08 });
}
function repisa(c, M, x0, x1) {
  caja(c, x1 - x0, 0.07, 0.34, [(x0 + x1) / 2, PISO_Y + 1.1, M.D / 2 - 0.22], TABLA);
  for (const t of [0.2, 0.8]) caja(c, 0.1, 0.22, 0.12, [x0 + (x1 - x0) * t, PISO_Y + 1.25, M.D / 2 - 0.22], '#b5ab98', { variar: 0.1 });
}

// El hogar de piedra: por fuera la chimenea hasta arriba de la cumbrera, por dentro el fogón con su repisa.
function hogar(c, M, suelo, h) {
  const { W, techoPared, cumbre } = M;
  const lado = h.lado, zc = h.z;
  const cx = lado * (W / 2 + 0.45);
  const alto = cumbre + 0.4;
  const base = Math.min(-0.2, sueloMin(suelo, [[cx, zc - 0.6], [cx, zc + 0.6], [cx + lado * 0.45, zc]]) - 0.2);
  caja(c, 0.9, alto - base, 1.3, [cx, (alto + base) / 2, zc], PIEDRA, { variar: 0.16 });
  caja(c, 1.05, 0.12, 1.45, [cx, alto + 0.05, zc], '#5d574f', { variar: 0.1 });
  caja(c, 0.5, 0.34, 0.7, [cx, alto + 0.28, zc], PIEDRA, { variar: 0.14 });
  // adentro
  const ix = lado * (W / 2 - 0.3);
  caja(c, 0.56, 1.05, 1.1, [ix, PISO_Y + 0.52, zc], PIEDRA, { variar: 0.16 });
  caja(c, 0.06, 0.52, 0.62, [ix - lado * 0.29, PISO_Y + 0.36, zc], '#1d1815', { variar: 0.04 });
  caja(c, 0.66, 0.08, 1.24, [ix, PISO_Y + 1.1, zc], '#5d574f', { variar: 0.1 });
}

// ---------------------------------------------------------------- aberturas
// Una ventana sobre una pared: `orient` 'z' (la pared mira a ±z) o 'x' (mira a ±x), `s` hacia dónde mira (-1/+1).
function ventana(c, v) {
  const { orient, s, cx, cz } = v;
  const parte = (ox, oy, oz, w, h, d, color, o = {}) => {
    if (orient === 'z') caja(c, w, h, d, [cx + ox, oy, cz + s * oz], color, o);
    else caja(c, d, h, w, [cx + s * oz, oy, cz + ox], color, o);
  };
  const yc = 1.62, wv = 0.95, hv = 0.9;
  parte(0, yc, 0.06, wv, hv, 0.035, VIDRIO, { variar: 0.03 });
  parte(0, yc + hv / 2 + 0.04, 0.08, wv + 0.16, 0.08, 0.08, MADERA_OSCURA, { tipo: 0, variar: 0.05 });
  parte(0, yc - hv / 2 - 0.04, 0.08, wv + 0.16, 0.08, 0.08, MADERA_OSCURA, { tipo: 0, variar: 0.05 });
  for (const sx of [-1, 1]) parte(sx * (wv / 2 + 0.04), yc, 0.08, 0.08, hv, 0.08, MADERA_OSCURA, { tipo: 0, variar: 0.05 });
  parte(0, yc, 0.08, 0.04, hv, 0.05, MADERA_OSCURA, { tipo: 0, variar: 0.05 });
  parte(0, yc, 0.08, wv, 0.04, 0.05, MADERA_OSCURA, { tipo: 0, variar: 0.05 });
  parte(0, yc - hv / 2 - 0.1, 0.15, wv + 0.28, 0.05, 0.14, TABLA);   // el alféizar
}

// ---------------------------------------------------------------- las cuatro etapas
function etapaCimientos(M, P) {
  return (c, _P, _datos, suelo) => {
    const { W, D, g } = M;
    const nx = Math.max(2, Math.round(W / 2.3) + 1);
    const filas = D > 5 ? [-1, 0, 1] : [-1, 1];
    const xs = Array.from({ length: nx }, (_, i) => -W / 2 + 0.28 + i * (W - 0.56) / (nx - 1));
    for (const fz of filas) {
      const z = fz * (D / 2 - 0.28);
      for (const x of xs) {
        cilindro(c, 0.25, 0.32, 0.42, [x, 0.16, z], PIEDRA, { variar: 0.16 });
        calce(c, suelo, x, z, -0.04, 0.32);
      }
      caja(c, W - 0.28, 0.18, 0.18, [0, 0.42, z], MADERA_OSCURA, { tipo: 0, variar: 0.08 });
    }
    if (g) {
      const z = -D / 2 - g + 0.28;
      for (const x of xs) {
        cilindro(c, 0.22, 0.28, 0.4, [x, 0.15, z], PIEDRA, { variar: 0.16 });
        calce(c, suelo, x, z, -0.04, 0.28);
      }
      caja(c, W - 0.28, 0.16, 0.16, [0, 0.42, z], MADERA_OSCURA, { tipo: 0, variar: 0.08 });
    }
    if (P.zocalo) {
      // el zócalo de piedra en todo el perímetro (con el vano de la puerta), hasta ZOCALO_ALTO sobre el piso
      const arriba = PISO_Y + ZOCALO_ALTO;
      for (const [ax, az, bx, bz] of perimetro(M)) {
        const largo = Math.hypot(bx - ax, bz - az);
        const mx = (ax + bx) / 2, mz = (az + bz) / 2;
        const abajo = Math.min(-0.15, sueloMin(suelo, [[ax, az], [mx, mz], [bx, bz]]) - 0.15);
        const alto = arriba - abajo;
        const horizontal = Math.abs(bz - az) < 1e-6;
        // el lado de afuera (para correrlo un poco hacia fuera del eje de la pared)
        const fuera = horizontal ? Math.sign(mz) || -1 : Math.sign(mx) || -1;
        if (horizontal) caja(c, largo, alto, 0.2, [mx, abajo + alto / 2, mz + fuera * 0.03], PIEDRA, { variar: 0.18 });
        else caja(c, 0.2, alto, largo, [mx + fuera * 0.03, abajo + alto / 2, mz], PIEDRA, { variar: 0.18 });
      }
    }
  };
}

function etapaPiso(M) {
  return (c, _P, _datos, suelo) => {
    const { W, D, g } = M;
    for (let i = 0; i < Math.round(D / 0.29); i++) {
      const z = -D / 2 + 0.15 + i * 0.29;
      caja(c, W - 0.16, 0.075, 0.265, [0, 0.58, z], i % 3 ? TABLA : '#7b6045');
    }
    let zEscalon = -D / 2 - 0.35;
    if (g) {
      for (let i = 0; i < Math.round(g / 0.29); i++) {
        const z = -D / 2 - 0.15 - i * 0.29;
        caja(c, W + 0.2, 0.075, 0.265, [0, 0.58, z], i % 3 ? TABLA : '#7b6045');
      }
      zEscalon = -D / 2 - g - 0.35;
    }
    const ancho = g ? 1.8 : 1.35;
    caja(c, ancho, 0.16, 0.62, [0, 0.30, zEscalon], TABLA);
    zocalo(c, suelo, -ancho / 2 + 0.05, zEscalon, ancho / 2 - 0.05, zEscalon, 0.23, 0.52);
  };
}

function etapaParedes(M, P) {
  return (c) => {
    const { W, D, alturaPared: h, techoPared, subida, eje } = M;
    const t = T_PARED, yc = Y0 + h / 2;
    // postes de esquina
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.14, h + 0.3, 0.14, [sx * (W / 2 - 0.07), Y0 + (h + 0.3) / 2, sz * (D / 2 - 0.07)], MADERA_OSCURA, { tipo: 0, variar: 0.08 });
    // frente con el vano real, fondo y laterales
    const lado = (W - PUERTA) / 2;
    for (const sx of [-1, 1]) caja(c, lado, h, t, [sx * (PUERTA / 2 + lado / 2), yc, -D / 2], sx < 0 ? '#786047' : '#81684d');
    const sobre = techoPared - ALTO_PUERTA;
    if (sobre > 0.02) caja(c, PUERTA + 0.02, sobre, t, [0, ALTO_PUERTA + sobre / 2, -D / 2], PARED);
    caja(c, W, h, t, [0, yc, D / 2], PARED);
    for (const sx of [-1, 1]) caja(c, t, h, D, [sx * W / 2, yc, 0], sx > 0 ? '#80674c' : '#735a42');
    // marco de la puerta: jambas y dintel, sin madera atravesando el paso
    for (const sx of [-1, 1]) caja(c, 0.14, 1.82, 0.17, [sx * (PUERTA / 2 + 0.07), 1.50, -D / 2 - 0.04], MADERA_OSCURA, { tipo: 0 });
    caja(c, PUERTA + 0.28, 0.14, 0.17, [0, 2.42, -D / 2 - 0.04], MADERA_OSCURA, { tipo: 0 });
    // cubrejuntas verticales por afuera
    const cuantos = (largo) => Math.max(1, Math.round(largo / 0.95));
    for (const [lx0, lx1] of tramosFrente(W)) {
      const n = cuantos(lx1 - lx0);
      for (let i = 0; i < n; i++) caja(c, 0.09, h, 0.035, [lx0 + (lx1 - lx0) * (i + 0.5) / n, yc, -D / 2 - t / 2 - 0.012], TABLA, { variar: 0.12 });
    }
    for (let i = 0; i < cuantos(W); i++) caja(c, 0.09, h, 0.035, [-W / 2 + W * (i + 0.5) / cuantos(W), yc, D / 2 + t / 2 + 0.012], TABLA, { variar: 0.12 });
    for (const sx of [-1, 1]) for (let i = 0; i < cuantos(D); i++) caja(c, 0.035, h, 0.09, [sx * (W / 2 + t / 2 + 0.012), yc, -D / 2 + D * (i + 0.5) / cuantos(D)], TABLA, { variar: 0.12 });
    // tabiques de adentro
    for (const [ax, az, bx, bz] of P.tabiques || []) {
      const largo = Math.hypot(bx - ax, bz - az);
      if (Math.abs(bz - az) < 1e-6) caja(c, largo, h, 0.08, [(ax + bx) / 2, yc, az], '#6f573e');
      else caja(c, 0.08, h, largo, [ax, yc, (az + bz) / 2], '#6f573e');
    }
    // ventanas
    for (const v of P.ventanas) ventana(c, v);
    // frontones: el triángulo de pared bajo el techo
    if (eje === 'z') for (const dz of [-D / 2, D / 2]) triangulo(c, [-W / 2, techoPared, dz], [W / 2, techoPared, dz], [0, techoPared + subida, dz], PARED);
    else for (const dx of [-W / 2, W / 2]) triangulo(c, [dx, techoPared, -D / 2], [dx, techoPared, D / 2], [dx, techoPared + subida, 0], PARED);
  };
}

function etapaTecho(M, P) {
  return (c, _P, _datos, suelo) => {
    const { W, D, techoPared, subida, eje, luz, largo, g } = M;
    // las dos aguas
    const ov = 0.32, ovL = 0.3;
    const a = luz / 2 + ov, pend = subida / (luz / 2), incl = Math.atan(pend);
    const yr = techoPared + subida + 0.06;
    const Lp = a * Math.hypot(1, pend) + 0.12;
    const n = Math.ceil((largo + 2 * ovL) / 0.31);
    for (const lado of [-1, 1]) for (let i = 0; i < n; i++) {
      const v = -largo / 2 - ovL + 0.155 + i * 0.31;
      const yMed = yr - pend * a / 2;
      const color = i % 3 ? TECHO : TECHO_2;
      if (eje === 'z') caja(c, Lp, 0.065, 0.285, [lado * a / 2, yMed, v], color, { rot: [0, 0, -lado * incl], variar: 0.09 });
      else caja(c, 0.285, 0.065, Lp, [v, yMed, lado * a / 2], color, { rot: [lado * incl, 0, 0], variar: 0.09 });
    }
    // cumbrera
    if (eje === 'z') caja(c, 0.16, 0.16, D + 0.6, [0, yr + 0.02, 0], MADERA_OSCURA, { tipo: 0 });
    else caja(c, W + 0.6, 0.16, 0.16, [0, yr + 0.02, 0], MADERA_OSCURA, { tipo: 0 });

    // los hogares de piedra
    for (const h of P.hogares) hogar(c, M, suelo, h);
    // adentro
    for (const b of P.camas) cama(c, b.x, b.z);
    for (const m of P.mesas) mesa(c, m.x, m.z);
    for (const al of P.alfombras) alfombra(c, al.x, al.z, al.w, al.d);
    if (P.repisa) repisa(c, M, P.repisa[0], P.repisa[1]);

    // la galería: postes, viga, techito y baranda
    if (g) {
      const zp = -D / 2 - g + 0.25;
      for (const x of postesGaleria(W)) cilindro(c, 0.07, 0.08, 1.85, [x, PISO_Y + 0.92, zp], MADERA_OSCURA, { tipo: 0, lados: 6, variar: 0.06 });
      caja(c, W + 0.3, 0.14, 0.16, [0, PISO_Y + 1.85 + 0.07, zp], MADERA_OSCURA, { tipo: 0 });
      // el techito baja desde el alero hasta la viga
      const yIn = techoPared - 0.12, yOut = PISO_Y + 1.92 + 0.04;
      const Lg = g + 0.15, inclG = Math.atan2(yIn - yOut, Lg);
      const nb = Math.ceil((W + 0.5) / 0.31);
      for (let i = 0; i < nb; i++) {
        caja(c, 0.285, 0.065, Math.hypot(Lg, yIn - yOut) + 0.08, [-W / 2 - 0.25 + 0.155 + i * 0.31, (yIn + yOut) / 2, -D / 2 - Lg / 2 + 0.05],
          i % 3 ? TECHO : TECHO_2, { rot: [-inclG, 0, 0], variar: 0.09 });
      }
      // baranda: el frente deja libre el paso hacia el escalón
      const paso = 0.9;
      for (const sx of [-1, 1]) {
        const x0 = sx < 0 ? -W / 2 - 0.1 : paso, x1 = sx < 0 ? -paso : W / 2 + 0.1;
        caja(c, x1 - x0, 0.06, 0.06, [(x0 + x1) / 2, PISO_Y + 0.95, zp], TABLA);
        caja(c, x1 - x0, 0.05, 0.05, [(x0 + x1) / 2, PISO_Y + 0.5, zp], TABLA);
      }
      for (const sx of [-1, 1]) {
        caja(c, 0.06, 0.06, g, [sx * (W / 2 + 0.07), PISO_Y + 0.95, -D / 2 - g / 2], TABLA);
        caja(c, 0.05, 0.05, g, [sx * (W / 2 + 0.07), PISO_Y + 0.5, -D / 2 - g / 2], TABLA);
        cilindro(c, 0.06, 0.07, 1.0, [sx * (W / 2 + 0.07), PISO_Y + 0.5, -D / 2 - 0.1], MADERA_OSCURA, { tipo: 0, lados: 6, variar: 0.06 });
      }
    }
  };
}

// ---------------------------------------------------------------- la física
// Lo que aparece en la etapa `k` (1..4), en coordenadas locales de la obra:
//   { segmentos: [[ax, az, bx, bz, r, y0, y1]], circulos: [[x, z, r, y0, y1]], plataformas: [[x, z, largo, ancho, alto, espesor]] }
function fisicaDe(P, k) {
  const M = medidas(P);
  const { W, D, g, techoPared } = M;
  const salida = { segmentos: [], circulos: [], plataformas: [] };
  const seg = (ax, az, bx, bz, r, y0, y1) => salida.segmentos.push([ax, az, bx, bz, r, y0, y1]);
  if (k === 1 && P.zocalo) {
    for (const [ax, az, bx, bz] of perimetro(M)) seg(ax, az, bx, bz, 0.12, -0.3, PISO_Y + ZOCALO_ALTO);
  }
  if (k === 2) {
    salida.plataformas.push([0, 0, W - 0.12, D - 0.08, PISO_Y, 0.14]);
    if (g) salida.plataformas.push([0, -D / 2 - g / 2, W + 0.2, g, PISO_Y, 0.14]);
    salida.plataformas.push([0, -D / 2 - g - 0.35, g ? 1.8 : 1.36, 0.64, 0.38, 0.14]);
  }
  if (k === 3) {
    for (const [ax, az, bx, bz] of perimetro(M)) seg(ax, az, bx, bz, 0.09, 0.48, techoPared);
    for (const [ax, az, bx, bz] of P.tabiques || []) seg(ax, az, bx, bz, 0.08, 0.48, techoPared);
  }
  if (k === 4) {
    for (const h of P.hogares) {
      seg(h.lado * (W / 2 + 0.45), h.z - 0.35, h.lado * (W / 2 + 0.45), h.z + 0.35, 0.5, -0.3, M.cumbre + 0.7);
      seg(h.lado * (W / 2 - 0.3), h.z - 0.3, h.lado * (W / 2 - 0.3), h.z + 0.3, 0.32, 0.5, PISO_Y + 1.2);
    }
    for (const b of P.camas) seg(b.x, b.z - 0.5, b.x, b.z + 0.5, 0.5, 0.55, PISO_Y + 0.8);
    for (const m of P.mesas) seg(m.x - 0.25, m.z, m.x + 0.25, m.z, 0.42, 0.55, PISO_Y + 0.9);
    if (g) {
      const zp = -D / 2 - g + 0.25;
      for (const x of postesGaleria(W)) salida.circulos.push([x, zp, 0.09, 0.5, PISO_Y + 1.9]);
      const paso = 0.9;
      seg(-W / 2 - 0.1, zp, -paso, zp, 0.06, 0.55, PISO_Y + 1.0);
      seg(paso, zp, W / 2 + 0.1, zp, 0.06, 0.55, PISO_Y + 1.0);
      for (const sx of [-1, 1]) seg(sx * (W / 2 + 0.07), -D / 2, sx * (W / 2 + 0.07), -D / 2 - g, 0.06, 0.55, PISO_Y + 1.0);
    }
  }
  return salida;
}

// ---------------------------------------------------------------- la fábrica
function casa(c) {
  const plano = {
    id: c.id, nombre: c.nombre, texto: c.texto,
    ancho: c.ancho, fondo: c.fondo, alto: c.alto, subida: c.subida, eje: c.eje,
    galeria: c.galeria || 0, zocalo: c.zocalo !== false,
    radio: c.radio, distancia: c.distancia, desnivelMax: c.desnivelMax,
    categoria: 'refugios', habitable: true,
    tabiques: c.tabiques || [], ventanas: c.ventanas, hogares: c.hogares, camas: c.camas, mesas: c.mesas, alfombras: c.alfombras || [], repisa: c.repisa || null,
    // la galería sobresale del frente: la huella de verdad tiene que contarla
    ...(c.galeria ? { huellasExtra: [{ lx: 0, lz: -c.fondo / 2 - c.galeria / 2 - 0.35, ancho: c.ancho + 0.4, fondo: c.galeria + 0.7 }] } : {}),
    etapas: [],
  };
  const M = medidas(plano);
  plano.etapas = [
    { nombre: 'Cimientos y zócalo', pide: c.pide[0], dice: c.dice[0], arma: etapaCimientos(M, plano) },
    { nombre: 'Piso de tablas', pide: c.pide[1], dice: c.dice[1], arma: etapaPiso(M) },
    { nombre: 'Paredes y cerramiento', pide: c.pide[2], dice: c.dice[2], arma: etapaParedes(M, plano) },
    { nombre: 'Techo, hogar y terminaciones', pide: c.pide[3], dice: c.dice[3], termina: true, arma: etapaTecho(M, plano) },
  ];
  plano.fisicaCasa = (k) => fisicaDe(plano, k);
  return plano;
}

// Posiciones de las ventanas que se repiten: sobre el frente, a ambos lados de la puerta.
const frenteVentanas = (D, xs) => xs.map((cx) => ({ orient: 'z', s: -1, cx, cz: -D / 2 }));
const fondoVentanas = (D, xs) => xs.map((cx) => ({ orient: 'z', s: 1, cx, cz: D / 2 }));
const lateralVentanas = (W, side, zs) => zs.map((cz) => ({ orient: 'x', s: side, cx: side * W / 2, cz }));

export const PLANOS_CASAS = [
  casa({
    id: 'cabana-piedra', nombre: 'Cabaña de tablas y piedra',
    texto: 'Un escalón más que la casilla: zócalo de piedra, hogar de piedra con su chimenea, tres ventanas, una cama, la mesa con banquetas y una repisa. Un solo ambiente, calentito.',
    ancho: 6.0, fondo: 4.6, alto: 2.45, subida: 1.25, eje: 'z', radio: 5.6, distancia: 7, desnivelMax: 1.0,
    ventanas: [...frenteVentanas(4.6, [-1.76, 1.76]), ...lateralVentanas(6.0, -1, [-0.9]), ...fondoVentanas(4.6, [1.0])],
    hogares: [{ lado: 1, z: 0.9 }],
    camas: [{ x: -2.3, z: 1.25 }],
    mesas: [{ x: 1.0, z: -0.4 }],
    repisa: [0.2, 2.2],
    pide: [{ piedra: 12, tronco: 6 }, { tabla: 16, tronco: 3 }, { tabla: 22, tronco: 10, piedra: 4 }, { tabla: 20, piedra: 8, tronco: 3 }],
    dice: [
      'Un anillo de piedra asienta la cabaña: de ahí sube la madera sin tocar la tierra.',
      'Tirantes y piso de tablas, con un escalón de entrada.',
      'Postes, tablas y cubrejuntas. Tres ventanas miran al valle y el vano de la puerta queda franco.',
      'El techo de dos aguas, el hogar de piedra con su chimenea, la cama, la mesa y la repisa.',
    ],
  }),
  casa({
    id: 'casa-galeria', nombre: 'Casa con galería',
    texto: 'La casa de campo patagónica: frente largo con galería techada y baranda, cinco ventanas, hogar de piedra, dos camas, mesa con alfombra y repisa. Se descansa de verdad.',
    ancho: 7.8, fondo: 5.6, alto: 2.6, subida: 1.5, eje: 'x', galeria: 1.9, radio: 7.4, distancia: 9, desnivelMax: 1.1,
    ventanas: [...frenteVentanas(5.6, [-2.2, 2.2]), ...fondoVentanas(5.6, [-1.9, 1.9]), ...lateralVentanas(7.8, -1, [0])],
    hogares: [{ lado: 1, z: 0 }],
    camas: [{ x: -3.0, z: 1.7 }, { x: -1.7, z: 1.7 }],
    mesas: [{ x: 1.4, z: 0.4 }],
    alfombras: [{ x: 1.4, z: 0.4, w: 2.4, d: 1.8 }],
    repisa: [0.2, 3.0],
    pide: [{ piedra: 18, tronco: 8 }, { tabla: 30, tronco: 5 }, { tabla: 34, tronco: 14, piedra: 4 }, { tabla: 36, piedra: 10, tronco: 6 }],
    dice: [
      'El zócalo de piedra corre por todo el perímetro y la galería tiene sus propias bases.',
      'Piso de tablas dentro y en la galería, con un escalón ancho al frente.',
      'Paredes de tabla con cubrejuntas, cinco ventanas y el vano de la puerta sobre la galería.',
      'Techo largo a dos aguas, el techito de la galería con su baranda, el hogar de piedra, dos camas, la mesa y la alfombra.',
    ],
  }),
  casa({
    id: 'casona', nombre: 'Casona de dos cuartos',
    texto: 'La más grande de las casas prefabricadas: sala con dos hogares de piedra, mesa y alfombra, y atrás dos dormitorios con su cama cada uno, separados por tabiques. Con galería al frente y ocho ventanas.',
    ancho: 9.6, fondo: 6.4, alto: 2.7, subida: 1.65, eje: 'x', galeria: 1.9, radio: 8.6, distancia: 10, desnivelMax: 1.2,
    ventanas: [...frenteVentanas(6.4, [-3.7, -1.9, 1.9, 3.7]), ...fondoVentanas(6.4, [-2.4, 2.4]), ...lateralVentanas(9.6, -1, [2.0]), ...lateralVentanas(9.6, 1, [2.0])],
    tabiques: [[-4.8, 0.8, -2.9, 0.8], [-1.9, 0.8, 1.9, 0.8], [2.9, 0.8, 4.8, 0.8], [0, 0.8, 0, 3.2]],
    hogares: [{ lado: -1, z: -1.2 }, { lado: 1, z: -1.2 }],
    camas: [{ x: -3.6, z: 2.15 }, { x: 3.6, z: 2.15 }],
    mesas: [{ x: -1.9, z: -1.0 }],
    alfombras: [{ x: -1.9, z: -1.0, w: 2.6, d: 1.8 }],
    pide: [{ piedra: 26, tronco: 12 }, { tabla: 44, tronco: 8 }, { tabla: 52, tronco: 20, piedra: 6 }, { tabla: 54, piedra: 16, tronco: 10 }],
    dice: [
      'Zócalo de piedra en todo el perímetro y una hilera de bases para la galería.',
      'Piso de tablas en toda la casa y en la galería.',
      'Paredes, tabiques de los dos dormitorios y ocho ventanas. Cada cuarto tiene su puerta de paso.',
      'El techo largo, los dos hogares de piedra, las camas, la mesa de la sala, la alfombra y la galería con baranda.',
    ],
  }),
];
