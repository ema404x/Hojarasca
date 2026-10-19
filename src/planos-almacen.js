// 4.2: el almacenaje con tope (O → Trabajo, sólo en el Relax): pila de piedra, depósito de piedra techado, barraca de materiales,
// herramientero y silo. Cada uno guarda hasta un tope según su tamaño (almacen.js) y se amplía pagando pesos y materiales
// (Mayús + E); las pilas crecen a la vista a medida que se llenan y la barraca, el depósito, el silo y el herramientero cambian
// con cada ampliación. Lo que se guarda vive en `datos.almacen` de la obra y se dibuja desde ahí (sin luces ni nada por cuadro: la malla
// se rehace sólo cuando cambia el paso de llenado o el nivel). Mismas reglas que planos-lujo.js: frente a -z, origen en el centro sobre el
// piso, sólo tipo 0 y 4, menos de ~1.000 triángulos con el depósito al máximo y lleno.
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { calce } from './calces.js';
import { AYUDAS_MUEBLES } from './planos-muebles.js';
import { ALMACENES, sanearAlmacen, textoCapacidad, pasoDe, pasoDeLlenura, guardadoDe, llenura } from './almacen.js';

const { caja, cil, hs, MADERA, MADERA_OSCURA, TABLA, TABLA_CLARA, PIEDRA, HIERRO, BRONCE, VIDRIO } = AYUDAS_MUEBLES;
const TECHO = '#4e4038';
const PAJA = '#b59a5c';
const LANA = '#d9d2bd';
const base = { soloRelax: true, apoyaEnPlataforma: true, pieza: true, categoria: 'trabajo' };

// El estado del almacén de una obra para dibujar (los datos pueden venir null: el fantasma del plano)
const estadoDe = (id, datos) => sanearAlmacen(datos?.almacen, id);

// Un montón de piedras (icosaedros chatos), de a `cantidad`, en tres capas
const PIEDRAS = [PIEDRA, '#6c665d', '#8a857b', '#756f66'];
function monton(c, cx, cz, radio, cantidad, semilla = 1, y0 = 0) {
  const capas = cantidad <= 3 ? [cantidad] : cantidad <= 5 ? [3, cantidad - 3] : cantidad <= 8 ? [4, cantidad - 4 - 1, 1] : [6, 4, cantidad - 10];
  let k = 0;
  capas.forEach((n, capa) => {
    for (let i = 0; i < n; i++, k++) {
      const a = (i / Math.max(1, n)) * Math.PI * 2 + capa * 0.9 + hs(k + semilla) * 0.5, r = capa === 0 ? radio * 0.62 : capa === 1 ? radio * 0.32 : 0;
      const t = radio * (0.4 - capa * 0.06) * (0.9 + hs(k * 3 + semilla) * 0.25);
      c.agregar(new THREE.IcosahedronGeometry(t, 0), { color: PIEDRAS[k % PIEDRAS.length], tipo: 4, variar: 0.14,
        matriz: matriz([cx + Math.cos(a) * r * (n === 1 ? 0 : 1), y0 + t * 0.55 + capa * radio * 0.34, cz + Math.sin(a) * r * (n === 1 ? 0 : 1)], [k * 0.7, k * 1.3, 0.2], [1.15, 0.78, 1.05]) });
    }
  });
}
// un tronco echado a lo largo de z (cinco lados: liviano)
const tronco = (c, x, y, z, largo, r, color) => c.agregar(new THREE.CylinderGeometry(r * 0.92, r, largo, 5), { color, tipo: 0, variar: 0.14, matriz: matriz([x, y, z], [Math.PI / 2, 0, 0]) });

