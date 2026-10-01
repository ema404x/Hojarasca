// 2.9: los planos de las máquinas: el molino de agua, el aserradero, la estación
// meteorológica y la radio del refugio. `construccion.js` los suma a PLANOS con una sola
// línea (PLANOS.push(...PLANOS_MAQUINAS)). Lo que se mueve —la rueda, la sierra, las
// cazoletas del anemómetro, la veleta— no va en la obra: lo dibujan `molino-mundo.js` y
// `meteo-mundo.js`, porque la obra es una sola malla quieta.
//
// Como todas las obras, sólo madera, piedra y tela (tipo 0 y 4): la hoja caduca (2) y la
// flor (3) cambian con las estaciones.
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { calce, sueloMin } from './calces.js';

const MADERA = '#6b5238';
const MADERA_OSCURA = '#4a3b2c';
const TABLA = '#8a6b4a';
const PIEDRA = '#7d766c';
const TECHO = '#4e4038';
const CORTEZA = '#5a4432';
const BLANCO = '#e4e0d4';

// Dónde va la rueda del molino, en coordenadas de la obra: sobre el costado +X.
export const RUEDA_MOLINO = { lx: 1.85, radio: 1.15, ancho: 0.55, hunde: 0.3 };
// La sierra del aserradero y el tope del mástil de la estación.
export const SIERRA_ASERRADERO = { lx: 0, y: 0.98, lz: 0, radio: 0.34 };
export const MASTIL_ESTACION = { lx: 0.55, lz: 0, alto: 4.1 };

// El molino se revisa con el arroyo: la rueda tiene que caer sobre el agua que corre (no
// sobre el lago) y la orilla no puede ser tan alta que la rueda no llegue.
function puntoLocal(x, z, rot, lx, lz) {
  return { x: x + lx * Math.cos(rot) + lz * Math.sin(rot), z: z - lx * Math.sin(rot) + lz * Math.cos(rot) };
}
export function aguaDeRueda(T, x, z, rot) {
  for (const lx of [RUEDA_MOLINO.lx, RUEDA_MOLINO.lx + 0.4]) {
    const p = puntoLocal(x, z, rot, lx, 0);
    const a = T.agua(p.x, p.z);
    if (a && !a.lago) return { ...p, nivel: a.nivel };
  }
  return null;
}
function revisarMolino({ T, x, z, rot, base }) {
  // un valle sin arroyo (el terreno plano de las pruebas de geometría) no se revisa
  if (!Array.isArray(T.rio)) return null;
  const a = aguaDeRueda(T, x, z, rot);
  if (!a) {
    const otro = puntoLocal(x, z, rot, -RUEDA_MOLINO.lx, 0), q = T.agua(otro.x, otro.z);
    if (q && !q.lago) return { ok: false, motivo: 'Girala: la rueda va del lado del agua (R)' };
    return { ok: false, motivo: 'La rueda tiene que caer sobre el arroyo: poné el molino en la orilla' };
  }
  if (Number.isFinite(base) && base - a.nivel > 2.4) return { ok: false, motivo: 'La orilla es muy alta: la rueda no llegaría al agua' };
  return null;
}

