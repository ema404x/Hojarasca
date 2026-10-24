// 3.9.0 · LA CANTINA: las reglas (módulo puro, se prueba en Node). Lo que se ve y se hace en el juego está en cantina-juego.js (la moza que
// viene caminando, la carta, el pedido en bandeja, tomar y comer) y cantina-mundo.js (vasos, platos y el sorbo en primera persona).
//
// Lo que hay acá: la carta de cada día (cambia con la estación, el tiempo y lo que la aldea produce: panadería, pescadería, sala de miel), los
// precios en pesos (la economía de la 3.8.8, sensatos frente al mercado: ver ECONOMIA_NUMEROS.md), las tres formas de pagar (pesos, trueque con
// algo que llevás, o «anotalo en la cuenta», que se salda con pesos o con un mandado), cuánto tarda la moza, lo que hace cada trago y cada
// bocado (un trago fuerte o algo caliente te saca el frío; la comida te deja descansado un rato, y se gasta), el saludo de Lucrecia (según la
// hora, el tiempo, la estación, lo que pasó en el valle y si ya te conoce) y el guardado (`progreso.cantina`, saneado como todo).
// Sólo en el Relax (con economía). (3.9.1: la borrachera, los chistes de la moza y la peña de los sábados: ver pena.js y pena-juego.js.)
import { BIENES } from './comercio.js';
import { hayEconomia, pesosDe, pagar, formatoPesos, PESOS_POR_YERBA } from './economia.js';
import { cantinaAbierta, HORARIO_CANTINA, diaSemanaDe, nocheDeCantina } from './aldea.js';
import { tengoDe } from './pedidos.js';
import { ebrioNuevo, sanearEbrio, sanearMemoriaChistes } from './pena.js';

const entero = (v, max = 1e7) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0));
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
export const NOMBRE_MOZA = 'Lucrecia';