// ---------------------------------------------------------------- la pila de piedra
const PILA = {
  ...base, id: 'pila-piedra', nombre: 'Pila de piedra', radio: 1.1, ancho: 1.8, fondo: 2.0, alto: 1.2, separacion: 1.4,
  texto: `Un montón de piedras arrimado a un tablón y dos estacas, a la intemperie. Lo que picás con el pico se deja acá (E) y, mientras estés cerca, lo que levantes se paga solo de la pila. ${textoCapacidad('pila-piedra')} Crece a la vista a medida que se llena.`,
  pide: { piedra: 6, tronco: 1 },
  fisica(h) { h.segmento(-0.3, 0, 0.3, 0, 0.55, -0.05, 0.8); },
  arma(c, P, datos, suelo) {
    const a = estadoDe('pila-piedra', datos), p = pasoDeLlenura('pila-piedra', a);
    // el tablón de atrás y las dos estacas del costado
    caja(c, 1.6, 0.5, 0.06, [0, 0.27, 0.62], TABLA, { variar: 0.12 });
    for (const sx of [-1, 1]) { caja(c, 0.09, 0.62, 0.09, [sx * 0.8, 0.27, 0.62], MADERA_OSCURA, { tipo: 0 }); calce(c, suelo, sx * 0.8, 0.62, -0.04, 0.06, MADERA_OSCURA, 0); }
    caja(c, 0.06, 0.34, 0.9, [-0.8, 0.2, 0.2], TABLA, { variar: 0.12 });
    // el montón: de unas pocas sueltas a la pila llena
    monton(c, 0, 0.05, 1.0, [3, 8, 13, 17][p], 3);
    for (const [x, z, r] of [[0.95, -0.55, 0.15], [-0.85, -0.6, 0.12]]) c.agregar(new THREE.IcosahedronGeometry(r, 0), { color: PIEDRA, tipo: 4, variar: 0.12, matriz: matriz([x, r * 0.7, z], [x, z, 0.1], [1.1, 0.75, 1]) });
  },
};

// ---------------------------------------------------------------- el depósito de piedra techado
const DEP = { ancho: 3.4, fondo: 2.4, alto: 2.3 };
const BAHIAS = [-1.05, 0, 1.05];
const DEPOSITO = {
  ...base, id: 'deposito-piedra', nombre: 'Depósito de piedra techado', radio: 2.0, ancho: DEP.ancho, fondo: DEP.fondo, alto: DEP.alto, separacion: 2.0, radioE: 2.9,
  texto: `Un cobertizo de tablas con el techo caído para atrás y cajones de tablas para la piedra. Lo que picás se deja acá (E) y se paga solo de ahí cuando construís cerca. ${textoCapacidad('deposito-piedra')} Cada ampliación arma un cajón más.`,
  pide: { tabla: 8, tronco: 4, piedra: 10 }, pesos: 3000,
  fisica(h) {
    h.segmento(-1.65, 1.15, 1.65, 1.15, 0.07, 0, 2.2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) h.circulo(sx * 1.6, sz * 1.1, 0.1, -0.05, 2.3);
  },
  arma(c, P, datos, suelo) {
    const a = estadoDe('deposito-piedra', datos), p = pasoDeLlenura('deposito-piedra', a);
    caja(c, DEP.ancho, 0.08, DEP.fondo, [0, 0.04, 0], MADERA_OSCURA, { tipo: 0 });
    for (const sx of [-1, 1]) for (const [sz, h] of [[-1, 2.0], [1, 2.3]]) {
      caja(c, 0.13, h, 0.13, [sx * 1.6, h / 2, sz * 1.1], MADERA_OSCURA, { tipo: 0 });
      calce(c, suelo, sx * 1.6, sz * 1.1, 0.0, 0.08, MADERA_OSCURA, 0);
    }
    // la pared del fondo, las vigas y el techo a una agua (cae hacia atrás)
    caja(c, 3.3, 1.6, 0.05, [0, 0.9, 1.14], TABLA, { variar: 0.12 });
    caja(c, 3.5, 0.13, 0.13, [0, 2.05, -1.1], MADERA, { tipo: 0 });
    caja(c, 3.5, 0.13, 0.13, [0, 2.3, 1.1], MADERA, { tipo: 0 });
    const incl = Math.atan2(0.3, 2.2);
    for (let i = 0; i < 5; i++) caja(c, 0.69, 0.05, 2.65, [-1.38 + i * 0.69, 2.2, 0], i % 2 ? TECHO : '#453a31', { variar: 0.1, rot: [incl, 0, 0] });
    // los cajones: el primero es el de siempre; cada ampliación arma uno más (dos tabiques de por medio)
    BAHIAS.forEach((bx, i) => {
      const hecho = i <= a.n;
      if (hecho) {
        caja(c, 0.94, 0.5, 0.05, [bx, 0.3, -0.98], TABLA, { variar: 0.12 });
        caja(c, 0.94, 0.14, 0.05, [bx, 0.62, -0.98], TABLA_CLARA, { variar: 0.1 });
        monton(c, bx, 0.15, 0.62, [0, 3, 5, 7][p], 5 + i, 0.08);
      } else {
        // la marca de un cajón por armar: dos estacas
        for (const sx of [-1, 1]) caja(c, 0.05, 0.28, 0.05, [bx + sx * 0.4, 0.14, -0.9], MADERA, { tipo: 0 });
      }
    });
    for (const [i, tx] of [-0.525, 0.525].entries()) if (i + 1 <= a.n) caja(c, 0.05, 0.85, 2.0, [tx, 0.5, 0.1], TABLA, { variar: 0.12 });
  },
};

