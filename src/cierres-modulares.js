// 4.26.1 (A): las habitaciones modulares cerradas (las piezas de construccion.js y las de planos-ampliar.js: la pared de piedra y el techo de teja).
// Desde adentro se veía el bosque por todos lados: entre el borde de las paredes y las tablas del techo queda una franja abierta (de 20 cm bajo el alero
// del techo de dos aguas a 85 cm bajo el lado alto del de una agua), los hastiales están abiertos, entre tabla y tabla del techo y del piso quedan 2 cm,
// entre piedra y piedra 2 cm y abajo de las paredes, 2 a 8 cm. Las paredes y el piso llevan un alma oscura en el medio (sólo se ve por las juntas,
// oscura como antes la sombra de adentro). El techo cierra la franja y los hastiales SÓLO sobre los lados con una pared que cierra y si la habitación
// de abajo está cerrada (ver `habitacionModular` en construccion.js): una galería techada sin paredes queda igual que antes. Lo que tiene que cerrar se
// lo pasa el sistema por los datos de la obra (CIERRES_TECHO: los lados, en el marco del techo, separados por espacios). Todo en la misma malla de cada
// pieza: sin llamadas de dibujo nuevas.
import * as THREE from 'three';
import { matriz } from './geometria.js';

export const CIERRES_TECHO = new WeakMap();
// el eje de las paredes, desde el centro del módulo (el borde del piso menos 8 cm: ver resolverSnap en construccion.js)
export const EJE_MURO_MODULAR = 1.42;
// desde el pie del techo (2,26 sobre el piso): 7 cm debajo del borde de las paredes (2,14), metido en todas (el tabique llega a 2,10)
export const PIE_CIERRE = -0.19;
// hasta dónde llegan el forro y los cierres (adentro de la cara de afuera de las paredes, a 1,485: de afuera no asoman)
export const L_CIERRE = 1.45;
const CIERRE_TECHO = '#2a211a';   // (oscuro como el entretecho a la sombra que se veía por el hueco)
const ALMA_MODULAR = '#2f241a';
const TABLA = '#8a6b4a';

// `bajo(x)`: la cara de abajo de las tablas del techo a `x` (en el marco del techo el agua corre a lo largo de x); `tramos`: los tramos rectos de esa
// cara entre −L_CIERRE y L_CIERRE. El forro va 5 mm debajo de las tablas (2 cm de grueso) y cada cierre sube, en el eje de la pared, hasta el medio del
// forro. Sin forro (un techo con la cara de abajo entera, como el de teja), los cierres suben hasta 1 cm adentro de las tablas.
export function cierresDeTecho(c, datos, bajo, tramos, { forro = true } = {}) {
  const lados = CIERRES_TECHO.get(datos) || '';
  if (!lados) return;
  const L = L_CIERRE, E = EJE_MURO_MODULAR;
  const incl = (x0, x1) => Math.atan2(bajo(x1) - bajo(x0), x1 - x0);
  const tope = (x, a) => (forro ? bajo(x) - 0.015 / Math.cos(a) : bajo(x));
  if (forro) for (const [x0, x1] of tramos) {
    const a = incl(x0, x1), xm = (x0 + x1) / 2;
    c.agregar(new THREE.BoxGeometry((x1 - x0) / Math.cos(a) + 0.02, 0.02, 2 * L), { color: TABLA, tipo: 4, variar: 0.08, matriz: matriz([xm, tope(xm, a), 0], [0, 0, a]) });
  }
  // los lados del agua (±x): una tabla oscura del borde de la pared al forro
  for (const sx of [-1, 1]) {
    if (!lados.includes(sx < 0 ? '-x' : '+x')) continue;
    const [x0, x1] = sx < 0 ? tramos[0] : tramos[tramos.length - 1], y1 = tope(sx * E, incl(x0, x1)) + 0.01;
    c.agregar(new THREE.BoxGeometry(0.03, y1 - PIE_CIERRE, 2 * L), { color: CIERRE_TECHO, tipo: 4, variar: 0.06, matriz: matriz([sx * E, (PIE_CIERRE + y1) / 2, 0]) });
  }
  // los hastiales (±z): del borde de la pared al forro, por tramo (las dos caras: se ven de adentro y de afuera)
  for (const sz of [-1, 1]) {
    if (!lados.includes(sz < 0 ? '-z' : '+z')) continue;
    const v = [];
    for (const [x0, x1] of tramos) {
      const a = incl(x0, x1), A = [x0, PIE_CIERRE, sz * E], B = [x1, PIE_CIERRE, sz * E], C = [x1, tope(x1, a) + 0.01, sz * E], D = [x0, tope(x0, a) + 0.01, sz * E];
      v.push(...A, ...B, ...C, ...A, ...C, ...D, ...B, ...A, ...C, ...C, ...A, ...D);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    c.agregar(g, { color: CIERRE_TECHO, tipo: 4, variar: 0.06, matriz: matriz([0, 0, 0]) });
  }
}

// El alma de una pared modular: una tabla oscura en el medio del grueso, de 1 cm debajo del pie (entra en el piso) a `y1`, en los tramos [x0, x1, y0, y1]
// de su largo (sin el vano de la puerta ni el de la ventana). La tapan las tablas (o las piedras): sólo se ve por las juntas.
export function almaModular(c, tramos) {
  for (const [x0, x1, y0, y1] of tramos) c.agregar(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.02), { color: ALMA_MODULAR, tipo: 4, variar: 0.05, matriz: matriz([(x0 + x1) / 2, (y0 + y1) / 2, 0]) });
}