// ---------------------------------------------------------------- la carta
// `porciones`: sorbos o bocados que dura. `fuerte`: trago de alcohol fuerte (calienta). `caliente`: sale humeando. `descanso`: horas de «descansado»
// que deja al terminar (la comida llena y se gasta). `prepara`: segundos de juego que tarda en la barra o en la cocina. `forma`: cómo se ve en
// la mesa (cantina-mundo.js). `color`: lo de adentro.
export const CARTA = [
  { id: 'ginebra', nombre: 'Ginebra', tipo: 'bebida', precio: 300, porciones: 3, fuerte: true, caliente: false, descanso: 0, prepara: 4, forma: 'vaso', color: '#d9e6d4', texto: 'Un vasito de ginebra de la buena: la que te saca el frío de los huesos.' },
  { id: 'vino-patero', nombre: 'Vino patero', tipo: 'bebida', precio: 250, porciones: 3, fuerte: true, caliente: false, descanso: 0, prepara: 4, forma: 'vaso', color: '#6a1426', texto: 'Tinto de la zona, pisado y bien asentado, en vaso de campo.' },
  { id: 'cerveza', nombre: 'Cerveza artesanal', tipo: 'bebida', precio: 350, porciones: 3, fuerte: false, caliente: false, descanso: 0.2, prepara: 5, forma: 'jarra', color: '#d8a030', texto: 'La de la zona: de lúpulo patagónico, mal tirada y bien fría.' },
  { id: 'mate-cocido', nombre: 'Mate cocido', tipo: 'bebida', precio: 120, porciones: 3, fuerte: false, caliente: true, descanso: 0.3, prepara: 4, forma: 'taza', color: '#8a5a2a', texto: 'Caliente, con azúcar quemada. Para el que ya tomó de más o el que no quiere tomar.' },
  { id: 'chocolate', nombre: 'Chocolate caliente', tipo: 'bebida', precio: 300, porciones: 3, fuerte: false, caliente: true, descanso: 0.5, prepara: 6, forma: 'taza', color: '#4a2a1a', texto: 'Espeso, con canela. Se sirve cuando hace frío.' },
  { id: 'empanadas', nombre: 'Empanadas (de a dos)', tipo: 'comida', precio: 350, porciones: 4, fuerte: false, caliente: true, descanso: 1, prepara: 8, forma: 'plato-empanadas', color: '#c8863a', texto: 'De carne cortada a cuchillo, con su aceituna y su huevo. Salen del horno de barro.' },
  { id: 'picada', nombre: 'Picada de fiambre y queso', tipo: 'comida', precio: 900, porciones: 6, fuerte: false, caliente: false, descanso: 1.5, prepara: 10, forma: 'tabla', color: '#c8a060', texto: 'Jamón crudo, salame, queso de la zona y pan casero, en una tabla para compartir.' },
  { id: 'guiso', nombre: 'Guiso de lentejas', tipo: 'comida', precio: 650, porciones: 5, fuerte: false, caliente: true, descanso: 2, prepara: 12, forma: 'cuenco', color: '#8a4a2a', texto: 'Con chorizo, panceta y papa: de los que se pegan al estómago y no lo sueltan.' },
  { id: 'tortas-fritas', nombre: 'Tortas fritas', tipo: 'comida', precio: 250, porciones: 3, fuerte: false, caliente: true, descanso: 0.8, prepara: 8, forma: 'plato-tortas', color: '#d8a860', texto: 'Redondas, doradas y con azúcar. Para los días de lluvia.' },
  { id: 'trucha', nombre: 'Trucha a la parrilla', tipo: 'comida', precio: 800, porciones: 4, fuerte: false, caliente: true, descanso: 1.5, prepara: 12, forma: 'plato-trucha', color: '#c89a6a', texto: 'De las que trae el pescador de la aldea, con limón y sal gruesa.' },
];
export const ID_CARTA = CARTA.map((x) => x.id);
export const itemDe = (id) => CARTA.find((x) => x.id === id) || CARTA_EXTRA.find((x) => x.id === id) || null;
// Cuándo está en la carta: `c` = { estacion, clima, locales }. Lo de siempre está siempre; el guiso y el chocolate piden frío o lluvia; las tortas fritas, lluvia
// (o la panadería abierta); la trucha, la pescadería abierta.
const FRIO = (c) => c.estacion === 'invierno' || c.clima === 'nieve';
const HUMEDO = (c) => c.clima === 'lluvia' || c.clima === 'nieve';
const CUANDO = {
  chocolate: (c) => FRIO(c) || c.estacion === 'otono' || HUMEDO(c),
  guiso: (c) => c.estacion !== 'verano' || HUMEDO(c),
  'tortas-fritas': (c) => HUMEDO(c) || !!c.locales?.panaderia,
  trucha: (c) => !!c.locales?.pescaderia,
};
// 3.9.2: más platos y bebidas. Aparte de la carta de siempre (CARTA: la prueba de la 3.9.0 la mira tal cual), con las mismas reglas: `forma` es lo que se ve en la
// mesa y en la bandeja (cantina-mundo.js). Cuándo salen: CUANDO_EXTRA (la estación, el tiempo y lo que produce la aldea: los locales abiertos y tu granja).
export const CARTA_EXTRA = [
  { id: 'fernet-cola', nombre: 'Fernet con cola', tipo: 'bebida', precio: 380, porciones: 3, fuerte: true, caliente: false, descanso: 0, prepara: 5, forma: 'vaso-alto', color: '#2a1612', texto: 'El amargo de siempre, con hielo de la cueva. Despierta el ánimo y tapa el frío.' },
  { id: 'licor-calafate', nombre: 'Licor de calafate', tipo: 'bebida', precio: 330, porciones: 3, fuerte: true, caliente: false, descanso: 0, prepara: 4, forma: 'vaso', color: '#4a1a5a', texto: 'Casero, de calafate. Dicen que el que lo prueba vuelve a la Patagonia; yo digo que vuelve a la barra.' },
  { id: 'cerveza-negra', nombre: 'Cerveza negra', tipo: 'bebida', precio: 380, porciones: 3, fuerte: false, caliente: false, descanso: 0.25, prepara: 5, forma: 'jarra', color: '#2a1a10', texto: 'Oscura, de malta tostada y espuma cremosa. Para los que no se asustan del color.' },
  { id: 'sidra', nombre: 'Sidra de manzana', tipo: 'bebida', precio: 280, porciones: 3, fuerte: false, alcohol: 'suave', caliente: false, descanso: 0.1, prepara: 4, forma: 'vaso', color: '#e0d080', texto: 'De las manzanas del valle, con burbuja y sin apuro. Fresca y de las que se toman de a muchas.' },
  { id: 'vino-caliente', nombre: 'Vino caliente con canela', tipo: 'bebida', precio: 300, porciones: 3, fuerte: true, caliente: true, descanso: 0.3, prepara: 6, forma: 'taza', color: '#7a1a2a', texto: 'Tinto con canela, clavo y cáscara de naranja, humeando. Para las noches que muerden.' },
  { id: 'cafe', nombre: 'Café de filtro', tipo: 'bebida', precio: 130, porciones: 3, fuerte: false, caliente: true, descanso: 0.3, prepara: 4, forma: 'taza', color: '#2a1a10', texto: 'Negro y recién colado. Para el que todavía tiene camino o ganas de quedarse despierto.' },
  { id: 'limonada', nombre: 'Limonada helada', tipo: 'bebida', precio: 160, porciones: 3, fuerte: false, caliente: false, descanso: 0.2, prepara: 4, forma: 'jarra', color: '#e8e07a', texto: 'Con limón, hielo de la cueva y una ramita de menta. Para los días largos.' },
  { id: 'milanesa', nombre: 'Milanesa con papas', tipo: 'comida', precio: 700, porciones: 5, fuerte: false, caliente: true, descanso: 1.8, prepara: 12, forma: 'plato-milanesa', color: '#c8964a', texto: 'Grande, dorada, con papas fritas y un limón al costado. Sirve para dos, pero se la comen uno.' },
  { id: 'choripan', nombre: 'Choripán con chimichurri', tipo: 'comida', precio: 380, porciones: 4, fuerte: false, caliente: true, descanso: 1, prepara: 8, forma: 'plato-choripan', color: '#8a3a2a', texto: 'Chorizo a la parrilla en pan crujiente, con chimichurri de la casa. Se come con las manos.' },
  { id: 'locro', nombre: 'Locro de la casa', tipo: 'comida', precio: 600, porciones: 5, fuerte: false, caliente: true, descanso: 2, prepara: 12, forma: 'cuenco', color: '#c8782a', texto: 'Maíz, porotos, zapallo y panceta, a fuego lento desde la mañana. Para el frío que no afloja.' },
  { id: 'cordero', nombre: 'Costillar de cordero al asador', tipo: 'comida', precio: 950, porciones: 6, fuerte: false, caliente: true, descanso: 2, prepara: 14, forma: 'plato-asado', color: '#a8582a', texto: 'Cordero patagónico a la cruz, con sal gruesa y mucha paciencia. El plato de las ocasiones.' },
  { id: 'sopa-huerta', nombre: 'Sopa de verduras de la huerta', tipo: 'comida', precio: 380, porciones: 4, fuerte: false, caliente: true, descanso: 1.2, prepara: 9, forma: 'cuenco', color: '#8aa84a', texto: 'Zapallo, papa, acelga y lo que dio la huerta esta semana. Sencilla y de las que reconcilian.' },
  { id: 'tarta-fruta', nombre: 'Tarta de fruta de la zona', tipo: 'comida', precio: 320, porciones: 3, fuerte: false, caliente: false, descanso: 0.8, prepara: 6, forma: 'plato-tarta', color: '#b84a3a', texto: 'Masa quebrada y fruta del valle, con azúcar por arriba. Sin crema, que se acaba antes.' },
  { id: 'flan', nombre: 'Flan con dulce de leche', tipo: 'comida', precio: 300, porciones: 3, fuerte: false, caliente: false, descanso: 0.8, prepara: 5, forma: 'plato-flan', color: '#d8a850', texto: 'Casero, con caramelo y una buena cucharada de dulce de leche. Postre de los que se piden dos veces.' },
  { id: 'pan-queso', nombre: 'Pan casero con queso y dulce', tipo: 'comida', precio: 240, porciones: 3, fuerte: false, caliente: false, descanso: 0.8, prepara: 5, forma: 'plato-pan', color: '#d8b070', texto: 'Del horno de la panadería, con queso de la zona y dulce de frutilla. Merienda de verdad.' },
];
// Lo que produce la aldea y tu campo, para la carta (puro: se arma desde la partida)
export function produccionDe(p) {
  const a = p?.aldea || null, g = p?.granja || null;
  const abierto = (k) => !!a?.locales && Object.hasOwn(a.locales, k);
  return {
    panaderia: abierto('panaderia'), pescaderia: abierto('pescaderia'), miel: abierto('sala-miel'), herbolaria: abierto('herboristeria'),
    leche: !!g?.vaca, cordero: Array.isArray(g?.corderos) && g.corderos.length > 0, cerdo: !!g?.chancha || (Array.isArray(g?.lechones) && g.lechones.length > 0),
    fruta: !!g?.frutales && Object.keys(g.frutales).length > 0,
    cerveza: tieneCerveceria(p),   // 4.2: tu cervecería (planos-oficios.js): la cerveza de la casa es la tuya
  };
}
// 4.2: con la cervecería propia terminada (una etapa), la cerveza de la cantina te sale un 25 % más barata: precio de proveedor
const tieneCerveceria = (p) => Array.isArray(p?.obras) && p.obras.some((o) => !!o && o.plano === 'cerveceria' && Number(o.etapas) >= 1);
export const DESCUENTO_CERVEZA = 0.25;
const CERVEZAS_PROPIAS = { cerveza: 'Tu cerveza artesanal', 'cerveza-negra': 'Tu cerveza negra' };
const LLUVIA = (c) => c.clima === 'lluvia' || c.clima === 'nieve';
const CUANDO_EXTRA = {
  'vino-caliente': (c) => FRIO(c) || c.estacion === 'otono' || LLUVIA(c),
  limonada: (c) => c.estacion === 'verano' && !LLUVIA(c),
  sidra: (c) => c.estacion !== 'invierno' || !!c.prod?.fruta,
  locro: (c) => c.estacion !== 'verano' || LLUVIA(c),
  cordero: (c) => c.estacion !== 'verano' || !!c.prod?.cordero,
  'sopa-huerta': (c) => c.estacion !== 'invierno' || LLUVIA(c),
  'tarta-fruta': (c) => c.estacion !== 'invierno' || !!c.prod?.fruta,
  flan: (c) => !!c.prod?.leche || c.estacion !== 'verano',
  'pan-queso': (c) => !!c.prod?.panaderia || c.estacion === 'verano',
  choripan: (c) => !!c.prod?.cerdo || c.estacion !== 'invierno',
};
// Los candidatos a «plato del día»: el día elige uno de los que están en carta (con lo que produce la aldea primero), se le rebajan diez por ciento y se marca
const PLATOS_DEL_DIA = ['locro', 'cordero', 'sopa-huerta', 'milanesa', 'tarta-fruta', 'trucha', 'empanadas', 'guiso', 'choripan', 'flan', 'pan-queso'];
export function platoDelDia(lista, ctx = {}) {
  const dia = Math.floor(Number(ctx.dia) || 0);
  if (dia < 1) return null;
  const hay = (id) => lista.some((x) => x.id === id);
  const prod = ctx.prod || {};
  // lo de la aldea (lo que dio la granja o los locales) tiene prioridad
  const propios = [prod.pescaderia && 'trucha', prod.cordero && 'cordero', prod.leche && 'flan', prod.fruta && 'tarta-fruta', prod.panaderia && 'pan-queso', prod.cerdo && 'choripan'].filter((k) => k && hay(k));
  const base = PLATOS_DEL_DIA.filter(hay);
  const lis = propios.length && dia % 2 === 0 ? propios : base;
  return lis.length ? lis[dia % lis.length] : null;
}
export function cartaDeHoy(c = {}) {
  const ctx = { estacion: c.estacion || 'verano', clima: c.clima || 'sol', locales: c.locales || {}, prod: c.prod || null, dia: c.dia || 0 };
  const lista = [...CARTA.filter((x) => !CUANDO[x.id] || CUANDO[x.id](ctx)), ...CARTA_EXTRA.filter((x) => !CUANDO_EXTRA[x.id] || CUANDO_EXTRA[x.id](ctx))].map((x) => {
    // con la sala de miel abierta, el mate cocido va con miel (un poco más caro)
    if (ctx.prod?.cerveza && Object.hasOwn(CERVEZAS_PROPIAS, x.id)) return { ...x, nombre: CERVEZAS_PROPIAS[x.id], precio: Math.round((x.precio * (1 - DESCUENTO_CERVEZA)) / 10) * 10, texto: 'La que sale de tu cervecería: la cantina te la deja a precio de proveedor.' };
    if (x.id === 'mate-cocido' && ctx.locales['sala-miel']) return { ...x, nombre: 'Mate cocido con miel', precio: x.precio + 30, texto: 'Caliente y con miel de la sala de la aldea. Endulza el día.' };
    return { ...x };
  });
  const dd = platoDelDia(lista, ctx);
  if (dd) { const x = lista.find((q) => q.id === dd); if (x) { x.delDia = true; x.precio = Math.max(100, Math.round((x.precio * 0.9) / 10) * 10); } }
  return lista;
}
export const itemEnCarta = (id) => CARTA.find((x) => x.id === id) || CARTA_EXTRA.find((x) => x.id === id) || null;

