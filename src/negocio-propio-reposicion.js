// 4.4.1 · REPOSICIÓN DE LOS ESTANTES DEL LOCAL PROPIO: reglas (módulo puro, se prueba en Node). Dos maneras de que los estantes no se queden pelados sin que vos
// los surtas a mano:
//
//   A. EL EMPLEADO REPONE DESDE TUS DEPÓSITOS (cuando vos no estás): al empezar su turno, el que está de turno agarra de los depósitos con tope que tengas cerca del
//      local (la barraca de materiales, la pila y el depósito de piedra, el silo) lo que le falta a los estantes y lo lleva al mostrador. Lo que repone SALE de verdad
//      del depósito. Sólo se repone lo que esos depósitos guardan Y el local vende (en el almacén de campo: troncos, tablas, piedras, lana y papas; la panadería
//      vende cosas que no se guardan en depósitos, así que ahí no aplica). Trabaja de a lotes del mercado (`lote` de comercio.js): cuántos por turno depende de su
//      rendimiento (de 5 a 8), siempre el estante más vacío primero, uno por vez, y sólo los que están por debajo del 60 % del tope.
//   B. EL PEDIDO AL PROVEEDOR (botón del panel, estés o no): compra lo que falta a precio de plaza MÁS UN RECARGO (20 %), hasta llenar los estantes y hasta un tope
//      diario de pesos; se paga de la caja del local y, si no alcanza, de tu billetera (motivo «Proveedor»). Es una comodidad cara: el precio normal del local
//      (plaza + 15 %) no cubre el recargo, así que sólo conviene para no perder clientes por un estante vacío, o con precios caros.
import { BIENES } from './comercio.js';
import { ALMACENES, IDS_ALMACEN } from './almacen.js';
import { catalogo, topeEstante, precioPlaza, TIPOS, fijarProv, marcarProveedor } from './negocio-propio.js';
import { pagar, pesosDe, hayEconomia, formatoPesos } from './economia.js';
import { anotarFin } from './negocio-propio-gastos.js';

const entero = (v, max = 1e7) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };

// ---------------------------------------------------------------- A. el empleado repone desde los depósitos
export const REPOSICION = { radio: 45, lotesBase: 1, lotesPorRend: 7, llenuraMax: 0.6 };   // radio: metros desde el local a los que busca depósitos
// Qué depósitos guardan esa cosa (los que no son del herramientero): { 'papa': ['silo'], 'piedra': ['pila-piedra', 'deposito-piedra', 'barraca'], … }
export const depositosPara = (k) => IDS_ALMACEN.filter((id) => ALMACENES[id].tipo !== 'herramienta' && ALMACENES[id].guarda.includes(k));
// Lo que un local puede recibir de los depósitos: lo que vende Y se guarda en alguno
export const reponibles = (tipo) => catalogo(tipo).filter((k) => depositosPara(k).length > 0);
export const lotesPorTurno = (rend) => Math.max(1, Math.round(REPOSICION.lotesBase + REPOSICION.lotesPorRend * Math.max(0, Math.min(1, Number(rend) || 0))));
export const aplicaReposicion = (tipo) => reponibles(tipo).length > 0;

// Reponer los estantes de `est` con `rend` (el rendimiento de quien trabaja, 0 a 1). `dep`: { hay(k) → unidades de k en los depósitos cerca del local, sacar(k, n) → cuántas
// sacó de verdad }. Vuelve { puesto: [{ k, n }], lotes } (vacío si nada hacía falta o no había nada).
export function reponerDesdeDepositos(est, tipo, rend, dep) {
  const hecho = {};
  let lotes = lotesPorTurno(rend), usados = 0;
  if (!est?.tipo || est.tipo !== tipo || !dep) return { puesto: [], lotes: 0 };
  const ks = reponibles(tipo);
  const agotado = new Set();
  while (lotes > 0) {
    // el estante más vacío (como fracción del tope) que todavía necesita y tiene de dónde
    let mejor = null, fm = 2;
    for (const k of ks) {
      if (agotado.has(k)) continue;
      const tope = topeEstante(k), hay = entero(est.stock[k]), f = tope > 0 ? hay / tope : 1;
      if (f >= REPOSICION.llenuraMax && !(hecho[k] > 0)) continue;   // (sólo arranca con los que están por debajo del 60 %; una vez que arranca, sigue hasta el tope)
      if (hay >= tope) { agotado.add(k); continue; }
      if (f < fm) { fm = f; mejor = k; }
    }
    if (!mejor) break;
    const k = mejor, falta = topeEstante(k) - entero(est.stock[k]), quiere = Math.min(BIENES[k].lote, falta), disp = entero(dep.hay(k));
    if (disp <= 0) { agotado.add(k); continue; }
    const sacado = entero(dep.sacar(k, Math.min(quiere, disp)));
    if (sacado <= 0) { agotado.add(k); continue; }
    fijarProv(est, k);   // 4.4.2: (la marca del proveedor se ajusta a lo que queda antes de sumar lo tuyo)
    est.stock[k] = entero(est.stock[k]) + sacado;
    hecho[k] = (hecho[k] || 0) + sacado;
    lotes--; usados++;
  }
  return { puesto: Object.entries(hecho).map(([k, n]) => ({ k, n })), lotes: usados };
}
export function sumarRepuesto(acum, puesto) { for (const x of puesto) acum[x.k] = (acum[x.k] || 0) + x.n; return acum; }

