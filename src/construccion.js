// Construir tu propio puesto: se elige el plano, se marca el lugar y se levanta
// por etapas, gastando los materiales que juntaste.
import * as THREE from 'three';
import { Constructor, matriz, troncoCurvo } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { clamp } from './ruido.js';
import { crearIndiceEspacial2D } from './rendimiento.js';
import { TINTES, tenible, tenirColores } from './tintes.js';
import { LAGO } from './config.js';
import { registrarLuz, olvidarLuz } from './luces.js';
import { ESTILO, marcarConstructor, zonaCasa, zonaFortin, pinturaDeObra, rangosPorZona, pintarRangos, firmaEstiloObra, estiloJardinDe, agruparCasas, ESTANDARTE_EN, PIE_PIRCA, POSTES_TORRE, FLORES, SETOS, SENDAS } from './estilo-casa.js';
import { pintarHoja } from './personal-casa-mundo.js';
import { PLANOS_MAQUINAS } from './planos-maquinas.js';
import { PLANOS_VEHICULOS } from './planos-vehiculos.js';
import { calce, zocalo, sueloMin } from './calces.js';

const MADERA = '#6b5238';
const MADERA_OSCURA = '#4a3b2c';
const TABLA = '#8a6b4a';
const PIEDRA = '#7d766c';
const TECHO = '#4e4038';

// ---------------------------------------------------------------- los planos
// Cada etapa arma su parte sobre el mismo constructor: al terminar una etapa
// se rehace la malla entera, que sigue siendo un solo dibujo.
export const PLANOS = [
  {
    id: 'puesto',
    nombre: 'Puesto de troncos',
    texto: 'Cuatro paredes de tronco a media madera, piso de tablas y techo de dos aguas. Lo que levanta un puestero en una semana, con lo que hay alrededor.',
    ancho: 5.2, fondo: 4.2, alto: 2.35,
    radio: 5.2,
    etapas: [
      {
        nombre: 'Cimientos y pilotes',
        pide: { piedra: 8, tronco: 4 },
        dice: 'Se nivela el suelo y se apoyan las esquinas sobre piedra, para que la madera no toque la tierra.',
        arma(c, P, datos, suelo) {
          const { ancho: W, fondo: D } = P;
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            c.agregar(new THREE.CylinderGeometry(0.34, 0.42, 0.55, 7), { color: PIEDRA, tipo: 4, variar: 0.18, matriz: matriz([sx * (W / 2 - 0.3), 0.18, sz * (D / 2 - 0.3)]) });
            calce(c, suelo, sx * (W / 2 - 0.3), sz * (D / 2 - 0.3), -0.09, 0.42);   // 3.0.1: en la ladera, hasta el suelo
          }
          c.agregar(new THREE.CylinderGeometry(0.3, 0.36, 0.5, 7), { color: PIEDRA, tipo: 4, variar: 0.18, matriz: matriz([0, 0.16, D / 2 - 0.3]) });
          calce(c, suelo, 0, D / 2 - 0.3, -0.08, 0.36);
          for (const sz of [-1, 1]) {
            c.agregar(troncoCurvo(W, 0.14, 0.13, [0, 0], 4, 2), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([-W / 2, 0.44, sz * (D / 2 - 0.3)], [0, 0, -Math.PI / 2]) });
          }
        },
      },
      {
        nombre: 'Piso de tablas',
        pide: { tabla: 14 },
        dice: 'Las tablas van sobre los tirantes, dejando un dedo entre una y otra para que respire.',
        arma(c, P, datos, suelo) {
          const { ancho: W, fondo: D } = P;
          for (let i = 0; i < Math.round(D / 0.3); i++) {
            const z = -D / 2 + 0.15 + i * 0.3;
            c.agregar(new THREE.BoxGeometry(W, 0.08, 0.27), { color: i % 3 ? TABLA : '#7a5f43', tipo: 4, variar: 0.12, matriz: matriz([0, 0.54, z]) });
          }
          // el escalón de entrada
          c.agregar(new THREE.BoxGeometry(1.4, 0.16, 0.6), { color: '#7a5f43', tipo: 4, variar: 0.1, matriz: matriz([0, 0.28, -D / 2 - 0.35]) });
          // 3.0.1: apoyado en una piedra (antes quedaba en el aire, a 20 cm del suelo)
          zocalo(c, suelo, -0.62, -D / 2 - 0.35, 0.62, -D / 2 - 0.35, 0.21, 0.5);
        },
      },
      {
        nombre: 'Paredes de tronco',
        pide: { tronco: 18 },
        dice: 'Tronco sobre tronco, encastrados a media madera en las esquinas. El hueco de la puerta mira al sendero.',
        colisiona: true,
        arma(c, P) {
          const { ancho: W, fondo: D, alto: H } = P;
          const hueco = 0.95;
          for (let i = 0; i < 7; i++) {
            const y = 0.68 + i * 0.26;
            const desfase = (i % 2) * 0.06;
            // frente, con el hueco de la puerta
            const largoLado = (W - hueco) / 2;
            for (const sx of [-1, 1]) {
              // 3.0.1: el tronco crece hacia +x desde donde arranca: el de la derecha arranca en el
              // marco (antes arrancaba en la esquina y quedaba afuera de la casa, con el frente
              // derecho abierto y una pared invisible en su lugar)
              c.agregar(troncoCurvo(largoLado, 0.13, 0.12, [0, 0], 4, 2), {
                color: i % 2 ? MADERA : '#5f4a33', tipo: 0, variar: 0.1,
                matriz: matriz([sx < 0 ? -(hueco / 2 + largoLado) : hueco / 2, y, -D / 2 + desfase], [0, 0, -Math.PI / 2]),
              });
            }
            // fondo entero
            c.agregar(troncoCurvo(W, 0.13, 0.12, [0, 0], 4, 2), {
              color: i % 2 ? '#5f4a33' : MADERA, tipo: 0, variar: 0.1,
              matriz: matriz([-W / 2, y, D / 2 - desfase], [0, 0, -Math.PI / 2]),
            });
            // laterales
            for (const sx of [-1, 1]) {
              c.agregar(troncoCurvo(D, 0.13, 0.12, [0, 0], 4, 2), {
                color: i % 2 ? MADERA : '#5f4a33', tipo: 0, variar: 0.1,
                matriz: matriz([sx * (W / 2 - desfase), y, -D / 2], [Math.PI / 2, 0, 0]),
              });
            }
          }
          // marco de la puerta y ventana del lateral
          c.agregar(new THREE.BoxGeometry(hueco + 0.3, 0.14, 0.16), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([0, H + 0.12, -D / 2 - 0.04]) });
          for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.14, H - 0.5, 0.16), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([sx * (hueco / 2 + 0.07), 1.4, -D / 2 - 0.04]) });
        },
      },
      {
        nombre: 'Techo y terminaciones',
        pide: { tabla: 16, tronco: 4 },
        dice: 'Dos aguas de tabla, la cumbrera y el alero sobre la puerta. Adentro, el catre y una repisa.',
        termina: true,
        arma(c, P, datos, suelo) {
          const { ancho: W, fondo: D, alto: H } = P;
          // frontones
          for (const dz of [-D / 2, D / 2]) {
            const tri = new THREE.BufferGeometry();
            tri.setAttribute('position', new THREE.Float32BufferAttribute([-W / 2, 0, 0, W / 2, 0, 0, 0, 1.15, 0, W / 2, 0, 0, -W / 2, 0, 0, 0, 1.15, 0], 3));
            c.agregar(tri, { color: '#6a4f36', tipo: 0, matriz: matriz([0, H + 0.2, dz]) });
          }
          // cumbrera
          c.agregar(troncoCurvo(D + 0.5, 0.1, 0.1, [0, 0], 4, 2), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, H + 1.35, -D / 2 - 0.25], [Math.PI / 2, 0, 0]) });
          // faldones
          const largo = Math.hypot(1.15, W / 2) + 0.35;
          for (const lado of [-1, 1]) {
            const incl = Math.atan2(1.15, W / 2);
            for (let i = 0; i < Math.round((D + 0.6) / 0.32); i++) {
              const z = -D / 2 - 0.3 + 0.16 + i * 0.32;
              c.agregar(new THREE.BoxGeometry(largo, 0.07, 0.29), {
                color: i % 3 ? TECHO : '#453a30', tipo: 4, variar: 0.1,
                matriz: matriz([lado * (W / 4 + 0.05), H + 0.78, z], [0, 0, -lado * incl]),
              });
            }
          }
          // alero sobre la puerta
          c.agregar(new THREE.BoxGeometry(W * 0.8, 0.1, 1.1), { color: TECHO, tipo: 4, matriz: matriz([0, H + 0.34, -D / 2 - 0.5], [0.16, 0, 0]) });
          // 3.0.1: los horcones del alero van del suelo al alero (antes arrancaban a 62 cm del
          // suelo, a la altura del piso de adentro, y no llegaban al techo)
          for (const sx of [-1, 1]) {
            c.agregar(new THREE.CylinderGeometry(0.07, 0.08, 2.7, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * (W * 0.34), 1.35, -D / 2 - 0.9]) });
            calce(c, suelo, sx * (W * 0.34), -D / 2 - 0.9, 0.01, 0.08, MADERA_OSCURA, 0);
          }
          // catre y repisa adentro
          // 3.0.1: el catre, contra la pared del fondo y adentro (antes atravesaba la pared y
          // una pata quedaba afuera)
          c.agregar(new THREE.BoxGeometry(1.9, 0.12, 0.9), { color: TABLA, tipo: 4, matriz: matriz([-W / 2 + 1.2, 0.95, D / 2 - 1.12], [0, Math.PI / 2, 0]) });
          for (const sz of [-0.8, 0.8]) c.agregar(new THREE.BoxGeometry(0.12, 0.42, 0.12), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([-W / 2 + 1.2, 0.74, D / 2 - 1.12 + sz]) });
          c.agregar(new THREE.BoxGeometry(0.95, 0.16, 0.5), { color: '#b5ab98', tipo: 4, variar: 0.08, matriz: matriz([-W / 2 + 1.2, 1.09, D / 2 - 1.12], [0, Math.PI / 2, 0]) });
          c.agregar(new THREE.BoxGeometry(W - 1.2, 0.07, 0.34), { color: TABLA, tipo: 4, matriz: matriz([0, 1.72, D / 2 - 0.22]) });
        },
      },
    ],
  },
];
PLANOS.push(...PLANOS_MAQUINAS);
PLANOS.push(...PLANOS_VEHICULOS);   // 2.9: varadero y velero, tirolesa y puente colgante

// ---------------------------------------------------------------- galpón abierto
PLANOS.push({
  id: 'galponcito',
  nombre: 'Galpón de herramientas',
  texto: 'Cuatro horcones, techo de dos aguas y los costados abiertos. Para guardar la leña seca y lo que no quiera mojarse.',
  ancho: 4.6, fondo: 3.6, alto: 2.3,
  radio: 4.4,
  etapas: [
    {
      nombre: 'Horcones',
      pide: { piedra: 4, tronco: 6 },
      dice: 'Cuatro horcones enterrados sobre piedra, uno en cada esquina.',
      arma(c, P, datos, suelo) {
        const { ancho: W, fondo: D, alto: H } = P;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          c.agregar(new THREE.CylinderGeometry(0.28, 0.34, 0.4, 7), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([sx * (W / 2 - 0.2), 0.14, sz * (D / 2 - 0.2)]) });
          calce(c, suelo, sx * (W / 2 - 0.2), sz * (D / 2 - 0.2), -0.05, 0.34);   // 3.0.1
          c.agregar(new THREE.CylinderGeometry(0.11, 0.14, H, 7), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([sx * (W / 2 - 0.2), 0.3 + H / 2, sz * (D / 2 - 0.2)]) });
        }
      },
    },
    {
      nombre: 'Piso y fondo',
      pide: { tabla: 10, tronco: 3 },
      dice: 'Piso de tablas y una pared de fondo, la que para el viento del oeste.',
      colisiona: true,
      arma(c, P) {
        const { ancho: W, fondo: D } = P;
        for (let i = 0; i < Math.round(D / 0.32); i++) {
          c.agregar(new THREE.BoxGeometry(W - 0.2, 0.07, 0.29), { color: i % 2 ? TABLA : '#7a5f43', tipo: 4, variar: 0.12, matriz: matriz([0, 0.34, -D / 2 + 0.16 + i * 0.32]) });
        }
        // 3.0.1: las tablas apoyan en dos travesaños clavados a los horcones (antes flotaban)
        for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.12, 0.12, D - 0.3), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * (W / 2 - 0.2), 0.245, 0]) });
        for (let i = 0; i < 6; i++) {
          c.agregar(troncoCurvo(W - 0.4, 0.11, 0.1, [0, 0], 4, 2), { color: i % 2 ? MADERA : '#5f4a33', tipo: 0, variar: 0.1, matriz: matriz([-(W - 0.4) / 2, 0.5 + i * 0.26, D / 2 - 0.2], [0, 0, -Math.PI / 2]) });
        }
      },
    },
    {
      nombre: 'Techo de tablas',
      pide: { tabla: 12 },
      dice: 'Dos aguas de tabla, con el alero bien salido para que el agua caiga lejos.',
      termina: true,
      arma(c, P) {
        const { ancho: W, fondo: D, alto: H } = P;
        const largo = Math.hypot(0.95, W / 2) + 0.45;
        const incl = Math.atan2(0.95, W / 2);
        c.agregar(troncoCurvo(D + 0.6, 0.09, 0.09, [0, 0], 4, 2), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, H + 1.2, -D / 2 - 0.3], [Math.PI / 2, 0, 0]) });
        for (const lado of [-1, 1]) {
          for (let i = 0; i < Math.round((D + 0.8) / 0.33); i++) {
            c.agregar(new THREE.BoxGeometry(largo, 0.06, 0.3), { color: i % 3 ? TECHO : '#453a30', tipo: 4, variar: 0.1,
              matriz: matriz([lado * (W / 4 + 0.08), H + 0.72, -D / 2 - 0.4 + 0.16 + i * 0.33], [0, 0, -lado * incl]) });
          }
        }
        // percha para colgar cosas y una pila de leña
        c.agregar(troncoCurvo(W - 0.8, 0.06, 0.06, [0, 0], 4, 2), { color: MADERA, tipo: 0, matriz: matriz([-(W - 0.8) / 2, 1.85, D / 2 - 0.5], [0, 0, -Math.PI / 2]) });
        for (let i = 0; i < 10; i++) {
          const fila = Math.floor(i / 5), col = i % 5;
          c.agregar(new THREE.CylinderGeometry(0.07, 0.08, 1.1, 6), { color: i % 3 ? MADERA : '#5b4a36', tipo: 0, variar: 0.12,
            matriz: matriz([-W / 2 + 0.7, 0.44 + fila * 0.16, -D / 2 + 0.5 + col * 0.17], [0, 0, Math.PI / 2]) });
        }
      },
    },
  ],
});

// ---------------------------------------------------------------- mirador de tablas
const PELDANOS_MIRADOR = 11;   // 3.0.1: los mismos en la malla y en la física (ver `rehacer`)
PLANOS.push({
  id: 'mirador',
  nombre: 'Mirador de tablas',
  texto: 'Una plataforma sobre cuatro patas, con escalera y baranda. Para mirar el valle por encima del pastizal.',
  ancho: 3, fondo: 3, alto: 3.2,
  radio: 3.4,
  // 3.0.1: como el adarve, el pie de la escalera tiene que caer cerca del suelo (en una
  // ladera quedaba a más de un metro y no se podía subir)
  pieEscalera: { lz: -5.4, tolerancia: 0.38 },
  etapas: [
    {
      nombre: 'Patas y travesaños',
      pide: { piedra: 4, tronco: 8 },
      dice: 'Cuatro patas cruzadas con travesaños, que es lo que le da el aguante.',
      arma(c, P, datos, suelo) {
        const { ancho: W, fondo: D, alto: H } = P;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          c.agregar(new THREE.CylinderGeometry(0.26, 0.3, 0.35, 7), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([sx * (W / 2 - 0.2), 0.12, sz * (D / 2 - 0.2)]) });
          calce(c, suelo, sx * (W / 2 - 0.2), sz * (D / 2 - 0.2), -0.05, 0.3);   // 3.0.1
          c.agregar(new THREE.CylinderGeometry(0.1, 0.13, H, 7), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([sx * (W / 2 - 0.2), 0.25 + H / 2, sz * (D / 2 - 0.2)], [0, 0, sx * 0.03]) });
        }
        for (const y of [1.0, 2.1]) for (const sz of [-1, 1]) {
          c.agregar(new THREE.BoxGeometry(W - 0.3, 0.09, 0.09), { color: MADERA, tipo: 0, matriz: matriz([0, y, sz * (D / 2 - 0.2)]) });
        }
      },
    },
    {
      nombre: 'Plataforma y escalera',
      pide: { tabla: 14, tronco: 2 },
      dice: 'El piso arriba y la escalera de peldaños clavados a dos largueros.',
      colisiona: true,
      arma(c, P, datos, suelo) {
        const { ancho: W, fondo: D, alto: H } = P;
        for (let i = 0; i < Math.round(D / 0.3); i++) {
          c.agregar(new THREE.BoxGeometry(W + 0.3, 0.08, 0.28), { color: i % 2 ? TABLA : '#7a5f43', tipo: 4, variar: 0.1, matriz: matriz([0, H + 0.25, -D / 2 + 0.15 + i * 0.3]) });
        }
        // escalera al frente, bien tendida para poder subirla
        const CORRIDA = 3.6;
        const largo = Math.hypot(H, CORRIDA);
        for (const sx of [-1, 1]) {
          c.agregar(new THREE.BoxGeometry(0.1, largo, 0.1), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * 0.45, H / 2 + 0.2, -D / 2 - CORRIDA / 2], [Math.atan2(CORRIDA, H), 0, 0]) });
          calce(c, suelo, sx * 0.45, -D / 2 - CORRIDA + 0.05, 0.16, 0.07, MADERA_OSCURA, 0);   // 3.0.1
        }
        // 3.0.1: once peldaños (antes diez, de 32 cm: el segundo de arriba le frenaba el paso
        // al cuerpo y la escalera no se podía subir) y un descanso al pie
        for (let i = 0; i < PELDANOS_MIRADOR; i++) {
          const t = (i + 0.5) / PELDANOS_MIRADOR;
          c.agregar(new THREE.BoxGeometry(1.1, 0.08, 0.3), { color: TABLA, tipo: 4, variar: 0.1, matriz: matriz([0, 0.28 + t * H, -D / 2 - CORRIDA * (1 - t)]) });
        }
        c.agregar(new THREE.BoxGeometry(1.1, 0.2, 0.52), { color: '#7a5f43', tipo: 4, variar: 0.1, matriz: matriz([0, 0.1, -D / 2 - CORRIDA - 0.28]) });
        zocalo(c, suelo, -0.5, -D / 2 - CORRIDA - 0.28, 0.5, -D / 2 - CORRIDA - 0.28, 0.0, 0.46);
      },
    },
    {
      nombre: 'Baranda y banco',
      pide: { tabla: 10, tronco: 2 },
      dice: 'Baranda a la altura de la cintura y un banco para quedarse mirando.',
      termina: true,
      arma(c, P) {
        const { ancho: W, fondo: D, alto: H } = P;
        const y = H + 0.3;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          c.agregar(new THREE.CylinderGeometry(0.07, 0.08, 1.0, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * (W / 2 + 0.05), y + 0.5, sz * (D / 2 + 0.05)]) });
        }
        for (const sz of [-1, 1]) {
            if (sz < 0) continue;   // el frente queda abierto, por donde sube la escalera
          for (const h of [0.55, 0.95]) c.agregar(new THREE.BoxGeometry(W + 0.2, 0.07, 0.07), { color: MADERA, tipo: 0, matriz: matriz([0, y + h, sz * (D / 2 + 0.05)]) });
        }
        for (const sx of [-1, 1]) {
          for (const h of [0.55, 0.95]) c.agregar(new THREE.BoxGeometry(0.07, 0.07, D + 0.2), { color: MADERA, tipo: 0, matriz: matriz([sx * (W / 2 + 0.05), y + h, 0]) });
        }
        c.agregar(new THREE.BoxGeometry(W - 0.4, 0.09, 0.42), { color: TABLA, tipo: 4, matriz: matriz([0, y + 0.42, D / 2 - 0.35]) });
        for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.1, 0.38, 0.38), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([sx * (W / 2 - 0.6), y + 0.2, D / 2 - 0.35]) });
      },
    },
  ],
});

// ---------------------------------------------------------------- casilla de tablas
// Un segundo refugio cerrado: más chico que el puesto de troncos y construido
// con entramado liviano. Da variedad sin duplicar la lógica del puesto.
PLANOS.push({
  id: 'casilla',
  nombre: 'Casilla de tablas',
  texto: 'Un refugio liviano de entramado y tablas, con puerta, ventana, estufa y techo de dos aguas. Más rápido de levantar que un puesto de troncos.',
  ancho: 4.4, fondo: 3.6, alto: 2.25,
  radio: 4.8,
  habitable: true,
  etapas: [
    {
      nombre: 'Basas y soleras',
      pide: { piedra: 6, tronco: 4 },
      dice: 'Seis apoyos de piedra y dos soleras levantan la madera de la humedad.',
      arma(c, P, datos, suelo) {
        const { ancho: W, fondo: D } = P;
        for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) {
          c.agregar(new THREE.CylinderGeometry(0.25, 0.32, 0.42, 7), { color: PIEDRA, tipo: 4, variar: 0.16,
            matriz: matriz([sx * (W / 2 - 0.28), 0.16, sz * (D / 2 - 0.28)]) });
          calce(c, suelo, sx * (W / 2 - 0.28), sz * (D / 2 - 0.28), -0.04, 0.32);   // 3.0.1
        }
        for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(W - 0.28, 0.18, 0.18), {
          color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([0, 0.42, sz * (D / 2 - 0.28)]) });
      },
    },
    {
      nombre: 'Entablonado',
      pide: { tabla: 12, tronco: 2 },
      dice: 'Tirantes y piso de tablas, con un peldaño ancho en la entrada.',
      arma(c, P, datos, suelo) {
        const { ancho: W, fondo: D } = P;
        for (let i = 0; i < Math.round(D / 0.29); i++) {
          const z = -D / 2 + 0.15 + i * 0.29;
          c.agregar(new THREE.BoxGeometry(W - 0.16, 0.075, 0.265), { color: i % 3 ? TABLA : '#7b6045', tipo: 4, variar: 0.1,
            matriz: matriz([0, 0.58, z]) });
        }
        c.agregar(new THREE.BoxGeometry(1.35, 0.16, 0.62), { color: TABLA, tipo: 4, variar: 0.1,
          matriz: matriz([0, 0.30, -D / 2 - 0.35]) });
        // 3.0.1: el peldaño apoya en una piedra (antes quedaba en el aire)
        zocalo(c, suelo, -0.6, -D / 2 - 0.35, 0.6, -D / 2 - 0.35, 0.23, 0.52);
      },
    },
    {
      nombre: 'Entramado y cerramiento',
      pide: { tabla: 18, tronco: 8 },
      dice: 'Postes, tablas y marcos. El frente deja una entrada franca y la ventana mira al costado.',
      arma(c, P) {
        const { ancho: W, fondo: D, alto: H } = P;
        const y0 = 0.60, h = H - 0.35, yc = y0 + h / 2, t = 0.10, puerta = 1.02;
        // postes de esquina
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.14, H, 0.14), {
          color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([sx * (W / 2 - 0.07), y0 + H / 2, sz * (D / 2 - 0.07)]) });
        // frente con vano real
        const lado = (W - puerta) / 2;
        for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(lado, h, t), {
          color: sx < 0 ? '#786047' : '#81684d', tipo: 4, variar: 0.1,
          matriz: matriz([sx * (puerta / 2 + lado / 2), yc, -D / 2]) });
        // fondo y laterales
        c.agregar(new THREE.BoxGeometry(W, h, t), { color: '#745c43', tipo: 4, variar: 0.1, matriz: matriz([0, yc, D / 2]) });
        for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(t, h, D), { color: sx > 0 ? '#80674c' : '#735a42', tipo: 4, variar: 0.1,
          matriz: matriz([sx * W / 2, yc, 0]) });
        // marco de la puerta: jambas + dintel, sin madera atravesando el paso
        for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.14, 1.82, 0.17), { color: MADERA_OSCURA, tipo: 4,
          matriz: matriz([sx * (puerta / 2 + 0.07), 1.50, -D / 2 - 0.04]) });
        c.agregar(new THREE.BoxGeometry(puerta + 0.28, 0.14, 0.17), { color: MADERA_OSCURA, tipo: 4,
          matriz: matriz([0, 2.42, -D / 2 - 0.04]) });
        // ventana exterior: marco y vidrio pegados a la pared derecha
        c.agregar(new THREE.BoxGeometry(0.035, 0.86, 1.05), { color: '#91a7a3', tipo: 4,
          matriz: matriz([W / 2 + 0.055, 1.58, 0.45]) });
        for (const yy of [1.14, 2.02]) c.agregar(new THREE.BoxGeometry(0.07, 0.08, 1.18), { color: MADERA_OSCURA, tipo: 4,
          matriz: matriz([W / 2 + 0.09, yy, 0.45]) });
        for (const zz of [-0.12, 1.02]) c.agregar(new THREE.BoxGeometry(0.07, 0.98, 0.08), { color: MADERA_OSCURA, tipo: 4,
          matriz: matriz([W / 2 + 0.09, 1.58, zz]) });
      },
    },
    {
      nombre: 'Techo, estufa y terminaciones',
      pide: { tabla: 14, piedra: 4, tronco: 2 },
      dice: 'Cubierta, cumbrera, aleros y una estufa chica con el caño continuo hasta arriba del techo.',
      termina: true,
      arma(c, P) {
        const { ancho: W, fondo: D, alto: H } = P;
        const subida = 1.0, largo = Math.hypot(subida, W / 2) + 0.30, incl = Math.atan2(subida, W / 2);
        for (const lado of [-1, 1]) for (let i = 0; i < Math.round((D + 0.55) / 0.31); i++) {
          c.agregar(new THREE.BoxGeometry(largo, 0.065, 0.285), { color: i % 3 ? TECHO : '#44382f', tipo: 4, variar: 0.09,
            matriz: matriz([lado * (W / 4 + 0.03), H + 0.82, -D / 2 - 0.26 + 0.15 + i * 0.31], [0, 0, -lado * incl]) });
        }
        c.agregar(new THREE.BoxGeometry(0.16, 0.16, D + 0.6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, H + 1.30, 0]) });
        // estufa de piedra + caño continuo
        c.agregar(new THREE.BoxGeometry(0.68, 0.62, 0.58), { color: '#514b45', tipo: 4, variar: 0.12,
          matriz: matriz([W / 2 - 0.75, 0.91, D / 2 - 0.70]) });
        c.agregar(new THREE.CylinderGeometry(0.10, 0.12, 2.35, 10), { color: '#3b3a36', tipo: 4,
          matriz: matriz([W / 2 - 0.75, 2.38, D / 2 - 0.70]) });
        c.agregar(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 10), { color: '#34332f', tipo: 4,
          matriz: matriz([W / 2 - 0.75, 3.58, D / 2 - 0.70]) });
      },
    },
  ],
});

// ---------------------------------------------------------------- cobertizo rural
PLANOS.push({
  id: 'cobertizo',
  nombre: 'Cobertizo rural',
  texto: 'Un cobertizo largo, abierto al frente, con piso alto, pared de reparo y banco de trabajo. Sirve como pequeño taller propio.',
  ancho: 6.2, fondo: 3.8, alto: 2.55,
  radio: 5.6,
  funciones: ['aserrar'],
  etapas: [
    {
      nombre: 'Postes y dados',
      pide: { piedra: 8, tronco: 8 },
      dice: 'Seis postes principales sobre dados de piedra y dos refuerzos intermedios.',
      arma(c, P, datos, suelo) {
        const { ancho: W, fondo: D, alto: H } = P;
        for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) {
          const x = sx * (W / 2 - 0.24), z = sz * (D / 2 - 0.22);
          c.agregar(new THREE.CylinderGeometry(0.25, 0.32, 0.40, 7), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([x, 0.14, z]) });
          calce(c, suelo, x, z, -0.05, 0.32);   // 3.0.1
          c.agregar(new THREE.CylinderGeometry(0.105, 0.135, H, 7), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([x, 0.34 + H / 2, z]) });
        }
        for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(W - 0.25, 0.13, 0.13), { color: MADERA_OSCURA, tipo: 0,
          matriz: matriz([0, H + 0.22, sz * (D / 2 - 0.22)]) });
      },
    },
    {
      nombre: 'Piso y reparo',
      pide: { tabla: 18, tronco: 4 },
      dice: 'Entablonado alto, pared trasera y riostras diagonales para que no bambolee con el viento.',
      arma(c, P) {
        const { ancho: W, fondo: D, alto: H } = P;
        for (let i = 0; i < Math.round(D / 0.31); i++) c.agregar(new THREE.BoxGeometry(W - 0.20, 0.075, 0.285), {
          color: i % 3 ? TABLA : '#765b40', tipo: 4, variar: 0.1, matriz: matriz([0, 0.48, -D / 2 + 0.16 + i * 0.31]) });
        // 3.0.1: las tablas apoyan en tres travesaños de poste a poste (antes flotaban)
        for (const sx of [-1, 0, 1]) c.agregar(new THREE.BoxGeometry(0.12, 0.12, D - 0.3), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * (W / 2 - 0.24), 0.38, 0]) });
        c.agregar(new THREE.BoxGeometry(W - 0.28, 1.60, 0.09), { color: '#6e563d', tipo: 4, variar: 0.11,
          matriz: matriz([0, 1.34, D / 2 - 0.19]) });
        for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.10, 2.20, 0.10), { color: MADERA, tipo: 0,
          matriz: matriz([sx * (W / 2 - 0.40), 1.35, D / 2 - 0.26], [0, 0, sx * 0.65]) });
      },
    },
    {
      nombre: 'Cubierta y banco de trabajo',
      pide: { tabla: 16, tronco: 4 },
      dice: 'Techo de dos aguas, alero generoso y un banco robusto donde ya se puede aserrar madera.',
      termina: true,
      arma(c, P) {
        const { ancho: W, fondo: D, alto: H } = P;
        const subida = 0.95, largo = Math.hypot(subida, W / 2) + 0.48, incl = Math.atan2(subida, W / 2);
        for (const lado of [-1, 1]) for (let i = 0; i < Math.round((D + 0.8) / 0.34); i++) {
          c.agregar(new THREE.BoxGeometry(largo, 0.065, 0.31), { color: i % 3 ? TECHO : '#453a31', tipo: 4, variar: 0.1,
            matriz: matriz([lado * (W / 4 + 0.08), H + 0.75, -D / 2 - 0.40 + 0.17 + i * 0.34], [0, 0, -lado * incl]) });
        }
        c.agregar(new THREE.BoxGeometry(0.16, 0.16, D + 0.8), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, H + 1.18, 0]) });
        // banco de trabajo al fondo
        c.agregar(new THREE.BoxGeometry(2.35, 0.16, 0.72), { color: TABLA, tipo: 4, variar: 0.08, matriz: matriz([0, 1.02, D / 2 - 0.62]) });
        // 3.0.1: las patas arrancan del piso (antes lo atravesaban y colgaban debajo)
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.13, 0.44, 0.13), {
          color: MADERA_OSCURA, tipo: 4, matriz: matriz([sx * 1.00, 0.73, D / 2 - 0.62 + sz * 0.24]) });
        c.agregar(new THREE.BoxGeometry(2.5, 0.74, 0.08), { color: '#5c4935', tipo: 4, matriz: matriz([0, 1.55, D / 2 - 0.20]) });
      },
    },
  ],
});

