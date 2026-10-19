// 4.2: ampliar el refugio y las casas. Once ampliaciones por etapas (dormitorio, despensa, taller, quincho, galería cerrada, cocina,
// bodega de piedra, buhardilla, salón grande, planta alta con escalera y torreón) más tres piezas sueltas (el gran hogar de piedra, la
// pared de piedra y el techo de teja del sistema modular). Todas cuestan pesos además de materiales (ver PRECIOS_CONSTRUCCION.md).
//
// Cómo se arman (extienden lo de las casas en vez de repetirlo):
//   · cada ampliación sale de la fábrica de `planos-casas.js` (`casa()`): las mismas cuatro etapas (cimientos y zócalo, piso, paredes,
//     techo y terminaciones), la misma puerta al frente con su escalón, la misma física por etapa (`fisicaCasa`) y la misma regla de
//     ladera (la entrada no puede quedar a más de 0,60 m del suelo: se rechaza el sitio y se gira con R). Lo que cambia: son `pieza`
//     (se arriman al costado de la casa, que una obra grande no deja), cuestan pesos y cada una arma sus paredes y su techo a su modo;
//   · las que son de madera usan las paredes y el techo de dos aguas de las casas (con sus ventanas, hogares, camas y mesas); las de
//     piedra levantan sus muros hilada por hilada (`muro`), con el vano de la puerta justo en la cuarta hilada;
//   · las de dos niveles (buhardilla, planta alta, torreón) traen el piso de arriba con su hueco, la escalera de peldaños macizos
//     (los mismos que la torre de vigía: `sinTecho`, 27 cm de subida) y la baranda del hueco; `alto` cuenta las dos plantas, así que
//     `dentro()` y la lluvia ven también la de arriba;
//   · el frente mira a -z; el piso termina a 0,62 m sobre el pie de la obra; sólo `tipo` 0 y 4; sin luces dinámicas (los faroles son
//     sólo color); nada por cuadro.
// Las tres piezas sueltas son de una etapa (`PIEZAS_AMPLIAR`, con el molde de planos-lujo.js).
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { AYUDAS_CASAS } from './planos-casas.js';
import { AYUDAS_MUEBLES } from './planos-muebles.js';

const { casa, medidas, fisicaDe, etapaTecho, caja, cilindro, triangulo, ventana, mesa, alfombra, repisa, hogar, PISO_Y, Y0, PUERTA, ALTO_PUERTA, MADERA_OSCURA, TABLA, PIEDRA, TECHO, TECHO_2, PARED } = AYUDAS_CASAS;
const { cil, hs, HIERRO, BRONCE, PAPEL, TABLA_CLARA, VIDRIO } = AYUDAS_MUEBLES;

const TABLAS_PARED = ['#786047', '#81684d', '#745c43'];
const PIEDRAS = [PIEDRA, '#6c665d', '#8a857b', '#77736b'];
const LLAMA = '#ffcf6a';
const FILA = (ALTO_PUERTA - Y0) / 4;   // la altura de una hilada de piedra: cuatro llegan justo al dintel de la puerta
const FILA_ALTA = 0.63;                // y arriba del dintel las hiladas son más altas (menos bloques)
const T_PIEDRA = 0.3;                  // el grueso de los muros de piedra

// ---------------------------------------------------------------- paredes
// Una pared recta: `eje` 'x' (corre a lo largo de x, en z = `fijo`) o 'z', de `s0` a `s1`. `alto(u)` da la altura sobre Y0 en cada
// punto (u de 0 a largo): así sirve para una pared pareja, un frontón o un techo de una agua. `huecos`: [{ u0, u1, h }] pasos libres
// hasta la altura h (la puerta). De tablas paradas o de piedra hilada.
function muro(c, eje, fijo, s0, s1, alto, o = {}) {
  const { y0 = Y0, t = 0.1, piedra = false, huecos = [], semilla = 0, tabla = 0.46, desde = 0 } = o;   // `desde`: sólo las hiladas que están sobre esa cota (la planta de arriba de una torre)
  const largo = s1 - s0;
  const alt = typeof alto === 'function' ? alto : () => alto;
  const poner = (u0, u1, ya, yb, grosor, color, variar = 0.1) => {
    const L = u1 - u0, h = yb - ya;
    if (L < 0.03 || h < 0.03) return;
    const um = s0 + (u0 + u1) / 2, ym = y0 + (ya + yb) / 2;
    if (eje === 'x') caja(c, L, h, grosor, [um, ym, fijo], color, { variar });
    else caja(c, grosor, h, L, [fijo, ym, um], color, { variar });
  };
  if (!piedra) {
    const n = Math.max(1, Math.round(largo / tabla)), w = largo / n;
    for (let i = 0; i < n; i++) {
      const u0 = i * w, uc = u0 + w / 2, h = Math.max(alt(u0), alt(u0 + w));   // (la altura del lado más alto de la tabla: así el techo no deja rendijas)
      // lo que queda de la tabla después de los vanos (la puerta de abajo y, si hay, la del balcón)
      let tramos = [[0, h]];
      for (const hu of huecos) if (uc > hu.u0 && uc < hu.u1) tramos = tramos.flatMap(([a, b]) => [[a, Math.min(b, hu.y0 ?? 0)], [Math.max(a, hu.h), b]]).filter(([a, b]) => b - a > 0.05);
      for (const [a, b] of tramos) poner(u0, u0 + w - 0.008, a, b, t, TABLAS_PARED[i % 3]);
    }
    return;
  }
  let maxH = 0;
  for (let i = 0; i <= 8; i++) maxH = Math.max(maxH, alt(largo * i / 8));
  const cotas = [0];
  while (cotas.at(-1) < maxH - 0.01) cotas.push(cotas.at(-1) + (cotas.length <= 4 ? FILA : FILA_ALTA));
  const filas = cotas.length - 1;
  const sin = (p, q, hu) => [[p, Math.min(q, hu.u0)], [Math.max(p, hu.u1), q]].filter(([a, b]) => b - a > 0.001);
  for (let r = 0; r < filas; r++) {
    const ya = cotas[r], yb = cotas[r + 1];
    if (yb <= desde + 0.01) continue;
    let u = r % 2 ? -0.7 : 0, k = 0;
    while (u < largo - 0.02) {
      const bl = 1.2 + hs(semilla + r * 7.3 + k++) * 0.7;
      const a = Math.max(0, u);
      let b = Math.min(largo, u + bl);
      u += bl;
      if (largo - b < 0.45) { b = largo; u = largo; }
      let trozos = [[a, b]];
      for (const hu of huecos) if (ya < hu.h - 0.01) trozos = trozos.flatMap(([p, q]) => (q <= hu.u0 || p >= hu.u1 ? [[p, q]] : sin(p, q, hu)));
      for (const [p, q] of trozos) {
        if (q - p < 0.12) continue;
        const top = Math.min(yb, Math.max(alt(p), alt(q)));
        if (top - ya < 0.1) continue;
        const color = PIEDRAS[Math.floor(hs(semilla + r * 3.1 + p * 5.7) * 4) % 4];
        poner(p, q, ya, top, t + hs(semilla + r * 1.7 + p * 2.3) * 0.05, color, 0.16);
      }
    }
  }
}

// el marco de madera de la puerta de un frente, pegado a la cara de afuera de la pared (z = `zc`)
function marcoPuerta(c, zc) {
  for (const sx of [-1, 1]) caja(c, 0.14, 1.82, 0.17, [sx * (PUERTA / 2 + 0.07), 1.50, zc], MADERA_OSCURA, { tipo: 0 });
  caja(c, PUERTA + 0.28, 0.14, 0.17, [0, 2.42, zc], MADERA_OSCURA, { tipo: 0 });
}
const HUECO_PUERTA = { u0: 0, u1: 0, h: ALTO_PUERTA - Y0 };
// el hueco de la puerta (centrada en x = 0) para una pared que corre en x de -W/2 a W/2
const huecoDePuerta = (W) => ({ u0: W / 2 - PUERTA / 2, u1: W / 2 + PUERTA / 2, h: HUECO_PUERTA.h });

// los postes de las esquinas
function postesEsquina(c, W, D, alto, y0 = Y0) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.14, alto + 0.3, 0.14, [sx * (W / 2 - 0.07), y0 + (alto + 0.3) / 2, sz * (D / 2 - 0.07)], MADERA_OSCURA, { tipo: 0, variar: 0.08 });
}

// una pared de la casa cubierta con rejas: baranda baja (una barra de arriba, otra de la mitad y postes) entre dos puntos alineados
function baranda(c, ax, az, bx, bz, y, alto = 0.95) {
  const L = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2, horizontal = Math.abs(bz - az) < 1e-6;
  const barra = (yy, g) => (horizontal ? caja(c, L, g, g, [mx, y + yy, mz], TABLA) : caja(c, g, g, L, [mx, y + yy, mz], TABLA));
  barra(alto, 0.06); barra(alto * 0.5, 0.05);
  const n = Math.max(1, Math.round(L / 1.2));
  for (let i = 0; i <= n; i++) cil(c, 0.035, 0.04, alto + 0.02, [ax + (bx - ax) * i / n, y + alto / 2, az + (bz - az) * i / n], MADERA_OSCURA, { tipo: 0, lados: 5, variar: 0.06 });
}

// ---------------------------------------------------------------- pisos, escaleras y techos
// Una losa del piso de arriba (cara de arriba a `top`), con sus tablas, y las vigas que se ven desde abajo.
function losa(c, x0, x1, z0, z1, top, vigas = true) {
  const w = x1 - x0, d = z1 - z0;
  if (w < 0.05 || d < 0.05) return;
  caja(c, w, 0.12, d, [(x0 + x1) / 2, top - 0.06, (z0 + z1) / 2], TABLA, { variar: 0.1 });
  const n = Math.max(1, Math.round(w / 0.58));
  for (let i = 0; i < n; i++) caja(c, w / n - 0.05, 0.02, d - 0.02, [x0 + w * (i + 0.5) / n, top - 0.005, (z0 + z1) / 2], i % 2 ? '#7a5f43' : TABLA_CLARA, { variar: 0.08 });
  if (vigas) {
    const m = Math.max(1, Math.round(d / 1.3));
    for (let i = 0; i < m; i++) caja(c, w - 0.04, 0.16, 0.14, [(x0 + x1) / 2, top - 0.2, z0 + d * (i + 0.5) / m], MADERA_OSCURA, { tipo: 0, variar: 0.07 });
  }
}
// Una escalera recta de peldaños macizos que sube hacia +z (dir 1) o -z (dir -1), desde `zIni`; `base` es la cara de arriba del piso de abajo.
function escalera(c, x, zIni, dir, n, subida, huella, ancho, base = PISO_Y) {
  for (let i = 0; i < n; i++) {
    const top = subida * (i + 1);
    caja(c, ancho, top, huella, [x, base + top / 2, zIni + dir * huella * (i + 0.5)], i % 2 ? TABLA : '#7a5f43', { variar: 0.1 });
  }
}
// la baranda inclinada de una escalera (en el costado libre `xr`), con sus postes
function barandaEscalera(c, xr, zIni, dir, n, subida, huella, base = PISO_Y) {
  const L = n * huella, H = n * subida, incl = Math.atan2(H, L), largo = Math.hypot(L, H);
  caja(c, 0.06, 0.06, largo, [xr, base + H / 2 + 0.95, zIni + dir * L / 2], TABLA, { rot: [-dir * incl, 0, 0] });
  caja(c, 0.05, 0.05, largo, [xr, base + H / 2 + 0.5, zIni + dir * L / 2], TABLA, { rot: [-dir * incl, 0, 0] });
  for (const i of [0, Math.round(n / 2), n - 1]) cil(c, 0.035, 0.04, 0.95 + 0.1, [xr, base + subida * (i + 1) + 0.5, zIni + dir * huella * (i + 0.5)], MADERA_OSCURA, { tipo: 0, lados: 5, variar: 0.06 });
}
// la física de esa escalera: peldaños abiertos por arriba (`sinTecho`: el de arriba no es techo para el que sube), como la torre de vigía
function pasosEscalera(x, zIni, dir, n, subida, huella, ancho, base = PISO_Y) {
  return Array.from({ length: n }, (_, i) => [x, zIni + dir * huella * (i + 0.5), ancho, huella, base + subida * (i + 1), 0.08, 0.6, { sinTecho: true }]);
}

// El techo de una agua que baja hacia el frente (-z): tablas inclinadas de `yFrente` (z = -D/2) a `yFondo` (z = +D/2), con alero.
function techoUnAgua(c, W, D, yFrente, yFondo, ov = 0.35) {
  const dy = yFondo - yFrente, incl = Math.atan2(dy, D), Ls = Math.hypot(D, dy) + 2 * ov;
  const n = Math.ceil((W + 2 * 0.3) / 0.31);
  for (let i = 0; i < n; i++) {
    caja(c, 0.285, 0.065, Ls, [-W / 2 - 0.3 + 0.155 + i * 0.31, (yFrente + yFondo) / 2, 0], i % 3 ? TECHO : TECHO_2, { rot: [-incl, 0, 0], variar: 0.09 });
  }
  for (const x of [-W / 2 - 0.05, W / 2 + 0.05]) caja(c, 0.1, 0.16, Ls, [x, (yFrente + yFondo) / 2 - 0.07, 0], MADERA_OSCURA, { tipo: 0, rot: [-incl, 0, 0] });
  for (const f of [0.25, 0.5, 0.75]) caja(c, W + 0.4, 0.12, 0.12, [0, yFrente + dy * f - 0.12, -D / 2 + D * f], MADERA_OSCURA, { tipo: 0 });
}
// El techo en pirámide de una torre: escalones de teja que se van cerrando hasta la punta (`medio`: mitad del lado de abajo).
function techoPiramide(c, yBase, medio, alto, pisos = 7) {
  for (let k = 0; k < pisos; k++) {
    const a0 = medio * (1 - k / pisos), a1 = Math.max(0.02, medio * (1 - (k + 1) / pisos) + 0.07), h = alto / pisos + 0.06;
    c.agregar(new THREE.CylinderGeometry(a1 * Math.SQRT2, a0 * Math.SQRT2, h, 4), { color: k % 2 ? TECHO : TECHO_2, tipo: 4, variar: 0.1, matriz: matriz([0, yBase + alto / pisos * (k + 0.5), 0], [0, Math.PI / 4, 0]) });
  }
  cil(c, 0.03, 0.05, 0.4, [0, yBase + alto + 0.12, 0], HIERRO, { tipo: 0, lados: 5 });
  c.agregar(new THREE.IcosahedronGeometry(0.09, 0), { color: BRONCE, tipo: 0, variar: 0.04, matriz: matriz([0, yBase + alto + 0.36, 0]) });
}
// El piso de lajas de piedra (en vez de tablas): para la despensa, la bodega y el quincho. Termina a 0,62 como el de tablas.
function pisoLajas(M, extra = null) {
  return (c, _P, _d, suelo) => {
    const { W, D } = M;
    const nx = Math.max(2, Math.round((W - 0.2) / 1.05)), nz = Math.max(2, Math.round((D - 0.2) / 1.05));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const w = (W - 0.16) / nx, d = (D - 0.08) / nz;
      caja(c, w - 0.03, 0.09, d - 0.03, [-(W - 0.16) / 2 + w * (i + 0.5), 0.575 + hs(i * 3.1 + j * 1.9) * 0.01, -(D - 0.08) / 2 + d * (j + 0.5)], PIEDRAS[(i + j * 2) % 4], { variar: 0.14 });
    }
    caja(c, 1.35, 0.16, 0.62, [0, 0.30, -D / 2 - 0.35], PIEDRA, { variar: 0.14 });
    void suelo; void extra;
  };
}

