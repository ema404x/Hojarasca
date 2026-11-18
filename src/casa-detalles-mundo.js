// 4.31.0 (A): lo que se ve de las cosas que se tocan en el refugio (ver casa-detalles.js): la lámpara de la mesa, las velas de la repisa, el
// fuego del hogar y la pava en su trébede, la silla de la mesa y el sillón junto al hogar, el cajón de la mesa, la alacena con la radio y las
// cartas encima, el baúl, el libro sobre la cama, el reloj de pared (con su péndulo y sus agujas en la hora del juego), las cortinas y las
// hojas de las dos ventanas, y afuera la bomba de agua con su balde. Más un chorro de agua que sirve para la bomba y para la canilla o el
// barril de tus casas armadas.
//
// Sin luces nuevas ni programas nuevos: los cuerpos usan el material de colores por vértice de siempre (`materialVegetal` sin viento, como
// refugiovivo.js) y lo que brilla (la llama, el vidrio de la lámpara, el dial de la radio, el agua) un material básico de dos caras sin
// transparencia, el mismo que los vidrios de las casas. Todo cuelga del refugio (el LOD lo apaga con él) y, lejos, ni se mueve.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { COSAS_REFUGIO, PISO_REFUGIO } from './casa-detalles.js';

const MADERA = '#6b5238', MADERA_OSCURA = '#4a3b2c', TABLA = '#8a6b4a', HIERRO = '#3c3a38', LATA = '#8a8d90';
const P = PISO_REFUGIO;
const lerp = (a, b, t) => a + (b - a) * t;

