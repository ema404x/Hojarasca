// 3.7.2: los planos de la cocina (ver cocina-pasos.js): la parrilla con cruz (el asador criollo), su techito,
// la cocina a leña y la alacena. `construccion.js` los suma a las piezas con una línea (PIEZAS.push(...)).
// El horno de barro es el de la 2.4 (construccion.js): ahora cocina en pasos, como los otros.
// Lo que se mueve o cambia (el fuego, la carne en la cruz, los chorizos, la olla, los frascos de la alacena) no
// va en la obra: lo dibuja cocina-mundo.js, porque la obra es una sola malla quieta. Por eso acá van exportadas
// las medidas que el mundo necesita (dónde está la cruz, la plancha, los estantes).
//
// Como todas las obras, sólo tipo 0 y 4 (madera, piedra, hierro, barro).
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { calce } from './calces.js';

const MADERA = '#6b5238';
const MADERA_OSCURA = '#4a3b2c';
const TABLA = '#8a6b4a';
const PIEDRA = '#7d766c';
const HIERRO = '#34312e';
const HIERRO_VIEJO = '#4a3f36';
const CHAPA = '#7a7a76';
const CENIZA = '#3a332b';

// ---------------------------------------------------------------- medidas para el mundo
// La cruz: el pie clavado en z (local), inclinada `inclina` radianes hacia adelante (+z), de `largo` metros, con
// dos travesaños a `travesanos` metros del pie. La carne va entre los dos, mirando al fuego (+z).
// (el asador criollo: la cruz clavada atrás e inclinada hacia el fuego, que va al costado, en el suelo, no abajo de la carne)
export const CRUZ = { z: -0.8, largo: 2.05, inclina: 0.42, travesanos: [0.55, 1.47], ancho: 1.02 };
// El lecho de brasas (el fuego del asado) y la parrilla de los chorizos
export const BRASAS_PARRILLA = { x: 0, z: 0.78, r: 0.5 };
export const GRILLA = { x: 1.3, z: 0.62, y: 0.58, ancho: 0.72, fondo: 0.5 };
// Dónde está la carne (el centro) en el marco de la obra
export function centroCruz() {
  const d = (CRUZ.travesanos[0] + CRUZ.travesanos[1]) / 2;
  return { x: 0, y: d * Math.cos(CRUZ.inclina), z: CRUZ.z + d * Math.sin(CRUZ.inclina) };
}
// La cocina a leña: la plancha (arriba), las dos hornallas, la boca del fuego (adelante, a la izquierda) y el horno
export const COCINA_LENA = { plancha: 0.86, hornallas: [[-0.24, 0.02], [0.22, 0.02]], boca: { x: -0.3, y: 0.52, z: 0.31 }, caño: { x: 0.38, z: -0.18 } };
// La boca del horno de barro (el plano 'horno' de la 2.4)
export const HORNO_BOCA = { y: 0.78, z: 0.655 };
// La alacena: los estantes (alto de cada uno), lo ancho y lo hondo de adentro
export const ALACENA = { base: 0.32, estantes: [0.62, 1.06, 1.5], ancho: 1.12, fondo: 0.34 };

function caja(c, pos, tam, color, rot = [0, 0, 0], tipo = 4, variar = 0.08) { c.agregar(new THREE.BoxGeometry(...tam), { color, tipo, variar, matriz: matriz(pos, rot) }); }
function cil(c, pos, r0, r1, alto, color, rot = [0, 0, 0], tipo = 4, lados = 7, variar = 0.08) { c.agregar(new THREE.CylinderGeometry(r0, r1, alto, lados), { color, tipo, variar, matriz: matriz(pos, rot) }); }