// ---------------------------------------------------------------- muebles de adentro (`py`: cara de arriba del piso donde apoyan)
function armario(c, x, z, py, w = 1.3, alto = 1.95) {
  caja(c, w, alto, 0.55, [x, py + alto / 2, z], '#6b5238', { variar: 0.08 });
  caja(c, w + 0.08, 0.08, 0.6, [x, py + alto + 0.04, z], MADERA_OSCURA, { tipo: 0 });
  caja(c, w, 0.08, 0.5, [x, py + 0.04, z - 0.02], MADERA_OSCURA, { tipo: 0 });
  for (const s of [-1, 1]) {
    caja(c, w / 2 - 0.07, alto - 0.3, 0.03, [x + s * w / 4, py + alto / 2, z - 0.29], TABLA, { variar: 0.08 });
    caja(c, 0.03, 0.18, 0.04, [x + s * 0.06, py + alto * 0.5, z - 0.31], HIERRO, { tipo: 0 });
  }
}
// la cama de las casas (1,0 × 2,0, la cabecera a +z), a la altura `py` del piso
function camaEn(c, x, z, py) {
  const yb = py + 0.36;
  caja(c, 1.0, 0.16, 2.0, [x, yb, z], TABLA, { variar: 0.1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.1, 0.34, 0.1, [x + sx * 0.44, py + 0.17, z + sz * 0.94], MADERA_OSCURA, { tipo: 0, variar: 0.06 });
  caja(c, 1.0, 0.5, 0.1, [x, py + 0.62, z + 0.99], MADERA_OSCURA, { tipo: 0, variar: 0.06 });
  caja(c, 0.92, 0.14, 1.86, [x, yb + 0.15, z - 0.02], '#b9ae9a', { variar: 0.08 });
  caja(c, 0.94, 0.06, 1.15, [x, yb + 0.24, z - 0.42], '#7b4a3a', { variar: 0.1 });
  caja(c, 0.6, 0.1, 0.34, [x, yb + 0.25, z + 0.7], '#d8d0c0', { variar: 0.06 });
}
function mesaLuz(c, x, z, py) {
  caja(c, 0.5, 0.04, 0.4, [x, py + 0.58, z], TABLA);
  caja(c, 0.44, 0.5, 0.34, [x, py + 0.31, z], TABLA_CLARA);
  caja(c, 0.34, 0.1, 0.012, [x, py + 0.42, z - 0.18], TABLA, { variar: 0.06 });
  cil(c, 0.03, 0.03, 0.12, [x + 0.1, py + 0.66, z], PAPEL, { lados: 5 });
  c.agregar(new THREE.ConeGeometry(0.014, 0.05, 4), { color: LLAMA, tipo: 4, variar: 0.04, matriz: matriz([x + 0.1, py + 0.75, z]) });
  caja(c, 0.2, 0.04, 0.15, [x - 0.1, py + 0.62, z], '#7b4a3a', { variar: 0.08 });
}
function baul(c, x, z, py) {
  caja(c, 0.9, 0.4, 0.52, [x, py + 0.23, z], TABLA);
  caja(c, 0.94, 0.12, 0.56, [x, py + 0.49, z], TABLA_CLARA);
  for (const dx of [-0.34, 0.34]) caja(c, 0.05, 0.62, 0.58, [x + dx, py + 0.32, z], HIERRO, { tipo: 0, variar: 0.05 });
  caja(c, 0.08, 0.12, 0.03, [x, py + 0.46, z - 0.29], HIERRO, { tipo: 0 });
}
// estantes con frascos, libros y cajas: de a `filas` estantes, `w` de ancho, contra una pared que mira a -z (la espalda en +z)
function estanteria(c, x, z, py, w, alto, filas, semilla = 0, cosas = null) {
  const fondo = 0.34;
  for (const s of [-1, 1]) caja(c, 0.05, alto, fondo, [x + s * (w / 2 - 0.025), py + alto / 2, z], MADERA_OSCURA, { tipo: 0 });
  caja(c, w, alto, 0.03, [x, py + alto / 2, z + fondo / 2 - 0.015], '#4d3a24');
  const paleta = cosas || ['#6a8a5a', '#c8a04a', '#8a4a5a', '#a8573a', '#9fb4c0', '#7b5a3a', '#cfc8b4'];
  for (let f = 0; f <= filas; f++) {
    const y = py + 0.06 + (alto - 0.1) * f / filas;
    caja(c, w - 0.06, 0.04, fondo, [x, y, z], TABLA);
    if (f === filas) break;
    const n = Math.max(2, Math.round((w - 0.2) / 0.42));
    for (let i = 0; i < n; i++) {
      const hh = 0.14 + hs(semilla + f * 5 + i) * 0.16, ww = 0.14 + hs(semilla + f * 3 + i * 2) * 0.12;
      caja(c, ww, hh, 0.16, [x - (w - 0.3) / 2 + (w - 0.3) * (i + 0.5) / n, y + 0.02 + hh / 2, z + 0.02], paleta[Math.floor(hs(semilla + f * 11 + i * 7) * paleta.length) % paleta.length], { variar: 0.08 });
    }
  }
}
function barril(c, x, z, py, r = 0.3, h = 0.8, tumbado = false) {
  const rot = tumbado ? [0, 0, Math.PI / 2] : undefined;
  cil(c, r, r * 0.92, h, [x, py + (tumbado ? r : h / 2), z], TABLA, { lados: 8, rot, variar: 0.1 });
  for (const f of [-0.3, 0.3]) {
    const dx = tumbado ? f * h : 0, dy = tumbado ? 0 : f * h;
    cil(c, r * 1.04, r * 1.04, 0.04, [x + dx, py + (tumbado ? r : h / 2) + dy, z], HIERRO, { tipo: 0, lados: 8, rot, variar: 0.05 });
  }
}
function saco(c, x, z, py, giro = 0) {
  caja(c, 0.45, 0.62, 0.3, [x, py + 0.31, z], '#b9ae9a', { variar: 0.1, rot: [0, giro, 0.05] });
  caja(c, 0.3, 0.08, 0.2, [x, py + 0.64, z], '#a89c86', { variar: 0.1, rot: [0, giro, 0] });
}
function farolColgante(c, x, y, z, cadena = 0.5) {
  caja(c, 0.02, cadena, 0.02, [x, y + cadena / 2 + 0.14, z], HIERRO, { tipo: 0 });
  caja(c, 0.2, 0.05, 0.2, [x, y + 0.2, z], HIERRO, { tipo: 0 });
  caja(c, 0.16, 0.22, 0.16, [x, y + 0.06, z], LLAMA, { variar: 0.03 });
  caja(c, 0.22, 0.04, 0.22, [x, y - 0.07, z], HIERRO, { tipo: 0 });
}
function sillaChica(c, x, z, py, giro = 0) {
  const p = (dx, dy, dz, w, h, d, color, o = {}) => {
    const s = Math.sin(giro), co = Math.cos(giro);
    caja(c, w, h, d, [x + dx * co + dz * s, py + dy, z - dx * s + dz * co], color, { rot: [0, giro, 0], ...o });
  };
  p(0, 0.45, 0, 0.42, 0.05, 0.42, TABLA);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(sx * 0.18, 0.22, sz * 0.18, 0.05, 0.44, 0.05, MADERA_OSCURA, { tipo: 0 });
  p(0, 0.75, 0.2, 0.42, 0.36, 0.04, TABLA_CLARA);
}
function sillon(c, x, z, py, giro = 0, color = '#7b4a3a') {
  const p = (dx, dy, dz, w, h, d, col, o = {}) => {
    const s = Math.sin(giro), co = Math.cos(giro);
    caja(c, w, h, d, [x + dx * co + dz * s, py + dy, z - dx * s + dz * co], col, { rot: [0, giro, 0], variar: 0.08, ...o });
  };
  p(0, 0.22, 0, 0.9, 0.3, 0.85, color);
  p(0, 0.55, 0.36, 0.9, 0.5, 0.18, color);
  for (const s of [-1, 1]) p(s * 0.5, 0.4, 0, 0.14, 0.45, 0.85, color);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(sx * 0.38, 0.04, sz * 0.34, 0.08, 0.1, 0.08, MADERA_OSCURA, { tipo: 0 });
}
// una mesa larga con una banca a cada lado (o sillas), centrada en (x, z), larga en x
function mesaLarga(c, x, z, py, L, D = 0.9) {
  caja(c, L, 0.08, D, [x, py + 0.77, z], TABLA, { variar: 0.1 });
  caja(c, L - 0.3, 0.1, D - 0.3, [x, py + 0.68, z], MADERA_OSCURA, { tipo: 0 });
  for (const sx of [-1, 1]) caja(c, 0.1, 0.76, D - 0.1, [x + sx * (L / 2 - 0.25), py + 0.38, z], MADERA_OSCURA, { tipo: 0, variar: 0.07 });
  for (const sz of [-1, 1]) {
    caja(c, L - 0.2, 0.06, 0.3, [x, py + 0.46, z + sz * (D / 2 + 0.28)], TABLA, { variar: 0.1 });
    for (const sx of [-1, 1]) caja(c, 0.08, 0.44, 0.24, [x + sx * (L / 2 - 0.4), py + 0.22, z + sz * (D / 2 + 0.28)], MADERA_OSCURA, { tipo: 0, variar: 0.07 });
  }
}
// una banqueta o mesada de trabajo: un mostrador de L por D y alto h, con tablero y patas
function mostrador(c, x, z, py, L, D, h, giroZ = false, color = TABLA) {
  const w = giroZ ? D : L, d = giroZ ? L : D;
  caja(c, w, 0.06, d, [x, py + h - 0.03, z], color, { variar: 0.1 });
  caja(c, w - 0.1, h - 0.1, d - 0.1, [x, py + (h - 0.06) / 2 + 0.02, z], '#6b5238', { variar: 0.08 });
}
// una olla (o un jarro) de bronce o hierro
function olla(c, x, y, z, r = 0.12, color = HIERRO) {
  cil(c, r, r * 0.85, r * 1.1, [x, y, z], color, { tipo: 0, lados: 7, variar: 0.06 });
  caja(c, r * 2.1, 0.02, 0.02, [x, y + r * 0.6, z], color, { tipo: 0 });
}
// un cuerpo para la física: un tablón de w × d con alto `alto` sobre el piso
function cuerpo(f, x, z, w, d, alto, py = PISO_Y) {
  const r = Math.min(w, d) / 2;
  if (w >= d) f.segmentos.push([x - (w - 2 * r) / 2, z, x + (w - 2 * r) / 2, z, r, py - 0.07, py + alto]);
  else f.segmentos.push([x, z - (d - 2 * r) / 2, x, z + (d - 2 * r) / 2, r, py - 0.07, py + alto]);
}
// los muros de piedra como segmentos: el frente con el vano de la puerta; alturas desde el pie de la obra
function segmentosPiedra(f, W, D, yFrente, yFondo, r = 0.17) {
  const v = PUERTA / 2 + 0.07, zf = -D / 2, zb = D / 2, x1 = -W / 2, x2 = W / 2, y0 = 0.48, ym = Math.max(yFrente, yFondo);
  f.segmentos.length = 0;
  f.segmentos.push([x1, zf, -v, zf, r, y0, yFrente], [v, zf, x2, zf, r, y0, yFrente], [x1, zb, x2, zb, r, y0, yFondo], [x1, zf, x1, zb, r, y0, ym], [x2, zf, x2, zb, r, y0, ym]);
}
const frenteV = (D, xs) => xs.map((cx) => ({ orient: 'z', s: -1, cx, cz: -D / 2 }));
const fondoV = (D, xs) => xs.map((cx) => ({ orient: 'z', s: 1, cx, cz: D / 2 }));
const ladoV = (W, lado, zs) => zs.map((cz) => ({ orient: 'x', s: lado, cx: lado * W / 2, cz }));

// lo que las casas llevan adentro y dibuja su techo: hogares de piedra, camas, mesas, alfombras y repisa
function contenidoDeCasa(c, M, P, suelo) {
  for (const h of P.hogares) hogar(c, M, suelo, h);
  for (const b of P.camas) camaEn(c, b.x, b.z, PISO_Y);
  for (const m of P.mesas) mesa(c, m.x, m.z);
  for (const al of P.alfombras) alfombra(c, al.x, al.z, al.w, al.d);
  if (P.repisa) repisa(c, M, P.repisa[0], P.repisa[1]);
}

// ---------------------------------------------------------------- la fábrica de ampliaciones
// `cfg`: lo que pide `casa()` (medidas, ventanas, hogares, camas, mesas…) más lo propio:
//   pesos / reparto   el precio total y cómo se reparte entre las cuatro etapas
//   piso(M, P)        arma otro piso (lajas)           paredes(M, P)   otras paredes (devuelve el `arma` de la etapa 3)
//   techo(M, P)       otro techo (etapa 4)             interior(c, M, P, suelo)   lo que se suma adentro en la etapa 4
//   fisica(k, f, M, P)   corrige la física de la etapa k (f: segmentos, círculos, plataformas)
function ampliacion(cfg) {
  const P = casa({
    id: cfg.id, nombre: cfg.nombre, texto: cfg.texto,
    ancho: cfg.ancho, fondo: cfg.fondo, alto: cfg.alto, subida: cfg.subida, eje: cfg.eje || 'x',
    galeria: 0, zocalo: cfg.zocalo !== false, radio: cfg.radio ?? Math.hypot(cfg.ancho, cfg.fondo) / 2 + 0.5, distancia: cfg.distancia ?? 6.5, desnivelMax: cfg.desnivelMax ?? 1.0,
    ventanas: cfg.ventanas || [], hogares: cfg.hogares || [], camas: cfg.camas || [], mesas: cfg.mesas || [], alfombras: cfg.alfombras || [], repisa: cfg.repisa || null,
    tabiques: cfg.tabiques || [], pide: cfg.pide, dice: cfg.dice,
  });
  Object.assign(P, {
    pieza: true, soloRelax: true, ampliacion: true, categoria: cfg.categoria || 'refugios',
    pesos: cfg.pesos, repartoPesos: cfg.reparto || [0.2, 0.2, 0.3, 0.3],
    pendienteMax: cfg.pendienteMax ?? 0.3, distSendero: 2.2, distRiel: 9, separacion: 1.2,
  });
  if (cfg.nombres) cfg.nombres.forEach((n, i) => { if (n) P.etapas[i].nombre = n; });
  const M = medidas(P);
  if (cfg.piso) P.etapas[1].arma = cfg.piso(M, P);
  if (cfg.paredes) P.etapas[2].arma = cfg.paredes(M, P);
  const armaTecho = cfg.techo ? cfg.techo(M, P) : etapaTecho(M, P);
  // (el techo de las casas ya dibuja los hogares, las camas y las mesas; con otro techo se dibujan aparte)
  P.etapas[3].arma = (c, p, datos, suelo) => { armaTecho(c, p, datos, suelo); if (cfg.techo) contenidoDeCasa(c, M, P, suelo); cfg.interior?.(c, M, P, suelo); };
  P.fisicaCasa = (k) => { const f = fisicaDe(P, k); cfg.fisica?.(k, f, M, P); return f; };
  return P;
}

// ================================================================ 1. dormitorio anexo
const dormitorioAnexo = ampliacion({
  id: 'dormitorio-anexo', nombre: 'Dormitorio anexo',
  texto: 'Un cuarto más para la casa: dos camas con su mesa de luz en el medio, el ropero contra la pared del fondo, un baúl al pie y una alfombra. Tiene su propia puerta: arrimalo al costado de la casa.',
  ancho: 4.6, fondo: 3.8, alto: 2.45, subida: 1.15, eje: 'x', desnivelMax: 0.9,
  ventanas: [...frenteV(3.8, [-1.55, 1.55]), ...fondoV(3.8, [0.9]), ...ladoV(4.6, -1, [0.2])],
  camas: [{ x: -1.7, z: 0.82 }, { x: -0.2, z: 0.82 }],
  alfombras: [{ x: 1.15, z: -0.35, w: 1.7, d: 1.1 }],
  pide: [{ piedra: 8, tronco: 4 }, { tabla: 12, tronco: 2 }, { tabla: 18, tronco: 6, piedra: 2 }, { tabla: 16, piedra: 4, tronco: 2 }],
  dice: [
    'Un anillo de piedra y los tirantes: el cuarto asienta como el resto de la casa.',
    'Piso de tablas, con su escalón de entrada.',
    'Paredes de tabla con cubrejuntas y tres ventanas: una al frente, una a la cabecera y una al costado.',
    'El techo de dos aguas, las dos camas, la mesa de luz, el ropero, el baúl y la alfombra.',
  ],
  pesos: 20000,
  interior(c, M) {
    armario(c, 1.7, 1.55, PISO_Y);
    mesaLuz(c, -0.95, 1.62, PISO_Y);
    baul(c, -0.2, -0.55, PISO_Y);
  },
  fisica(k, f) {
    if (k === 4) { cuerpo(f, 1.7, 1.55, 1.3, 0.55, 1.95); cuerpo(f, -0.95, 1.62, 0.5, 0.4, 0.62); cuerpo(f, -0.2, -0.55, 0.9, 0.52, 0.62); }
  },
});

// ================================================================ 2. despensa anexa (piedra)
const despensa = (() => {
  const W = 3.8, D = 3.2, hF = 2.2, hB = 2.75;
  const P = ampliacion({
    id: 'despensa-anexa', nombre: 'Despensa de piedra',
    texto: 'Un cuartito de piedra, fresco y oscuro, para guardar lo del invierno: estantes con frascos hasta el techo, jamones y ristras colgando, sacos de harina, barriles y quesos. Sin ventanas, sólo rejillas. Pide mucha piedra.',
    ancho: W, fondo: D, alto: hF + 0.35, subida: 0.55, eje: 'x', desnivelMax: 0.8, categoria: 'trabajo', zocalo: false,
    pide: [{ piedra: 14, tronco: 2 }, { piedra: 6, tabla: 8 }, { piedra: 34, tabla: 6, tronco: 2 }, { tabla: 12, piedra: 4, tronco: 2 }],
    dice: [
      'Piedra sobre piedra: un anillo grueso asienta el cuartito.',
      'Un piso de lajas de piedra, que mantiene el fresco.',
      'Los muros de piedra, hilada por hilada, con la puerta de madera y dos rejillas para que corra el aire.',
      'El techo de una agua, los estantes, los jamones colgados, los sacos y los barriles.',
    ],
    pesos: 20000, reparto: [0.2, 0.2, 0.35, 0.25],
    piso: (M) => pisoLajas(M),
    paredes: () => (c) => {
      const t = T_PIEDRA;
      const alt = (u) => hF + (hB - hF) * u / D;      // los costados suben hacia el fondo
      muro(c, 'x', -D / 2, -W / 2, W / 2, hF, { t, piedra: true, huecos: [huecoDePuerta(W)], semilla: 1 });
      muro(c, 'x', D / 2, -W / 2, W / 2, hB, { t, piedra: true, semilla: 2 });
      muro(c, 'z', -W / 2, -D / 2, D / 2, alt, { t, piedra: true, semilla: 3 });
      muro(c, 'z', W / 2, -D / 2, D / 2, alt, { t, piedra: true, semilla: 4 });
      marcoPuerta(c, -D / 2 - t / 2 - 0.06);
      // las rejillas de ventilación (listones oscuros) a los costados, arriba
      for (const sx of [-1, 1]) for (const dz of [-0.7, 0.7]) {
        caja(c, 0.05, 0.2, 0.55, [sx * (W / 2 + t / 2 + 0.03), Y0 + 1.7, dz], HIERRO, { tipo: 0, variar: 0.05 });
        for (let i = 0; i < 3; i++) caja(c, 0.06, 0.02, 0.5, [sx * (W / 2 + t / 2 + 0.05), Y0 + 1.63 + i * 0.07, dz], MADERA_OSCURA, { tipo: 0 });
      }
    },
    techo: () => (c) => techoUnAgua(c, W, D, Y0 + hF + 0.12, Y0 + hB + 0.12),
    interior(c) {
      const py = PISO_Y;
      estanteria(c, -0.85, D / 2 - 0.2, py, 1.7, 2.05, 5, 11);
      estanteria(c, 0.95, D / 2 - 0.2, py, 1.5, 2.05, 5, 23);
      // el travesaño con jamones y ristras
      caja(c, W - 0.5, 0.1, 0.1, [0, py + 2.02, -0.55], MADERA_OSCURA, { tipo: 0 });
      for (let i = 0; i < 5; i++) {
        const x = -1.3 + i * 0.65;
        caja(c, 0.02, 0.28 + (i % 2) * 0.1, 0.02, [x, py + 1.85, -0.55], HIERRO, { tipo: 0 });
        c.agregar(new THREE.IcosahedronGeometry(0.13, 0), { color: i % 2 ? '#8a4a3a' : '#9a5a44', tipo: 4, variar: 0.1, matriz: matriz([x, py + 1.62 - (i % 2) * 0.08, -0.55], [0, 0, 0], [1, 1.5, 1]) });
      }
      barril(c, -1.55, -0.1, py, 0.3, 0.78); barril(c, -1.55, 0.7, py, 0.3, 0.78);
      saco(c, 1.55, -0.2, py, 0.2); saco(c, 1.6, 0.4, py, -0.3); saco(c, 1.2, 0.2, py, 0.5);
      mostrador(c, 0.2, -0.05, py, 1.0, 0.7, 0.8);
      for (let i = 0; i < 3; i++) cil(c, 0.2 - i * 0.02, 0.2 - i * 0.02, 0.1, [0.2, py + 0.85 + i * 0.1, -0.05], i % 2 ? '#d8c27a' : '#c9b25a', { lados: 8, variar: 0.08 });
    },
    fisica(k, f) {
      if (k === 3) segmentosPiedra(f, W, D, Y0 + hF, Y0 + hB);
      if (k === 4) {
        cuerpo(f, -0.85, D / 2 - 0.25, 1.7, 0.4, 2.0); cuerpo(f, 0.95, D / 2 - 0.25, 1.5, 0.4, 2.0);
        cuerpo(f, -1.55, 0.3, 0.6, 1.4, 0.85); cuerpo(f, 0.2, -0.05, 1.0, 0.7, 0.82); cuerpo(f, 1.45, 0.1, 0.7, 1.0, 0.7);
      }
    },
  });
  return P;
})();


// ================================================================ 3. taller anexo
function herramienta(c, tipo, x, y, z) {
  if (tipo === 'hacha') { caja(c, 0.035, 0.55, 0.035, [x, y, z], TABLA_CLARA); caja(c, 0.2, 0.12, 0.04, [x + 0.07, y + 0.22, z], '#8a8a86', { tipo: 0 }); }
  else if (tipo === 'serrucho') { caja(c, 0.55, 0.1, 0.012, [x, y, z], '#9a9a96', { tipo: 0 }); caja(c, 0.1, 0.12, 0.03, [x + 0.31, y, z], MADERA_OSCURA, { tipo: 0 }); }
  else if (tipo === 'martillo') { caja(c, 0.03, 0.36, 0.03, [x, y, z], TABLA_CLARA); caja(c, 0.15, 0.06, 0.05, [x + 0.03, y + 0.17, z], HIERRO, { tipo: 0 }); }
  else if (tipo === 'cepillo') { caja(c, 0.3, 0.07, 0.1, [x, y, z], TABLA); caja(c, 0.05, 0.08, 0.05, [x - 0.08, y + 0.07, z], MADERA_OSCURA, { tipo: 0 }); }
  else if (tipo === 'formones') { for (let i = 0; i < 3; i++) { caja(c, 0.025, 0.3, 0.02, [x + i * 0.06, y, z], '#9a9a96', { tipo: 0 }); caja(c, 0.03, 0.12, 0.03, [x + i * 0.06, y + 0.2, z], TABLA, {}); } }
}
const taller = (() => {
  const W = 5.4, D = 3.8, hF = 2.35, hB = 3.0;
  return ampliacion({
    id: 'taller-anexo', nombre: 'Taller anexo', categoria: 'trabajo',
    texto: 'Un taller arrimado a la casa, con techo de una agua que cae hacia la puerta: dos bancos de carpintero con su morsa, la pared de las herramientas, tablas en caballetes, un tocón de hachar y el barril de las virutas. De adorno y de orden: no cambia lo que se fabrica.',
    ancho: W, fondo: D, alto: hF + 0.35, subida: 0.65, eje: 'x', desnivelMax: 0.9,
    ventanas: [...frenteV(D, [-1.8, 1.8]), ...ladoV(W, -1, [0.3]), ...ladoV(W, 1, [0.3])],
    pide: [{ piedra: 8, tronco: 6 }, { tabla: 14, tronco: 2 }, { tabla: 28, tronco: 10, piedra: 2 }, { tabla: 22, tronco: 4, piedra: 2 }],
    dice: [
      'Un anillo de piedra y los tirantes grandes: el taller aguanta el peso de los bancos.',
      'Piso de tablas gruesas, con su escalón de entrada.',
      'Paredes de tabla: más altas atrás que adelante, la puerta al frente y tres ventanas para tener buena luz.',
      'El techo de una agua, los bancos con su morsa, la pared de las herramientas, los caballetes y el tocón.',
    ],
    pesos: 24000,
    paredes: (M, P) => (c) => {
      const alt = (u) => hF + (hB - hF) * u / D;
      muro(c, 'x', -D / 2, -W / 2, W / 2, hF, { huecos: [huecoDePuerta(W)] });
      muro(c, 'x', D / 2, -W / 2, W / 2, hB);
      muro(c, 'z', -W / 2, -D / 2, D / 2, alt);
      muro(c, 'z', W / 2, -D / 2, D / 2, alt);
      for (const sx of [-1, 1]) {
        caja(c, 0.14, hF + 0.3, 0.14, [sx * (W / 2 - 0.07), Y0 + (hF + 0.3) / 2, -D / 2 + 0.07], MADERA_OSCURA, { tipo: 0, variar: 0.08 });
        caja(c, 0.14, hB + 0.3, 0.14, [sx * (W / 2 - 0.07), Y0 + (hB + 0.3) / 2, D / 2 - 0.07], MADERA_OSCURA, { tipo: 0, variar: 0.08 });
      }
      marcoPuerta(c, -D / 2 - 0.04);
      for (const v of P.ventanas) ventana(c, v);
    },
    techo: () => (c) => techoUnAgua(c, W, D, Y0 + hF + 0.12, Y0 + hB + 0.12),
    interior(c) {
      const py = PISO_Y, zt = D / 2 - 0.08;
      // la pared de las herramientas: un tablero con todo colgado
      caja(c, 3.0, 1.2, 0.04, [-0.6, py + 1.6, zt], '#6b5238', { variar: 0.08 });
      const tipos = ['hacha', 'serrucho', 'martillo', 'cepillo', 'formones', 'hacha', 'martillo', 'serrucho'];
      tipos.forEach((t, i) => herramienta(c, t, -1.9 + (i % 4) * 0.8, py + (i < 4 ? 1.85 : 1.35), zt - 0.04));
      // el banco de carpintero con la morsa y una tabla a medio cepillar
      mostrador(c, -1.2, 1.3, py, 2.4, 0.7, 0.92);
      caja(c, 0.16, 0.22, 0.14, [-2.32, py + 1.03, 1.3], HIERRO, { tipo: 0 });
      caja(c, 1.3, 0.04, 0.26, [-1.0, py + 0.94, 1.3], TABLA_CLARA);
      herramienta(c, 'cepillo', -0.7, py + 0.99, 1.3);
      // los caballetes con las tablas
      for (const x of [1.2, 2.1]) {
        caja(c, 0.08, 0.8, 0.08, [x, py + 0.4, 1.0], MADERA_OSCURA, { tipo: 0, rot: [0.25, 0, 0] });
        caja(c, 0.08, 0.8, 0.08, [x, py + 0.4, 1.55], MADERA_OSCURA, { tipo: 0, rot: [-0.25, 0, 0] });
        caja(c, 0.1, 0.1, 0.9, [x, py + 0.78, 1.28], MADERA_OSCURA, { tipo: 0 });
      }
      for (let i = 0; i < 3; i++) caja(c, 1.9, 0.05, 0.24, [1.65, py + 0.86 + i * 0.05, 1.05 + i * 0.22], i % 2 ? TABLA : TABLA_CLARA, { variar: 0.1 });
      // el tocón de hachar con el hacha clavada y el barril de las virutas
      cil(c, 0.3, 0.34, 0.55, [-1.9, py + 0.27, -0.6], '#7a5f43', { lados: 7, variar: 0.12 });
      herramienta(c, 'hacha', -1.9, py + 0.75, -0.6);
      barril(c, 2.0, -0.9, py, 0.3, 0.7);
      farolColgante(c, 0.3, py + 2.0, 0.6);
    },
    fisica(k, f) {
      if (k === 3) {
        f.segmentos.length = 0;
        const v = PUERTA / 2 + 0.07, r = 0.1;
        f.segmentos.push([-W / 2, -D / 2, -v, -D / 2, r, 0.48, Y0 + hF], [v, -D / 2, W / 2, -D / 2, r, 0.48, Y0 + hF], [-W / 2, D / 2, W / 2, D / 2, r, 0.48, Y0 + hB], [-W / 2, -D / 2, -W / 2, D / 2, r, 0.48, Y0 + hB], [W / 2, -D / 2, W / 2, D / 2, r, 0.48, Y0 + hB]);
      }
      if (k === 4) {
        cuerpo(f, -1.2, 1.3, 2.4, 0.7, 0.92); cuerpo(f, 1.65, 1.28, 1.9, 0.9, 0.9);
        f.circulos.push([-1.9, -0.6, 0.32, PISO_Y - 0.05, PISO_Y + 0.55], [2.0, -0.9, 0.3, PISO_Y - 0.05, PISO_Y + 0.7]);
      }
    },
  });
})();

// ================================================================ 4. quincho
function banqueta(c, x, z, py) {
  cil(c, 0.17, 0.13, 0.7, [x, py + 0.35, z], '#7a5f43', { lados: 8, variar: 0.1 });
  cil(c, 0.2, 0.2, 0.06, [x, py + 0.73, z], TABLA, { lados: 8, variar: 0.08 });
}
const quincho = (() => {
  const W = 6.6, D = 4.8, hw = 5 * FILA;
  return ampliacion({
    id: 'quincho', nombre: 'Quincho', categoria: 'exterior',
    texto: 'Un quincho de verdad: techo de dos aguas sobre postes, el fondo de piedra con su asador y su chimenea, medias paredes a los costados y el frente abierto. Mesa larga con bancos, una barra con banquetas, leña apilada y el piso de lajas. Para los asados con los vecinos.',
    ancho: W, fondo: D, alto: hw + 0.35, subida: 1.5, eje: 'x', desnivelMax: 1.0, zocalo: false,
    pide: [{ piedra: 14, tronco: 6 }, { tabla: 16, piedra: 8 }, { piedra: 36, tronco: 10, tabla: 8 }, { tabla: 26, tronco: 6, piedra: 6 }],
    dice: [
      'Un anillo de piedra y los tirantes: el quincho asienta firme.',
      'Piso de lajas de piedra, fácil de barrer y que no se quema con las brasas.',
      'La pared del fondo de piedra, las medias paredes de los costados y los postes del frente con sus vigas.',
      'El techo de dos aguas, el asador con su chimenea, la mesa larga, la barra y la leña.',
    ],
    pesos: 28000, reparto: [0.2, 0.2, 0.3, 0.3],
    piso: (M) => pisoLajas(M),
    paredes: (M) => (c) => {
      const t = T_PIEDRA, yv = Y0 + hw + 0.1;
      muro(c, 'x', D / 2, -W / 2, W / 2, hw, { t, piedra: true, semilla: 7 });
      for (const sx of [-1, 1]) muro(c, 'z', sx * W / 2, -D / 2 + 1.3, D / 2, 2 * FILA, { t, piedra: true, semilla: 8 + sx });
      // los postes del frente y de los costados, con las vigas que cargan el techo
      const postes = [[-W / 2 + 0.15, -D / 2 + 0.15], [-1.7, -D / 2 + 0.15], [1.7, -D / 2 + 0.15], [W / 2 - 0.15, -D / 2 + 0.15], [-W / 2 + 0.15, -D / 2 + 1.3], [W / 2 - 0.15, -D / 2 + 1.3]];
      for (const [x, z] of postes) cil(c, 0.1, 0.12, hw + 0.15, [x, Y0 + (hw + 0.15) / 2, z], MADERA_OSCURA, { tipo: 0, lados: 6, variar: 0.07 });
      caja(c, W, 0.2, 0.2, [0, yv, -D / 2 + 0.15], MADERA_OSCURA, { tipo: 0 });
      for (const sx of [-1, 1]) caja(c, 0.2, 0.2, D, [sx * (W / 2 - 0.15), yv, 0], MADERA_OSCURA, { tipo: 0 });
      // el cerramiento de los frontones (arriba de las vigas)
      for (const dx of [-W / 2, W / 2]) triangulo(c, [dx, M.techoPared, -D / 2], [dx, M.techoPared, D / 2], [dx, M.techoPared + M.subida, 0], PARED);
    },
    interior(c, M) {
      const py = PISO_Y, zA = D / 2 - 0.5;
      // el asador de piedra contra el fondo, con la parrilla, las brasas, la campana y la chimenea
      caja(c, 2.5, 0.9, 0.9, [0, py + 0.45, zA], PIEDRA, { variar: 0.16 });
      for (const [i, w] of [[0, 0.8], [1, 0.8], [2, 0.8]]) caja(c, w, 0.3, 0.07, [-0.84 + i * 0.84, py + 0.2, zA - 0.46], PIEDRAS[i + 1], { variar: 0.16 });
      for (const [i, w] of [[0, 1.2], [1, 1.2]]) caja(c, w, 0.3, 0.07, [-0.62 + i * 1.24, py + 0.6, zA - 0.46], PIEDRAS[i + 2], { variar: 0.16 });
      caja(c, 1.5, 0.12, 0.62, [0, py + 0.91, zA - 0.04], '#1d1815', { variar: 0.04 });
      for (let i = 0; i < 5; i++) caja(c, 0.22, 0.06, 0.18, [-0.5 + i * 0.25, py + 0.97, zA - 0.04 + (i % 2) * 0.1], i % 2 ? '#c8552a' : '#8a3a22', { variar: 0.1 });
      for (let i = 0; i < 8; i++) caja(c, 0.02, 0.02, 0.62, [-0.56 + i * 0.16, py + 1.04, zA - 0.04], HIERRO, { tipo: 0 });
      caja(c, 1.3, 0.03, 0.03, [0, py + 1.06, zA - 0.3], HIERRO, { tipo: 0 }); caja(c, 1.3, 0.03, 0.03, [0, py + 1.06, zA + 0.22], HIERRO, { tipo: 0 });
      caja(c, 2.0, 0.14, 1.0, [0, py + 1.72, zA], PIEDRA, { variar: 0.14 });
      caja(c, 1.5, 0.5, 0.8, [0, py + 2.0, zA + 0.04], PIEDRA, { variar: 0.14 });
      const alto = M.techoPared + M.subida + 1.0 - py - 2.2;
      caja(c, 0.85, alto, 0.6, [0, py + 2.25 + alto / 2, D / 2 - 0.45], PIEDRA, { variar: 0.14 });
      caja(c, 1.0, 0.12, 0.75, [0, py + 2.25 + alto + 0.05, D / 2 - 0.45], '#5d574f', { variar: 0.1 });
      // la mesa larga con sus bancos y la barra con banquetas
      mesaLarga(c, -0.9, -0.4, py, 3.0, 0.9);
      mostrador(c, W / 2 - 0.55, 0.5, py, 2.6, 0.7, 1.05, true);
      for (let i = 0; i < 3; i++) banqueta(c, W / 2 - 1.3, -0.4 + i * 0.95, py);
      // la leña apilada y los faroles
      for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - (r === 2 ? 1 : 0); i++) cil(c, 0.085, 0.085, 0.9, [-W / 2 + 0.7 + (r === 2 ? 0.1 : 0), py + 0.1 + r * 0.17, D / 2 - 1.3 + i * 0.19 + (r === 1 ? 0.09 : 0)], i % 2 ? '#6b5238' : '#7a5f43', { lados: 5, rot: [0, 0, Math.PI / 2], variar: 0.12 });
      farolColgante(c, -1.6, py + 1.9, -0.4); farolColgante(c, 1.2, py + 1.9, 0.6);
    },
    fisica(k, f) {
      const r = 0.17;
      if (k === 3) {
        f.segmentos.length = 0;
        f.segmentos.push([-W / 2, D / 2, W / 2, D / 2, r, 0.48, Y0 + hw], [-W / 2, -D / 2 + 1.3, -W / 2, D / 2, r, 0.48, Y0 + 2 * FILA], [W / 2, -D / 2 + 1.3, W / 2, D / 2, r, 0.48, Y0 + 2 * FILA]);
        for (const [x, z] of [[-W / 2 + 0.15, -D / 2 + 0.15], [-1.7, -D / 2 + 0.15], [1.7, -D / 2 + 0.15], [W / 2 - 0.15, -D / 2 + 0.15], [-W / 2 + 0.15, -D / 2 + 1.3], [W / 2 - 0.15, -D / 2 + 1.3]]) f.circulos.push([x, z, 0.13, 0.5, Y0 + hw + 0.2]);
      }
      if (k === 4) {
        f.segmentos.push([-0.85, D / 2 - 0.5, 0.85, D / 2 - 0.5, 0.45, 0.5, PISO_Y + 2.4]);
        cuerpo(f, -0.9, -0.4, 3.0, 0.9, 0.85); cuerpo(f, -0.9, -1.12, 2.8, 0.3, 0.5); cuerpo(f, -0.9, 0.32, 2.8, 0.3, 0.5);
        cuerpo(f, W / 2 - 0.55, 0.5, 0.7, 2.6, 1.05);
        cuerpo(f, -W / 2 + 0.7, D / 2 - 0.95, 0.4, 0.9, 0.6);
      }
    },
  });
})();

