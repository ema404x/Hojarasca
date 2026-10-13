// 3.8.8 · Economía, Fase 4: pedidos de los vecinos. Cada local de la aldea te pide algo concreto cada tres días (una «ventana»):
// una cantidad de una cosa que se consigue en el valle o comprando en los puestos. Pagan un poco más que lo que cuesta, un diez por
// ciento más si lo entregás el primer día de la ventana, y cuanto más cumplís mejor es tu reputación con él: crece la cantidad, aparecen
// cosas mejores y sube lo que pagan. El pago sale de la caja del local (aldea-viva.js); hay un tope de entregas por día. Un pedido no
// cumplido simplemente vence: el Relax no castiga. Los pedidos salen de la fecha y del vecino, sin guardar nada hasta que se entrega
// (se anota sólo cuál fue el último). Módulo puro, sin imports de la aldea. Sólo en el Relax.
import { BIENES, perfilDe, hashTexto, azarDe } from './comercio.js';
import { negociosDe, caja, nivelRep, TOPE_CAJA } from './negocios.js';
import { cobrar, formatoPesos, hayEconomia } from './economia.js';

export const PEDIDOS = { dias: 3, porDia: 2, base: 1.1, porNivel: 0.04, rapido: 0.05, repPorEntrega: 1 };

// Lo que necesita cada local, de más corriente a más rara (las dos últimas sólo con confianza: nivel 2)
const NECESITA = {
  carpintero: ['tronco', 'piedra', 'lana'], panadera: ['harina', 'huevo', 'miel'], herrero: ['piedra', 'tronco', 'cristal'],
  pescador: ['tronco', 'lana', 'pan-casero'], maestra: ['papa', 'pan-casero', 'frasco-frutilla'], enfermera: ['miel', 'lana', 'frasco-frutilla'],
  telegrafista: ['tronco', 'pan-casero', 'empanadas'], tejedora: ['lana', 'frutilla', 'poncho'], apicultor: ['tabla', 'frasco-frutilla', 'harina'],
  guardaparque: ['trucha-ahumada', 'tronco', 'hongos-secos'], musico: ['tabla', 'empanadas', 'miel'], veterinaria: ['huevo', 'lana', 'haba'],
  herbolaria: ['miel', 'calafate-seco', 'hongos-secos'], modista: ['lana', 'poncho', 'cristal'], botera: ['tabla', 'tronco', 'lana'],
  pintora: ['cristal', 'frutilla', 'calafate-seco'], andinista: ['trucha-ahumada', 'pan-casero', 'empanadas'], fotografa: ['cristal', 'miel', 'papa'],
  ceramista: ['piedra', 'haba', 'papa'], astronoma: ['cristal', 'empanadas', 'miel'],
};
const DE_LA_ESTACION = new Set(perfilDe('Aldea de los Duendes').produce);
export const hayPedidos = (k) => Object.hasOwn(NECESITA, k);
export const ventanaDe = (dia) => Math.floor((Math.max(1, Math.floor(Number(dia) || 1)) - 1) / PEDIDOS.dias);
const TIPO_DE = { material: 'material', entrada: 'entrada', cosa: 'cosa' };

// Cuántos tenés de una cosa (de dónde sale depende de la cosa)
export function tengoDe(p, bien) {
  const b = BIENES[bien];
  if (!b) return 0;
  const v = b.donde === 'material' ? p?.materiales?.[bien] : b.donde === 'entrada' ? p?.entradas?.[bien]?.cantidad : p?.cosas?.[bien];
  return Math.max(0, Math.floor(Number(v)) || 0);
}
export const efectoDe = (bien, n) => ({ tipo: TIPO_DE[BIENES[bien].donde], k: bien, n });

