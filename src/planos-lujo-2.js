// 4.2: la segunda tanda de lujo: muebles y decoración finos que cuestan pesos además de materiales (la escala y la receta están en
// PRECIOS_CONSTRUCCION.md; las cinco primeras piezas, en planos-lujo.js). Son dieciséis, de lo barato a lo muy caro, para que ahorrar valga la pena:
//   · adornos de pared y de piso: aplique de bronce ($900), jarrón con flores ($1.000), retrato al óleo ($1.200), paisaje del valle ($1.800),
//     candelabro de pie ($2.200), biombo tallado ($2.800);
//   · muebles: sillón de cuero ($3.000), estantería de roble con libros ($4.200), armario tallado ($5.500), mesa de banquete ($7.000),
//     cama con dosel ($8.500), gramola ($6.000: con E suena música suave, sintetizada: ver gramola.js);
//   · piedra (le dan uso al pico): estatua del baqueano ($11.000) y chimenea de salón ($12.000);
//   · el patio: farol de hierro forjado ($2.600) y pérgola con enredadera ($9.000).
// Mismas reglas que planos-muebles.js y planos-lujo.js: el frente mira a -z y el fondo a +z; el origen es el centro, sobre el piso; sólo tipo 0 y 4;
// la colisión sale de `fisica(h)` (lo que se cuelga de la pared no choca); sólo en el Relax; sin luces dinámicas (las llamas son sólo color)
// y ninguna pasa de ~950 triángulos.
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { AYUDAS_MUEBLES } from './planos-muebles.js';

const { caja, cil, tira, hs, MADERA, MADERA_OSCURA, TABLA_CLARA, PIEDRA, HIERRO, BRONCE, PAPEL } = AYUDAS_MUEBLES;
const ROBLE = '#8a6a43';
const ROBLE_OSCURO = '#5d4529';
const DORADO = '#c29a43';
const CERA = '#e6dcc0';
const LLAMA = '#ffcf6a';
const VINO = '#6f2c3a';
const PIEDRA_CLARA = '#9a9488';
const MARMOL = '#b9b3a6';
const VERDE = ['#4f7a3a', '#5f8a45', '#3e6a30', '#6a9a50'];
const base = { soloRelax: true, apoyaEnPlataforma: true, pieza: true };

// Lo que se usa con E (main.js lo suma a las obras que trabajan): el aviso que aparece al acercarse
export const LUJO2_QUE_SE_USA = { gramola: 'Darle cuerda a la gramola' };

// ---------------------------------------------------------------- ayudantes de este archivo
const EJE_Y = new THREE.Vector3(0, 1, 0);
// una esfera achatada o estirada (la cabeza, los hombros, una flor)
const bola = (c, r, [x, y, z], color, esc = [1, 1, 1], o = {}) => c.agregar(new THREE.SphereGeometry(r, o.w ?? 8, o.h ?? 5), {
  color, tipo: o.tipo ?? 4, variar: o.variar ?? 0.08, matriz: matriz([x, y, z], o.rot, esc),
});
// un cilindro que va del punto `a` al punto `b` (un cano, una rama, el cuerno de la gramola); `ra` en `a` y `rb` en `b`
const cano = (c, a, b, ra, rb, color, o = {}) => {
  const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b), d = q.clone().sub(p), largo = d.length();
  const mid = p.clone().add(q).multiplyScalar(0.5);
  c.agregar(new THREE.CylinderGeometry(rb, ra, largo, o.lados ?? 8), {
    color, tipo: o.tipo ?? 0, variar: o.variar ?? 0.06,
    matriz: new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromUnitVectors(EJE_Y, d.normalize()), new THREE.Vector3(1, 1, 1)),
  });
};
// una llama (sólo color) sobre una vela
const llama = (c, x, y, z, r = 0.014, h = 0.05) => c.agregar(new THREE.ConeGeometry(r, h, 4), { color: LLAMA, tipo: 4, variar: 0.04, matriz: matriz([x, y + h / 2, z]) });
// una vela con su platito: `y` es donde apoya el platito
const vela = (c, x, y, z, alto = 0.13, plato = 0.05) => {
  cil(c, plato, plato * 0.75, 0.018, [x, y + 0.009, z], BRONCE, { tipo: 0, lados: 6 });
  cil(c, 0.018, 0.018, alto, [x, y + 0.018 + alto / 2, z], CERA, { lados: 5, variar: 0.05 });
  llama(c, x, y + 0.018 + alto, z);
};
// un marco dorado: cuatro varillas y una moldura más oscura adentro. `cy` es el centro; el cuadro mira a -z
const marco = (c, w, h, cy, g = 0.07) => {
  caja(c, w, g, 0.05, [0, cy + h / 2 - g / 2, 0.02], DORADO, { tipo: 0, variar: 0.05 });
  caja(c, w, g, 0.05, [0, cy - h / 2 + g / 2, 0.02], DORADO, { tipo: 0, variar: 0.05 });
  for (const sx of [-1, 1]) caja(c, g, h - 2 * g, 0.05, [sx * (w / 2 - g / 2), cy, 0.02], DORADO, { tipo: 0, variar: 0.05 });
  caja(c, w - 2 * g + 0.02, 0.02, 0.06, [0, cy + h / 2 - g - 0.005, 0.015], '#7a5c25', { tipo: 0, variar: 0.04 });
  caja(c, w - 2 * g + 0.02, 0.02, 0.06, [0, cy - h / 2 + g + 0.005, 0.015], '#7a5c25', { tipo: 0, variar: 0.04 });
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) cil(c, 0.032, 0.032, 0.02, [sx * (w / 2 - g / 2), cy + sy * (h / 2 - g / 2), -0.012], '#e0bd62', { tipo: 0, lados: 6, rot: [Math.PI / 2, 0, 0] });
};
// la tela del cuadro: un fondo parejo, 0,5 cm atrás de lo que se pinta encima
const lienzo = (c, w, h, cy, color) => caja(c, w, h, 0.012, [0, cy, 0.0], color, { variar: 0.05 });