// ================================================================ 5. galería cerrada
function maceta(c, x, z, py, tam = 1) {
  cil(c, 0.17 * tam, 0.12 * tam, 0.3 * tam, [x, py + 0.15 * tam, z], '#a8573a', { lados: 7, variar: 0.1 });
  c.agregar(new THREE.IcosahedronGeometry(0.24 * tam, 0), { color: '#5f7a43', tipo: 4, variar: 0.14, matriz: matriz([x, py + 0.45 * tam, z], [0, 0, 0], [1, 1.2, 1]) });
  c.agregar(new THREE.IcosahedronGeometry(0.15 * tam, 0), { color: '#6f8a4d', tipo: 4, variar: 0.14, matriz: matriz([x + 0.13 * tam, py + 0.6 * tam, z - 0.05]) });
}
const galeriaCerrada = (() => {
  const W = 7.0, D = 2.6, hw = 2.45, sill = 0.9;
  const xsF = [-3.5, -2.33, -1.17, 1.17, 2.33, 3.5];
  return ampliacion({
    id: 'galeria-cerrada', nombre: 'Galería cerrada',
    texto: 'Una galería con ventanales: antepecho de tablas, la ventana alta con vidrio y arriba el techo de una agua. Sin pared de atrás: se arrima al frente de la casa y la puerta de la casa queda adentro, cubierta del viento y de la nieve. Banco corrido, mesa para el mate y macetas.',
    ancho: W, fondo: D, alto: hw + 0.35, subida: 0.55, eje: 'x', desnivelMax: 0.8, zocalo: false,
    pide: [{ piedra: 10, tronco: 4 }, { tabla: 22, tronco: 3 }, { tabla: 34, tronco: 12 }, { tabla: 28, tronco: 6, piedra: 2 }],
    dice: [
      'Pilotes de piedra y tirantes: la galería apoya sin tocar la tierra.',
      'Piso de tablas, con un escalón ancho al frente.',
      'Antepecho de tablas, postes, travesaños y la hilera de vidrios de arriba. La puerta queda al frente y atrás se deja abierto, para la casa.',
      'El techo de una agua que baja hacia el frente, el banco corrido, la mesa y las macetas.',
    ],
    pesos: 30000, reparto: [0.15, 0.2, 0.35, 0.3],
    paredes: () => (c) => {
      const yTop = Y0 + hw;
      // el antepecho, a los tres lados (atrás se deja abierto)
      muro(c, 'x', -D / 2, -W / 2, W / 2, sill, { huecos: [huecoDePuerta(W)] });
      for (const sx of [-1, 1]) muro(c, 'z', sx * W / 2, -D / 2, D / 2, sill);
      const frente = (x) => [x, -D / 2], costados = [-1, 1].flatMap((sx) => [-D / 2, 0, D / 2].map((z) => [sx * W / 2, z]));
      for (const [x, z] of [...xsF.map(frente), ...costados]) cil(c, 0.06, 0.07, hw, [x, Y0 + hw / 2, z], MADERA_OSCURA, { tipo: 0, lados: 6, variar: 0.06 });
      // el travesaño de arriba, el de la ventana alta y el del antepecho
      for (const y of [yTop, Y0 + 2.12, Y0 + sill + 0.02]) {
        caja(c, W + 0.1, 0.1, 0.12, [0, y, -D / 2], MADERA_OSCURA, { tipo: 0 });
        for (const sx of [-1, 1]) caja(c, 0.12, 0.1, D + 0.1, [sx * W / 2, y, 0], MADERA_OSCURA, { tipo: 0 });
      }
      caja(c, W + 0.1, 0.12, 0.12, [0, yTop, D / 2], MADERA_OSCURA, { tipo: 0 });
      // los vidrios de arriba (de poste a poste) y los montantes finos de la ventana de abajo
      const pares = [[-3.5, -2.33], [-2.33, -1.17], [1.17, 2.33], [2.33, 3.5]];
      for (const [a, b] of pares) {
        caja(c, b - a - 0.14, 0.28, 0.02, [(a + b) / 2, Y0 + 2.27, -D / 2], VIDRIO, { variar: 0.03 });
        caja(c, 0.03, 1.15, 0.03, [(a + b) / 2, Y0 + 1.5, -D / 2], MADERA_OSCURA, { tipo: 0 });
      }
      caja(c, 0.58, 0.28, 0.02, [-0.88, Y0 + 2.27, -D / 2], VIDRIO, { variar: 0.03 }); caja(c, 0.58, 0.28, 0.02, [0.88, Y0 + 2.27, -D / 2], VIDRIO, { variar: 0.03 });
      for (const sx of [-1, 1]) for (const [a, b] of [[-D / 2, 0], [0, D / 2]]) {
        caja(c, 0.02, 0.28, b - a - 0.14, [sx * W / 2, Y0 + 2.27, (a + b) / 2], VIDRIO, { variar: 0.03 });
        caja(c, 0.03, 1.15, 0.03, [sx * W / 2, Y0 + 1.5, (a + b) / 2], MADERA_OSCURA, { tipo: 0 });
      }
      marcoPuerta(c, -D / 2 - 0.04);
    },
    techo: () => (c) => techoUnAgua(c, W, D, Y0 + hw + 0.1, Y0 + hw + 0.65),
    interior(c) {
      const py = PISO_Y;
      // el banco corrido bajo la ventana (a cada lado de la puerta) con almohadones
      for (const sx of [-1, 1]) {
        caja(c, 2.4, 0.06, 0.45, [sx * 2.3, py + 0.45, -D / 2 + 0.38], TABLA);
        caja(c, 2.3, 0.4, 0.06, [sx * 2.3, py + 0.2, -D / 2 + 0.2], MADERA_OSCURA, { tipo: 0 });
        for (let i = 0; i < 3; i++) caja(c, 0.5, 0.1, 0.38, [sx * 2.3 + (i - 1) * 0.75, py + 0.53, -D / 2 + 0.38], ['#7b4a3a', '#b9ae9a', '#5f7a6a'][(i + (sx > 0 ? 1 : 0)) % 3], { variar: 0.1 });
      }
      // la mesa del mate con dos sillas, al fondo a la derecha
      caja(c, 1.0, 0.07, 0.7, [2.2, py + 0.72, 0.5], TABLA);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.06, 0.7, 0.06, [2.2 + sx * 0.44, py + 0.36, 0.5 + sz * 0.29], MADERA_OSCURA, { tipo: 0 });
      sillaChica(c, 1.55, 0.5, py, -Math.PI / 2); sillaChica(c, 2.85, 0.5, py, Math.PI / 2);
      cil(c, 0.06, 0.05, 0.1, [2.1, py + 0.81, 0.5], '#a8573a', { lados: 6 });
      // las macetas al fondo a la izquierda y una alfombra larga
      for (let i = 0; i < 4; i++) maceta(c, -3.1 + i * 0.5, D / 2 - 0.3, py, 0.9 + (i % 2) * 0.2);
      caja(c, 3.2, 0.02, 0.9, [-0.2, py + 0.012, 0.1], '#8a4b3c', { variar: 0.08 });
      farolColgante(c, -1.2, py + 1.9, 0.4); farolColgante(c, 1.2, py + 1.9, 0.4);
    },
    fisica(k, f) {
      if (k === 3) {
        f.segmentos.length = 0;
        const v = PUERTA / 2 + 0.07, r = 0.08, top = Y0 + hw;
        f.segmentos.push([-W / 2, -D / 2, -v, -D / 2, r, 0.48, top], [v, -D / 2, W / 2, -D / 2, r, 0.48, top], [-W / 2, -D / 2, -W / 2, D / 2, r, 0.48, top], [W / 2, -D / 2, W / 2, D / 2, r, 0.48, top]);
      }
      if (k === 4) {
        for (const sx of [-1, 1]) cuerpo(f, sx * 2.3, -D / 2 + 0.4, 2.4, 0.45, 0.6);
        cuerpo(f, 2.2, 0.5, 1.0, 0.7, 0.8);
      }
    },
  });
})();

