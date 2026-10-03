// 3.6: Aldea de los Duendes — la arquitectura de cada edificio, con su interior y sus etapas
// de obra, SIN ubicarlo en el mapa. El plano y las reglas son de `aldea.js` (núcleo); ubicar,
// emparejar el terreno, prender luces y medir es del equipo de mundo (`aldea-mundo.js`).
//
// ---------------------------------------------------------------- para el equipo de mundo
// Coordenadas LOCALES de cada edificio: origen en el centro de la planta, y = 0 es el suelo
// emparejado del lote. X = ancho, Z = fondo; la puerta principal está en la cara +Z (mira a la
// calle). El piso de adentro queda en y = PISO_ALDEA (0,32: zócalo de piedra laja) y la galería
// (si hay) va por delante, de z = fondo/2 a fondo/2 + 1,6..2,0. Con un sitio { x, y, z, rot }
// un punto local pasa al mundo igual que en piezas.js / casa-viva.js:
//   x = sitio.x + lx·cos(rot) + lz·sin(rot) ;  z = sitio.z − lx·sin(rot) + lz·cos(rot) ;  y = sitio.y + ly
// (o sea, un THREE.Group en (x, y, z) con rotation.y = rot). `aMundoAldea` hace la cuenta.
//
// armarEdificio(id, etapa = 4, opciones = {}) → edificio (ver `EDIFICIOS_ALDEA` y `LOTES_ALDEA`)
//   etapa: 0 lote vacío (estacas, hilo y "Lote para ...") · 1 cimientos · 2 estructura ·
//   3 paredes y techo sin terminar · 4 terminado. Los edificios iniciales se usan en 4; la
//   escuela empieza en ESCUELA_A_MEDIO_HACER (3: tapiada, sin pintar). opciones: { semilla,
//   colores: { pared, techo, postigo }, obraActiva (andamio y materiales en la escuela a medio
//   hacer), sinMateriales (sin pilas de obra alrededor) }.
// El edificio que devuelve:
//   exterior: { estructura, vidrios, carteles }  BufferGeometry por material (o null):
//     · estructura: aTipo 0/4 + color por vértice → el material de las estructuras
//       (materialVegetal({ flex: 0 }), el mismo `est.mat`). Incluye la cáscara entera: paredes por
//       las dos caras, piso, cielorraso, techo: desde afuera nunca se ve a través.
//     · vidrios: color por vértice → MeshBasicMaterial({ vertexColors: true, side: DoubleSide }).
//       Un material por edificio (o por grupo de casas) para prenderlas de noche con
//       `brilloVentana` de main.js (multiplica el color del material: ver casa-viva.js).
//     · carteles: position/normal/uv sobre el atlas de `crearTexturaCarteles()` (UNA textura para
//       toda la aldea) → MeshLambertMaterial({ map }). Toda la aldea cabe en un solo dibujo.
//   interior: { muebles, brasas } → muebles con el material de las estructuras (aTipo 0: adentro
//     no hay nieve; 3.6 pulido: también el machimbre/friso de las paredes de adentro: la estructura
//     sólo lleva un respaldo liso), brasas (fragua, horno, cocina) con MeshBasic de color por vértice. El mundo los
//     muestra sólo a menos de ~25 m.
//   colisiones: { obstaculos: [...], plataformas: [...] } en local, con el formato de
//     colisiones.js (segmentos/círculos con alturaMin/alturaMax; plataformas con ang/largo/ancho/
//     alto/espesor). `registrarEnMundo` las pasa al mundo y las da de alta (con dueño).
//   puertas: [{ lx, lz, ancho, alto, lado, adentro, piso, nombre }] → puertas.agregar({ sitio: { x,
//     z, y, piso }, rot, lx, lz, ancho, alto, lado, adentro, nombre }) (también en registrarEnMundo).
//   luces: [{ lx, ly, lz, color, radio, intensidad, clase, cuarto }] — SÓLO especificación: el motor
//     tiene 4 puntuales + 1 foco; el mundo elige cuál prender (el cuarto donde está el jugador, la
//     fragua...). Ninguna PointLight sale de acá.
//   ventanas: [{ lx, ly, lz, ancho, alto, nx, nz, cuarto }] — lo que brilla de noche sin luz real.
//   puntos: { entrada, adentro, mostrador, atiende, cliente, trabajo: [...], cama, mesa, cocina,
//     asientos: [{ lx, ly, lz, mira, nombre }], ... } — lugares para parar a la gente. `mira` es la
//     rotation.y local del muñeco (+Z del muñeco hacia (sin mira, cos mira)); en el mundo, rot + mira.
//   chimenea: { lx, ly, lz } (boca, para el humo de clima.js) o null.
//   techo: { x0, x1, z0, z1, radio } lo cubierto (para `marcarTechos`: sin nieve adentro) o null.
//   pisos: [{ lx, lz, largo, ancho }] lo pisado sin pasto (las plataformas ya entran solas a
//     `marcarPisos`; esto es para la plaza y las veredas).
//   ocupa: { x0, x1, z0, z1 } todo lo que ocupa (galería, horno, colmenas, materiales de obra).
//   medidas: { triangulos: { exterior, interior }, dibujos: { exterior, interior } }.
// armarAccesorio(nombre, opciones) → la misma forma (faroles, banco, cerco, pirca, alamo, lena,
//   tendedero, vereda, poste-luz, mastil, cantero). `alamo` trae además `lod` (la versión barata)
//   y sus hojas van con aTipo 2 (material con viento: materialVegetal({ flex: 1 })): caen en
//   invierno. Para el otoño variado conviene instanciarlo (el azar del otoño sale de la instancia).
// armarAgregadoEstacion() → { piezas: [{ id, lx, lz, giro, edificio }] } en el marco local de la
//   parada (el de construirParada en trochita.js: x a lo largo de la vía, z alejándose; y = 0 la
//   altura del riel). Cada pieza se apoya en el terreno: el mundo le pone su propia altura.
// fusionarAldea(lista, capa) junta muchos edificios (cada uno con su sitio) en una geometría por
//   material: cada manzana, una sola pieza. montarEdificio(edificio, mats) arma los THREE.Mesh.
//
// Presupuesto (Radeon integrada), medido en pruebas/verificar-3-6-arquitectura.mjs: exterior ≤ 3
// dibujos por edificio (estructura, vidrios, carteles) e interior ≤ 2 (muebles, brasas); las hojas
// de puerta de puertas.js son aparte. Triángulos: casa ≤ 4k, local ≤ 7k afuera + 6k adentro,
// salón y biblioteca ≤ 10k.
import * as THREE from 'three';
import { Constructor, matriz, abollar } from './geometria.js';
import { piezas } from './piezas.js';

// ---------------------------------------------------------------- medidas comunes
export const PISO_ALDEA = 0.32;          // cara de arriba del piso de adentro, sobre el suelo del lote
const PISO = PISO_ALDEA;
const LIBRE = 2.6;                       // del piso al cielorraso (≥ 2,4)
const ALTO_MURO = PISO + 2.75;           // tope de las paredes (el cielorraso va abajo)
const MURO = 0.14;                       // espesor de las paredes
const PUERTA_ANCHO = 1.1, PUERTA_ALTO = 2.1;
const GALERIA_PISO = 0.30;
export const ETAPAS_ALDEA = ['lote', 'cimientos', 'estructura', 'paredes', 'terminado'];
export const ESCUELA_A_MEDIO_HACER = 3;

// El contrato con el núcleo (ids y tamaños): no se cambian.
export const EDIFICIOS_ALDEA = {
  plaza: { ancho: 18, fondo: 14, nombre: 'Plaza de los Duendes', clase: 'plaza', inicial: true },
  biblioteca: { ancho: 7, fondo: 11, nombre: 'Biblioteca Popular', clase: 'grande', inicial: true },
  escuela: { ancho: 10, fondo: 7, nombre: 'Escuela', clase: 'local', inicial: true, lote: true },
  'casa-jefe': { ancho: 6, fondo: 6, nombre: 'Casa del jefe de estación', clase: 'casa', inicial: true },
  'casa-ercilia': { ancho: 5, fondo: 5, nombre: 'Casa de Ercilia', clase: 'casa', inicial: true },
  'casa-nelida': { ancho: 6, fondo: 5, nombre: 'Casa de Nélida', clase: 'casa', inicial: true },
  'casa-abuela': { ancho: 5, fondo: 5, nombre: 'Casa de la abuela', clase: 'casa', inicial: true },
  'casa-familia': { ancho: 7, fondo: 6, nombre: 'Casa de la familia', clase: 'casa', inicial: true },
  panaderia: { ancho: 7, fondo: 6, nombre: 'Panadería', clase: 'local', lote: true },
  herreria: { ancho: 7, fondo: 7, nombre: 'Herrería', clase: 'local', lote: true },
  carpinteria: { ancho: 8, fondo: 6, nombre: 'Carpintería', clase: 'local', lote: true },
  pescaderia: { ancho: 6, fondo: 5, nombre: 'Pescadería', clase: 'local', lote: true },
  'puesto-sanitario': { ancho: 6, fondo: 6, nombre: 'Puesto Sanitario', clase: 'local', lote: true },
  estafeta: { ancho: 5, fondo: 5, nombre: 'Estafeta Postal', clase: 'local', lote: true },
  hilanderia: { ancho: 7, fondo: 6, nombre: 'Hilandería', clase: 'local', lote: true },
  'sala-miel': { ancho: 6, fondo: 5, nombre: 'Sala de Miel', clase: 'local', lote: true },
  seccional: { ancho: 6, fondo: 6, nombre: 'Seccional de Guardaparques', clase: 'local', lote: true },
  salon: { ancho: 10, fondo: 8, nombre: 'Salón Social', clase: 'grande', lote: true },
};
export const LOTES_ALDEA = ['panaderia', 'herreria', 'carpinteria', 'pescaderia', 'escuela', 'puesto-sanitario',
  'estafeta', 'hilanderia', 'sala-miel', 'seccional', 'salon'];
// Cómo se nombra cada lote en su cartel ("Lote para la panadería").
const PARA_LOTE = {
  panaderia: 'la panadería', herreria: 'la herrería', carpinteria: 'la carpintería', pescaderia: 'la pescadería',
  escuela: 'la escuela', 'puesto-sanitario': 'el puesto sanitario', estafeta: 'la estafeta', hilanderia: 'la hilandería',
  'sala-miel': 'la sala de miel', seccional: 'la seccional', salon: 'el salón',
};
export const ACCESORIOS_ALDEA = ['faroles', 'banco', 'cerco', 'pirca', 'alamo', 'lena', 'tendedero', 'vereda', 'poste-luz', 'mastil', 'cantero'];

// Presupuestos (los mide la prueba): triángulos por capa y dibujos.
export const PRESUPUESTO_ALDEA = {
  casa: { exterior: 4000, interior: 6000 },
  local: { exterior: 7000, interior: 6000 },
  grande: { exterior: 10000, interior: 6000 },
  plaza: { exterior: 10000, interior: 0 },
  dibujos: { exterior: 4, interior: 4 },
};

