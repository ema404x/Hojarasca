// 4.6: el tablón de encargos de la plaza (paquete 1a del mapa, ver PLAN_MAPA_VALOR.md, «Decisiones tras la auditoría»).
// Un tablón de madera en la plaza de la aldea con los encargos de los vecinos que piden cosas de lejos: junco y hierbas del
// mallín, arcilla de la desembocadura, lana y cuero del galpón de esquila, piedra de la cantera, piñones del pehuenal (en otoño),
// truchas de lo de Nicanor, calafates del arrayanal... Cambia por día:
//   · 3 encargos a la vista (salen de la fecha: no se guarda nada hasta que tomás uno);
//   · se toman con E en el tablón (hasta 2 a la vez) y se entregan ahí mismo, con lo pedido encima;
//   · 2 días de plazo (el día que lo tomaste y el siguiente): vencido, se borra sin castigo (el Relax no castiga);
//   · 1 entrega por día, aparte del tope de 2 pedidos de los vecinos (pedidos.js);
//   · pagan ×1,5 / ×2 / ×2,5 lo de un pedido del pueblo según la distancia a la plaza del lugar de donde sale la cosa
//     (hasta 350 m, hasta 550 m, más lejos), entre $700 y $2.200 por encargo: ~$1.000–2.000 por día sobre los ~$3.200 de hoy.
// Módulo puro (sin three ni DOM; se prueba en Node). Sólo en el Relax: sin economía (el Desafío) no hay tablón.
// Los materiales nuevos del paquete (junco, hierbas, arcilla, cuero, piedra-cantera) los define el agente «recursos» en
// MATERIALES y BIENES: acá van como texto y el tablón sólo ofrece lo que el juego conoce (`existe`, que pasa main.js), así
// anda antes y después de juntar las ramas.
import { BIENES, esBien, hashTexto, azarDe } from './comercio.js';
import { cobrar, hayEconomia } from './economia.js';
import { PEDIDOS } from './pedidos.js';

export const TABLON = {
  aLaVista: 3,          // encargos a la vista por día
  entregasPorDia: 1,    // entregas por día (aparte de los pedidos de los vecinos)
  plazo: 2,             // días para entregarlo (el que lo tomaste cuenta)
  tomadosMax: 2,        // cuántos se pueden tener tomados a la vez
  pagoMin: 700, pagoMax: 2200,
  // [hasta cuántos metros de la plaza, cuánto paga] (×1,5 / ×2 / ×2,5 lo de un pedido del pueblo)
  tramos: [[350, 1.5], [550, 2], [Infinity, 2.5]],
};
// La plaza del pueblo (Aldea de los Duendes), donde está el tablón (AUDITORIA_MAPA_VALOR.md, 1.2)
export const PLAZA = { x: 40, z: -379 };
// De dónde sale cada cosa (coordenadas fijas: las de la auditoría, calidad media; ver AUDITORIA_MAPA_VALOR.md 1.2 y 4.1)
export const ORIGENES = {
  mallin: { nombre: 'el mallín', x: -260, z: -240 },
  galpon: { nombre: 'el galpón de esquila', x: 228, z: -110 },
  desembocadura: { nombre: 'la desembocadura del arroyo', x: 66, z: 44 },
  cabana: { nombre: 'la cabaña de Nicanor', x: 185, z: 15 },
  cantera: { nombre: 'la cantera', x: -405, z: -305 },
  pehuenal: { nombre: 'el pehuenal del mirador', x: -292, z: 36 },
  arrayanes: { nombre: 'el bosque de arrayanes', x: 266, z: 150 },
  puestoAlto: { nombre: 'el Puesto Alto', x: -276, z: 84 },
};
// Los materiales nuevos del paquete (los define el agente «recursos» en MATERIALES de construccion.js y BIENES de comercio.js).
// Hasta que existan, nada de lo que los pide o los vende aparece: `existeEnJuego` es lo que usa main.js como `existe`.
export const MATERIALES_ZONA = ['junco', 'hierbas', 'arcilla', 'cuero', 'piedra-cantera'];
export const existeEnJuego = (k, materiales = {}, bienes = BIENES) => typeof k === 'string' && (!MATERIALES_ZONA.includes(k) || Object.hasOwn(materiales || {}, k) || Object.hasOwn(bienes || {}, k));
export const distanciaAPlaza = (o) => Math.round(Math.hypot(o.x - PLAZA.x, o.z - PLAZA.z));
export function multiplicadorDe(origen) {
  const o = Object.hasOwn(ORIGENES, origen) ? ORIGENES[origen] : null;
  if (!o) return TABLON.tramos[0][1];
  const d = distanciaAPlaza(o);
  for (const [hasta, m] of TABLON.tramos) if (d <= hasta) return m;
  return TABLON.tramos[TABLON.tramos.length - 1][1];
}

