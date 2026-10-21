// 3.8.8 · Economía, Fase 3b: el banco del pueblo. Lo atiende el gerente. Dos cosas:
//   · PRÉSTAMOS con interés: un solo préstamo a la vez, hasta un tope que crece con la confianza del banco (reputación). Interés del
//     2 % por día sobre lo que debés (un año del juego son 12 días). Se paga cuando quieras, de a poco o todo junto. Si pasás el plazo
//     el interés sube al 3 %, el banco pierde confianza y no te presta hasta que lo saldes: no hay embargos ni se pierde la casa
//     (el Relax no castiga con ruina);
//   · ABASTECIMIENTO: el banco necesita cosas para sus clientes y las paga por encima del mercado (de +25 % a +40 %, según su
//     confianza). Hay un pedido por ventana de dos días y sólo uno se puede cumplir por ventana, para que no sea una máquina de plata.
// Módulo puro, sin imports de la aldea. Sólo en el Relax.
import { BIENES, perfilDe, hashTexto, azarDe } from './comercio.js';
import { negociosDe } from './negocios.js';
import { cobrar, pagar, pesosDe, formatoPesos, hayEconomia } from './economia.js';
import { premioDe, tengoDe, efectoDe, nombreCosa } from './pedidos.js';

export const BANCO = {
  tasa: 0.02, tasaAtraso: 0.03, plazoMin: 3, plazoMax: 12, topes: [3000, 6000, 10000, 15000], nivelesRep: [0, 2, 5, 10],
  montoMin: 500, paso: 500, primaBase: 1.25, primaPorNivel: 0.05, ventana: 2,
};
export const GERENTE = 'Amadeo Lezcano';

export function nivelBanco(p) {
  const r = negociosDe(p)?.banco?.rep || 0;
  let n = 0;
  for (let i = 1; i < BANCO.nivelesRep.length; i++) if (r >= BANCO.nivelesRep[i]) n = i;
  return n;
}
export const topeDe = (p) => BANCO.topes[nivelBanco(p)];
export const prestamoDe = (p) => negociosDe(p)?.banco?.prestamo || null;
// Lo que costaría un préstamo si lo pagás al final del plazo (para mostrar antes de pedirlo)
export function costoEstimado(monto, dias) {
  let d = Math.max(0, Math.floor(Number(monto)) || 0);
  for (let i = 0; i < Math.max(0, Math.floor(Number(dias)) || 0); i++) d = Math.ceil(d * (1 + BANCO.tasa));
  return d;
}
// ¿Te puede prestar?: { ok } o { ok: false, motivo: 'debe' | 'atraso' | 'monto' | 'tope', tope }
export function puedePedir(p, dia, monto, dias = BANCO.plazoMax) {
  if (!hayEconomia(p)) return { ok: false, motivo: 'nada' };
  const b = negociosDe(p).banco;
  const m = Math.floor(Number(monto)) || 0;
  if (b.prestamo) return { ok: false, motivo: 'debe' };
  if (b.sinConfianza) return { ok: false, motivo: 'atraso' };
  if (m < BANCO.montoMin || m % BANCO.paso !== 0 || dias < BANCO.plazoMin || dias > BANCO.plazoMax) return { ok: false, motivo: 'monto' };
  if (m > topeDe(p)) return { ok: false, motivo: 'tope', tope: topeDe(p) };
  return { ok: true };
}
export function pedirPrestamo(p, dia, monto, dias = BANCO.plazoMax) {
  const v = puedePedir(p, dia, monto, dias);
  if (!v.ok) return v;
  const b = negociosDe(p).banco;
  const m = Math.floor(monto);
  b.prestamo = { monto: m, debe: m, dia, hasta: dia + dias, tasa: BANCO.tasa, cuotaDia: 0, pagoHasta: 0 };
  b.hechos++;
  cobrar(p, m, 'Préstamo del banco', GERENTE);
  return { ok: true, monto: m, hasta: dia + dias };
}
// Pagar (de a poco o todo): devuelve { ok, pagado, resta } o { ok: false, motivo }
export function pagarPrestamo(p, dia, monto) {
  if (!hayEconomia(p)) return { ok: false, motivo: 'nada' };
  const b = negociosDe(p).banco;
  if (!b.prestamo) return { ok: false, motivo: 'nada' };
  const quiere = Math.min(b.prestamo.debe, Math.floor(Number(monto)) || 0);
  if (quiere <= 0) return { ok: false, motivo: 'monto' };
  if (pesosDe(p) < quiere) return { ok: false, motivo: 'plata' };
  const r = pagar(p, quiere, 'Pago del préstamo', GERENTE);
  if (!r.ok) return { ok: false, motivo: 'plata' };
  b.prestamo.debe -= quiere;
  b.cuotas++;
  if (b.prestamo.debe <= 0) {
    // a tiempo: el banco te tiene más confianza; tarde: sólo se salda
    if (dia <= b.prestamo.hasta && dia - b.prestamo.dia >= BANCO.plazoMin) b.rep++;   // (el préstamo tiene que haber durado: pedir y devolver el mismo día no suma confianza)
    b.prestamo = null;
    b.sinConfianza = false;
    return { ok: true, pagado: quiere, resta: 0, saldado: true };
  }
  return { ok: true, pagado: quiere, resta: b.prestamo.debe, saldado: false };
}
// Un día que pasa en el banco: el interés de lo que debés; si pasó el plazo, el atraso
export function pasarDiaBanco(p, dia) {
  const b = negociosDe(p)?.banco;
  if (!b?.prestamo || dia <= b.prestamo.dia) return;
  const pr = b.prestamo;
  if (dia > pr.hasta) {
    if (pr.tasa < BANCO.tasaAtraso) { pr.tasa = BANCO.tasaAtraso; b.atrasos++; b.rep = Math.max(0, b.rep - 1); b.sinConfianza = true; }
  }
  pr.debe = Math.min(1e7, Math.ceil(pr.debe * (1 + pr.tasa)));
}
// Con el préstamo vencido, lo que entra solo (el alquiler) paga primero la deuda: devuelve cuánto se aplicó
export function abonarAlMoroso(p, dia, monto) {
  const pr = negociosDe(p)?.banco?.prestamo;
  if (!pr || dia <= pr.hasta) return 0;
  const q = Math.min(pr.debe, Math.max(0, Math.floor(Number(monto)) || 0));
  pr.debe -= q;
  if (pr.debe <= 0) { negociosDe(p).banco.prestamo = null; negociosDe(p).banco.sinConfianza = false; }
  return q;
}
export const diasParaVencer = (p, dia) => { const pr = prestamoDe(p); return pr ? pr.hasta - dia : null; };

