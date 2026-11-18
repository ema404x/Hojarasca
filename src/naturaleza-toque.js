// 4.31.0 (C): la naturaleza que se toca. Las reglas puras (sin three ni DOM) de lo que reacciona al andar y a la E afuera:
// sacudir arbustos y árboles chicos, arrancar pasto y flores, la leña suelta, tocar el agua, el sapito, las piedritas y las
// piñas que se patean, el agua que salpica, las pisadas del ripio, las ramitas que crujen en el bosque, el jugador mojado que
// gotea y las ranas que saltan al agua. Lo visual está en naturaleza-mundo.js y el enganche con el juego en naturaleza-juego.js.
// Todo se prueba en Node (pruebas/verificar-4-31-0-c.mjs).
import { SEMILLA } from './config.js';

export const NATURALEZA = {
  alcanceMata: 2.1,        // metros (del pie a la mata) para sacudirla
  alcanceArbol: 1.6,       // del pie al borde del tronco de un árbol chico
  arbolChico: 0.95,        // escala máxima de un «árbol chico» (los grandes no se sacuden con la mano)
  mira: 0.7,               // cuánto hay que mirar lo que se toca (coseno, en el plano)
  esperaSacudir: 1.4,      // segundos entre dos sacudidas
  pasoMata: 2.6,           // segundos entre dos roces al pasar por la misma mata
  radioRoce: 0.55,         // fracción del radio de la mata que cuenta como «pasar por adentro»
  // el sapito
  saltosMax: 9,
  alcanceOrilla: 2.6,      // metros hasta el agua para tirar una piedra
  aguaLibre: 7,            // metros de agua adelante para que valga el sapito
  alcanceToque: 1.5,       // metros hasta el agua para tocarla agachado
  // la leña suelta
  celdaLena: 16,           // metros de la celda (una pila como mucho por celda)
  probLena: 0.34,
  bosqueLena: 0.55,
  vistaLena: 34,
  alcanceLena: 2.2,
  ramitasLena: 2,
  topeRamitas: 12,
  tomadasMax: 64,
  // las piedritas y las piñas que se patean
  celdaPiedra: 7,
  probPiedra: 0.42,
  vistaPiedra: 15,
  patada: 0.5,             // metros del pie a la piedrita para patearla
  velPatada: 1.1,          // velocidad mínima del jugador
  // el jugador mojado
  secarSeg: 150,           // segundos para secarse del todo al aire
  secarFuego: 4,           // junto al fuego, cuántas veces más rápido
  lluviaMoja: 0.012,       // por segundo, con lluvia fuerte y sin techo
  umbralGoteo: 0.12,
  // las ranas
  ranas: 6,
  radioRanas: 26,
  asustaRana: 3.2,
  asustaRanaCorriendo: 6,
  // las ramitas que crujen en el bosque
  bosqueCruje: 0.6,
  probCruje: 0.16,
  // el pasto que se arranca vuelve a crecer
  horasPasto: 6,
};

// Los arbustos que se sacuden (el tipo de la mata) y cómo se nombran en el aviso
export const ARBUSTOS = { chilco: 'el chilco', notro: 'el notro', maqui: 'el maqui', chaura: 'la chaura', calafate: 'el calafate', neneo: 'el neneo', colihue: 'la caña colihue', nalca: 'la nalca', helecho: 'el helecho', helecho2: 'el helecho', michay: 'el michay', mosqueta: 'la rosa mosqueta', zarza: 'la zarzamora' };
// Los pastos que se arrancan con la mano
export const PASTOS = { coiron: 'un manojo de coirón' };
// (los de tronco fino: una lenga o un coihue, aun jóvenes, tienen el tronco grueso y no se mueven con la mano)
export const ARBOLES_CHICOS = { nire: 'el ñire', maiten: 'el maitén', arrayan: 'el arrayán' };

const finito = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const tiene = (o, k) => !!o && typeof o === 'object' && Object.hasOwn(o, k);

// Lo que se guarda: el récord del sapito, cuántos tiraste y la leña suelta juntada hoy. Una partida vieja no lo trae: vacío.
export function naturalezaVacia() { return { sapitoRecord: 0, sapitos: 0, lena: { dia: 0, tomadas: [] } }; }
export function sanearNaturaleza(v) {
  const n = naturalezaVacia();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return n;
  n.sapitoRecord = Math.max(0, Math.min(NATURALEZA.saltosMax, Math.floor(finito(v.sapitoRecord, 0))));
  n.sapitos = Math.max(0, Math.min(1e6, Math.floor(finito(v.sapitos, 0))));
  const l = tiene(v, 'lena') && v.lena && typeof v.lena === 'object' ? v.lena : null;
  if (l) {
    n.lena.dia = Math.max(0, Math.floor(finito(l.dia, 0)));
    n.lena.tomadas = (Array.isArray(l.tomadas) ? l.tomadas : []).filter((s) => typeof s === 'string' && /^l-?\d+_-?\d+$/.test(s)).slice(-NATURALEZA.tomadasMax);
  }
  return n;
}