// ---------------------------------------------------------------- la barraca de materiales
const BAR = { ancho: 5.2, fondo: 3.4, alto: 3.2 };
const BARRACA = {
  ...base, id: 'barraca', nombre: 'Barraca de materiales', radio: 2.9, ancho: BAR.ancho, fondo: BAR.fondo, alto: BAR.alto, separacion: 3.2, radioE: 3.4,
  texto: `Un galpón grande de tablas, abierto al frente, con un lugar para los troncos, otro para las tablas, otro para la piedra y otro para la lana. Todo lo que juntás se deja acá (E) y se paga solo de ahí cuando construís cerca. ${textoCapacidad('barraca')} Cada ampliación suma estantes y un altillo.`,
  pide: { tabla: 28, tronco: 12, piedra: 12 }, pesos: 12000,
  fisica(h) {
    h.segmento(-2.3, 1.6, 2.3, 1.6, 0.07, 0, 2.3);
    for (const sx of [-1, 1]) h.segmento(sx * 2.3, -1.55, sx * 2.3, 1.6, 0.07, 0, 2.2);
    for (const sx of [-1, 1]) h.circulo(sx * 2.3, -1.65, 0.11, -0.05, 2.6);
  },
  arma(c, P, datos, suelo) {
    const a = estadoDe('barraca', datos), N = a.n;
    const paso = (k) => pasoDe('barraca', a, k);
    caja(c, 4.8, 0.1, BAR.fondo, [0, 0.05, 0], MADERA_OSCURA, { tipo: 0 });
    // paredes: fondo y costados; el frente abierto, con dos postes y un dintel
    caja(c, 4.6, 2.3, 0.08, [0, 1.25, 1.65], TABLA, { variar: 0.12 });
    for (const sx of [-1, 1]) caja(c, 0.08, 2.1, 3.3, [sx * 2.3, 1.15, 0], TABLA, { variar: 0.12 });
    for (const sx of [-1, 1]) { caja(c, 0.16, 2.6, 0.16, [sx * 2.3, 1.3, -1.65], MADERA_OSCURA, { tipo: 0 }); calce(c, suelo, sx * 2.3, -1.65, 0, 0.1, MADERA_OSCURA, 0); }
    caja(c, 4.7, 0.2, 0.15, [0, 2.5, -1.65], MADERA, { tipo: 0 });
    // el techo a dos aguas y su cumbrera
    for (const s of [-1, 1]) caja(c, 5.3, 0.08, 2.1, [0, 2.7, s * 0.88], s < 0 ? TECHO : '#453a31', { variar: 0.1, rot: [s * 0.4, 0, 0] });
    cil(c, 0.07, 0.07, 5.3, [0, 3.0, 0], MADERA_OSCURA, { tipo: 0, lados: 5, rot: [0, 0, Math.PI / 2] });
    // los cuatro lugares, de izquierda a derecha, y los tabiques de tablas de por medio
    for (const tx of [-1.17, 0, 1.17]) caja(c, 0.05, 0.7, 1.4, [tx, 0.45, 0.9], TABLA_CLARA, { variar: 0.1 });
    // troncos (a lo largo), tablas apiladas, piedras y vellones, según cuánto hay de cada uno
    const pt = paso('tronco');
    [[3, 0], [3, 1], [2, 2]].slice(0, pt).forEach(([n, f]) => { for (let i = 0; i < n; i++) tronco(c, -1.75 + (i - (n - 1) / 2) * 0.27, 0.2 + f * 0.24, 0.9, 1.2, 0.12, (i + f) % 2 ? MADERA : '#5b4a36'); });
    const pb = paso('tabla');
    for (let i = 0; i < [0, 2, 4, 6][pb]; i++) caja(c, 0.85, 0.11, 1.1, [-0.58, 0.16 + i * 0.12, 0.9], i % 2 ? TABLA : TABLA_CLARA, { variar: 0.12, rot: [0, (i % 3 - 1) * 0.03, 0] });
    monton(c, 0.58, 0.9, 0.95, [0, 3, 5, 8][paso('piedra')], 9, 0.1);
    const pl = paso('lana');
    for (let i = 0; i < [0, 2, 4, 6][pl]; i++) c.agregar(new THREE.IcosahedronGeometry(0.28, 0), { color: LANA, tipo: 4, variar: 0.08,
      matriz: matriz([1.75 + (i % 2 ? 0.22 : -0.22), 0.26 + Math.floor(i / 2) * 0.3, 0.9 + (i % 2) * 0.05], [i, i * 1.1, 0], [1.1, 0.8, 1.3]) });
    // las ampliaciones: un estante, otro más arriba y un altillo con su escala
    if (N >= 1) { caja(c, 4.4, 0.07, 0.5, [0, 1.35, 1.35], TABLA_CLARA); for (const sx of [-1.5, 0, 1.5]) caja(c, 0.07, 0.34, 0.07, [sx, 1.14, 1.5], MADERA_OSCURA, { tipo: 0 }); }
    if (N >= 2) { caja(c, 4.4, 0.07, 0.5, [0, 1.9, 1.35], TABLA_CLARA); for (const sx of [-1.5, 0, 1.5]) caja(c, 0.07, 0.4, 0.07, [sx, 1.68, 1.5], MADERA_OSCURA, { tipo: 0 }); }
    if (N >= 3) {
      caja(c, 4.5, 0.09, 1.3, [0, 2.12, -0.75], TABLA, { variar: 0.1 });
      for (const sx of [-1, 1]) caja(c, 0.1, 2.1, 0.1, [sx * 2.1, 1.05, -1.35], MADERA_OSCURA, { tipo: 0 });
      for (const sx of [-0.2, 0.2]) caja(c, 0.05, 2.1, 0.05, [sx + 1.4, 1.0, -1.45], MADERA, { tipo: 0, rot: [0.18, 0, 0] });
      for (let i = 0; i < 5; i++) caja(c, 0.4, 0.04, 0.05, [1.4, 0.3 + i * 0.4, -1.5 + i * 0.07], MADERA, { tipo: 0 });
    }
  },
};

