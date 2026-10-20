// 4.2: los pesos como costo de construcción, para cualquier plano. Hasta la 4.1 sólo las tres casas (cabaña, casa con galería y
// casona) pedían pesos, con la cuenta metida en propiedad.js. Acá queda la maquinaria común, sin saber de casas ni de planos:
//   · un REGISTRO de precios por plano (id → pesos de cada etapa) que llenan quien conoce los precios: construccion.js con lo que
//     cada plano declara (`pesos: N` en el plano, o `pesos: N` en una etapa, junto a `pide`) y propiedad.js con las casas;
//   · `puedePagarEtapa` / `pagarEtapa` / `devolverEtapasPagadas` / `reintegroAlDesmontar`, que son las de siempre (las re-exporta
//     propiedad.js con los mismos nombres);
//   · los textos del aviso (qué falta y cuánto), para que main.js y el panel digan lo mismo.
// Módulo puro (sólo economia.js): se prueba en Node. Sólo en el Relax: en el Desafío no hay economía y todo da cero.
import { cobrar, pagar, pesosDe, hayEconomia, formatoPesos } from './economia.js';

export const PESOS_MAX_POR_ETAPA = 5000000;
const REGISTRO = new Map();

const entero = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(PESOS_MAX_POR_ETAPA, n)) : 0; };

// Los precios de cada etapa de un plano, leídos de lo que declara: `etapas[i].pesos` manda; si ninguna etapa lo trae, `plano.pesos`
// es el total (una sola etapa: todo ahí; varias: se reparte con `plano.repartoPesos`, o parejo, y la última ajusta para que sume).
export function preciosDePlano(plano) {
  const etapas = Array.isArray(plano?.etapas) ? plano.etapas : [];
  const porEtapa = etapas.map((e) => entero(e?.pesos));
  if (porEtapa.some((n) => n > 0)) return porEtapa;
  const total = entero(plano?.pesos);
  if (!total || !etapas.length) return [];
  if (etapas.length === 1) return [total];
  const reparto = Array.isArray(plano.repartoPesos) && plano.repartoPesos.length === etapas.length && plano.repartoPesos.every((x) => x >= 0) ? plano.repartoPesos : etapas.map(() => 1);
  const suma = reparto.reduce((a, b) => a + b, 0) || 1;
  const parte = (j) => Math.round((total * reparto[j] / suma) / 50) * 50;
  const salida = reparto.slice(0, -1).map((_, j) => parte(j));
  salida.push(Math.max(0, total - salida.reduce((a, b) => a + b, 0)));
  return salida;
}

// Anotar los precios de un plano. `precios` es un arreglo con los pesos de cada etapa (cero si esa etapa no cuesta).
// `texto` (opcional): nombre para el libro y los avisos; `sujeto` y `verbo` para el aviso de «falta plata»; `pagaA` quién cobra;
// `reintegro` (0 a 1) la parte que vuelve al desmontar una pieza terminada (las casas: nada, así estaban).
export function registrarPrecios(id, precios, opciones = {}) {
  if (typeof id !== 'string' || !id) return false;
  const lista = (Array.isArray(precios) ? precios : []).map(entero);
  if (!lista.some((n) => n > 0)) return false;   // (sin precios no se anota nada: tampoco se pisa lo que ya había)
  const nombre = typeof opciones.nombre === 'string' && opciones.nombre ? opciones.nombre : id;
  REGISTRO.set(id, {
    precios: lista,
    nombre,
    motivoPago: opciones.motivoPago || `Mano de obra: ${nombre}`,
    motivoDevolucion: opciones.motivoDevolucion || `Devolución de la mano de obra: ${nombre}`,
    motivoReintegro: opciones.motivoReintegro || `Reintegro por desmontar: ${nombre}`,
    sujeto: opciones.sujeto || 'La mano de obra',
    verbo: opciones.verbo || 'cuesta',
    deLoPagado: opciones.deLoPagado || 'de la mano de obra',
    pagaA: opciones.pagaA || 'Los artesanos de la aldea',
    reintegro: Math.max(0, Math.min(1, Number(opciones.reintegro ?? 0.5) || 0)),
  });
  return true;
}
export function registrarPreciosDePlano(plano) {
  return registrarPrecios(plano?.id, preciosDePlano(plano), { nombre: String(plano?.nombre || plano?.id || '').toLowerCase(), pagaA: plano?.pagaA, reintegro: plano?.reintegro });
}
export const tienePrecio = (id) => typeof id === 'string' && REGISTRO.has(id);
export const preciosRegistrados = () => [...REGISTRO.keys()];

// Lo que se paga al empezar la etapa `i` (0 si no hay precio o `i` está fuera de las etapas)
export function precioDeEtapa(id, i) {
  const r = typeof id === 'string' ? REGISTRO.get(id) : null;
  if (!r || !Number.isInteger(i) || i < 0 || i >= r.precios.length) return 0;
  return r.precios[i];
}
export function precioTotal(id) {
  const r = typeof id === 'string' ? REGISTRO.get(id) : null;
  return r ? r.precios.reduce((a, b) => a + b, 0) : 0;
}
export const etapasConPrecio = (id) => (REGISTRO.get(id)?.precios.length || 0);

