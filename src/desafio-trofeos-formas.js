// 4.10 base: los siete trofeos en 3D y el tablero donde se cuelgan. Piezas chicas y baratas, de material tipo 0 (madera, hongo, raíz)
// o tipo 4 (piedra, metal), todas fusionadas en la malla del tablero (una sola; la arma la pieza `tablero-trofeos`, ver planos-trofeos.js).
// Cada trofeo está en el sistema del tablero: x a lo ancho, y arriba, z hacia el frente (el frente mira a -z); `armarTrofeo` lo pone
// de pie sobre su estante en (x, y, z).
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { TROFEOS, TABLERO, sitioDeTrofeo } from './desafio-trofeos.js';

const MADERA = '#6b5238', MADERA_OSCURA = '#4a3b2c', TABLA = '#8a6b4a', PIEDRA = '#7d766c';
const AMBAR = '#f0b64a', CORTEZA = '#6a4e33', MUSGO = '#4f6b3a';

// Un trofeo apoyado en (x, y, z) (y es el pie). `esc` lo agranda o lo achica.
export function armarTrofeo(c, id, x, y, z, esc = 1) {
  const at = (dx, dy, dz, rot = [0, 0, 0], e = [1, 1, 1]) => matriz([x + dx * esc, y + dy * esc, z + dz * esc], rot, [e[0] * esc, e[1] * esc, e[2] * esc]);
  switch (id) {
    case 'casco': {
      // el casco de corteza del primer mandamás: una media esfera con el ala, una cresta y un poco de musgo
      c.agregar(new THREE.SphereGeometry(0.2, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), { color: CORTEZA, tipo: 0, variar: 0.12, matriz: at(0, 0.02, 0, [0, 0, 0], [1, 0.85, 1.05]) });
      c.agregar(new THREE.CylinderGeometry(0.235, 0.24, 0.035, 10), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: at(0, 0.02, 0) });
      c.agregar(new THREE.BoxGeometry(0.04, 0.09, 0.3), { color: MADERA, tipo: 0, variar: 0.1, matriz: at(0, 0.19, 0) });
      for (const [dx, dz] of [[-0.1, -0.08], [0.09, 0.05]]) c.agregar(new THREE.SphereGeometry(0.05, 6, 4), { color: MUSGO, tipo: 0, variar: 0.14, matriz: at(dx, 0.17, dz, [0, 0, 0], [1, 0.55, 1]) });
      break;
    }
    case 'hongo': {
      // un hongo grande: pie claro, sombrero rojizo con manchas
      c.agregar(new THREE.CylinderGeometry(0.05, 0.075, 0.2, 7), { color: '#d9c9a4', tipo: 0, variar: 0.08, matriz: at(0, 0.1, 0) });
      c.agregar(new THREE.SphereGeometry(0.22, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), { color: '#a2452f', tipo: 0, variar: 0.1, matriz: at(0, 0.19, 0, [0, 0, 0], [1, 0.7, 1]) });
      for (const [dx, dz, r] of [[-0.09, -0.12, 0.034], [0.07, -0.14, 0.028], [0.13, -0.02, 0.03], [-0.13, 0.0, 0.026], [0.0, -0.17, 0.024]]) {
        c.agregar(new THREE.SphereGeometry(r, 5, 4), { color: '#efe3c6', tipo: 0, variar: 0.05, matriz: at(dx, 0.3 - (Math.abs(dx) * 0.55), dz) });
      }
      break;
    }
    case 'ojo': {
      // la piedra oscura de la sombra con un ojo de ámbar que mira de frente
      c.agregar(new THREE.IcosahedronGeometry(0.18, 0), { color: '#2d2c35', tipo: 4, variar: 0.12, matriz: at(0, 0.17, 0, [0.2, 0.6, 0], [1, 1.1, 0.95]) });
      c.agregar(new THREE.SphereGeometry(0.075, 8, 5), { color: AMBAR, tipo: 4, variar: 0.04, matriz: at(0, 0.19, -0.14, [0, 0, 0], [1.25, 0.9, 0.5]) });
      c.agregar(new THREE.BoxGeometry(0.03, 0.09, 0.03), { color: '#1a1814', tipo: 4, variar: 0, matriz: at(0, 0.19, -0.165) });
      break;
    }
    case 'piedra': {
      // una de las piedras del artillero, partida: vetas de ámbar en la cara de adelante
      c.agregar(new THREE.IcosahedronGeometry(0.19, 0), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: at(0, 0.16, 0, [0.4, 0.3, 0.2], [1.05, 0.9, 1]) });
      for (const [dx, dy, r] of [[-0.05, 0.2, 0.5], [0.05, 0.13, -0.4], [0.0, 0.07, 0.15]]) {
        c.agregar(new THREE.BoxGeometry(0.15, 0.022, 0.02), { color: AMBAR, tipo: 4, variar: 0.05, matriz: at(dx, dy, -0.17, [0, 0, r]) });
      }
      break;
    }
    case 'pina': {
      // la piña del Coihue Viejo: un cuerpo ancho, escamas en tres vueltas y la punta
      c.agregar(new THREE.CylinderGeometry(0.1, 0.14, 0.3, 8), { color: '#5d4630', tipo: 0, variar: 0.1, matriz: at(0, 0.17, 0) });
      c.agregar(new THREE.ConeGeometry(0.1, 0.13, 8), { color: '#6a4e33', tipo: 0, variar: 0.1, matriz: at(0, 0.385, 0) });
      for (let fila = 0; fila < 3; fila++) {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + fila * 0.5, r = 0.14 - fila * 0.018, yy = 0.06 + fila * 0.1;
          c.agregar(new THREE.BoxGeometry(0.085, 0.06, 0.03), { color: fila % 2 ? '#8b6a43' : '#7a5a3a', tipo: 0, variar: 0.1,
            matriz: at(Math.sin(a) * r, yy + 0.04, Math.cos(a) * r, [-0.35, a, 0]) });
        }
      }
      break;
    }
    case 'corona': {
      // la corona de raíces del Rey Duende: aro de raíz, cinco puntas de metal y tres gemas de ámbar
      c.agregar(new THREE.CylinderGeometry(0.2, 0.18, 0.1, 11, 1, true), { color: '#5b4a36', tipo: 0, variar: 0.1, matriz: at(0, 0.07, 0) });
      c.agregar(new THREE.TorusGeometry(0.19, 0.022, 4, 12), { color: '#c89a48', tipo: 4, variar: 0.06, matriz: at(0, 0.12, 0, [Math.PI / 2, 0, 0]) });
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        c.agregar(new THREE.ConeGeometry(0.036, 0.14, 4), { color: '#c89a48', tipo: 4, variar: 0.06, matriz: at(Math.sin(a) * 0.19, 0.19, Math.cos(a) * 0.19) });
      }
      for (const a of [-0.9, 0, 0.9]) c.agregar(new THREE.SphereGeometry(0.03, 5, 4), { color: AMBAR, tipo: 4, variar: 0.03, matriz: at(Math.sin(a) * 0.2, 0.085, -Math.cos(a) * 0.2) });
      break;
    }
    case 'raiz': {
      // una raíz retorcida de la cueva: tres tramos que se doblan y un hongo chico prendido
      c.agregar(new THREE.CylinderGeometry(0.05, 0.075, 0.24, 6), { color: '#5b4a36', tipo: 0, variar: 0.12, matriz: at(-0.03, 0.12, 0, [0, 0, 0.18]) });
      c.agregar(new THREE.CylinderGeometry(0.04, 0.052, 0.22, 6), { color: '#6a5640', tipo: 0, variar: 0.12, matriz: at(0.03, 0.31, 0, [0, 0, -0.5]) });
      c.agregar(new THREE.CylinderGeometry(0.025, 0.04, 0.18, 5), { color: '#5b4a36', tipo: 0, variar: 0.12, matriz: at(0.13, 0.46, 0, [0, 0, -1.0]) });
      c.agregar(new THREE.SphereGeometry(0.055, 6, 4), { color: '#4a3b2c', tipo: 0, variar: 0.12, matriz: at(-0.065, 0.045, 0, [0, 0, 0], [1.3, 0.8, 1]) });
      c.agregar(new THREE.SphereGeometry(0.045, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), { color: '#d8b86a', tipo: 0, variar: 0.08, matriz: at(0.05, 0.2, -0.05, [-0.6, 0, 0]) });
      break;
    }
    default: break;
  }
}

