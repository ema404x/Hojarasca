// 4.1 (F2): el espejo de pie de Bruno Castellanos, una pieza de mobiliario como las de planos-muebles.js (mismas reglas: el frente mira a -z y el fondo a +z,
// sólo tipo 0 y 4, la colisión sale de `fisica(h)`, sólo en el Relax). Se usa con E: abre la pantalla de creación en modo «rehacer» (el aspecto; el carácter
// queda fijo y la ropa de abrigo es la de «Tu personaje»).
//
// Reglas del plan (PLAN_CREADOR_BRUNO.md, sección 11), para que nadie se quede sin poder rehacer su aspecto:
//   · no cuesta materiales (`pide` vacío);
//   · siempre está en los planos (no hay un tope de cuántos se pueden armar);
//   · cada refugio nuevo viene con uno armado (lo coloca main.js al crear a Bruno: ver `colocarEspejoDeFabrica`).
import * as THREE from 'three';
import { AYUDAS_MUEBLES } from './planos-muebles.js';

const { caja, cil, MADERA, MADERA_OSCURA, TABLA_CLARA, BRONCE, VIDRIO } = AYUDAS_MUEBLES;

export const PIEZAS_ESPEJO = [
  {
    id: 'espejo', nombre: 'Espejo de pie', pieza: true, radio: 0.55, ancho: 0.8, fondo: 0.5, alto: 2.05, separacion: 0.5,
    categoria: 'mobiliario', soloRelax: true, apoyaEnPlataforma: true, confort: 1, alcanceE: 2.4, funciones: ['espejo'],
    texto: 'Un espejo grande con marco de madera, apoyado sobre dos patas. Con E te mirás y podés rehacer tu aspecto: la cara, el pelo, la barba y el físico. El carácter de Bruno no cambia. No cuesta nada y se puede armar todas las veces que quieras.',
    pide: {},
    fisica(h) { h.segmento(-0.3, 0, 0.3, 0, 0.12, 0, 0.62); },
    arma(c) {
      // las dos patas (largas, en el piso, adelante y atrás del marco) y el travesaño que las une
      for (const sx of [-1, 1]) caja(c, 0.06, 0.07, 0.5, [sx * 0.3, 0.035, 0], MADERA_OSCURA, { tipo: 0, variar: 0.04 });
      caja(c, 0.6, 0.05, 0.05, [0, 0.06, 0.2], MADERA_OSCURA, { tipo: 0 });
      // el marco: dos montantes y dos travesaños
      for (const sx of [-1, 1]) caja(c, 0.07, 1.75, 0.06, [sx * 0.34, 1.0, 0], MADERA, { tipo: 0 });
      caja(c, 0.75, 0.08, 0.07, [0, 1.9, 0], TABLA_CLARA);
      caja(c, 0.75, 0.08, 0.07, [0, 0.14, 0], TABLA_CLARA);
      // el vidrio (del lado de adelante, a -z) y el respaldo de tablas
      caja(c, 0.6, 1.62, 0.012, [0, 1.02, -0.022], VIDRIO, { variar: 0.015 });
      caja(c, 0.6, 1.62, 0.02, [0, 1.02, 0.025], MADERA_OSCURA, { tipo: 0, variar: 0.05 });
      // dos tornillos de bronce en el marco y una moldura arriba
      for (const sx of [-1, 1]) cil(c, 0.026, 0.026, 0.02, [sx * 0.34, 0.45, -0.04], BRONCE, { tipo: 0, lados: 8, rot: [Math.PI / 2, 0, 0] });
      cil(c, 0.05, 0.05, 0.07, [0, 2.0, 0], BRONCE, { tipo: 0, lados: 8 });
    },
  },
];
export const ESPEJO_QUE_SE_USA = { espejo: 'Mirarte al espejo' };
