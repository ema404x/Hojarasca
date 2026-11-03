// 4.22.0 · EDIFICIOS Y MATERIALES: el detalle de las obras del jugador, en la misma geometría fusionada de siempre.
//
// La auditoría de la 4.20.0 (parte C) midió que la geometría es casi gratis en la placa (100 mil triángulos ≈ 0,05 ms) y que lo caro son las llamadas de
// dibujo, las capas de pantalla completa y los shaders. Por eso el salto de las obras del jugador (la casilla con la pared de un solo panel marrón, el zócalo de la
// cabaña de un solo bloque gris, las patas de piedra de siete lados, los troncos del puesto de cuatro lados) va por acá: más piezas CHICAS dentro de la
// MISMA malla de cada obra (el Constructor de geometria.js las junta todas), con el color de cada vértice. Ni un dibujo más, ni un shader, ni una textura.
//
//   · `tablasDeCara` / `paredDeTablas`: tablas verticales con relieve de 1 a 2 cm, juntas oscuras entre una y otra, cada tabla con su tono y su degradado, y
//     algún nudo. Los colores se pasan SIEMPRE como texto `#rrggbb`: así el panel «Personalizar» (estilo-casa.js) sigue sabiendo qué es pared y la repinta
//     conservando la veta (se mide el brillo de cada vértice contra el medio de la pieza).
//   · `bloquesDeCara` / `muroDePiedra` / `pilarDePiedra`: piedra en bloques de tamaños distintos, a trabazón, con juntas hundidas y cada bloque un poco
//     afuera o adentro del plano, como una pirca de verdad.
//   · `troncoRedondo`: tronco de ocho lados con normales suaves y tapas de madera cortada (el puesto ya no es una pila de listones).
//   · `basaDePiedra`: la pata de piedra de las obras, dos cantos rodados apilados en vez de un cilindro de siete lados.
//
// Todo es determinista: sale de la semilla de la obra (posición e id), nunca del azar del juego. Se prende junto con el asentado (Media y Alta,
// `asentadoActivo().detalle`); en Baja y Mínima las obras son EXACTAMENTE las de la 4.21.0.
import * as THREE from 'three';
import { matriz, abollar } from './geometria.js';
import { asentadoActivo, azarDe, semillaDe } from './asentado.js';

export const detalleObras = () => !!asentadoActivo().detalle;

// La semilla de una obra para el detalle: la misma de `asentarObra` (posición al decímetro + id del plano). Sin posición (el fantasma) sale sólo del id.
export const semillaObra = (P, datos) => semillaDe(datos && Number.isFinite(datos.x) ? datos.x : 0, datos && Number.isFinite(datos.z) ? datos.z : 0, P && P.id ? P.id : '');

// ---------------------------------------------------------------- colores como texto
const aHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
// `#rrggbb` multiplicado por `f` (el color queda como texto: ver arriba)
export function mezclar(hex, f, g = f, b = f) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + aHex(((n >> 16) & 255) * f) + aHex(((n >> 8) & 255) * g) + aHex((n & 255) * b);
}
const HEX = /^#[0-9a-f]{6}$/i;
export const esHex = (v) => typeof v === 'string' && HEX.test(v);

