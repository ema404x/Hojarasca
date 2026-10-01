// 2.9: los planos de «vehículos y construcción en grande»: el varadero con el velero, el
// poste de tirolesa y el estribo del puente colgante. construccion.js los suma a PLANOS
// (una línea, después del bloque de los planos grandes). Son piezas de una sola etapa,
// sólo de Relax. La tirolesa y el puente se arman con dos puntas: el cable y el tablero
// los tiende `tirolesa.js` entre dos puntas terminadas; el velero lo pone `vela.js` en la
// punta del varadero. Acá va sólo lo que es de la obra: materiales tipo 0 (madera, soga,
// lona) y tipo 4 (piedra, tablas).
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { calce } from './calces.js';

const MADERA = '#6b5238';
const MADERA_OSCURA = '#4a3b2c';
const TABLA = '#8a6b4a';
const PIEDRA = '#7d766c';
const SOGA = '#c9b894';

// un cilindro fino de `a` a `b` (coordenadas locales de la obra)
function vara(c, a, b, r, color, tipo = 0) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const largo = d.length() || 0.01;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  const m = new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(1, 1, 1));
  c.agregar(new THREE.CylinderGeometry(r, r, largo, 5), { color, tipo, variar: 0.08, matriz: m });
}

// Igual que las piezas de construccion.js: una sola etapa, "Armarlo"
function pieza(p) {
  return {
    ...p,
    ancho: p.ancho ?? p.radio * 2, fondo: p.fondo ?? p.radio * 2, alto: p.alto ?? 1,
    etapas: [{ nombre: 'Armarlo', pide: p.pide, dice: p.texto, termina: true, arma: p.arma }],
  };
}

