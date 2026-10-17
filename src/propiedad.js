// 3.8.8 · Economía, Fase 5: propiedad y negocio propio. Tres cosas:
//   · COMPRAR: levantar una de las tres casas prefabricadas cuesta, además de los materiales, el terreno y la mano de obra: un precio
//     en pesos que se paga repartido en las etapas (la primera lleva el terreno). El lote de tu casa en la calle de la Loma tiene su
//     escritura. Con sólo materiales una cabaña salía en 8 días de jornal: con el precio es una meta de un par de años del juego;
//   · ALQUILAR: las casas que terminaste y no usás se pueden poner en alquiler. Una familia que llegó se queda y paga una renta
//     por cada día que el cuarto está ocupado (casi siempre) y según la demanda del pueblo;
//   · EL PUESTO EN LA FERIA: una vez comprado, dejás mercadería en consigna y cada día vende hasta dos lotes (al valor de la plaza,
//     menos el diez por ciento del puesto); la plata se junta en la caja del puesto y la retirás cuando pasás.
// Módulo puro, sin imports de la aldea. Sólo en el Relax.
import { BIENES, COMERCIO, perfilDe, factorTemporadaMin, hashTexto, azarDe } from './comercio.js';
import { negociosDe } from './negocios.js';
import { cobrar, pagar, pesosDe, hayEconomia } from './economia.js';
import { tengoDe } from './pedidos.js';
import { abonarAlMoroso } from './prestamos.js';

export const PROPIEDAD = {
  casas: {
    'cabana-piedra': { total: 36000, reparto: [0.35, 0.2, 0.25, 0.2], renta: 300, nombre: 'la cabaña' },
    'casa-galeria': { total: 66000, reparto: [0.35, 0.2, 0.25, 0.2], renta: 500, nombre: 'la casa con galería' },
    casona: { total: 110000, reparto: [0.35, 0.2, 0.25, 0.2], renta: 800, nombre: 'la casona' },
  },
  escritura: 8000,                 // el lote de tu casa de la calle de la Loma
  puesto: { precio: 6000, lotesPorDia: 2, comision: 0.1, stockMax: 12, tiposMax: 8 },
  ocupacion: 0.85,                 // la parte de los días que el cuarto está ocupado
};
export const esCasaDePrecio = (id) => typeof id === 'string' && Object.hasOwn(PROPIEDAD.casas, id);
export const precioCasa = (id) => (esCasaDePrecio(id) ? PROPIEDAD.casas[id].total : 0);
// Lo que se paga al empezar la etapa `i` (0 a 3), redondo a $50; la última ajusta para que sume el total
export function precioDeEtapa(id, i) {
  if (!esCasaDePrecio(id) || !(i >= 0)) return 0;
  const c = PROPIEDAD.casas[id];
  if (i >= c.reparto.length) return 0;
  const parte = (j) => Math.round((c.total * c.reparto[j]) / 50) * 50;
  if (i < c.reparto.length - 1) return parte(i);
  return c.total - c.reparto.slice(0, -1).reduce((s, _, j) => s + parte(j), 0);
}
// ¿Se puede pagar la etapa?: { ok, precio } o { ok: false, precio, falta }
export function puedePagarEtapa(p, id, i) {
  const precio = hayEconomia(p) ? precioDeEtapa(id, i) : 0;
  if (!precio) return { ok: true, precio: 0 };
  const tengo = pesosDe(p);
  return tengo >= precio ? { ok: true, precio } : { ok: false, precio, falta: precio - tengo };
}
export function pagarEtapa(p, id, i, con = 'Obra de la casa') {
  const v = puedePagarEtapa(p, id, i);
  if (!v.ok || !v.precio) return v;
  const r = pagar(p, v.precio, `Terreno y mano de obra: ${PROPIEDAD.casas[id].nombre}`, con);
  return r.ok ? v : { ok: false, precio: v.precio, falta: v.precio - pesosDe(p) };
}
// 4.0.3 (II-1): al retirar una marca (Supr) que ya tenía etapas pagadas (pagaste la primera, deshiciste y cancelaste), el terreno y la mano de obra
// vuelven a la billetera: el cartel dice «no se gastaron materiales» y los pesos se perdían. `pagadas` es hasta qué etapa se pagó.
export function devolverEtapasPagadas(p, id, pagadas, con = 'Los albañiles de la aldea') {
  if (!hayEconomia(p) || !esCasaDePrecio(id)) return 0;
  let monto = 0;
  for (let i = 0; i < Math.max(0, Math.min(4, pagadas | 0)); i++) monto += precioDeEtapa(id, i);
  if (monto <= 0) return 0;
  const r = cobrar(p, monto, `Devolución del terreno y la mano de obra: ${PROPIEDAD.casas[id].nombre}`, con);
  return r.ok ? r.monto : 0;
}
export function puedePagarEscritura(p) {
  if (!hayEconomia(p)) return { ok: true, precio: 0 };
  const tengo = pesosDe(p);
  return tengo >= PROPIEDAD.escritura ? { ok: true, precio: PROPIEDAD.escritura } : { ok: false, precio: PROPIEDAD.escritura, falta: PROPIEDAD.escritura - tengo };
}
export function pagarEscritura(p, con = 'El banco') {
  const v = puedePagarEscritura(p);
  if (!v.ok || !v.precio) return v;
  return pagar(p, v.precio, 'Escritura del lote de la Loma', con).ok ? v : { ok: false, precio: v.precio };
}