// ---------------------------------------------------------------- el guardado
export const CUENTA_MAX = 1500;
export const FUERTES_POR_NOCHE = 3;
// (3.9.1: `ebrio`: { n, t } el nivel de la borrachera y cuándo se midió (horas absolutas); `chistes`: la memoria de los chistes que ya salieron; `pena`: tus bailes con
// Dalia y la última noche que bailaste)
// (3.9.2: `ultimoPedido` e `veces`: lo último que pediste y cuántas veces cada cosa, para que te recuerden; la casa de té usa la misma forma en `progreso.casaTe`)
export function cantinaNueva() { return { visitas: 0, ultima: 0, pedidos: 0, gastado: 0, cuenta: null, fuertes: { dia: 0, n: 0 }, ebrio: ebrioNuevo(), chistes: {}, pena: { bailes: 0, ultima: 0 }, ultimoPedido: null, veces: {}, vistos: 0, pendiente: null }; }   // 4.10.4 (S2-5): `pendiente`: el id de un pedido ya pagado que todavía no llegó a la mesa
const idItem = (v) => (typeof v === 'string' && /^[a-z0-9-]{1,40}$/.test(v) ? v : null);
function sanearVeces(v) {
  const r = {};
  if (!objeto(v)) return r;
  for (const [k, n] of Object.entries(v).slice(0, 60)) { const id = idItem(k); if (id && Object.hasOwn(v, k)) r[id] = Math.max(1, entero(n, 9999)); }
  return r;
}
function sanearCuenta(v) {
  if (!objeto(v)) return null;
  const monto = entero(v.monto, 1e6);
  if (monto <= 0) return null;
  const k = typeof v.k === 'string' && Object.hasOwn(BIENES, v.k) ? v.k : 'tronco';
  return { monto, k, n: Math.max(1, entero(v.n, 99)), dia: Math.max(1, entero(v.dia, 1e6)) };
}
export function sanearCantina(v, hoy = 1e6) {
  const base = cantinaNueva();
  if (!objeto(v)) return base;
  const dia = Math.max(1, entero(hoy, 1e6));
  const f = objeto(v.fuertes) ? v.fuertes : {};
  const cuenta = sanearCuenta(v.cuenta);
  if (cuenta) cuenta.dia = Math.min(dia, cuenta.dia);
  return {
    visitas: entero(v.visitas, 1e6), ultima: Math.min(dia, entero(v.ultima, 1e6)), pedidos: entero(v.pedidos, 1e6), gastado: entero(v.gastado, 1e9),
    cuenta, fuertes: { dia: Math.min(dia, entero(f.dia, 1e6)), n: entero(f.n, 99), mate: entero(f.mate, 99) },   // 4.10.4 (S2-8): `mate`: los mates de la casa de esa noche
    // (3.9.1: las partidas de antes no lo tienen: arrancan sobrias y sin chistes dichos)
    ebrio: sanearEbrio(v.ebrio, dia * 24 + 24), chistes: sanearMemoriaChistes(v.chistes),
    pena: objeto(v.pena) ? { bailes: entero(v.pena.bailes, 1e6), ultima: Math.min(dia, entero(v.pena.ultima, 1e6)) } : { bailes: 0, ultima: 0 },
    ultimoPedido: idItem(v.ultimoPedido), veces: sanearVeces(v.veces), vistos: entero(v.vistos, 1e6), pendiente: idItem(v.pendiente),
  };
}
// La cantina de esta partida (se crea sola si la partida es de antes de la 3.9.0); sin economía (el Desafío), null
export function cantinaDe(p) {
  if (!hayEconomia(p)) return null;
  if (!objeto(p.cantina)) p.cantina = sanearCantina(null, p.dia);
  // (3.9.1: una partida cargada en esta sesión antes de la peña: lo nuevo, de fábrica)
  const q = p.cantina;
  if (!objeto(q.ebrio)) q.ebrio = ebrioNuevo();
  if (!objeto(q.chistes)) q.chistes = {};
  if (!objeto(q.pena)) q.pena = { bailes: 0, ultima: 0 };
  if (!objeto(q.veces)) q.veces = {};
  if (q.ultimoPedido === undefined) q.ultimoPedido = null;
  if (!Number.isFinite(q.vistos)) q.vistos = 0;
  if (q.pendiente === undefined) q.pendiente = null;
  return q;
}
// 3.9.2: la casa de té tiene su propia libreta (visitas, cuenta, lo último que pediste), con la misma forma que la de la cantina
export function casaTeDe(p) {
  if (!hayEconomia(p)) return null;
  if (!objeto(p.casaTe)) p.casaTe = sanearCantina(null, p.dia);
  const q = p.casaTe;
  if (!objeto(q.veces)) q.veces = {};
  if (q.ultimoPedido === undefined) q.ultimoPedido = null;
  if (!Number.isFinite(q.vistos)) q.vistos = 0;
  if (!objeto(q.fuertes)) q.fuertes = { dia: 0, n: 0 };
  if (q.pendiente === undefined) q.pendiente = null;
  return q;
}
// Los dos lugares donde te atienden: quién, cómo se llama la libreta y cómo figura en la billetera
export const LUGARES = {
  cantina: { id: 'cantina', persona: 'moza', nombre: NOMBRE_MOZA, etiqueta: 'Cantina', estado: (p) => cantinaDe(p) },
  'casa-te': { id: 'casa-te', persona: 'galesa', nombre: 'Ceinwen', etiqueta: 'Casa de té', estado: (p) => casaTeDe(p) },
};
export const estadoLugar = (p, lugar = 'cantina') => (LUGARES[lugar] || LUGARES.cantina).estado(p);
export const cuentaDe = (p) => cantinaDe(p)?.cuenta || null;
// Lo de la noche: un día de la cantina va de las 18 a las 2, así que «la noche» cambia al abrir
export const nocheDe = (dia, hora) => (Number(hora) < HORARIO_CANTINA.cierra ? Math.max(1, Math.floor(dia) - 1) : Math.max(1, Math.floor(dia)));