export const PIEZAS_LUJO_2 = [
  // ================================================================ lo barato: adornos
  {
    ...base, id: 'candelabro-pared', nombre: 'Aplique de bronce con velas', categoria: 'mobiliario', radio: 0.35, ancho: 0.5, fondo: 0.34, alto: 1.85, separacion: 0.3, confort: 1,
    texto: 'Un aplique de bronce con tres velas, para colgar en la pared a la altura de los ojos. De adorno: no da luz propia y no choca. El fondo mira a +Z.',
    pide: { tabla: 1, piedra: 2 }, pesos: 900,
    arma(c) {
      // la placa trasera con su remate y la roseta de donde salen los brazos
      caja(c, 0.16, 0.42, 0.025, [0, 1.52, 0.14], BRONCE, { tipo: 0, variar: 0.05 });
      caja(c, 0.1, 0.1, 0.025, [0, 1.8, 0.14], BRONCE, { tipo: 0, variar: 0.05, rot: [0, 0, Math.PI / 4] });
      cil(c, 0.05, 0.05, 0.03, [0, 1.47, 0.11], '#b08a45', { tipo: 0, lados: 8, rot: [Math.PI / 2, 0, 0] });
      // el brazo del medio y los dos de los costados, que suben en una voluta
      caja(c, 0.03, 0.03, 0.26, [0, 1.47, 0.0], HIERRO, { tipo: 0 });
      for (const sx of [-1, 1]) {
        caja(c, 0.24, 0.025, 0.025, [sx * 0.12, 1.45, -0.05], HIERRO, { tipo: 0 });
        caja(c, 0.025, 0.12, 0.025, [sx * 0.24, 1.5, -0.05], HIERRO, { tipo: 0 });
        c.agregar(new THREE.TorusGeometry(0.05, 0.011, 4, 6, Math.PI * 1.3), { color: HIERRO, tipo: 0, variar: 0.04, matriz: matriz([sx * 0.1, 1.5, -0.05], [0, 0, sx > 0 ? 0.4 : 1.4]) });
        vela(c, sx * 0.24, 1.56, -0.05, 0.12);
      }
      vela(c, 0, 1.485, -0.13, 0.14);
    },
  },
  {
    ...base, id: 'jarron-flores', nombre: 'Jarrón con flores', categoria: 'mobiliario', radio: 0.5, ancho: 0.9, fondo: 0.8, alto: 1.5, separacion: 0.5, confort: 1,
    texto: 'Un jarrón de loza blanca con una cinta azul, alto como una rodilla, y un ramo grande de flores del valle: rosadas, amarillas, blancas y moradas. Se pone en un rincón de la sala.',
    pide: { piedra: 3, tabla: 1 }, pesos: 1000,
    fisica(h) { h.circulo(0, 0, 0.24, 0, 0.8); },
    arma(c) {
      const LOZA = '#e6e2d4', AZUL = '#3d5f8a';
      cil(c, 0.11, 0.13, 0.06, [0, 0.03, 0], LOZA, { lados: 8, variar: 0.04 });
      cil(c, 0.22, 0.12, 0.3, [0, 0.21, 0], LOZA, { lados: 8, variar: 0.04 });
      cil(c, 0.225, 0.225, 0.035, [0, 0.27, 0], AZUL, { lados: 8, variar: 0.04 });
      cil(c, 0.13, 0.22, 0.25, [0, 0.485, 0], LOZA, { lados: 8, variar: 0.04 });
      cil(c, 0.225, 0.225, 0.03, [0, 0.45, 0], AZUL, { lados: 8, variar: 0.04 });
      cil(c, 0.085, 0.13, 0.13, [0, 0.67, 0], LOZA, { lados: 8, variar: 0.04 });
      cil(c, 0.115, 0.085, 0.05, [0, 0.765, 0], AZUL, { lados: 8, variar: 0.04 });
      // el ramo: siete tallos que abren en abanico, con hojas y una flor al final de cada uno
      const flores = [
        [[0.0, 1, 0.0], 0.68, '#d85a6a'], [[0.45, 1, 0.05], 0.6, '#f0d46a'], [[-0.45, 1, 0.1], 0.58, '#e8e4da'], [[0.2, 1, -0.4], 0.62, '#9a7ad0'],
        [[-0.25, 1, -0.35], 0.54, '#f0a05a'], [[0.3, 1, 0.38], 0.5, '#e8e4da'], [[-0.4, 1, -0.05], 0.4, '#d85a6a'],
      ];
      flores.forEach(([dir, largo, color], i) => {
        tira(c, 0.016, largo, 0.016, [0, 0.77, 0], dir, '#4f7a3a', { variar: 0.06 });
        const v = new THREE.Vector3(...dir).normalize();
        const f = [v.x * largo, 0.77 + v.y * largo, v.z * largo];
        bola(c, 0.065, f, color, [1, 0.8, 1], { w: 6, h: 4, variar: 0.1 });
        cil(c, 0.02, 0.02, 0.02, [f[0], f[1] + 0.04, f[2]], '#e8c04a', { lados: 5, variar: 0.05 });
        if (i < 5) caja(c, 0.12, 0.012, 0.05, [v.x * largo * 0.55, 0.77 + v.y * largo * 0.55, v.z * largo * 0.55], '#3e6a30', { variar: 0.08, rot: [0, i, 0.5 * (i % 2 ? 1 : -1)] });
      });
    },
  },
  {
    ...base, id: 'cuadro-retrato', nombre: 'Retrato al óleo', categoria: 'mobiliario', radio: 0.45, ancho: 0.72, fondo: 0.12, alto: 1.9, separacion: 0.4, confort: 1,
    texto: 'El retrato de un señor de bigote y levita, con marco dorado y su plaquita de bronce. Para colgar en la pared de la sala, a la altura de los ojos. El fondo mira a +Z.',
    pide: { tabla: 4 }, pesos: 1200,
    arma(c) {
      const cy = 1.45;
      marco(c, 0.64, 0.82, cy);
      lienzo(c, 0.5, 0.68, cy, '#31402f');
      caja(c, 0.5, 0.3, 0.008, [0, cy - 0.19, -0.006], '#3d4d3a', { variar: 0.06 });
      // el señor: hombros de levita, camisa y corbata, cuello, cabeza, pelo gris, bigote y ojos
      bola(c, 0.22, [0, 1.19, -0.025], '#1f1d1b', [1, 0.6, 0.12], { w: 8, h: 5 });
      caja(c, 0.07, 0.14, 0.008, [0, 1.26, -0.04], '#e6e0d0', { variar: 0.04 });
      caja(c, 0.03, 0.1, 0.008, [0, 1.25, -0.047], '#7a2f2a', { variar: 0.05 });
      caja(c, 0.06, 0.07, 0.02, [0, 1.34, -0.03], '#c79a78', { variar: 0.05 });
      bola(c, 0.08, [0, 1.44, -0.035], '#d3a888', [0.95, 1.15, 0.5], { w: 8, h: 6, variar: 0.04 });
      bola(c, 0.088, [0, 1.49, -0.025], '#b4b2aa', [1, 0.7, 0.5], { w: 8, h: 4, variar: 0.05 });
      for (const sx of [-1, 1]) caja(c, 0.02, 0.07, 0.025, [sx * 0.078, 1.45, -0.03], '#b4b2aa', { variar: 0.05 });
      caja(c, 0.07, 0.014, 0.012, [0, 1.405, -0.07], '#a8a8a0', { variar: 0.05 });
      for (const sx of [-1, 1]) caja(c, 0.018, 0.01, 0.01, [sx * 0.03, 1.455, -0.072], '#2a2622', { variar: 0.02 });
      caja(c, 0.014, 0.04, 0.014, [0, 1.43, -0.07], '#bf936f', { variar: 0.04 });
      // la plaquita de bronce, abajo del marco
      caja(c, 0.22, 0.045, 0.012, [0, cy - 0.47, -0.005], BRONCE, { tipo: 0, variar: 0.05 });
    },
  },
  {
    ...base, id: 'cuadro-valle', nombre: 'Paisaje del valle', categoria: 'mobiliario', radio: 0.75, ancho: 1.3, fondo: 0.12, alto: 1.95, separacion: 0.5, confort: 1,
    texto: 'Un cuadro grande, pintado a mano, del valle visto desde la loma: el lago, las montañas con nieve, una casita en la orilla y los pinos. Marco dorado. Para una pared grande. El fondo mira a +Z.',
    pide: { tabla: 5 }, pesos: 1800,
    arma(c) {
      const cy = 1.42, W = 1.14, H = 0.74, y0 = cy - H / 2;
      marco(c, 1.3, 0.9, cy, 0.08);
      lienzo(c, W, H, cy, '#a9c4d6');
      caja(c, W, 0.22, 0.008, [0, cy + H / 2 - 0.11, -0.006], '#7ea6c4', { variar: 0.04 });
      // el sol y dos nubes
      cil(c, 0.055, 0.055, 0.01, [0.38, cy + 0.2, -0.012], '#f2d27a', { lados: 10, rot: [Math.PI / 2, 0, 0], variar: 0.03 });
      caja(c, 0.26, 0.04, 0.01, [-0.3, cy + 0.26, -0.012], '#eef2f4', { variar: 0.03 }); caja(c, 0.16, 0.035, 0.01, [-0.25, cy + 0.29, -0.013], '#eef2f4', { variar: 0.03 });
      caja(c, 0.2, 0.03, 0.01, [0.1, cy + 0.15, -0.012], '#e4eaee', { variar: 0.03 });
      // las montañas: triángulos finitos (pirámides de cuatro caras aplastadas), con la nieve arriba
      const monte = (x, ancho, alto, color, z) => {
        const yb = y0 + 0.2;
        c.agregar(new THREE.ConeGeometry(ancho / 2, alto, 4), { color, tipo: 4, variar: 0.05, matriz: matriz([x, yb + alto / 2, z], [0, 0, 0], [1, 1, 0.05]) });
        c.agregar(new THREE.ConeGeometry(ancho * 0.15, alto * 0.3, 4), { color: '#f0f3f5', tipo: 4, variar: 0.03, matriz: matriz([x, yb + alto * 0.85, z - 0.003], [0, 0, 0], [1, 1, 0.07]) });
      };
      monte(-0.2, 0.7, 0.36, '#6f8aa0', -0.012);
      monte(0.1, 0.86, 0.46, '#5f7a92', -0.014);
      monte(0.32, 0.5, 0.28, '#7a95aa', -0.016);
      // el lago, con tres brillos, y la costa con pasto
      caja(c, W, 0.2, 0.008, [0, y0 + 0.1, -0.02], '#3f6e8c', { variar: 0.04 });
      for (const [x, y, a] of [[0.1, 0.13, 0.4], [-0.25, 0.07, 0.3], [0.35, 0.05, 0.25]]) caja(c, a, 0.012, 0.006, [x, y0 + y, -0.026], '#8fb5c9', { variar: 0.03 });
      c.agregar(new THREE.ConeGeometry(0.3, 0.17, 4), { color: '#6a8c42', tipo: 4, variar: 0.06, matriz: matriz([-0.27, y0 + 0.085, -0.03], [0, 0, 0], [1, 1, 0.05]) });
      caja(c, W, 0.05, 0.008, [0, y0 + 0.025, -0.034], '#4f6f33', { variar: 0.05 });
      // la casita de la orilla y tres pinos
      caja(c, 0.08, 0.055, 0.008, [-0.28, y0 + 0.14, -0.04], '#c9b79a', { variar: 0.05 });
      c.agregar(new THREE.ConeGeometry(0.065, 0.045, 4), { color: '#8a3f2e', tipo: 4, variar: 0.05, matriz: matriz([-0.28, y0 + 0.19, -0.04], [0, 0, 0], [1, 1, 0.1]) });
      for (const [x, a] of [[-0.12, 0.15], [-0.06, 0.12], [-0.46, 0.13]]) c.agregar(new THREE.ConeGeometry(0.035, a, 4), { color: '#2e4a2a', tipo: 4, variar: 0.06, matriz: matriz([x, y0 + 0.1 + a / 2, -0.042], [0, 0, 0], [1, 1, 0.1]) });
      // la plaquita
      caja(c, 0.3, 0.04, 0.012, [0, cy - 0.5, -0.005], BRONCE, { tipo: 0, variar: 0.05 });
    },
  },
  {
    ...base, id: 'candelabro-pie', nombre: 'Candelabro de pie', categoria: 'mobiliario', radio: 0.4, ancho: 0.8, fondo: 0.5, alto: 1.5, separacion: 0.5, confort: 2,
    texto: 'Un candelabro alto de hierro forjado, con cinco velas en brazos que se abren en voluta y dos nudos de bronce. Va a los lados de una chimenea o de una mesa. No da luz propia: es de adorno.',
    pide: { tabla: 2, piedra: 4, tronco: 1 }, pesos: 2200,
    fisica(h) { h.circulo(0, 0, 0.2, 0, 1.2); },
    arma(c) {
      // la base: un disco con tres patas y el eje con dos nudos de bronce
      cil(c, 0.1, 0.2, 0.06, [0, 0.03, 0], HIERRO, { tipo: 0, lados: 8 });
      for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; caja(c, 0.04, 0.05, 0.14, [Math.sin(a) * 0.19, 0.025, Math.cos(a) * 0.19], HIERRO, { tipo: 0, rot: [0, a, 0] }); }
      cil(c, 0.022, 0.022, 1.12, [0, 0.62, 0], HIERRO, { tipo: 0, lados: 6 });
      for (const y of [0.34, 0.8]) cil(c, 0.05, 0.05, 0.06, [0, y, 0], BRONCE, { tipo: 0, lados: 6 });
      // dos brazos por lado: una voluta que sale del eje y un cano que sube hasta la vela
      for (const sx of [-1, 1]) for (const [R, y0, yTope] of [[0.1, 0.96, 1.2], [0.17, 0.82, 1.14]]) {
        c.agregar(new THREE.TorusGeometry(R, 0.013, 4, 6, Math.PI), { color: HIERRO, tipo: 0, variar: 0.04, matriz: matriz([sx * R, y0, 0], [0, 0, Math.PI]) });
        cil(c, 0.012, 0.012, yTope - y0, [sx * 2 * R, (y0 + yTope) / 2, 0], HIERRO, { tipo: 0, lados: 4 });
        vela(c, sx * 2 * R, yTope, 0, 0.13 - R * 0.1);
      }
      // y la del medio
      vela(c, 0, 1.18, 0, 0.16, 0.06);
    },
  },
  {
    ...base, id: 'biombo-tallado', nombre: 'Biombo tallado', categoria: 'mobiliario', radio: 0.9, ancho: 1.6, fondo: 0.5, alto: 1.85, separacion: 0.5, confort: 2,
    texto: 'Un biombo de tres hojas en zigzag, de roble tallado: arriba una rejilla calada con rombos, abajo tela de lana bordada. Para separar la cama de la sala o vestirse detrás. Se puede rodear: choca.',
    pide: { tabla: 10, lana: 2 }, pesos: 2800,
    fisica(h) {
      const w = 0.58, ca = Math.cos(0.45), sa = Math.sin(0.45);
      let x = -w * ca * 1.5, z = -sa * w * 0.5;
      for (let i = 0; i < 3; i++) { const dz = (i % 2 ? -1 : 1) * sa * w; h.segmento(x, z, x + w * ca, z + dz, 0.07, 0, 1.8); x += w * ca; z += dz; }
    },
    arma(c) {
      const w = 0.58, ang = 0.45, ca = Math.cos(ang), sa = Math.sin(ang);
      const telas = [VINO, '#3f5a6c', VINO];
      let px = -w * ca * 1.5, pz = -sa * w * 0.5;
      for (let i = 0; i < 3; i++) {
        const dz = (i % 2 ? -1 : 1) * sa * w, a = (i % 2 ? 1 : -1) * ang;
        const cx = px + w * ca / 2, cz = pz + dz / 2, ca2 = Math.cos(a), sa2 = Math.sin(a);
        // de coordenadas de la hoja (lx a lo ancho, lz de espesor) a las del mundo
        const P = (lx, y, lz) => [cx + lx * ca2 + lz * sa2, y, cz - lx * sa2 + lz * ca2];
        const B = (bw, bh, bd, lx, y, lz, color, o = {}) => caja(c, bw, bh, bd, P(lx, y, lz), color, { rot: [0, a, 0], ...o });
        // el marco: dos largueros, travesaños de arriba, del medio y de abajo, y la cresta tallada
        for (const sx of [-1, 1]) B(0.05, 1.7, 0.04, sx * (w / 2 - 0.025), 0.9, 0, ROBLE_OSCURO, { tipo: 0 });
        B(w, 0.06, 0.04, 0, 1.72, 0, ROBLE_OSCURO, { tipo: 0 });
        B(w - 0.05, 0.05, 0.04, 0, 1.08, 0, ROBLE_OSCURO, { tipo: 0 });
        B(w - 0.05, 0.07, 0.04, 0, 0.12, 0, ROBLE_OSCURO, { tipo: 0 });
        B(w * 0.6, 0.08, 0.035, 0, 1.79, 0, ROBLE);
        // la rejilla de arriba: dos montantes, dos travesaños y un rombo en el medio
        for (const sx of [-1, 1]) B(0.02, 0.6, 0.03, sx * 0.11, 1.4, 0, ROBLE);
        for (const y of [1.25, 1.55]) B(w - 0.08, 0.02, 0.03, 0, y, 0, ROBLE);
        B(0.1, 0.1, 0.03, 0, 1.4, 0, ROBLE, { rot: [0, a, Math.PI / 4] });
        // la tela de abajo y su bordado
        B(w - 0.1, 0.9, 0.02, 0, 0.6, 0, telas[i], { variar: 0.07 });
        B(0.2, 0.2, 0.012, 0, 0.62, -0.012, '#c9a14a', { variar: 0.05, rot: [0, a, Math.PI / 4] });
        B(0.08, 0.08, 0.014, 0, 0.62, -0.016, telas[i], { variar: 0.05, rot: [0, a, Math.PI / 4] });
        // los pies, un poco más anchos para que pare
        for (const sx of [-1, 1]) B(0.06, 0.05, 0.12, sx * (w / 2 - 0.025), 0.025, 0, ROBLE_OSCURO, { tipo: 0 });
        px += w * ca; pz += dz;
      }
    },
  },

  // ================================================================ muebles de la sala
  {
    ...base, id: 'sillon-cuero', nombre: 'Sillón de cuero', categoria: 'mobiliario', radio: 0.85, ancho: 1.05, fondo: 0.95, alto: 1.0, separacion: 1.0, confort: 4,
    texto: 'Un sillón de club forrado en cuero curtido, con el respaldo capitoné de tachuelas de bronce, apoyabrazos enrollados y patas torneadas. Un trago cerca del fuego, y a leer. El respaldo queda atrás: girá con R.',
    pide: { tabla: 8, lana: 3 }, pesos: 3000,
    fisica(h) { h.segmento(-0.15, 0, 0.15, 0, 0.45, 0, 1.0); },
    arma(c) {
      const CUERO = '#8a4c2c', CUERO2 = '#9a5732', CUERO_OSC = '#5e3220';
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cil(c, 0.04, 0.03, 0.12, [sx * 0.42, 0.06, sz * 0.36], ROBLE_OSCURO, { tipo: 0, lados: 6 });
      caja(c, 0.92, 0.14, 0.82, [0, 0.19, 0], CUERO_OSC, { variar: 0.06 });
      caja(c, 0.64, 0.16, 0.66, [0, 0.34, -0.04], CUERO2, { variar: 0.07 });
      // el respaldo, un poco echado atrás, con el rollo de arriba y las tachuelas
      caja(c, 0.9, 0.62, 0.16, [0, 0.66, 0.34], CUERO, { variar: 0.07, rot: [-0.12, 0, 0] });
      cil(c, 0.08, 0.08, 0.9, [0, 0.99, 0.37], CUERO2, { lados: 8, rot: [0, 0, Math.PI / 2], variar: 0.06 });
      for (const [x, y] of [[-0.24, 0.8], [0, 0.8], [0.24, 0.8], [-0.12, 0.6], [0.12, 0.6], [-0.36, 0.6], [0.36, 0.6]]) caja(c, 0.025, 0.025, 0.014, [x, y, 0.255 - (y - 0.6) * 0.1], BRONCE, { tipo: 0, variar: 0.03 });
      // los apoyabrazos: un cuerpo, el rollo arriba y tres tachuelas al frente
      for (const sx of [-1, 1]) {
        caja(c, 0.15, 0.3, 0.8, [sx * 0.46, 0.4, 0], CUERO, { variar: 0.07 });
        cil(c, 0.085, 0.085, 0.84, [sx * 0.46, 0.58, 0], CUERO2, { lados: 8, rot: [Math.PI / 2, 0, 0], variar: 0.06 });
        for (let k = -1; k <= 1; k++) caja(c, 0.02, 0.02, 0.014, [sx * 0.46, 0.4 + k * 0.07, -0.41], BRONCE, { tipo: 0, variar: 0.03 });
      }
      // una manta tejida doblada y un libro en el asiento
      caja(c, 0.5, 0.04, 0.2, [0.02, 0.43, 0.08], '#b8923e', { variar: 0.08, rot: [0, 0.2, 0] });
      caja(c, 0.2, 0.04, 0.15, [-0.2, 0.455, -0.14], '#7a2f2a', { variar: 0.1, rot: [0, -0.3, 0] });
    },
  },
  {
    ...base, id: 'estanteria-roble', nombre: 'Estantería de roble con libros', categoria: 'mobiliario', radio: 1.0, ancho: 1.6, fondo: 0.42, alto: 2.25, separacion: 1.0, confort: 3,
    texto: 'Una estantería de roble de punta a punta del cuarto: abajo un armario con puertas, arriba tres estantes llenos de libros de todos los lomos, un globo terráqueo y un candelero. Contra la pared, de espaldas a +Z.',
    pide: { tabla: 16, tronco: 2 }, pesos: 4200,
    fisica(h) { h.segmento(-0.55, 0.0, 0.55, 0.0, 0.2, 0, 2.25); },
    arma(c) {
      // el esqueleto: zócalo, dos costados, fondo, cornisa y los estantes
      caja(c, 1.6, 0.12, 0.42, [0, 0.06, 0], ROBLE_OSCURO, { tipo: 0 });
      for (const sx of [-1, 1]) caja(c, 0.06, 2.0, 0.4, [sx * 0.77, 1.12, 0], ROBLE);
      caja(c, 1.48, 2.0, 0.02, [0, 1.12, 0.19], '#4d3a24');
      caja(c, 1.68, 0.1, 0.46, [0, 2.2, 0], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 1.62, 0.05, 0.44, [0, 2.12, 0], ROBLE, { tipo: 0 });
      caja(c, 0.4, 0.08, 0.04, [0, 2.2, -0.24], ROBLE);
      for (const y of [0.56, 1.0, 1.45, 1.9]) caja(c, 1.48, 0.035, 0.38, [0, y, 0], TABLA_CLARA);
      // el armario de abajo: dos puertas con tablero y tirador
      for (const sx of [-1, 1]) {
        caja(c, 0.7, 0.4, 0.03, [sx * 0.36, 0.33, -0.2], ROBLE);
        caja(c, 0.55, 0.27, 0.014, [sx * 0.36, 0.33, -0.22], ROBLE_OSCURO, { variar: 0.06 });
        cil(c, 0.018, 0.018, 0.03, [sx * 0.07, 0.33, -0.235], BRONCE, { tipo: 0, lados: 6, rot: [Math.PI / 2, 0, 0] });
      }
      // los libros: bloques de lomos juntos (colores de siempre) en cada estante, con huecos
      const COL = ['#7a2f2a', '#3f5a6c', '#5a6b3a', '#8a6a3a', '#c9bda0', '#4a3a5a', '#a8573a', '#2f4a3f'];
      const bloque = (x, yEstante, ancho, alto, k, inclinado = 0) => caja(c, ancho, alto, 0.28, [x, yEstante + 0.0175 + alto / 2, 0.02], COL[k % COL.length], { variar: 0.1, rot: [0, 0, inclinado] });
      let k = 0;
      // estante 1 (y 0,56): libros a la izquierda, el globo a la derecha
      { let x = -0.7; for (const a of [0.1, 0.12, 0.09, 0.13, 0.1, 0.11, 0.12]) { bloque(x + a / 2, 0.56, a, 0.3 + hs(k) * 0.08, k++); x += a + 0.005; } }
      bola(c, 0.14, [0.48, 0.83, 0.02], '#5f86a0', [1, 1, 1], { w: 8, h: 6, variar: 0.06 });
      cil(c, 0.015, 0.015, 0.2, [0.48, 0.56 + 0.0175 + 0.1, 0.02], BRONCE, { tipo: 0, lados: 5 });
      cil(c, 0.1, 0.12, 0.03, [0.48, 0.56 + 0.0175 + 0.015, 0.02], ROBLE_OSCURO, { tipo: 0, lados: 8 });
      // estante 2 (y 1,0): libros parados y una pila acostada
      { let x = -0.72; for (const a of [0.11, 0.1, 0.13, 0.09, 0.12, 0.1]) { bloque(x + a / 2, 1.0, a, 0.3 + hs(k + 5) * 0.1, k++); x += a + 0.005; } }
      bloque(-0.01, 1.0, 0.12, 0.3, k++, 0.28);
      caja(c, 0.3, 0.05, 0.22, [0.36, 1.0175 + 0.025, 0.02], COL[2], { variar: 0.1 }); caja(c, 0.26, 0.05, 0.2, [0.36, 1.0175 + 0.075, 0.02], COL[0], { variar: 0.1 });
      caja(c, 0.22, 0.05, 0.18, [0.36, 1.0175 + 0.125, 0.02], COL[3], { variar: 0.1 });
      // estante 3 (y 1,45): libros en los extremos, un candelero en el medio
      { let x = -0.72; for (const a of [0.1, 0.12, 0.09, 0.11, 0.13]) { bloque(x + a / 2, 1.45, a, 0.28 + hs(k + 9) * 0.1, k++); x += a + 0.005; } }
      { let x = 0.3; for (const a of [0.11, 0.1, 0.12, 0.09]) { bloque(x + a / 2, 1.45, a, 0.3 + hs(k + 3) * 0.08, k++); x += a + 0.005; } }
      cil(c, 0.05, 0.06, 0.03, [-0.05, 1.45 + 0.0175 + 0.015, 0.02], BRONCE, { tipo: 0, lados: 6 });
      cil(c, 0.015, 0.015, 0.16, [-0.05, 1.45 + 0.0175 + 0.11, 0.02], BRONCE, { tipo: 0, lados: 5 });
      vela(c, -0.05, 1.45 + 0.0175 + 0.19, 0.02, 0.1, 0.04);
      // arriba, bajo la cornisa: un reloj de arena y un jarrito
      cil(c, 0.07, 0.07, 0.015, [0.5, 1.9175 + 0.0075, 0.02], ROBLE_OSCURO, { tipo: 0, lados: 6 });
      cil(c, 0.05, 0.05, 0.15, [0.5, 1.9175 + 0.09, 0.02], '#d8c6a0', { lados: 6, variar: 0.04 });
      cil(c, 0.06, 0.05, 0.1, [-0.45, 1.9175 + 0.05, 0.02], '#a8573a', { lados: 8 });
    },
  },
  {
    ...base, id: 'armario-tallado', nombre: 'Armario tallado de roble', categoria: 'mobiliario', radio: 1.0, ancho: 1.55, fondo: 0.66, alto: 2.3, separacion: 1.4, confort: 3,
    texto: 'Un armario de roble macizo con columnas en las esquinas, dos puertas con medallón tallado, dos cajones con tirador de bronce y una cornisa con frontón. Para la pieza grande de la casa. Contra la pared, de espaldas a +Z.',
    pide: { tabla: 16, tronco: 3 }, pesos: 5500,
    fisica(h) { h.segmento(-0.45, 0, 0.45, 0, 0.3, 0, 2.3); },
    arma(c) {
      // zócalo con patas de bola y el cuerpo
      caja(c, 1.55, 0.14, 0.66, [0, 0.14, 0], ROBLE_OSCURO, { tipo: 0 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cil(c, 0.06, 0.05, 0.08, [sx * 0.68, 0.04, sz * 0.26], ROBLE_OSCURO, { tipo: 0, lados: 6 });
      caja(c, 1.4, 1.88, 0.6, [0, 1.12, 0.02], '#8e6d45');
      // dos columnas al frente con base y capitel
      for (const sx of [-1, 1]) {
        cil(c, 0.055, 0.055, 1.7, [sx * 0.7, 1.12, -0.3], '#a07c4e', { tipo: 0, lados: 8 });
        caja(c, 0.13, 0.05, 0.13, [sx * 0.7, 0.25, -0.3], ROBLE, { tipo: 0 });
        caja(c, 0.13, 0.06, 0.13, [sx * 0.7, 1.98, -0.3], ROBLE, { tipo: 0 });
      }
      // las puertas: tabla, tablero hundido, medallón de bronce y tirador
      for (const sx of [-1, 1]) {
        caja(c, 0.64, 1.3, 0.035, [sx * 0.33, 1.38, -0.31], '#a07c4e');
        caja(c, 0.5, 1.1, 0.02, [sx * 0.33, 1.38, -0.33], '#7d5d3a', { variar: 0.06 });
        cil(c, 0.1, 0.1, 0.02, [sx * 0.33, 1.4, -0.345], '#a8873f', { tipo: 0, lados: 8, rot: [Math.PI / 2, 0, 0] });
        cil(c, 0.05, 0.05, 0.02, [sx * 0.33, 1.4, -0.358], ROBLE, { lados: 6, rot: [Math.PI / 2, 0, 0] });
        cil(c, 0.016, 0.016, 0.16, [sx * 0.04, 1.35, -0.345], BRONCE, { tipo: 0, lados: 5 });
      }
      // los cajones de abajo
      for (const sx of [-1, 1]) {
        caja(c, 0.66, 0.2, 0.035, [sx * 0.33, 0.43, -0.31], '#a07c4e');
        caja(c, 0.5, 0.1, 0.014, [sx * 0.33, 0.43, -0.332], '#7d5d3a', { variar: 0.06 });
        cil(c, 0.022, 0.022, 0.04, [sx * 0.33, 0.43, -0.35], BRONCE, { tipo: 0, lados: 6, rot: [Math.PI / 2, 0, 0] });
      }
      // el friso de rosetas, la cornisa y el frontón con una piña de bronce
      for (let i = -2; i <= 2; i++) caja(c, 0.07, 0.07, 0.03, [i * 0.28, 2.0, -0.31], ROBLE, { rot: [0, 0, Math.PI / 4] });
      caja(c, 1.62, 0.1, 0.68, [0, 2.1, 0], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 1.5, 0.07, 0.62, [0, 2.19, 0], ROBLE, { tipo: 0 });
      caja(c, 0.7, 0.1, 0.5, [0, 2.26, 0], ROBLE_OSCURO, { tipo: 0 });
      cil(c, 0.03, 0.05, 0.07, [0, 2.34, 0], BRONCE, { tipo: 0, lados: 6 });
    },
  },
  {
    ...base, id: 'gramola', nombre: 'Gramola de roble', categoria: 'mobiliario', radio: 0.55, ancho: 0.8, fondo: 0.9, alto: 1.5, separacion: 0.6, confort: 3, alcanceE: 2.2,
    texto: 'Una gramola de gabinete de roble con su bocina de bronce y la manivela al costado. Con E le das cuerda y suena un tema suave, hecho en el momento; con E otra vez la parás, y la próxima vez toca otro. Contra la pared, de espaldas a +Z.',
    pide: { tabla: 12, tronco: 1, piedra: 4 }, pesos: 6000,
    fisica(h) { h.circulo(0, 0.02, 0.33, 0, 1.0); },
    arma(c) {
      // el gabinete: patas, cuerpo con frente de rejilla, molduras y la tapa
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.05, 0.2, 0.05, [sx * 0.24, 0.1, sz * 0.17], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 0.6, 0.05, 0.46, [0, 0.225, 0], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 0.56, 0.46, 0.42, [0, 0.5, 0.01], ROBLE);
      caja(c, 0.46, 0.34, 0.012, [0, 0.5, -0.205], '#3a2a1c', { variar: 0.05 });
      for (let i = 0; i < 4; i++) caja(c, 0.42, 0.02, 0.016, [0, 0.38 + i * 0.08, -0.212], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 0.62, 0.05, 0.48, [0, 0.765, 0], ROBLE_OSCURO, { tipo: 0 });
      // el plato con el disco, su etiqueta, el brazo con la púa y la manivela
      cil(c, 0.17, 0.17, 0.014, [0, 0.8, -0.02], '#1c1b1a', { tipo: 0, lados: 12, variar: 0.03 });
      cil(c, 0.05, 0.05, 0.016, [0, 0.806, -0.02], '#8a2f2a', { tipo: 0, lados: 8 });
      caja(c, 0.2, 0.012, 0.016, [0.13, 0.82, -0.12], BRONCE, { tipo: 0, rot: [0, 0.5, 0] });
      cil(c, 0.016, 0.016, 0.06, [0.2, 0.805, -0.17], BRONCE, { tipo: 0, lados: 5 });
      caja(c, 0.1, 0.02, 0.02, [0.36, 0.55, 0.0], BRONCE, { tipo: 0 });
      cil(c, 0.02, 0.02, 0.07, [0.4, 0.51, 0.0], ROBLE_OSCURO, { tipo: 0, lados: 5 });
      // la bocina: un cuerno de bronce que sale de atrás y se abre hacia el frente
      const ruta = [[0.1, 0.84, 0.17, 0.035], [0.1, 0.98, 0.13, 0.055], [0.09, 1.1, 0.04, 0.09], [0.08, 1.2, -0.09, 0.15], [0.07, 1.27, -0.27, 0.24]];
      for (let i = 0; i < ruta.length - 1; i++) cano(c, ruta[i].slice(0, 3), ruta[i + 1].slice(0, 3), ruta[i][3], ruta[i + 1][3], BRONCE, { lados: 10 });
      cil(c, 0.17, 0.17, 0.02, [0.07, 1.27, -0.275], '#6a4a1e', { tipo: 0, lados: 10, rot: [Math.PI / 2 + 0.37, 0, 0], variar: 0.04 });
      // el soporte del cuerno y un adorno en la tapa
      caja(c, 0.03, 0.2, 0.03, [0.1, 0.9, 0.17], BRONCE, { tipo: 0 });
      cil(c, 0.05, 0.06, 0.05, [-0.2, 0.815, 0.12], ROBLE_OSCURO, { tipo: 0, lados: 6 });
    },
  },
  {
    ...base, id: 'mesa-banquete', nombre: 'Mesa de banquete', categoria: 'mobiliario', radio: 1.8, ancho: 3.4, fondo: 2.0, alto: 1.25, separacion: 2.0, confort: 4,
    texto: 'Una mesa de roble de dos metros y pico con cuatro sillas de cada lado y un sillón en cada cabecera: seis lugares puestos, un camino de mesa de lana, dos candeleros, una jarra y pan. Para recibir como se debe.',
    pide: { tabla: 22, tronco: 3 }, pesos: 7000,
    fisica(h) {
      h.segmento(-0.9, 0, 0.9, 0, 0.5, 0, 0.82);
      for (const x of [-0.5, 0.5]) for (const z of [-0.8, 0.8]) h.circulo(x, z, 0.24, 0, 0.9);
      for (const x of [-1.42, 1.42]) h.circulo(x, 0, 0.25, 0, 1.0);
    },
    arma(c) {
      // la mesa: el tablero con su filete, los dos caballetes tallados y el travesaño
      caja(c, 2.3, 0.07, 0.95, [0, 0.8, 0], ROBLE);
      caja(c, 2.34, 0.03, 0.99, [0, 0.76, 0], ROBLE_OSCURO, { tipo: 0 });
      for (const sx of [-1, 1]) {
        caja(c, 0.1, 0.72, 0.78, [sx * 0.98, 0.38, 0], ROBLE_OSCURO, { tipo: 0 });
        caja(c, 0.12, 0.08, 0.96, [sx * 0.98, 0.04, 0], ROBLE_OSCURO, { tipo: 0 });
      }
      caja(c, 1.85, 0.07, 0.07, [0, 0.3, 0], ROBLE, { tipo: 0 });
      // el camino de mesa, los candeleros, la jarra y el pan
      caja(c, 1.7, 0.012, 0.3, [0, 0.842, 0], VINO, { variar: 0.06 });
      for (const sx of [-1, 1]) {
        cil(c, 0.05, 0.06, 0.03, [sx * 0.45, 0.86, 0], BRONCE, { tipo: 0, lados: 6 });
        caja(c, 0.028, 0.22, 0.028, [sx * 0.45, 0.98, 0], BRONCE, { tipo: 0 });
        caja(c, 0.18, 0.014, 0.014, [sx * 0.45, 1.05, 0], BRONCE, { tipo: 0 });
        for (const dx of [-0.09, 0.09]) vela(c, sx * 0.45 + dx, 1.05, 0, 0.1, 0.035);
      }
      cil(c, 0.06, 0.05, 0.19, [0.1, 0.945, 0.04], '#a8573a', { lados: 8 });
      caja(c, 0.26, 0.07, 0.14, [-0.12, 0.88, -0.02], '#c9a870', { variar: 0.1, rot: [0, 0.3, 0] });
      // los platos, uno por silla de un lado y de otro
      for (const x of [-0.5, 0.5]) for (const z of [-0.33, 0.33]) cil(c, 0.09, 0.08, 0.016, [x, 0.845, z], PAPEL, { lados: 6 });
      // las sillas: asiento, dos costados, respaldo y travesaño (mirando a la mesa)
      const silla = (x, z, mira, brazos = false) => {
        const k = mira; // +1 la silla está del lado +z y mira a -z; -1, al revés
        const w = brazos ? 0.52 : 0.42;
        caja(c, w, 0.05, 0.42, [x, 0.46, z], '#7a2f2a', { variar: 0.07 });
        for (const sx of [-1, 1]) caja(c, 0.04, 0.44, 0.4, [x + sx * (w / 2 - 0.02), 0.22, z], ROBLE_OSCURO, { tipo: 0 });
        caja(c, w, 0.52, 0.05, [x, 0.74, z + k * 0.2], ROBLE);
        caja(c, w + 0.04, 0.05, 0.06, [x, 1.02, z + k * 0.2], ROBLE_OSCURO, { tipo: 0 });
        if (brazos) for (const sx of [-1, 1]) caja(c, 0.05, 0.05, 0.38, [x + sx * (w / 2), 0.66, z], ROBLE_OSCURO, { tipo: 0 });
      };
      for (const x of [-0.5, 0.5]) { silla(x, 0.8, 1); silla(x, -0.8, -1); }
      for (const sx of [-1, 1]) {
        // los sillones de las cabeceras miran a la mesa: de costado
        const x = sx * 1.42;
        caja(c, 0.42, 0.05, 0.52, [x, 0.46, 0], '#7a2f2a', { variar: 0.07 });
        for (const sz of [-1, 1]) caja(c, 0.4, 0.44, 0.04, [x, 0.22, sz * 0.24], ROBLE_OSCURO, { tipo: 0 });
        caja(c, 0.05, 0.56, 0.52, [x + sx * 0.2, 0.76, 0], ROBLE);
        caja(c, 0.06, 0.05, 0.56, [x + sx * 0.2, 1.06, 0], ROBLE_OSCURO, { tipo: 0 });
        for (const sz of [-1, 1]) caja(c, 0.38, 0.05, 0.05, [x, 0.67, sz * 0.27], ROBLE_OSCURO, { tipo: 0 });
      }
    },
  },
  {
    ...base, id: 'cama-dosel', nombre: 'Cama con dosel', categoria: 'mobiliario', radio: 1.5, ancho: 1.85, fondo: 2.3, alto: 2.5, separacion: 1.5,
    funciones: ['dormir'], confort: 5,
    texto: 'Una cama matrimonial con cuatro postes torneados, dosel de lana color vino con flecos y cortinas recogidas, cabecera tallada, colchón alto y dos almohadones. La cabecera queda del lado de atrás: girala con R. Se duerme mejor en una habitación cerrada.',
    pide: { tabla: 18, tronco: 4, lana: 6 }, pesos: 8500,
    fisica(h) { h.segmento(0, -0.3, 0, 0.3, 0.82, 0.02, 0.7); },
    arma(c) {
      const ZP = 1.03, XP = 0.86;
      // los cuatro postes: caja, dos aros de bronce y la piña de arriba
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        caja(c, 0.09, 2.3, 0.09, [sx * XP, 1.15, sz * ZP], '#7a5a36', { tipo: 0 });
        for (const y of [0.45, 1.5]) caja(c, 0.115, 0.04, 0.115, [sx * XP, y, sz * ZP], BRONCE, { tipo: 0 });
        bola(c, 0.065, [sx * XP, 2.36, sz * ZP], BRONCE, [1, 1.2, 1], { tipo: 0, w: 6, h: 4, variar: 0.05 });
      }
      // la base, la cabecera tallada y el pie bajo
      caja(c, 1.64, 0.2, 2.05, [0, 0.36, 0], ROBLE, { variar: 0.08 });
      caja(c, 1.7, 1.35, 0.08, [0, 0.95, ZP], '#7a5a36', { tipo: 0 });
      caja(c, 1.5, 1.1, 0.03, [0, 0.95, ZP - 0.045], '#a07c4e', { variar: 0.06 });
      caja(c, 0.6, 0.22, 0.06, [0, 1.68, ZP], '#7a5a36', { tipo: 0 });
      caja(c, 1.7, 0.5, 0.07, [0, 0.55, -ZP], '#7a5a36', { tipo: 0 });
      // las ropas de cama: colchón, colcha de lana, doblez y dos almohadones
      caja(c, 1.5, 0.18, 1.98, [0, 0.56, 0], '#d8cfba', { variar: 0.05 });
      caja(c, 1.54, 0.06, 1.3, [0, 0.67, -0.32], VINO, { variar: 0.08 });
      caja(c, 1.56, 0.03, 0.26, [0, 0.7, -0.74], DORADO, { variar: 0.06 });
      for (const sx of [-1, 1]) caja(c, 0.62, 0.15, 0.38, [sx * 0.37, 0.7, 0.72], '#e2dac8', { variar: 0.05, rot: [0.12, sx * 0.07, 0] });
      // el dosel: vigas, la tela de arriba, el festón de todos los lados
      for (const sz of [-1, 1]) caja(c, 1.82, 0.07, 0.07, [0, 2.3, sz * ZP], ROBLE_OSCURO, { tipo: 0 });
      for (const sx of [-1, 1]) caja(c, 0.07, 0.07, 2.12, [sx * XP, 2.3, 0], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 1.7, 0.025, 2.0, [0, 2.34, 0], VINO, { variar: 0.07 });
      caja(c, 1.7, 0.2, 0.025, [0, 2.2, -ZP - 0.045], VINO, { variar: 0.07 });
      for (const sx of [-1, 1]) caja(c, 0.025, 0.2, 2.0, [sx * (XP + 0.045), 2.2, 0], VINO, { variar: 0.07 });
      caja(c, 1.7, 0.03, 0.03, [0, 2.09, -ZP - 0.045], DORADO, { tipo: 0, variar: 0.04 });
      // las cortinas recogidas en los postes del pie y de la cabecera, atadas a media altura
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        caja(c, 0.2, 1.05, 0.06, [sx * (XP - 0.1), 1.6, sz * (ZP - 0.12)], VINO, { variar: 0.1, rot: [0, 0, 0] });
        caja(c, 0.26, 0.5, 0.08, [sx * (XP - 0.1), 0.85, sz * (ZP - 0.12)], VINO, { variar: 0.1 });
        caja(c, 0.22, 0.05, 0.1, [sx * (XP - 0.1), 1.15, sz * (ZP - 0.12)], DORADO, { tipo: 0, variar: 0.05 });
      }
    },
  },

  // ================================================================ el patio y lo de piedra
  {
    ...base, id: 'farol-hierro', nombre: 'Farol de hierro forjado', categoria: 'exterior', radio: 0.4, ancho: 0.7, fondo: 0.7, alto: 3.0, separacion: 1.0, confort: 1,
    texto: 'Un poste alto de hierro forjado sobre una base de piedra, con un farol de cuatro vidrios, techito en punta y dos volutas. Para el camino de la entrada o el patio. De adorno: no da luz propia.',
    pide: { piedra: 4, tabla: 2, tronco: 1 }, pesos: 2600, pendienteMax: 0.3, distSendero: 0.3,
    fisica(h) { h.circulo(0, 0, 0.22, 0, 3.0); },
    arma(c) {
      // la base de piedra (un poco enterrada) y el poste con dos collares de bronce
      cil(c, 0.22, 0.26, 0.2, [0, 0.1, 0], PIEDRA, { lados: 8, variar: 0.1 });
      cil(c, 0.14, 0.2, 0.3, [0, 0.25, 0], PIEDRA_CLARA, { lados: 8, variar: 0.1 });
      cil(c, 0.04, 0.06, 1.9, [0, 1.35, 0], HIERRO, { tipo: 0, lados: 8 });
      for (const y of [0.55, 1.2]) cil(c, 0.075, 0.075, 0.05, [0, y, 0], BRONCE, { tipo: 0, lados: 8 });
      // las dos volutas
      for (const sx of [-1, 1]) c.agregar(new THREE.TorusGeometry(0.11, 0.013, 4, 8, Math.PI * 1.4), { color: HIERRO, tipo: 0, variar: 0.04, matriz: matriz([sx * 0.11, 2.05, 0], [0, 0, sx > 0 ? 2.2 : 0.9]) });
      // el farol: plato, cuatro montantes, vidrios (color de llama), techito y piña
      cil(c, 0.19, 0.12, 0.05, [0, 2.33, 0], HIERRO, { tipo: 0, lados: 8 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.035, 0.36, 0.035, [sx * 0.12, 2.54, sz * 0.12], HIERRO, { tipo: 0 });
      caja(c, 0.21, 0.32, 0.21, [0, 2.54, 0], '#f0cc7a', { variar: 0.04 });
      cil(c, 0.015, 0.25, 0.17, [0, 2.78, 0], HIERRO, { tipo: 0, lados: 4, rot: [0, Math.PI / 4, 0] });
      bola(c, 0.04, [0, 2.89, 0], BRONCE, [1, 1, 1], { tipo: 0, w: 6, h: 4, variar: 0.04 });
    },
  },
  {
    ...base, id: 'pergola-enredadera', nombre: 'Pérgola con enredadera', categoria: 'exterior', radio: 2.0, ancho: 3.4, fondo: 2.8, alto: 2.8, separacion: 1.6, confort: 3,
    texto: 'Cuatro postes de tronco sobre piedras, vigas, travesaños y listones, con una enredadera de hojas y glicinas colgando. Da sombra de verdad: para el patio, la mesa de afuera o el camino a la casa. Pide un lugar casi llano.',
    pide: { tronco: 10, tabla: 8, piedra: 4 }, pesos: 9000, pendienteMax: 0.22, distSendero: 0.4,
    fisica(h) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) h.circulo(sx * 1.5, sz * 1.15, 0.14, 0, 2.5); },
    arma(c) {
      const XP = 1.5, ZP = 1.15;
      // los postes sobre su piedra y las dos vigas largas
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        caja(c, 0.28, 0.18, 0.28, [sx * XP, 0.09, sz * ZP], PIEDRA, { variar: 0.14 });
        caja(c, 0.16, 2.4, 0.16, [sx * XP, 1.35, sz * ZP], MADERA);
        // las ménsulas en diagonal que sujetan la viga
        tira(c, 0.06, 0.5, 0.06, [sx * XP, 2.1, sz * ZP], [-sx * 0.9, 0.9, 0], MADERA_OSCURA, { tipo: 0 });
      }
      for (const sz of [-1, 1]) caja(c, 3.5, 0.14, 0.13, [0, 2.57, sz * ZP], MADERA_OSCURA, { tipo: 0 });
      // los travesaños (a lo largo del fondo) y los listones de arriba (a lo ancho)
      for (let i = 0; i < 6; i++) caja(c, 0.09, 0.1, 2.9, [-1.5 + i * 0.6, 2.69, 0], MADERA);
      for (const z of [-1.0, -0.33, 0.33, 1.0]) caja(c, 3.3, 0.04, 0.05, [0, 2.76, z], TABLA_CLARA, { variar: 0.1 });
      // la enredadera: sube enroscada por cada poste (tramos que van y vienen)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        let p = [sx * XP, 0.2, sz * ZP];
        for (let k = 0; k < 3; k++) {
          const dir = [(k % 2 ? 0.3 : -0.3) * sx, 1, (k % 2 ? -0.25 : 0.25) * sz];
          tira(c, 0.05, 0.85, 0.05, p, dir, '#3e5a2a', { variar: 0.1 });
          const v = new THREE.Vector3(...dir).normalize();
          p = [p[0] + v.x * 0.85, p[1] + v.y * 0.85, p[2] + v.z * 0.85];
        }
      }
      // el follaje: bolas de hojas sobre las vigas y colgando de las de adelante y de atrás (cada una de distinto verde y tamaño)
      let q = 0;
      const hoja = (x, y, z, r, a = 1, b = 1) => { c.agregar(new THREE.IcosahedronGeometry(r, 0), { color: VERDE[q % 4], tipo: 4, variar: 0.14, matriz: matriz([x, y, z], [0, q * 2.1, 0], [a, b, 1.1]) }); q++; };
      for (let k = 0; k < 8; k++) hoja(-1.4 + k * 0.4, 2.42 - hs(k + 20) * 0.12, -ZP - 0.02, 0.17 + hs(k + 30) * 0.06, 1.1, 1.3);
      for (let k = 0; k < 5; k++) hoja(-1.2 + k * 0.6, 2.46 - hs(k + 40) * 0.1, ZP + 0.02, 0.18 + hs(k + 50) * 0.05, 1.1, 1.2);
      for (let k = 0; k < 3; k++) hoja(-0.9 + k * 0.9, 2.78, -0.7 + (k % 2) * 1.2, 0.34, 1.3, 0.4);
      for (const sx of [-1, 1]) { hoja(sx * XP, 2.44, -0.35, 0.2, 1, 1.2); hoja(sx * XP, 2.42, 0.4, 0.19, 1, 1.2); }
      // y racimos de glicina que cuelgan
      const racimos = [[-1.0, -1.1], [0.1, -1.15], [1.0, -1.1], [-1.35, 0.7], [1.35, 0.2], [0.6, 1.15]];
      racimos.forEach(([x, z], i) => caja(c, 0.07, 0.34 + hs(i) * 0.12, 0.07, [x, 2.3 - hs(i) * 0.06, z], i % 2 ? '#8a6ab8' : '#a07ac8', { variar: 0.1 }));
    },
  },
  {
    ...base, ocupaSuelo: true, id: 'estatua-baqueano', nombre: 'Estatua del baqueano', categoria: 'exterior', radio: 0.7, ancho: 1.1, fondo: 1.1, alto: 2.9, separacion: 1.2, confort: 3,
    texto: 'Un baqueano de piedra con poncho, sombrero ancho y su bastón, mirando el horizonte desde un pedestal con placa de bronce. Se talla con piedra del valle, la que sacás con el pico. Para el centro de una plaza chica o el fondo del jardín.',
    pide: { piedra: 30 }, pesos: 11000, pendienteMax: 0.2, distSendero: 0.4,
    fisica(h) { h.circulo(0, 0, 0.56, 0, 2.9); },
    arma(c) {
      // el pedestal: dos escalones, el dado con la placa, la cornisa y la tapa
      caja(c, 1.0, 0.18, 1.0, [0, 0.09, 0], PIEDRA, { variar: 0.12 });
      caja(c, 0.8, 0.14, 0.8, [0, 0.23, 0], PIEDRA_CLARA, { variar: 0.1 });
      caja(c, 0.56, 0.72, 0.56, [0, 0.66, 0], MARMOL, { variar: 0.1 });
      caja(c, 0.3, 0.2, 0.02, [0, 0.62, -0.29], BRONCE, { tipo: 0, variar: 0.04 });
      caja(c, 0.68, 0.08, 0.68, [0, 1.06, 0], PIEDRA_CLARA, { variar: 0.1 });
      caja(c, 0.6, 0.06, 0.6, [0, 1.13, 0], PIEDRA, { variar: 0.1 });
      // la figura (de los pies a la cabeza): botas, poncho, hombros, cuello, cabeza y sombrero
      for (const sx of [-1, 1]) cil(c, 0.07, 0.065, 0.55, [sx * 0.1, 1.45, 0], PIEDRA_CLARA, { lados: 7, variar: 0.08 });
      cil(c, 0.16, 0.3, 0.8, [0, 1.95, 0], MARMOL, { lados: 8, variar: 0.09 });
      cil(c, 0.305, 0.305, 0.05, [0, 1.58, 0], PIEDRA, { lados: 8, variar: 0.08 });
      bola(c, 0.17, [0, 2.38, 0], MARMOL, [1.2, 0.7, 0.95], { w: 8, h: 5, variar: 0.08 });
      cil(c, 0.05, 0.06, 0.08, [0, 2.46, 0], PIEDRA_CLARA, { lados: 6, variar: 0.06 });
      bola(c, 0.11, [0, 2.57, 0], PIEDRA_CLARA, [1, 1.15, 1], { w: 8, h: 6, variar: 0.06 });
      cil(c, 0.25, 0.25, 0.025, [0, 2.67, 0], PIEDRA, { lados: 10, variar: 0.08 });
      cil(c, 0.13, 0.11, 0.14, [0, 2.75, 0], PIEDRA, { lados: 8, variar: 0.08 });
      // el brazo que sostiene el bastón y el bastón
      cano(c, [0.24, 2.34, 0], [0.34, 1.95, -0.06], 0.055, 0.045, MARMOL, { tipo: 4, lados: 6, variar: 0.08 });
      cil(c, 0.022, 0.022, 1.62, [0.35, 1.93, -0.07], PIEDRA, { lados: 6, variar: 0.08 });
      bola(c, 0.05, [0.35, 1.97, -0.07], PIEDRA_CLARA, [1, 1, 1], { w: 6, h: 4, variar: 0.08 });
    },
  },
  {
    ...base, id: 'chimenea-salon', nombre: 'Chimenea de salón', categoria: 'mobiliario', radio: 1.3, ancho: 2.1, fondo: 0.75, alto: 2.45, separacion: 1.4, confort: 3,
    texto: 'Una chimenea de piedra tallada con repisa de roble, un cuadro arriba y un fuego pintado en el hogar: de adorno, no calienta (para eso está el hogar con repisa). Con dos candeleros en la repisa. Contra la pared, de espaldas a +Z.',
    pide: { piedra: 30, tabla: 4 }, pesos: 12000,
    fisica(h) { h.segmento(-0.6, 0, 0.6, 0, 0.4, 0, 2.45); },
    arma(c) {
      // el hogar: piso, fondo oscuro, laterales
      caja(c, 2.1, 0.08, 0.75, [0, 0.04, 0], PIEDRA_CLARA, { variar: 0.1 });
      caja(c, 1.1, 1.1, 0.1, [0, 0.64, 0.3], '#2a2522', { tipo: 0, variar: 0.05 });
      for (const sx of [-1, 1]) caja(c, 0.04, 1.1, 0.5, [sx * 0.55, 0.64, 0.05], '#332d28', { tipo: 0, variar: 0.05 });
      // las jambas: tres bloques de cada lado, de alturas distintas; el dintel con piedra clave
      for (const sx of [-1, 1]) [[0.08, 0.38], [0.46, 0.4], [0.86, 0.38]].forEach(([y, h], i) => caja(c, 0.4, h, 0.62, [sx * 0.75, y + h / 2, 0.03], i % 2 ? PIEDRA : MARMOL, { variar: 0.12 }));
      for (const x of [-0.6, 0.6]) caja(c, 0.62, 0.34, 0.62, [x, 1.43, 0.03], PIEDRA, { variar: 0.12 });
      caja(c, 0.6, 0.38, 0.64, [0, 1.43, 0.03], MARMOL, { variar: 0.1 });
      // la repisa de roble con su moldura, y el cuerpo que sube por pasos
      caja(c, 2.1, 0.08, 0.74, [0, 1.64, 0.0], ROBLE);
      caja(c, 1.9, 0.05, 0.68, [0, 1.59, 0.0], ROBLE_OSCURO, { tipo: 0 });
      caja(c, 1.6, 0.25, 0.64, [0, 1.8, 0.05], PIEDRA, { variar: 0.1 });
      caja(c, 1.3, 0.3, 0.56, [0, 2.07, 0.1], MARMOL, { variar: 0.1 });
      caja(c, 1.0, 0.3, 0.48, [0, 2.32, 0.14], PIEDRA, { variar: 0.1 });
      // el cuadro de arriba: un marco dorado con el valle en tres franjas
      caja(c, 0.7, 0.5, 0.03, [0, 2.07, -0.19], DORADO, { tipo: 0, variar: 0.04 });
      for (const [i, col] of ['#8fb0c8', '#4f6f8a', '#5d7f3a'].entries()) caja(c, 0.6, 0.13, 0.012, [0, 2.2 - i * 0.13, -0.21], col, { variar: 0.06 });
      // el fuego: leños, brasas, llamas (sólo color), morillos
      for (const [z, y] of [[0.12, 0.17], [-0.02, 0.15], [0.05, 0.27]]) cil(c, 0.06, 0.06, 0.7, [0, y, z], '#3d2a1c', { tipo: 0, lados: 6, rot: [0, 0, Math.PI / 2], variar: 0.08 });
      caja(c, 0.5, 0.03, 0.22, [0, 0.1, 0.0], '#c8452a', { variar: 0.1 });
      [[-0.2, 0.34, '#ff6a2a', 0.07], [0.0, 0.5, '#ffb43a', 0.09], [0.2, 0.3, '#ff8a2a', 0.07], [0.06, 0.28, '#ffd866', 0.05]].forEach(([x, h, col, r]) => c.agregar(new THREE.ConeGeometry(r, h, 4), { color: col, tipo: 4, variar: 0.05, matriz: matriz([x, 0.3 + h / 2, 0.05]) }));
      for (const sx of [-1, 1]) caja(c, 0.05, 0.3, 0.05, [sx * 0.42, 0.23, -0.1], HIERRO, { tipo: 0 });
      // los candeleros de la repisa
      for (const sx of [-1, 1]) {
        cil(c, 0.05, 0.065, 0.04, [sx * 0.7, 1.7, -0.05], BRONCE, { tipo: 0, lados: 6 });
        cil(c, 0.016, 0.016, 0.22, [sx * 0.7, 1.82, -0.05], BRONCE, { tipo: 0, lados: 5 });
        vela(c, sx * 0.7, 1.93, -0.05, 0.12, 0.04);
      }
    },
  },
];
