// 3.8.8: la segunda tanda de mobiliario (elegida por el usuario): para dormir, la cama doble, la litera, el tocador con espejo y la
// bañera de chapa con su biombo; en la sala, la mecedora, la vitrina, la mesa ratona y el hogar con repisa; para el trabajo y la
// despensa, el banco de carpintero, el tonel con sus barricas y el colgador de hierbas y chorizos; y de decoración, la guirnalda de
// luces, el telar con la rueca y la hamaca paraguaya. Mismas reglas que planos-muebles.js (frente a -z, fondo a +z, sólo tipo 0 y 4,
// la colisión sale de `fisica(h)`, sólo en el Relax). La guirnalda se cuelga de la pared y no choca.
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { AYUDAS_MUEBLES } from './planos-muebles.js';

const { caja, cil, tira, pies, puerta, hs, MADERA, MADERA_OSCURA, TABLA, TABLA_CLARA, PIEDRA, HIERRO, BRONCE, PAPEL, VIDRIO } = AYUDAS_MUEBLES;
const LANA_ROJA = '#7b4a3a';
const MIEL = '#c8a04a';
const base = { categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, pieza: true };

export const PIEZAS_MUEBLES_2 = [
  // ================================================================ para dormir
  {
    ...base, id: 'cama-doble', nombre: 'Cama doble', radio: 1.5, ancho: 1.65, fondo: 2.15, alto: 1.05, separacion: 1.4,
    funciones: ['dormir'], confort: 5,
    texto: 'Una cama matrimonial de tablas, con cabecera alta, pie bajo, colchón de lana, dos almohadas y una colcha. La cabecera queda del lado de atrás: girala con R. Se duerme mejor en una habitación cerrada.',
    pide: { tabla: 14, tronco: 2, lana: 4 },
    fisica(h) { h.segmento(0, -0.3, 0, 0.3, 0.72, 0.02, 0.62); },
    arma(c) {
      caja(c, 1.5, 0.2, 2.0, [0, 0.36, 0], TABLA);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.12, 0.3, 0.12, [sx * 0.7, 0.15, sz * 0.94], MADERA_OSCURA, { tipo: 0 });
      caja(c, 1.64, 0.82, 0.08, [0, 0.62, 1.03], MADERA_OSCURA, { tipo: 0 });
      for (let i = 0; i < 5; i++) caja(c, 0.05, 0.66, 0.05, [-0.6 + i * 0.3, 0.78, 1.0], TABLA_CLARA);
      caja(c, 1.64, 0.4, 0.08, [0, 0.5, -1.03], MADERA_OSCURA, { tipo: 0 });
      caja(c, 1.4, 0.16, 1.9, [0, 0.54, 0], '#b9ae9a', { variar: 0.08 });
      caja(c, 1.42, 0.07, 1.28, [0, 0.64, -0.3], LANA_ROJA, { variar: 0.1 });
      caja(c, 1.44, 0.025, 0.26, [0, 0.69, -0.9], MIEL, { variar: 0.06 });
      for (const sx of [-1, 1]) caja(c, 0.58, 0.12, 0.34, [sx * 0.36, 0.67, 0.72], '#d8d0c0', { variar: 0.05, rot: [0.1, sx * 0.08, 0] });
    },
  },
  {
    ...base, id: 'litera', nombre: 'Litera', radio: 1.3, ancho: 1.3, fondo: 2.1, alto: 1.8, separacion: 1.3,
    funciones: ['dormir'], confort: 4,
    texto: 'Dos camas de tablas una sobre la otra, con una escalerita en un costado y un tope para que nadie se caiga. Para una casa con chicos, o con visitas.',
    pide: { tabla: 14, tronco: 3, lana: 2 },
    fisica(h) { h.segmento(0, -0.45, 0, 0.45, 0.58, 0, 1.75); },
    arma(c) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.1, 1.75, 0.1, [sx * 0.52, 0.875, sz * 0.97], MADERA_OSCURA, { tipo: 0 });
      for (const [y, col] of [[0.34, LANA_ROJA], [1.14, '#4a6a7a']]) {
        caja(c, 1.0, 0.1, 2.0, [0, y, 0], TABLA);
        caja(c, 0.92, 0.14, 1.9, [0, y + 0.12, 0], '#b9ae9a', { variar: 0.08 });
        caja(c, 0.94, 0.05, 1.1, [0, y + 0.2, -0.4], col, { variar: 0.1 });
        caja(c, 0.5, 0.1, 0.32, [0, y + 0.22, 0.72], '#d8d0c0', { variar: 0.05 });
        caja(c, 0.05, 0.3, 1.5, [-0.5, y + 0.2, 0.2], TABLA_CLARA);   // el tope
      }
      caja(c, 1.04, 0.5, 0.06, [0, 1.52, 1.0], MADERA_OSCURA, { tipo: 0 });
      // la escalerita, del lado derecho
      for (const sz of [-0.34, 0.12]) caja(c, 0.05, 1.18, 0.06, [0.6, 0.6, sz], MADERA_OSCURA, { tipo: 0 });
      for (let i = 0; i < 4; i++) caja(c, 0.05, 0.05, 0.5, [0.6, 0.24 + i * 0.28, -0.11], TABLA_CLARA, { tipo: 0 });
    },
  },
  {
    ...base, id: 'tocador', nombre: 'Tocador con espejo', radio: 0.8, ancho: 0.9, fondo: 0.95, alto: 1.7, separacion: 0.9, confort: 2,
    texto: 'Una mesita con dos cajones, un espejo redondo con marco de madera, un banquito y los frascos de siempre. Contra la pared, de espaldas a +Z.',
    pide: { tabla: 6, piedra: 1 },
    fisica(h) { h.segmento(-0.2, 0.22, 0.2, 0.22, 0.22, 0, 1.0); h.circulo(0, -0.3, 0.17, 0, 0.46); },
    arma(c) {
      caja(c, 0.84, 0.05, 0.42, [0, 0.76, 0.22], TABLA_CLARA);
      caja(c, 0.76, 0.18, 0.38, [0, 0.64, 0.22], '#6a5238');
      for (const sx of [-1, 1]) { caja(c, 0.3, 0.13, 0.012, [sx * 0.19, 0.64, 0.02], TABLA); caja(c, 0.07, 0.018, 0.02, [sx * 0.19, 0.64, 0.005], BRONCE, { tipo: 0 }); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.06, 0.55, 0.06, [sx * 0.38, 0.275, 0.22 + sz * 0.17], MADERA_OSCURA, { tipo: 0 });
      // el espejo: un disco de vidrio con un aro de madera, sobre un pie
      cil(c, 0.3, 0.3, 0.03, [0, 1.3, 0.38], MADERA_OSCURA, { tipo: 0, lados: 20, rot: [Math.PI / 2, 0, 0] });
      cil(c, 0.26, 0.26, 0.015, [0, 1.3, 0.362], VIDRIO, { lados: 20, rot: [Math.PI / 2, 0, 0], variar: 0.03 });
      caja(c, 0.05, 0.4, 0.05, [0, 0.95, 0.4], MADERA_OSCURA, { tipo: 0 });
      // frascos, un peine y la cajita
      for (let i = 0; i < 3; i++) cil(c, 0.03, 0.03, 0.09 + i * 0.03, [-0.28 + i * 0.09, 0.84 + i * 0.015, 0.32], ['#9fb4c0', '#d07aa8', '#c8a04a'][i], { lados: 8 });
      caja(c, 0.14, 0.012, 0.04, [0.12, 0.79, 0.1], '#e2d6b8', { rot: [0, 0.3, 0] });
      caja(c, 0.16, 0.08, 0.11, [0.28, 0.82, 0.25], '#7a3a2a');
      // el banquito
      cil(c, 0.17, 0.17, 0.05, [0, 0.4, -0.3], LANA_ROJA, { lados: 12 });
      for (let k = 0; k < 3; k++) { const a = k * 2.09 + 0.5; cil(c, 0.025, 0.025, 0.38, [Math.cos(a) * 0.11, 0.19, -0.3 + Math.sin(a) * 0.11], MADERA_OSCURA, { tipo: 0, lados: 5 }); }
    },
  },
  {
    ...base, id: 'banera-biombo', nombre: 'Bañera de chapa y biombo', radio: 1.3, ancho: 1.95, fondo: 1.1, alto: 1.65, separacion: 1.4, confort: 2,
    texto: 'Una bañera de chapa con patas de garra, llena de agua tibia, y un biombo plegable de tela y madera para que nadie mire. El biombo va atrás: el fondo mira a +Z.',
    pide: { tabla: 8, piedra: 6 },
    fisica(h) { h.segmento(-0.5, -0.05, 0.5, -0.05, 0.4, 0, 0.58); h.segmento(-0.8, 0.46, 0.8, 0.46, 0.08, 0, 1.6); },
    arma(c) {
      const CHAPA = '#8e9aa0', CHAPA2 = '#a8b3b8';
      caja(c, 1.5, 0.05, 0.62, [0, 0.14, -0.05], CHAPA, { variar: 0.06 });
      for (const sz of [-1, 1]) caja(c, 1.58, 0.45, 0.05, [0, 0.35, -0.05 + sz * 0.33], CHAPA, { variar: 0.06 });
      for (const sx of [-1, 1]) { cil(c, 0.33, 0.33, 0.45, [sx * 0.75, 0.35, -0.05], CHAPA, { lados: 12, variar: 0.06 }); }
      caja(c, 1.5, 0.02, 0.62, [0, 0.45, -0.05], '#6a8a9a', { variar: 0.04 });
      caja(c, 1.64, 0.035, 0.72, [0, 0.585, -0.05], CHAPA2, { variar: 0.05 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.1, 0.16, 0.1, [sx * 0.66, 0.08, -0.05 + sz * 0.25], HIERRO, { tipo: 0 });
      cil(c, 0.018, 0.018, 0.2, [0.62, 0.7, 0.2], BRONCE, { tipo: 0, lados: 6 });   // la canilla
      // el biombo: tres paños que hacen zigzag, con su tela
      for (let i = 0; i < 3; i++) {
        const x = -0.58 + i * 0.58, z = 0.48 + (i % 2 ? 0.05 : -0.03), giro = i % 2 ? -0.3 : 0.3;
        caja(c, 0.58, 1.55, 0.04, [x, 0.8, z], MADERA_OSCURA, { tipo: 0, rot: [0, giro, 0] });
        caja(c, 0.48, 1.35, 0.045, [x, 0.8, z - 0.005], ['#c9b486', '#bfa979', '#d0bc90'][i], { variar: 0.08, rot: [0, giro, 0] });
        caja(c, 0.36, 0.5, 0.05, [x, 1.05, z - 0.01], ['#8f6a4a', '#7a8a6a', '#8a5a4a'][i], { variar: 0.1, rot: [0, giro, 0] });
      }
      // la toalla y el jabón
      caja(c, 0.34, 0.2, 0.03, [-0.5, 0.5, -0.4], '#e8e0c8', { variar: 0.04 });
      caja(c, 0.1, 0.045, 0.07, [0.2, 0.62, -0.05], '#f2ece0', { variar: 0.03 });
    },
  },
  // ================================================================ la sala
  {
    ...base, id: 'mecedora', nombre: 'Mecedora', radio: 0.75, ancho: 0.72, fondo: 1.05, alto: 1.05, separacion: 0.8, confort: 3,
    texto: 'Una silla mecedora de madera, con respaldo de varillas y una manta de lana sobre el respaldo. La de la abuela, junto al fuego.',
    pide: { tabla: 7, tronco: 1, lana: 1 },
    fisica(h) { h.segmento(0, -0.15, 0, 0.15, 0.32, 0, 1.0); },
    arma(c) {
      for (const sx of [-1, 1]) {
        // el balancín: una curva de tablitas
        for (let i = 0; i < 7; i++) {
          const z = -0.45 + i * 0.15, y = 0.05 + 0.13 * (z / 0.45) ** 2, pend = 0.26 * z / 0.45 ** 2;
          caja(c, 0.045, 0.04, 0.17, [sx * 0.29, y, z], MADERA_OSCURA, { tipo: 0, rot: [-Math.atan(pend), 0, 0] });
        }
        for (const sz of [-1, 1]) caja(c, 0.05, 0.38, 0.05, [sx * 0.27, 0.27, sz * 0.2], MADERA, { tipo: 0, rot: [0, 0, 0] });
        caja(c, 0.06, 0.05, 0.5, [sx * 0.28, 0.58, 0.02], MADERA_OSCURA, { tipo: 0 });   // el apoyabrazos
        caja(c, 0.05, 0.62, 0.05, [sx * 0.27, 0.74, 0.22], MADERA, { tipo: 0, rot: [-0.12, 0, 0] });
      }
      caja(c, 0.54, 0.05, 0.5, [0, 0.45, 0], TABLA_CLARA);
      caja(c, 0.5, 0.07, 0.46, [0, 0.5, -0.02], LANA_ROJA, { variar: 0.1 });
      for (let i = 0; i < 5; i++) caja(c, 0.035, 0.5, 0.03, [-0.17 + i * 0.085, 0.78, 0.26], TABLA, { rot: [-0.12, 0, 0] });
      caja(c, 0.58, 0.06, 0.06, [0, 1.03, 0.29], MADERA_OSCURA, { tipo: 0, rot: [-0.12, 0, 0] });
      caja(c, 0.46, 0.04, 0.34, [0.02, 0.88, 0.25], MIEL, { variar: 0.08, rot: [0.5, 0.1, 0] });
    },
  },
  {
    ...base, id: 'vitrina', nombre: 'Vitrina', radio: 0.75, ancho: 0.95, fondo: 0.44, alto: 1.85, separacion: 0.9, confort: 2,
    texto: 'Un mueble alto de puertas con vidrio, tres estantes y adentro las cosas lindas de la casa: copas, frascos, una jarra de barro. Contra la pared, de espaldas a +Z.',
    pide: { tabla: 10, piedra: 2 },
    fisica(h) { h.segmento(-0.3, 0, 0.3, 0, 0.2, 0, 1.85); },
    arma(c) {
      for (const sx of [-1, 1]) caja(c, 0.05, 1.8, 0.36, [sx * 0.45, 0.93, 0.02], MADERA_OSCURA, { tipo: 0 });
      caja(c, 0.9, 1.8, 0.03, [0, 0.93, 0.19], '#5b4735');
      caja(c, 1.0, 0.07, 0.42, [0, 1.83, 0.02], MADERA_OSCURA, { tipo: 0 });
      caja(c, 0.94, 0.5, 0.4, [0, 0.27, 0.02], '#6a5238');
      puerta(c, -0.22, 0.28, -0.185, 0.4, 0.42); puerta(c, 0.22, 0.28, -0.185, 0.4, 0.42);
      pies(c, 0.9, 0.4, 0.04, MADERA_OSCURA, 0.08);
      for (const y of [0.78, 1.2, 1.55]) caja(c, 0.86, 0.035, 0.34, [0, y, 0.02], TABLA);
      // las puertas de vidrio: el marco y una tira de brillo
      for (const sx of [-1, 1]) {
        caja(c, 0.03, 1.1, 0.03, [sx * 0.42, 1.28, -0.17], MADERA, { tipo: 0 });
        caja(c, 0.04, 1.0, 0.012, [sx * 0.13, 1.3, -0.175], VIDRIO, { variar: 0.03 });
      }
      caja(c, 0.03, 1.1, 0.03, [0, 1.28, -0.17], MADERA, { tipo: 0 });
      caja(c, 0.84, 0.03, 0.03, [0, 1.82, -0.17], MADERA, { tipo: 0 });
      caja(c, 0.84, 0.03, 0.03, [0, 0.76, -0.17], MADERA, { tipo: 0 });
      // adentro: copas, frascos, una jarra y un plato parado
      for (let i = 0; i < 4; i++) { cil(c, 0.03, 0.02, 0.1, [-0.3 + i * 0.1, 0.85, 0.02], '#cfc8b4', { lados: 8, variar: 0.04 }); cil(c, 0.035, 0.025, 0.012, [-0.3 + i * 0.1, 0.8, 0.02], '#cfc8b4', { lados: 8 }); }
      cil(c, 0.09, 0.07, 0.16, [0.22, 0.88, 0.02], '#a8573a', { lados: 10 });
      for (let i = 0; i < 4; i++) cil(c, 0.035, 0.035, 0.13 + hs(i) * 0.04, [-0.28 + i * 0.12, 1.29, 0.02], ['#6a8a5a', '#c8a04a', '#8a4a5a', '#9fb4c0'][i], { lados: 8 });
      cil(c, 0.14, 0.14, 0.018, [0.28, 1.4, 0.15], '#9fb4c0', { lados: 14, rot: [Math.PI / 2 - 0.1, 0, 0] });
      cil(c, 0.15, 0.12, 0.05, [-0.1, 1.6, 0.02], '#cfc8b4', { lados: 12 });
      cil(c, 0.08, 0.06, 0.12, [0.3, 1.64, 0.02], '#7a5a3a', { lados: 8 });
    },
  },
  {
    ...base, id: 'mesa-ratona', nombre: 'Mesa ratona', radio: 0.7, ancho: 1.1, fondo: 0.7, alto: 0.5, separacion: 0.6, confort: 1,
    texto: 'Una mesa baja de centro, con un estante abajo, para la tetera, las tazas y el libro del momento. Delante del sillón.',
    pide: { tabla: 5 },
    fisica(h) { h.segmento(-0.3, 0, 0.3, 0, 0.3, 0, 0.45); },
    arma(c) {
      caja(c, 1.06, 0.05, 0.62, [0, 0.4, 0], TABLA_CLARA);
      caja(c, 1.0, 0.07, 0.56, [0, 0.35, 0], MADERA_OSCURA, { tipo: 0 });
      pies(c, 1.0, 0.54, 0.38, MADERA_OSCURA, 0.07);
      caja(c, 0.9, 0.03, 0.44, [0, 0.14, 0], TABLA);
      // la tetera, dos tazas, un libro y unas ramitas
      cil(c, 0.08, 0.09, 0.1, [-0.25, 0.47, 0.02], '#a8573a', { lados: 10 });
      cil(c, 0.03, 0.04, 0.04, [-0.25, 0.54, 0.02], '#a8573a', { lados: 8 });
      caja(c, 0.07, 0.02, 0.02, [-0.15, 0.49, 0.02], '#a8573a', { rot: [0, 0, 0.5] });
      for (const [x, z] of [[-0.05, -0.12], [-0.05, 0.16]]) { cil(c, 0.04, 0.03, 0.05, [x, 0.455, z], '#cfc8b4', { lados: 8 }); cil(c, 0.05, 0.05, 0.008, [x, 0.43, z], '#cfc8b4', { lados: 10 }); }
      caja(c, 0.28, 0.04, 0.2, [0.28, 0.445, 0.04], '#3a5a6a', { rot: [0, 0.25, 0], variar: 0.08 });
      caja(c, 0.26, 0.025, 0.18, [0.28, 0.48, 0.04], '#7a3a2a', { rot: [0, 0.1, 0], variar: 0.08 });
      cil(c, 0.05, 0.04, 0.05, [0.26, 0.2, -0.05], '#a8573a', { lados: 8 });
    },
  },
  {
    ...base, id: 'hogar-repisa', nombre: 'Hogar con repisa', radio: 1.3, ancho: 1.9, fondo: 0.9, alto: 2.15, separacion: 1.6, confort: 3,
    texto: 'Un hogar de piedra a la vista con la boca ancha, leños y brasas, la repisa de madera y una chimenea que sube hasta el techo. Se pone contra la pared. El fondo mira a +Z.',
    pide: { piedra: 14, tronco: 2 },
    fisica(h) { h.segmento(-0.7, 0.15, 0.7, 0.15, 0.3, 0, 2.15); },
    arma(c) {
      const piedras = (x0, x1, y0, y1, z, prof, sem) => {
        for (let f = 0, y = y0; y < y1 - 0.01; f++) {
          const alto = Math.min(0.2 + hs(sem + f) * 0.06, y1 - y);
          let x = x0 + (f % 2) * 0.12;
          for (let i = 0; x < x1 - 0.02; i++) {
            const w = Math.min(0.26 + hs(sem + f * 7 + i) * 0.16, x1 - x);
            caja(c, w - 0.012, alto - 0.012, prof, [x + w / 2, y + alto / 2, z], ['#7d766c', '#8a8378', '#6d675e', '#948c80'][Math.floor(hs(sem + f * 3 + i + 2) * 4)], { variar: 0.12 });
            x += w;
          }
          y += alto;
        }
      };
      caja(c, 1.9, 0.1, 0.9, [0, 0.05, 0], '#6d675e', { variar: 0.1 });   // la losa del hogar
      piedras(-0.95, -0.55, 0.1, 1.05, 0.15, 0.6, 3);
      piedras(0.55, 0.95, 0.1, 1.05, 0.15, 0.6, 11);
      caja(c, 1.3, 0.12, 0.64, [0, 1.0, 0.15], MADERA_OSCURA, { tipo: 0 });   // el dintel
      piedras(-0.65, 0.65, 1.06, 2.15, 0.2, 0.5, 21);   // la chimenea
      // adentro: el fondo negro, la parrilla, los leños y las brasas
      caja(c, 1.1, 0.88, 0.04, [0, 0.54, 0.42], '#241f1b');
      caja(c, 1.1, 0.04, 0.5, [0, 0.12, 0.17], '#2a2520');
      for (const [x, z, rz] of [[-0.18, 0.12, 0.08], [0.15, 0.2, -0.1], [0, 0.3, 0.02]]) cil(c, 0.07, 0.07, 0.62, [x, 0.2, z], '#5b4430', { tipo: 0, lados: 7, rot: [0, 0, Math.PI / 2 + rz] });
      for (let i = 0; i < 7; i++) caja(c, 0.1, 0.05, 0.1, [-0.3 + i * 0.1, 0.17, 0.12 + hs(i) * 0.2], i % 3 ? '#d6641c' : '#f0a030', { tipo: 0, variar: 0.1, rot: [0, i, 0] });
      // la repisa y lo que hay encima
      caja(c, 1.7, 0.08, 0.42, [0, 1.3, 0.12], TABLA_CLARA);
      for (const sx of [-1, 1]) caja(c, 0.1, 0.16, 0.32, [sx * 0.7, 1.2, 0.12], MADERA_OSCURA, { tipo: 0 });
      for (const sx of [-0.55, 0.55]) { cil(c, 0.04, 0.05, 0.2, [sx, 1.44, 0.12], BRONCE, { tipo: 0, lados: 8 }); cil(c, 0.02, 0.02, 0.1, [sx, 1.59, 0.12], PAPEL, { lados: 6 }); }
      cil(c, 0.07, 0.06, 0.16, [-0.1, 1.42, 0.14], '#a8573a', { lados: 10 });
      caja(c, 0.3, 0.2, 0.03, [0.2, 1.46, 0.14], '#3a5a6a', { variar: 0.1, rot: [0, 0, 0.06] });
    },
  },
  // ================================================================ el trabajo y la despensa
  {
    ...base, id: 'banco-carpintero', nombre: 'Banco de carpintero', radio: 1.3, ancho: 2.0, fondo: 0.8, alto: 1.55, separacion: 1.6, confort: 1,
    texto: 'Un banco de tablones gruesos con un tornillo de banco, y atrás un tablero con las herramientas colgadas: serrucho, martillo, formones. Para el taller de la casa.',
    pide: { tabla: 12, tronco: 2 },
    fisica(h) { h.segmento(-0.7, 0, 0.7, 0, 0.38, 0, 0.95); },
    arma(c) {
      caja(c, 1.9, 0.1, 0.66, [0, 0.9, -0.02], TABLA_CLARA);
      for (let i = 0; i < 3; i++) caja(c, 1.9, 0.012, 0.005, [0, 0.96, -0.22 + i * 0.2], MADERA_OSCURA, { variar: 0.05 });
      for (const sx of [-1, 1]) { caja(c, 0.12, 0.85, 0.12, [sx * 0.8, 0.42, -0.2], MADERA_OSCURA, { tipo: 0 }); caja(c, 0.12, 0.85, 0.12, [sx * 0.8, 0.42, 0.2], MADERA_OSCURA, { tipo: 0 }); caja(c, 0.1, 0.1, 0.5, [sx * 0.8, 0.4, 0], MADERA_OSCURA, { tipo: 0 }); }
      caja(c, 1.7, 0.05, 0.5, [0, 0.35, 0], TABLA);
      // el tornillo de banco, adelante a la izquierda
      caja(c, 0.14, 0.2, 0.1, [-0.78, 0.88, -0.36], HIERRO, { tipo: 0 });
      cil(c, 0.018, 0.018, 0.14, [-0.78, 0.86, -0.43], HIERRO, { tipo: 0, lados: 6, rot: [Math.PI / 2, 0, 0] });
      cil(c, 0.015, 0.015, 0.16, [-0.78, 0.86, -0.5], HIERRO, { tipo: 0, lados: 6, rot: [0, 0, Math.PI / 2] });
      // sobre el banco: una tabla a medio cepillar, el cepillo y virutas
      caja(c, 0.9, 0.04, 0.2, [0.1, 0.99, -0.08], '#b5946a', { rot: [0, 0.06, 0], variar: 0.08 });
      caja(c, 0.26, 0.07, 0.08, [0.62, 1.02, -0.2], '#8a6b4a', { variar: 0.08 });
      for (let i = 0; i < 4; i++) caja(c, 0.1, 0.01, 0.04, [-0.3 + i * 0.14, 0.96, 0.1 + hs(i) * 0.1], '#d0b690', { rot: [0, i, 0.3], variar: 0.08 });
      // en el estante de abajo: un tronco y tablas apiladas
      cil(c, 0.08, 0.08, 0.5, [-0.4, 0.45, 0], '#5b4430', { tipo: 0, lados: 7, rot: [Math.PI / 2, 0, 0] });
      for (let i = 0; i < 3; i++) caja(c, 0.6, 0.03, 0.2, [0.4, 0.4 + i * 0.03, 0], TABLA, { rot: [0, i * 0.05, 0], variar: 0.1 });
      // el tablero de atrás, con la herramienta colgada
      caja(c, 1.9, 0.62, 0.04, [0, 1.3, 0.34], '#5b4735');
      caja(c, 1.96, 0.06, 0.08, [0, 1.63, 0.34], MADERA_OSCURA, { tipo: 0 });
      caja(c, 0.55, 0.1, 0.012, [-0.6, 1.4, 0.31], '#aab0b2', { tipo: 0, rot: [0, 0, 0.05] });   // el serrucho
      caja(c, 0.14, 0.1, 0.03, [-0.9, 1.4, 0.31], MADERA, { tipo: 0 });
      cil(c, 0.015, 0.015, 0.28, [-0.1, 1.3, 0.31], MADERA, { tipo: 0, lados: 5 });
      caja(c, 0.12, 0.06, 0.05, [-0.1, 1.46, 0.31], HIERRO, { tipo: 0 });   // el martillo
      for (let i = 0; i < 4; i++) { caja(c, 0.025, 0.24, 0.03, [0.2 + i * 0.09, 1.28, 0.31], MADERA, { tipo: 0 }); caja(c, 0.03, 0.08, 0.012, [0.2 + i * 0.09, 1.12, 0.31], '#aab0b2', { tipo: 0 }); }
      caja(c, 0.3, 0.34, 0.02, [0.8, 1.3, 0.315], '#b5946a', { variar: 0.1 });
    },
  },
  {
    ...base, id: 'tonel-barricas', nombre: 'Tonel y barricas', radio: 1.5, ancho: 2.0, fondo: 1.25, alto: 1.2, separacion: 1.6, confort: 1,
    texto: 'Un tonel grande acostado en su caballete, con su canilla, y dos barricas paradas a un costado: la sidra, el vino y lo que se guarda para el invierno.',
    pide: { tabla: 12, tronco: 2 },
    fisica(h) { h.segmento(-0.3, 0, -0.1, 0, 0.5, 0, 1.12); h.circulo(0.7, -0.3, 0.28, 0, 0.62); h.circulo(0.7, 0.3, 0.28, 0, 0.62); },
    arma(c) {
      const DUELA = '#7a5a3a', DUELA2 = '#85633f';
      // el tonel, acostado a lo largo de x: panza ancha, bocas más angostas
      cil(c, 0.43, 0.46, 0.2, [-0.52, 0.6, 0], DUELA, { lados: 16, rot: [0, 0, Math.PI / 2] });
      cil(c, 0.48, 0.43, 0.2, [-0.4, 0.6, 0], DUELA2, { lados: 16, rot: [0, 0, Math.PI / 2] });
      cil(c, 0.5, 0.5, 0.44, [-0.2, 0.6, 0], DUELA2, { lados: 16, rot: [0, 0, Math.PI / 2] });
      cil(c, 0.46, 0.5, 0.2, [0.02, 0.6, 0], DUELA2, { lados: 16, rot: [0, 0, Math.PI / 2] });
      cil(c, 0.42, 0.46, 0.2, [0.14, 0.6, 0], DUELA, { lados: 16, rot: [0, 0, Math.PI / 2] });
      for (const [x, r] of [[-0.58, 0.45], [-0.35, 0.5], [-0.02, 0.52], [0.2, 0.46]]) cil(c, r, r, 0.04, [x, 0.6, 0], HIERRO, { tipo: 0, lados: 16, rot: [0, 0, Math.PI / 2] });
      cil(c, 0.32, 0.32, 0.02, [-0.62, 0.6, 0], '#8a6b4a', { lados: 14, rot: [0, 0, Math.PI / 2] });
      cil(c, 0.025, 0.025, 0.12, [-0.6, 0.38, -0.02], BRONCE, { tipo: 0, lados: 6, rot: [0, 0, Math.PI / 2] });
      cil(c, 0.04, 0.04, 0.05, [-0.2, 1.1, 0], '#4a3b2c', { tipo: 0, lados: 8 });   // el tapón
      // el caballete: dos cunas
      for (const x of [-0.5, 0.1]) { caja(c, 0.1, 0.3, 0.9, [x, 0.15, 0], MADERA_OSCURA, { tipo: 0 }); caja(c, 0.12, 0.06, 0.5, [x, 0.3, 0], MADERA, { tipo: 0, rot: [0, 0, 0] }); }
      // las barricas paradas
      for (const z of [-0.3, 0.3]) {
        cil(c, 0.25, 0.22, 0.2, [0.7, 0.12, z], DUELA, { lados: 12 });
        cil(c, 0.27, 0.25, 0.22, [0.7, 0.33, z], DUELA2, { lados: 12 });
        cil(c, 0.24, 0.27, 0.2, [0.7, 0.53, z], DUELA, { lados: 12 });
        cil(c, 0.235, 0.235, 0.025, [0.7, 0.645, z], '#8a6b4a', { lados: 12 });
        for (const [y, r] of [[0.06, 0.225], [0.25, 0.27], [0.5, 0.265]]) cil(c, r + 0.01, r + 0.01, 0.025, [0.7, y, z], HIERRO, { tipo: 0, lados: 12 });
      }
      caja(c, 0.2, 0.05, 0.05, [0.7, 0.68, -0.3], MADERA, { rot: [0, 0.6, 0.3], tipo: 0 });   // el mazo
    },
  },
  {
    ...base, id: 'colgador-hierbas', nombre: 'Colgador de hierbas y chorizos', radio: 1.2, ancho: 1.9, fondo: 0.5, alto: 2.05, separacion: 1.3, confort: 1,
    texto: 'Un travesaño de madera en dos postes, bajo, con ramos de hierbas secas, ristras de ajos, cebollas y chorizos colgando. Para la despensa o la cocina.',
    pide: { tabla: 5, tronco: 2 },
    fisica(h) { h.circulo(-0.85, 0, 0.1, 0, 2.0); h.circulo(0.85, 0, 0.1, 0, 2.0); },
    arma(c) {
      for (const sx of [-1, 1]) {
        cil(c, 0.055, 0.065, 2.0, [sx * 0.85, 1.0, 0], MADERA_OSCURA, { tipo: 0, lados: 8 });
        caja(c, 0.3, 0.06, 0.4, [sx * 0.85, 0.03, 0], MADERA_OSCURA, { tipo: 0 });
        caja(c, 0.06, 0.4, 0.06, [sx * 0.85, 0.3, -0.18], MADERA_OSCURA, { tipo: 0, rot: [-0.4, 0, 0] });
      }
      cil(c, 0.04, 0.04, 1.8, [0, 1.95, 0], MADERA, { tipo: 0, lados: 8, rot: [0, 0, Math.PI / 2] });
      const cuelga = (x, z, largo, ancho, col, forma) => {
        cil(c, 0.005, 0.005, 0.25, [x, 1.82, z], '#8a7a5a', { tipo: 0, lados: 3 });
        if (forma === 'ramo') c.agregar(new THREE.ConeGeometry(ancho, largo, 7), { color: col, tipo: 4, variar: 0.14, matriz: matriz([x, 1.7 - largo / 2, z], [Math.PI, 0, 0]) });
        else cil(c, ancho, ancho, largo, [x, 1.7 - largo / 2, z], col, { lados: 8, variar: 0.12 });
      };
      // ramos de hierbas, ajos, ristra de chorizos y un jamón
      [[-0.65, 0.5, '#6a7a3a'], [-0.5, 0.42, '#8a8a4a'], [-0.36, 0.55, '#7a5a8a']].forEach(([x, l, col]) => cuelga(x, 0, l, 0.07, col, 'ramo'));
      for (let i = 0; i < 4; i++) { cuelga(-0.12 + i * 0.07, 0, 0.35, 0.03, '#e8e0c8', 'cuerda'); c.agregar(new THREE.IcosahedronGeometry(0.045, 0), { color: '#ece4d0', tipo: 4, variar: 0.06, matriz: matriz([-0.12 + i * 0.07, 1.34 - (i % 2) * 0.08, 0]) }); }
      for (let i = 0; i < 5; i++) { cil(c, 0.035, 0.035, 0.22, [0.3 + (i % 2) * 0.03, 1.55 - i * 0.2, 0], i % 2 ? '#8a3a2a' : '#7a2f26', { lados: 8, variar: 0.1 }); }
      cil(c, 0.005, 0.005, 0.25, [0.3, 1.82, 0], '#8a7a5a', { tipo: 0, lados: 3 });
      c.agregar(new THREE.IcosahedronGeometry(0.15, 1), { color: '#a8573a', tipo: 4, variar: 0.1, matriz: matriz([0.65, 1.4, 0], [0, 0, 0], [0.8, 1.4, 0.8]) });
      cil(c, 0.005, 0.005, 0.25, [0.65, 1.82, 0], '#8a7a5a', { tipo: 0, lados: 3 });
      for (let i = 0; i < 4; i++) c.agregar(new THREE.IcosahedronGeometry(0.06, 0), { color: '#c98a3a', tipo: 4, variar: 0.08, matriz: matriz([0.1 + (i % 2) * 0.08, 1.55 - i * 0.12, 0.04 * (i % 2 ? 1 : -1)]) });
    },
  },
  // ================================================================ decoración y rincones
  {
    ...base, id: 'guirnalda', nombre: 'Guirnalda de luces', radio: 1.5, ancho: 3.0, fondo: 0.2, alto: 2.4, separacion: 0.5, confort: 1,
    texto: 'Un hilo de farolitos de papel y vidrio para colgar de una pared o del alero. De noche hace la casa más cálida. El fondo mira a +Z.',
    pide: { tabla: 2, lana: 1 },
    arma(c) {
      for (const sx of [-1, 1]) cil(c, 0.02, 0.02, 0.06, [sx * 1.45, 2.3, 0.04], HIERRO, { tipo: 0, lados: 6, rot: [Math.PI / 2, 0, 0] });
      const COLORES = ['#f2c14a', '#e8845a', '#f2ece0', '#d07aa8', '#9fd0b0', '#f2c14a'];
      const N = 12, y = (u) => 2.3 - 0.42 * (1 - (2 * u - 1) ** 2);
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N, x0 = -1.45 + 2.9 * u0, x1 = -1.45 + 2.9 * u1, y0 = y(u0), y1 = y(u1);
        const largo = Math.hypot(x1 - x0, y1 - y0);
        tira(c, 0.012, largo, 0.012, [x0, y0, 0.04], [x1 - x0, y1 - y0, 0], HIERRO, { tipo: 0, variar: 0.04 });
        const um = (u0 + u1) / 2;
        c.agregar(new THREE.IcosahedronGeometry(0.06, 1), { color: COLORES[i % 6], tipo: 4, variar: 0.04, matriz: matriz([-1.45 + 2.9 * um, y(um) - 0.08, 0.04], [0, 0, 0], [1, 1.25, 1]) });
        cil(c, 0.012, 0.012, 0.03, [-1.45 + 2.9 * um, y(um) - 0.015, 0.04], BRONCE, { tipo: 0, lados: 5 });
      }
    },
  },
  {
    ...base, id: 'telar-rueca', nombre: 'Telar y rueca', radio: 1.2, ancho: 1.7, fondo: 1.0, alto: 1.55, separacion: 1.2, confort: 2,
    texto: 'Un telar de pie con una manta a medio tejer y, al lado, una rueca con su rueda y una canasta de lana. Para hilar y tejer en casa, al calor del fuego.',
    pide: { tabla: 9, tronco: 2, lana: 3 },
    fisica(h) { h.segmento(-0.5, 0.3, -0.1, 0.3, 0.16, 0, 1.55); h.circulo(0.5, 0, 0.3, 0, 1.0); },
    arma(c) {
      // el telar: dos postes, dos vigas, los hilos y lo tejido
      for (const sx of [-0.65, -0.05]) caja(c, 0.08, 1.5, 0.1, [sx, 0.75, 0.3], MADERA_OSCURA, { tipo: 0 });
      for (const sx of [-0.65, -0.05]) caja(c, 0.1, 0.06, 0.4, [sx, 0.03, 0.3], MADERA_OSCURA, { tipo: 0 });
      caja(c, 0.76, 0.07, 0.08, [-0.35, 1.45, 0.3], MADERA, { tipo: 0 });
      caja(c, 0.76, 0.07, 0.08, [-0.35, 0.45, 0.3], MADERA, { tipo: 0 });
      for (let i = 0; i < 12; i++) caja(c, 0.008, 0.95, 0.008, [-0.6 + i * 0.05, 0.95, 0.3], '#d8d0c0', { variar: 0.05 });
      caja(c, 0.58, 0.42, 0.02, [-0.35, 0.68, 0.3], LANA_ROJA, { variar: 0.1 });
      for (let i = 0; i < 4; i++) caja(c, 0.58, 0.035, 0.022, [-0.35, 0.52 + i * 0.1, 0.3], i % 2 ? MIEL : '#4a6a7a', { variar: 0.08 });
      caja(c, 0.7, 0.04, 0.05, [-0.35, 1.1, 0.26], TABLA_CLARA);   // el peine
      cil(c, 0.015, 0.015, 0.66, [-0.35, 0.99, 0.22], MADERA, { tipo: 0, lados: 5, rot: [0, 0, Math.PI / 2] });
      // la rueca: la rueda de rayos, el banco y el huso
      cil(c, 0.31, 0.31, 0.03, [0.5, 0.52, 0.02], MADERA_OSCURA, { tipo: 0, lados: 20, rot: [Math.PI / 2, 0, 0] });
      cil(c, 0.27, 0.27, 0.04, [0.5, 0.52, 0.02], TABLA, { lados: 20, rot: [Math.PI / 2, 0, 0] });
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; caja(c, 0.014, 0.25, 0.014, [0.5 + Math.sin(a) * 0.13, 0.52 + Math.cos(a) * 0.13, 0.02], MADERA, { tipo: 0, rot: [0, 0, -a] }); }
      cil(c, 0.04, 0.04, 0.12, [0.5, 0.52, 0.02], MADERA_OSCURA, { tipo: 0, lados: 8, rot: [Math.PI / 2, 0, 0] });
      caja(c, 0.62, 0.05, 0.14, [0.5, 0.2, 0.02], MADERA_OSCURA, { tipo: 0 });
      for (const sx of [-1, 1]) caja(c, 0.05, 0.4, 0.05, [0.5 + sx * 0.2, 0.2, 0.02], MADERA_OSCURA, { tipo: 0, rot: [0, 0, -sx * 0.3] });
      caja(c, 0.05, 0.4, 0.06, [0.5, 0.35, 0.02], MADERA, { tipo: 0 });
      caja(c, 0.05, 0.05, 0.4, [0.5, 0.62, 0.02], MADERA_OSCURA, { tipo: 0 });
      caja(c, 0.4, 0.04, 0.06, [0.7, 0.72, -0.25], MADERA, { tipo: 0, rot: [0, 0.5, 0] });
      c.agregar(new THREE.IcosahedronGeometry(0.09, 1), { color: '#f2ece0', tipo: 4, variar: 0.08, matriz: matriz([0.78, 0.76, -0.3], [0, 0, 0], [1, 1.3, 1]) });   // el vellón en la rueca
      // la canasta de lana
      cil(c, 0.17, 0.14, 0.17, [0.4, 0.09, -0.35], '#a98456', { lados: 10 });
      for (let i = 0; i < 3; i++) c.agregar(new THREE.IcosahedronGeometry(0.09, 1), { color: ['#9b3a2e', '#4a6a7a', MIEL][i], tipo: 4, variar: 0.08, matriz: matriz([0.35 + i * 0.07, 0.22, -0.35 + (i % 2) * 0.05]) });
    },
  },
  {
    ...base, id: 'hamaca', nombre: 'Hamaca paraguaya', radio: 1.8, ancho: 3.2, fondo: 1.0, alto: 1.75, separacion: 1.2, confort: 3,
    texto: 'Una hamaca de lana tejida a rayas, con flecos y almohadón, colgada de dos postes. Con un par de postes en el patio, la siesta está servida.',
    pide: { tronco: 3, tabla: 2, lana: 5 },
    fisica(h) { h.circulo(-1.45, 0, 0.12, 0, 1.75); h.circulo(1.45, 0, 0.12, 0, 1.75); h.segmento(-0.5, 0, 0.5, 0, 0.32, 0.55, 1.1); },
    arma(c) {
      for (const sx of [-1, 1]) {
        cil(c, 0.07, 0.09, 1.75, [sx * 1.45, 0.875, 0], MADERA_OSCURA, { tipo: 0, lados: 8 });
        caja(c, 0.4, 0.07, 0.5, [sx * 1.45, 0.035, 0], MADERA_OSCURA, { tipo: 0 });
        caja(c, 0.06, 0.55, 0.06, [sx * 1.45, 0.3, 0.3], MADERA_OSCURA, { tipo: 0, rot: [0.5, 0, 0] });
        caja(c, 0.06, 0.55, 0.06, [sx * 1.45, 0.3, -0.3], MADERA_OSCURA, { tipo: 0, rot: [-0.5, 0, 0] });
        cil(c, 0.04, 0.04, 0.1, [sx * 1.38, 1.45, 0], HIERRO, { tipo: 0, lados: 6, rot: [0, 0, Math.PI / 2] });
      }
      // el cuerpo de la hamaca, una curva de paños a rayas
      const N = 10, A = 1.3, y = (x) => 1.4 - 0.7 * (1 - (x / A) ** 2);
      for (let i = 0; i < N; i++) {
        const x = -A + (i + 0.5) * 2 * A / N, pend = 0.7 * 2 * x / (A * A);
        caja(c, 2 * A / N + 0.03, 0.035, 0.6, [x, y(x) - 0.02, 0], i % 2 ? MIEL : LANA_ROJA, { variar: 0.08, rot: [0, 0, Math.atan(pend)] });
      }
      // los flecos, a lo largo de los dos bordes
      for (let i = 0; i < 10; i++) { const x = -A + (i + 0.5) * 2 * A / N; for (const sz of [-1, 1]) caja(c, 0.02, 0.1, 0.015, [x, y(x) - 0.08, sz * 0.3], i % 2 ? MIEL : LANA_ROJA, { variar: 0.1 }); }
      // las sogas hasta el gancho y el almohadón
      for (const sx of [-1, 1]) tira(c, 0.025, Math.hypot(0.1, 0.0), 0.025, [sx * 1.3, 1.41, 0], [sx * 0.08, 0.04, 0], '#d8d0c0', { variar: 0.05 });
      c.agregar(new THREE.BoxGeometry(0.4, 0.1, 0.3), { color: '#4a6a7a', tipo: 4, variar: 0.1, matriz: matriz([-0.7, y(-0.7) + 0.06, 0], [0, 0.1, -0.35]) });
    },
  },
];
