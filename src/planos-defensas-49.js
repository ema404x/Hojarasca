// 4.9 defensas: dos piezas nuevas de la base del Desafío, como las del fortín (mismas reglas: sólo tipo 0 y 4, la
// colisión sale de `fisica(h)`, el frente mira a -z).
//   · la trampa de miel (reglas en desafio-trampas.js);
//   · el pasadizo de escape (reglas en desafio-pasadizo.js).
// Lo que hacen de noche vive en desafio-trampas-mundo.js y desafio-pasadizo-mundo.js.
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { calce } from './calces.js';
import { MIEL } from './desafio-trampas.js';
import { PASADIZO } from './desafio-pasadizo.js';

const MADERA = '#6b5238';
const MADERA_OSCURA = '#4a3b2c';
const TABLA = '#8a6b4a';
const PIEDRA = '#7d766c';

export const PIEZAS_DEFENSAS_49 = [
  {
    id: 'trampa-miel', nombre: 'Trampa de miel', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.1, ancho: 2.2, fondo: 2.2, alto: 0.35, separacion: 1.6, vida: 90,
    texto: `Una bandeja de tablas con miel espesa. El duende que la pisa queda pegado tres o cuatro segundos, lamiendo: sin poder correr ni atacar. Aguanta ${MIEL.usos} duendes; después la miel se seca y se repone con E (un frasco). Si le cae una brasa, arde y quema a los pegados.`,
    pide: { tabla: 2 }, pendienteMax: 0.5, distSendero: 0,
    defensa: { tipo: 'miel', sinCuerpo: true },
    arma(c, P, datos, suelo) {
      // la bandeja de tablas, con el borde levantado, sobre unas piedras que la calzan en la ladera
      c.agregar(new THREE.CylinderGeometry(1.0, 1.04, 0.07, 14), { color: MADERA_OSCURA, tipo: 0, variar: 0.08, matriz: matriz([0, 0.05, 0]) });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.15, x = Math.cos(a) * 1.02, z = Math.sin(a) * 1.02;
        c.agregar(new THREE.BoxGeometry(0.66, 0.22, 0.07), { color: i % 3 ? TABLA : MADERA, tipo: 0, variar: 0.1,
          matriz: matriz([x, 0.14, z], [0.1, -a + Math.PI / 2, 0]) });
        calce(c, suelo, x, z, 0.02, 0.22, PIEDRA, 4);
      }
      // las piedras de afuera y la cuchara de palo clavada al borde
      for (let i = 0; i < 4; i++) {
        const a = 0.6 + i * 1.55;
        c.agregar(new THREE.IcosahedronGeometry(0.17, 0), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([Math.cos(a) * 1.28, 0.1, Math.sin(a) * 1.28], [i, i * 1.7, 0], [1.2, 0.7, 1]) });
      }
      c.agregar(new THREE.CylinderGeometry(0.025, 0.03, 0.9, 5), { color: MADERA, tipo: 0, matriz: matriz([0.95, 0.5, -0.55], [0.5, 0, -0.35]) });
      c.agregar(new THREE.SphereGeometry(0.09, 6, 5), { color: MADERA, tipo: 0, matriz: matriz([1.12, 0.9, -0.43], [0, 0, 0], [1, 0.5, 1.2]) });
    },
  },
  {
    id: 'pasadizo', nombre: 'Pasadizo de escape', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.2, ancho: 2.2, fondo: 2.2, alto: 0.6, separacion: 4, vida: 400,
    texto: `Un túnel de ${PASADIZO.largo} metros con dos bocas: una tapa de tablas (la de adentro de la base, donde la ponés) y un tronco hueco disimulado entre las ramas (la de afuera, ${PASADIZO.largo} m adelante: girala con R hacia donde querés salir). Con E en una boca bajás y salís por la otra: para escapar por atrás y volver a entrar cuando caen las defensas. Los duendes no lo ven ni lo usan.`,
    pide: { tronco: 4, tabla: 6, piedra: 3 }, pendienteMax: 0.45, distSendero: 0,
    // sinCuerpo: los duendes y los tiros lo pasan por alto (no es pared ni blanco); oculta: no cuenta como defensa
    defensa: { tipo: 'pasadizo', oculta: true, sinCuerpo: true },
    // la boca de afuera ocupa lo suyo: no puede caer encima de una pared, una torre o un mueble alto
    huellasExtra: [{ lx: 0, lz: PASADIZO.largo, ancho: 2.0, fondo: 2.6 }],
    // el terreno de la boca de afuera: ni agua, ni pendiente brava, ni más de 2,4 m arriba o abajo de la de adentro
    revisarLugar({ T, x, z, rot, base }) {
      const bx = x + PASADIZO.largo * Math.sin(rot), bz = z + PASADIZO.largo * Math.cos(rot);
      if (T.agua(bx, bz)) return { ok: false, motivo: 'La boca de afuera caería en el agua: girala (R)' };
      if (Math.abs(T.altura(bx, bz) - base) > PASADIZO.desnivelMax) return { ok: false, motivo: 'La boca de afuera queda muy alta o muy baja: girala (R) o buscá otro lugar' };
      const n = T.normal(bx, bz);
      if (Math.acos(Math.max(-1, Math.min(1, n.y))) > PASADIZO.pendienteMax) return { ok: false, motivo: 'La boca de afuera caería en una pendiente: girala (R)' };
      return { ok: true };
    },
    // la boca de afuera se despeja de matas y árboles como el centro de cualquier pieza
    despejaExtra: [{ lx: 0, lz: PASADIZO.largo, r: 1.3 }],
    arma(c, P, datos, suelo) {
      const L = PASADIZO.largo, yB = suelo ? suelo(0, L) : 0;
      // --- la boca de adentro: un montículo de tierra con la tapa de tablas y un aro para tirar
      c.agregar(new THREE.IcosahedronGeometry(0.95, 1), { color: '#5a4a37', tipo: 4, variar: 0.1, matriz: matriz([0, 0.02, 0], [0, 0.4, 0], [1, 0.34, 1]) });
      for (let i = 0; i < 3; i++) {
        c.agregar(new THREE.BoxGeometry(0.34, 0.05, 0.92), { color: i % 2 ? TABLA : MADERA, tipo: 0, variar: 0.1, matriz: matriz([-0.35 + i * 0.35, 0.34, 0], [0, 0, 0]) });
      }
      for (const z of [-0.36, 0.36]) c.agregar(new THREE.BoxGeometry(1.08, 0.05, 0.07), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, 0.39, z]) });
      c.agregar(new THREE.TorusGeometry(0.1, 0.018, 5, 10), { color: '#3c3a36', tipo: 4, matriz: matriz([0, 0.43, 0], [Math.PI / 2 - 0.5, 0, 0]) });
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9 + 0.3, r = 0.98 + (i % 2) * 0.1;
        c.agregar(new THREE.IcosahedronGeometry(0.15, 0), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([Math.cos(a) * r, 0.07, Math.sin(a) * r], [i, i * 1.3, 0], [1.2, 0.7, 1]) });
        calce(c, suelo, Math.cos(a) * r, Math.sin(a) * r, 0.0, 0.16, PIEDRA, 4);
      }
      // --- la boca de afuera: un tronco hueco tirado, con musgo, ramas y la entrada oscura hacia afuera
      const oy = yB + 0.5;
      c.agregar(new THREE.CylinderGeometry(0.46, 0.5, 1.7, 9), { color: '#5b4a36', tipo: 0, variar: 0.1, matriz: matriz([0, oy, L], [Math.PI / 2, 0, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 9), { color: '#1d1712', tipo: 0, matriz: matriz([0, oy, L + 0.84], [Math.PI / 2, 0, 0]) });
      c.agregar(new THREE.SphereGeometry(0.42, 7, 5), { color: '#4f6b3a', tipo: 0, variar: 0.12, matriz: matriz([0.06, oy + 0.4, L - 0.2], [0, 0.3, 0], [1.1, 0.5, 1.5]) });
      for (let i = 0; i < 6; i++) {
        const a = Math.PI + (i - 2.5) * 0.45, r = 0.75 + (i % 2) * 0.2;
        c.agregar(new THREE.CylinderGeometry(0.02, 0.035, 1.1, 4), { color: i % 2 ? MADERA : MADERA_OSCURA, tipo: 0,
          matriz: matriz([Math.cos(a) * r * 0.9, yB + 0.4, L - 0.3 + Math.sin(a) * r], [0.9 * Math.sin(a), i, 0.9 * Math.cos(a)]) });
      }
      for (let i = 0; i < 5; i++) {
        const a = i * 1.4 + 0.5;
        c.agregar(new THREE.IcosahedronGeometry(0.17, 0), { color: PIEDRA, tipo: 4, variar: 0.16, matriz: matriz([Math.cos(a) * 0.75, yB + 0.06, L + Math.sin(a) * 0.75], [i, i * 1.1, 0], [1.2, 0.7, 1]) });
      }
      calce(c, suelo, 0, L, yB + 0.0, 0.5, '#5b4a36', 0);
    },
    // las dos bocas se rodean (nadie se mete adentro de la tapa ni del tronco): el montículo y el tronco hueco
    fisica(h) {
      h.circulo(0, 0, 0.78, -0.05, 0.48);
      const s = h.suelo ? h.suelo(0, PASADIZO.largo) : 0;
      h.segmento(0, PASADIZO.largo - 0.8, 0, PASADIZO.largo + 0.8, 0.5, s - 0.05, s + 1.0);
    },
  },
];
