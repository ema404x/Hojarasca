// 3.8.8: más mobiliario para la casa (elegido por el usuario): en el dormitorio, el baúl, la mesa de luz, el ropero y la cuna; en la
// sala, el sillón, la mesa larga de comedor, el aparador y el librero; en la cocina y el trabajo, la mesada con pileta, el barril de
// agua, el escritorio y el perchero con botas; y de decoración, el reloj de pared, el almanaque de pared, los cuadros, las cortinas y la
// planta en maceta. `construccion.js` los suma a las piezas con una línea (PIEZAS.push(...)), igual que la cocina.
//
// Las reglas de siempre de las piezas:
//   · el frente mira a -z y el fondo (la pared, el respaldo) a +z; el origen es el centro, sobre el piso donde se apoya;
//   · sólo tipo 0 y 4 (madera, piedra, hierro, barro);
//   · la colisión sale de `fisica(h)`, en coordenadas locales (lo que se cuelga de la pared no choca);
//   · sólo en el Relax (son para hacer casa): algunas piden lana (el tejido), que en el Desafío no hay.
// Lo que se usa con E es el reloj y el almanaque de pared (muestran lo mismo que los de la aldea: ver reloj-almanaque.js).
import * as THREE from 'three';
import { matriz } from './geometria.js';

const MADERA = '#6b5238';
const MADERA_OSCURA = '#4a3b2c';
const TABLA = '#8a6b4a';
const TABLA_CLARA = '#a98456';
const PIEDRA = '#7d766c';
const HIERRO = '#34312e';
const BRONCE = '#9a7a3a';
const PAPEL = '#e8e0c8';
const VIDRIO = '#91a7a3';

const hs = (k) => { const v = Math.sin(k * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
const caja = (c, w, h, d, [x, y, z], color, o = {}) => c.agregar(new THREE.BoxGeometry(w, h, d), {
  color, tipo: o.tipo ?? 4, variar: o.variar ?? 0.1, matriz: matriz([x, y, z], o.rot),
});
const cil = (c, rt, rb, h, [x, y, z], color, o = {}) => c.agregar(new THREE.CylinderGeometry(rt, rb, h, o.lados ?? 10), {
  color, tipo: o.tipo ?? 4, variar: o.variar ?? 0.08, matriz: matriz([x, y, z], o.rot),
});
// una tira (una hoja, un tallo) que sale de `base` hacia `dir` y mide `largo`
const EJE_Y = new THREE.Vector3(0, 1, 0);
const tira = (c, ancho, largo, grueso, base, dir, color, o = {}) => {
  const v = new THREE.Vector3(...dir).normalize();
  const pos = new THREE.Vector3(...base).addScaledVector(v, largo / 2);
  c.agregar(new THREE.BoxGeometry(ancho, largo, grueso), {
    color, tipo: o.tipo ?? 4, variar: o.variar ?? 0.1, matriz: new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromUnitVectors(EJE_Y, v), new THREE.Vector3(1, 1, 1)),
  });
};
// los cuatro pies de un mueble
const pies = (c, ancho, fondo, alto, color = MADERA_OSCURA, grosor = 0.07) => {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, grosor, alto, grosor, [sx * (ancho / 2 - grosor / 2), alto / 2, sz * (fondo / 2 - grosor / 2)], color, { tipo: 0 });
};
// una puerta de mueble: la tabla, un marco más claro y el tirador
const puerta = (c, x, y, z, w, h, color = TABLA) => {
  caja(c, w, h, 0.03, [x, y, z], color);
  caja(c, w - 0.1, h - 0.1, 0.012, [x, y, z - 0.014], TABLA_CLARA, { variar: 0.06 });
  caja(c, 0.025, 0.1, 0.03, [x + (x < 0 ? 1 : -1) * (w / 2 - 0.06), y, z - 0.03], HIERRO, { tipo: 0 });
};