// ¿Se puede pagar la etapa?: { ok, precio } o { ok: false, precio, falta }
export function puedePagarEtapa(p, id, i) {
  const precio = hayEconomia(p) ? precioDeEtapa(id, i) : 0;
  if (!precio) return { ok: true, precio: 0 };
  const tengo = pesosDe(p);
  return tengo >= precio ? { ok: true, precio } : { ok: false, precio, falta: precio - tengo };
}
export function pagarEtapa(p, id, i, con) {
  const v = puedePagarEtapa(p, id, i);
  if (!v.ok || !v.precio) return v;
  const r = REGISTRO.get(id);
  const res = pagar(p, v.precio, r.motivoPago, con || r.pagaA);
  return res.ok ? v : { ok: false, precio: v.precio, falta: v.precio - pesosDe(p) };
}
// Al retirar una marca (Supr) que ya tenía etapas pagadas, lo pagado vuelve entero a la billetera. `pagadas` es hasta qué etapa se pagó.
export function devolverEtapasPagadas(p, id, pagadas, con = 'Los albañiles de la aldea') {
  const r = typeof id === 'string' ? REGISTRO.get(id) : null;
  if (!hayEconomia(p) || !r) return 0;
  let monto = 0;
  for (let i = 0; i < Math.max(0, Math.min(r.precios.length, pagadas | 0)); i++) monto += r.precios[i];
  if (monto <= 0) return 0;
  const res = cobrar(p, monto, r.motivoDevolucion, con);
  return res.ok ? res.monto : 0;
}
// Al desmontar una pieza terminada vuelve la parte `reintegro` (la mitad, como con los materiales) de lo que de verdad pagaste: sólo
// cuentan las etapas hechas Y pagadas (una pieza de una partida anterior al precio no devuelve plata que nunca se pagó).
// 4.4.2: cuánto sería, sin cobrar nada (para avisar el reintegro antes de confirmar el desmontaje)
export function montoReintegroAlDesmontar(id, etapasHechas, pagadas) {
  const r = typeof id === 'string' ? REGISTRO.get(id) : null;
  if (!r || !(r.reintegro > 0)) return 0;
  let monto = 0;
  for (let i = 0; i < Math.max(0, Math.min(r.precios.length, etapasHechas | 0, pagadas | 0)); i++) monto += r.precios[i];
  return Math.max(0, Math.floor((monto * r.reintegro) / 10) * 10);
}
export function reintegroAlDesmontar(p, id, etapasHechas, pagadas, con = 'Los artesanos de la aldea') {
  if (!hayEconomia(p)) return 0;
  const r = typeof id === 'string' ? REGISTRO.get(id) : null;
  const monto = montoReintegroAlDesmontar(id, etapasHechas, pagadas);
  if (!r || monto <= 0) return 0;
  const res = cobrar(p, monto, r.motivoReintegro, con);
  return res.ok ? res.monto : 0;
}

// ---------------------------------------------------------------- los textos
// «Los pesos de la etapa no alcanzan»: { titulo, detalle } para la nota del HUD. Las casas conservan su texto de siempre.
export function avisoSinPlata(id, pago, etapas = 1) {
  const r = REGISTRO.get(id);
  const sujeto = r?.sujeto || 'La mano de obra', verbo = r?.verbo || 'cuesta';
  return {
    titulo: etapas > 1 ? 'Falta plata para esta etapa' : 'Falta plata para esta pieza',
    detalle: `${sujeto} ${verbo} ${formatoPesos(pago.precio)} y te faltan ${formatoPesos(pago.falta)}. El banco te puede prestar`,
  };
}
// «del terreno y la mano de obra» / «de la mano de obra»: lo que vuelve al retirar la marca
export const textoDeLoPagado = (id) => REGISTRO.get(id)?.deLoPagado || 'de la mano de obra';
// Lo que falta, materiales y pesos juntos: «Faltan 2 tablas y $1.200» (`faltanMateriales` es la lista de faltan(); `pago` el de puedePagarEtapa)
export function listaDeFaltantes(faltanMateriales, pago) {
  const lista = [...(faltanMateriales || [])];
  if (pago && pago.ok === false && pago.falta > 0) lista.push(formatoPesos(pago.falta));
  return lista;
}
// El precio de una etapa para mostrarlo: «$12.000», o '' si no cuesta pesos (o no hay economía)
export function textoPrecio(p, id, i) {
  const precio = hayEconomia(p) ? precioDeEtapa(id, i) : 0;
  return precio ? formatoPesos(precio) : '';
}
// El total de pesos de un plano, 0 si no hay economía (el Desafío)
export const totalParaMostrar = (p, id) => (hayEconomia(p) ? precioTotal(id) : 0);