// Lo que vale una unidad de cada cosa, en pesos. Si es uno de los bienes del mercado (comercio.js), lo de ahí (valor del lote
// / lote); si no (los materiales nuevos antes de juntar, los piñones o el calafate, que no se comercian), el de respaldo.
const VALOR_RESPALDO = { junco: 60, hierbas: 90, arcilla: 80, cuero: 300, 'piedra-cantera': 160, pinon: 50, calafate: 40 };
export function valorUnidad(k) {
  if (esBien(k)) { const b = BIENES[k]; return Math.max(10, Math.round((b.valor * 100) / b.lote)); }
  return Object.hasOwn(VALOR_RESPALDO, k) ? VALOR_RESPALDO[k] : 100;
}
// Dónde se guarda (para contar lo que tenés y descontarlo): 'material' (progreso.materiales), 'entrada' (lo juntado, progreso.
// entradas[k].cantidad) o 'cosa' (progreso.cosas). Los materiales nuevos van a `materiales`, como la piedra y la lana.
const DONDE_RESPALDO = {
  junco: 'material', hierbas: 'material', arcilla: 'material', cuero: 'material', 'piedra-cantera': 'material', pinon: 'entrada', calafate: 'entrada',
  yerba: 'cosa', sal: 'cosa', maiz: 'cosa', 'semillas-habas': 'cosa', 'semillas-papa': 'cosa', mosca: 'cosa', botas: 'cosa', tijera: 'cosa',
};
export const dondeDe = (k) => (esBien(k) ? BIENES[k].donde : Object.hasOwn(DONDE_RESPALDO, k) ? DONDE_RESPALDO[k] : 'material');
// Cómo se dice: [uno, varios]
const NOMBRES = {
  junco: ['atado de junco', 'atados de junco'], hierbas: ['manojo de hierbas', 'manojos de hierbas'], arcilla: ['terrón de arcilla', 'terrones de arcilla'],
  cuero: ['cuero', 'cueros'], 'piedra-cantera': ['piedra de cantera', 'piedras de cantera'], lana: ['vellón de lana', 'vellones de lana'],
  pinon: ['piñón', 'piñones'], calafate: ['calafate', 'calafates'], 'calafate-seco': ['puñado de calafates secos', 'puñados de calafates secos'],
  'trucha-fresca': ['trucha fresca', 'truchas frescas'], 'trucha-ahumada': ['trucha ahumada', 'truchas ahumadas'], frutilla: ['frutilla', 'frutillas'],
  piedra: ['piedra', 'piedras'], tronco: ['tronco', 'troncos'], tabla: ['tabla', 'tablas'], 'pan-casero': ['pan casero', 'panes caseros'],
  empanadas: ['empanada', 'empanadas'], miel: ['frasco de miel', 'frascos de miel'], harina: ['medida de harina', 'medidas de harina'],
  yerba: ['medida de yerba', 'medidas de yerba'], 'hongos-secos': ['puñado de llao llao seco', 'puñados de llao llao seco'],
};
export function cuantoDe(n, k) {
  const m = Object.hasOwn(NOMBRES, k) ? NOMBRES[k] : [k, k];
  return `${n} ${n === 1 ? m[0] : m[1]}`;
}