// ---------------------------------------------------------------- lo que llevás (trueque y mandados)
// Lo que acepta la cantina en vez de plata, a su valor de mercado (comercio.js: lo que vale el lote entre cuántos trae) y la yerba, a $100
export const TRUEQUE = ['trucha-fresca', 'tronco', 'frasco-frutilla', 'miel', 'pan-casero', 'calafate-seco', 'huevo', 'yerba'];
export const MANDADOS = ['tronco', 'trucha-fresca', 'huevo', 'pan-casero', 'harina'];
export const NOMBRE_BIEN = {
  'trucha-fresca': ['una trucha', 'truchas'], tronco: ['un tronco', 'troncos'], 'frasco-frutilla': ['un frasco de dulce', 'frascos de dulce'], miel: ['un frasco de miel', 'frascos de miel'],
  'pan-casero': ['un pan casero', 'panes caseros'], 'calafate-seco': ['un puñado de calafate seco', 'puñados de calafate seco'], huevo: ['un huevo', 'huevos'], yerba: ['un paquete de yerba', 'paquetes de yerba'],
  harina: ['una medida de harina', 'medidas de harina'],
};
export const unidadEnPesos = (k) => (k === 'yerba' ? PESOS_POR_YERBA : BIENES[k] ? Math.max(1, Math.round((BIENES[k].valor * 100) / BIENES[k].lote)) : 0);
export function tengoBien(p, k) {
  if (k === 'yerba') return entero(p?.cosas?.yerba, 1e6);
  return tengoDe(p, k);
}
export function quitarBien(p, k, n) {
  const cant = entero(n, 1e6);
  if (!cant || tengoBien(p, k) < cant) return false;
  if (k === 'yerba') { p.cosas = p.cosas || {}; p.cosas.yerba = entero(p.cosas.yerba, 1e6) - cant; return true; }
  const b = BIENES[k];
  if (!b) return false;
  if (b.donde === 'material') p.materiales[k] = Math.max(0, (p.materiales[k] || 0) - cant);
  else if (b.donde === 'cosa') p.cosas[k] = Math.max(0, (p.cosas[k] || 0) - cant);
  else p.entradas[k].cantidad = Math.max(0, (p.entradas[k].cantidad || 0) - cant);
  return true;
}
export const textoBien = (k, n) => `${n} ${(NOMBRE_BIEN[k] || [k, k])[n === 1 ? 0 : 1].replace(/^una? /, '')}`;
// Cuántos de `k` valen `monto` pesos (redondeado para arriba)
export const cuantosPara = (k, monto) => Math.max(1, Math.ceil(monto / Math.max(1, unidadEnPesos(k))));

