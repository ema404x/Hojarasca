// 4.9 defensas: lo roto queda a la vista (reglas puras, se prueban en Node).
//
// Una defensa dañada casi no se notaba hasta que caía. Ahora, según la vida que le queda (`vidaMaxObra` y `vidaDe` en
// desafio.js), muestra marcas de garras, tablas torcidas o caídas, un hueco donde faltan tablas, madera astillada y
// piedras caídas al pie, y una leve inclinación del conjunto (el portón, fuera de eje). Al repararla vuelve a lo normal.
//
// Tres estados: 0 sana (no se dibuja nada), 1 dañada, 2 rota. Acá están los números y la lista de piezas de cada estado
// (posición, giro y tamaño en el sistema de la obra: x a lo ancho, y arriba, z a lo fondo; el frente mira a -z);
// desafio-roto-mundo.js las junta en una sola malla (material tipo 0 de madera o 4 de piedra) y la cuelga de la obra.

export const ROTO = {
  danada: 0.7,       // menos de esto de la vida: estado 1
  rota: 0.35,        // menos de esto: estado 2
  cada: 0.6,         // cada cuántos segundos se mira el estado de las obras
  tope: 36,          // piezas como mucho por obra (una malla chica)
};
// Las cinco formas en que se rompe algo (la madera y la piedra de la obra deciden los colores)
export const FORMAS = ['pared', 'porton', 'torre', 'bajo', 'maquina'];

// El estado de rotura según la vida: 0 sana, 1 dañada, 2 rota.
export function estadoRotura(vida, max) {
  const v = Number(vida), m = Number(max);
  if (!(m > 0) || !Number.isFinite(v)) return 0;
  const f = v / m;
  return f < ROTO.rota ? 2 : f < ROTO.danada ? 1 : 0;
}

// Las trampas que se gastan de a poco (las estacas, la red, el barril) no se ven rotas: se desgastan, no se astillan.
const SE_GASTAN = ['estacas', 'red', 'barril', 'foso', 'pozo', 'abrojos', 'lazo', 'miel', 'zanja'];
// ¿Esta obra se dibuja rota? Las trampas bajas y ocultas no (el lazo, los abrojos, el foso, la miel), ni lo que se pisa.
export function seRompe(plano) {
  if (!plano || plano.categoria !== 'defensa') return false;
  const d = plano.defensa || {};
  if (d.oculta || d.sinCuerpo || SE_GASTAN.includes(d.tipo)) return false;
  return (plano.alto || 0) >= 0.9;
}
// La forma de la obra: una pared (o pirca), un portón, una torre, algo bajo o una máquina (ballesta, catapulta…).
export function formaDe(plano) {
  const ancho = plano?.ancho || 1, fondo = plano?.fondo || 1, alto = plano?.alto || 1;
  if (plano?.porton) return 'porton';
  if (alto >= 3.2) return 'torre';
  if (ancho >= 2 * fondo && fondo <= 1.1) return 'pared';
  if (alto <= 1.4) return 'bajo';
  return 'maquina';
}
// ¿De piedra? (las piedras caídas y las grietas, en vez de tablas y garras): la misma cuenta que usa desafio.js para las chispas.
export function esDePiedra(plano) {
  let p = 0, m = 0;
  for (const e of plano?.etapas || []) { p += e.pide?.piedra || 0; m += (e.pide?.tronco || 0) + (e.pide?.tabla || 0); }
  return p > m;
}

