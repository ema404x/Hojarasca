// 3.7.2 (granja): los planos de la granja (O → Trabajo, sólo en el Relax). `construccion.js` los suma a PLANOS con
// una sola línea (PLANOS.push(...PLANOS_GRANJA)), como las máquinas:
//   · el tambo con comedero: donde vive y duerme la vaca lechera (Don Ramón te la cambia cuando lo tenés);
//   · el chiquero, de palo a pique, con su casilla y la batea: para la chancha de Ayelén y los lechones;
//   · la paridera, junto a tu corral (a menos de 10 m del bebedero): con ella las ovejas crían en primavera;
//   · el hoyo para frutal, con su tutor: ahí se planta (E) el plantín de manzano, peral, ciruelo o cerezo, o la mata
//     de frambuesa o de grosella.
// Lo que vive y crece (la vaca, los chanchos, los corderos, el árbol) no va en la obra: lo dibuja granja-mundo.js.
// Como todas las obras, sólo madera y piedra (tipo 0 y 4): la hoja caduca (2) y la flor (3) cambian con las estaciones.
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { calce } from './calces.js';

const MADERA = '#6b5238';
const MADERA_OSCURA = '#4a3b2c';
const TABLA = '#8a6b4a';
const PIEDRA = '#7d766c';
const TECHO = '#4e4038';
const PALO = '#5e4a37';
const TIERRA = '#3a2c20';
const PAJA = '#b59a5c';

// Dónde están las cosas adentro de cada obra (coordenadas de la obra; el frente es +z): granja-mundo.js y
// granja-juego.js los usan para poner a los animales.
export const TAMBO = { ancho: 4.4, fondo: 3.4, alto: 2.5, cama: { lx: -0.3, lz: -0.35 }, comedero: { lx: 0, lz: -1.25 }, pasto: { lz: 5.5, radio: 5.2 } };
export const CHIQUERO = { ancho: 4.2, fondo: 3.6, adentro: { x0: -1.75, x1: 1.75, z0: -1.4, z1: 1.45 }, casilla: { lx: -1.15, lz: -1.0 }, batea: { lx: 1.05, lz: 1.15 } };
export const PARIDERA = { ancho: 2.6, fondo: 2.0 };

// Una hilera de palos parados (palo a pique) de (ax, az) a (bx, bz), cada `paso` metros, de alto `alto` (con algo
// de desparejo, como los de verdad), con un travesaño atado arriba. Bajan hasta el suelo en una ladera.
function palos(c, suelo, ax, az, bx, bz, alto, paso, semilla = 1, travesano = true) {
  const largo = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(largo / paso));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    const h = alto * (0.9 + 0.12 * Math.abs(Math.sin(i * 12.9898 + semilla * 4.1)));
    const pie = Math.min(0, suelo ? suelo(x, z) : 0) - 0.12;
    const r = 0.05 + 0.012 * Math.abs(Math.sin(i * 7.3 + semilla));
    c.agregar(new THREE.CylinderGeometry(r * 0.85, r, h - pie, 5), { color: i % 3 ? PALO : MADERA_OSCURA, tipo: 0, variar: 0.12,
      matriz: matriz([x, pie + (h - pie) / 2, z], [Math.sin(i * 3.7 + semilla) * 0.03, i * 1.3, Math.cos(i * 5.1 + semilla) * 0.03]) });
  }
  if (!travesano) return;
  const y = alto * 0.78, ang = Math.atan2(-(bz - az), bx - ax);
  c.agregar(new THREE.CylinderGeometry(0.035, 0.04, largo, 5), { color: MADERA, tipo: 0, variar: 0.08, matriz: matriz([(ax + bx) / 2, y, (az + bz) / 2], [0, ang, Math.PI / 2]) });
}
// un techo de una agua de tablas: del frente (zf, alto yf) al fondo (zb, alto yb), de ancho W
function techoUnaAgua(c, W, zf, yf, zb, yb, color = TECHO) {
  const largo = Math.hypot(zf - zb, yf - yb) + 0.3, incl = Math.atan2(yf - yb, zf - zb);
  const n = Math.round(W / 0.3);
  for (let i = 0; i < n; i++) {
    c.agregar(new THREE.BoxGeometry(0.29, 0.05, largo), { color: i % 3 ? color : '#453a31', tipo: 4, variar: 0.1,
      matriz: matriz([-W / 2 + 0.15 + i * (W / n), (yf + yb) / 2 + 0.03, (zf + zb) / 2], [-incl, 0, 0]) });
  }
}