// ---------------------------------------------------------------- las casas que tenés y el alquiler
export function registrarCasa(p, id) {
  const c = negociosDe(p)?.casas;
  if (!c || !esCasaDePrecio(id)) return 0;
  c.poseidas[id] = Math.min(20, (c.poseidas[id] || 0) + 1);
  return c.poseidas[id];
}
// Las casas que tenés de ese tipo: las terminadas que de verdad están en el valle (si se desarmó o se deshizo una, deja de contar);
// sin la lista de obras (las pruebas), lo registrado
export function casasDe(p, id) {
  if (Array.isArray(p?.obras) && esCasaDePrecio(id)) return p.obras.filter((o) => o?.plano === id && (Number(o.etapas) || 0) >= PROPIEDAD.casas[id].reparto.length).length;
  return negociosDe(p)?.casas?.poseidas?.[id] || 0;
}
export const enAlquilerDe = (p, id) => negociosDe(p)?.casas?.alquiladas?.[id]?.cuantas || 0;
const INQUILINOS = ['la familia Cárdenas', 'los Vidal', 'una pareja de maestros', 'dos hermanas tejedoras', 'el matrimonio Soria', 'un guarda de la ruta', 'la familia Millalén', 'unos estudiantes de Esquel'];
export const rentaDe = (id) => (esCasaDePrecio(id) ? PROPIEDAD.casas[id].renta : 0);
export function ponerEnAlquiler(p, id, dia) {
  if (!hayEconomia(p) || !esCasaDePrecio(id)) return { ok: false, motivo: 'nada' };
  const c = negociosDe(p).casas;
  const tengo = casasDe(p, id), alquiladas = c.alquiladas[id]?.cuantas || 0;
  if (tengo <= alquiladas) return { ok: false, motivo: tengo ? 'todas' : 'no hay' };
  const inq = INQUILINOS[hashTexto(`${id}|${dia}|${alquiladas}`) % INQUILINOS.length];
  c.alquiladas[id] = { inquilino: alquiladas ? c.alquiladas[id].inquilino : inq, desde: alquiladas ? c.alquiladas[id].desde : dia, renta: rentaDe(id), cuantas: alquiladas + 1 };
  return { ok: true, inquilino: c.alquiladas[id].inquilino, renta: rentaDe(id) };
}
export function retirarDeAlquiler(p, id) {
  const c = negociosDe(p)?.casas;
  const a = c?.alquiladas?.[id];
  if (!a) return { ok: false };
  if (a.cuantas > 1) a.cuantas--; else delete c.alquiladas[id];
  return { ok: true };
}
// La renta de un día: cada cuarto ocupado paga (la demanda del pueblo la sube o la baja un poco)
export function rentaDelDia(id, dia, i) { return azarDe(hashTexto(`${id}|${dia}|${i}|renta`))() < PROPIEDAD.ocupacion; }