// ---------------------------------------------------------------- B. el pedido al proveedor
export const PROVEEDOR = { recargo: 0.20, topeDia: 3000 };
export const precioProveedor = (k) => Math.max(1, Math.round(precioPlaza(k) * (1 + PROVEEDOR.recargo)));
const gastadoHoy = (est, dia) => (est.fin?.prov && est.fin.prov.dia === dia ? entero(est.fin.prov.gastado) : 0);
export const topeRestante = (est, dia) => Math.max(0, PROVEEDOR.topeDia - gastadoHoy(est, dia));

// Lo que se pediría hoy: reparte lote a lote entre los estantes más vacíos, sin pasar del tope de cada estante, del tope diario ni de la plata que tenés (caja + billetera).
// Vuelve { items: [{ k, n, pu, sub }], total, plaza (lo que valdría sin recargo), recargo (pesos de recargo), hoyRestante, limite: 'lleno' | 'tope' | 'plata' | null }
export function presupuestoProveedor(est, p, dia) {
  const vacio = { items: [], total: 0, plaza: 0, recargo: 0, hoyRestante: 0, limite: null };
  if (!est?.tipo || !TIPOS[est.tipo]) return vacio;
  const restante = topeRestante(est, dia), plata = entero(est.caja, 1e8) + pesosDe(p);
  let libre = Math.min(restante, plata), total = 0, limite;
  const ks = catalogo(est.tipo), cant = {};
  for (;;) {
    let mejor = null, fm = 2, cm = Infinity;
    for (const k of ks) {
      const tope = topeEstante(k), hay = entero(est.stock[k]) + (cant[k] || 0);
      if (hay >= tope) continue;
      if (precioProveedor(k) > libre) continue;
      const f = hay / tope, costo = precioProveedor(k) * Math.min(BIENES[k].lote, tope - hay);
      // el más vacío primero; a igual llenura, el más barato (así el pedido reparte entre más productos y trae más variedad)
      if (f < fm - 1e-9 || (Math.abs(f - fm) <= 1e-9 && costo < cm)) { fm = f; cm = costo; mejor = k; }
    }
    if (!mejor) break;
    const k = mejor, tope = topeEstante(k), hay = entero(est.stock[k]) + (cant[k] || 0), pu = precioProveedor(k);
    const n = Math.max(1, Math.min(BIENES[k].lote, tope - hay, Math.floor(libre / pu)));
    cant[k] = (cant[k] || 0) + n; libre -= n * pu; total += n * pu;
  }
  const items = ks.filter((k) => cant[k] > 0).map((k) => ({ k, n: cant[k], pu: precioProveedor(k), sub: cant[k] * precioProveedor(k) }));
  const plazaTotal = items.reduce((s, x) => s + x.n * precioPlaza(x.k), 0);
  const llenos = ks.every((k) => entero(est.stock[k]) + (cant[k] || 0) >= topeEstante(k));
  limite = llenos ? 'lleno' : (plata < restante ? 'plata' : 'tope');
  return { items, total, plaza: plazaTotal, recargo: total - plazaTotal, hoyRestante: restante, limite };
}
export const faltaSurtir = (est) => !!est?.tipo && catalogo(est.tipo).some((k) => entero(est.stock[k]) < topeEstante(k));

// Hace el pedido: se paga de la caja y, si no alcanza, de la billetera («Proveedor»); los estantes se llenan. Vuelve { ok, motivo?, items, total, deCaja, deBilletera }.
export function pedirAlProveedor(p, est, dia) {
  if (!hayEconomia(p) || !est?.tipo) return { ok: false, motivo: 'sin-local', items: [], total: 0, deCaja: 0, deBilletera: 0 };
  const pres = presupuestoProveedor(est, p, dia);
  if (!pres.items.length || pres.total <= 0) {
    return { ok: false, motivo: !faltaSurtir(est) ? 'lleno' : pres.hoyRestante <= 0 ? 'tope' : 'plata', items: [], total: 0, deCaja: 0, deBilletera: 0 };
  }
  const deCaja = Math.min(entero(est.caja, 1e8), pres.total), resto = pres.total - deCaja;
  if (resto > 0) {
    const r = pagar(p, resto, 'Proveedor', TIPOS[est.tipo].corto);
    if (!r.ok) return { ok: false, motivo: 'plata', items: [], total: 0, deCaja: 0, deBilletera: 0 };
  }
  est.caja -= deCaja;
  for (const x of pres.items) {
    fijarProv(est, x.k);
    const antes = entero(est.stock[x.k]);
    est.stock[x.k] = Math.min(topeEstante(x.k), antes + x.n);
    marcarProveedor(est, x.k, est.stock[x.k] - antes);   // 4.4.2: lo que viene del proveedor se vende, pero no se saca del estante
  }
  const fin = est.fin;
  if (fin.prov.dia !== dia) { fin.prov.dia = dia; fin.prov.gastado = 0; }
  fin.prov.gastado += pres.total; fin.total.proveedor += pres.total;
  anotarFin(est, dia, 'proveedor', pres.total);
  return { ok: true, items: pres.items, total: pres.total, plaza: pres.plaza, recargo: pres.recargo, deCaja, deBilletera: resto };
}
export const textoPedido = (pres) => (pres.items.length
  ? `${formatoPesos(pres.plaza)} de mercado + ${formatoPesos(pres.recargo)} de recargo (${Math.round(PROVEEDOR.recargo * 100)} %) = ${formatoPesos(pres.total)}`
  : 'no hay nada que pedir ahora');