export const PIEZAS_MUEBLES = [
  // ================================================================ el dormitorio
  {
    id: 'baul', nombre: 'Baúl de tablas', pieza: true, radio: 0.75, ancho: 0.95, fondo: 0.55, alto: 0.62, separacion: 1.0,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1,
    texto: 'Un baúl de tablas con tapa abovedada, flejes de hierro y herrojo. Se pone al pie de la cama.',
    pide: { tabla: 6, tronco: 1 },
    fisica(h) { h.segmento(-0.2, 0, 0.2, 0, 0.27, 0, 0.62); },
    arma(c) {
      caja(c, 0.9, 0.4, 0.52, [0, 0.23, 0], TABLA);
      caja(c, 0.94, 0.12, 0.56, [0, 0.49, 0], TABLA_CLARA);
      caja(c, 0.88, 0.07, 0.5, [0, 0.57, 0], TABLA, { variar: 0.12 });
      for (const x of [-0.36, 0, 0.36]) caja(c, 0.05, 0.64 - 0.04, 0.58, [x, 0.32, 0], HIERRO, { tipo: 0, variar: 0.05 });
      caja(c, 0.08, 0.12, 0.03, [0, 0.46, -0.29], HIERRO, { tipo: 0 });
      pies(c, 0.9, 0.52, 0.06);
    },
  },
  {
    id: 'mesa-luz', nombre: 'Mesa de luz', pieza: true, radio: 0.5, ancho: 0.5, fondo: 0.4, alto: 0.78, separacion: 0.5,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1,
    texto: 'Una mesita con un cajón y un estante abajo, con una vela y un libro. Junto a la cama, para dejar lo de la noche.',
    pide: { tabla: 3 },
    fisica(h) { h.circulo(0, 0, 0.24, 0, 0.62); },
    arma(c) {
      caja(c, 0.5, 0.04, 0.4, [0, 0.58, 0], TABLA);
      caja(c, 0.44, 0.15, 0.34, [0, 0.47, 0], TABLA_CLARA);
      caja(c, 0.36, 0.1, 0.012, [0, 0.47, -0.18], TABLA, { variar: 0.06 });
      cil(c, 0.018, 0.018, 0.03, [0, 0.47, -0.19], BRONCE, { rot: [Math.PI / 2, 0, 0] });
      caja(c, 0.44, 0.03, 0.34, [0, 0.2, 0], TABLA);
      pies(c, 0.5, 0.4, 0.58, MADERA_OSCURA, 0.05);
      // la vela en su platito y un libro
      cil(c, 0.07, 0.07, 0.015, [0.1, 0.61, 0.02], BRONCE, { lados: 12 });
      cil(c, 0.022, 0.022, 0.13, [0.1, 0.685, 0.02], PAPEL, { lados: 8 });
      c.agregar(new THREE.ConeGeometry(0.014, 0.04, 6), { color: '#ffd890', tipo: 0, variar: 0.02, matriz: matriz([0.1, 0.77, 0.02]) });
      caja(c, 0.16, 0.035, 0.12, [-0.12, 0.62, 0], '#7a2f2a', { variar: 0.1 });
    },
  },
  {
    id: 'ropero', nombre: 'Ropero de tablas', pieza: true, radio: 0.9, ancho: 1.25, fondo: 0.6, alto: 1.95, separacion: 1.4,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 2,
    texto: 'Alto, con dos puertas y una cornisa. Contra la pared del cuarto, para guardar la ropa de abrigo. El fondo mira a +Z.',
    pide: { tabla: 12, tronco: 2 },
    fisica(h) { h.segmento(-0.34, 0, 0.34, 0, 0.3, 0, 1.95); },
    arma(c) {
      caja(c, 1.2, 1.8, 0.52, [0, 0.99, 0.02], '#6a5238');
      caja(c, 1.28, 0.08, 0.6, [0, 1.92, 0.02], MADERA_OSCURA, { tipo: 0 });
      caja(c, 1.24, 0.1, 0.56, [0, 0.12, 0.02], MADERA_OSCURA, { tipo: 0 });
      puerta(c, -0.3, 1.0, -0.255, 0.56, 1.6);
      puerta(c, 0.3, 1.0, -0.255, 0.56, 1.6);
      pies(c, 1.24, 0.56, 0.08, MADERA_OSCURA, 0.1);
    },
  },
  {
    id: 'cuna', nombre: 'Cuna de madera', pieza: true, radio: 0.8, ancho: 0.65, fondo: 1.1, alto: 0.78, separacion: 0.9,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1,
    texto: 'Una cuna de barrotes torneados sobre dos balancines, con su colchón y una frazada tejida. Para cuando haya hijos en la casa.',
    pide: { tabla: 6, lana: 1 },
    fisica(h) { h.segmento(0, -0.23, 0, 0.23, 0.32, 0.02, 0.8); },
    arma(c) {
      // la cabecera (alta, atrás) y los pies (más bajos, adelante)
      caja(c, 0.6, 0.62, 0.05, [0, 0.4, 0.49], TABLA_CLARA);
      caja(c, 0.6, 0.46, 0.05, [0, 0.33, -0.49], TABLA_CLARA);
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 8; i++) cil(c, 0.012, 0.012, 0.36, [sx * 0.29, 0.43, -0.4 + i * 0.115], TABLA, { lados: 5, tipo: 0 });
        caja(c, 0.04, 0.04, 1.0, [sx * 0.29, 0.62, 0], MADERA_OSCURA, { tipo: 0 });
        caja(c, 0.04, 0.04, 1.0, [sx * 0.29, 0.25, 0], MADERA_OSCURA, { tipo: 0 });
        // el balancín: una tabla curva bajo cada costado
        caja(c, 0.05, 0.05, 1.1, [sx * 0.29, 0.07, 0], MADERA_OSCURA, { tipo: 0 });
        for (const sz of [-1, 1]) caja(c, 0.05, 0.14, 0.05, [sx * 0.29, 0.15, sz * 0.42], MADERA_OSCURA, { tipo: 0 });
      }
      caja(c, 0.52, 0.08, 0.9, [0, 0.31, 0], '#c9bfa0', { variar: 0.05 });
      caja(c, 0.5, 0.05, 0.6, [0, 0.37, -0.12], '#c8a04a', { variar: 0.08 });
      caja(c, 0.34, 0.05, 0.22, [0, 0.38, 0.32], PAPEL, { variar: 0.04 });
    },
  },
  // ================================================================ la sala y el comedor
  {
    id: 'sillon', nombre: 'Sillón de lana', pieza: true, radio: 0.95, ancho: 1.22, fondo: 0.96, alto: 0.98, separacion: 1.1,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 3,
    texto: 'Un sillón de armazón de madera con almohadones de lana, apoyabrazos y respaldo alto. Junto al fuego es lo más cómodo de la casa.',
    pide: { tabla: 8, lana: 3 },
    fisica(h) { h.segmento(-0.15, 0, 0.15, 0, 0.45, 0, 0.98); },
    arma(c) {
      const LANA = '#7b4a3a', LANA2 = '#8a5644';
      caja(c, 1.0, 0.22, 0.8, [0, 0.19, 0], MADERA);
      pies(c, 1.0, 0.8, 0.1, MADERA_OSCURA, 0.09);
      caja(c, 0.76, 0.16, 0.66, [0, 0.38, -0.02], LANA, { variar: 0.12 });
      caja(c, 1.0, 0.56, 0.16, [0, 0.66, 0.36], LANA2, { variar: 0.12 });
      caja(c, 0.82, 0.36, 0.1, [0, 0.62, 0.27], LANA, { variar: 0.1 });
      for (const sx of [-1, 1]) {
        caja(c, 0.14, 0.34, 0.8, [sx * 0.5, 0.45, 0], MADERA);
        caja(c, 0.2, 0.08, 0.84, [sx * 0.5, 0.64, 0], LANA2, { variar: 0.1 });
      }
      // una manta tejida sobre el respaldo
      caja(c, 0.62, 0.05, 0.5, [-0.18, 0.7, 0.28], '#c8a04a', { rot: [0.9, 0, 0.1], variar: 0.1 });
      caja(c, 0.4, 0.1, 0.1, [0.25, 0.5, -0.02], '#4a6a7a', { rot: [0, 0.3, 0], variar: 0.1 });
    },
  },
  {
    id: 'mesa-larga', nombre: 'Mesa larga de comedor', pieza: true, radio: 1.7, ancho: 2.6, fondo: 1.7, alto: 1.05, separacion: 2.4,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 2,
    texto: 'Una mesa de tablas gruesas de dos metros y medio, con un banco largo de cada lado. Entran ocho a comer, o diez apretados.',
    pide: { tabla: 14, tronco: 2 },
    fisica(h) { h.segmento(-0.8, 0, 0.8, 0, 0.45, 0, 0.88); h.segmento(-1.0, -0.62, 1.0, -0.62, 0.15, 0, 0.5); h.segmento(-1.0, 0.62, 1.0, 0.62, 0.15, 0, 0.5); },
    arma(c) {
      caja(c, 2.5, 0.08, 0.9, [0, 0.8, 0], TABLA);
      for (let i = 0; i < 5; i++) caja(c, 2.5, 0.01, 0.005, [0, 0.846, -0.35 + i * 0.175], MADERA_OSCURA, { variar: 0.05 });
      // dos caballetes y el travesaño
      for (const sx of [-1, 1]) {
        caja(c, 0.09, 0.76, 0.7, [sx * 1.0, 0.38, 0], MADERA_OSCURA, { tipo: 0 });
        caja(c, 0.09, 0.1, 0.9, [sx * 1.0, 0.05, 0], MADERA_OSCURA, { tipo: 0 });
      }
      caja(c, 2.0, 0.08, 0.08, [0, 0.4, 0], MADERA, { tipo: 0 });
      // los bancos
      for (const sz of [-1, 1]) {
        caja(c, 2.3, 0.06, 0.3, [0, 0.46, sz * 0.62], TABLA_CLARA);
        for (const sx of [-1, 1]) caja(c, 0.07, 0.43, 0.26, [sx * 1.0, 0.22, sz * 0.62], MADERA_OSCURA, { tipo: 0 });
      }
      // sobre la mesa: una jarra, pan y platos
      cil(c, 0.07, 0.06, 0.2, [-0.7, 0.94, 0.05], '#a8573a', { lados: 10 });
      caja(c, 0.3, 0.07, 0.15, [0.1, 0.875, 0.12], '#c9a870', { variar: 0.1 });
      for (const [x, z] of [[-0.2, -0.28], [0.5, -0.25], [0.9, 0.2], [-0.2, 0.3]]) cil(c, 0.11, 0.1, 0.018, [x, 0.85, z], '#cfc8b4', { lados: 12 });
    },
  },
  {
    id: 'aparador', nombre: 'Aparador', pieza: true, radio: 1.0, ancho: 1.6, fondo: 0.5, alto: 1.8, separacion: 1.7,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 2,
    texto: 'Un mueble bajo con puertas y arriba una vitrina abierta con la vajilla a la vista. Contra la pared del comedor.',
    pide: { tabla: 10, tronco: 1 },
    fisica(h) { h.segmento(-0.52, 0, 0.52, 0, 0.27, 0, 1.8); },
    arma(c) {
      // abajo: el mueble con tres puertas
      caja(c, 1.5, 0.82, 0.46, [0, 0.46, 0.02], '#6a5238');
      caja(c, 1.58, 0.06, 0.5, [0, 0.9, 0.02], MADERA_OSCURA, { tipo: 0 });
      for (const x of [-0.5, 0, 0.5]) puerta(c, x, 0.5, -0.215, 0.46, 0.7);
      pies(c, 1.5, 0.46, 0.06, MADERA_OSCURA, 0.1);
      // arriba: la vitrina con dos estantes y la vajilla
      for (const sx of [-1, 1]) caja(c, 0.05, 0.86, 0.26, [sx * 0.66, 1.36, 0.1], MADERA_OSCURA, { tipo: 0 });
      caja(c, 1.4, 0.86, 0.04, [0, 1.36, 0.22], '#5b4735');
      caja(c, 1.44, 0.07, 0.3, [0, 1.8 - 0.035, 0.1], MADERA_OSCURA, { tipo: 0 });
      for (const y of [1.14, 1.5]) caja(c, 1.32, 0.04, 0.26, [0, y, 0.1], TABLA);
      // platos parados, tazas y una fuente
      for (let i = 0; i < 6; i++) cil(c, 0.1, 0.1, 0.018, [-0.55 + i * 0.22, 1.24, 0.18], i % 2 ? '#cfc8b4' : '#9fb4c0', { lados: 12, rot: [Math.PI / 2 - 0.15, 0, 0] });
      for (let i = 0; i < 5; i++) cil(c, 0.04, 0.032, 0.07, [-0.5 + i * 0.25, 1.205, 0.04], '#a8573a', { lados: 8 });
      cil(c, 0.2, 0.15, 0.06, [0.15, 1.57, 0.08], '#cfc8b4', { lados: 14 });
      for (let i = 0; i < 4; i++) cil(c, 0.035, 0.03, 0.12, [-0.5 + i * 0.12, 1.58, 0.1], ['#6a8a9a', '#c8a04a'][i % 2], { lados: 8 });
    },
  },
  {
    id: 'librero', nombre: 'Biblioteca (librero)', pieza: true, radio: 0.9, ancho: 1.25, fondo: 0.42, alto: 2.05, separacion: 1.4,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 2,
    texto: 'Un librero alto con cinco estantes y los libros de la casa, apretados y a medio ordenar. Contra la pared, de espaldas a +Z.',
    pide: { tabla: 10, tronco: 1 },
    fisica(h) { h.segmento(-0.44, 0, 0.44, 0, 0.21, 0, 2.05); },
    arma(c) {
      for (const sx of [-1, 1]) caja(c, 0.06, 2.0, 0.34, [sx * 0.6, 1.02, 0], MADERA_OSCURA, { tipo: 0 });
      caja(c, 1.22, 2.0, 0.03, [0, 1.02, 0.18], '#5b4735');
      caja(c, 1.3, 0.07, 0.4, [0, 2.03, 0], MADERA_OSCURA, { tipo: 0 });
      const LOMOS = ['#7a3a2a', '#3a5a6a', '#6a6a3a', '#5a3a4a', '#3a4a3a', '#8a6a3a', '#4a4a5a', '#8a3a3a'];
      for (let f = 0; f < 5; f++) {
        const y0 = 0.12 + f * 0.4;
        caja(c, 1.14, 0.05, 0.34, [0, y0, 0], TABLA);
        let x = -0.54;
        for (let i = 0; x < 0.5; i++) {
          const k = f * 31 + i, ancho = 0.035 + hs(k) * 0.05, alto = 0.22 + hs(k + 9) * 0.12, inclina = (f + i) % 11 === 0;
          x += ancho;
          if (inclina) { x += 0.12; continue; }
          caja(c, ancho * 0.9, alto, 0.22, [x - ancho / 2, y0 + 0.025 + alto / 2, -0.01], LOMOS[Math.floor(hs(k + 3) * 8)], { variar: 0.14 });
          x += 0.004;
        }
        if (f % 2) caja(c, 0.22, 0.04, 0.18, [0.4, y0 + 0.07, -0.01], '#7a3a2a', { rot: [0, 0.2, 0] });
      }
      caja(c, 1.14, 0.06, 0.34, [0, 0.07, 0], MADERA_OSCURA, { tipo: 0 });
    },
  },
  // ================================================================ la cocina y el trabajo
  {
    id: 'mesada', nombre: 'Mesada con pileta', pieza: true, radio: 1.4, ancho: 2.2, fondo: 1.0, alto: 1.5, separacion: 2.2,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1,
    texto: 'Una mesada de laja sobre un mueble de tablas, con una pileta de piedra, una bomba de mano y un estante con frascos. Para lavar y preparar.',
    pide: { tabla: 8, piedra: 5 },
    fisica(h) { h.segmento(-0.66, 0, 0.66, 0, 0.34, 0, 1.0); },
    arma(c) {
      caja(c, 1.9, 0.78, 0.6, [0, 0.4, 0], '#6a5238');
      puerta(c, -0.62, 0.42, -0.305, 0.6, 0.66);
      puerta(c, 0.02, 0.42, -0.305, 0.6, 0.66);
      caja(c, 0.4, 0.66, 0.012, [0.66, 0.42, -0.305], TABLA_CLARA);
      caja(c, 2.0, 0.07, 0.68, [0, 0.82, 0], '#9a8f7e', { variar: 0.14 });
      // la pileta: un hueco de piedra más oscura, con el agua
      caja(c, 0.62, 0.05, 0.42, [-0.5, 0.86, 0], '#5d574f', { variar: 0.12 });
      caja(c, 0.52, 0.012, 0.32, [-0.5, 0.886, 0], '#6a8a9a', { variar: 0.04 });
      // la bomba de mano: el caño, el pico y la palanca
      cil(c, 0.03, 0.03, 0.36, [-0.5, 1.04, 0.24], HIERRO, { tipo: 0, lados: 8 });
      cil(c, 0.018, 0.018, 0.24, [-0.5, 1.2, 0.13], HIERRO, { tipo: 0, lados: 6, rot: [Math.PI / 2, 0, 0] });
      caja(c, 0.04, 0.04, 0.34, [-0.5, 1.27, 0.34], HIERRO, { tipo: 0, rot: [0.45, 0, 0] });
      // el respaldo, un estante y los frascos
      caja(c, 2.0, 0.34, 0.04, [0, 1.02, 0.31], '#9a8f7e', { variar: 0.12 });
      caja(c, 1.4, 0.04, 0.2, [0.4, 1.28, 0.24], TABLA);
      for (let i = 0; i < 5; i++) cil(c, 0.05, 0.05, 0.13 + hs(i) * 0.05, [-0.05 + i * 0.22, 1.37, 0.24], ['#a8573a', '#c8a04a', '#6a8a5a', '#8a4a5a', '#cfc8b4'][i], { lados: 8 });
      caja(c, 0.24, 0.1, 0.18, [0.6, 0.92, 0.1], '#7a5a3a');
      cil(c, 0.12, 0.1, 0.16, [0.82, 0.94, -0.06], '#7d766c', { lados: 10 });   // el balde
    },
  },
  {
    id: 'barril-agua', nombre: 'Barril de agua', pieza: true, radio: 0.55, ancho: 0.86, fondo: 0.76, alto: 1.0, separacion: 0.7,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1,
    texto: 'Un barril de duelas con aros de hierro, su tapa y un cucharón colgado. Junto a la mesada, para tener el agua a mano.',
    pide: { tabla: 6, tronco: 1 },
    fisica(h) { h.circulo(0, 0, 0.36, 0, 1.0); },
    arma(c) {
      cil(c, 0.3, 0.27, 0.3, [0, 0.17, 0], '#7a5a3a', { lados: 14 });
      cil(c, 0.34, 0.3, 0.32, [0, 0.46, 0], '#85633f', { lados: 14 });
      cil(c, 0.3, 0.34, 0.32, [0, 0.78, 0], '#7a5a3a', { lados: 14 });
      cil(c, 0.31, 0.31, 0.04, [0, 0.96, 0], '#8a6b4a', { lados: 14 });
      cil(c, 0.27, 0.27, 0.01, [0, 0.99, 0], '#6a8a9a', { lados: 14, tipo: 0 });
      for (const [y, r] of [[0.1, 0.28], [0.33, 0.325], [0.62, 0.345], [0.9, 0.305]]) cil(c, r + 0.012, r + 0.012, 0.03, [0, y, 0], HIERRO, { tipo: 0, lados: 14 });
      // la canilla y el cucharón colgado
      cil(c, 0.02, 0.02, 0.1, [0, 0.3, -0.33], BRONCE, { lados: 6, rot: [Math.PI / 2, 0, 0] });
      cil(c, 0.015, 0.015, 0.22, [0.34, 0.7, 0.05], HIERRO, { tipo: 0, lados: 5, rot: [0.3, 0, 0.1] });
      cil(c, 0.05, 0.03, 0.04, [0.38, 0.58, 0.07], HIERRO, { tipo: 0, lados: 8 });
    },
  },
  {
    id: 'escritorio', nombre: 'Escritorio', pieza: true, radio: 1.0, ancho: 1.4, fondo: 0.72, alto: 1.2, separacion: 1.4,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1,
    texto: 'Un escritorio con dos cajoneras, tintero, papeles, unos libros y una lámpara de kerosene. Para escribir las cartas y el diario.',
    pide: { tabla: 9, tronco: 1 },
    fisica(h) { h.segmento(-0.35, 0, 0.35, 0, 0.35, 0, 0.82); },
    arma(c) {
      caja(c, 1.4, 0.05, 0.7, [0, 0.77, 0], TABLA_CLARA);
      for (const sx of [-1, 1]) {
        caja(c, 0.42, 0.72, 0.62, [sx * 0.46, 0.38, 0.02], '#6a5238');
        for (const y of [0.18, 0.4, 0.62]) {
          caja(c, 0.36, 0.17, 0.012, [sx * 0.46, y, -0.295], TABLA);
          caja(c, 0.1, 0.02, 0.02, [sx * 0.46, y, -0.31], BRONCE, { tipo: 0 });
        }
      }
      caja(c, 0.46, 0.16, 0.6, [0, 0.62, 0.02], '#6a5238');
      caja(c, 1.3, 0.5, 0.03, [0, 0.4, 0.31], '#5b4735');
      // sobre el escritorio: papeles, tintero con pluma, libros y la lámpara
      caja(c, 0.34, 0.012, 0.26, [-0.1, 0.805, -0.05], PAPEL, { variar: 0.04, rot: [0, 0.15, 0] });
      cil(c, 0.035, 0.04, 0.06, [0.15, 0.84, -0.12], '#2a2622', { lados: 8 });
      cil(c, 0.004, 0.004, 0.22, [0.17, 0.95, -0.12], '#e8e0c8', { lados: 4, tipo: 0, rot: [0, 0, -0.5] });
      for (let i = 0; i < 3; i++) caja(c, 0.26 - i * 0.03, 0.045, 0.18, [0.5, 0.825 + i * 0.045, 0.1], ['#7a3a2a', '#3a5a6a', '#6a6a3a'][i], { variar: 0.1, rot: [0, 0.1 * i, 0] });
      cil(c, 0.07, 0.08, 0.04, [-0.5, 0.82, 0.2], '#4a443c', { lados: 10 });
      cil(c, 0.05, 0.06, 0.16, [-0.5, 0.92, 0.2], '#d0b57a', { lados: 10 });
      cil(c, 0.07, 0.04, 0.05, [-0.5, 1.03, 0.2], '#403b35', { lados: 10 });
    },
  },
  {
    id: 'perchero', nombre: 'Perchero y botas', pieza: true, radio: 0.7, ancho: 0.8, fondo: 0.7, alto: 2.0, separacion: 0.8,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1,
    texto: 'Un perchero de pie con un poncho, un sombrero y una bufanda, y las botas embarradas en la base. Junto a la puerta, para dejar lo mojado.',
    pide: { tabla: 3, tronco: 1 },
    fisica(h) { h.circulo(0, 0, 0.28, 0, 1.9); },
    arma(c) {
      cil(c, 0.035, 0.04, 1.75, [0, 0.93, 0], MADERA_OSCURA, { tipo: 0, lados: 8 });
      cil(c, 0.2, 0.22, 0.05, [0, 0.03, 0], MADERA_OSCURA, { tipo: 0, lados: 10 });
      // los ganchos, en dos alturas
      for (let k = 0; k < 6; k++) {
        const a = k * 1.05 + 0.3, y = k < 3 ? 1.74 : 1.55;
        cil(c, 0.013, 0.013, 0.2, [Math.cos(a) * 0.1, y, Math.sin(a) * 0.1], HIERRO, { tipo: 0, lados: 5, rot: [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9] });
      }
      // el poncho, el sombrero y la bufanda
      caja(c, 0.34, 0.62, 0.04, [-0.18, 1.3, -0.12], '#9b3a2e', { variar: 0.1, rot: [0, 0.4, 0.05] });
      caja(c, 0.3, 0.04, 0.04, [-0.17, 1.62, -0.12], '#c8a04a', { variar: 0.06, rot: [0, 0.4, 0.05] });
      cil(c, 0.13, 0.13, 0.015, [0.06, 1.86, 0.08], '#4a3b2c', { lados: 12 });
      cil(c, 0.07, 0.08, 0.1, [0.06, 1.92, 0.08], '#4a3b2c', { lados: 12 });
      caja(c, 0.05, 0.4, 0.04, [0.15, 1.38, -0.04], '#4a6a7a', { variar: 0.1, rot: [0, -0.3, 0] });
      // las botas, embarradas, con un trapito debajo
      caja(c, 0.5, 0.012, 0.3, [0, 0.062, -0.14], '#6b5a48', { variar: 0.1 });
      for (const sx of [-1, 1]) {
        cil(c, 0.055, 0.06, 0.34, [sx * 0.11, 0.24, -0.14], '#2a2622', { lados: 8 });
        caja(c, 0.11, 0.09, 0.26, [sx * 0.11, 0.115, -0.2], '#2a2622', { variar: 0.1 });
        caja(c, 0.115, 0.03, 0.27, [sx * 0.11, 0.075, -0.2], '#5b4a38', { variar: 0.1 });
      }
    },
  },
  // ================================================================ la decoración
  {
    id: 'reloj-pared', nombre: 'Reloj de pared', pieza: true, radio: 0.5, ancho: 0.42, fondo: 0.26, alto: 2.0, separacion: 0.4,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1, alcanceE: 2.2,
    texto: 'Un reloj de caja con péndulo y dos pesas, para colgar de la pared. Con E te dice la hora y el día, lo mismo que el de la plaza de la aldea. El fondo mira a +Z.',
    pide: { tabla: 4, piedra: 1 },
    arma(c) {
      // la caja, colgada de un clavo (la pared queda atrás: no apoya en el piso)
      caja(c, 0.3, 0.84, 0.12, [0, 1.46, 0.04], '#6a5238');
      caja(c, 0.36, 0.06, 0.16, [0, 1.92, 0.04], MADERA_OSCURA, { tipo: 0 });
      caja(c, 0.34, 0.05, 0.14, [0, 1.04, 0.04], MADERA_OSCURA, { tipo: 0 });
      // la esfera, arriba
      cil(c, 0.13, 0.13, 0.015, [0, 1.72, -0.025], '#efe8d8', { lados: 18, rot: [Math.PI / 2, 0, 0] });
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2;
        caja(c, 0.012, k % 3 === 0 ? 0.04 : 0.022, 0.008, [Math.sin(a) * 0.105, 1.72 + Math.cos(a) * 0.105, -0.036], '#2a2622', { tipo: 0, rot: [0, 0, -a] });
      }
      caja(c, 0.014, 0.08, 0.008, [-0.03, 1.755, -0.038], '#1f1c19', { tipo: 0, rot: [0, 0, 0.9] });
      caja(c, 0.01, 0.11, 0.008, [0.04, 1.77, -0.04], '#1f1c19', { tipo: 0, rot: [0, 0, -0.95] });
      // el vidrio del péndulo, el péndulo y las dos pesas
      caja(c, 0.2, 0.4, 0.01, [0, 1.35, -0.025], VIDRIO, { variar: 0.03 });
      cil(c, 0.007, 0.007, 0.3, [0, 1.42, -0.03], BRONCE, { tipo: 0, lados: 4 });
      cil(c, 0.055, 0.055, 0.015, [0, 1.25, -0.035], BRONCE, { tipo: 0, lados: 12, rot: [Math.PI / 2, 0, 0] });
      for (const x of [-0.06, 0.06]) { cil(c, 0.004, 0.004, 0.36, [x, 1.16, -0.03], HIERRO, { tipo: 0, lados: 4 }); cil(c, 0.025, 0.025, 0.1, [x, 0.99 + (x > 0 ? 0.05 : 0), -0.03], HIERRO, { tipo: 0, lados: 8 }); }
    },
  },
  {
    id: 'almanaque-pared', nombre: 'Almanaque de pared', pieza: true, radio: 0.4, ancho: 0.45, fondo: 0.1, alto: 1.95, separacion: 0.3,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1, alcanceE: 2.0,
    texto: 'Una hoja por día, con la luna y las estaciones, colgada de un clavo. Con E te dice el día, la fecha, la luna y lo que viene, lo mismo que el de la biblioteca. El fondo mira a +Z.',
    pide: { tabla: 1 },
    arma(c) {
      caja(c, 0.4, 0.58, 0.02, [0, 1.55, 0.02], '#5a4130');
      caja(c, 0.34, 0.36, 0.01, [0, 1.52, 0.005], PAPEL, { variar: 0.04 });
      caja(c, 0.34, 0.09, 0.012, [0, 1.74, 0.005], '#9b3a2e', { variar: 0.04 });
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) caja(c, 0.058, 0.034, 0.006, [-0.12 + j * 0.08, 1.64 - i * 0.052, 0.0], (i * 4 + j) % 6 === 0 ? '#b8322a' : '#8a8272', { variar: 0.04 });
      caja(c, 0.3, 0.07, 0.01, [0, 1.3, 0.005], '#e2d6b8', { variar: 0.04 });
      cil(c, 0.03, 0.03, 0.008, [-0.1, 1.3, 0], '#d9d2b0', { lados: 10, rot: [Math.PI / 2, 0, 0], tipo: 0 });
      cil(c, 0.012, 0.012, 0.03, [0, 1.855, 0.03], HIERRO, { tipo: 0, lados: 6, rot: [Math.PI / 2, 0, 0] });
    },
  },
  {
    id: 'cuadros', nombre: 'Cuadros y fotos', pieza: true, radio: 0.8, ancho: 1.5, fondo: 0.1, alto: 1.9, separacion: 0.6,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1,
    texto: 'Tres cuadros para colgar juntos, uno grande con el lago y la cordillera y dos chicos: un bosque y un retrato. Para vestir una pared. El fondo mira a +Z.',
    pide: { tabla: 3 },
    arma(c) {
      const marco = (x, y, w, h, color = '#5a4130') => caja(c, w + 0.08, h + 0.08, 0.035, [x, y, 0.02], color, { variar: 0.06 });
      // el grande: la cordillera sobre el lago (bandas de color)
      marco(0, 1.55, 0.78, 0.52);
      const bandas = [['#a9c2d2', 0.2], ['#e8eef4', 0.09], ['#8aa0b2', 0.09], ['#3f6a8a', 0.14]];
      let y = 1.55 + 0.26;
      for (const [col, h] of bandas) { y -= h; caja(c, 0.78, h, 0.012, [0, y + h / 2, -0.002], col, { variar: 0.06 }); }
      caja(c, 0.26, 0.09, 0.014, [-0.2, 1.63, -0.003], '#e8eef4', { variar: 0.04, rot: [0, 0, 0.3] });
      // el chico de la izquierda: el bosque
      marco(-0.52, 1.18, 0.3, 0.38);
      for (let i = 0; i < 3; i++) caja(c, 0.3, 0.126, 0.012, [-0.52, 1.18 + 0.126 - i * 0.126, -0.002], ['#9ab8a0', '#4f7a3a', '#2e4a2a'][i], { variar: 0.08 });
      // el chico de la derecha: un retrato
      marco(0.52, 1.3, 0.28, 0.4, '#3a2a20');
      caja(c, 0.28, 0.4, 0.012, [0.52, 1.3, -0.002], '#b09a7a', { variar: 0.06 });
      c.agregar(new THREE.IcosahedronGeometry(0.06, 0), { color: '#d0a888', tipo: 4, variar: 0.04, matriz: matriz([0.52, 1.34, -0.01], [0, 0, 0], [1, 1.2, 0.4]) });
      caja(c, 0.16, 0.14, 0.012, [0.52, 1.18, -0.004], '#5a3a2e', { variar: 0.08 });
    },
  },
  {
    id: 'cortinas', nombre: 'Cortinas', pieza: true, radio: 1.0, ancho: 2.0, fondo: 0.2, alto: 2.1, separacion: 0.5,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1,
    texto: 'Un par de cortinas de lana tejida, recogidas a los lados, en su varilla de bronce. Para una ventana. El fondo mira a +Z.',
    pide: { tabla: 2, lana: 4 },
    arma(c) {
      cil(c, 0.016, 0.016, 1.9, [0, 2.05, 0.05], BRONCE, { tipo: 0, lados: 8, rot: [0, 0, Math.PI / 2] });
      for (const sx of [-1, 1]) {
        cil(c, 0.035, 0.035, 0.05, [sx * 0.96, 2.05, 0.05], BRONCE, { tipo: 0, lados: 8 });
        // la cortina: tiras verticales con vuelo, más angostas en la atadura
        for (let i = 0; i < 6; i++) {
          const x = sx * (0.9 - i * 0.09), z = 0.04 + Math.sin(i * 1.7) * 0.025, h = 1.55;
          caja(c, 0.098, h, 0.02, [x, 2.0 - h / 2, z], i % 2 ? '#8f4a3a' : '#a85a46', { variar: 0.1, tipo: 4 });
          // abajo se abre
          caja(c, 0.098, 0.5, 0.02, [x + sx * 0.02, 0.8, z + 0.01], i % 2 ? '#85432f' : '#9b5340', { variar: 0.1 });
        }
        // la atadura
        caja(c, 0.62, 0.05, 0.07, [sx * 0.65, 1.1, 0.05], '#c8a04a', { variar: 0.06 });
      }
    },
  },
  {
    id: 'planta-maceta', nombre: 'Planta en maceta', pieza: true, radio: 0.5, ancho: 0.75, fondo: 0.75, alto: 0.95, separacion: 0.5,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1,
    texto: 'Un helecho del bosque con unas flores, en una maceta de barro. Alegra un rincón de la casa.',
    pide: { piedra: 2 },
    fisica(h) { h.circulo(0, 0, 0.22, 0, 0.5); },
    arma(c) {
      cil(c, 0.2, 0.14, 0.3, [0, 0.16, 0], '#a8573a', { lados: 12 });
      cil(c, 0.22, 0.2, 0.05, [0, 0.31, 0], '#b8654a', { lados: 12 });
      cil(c, 0.18, 0.18, 0.02, [0, 0.335, 0], '#3a2f26', { lados: 12 });
      // el helecho: hojas largas que se abren en abanico
      const VERDES = ['#4d6b32', '#5a7a3a', '#3f5a2a', '#68843f'];
      for (let k = 0; k < 12; k++) {
        const a = k * 0.55 + 0.2, incl = 0.22 + hs(k) * 0.5, largo = 0.4 + hs(k + 5) * 0.16;
        tira(c, 0.06, largo, 0.012, [Math.cos(a) * 0.04, 0.34, Math.sin(a) * 0.04], [Math.sin(incl) * Math.cos(a), Math.cos(incl), Math.sin(incl) * Math.sin(a)], VERDES[k % 4], { variar: 0.12 });
      }
      // y unas flores
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + 0.8, r = 0.1 + k * 0.03, y = 0.62 + k * 0.1;
        cil(c, 0.006, 0.006, y - 0.34, [Math.cos(a) * r, 0.34 + (y - 0.34) / 2, Math.sin(a) * r], '#4d6b32', { lados: 4, tipo: 4 });
        c.agregar(new THREE.IcosahedronGeometry(0.035, 0), { color: ['#e8d84a', '#d07aa8', '#f2ece0'][k], tipo: 4, variar: 0.06, matriz: matriz([Math.cos(a) * r, y, Math.sin(a) * r], [a, 0, 0], [1, 0.7, 1]) });
      }
    },
  },
];

// Los que se usan con E (los dos de la pared): el id y qué dice el aviso.
export const MUEBLES_QUE_SE_USAN = { 'reloj-pared': 'Mirar el reloj de pared', 'almanaque-pared': 'Mirar el almanaque de pared' };