// Un número entre 0 y 1 que siempre sale igual para la misma obra y el mismo `k` (las marcas no bailan cuando se vuelve a mirar).
export function azarDe(semilla, k) {
  let h = (Math.imul(Math.floor(semilla) | 0, 2654435761) ^ Math.imul((k | 0) + 1, 40503)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// La semilla de una obra: de dónde está (redondeado al decímetro), para que no cambie al moverla un pelo ni al guardar.
export function semillaDe(datos) {
  return (Math.round((Number(datos?.x) || 0) * 10) * 7919 + Math.round((Number(datos?.z) || 0) * 10) * 104729) | 0;
}

// Cuánto se inclina el conjunto (radianes alrededor de x, y, z). Muy poco: la colisión no se mueve, sólo la vista.
export function inclinacion(plano, estado, semilla) {
  if (estado <= 0) return { x: 0, y: 0, z: 0 };
  const forma = formaDe(plano), lado = azarDe(semilla, 91) < 0.5 ? -1 : 1, k = estado === 2 ? 1 : 0.45;
  if (forma === 'porton') return { x: lado * 0.03 * k, y: lado * 0.1 * k, z: -lado * 0.025 * k };   // fuera de eje
  if (forma === 'pared') return { x: lado * 0.045 * k, y: 0, z: 0 };   // se viene hacia un costado
  if (forma === 'torre') return { x: lado * 0.02 * k, y: 0, z: -lado * 0.015 * k };
  return { x: 0, y: 0, z: lado * 0.02 * k };
}

// ---------------------------------------------------------------- las piezas
// Cada pieza: { t: 'caja' | 'cono' | 'piedra', p: [x, y, z], r: [rx, ry, rz], e: [ex, ey, ez], color, tipo }.
// `caja` mide e (ancho, alto, fondo); `cono` tiene radio e[0] y alto e[1]; `piedra` es un icosaedro de radio e[0] aplastado por e[1] y e[2].
// las garras dejan surcos claros (la madera fresca, la piedra raspada) sobre lo oscuro de la obra: se leen de lejos
const GARRA = '#d2b57e', GARRA_PIEDRA = '#aaa69c', ASTILLA = '#cfae74', HUECO = '#2a1d13', HUECO_PIEDRA = '#2b2926', MADERA = '#7a5c3c', TABLA = '#8a6b4a', PIEDRA = '#7d766c', PIEDRA_2 = '#6c665d';

// Las marcas de las garras: tres rayas casi paralelas, en el frente (z negativa) o en el fondo de la obra
function garras(P, semilla, k, lado, alturaMax, pieza) {
  const hx = Math.max(0.3, (P.ancho || 1) / 2 - 0.15), z = (lado < 0 ? -1 : 1) * ((P.fondo || 0.3) / 2 + 0.012);
  const x0 = (azarDe(semilla, 10 + k * 3) * 2 - 1) * hx * 0.8, y0 = 0.35 + azarDe(semilla, 11 + k * 3) * Math.max(0.2, alturaMax - 0.9);
  const giro = -0.35 - azarDe(semilla, 12 + k * 3) * 0.5, largo = 0.45 + azarDe(semilla, 13 + k * 3) * 0.3;
  for (let i = 0; i < 3; i++) {
    pieza.push({ t: 'caja', p: [x0 + i * 0.1, y0 - i * 0.025, z], r: [0, 0, giro], e: [0.034, largo, 0.016], color: pieza.piedra ? GARRA_PIEDRA : GARRA, tipo: pieza.piedra ? 4 : 0 });
  }
}

// La lista de piezas para una obra: `estado` 1 o 2. Siempre la misma para la misma obra (semilla).
export function piezasDe(plano, estado, semilla) {
  const salida = [];
  if (estado <= 0 || !plano) return salida;
  const forma = formaDe(plano), piedra = esDePiedra(plano), alto = Math.max(0.9, plano.alto || 1), ancho = plano.ancho || 1, fondo = plano.fondo || 0.3;
  const tapa = Math.min(alto, 2.4);   // lo que está al alcance de una garra
  salida.piedra = piedra;
  const hx = Math.max(0.3, ancho / 2 - 0.2);
  const colorCaida = piedra ? PIEDRA : TABLA, tipoCaida = piedra ? 4 : 0;
  // --- marcas de garras: dos grupos en el estado 1, cuatro en el 2 (frente y fondo)
  const grupos = estado === 2 ? 5 : 3;
  for (let k = 0; k < grupos; k++) garras(plano, semilla, k, k % 2 ? 1 : -1, tapa, salida);
  // --- una tabla (o una piedra) salida de lugar, torcida, en el borde de arriba: el estado 1 ya la tiene
  {
    const x = (azarDe(semilla, 30) * 2 - 1) * hx, y = Math.min(tapa, alto) - 0.25, lado = azarDe(semilla, 31) < 0.5 ? -1 : 1;
    if (piedra) salida.push({ t: 'piedra', p: [x, y, lado * (fondo / 2 + 0.06)], r: [0.4, azarDe(semilla, 32) * 3, 0.2], e: [0.2, 0.7, 1], color: PIEDRA_2, tipo: 4 });
    else salida.push({ t: 'caja', p: [x, y, lado * (fondo / 2 + 0.05)], r: [lado * 0.3, 0, (azarDe(semilla, 33) - 0.5) * 0.3], e: [0.55, 0.16, 0.05], color: MADERA, tipo: 0 });
  }
  if (estado === 1) {
    // una astilla clara donde pegaron (la madera se ve fresca)
    if (!piedra) salida.push({ t: 'cono', p: [(azarDe(semilla, 40) * 2 - 1) * hx * 0.7, 0.9, -(fondo / 2 + 0.03)], r: [-1.2, 0, 0.3], e: [0.025, 0.3], color: ASTILLA, tipo: 0 });
    return salida.slice(0, ROTO.tope);
  }
  // --- estado 2: un hueco donde faltan tablas, con las astillas alrededor
  {
    const x = (azarDe(semilla, 50) * 2 - 1) * hx * 0.6, y = 0.55 + azarDe(semilla, 51) * Math.max(0.2, tapa - 1.3), lado = azarDe(semilla, 52) < 0.5 ? -1 : 1;
    const z = lado * (fondo / 2 + 0.015);
    // (una tabla que falta: un hueco angosto y alto, no un cuadrado)
    salida.push({ t: 'caja', p: [x, y, z], r: [0, 0, 0.05], e: [0.3, Math.min(0.95, tapa * 0.45), 0.03], color: piedra ? HUECO_PIEDRA : HUECO, tipo: piedra ? 4 : 0 });
    for (let i = 0; i < 4; i++) {
      const a = i * 1.57 + azarDe(semilla, 53 + i) * 0.6;
      salida.push({ t: 'cono', p: [x + Math.cos(a) * 0.3, y + Math.sin(a) * 0.26, z + lado * 0.03], r: [lado * 1.3, 0, a], e: [0.022, 0.2 + azarDe(semilla, 60 + i) * 0.12], color: piedra ? PIEDRA_2 : ASTILLA, tipo: tipoCaida });
    }
  }
  // --- las tablas (o piedras) caídas al pie, hacia el lado de afuera
  const caidas = forma === 'torre' ? 4 : 3;
  for (let i = 0; i < caidas; i++) {
    const x = (azarDe(semilla, 70 + i) * 2 - 1) * hx, z = -(fondo / 2 + 0.25 + azarDe(semilla, 80 + i) * 0.5), giro = (azarDe(semilla, 90 + i) - 0.5) * 2.2;
    if (piedra) salida.push({ t: 'piedra', p: [x, 0.12, z], r: [0.2 * i, giro, 0.15], e: [0.22 + azarDe(semilla, 95 + i) * 0.08, 0.6, 0.9], color: i % 2 ? PIEDRA : PIEDRA_2, tipo: 4 });
    else salida.push({ t: 'caja', p: [x, 0.05 + (i % 2) * 0.05, z], r: [0, giro, (i % 2 ? 0.15 : 0.04)], e: [0.62, 0.05, 0.16], color: i % 2 ? TABLA : MADERA, tipo: 0 });
  }
  // --- un par de tablas torcidas más, colgando del borde de arriba
  if (!piedra) for (let i = 0; i < 2; i++) {
    const x = (azarDe(semilla, 100 + i) * 2 - 1) * hx, lado = i ? 1 : -1;
    salida.push({ t: 'caja', p: [x, Math.min(tapa, alto) - 0.55, lado * (fondo / 2 + 0.08)], r: [lado * (0.5 + azarDe(semilla, 102 + i) * 0.3), 0, (azarDe(semilla, 104 + i) - 0.5) * 0.5], e: [0.5, 0.15, 0.045], color: i ? TABLA : MADERA, tipo: 0 });
  }
  return salida.slice(0, ROTO.tope);
}