export function crearCasaDetallesMundo({ T, ref, raiz = null, escena, col = null }) {
  const rot = ref.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot);
  const aMundo = (lx, ly, lz) => ({ x: ref.x + lx * cr + lz * sr, y: ref.y + ly, z: ref.z - lx * sr + lz * cr });
  const sueloLocal = (lx, lz) => { const q = aMundo(lx, 0, lz); return T.altura(q.x, q.z) - ref.y; };
  const grupo = new THREE.Group();
  grupo.name = 'refugio:detalles';
  grupo.position.set(ref.x, ref.y, ref.z);
  grupo.rotation.y = rot;
  (raiz || escena).add(grupo);
  if (raiz) { grupo.updateMatrixWorld(true); }

  const mat = materialVegetal({ flex: 0 });
  const basico = (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const matLlama = basico(0xffa040), matVidrio = basico(0x3a3328), matDial = basico(0x2a2420), matAgua = basico(0xb8d4e2);
  const caja = (c, p, s, color, r = [0, 0, 0], tipo = 4, variar = 0.08) => c.agregar(new THREE.BoxGeometry(s[0], s[1], s[2]), { color, tipo, variar, matriz: matriz(p, r) });
  const cil = (c, p, r0, r1, h, color, lados = 8, r = [0, 0, 0], tipo = 4) => c.agregar(new THREE.CylinderGeometry(r0, r1, h, lados), { color, tipo, variar: 0.06, matriz: matriz(p, r) });
  const malla = (c, m = mat, padre = grupo) => { const o = new THREE.Mesh(c.geometria(), m); padre.add(o); return o; };
  // una pieza que se mueve: su geometría, armada alrededor de su eje, en un grupo puesto en el eje
  const pieza = (pos, armar, m = mat) => { const g = new THREE.Group(); g.position.set(...pos); grupo.add(g); const c = new Constructor(); armar(c); malla(c, m, g); return g; };

  // ---------------------------------------------------------------- lo quieto (una sola malla)
  const c = new Constructor();
  // la lámpara de kerosén (la base y el tanque; el tubo de vidrio brilla aparte)
  cil(c, [0.95, 0.9, -1.3], 0.075, 0.085, 0.02, LATA, 12);
  cil(c, [0.95, 0.96, -1.3], 0.06, 0.075, 0.1, '#9a7a3a', 12);
  cil(c, [0.95, 1.025, -1.3], 0.03, 0.03, 0.03, LATA, 8);
  c.agregar(new THREE.TorusGeometry(0.05, 0.006, 4, 10), { color: LATA, tipo: 4, variar: 0, matriz: matriz([1.02, 0.98, -1.3], [0, 0, Math.PI / 2]) });
  // las velas de la repisa del hogar, en sus candeleros
  for (const x of [-2.95, -1.85]) {
    cil(c, [x, 1.645, -2.05], 0.055, 0.065, 0.03, '#8a6a3a', 10);
    cil(c, [x, 1.74, -2.05], 0.022, 0.022, 0.17, '#efe6cf', 8);
  }
  // el fuego del hogar: los leños en la boca y la trébede con la pava
  for (const [a, dz] of [[0.35, 0], [-0.35, 0.04], [0, 0.08]]) cil(c, [-2.4, P + 0.06, -1.74 + dz], 0.045, 0.05, 0.62, a ? '#4a3626' : '#5b4430', 7, [0, a, Math.PI / 2], 0);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.3; cil(c, [-2.02 + Math.cos(a) * 0.1, P + 0.12, -1.72 + Math.sin(a) * 0.1], 0.008, 0.008, 0.26, HIERRO, 4, [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]); }
  c.agregar(new THREE.TorusGeometry(0.11, 0.008, 4, 12), { color: HIERRO, tipo: 4, variar: 0, matriz: matriz([-2.02, P + 0.24, -1.72], [Math.PI / 2, 0, 0]) });
  cil(c, [-2.02, P + 0.33, -1.72], 0.09, 0.105, 0.17, '#7a7c7e', 12);                                     // la pava
  cil(c, [-1.84, P + 0.36, -1.72], 0.012, 0.02, 0.15, '#6a6c6e', 5, [0, 0, -0.95]);                        // el pico
  c.agregar(new THREE.TorusGeometry(0.075, 0.008, 4, 10, Math.PI), { color: '#3a3836', tipo: 4, variar: 0, matriz: matriz([-2.02, P + 0.43, -1.72]) });   // el asa
  // la silla de la mesa (de espaldas a la puerta, mirando a la mesa)
  {
    const x = 1.1, z = 0.0, y = P + 0.45;
    caja(c, [x, y, z], [0.44, 0.04, 0.42], TABLA);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) caja(c, [x + sx * 0.19, P + 0.22, z + sz * 0.18], [0.04, 0.45, 0.04], MADERA_OSCURA);
    for (const sx of [-1, 1]) caja(c, [x + sx * 0.19, y + 0.27, z + 0.18], [0.04, 0.54, 0.04], MADERA_OSCURA);
    for (const dy of [0.2, 0.4]) caja(c, [x, y + dy, z + 0.18], [0.38, 0.06, 0.025], TABLA);
  }
  // el sillón junto al hogar: madera y un cuero de oveja
  {
    const x = -1.45, z = -0.95, g = Math.atan2(-0.7, -0.72) + Math.PI;   // el respaldo, del lado contrario al fuego
    const en = (dx, y, dz) => [x + dx * Math.cos(g) + dz * Math.sin(g), y, z - dx * Math.sin(g) + dz * Math.cos(g)];
    caja(c, en(0, P + 0.36, 0), [0.7, 0.1, 0.62], MADERA, [0, g, 0]);
    caja(c, en(0, P + 0.44, -0.02), [0.62, 0.07, 0.56], '#e6dcc8', [0, g, 0], 4, 0.05);                    // el cuero
    caja(c, en(0, P + 0.75, 0.29), [0.7, 0.62, 0.08], MADERA, [-0.12, g, 0]);
    caja(c, en(0, P + 0.78, 0.25), [0.56, 0.5, 0.05], '#ddd2bc', [-0.12, g, 0], 4, 0.05);
    for (const s of [-1, 1]) caja(c, en(s * 0.33, P + 0.56, 0), [0.07, 0.07, 0.6], MADERA_OSCURA, [0, g, 0]);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) caja(c, en(sx * 0.3, P + 0.16, sz * 0.26), [0.06, 0.32, 0.06], MADERA_OSCURA, [0, g, 0]);
    for (const s of [-1, 1]) caja(c, en(s * 0.33, P + 0.44, 0.2), [0.05, 0.24, 0.05], MADERA_OSCURA, [0, g, 0]);
  }
  // la alacena contra la pared del fondo, entre el estante y la cama (las dos puertas se mueven aparte)
  {
    const x = 0.55, z = -2.36;
    caja(c, [x, P + 0.57, z - 0.17], [0.8, 1.14, 0.03], MADERA_OSCURA);               // el fondo
    for (const s of [-1, 1]) caja(c, [x + s * 0.385, P + 0.57, z], [0.03, 1.14, 0.38], MADERA);
    for (const y of [0.04, 0.52, 1.12]) caja(c, [x, P + y, z], [0.8, 0.03, 0.38], TABLA);
    caja(c, [x, P + 1.15, z + 0.01], [0.86, 0.04, 0.42], MADERA);                     // la tapa de arriba
    // adentro: la yerba, el azúcar, frascos y los platos
    for (let i = 0; i < 4; i++) cil(c, [x - 0.26 + i * 0.17, P + 0.62, z - 0.02], 0.055, 0.055, 0.17, ['#c9b98a', '#e8e2d2', '#9a6a2c', '#7a4a52'][i], 8);
    for (let i = 0; i < 3; i++) cil(c, [x - 0.16 + i * 0.16, P + 0.06 + 0.11, z], 0.12, 0.12, 0.012 + 0, '#ece6d8', 12, [Math.PI / 2 - 0.25, 0, 0]);
    caja(c, [x + 0.2, P + 0.16, z], [0.16, 0.22, 0.12], '#c8a04a');                    // el paquete de yerba
    // encima: la radio a pilas y las cartas atadas
    caja(c, [0.42, P + 1.27, -2.38], [0.32, 0.2, 0.15], '#5a3a2a', [0, 0.08, 0]);
    caja(c, [0.42, P + 1.27, -2.302], [0.26, 0.12, 0.004], '#c9bca4', [0, 0.08, 0], 4, 0.02);
    cil(c, [0.52, P + 1.44, -2.4], 0.004, 0.004, 0.28, HIERRO, 4, [0, 0, -0.35]);   // la antena
    for (let i = 0; i < 4; i++) caja(c, [0.8, P + 1.18 + i * 0.012, -2.3], [0.2, 0.01, 0.13], ['#efe6cf', '#e2d8bf', '#d8ccb0', '#efe6cf'][i], [0, 0.2 * (i % 2 ? 1 : -1), 0], 4, 0.03);
    caja(c, [0.8, P + 1.23, -2.3], [0.012, 0.012, 0.15], '#8a5a3a', [0, 0.1, 0]);       // el piolín
  }
  // el baúl contra la pared de la derecha (la tapa se mueve aparte); adentro, la frazada y el sombrero
  {
    const x = 3.05, z = -0.55;
    caja(c, [x, P + 0.24, z], [0.5, 0.48, 0.9], '#6b4e33');
    for (const s of [-1, 1]) caja(c, [x, P + 0.25, z + s * 0.33], [0.52, 0.5, 0.05], '#3f3830', [0, 0, 0], 4);
    caja(c, [x, P + 0.45, z - 0.15], [0.42, 0.06, 0.5], '#8a2f2a');
    cil(c, [x - 0.05, P + 0.47, z + 0.22], 0.16, 0.16, 0.03, '#3a2c20', 12);
  }
  // la losa de piedra delante de la boca del hogar, donde arde el fuego
  caja(c, [-2.4, P + 0.012, -1.66], [1.15, 0.025, 0.42], '#6f6b66', [0, 0, 0], 4, 0.12);
  // el libro sobre la cama, cerca de la almohada
  caja(c, [1.95, 0.83, -1.78], [0.17, 0.035, 0.24], '#2f4a3a', [0, 0.3, 0], 4, 0.05);
  caja(c, [1.95, 0.831, -1.78], [0.155, 0.03, 0.23], '#e8e0cc', [0, 0.3, 0], 4, 0.02);
  // el reloj de pared, en la pared de la puerta, entre la puerta y la ventana (mira para adentro: -z)
  {
    const x = 1.12, z = 2.53;
    caja(c, [x, 1.86, z], [0.32, 0.36, 0.1], '#5b3e28');
    cil(c, [x, 1.88, z - 0.051], 0.12, 0.12, 0.004, '#efe6cf', 16, [Math.PI / 2, 0, 0]);
    caja(c, [x, 1.5, z + 0.01], [0.22, 0.4, 0.06], '#5b3e28');
    caja(c, [x, 1.5, z - 0.025], [0.15, 0.32, 0.01], '#2a201a');
    caja(c, [x, 2.07, z], [0.36, 0.05, 0.12], '#4a3220');
  }
  // las barras de las cortinas, sobre las dos ventanas de adentro
  cil(c, [2.2, 1.97, 2.55], 0.012, 0.012, 1.5, MADERA_OSCURA, 6, [0, 0, Math.PI / 2]);
  cil(c, [-3.3, 1.97, 0], 0.012, 0.012, 1.5, MADERA_OSCURA, 6, [Math.PI / 2, 0, 0]);
  // afuera, contra la pared de la derecha: la bomba de agua sobre su base, con el balde abajo del pico
  const sB = sueloLocal(4.15, 1.2), sBalde = sueloLocal(4.4, 1.2);
  {
    const x = 4.15, z = 1.2;
    cil(c, [x, sB + 0.06, z], 0.22, 0.26, 0.14, '#7d7870', 9);
    cil(c, [x, sB + 0.5, z], 0.06, 0.07, 0.8, '#3f4a44', 10);
    cil(c, [x, sB + 0.92, z], 0.075, 0.075, 0.06, '#3f4a44', 10);
    cil(c, [x + 0.14, sB + 0.78, z], 0.02, 0.026, 0.24, '#3f4a44', 6, [0, 0, Math.PI / 2 + 0.25]);
    cil(c, [x - 0.07, sB + 0.98, z], 0.012, 0.012, 0.1, HIERRO, 4);
    cil(c, [4.4, sBalde + 0.12, z], 0.13, 0.1, 0.24, '#7d766c', 10);
    cil(c, [4.4, sBalde + 0.23, z], 0.115, 0.115, 0.005, '#6a8a9a', 10);
  }
  const quieto = malla(c);
  // lo que frena: el baúl, la alacena y la bomba (la silla y el sillón no, como el banco de la puerta: te sentás encima)
  const circulo = (lx, lz, r, y0, y1) => { const q = aMundo(lx, 0, lz); col?.agregar?.({ x: q.x, z: q.z, r, alturaMin: ref.y + y0, alturaMax: ref.y + y1 }); };
  circulo(3.05, -0.78, 0.27, P - 0.1, P + 0.75); circulo(3.05, -0.32, 0.27, P - 0.1, P + 0.75);
  circulo(0.35, -2.36, 0.21, P - 0.1, P + 1.4); circulo(0.75, -2.36, 0.21, P - 0.1, P + 1.4);
  circulo(4.15, 1.2, 0.22, sB - 0.1, sB + 1.1);
  quieto.receiveShadow = true;

  // ---------------------------------------------------------------- lo que se mueve o brilla
  const tuboLampara = pieza([0.95, 1.09, -1.3], (k) => {
    k.agregar(new THREE.SphereGeometry(0.05, 10, 8), { color: '#ffffff', tipo: 4, variar: 0, matriz: matriz([0, -0.02, 0], [0, 0, 0], [1, 1.25, 1]) });
    k.agregar(new THREE.CylinderGeometry(0.022, 0.03, 0.09, 8), { color: '#ffffff', tipo: 4, variar: 0, matriz: matriz([0, 0.06, 0]) });
  }, matVidrio);
  const llamasVelas = pieza([0, 0, 0], (k) => { for (const x of [-2.95, -1.85]) k.agregar(new THREE.ConeGeometry(0.014, 0.045, 5), { color: '#ffffff', tipo: 4, variar: 0, matriz: matriz([x, 1.85, -2.05]) }); }, matLlama);
  const fuego = pieza([-2.4, P + 0.08, -1.72], (k) => {
    for (const [dx, h, r] of [[-0.14, 0.28, 0.07], [0.0, 0.4, 0.09], [0.15, 0.3, 0.07], [-0.06, 0.22, 0.05], [0.08, 0.24, 0.05]]) k.agregar(new THREE.ConeGeometry(r, h, 6), { color: '#ffffff', tipo: 4, variar: 0, matriz: matriz([dx, h / 2, dx * 0.2]) });
    k.agregar(new THREE.BoxGeometry(0.55, 0.03, 0.22), { color: '#ffffff', tipo: 4, variar: 0, matriz: matriz([0, -0.04, 0]) });   // las brasas
  }, matLlama);
  const tapaPava = pieza([-2.02, P + 0.425, -1.72], (k) => { cil(k, [0, 0, 0], 0.055, 0.07, 0.025, '#6a6c6e', 12); cil(k, [0, 0.022, 0], 0.012, 0.012, 0.02, '#2a2826', 6); });
  const dial = pieza([0.42, P + 1.27, -2.299], (k) => { k.agregar(new THREE.PlaneGeometry(0.2, 0.06), { color: '#ffffff', tipo: 4, variar: 0, matriz: matriz([0, 0.02, 0], [0, 0.08, 0]) }); }, matDial);
  const cajon = pieza([1.1, 0.75, -0.75], (k) => {
    caja(k, [0, -0.04, 0], [0.5, 0.012, 0.42], TABLA);
    for (const s of [-1, 1]) caja(k, [s * 0.245, 0, 0], [0.012, 0.09, 0.42], TABLA);
    caja(k, [0, 0, -0.205], [0.5, 0.09, 0.012], TABLA);
    caja(k, [0, 0, 0.215], [0.54, 0.11, 0.02], MADERA);
    cil(k, [0, 0, 0.235], 0.015, 0.015, 0.02, '#b89a50', 6, [Math.PI / 2, 0, 0]);
    caja(k, [-0.1, -0.025, 0], [0.12, 0.02, 0.07], '#c8a04a');                         // los fósforos
    cil(k, [0.1, -0.025, 0.05], 0.006, 0.006, 0.16, '#3a3836', 4, [0, 0.4, Math.PI / 2]);
  });
  const puertaAlacena = (s) => pieza([0.55 + s * 0.4, P + 0.57, -2.165], (k) => {
    caja(k, [-s * 0.2, 0, 0], [0.39, 1.1, 0.025], '#7a5a3a');
    caja(k, [-s * 0.2, 0, 0.014], [0.3, 0.98, 0.006], '#6b4e33');
    cil(k, [-s * 0.34, 0.05, 0.025], 0.012, 0.012, 0.03, '#b89a50', 6, [Math.PI / 2, 0, 0]);
  });
  const alacenaI = puertaAlacena(-1), alacenaD = puertaAlacena(1);
  const tapaBaul = pieza([3.3, P + 0.48, -0.55], (k) => {
    k.agregar(new THREE.CylinderGeometry(0.25, 0.25, 0.9, 10, 1, false, 0, Math.PI), { color: '#7a5a3a', tipo: 0, variar: 0.08, matriz: matriz([-0.25, 0, 0], [0, Math.PI / 2, Math.PI / 2]) });
    for (const s of [-1, 1]) caja(k, [-0.25, 0.12, s * 0.33], [0.52, 0.26, 0.05], '#3f3830', [0, 0, 0]);
    caja(k, [-0.25, 0.008, 0], [0.5, 0.016, 0.9], '#5b4430');   // el fondo de la tapa (abierta, es lo que se ve)
    caja(k, [-0.5, 0.0, 0], [0.02, 0.1, 0.1], '#b89a50');
  });
  const pendulo = pieza([1.12, 1.66, 2.5], (k) => { cil(k, [0, -0.12, 0], 0.004, 0.004, 0.24, '#b89a50', 4); cil(k, [0, -0.25, 0], 0.035, 0.035, 0.01, '#c8a04a', 12, [Math.PI / 2, 0, 0]); });
  const aguja = (largo, ancho) => pieza([1.12, 1.88, 2.47], (k) => caja(k, [0, largo / 2, 0], [ancho, largo, 0.004], '#1f1a17'));
  const agujaHora = aguja(0.065, 0.012), agujaMin = aguja(0.1, 0.008);
  const manija = pieza([4.08, sB + 0.98, 1.2], (k) => { caja(k, [-0.2, 0, 0], [0.4, 0.03, 0.03], HIERRO, [0, 0, 0]); cil(k, [-0.4, 0, 0], 0.02, 0.02, 0.08, '#5a3a2a', 6, [0, 0, Math.PI / 2]); });
  // las cortinas: dos paños por ventana, cada uno desde su costado (corrida: escala 1; abierta: recogida contra el marco)
  const pano = (pos, giro, s, color) => {
    const g = pieza(pos, (k) => {
      for (let i = 0; i < 7; i++) caja(k, [s * (0.05 + i * 0.1), 0, (i % 2) * 0.025], [0.105, 0.9, 0.012], color, [0, s * (i % 2 ? 0.35 : -0.35), 0], 0, 0.04);
    });
    g.rotation.y = giro;
    return g;
  };
  const COLOR_CORTINA = '#b8432f';
  const cortinas = [
    [pano([1.5, 1.5, 2.525], 0, 1, COLOR_CORTINA), pano([2.9, 1.5, 2.525], 0, -1, COLOR_CORTINA)],
    [pano([-3.31, 1.5, 0.7], Math.PI / 2, 1, COLOR_CORTINA), pano([-3.31, 1.5, -0.7], Math.PI / 2, -1, COLOR_CORTINA)],
  ];
  // las hojas de las ventanas: la carpintería y su vidrio (el vidrio copia el color del vidrio de la casa: brilla igual de noche); con la
  // ventana cerrada no se dibujan (queda el vidrio de siempre) y abiertas el vidrio de siempre se esconde
  const matHoja = basico(0x1a1612);
  const hoja = (pos, giro) => {
    const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = giro; grupo.add(g);
    const k = new Constructor();
    for (const [x, y, w, h] of [[0.55, 0.38, 1.12, 0.05], [0.55, -0.38, 1.12, 0.05], [0.02, 0, 0.05, 0.8], [1.08, 0, 0.05, 0.8], [0.55, 0, 0.03, 0.76]]) caja(k, [x, y, 0], [w, h, 0.045], '#6b5238', [0, 0, 0], 0);
    malla(k, mat, g);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.74), matHoja); v.position.set(0.55, 0, 0); g.add(v);
    g.visible = false;
    return g;
  };
  const hojas = [hoja([1.65, 1.45, 2.8], 0), hoja([-3.55, 1.45, -0.55], -Math.PI / 2)];
  // el vidrio de siempre está fundido con el resto del refugio (las dos ventanas en una malla): se esconde y cada ventana cerrada pone el
  // suyo, con el mismo color (la malla escondida sigue sirviendo para los halos de noche, que la buscan por su material)
  const fijos = [[2.2, 1.45, 2.77, 0], [-3.52, 1.45, 0, -Math.PI / 2]].map(([x, y, z, g]) => { const v = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), matHoja); v.position.set(x, y, z); v.rotation.y = g; grupo.add(v); return v; });
  const escondidos = [];
  if (ref.vidrio) (raiz || escena).traverse((o) => { if (o.isMesh && o.material === ref.vidrio && !o.userData.casaDetalle) { o.visible = false; escondidos.push(o); } });
  // el chorro (en el mundo: sirve para la bomba y para la canilla de tus casas)
  const chorro = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 1, 6, 1, true).translate(0, -0.5, 0), matAgua);
  chorro.visible = false; chorro.name = 'casa:chorro';
  escena.add(chorro);
  const picoBomba = aMundo(4.4, sB + 0.74, 1.2), fondoBomba = aMundo(4.4, sBalde + 0.24, 1.2);

  // Los puntos que se miran, en el mundo (la bomba, a su altura sobre el terreno)
  const puntos = {};
  for (const k of COSAS_REFUGIO) puntos[k.id] = k.en.map(([x, y, z]) => aMundo(x, k.id === 'bomba' ? sB + 0.85 : y, z));
  const sentarse = {};
  for (const k of COSAS_REFUGIO) if (k.sentarse) { const s = k.sentarse, q = aMundo(s.x, s.y, s.z), w = aMundo(s.mira[0], 0, s.mira[1]); sentarse[k.id] = { x: q.x, y: q.y, z: q.z, mira: Math.atan2(-(w.x - ref.x), -(w.z - ref.z)) }; }

  // Lo que se anima, hacia el estado: `e` la casa guardada, `x` lo de cada momento ({ pava, chorroBomba, chorroEn, viento, horas, t })
  const anim = { cajon: 0, alacena: 0, baul: 0, cortinas: [0, 0], ventanas: [0, 0], manija: 0 };
  const COLOR_LLAMA = new THREE.Color(0xffa040);
  function actualizar(dt, e, x, vidrioCasa) {
    const k = Math.min(1, dt * 5);
    anim.cajon = lerp(anim.cajon, e.cajon ? 1 : 0, k);
    anim.alacena = lerp(anim.alacena, e.alacena ? 1 : 0, k);
    anim.baul = lerp(anim.baul, e.baul ? 1 : 0, k);
    cajon.position.z = -0.75 + anim.cajon * 0.3;
    alacenaI.rotation.y = -anim.alacena * 1.9; alacenaD.rotation.y = anim.alacena * 1.9;
    tapaBaul.rotation.z = -anim.baul * 1.45;
    const t = x.t || 0;
    for (let v = 0; v < 2; v++) {
      anim.cortinas[v] = lerp(anim.cortinas[v], e.cortinas[v] ? 1 : 0, k * 0.7);
      anim.ventanas[v] = lerp(anim.ventanas[v], e.ventanas[v] ? 1 : 0, k * 0.8);
      const abierta = anim.ventanas[v];
      // con la ventana abierta y viento, la cortina se mueve
      const flamea = abierta * (0.08 + (x.viento || 0) * 0.25) * Math.sin(t * 2.3 + v * 1.7) * Math.sin(t * 0.7 + v);
      for (const p of cortinas[v]) { p.scale.x = 0.26 + 0.74 * anim.cortinas[v]; p.rotation.x = flamea; }
      hojas[v].visible = abierta > 0.01;
      hojas[v].rotation.y = (v ? -Math.PI / 2 : 0) - abierta * 1.35;
      fijos[v].visible = abierta <= 0.01;
    }
    if (vidrioCasa) matHoja.color.copy(vidrioCasa.color);
    // lo que brilla: la llama tiembla un poco
    const tiembla = 0.85 + 0.15 * Math.sin(t * 13.1) * Math.sin(t * 7.3 + 1);
    matLlama.color.copy(COLOR_LLAMA).multiplyScalar(1.25 * tiembla);
    llamasVelas.visible = !!e.velas;
    fuego.visible = !!e.hogar;
    if (e.hogar) { fuego.scale.set(1, 0.85 + 0.25 * Math.sin(t * 9.7) * Math.sin(t * 5.1 + 2), 1); }
    if (e.lampara) matVidrio.color.setRGB(1.7 * tiembla * 0.2 + 1.35, 1.05, 0.55); else matVidrio.color.setRGB(0.32, 0.3, 0.26);
    if (e.radio) matDial.color.setRGB(1.25, 0.85, 0.42); else matDial.color.setRGB(0.42, 0.38, 0.3);
    // la pava hirviendo: la tapa baila
    tapaPava.position.y = P + 0.425 + (x.pava === 'silba' ? Math.abs(Math.sin(t * 23)) * 0.012 : 0);
    // el reloj: el péndulo va y viene (un segundo por lado) y las agujas dicen la hora del juego
    pendulo.rotation.z = Math.sin(t * Math.PI) * 0.16;
    const h = ((x.horas || 0) % 12 + 12) % 12, m = ((x.horas || 0) % 1 + 1) % 1;
    agujaHora.rotation.z = h / 12 * Math.PI * 2; agujaMin.rotation.z = m * Math.PI * 2;   // (vistas desde adentro, de frente: giran como las de un reloj)
    // la bomba: la manija sube y baja mientras sale el agua
    anim.manija = x.chorroBomba > 0 ? Math.sin(t * 7) * 0.35 : lerp(anim.manija, 0, k);
    manija.rotation.z = anim.manija;
    // el chorro: el de la bomba o el de una canilla de tus casas
    const ch = x.chorroBomba > 0 ? { de: picoBomba, a: fondoBomba } : x.chorroEn;
    if (ch) {
      chorro.visible = true;
      chorro.position.set(ch.de.x, ch.de.y, ch.de.z);
      chorro.scale.set(1 + 0.15 * Math.sin(t * 31), Math.max(0.05, ch.de.y - ch.a.y), 1 + 0.15 * Math.sin(t * 27));
    } else chorro.visible = false;
  }
  // lejos no se dibuja lo nuevo; el vidrio de siempre vuelve (de lejos se ve igual y no hay nada que mover)
  function mostrar(si) { grupo.visible = si; if (!si) chorro.visible = false; for (const o of escondidos) o.visible = !si; }

  return { grupo, puntos, sentarse, actualizar, mostrar, picoBomba, escondidos, partes: { fijos, tuboLampara, llamasVelas, fuego, cajon, alacenaI, alacenaD, tapaBaul, pendulo, hojas, cortinas, chorro, manija, dial } };
}
