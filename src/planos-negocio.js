// 4.3 · LOS LOCALES DEL NEGOCIO PROPIO (O → Trabajo, sólo en el Relax): el almacén de campo ($28.000) y la panadería y cafetería ($36.000). Cada uno
// tiene su mostrador al frente (abierto por los costados, se entra por ahí), los estantes del fondo con lo que hay a la venta (se ve el stock: cada
// cosa tiene su lugar y se llena o se vacía con lo que surtís y vendés), la caja sobre el mostrador y un cartel con el toldo: abierto (verde, toldo
// levantado) o cerrado (rojo, toldo caído). Las reglas, los clientes y la plata están en negocio-propio.js y negocio-propio-juego.js.
// Reglas de siempre: el frente (abierto) mira a -z y el fondo a +z; el origen es el centro, sobre el piso; sólo tipo 0 y 4; sin luces dinámicas;
// la colisión sale de `fisica(h)`. Lo que cambia (los estantes y el cartel) viene de `datos.local` (ver `vistaDelLocal`): la obra rehace la malla cuando
// cambia (una vez por venta o por surtido, nunca por cuadro). Sin esos datos (el fantasma del plano) se ve el local surtido y abierto.
import * as THREE from 'three';
import { matriz } from './geometria.js';
import { AYUDAS_MUEBLES } from './planos-muebles.js';
import { catalogo } from './negocio-propio.js';

const { caja, cil, TABLA, TABLA_CLARA, MADERA, MADERA_OSCURA, PIEDRA, HIERRO, BRONCE, PAPEL } = AYUDAS_MUEBLES;
const TECHO = '#4e4038';
const base = { soloRelax: true, apoyaEnPlataforma: true, pieza: true, categoria: 'trabajo', pendienteMax: 0.25 };

// Los que se usan con E y su nombre (main.js los suma a las obras que trabajan)
export const LOCALES_QUE_SE_USAN = { 'local-almacen': 'Tu almacén', 'local-panaderia': 'Tu panadería' };

// ---------------------------------------------------------------- las medidas (las usa también el juego para parar a los clientes)
export const MEDIDAS = {
  'local-almacen': { W: 4.6, D: 3.6, H: 2.6 },
  'local-panaderia': { W: 4.4, D: 3.6, H: 2.6 },
};
// El mostrador está a 0,95 m por detrás del borde del frente; los clientes esperan en la tierra, a 0,6 m de la platea
export const MOSTRADOR_Z = (D) => -(D / 2) + 0.85;
export const SITIOS_CLIENTES = (D) => [{ x: 0, z: -(D / 2) - 0.7 }, { x: -1.0, z: -(D / 2) - 0.75 }, { x: 1.0, z: -(D / 2) - 0.75 }];