// ---------------------------------------------------------------- el silo
const SILO = {
  ...base, id: 'silo', nombre: 'Silo y granero', radio: 1.5, ancho: 2.6, fondo: 3.0, alto: 4.2, separacion: 1.6, radioE: 2.8, categoria: 'trabajo',
  texto: `Un silo de tablas paradas con zunchos de hierro, techo cónico, escalera y una ventanita que muestra cuánto grano tiene. Se guardan acá (E) las habas, las papas, las frutillas y los calafates que cosechás. ${textoCapacidad('silo')} Cada ampliación le suma un tramo de altura.`,
  pide: { tabla: 24, tronco: 10, piedra: 14 }, pesos: 9000,
  fisica(h) { h.circulo(0, 0, 1.08, -0.05, 4.1); },
  arma(c, P, datos, suelo) {
    const a = estadoDe('silo', datos), N = a.n, x = llenura('silo', a);
    const alto = 1.9 + N * 0.5;
    // la base de piedra, el cuerpo de tablas y los zunchos
    c.agregar(new THREE.CylinderGeometry(1.12, 1.18, 0.34, 12), { color: PIEDRA, tipo: 4, variar: 0.12, matriz: matriz([0, 0.14, 0]) });
    calce(c, suelo, 0, 0, 0.0, 1.15, PIEDRA, 4);
    c.agregar(new THREE.CylinderGeometry(0.98, 1.02, alto, 12), { color: TABLA, tipo: 4, variar: 0.12, matriz: matriz([0, 0.3 + alto / 2, 0]) });
    for (let i = 0; i <= 2 + N; i++) {
      const y = 0.55 + (alto - 0.5) * (i / (2 + N));
      c.agregar(new THREE.CylinderGeometry(1.02, 1.03, 0.06, 12, 1, true), { color: HIERRO, tipo: 0, variar: 0.05, matriz: matriz([0, y, 0]) });
    }
    // el techo cónico con su remate
    c.agregar(new THREE.ConeGeometry(1.25, 0.8, 12), { color: TECHO, tipo: 4, variar: 0.1, matriz: matriz([0, 0.3 + alto + 0.4, 0]) });
    c.agregar(new THREE.IcosahedronGeometry(0.08, 0), { color: BRONCE, tipo: 0, variar: 0.05, matriz: matriz([0, 0.3 + alto + 0.82, 0]) });
    // la puerta (de tablas, con travesaño) al frente, de cara a -z
    caja(c, 0.62, 1.15, 0.07, [0, 0.95, -1.0], MADERA, { variar: 0.1 });
    caja(c, 0.7, 0.07, 0.09, [0, 0.85, -1.02], MADERA_OSCURA, { tipo: 0 });
    // el medidor: un marco con un vidrio y, adentro, el grano a la altura de lo que hay
    caja(c, 0.2, 1.3, 0.05, [0.62, 1.7, -0.78], MADERA_OSCURA, { tipo: 0, rot: [0, -0.62, 0] });
    caja(c, 0.12, 1.2, 0.03, [0.62, 1.7, -0.8], VIDRIO, { variar: 0.03, rot: [0, -0.62, 0] });
    if (x > 0) caja(c, 0.11, 1.15 * x, 0.025, [0.625 - 0.01, 1.12 + (1.15 * x) / 2, -0.805], '#c7a24a', { variar: 0.06, rot: [0, -0.62, 0] });
    // la escalera arrimada a un costado
    for (const sz of [-1, 1]) caja(c, 0.06, 0.3 + alto, 0.06, [-1.05, (0.3 + alto) / 2, sz * 0.2 + 0.2], MADERA_OSCURA, { tipo: 0, rot: [0, 0, 0.0] });
    for (let i = 0; i < 4 + N; i++) caja(c, 0.06, 0.05, 0.46, [-1.05, 0.5 + i * 0.5, 0.2], MADERA, { tipo: 0 });
    // costales de grano al pie, a medida que se llena
    for (let i = 0; i < [0, 0, 2, 3][x <= 0 ? 0 : x >= 0.999 ? 3 : x > 0.5 ? 2 : 1]; i++) c.agregar(new THREE.IcosahedronGeometry(0.22, 0), { color: i % 2 ? '#bda46a' : PAJA, tipo: 4, variar: 0.1,
      matriz: matriz([-0.5 + i * 0.5, 0.2, -1.2], [i, i * 1.4, 0], [1.1, 0.85, 1.4]) });
  },
};