// ================================================================ 6. cocina ampliada
function cocinaALena(c, x, z, py, yTecho) {
  caja(c, 0.95, 0.85, 0.65, [x, py + 0.425, z], '#3d3a36', { tipo: 0, variar: 0.06 });
  caja(c, 1.02, 0.05, 0.72, [x, py + 0.875, z], '#2a2825', { tipo: 0, variar: 0.04 });
  for (const dx of [-0.22, 0.22]) cil(c, 0.14, 0.14, 0.02, [x + dx, py + 0.91, z - 0.05], HIERRO, { tipo: 0, lados: 8, variar: 0.04 });
  caja(c, 0.5, 0.42, 0.03, [x - 0.1, py + 0.4, z - 0.34], '#4b4742', { tipo: 0 });
  caja(c, 0.3, 0.03, 0.04, [x - 0.1, py + 0.58, z - 0.37], BRONCE, { tipo: 0 });
  caja(c, 0.2, 0.3, 0.03, [x + 0.32, py + 0.42, z - 0.34], '#4b4742', { tipo: 0 });
  const alto = yTecho - py - 0.9;
  cil(c, 0.07, 0.07, alto, [x + 0.3, py + 0.9 + alto / 2, z + 0.15], HIERRO, { tipo: 0, lados: 6, variar: 0.05 });
}
function alacena(c, x0, x1, z, py) {
  const w = x1 - x0, xm = (x0 + x1) / 2;
  caja(c, w, 0.78, 0.36, [xm, py + 1.88, z], '#6b5238', { variar: 0.08 });
  caja(c, w + 0.06, 0.05, 0.4, [xm, py + 2.3, z], MADERA_OSCURA, { tipo: 0 });
  const n = Math.max(2, Math.round(w / 0.55));
  for (let i = 0; i < n; i++) {
    caja(c, w / n - 0.06, 0.66, 0.03, [x0 + w * (i + 0.5) / n, py + 1.88, z - 0.2], TABLA, { variar: 0.08 });
    caja(c, 0.03, 0.12, 0.04, [x0 + w * (i + 0.5) / n + (i % 2 ? -0.1 : 0.1), py + 1.86, z - 0.22], HIERRO, { tipo: 0 });
  }
}
const cocina = (() => {
  const W = 5.2, D = 4.4, H = 2.5;
  return ampliacion({
    id: 'cocina-ampliada', nombre: 'Cocina ampliada',
    texto: 'Una cocina de verdad arrimada a la casa: cocina a leña con su caño, mesada con pileta, alacena de pared, hogar de piedra para el puchero, mesa con banquetas, ollas colgadas y el barril del agua. Es un cuarto de adorno y de comodidad: las recetas se siguen cocinando en tu fogón y tu horno.',
    ancho: W, fondo: D, alto: H, subida: 1.3, eje: 'x', desnivelMax: 1.0,
    ventanas: [...frenteV(D, [-1.9, 1.9]), ...fondoV(D, [1.5]), ...ladoV(W, -1, [-0.3])],
    hogares: [{ lado: 1, z: 1.0 }],
    mesas: [{ x: 0.9, z: -0.6 }],
    alfombras: [{ x: 0.9, z: -0.6, w: 2.3, d: 1.9 }],
    pide: [{ piedra: 12, tronco: 5 }, { tabla: 16, tronco: 3 }, { tabla: 22, tronco: 8, piedra: 4 }, { tabla: 22, piedra: 16, tronco: 4 }],
    dice: [
      'Un anillo de piedra y los tirantes: la cocina asienta sobre lo firme.',
      'Piso de tablas gruesas, con su escalón de entrada.',
      'Paredes de tabla con tres ventanas, para que entre luz sobre la mesada.',
      'El techo, el hogar de piedra, la cocina a leña con su caño, la mesada con pileta, la alacena, la mesa y las ollas.',
    ],
    pesos: 32000,
    interior(c, M) {
      const py = PISO_Y, zb = D / 2 - 0.38;
      cocinaALena(c, -2.0, zb, py, M.techoPared + M.subida * (1 - zb / (D / 2)) + 0.5);
      // la mesada con la pileta y la canilla, y la alacena de pared
      mostrador(c, -0.45, zb, py, 2.1, 0.6, 0.9);
      caja(c, 0.55, 0.06, 0.4, [-0.6, py + 0.9, zb], '#3a3f40', { variar: 0.04 });
      cil(c, 0.02, 0.02, 0.28, [-0.6, py + 1.05, zb + 0.2], BRONCE, { tipo: 0, lados: 5 });
      caja(c, 0.02, 0.02, 0.14, [-0.6, py + 1.18, zb + 0.13], BRONCE, { tipo: 0 });
      for (let i = 0; i < 4; i++) cil(c, 0.07, 0.06, 0.06, [-1.2 + i * 0.5, py + 0.96, zb - 0.05 + (i % 2) * 0.05], i % 2 ? '#c9b25a' : '#a8573a', { lados: 6, variar: 0.1 });
      alacena(c, -1.5, 0.6, D / 2 - 0.2, py);
      // las ollas colgadas de una viga sobre la mesa
      caja(c, 2.3, 0.1, 0.1, [0.9, py + 2.05, -0.6], MADERA_OSCURA, { tipo: 0 });
      for (let i = 0; i < 4; i++) { caja(c, 0.015, 0.22, 0.015, [0.1 + i * 0.5, py + 1.9, -0.6], HIERRO, { tipo: 0 }); olla(c, 0.1 + i * 0.5, py + 1.72, -0.6, 0.11 + (i % 2) * 0.03, i % 2 ? BRONCE : HIERRO); }
      barril(c, -2.3, -1.5, py, 0.3, 0.8);
      // la leña junto al hogar
      for (let r = 0; r < 2; r++) for (let i = 0; i < 3 - r; i++) cil(c, 0.08, 0.08, 0.6, [2.15, py + 0.09 + r * 0.16, -1.4 + i * 0.18 + r * 0.09], i % 2 ? '#6b5238' : '#7a5f43', { lados: 5, rot: [Math.PI / 2, 0, 0], variar: 0.12 });
      farolColgante(c, -0.9, py + 1.95, -1.2);
    },
    fisica(k, f) {
      if (k === 4) {
        cuerpo(f, -2.0, D / 2 - 0.38, 0.95, 0.65, 0.88); cuerpo(f, -0.45, D / 2 - 0.38, 2.1, 0.6, 0.9);
        f.circulos.push([-2.3, -1.5, 0.32, PISO_Y - 0.05, PISO_Y + 0.8]);
      }
    },
  });
})();

