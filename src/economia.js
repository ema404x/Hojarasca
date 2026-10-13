// 3.8.8: el peso. Hasta ahora la moneda del valle era la yerba («no hay plata en el valle: se paga en yerba»). Con la economía (ver
// PLAN_ECONOMIA.md) el valle tiene pesos: un saldo, un libro de movimientos y UNA sola puerta para cobrar y pagar. La yerba pasa a ser
// una mercadería más (se cebra mate, se cocina, se regala) y lo que ya se tenía de yerba se convirtió a pesos, a $100 cada una, una vez.
//
// Módulo puro (sin DOM ni three; se prueba en Node). Sólo en el Relax: en el Desafío no hay economía (`hayEconomia` da falso).
//   · `progreso.economia = { pesos, libro, migrada, ganado, gastado }`;
//   · el libro guarda los últimos movimientos: { dia, monto (con signo), motivo, con };
//   · todo cobro y pago pasa por `cobrar` y `pagar`: nadie toca el saldo a mano.

export const PESOS_POR_YERBA = 100;
export const MAX_PESOS = 99999999;
export const LIBRO_MAX = 120;

const entero = (v, max = MAX_PESOS) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };
const texto = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').slice(0, max) : '');
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const diaDe = (p) => Math.max(1, Math.floor(Number(p?.dia) || 1));

export const economiaNueva = () => ({ pesos: 0, libro: [], migrada: true, ganado: 0, gastado: 0 });

// Lo guardado, saneado: enteros no negativos con techo, un libro corto de movimientos bien formados. `migrada` falsa (o ausente) quiere
// decir «partida de antes de la economía»: la yerba todavía hay que convertirla (ver `convertirYerba`).
export function sanearEconomia(v) {
  if (!objeto(v)) return { ...economiaNueva(), migrada: false };
  const libro = (Array.isArray(v.libro) ? v.libro : [])
    .filter((m) => objeto(m) && Number.isFinite(Number(m.monto)) && Math.floor(Number(m.monto)) !== 0)
    .map((m) => ({ dia: Math.max(1, entero(m.dia, 1e6) || 1), monto: Math.max(-MAX_PESOS, Math.min(MAX_PESOS, Math.floor(Number(m.monto)))), motivo: texto(m.motivo, 80), con: texto(m.con, 48) }))
    .slice(-LIBRO_MAX);
  return { pesos: entero(v.pesos), libro, migrada: v.migrada === true, ganado: entero(v.ganado, 1e12), gastado: entero(v.gastado, 1e12) };
}

export const hayEconomia = (progreso) => !!progreso && progreso.modo !== 'desafio' && objeto(progreso.economia);
export const pesosDe = (progreso) => (hayEconomia(progreso) ? entero(progreso.economia.pesos) : 0);
export const puedePagar = (progreso, monto) => hayEconomia(progreso) && entero(monto) > 0 && pesosDe(progreso) >= entero(monto);
export const yerbaEnPesos = (yerba) => Math.max(0, Math.floor(Number(yerba) || 0)) * PESOS_POR_YERBA;

// «$1.200» (con punto de miles). Los montos son enteros: un peso es lo menor que se mueve.
export function formatoPesos(monto) {
  const n = Math.floor(Math.abs(Number(monto) || 0));
  return `${Number(monto) < 0 ? '−' : ''}$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function anotar(e, dia, monto, motivo, con) {
  e.libro.push({ dia, monto, motivo: texto(motivo, 80), con: texto(con, 48) });
  while (e.libro.length > LIBRO_MAX) e.libro.shift();
}
// Cobrar `monto` pesos (por `motivo`, de `con`). Devuelve { ok, monto, saldo }; si lo que entra pasa del techo, entra hasta el techo.
export function cobrar(progreso, monto, motivo = '', con = '') {
  const n = entero(monto);
  if (!hayEconomia(progreso) || n <= 0) return { ok: false, monto: 0, saldo: pesosDe(progreso) };
  const e = progreso.economia, antes = entero(e.pesos), despues = Math.min(MAX_PESOS, antes + n), entra = despues - antes;
  e.pesos = despues; e.ganado = entero(e.ganado, 1e12) + entra;
  if (entra > 0) anotar(e, diaDe(progreso), entra, motivo, con);
  return { ok: entra > 0, monto: entra, saldo: despues };
}
// Pagar `monto` pesos. No deja el saldo en negativo: si no alcanza no se mueve nada y dice cuánto falta.
export function pagar(progreso, monto, motivo = '', con = '') {
  const n = entero(monto);
  if (!hayEconomia(progreso) || n <= 0) return { ok: false, monto: 0, saldo: pesosDe(progreso), faltan: n };
  const e = progreso.economia, antes = entero(e.pesos);
  if (antes < n) return { ok: false, monto: 0, saldo: antes, faltan: n - antes };
  e.pesos = antes - n; e.gastado = entero(e.gastado, 1e12) + n;
  anotar(e, diaDe(progreso), -n, motivo, con);
  return { ok: true, monto: n, saldo: e.pesos };
}
// Los últimos `n` movimientos, del más nuevo al más viejo.
export const ultimosMovimientos = (progreso, n = 12) => (hayEconomia(progreso) ? progreso.economia.libro.slice(-Math.max(1, n)).reverse() : []);

// Lo que muestra la billetera: el saldo, lo ganado y gastado en total y los últimos movimientos (del más nuevo al más viejo).
export function resumenBilletera(progreso, n = 14) {
  if (!hayEconomia(progreso)) return { hay: false, saldo: 0, ganado: 0, gastado: 0, movimientos: [] };
  const e = progreso.economia;
  return { hay: true, saldo: pesosDe(progreso), ganado: entero(e.ganado, 1e12), gastado: entero(e.gastado, 1e12), movimientos: ultimosMovimientos(progreso, n) };
}
// La diferencia entre dos saldos, para el aviso del HUD: «+$400», «−$200» (vacío si no cambió).
export const textoDiferencia = (antes, despues) => { const d = Math.floor(Number(despues) || 0) - Math.floor(Number(antes) || 0); return d === 0 ? '' : `${d > 0 ? '+' : ''}${formatoPesos(d)}`; };

// La conversión de la yerba a pesos: una sola vez por partida (`migrada`). Lo que había de yerba se pasa a $100 cada una y la yerba
// queda en cero (después se vuelve a conseguir como mercadería, en el almacén). Devuelve los pesos que entraron (0 si ya estaba hecha).
export function convertirYerba(progreso) {
  if (!hayEconomia(progreso) || progreso.economia.migrada === true) return 0;
  const yerba = progreso.cosas && typeof progreso.cosas === 'object' ? Math.max(0, Math.floor(Number(progreso.cosas.yerba) || 0)) : 0;
  progreso.economia.migrada = true;
  if (!yerba) return 0;
  const r = cobrar(progreso, yerbaEnPesos(yerba), 'Tu yerba pasó a pesos', 'El valle');
  delete progreso.cosas.yerba;
  return r.monto;
}