// ---------------------------------------------------------------- azar propio (no toca el de estructuras.js)
export function semillaDe(texto) {
  let h = 2166136261 >>> 0;
  for (const ch of String(texto)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function azar(semilla) {
  let a = (semilla >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const elegir = (r, lista) => lista[Math.floor(r() * lista.length) % lista.length];
const entre = (r, a, b) => a + (b - a) * r();
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- colores (apagados, gastados)
export const PALETA_ALDEA = {
  pared: {
    cal: '#cdc3aa', crema: '#cdbb94', ocre: '#b98f58', rojo: '#8c4c3c', verde: '#6f7e62', celeste: '#8c9e9e',
    amarillo: '#c2a663', rosa: '#ad8d82', alerce: '#8a5c3e', gris: '#928c80', azul: '#6a7b86',
  },
  techo: { oxido: '#87402c', verde: '#4b674d', azul: '#495d74', gris: '#8a8e8c', rojo: '#9b432f', negro: '#46413c' },
  postigo: { verde: '#4b6a51', azul: '#3d5976', rojo: '#863b2f', amarillo: '#ad8a3c', marron: '#5a4636', blanco: '#d9d3c4' },
  marco: '#cbbfa2',
  crudo: '#b48b5c', crudoGris: '#8d8478', galvanizado: '#9ea3a2',
  madera: '#6e5238', maderaOscura: '#4e3a28', tabla: '#8a6b4a', hierro: '#33302d', laja: ['#8a8579', '#77736a', '#9a8f7c', '#6d6a62', '#857c6e'],
};
const _cache = new Map();
function lin(hex) {
  let c = _cache.get(hex);
  if (!c) { c = new THREE.Color(hex); _cache.set(hex, c); }
  return c;
}
// color lineal por un factor (y hacia otro color con `t`)
function tinte(hex, f = 1, haciaHex = null, t = 0) {
  const a = lin(hex);
  let r = a.r, g = a.g, b = a.b;
  if (haciaHex && t > 0) { const o = lin(haciaHex); r += (o.r - r) * t; g += (o.g - g) * t; b += (o.b - b) * t; }
  return { r: r * f, g: g * f, b: b * f };
}
const mezclar = (k, o, t) => ({ r: k.r + (o.r - k.r) * t, g: k.g + (o.g - k.g) * t, b: k.b + (o.b - k.b) * t });
const escalar = (k, f) => ({ r: k.r * f, g: k.g * f, b: k.b * f });
// pincelada amplia: un par de metros por mancha, como el resto del valle
function pincel(x, y, z, s) {
  return 0.5 + 0.22 * Math.sin(x * 1.31 + z * 0.97 + s) + 0.17 * Math.sin(y * 2.1 + x * 0.53 - z * 0.71 + s * 2.3)
    + 0.11 * Math.sin((x - z) * 3.7 + y * 1.3 + s * 0.7);
}

// ---------------------------------------------------------------- emisor de caras con color por vértice
// Empuja triángulos directo en el Constructor (sin geometrías intermedias): las paredes, el
// techo y los pisos se arman así, con un color por vértice (degradados, oclusión, desgaste).
function tri(c, p0, p1, p2, k0, k1, k2, tipo) {
  const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
  const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
  let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
  const l = Math.hypot(nx, ny, nz);
  if (l < 1e-9) return;
  nx /= l; ny /= l; nz /= l;
  c.pos.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
  c.nor.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  c.col.push(k0.r, k0.g, k0.b, k1.r, k1.g, k1.b, k2.r, k2.g, k2.b);
  c.tipo.push(tipo, tipo, tipo);
}
// cuadrilátero p0 p1 p2 p3 en sentido antihorario visto desde el frente
function quad(c, p0, p1, p2, p3, k0, k1, k2, k3, tipo) {
  tri(c, p0, p1, p2, k0, k1, k2, tipo);
  tri(c, p0, p2, p3, k0, k2, k3, tipo);
}

// Primitivas con matriz (cajas, cilindros...) sobre el Constructor de three: con un degradado
// suave de abajo (más oscuro) hacia arriba, para que ninguna cara quede plana.
// (con un poco de abolladura: ninguna tabla es una caja perfecta; proporcional a la pieza)
function caja(c, pos, tam, color, o = {}) {
  const g = new THREE.BoxGeometry(tam[0], tam[1], tam[2]);
  const ab = o.abollar ?? Math.min(0.014, Math.min(tam[0], tam[1], tam[2]) * 0.14);
  if (ab > 0.001) abollar(g, ab, 2.3);
  const k = lin(color);
  const bajo = o.bajo ?? 0.8, alto = o.alto ?? 1.06;
  c.agregar(g, {
    tipo: o.tipo ?? 0, variar: o.variar ?? 0.07,
    degradado: [new THREE.Color(k.r * bajo, k.g * bajo, k.b * bajo), new THREE.Color(k.r * alto, k.g * alto, k.b * alto)],
    matriz: matriz(pos, [o.rx ?? 0, o.giro ?? 0, o.rz ?? 0]),
  });
  g.dispose();
}
function cilindro(c, pos, r0, r1, alto, color, o = {}) {
  const g = new THREE.CylinderGeometry(r1, r0, alto, o.lados ?? 8, 1, o.abierto ?? false);
  const k = lin(color);
  c.agregar(g, {
    tipo: o.tipo ?? 0, variar: o.variar ?? 0.06, suave: o.suave ?? true,
    degradado: [new THREE.Color(k.r * (o.bajo ?? 0.78), k.g * (o.bajo ?? 0.78), k.b * (o.bajo ?? 0.78)), new THREE.Color(k.r * 1.06, k.g * 1.06, k.b * 1.06)],
    matriz: matriz(pos, [o.rx ?? 0, o.giro ?? 0, o.rz ?? 0], o.esc ?? [1, 1, 1]),
  });
  g.dispose();
}
function bulto(c, pos, radio, color, o = {}) {
  const g = new THREE.IcosahedronGeometry(radio, o.detalle ?? 0);
  if (o.abollar) abollar(g, o.abollar, o.escalaAbollar ?? 4.5);
  const k = lin(color);
  c.agregar(g, {
    tipo: o.tipo ?? 4, variar: o.variar ?? 0.12, suave: o.suave ?? false,
    degradado: [new THREE.Color(k.r * (o.bajo ?? 0.72), k.g * (o.bajo ?? 0.72), k.b * (o.bajo ?? 0.72)), new THREE.Color(k.r * (o.alto ?? 1.08), k.g * (o.alto ?? 1.08), k.b * (o.alto ?? 1.08))],
    matriz: matriz(pos, o.rot ?? [0, 0, 0], o.esc ?? [1, 1, 1]),
  });
  g.dispose();
}
function cono(c, pos, radio, alto, color, o = {}) {
  const g = new THREE.ConeGeometry(radio, alto, o.lados ?? 8, 1, o.abierto ?? false);
  const k = lin(color);
  c.agregar(g, {
    tipo: o.tipo ?? 4, variar: o.variar ?? 0.06, suave: o.suave ?? false,
    degradado: [new THREE.Color(k.r * 0.8, k.g * 0.8, k.b * 0.8), new THREE.Color(k.r * 1.08, k.g * 1.08, k.b * 1.08)],
    matriz: matriz(pos, [o.rx ?? 0, o.giro ?? 0, o.rz ?? 0], o.esc ?? [1, 1, 1]),
  });
  g.dispose();
}
// caja orientada entre dos puntos (vigas, cabios, cenefas): su largo va de a a b, su `alto` en la
// dirección de `arriba` (por defecto la vertical, o lo más parecido) y su `ancho` en la tercera.
const _vA = new THREE.Vector3(), _vB = new THREE.Vector3(), _vC = new THREE.Vector3(), _q = new THREE.Quaternion();
function viga(c, a, b, ancho, alto, color, o = {}) {
  _vA.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const largo = _vA.length();
  if (largo < 1e-4) return;
  _vA.divideScalar(largo);
  const ar = o.arriba ?? [0, 1, 0];
  _vB.set(ar[0], ar[1], ar[2]);
  if (Math.abs(_vB.dot(_vA)) > 0.98) _vB.set(1, 0, 0);
  if (Math.abs(_vB.dot(_vA)) > 0.98) _vB.set(0, 0, 1);
  _vB.addScaledVector(_vA, -_vB.dot(_vA)).normalize();
  _vC.crossVectors(_vA, _vB);
  const m = new THREE.Matrix4().makeBasis(_vA, _vB, _vC);
  m.setPosition((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  const g = new THREE.BoxGeometry(largo, alto, ancho);
  const k = lin(color);
  c.agregar(g, { tipo: o.tipo ?? 0, variar: o.variar ?? 0.08, matriz: m,
    degradado: [new THREE.Color(k.r * (o.bajo ?? 0.84), k.g * (o.bajo ?? 0.84), k.b * (o.bajo ?? 0.84)), new THREE.Color(k.r * 1.04, k.g * 1.04, k.b * 1.04)] });
  g.dispose();
}
function palo(c, a, b, radio, color, o = {}) {
  _vA.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const largo = _vA.length();
  if (largo < 1e-4) return;
  const g = new THREE.CylinderGeometry(radio * (o.punta ?? 1), radio, largo, o.lados ?? 6, 1, o.abierto ?? true);
  g.translate(0, largo / 2, 0);
  _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _vA.normalize());
  const m = new THREE.Matrix4().compose(new THREE.Vector3(a[0], a[1], a[2]), _q, new THREE.Vector3(1, 1, 1));
  const k = lin(color);
  c.agregar(g, { tipo: o.tipo ?? 0, variar: o.variar ?? 0.08, matriz: m, suave: true,
    degradado: [new THREE.Color(k.r * 0.8, k.g * 0.8, k.b * 0.8), new THREE.Color(k.r * 1.05, k.g * 1.05, k.b * 1.05)] });
  g.dispose();
}
// un marco local (x, z, giro) para muebles y accesorios: las medidas van relativas al mueble
function marcoLocal(x0, z0, giro = 0, y0 = 0) {
  const cg = Math.cos(giro), sg = Math.sin(giro);
  return {
    p: (lx, ly, lz) => [x0 + lx * cg + lz * sg, y0 + ly, z0 - lx * sg + lz * cg],
    giro,
  };
}

// ---------------------------------------------------------------- el contexto de un armado
const TIERRA = tinte('#5b4a38');
function crearContexto(id, etapa, op, def) {
  const semilla = (op.semilla ?? semillaDe(id)) >>> 0;
  const r = azar(semilla);
  const W = def.ancho, D = def.fondo;
  const K = {
    id, etapa, def, op, r, W, D, s: (semilla % 997) * 0.013,
    ext: new Constructor(), int: new Constructor(), vid: new Constructor(), bra: new Constructor(), fol: new Constructor(),
    car: { pos: [], nor: [], uv: [] },
    obst: [], plat: [], puertas: [], luces: [], ventanas: [], carteles: [], pisos: [],
    puntos: { trabajo: [], asientos: [] }, chimenea: null, techo: null, extra: {},
    ocupa: { x0: -W / 2, x1: W / 2, z0: -D / 2, z1: D / 2 },
    H: ALTO_MURO,
  };
  const reg = { agregar: (o) => K.obst.push(o), agregarPlataforma: (p) => K.plat.push(p) };
  K.PA = piezas(new Constructor(), reg, { x: 0, z: 0, y: 0, rot: 0 }, matriz);
  K.plataforma = (x, z, largo, ancho, alto, espesor = 0.3, giro = 0, extra = {}) => K.plat.push({ x, z, ang: -giro, largo, ancho, alto, espesor, ...extra });
  K.circulo = (x, z, radio, y0, y1) => K.obst.push({ x, z, r: radio, alturaMin: y0, alturaMax: y1 });
  K.segmento = (ax, az, bx, bz, radio, y0, y1) => K.obst.push({ seg: true, ax, az, bx, bz, r: radio, alturaMin: y0, alturaMax: y1 });
  // un mueble que frena: la caja de piezas.js (cuatro lados, sólo hasta su altura)
  K.mueble = (x, z, largo, ancho, alto, giro = 0, base = PISO) => K.PA.mueble({ lx: x, ly: base + alto / 2, lz: z, largo, alto, ancho, giro, color: '#000', dibujar: false });
  K.abarcar = (x0, x1, z0, z1) => {
    K.ocupa.x0 = Math.min(K.ocupa.x0, x0); K.ocupa.x1 = Math.max(K.ocupa.x1, x1);
    K.ocupa.z0 = Math.min(K.ocupa.z0, z0); K.ocupa.z1 = Math.max(K.ocupa.z1, z1);
  };
  K.luz = (lx, ly, lz, o = {}) => K.luces.push({ lx, ly, lz, color: o.color ?? 0xffb070, radio: o.radio ?? 8, intensidad: o.intensidad ?? 1.1, clase: o.clase ?? 'interior', cuarto: o.cuarto ?? 'local' });
  K.punto = (nombre, lx, lz, mira = 0, ly = PISO) => { K.puntos[nombre] = { lx, ly, lz, mira }; return K.puntos[nombre]; };
  K.trabajo = (nombre, lx, lz, mira = 0, ly = PISO) => { K.puntos.trabajo.push({ nombre, lx, ly, lz, mira }); };
  K.asiento = (nombre, lx, ly, lz, mira = 0) => { K.puntos.asientos.push({ nombre, lx, ly, lz, mira }); };
  return K;
}

// Sombreado pintado de una superficie: pincelada amplia, sombra bajo el alero, oclusión en las
// esquinas, salpicado de barro al pie y pintura gastada en manchas (deja ver la madera).
function sombrear(K, k, x, y, z, o = {}) {
  let f = 0.8 + 0.4 * pincel(x, y, z, K.s);
  // sombra pintada bajo el alero (fuerte y ancha: el alero de chapa tapa el cielo)
  if (o.alero !== undefined) f *= 1 - (o.sombraAlero ?? 0.34) * suave(o.alero - 1.1, o.alero, y);
  // oclusión en las esquinas
  if (o.esquina !== undefined) f *= 1 - 0.3 * (1 - suave(0, 0.7, o.esquina));
  // arriba más claro y tibio (la luz del cielo), abajo más oscuro y húmedo
  let out = escalar(k, f);
  // 3.6 (pulido): el matiz también se mueve con la pincelada: manchas tibias (ocre) y frías (gris azulado)
  const hue = pincel(x * 0.7 - 2, y * 0.5, z * 0.7 + 1, K.s * 2.1);
  out = mezclar(out, { r: out.r * 1.1, g: out.g * 1.02, b: out.b * 0.86 }, Math.max(0, hue - 0.5) * 0.8);
  out = mezclar(out, { r: out.r * 0.9, g: out.g * 0.96, b: out.b * 1.08 }, Math.max(0, 0.5 - hue) * 0.8);
  if (o.suelo !== undefined) {
    out = mezclar(out, { r: out.r * 1.06, g: out.g * 1.02, b: out.b * 0.94 }, suave(o.suelo + 0.8, o.suelo + 2.6, y));
    // barro y salpicaduras al pie: de la tierra hacia arriba, en manchas
    const sal = (1 - suave(0, 1.15, y - o.suelo)) * (0.75 + 0.5 * pincel(x * 4.1, y * 3, z * 4.1, K.s + 3));
    if (sal > 0) out = mezclar(out, TIERRA, Math.min(0.8, sal * 0.62));
  }
  const borde = o.borde ?? 9;
  if (o.desgaste) {
    // pintura saltada: en manchas, y más en los bordes (cantos, junto a puertas y ventanas)
    const m = pincel(x * 2.3 + 3, y * 1.9, z * 2.3 - 1, K.s * 1.7) + (1 - suave(0, 0.22, borde)) * 0.35;
    if (m > 0.6) out = mezclar(out, o.madera ?? tinte('#7d6247'), Math.min(1, (m - 0.6) * 2.6) * o.desgaste);
  }
  return out;
}

function restarTramos(tramos, a, b) {
  const out = [];
  for (const [x0, x1] of tramos) {
    if (b <= x0 + 1e-6 || a >= x1 - 1e-6) { out.push([x0, x1]); continue; }
    if (a > x0) out.push([x0, a]);
    if (b < x1) out.push([b, x1]);
  }
  return out.filter(([p, q]) => q - p > 0.012);
}

// Las cuatro caras de una planta W × D. `s` corre a lo largo de la cara, de izquierda a derecha
// mirándola desde afuera: frente s = x, fondo s = −x, der s = −z, izq s = z.
function carasDe(W, D) {
  return {
    frente: { nombre: 'frente', cx: 0, cz: D / 2, nx: 0, nz: 1, largo: W },
    fondo: { nombre: 'fondo', cx: 0, cz: -D / 2, nx: 0, nz: -1, largo: W },
    der: { nombre: 'der', cx: W / 2, cz: 0, nx: 1, nz: 0, largo: D },
    izq: { nombre: 'izq', cx: -W / 2, cz: 0, nx: -1, nz: 0, largo: D },
  };
}
const sDe = (cara, x, z) => (cara === 'frente' ? x : cara === 'fondo' ? -x : cara === 'der' ? -z : z);
const puntoCara = (f, s, y, d = 0) => [f.cx + f.nz * s + f.nx * d, y, f.cz - f.nx * s + f.nz * d];
// el giro de una caja para que su x corra a lo largo de la cara
const giroCara = (f) => Math.atan2(f.nx, f.nz);

// Un paramento: la cara exterior de una pared, con sus huecos de puertas y ventanas.
// f: { cx, cz, nx, nz, largo, y0, y1, tope(s) (frontón), huecos: [{ s0, s1, y0, y1 }], estilo, color }
// estilos: 'horizontal' (tablas solapadas), 'vertical' (tabla y tapajunta), 'tejuela' (alerce),
// 'chapa' (acanalada en vertical), 'interior' (machimbre liso) y 'cal' (revoque blanqueado).
function paramento(K, c, f) {
  const P = (s, y, d = 0) => puntoCara(f, s, y, d);
  const L2 = f.largo / 2;
  const huecos = f.huecos || [];
  const alz = f.tope ? f.tope(0) - f.y1 : 0;
  const ymax = f.tope ? f.tope(0) : f.y1;
  const lim = (y) => (f.tope && y > f.y1 ? Math.max(0, L2 * (1 - (y - f.y1) / alz)) : L2);
  const topeEn = (s) => (f.tope ? Math.min(f.tope(s), ymax) : f.y1);
  const tipo = f.tipo ?? 4;
  const r = azar(semillaDe(K.id + '|' + f.cx.toFixed(2) + f.cz.toFixed(2) + f.estilo + (f.y0 || 0).toFixed(2)));
  const sh = { alero: f.alero ?? f.y1, suelo: f.suelo, desgaste: f.desgaste ?? 0, madera: f.madera, sombraAlero: f.sombraAlero };
  // la distancia al canto más cercano de un hueco (para la pintura saltada)
  const alBorde = (s, y) => {
    let d = 9;
    for (const h of huecos) {
      const ds = s < h.s0 ? h.s0 - s : s > h.s1 ? s - h.s1 : 0, dy = y < h.y0 ? h.y0 - y : y > h.y1 ? y - h.y1 : 0;
      d = Math.min(d, Math.hypot(ds, dy));
    }
    return Math.min(d, L2 - Math.abs(s));
  };
  const col = (k, s, y, d) => {
    const p = P(s, y, d);
    return sombrear(K, k, p[0], y, p[2], { ...sh, esquina: L2 - Math.abs(s), borde: alBorde(s, y) });
  };
  const base = f.colorK || tinte(f.color);
  const estilo = f.estilo || 'horizontal';

  if (estilo === 'horizontal' || estilo === 'tejuela' || estilo === 'interior' || estilo === 'cal' || estilo === 'machimbre') {
    const h = f.fila ?? (estilo === 'tejuela' ? 0.18 : estilo === 'interior' ? 0.34 : estilo === 'machimbre' ? 0.19 : estilo === 'cal' ? 0.7 : 0.24);
    const machi = estilo === 'machimbre';
    const lap = estilo === 'horizontal' ? 0.024 : estilo === 'tejuela' ? 0.03 : 0;
    let fila = 0;
    for (let ya = f.y0; ya < ymax - 0.012; ya += h, fila++) {
      const yb = Math.min(ya + h, ymax);
      const limA = lim(ya), limB = lim(yb);
      if (limA < 0.02) break;
      let tramos = [[-limA, limA]];
      for (const hu of huecos) if (hu.y0 < yb - 0.004 && hu.y1 > ya + 0.004) tramos = restarTramos(tramos, hu.s0, hu.s1);
      const filaF = estilo === 'interior' ? (fila % 2 ? 0.95 : 1.03) * (0.97 + 0.06 * r()) : machi ? (fila === 0 ? 0.62 : 0.86 + 0.22 * r()) : 1;
      for (const [a, b] of tramos) {
        const cortes = [a];
        if (estilo === 'tejuela') {
          let k = a + (fila % 2) * 0.07;
          for (;;) { k += entre(r, 0.17, 0.3); if (k >= b - 0.08) break; cortes.push(k); }
        } else if (estilo === 'horizontal') {
          let k = -L2 - r() * 1.6;
          while (k < b) { k += entre(r, 2.2, 3.6); if (k > a + 0.3 && k < b - 0.3) cortes.push(k); }
        } else if (machi) {
          let k = -L2 - r() * 2;
          while (k < b) { k += entre(r, 1.8, 3.2); if (k > a + 0.3 && k < b - 0.3) cortes.push(k); }
        } else if (estilo === 'cal') {
          for (let k = a + 0.7 + r() * 0.3; k < b - 0.3; k += entre(r, 0.6, 1.0)) cortes.push(k);
        } else if (b - a > 2.4) {
          for (let k = a + 1.8; k < b - 0.6; k += 1.8) cortes.push(k);
        }
        cortes.push(b);
        for (let i = 0; i + 1 < cortes.length; i++) {
          const sa = cortes[i], sb = cortes[i + 1];
          const ta = Math.max(sa, -limB), tb = Math.min(sb, limB);
          let tono = filaF;
          let k = base;
          if (estilo === 'tejuela') {
            tono = 0.82 + 0.3 * r();
            if (r() < 0.25) k = mezclar(base, tinte('#9a9286'), 0.35 + 0.3 * r());   // alerce plateado por el sol
          } else if (estilo === 'horizontal') tono = 0.84 + 0.26 * r();
          else if (estilo === 'cal') tono = 0.9 + 0.12 * r();
          const kk = escalar(k, tono);
          // el borde de abajo de cada tabla sale un poco y queda en sombra
          // (en el machimbre, la ranura entre tablas: el borde de abajo oscuro)
          if (machi) tono *= 0.95 + 0.1 * r();
          const kAbajo = escalar(kk, lap > 0 ? 0.84 : machi ? 0.7 : 1);
          if (tb - ta < 0.01) {
            const tm = Math.min(Math.max((sa + sb) / 2, -limB), limB);
            tri(c, P(sa, ya, lap), P(sb, ya, lap), P(tm, yb, 0), col(kAbajo, sa, ya, lap), col(kAbajo, sb, ya, lap), col(kk, tm, yb, 0), tipo);
          } else {
            quad(c, P(sa, ya, lap), P(sb, ya, lap), P(tb, yb, 0), P(ta, yb, 0),
              col(kAbajo, sa, ya, lap), col(kAbajo, sb, ya, lap), col(kk, tb, yb, 0), col(kk, ta, yb, 0), tipo);
          }
        }
      }
    }
    return;
  }

  // vertical: tabla y tapajunta (relieve escalonado) o chapa acanalada (zigzag)
  const chapa = estilo === 'chapa';
  const ancho = f.tabla ?? (chapa ? 0.13 : 0.24);
  const relieve = chapa ? 0.028 : 0.022;
  const cortesS = new Set();
  for (let s = -L2; s < L2 - 0.02; s += ancho) cortesS.add(+s.toFixed(4));
  cortesS.add(+L2.toFixed(4));
  for (const hu of huecos) {
    if (hu.s0 > -L2 && hu.s0 < L2) cortesS.add(+hu.s0.toFixed(4));
    if (hu.s1 > -L2 && hu.s1 < L2) cortesS.add(+hu.s1.toFixed(4));
  }
  const S = [...cortesS].sort((a, b) => a - b);
  let hoja = 0, hojaF = 1;
  for (let i = 0; i + 1 < S.length; i++) {
    const sa = S[i], sb = S[i + 1];
    if (sb - sa < 0.01) continue;
    const sm = (sa + sb) / 2;
    let tramos = [[f.y0, Math.max(topeEn(sa), topeEn(sb))]];
    for (const hu of huecos) if (hu.s0 < sm && hu.s1 > sm) tramos = restarTramos(tramos, hu.y0, hu.y1);
    const da = (i % 2) * relieve, db = chapa ? ((i + 1) % 2) * relieve : da;
    let k;
    if (chapa) {
      if (i % 8 === 0) { hoja++; hojaF = 0.92 + 0.14 * r(); }
      k = escalar(base, hojaF * (i % 2 ? 1.08 : 0.84));
    } else k = escalar(base, (0.84 + 0.26 * r()) * (i % 2 ? 1.05 : 0.93));
    for (const [ya, yb] of tramos) {
      const arriba = Math.abs(yb - Math.max(topeEn(sa), topeEn(sb))) < 1e-4;
      const yTa = arriba ? topeEn(sa) : yb, yTb = arriba ? topeEn(sb) : yb;
      // cortes en la altura: el degradado necesita vértices (barro abajo, sombra del alero arriba)
      const ys = [ya];
      if (ya + 0.5 < Math.min(yTa, yTb) - 0.3) ys.push(ya + 0.5);
      if (Math.min(yTa, yTb) - 0.55 > ys[ys.length - 1] + 0.3) ys.push(Math.min(yTa, yTb) - 0.55);
      for (let j = 0; j < ys.length; j++) {
        const y0 = ys[j];
        const ultimo = j === ys.length - 1;
        const y1a = ultimo ? yTa : ys[j + 1], y1b = ultimo ? yTb : ys[j + 1];
        if (y1a - y0 < 0.005 && y1b - y0 < 0.005) continue;
        let ko = k;
        if (chapa && f.oxido) {
          const m = pincel(sa * 3.1, y0 * 0.7, hoja * 1.3, K.s);
          if (m > 0.6) ko = mezclar(k, tinte('#7a4a2e'), Math.min(0.8, (m - 0.6) * 2.2) * f.oxido);
        }
        quad(c, P(sa, y0, da), P(sb, y0, db), P(sb, y1b, db), P(sa, y1a, da),
          col(ko, sa, y0, da), col(ko, sb, y0, db), col(ko, sb, y1b, db), col(ko, sa, y1a, da), tipo);
      }
      if (!chapa && da > 0) {
        const ks = escalar(k, 0.78);
        quad(c, P(sb, ya, da), P(sb, ya, 0), P(sb, yTb, 0), P(sb, yTb, da), col(ks, sb, ya, 0), col(ks, sb, ya, 0), col(ks, sb, yTb, 0), col(ks, sb, yTb, 0), tipo);
        quad(c, P(sa, ya, 0), P(sa, ya, da), P(sa, yTa, da), P(sa, yTa, 0), col(ks, sa, ya, 0), col(ks, sa, ya, 0), col(ks, sa, yTa, 0), col(ks, sa, yTa, 0), tipo);
      }
    }
  }
}

// Zócalo de piedra laja: hiladas de lajas chatas, de largo y alto distintos, que salen un poco
// de la pared. `anillo`: además la cara de adentro y el lomo ancho (en la etapa de cimientos).
function zocaloLaja(K, c, { W, D, y0 = -0.14, y1 = PISO + 0.04, salida = 0.05, anillo = false, ancho = 0.3 }) {
  const r = azar(semillaDe(K.id + '|laja' + W + D));
  const pal = PALETA_ALDEA.laja;
  const caras = carasDe(W, D);
  const hacer = (f, interior) => {
    const L2 = f.largo / 2 + (interior ? -ancho : salida);
    const P = (s, y, d) => puntoCara(f, s, y, d);
    let y = y0;
    while (y < y1 - 0.02) {
      const h = Math.min(entre(r, 0.14, 0.22), y1 - y);
      let s = -L2 - r() * 0.3;
      while (s < L2) {
        const l = entre(r, 0.55, 1.1);
        const sa = Math.max(-L2, s), sb = Math.min(L2, s + l);
        s += l;
        if (sb - sa < 0.04) continue;
        const d = interior ? -ancho : salida + r() * 0.022;
        const k = escalar(tinte(elegir(r, pal)), 0.88 + 0.22 * r());
        const ka = escalar(k, 0.8), kb = escalar(k, 1.08);
        if (interior) quad(c, P(sb, y, d), P(sa, y, d), P(sa, y + h, d), P(sb, y + h, d), ka, ka, kb, kb, 4);
        else quad(c, P(sa, y, d), P(sb, y, d), P(sb, y + h, d), P(sa, y + h, d), mezclar(ka, TIERRA, 0.2), mezclar(ka, TIERRA, 0.2), kb, kb, 4);
      }
      y += h;
    }
  };
  for (const f of Object.values(caras)) {
    hacer(f, false);
    // lomo: de la pared (o del borde de adentro del cimiento) a la cara de las lajas
    const L2 = f.largo / 2 + salida;
    const dIn = anillo ? -ancho : -0.02;
    const P = (s, d) => puntoCara(f, s, y1, d);
    for (let s = -L2; s < L2 - 0.01; s += 1.2) {
      const sb = Math.min(L2, s + 1.2);
      const k = escalar(tinte(elegir(r, pal)), 1.02 + 0.1 * r());
      quad(c, P(s, salida + 0.01), P(sb, salida + 0.01), P(sb, dIn), P(s, dIn), k, k, escalar(k, 0.9), escalar(k, 0.9), 4);
    }
    if (anillo) hacer(f, true);
  }
}

// Piso de tablas (mira para arriba). Tablas a lo largo de x; se oscurece junto a las paredes.
function pisoTablas(K, c, { x0, x1, z0, z1, y, color, ancho = 0.2, tipo = 0, ocluir = true }) {
  const r = azar(semillaDe(K.id + '|piso' + x0 + z0 + y));
  const k0 = tinte(color);
  for (let z = z0; z < z1 - 0.01; z += ancho) {
    const zb = Math.min(z1, z + ancho);
    let x = x0;
    let corte = x0 + entre(r, 0.8, 3.2);
    while (x < x1 - 0.01) {
      const xb = Math.min(x1, corte);
      const k = escalar(k0, 0.86 + 0.2 * r());
      const ko = (px, pz) => (ocluir ? escalar(k, 0.7 + 0.3 * suave(0, 0.7, Math.min(px - x0, x1 - px, pz - z0, z1 - pz))) : k);
      quad(c, [x, y, zb], [xb, y, zb], [xb, y, z], [x, y, z], ko(x, zb), ko(xb, zb), ko(xb, z), ko(x, z), tipo);
      x = xb; corte = x + entre(r, 2.0, 3.6);
    }
  }
}
// Cielorraso de machimbre (mira para abajo).
function cielorraso(K, c, { x0, x1, z0, z1, y, color, ancho = 0.14 }) {
  const r = azar(semillaDe(K.id + '|cielo' + x0 + z0 + y));
  const k0 = tinte(color);
  for (let x = x0; x < x1 - 0.01; x += ancho) {
    const xb = Math.min(x1, x + ancho);
    const k = escalar(k0, 0.9 + 0.14 * r());
    const ko = (px, pz) => escalar(k, 0.66 + 0.34 * suave(0, 0.9, Math.min(px - x0, x1 - px, pz - z0, z1 - pz)));
    quad(c, [x, y, z0], [xb, y, z0], [xb, y, z1], [x, y, z1], ko(x, z0), ko(xb, z0), ko(xb, z1), ko(x, z1), 0);
  }
}

// Chapa acanalada sobre un cuadrilátero: e0 → e1 es el borde bajo (alero), t0/t1 el alto.
// Las ondas corren de e0 a e1 (las canaletas bajan por la pendiente). Cresta clara, valle oscuro,
// hojas de ~0,8 m con su tono, óxido que chorrea desde el alero. `debajo`: color de la cara de abajo.
function chapaPlano(K, c, e0, e1, t1, t0, o) {
  const r = azar(semillaDe(K.id + '|chapa' + e0.join() + e1.join()));
  const base = tinte(o.color);
  const ux = e1[0] - e0[0], uy = e1[1] - e0[1], uz = e1[2] - e0[2];
  const largo = Math.hypot(ux, uy, uz);
  const vx = t0[0] - e0[0], vy = t0[1] - e0[1], vz = t0[2] - e0[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
  const paso = o.paso ?? 0.19;
  const n = Math.max(2, Math.round(largo / paso));
  const filas = o.filas ?? [0, 0.22, 1];
  const amp = o.amp ?? 0.022;
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const comba = o.comba ?? 0.035;
  const punto = (i, t) => {
    const u = i / n;
    const p = lerp3(lerp3(e0, e1, u), lerp3(t0, t1, u), t);
    // la chapa vieja se comba entre cabios y cede un poco al medio
    const d = (i % 2) * amp - comba * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, t * 1.15)) - 0.012 * Math.sin(u * largo * 2.2 + K.s) * t;
    return [p[0] + nx * d, p[1] + ny * d, p[2] + nz * d];
  };
  const hojas = [];
  for (let h = 0; h <= Math.ceil(n / 6); h++) hojas.push({ f: 0.9 + 0.16 * r(), oxido: r() < (o.oxido ?? 0) * 1.3 ? 0.3 + 0.5 * r() : 0, otra: r() < 0.08 });
  const colorEn = (i, t) => {
    const hoja = hojas[Math.floor(i / 6)];
    let k = escalar(base, hoja.f * (i % 2 ? 1.1 : 0.8));
    if (hoja.otra) k = mezclar(k, tinte(PALETA_ALDEA.galvanizado), 0.55);
    const ox = (hoja.oxido + (o.oxido ?? 0) * 0.5) * (1 - t) * (1 - t) * (0.55 + 0.45 * Math.sin(i * 1.7 + K.s));
    if (ox > 0) k = mezclar(k, tinte('#73452c'), Math.min(0.85, ox));
    // musgo y líquenes: en las canaletas, abajo y del lado de la sombra
    const musgo = (o.musgo ?? 0.45) * (1 - t * 0.7) * Math.max(0, pincel(i * 0.21, t * 3.0, hoja.f * 7, K.s * 1.3) - 0.55) * 2.2 * (i % 2 ? 0.6 : 1);
    if (musgo > 0) k = mezclar(k, tinte(i % 3 ? '#5d6b3c' : '#9a9a6a'), Math.min(0.7, musgo));
    return escalar(k, 0.9 + 0.18 * t);
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j + 1 < filas.length; j++) {
      const ta = filas[j], tb = filas[j + 1];
      quad(c, punto(i, ta), punto(i + 1, ta), punto(i + 1, tb), punto(i, tb),
        colorEn(i, ta), colorEn(i + 1, ta), colorEn(i + 1, tb), colorEn(i, tb), 4);
    }
  }
  if (o.debajo) {
    // la cara de abajo: tablas del entablonado (se ven desde la galería y desde adentro)
    const kd = tinte(o.debajo);
    const off = (p) => [p[0] - nx * 0.07, p[1] - ny * 0.07, p[2] - nz * 0.07];
    const m = Math.max(1, Math.round(largo / 0.9));
    for (let i = 0; i < m; i++) {
      const a = lerp3(e0, e1, i / m), b = lerp3(e0, e1, (i + 1) / m), ct = lerp3(t0, t1, i / m), dt = lerp3(t0, t1, (i + 1) / m);
      const k = escalar(kd, 0.85 + 0.2 * r());
      quad(c, off(b), off(a), off(ct), off(dt), escalar(k, 0.75), escalar(k, 0.75), k, k, 0);
    }
  }
  return { n: [nx, ny, nz] };
}

// ---------------------------------------------------------------- carteles pintados a mano
// Un solo atlas para toda la aldea (crearTexturaCarteles): cada cartel es una celda de 512 × 96.
// `mano`: letra cursiva (Caveat), como los que se pintan con pincel chico; si no, Spectral.
export const CARTELES_ALDEA = [
  { texto: 'Aldea de los Duendes', fondo: '#3d5745', tinta: '#efe3c4' },
  { texto: 'Plaza de los Duendes', fondo: '#5a4330', tinta: '#efe0bd' },
  { texto: 'Escuela N° 186', fondo: '#e4ddca', tinta: '#2c3e5a' },
  { texto: 'Panadería', fondo: '#dccfae', tinta: '#7a3a22', mano: true },
  { texto: 'Herrería', fondo: '#2f2b28', tinta: '#e2c493' },
  { texto: 'Carpintería', fondo: '#6b4b30', tinta: '#f0e2c0' },
  { texto: 'Pescadería', fondo: '#d6dbd5', tinta: '#2f5873', mano: true },
  { texto: 'Puesto Sanitario', fondo: '#ece7da', tinta: '#2a2a2a', cruz: true },
  { texto: 'Estafeta Postal', fondo: '#3b5675', tinta: '#efe6cf' },
  { texto: 'Hilandería', fondo: '#7c4a5a', tinta: '#f2e4cf', mano: true },
  { texto: 'Sala de Miel', fondo: '#c99a3a', tinta: '#3a2716', mano: true },
  { texto: 'Guardaparques', fondo: '#3f5537', tinta: '#e9d79c' },
  { texto: 'Salón Social', fondo: '#7a2f2a', tinta: '#f1e2c2' },
  { texto: 'Cargas', fondo: '#5a4330', tinta: '#efe0bd' },
  { texto: 'Bienvenidos', fondo: '#6b4b30', tinta: '#f0e2c0', mano: true },
  { texto: 'Biblioteca Popular', fondo: '#e2d6b8', tinta: '#3d4f3a', mano: true },
  { texto: 'Correo', fondo: '#9b3b2c', tinta: '#f3e6cc' },
  ...LOTES_ALDEA.map((id) => ({ texto: 'Lote para ' + PARA_LOTE[id], fondo: '#cdb98e', tinta: '#3a2a1a', mano: true })),
];
export const ATLAS_CARTELES = { ancho: 1024, alto: 2048, celdaAncho: 512, celdaAlto: 96, columnas: 2 };
function celdaCartel(texto) {
  const i = CARTELES_ALDEA.findIndex((c) => c.texto === texto);
  if (i < 0) throw new Error('aldea-arquitectura: cartel sin celda en el atlas: ' + texto);
  const A = ATLAS_CARTELES;
  const x0 = (i % A.columnas) * A.celdaAncho, y0 = Math.floor(i / A.columnas) * A.celdaAlto;
  const m = 3;
  // CanvasTexture con flipY: v = 1 arriba del lienzo
  return { u0: (x0 + m) / A.ancho, u1: (x0 + A.celdaAncho - m) / A.ancho, v1: 1 - (y0 + m) / A.alto, v0: 1 - (y0 + A.celdaAlto - m) / A.alto };
}
// Pinta el atlas en un contexto 2D (del navegador o de una prueba).
export function pintarCarteles(ctx) {
  const A = ATLAS_CARTELES;
  ctx.clearRect(0, 0, A.ancho, A.alto);
  CARTELES_ALDEA.forEach((cfg, i) => {
    const x0 = (i % A.columnas) * A.celdaAncho, y0 = Math.floor(i / A.columnas) * A.celdaAlto;
    const r = azar(semillaDe(cfg.texto));
    ctx.save();
    ctx.translate(x0, y0);
    ctx.fillStyle = cfg.fondo; ctx.fillRect(0, 0, A.celdaAncho, A.celdaAlto);
    // vetas y pintura gastada
    for (let k = 0; k < 26; k++) {
      ctx.strokeStyle = `rgba(40,25,12,${0.05 + r() * 0.12})`; ctx.lineWidth = 1 + r() * 2;
      const y = r() * A.celdaAlto;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(170, y + r() * 6 - 3, 340, y + r() * 6 - 3, A.celdaAncho, y); ctx.stroke();
    }
    ctx.strokeStyle = cfg.tinta; ctx.globalAlpha = 0.55; ctx.lineWidth = 4;
    ctx.strokeRect(9, 9, A.celdaAncho - 18, A.celdaAlto - 18);
    ctx.globalAlpha = 1;
    let xTexto = A.celdaAncho / 2, anchoTexto = A.celdaAncho - 44;
    if (cfg.cruz) {
      ctx.fillStyle = '#b8322a';
      ctx.fillRect(30, 30, 44, 14); ctx.fillRect(45, 15, 14, 44);
      xTexto += 38; anchoTexto -= 76;
    }
    const familia = cfg.mano ? '"Caveat", "Spectral", Georgia, cursive' : '"Spectral", Georgia, serif';
    let tam = cfg.mano ? 66 : 54;
    ctx.font = `${cfg.mano ? 700 : 600} ${tam}px ${familia}`;
    while (tam > 18 && ctx.measureText(cfg.texto).width > anchoTexto) { tam -= 2; ctx.font = `${cfg.mano ? 700 : 600} ${tam}px ${familia}`; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillText(cfg.texto, xTexto + 2, A.celdaAlto / 2 + 4);
    ctx.fillStyle = cfg.tinta; ctx.fillText(cfg.texto, xTexto, A.celdaAlto / 2 + 2);
    // descascarado: manchitas del color del fondo encima de las letras
    ctx.fillStyle = cfg.fondo;
    for (let k = 0; k < 40; k++) { ctx.globalAlpha = 0.25 + r() * 0.4; ctx.fillRect(r() * A.celdaAncho, r() * A.celdaAlto, 2 + r() * 5, 1 + r() * 3); }
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}
// La textura del atlas (necesita `document`). Se repinta cuando terminan de cargar las letras.
export function crearTexturaCarteles() {
  const lienzo = document.createElement('canvas');
  lienzo.width = ATLAS_CARTELES.ancho; lienzo.height = ATLAS_CARTELES.alto;
  const ctx = lienzo.getContext('2d');
  pintarCarteles(ctx);
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  try { document.fonts?.ready?.then(() => { pintarCarteles(ctx); t.needsUpdate = true; }); } catch { /* sin fuentes: queda la de repuesto */ }
  return t;
}
// Un cartel: la tabla (en la estructura) y el texto (en el atlas), mirando a +Z del giro.
function cartel(K, texto, centro, ancho, alto, giro = 0, o = {}) {
  const uv = celdaCartel(texto);
  const cg = Math.cos(giro), sg = Math.sin(giro);
  const P = (lx, ly, lz) => [centro[0] + lx * cg + lz * sg, centro[1] + ly, centro[2] - lx * sg + lz * cg];
  if (o.tabla !== false) caja(K.ext, centro, [ancho + 0.14, alto + 0.14, 0.05], o.marco ?? '#4e3a28', { giro, tipo: 4 });
  const caras = o.dosCaras ? [1, -1] : [1];
  for (const lado of caras) {
    const d = 0.03 * lado;
    const nx = sg * lado, nz = cg * lado;
    const a = ancho / 2, h = alto / 2;
    // de frente: abajo izq, abajo der, arriba der, arriba izq (del lado de atrás, espejado)
    const pts = lado > 0 ? [P(-a, -h, d), P(a, -h, d), P(a, h, d), P(-a, h, d)] : [P(a, -h, d), P(-a, -h, d), P(-a, h, d), P(a, h, d)];
    const uvs = [[uv.u0, uv.v0], [uv.u1, uv.v0], [uv.u1, uv.v1], [uv.u0, uv.v1]];
    for (const i of [0, 1, 2, 0, 2, 3]) {
      K.car.pos.push(...pts[i]); K.car.nor.push(nx, 0, nz); K.car.uv.push(...uvs[i]);
    }
  }
  K.carteles.push({ texto, lx: centro[0], ly: centro[1], lz: centro[2] });
}

// ---------------------------------------------------------------- aberturas
function ventana(K, f, h, o) {
  const c = K.ext;
  const v = h.ventana;
  const ancho = h.s1 - h.s0, alto = h.y1 - h.y0, s = (h.s0 + h.s1) / 2, yc = (h.y0 + h.y1) / 2;
  const giro = giroCara(f);
  const P = (ss, y, d) => puntoCara(f, ss, y, d);
  const prof = MURO + 0.05, dm = -MURO / 2;
  if (K.etapa < 4) {
    // premarco de obra, sin pintar
    for (const l of [-1, 1]) caja(c, P(s + l * (ancho / 2 + 0.04), yc, dm), [0.08, alto + 0.16, prof], PALETA_ALDEA.crudo, { giro, tipo: 0 });
    caja(c, P(s, h.y1 + 0.04, dm), [ancho + 0.16, 0.08, prof], PALETA_ALDEA.crudo, { giro, tipo: 0 });
    caja(c, P(s, h.y0 - 0.04, dm), [ancho + 0.16, 0.08, prof], PALETA_ALDEA.crudo, { giro, tipo: 0 });
    if (o.tapiada) {
      for (const k of [-0.3, 0, 0.3]) caja(c, P(s, yc + k * alto, 0.035), [ancho + 0.32, 0.15, 0.035], PALETA_ALDEA.crudoGris, { giro, tipo: 0, rz: (k * 0.08) });
      caja(c, P(s, yc, 0.06), [Math.hypot(ancho, alto) + 0.1, 0.13, 0.03], PALETA_ALDEA.crudoGris, { giro, tipo: 0, rz: Math.atan2(alto, ancho) });
    }
    return;
  }
  const marco = o.marco ?? PALETA_ALDEA.marco;
  for (const l of [-1, 1]) caja(c, P(s + l * (ancho / 2 + 0.065), yc, dm + 0.01), [0.13, alto + 0.24, prof + 0.02], marco, { giro, tipo: 4, bajo: 0.64, variar: 0.14 });
  caja(c, P(s, h.y1 + 0.08, dm + 0.01), [ancho + 0.3, 0.16, prof + 0.04], marco, { giro, tipo: 4, bajo: 0.64, variar: 0.14 });
  caja(c, P(s, h.y0 - 0.05, dm + 0.07), [ancho + 0.36, 0.09, prof + 0.15], marco, { giro, tipo: 4, bajo: 0.64, variar: 0.14 });
  // parteluz en cruz (sobre el vidrio)
  caja(c, P(s, yc, -MURO * 0.42), [0.05, alto, 0.05], marco, { giro, tipo: 4, bajo: 0.64, variar: 0.14 });
  caja(c, P(s, h.y0 + alto * 0.62, -MURO * 0.42), [ancho, 0.05, 0.05], marco, { giro, tipo: 4, bajo: 0.64, variar: 0.14 });
  // el vidrio: blanco apenas tibio abajo (de noche se lee como una cortina iluminada)
  const kv0 = { r: 0.78, g: 0.74, b: 0.68 }, kv1 = { r: 0.96, g: 0.95, b: 0.93 };
  quad(K.vid, P(h.s0, h.y0, -MURO * 0.5), P(h.s1, h.y0, -MURO * 0.5), P(h.s1, h.y1, -MURO * 0.5), P(h.s0, h.y1, -MURO * 0.5), kv0, kv0, kv1, kv1, 0);
  // cortinas a medio correr (de adentro)
  if (o.cortina) for (const l of [-1, 1]) caja(c, P(s + l * (ancho / 2 - ancho * 0.13), yc + 0.02, -MURO - 0.03), [ancho * 0.26, alto * 0.94, 0.03], o.cortina, { giro, tipo: 0, bajo: 0.9 });
  // postigos abiertos contra la pared
  if (o.postigo && v.postigos !== false) {
    for (const l of [-1, 1]) {
      caja(c, P(s + l * (ancho / 2 + 0.13 + ancho / 4), yc, 0.03), [ancho / 2 + 0.02, alto + 0.08, 0.04], o.postigo, { giro, tipo: 4, bajo: 0.72 });
    }
  }
  const p = P(s, yc, 0);
  K.ventanas.push({ lx: p[0], ly: yc, lz: p[2], ancho, alto, nx: f.nx, nz: f.nz, cuarto: o.cuarto ?? 'local' });
}

function marcoPuerta(K, f, h, o) {
  const c = K.ext;
  const ancho = h.s1 - h.s0, s = (h.s0 + h.s1) / 2;
  const giro = giroCara(f);
  const P = (ss, y, d) => puntoCara(f, ss, y, d);
  const prof = MURO + 0.07, dm = -MURO / 2;
  const color = K.etapa >= 4 ? (o.marco ?? PALETA_ALDEA.marco) : PALETA_ALDEA.crudo;
  const tipo = K.etapa >= 4 ? 4 : 0;
  const y0 = PISO - 0.03, y1 = h.y1;
  for (const l of [-1, 1]) caja(c, P(s + l * (ancho / 2 + 0.06), (y0 + y1) / 2 + 0.03, dm), [0.12, y1 - y0 + 0.1, prof], color, { giro, tipo, bajo: 0.64, variar: 0.14 });
  caja(c, P(s, y1 + 0.07, dm), [ancho + 0.24, 0.14, prof], color, { giro, tipo, bajo: 0.64, variar: 0.14 });
  if (K.etapa >= 4 && !h.puerta?.abierta) caja(c, P(s, y1 + 0.17, 0.04), [ancho + 0.4, 0.06, 0.1], color, { giro, tipo, bajo: 0.64, variar: 0.14 });
  // umbral de laja
  caja(c, P(s, PISO - 0.02, dm + 0.05), [ancho + 0.2, 0.06, prof + 0.12], '#7f7a70', { giro, tipo: 4 });
  if (o.tapiada) {
    for (let k = 0; k < 5; k++) caja(c, P(s, PISO + 0.3 + k * 0.4, 0.035), [ancho + 0.3, 0.17, 0.035], PALETA_ALDEA.crudoGris, { giro, tipo: 0, rz: (k % 2 ? 0.03 : -0.02) });
  }
}

// ---------------------------------------------------------------- el casco: zócalo, piso, paredes, techo
// Arma la cáscara de un edificio rectangular de techo a dos aguas según la etapa de la obra.
// o: { eje ('z': el frontón da a la calle · 'x': el alero da a la calle), alzada, vuelo, vueloFrente,
//      alto, estilo, color, colorTecho, postigo, marco, oxido, desgaste, cortina,
//      puertas: [{ cara, x|z, ancho, alto, abierta, nombre }], ventanas: [{ cara, x|z, y, ancho, alto, cuarto }],
//      galeria: { fondo, x0, x1, postes } , tabique: { z, x, ancho }, cielo, interior, colorInterior,
//      colorPiso, chimenea: { x, z, tipo: 'chapa' | 'piedra', cara, s }, falsoFrente: { alto }, fronton: estilo }
function casco(K, o) {
  const { W, D, etapa: e } = K;
  const H = o.alto ?? ALTO_MURO; K.H = H;
  const eje = o.eje ?? 'z';
  const halfA = (eje === 'z' ? W : D) / 2, halfB = (eje === 'z' ? D : W) / 2;
  const alz = o.alzada ?? halfA * 0.62;
  const vx = o.vuelo ?? 0.42, vz = o.vueloFrente ?? 0.32;
  const pend = alz / halfA;
  const yA = H - pend * vx, yC = H + alz;
  const M = (a, y, b) => (eje === 'z' ? [a, y, b] : [b, y, -a]);
  const yTecho = (x, z) => H + alz * (1 - Math.min(1, Math.abs(eje === 'z' ? x : -z) / halfA));
  const R = { H, eje, halfA, halfB, alz, vx, vz, pend, yA, yC, M, yTecho };
  K.R = R;
  const caras = carasDe(W, D);
  const fronton = (n) => (eje === 'z' ? n === 'frente' || n === 'fondo' : n === 'der' || n === 'izq');
  const terminado = e >= 4;
  const medioHacer = K.id === 'escuela' && e === ESCUELA_A_MEDIO_HACER && !K.op.obraActiva;
  const yCielo = PISO + LIBRE;
  const conCielo = o.cielo !== false && terminado;

  // huecos de cada cara
  const huecos = { frente: [], fondo: [], der: [], izq: [] };
  for (const p of o.puertas || []) {
    const s = sDe(p.cara, p.x ?? 0, p.z ?? 0);
    huecos[p.cara].push({ s0: s - p.ancho / 2, s1: s + p.ancho / 2, y0: PISO - 0.06, y1: PISO + (p.alto ?? PUERTA_ALTO), puerta: p });
  }
  for (const v of o.ventanas || []) {
    const s = sDe(v.cara, v.x ?? 0, v.z ?? 0);
    const yc = PISO + (v.y ?? 1.45);
    huecos[v.cara].push({ s0: s - v.ancho / 2, s1: s + v.ancho / 2, y0: yc - v.alto / 2, y1: yc + v.alto / 2, ventana: v });
  }

  // ---- 1: cimientos (y el zócalo de piedra en todas las etapas que siguen)
  zocaloLaja(K, K.ext, { W, D, anillo: e === 1 });
  if (e === 1) {
    const L = (W + D) * 2;
    void L;
    for (const [x, z, largo, ancho] of [[0, D / 2 - 0.1, W + 0.1, 0.4], [0, -D / 2 + 0.1, W + 0.1, 0.4], [W / 2 - 0.1, 0, 0.4, D + 0.1], [-W / 2 + 0.1, 0, 0.4, D + 0.1]]) {
      K.plataforma(x, z, largo, ancho, PISO + 0.04, 0.5);
    }
    // el contrapiso todavía es tierra apisonada con unas piedras sueltas
    const r = azar(semillaDe(K.id + '|tierra'));
    for (let i = 0; i < 7; i++) bulto(K.ext, [entre(r, -W / 2 + 0.6, W / 2 - 0.6), 0.03, entre(r, -D / 2 + 0.6, D / 2 - 0.6)], entre(r, 0.12, 0.24), elegir(r, PALETA_ALDEA.laja), { esc: [1.3, 0.45, 1], rot: [0, r() * 3, 0] });
    return R;
  }

  // ---- piso (2: tirantes y medio piso; 3 y 4: entero)
  const xi0 = -W / 2 + MURO, xi1 = W / 2 - MURO, zi0 = -D / 2 + MURO, zi1 = D / 2 - MURO;
  const colorPiso = o.colorPiso ?? '#8a6544';
  if (e === 2) {
    for (let z = zi0 + 0.2; z < zi1; z += 0.6) caja(K.ext, [0, PISO - 0.1, z], [W - 0.1, 0.16, 0.1], PALETA_ALDEA.crudo, { tipo: 0 });
    pisoTablas(K, K.ext, { x0: xi0, x1: xi1, z0: zi0, z1: (zi0 + zi1) / 2, y: PISO, color: PALETA_ALDEA.crudo, ocluir: false });
  } else {
    pisoTablas(K, K.ext, { x0: xi0, x1: xi1, z0: zi0, z1: zi1, y: PISO, color: e >= 4 ? colorPiso : PALETA_ALDEA.crudo });
  }
  K.plataforma(0, 0, W, D, PISO, PISO + 0.12);

  // ---- 2: el esqueleto de postes y vigas (en la 3 y en los techos sin cielorraso se siguen viendo los cabios)
  const madera = e >= 4 ? (o.colorEstructura ?? '#5a4331') : (medioHacer ? PALETA_ALDEA.crudoGris : '#b9925f');
  if (e === 2) {
    for (const f of Object.values(caras)) {
      const L2 = f.largo / 2 - 0.06;
      const ss = new Set();
      for (let s = -L2; s <= L2 + 1e-6; s += Math.max(0.9, (2 * L2) / Math.ceil((2 * L2) / 1.4))) ss.add(+s.toFixed(3));
      ss.add(+L2.toFixed(3));
      for (const h of huecos[f.nombre]) { ss.add(+(h.s0 - 0.05).toFixed(3)); ss.add(+(h.s1 + 0.05).toFixed(3)); }
      for (const s of ss) {
        const p = puntoCara(f, s, 0, -MURO / 2);
        caja(K.ext, [p[0], (PISO + H) / 2, p[2]], [0.1, H - PISO, 0.1], madera, { tipo: 0 });
        K.circulo(p[0], p[2], 0.08, 0, H);
      }
      for (const h of huecos[f.nombre]) {
        const a = puntoCara(f, h.s0 - 0.05, h.y1 + 0.05, -MURO / 2), b = puntoCara(f, h.s1 + 0.05, h.y1 + 0.05, -MURO / 2);
        viga(K.ext, a, b, 0.1, 0.12, madera);
        if (h.ventana) viga(K.ext, puntoCara(f, h.s0 - 0.05, h.y0 - 0.05, -MURO / 2), puntoCara(f, h.s1 + 0.05, h.y0 - 0.05, -MURO / 2), 0.1, 0.1, madera);
      }
      const a0 = puntoCara(f, -f.largo / 2, PISO + 0.05, -MURO / 2), a1 = puntoCara(f, f.largo / 2, PISO + 0.05, -MURO / 2);
      viga(K.ext, a0, a1, 0.12, 0.1, madera);
      viga(K.ext, [a0[0], H - 0.05, a0[2]], [a1[0], H - 0.05, a1[2]], 0.12, 0.1, madera);
      // riostras en cruz de San Andrés en las esquinas
      viga(K.ext, puntoCara(f, -f.largo / 2 + 0.1, PISO + 0.1, -MURO / 2), puntoCara(f, -f.largo / 2 + 1.0, H - 0.2, -MURO / 2), 0.06, 0.08, madera);
      if (fronton(f.nombre)) {
        for (let s = -halfA + 0.9; s < halfA - 0.5; s += 0.9) {
          const p = puntoCara(f, s, 0, -MURO / 2);
          const yt = H + alz * (1 - Math.abs(s) / halfA) - 0.1;
          caja(K.ext, [p[0], (H + yt) / 2, p[2]], [0.08, yt - H, 0.08], madera, { tipo: 0 });
        }
      }
    }
  }
  // cabios, cumbrera y tirantes
  if (e === 2 || e === 3 || (terminado && o.cielo === false)) {
    for (let b = -halfB; b <= halfB + 1e-6; b += halfB * 2 / Math.max(2, Math.round(halfB * 2 / 0.9))) {
      for (const l of [-1, 1]) viga(K.ext, M(l * (halfA + vx * 0.85), yA + 0.02, b), M(0, yC - 0.08, b), 0.06, 0.13, madera, { arriba: [0, 1, 0] });
      if (Math.abs(b) < halfB - 0.2 || e === 2) viga(K.ext, M(-halfA + 0.05, H - 0.06, b), M(halfA - 0.05, H - 0.06, b), 0.07, 0.12, madera);
    }
    viga(K.ext, M(0, yC - 0.1, -halfB - vz), M(0, yC - 0.1, halfB + vz), 0.08, 0.16, madera);
  }
  if (e === 2) return R;

  // ---- 3 y 4: paredes por las dos caras
  const estilo = terminado ? (o.estilo ?? 'horizontal') : (o.estilo === 'chapa' ? 'chapa' : 'vertical');
  const colPared = terminado ? o.color : (o.estilo === 'chapa' ? PALETA_ALDEA.galvanizado : (medioHacer ? PALETA_ALDEA.crudoGris : PALETA_ALDEA.crudo));
  const estiloIn = terminado ? (o.interior ?? 'interior') : 'interior';
  const colIn = terminado ? (o.colorInterior ?? '#a8825a') : (medioHacer ? '#8f8578' : '#b48f63');
  const falso = terminado && o.falsoFrente;
  for (const f of Object.values(caras)) {
    const esF = fronton(f.nombre);
    let tope = esF ? (s) => H + alz * (1 - Math.abs(s) / halfA) : null;
    if (falso && f.nombre === 'frente') tope = () => yC + (o.falsoFrente.alto ?? 0.6);
    const hs = huecos[f.nombre];
    const desgaste = terminado ? (o.desgaste ?? 0.55) : 0;
    const frontEst = terminado && esF && o.fronton ? o.fronton : estilo;
    if (frontEst !== estilo && tope) {
      // el frontón con otro revestimiento (tejuelas, por ejemplo) arriba de la línea del alero
      paramento(K, K.ext, { ...f, y0: PISO - 0.03, y1: H, huecos: hs, estilo, color: colPared, suelo: 0, alero: H, desgaste, oxido: o.oxido });
      paramento(K, K.ext, { ...f, y0: H, y1: H, tope, huecos: [], estilo: frontEst, color: o.colorFronton ?? colPared, alero: H + alz, sombraAlero: 0.1 });
    } else {
      paramento(K, K.ext, { ...f, y0: PISO - 0.03, y1: H, tope, huecos: hs, estilo, color: colPared, suelo: 0, alero: tope ? H + alz : H, desgaste, oxido: o.oxido });
    }
    // la cara de adentro
    const fi = { nombre: f.nombre + '-in', cx: f.cx - f.nx * MURO, cz: f.cz - f.nz * MURO, nx: -f.nx, nz: -f.nz, largo: f.largo - 2 * MURO };
    const hsIn = hs.map((h) => ({ ...h, s0: -h.s1, s1: -h.s0 }));
    const topeIn = !conCielo && esF ? (s) => H + alz * (1 - Math.abs(s) / halfA) : null;
    // 3.6 (pulido): terminado, la cara de la estructura es un respaldo liso (lo que se ve de lejos por
    // una puerta abierta) y el machimbre con su matiz va en el interior, un dedo más adentro
    if (terminado) {
      paramento(K, K.ext, { ...fi, y0: PISO, y1: conCielo ? yCielo : H, tope: topeIn, huecos: hsIn, estilo: 'cal', fila: 3.5, color: colIn, tipo: 0, alero: conCielo ? yCielo : H, sombraAlero: 0.3 });
      const fm = { ...fi, cx: fi.cx + fi.nx * 0.008, cz: fi.cz + fi.nz * 0.008 };
      caraAdentro(K, { ...fm }, conCielo ? yCielo : H, topeIn, hsIn, colIn, estiloIn, conCielo ? yCielo : H, o);
    } else paramento(K, K.ext, { ...fi, y0: PISO, y1: conCielo ? yCielo : H, tope: topeIn, huecos: hsIn, estilo: estiloIn, color: colIn, tipo: 0, alero: conCielo ? yCielo : H, sombraAlero: 0.3 });
    if (falso && f.nombre === 'frente') {
      // la espalda del falso frente, sobre el techo
      paramento(K, K.ext, { nombre: 'falso', cx: 0, cz: D / 2 - 0.06, nx: 0, nz: -1, largo: W, y0: H - 0.2, y1: yC + (o.falsoFrente.alto ?? 0.6), estilo: 'vertical', color: '#7d6448' });
      caja(K.ext, [0, yC + (o.falsoFrente.alto ?? 0.6) + 0.06, D / 2 + 0.02], [W + 0.36, 0.14, 0.26], o.marco ?? PALETA_ALDEA.marco, { tipo: 4 });
      caja(K.ext, [0, yC + (o.falsoFrente.alto ?? 0.6) - 0.12, D / 2 + 0.05], [W + 0.2, 0.1, 0.12], o.marco ?? PALETA_ALDEA.marco, { tipo: 4 });
      for (const l of [-1, 1]) caja(K.ext, [l * (W / 2 + 0.02), (H + yC + (o.falsoFrente.alto ?? 0.6)) / 2, D / 2 + 0.02], [0.16, yC + (o.falsoFrente.alto ?? 0.6) - H, 0.18], o.marco ?? PALETA_ALDEA.marco, { tipo: 4 });
    }
    // aberturas
    for (const h of hs) {
      if (h.ventana) ventana(K, f, h, { marco: o.marco, postigo: o.postigo, tapiada: medioHacer, cortina: o.cortina, cuarto: (h.ventana.cuarto ?? (o.tabique && (f.nombre === 'fondo' || h.ventana.z < o.tabique.z) ? 'vivienda' : 'local')) });
      else if (h.puerta) marcoPuerta(K, f, h, { marco: o.marco, tapiada: medioHacer && f.nombre === 'frente' });
    }
  }
  // esquineros
  const colEsq = terminado ? (o.esquinero ?? o.marco ?? PALETA_ALDEA.marco) : (medioHacer ? PALETA_ALDEA.crudoGris : PALETA_ALDEA.crudo);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(K.ext, [sx * (W / 2 + 0.015), (PISO + H) / 2, sz * (D / 2 + 0.015)], [0.19, H - PISO + 0.02, 0.19], colEsq, { tipo: terminado ? 4 : 0 });
  // colisión de las paredes (las puertas abiertas en la 3 de una obra; la escuela tapiada, cerrada)
  const PARED = { desde: 0, hasta: H, espesor: 0.16, dibujar: false };
  for (const f of Object.values(caras)) {
    const L2 = f.largo / 2;
    const a = puntoCara(f, -L2, 0, -MURO / 2), b = puntoCara(f, L2, 0, -MURO / 2);
    const hp = medioHacer ? [] : huecos[f.nombre].filter((h) => h.puerta).map((h) => ({ desde: h.s0 + L2, hasta: h.s1 + L2 }));
    K.PA.paredRecta({ ...PARED, a: [a[0], a[2]], b: [b[0], b[2]], huecos: hp });
  }

  // ---- tabique de la vivienda (cuarto de atrás)
  if (o.tabique) {
    const t = o.tabique;
    const ancho = t.ancho ?? 1.05;
    const fT = { nombre: 'tab', cx: 0, cz: t.z + 0.05, nx: 0, nz: 1, largo: W - 2 * MURO };
    const fT2 = { nombre: 'tab2', cx: 0, cz: t.z - 0.05, nx: 0, nz: -1, largo: W - 2 * MURO };
    const yTop = conCielo ? yCielo : H;
    {
      const hT = [{ s0: t.x - ancho / 2, s1: t.x + ancho / 2, y0: PISO - 0.1, y1: PISO + PUERTA_ALTO }];
      if (terminado) {
        paramento(K, K.ext, { ...fT, y0: PISO, y1: yTop, huecos: hT, estilo: 'cal', fila: 3.5, color: colIn, tipo: 0, alero: yTop, sombraAlero: 0.3 });
        caraAdentro(K, { ...fT, cx: fT.cx + fT.nx * 0.008, cz: fT.cz + fT.nz * 0.008 }, yTop, null, hT, colIn, estiloIn, yTop, o);
      } else paramento(K, K.ext, { ...fT, y0: PISO, y1: yTop, huecos: hT, estilo: estiloIn, color: colIn, tipo: 0, alero: yTop, sombraAlero: 0.3 });
    }
    {
      const hT = [{ s0: -t.x - ancho / 2, s1: -t.x + ancho / 2, y0: PISO - 0.1, y1: PISO + PUERTA_ALTO }];
      if (terminado) {
        paramento(K, K.ext, { ...fT2, y0: PISO, y1: yTop, huecos: hT, estilo: 'cal', fila: 3.5, color: o.colorVivienda ?? colIn, tipo: 0, alero: yTop, sombraAlero: 0.3 });
        caraAdentro(K, { ...fT2, cx: fT2.cx + fT2.nx * 0.008, cz: fT2.cz + fT2.nz * 0.008 }, yTop, null, hT, o.colorVivienda ?? colIn, estiloIn, yTop, o);
      } else paramento(K, K.ext, { ...fT2, y0: PISO, y1: yTop, huecos: hT, estilo: estiloIn, color: o.colorVivienda ?? colIn, tipo: 0, alero: yTop, sombraAlero: 0.3 });
    }
    if (!conCielo) caja(K.ext, [0, yTop - 0.03, t.z], [W - 2 * MURO, 0.06, 0.12], madera, { tipo: 0 });
    const colM = terminado ? (o.colorEstructura ?? '#5a4331') : PALETA_ALDEA.crudo;
    for (const l of [-1, 1]) caja(K.ext, [t.x + l * (ancho / 2 + 0.05), PISO + PUERTA_ALTO / 2, t.z], [0.1, PUERTA_ALTO, 0.16], colM, { tipo: 0 });
    caja(K.ext, [t.x, PISO + PUERTA_ALTO + 0.05, t.z], [ancho + 0.2, 0.1, 0.16], colM, { tipo: 0 });
    const L2 = W / 2 - MURO;
    K.PA.paredRecta({ desde: 0, hasta: yTop, espesor: 0.12, dibujar: false, a: [-L2, t.z], b: [L2, t.z], huecos: [{ desde: t.x - ancho / 2 + L2, hasta: t.x + ancho / 2 + L2 }] });
    // la cortina del paso, corrida
    if (terminado && o.cortinaPaso !== false) caja(K.ext, [t.x - ancho / 2 + 0.12, PISO + 1.05, t.z + 0.09], [0.22, 1.95, 0.04], o.cortinaPaso ?? '#8a5a4a', { tipo: 0, bajo: 0.85 });
  }

  // ---- cielorraso
  if (conCielo) {
    cielorraso(K, K.ext, { x0: xi0, x1: xi1, z0: zi0, z1: zi1, y: yCielo, color: o.colorCielo ?? '#a07a52' });
    // la moldura del encuentro
    for (const z of [zi0 + 0.03, zi1 - 0.03]) caja(K.ext, [0, yCielo - 0.04, z], [W - 2 * MURO, 0.08, 0.06], o.colorEstructura ?? '#5a4331', { tipo: 0 });
  } else {
    // sin cielorraso: los frontones por adentro ya se dibujaron; la chapa por abajo es el entablonado
  }

  // ---- techo
  const colTecho = terminado ? o.colorTecho : PALETA_ALDEA.galvanizado;
  const A = halfA + vx, B = halfB + vz;
  for (const l of [1, -1]) {
    const e0 = l > 0 ? [A, yA, B] : [-A, yA, -B], e1 = l > 0 ? [A, yA, -B] : [-A, yA, B];
    chapaPlano(K, K.ext, M(...e0), M(...e1), M(0, yC, e1[2]), M(0, yC, e0[2]), { color: colTecho, oxido: terminado ? (o.oxido ?? 0.45) : 0.05, musgo: terminado ? (o.musgo ?? 0.7) : 0, debajo: '#80654a' });
    // tabla de alero (fascia) y cenefas de los frontones
    const colTabla = terminado ? (o.marco ?? PALETA_ALDEA.marco) : PALETA_ALDEA.crudo;
    viga(K.ext, M(l * (A + 0.02), yA - 0.07, -B), M(l * (A + 0.02), yA - 0.07, B), 0.04, 0.18, colTabla, { tipo: 4 });
    for (const b of [-B - 0.02, B + 0.02]) {
      const dirA = [-l * A, yC - yA, 0];
      const nrm = Math.hypot(dirA[0], dirA[1]);
      const arriba = M(l * (yC - yA) / nrm, A / nrm, 0);
      viga(K.ext, M(l * (A + 0.02), yA - 0.05, b), M(0, yC - 0.05, b), 0.05, 0.2, colTabla, { tipo: 4, arriba });
    }
  }
  viga(K.ext, M(0, yC + 0.035, -B - 0.03), M(0, yC + 0.035, B + 0.03), 0.3, 0.06, terminado ? '#5c5a56' : PALETA_ALDEA.galvanizado, { tipo: 4 });
  // canaleta y caño de bajada (terminado)
  if (terminado && o.canaleta !== false) {
    const l = 1;
    const p0 = M(l * (A + 0.08), yA - 0.12, -B), p1 = M(l * (A + 0.08), yA - 0.12, B);
    palo(K.ext, p0, p1, 0.055, '#6c706f', { tipo: 4, lados: 6, abierto: false });
    const pb = M(l * (halfA + 0.07), 0.1, halfB - 0.12), pc = M(l * (A + 0.08), yA - 0.14, halfB - 0.12);
    palo(K.ext, pb, [pb[0], yA - 0.45, pb[2]], 0.04, '#6c706f', { tipo: 4 });
    palo(K.ext, [pb[0], yA - 0.45, pb[2]], pc, 0.04, '#6c706f', { tipo: 4 });
  }

  // ---- galería
  if (o.galeria) galeria(K, o, R);

  // ---- chimenea
  if (terminado && o.chimenea) {
    const ch = o.chimenea;
    if (ch.tipo === 'piedra') {
      const f = caras[ch.cara];
      const s = ch.s ?? 0;
      const esF = fronton(ch.cara);
      const yTop = (esF ? H + alz * (1 - Math.abs(s) / halfA) : yC) + 0.7;
      const rr = azar(semillaDe(K.id + '|chim'));
      let y = -0.1;
      while (y < yTop) {
        const h = Math.min(entre(rr, 0.45, 0.75), yTop - y);
        const ach = y < H - 0.3 ? 0.95 : 0.66;
        const p = puntoCara(f, s, y + h / 2, 0.36);
        caja(K.ext, [p[0] + (rr() - 0.5) * 0.03, p[1], p[2] + (rr() - 0.5) * 0.03], [ach + rr() * 0.06, h, 0.6 + rr() * 0.05], elegir(rr, PALETA_ALDEA.laja), { giro: giroCara(f), tipo: 4, bajo: 0.75 });
        y += h;
      }
      const p = puntoCara(f, s, yTop + 0.06, 0.36);
      caja(K.ext, p, [0.86, 0.1, 0.78], '#6b665e', { giro: giroCara(f), tipo: 4 });
      K.chimenea = { lx: p[0], ly: yTop + 0.15, lz: p[2] };
      const pc = puntoCara(f, s, 0, 0.36);
      K.mueble(pc[0], pc[2], 0.95, 0.62, H, giroCara(f), 0);
    } else {
      const yR = yTecho(ch.x, ch.z) - 0.1;
      const yTop = Math.max(yC + 0.5, yR + 0.9);
      cilindro(K.ext, [ch.x, (yR + yTop) / 2, ch.z], 0.1, 0.1, yTop - yR, '#4a4642', { tipo: 4, lados: 8, abierto: true });
      cono(K.ext, [ch.x, yTop + 0.13, ch.z], 0.22, 0.16, '#3f3b37', { tipo: 4, lados: 8 });
      cilindro(K.ext, [ch.x, yTop + 0.02, ch.z], 0.12, 0.12, 0.08, '#3f3b37', { tipo: 4, lados: 8, abierto: true });
      cono(K.ext, [ch.x, yR + 0.08, ch.z], 0.2, 0.14, '#55524d', { tipo: 4, lados: 8 });
      K.chimenea = { lx: ch.x, ly: yTop + 0.22, lz: ch.z };
    }
  }
  // lo que queda bajo techo (para que no nieve adentro) y la puerta para puertas.js
  const zG = o.galeria ? D / 2 + (o.galeria.fondo ?? 1.7) : D / 2;
  K.techo = { x0: -W / 2, x1: W / 2, z0: -D / 2, z1: zG, radio: Math.min(W, D) / 2 };
  K.pisos.push({ lx: 0, lz: (zG - D / 2) / 2, largo: W, ancho: zG + D / 2 });
  if (terminado) {
    for (const h of huecos.frente) {
      if (!h.puerta || h.puerta.abierta) continue;
      const s = (h.s0 + h.s1) / 2;
      K.puertas.push({ lx: s, lz: D / 2 - MURO / 2, ancho: h.s1 - h.s0 - 0.04, alto: (h.y1 - PISO) - 0.04, lado: -1, adentro: true, piso: PISO, nombre: h.puerta.nombre ?? ('la puerta de ' + (K.def.nombre || K.id).toLowerCase()) });
    }
  }
  const pf = (o.puertas || []).find((p) => p.cara === 'frente');
  const xP = pf ? (pf.x ?? 0) : 0;
  K.punto('entrada', xP, zG + 0.9, Math.PI, o.galeria ? 0 : 0);
  K.punto('adentro', xP, D / 2 - 1.0, Math.PI);
  return R;
}

// Un escalón de entrada: de tablas sobre dos tacos, o una laja grande asentada (según la semilla).
function escalon(K, x, z, ancho = 1.5) {
  const c = K.ext, r = azar(semillaDe(K.id + '|escalon'));
  if (r() < 0.55) {
    for (const s of [-1, 1]) caja(c, [x + s * (ancho / 2 - 0.12), 0.06, z], [0.12, 0.13, 0.4], '#4e3a28', { tipo: 0, bajo: 0.55 });
    for (const dz of [-0.105, 0.105]) caja(c, [x + (r() - 0.5) * 0.04, 0.145, z + dz], [ancho, 0.05, 0.2], elegir(r, ['#7a5a3c', '#6e5036', '#86643f']), { tipo: 0, bajo: 0.7, giro: (r() - 0.5) * 0.03 });
  } else {
    bulto(c, [x, 0.06, z], 0.5, elegir(r, ['#6d6a62', '#625e57', '#77706480'.slice(0, 7)]), { esc: [ancho / 0.95, 0.24, 0.95], rot: [0, (r() - 0.5) * 0.15, 0], tipo: 4, bajo: 0.5, alto: 0.95, abollar: 0.03 });
    bulto(c, [x + ancho * 0.42, 0.03, z + 0.1], 0.18, elegir(r, PALETA_ALDEA.laja), { esc: [1.3, 0.4, 1], tipo: 4 });
  }
  K.plataforma(x, z, ancho, 0.44, 0.16, 0.16);
}
// 3.6 (pulido): la cara de adentro, en el interior. Machimbre con matiz; o, si es de cal, un friso
// de machimbre pintado hasta la cintura y el revoque blanqueado arriba (manchado, nunca parejo).
function caraAdentro(K, f, y1, tope, huecos, color, estiloIn, alero, o) {
  if (estiloIn !== 'cal') {
    paramento(K, K.int, { ...f, y0: PISO, y1, tope, huecos, estilo: 'machimbre', color, tipo: 0, alero, sombraAlero: 0.35, suelo: PISO - 0.4 });
    return;
  }
  const yF = PISO + 1.05, friso = o.colorFriso ?? '#5f7466';
  paramento(K, K.int, { ...f, y0: PISO, y1: yF, huecos, estilo: 'machimbre', fila: 0.13, color: friso, tipo: 0, alero: y1, suelo: PISO - 0.4, desgaste: 0.5, madera: tinte('#8a6a48') });
  paramento(K, K.int, { ...f, y0: yF, y1, tope, huecos, estilo: 'cal', fila: 0.4, color, tipo: 0, alero, sombraAlero: 0.4, desgaste: 0.25, madera: tinte('#b8a888') });
  // la moldura del friso
  const L2 = f.largo / 2;
  let tramos = [[-L2, L2]];
  for (const h of huecos) if (h.y0 < yF + 0.02 && h.y1 > yF - 0.02) tramos = restarTramos(tramos, h.s0, h.s1);
  for (const [a, b] of tramos) {
    const pa = puntoCara(f, a, yF, 0.02), pb = puntoCara(f, b, yF, 0.02);
    viga(K.int, pa, pb, 0.04, 0.05, '#4e3a28', { tipo: 0 });
  }
}
// La galería del frente: deck de tablas, postes con ménsulas y su techito de chapa.
function galeria(K, o, R) {
  const { W, D, etapa: e } = K;
  const g = o.galeria;
  const G = g.fondo ?? 1.7;
  const x0 = g.x0 ?? -W / 2 - 0.1, x1 = g.x1 ?? W / 2 + 0.1;
  const z1 = D / 2 + G;
  const terminado = e >= 4;
  // (pintados hace años: la pintura de los postes tira a la madera)
  const madera = terminado ? (o.colorPostes ?? ('#' + new THREE.Color().copy(lin(o.marco ?? PALETA_ALDEA.marco)).lerp(lin('#7a6048'), 0.32).getHexString())) : PALETA_ALDEA.crudo;
  pisoTablas(K, K.ext, { x0, x1, z0: D / 2 + 0.06, z1, y: GALERIA_PISO, color: terminado ? '#7d5d40' : PALETA_ALDEA.crudo, ancho: 0.22, ocluir: false });
  caja(K.ext, [(x0 + x1) / 2, GALERIA_PISO / 2 - 0.03, z1 - 0.03], [x1 - x0, GALERIA_PISO + 0.04, 0.06], '#5a4331', { tipo: 0 });
  for (const x of [x0 + 0.03, x1 - 0.03]) caja(K.ext, [x, GALERIA_PISO / 2 - 0.03, (D / 2 + z1) / 2], [0.06, GALERIA_PISO + 0.04, G], '#5a4331', { tipo: 0 });
  K.plataforma((x0 + x1) / 2, (D / 2 + z1) / 2, x1 - x0, G, GALERIA_PISO, GALERIA_PISO + 0.05);
  // el techito: de la pared (bajo el alero principal) hacia la calle
  const yAleroFrente = R.eje === 'x' ? R.yA : R.H;
  const yG0 = Math.min(yAleroFrente - 0.12, R.H - 0.1);
  const pendG = 0.16;
  const zE = z1 + 0.25;
  const yE = yG0 - (zE - D / 2) * pendG;
  const yPoste = (z) => yG0 - (z - D / 2) * pendG - 0.1;
  K.extra.galeria = { x0, x1, z1, zE, yE, yG0, zP: z1 - 0.13, yPoste: yPoste(z1 - 0.13) };
  // postes, lejos de la puerta
  const pf = (o.puertas || []).find((p) => p.cara === 'frente');
  const xP = pf ? (pf.x ?? 0) : 0;
  const n = g.postes ?? Math.max(2, Math.round((x1 - x0) / 2.4) + 1);
  const zP = z1 - 0.13;
  const xs = [];
  const libre = (pf?.ancho ?? PUERTA_ANCHO) / 2 + 0.3;
  for (let i = 0; i < n; i++) {
    let x = x0 + 0.14 + (x1 - x0 - 0.28) * (n === 1 ? 0.5 : i / (n - 1));
    if (Math.abs(x - xP) < libre) x = xP + Math.sign(x - xP || 1) * libre;
    if (!xs.some((y) => Math.abs(y - x) < 0.5)) xs.push(x);
  }
  for (const x of xs) {
    caja(K.ext, [x, (GALERIA_PISO + yPoste(zP)) / 2, zP], [0.13, yPoste(zP) - GALERIA_PISO, 0.13], madera, { tipo: terminado ? 4 : 0 });
    caja(K.ext, [x, GALERIA_PISO + 0.04, zP], [0.2, 0.08, 0.2], '#7f7a70', { tipo: 4 });
    for (const l of [-1, 1]) viga(K.ext, [x, yPoste(zP) - 0.5, zP], [x + l * 0.42, yPoste(zP) - 0.06, zP], 0.07, 0.07, madera, { tipo: terminado ? 4 : 0 });
    K.circulo(x, zP, 0.1, 0, yPoste(zP));
  }
  viga(K.ext, [x0 - 0.05, yPoste(zP) + 0.0, zP], [x1 + 0.05, yPoste(zP) + 0.0, zP], 0.14, 0.14, madera, { tipo: terminado ? 4 : 0 });
  if (terminado) {
    chapaPlano(K, K.ext, [x0 - 0.15, yE, zE], [x1 + 0.15, yE, zE], [x1 + 0.15, yG0, D / 2], [x0 - 0.15, yG0, D / 2],
      { color: o.colorTechoGaleria ?? o.colorTecho, oxido: (o.oxido ?? 0.25) + 0.1, debajo: '#80654a', filas: [0, 0.3, 1] });
    viga(K.ext, [x0 - 0.15, yE - 0.06, zE + 0.02], [x1 + 0.15, yE - 0.06, zE + 0.02], 0.04, 0.16, o.marco ?? PALETA_ALDEA.marco, { tipo: 4, arriba: [0, 1, -pendG] });
    if (g.baranda) {
      for (const [xa, xb] of [[x0 + 0.1, xP - 0.7], [xP + 0.7, x1 - 0.1]]) {
        if (xb - xa < 0.5) continue;
        viga(K.ext, [xa, GALERIA_PISO + 0.85, zP], [xb, GALERIA_PISO + 0.85, zP], 0.07, 0.06, madera, { tipo: 4 });
        for (let x = xa; x <= xb + 1e-6; x += 0.3) caja(K.ext, [x, GALERIA_PISO + 0.43, zP], [0.04, 0.8, 0.04], madera, { tipo: 4 });
        K.segmento(xa, zP, xb, zP, 0.06, GALERIA_PISO, GALERIA_PISO + 0.9);
      }
    }
  }
  // el farolito de pared junto a la puerta: de noche brilla con los vidrios (y es una luz más, en spec)
  if (terminado && o.farolPuerta !== false) {
    const xl = xP + (pf?.ancho ?? PUERTA_ANCHO) / 2 + 0.32, yl = PISO + 2.05, zl = D / 2 + 0.06;
    caja(K.ext, [xl, yl, zl + 0.05], [0.05, 0.05, 0.12], '#2f2c2a', { tipo: 4 });
    caja(K.ext, [xl, yl + 0.16, zl + 0.13], [0.2, 0.04, 0.2], '#2f2c2a', { tipo: 4 });
    const k0 = { r: 1, g: 0.9, b: 0.7 };
    for (const [ax, az, bx, bz] of [[-0.07, 0.2, 0.07, 0.2], [0.07, 0.2, 0.07, 0.06], [-0.07, 0.06, -0.07, 0.2]]) quad(K.vid, [xl + ax, yl - 0.1, zl + az], [xl + bx, yl - 0.1, zl + bz], [xl + bx, yl + 0.13, zl + bz], [xl + ax, yl + 0.13, zl + az], k0, k0, k0, k0, 0);
    K.luz(xl, yl, zl + 0.3, { color: 0xffc070, radio: 5, intensidad: 0.7, clase: 'farol', cuarto: 'afuera' });
  }
  // escalón frente a la puerta
  escalon(K, xP, z1 + 0.22, 1.5);
  K.abarcar(x0 - 0.2, x1 + 0.2, -D / 2, zE + 0.5);
}

// ---------------------------------------------------------------- muebles (adentro: aTipo 0, sin nieve)
// Cada mueble se arma en su propio marco (x, z, giro): su frente mira a +Z local del giro.
const cj = (c, F, lx, ly, lz, sx, sy, sz, color, o = {}) => caja(c, F.p(lx, ly, lz), [sx, sy, sz], color, { ...o, giro: F.giro + (o.giro ?? 0) });
const cl = (c, F, lx, ly, lz, r0, r1, h, color, o = {}) => cilindro(c, F.p(lx, ly, lz), r0, r1, h, color, { ...o, giro: F.giro + (o.giro ?? 0) });
const MADERA_MUEBLE = ['#7a5636', '#6b4a2e', '#86603c', '#5e432c'];

function mesa(K, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro, PISO), c = K.int;
  const L = o.largo ?? 1.2, A = o.ancho ?? 0.75, h = o.alto ?? 0.76, col = o.color ?? MADERA_MUEBLE[1];
  cj(c, F, 0, h - 0.025, 0, L, 0.05, A, col);
  if (o.mantel) cj(c, F, 0, h + 0.004, 0, L * 0.8, 0.012, A * 0.9, o.mantel, { bajo: 0.95 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cj(c, F, sx * (L / 2 - 0.07), (h - 0.05) / 2, sz * (A / 2 - 0.07), 0.06, h - 0.05, 0.06, col, { bajo: 0.6 });
  if (o.choca !== false) K.mueble(x, z, L, A, h, giro);
}
function silla(K, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro, PISO), c = K.int, col = o.color ?? MADERA_MUEBLE[0];
  cj(c, F, 0, 0.45, 0, 0.42, 0.04, 0.4, col);
  cj(c, F, 0, 0.72, -0.19, 0.42, 0.5, 0.035, col, { rx: -0.08 });
  for (const sx of [-1, 1]) {
    cj(c, F, sx * 0.18, 0.22, 0.16, 0.04, 0.44, 0.04, col, { bajo: 0.6 });
    cj(c, F, sx * 0.18, 0.45, -0.17, 0.04, 0.9, 0.04, col, { bajo: 0.6 });
  }
  if (o.asiento !== false) K.asiento(o.nombre ?? 'una silla', x, PISO + 0.47, z, giro);
  if (o.choca !== false) K.circulo(x, z, 0.2, PISO, PISO + 0.95);
}
function cama(K, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro, PISO), c = K.int;
  const L = 1.95, A = o.ancho ?? 0.95, col = o.color ?? MADERA_MUEBLE[2];
  cj(c, F, 0, 0.22, 0, A, 0.18, L, col);
  cj(c, F, 0, 0.38, 0.05, A - 0.06, 0.16, L - 0.12, '#e4dccb', { bajo: 0.85 });
  cj(c, F, 0, 0.48, 0.25, A + 0.04, 0.06, L - 0.55, o.manta ?? '#8e3f34', { bajo: 0.75 });
  cj(c, F, 0, 0.5, -L / 2 + 0.3, A - 0.2, 0.12, 0.34, '#f0ebe0', { bajo: 0.85 });
  cj(c, F, 0, 0.55, -L / 2 + 0.02, A + 0.06, 0.95, 0.07, col);
  cj(c, F, 0, 0.32, L / 2 - 0.02, A + 0.06, 0.5, 0.06, col);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cj(c, F, sx * (A / 2 - 0.03), 0.07, sz * (L / 2 - 0.05), 0.07, 0.14, 0.07, col);
  K.mueble(x, z, A + 0.06, L, 0.56, giro);
  if (o.punto !== false) {
    // al costado de la cama que da al centro de la casa
    const p1 = F.p(A / 2 + 0.45, 0, 0.2), p2 = F.p(-A / 2 - 0.45, 0, 0.2);
    const p = o.alPie ? F.p(0, 0, L / 2 + 0.45) : Math.hypot(p1[0], p1[2]) < Math.hypot(p2[0], p2[2]) ? p1 : p2;
    K.punto(o.nombre ?? 'cama', p[0], p[2], Math.atan2(x - p[0], z - p[2]));
  }
}
// cocina a leña de hierro, con su caño hasta el cielorraso (el de afuera lo pone el casco)
function tuboCocina(x, z, giro) { const F = marcoLocal(x, z, giro); const p = F.p(0.26, 0, -0.18); return { x: p[0], z: p[2] }; }
function cocinaLena(K, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro, PISO), c = K.int;
  const hierro = '#2f2c29';
  cj(c, F, 0, 0.42, 0, 0.92, 0.66, 0.62, hierro, { bajo: 0.7, alto: 1.15 });
  cj(c, F, 0, 0.77, 0, 0.98, 0.05, 0.68, '#3c3834');
  cj(c, F, -0.2, 0.42, 0.315, 0.34, 0.3, 0.02, '#4a453f');
  cj(c, F, 0.24, 0.5, 0.315, 0.22, 0.14, 0.02, '#4a453f');
  cj(c, F, 0, 0.84, 0.36, 0.9, 0.035, 0.035, '#9a8f7d');   // la baranda del frente
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cj(c, F, sx * 0.42, 0.05, sz * 0.27, 0.06, 0.1, 0.06, hierro);
  // la pava y la olla
  cl(c, F, -0.22, 0.86, -0.05, 0.11, 0.09, 0.14, '#7d7b74');
  cl(c, F, 0.08, 0.88, 0.05, 0.13, 0.13, 0.17, '#5b4c3f');
  // las brasas que se ven por la rendija
  const pb = F.p(-0.2, 0.36, 0.33);
  caja(K.bra, pb, [0.22, 0.06, 0.01], '#ff8a3a', { giro, tipo: 0, bajo: 0.6, alto: 1.2 });
  const yC = PISO + LIBRE;
  const t = F.p(0.26, 0, -0.18);
  cilindro(c, [t[0], (PISO + 0.8 + yC) / 2, t[2]], 0.065, 0.065, yC - PISO - 0.8, '#2b2825', { lados: 8, abierto: true });
  K.mueble(x, z, 0.98, 0.68, 0.84, giro);
  // la leña al lado
  const pl = F.p(-0.75, 0, 0);
  for (let i = 0; i < 5; i++) palo(c, [pl[0] - 0.18 + (i % 3) * 0.14, PISO + 0.06 + Math.floor(i / 3) * 0.12, pl[2] - 0.22], [pl[0] - 0.18 + (i % 3) * 0.14, PISO + 0.06 + Math.floor(i / 3) * 0.12, pl[2] + 0.22], 0.055, i % 2 ? '#7a5a3a' : '#6a4d33', { abierto: false });
  const p = F.p(0, 0, 0.86);
  K.punto(o.nombre ?? 'cocina', p[0], p[2], giro + Math.PI);
  K.luz(F.p(0, 0, 0.5)[0], PISO + 0.7, F.p(0, 0, 0.5)[2], { color: 0xff8a40, radio: 3.5, intensidad: 0.5, clase: 'fuego', cuarto: o.cuarto ?? 'vivienda' });
}
function salamandra(K, x, z, o = {}) {
  const c = K.int;
  cilindro(c, [x, PISO + 0.45, z], 0.24, 0.24, 0.7, '#2f2c29', { lados: 10, bajo: 0.65 });
  cono(c, [x, PISO + 0.88, z], 0.26, 0.16, '#3a3632', { tipo: 0, lados: 10 });
  for (let i = 0; i < 3; i++) { const a = i * 2.1; caja(c, [x + Math.sin(a) * 0.18, PISO + 0.05, z + Math.cos(a) * 0.18], [0.05, 0.1, 0.05], '#2f2c29'); }
  caja(K.bra, [x, PISO + 0.4, z + 0.235], [0.16, 0.12, 0.01], '#ff8a3a', { tipo: 0, bajo: 0.6, alto: 1.2 });
  const yC = PISO + LIBRE;
  cilindro(c, [x, (PISO + 0.95 + yC) / 2, z], 0.07, 0.07, yC - PISO - 0.95, '#2b2825', { lados: 8, abierto: true });
  K.circulo(x, z, 0.3, PISO, PISO + 1.0);
  K.luz(x, PISO + 0.6, z + 0.4, { color: 0xff8a40, radio: 3.5, intensidad: 0.5, clase: 'fuego', cuarto: o.cuarto ?? 'local' });
}
// estantería contra la pared (frente a +Z), con lo que corresponda al oficio
function estanteria(K, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro, PISO), c = K.int;
  const L = o.largo ?? 1.6, h = o.alto ?? 2.0, P = o.prof ?? 0.38, col = o.color ?? MADERA_MUEBLE[3];
  const r = azar(semillaDe(K.id + '|est' + x.toFixed(2) + z.toFixed(2)));
  cj(c, F, 0, h / 2, -P / 2 + 0.02, L, h, 0.03, col, { bajo: 0.7 });
  for (const sx of [-1, 1]) cj(c, F, sx * (L / 2 - 0.02), h / 2, 0, 0.04, h, P, col);
  const nEst = o.estantes ?? 4;
  for (let i = 0; i <= nEst; i++) {
    const y = 0.08 + i * (h - 0.12) / nEst;
    cj(c, F, 0, y, 0, L - 0.04, 0.035, P, col);
    if (i === nEst) break;
    const yb = y + 0.02;
    const altoHueco = (h - 0.12) / nEst - 0.06;
    let lx = -L / 2 + 0.1;
    while (lx < L / 2 - 0.14) {
      const tipo = o.cosas ?? 'almacen';
      const k = r();
      if (tipo === 'libros') {
        // los lomos: un cuadrilátero por libro (de colores apagados) delante de un bloque oscuro
        if (lx === -L / 2 + 0.1) cj(c, F, 0, yb + 0.12, -0.03, L - 0.12, 0.24, P - 0.12, '#3a2c22', { bajo: 0.6 });
        const a = entre(r, 0.045, 0.095), hh = Math.min(altoHueco, entre(r, 0.19, 0.29));
        const k = escalar(tinte(elegir(r, ['#6b2f2a', '#2f4a5f', '#5d5a33', '#7a5a2c', '#3a3a3a', '#8a7a5a', '#4a5a4a', '#7a6a5a', '#5a3a4a'])), 0.85 + 0.25 * r());
        const zl = P / 2 - 0.06, ka = escalar(k, 0.7);
        quad(c, F.p(lx, yb, zl), F.p(lx + a, yb, zl), F.p(lx + a, yb + hh, zl), F.p(lx, yb + hh, zl), ka, ka, k, k, 0);
        lx += a + 0.004;
        if (r() < 0.05) lx += 0.12;
      } else if (tipo === 'frascos' || (tipo === 'almacen' && k < 0.35)) {
        const rr = entre(r, 0.045, 0.07), hh = Math.min(altoHueco, entre(r, 0.12, 0.22));
        cl(c, F, lx + rr, yb + hh / 2, 0, rr, rr, hh, o.colorFrasco ?? elegir(r, ['#9c7a2a', '#8e9c6a', '#b0632a', '#7d6a4a']), { lados: 7 });
        lx += rr * 2 + 0.03;
      } else if (tipo === 'panes') {
        bulto(c, F.p(lx + 0.1, yb + 0.06, 0), 0.1, elegir(r, ['#b47a3c', '#c58b47', '#a86a32']), { esc: [1.3, 0.6, 0.8], tipo: 0, detalle: 1, suave: true });
        lx += 0.22;
      } else if (tipo === 'madejas') {
        cl(c, F, lx + 0.07, yb + 0.07, 0, 0.07, 0.07, 0.22, elegir(r, ['#b0442f', '#d9b44a', '#4a6a8a', '#6a8a4a', '#e8e0d0', '#7a4a6a', '#c9773a']), { rz: Math.PI / 2, lados: 8 });
        lx += 0.16;
      } else if (tipo === 'herramientas') {
        cj(c, F, lx + 0.12, yb + 0.06, 0, 0.24, 0.12, 0.18, elegir(r, ['#6b4a2e', '#55524d', '#7a3a2a']));
        lx += 0.3;
      } else {
        const a = entre(r, 0.12, 0.26), hh = Math.min(altoHueco, entre(r, 0.12, 0.26));
        cj(c, F, lx + a / 2, yb + hh / 2, 0, a, hh, 0.2, elegir(r, ['#a8563a', '#5f7a86', '#c9b27a', '#7a8a5a', '#d8cfb8', '#8a4a3a']), { giro: (r() - 0.5) * 0.2 });
        lx += a + 0.03;
      }
    }
  }
  K.mueble(x, z, L, P, h, giro);
}
function mostrador(K, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro, PISO), c = K.int;
  const L = o.largo ?? 2.2, A = o.ancho ?? 0.6, h = 0.95, col = o.color ?? '#6e5036';
  cj(c, F, 0, h / 2, 0.02, L, h - 0.05, A - 0.08, col, { bajo: 0.65 });
  cj(c, F, 0, h - 0.02, 0, L + 0.06, 0.05, A, o.tapa ?? '#8a6a48');
  // tablero de adelante con molduras pintadas
  for (let i = 0; i < Math.round(L / 0.55); i++) cj(c, F, -L / 2 + 0.275 + i * 0.55, h * 0.5, A / 2 - 0.02, 0.42, h * 0.62, 0.02, o.panel ?? '#5b4330', { bajo: 0.75 });
  cj(c, F, 0, 0.05, A / 2 - 0.03, L, 0.1, 0.04, '#3e2f22');
  K.mueble(x, z, L + 0.06, A, h, giro);
  const pa = F.p(0, 0, -A / 2 - 0.5), pc = F.p(0, 0, A / 2 + 0.55);
  K.punto(o.nombre ?? 'mostrador', F.p(0, 0, 0)[0], F.p(0, 0, 0)[2], giro, PISO + h);
  K.punto('atiende', pa[0], pa[2], giro);
  K.punto('cliente', pc[0], pc[2], giro + Math.PI);
}
function bolsa(K, x, z, o = {}) {
  const c = o.c ?? K.int, y = o.y ?? PISO;
  cilindro(c, [x, y + 0.3, z], 0.24, 0.2, 0.6, o.color ?? '#d8cdb0', { lados: 8, bajo: 0.7, giro: o.giro ?? 0, tipo: o.tipo ?? 0 });
  cono(c, [x, y + 0.66, z], 0.16, 0.14, o.color ?? '#d8cdb0', { tipo: o.tipo ?? 0, lados: 7, giro: 0.4 });
}
function barril(K, x, z, o = {}) {
  const c = o.c ?? K.int, y = o.y ?? PISO, h = o.alto ?? 0.8;
  cilindro(c, [x, y + h / 2, z], 0.28, 0.28, h, o.color ?? '#7a5636', { lados: 10, tipo: o.tipo ?? 0, bajo: 0.7, esc: [1, 1, 1] });
  for (const t of [0.18, 0.82]) cilindro(c, [x, y + h * t, z], 0.295, 0.295, 0.05, '#3e3a35', { lados: 10, abierto: true, tipo: o.tipo ?? 0 });
  cilindro(c, [x, y + h + 0.005, z], 0.26, 0.26, 0.01, '#5a4130', { lados: 10, tipo: o.tipo ?? 0 });
  if (o.choca !== false) {
    if (c === K.int) K.circulo(x, z, 0.3, y, y + h);
    else K.circulo(x, z, 0.3, y, y + h);
  }
}
function banco(K, c, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro, o.y ?? 0), L = o.largo ?? 1.6, col = o.color ?? '#7a5a3c', tipo = o.tipo ?? 0;
  // tablones gruesos (tres en el asiento, dos en el respaldo), cada uno con su tono
  for (let i = 0; i < 3; i++) cj(c, F, 0, 0.44, -0.13 + i * 0.13, L, 0.065, 0.115, col, { tipo, bajo: 0.75, alto: 1.1 - i * 0.04 });
  if (o.respaldo !== false) {
    cj(c, F, 0, 0.8, -0.2, L, 0.12, 0.05, col, { tipo, rx: -0.14 });
    cj(c, F, 0, 0.64, -0.19, L, 0.1, 0.05, col, { tipo, rx: -0.14 });
  }
  for (const sx of [-1, 1]) {
    cj(c, F, sx * (L / 2 - 0.14), 0.21, 0.0, 0.09, 0.42, 0.4, o.patas ?? col, { tipo, bajo: 0.6 });
    if (o.respaldo !== false) cj(c, F, sx * (L / 2 - 0.14), 0.55, -0.2, 0.08, 0.7, 0.06, o.patas ?? col, { tipo });
  }
  K.mueble(x, z, L, 0.4, 0.48, giro, o.y ?? 0);
  for (const sx of L > 1.2 ? [-0.4, 0.4] : [0]) {
    const p = F.p(sx * L / 2, 0, 0.02);
    K.asiento(o.nombre ?? 'un banco', p[0], (o.y ?? 0) + 0.47, p[2], giro);
  }
}
function ropero(K, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro, PISO), c = K.int, col = o.color ?? MADERA_MUEBLE[1];
  cj(c, F, 0, 0.95, 0, 1.0, 1.9, 0.5, col, { bajo: 0.7 });
  for (const sx of [-1, 1]) cj(c, F, sx * 0.25, 0.95, 0.255, 0.45, 1.7, 0.02, MADERA_MUEBLE[2]);
  cj(c, F, 0, 1.93, 0.02, 1.08, 0.06, 0.56, col);
  K.mueble(x, z, 1.0, 0.5, 1.95, giro);
}
function lampara(K, x, z, o = {}) {
  const c = K.int, yC = PISO + LIBRE, y = yC - (o.cuelga ?? 0.6);
  palo(c, [x, y + 0.12, z], [x, yC, z], 0.008, '#2a2826');
  cono(c, [x, y + 0.08, z], 0.2, 0.16, o.color ?? '#3f5a48', { tipo: 0, lados: 10, abierto: true });
  caja(K.bra, [x, y + 0.02, z], [0.08, 0.06, 0.08], '#ffe2a8', { tipo: 0, bajo: 1, alto: 1 });
  K.luz(x, y - 0.3, z, { color: o.luz ?? 0xffc884, radio: o.radio ?? 7, intensidad: 0.9, clase: 'interior', cuarto: o.cuarto ?? 'local' });
}
function cuadro(K, x, y, z, giro, o = {}) {
  const F = marcoLocal(x, z, giro, y), c = K.int;
  const A = o.ancho ?? 0.5, H = o.alto ?? 0.4;
  cj(c, F, 0, 0, 0, A + 0.06, H + 0.06, 0.03, o.marco ?? '#5a4130');
  const cols = o.colores ?? ['#6a8aa0', '#5d7a4a', '#c9b27a'];
  for (let i = 0; i < cols.length; i++) cj(c, F, 0, -H / 2 + H * (i + 0.5) / cols.length, 0.017, A, H / cols.length, 0.005, cols[i], { bajo: 0.9 });
}
function alfombra(K, x, z, largo, ancho, giro, color, o = {}) {
  const F = marcoLocal(x, z, giro, PISO), c = K.int;
  cj(c, F, 0, 0.006, 0, largo, 0.012, ancho, color, { bajo: 0.95 });
  if (o.guarda) cj(c, F, 0, 0.008, 0, largo * 0.8, 0.012, ancho * 0.7, o.guarda, { bajo: 0.95 });
}
// La vivienda del poblador en el cuarto de atrás: cama, mesa con dos sillas, cocina a leña, ropero.
// La cama va del lado contrario al paso del tabique; la cocina a leña contra la pared de atrás, del
// lado del paso (su caño sale por el techo: `chimeneaVivienda` da dónde); la mesa entre las dos.
function ladoCama(K, t) { return (t.x ?? 0) >= 0 ? -1 : 1; }
// (en un cuarto bajo de 2,15 m de fondo la cocina va contra la pared del costado: si no, no queda lugar delante)
function cocinaVivienda(K, t) {
  const W = K.W, xi1 = W / 2 - MURO, z0 = -K.D / 2 + MURO;
  const lado = ladoCama(K, t);
  if (t.z - 0.06 - z0 < 2.15) return { x: -lado * (xi1 - 0.34), z: z0 + 0.6, giro: lado * Math.PI / 2 };
  return { x: -lado * Math.min(xi1 - 0.6, Math.max(0.6, Math.abs(t.x ?? 0) + 0.2)), z: z0 + 0.36, giro: 0 };
}
function chimeneaVivienda(K, t) { const c = cocinaVivienda(K, t); return { ...tuboCocina(c.x, c.z, c.giro), tipo: 'chapa' }; }
function vivienda(K, t, o = {}) {
  const { W, D } = K;
  const z0 = -D / 2 + MURO, z1 = t.z - 0.06;
  const xi1 = W / 2 - MURO;
  const lado = ladoCama(K, t);
  const fondo = z1 - z0;
  let xLibre;   // hasta dónde llega la cama (para no tapar el paso)
  if (fondo >= 2.15) {
    cama(K, lado * (xi1 - 0.52), z0 + 1.0, 0, { manta: o.manta, nombre: 'cama' });
    xLibre = lado * (xi1 - 1.05);
    if (fondo >= 2.75) ropero(K, lado * (xi1 - 0.55), z1 - 0.3, Math.PI);
  } else {
    cama(K, lado * (xi1 - 1.0), z0 + 0.52, -lado * Math.PI / 2, { manta: o.manta, nombre: 'cama', alPie: true });
    xLibre = lado * (xi1 - 2.05);
  }
  const co = cocinaVivienda(K, t);
  cocinaLena(K, co.x, co.z, co.giro, { cuarto: 'vivienda' });
  // la mesa, si hay lugar entre la cama y la cocina sin tapar el paso
  const xm = (xLibre + co.x) / 2 + lado * 0.05;
  const hueco = Math.abs(xLibre - co.x) - 1.0;
  // (contra la pared de atrás, con la silla adelante: el paso queda entre la silla y el tabique)
  if (hueco > 1.4 && fondo >= 2.15) {
    const zm = z0 + 0.42;
    mesa(K, xm, zm, 0, { largo: 0.8, ancho: 0.6, mantel: o.mantel ?? '#b9a27a' });
    silla(K, xm, zm + 0.55, Math.PI, { nombre: 'una silla de la vivienda' });
    K.punto('mesa', xm + 0.75, zm + 0.75, -Math.PI / 2);
  }
  lampara(K, (xLibre + co.x) / 2, (z0 + z1) / 2, { cuarto: 'vivienda', color: '#6a4a32' });
  alfombra(K, lado * (xi1 - 1.35), z0 + 1.0, 0.7, 0.55, 0, o.alfombra ?? '#7a3f34', { guarda: '#c7a76a' });
  cuadro(K, lado * (xi1 - 0.5), PISO + 1.55, z0 + 0.02, 0, { colores: ['#7a9ab0', '#e8e4d8', '#5d7a4a'] });
}