// ================================================================ 7. bodega de piedra
function barrilZ(c, x, y, z, r = 0.31, largo = 0.9) {
  cil(c, r, r * 0.94, largo, [x, y, z], TABLA, { lados: 8, rot: [Math.PI / 2, 0, 0], variar: 0.1 });
  for (const dz of [-0.3, 0.3]) cil(c, r * 1.04, r * 1.04, 0.04, [x, y, z + dz * largo], HIERRO, { tipo: 0, lados: 8, rot: [Math.PI / 2, 0, 0], variar: 0.05 });
  cil(c, 0.03, 0.03, 0.05, [x, y + r * 0.9, z - largo * 0.1], BRONCE, { tipo: 0, lados: 5 });
}
function botellero(c, x, z, py, w = 1.5, alto = 1.5) {
  caja(c, w, alto, 0.34, [x, py + alto / 2, z], MADERA_OSCURA, { tipo: 0, variar: 0.06 });
  const cols = 6, filas = 4;
  for (let f = 0; f < filas; f++) for (let i = 0; i < cols; i++) {
    const col = ['#3d5a3a', '#4a6a44', '#5a3a2a', '#2f4a3a'][(f + i) % 4];
    caja(c, 0.1, 0.1, 0.1, [x - w / 2 + 0.17 + i * (w - 0.34) / (cols - 1), py + 0.2 + f * (alto - 0.4) / (filas - 1), z - 0.2], col, { variar: 0.08 });
  }
  for (let f = 0; f <= filas; f++) caja(c, w + 0.04, 0.03, 0.36, [x, py + 0.06 + f * (alto - 0.1) / filas, z], TABLA, { variar: 0.06 });
}
const bodega = (() => {
  const W = 5.6, D = 4.6, hw = 5 * FILA, sub = 1.1;
  const gable = (u) => hw + sub * (1 - Math.abs(u - W / 2) / (W / 2));
  return ampliacion({
    id: 'bodega-piedra', nombre: 'Bodega de piedra', categoria: 'trabajo',
    texto: 'Una bodega de muros de piedra gruesos, con el techo bajo de dos aguas: fresca en verano y sin helar en invierno. Barriles en su caballete, botellero hasta arriba, estantes con frascos, una mesa de piedra y el piso de lajas. Pide mucha piedra: es trabajo para el pico.',
    ancho: W, fondo: D, alto: hw + 0.35, subida: sub, eje: 'z', desnivelMax: 0.9, zocalo: false,
    ventanas: [{ orient: 'z', s: -1, cx: -1.85, cz: -D / 2, t: 0.42 }, { orient: 'z', s: -1, cx: 1.85, cz: -D / 2, t: 0.42 }, { orient: 'x', s: -1, cx: -W / 2, cz: 0, t: 0.42 }],
    pide: [{ piedra: 20, tronco: 4 }, { piedra: 24, tabla: 4 }, { piedra: 56, tronco: 8 }, { tabla: 24, piedra: 8, tronco: 6 }],
    dice: [
      'Piedra sobre piedra: un anillo ancho asienta la bodega.',
      'Un piso de lajas de piedra, parejo y fresco.',
      'Los muros gruesos de piedra, hilada por hilada, con el frontón de piedra, la puerta y tres ventanas chicas.',
      'El techo bajo de dos aguas, los barriles en su caballete, el botellero, los estantes y la mesa de piedra.',
    ],
    pesos: 36000, reparto: [0.2, 0.2, 0.35, 0.25],
    piso: (M) => pisoLajas(M),
    paredes: (M, P) => (c) => {
      const t = T_PIEDRA;
      muro(c, 'x', -D / 2, -W / 2, W / 2, gable, { t, piedra: true, huecos: [huecoDePuerta(W)], semilla: 21 });
      muro(c, 'x', D / 2, -W / 2, W / 2, gable, { t, piedra: true, semilla: 22 });
      muro(c, 'z', -W / 2, -D / 2, D / 2, hw, { t, piedra: true, semilla: 23 });
      muro(c, 'z', W / 2, -D / 2, D / 2, hw, { t, piedra: true, semilla: 24 });
      marcoPuerta(c, -D / 2 - t / 2 - 0.06);
      for (const v of P.ventanas) ventana(c, v);
    },
    interior(c) {
      const py = PISO_Y, zb = D / 2 - 0.6;
      // el caballete con los barriles (tres abajo, dos arriba)
      for (const dz of [-0.28, 0.28]) caja(c, 2.3, 0.14, 0.12, [0, py + 0.08, zb + dz], MADERA_OSCURA, { tipo: 0 });
      for (const x of [-0.66, 0, 0.66]) barrilZ(c, x, py + 0.46, zb);
      for (const x of [-0.33, 0.33]) barrilZ(c, x, py + 1.0, zb);
      botellero(c, 1.95, D / 2 - 0.3, py, 1.4, 1.6);
      estanteria(c, -1.95, D / 2 - 0.25, py, 1.4, 1.8, 4, 31);
      // la mesa de piedra con jarras y un banco de tronco
      caja(c, 1.5, 0.12, 0.8, [-0.9, py + 0.86, -0.6], '#8a857b', { variar: 0.14 });
      for (const sx of [-1, 1]) caja(c, 0.3, 0.8, 0.6, [-0.9 + sx * 0.5, py + 0.4, -0.6], PIEDRA, { variar: 0.16 });
      for (let i = 0; i < 3; i++) cil(c, 0.07, 0.06, 0.16, [-1.3 + i * 0.35, py + 1.0, -0.6], ['#a8573a', '#9fb4c0', '#6a8a5a'][i], { lados: 6, variar: 0.08 });
      cil(c, 0.25, 0.28, 0.4, [-0.9, py + 0.2, 0.25], '#7a5f43', { lados: 7, variar: 0.12 });
      barril(c, 1.9, -1.0, py, 0.3, 0.8);
      farolColgante(c, 0, py + 1.9, -0.4); farolColgante(c, 1.5, py + 1.8, 0.8);
    },
    fisica(k, f) {
      if (k === 3) segmentosPiedra(f, W, D, Y0 + hw, Y0 + hw);
      if (k === 4) {
        cuerpo(f, 0, D / 2 - 0.6, 2.3, 0.95, 1.4); cuerpo(f, 1.95, D / 2 - 0.3, 1.4, 0.34, 1.6); cuerpo(f, -1.95, D / 2 - 0.25, 1.4, 0.34, 1.8);
        cuerpo(f, -0.9, -0.6, 1.5, 0.8, 0.9);
        f.circulos.push([-0.9, 0.25, 0.28, PISO_Y - 0.05, PISO_Y + 0.4], [1.9, -1.0, 0.32, PISO_Y - 0.05, PISO_Y + 0.8]);
      }
    },
  });
})();

