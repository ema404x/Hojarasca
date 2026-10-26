// 4.2: los edificios de oficio propios (O → Trabajo, sólo en el Relax). Cada uno cuesta, además de materiales, entre $18.000 y $42.000 (la escala
// y la receta están en PRECIOS_CONSTRUCCION.md) y hace algo con E o por sí solo: lo que hacen y por qué cuestan lo que cuestan está en
// CAMBIOS_4_2_OFICIOS.md y las reglas en oficios-propios.js. `construccion.js` los suma con una línea (PIEZAS.push(...PIEZAS_OFICIOS)):
//   · herrería propia ($32.000): afilar y templar el hacha y el pico en casa;      · carpintería ($22.000): en cada obra sobra más madera;
//   · panadería de horno grande ($27.000): 8 panes por día;                        · cervecería artesanal ($42.000): barriles para la cantina;
//   · telar grande ($36.000): 2 ponchos por día;                                   · quesería ($24.000): queso de la leche de tu vaca;
//   · tienda de campo ($30.000): vende por vos;                                    · cantería ($18.000): 3 piedras por día sin gastar nada.
// Reglas de siempre: el frente (abierto) mira a -z y el fondo a +z; el origen es el centro, sobre el piso; sólo tipo 0 y 4; sin luces
// dinámicas (las brasas son sólo color); la colisión sale de `fisica(h)` (el fondo y lo grande: se entra por el frente).
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { AYUDAS_MUEBLES } from './planos-muebles.js';

const { caja, cil, hs, TABLA, TABLA_CLARA, MADERA, MADERA_OSCURA, PIEDRA, HIERRO, BRONCE, PAPEL } = AYUDAS_MUEBLES;
const PIEDRA_CLARA = '#9a9488';
const TECHO = '#4e4038';
const COBRE = '#a8643a';
const BARRO = '#a8704a';
const base = { soloRelax: true, apoyaEnPlataforma: true, pieza: true, categoria: 'trabajo', pendienteMax: 0.25 };

// Lo que usa el juego para el aviso (E) de cada uno: las obras que trabajan se registran por id (main.js)
export const OFICIOS_PROPIOS_QUE_SE_USAN = {
  'herreria-propia': 'Tu forja', carpinteria: 'Tu banco de carpintero', 'panaderia-horno': 'El horno grande', cerveceria: 'La cervecería', 'telar-grande': 'El telar grande',
  queseria: 'La quesería', 'tienda-campo': 'Tu tienda de campo', canteria: 'La cantería',
};

// ---------------------------------------------------------------- lo que tienen todos: platea, cuatro postes, vigas y techo de dos aguas
const RISE = 0.55, VUELO = 0.35;
function armazon(c, W, D, H, { platea = PIEDRA, techo = TECHO, fondoAlto = 0, fondoColor = PIEDRA, ladoDerecho = 0 } = {}) {
  caja(c, W, 0.3, D, [0, 0.03, 0], platea, { variar: 0.12 });   // (el piso queda a 0,18: la plataforma de la física limpia el pasto de adentro)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.14, H, 0.14, [sx * (W / 2 - 0.1), H / 2, sz * (D / 2 - 0.1)], MADERA_OSCURA, { tipo: 0 });
  for (const sz of [-1, 1]) caja(c, W, 0.14, 0.16, [0, H - 0.05, sz * (D / 2 - 0.1)], MADERA, { tipo: 0 });
  for (const sx of [-1, 1]) caja(c, 0.16, 0.12, D, [sx * (W / 2 - 0.1), H - 0.05, 0], MADERA, { tipo: 0 });
  if (fondoAlto > 0) caja(c, W - 0.3, fondoAlto, 0.26, [0, fondoAlto / 2, D / 2 - 0.16], fondoColor, { variar: 0.14 });
  if (ladoDerecho > 0) caja(c, 0.24, ladoDerecho, D - 0.5, [W / 2 - 0.14, ladoDerecho / 2, 0], fondoColor, { variar: 0.14 });
  const medio = D / 2 + VUELO, largo = Math.hypot(medio, RISE), ang = Math.atan2(RISE, medio);
  for (const s of [-1, 1]) caja(c, W + 0.5, 0.07, largo, [0, H + RISE / 2 + 0.04, (s * medio) / 2], techo, { rot: [s * ang, 0, 0], variar: 0.1 });
  caja(c, W + 0.52, 0.1, 0.16, [0, H + RISE + 0.08, 0], MADERA_OSCURA, { tipo: 0 });
}
const lleno = (W, D, H) => ({ ancho: W + 0.5, fondo: D + 2 * VUELO, alto: H + RISE + 0.2, radio: Math.max(W, D) / 2 + 0.2, cubreArea: true, ocupaSuelo: true });   // 4.4.2: techados: no llueve adentro