// El tablero entero: dos postes, la tabla de atrás, el tejadito, dos estantes y, en cada lugar, o el trofeo que se ganó o una clavija
// vacía. `colgados` son los ids que hay que mostrar.
export function armarTablero(c, colgados = []) {
  const A = TABLERO.ancho, F = TABLERO.fondo;
  for (const x of [-A / 2 - 0.08, A / 2 + 0.08]) c.agregar(new THREE.BoxGeometry(0.12, TABLERO.patas + 0.45, 0.14), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([x, (TABLERO.patas + 0.45) / 2, 0]) });
  c.agregar(new THREE.BoxGeometry(A + 0.1, 1.7, 0.07), { color: TABLA, tipo: 0, variar: 0.1, matriz: matriz([0, 1.5, F / 2 - 0.035]) });
  for (const y of [0.66, 2.34]) c.agregar(new THREE.BoxGeometry(A + 0.2, 0.07, F), { color: MADERA, tipo: 0, variar: 0.1, matriz: matriz([0, y, 0]) });
  c.agregar(new THREE.BoxGeometry(A + 0.5, 0.05, 0.62), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([0, 2.56, -0.12], [0.18, 0, 0]) });
  // los estantes (donde se apoyan los trofeos) y un tope de adelante
  for (const [y, desde, hasta] of [[1.77, 0, 4], [0.94, 4, 7]]) {
    const x0 = sitioDeTrofeo(desde).x, x1 = sitioDeTrofeo(hasta - 1).x;
    c.agregar(new THREE.BoxGeometry(Math.abs(x1 - x0) + 0.62, 0.04, 0.4), { color: MADERA, tipo: 0, variar: 0.08, matriz: matriz([(x0 + x1) / 2, y, -0.12]) });
  }
  const puestos = new Set(colgados);
  TROFEOS.forEach((t, i) => {
    const s = sitioDeTrofeo(i), pie = s.y - 0.18;
    if (puestos.has(t.id)) armarTrofeo(c, t.id, s.x, pie + 0.02, -0.12);
    else c.agregar(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 6), { color: '#2e261d', tipo: 0, variar: 0, matriz: matriz([s.x, pie + 0.16, 0.0], [Math.PI / 2, 0, 0]) });   // el lugar vacío: una marca oscura
  });
}