// ================================================================ 8. buhardilla
const buhardilla = (() => {
  const W = 4.4, D = 5.2, hw = 2.9, sub = 2.4, LOFT = 2.3, ZL0 = 0.3, N = 9, HUELLA = 0.27, SUBIDA = LOFT / N, ZINI = ZL0 - N * HUELLA, XS = 1.7, ANCHO_S = 0.8;
  const top = PISO_Y + LOFT;
  const gable = (u) => hw + sub * (1 - Math.abs(u - W / 2) / (W / 2));
  return ampliacion({
    id: 'buhardilla', nombre: 'Buhardilla',
    texto: 'Una casita alta de techo empinado, con altillo para dormir: una escalera de tablas sube al piso de arriba, con sus dos camas bajo el techo, una mesa de luz y una baranda. Abajo, la estufa, una mesa chica y los estantes. Calentita y con vista.',
    ancho: W, fondo: D, alto: hw + 0.35, subida: sub, eje: 'z', desnivelMax: 1.0,
    ventanas: [...frenteV(D, [-1.55, 1.55]), { orient: 'z', s: -1, cx: 0, cz: -D / 2, dy: 2.3 }, { orient: 'z', s: 1, cx: 0, cz: D / 2, dy: 2.3 }, ...ladoV(W, -1, [-1.2, 1.4]), ...ladoV(W, 1, [1.3])],
    pide: [{ piedra: 10, tronco: 6 }, { tabla: 24, tronco: 4 }, { tabla: 38, tronco: 14, piedra: 2 }, { tabla: 40, tronco: 10, piedra: 6 }],
    dice: [
      'Un anillo de piedra y los tirantes: la casita alta se apoya firme.',
      'Piso de tablas, con su escalón de entrada.',
      'Paredes altas de tabla, el altillo con su escalera y su baranda, y las ventanas del frontón.',
      'El techo empinado de dos aguas, la estufa, la mesa, los estantes y las dos camas del altillo.',
    ],
    pesos: 42000, reparto: [0.15, 0.2, 0.35, 0.3],
    paredes: (M, P) => (c) => {
      muro(c, 'x', -D / 2, -W / 2, W / 2, gable, { huecos: [huecoDePuerta(W)] });
      muro(c, 'x', D / 2, -W / 2, W / 2, gable);
      muro(c, 'z', -W / 2, -D / 2, D / 2, hw);
      muro(c, 'z', W / 2, -D / 2, D / 2, hw);
      postesEsquina(c, W, D, hw);
      marcoPuerta(c, -D / 2 - 0.04);
      for (const v of P.ventanas) ventana(c, v);
      // el altillo y su escalera
      losa(c, -W / 2 + 0.05, W / 2 - 0.05, ZL0, D / 2 - 0.05, top);
      escalera(c, XS, ZINI, 1, N, SUBIDA, HUELLA, ANCHO_S);
      barandaEscalera(c, XS - ANCHO_S / 2 - 0.04, ZINI, 1, N, SUBIDA, HUELLA);
      baranda(c, -W / 2 + 0.05, ZL0, XS - ANCHO_S / 2 - 0.05, ZL0, top);
    },
    interior(c, M) {
      const py = PISO_Y;
      // abajo: la estufa con su caño que sale por el techo, la mesa chica con dos sillas y un estante
      caja(c, 0.5, 0.7, 0.5, [-1.6, py + 0.35, 2.0], '#3d3a36', { tipo: 0, variar: 0.06 });
      caja(c, 0.56, 0.05, 0.56, [-1.6, py + 0.72, 2.0], '#2a2825', { tipo: 0 });
      cil(c, 0.06, 0.06, 4.1, [-1.6, py + 2.75, 2.0], HIERRO, { tipo: 0, lados: 6, variar: 0.05 });
      caja(c, 0.2, 0.3, 0.03, [-1.6, py + 0.35, 1.74], '#4b4742', { tipo: 0 });
      caja(c, 0.9, 0.06, 0.7, [-0.1, py + 0.74, -0.7], TABLA);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.06, 0.72, 0.06, [-0.1 + sx * 0.4, py + 0.36, -0.7 + sz * 0.3], MADERA_OSCURA, { tipo: 0 });
      sillaChica(c, -0.1, -1.3, py, Math.PI); sillaChica(c, -0.1, -0.1, py, 0);
      estanteria(c, 0.5, D / 2 - 0.2, py, 1.3, 2.0, 4, 41);
      farolColgante(c, 0.1, py + 1.9, -0.4);
      // arriba: las dos camas, la mesa de luz y un baúl, bajo el techo
      camaEn(c, -1.55, 1.45, top); camaEn(c, -0.15, 1.45, top);
      mesaLuz(c, 0.85, 2.25, top);
      baul(c, 1.5, 1.4, top);
      farolColgante(c, 0.9, top + 1.2, 1.1);
    },
    fisica(k, f) {
      if (k === 3) {
        f.plataformas.push([0, (ZL0 + D / 2 - 0.05) / 2, W - 0.1, D / 2 - 0.05 - ZL0, top, 0.16, 0.48]);
        f.plataformas.push(...pasosEscalera(XS, ZINI, 1, N, SUBIDA, HUELLA, ANCHO_S));
        f.segmentos.push([-W / 2 + 0.05, ZL0, XS - ANCHO_S / 2 - 0.05, ZL0, 0.06, top, top + 1.0]);
      }
      if (k === 4) {
        cuerpo(f, -1.6, 2.0, 0.55, 0.55, 0.75); cuerpo(f, -0.1, -0.7, 0.9, 0.7, 0.8); cuerpo(f, 0.5, D / 2 - 0.25, 1.3, 0.34, 2.0);
        cuerpo(f, -1.55, 1.45, 1.0, 2.0, 0.8, top); cuerpo(f, -0.15, 1.45, 1.0, 2.0, 0.8, top);
        cuerpo(f, 0.85, 2.25, 0.5, 0.4, 0.62, top); cuerpo(f, 1.5, 1.4, 0.9, 0.52, 0.62, top);
      }
    },
  });
})();

// ================================================================ 9. salón grande
const salon = (() => {
  const W = 8.8, D = 6.0, H = 2.8;
  return ampliacion({
    id: 'salon-grande', nombre: 'Salón grande',
    texto: 'Un salón de verdad para juntar a todos: dos hogares de piedra, uno en cada punta; vigas a la vista bajo el techo alto; una mesa larga de tres metros y medio con bancos; sillones junto al fuego; estantes con libros y cuatro ventanas al frente. Un lugar para el invierno y las fiestas.',
    ancho: W, fondo: D, alto: H, subida: 1.9, eje: 'x', desnivelMax: 1.2, radio: 6.2,
    ventanas: [...frenteV(D, [-3.4, -1.9, 1.9, 3.4]), ...fondoV(D, [-1.2, 1.2]), ...ladoV(W, -1, [-1.8]), ...ladoV(W, 1, [-1.8])],
    hogares: [{ lado: -1, z: 0 }, { lado: 1, z: 0 }],
    alfombras: [{ x: 0, z: 0.3, w: 5.0, d: 3.2 }],
    pide: [{ piedra: 30, tronco: 12 }, { tabla: 46, tronco: 8 }, { tabla: 60, tronco: 22, piedra: 6 }, { tabla: 62, piedra: 22, tronco: 12 }],
    dice: [
      'Un zócalo de piedra por todo el perímetro y una hilera de pilotes: el salón es grande y pesa.',
      'Piso de tablas en todo el salón, con un escalón ancho al frente.',
      'Paredes de tabla y ocho ventanas: cuatro al frente, dos al fondo y una en cada punta.',
      'El techo alto de dos aguas con sus vigas, los dos hogares de piedra, la mesa larga, los sillones y los estantes.',
    ],
    pesos: 52000, reparto: [0.2, 0.2, 0.3, 0.3],
    interior(c, M) {
      const py = PISO_Y;
      // las vigas a la vista, de lado a lado del techo
      for (const x of [-3.3, 0, 3.3]) caja(c, 0.16, 0.2, D - 0.15, [x, M.techoPared - 0.1, 0], MADERA_OSCURA, { tipo: 0, variar: 0.07 });
      mesaLarga(c, 0, 0.3, py, 3.5, 0.95);
      sillaChica(c, -2.1, 0.3, py, -Math.PI / 2); sillaChica(c, 2.1, 0.3, py, Math.PI / 2);
      for (const sz of [-0.9, 1.5]) { sillon(c, -3.0, sz, py, Math.PI / 2); sillon(c, 3.0, sz, py, -Math.PI / 2, '#5f6a4a'); }
      estanteria(c, -2.4, D / 2 - 0.2, py, 1.9, 2.1, 4, 51);
      estanteria(c, 2.4, D / 2 - 0.2, py, 1.9, 2.1, 4, 63);
      // el mapa grande del valle entre los dos estantes
      caja(c, 1.5, 1.0, 0.04, [0, py + 1.55, D / 2 - 0.08], '#cfc09a', { variar: 0.06 });
      caja(c, 1.62, 0.06, 0.06, [0, py + 2.07, D / 2 - 0.09], MADERA_OSCURA, { tipo: 0 }); caja(c, 1.62, 0.06, 0.06, [0, py + 1.03, D / 2 - 0.09], MADERA_OSCURA, { tipo: 0 });
      farolColgante(c, -1.65, py + 2.0, 0.3); farolColgante(c, 1.65, py + 2.0, 0.3);
    },
    fisica(k, f) {
      if (k === 4) {
        cuerpo(f, 0, 0.3, 3.5, 0.95, 0.85); cuerpo(f, 0, -0.45, 3.3, 0.3, 0.5); cuerpo(f, 0, 1.05, 3.3, 0.3, 0.5);
        for (const sz of [-0.9, 1.5]) { cuerpo(f, -3.0, sz, 0.85, 0.9, 0.9); cuerpo(f, 3.0, sz, 0.85, 0.9, 0.9); }
        cuerpo(f, -2.4, D / 2 - 0.25, 1.9, 0.34, 2.1); cuerpo(f, 2.4, D / 2 - 0.25, 1.9, 0.34, 2.1);
      }
    },
  });
})();