// ---------------------------------------------------------------- el herramientero
const GANCHOS = [[-0.6, 1.55], [-0.2, 1.55], [0.2, 1.55], [0.6, 1.55], [-0.38, 0.95], [0.38, 0.95]];
// una herramienta colgada de su gancho (x, y del gancho)
function colgada(c, k, x, y) {
  const z = -0.2;
  switch (k) {
    case 'hacha':
      caja(c, 0.05, 0.62, 0.05, [x, y - 0.33, z], '#7a5a38', { tipo: 0 });
      caja(c, 0.2, 0.14, 0.06, [x, y - 0.1, z], HIERRO, { tipo: 0 });
      caja(c, 0.05, 0.18, 0.05, [x - 0.1, y - 0.12, z], '#8f8b86', { tipo: 0 });
      break;
    case 'pico':
      caja(c, 0.05, 0.66, 0.05, [x, y - 0.35, z], '#7a5a38', { tipo: 0 });
      caja(c, 0.5, 0.06, 0.06, [x, y - 0.06, z], HIERRO, { tipo: 0 });
      for (const s of [-1, 1]) caja(c, 0.14, 0.05, 0.05, [x + s * 0.27, y - 0.1, z], '#8f8b86', { tipo: 0, rot: [0, 0, -s * 0.5] });
      break;
    case 'tijera':
      for (const s of [-1, 1]) caja(c, 0.035, 0.42, 0.03, [x + s * 0.03, y - 0.28, z], '#8f8b86', { tipo: 0, rot: [0, 0, s * 0.1] });
      cil(c, 0.07, 0.07, 0.03, [x, y - 0.06, z], HIERRO, { tipo: 0, lados: 8, rot: [Math.PI / 2, 0, 0] });
      break;
    case 'mosca':
      caja(c, 0.015, 0.4, 0.015, [x, y - 0.22, z], '#cfc8b4', { tipo: 0 });
      c.agregar(new THREE.IcosahedronGeometry(0.045, 0), { color: '#a8573a', tipo: 4, variar: 0.06, matriz: matriz([x, y - 0.45, z]) });
      c.agregar(new THREE.IcosahedronGeometry(0.03, 0), { color: '#d6b25a', tipo: 4, variar: 0.06, matriz: matriz([x + 0.04, y - 0.5, z]) });
      break;
    case 'farol':
      caja(c, 0.16, 0.05, 0.16, [x, y - 0.26, z], BRONCE, { tipo: 0 });
      caja(c, 0.12, 0.2, 0.12, [x, y - 0.14, z], VIDRIO, { variar: 0.03 });
      caja(c, 0.16, 0.04, 0.16, [x, y - 0.03, z], BRONCE, { tipo: 0 });
      break;
    case 'botas':
      for (const s of [-1, 1]) { caja(c, 0.1, 0.32, 0.12, [x + s * 0.07, y - 0.22, z], '#2a2723', { variar: 0.05 }); caja(c, 0.1, 0.07, 0.2, [x + s * 0.07, y - 0.4, z - 0.04], '#2a2723', { variar: 0.05 }); }
      break;
    default: break;
  }
}
const HERRAMIENTERO = {
  ...base, id: 'herramientero', nombre: 'Herramientero', radio: 1.0, ancho: 1.9, fondo: 0.5, alto: 2.2, separacion: 1.0, confort: 1, radioE: 2.6,
  texto: `Un tablero de pared con ganchos y un techito, para colgar el hacha, el pico, la tijera y lo demás. Con E colgás lo que tengas (siguen a mano: es para tenerlas ordenadas y a la vista). ${textoCapacidad('herramientero')} La ampliación suma un tablero de abajo con dos ganchos.`,
  pide: { tabla: 6, tronco: 2, piedra: 1 }, pesos: 1200,
  fisica(h) { h.segmento(-0.85, 0, 0.85, 0, 0.2, 0, 2.1); },
  arma(c, P, datos, suelo) {
    const a = estadoDe('herramientero', datos), N = a.n;
    for (const sx of [-1, 1]) { caja(c, 0.1, 2.1, 0.1, [sx * 0.9, 1.05, 0.12], MADERA_OSCURA, { tipo: 0 }); calce(c, suelo, sx * 0.9, 0.12, 0.0, 0.07, MADERA_OSCURA, 0); }
    caja(c, 1.8, 1.0, 0.05, [0, 1.45, 0.14], TABLA, { variar: 0.12 });
    caja(c, 1.9, 0.07, 0.07, [0, 1.98, 0.1], MADERA, { tipo: 0 });
    caja(c, 2.05, 0.05, 0.62, [0, 2.1, -0.05], TECHO, { variar: 0.1, rot: [0.16, 0, 0] });
    // los ganchos (cuatro; con la ampliación, dos más en un tablero de abajo)
    const n = 4 + (N >= 1 ? 2 : 0);
    if (N >= 1) { caja(c, 1.1, 0.7, 0.05, [0, 0.78, 0.14], TABLA, { variar: 0.12 }); for (const sx of [-1, 1]) caja(c, 0.06, 0.3, 0.05, [sx * 0.55, 0.45, 0.14], MADERA_OSCURA, { tipo: 0 }); }
    for (let i = 0; i < n; i++) cil(c, 0.02, 0.02, 0.1, [GANCHOS[i][0], GANCHOS[i][1], 0.07], HIERRO, { tipo: 0, lados: 5, rot: [Math.PI / 2, 0, 0] });
    // lo colgado, en el orden de la lista, en los primeros ganchos
    let i = 0;
    for (const k of ALMACENES.herramientero.guarda) if (guardadoDe(a, k) && i < n) { colgada(c, k, GANCHOS[i][0], GANCHOS[i][1] - 0.02); i++; }
  },
};

export const PIEZAS_ALMACEN = [PILA, DEPOSITO, BARRACA, HERRAMIENTERO, SILO];