// ---------------------------------------------------------------- pagar
// Las formas de pagar un pedido: [{ medio: 'pesos'|'trueque'|'cuenta', ok, texto, bien?, n?, motivo? }]
export function formasDePago(p, item, lugar = 'cantina') {
  const lista = [];
  const pesos = pesosDe(p);
  lista.push({ medio: 'pesos', ok: pesos >= item.precio, texto: `Pagar ${formatoPesos(item.precio)}`, motivo: pesos >= item.precio ? '' : 'plata' });
  let hay = 0;
  for (const k of TRUEQUE) {
    const n = cuantosPara(k, item.precio);
    if (tengoBien(p, k) >= n) { lista.push({ medio: 'trueque', ok: true, texto: `Trueque: ${textoBien(k, n)}`, bien: k, n }); if (++hay >= 3) break; }
  }
  if (!hay) lista.push({ medio: 'trueque', ok: false, texto: 'Trueque (llevá truchas, leña, frascos…)', motivo: 'nada' });
  const c = estadoLugar(p, lugar), deuda = c?.cuenta?.monto || 0;
  lista.push({ medio: 'cuenta', ok: deuda + item.precio <= CUENTA_MAX, texto: 'Anotalo en la cuenta', motivo: deuda + item.precio <= CUENTA_MAX ? '' : 'cuenta' });
  return lista;
}
// El mandado con el que se salda la cuenta: una cosa y cuántas, por el día (cambia, para que no sea siempre lo mismo)
export function mandadoDe(monto, dia) {
  const k = MANDADOS[(Math.max(1, Math.floor(dia)) + Math.floor(monto / 100)) % MANDADOS.length];
  return { k, n: cuantosPara(k, monto) };
}
// Pedir algo. `forma`: { medio, bien? }. Cobra y devuelve el pedido ({ ok, item, medio, ... }) o el motivo de la negativa.
export function pedir(p, itemId, forma, dia, hora = 20, carta = null, lugar = 'cantina') {
  const L = LUGARES[lugar] || LUGARES.cantina;
  const c = L.estado(p);
  const lista = carta || CARTA;
  const item = lista.find((x) => x.id === itemId);
  if (!c || !item) return { ok: false, motivo: 'no-hay' };
  const noche = nocheDe(dia, hora);
  if (item.fuerte && c.fuertes.dia === noche && c.fuertes.n >= FUERTES_POR_NOCHE) return { ok: false, motivo: 'ya-esta', item };
  const medio = forma?.medio;
  let cobro = null;
  if (medio === 'pesos') {
    const r = pagar(p, item.precio, `${L.etiqueta}: ${item.nombre}`, L.nombre);
    if (!r.ok) return { ok: false, motivo: 'plata', item, faltan: r.faltan };
    cobro = { pesos: item.precio };
  } else if (medio === 'trueque') {
    const k = forma.bien;
    if (!TRUEQUE.includes(k)) return { ok: false, motivo: 'bien', item };
    const n = cuantosPara(k, item.precio);
    if (!quitarBien(p, k, n)) return { ok: false, motivo: 'nada', item };
    cobro = { bien: k, n };
  } else if (medio === 'cuenta') {
    const deuda = c.cuenta?.monto || 0;
    if (deuda + item.precio > CUENTA_MAX) return { ok: false, motivo: 'cuenta', item };
    const monto = deuda + item.precio;
    c.cuenta = { monto, ...mandadoDe(monto, dia), dia: c.cuenta?.dia || Math.max(1, Math.floor(dia)) };
    cobro = { cuenta: item.precio };
  } else return { ok: false, motivo: 'medio', item };
  c.pedidos++;
  c.ultimoPedido = idItem(item.id) || c.ultimoPedido || null;
  if (idItem(item.id)) { c.veces = c.veces || {}; if (Object.keys(c.veces).length < 60 || c.veces[item.id]) c.veces[item.id] = Math.min(9999, (c.veces[item.id] || 0) + 1); }
  if (cobro.pesos) c.gastado += cobro.pesos;
  c.ultima = Math.max(1, Math.floor(dia));
  if (item.fuerte) { if (c.fuertes.dia !== noche) c.fuertes = { dia: noche, n: 0 }; c.fuertes.n++; }
  return { ok: true, item, medio, cobro, id: itemId };
}
// Saldar la cuenta: con pesos o con el mandado
export function saldarCuenta(p, medio, lugar = 'cantina') {
  const L = LUGARES[lugar] || LUGARES.cantina;
  const c = L.estado(p);
  if (!c?.cuenta) return { ok: false, motivo: 'sin-cuenta' };
  const { monto, k, n } = c.cuenta;
  if (medio === 'pesos') {
    const r = pagar(p, monto, lugar === 'cantina' ? 'Cantina: la cuenta' : `${L.etiqueta}: la cuenta`, L.nombre);
    if (!r.ok) return { ok: false, motivo: 'plata', faltan: r.faltan };
    c.gastado += monto; c.cuenta = null;
    return { ok: true, medio, monto };
  }
  if (medio === 'mandado') {
    if (!quitarBien(p, k, n)) return { ok: false, motivo: 'nada', k, n };
    c.cuenta = null;
    return { ok: true, medio, monto, k, n };
  }
  return { ok: false, motivo: 'medio' };
}