// ---------------------------------------------------------------- una caja sólo con las caras que se ven
// `caras`: letras de lo que se arma (f frente +z, a atrás −z, t arriba, b abajo, d derecha +x, i izquierda −x). Cada una de las ocho esquinas tiembla hasta `jit`
// metros (la misma en todas las caras que la comparten, así la pieza no se abre) para que ningún bloque sea un ladrillo perfecto.
export function cajaCaras(w, h, d, caras = 'ftdi', jit = 0, sem = 0) {
  const x = w / 2, y = h / 2, z = d / 2;
  const esquina = (sx, sy, sz) => {
    const i = (sx > 0 ? 1 : 0) + (sy > 0 ? 2 : 0) + (sz > 0 ? 4 : 0);
    const t = (k) => (azarDe(sem | 0, i * 3 + k + 1) - 0.5) * 2 * jit;
    return [sx * x + t(0), sy * y + t(1), sz * z + t(2)];
  };
  const E = {};
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) E[`${sx}${sy}${sz}`] = esquina(sx, sy, sz);
  const P = (a, b, c) => E[`${a}${b}${c}`];
  const pos = [];
  const quad = (p0, p1, p2, p3) => pos.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3);
  if (caras.includes('f')) quad(P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1));
  if (caras.includes('a')) quad(P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1));
  if (caras.includes('t')) quad(P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), P(-1, 1, -1));
  if (caras.includes('b')) quad(P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1));
  if (caras.includes('d')) quad(P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1));
  if (caras.includes('i')) quad(P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

// ---------------------------------------------------------------- el marco de una pared
// Una pared corre a lo largo de `eje` ('x': la cara mira a ±z; 'z': mira a ±x). `u` va a lo largo de la pared, `y` hacia arriba, `fuera` (+1 o −1) es hacia
// dónde mira la cara que se arma. `cara` es la coordenada de esa cara (z si el eje es 'x'; x si es 'z'). Todo en coordenadas locales de la obra.
function marco(eje, cara, fuera) {
  const giro = eje === 'x' ? (fuera > 0 ? 0 : Math.PI) : (fuera > 0 ? Math.PI / 2 : -Math.PI / 2);
  // un punto (u, y, w) con `w` hacia afuera de la cara → coordenadas de la obra
  const aObra = (u, y, w) => (eje === 'x' ? [u, y, cara + fuera * w] : [cara + fuera * w, y, u]);
  // ¿el eje x de la pieza (ya girada) corre en el mismo sentido que `u`? (para saber cuál canto es el del principio y cuál el del final)
  const sentido = (eje === 'x') === (fuera > 0) ? 1 : -1;
  return { giro, aObra, sentido };
}

// ---------------------------------------------------------------- tablas verticales con relieve
// Una cara de tablas entre `u0` y `u1`, de `y0` a `y1`, pegada a la cara `cara` de un núcleo que ya está. Las tablas salen `relieve` metros de ella.
//   o: { eje, cara, fuera, u0, u1, y0, y1, sem, colores: ['#rrggbb', …], ancho (0,19), relieve (0,016), nudos (por metro cuadrado), tipo (0) }
export function tablasDeCara(c, o) {
  const { eje, cara, fuera, u0, u1, y0, y1, sem = 1, colores, ancho = 0.19, relieve = 0.016, nudos = 0.35, tipo = 0, junta = 0.012, sinNudos = [] } = o;
  const largo = u1 - u0, alto = y1 - y0;
  if (!(largo > 0.05) || !(alto > 0.05) || !colores || !colores.length) return 0;
  const { giro, aObra } = marco(eje, cara, fuera);
  const n = Math.max(1, Math.round(largo / ancho)), aw = largo / n;
  const prof = relieve + 0.03;
  let piezas = 0;
  for (let i = 0; i < n; i++) {
    const u = u0 + aw * (i + 0.5);
    const base = colores[Math.floor(azarDe(sem, i * 7 + 1) * colores.length) % colores.length];
    const f = 0.88 + 0.22 * azarDe(sem, i * 7 + 2);
    const color = mezclar(base, f);
    // el pie y la cabeza de cada tabla se desfasan un pelo: no es un telón recto
    const d0 = (azarDe(sem, i * 7 + 3) - 0.5) * 0.04, d1 = (azarDe(sem, i * 7 + 4) - 0.5) * 0.04;
    const a = y0 + d0, b = y1 + d1;
    const geo = cajaCaras(aw - junta, b - a, prof, 'f', 0.004, (sem ^ (i * 2654435761)) | 0);
    c.agregar(geo, {
      color, tipo, variar: 0.07, degradado: [mezclar(color, 0.84), mezclar(color, 1.07)],
      matriz: matriz(aObra(u, (a + b) / 2, relieve - prof / 2), [0, giro, 0]),
    });
    piezas++;
  }
  // los nudos: discos oscuros y chatos, pegados a las tablas
  const k = Math.round(largo * alto * nudos);
  for (let j = 0; j < k; j++) {
    const u = u0 + 0.1 + (largo - 0.2) * azarDe(sem, 500 + j * 5);
    const y = y0 + 0.2 + (alto - 0.4) * azarDe(sem, 501 + j * 5);
    const r = 0.022 + 0.026 * azarDe(sem, 502 + j * 5);
    if (sinNudos.some(([a, b, p, q]) => u > a - r && u < b + r && y > p - r && y < q + r)) continue;   // (ni sobre un vidrio ni sobre un marco)
    // (el cilindro nace parado: se acuesta para que una de sus tapas mire hacia afuera de la pared)
    c.agregar(new THREE.CylinderGeometry(r, r * 1.12, 0.008, 8), {
      color: mezclar(colores[0], 0.5), tipo, variar: 0.1,
      matriz: matriz(aObra(u, y, relieve + 0.002), eje === 'x' ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2]),
    });
    piezas++;
  }
  return piezas;
}