// ---------------------------------------------------------------- la parrilla con cruz
function armarParrilla(c, P, datos, suelo) {
  // el lecho del fuego: un círculo de piedras y la ceniza
  const B = BRASAS_PARRILLA;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, x = B.x + Math.cos(a) * (B.r + 0.12), z = B.z + Math.sin(a) * (B.r + 0.12);
    c.agregar(new THREE.IcosahedronGeometry(0.17, 0), { color: PIEDRA, tipo: 4, variar: 0.2, matriz: matriz([x, 0.08, z], [i, i * 1.3, 0], [1.2, 0.7, 1]) });
    calce(c, suelo, x, z, -0.04, 0.15);
  }
  cil(c, [B.x, 0.025, B.z], B.r, B.r + 0.04, 0.05, CENIZA, [0, 0, 0], 4, 12, 0.12);
  // la cruz: el palo de hierro clavado atrás, inclinado sobre el fuego, y sus dos travesaños
  const { z, largo, inclina, travesanos, ancho } = CRUZ;
  cil(c, [0, (largo / 2) * Math.cos(inclina), z + (largo / 2) * Math.sin(inclina)], 0.028, 0.034, largo, HIERRO, [inclina, 0, 0], 4, 6, 0.04);
  for (const d of travesanos) cil(c, [0, d * Math.cos(inclina), z + d * Math.sin(inclina)], 0.022, 0.022, ancho, HIERRO, [inclina, 0, Math.PI / 2], 4, 6, 0.04);
  // la punta clavada en la tierra y una piedra que la calza
  c.agregar(new THREE.IcosahedronGeometry(0.13, 0), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([0.1, 0.06, z - 0.06], [0.4, 1, 0]) });
  calce(c, suelo, 0, z, 0.0, 0.08, HIERRO_VIEJO, 4);
  // la parrilla de los chorizos: cuatro patas, el marco y las varillas
  const G = GRILLA;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = G.x + sx * (G.ancho / 2 - 0.03), zz = G.z + sz * (G.fondo / 2 - 0.03);
    cil(c, [x, G.y / 2, zz], 0.016, 0.018, G.y, HIERRO, [0, 0, 0], 4, 5, 0.03);
    calce(c, suelo, x, zz, 0.0, 0.03, HIERRO, 4);
  }
  for (const sz of [-1, 1]) caja(c, [G.x, G.y, G.z + sz * (G.fondo / 2 - 0.02)], [G.ancho, 0.025, 0.025], HIERRO);
  for (let i = 0; i < 9; i++) caja(c, [G.x - G.ancho / 2 + 0.04 + i * ((G.ancho - 0.08) / 8), G.y + 0.012, G.z], [0.012, 0.012, G.fondo - 0.02], HIERRO_VIEJO);
  // la bandeja de las brasas, abajo
  caja(c, [G.x, 0.14, G.z], [G.ancho - 0.06, 0.04, G.fondo - 0.06], HIERRO_VIEJO);
  caja(c, [G.x, 0.165, G.z], [G.ancho - 0.12, 0.012, G.fondo - 0.12], CENIZA);
  // la tabla de cortar sobre un tronco, del otro lado, con el cuchillo
  cil(c, [-1.3, 0.27, 0.45], 0.2, 0.22, 0.54, MADERA, [0, 0.4, 0], 0, 8, 0.1);
  calce(c, suelo, -1.3, 0.45, 0.0, 0.2, MADERA_OSCURA, 0);
  caja(c, [-1.3, 0.56, 0.45], [0.5, 0.04, 0.32], TABLA, [0, 0.2, 0], 0);
  caja(c, [-1.23, 0.59, 0.42], [0.26, 0.008, 0.03], '#b8b4ac', [0, 0.9, 0], 4, 0.02);
  caja(c, [-1.35, 0.59, 0.5], [0.11, 0.018, 0.026], '#5a3a24', [0, 0.9, 0], 0, 0.02);
  // la pila de leña al costado
  for (let i = 0; i < 5; i++) cil(c, [-1.15 + (i % 3) * 0.17, 0.08 + Math.floor(i / 3) * 0.15, -0.55], 0.075, 0.08, 0.7, i % 2 ? MADERA : '#5b4a36', [Math.PI / 2, 0.15, 0], 0, 6, 0.14);
}

// ---------------------------------------------------------------- el techito de la parrilla
function armarTechito(c, P, datos, suelo) {
  const W = P.ancho, D = P.fondo;
  for (const [sx, sz, h] of [[-1, -1, 2.6], [1, -1, 2.6], [-1, 1, 2.3], [1, 1, 2.3]]) {
    const x = sx * (W / 2 - 0.1), z = sz * (D / 2 - 0.1);
    cil(c, [x, h / 2, z], 0.07, 0.085, h, MADERA, [0, 0, 0], 0, 6, 0.08);
    calce(c, suelo, x, z, 0.01, 0.09, MADERA, 0);
  }
  for (const [zz, y] of [[-(D / 2 - 0.1), 2.6], [D / 2 - 0.1, 2.3]]) caja(c, [0, y, zz], [W, 0.12, 0.12], MADERA_OSCURA, [0, 0, 0], 0);
  // la chapa acanalada: tiras de dos tonos, a una agua (más baja adelante), con un hueco en el medio para el humo
  const caida = Math.atan2(0.3, D - 0.2);
  for (let i = 0; i < 14; i++) {
    const x = -W / 2 - 0.1 + 0.08 + i * ((W + 0.2) / 14);
    if (Math.abs(x) < 0.32) continue;   // la lucarna: por acá sale el humo
    caja(c, [x, 2.5, 0], [(W + 0.2) / 14 + 0.01, 0.03, D + 0.4], i % 2 ? CHAPA : '#6a6a66', [caida, 0, 0], 4, 0.06);
  }
  // el sombrerito de la lucarna, más alto
  caja(c, [0, 2.72, -0.05], [0.8, 0.03, D * 0.6], '#6a6a66', [caida, 0, 0], 4, 0.06);
  for (const sx of [-0.36, 0.36]) caja(c, [sx, 2.62, -0.05], [0.03, 0.18, D * 0.5], MADERA_OSCURA, [caida, 0, 0], 0);
}