// ---------------------------------------------------------------- la atención
// Qué tan llena está la cantina (0 a 1): de noche, y más los viernes y sábados. Hace tardar más a la moza y se oyen más charlas.
export function afluencia(hora, dia) {
  if (!cantinaAbierta(hora)) return 0;
  // 4.0.2: la madrugada (0 a 6 h) es la noche de ayer: la peña del sábado de madrugada ya no cuenta como «domingo flojo»
  const h = ((Number(hora) % 24) + 24) % 24, ds = diaSemanaDe(nocheDeCantina(dia, hora));
  const noche = h >= 18 ? Math.min(1, (h - 18) / 4) : Math.max(0, 1 - h / 2);   // sube hasta las 22 y baja pasada la medianoche
  const semana = ds === 4 || ds === 5 ? 1 : ds === 6 ? 0.35 : 0.6;
  return Math.max(0.1, Math.min(1, noche * semana));
}
// Cuánto tarda en servirte (segundos): lo suyo en la barra o la cocina, y más si hay gente
export const demoraDe = (item, ocupada = 0) => Math.round((item.prepara + 7 * Math.max(0, Math.min(1, ocupada))) * 10) / 10;
// Cuántos segundos tarda en verte y venir (si está atendiendo, un rato)
export const demoraEnVerte = (ocupada = 0) => Math.round((1.8 + 3.2 * Math.max(0, Math.min(1, ocupada))) * 10) / 10;