// Un listón (zócalo, cinta, cubrejunta) pegado a una cara: sale `sale` metros de ella. Con el color tal cual lo pidió quien llama (texto `#rrggbb`).
export function listonDeCara(c, { eje, cara, fuera, u0, u1, y0, y1, sale = 0.03, color, tipo = 0, variar = 0.06, sem = 1 }) {
  const largo = u1 - u0, alto = y1 - y0;
  if (!(largo > 0.02) || !(alto > 0.02)) return;
  const { giro, aObra } = marco(eje, cara, fuera);
  const prof = sale + 0.03;
  c.agregar(cajaCaras(largo, alto, prof, 'ftdi', 0.003, sem | 0), { color, tipo, variar, matriz: matriz(aObra((u0 + u1) / 2, (y0 + y1) / 2, sale - prof / 2), [0, giro, 0]) });
}

// El núcleo oscuro (las juntas) y las tablas de una o de las dos caras de un tramo de pared.
//   o: { eje, plano, u0, u1, y0, y1, grueso, caras: [+1, −1], sem, colores, nucleo, relieve, relieveAdentro }
export function paredDeTablas(c, o) {
  const { eje, plano, u0, u1, y0, y1, grueso, caras = [1, -1], sem = 1, colores, nucleo, tipo = 0 } = o;
  const largo = u1 - u0, alto = y1 - y0;
  if (!(largo > 0.02) || !(alto > 0.02)) return;
  const cu = (u0 + u1) / 2, cy = (y0 + y1) / 2;
  const pos = eje === 'x' ? [cu, cy, plano] : [plano, cy, cu];
  const hacerCara = (fuera) => {
    const afuera = fuera === (o.fuera ?? caras[0]);
    tablasDeCara(c, {
      eje, cara: plano + fuera * grueso / 2, fuera, u0, u1, y0, y1, sem: (sem + (fuera > 0 ? 17 : 91)) | 0, colores, tipo,
      relieve: afuera ? (o.relieve ?? 0.016) : (o.relieveAdentro ?? 0.01), nudos: afuera ? 0.35 : 0, ancho: afuera ? (o.ancho ?? 0.19) : (o.anchoAdentro ?? 0.3), sinNudos: o.sinNudos,
    });
  };
  // el orden de las piezas es el orden en que se dibujan: primero la cara de afuera (lo que está más cerca), después el núcleo y al final las demás caras. Así la placa
  // descarta por profundidad lo que queda detrás (el núcleo detrás de las tablas) en vez de pintarlo y taparlo después: menos relleno en las paredes grandes.
  const primera = o.fuera ?? caras[0];
  hacerCara(primera);
  c.agregar(eje === 'x' ? new THREE.BoxGeometry(largo, alto, grueso) : new THREE.BoxGeometry(grueso, alto, largo), {
    color: nucleo || mezclar(colores[0], 0.55), tipo: 4, variar: 0.08, matriz: matriz(pos),
  });
  for (const fuera of caras) if (fuera !== primera) hacerCara(fuera);
}