// Lo que vale entregar `n` de `bien` con el factor que pagan (en pesos, redondo a $50)
export function premioDe(bien, n, mult) {
  const b = BIENES[bien];
  return Math.max(50, Math.round(((n / b.lote) * b.valor * 100 * mult) / 50) * 50);
}
// El pedido de este vecino hoy, o null si no pide, si ya lo entregaste en esta ventana o si todavía no cumpliste con ninguno de sus oficios
export function pedidoDe(p, k, dia) {
  if (!hayEconomia(p) || !hayPedidos(k)) return null;
  const n = negociosDe(p);
  const v = ventanaDe(dia);
  const id = `${k}|${v}`;
  if (n.pedidos[k]?.id === id) return null;
  const nivel = nivelRep(p, k);
  const r = azarDe(hashTexto(`pedido|${id}`));
  // (nada de lo que la estación de la aldea produce barato: se compraría ahí mismo y se cobraría de más)
  const sinEstacion = NECESITA[k].filter((b) => !DE_LA_ESTACION.has(b));
  const pool = (sinEstacion.length ? sinEstacion : NECESITA[k]).slice(0, nivel >= 2 ? 3 : 2);
  const bien = pool[Math.floor(r() * pool.length) % pool.length];
  const lotes = 1 + Math.floor(r() * 2) + (nivel >= 1 ? 1 : 0);
  const cuantos = lotes * BIENES[bien].lote;
  const limite = (v + 1) * PEDIDOS.dias;
  const primero = v * PEDIDOS.dias + 1;
  const rapido = dia === primero;
  const mult = PEDIDOS.base + PEDIDOS.porNivel * nivel + (rapido ? PEDIDOS.rapido : 0);
  return { id, k: bien, tipo: BIENES[bien].donde, n: cuantos, premio: premioDe(bien, cuantos, mult), limite, rapido };
}
export const pedidosHoy = (p, dia) => { const h = negociosDe(p)?.hoy; return h && h.dia === dia ? h.pedidos || 0 : 0; };
// ¿Se puede entregar ahora?: { ok, pedido } o { ok: false, motivo: 'no pide' | 'falta' | 'cupo' | 'caja', pedido }
export function puedeEntregar(p, k, dia, yaSacado = false) {
  const pedido = pedidoDe(p, k, dia);
  if (!pedido) return { ok: false, motivo: 'no pide' };
  if (!yaSacado && tengoDe(p, pedido.k) < pedido.n) return { ok: false, motivo: 'falta', pedido };
  if (pedidosHoy(p, dia) >= PEDIDOS.porDia) return { ok: false, motivo: 'cupo', pedido };
  if (caja(p, k) < pedido.premio) return { ok: false, motivo: 'caja', pedido };
  return { ok: true, pedido };
}
// Lo cobra y lo anota. `yaSacado`: lo que entregás ya lo sacaron los efectos de material (que van antes). Devuelve { ok, premio }
export function cerrarPedido(p, k, dia, nombre = '', yaSacado = false) {
  const v = puedeEntregar(p, k, dia, yaSacado);
  if (!v.ok) return v;
  const n = negociosDe(p);
  n.cajas[k] = Math.max(0, Math.min(TOPE_CAJA, caja(p, k) - v.pedido.premio));
  n.pedidos[k] = { id: v.pedido.id, dia };
  n.rep[k] = (n.rep[k] || 0) + PEDIDOS.repPorEntrega;
  n.hoy = n.hoy.dia === dia ? n.hoy : { dia, jornales: 0, pedidos: 0 };
  n.hoy.pedidos = (n.hoy.pedidos || 0) + 1;
  cobrar(p, v.pedido.premio, `Pedido: ${BIENES[v.pedido.k].nombre.toLowerCase()}`, nombre);
  return { ok: true, premio: v.pedido.premio, pedido: v.pedido };
}
export const nombreCosa = (bien) => (BIENES[bien]?.nombre || bien).toLowerCase();
// Lo que dice el vecino al verte: { partes, seguir?, efectos?, titulo? } o null si no pide nada
export function ofertaDePedido(p, k, dia, nombre = '', seguir = '') {
  const v = puedeEntregar(p, k, dia);
  if (v.motivo === 'no pide' || !v.pedido) return null;
  const q = v.pedido;
  const lo = `${q.n} de ${nombreCosa(q.k)}`;
  const hasta = `hasta el día ${q.limite}`;
  if (v.ok) {
    return {
      partes: [`¡Justo lo que necesitaba! ${lo.charAt(0).toUpperCase()}${lo.slice(1)}.`, `Te pago ${formatoPesos(q.premio)}${q.rapido ? ', con un extra por la rapidez' : ''}.`],
      seguir,
      efectos: [efectoDe(q.k, -q.n), { tipo: 'pedido', k, n: q.premio, motivo: `Pedido: ${nombreCosa(q.k)}`, con: nombre }],
      titulo: `Pedido cumplido: ${formatoPesos(q.premio)}`,
    };
  }
  if (v.motivo === 'cupo') return { partes: [`Tengo para pagarte el pedido de ${lo}, pero hoy ya entregaste dos. Volvé mañana (${hasta}).`], aviso: true };
  if (v.motivo === 'caja') return { partes: [`Necesito ${lo}, pero hoy no tengo con qué pagarte. Pasá en unos días (${hasta}).`], aviso: true };
  return { partes: [`Ando necesitando ${lo} (${hasta}). Lo pago ${formatoPesos(q.premio)}${q.rapido ? ' si me lo traés hoy, con un extra por la rapidez' : ''}.`], aviso: true };
}