// ---------------------------------------------------------------- lo que se ve de cada cosa
// Cada cosa tiene su forma; `paso` (1 a 3) es cuánto hay: 1, 2 o 3 unidades a la vista.
const COLOR = {
  harina: '#e6dcc0', papa: '#b5935a', huevo: '#e9dcc0', 'pan-casero': '#b98445', empanadas: '#c98a46', miel: '#d9a02a', 'frasco-frutilla': '#a8323c',
  'calafate-seco': '#4a3a6a', 'hongos-secos': '#9a8260', 'trucha-ahumada': '#a3794a', poncho: '#8a3a2a', lana: '#e3dcc6', tronco: '#6b5238', tabla: '#a98456', piedra: '#7d766c',
};
const FORMAS = {
  frasco(c, k, x, y, z, paso) {
    for (let i = 0; i < paso; i++) {
      const dx = (i - (paso - 1) / 2) * 0.2;
      caja(c, 0.11, 0.17, 0.11, [x + dx, y + 0.085, z], COLOR[k], { variar: 0.06, rot: [0, 0.3 * i, 0] });
      caja(c, 0.09, 0.04, 0.09, [x + dx, y + 0.19, z], k === 'miel' ? '#c8a04a' : '#e0d4b0', { tipo: 0, rot: [0, 0.3 * i, 0] });
    }
  },
  bolsa(c, k, x, y, z, paso) {
    for (let i = 0; i < paso; i++) caja(c, 0.26, 0.32, 0.16, [x + (i - (paso - 1) / 2) * 0.27, y + 0.16, z], COLOR[k], { variar: 0.08, rot: [0, (i - 1) * 0.12, 0] });
  },
  cajon(c, k, x, y, z, paso) {
    caja(c, 0.55, 0.12, 0.28, [x, y + 0.06, z], TABLA_CLARA);
    for (let i = 0; i < paso + 1; i++) caja(c, 0.08, 0.07, 0.08, [x - 0.18 + i * 0.12, y + 0.14, z + (i % 2 ? 0.05 : -0.05)], COLOR[k], { variar: 0.04, rot: [0, 0.5 * i, 0] });
  },
  pan(c, k, x, y, z, paso) {
    for (let i = 0; i < paso; i++) caja(c, 0.22, 0.14, 0.14, [x + (i - (paso - 1) / 2) * 0.24, y + 0.08, z], i % 2 ? '#c89658' : COLOR[k], { variar: 0.1, rot: [0, 0.2 * (i - 1), 0] });
  },
  empanada(c, k, x, y, z, paso) {
    caja(c, 0.62, 0.025, 0.3, [x, y + 0.012, z], PAPEL, { variar: 0.04 });
    for (let i = 0; i < paso; i++) caja(c, 0.16, 0.07, 0.11, [x - 0.18 + i * 0.18, y + 0.06, z + (i % 2 ? 0.05 : -0.05)], COLOR[k], { variar: 0.1, rot: [0, 0.3 * i, 0] });
  },
  trucha(c, k, x, y, z, paso) {
    for (let i = 0; i < paso; i++) caja(c, 0.36, 0.05, 0.11, [x + (i - (paso - 1) / 2) * 0.05, y + 0.03 + i * 0.055, z], COLOR[k], { variar: 0.08, rot: [0, 0.1 * (i - 1), 0] });
  },
};
// Dónde va cada cosa en cada local: { forma, x, y, z } en el marco del local (z hacia el fondo); `estante`: sobre una tabla
const SITIOS = {
  'local-almacen': {
    harina: { forma: 'bolsa', x: -1.2, y: 0.85, z: 1.35 }, papa: { forma: 'bolsa', x: -0.4, y: 0.85, z: 1.35 }, huevo: { forma: 'cajon', x: 0.45, y: 0.85, z: 1.35 }, 'pan-casero': { forma: 'pan', x: 1.2, y: 0.85, z: 1.35 },
    miel: { forma: 'frasco', x: -1.2, y: 1.4, z: 1.35 }, 'frasco-frutilla': { forma: 'frasco', x: -0.4, y: 1.4, z: 1.35 }, 'calafate-seco': { forma: 'frasco', x: 0.4, y: 1.4, z: 1.35 }, 'hongos-secos': { forma: 'frasco', x: 1.2, y: 1.4, z: 1.35 },
    'trucha-ahumada': { forma: 'trucha', x: 0, y: 1.95, z: 1.35 },
  },
  'local-panaderia': {
    harina: { forma: 'bolsa', x: -0.4, y: 0.85, z: 1.35 }, huevo: { forma: 'cajon', x: 0.55, y: 0.85, z: 1.35 },
    miel: { forma: 'frasco', x: -1.2, y: 1.4, z: 1.35 }, 'frasco-frutilla': { forma: 'frasco', x: -0.4, y: 1.4, z: 1.35 }, 'calafate-seco': { forma: 'frasco', x: 0.4, y: 1.4, z: 1.35 },
    'pan-casero': { forma: 'pan', x: -0.65, y: 1.07, z: -0.95 }, empanadas: { forma: 'empanada', x: 0.55, y: 1.07, z: -0.95 },
  },
};
const FORMA_DE = { empanada: FORMAS.empanada, pan: FORMAS.pan, frasco: FORMAS.frasco, bolsa: FORMAS.bolsa, cajon: FORMAS.cajon, trucha: FORMAS.trucha };
// Lo que va en el piso o colgado (no entra en los estantes)
function enElPiso(c, k, paso, x, z) {
  if (k === 'lana') for (let i = 0; i < paso; i++) caja(c, 0.5, 0.4, 0.4, [x, 0.38 + i * 0.4, z + (i % 2 ? 0.02 : -0.02)], i % 2 ? COLOR.lana : '#d4cbb0', { variar: 0.05, rot: [0, i * 0.2, 0] });
  if (k === 'tronco') for (let i = 0; i < paso + 1; i++) cil(c, 0.09, 0.09, 0.8, [x - 0.13 + (i % 2) * 0.19, 0.3 + (i >> 1) * 0.16, z], COLOR.tronco, { lados: 5, rot: [Math.PI / 2, 0, 0], variar: 0.12, tipo: 0 });
  if (k === 'tabla') for (let i = 0; i < paso + 1; i++) caja(c, 0.2, 0.04, 0.9, [x, 0.22 + i * 0.05, z], COLOR.tabla, { variar: 0.1, rot: [0, 0.04 * i, 0] });
  if (k === 'piedra') for (let i = 0; i < paso; i++) c.agregar(new THREE.IcosahedronGeometry(0.17, 0), { color: COLOR.piedra, tipo: 4, variar: 0.14, matriz: matriz([x - 0.12 + (i % 2) * 0.24, 0.26 + (i >> 1) * 0.13, z + (i - 1) * 0.16], [i * 0.7, i * 1.1, 0.2], [1.2, 0.8, 1.0]) });
  if (k === 'poncho') for (let i = 0; i < paso; i++) { const px = x + (i - (paso - 1) / 2) * 0.42; caja(c, 0.36, 0.62, 0.025, [px, 1.9, z], COLOR.poncho, { variar: 0.06 }); caja(c, 0.36, 0.08, 0.03, [px, 1.78, z - 0.005], '#e0b860', { variar: 0.05 }); }
}
const VISTA_DE_PLANO = { abierto: true, p: {} };
function vistaDe(id, datos) {
  if (datos?.local && typeof datos.local === 'object') return datos.local;
  // una obra de verdad que todavía no tiene nada guardado: cerrada y vacía (hasta que la abrís y la surtís)
  if (datos) return { abierto: false, p: {} };
  // el fantasma del plano (sin datos): surtido a media altura, para que se vea cómo queda
  const p = {};
  for (const k of catalogo(id === 'local-almacen' ? 'almacen' : 'panaderia')) p[k] = 2;
  return { ...VISTA_DE_PLANO, p };
}