// ---------------------------------------------------------------- piedra en bloques
export const PIEDRAS = ['#7d766c', '#8a8378', '#6f695f', '#938b7e', '#77706a', '#857d70', '#6a655e'];
const MORTERO = '#4c4740';

// Bloques de piedra pegados a una cara, de `y0` a `y1`, entre `u0` y `u1` (la cara es la del núcleo: los bloques salen de ella entre 1 y 3,5 cm).
//   o: { eje, cara, fuera, u0, u1, y0, y1, sem, lados: [bool, bool] (se ven los cantos de los extremos), colores, altoFila (0,2), salida (0,035) }
export function bloquesDeCara(c, o) {
  const { eje, cara, fuera, u0, u1, y0, y1, sem = 1, colores = PIEDRAS, salida = 0.035, lados = [false, false], junta = 0.014, escala = 1 } = o;
  const altoFila = (o.altoFila ?? 0.21) * escala;
  const largo = u1 - u0, alto = y1 - y0;
  if (!(largo > 0.05) || !(alto > 0.05)) return 0;
  const { giro, aObra, sentido } = marco(eje, cara, fuera);
  const prof = 0.1;
  // los cantos de los extremos: el del principio de `u` es el izquierdo de la pieza si corre en el mismo sentido, y el derecho si no
  const cantoIni = sentido > 0 ? 'i' : 'd', cantoFin = sentido > 0 ? 'd' : 'i';
  let y = y0, fila = 0, piezas = 0;
  while (y < y1 - 0.02) {
    let h = altoFila * (0.78 + 0.5 * azarDe(sem, fila * 31 + 1));
    if (y + h > y1 - 0.06) h = y1 - y;   // la última fila cierra justo en el borde de arriba
    // cada fila arranca un poco corrida, así las juntas verticales no hacen una línea
    let u = u0 - (fila % 2 ? 0.17 : 0.03) * (0.5 + azarDe(sem, fila * 31 + 2));
    let k = 0;
    while (u < u1 - 0.01) {
      const ancho = (0.3 + 0.4 * azarDe(sem, fila * 31 + 3 + k * 4)) * escala;
      let a = Math.max(u0, u), b = Math.min(u1, u + ancho);
      if (u1 - b < 0.12) b = u1;   // sin una astilla al final de la fila
      const w = b - a;
      if (w > 0.06) {
        const sal = 0.012 + (salida - 0.012) * azarDe(sem, fila * 31 + 4 + k * 4);
        const color = mezclar(colores[Math.floor(azarDe(sem, fila * 31 + 5 + k * 4) * colores.length) % colores.length], 0.92 + 0.16 * azarDe(sem, fila * 31 + 6 + k * 4));
        const caras = 'ft' + (a <= u0 + 0.001 && lados[0] ? cantoIni : '') + (b >= u1 - 0.001 && lados[1] ? cantoFin : '');
        const geo = cajaCaras(w - junta, h - junta, prof, caras, 0.006, (sem ^ (fila * 1013 + k * 97)) | 0);
        c.agregar(geo, {
          color, tipo: 4, variar: 0.11,
          matriz: matriz(aObra((a + b) / 2, y + h / 2, sal - prof / 2), [0, giro, 0]),
        });
        piezas++;
      }
      u += ancho; k++;
    }
    y += h; fila++;
  }
  return piezas;
}