// ================================================================ 10. planta alta con escalera
const plantaAlta = (() => {
  const W = 5.4, D = 4.6, PISO2 = 2.7, TOPE = PISO_Y + PISO2, hw = 5.0, sub = 1.7;
  const N = 10, SUBIDA = PISO2 / N, HUELLA = 0.28, ZINI = -1.2, XS = -2.15, ANCHO_S = 0.9, ZFIN = ZINI + N * HUELLA;
  const xh0 = -W / 2 + 0.05, xh1 = XS + ANCHO_S / 2 + 0.05, x2 = W / 2 - 0.05, zf = -D / 2 + 0.05, zb = D / 2 - 0.05;
  const gable = (u) => hw + sub * (1 - Math.abs(u - W / 2) / (W / 2));
  const zBalcon = -D / 2 - 1.15;
  const P = ampliacion({
    id: 'planta-alta', nombre: 'Planta alta con escalera',
    texto: 'Una casa de dos plantas que se arrima a la tuya: abajo la sala con su hogar de piedra, la mesa y los estantes; una escalera de tablas con baranda sube al piso de arriba, con dos camas, ropero y alfombra, y un balcón al frente. Es la ampliación más alta del refugio.',
    ancho: W, fondo: D, alto: hw + 0.35, subida: sub, eje: 'z', desnivelMax: 1.1, radio: 4.8,
    ventanas: [...frenteV(D, [-1.75, 1.75]), ...frenteV(D, [-1.9, 1.9]).map((v) => ({ ...v, dy: PISO2 })), ...fondoV(D, [0.2]).map((v) => ({ ...v, dy: PISO2 })), ...ladoV(W, -1, [0.6]).map((v) => ({ ...v, dy: PISO2 })), ...ladoV(W, 1, [-1.3])],
    hogares: [{ lado: 1, z: 0.6 }],
    mesas: [{ x: 0.5, z: -0.7 }],
    alfombras: [{ x: 0.5, z: -0.7, w: 2.4, d: 1.9 }],
    pide: [{ piedra: 16, tronco: 8 }, { tabla: 36, tronco: 6 }, { tabla: 80, tronco: 26, piedra: 4 }, { tabla: 70, piedra: 8, tronco: 18 }],
    dice: [
      'Un zócalo de piedra por todo el perímetro y los pilotes: la casa de dos pisos pesa y tiene que asentar bien.',
      'Piso de tablas de la planta baja, con su escalón de entrada.',
      'Paredes de las dos plantas, el piso de arriba con su hueco, la escalera con su baranda y el balcón del frente.',
      'El techo de dos aguas, el hogar de piedra, la mesa y los estantes de abajo, y las camas y el ropero de arriba.',
    ],
    pesos: 64000, reparto: [0.15, 0.15, 0.4, 0.3],
    paredes: (M, P0) => (c) => {
      const puertaAlta = { u0: W / 2 - 0.5, u1: W / 2 + 0.5, y0: TOPE - Y0, h: TOPE - Y0 + 1.95 };
      muro(c, 'x', -D / 2, -W / 2, W / 2, gable, { huecos: [huecoDePuerta(W), puertaAlta] });
      muro(c, 'x', D / 2, -W / 2, W / 2, gable);
      muro(c, 'z', -W / 2, -D / 2, D / 2, hw);
      muro(c, 'z', W / 2, -D / 2, D / 2, hw);
      postesEsquina(c, W, D, hw);
      marcoPuerta(c, -D / 2 - 0.04);
      for (const sx of [-1, 1]) caja(c, 0.14, 2.0, 0.17, [sx * 0.57, TOPE + 1.0, -D / 2 - 0.04], MADERA_OSCURA, { tipo: 0 });
      caja(c, 1.28, 0.14, 0.17, [0, TOPE + 2.0, -D / 2 - 0.04], MADERA_OSCURA, { tipo: 0 });
      for (const v of P0.ventanas) ventana(c, v);
      // una cinta de madera entre las dos plantas
      caja(c, W + 0.1, 0.16, 0.14, [0, TOPE - 0.05, -D / 2 - 0.07], MADERA_OSCURA, { tipo: 0 });
      // el piso de arriba, con el hueco de la escalera
      losa(c, xh1, x2, zf, zb, TOPE);
      losa(c, xh0, xh1, zf, ZINI, TOPE);
      losa(c, xh0, xh1, ZFIN, zb, TOPE);
      escalera(c, XS, ZINI, 1, N, SUBIDA, HUELLA, ANCHO_S);
      barandaEscalera(c, XS + ANCHO_S / 2 + 0.04, ZINI, 1, N, SUBIDA, HUELLA);
      baranda(c, xh1, ZINI, xh1, ZFIN - 0.7, TOPE);
      baranda(c, xh0, ZINI, xh1, ZINI, TOPE);
      // el balcón del frente: tablado, barandas y dos postes
      losa(c, -1.3, 1.3, zBalcon, -D / 2 + 0.05, TOPE);
      baranda(c, -1.3, zBalcon, 1.3, zBalcon, TOPE); baranda(c, -1.3, zBalcon, -1.3, -D / 2, TOPE); baranda(c, 1.3, zBalcon, 1.3, -D / 2, TOPE);
      for (const sx of [-1, 1]) {
        cil(c, 0.07, 0.09, TOPE - 0.1, [sx * 1.15, (TOPE - 0.1) / 2, zBalcon + 0.1], MADERA_OSCURA, { tipo: 0, lados: 6, variar: 0.06 });
        caja(c, 0.08, 0.08, 0.7, [sx * 1.15, TOPE - 0.45, zBalcon + 0.45], MADERA_OSCURA, { tipo: 0, rot: [0.7, 0, 0] });
      }
    },
    interior(c, M) {
      const py = PISO_Y;
      // abajo: el sillón junto al hogar y los estantes
      sillon(c, 1.5, 1.7, py, -Math.PI / 2);
      estanteria(c, -0.3, D / 2 - 0.2, py, 1.5, 2.1, 5, 71);
      maceta(c, 1.9, -1.8, py, 1.1);
      farolColgante(c, 0.5, py + 1.9, -0.7);
      // arriba: dos camas con la mesa de luz en el medio, el ropero, un baúl y una alfombra
      camaEn(c, -0.4, 1.2, TOPE); camaEn(c, 1.1, 1.2, TOPE);
      mesaLuz(c, 0.35, 2.0, TOPE);
      armario(c, 2.1, 1.95, TOPE, 1.0);
      baul(c, -0.4, -0.35, TOPE);
      caja(c, 2.4, 0.02, 1.5, [0.9, TOPE + 0.012, -0.9], '#8a4b3c', { variar: 0.08 });
      farolColgante(c, 0.8, TOPE + 1.9, 0.0);
    },
    fisica(k, f) {
      if (k === 3) {
        f.plataformas.push([(xh1 + x2) / 2, 0, x2 - xh1, zb - zf, TOPE, 0.16, 0.48], [(xh0 + xh1) / 2, (zf + ZINI) / 2, xh1 - xh0, ZINI - zf, TOPE, 0.16, 0.48], [(xh0 + xh1) / 2, (ZFIN + zb) / 2, xh1 - xh0, zb - ZFIN, TOPE, 0.16, 0.48]);
        f.plataformas.push(...pasosEscalera(XS, ZINI, 1, N, SUBIDA, HUELLA, ANCHO_S));
        f.plataformas.push([0, (zBalcon + zf) / 2, 2.6, zf - zBalcon, TOPE, 0.16, 0.48]);
        f.segmentos.push([xh1, ZINI, xh1, ZFIN - 0.7, 0.06, TOPE, TOPE + 1.0], [xh0, ZINI, xh1, ZINI, 0.06, TOPE, TOPE + 1.0]);
        f.segmentos.push([-1.3, zBalcon, 1.3, zBalcon, 0.06, TOPE, TOPE + 1.0], [-1.3, zBalcon, -1.3, -D / 2, 0.06, TOPE, TOPE + 1.0], [1.3, zBalcon, 1.3, -D / 2, 0.06, TOPE, TOPE + 1.0]);
        for (const sx of [-1, 1]) f.circulos.push([sx * 1.15, zBalcon + 0.1, 0.1, -0.05, TOPE - 0.2]);
      }
      if (k === 4) {
        cuerpo(f, 1.5, 1.7, 0.85, 0.9, 0.9); cuerpo(f, -0.3, D / 2 - 0.25, 1.5, 0.34, 2.1);
        f.circulos.push([1.9, -1.8, 0.3, PISO_Y - 0.05, PISO_Y + 0.9]);
        cuerpo(f, -0.4, 1.2, 1.0, 2.0, 0.8, TOPE); cuerpo(f, 1.1, 1.2, 1.0, 2.0, 0.8, TOPE);
        cuerpo(f, 0.35, 2.0, 0.5, 0.4, 0.62, TOPE); cuerpo(f, 2.1, 1.95, 1.0, 0.55, 1.95, TOPE); cuerpo(f, -0.4, -0.35, 0.9, 0.52, 0.62, TOPE);
      }
    },
  });
  P.huellasExtra = [{ lx: 0, lz: -D / 2 - 0.8, ancho: 2.8, fondo: 1.6 }];
  return P;
})();