// Los vecinos que piden por el tablón: la clave de la aldea (el primero que ya llegó) y cómo firma el papel. `ernesto` (el
// jefe de estación) está desde el primer día: es el respaldo.
const FIRMAS = {
  tejedora: 'Elvira, la tejedora', herbolaria: 'Inés, la herbolaria', ceramista: 'Malena, la ceramista', herrero: 'Anselmo, el herrero',
  modista: 'Pocha, la modista', carpintero: 'Tito, el carpintero', abuela: 'la abuela Herminia', moza: 'Lucrecia, de la cantina',
  galesa: 'Ceinwen, de la casa de té', madre: 'Gladys, la de los dulces', nelida: 'Nélida, del almacén', padre: 'Mario Jones', jefe: 'Ernesto, el jefe de estación',
  enfermera: 'Marta, la enfermera', maestra: 'Delia, la maestra',
};
// Los encargos posibles. `k` la cosa, `n` cuántas, `origen` de dónde sale (ORIGENES), `quien` [el que pide, el respaldo],
// `para` lo que dice el papel, `estacion` (si sólo sale en una: los piñones, en otoño).
export const ENCARGOS_TABLON = [
  { id: 'junco-canastas', k: 'junco', n: 7, origen: 'mallin', quien: ['tejedora', 'nelida'], para: 'para tejer canastas de junco' },
  { id: 'hierbas-te', k: 'hierbas', n: 5, origen: 'mallin', quien: ['herbolaria', 'abuela'], para: 'para tés y un ungüento para el frío' },
  { id: 'arcilla-horno', k: 'arcilla', n: 6, origen: 'desembocadura', quien: ['ceramista', 'madre'], para: 'para el horno y unas macetas' },
  { id: 'cuero-fuelle', k: 'cuero', n: 2, origen: 'galpon', quien: ['herrero', 'padre'], para: 'para el fuelle de la fragua' },
  { id: 'lana-tejer', k: 'lana', n: 3, origen: 'galpon', quien: ['modista', 'madre'], para: 'para tejer el invierno que viene' },
  { id: 'piedra-anden', k: 'piedra-cantera', n: 4, origen: 'cantera', quien: ['jefe', 'jefe'], para: 'para emparejar el borde del andén' },
  { id: 'pinones-abuela', k: 'pinon', n: 8, origen: 'pehuenal', quien: ['abuela', 'galesa'], para: 'para hervirlos como en mi casa', estacion: 'otono' },
  { id: 'truchas-cantina', k: 'trucha-fresca', n: 3, origen: 'cabana', quien: ['moza', 'galesa'], para: 'frescas, de lo de Nicanor: para la cena del sábado' },
  { id: 'trucha-ahumada', k: 'trucha-ahumada', n: 1, origen: 'cabana', quien: ['enfermera', 'nelida'], para: 'ahumada como la hace Nicanor' },
  { id: 'calafate-arrayanal', k: 'calafate-seco', n: 1, origen: 'arrayanes', quien: ['madre', 'galesa'], para: 'del arrayanal, para un dulce de los buenos' },
  { id: 'frutillas-arrayanal', k: 'frutilla', n: 10, origen: 'arrayanes', quien: ['maestra', 'galesa'], para: 'del lado de los arrayanes, para los chicos de la escuela' },
];
const encargoTablon = (id) => ENCARGOS_TABLON.find((e) => e.id === id) || null;

// Lo que paga: n × lo que vale × lo de un pedido del pueblo (PEDIDOS.base) × lo de la distancia, redondo a $50, entre el mínimo
// y el máximo del tablón.
export function pagoDe(k, n, origen) {
  const crudo = n * valorUnidad(k) * PEDIDOS.base * multiplicadorDe(origen);
  return Math.max(TABLON.pagoMin, Math.min(TABLON.pagoMax, Math.round(crudo / 50) * 50));
}
// El papel: lo que se muestra de un encargo
function papel(e, dia, presente) {
  const quien = presente(e.quien[0]) ? e.quien[0] : presente(e.quien[1]) ? e.quien[1] : 'jefe';
  return {
    id: `${e.id}|${dia}`, tpl: e.id, k: e.k, donde: dondeDe(e.k), n: e.n, origen: e.origen, lugar: ORIGENES[e.origen].nombre,
    distancia: distanciaAPlaza(ORIGENES[e.origen]), mult: multiplicadorDe(e.origen), pago: pagoDe(e.k, e.n, e.origen),
    quien, firma: FIRMAS[quien] || FIRMAS.jefe, para: e.para,
  };
}