// ---------------------------------------------------------------- el puesto en la feria
export const tienePuesto = (p) => !!negociosDe(p)?.casas?.puesto;
export function comprarPuesto(p, dia) {
  if (!hayEconomia(p)) return { ok: false, motivo: 'nada' };
  const c = negociosDe(p).casas;
  if (c.puesto) return { ok: false, motivo: 'ya' };
  if (pesosDe(p) < PROPIEDAD.puesto.precio) return { ok: false, motivo: 'plata', falta: PROPIEDAD.puesto.precio - pesosDe(p) };
  pagar(p, PROPIEDAD.puesto.precio, 'Puesto propio en la feria', 'La feria');
  c.puesto = { desde: dia, caja: 0, stock: {}, dia };
  return { ok: true, precio: PROPIEDAD.puesto.precio };
}
export const lotesEnPuesto = (p, bien) => negociosDe(p)?.casas?.puesto?.stock?.[bien] || 0;
export const totalEnPuesto = (p) => Object.values(negociosDe(p)?.casas?.puesto?.stock || {}).reduce((s, n) => s + n, 0);
// Dejar `lotes` lotes de una cosa en consigna: devuelve { ok, unidades } (el que llama saca las unidades de la mochila)
export function dejarEnPuesto(p, bien, lotes = 1) {
  const pu = negociosDe(p)?.casas?.puesto;
  if (!pu) return { ok: false, motivo: 'sin puesto' };
  if (!BIENES[bien] || !(lotes >= 1)) return { ok: false, motivo: 'nada' };
  const unidades = BIENES[bien].lote * Math.floor(lotes);
  if (tengoDe(p, bien) < unidades) return { ok: false, motivo: 'falta' };
  if (!pu.stock[bien] && Object.keys(pu.stock).length >= PROPIEDAD.puesto.tiposMax) return { ok: false, motivo: 'tipos' };
  if ((pu.stock[bien] || 0) + Math.floor(lotes) > PROPIEDAD.puesto.stockMax) return { ok: false, motivo: 'lleno' };
  pu.stock[bien] = (pu.stock[bien] || 0) + Math.floor(lotes);
  return { ok: true, unidades };
}
export function sacarDelPuesto(p, bien, lotes = 1) {
  const pu = negociosDe(p)?.casas?.puesto;
  if (!pu || !BIENES[bien]) return { ok: false };
  const q = Math.min(pu.stock[bien] || 0, Math.floor(lotes));
  if (q < 1) return { ok: false, motivo: 'nada' };
  pu.stock[bien] -= q;
  if (pu.stock[bien] <= 0) delete pu.stock[bien];
  return { ok: true, unidades: q * BIENES[bien].lote };
}
export function retirarCajaPuesto(p) {
  const pu = negociosDe(p)?.casas?.puesto;
  if (!pu || pu.caja <= 0) return { ok: false };
  const monto = pu.caja;
  pu.caja = 0;
  cobrar(p, monto, 'Ventas del puesto en la feria', 'La feria');
  return { ok: true, monto };
}
// Lo que vale un lote en el puesto hoy (pesos): el valor de la plaza × la demanda, menos la comisión
// (la demanda y el evento suben el precio hasta un 10 % como mucho, y lo que la estación de la aldea hace barato vale lo mismo de barato: así
// la consigna nunca paga más de lo que cuesta comprar la mercadería en la estación)
const DE_LA_ESTACION = new Set(perfilDe('Aldea de los Duendes').produce);
export const precioDeConsigna = (bien, demanda = 1, factorBien = 1) => Math.round((BIENES[bien].valor * 100 * (DE_LA_ESTACION.has(bien) ? COMERCIO.barato : 1) * factorTemporadaMin(bien) * Math.min(1.1, demanda * factorBien) * (1 - PROPIEDAD.puesto.comision)) / 10) * 10;
export function ventasDelPuesto(p, dia, demanda = 1, factor = () => 1) {
  const pu = negociosDe(p)?.casas?.puesto;
  if (!pu) return 0;
  let vendidos = 0;
  for (let i = 0; i < PROPIEDAD.puesto.lotesPorDia; i++) {
    const hay = Object.keys(pu.stock).filter((b) => pu.stock[b] > 0).sort((a, b) => BIENES[b].valor - BIENES[a].valor || (a < b ? -1 : 1));
    if (!hay.length) break;
    const b = hay[0];
    pu.caja = Math.min(1e6, pu.caja + precioDeConsigna(b, demanda, factor(b)));
    pu.stock[b]--;
    if (pu.stock[b] <= 0) delete pu.stock[b];
    vendidos++;
  }
  pu.dia = dia;
  return vendidos;
}
// Todo lo que pasa en un día de las casas y el puesto (lo llama el cierre diario)
export function alquilerDelDia(p, dia, demanda = 1, factor = () => 1) {
  const c = negociosDe(p)?.casas;
  if (!c) return 0;
  let total = 0;
  for (const [id, a] of Object.entries(c.alquiladas)) {
    if (!esCasaDePrecio(id)) continue;
    const cuartos = Math.min(a.cuantas, casasDe(p, id));   // (una casa que ya no está no paga)
    let m = 0;
    for (let i = 0; i < cuartos; i++) if (rentaDelDia(id, dia, i)) m += Math.round((a.renta * Math.max(0.9, Math.min(1.25, demanda))) / 10) * 10;
    if (m <= 0) continue;
    // una sola entrada en el libro por tipo de casa y día; con el préstamo vencido, la renta va primero a la deuda
    const cobra = m - abonarAlMoroso(p, dia, m);
    if (cobra > 0) cobrar(p, cobra, `Alquiler: ${PROPIEDAD.casas[id].nombre}`, a.inquilino);
    c.cobrado += m; total += cobra;
  }
  ventasDelPuesto(p, dia, demanda, factor);
  return total;
}