export const PLANOS_MAQUINAS = [
  {
    id: 'molino-agua', nombre: 'Molino de agua', pieza: true, categoria: 'trabajo',
    radio: 1.9, ancho: 2.6, fondo: 2.4, alto: 3.1, separacion: 10, distancia: 5.5,
    pendienteMax: 0.75, desnivelMax: 1.3, funciones: ['molino-agua'],
    texto: 'Una casilla de piedra y tablas en la orilla del arroyo, con una rueda de paletas que el agua hace girar. Mueve la sierra de un aserradero a menos de 14 m y, si tenés habas de la huerta, las muele en harina (E).',
    revisarLugar: revisarMolino,
    etapas: [
      {
        nombre: 'Cimiento de piedra en la orilla',
        pide: { piedra: 8, tronco: 2 },
        dice: 'Piedra grande abajo, bien calzada: la orilla se lava con cada crecida.',
        arma(c, P, datos, suelo) {
          // 3.0.1: en la barranca del arroyo el cimiento baja hasta el suelo más bajo de la
          // huella (antes quedaba colgando hasta metro y medio); en el llano, igual que siempre
          const fondo = Math.min(-1.1, sueloMin(suelo, [[-1.37, -1.25], [1.37, -1.25], [-1.37, 1.25], [1.37, 1.25], [1.37, 0], [-1.37, 0], [0, 1.25], [0, -1.25]]) - 0.15);
          c.agregar(new THREE.BoxGeometry(2.75, 0.4 - fondo, 2.5), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([0, (0.4 + fondo) / 2, 0]) });
          for (const [x, z, r] of [[-1.3, -1.2, 0.34], [1.3, -1.2, 0.3], [-1.3, 1.2, 0.32], [1.3, 1.2, 0.36], [1.45, 0, 0.3]]) {
            c.agregar(new THREE.IcosahedronGeometry(r, 0), { color: PIEDRA, tipo: 4, variar: 0.2, matriz: matriz([x, 0.12, z], [r * 3, x, z]) });
            calce(c, suelo, x, z, 0.12 - r * 0.7, r);
          }
          // los durmientes de tronco sobre la piedra
          for (const sz of [-1, 1]) c.agregar(new THREE.CylinderGeometry(0.13, 0.14, 2.7, 7), { color: CORTEZA, tipo: 0, variar: 0.08, matriz: matriz([0, 0.47, sz * 1.0], [0, 0, Math.PI / 2]) });
        },
      },
      {
        nombre: 'La casilla de la muela',
        pide: { tabla: 10, tronco: 2 },
        dice: 'Cuatro paredes de tabla y un techo de dos aguas: adentro, la muela queda seca.',
        arma(c) {
          for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(2.6, 2.1, 0.1), { color: sz < 0 ? TABLA : MADERA, tipo: 0, variar: 0.12, matriz: matriz([0, 1.55, sz * 1.15]) });
          for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.1, 2.1, 2.3), { color: MADERA, tipo: 0, variar: 0.12, matriz: matriz([sx * 1.25, 1.55, 0]) });
          // la puerta y un ventanuco
          c.agregar(new THREE.BoxGeometry(0.8, 1.6, 0.04), { color: '#2e241b', tipo: 0, matriz: matriz([-0.45, 1.3, -1.21]) });
          c.agregar(new THREE.BoxGeometry(0.45, 0.4, 0.04), { color: '#1d1712', tipo: 0, matriz: matriz([0.6, 1.9, -1.21]) });
          // el techo de dos aguas y la cumbrera
          for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(2.95, 0.08, 1.52), { color: TECHO, tipo: 4, variar: 0.08, matriz: matriz([0, 2.93, sz * 0.66], [sz * 0.52, 0, 0]) });
          c.agregar(new THREE.BoxGeometry(2.95, 0.12, 0.14), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 3.3, 0]) });
          // los hastiales: tablas cada vez más cortas
          for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
            c.agregar(new THREE.BoxGeometry(0.08, 0.22, 2.1 - i * 0.7), { color: TABLA, tipo: 0, variar: 0.1, matriz: matriz([sx * 1.25, 2.72 + i * 0.22, 0]) });
          }
        },
      },
      {
        nombre: 'La rueda y la muela',
        pide: { tabla: 8, tronco: 3, piedra: 2 },
        dice: 'Veinte paletas alrededor de un eje de lenga. El agua empuja, el eje entra por la pared y mueve la muela.',
        termina: true,
        arma(c) {
          // la caja de engranajes contra la pared del agua
          c.agregar(new THREE.BoxGeometry(0.28, 0.8, 0.8), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([1.36, 1.2, 0]) });
          // muelas de repuesto apoyadas junto a la puerta y una bolsa de harina
          c.agregar(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 12), { color: '#8b8478', tipo: 4, variar: 0.1, matriz: matriz([-1.05, 0.52, -1.55], [0.2, 0, 0]) });
          c.agregar(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 8), { color: '#3a352e', tipo: 4, matriz: matriz([-1.05, 0.54, -1.55], [0.2, 0, 0]) });
          c.agregar(new THREE.BoxGeometry(0.34, 0.46, 0.26), { color: BLANCO, tipo: 0, variar: 0.05, matriz: matriz([0.35, 0.62, -1.5], [0, 0.3, 0.05]) });
        },
      },
    ],
    fisica({ segmento }) {
      segmento(-1.3, -1.2, 1.3, -1.2, 0.1, -0.2, 3.1);
      segmento(-1.3, 1.2, 1.3, 1.2, 0.1, -0.2, 3.1);
      segmento(-1.3, -1.2, -1.3, 1.2, 0.1, -0.2, 3.1);
      segmento(1.3, -1.2, 1.3, 1.2, 0.1, -0.2, 3.1);
    },
  },
  {
    id: 'aserradero', nombre: 'Aserradero', pieza: true, categoria: 'trabajo',
    radio: 1.9, ancho: 3.4, fondo: 2.0, alto: 2.5, separacion: 4, distancia: 4.5,
    funciones: ['aserradero'],
    texto: 'Una mesa larga con una sierra circular y un techito de tablas. Movida por un molino de agua a menos de 14 m, convierte solos los troncos que le cargás en tablas: cinco por tronco (E para cargar y para sacar).',
    etapas: [
      {
        nombre: 'La mesa y el carro',
        pide: { tronco: 4, tabla: 6 },
        dice: 'Cuatro patas de tronco y una mesa larga: el carro lleva el tronco contra la sierra.',
        arma(c, P, datos, suelo) {
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            c.agregar(new THREE.CylinderGeometry(0.09, 0.1, 0.8, 7), { color: CORTEZA, tipo: 0, variar: 0.1, matriz: matriz([sx * 1.4, 0.4, sz * 0.32]) });
            calce(c, suelo, sx * 1.4, sz * 0.32, 0.01, 0.1, CORTEZA, 0);   // 3.0.1
          }
          c.agregar(new THREE.BoxGeometry(3.2, 0.1, 0.84), { color: TABLA, tipo: 0, variar: 0.12, matriz: matriz([0, 0.84, 0]) });
          // los rieles del carro y el tronco a medio aserrar
          for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(3.2, 0.06, 0.06), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 0.92, sz * 0.36]) });
          c.agregar(new THREE.CylinderGeometry(0.2, 0.22, 1.3, 9), { color: CORTEZA, tipo: 0, variar: 0.1, matriz: matriz([-0.95, 1.12, 0], [0, 0, Math.PI / 2]) });
          c.agregar(new THREE.CircleGeometry(0.19, 9), { color: '#c9a878', tipo: 0, matriz: matriz([-0.29, 1.12, 0], [0, Math.PI / 2, 0]) });
        },
      },
      {
        nombre: 'La sierra y el techito',
        pide: { tabla: 6, tronco: 2, piedra: 2 },
        dice: 'El eje de la sierra baja del molino por una correa larga. Arriba, un techito para que no se moje.',
        termina: true,
        arma(c, P, datos, suelo) {
          // el bastidor de la sierra
          for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.1, 0.7, 0.1), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0.1, 1.24, sz * 0.46]) });
          c.agregar(new THREE.BoxGeometry(0.14, 0.1, 1.0), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0.1, 1.6, 0]) });
          // cuatro postes y el techo de una agua
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            c.agregar(new THREE.CylinderGeometry(0.07, 0.08, 2.3, 6), { color: MADERA, tipo: 0, variar: 0.1, matriz: matriz([sx * 1.55, 1.15, sz * 0.85]) });
            calce(c, suelo, sx * 1.55, sz * 0.85, 0.01, 0.08, MADERA, 0);   // 3.0.1
          }
          c.agregar(new THREE.BoxGeometry(3.6, 0.07, 2.1), { color: TECHO, tipo: 4, variar: 0.08, matriz: matriz([0, 2.34, 0], [0.12, 0, 0]) });
          // las piedras que calzan la mesa y tablas apiladas en la punta
          for (const sx of [-1, 1]) c.agregar(new THREE.IcosahedronGeometry(0.16, 0), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([sx * 1.4, 0.06, 0.62], [sx, 0.4, 0]) });
          for (let i = 0; i < 4; i++) c.agregar(new THREE.BoxGeometry(1.0, 0.05, 0.24), { color: i % 2 ? TABLA : '#9a7a56', tipo: 0, variar: 0.08, matriz: matriz([1.05, 0.93 + i * 0.05, -0.1 + (i % 2) * 0.12]) });
        },
      },
    ],
    // 3.0.1: también los cuatro postes del techito (antes se los atravesaba)
    fisica({ segmento, circulo }) { segmento(-1.5, 0, 1.5, 0, 0.45, 0, 1.2); for (const sx of [-1, 1]) for (const sz of [-1, 1]) circulo(sx * 1.55, sz * 0.85, 0.09, 0, 2.3); },
  },
  {
    id: 'estacion-meteo', nombre: 'Estación meteorológica', pieza: true, categoria: 'exterior',
    radio: 1.5, ancho: 2.2, fondo: 1.8, alto: 4.3, separacion: 8, distancia: 4,
    funciones: ['meteo', 'radio'],
    texto: 'La casilla blanca del termómetro, un mástil con veleta y anemómetro, y una radio a batería. Con E se lee el pronóstico de hoy, mañana y pasado —tormentas, nevadas, viento— y se escucha a los otros refugios. En el Desafío avisa también cómo viene la noche.',
    etapas: [
      {
        nombre: 'El abrigo del termómetro',
        pide: { tabla: 5, piedra: 2 },
        dice: 'Una casilla blanca con persianas, a metro y medio del suelo: así el termómetro mide el aire y no el sol.',
        arma(c, P, datos, suelo) {
          const x0 = -0.45;
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            c.agregar(new THREE.BoxGeometry(0.06, 1.12, 0.06), { color: BLANCO, tipo: 4, matriz: matriz([x0 + sx * 0.24, 0.56, sz * 0.2]) });
            calce(c, suelo, x0 + sx * 0.24, sz * 0.2, 0.01, 0.04, BLANCO, 4);   // 3.0.1
          }
          c.agregar(new THREE.BoxGeometry(0.62, 0.52, 0.5), { color: BLANCO, tipo: 4, variar: 0.03, matriz: matriz([x0, 1.36, 0]) });
          // las persianas: listones oscuros al frente
          for (let i = 0; i < 5; i++) c.agregar(new THREE.BoxGeometry(0.5, 0.02, 0.02), { color: '#a9a497', tipo: 4, matriz: matriz([x0, 1.18 + i * 0.09, -0.26]) });
          c.agregar(new THREE.BoxGeometry(0.72, 0.05, 0.6), { color: BLANCO, tipo: 4, matriz: matriz([x0, 1.65, 0], [0.08, 0, 0]) });
          for (const [x, z] of [[-0.8, 0.5], [-0.1, 0.55]]) c.agregar(new THREE.IcosahedronGeometry(0.15, 0), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([x, 0.07, z], [x, z, 0]) });
        },
      },
      {
        nombre: 'El mástil y la radio',
        pide: { tronco: 2, tabla: 2, piedra: 1 },
        dice: 'Un mástil de ciprés con la veleta y las cazoletas arriba, riendas de alambre y, al pie, la radio en su cajón.',
        termina: true,
        arma(c, P, datos, suelo) {
          const { lx, alto } = MASTIL_ESTACION;
          calce(c, suelo, lx, 0, 0.0, 0.26);   // 3.0.1
          c.agregar(new THREE.CylinderGeometry(0.05, 0.08, alto, 7), { color: MADERA, tipo: 0, variar: 0.08, matriz: matriz([lx, alto / 2, 0]) });
          c.agregar(new THREE.CylinderGeometry(0.2, 0.26, 0.2, 8), { color: PIEDRA, tipo: 4, variar: 0.12, matriz: matriz([lx, 0.1, 0]) });
          // las riendas
          for (const a of [0, 2.09, 4.19]) {
            const dx = Math.cos(a) * 0.85, dz = Math.sin(a) * 0.85, largo = Math.hypot(0.85, alto * 0.6);
            c.agregar(new THREE.CylinderGeometry(0.008, 0.008, largo, 3), { color: '#6f6a62', tipo: 4,
              matriz: matriz([lx + dx / 2, alto * 0.3, dz / 2], [0, -a, Math.atan2(0.85, alto * 0.6)]) });
          }
          // la radio en su cajón, con la antena
          c.agregar(new THREE.BoxGeometry(0.42, 0.34, 0.3), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([lx, 0.37, 0.5]) });
          c.agregar(new THREE.BoxGeometry(0.36, 0.2, 0.02), { color: '#2f3a2c', tipo: 4, matriz: matriz([lx, 0.38, 0.35]) });
          c.agregar(new THREE.CylinderGeometry(0.01, 0.01, 1.1, 4), { color: '#6f6a62', tipo: 4, matriz: matriz([lx + 0.15, 1.08, 0.55]) });
          c.agregar(new THREE.BoxGeometry(0.1, 0.2, 0.1), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([lx, 0.1, 0.5]) });
        },
      },
    ],
    fisica({ circulo }) { circulo(MASTIL_ESTACION.lx, 0, 0.18, 0, MASTIL_ESTACION.alto); circulo(-0.45, 0, 0.32, 0, 1.7); },
  },
  {
    id: 'radio-refugio', nombre: 'Radio del refugio', pieza: true, categoria: 'mobiliario',
    radio: 0.6, ancho: 0.6, fondo: 0.5, alto: 1.2, separacion: 3, apoyaEnPlataforma: true, confort: 1, alcanceE: 1.5,
    funciones: ['radio'],
    texto: 'Una radio a batería en un cajón de tablas, con la antena hasta el techo. Para escuchar a los otros refugios desde adentro: avisos del tiempo, rumores y algún pedido (E).',
    etapas: [
      {
        nombre: 'Armarla', pide: { tabla: 3, piedra: 1 }, termina: true,
        dice: 'Un cajón, la batería envuelta en lana y la antena por la ventana.',
        arma(c) {
          c.agregar(new THREE.BoxGeometry(0.5, 0.5, 0.34), { color: TABLA, tipo: 0, variar: 0.1, matriz: matriz([0, 0.25, 0]) });
          c.agregar(new THREE.BoxGeometry(0.44, 0.24, 0.02), { color: '#2f3a2c', tipo: 4, matriz: matriz([0, 0.34, -0.18]) });
          for (const x of [-0.12, 0.1]) c.agregar(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8), { color: '#c9c2b0', tipo: 4, matriz: matriz([x, 0.34, -0.2], [Math.PI / 2, 0, 0]) });
          c.agregar(new THREE.CylinderGeometry(0.01, 0.012, 0.9, 4), { color: '#6f6a62', tipo: 4, matriz: matriz([0.18, 0.95, 0.08], [0.08, 0, 0.06]) });
        },
      },
    ],
    fisica({ circulo }) { circulo(0, 0, 0.3, 0, 0.55); },
  },
];

// Las obras que trabajan (ver `obraQueTrabajaCerca` en main.js): E las usa.
export const MAQUINAS_QUE_TRABAJAN = ['molino-agua', 'aserradero', 'estacion-meteo', 'radio-refugio'];