// ---------------------------------------------------------------- el estado (progreso.genteCampo.tablon)
//   dia        el día de lo que sigue
//   quitados   los encargos que ya se tomaron hoy del tablón (no vuelven a la vista ese día)
//   tomados    [{ id, tpl, k, n, pago, origen, quien, desde, hasta }]: los que tenés para entregar
//   entregas   { dia, n }: cuántos entregaste hoy (el tope es TABLON.entregasPorDia)
//   hechos     cuántos entregaste en toda la partida
export const tablonNuevo = () => ({ dia: 0, quitados: [], tomados: [], entregas: { dia: 0, n: 0 }, hechos: 0 });
const entero = (v, max = 1e6) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0));
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const texto = (v, max = 60) => (typeof v === 'string' && v.length <= max ? v : null);
export function sanearTablon(v, hoy = 1e6) {
  const base = tablonNuevo();
  if (!objeto(v)) return base;
  const dia = Math.max(1, entero(hoy, 1e6));
  const tomados = [];
  for (const t of Array.isArray(v.tomados) ? v.tomados : []) {
    if (!objeto(t) || tomados.length >= TABLON.tomadosMax) continue;
    const id = texto(t.id), tpl = texto(t.tpl, 40), k = texto(t.k, 30), origen = texto(t.origen, 20);
    if (!id || !tpl || !k || !origen || !Object.hasOwn(ORIGENES, origen)) continue;
    const desde = Math.min(dia, Math.max(1, entero(t.desde))), hasta = Math.max(desde, entero(t.hasta));
    tomados.push({ id, tpl, k, n: Math.max(1, entero(t.n, 40)), pago: Math.min(TABLON.pagoMax, entero(t.pago, 1e5)), origen, quien: texto(t.quien, 20) || 'jefe', desde, hasta: Math.min(hasta, desde + TABLON.plazo - 1) });
  }
  return {
    dia: Math.min(dia, entero(v.dia)),
    quitados: (Array.isArray(v.quitados) ? v.quitados : []).filter((x) => texto(x)).slice(0, 12),
    tomados,
    entregas: objeto(v.entregas) ? { dia: Math.min(dia, entero(v.entregas.dia)), n: entero(v.entregas.n, 20) } : base.entregas,
    hechos: entero(v.hechos, 1e6),
  };
}
// El estado del día (al cambiar de día se vacían los quitados; lo vencido se borra y se devuelve para avisar)
export function tablonDe(t, dia) {
  const d = Math.max(1, Math.floor(Number(dia) || 1));
  if (t.dia !== d) { t.dia = d; t.quitados = []; }
  const vencidos = t.tomados.filter((x) => x.hasta < d);
  if (vencidos.length) t.tomados = t.tomados.filter((x) => x.hasta >= d);
  return vencidos;
}

// ---------------------------------------------------------------- lo que se ve
// `ctx`: existe(k) (si el juego conoce la cosa: los materiales nuevos antes de juntar, no), presente(k) (si ese vecino ya vive
// en la aldea), estacion ('verano' | 'otono' | 'invierno').
// Los encargos a la vista hoy (los que salen de la fecha, menos los que ya se tomaron hoy y los que tenés tomados)
export function aLaVista(t, dia, ctx = {}) {
  const d = Math.max(1, Math.floor(Number(dia) || 1));
  const existe = ctx.existe || ((k) => esBien(k));
  const presente = ctx.presente || (() => true);
  const tomadosTpl = new Set(t.tomados.map((x) => x.tpl));
  // (los tres del día se eligen entre todos los posibles y recién después se sacan los tomados: tomar uno no trae otro)
  const posibles = ENCARGOS_TABLON.filter((e) => existe(e.k) && (!e.estacion || e.estacion === ctx.estacion));
  // el orden del día: los de distinto lugar primero (que no salgan tres del mismo lado)
  const r = azarDe(hashTexto(`tablon|${d}`));
  const mezcla = posibles.map((e) => ({ e, s: r() })).sort((a, b) => a.s - b.s).map((x) => x.e);
  const elegidos = [], lugares = new Set();
  for (const e of mezcla) { if (elegidos.length < TABLON.aLaVista && !lugares.has(e.origen)) { elegidos.push(e); lugares.add(e.origen); } }
  for (const e of mezcla) { if (elegidos.length < TABLON.aLaVista && !elegidos.includes(e)) elegidos.push(e); }
  return elegidos.map((e) => papel(e, d, presente)).filter((p) => !t.quitados.includes(p.id) && !tomadosTpl.has(p.tpl));
}
// Cuántos entregaste hoy
export const entregasHoy = (t, dia) => (t.entregas.dia === dia ? t.entregas.n : 0);

