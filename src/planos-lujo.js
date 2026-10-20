// 4.2: las piezas de lujo. Cuestan, además de los materiales, pesos (`pesos: N` junto a `pide`): son para darle uso a la plata que se
// junta con los jornales, los pedidos y el abastecimiento. Sirven también de plantilla para agregar piezas con precio (la receta y la
// escala de precios están en PRECIOS_CONSTRUCCION.md):
//   · vitrina de roble ($4.500), alfombra tejida grande ($2.400), araña de velas ($6.500), reloj de pie ($9.000), fuente de piedra ($14.000);
//   · mismas reglas que planos-muebles.js: el frente mira a -z y el fondo a +z; el origen es el centro, sobre el piso; sólo tipo 0 y 4;
//     la colisión sale de `fisica(h)`; sólo en el Relax (el Desafío no tiene economía ni lana);
//   · sin luces dinámicas (las llamas de la araña son sólo color) y geometría moderada: ninguna pasa de ~900 triángulos
//     (la mediana de las piezas del juego es de ~250 y el 90 % no pasa de ~760).
// El reloj de pie se usa con E y dice lo mismo que el de pared (main.js).
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { AYUDAS_MUEBLES } from './planos-muebles.js';

const { caja, cil, puerta, hs, TABLA_CLARA, PIEDRA, HIERRO, BRONCE, PAPEL, VIDRIO } = AYUDAS_MUEBLES;
const ROBLE = '#8a6a43';
const ROBLE_OSCURO = '#5d4529';
const base = { soloRelax: true, apoyaEnPlataforma: true, pieza: true };

// Lo que se usa con E (main.js lo suma a las obras que trabajan): el aviso que aparece al acercarse
export const LUJO_QUE_SE_USA = { 'reloj-pie': 'Mirar el reloj de pie' };