// ---------------------------------------------------------------- tomar y comer
// Un sorbo o un bocado: lo que cambia. `estado`: { item, restantes }. Devuelve { efectos: [{ campo, valor }], termino }.
export function tomarPorcion(estado) {
  const item = estado.item, efectos = [];
  const primera = estado.restantes === item.porciones;
  if (estado.restantes <= 0) return { efectos, termino: true };
  estado.restantes--;
  // lo fuerte o lo caliente saca el frío (el entumecido) desde el primer trago
  if ((item.fuerte || item.caliente) && primera) efectos.push({ campo: 'entumecido', valor: 0 });
  const termino = estado.restantes === 0;
  if (termino && item.descanso > 0) efectos.push({ campo: 'descansado', valor: item.descanso });
  return { efectos, termino };
}
export const verboDe = (item) => (item.tipo === 'comida' ? 'Comer un bocado' : 'Tomar un trago');

// ---------------------------------------------------------------- lo que dice Lucrecia
// Las frases: cada una es un texto (o un molde con {0}); la elegida sale del día y de cuántas veces viniste, así no repite siempre la misma
export const eleg = (lista, semilla) => lista[Math.abs(Math.floor(semilla)) % lista.length];
export const SALUDOS = {
  nuevo: ['Mirá quién llegó hasta el final de la calle. Sentate, forastero: acá nadie muerde, salvo que se lo pidan.', 'Cara nueva en la cantina. Soy Lucrecia, la moza. Pedí lo que quieras: lo que no tenga, lo invento.'],
  // {0}: tu apodo en la aldea
  conocido: ['{0}, mirá vos. Sabía que ibas a volver: acá se vuelve siempre.', '¡{0}! Justo cuando la barra se ponía aburrida. ¿Lo de siempre?'],
  conocidoSinApodo: ['Ah, vos. La cara se me quedó en la memoria. Sentate, que hoy te atiendo yo.', 'Volviste. Me gusta la gente que vuelve: son pocos y gastan con ganas.'],
  tarde: 'Todavía es temprano, pero la cantina ya está abierta. Pedí algo y mirá cómo se va poniendo el cielo.',
  noche: 'La noche es joven y la gente, también. Pedí algo antes de que se llene.',
  madrugada: 'A esta hora los que quedan son los que no tienen ganas de irse. Pedí, que cerramos en un rato.',
  lluvia: 'Con esta lluvia, nadie sale. Mejor: se llenan las mesas y las tortas fritas se acaban.',
  nieve: 'Nieva afuera. Acá adentro hay salamandra, chocolate y mala compañía. Elegí.',
  viento: 'Con este viento no se aguanta ni el sombrero. Sentate, que acá no sopla.',
  frio: 'Qué frío hace, ¿no? Arrimate a la salamandra y pedí algo que caliente.',
  calor: 'Con este calor, lo mejor es algo bien frío. La cerveza sale de la cueva, helada.',
  // lo que pasó en el valle
  'trucha-grande': 'Dicen que sacaste una trucha bien grande. Se corrió la voz: acá el pescado crece cada vez que se cuenta.',
  talar: 'Dicen que talaste un montón de árboles. Con tanta leña, la salamandra te lo agradece.',
  'obra-propia': 'Me dijeron que terminaste una obra tuya. Si hay que festejar, la barra está abierta.',
  tren: 'Te vi bajar de la trochita. Los viajeros son mi debilidad: traen cuentos nuevos.',
  'aporte-obra': 'Dicen que le diste una mano al pueblo con las obras. En la cantina tenemos memoria de los que ayudan.',
  cuenta: 'Ah, y no me olvidé de la cuenta, corazón. No hay apuro, pero tampoco olvido.',
};
// (devuelve dos renglones: la presentación y lo del momento, cada uno con su traducción)
export function saludoDeMoza({ hora = 20, clima = 'sol', estacion = 'verano', apodo = null, visitas = 0, cuenta = null, hechos = [], dia = 1 } = {}) {
  const semilla = dia * 7 + visitas;
  const h = ((Number(hora) % 24) + 24) % 24;
  // la presentación
  let frase;
  if (!visitas) frase = eleg(SALUDOS.nuevo, semilla);
  else if (apodo) frase = eleg(SALUDOS.conocido, semilla).replace('{0}', apodo);
  else frase = eleg(SALUDOS.conocidoSinApodo, semilla);
  // y algo del momento: lo que pasó en el valle, el tiempo o la hora (uno solo, para que no sea un discurso)
  const hecho = (hechos || []).find((x) => Object.hasOwn(SALUDOS, x?.id) && x.id !== 'cuenta');
  let extra;
  if (visitas && hecho) extra = SALUDOS[hecho.id];
  else if (clima === 'lluvia') extra = SALUDOS.lluvia;
  else if (clima === 'nieve') extra = SALUDOS.nieve;
  else if (clima === 'viento') extra = SALUDOS.viento;
  else if (estacion === 'invierno') extra = SALUDOS.frio;
  else if (estacion === 'verano') extra = SALUDOS.calor;
  else extra = h >= 18 && h < 21 ? SALUDOS.tarde : h >= 21 || h < 0.5 ? SALUDOS.noche : SALUDOS.madrugada;
  if (!visitas) extra = h >= 18 && h < 21 ? SALUDOS.tarde : h >= 21 ? SALUDOS.noche : SALUDOS.madrugada;
  return [frase, cuenta && visitas ? SALUDOS.cuenta : extra];
}
// Lo que dice mientras sirve (y cuando no hay nada que servirte)
export const DICHOS = {
  anota: ['Anotado. Ya te lo traigo, no te muevas.', 'Marchando. Pero con calma, que lo bueno se hace esperar.', 'Ya mismo. Si te aburrís, mirá la guitarra de la pared: nadie la toca, pero todos la miran.'],
  trae: ['Acá está lo tuyo, corazón. Con cuidado, que quema.', 'Servido. Probalo y después me contás.', 'Tomá. Y no me mires así que me ruborizo… un poquito.'],
  trae_fria: ['Acá lo tenés, bien frío.', 'Tomá, recién sacado de la cueva.'],
  se_va: ['Cualquier cosa, me chiflás.', 'Si querés otra, levantá la mano. Yo veo todo desde la barra.', 'Disfrutá. Yo vuelvo cuando me necesites… o cuando me extrañes.'],
  limpia: ['Dejame que te levanto esto.', 'Ya te saco los platos. Volvé cuando quieras.'],
  ya_esta: 'Hoy ya tomaste bastante, corazón. Te traigo un mate cocido y charlamos, ¿dale?',
  mate: 'Mate cocido, por la casa.',
  sin_plata: 'Con eso no alcanza, cariño. Probá con un trueque o decime «anotalo» y lo vemos después.',
  cuenta_llena: 'La cuenta ya está en un monto que me da vértigo. Primero saldame algo, ¿sí?',
  cerrada: 'Todavía no abrimos: a las seis levanto la persiana. Volvé y te atiendo como te mereces.',
  sola: 'Hoy no hay nadie atendiendo: la moza anda por ahí. Volvé más tarde.',
  vuelve_pronto: 'Te veo con ganas de otra. Cuando quieras, la carta está en tu mesa.',
  llega: 'Ya voy, ya voy. No te vayas.',
  pagada: 'Cuenta saldada. Así me gusta la gente: la que paga y la que sonríe.',
  mandado: 'Gracias por el mandado. Con esto, estamos a mano.',
  sorbo: ['Ahhh. Eso sí que es un trago.', 'Qué rico.', 'Con eso se vive otro rato.'],
  bocado: ['Mmm. Esto está bueno.', 'Qué manera de comer.', 'Esto sí que llena.'],
  termino_trago: 'Se terminó. Pedí otra, si querés, o quedate un rato a escuchar.',
  termino_comida: 'Plato limpio. La cocinera te va a querer.',
};
export const dicho = (clave, semilla = 0) => (Array.isArray(DICHOS[clave]) ? eleg(DICHOS[clave], semilla) : DICHOS[clave]);
// Todo lo que lee el jugador (para la prueba de textos: nada religioso y todo con su inglés)
export function textosCantina() {
  const t = [];
  for (const x of CARTA) t.push(x.nombre, x.texto);
  t.push('Mate cocido con miel', 'Caliente y con miel de la sala de la aldea. Endulza el día.');
  for (const v of Object.values(SALUDOS)) t.push(...(Array.isArray(v) ? v : [v]));
  for (const v of Object.values(DICHOS)) t.push(...(Array.isArray(v) ? v : [v]));
  return t;
}