// Un número 0..1 fijo para una celda de la grilla (el mismo en cada partida)
export function azarCelda(i, j, sal = 0) {
  let h = (SEMILLA ^ Math.imul(i + 7919, 0x9E3779B1) ^ Math.imul(j - 104729, 0x85EBCA6B) ^ Math.imul(sal + 13, 0xC2B2AE35)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85EBCA6B) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- la leña suelta
// Una pila de ramas secas por celda del bosque, a veces. `lugar(x, z)` dice si ahí se puede (bosque, sin agua, lejos de caminos)
export function idLena(i, j) { return `l${i}_${j}`; }
export function pilaDeLena(i, j, lugar) {
  const C = NATURALEZA.celdaLena;
  if (azarCelda(i, j, 1) >= NATURALEZA.probLena) return null;
  const x = (i + 0.2 + azarCelda(i, j, 2) * 0.6) * C, z = (j + 0.2 + azarCelda(i, j, 3) * 0.6) * C;
  if (lugar && !lugar(x, z)) return null;
  return { id: idLena(i, j), x, z, giro: azarCelda(i, j, 4) * Math.PI * 2 };
}
// La leña de hoy: cambió el día, vuelve toda (la pila se repone de un día para el otro)
export function lenaDelDia(est, dia) {
  if (!est.lena || est.lena.dia !== dia) est.lena = { dia, tomadas: [] };
  return est.lena;
}
export function lenaTomada(est, id, dia) { return lenaDelDia(est, dia).tomadas.includes(id); }
// Juntar una pila: cuántas ramitas entran (0 si ya llevás doce: la pila queda donde está)
export function juntarLena(est, id, dia, ramitas) {
  const l = lenaDelDia(est, dia);
  if (l.tomadas.includes(id)) return 0;
  const entra = Math.max(0, Math.min(NATURALEZA.ramitasLena, NATURALEZA.topeRamitas - Math.max(0, finito(ramitas, 0))));
  if (!entra) return 0;
  l.tomadas.push(id);
  if (l.tomadas.length > NATURALEZA.tomadasMax) l.tomadas.splice(0, l.tomadas.length - NATURALEZA.tomadasMax);
  return entra;
}

// ---------------------------------------------------------------- las piedritas y las piñas
// Una piedrita (o una piña bajo los árboles) por celda, a veces: sobre los senderos y la orilla piedritas; en el bosque, piñas
export function piedritaDe(i, j, suelo) {
  const C = NATURALEZA.celdaPiedra;
  if (azarCelda(i, j, 11) >= NATURALEZA.probPiedra) return null;
  const x = (i + 0.15 + azarCelda(i, j, 12) * 0.7) * C, z = (j + 0.15 + azarCelda(i, j, 13) * 0.7) * C;
  const tipo = suelo ? suelo(x, z) : 'piedra';
  if (!tipo) return null;
  return { id: `p${i}_${j}`, x, z, tipo, giro: azarCelda(i, j, 14) * 6.28, esc: 1.1 + azarCelda(i, j, 15) * 0.6 };
}
// ¿El pie la patea? (cerca, andando y yendo hacia ella)
export function patea({ dx, dz, vx, vz }) {
  const d = Math.hypot(dx, dz), v = Math.hypot(vx, vz);
  if (d > NATURALEZA.patada || v < NATURALEZA.velPatada) return null;
  if (d > 0.05 && (dx * vx + dz * vz) / (d * v) < 0.2) return null;   // de espaldas a la piedra, no
  const f = Math.min(1, v / 6);
  return { vx: vx * (0.9 + f * 0.6), vz: vz * (0.9 + f * 0.6), vy: 0.6 + f * 1.6 };
}

// ---------------------------------------------------------------- el sapito
// Cuántos saltos da la piedra: agachado (el tiro rasante) salen más; corriendo, menos. `azar` es una función 0..1
export function saltosSapito(azar, { agachado = false, corriendo = false, viento = 0 } = {}) {
  const a = typeof azar === 'function' ? azar : Math.random;
  let base = 1 + Math.floor(a() * 4) + Math.floor(a() * a() * 4);
  if (agachado) base += 1 + Math.floor(a() * 2);
  if (corriendo) base -= 1;
  if (viento > 0.6 && a() < 0.4) base -= 1;
  return Math.max(0, Math.min(NATURALEZA.saltosMax, base));
}
// Los puntos donde pica la piedra: cada salto un poco más corto (la piedra pierde velocidad)
export function piquesSapito(saltos, primero = 4.2) {
  const out = [];
  let d = 0, paso = primero;
  for (let k = 0; k < saltos; k++) { d += paso; out.push(+d.toFixed(3)); paso *= 0.72; }
  return out;
}
export function textoSapito(saltos, record, nuevo) {
  if (saltos <= 0) return { titulo: '¡Plof!', texto: 'Se fue derecho al fondo. Agachate para tirarla más rasante' };
  const s = `${saltos} ${saltos === 1 ? 'salto' : 'saltos'}`;
  if (nuevo) return { titulo: `¡${s}!`, texto: record > 0 ? `Tu mejor sapito hasta ahora` : 'Tu primer sapito' };
  return { titulo: s, texto: `Tu récord: ${record}` };
}
// Anotar un tiro: devuelve si fue récord
export function anotarSapito(est, saltos) {
  est.sapitos = Math.min(1e6, (est.sapitos || 0) + 1);
  if (saltos > (est.sapitoRecord || 0)) { est.sapitoRecord = Math.min(NATURALEZA.saltosMax, saltos); return true; }
  return false;
}

// ---------------------------------------------------------------- las pisadas
// El ripio de las calles de la aldea y el balasto de la vía: la tierra de esos lugares suena a grava
export function superficiePaso(sup, { distRiel = Infinity, enCalle = false } = {}) {
  if (sup !== 'tierra' && sup !== 'hojarasca' && sup !== 'pasto') return sup;
  if (distRiel < 1.7) return 'ripio';
  if (enCalle) return 'ripio';   // (las calles de la aldea no son sendero: ahí el jugador dice hojarasca o pasto)
  return sup;
}
// En el bosque cerrado, de vez en cuando una ramita seca cruje bajo el pie (no en la nieve ni en el agua)
export function crujeRama(sup, bosque, azar) {
  if (!['hojarasca', 'hojas', 'tierra'].includes(sup)) return false;
  if (!(bosque >= NATURALEZA.bosqueCruje)) return false;
  return azar < NATURALEZA.probCruje * (0.6 + bosque * 0.5);
}

// ---------------------------------------------------------------- mojado
// Cuánto estás mojado (0 a 1): en el agua hasta la cintura o nadando, del todo; con lluvia y sin techo, de a poco; se seca solo
// en un par de minutos, y junto al fuego mucho más rápido. Devuelve el valor nuevo.
export function mojarse(m, dt, { nadando = false, prof = 0, lluvia = 0, bajoTecho = false, fuego = false } = {}) {
  let v = Math.max(0, Math.min(1, finito(m, 0)));
  const s = Math.max(0, finito(dt, 0));
  if (nadando || prof > 0.7) return 1;
  if (prof > 0.08) v = Math.max(v, 0.35 + Math.min(0.4, prof * 0.6));
  if (lluvia > 0.15 && !bajoTecho) v = Math.min(1, v + NATURALEZA.lluviaMoja * lluvia * s);
  else v = Math.max(0, v - (s / NATURALEZA.secarSeg) * (fuego ? NATURALEZA.secarFuego : 1));
  return v;
}
// Cada cuánto cae una gota (segundos): más mojado, más seguido; seco, nunca
export function cadaGota(m) { return m < NATURALEZA.umbralGoteo ? Infinity : 0.08 + (1 - m) * 0.9; }

// ---------------------------------------------------------------- el arbusto, la temporada y lo que cae
// Lo que cae al sacudir: hojas siempre (en invierno, nieve si hay); frutos del calafate en verano y otoño (a la mochila si entra)
export function loQueCae(tipo, { invierno = 0, otono = 0 } = {}) {
  const nieve = invierno > 0.5;
  const fruto = tipo === 'calafate' && !nieve ? 'calafate' : null;
  return { hojas: nieve ? 4 : otono > 0.5 ? 14 : 8, nieve: nieve ? 22 : 0, fruto, pajaros: !nieve };
}

// ---------------------------------------------------------------- qué hace la E (la primera que aplica)
// `c`: lo que encontró el juego (cada cosa con su distancia y si la mirás). Devuelve { id, texto, … } o nulo.
export const ORDEN_TOQUES = ['tocarAgua', 'sapito', 'lena', 'flor', 'arbusto', 'arbol', 'pasto'];
export function elegirToque(c = {}) {
  for (const id of ORDEN_TOQUES) {
    const h = c[id];
    if (h) return { id, ...h, texto: textoToque(id, h) };
  }
  return null;
}
export function textoToque(id, h = {}) {
  switch (id) {
    case 'tocarAgua': return 'Tocar el agua';
    case 'sapito': return 'Tirar una piedra al agua (sapito)';
    case 'lena': return h.lleno ? 'Ya llevás doce ramitas' : 'Juntar la leña suelta';
    case 'flor': return 'Arrancar un amancay';
    case 'arbusto': return `Sacudir ${tiene(ARBUSTOS, h.tipo) ? ARBUSTOS[h.tipo] : 'el arbusto'}`;
    case 'arbol': return `Sacudir ${tiene(ARBOLES_CHICOS, h.especie) ? ARBOLES_CHICOS[h.especie] : 'el arbolito'}`;
    case 'pasto': return h.tipo && tiene(PASTOS, h.tipo) ? `Arrancar ${PASTOS[h.tipo]}` : 'Arrancar un poco de pasto';
    default: return '';
  }
}
// Mirar algo en el plano: el coseno entre a dónde mirás y dónde está (con 1 si lo tenés encima)
export function mirando(px, pz, fx, fz, x, z) {
  const dx = x - px, dz = z - pz, d = Math.hypot(dx, dz);
  if (d < 0.35) return 1;
  const f = Math.hypot(fx, fz) || 1;
  return (dx * fx + dz * fz) / (d * f);
}
