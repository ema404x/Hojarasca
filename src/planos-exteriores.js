// 4.2: huerta, granja y exteriores (sin mecánica nueva: se arman, se ven y se usan de adorno y de límite). Doce piezas de una etapa, a
// la escala de PRECIOS_CONSTRUCCION.md; las que gastan piedra (pirca, camino empedrado, aljibe, pozo, portón y puente de piedra) le dan
// uso al pico. Lo que ya había y por eso no se repite: invernadero, bebedero, mirador, pasarela, embarcadero, gallinero, tambo, chiquero,
// paridera, colmena, vivero, cerco, seto, senda de piedra, jardines y los pozos y muros de la defensa (que son del Desafío).
//   · huerta en terrazas ($3.000), establo ($6.000), corral grande ($3.000), cobertizo de heno ($2.000), palomar ($1.500),
//     aljibe ($2.500), pozo con balde ($2.000), tranquera ($1.000), portón con arco ($4.000) y puente de piedra ($5.000);
//   · pirca de campo y camino empedrado, sin pesos (son piezas de las que se encadenan varias, como el cerco).
// Mismas reglas que planos-lujo.js: frente a -z, origen en el centro sobre el piso, sólo tipo 0 y 4, sin luces, menos de ~1.000 triángulos.
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { calce } from './calces.js';
import { AYUDAS_MUEBLES } from './planos-muebles.js';

const { caja, cil, hs, MADERA, MADERA_OSCURA, TABLA, TABLA_CLARA, PIEDRA, HIERRO, BRONCE, VIDRIO } = AYUDAS_MUEBLES;
const TECHO = '#4e4038';
const PAJA = '#b59a5c';
const TIERRA = '#3a2c20';
const PIEDRAS = [PIEDRA, '#6c665d', '#8a857b', '#756f66'];
const base = { soloRelax: true, apoyaEnPlataforma: true, pieza: true };

// una piedra (icosaedro chato) a la vuelta de x, y, z
const piedra = (c, x, y, z, r, k, esc = [1.2, 0.75, 1.05]) => c.agregar(new THREE.IcosahedronGeometry(r, 0), { color: PIEDRAS[k % PIEDRAS.length], tipo: 4, variar: 0.14, matriz: matriz([x, y, z], [k * 0.7, k * 1.3, 0.2], esc) });
// un palo parado que llega hasta el suelo en una ladera (5 lados: liviano)
function palo(c, suelo, x, z, alto, r = 0.07, color = MADERA, k = 0) {
  const pie = Math.min(0, suelo ? suelo(x, z) : 0) - 0.1;
  c.agregar(new THREE.CylinderGeometry(r * 0.85, r, alto - pie, 5), { color, tipo: 0, variar: 0.12, matriz: matriz([x, pie + (alto - pie) / 2, z], [Math.sin(k * 3.7) * 0.02, k * 1.3, 0]) });
}

