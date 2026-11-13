// 3.8.8 · Economía, Fase 4: pedidos de los vecinos. Cada local de la aldea te pide algo concreto cada tres días (una «ventana»):
// una cantidad de una cosa que se consigue en el valle o comprando en los puestos. Pagan un poco más que lo que cuesta, un diez por
// ciento más si lo entregás el primer día de la ventana, y cuanto más cumplís mejor es tu reputación con él: crece la cantidad, aparecen
// cosas mejores y sube lo que pagan. El pago sale de la caja del local (aldea-viva.js); hay un tope de entregas por día. Un pedido no
// cumplido simplemente vence: el Relax no castiga. Los pedidos salen de la fecha y del vecino, sin guardar nada hasta que se entrega
// (se anota sólo cuál fue el último). Módulo puro, sin imports de la aldea. Sólo en el Relax.
import { BIENES, perfilDe, bienesDe, hashTexto, azarDe } from './comercio.js';
import { negociosDe, caja, nivelRep, TOPE_CAJA } from './negocios.js';
import { cobrar, formatoPesos, hayEconomia } from './economia.js';
// 4.26.0: para saber qué se consigue en la partida (los puestos de ruta arreglados y lo que da la granja propia)
import { PUESTOS_RUTA, IDS_PUESTOS, ETAPAS_TOTAL } from './puestos-ruta.js';
import { FRUTALES } from './granja.js';

export const PEDIDOS = { dias: 3, porDia: 2, base: 1.1, porNivel: 0.04, rapido: 0.05, repPorEntrega: 1 };
// 4.26.1: la regla de la 4.26.0 (sólo pide lo que se consigue), dicha en pantalla: una línea gris debajo del pedido del vecino en la charla
// (`pie` de la parte del pedido; aldea.js la lleva a `pies` y main.js `mostrarCharla` la pone en #charla-pie)
export const REGLA_PEDIDOS = 'Sólo pide lo que se consigue: lo del valle, lo de los puestos que conocés o lo que producís vos.';

// Lo que necesita cada local, de más corriente a más rara (las dos últimas sólo con confianza: nivel 2)
const NECESITA = {
  carpintero: ['tronco', 'piedra', 'lana', 'chorizo'], panadera: ['harina', 'huevo', 'miel', 'leche'], herrero: ['piedra', 'tronco', 'cristal', 'carne-vaca'],
  pescador: ['tronco', 'lana', 'pan-casero', 'mermelada-manzana'], maestra: ['papa', 'pan-casero', 'frasco-frutilla', 'manzana'], enfermera: ['miel', 'lana', 'frasco-frutilla', 'leche'],
  telegrafista: ['tronco', 'pan-casero', 'empanadas', 'chorizo'], tejedora: ['lana', 'frutilla', 'poncho', 'carne-cordero'], apicultor: ['tabla', 'frasco-frutilla', 'harina', 'mermelada-frambuesa'],
  guardaparque: ['trucha-ahumada', 'tronco', 'hongos-secos', 'carne-cordero'], musico: ['tabla', 'empanadas', 'miel', 'carne-cerdo'], veterinaria: ['huevo', 'lana', 'haba', 'leche'],
  herbolaria: ['miel', 'calafate-seco', 'hongos-secos', 'grosella'], modista: ['lana', 'poncho', 'cristal', 'ciruela'], botera: ['tabla', 'tronco', 'lana', 'carne-vaca'],
  pintora: ['cristal', 'frutilla', 'calafate-seco', 'cereza'], andinista: ['trucha-ahumada', 'pan-casero', 'empanadas', 'chorizo'], fotografa: ['cristal', 'miel', 'papa', 'cereza'],
  ceramista: ['piedra', 'haba', 'papa', 'ciruela'], astronoma: ['cristal', 'empanadas', 'miel', 'mermelada-frambuesa'],
};
// 4.23.0: la cuarta cosa de cada lista es lo de la granja y la cocina: la piden los que ya te tienen confianza (nivel 3); antes de eso, las tres de siempre
// (4.26.0: la 4.23.0 decía «todas se consiguen en algún puesto de la trochita», pero miraba los perfiles y no las paradas que hay de verdad en el
// valle del Relax: sólo la leche, la carne de vaca y la de cerdo se venden ahí. Ahora la piden sólo si la podés conseguir: ver `seConsigue`)
const DE_LA_ESTACION = new Set(perfilDe('Aldea de los Duendes').produce);
export const hayPedidos = (k) => Object.hasOwn(NECESITA, k);
export const ventanaDe = (dia) => Math.floor((Math.max(1, Math.floor(Number(dia) || 1)) - 1) / PEDIDOS.dias);
const TIPO_DE = { material: 'material', entrada: 'entrada', cosa: 'cosa' };