// Un muro de piedra: el núcleo de mortero (oscuro) y los bloques en las caras que se pidan.
//   o: { eje, plano, u0, u1, y0, y1, grueso, caras: [+1, −1], sem, extremos: [bool, bool] }
export function muroDePiedra(c, o) {
  const { eje, plano, u0, u1, y0, y1, grueso, caras = [1, -1], sem = 1, extremos = [true, true] } = o;
  const largo = u1 - u0, alto = y1 - y0;
  if (!(largo > 0.02) || !(alto > 0.02)) return;
  const cu = (u0 + u1) / 2, cy = (y0 + y1) / 2;
  const hacerCara = (fuera) => {
    const afuera = fuera === caras[0];
    bloquesDeCara(c, { eje, cara: plano + fuera * grueso / 2, fuera, u0, u1, y0, y1, sem: (sem + (fuera > 0 ? 5 : 71)) | 0, lados: extremos, salida: afuera ? 0.035 : 0.025, escala: afuera ? 1 : 1.7 });
  };
  // (primero lo de afuera, después el núcleo y al final lo de adentro: ver paredDeTablas)
  hacerCara(caras[0]);
  c.agregar(eje === 'x' ? new THREE.BoxGeometry(largo, alto, grueso) : new THREE.BoxGeometry(grueso, alto, largo), {
    color: MORTERO, tipo: 4, variar: 0.08, matriz: matriz(eje === 'x' ? [cu, cy, plano] : [plano, cy, cu]),
  });
  for (const fuera of caras) if (fuera !== caras[0]) hacerCara(fuera);
}

// Un pilar de piedra (la chimenea, la estufa): el núcleo y bloques en las cuatro caras. Centro (cx, cz), ancho en x `w`, fondo en z `d`.
export function pilarDePiedra(c, { cx, cz, w, d, y0, y1, sem = 1, colores = PIEDRAS, omitir = [], escala = 1.25 }) {
  const alto = y1 - y0;
  if (!(alto > 0.05)) return;
  const L = { eje: 'x', fuera: 1, y0, y1, salida: 0.03, lados: [false, false], colores, escala };
  // (`omitir`: caras que no se ven, por ejemplo la que se apoya en la pared: '+x', '-x', '+z', '-z')
  if (!omitir.includes('+z')) bloquesDeCara(c, { ...L, eje: 'x', cara: cz + d / 2 - 0.01, fuera: 1, u0: cx - w / 2, u1: cx + w / 2, sem: (sem + 3) | 0 });
  if (!omitir.includes('-z')) bloquesDeCara(c, { ...L, eje: 'x', cara: cz - d / 2 + 0.01, fuera: -1, u0: cx - w / 2, u1: cx + w / 2, sem: (sem + 4) | 0 });
  if (!omitir.includes('+x')) bloquesDeCara(c, { ...L, eje: 'z', cara: cx + w / 2 - 0.01, fuera: 1, u0: cz - d / 2, u1: cz + d / 2, sem: (sem + 5) | 0 });
  if (!omitir.includes('-x')) bloquesDeCara(c, { ...L, eje: 'z', cara: cx - w / 2 + 0.01, fuera: -1, u0: cz - d / 2, u1: cz + d / 2, sem: (sem + 6) | 0 });
  // (el núcleo va al final: lo que queda detrás de los bloques se descarta por profundidad)
  c.agregar(new THREE.BoxGeometry(w - 0.02, alto, d - 0.02), { color: MORTERO, tipo: 4, variar: 0.08, matriz: matriz([cx, (y0 + y1) / 2, cz]) });
}