// ---------------------------------------------------------------- accesorios de afuera (estructura: aTipo 0/4)
function maceta(K, x, z, o = {}) {
  const c = K.ext, y = o.y ?? 0;
  const r = azar(semillaDe(K.id + '|mac' + x.toFixed(2) + z.toFixed(2)));
  cilindro(c, [x, y + 0.13, z], 0.12, 0.16, 0.26, o.color ?? elegir(r, ['#9a5a3a', '#a8643f', '#7d6a5a', '#5f7a86']), { tipo: 4, lados: 8 });
  // matas de flores pintadas (geranios, malvones) — aTipo 4: en invierno se nievan, no se caen
  for (let i = 0; i < 2; i++) bulto(c, [x + (r() - 0.5) * 0.14, y + 0.32 + r() * 0.06, z + (r() - 0.5) * 0.14], 0.1, i === 0 ? '#4f6b3a' : elegir(r, ['#b8322a', '#d0563a', '#c25a7a', '#e0a040']), { tipo: 4, detalle: 0, esc: [1, 0.8, 1] });
}
function pilaLena(K, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro, o.y ?? 0), c = K.ext;
  const L = o.largo ?? 1.4, filas = o.filas ?? 4;
  const r = azar(semillaDe(K.id + '|lena' + x.toFixed(2)));
  // leña partida: cada leño es un prisma de tres o cuatro caras (la cara del corte, clara)
  const n = Math.round(L / 0.19);
  for (let f = 0; f < filas; f++) for (let i = 0; i < n; i++) {
    if (r() < 0.12 && f === filas - 1) continue;
    const x = -L / 2 + 0.1 + i * (L - 0.2) / Math.max(1, n - 1);
    cj(c, F, x + (r() - 0.5) * 0.03, 0.1 + f * 0.155, (r() - 0.5) * 0.06, 0.15, 0.15, 0.58, elegir(r, ['#7a5a3a', '#6a4d33', '#8a6a48', '#5e4630']), { tipo: 0, rz: Math.PI / 4 + (r() - 0.5) * 0.4, bajo: 0.65, alto: 1.2 });
  }
  if (o.techito) {
    for (const sx of [-1, 1]) cj(c, F, sx * (L / 2 + 0.05), 0.75, 0, 0.08, 1.5, 0.08, PALETA_ALDEA.maderaOscura);
    chapaPlano(K, c, F.p(-L / 2 - 0.2, 1.42, 0.45), F.p(L / 2 + 0.2, 1.42, 0.45), F.p(L / 2 + 0.2, 1.6, -0.45), F.p(-L / 2 - 0.2, 1.6, -0.45), { color: '#7f817d', oxido: 0.5 });
  }
  K.mueble(x, z, L + 0.1, 0.62, 0.08 + filas * 0.14, giro, o.y ?? 0);
}
function tendedero(K, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro), c = K.ext, L = o.largo ?? 3.2;
  for (const sx of [-1, 1]) {
    palo(c, F.p(sx * L / 2, -0.2, 0), F.p(sx * L / 2, 1.85, 0), 0.05, PALETA_ALDEA.madera);
    viga(c, F.p(sx * L / 2, 1.8, -0.25), F.p(sx * L / 2, 1.8, 0.25), 0.05, 0.05, PALETA_ALDEA.madera);
    K.circulo(F.p(sx * L / 2, 0, 0)[0], F.p(sx * L / 2, 0, 0)[2], 0.07, 0, 1.9);
  }
  for (const dz of [-0.2, 0.2]) viga(c, F.p(-L / 2, 1.78, dz), F.p(L / 2, 1.74, dz), 0.012, 0.012, '#c9c2b0');
  const r = azar(semillaDe(K.id + '|ropa' + x.toFixed(2)));
  let lx = -L / 2 + 0.25;
  while (lx < L / 2 - 0.4) {
    const a = entre(r, 0.35, 0.7), h = entre(r, 0.45, 0.9), dz = r() < 0.5 ? -0.2 : 0.2;
    // la ropa: dos caras (tela fina), un poco hinchada por el viento
    cj(c, F, lx + a / 2, 1.76 - h / 2, dz, a, h, 0.02, elegir(r, ['#e8e2d4', '#a83a2e', '#3f5f8a', '#c9a64a', '#6a8a5a', '#d8d0c0', '#8a5a7a']), { tipo: 0, bajo: 0.75, rx: (r() - 0.5) * 0.25 });
    lx += a + entre(r, 0.08, 0.25);
  }
}
function farol(K, x, z, o = {}) {
  const c = K.ext, h = o.alto ?? 3.0;
  cilindro(c, [x, h / 2, z], 0.1, 0.07, h, o.color ?? '#33302d', { tipo: 4, lados: 8 });
  cilindro(c, [x, 0.18, z], 0.22, 0.17, 0.36, '#33302d', { tipo: 4, lados: 8 });
  cilindro(c, [x, h - 0.12, z], 0.12, 0.1, 0.1, '#33302d', { tipo: 4, lados: 8 });
  viga(c, [x, h - 0.1, z], [x + (o.brazo ?? 0), h - 0.1, z], 0.04, 0.04, '#3a3734', { tipo: 4 });
  const xl = x + (o.brazo ?? 0);
  caja(c, [xl, h + 0.05, z], [0.3, 0.06, 0.3], '#2f2c2a', { tipo: 4 });
  cono(c, [xl, h + 0.4, z], 0.3, 0.24, '#2f2c2a', { lados: 4, giro: Math.PI / 4 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(c, [xl + sx * 0.11, h + 0.18, z + sz * 0.11], [0.025, 0.26, 0.025], '#2f2c2a', { tipo: 4 });
  // el vidrio: brilla de noche (va con los vidrios)
  for (const [nx, nz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
    const ux = nz, uz = -nx;
    const P = (s, y) => [xl + nx * 0.105 + ux * s, y, z + nz * 0.105 + uz * s];
    const k0 = { r: 1, g: 0.92, b: 0.75 }, k1 = { r: 1, g: 0.97, b: 0.85 };
    quad(K.vid, P(-0.1, h + 0.07), P(0.1, h + 0.07), P(0.1, h + 0.29), P(-0.1, h + 0.29), k0, k0, k1, k1, 0);
  }
  K.circulo(x, z, 0.12, 0, h);
  K.luz(xl, h + 0.15, z, { color: 0xffc070, radio: o.radio ?? 10, intensidad: 1.0, clase: 'farol', cuarto: 'calle' });
}
function mastil(K, x, z, o = {}) {
  const c = K.ext, h = o.alto ?? 7.5;
  cilindro(c, [x, h / 2, z], 0.08, 0.05, h, '#e6e0d2', { tipo: 4, lados: 8 });
  bulto(c, [x, h + 0.05, z], 0.08, '#c9a64a', { detalle: 1, suave: true });
  // base de laja
  cilindro(c, [x, 0.1, z], 0.55, 0.62, 0.22, '#857c6e', { tipo: 4, lados: 10 });
  // la bandera, celeste y blanca con el sol, un poco ondeada (las dos caras)
  const giro = o.giro ?? 0;
  const L = 1.5, A = 0.95;
  const y0 = h - 0.15 - A;
  const franjas = [['#74acdf', 0, 1 / 3], ['#f4f1ea', 1 / 3, 2 / 3], ['#74acdf', 2 / 3, 1]];
  const cg = Math.cos(giro), sg = Math.sin(giro);
  const onda = (u) => Math.sin(u * 5.5) * 0.06 * u;
  const P = (u, v) => { const lx = 0.07 + u * L, lz = onda(u); return [x + lx * cg + lz * sg, y0 + v * A, z - lx * sg + lz * cg]; };
  const seg = 6;
  for (const [col, v0, v1] of franjas) {
    const k = tinte(col);
    for (let i = 0; i < seg; i++) {
      const u0 = i / seg, u1 = (i + 1) / seg;
      const ka = escalar(k, 0.85 + 0.15 * Math.cos(u0 * 5.5)), kb = escalar(k, 0.85 + 0.15 * Math.cos(u1 * 5.5));
      quad(c, P(u0, 1 - v1), P(u1, 1 - v1), P(u1, 1 - v0), P(u0, 1 - v0), ka, kb, kb, ka, 0);
      quad(c, P(u1, 1 - v1), P(u0, 1 - v1), P(u0, 1 - v0), P(u1, 1 - v0), kb, ka, ka, kb, 0);
    }
  }
  const ps = P(0.5, 0.5);
  bulto(c, [ps[0] + sg * 0.012, ps[1], ps[2] + cg * 0.012], 0.075, '#e0a83a', { detalle: 1, esc: [1, 1, 0.25], rot: [0, giro, 0], tipo: 0 });
  K.circulo(x, z, 0.6, 0, 0.25);
  K.circulo(x, z, 0.1, 0, h);
  K.extra.bandera = { lx: x, ly: h - 0.15 - A / 2, lz: z };
}
function cerco(K, x0, z0, x1, z1, o = {}) {
  const c = K.ext, L = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(1, Math.round(L / 1.25));
  const r = azar(semillaDe(K.id + '|cerco' + x0.toFixed(1) + z0.toFixed(1)));
  const tipo = o.tipo ?? 'varas';
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
    palo(c, [x, -0.15, z], [x + (r() - 0.5) * 0.04, 1.15 + r() * 0.12, z + (r() - 0.5) * 0.04], 0.06, elegir(r, ['#6e5a44', '#7a6650', '#5e4c3a', '#8a7a64']), { lados: 6 });
  }
  if (tipo === 'varas') {
    for (const y of [0.45, 0.9]) {
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        palo(c, [x0 + (x1 - x0) * t0, y + (r() - 0.5) * 0.06, z0 + (z1 - z0) * t0], [x0 + (x1 - x0) * t1, y + (r() - 0.5) * 0.06, z0 + (z1 - z0) * t1], 0.035, elegir(r, ['#7a6650', '#8a765e', '#6e5a44']), { lados: 5 });
      }
    }
  } else {
    // palo a pique: tablas angostas paradas, una al lado de la otra
    const m = Math.round(L / 0.16);
    for (let i = 0; i < m; i++) {
      const t = (i + 0.5) / m;
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      const h = 1.0 + r() * 0.25;
      palo(c, [x, -0.1, z], [x, h, z], 0.055, elegir(r, ['#7a6650', '#8a7a64', '#6e5a44', '#94846a']), { lados: 5, punta: 0.6 });
    }
  }
  K.segmento(x0, z0, x1, z1, 0.08, -0.2, 1.25);
}
function pirca(K, x0, z0, x1, z1, o = {}) {
  const c = K.ext, L = Math.hypot(x1 - x0, z1 - z0);
  const ux = (x1 - x0) / L, uz = (z1 - z0) / L;
  const r = azar(semillaDe(K.id + '|pirca' + x0.toFixed(1) + z0.toFixed(1)));
  const alto = o.alto ?? 0.75;
  const filas = Math.max(2, Math.round(alto / 0.3));
  for (let f = 0; f < filas; f++) {
    let s = (f % 2) * 0.25;
    while (s < L) {
      const l = entre(r, 0.38, 0.62);
      const sm = Math.min(L - 0.15, s + l / 2);
      const y = 0.15 + f * (alto - 0.1) / filas;
      const esc = 1 - f * 0.12;
      bulto(c, [x0 + ux * sm + uz * (r() - 0.5) * 0.06, y, z0 + uz * sm - ux * (r() - 0.5) * 0.06], 0.26 * esc, elegir(r, PALETA_ALDEA.laja),
        { esc: [l / 0.5, 0.62, 0.95], rot: [r() * 0.3, Math.atan2(-uz, ux), r() * 0.2], tipo: 4 });
      s += l;
    }
  }
  K.segmento(x0, z0, x1, z1, 0.3, -0.2, alto + 0.1);
}
function vereda(K, x0, z0, x1, z1, o = {}) {
  const c = K.ext, L = Math.hypot(x1 - x0, z1 - z0), A = o.ancho ?? 1.2, y = o.alto ?? 0.14;
  const giro = Math.atan2(-(z1 - z0), x1 - x0);
  const F = marcoLocal((x0 + x1) / 2, (z0 + z1) / 2, giro);
  const r = azar(semillaDe(K.id + '|vereda' + x0.toFixed(1)));
  for (const sz of [-1, 1]) cj(c, F, 0, y - 0.09, sz * (A / 2 - 0.12), L, 0.1, 0.12, '#4e3a28', { tipo: 0 });
  for (let s = -L / 2; s < L / 2 - 0.05; s += 0.2) {
    cj(c, F, s + 0.09, y - 0.02, (r() - 0.5) * 0.04, 0.17, 0.04, A, elegir(r, ['#7d5d40', '#8a6a48', '#6e5036', '#806247']), { tipo: 0, giro: (r() - 0.5) * 0.03 });
  }
  K.plataforma((x0 + x1) / 2, (z0 + z1) / 2, L, A, y, y, giro);
  K.pisos.push({ lx: (x0 + x1) / 2, lz: (z0 + z1) / 2, largo: L, ancho: A, giro });
}
function posteLuz(K, x, z, o = {}) {
  const c = K.ext, h = 6.2;
  palo(c, [x, -0.4, z], [x, h, z], 0.12, '#5a4a3a', { lados: 7, punta: 0.75 });
  viga(c, [x - 0.7, h - 0.35, z], [x + 0.7, h - 0.35, z], 0.08, 0.1, '#4e3a28');
  for (const sx of [-0.55, 0, 0.55]) cilindro(c, [x + sx, h - 0.22, z], 0.035, 0.045, 0.12, '#cfd6d4', { tipo: 4, lados: 6 });
  // el brazo con la lámpara
  viga(c, [x, h - 1.0, z], [x, h - 1.0, z + 0.9], 0.05, 0.05, '#3a3734', { tipo: 4 });
  cono(c, [x, h - 1.05, z + 0.95], 0.2, 0.12, '#3a3734', { lados: 8, abierto: true });
  quad(K.vid, [x - 0.08, h - 1.12, z + 0.88], [x + 0.08, h - 1.12, z + 0.88], [x + 0.08, h - 1.12, z + 1.02], [x - 0.08, h - 1.12, z + 1.02], { r: 1, g: 0.95, b: 0.8 }, { r: 1, g: 0.95, b: 0.8 }, { r: 1, g: 0.95, b: 0.8 }, { r: 1, g: 0.95, b: 0.8 }, 0);
  K.circulo(x, z, 0.14, -0.4, h);
  K.luz(x, h - 1.25, z + 0.95, { color: 0xffc58a, radio: 12, intensidad: 1.0, clase: 'farol', cuarto: 'calle' });
  K.extra.cables = [{ lx: x - 0.55, ly: h - 0.18, lz: z }, { lx: x, ly: h - 0.18, lz: z }, { lx: x + 0.55, ly: h - 0.18, lz: z }];
}
function cantero(K, x, z, o = {}) {
  const c = K.ext, L = o.largo ?? 2.4, A = o.ancho ?? 1.2;
  const r = azar(semillaDe(K.id + '|cantero' + x.toFixed(1)));
  // borde de piedras
  const n = Math.round((L + A) * 2 / 0.32);
  for (let i = 0; i < n; i++) {
    const t = i / n * (L + A) * 2;
    let px, pz;
    if (t < L) { px = -L / 2 + t; pz = -A / 2; } else if (t < L + A) { px = L / 2; pz = -A / 2 + (t - L); } else if (t < 2 * L + A) { px = L / 2 - (t - L - A); pz = A / 2; } else { px = -L / 2; pz = A / 2 - (t - 2 * L - A); }
    bulto(c, [x + px, 0.1, z + pz], 0.17, elegir(r, PALETA_ALDEA.laja), { esc: [1.1, 0.7, 1], rot: [r(), r() * 3, r()], tipo: 4 });
  }
  caja(c, [x, 0.16, z], [L - 0.15, 0.06, A - 0.15], '#4a3a2c', { tipo: 0 });
  // flores: lupinos (espigas), amancay y margaritas, en matas pintadas
  for (let i = 0; i < Math.round(L * A * 5); i++) {
    const fx = x + (r() - 0.5) * (L - 0.4), fz = z + (r() - 0.5) * (A - 0.4);
    const lupino = r() < 0.45;
    // (en el follaje: matas perennes aTipo 1 y flores aTipo 3, como las del valle: en invierno se cierran)
    bulto(K.fol, [fx, 0.3, fz], 0.17, '#4a6436', { tipo: 1, esc: [1, 0.75, 1], detalle: 0, esferica: 0.8, bajo: 0.6, alto: 1.15 });
    if (lupino) cono(K.fol, [fx, 0.64, fz], 0.065, 0.46, elegir(r, ['#7a5aa8', '#c46a9a', '#e0d0e8', '#6a6ab8']), { lados: 6, tipo: 3 });
    else bulto(K.fol, [fx, 0.44, fz], 0.09, elegir(r, ['#e8b030', '#f0ece0', '#e07a30']), { tipo: 3, esc: [1, 0.6, 1] });
  }
  K.mueble(x, z, L, A, 0.3, 0, 0);
}
// Un duende tallado en madera (la tradición del lugar: nada mágico). `alto` total. Todo es de la misma
// madera: el gorro aceitado (más oscuro), la barba con las vetas a la vista, los ojos y la boca son
// cortes de gubia (más hondos, más oscuros). Las caras facetadas son los golpes del formón.
function tallaDuende(K, c, x, y, z, giro, alto = 0.8, o = {}) {
  const F = marcoLocal(x, z, giro, y), s = alto / 0.8, d = s > 1.2 ? 1 : 0;
  const m = tinte(o.madera ?? '#8a6440');
  const hex = (k, f) => '#' + new THREE.Color(Math.min(1, k.r * f), Math.min(1, k.g * f), Math.min(1, k.b * f)).getHexString();
  const cuerpo = hex(m, 1.0), gorro = hex(m, o.gorroOscuro ?? 0.62), barba = hex(m, 1.22), cara = hex(m, 1.12), corte = hex(m, 0.42);
  const ab = 0.012 * s;
  const B = (p, r, col, op = {}) => bulto(c, F.p(...p), r * s, col, { detalle: d, tipo: 0, variar: 0.16, abollar: ab, bajo: 0.62, alto: 1.12, ...op });
  B([0, 0.2 * s, 0], 0.17, cuerpo, { esc: [1.02, 1.18, 0.92] });                                   // el cuerpo, de la misma pieza
  cl(c, F, 0, 0.165 * s, 0.005 * s, 0.168 * s, 0.168 * s, 0.035 * s, hex(m, 0.72), { lados: 9 });   // la faja tallada
  for (const sx of [-1, 1]) {
    B([sx * 0.14 * s, 0.25 * s, 0.06 * s], 0.06, cuerpo, { esc: [0.8, 1.55, 0.95], rot: [0.55, 0, -sx * 0.25] });   // los brazos
    B([sx * 0.07 * s, 0.13 * s, 0.13 * s], 0.045, hex(m, 1.08), { detalle: 0 });                     // las manos sobre la panza
  }
  cono(c, F.p(0, 0.255 * s, 0.1 * s), 0.11 * s, 0.2 * s, barba, { rx: Math.PI + 0.3, lados: 7, tipo: 0 });   // la barba (bajo la cara)
  for (const sx of [-0.04, 0, 0.04]) caja(c, F.p(sx * s, 0.26 * s, 0.15 * s), [0.008 * s, 0.13 * s, 0.01 * s], hex(m, 0.8), { giro: F.giro, rx: 0.3, tipo: 0, abollar: 0 });   // vetas de la barba
  B([0, 0.43 * s, 0.03 * s], 0.09, cara);                                                            // la cara
  B([0, 0.425 * s, 0.115 * s], 0.035, hex(m, 1.18), { detalle: 0 });                                // la nariz
  for (const sx of [-1, 1]) caja(c, F.p(sx * 0.035 * s, 0.462 * s, 0.103 * s), [0.024 * s, 0.012 * s, 0.01 * s], corte, { giro: F.giro, tipo: 0, abollar: 0 });   // los ojos (cortes)
  cl(c, F, 0, 0.5 * s, -0.005 * s, 0.112 * s, 0.112 * s, 0.035 * s, gorro, { lados: 9 });            // el ala del gorro
  cono(c, F.p(0, 0.69 * s, -0.05 * s), 0.115 * s, 0.4 * s, gorro, { lados: 7, tipo: 0, rx: -0.3 });   // el gorro, en punta
}
function columpio(K, x, z, giro = 0) {
  const F = marcoLocal(x, z, giro), c = K.ext;
  for (const sx of [-1, 1]) {
    palo(c, F.p(sx * 1.0, -0.1, -0.7), F.p(sx * 0.9, 2.3, 0), 0.06, '#6e5a44');
    palo(c, F.p(sx * 1.0, -0.1, 0.7), F.p(sx * 0.9, 2.3, 0), 0.06, '#6e5a44');
    K.circulo(F.p(sx * 1.0, 0, -0.7)[0], F.p(sx * 1.0, 0, -0.7)[2], 0.08, 0, 2.3);
    K.circulo(F.p(sx * 1.0, 0, 0.7)[0], F.p(sx * 1.0, 0, 0.7)[2], 0.08, 0, 2.3);
  }
  palo(c, F.p(-1.05, 2.3, 0), F.p(1.05, 2.3, 0), 0.07, '#5e4c3a');
  // la hamaca de neumático
  for (const sx of [-0.18, 0.18]) palo(c, F.p(sx, 0.75, 0), F.p(sx * 0.6, 2.28, 0), 0.012, '#c9b88a');
  const g = new THREE.TorusGeometry(0.28, 0.09, 6, 12);
  c.agregar(g, { tipo: 4, variar: 0.05, matriz: matriz(F.p(0, 0.62, 0), [0, giro, 0]), degradado: [lin('#1f1d1c'), lin('#3a3734')] });
  g.dispose();
}
function hornoBarro(K, x, z, giro = 0) {
  const F = marcoLocal(x, z, giro), c = K.ext;
  // base de laja y la cúpula de barro
  cl(c, F, 0, 0.35, 0, 0.82, 0.85, 0.7, '#857c6e', { lados: 10, tipo: 4 });
  const g = new THREE.SphereGeometry(0.72, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  c.agregar(g, { tipo: 4, variar: 0.08, suave: true, matriz: matriz(F.p(0, 0.7, 0), [0, giro, 0], [1, 0.82, 1.1]), degradado: [lin('#8a5a3a'), lin('#b58a5e')] });
  g.dispose();
  // la boca, con su puertita de chapa apoyada al lado
  cj(c, F, 0, 0.92, 0.74, 0.42, 0.34, 0.12, '#3a2a1e', { tipo: 4 });
  caja(K.bra, F.p(0, 0.88, 0.79), [0.32, 0.22, 0.01], '#ff8f3a', { giro, tipo: 0, bajo: 0.7, alto: 1.2 });
  cj(c, F, 0.42, 0.95, 0.82, 0.36, 0.3, 0.03, '#4a4642', { tipo: 4, rz: 0.15 });
  cl(c, F, 0.0, 1.4, -0.25, 0.07, 0.07, 0.3, '#6b5a4a', { tipo: 4 });
  K.circulo(F.p(0, 0, 0)[0], F.p(0, 0, 0)[2], 0.88, 0, 1.4);
  const p = F.p(0, 0, 1.4);
  K.trabajo('horno', p[0], p[2], giro + Math.PI, 0);
  const b = F.p(0, 0, 0.9);
  K.luz(b[0], 0.95, b[2], { color: 0xff8a3a, radio: 4, intensidad: 0.7, clase: 'fuego', cuarto: 'afuera' });
  K.extra.humo = { lx: F.p(0, 0, -0.25)[0], ly: 1.6, lz: F.p(0, 0, -0.25)[2] };
}
function colmena(K, x, z, giro = 0, color = '#e2dccb') {
  const F = marcoLocal(x, z, giro), c = K.ext;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cj(c, F, sx * 0.2, 0.17, sz * 0.15, 0.05, 0.34, 0.05, '#5e4c3a', { tipo: 0 });
  cj(c, F, 0, 0.37, 0, 0.56, 0.06, 0.46, '#6e5a44', { tipo: 0 });
  for (let i = 0; i < 3; i++) cj(c, F, 0, 0.53 + i * 0.25, 0, 0.5, 0.24, 0.42, i === 1 ? '#c9a64a' : color, { tipo: 4 });
  cj(c, F, 0, 1.31, 0, 0.6, 0.06, 0.52, '#7f817d', { tipo: 4 });
  cj(c, F, 0, 0.45, 0.215, 0.24, 0.03, 0.02, '#2a2420', { tipo: 4 });
  K.circulo(x, z, 0.35, 0, 1.35);
}
function pilaTablas(K, x, z, giro = 0, o = {}) {
  const F = marcoLocal(x, z, giro), c = K.ext;
  const r = azar(semillaDe(K.id + '|tablas' + x.toFixed(2)));
  for (const sx of [-1.1, 0, 1.1]) cj(c, F, sx, 0.05, 0, 0.1, 0.1, 0.9, '#5e4c3a', { tipo: 0 });
  const n = o.capas ?? 6;
  for (let f = 0; f < n; f++) for (let i = 0; i < 4; i++) cj(c, F, (r() - 0.5) * 0.08, 0.13 + f * 0.035, -0.32 + i * 0.21, 2.8, 0.03, 0.19, elegir(r, ['#c39a68', '#b88d5c', '#cfa775', '#a98256']), { tipo: 0, giro: (r() - 0.5) * 0.04 });
  K.mueble(x, z, 2.9, 0.9, 0.13 + n * 0.035, giro, 0);
}
function pilaPiedras(K, x, z, o = {}) {
  const c = K.ext, r = azar(semillaDe(K.id + '|piedras' + x.toFixed(2)));
  for (let i = 0; i < (o.n ?? 9); i++) {
    const a = r() * 6.28, d = r() * 0.55, y = 0.12 + (i > 5 ? 0.22 : 0);
    bulto(c, [x + Math.cos(a) * d, y, z + Math.sin(a) * d], entre(r, 0.16, 0.26), elegir(r, PALETA_ALDEA.laja), { esc: [1.3, 0.5, 1], rot: [r(), r() * 3, r()], tipo: 4 });
  }
  K.circulo(x, z, 0.8, 0, 0.55);
}
function carretilla(K, x, z, giro = 0) {
  const F = marcoLocal(x, z, giro), c = K.ext;
  cj(c, F, 0, 0.45, 0, 0.6, 0.28, 0.8, '#6a7a72', { tipo: 4 });
  for (const sx of [-1, 1]) palo(c, F.p(sx * 0.22, 0.4, -0.4), F.p(sx * 0.28, 0.55, -1.2), 0.025, '#6e5036');
  const g = new THREE.TorusGeometry(0.17, 0.05, 5, 10);
  c.agregar(g, { tipo: 4, matriz: matriz(F.p(0, 0.2, 0.45), [0, giro + Math.PI / 2, 0]), degradado: [lin('#1f1d1c'), lin('#2f2c2a')] });
  g.dispose();
  K.circulo(x, z, 0.45, 0, 0.7);
}
function caballete(K, x, z, giro = 0) {
  const F = marcoLocal(x, z, giro), c = K.ext;
  for (const sx of [-0.45, 0.45]) for (const sz of [-1, 1]) palo(c, F.p(sx, 0, sz * 0.22), F.p(sx, 0.7, 0), 0.03, '#a98256');
  viga(c, F.p(-0.6, 0.7, 0), F.p(0.6, 0.7, 0), 0.08, 0.08, '#a98256');
  cj(c, F, 0.1, 0.77, 0, 1.6, 0.03, 0.22, '#c39a68', { tipo: 0, giro: 0.1 });
  cj(c, F, 0.3, 0.84, 0.05, 0.55, 0.1, 0.01, '#9aa0a2', { tipo: 4 });
  K.circulo(x, z, 0.5, 0, 0.85);
}
// andamio de obra contra una pared lateral
function andamio(K, x, z0, z1, alto) {
  const c = K.ext;
  for (const z of [z0, (z0 + z1) / 2, z1]) for (const dx of [0, 0.9]) {
    palo(c, [x + dx, -0.2, z], [x + dx, alto + 1, z], 0.045, '#a98256');
    K.circulo(x + dx, z, 0.07, 0, alto + 1);
  }
  for (const y of [1.3, alto - 0.2]) {
    for (const dx of [0, 0.9]) palo(c, [x + dx, y, z0], [x + dx, y, z1], 0.035, '#a98256');
    for (let z = z0; z < z1 - 0.1; z += 0.22) caja(c, [x + 0.45, y + 0.05, z + 0.1], [0.95, 0.04, 0.2], elegir(azar(semillaDe('and' + z.toFixed(2))), ['#c39a68', '#b88d5c', '#a98256']), { tipo: 0 });
  }
  palo(c, [x, 0, z0], [x, alto, (z0 + z1) / 2], 0.03, '#a98256');
}

// ---------------------------------------------------------------- los colores de cada edificio
// Elegidos por la semilla del id entre los que le quedan bien (nunca dos casas iguales).
function coloresDe(K, opciones) {
  const P = PALETA_ALDEA;
  const r = azar(semillaDe(K.id + '|colores') ^ (K.op.semilla ?? 0));
  const c = {
    pared: P.pared[elegir(r, opciones.pared)] ?? elegir(r, opciones.pared),
    techo: P.techo[elegir(r, opciones.techo)] ?? elegir(r, opciones.techo),
    postigo: P.postigo[elegir(r, opciones.postigo ?? ['verde', 'azul', 'rojo'])],
    marco: opciones.marco ?? P.marco,
  };
  const o = K.op.colores || {};
  if (o.pared) c.pared = P.pared[o.pared] ?? o.pared;
  if (o.techo) c.techo = P.techo[o.techo] ?? o.techo;
  if (o.postigo) c.postigo = P.postigo[o.postigo] ?? o.postigo;
  return c;
}
const final = (K) => K.etapa >= 4;

// Un cartel sobre el borde del techito de la galería (se lee desde la calle).
function cartelGaleria(K, texto, x, ancho = 2.4, alto = 0.45) {
  const g = K.extra.galeria;
  if (!g) return;
  cartel(K, texto, [x, g.yE + alto / 2 + 0.12, g.zE + 0.03], ancho, alto, 0);
  for (const l of [-1, 1]) caja(K.ext, [x + l * (ancho / 2 - 0.1), g.yE + 0.08, g.zE + 0.0], [0.05, 0.2, 0.05], '#3a3734', { tipo: 4 });
}

// ---------------------------------------------------------------- casas de los vecinos
function casaJefe(K) {
  const C = coloresDe(K, { pared: ['celeste', 'ocre', 'crema'], techo: ['oxido', 'rojo', 'verde'] });
  const coc = { x: -2.45, z: 0.6, giro: Math.PI / 2 };
  casco(K, {
    eje: 'x', estilo: 'horizontal', color: C.pared, colorTecho: C.techo, postigo: C.postigo, cortina: '#c9b089',
    puertas: [{ cara: 'frente', x: -1.0, ancho: PUERTA_ANCHO, nombre: 'la puerta del jefe de estación' }],
    ventanas: [{ cara: 'frente', x: 1.4, ancho: 1.1, alto: 1.15 }, { cara: 'izq', z: 1.3, ancho: 0.9, alto: 1.0 }, { cara: 'der', z: 0.9, ancho: 0.9, alto: 1.0 },
      { cara: 'fondo', x: -1.3, ancho: 0.9, alto: 1.0, cuarto: 'vivienda' }, { cara: 'der', z: -1.8, ancho: 0.8, alto: 0.9, cuarto: 'vivienda' }],
    galeria: { fondo: 1.6 }, tabique: { z: -0.6, x: -0.5 },
    chimenea: { ...tuboCocina(coc.x, coc.z, coc.giro), tipo: 'chapa' },
  });
  if (!final(K)) return;
  const D = K.D, W = K.W;
  cocinaLena(K, coc.x, coc.z, coc.giro, { cuarto: 'local' });
  mesa(K, 1.0, 0.75, 0, { largo: 1.2, ancho: 0.75, mantel: '#d8cfb4' });
  silla(K, 1.0, 0.1, 0); silla(K, 1.0, 1.4, Math.PI); silla(K, 2.0, 0.75, -Math.PI / 2);
  K.punto('mesa', 0.05, 0.75, Math.PI / 2);
  estanteria(K, W / 2 - MURO - 0.2, 1.8, -Math.PI / 2, { largo: 1.1, alto: 1.2, prof: 0.4, cosas: 'frascos', estantes: 2 });
  banco(K, K.int, -1.9, -0.3, 0, { y: PISO, largo: 1.1, nombre: 'el banco junto a la cocina' });
  cuadro(K, 0.6, PISO + 1.65, -0.54, 0, { ancho: 0.7, alto: 0.45, colores: ['#7a9ab0', '#5a5a5a', '#3a2a22'] });   // la trochita en un cuadro
  // el farol de señales sobre la mesa y la gorra en la percha
  cilindro(K.int, [1.2, PISO + 0.88, 0.75], 0.07, 0.08, 0.2, '#8a2a22', { lados: 8 });
  caja(K.int, [-0.3, PISO + 1.7, -0.5], [0.3, 0.06, 0.12], '#2b3a5a');
  lampara(K, 0.6, 1.0, {});
  // el dormitorio
  cama(K, W / 2 - MURO - 0.52, -D / 2 + MURO + 1.0, 0, { manta: '#3f5a7a', nombre: 'cama' });
  caja(K.int, [W / 2 - MURO - 1.3, PISO + 0.3, -D / 2 + MURO + 0.25], [0.45, 0.6, 0.4], '#6b4a2e');
  K.mueble(W / 2 - MURO - 1.3, -D / 2 + MURO + 0.25, 0.45, 0.4, 0.6);
  ropero(K, -W / 2 + MURO + 0.55, -D / 2 + MURO + 0.3, 0);
  lampara(K, 0.2, -1.8, { cuarto: 'vivienda', color: '#6a4a32' });
  alfombra(K, 0.9, -1.6, 1.2, 0.7, 0, '#5a6a7a');
  // afuera: leña con techito, macetas, banco en la galería
  pilaLena(K, -W / 2 - 1.0, -1.2, Math.PI / 2, { largo: 1.8, techito: true });
  K.abarcar(-W / 2 - 1.6, W / 2, -D / 2, D / 2);
  maceta(K, -1.9, D / 2 + 0.3, { y: GALERIA_PISO }); maceta(K, -0.2, D / 2 + 0.25, { y: GALERIA_PISO });
  banco(K, K.ext, 1.5, D / 2 + 0.35, 0, { y: GALERIA_PISO, largo: 1.4, nombre: 'el banco de la galería', tipo: 0 });
}

// La casita de Ercilia (la del almacén): simple y prolija, galería chica, macetas por todos lados.
function casaErcilia(K) {
  const C = coloresDe(K, { pared: ['verde', 'rosa', 'celeste', 'crema'], techo: ['rojo', 'verde', 'gris'], postigo: ['verde', 'blanco', 'azul'] });
  casco(K, {
    eje: 'z', estilo: 'vertical', color: C.pared, colorTecho: C.techo, postigo: C.postigo, cortina: '#e8d8c0', alzada: 1.7, desgaste: 0.15,
    puertas: [{ cara: 'frente', x: 0.7, ancho: PUERTA_ANCHO, nombre: 'la puerta de Ercilia' }],
    ventanas: [{ cara: 'frente', x: -1.2, ancho: 0.9, alto: 1.0 }, { cara: 'izq', z: 0.9, ancho: 0.8, alto: 0.9 }, { cara: 'der', z: 0.9, ancho: 0.8, alto: 0.9, postigos: false },
      { cara: 'fondo', x: -0.6, ancho: 0.8, alto: 0.8, cuarto: 'vivienda', postigos: false }],
    galeria: { fondo: 1.3, x0: -2.0, x1: 1.9, postes: 2, baranda: true }, tabique: { z: -0.4, x: 1.3 },
    chimenea: { ...tuboCocina(-1.6, 0.0, 0), tipo: 'chapa' },
  });
  if (!final(K)) return;
  const W = K.W, D = K.D;
  cocinaLena(K, -1.6, 0.0, 0, { cuarto: 'local' });
  mesa(K, 1.7, 1.0, 0, { largo: 0.8, ancho: 0.6, mantel: '#c86a5a' });
  silla(K, 1.7, 0.45, 0);
  K.punto('mesa', 0.85, 1.0, Math.PI / 2);
  estanteria(K, -W / 2 + MURO + 0.19, 1.6, Math.PI / 2, { largo: 1.0, alto: 1.5, cosas: 'frascos', prof: 0.34, estantes: 3 });
  lampara(K, 0.0, 1.0, { color: '#7a3a2a' });
  alfombra(K, 0.2, 1.3, 1.2, 0.8, 0, '#8a4a5a', { guarda: '#d8c890' });
  vivienda(K, { z: -0.4, x: 1.3 }, { manta: '#b85a7a' });
  // la jardinera bajo la ventana y las macetas de la galería
  caja(K.ext, [-1.2, PISO + 0.72, D / 2 + 0.16], [1.0, 0.18, 0.2], '#7a4a2e', { tipo: 4 });
  for (let i = 0; i < 3; i++) bulto(K.ext, [-1.5 + i * 0.3, PISO + 0.88, D / 2 + 0.16], 0.11, ['#b8322a', '#e0a040', '#c25a7a'][i], { tipo: 4, esc: [1, 0.8, 1] });
  for (const [x, z] of [[-1.7, 0.3], [-0.6, 0.3], [1.6, 0.3]]) maceta(K, x, D / 2 + z, { y: GALERIA_PISO });
  maceta(K, 1.8, D / 2 + 1.8, {}); maceta(K, -1.9, D / 2 + 1.8, {});
}

// La de Nélida, la ayudante del almacén: más modesta, alero chico, ropa colgada y la bicicleta.
function casaNelida(K) {
  const C = coloresDe(K, { pared: ['gris', 'ocre', 'celeste'], techo: ['oxido', 'gris'], postigo: ['marron', 'verde'] });
  const coc = { x: 2.5, z: 0.6, giro: -Math.PI / 2 };
  casco(K, {
    eje: 'x', estilo: 'horizontal', color: C.pared, colorTecho: C.techo, postigo: C.postigo, oxido: 0.6, desgaste: 0.6, alzada: 1.4, cortina: '#b8a888',
    puertas: [{ cara: 'frente', x: -0.9, ancho: PUERTA_ANCHO, nombre: 'la puerta de Nélida' }],
    ventanas: [{ cara: 'frente', x: 1.4, ancho: 1.0, alto: 1.0 }, { cara: 'izq', z: 0.6, ancho: 0.8, alto: 0.9 }, { cara: 'fondo', x: -1.2, ancho: 0.8, alto: 0.8, cuarto: 'vivienda', postigos: false }],
    galeria: { fondo: 1.2, x0: -2.2, x1: 0.4, postes: 2 }, tabique: { z: -0.4, x: 1.6 },
    chimenea: { ...tuboCocina(coc.x, coc.z, coc.giro), tipo: 'chapa' },
  });
  if (!final(K)) return;
  const W = K.W, D = K.D;
  cocinaLena(K, coc.x, coc.z, coc.giro, { cuarto: 'local' });
  mesa(K, -1.9, 0.9, 0, { largo: 1.0, ancho: 0.65, mantel: '#a8b0a0' });
  silla(K, -1.9, 0.3, 0); silla(K, -1.9, 1.5, Math.PI);
  K.punto('mesa', -0.95, 0.9, -Math.PI / 2);
  caja(K.int, [0.4, PISO + 0.45, -0.18], [1.0, 0.9, 0.4], '#6b4a2e');
  K.mueble(0.4, -0.18, 1.0, 0.4, 0.9);
  lampara(K, -0.6, 1.0, { color: '#5a4a3a' });
  vivienda(K, { z: -0.4, x: 1.6 }, { manta: '#6a7a8a' });
  // afuera: la ropa colgada, la bicicleta contra la pared y la carretilla
  tendedero(K, W / 2 + 1.5, -0.3, Math.PI / 2, { largo: 2.8 });
  const F = marcoLocal(1.6, D / 2 + 0.3, 0, 0);
  for (const sx of [-0.52, 0.52]) {
    const g = new THREE.TorusGeometry(0.33, 0.025, 4, 14);
    K.ext.agregar(g, { tipo: 4, matriz: matriz(F.p(sx, 0.34, 0), [0, 0, 0]), degradado: [lin('#1f1d1c'), lin('#3a3734')] });
    g.dispose();
  }
  palo(K.ext, F.p(-0.52, 0.34, 0), F.p(0.05, 0.72, 0), 0.02, '#5a6a7a', { tipo: 4 });
  palo(K.ext, F.p(0.52, 0.34, 0), F.p(0.0, 0.36, 0), 0.02, '#5a6a7a', { tipo: 4 });
  palo(K.ext, F.p(0.0, 0.36, 0), F.p(0.05, 0.72, 0), 0.02, '#5a6a7a', { tipo: 4 });
  palo(K.ext, F.p(0.05, 0.72, 0), F.p(0.45, 0.72, 0), 0.02, '#5a6a7a', { tipo: 4 });
  palo(K.ext, F.p(0.45, 0.72, 0), F.p(0.52, 0.34, 0), 0.02, '#5a6a7a', { tipo: 4 });
  palo(K.ext, F.p(0.45, 0.72, 0), F.p(0.42, 0.95, 0), 0.02, '#3a3734', { tipo: 4 });
  caja(K.ext, F.p(0.0, 0.8, 0), [0.22, 0.05, 0.1], '#2a2624', { tipo: 4 });
  caja(K.ext, F.p(0.42, 0.97, 0), [0.04, 0.03, 0.46], '#3a3734', { tipo: 4 });
  K.mueble(1.6, D / 2 + 0.3, 1.4, 0.3, 1.0, 0, 0);
  carretilla(K, -W / 2 - 1.0, 1.2, 0.8);
  pilaLena(K, -W / 2 - 0.9, -1.0, Math.PI / 2, { largo: 1.3, filas: 3 });
  K.abarcar(-W / 2 - 1.5, W / 2 + 1.9, -D / 2, D / 2 + 0.6);
}

function casaAbuela(K) {
  const C = coloresDe(K, { pared: ['alerce'], techo: ['verde', 'rojo'], postigo: ['verde', 'rojo', 'blanco'] });
  casco(K, {
    eje: 'x', estilo: 'vertical', fronton: 'tejuela', color: C.pared, colorFronton: '#8f6446', colorTecho: C.techo, postigo: C.postigo, cortina: '#e8dcc0', alzada: 1.6, desgaste: 0.15,
    marco: '#e8e0cc', puertas: [{ cara: 'frente', x: 0.6, ancho: PUERTA_ANCHO, nombre: 'la puerta de la abuela' }],
    ventanas: [{ cara: 'frente', x: -1.3, ancho: 0.9, alto: 1.0 }, { cara: 'der', z: 0.7, ancho: 0.8, alto: 0.9, postigos: false }, { cara: 'fondo', x: -0.9, ancho: 0.8, alto: 0.9, cuarto: 'vivienda', postigos: false }],
    galeria: { fondo: 1.5, postes: 2 }, tabique: { z: -0.3, x: 1.3 },
    chimenea: { tipo: 'piedra', cara: 'izq', s: 0.8 },
    colorInterior: '#b08a62',
  });
  if (!final(K)) return;
  const W = K.W, D = K.D;
  // el hogar de piedra contra la pared de la chimenea
  const xh = -W / 2 + MURO + 0.3;
  {
    // hogar de piedra: piedras desparejas en dos jambas, el dintel de una laja grande, la boca
    // ennegrecida con dos leños y brasas, y el pecho de la chimenea hasta el cielorraso
    const rh = azar(semillaDe('hogar'));
    const pal = ['#5d5850', '#6a645b', '#4f4a44', '#736b5f', '#5f574c'];
    caja(K.int, [xh + 0.12, PISO + 0.04, 0.8], [0.85, 0.08, 1.45], '#77726a', { bajo: 0.7 });
    for (const dz of [-0.48, 0.48]) for (let i = 0; i < 3; i++) caja(K.int, [xh + 0.02 + (rh() - 0.5) * 0.04, PISO + 0.16 + i * 0.27, 0.8 + dz + (rh() - 0.5) * 0.04], [0.58 + rh() * 0.06, 0.25, 0.3 + rh() * 0.06], elegir(rh, pal), { bajo: 0.65, abollar: 0.03 });
    caja(K.int, [xh + 0.03, PISO + 0.92, 0.8], [0.62, 0.22, 1.32], '#6f6a62', { bajo: 0.7, abollar: 0.03 });
    caja(K.int, [xh - 0.05, PISO + 0.4, 0.8], [0.4, 0.72, 0.68], '#1b1714', { abollar: 0 });
    for (const dz of [-0.12, 0.1]) palo(K.int, [xh + 0.08, PISO + 0.14, 0.8 + dz - 0.25], [xh + 0.02, PISO + 0.18, 0.8 + dz + 0.25], 0.06, '#4a3424', { abierto: false });
    caja(K.bra, [xh + 0.06, PISO + 0.14, 0.8], [0.3, 0.06, 0.5], '#ff7a2a', { tipo: 0, bajo: 0.6, alto: 1.3 });
    // el pecho de la chimenea: un fondo de mezcla oscura y piedras chicas desparejas encima
    caja(K.int, [xh - 0.08, PISO + (1.12 + LIBRE) / 2, 0.8], [0.36, LIBRE - 1.12, 0.98], '#3e3a35', { bajo: 0.8 });
    const filasP = 6, hP = (LIBRE - 1.15) / filasP;
    for (let j = 0; j < filasP; j++) {
      let zz = 0.8 - 0.47 + (j % 2) * 0.12;
      while (zz < 0.8 + 0.42) {
        const l = entre(rh, 0.2, 0.36), z1 = Math.min(0.8 + 0.47, zz + l);
        caja(K.int, [xh + 0.11 + rh() * 0.02, PISO + 1.15 + (j + 0.5) * hP, (zz + z1) / 2], [0.06, hP - 0.03, z1 - zz - 0.03], elegir(rh, pal), { bajo: 0.7, abollar: 0.012 });
        zz = z1;
      }
    }
  }
  caja(K.int, [xh + 0.12, PISO + 1.08, 0.8], [0.78, 0.07, 1.5], '#5a3c26');   // la repisa, con tallas
  tallaDuende(K, K.int, xh + 0.3, PISO + 1.115, 0.25, Math.PI / 2, 0.3, { madera: '#9a7050' });
  tallaDuende(K, K.int, xh + 0.3, PISO + 1.115, 1.38, Math.PI / 2, 0.26, { madera: '#7d5a3c' });
  K.mueble(xh, 0.8, 0.62, 1.22, 1.3);
  K.luz(xh + 0.6, PISO + 0.5, 0.8, { color: 0xff8a40, radio: 4, intensidad: 0.6, clase: 'fuego', cuarto: 'local' });
  // la mecedora
  const F = marcoLocal(-0.95, 1.0, -Math.PI * 0.75, PISO);
  cj(K.int, F, 0, 0.42, 0, 0.5, 0.05, 0.45, '#6b4a2e'); cj(K.int, F, 0, 0.8, -0.24, 0.5, 0.7, 0.05, '#6b4a2e', { rx: -0.2 });
  for (const sx of [-1, 1]) cj(K.int, F, sx * 0.24, 0.12, 0, 0.04, 0.06, 0.8, '#5a3c26', { rx: 0.0 });
  cj(K.int, F, 0, 0.45, 0.02, 0.48, 0.02, 0.4, '#e8e2d6');   // el cuero de oveja
  K.asiento('la mecedora de la abuela', -0.95, PISO + 0.45, 1.0, -Math.PI * 0.75);
  K.circulo(-0.95, 1.0, 0.35, PISO, PISO + 1.1);
  mesa(K, 1.75, 1.55, 0, { largo: 0.8, ancho: 0.6, mantel: '#e2d6bc' });
  silla(K, 1.75, 0.95, 0, {});
  estanteria(K, -1.0, -0.3 + 0.27, 0, { largo: 1.2, alto: 1.6, cosas: 'libros', prof: 0.34 });
  lampara(K, 0.2, 0.9, { color: '#5a4a3a' });
  alfombra(K, -0.6, 0.9, 1.4, 1.0, 0.2, '#8a4a3a', { guarda: '#d8b878' });
  vivienda(K, { z: -0.3, x: 1.3 }, { manta: '#b85a3a', alfombra: '#4a6a5a' });
  // la galería con las tallas de duendes (la abuela cuenta la leyenda)
  tallaDuende(K, K.ext, -W / 2 + 0.25, GALERIA_PISO, D / 2 + 1.1, 0.6, 0.85, { madera: '#8f6644' });
  tallaDuende(K, K.ext, W / 2 - 0.2, GALERIA_PISO, D / 2 + 1.15, -0.5, 0.6, { madera: '#a0805a' });
  K.circulo(-W / 2 + 0.25, D / 2 + 1.1, 0.2, GALERIA_PISO, GALERIA_PISO + 0.85);
  K.circulo(W / 2 - 0.2, D / 2 + 1.15, 0.18, GALERIA_PISO, GALERIA_PISO + 0.6);
  // y una puertita de duende al pie del zócalo (tradición: nada mágico)
  caja(K.ext, [1.8, 0.16, D / 2 + 0.07], [0.22, 0.3, 0.03], '#7a3a2a', { tipo: 4 });
  cartel(K, 'Bienvenidos', [-1.3, PISO + 2.15, D / 2 + 0.04], 0.9, 0.18, 0, { marco: '#5a3c26' });
  maceta(K, -1.9, D / 2 + 0.3, { y: GALERIA_PISO });
  pilaLena(K, -W / 2 - 0.9, -1.0, Math.PI / 2, { largo: 1.3, filas: 2 });
  K.abarcar(-W / 2 - 1.5, W / 2, -D / 2, D / 2);
}

function casaFamilia(K) {
  const C = coloresDe(K, { pared: ['amarillo', 'celeste', 'rosa'], techo: ['rojo', 'verde', 'azul'] });
  const coc = { x: 3.0, z: -0.05, giro: -Math.PI / 2 };
  casco(K, {
    eje: 'x', estilo: 'horizontal', color: C.pared, colorTecho: C.techo, postigo: C.postigo, cortina: '#c86a5a',
    puertas: [{ cara: 'frente', x: -1.2, ancho: PUERTA_ANCHO, nombre: 'la puerta de la familia' }],
    ventanas: [{ cara: 'frente', x: 1.6, ancho: 1.2, alto: 1.15 }, { cara: 'frente', x: -2.8, ancho: 0.8, alto: 1.0 }, { cara: 'izq', z: 0.8, ancho: 0.9, alto: 1.0 },
      { cara: 'der', z: 1.6, ancho: 0.8, alto: 1.0 }, { cara: 'fondo', x: -1.8, ancho: 0.9, alto: 1.0, cuarto: 'vivienda' }, { cara: 'fondo', x: 1.8, ancho: 0.9, alto: 1.0, cuarto: 'vivienda' }],
    galeria: { fondo: 1.6 }, tabique: { z: -0.6, x: 0.4 },
    chimenea: { ...tuboCocina(coc.x, coc.z, coc.giro), tipo: 'chapa' },
  });
  if (!final(K)) return;
  const W = K.W, D = K.D;
  cocinaLena(K, coc.x, coc.z, coc.giro, { cuarto: 'local' });
  mesa(K, 1.6, 1.4, 0, { largo: 1.4, ancho: 0.8, mantel: '#e0d4b6' });
  for (const [x, z, g] of [[1.2, 0.75, 0], [2.0, 0.75, 0], [1.2, 2.05, Math.PI], [2.0, 2.05, Math.PI]]) silla(K, x, z, g, { color: elegir(azar(semillaDe('sf' + x + z)), ['#8a5a3a', '#4a6a5a', '#7a3a2a']) });
  K.punto('mesa', 0.4, 1.4, Math.PI / 2);
  lampara(K, 1.6, 1.4, { color: '#8a3a2a' });
  // juguetes: pelota, caballito de madera, cubos
  bulto(K.int, [-2.3, PISO + 0.12, 1.9], 0.12, '#c8402a', { detalle: 1, suave: true, tipo: 0 });
  const Fc = marcoLocal(-2.6, 0.6, 0.6, PISO);
  cj(K.int, Fc, 0, 0.35, 0, 0.5, 0.18, 0.16, '#a86a3a'); cj(K.int, Fc, 0.27, 0.48, 0, 0.12, 0.25, 0.12, '#a86a3a');
  for (const sx of [-1, 1]) cj(K.int, Fc, sx * 0.18, 0.12, 0, 0.05, 0.26, 0.24, '#7a4a2a', { rz: sx * 0.15 });
  for (let i = 0; i < 4; i++) caja(K.int, [-1.9 + (i % 2) * 0.13, PISO + 0.05 + Math.floor(i / 2) * 0.1, 0.0 + i * 0.05], [0.1, 0.1, 0.1], ['#c8402a', '#3a6a9a', '#d8b03a', '#4a8a4a'][i], { giro: i * 0.4 });
  alfombra(K, -2.2, 1.0, 1.4, 1.0, 0, '#4a6a8a', { guarda: '#d8c890' });
  estanteria(K, -1.4, -0.6 + 0.27, 0, { largo: 1.4, alto: 1.4, cosas: 'almacen', prof: 0.34, estantes: 3 });
  // los cuartos: la cama de los padres y la cucheta de los chicos
  const z0 = -D / 2 + MURO;
  cama(K, -W / 2 + MURO + 0.52, z0 + 1.0, 0, { manta: '#5a4a7a', nombre: 'cama' });
  for (const y of [0, 1.0]) {
    const F = marcoLocal(W / 2 - MURO - 0.47, z0 + 1.0, 0, PISO + y);
    cj(K.int, F, 0, 0.3, 0, 0.82, 0.12, 1.9, '#7a5636');
    cj(K.int, F, 0, 0.42, 0.05, 0.76, 0.12, 1.78, '#e4dccb');
    cj(K.int, F, 0, 0.5, 0.2, 0.84, 0.05, 1.3, y ? '#3a6a9a' : '#c8402a');
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(K.int, [W / 2 - MURO - 0.47 + sx * 0.4, PISO + 0.75, z0 + 1.0 + sz * 0.93], [0.06, 1.5, 0.06], '#6b4a2e');
  K.mueble(W / 2 - MURO - 0.47, z0 + 1.0, 0.86, 1.95, 1.5);
  lampara(K, 0.3, -1.8, { cuarto: 'vivienda', color: '#6a4a32' });
  // afuera: la hamaca de neumático, el tendedero, una carretilla de juguete
  columpio(K, W / 2 + 2.0, 0.3, Math.PI / 2);
  tendedero(K, -W / 2 - 1.4, -0.8, Math.PI / 2, { largo: 2.8 });
  bulto(K.ext, [W / 2 + 1.2, 0.12, 1.9], 0.12, '#3a6a9a', { detalle: 1, suave: true, tipo: 4 });
  const Fk = marcoLocal(2.4, D / 2 + 2.3, 0.4);
  cj(K.ext, Fk, 0, 0.25, 0, 0.5, 0.18, 0.35, '#b8402a', { tipo: 4 });
  for (const sx of [-1, 1]) cilindro(K.ext, Fk.p(sx * 0.28, 0.12, 0), 0.1, 0.1, 0.04, '#2a2624', { rz: Math.PI / 2, giro: 0.4, tipo: 4 });
  maceta(K, 2.8, D / 2 + 0.3, { y: GALERIA_PISO });
  K.abarcar(-W / 2 - 1.9, W / 2 + 3.1, -D / 2, D / 2 + 2.6);
}

// ---------------------------------------------------------------- piezas de los locales
// Otra chimenea de chapa (la salamandra del aula, la del salón).
function chimeneaExtra(K, x, z) {
  if (!final(K) || !K.R) return;
  const yR = K.R.yTecho(x, z) - 0.1, yTop = Math.max(K.R.yC + 0.4, yR + 0.9);
  cilindro(K.ext, [x, (yR + yTop) / 2, z], 0.09, 0.09, yTop - yR, '#4a4642', { tipo: 4, lados: 8, abierto: true });
  cono(K.ext, [x, yTop + 0.12, z], 0.2, 0.15, '#3f3b37', { tipo: 4, lados: 8 });
  cono(K.ext, [x, yR + 0.08, z], 0.18, 0.13, '#55524d', { tipo: 4, lados: 8 });
  (K.extra.chimeneas ??= []).push({ lx: x, ly: yTop + 0.2, lz: z });
  if (!K.chimenea) K.chimenea = { lx: x, ly: yTop + 0.2, lz: z };
}
// Un mapa pintado del valle (lago, bosque, cerros con nieve) en un marco.
function mapaPintado(K, x, y, z, giro, ancho = 1.5, alto = 1.0) {
  const F = marcoLocal(x, z, giro, y), c = K.int;
  cj(c, F, 0, 0, 0, ancho + 0.08, alto + 0.08, 0.03, '#5a4130');
  const nx = 10, ny = 7;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const u = (i + 0.5) / nx, v = (j + 0.5) / ny;
    const lago = Math.hypot((u - 0.42) * 1.4, v - 0.42) < 0.22;
    const cerro = v > 0.68 || u > 0.85;
    const col = lago ? '#5f8aa8' : cerro ? (v > 0.82 ? '#e8e6e0' : '#8a7a62') : (Math.sin(u * 9 + v * 7) > -0.2 ? '#5d7a4a' : '#9aa86a');
    const x0 = -ancho / 2 + ancho * i / nx, x1 = x0 + ancho / nx, y0 = -alto / 2 + alto * j / ny, y1 = y0 + alto / ny, k = escalar(tinte(col), 0.92 + 0.12 * Math.sin(i * 1.7 + j * 2.3));
    quad(c, F.p(x0, y0, 0.017), F.p(x1, y0, 0.017), F.p(x1, y1, 0.017), F.p(x0, y1, 0.017), k, k, k, k, 0);
  }
}
function campanita(K, x, y, z) {
  const perfil = [[0.01, 0], [0.13, 0.01], [0.12, 0.05], [0.09, 0.12], [0.07, 0.2], [0.03, 0.23], [0, 0.235]].map(([a, b]) => new THREE.Vector2(a, b));
  const g = new THREE.LatheGeometry(perfil, 10);
  K.ext.agregar(g, { tipo: 4, variar: 0.05, suave: true, matriz: matriz([x, y, z]), degradado: [lin('#5a4a2a'), lin('#a8874a')] });
  g.dispose();
  palo(K.ext, [x, y + 0.23, z], [x, y + 0.42, z], 0.012, '#3a3734');
}

// ---------------------------------------------------------------- la escuela (a medio hacer / terminada)
function escuela(K) {
  const C = coloresDe(K, { pared: ['cal', 'crema'], techo: ['rojo', 'verde'], postigo: ['verde', 'azul'] });
  const tab = { z: -0.9, x: 4.0 };
  casco(K, {
    eje: 'x', estilo: 'horizontal', color: C.pared, colorTecho: C.techo, postigo: C.postigo, desgaste: 0.25,
    puertas: [{ cara: 'frente', x: -1.5, ancho: 1.2, nombre: 'la puerta de la escuela' }],
    ventanas: [{ cara: 'frente', x: 1.0, ancho: 1.2, alto: 1.3 }, { cara: 'frente', x: 3.2, ancho: 1.2, alto: 1.3 }, { cara: 'frente', x: -3.6, ancho: 1.2, alto: 1.3 },
      { cara: 'izq', z: 1.4, ancho: 1.0, alto: 1.2 }, { cara: 'der', z: 1.4, ancho: 1.0, alto: 1.2 },
      { cara: 'fondo', x: -2.5, ancho: 0.9, alto: 1.0, cuarto: 'vivienda' }, { cara: 'fondo', x: 1.6, ancho: 0.9, alto: 1.0, cuarto: 'vivienda' }],
    galeria: { fondo: 2.0 }, tabique: tab, chimenea: chimeneaVivienda(K, tab), colorInterior: '#c8b48c', interior: 'interior',
  });
  const W = K.W, D = K.D;
  if (K.etapa === 3 && !K.op.obraActiva) {
    // a medio hacer: un cartel viejo tirado y yuyos contra el zócalo
    caja(K.ext, [W / 2 + 0.6, 0.06, 1.2], [1.4, 0.04, 0.3], PALETA_ALDEA.crudoGris, { giro: 0.3 });
    return;
  }
  if (!final(K)) return;
  const xi = W / 2 - MURO;
  // el pizarrón y el escritorio de la maestra
  caja(K.int, [-xi + 0.03, PISO + 1.5, 1.25], [0.04, 1.1, 2.4], '#22392b', { bajo: 0.9 });
  caja(K.int, [-xi + 0.05, PISO + 0.93, 1.25], [0.08, 0.04, 2.4], '#6b4a2e');
  caja(K.int, [-xi + 0.04, PISO + 1.5, 1.25], [0.05, 1.18, 2.48], '#6b4a2e', { bajo: 0.9 });
  for (let i = 0; i < 3; i++) caja(K.int, [-xi + 0.06, PISO + 1.7 - i * 0.18, 0.6 + i * 0.25], [0.005, 0.03, 0.5 - i * 0.1], '#e8e4d8');   // tiza
  mesa(K, -3.75, 1.25, Math.PI / 2, { largo: 1.2, ancho: 0.7 });
  silla(K, -4.35, 1.25, Math.PI / 2, { nombre: 'la silla de la maestra' });
  bulto(K.int, [-3.75, PISO + 0.92, 0.85], 0.14, '#5f8aa8', { tipo: 0, detalle: 1, suave: true });   // el globo terráqueo
  K.punto('pizarron', -4.3, 0.2, Math.PI / 2);
  // pupitres dobles mirando al pizarrón
  const pupitre = (x, z) => {
    const F = marcoLocal(x, z, -Math.PI / 2, PISO), c = K.int;
    cj(c, F, 0, 0.72, 0.1, 1.1, 0.04, 0.42, '#7a5636', { rx: 0.08 });
    cj(c, F, 0, 0.55, 0.12, 1.06, 0.3, 0.02, '#6b4a2e');
    cj(c, F, 0, 0.42, -0.36, 1.1, 0.04, 0.3, '#7a5636');
    for (const sx of [-1, 1]) {
      for (const dz of [0.25, -0.42]) cj(c, F, sx * 0.52, 0.36, dz, 0.035, 0.72, 0.035, '#33302d');
      cj(c, F, sx * 0.52, 0.06, -0.08, 0.035, 0.035, 0.75, '#33302d');
      cj(c, F, sx * 0.52, 0.4, -0.08, 0.03, 0.03, 0.7, '#33302d', { rx: 0.0 });
    }
    K.mueble(x, z, 1.15, 0.95, 0.74, -Math.PI / 2);
    for (const sx of [-0.27, 0.27]) { const p = F.p(sx, 0, -0.36); K.asiento('un pupitre', p[0], PISO + 0.44, p[2], -Math.PI / 2); }
  };
  for (const [x, z] of [[-1.6, 0.0], [0.6, 0.0], [2.8, 0.0], [-1.6, 1.45], [0.6, 1.45], [2.8, 1.45]]) pupitre(x, z);
  salamandra(K, -4.3, 2.9, {});
  chimeneaExtra(K, -4.3, 2.9);
  mapaPintado(K, 0.6, PISO + 1.6, tab.z + 0.08, 0, 1.4, 0.9);
  estanteria(K, -2.6, tab.z + 0.26, 0, { largo: 1.2, alto: 1.4, cosas: 'libros', prof: 0.3, estantes: 3 });
  // la bandera de ceremonias en su rincón
  palo(K.int, [4.5, PISO, -0.55], [4.5, PISO + 2.2, -0.55], 0.02, '#c9a64a');
  for (const [col, y] of [['#74acdf', 2.05], ['#f4f1ea', 1.9], ['#74acdf', 1.75]]) caja(K.int, [4.25, PISO + y, -0.55], [0.48, 0.15, 0.01], col, { bajo: 0.9 });
  lampara(K, -1.5, 0.7, { color: '#e8e2d2' }); lampara(K, 2.0, 1.4, { color: '#e8e2d2' });
  vivienda(K, tab, { manta: '#4a6a8a' });
  // afuera: el mástil del acto, la campana de la galería y el cartel
  const g = K.extra.galeria;
  mastil(K, 3.6, D / 2 + 3.5, { alto: 7.0 });
  campanita(K, -2.75, g.yPoste - 0.55, g.zP);
  cartelGaleria(K, 'Escuela N° 186', -1.5, 2.6, 0.48);
  banco(K, K.ext, 2.2, D / 2 + 0.4, 0, { y: GALERIA_PISO, largo: 1.8, tipo: 0, nombre: 'el banco de la escuela' });
  K.abarcar(-W / 2, W / 2, -D / 2, D / 2 + 4.2);
}

// ---------------------------------------------------------------- los locales del pueblo
function panaderia(K) {
  const C = coloresDe(K, { pared: ['cal', 'crema'], techo: ['rojo', 'oxido'], postigo: ['azul', 'verde'] });
  const tab = { z: -0.62, x: 2.2 };
  casco(K, {
    eje: 'z', estilo: 'horizontal', color: C.pared, colorTecho: C.techo, postigo: C.postigo, colorInterior: '#d4c7a8', interior: 'cal', colorFriso: '#7a4e34', colorPiso: '#8a6a4a',
    puertas: [{ cara: 'frente', x: -1.2, ancho: PUERTA_ANCHO, nombre: 'la puerta de la panadería' }],
    ventanas: [{ cara: 'frente', x: 1.5, ancho: 1.4, alto: 1.2, y: 1.35, postigos: false }, { cara: 'izq', z: 1.3, ancho: 0.9, alto: 1.0 }, { cara: 'der', z: 1.4, ancho: 0.9, alto: 1.0 },
      { cara: 'fondo', x: -1.2, ancho: 0.8, alto: 0.9, cuarto: 'vivienda' }],
    galeria: { fondo: 1.6 }, tabique: tab, chimenea: chimeneaVivienda(K, tab),
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, H = K.H;
  cartel(K, 'Panadería', [0, H + 0.62, D / 2 + 0.04], 2.4, 0.46, 0);
  mostrador(K, 0.45, 0.62, 0, { largo: 2.6, ancho: 0.55, color: '#7a5a3e', panel: '#a87a4a' });
  // canastas con pan sobre el mostrador
  for (const x of [-0.4, 0.5, 1.3]) {
    cilindro(K.int, [x, PISO + 1.02, 0.6], 0.2, 0.17, 0.12, '#a8844a', { lados: 10 });
    for (let k = 0; k < 4; k++) bulto(K.int, [x - 0.08 + (k % 2) * 0.16, PISO + 1.1, 0.53 + Math.floor(k / 2) * 0.13], 0.075, elegir(azar(semillaDe('pan' + x + k)), ['#b47a3c', '#c58b47', '#a86a32']), { tipo: 0, detalle: 1, suave: true, esc: [1.3, 0.7, 0.9] });
  }
  estanteria(K, W / 2 - MURO - 0.19, 2.0, -Math.PI / 2, { largo: 1.2, alto: 1.8, cosas: 'panes', prof: 0.38 });
  // la mesa de amasar con harina y el palote
  mesa(K, -2.45, 0.2, 0, { largo: 1.4, ancho: 0.8, color: '#9a7a52' });
  caja(K.int, [-2.45, PISO + 0.78, 0.2], [1.0, 0.01, 0.55], '#efe8d8');
  cilindro(K.int, [-2.2, PISO + 0.82, 0.25], 0.035, 0.035, 0.5, '#c9a878', { rz: Math.PI / 2, lados: 6 });
  bulto(K.int, [-2.7, PISO + 0.83, 0.15], 0.12, '#e8dcc0', { tipo: 0, detalle: 1, suave: true, esc: [1.3, 0.6, 1] });
  K.trabajo('amasar', -2.45, 0.95, Math.PI);
  for (const [x, z] of [[-2.95, 2.45], [-2.95, 1.85], [-2.4, 2.5]]) bolsa(K, x, z, { color: '#e2d8c0' });
  K.mueble(-2.75, 2.2, 1.0, 1.05, 0.72);
  lampara(K, 0.4, 1.4, { color: '#8a3a2a' });
  // la pizarra de precios y el almanaque, sobre el tabique detrás del mostrador
  caja(K.int, [0.4, PISO + 1.75, tab.z + 0.08], [0.9, 0.6, 0.03], '#2a2e2a', { bajo: 0.9 });
  caja(K.int, [0.4, PISO + 1.75, tab.z + 0.075], [0.98, 0.68, 0.02], '#6b4a2e');
  for (let i = 0; i < 4; i++) caja(K.int, [0.25 + (i % 2) * 0.12, PISO + 1.92 - i * 0.11, tab.z + 0.1], [0.32 - (i % 2) * 0.1, 0.02, 0.005], '#e8e4d8');
  cuadro(K, -1.4, PISO + 1.6, tab.z + 0.08, 0, { ancho: 0.35, alto: 0.5, colores: ['#e8e2d2', '#b8322a', '#e8e2d2'] });
  vivienda(K, tab, { manta: '#b8823a' });
  hornoBarro(K, W / 2 + 1.5, 0.2, 0);
  pilaLena(K, W / 2 + 1.3, -1.8, 0, { largo: 1.5, filas: 4 });
  K.abarcar(-W / 2, W / 2 + 2.5, -D / 2, D / 2);
}

function herreria(K) {
  const C = coloresDe(K, { pared: ['gris'], techo: ['oxido', 'gris'] });
  const tab = { z: -1.2, x: 2.4 };
  casco(K, {
    eje: 'z', estilo: 'chapa', color: K.r() < 0.5 ? '#8a8a84' : '#7d6a5a', oxido: 0.55, colorTecho: C.techo, postigo: null, colorInterior: '#7a6650', colorPiso: '#5a4a3e', marco: '#4e3a28',
    puertas: [{ cara: 'frente', x: 0, ancho: 3.0, alto: 2.5, abierta: true }],
    ventanas: [{ cara: 'izq', z: 0.6, ancho: 1.0, alto: 0.8, y: 1.6, postigos: false }, { cara: 'der', z: 0.6, ancho: 1.0, alto: 0.8, y: 1.6, postigos: false },
      { cara: 'fondo', x: -1.0, ancho: 0.8, alto: 0.8, cuarto: 'vivienda', postigos: false }],
    tabique: tab, chimenea: chimeneaVivienda(K, tab), cortinaPaso: '#5a4a3a',
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, H = K.H, xi = W / 2 - MURO;
  cartel(K, 'Herrería', [0, H + 0.62, D / 2 + 0.04], 2.2, 0.46, 0);
  // los portones abiertos contra la fachada
  for (const l of [-1, 1]) paramento(K, K.ext, { cx: l * 2.3, cz: D / 2 + 0.07, nx: 0, nz: 1, largo: 1.5, y0: PISO - 0.02, y1: PISO + 2.45, estilo: 'vertical', color: '#6a5442', alero: PISO + 2.45, sombraAlero: 0.1 });
  for (const l of [-1, 1]) paramento(K, K.ext, { cx: l * 2.3, cz: D / 2 + 0.05, nx: 0, nz: -1, largo: 1.5, y0: PISO - 0.02, y1: PISO + 2.45, estilo: 'interior', color: '#5a4636', tipo: 0 });
  // la fragua: hogar de ladrillo, brasas, campana y chimenea
  const xf = -xi + 0.55, zf = 0.4;
  caja(K.int, [xf, PISO + 0.4, zf], [1.1, 0.8, 1.3], '#8a5a44', { bajo: 0.7 });
  caja(K.int, [xf + 0.05, PISO + 0.82, zf], [0.7, 0.05, 0.8], '#2a2420');
  caja(K.bra, [xf + 0.05, PISO + 0.86, zf], [0.45, 0.03, 0.5], '#ff7a2a', { tipo: 0, bajo: 0.7, alto: 1.3 });
  // la campana de chapa ennegrecida (cerrada abajo: de lejos se ve su boca oscura) y su conducto de ladrillo
  cilindro(K.int, [xf, PISO + 1.85, zf], 0.95, 0.26, 0.75, '#3a3632', { lados: 4, giro: Math.PI / 4, tipo: 0, suave: false });
  const yR = K.R.yTecho(xf, zf), yTop = yR + 1.1;
  caja(K.int, [xf, PISO + (2.15 + LIBRE) / 2, zf], [0.45, LIBRE - 2.15, 0.45], '#8a5a44');
  caja(K.ext, [xf, (yR - 0.4 + yTop) / 2, zf], [0.5, yTop - yR + 0.4, 0.5], '#8a5a44', { tipo: 4, bajo: 0.75 });
  caja(K.ext, [xf, yTop + 0.05, zf], [0.62, 0.08, 0.62], '#5c5a56', { tipo: 4 });
  (K.extra.chimeneas ??= []).push({ lx: xf, ly: yTop + 0.15, lz: zf, fragua: true });
  K.mueble(xf, zf, 1.1, 1.3, 0.85);
  K.luz(xf + 0.4, PISO + 1.1, zf, { color: 0xff6a20, radio: 6, intensidad: 1.3, clase: 'fragua', cuarto: 'local' });
  K.trabajo('fragua', xf + 1.05, zf, -Math.PI / 2);
  // el fuelle
  const Ff = marcoLocal(xf, zf + 0.95, 0, PISO);
  cj(K.int, Ff, 0, 0.75, 0, 0.5, 0.25, 0.7, '#5a3c26', { rx: 0.1 }); cj(K.int, Ff, 0, 0.6, 0, 0.06, 0.6, 0.06, '#3a2a1a');
  K.mueble(xf, zf + 0.95, 0.5, 0.7, 0.9);
  // el yunque sobre el tronco
  cilindro(K.int, [-1.2, PISO + 0.25, 0.8], 0.26, 0.28, 0.5, '#6a4d33', { lados: 9 });
  caja(K.int, [-1.2, PISO + 0.6, 0.8], [0.22, 0.2, 0.18], '#2f2c29');
  caja(K.int, [-1.2, PISO + 0.74, 0.8], [0.5, 0.1, 0.2], '#3a3632');
  cono(K.int, [-0.86, PISO + 0.74, 0.8], 0.07, 0.25, '#3a3632', { rz: -Math.PI / 2, tipo: 0 });
  K.circulo(-1.2, 0.8, 0.35, PISO, PISO + 0.8);
  K.trabajo('yunque', -1.2, 1.45, Math.PI);
  barril(K, -xi + 0.4, 1.75, { color: '#5a4636' });
  // el banco de trabajo con la morsa y las herramientas colgadas
  mesa(K, xi - 0.36, 0.6, -Math.PI / 2, { largo: 1.8, ancho: 0.7, color: '#5a4636' });
  caja(K.int, [xi - 0.45, PISO + 0.9, 0.0], [0.18, 0.2, 0.25], '#3a4a5a');
  caja(K.int, [xi - 0.01, PISO + 1.6, 0.6], [0.03, 0.9, 1.7], '#6a5040');
  const rh = azar(semillaDe('herr'));
  for (let i = 0; i < 9; i++) {
    const z = -0.15 + i * 0.19;
    caja(K.int, [xi - 0.05, PISO + 1.5 + rh() * 0.25, z], [0.03, 0.35 + rh() * 0.2, 0.035], '#7a5a3a');
    caja(K.int, [xi - 0.06, PISO + 1.75 + rh() * 0.15, z], [0.05, 0.06, 0.12], '#3a3632');
  }
  for (let i = 0; i < 4; i++) caja(K.int, [-0.6 + i * 0.12, PISO + 1.1, tab.z + 0.12], [0.03, 2.0, 0.03], '#4a4642', { rx: 0.08 });
  lampara(K, 0.2, 1.2, { color: '#3a3734' });
  vivienda(K, tab, { manta: '#5a6a4a' });
  // afuera: una rueda de carro apoyada, bolsas de carbón y el palenque
  const g = new THREE.TorusGeometry(0.55, 0.04, 5, 16);
  K.ext.agregar(g, { tipo: 4, matriz: matriz([W / 2 + 0.12, 0.56, 1.8], [0, Math.PI / 2, 0.15]), degradado: [lin('#3a3632'), lin('#5a4a3a')] });
  g.dispose();
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; palo(K.ext, [W / 2 + 0.12, 0.56, 1.8], [W / 2 + 0.12 + Math.sin(0.15) * 0.0, 0.56 + Math.cos(a) * 0.52, 1.8 + Math.sin(a) * 0.52], 0.02, '#6a4d33'); }
  for (const z of [-1.0, -0.4]) bolsa(K, W / 2 + 0.5, z, { c: K.ext, y: 0, tipo: 4, color: '#3a3632' });
  K.circulo(W / 2 + 0.5, -0.7, 0.5, 0, 0.7);
  pilaLena(K, -W / 2 - 0.9, -1.5, Math.PI / 2, { largo: 1.6, filas: 4 });
  K.abarcar(-W / 2 - 1.5, W / 2 + 1.0, -D / 2, D / 2 + 0.5);
}

function carpinteria(K) {
  const C = coloresDe(K, { pared: ['alerce', 'ocre', 'verde'], techo: ['oxido', 'verde'], postigo: ['verde', 'marron'] });
  const tab = { z: -0.75, x: 3.0 };
  casco(K, {
    eje: 'x', estilo: 'vertical', color: C.pared, colorTecho: C.techo, postigo: C.postigo, colorInterior: '#b08a5e', colorPiso: '#9a7a52',
    puertas: [{ cara: 'frente', x: -1.0, ancho: 2.0, alto: 2.3, abierta: true }],
    ventanas: [{ cara: 'frente', x: 2.4, ancho: 1.4, alto: 1.1 }, { cara: 'izq', z: 0.6, ancho: 1.0, alto: 1.0 }, { cara: 'der', z: 0.6, ancho: 1.0, alto: 1.0 },
      { cara: 'fondo', x: -2.0, ancho: 0.9, alto: 0.9, cuarto: 'vivienda' }],
    galeria: { fondo: 1.6 }, tabique: tab, chimenea: chimeneaVivienda(K, tab),
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, xi = W / 2 - MURO;
  // las dos hojas del portón, abiertas contra la fachada
  for (const x of [-2.5, 0.5]) paramento(K, K.ext, { cx: x, cz: D / 2 + 0.06, nx: 0, nz: 1, largo: 1.0, y0: PISO - 0.02, y1: PISO + 2.25, estilo: 'vertical', color: C.postigo, tabla: 0.18, alero: PISO + 2.25, sombraAlero: 0.1 });
  for (const x of [-2.5, 0.5]) paramento(K, K.ext, { cx: x, cz: D / 2 + 0.04, nx: 0, nz: -1, largo: 1.0, y0: PISO - 0.02, y1: PISO + 2.25, estilo: 'interior', color: '#6a5040', tipo: 0 });
  cartelGaleria(K, 'Carpintería', -1.0, 2.4, 0.46);
  // el banco de carpintero con la morsa, el cepillo y una tabla a medio cepillar
  mesa(K, 1.0, 1.2, 0, { largo: 2.0, ancho: 0.7, alto: 0.84, color: '#9a7a52' });
  caja(K.int, [0.05, PISO + 0.86, 1.58], [0.25, 0.18, 0.08], '#5a3c26');
  caja(K.int, [1.3, PISO + 0.88, 1.2], [1.4, 0.04, 0.22], '#d0a878', { giro: 0.05 });
  caja(K.int, [1.6, PISO + 0.93, 1.15], [0.28, 0.07, 0.08], '#6b4a2e');
  for (let i = 0; i < 3; i++) bulto(K.int, [0.6 + i * 0.5, PISO + 0.01, 1.8 + (i % 2) * 0.2], 0.25, '#e0c898', { tipo: 0, esc: [1.4, 0.04, 1], detalle: 1 });   // virutas
  K.trabajo('banco', 1.0, 1.95, Math.PI);
  // tablas apiladas contra la pared y otras paradas
  const rt = azar(semillaDe('carp'));
  for (let f = 0; f < 7; f++) for (let i = 0; i < 3; i++) caja(K.int, [-xi + 0.45 + (i - 1) * 0.24, PISO + 0.06 + f * 0.04, 0.9], [0.22, 0.035, 2.6], elegir(rt, ['#c39a68', '#b88d5c', '#cfa775']), { giro: (rt() - 0.5) * 0.03 });
  K.mueble(-xi + 0.45, 0.9, 0.8, 2.6, 0.36);
  for (let i = 0; i < 6; i++) caja(K.int, [-1.6 + i * 0.22, PISO + 1.1, tab.z + 0.2], [0.18, 2.2, 0.03], elegir(rt, ['#c39a68', '#b88d5c', '#cfa775', '#a98256']), { rx: -0.12 });
  K.mueble(-1.05, tab.z + 0.22, 1.4, 0.3, 2.2);
  estanteria(K, xi - 0.19, 1.6, -Math.PI / 2, { largo: 1.3, alto: 1.6, cosas: 'herramientas', prof: 0.36, estantes: 3 });
  // una silla terminada y otra a medio armar
  silla(K, 2.7, 2.2, -2.4, { nombre: 'la silla nueva' });
  const Fs = marcoLocal(2.0, 2.4, 0.4, PISO);
  cj(K.int, Fs, 0, 0.45, 0, 0.42, 0.04, 0.4, '#d0a878');
  for (const sx of [-1, 1]) cj(K.int, Fs, sx * 0.18, 0.22, 0.16, 0.04, 0.44, 0.04, '#d0a878');
  K.circulo(2.0, 2.4, 0.22, PISO, PISO + 0.5);
  lampara(K, 0.6, 1.0, { color: '#4a5a3a' });
  vivienda(K, tab, { manta: '#7a4a2a' });
  // afuera: rollizos y un caballete
  for (let i = 0; i < 7; i++) palo(K.ext, [-W / 2 - 1.2 + (i % 4) * 0.32 - (i >= 4 ? -0.16 : 0), 0.16 + (i >= 4 ? 0.28 : 0), -1.6], [-W / 2 - 1.2 + (i % 4) * 0.32 - (i >= 4 ? -0.16 : 0), 0.16 + (i >= 4 ? 0.28 : 0), 1.0], 0.15, elegir(rt, ['#6a4d33', '#7a5a3a', '#5e4630']), { abierto: false, lados: 7 });
  K.mueble(-W / 2 - 0.75, -0.3, 1.4, 2.6, 0.6, 0, 0);
  caballete(K, W / 2 + 1.2, 0.8, Math.PI / 2);
  K.abarcar(-W / 2 - 1.6, W / 2 + 1.8, -D / 2, D / 2);
}

function pescaderia(K) {
  const C = coloresDe(K, { pared: ['celeste', 'azul', 'cal'], techo: ['azul', 'gris'], postigo: ['azul', 'blanco', 'rojo'] });
  const tab = { z: -0.75, x: -0.3 };
  casco(K, {
    eje: 'z', estilo: 'horizontal', color: C.pared, colorTecho: C.techo, postigo: C.postigo, colorInterior: '#c9c3b0', interior: 'cal', colorFriso: '#4f6b7a', colorPiso: '#7a6a5a', alzada: 1.8,
    puertas: [{ cara: 'frente', x: -1.0, ancho: PUERTA_ANCHO, nombre: 'la puerta de la pescadería' }],
    ventanas: [{ cara: 'frente', x: 1.3, ancho: 1.2, alto: 1.0, postigos: false }, { cara: 'izq', z: 1.1, ancho: 0.8, alto: 0.9 }, { cara: 'der', z: -1.6, ancho: 0.7, alto: 0.8, cuarto: 'vivienda' }],
    galeria: { fondo: 1.4 }, tabique: tab, chimenea: chimeneaVivienda(K, tab),
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, H = K.H, xi = W / 2 - MURO;
  cartel(K, 'Pescadería', [0, H + 0.55, D / 2 + 0.04], 2.0, 0.42, 0);
  // el mostrador con la batea de hielo y las truchas
  mostrador(K, 1.6, 0.55, -Math.PI / 2, { largo: 1.6, ancho: 0.55, color: '#5f7a86', panel: '#4a6270', tapa: '#9aa6a8' });
  caja(K.int, [1.6, PISO + 1.0, 0.55], [0.45, 0.06, 1.3], '#dfe8ea', { bajo: 0.9 });
  const rp = azar(semillaDe('pesc'));
  for (let i = 0; i < 6; i++) bulto(K.int, [1.48 + (i % 2) * 0.24, PISO + 1.06, 0.05 + Math.floor(i / 2) * 0.42], 0.09, elegir(rp, ['#a8aeb0', '#c9a6a0', '#8a9aa0']), { tipo: 0, detalle: 1, suave: true, esc: [0.7, 0.45, 2.2] });
  // la balanza colgante
  palo(K.int, [1.6, PISO + 1.75, 0.55], [1.6, PISO + LIBRE, 0.55], 0.008, '#3a3734');
  cilindro(K.int, [1.6, PISO + 1.75, 0.55], 0.07, 0.07, 0.18, '#c9c3b0', { lados: 8 });
  cilindro(K.int, [1.6, PISO + 1.45, 0.55], 0.18, 0.16, 0.04, '#9aa0a2', { lados: 10 });
  // la red colgada con sus boyas
  for (let i = 0; i < 7; i++) caja(K.int, [-xi + 0.03, PISO + 1.65, -0.1 + i * 0.32], [0.012, 1.3, 0.012], '#4a4a3a');
  for (let j = 0; j < 5; j++) caja(K.int, [-xi + 0.035, PISO + 1.05 + j * 0.3, 0.86], [0.012, 0.012, 1.95], '#4a4a3a');
  for (let i = 0; i < 5; i++) bulto(K.int, [-xi + 0.08, PISO + 2.28, -0.05 + i * 0.45], 0.06, '#d8702a', { tipo: 0, detalle: 1, suave: true });
  // cajones de pescado y botas
  for (let i = 0; i < 3; i++) caja(K.int, [-2.3, PISO + 0.13 + i * 0.25, 1.85], [0.7, 0.24, 0.45], i % 2 ? '#8a6a46' : '#9a7a52', { giro: (i - 1) * 0.08 });
  K.mueble(-2.3, 1.85, 0.75, 0.5, 0.75);
  for (const x of [-0.3, -0.15]) cilindro(K.int, [x, PISO + 0.2, -0.45], 0.06, 0.06, 0.4, '#2a3a2a', { lados: 7 });
  lampara(K, 0.0, 0.8, { color: '#3f5a6a' });
  vivienda(K, tab, { manta: '#3f5a7a' });
  // afuera: el ahumadero chico, la red secándose y los remos
  const xa = -W / 2 - 1.3, za = -0.8;
  const Fa = marcoLocal(xa, za, Math.PI / 2);
  for (const f of Object.values(carasDe(1.0, 1.0))) paramento(K, K.ext, { ...f, cx: xa + f.cx, cz: za + f.cz, y0: 0, y1: 1.6, estilo: 'vertical', color: '#5a4a3e', tabla: 0.16, alero: 1.6 });
  chapaPlano(K, K.ext, Fa.p(-0.7, 1.6, 0.7), Fa.p(0.7, 1.6, 0.7), Fa.p(0.7, 1.95, -0.1), Fa.p(-0.7, 1.95, -0.1), { color: '#7f817d', oxido: 0.6 });
  chapaPlano(K, K.ext, Fa.p(0.7, 1.6, -0.7), Fa.p(-0.7, 1.6, -0.7), Fa.p(-0.7, 1.95, 0.1), Fa.p(0.7, 1.95, 0.1), { color: '#7f817d', oxido: 0.6 });
  cilindro(K.ext, [xa, 2.15, za], 0.07, 0.07, 0.5, '#3a3734', { tipo: 4, abierto: true });
  K.extra.humo = { lx: xa, ly: 2.45, lz: za };
  K.mueble(xa, za, 1.05, 1.05, 1.6, 0, 0);
  for (const z of [0.1, 1.3]) { palo(K.ext, [W / 2 + 1.1, -0.2, z], [W / 2 + 1.1, 1.8, z], 0.05, '#6e5a44'); K.circulo(W / 2 + 1.1, z, 0.07, 0, 1.8); }
  for (let i = 0; i < 6; i++) caja(K.ext, [W / 2 + 1.1, 1.0 + i * 0.13, 0.7], [0.012, 0.012, 1.2], '#4a4a3a', { tipo: 0 });
  for (let i = 0; i < 6; i++) caja(K.ext, [W / 2 + 1.1, 1.3, 0.2 + i * 0.2], [0.012, 0.8, 0.012], '#4a4a3a', { tipo: 0 });
  for (const z of [1.7, 1.95]) viga(K.ext, [W / 2 + 0.12, 0.02, z], [W / 2 + 0.16, 2.2, z + 0.1], 0.05, 0.03, '#a8845a', { tipo: 0 });
  K.abarcar(-W / 2 - 2.0, W / 2 + 1.5, -D / 2, D / 2);
}

function puestoSanitario(K) {
  const C = coloresDe(K, { pared: ['cal'], techo: ['rojo', 'gris'], postigo: ['rojo'] });
  const tab = { z: -0.6, x: -1.8 };
  casco(K, {
    eje: 'x', estilo: 'horizontal', color: C.pared, colorTecho: C.techo, postigo: C.postigo, colorInterior: '#e2ddd0', interior: 'cal', colorPiso: '#8a7a6a', colorCielo: '#cfc6b2',
    puertas: [{ cara: 'frente', x: -0.9, ancho: PUERTA_ANCHO, nombre: 'la puerta del puesto sanitario' }],
    ventanas: [{ cara: 'frente', x: 1.4, ancho: 1.1, alto: 1.15 }, { cara: 'izq', z: 0.9, ancho: 0.9, alto: 1.0 }, { cara: 'der', z: 1.0, ancho: 0.9, alto: 1.0 },
      { cara: 'fondo', x: 0.6, ancho: 0.8, alto: 0.9, cuarto: 'vivienda' }],
    galeria: { fondo: 1.5 }, tabique: tab, chimenea: chimeneaVivienda(K, tab), cortina: '#e8e8e0',
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, xi = W / 2 - MURO;
  cartelGaleria(K, 'Puesto Sanitario', -0.9, 2.6, 0.48);
  // la cruz roja pintada en la pared del costado
  caja(K.ext, [W / 2 + 0.03, 2.1, -1.4], [0.02, 0.7, 0.22], '#b8322a', { tipo: 4 });
  caja(K.ext, [W / 2 + 0.03, 2.1, -1.4], [0.02, 0.22, 0.7], '#b8322a', { tipo: 4 });
  // la camilla con su escalerita, el biombo, el escritorio y el botiquín
  const Fc = marcoLocal(xi - 0.42, 1.2, 0, PISO);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cj(K.int, Fc, sx * 0.3, 0.35, sz * 0.85, 0.05, 0.7, 0.05, '#c9cfd0');
  cj(K.int, Fc, 0, 0.72, 0, 0.7, 0.1, 1.9, '#4a6a5a');
  cj(K.int, Fc, 0, 0.78, 0.1, 0.66, 0.02, 1.5, '#f0ede4');
  cj(K.int, Fc, 0, 0.82, -0.75, 0.5, 0.08, 0.3, '#f0ede4');
  K.mueble(xi - 0.42, 1.2, 0.72, 1.92, 0.78);
  caja(K.int, [xi - 0.95, PISO + 0.12, 1.4], [0.35, 0.24, 0.3], '#c9cfd0');
  K.punto('camilla', xi - 1.2, 1.7, Math.PI / 2);
  for (let i = 0; i < 3; i++) {
    const F = marcoLocal(1.25 + i * 0.05, 0.05 + i * 0.48, 0.5 * (i % 2 ? -1 : 1) + 1.2, PISO);
    cj(K.int, F, 0, 0.85, 0, 0.5, 1.6, 0.03, '#f0ede4', { bajo: 0.85 });
    cj(K.int, F, 0, 0.85, 0, 0.54, 1.66, 0.02, '#c9cfd0');
  }
  K.mueble(1.3, 0.55, 0.35, 1.3, 1.7);
  mesa(K, -2.0, 1.4, Math.PI / 2, { largo: 1.1, ancho: 0.65 });
  silla(K, -2.55, 1.4, Math.PI / 2, { nombre: 'la silla de la enfermera' });
  silla(K, -1.4, 1.4, -Math.PI / 2, { nombre: 'la silla del paciente' });
  caja(K.int, [-2.0, PISO + 0.8, 1.2], [0.3, 0.04, 0.22], '#f0ede4');
  cilindro(K.int, [-2.05, PISO + 0.85, 1.65], 0.05, 0.04, 0.12, '#5f8aa8', { lados: 7 });
  const Fb = marcoLocal(0.6, tab.z + 0.27, 0, PISO);
  cj(K.int, Fb, 0, 0.85, 0, 0.9, 1.7, 0.4, '#e8e6e0', { bajo: 0.8 });
  cj(K.int, Fb, 0, 1.25, 0.205, 0.32, 0.09, 0.01, '#b8322a'); cj(K.int, Fb, 0, 1.25, 0.205, 0.09, 0.32, 0.01, '#b8322a');
  for (const sx of [-1, 1]) cj(K.int, Fb, sx * 0.22, 0.85, 0.205, 0.4, 1.5, 0.008, '#d8d6d0');
  K.mueble(0.6, tab.z + 0.27, 0.9, 0.4, 1.7);
  // la balanza de pie
  caja(K.int, [0.3, PISO + 0.04, 2.45], [0.35, 0.08, 0.45], '#2f2c29');
  caja(K.int, [0.3, PISO + 0.7, 2.27], [0.06, 1.3, 0.06], '#c9cfd0');
  caja(K.int, [0.3, PISO + 1.35, 2.35], [0.35, 0.04, 0.04], '#c9cfd0');
  K.circulo(0.3, 2.4, 0.25, PISO, PISO + 1.4);
  lampara(K, 0.2, 1.1, { color: '#e8e6e0' });
  vivienda(K, tab, { manta: '#9a8ab0' });
  banco(K, K.ext, 1.6, D / 2 + 0.4, 0, { y: GALERIA_PISO, largo: 1.6, tipo: 0, nombre: 'el banco de espera' });
  maceta(K, -2.5, D / 2 + 0.3, { y: GALERIA_PISO });
}

function estafeta(K) {
  const C = coloresDe(K, { pared: ['amarillo', 'ocre', 'rojo'], techo: ['azul', 'gris', 'rojo'], postigo: ['azul'] });
  const tab = { z: -0.8, x: 1.2 };
  casco(K, {
    eje: 'z', estilo: 'vertical', color: C.pared, colorTecho: C.techo, postigo: C.postigo, colorInterior: '#b89a72', alzada: 1.6,
    puertas: [{ cara: 'frente', x: 0.8, ancho: PUERTA_ANCHO, nombre: 'la puerta de la estafeta' }],
    ventanas: [{ cara: 'frente', x: -1.2, ancho: 0.9, alto: 1.0 }, { cara: 'der', z: 1.0, ancho: 0.8, alto: 0.9 }, { cara: 'izq', z: -1.6, ancho: 0.7, alto: 0.8, cuarto: 'vivienda' }],
    galeria: { fondo: 1.3 }, tabique: tab, chimenea: chimeneaVivienda(K, tab),
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, H = K.H, xi = W / 2 - MURO;
  cartel(K, 'Estafeta Postal', [0, H + 0.5, D / 2 + 0.04], 2.1, 0.4, 0);
  mostrador(K, -0.9, 0.4, 0, { largo: 2.2, ancho: 0.5, color: '#5a4636', panel: '#3b5675' });
  // el telégrafo
  caja(K.int, [-0.3, PISO + 0.99, 0.35], [0.32, 0.05, 0.2], '#5a3c26');
  caja(K.int, [-0.24, PISO + 1.04, 0.38], [0.14, 0.03, 0.03], '#b9a271');
  for (const x of [-0.4, -0.32]) cilindro(K.int, [x, PISO + 1.06, 0.3], 0.03, 0.03, 0.08, '#9a5a2a', { lados: 7 });
  caja(K.int, [-1.7, PISO + 1.0, 0.4], [0.3, 0.08, 0.25], '#8d9299');
  K.trabajo('telegrafo', -0.3, -0.35, 0);
  // las casillas de correo (del lado del público)
  const Fc = marcoLocal(-xi + 0.17, 1.55, Math.PI / 2, PISO);
  cj(K.int, Fc, 0, 0.95, 0, 1.3, 1.7, 0.3, '#6b4a2e', { bajo: 0.7 });
  for (let i = 0; i <= 5; i++) cj(K.int, Fc, -0.6 + i * 0.24, 1.0, 0.155, 0.02, 1.4, 0.02, '#4a3420');
  for (let j = 0; j <= 6; j++) cj(K.int, Fc, 0, 0.3 + j * 0.233, 0.155, 1.22, 0.02, 0.02, '#4a3420');
  const rc = azar(semillaDe('casillas'));
  for (let k = 0; k < 9; k++) cj(K.int, Fc, -0.48 + Math.floor(rc() * 5) * 0.24, 0.42 + Math.floor(rc() * 6) * 0.233, 0.14, 0.14, 0.06, 0.005, '#efe8d8');
  K.mueble(-xi + 0.17, 1.55, 0.3, 1.3, 1.75);
  bolsa(K, -xi + 0.3, -0.45, { color: '#8a7a5a' });
  cilindro(K.int, [-0.9, PISO + 2.0, tab.z + 0.08], 0.17, 0.17, 0.04, '#efe8d8', { rx: Math.PI / 2, lados: 12 });   // el reloj
  lampara(K, 0.0, 0.9, { color: '#3b5675' });
  vivienda(K, tab, { manta: '#8a3a2a' });
  // el buzón y el cartelito de correo en la galería
  const g = K.extra.galeria;
  palo(K.ext, [-1.9, GALERIA_PISO, g.zP - 0.3], [-1.9, GALERIA_PISO + 1.0, g.zP - 0.3], 0.04, '#3a3734', { tipo: 4 });
  cilindro(K.ext, [-1.9, GALERIA_PISO + 1.25, g.zP - 0.3], 0.18, 0.18, 0.5, '#b8322a', { tipo: 4, lados: 10 });
  bulto(K.ext, [-1.9, GALERIA_PISO + 1.5, g.zP - 0.3], 0.18, '#b8322a', { detalle: 1, suave: true, esc: [1, 0.5, 1] });
  K.circulo(-1.9, g.zP - 0.3, 0.2, GALERIA_PISO, GALERIA_PISO + 1.6);
  cartelGaleria(K, 'Correo', 0.8, 1.0, 0.3);
}

function hilanderia(K) {
  const C = coloresDe(K, { pared: ['rosa', 'verde', 'crema'], techo: ['verde', 'azul'], postigo: ['verde', 'blanco', 'azul'] });
  const tab = { z: -0.6, x: -0.4 };
  casco(K, {
    eje: 'x', estilo: 'horizontal', color: C.pared, colorTecho: C.techo, postigo: C.postigo, colorInterior: '#c4a882', cortina: '#e8d8c0',
    puertas: [{ cara: 'frente', x: -1.4, ancho: PUERTA_ANCHO, nombre: 'la puerta de la hilandería' }],
    ventanas: [{ cara: 'frente', x: 1.0, ancho: 1.0, alto: 1.1 }, { cara: 'frente', x: 2.6, ancho: 0.9, alto: 1.1 }, { cara: 'izq', z: 0.8, ancho: 0.9, alto: 1.0 },
      { cara: 'der', z: 0.9, ancho: 0.9, alto: 1.0 }, { cara: 'fondo', x: 1.5, ancho: 0.8, alto: 0.9, cuarto: 'vivienda' }],
    galeria: { fondo: 1.6 }, tabique: tab, chimenea: chimeneaVivienda(K, tab),
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, xi = W / 2 - MURO;
  cartelGaleria(K, 'Hilandería', -1.4, 2.2, 0.44);
  const colores = ['#b0442f', '#d9b44a', '#4a6a8a', '#6a8a4a', '#e8e0d0', '#7a4a6a', '#c9773a', '#3a3a5a'];
  // el telar con la urdimbre de colores y su banco
  const Ft = marcoLocal(2.0, 0.55, 0, PISO);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cj(K.int, Ft, sx * 0.68, 0.8, sz * 0.45, 0.08, 1.6, 0.08, '#6b4a2e');
  for (const y of [1.55, 0.3]) for (const sz of [-1, 1]) cj(K.int, Ft, 0, y, sz * 0.45, 1.44, 0.07, 0.07, '#6b4a2e');
  for (let i = 0; i < 16; i++) cj(K.int, Ft, -0.6 + i * 0.08, 1.05, -0.05, 0.02, 0.95, 0.01, colores[i % 5]);
  for (let i = 0; i < 6; i++) cj(K.int, Ft, 0, 0.62 + i * 0.05, 0.3, 1.24, 0.05, 0.06, colores[(i * 3) % colores.length]);
  K.mueble(2.0, 0.55, 1.5, 1.0, 1.6);
  banco(K, K.int, 2.0, 1.4, Math.PI, { y: PISO, largo: 1.0, respaldo: false, nombre: 'el banco del telar' });
  K.trabajo('telar', 2.0, 1.95, Math.PI);
  // la rueca y su banquito
  const Fr = marcoLocal(-2.4, 0.9, 0.5, PISO);
  cj(K.int, Fr, 0, 0.3, 0, 0.7, 0.06, 0.2, '#7a5636', { rz: 0.15 });
  for (const sx of [-1, 1]) cj(K.int, Fr, sx * 0.28, 0.15, 0, 0.04, 0.3, 0.04, '#6b4a2e');
  cj(K.int, Fr, -0.12, 0.6, 0, 0.04, 0.6, 0.04, '#6b4a2e');
  const g = new THREE.TorusGeometry(0.3, 0.02, 4, 18);
  K.int.agregar(g, { tipo: 0, matriz: matriz(Fr.p(-0.12, 0.85, 0.03), [0, 0.3, 0]), degradado: [lin('#5a3c26'), lin('#8a6040')] });
  g.dispose();
  for (let i = 0; i < 4; i++) cj(K.int, Fr, -0.12, 0.85, 0.03, 0.58, 0.02, 0.02, '#6b4a2e', { rz: i * Math.PI / 4 });
  cl(K.int, Fr, 0.25, 0.5, 0, 0.05, 0.05, 0.12, '#e8e0d0', { rz: Math.PI / 2 });
  K.circulo(-2.4, 0.9, 0.4, PISO, PISO + 1.2);
  silla(K, -1.85, 1.25, -2.2, { nombre: 'la silla de la rueca' });
  K.trabajo('rueca', -1.5, 0.7, -Math.PI / 2);
  // las madejas colgadas y el canasto de vellón
  palo(K.int, [-xi + 0.12, PISO + 2.0, -0.3], [-xi + 0.12, PISO + 2.0, 1.9], 0.025, '#6b4a2e');
  for (let i = 0; i < 11; i++) cilindro(K.int, [-xi + 0.12, PISO + 1.78, -0.2 + i * 0.2], 0.06, 0.05, 0.42, colores[i % colores.length], { lados: 6 });
  cilindro(K.int, [-2.8, PISO + 0.25, -0.15], 0.3, 0.26, 0.5, '#a8844a', { lados: 10 });
  for (let i = 0; i < 4; i++) bulto(K.int, [-2.8 + (i % 2 - 0.5) * 0.25, PISO + 0.52, -0.15 + (i > 1 ? 0.12 : -0.12)], 0.16, '#efe9dc', { tipo: 0, detalle: 1, suave: true });
  K.circulo(-2.8, -0.15, 0.32, PISO, PISO + 0.7);
  estanteria(K, 1.2, tab.z + 0.25, 0, { largo: 1.6, alto: 1.8, cosas: 'madejas', prof: 0.34 });
  mesa(K, -2.55, 2.3, 0, { largo: 1.0, ancho: 0.6 });
  for (let i = 0; i < 4; i++) caja(K.int, [-2.55, PISO + 0.8 + i * 0.06, 2.3], [0.7, 0.055, 0.45], colores[(i * 2 + 1) % colores.length], { giro: (i - 1.5) * 0.06 });
  lampara(K, 0.8, 1.0, { color: '#7a4a6a' });
  vivienda(K, tab, { manta: '#b0442f' });
  // afuera: la lana teñida secándose al sol
  const xs = W / 2 + 1.2;
  for (const z of [-0.6, 1.4]) { palo(K.ext, [xs, -0.2, z], [xs, 1.9, z], 0.05, '#6e5a44'); K.circulo(xs, z, 0.07, 0, 1.9); }
  palo(K.ext, [xs, 1.85, -0.7], [xs, 1.85, 1.5], 0.03, '#7a6650');
  for (let i = 0; i < 8; i++) cilindro(K.ext, [xs, 1.55, -0.45 + i * 0.25], 0.07, 0.06, 0.55, colores[i], { lados: 6, tipo: 0 });
  K.abarcar(-W / 2, xs + 0.4, -D / 2, D / 2);
}

function salaMiel(K) {
  const C = coloresDe(K, { pared: ['amarillo', 'ocre', 'crema'], techo: ['verde', 'oxido'], postigo: ['verde', 'marron'] });
  const tab = { z: -0.75, x: 0.6 };
  casco(K, {
    eje: 'z', estilo: 'vertical', color: C.pared, colorTecho: C.techo, postigo: C.postigo, colorInterior: '#d2c3a0', interior: 'cal', colorFriso: '#8a6a34', alzada: 1.8,
    puertas: [{ cara: 'frente', x: -0.9, ancho: PUERTA_ANCHO, nombre: 'la puerta de la sala de miel' }],
    ventanas: [{ cara: 'frente', x: 1.3, ancho: 1.1, alto: 1.0 }, { cara: 'izq', z: 0.9, ancho: 0.8, alto: 0.9 }, { cara: 'der', z: 0.8, ancho: 0.8, alto: 0.9 }],
    galeria: { fondo: 1.4 }, tabique: tab, chimenea: chimeneaVivienda(K, tab),
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, H = K.H, xi = W / 2 - MURO;
  cartel(K, 'Sala de Miel', [0, H + 0.55, D / 2 + 0.04], 2.1, 0.42, 0);
  mostrador(K, 0.9, 0.6, 0, { largo: 1.7, ancho: 0.55, color: '#8a6a3a', panel: '#c99a3a' });
  for (let i = 0; i < 6; i++) cilindro(K.int, [0.3 + i * 0.22, PISO + 1.05, 0.62 + (i % 2) * 0.1], 0.06, 0.06, 0.15, '#c88a20', { lados: 8 });
  estanteria(K, xi - 0.19, 1.5, -Math.PI / 2, { largo: 1.3, alto: 1.8, cosas: 'frascos', colorFrasco: '#c88a20', prof: 0.36 });
  // el extractor (la centrífuga) con su manija
  cilindro(K.int, [-2.25, PISO + 0.45, 0.9], 0.38, 0.38, 0.9, '#b8bcbc', { lados: 12, bajo: 0.7 });
  cilindro(K.int, [-2.25, PISO + 0.92, 0.9], 0.4, 0.4, 0.05, '#9aa0a2', { lados: 12 });
  palo(K.int, [-2.25, PISO + 0.95, 0.9], [-2.25, PISO + 1.15, 0.9], 0.02, '#3a3734');
  caja(K.int, [-2.1, PISO + 1.15, 0.9], [0.3, 0.03, 0.03], '#3a3734');
  K.circulo(-2.25, 0.9, 0.42, PISO, PISO + 1.2);
  K.trabajo('extractor', -1.4, 0.9, -Math.PI / 2);
  // la mesa de desopercular con los cuadros de panal
  mesa(K, -2.25, -0.32, 0, { largo: 1.0, ancho: 0.6, color: '#9a7a52' });
  for (let i = 0; i < 3; i++) caja(K.int, [-2.55 + i * 0.3, PISO + 0.9, -0.32], [0.04, 0.24, 0.42], '#d8a83a', { giro: 0.1 * i });
  for (const z of [1.9, 2.15]) cilindro(K.int, [-2.6, PISO + 0.3, z], 0.15, 0.15, 0.6, '#9aa0a2', { lados: 9 });
  K.mueble(-2.6, 2.02, 0.32, 0.6, 0.6);
  lampara(K, 0.0, 1.0, { color: '#c99a3a' });
  vivienda(K, tab, { manta: '#c88a20' });
  // afuera: las colmenas y un cantero de flores
  const cols = ['#e2dccb', '#9ab0c4', '#e0c870', '#b8cfa8'];
  for (let i = 0; i < 4; i++) colmena(K, W / 2 + 1.5, -1.6 + i * 1.05, Math.PI / 2, cols[i]);
  cantero(K, W / 2 + 1.6, D / 2 + 1.0, { largo: 1.8, ancho: 0.9 });
  K.abarcar(-W / 2, W / 2 + 2.6, -D / 2, D / 2 + 1.6);
}

function seccional(K) {
  const C = coloresDe(K, { pared: ['verde', 'alerce'], techo: ['negro', 'rojo', 'verde'], postigo: ['amarillo', 'marron'] });
  const tab = { z: -0.6, x: 1.8 };
  casco(K, {
    eje: 'x', estilo: 'vertical', color: C.pared, colorTecho: C.techo, postigo: C.postigo, colorInterior: '#a8825a', marco: '#e0d6b8',
    puertas: [{ cara: 'frente', x: -1.0, ancho: PUERTA_ANCHO, nombre: 'la puerta de la seccional' }],
    ventanas: [{ cara: 'frente', x: 1.4, ancho: 1.1, alto: 1.1 }, { cara: 'izq', z: 1.6, ancho: 0.8, alto: 1.0 }, { cara: 'der', z: 1.9, ancho: 0.9, alto: 1.0 },
      { cara: 'fondo', x: -0.6, ancho: 0.8, alto: 0.9, cuarto: 'vivienda' }],
    galeria: { fondo: 1.6 }, tabique: tab, chimenea: chimeneaVivienda(K, tab),
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, xi = W / 2 - MURO;
  cartelGaleria(K, 'Guardaparques', -1.0, 2.4, 0.46);
  // el escritorio con la radio, los binoculares y el libro de novedades
  mesa(K, xi - 0.36, 0.9, -Math.PI / 2, { largo: 1.3, ancho: 0.7 });
  silla(K, xi - 0.98, 0.9, Math.PI / 2, { nombre: 'la silla del guardaparque' });
  K.trabajo('escritorio', xi - 1.6, 0.9, Math.PI / 2);
  caja(K.int, [xi - 0.3, PISO + 0.9, 0.5], [0.3, 0.22, 0.35], '#3a4a3a');
  cilindro(K.int, [xi - 0.18, PISO + 0.9, 0.42], 0.03, 0.03, 0.01, '#d8c890', { rz: Math.PI / 2 });
  palo(K.int, [xi - 0.3, PISO + 1.0, 0.65], [xi - 0.3, PISO + 1.5, 0.65], 0.006, '#9aa0a2');
  for (const dz of [-0.05, 0.05]) cilindro(K.int, [xi - 0.45, PISO + 0.82, 1.1 + dz], 0.04, 0.035, 0.16, '#2f2c29', { rz: Math.PI / 2, lados: 7 });
  caja(K.int, [xi - 0.4, PISO + 0.8, 1.35], [0.3, 0.04, 0.22], '#4a3a6a');
  // el mapa del valle en la pared, la biblioteca y el perchero
  mapaPintado(K, -0.6, PISO + 1.55, tab.z + 0.08, 0, 1.6, 1.1);
  estanteria(K, -xi + 0.19, 0.9, Math.PI / 2, { largo: 1.4, alto: 1.8, cosas: 'libros', prof: 0.34 });
  palo(K.int, [-2.5, PISO, 2.45], [-2.5, PISO + 1.8, 2.45], 0.03, '#5a3c26');
  caja(K.int, [-2.5, PISO + 1.25, 2.52], [0.42, 0.75, 0.16], '#4a5a3a');
  cilindro(K.int, [-2.5, PISO + 1.82, 2.45], 0.2, 0.2, 0.03, '#7a6a4a', { lados: 10 });
  cilindro(K.int, [-2.5, PISO + 1.87, 2.45], 0.1, 0.11, 0.1, '#7a6a4a', { lados: 10 });
  K.circulo(-2.5, 2.45, 0.25, PISO, PISO + 1.9);
  cuadro(K, 1.2, PISO + 1.6, tab.z + 0.08, 0, { ancho: 0.6, alto: 0.45, colores: ['#e8e2d2', '#8a6a4a', '#e8e2d2'] });   // huellas del cuaderno
  lampara(K, 0.4, 1.0, { color: '#3a4a3a' });
  vivienda(K, tab, { manta: '#5a6a3a' });
  mastil(K, 2.3, D / 2 + 3.0, { alto: 6.5 });
  pilaLena(K, -W / 2 - 0.9, -1.0, Math.PI / 2, { largo: 1.6, filas: 4, techito: true });
  K.abarcar(-W / 2 - 1.5, W / 2, -D / 2, D / 2 + 3.6);
}

function salon(K) {
  const C = coloresDe(K, { pared: ['rojo', 'verde', 'azul', 'ocre'], techo: ['gris', 'negro'], postigo: ['blanco', 'verde'] });
  const tab = { z: -1.5, x: -3.6 };
  casco(K, {
    eje: 'z', estilo: 'vertical', color: C.pared, colorTecho: C.techo, postigo: C.postigo, cielo: false, colorInterior: '#b08a5e', alzada: 2.4, desgaste: 0.3,
    puertas: [{ cara: 'frente', x: 0, ancho: 1.4, alto: 2.3, nombre: 'la puerta del salón' }],
    ventanas: [{ cara: 'frente', x: -3.0, ancho: 1.2, alto: 1.3 }, { cara: 'frente', x: 3.0, ancho: 1.2, alto: 1.3 },
      { cara: 'izq', z: 0.2, ancho: 1.0, alto: 1.2 }, { cara: 'izq', z: 2.4, ancho: 1.0, alto: 1.2 }, { cara: 'der', z: 0.2, ancho: 1.0, alto: 1.2 }, { cara: 'der', z: 2.4, ancho: 1.0, alto: 1.2 },
      { cara: 'fondo', x: 3.0, ancho: 0.9, alto: 0.9, cuarto: 'vivienda' }],
    galeria: { fondo: 1.6, x0: -2.2, x1: 2.2, postes: 2 }, tabique: tab, chimenea: chimeneaVivienda(K, tab),
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, H = K.H, xi = W / 2 - MURO;
  cartel(K, 'Salón Social', [0, H + 0.75, D / 2 + 0.04], 2.8, 0.52, 0);
  // el escenario contra el tabique, con su escalón
  const x0 = -2.2, x1 = xi, z0 = tab.z + 0.06, z1 = tab.z + 1.46, hE = 0.45;
  pisoTablas(K, K.int, { x0, x1, z0, z1, y: PISO + hE, color: '#7a5a3c', ocluir: false });
  caja(K.int, [(x0 + x1) / 2, PISO + hE / 2, z1 - 0.02], [x1 - x0, hE, 0.04], '#5a3c26');
  caja(K.int, [x0 + 0.02, PISO + hE / 2, (z0 + z1) / 2], [0.04, hE, z1 - z0], '#5a3c26');
  K.plataforma((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, PISO + hE, hE);
  caja(K.int, [x0 - 0.25, PISO + 0.11, (z0 + z1) / 2], [0.5, 0.22, 1.0], '#6e5036');
  K.plataforma(x0 - 0.25, (z0 + z1) / 2, 0.5, 1.0, PISO + 0.22, 0.22);
  // la guitarra en su soporte, el bombo legüero y dos sillas
  const yE = PISO + hE;
  bulto(K.int, [1.0, yE + 0.32, z0 + 0.6], 0.2, '#a8682a', { tipo: 0, detalle: 1, suave: true, esc: [1, 1, 0.35] });
  bulto(K.int, [1.0, yE + 0.6, z0 + 0.6], 0.15, '#a8682a', { tipo: 0, detalle: 1, suave: true, esc: [1, 1, 0.35] });
  caja(K.int, [1.0, yE + 0.95, z0 + 0.6], [0.06, 0.55, 0.03], '#3a2a1a');
  cilindro(K.int, [1.0, yE + 0.48, z0 + 0.66], 0.05, 0.05, 0.01, '#1a1410', { rx: Math.PI / 2 });
  cilindro(K.int, [2.0, yE + 0.25, z0 + 0.7], 0.25, 0.25, 0.5, '#8a5a3a', { lados: 12 });
  cilindro(K.int, [2.0, yE + 0.51, z0 + 0.7], 0.255, 0.255, 0.02, '#d8c8a8', { lados: 12 });
  silla(K, 0.3, z0 + 0.7, 0, { nombre: 'una silla del escenario' }); K.asiento('el músico', 0.3, yE + 0.47, z0 + 0.7, 0);
  K.trabajo('escenario', -0.7, z0 + 0.75, 0, yE);
  // los banderines cruzando el salón
  const rb = azar(semillaDe('banderines'));
  for (const [a, b] of [[[-xi, 2.85, 0.4], [xi, 2.85, 3.6]], [[-xi, 2.85, 3.6], [xi, 2.85, 0.4]]]) {
    const n = 18;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 0.7) / n;
      const p = (t) => [a[0] + (b[0] - a[0]) * t, PISO + a[1] - Math.sin(t * Math.PI) * 0.35, a[2] + (b[2] - a[2]) * t];
      const p0 = p(t0), p1 = p(t1), pm = p((t0 + t1) / 2);
      const k = tinte(elegir(rb, ['#b8322a', '#e0b030', '#3a6a9a', '#4a8a4a', '#e8e2d4']));
      tri(K.int, p0, p1, [pm[0], pm[1] - 0.22, pm[2]], k, k, escalar(k, 0.8), 0);
      tri(K.int, p1, p0, [pm[0], pm[1] - 0.22, pm[2]], k, k, escalar(k, 0.8), 0);
    }
  }
  // las mesas con sus sillas, a los costados del pasillo
  for (const [x, z] of [[-2.6, 1.2], [2.6, 1.2], [-2.6, 2.9], [2.6, 2.9]]) {
    mesa(K, x, z, 0, { largo: 1.2, ancho: 0.75, mantel: '#d8cfb4' });
    silla(K, x - 0.85, z, Math.PI / 2, { nombre: 'una silla del salón' });
    silla(K, x + 0.85, z, -Math.PI / 2, { nombre: 'una silla del salón' });
  }
  caja(K.int, [xi - 0.25, PISO + 0.45, 2.0], [0.45, 0.9, 1.4], '#5a3c26');   // el aparador con las damajuanas
  for (let i = 0; i < 3; i++) bulto(K.int, [xi - 0.25, PISO + 1.05, 1.5 + i * 0.4], 0.14, '#3a5a3a', { tipo: 0, detalle: 1, suave: true, esc: [1, 1.3, 1] });
  K.mueble(xi - 0.25, 2.0, 0.45, 1.4, 1.2);
  salamandra(K, -xi + 0.5, 3.2, {});
  chimeneaExtra(K, -xi + 0.5, 3.2);
  for (const [x, z] of [[-2.0, 1.5], [2.0, 1.5], [0, 2.8]]) lampara(K, x, z, { cuelga: 0.9, color: '#e0c890', radio: 8 });
  vivienda(K, tab, { manta: '#3a6a9a' });
  // afuera: dos faroles de pared junto a la puerta
  for (const l of [-1, 1]) {
    const x = l * 1.15, y = PISO + 2.2, z = D / 2 + 0.12;
    caja(K.ext, [x, y, z - 0.05], [0.04, 0.04, 0.2], '#2f2c2a', { tipo: 4 });
    caja(K.ext, [x, y + 0.15, z + 0.06], [0.2, 0.04, 0.2], '#2f2c2a', { tipo: 4 });
    const k0 = { r: 1, g: 0.92, b: 0.75 };
    quad(K.vid, [x - 0.08, y - 0.12, z + 0.16], [x + 0.08, y - 0.12, z + 0.16], [x + 0.08, y + 0.12, z + 0.16], [x - 0.08, y + 0.12, z + 0.16], k0, k0, k0, k0, 0);
    K.luz(x, y, z + 0.2, { color: 0xffc070, radio: 6, intensidad: 0.8, clase: 'farol', cuarto: 'afuera' });
  }
  banco(K, K.ext, 3.4, D / 2 + 0.6, 0, { largo: 1.6, tipo: 0, nombre: 'el banco del salón' });
  K.abarcar(-W / 2, W / 2, -D / 2, D / 2 + 1.6);
}

// ---------------------------------------------------------------- la biblioteca popular (de frente a la plaza)
function biblioteca(K) {
  const C = coloresDe(K, { pared: ['ocre', 'celeste', 'verde', 'crema'], techo: ['oxido', 'verde', 'gris'], postigo: ['verde', 'azul', 'marron'] });
  casco(K, {
    eje: 'z', estilo: 'vertical', color: C.pared, colorTecho: C.techo, postigo: C.postigo, alzada: 2.0, colorInterior: '#b08c62', colorPiso: '#7d5a3c', cortina: '#c9b089',
    puertas: [{ cara: 'frente', x: -1.6, ancho: 1.2, alto: 2.2, nombre: 'la puerta de la biblioteca' }],
    ventanas: [{ cara: 'frente', x: 1.3, ancho: 2.1, alto: 1.5, y: 1.4, postigos: false },
      { cara: 'izq', z: -2.5, ancho: 1.0, alto: 1.2 }, { cara: 'izq', z: 1.5, ancho: 1.0, alto: 1.2 }, { cara: 'der', z: -2.5, ancho: 1.0, alto: 1.2 }, { cara: 'der', z: 1.5, ancho: 1.0, alto: 1.2 }],
    galeria: { fondo: 1.8, postes: 3 },
  });
  if (!final(K)) return;
  const W = K.W, D = K.D, H = K.H, xi = W / 2 - MURO, zi = D / 2 - MURO;
  cartel(K, 'Biblioteca Popular', [0, H + 0.7, D / 2 + 0.04], 3.0, 0.56, 0);
  // estanterías con libros a lo largo de las paredes (donde no hay ventanas)
  for (const x of [-2.0, 0, 2.0]) estanteria(K, x, -zi + 0.2, 0, { largo: 1.85, alto: 2.2, cosas: 'libros', estantes: 4 });
  for (const l of [-1, 1]) for (const z of [-4.3, -0.5]) estanteria(K, l * (xi - 0.2), z, -l * Math.PI / 2, { largo: 1.6, alto: 1.75, cosas: 'libros', estantes: 3 });
  estanteria(K, -(xi - 0.2), 3.7, Math.PI / 2, { largo: 1.3, alto: 1.6, cosas: 'libros', estantes: 3 });
  // el mostrador del bibliotecario, con el fichero
  mostrador(K, -1.9, 2.6, 0, { largo: 1.8, ancho: 0.55, color: '#5d4330', panel: '#6b5a3a', nombre: 'mostrador' });
  const Ff = marcoLocal(-2.45, 2.55, 0, PISO + 0.95);
  cj(K.int, Ff, 0, 0.17, 0, 0.5, 0.34, 0.4, '#7a5636');
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cj(K.int, Ff, -0.12 + j * 0.24, 0.07 + i * 0.1, 0.201, 0.2, 0.07, 0.01, '#8a6a46');
  for (let i = 0; i < 4; i++) caja(K.int, [-1.6 + i * 0.12, PISO + 1.0, 2.5], [0.09, 0.03, 0.14], ['#7a3a2a', '#3a5a6a', '#6a6a3a', '#5a3a4a'][i], { giro: i * 0.2 });
  // tres mesas de lectura con doce sillas
  for (const z of [0.9, -1.3, -3.5]) {
    mesa(K, 0.5, z, 0, { largo: 1.6, ancho: 0.8, color: '#6b4a2e' });
    for (const sx of [-0.4, 0.4]) for (const sz of [-1, 1]) silla(K, 0.5 + sx, z + sz * 0.62, sz > 0 ? Math.PI : 0, { nombre: 'una silla de lectura' });
    caja(K.int, [0.3, PISO + 0.79, z], [0.3, 0.04, 0.22], '#7a5a3a', { giro: 0.3 });
    lampara(K, 0.5, z, { cuelga: 0.8, color: '#3f5a48', radio: 6 });
  }
  // la estufa y el sillón de la abuela, donde los domingos lee cuentos; la alfombra para los chicos
  salamandra(K, xi - 0.55, 3.6, {});
  chimeneaExtra(K, xi - 0.55, 3.6);
  // el sillón de orejas de la abuela, tapizado, con su manta tejida y la mesita del velador
  const xs = 1.75, zs = 4.0, gs = -2.5;
  const Fs = marcoLocal(xs, zs, gs, PISO), tela = '#5d3a2e', tela2 = '#6e4636';
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cj(K.int, Fs, sx * 0.36, 0.06, sz * 0.3, 0.07, 0.12, 0.07, '#3a2618');
  bulto(K.int, Fs.p(0, 0.3, 0.02), 0.5, tela, { tipo: 0, detalle: 1, suave: true, esc: [0.92, 0.36, 0.82], rot: [0, gs, 0], bajo: 0.6 });   // la base
  bulto(K.int, Fs.p(0, 0.5, 0.06), 0.4, tela2, { tipo: 0, detalle: 1, suave: true, esc: [0.95, 0.3, 0.85], rot: [0, gs, 0], bajo: 0.75 });   // el almohadón
  bulto(K.int, Fs.p(0, 0.92, -0.3), 0.5, tela, { tipo: 0, detalle: 1, suave: true, esc: [0.85, 1.05, 0.3], rot: [-0.12, gs, 0], bajo: 0.7 });   // el respaldo
  for (const sx of [-1, 1]) {
    bulto(K.int, Fs.p(sx * 0.4, 0.58, 0.02), 0.32, tela2, { tipo: 0, detalle: 1, suave: true, esc: [0.36, 0.48, 1.05], rot: [0, gs, 0] });   // los brazos
    bulto(K.int, Fs.p(sx * 0.38, 1.05, -0.22), 0.26, tela, { tipo: 0, detalle: 1, suave: true, esc: [0.3, 0.9, 0.6], rot: [0, gs, 0] });   // las orejas
  }
  for (let k = 0; k < 4; k++) cj(K.int, Fs, 0.41, 0.66 - k * 0.045, -0.18 + k * 0.12, 0.3, 0.025, 0.12, ['#c8a04a', '#8a3a2a', '#d8cfb8', '#4a6a7a'][k], { rz: -0.35 });   // la manta tejida, sobre el brazo
  K.mueble(xs, zs, 1.0, 0.95, 1.2, gs);
  K.asiento('el sillón de los cuentos', xs, PISO + 0.55, zs, gs);
  const Fm = marcoLocal(xs - 0.85, zs + 0.35, gs, PISO);
  cl(K.int, Fm, 0, 0.3, 0, 0.04, 0.05, 0.6, '#4a3020');
  cl(K.int, Fm, 0, 0.61, 0, 0.24, 0.24, 0.03, '#6b4a2e', { lados: 10 });
  cj(K.int, Fm, 0.05, 0.64, 0.03, 0.18, 0.04, 0.24, '#7a2f2a', { giro: 0.4 });   // el libro de cuentos
  cl(K.int, Fm, -0.1, 0.7, -0.05, 0.03, 0.04, 0.14, '#a88a5a');
  cono(K.int, Fm.p(-0.1, 0.84, -0.05), 0.11, 0.12, '#d8c49a', { tipo: 0, lados: 8, abierto: true });
  caja(K.bra, Fm.p(-0.1, 0.8, -0.05), [0.05, 0.05, 0.05], '#ffd9a0', { tipo: 0, bajo: 1, alto: 1 });
  K.circulo(Fm.p(0, 0, 0)[0], Fm.p(0, 0, 0)[2], 0.26, PISO, PISO + 0.7);
  K.luz(Fm.p(0, 0, 0)[0], PISO + 0.95, Fm.p(0, 0, 0)[2], { color: 0xffc888, radio: 4, intensidad: 0.6, clase: 'velador', cuarto: 'local' });
  alfombra(K, 1.1, 2.7, 2.4, 1.6, 0.15, '#7a3f34', { guarda: '#c7a76a' });
  // almohadones redondos de tela para los chicos
  for (const [x, z, col] of [[0.5, 2.6, '#c8a04a'], [1.15, 2.2, '#4a6a7a'], [1.6, 2.85, '#8a4a5a'], [0.75, 3.15, '#6a7a4a']]) {
    bulto(K.int, [x, PISO + 0.1, z], 0.28, col, { tipo: 0, detalle: 1, suave: true, esc: [1, 0.36, 1], rot: [0, x * 3, 0], bajo: 0.7 });

  }
  // un mapa del valle y una foto vieja de la aldea
  mapaPintado(K, xi - 0.02, PISO + 1.6, 0.6, -Math.PI / 2, 1.4, 0.95);
  cuadro(K, -2.9, PISO + 1.75, zi - 0.01, Math.PI, { ancho: 0.6, alto: 0.42, colores: ['#9a8a70', '#6a5a48', '#b8a888'] });
  lampara(K, -1.9, 3.3, { color: '#3f5a48' });
  // afuera: dos macetas y un banco en la galería
  maceta(K, -2.9, D / 2 + 0.3, { y: GALERIA_PISO }); maceta(K, 3.0, D / 2 + 0.3, { y: GALERIA_PISO });
  banco(K, K.ext, 1.3, D / 2 + 0.4, 0, { y: GALERIA_PISO, largo: 1.8, tipo: 0, nombre: 'el banco de la biblioteca' });
}

// ---------------------------------------------------------------- la plaza (su +Z mira a la estación)
// 3.6 (pulido): forma de plaza de pueblo. Un redondel de lajas irregulares en el centro con el duende
// tallado, ocho senderos de laja que salen a las calles y a las esquinas, un anillo de canteros
// cortado por los senderos que la contiene, bancos mirando al centro y faroles junto a los senderos.
// Entre los senderos queda el pasto del terreno (sólo lo pisado lleva plataforma).

// Lajas irregulares: un polígono de 5 a 7 lados por piedra, de tamaños distintos, sobre una grilla
// hexagonal movida; las juntas dejan ver el suelo. `dentro(x, z)` → 0..1 (en el borde se ralean).
function lajasIrregulares(K, c, r, dentro, x0, x1, z0, z1, paso = 0.72) {
  const pal = PALETA_ALDEA.laja.concat(['#9a8a74', '#8f8676', '#a39684', '#7c766c']);
  const fila = paso * 0.866;
  for (let j = 0, z = z0; z <= z1; j++, z += fila) {
    for (let x = x0 + (j % 2) * paso / 2; x <= x1; x += paso) {
      const cx = x + (r() - 0.5) * paso * 0.3, cz = z + (r() - 0.5) * fila * 0.3;
      const v = dentro(cx, cz);
      if (v <= 0 || (v < 1 && r() > v)) continue;
      const tam = (r() < 0.15 ? 1.3 : 1) * entre(r, 0.72, 1.12);
      const est = entre(r, 1.0, 1.55), ae = r() * 3.14, ce = Math.cos(ae), se = Math.sin(ae);
      const n = 5 + Math.floor(r() * 3), a0 = r() * 6.28, y = 0.04 + r() * 0.025;
      const k = escalar(tinte(elegir(r, pal)), 0.82 + 0.3 * r()), kb = escalar(k, 0.74);
      const ring = [];
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * 6.283 + (r() - 0.5) * 0.7;
        const rad = paso * 0.52 * tam * entre(r, 0.7, 1.08);
        // estirada en una dirección: lajas largas, no baldosas
        const lx = Math.cos(a) * rad * est / 1.25, lz = Math.sin(a) * rad / est * 1.15;
        ring.push([cx + lx * ce - lz * se, y - 0.012 - r() * 0.01, cz + lx * se + lz * ce]);
      }
      const centro = [cx, y + 0.012, cz];
      for (let i = 0; i < n; i++) {
        const p = ring[i], q = ring[(i + 1) % n];
        tri(c, centro, q, p, k, kb, kb, 4);
      }
    }
  }
}
function aljibe(K, x, z) {
  const c = K.ext;
  // brocal de piedra, dos postes con su techito de chapa, el rodillo con la soga y el balde
  const g = new THREE.CylinderGeometry(0.75, 0.82, 0.8, 14, 2, true);
  abollar(g, 0.04, 1.6);
  c.agregar(g, { tipo: 4, variar: 0.16, matriz: matriz([x, 0.38, z]), degradado: [lin('#6d6a62'), lin('#9a917f')], suave: 0.6 });
  g.dispose();
  cilindro(c, [x, 0.8, z], 0.86, 0.86, 0.1, '#8a8274', { tipo: 4, lados: 14 });
  cilindro(c, [x, 0.79, z], 0.6, 0.6, 0.04, '#1f2a2a', { tipo: 4, lados: 12 });
  for (const s of [-1, 1]) palo(c, [x + s * 0.7, 0.8, z], [x + s * 0.7, 2.3, z], 0.07, '#5e4630', { lados: 6, abierto: false });
  palo(c, [x - 0.78, 1.7, z], [x + 0.78, 1.7, z], 0.07, '#6e5036', { lados: 8, abierto: false });
  palo(c, [x + 0.1, 0.9, z], [x + 0.1, 1.65, z], 0.012, '#c9b88a');
  cilindro(c, [x + 0.1, 0.85, z], 0.11, 0.09, 0.2, '#6a5a48', { tipo: 4, lados: 8 });
  const F = marcoLocal(x, z, 0);
  chapaPlano(K, c, F.p(-0.95, 2.15, 0.6), F.p(0.95, 2.15, 0.6), F.p(0.95, 2.55, 0), F.p(-0.95, 2.55, 0), { color: '#7f817d', oxido: 0.6, musgo: 0.8, comba: 0.02 });
  chapaPlano(K, c, F.p(0.95, 2.15, -0.6), F.p(-0.95, 2.15, -0.6), F.p(-0.95, 2.55, 0), F.p(0.95, 2.55, 0), { color: '#7f817d', oxido: 0.6, musgo: 0.8, comba: 0.02 });
  K.circulo(x, z, 0.88, 0, 1.0);
}
// El duende tallado en el mismo tronco de coihue: abajo la corteza con sus raíces, arriba la madera
// trabajada, y la figura saliendo de la pieza. Mira a la estación (+Z).
function troncoDuende(K, x, z) {
  const g = new THREE.CylinderGeometry(0.47, 0.6, 1.0, 14, 4, true);
  abollar(g, 0.05, 1.4);
  K.ext.agregar(g, {
    tipo: 0, variar: 0.08, suave: true, matriz: matriz([x, 0.35, z]),
    degradado: [lin('#3e3026'), lin('#76604c')],
    tono: (px, py, pz) => 0.5 + 0.4 * Math.sin(Math.atan2(pz, px) * 11 + py * 1.6) + 0.1 * Math.sin(py * 7 + px * 3),
  });
  g.dispose();
  // el borde de la corteza, desparejo, donde empieza lo tallado
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 6.283;
    caja(K.ext, [x + Math.sin(a) * 0.47, 0.84 + (i % 3) * 0.03, z + Math.cos(a) * 0.47], [0.36, 0.12 + (i % 2) * 0.06, 0.06], '#4a3a2c', { giro: a, tipo: 0, bajo: 0.6 });
  }
  // la madera trabajada, que se angosta hacia la figura
  const g2 = new THREE.CylinderGeometry(0.36, 0.45, 0.32, 12, 1, true);
  abollar(g2, 0.025, 3.5);
  K.ext.agregar(g2, { tipo: 0, variar: 0.12, matriz: matriz([x, 1.0, z]), degradado: [lin('#7a5a3c'), lin('#a07a52')] });
  g2.dispose();
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.4;
    bulto(K.ext, [x + Math.sin(a) * 0.62, 0.07, z + Math.cos(a) * 0.62], 0.42, '#45372a', { tipo: 0, detalle: 0, abollar: 0.04, esc: [0.42, 0.32, 1.0], rot: [0, a, 0], bajo: 0.55, alto: 1.05 });
  }
  tallaDuende(K, K.ext, x, 1.08, z, 0, 2.25, { madera: '#9a7250', gorroOscuro: 0.58 });
  K.circulo(x, z, 0.66, 0, 3.4);
}
function plaza(K) {
  const { W, D } = K, c = K.ext;
  const r = azar(semillaDe('plaza|piso'));
  const RC = 4.1, ANCHO = 1.8;
  // los ocho senderos: a las cuatro calles y a las cuatro esquinas
  const rumbos = [[0, 1], [0, -1], [1, 0], [-1, 0], [W / 2, D / 2], [-W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]].map(([a, b]) => {
    const l = Math.hypot(a, b);
    const largo = Math.abs(a) < 1e-6 ? D / 2 : Math.abs(b) < 1e-6 ? W / 2 : l;
    return { ux: a / l, uz: b / l, largo };
  });
  const enSendero = (x, z) => rumbos.some((s) => {
    const t = x * s.ux + z * s.uz, d = Math.abs(-x * s.uz + z * s.ux);
    return t > 0 && t < s.largo + 0.2 && d < ANCHO / 2;
  });
  const dentro = (x, z) => {
    if (Math.abs(x) > W / 2 - 0.15 || Math.abs(z) > D / 2 - 0.15) return 0;
    const rr = Math.hypot(x, z);
    if (rr < 0.75) return 0;   // el tronco
    if (rr < RC) return 1;
    return enSendero(x, z) ? 1 : 0;
  };
  lajasIrregulares(K, c, r, dentro, -W / 2, W / 2, -D / 2, D / 2);
  // todo el lote sin helechos ni pasto alto (césped de plaza: el prado pintado del terreno)
  K.plataforma(0, 0, W, D, 0.02, 0.1);
  K.pisos.push({ lx: 0, lz: 0, largo: W, ancho: D });
  // lo pisado: el redondel y los senderos (ahí no sale pasto; entre senderos queda el prado)
  K.plataforma(0, 0, 2 * RC, 2 * RC, 0.05, 0.12, 0, { radio: RC });
  K.pisos.push({ lx: 0, lz: 0, largo: 2 * RC, ancho: 2 * RC });
  for (const s of rumbos) {
    const L = s.largo - RC + 0.4, m = RC - 0.2 + L / 2, giro = Math.atan2(-s.uz, s.ux);
    K.plataforma(s.ux * m, s.uz * m, L, ANCHO, 0.05, 0.12, giro);
    K.pisos.push({ lx: s.ux * m, lz: s.uz * m, largo: L, ancho: ANCHO, giro });
  }
  // el duende tallado en el centro, mirando a la estación
  troncoDuende(K, 0, 0);
  K.punto('duende', 0, 1.35, Math.PI, 0.05);
  // el anillo de canteros, cortado por los senderos: borde de laja, tierra, matas y flores
  const angulos = rumbos.map((s) => Math.atan2(s.uz, s.ux)).sort((a, b) => a - b);
  const R0 = RC + 0.25, R1 = RC + 1.05, Rm = (R0 + R1) / 2;
  for (let i = 0; i < angulos.length; i++) {
    const a0 = angulos[i], a1 = i + 1 < angulos.length ? angulos[i + 1] : angulos[0] + Math.PI * 2;
    const m0 = a0 + (ANCHO / 2 + 0.15) / R0, m1 = a1 - (ANCHO / 2 + 0.15) / R0;
    if (m1 - m0 < 0.15) continue;
    const n = Math.max(2, Math.round((m1 - m0) * Rm / 0.9));
    for (let k = 0; k < n; k++) {
      const b0 = m0 + (m1 - m0) * k / n, b1 = m0 + (m1 - m0) * (k + 1) / n;
      const P = (rr, a) => [Math.cos(a) * rr, Math.sin(a) * rr];
      for (const rr of [R0, R1]) {
        const [ax, az] = P(rr, b0), [bx, bz] = P(rr, b1);
        viga(c, [ax, 0.08, az], [bx, 0.08, bz], 0.14, 0.18, elegir(r, PALETA_ALDEA.laja), { tipo: 4, bajo: 0.55 });
      }
      const [ax, az] = P(R0, b0), [bx, bz] = P(R0, b1), [cx2, cz2] = P(R1, b1), [dx, dz] = P(R1, b0);
      const kt = tinte('#4a3a2c');
      quad(c, [dx, 0.13, dz], [cx2, 0.13, cz2], [bx, 0.13, bz], [ax, 0.13, az], kt, kt, escalar(kt, 0.85), escalar(kt, 0.85), 0);
      const [mx, mz] = P(Rm, (b0 + b1) / 2);
      bulto(K.fol, [mx, 0.27, mz], 0.3, elegir(r, ['#46613a', '#3d5634', '#55703f']), { tipo: 1, detalle: 0, abollar: 0.03, esferica: 1, variar: 0.03, esc: [1.25, 0.62, 1.25], rot: [0, (b0 + b1) / 2, 0], bajo: 0.5, alto: 1.15 });
      const flor = elegir(r, ['#7a5aa8', '#c46a9a', '#e0d0e8', '#e8b030', '#f0ece0']);
      // flores de disco (margaritas, amancay, malvas) sobre la mata
      for (let f = 0; f < 5; f++) {
        const [fx, fz] = P(Rm + (r() - 0.5) * 0.5, b0 + (b1 - b0) * (0.1 + 0.2 * f));
        const fy = 0.34 + r() * 0.1, rf = 0.05 + r() * 0.03, kf = tinte(r() < 0.5 ? flor : elegir(r, ['#f0ece0', '#e8b030', '#c46a9a'])), kc = tinte('#c89a2a');
        for (let q = 0; q < 6; q++) {
          const a0 = q * 1.047, a1 = a0 + 1.047;
          tri(K.fol, [fx, fy + 0.01, fz], [fx + Math.cos(a1) * rf, fy, fz + Math.sin(a1) * rf], [fx + Math.cos(a0) * rf, fy, fz + Math.sin(a0) * rf], kc, kf, kf, 3);
        }
      }
      const [sx0, sz0] = P(Rm, b0), [sx1, sz1] = P(Rm, b1);
      K.segmento(sx0, sz0, sx1, sz1, 0.42, 0, 0.42);
    }
  }
  // bancos en el borde del redondel, mirando al duende
  const estar = [];
  angulos.slice(0, 8).forEach((a0, i) => {
    if (i % 2) return;   // en cuatro de los ocho tramos
    const a1 = angulos[i + 1] ?? angulos[0] + Math.PI * 2, am = (a0 + a1) / 2, rr = RC - 0.45;
    const x = Math.cos(am) * rr, z = Math.sin(am) * rr, giro = Math.atan2(-x, -z);
    banco(K, c, x, z, giro, { largo: 1.5, color: '#6e5036', patas: '#2f2c2a', nombre: 'un banco de la plaza', tipo: 0 });
    for (const s of [-0.38, 0.38]) { const F = marcoLocal(x, z, giro); const p = F.p(s, 0, 0.72); estar.push({ lx: p[0], ly: 0.05, lz: p[2], mira: giro + Math.PI }); }
  });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.13; estar.push({ lx: Math.cos(a) * 1.65, ly: 0.05, lz: Math.sin(a) * 1.65, mira: Math.atan2(-Math.cos(a), -Math.sin(a)) }); }
  K.extra.estar = estar.slice(0, 20);
  // faroles junto a los senderos (a un costado, sin cortar el paso)
  for (const s of rumbos.slice(4)) {
    const t = RC + 2.6, px = s.ux * t - s.uz * (ANCHO / 2 + 0.35), pz = s.uz * t + s.ux * (ANCHO / 2 + 0.35);
    farol(K, px, pz, { alto: 3.1 });
  }
  for (const sx of [-1, 1]) farol(K, sx * (ANCHO / 2 + 0.35), D / 2 - 1.0, { alto: 3.1 });
  // el mástil con la bandera, del lado de la estación
  mastil(K, -2.9, D / 2 - 1.5, { alto: 8.0, giro: 0.3 });
  K.punto('mastil', -2.9, D / 2 - 0.25, Math.PI, 0.03);
  // el aljibe viejo y el sube y baja, en el pasto entre senderos
  aljibe(K, -7.0, -2.3);
  const Fs = marcoLocal(7.1, -2.6, 0.25);
  cj(c, Fs, 0, 0.45, 0, 0.3, 0.9, 0.3, '#5a4636', { tipo: 0 });
  cj(c, Fs, 0, 0.75, 0, 3.2, 0.1, 0.3, '#8a5236', { tipo: 0, rz: 0.14 });
  for (const sx of [-1, 1]) cj(c, Fs, sx * 1.35, 0.75 + sx * 0.19 + 0.12, 0, 0.06, 0.28, 0.3, '#2f2c2a', { tipo: 4 });
  K.circulo(7.1, -2.6, 0.3, 0, 0.9);
  K.extra.juego = [[6.1, -1.9], [8.3, -3.1], [7.2, -1.5], [7.4, -3.7]].map(([x, z]) => ({ lx: x, ly: 0.03, lz: z, mira: Math.atan2(7.1 - x, -2.6 - z) }));
  // dos álamos en la plaza (el resto, en `extra.alamos`, para el mundo)
  alamo(K, -7.4, 3.6, { semilla: 3, alto: 12.5, sinLod: true });
  alamo(K, 7.4, 3.6, { semilla: 4, alto: 13.2, sinLod: true });
  cartel(K, 'Plaza de los Duendes', [5.4, 1.25, D / 2 + 0.6], 2.2, 0.42, 0, { dosCaras: true });
  for (const l of [-1, 1]) { palo(c, [5.4 + l * 1.0, -0.2, D / 2 + 0.6], [5.4 + l * 1.0, 1.55, D / 2 + 0.6], 0.07, '#4e3a28'); K.circulo(5.4 + l * 1.0, D / 2 + 0.6, 0.08, 0, 1.6); }
  K.abarcar(-W / 2, W / 2, -D / 2, D / 2 + 1.0);
  K.punto('musico', 1.25, 1.15, Math.PI * 0.75, 0.05);
  K.extra.alamos = [[-W / 2 - 1.5, -D / 2 + 1], [-W / 2 - 1.5, 3.5], [W / 2 + 1.5, -D / 2 + 1], [W / 2 + 1.5, 3.5], [-4.5, -D / 2 - 1.5], [4.5, -D / 2 - 1.5]].map(([x, z]) => ({ lx: x, lz: z }));
  K.luz(0, 3.2, 0, { color: 0xffc070, radio: 10, intensidad: 0.6, clase: 'farol', cuarto: 'calle' });
}

// ---------------------------------------------------------------- el lote vacío y la obra
function lote(K) {
  const { W, D } = K, c = K.ext;
  const r = azar(semillaDe(K.id + '|lote'));
  // estacas en las esquinas y a mitad de cada lado, con el hilo tirante
  const puntos = [[-W / 2, -D / 2], [0, -D / 2], [W / 2, -D / 2], [W / 2, 0], [W / 2, D / 2], [0, D / 2], [-W / 2, D / 2], [-W / 2, 0]];
  for (const [x, z] of puntos) {
    caja(c, [x, 0.2, z], [0.06, 0.6, 0.06], '#b88d5c', { tipo: 0, giro: r() });
    caja(c, [x, 0.48, z], [0.07, 0.04, 0.07], '#c8402a', { tipo: 4 });
  }
  for (let i = 0; i < puntos.length; i++) {
    const a = puntos[i], b = puntos[(i + 1) % puntos.length];
    viga(c, [a[0], 0.36, a[1]], [b[0], 0.35, b[1]], 0.008, 0.008, '#e8e0c8', { tipo: 0 });
    // la línea de cal en el suelo
    viga(c, [a[0], 0.015, a[1]], [b[0], 0.015, b[1]], 0.07, 0.02, '#e8e4d8', { tipo: 4 });
  }
  // el cartel "Lote para ..."
  const x = -W / 2 + 1.0, z = D / 2 + 0.9;
  for (const l of [-1, 1]) { palo(c, [x + l * 0.75, -0.2, z], [x + l * 0.75, 1.35, z], 0.05, '#6e5036'); K.circulo(x + l * 0.75, z, 0.07, 0, 1.4); }
  cartel(K, 'Lote para ' + PARA_LOTE[K.id], [x, 1.1, z], 1.6, 0.3, 0, { dosCaras: true, marco: '#6e5036' });
  K.abarcar(-W / 2, W / 2, -D / 2, z + 0.3);
  K.punto('entrada', 0, D / 2 + 1.0, Math.PI, 0);
}
function materialesObra(K) {
  const { W, D, etapa: e } = K;
  pilaTablas(K, W / 2 + 1.4, -D / 4, Math.PI / 2, { capas: e === 1 ? 8 : 4 });
  if (e <= 2) pilaPiedras(K, -W / 2 - 1.3, D / 4, { n: e === 1 ? 11 : 6 });
  carretilla(K, -W / 2 - 1.1, D / 2 + 1.0, 0.6);
  if (e >= 2) caballete(K, W / 2 + 1.3, D / 2 + 0.8, 0.2);
  if (e === 1) for (const [x, z] of [[-W / 2 - 1.0, -D / 4], [-W / 2 - 1.5, -D / 4 + 0.4]]) bolsa(K, x, z, { c: K.ext, y: 0, tipo: 4, color: '#c9c3b5' });
  if (e === 3) andamio(K, -W / 2 - 1.05, -D / 2 + 0.3, D / 2 - 0.3, K.H);
  K.abarcar(-W / 2 - 2.0, W / 2 + 2.0, -D / 2, D / 2 + 1.5);
}

// ---------------------------------------------------------------- los nombres de los puntos (los del núcleo)
// aldea.js nombra: en cada casa y local `puerta`, `adentro`, `trabajo`, `cama`; en la plaza `estar-k`,
// `juego-k`, `musico`, `mastil`, `duende`; en la escuela `pupitre-k`; en la biblioteca `lectura-1..12`, `adentro` (el mostrador) y
// `cuentos`; en el salón `escenario` y `lugar-k`; en los lotes `obra-1..4`. Acá quedan
// en `puntos.nombrados`, en local, apoyados en lo que se armó.
function nombrar(K) {
  const N = {}, P = K.puntos;
  const copia = (p) => (p ? { lx: +p.lx.toFixed(3), ly: +p.ly.toFixed(3), lz: +p.lz.toFixed(3), mira: +(p.mira ?? 0).toFixed(3) } : null);
  if (K.id === 'plaza') {
    K.extra.estar.forEach((p, i) => { N['estar-' + (i + 1)] = copia(p); });
    K.extra.juego.forEach((p, i) => { N['juego-' + (i + 1)] = copia(p); });
    N.musico = copia(P.musico); N.mastil = copia(P.mastil); N.duende = copia(P.duende);
    return N;
  }
  if (P.entrada) N.puerta = copia(P.entrada);
  if (P.adentro) N.adentro = copia(P.adentro);
  const trabajo = P.trabajo[0] || P.atiende || P.cocina || P.pizarron;
  if (trabajo) N.trabajo = copia(trabajo);
  if (P.cama) N.cama = copia(P.cama);
  const asientos = (nombre) => P.asientos.filter((a) => a.nombre === nombre);
  if (K.id === 'biblioteca') {
    asientos('una silla de lectura').slice(0, 12).forEach((a, i) => { N['lectura-' + (i + 1)] = copia(a); });
    if (P.cliente) N.adentro = copia(P.cliente);
    const s = P.asientos.find((a) => a.nombre === 'el sillón de los cuentos');
    if (s) N.cuentos = copia(s);
  }
  if (K.id === 'escuela') asientos('un pupitre').slice(0, 8).forEach((a, i) => { N['pupitre-' + (i + 1)] = copia(a); });
  if (K.id === 'salon') {
    const e = P.trabajo.find((t) => t.nombre === 'escenario');
    if (e) N.escenario = copia(e);
    asientos('una silla del salón').slice(0, 8).forEach((a, i) => { N['lugar-' + (i + 1)] = copia(a); });
  }
  if (K.id === 'casa-familia') N['cama-chicos'] = { lx: K.W / 2 - MURO - 1.2, ly: PISO, lz: -K.D / 2 + MURO + 1.0, mira: Math.PI / 2 };
  if (EDIFICIOS_ALDEA[K.id]?.lote && K.etapa < 4) {
    const { W, D } = K;
    [[0, D / 2 + 0.8, Math.PI], [W / 2 + 0.8, 0, -Math.PI / 2], [0, -D / 2 - 0.8, 0], [-W / 2 - 0.8, 0, Math.PI / 2]]
      .forEach(([x, z, m], i) => { N['obra-' + (i + 1)] = { lx: x, ly: 0, lz: z, mira: m }; });
  }
  return N;
}

// ---------------------------------------------------------------- armar
const PLANOS_ALDEA = {
  biblioteca, escuela, 'casa-jefe': casaJefe, 'casa-ercilia': casaErcilia, 'casa-nelida': casaNelida,
  'casa-abuela': casaAbuela, 'casa-familia': casaFamilia, panaderia, herreria, carpinteria, pescaderia,
  'puesto-sanitario': puestoSanitario, estafeta, hilanderia, 'sala-miel': salaMiel, seccional, salon,
};

function geometriaCarteles(car) {
  if (!car.pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(car.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(car.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(car.uv, 2));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}
const geoDe = (c) => (c.pos.length ? c.geometria() : null);
const tris = (g) => (g ? g.attributes.position.count / 3 : 0);

function cerrar(K, extra = {}) {
  const exterior = { estructura: geoDe(K.ext), vidrios: geoDe(K.vid), carteles: geometriaCarteles(K.car), follaje: geoDe(K.fol), ...(extra.exterior || {}) };
  const interior = { muebles: geoDe(K.int), brasas: geoDe(K.bra) };
  const redondo = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'number' ? +v.toFixed(4) : v)));
  const puntos = { ...K.puntos, nombrados: nombrar(K) };
  return {
    id: K.id, etapa: K.etapa, nombre: K.def.nombre, ancho: K.W, fondo: K.D, alturaPiso: K.id === 'plaza' ? 0 : PISO,
    ocupa: { ...K.ocupa },
    exterior, interior,
    colisiones: { obstaculos: redondo(K.obst), plataformas: redondo(K.plat.map(({ cos, sin, ...p }) => p)) },
    puertas: K.puertas, luces: K.luces, ventanas: K.ventanas, puntos,
    chimenea: K.chimenea, chimeneas: K.extra.chimeneas ?? (K.chimenea ? [K.chimenea] : []), humo: K.extra.humo ?? null,
    techo: K.techo, pisos: K.pisos, carteles: K.carteles,
    extra: { campana: K.extra.campana ?? null, bandera: K.extra.bandera ?? null, alamos: K.extra.alamos ?? null, cables: K.extra.cables ?? null },
    medidas: {
      triangulos: { exterior: Object.values(exterior).reduce((s, g) => s + tris(g), 0), interior: Object.values(interior).reduce((s, g) => s + tris(g), 0) },
      dibujos: { exterior: Object.values(exterior).filter(Boolean).length, interior: Object.values(interior).filter(Boolean).length },
    },
  };
}

export function armarEdificio(id, etapa = 4, opciones = {}) {
  const def = EDIFICIOS_ALDEA[id];
  if (!def) throw new Error('aldea-arquitectura: no conozco el edificio ' + id);
  let e = Math.max(0, Math.min(4, Math.round(Number(etapa))));
  if (!Number.isFinite(e)) e = 4;
  if (!def.lote) e = 4;                       // los iniciales (y la plaza) existen terminados
  const K = crearContexto(id, e, opciones, def);
  if (id === 'plaza') plaza(K);
  else if (e === 0) lote(K);
  else {
    PLANOS_ALDEA[id](K);
    const medioHacer = id === 'escuela' && e === ESCUELA_A_MEDIO_HACER && !opciones.obraActiva;
    if (e <= 3 && !opciones.sinMateriales && !medioHacer) materialesObra(K);
  }
  return cerrar(K);
}

// ---------------------------------------------------------------- accesorios sueltos de la aldea
// Un álamo piramidal (Populus nigra 'Italica', el cortaviento de la Patagonia): copa densa, alta y
// angosta. 3.6 (pulido): un huso liso hace de masa y encima van racimos chicos de hojas; todos se
// sombrean como una sola columna (la normal sale del eje del árbol, no de cada racimo), así no
// quedan "bollos": la silueta se quiebra en hojas y la luz corre pareja. Hojas con aTipo 2 (caen en
// invierno: quedan el tronco y las ramas que suben pegadas al eje).
function triN(c, p, n, k, tipo) {
  for (let i = 0; i < 3; i++) { c.pos.push(p[i][0], p[i][1], p[i][2]); c.nor.push(n[i][0], n[i][1], n[i][2]); c.col.push(k[i].r, k[i].g, k[i].b); c.tipo.push(tipo); }
}
const ICOSA = (() => { const g = new THREE.IcosahedronGeometry(1, 0); const a = Array.from(g.attributes.position.array); g.dispose(); return a; })();
function alamo(K, x0, z0, o) {
  const c = K.ext, fol = K.fol;
  const r = azar(semillaDe('alamo|' + (o.semilla ?? 0)));
  const alto = o.alto ?? entre(r, 13, 17);
  const yB = 1.7, yT = alto, Rmax = alto * 0.105;
  // tronco y ramas que suben pegadas al eje (lo único que queda en invierno)
  palo(c, [x0, -0.3, z0], [x0 + 0.05, alto * 0.82, z0 + 0.03], 0.26, '#6f6658', { lados: 8, punta: 0.25, abierto: false });
  for (let i = 0; i < 9; i++) {
    const y = 1.8 + i * alto * 0.075, a = r() * 6.28;
    palo(c, [x0, y, z0], [x0 + Math.cos(a) * 0.55, y + alto * 0.18, z0 + Math.sin(a) * 0.55], 0.05, '#6f6658', { lados: 5, punta: 0.3 });
  }
  const R = (t) => Rmax * Math.pow(Math.max(0, Math.sin(Math.PI * (0.06 + 0.94 * t))), 0.55) * (1.08 - 0.5 * t);
  const oscuro = tinte('#253a24'), claro = tinte('#5f7a3c'), sol = tinte('#8e9048');
  // el color sale sólo de la posición (altura, lado y una pincelada), nunca del racimo: sin contornos
  const colorEn = (t, afuera, arriba, P = null) => {
    const pn = P ? pincel(P[0] * 1.3, P[1] * 0.8, P[2] * 1.3, 4.1) : 0.5;
    let k = mezclar(oscuro, claro, Math.min(1, Math.max(0, 0.1 + 0.55 * t + 0.25 * afuera + 0.35 * (pn - 0.5))));
    if (P) { const lado = Math.max(0, ((P[0] - x0) * 0.6 + (P[2] - z0) * 0.5) / Math.max(0.3, R(t))); k = mezclar(k, sol, Math.min(0.25, lado * 0.15 + arriba * 0.08)); }
    return k;
  };
  const normal = (x, y, z) => {
    const t = (y - yB) / (yT - yB);
    let nx = x - x0, nz = z - z0;
    const l = Math.hypot(nx, nz) || 1;
    const ny = 0.25 + 0.6 * Math.max(0, t - 0.75) * 4;
    const m = Math.hypot(nx / l, ny, nz / l);
    return [nx / l / m, ny / m, nz / l / m];
  };
  // el huso: 8 lados × 8 filas, normales al eje
  const lados = 8, filas = 8;
  const anillo = (j) => {
    const t = j / filas, y = yB + t * (yT - yB), rr = R(t) * 0.82;
    const pts = [];
    for (let i = 0; i <= lados; i++) {
      const a = (i / lados) * 6.283 + j * 0.3;
      pts.push([x0 + Math.cos(a) * rr, y, z0 + Math.sin(a) * rr]);
    }
    return { pts, t };
  };
  let prev = anillo(0);
  for (let j = 1; j <= filas; j++) {
    const cur = anillo(j);
    for (let i = 0; i < lados; i++) {
      const a = prev.pts[i], b = prev.pts[i + 1], d = cur.pts[i + 1], e = cur.pts[i];
      const K3 = (p, tt) => colorEn(tt, 0.8, 0, p);
      triN(fol, [a, d, b], [normal(...a), normal(...d), normal(...b)], [K3(a, prev.t), K3(d, cur.t), K3(b, prev.t)], 2);
      triN(fol, [a, e, d], [normal(...a), normal(...e), normal(...d)], [K3(a, prev.t), K3(e, cur.t), K3(d, cur.t)], 2);
    }
    prev = cur;
  }
  // los racimos sobre el huso
  const n = o.racimos ?? 56;
  for (let i = 0; i < n; i++) {
    const t = Math.pow(r(), 0.85) * 0.97, y = yB + 0.2 + t * (yT - yB - 0.4), a = i * 2.39996 + r() * 0.6;
    const rr = R(t) * entre(r, 0.78, 1.0), s = entre(r, 0.26, 0.46) * (1.05 - 0.45 * t);
    const cx = x0 + Math.cos(a) * rr, cz = z0 + Math.sin(a) * rr;
    const tilt = r() * 6.28;
    for (let v = 0; v < ICOSA.length; v += 9) {
      const p = [], nn = [], k = [];
      for (let w = 0; w < 3; w++) {
        const ix = ICOSA[v + w * 3], iy = ICOSA[v + w * 3 + 1], iz = ICOSA[v + w * 3 + 2];
        const qx = ix * Math.cos(tilt) - iz * Math.sin(tilt), qz = ix * Math.sin(tilt) + iz * Math.cos(tilt);
        const P = [cx + qx * s, y + iy * s * 1.7, cz + qz * s];
        p.push(P); nn.push(normal(...P));
        k.push(colorEn((P[1] - yB) / (yT - yB), 0.8, Math.max(0, iy) * 0.3, P));
      }
      triN(fol, p, nn, k, 2);
    }
  }
  K.circulo(x0, z0, 0.32, -0.3, alto);
  if (o.sinLod) return;
  // el LOD barato: un tronco y dos husos
  const lt = new Constructor(), lf = new Constructor();
  palo(lt, [0, -0.3, 0], [0, alto * 0.5, 0], 0.26, '#6f6658', { lados: 5, punta: 0.5, abierto: true });
  for (const [y, rad, sy] of [[alto * 0.38, 1.4, 3.3], [alto * 0.72, 0.95, 2.6]]) {
    const g = new THREE.IcosahedronGeometry(rad, 0);
    lf.agregar(g, { tipo: 2, variar: 0.06, esferica: 0.8, degradado: [lin('#3a5532'), lin('#748f44')], matriz: matriz([0, y, 0], [0, 0, 0], [1, sy, 1]) });
    g.dispose();
  }
  K.extra.alamo = { lod: { estructura: lt.geometria(), follaje: lf.geometria() }, alto };
}
export function armarAccesorio(nombre, o = {}) {
  const largo = o.largo ?? 4;
  const tam = { faroles: [1, 1], banco: [1.8, 0.6], cerco: [largo, 0.4], pirca: [largo, 0.8], alamo: [3, 3], lena: [1.6, 0.8], tendedero: [3.4, 0.6],
    vereda: [largo, o.ancho ?? 1.2], 'poste-luz': [1.6, 1.2], mastil: [1.4, 1.4], cantero: [o.largo ?? 2.4, o.ancho ?? 1.2] }[nombre];
  if (!tam) throw new Error('aldea-arquitectura: no conozco el accesorio ' + nombre);
  const K = crearContexto('accesorio-' + nombre + '-' + (o.semilla ?? 0), 4, o, { ancho: tam[0], fondo: tam[1], nombre });
  switch (nombre) {
    case 'faroles': farol(K, 0, 0, { alto: o.alto ?? 3.0 }); break;
    case 'banco': banco(K, K.ext, 0, 0, 0, { largo: o.largo ?? 1.7, color: '#6e5036', patas: '#3a3734', tipo: 0 }); break;
    case 'cerco': cerco(K, -largo / 2, 0, largo / 2, 0, { tipo: o.tipo ?? 'varas' }); break;
    case 'pirca': pirca(K, -largo / 2, 0, largo / 2, 0, { alto: o.alto ?? 0.75 }); break;
    case 'alamo': alamo(K, 0, 0, o); break;
    case 'lena': pilaLena(K, 0, 0, 0, { largo: o.largo ?? 1.6, filas: o.filas ?? 5, techito: o.techito ?? true }); break;
    case 'tendedero': tendedero(K, 0, 0, 0, { largo: o.largo ?? 3.2 }); break;
    case 'vereda': vereda(K, -largo / 2, 0, largo / 2, 0, { ancho: o.ancho ?? 1.2 }); break;
    case 'poste-luz': posteLuz(K, 0, 0); break;
    case 'mastil': mastil(K, 0, 0, { alto: o.alto ?? 7.5 }); break;
    case 'cantero': cantero(K, 0, 0, { largo: o.largo ?? 2.4, ancho: o.ancho ?? 1.2 }); break;
    default: break;
  }
  K.ocupa = { x0: -tam[0] / 2, x1: tam[0] / 2, z0: -tam[1] / 2, z1: tam[1] / 2 };
  const res = cerrar(K);
  if (nombre === 'alamo') { res.lod = K.extra.alamo.lod; res.alto = K.extra.alamo.alto; }
  return res;
}

// ---------------------------------------------------------------- la parada del sur: Estación Aldea de los Duendes
// En el marco de construirParada (trochita.js): x a lo largo de la vía, z alejándose de ella, y = 0 el
// riel. La parada chica ocupa x ∈ [−4,5; 4,5] (andén de z 1,15 a 4,75), su galponcito z 4,5..7,5 y
// los escalones de las puntas hasta |x| ≈ 7,7. Lo nuevo queda afuera de todo eso.
export function armarAgregadoEstacion(opciones = {}) {
  const piezas = [];
  // el galpón de cargas chico (su frente, +Z propio, mira a la vía: giro π)
  {
    const K = crearContexto('galpon-cargas', 4, opciones, { ancho: 3.6, fondo: 2.8, nombre: 'Galpón de cargas' });
    casco(K, {
      eje: 'x', estilo: 'vertical', color: PALETA_ALDEA.pared.rojo, colorTecho: PALETA_ALDEA.techo.gris, postigo: null, alzada: 1.0, cielo: false, colorPiso: '#6e5a44',
      puertas: [{ cara: 'frente', x: 0, ancho: 1.6, alto: 2.2, abierta: true }], ventanas: [{ cara: 'der', z: 0, ancho: 0.6, alto: 0.6, y: 1.7, postigos: false }],
      canaleta: false,
    });
    cartel(K, 'Cargas', [0, PISO + 2.45, K.D / 2 + 0.04], 1.2, 0.26, 0);
    for (let i = 0; i < 3; i++) caja(K.int, [-1.1 + i * 0.5, PISO + 0.22, -0.8], [0.45, 0.44, 0.45], i % 2 ? '#8a6a46' : '#7d5f3f', { giro: i * 0.2 });
    bolsa(K, 1.0, -0.8, {}); bolsa(K, 1.2, -0.3, { color: '#bfb08a' });
    K.mueble(-0.6, -0.8, 1.5, 0.5, 0.45); K.mueble(1.1, -0.55, 0.6, 0.9, 0.7);
    lampara(K, 0, 0, { color: '#3a3734', radio: 5 });
    piezas.push({ id: 'galpon-cargas', lx: -7.2, lz: 7.8, giro: Math.PI, edificio: cerrar(K) });
  }
  // el cartel grande, con un duendecito tallado arriba
  {
    const K = crearContexto('cartel-aldea', 4, opciones, { ancho: 3.8, fondo: 0.6, nombre: 'Aldea de los Duendes' });
    for (const l of [-1, 1]) { palo(K.ext, [l * 1.7, -0.3, 0], [l * 1.7, 2.75, 0], 0.09, '#4e3a28', { lados: 7 }); K.circulo(l * 1.7, 0, 0.1, 0, 2.8); }
    cartel(K, 'Aldea de los Duendes', [0, 2.15, 0], 3.2, 0.62, 0, { dosCaras: true, marco: '#3e2f22' });
    viga(K.ext, [-1.85, 2.55, 0], [1.85, 2.55, 0], 0.12, 0.08, '#3e2f22');
    tallaDuende(K, K.ext, 1.55, 2.6, 0.02, 0.2, 0.55, { madera: '#8a6440' });
    piezas.push({ id: 'cartel-aldea', lx: 6.8, lz: 6.4, giro: Math.PI, edificio: cerrar(K) });
  }
  piezas.push({ id: 'farol-1', lx: -3.4, lz: 5.4, giro: 0, edificio: armarAccesorio('faroles', { semilla: 1 }) });
  piezas.push({ id: 'farol-2', lx: 3.4, lz: 5.4, giro: 0, edificio: armarAccesorio('faroles', { semilla: 2 }) });
  piezas.push({ id: 'farol-3', lx: -5.2, lz: 6.2, giro: 0, edificio: armarAccesorio('faroles', { semilla: 3 }) });
  piezas.push({ id: 'banco', lx: 4.9, lz: 6.3, giro: Math.PI, edificio: armarAccesorio('banco', { semilla: 4 }) });
  return { piezas };
}

// ---------------------------------------------------------------- al mundo (para el equipo de mundo)
export function aMundoAldea(sitio, lx, ly, lz) {
  const rot = Number(sitio.rot) || 0, c = Math.cos(rot), s = Math.sin(rot);
  return { x: sitio.x + lx * c + lz * s, y: (Number(sitio.y) || 0) + ly, z: sitio.z - lx * s + lz * c };
}
// Da de alta las colisiones (con `duenio`, para poder sacarlas) y las puertas de un edificio.
export function registrarEnMundo({ col, puertas = null }, edificio, sitio, { duenio = null } = {}) {
  const rot = Number(sitio.rot) || 0, y = Number(sitio.y) || 0;
  const w = (lx, lz) => aMundoAldea(sitio, lx, 0, lz);
  const salida = { obstaculos: [], plataformas: [], puertas: [] };
  for (const o of edificio.colisiones.obstaculos) {
    const n = { ...o, alturaMin: o.alturaMin + y, alturaMax: o.alturaMax + y, ...(duenio ? { duenio } : {}) };
    if (o.seg) { const a = w(o.ax, o.az), b = w(o.bx, o.bz); n.ax = a.x; n.az = a.z; n.bx = b.x; n.bz = b.z; } else { const p = w(o.x, o.z); n.x = p.x; n.z = p.z; }
    col.agregar(n); salida.obstaculos.push(n);
  }
  for (const p of edificio.colisiones.plataformas) {
    const q = w(p.x, p.z);
    const n = { ...p, x: q.x, z: q.z, alto: p.alto + y, ...(p.radio === undefined ? { ang: (p.ang || 0) - rot } : {}), ...(duenio ? { duenio } : {}) };
    col.agregarPlataforma(n); salida.plataformas.push(n);
  }
  if (puertas) for (const d of edificio.puertas) {
    salida.puertas.push(puertas.agregar({ sitio: { x: sitio.x, z: sitio.z, y, piso: d.piso }, rot, lx: d.lx, lz: d.lz, ancho: d.ancho, alto: d.alto, lado: d.lado, adentro: d.adentro, nombre: d.nombre, duenio }));
  }
  return salida;
}
// Las mallas de un edificio (materiales compartidos: { estructura, follaje, vidrio, carteles, brasas }).
export function montarEdificio(edificio, mats = {}) {
  const vidrio = mats.vidrio ?? new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: 0x23201b });
  const brasas = mats.brasas ?? new THREE.MeshBasicMaterial({ vertexColors: true });
  const material = { estructura: mats.estructura, follaje: mats.follaje ?? mats.estructura, vidrios: vidrio, carteles: mats.carteles, muebles: mats.estructura, brasas };
  const armar = (capa) => {
    const g = new THREE.Group();
    for (const [k, geo] of Object.entries(capa)) {
      if (!geo || !material[k]) continue;
      const m = new THREE.Mesh(geo, material[k]);
      m.castShadow = k === 'estructura' || k === 'follaje' || k === 'muebles';
      m.receiveShadow = k !== 'vidrios' && k !== 'brasas';
      g.add(m);
    }
    return g;
  };
  return { exterior: armar(edificio.exterior), interior: armar(edificio.interior), vidrio };
}
// Junta muchos edificios en una geometría por material (una manzana, una sola pieza): lista de
// { edificio, sitio } con el sitio relativo a `origen` (el centro de la manzana).
export function fusionarAldea(lista, capa = 'exterior', origen = { x: 0, y: 0, z: 0 }) {
  const salida = {};
  const juntar = {};
  for (const { edificio, sitio } of lista) {
    const rot = Number(sitio.rot) || 0, c = Math.cos(rot), s = Math.sin(rot);
    const ox = sitio.x - origen.x, oy = (sitio.y || 0) - (origen.y || 0), oz = sitio.z - origen.z;
    for (const [k, g] of Object.entries(edificio[capa] || {})) {
      if (!g) continue;
      const J = (juntar[k] ??= { pos: [], nor: [], otros: {} });
      const p = g.attributes.position.array, n = g.attributes.normal.array;
      for (let i = 0; i < p.length; i += 3) {
        J.pos.push(ox + p[i] * c + p[i + 2] * s, oy + p[i + 1], oz - p[i] * s + p[i + 2] * c);
        J.nor.push(n[i] * c + n[i + 2] * s, n[i + 1], -n[i] * s + n[i + 2] * c);
      }
      for (const a of Object.keys(g.attributes)) {
        if (a === 'position' || a === 'normal') continue;
        (J.otros[a] ??= { tam: g.attributes[a].itemSize, datos: [] }).datos.push(...g.attributes[a].array);
      }
    }
  }
  for (const [k, J] of Object.entries(juntar)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(J.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(J.nor, 3));
    for (const [a, o] of Object.entries(J.otros)) g.setAttribute(a, new THREE.Float32BufferAttribute(o.datos, o.tam));
    g.computeBoundingSphere(); g.computeBoundingBox();
    salida[k] = g;
  }
  return salida;
}
