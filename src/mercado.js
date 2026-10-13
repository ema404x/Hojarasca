// 3.8.8 · Economía, Fase 2: el mercado de cada puesto. Hasta ahora los precios de `comercio.js` salían sólo de la fecha, el pueblo y la
// estación, y cada día arrancaba de cero: no importaba cuánto habías vendido ayer. Ahora cada puesto tiene lo suyo y sigue de un día
// para el otro:
//   · EXISTENCIAS de cada cosa (en lotes): el puesto produce lo que hace el pueblo, gasta lo que necesita y vuelve de a poco a su
//     nivel de siempre. Si le sobra, paga menos y cobra menos; si le falta, paga más y cobra más (`factorDe`); sin existencias no vende,
//     y lleno no compra;
//   · una CAJA de pesos: paga lo que le comprás de su caja (si no le alcanza, no te compra) y se repone un poco cada día.
// Todo sale de la fecha y del nombre de la parada (dos partidas ven lo mismo) y de lo que vos hiciste. Módulo puro (se prueba en Node).
// Sólo en el Relax. El estado vive en `progreso.comercio.mercado` (ver `sanearComercio`).
import { BIENES, bienesDe, perfilDe, esBien, azarDe, hashTexto } from './comercio.js';

export const MERCADO = {
  stockMax: 14,        // lo más que cabe de una cosa en el puesto (lotes)
  baseProduce: 9,      // el nivel de siempre de lo que el pueblo hace, de lo que necesita y del resto (lotes)
  basePide: 2,
  baseOtros: 5,
  vuelta: 0.2,         // cuánto se acerca cada día a su nivel de siempre
  cajaDia: 700,        // lo que se repone la caja por día (pesos)
  diasMax: 12,         // lo más que se simula de una vez al volver (un año del juego)
  factorMin: 0.85, factorMax: 1.3, potencia: 0.3,
};
const entero = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));

// El nivel de siempre de una cosa en un puesto: lo que hace el pueblo abunda; lo que necesita, escasea
export function nivelBase(nombre, bien) {
  const p = perfilDe(nombre);
  return p.produce.includes(bien) ? MERCADO.baseProduce : p.pide.includes(bien) ? MERCADO.basePide : MERCADO.baseOtros;
}
// La caja de cada puesto: lo más que junta y con cuánto arranca (pesos, redondos a $100)
export function cajaMaxima(nombre) { return 4000 + (hashTexto(`${nombre}|caja`) % 41) * 100; }
function estadoInicial(nombre, dia) {
  const r = azarDe(hashTexto(`${nombre}|mercado`));
  const stock = {};
  for (const b of bienesDe(nombre)) stock[b] = Math.max(0, Math.min(MERCADO.stockMax, nivelBase(nombre, b) + Math.round((r() - 0.5) * 3)));
  return { dia, caja: Math.round((cajaMaxima(nombre) * (0.45 + r() * 0.35)) / 100) * 100, stock };
}
// Un día en el puesto: produce, gasta, vuelve de a poco a lo de siempre, y la caja se repone
function unDia(t, nombre, dia) {
  const p = perfilDe(nombre);
  for (const b of bienesDe(nombre)) {
    const r = azarDe(hashTexto(`${nombre}|${b}|${dia}|mercado`));
    const hace = p.produce.includes(b), pide = p.pide.includes(b);
    const entra = hace ? 1 + Math.floor(r() * 3) : pide ? Math.floor(r() * 2) : Math.floor(r() * 3);
    const sale = pide ? 1 + Math.floor(r() * 3) : hace ? Math.floor(r() * 2) : Math.floor(r() * 2);
    const s = entero(t.stock[b], MERCADO.stockMax) + entra - sale;
    t.stock[b] = Math.max(0, Math.min(MERCADO.stockMax, s + Math.round((nivelBase(nombre, b) - s) * MERCADO.vuelta)));
  }
  t.caja = Math.min(cajaMaxima(nombre), entero(t.caja, 1e7) + MERCADO.cajaDia);
  t.dia = dia;
}
// El estado del puesto hoy (lo crea o lo pone al día: si pasaron días, se simulan, hasta un año)
export function tienda(c, nombre, dia) {
  if (!c || typeof c !== 'object') return null;
  const hoy = Math.max(1, Math.floor(Number(dia) || 1));
  c.mercado = c.mercado && typeof c.mercado === 'object' ? c.mercado : {};
  let t = c.mercado[nombre];
  if (!t || typeof t.stock !== 'object') { t = c.mercado[nombre] = estadoInicial(nombre, hoy); return t; }
  for (const b of bienesDe(nombre)) if (!Number.isFinite(Number(t.stock[b]))) t.stock[b] = nivelBase(nombre, b);
  if (t.dia < hoy) {
    const desde = Math.max(t.dia, hoy - MERCADO.diasMax);
    for (let d = desde + 1; d <= hoy; d++) unDia(t, nombre, d);
    t.dia = hoy;
  }
  return t;
}
export const existencias = (t, bien) => entero(t?.stock?.[bien], MERCADO.stockMax);
// Cuánto cambia el precio por lo que tiene el puesto: con de más, baja; con de menos, sube. 1 = como siempre.
export function factorDe(t, nombre, bien) {
  if (!t || !esBien(bien)) return 1;
  const f = Math.pow((nivelBase(nombre, bien) + 1) / (existencias(t, bien) + 1), MERCADO.potencia);
  return Math.max(MERCADO.factorMin, Math.min(MERCADO.factorMax, f));
}
// Cómo está una cosa en el puesto: 'agotado', 'escaso', 'normal' o 'abunda'
export function nivelDe(t, nombre, bien) {
  const s = existencias(t, bien), b = nivelBase(nombre, bien);
  return s <= 0 ? 'agotado' : s <= b * 0.5 ? 'escaso' : s >= b * 1.4 ? 'abunda' : 'normal';
}
// Comprarle un lote al puesto (pagaste `pesos`): le baja la existencia y le sube la caja
export function registrarCompra(t, nombre, bien, pesos) {
  if (!t) return;
  t.stock[bien] = Math.max(0, existencias(t, bien) - 1);
  t.caja = Math.min(cajaMaxima(nombre), entero(t.caja, 1e7) + entero(pesos, 1e7));
}
// Venderle un lote al puesto (te pagó `pesos`): le sube la existencia y le baja la caja
export function registrarVenta(t, bien, pesos) {
  if (!t) return;
  t.stock[bien] = Math.min(MERCADO.stockMax, existencias(t, bien) + 1);
  t.caja = Math.max(0, entero(t.caja, 1e7) - entero(pesos, 1e7));
}
// ¿Puede el puesto comprarte un lote que paga `pesos`?: { ok } o { ok: false, motivo: 'lleno' | 'caja' }
export function puedeComprarte(t, bien, pesos) {
  if (!t) return { ok: true };
  if (existencias(t, bien) >= MERCADO.stockMax) return { ok: false, motivo: 'lleno' };
  if (entero(t.caja, 1e7) < entero(pesos, 1e7)) return { ok: false, motivo: 'caja' };
  return { ok: true };
}
export const puedeVenderte = (t, bien) => existencias(t, bien) >= 1;
// Lo que hoy paga bien el puesto (factor alto): para el cartel. Hasta `n` cosas, las que más.
export function destacados(t, nombre, n = 3) {
  return bienesDe(nombre).map((b) => ({ bien: b, factor: factorDe(t, nombre, b) })).filter((x) => x.factor >= 1.12).sort((a, b) => b.factor - a.factor).slice(0, n).map((x) => x.bien);
}
export const nombreDelBien = (b) => BIENES[b]?.nombre || b;
