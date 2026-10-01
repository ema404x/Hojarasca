// 2.4: teñir las piezas de la casa.
//
// Con T en modo obra, mirando una pared, un piso o un techo tuyo terminado, se va
// pasando de un tinte a otro. Los tintes salen de lo que ya juntás en el valle:
//   · calafate: el violeta de las bayas (3 calafates)
//   · ocre: barro colorado de la orilla, molido con una piedra (1 piedra)
//   · cal: piedra quemada y apagada, el blanco de los ranchos (2 piedras)
//   · natural: vuelve a la madera, gratis
//
// Puro, sin THREE: construccion.js le pasa el atributo de color de la geometría (colores
// por vértice en espacio lineal) y acá se corren hacia el tinte sin perder las vetas.

export const TINTES = {
  calafate: { nombre: 'calafate', color: '#6b4a78', pide: { calafates: 3 } },
  ocre: { nombre: 'ocre', color: '#b0773a', pide: { piedra: 1 } },
  cal: { nombre: 'cal', color: '#e6e1d3', pide: { piedra: 2 } },
};
// El orden en que T los va pasando; null es la madera natural.
export const ORDEN_TINTES = [null, 'calafate', 'ocre', 'cal'];
export const FUERZA_TINTE = 0.6;

// Sólo las piezas de refugio (paredes, pisos, techos, pilares): lo demás tiene su color.
export const tenible = (plano) => !!plano && plano.pieza && plano.categoria === 'refugios';

const esTinte = (t) => !!t && Object.hasOwn(TINTES, t);
export function siguienteTinte(actual) {
  const i = ORDEN_TINTES.indexOf(esTinte(actual) ? actual : null);
  return ORDEN_TINTES[(i + 1) % ORDEN_TINTES.length];
}

// Lo que cuesta pasar a `tinte`, contra lo que tenés: { ok, falta } (falta es un texto).
export function costoTinte(tinte, tengo = {}) {
  if (!esTinte(tinte)) return { ok: true, pide: {}, falta: null };
  const pide = TINTES[tinte].pide;
  for (const [k, n] of Object.entries(pide)) {
    if ((Number(tengo[k]) || 0) < n) return { ok: false, pide, falta: `${n} ${k === 'calafates' ? 'calafates' : 'piedras'}` };
  }
  return { ok: true, pide, falta: null };
}

const lineal = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
export function hexALineal(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return [lineal(((n >> 16) & 255) / 255), lineal(((n >> 8) & 255) / 255), lineal((n & 255) / 255)];
}
const luz = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// Corre cada color hacia el tinte. Las vetas (lo más claro y lo más oscuro de cada
// tabla) se conservan porque el tinte se escala por la luz relativa de cada vértice.
// `attr` tiene { array, count, needsUpdate } (un BufferAttribute o algo parecido).
export function tenirColores(attr, hex, fuerza = FUERZA_TINTE) {
  if (!attr?.array) return 0;
  const [tr, tg, tb] = hexALineal(hex);
  const lt = Math.max(0.02, luz(tr, tg, tb));
  const a = attr.array;
  let media = 0;
  for (let i = 0; i < a.length; i += 3) media += luz(a[i], a[i + 1], a[i + 2]);
  media = Math.max(0.01, media / Math.max(1, a.length / 3));
  for (let i = 0; i < a.length; i += 3) {
    // la madera oscura queda oscura, pero con el tinte encima
    const rel = Math.min(1.6, luz(a[i], a[i + 1], a[i + 2]) / media);
    const k = rel * Math.min(1, lt / media) ** 0.35;
    a[i] = a[i] * (1 - fuerza) + tr * k * fuerza;
    a[i + 1] = a[i + 1] * (1 - fuerza) + tg * k * fuerza;
    a[i + 2] = a[i + 2] * (1 - fuerza) + tb * k * fuerza;
  }
  attr.needsUpdate = true;
  return a.length / 3;
}