// ---------------------------------------------------------------- piezas sueltas
// Cosas chicas que se ponen de una sola vez, para que el lugar quede tuyo
const PIEZAS = [
  {
    id: 'banco', nombre: 'Banco de tronco', pieza: true, radio: 1.4, separacion: 3, confort: 1,
    texto: 'Medio tronco partido al hilo, sobre dos tacos. Para sentarse a mirar.',
    pide: { tronco: 2 },
    arma(c) {
      c.agregar(new THREE.CylinderGeometry(0.22, 0.22, 2.2, 8, 1, false, 0, Math.PI), { color: MADERA, tipo: 0, variar: 0.1, matriz: matriz([0, 0.52, 0], [0, 0, Math.PI / 2]) });
      for (const sx of [-0.75, 0.75]) c.agregar(new THREE.CylinderGeometry(0.16, 0.19, 0.5, 7), { color: MADERA_OSCURA, tipo: 0, variar: 0.12, matriz: matriz([sx, 0.25, 0]) });
    },
  },
  {
    id: 'fogon', nombre: 'Fogón de piedra', pieza: true, radio: 1.6, separacion: 6, fuego: true,
    texto: 'Un círculo de piedras bien puestas, con los leños cruzados adentro. Se enciende con F.',
    pide: { piedra: 6, tronco: 1 },
    arma(c, P, datos, suelo) {
      for (let i = 0; i < 9; i++) {
        const a2 = (i / 9) * Math.PI * 2;
        c.agregar(new THREE.IcosahedronGeometry(0.26, 0), { color: PIEDRA, tipo: 4, variar: 0.2, matriz: matriz([Math.cos(a2) * 0.72, 0.14, Math.sin(a2) * 0.72], [i, i * 1.7, 0]) });
        calce(c, suelo, Math.cos(a2) * 0.72, Math.sin(a2) * 0.72, -0.06, 0.2);   // 3.0.1
      }
      c.agregar(new THREE.CylinderGeometry(0.62, 0.7, 0.1, 12), { color: '#3a332b', tipo: 4, variar: 0.15, matriz: matriz([0, 0.06, 0]) });
      for (let i = 0; i < 4; i++) {
        const a2 = (i / 4) * Math.PI;
        c.agregar(new THREE.CylinderGeometry(0.07, 0.08, 0.95, 6), { color: i % 2 ? MADERA : '#5b4a36', tipo: 0, variar: 0.12, matriz: matriz([0, 0.2, 0], [0.5, a2, 0.3]) });
      }
    },
  },
  {
    id: 'tendal', nombre: 'Tendal', pieza: true, radio: 2.2, separacion: 4,
    texto: 'Dos horquetas y un alambre. Para colgar la ropa mojada o la carne al sol.',
    pide: { tronco: 2 },
    arma(c) {
      for (const sx of [-1.5, 1.5]) {
        c.agregar(new THREE.CylinderGeometry(0.08, 0.1, 1.9, 6), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([sx, 0.95, 0]) });
        for (const l of [-1, 1]) c.agregar(new THREE.CylinderGeometry(0.05, 0.06, 0.4, 5), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx + l * 0.1, 1.95, 0], [0, 0, l * 0.5]) });
      }
      c.agregar(new THREE.CylinderGeometry(0.015, 0.015, 3.1, 4), { color: '#9a9288', tipo: 4, matriz: matriz([0, 2.02, 0], [0, 0, Math.PI / 2]) });
      for (const [x, ancho, color] of [[-0.9, 0.5, '#8a6a52'], [0.1, 0.6, '#5f7a86'], [1.0, 0.45, '#9a8f7c']]) {
        c.agregar(new THREE.BoxGeometry(ancho, 0.6, 0.03), { color, tipo: 4, variar: 0.1, matriz: matriz([x, 1.7, 0]) });
      }
    },
  },
  {
    id: 'lena', nombre: 'Pila de leña', pieza: true, radio: 1.6, separacion: 3,
    texto: 'Apilada al reparo, con los troncos cruzados en las puntas para que no se caiga.',
    pide: { tronco: 4 },
    arma(c, P, datos, suelo) {
      // 3.0.1: en la ladera, la pila apoya en dos durmientes
      for (const sx of [-0.55, 0.55]) zocalo(c, suelo, sx, -0.8, sx, 0.8, 0.04, 0.14, '#5b4a36', 0);
      for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) {
        c.agregar(new THREE.CylinderGeometry(0.11, 0.12, 1.6, 6), { color: i % 3 ? MADERA : '#5b4a36', tipo: 0, variar: 0.14, matriz: matriz([0, 0.14 + f * 0.23, -0.6 + i * 0.24], [0, 0, Math.PI / 2]) });
      }
      for (const sz of [-0.85, 0.85]) for (let f = 0; f < 4; f++) {
        c.agregar(new THREE.CylinderGeometry(0.1, 0.11, 0.7, 6), { color: '#5f4a33', tipo: 0, variar: 0.12, matriz: matriz([0, 0.14 + f * 0.23, sz], [f % 2 ? 0 : Math.PI / 2, 0, Math.PI / 2]) });
      }
    },
  },
  {
    id: 'acopio', nombre: 'Acopio de materiales', pieza: true, radio: 1.8, separacion: 2.2,
    texto: 'Un cajón de tablas con la leña y la piedra apiladas al lado. Guardás ahí lo que juntás (E) y, mientras estés cerca, lo que levantes se paga solo del acopio: se termina el ir y venir con todo encima.',
    pide: { tronco: 2, tabla: 2 }, funciones: ['acopio'], apoyaEnPlataforma: true,
    // 3.0.1: el cajón se choca (antes se lo atravesaba)
    fisica(h) { h.segmento(-0.2, 0, 0.2, 0, 0.55, -0.05, 0.62); },
    arma(c, P, datos, suelo) {
      for (const sz of [-0.4, 0.4]) zocalo(c, suelo, -0.72, sz, 0.72, sz, 0.04, 0.12, MADERA_OSCURA, 0);   // 3.0.1
      // el cajón: piso, dos costados y el frente bajo
      c.agregar(new THREE.BoxGeometry(1.5, 0.1, 1.1), { color: TABLA, tipo: 4, variar: 0.1, matriz: matriz([0, 0.09, 0]) });
      for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.09, 0.52, 1.1), { color: MADERA, tipo: 4, variar: 0.1, matriz: matriz([sx * 0.7, 0.34, 0]) });
      c.agregar(new THREE.BoxGeometry(1.5, 0.52, 0.09), { color: MADERA, tipo: 4, variar: 0.1, matriz: matriz([0, 0.34, 0.5]) });
      c.agregar(new THREE.BoxGeometry(1.5, 0.28, 0.09), { color: MADERA_OSCURA, tipo: 4, variar: 0.1, matriz: matriz([0, 0.22, -0.5]) });
      // adentro, tablas paradas contra el fondo
      for (let i = 0; i < 4; i++) c.agregar(new THREE.BoxGeometry(0.24, 0.62, 0.06), {
        color: i % 2 ? TABLA : '#7d6146', tipo: 4, variar: 0.14, matriz: matriz([-0.45 + i * 0.3, 0.38, 0.4], [0, 0, 0.05 - i * 0.03]) });
      // al costado, los troncos cruzados y un montoncito de piedra
      for (let f = 0; f < 2; f++) for (let i = 0; i < 3; i++) c.agregar(new THREE.CylinderGeometry(0.1, 0.11, 1.2, 6), {
        color: i % 2 ? MADERA : '#5b4a36', tipo: 0, variar: 0.14, matriz: matriz([1.28, 0.12 + f * 0.21, -0.32 + i * 0.22], [0, 0, Math.PI / 2]) });
      for (const [x, z, r] of [[-1.25, 0.1, 0.22], [-1.05, -0.28, 0.17], [-1.42, -0.2, 0.14], [-1.15, 0.42, 0.13]]) {
        c.agregar(new THREE.IcosahedronGeometry(r, 0), { color: PIEDRA, tipo: 4, variar: 0.12, matriz: matriz([x, r * 0.75, z], [r, x, z]) });
      }
    },
  },
  {
    id: 'cantero', nombre: 'Cantero de huerta', pieza: true, radio: 1.5, separacion: 1.9,
    texto: 'Un cajón bajo de tablas lleno de tierra negra, con un borde de piedra. Se siembran habas, papas, frutillas o calafates (E) y crecen con los días; la lluvia las adelanta.',
    pide: { tabla: 3, piedra: 2 }, funciones: ['huerta'],
    arma(c) {
      // el cajón de tablas, bajo, con la tierra casi al ras del borde
      for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(2.1, 0.3, 0.08), { color: TABLA, tipo: 4, variar: 0.12, matriz: matriz([0, 0.15, sz * 0.55]) });
      for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.08, 0.3, 1.18), { color: MADERA, tipo: 4, variar: 0.12, matriz: matriz([sx * 1.05, 0.15, 0]) });
      c.agregar(new THREE.BoxGeometry(2.02, 0.05, 1.02), { color: '#3a2c20', tipo: 4, variar: 0.1, matriz: matriz([0, 0.3, 0]) });
      // los surcos: dos lomos de tierra removida
      for (const sz of [-0.22, 0.22]) c.agregar(new THREE.BoxGeometry(1.9, 0.05, 0.2), { color: '#4a3826', tipo: 4, variar: 0.12, matriz: matriz([0, 0.335, sz]) });
      // estacas en las esquinas, que sobresalen un poco
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.1, 0.42, 0.1), {
        color: MADERA_OSCURA, tipo: 4, matriz: matriz([sx * 1.05, 0.21, sz * 0.55]) });
      // piedras sueltas al pie
      for (const [x, z, r] of [[-1.25, 0.4, 0.12], [1.22, -0.46, 0.1], [1.3, 0.2, 0.08]]) {
        c.agregar(new THREE.IcosahedronGeometry(r, 0), { color: PIEDRA, tipo: 4, variar: 0.12, matriz: matriz([x, r * 0.7, z], [r, x, z]) });
      }
    },
  },
  {
    id: 'gallinero', nombre: 'Gallinero', pieza: true, radio: 1.6, separacion: 2.2,
    texto: 'Una casilla baja de tablas con techo de una agua, nidal adentro y una escalerita. Viene con cuatro gallinas: ponen de día y los huevos se juntan con E.',
    pide: { tabla: 4, tronco: 2 }, funciones: ['gallinero'],
    fisica(h) { h.segmento(-0.18, 0, 0.18, 0, 0.52, -0.05, 1.42); },   // 3.0.1: la casilla se choca
    arma(c, P, datos, suelo) {
      // la casilla, sobre cuatro patas cortas
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        c.agregar(new THREE.BoxGeometry(0.1, 0.4, 0.1), {
          color: MADERA_OSCURA, tipo: 4, matriz: matriz([sx * 0.62, 0.2, sz * 0.46]) });
        calce(c, suelo, sx * 0.62, sz * 0.46, 0.01, 0.06, MADERA_OSCURA, 4);   // 3.0.1
      }
      c.agregar(new THREE.BoxGeometry(1.36, 0.06, 1.04), { color: TABLA, tipo: 4, variar: 0.1, matriz: matriz([0, 0.42, 0]) });
      for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.06, 0.78, 1.04), { color: TABLA, tipo: 4, variar: 0.12, matriz: matriz([sx * 0.65, 0.84, 0]) });
      c.agregar(new THREE.BoxGeometry(1.36, 0.9, 0.06), { color: MADERA, tipo: 4, variar: 0.12, matriz: matriz([0, 0.9, -0.5]) });
      // el frente con la puertita
      c.agregar(new THREE.BoxGeometry(0.46, 0.66, 0.06), { color: MADERA, tipo: 4, variar: 0.12, matriz: matriz([-0.42, 0.78, 0.5]) });
      c.agregar(new THREE.BoxGeometry(0.46, 0.66, 0.06), { color: MADERA, tipo: 4, variar: 0.12, matriz: matriz([0.42, 0.78, 0.5]) });
      c.agregar(new THREE.BoxGeometry(0.4, 0.2, 0.06), { color: MADERA, tipo: 4, matriz: matriz([0, 1.12, 0.5]) });
      // el techo de una agua, que sobresale
      c.agregar(new THREE.BoxGeometry(1.6, 0.06, 1.34), { color: MADERA_OSCURA, tipo: 4, variar: 0.1, matriz: matriz([0, 1.36, 0.02], [0.2, 0, 0]) });
      // la escalerita
      c.agregar(new THREE.BoxGeometry(0.22, 0.03, 0.8), { color: TABLA, tipo: 4, matriz: matriz([0, 0.24, 0.86], [0.55, 0, 0]) });
      for (let i = 0; i < 3; i++) c.agregar(new THREE.BoxGeometry(0.22, 0.025, 0.025), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([0, 0.13 + i * 0.1, 1.06 - i * 0.17]) });
    },
  },
  {
    id: 'telar', nombre: 'Telar de palos', pieza: true, radio: 1.3, separacion: 1.8, apoyaEnPlataforma: true,
    texto: 'Un telar criollo de cuatro palos, con la urdimbre tendida y el peine colgado. Con la lana de la majada se teje la manta y ponchos para la feria (E).',
    pide: { tabla: 3, tronco: 2 }, funciones: ['tejer'],
    fisica(h) { h.segmento(-0.62, 0, 0.62, 0, 0.12, -0.05, 1.7); },   // 3.0.1: el bastidor se choca
    arma(c) {
      // los dos parantes y los dos travesaños
      for (const sx of [-1, 1]) c.agregar(new THREE.CylinderGeometry(0.05, 0.06, 1.7, 6), { color: MADERA, tipo: 0, variar: 0.1, matriz: matriz([sx * 0.62, 0.85, 0]) });
      for (const y of [0.35, 1.55]) c.agregar(new THREE.CylinderGeometry(0.04, 0.04, 1.36, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, y, 0], [0, 0, Math.PI / 2]) });
      // la urdimbre: hilos tensos de arriba abajo
      for (let i = 0; i < 16; i++) c.agregar(new THREE.BoxGeometry(0.008, 1.18, 0.008), { color: '#d9d0bd', tipo: 0, matriz: matriz([-0.52 + i * 0.07, 0.95, 0]) });
      // lo tejido abajo, gris de oveja
      c.agregar(new THREE.BoxGeometry(1.12, 0.36, 0.03), { color: '#8f877a', tipo: 0, variar: 0.08, matriz: matriz([0, 0.56, 0]) });
      // el peine y un ovillo en el piso
      c.agregar(new THREE.BoxGeometry(1.2, 0.06, 0.05), { color: TABLA, tipo: 4, matriz: matriz([0, 0.8, 0.04]) });
      c.agregar(new THREE.SphereGeometry(0.1, 8, 6), { color: '#c9bfa8', tipo: 0, variar: 0.1, matriz: matriz([0.4, 0.1, 0.3]) });
      // las patas de apoyo, en ángulo
      for (const sx of [-1, 1]) c.agregar(new THREE.CylinderGeometry(0.035, 0.04, 0.9, 5), { color: MADERA, tipo: 0, matriz: matriz([sx * 0.62, 0.4, -0.3], [0.6, 0, 0]) });
    },
  },
  // ---------------------------------------------------------------- 2.3
  {
    id: 'colmena', nombre: 'Colmena', pieza: true, radio: 1.0, separacion: 2.4, soloRelax: true,
    texto: 'Un cajón de abejas sobre dos piedras, con techito y piquera. Los canteros que tiene a menos de 18 m rinden uno más por cosecha, y cada tanto hay miel (E). En invierno las abejas no salen.',
    pide: { tabla: 3, tronco: 1 }, funciones: ['colmena'],
    fisica(h) { h.circulo(0, 0, 0.36, -0.05, 0.95); },   // 3.0.1: el cajón se choca
    arma(c, P, datos, suelo) {
      for (const sx of [-1, 1]) {
        c.agregar(new THREE.IcosahedronGeometry(0.2, 0), { color: PIEDRA, tipo: 4, variar: 0.1, matriz: matriz([sx * 0.26, 0.14, 0], [0.3, sx, 0]) });
        calce(c, suelo, sx * 0.26, 0, -0.04, 0.17);   // 3.0.1
      }
      // dos alzas apiladas, de madera clara, y el techito de chapa
      c.agregar(new THREE.BoxGeometry(0.62, 0.3, 0.5), { color: '#b89868', tipo: 0, variar: 0.08, matriz: matriz([0, 0.45, 0]) });
      c.agregar(new THREE.BoxGeometry(0.62, 0.26, 0.5), { color: '#a88a5c', tipo: 0, variar: 0.08, matriz: matriz([0, 0.73, 0]) });
      c.agregar(new THREE.BoxGeometry(0.72, 0.05, 0.6), { color: '#8a8f93', tipo: 4, matriz: matriz([0, 0.89, 0], [0.06, 0, 0]) });
      // la piquera: una ranura oscura abajo, al frente
      c.agregar(new THREE.BoxGeometry(0.34, 0.04, 0.02), { color: '#2a2016', tipo: 0, matriz: matriz([0, 0.33, 0.26]) });
    },
  },
  {
    id: 'ahumadero', nombre: 'Ahumadero', pieza: true, radio: 1.2, separacion: 2.4, soloRelax: true,
    texto: 'Un horno bajo de piedra con una casilla de tablas arriba, donde se cuelgan las truchas. Con un ahumadero, de lo que pescás te quedás con dos truchas por día; con un tronco de leña, en medio día salen ahumadas (E).',
    pide: { piedra: 6, tabla: 2, tronco: 2 }, funciones: ['ahumadero'],
    fisica(h) { h.circulo(0, 0, 0.45, -0.05, 1.7); },   // 3.0.1: el horno y la casilla se chocan
    arma(c, P, datos, suelo) {
      zocalo(c, suelo, -0.4, -0.1, 0.4, -0.1, -0.02, 0.5);   // 3.0.1: el hogar llega al suelo
      // el hogar de piedra, con la boca al frente
      for (const [x, y, z, r] of [[-0.35, 0.18, 0, 0.24], [0.35, 0.18, 0, 0.24], [0, 0.18, -0.3, 0.22], [-0.3, 0.44, -0.2, 0.2], [0.3, 0.44, -0.2, 0.2], [0, 0.46, 0.12, 0.18]]) {
        c.agregar(new THREE.IcosahedronGeometry(r, 0), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([x, y, z], [r, x, z]) });
      }
      c.agregar(new THREE.BoxGeometry(0.3, 0.2, 0.06), { color: '#1d1712', tipo: 4, matriz: matriz([0, 0.16, 0.31]) });
      // la casilla: cuatro tablas y un techo de una agua, con la chimenea
      for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.05, 0.8, 0.7), { color: MADERA, tipo: 0, variar: 0.12, matriz: matriz([sx * 0.36, 1.0, 0]) });
      c.agregar(new THREE.BoxGeometry(0.72, 0.8, 0.05), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([0, 1.0, -0.34]) });
      c.agregar(new THREE.BoxGeometry(0.72, 0.8, 0.05), { color: MADERA, tipo: 0, variar: 0.12, matriz: matriz([0, 1.0, 0.34]) });
      c.agregar(new THREE.BoxGeometry(0.9, 0.05, 0.9), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 1.44, 0], [0.18, 0, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.06, 0.07, 0.4, 6), { color: '#4a4640', tipo: 4, matriz: matriz([0.18, 1.62, -0.1]) });
    },
  },
  {
    id: 'vivero', nombre: 'Vivero de almácigos', pieza: true, radio: 1.3, separacion: 2.0, soloRelax: true,
    texto: 'Un cajón bajo con seis almácigos y una media sombra de tablas. Las semillas que juntás en otoño de coihues, lengas, ñires y cipreses, y los piñones, germinan en tres días y salen plantines (E), que se plantan con B ya crecidos a la mitad.',
    pide: { tabla: 4, piedra: 1 }, funciones: ['vivero'],
    fisica(h) { h.segmento(-0.4, 0, 0.4, 0, 0.4, -0.05, 1.35); },   // 3.0.1: la mesa se choca
    arma(c, P, datos, suelo) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        c.agregar(new THREE.BoxGeometry(0.08, 0.5, 0.08), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * 0.66, 0.25, sz * 0.34]) });
        calce(c, suelo, sx * 0.66, sz * 0.34, 0.01, 0.05, MADERA_OSCURA, 0);   // 3.0.1
      }
      c.agregar(new THREE.BoxGeometry(1.42, 0.06, 0.78), { color: TABLA, tipo: 0, variar: 0.1, matriz: matriz([0, 0.5, 0]) });
      // los seis almácigos, con la tierra oscura
      for (let i = 0; i < 6; i++) {
        const x = -0.44 + (i % 3) * 0.44, z = i < 3 ? -0.17 : 0.17;
        c.agregar(new THREE.CylinderGeometry(0.13, 0.1, 0.14, 7), { color: '#7a4a32', tipo: 4, matriz: matriz([x, 0.6, z]) });
        c.agregar(new THREE.CylinderGeometry(0.115, 0.115, 0.02, 7), { color: '#2e2219', tipo: 4, matriz: matriz([x, 0.67, z]) });
      }
      // la media sombra: listones separados sobre dos parantes
      for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.06, 0.8, 0.06), { color: MADERA, tipo: 0, matriz: matriz([sx * 0.7, 0.9, -0.4]) });
      for (let i = 0; i < 5; i++) c.agregar(new THREE.BoxGeometry(1.5, 0.03, 0.08), { color: TABLA, tipo: 0, matriz: matriz([0, 1.3, -0.4 + i * 0.2], [0.2, 0, 0]) });
    },
  },
  {
    id: 'lenera', nombre: 'Leñera techada', pieza: true, radio: 1.5, separacion: 2.2, soloRelax: true,
    texto: 'Un techito de tablas sobre cuatro postes, abierto al frente, para la leña. Lo que guardás acá (E) queda seco: en invierno cada fuego pide un tronco seco, y la leña que llevás encima se moja con la lluvia.',
    pide: { tronco: 4, tabla: 4 }, funciones: ['lenera'],
    // 3.0.1: la leñera se choca (el fondo, la pila y los postes de adelante)
    fisica(h) { h.segmento(-0.55, -0.12, 0.55, -0.12, 0.48, -0.05, 1.9); for (const sx of [-0.9, 0.9]) h.circulo(sx, 0.5, 0.08, -0.05, 1.6); },
    arma(c, P, datos, suelo) {
      for (const sx of [-1, 1]) for (const [sz, alto] of [[-0.5, 1.9], [0.5, 1.6]]) {
        c.agregar(new THREE.BoxGeometry(0.1, alto, 0.1), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * 0.9, alto / 2, sz]) });
        calce(c, suelo, sx * 0.9, sz, 0.01, 0.06, MADERA_OSCURA, 0);   // 3.0.1
      }
      c.agregar(new THREE.BoxGeometry(2.1, 0.06, 1.3), { color: MADERA, tipo: 0, variar: 0.1, matriz: matriz([0, 1.78, 0], [-0.25, 0, 0]) });
      c.agregar(new THREE.BoxGeometry(1.9, 0.9, 0.04), { color: TABLA, tipo: 0, variar: 0.12, matriz: matriz([0, 0.5, -0.52]) });
      // unos troncos apilados adentro, que no se mojan
      for (let f = 0; f < 3; f++) for (let i = 0; i < 5; i++) c.agregar(new THREE.CylinderGeometry(0.1, 0.11, 1.1, 6), {
        color: i % 2 ? MADERA : '#5b4a36', tipo: 0, variar: 0.14, matriz: matriz([-0.6 + i * 0.3, 0.12 + f * 0.21, -0.15], [Math.PI / 2, 0, 0]) });
    },
  },
  // ---------------------------------------------------------------- 2.4: estructuras nuevas
  // La galería: un techo a una agua sobre cuatro postes, sin paredes. Se arrima a la casa
  // o se pone sobre el tendal y la leña: abajo no llueve (cubreArea) y puede ir encima de
  // otras piezas (cubreOtras).
  {
    id: 'alero', nombre: 'Galería con alero', pieza: true, radio: 2.3, ancho: 3.4, fondo: 3.2, alto: 2.7,
    separacion: 2.4, categoria: 'exterior', cubreArea: true, cubreOtras: true, funciones: ['alero'],
    texto: 'Cuatro postes y un techo a una agua, sin paredes. Abajo no llueve: el tendal seca con lluvia, la leña no se moja y te podés sentar afuera mirando caer el agua.',
    pide: { tronco: 4, tabla: 6 }, pendienteMax: 0.5,
    fisica(h) {
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) h.circulo(sx * 1.55, sz * 1.42, 0.12, -0.05, 2.5);
    },
    arma(c, P, datos, suelo) {
      for (const [sx, sz, h] of [[-1, -1, 2.62], [1, -1, 2.62], [-1, 1, 2.22], [1, 1, 2.22]]) {
        c.agregar(new THREE.CylinderGeometry(0.08, 0.1, h, 6), { color: MADERA, tipo: 0, variar: 0.08, matriz: matriz([sx * 1.55, h / 2, sz * 1.42]) });
        calce(c, suelo, sx * 1.55, sz * 1.42, 0.01, 0.1, MADERA, 0);   // 3.0.1
      }
      // las dos vigas y el techo inclinado, más bajo hacia adelante
      for (const [z, y] of [[-1.42, 2.62], [1.42, 2.22]]) c.agregar(new THREE.BoxGeometry(3.4, 0.14, 0.14), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, y, z]) });
      const caida = Math.atan2(0.4, 3.0);
      for (let i = 0; i < 12; i++) {
        c.agregar(new THREE.BoxGeometry(0.3, 0.05, 3.5), { color: i % 3 ? TECHO : '#5a4a40', tipo: 4, variar: 0.08,
          matriz: matriz([-1.65 + i * 0.3, 2.5, 0], [caida, 0, 0]) });
      }
    },
  },
  // El hogar: una pared modular con chimenea de piedra. El fuego queda adentro de la
  // casa, sin estufa de hierro, y echa humo por arriba del techo.
  {
    id: 'pared-hogar', nombre: 'Pared con hogar de piedra', pieza: true, radio: 1.72,
    ancho: 3.0, fondo: 0.22, alto: 2.28, separacion: 0.18, apoyaEnPlataforma: true, soporteVertical: true, cierraHabitacion: true,
    fuego: true, fuegoContenido: true, funciones: ['calor'], confort: 2, chimenea: { ly: 3.75 }, categoria: 'refugios',
    texto: 'Un paño de pared con un hogar de piedra en el medio y la chimenea que sale por arriba del techo. Se prende con F: calienta la casa como la estufa y el humo se ve de lejos.',
    pide: { piedra: 12, tabla: 4, tronco: 1 },
    snap: { tipo: 'muro', familia: 'modular-muro', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.08 },
    fisica(h) {
      h.segmento(-1.5, 0, 1.5, 0, 0.085, -0.02, 2.30);
      h.segmento(-0.7, 0, 0.7, 0, 0.3, -0.02, 2.30);
      h.circulo(0, 0, 0.3, 2.1, 4.0);
    },
    arma(c) {
      // la pared a los costados del hogar
      for (let i = 0; i < 10; i++) {
        const x = -1.305 + i * 0.29;
        if (Math.abs(x) < 0.7) continue;
        c.agregar(new THREE.BoxGeometry(0.275, 2.12, 0.13), { color: i % 3 ? TABLA : '#765b41', tipo: 4, variar: 0.09, matriz: matriz([x, 1.08, 0]) });
      }
      for (const x of [-1.45, 1.45]) c.agregar(new THREE.BoxGeometry(0.13, 2.28, 0.18), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.14, 0]) });
      // el cuerpo de piedra, la boca negra y el dintel de madera
      for (let fila = 0; fila < 7; fila++) {
        for (let k = 0; k < 3; k++) {
          const ancho = fila % 2 ? 0.46 : 0.42, x = -0.47 + k * 0.47 + (fila % 2 ? 0.02 : 0);
          if (fila < 3 && k === 1) continue;   // la boca
          c.agregar(new THREE.BoxGeometry(ancho, 0.3, 0.62), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([x, 0.15 + fila * 0.3, 0]) });
        }
      }
      c.agregar(new THREE.BoxGeometry(0.44, 0.86, 0.5), { color: '#1c1916', tipo: 4, matriz: matriz([0, 0.43, 0]) });
      c.agregar(new THREE.BoxGeometry(1.5, 0.14, 0.7), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 1.0, 0]) });
      // la chimenea, más angosta, hasta pasar el techo
      for (let fila = 0; fila < 6; fila++) {
        c.agregar(new THREE.BoxGeometry(0.62, 0.3, 0.5), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([0, 2.25 + fila * 0.3, 0]) });
      }
    },
  },
  // El horno de barro: sobre una base de piedra, con la boca y un respiradero.
  {
    id: 'horno', nombre: 'Horno de barro', pieza: true, radio: 1.2, separacion: 2.0, categoria: 'trabajo', funciones: ['horno'],
    texto: 'Una cúpula de barro sobre una base de piedra. Con un tronco de leña y E se hornea pan casero o empanadas, según lo que lleves.',
    pide: { piedra: 8, tronco: 1 }, pendienteMax: 0.5,
    fisica(h) { h.segmento(-0.6, 0, 0.6, 0, 0.62, -0.02, 1.25); },
    arma(c, P, datos, suelo) {
      c.agregar(new THREE.BoxGeometry(1.5, 0.62, 1.3), { color: PIEDRA, tipo: 4, variar: 0.12, matriz: matriz([0, 0.31, 0]) });
      zocalo(c, suelo, -0.72, 0, 0.72, 0, 0.02, 1.26);   // 3.0.1
      c.agregar(new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), { color: '#9c6a4a', tipo: 4, variar: 0.06, matriz: matriz([0, 0.62, 0], [0, 0, 0], [1, 0.9, 1]) });
      c.agregar(new THREE.BoxGeometry(0.34, 0.3, 0.3), { color: '#1c1714', tipo: 4, matriz: matriz([0, 0.78, 0.5]) });
      c.agregar(new THREE.BoxGeometry(0.46, 0.06, 0.3), { color: '#7d5a40', tipo: 4, matriz: matriz([0, 0.95, 0.52]) });
      c.agregar(new THREE.CylinderGeometry(0.06, 0.07, 0.2, 6), { color: '#8a5d40', tipo: 4, matriz: matriz([0.2, 1.18, -0.15]) });
    },
  },
  // El invernadero: arcos de madera y nylon. Va encima de los canteros (cubreOtras):
  // en invierno, lo que tiene adentro sigue creciendo.
  {
    id: 'invernadero', nombre: 'Invernadero de nylon', pieza: true, radio: 2.6, ancho: 3.4, fondo: 4.6, alto: 2.4,
    separacion: 3.0, categoria: 'trabajo', cubreArea: true, cubreOtras: true, funciones: ['invernadero'],
    texto: 'Arcos de madera con nylon tirante. Armalo sobre los canteros: en invierno, lo de adentro no se hiela y sigue creciendo.',
    pide: { tronco: 4, tabla: 6 }, pendienteMax: 0.45,
    // los costados de nylon cierran; se entra por las puntas
    fisica(h) { for (const sx of [-1.6, 1.6]) h.segmento(sx, -2.2, sx, 2.2, 0.09, -0.02, 1.3); },
    arma(c, P, datos, suelo) {
      // 3.0.1: en la ladera, los arcos y el nylon llegan al suelo por una tabla de zócalo
      for (const sx of [-1.64, 1.64]) zocalo(c, suelo, sx, -2.25, sx, 2.25, 0.03, 0.07, MADERA_OSCURA, 0);
      for (let k = 0; k < 5; k++) {
        const z = -2.2 + k * 1.1;
        for (let i = 0; i < 9; i++) {
          const a0 = Math.PI * (i / 9), a1 = Math.PI * ((i + 1) / 9);
          const x0 = Math.cos(a0) * 1.65, y0 = Math.sin(a0) * 2.2, x1 = Math.cos(a1) * 1.65, y1 = Math.sin(a1) * 2.2;
          const l = Math.hypot(x1 - x0, y1 - y0);
          c.agregar(new THREE.BoxGeometry(l, 0.07, 0.07), { color: MADERA, tipo: 0, matriz: matriz([(x0 + x1) / 2, (y0 + y1) / 2, z], [0, 0, Math.atan2(y1 - y0, x1 - x0)]) });
        }
      }
      // el nylon: paños lechosos entre arco y arco
      for (let i = 0; i < 9; i++) {
        const a0 = Math.PI * (i / 9), a1 = Math.PI * ((i + 1) / 9);
        const x0 = Math.cos(a0) * 1.62, y0 = Math.sin(a0) * 2.17, x1 = Math.cos(a1) * 1.62, y1 = Math.sin(a1) * 2.17;
        const l = Math.hypot(x1 - x0, y1 - y0);
        c.agregar(new THREE.BoxGeometry(l, 0.015, 4.4), { color: '#c9d0cc', tipo: 4, variar: 0.03, matriz: matriz([(x0 + x1) / 2, (y0 + y1) / 2, 0], [0, 0, Math.atan2(y1 - y0, x1 - x0)]) });
      }
    },
  },
  // El embarcadero: arranca en la orilla y la punta queda sobre agua honda. Ahí amarrás
  // el kayak y pescás desde la punta.
  {
    id: 'embarcadero', nombre: 'Embarcadero', pieza: true, radio: 2.6, ancho: 1.6, fondo: 5.2, alto: 0.6,
    separacion: 6, categoria: 'exterior', sobreAgua: true, funciones: ['embarcadero'],
    texto: 'Un muelle chico de tablas: el arranque en la orilla y la punta sobre el agua honda del lago. El kayak queda amarrado ahí y desde la punta se pesca.',
    pide: { tabla: 8, tronco: 4 },
    fisica(h) { h.plataforma(0, 0, 1.6, 5.2, 0.46, 0.14, 0.55); },
    arma(c) {
      for (let i = 0; i < 17; i++) c.agregar(new THREE.BoxGeometry(1.6, 0.07, 0.28), { color: i % 3 ? TABLA : '#795f44', tipo: 4, variar: 0.12, matriz: matriz([0, 0.42, -2.45 + i * 0.3]) });
      for (const sx of [-0.7, 0.7]) c.agregar(new THREE.BoxGeometry(0.12, 0.14, 5.2), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx, 0.32, 0]) });
      for (const sx of [-0.7, 0.7]) for (const z of [-2.3, -0.8, 0.8, 2.3]) {
        c.agregar(new THREE.CylinderGeometry(0.08, 0.09, 1.9, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx, -0.45, z]) });
      }
      // la bita para amarrar
      c.agregar(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 6), { color: MADERA, tipo: 0, matriz: matriz([0.62, 0.7, 2.35]) });
    },
  },
  // El buzón: si lo tenés, las cartas llegan a tu casa.
  {
    id: 'buzon', nombre: 'Buzón', pieza: true, radio: 0.6, separacion: 4, categoria: 'exterior', soloRelax: true, funciones: ['buzon'],
    texto: 'Un cajón de tablas con techito sobre un poste. Con buzón en tu casa, el cartero del tren te deja las cartas acá: no hace falta ir al almacén, y los pedidos de fotos se mandan desde acá.',
    pide: { tabla: 2, tronco: 1 },
    fisica(h) { h.circulo(0, 0, 0.12, -0.02, 1.5); },
    arma(c) {
      c.agregar(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 6), { color: MADERA, tipo: 0, matriz: matriz([0, 0.55, 0]) });
      c.agregar(new THREE.BoxGeometry(0.46, 0.3, 0.32), { color: TABLA, tipo: 4, variar: 0.06, matriz: matriz([0, 1.22, 0]) });
      for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.28, 0.03, 0.4), { color: TECHO, tipo: 4, matriz: matriz([s * 0.12, 1.42, 0], [0, 0, -s * 0.45]) });
      c.agregar(new THREE.BoxGeometry(0.03, 0.22, 0.03), { color: '#3a2e24', tipo: 0, matriz: matriz([0.25, 1.3, 0.1]) });
      c.agregar(new THREE.BoxGeometry(0.1, 0.07, 0.02), { color: '#a8322b', tipo: 4, matriz: matriz([0.3, 1.38, 0.1]) });
    },
  },
  // El bebedero: con cuatro tramos de cerco alrededor es un corral, y Don Ramón te trae
  // dos ovejas.
  {
    id: 'bebedero', nombre: 'Bebedero', pieza: true, radio: 0.9, separacion: 3, categoria: 'exterior', soloRelax: true, funciones: ['bebedero'],
    texto: 'Una batea de tronco ahuecado sobre dos piedras. Con cuatro tramos de cerco alrededor es un corral, y Don Ramón te trae dos ovejas para que las cuides vos.',
    pide: { tronco: 2, piedra: 2 },
    fisica(h) { h.segmento(-0.7, 0, 0.7, 0, 0.26, -0.02, 0.6); },
    arma(c, P, datos, suelo) {
      for (const sx of [-0.55, 0.55]) {
        c.agregar(new THREE.IcosahedronGeometry(0.2, 0), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([sx, 0.14, 0], [0, sx, 0], [1.2, 0.8, 1]) });
        calce(c, suelo, sx, 0, 0.0, 0.2);   // 3.0.1
      }
      c.agregar(new THREE.BoxGeometry(1.5, 0.3, 0.46), { color: MADERA, tipo: 0, variar: 0.08, matriz: matriz([0, 0.4, 0]) });
      c.agregar(new THREE.BoxGeometry(1.36, 0.05, 0.32), { color: '#3f5a66', tipo: 4, matriz: matriz([0, 0.54, 0]) });
    },
  },
  // El adarve (Desafío): una pasarela alta detrás de la empalizada, con su escalera, para
  // caminar arriba y tirar por encima del muro.
  {
    id: 'adarve', nombre: 'Adarve', pieza: true, radio: 2.0, ancho: 3.2, fondo: 1.2, alto: 2.2, separacion: 2.8,
    soloDesafio: true, categoria: 'defensa', funciones: ['adarve'],
    texto: 'Una pasarela de tablas a dos metros de altura, con su escalera. Ponela detrás de la empalizada o del muro: desde arriba ves por encima y tirás sin que te alcancen los de abajo.',
    pide: { tronco: 4, tabla: 6 }, pendienteMax: 0.45,
    // la escalera arranca en el suelo: en una falda quedaría colgando (ver revisarSitio)
    pieEscalera: { lz: -3.3, tolerancia: 0.28 },
    // 2.6: los tiros pasan por debajo de la pasarela (ver desafio-fortin-mundo.js)
    soloArriba: 1.85,
    fisica(h) {
      for (const sx of [-1.45, 1.45]) for (const sz of [-0.5, 0.5]) h.circulo(sx, sz, 0.11, -0.05, 1.96);
      h.plataforma(0, 0, 3.2, 1.2, 2.06, 0.16, 0.62);
      // el descanso al pie: con el cuerpo (35 cm de radio) sobre el suelo ya se toca el
      // segundo escalón, y sin esto la escalera frena en vez de subirse
      h.plataforma(0, -3.25, 0.8, 0.52, 0.03, 0.1, 0.6);
      for (let i = 0; i < 8; i++) {
        const t = (i + 0.5) / 8;
        // peldaños abiertos: el de arriba no es un techo para el que está subiendo
        h.plataforma(0, -0.6 - 2.4 * (1 - t), 0.8, 0.4, 0.14 + t * 1.9, 0.12, 0.6, { sinTecho: true });
      }
      // la baranda de adelante, del lado del muro: te frena sin tapar el tiro
      h.segmento(-1.6, 0.58, 1.6, 0.58, 0.05, 2.06, 2.62);
    },
    arma(c, P, datos, suelo) {
      for (const sx of [-1.45, 1.45]) for (const sz of [-0.5, 0.5]) {
        c.agregar(new THREE.CylinderGeometry(0.09, 0.1, 2.0, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx, 1.0, sz]) });
        calce(c, suelo, sx, sz, 0.01, 0.1, MADERA_OSCURA, 0);   // 3.0.1
      }
      for (let i = 0; i < 11; i++) c.agregar(new THREE.BoxGeometry(0.29, 0.07, 1.2), { color: i % 3 ? TABLA : '#795f44', tipo: 4, variar: 0.1, matriz: matriz([-1.45 + i * 0.29, 2.02, 0]) });
      // 3.0.1: la baranda de adelante se ve (antes era sólo física: una pared invisible)
      for (const sx of [-1.45, 0, 1.45]) c.agregar(new THREE.BoxGeometry(0.07, 0.58, 0.07), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx, 2.34, 0.58]) });
      c.agregar(new THREE.BoxGeometry(3.2, 0.07, 0.07), { color: MADERA, tipo: 0, matriz: matriz([0, 2.6, 0.58]) });
      // la escalera, hacia adentro (lado -z)
      for (const sx of [-0.36, 0.36]) {
        c.agregar(new THREE.BoxGeometry(0.08, 0.08, 3.0), { color: MADERA, tipo: 0, matriz: matriz([sx, 1.05, -1.8], [-0.66, 0, 0]) });
        calce(c, suelo, sx, -2.95, 0.12, 0.05, MADERA, 0);   // 3.0.1: el pie del larguero llega al suelo
      }
      for (let i = 0; i < 8; i++) {
        const t = (i + 0.5) / 8;
        c.agregar(new THREE.BoxGeometry(0.7, 0.05, 0.22), { color: TABLA, tipo: 4, matriz: matriz([0, 0.12 + t * 1.86, -0.6 - 2.4 * (1 - t)]) });
      }
      c.agregar(new THREE.BoxGeometry(0.8, 0.05, 0.4), { color: '#795f44', tipo: 4, matriz: matriz([0, 0.01, -3.3]) });
    },
  },
  {
    id: 'banco-trabajo', nombre: 'Banco de carpintero', pieza: true, radio: 1.7, separacion: 2.2,
    texto: 'Un banco pesado con mordaza y tablero trasero. No lleva tablas, sólo troncos y piedra. Terminado, cada tronco que aserrás acá rinde cuatro tablas en vez de dos.',
    pide: { tronco: 4, piedra: 2 }, funciones: ['aserrar'], apoyaEnPlataforma: true,
    arma(c) {
      c.agregar(new THREE.BoxGeometry(2.2, 0.16, 0.78), { color: TABLA, tipo: 4, variar: 0.08, matriz: matriz([0, 0.92, 0]) });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.14, 0.86, 0.14), {
        color: MADERA_OSCURA, tipo: 4, matriz: matriz([sx * 0.88, 0.48, sz * 0.26]) });
      c.agregar(new THREE.BoxGeometry(2.28, 0.72, 0.08), { color: '#5b4937', tipo: 4, variar: 0.08, matriz: matriz([0, 1.37, 0.34]) });
      c.agregar(new THREE.BoxGeometry(0.34, 0.22, 0.16), { color: '#51483c', tipo: 4, matriz: matriz([0.70, 1.05, -0.26]) });
      for (const x of [-0.72, -0.25, 0.22]) c.agregar(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 5), {
        color: '#4a4842', tipo: 4, matriz: matriz([x, 1.42, 0.28], [0, 0, x * 0.35]) });
    },
  },
  {
    id: 'pasarela', nombre: 'Pasarela de tablas', pieza: true, radio: 2.0, ancho: 3.2, fondo: 1.1, separacion: 0.8,
    snap: { tipo: 'linea', familia: 'pasarela', largo: 3.2, umbral: 1.05 },
    texto: 'Un tramo bajo de tablas sobre dos largueros. Sirve para ordenar accesos y cruzar barro o desniveles chicos.',
    pide: { tabla: 7, tronco: 2 }, apoyaEnPlataforma: false, pendienteMax: 0.58, distSendero: 0.5,
    arma(c) {
      for (const sz of [-0.36, 0.36]) c.agregar(new THREE.BoxGeometry(3.2, 0.14, 0.14), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 0.14, sz]) });
      // apoyos profundos: absorben pequeños desniveles sin que el tablero parezca flotar
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.CylinderGeometry(0.065, 0.085, 0.62, 6), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * 1.35, -0.04, sz * 0.34]) });
      for (let i = 0; i < 11; i++) c.agregar(new THREE.BoxGeometry(0.27, 0.075, 1.08), {
        color: i % 3 ? TABLA : '#795f44', tipo: 4, variar: 0.12, matriz: matriz([-1.48 + i * 0.296, 0.25, 0]) });
    },
  },
  {
    id: 'cerco', nombre: 'Cerco de campo', pieza: true, radio: 1.9, ancho: 3.1, fondo: 0.18, separacion: 0.55,
    snap: { tipo: 'linea', familia: 'cerco', largo: 3.1, umbral: 1.0 },
    texto: 'Tres postes y dos varas horizontales. Los tramos se pueden encadenar para delimitar un patio o corral.',
    pide: { tronco: 3 }, pendienteMax: 0.55, distSendero: 0.7,
    arma(c) {
      for (const x of [-1.55, 0, 1.55]) c.agregar(new THREE.CylinderGeometry(0.075, 0.095, 1.35, 6), {
        color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([x, 0.64, 0]) });
      for (const y of [0.52, 1.00]) c.agregar(new THREE.CylinderGeometry(0.055, 0.065, 3.1, 6), {
        color: MADERA, tipo: 0, variar: 0.1, matriz: matriz([0, y, 0], [0, 0, Math.PI / 2]) });
    },
  },
  {
    id: 'mesa-campo', nombre: 'Mesa de campo', pieza: true, radio: 1.5, separacion: 2.0, confort: 1,
    texto: 'Mesa robusta de tablas, útil dentro de una casilla, bajo un cobertizo o junto al fogón.',
    pide: { tabla: 5, tronco: 1 }, apoyaEnPlataforma: true,
    arma(c) {
      c.agregar(new THREE.BoxGeometry(1.8, 0.13, 1.0), { color: TABLA, tipo: 4, variar: 0.1, matriz: matriz([0, 0.84, 0]) });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.11, 0.78, 0.11), {
        color: MADERA_OSCURA, tipo: 4, matriz: matriz([sx * 0.70, 0.42, sz * 0.35]) });
      c.agregar(new THREE.BoxGeometry(1.45, 0.08, 0.08), { color: MADERA, tipo: 0, matriz: matriz([0, 0.44, 0]) });
    },
  },
  {
    id: 'estante', nombre: 'Estante de tablas', pieza: true, radio: 1.25, separacion: 1.2, confort: 1,
    texto: 'Dos montantes y tres estantes. Queda bien contra una pared y hace que los refugios propios se sientan habitados.',
    pide: { tabla: 5 }, apoyaEnPlataforma: true,
    arma(c) {
      for (const x of [-0.78, 0.78]) c.agregar(new THREE.BoxGeometry(0.10, 1.65, 0.34), { color: MADERA_OSCURA, tipo: 4,
        matriz: matriz([x, 0.84, 0]) });
      for (const y of [0.28, 0.83, 1.38]) c.agregar(new THREE.BoxGeometry(1.68, 0.09, 0.48), { color: TABLA, tipo: 4, variar: 0.1,
        matriz: matriz([0, y, 0]) });
      c.agregar(new THREE.BoxGeometry(1.68, 1.58, 0.05), { color: '#5b4735', tipo: 4, variar: 0.08, matriz: matriz([0, 0.84, 0.23]) });
    },
  },
  {
    id: 'catre-campo', nombre: 'Catre de campaña', pieza: true, radio: 1.35, separacion: 1.15,
    ancho: 1.95, fondo: 0.86, alto: 0.62, apoyaEnPlataforma: true,
    funciones: ['dormir'], confort: 3,
    texto: 'Catre bajo con bastidor de madera, lona gruesa y manta. Dentro de una habitación cerrada permite dormir sin depender de una fogata exterior.',
    pide: { tabla: 4, tronco: 1 },
    arma(c) {
      c.agregar(new THREE.BoxGeometry(1.88, 0.10, 0.78), { color: TABLA, tipo: 4, variar: 0.08, matriz: matriz([0, 0.48, 0]) });
      c.agregar(new THREE.BoxGeometry(1.72, 0.09, 0.68), { color: '#8c8978', tipo: 4, variar: 0.05, matriz: matriz([0, 0.56, 0]) });
      c.agregar(new THREE.BoxGeometry(0.38, 0.12, 0.66), { color: '#b3aa96', tipo: 4, variar: 0.04, matriz: matriz([-0.66, 0.64, 0]) });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.08, 0.44, 0.08), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * 0.82, 0.24, sz * 0.30]) });
    },
  },
  {
    id: 'silla-campo', nombre: 'Silla de campo', pieza: true, radio: 0.82, separacion: 0.72,
    ancho: 0.64, fondo: 0.70, alto: 1.05, apoyaEnPlataforma: true, confort: 1,
    texto: 'Silla sencilla de tablas con respaldo alto. Aporta habitabilidad sin ocupar media habitación.',
    pide: { tabla: 3 },
    arma(c) {
      c.agregar(new THREE.BoxGeometry(0.58, 0.10, 0.56), { color: TABLA, tipo: 4, variar: 0.08, matriz: matriz([0, 0.52, 0]) });
      c.agregar(new THREE.BoxGeometry(0.58, 0.72, 0.08), { color: TABLA, tipo: 4, variar: 0.08, matriz: matriz([0, 0.84, 0.24]) });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.07, 0.52, 0.07), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * 0.23, 0.27, sz * 0.20]) });
    },
  },
  {
    id: 'farol-interior', nombre: 'Farol interior', pieza: true, radio: 0.72, separacion: 0.80,
    ancho: 0.42, fondo: 0.42, alto: 1.62, apoyaEnPlataforma: true, confort: 1, luzInterior: true,
    texto: 'Farol de pie con pantalla protegida. De noche enciende una luz cálida real y vuelve legibles los interiores construidos.',
    pide: { tabla: 2, piedra: 1 },
    arma(c) {
      c.agregar(new THREE.CylinderGeometry(0.18, 0.24, 0.10, 8), { color: '#514b43', tipo: 4, matriz: matriz([0, 0.05, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.035, 0.045, 1.28, 7), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 0.69, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.17, 0.13, 0.34, 8), { color: '#d0b57a', tipo: 4, variar: 0.03, matriz: matriz([0, 1.39, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.22, 0.12, 0.12, 8), { color: '#403b35', tipo: 4, matriz: matriz([0, 1.61, 0]) });
    },
  },
  {
    id: 'estufa-hierro', nombre: 'Estufa a leña', pieza: true, radio: 1.05, separacion: 1.25,
    ancho: 0.86, fondo: 0.78, alto: 2.18, apoyaEnPlataforma: true, confort: 3,
    fuego: true, fuegoContenido: true, funciones: ['calor'], permiteSolapeCon: ['modular-techo'],
    texto: 'Estufa compacta de hierro con caño vertical. Se enciende con F; el fuego queda contenido y sirve como fuente de calor interior.',
    pide: { piedra: 5, tabla: 2 },
    arma(c) {
      c.agregar(new THREE.BoxGeometry(0.72, 0.72, 0.62), { color: '#343230', tipo: 4, variar: 0.03, matriz: matriz([0, 0.60, 0]) });
      c.agregar(new THREE.BoxGeometry(0.44, 0.34, 0.04), { color: '#201f1d', tipo: 4, matriz: matriz([0, 0.62, -0.33]) });
      c.agregar(new THREE.BoxGeometry(0.28, 0.16, 0.03), { color: '#8d4c2e', tipo: 4, variar: 0.02, matriz: matriz([0, 0.62, -0.355]) });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.08, 0.22, 0.08), {
        color: '#2b2927', tipo: 4, matriz: matriz([sx * 0.27, 0.18, sz * 0.22]) });
      c.agregar(new THREE.CylinderGeometry(0.075, 0.085, 1.42, 8), { color: '#2f2d2b', tipo: 4, matriz: matriz([0.18, 1.50, 0.08]) });
      c.agregar(new THREE.CylinderGeometry(0.10, 0.10, 0.18, 8), { color: '#2f2d2b', tipo: 4, matriz: matriz([0.18, 2.16, 0.08]) });
    },
  },
  {
    id: 'tabique-interior', nombre: 'Tabique interior', pieza: true, radio: 1.72,
    ancho: 3.0, fondo: 0.16, alto: 2.28, separacion: 0.14, apoyaEnPlataforma: true, cierraHabitacion: true,
    texto: 'Tabique liviano de tablas para dividir ambientes sin fingir capacidad portante. Cierra acústica y clima, pero no sostiene entrepisos.',
    pide: { tabla: 6, tronco: 1 },
    snap: { tipo: 'muro', familia: 'modular-muro', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.08 },
    arma(c) {
      for (let i = 0; i < 12; i++) c.agregar(new THREE.BoxGeometry(0.235, 2.08, 0.095), {
        color: i % 4 ? '#8c7355' : '#765e47', tipo: 4, variar: 0.07, matriz: matriz([-1.292 + i * 0.235, 1.06, 0]) });
      for (const x of [-1.45, 1.45]) c.agregar(new THREE.BoxGeometry(0.10, 2.26, 0.13), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.13, 0]) });
      for (const y of [0.18, 2.08]) c.agregar(new THREE.BoxGeometry(2.92, 0.10, 0.13), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, y, 0]) });
    },
  },
  {
    id: 'tabique-puerta', nombre: 'Tabique con puerta interior', pieza: true, interactiva: true, radio: 1.72,
    ancho: 3.0, fondo: 0.16, alto: 2.28, separacion: 0.14, apoyaEnPlataforma: true, cierraHabitacion: true, accesoHabitacion: true,
    texto: 'Divisor interior con hoja liviana funcional. Permite separar temperatura y luz entre ambientes sin transformarse en muro estructural.',
    pide: { tabla: 6, tronco: 1 },
    snap: { tipo: 'muro', familia: 'modular-muro', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.08 },
    arma(c) {
      const hueco = 0.84, lado = (3.0 - hueco) / 2;
      for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(lado - 0.07, 2.08, 0.095), {
        color: '#856d52', tipo: 4, variar: 0.07, matriz: matriz([sx * (hueco / 2 + lado / 2), 1.06, 0]) });
      for (const x of [-1.45, -(hueco / 2 + 0.05), hueco / 2 + 0.05, 1.45]) c.agregar(new THREE.BoxGeometry(0.10, 2.26, 0.13), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.13, 0]) });
      c.agregar(new THREE.BoxGeometry(hueco + 0.16, 0.11, 0.13), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 2.04, 0]) });
    },
  },
  {
    id: 'alfombra-lana', nombre: 'Alfombra de lana', pieza: true, radio: 1.30, separacion: 0.24,
    ancho: 1.90, fondo: 1.30, alto: 0.04, apoyaEnPlataforma: true, confort: 2,
    texto: 'Alfombra gruesa de lana para cortar el frío del entablonado y dar identidad a una habitación sin ocupar circulación. Se teje con la lana de la majada del galpón.',
    // Hasta la 1.10 pedía una tabla: no había lana en el juego.
    pide: { lana: 2 },
    arma(c) {
      c.agregar(new THREE.BoxGeometry(1.86, 0.035, 1.26), { color: '#785b4b', tipo: 4, variar: 0.04, matriz: matriz([0, 0.03, 0]) });
      for (const z of [-0.52, 0, 0.52]) c.agregar(new THREE.BoxGeometry(1.68, 0.012, 0.055), { color: '#aa8a67', tipo: 4, matriz: matriz([0, 0.052, z]) });
      for (const x of [-0.82, 0.82]) for (let i = 0; i < 5; i++) c.agregar(new THREE.BoxGeometry(0.10, 0.018, 0.025), {
        color: '#b79a79', tipo: 4, matriz: matriz([x, 0.05, -0.48 + i * 0.24]) });
    },
  },
  {
    id: 'piso-modular', nombre: 'Piso modular 3×3', pieza: true, radio: 2.15,
    ancho: 3.0, fondo: 3.0, alto: 0.32, cotaPlataforma: 0.285, separacion: 0.28, soportaPiezas: true,
    texto: 'Un módulo de entablonado sobre largueros. Encaja con otros pisos y sirve de base limpia para paredes y mobiliario.',
    pide: { tabla: 8, tronco: 2 }, pendienteMax: 0.42, distSendero: 0.6,
    snap: { tipo: 'piso', familia: 'modular-piso', paso: 3.0, umbral: 1.05 },
    arma(c, P, datos, suelo) {
      for (const z of [-1.22, 1.22]) c.agregar(new THREE.BoxGeometry(2.90, 0.14, 0.15), {
        color: MADERA_OSCURA, tipo: 0, variar: 0.07, matriz: matriz([0, 0.12, z]) });
      for (let i = 0; i < 10; i++) c.agregar(new THREE.BoxGeometry(0.27, 0.075, 2.92), {
        color: i % 4 ? TABLA : '#765b41', tipo: 4, variar: 0.10, matriz: matriz([-1.31 + i * 0.291, 0.24, 0]) });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        c.agregar(new THREE.CylinderGeometry(0.065, 0.085, 0.46, 6), {
          color: MADERA_OSCURA, tipo: 0, matriz: matriz([sx * 1.22, 0.02, sz * 1.22]) });
        calce(c, suelo, sx * 1.22, sz * 1.22, -0.2, 0.085, MADERA_OSCURA, 0);   // 3.0.1: en la ladera, hasta el suelo
      }
    },
  },
  {
    id: 'pared-modular', nombre: 'Pared modular', pieza: true, radio: 1.72,
    ancho: 3.0, fondo: 0.22, alto: 2.28, separacion: 0.18, apoyaEnPlataforma: true, soporteVertical: true, cierraHabitacion: true,
    texto: 'Paño estructural de tres metros. Se alinea con los bordes del piso modular y con los extremos de otras paredes.',
    pide: { tabla: 7, tronco: 2 },
    snap: { tipo: 'muro', familia: 'modular-muro', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.08 },
    arma(c) {
      for (let i = 0; i < 10; i++) c.agregar(new THREE.BoxGeometry(0.275, 2.12, 0.13), {
        color: i % 3 ? TABLA : '#765b41', tipo: 4, variar: 0.09, matriz: matriz([-1.305 + i * 0.29, 1.08, 0]) });
      for (const x of [-1.45, 1.45]) c.agregar(new THREE.BoxGeometry(0.13, 2.28, 0.18), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.14, 0]) });
      for (const y of [0.20, 2.08]) c.agregar(new THREE.BoxGeometry(2.92, 0.12, 0.17), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, y, 0]) });
    },
  },
  {
    id: 'pared-puerta', nombre: 'Pared con puerta', pieza: true, interactiva: true, radio: 1.72,
    ancho: 3.0, fondo: 0.22, alto: 2.28, separacion: 0.18, apoyaEnPlataforma: true, soporteVertical: true, cierraHabitacion: true, accesoHabitacion: true,
    texto: 'Módulo con vano y hoja de puerta funcional. Se abre con E, gira sobre su bisagra y su colisión acompaña la hoja durante toda la animación.',
    pide: { tabla: 6, tronco: 2 },
    snap: { tipo: 'muro', familia: 'modular-muro', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.08 },
    arma(c) {
      const hueco = 0.92, lado = (3.0 - hueco) / 2;
      for (const sx of [-1, 1]) {
        c.agregar(new THREE.BoxGeometry(lado - 0.08, 2.12, 0.13), { color: TABLA, tipo: 4, variar: 0.10,
          matriz: matriz([sx * (hueco / 2 + lado / 2), 1.08, 0]) });
        c.agregar(new THREE.BoxGeometry(0.13, 2.28, 0.18), { color: MADERA_OSCURA, tipo: 0,
          matriz: matriz([sx * (hueco / 2 + 0.065), 1.14, -0.01]) });
      }
      c.agregar(new THREE.BoxGeometry(1.08, 0.14, 0.18), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 2.05, -0.01]) });
      for (const x of [-1.45, 1.45]) c.agregar(new THREE.BoxGeometry(0.13, 2.28, 0.18), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.14, 0]) });
    },
  },
  {
    id: 'pared-ventana', nombre: 'Pared con ventana', pieza: true, interactiva: true, radio: 1.72,
    ancho: 3.0, fondo: 0.22, alto: 2.28, separacion: 0.18, apoyaEnPlataforma: true, soporteVertical: true, cierraHabitacion: true, ventanaHabitacion: true,
    texto: 'Paño con ventana central, antepecho y dintel. Al terminarlo aparecen postigos funcionales que podés abrir y cerrar con E.',
    pide: { tabla: 7, tronco: 2 },
    snap: { tipo: 'muro', familia: 'modular-muro', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.08 },
    arma(c) {
      c.agregar(new THREE.BoxGeometry(2.86, 0.76, 0.13), { color: TABLA, tipo: 4, variar: 0.10, matriz: matriz([0, 0.46, 0]) });
      c.agregar(new THREE.BoxGeometry(2.86, 0.48, 0.13), { color: '#765b41', tipo: 4, variar: 0.10, matriz: matriz([0, 1.98, 0]) });
      for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.68, 0.78, 0.13), {
        color: TABLA, tipo: 4, variar: 0.10, matriz: matriz([sx * 1.08, 1.28, 0]) });
      for (const x of [-1.45, -0.66, 0.66, 1.45]) c.agregar(new THREE.BoxGeometry(0.12, 2.25, 0.18), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.125, -0.01]) });
      for (const y of [0.86, 1.70]) c.agregar(new THREE.BoxGeometry(1.40, 0.12, 0.18), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, y, -0.01]) });
    },
  },
  {
    id: 'techo-modular', nombre: 'Techo modular 3×3', pieza: true, radio: 2.30,
    ancho: 3.45, fondo: 3.45, alto: 1.06, separacion: 0.12, apoyaEnPlataforma: true,
    // 3.0.1: 2,26 y no 2,02: las paredes miden 2,28 y atravesaban el techo (los postes de las
    // esquinas y el borde de arriba asomaban por encima de las tablas)
    requierePlataforma: true, elevacion: 2.26,
    texto: 'Techo de dos aguas para un módulo de piso. Se centra y orienta con la base, con alero suficiente para proteger la pared.',
    pide: { tabla: 11, tronco: 2 },
    snap: { tipo: 'techo', familia: 'modular-techo', pisoFamilia: 'modular-piso', umbral: 1.35 },
    permiteSolapeCon: ['modular-muro'],
    arma(c) {
      const W = 3.35, D = 3.38, subida = 0.94;
      const medio = W / 2, largo = Math.hypot(medio, subida) + 0.16;
      const incl = Math.atan2(subida, medio);
      for (const lado of [-1, 1]) {
        for (let i = 0; i < 11; i++) {
          const z = -D / 2 + 0.17 + i * 0.305;
          c.agregar(new THREE.BoxGeometry(largo, 0.065, 0.285), {
            color: i % 4 ? TECHO : '#44382f', tipo: 4, variar: 0.10,
            matriz: matriz([lado * 0.79, 0.47, z], [0, 0, -lado * incl]),
          });
        }
      }
      c.agregar(new THREE.BoxGeometry(0.13, 0.13, D + 0.16), {
        color: MADERA_OSCURA, tipo: 0, variar: 0.06, matriz: matriz([0, 0.98, 0]) });
      for (const z of [-1.48, 0, 1.48]) {
        for (const lado of [-1, 1]) c.agregar(new THREE.BoxGeometry(largo - 0.08, 0.10, 0.10), {
          color: MADERA_OSCURA, tipo: 0, matriz: matriz([lado * 0.73, 0.42, z], [0, 0, -lado * incl]) });
      }
    },
  },
  {
    id: 'escalera-modular', nombre: 'Escalera de acceso', pieza: true, radio: 1.12,
    ancho: 0.92, fondo: 1.68, alto: 0.32, separacion: 0.18,
    texto: 'Cuatro peldaños bajos para entrar a un piso modular sin saltos. El encastre busca automáticamente el borde y orienta la subida.',
    pide: { tabla: 5, tronco: 1 }, pendienteMax: 0.52, distSendero: 0.55,
    snap: { tipo: 'acceso', familia: 'modular-acceso', pisoFamilia: 'modular-piso', profundidad: 1.68, umbral: 1.55 },
    permiteSolapeCon: ['pared-puerta'],
    // 3.0.1: el encastre la pone a la altura del piso (en una ladera el piso queda alto y la
    // escalera, a ras del suelo, no llegaba); el pie tiene que caer cerca del suelo
    pieEscalera: { lz: -0.84, tolerancia: 0.45, conBase: true },
    arma(c, P, datos, suelo) {
      const zs = [-0.63, -0.21, 0.21, 0.63];
      const hs = [0.08, 0.15, 0.22, 0.29];
      for (let i = 0; i < 4; i++) c.agregar(new THREE.BoxGeometry(0.86, hs[i], 0.42), {
        color: i % 2 ? TABLA : '#775c42', tipo: 4, variar: 0.09, matriz: matriz([0, hs[i] / 2, zs[i]]) });
      for (const x of [-0.36, 0.36]) {
        c.agregar(new THREE.BoxGeometry(0.10, 0.12, 1.66), {
          color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 0.04, 0]) });
        zocalo(c, suelo, x, -0.8, x, 0.8, -0.01, 0.1, MADERA_OSCURA, 0);   // 3.0.1
      }
    },
  },
  {
    id: 'baranda-modular', nombre: 'Baranda modular', pieza: true, radio: 1.72,
    ancho: 3.0, fondo: 0.18, alto: 1.04, separacion: 0.14, apoyaEnPlataforma: true,
    requierePlataforma: true,
    texto: 'Baranda de tres metros para bordes de piso. Se endereza al encastrar y su física protege el borde sin crear zócalos invisibles.',
    pide: { tronco: 3 },
    snap: { tipo: 'baranda', familia: 'modular-baranda', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.10 },
    arma(c) {
      for (const x of [-1.45, -0.72, 0, 0.72, 1.45]) c.agregar(new THREE.CylinderGeometry(0.045, 0.055, 1.02, 6), {
        color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([x, 0.51, 0]) });
      for (const y of [0.48, 0.98]) c.agregar(new THREE.CylinderGeometry(0.045, 0.052, 2.96, 6), {
        color: MADERA, tipo: 0, variar: 0.08, matriz: matriz([0, y, 0], [0, 0, Math.PI / 2]) });
    },
  },
  {
    id: 'pilar-esquina', nombre: 'Pilar de esquina', pieza: true, radio: 0.48,
    ancho: 0.34, fondo: 0.34, alto: 2.28, separacion: 0.10, apoyaEnPlataforma: true,
    requierePlataforma: true, soporteVertical: true,
    texto: 'Poste estructural para las esquinas de un módulo. Encaja en los vértices del piso y puede sostener un entrepiso junto con otros pilares.',
    pide: { tronco: 2, tabla: 1 },
    snap: { tipo: 'pilar', familia: 'modular-pilar', pisoFamilia: 'modular-piso', umbral: 0.92 },
    permiteSolapeCon: ['modular-muro', 'modular-baranda'],
    arma(c) {
      c.agregar(new THREE.CylinderGeometry(0.105, 0.13, 2.28, 8), {
        color: MADERA_OSCURA, tipo: 0, variar: 0.06, matriz: matriz([0, 1.14, 0]) });
      for (const y of [0.32, 1.96]) c.agregar(new THREE.BoxGeometry(0.30, 0.10, 0.30), {
        color: '#806247', tipo: 4, variar: 0.05, matriz: matriz([0, y, 0]) });
      for (const giro of [-Math.PI / 4, Math.PI / 4]) c.agregar(new THREE.BoxGeometry(0.08, 0.76, 0.08), {
        color: MADERA, tipo: 0, variar: 0.06, matriz: matriz([0, 0.47, 0], [giro, 0, 0]) });
    },
  },
  {
    id: 'entrepiso-modular', nombre: 'Entrepiso modular 3×3', pieza: true, radio: 2.15,
    ancho: 3.0, fondo: 3.0, alto: 0.32, cotaPlataforma: 0.285, separacion: 0.18, apoyaEnPlataforma: true,
    requierePlataforma: true, requiereSoporteVertical: true, soportaPiezas: true, elevacion: 2.28,
    texto: 'Segundo nivel estructural. Sólo se habilita cuando el módulo inferior tiene paredes opuestas, tres lados armados o cuatro pilares de esquina.',
    pide: { tabla: 9, tronco: 3 },
    snap: { tipo: 'entrepiso', familia: 'modular-piso', pisoFamilia: 'modular-piso', paso: 3.0, umbral: 1.18 },
    arma(c) {
      for (const z of [-1.22, 0, 1.22]) c.agregar(new THREE.BoxGeometry(2.90, 0.15, 0.14), {
        color: MADERA_OSCURA, tipo: 0, variar: 0.06, matriz: matriz([0, 0.12, z]) });
      for (let i = 0; i < 10; i++) c.agregar(new THREE.BoxGeometry(0.27, 0.075, 2.92), {
        color: i % 4 ? TABLA : '#765b41', tipo: 4, variar: 0.09, matriz: matriz([-1.31 + i * 0.291, 0.24, 0]) });
    },
  },
  {
    id: 'entrepiso-escalera', nombre: 'Entrepiso con hueco', pieza: true, radio: 2.15,
    ancho: 3.0, fondo: 3.0, alto: 0.32, cotaPlataforma: 0.285, separacion: 0.18, apoyaEnPlataforma: true,
    requierePlataforma: true, requiereSoporteVertical: true, soportaPiezas: true, elevacion: 2.28,
    huecoEscalera: true,
    texto: 'Entrepiso con un hueco real para escalera interior. La abertura coincide en visual y física: no hay una losa invisible tapando el paso.',
    pide: { tabla: 8, tronco: 3 },
    snap: { tipo: 'entrepiso', familia: 'modular-piso', pisoFamilia: 'modular-piso', paso: 3.0, umbral: 1.18 },
    permiteSolapeCon: ['escalera-nivel'],
    arma(c) {
      // 3.0.1: el hueco corre a lo largo de toda la escalera; sólo queda una tabla de borde en
      // la punta de atrás. Antes la mitad de atrás estaba tapada y al subir la cabeza chocaba
      // contra el entrepiso a mitad de camino: la escalera no se podía subir.
      for (let i = 0; i < 10; i++) {
        const x = -1.31 + i * 0.291;
        const central = Math.abs(x) < 0.53;
        const fondo = central ? 0.27 : 2.92;
        const z = central ? -1.325 : 0;
        c.agregar(new THREE.BoxGeometry(0.27, 0.075, fondo), {
          color: i % 4 ? TABLA : '#765b41', tipo: 4, variar: 0.09, matriz: matriz([x, 0.24, z]) });
      }
      c.agregar(new THREE.BoxGeometry(2.90, 0.15, 0.14), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 0.12, -1.22]) });
      for (const x of [-0.57, 0.57]) c.agregar(new THREE.BoxGeometry(0.13, 0.16, 2.9), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 0.13, 0]) });
      for (const x of [-1.0, 1.0]) c.agregar(new THREE.BoxGeometry(0.8, 0.15, 0.14), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 0.12, 1.22]) });
    },
  },
  {
    id: 'escalera-nivel', nombre: 'Escalera interior de nivel', pieza: true, radio: 1.62,
    ancho: 0.94, fondo: 2.78, alto: 2.58, separacion: 0.12, apoyaEnPlataforma: true,
    requierePlataforma: true, requiereHuecoEscalera: true,
    texto: 'Escalera interior de once peldaños. Se alinea exclusivamente con un entrepiso con hueco y conecta físicamente ambos niveles sin saltos.',
    pide: { tabla: 11, tronco: 3 },
    snap: { tipo: 'escalera-nivel', familia: 'modular-escalera-nivel', pisoFamilia: 'modular-piso', desnivel: 2.28, umbral: 1.35 },
    // 3.0.1: también con las paredes del cuarto (antes, con cuatro paredes no se podía poner)
    permiteSolapeCon: ['entrepiso-escalera', 'modular-muro'],
    arma(c) {
      const n = 11, paso = 2.50 / n, altoPaso = 2.565 / n;
      for (let i = 0; i < n; i++) {
        const z = -1.25 + i * (2.50 / (n - 1));
        const y = altoPaso * (i + 1);
        c.agregar(new THREE.BoxGeometry(0.88, 0.085, paso + 0.055), {
          color: i % 3 ? TABLA : '#765b41', tipo: 4, variar: 0.08, matriz: matriz([0, y, z]) });
        if (i % 2 === 0) for (const x of [-0.37, 0.37]) c.agregar(new THREE.BoxGeometry(0.07, y, 0.07), {
          color: MADERA_OSCURA, tipo: 0, variar: 0.05, matriz: matriz([x, y / 2, z]) });
      }
      for (const x of [-0.42, 0.42]) c.agregar(new THREE.BoxGeometry(0.09, 0.10, 2.72), {
        color: MADERA_OSCURA, tipo: 0, variar: 0.06, matriz: matriz([x, 1.27, 0], [Math.atan2(2.45, 2.72), 0, 0]) });
    },
  },

  {
    id: 'pared-marco', nombre: 'Pared con marco abierto', pieza: true, radio: 1.72,
    ancho: 3.0, fondo: 0.22, alto: 2.28, separacion: 0.18, apoyaEnPlataforma: true, soporteVertical: true,
    accesoHabitacion: true,
    texto: 'Paño estructural con un paso ancho de 1,80 m. Mantiene postes, dintel y arriostramiento sin cerrar el ambiente: ideal para galerías y transiciones interiores.',
    pide: { tabla: 4, tronco: 3 },
    snap: { tipo: 'muro', familia: 'modular-muro', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.08 },
    arma(c) {
      const hueco = 1.80, lado = (3.0 - hueco) / 2;
      for (const sx of [-1, 1]) {
        c.agregar(new THREE.BoxGeometry(lado - 0.06, 2.12, 0.13), { color: TABLA, tipo: 4, variar: 0.09,
          matriz: matriz([sx * (hueco / 2 + lado / 2), 1.08, 0]) });
        c.agregar(new THREE.BoxGeometry(0.14, 2.28, 0.18), { color: MADERA_OSCURA, tipo: 0,
          matriz: matriz([sx * (hueco / 2 + 0.07), 1.14, 0]) });
      }
      c.agregar(new THREE.BoxGeometry(hueco + 0.18, 0.16, 0.19), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 2.08, 0]) });
      for (const x of [-1.45, 1.45]) c.agregar(new THREE.BoxGeometry(0.13, 2.28, 0.18), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.14, 0]) });
      for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.09, 0.82, 0.09), {
        color: MADERA, tipo: 0, variar: 0.06, matriz: matriz([sx * 1.12, 1.65, 0], [0, 0, sx * 0.58]) });
    },
  },
  {
    id: 'pared-media', nombre: 'Media pared modular', pieza: true, radio: 1.72,
    ancho: 3.0, fondo: 0.20, alto: 1.08, separacion: 0.16, apoyaEnPlataforma: true,
    texto: 'Media pared de tablas para separar ambientes, cerrar una galería o proteger un borde sin tapar la vista. No cuenta como soporte de entrepiso.',
    pide: { tabla: 4, tronco: 1 },
    snap: { tipo: 'muro', familia: 'modular-muro', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.08 },
    arma(c) {
      for (let i = 0; i < 10; i++) c.agregar(new THREE.BoxGeometry(0.275, 0.94, 0.12), {
        color: i % 3 ? TABLA : '#765b41', tipo: 4, variar: 0.09, matriz: matriz([-1.305 + i * 0.29, 0.50, 0]) });
      for (const x of [-1.45, 1.45]) c.agregar(new THREE.BoxGeometry(0.13, 1.08, 0.17), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 0.54, 0]) });
      c.agregar(new THREE.BoxGeometry(2.92, 0.13, 0.18), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 1.01, 0]) });
    },
  },
  {
    id: 'pared-ventana-ancha', nombre: 'Pared con ventanal', pieza: true, interactiva: true, radio: 1.72,
    ancho: 3.0, fondo: 0.22, alto: 2.28, separacion: 0.18, apoyaEnPlataforma: true, soporteVertical: true,
    cierraHabitacion: true, ventanaHabitacion: true,
    texto: 'Paño estructural con un ventanal horizontal amplio y postigos funcionales. Da mucha luz sin perder continuidad de soporte en el módulo.',
    pide: { tabla: 8, tronco: 2 },
    snap: { tipo: 'muro', familia: 'modular-muro', largo: 3.0, pisoFamilia: 'modular-piso', umbral: 1.08 },
    arma(c) {
      c.agregar(new THREE.BoxGeometry(2.86, 0.62, 0.13), { color: TABLA, tipo: 4, variar: 0.09, matriz: matriz([0, 0.35, 0]) });
      c.agregar(new THREE.BoxGeometry(2.86, 0.40, 0.13), { color: '#765b41', tipo: 4, variar: 0.09, matriz: matriz([0, 2.04, 0]) });
      for (const sx of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.45, 1.08, 0.13), {
        color: TABLA, tipo: 4, variar: 0.09, matriz: matriz([sx * 1.22, 1.34, 0]) });
      for (const x of [-1.45, -0.94, 0.94, 1.45]) c.agregar(new THREE.BoxGeometry(0.12, 2.25, 0.18), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.125, 0]) });
      for (const y of [0.68, 1.82]) c.agregar(new THREE.BoxGeometry(2.02, 0.12, 0.18), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, y, 0]) });
    },
  },
  {
    id: 'techo-una-agua', nombre: 'Techo a una agua 3×3', pieza: true, radio: 2.30,
    ancho: 3.45, fondo: 3.45, alto: 0.86, separacion: 0.12, apoyaEnPlataforma: true,
    // 3.0.1: 2,26 y no 2,02: las paredes miden 2,28 y atravesaban el techo (los postes de las
    // esquinas y el borde de arriba asomaban por encima de las tablas)
    requierePlataforma: true, elevacion: 2.26,
    texto: 'Cubierta de una sola pendiente, pensada para galerías, ampliaciones y casas modernas de campo. Comparte el mismo encastre estructural que el techo de dos aguas.',
    pide: { tabla: 10, tronco: 2 },
    snap: { tipo: 'techo', familia: 'modular-techo', pisoFamilia: 'modular-piso', umbral: 1.35 },
    permiteSolapeCon: ['modular-muro'],
    arma(c) {
      const D = 3.38, W = 3.38, subida = 0.76;
      const largo = Math.hypot(W, subida) + 0.10, incl = Math.atan2(subida, W);
      for (let i = 0; i < 11; i++) {
        const z = -D / 2 + 0.17 + i * 0.305;
        c.agregar(new THREE.BoxGeometry(largo, 0.065, 0.285), {
          color: i % 4 ? TECHO : '#44382f', tipo: 4, variar: 0.10,
          matriz: matriz([0, 0.42, z], [0, 0, -incl]),
        });
      }
      for (const z of [-1.48, 0, 1.48]) c.agregar(new THREE.BoxGeometry(largo - 0.08, 0.10, 0.10), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 0.39, z], [0, 0, -incl]) });
      c.agregar(new THREE.BoxGeometry(0.12, 0.14, D + 0.16), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([-1.63, 0.80, 0]) });
    },
  },
  {
    id: 'techo-plano', nombre: 'Cubierta plana transitable', pieza: true, radio: 2.30,
    ancho: 3.36, fondo: 3.36, alto: 0.28, cotaPlataforma: 0.24, separacion: 0.12, apoyaEnPlataforma: true,
    // 3.0.1: 2,26 y no 2,02: las paredes miden 2,28 y atravesaban el techo (los postes de las
    // esquinas y el borde de arriba asomaban por encima de las tablas)
    requierePlataforma: true, elevacion: 2.26,
    texto: 'Cubierta plana reforzada con leve cámara de escurrimiento. Es físicamente transitable y sirve como terraza superior sin inventar una plataforma invisible.',
    pide: { tabla: 12, tronco: 3 },
    snap: { tipo: 'techo', familia: 'modular-techo', pisoFamilia: 'modular-piso', umbral: 1.35 },
    permiteSolapeCon: ['modular-muro'],
    arma(c) {
      for (const z of [-1.30, 0, 1.30]) c.agregar(new THREE.BoxGeometry(3.18, 0.13, 0.14), {
        color: MADERA_OSCURA, tipo: 0, variar: 0.06, matriz: matriz([0, 0.10, z]) });
      for (let i = 0; i < 11; i++) c.agregar(new THREE.BoxGeometry(0.275, 0.075, 3.22), {
        color: i % 4 ? TECHO : '#44382f', tipo: 4, variar: 0.09, matriz: matriz([-1.38 + i * 0.276, 0.20 + (i % 2) * 0.004, 0]) });
      for (const x of [-1.62, 1.62]) c.agregar(new THREE.BoxGeometry(0.08, 0.15, 3.30), {
        color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 0.22, 0]) });
    },
  },

  // ---------------------------------------------------------- defensas (modo Desafío)
  // `vida` es la resistencia ante los invasores; `defensa` le dice al modo Desafío
  // qué hace la pieza además de estorbar (dañar al pasar, disparar sola).
  {
    id: 'empalizada', nombre: 'Empalizada de troncos', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.9, ancho: 3.1, fondo: 0.5, alto: 2.6, separacion: 0.4, vida: 320,
    snap: { tipo: 'linea', familia: 'empalizada', largo: 3.1, umbral: 1.0 },
    texto: 'Troncos afilados clavados en fila. Frena a los invasores hasta que la derriban. Los tramos se encadenan.',
    pide: { tronco: 4 }, pendienteMax: 0.6, distSendero: 0.4,
    arma(c) {
      for (let i = 0; i < 8; i++) {
        const x = -1.36 + i * 0.39, alto = 2.25 + ((i * 37) % 5) * 0.06;
        c.agregar(new THREE.CylinderGeometry(0.16, 0.18, alto, 7), { color: i % 3 ? MADERA : MADERA_OSCURA, tipo: 0, variar: 0.12, matriz: matriz([x, alto / 2 - 0.15, 0]) });
        c.agregar(new THREE.ConeGeometry(0.16, 0.42, 7), { color: TABLA, tipo: 0, variar: 0.1, matriz: matriz([x, alto - 0.15 + 0.2, 0]) });
      }
      for (const y of [0.55, 1.55]) c.agregar(new THREE.CylinderGeometry(0.07, 0.07, 3.15, 6), {
        color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([0, y, -0.2], [0, 0, Math.PI / 2]) });
    },
    fisica(h) { h.segmento(-1.55, 0, 1.55, 0, 0.2, -0.1, 2.6); },
  },
  {
    id: 'porton-empalizada', nombre: 'Portón de empalizada', pieza: true, soloDesafio: true, categoria: 'defensa', porton: true,
    radio: 1.9, ancho: 3.1, fondo: 0.5, alto: 2.9, separacion: 0.4, vida: 380,
    snap: { tipo: 'linea', familia: 'empalizada', largo: 3.1, umbral: 1.0 },
    texto: 'Un tramo de empalizada con portón de tablas: se abre y se cierra con E. Cerrado, los invasores tienen que romperlo para pasar.',
    pide: { tronco: 5, tabla: 3 }, pendienteMax: 0.5, distSendero: 0,
    arma(c) {
      for (const x of [-1.42, -1.08, 1.08, 1.42]) {
        const alto = 2.5 + (Math.abs(x) > 1.2 ? 0.12 : 0.3);
        c.agregar(new THREE.CylinderGeometry(0.17, 0.19, alto, 7), { color: Math.abs(x) > 1.2 ? MADERA : MADERA_OSCURA, tipo: 0, variar: 0.12, matriz: matriz([x, alto / 2 - 0.15, 0]) });
        c.agregar(new THREE.ConeGeometry(0.17, 0.42, 7), { color: TABLA, tipo: 0, variar: 0.1, matriz: matriz([x, alto - 0.15 + 0.2, 0]) });
      }
      // dintel: une los dos lados por arriba del paso
      c.agregar(new THREE.CylinderGeometry(0.11, 0.11, 2.5, 6), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([0, 2.45, 0], [0, 0, Math.PI / 2]) });
    },
    fisica(h) {
      h.segmento(-1.55, 0, -0.93, 0, 0.2, -0.1, 2.7);
      h.segmento(0.93, 0, 1.55, 0, 0.2, -0.1, 2.7);
      h.segmento(-0.93, 0, 0.93, 0, 0.14, 2.3, 2.7);
    },
  },
  {
    id: 'muro-piedra', nombre: 'Muro de pirca', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.9, ancho: 3.0, fondo: 0.8, alto: 1.7, separacion: 0.3, vida: 700,
    snap: { tipo: 'linea', familia: 'muro-piedra', largo: 3.0, umbral: 1.0 },
    texto: 'Piedras encastradas sin mortero, como las pircas de la estepa. Aguanta el doble que la empalizada.',
    pide: { piedra: 10, tronco: 1 }, pendienteMax: 0.5, distSendero: 0.4,
    arma(c) {
      for (let fila = 0; fila < 4; fila++) {
        const n = fila % 2 ? 5 : 6, ancho = 3.0 / n;
        for (let i = 0; i < n; i++) {
          const x = -1.5 + ancho * (i + 0.5), y = 0.2 + fila * 0.4, s = 0.9 + ((i * 7 + fila * 3) % 4) * 0.04;
          c.agregar(new THREE.IcosahedronGeometry(0.3, 0), { color: (i + fila) % 3 ? PIEDRA : '#6c665d', tipo: 4, variar: 0.16,
            matriz: matriz([x, y, ((i + fila) % 2) * 0.06 - 0.03], [0.3 * i, 0.5 * fila, 0.2], [ancho / 0.55 * s, 0.75 * s, 1.15]) });
        }
      }
    },
    fisica(h) { h.segmento(-1.5, 0, 1.5, 0, 0.38, -0.1, 1.75); },
  },
  {
    id: 'estacas', nombre: 'Estacas trampa', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.3, ancho: 2.4, fondo: 1.6, alto: 0.9, separacion: 0.2, vida: 150,
    texto: 'Palos afilados en ángulo. No cierran el paso: lastiman y frenan a cada invasor que las cruza.',
    pide: { tronco: 2, piedra: 1 }, pendienteMax: 0.6, distSendero: 0,
    defensa: { tipo: 'estacas', radio: 1.35, dps: 16, freno: 0.45, desgaste: 3 },
    arma(c) {
      for (let i = 0; i < 9; i++) {
        const x = -1.0 + (i % 5) * 0.5 + (i > 4 ? 0.25 : 0), z = i > 4 ? 0.4 : -0.3, inc = (i % 2 ? 0.55 : -0.45);
        c.agregar(new THREE.ConeGeometry(0.07, 1.1, 5), { color: i % 2 ? MADERA : TABLA, tipo: 0, variar: 0.12,
          matriz: matriz([x, 0.38, z], [inc, 0, (i % 3 - 1) * 0.25]) });
      }
      c.agregar(new THREE.CylinderGeometry(0.06, 0.06, 2.3, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 0.08, 0.05], [0, 0, Math.PI / 2]) });
    },
  },
  {
    id: 'ballesta-fija', nombre: 'Ballesta de guardia', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.0, ancho: 1.5, fondo: 1.5, alto: 1.9, separacion: 1.5, vida: 220,
    texto: 'Un arco grande sobre un trípode. Dispara sola contra el invasor más cercano a 26 metros.',
    pide: { tabla: 6, tronco: 2, piedra: 2 }, pendienteMax: 0.45, distSendero: 0.4,
    defensa: { tipo: 'torreta', alcance: 26, dano: 30, cadencia: 1.9, altura: 1.45 },
    arma(c, P, datos, suelo) {
      calce(c, suelo, 0, 0, 0.0, 0.4);   // 3.0.1
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI * 2 / 3;
        c.agregar(new THREE.CylinderGeometry(0.05, 0.07, 1.55, 6), { color: MADERA_OSCURA, tipo: 0, variar: 0.1,
          matriz: matriz([Math.sin(a) * 0.38, 0.68, Math.cos(a) * 0.38], [Math.cos(a) * 0.45, 0, -Math.sin(a) * 0.45]) });
      }
      c.agregar(new THREE.CylinderGeometry(0.34, 0.4, 0.3, 8), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([0, 0.12, 0]) });
      c.agregar(new THREE.BoxGeometry(0.16, 0.14, 1.2), { color: TABLA, tipo: 0, matriz: matriz([0, 1.42, 0]) });
      c.agregar(new THREE.TorusGeometry(0.62, 0.035, 5, 12, Math.PI * 0.9), { color: MADERA, tipo: 0,
        matriz: matriz([0, 1.46, -0.42], [Math.PI / 2, 0, Math.PI * 0.05]) });
      c.agregar(new THREE.BoxGeometry(0.5, 0.26, 0.3), { color: '#3f3a34', tipo: 4, matriz: matriz([0, 1.36, 0.46]) });
    },
    fisica(h) { h.circulo(0, 0, 0.55, -0.05, 1.8); },
  },
  {
    id: 'antorcha', nombre: 'Antorcha de guardia', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 0.5, ancho: 0.6, fondo: 0.6, alto: 2.3, separacion: 1.2, vida: 90,
    texto: 'Un poste con fuego que alumbra el perímetro. A los invasores no les gusta la luz. La lluvia y los brutos la apagan; F la vuelve a prender.',
    pide: { tronco: 1, tabla: 1 }, pendienteMax: 0.7, distSendero: 0,
    defensa: { tipo: 'antorcha', radio: 9, llamaY: 2.12 },
    arma(c) {
      c.agregar(new THREE.CylinderGeometry(0.06, 0.08, 2.0, 6), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([0, 1.0, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.12, 0.08, 0.22, 7), { color: '#3f3a34', tipo: 4, matriz: matriz([0, 2.0, 0]) });
      for (let i = 0; i < 3; i++) c.agregar(new THREE.IcosahedronGeometry(0.14, 0), { color: PIEDRA, tipo: 4, variar: 0.2,
        matriz: matriz([Math.cos(i * 2.1) * 0.16, 0.06, Math.sin(i * 2.1) * 0.16], [i, i * 0.7, 0], [1, 0.6, 1]) });
    },
    fisica(h) { h.circulo(0, 0, 0.12, -0.05, 2.1); },
  },
  {
    id: 'campana', nombre: 'Campana de alarma', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 0.9, ancho: 1.2, fondo: 0.7, alto: 2.4, separacion: 6, vida: 160,
    texto: 'Suena sola cuando un invasor se acerca a 30 metros de ella: te avisa aunque estés del otro lado de la base.',
    pide: { tabla: 2, tronco: 2, piedra: 1 }, pendienteMax: 0.5, distSendero: 0.3,
    defensa: { tipo: 'campana', radio: 30 },
    arma(c) {
      for (const x of [-0.5, 0.5]) c.agregar(new THREE.CylinderGeometry(0.06, 0.08, 2.3, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.12, 0]) });
      c.agregar(new THREE.BoxGeometry(1.2, 0.12, 0.16), { color: MADERA, tipo: 0, matriz: matriz([0, 2.28, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.12, 0.26, 0.36, 10, 1, true), { color: '#8a6a3c', tipo: 4, variar: 0.05, matriz: matriz([0, 1.98, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 8), { color: '#6b5238', tipo: 4, matriz: matriz([0, 2.18, 0]) });
    },
    fisica(h) { h.segmento(-0.5, 0, 0.5, 0, 0.1, -0.05, 2.35); },
  },
  {
    id: 'torre-vigia', nombre: 'Torre de vigía', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 2.1, ancho: 3.4, fondo: 3.4, alto: 3.6, separacion: 3, vida: 520,
    texto: 'Plataforma a 2,4 m con escalera. Desde arriba tus disparos llegan más lejos y pegan 25% más, y los invasores no te alcanzan con las manos.',
    pide: { tronco: 8, tabla: 8, piedra: 2 }, pendienteMax: 0.35, distSendero: 0.4,
    defensa: { tipo: 'torre', altura: 2.4 },
    // 3.0.1: en una ladera el primer peldaño quedaba hasta un metro arriba del suelo
    pieEscalera: { lx: 1.55, lz: 2.2, tolerancia: 0.3 },
    arma(c, P, datos, suelo) {
      for (const [x, z] of [[-1.05, -1.05], [1.05, -1.05], [-1.05, 1.05], [1.05, 1.05]]) {
        c.agregar(new THREE.CylinderGeometry(0.11, 0.13, 3.5, 7), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([x, 1.7, z]) });
        calce(c, suelo, x, z, -0.04, 0.13, MADERA_OSCURA, 0);   // 3.0.1
      }
      // piso de la plataforma y baranda
      c.agregar(new THREE.BoxGeometry(2.4, 0.14, 2.4), { color: TABLA, tipo: 0, variar: 0.08, matriz: matriz([0, 2.35, 0]) });
      for (const [x, z, l, r] of [[0, -1.12, 2.3, 0], [0, 1.12, 2.3, 0], [-1.12, 0, 2.3, Math.PI / 2], [1.12, 0.435, 1.37, Math.PI / 2]])
        c.agregar(new THREE.BoxGeometry(l, 0.08, 0.08), { color: MADERA, tipo: 0, matriz: matriz([x, 3.25, z], [0, r, 0]) });
      for (const [x, z] of [[0, -1.12], [0, 1.12], [-1.12, 0]]) c.agregar(new THREE.BoxGeometry(0.06, 0.8, 0.06), { color: MADERA, tipo: 0, matriz: matriz([x, 2.85, z]) });
      // diagonales de refuerzo
      for (const z of [-1.05, 1.05]) c.agregar(new THREE.BoxGeometry(2.6, 0.09, 0.07), { color: MADERA, tipo: 0, matriz: matriz([0, 1.25, z], [0, 0, 0.72]) });
      // escalera por el lado +x: sube hacia -z y desemboca en la plataforma.
      // 2.4: más ancha hacia afuera, para que el que sube por el medio no roce el borde del
      // piso de arriba (le hacía de techo), y pegada a la plataforma para pasar de costado
      for (let i = 0; i < 9; i++) c.agregar(new THREE.BoxGeometry(0.66, 0.07, 0.32), { color: TABLA, tipo: 0, variar: 0.08,
        matriz: matriz([1.55, 0.27 * (i + 1) - 0.035, 1.5 - i * 0.3]) });
      for (const x of [1.22, 1.89]) c.agregar(new THREE.BoxGeometry(0.06, 0.12, 3.4), { color: MADERA_OSCURA, tipo: 0,
        matriz: matriz([x, 1.25, 0.3], [Math.atan2(2.43, 2.4), 0, 0]) });
      // 3.0.1: un escalón de arranque al pie (desde el suelo, el segundo peldaño ya frenaba al
      // cuerpo si el suelo bajaba unos centímetros: la escalera no se subía)
      c.agregar(new THREE.BoxGeometry(0.66, 0.12, 0.54), { color: TABLA, tipo: 0, variar: 0.08, matriz: matriz([1.55, 0.06, 1.93]) });
      zocalo(c, suelo, 1.55, 1.7, 1.55, 2.16, 0.0, 0.6);
      for (const x of [1.22, 1.89]) calce(c, suelo, x, 1.55, 0.02, 0.05, MADERA_OSCURA, 0);
    },
    fisica(h) {
      for (const [x, z] of [[-1.05, -1.05], [1.05, -1.05], [-1.05, 1.05], [1.05, 1.05]]) h.circulo(x, z, 0.14, -0.05, 2.3);
      h.plataforma(0, 0, 2.4, 2.4, 2.42, 0.16, 0.62);
      // 2.4: hasta acá la escalera no se podía subir: el peldaño de arriba (y el borde del
      // piso) le hacían de techo al cuerpo. Los peldaños son abiertos (sinTecho), más
      // anchos hacia afuera (se sube por x ≈ 1,6, donde el cuerpo no toca el piso) y
      // llegan hasta el borde de la plataforma.
      // 3.0.1: 6 cm más anchos hacia adentro, encimados con el piso (quedaba una rendija de 2 cm
      // entre el último peldaño y la plataforma: el cuadro que caía ahí te dejaba en el aire)
      for (let i = 0; i < 9; i++) h.plataforma(1.52, 1.5 - i * 0.3, 0.72, 0.32, 0.27 * (i + 1), 0.08, 0.6, { sinTecho: true });
      h.plataforma(1.55, 1.925, 0.66, 0.55, 0.12, 0.12, 0.6);   // 3.0.1: el escalón de arranque (encimado con el primer peldaño)
      // 2.4: el hueco de la baranda cubre todo el último peldaño
      h.segmento(1.12, -0.25, 1.12, 1.12, 0.06, 2.4, 3.3);
      h.segmento(-1.12, -1.12, 1.12, -1.12, 0.06, 2.4, 3.3);
      h.segmento(-1.12, 1.12, 1.12, 1.12, 0.06, 2.4, 3.3);
      h.segmento(-1.12, -1.12, -1.12, 1.12, 0.06, 2.4, 3.3);
    },
  },
  {
    // 2.1: el excavador no puede asomar donde hay piedra (ver `desafio-valle.js`)
    id: 'losa-piedra', nombre: 'Losa de piedra', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.6, ancho: 3, fondo: 3, alto: 0.12, separacion: 0.1, vida: 400,
    texto: 'Lajas grandes asentadas en el suelo, bien juntas. No frenan a nadie por arriba, pero por abajo no pasa el excavador: donde hay losa, no puede asomar.',
    pide: { piedra: 8 }, pendienteMax: 0.35, distSendero: 0,
    arma(c, P, datos, suelo) {
      for (let i = 0; i < 9; i++) {
        const x = -1 + (i % 3), z = -1 + Math.floor(i / 3);
        c.agregar(new THREE.BoxGeometry(0.94, 0.12, 0.94), { color: PIEDRA, tipo: 4, variar: 0.22,
          matriz: matriz([x + (i % 2 ? 0.02 : -0.02), 0.05, z], [0, (i % 4) * 0.03, 0]) });
        // 3.0.1: en la ladera, cada laja apoya en su cama de piedra, hasta lo más bajo de sus esquinas
        const h = sueloMin(suelo, [[x - 0.47, z - 0.47], [x + 0.47, z - 0.47], [x - 0.47, z + 0.47], [x + 0.47, z + 0.47]]);
        if (h < -0.04) c.agregar(new THREE.BoxGeometry(0.92, 0.16 - h, 0.92), { color: '#6c665d', tipo: 4, variar: 0.16, matriz: matriz([x, (h - 0.16) / 2, z]) });
      }
    },
  },
  {
    // 2.3: contra el volador (ver `desafio-cielo.js`)
    id: 'ballesta-cielo', nombre: 'Ballesta al cielo', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.1, ancho: 1.6, fondo: 1.6, alto: 3.6, separacion: 1.8, vida: 240,
    texto: 'Una ballesta montada en lo alto de un poste, que gira y apunta para arriba. Prefiere a los voladores: los alcanza a 34 metros aunque vayan alto. Si no hay ninguno, tira a los de tierra.',
    pide: { tabla: 6, tronco: 4, cristal: 2 }, pendienteMax: 0.45, distSendero: 0.4,
    defensa: { tipo: 'torreta', cielo: true, alcance: 34, dano: 26, cadencia: 1.4, altura: 3.4 },
    arma(c, P, datos, suelo) {
      calce(c, suelo, 0, 0, 0.0, 0.45);   // 3.0.1
      c.agregar(new THREE.CylinderGeometry(0.4, 0.46, 0.3, 8), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([0, 0.14, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.1, 0.13, 3.1, 7), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([0, 1.7, 0]) });
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI * 2 / 3;
        c.agregar(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 5), { color: MADERA, tipo: 0,
          matriz: matriz([Math.sin(a) * 0.3, 0.6, Math.cos(a) * 0.3], [Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6]) });
      }
      // la ballesta arriba, inclinada al cielo, con su punta de cristal
      c.agregar(new THREE.BoxGeometry(0.14, 0.12, 1.1), { color: TABLA, tipo: 0, matriz: matriz([0, 3.35, 0.1], [-0.6, 0, 0]) });
      c.agregar(new THREE.TorusGeometry(0.56, 0.03, 5, 12, Math.PI * 0.9), { color: MADERA, tipo: 0, matriz: matriz([0, 3.6, 0.35], [Math.PI / 2 - 0.6, 0, Math.PI * 0.05]) });
      c.agregar(new THREE.IcosahedronGeometry(0.07, 0), { color: '#7dfff0', tipo: 4, variar: 0, matriz: matriz([0, 3.72, 0.55]) });
    },
    fisica(h) { h.circulo(0, 0, 0.5, -0.05, 3.3); },
  },
  {
    // 2.3: una zanja que se carga de leña y se prende (ver `desafio-zanja.js`)
    id: 'zanja-fuego', nombre: 'Zanja de fuego', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.9, ancho: 3.2, fondo: 1.2, alto: 0.3, separacion: 0.3, vida: 300,
    defensa: { tipo: 'zanja', largo: 3.2 },
    snap: { tipo: 'linea', familia: 'zanja', largo: 3.2, umbral: 1.0 },
    texto: 'Una zanja poco profunda delante del paso. Se carga con dos troncos (E) y se prende (E otra vez) cuando llegan: arde un minuto y quema al que la cruza. Con viento, el fuego puede escaparse al pasto; con lluvia, no prende.',
    pide: { tronco: 1, piedra: 2 }, pendienteMax: 0.4, distSendero: 0.3,
    arma(c) {
      for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(3.2, 0.14, 0.3), { color: '#5b4b38', tipo: 4, variar: 0.16, matriz: matriz([0, 0.05, sz * 0.5]) });
      c.agregar(new THREE.BoxGeometry(3.05, 0.06, 0.72), { color: '#2a211a', tipo: 4, variar: 0.08, matriz: matriz([0, 0.0, 0]) });
      // piedras en las puntas, para que el fuego no se corra por los costados
      for (const sx of [-1, 1]) for (const [dz, r] of [[-0.28, 0.16], [0.26, 0.14]]) c.agregar(new THREE.IcosahedronGeometry(r, 0), {
        color: PIEDRA, tipo: 4, variar: 0.15, matriz: matriz([sx * 1.6, r * 0.6, dz], [r, sx, dz]) });
    },
    // sin física: se cruza caminando; lo que importa es el fuego
  },
  {
    id: 'pozo', nombre: 'Pozo con estacas', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.2, ancho: 2.0, fondo: 2.0, alto: 0.4, separacion: 0.6, vida: 200,
    texto: 'Un pozo tapado con ramas: el invasor que lo pisa queda atrapado unos segundos y se lastima. Tarda en rearmarse.',
    pide: { tronco: 2, piedra: 2 }, pendienteMax: 0.45, distSendero: 0,
    defensa: { tipo: 'pozo', radio: 1.0, atrapa: 4, dps: 14, rearme: 9 },
    arma(c) {
      c.agregar(new THREE.CylinderGeometry(0.98, 0.98, 0.04, 14), { color: '#4a3b2c', tipo: 0, variar: 0.25, matriz: matriz([0, 0.02, 0]) });
      for (let i = 0; i < 14; i++) {
        const a = i * 0.9, r = 0.25 + (i % 4) * 0.2;
        c.agregar(new THREE.CylinderGeometry(0.018, 0.022, 1.6, 4), { color: i % 2 ? '#6b5238' : '#8a6b4a', tipo: 0, variar: 0.15,
          matriz: matriz([Math.cos(a) * r * 0.3, 0.05, Math.sin(a) * r * 0.3], [Math.PI / 2, a, 0]) });
      }
      for (let i = 0; i < 8; i++) c.agregar(new THREE.IcosahedronGeometry(0.16, 0), { color: PIEDRA, tipo: 4, variar: 0.2,
        matriz: matriz([Math.cos(i * 0.785) * 1.05, 0.05, Math.sin(i * 0.785) * 1.05], [i, 0, 0], [1, 0.5, 1]) });
    },
  },
  {
    id: 'red-cristal', nombre: 'Red de cristal', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.6, ancho: 3.0, fondo: 1.2, alto: 1.2, separacion: 0.4, vida: 140,
    texto: 'Hilos tensados con polvo de cristal: los invasores que la cruzan avanzan a un tercio de su velocidad.',
    pide: { cristal: 2, tabla: 2 }, pendienteMax: 0.6, distSendero: 0,
    defensa: { tipo: 'red', radio: 1.6, freno: 0.3, desgaste: 2 },
    arma(c) {
      for (const x of [-1.4, 0, 1.4]) c.agregar(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 5), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 0.5, 0]) });
      for (let i = 0; i < 4; i++) c.agregar(new THREE.CylinderGeometry(0.01, 0.01, 2.9, 3), { color: '#7dfff0', tipo: 4, variar: 0,
        matriz: matriz([0, 0.25 + i * 0.22, (i % 2) * 0.1 - 0.05], [0, 0, Math.PI / 2]) });
      for (let i = 0; i < 6; i++) c.agregar(new THREE.CylinderGeometry(0.01, 0.01, 1.1, 3), { color: '#7dfff0', tipo: 4, variar: 0,
        matriz: matriz([-1.2 + i * 0.48, 0.55, 0], [0, 0, 0.5 * ((i % 2) * 2 - 1)]) });
    },
  },
  {
    id: 'barril-resina', nombre: 'Barril de resina', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 0.6, ancho: 0.8, fondo: 0.8, alto: 1.1, separacion: 2.5, vida: 60,
    texto: 'Resina de pehuén y leña apretada. Estalla cuando un invasor se acerca a dos metros: mucho daño alrededor, y se consume.',
    pide: { tronco: 2, tabla: 2 }, pendienteMax: 0.6, distSendero: 0,
    defensa: { tipo: 'barril', radio: 2.0, estallido: 4.2, dano: 95 },
    arma(c, P, datos, suelo) {
      calce(c, suelo, 0, 0, 0.01, 0.37);   // 3.0.1
      c.agregar(new THREE.CylinderGeometry(0.36, 0.36, 0.95, 12), { color: '#7a5431', tipo: 0, variar: 0.12, matriz: matriz([0, 0.48, 0]) });
      for (const y of [0.15, 0.48, 0.81]) c.agregar(new THREE.TorusGeometry(0.37, 0.025, 4, 16), { color: '#3f3a34', tipo: 4, matriz: matriz([0, y, 0], [Math.PI / 2, 0, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 12), { color: '#c98a2e', tipo: 0, variar: 0.1, matriz: matriz([0, 0.96, 0]) });
    },
    fisica(h) { h.circulo(0, 0, 0.38, -0.05, 1.0); },
  },
  // ---- versiones reforzadas: no se construyen desde cero, se mejoran en el taller (K → Base)
  // ---------------------------------------------------------------- 2.6: el fortín
  // (las reglas están en desafio-fortin.js; lo que hacen de noche, en desafio-fortin-mundo.js)
  {
    id: 'muro-tronera', nombre: 'Pirca con troneras', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.9, ancho: 3.0, fondo: 0.8, alto: 2.0, separacion: 0.3, vida: 650,
    snap: { tipo: 'linea', familia: 'muro-piedra', largo: 3.0, umbral: 1.0 },
    texto: 'Una pirca alta con dos aspilleras: desde adentro tus flechas, virotes y tiros pasan por las ranuras; de afuera no entra nada.',
    pide: { piedra: 12, tronco: 1 }, pendienteMax: 0.5, distSendero: 0.4,
    defensa: { tipo: 'tronera' },
    arma(c) {
      for (let fila = 0; fila < 6; fila++) {
        const n = fila % 2 ? 5 : 6, ancho = 3.0 / n, y = 0.17 + fila * 0.32;
        for (let k = 0; k < n; k++) {
          const x = -1.5 + ancho * (k + 0.5);
          // las ranuras: dos huecos angostos entre 1,0 y 1,7 m
          if (fila >= 3 && fila <= 4 && Math.abs(Math.abs(x) - 0.75) < ancho * 0.5) {
            for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(ancho * 0.36, 0.3, 0.72), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([x + s * ancho * 0.32, y, 0]) });
            continue;
          }
          c.agregar(new THREE.BoxGeometry(ancho * 0.96, 0.3, 0.74), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([x, y, 0], [0, (k % 3) * 0.02, 0]) });
        }
      }
      for (const x of [-0.75, 0.75]) c.agregar(new THREE.BoxGeometry(0.42, 0.06, 0.8), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.74, 0]) });
    },
    fisica(h) { h.segmento(-1.5, 0, 1.5, 0, 0.36, -0.1, 2.0); },
  },
  {
    id: 'catapulta', nombre: 'Catapulta de piedras', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.8, ancho: 2.2, fondo: 3.0, alto: 2.4, separacion: 1.5, vida: 300,
    texto: 'Un brazo de lenga con contrapeso. Tira sola una piedra cada seis segundos al grupo de invasores más apretado, entre 10 y 46 metros. Se carga con piedras (E).',
    pide: { tronco: 6, tabla: 4, piedra: 4 }, pendienteMax: 0.4, distSendero: 0.4,
    defensa: { tipo: 'catapulta' },
    arma(c, P, datos, suelo) {
      for (const x of [-0.9, 0.9]) {
        c.agregar(new THREE.BoxGeometry(0.16, 0.16, 2.8), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([x, 0.12, 0]) });
        for (const z of [-1.25, 1.25]) calce(c, suelo, x, z, 0.04, 0.12);   // 3.0.1
        for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.12, 1.6, 0.12), { color: MADERA, tipo: 0, matriz: matriz([x, 0.85, s * 0.35], [s * 0.25, 0, 0]) });
      }
      c.agregar(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 7), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 1.55, 0], [0, 0, Math.PI / 2]) });
      // 3.0.1: el brazo inclinado para el otro lado: así pasa por el eje, la cuchara queda en
      // su punta alta y el contrapeso colgado de la baja (antes flotaban los dos, lejos del brazo)
      c.agregar(new THREE.BoxGeometry(0.14, 0.14, 2.8), { color: MADERA, tipo: 0, variar: 0.06, matriz: matriz([0, 1.75, -0.3], [0.55, 0, 0]) });
      c.agregar(new THREE.BoxGeometry(0.55, 0.5, 0.55), { color: PIEDRA, tipo: 4, variar: 0.14, matriz: matriz([0, 1.05, 0.8]) });
      c.agregar(new THREE.BoxGeometry(0.45, 0.12, 0.45), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 2.5, -1.35], [0.55, 0, 0]) });
    },
    fisica(h) { h.segmento(0, -1.3, 0, 1.3, 1.0, -0.1, 1.6); },
  },
  {
    id: 'troncos-colgantes', nombre: 'Troncos colgantes', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.8, ancho: 3.0, fondo: 1.0, alto: 3.4, separacion: 1.2, vida: 260,
    texto: 'Un travesaño alto con un tronco atado. Cuando un invasor pasa por abajo, se suelta: golpea fuerte a todos los de alrededor y los tira. Se vuelve a armar con E.',
    pide: { tronco: 5, tabla: 1 }, pendienteMax: 0.45, distSendero: 0,
    defensa: { tipo: 'troncos', sinCuerpo: true },
    arma(c, P, datos, suelo) {
      for (const x of [-1.35, 1.35]) {
        c.agregar(new THREE.CylinderGeometry(0.13, 0.16, 3.4, 7), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([x, 1.7, 0]) });
        calce(c, suelo, x, 0, 0.01, 0.16, MADERA_OSCURA, 0);   // 3.0.1
      }
      c.agregar(new THREE.CylinderGeometry(0.1, 0.1, 3.0, 7), { color: MADERA, tipo: 0, matriz: matriz([0, 3.25, 0], [0, 0, Math.PI / 2]) });
    },
    fisica(h) { for (const x of [-1.35, 1.35]) h.circulo(x, 0, 0.16, -0.05, 3.4); },
  },
  {
    id: 'cerco-cristal', nombre: 'Cerco de cristal', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.7, ancho: 3.0, fondo: 0.4, alto: 1.3, separacion: 0.3, vida: 200,
    snap: { tipo: 'linea', familia: 'cerco-cristal', largo: 3.0, umbral: 1.0 },
    texto: 'Alambre con polvo de cristal entre postes. Da una descarga a cada invasor que lo toca y lo frena. Cada noche gasta un cristal para cargarse.',
    pide: { cristal: 2, tronco: 2 }, pendienteMax: 0.6, distSendero: 0.4,
    defensa: { tipo: 'cerco-cristal' },
    arma(c) {
      for (const x of [-1.45, 0, 1.45]) c.agregar(new THREE.CylinderGeometry(0.06, 0.07, 1.3, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 0.65, 0]) });
      for (const y of [0.4, 0.8, 1.15]) c.agregar(new THREE.CylinderGeometry(0.012, 0.012, 2.9, 4), { color: '#7dfff0', tipo: 4, matriz: matriz([0, y, 0], [0, 0, Math.PI / 2]) });
      for (const x of [-0.7, 0.7]) c.agregar(new THREE.IcosahedronGeometry(0.07, 0), { color: '#9ffff4', tipo: 4, matriz: matriz([x, 0.8, 0]) });
    },
    fisica(h) { h.segmento(-1.5, 0, 1.5, 0, 0.1, -0.05, 1.3); },
  },
  {
    id: 'puente-levadizo', nombre: 'Puente levadizo', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.6, ancho: 2.2, fondo: 0.6, alto: 3.8, separacion: 0.4, vida: 420,
    texto: 'Un tablero de 3,5 m con bisagra y manivela, para poner sobre el foso. Con E lo subís (es una pared) o lo bajás (se camina por encima).',
    pide: { tronco: 4, tabla: 6, piedra: 2 }, pendienteMax: 0.5, distSendero: 0,
    defensa: { tipo: 'puente' },
    arma(c) {
      for (const x of [-1.05, 1.05]) c.agregar(new THREE.CylinderGeometry(0.13, 0.15, 3.8, 7), { color: MADERA_OSCURA, tipo: 0, variar: 0.1, matriz: matriz([x, 1.9, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), { color: MADERA, tipo: 0, matriz: matriz([0, 3.6, 0], [0, 0, Math.PI / 2]) });
      c.agregar(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 8), { color: MADERA, tipo: 0, matriz: matriz([-1.25, 1.1, -0.25], [0, 0, Math.PI / 2]) });
      c.agregar(new THREE.BoxGeometry(0.05, 0.4, 0.05), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([-1.36, 0.95, -0.25]) });
      c.agregar(new THREE.BoxGeometry(2.0, 0.22, 0.4), { color: PIEDRA, tipo: 4, variar: 0.12, matriz: matriz([0, 0.11, 0]) });
    },
    fisica(h) { for (const x of [-1.05, 1.05]) h.circulo(x, 0, 0.16, -0.05, 3.8); },
  },
  {
    id: 'espejo-faro', nombre: 'Espejo del faro', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 0.8, ancho: 1.0, fondo: 1.0, alto: 2.2, separacion: 1.5, vida: 140,
    texto: 'Una plancha de cristal pulido sobre un poste. Con una antorcha prendida a menos de 4,5 m, barre un haz de luz hacia adelante: encandila (no apuntan, van más lento) y deja a la vista a los oscuros.',
    pide: { cristal: 2, tabla: 2, tronco: 1 }, pendienteMax: 0.6, distSendero: 0,
    defensa: { tipo: 'espejo' },
    arma(c) {
      c.agregar(new THREE.CylinderGeometry(0.07, 0.09, 1.9, 7), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 0.95, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 18), { color: '#cfeff0', tipo: 4, matriz: matriz([0, 1.95, 0.08], [Math.PI / 2 - 0.2, 0, 0]) });
      c.agregar(new THREE.TorusGeometry(0.43, 0.035, 5, 18), { color: MADERA, tipo: 0, matriz: matriz([0, 1.95, 0.06], [-0.2, 0, 0]) });
    },
    fisica(h) { h.circulo(0, 0, 0.12, -0.05, 2.1); },
  },
  {
    id: 'senuelo', nombre: 'Señuelo', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 0.7, ancho: 1.2, fondo: 0.6, alto: 1.9, separacion: 3, vida: 160,
    texto: 'Un espantapájaros con trapos y tu olor. Los invasores que pasan a menos de 25 m, si vos estás lejos, van por él: ponelo delante de tus trampas.',
    pide: { tronco: 1, tabla: 1 }, pendienteMax: 0.6, distSendero: 0,
    defensa: { tipo: 'senuelo' },
    arma(c) {
      c.agregar(new THREE.CylinderGeometry(0.05, 0.06, 1.9, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 0.95, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), { color: MADERA, tipo: 0, matriz: matriz([0, 1.45, 0], [0, 0, Math.PI / 2]) });
      c.agregar(new THREE.BoxGeometry(0.5, 0.7, 0.2), { color: '#8a3b2e', tipo: 0, variar: 0.1, matriz: matriz([0, 1.15, 0]) });
      c.agregar(new THREE.SphereGeometry(0.16, 8, 6), { color: '#b8a67e', tipo: 0, matriz: matriz([0, 1.72, 0]) });
    },
    fisica(h) { h.circulo(0, 0, 0.12, -0.05, 1.9); },
  },
  {
    id: 'trampa-lazo', nombre: 'Trampa de lazo', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 0.9, ancho: 1.2, fondo: 1.2, alto: 2.4, separacion: 1.5, vida: 80,
    texto: 'Un lazo escondido y un palo doblado. El primer invasor que lo pisa queda colgado cinco segundos, sin poder hacer nada (y recibe más daño). Se vuelve a armar con E. Los grandes lo rompen.',
    pide: { tronco: 1, tabla: 1 }, pendienteMax: 0.6, distSendero: 0,
    defensa: { tipo: 'lazo', sinCuerpo: true },
    arma(c) {
      c.agregar(new THREE.CylinderGeometry(0.05, 0.07, 2.4, 6), { color: MADERA, tipo: 0, matriz: matriz([-0.5, 1.2, 0], [0, 0, 0.25]) });
      c.agregar(new THREE.TorusGeometry(0.35, 0.012, 4, 14), { color: '#c9b894', tipo: 0, matriz: matriz([0, 0.03, 0], [Math.PI / 2, 0, 0]) });
    },
  },
  {
    id: 'abrojos', nombre: 'Abrojos de cristal', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 2.5, ancho: 4.5, fondo: 4.5, alto: 0.2, separacion: 1.0, vida: 120,
    texto: 'Puntas de cristal regadas en el piso: los que pasan van a la mitad y se lastiman. Se gastan de a poco. De día, con E, se juntan y te devuelven lo que costaron.',
    pide: { cristal: 1, piedra: 2 }, pendienteMax: 0.6, distSendero: 0,
    defensa: { tipo: 'abrojos' },
    arma(c, P, datos, suelo) {
      for (let i = 0; i < 26; i++) {
        const a = i * 2.39996, r = 2.1 * Math.sqrt((i + 0.5) / 26);
        // 3.0.1: cada punta sobre el suelo (en la ladera quedaban en el aire)
        const y = 0.05 + (suelo ? suelo(Math.cos(a) * r, Math.sin(a) * r) : 0);
        c.agregar(new THREE.TetrahedronGeometry(0.07, 0), { color: i % 2 ? '#7dfff0' : '#b0c4c6', tipo: 4, matriz: matriz([Math.cos(a) * r, y, Math.sin(a) * r], [i, i * 0.7, 0]) });
      }
    },
  },
  {
    id: 'embudo', nombre: 'Embudo de empalizada', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 3.4, ancho: 6.6, fondo: 3.2, alto: 2.6, separacion: 0.5, vida: 520,
    texto: 'Dos alas de empalizada en V, abiertas hacia afuera. Los invasores que llegan por delante se encauzan hacia la garganta: poné ahí una trampa, un portón o tus ballestas.',
    pide: { tronco: 8 }, pendienteMax: 0.5, distSendero: 0.4,
    defensa: { tipo: 'embudo', segmentos: [[-0.7, -1.2, -3.2, 1.6], [0.7, -1.2, 3.2, 1.6]] },
    arma(c, P, datos, suelo) {
      for (const s of [-1, 1]) {
        const ax = 0.7 * s, bx = 3.2 * s, az = -1.2, bz = 1.6, largo = Math.hypot(bx - ax, bz - az), n = 7;
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, alto = 2.2 + ((i * 37) % 5) * 0.06;
          c.agregar(new THREE.CylinderGeometry(0.16, 0.18, alto, 7), { color: i % 3 ? MADERA : MADERA_OSCURA, tipo: 0, variar: 0.12, matriz: matriz([x, alto / 2 - 0.15, z]) });
          c.agregar(new THREE.ConeGeometry(0.16, 0.42, 7), { color: TABLA, tipo: 0, variar: 0.1, matriz: matriz([x, alto - 0.15 + 0.2, z]) });
          calce(c, suelo, x, z, -0.12, 0.18, i % 3 ? MADERA : MADERA_OSCURA, 0);   // 3.0.1
        }
        c.agregar(new THREE.CylinderGeometry(0.07, 0.07, largo, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([(ax + bx) / 2, 1.2, (az + bz) / 2], [0, -Math.atan2(bz - az, bx - ax), Math.PI / 2]) });
      }
    },
    fisica(h) { h.segmento(-0.7, -1.2, -3.2, 1.6, 0.2, -0.1, 2.6); h.segmento(0.7, -1.2, 3.2, 1.6, 0.2, -0.1, 2.6); },
  },
  {
    id: 'tejado-lajas', nombre: 'Tejado de lajas', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 2.2, ancho: 3.0, fondo: 3.0, alto: 2.9, separacion: 0.3, vida: 700, cubreOtras: true,
    texto: 'Lajas de piedra sobre cuatro postes, arriba de tus antorchas o de tu puesto: los voladores no pueden bajar a apagarlas ni a picarte mientras estés abajo.',
    pide: { piedra: 8, tronco: 4 }, pendienteMax: 0.45, distSendero: 0.4,
    defensa: { tipo: 'tejado', soloArriba: 2.4 },
    arma(c, P, datos, suelo) {
      for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) {
        c.agregar(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 7), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.3, z]) });
        calce(c, suelo, x, z, 0.01, 0.14, MADERA_OSCURA, 0);   // 3.0.1
      }
      for (let i = 0; i < 9; i++) {
        const x = -1.2 + (i % 3) * 1.2, z = -1.2 + Math.floor(i / 3) * 1.2;
        c.agregar(new THREE.BoxGeometry(1.25, 0.12, 1.25), { color: i % 2 ? PIEDRA : '#6b655c', tipo: 4, variar: 0.12, matriz: matriz([x, 2.7 + (i % 2) * 0.04, z], [0.03 * (i % 3), 0, 0.02 * (i % 2)]) });
      }
    },
    fisica(h) { for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) h.circulo(x, z, 0.14, -0.05, 2.6); },
  },
  {
    id: 'puesto-tirador', nombre: 'Puesto de tirador', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.5, ancho: 2.4, fondo: 1.6, alto: 1.0, separacion: 2.0, vida: 380,
    texto: 'Un parapeto de piedra con apoyo para el arco. Josefina, con la orden "quedate en la base", se aposta acá: tira más lejos, más seguido y más fuerte.',
    pide: { piedra: 8, tabla: 2 }, pendienteMax: 0.45, distSendero: 0.4,
    defensa: { tipo: 'puesto' },
    arma(c, P, datos, suelo) {
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (0.15 + 0.7 * (i / 6)), x = Math.cos(a) * 1.1, z = Math.sin(a) * 0.75;
        c.agregar(new THREE.BoxGeometry(0.5, 0.95, 0.38), { color: PIEDRA, tipo: 4, variar: 0.15, matriz: matriz([x, 0.47, z], [0, -a + Math.PI / 2, 0]) });
        calce(c, suelo, x, z, 0.0, 0.22);   // 3.0.1
      }
      c.agregar(new THREE.BoxGeometry(1.6, 0.08, 0.3), { color: MADERA, tipo: 0, matriz: matriz([0, 0.98, 0.72]) });
    },
    fisica(h) { h.segmento(-1.05, 0.25, 0, 0.8, 0.22, -0.1, 1.0); h.segmento(0, 0.8, 1.05, 0.25, 0.22, -0.1, 1.0); },
  },
  {
    id: 'pasarela-colgante', nombre: 'Pasarela colgante', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 3.1, ancho: 1.0, fondo: 6.0, alto: 2.6, separacion: 0.2, vida: 240,
    texto: 'Seis metros de tablas y soga a la altura del adarve (2 m), entre dos postes. Se une a adarves y torres para moverte por arriba de un lado al otro.',
    pide: { tabla: 6, tronco: 2 }, pendienteMax: 0.45, distSendero: 0,
    defensa: { tipo: 'pasarela', soloArriba: 1.85 },
    arma(c, P, datos, suelo) {
      for (const z of [-2.9, 2.9]) for (const x of [-0.5, 0.5]) {
        c.agregar(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 1.3, z]) });
        calce(c, suelo, x, z, 0.01, 0.1, MADERA_OSCURA, 0);   // 3.0.1
      }
      for (let i = 0; i < 20; i++) c.agregar(new THREE.BoxGeometry(0.95, 0.05, 0.26), { color: i % 3 ? TABLA : '#795f44', tipo: 0, variar: 0.1, matriz: matriz([0, 2.02 - Math.sin((i + 0.5) / 20 * Math.PI) * 0.12, -2.85 + i * 0.3]) });
      for (const x of [-0.5, 0.5]) c.agregar(new THREE.CylinderGeometry(0.015, 0.015, 5.9, 4), { color: '#c9b894', tipo: 0, matriz: matriz([x, 2.6, 0], [Math.PI / 2, 0, 0]) });
    },
    fisica(h) {
      // 3.0.1: cinco centímetros de más en cada punta, para empalmar con el adarve o la torre
      // sin rendija (ahí el cuerpo quedaba en el aire y se caía)
      h.plataforma(0, 0, 1.0, 6.1, 2.05, 0.14, 0.62);
      for (const x of [-0.5, 0.5]) h.segmento(x, -2.9, x, 2.9, 0.04, 2.05, 2.7);
      // 3.0.1: los cuatro postes se chocan (antes se los atravesaba)
      for (const z of [-2.9, 2.9]) for (const x of [-0.5, 0.5]) h.circulo(x, z, 0.1, -0.05, 2.0);
    },
  },
  {
    id: 'rampa-troncos', nombre: 'Rampa de troncos', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.6, ancho: 2.6, fondo: 2.0, alto: 1.3, separacion: 1.5, vida: 220,
    texto: 'Tres troncos sujetos con una traba, en lo alto de una pendiente. Con E cargás los troncos; con E otra vez, tirás de la palanca: ruedan cuesta abajo y aplastan a los que encuentran.',
    pide: { tronco: 3, tabla: 3 }, pendienteMax: 0.6, distSendero: 0,
    defensa: { tipo: 'rampa' },
    arma(c, P, datos, suelo) {
      for (const sx of [-1.2, 1.2]) for (const z of [-0.95, 0.95]) calce(c, suelo, sx, z, z < 0 ? 0.52 : 0.14, 0.06, MADERA_OSCURA, 0);   // 3.0.1
      for (const x of [-1.2, 1.2]) c.agregar(new THREE.BoxGeometry(0.12, 0.12, 2.0), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 0.35, 0], [0.2, 0, 0]) });
      c.agregar(new THREE.BoxGeometry(2.5, 0.35, 0.12), { color: MADERA, tipo: 0, matriz: matriz([0, 0.4, 0.95]) });
      c.agregar(new THREE.BoxGeometry(0.06, 0.8, 0.06), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([1.4, 0.55, 0.9], [0.3, 0, 0]) });
    },
    fisica(h) { h.segmento(-1.3, 0.95, 1.3, 0.95, 0.1, -0.1, 0.6); },
  },
  {
    id: 'armero', nombre: 'Armero', pieza: true, soloDesafio: true, categoria: 'defensa', funciones: ['armero'],
    radio: 1.0, ancho: 1.6, fondo: 0.7, alto: 1.9, separacion: 1.0, vida: 200,
    texto: 'Un estante para flechas, virotes y boleadoras. Con E, rehace de una la munición de tus armas con lo que tengas. Al lado se fabrica como en un banco de trabajo.',
    pide: { tabla: 5, tronco: 2 }, pendienteMax: 0.45, distSendero: 0,
    defensa: { tipo: 'armero' },
    arma(c) {
      for (const x of [-0.75, 0.75]) c.agregar(new THREE.BoxGeometry(0.08, 1.9, 0.5), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([x, 0.95, 0]) });
      for (const y of [0.4, 0.95, 1.5]) c.agregar(new THREE.BoxGeometry(1.5, 0.05, 0.5), { color: TABLA, tipo: 0, variar: 0.08, matriz: matriz([0, y, 0]) });
      for (let i = 0; i < 12; i++) c.agregar(new THREE.CylinderGeometry(0.008, 0.008, 0.7, 4), { color: '#6b5238', tipo: 0, matriz: matriz([-0.6 + i * 0.1, 1.85, 0.05], [0.12, 0, 0]) });
      for (let i = 0; i < 3; i++) c.agregar(new THREE.IcosahedronGeometry(0.06, 0), { color: PIEDRA, tipo: 4, matriz: matriz([-0.3 + i * 0.3, 0.48, 0]) });
    },
    fisica(h) { h.segmento(-0.8, 0, 0.8, 0, 0.3, -0.05, 1.9); },
  },
  {
    id: 'contrafuerte', nombre: 'Contrafuerte de piedra', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.0, ancho: 1.2, fondo: 1.6, alto: 2.0, separacion: 0.1, vida: 600,
    texto: 'Un espolón de piedra apoyado contra la pared. Las paredes, portones y pircas a menos de 3,2 m aguantan un tercio más, y el excavador no puede pasar por debajo de ellas.',
    pide: { piedra: 8 }, pendienteMax: 0.5, distSendero: 0.4,
    defensa: { tipo: 'contrafuerte' },
    arma(c) {
      for (let fila = 0; fila < 6; fila++) {
        const largo = 1.5 - fila * 0.2, y = 0.17 + fila * 0.32;
        c.agregar(new THREE.BoxGeometry(1.1, 0.3, largo), { color: PIEDRA, tipo: 4, variar: 0.15, matriz: matriz([0, y, -0.75 + largo / 2]) });
      }
    },
    fisica(h) { h.segmento(0, -0.75, 0, 0.7, 0.55, -0.1, 1.9); },
  },
  {
    // 1.6: un pozo con estacas delante del paso. No frena, lastima: el que lo cruza
    // se clava, y el foso se va gastando con cada invasor que pasa.
    id: 'foso-estacas', nombre: 'Foso con estacas', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.9, ancho: 3.0, fondo: 1.6, alto: 0.5, separacion: 0.3, vida: 220,
    defensa: { tipo: 'foso', largo: 3.0, ancho: 1.5, dano: 34, usos: 12, freno: 0.45 },
    snap: { tipo: 'linea', familia: 'foso', largo: 3.0, umbral: 1.0 },
    texto: 'Una zanja larga con estacas paradas en el fondo, tapada con ramas. Se pone a lo largo del paso: el que la cruza se clava, se frena y sigue lastimado. Aguanta doce invasores; después hay que volver a cavarla.',
    pide: { tronco: 3, tabla: 2 }, pendienteMax: 0.4, distSendero: 0.5,
    arma(c) {
      // el borde de tierra removida
      for (const sz of [-1, 1]) c.agregar(new THREE.BoxGeometry(3.0, 0.16, 0.34), {
        color: '#5b4b38', tipo: 4, variar: 0.16, matriz: matriz([0, 0.06, sz * 0.72]) });
      // el pozo oscuro
      c.agregar(new THREE.BoxGeometry(2.86, 0.1, 1.14), { color: '#241d16', tipo: 4, variar: 0.05, matriz: matriz([0, -0.02, 0]) });
      // las estacas del fondo, en dos hileras salteadas
      for (let i = 0; i < 9; i++) {
        const x = -1.28 + i * 0.32, z = (i % 2) * 0.42 - 0.21, alto = 0.62 + ((i * 13) % 4) * 0.05;
        c.agregar(new THREE.ConeGeometry(0.075, alto, 5), { color: i % 3 ? MADERA : MADERA_OSCURA, tipo: 0, variar: 0.14,
          matriz: matriz([x, alto / 2 - 0.08, z], [((i * 7) % 5 - 2) * 0.05, i, ((i * 11) % 5 - 2) * 0.05]) });
      }
      // ramas cruzadas que lo disimulan
      for (let i = 0; i < 5; i++) c.agregar(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 5), {
        color: '#6a5b44', tipo: 0, variar: 0.2, matriz: matriz([-1.1 + i * 0.55, 0.28, 0], [0, (i % 2 ? 0.4 : -0.35), Math.PI / 2 + 0.06]) });
    },
    // sin física: es un agujero, no una pared. Lo que hace es lastimar al que lo cruza.
  },
  {
    id: 'porton-reforzado', nombre: 'Portón con tranca', pieza: true, soloDesafio: true, soloMejora: true, categoria: 'defensa', porton: true,
    radio: 1.9, ancho: 3.1, fondo: 0.6, alto: 2.9, separacion: 0.4, vida: 760,
    snap: { tipo: 'linea', familia: 'empalizada', largo: 3.1, umbral: 1.0 },
    texto: 'El portón con marco de piedra, chapa de tablas cruzadas y una tranca gruesa atravesada. Aguanta el doble y se sigue abriendo con E.',
    pide: { tronco: 3, piedra: 4 }, pendienteMax: 0.5, distSendero: 0,
    arma(c) {
      for (const x of [-1.42, -1.08, 1.08, 1.42]) {
        const alto = 2.6 + (Math.abs(x) > 1.2 ? 0.12 : 0.3);
        c.agregar(new THREE.CylinderGeometry(0.19, 0.21, alto, 7), { color: Math.abs(x) > 1.2 ? MADERA : MADERA_OSCURA, tipo: 0, variar: 0.12, matriz: matriz([x, alto / 2 - 0.15, 0]) });
        c.agregar(new THREE.ConeGeometry(0.19, 0.42, 7), { color: TABLA, tipo: 0, variar: 0.1, matriz: matriz([x, alto - 0.15 + 0.2, 0]) });
        // base de pirca en cada poste
        for (let i = 0; i < 3; i++) c.agregar(new THREE.IcosahedronGeometry(0.24, 0), { color: PIEDRA, tipo: 4, variar: 0.18,
          matriz: matriz([x + (i - 1) * 0.16, 0.12, (i % 2) * 0.12 - 0.06], [i, x, 0], [1.1, 0.8, 1.2]) });
      }
      c.agregar(new THREE.CylinderGeometry(0.13, 0.13, 2.6, 6), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([0, 2.55, 0], [0, 0, Math.PI / 2]) });
      // la tranca: un tirante grueso apoyado a la altura del pecho
      c.agregar(new THREE.BoxGeometry(2.45, 0.2, 0.16), { color: MADERA, tipo: 4, variar: 0.08, matriz: matriz([0, 1.28, 0.2]) });
      for (const x of [-1.15, 1.15]) c.agregar(new THREE.BoxGeometry(0.22, 0.32, 0.22), { color: '#4b443c', tipo: 4, matriz: matriz([x, 1.28, 0.2]) });
    },
    fisica(h) {
      h.segmento(-1.55, 0, -0.93, 0, 0.24, -0.1, 2.8);
      h.segmento(0.93, 0, 1.55, 0, 0.24, -0.1, 2.8);
      h.segmento(-0.93, 0, 0.93, 0, 0.16, 2.4, 2.8);
    },
  },
  {
    id: 'empalizada-reforzada', nombre: 'Empalizada reforzada', pieza: true, soloDesafio: true, soloMejora: true, categoria: 'defensa',
    radio: 1.9, ancho: 3.1, fondo: 0.7, alto: 2.8, separacion: 0.4, vida: 600,
    snap: { tipo: 'linea', familia: 'empalizada', largo: 3.1, umbral: 1.0 },
    texto: 'Empalizada con base de piedra y zunchos: casi el doble de resistente.',
    pide: { tronco: 4 }, pendienteMax: 0.6, distSendero: 0.4,
    arma(c) {
      for (let i = 0; i < 8; i++) {
        const x = -1.36 + i * 0.39, alto = 2.45 + ((i * 37) % 5) * 0.06;
        c.agregar(new THREE.CylinderGeometry(0.17, 0.19, alto, 7), { color: i % 3 ? MADERA : MADERA_OSCURA, tipo: 0, variar: 0.12, matriz: matriz([x, alto / 2 - 0.15, 0]) });
        c.agregar(new THREE.ConeGeometry(0.17, 0.42, 7), { color: TABLA, tipo: 0, variar: 0.1, matriz: matriz([x, alto - 0.15 + 0.2, 0]) });
      }
      for (const y of [0.9, 1.9]) c.agregar(new THREE.BoxGeometry(3.15, 0.1, 0.42), { color: '#3f3a34', tipo: 4, variar: 0.05, matriz: matriz([0, y, 0]) });
      for (let i = 0; i < 9; i++) c.agregar(new THREE.IcosahedronGeometry(0.26, 0), { color: PIEDRA, tipo: 4, variar: 0.18,
        matriz: matriz([-1.45 + i * 0.36, 0.12, (i % 2) * 0.12 - 0.06], [i, i * 0.5, 0], [1.1, 0.8, 1.2]) });
    },
    fisica(h) { h.segmento(-1.55, 0, 1.55, 0, 0.28, -0.1, 2.8); },
  },
  {
    id: 'muro-almenado', nombre: 'Muro almenado', pieza: true, soloDesafio: true, soloMejora: true, categoria: 'defensa',
    radio: 1.9, ancho: 3.0, fondo: 1.0, alto: 2.5, separacion: 0.3, vida: 1150,
    snap: { tipo: 'linea', familia: 'muro-piedra', largo: 3.0, umbral: 1.0 },
    texto: 'La pirca levantada y rematada en almenas. Lo más duro que se puede construir con piedra y tabla.',
    pide: { piedra: 10, tronco: 1 }, pendienteMax: 0.5, distSendero: 0.4,
    arma(c) {
      for (let fila = 0; fila < 6; fila++) {
        const n = fila % 2 ? 5 : 6, ancho = 3.0 / n;
        for (let i = 0; i < n; i++) {
          const x = -1.5 + ancho * (i + 0.5), y = 0.2 + fila * 0.36, s = 0.9 + ((i * 7 + fila * 3) % 4) * 0.04;
          c.agregar(new THREE.IcosahedronGeometry(0.3, 0), { color: (i + fila) % 3 ? PIEDRA : '#6c665d', tipo: 4, variar: 0.16,
            matriz: matriz([x, y, ((i + fila) % 2) * 0.06 - 0.03], [0.3 * i, 0.5 * fila, 0.2], [ancho / 0.55 * s, 0.7 * s, 1.35]) });
        }
      }
      for (const x of [-1.2, -0.4, 0.4, 1.2]) c.agregar(new THREE.BoxGeometry(0.46, 0.42, 0.7), { color: '#6c665d', tipo: 4, variar: 0.12, matriz: matriz([x, 2.3, 0]) });
    },
    fisica(h) { h.segmento(-1.5, 0, 1.5, 0, 0.46, -0.1, 2.5); },
  },
  // ---- tecnología recuperada de los restos de naves (se desbloquea con cada plano)
  {
    id: 'escudo-energia', nombre: 'Generador de escudo', pieza: true, soloDesafio: true, requierePlano: 'escudo', categoria: 'defensa',
    radio: 0.9, ancho: 1.2, fondo: 1.2, alto: 1.6, separacion: 10, vida: 260,
    texto: 'Tecnología de los invasores: una cúpula de 9 m que absorbe la mitad del daño que reciben las obras de adentro. Consume un cristal por noche.',
    pide: { cristal: 6, tabla: 4, piedra: 4 }, pendienteMax: 0.4, distSendero: 0.3,
    defensa: { tipo: 'escudo', radio: 9, absorbe: 0.5 },
    arma(c, P, datos, suelo) {
      calce(c, suelo, 0, 0, 0.0, 0.68, '#6d7278');   // 3.0.1
      c.agregar(new THREE.CylinderGeometry(0.55, 0.7, 0.35, 10), { color: '#6d7278', tipo: 4, matriz: matriz([0, 0.17, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.16, 0.22, 1.1, 8), { color: '#9aa0a6', tipo: 4, matriz: matriz([0, 0.85, 0]) });
      c.agregar(new THREE.IcosahedronGeometry(0.28, 1), { color: '#7dfff0', tipo: 4, variar: 0, matriz: matriz([0, 1.5, 0]) });
      for (let i = 0; i < 3; i++) c.agregar(new THREE.BoxGeometry(0.08, 0.7, 0.3), { color: '#9aa0a6', tipo: 4, matriz: matriz([Math.cos(i * 2.09) * 0.5, 0.5, Math.sin(i * 2.09) * 0.5], [0, -i * 2.09, 0.3]) });
    },
    fisica(h) { h.circulo(0, 0, 0.6, -0.05, 1.6); },
  },
  {
    id: 'faro-plasma', nombre: 'Faro de plasma', pieza: true, soloDesafio: true, requierePlano: 'faro', categoria: 'defensa',
    radio: 0.9, ancho: 1.2, fondo: 1.2, alto: 2.6, separacion: 4, vida: 300,
    texto: 'Tecnología de los invasores: dispara plasma al invasor más cercano a 30 m. Más daño que la ballesta.',
    pide: { cristal: 5, piedra: 4, tabla: 2 }, pendienteMax: 0.4, distSendero: 0.3,
    defensa: { tipo: 'torreta', alcance: 30, dano: 45, cadencia: 1.6, altura: 2.3, plasma: true },
    arma(c, P, datos, suelo) {
      calce(c, suelo, 0, 0, 0.0, 0.63, '#6d7278');   // 3.0.1
      c.agregar(new THREE.CylinderGeometry(0.5, 0.65, 0.4, 8), { color: '#6d7278', tipo: 4, matriz: matriz([0, 0.2, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.14, 0.24, 1.8, 8), { color: '#9aa0a6', tipo: 4, matriz: matriz([0, 1.3, 0]) });
      c.agregar(new THREE.TorusGeometry(0.34, 0.05, 5, 14), { color: '#7dfff0', tipo: 4, variar: 0, matriz: matriz([0, 2.05, 0], [Math.PI / 2, 0, 0]) });
      c.agregar(new THREE.IcosahedronGeometry(0.24, 1), { color: '#a6ff6e', tipo: 4, variar: 0, matriz: matriz([0, 2.35, 0]) });
    },
    fisica(h) { h.circulo(0, 0, 0.55, -0.05, 2.5); },
  },
  {
    id: 'baliza-sanacion', nombre: 'Baliza de sanación', pieza: true, soloDesafio: true, requierePlano: 'baliza', categoria: 'defensa',
    radio: 0.7, ancho: 1.0, fondo: 1.0, alto: 1.8, separacion: 6, vida: 180,
    texto: 'Tecnología de los invasores: mientras estés a menos de 7 m te cura 4 puntos por segundo.',
    pide: { cristal: 4, tabla: 3 }, pendienteMax: 0.5, distSendero: 0.3,
    defensa: { tipo: 'baliza', radio: 7, cura: 4 },
    arma(c, P, datos, suelo) {
      calce(c, suelo, 0, 0, 0.0, 0.48, '#6d7278');   // 3.0.1
      c.agregar(new THREE.CylinderGeometry(0.4, 0.5, 0.25, 8), { color: '#6d7278', tipo: 4, matriz: matriz([0, 0.12, 0]) });
      for (let i = 0; i < 4; i++) c.agregar(new THREE.BoxGeometry(0.07, 1.3, 0.07), { color: '#9aa0a6', tipo: 4, matriz: matriz([Math.cos(i * 1.57) * 0.22, 0.85, Math.sin(i * 1.57) * 0.22], [0, 0, 0.12 * ((i % 2) * 2 - 1)]) });
      c.agregar(new THREE.IcosahedronGeometry(0.2, 1), { color: '#9dffb0', tipo: 4, variar: 0, matriz: matriz([0, 1.6, 0]) });
    },
    fisica(h) { h.circulo(0, 0, 0.45, -0.05, 1.7); },
  },
  // ---- 2.8: el jardín. Nacen con la paleta de Personalizar → Tu jardín (queda anotada en
  // la obra: `datos.jardin`); las flores son piedra pintada para el material (tipo 4):
  // no se caen en invierno ni se ponen rojas en otoño como las hojas.
  {
    id: 'cantero-flores', nombre: 'Cantero de flores', pieza: true, radio: 1.3, ancho: 2.2, fondo: 1.0, alto: 0.5, separacion: 0.3,
    categoria: 'exterior', soloRelax: true, jardin: 'flores',
    texto: 'Un cantero bajo con borde de piedras y flores. El color sale de Personalizar → Tu jardín.',
    pide: { piedra: 3, tabla: 1 }, pendienteMax: 0.45, distSendero: 0.3,
    arma(c, P, datos, suelo) {
      const f = FLORES[estiloJardinDe(P, datos)];
      zocalo(c, suelo, -0.95, 0, 0.95, 0, 0.03, 0.85, '#3a2c20', 4);   // 3.0.1
      for (let i = 0; i < 16; i++) {
        const lado = i < 5 ? 0 : i < 10 ? 1 : i < 13 ? 2 : 3;
        const t = lado < 2 ? ((i % 5) + 0.5) / 5 : ((i - (lado === 2 ? 10 : 13)) + 0.5) / 3;
        const x = lado < 2 ? -1.0 + t * 2.0 : (lado === 2 ? -1.02 : 1.02);
        const z = lado < 2 ? (lado === 0 ? -0.45 : 0.45) : -0.45 + t * 0.9;
        c.agregar(new THREE.IcosahedronGeometry(0.13, 0), { color: ['#7d766c', '#8a857b', '#6c665d'][i % 3], tipo: 4, variar: 0.14,
          matriz: matriz([x, 0.07, z], [i * 0.7, i * 1.3, 0], [1.25, 0.7, 1.0]) });
      }
      c.agregar(new THREE.BoxGeometry(1.95, 0.12, 0.82), { color: '#3a2c20', tipo: 4, variar: 0.1, matriz: matriz([0, 0.08, 0]) });
      let k = 0;
      for (let fila = 0; fila < 3; fila++) for (let i = 0; i < 6; i++, k++) {
        matasJardin(c, -0.78 + i * 0.31 + (fila % 2) * 0.08, -0.26 + fila * 0.26, 0.14, f, k, 1);
      }
    },
  },
  {
    id: 'macizo-flores', nombre: 'Macizo redondo', pieza: true, radio: 1.0, ancho: 1.8, fondo: 1.8, alto: 0.5, separacion: 0.3,
    categoria: 'exterior', soloRelax: true, jardin: 'flores',
    texto: 'Una ronda de piedras con flores apretadas adentro, para el medio de un patio o la punta de una senda.',
    pide: { piedra: 4 }, pendienteMax: 0.45, distSendero: 0.3,
    arma(c, P, datos, suelo) {
      const f = FLORES[estiloJardinDe(P, datos)];
      zocalo(c, suelo, -0.6, 0, 0.6, 0, 0.02, 1.3, '#3a2c20', 4);   // 3.0.1: la tierra del macizo llega al suelo
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        c.agregar(new THREE.IcosahedronGeometry(0.15, 0), { color: ['#7d766c', '#8a857b', '#6c665d'][i % 3], tipo: 4, variar: 0.14,
          matriz: matriz([Math.cos(a) * 0.82, 0.07, Math.sin(a) * 0.82], [i * 0.5, a, 0], [1.2, 0.72, 1.0]) });
      }
      c.agregar(new THREE.CylinderGeometry(0.76, 0.78, 0.12, 12), { color: '#3a2c20', tipo: 4, variar: 0.1, matriz: matriz([0, 0.07, 0]) });
      let k = 0;
      matasJardin(c, 0, 0, 0.13, f, k++, 1.25);
      for (let i = 0; i < 6; i++, k++) { const a = (i / 6) * Math.PI * 2; matasJardin(c, Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0.13, f, k, 1.05); }
      for (let i = 0; i < 9; i++, k++) { const a = (i / 9) * Math.PI * 2 + 0.3; matasJardin(c, Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.13, f, k, 0.9); }
    },
  },
  {
    id: 'maceton', nombre: 'Macetón con flores', pieza: true, radio: 0.45, ancho: 0.6, fondo: 0.6, alto: 0.8, separacion: 0.2,
    categoria: 'exterior', soloRelax: true, jardin: 'flores', apoyaEnPlataforma: true,
    texto: 'Un macetón de barro con flores. Va afuera, en la galería o adentro de tu casa.',
    pide: { piedra: 2 }, pendienteMax: 0.6, distSendero: 0,
    arma(c, P, datos) {
      const f = FLORES[estiloJardinDe(P, datos)];
      c.agregar(new THREE.CylinderGeometry(0.27, 0.19, 0.44, 12), { color: '#9a5a3e', tipo: 4, variar: 0.06, matriz: matriz([0, 0.22, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12), { color: '#a8664a', tipo: 4, variar: 0.05, matriz: matriz([0, 0.43, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 12), { color: '#3a2c20', tipo: 4, matriz: matriz([0, 0.45, 0]) });
      matasJardin(c, 0, 0, 0.44, f, 0, 1.2);
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; matasJardin(c, Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0.42, f, i + 1, 0.9); }
    },
    fisica(h) { h.circulo(0, 0, 0.3, -0.05, 0.6); },
  },
  {
    id: 'seto', nombre: 'Seto', pieza: true, radio: 1.8, ancho: 3.0, fondo: 0.7, alto: 1.15, separacion: 0.3,
    categoria: 'exterior', soloRelax: true, jardin: 'seto',
    snap: { tipo: 'linea', familia: 'seto', largo: 3.0, umbral: 1.0 },
    texto: 'Un tramo de cerco vivo. Los tramos se encadenan para cerrar un patio o bordear la huerta.',
    pide: { tronco: 1, piedra: 1 }, pendienteMax: 0.5, distSendero: 0.5,
    arma(c, P, datos, suelo) {
      const s = SETOS[estiloJardinDe(P, datos)];
      const tonos = [s.hoja, '#4a6334', '#3f5a2e'];
      zocalo(c, suelo, -1.4, 0, 1.4, 0, 0.12, 0.5, s.hoja, 4);   // 3.0.1: en la ladera, el cerco vivo llega al suelo
      if (!s.fruto) {
        // ligustro podado: un bloque prolijo, con la cara de arriba apenas más clara
        c.agregar(new THREE.BoxGeometry(3.0, 0.95, 0.62), { color: s.hoja, tipo: 4, variar: 0.12, colorArriba: '#5f7d40', matriz: matriz([0, 0.5, 0]) });
        for (let i = 0; i < 6; i++) c.agregar(new THREE.IcosahedronGeometry(0.2, 0), { color: tonos[i % 3], tipo: 4, variar: 0.12,
          matriz: matriz([-1.25 + i * 0.5, 0.95, (i % 2 ? 0.08 : -0.08)], [i, i * 0.6, 0], [1.3, 0.5, 1.2]) });
        return;
      }
      for (let i = 0; i < 7; i++) {
        c.agregar(new THREE.IcosahedronGeometry(0.42, 1), { color: tonos[i % 3], tipo: 4, variar: 0.14, esferica: 0.6, centro: [0, 0, 0],
          matriz: matriz([-1.29 + i * 0.43, 0.55 + (i % 2) * 0.06, (i % 3 - 1) * 0.05], [0, i * 0.8, 0], [1.05, 1.28, 0.78]) });
      }
      for (let i = 0; i < 16; i++) {
        const x = -1.35 + (i / 15) * 2.7, lado = i % 2 ? 1 : -1;
        c.agregar(new THREE.IcosahedronGeometry(0.045, 0), { color: s.fruto, tipo: 4, variar: 0.1,
          matriz: matriz([x, 0.45 + ((i * 7) % 5) * 0.12, lado * 0.3]) });
      }
    },
    fisica(h) { h.segmento(-1.5, 0, 1.5, 0, 0.3, -0.05, 1.1); },
  },
  {
    id: 'senda-piedra', nombre: 'Senda de piedra', pieza: true, radio: 1.4, ancho: 2.4, fondo: 1.0, alto: 0.08, separacion: 0,
    categoria: 'exterior', soloRelax: true, jardin: 'senda',
    snap: { tipo: 'linea', familia: 'senda', largo: 2.4, umbral: 1.0 },
    texto: 'Un tramo de senda para no pisar el barro: lajas, canto rodado o ladrillo. Los tramos se encadenan.',
    pide: { piedra: 3 }, pendienteMax: 0.4, distSendero: 0,
    arma(c, P, datos, suelo) {
      const clave = estiloJardinDe(P, datos), col = SENDAS[clave].colores;
      // 3.0.1: en la ladera cada piedra va a la altura del suelo bajo ella (a la altura del pie
      // de la obra, una punta de la senda quedaba enterrada y la otra en el aire)
      const h = (x, z) => (suelo ? suelo(x, z) : 0);
      if (clave === 'laja') {
        for (let i = 0; i < 4; i++) { const x = -0.9 + i * 0.6, z = ((i * 37) % 5 - 2) * 0.05; c.agregar(new THREE.CylinderGeometry(0.36, 0.38, 0.07, 7), { color: col[i % col.length], tipo: 4, variar: 0.12,
          matriz: matriz([x, 0.015 + h(x, z), z], [0, i * 1.1, 0], [1.15, 1, 0.92]) }); }
      } else if (clave === 'canto') {
        for (let i = 0; i < 18; i++) { const x = -1.05 + (i % 9) * 0.26, z = (i < 9 ? -0.2 : 0.2) + ((i * 13) % 5 - 2) * 0.03; c.agregar(new THREE.IcosahedronGeometry(0.14, 0), { color: col[i % col.length], tipo: 4, variar: 0.12,
          matriz: matriz([x, 0.02 + h(x, z), z], [i, i * 0.9, 0], [1, 0.4, 1]) }); }
      } else {
        for (let fila = 0; fila < 7; fila++) for (let i = 0; i < 9; i++) {
          const x = -1.07 + i * 0.268 + (fila % 2) * 0.134, z = -0.39 + fila * 0.13;
          if (x > 1.12) continue;
          c.agregar(new THREE.BoxGeometry(0.25, 0.06, 0.12), { color: col[(i + fila) % col.length], tipo: 4, variar: 0.1,
            matriz: matriz([x, 0.015 + h(x, z), z]) });
        }
      }
    },
  },

];

// 2.8: una mata con flores del jardín (hojas abajo, tres flores arriba). `y` es el suelo
// del cantero; `k` varía el tono y el giro para que no se vean todas iguales.
function matasJardin(c, x, z, y, f, k, esc = 1) {
  const verdes = ['#4d6b32', '#5a7a3a', '#3f5a2a'];
  c.agregar(new THREE.IcosahedronGeometry(0.12 * esc, 0), { color: verdes[k % 3], tipo: 4, variar: 0.12,
    matriz: matriz([x, y + 0.06 * esc, z], [k * 0.4, k * 1.7, 0], [1.1, 0.75, 1.1]) });
  for (let j = 0; j < 3; j++) {
    const a = k * 2.1 + j * 2.09, r = 0.07 * esc;
    c.agregar(new THREE.IcosahedronGeometry(0.048 * esc, 0), { color: f.colores[(k + j) % f.colores.length], tipo: 4, variar: 0.08,
      matriz: matriz([x + Math.cos(a) * r, y + (0.15 + (j % 2) * 0.04) * esc, z + Math.sin(a) * r], [a, 0, 0], [1, 0.7, 1]) });
  }
  if (k % 3 === 0) c.agregar(new THREE.IcosahedronGeometry(0.02 * esc, 0), { color: f.centro, tipo: 4, variar: 0,
    matriz: matriz([x + Math.cos(k * 2.1) * 0.07 * esc, y + 0.185 * esc, z + Math.sin(k * 2.1) * 0.07 * esc]) });
}

for (const pieza of PIEZAS) {
  PLANOS.push({
    ...pieza,
    ancho: pieza.ancho ?? pieza.radio * 2, fondo: pieza.fondo ?? pieza.radio * 2, alto: pieza.alto ?? 1,
    etapas: [{ nombre: 'Armarlo', pide: pieza.pide, dice: pieza.texto, termina: true, arma: pieza.arma }],
  });
}

// Catálogo premium: el panel no mezcla edificios, utilitarios y mobiliario en
// una única hilera. Mantener la categoría en los datos del plano también deja
// abierta la puerta a desbloqueos/progresión sin tocar la física.
const CATEGORIA_POR_PLANO = {
  puesto: 'refugios', casilla: 'refugios', 'piso-modular': 'refugios', 'pared-modular': 'refugios', 'pared-puerta': 'refugios', 'pared-ventana': 'refugios', 'pared-marco': 'refugios', 'pared-media': 'refugios', 'pared-ventana-ancha': 'refugios', 'tabique-interior': 'refugios', 'tabique-puerta': 'refugios', 'techo-modular': 'refugios', 'techo-una-agua': 'refugios', 'techo-plano': 'refugios', 'pilar-esquina': 'refugios', 'entrepiso-modular': 'refugios', 'entrepiso-escalera': 'refugios',
  galponcito: 'trabajo', cobertizo: 'trabajo', 'banco-trabajo': 'trabajo', lena: 'trabajo', acopio: 'trabajo', cantero: 'trabajo', gallinero: 'trabajo', telar: 'trabajo', colmena: 'trabajo', ahumadero: 'trabajo', vivero: 'trabajo', lenera: 'trabajo',
  'foso-estacas': 'defensa', 'porton-reforzado': 'defensa',
  mirador: 'exterior', fogon: 'exterior', tendal: 'exterior', pasarela: 'exterior', cerco: 'exterior', 'escalera-modular': 'exterior', 'escalera-nivel': 'exterior', 'baranda-modular': 'exterior',
  banco: 'mobiliario', 'mesa-campo': 'mobiliario', estante: 'mobiliario', 'catre-campo': 'mobiliario', 'silla-campo': 'mobiliario', 'farol-interior': 'mobiliario', 'estufa-hierro': 'mobiliario', 'alfombra-lana': 'mobiliario',
};
export const CATEGORIAS_CONSTRUCCION = [
  { clave: 'refugios', nombre: 'Refugios', texto: 'Construcciones cerradas para hacer base en el bosque.' },
  { clave: 'trabajo', nombre: 'Trabajo', texto: 'Talleres, almacenamiento y herramientas de campo.' },
  { clave: 'exterior', nombre: 'Exterior', texto: 'Miradores, fuego, pasos y delimitación del terreno.' },
  { clave: 'mobiliario', nombre: 'Mobiliario', texto: 'Piezas para terminar y habitar tus propios espacios.' },
  { clave: 'defensa', nombre: 'Defensa', texto: 'Empalizadas, pircas, trampas y ballestas contra los invasores.', soloDesafio: true },
];
for (const p of PLANOS) {
  p.categoria = p.categoria || CATEGORIA_POR_PLANO[p.id] || 'exterior';
  p.rotPaso = p.rotPaso || Math.PI / 4;
  p.distancia = p.distancia || (p.pieza ? 2.4 : 5.5);
  if (p.id === 'puesto') p.habitable = true;
  if (p.id === 'banco') p.apoyaEnPlataforma = true;
}

export const PLANO = Object.fromEntries(PLANOS.map((p) => [p.id, p]));

export const MATERIALES = {
  tronco: { nombre: 'troncos', de: 'talar un árbol con el hacha (H, tres hachazos)' },
  tabla: { nombre: 'tablas', de: 'aserrar un tronco con Y (a mano 2, en el banco 4)' },
  piedra: { nombre: 'piedras', de: 'picar un pedrero con el hacha (H)' },
  cristal: { nombre: 'cristales', de: 'los invasores abatidos' },
  lana: { nombre: 'vellones de lana', de: 'esquilar una oveja en el corral del galpón (E, con la tijera)' },
};

export function faltan(pide, materiales) {
  const falta = [];
  for (const [k, n] of Object.entries(pide)) {
    const hay = materiales[k] || 0;
    if (hay < n) falta.push(`${n - hay} ${MATERIALES[k].nombre}`);
  }
  return falta;
}

// ---------------------------------------------------------------- el sistema
export function crearConstruccion(T, escena, col, veg, interacciones = null) {
  const mat = materialVegetal({ flex: 0 });
  const matFantasma = new THREE.MeshLambertMaterial({ color: 0x8ad48a, transparent: true, opacity: 0.35, depthWrite: false });
  const grupo = new THREE.Group();
  escena.add(grupo);
  const obras = [];          // { datos, malla, grupo }
  const indiceObras = crearIndiceEspacial2D(8);
  const consultaObras = [];
  const reindexarObras = () => indiceObras.reconstruir(obras, (o) => o.datos);
  const obrasCerca = (pos, radio, salida = consultaObras) => indiceObras.consultar(pos.x, pos.z, radio, salida);
  let fantasma = null, planoElegido = null, giroFantasma = 0, rotacionFantasma = null;
  let ultimoEstado = null, snapActivo = true, edicion = null;

  function geometriaDe(plano, etapasHechas, datos = null) {
    const c = new Constructor();
    // 2.8: se anota qué pieza armó cada tramo de vértices (estilo-casa.js), para pintar
    // paredes, aberturas y techos de tus casas y la madera del fortín con lo elegido en
    // "Personalizar". Armar sigue siendo exactamente igual.
    const marcas = marcarConstructor(c);
    const suelo = sueloDe(plano, datos);   // 3.0.1: ver calces.js
    for (let i = 0; i < etapasHechas; i++) { marcas.etapa = plano.etapas[i].nombre || ''; plano.etapas[i].arma(c, plano, datos, suelo); }
    if (etapasHechas >= plano.etapas.length) adornarFortin(c, plano, marcas);
    const g = c.geometria();
    estilizar(g, plano, datos, marcas);
    return g;
  }

  // 3.0.1: la altura del terreno bajo un punto de la obra, desde su pie (ver calces.js). Sólo
  // para lo que se apoya en el terreno: sobre un piso propio o sobre el agua no hay suelo que
  // alcanzar, y sin posición (el fantasma) tampoco.
  function sueloDe(plano, datos) {
    if (!datos || plano.sobreAgua || !Number.isFinite(datos.x) || !Number.isFinite(datos.z) || !Number.isFinite(datos.y)) return null;
    const terreno = T.altura(datos.x, datos.z);
    if (datos.y > terreno + 0.12) {
      if (plano.apoyaEnPlataforma) return null;
      const p = col.plataformaEn?.(datos.x, datos.z, datos.y + 0.05, 0.1);
      if (p && Math.abs(p.alto - datos.y) < 0.15) return null;
    }
    const r = datos.rot || 0, co = Math.cos(r), si = Math.sin(r), x0 = datos.x, z0 = datos.z, y0 = datos.y;
    return (lx, lz) => T.altura(x0 + lx * co + lz * si, z0 - lx * si + lz * co) - y0;
  }

  // 2.8: lo que el estilo del fortín le suma a una defensa terminada: el pie de pirca y el
  // estandarte. Sólo se ve: la física y la vida de la pieza no cambian.
  function adornarFortin(c, plano, marcas) {
    if (plano.categoria !== 'defensa') return;
    const f = ESTILO.fortin || {};
    marcas.zona = 'adorno';
    if (f.madera === 'pirca') {
      const tramos = Object.hasOwn(PIE_PIRCA, plano.id) ? PIE_PIRCA[plano.id]
        : plano.id === 'torre-vigia' ? POSTES_TORRE.map(([x, z]) => [x - 0.2, z, x + 0.2, z]) : [];
      let k = 0;
      for (const [ax, az, bx, bz] of tramos) {
        const largo = Math.hypot(bx - ax, bz - az) || 1, n = Math.max(2, Math.round(largo / 0.3));
        const nx = -(bz - az) / largo, nz = (bx - ax) / largo;
        for (let i = 0; i < n; i++, k++) {
          const t = (i + 0.5) / n, lado = (k % 2 ? 1 : -1) * 0.15;
          const x = ax + (bx - ax) * t + nx * lado, z = az + (bz - az) * t + nz * lado;
          c.agregar(new THREE.IcosahedronGeometry(0.27, 0), { color: [PIEDRA, '#6c665d', '#8a857b'][k % 3], tipo: 4, variar: 0.16,
            matriz: matriz([x, 0.12, z], [k * 0.7, k * 1.3, 0.2], [1.25, 0.75, 1.05]) });
          if (k % 2 === 0) c.agregar(new THREE.IcosahedronGeometry(0.21, 0), { color: ['#77736b', PIEDRA][k % 4 ? 1 : 0], tipo: 4, variar: 0.16,
            matriz: matriz([x - nx * lado * 0.7, 0.4, z - nz * lado * 0.7], [k, k * 0.5, 0], [1.2, 0.72, 1.0]) });
        }
      }
    }
    if (/^#[0-9a-f]{6}$/i.test(f.estandarte || '') && Object.hasOwn(ESTANDARTE_EN, plano.id)) {
      const e = ESTANDARTE_EN[plano.id], lado = e.lado || 1;
      c.agregar(new THREE.CylinderGeometry(0.03, 0.036, e.alto, 6), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([e.x, e.y0 + e.alto / 2, e.z]) });
      c.agregar(new THREE.IcosahedronGeometry(0.05, 0), { color: '#8a6a3c', tipo: 4, matriz: matriz([e.x, e.y0 + e.alto + 0.03, e.z]) });
      const y = e.y0 + e.alto - 0.3, cx = e.x + lado * 0.37;
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(f.estandarte.slice(i, i + 2), 16));
      const guarda = r * 0.3 + g * 0.59 + b * 0.11 > 150 ? '#2a2723' : '#e8e2d6';
      c.agregar(new THREE.BoxGeometry(0.68, 0.44, 0.025), { color: f.estandarte, tipo: 0, variar: 0.05, matriz: matriz([cx, y, e.z]) });
      c.agregar(new THREE.BoxGeometry(0.68, 0.06, 0.032), { color: guarda, tipo: 0, variar: 0.04, matriz: matriz([cx, y - 0.15, e.z]) });
      // la cola en dos puntas, como los banderines de a caballo
      for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.2, 0.15, 0.025), { color: f.estandarte, tipo: 0, variar: 0.05,
        matriz: matriz([cx + lado * 0.4, y + s * 0.13, e.z], [0, 0, -s * lado * 0.35]) });
    }
    marcas.zona = null;
  }

  // 2.8: pinta los colores por vértice según el estilo: la paleta de la casa (o la propia
  // de la obra) en las paredes, las aberturas y el techo; la madera del fortín si va pintada.
  function estilizar(g, plano, datos, marcas) {
    const attr = g.getAttribute('color');
    if (!attr) return;
    if (plano.categoria === 'refugios') {
      const p = pinturaDeObra(plano, datos);
      if (!p) return;
      const zonas = rangosPorZona(marcas, (m) => zonaCasa(plano, m.etapa, m.color));
      for (const z of ['pared', 'aberturas', 'techo']) if (p[z] && zonas[z]) pintarRangos(attr.array, zonas[z], p[z]);
      attr.needsUpdate = true;
    } else if (plano.categoria === 'defensa' && ESTILO.fortin?.madera === 'pintada') {
      const zonas = rangosPorZona(marcas, (m) => (m.zona === 'adorno' ? null : zonaFortin(plano, m.color)));
      if (zonas.madera) pintarRangos(attr.array, zonas.madera, ESTILO.fortin.pintura, 0.72);
      attr.needsUpdate = true;
    }
  }

  // 2.8: las hojas de puerta, los postigos y el portón de la obra, con el color de sus
  // aberturas (o el de la madera pintada del fortín). Se llama después de colgarlas.
  function pintarPuertasObra(obra) {
    if (!interacciones?.lista) return;
    let hex = null;
    if (obra.plano.categoria === 'refugios') hex = pinturaDeObra(obra.plano, obra.datos)?.aberturas || null;
    else if (obra.plano.categoria === 'defensa' && ESTILO.fortin?.madera === 'pintada') hex = ESTILO.fortin.pintura;
    if (!hex) return;
    for (const p of interacciones.lista) if (p.duenio === obra && p.g) pintarHoja(p.g, hex);
  }

  // Una obra recién fundada ya se ve: cuatro estacas y dos diagonales marcan
  // su huella. Antes la etapa 0 era invisible y daba la sensación de que Y no
  // había hecho nada hasta gastar los primeros materiales.
  function geometriaMarcado(plano) {
    const c = new Constructor();
    const W = Math.max(1.2, plano.ancho || plano.radio * 1.5), D = Math.max(1.2, plano.fondo || plano.radio * 1.5);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.agregar(new THREE.CylinderGeometry(0.035, 0.045, 0.52, 5), {
      color: '#9a7b4f', tipo: 4, matriz: matriz([sx * W * 0.42, 0.25, sz * D * 0.42]) });
    c.agregar(new THREE.BoxGeometry(W * 0.84, 0.025, 0.025), { color: '#bba77d', tipo: 4, matriz: matriz([0, 0.46, -D * 0.42]) });
    c.agregar(new THREE.BoxGeometry(W * 0.84, 0.025, 0.025), { color: '#bba77d', tipo: 4, matriz: matriz([0, 0.46, D * 0.42]) });
    return c.geometria();
  }

  function baseColocacion(x, z, plano, alturaReferencia = null) {
    const suelo = T.altura(x, z);
    if (!plano?.apoyaEnPlataforma || !col.plataformaEn) return suelo;
    // Busca una superficie construida cercana por encima del terreno. Esto
    // permite colocar mesa/estante/banco de carpintero dentro de tus refugios
    // sin que queden enterrados debajo del entablonado.
    const referencia = Number.isFinite(alturaReferencia) ? alturaReferencia : suelo + 2.6;
    const subida = Number.isFinite(alturaReferencia) ? 0.78 : 2.6;
    const p = col.plataformaEn(x, z, referencia + 0.18, subida);
    return p && p.alto > suelo + 0.12 && p.alto < referencia + subida + 0.24 ? p.alto : suelo;
  }

  function cuantizarAngulo(a, paso) {
    const p = paso || Math.PI / 4;
    return Math.round(a / p) * p;
  }

  function anguloFantasma(yaw = 0) {
    if (rotacionFantasma === null) rotacionFantasma = cuantizarAngulo(yaw, planoElegido?.rotPaso || Math.PI / 4);
    return rotacionFantasma;
  }

  function mundoDesdeLocal(x, z, rot, lx, lz) {
    return { x: x + lx * Math.cos(rot) + lz * Math.sin(rot), z: z - lx * Math.sin(rot) + lz * Math.cos(rot) };
  }


  function diferenciaEje(a, b) {
    const d = a - b;
    return Math.abs(Math.atan2(Math.sin(d * 2), Math.cos(d * 2))) / 2;
  }

  function extremosLinea(x, z, rot, largo) {
    const h = largo / 2;
    return [mundoDesdeLocal(x, z, rot, -h, 0), mundoDesdeLocal(x, z, rot, h, 0)];
  }

  function cotaSuperiorPiso(obra) {
    return obra.datos.y + (obra.plano.cotaPlataforma ?? 0.285);
  }

  // El snap es deliberadamente geométrico y no una grilla global: cada familia
  // sabe con qué se conecta. Así los cercos no atraen pasarelas y una pared
  // modular puede buscar tanto otra pared como el borde correcto de un piso.
  function anguloMasCercano(actual, candidatos) {
    let mejor = candidatos[0], d0 = Infinity;
    for (const a of candidatos) {
      const d = Math.abs(Math.atan2(Math.sin(a - actual), Math.cos(a - actual)));
      if (d < d0) { d0 = d; mejor = a; }
    }
    return cuantizarAngulo(mejor, Math.PI / 4);
  }

  function resolverSnap(x, z, plano, rot, ignorarObra = null) {
    const cfg = plano?.snap;
    if (!snapActivo || !cfg) return { x, z, rot, snap: null };
    let mejor = null;
    const considerar = (cx, cz, descripcion, max = cfg.umbral ?? 1.0, crot = rot, cbase = null) => {
      const d = Math.hypot(cx - x, cz - z);
      const dg = Math.abs(Math.atan2(Math.sin(crot - rot), Math.cos(crot - rot)));
      const nivel = Number.isFinite(cbase) ? cbase : null;
      const penalNivel = ignorarObra && nivel !== null ? Math.abs(nivel - (ignorarObra.datos.y ?? nivel)) * 0.06 : 0;
      const puntaje = d + dg * 0.025 + penalNivel;
      if (d > max) return;
      if (mejor && puntaje > mejor.puntaje + 1e-5) return;
      if (mejor && Math.abs(puntaje - mejor.puntaje) <= 1e-5 && !ignorarObra && (nivel ?? -Infinity) <= (mejor.base ?? -Infinity)) return;
      mejor = { x: cx, z: cz, rot: crot, base: nivel, d, puntaje, descripcion };
    };

    for (const o of obras) {
      if (o === ignorarObra || o.datos.etapas < o.plano.etapas.length) continue;
      const otro = o.plano.snap;
      if (!otro) continue;

      if ((cfg.tipo === 'linea' || cfg.tipo === 'muro' || cfg.tipo === 'baranda') &&
          (otro.tipo === 'linea' || otro.tipo === 'muro' || otro.tipo === 'baranda') && cfg.familia === otro.familia) {
        const propios = extremosLinea(0, 0, rot, cfg.largo);
        const ajenos = extremosLinea(o.datos.x, o.datos.z, o.datos.rot, otro.largo);
        for (const a of propios) for (const b of ajenos) considerar(b.x - a.x, b.z - a.z,
          cfg.tipo === 'muro' ? 'encastre con pared' : cfg.tipo === 'baranda' ? 'encastre con baranda' : `encastre ${cfg.familia}`);
      }

      if (cfg.tipo === 'piso' && otro.tipo === 'piso' && cfg.familia === otro.familia) {
        const paso = (cfg.paso + otro.paso) / 2;
        for (const [lx, lz] of [[paso,0],[-paso,0],[0,paso],[0,-paso]]) {
          const q = mundoDesdeLocal(o.datos.x, o.datos.z, o.datos.rot, lx, lz);
          considerar(q.x, q.z, 'encastre con piso');
        }
      }

      if ((cfg.tipo === 'muro' || cfg.tipo === 'baranda') && (otro.tipo === 'piso' || otro.tipo === 'entrepiso') && cfg.pisoFamilia === otro.familia) {
        const hx = Math.max(0.5, (o.plano.ancho || 3) / 2 - 0.08);
        const hz = Math.max(0.5, (o.plano.fondo || 3) / 2 - 0.08);
        const bordes = [
          { lx: 0, lz: -hz, ang: o.datos.rot }, { lx: 0, lz: hz, ang: o.datos.rot },
          { lx: -hx, lz: 0, ang: o.datos.rot + Math.PI / 2 }, { lx: hx, lz: 0, ang: o.datos.rot + Math.PI / 2 },
        ];
        for (const b of bordes) {
          if (diferenciaEje(rot, b.ang) > 0.80) continue;
          const q = mundoDesdeLocal(o.datos.x, o.datos.z, o.datos.rot, b.lx, b.lz);
          const ar = anguloMasCercano(rot, [b.ang, b.ang + Math.PI]);
          considerar(q.x, q.z, cfg.tipo === 'baranda' ? 'baranda al borde del piso' : 'encastre al borde del piso', cfg.umbral, ar, cotaSuperiorPiso(o));
        }
      }

      if (cfg.tipo === 'techo' && (otro.tipo === 'piso' || otro.tipo === 'entrepiso') && cfg.pisoFamilia === otro.familia) {
        if (diferenciaEje(rot, o.datos.rot) <= 0.80) {
          const ar = anguloMasCercano(rot, [o.datos.rot, o.datos.rot + Math.PI]);
          considerar(o.datos.x, o.datos.z, 'techo centrado sobre el piso', cfg.umbral, ar, cotaSuperiorPiso(o) + (plano.elevacion || 0));
        }
      }

      if (cfg.tipo === 'entrepiso' && (otro.tipo === 'piso' || otro.tipo === 'entrepiso') && cfg.pisoFamilia === otro.familia) {
        if (diferenciaEje(rot, o.datos.rot) <= 0.80) {
          const ar = anguloMasCercano(rot, [o.datos.rot, o.datos.rot + Math.PI]);
          considerar(o.datos.x, o.datos.z, 'entrepiso centrado sobre el módulo', cfg.umbral, ar, cotaSuperiorPiso(o) + (plano.elevacion || 0));
        }
      }

      if (cfg.tipo === 'pilar' && (otro.tipo === 'piso' || otro.tipo === 'entrepiso') && cfg.pisoFamilia === otro.familia) {
        const hx = Math.max(0.5, (o.plano.ancho || 3) / 2 - 0.11);
        const hz = Math.max(0.5, (o.plano.fondo || 3) / 2 - 0.11);
        for (const [lx, lz] of [[-hx,-hz],[hx,-hz],[-hx,hz],[hx,hz]]) {
          const q = mundoDesdeLocal(o.datos.x, o.datos.z, o.datos.rot, lx, lz);
          considerar(q.x, q.z, 'pilar en esquina estructural', cfg.umbral, o.datos.rot, cotaSuperiorPiso(o));
        }
      }

      if (cfg.tipo === 'escalera-nivel' && otro.tipo === 'entrepiso' && o.plano.huecoEscalera && cfg.pisoFamilia === otro.familia) {
        if (diferenciaEje(rot, o.datos.rot) <= 0.80) {
          const ar = anguloMasCercano(rot, [o.datos.rot, o.datos.rot + Math.PI]);
          const baseEscalera = o.datos.y - (cfg.desnivel || 2.28);
          considerar(o.datos.x, o.datos.z, 'escalera alineada al hueco del entrepiso', cfg.umbral, ar, baseEscalera);
        }
      }

      if (cfg.tipo === 'acceso' && otro.tipo === 'piso' && cfg.pisoFamilia === otro.familia) {
        const hx = Math.max(0.5, (o.plano.ancho || 3) / 2 - 0.08);
        const hz = Math.max(0.5, (o.plano.fondo || 3) / 2 - 0.08);
        const d = (cfg.profundidad || plano.fondo || 1.6) / 2 + 0.03;
        const accesos = [
          { lx: 0, lz: -hz - d, ang: o.datos.rot },
          { lx: 0, lz: hz + d, ang: o.datos.rot + Math.PI },
          { lx: -hx - d, lz: 0, ang: o.datos.rot + Math.PI / 2 },
          { lx: hx + d, lz: 0, ang: o.datos.rot - Math.PI / 2 },
        ];
        for (const a of accesos) {
          const q = mundoDesdeLocal(o.datos.x, o.datos.z, o.datos.rot, a.lx, a.lz);
          // 3.0.1: el último peldaño (0,29) queda a ras del piso, aunque el suelo baje
          considerar(q.x, q.z, 'escalera alineada al piso', cfg.umbral, cuantizarAngulo(a.ang, Math.PI / 4), cotaSuperiorPiso(o) - 0.29);
        }
      }
    }
    return mejor ? { x: mejor.x, z: mejor.z, rot: mejor.rot, base: mejor.base, snap: { activo: true, descripcion: mejor.descripcion, distancia: mejor.d } }
      : { x, z, rot, base: null, snap: null };
  }

  function solapanHuellas(a, ax, az, ar, b, bx, bz, br, margen = 0.055) {
    const ahx = Math.max(0.04, (a.ancho || a.radio * 1.4) / 2);
    const ahz = Math.max(0.04, (a.fondo || a.radio * 1.4) / 2);
    const bhx = Math.max(0.04, (b.ancho || b.radio * 1.4) / 2);
    const bhz = Math.max(0.04, (b.fondo || b.radio * 1.4) / 2);
    const au = [Math.cos(ar), -Math.sin(ar)], av = [Math.sin(ar), Math.cos(ar)];
    const bu = [Math.cos(br), -Math.sin(br)], bv = [Math.sin(br), Math.cos(br)];
    const dx = bx - ax, dz = bz - az;
    for (const eje of [au, av, bu, bv]) {
      const dist = Math.abs(dx * eje[0] + dz * eje[1]);
      const ra = ahx * Math.abs(au[0]*eje[0] + au[1]*eje[1]) + ahz * Math.abs(av[0]*eje[0] + av[1]*eje[1]);
      const rb = bhx * Math.abs(bu[0]*eje[0] + bu[1]*eje[1]) + bhz * Math.abs(bv[0]*eje[0] + bv[1]*eje[1]);
      if (dist >= ra + rb - margen) return false;
    }
    return true;
  }

  function solapePermitido(a, b) {
    const aLista = a?.permiteSolapeCon || [], bLista = b?.permiteSolapeCon || [];
    const af = a?.snap?.familia, bf = b?.snap?.familia;
    return aLista.includes(b?.id) || (bf && aLista.includes(bf)) ||
      bLista.includes(a?.id) || (af && bLista.includes(af));
  }

  function solapeVertical(a, ay, b, by, margen = 0.045) {
    const amin = ay + (a?.solapeYMin ?? 0), amax = ay + (a?.solapeYMax ?? a?.alto ?? 1);
    const bmin = by + (b?.solapeYMin ?? 0), bmax = by + (b?.solapeYMax ?? b?.alto ?? 1);
    return Math.min(amax, bmax) - Math.max(amin, bmin) > margen;
  }

  const TIPOS_LINEALES = new Set(['linea', 'muro', 'baranda']);   // 2.6.1: uno solo, no uno por consulta
  function contactoLinealValido(a, ax, az, ar, b, bx, bz, br) {
    const tipos = TIPOS_LINEALES;
    if (!tipos.has(a?.snap?.tipo) || !tipos.has(b?.snap?.tipo) || !a.snap.largo || !b.snap.largo) return false;
    const ea = extremosLinea(ax, az, ar, a.snap.largo), eb = extremosLinea(bx, bz, br, b.snap.largo);
    const tolerancia = Math.max(0.20, ((a.fondo || 0.18) + (b.fondo || 0.18)) * 0.72);
    return ea.some((p) => eb.some((q) => Math.hypot(p.x - q.x, p.z - q.z) <= tolerancia));
  }

  function encuentroCubiertaValido(a, ax, az, ar, ay, b, bx, bz, br, by) {
    if (a?.snap?.familia !== 'modular-techo' || b?.snap?.familia !== 'modular-techo') return false;
    if (Math.abs(ay - by) > 0.16 || diferenciaEje(ar, br) > 0.20) return false;
    const dx = bx - ax, dz = bz - az, c = Math.cos(ar), si = Math.sin(ar);
    const lx = dx * c - dz * si, lz = dx * si + dz * c;
    const pasoX = 3.0, pasoZ = 3.0;
    const vecinoX = Math.abs(Math.abs(lx) - pasoX) < 0.34 && Math.abs(lz) < 0.34;
    const vecinoZ = Math.abs(Math.abs(lz) - pasoZ) < 0.34 && Math.abs(lx) < 0.34;
    return vecinoX || vecinoZ;
  }

  function muestrasHuella(x, z, plano, rot) {
    const hw = Math.max(0.45, (plano.ancho || plano.radio * 1.5) / 2 * 0.88);
    const hd = Math.max(0.45, (plano.fondo || plano.radio * 1.5) / 2 * 0.88);
    const locales = [[0,0],[-hw,-hd],[hw,-hd],[-hw,hd],[hw,hd],[0,-hd],[0,hd],[-hw,0],[hw,0]];
    return locales.map(([lx,lz]) => mundoDesdeLocal(x,z,rot,lx,lz));
  }

  function soporteVerticalNivel(x, z, rot, soporteY, ignorarObra = null) {
    const paredes = new Set(), pilares = new Set();
    const hx = 1.42, hz = 1.42;
    const c = Math.cos(rot), si = Math.sin(rot);
    for (const o of obras) {
      if (o === ignorarObra || !o.plano.soporteVertical || o.datos.etapas < o.plano.etapas.length) continue;
      if (Math.abs((o.datos.y ?? 0) - soporteY) > 0.24) continue;
      const dx = o.datos.x - x, dz = o.datos.z - z;
      const lx = dx * c - dz * si, lz = dx * si + dz * c;
      if (o.plano.id === 'pilar-esquina') {
        if (Math.abs(Math.abs(lx) - hx) < 0.34 && Math.abs(Math.abs(lz) - hz) < 0.34)
          pilares.add(`${lx < 0 ? -1 : 1},${lz < 0 ? -1 : 1}`);
        continue;
      }
      if (o.plano.snap?.familia !== 'modular-muro') continue;
      if (Math.abs(lx) < 0.58 && Math.abs(Math.abs(lz) - hz) < 0.34 && diferenciaEje(o.datos.rot || 0, rot) < 0.30)
        paredes.add(lz < 0 ? 'n' : 's');
      if (Math.abs(lz) < 0.58 && Math.abs(Math.abs(lx) - hx) < 0.34 && diferenciaEje(o.datos.rot || 0, rot + Math.PI / 2) < 0.30)
        paredes.add(lx < 0 ? 'o' : 'e');
    }
    const opuestas = (paredes.has('n') && paredes.has('s')) || (paredes.has('o') && paredes.has('e'));
    const ok = opuestas || paredes.size >= 3 || pilares.size >= 4 || (paredes.size >= 2 && pilares.size >= 2);
    return { ok, paredes: paredes.size, pilares: pilares.size, opuestas };
  }

  // 3.0.1: ¿hay un piso modular tuyo, terminado, bajo (x, z) a la cota `y`?
  function pisoPropioEn(x, z, y, ignorarObra = null) {
    return obras.some((o) => {
      if (o === ignorarObra || !o.plano.soportaPiezas || o.datos.etapas < o.plano.etapas.length) return false;
      if (Math.abs(cotaSuperiorPiso(o) - y) > 0.2) return false;
      const rot = o.datos.rot || 0, dx = x - o.datos.x, dz = z - o.datos.z;
      const lx = dx * Math.cos(rot) - dz * Math.sin(rot), lz = dx * Math.sin(rot) + dz * Math.cos(rot);
      return Math.abs(lx) <= (o.plano.ancho || 3) / 2 + 0.3 && Math.abs(lz) <= (o.plano.fondo || 3) / 2 + 0.3;
    });
  }

  function huecoEscaleraValido(x, z, rot, base, ignorarObra = null) {
    return obras.some((o) => o !== ignorarObra && o.plano.huecoEscalera && o.datos.etapas >= o.plano.etapas.length &&
      Math.hypot(o.datos.x - x, o.datos.z - z) < 0.32 && diferenciaEje(o.datos.rot || 0, rot) < 0.30 &&
      Math.abs(o.datos.y - (base + 2.28)) < 0.24);
  }

  // ¿se puede fundar acá? La revisión usa la huella real y la rotación del
  // plano. La versión anterior muestreaba siempre un cuadrado fijo de 6x7 m,
  // por lo que una pieza chica y un cobertizo grande recibían la misma prueba.
  function revisarSitio(x, z, plano, rot = 0, ignorarObra = null, baseObjetivo = null, alturaReferencia = null) {
    if (!plano) return { ok: false, motivo: 'Elegí un plano primero' };
    // 3.6.1: donde no se construye (en el Relax, la Aldea de los Duendes: ver main.js)
    const reservado = typeof T.sinObras === 'function' ? T.sinObras(x, z, plano.radio || 1) : null;
    if (reservado) return { ok: false, motivo: reservado };
    const pieza = !!plano.pieza;
    const soporte = baseColocacion(x, z, plano, alturaReferencia);
    const base = Number.isFinite(baseObjetivo) ? baseObjetivo : soporte + (plano.elevacion || 0);
    const soporteReal = Number.isFinite(baseObjetivo) ? baseObjetivo - (plano.elevacion || 0) : soporte;
    // 3.0.1: también sobre un piso tuyo aunque el terreno lo alcance (el borde de arriba de un
    // piso en la ladera): antes ahí no se podía poner la baranda ni el pilar
    const sobrePlataforma = soporteReal > T.altura(x, z) + 0.12 || (!!plano.apoyaEnPlataforma && pisoPropioEn(x, z, soporteReal, ignorarObra));
    if (plano.requierePlataforma && !sobrePlataforma) return { ok: false, motivo: 'Necesita apoyarse en un piso construido' };
    // 3.0.1: un techo, además, sobre un piso tuyo: antes se podía levantar sobre cualquier
    // tablado (el andén, un muelle, el mirador) y quedaba flotando a dos metros sin paredes
    if (plano.requierePlataforma && plano.elevacion && !pisoPropioEn(x, z, soporteReal, ignorarObra)) return { ok: false, motivo: 'Necesita apoyarse en un piso construido' };
    if (plano.requiereSoporteVertical) {
      const soporteEstructural = soporteVerticalNivel(x, z, rot, soporteReal, ignorarObra);
      if (!soporteEstructural.ok) return { ok: false, motivo: 'El entrepiso necesita paredes opuestas, tres lados armados o cuatro pilares' };
    }
    if (plano.requiereHuecoEscalera && !huecoEscaleraValido(x, z, rot, base, ignorarObra))
      return { ok: false, motivo: 'Necesita encastrarse con un entrepiso con hueco de escalera' };
    const muestras = muestrasHuella(x, z, plano, rot);

    // 2.4: el embarcadero se mide por sus dos puntas, no por su centro
    if (plano.sobreAgua) {
      const media = (plano.fondo || 5) / 2 - 0.2;
      const punto = (lz) => ({ x: x + lz * Math.sin(rot), z: z + lz * Math.cos(rot) });
      const tierra = punto(-media), punta = punto(media);
      // lo mismo que pide el kayak para andar (kayak.js): el agua honda del lago
      const hondo = (q) => T.agua(q.x, q.z) && T.altura(q.x, q.z) < -0.35 && Math.hypot(q.x - LAGO.x, q.z - LAGO.z) < 220;
      if (hondo(tierra) && !T.agua(punta.x, punta.z)) return { ok: false, motivo: 'Girala: la punta va hacia el agua (R)' };
      if (T.agua(tierra.x, tierra.z)) return { ok: false, motivo: 'El arranque tiene que quedar en la orilla' };
      if (!hondo(punta)) return { ok: false, motivo: 'La punta tiene que llegar al agua honda del lago' };
      // 2.4.1: el kayak se amarra al costado de la punta (main.js, puntoAmarre): uno de los
      // dos lados tiene que estar hondo, o el embarcadero queda sin kayak
      const amarre = (lx) => ({ x: x + lx * Math.cos(rot) + (media - 0.7) * Math.sin(rot), z: z - lx * Math.sin(rot) + (media - 0.7) * Math.cos(rot) });
      if (!hondo(amarre(1.35)) && !hondo(amarre(-1.35))) return { ok: false, motivo: 'La punta tiene que llegar al agua honda del lago' };
      for (const o of obras) {
        if (o === ignorarObra || o.datos.etapas <= 0) continue;
        if (Math.hypot(o.datos.x - x, o.datos.z - z) < (plano.separacion || 6) && o.plano.id === plano.id) return { ok: false, motivo: 'Ya pusiste uno acá al lado' };
        // 2.4.1: tampoco atraviesa lo que ya armaste en la orilla
        if (o.plano.pieza && solapanHuellas(plano, x, z, rot, o.plano, o.datos.x, o.datos.z, o.datos.rot || 0)) return { ok: false, motivo: 'Se superpone con otra pieza' };
      }
      // ni el muelle del valle ni los edificios del mundo
      for (const clave of Object.keys(T.lugares)) {
        const l = T.lugares[clave];
        if (!l || typeof l.x !== 'number') continue;
        if (Math.hypot(l.x - x, l.z - z) < plano.radio + Math.max(4, l.radio || 8)) return { ok: false, motivo: 'Muy pegado a otra construcción' };
      }
      return { ok: true, base: Math.max(0.12, T.altura(tierra.x, tierra.z)), sobrePlataforma: false };
    }

    // 2.9: un plano puede pedirle algo más al lugar (el molino de agua: la rueda en el arroyo)
    if (typeof plano.revisarLugar === 'function') { const q = plano.revisarLugar({ T, x, z, rot, base, sobrePlataforma }); if (q && !q.ok) return q; }

    // 2.4: lo que tiene escalera hasta el suelo (el adarve): el pie no puede quedar
    // colgando ni enterrado, o no se sube
    // 3.0.1: también con el pie fuera del eje (`lx`, la torre) y con la base dada por el
    // encastre (`conBase`: la escalera de acceso de un piso en la ladera)
    if (plano.pieEscalera && (!sobrePlataforma || (plano.pieEscalera.conBase && Number.isFinite(baseObjetivo)))) {
      const { lz, lx = 0 } = plano.pieEscalera;
      const px = x + lx * Math.cos(rot) + lz * Math.sin(rot), pz = z - lx * Math.sin(rot) + lz * Math.cos(rot);
      if (Math.abs(T.altura(px, pz) - base) > plano.pieEscalera.tolerancia) return { ok: false, motivo: 'La escalera quedaría colgando: buscá un lugar más parejo' };
    }

    if (!sobrePlataforma) {
      if (T.agua(x, z)) return { ok: false, motivo: 'Está mojado' };
      const n = T.normal(x, z);
      const maxPend = plano.pendienteMax ?? (pieza ? 0.45 : 0.30);
      if (Math.acos(clamp(n.y, -1, 1)) > maxPend) return { ok: false, motivo: 'Demasiada pendiente' };
    }

    const k = T.indice(x, z);
    const minRiel = plano.distRiel ?? (pieza ? 6 : Math.max(12, plano.radio + 7));
    if (T.distRiel[k] < minRiel) return { ok: false, motivo: 'Muy cerca de la vía' };
    const minSendero = plano.distSendero ?? (pieza ? 1.0 : 2.8);
    if (T.distSendero[k] < minSendero) return { ok: false, motivo: 'Justo sobre el sendero' };

    // Piezas apoyadas sobre un piso propio pueden vivir dentro del edificio.
    // En el suelo, en cambio, se sigue comprobando agua/desnivel y separación.
    if (!sobrePlataforma) {
      let desnivel = 0;
      const y0 = T.altura(x, z);
      for (const q of muestras) {
        if (T.agua(q.x, q.z)) return { ok: false, motivo: 'Una parte queda en el agua' };
        desnivel = Math.max(desnivel, Math.abs(T.altura(q.x, q.z) - y0));
      }
      const limite = plano.desnivelMax ?? (pieza ? Math.max(0.55, plano.radio * 0.20) : Math.max(0.85, plano.radio * 0.18));
      if (desnivel > limite) return { ok: false, motivo: 'El terreno es muy desparejo' };
    }

    if (pieza) {
      for (const o of obras) {
        if (o === ignorarObra || o.datos.etapas <= 0) continue;
        const d = Math.hypot(o.datos.x - x, o.datos.z - z);
        // Una pared o mueble colocado sobre un piso modular puede solaparse en
        // planta con ese soporte: la altura de base ya demuestra que está encima.
        if (sobrePlataforma && o.plano.soportaPiezas) continue;
        if (o.plano.id === plano.id && d < (plano.separacion || 1.5) &&
            solapeVertical(plano, base, o.plano, o.datos.y ?? T.altura(o.datos.x, o.datos.z)))
          return { ok: false, motivo: 'Ya pusiste uno acá al lado' };
        if (o.plano.pieza && (plano.snap || o.plano.snap) &&
            solapanHuellas(plano, x, z, rot, o.plano, o.datos.x, o.datos.z, o.datos.rot || 0) &&
            solapeVertical(plano, base, o.plano, o.datos.y ?? T.altura(o.datos.x, o.datos.z))) {
          if (!solapePermitido(plano, o.plano) &&
              !contactoLinealValido(plano, x, z, rot, o.plano, o.datos.x, o.datos.z, o.datos.rot || 0) &&
              !encuentroCubiertaValido(plano, x, z, rot, base, o.plano, o.datos.x, o.datos.z, o.datos.rot || 0, o.datos.y ?? T.altura(o.datos.x, o.datos.z)))
            return { ok: false, motivo: 'Se superpone con otra pieza' };
        }
        // Compatibilidad con las piezas históricas que todavía no declaran una
        // huella rectangular precisa.
        if (!plano.snap && !plano.apoyaEnPlataforma && o.plano.pieza && !o.plano.snap && !plano.cubreOtras && !o.plano.cubreOtras &&
            d < Math.max(0.65, (plano.radio + o.plano.radio) * 0.42)) {
          return { ok: false, motivo: 'Se superpone con otra pieza' };
        }
      }
      return { ok: true, base, sobrePlataforma };
    }

    // Edificios grandes: distancia por huella, no un número fijo.
    for (const clave of Object.keys(T.lugares)) {
      const l = T.lugares[clave];
      if (!l || typeof l.x !== 'number') continue;
      const radioLugar = Math.max(4, l.radio || 8);
      if (Math.hypot(l.x - x, l.z - z) < plano.radio + radioLugar + 2.5) return { ok: false, motivo: 'Muy pegado a otra construcción' };
    }
    for (const o of obras) {
      if (o === ignorarObra || o.plano.pieza) continue;
      const minimo = plano.radio + (o.plano.radio || 4) + 2.0;
      if (Math.hypot(o.datos.x - x, o.datos.z - z) < minimo) return { ok: false, motivo: 'Ya tenés una obra al lado' };
    }
    const radioArboles = Math.max(3.4, plano.radio * 0.78);
    // 2.6.1: contar sin crear un arreglo por cuadro (el fantasma revisa el sitio en cada cuadro)
    let arboles = 0;
    for (const a of veg.arboles) if (!a.sacado && Math.hypot(a.x - x, a.z - z) < radioArboles) arboles++;
    if (arboles > 2) return { ok: false, motivo: 'Hay que buscar un claro' };
    return { ok: true, base, sobrePlataforma };
  }

  // ---------- fantasma de colocación
  function elegir(plano) {
    // Cambiar de plano o cerrar el modo obra nunca puede dejar una pieza en
    // edición oculta/sin física. La edición se revierte antes de cambiar foco.
    if (edicion && plano !== edicion.obra.plano) cancelarEdicion();
    planoElegido = plano;
    giroFantasma = 0;
    rotacionFantasma = null;
    ultimoEstado = null;
    if (fantasma) { grupo.remove(fantasma); fantasma.geometry.dispose(); fantasma = null; }
    if (!plano) return;
    const c = new Constructor();
    for (const e of plano.etapas) e.arma(c, plano);
    fantasma = new THREE.Mesh(c.geometria(), matFantasma);
    fantasma.renderOrder = 8;
    grupo.add(fantasma);
  }

  // R/rueda giran en pasos de 45° (o el paso propio del plano). La rotación
  // queda fijada: mirar hacia otro lado ya no hace girar toda la construcción.
  function girar(direccion = 1) {
    if (!planoElegido) return 0;
    const paso = planoElegido.rotPaso || Math.PI / 4;
    if (rotacionFantasma === null) rotacionFantasma = 0;
    giroFantasma += paso * Math.sign(direccion || 1);
    rotacionFantasma = cuantizarAngulo(rotacionFantasma + paso * Math.sign(direccion || 1), paso);
    return rotacionFantasma;
  }

  function moverFantasma(x, z, yaw, alturaReferencia = null) {
    if (!fantasma) return null;
    const rot = anguloFantasma(yaw);
    const t = resolverSnap(x, z, planoElegido, rot, edicion?.obra || null);
    const r = revisarSitio(t.x, t.z, planoElegido, t.rot, edicion?.obra || null, t.base, alturaReferencia);
    const y = r.base ?? baseColocacion(t.x, t.z, planoElegido, alturaReferencia);
    fantasma.position.set(t.x, y, t.z);
    fantasma.rotation.y = t.rot;
    matFantasma.color.setHex(r.ok ? (t.snap ? 0x65d6b1 : 0x78c987) : 0xd26f68);
    matFantasma.opacity = r.ok ? (t.snap ? 0.52 : 0.40) : 0.28;
    ultimoEstado = { ...r, x: t.x, z: t.z, rot: t.rot, snap: t.snap };
    return ultimoEstado;
  }

  function fundar(x, z, yaw, alturaReferencia = null) {
    if (!planoElegido) return { ok: false, motivo: 'Elegí un plano primero' };
    if (edicion) return { ok: false, motivo: 'Terminá o cancelá la edición actual' };
    const rot = anguloFantasma(yaw);
    const t = resolverSnap(x, z, planoElegido, rot);
    const r = revisarSitio(t.x, t.z, planoElegido, t.rot, null, t.base, alturaReferencia);
    if (!r.ok) return r;
    const datos = { plano: planoElegido.id, x: t.x, z: t.z, y: r.base ?? baseColocacion(t.x, t.z, planoElegido, alturaReferencia), rot: t.rot, etapas: 0, nombre: null };
    // 2.8: una pieza de jardín nace con la paleta de ese momento y la conserva
    if (planoElegido.jardin) datos.jardin = estiloJardinDe(planoElegido, null);
    const obra = colocar(datos);
    return { ok: true, datos, obra, snap: t.snap };
  }

  function alternarSnap(valor = null) {
    snapActivo = valor === null ? !snapActivo : !!valor;
    ultimoEstado = null;
    return snapActivo;
  }

  function nivelarSitio(datos, plano) {
    // Si una pieza está apoyada en un piso construido no toca la vegetación del
    // terreno de abajo. Para el resto se despeja según la huella real.
    if (plano.pieza && datos.y > T.altura(datos.x, datos.z) + 0.12) return;
    veg.despejar(datos.x, datos.z, plano.pieza ? Math.max(0.8, plano.radio * 0.72) : plano.radio + 1.5);
  }

  function colocar(datos) {
    // 2.6.1: sólo planos propios; 'constructor' o '__proto__' en un guardado no son planos
    const plano = Object.hasOwn(PLANO, datos.plano) ? PLANO[datos.plano] : null;
    if (!plano) return null;
    // al cargar la partida hay que volver a registrar paredes y pisos:
    // las banderas viajan en el guardado y si no se limpian, no se registra nada
    datos.chocado = false;
    datos.pisable = false;
    datos.barandado = false;
    const g = new THREE.Group();
    if (!Number.isFinite(datos.y)) datos.y = baseColocacion(datos.x, datos.z, plano);
    g.position.set(datos.x, datos.y, datos.z);
    g.rotation.y = datos.rot;
    grupo.add(g);
    const obra = { datos, x: datos.x, z: datos.z, grupo: g, malla: null, plano, fisica: new Set(), luzInterior: null };
    obras.push(obra);
    reindexarObras();
    // Marcar un lugar todavía no tala ni limpia el entorno. La intervención
    // real empieza al gastar materiales en la primera etapa; así una marca
    // cancelada no deja un claro fantasma en el bosque.
    if (datos.etapas > 0) nivelarSitio(datos, plano);
    rehacer(obra);
    return obra;
  }

  function unaVez(obra, clave, fn) {
    if (obra.fisica.has(clave)) return;
    obra.fisica.add(clave);
    fn();
  }

  function localMundo(obra, lx, lz) {
    return mundoDesdeLocal(obra.datos.x, obra.datos.z, obra.datos.rot, lx, lz);
  }

  function segmentoLocal(obra, ax, az, bx, bz, r, y0, y1) {
    const A = localMundo(obra, ax, az), B = localMundo(obra, bx, bz), base = obra.datos.y;
    col.agregar({ duenio: obra, seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r,
      alturaMin: base + y0, alturaMax: base + y1 });
  }

  function circuloLocal(obra, lx, lz, r, y0, y1) {
    const q = localMundo(obra, lx, lz), base = obra.datos.y;
    col.agregar({ duenio: obra, x: q.x, z: q.z, r, alturaMin: base + y0, alturaMax: base + y1 });
  }

  // `extra` (2.4): banderas de la plataforma, como `sinTecho` para los peldaños abiertos
  function plataformaLocal(obra, lx, lz, largo, ancho, alto, espesor = 0.14, escalonMax = 0.62, extra = null) {
    const q = localMundo(obra, lx, lz);
    col.agregarPlataforma({ duenio: obra, x: q.x, z: q.z, ang: -obra.datos.rot, largo, ancho,
      alto: obra.datos.y + alto, espesor, escalonMax, ...(extra || {}) });
  }

  // Física declarativa de los planos nuevos y de las piezas chicas. El mundo
  // visual y el mundo físico se registran en la misma etapa de construcción.
  function registrarFisicaPremium(obra) {
    const id = obra.plano.id, e = obra.datos.etapas, P = obra.plano;
    // 3.0.1: lo que se ve y no chocaba: las patas del mirador, el catre y los horcones del
    // alero del puesto, la estufa de la casilla
    if (id === 'mirador' && e >= 1) unaVez(obra, 'mirador-patas', () => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) circuloLocal(obra, sx * (P.ancho / 2 - 0.2), sz * (P.fondo / 2 - 0.2), 0.13, -0.05, P.alto + 0.05);
    });
    if (id === 'puesto' && e >= 4) unaVez(obra, 'puesto-terminaciones', () => {
      segmentoLocal(obra, -P.ancho / 2 + 1.2, P.fondo / 2 - 1.9, -P.ancho / 2 + 1.2, P.fondo / 2 - 0.34, 0.45, 0.5, 1.18);
      for (const sx of [-1, 1]) circuloLocal(obra, sx * P.ancho * 0.34, -P.fondo / 2 - 0.9, 0.09, -0.05, 2.7);
    });
    if (id === 'casilla' && e >= 4) unaVez(obra, 'casilla-estufa', () => circuloLocal(obra, P.ancho / 2 - 0.75, P.fondo / 2 - 0.7, 0.4, 0.5, 3.6));
    if (id === 'galponcito' && e >= 1) unaVez(obra, 'galponcito-horcones', () => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) circuloLocal(obra, sx * (P.ancho / 2 - 0.2), sz * (P.fondo / 2 - 0.2), 0.14, -0.05, P.alto + 0.3);
    });
    if (id === 'casilla') {
      if (e >= 2) unaVez(obra, 'casilla-piso', () => {
        plataformaLocal(obra, 0, 0, P.ancho - 0.12, P.fondo - 0.08, 0.62, 0.14);
        plataformaLocal(obra, 0, -P.fondo / 2 - 0.35, 1.36, 0.64, 0.38, 0.14);
      });
      if (e >= 3) unaVez(obra, 'casilla-paredes', () => {
        const h = 1.02;
        segmentoLocal(obra, -P.ancho/2, -P.fondo/2, -h/2, -P.fondo/2, 0.09, 0.48, P.alto + 0.28);
        segmentoLocal(obra, h/2, -P.fondo/2, P.ancho/2, -P.fondo/2, 0.09, 0.48, P.alto + 0.28);
        segmentoLocal(obra, -P.ancho/2, P.fondo/2, P.ancho/2, P.fondo/2, 0.09, 0.48, P.alto + 0.28);
        segmentoLocal(obra, -P.ancho/2, -P.fondo/2, -P.ancho/2, P.fondo/2, 0.09, 0.48, P.alto + 0.28);
        segmentoLocal(obra, P.ancho/2, -P.fondo/2, P.ancho/2, P.fondo/2, 0.09, 0.48, P.alto + 0.28);
      });
    }
    if (id === 'cobertizo') {
      if (e >= 1) unaVez(obra, 'cobertizo-postes', () => {
        for (const sx of [-1,0,1]) for (const sz of [-1,1]) circuloLocal(obra, sx*(P.ancho/2-0.24), sz*(P.fondo/2-0.22), 0.13, 0, P.alto+0.5);
      });
      if (e >= 2) unaVez(obra, 'cobertizo-piso', () => {
        plataformaLocal(obra, 0, 0, P.ancho - 0.18, P.fondo - 0.05, 0.52, 0.14);
        segmentoLocal(obra, -P.ancho/2+0.14, P.fondo/2-0.19, P.ancho/2-0.14, P.fondo/2-0.19, 0.09, 0.44, 2.20);
      });
      if (e >= 3) unaVez(obra, 'cobertizo-banco', () => segmentoLocal(obra, -1.08, P.fondo/2-0.62, 1.08, P.fondo/2-0.62, 0.36, 0.10, 1.12));
    }
    if (e < P.etapas.length || !P.pieza) return;
    // Piezas declarativas (defensas): el plano trae su propia física en coordenadas locales.
    if (P.fisica) unaVez(obra, 'pieza-' + id, () => P.fisica({
      segmento: (ax, az, bx, bz, r, y0, y1) => segmentoLocal(obra, ax, az, bx, bz, r, y0, y1),
      circulo: (lx, lz, r, y0, y1) => circuloLocal(obra, lx, lz, r, y0, y1),
      plataforma: (lx, lz, largo, ancho, alto, espesor, escalon, extra) => plataformaLocal(obra, lx, lz, largo, ancho, alto, espesor, escalon, extra),
    }));
    if (id === 'banco') unaVez(obra, 'pieza-banco', () => segmentoLocal(obra, -0.85, 0, 0.85, 0, 0.23, 0.10, 0.78));
    if (id === 'fogon') unaVez(obra, 'pieza-fogon', () => circuloLocal(obra, 0, 0, 0.62, -0.04, 0.42));
    if (id === 'tendal') unaVez(obra, 'pieza-tendal', () => {
      circuloLocal(obra, -1.5, 0, 0.11, -0.05, 2.12); circuloLocal(obra, 1.5, 0, 0.11, -0.05, 2.12);
    });
    if (id === 'lena') unaVez(obra, 'pieza-lena', () => segmentoLocal(obra, -0.72, 0, 0.72, 0, 0.52, -0.02, 1.12));
    if (id === 'banco-trabajo') unaVez(obra, 'pieza-banco-trabajo', () => segmentoLocal(obra, -0.95, 0, 0.95, 0, 0.40, 0.02, 1.82));
    if (id === 'pasarela') unaVez(obra, 'pieza-pasarela', () => plataformaLocal(obra, 0, 0, 3.22, 1.10, 0.29, 0.18, 0.45));
    if (id === 'cerco') unaVez(obra, 'pieza-cerco', () => segmentoLocal(obra, -1.58, 0, 1.58, 0, 0.075, -0.05, 1.32));
    if (id === 'mesa-campo') unaVez(obra, 'pieza-mesa', () => segmentoLocal(obra, -0.70, 0, 0.70, 0, 0.48, 0.04, 0.98));
    if (id === 'estante') unaVez(obra, 'pieza-estante', () => segmentoLocal(obra, -0.78, 0, 0.78, 0, 0.26, -0.02, 1.72));
    if (id === 'catre-campo') unaVez(obra, 'pieza-catre', () => segmentoLocal(obra, -0.84, 0, 0.84, 0, 0.38, 0.02, 0.68));
    if (id === 'silla-campo') unaVez(obra, 'pieza-silla', () => circuloLocal(obra, 0, 0, 0.34, 0.02, 1.06));
    if (id === 'farol-interior') unaVez(obra, 'pieza-farol', () => circuloLocal(obra, 0, 0, 0.18, 0.00, 1.66));
    if (id === 'estufa-hierro') unaVez(obra, 'pieza-estufa', () => segmentoLocal(obra, -0.34, 0, 0.34, 0, 0.34, 0.02, 2.22));
    // 3.0.1: los pisos de al lado (a 3 m) se tocan: con 2,94 quedaba una rendija de 6 cm y el
    // cuadro que caía justo ahí dejaba al cuerpo en el aire (en un entrepiso, caía al piso de abajo)
    if (id === 'piso-modular') unaVez(obra, 'mod-piso', () => plataformaLocal(obra, 0, 0, 3.02, 3.02, 0.285, 0.16, 0.48));
    if (id === 'pared-modular') unaVez(obra, 'mod-pared', () => segmentoLocal(obra, -1.50, 0, 1.50, 0, 0.085, -0.02, 2.30));
    if (id === 'pared-puerta') unaVez(obra, 'mod-puerta', () => {
      const h = 0.46;
      // 3.0.1: los tramos terminan un radio más afuera, en la cara del marco: con la hoja
      // abierta (su bisagra ocupa un costado) el paso quedaba en 69 cm y el cuerpo (70) se trababa
      segmentoLocal(obra, -1.50, 0, -h - 0.085, 0, 0.085, -0.02, 2.30);
      segmentoLocal(obra, h + 0.085, 0, 1.50, 0, 0.085, -0.02, 2.30);
      segmentoLocal(obra, -h, 0, h, 0, 0.085, 2.00, 2.30);
    });
    if (id === 'tabique-interior') unaVez(obra, 'mod-tabique-interior', () =>
      segmentoLocal(obra, -1.50, 0, 1.50, 0, 0.065, -0.02, 2.28));
    if (id === 'tabique-puerta') unaVez(obra, 'mod-tabique-puerta', () => {
      const h = 0.42;
      // 3.0.1: como en la pared con puerta: con la hoja abierta no se pasaba (63 cm de paso)
      segmentoLocal(obra, -1.50, 0, -h - 0.065, 0, 0.065, -0.02, 2.28);
      segmentoLocal(obra, h + 0.08, 0, 1.50, 0, 0.065, -0.02, 2.28);
      segmentoLocal(obra, -h, 0, h, 0, 0.065, 1.94, 2.28);
    });
    if (id === 'pared-ventana') unaVez(obra, 'mod-ventana', () => {
      segmentoLocal(obra, -1.50, 0, 1.50, 0, 0.085, -0.02, 0.90);
      segmentoLocal(obra, -1.50, 0, 1.50, 0, 0.085, 1.66, 2.30);
      segmentoLocal(obra, -1.50, 0, -0.65, 0, 0.085, 0.88, 1.70);
      segmentoLocal(obra, 0.65, 0, 1.50, 0, 0.085, 0.88, 1.70);
    });
    if (id === 'pared-marco') unaVez(obra, 'mod-marco', () => {
      const h = 0.90;
      segmentoLocal(obra, -1.50, 0, -h, 0, 0.085, -0.02, 2.30);
      segmentoLocal(obra, h, 0, 1.50, 0, 0.085, -0.02, 2.30);
      segmentoLocal(obra, -h, 0, h, 0, 0.085, 2.00, 2.30);
    });
    if (id === 'pared-media') unaVez(obra, 'mod-media-pared', () =>
      segmentoLocal(obra, -1.50, 0, 1.50, 0, 0.085, -0.02, 1.10));
    if (id === 'pared-ventana-ancha') unaVez(obra, 'mod-ventanal', () => {
      segmentoLocal(obra, -1.50, 0, 1.50, 0, 0.085, -0.02, 0.72);
      segmentoLocal(obra, -1.50, 0, 1.50, 0, 0.085, 1.78, 2.30);
      segmentoLocal(obra, -1.50, 0, -0.92, 0, 0.085, 0.70, 1.82);
      segmentoLocal(obra, 0.92, 0, 1.50, 0, 0.085, 0.70, 1.82);
    });
    if (id === 'techo-plano') unaVez(obra, 'mod-techo-plano', () =>
      plataformaLocal(obra, 0, 0, 3.20, 3.20, 0.24, 0.12, 0.46));
    if (id === 'escalera-modular') unaVez(obra, 'mod-escalera', () => {
      const zs = [-0.63, -0.21, 0.21, 0.63], hs = [0.08, 0.15, 0.22, 0.29];
      // 3.0.1: el primer peldaño se sube desde el suelo aunque éste baje un poco (ladera)
      for (let i = 0; i < zs.length; i++) plataformaLocal(obra, 0, zs[i], 0.86, 0.42, hs[i], Math.max(0.06, hs[i]), i === 0 ? 0.6 : 0.18);
    });
    if (id === 'baranda-modular') unaVez(obra, 'mod-baranda', () =>
      segmentoLocal(obra, -1.50, 0, 1.50, 0, 0.09, -0.04, 1.08));
    if (id === 'pilar-esquina') unaVez(obra, 'mod-pilar-esquina', () =>
      circuloLocal(obra, 0, 0, 0.13, -0.03, 2.30));
    if (id === 'entrepiso-modular') unaVez(obra, 'mod-entrepiso', () =>
      plataformaLocal(obra, 0, 0, 3.02, 3.02, 0.285, 0.16, 0.48));
    if (id === 'entrepiso-escalera') unaVez(obra, 'mod-entrepiso-hueco', () => {
      plataformaLocal(obra, -1.025, 0, 0.97, 3.02, 0.285, 0.16, 0.48);
      plataformaLocal(obra, 1.025, 0, 0.97, 3.02, 0.285, 0.16, 0.48);
      // 3.0.1: la tabla de borde de atrás, abierta por abajo: no le hace de techo al que sube
      // (con la escalera para cualquiera de los dos lados)
      plataformaLocal(obra, 0, -1.335, 1.1, 0.27, 0.285, 0.16, 0.48, { sinTecho: true });
    });
    if (id === 'escalera-nivel') unaVez(obra, 'mod-escalera-nivel', () => {
      const n = 11, altoPaso = 2.565 / n;
      // 3.0.1: peldaños abiertos (`sinTecho`: el de arriba no es un techo para el que sube),
      // que no frenan al cuerpo de costado (`sinLaterales`: antes el segundo de adelante trababa
      // el paso, y desde el piso no se llegaba a la escalera si su pie daba a una pared) y tan
      // anchos como el hueco del entrepiso (de la escalera se pasa de costado al piso de arriba;
      // en los 10 cm que quedaban el cuerpo se caía). El primer peldaño llega hasta 44 cm de la
      // pared del pie: si ahí hay una puerta, bajando, la cabeza ya pasa el dintel (antes, con
      // la puerta al pie, se subía pero no se podía bajar ni salir del cuarto).
      for (let i = 0; i < n; i++) {
        const z = -1.25 + i * (2.50 / (n - 1));
        let z0 = z - 0.14, z1 = z + 0.14;
        if (i === 0) z1 = -0.975;
        if (i === 1) z0 = -0.98;
        // (un poco encimados con el entrepiso: si entre dos tablados queda una rendija, aunque sea de
        // milímetros, el cuadro que cae justo ahí deja al cuerpo en el aire y se cae)
        plataformaLocal(obra, 0, (z0 + z1) / 2, 1.1, z1 - z0, altoPaso * (i + 1), 0.10, 0.5, { sinTecho: true, sinLaterales: true });
      }
      // y desde el piso no se la atraviesa: ni de costado desde el cuarto peldaño, ni por
      // debajo desde el lado alto (a la altura de la cabeza)
      for (const sx of [-1, 1]) segmentoLocal(obra, sx * 0.57, -0.4, sx * 0.57, 0.3, 0.03, -0.02, 1.0);
      segmentoLocal(obra, -0.57, 0.3, 0.57, 0.3, 0.03, -0.02, 1.3);
    });
  }

  function registrarInteraccionesPremium(obra) {
    if (!interacciones || obra.datos.etapas < obra.plano.etapas.length) return;
    const sitio = { x: obra.datos.x, y: obra.datos.y, z: obra.datos.z, piso: 0 };
    if ((obra.plano.id === 'pared-puerta' || obra.plano.id === 'tabique-puerta') && interacciones.agregar) {
      const interior = obra.plano.id === 'tabique-puerta';
      interacciones.agregar({ sitio, rot: obra.datos.rot, lx: 0, lz: 0, ancho: interior ? 0.84 : 0.92, alto: interior ? 1.92 : 1.96,
        lado: 1, tipo: interior ? 'lisa' : 'campo', nombre: interior ? 'la puerta interior' : 'la puerta de tu refugio', duenio: obra });
    }
    if (obra.plano.porton && interacciones.agregar) {
      interacciones.agregar({ sitio, rot: obra.datos.rot, lx: 0, lz: 0, ancho: 1.8, alto: 2.2,
        lado: 1, tipo: 'campo', nombre: 'el portón de la empalizada', duenio: obra });
    }
    if (obra.plano.id === 'pared-ventana' && interacciones.agregarPostigos) {
      interacciones.agregarPostigos({ sitio, rot: obra.datos.rot, lx: 0, ly: 1.29, lz: -0.085,
        ancho: 1.22, alto: 0.72, nombre: 'los postigos de tu refugio', duenio: obra });
    }
    if (obra.plano.id === 'pared-ventana-ancha' && interacciones.agregarPostigos) {
      interacciones.agregarPostigos({ sitio, rot: obra.datos.rot, lx: 0, ly: 1.27, lz: -0.085,
        ancho: 1.84, alto: 0.92, nombre: 'los postigos del ventanal', duenio: obra });
    }
  }

  function registrarAmbientacionPremium(obra) {
    if (obra.datos.etapas < obra.plano.etapas.length || !obra.plano.luzInterior || obra.luzInterior) return;
    const luz = new THREE.PointLight(0xffc46b, 0, 9, 1.7);
    luz.position.set(0, 1.42, 0);
    luz.updateMatrix(); luz.matrixAutoUpdate = false;   // 2.7.3: fija dentro de la obra
    luz.castShadow = false;
    obra.grupo.add(luz);
    obra.luzInterior = luz;
    registrarLuz(luz);   // 2.7.4: ver luces.js
  }

  function actualizarAmbiente(noche = 0) {
    const intensidad = clamp(noche, 0, 1);
    for (const o of obras) if (o.luzInterior) {
      const activa = o.grupo.visible && o.datos.etapas >= o.plano.etapas.length;
      o.luzInterior.intensity = activa ? (0.35 + intensidad * 2.25) : 0;
    }
  }

  function rehacer(obra) {
    // Rebuild físico determinista: se retira todo lo que pertenecía a esta obra
    // antes de registrar su estado actual. Esto hace seguras la edición, carga
    // de partidas y reconstrucción por etapas sin duplicar colisiones.
    if (interacciones?.eliminarPorDuenio) interacciones.eliminarPorDuenio(obra);
    if (col.eliminarPorDuenio) col.eliminarPorDuenio(obra);
    obra.fisica.clear();
    obra.datos.chocado = false; obra.datos.pisable = false; obra.datos.barandado = false;
    if (obra.malla) { obra.grupo.remove(obra.malla); obra.malla.geometry.dispose(); }
    const g = obra.datos.etapas === 0 ? geometriaMarcado(obra.plano) : geometriaDe(obra.plano, obra.datos.etapas, obra.datos);
    // 2.8: la firma del estilo con que se armó (ver `repintar`)
    obra.firmaEstilo = firmaEstiloObra(obra.plano, obra.datos);
    // 2.4: el tinte de la pieza (ver tintes.js)
    // 2.8: si la casa tiene su propia pintura (Personalizar), manda esa y el tinte no se suma encima
    if (obra.datos.tinte && Object.hasOwn(TINTES, obra.datos.tinte) && obra.datos.etapas > 0 && !obra.datos.pintura) tenirColores(g.getAttribute('color'), TINTES[obra.datos.tinte].color);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    // 2.7.3: la malla de la obra ya es una sola (el Constructor junta todas las piezas
    // de todas las etapas) y no se mueve dentro de su grupo: lo que se corre o tiembla
    // es el grupo. Su matriz local (la identidad) se calcula una vez.
    m.matrixAutoUpdate = false;
    obra.grupo.add(m);
    obra.malla = m;
    // las paredes chocan desde que se levantan
    if (obra.plano.id === 'mirador' && obra.datos.etapas >= 2 && !obra.datos.pisable) {
      obra.datos.pisable = true;
      const P = obra.plano;
      col.agregarPlataforma({ duenio: obra, x: obra.datos.x, z: obra.datos.z, ang: -obra.datos.rot, largo: P.ancho + 0.3, ancho: P.fondo, alto: T.altura(obra.datos.x, obra.datos.z) + P.alto + 0.29, espesor: 0.18 });
      // los peldaños, para poder subir
      // 3.0.1: del ancho y el fondo de cada tabla, abiertos por arriba (`sinTecho`: el de arriba
      // no es un techo para el que sube) y con un descanso al pie. Los diez de antes, de un
      // metro de fondo y encimados, le hacían de techo y de pared al cuerpo: no se subía.
      const rot = obra.datos.rot, n = PELDANOS_MIRADOR, paso = 3.6 / n;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const lz = -P.fondo / 2 - 3.6 * (1 - t);
        const x = obra.datos.x + lz * Math.sin(rot), z = obra.datos.z + lz * Math.cos(rot);
        col.agregarPlataforma({ duenio: obra, x, z, ang: -rot, largo: 1.2, ancho: paso + 0.02, alto: T.altura(obra.datos.x, obra.datos.z) + 0.28 + t * P.alto, espesor: 0.1, escalonMax: 0.6, sinTecho: true });
      }
      // el descanso: un escalón de 20 cm pegado al primer peldaño (desde el suelo, el segundo
      // peldaño ya queda fuera del paso y frena al cuerpo)
      const pie = { x: obra.datos.x + (-P.fondo / 2 - 3.88) * Math.sin(rot), z: obra.datos.z + (-P.fondo / 2 - 3.88) * Math.cos(rot) };
      col.agregarPlataforma({ duenio: obra, x: pie.x, z: pie.z, ang: -rot, largo: 1.1, ancho: 0.56, alto: T.altura(obra.datos.x, obra.datos.z) + 0.2, espesor: 0.2, escalonMax: 0.6 });
    }
    // la baranda del mirador frena: si no, se cruza la plataforma y te caés
    if (obra.plano.id === 'mirador' && obra.datos.etapas >= 3 && !obra.datos.barandado) {
      obra.datos.barandado = true;
      const P = obra.plano, rot = obra.datos.rot;
      const w = (lx, lz) => ({
        x: obra.datos.x + lx * Math.cos(rot) + lz * Math.sin(rot),
        z: obra.datos.z - lx * Math.sin(rot) + lz * Math.cos(rot),
      });
      const base = T.altura(obra.datos.x, obra.datos.z);
      const railMin = base + P.alto + 0.18;
      const railMax = base + P.alto + 1.42;
      const baranda = (a2, b2) => {
        const A = w(...a2), B = w(...b2);
        col.agregar({ duenio: obra, seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.10,
          alturaMin: railMin, alturaMax: railMax });
      };
      const W = P.ancho / 2 + 0.05, D = P.fondo / 2 + 0.05;
      baranda([-W, -D], [-W, D]);
      baranda([W, -D], [W, D]);
      baranda([-W, D], [W, D]);
      // el frente queda abierto: por ahí se entra desde la escalera
    }
    if (obra.plano.id === 'galponcito' && obra.datos.etapas >= 2 && !obra.datos.pisable) {
      obra.datos.pisable = true;
      const P = obra.plano;
      col.agregarPlataforma({ duenio: obra, x: obra.datos.x, z: obra.datos.z, ang: -obra.datos.rot, largo: P.ancho - 0.2, ancho: P.fondo, alto: T.altura(obra.datos.x, obra.datos.z) + 0.38, espesor: 0.18 });
    }
    // El galponcito sí tiene una pared de fondo visible desde la etapa 2. Antes
    // se podía atravesar porque sólo registrábamos el piso.
    if (obra.plano.id === 'galponcito' && obra.datos.etapas >= 2 && !obra.datos.chocado) {
      obra.datos.chocado = true;
      const P = obra.plano, rot = obra.datos.rot;
      const base = T.altura(obra.datos.x, obra.datos.z);
      const w = (lx, lz) => ({
        x: obra.datos.x + lx * Math.cos(rot) + lz * Math.sin(rot),
        z: obra.datos.z - lx * Math.sin(rot) + lz * Math.cos(rot),
      });
      const A = w(-P.ancho / 2 + 0.2, P.fondo / 2 - 0.2);
      const B = w(P.ancho / 2 - 0.2, P.fondo / 2 - 0.2);
      col.agregar({ duenio: obra, seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.11,
        alturaMin: base - 0.16, alturaMax: base + 1.96 });
    }
    if (obra.plano.id === 'puesto' && obra.datos.etapas >= 3 && !obra.datos.chocado) {
      obra.datos.chocado = true;
      const P = obra.plano, rot = obra.datos.rot;
      const w = (lx, lz) => ({
        x: obra.datos.x + lx * Math.cos(rot) + lz * Math.sin(rot),
        z: obra.datos.z - lx * Math.sin(rot) + lz * Math.cos(rot),
      });
      const base = T.altura(obra.datos.x, obra.datos.z);
      const pared = (a, b) => { const A = w(...a), B = w(...b); col.agregar({ duenio: obra, seg: true,
        ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.14,
        alturaMin: base - 0.16, alturaMax: base + P.alto + 0.32 }); };
      const hueco = 0.95;
      // 3.0.1: el tramo termina un radio más afuera, en la cara del marco: antes el hueco
      // quedaba en 67 cm y el cuerpo (70) no pasaba por la puerta
      pared([-P.ancho / 2, -P.fondo / 2], [-hueco / 2 - 0.14, -P.fondo / 2]);
      pared([hueco / 2 + 0.14, -P.fondo / 2], [P.ancho / 2, -P.fondo / 2]);
      pared([-P.ancho / 2, P.fondo / 2], [P.ancho / 2, P.fondo / 2]);
      pared([-P.ancho / 2, -P.fondo / 2], [-P.ancho / 2, P.fondo / 2]);
      pared([P.ancho / 2, -P.fondo / 2], [P.ancho / 2, P.fondo / 2]);
      const piso = w(0, 0);
      col.agregarPlataforma({ duenio: obra, x: piso.x, z: piso.z, ang: -rot, largo: P.ancho, ancho: P.fondo, alto: base + 0.58, espesor: 0.18 });
      // El escalón de entrada existe también en física; evita pisarlo visualmente
      // mientras los pies siguen hundidos en el terreno.
      const escalon = w(0, -P.fondo / 2 - 0.35);
      col.agregarPlataforma({ duenio: obra, x: escalon.x, z: escalon.z, ang: -rot, largo: 1.4, ancho: 0.62, alto: base + 0.36, espesor: 0.14 });
    }
    registrarFisicaPremium(obra);
    registrarInteraccionesPremium(obra);
    registrarAmbientacionPremium(obra);
    pintarPuertasObra(obra);
  }

  function obraCerca(pos, radio = 7, planoId = null) {
    let mejor = null, d0 = radio;
    for (const o of obrasCerca(pos, radio)) {
      if (planoId && o.plano.id !== planoId) continue;
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z);
      if (d < d0) { d0 = d; mejor = o; }
    }
    return mejor;
  }

  function tieneFuncionCerca(funcion, pos, radio = 5) {
    let mejor = null, d0 = radio;
    const py = Number.isFinite(pos?.y) ? pos.y : null;
    for (const o of obrasCerca(pos, radio)) {
      if (o.datos.etapas < o.plano.etapas.length) continue;
      if (!(o.plano.funciones || []).includes(funcion)) continue;
      const dy = py === null ? 0 : Math.abs((o.datos.y ?? py) - py);
      // Catres/talleres/estufas apilados pertenecen a plantas distintas.
      if (dy > 1.55) continue;
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z, dy * 0.45);
      if (d <= radio && d < d0) { d0 = d; mejor = o; }
    }
    return mejor;
  }

  function retirarObra(obra) {
    if (!obra) return false;
    // 2.6.1: si cae la pieza que se estaba moviendo (p. ej. se derriba el piso de
    // abajo), la edición muere con ella. Si no, confirmarla rehacía su física
    // fuera de `obras`: una pared invisible imposible de desmontar.
    if (edicion?.obra === obra) { edicion = null; ultimoEstado = null; }
    if (interacciones?.eliminarPorDuenio) interacciones.eliminarPorDuenio(obra);
    if (col.eliminarPorDuenio) col.eliminarPorDuenio(obra);
    if (obra.malla) { obra.grupo.remove(obra.malla); obra.malla.geometry.dispose(); obra.malla = null; }
    if (obra.luzInterior) { obra.grupo.remove(obra.luzInterior); olvidarLuz(obra.luzInterior); obra.luzInterior = null; }
    grupo.remove(obra.grupo);
    const i = obras.indexOf(obra);
    if (i >= 0) { obras.splice(i, 1); reindexarObras(); }
    return i >= 0;
  }

  function dependenciasSobre(obra) {
    const deps = [];
    if (obra?.plano?.soportaPiezas) {
      const arriba = obra.datos.y + 0.12;
      for (const o of obras) if (o !== obra && o.plano.pieza && o.datos.etapas > 0 && o.datos.y > arriba &&
        o.datos.y < obra.datos.y + 4.2 &&
        solapanHuellas(obra.plano, obra.datos.x, obra.datos.z, obra.datos.rot || 0,
          o.plano, o.datos.x, o.datos.z, o.datos.rot || 0, -0.02)) deps.push(o);
      // Una escalera interior nace abajo del entrepiso al que sirve; por altura no
      // entra en el filtro anterior, pero sigue siendo una dependencia funcional.
      if (obra.plano.huecoEscalera) for (const o of obras) {
        if (o !== obra && o.plano.id === 'escalera-nivel' && o.datos.etapas > 0 &&
            Math.hypot(o.datos.x - obra.datos.x, o.datos.z - obra.datos.z) < 0.36 &&
            Math.abs((o.datos.y + 2.28) - obra.datos.y) < 0.26) deps.push(o);
      }
    }
    if (obra?.plano?.soporteVertical) {
      for (const o of obras) {
        if (!o.plano.requiereSoporteVertical || o.datos.etapas < o.plano.etapas.length) continue;
        if (Math.abs(o.datos.y - (obra.datos.y + 2.28)) > 0.32) continue;
        if (Math.hypot(o.datos.x - obra.datos.x, o.datos.z - obra.datos.z) > 2.3) continue;
        const soporte = soporteVerticalNivel(o.datos.x, o.datos.z, o.datos.rot || 0, obra.datos.y, obra);
        if (!soporte.ok) deps.push(o);
      }
    }
    return [...new Set(deps)];
  }

  // RC12: lectura semántica del hábitat modular. Cada módulo sigue siendo una
  // unidad geométrica verificable, pero ahora conoce a sus vecinos del mismo
  // nivel. Un borde compartido con otro módulo cubierto puede ser una unión
  // abierta, un marco o una puerta interior; por eso una casa de varios módulos
  // deja de ser interpretada como varias cajas incompletas.
  function cubiertaDeBase(base) {
    if (!base || base.datos.etapas < base.plano.etapas.length) return null;
    const cotaMuros = cotaSuperiorPiso(base), cotaTecho = cotaMuros + 2.02;
    for (const o of obras) {
      if (o === base || o === edicion?.obra || o.datos.etapas < o.plano.etapas.length || o.plano.snap?.tipo !== 'techo') continue;
      if (Math.hypot(o.datos.x - base.datos.x, o.datos.z - base.datos.z) > 0.42) continue;
      if (Math.abs((o.datos.y ?? 0) - cotaTecho) > 0.42) continue;
      if (diferenciaEje(o.datos.rot || 0, base.datos.rot || 0) > 0.36) continue;
      return { obra: o, id: o.plano.id, nombre: o.plano.nombre, transitable: o.plano.id === 'techo-plano' };
    }
    return null;
  }

  function vecinoPorLado(base, lado) {
    if (!base) return null;
    const W = base.plano.ancho || 3, D = base.plano.fondo || 3;
    const offsets = { n: [0, -D], s: [0, D], o: [-W, 0], e: [W, 0] };
    const [lx, lz] = offsets[lado] || [0, 0];
    const objetivo = mundoDesdeLocal(base.datos.x, base.datos.z, base.datos.rot || 0, lx, lz);
    let mejor = null, d0 = 0.52;
    for (const o of obras) {
      if (o === base || o === edicion?.obra || o.datos.etapas < o.plano.etapas.length) continue;
      const tipo = o.plano.snap?.tipo;
      if (tipo !== 'piso' && tipo !== 'entrepiso') continue;
      if (Math.abs((o.datos.y ?? 0) - (base.datos.y ?? 0)) > 0.34) continue;
      if (diferenciaEje(o.datos.rot || 0, base.datos.rot || 0) > 0.20) continue;
      const d = Math.hypot(o.datos.x - objetivo.x, o.datos.z - objetivo.z);
      if (d < d0) { d0 = d; mejor = o; }
    }
    return mejor;
  }

  function aperturaPuertaObra(obra) {
    if (!obra?.plano?.accesoHabitacion) return null;
    const directo = interacciones?.aperturaPorDuenio?.(obra);
    if (directo) return directo;
    const p = interacciones?.lista?.find?.((x) => x.duenio === obra && !x.postigo);
    return p ? { abierta: p.abierta || 0, objetivo: p.objetivo || 0, puerta: p } : null;
  }

  function estadoModulo(base) {
    if (!base || base.datos.etapas < base.plano.etapas.length) return null;
    const tipoBase = base.plano.snap?.tipo;
    if (tipoBase !== 'piso' && tipoBase !== 'entrepiso') return null;
    const hx = Math.max(0.5, (base.plano.ancho || 3) / 2 - 0.08);
    const hz = Math.max(0.5, (base.plano.fondo || 3) / 2 - 0.08);
    const c = Math.cos(base.datos.rot || 0), si = Math.sin(base.datos.rot || 0);
    const cotaMuros = cotaSuperiorPiso(base);
    const lados = { n: null, s: null, e: null, o: null };

    for (const o of obras) {
      if (o === base || o === edicion?.obra || o.datos.etapas < o.plano.etapas.length) continue;
      if (o.plano.snap?.familia !== 'modular-muro') continue;
      if (Math.abs((o.datos.y ?? 0) - cotaMuros) > 0.24) continue;
      const dx = o.datos.x - base.datos.x, dz = o.datos.z - base.datos.z;
      const lx = dx * c - dz * si, lz = dx * si + dz * c;
      let lado = null;
      if (Math.abs(lx) < 0.58 && Math.abs(Math.abs(lz) - hz) < 0.34 && diferenciaEje(o.datos.rot || 0, base.datos.rot || 0) < 0.30)
        lado = lz < 0 ? 'n' : 's';
      else if (Math.abs(lz) < 0.58 && Math.abs(Math.abs(lx) - hx) < 0.34 && diferenciaEje(o.datos.rot || 0, (base.datos.rot || 0) + Math.PI / 2) < 0.30)
        lado = lx < 0 ? 'o' : 'e';
      if (!lado) continue;
      const dato = {
        obra: o, id: o.plano.id, nombre: o.plano.nombre,
        cerrada: !!o.plano.cierraHabitacion,
        acceso: !!o.plano.accesoHabitacion,
        ventana: !!o.plano.ventanaHabitacion,
      };
      if (!lados[lado] || (dato.cerrada && !lados[lado].cerrada)) lados[lado] = dato;
    }

    const cubierta = cubiertaDeBase(base);
    const vecinos = { n: null, s: null, e: null, o: null };
    const conexiones = [];
    for (const lado of Object.keys(vecinos)) {
      const vecino = vecinoPorLado(base, lado);
      if (!vecino || !cubiertaDeBase(vecino)) continue;
      vecinos[lado] = vecino;
      const borde = lados[lado];
      if (!borde) {
        conexiones.push({ lado, vecino, tipo: 'union-abierta', factor: 1, apertura: 1, obra: null });
        continue;
      }
      if (!borde.acceso) continue;
      if (!borde.cerrada) {
        conexiones.push({ lado, vecino, tipo: 'marco-abierto', factor: 0.92, apertura: 1, obra: borde.obra });
        continue;
      }
      const p = aperturaPuertaObra(borde.obra);
      const apertura = clamp(Math.max(p?.abierta || 0, p?.objetivo || 0), 0, 1);
      conexiones.push({ lado, vecino, tipo: 'puerta', factor: 0.22 + apertura * 0.78, apertura, obra: borde.obra });
    }

    const lista = Object.values(lados).filter(Boolean);
    const paredes = lista.filter((x) => x.cerrada).length;
    const accesos = lista.filter((x) => x.acceso).length;
    const ventanas = lista.filter((x) => x.ventana).length;
    let cierresEfectivos = 0;
    for (const lado of Object.keys(lados)) {
      if (lados[lado]?.cerrada || conexiones.some((x) => x.lado === lado)) cierresEfectivos++;
    }
    const conexionesInterior = conexiones.length;
    const cerrado = cierresEfectivos === 4 && !!cubierta;
    const habitable = cerrado && (accesos > 0 || conexionesInterior > 0);
    const protegido = !!cubierta && cierresEfectivos >= 3;
    const etiqueta = habitable
      ? (paredes < 4 ? 'ambiente conectado' : 'habitación cerrada')
      : protegido ? 'espacio protegido'
      : cubierta ? 'cubierto incompleto'
      : cierresEfectivos >= 3 ? 'cerramiento sin techo'
      : 'módulo abierto';
    return { base, lados, cubierta, paredes, cierresEfectivos, accesos, ventanas, vecinos, conexiones, conexionesInterior, cerrado, habitable, protegido, etiqueta };
  }

  function estadoModuloCerca(pos, radio = 5.5) {
    let mejor = null, d0 = radio;
    for (const o of obrasCerca(pos, radio, [])) {
      const tipo = o.plano.snap?.tipo;
      if ((tipo !== 'piso' && tipo !== 'entrepiso') || o.datos.etapas < o.plano.etapas.length) continue;
      const dy = Math.abs((o.datos.y ?? 0) - (pos.y ?? o.datos.y ?? 0));
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) + dy * 0.12;
      if (d < d0) { d0 = d; mejor = o; }
    }
    return mejor ? estadoModulo(mejor) : null;
  }

  function dentroDelModulo(obra, estado, margen = 0.18) {
    if (!obra || obra.datos.etapas < obra.plano.etapas.length) return false;
    const base = estado.base, rot = base.datos.rot || 0;
    const dx = obra.datos.x - base.datos.x, dz = obra.datos.z - base.datos.z;
    const lx = dx * Math.cos(rot) - dz * Math.sin(rot);
    const lz = dx * Math.sin(rot) + dz * Math.cos(rot);
    const piso = cotaSuperiorPiso(base);
    const dy = (obra.datos.y ?? piso) - piso;
    return Math.abs(lx) <= (base.plano.ancho || 3) / 2 - margen &&
      Math.abs(lz) <= (base.plano.fondo || 3) / 2 - margen && dy > -0.45 && dy < 2.25;
  }

  function posicionDentroEstado(pos, estado, margen = 0.08) {
    if (!estado?.base || !pos) return false;
    const base = estado.base, rot = base.datos.rot || 0;
    const dx = pos.x - base.datos.x, dz = pos.z - base.datos.z;
    const lx = dx * Math.cos(rot) - dz * Math.sin(rot);
    const lz = dx * Math.sin(rot) + dz * Math.cos(rot);
    const piso = cotaSuperiorPiso(base), py = Number.isFinite(pos.y) ? pos.y : piso + 0.2;
    return Math.abs(lx) < (base.plano.ancho || 3) / 2 - margen &&
      Math.abs(lz) < (base.plano.fondo || 3) / 2 - margen && py >= piso - 0.35 && py <= piso + 2.65;
  }

  function baseQueContiene(pos) {
    let mejor = null, d0 = Infinity;
    const cercanas = obrasCerca(pos, 12, []);
    for (const base of cercanas) {
      const tipo = base.plano.snap?.tipo;
      if ((tipo !== 'piso' && tipo !== 'entrepiso') || base.datos.etapas < base.plano.etapas.length) continue;
      const estado = estadoModulo(base);
      if (!estado || !posicionDentroEstado(pos, estado)) continue;
      const piso = cotaSuperiorPiso(base), py = Number.isFinite(pos.y) ? pos.y : piso + 0.2;
      const d = Math.abs(py - (piso + 1.0));
      if (d < d0) { d0 = d; mejor = estado; }
    }
    return mejor;
  }

  function redInterior(base) {
    const inicial = estadoModulo(base);
    if (!inicial?.cubierta) return inicial ? [{ estado: inicial, factor: 1, saltos: 0 }] : [];
    const mejor = new Map([[base, 1]]), saltos = new Map([[base, 0]]);
    const cola = [base];
    while (cola.length) {
      const actual = cola.shift();
      const ea = estadoModulo(actual);
      if (!ea?.cubierta) continue;
      const f0 = mejor.get(actual) || 0;
      const s0 = saltos.get(actual) || 0;
      for (const con of ea.conexiones) {
        const ev = estadoModulo(con.vecino);
        if (!ev?.cubierta || !ev.cerrado) continue;
        const f = f0 * con.factor;
        if (f < 0.10 || f <= (mejor.get(con.vecino) || 0) + 0.015) continue;
        mejor.set(con.vecino, f); saltos.set(con.vecino, s0 + 1); cola.push(con.vecino);
      }
    }
    return [...mejor.entries()].map(([b, factor]) => ({ estado: estadoModulo(b), factor, saltos: saltos.get(b) || 0 }))
      .filter((x) => x.estado).sort((a, b) => b.factor - a.factor);
  }

  // 2.4: ¿estás abajo de una galería o de un invernadero? (rectángulo girado)
  function cubiertaDePieza(pos) {
    for (const o of obrasCerca(pos, 5, [])) {
      if (!o.plano.cubreArea || o.datos.etapas < o.plano.etapas.length) continue;
      const rot = o.datos.rot || 0, dx = pos.x - o.datos.x, dz = pos.z - o.datos.z;
      const lx = dx * Math.cos(rot) - dz * Math.sin(rot), lz = dx * Math.sin(rot) + dz * Math.cos(rot);
      const base = o.datos.y ?? T.altura(o.datos.x, o.datos.z);
      const py = Number.isFinite(pos.y) ? pos.y : base;
      if (Math.abs(lx) <= o.plano.ancho / 2 && Math.abs(lz) <= o.plano.fondo / 2 && py < base + o.plano.alto + 0.5) return o;
    }
    return null;
  }
  // 3.6.2 (visual): los techos de lo que construiste cerca de `pos`, para que no llueva abajo (el formato
  // de `cubierta` en techo-lluvia.js): las galerías e invernaderos, los techos de los módulos y los
  // refugios de una pieza. Sólo lo terminado. `firma`: cambia cuando cambia algo de eso.
  function cubiertasLluvia(pos, radio = 70) {
    const lista = [];
    if (!pos) return lista;
    for (const o of obrasCerca(pos, radio, [])) {
      const P = o.plano, d = o.datos;
      if (!P || !d || d.etapas < P.etapas.length || !Number.isFinite(d.x) || !Number.isFinite(d.z)) continue;
      const rot = d.rot || 0, base = Number.isFinite(d.y) ? d.y : T.altura(d.x, d.z);
      const rect = (ancho, fondo, y, o2 = {}) => lista.push({ x: d.x, z: d.z, rot, x0: -ancho / 2, x1: ancho / 2, z0: -fondo / 2, z1: fondo / 2, y, ax: 0, ab: 0, az: 0, ...o2 });
      // (el alero: techo a una agua de 2,62 m atrás a 2,22 m adelante)
      if (P.id === 'alero') rect(P.ancho, P.fondo, base + 2.38, { az: -0.14 });
      else if (P.cubreArea) rect(P.ancho || 3, P.fondo || 3, base + (P.alto || 2.4) - 0.3);
      else if (P.snap?.tipo === 'techo') rect(P.ancho || 3.45, P.fondo || 3.45, base);
      else if (P.habitable && !P.snap) rect((P.ancho || 3) + 0.4, (P.fondo || 3) + 0.4, base + Math.max(1.25, (P.alto || 2.3) - 0.1));
    }
    return lista;
  }
  function firmaCubiertas() {
    let s = obras.length;
    for (const o of obras) s += (o.datos.etapas || 0) * 0.37 + (o.datos.x || 0) * 0.013 + (o.datos.z || 0) * 0.017;
    return s;
  }
  function bajoCubierta(pos) {
    const pieza = cubiertaDePieza(pos);
    if (pieza) return { base: pieza, cubierta: { id: pieza.plano.id === 'invernadero' ? 'techo-una-agua' : 'alero' }, pieza: pieza.plano.id };
    for (const base of obrasCerca(pos, 12, [])) {
      const tipo = base.plano.snap?.tipo;
      if ((tipo !== 'piso' && tipo !== 'entrepiso') || base.datos.etapas < base.plano.etapas.length) continue;
      const estado = estadoModulo(base);
      if (!estado?.cubierta) continue;
      if (posicionDentroEstado(pos, estado, 0.04)) return estado;
    }
    return null;
  }

  function estadoHabitat(pos, contexto = {}) {
    const estado = baseQueContiene(pos) || estadoModuloCerca(pos, 5.8);
    if (!estado) return null;
    const red = redInterior(estado.base);
    const nodos = red.length ? red : [{ estado, factor: 1, saltos: 0 }];
    // 2.4.1: una pared (la del hogar) vive en el borde del módulo: margen chico
    const equipamientoEstado = (e) => obrasCerca(e.base.datos, 6, []).filter((o) => o !== edicion?.obra && dentroDelModulo(o, e, o.plano.snap?.tipo === 'muro' ? 0.02 : 0.18))
      .filter((o) => (o.plano.confort || 0) > 0 || (o.plano.funciones || []).length || o.plano.fuego || o.plano.luzInterior);
    const detalle = equipamientoEstado(estado);
    const confortMuebles = detalle.reduce((n, o) => n + (o.plano.confort || 0), 0);
    const confortBase = estado.habitable ? 2 : estado.protegido ? 1 : 0;
    const confort = Math.min(10, confortBase + confortMuebles);
    const redEquip = nodos.map((n) => ({ ...n, equipamiento: equipamientoEstado(n.estado) }));
    const cama = redEquip.some((n) => n.equipamiento.some((o) => (o.plano.funciones || []).includes('dormir')));
    const luzLocal = detalle.some((o) => !!o.plano.luzInterior);
    let luzPropagada = 0;
    for (const n of redEquip) if (n.estado.base !== estado.base && n.equipamiento.some((o) => !!o.plano.luzInterior)) luzPropagada = Math.max(luzPropagada, n.factor);
    const luz = luzLocal || luzPropagada >= 0.48;
    const fuenteCalor = redEquip.flatMap((n) => n.equipamiento.map((o) => ({ o, factor: n.factor, estado: n.estado })))
      .find((x) => !!x.o.plano.fuego || (x.o.plano.funciones || []).includes('calor')) || null;
    const fuego = contexto.fuego;
    let calorFactor = 0, origenCalor = null;
    if (fuego && Number.isFinite(fuego.x)) {
      for (const n of nodos) if (posicionDentroEstado(fuego, n.estado, 0.02) && n.factor >= calorFactor) {
        calorFactor = n.factor; origenCalor = n.estado.base;
      }
    }
    const calorActivo = calorFactor >= 0.12;
    const calorPropagado = calorActivo && origenCalor && origenCalor !== estado.base;
    const proteccionLluvia = estado.cubierta ? (estado.habitable ? 1 : estado.protegido ? 0.88 : 0.65) : 0;
    const proteccionViento = Math.min(1, estado.cierresEfectivos / 4) * (estado.cubierta ? 1 : 0.82);
    const calidad = Math.round(clamp((proteccionLluvia * 0.34 + proteccionViento * 0.32 + confort / 10 * 0.24 + calorFactor * 0.10) * 100, 0, 100));
    const confortCasa = Math.min(10, Math.max(confort, Math.round(redEquip.reduce((n, x) => n + x.factor * (2 + x.equipamiento.reduce((a, o) => a + (o.plano.confort || 0), 0)), 0) / Math.max(1, redEquip.reduce((n, x) => n + x.factor, 0)))));
    return { ...estado, equipamiento: detalle, confort, confortCasa, cama, luz, luzLocal, luzPropagada, fuenteCalor: fuenteCalor?.o || null,
      calorActivo, calorPropagado, calorFactor, proteccionLluvia, proteccionViento, calidad, ambientesConectados: nodos.length, areaInterior: nodos.length * 9, redInterior: nodos };
  }

  function piezaCerca(pos, radio, { terminada = false } = {}) {
    const candidatas = obrasCerca(pos, radio, []).filter((o) => o.plano.pieza && o.datos.etapas > 0 &&
      (!terminada || o.datos.etapas >= o.plano.etapas.length) &&
      Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) < radio);
    if (!candidatas.length) return null;
    const preferidas = planoElegido ? candidatas.filter((o) => o.plano.id === planoElegido.id) : [];
    const bolsa = preferidas.length ? preferidas : candidatas;
    let mejor = null, d0 = Infinity;
    for (const o of bolsa) {
      const dy = (o.datos.y || 0) - (pos.y || 0);
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z, dy * 0.22);
      if (d < d0) { d0 = d; mejor = o; }
    }
    return mejor;
  }

  function iniciarEdicionCerca(pos, radio = 5) {
    if (edicion) return { ok: false, motivo: 'Ya estás moviendo una pieza' };
    const mejor = piezaCerca(pos, radio, { terminada: true });
    if (!mejor) return { ok: false, motivo: 'No hay una pieza terminada cerca para mover' };
    const deps = dependenciasSobre(mejor);
    if (deps.length) return { ok: false, motivo: `Primero mové o desmontá ${deps.length === 1 ? 'la pieza apoyada encima' : `las ${deps.length} piezas apoyadas encima`}` };
    elegir(mejor.plano);
    edicion = { obra: mejor, original: { x: mejor.datos.x, z: mejor.datos.z, y: mejor.datos.y, rot: mejor.datos.rot } };
    rotacionFantasma = mejor.datos.rot || 0;
    if (interacciones?.eliminarPorDuenio) interacciones.eliminarPorDuenio(mejor);
    if (col.eliminarPorDuenio) col.eliminarPorDuenio(mejor);
    mejor.fisica.clear();
    mejor.grupo.visible = false;
    ultimoEstado = null;
    return { ok: true, obra: mejor, plano: mejor.plano };
  }

  function confirmarEdicion(x, z, yaw, alturaReferencia = null) {
    if (!edicion) return { ok: false, motivo: 'No hay una pieza en edición' };
    const obra = edicion.obra, plano = obra.plano;
    const rot = anguloFantasma(yaw);
    const t = resolverSnap(x, z, plano, rot, obra);
    const r = revisarSitio(t.x, t.z, plano, t.rot, obra, t.base, alturaReferencia);
    if (!r.ok) return r;
    obra.datos.x = t.x; obra.datos.z = t.z; obra.datos.rot = t.rot;
    obra.x = t.x; obra.z = t.z;
    obra.datos.y = r.base ?? baseColocacion(t.x, t.z, plano, alturaReferencia);
    obra.grupo.position.set(obra.datos.x, obra.datos.y, obra.datos.z);
    obra.grupo.rotation.y = obra.datos.rot;
    obra.grupo.visible = true;
    reindexarObras();
    edicion = null;
    rehacer(obra);
    ultimoEstado = null;
    return { ok: true, obra, datos: obra.datos, snap: t.snap };
  }

  function cancelarEdicion() {
    if (!edicion) return { ok: false, motivo: 'No hay una edición activa' };
    const obra = edicion.obra;
    obra.grupo.visible = true;
    edicion = null;
    rehacer(obra);
    ultimoEstado = null;
    return { ok: true, obra };
  }

  function desmontarCerca(pos, radio = 4.5) {
    if (edicion) return { ok: false, motivo: 'Terminá o cancelá la edición antes de desmontar' };
    const mejor = piezaCerca(pos, radio);
    if (!mejor) return { ok: false, motivo: 'No hay una pieza construida cerca' };
    const deps = dependenciasSobre(mejor);
    if (deps.length) return { ok: false, motivo: `Tiene ${deps.length === 1 ? 'una pieza apoyada' : `${deps.length} piezas apoyadas`} encima` };
    const recupera = {};
    for (let i = 0; i < Math.min(mejor.datos.etapas, mejor.plano.etapas.length); i++) {
      for (const [k, n] of Object.entries(mejor.plano.etapas[i].pide || {})) {
        // 3.5.1: lo que costó 1 no vuelve entero: armar y desmontar un seto (1 tronco, 1 piedra) daba
        // experiencia de constructor gratis y, con el ahorro del oficio, material sin fin
        if (n > 1) recupera[k] = (recupera[k] || 0) + Math.max(1, Math.floor(n * 0.5));
      }
    }
    retirarObra(mejor);
    return { ok: true, plano: mejor.plano, datos: mejor.datos, recupera };
  }

  // 1.8: deshacer la última etapa de una obra grande, devolviendo la mitad de lo que
  // costó. Es el equivalente de `desmontarCerca` para lo que se levanta por partes:
  // te equivocaste de techo y no querés tirar abajo la casa entera.
  function deshacerEtapa(pos, radio = 6) {
    if (edicion) return { ok: false, motivo: 'Terminá o cancelá la edición antes de deshacer' };
    let mejor = null, d0 = radio;
    for (const o of obrasCerca(pos, radio, [])) {
      if (o.plano.pieza || o.datos.etapas <= 0) continue;
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z);
      if (d < d0) { d0 = d; mejor = o; }
    }
    if (!mejor) return { ok: false, motivo: 'No hay ninguna obra empezada cerca' };
    const deps = dependenciasSobre(mejor);
    if (deps.length) return { ok: false, motivo: `Tiene ${deps.length === 1 ? 'una pieza apoyada' : `${deps.length} piezas apoyadas`} encima` };
    const etapa = mejor.plano.etapas[mejor.datos.etapas - 1];
    const recupera = {};
    for (const [k, n] of Object.entries(etapa?.pide || {})) if (n > 1) recupera[k] = Math.max(1, Math.floor(n * 0.5));   // 3.5.1: ídem
    mejor.datos.etapas--;
    rehacer(mejor);
    ultimoEstado = null;
    return { ok: true, plano: mejor.plano, datos: mejor.datos, etapa, recupera, quedaMarca: mejor.datos.etapas === 0 };
  }

  // 1.8: copiar el plano de lo que tenés enfrente, con su rotación, para repetirlo
  // sin volver al panel a buscarlo.
  // 2.4: teñir la pieza de pared, techo o piso más cercana. Devuelve la obra y su tinte
  // anterior; el costo lo cobra el juego.
  function tenibleCerca(pos, radio = 4) {
    let mejor = null, d0 = radio;
    for (const o of obrasCerca(pos, radio, [])) {
      if (o === edicion?.obra || !tenible(o.plano) || o.datos.etapas < o.plano.etapas.length) continue;
      const dy = Math.abs((o.datos.y ?? pos.y) + 1.1 - pos.y);
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) + dy * 0.5;
      if (d < d0) { d0 = d; mejor = o; }
    }
    return mejor;
  }
  function tenir(obra, tinte) {
    if (!obra || !tenible(obra.plano)) return false;
    obra.datos.tinte = tinte && Object.hasOwn(TINTES, tinte) ? tinte : null;
    delete obra.datos.pintura;   // 2.8: teñir con T le gana a la pintura del panel
    if (!obra.datos.tinte) delete obra.datos.tinte;
    rehacer(obra);
    return true;
  }
  function copiarCerca(pos, radio = 6) {
    let mejor = null, d0 = radio;
    for (const o of obrasCerca(pos, radio, [])) {
      if (o.datos.etapas <= 0) continue;
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z);
      if (d < d0) { d0 = d; mejor = o; }
    }
    if (!mejor) return { ok: false, motivo: 'Poné el cuerpo cerca de lo que querés repetir' };
    elegir(mejor.plano);
    rotacionFantasma = mejor.datos.rot || 0;
    return { ok: true, plano: mejor.plano, rot: rotacionFantasma };
  }

  // Una marca sin materiales se puede retirar sin dejar física ni basura de
  // guardado. Sólo aplica a etapa 0: una obra ya empezada representa trabajo
  // real y no se borra accidentalmente con una tecla.
  function cancelarMarcada(pos, radio = 9, planoId = null) {
    let mejor = null, d0 = radio;
    for (const o of obrasCerca(pos, radio)) {
      if (o.datos.etapas !== 0) continue;
      if (planoId && o.plano.id !== planoId) continue;
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z);
      if (d < d0) { d0 = d; mejor = o; }
    }
    if (!mejor) return { ok: false, motivo: 'No hay una marca sin empezar cerca' };
    retirarObra(mejor);
    return { ok: true, datos: mejor.datos, plano: mejor.plano };
  }

  // Avanzar una etapa: se descuentan los materiales y se rehace la malla
  function avanzar(obra, materiales) {
    const etapa = obra.plano.etapas[obra.datos.etapas];
    if (!etapa) return { ok: false, motivo: 'Ya está terminada' };
    const falta = faltan(etapa.pide, materiales);
    if (falta.length) return { ok: false, motivo: `Faltan ${falta.join(' y ')}`, etapa };
    for (const [k, n] of Object.entries(etapa.pide)) materiales[k] -= n;
    const eraMarca = obra.datos.etapas === 0;
    obra.datos.etapas++;
    if (eraMarca) nivelarSitio(obra.datos, obra.plano);
    rehacer(obra);
    return { ok: true, etapa, terminada: obra.datos.etapas >= obra.plano.etapas.length };
  }

  // Modo Desafío: una pieza derribada por los invasores se cae junto con todo lo
  // que tenía apoyado encima (un techo no queda flotando sobre una pared caída).
  function destruir(obra) {
    if (!obra || !obras.includes(obra)) return [];
    if (edicion?.obra === obra) cancelarEdicion();
    const caidas = [];
    const pila = [obra];
    while (pila.length) {
      const o = pila.pop();
      if (caidas.includes(o)) continue;
      caidas.push(o);
      for (const d of dependenciasSobre(o)) pila.push(d);
    }
    for (const o of caidas) retirarObra(o);
    ultimoEstado = null;
    return caidas;
  }

  function sincronizar(lista) {
    for (const d of lista || []) {
      // 2.4.1: una obra rota no puede tirar el armado del bosque entero
      if (!d || typeof d !== 'object' || !Number.isFinite(d.x) || !Number.isFinite(d.z)) continue;
      const p = Object.hasOwn(PLANO, d.plano) ? PLANO[d.plano] : null;   // 2.6.1: ver colocar()
      // Limpia marcadores huérfanos de piezas creados por versiones anteriores.
      if (!p || (p.pieza && (d.etapas || 0) <= 0)) continue;
      // una partida retocada (o de otra versión) puede traer más etapas de las que tiene
      d.etapas = Math.max(0, Math.min(p.etapas.length, Math.floor(Number(d.etapas) || 0)));
      if (!Number.isFinite(d.rot)) d.rot = 0;
      colocar(d);
    }
  }

  function dentro(pos) {
    const cercanas = obrasCerca(pos, 12, []);
    for (const o of cercanas) {
      if (!o.plano.habitable || o.datos.etapas < o.plano.etapas.length) continue;
      const P = o.plano, rot = o.datos.rot;
      const dx = pos.x - o.datos.x, dz = pos.z - o.datos.z;
      const lx = dx * Math.cos(rot) - dz * Math.sin(rot);
      const lz = dx * Math.sin(rot) + dz * Math.cos(rot);
      const baseY = Number.isFinite(o.datos.y) ? o.datos.y : T.altura(o.datos.x, o.datos.z);
      const py = Number.isFinite(pos.y) ? pos.y : baseY + 0.6;
      // Los refugios prefabricados son de una sola planta. Antes `dentro()` sólo
      // miraba X/Z: estar sobre el techo o debajo del piso contaba como interior.
      const dentroVertical = py >= baseY - 0.30 && py <= baseY + Math.max(1.25, (P.alto || 2.3) - 0.35);
      if (dentroVertical && Math.abs(lx) < P.ancho / 2 && Math.abs(lz) < P.fondo / 2) return o;
    }
    // Una habitación modular completamente cerrada ahora es refugio real para
    // las mecánicas que consultan `dentro`, no sólo una composición visual.
    for (const base of obras) {
      const tipo = base.plano.snap?.tipo;
      if ((tipo !== 'piso' && tipo !== 'entrepiso') || base.datos.etapas < base.plano.etapas.length) continue;
      const rot = base.datos.rot || 0, dx = pos.x - base.datos.x, dz = pos.z - base.datos.z;
      const lx = dx * Math.cos(rot) - dz * Math.sin(rot);
      const lz = dx * Math.sin(rot) + dz * Math.cos(rot);
      const piso = cotaSuperiorPiso(base);
      const py = Number.isFinite(pos.y) ? pos.y : piso + 0.2;
      if (!(Math.abs(lx) < (base.plano.ancho || 3) / 2 - 0.08 && Math.abs(lz) < (base.plano.fondo || 3) / 2 - 0.08 &&
          py >= piso - 0.35 && py <= piso + 2.55)) continue;
      // 2.6.1: el análisis del módulo (recorre todas las obras varias veces) sólo
      // para la base que de verdad contiene al jugador, no para cada piso del mapa.
      if (estadoModulo(base)?.habitable) return base;
    }
    return null;
  }

  function reemplazarPlano(obra, nuevoId) {
    const nuevo = Object.hasOwn(PLANO, nuevoId) ? PLANO[nuevoId] : null;
    if (!obra || !nuevo || !obras.includes(obra)) return false;
    obra.datos.plano = nuevoId;
    obra.datos.etapas = nuevo.etapas.length;
    obra.datos.vida = undefined;
    obra.plano = nuevo;
    rehacer(obra);
    ultimoEstado = null;
    return true;
  }

  // ¿El portón de esta obra está abierto? (lo consulta el Desafío para flechas y paso)
  function portonAbierto(obra) {
    const a = interacciones?.aperturaPorDuenio?.(obra);
    return !!a && a.abierta > 0.6;
  }

  // 2.8: "Personalizar" cambió el estilo: se rehacen sólo las obras cuya firma cambió
  // (ver estilo-casa.js). Con el estilo de siempre no se toca ninguna.
  function repintar() {
    let n = 0;
    for (const o of [...obras]) {
      if (o === edicion?.obra) continue;
      if (firmaEstiloObra(o.plano, o.datos) === (o.firmaEstilo || '')) continue;
      rehacer(o);
      n++;
    }
    if (n) ultimoEstado = null;
    return n;
  }
  // 2.8: pintura propia para una casa (las piezas que `agruparCasas` juntó). null la saca
  // y la casa vuelve a la paleta general.
  function pintarCasa(piezas, pintura) {
    let n = 0;
    for (const o of piezas || []) {
      if (!obras.includes(o) || o.plano.categoria !== 'refugios') continue;
      if (pintura && typeof pintura === 'object') o.datos.pintura = { pared: pintura.pared || null, aberturas: pintura.aberturas || null, techo: pintura.techo || null };
      else delete o.datos.pintura;
      rehacer(o);
      n++;
    }
    return n;
  }
  // 2.8: lleva la paleta actual del jardín a lo ya plantado (canteros, setos, sendas).
  function restilizarJardin(tipo = null) {
    let n = 0;
    for (const o of obras) {
      if (!o.plano.jardin || (tipo && o.plano.jardin !== tipo) || o === edicion?.obra) continue;
      const nuevo = ESTILO.jardin?.[o.plano.jardin];
      if (!nuevo || o.datos.jardin === nuevo) continue;
      o.datos.jardin = nuevo;
      rehacer(o);
      n++;
    }
    return n;
  }

  return { repintar, pintarCasa, restilizarJardin, casas: (desde = null) => agruparCasas(obras, desde),
    elegir, girar, moverFantasma, fundar, avanzar, alternarSnap, iniciarEdicionCerca, confirmarEdicion, cancelarEdicion, desmontarCerca, deshacerEtapa, copiarCerca, tenibleCerca, tenir, cubiertaDePieza,
    destruir, portonAbierto, reemplazarPlano, obrasCerca: (pos, radio, salida = []) => obrasCerca(pos, radio, salida),
    cancelarMarcada, obraCerca, tieneFuncionCerca, sincronizar, dentro, estadoModulo, estadoModuloCerca, estadoHabitat, redInterior, bajoCubierta, cubiertasLluvia, firmaCubiertas, actualizarAmbiente, obras, revisarSitio,
    get plano() { return planoElegido; }, get rotacion() { return rotacionFantasma || 0; }, get estadoSitio() { return ultimoEstado; },
    get snapActivo() { return snapActivo; }, get editando() { return edicion?.obra || null; } };
}