// Tomar el encargo `id` de la vista. Devuelve { ok, encargo } o { ok: false, motivo: 'no esta' | 'lleno' }
export function tomar(t, id, dia, ctx = {}) {
  tablonDe(t, dia);
  const e = aLaVista(t, dia, ctx).find((x) => x.id === id);
  if (!e) return { ok: false, motivo: 'no esta' };
  if (t.tomados.length >= TABLON.tomadosMax) return { ok: false, motivo: 'lleno' };
  const tomado = { id: e.id, tpl: e.tpl, k: e.k, n: e.n, pago: e.pago, origen: e.origen, quien: e.quien, desde: dia, hasta: dia + TABLON.plazo - 1 };
  t.tomados.push(tomado);
  t.quitados.push(e.id);
  return { ok: true, encargo: { ...e, ...tomado } };
}
// Lo de un tomado, para mostrar (con el lugar, la firma y la distancia)
export function vistaTomado(x) {
  const e = encargoTablon(x.tpl);
  return { ...x, donde: dondeDe(x.k), lugar: ORIGENES[x.origen]?.nombre || '', firma: FIRMAS[x.quien] || FIRMAS.jefe, para: e?.para || '', mult: multiplicadorDe(x.origen), distancia: distanciaAPlaza(ORIGENES[x.origen]) };
}
// ¿Se puede entregar? `tengo(donde, k)`: cuánto tenés. { ok, tomado } o { ok: false, motivo: 'no esta' | 'cupo' | 'falta', tomado }
export function puedeEntregar(t, id, dia, tengo) {
  tablonDe(t, dia);
  const x = t.tomados.find((y) => y.id === id);
  if (!x) return { ok: false, motivo: 'no esta' };
  if (entregasHoy(t, dia) >= TABLON.entregasPorDia) return { ok: false, motivo: 'cupo', tomado: x };
  if ((Number(tengo(dondeDe(x.k), x.k)) || 0) < x.n) return { ok: false, motivo: 'falta', tomado: x };
  return { ok: true, tomado: x };
}
// Entregar: lo cobra (economia.js) y devuelve los efectos para descontar lo entregado ([{ tipo, k, n }], negativo).
// { ok, pago, efectos, tomado } o el motivo
export function entregar(p, t, id, dia, tengo) {
  const v = puedeEntregar(t, id, dia, tengo);
  if (!v.ok) return v;
  const x = v.tomado;
  t.tomados = t.tomados.filter((y) => y.id !== id);
  t.entregas = t.entregas.dia === dia ? { dia, n: t.entregas.n + 1 } : { dia, n: 1 };
  t.hechos += 1;
  const c = hayEconomia(p) ? cobrar(p, x.pago, `Encargo del tablón: ${cuantoDe(x.n, x.k)}`, FIRMAS[x.quien] || FIRMAS.jefe) : { monto: 0 };
  return { ok: true, pago: c.monto, efectos: [{ tipo: dondeDe(x.k), k: x.k, n: -x.n }], tomado: x };
}
// Dejar un tomado (vuelve a quedar libre, pero hoy no vuelve al tablón)
export function soltar(t, id) {
  const antes = t.tomados.length;
  t.tomados = t.tomados.filter((y) => y.id !== id);
  return t.tomados.length < antes;
}

// Las filas del panel: primero los tomados (para entregar), después los de la vista (para tomar). Cada una:
// { tipo: 'entregar' | 'tomar', id, titulo, detalle, estado, puede }
export function filasTablon(t, dia, ctx = {}, tengo = () => 0) {
  tablonDe(t, dia);
  const filas = [];
  const cupo = entregasHoy(t, dia) >= TABLON.entregasPorDia;
  for (const x of t.tomados) {
    const v = vistaTomado(x), hay = Number(tengo(v.donde, v.k)) || 0;
    const plazo = x.hasta > dia ? 'hasta mañana' : 'vence hoy';
    filas.push({
      tipo: 'entregar', id: x.id, titulo: `Entregar ${cuantoDe(x.n, x.k)} · $${miles(x.pago)}`,
      detalle: `De ${v.lugar}, para ${v.firma} · ${plazo}`,
      estado: cupo ? 'mañana otra entrega' : hay >= x.n ? 'para entregar' : `tenés ${hay}`, puede: !cupo && hay >= x.n,
    });
  }
  const lleno = t.tomados.length >= TABLON.tomadosMax;
  for (const e of aLaVista(t, dia, ctx)) {
    filas.push({
      tipo: 'tomar', id: e.id, titulo: `${cap(cuantoDe(e.n, e.k))} · $${miles(e.pago)}`,
      detalle: `${cap(e.para)}. De ${e.lugar} (${e.distancia} m, ×${String(e.mult).replace('.', ',')}). Firma ${e.firma}`,
      estado: lleno ? 'ya tenés dos' : 'tomarlo', puede: !lleno,
    });
  }
  return filas;
}
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const miles = (n) => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