export const PIEZAS_OFICIOS = [
  // ================================================================ la herrería propia
  {
    ...base, id: 'herreria-propia', nombre: 'Herrería propia', ...lleno(3.6, 3.0, 2.4), separacion: 0.6,
    texto: 'Una fragua de piedra con campana, el yunque sobre un tocón, el fuelle y las tenazas a mano. Con E afilás el hacha y el pico cuando quieras, sin ir a la aldea; y una sola vez podés templarlos (6 piedras, 2 troncos y $2.500): con filo, dos golpes menos en vez de uno. La pared de piedra va atrás.',
    pide: { tabla: 8, tronco: 6, piedra: 30 }, pesos: 32000,
    fisica(h) { h.plataforma(0, 0, 3.6, 3, 0.18, 0.14, 0.5); h.segmento(-1.6, 1.34, 1.6, 1.34, 0.14, 0, 2.4); h.segmento(-1.55, 0.62, -0.35, 0.62, 0.3, 0, 0.9); h.circulo(0.5, -0.1, 0.34, 0, 0.7);
      // 4.11.2 (G-7): el barril de agua y la mesita de las tenazas también se chocan
      h.circulo(1.35, 0.95, 0.3, 0, 0.8); h.segmento(-0.1, 1.05, 0.8, 1.05, 0.22, 0, 0.9); },
    arma(c) {
      const W = 3.6, D = 3.0, H = 2.4;
      armazon(c, W, D, H, { fondoAlto: 2.15, ladoDerecho: 1.1 });
      // la fragua: base de piedra, plancha oscura con las brasas (sólo color), campana y chimenea que sale por el techo
      caja(c, 1.3, 0.8, 0.95, [-0.95, 0.55, 0.88], PIEDRA, { variar: 0.14 });
      caja(c, 1.1, 0.06, 0.75, [-0.95, 0.97, 0.88], '#2a2420', { tipo: 0 });
      caja(c, 0.55, 0.04, 0.35, [-0.95, 1.01, 0.8], '#d9602a', { tipo: 4, variar: 0.12 });
      caja(c, 0.3, 0.03, 0.2, [-1.0, 1.035, 0.78], '#f2a03a', { tipo: 4, variar: 0.12 });
      cil(c, 0.2, 0.75, 0.75, [-0.95, 1.48, 0.95], PIEDRA_CLARA, { lados: 4, rot: [0, Math.PI / 4, 0], variar: 0.1 });
      caja(c, 0.42, 1.25, 0.42, [-0.95, 2.35, 1.0], PIEDRA, { variar: 0.12 });
      // el fuelle al costado de la fragua: dos cuerpos de cuero con el mango
      cil(c, 0.14, 0.2, 0.55, [-1.65, 0.78, 0.4], '#6a4a32', { lados: 6, rot: [0, 0, Math.PI / 2] });
      caja(c, 0.36, 0.05, 0.05, [-1.9, 0.78, 0.4], MADERA, { tipo: 0 });
      // el yunque sobre su tocón, con la cornamusa para el lado
      cil(c, 0.28, 0.32, 0.55, [0.5, 0.45, -0.1], MADERA, { lados: 8, variar: 0.12, tipo: 0 });
      caja(c, 0.34, 0.14, 0.2, [0.5, 0.8, -0.1], HIERRO, { tipo: 0, variar: 0.05 });
      caja(c, 0.7, 0.1, 0.26, [0.5, 0.92, -0.1], HIERRO, { tipo: 0, variar: 0.05 });
      cil(c, 0.015, 0.1, 0.34, [0.99, 0.92, -0.1], HIERRO, { tipo: 0, lados: 6, rot: [0, 0, -Math.PI / 2] });
      // el barril de agua para templar y la mesita con las herramientas
      cil(c, 0.28, 0.25, 0.62, [1.35, 0.5, 0.95], MADERA_OSCURA, { lados: 8, tipo: 0 });
      cil(c, 0.24, 0.24, 0.02, [1.35, 0.8, 0.95], '#5a7480', { lados: 8, tipo: 0, variar: 0.04 });
      caja(c, 1.0, 0.06, 0.4, [0.35, 0.85, 1.05], TABLA);
      for (const sx of [-1, 1]) caja(c, 0.07, 0.6, 0.07, [0.35 + sx * 0.44, 0.58, 1.05], MADERA_OSCURA, { tipo: 0 });
      caja(c, 0.4, 0.03, 0.05, [0.15, 0.89, 1.0], HIERRO, { tipo: 0 });   // las tenazas
      caja(c, 0.03, 0.03, 0.34, [0.45, 0.89, 1.0], HIERRO, { tipo: 0, rot: [0, 0.3, 0] });
      // los martillos colgados de la pared y una pila de carbón en el piso
      for (let i = 0; i < 3; i++) {
        caja(c, 0.03, 0.4, 0.03, [0.15 + i * 0.3, 1.5, 1.2], MADERA, { tipo: 0 });
        caja(c, 0.16, 0.07, 0.07, [0.15 + i * 0.3, 1.72, 1.2], HIERRO, { tipo: 0 });
      }
      c.agregar(new THREE.IcosahedronGeometry(0.28, 0), { color: '#2a2622', tipo: 4, variar: 0.1, matriz: matriz([-1.3, 0.28, -0.35], [0, 0.4, 0], [1.2, 0.7, 1]) });
    },
  },

  // ================================================================ la carpintería
  {
    ...base, id: 'carpinteria', nombre: 'Carpintería', ...lleno(3.8, 3.0, 2.4), separacion: 0.6,
    texto: 'Un galpón abierto con el banco de carpintero y su prensa de tornillo, un caballete con el tronco a medio aserrar y los tablones secando contra la pared. Mientras la tengas en pie, al terminar cada etapa de obra sobra un 10 % más de tablas y troncos (15 % con oficio de hachero). Con E lo ves.',
    pide: { tabla: 30, tronco: 10, piedra: 6 }, pesos: 22000,
    fisica(h) { h.plataforma(0, 0, 3.8, 3, 0.18, 0.14, 0.5); h.segmento(-1.7, 1.38, 1.7, 1.38, 0.1, 0, 2.4); h.segmento(-1.45, 0.2, 0.45, 0.2, 0.4, 0, 0.95);
      // 4.11.2 (G-7): el caballete con el tronco y la pila de tablones del piso
      h.segmento(0.45, -0.4, 1.55, -0.4, 0.2, 0, 1.1); h.segmento(0.75, 1.0, 1.75, 1.0, 0.2, 0, 0.5); },
    arma(c) {
      const W = 3.8, D = 3.0, H = 2.4;
      armazon(c, W, D, H, { platea: TABLA, techo: '#5a4638' });
      caja(c, W - 0.3, H - 0.4, 0.08, [0, (H - 0.4) / 2 + 0.15, D / 2 - 0.12], TABLA, { variar: 0.14 });
      for (let i = 0; i < 5; i++) caja(c, 0.025, H - 0.4, 0.09, [-1.5 + i * 0.75, (H - 0.4) / 2 + 0.15, D / 2 - 0.17], MADERA_OSCURA, { tipo: 0 });
      // el banco de carpintero: tapa gruesa, patas, estante de abajo y la prensa de tornillo con una tabla agarrada
      caja(c, 2.0, 0.1, 0.75, [-0.5, 0.9, 0.2], TABLA_CLARA);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.12, 0.85, 0.12, [-0.5 + sx * 0.9, 0.45, 0.2 + sz * 0.3], MADERA_OSCURA, { tipo: 0 });
      caja(c, 1.75, 0.05, 0.55, [-0.5, 0.32, 0.2], TABLA);
      caja(c, 0.2, 0.2, 0.12, [-1.4, 0.88, -0.2], MADERA_OSCURA, { tipo: 0 });
      cil(c, 0.025, 0.025, 0.4, [-1.4, 0.88, -0.38], HIERRO, { tipo: 0, lados: 6, rot: [Math.PI / 2, 0, 0] });
      caja(c, 0.08, 0.5, 0.2, [-1.4, 1.1, 0.0], TABLA_CLARA);
      // sobre el banco: el serrucho, el cepillo y un par de tablas con virutas al pie
      caja(c, 0.55, 0.012, 0.1, [-0.3, 0.96, 0.1], HIERRO, { tipo: 0, rot: [0, 0.2, 0] });
      caja(c, 0.3, 0.09, 0.1, [0.1, 0.99, 0.3], MADERA, { tipo: 0 });
      caja(c, 0.6, 0.04, 0.2, [-0.7, 0.97, 0.35], TABLA_CLARA);
      for (let i = 0; i < 6; i++) caja(c, 0.14, 0.012, 0.05, [-0.1 + hs(i) * 1.2, 0.17, -0.55 + hs(i + 9) * 0.5], '#d8c08a', { variar: 0.1, rot: [0, hs(i + 3) * 3, 0] });
      // el caballete con un tronco a medio aserrar
      for (const sx of [-1, 1]) {
        caja(c, 0.08, 0.8, 0.08, [1.0 + sx * 0.55, 0.52, -0.55], MADERA_OSCURA, { tipo: 0, rot: [0.25, 0, 0] });
        caja(c, 0.08, 0.8, 0.08, [1.0 + sx * 0.55, 0.52, -0.25], MADERA_OSCURA, { tipo: 0, rot: [-0.25, 0, 0] });
      }
      cil(c, 0.16, 0.16, 1.7, [1.0, 0.95, -0.4], MADERA, { lados: 8, tipo: 0, rot: [0, 0, Math.PI / 2] });
      caja(c, 0.02, 0.2, 0.25, [0.5, 0.95, -0.4], '#d8c08a', { variar: 0.06 });
      // los tablones secando, apoyados contra el fondo de la izquierda, y una pila en el piso
      for (let i = 0; i < 6; i++) caja(c, 0.04, 1.8, 0.26, [-1.75 + i * 0.01, 1.0, 0.5 + i * 0.22], TABLA_CLARA, { variar: 0.1, rot: [0, 0, 0.1] });
      for (let i = 0; i < 3; i++) caja(c, 1.0, 0.09, 0.36, [1.25, 0.24 + i * 0.1, 1.0], i % 2 ? TABLA : TABLA_CLARA, { variar: 0.1 });
    },
  },

  // ================================================================ la panadería de horno grande
  {
    ...base, id: 'panaderia-horno', nombre: 'Panadería de horno grande', ...lleno(3.6, 3.2, 2.5), separacion: 0.6,
    texto: 'Un horno de barro grande, de cúpula, con la boca para las palas, la mesa de amasar, la leñera al lado y los cestos de pan. Con E cargás harina y leña, y el horno hace una tanda por día: 8 panes caseros (hasta tres tandas esperando). El pan se vende en la feria, en la tienda o en la estación.',
    pide: { tabla: 10, tronco: 8, piedra: 40 }, pesos: 27000,
    fisica(h) { h.plataforma(0, 0, 3.6, 3.2, 0.18, 0.14, 0.5); h.segmento(-1.6, 1.46, 1.6, 1.46, 0.14, 0, 2.5); h.circulo(-0.5, 0.75, 1.05, 0, 1.5);
      // 4.11.2 (G-7): la mesa de amasar, a la derecha del horno
      h.segmento(0.5, 0.45, 1.6, 0.45, 0.35, 0, 0.96); },
    arma(c) {
      const W = 3.6, D = 3.2, H = 2.5;
      armazon(c, W, D, H, { fondoAlto: 2.2 });
      // el horno: base de piedra, cúpula de barro (media esfera achatada), boca oscura con su arco y la chimenea
      caja(c, 1.9, 0.8, 1.6, [-0.5, 0.55, 0.75], PIEDRA, { variar: 0.14 });
      c.agregar(new THREE.SphereGeometry(0.98, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), { color: BARRO, tipo: 4, variar: 0.14, matriz: matriz([-0.5, 0.95, 0.75], [0, 0, 0], [1.05, 0.9, 0.9]) });
      caja(c, 0.5, 0.42, 0.14, [-0.5, 1.2, -0.12], '#1c1714', { tipo: 0 });
      caja(c, 0.7, 0.12, 0.2, [-0.5, 1.45, -0.12], PIEDRA_CLARA, { variar: 0.1 });
      for (const sx of [-1, 1]) caja(c, 0.1, 0.42, 0.2, [-0.5 + sx * 0.3, 1.2, -0.12], PIEDRA_CLARA, { variar: 0.1 });
      cil(c, 0.14, 0.17, 1.0, [-0.5, 2.0, 1.05], PIEDRA, { lados: 7, variar: 0.1 });
      // la pala de hornear apoyada en la pared y el rescoldo de la boca (sólo color)
      caja(c, 0.04, 1.9, 0.04, [-1.62, 1.1, 0.5], MADERA, { tipo: 0, rot: [0, 0, 0.08] });
      cil(c, 0.2, 0.2, 0.025, [-1.7, 0.18, 0.5], TABLA, { lados: 8, rot: [0, 0, 0] });
      caja(c, 0.36, 0.05, 0.05, [-0.5, 0.86, -0.1], '#d9602a', { tipo: 4, variar: 0.1 });
      // la mesa de amasar con la bolsa de harina y los panes de la tanda
      caja(c, 1.3, 0.08, 0.7, [1.05, 0.88, 0.45], TABLA_CLARA);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.08, 0.84, 0.08, [1.05 + sx * 0.58, 0.46, 0.45 + sz * 0.28], MADERA_OSCURA, { tipo: 0 });
      cil(c, 0.14, 0.17, 0.32, [1.5, 1.08, 0.4], '#e0d8c0', { lados: 7, variar: 0.06 });
      for (let i = 0; i < 4; i++) c.agregar(new THREE.IcosahedronGeometry(0.1, 0), { color: '#b8843e', tipo: 4, variar: 0.1, matriz: matriz([0.65 + i * 0.22, 0.97, 0.45 + (i % 2) * 0.12], [0, i, 0], [1.5, 0.75, 1]) });
      // los cestos de pan y la leña apilada
      for (const sx of [-1, 1]) cil(c, 0.24, 0.19, 0.22, [0.75 + sx * 0.35, 0.18 + 0.15, -0.55], '#8a6a3a', { lados: 8, variar: 0.1, tipo: 0 });
      for (let i = 0; i < 4; i++) c.agregar(new THREE.IcosahedronGeometry(0.1, 0), { color: '#b8843e', tipo: 4, variar: 0.1, matriz: matriz([0.4 + i * 0.35 - (i > 1 ? 0.7 : 0), 0.46, -0.55], [0, i, 0], [1.4, 0.8, 1]) });
      for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) cil(c, 0.09, 0.09, 0.7, [1.2 - (4 - r) * 0.1 + i * 0.2 + 0.2, 0.28 + r * 0.17, 1.2], '#7a5a3a', { lados: 5, tipo: 0, variar: 0.12, rot: [Math.PI / 2, 0, 0] });
    },
  },

  // ================================================================ la cervecería artesanal
  {
    ...base, id: 'cerveceria', nombre: 'Cervecería artesanal', ...lleno(4.0, 3.2, 2.6), separacion: 0.6,
    texto: 'Una olla de cobre sobre su fogón, un fermentador de chapa, los barriles apilados y el grano en bolsas. Con E cargás harina y leña y sale un barril por día (hasta tres esperando): Lucrecia los compra para la cantina, contado. Y mientras la tengas, la cerveza de la cantina te sale un 25 % más barata.',
    pide: { tabla: 40, tronco: 12, piedra: 16 }, pesos: 42000,
    fisica(h) { h.plataforma(0, 0, 4, 3.2, 0.18, 0.14, 0.5); h.segmento(-1.85, 1.46, 1.85, 1.46, 0.14, 0, 2.6); h.circulo(-1.1, 0.6, 0.7, 0, 1.7); h.circulo(0.35, 0.7, 0.45, 0, 1.6); h.circulo(1.45, 0.9, 0.55, 0, 1.2);
      // 4.11.2 (G-7): la mesa de degustación (adelante, a la derecha) y el barril suelto
      h.segmento(-0.05, -0.7, 0.85, -0.7, 0.25, 0, 0.9); h.circulo(1.55, 0.25, 0.3, 0, 0.75); },
    arma(c) {
      const W = 4.0, D = 3.2, H = 2.6;
      armazon(c, W, D, H, { platea: TABLA, fondoAlto: 1.3, fondoColor: TABLA });
      // la olla de cobre sobre su fogón de piedra, con la tapa en cono y el caño que sale por el techo
      caja(c, 1.3, 0.4, 1.3, [-1.1, 0.35, 0.6], PIEDRA, { variar: 0.14 });
      cil(c, 0.5, 0.55, 0.9, [-1.1, 1.0, 0.6], COBRE, { lados: 10, variar: 0.1 });
      cil(c, 0.06, 0.5, 0.28, [-1.1, 1.59, 0.6], COBRE, { lados: 10, variar: 0.1 });
      cil(c, 0.05, 0.05, 1.1, [-1.1, 2.2, 0.6], HIERRO, { tipo: 0, lados: 6 });
      cil(c, 0.04, 0.04, 1.1, [-0.55, 1.2, 0.6], HIERRO, { tipo: 0, lados: 4, rot: [0, 0, Math.PI / 2] });
      caja(c, 0.4, 0.04, 0.2, [-1.1, 0.56, -0.12], '#d9602a', { tipo: 4, variar: 0.1 });
      // el fermentador: tanque de chapa con el fondo cónico, tres patas y el grifo
      cil(c, 0.4, 0.4, 0.95, [0.35, 1.1, 0.7], '#8a8a84', { lados: 8, tipo: 0, variar: 0.06 });
      cil(c, 0.4, 0.07, 0.3, [0.35, 0.47, 0.7], '#8a8a84', { lados: 8, tipo: 0, variar: 0.06 });
      cil(c, 0.2, 0.4, 0.14, [0.35, 1.65, 0.7], '#8a8a84', { lados: 8, tipo: 0, variar: 0.06 });
      for (let k = 0; k < 3; k++) { const a = k * 2.09 + 0.5; caja(c, 0.06, 0.4, 0.06, [0.35 + Math.sin(a) * 0.3, 0.2, 0.7 + Math.cos(a) * 0.3], HIERRO, { tipo: 0 }); }
      // los barriles apilados a la derecha
      for (const bx of [1.12, 1.66]) cil(c, 0.28, 0.28, 0.72, [bx, 0.5, 1.0], MADERA, { lados: 7, tipo: 0, variar: 0.1 });
      cil(c, 0.28, 0.28, 0.72, [1.39, 1.12, 1.0], MADERA, { lados: 7, tipo: 0, variar: 0.1 });
      cil(c, 0.28, 0.28, 0.72, [1.55, 0.5, 0.25], MADERA, { lados: 7, tipo: 0, variar: 0.1 });
      for (const [bx, bz] of [[1.12, 1.0], [1.55, 0.25]]) cil(c, 0.285, 0.285, 0.04, [bx, 0.5, bz - 0.18], HIERRO, { lados: 7, tipo: 0 });
      // la mesa de degustación con tres jarras y las bolsas de grano
      caja(c, 1.0, 0.07, 0.55, [0.4, 0.82, -0.7], TABLA_CLARA);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.07, 0.78, 0.07, [0.4 + sx * 0.44, 0.42, -0.7 + sz * 0.2], MADERA_OSCURA, { tipo: 0 });
      for (let i = 0; i < 3; i++) { cil(c, 0.06, 0.055, 0.14, [0.1 + i * 0.3, 0.93, -0.7], '#d8a030', { lados: 5, variar: 0.06 }); cil(c, 0.062, 0.062, 0.03, [0.1 + i * 0.3, 1.01, -0.7], '#efe8d0', { lados: 5 }); }
      for (let i = 0; i < 3; i++) c.agregar(new THREE.IcosahedronGeometry(0.2, 0), { color: '#c9a96a', tipo: 4, variar: 0.1, matriz: matriz([-1.55 + i * 0.4, 0.31, -0.4 - (i % 2) * 0.2], [0, i, 0], [1.2, 0.8, 1]) });
      // el cartel colgado del frente
      caja(c, 1.3, 0.34, 0.05, [0, 2.2, -(D / 2 - 0.1)], '#d8a030', { tipo: 4, variar: 0.05 });
      for (let i = 0; i < 5; i++) caja(c, 0.1, 0.18, 0.02, [-0.4 + i * 0.2, 2.2, -(D / 2 - 0.14)], '#3a2c1a', { tipo: 0 });
    },
  },

  // ================================================================ el telar grande
  {
    ...base, id: 'telar-grande', nombre: 'Telar grande', ...lleno(3.6, 3.0, 2.5), separacion: 0.6,
    texto: 'Un telar de bastidor alto, con la urdimbre tendida y el peine, la rueca al lado, las madejas teñidas secándose y dos ponchos terminados. Con E cargás vellones y el telar teje solo: dos ponchos por día con cinco vellones (a mano, tres por poncho), hasta tres tandas esperando.',
    pide: { tabla: 24, tronco: 8, lana: 6 }, pesos: 36000,
    fisica(h) { h.plataforma(0, 0, 3.6, 3, 0.18, 0.14, 0.5); h.segmento(-1.65, 1.38, 1.65, 1.38, 0.1, 0, 2.5); h.segmento(-1.05, 0.55, 1.05, 0.55, 0.14, 0, 2.1);
      // 4.11.2 (G-7): el cesto de lana
      h.circulo(-1.2, -0.45, 0.3, 0, 0.55); },
    arma(c) {
      const W = 3.6, D = 3.0, H = 2.5;
      armazon(c, W, D, H, { platea: TABLA, techo: '#5a4638' });
      // el bastidor: dos parantes altos, los dos rollos y los hilos de la urdimbre
      for (const sx of [-1, 1]) caja(c, 0.14, 2.1, 0.14, [sx * 1.05, 1.05, 0.55], MADERA_OSCURA, { tipo: 0 });
      for (const y of [0.5, 1.95]) cil(c, 0.05, 0.05, 2.2, [0, y, 0.55], MADERA, { lados: 6, tipo: 0, rot: [0, 0, Math.PI / 2] });
      for (let i = 0; i < 14; i++) caja(c, 0.01, 1.4, 0.01, [-0.9 + i * 0.14, 1.22, 0.55], '#d9d0bd', { tipo: 0, variar: 0.04 });
      caja(c, 1.9, 0.17, 0.04, [0, 0.62, 0.53], '#8a3a2a', { variar: 0.08 });
      caja(c, 1.9, 0.14, 0.04, [0, 0.79, 0.53], '#d6c6a0', { variar: 0.08 });
      caja(c, 1.9, 0.17, 0.04, [0, 0.96, 0.53], '#3f5a6c', { variar: 0.08 });
      caja(c, 1.9, 0.14, 0.04, [0, 1.12, 0.53], '#b98a3e', { variar: 0.08 });
      caja(c, 2.0, 0.1, 0.08, [0, 1.3, 0.45], TABLA);
      // el banquito, la rueca y el cesto de lana
      caja(c, 0.7, 0.07, 0.3, [0, 0.45, -0.1], TABLA_CLARA);
      for (const sx of [-1, 1]) caja(c, 0.07, 0.4, 0.07, [sx * 0.3, 0.22, -0.1], MADERA_OSCURA, { tipo: 0 });
      c.agregar(new THREE.TorusGeometry(0.3, 0.025, 4, 12), { color: MADERA, tipo: 0, variar: 0.06, matriz: matriz([1.1, 0.62, -0.4], [0, Math.PI / 2, 0]) });
      caja(c, 0.5, 0.05, 0.05, [1.1, 0.34, -0.4], MADERA_OSCURA, { tipo: 0 });
      caja(c, 0.05, 0.35, 0.05, [1.1, 0.5, -0.4], MADERA_OSCURA, { tipo: 0 });
      cil(c, 0.3, 0.24, 0.34, [-1.2, 0.35, -0.45], '#8a6a3a', { lados: 8, variar: 0.1, tipo: 0 });
      for (let i = 0; i < 3; i++) c.agregar(new THREE.IcosahedronGeometry(0.17, 0), { color: '#e6dec8', tipo: 4, variar: 0.08, matriz: matriz([-1.2 + (i - 1) * 0.14, 0.58 + (i % 2) * 0.04, -0.45], [0, i, 0]) });
      // las madejas teñidas en su palo, contra el fondo
      caja(c, 0.06, 1.7, 0.06, [-1.5, 0.9, 1.15], MADERA_OSCURA, { tipo: 0 });
      caja(c, 0.06, 1.7, 0.06, [-0.4, 0.9, 1.15], MADERA_OSCURA, { tipo: 0 });
      cil(c, 0.03, 0.03, 1.2, [-0.95, 1.7, 1.15], MADERA, { lados: 5, tipo: 0, rot: [0, 0, Math.PI / 2] });
      ['#8a3a2a', '#3f5a6c', '#b98a3e', '#5a6e3c', '#7b4a6a'].forEach((col, i) => cil(c, 0.07, 0.06, 0.55, [-1.35 + i * 0.22, 1.4, 1.15], col, { lados: 6, variar: 0.06 }));
      // dos ponchos terminados, colgados a la derecha
      caja(c, 1.0, 0.04, 0.05, [1.15, 1.75, 1.2], MADERA, { tipo: 0 });
      caja(c, 0.5, 0.85, 0.03, [0.95, 1.3, 1.18], '#8a3a2a', { variar: 0.06 });
      caja(c, 0.5, 0.14, 0.035, [0.95, 1.12, 1.17], '#d6c6a0', { variar: 0.06 });
      caja(c, 0.5, 0.85, 0.03, [1.5, 1.3, 1.18], '#3f5a6c', { variar: 0.06 });
      caja(c, 0.5, 0.14, 0.035, [1.5, 1.12, 1.17], '#d6c6a0', { variar: 0.06 });
    },
  },

  // ================================================================ la quesería
  {
    ...base, id: 'queseria', nombre: 'Quesería', ...lleno(3.2, 3.0, 2.4), separacion: 0.6,
    texto: 'Una quesería de piedra con la tina de cuajar, los tarros de leche, la prensa y las repisas llenas de quesos madurando. Con E ponés la leche de tu vaca a cuajar: 8 litros son 2 quesos por día (hasta tres tandas esperando). Ercilia los compra; con una tienda de campo los vendés vos y se pagan un cuarto más.',
    pide: { tabla: 14, tronco: 4, piedra: 24 }, pesos: 24000,
    fisica(h) { h.plataforma(0, 0, 3.2, 3, 0.18, 0.14, 0.5); h.segmento(-1.45, 1.34, 1.45, 1.34, 0.14, 0, 2.4); h.circulo(-0.85, -0.1, 0.5, 0, 0.6);
      // 4.11.2 (G-7): la mesa de la prensa y los tarros de leche
      h.segmento(0.3, -0.5, 1.1, -0.5, 0.3, 0, 1.3); h.segmento(0.6, 0.5, 1.3, 0.5, 0.16, 0, 0.7); },
    arma(c) {
      const W = 3.2, D = 3.0, H = 2.4;
      armazon(c, W, D, H, { fondoAlto: 2.1, fondoColor: PIEDRA_CLARA });
      // las dos repisas del fondo con los quesos madurando
      for (const y of [1.0, 1.55]) {
        caja(c, 2.5, 0.05, 0.4, [0, y, 1.08], TABLA);
        for (const sx of [-1, 1]) caja(c, 0.05, 0.22, 0.3, [sx * 1.2, y - 0.14, 1.1], MADERA_OSCURA, { tipo: 0 });
        for (let i = 0; i < 5; i++) cil(c, 0.15, 0.15, 0.12 + (i % 2) * 0.03, [-0.9 + i * 0.45, y + 0.09, 1.08], i % 2 ? '#e0b860' : '#d8a850', { lados: 5, variar: 0.08 });
      }
      // la tina de cuajar con la leche, y un tacho al lado
      cil(c, 0.5, 0.45, 0.5, [-0.85, 0.5, -0.1], MADERA, { lados: 10, tipo: 0, variar: 0.1 });
      cil(c, 0.44, 0.44, 0.02, [-0.85, 0.74, -0.1], '#efe8d8', { lados: 10, variar: 0.03 });
      caja(c, 0.7, 0.04, 0.04, [-0.85, 0.77, -0.1], MADERA_OSCURA, { tipo: 0 });
      // los tarros de leche
      for (let i = 0; i < 3; i++) { cil(c, 0.13, 0.14, 0.5, [0.6 + i * 0.35, 0.42, 0.5], '#a8a8a0', { lados: 8, tipo: 0, variar: 0.05 }); cil(c, 0.09, 0.09, 0.05, [0.6 + i * 0.35, 0.69, 0.5], '#8a8a84', { lados: 8, tipo: 0 }); }
      // la mesa con la prensa: un molde, la tapa y la piedra encima
      caja(c, 1.0, 0.07, 0.6, [0.7, 0.8, -0.5], TABLA_CLARA);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.07, 0.76, 0.07, [0.7 + sx * 0.44, 0.4, -0.5 + sz * 0.22], MADERA_OSCURA, { tipo: 0 });
      cil(c, 0.2, 0.2, 0.2, [0.55, 0.94, -0.5], '#e0b860', { lados: 8, variar: 0.06 });
      caja(c, 0.4, 0.04, 0.4, [0.55, 1.06, -0.5], TABLA);
      caja(c, 0.26, 0.16, 0.26, [0.55, 1.16, -0.5], PIEDRA, { variar: 0.12 });
      cil(c, 0.14, 0.14, 0.1, [0.95, 0.89, -0.5], '#e0b860', { lados: 6, variar: 0.06 });
      // los paños de colar colgados de una soga y el balde
      cil(c, 0.015, 0.015, 1.6, [0.0, 1.9, -0.9], MADERA_OSCURA, { tipo: 0, lados: 4, rot: [0, 0, Math.PI / 2] });
      for (let i = 0; i < 3; i++) caja(c, 0.4, 0.5, 0.015, [-0.5 + i * 0.5, 1.6, -0.9], '#e8e0cc', { variar: 0.05 });
      cil(c, 0.17, 0.13, 0.26, [-0.2, 0.28, 0.65], '#7a5a3a', { lados: 8, variar: 0.1, tipo: 0 });
    },
  },

  // ================================================================ la tienda de campo
  {
    ...base, id: 'tienda-campo', nombre: 'Tienda de campo', ...lleno(3.6, 3.0, 2.5), separacion: 0.6,
    texto: 'Un mostrador con balanza, estantes con frascos y cajones, y un toldo a rayas al frente. Con E dejás a la venta lo tuyo (ponchos, pan, empanadas, miel, dulce, truchas ahumadas, hongos y calafate): vende hasta cuatro lotes por día con apenas un 4 % de comisión, y retirás la caja cuando pasás.',
    pide: { tabla: 36, tronco: 10, piedra: 8 }, pesos: 30000,
    fisica(h) { h.plataforma(0, 0, 3.6, 3, 0.18, 0.14, 0.5); h.segmento(-1.65, 1.38, 1.65, 1.38, 0.14, 0, 2.5); h.segmento(-1.2, -0.2, 1.2, -0.2, 0.32, 0, 1.0);
      // 4.11.2 (G-7): los dos barriles de atrás del mostrador
      h.circulo(-1.4, 0.75, 0.28, 0, 0.65); h.circulo(-0.9, 0.75, 0.28, 0, 0.65); },
    arma(c) {
      const W = 3.6, D = 3.0, H = 2.5;
      armazon(c, W, D, H, { platea: TABLA });
      caja(c, W - 0.3, H - 0.4, 0.08, [0, (H - 0.4) / 2 + 0.15, D / 2 - 0.12], TABLA, { variar: 0.14 });
      // el toldo a rayas, al frente
      for (let i = 0; i < 6; i++) caja(c, W / 6, 0.04, 0.6, [-W / 2 + W / 12 + i * (W / 6), H - 0.2, -(D / 2 + 0.05)], i % 2 ? '#d6c6a0' : '#a8433a', { rot: [-0.3, 0, 0], variar: 0.05 });
      // el mostrador con su balanza, la caja de monedas, frascos y un canasto
      caja(c, 2.4, 0.86, 0.6, [0, 0.58, -0.2], TABLA);
      caja(c, 2.5, 0.06, 0.7, [0, 1.04, -0.2], TABLA_CLARA);
      caja(c, 0.34, 0.03, 0.2, [-0.7, 1.095, -0.25], BRONCE, { tipo: 0 });
      caja(c, 0.03, 0.3, 0.03, [-0.7, 1.25, -0.25], BRONCE, { tipo: 0 });
      caja(c, 0.5, 0.03, 0.03, [-0.7, 1.4, -0.25], BRONCE, { tipo: 0 });
      for (const sx of [-1, 1]) cil(c, 0.08, 0.08, 0.02, [-0.7 + sx * 0.24, 1.3, -0.25], BRONCE, { tipo: 0, lados: 6 });
      caja(c, 0.3, 0.16, 0.22, [0.2, 1.17, -0.15], MADERA_OSCURA, { tipo: 0 });
      for (let i = 0; i < 3; i++) cil(c, 0.06, 0.06, 0.16, [0.7 + i * 0.16, 1.15, -0.2], ['#a8573a', '#c8a04a', '#6a8a5a'][i], { lados: 6, variar: 0.06 });
      cil(c, 0.24, 0.2, 0.22, [1.0, 1.15, -0.35], '#8a6a3a', { lados: 8, variar: 0.1, tipo: 0 });
      // los estantes del fondo con frascos, cajas y ponchos doblados
      for (const y of [0.85, 1.4, 1.95]) {
        caja(c, 2.7, 0.05, 0.3, [0, y, 1.2], TABLA);
        for (const sx of [-1, 1]) caja(c, 0.05, 0.55, 0.28, [sx * 1.3, y - 0.3, 1.2], MADERA_OSCURA, { tipo: 0 });
      }
      for (let i = 0; i < 6; i++) cil(c, 0.06, 0.06, 0.2, [-1.1 + i * 0.16, 1.5, 1.2], ['#c8a04a', '#a8573a', '#8a4a5a', '#6a8a5a', '#c8a04a', '#a8573a'][i], { lados: 5, variar: 0.06 });
      for (let i = 0; i < 4; i++) caja(c, 0.3, 0.2, 0.2, [0.1 + i * 0.34, 1.52, 1.2], i % 2 ? TABLA_CLARA : MADERA, { variar: 0.1 });
      for (let i = 0; i < 3; i++) caja(c, 0.6, 0.08, 0.26, [-0.7, 0.93 + i * 0.09, 1.2], ['#8a3a2a', '#3f5a6c', '#d6c6a0'][i], { variar: 0.06 });
      for (let i = 0; i < 4; i++) caja(c, 0.28, 0.24, 0.22, [0.5 + i * 0.32, 2.1, 1.2], i % 2 ? PAPEL : TABLA_CLARA, { variar: 0.08 });
      // dos barriles y el cartel colgado de la viga del frente
      for (let i = 0; i < 2; i++) cil(c, 0.26, 0.26, 0.62, [-1.4 + i * 0.5, 0.5, 0.75], MADERA, { lados: 8, tipo: 0, variar: 0.1 });
      caja(c, 1.4, 0.36, 0.06, [0, 2.2, -(D / 2 - 0.08)], '#d8c08a', { variar: 0.05 });
      for (let i = 0; i < 5; i++) caja(c, 0.1, 0.18, 0.02, [-0.4 + i * 0.2, 2.2, -(D / 2 - 0.12)], '#3a2c1a', { tipo: 0 });
    },
  },

  // ================================================================ la cantería
  {
    ...base, id: 'canteria', nombre: 'Cantería', ...lleno(3.4, 3.0, 2.3), separacion: 0.6,
    texto: 'Un taller de cantero con un bloque a medio labrar sobre el banco, cinceles y maza, bloques escuadrados apilados, lajas contra la pared, una grúa de mano con su polea y la carretilla. Con E la ponés a trabajar: la cuadrilla pica y acarrea tres piedras por día sin gastarte nada (hasta cuatro días juntando). Con oficio de picapedrero, más.',
    pide: { tabla: 12, tronco: 6, piedra: 12 }, pesos: 18000,
    fisica(h) { h.plataforma(0, 0, 3.4, 3, 0.18, 0.14, 0.5); h.segmento(-1.55, 1.34, 1.55, 1.34, 0.14, 0, 2.3); h.segmento(-1.2, 0.3, 0.5, 0.3, 0.38, 0, 1.0);
      // 4.11.2 (G-7): los bloques apilados, las lajas y la grúa de mano
      h.segmento(1.15, -0.25, 1.15, 0.27, 0.3, 0, 0.8); h.segmento(0.45, 1.0, 1.45, 1.0, 0.3, 0, 0.5); h.circulo(-1.3, -0.7, 0.3, 0, 1.9); },
    arma(c) {
      const W = 3.4, D = 3.0, H = 2.3;
      armazon(c, W, D, H, { fondoAlto: 1.9, fondoColor: PIEDRA_CLARA });
      // el bloque a medio labrar sobre el banco: una mitad lisa y la otra todavía en bruto, con cincel y maza
      caja(c, 1.5, 0.12, 0.8, [-0.35, 0.72, 0.3], PIEDRA);
      for (const sx of [-1, 1]) caja(c, 0.16, 0.7, 0.7, [-0.35 + sx * 0.6, 0.35, 0.3], PIEDRA, { variar: 0.14 });
      caja(c, 0.9, 0.5, 0.55, [-0.35, 1.03, 0.3], PIEDRA_CLARA, { variar: 0.1 });
      caja(c, 0.45, 0.52, 0.57, [-0.15, 1.04, 0.3], PIEDRA, { variar: 0.2 });
      cil(c, 0.015, 0.025, 0.3, [-0.55, 1.4, 0.15], HIERRO, { tipo: 0, lados: 5, rot: [0.2, 0, 0.5] });
      cil(c, 0.03, 0.03, 0.3, [0.2, 1.33, 0.45], MADERA, { tipo: 0, lados: 5, rot: [0, 0, Math.PI / 2] });
      caja(c, 0.14, 0.1, 0.1, [0.38, 1.33, 0.45], HIERRO, { tipo: 0 });
      // los bloques escuadrados apilados a la derecha y las lajas contra el fondo
      for (let i = 0; i < 3; i++) caja(c, 0.7, 0.4, 0.5, [1.15, 0.37 + (i === 2 ? 0.4 : 0), -0.25 + (i === 1 ? 0.52 : 0) - (i === 2 ? 0.26 : 0)], i === 1 ? PIEDRA : PIEDRA_CLARA, { variar: 0.14 });
      for (let i = 0; i < 4; i++) caja(c, 1.0, 0.07, 0.6, [0.95, 0.2 + i * 0.08, 1.0], PIEDRA, { variar: 0.18, rot: [0, (i - 1.5) * 0.06, 0] });
      // la grúa de mano: trípode, soga y un bloque colgado
      for (let k = 0; k < 3; k++) { const a = k * 2.09 + 0.3; cil(c, 0.035, 0.045, 1.9, [-1.3 + Math.sin(a) * 0.3, 0.95, -0.7 + Math.cos(a) * 0.3], MADERA, { lados: 5, tipo: 0, rot: [Math.cos(a) * 0.16, 0, -Math.sin(a) * 0.16] }); }
      cil(c, 0.012, 0.012, 1.0, [-1.3, 1.35, -0.7], '#b59a5c', { lados: 4, tipo: 0 });
      caja(c, 0.3, 0.22, 0.22, [-1.3, 0.72, -0.7], PIEDRA, { variar: 0.14 });
      // la carretilla
      caja(c, 0.7, 0.05, 0.5, [0.3, 0.4, -0.85], MADERA);
      for (const sz of [-1, 1]) caja(c, 0.7, 0.2, 0.04, [0.3, 0.5, -0.85 + sz * 0.25], MADERA);
      caja(c, 0.04, 0.2, 0.5, [-0.05, 0.5, -0.85], MADERA);
      cil(c, 0.19, 0.19, 0.06, [-0.28, 0.2, -0.85], MADERA_OSCURA, { lados: 8, tipo: 0, rot: [0, 0, Math.PI / 2] });
      for (const sz of [-1, 1]) caja(c, 0.8, 0.04, 0.04, [0.72, 0.42, -0.85 + sz * 0.2], MADERA_OSCURA, { tipo: 0 });
      // un montoncito de ripio
      c.agregar(new THREE.IcosahedronGeometry(0.22, 0), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([0.2, 0.25, 0.9], [0, 0.4, 0], [1.4, 0.6, 1.1]) });
    },
  },
];