// ---------------------------------------------------------------- 4.26.0: sólo lo que se puede conseguir
// La regla: un vecino te pide una cosa sólo si en ESA partida la podés conseguir de verdad. Hay tres caminos:
//   1. Es del valle: se junta, se cultiva o se hace con las obras de siempre (huerta, tendal, horno, ahumadero, colmena, gallinero) y casi todo
//      se vende además en las paradas. Son las tres cosas de siempre de cada lista (las de la 3.8.8), menos los cristales.
//   2. Se vende en un puesto a tu alcance y el puesto te lo vende: las cuatro paradas de la trochita del Relax (el valle es uno solo: siempre
//      las mismas) y los puestos de ruta que ya arreglaste. Lo que se anota en el cuaderno (la leche, la carne…) el puesto lo vende sólo si ya
//      lo conocés (comercio-mundo.js, `conocido`): sin la anotación no se puede comprar.
//   3. Lo producís vos: la vaca (leche; y carne de vaca, con los terneros), la chancha (carne de cerdo y chorizo), la paridera (cordero),
//      el frutal de esa fruta; la mermelada, con el frutal de su fruta y si ya sabés hacerla (la receta, o ya hiciste esa).
// Lo que no entra en ninguno no se pide (antes, con 16 pedidos cumplidos, un vecino te podía pedir leche, cordero o cerezas aunque no
// tuvieras granja: en el valle del Relax nadie vende cordero, chorizo, fruta ni mermelada, y la leche sólo si ya la conocés; y desde la
// 3.8.8 la pintora, la fotógrafa y la astrónoma pedían cristales, que en el Relax sólo venden los puestos de la Cantera y del Paso).
// La paga es la de siempre. Los cambios de la cocina con los vecinos (una vez por día) no cuentan: son para cocinar, no para abastecer.
export const PARADAS_DEL_VALLE = ['Estación del Valle', 'Parada del Mallín', 'Parada Arrayanes', 'Aldea de los Duendes'];
export const DEL_VALLE = new Set(['tronco', 'tabla', 'piedra', 'lana', 'harina', 'poncho', 'huevo', 'miel', 'pan-casero', 'empanadas', 'papa', 'haba', 'frutilla',
  'trucha-ahumada', 'hongos-secos', 'calafate-seco', 'frasco-frutilla']);