// ---------------------------------------------------------------- la cocina a leña
function armarCocinaLena(c) {
  const K = COCINA_LENA;
  // el cuerpo de hierro, sobre cuatro patitas
  caja(c, [0, 0.5, 0], [1.02, 0.66, 0.6], HIERRO, [0, 0, 0], 4, 0.03);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, [sx * 0.46, 0.09, sz * 0.25], [0.07, 0.18, 0.07], '#2b2927');
  // la plancha, un poco más grande, con sus dos hornallas (los aros)
  caja(c, [0, K.plancha - 0.02, -0.02], [1.1, 0.05, 0.66], '#2a2826', [0, 0, 0], 4, 0.02);
  for (const [x, z] of K.hornallas) {
    c.agregar(new THREE.TorusGeometry(0.11, 0.012, 5, 16), { color: '#4a4440', tipo: 4, variar: 0.02, matriz: matriz([x, K.plancha + 0.008, z], [Math.PI / 2, 0, 0]) });
    cil(c, [x, K.plancha + 0.004, z], 0.03, 0.03, 0.01, '#4a4440', [0, 0, 0], 4, 6, 0.02);
  }
  // la baranda de bronce adelante (para colgar el repasador) y el repasador
  caja(c, [0, 0.74, 0.34], [0.96, 0.02, 0.02], '#a8864a', [0, 0, 0], 4, 0.04);
  for (const sx of [-1, 1]) caja(c, [sx * 0.47, 0.74, 0.32], [0.02, 0.02, 0.05], '#a8864a');
  caja(c, [0.25, 0.64, 0.355], [0.2, 0.2, 0.012], '#c8b8a0', [0, 0, 0], 4, 0.06);
  // la puerta del fuego (izquierda) y la del horno (derecha), con sus manijas
  caja(c, [K.boca.x, K.boca.y, 0.305], [0.3, 0.22, 0.02], '#232120');
  caja(c, [K.boca.x, K.boca.y, 0.32], [0.08, 0.02, 0.03], '#a8864a');
  caja(c, [0.2, 0.46, 0.305], [0.44, 0.34, 0.02], '#2a2826');
  caja(c, [0.2, 0.6, 0.325], [0.2, 0.02, 0.03], '#a8864a');
  // el cenicero abajo
  caja(c, [K.boca.x, 0.25, 0.305], [0.3, 0.08, 0.02], '#1f1d1c');
  // el caño: sube derecho por atrás, con un codo y el sombrerete
  cil(c, [K.caño.x, K.plancha + 1.05, K.caño.z], 0.065, 0.07, 2.1, '#2f2d2b', [0, 0, 0], 4, 8, 0.03);
  cil(c, [K.caño.x, K.plancha + 2.15, K.caño.z], 0.1, 0.09, 0.12, '#2f2d2b', [0, 0, 0], 4, 8, 0.03);
  // la pava, siempre arrimada al fondo de la plancha (la olla la pone el mundo)
  cil(c, [-0.02, K.plancha + 0.08, -0.22], 0.08, 0.09, 0.14, '#6a6a68', [0, 0, 0], 4, 10, 0.04);
  cil(c, [-0.02, K.plancha + 0.16, -0.22], 0.03, 0.05, 0.04, '#5a5a58', [0, 0, 0], 4, 8, 0.04);
  cil(c, [0.09, K.plancha + 0.12, -0.22], 0.012, 0.018, 0.12, '#5a5a58', [0, 0, -1.0], 4, 5, 0.04);
}