export const PIEZAS_LUJO = [
  // ================================================================ la sala
  {
    ...base, id: 'vitrina-roble', nombre: 'Vitrina de roble', categoria: 'mobiliario', radio: 0.9, ancho: 1.2, fondo: 0.5, alto: 2.15, separacion: 1.0, confort: 3,
    texto: 'Una vitrina de roble macizo con cornisa labrada, dos puertas de vidrio, tres estantes y abajo un armario con puertas de tablero. Adentro, la vajilla buena. Contra la pared, de espaldas a +Z.',
    pide: { tabla: 18, tronco: 3, piedra: 2 }, pesos: 4500,
    fisica(h) { h.segmento(-0.45, 0, 0.45, 0, 0.22, 0, 2.15); },
    arma(c) {
      caja(c, 1.2, 0.1, 0.5, [0, 0.05, 0], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 1.14, 0.7, 0.44, [0, 0.45, 0.02], ROBLE);
      puerta(c, -0.285, 0.46, -0.215, 0.54, 0.6, ROBLE); puerta(c, 0.285, 0.46, -0.215, 0.54, 0.6, ROBLE);
      caja(c, 1.18, 0.05, 0.48, [0, 0.82, 0.01], ROBLE_OSCURO, { tipo: 0 });
      for (const sx of [-1, 1]) caja(c, 0.06, 1.2, 0.44, [sx * 0.56, 1.45, 0.02], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 1.1, 1.22, 0.03, [0, 1.45, 0.22], '#4d3a24');
      for (const y of [1.15, 1.5, 1.8]) caja(c, 1.06, 0.03, 0.4, [0, y, 0.02], TABLA_CLARA);
      // las dos puertas de vidrio: el marco y el vidrio
      for (const sx of [-1, 1]) {
        caja(c, 0.04, 1.14, 0.035, [sx * 0.5, 1.45, -0.2], ROBLE_OSCURO, { tipo: 0 });
        caja(c, 0.04, 1.14, 0.035, [sx * 0.03, 1.45, -0.2], ROBLE_OSCURO, { tipo: 0 });
        caja(c, 0.47, 1.06, 0.01, [sx * 0.265, 1.45, -0.205], VIDRIO, { variar: 0.03 });
        caja(c, 0.025, 0.1, 0.03, [sx * 0.07, 1.45, -0.225], BRONCE, { tipo: 0 });
      }
      caja(c, 1.06, 0.04, 0.035, [0, 2.0, -0.2], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 1.06, 0.04, 0.035, [0, 0.88, -0.2], ROBLE_OSCURO, { tipo: 0 });
      // la cornisa labrada y un copete en el medio
      caja(c, 1.2, 0.1, 0.5, [0, 2.07, 0.0], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 1.26, 0.04, 0.54, [0, 2.13, 0.0], ROBLE, { tipo: 0 });
      caja(c, 0.3, 0.06, 0.04, [0, 2.1, -0.265], ROBLE);
      cil(c, 0.05, 0.05, 0.03, [0, 2.1, -0.285], BRONCE, { tipo: 0, lados: 8, rot: [Math.PI / 2, 0, 0] });
      // la vajilla buena: platos parados, copas, una sopera y frascos
      for (let i = 0; i < 4; i++) cil(c, 0.11, 0.11, 0.012, [-0.36 + i * 0.1, 1.27, 0.14], PAPEL, { lados: 8, rot: [Math.PI / 2 - 0.25, 0, 0], variar: 0.04 });
      for (let i = 0; i < 4; i++) cil(c, 0.028, 0.02, 0.1, [0.12 + i * 0.09, 1.2, 0.0], '#cfc8b4', { lados: 6, variar: 0.04 });
      cil(c, 0.13, 0.1, 0.12, [-0.25, 1.58, 0.02], '#9fb4c0', { lados: 8, variar: 0.04 });
      cil(c, 0.05, 0.05, 0.05, [-0.25, 1.67, 0.02], '#9fb4c0', { lados: 6 });
      for (let i = 0; i < 3; i++) cil(c, 0.035, 0.035, 0.14 + hs(i) * 0.05, [0.1 + i * 0.13, 1.58, 0.02], ['#6a8a5a', '#c8a04a', '#8a4a5a'][i], { lados: 6 });
      cil(c, 0.09, 0.07, 0.15, [-0.3, 1.89, 0.0], '#a8573a', { lados: 8 });
      cil(c, 0.1, 0.1, 0.012, [0.28, 1.91, 0.12], BRONCE, { tipo: 0, lados: 8, rot: [Math.PI / 2 - 0.15, 0, 0] });
    },
  },
  {
    ...base, id: 'reloj-pie', nombre: 'Reloj de pie', categoria: 'mobiliario', radio: 0.5, ancho: 0.6, fondo: 0.4, alto: 2.15, separacion: 0.6, confort: 2, alcanceE: 2.2,
    texto: 'Un reloj de caja alto, de roble, con esfera de bronce, péndulo y dos pesas. Con E te dice la hora y el día, lo mismo que el de pared y el de la plaza. Contra la pared, de espaldas a +Z.',
    pide: { tabla: 14, tronco: 2, piedra: 2 }, pesos: 9000,
    fisica(h) { h.segmento(-0.08, 0, 0.08, 0, 0.2, 0, 2.15); },
    arma(c) {
      // el pie y el cuerpo
      caja(c, 0.56, 0.16, 0.38, [0, 0.08, 0], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 0.46, 0.1, 0.32, [0, 0.21, 0], ROBLE);
      caja(c, 0.4, 1.0, 0.28, [0, 0.76, 0.01], ROBLE);
      caja(c, 0.34, 0.9, 0.012, [0, 0.76, -0.138], ROBLE_OSCURO, { variar: 0.06 });
      // la ventana del péndulo (vidrio) y lo que se ve adentro
      caja(c, 0.24, 0.62, 0.012, [0, 0.82, -0.146], VIDRIO, { variar: 0.03 });
      cil(c, 0.006, 0.006, 0.55, [0, 0.9, -0.1], BRONCE, { tipo: 0, lados: 4 });
      cil(c, 0.06, 0.06, 0.016, [0, 0.62, -0.1], BRONCE, { tipo: 0, lados: 14, rot: [Math.PI / 2, 0, 0] });
      for (const x of [-0.07, 0.07]) { cil(c, 0.004, 0.004, 0.5, [x, 0.9, -0.08], HIERRO, { tipo: 0, lados: 4 }); cil(c, 0.026, 0.026, 0.12, [x, 0.55 + (x > 0 ? 0.08 : 0), -0.08], HIERRO, { tipo: 0, lados: 8 }); }
      // la cintura y la cabeza con la esfera
      caja(c, 0.46, 0.06, 0.34, [0, 1.29, 0.01], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 0.42, 0.6, 0.3, [0, 1.62, 0.01], ROBLE);
      cil(c, 0.17, 0.17, 0.02, [0, 1.63, -0.15], '#efe8d8', { lados: 24, rot: [Math.PI / 2, 0, 0] });
      cil(c, 0.185, 0.185, 0.014, [0, 1.63, -0.146], BRONCE, { tipo: 0, lados: 24, rot: [Math.PI / 2, 0, 0] });
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2;
        caja(c, 0.014, k % 3 === 0 ? 0.045 : 0.026, 0.008, [Math.sin(a) * 0.135, 1.63 + Math.cos(a) * 0.135, -0.162], '#2a2622', { tipo: 0, rot: [0, 0, -a] });
      }
      caja(c, 0.016, 0.1, 0.008, [-0.035, 1.675, -0.166], '#1f1c19', { tipo: 0, rot: [0, 0, 0.9] });
      caja(c, 0.012, 0.14, 0.008, [0.05, 1.7, -0.168], '#1f1c19', { tipo: 0, rot: [0, 0, -0.95] });
      cil(c, 0.016, 0.016, 0.014, [0, 1.63, -0.172], BRONCE, { tipo: 0, lados: 8, rot: [Math.PI / 2, 0, 0] });
      // el remate: cornisa, frontón y una piña de bronce
      caja(c, 0.5, 0.06, 0.36, [0, 1.95, 0.01], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 0.44, 0.1, 0.32, [0, 2.03, 0.01], ROBLE);
      caja(c, 0.2, 0.06, 0.2, [0, 2.11, 0.01], ROBLE_OSCURO, { tipo: 0 });
      cil(c, 0.03, 0.045, 0.06, [0, 2.15, 0.01], BRONCE, { tipo: 0, lados: 8 });
    },
  },
  {
    ...base, id: 'alfombra-tejida-grande', nombre: 'Alfombra tejida grande', categoria: 'mobiliario', radio: 1.7, ancho: 3.0, fondo: 2.0, alto: 0.05, separacion: 0.3, confort: 3,
    texto: 'Una alfombra grande de lana tejida en el telar, con guardas de rombos y flecos en las puntas. Tapa casi todo el piso de una sala y se pisa sin molestar: no choca.',
    pide: { lana: 8 }, pesos: 2400,
    arma(c) {
      const ROJO = '#7b3b32', CREMA = '#d6c6a0', OCRE = '#b98a3e', AZUL = '#3f5a6c';
      caja(c, 2.9, 0.03, 1.9, [0, 0.02, 0], ROJO, { variar: 0.05 });
      // la guarda de afuera y la de adentro
      caja(c, 2.74, 0.012, 0.07, [0, 0.042, -0.8], CREMA, { variar: 0.05 }); caja(c, 2.74, 0.012, 0.07, [0, 0.042, 0.8], CREMA, { variar: 0.05 });
      caja(c, 0.07, 0.012, 1.66, [-1.33, 0.042, 0], CREMA, { variar: 0.05 }); caja(c, 0.07, 0.012, 1.66, [1.33, 0.042, 0], CREMA, { variar: 0.05 });
      caja(c, 2.3, 0.012, 0.05, [0, 0.044, -0.56], AZUL, { variar: 0.05 }); caja(c, 2.3, 0.012, 0.05, [0, 0.044, 0.56], AZUL, { variar: 0.05 });
      // los rombos del campo: tres filas de siete
      for (let f = 0; f < 3; f++) for (let i = 0; i < 7; i++) {
        const x = -1.02 + i * 0.34 + (f % 2) * 0.0, z = -0.3 + f * 0.3;
        caja(c, 0.2, 0.014, 0.2, [x, 0.046, z], (i + f) % 2 ? OCRE : CREMA, { variar: 0.06, rot: [0, Math.PI / 4, 0] });
        caja(c, 0.07, 0.016, 0.07, [x, 0.048, z], AZUL, { variar: 0.04, rot: [0, Math.PI / 4, 0] });
      }
      // los flecos de las dos puntas
      for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) caja(c, 0.1, 0.012, 0.045, [sx * 1.5, 0.014, -0.8 + i * 0.2], CREMA, { variar: 0.05 });
    },
  },
  {
    ...base, id: 'arana-velas', nombre: 'Araña de velas', categoria: 'mobiliario', radio: 0.55, ancho: 0.95, fondo: 0.95, alto: 2.45, separacion: 0.9, confort: 3,
    texto: 'Una araña de hierro forjado con ocho velas, que se cuelga de una cadena larga. Sin techo no hay de dónde: ponela adentro de una casa. No da luz propia, es de adorno, y no choca.',
    pide: { tabla: 4, piedra: 6, tronco: 1 }, pesos: 6500,
    arma(c) {
      const CERA = '#e6dcc0', LLAMA = '#ffcf6a';
      // la cadena y el florón del techo
      cil(c, 0.012, 0.012, 0.5, [0, 2.2, 0], HIERRO, { tipo: 0, lados: 5 });
      cil(c, 0.07, 0.04, 0.05, [0, 2.43, 0], HIERRO, { tipo: 0, lados: 6 });
      for (let k = 0; k < 3; k++) cil(c, 0.022, 0.022, 0.03, [0, 2.1 + k * 0.12, 0], BRONCE, { tipo: 0, lados: 5 });
      // el aro de afuera y el de adentro, y el eje que baja hasta la bellota
      c.agregar(new THREE.TorusGeometry(0.4, 0.018, 4, 16), { color: HIERRO, tipo: 0, variar: 0.04, matriz: matriz([0, 1.9, 0], [Math.PI / 2, 0, 0]) });
      c.agregar(new THREE.TorusGeometry(0.2, 0.014, 4, 10), { color: HIERRO, tipo: 0, variar: 0.04, matriz: matriz([0, 1.98, 0], [Math.PI / 2, 0, 0]) });
      cil(c, 0.025, 0.025, 0.4, [0, 1.8, 0], HIERRO, { tipo: 0, lados: 6 });
      cil(c, 0.001, 0.05, 0.12, [0, 1.58, 0], BRONCE, { tipo: 0, lados: 8 });
      cil(c, 0.05, 0.05, 0.05, [0, 1.74, 0], BRONCE, { tipo: 0, lados: 6 });
      // ocho brazos hasta el aro, cada uno con su plato, su vela y su llama (sólo color)
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2, s = Math.sin(a), co = Math.cos(a);
        caja(c, 0.02, 0.02, 0.36, [s * 0.3, 1.94, co * 0.3], HIERRO, { tipo: 0, rot: [0, a, 0] });
        cil(c, 0.055, 0.04, 0.02, [s * 0.4, 1.93, co * 0.4], BRONCE, { tipo: 0, lados: 5 });
        cil(c, 0.022, 0.022, 0.13 - (k % 3) * 0.015, [s * 0.4, 2.0, co * 0.4], CERA, { lados: 5, variar: 0.05 });
        c.agregar(new THREE.ConeGeometry(0.014, 0.05, 4), { color: LLAMA, tipo: 4, variar: 0.04, matriz: matriz([s * 0.4, 2.1 - (k % 3) * 0.015, co * 0.4]) });
      }
    },
  },

  // ================================================================ el patio
  {
    ...base, ocupaSuelo: true, id: 'fuente-piedra', nombre: 'Fuente de piedra', categoria: 'exterior', radio: 1.5, ancho: 2.4, fondo: 2.4, alto: 1.5, separacion: 1.2, confort: 3,
    texto: 'Una fuente de piedra de dos tazas, con el agua quieta abajo y un chorro tallado arriba. Para el medio de un patio o el fondo de un jardín. Pide un lugar casi llano.',
    pide: { piedra: 36, tabla: 2 }, pesos: 14000, pendienteMax: 0.22, distSendero: 0.4,
    fisica(h) { h.circulo(0, 0, 1.2, 0, 1.4); },
    arma(c) {
      const AGUA = '#6f98a8', PIEDRA_CLARA = '#9a9488';
      // la base enterrada un poco, y el borde de la pileta: doce bloques
      cil(c, 1.1, 1.14, 0.22, [0, -0.01, 0], PIEDRA, { lados: 16, variar: 0.1 });
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2;
        caja(c, 0.62, 0.34, 0.24, [Math.sin(a) * 1.0, 0.27, Math.cos(a) * 1.0], k % 2 ? PIEDRA : PIEDRA_CLARA, { variar: 0.14, rot: [0, a, 0] });
      }
      cil(c, 0.96, 0.96, 0.02, [0, 0.38, 0], PIEDRA, { lados: 16, variar: 0.06 });
      // el agua quieta (un disco, sin movimiento)
      cil(c, 0.95, 0.95, 0.02, [0, 0.4, 0], AGUA, { lados: 16, variar: 0.03 });
      // el pie, la taza de arriba y el chorro tallado
      cil(c, 0.3, 0.4, 0.16, [0, 0.47, 0], PIEDRA, { lados: 10 });
      cil(c, 0.2, 0.28, 0.6, [0, 0.82, 0], PIEDRA_CLARA, { lados: 10, variar: 0.08 });
      cil(c, 0.62, 0.3, 0.2, [0, 1.2, 0], PIEDRA, { lados: 14, variar: 0.08 });
      cil(c, 0.54, 0.54, 0.02, [0, 1.3, 0], AGUA, { lados: 14, variar: 0.03 });
      cil(c, 0.06, 0.1, 0.12, [0, 1.35, 0], PIEDRA_CLARA, { lados: 8 });
      c.agregar(new THREE.IcosahedronGeometry(0.1, 0), { color: PIEDRA_CLARA, tipo: 4, variar: 0.08, matriz: matriz([0, 1.46, 0]) });
      // los hilos de agua que caen del borde de la taza de arriba a la pileta: seis tiras finas, quietas
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2 + 0.3;
        caja(c, 0.03, 0.82, 0.02, [Math.sin(a) * 0.68, 0.83, Math.cos(a) * 0.68], '#a9c7d2', { variar: 0.03, rot: [0, a, 0] });
      }
    },
  },
];