const lista0 = (v) => (Array.isArray(v) ? v : []);
const encargado = (g, que) => lista0(g?.encargos).some((e) => e && e.que === que);
const conChancha = (g) => !!g?.chancha || lista0(g?.lechones).length > 0 || encargado(g, 'capon');
const DE_LA_GRANJA = {
  leche: (g) => !!g?.vaca,
  'carne-vaca': (g) => !!g?.vaca || lista0(g?.terneros).length > 0 || encargado(g, 'novillo'),
  'carne-cerdo': conChancha,
  chorizo: conChancha,
  'carne-cordero': (g) => (Number(g?.paridera) || 0) > 0 || lista0(g?.corderos).length > 0 || encargado(g, 'cordero'),
};
// ¿Tenés plantado un frutal que da esta fruta?
function tenesFrutal(p, fruta) {
  const f = p?.granja?.frutales;
  if (!f || typeof f !== 'object') return false;
  return Object.values(f).some((x) => x && Object.hasOwn(FRUTALES, x.especie) && FRUTALES[x.especie].fruta === fruta);
}
// Los puestos donde hoy podés comprar (nombres del mercado)
export function puestosATuAlcance(p) {
  const r = p?.puestosRuta;
  const arreglados = IDS_PUESTOS.filter((id) => (Math.floor(Number(r?.[id]?.etapa)) || 0) >= ETAPAS_TOTAL).map((id) => PUESTOS_RUTA[id].nombre);
  return [...PARADAS_DEL_VALLE, ...arreglados];
}
// ¿Te lo vende algún puesto a tu alcance?
export function seCompra(p, bien) {
  if (!BIENES[bien]) return false;
  if (BIENES[bien].donde === 'entrada' && !p?.entradas?.[bien]) return false;
  return puestosATuAlcance(p).some((nombre) => bienesDe(nombre).includes(bien));
}
// ¿Lo producís vos?
export function loProducis(p, bien) {
  if (Object.hasOwn(DE_LA_GRANJA, bien)) return DE_LA_GRANJA[bien](p?.granja);
  if (Object.values(FRUTALES).some((f) => f.fruta === bien)) return tenesFrutal(p, bien);
  const m = /^mermelada-(.+)$/.exec(bien);
  if (m) return tenesFrutal(p, m[1]) && (!!p?.cocina?.sabe?.mermeladas || !!p?.entradas?.[bien]);
  return false;
}
// ¿Se puede conseguir en esta partida?
export const seConsigue = (p, bien) => !!BIENES[bien] && (DEL_VALLE.has(bien) || seCompra(p, bien) || loProducis(p, bien));

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
  // (4.23.0: la cuarta cosa, la de la granja, sólo cuenta desde el nivel 3: antes de eso la lista es la de siempre, las tres primeras)
  const lista = nivel >= 3 ? NECESITA[k] : NECESITA[k].slice(0, 3);
  const sinEstacion = lista.filter((b) => !DE_LA_ESTACION.has(b));
  // (4.26.0: y sólo lo que se consigue en esta partida, ver `seConsigue`; si es lo mismo de antes, sale la misma elección)
  const pool = (sinEstacion.length ? sinEstacion : lista).slice(0, nivel >= 3 ? 4 : nivel >= 2 ? 3 : 2).filter((b) => seConsigue(p, b));
  if (!pool.length) return null;
  let bien = pool[Math.floor(r() * pool.length) % pool.length];
  // (4.26.0: lo que te pide en una ventana queda fijo la primera vez que se calcula: si a mitad de la ventana plantás un frutal o conocés
  // la leche, no cambia de idea. `fijos` es optativo en el guardado)
  const fijo = n.fijos?.[k];
  if (fijo && fijo.id === id && NECESITA[k].includes(fijo.k)) bien = fijo.k;
  else { n.fijos = n.fijos && typeof n.fijos === 'object' ? n.fijos : {}; n.fijos[k] = { id, k: bien }; }
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
  // (4.26.5: «2 frascos de miel», no «2 de frascos de miel»: los nombres ya son los plurales, «medidas de harina», «litros de leche»)
  const lo = `${q.n} ${nombreCosa(q.k)}`;
  const hasta = `hasta el día ${q.limite}`;
  if (v.ok) {
    return {
      partes: [`¡Justo lo que necesitaba! ${lo.charAt(0).toUpperCase()}${lo.slice(1)}.`, `Te pago ${formatoPesos(q.premio)}${q.rapido ? ', con un extra por la rapidez' : ''}.`],
      seguir,
      efectos: [efectoDe(q.k, -q.n), { tipo: 'pedido', k, n: q.premio, motivo: `Pedido: ${nombreCosa(q.k)}`, con: nombre }],
      titulo: `Pedido cumplido: ${formatoPesos(q.premio)}`,
    };
  }
  if (v.motivo === 'cupo') return { partes: [`Tengo para pagarte el pedido de ${lo}, pero hoy ya entregaste dos. Volvé mañana (${hasta}).`], aviso: true, pie: REGLA_PEDIDOS };
  if (v.motivo === 'caja') return { partes: [`Necesito ${lo}, pero hoy no tengo con qué pagarte. Pasá en unos días (${hasta}).`], aviso: true, pie: REGLA_PEDIDOS };
  return { partes: [`Ando necesitando ${lo} (${hasta}). Lo pago ${formatoPesos(q.premio)}${q.rapido ? ' si me lo traés hoy, con un extra por la rapidez' : ''}.`], aviso: true, pie: REGLA_PEDIDOS };
}