// ---------------------------------------------------------------- la alacena
function armarAlacena(c) {
  const A = ALACENA, W = A.ancho + 0.08, D = A.fondo + 0.06;
  // los costados, el fondo y el copete
  for (const sx of [-1, 1]) caja(c, [sx * (W / 2 - 0.02), 0.95, 0], [0.04, 1.9, D], MADERA, [0, 0, 0], 0, 0.06);
  caja(c, [0, 0.95, -D / 2 + 0.015], [W - 0.06, 1.88, 0.02], '#7a5e42', [0, 0, 0], 4, 0.06);
  caja(c, [0, 1.92, 0.02], [W + 0.08, 0.06, D + 0.06], MADERA_OSCURA, [0, 0, 0], 0);
  caja(c, [0, 1.98, 0.0], [W - 0.1, 0.06, 0.04], MADERA_OSCURA, [0, 0, 0], 0);
  // abajo, el bajomesada cerrado con dos puertitas y sus tiradores
  caja(c, [0, 0.3, 0.0], [W - 0.06, 0.04, D - 0.02], TABLA);
  caja(c, [0, 0.03, 0.0], [W - 0.06, 0.06, D - 0.02], MADERA_OSCURA, [0, 0, 0], 0);
  for (const sx of [-1, 1]) {
    caja(c, [sx * (W / 4 - 0.01), 0.17, D / 2 - 0.01], [W / 2 - 0.06, 0.24, 0.02], '#8a6a48', [0, 0, 0], 0, 0.06);
    caja(c, [sx * 0.06, 0.17, D / 2 + 0.01], [0.02, 0.06, 0.02], '#3a2e24');
  }
  // los estantes (lo de arriba lo pone cocina-mundo.js según lo que haya)
  for (const y of A.estantes) {
    caja(c, [0, y - 0.015, 0], [W - 0.06, 0.03, D - 0.02], TABLA);
    caja(c, [0, y + 0.03, D / 2 - 0.015], [W - 0.06, 0.03, 0.012], '#a8302a', [0, 0, 0], 4, 0.05);   // la puntilla de tela roja
  }
}

export const PIEZAS_COCINA = [
  {
    id: 'parrilla', nombre: 'Parrilla con cruz', pieza: true, radio: 1.5, ancho: 3.0, fondo: 2.4, alto: 1.95, separacion: 4,
    categoria: 'exterior', soloRelax: true, funciones: ['parrilla'], pendienteMax: 0.45, desnivelMax: 0.7,
    texto: 'El asador criollo: la cruz de hierro clavada e inclinada hacia el fuego, que va al costado en su ronda de piedras, y una parrilla para los chorizos. E prende el fuego y sigue el asado paso a paso. Afuera, con lluvia, hace falta un techito encima.',
    pide: { piedra: 6, tronco: 2 },
    fisica(h) {
      h.circulo(0, CRUZ.z + 0.1, 0.07, -0.05, 1.7);
      h.segmento(GRILLA.x - GRILLA.ancho / 2, GRILLA.z, GRILLA.x + GRILLA.ancho / 2, GRILLA.z, GRILLA.fondo / 2, -0.05, GRILLA.y + 0.05);
      h.circulo(-1.3, 0.45, 0.24, -0.05, 0.6);
    },
    arma: armarParrilla,
  },
  {
    id: 'techito-parrilla', nombre: 'Techito de la parrilla', pieza: true, radio: 2.0, ancho: 3.2, fondo: 2.8, alto: 2.6, separacion: 3,
    categoria: 'exterior', soloRelax: true, cubreArea: true, cubreOtras: true, funciones: ['techito'], pendienteMax: 0.5, desnivelMax: 1.1,
    texto: 'Cuatro postes y un techo de chapa a una agua, con una lucarna en el medio para que salga el humo. Armalo encima de la parrilla: con lluvia, el asado sigue.',
    pide: { tronco: 4, tabla: 4 },
    fisica(h) { for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) h.circulo(sx * 1.5, sz * 1.3, 0.1, -0.05, 2.4); },
    arma: armarTechito,
  },
  {
    id: 'cocina-lena', nombre: 'Cocina a leña', pieza: true, radio: 0.9, ancho: 1.1, fondo: 0.7, alto: 3.1, separacion: 1.4,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, funciones: ['cocina'], permiteSolapeCon: ['modular-techo'],
    texto: 'Una cocina económica de hierro, con plancha de dos hornallas, horno y su caño. Adentro de la casa o donde la armes: E la prende con un tronco y cocina mermeladas, dulce de leche, locro, chocolate y curanto, paso a paso.',
    pide: { piedra: 6, tabla: 2 },
    fisica(h) { h.segmento(-0.52, 0, 0.52, 0, 0.32, -0.02, 0.9); h.circulo(COCINA_LENA.caño.x, COCINA_LENA.caño.z, 0.08, 0.9, 3.0); },
    arma: armarCocinaLena,
  },
  {
    id: 'alacena', nombre: 'Alacena', pieza: true, radio: 0.8, ancho: 1.2, fondo: 0.42, alto: 2.0, separacion: 1.3,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, funciones: ['alacena'],
    texto: 'Un mueble de tablas con tres estantes abiertos y un bajomesada. Lo que cocinás y lo del almacén se acomoda solo: los frascos arriba, los paquetes al medio, las fuentes y las ollas abajo. Se va llenando a la vista.',
    pide: { tabla: 6, tronco: 1 },
    fisica(h) { h.segmento(-0.6, 0, 0.6, 0, 0.21, -0.02, 2.0); },
    arma: armarAlacena,
  },
];