export const PIEZAS_EXTERIORES = [
  // ================================================================ la huerta
  {
    ...base, id: 'huerta-terrazas', nombre: 'Huerta en terrazas', categoria: 'exterior', radio: 2.3, ancho: 4.0, fondo: 3.8, alto: 1.35, separacion: 2.4, pendienteMax: 0.5,
    texto: 'Tres terrazas de piedra seca que suben en escalón, con la tierra negra, hileras de verdura y una escalerita al costado. Se hace en una ladera o en un claro, para ver la huerta de un golpe de vista (es de adorno: se siembra en los canteros).',
    pide: { piedra: 20, tabla: 4, tronco: 2 }, pesos: 3000,
    fisica(h) {
      h.segmento(-1.9, -1.75, 1.9, -1.75, 0.2, 0, 1.3); h.segmento(-1.9, 1.55, 1.9, 1.55, 0.2, 0, 1.3);
      for (const sx of [-1, 1]) h.segmento(sx * 1.9, -1.75, sx * 1.9, 1.55, 0.2, 0, 1.3);
    },
    arma(c, P, datos, suelo) {
      const VERDES = ['#4f7a3a', '#6a8f3f', '#5b8a4a', '#8a6a3a'];
      for (let t = 0; t < 3; t++) {
        const z = -1.05 + t * 1.0, alto = 0.4 + t * 0.4;
        // el muro de contención (un bloque de piedra) y las piedras que sobresalen
        c.agregar(new THREE.BoxGeometry(3.6, alto, 0.34), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([-0.1, alto / 2, z - 0.5]) });
        for (let i = 0; i < 6; i++) piedra(c, -1.7 + i * 0.6 + hs(i + t * 7) * 0.15, 0.13 + (i % 2) * 0.2 + t * 0.4, z - 0.7, 0.16 + hs(i * 3 + t) * 0.05, i + t * 5);
        // la tierra de la terraza
        c.agregar(new THREE.BoxGeometry(3.5, 0.06, 0.92), { color: TIERRA, tipo: 4, variar: 0.08, matriz: matriz([-0.1, alto + 0.01, z + 0.0]) });
        // la hilera de verdura: matas bajas, alguna más alta
        for (let i = 0; i < 5; i++) {
          const x = -1.6 + i * 0.7 + (t % 2) * 0.2;
          c.agregar(new THREE.IcosahedronGeometry(0.17 + hs(i + t * 4) * 0.05, 0), { color: VERDES[(i + t) % 4], tipo: 4, variar: 0.1, matriz: matriz([x, alto + 0.13, z + 0.1], [0, i, 0], [1.1, 0.8, 1.1]) });
        }
      }
      // la escalera de piedra del costado derecho
      for (let i = 0; i < 3; i++) c.agregar(new THREE.BoxGeometry(0.55, 0.4 + i * 0.4, 0.8), { color: PIEDRAS[i], tipo: 4, variar: 0.14, matriz: matriz([1.75, (0.4 + i * 0.4) / 2, -1.0 + i * 0.9]) });
    },
  },
  // ================================================================ la granja
  {
    ...base, id: 'establo-caballo', nombre: 'Establo para el caballo', categoria: 'trabajo', radio: 2.3, ancho: 4.2, fondo: 3.8, alto: 3.0, separacion: 2.6, pendienteMax: 0.45,
    texto: 'Un establo de tablas con su pesebre, el heno, un balde y una herradura sobre la puerta. Abierto al frente, de espaldas al viento. Es de adorno y para tener un lugar donde dejar el caballo.',
    pide: { tabla: 26, tronco: 10, piedra: 4 }, pesos: 6000,
    fisica(h) {
      h.segmento(-2.05, 1.65, 2.05, 1.65, 0.07, 0, 2.6);
      for (const sx of [-1, 1]) h.segmento(sx * 2.05, -1.0, sx * 2.05, 1.65, 0.07, 0, 2.4);
      h.segmento(-2.05, -1.65, -0.8, -1.65, 0.08, 0, 1.2);
      h.segmento(-1.6, 1.0, 1.6, 1.0, 0.25, 0, 0.9);
      for (const sx of [-1, 1]) h.circulo(sx * 2.05, -1.65, 0.1, -0.05, 2.7);
    },
    arma(c, P, datos, suelo) {
      caja(c, 4.2, 0.1, 3.4, [0, 0.05, 0], MADERA_OSCURA, { tipo: 0 });
      // paja en el piso
      for (let i = 0; i < 6; i++) caja(c, 0.9, 0.04, 0.7, [-1.2 + (i % 3) * 1.0, 0.12, -0.3 + Math.floor(i / 3) * 0.8], i % 2 ? PAJA : '#a08850', { variar: 0.2, rot: [0, i * 0.7, 0] });
      // los postes (más altos atrás: el techo cae hacia el fondo)
      for (const sx of [-1, 1]) for (const [sz, h] of [[-1.65, 2.6], [1.65, 2.9]]) { caja(c, 0.16, h, 0.16, [sx * 2.05, h / 2, sz], MADERA_OSCURA, { tipo: 0 }); calce(c, suelo, sx * 2.05, sz, 0, 0.1, MADERA_OSCURA, 0); }
      // las tres paredes
      caja(c, 4.0, 2.7, 0.07, [0, 1.4, 1.65], TABLA, { variar: 0.12 });
      for (const sx of [-1, 1]) caja(c, 0.07, 2.5, 2.6, [sx * 2.05, 1.3, 0.35], TABLA, { variar: 0.12 });
      // el frente: un medio panel a la izquierda y la puerta abierta a la derecha
      caja(c, 1.2, 1.2, 0.07, [-1.45, 0.6, -1.65], TABLA_CLARA, { variar: 0.1 });
      caja(c, 0.07, 1.2, 0.9, [0.85, 0.6, -1.25], TABLA_CLARA, { variar: 0.1 });
      // vigas y techo a una agua
      caja(c, 4.4, 0.16, 0.16, [0, 2.6, -1.65], MADERA, { tipo: 0 });
      caja(c, 4.4, 0.16, 0.16, [0, 2.9, 1.65], MADERA, { tipo: 0 });
      const incl = Math.atan2(0.3, 3.3);
      for (let i = 0; i < 6; i++) caja(c, 0.72, 0.05, 3.9, [-1.8 + i * 0.72, 2.8, 0], i % 2 ? TECHO : '#453a31', { variar: 0.1, rot: [incl, 0, 0] });
      // el pesebre contra el fondo, el heno y el balde
      caja(c, 2.0, 0.08, 0.5, [0, 0.8, 1.35], TABLA, { variar: 0.1 });
      for (const sz of [-1, 1]) caja(c, 2.0, 0.28, 0.05, [0, 0.96, 1.35 + sz * 0.23], TABLA, { variar: 0.12 });
      for (const sx of [-1, 1]) caja(c, 0.1, 0.8, 0.1, [sx * 0.9, 0.4, 1.35], MADERA_OSCURA, { tipo: 0 });
      caja(c, 1.9, 0.14, 0.4, [0, 0.95, 1.35], PAJA, { variar: 0.2 });
      cil(c, 0.14, 0.11, 0.26, [1.5, 0.3, 0.9], '#8a8f94', { lados: 8 });
      // las pacas de heno en el rincón
      for (const [x, y, z] of [[-1.5, 0.28, 1.2], [-1.5, 0.28, 0.55], [-1.5, 0.74, 1.0]]) caja(c, 0.7, 0.42, 0.5, [x, y, z], PAJA, { variar: 0.16, rot: [0, x > 0 ? 0.1 : -0.05, 0] });
      // la herradura sobre la puerta
      for (const x of [-0.1, 0.1]) caja(c, 0.04, 0.2, 0.03, [x, 2.3, -1.74], HIERRO, { tipo: 0 });
      caja(c, 0.24, 0.04, 0.03, [0, 2.2, -1.74], HIERRO, { tipo: 0 });
    },
  },
  {
    ...base, id: 'corral-grande', nombre: 'Corral grande', categoria: 'trabajo', radio: 3.4, ancho: 6.2, fondo: 5.2, alto: 1.65, separacion: 3.5, pendienteMax: 0.4,
    texto: 'Un corral de postes y tres varas, de seis metros por cinco, con la tranquera abierta al frente, un bebedero y un montón de pasto. Para tener los animales a la vista; las ovejas del galpón siguen en el suyo.',
    pide: { tronco: 14, tabla: 6 }, pesos: 3000,
    fisica(h) {
      h.segmento(-3.0, 2.5, 3.0, 2.5, 0.08, 0, 1.3);
      for (const sx of [-1, 1]) h.segmento(sx * 3.0, -2.5, sx * 3.0, 2.5, 0.08, 0, 1.3);
      h.segmento(-3.0, -2.5, -0.9, -2.5, 0.08, 0, 1.3); h.segmento(0.9, -2.5, 3.0, -2.5, 0.08, 0, 1.3);
      h.segmento(0.9, -2.5, 0.9, -0.7, 0.05, 0, 1.3);
      h.segmento(1.2, 0.9, 2.2, 0.9, 0.25, 0, 0.7);
    },
    arma(c, P, datos, suelo) {
      // los lados del corral: postes cada ~1,5 m y tres varas; el frente deja la entrada de 1,8 m
      const lado = (ax, az, bx, bz, k) => {
        const largo = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(largo / 1.5)), ang = Math.atan2(-(bz - az), bx - ax);
        for (let i = 0; i <= n; i++) palo(c, suelo, ax + (bx - ax) * i / n, az + (bz - az) * i / n, 1.45 + hs(i + k) * 0.1, 0.075, i % 2 ? MADERA : MADERA_OSCURA, i + k);
        for (const y of [0.4, 0.8, 1.2]) c.agregar(new THREE.BoxGeometry(largo, 0.07, 0.05), { color: TABLA, tipo: 4, variar: 0.1, matriz: matriz([(ax + bx) / 2, y, (az + bz) / 2], [0, ang, 0]) });
      };
      lado(-3.0, 2.5, 3.0, 2.5, 1); lado(-3.0, -2.5, -3.0, 2.5, 2); lado(3.0, -2.5, 3.0, 2.5, 3);
      lado(-3.0, -2.5, -0.9, -2.5, 4); lado(0.9, -2.5, 3.0, -2.5, 5);
      // la tranquera, abierta hacia adentro contra el poste de la derecha
      for (const y of [0.4, 0.8, 1.2]) caja(c, 0.05, 0.07, 1.8, [0.9, y, -1.6], TABLA, { variar: 0.1, rot: [0, 0, 0] });
      caja(c, 0.05, 0.07, 2.0, [0.9, 0.8, -1.6], MADERA, { tipo: 0, rot: [0.9, 0, 0] });
      // el bebedero (tronco ahuecado sobre dos patas) y el pasto
      caja(c, 1.0, 0.26, 0.45, [1.7, 0.35, 0.9], MADERA, { variar: 0.1 });
      caja(c, 0.9, 0.04, 0.33, [1.7, 0.47, 0.9], '#3f5a66', { variar: 0.04 });
      for (const sx of [-1, 1]) caja(c, 0.08, 0.25, 0.4, [1.7 + sx * 0.4, 0.12, 0.9], MADERA_OSCURA, { tipo: 0 });
      for (let i = 0; i < 4; i++) caja(c, 0.8, 0.12, 0.5, [-1.7 + (i % 2) * 0.7, 0.08 + Math.floor(i / 2) * 0.12, -0.8 + (i % 2) * 0.3], PAJA, { variar: 0.2, rot: [0, i * 0.8, 0] });
    },
  },
  {
    ...base, id: 'cobertizo-heno', nombre: 'Cobertizo de heno', categoria: 'trabajo', radio: 2.0, ancho: 3.9, fondo: 2.8, alto: 3.0, separacion: 2.2, pendienteMax: 0.45,
    texto: 'Un techo grande de tablas sobre cuatro postes, abierto de todos lados, con las pacas de heno apiladas abajo y una horquilla contra el poste. El heno no se moja: lo que se junta en verano alcanza para el invierno.',
    pide: { tronco: 6, tabla: 10 }, pesos: 2000,
    fisica(h) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) h.circulo(sx * 1.7, sz * 1.25, 0.1, -0.05, 2.9);
      h.segmento(-1.2, 0.3, 1.2, 0.3, 0.7, 0, 1.3);
    },
    arma(c, P, datos, suelo) {
      for (const sx of [-1, 1]) for (const [sz, h] of [[-1.25, 2.5], [1.25, 2.8]]) { caja(c, 0.16, h, 0.16, [sx * 1.7, h / 2, sz], MADERA_OSCURA, { tipo: 0 }); calce(c, suelo, sx * 1.7, sz, 0, 0.1, MADERA_OSCURA, 0); }
      caja(c, 3.9, 0.15, 0.15, [0, 2.5, -1.25], MADERA, { tipo: 0 });
      caja(c, 3.9, 0.15, 0.15, [0, 2.8, 1.25], MADERA, { tipo: 0 });
      const incl = Math.atan2(0.3, 2.5);
      for (let i = 0; i < 6; i++) caja(c, 0.68, 0.05, 3.0, [-1.7 + i * 0.68, 2.72, 0], i % 2 ? TECHO : '#453a31', { variar: 0.1, rot: [incl, 0, 0] });
      // el heno: tres pacas abajo, dos arriba y una suelta
      for (const [x, y, z] of [[-0.9, 0.24, 0.4], [0.0, 0.24, 0.4], [0.9, 0.24, 0.4], [-0.45, 0.7, 0.4], [0.45, 0.7, 0.4], [0.0, 1.16, 0.4], [-0.9, 0.24, 1.0], [0.9, 0.24, 1.0]])
        caja(c, 0.86, 0.44, 0.55, [x, y, z], PAJA, { variar: 0.16, rot: [0, (x * 0.1), 0] });
      caja(c, 0.5, 0.2, 0.4, [-1.2, 0.1, -0.7], '#a08850', { variar: 0.2, rot: [0, 0.5, 0.1] });
      // la horquilla
      cil(c, 0.025, 0.025, 1.5, [1.55, 0.75, -0.9], '#7a5a38', { tipo: 0, lados: 5, rot: [0.12, 0, 0] });
      for (const s of [-1, 0, 1]) caja(c, 0.02, 0.2, 0.02, [1.55 + s * 0.05, 1.55, -0.96], HIERRO, { tipo: 0 });
    },
  },
  {
    ...base, id: 'palomar', nombre: 'Palomar', categoria: 'exterior', radio: 0.9, ancho: 1.3, fondo: 1.3, alto: 3.6, separacion: 1.2,
    texto: 'Una casita de tablas con techo a dos aguas y seis nichos, arriba de un poste alto con riostras, para que no suban los gatos. Hay palomas posadas en los palitos. Es de adorno: sube la vista del campo.',
    pide: { tabla: 10, tronco: 3 }, pesos: 1500,
    fisica(h) { h.circulo(0, 0, 0.2, -0.05, 3.3); },
    arma(c, P, datos, suelo) {
      cil(c, 0.1, 0.13, 2.4, [0, 1.2, 0], MADERA_OSCURA, { tipo: 0, lados: 6 });
      calce(c, suelo, 0, 0, 0, 0.15, MADERA_OSCURA, 0);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; caja(c, 0.05, 0.9, 0.05, [Math.cos(a) * 0.32, 2.0, Math.sin(a) * 0.32], MADERA, { tipo: 0, rot: [Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35] }); }
      // la casita y su techo
      caja(c, 1.0, 0.8, 0.8, [0, 2.8, 0], TABLA, { variar: 0.12 });
      caja(c, 1.14, 0.06, 0.1, [0, 2.4, -0.44], MADERA_OSCURA, { tipo: 0 });
      for (const s of [-1, 1]) caja(c, 1.25, 0.05, 0.62, [0, 3.38, s * 0.3], s < 0 ? TECHO : '#453a31', { variar: 0.1, rot: [s * 0.62, 0, 0] });
      // los nichos (dos filas de tres) y los palitos para posarse
      for (let f = 0; f < 2; f++) for (let i = 0; i < 3; i++) {
        const x = -0.3 + i * 0.3, y = 2.95 - f * 0.34;
        caja(c, 0.14, 0.17, 0.02, [x, y, -0.41], '#2a2420', { tipo: 0 });
        cil(c, 0.012, 0.012, 0.14, [x, y - 0.12, -0.48], MADERA, { tipo: 0, lados: 4, rot: [Math.PI / 2, 0, 0] });
      }
      // tres palomas, de bulto: cuerpo, cabeza y cola
      for (const [x, y] of [[-0.3, 2.83], [0.3, 2.49], [0.0, 2.83]]) {
        c.agregar(new THREE.IcosahedronGeometry(0.07, 0), { color: '#8d8f93', tipo: 4, variar: 0.08, matriz: matriz([x, y, -0.5], [0, 0, 0], [1, 0.9, 1.5]) });
        c.agregar(new THREE.IcosahedronGeometry(0.04, 0), { color: '#9a9ca0', tipo: 4, variar: 0.08, matriz: matriz([x, y + 0.06, -0.58]) });
      }
    },
  },
  {
    ...base, id: 'aljibe', nombre: 'Aljibe de piedra', categoria: 'exterior', radio: 1.3, ancho: 2.4, fondo: 3.0, alto: 2.1, separacion: 1.5,
    texto: 'Un tanque redondo de piedra con tapa de tablas y una canaleta que baja del techo de al lado; abajo, una canilla y un balde. Guarda el agua de la lluvia para el verano. Es de adorno y gasta piedra del pico.',
    pide: { piedra: 18, tabla: 3 }, pesos: 2500,
    fisica(h) { h.circulo(0, 0, 1.05, -0.05, 1.5); },
    arma(c, P, datos, suelo) {
      c.agregar(new THREE.CylinderGeometry(1.0, 1.08, 1.3, 12), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([0, 0.65, 0]) });
      calce(c, suelo, 0, 0, 0, 1.05, PIEDRA, 4);
      // las hiladas de piedra que sobresalen
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, y = 0.3 + (i % 3) * 0.4; piedra(c, Math.cos(a) * 1.02, y, Math.sin(a) * 1.02, 0.19, i, [0.9, 0.7, 0.9]); }
      // la tapa: un borde de piedra, la cúpula de tablas y la tapa de inspección con anillo de hierro
      c.agregar(new THREE.CylinderGeometry(1.05, 1.05, 0.16, 12), { color: '#6c665d', tipo: 4, variar: 0.14, matriz: matriz([0, 1.36, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.55, 0.95, 0.36, 12), { color: TABLA, tipo: 4, variar: 0.12, matriz: matriz([0, 1.62, 0]) });
      caja(c, 0.6, 0.06, 0.6, [0, 1.84, 0], MADERA, { variar: 0.1 });
      cil(c, 0.08, 0.08, 0.02, [0, 1.89, 0], HIERRO, { tipo: 0, lados: 8 });
      // la canaleta que viene del techo (de costado) y la canilla con el balde
      caja(c, 0.14, 0.12, 1.1, [0.75, 1.75, 0.55], HIERRO, { tipo: 0, rot: [0.35, 0, 0] });
      cil(c, 0.03, 0.03, 0.2, [0, 0.55, -1.1], BRONCE, { tipo: 0, lados: 6, rot: [Math.PI / 2, 0, 0] });
      cil(c, 0.15, 0.12, 0.28, [0, 0.14, -1.35], '#8a8f94', { lados: 8 });
      caja(c, 0.7, 0.08, 0.4, [0, 0.04, -1.3], PIEDRA, { variar: 0.14 });
    },
  },
  {
    ...base, id: 'pozo-balde', nombre: 'Pozo con balde', categoria: 'exterior', radio: 1.1, ancho: 1.9, fondo: 1.5, alto: 2.25, separacion: 1.3,
    texto: 'Un brocal de piedra con dos postes, un techito, la manivela y el balde con su soga. De adorno: el agua no se saca. Es el que se ve en los campos de la zona, junto a la casa. (El pozo con estacas de la defensa es otra cosa.)',
    pide: { piedra: 12, tabla: 3, tronco: 2 }, pesos: 2000,
    fisica(h) { h.circulo(0, 0, 0.78, -0.05, 0.9); for (const sx of [-1, 1]) h.circulo(sx * 0.88, 0, 0.07, -0.05, 2.0); },
    arma(c, P, datos, suelo) {
      c.agregar(new THREE.CylinderGeometry(0.76, 0.82, 0.5, 12), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([0, 0.25, 0]) });
      calce(c, suelo, 0, 0, 0, 0.8, PIEDRA, 4);
      // el borde: diez piedras alrededor de la boca y el agua oscura adentro
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; c.agregar(new THREE.BoxGeometry(0.34, 0.3, 0.22), { color: PIEDRAS[i % 4], tipo: 4, variar: 0.14, matriz: matriz([Math.cos(a) * 0.64, 0.65, Math.sin(a) * 0.64], [0, -a, 0]) }); }
      c.agregar(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 12), { color: '#25343a', tipo: 4, variar: 0.04, matriz: matriz([0, 0.62, 0]) });
      // el bastidor: dos postes, el travesaño con el cilindro de la soga, la manivela, y un techo a dos aguas
      for (const sx of [-1, 1]) { caja(c, 0.1, 2.0, 0.1, [sx * 0.88, 1.0, 0], MADERA_OSCURA, { tipo: 0 }); calce(c, suelo, sx * 0.88, 0, 0, 0.07, MADERA_OSCURA, 0); }
      cil(c, 0.07, 0.07, 1.75, [0, 1.35, 0], MADERA, { tipo: 0, lados: 6, rot: [0, 0, Math.PI / 2] });
      caja(c, 0.05, 0.05, 0.3, [0.95, 1.35, -0.12], HIERRO, { tipo: 0 }); caja(c, 0.05, 0.22, 0.05, [0.95, 1.25, -0.27], HIERRO, { tipo: 0 });
      for (const s of [-1, 1]) caja(c, 2.0, 0.05, 0.7, [0, 2.0, s * 0.28], s < 0 ? TECHO : '#453a31', { variar: 0.1, rot: [s * 0.5, 0, 0] });
      cil(c, 0.012, 0.012, 0.7, [0, 1.0, 0], '#8a7a5a', { tipo: 0, lados: 4 });
      cil(c, 0.13, 0.1, 0.24, [0, 0.78, 0], '#8a8f94', { lados: 8 });
    },
  },
  {
    ...base, id: 'tranquera', nombre: 'Tranquera', categoria: 'exterior', radio: 1.9, ancho: 3.6, fondo: 3.4, alto: 1.7, separacion: 1.2, pendienteMax: 0.5,
    snap: { tipo: 'linea', familia: 'cerco', largo: 3.0, umbral: 1.0 },
    texto: 'Dos postes gruesos con una tranquera de cuatro varas y su cruz, abierta a medias para que pases. Va entre dos tramos de cerco: el camino al corral o al potrero.',
    pide: { tronco: 4, tabla: 4 }, pesos: 1000,
    fisica(h) { for (const sx of [-1, 1]) h.circulo(sx * 1.5, 0, 0.12, -0.05, 1.7); h.segmento(-1.5, 0, -1.5 + 2.6 * Math.cos(0.7), -2.6 * Math.sin(0.7), 0.05, 0, 1.4); },
    arma(c, P, datos, suelo) {
      for (const sx of [-1, 1]) { palo(c, suelo, sx * 1.5, 0, 1.7, 0.12, MADERA_OSCURA, sx + 3); piedra(c, sx * 1.5, 0.08, 0, 0.2, sx + 5); }
      // los tramos de cerco de los costados, dos varas cada uno
      for (const sx of [-1, 1]) for (const y of [0.55, 1.05]) caja(c, 0.4, 0.06, 0.05, [sx * 1.74, y, 0], TABLA, { variar: 0.1 });
      // la hoja, abierta a medias: bisagra en el poste de la izquierda y girada 40° hacia el frente (4 varas, dos tablones y una cruz)
      const L = 2.6, ang = 0.7, mx = -1.5 + Math.cos(ang) * L / 2, mz = -Math.sin(ang) * L / 2;
      for (const y of [0.35, 0.7, 1.05, 1.4]) caja(c, L, 0.07, 0.05, [mx, y, mz], TABLA, { variar: 0.1, rot: [0, ang, 0] });
      for (const t of [0.04, 0.96]) caja(c, 0.07, 1.14, 0.06, [-1.5 + Math.cos(ang) * L * t, 0.87, -Math.sin(ang) * L * t], MADERA, { tipo: 0, rot: [0, ang, 0] });
      caja(c, Math.hypot(L, 1.05), 0.06, 0.04, [mx, 0.87, mz], MADERA_OSCURA, { tipo: 0, rot: [0, ang, Math.atan2(1.05, L)] });
      // el pasador de hierro en el poste de la derecha
      caja(c, 0.14, 0.04, 0.04, [1.4, 1.05, -0.1], HIERRO, { tipo: 0 });
    },
  },
  {
    ...base, id: 'porton-arco', nombre: 'Portón con arco', categoria: 'exterior', radio: 2.4, ancho: 4.4, fondo: 2.0, alto: 3.9, separacion: 1.2, pendienteMax: 0.5,
    texto: 'Dos pilares de piedra con un arco de madera arriba y un farol colgado, y las dos hojas del portón abiertas contra los pilares. Es la entrada de una chacra o de un camino largo. Gasta piedra del pico.',
    pide: { piedra: 16, tronco: 6, tabla: 6 }, pesos: 4000,
    fisica(h) { for (const sx of [-1, 1]) h.circulo(sx * 1.75, 0, 0.5, -0.05, 2.7); },
    arma(c, P, datos, suelo) {
      for (const sx of [-1, 1]) {
        const X = sx * 1.75;
        for (let i = 0; i < 6; i++) caja(c, 0.86 - (i % 2) * 0.04, 0.4, 0.8 - (i % 3) * 0.03, [X, 0.2 + i * 0.4, 0], PIEDRAS[(i + (sx > 0 ? 1 : 0)) % 4], { variar: 0.16, rot: [0, (i % 2 ? 0.04 : -0.03), 0] });
        calce(c, suelo, X, 0, 0, 0.5, PIEDRA, 4);
        caja(c, 1.0, 0.12, 0.94, [X, 2.46, 0], '#6c665d', { variar: 0.12 });
        c.agregar(new THREE.ConeGeometry(0.45, 0.45, 4), { color: '#8a857b', tipo: 4, variar: 0.12, matriz: matriz([X, 2.74, 0], [0, Math.PI / 4, 0]) });
      }
      // el arco: ocho tramos de viga siguiendo una media circunferencia que apoya en los pilares
      const R = 1.45, Y0 = 2.3;
      for (let i = 0; i < 8; i++) {
        const am = Math.PI * (i + 0.5) / 8;
        caja(c, 2 * R * Math.sin(Math.PI / 16) + 0.07, 0.22, 0.22, [Math.cos(am) * R, Y0 + Math.sin(am) * R, 0], i % 2 ? MADERA : MADERA_OSCURA, { tipo: 0, rot: [0, 0, am + Math.PI / 2] });
      }
      // el farol colgado del medio del arco
      cil(c, 0.008, 0.008, 0.5, [0, Y0 + R - 0.36, 0], HIERRO, { tipo: 0, lados: 4 });
      caja(c, 0.2, 0.3, 0.2, [0, Y0 + R - 0.76, 0], VIDRIO, { variar: 0.03 });
      caja(c, 0.26, 0.05, 0.26, [0, Y0 + R - 0.58, 0], BRONCE, { tipo: 0 }); caja(c, 0.26, 0.05, 0.26, [0, Y0 + R - 0.94, 0], BRONCE, { tipo: 0 });
      // las dos hojas, abiertas hacia el frente de canto contra la cara de adentro de cada pilar (tablas con travesaños)
      for (const sx of [-1, 1]) {
        for (const y of [0.4, 0.9, 1.4, 1.9]) caja(c, 0.05, 0.1, 1.0, [sx * 1.3, y, -0.6], TABLA, { variar: 0.1 });
        for (const z of [-1.08, -0.12]) caja(c, 0.07, 1.7, 0.06, [sx * 1.3, 1.15, z], MADERA, { tipo: 0 });
        caja(c, 0.05, 0.06, 1.3, [sx * 1.3, 1.15, -0.6], MADERA_OSCURA, { tipo: 0, rot: [Math.atan2(1.5, 1.0), 0, 0] });
      }
    },
  },
  {
    ...base, id: 'puente-piedra', nombre: 'Puente de piedra', categoria: 'exterior', radio: 2.5, ancho: 4.8, fondo: 1.9, alto: 1.05, separacion: 1.2, pendienteMax: 0.5,
    texto: 'Un puentecito de piedra de un solo ojo, con el tablero a medio metro del suelo y un parapeto bajo a cada lado. Se cruza caminando. Se pone sobre el arroyo seco o un zanjón; gasta mucha piedra del pico.',
    pide: { piedra: 36, tabla: 2 }, pesos: 5000,
    fisica(h) {
      h.plataforma(0, 0, 4.7, 1.5, 0.52, 0.2, 0.62);
      for (const sz of [-1, 1]) h.segmento(-2.3, sz * 0.82, 2.3, sz * 0.82, 0.12, 0.5, 1.0);
    },
    arma(c, P, datos, suelo) {
      // los dos estribos de los extremos y el arco de dovelas entre ellos (a cada cara)
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) for (let i = 0; i < 2; i++) caja(c, 1.0 - i * 0.1, 0.27, 0.34, [sx * 1.9, 0.14 + i * 0.27, sz * 0.7], PIEDRAS[(i + (sx > 0 ? 1 : 0)) % 4], { variar: 0.16 });
        caja(c, 1.0, 0.5, 1.1, [sx * 1.9, 0.25, 0], '#5f5a52', { variar: 0.1 });
      }
      for (const sz of [-1, 1]) for (let i = 0; i < 7; i++) {
        const a = Math.PI * (i + 0.5) / 7, x = Math.cos(a) * 1.0, y = Math.sin(a) * 0.32 + 0.12;
        caja(c, 0.32, 0.16, 0.36, [x, y + 0.04, sz * 0.7], PIEDRAS[i % 4], { variar: 0.16, rot: [0, 0, a - Math.PI / 2 + 0.0] });
      }
      // el tablero de lajas y los parapetos con su tapa
      caja(c, 4.6, 0.14, 1.5, [0, 0.45, 0], '#6c665d', { variar: 0.12 });
      for (let i = 0; i < 6; i++) caja(c, 0.7, 0.04, 1.3, [-1.85 + i * 0.74, 0.54, 0], PIEDRAS[(i + 1) % 4], { variar: 0.14, rot: [0, 0, 0] });
      for (const sz of [-1, 1]) {
        caja(c, 4.6, 0.3, 0.24, [0, 0.69, sz * 0.8], PIEDRA, { variar: 0.16 });
        for (let i = 0; i < 6; i++) piedra(c, -1.85 + i * 0.74, 0.88, sz * 0.8, 0.16, i + (sz > 0 ? 3 : 0), [1.6, 0.6, 1.1]);
      }
    },
  },
  // ================================================================ lo que se encadena (sin pesos)
  {
    ...base, id: 'pirca-campo', nombre: 'Pirca de campo', categoria: 'exterior', radio: 1.7, ancho: 3.0, fondo: 0.7, alto: 0.95, separacion: 0.6, pendienteMax: 0.55,
    snap: { tipo: 'linea', familia: 'pirca', largo: 3.0, umbral: 1.0 },
    texto: 'Un tramo de muro de piedra seca, sin mezcla, como los que dividen los campos: piedras grandes abajo, chicas arriba y una hilada de lajas encima. Se encadenan varios para cerrar un potrero o un patio. (Es el muro de adorno: el de la defensa es otro.)',
    pide: { piedra: 14 },
    fisica(h) { h.segmento(-1.15, 0, 1.15, 0, 0.3, -0.05, 0.9); },
    arma(c, P, datos, suelo) {
      const filas = [[11, 0.22, 0.27], [9, 0.55, 0.23], [7, 0.8, 0.18]];
      let k = 0;
      filas.forEach(([n, y, r], f) => {
        for (let i = 0; i < n; i++, k++) {
          const x = -1.4 + (i + 0.5 + (f % 2 ? 0.5 : 0)) * (2.8 / n) * 1.0 - (f % 2 ? 0.0 : 0), z = (hs(k) - 0.5) * 0.18;
          if (Math.abs(x) > 1.52) continue;
          piedra(c, x, y + hs(k + 9) * 0.04, z, r, k, [1.15, 0.8, 1.35]);
        }
      });
      for (let i = 0; i < 3; i++) caja(c, 0.95, 0.07, 0.5, [-1.0 + i * 1.0, 0.93, 0], PIEDRAS[i % 4], { variar: 0.14, rot: [0, (i - 1) * 0.06, 0] });
      if (suelo) for (const sx of [-1.2, 0, 1.2]) calce(c, suelo, sx, 0, 0.1, 0.3, PIEDRA, 4);
    },
  },
  {
    ...base, id: 'camino-empedrado', nombre: 'Camino empedrado', categoria: 'exterior', radio: 1.6, ancho: 3.0, fondo: 2.4, alto: 0.1, separacion: 0.2, pendienteMax: 0.5,
    snap: { tipo: 'linea', familia: 'empedrado', largo: 3.0, umbral: 1.0 },
    texto: 'Un tramo de calle empedrada, de canto rodado bien apretado entre dos cordones de piedra: más ancho y más firme que la senda de lajas. Los tramos se encadenan para armar el camino de la casa al galpón.',
    pide: { piedra: 12 },
    arma(c, P, datos, suelo) {
      const h = (x, z) => (suelo ? suelo(x, z) : 0);
      c.agregar(new THREE.BoxGeometry(3.0, 0.05, 2.2), { color: '#4a4036', tipo: 4, variar: 0.08, matriz: matriz([0, 0.025, 0]) });
      for (let f = 0; f < 5; f++) for (let i = 0; i < 7; i++) {
        const x = -1.25 + i * 0.42 + (f % 2) * 0.21, z = -0.8 + f * 0.4 + (hs(f * 9 + i) - 0.5) * 0.06, k = f * 7 + i;
        if (x > 1.35) continue;
        c.agregar(new THREE.CylinderGeometry(0.17, 0.19, 0.07, 5), { color: PIEDRAS[k % 4], tipo: 4, variar: 0.14, matriz: matriz([x, 0.07 + h(x, z), z], [0, k * 1.1, 0], [1.1, 1, 0.92]) });
      }
      for (const sz of [-1, 1]) for (let i = 0; i < 4; i++) caja(c, 0.7, 0.1, 0.18, [-1.1 + i * 0.73, 0.07 + h(-1.1 + i * 0.73, sz * 1.1), sz * 1.1], PIEDRAS[(i + 1) % 4], { variar: 0.14, rot: [0, (i - 1.5) * 0.03, 0] });
    },
  },
];