export const PLANOS_VEHICULOS = [
  // El varadero: como el embarcadero, arranca en la orilla y la punta da al agua honda del
  // lago (lo revisa `sobreAgua` en construccion.js). Terminado, el velero queda amarrado al
  // costado de la punta.
  pieza({
    id: 'varadero-velero', nombre: 'Varadero y velero', pieza: true, soloRelax: true, categoria: 'exterior',
    radio: 3.2, ancho: 2.2, fondo: 6.0, alto: 0.6, separacion: 12, sobreAgua: true, funciones: ['varadero'],
    texto: 'Un muelle ancho con dos varas para botar, y un velero de madera con su vela de lana tejida. Con viento se cruza el lago: A y D el timón, W y S la escota, y hay que bordear para ir contra el viento.',
    pide: { tronco: 8, tabla: 16, lana: 2 },
    fisica(h) { h.plataforma(0, 0, 2.2, 6.0, 0.46, 0.14, 0.55); },
    arma(c) {
      for (let i = 0; i < 20; i++) c.agregar(new THREE.BoxGeometry(2.2, 0.07, 0.28), { color: i % 3 ? TABLA : '#795f44', tipo: 4, variar: 0.12, matriz: matriz([0, 0.42, -2.85 + i * 0.3]) });
      for (const sx of [-1, 0, 1]) c.agregar(new THREE.BoxGeometry(0.12, 0.14, 6.0), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * 0.98, 0.32, 0]) });
      for (const sx of [-0.98, 0.98]) for (const z of [-2.8, -1.0, 0.8, 2.6]) {
        c.agregar(new THREE.CylinderGeometry(0.09, 0.1, 2.0, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx, -0.5, z]) });
      }
      // las dos varas de botar, bajando al agua por el medio
      for (const sx of [-0.35, 0.35]) c.agregar(new THREE.BoxGeometry(0.1, 0.1, 6.4), { color: MADERA, tipo: 0, matriz: matriz([sx, 0.5, 0.2], [0.05, 0, 0]) });
      // bitas en la punta, a los dos lados
      for (const sx of [-0.9, 0.9]) c.agregar(new THREE.CylinderGeometry(0.08, 0.09, 0.5, 6), { color: MADERA, tipo: 0, matriz: matriz([sx, 0.7, 2.7]) });
      // el caballete con la vela de repuesto doblada y el rollo de soga, en la orilla
      for (const sx of [-0.55, 0.55]) c.agregar(new THREE.BoxGeometry(0.08, 0.6, 0.5), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx, 0.75, -2.45]) });
      c.agregar(new THREE.BoxGeometry(1.3, 0.16, 0.42), { color: '#e2d8c2', tipo: 0, variar: 0.05, matriz: matriz([0, 1.12, -2.45]) });
      for (let i = 0; i < 3; i++) c.agregar(new THREE.CylinderGeometry(0.2 - i * 0.03, 0.2 - i * 0.03, 0.05, 10, 1, true), { color: SOGA, tipo: 0, matriz: matriz([0.75, 0.49 + i * 0.05, 1.9]) });
    },
  }),
  // El poste de tirolesa: un palo alto con tres riendas. Con dos postes terminados, a
  // menos de 80 m, se tiende el cable entre los dos (tirolesa.js). Se larga con E desde el
  // de arriba: la gravedad lleva, y en el llano se va tirando a mano.
  pieza({
    id: 'poste-tirolesa', nombre: 'Poste de tirolesa', pieza: true, soloRelax: true, categoria: 'exterior',
    radio: 1.3, ancho: 1.8, fondo: 1.8, alto: 3.8, separacion: 6, pendienteMax: 0.6, distSendero: 0.8, funciones: ['tirolesa'],
    texto: 'Un palo de coihue bien enterrado, con tres riendas y la roldana arriba. Poné dos (hasta 80 m entre uno y otro): el cable se tiende solo entre los dos. Desde el más alto, E y te largás; subiendo no anda.',
    pide: { tronco: 4, tabla: 2 },
    fisica(h) { h.circulo(0, 0, 0.16, -0.05, 3.9); },
    arma(c) {
      c.agregar(new THREE.CylinderGeometry(0.12, 0.16, 3.9, 8), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([0, 1.9, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 8), { color: MADERA, tipo: 0, matriz: matriz([0, 3.86, 0]) });
      // collar de piedras al pie
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        c.agregar(new THREE.IcosahedronGeometry(0.16, 0), { color: PIEDRA, tipo: 4, variar: 0.18, matriz: matriz([Math.cos(a) * 0.3, 0.07, Math.sin(a) * 0.3], [i, i * 1.3, 0], [1.2, 0.7, 1]) });
      }
      // tres riendas a estacas
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        const px = Math.cos(a) * 1.5, pz = Math.sin(a) * 1.5;
        vara(c, [0, 3.55, 0], [px, 0.12, pz], 0.012, SOGA);
        c.agregar(new THREE.CylinderGeometry(0.035, 0.045, 0.4, 5), { color: MADERA, tipo: 0, matriz: matriz([px, 0.14, pz], [0.3 * Math.cos(a), 0, -0.3 * Math.sin(a)]) });
      }
      // los tacos para subir hasta la roldana
      for (let i = 0; i < 6; i++) c.agregar(new THREE.BoxGeometry(0.34, 0.05, 0.09), { color: MADERA, tipo: 0, matriz: matriz([0, 0.45 + i * 0.45, 0], [0, i * 1.05, 0], [1, 1, 1]) });
    },
  }),
  // El estribo del puente colgante: un cajón de troncos relleno de piedra con piso de
  // tablas. Con dos estribos terminados a menos de 30 m (a los dos lados del arroyo o de
  // una quebrada), se tiende el puente entre los dos (tirolesa.js): tablas, sogas y un
  // poco de comba, y se camina.
  pieza({
    id: 'estribo-puente', nombre: 'Estribo de puente colgante', pieza: true, soloRelax: true, categoria: 'exterior',
    radio: 1.1, ancho: 1.6, fondo: 1.6, alto: 0.6, separacion: 3, pendienteMax: 0.6, distSendero: 0.5, funciones: ['puente-colgante'],
    texto: 'Un cajón de troncos lleno de piedra, con piso de tablas. Poné uno de cada lado del arroyo o de la quebrada (hasta 30 m): el puente de tablas y sogas se tiende solo entre los dos.',
    pide: { tronco: 4, tabla: 8, piedra: 4 },
    fisica(h) { h.plataforma(0, 0, 1.5, 1.5, 0.46, 0.14, 0.55); },
    arma(c, P, datos, suelo) {
      // cuatro hiladas de troncos cruzados
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
        const y = 0.06 + k * 0.1, gira = k % 2 === 0;
        c.agregar(new THREE.CylinderGeometry(0.07, 0.07, 1.56, 6), { color: k % 2 ? MADERA : MADERA_OSCURA, tipo: 0, variar: 0.1,
          matriz: gira ? matriz([0, y, s * 0.68], [0, 0, Math.PI / 2]) : matriz([s * 0.68, y, 0], [Math.PI / 2, 0, 0]) });
      }
      for (let i = 0; i < 5; i++) c.agregar(new THREE.IcosahedronGeometry(0.2, 0), { color: PIEDRA, tipo: 4, variar: 0.18, matriz: matriz([(i % 3 - 1) * 0.35, 0.2, (i < 3 ? -0.25 : 0.3)], [i, i * 0.7, 0], [1.1, 0.8, 1]) });
      for (let i = 0; i < 5; i++) c.agregar(new THREE.BoxGeometry(1.5, 0.06, 0.29), { color: i % 2 ? TABLA : '#795f44', tipo: 4, variar: 0.1, matriz: matriz([0, 0.42, -0.6 + i * 0.3]) });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        c.agregar(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * 0.7, 0.3, sz * 0.7]) });
        calce(c, suelo, sx * 0.7, sz * 0.7, -0.04, 0.07, MADERA_OSCURA, 0);   // 3.0.1: en la ladera, hasta el suelo
      }
    },
  }),
];