// ---------------------------------------------------------------- lo que tienen los dos: platea, postes, vigas, techo a dos aguas, mostrador, estantes y cartel
const RISE = 0.55, VUELO = 0.35;
function armazon(c, W, D, H, { platea, toldoA, toldoB, abierto, fondo }) {
  caja(c, W, 0.3, D, [0, 0.03, 0], platea, { variar: 0.12 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, 0.14, H, 0.14, [sx * (W / 2 - 0.1), H / 2, sz * (D / 2 - 0.1)], MADERA_OSCURA, { tipo: 0 });
  for (const sz of [-1, 1]) caja(c, W, 0.14, 0.16, [0, H - 0.05, sz * (D / 2 - 0.1)], MADERA, { tipo: 0 });
  for (const sx of [-1, 1]) caja(c, 0.16, 0.12, D, [sx * (W / 2 - 0.1), H - 0.05, 0], MADERA, { tipo: 0 });
  // la pared del fondo, de tablas
  caja(c, W - 0.3, H - 0.4, 0.1, [0, (H - 0.4) / 2 + 0.15, D / 2 - 0.13], fondo, { variar: 0.14 });
  const medio = D / 2 + VUELO, largo = Math.hypot(medio, RISE), ang = Math.atan2(RISE, medio);
  for (const s of [-1, 1]) caja(c, W + 0.5, 0.07, largo, [0, H + RISE / 2 + 0.04, (s * medio) / 2], TECHO, { rot: [s * ang, 0, 0], variar: 0.1 });
  caja(c, W + 0.52, 0.1, 0.16, [0, H + RISE + 0.08, 0], MADERA_OSCURA, { tipo: 0 });
  // el toldo a rayas al frente: levantado con el local abierto, caído (tapando) cuando está cerrado
  const franjas = 7, w = W / franjas, rotX = abierto ? -0.3 : -1.25, zT = -(D / 2 + 0.05) + (abierto ? 0 : 0.28), yT = H - (abierto ? 0.2 : 0.55);
  for (let i = 0; i < franjas; i++) caja(c, w, 0.04, 0.62, [-W / 2 + w / 2 + i * w, yT, zT], i % 2 ? toldoB : toldoA, { rot: [rotX, 0, 0], variar: 0.05 });
  // el cartel colgado de la viga: verde y claro si está abierto, rojo y cerrado si no
  caja(c, 1.3, 0.36, 0.06, [0, H - 0.5, -(D / 2 - 0.08)], abierto ? '#4f8a52' : '#9a3a2c', { variar: 0.05 });
  for (let i = 0; i < (abierto ? 6 : 5); i++) caja(c, 0.1, 0.17, 0.02, [-0.5 + i * (abierto ? 0.2 : 0.25), H - 0.5, -(D / 2 - 0.12)], '#f0e6c4', { tipo: 0 });
  for (const sx of [-1, 1]) caja(c, 0.02, 0.2, 0.02, [sx * 0.6, H - 0.28, -(D / 2 - 0.08)], MADERA_OSCURA, { tipo: 0 });
}
function mostrador(c, W, D, z0, conCaja = true) {
  const w = 2.6;
  caja(c, w, 0.86, 0.6, [0, 0.58, z0], TABLA);
  caja(c, w + 0.1, 0.06, 0.7, [0, 1.04, z0], TABLA_CLARA);
  for (const sx of [-1, 1]) caja(c, 0.05, 0.86, 0.62, [sx * (w / 2 - 0.05), 0.58, z0], MADERA_OSCURA, { tipo: 0 });
  if (conCaja) {
    // la caja registradora: gabinete con teclas y cajón de monedas, y la balanza de platillos
    caja(c, 0.36, 0.18, 0.28, [-0.95, 1.16, z0 + 0.12], MADERA_OSCURA, { tipo: 0 });
    caja(c, 0.3, 0.1, 0.12, [-0.95, 1.3, z0 + 0.18], BRONCE, { tipo: 0, rot: [-0.35, 0, 0] });
    caja(c, 0.34, 0.03, 0.18, [-0.95, 1.1, z0 - 0.04], HIERRO, { tipo: 0 });
    caja(c, 0.03, 0.34, 0.03, [0.95, 1.24, z0 + 0.12], BRONCE, { tipo: 0 });
    caja(c, 0.5, 0.025, 0.025, [0.95, 1.41, z0 + 0.12], BRONCE, { tipo: 0 });
    for (const sx of [-1, 1]) cil(c, 0.08, 0.08, 0.02, [0.95 + sx * 0.24, 1.3, z0 + 0.12], BRONCE, { tipo: 0, lados: 6 });
  }
}
function estantes(c, nivelesAlturas, ancho = 3.4) {
  for (const y of nivelesAlturas) {
    caja(c, ancho, 0.05, 0.34, [0, y, 1.35], TABLA);
    for (const sx of [-1, 1]) caja(c, 0.05, 0.55, 0.3, [sx * (ancho / 2 - 0.02), y - 0.3, 1.35], MADERA_OSCURA, { tipo: 0 });
  }
}
function lleno(W, D, H) { return { ancho: W + 0.5, fondo: D + 2 * VUELO, alto: H + RISE + 0.2, radio: Math.max(W, D) / 2 + 0.2 }; }
function fisicaLocal(W, D) {
  return (h) => { h.plataforma(0, 0, W, D, 0.18, 0.14, 0.5); h.segmento(-(W / 2 - 0.3), D / 2 - 0.22, W / 2 - 0.3, D / 2 - 0.22, 0.14, 0, 2.6); h.segmento(-1.3, MOSTRADOR_Z(D), 1.3, MOSTRADOR_Z(D), 0.32, 0, 1.0); };
}
// Arma los productos de un local con la vista dada
function productos(c, id, vista) {
  const sitios = SITIOS[id];
  // (una vista guardada rota —un nombre raro, un número que no es— no tira la obra: lo que no se entiende, no se dibuja)
  const p = vista.p && typeof vista.p === 'object' ? vista.p : {};
  for (const k of Object.keys(p)) {
    const s = Object.hasOwn(sitios, k) ? sitios[k] : null, paso = Math.max(1, Math.min(3, Math.floor(Number(p[k])) || 0));
    if (s && Object.hasOwn(FORMA_DE, s.forma) && Number(p[k]) > 0) FORMA_DE[s.forma](c, k, s.x, s.y + 0.025, s.z, paso);
  }
}

export const PIEZAS_NEGOCIO = [
  // ================================================================ el almacén de campo
  {
    ...base, id: 'local-almacen', nombre: 'Almacén de campo (tu local)', ...lleno(4.6, 3.6, 2.6), separacion: 0.6,
    texto: 'Un almacén tuyo, con mostrador al frente, estantes de tablas con lo que tengas a la venta, la caja, un toldo a rayas y el cartel de abierto o cerrado. Con E lo abrís, lo surtís desde tu mochila, fijás los precios (barato, normal o caro) y atendés vos a cada cliente que llegue: vecinos y viajeros compran huevos, pan, miel, dulce, ponchos, leña, tablas… Si no estás, no se vende. La buena atención te hace fama en el valle.',
    pide: { tabla: 40, tronco: 12, piedra: 10 }, pesos: 28000,
    fisica: fisicaLocal(4.6, 3.6),
    arma(c, P, datos) {
      const { W, D, H } = MEDIDAS['local-almacen'], v = vistaDe('local-almacen', datos);
      armazon(c, W, D, H, { platea: TABLA, toldoA: '#a8433a', toldoB: '#d6c6a0', abierto: v.abierto, fondo: TABLA });
      mostrador(c, W, D, MOSTRADOR_Z(D));
      estantes(c, [0.85, 1.4, 1.95]);
      // un barril de pepinos y el canasto de pan al lado del mostrador, y el hierro de la balanza colgado
      cil(c, 0.26, 0.24, 0.6, [-1.85, 0.5, MOSTRADOR_Z(D) + 0.55], MADERA, { lados: 8, tipo: 0, variar: 0.1 });
      cil(c, 0.22, 0.22, 0.02, [-1.85, 0.8, MOSTRADOR_Z(D) + 0.55], '#6a7a4a', { lados: 8, tipo: 0 });
      caja(c, 1.5, 0.03, 0.03, [0, 2.3, 1.62], MADERA_OSCURA, { tipo: 0 });   // el riel de los ponchos
      productos(c, 'local-almacen', v);
      const p = v.p && typeof v.p === 'object' ? v.p : {}, paso = (k) => Math.max(0, Math.min(3, Math.floor(Number(p[k])) || 0));
      for (const [k, x, z] of [['lana', -1.9, 1.15], ['tronco', 1.6, 0.5], ['tabla', 1.97, 0.5], ['piedra', -1.9, 0.35], ['poncho', 0, 1.6]]) if (paso(k)) enElPiso(c, k, paso(k), x, z);
    },
  },
  // ================================================================ la panadería y cafetería
  {
    ...base, id: 'local-panaderia', nombre: 'Panadería y cafetería (tu local)', ...lleno(4.4, 3.6, 2.6), separacion: 0.6,
    texto: 'Una panadería con horno de ladrillo a la vista, vitrina sobre el mostrador con el pan y las empanadas del día, estantes con dulces y miel, la caja y un toldo celeste. Con E la abrís, la surtís de tu mochila, fijás los precios y atendés vos a cada cliente: vecinas que vienen a merendar, hacheros con hambre, viajeros de la trochita. Si no estás, no se vende. Para extenderla: más tipos de local usan el mismo estante, la misma caja y los mismos clientes.',
    pide: { tabla: 44, tronco: 12, piedra: 24 }, pesos: 36000,
    fisica: fisicaLocal(4.4, 3.6),
    arma(c, P, datos) {
      const { W, D, H } = MEDIDAS['local-panaderia'], v = vistaDe('local-panaderia', datos);
      armazon(c, W, D, H, { platea: PIEDRA, toldoA: '#5a86a8', toldoB: '#e8dfc8', abierto: v.abierto, fondo: '#b59a6a' });
      mostrador(c, W, D, MOSTRADOR_Z(D));
      estantes(c, [0.85, 1.4], 2.9);
      // el horno de ladrillo a la izquierda, con su boca, la chimenea que sale por el techo y la pala
      caja(c, 1.0, 1.1, 1.0, [-1.55, 0.7, 1.0], '#9a5a3a', { variar: 0.14 });
      caja(c, 0.55, 0.4, 0.04, [-1.55, 0.85, 0.48], '#1c1816', { tipo: 0 });
      caja(c, 0.4, 0.04, 0.05, [-1.55, 1.07, 0.47], '#d9602a', { tipo: 4, variar: 0.1 });
      cil(c, 0.4, 0.55, 0.5, [-1.55, 1.5, 1.0], '#9a5a3a', { lados: 6, variar: 0.12 });
      caja(c, 0.34, 1.4, 0.34, [-1.55, 2.4, 1.05], '#8a5238', { variar: 0.12 });
      caja(c, 0.05, 1.5, 0.05, [-0.95, 0.95, 0.5], MADERA, { tipo: 0, rot: [0, 0, 0.08] });
      caja(c, 0.3, 0.02, 0.26, [-0.95, 1.72, 0.5], MADERA, { tipo: 0 });
      // la vitrina de vidrio sobre el mostrador (pan y empanadas quedan adentro) y un banquito con taza para los que meriendan
      caja(c, 1.7, 0.02, 0.4, [0, 1.08, MOSTRADOR_Z(D)], '#9bb0b0', { tipo: 4, variar: 0.03 });
      for (const sx of [-1, 1]) caja(c, 0.02, 0.28, 0.4, [sx * 0.85, 1.22, MOSTRADOR_Z(D)], '#9bb0b0', { tipo: 4, variar: 0.03 });
      caja(c, 1.7, 0.02, 0.4, [0, 1.36, MOSTRADOR_Z(D)], '#9bb0b0', { tipo: 4, variar: 0.03 });
      for (const sx of [-1, 1]) cil(c, 0.17, 0.19, 0.05, [sx * 1.9, 0.62, -1.25], MADERA, { lados: 8, tipo: 0, variar: 0.08 });
      for (const sx of [-1, 1]) cil(c, 0.04, 0.04, 0.6, [sx * 1.9, 0.32, -1.25], MADERA_OSCURA, { lados: 5, tipo: 0 });
      productos(c, 'local-panaderia', v);
    },
  },
];
export const IDS_PLANOS_NEGOCIO = PIEZAS_NEGOCIO.map((p) => p.id);
