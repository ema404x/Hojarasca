// 3.9.0 · LA CANTINA: las reglas (módulo puro, se prueba en Node). Lo que se ve y se hace en el juego está en cantina-juego.js (la moza que
// viene caminando, la carta, el pedido en bandeja, tomar y comer) y cantina-mundo.js (vasos, platos y el sorbo en primera persona).
//
// Lo que hay acá: la carta de cada día (cambia con la estación, el tiempo y lo que la aldea produce: panadería, pescadería, sala de miel), los
// precios en pesos (la economía de la 3.8.8, sensatos frente al mercado: ver ECONOMIA_NUMEROS.md), las tres formas de pagar (pesos, trueque con
// algo que llevás, o «anotalo en la cuenta», que se salda con pesos o con un mandado), cuánto tarda la moza, lo que hace cada trago y cada
// bocado (un trago fuerte o algo caliente te saca el frío; la comida te deja descansado un rato, y se gasta), el saludo de Lucrecia (según la
// hora, el tiempo, la estación, lo que pasó en el valle y si ya te conoce) y el guardado (`progreso.cantina`, saneado como todo).
// Sólo en el Relax (con economía). Nada de borrachera ni de peña: eso queda para la 3.9.1.
import { BIENES } from './comercio.js';
import { hayEconomia, pesosDe, pagar, formatoPesos, PESOS_POR_YERBA } from './economia.js';
import { cantinaAbierta, HORARIO_CANTINA, diaSemanaDe } from './aldea.js';
import { tengoDe } from './pedidos.js';

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
export const itemDe = (id) => CARTA.find((x) => x.id === id) || null;
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
export function cartaDeHoy(c = {}) {
  const ctx = { estacion: c.estacion || 'verano', clima: c.clima || 'sol', locales: c.locales || {} };
  return CARTA.filter((x) => !CUANDO[x.id] || CUANDO[x.id](ctx)).map((x) => {
    // con la sala de miel abierta, el mate cocido va con miel (un poco más caro)
    if (x.id === 'mate-cocido' && ctx.locales['sala-miel']) return { ...x, nombre: 'Mate cocido con miel', precio: x.precio + 30, texto: 'Caliente y con miel de la sala de la aldea. Endulza el día.' };
    return { ...x };
  });
}

// ---------------------------------------------------------------- el guardado
export const CUENTA_MAX = 1500;
export const FUERTES_POR_NOCHE = 3;
export function cantinaNueva() { return { visitas: 0, ultima: 0, pedidos: 0, gastado: 0, cuenta: null, fuertes: { dia: 0, n: 0 } }; }
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
    cuenta, fuertes: { dia: Math.min(dia, entero(f.dia, 1e6)), n: entero(f.n, 99) },
  };
}
// La cantina de esta partida (se crea sola si la partida es de antes de la 3.9.0); sin economía (el Desafío), null
export function cantinaDe(p) {
  if (!hayEconomia(p)) return null;
  if (!objeto(p.cantina)) p.cantina = sanearCantina(null, p.dia);
  return p.cantina;
}
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
export function formasDePago(p, item) {
  const lista = [];
  const pesos = pesosDe(p);
  lista.push({ medio: 'pesos', ok: pesos >= item.precio, texto: `Pagar ${formatoPesos(item.precio)}`, motivo: pesos >= item.precio ? '' : 'plata' });
  let hay = 0;
  for (const k of TRUEQUE) {
    const n = cuantosPara(k, item.precio);
    if (tengoBien(p, k) >= n) { lista.push({ medio: 'trueque', ok: true, texto: `Trueque: ${textoBien(k, n)}`, bien: k, n }); if (++hay >= 3) break; }
  }
  if (!hay) lista.push({ medio: 'trueque', ok: false, texto: 'Trueque (llevá truchas, leña, frascos…)', motivo: 'nada' });
  const c = cantinaDe(p), deuda = c?.cuenta?.monto || 0;
  lista.push({ medio: 'cuenta', ok: deuda + item.precio <= CUENTA_MAX, texto: 'Anotalo en la cuenta', motivo: deuda + item.precio <= CUENTA_MAX ? '' : 'cuenta' });
  return lista;
}
// El mandado con el que se salda la cuenta: una cosa y cuántas, por el día (cambia, para que no sea siempre lo mismo)
export function mandadoDe(monto, dia) {
  const k = MANDADOS[(Math.max(1, Math.floor(dia)) + Math.floor(monto / 100)) % MANDADOS.length];
  return { k, n: cuantosPara(k, monto) };
}
// Pedir algo. `forma`: { medio, bien? }. Cobra y devuelve el pedido ({ ok, item, medio, ... }) o el motivo de la negativa.
export function pedir(p, itemId, forma, dia, hora = 20, carta = null) {
  const c = cantinaDe(p);
  const lista = carta || CARTA;
  const item = lista.find((x) => x.id === itemId);
  if (!c || !item) return { ok: false, motivo: 'no-hay' };
  const noche = nocheDe(dia, hora);
  if (item.fuerte && c.fuertes.dia === noche && c.fuertes.n >= FUERTES_POR_NOCHE) return { ok: false, motivo: 'ya-esta', item };
  const medio = forma?.medio;
  let cobro = null;
  if (medio === 'pesos') {
    const r = pagar(p, item.precio, `Cantina: ${item.nombre}`, NOMBRE_MOZA);
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
  if (cobro.pesos) c.gastado += cobro.pesos;
  c.ultima = Math.max(1, Math.floor(dia));
  if (item.fuerte) { if (c.fuertes.dia !== noche) c.fuertes = { dia: noche, n: 0 }; c.fuertes.n++; }
  return { ok: true, item, medio, cobro, id: itemId };
}
// Saldar la cuenta: con pesos o con el mandado
export function saldarCuenta(p, medio) {
  const c = cantinaDe(p);
  if (!c?.cuenta) return { ok: false, motivo: 'sin-cuenta' };
  const { monto, k, n } = c.cuenta;
  if (medio === 'pesos') {
    const r = pagar(p, monto, 'Cantina: la cuenta', NOMBRE_MOZA);
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
  const h = ((Number(hora) % 24) + 24) % 24, ds = diaSemanaDe(dia);
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
const eleg = (lista, semilla) => lista[Math.abs(Math.floor(semilla)) % lista.length];
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
