// 4.25.2 (M4): lo comprado en la trochita no se revende con ganancia segura en tus negocios (la tienda de campo y el puesto de la feria).
//
// El tope de la 3.8.8 sólo miraba lo que hace barato la estación de la Aldea: comprar pan, empanadas, miel o trucha ahumada en la parada
// que los hace (a ~52-78 % del valor) y dejarlos en la tienda (que paga ~96 %) ganaba siempre. Bajar lo que pagan los negocios por esas
// cosas habría castigado también lo que hacés vos (el horno, el telar: 4.23.0 «lo que se produce vale»). Entonces se lleva la cuenta de
// lo comprado en el tren: cuántas unidades de cada cosa y cuánto se pagó por ellas. Al dejar mercadería en la tienda o en la consigna,
// lo que sale de esa cuenta va marcado con su costo, y cada lote marcado se cobra, como mucho, lo que costó (sin ganancia, sin pérdida).
// Lo tuyo se sigue pagando como siempre.
//
// La cuenta (en `progreso.negocios.reventa`): { [bien]: { u: unidades, pesos: lo pagado por esas unidades } }.
// Lo marcado en un negocio (`tienda.reventa`, `puesto.reventa`): { [bien]: { lotes, pesos } }.
// Si no se sabe de dónde salió una unidad (compraste diez, comiste algunas y horneaste otras), se cuenta como comprada: la cuenta nunca
// pasa de lo que tenés en la mochila al momento de dejar.
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0));
const claveOk = (k) => typeof k === 'string' && k.length > 0 && k.length <= 40;
export const TOPE_UNIDADES = 9999, TOPE_PESOS = 1e8;

// La cuenta de la partida (la crea si hace falta; null sin `negocios`)
function cuenta(p, crear = false) {
  const n = p?.negocios;
  if (!objeto(n)) return null;
  if (!objeto(n.reventa)) { if (!crear) return null; n.reventa = {}; }
  return n.reventa;
}
// Compraste `unidades` de `bien` en una parada por `pesos`
export function anotarCompraTren(p, bien, unidades, pesos) {
  const c = cuenta(p, true);
  if (!c || !claveOk(bien) || !(unidades > 0)) return;
  const x = objeto(c[bien]) ? c[bien] : { u: 0, pesos: 0 };
  c[bien] = { u: Math.min(TOPE_UNIDADES, x.u + Math.floor(unidades)), pesos: Math.min(TOPE_PESOS, x.pesos + Math.max(0, Math.round(Number(pesos) || 0))) };
}
// Lo que sale de la cuenta (vendido en una parada, o dejado en un negocio): saca `unidades` con su parte de lo pagado y la devuelve
function sacar(p, bien, unidades) {
  const c = cuenta(p);
  const x = c && objeto(c[bien]) ? c[bien] : null;
  if (!x || x.u <= 0 || !(unidades > 0)) return { u: 0, pesos: 0 };
  const u = Math.min(x.u, Math.floor(unidades));
  const pesos = Math.round((x.pesos * u) / x.u);
  x.u -= u; x.pesos = Math.max(0, x.pesos - pesos);
  if (x.u <= 0) delete c[bien];
  if (!Object.keys(c).length) delete p.negocios.reventa;   // (vacía no se guarda: una partida sin compras queda como antes)
  return { u, pesos };
}
// (Vender en una parada no saca nada de la cuenta: si no, se vendería lo propio en el tren para dejar lo comprado como si fuera propio.
// La cuenta se recorta sola a lo que tenés: `ajustarATengo`.)
// La cuenta nunca pasa de lo que tenés (`tengo` = lo que hay en la mochila de esa cosa)
export function ajustarATengo(p, bien, tengo) {
  const c = cuenta(p);
  const x = c && objeto(c[bien]) ? c[bien] : null;
  if (x && x.u > Math.max(0, Math.floor(Number(tengo) || 0))) sacar(p, bien, x.u - Math.max(0, Math.floor(Number(tengo) || 0)));
}
// Dejás `lotes` lotes (de `lote` unidades) de `bien` en un negocio cuyo registro es `marcas` (`tienda.reventa`/`puesto.reventa`).
// `tengo`: lo que había en la mochila ANTES de dejar. Marca los lotes enteros que salen de lo comprado (lo que no llega a un lote
// vuelve a la cuenta: cuenta para la próxima vez que dejes). Devuelve cuántos lotes marcó.
export function marcarAlDejar(p, marcas, bien, lotes, lote, tengo) {
  if (!objeto(marcas) || !(lotes >= 1) || !(lote >= 1)) return 0;
  ajustarATengo(p, bien, tengo);
  const s = sacar(p, bien, lotes * lote);
  if (s.u <= 0) return 0;
  const n = Math.min(Math.floor(lotes), Math.floor(s.u / lote));
  const pesosN = n > 0 ? Math.round((s.pesos * n * lote) / s.u) : 0;
  if (s.u > n * lote) anotarCompraTren(p, bien, s.u - n * lote, s.pesos - pesosN);
  if (n <= 0) return 0;
  const x = objeto(marcas[bien]) ? marcas[bien] : { lotes: 0, pesos: 0 };
  marcas[bien] = { lotes: x.lotes + n, pesos: Math.min(TOPE_PESOS, x.pesos + pesosN) };
  return n;
}
// Se vende un lote de `bien` que normalmente se pagaría `precio`: si es uno marcado, paga como mucho lo que costó (redondeado a 10 hacia abajo)
export function precioDelLote(marcas, bien, precio) {
  const x = objeto(marcas) && objeto(marcas[bien]) ? marcas[bien] : null;
  if (!x || x.lotes <= 0) return precio;
  const costo = x.pesos / x.lotes;
  x.lotes -= 1; x.pesos = Math.max(0, x.pesos - costo);
  if (x.lotes <= 0) delete marcas[bien];
  return Math.min(precio, Math.floor(costo / 10) * 10);
}
// Sacás `lotes` de un negocio: los marcados vuelven a la cuenta primero
export function devolverAlSacar(p, marcas, bien, lotes, lote) {
  const x = objeto(marcas) && objeto(marcas[bien]) ? marcas[bien] : null;
  if (!x || x.lotes <= 0 || !(lotes >= 1)) return;
  const n = Math.min(x.lotes, Math.floor(lotes));
  const pesos = (x.pesos * n) / x.lotes;
  x.lotes -= n; x.pesos = Math.max(0, x.pesos - pesos);
  if (x.lotes <= 0) delete marcas[bien];
  anotarCompraTren(p, bien, n * lote, pesos);
}
// Saneo: la cuenta de la partida
export function sanearCuentaReventa(v) {
  const r = {};
  if (!objeto(v)) return r;
  for (const [k, x] of Object.entries(v)) {
    if (!claveOk(k) || !objeto(x) || Object.keys(r).length >= 80) continue;
    const u = entero(x.u, TOPE_UNIDADES);
    if (u > 0) r[k] = { u, pesos: entero(x.pesos, TOPE_PESOS) };
  }
  return r;
}
// Saneo: las marcas de un negocio, nunca más lotes que los que hay en `stock`
export function sanearMarcasReventa(v, stock) {
  const r = {};
  if (!objeto(v) || !objeto(stock)) return r;
  for (const [k, x] of Object.entries(v)) {
    if (!claveOk(k) || !objeto(x) || !(Number(stock[k]) > 0)) continue;
    const lotes = Math.min(entero(x.lotes, 999), Math.floor(Number(stock[k])));
    if (lotes > 0) r[k] = { lotes, pesos: entero(x.pesos, TOPE_PESOS) };
  }
  return r;
}