// ---------------------------------------------------------------- el abastecimiento
const ventana = (dia) => Math.floor((Math.max(1, Math.floor(Number(dia) || 1)) - 1) / BANCO.ventana);
const SIN_ABASTO = new Set(['poncho', 'cristal']);   // lo caro o raro no lo pide el banco
// 4.6 recursos: ni los materiales de zona (la elección de siempre no cambia en las partidas que ya están, y no pide piedra de cantera sin pico de cantero)
for (const k of ['junco', 'hierbas', 'arcilla', 'cuero', 'piedra-cantera']) SIN_ABASTO.add(k);
// Lo que el banco necesita en esta ventana de días (o null si ya lo cumpliste)
export function abastoDe(p, dia) {
  if (!hayEconomia(p)) return null;
  const b = negociosDe(p).banco;
  const v = ventana(dia);
  if (b.abastoDia === v + 1) return null;
  const r = azarDe(hashTexto(`abasto|${v}`));
  const ids = Object.keys(BIENES).filter((x) => !SIN_ABASTO.has(x) && !perfilDe('Aldea de los Duendes').produce.includes(x));   // (ni lo que la estación de la aldea hace barato)
  const bien = ids[Math.floor(r() * ids.length) % ids.length];
  const nivel = nivelBanco(p);
  const lotes = 1 + Math.floor(r() * 2) + (nivel >= 2 ? 1 : 0);
  const n = lotes * BIENES[bien].lote;
  const prima = BANCO.primaBase + BANCO.primaPorNivel * nivel;
  return { id: `banco|${v}`, k: bien, tipo: BIENES[bien].donde, n, prima, premio: premioDe(bien, n, prima), limite: (v + 1) * BANCO.ventana };
}
export function puedeAbastecer(p, dia) {
  const a = abastoDe(p, dia);
  if (!a) return { ok: false, motivo: 'nada' };
  if (prestamoDe(p) && dia > prestamoDe(p).hasta) return { ok: false, motivo: 'atraso', abasto: a };
  if (tengoDe(p, a.k) < a.n) return { ok: false, motivo: 'falta', abasto: a };
  return { ok: true, abasto: a };
}
export function cumplirAbasto(p, dia) {
  const v = puedeAbastecer(p, dia);
  if (!v.ok) return v;
  const b = negociosDe(p).banco;
  b.abastoDia = ventana(dia) + 1;
  b.abastecidos++;
  if (b.abastecidos % 3 === 0) b.rep++;   // cada tres entregas, más confianza
  cobrar(p, v.abasto.premio, `Abastecimiento: ${nombreCosa(v.abasto.k)}`, GERENTE);
  return { ok: true, premio: v.abasto.premio, abasto: v.abasto };
}
export const efectosDeAbasto = (a) => [efectoDe(a.k, -a.n)];
export function textoAbasto(a) {
  return `${a.n} de ${nombreCosa(a.k)} por ${formatoPesos(a.premio)} (hasta el día ${a.limite})`;
}