// ================================================================ 11. torreón de piedra
const torreon = (() => {
  const W = 4.2, D = 4.2, PISO2 = 2.52, TOPE = PISO_Y + PISO2, hw = 5.2, t = T_PIEDRA, HB = TOPE - Y0;   // HB: la cota de arriba de la planta baja (desde Y0)
  const N = 9, SUBIDA = PISO2 / N, HUELLA = 0.28, ZINI = -1.45, XS = -1.3, ANCHO_S = 0.9, ZFIN = ZINI + N * HUELLA;
  const xh0 = -W / 2 + 0.12, xh1 = XS + ANCHO_S / 2 + 0.05, x2 = W / 2 - 0.12, zf = -D / 2 + 0.12, zb = D / 2 - 0.12;
  const P = ampliacion({
    id: 'torreon-piedra', nombre: 'Torreón de piedra',
    texto: 'Un torreón cuadrado de piedra de dos plantas, con techo en punta: abajo la sala con su hogar y su mesa; una escalera de tablas sube al cuarto de arriba, con cama, escritorio, un catalejo y ventanas a los cuatro vientos. Pide mucha piedra: es la obra grande del pico.',
    ancho: W, fondo: D, alto: hw + 0.35, subida: 2.0, eje: 'x', desnivelMax: 1.0, zocalo: false, radio: 4.2,
    nombres: [null, 'Piso y planta baja', 'Entrepiso, escalera y planta alta', null],
    ventanas: [{ orient: 'z', s: -1, cx: -1.4, cz: -D / 2, t: 0.42 }, { orient: 'z', s: -1, cx: 1.4, cz: -D / 2, t: 0.42 }, { orient: 'z', s: -1, cx: 0, cz: -D / 2, t: 0.42, dy: PISO2 }, { orient: 'z', s: 1, cx: 0.4, cz: D / 2, t: 0.42, dy: PISO2 }, { orient: 'x', s: -1, cx: -W / 2, cz: 0.2, t: 0.42, dy: PISO2 }, { orient: 'x', s: 1, cx: W / 2, cz: -1.0, t: 0.42, dy: PISO2 }],
    hogares: [{ lado: 1, z: 0.6 }],
    mesas: [{ x: 0.3, z: -0.4 }],
    alfombras: [{ x: 0.3, z: -0.4, w: 1.9, d: 1.5 }],
    pide: [{ piedra: 40, tronco: 8 }, { piedra: 70, tabla: 8, tronco: 4 }, { piedra: 62, tabla: 26, tronco: 10 }, { tabla: 34, piedra: 20, tronco: 14 }],
    dice: [
      'Piedra sobre piedra: un anillo ancho y hondo para sostener la torre.',
      'Un piso de lajas y los muros de piedra de la planta baja, hilada por hilada, con la puerta y dos ventanas.',
      'El entrepiso con su hueco, la escalera de tablas con su baranda y los muros del cuarto de arriba, con sus ventanas a los cuatro vientos.',
      'El techo en punta de tablas escalonadas, el hogar de piedra, la mesa, y el cuarto de arriba con la cama, el escritorio y el catalejo.',
    ],
    pesos: 78000, reparto: [0.2, 0.3, 0.3, 0.2],
    piso: (M, P0) => {
      const lajas = pisoLajas(M);
      return (c, p, d, suelo) => {
        lajas(c, p, d, suelo);
        // los muros de la planta baja (hasta el entrepiso)
        muro(c, 'x', -D / 2, -W / 2, W / 2, HB, { t, piedra: true, huecos: [huecoDePuerta(W)], semilla: 31 });
        muro(c, 'x', D / 2, -W / 2, W / 2, HB, { t, piedra: true, semilla: 32 });
        muro(c, 'z', -W / 2, -D / 2, D / 2, HB, { t, piedra: true, semilla: 33 });
        muro(c, 'z', W / 2, -D / 2, D / 2, HB, { t, piedra: true, semilla: 34 });
        marcoPuerta(c, -D / 2 - t / 2 - 0.06);
        for (const v of P0.ventanas) if (!v.dy) ventana(c, v);
      };
    },
    paredes: (M, P0) => (c) => {
      // los muros del cuarto de arriba (sobre el entrepiso), las ventanas de arriba, el piso con su hueco y la escalera
      muro(c, 'x', -D / 2, -W / 2, W / 2, hw, { t, piedra: true, huecos: [huecoDePuerta(W)], semilla: 31, desde: HB });
      muro(c, 'x', D / 2, -W / 2, W / 2, hw, { t, piedra: true, semilla: 32, desde: HB });
      muro(c, 'z', -W / 2, -D / 2, D / 2, hw, { t, piedra: true, semilla: 33, desde: HB });
      muro(c, 'z', W / 2, -D / 2, D / 2, hw, { t, piedra: true, semilla: 34, desde: HB });
      for (const v of P0.ventanas) if (v.dy) ventana(c, v);
      losa(c, xh1, x2, zf, zb, TOPE);
      losa(c, xh0, xh1, zf, ZINI, TOPE);
      losa(c, xh0, xh1, ZFIN, zb, TOPE);
      escalera(c, XS, ZINI, 1, N, SUBIDA, HUELLA, ANCHO_S);
      barandaEscalera(c, XS + ANCHO_S / 2 + 0.04, ZINI, 1, N, SUBIDA, HUELLA);
      baranda(c, xh1, ZINI, xh1, ZFIN - 0.7, TOPE);
      baranda(c, xh0, ZINI, xh1, ZINI, TOPE);
    },
    techo: () => (c) => techoPiramide(c, Y0 + hw, W / 2 + 0.42, 2.6, 7),
    interior(c, M) {
      const py = PISO_Y;
      // abajo: los estantes y un baúl
      estanteria(c, 0.5, D / 2 - 0.3, py, 1.4, 2.0, 4, 81);
      baul(c, -0.2, 1.6, py);
      farolColgante(c, 0.3, py + 1.9, -0.4);
      // arriba: la cama, el escritorio con libros, el catalejo en su trípode y un farol
      camaEn(c, 1.35, 0.9, TOPE);
      mostrador(c, 0.0, 1.6, TOPE, 1.3, 0.6, 0.8);
      for (let i = 0; i < 4; i++) caja(c, 0.1, 0.2 + (i % 2) * 0.05, 0.16, [-0.45 + i * 0.12, TOPE + 0.92, 1.6], ['#8a4a5a', '#6a8a5a', '#c8a04a', '#9fb4c0'][i], { variar: 0.08 });
      caja(c, 0.4, 0.02, 0.28, [0.3, TOPE + 0.81, 1.6], PAPEL, { variar: 0.05 });
      for (const [dx, dz] of [[-0.18, -0.1], [0.18, -0.1], [0, 0.18]]) caja(c, 0.04, 0.9, 0.04, [dx * 0.8, TOPE + 0.45, -1.3 + dz], MADERA_OSCURA, { tipo: 0, rot: [dz * 0.3, 0, -dx * 0.3] });
      caja(c, 0.12, 0.12, 0.95, [0, TOPE + 1.0, -1.35], BRONCE, { tipo: 0, rot: [0.28, 0, 0] });
      caja(c, 0.16, 0.16, 0.12, [0, TOPE + 1.1, -1.82], HIERRO, { tipo: 0, rot: [0.28, 0, 0] });
      caja(c, 1.6, 0.02, 1.3, [0.6, TOPE + 0.012, -0.5], '#8a4b3c', { variar: 0.08 });
      farolColgante(c, 0.6, TOPE + 1.9, 0.4);
    },
    fisica(k, f) {
      if (k === 2) segmentosPiedra(f, W, D, TOPE, TOPE);
      if (k === 3) {
        f.segmentos.length = 0;
        segmentosPiedra(f, W, D, Y0 + hw, Y0 + hw);
        for (const s of f.segmentos) s[5] = TOPE - 0.12;   // (los de abajo ya están desde la etapa anterior)
        f.plataformas.push([(xh1 + x2) / 2, 0, x2 - xh1, zb - zf, TOPE, 0.16, 0.48], [(xh0 + xh1) / 2, (zf + ZINI) / 2, xh1 - xh0, ZINI - zf, TOPE, 0.16, 0.48], [(xh0 + xh1) / 2, (ZFIN + zb) / 2, xh1 - xh0, zb - ZFIN, TOPE, 0.16, 0.48]);
        f.plataformas.push(...pasosEscalera(XS, ZINI, 1, N, SUBIDA, HUELLA, ANCHO_S));
        f.segmentos.push([xh1, ZINI, xh1, ZFIN - 0.7, 0.06, TOPE, TOPE + 1.0], [xh0, ZINI, xh1, ZINI, 0.06, TOPE, TOPE + 1.0]);
      }
      if (k === 4) {
        cuerpo(f, 0.5, D / 2 - 0.3, 1.4, 0.34, 2.0); cuerpo(f, -0.2, 1.6, 0.9, 0.52, 0.62);
        cuerpo(f, 1.35, 0.9, 1.0, 2.0, 0.8, TOPE); cuerpo(f, 0.0, 1.6, 1.3, 0.6, 0.8, TOPE);
        f.circulos.push([0, -1.35, 0.3, TOPE - 0.05, TOPE + 1.1]);
      }
    },
  });
  return P;
})();

export const PLANOS_AMPLIAR = [dormitorioAnexo, despensa, taller, quincho, galeriaCerrada, cocina, bodega, buhardilla, salon, plantaAlta, torreon];

// ================================================================ las tres piezas sueltas
const base = { pieza: true };
// bloques de piedra de a hiladas, en una fila centrada en x = 0: `anchos` son los largos de cada bloque (la fila suma `total`)
function hilada(c, y, alto, anchos, z, grueso, semilla, color = null) {
  const total = anchos.reduce((a, b) => a + b, 0);
  let x = -total / 2;
  anchos.forEach((w, i) => {
    caja(c, w - 0.02, alto - 0.02, grueso + hs(semilla + i * 2.7) * 0.05, [x + w / 2, y + alto / 2, z], color || PIEDRAS[Math.floor(hs(semilla + i * 5.1 + y * 3) * 4) % 4], { variar: 0.16 });
    x += w;
  });
}
export const PIEZAS_AMPLIAR = [
  {
    ...base, id: 'hogar-grande', nombre: 'Gran hogar de piedra', categoria: 'refugios', radio: 1.9, ancho: 3.6, fondo: 1.5, alto: 4.5, separacion: 1.4, confort: 2,
    apoyaEnPlataforma: true, fuego: true, fuegoContenido: true, funciones: ['calor'], chimenea: { ly: 4.6 },
    texto: 'Un hogar de piedra de los de antes: boca ancha con su grúa y su olla, campana de piedra, chimenea alta, banquitos de piedra a los lados y un dintel de madera. Se prende con F: calienta toda la casa y el humo se ve de lejos. Contra la pared de una sala grande, de espaldas a +Z. Pide mucha piedra.',
    pide: { piedra: 56, tabla: 2, tronco: 2 }, pesos: 20000, soloRelax: true, pendienteMax: 0.4,
    fisica(h) {
      h.segmento(-1.25, 0.15, 1.25, 0.15, 0.55, -0.02, 4.5);
      for (const sx of [-1, 1]) h.segmento(sx * 1.5, -0.7, sx * 1.5, -0.55, 0.25, -0.02, 0.5);
    },
    arma(c) {
      const zc = 0.15;
      // los dos costados de la boca (cuatro hiladas) y el piso del hogar
      for (const sx of [-1, 1]) for (let f = 0; f < 4; f++) {
        const ya = f * 0.3, x0 = sx * 0.55;
        const anchos = f % 2 ? [0.45, 0.8] : [0.8, 0.45];
        let x = x0;
        for (const w of sx > 0 ? anchos : [...anchos].reverse()) { caja(c, w - 0.02, 0.28, 1.1 + hs(f * 3 + sx + x) * 0.05, [x + sx * w / 2, ya + 0.14, zc], PIEDRAS[(f + (sx > 0 ? 1 : 0) + Math.round(x * 3)) & 3], { variar: 0.16 }); x += sx * w; }
      }
      caja(c, 1.12, 0.1, 1.0, [0, 0.05, zc], '#8a857b', { variar: 0.12 });
      caja(c, 1.1, 1.2, 0.08, [0, 0.66, zc + 0.5], '#1d1815', { variar: 0.04 });
      for (let i = 0; i < 4; i++) caja(c, 0.2, 0.07, 0.16, [-0.32 + i * 0.22, 0.14, zc + 0.05 + (i % 2) * 0.14], i % 2 ? '#c8552a' : '#8a3a22', { variar: 0.1 });
      // el dintel de madera, la campana (cuatro hiladas que se angostan) y la chimenea
      caja(c, 1.9, 0.17, 1.3, [0, 1.28, zc - 0.05], MADERA_OSCURA, { tipo: 0, variar: 0.07 });
      hilada(c, 1.37, 0.3, [1.0, 1.0, 1.0], zc, 1.1, 5, null);
      hilada(c, 1.67, 0.3, [0.9, 0.9, 0.9], zc, 0.95, 9);
      hilada(c, 1.97, 0.3, [0.8, 0.8], zc, 0.8, 13);
      hilada(c, 2.27, 0.3, [0.45, 0.45], zc, 0.65, 17);
      for (let f = 0; f < 6; f++) caja(c, 0.7, 0.3, 0.55 + hs(f * 1.3) * 0.04, [0, 2.57 + f * 0.3 + 0.15, zc], PIEDRAS[f & 3], { variar: 0.16 });
      caja(c, 0.95, 0.14, 0.8, [0, 4.44, zc], '#5d574f', { variar: 0.1 });
      // los banquitos de piedra a los lados
      for (const sx of [-1, 1]) {
        caja(c, 0.55, 0.5, 0.5, [sx * 1.5, 0.25, -0.62], PIEDRA, { variar: 0.16 });
        caja(c, 0.62, 0.07, 0.56, [sx * 1.5, 0.53, -0.62], '#8a857b', { variar: 0.12 });
      }
      // la grúa de hierro con su olla colgada sobre las brasas
      cil(c, 0.03, 0.03, 1.2, [0.45, 0.65, zc + 0.3], HIERRO, { tipo: 0, lados: 5 });
      caja(c, 0.55, 0.03, 0.03, [0.2, 1.2, zc + 0.3], HIERRO, { tipo: 0 });
      caja(c, 0.015, 0.4, 0.015, [-0.02, 1.0, zc + 0.3], HIERRO, { tipo: 0 });
      olla(c, -0.02, 0.72, zc + 0.3, 0.14);
    },
  },
  {
    ...base, id: 'pared-piedra', nombre: 'Pared de piedra', categoria: 'refugios', radio: 1.72, ancho: 3.0, fondo: 0.3, alto: 2.28, separacion: 0.18,
    apoyaEnPlataforma: true, soporteVertical: true, cierraHabitacion: true, sinPintura: true,
    texto: 'Un paño de pared de piedra hilada, de tres metros, con coronación de madera. Se alinea con el piso modular y con las otras paredes igual que la de tablas, pero aguanta más y no se pinta. Pide mucha piedra: es para el pico.',
    pide: { piedra: 16, tronco: 1 }, pesos: 2200,
    snap: { tipo: 'muro', familia: 'modular-muro', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.08 },
    fisica(h) { h.segmento(-1.5, 0, 1.5, 0, 0.16, -0.02, 2.30); },
    arma(c) {
      for (let f = 0; f < 5; f++) hilada(c, f * 0.44, 0.44, f % 2 ? [0.5, 1.0, 1.0, 0.5] : [1.0, 1.0, 1.0], 0, 0.28, f * 11 + 3);
      caja(c, 3.0, 0.08, 0.38, [0, 2.24, 0], MADERA_OSCURA, { tipo: 0, variar: 0.06 });
    },
  },
  {
    ...base, id: 'techo-teja', nombre: 'Techo de teja 3×3', categoria: 'refugios', radio: 2.30, ancho: 3.45, fondo: 3.45, alto: 1.06, separacion: 0.12,
    apoyaEnPlataforma: true, requierePlataforma: true, elevacion: 2.26, sinPintura: true,
    texto: 'Techo de dos aguas de teja de barro cocido, hileras que se montan una sobre otra y una cumbrera cubierta. Se centra y orienta con la base igual que el de tablas: pesa más, dura más y queda lindo. Lleva barro cocido, o sea piedra y fuego.',
    pide: { tabla: 8, tronco: 2, piedra: 12 }, pesos: 2800,
    snap: { tipo: 'techo', familia: 'modular-techo', pisoFamilia: 'modular-piso', umbral: 1.35 },
    permiteSolapeCon: ['modular-muro'],
    arma(c) {
      const W = 3.35, D = 3.38, subida = 0.94, medio = W / 2, largo = Math.hypot(medio, subida) + 0.16, incl = Math.atan2(subida, medio);
      const n = 8, paso = largo / n;
      for (const lado of [-1, 1]) {
        // la cara de abajo (tablas) y las hileras de teja que se montan
        c.agregar(new THREE.BoxGeometry(largo, 0.06, D), { color: TECHO_2, tipo: 4, variar: 0.08, matriz: matriz([lado * 0.79, 0.45, 0], [0, 0, -lado * incl]) });
        for (let j = 0; j < n; j++) {
          const s = -largo / 2 + paso * (j + 0.5);                               // a lo largo de la pendiente (del alero hacia la cumbrera)
          const ux = -lado * Math.cos(incl), uy = Math.sin(incl), nx = lado * Math.sin(incl), ny = Math.cos(incl);
          c.agregar(new THREE.BoxGeometry(paso + 0.05, 0.05 + (j % 2) * 0.012, D - 0.04 - (j % 3) * 0.01), { color: ['#a0553a', '#8f4a33', '#b0613f'][j % 3], tipo: 4, variar: 0.1, matriz: matriz([lado * 0.79 + ux * s + nx * 0.04, 0.45 + uy * s + ny * 0.04, 0], [0, 0, -lado * incl]) });
        }
      }
      c.agregar(new THREE.BoxGeometry(0.18, 0.12, D + 0.1), { color: '#7d3f2b', tipo: 4, variar: 0.08, matriz: matriz([0, 0.99, 0]) });
      for (const z of [-1.48, 0, 1.48]) for (const lado of [-1, 1]) c.agregar(new THREE.BoxGeometry(largo - 0.08, 0.10, 0.10), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([lado * 0.73, 0.38, z], [0, 0, -lado * incl]) });
    },
  },
];