// Las de una sola etapa (como las piezas de construccion.js): `pide` y `arma` en una etapa que termina la obra.
function pieza(p) {
  return { ...p, ancho: p.ancho ?? p.radio * 2, fondo: p.fondo ?? p.radio * 2, alto: p.alto ?? 1,
    etapas: [{ nombre: 'Armarlo', pide: p.pide, dice: p.texto, termina: true, arma: p.arma }] };
}

export const PLANOS_GRANJA = [
  {
    id: 'tambo', nombre: 'Tambo con comedero', pieza: true, categoria: 'trabajo', soloRelax: true,
    radio: 2.6, ancho: TAMBO.ancho, fondo: TAMBO.fondo, alto: TAMBO.alto, separacion: 3, distancia: 5.5, pendienteMax: 0.5,
    funciones: ['tambo'],
    texto: 'Un galpón de palo a pique abierto al frente, con techo de tablas, comedero y tina de agua. Ahí vive la vaca lechera: Don Ramón te cambia una cuando lo tenés. Se ordeña a la mañana (E); en invierno come del comedero.',
    etapas: [
      {
        nombre: 'Horcones y paredes de palo a pique',
        pide: { tronco: 7 },
        dice: 'Cuatro horcones en las esquinas y las paredes de palos parados, bien enterrados: el viento del oeste no perdona.',
        arma(c, P, datos, suelo) {
          const W = TAMBO.ancho, D = TAMBO.fondo;
          for (const [x, z, h] of [[-W / 2, -D / 2, 2.15], [W / 2, -D / 2, 2.15], [-W / 2, D / 2, 2.55], [W / 2, D / 2, 2.55]]) {
            c.agregar(new THREE.CylinderGeometry(0.1, 0.12, h + 0.3, 6), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([x, (h - 0.3) / 2, z]) });
            calce(c, suelo, x, z, -0.3, 0.13, MADERA_OSCURA, 0);
          }
          palos(c, suelo, -W / 2 + 0.12, -D / 2, W / 2 - 0.12, -D / 2, 1.85, 0.16, 1);
          palos(c, suelo, -W / 2, -D / 2 + 0.14, -W / 2, D / 2 - 0.6, 1.5, 0.17, 2);
          palos(c, suelo, W / 2, -D / 2 + 0.14, W / 2, D / 2 - 0.6, 1.5, 0.17, 3);
          // las vigas de arriba, de horcón a horcón
          for (const [z, y] of [[-D / 2, 2.12], [D / 2, 2.52]]) c.agregar(new THREE.BoxGeometry(W + 0.3, 0.14, 0.14), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, y, z]) });
        },
      },
      {
        nombre: 'Techo, comedero y tina',
        pide: { tabla: 9, tronco: 2 },
        dice: 'Techo de una agua que tira la lluvia para atrás, el comedero de tablas contra el fondo y una tina con agua.',
        termina: true,
        arma(c, P, datos, suelo) {
          const W = TAMBO.ancho, D = TAMBO.fondo;
          techoUnaAgua(c, W + 0.5, D / 2 + 0.4, 2.62, -D / 2 - 0.35, 2.2);
          // el comedero: un cajón largo de tablas sobre dos patas, contra la pared del fondo
          const cz = TAMBO.comedero.lz;
          c.agregar(new THREE.BoxGeometry(2.6, 0.08, 0.5), { color: TABLA, tipo: 4, variar: 0.1, matriz: matriz([0, 0.5, cz]) });
          for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(2.6, 0.3, 0.05), { color: TABLA, tipo: 4, variar: 0.12, matriz: matriz([0, 0.66, cz + s * 0.23]) });
          for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.05, 0.3, 0.5), { color: MADERA, tipo: 4, matriz: matriz([s * 1.28, 0.66, cz]) });
          for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.1, 0.5, 0.1), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([s * 1.1, 0.25, cz]) });
          c.agregar(new THREE.BoxGeometry(2.45, 0.12, 0.38), { color: PAJA, tipo: 4, variar: 0.18, matriz: matriz([0, 0.6, cz]) });   // el pasto que quedó
          // la tina de agua: medio tonel con zunchos
          const tx = W / 2 - 0.55, tz = D / 2 - 0.45;
          c.agregar(new THREE.CylinderGeometry(0.42, 0.36, 0.55, 12, 1, true), { color: MADERA, tipo: 4, variar: 0.1, matriz: matriz([tx, 0.27, tz]) });
          c.agregar(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 12), { color: '#3f5a66', tipo: 4, matriz: matriz([tx, 0.46, tz]) });
          for (const y of [0.12, 0.42]) c.agregar(new THREE.CylinderGeometry(0.43 - y * 0.1, 0.43 - y * 0.1, 0.035, 12, 1, true), { color: '#3a3632', tipo: 4, matriz: matriz([tx, y, tz]) });
          // la cama de paja donde duerme la vaca
          for (let i = 0; i < 6; i++) c.agregar(new THREE.BoxGeometry(0.9, 0.04, 0.7), { color: i % 2 ? PAJA : '#a08850', tipo: 4, variar: 0.2,
            matriz: matriz([-1.3 + (i % 3) * 0.85, 0.02, -0.4 + Math.floor(i / 3) * 0.6], [0, i * 0.7, 0]) });
          // un balde y el banquito de ordeñe, colgado y apoyado
          c.agregar(new THREE.CylinderGeometry(0.13, 0.11, 0.26, 10, 1, true), { color: '#8a8f94', tipo: 4, matriz: matriz([-W / 2 + 0.35, 0.13, D / 2 - 0.35]) });
          c.agregar(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 10), { color: TABLA, tipo: 4, matriz: matriz([-W / 2 + 0.75, 0.32, D / 2 - 0.4]) });
          for (let i = 0; i < 3; i++) { const a = i * 2.094; c.agregar(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 5), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([-W / 2 + 0.75 + Math.cos(a) * 0.1, 0.15, D / 2 - 0.4 + Math.sin(a) * 0.1]) }); }
        },
      },
    ],
    fisica({ segmento, circulo }) {
      const W = TAMBO.ancho, D = TAMBO.fondo;
      segmento(-W / 2, -D / 2, W / 2, -D / 2, 0.1, -0.1, 2.2);
      segmento(-W / 2, -D / 2, -W / 2, D / 2 - 0.6, 0.1, -0.1, 1.6);
      segmento(W / 2, -D / 2, W / 2, D / 2 - 0.6, 0.1, -0.1, 1.6);
      for (const s of [-1, 1]) circulo(s * W / 2, D / 2, 0.13, -0.1, 2.6);
      segmento(-1.3, TAMBO.comedero.lz, 1.3, TAMBO.comedero.lz, 0.28, -0.05, 0.8);
      circulo(W / 2 - 0.55, D / 2 - 0.45, 0.42, -0.05, 0.55);
    },
  },
  {
    id: 'chiquero', nombre: 'Chiquero', pieza: true, categoria: 'trabajo', soloRelax: true,
    radio: 2.5, ancho: CHIQUERO.ancho, fondo: CHIQUERO.fondo, alto: 1.5, separacion: 2.6, distancia: 5, pendienteMax: 0.45,
    funciones: ['chiquero'],
    texto: 'Un corralito de palo a pique, con una casilla techada para el frío, una batea de tronco y su tacho de agua. Para la chancha que te cambia Ayelén, la veterinaria. Las sobras van a la batea (E): papas, habas, manzanas, peras o ciruelas (la fruta fina, no).',
    etapas: [
      {
        nombre: 'El cerco de palo a pique',
        pide: { tronco: 6 },
        dice: 'Palos parados bien juntos y enterrados hondo: el chancho hoza y, si encuentra un hueco, se va.',
        arma(c, P, datos, suelo) {
          const W = CHIQUERO.ancho / 2, D = CHIQUERO.fondo / 2;
          palos(c, suelo, -W, -D, W, -D, 1.05, 0.2, 4);
          palos(c, suelo, -W, D, -0.55, D, 1.05, 0.2, 5);
          palos(c, suelo, 0.55, D, W, D, 1.05, 0.2, 6);
          palos(c, suelo, -W, -D, -W, D, 1.05, 0.2, 7);
          palos(c, suelo, W, -D, W, D, 1.05, 0.2, 8);
          // la tranquera del frente, de tablas
          for (const y of [0.3, 0.62, 0.92]) c.agregar(new THREE.BoxGeometry(1.1, 0.1, 0.04), { color: TABLA, tipo: 4, variar: 0.1, matriz: matriz([0, y, D]) });
          c.agregar(new THREE.BoxGeometry(0.06, 1.0, 0.04), { color: MADERA, tipo: 4, matriz: matriz([0, 0.55, D + 0.01], [0, 0, 0.62]) });
          // el barro del medio
          c.agregar(new THREE.CylinderGeometry(1.0, 1.1, 0.04, 14), { color: '#3b2e22', tipo: 4, variar: 0.08, matriz: matriz([0.2, 0.01, 0.25], [0, 0, 0], [1.2, 1, 0.9]) });
        },
      },
      {
        nombre: 'La casilla, la batea y el agua',
        pide: { tabla: 6, tronco: 1 },
        dice: 'Una casilla baja de tablas para que duerman al reparo, una batea de tronco ahuecado y un tacho con agua.',
        termina: true,
        arma(c) {
          const { lx, lz } = CHIQUERO.casilla;
          // la casilla: tres paredes y un techito de una agua
          c.agregar(new THREE.BoxGeometry(1.3, 0.85, 0.06), { color: TABLA, tipo: 4, variar: 0.12, matriz: matriz([lx, 0.42, lz - 0.55]) });
          for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.06, 0.8, 1.1), { color: TABLA, tipo: 4, variar: 0.12, matriz: matriz([lx + s * 0.65, 0.4, lz]) });
          c.agregar(new THREE.BoxGeometry(1.55, 0.05, 1.4), { color: TECHO, tipo: 4, variar: 0.1, matriz: matriz([lx, 0.98, lz + 0.05], [0.22, 0, 0]) });
          for (let i = 0; i < 3; i++) c.agregar(new THREE.BoxGeometry(0.5, 0.04, 0.4), { color: PAJA, tipo: 4, variar: 0.2, matriz: matriz([lx - 0.35 + i * 0.35, 0.02, lz - 0.1], [0, i, 0]) });
          // la batea: medio tronco ahuecado sobre dos piedras
          const { lx: bx, lz: bz } = CHIQUERO.batea;
          // (un tronco ahuecado: el cajón de madera y, arriba, el hueco oscuro con la comida)
          c.agregar(new THREE.BoxGeometry(1.1, 0.24, 0.38), { color: MADERA, tipo: 0, variar: 0.08, matriz: matriz([bx, 0.2, bz]) });
          for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(1.1, 0.05, 0.06), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([bx, 0.33, bz + s * 0.16]) });
          c.agregar(new THREE.BoxGeometry(1.0, 0.02, 0.26), { color: '#3a2a1c', tipo: 4, matriz: matriz([bx, 0.32, bz]) });
          for (const s of [-1, 1]) c.agregar(new THREE.IcosahedronGeometry(0.11, 0), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([bx + s * 0.42, 0.06, bz], [s, 0, 0], [1.2, 0.8, 1]) });
          // el tacho del agua, contra el cerco
          c.agregar(new THREE.CylinderGeometry(0.26, 0.22, 0.34, 10, 1, true), { color: '#6d6a66', tipo: 4, variar: 0.08, matriz: matriz([1.45, 0.17, -0.9]) });
          c.agregar(new THREE.CylinderGeometry(0.245, 0.245, 0.02, 10), { color: '#3f5a66', tipo: 4, matriz: matriz([1.45, 0.3, -0.9]) });
        },
      },
    ],
    fisica({ segmento }) {
      const W = CHIQUERO.ancho / 2, D = CHIQUERO.fondo / 2;
      segmento(-W, -D, W, -D, 0.08, -0.1, 1.1);
      segmento(-W, D, W, D, 0.08, -0.1, 1.1);
      segmento(-W, -D, -W, D, 0.08, -0.1, 1.1);
      segmento(W, -D, W, D, 0.08, -0.1, 1.1);
    },
  },
  pieza({
    id: 'paridera', nombre: 'Paridera', pieza: true, categoria: 'trabajo', soloRelax: true,
    radio: 1.6, ancho: PARIDERA.ancho, fondo: PARIDERA.fondo, alto: 1.7, separacion: 1.2, distancia: 4, pendienteMax: 0.5,
    funciones: ['paridera'],
    texto: 'Un galponcito bajo de tablas con cama de paja, para que las ovejas paran al reparo. Ponelo a menos de 10 m del bebedero de tu corral: amplía el corral y en primavera nacen los corderos.',
    pide: { tabla: 6, tronco: 2 },
    arma(c, P, datos, suelo) {
      const W = PARIDERA.ancho, D = PARIDERA.fondo;
      for (const [x, z, h] of [[-W / 2, -D / 2, 1.35], [W / 2, -D / 2, 1.35], [-W / 2, D / 2, 1.7], [W / 2, D / 2, 1.7]]) {
        c.agregar(new THREE.CylinderGeometry(0.07, 0.085, h + 0.2, 6), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([x, (h - 0.2) / 2, z]) });
        calce(c, suelo, x, z, -0.2, 0.09, MADERA_OSCURA, 0);
      }
      c.agregar(new THREE.BoxGeometry(W, 1.1, 0.05), { color: TABLA, tipo: 4, variar: 0.12, matriz: matriz([0, 0.6, -D / 2]) });
      for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.05, 1.0, D - 0.4), { color: TABLA, tipo: 4, variar: 0.12, matriz: matriz([s * W / 2, 0.55, -0.2]) });
      techoUnaAgua(c, W + 0.4, D / 2 + 0.3, 1.78, -D / 2 - 0.3, 1.4);
      for (let i = 0; i < 4; i++) c.agregar(new THREE.BoxGeometry(0.8, 0.04, 0.7), { color: i % 2 ? PAJA : '#a08850', tipo: 4, variar: 0.2, matriz: matriz([-0.6 + (i % 2) * 1.0, 0.02, -0.4 + Math.floor(i / 2) * 0.6], [0, i * 0.9, 0]) });
    },
    fisica({ segmento }) {
      const W = PARIDERA.ancho, D = PARIDERA.fondo;
      segmento(-W / 2, -D / 2, W / 2, -D / 2, 0.06, -0.05, 1.3);
      segmento(-W / 2, -D / 2, -W / 2, D / 2 - 0.4, 0.06, -0.05, 1.2);
      segmento(W / 2, -D / 2, W / 2, D / 2 - 0.4, 0.06, -0.05, 1.2);
    },
  }),
  pieza({
    id: 'frutal', nombre: 'Hoyo para frutal', pieza: true, categoria: 'trabajo', soloRelax: true,
    radio: 0.8, separacion: 2.6, distancia: 2.6, pendienteMax: 0.6,
    funciones: ['frutal'],
    texto: 'Un hoyo con tierra negra removida y un tutor de palo. Se planta (E) un plantín de manzano, peral, ciruelo o cerezo (de Gladys) o una mata de frambuesa o de grosella (de Inés). Florece en primavera y da fruta en verano u otoño.',
    pide: { tronco: 1 },
    arma(c, P, datos, suelo) {
      // la tierra removida, un poco alzada, y una corona de piedritas
      c.agregar(new THREE.CylinderGeometry(0.5, 0.62, 0.1, 12), { color: TIERRA, tipo: 4, variar: 0.1, matriz: matriz([0, 0.02, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.36, 0.48, 0.06, 12), { color: '#2e231a', tipo: 4, variar: 0.08, matriz: matriz([0, 0.08, 0]) });
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9 + 0.3, r = 0.05 + 0.02 * (i % 3);
        c.agregar(new THREE.IcosahedronGeometry(r, 0), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([Math.cos(a) * 0.6, r * 0.6, Math.sin(a) * 0.6], [a, a * 2, 0]) });
      }
      // el tutor, clavado al costado, con la atadura de tiento
      c.agregar(new THREE.CylinderGeometry(0.025, 0.032, 1.45, 5), { color: PALO, tipo: 0, variar: 0.1, matriz: matriz([0.16, 0.62, 0.05], [0.04, 0, -0.05]) });
      c.agregar(new THREE.TorusGeometry(0.07, 0.012, 4, 8), { color: '#8a6a44', tipo: 4, matriz: matriz([0.09, 0.95, 0.05], [Math.PI / 2, 0, 0]) });
    },
    fisica({ circulo }) { circulo(0, 0, 0.2, -0.05, 1.5); },
  }),
];