// ---------------------------------------------------------------- troncos redondos
// Un tronco de ocho lados como los de `troncoCurvo` (de `y = 0` a `y = largo`, con la misma matriz que ya traía cada llamada), con sus tapas de madera cortada.
// `tapas`: [en el pie, en la punta].
function discoGeo(r, y, arriba, n = 8, r0 = 0) {
  const pos = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const p = (a, rr) => [Math.cos(a) * rr, y, Math.sin(a) * rr];
    if (r0 <= 0) {
      const A = p(a0, r), B = p(a1, r), O = [0, y, 0];
      if (arriba) pos.push(...O, ...B, ...A); else pos.push(...O, ...A, ...B);
    } else {
      const A = p(a0, r), B = p(a1, r), C = p(a0, r0), D = p(a1, r0);
      if (arriba) pos.push(...C, ...D, ...B, ...C, ...B, ...A); else pos.push(...C, ...B, ...D, ...C, ...A, ...B);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
export function troncoRedondo(c, { largo, r0, r1, m, color, variar = 0.1, tapas = [false, false], corte = '#b99d6c', anillo = '#8f7248', degradado = null }) {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  // el mismo ahusado que `troncoCurvo`, pero con ocho lados y normales suaves
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) + 0.5, r = r0 + (r1 - r0) * t;
    p.setXYZ(i, p.getX(i) * r, t * largo, p.getZ(i) * r);
  }
  geo.userData.suave = true;
  const o = { color, tipo: 0, variar, matriz: m };
  if (degradado) o.degradado = degradado;
  c.agregar(geo, o);
  if (tapas[0]) {
    c.agregar(discoGeo(r0 * 0.98, 0, false, 8, r0 * 0.6), { color: anillo, tipo: 0, variar: 0.05, matriz: m });
    c.agregar(discoGeo(r0 * 0.6, 0, false, 8), { color: corte, tipo: 0, variar: 0.05, matriz: m });
  }
  if (tapas[1]) {
    c.agregar(discoGeo(r1 * 0.98, largo, true, 8, r1 * 0.6), { color: anillo, tipo: 0, variar: 0.05, matriz: m });
    c.agregar(discoGeo(r1 * 0.6, largo, true, 8), { color: corte, tipo: 0, variar: 0.05, matriz: m });
  }
}

// ---------------------------------------------------------------- cantos rodados
// Una piedra redonda y despareja (un icosaedro abollado, con normales suaves) en una caja de radios (rx, ry, rz) centrada en (x, y, z).
export function piedraRodada(c, { x, y, z, rx, ry, rz, sem = 1, color, detalle = 0, giro = 0 }) {
  const geo = abollar(new THREE.IcosahedronGeometry(1, detalle), 0.14, 2.3);
  geo.userData.suave = true;
  const a = azarDe(sem, 1) * Math.PI * 2;
  c.agregar(geo, { color, tipo: 4, variar: 0.14, matriz: matriz([x, y, z], [azarDe(sem, 2) * 0.25, a + giro, azarDe(sem, 3) * 0.2], [rx, ry, rz]) });
}

// La pata de piedra de las obras (donde antes había un cilindro de siete lados): dos cantos apilados y uno chico al pie. Misma altura y misma huella que el
// cilindro `CylinderGeometry(rTope, rBase, alto, 7)` centrado en (x, yCentro, z): la madera que se apoya encima sigue apoyada.
export function basaDePiedra(c, { x, z, yCentro, alto, rBase, rTope, sem = 1 }) {
  const y0 = yCentro - alto / 2;
  const col = (i) => mezclar(PIEDRAS[Math.floor(azarDe(sem, 40 + i) * PIEDRAS.length) % PIEDRAS.length], 0.94 + 0.14 * azarDe(sem, 50 + i));
  piedraRodada(c, { x, y: y0 + alto * 0.31, z, rx: rBase * 0.98, ry: alto * 0.37, rz: rBase * 0.92, sem: (sem + 1) | 0, color: col(1) });
  piedraRodada(c, { x: x + (azarDe(sem, 7) - 0.5) * 0.05, y: y0 + alto * 0.76, z: z + (azarDe(sem, 8) - 0.5) * 0.05, rx: rTope * 1.0, ry: alto * 0.3, rz: rTope * 0.94, sem: (sem + 2) | 0, color: col(2), giro: 1.1, detalle: 0 });
  if (rBase < 0.3) return;
  const a = azarDe(sem, 9) * Math.PI * 2;
  piedraRodada(c, { x: x + Math.cos(a) * rBase * 0.8, y: y0 + alto * 0.1, z: z + Math.sin(a) * rBase * 0.8, rx: rBase * 0.3, ry: alto * 0.12, rz: rBase * 0.26, sem: (sem + 3) | 0, color: col(3), detalle: 0 });
}
