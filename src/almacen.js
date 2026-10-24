// 4.2: el almacenaje con tope. Pila de piedra, depósito de piedra techado, barraca de materiales, herramientero y silo: cada uno
// guarda hasta un TOPE que depende de su tamaño y de cuántas veces lo ampliaste (se amplía pagando pesos y materiales, una etapa por vez).
// Módulo puro (sólo obra-pesos.js y economia.js): se prueba en Node. Lo que guarda cada obra vive en `datos.almacen` = { n, g }:
//   · n: el nivel (0 es el tamaño con que se construye; cada ampliación suma uno);
//   · g: lo guardado por clave ({ piedra: 18 }); en el herramientero, 1 por herramienta colgada.
// El juego (almacen-juego.js) hace el resto: la E, las notas, el pago de la construcción desde los depósitos de alrededor y la devolución
// de lo guardado cuando se desarma la obra.
import { registrarPrecios } from './obra-pesos.js';
import { formatoPesos } from './economia.js';

// Cómo se llama cada cosa que se guarda: [uno, varios]
export const ETIQUETA = {
  tronco: ['tronco', 'troncos'], tabla: ['tabla', 'tablas'], piedra: ['piedra', 'piedras'], cristal: ['semilla dorada', 'semillas doradas'], lana: ['vellón de lana', 'vellones de lana'],
  haba: ['haba', 'habas'], papa: ['papa', 'papas'], 'frutilla-huerta': ['frutilla', 'frutillas'], frutilla: ['frutilla', 'frutillas'], calafate: ['calafate', 'calafates'],
  hacha: ['hacha', 'hachas'], pico: ['pico', 'picos'], tijera: ['tijera', 'tijeras'], mosca: ['mosca de pescar', 'moscas de pescar'], farol: ['farol', 'faroles'], botas: ['botas de goma', 'botas de goma'],
  // 4.6 recursos: los materiales y las herramientas de zona (recursos-zona.js)
  junco: ['junco', 'juncos'], hierbas: ['atado de hierbas', 'atados de hierbas'], arcilla: ['terrón de arcilla', 'terrones de arcilla'], cuero: ['cuero', 'cueros'], 'piedra-cantera': ['piedra de cantera', 'piedras de cantera'],
  'hoz-junco': ['hoz de junco', 'hoces de junco'], 'pala-arcilla': ['pala de arcilla', 'palas de arcilla'], 'cuchillo-cuero': ['cuchillo de cuero', 'cuchillos de cuero'], 'pico-cantero': ['pico de cantero', 'picos de cantero'],
};
// Lo que muestra el resumen («Piedra 18/40»): la palabra corta de cada clave
const CORTA = { tronco: 'Troncos', tabla: 'Tablas', piedra: 'Piedra', cristal: 'Semillas doradas', lana: 'Lana', haba: 'Habas', papa: 'Papas', 'frutilla-huerta': 'Frutillas', frutilla: 'Frutillas', calafate: 'Calafates', hacha: 'Hacha', pico: 'Pico', tijera: 'Tijera', mosca: 'Mosca', farol: 'Farol', botas: 'Botas',
  // 4.6 recursos
  junco: 'Junco', hierbas: 'Hierbas', arcilla: 'Arcilla', cuero: 'Cuero', 'piedra-cantera': 'Piedra de cantera', 'hoz-junco': 'Hoz', 'pala-arcilla': 'Pala', 'cuchillo-cuero': 'Cuchillo', 'pico-cantero': 'Pico de cantero' };
// 4.6 recursos: los materiales de zona entran en la barraca, pero el resumen los nombra sólo si hay (si no, «Troncos 0/40 · … · Junco 0/40 …» no entra en el aviso)
const SOLO_SI_HAY = new Set(['junco', 'hierbas', 'arcilla', 'cuero', 'piedra-cantera']);

export const nombreDe = (k, n = 2) => { const e = ETIQUETA[k]; return e ? (n === 1 ? e[0] : e[1]) : k; };
export const cuantosDe = (n, k) => `${n} ${nombreDe(k, n)}`;

// El acopio de siempre (un cajón con todo apilado) también tiene tope desde la 4.2: de cada material
export const TOPE_ACOPIO = 40;

// guarda: qué cosas entran. modo: 'clase' = el tope vale por cada cosa (40 de piedra Y 40 de tablas); 'total' = el tope es de todo junto.
// topes[n]: el tope en el nivel n. ampliaciones[i]: lo que cuesta pasar del nivel i al i+1 (materiales y pesos).
export const ALMACENES = {
  'pila-piedra': {
    nombre: 'Pila de piedra', articulo: 'la pila de piedra', del: 'de la pila de piedra', f: true, tipo: 'material', modo: 'clase', guarda: ['piedra'], titulo: 'Piedra',
    topes: [30], ampliaciones: [],
  },
  'deposito-piedra': {
    nombre: 'Depósito de piedra techado', articulo: 'el depósito', del: 'del depósito', f: false, tipo: 'material', modo: 'clase', guarda: ['piedra'], titulo: 'Piedra',
    topes: [60, 100, 160],
    ampliaciones: [{ pide: { tabla: 6, piedra: 8 }, pesos: 2000 }, { pide: { tabla: 10, piedra: 14, tronco: 3 }, pesos: 4000 }],
  },
  barraca: {
    nombre: 'Barraca de materiales', articulo: 'la barraca', del: 'de la barraca', f: true, tipo: 'material', modo: 'clase', guarda: ['tronco', 'tabla', 'piedra', 'lana', 'junco', 'hierbas', 'arcilla', 'cuero', 'piedra-cantera'], titulo: 'Materiales',   // 4.6 recursos: y los de zona
    topes: [40, 70, 110, 160],
    ampliaciones: [{ pide: { tabla: 12, tronco: 4 }, pesos: 3500 }, { pide: { tabla: 16, tronco: 6, piedra: 8 }, pesos: 6500 }, { pide: { tabla: 24, tronco: 8, piedra: 12, lana: 4 }, pesos: 11000 }],
  },
  silo: {
    nombre: 'Silo y granero', articulo: 'el silo', del: 'del silo', f: false, tipo: 'cosecha', modo: 'total', guarda: ['haba', 'papa', 'frutilla', 'calafate'], titulo: 'Cosecha',   // 4.10.1: «frutilla» (la clave de la mochila; el cantero cosecha eso). Antes decía 'frutilla-huerta', que sólo es la anotación del cuaderno, y el silo no guardaba frutillas
    topes: [60, 120, 200],
    ampliaciones: [{ pide: { tabla: 10, tronco: 4 }, pesos: 3000 }, { pide: { tabla: 16, tronco: 6, piedra: 6 }, pesos: 5500 }],
  },
  herramientero: {
    nombre: 'Herramientero', articulo: 'el herramientero', del: 'del herramientero', f: false, tipo: 'herramienta', modo: 'total', guarda: ['hacha', 'pico', 'tijera', 'mosca', 'farol', 'botas', 'hoz-junco', 'pala-arcilla', 'cuchillo-cuero', 'pico-cantero'], titulo: 'Ganchos',   // 4.6 recursos: y las de zona
    unidad: 'ganchos',
    topes: [4, 6],
    ampliaciones: [{ pide: { tabla: 4, tronco: 1 }, pesos: 900 }],
  },
};
export const IDS_ALMACEN = Object.keys(ALMACENES);
export const esAlmacen = (id) => typeof id === 'string' && Object.hasOwn(ALMACENES, id);
export const esDeMateriales = (id) => esAlmacen(id) && ALMACENES[id].tipo === 'material';
export const idPrecioAmpliacion = (id) => `ampliar-${id}`;

// Los precios de las ampliaciones van al mismo registro que los de las etapas de las obras (obra-pesos.js): el pago, el libro, el aviso
// de «te faltan» y el reintegro al desmontar son los de siempre.
for (const id of IDS_ALMACEN) {
  const A = ALMACENES[id];
  if (A.ampliaciones.length) registrarPrecios(idPrecioAmpliacion(id), A.ampliaciones.map((x) => x.pesos), {
    nombre: A.nombre.toLowerCase(), motivoPago: `Ampliación: ${A.nombre.toLowerCase()}`, motivoDevolucion: `Devolución de la ampliación: ${A.nombre.toLowerCase()}`,
    motivoReintegro: `Reintegro por desmontar (ampliaciones): ${A.nombre.toLowerCase()}`, sujeto: 'La ampliación', verbo: 'cuesta', deLoPagado: 'de la ampliación', pagaA: 'Los carpinteros de la aldea', reintegro: 0.5,
  });
}

// ---------------------------------------------------------------- el estado de una obra
export const almacenNuevo = () => ({ n: 0, g: {} });
export const nivelMax = (id) => (esAlmacen(id) ? ALMACENES[id].topes.length - 1 : 0);
const entero = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(99999, n)) : 0; };

// Sanea lo que vino del guardado: un nivel que existe y sólo las cosas que ese almacén guarda. Lo guardado NO se recorta al tope (una
// partida editada a mano no pierde nada): el tope sólo frena lo que se agrega.
export function sanearAlmacen(v, id) {
  const A = ALMACENES[id];
  if (!A) return almacenNuevo();
  const o = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const n = Math.min(nivelMax(id), entero(o.n));
  const g = {};
  const crudo = o.g && typeof o.g === 'object' && !Array.isArray(o.g) ? o.g : {};
  for (const k of A.guarda) {
    const c = A.tipo === 'herramienta' ? (entero(crudo[k]) > 0 ? 1 : 0) : (entero(crudo[k]) || (k === 'frutilla' ? entero(crudo['frutilla-huerta']) : 0));   // 4.10.1: un silo guardado con la clave vieja no pierde las frutillas
    if (c > 0) g[k] = c;
  }
  return { n, g };
}

export const topeDe = (id, a) => ALMACENES[id]?.topes[Math.min(nivelMax(id), entero(a?.n))] || 0;
export const guardadoDe = (a, k) => entero(a?.g?.[k]);
export const totalGuardado = (id, a) => (ALMACENES[id]?.guarda || []).reduce((s, k) => s + guardadoDe(a, k), 0);
// Cuánto más entra de `k`
export function libreDe(id, a, k) {
  const A = ALMACENES[id];
  if (!A || !A.guarda.includes(k)) return 0;
  if (A.tipo === 'herramienta') return guardadoDe(a, k) ? 0 : Math.max(0, topeDe(id, a) - totalGuardado(id, a)) > 0 ? 1 : 0;
  return Math.max(0, topeDe(id, a) - (A.modo === 'clase' ? guardadoDe(a, k) : totalGuardado(id, a)));
}
// Guarda hasta `cuanto` de `k`; devuelve cuánto entró de verdad
export function guardar(id, a, k, cuanto) {
  const n = Math.min(entero(cuanto), libreDe(id, a, k));
  if (n <= 0) return 0;
  a.g = a.g || {};
  a.g[k] = guardadoDe(a, k) + n;
  return n;
}
// Saca hasta `cuanto` de `k`; devuelve cuánto salió
export function sacar(id, a, k, cuanto = Infinity) {
  const n = Math.min(guardadoDe(a, k), cuanto === Infinity ? Infinity : entero(cuanto));
  if (!(n > 0)) return 0;
  a.g[k] = guardadoDe(a, k) - n;
  if (a.g[k] <= 0) delete a.g[k];
  return n;
}
export const llenoDe = (id, a, k) => libreDe(id, a, k) <= 0;
export function estaLleno(id, a) {
  const A = ALMACENES[id];
  return !!A && A.guarda.every((k) => libreDe(id, a, k) <= 0);
}

// «Piedra 18/40» (una sola cosa), «Cosecha 12/60» (tope de todo junto) o «Troncos 12/40 · Tablas 0/40 · Piedra 18/40 · Lana 0/40»
export function resumen(id, a, { soloLoQueHay = false } = {}) {
  const A = ALMACENES[id];
  if (!A) return '';
  const tope = topeDe(id, a);
  if (A.modo === 'total') return `${A.titulo} ${totalGuardado(id, a)}/${tope}`;
  const ks = A.guarda.filter((k) => (!soloLoQueHay && !SOLO_SI_HAY.has(k)) || guardadoDe(a, k) > 0);   // 4.6 recursos: (los de zona, sólo si hay)
  return (ks.length ? ks : A.guarda.filter((k) => !SOLO_SI_HAY.has(k))).map((k) => `${CORTA[k]} ${guardadoDe(a, k)}/${tope}`).join(' · ');
}
// Lo guardado en palabras («12 troncos · 18 piedras»), para la nota al desarmar o sacar todo
export function contenidoEnPalabras(id, a) {
  const A = ALMACENES[id];
  if (!A) return '';
  return A.guarda.filter((k) => guardadoDe(a, k) > 0).map((k) => cuantosDe(guardadoDe(a, k), k)).join(' · ');
}
// Qué tan lleno está (0 a 1), para dibujar la pila: la más llena de las cosas, o el total sobre el tope
export function llenura(id, a) {
  const A = ALMACENES[id];
  const tope = topeDe(id, a);
  if (!A || !tope) return 0;
  const v = A.modo === 'clase' ? Math.max(0, ...A.guarda.map((k) => guardadoDe(a, k))) : totalGuardado(id, a);
  return Math.max(0, Math.min(1, v / tope));
}
// Lo mismo en cuatro pasos (0 vacío, 1 poco, 2 bastante, 3 lleno): lo que se dibuja y lo que decide si hay que rehacer la malla
export function pasoDeLlenura(id, a) {
  const x = llenura(id, a);
  return x <= 0 ? 0 : x >= 0.999 ? 3 : x > 0.5 ? 2 : 1;
}
// El nivel de una clave en cuatro pasos (para dibujar cada pila por separado)
export function pasoDe(id, a, k) {
  const tope = topeDe(id, a);
  const x = tope ? Math.min(1, guardadoDe(a, k) / tope) : 0;
  return x <= 0 ? 0 : x >= 0.999 ? 3 : x > 0.5 ? 2 : 1;
}

// ---------------------------------------------------------------- ampliar
// La próxima ampliación de esta obra: { indice, pide, pesos, tope (el nuevo) } o null si ya está en el máximo
export function proximaAmpliacion(id, a) {
  const A = ALMACENES[id];
  if (!A) return null;
  const n = Math.min(nivelMax(id), entero(a?.n));
  const x = A.ampliaciones[n];
  return x ? { indice: n, pide: { ...x.pide }, pesos: x.pesos, tope: A.topes[n + 1], topeActual: A.topes[n] } : null;
}
export function ampliar(id, a) {
  if (!proximaAmpliacion(id, a)) return false;
  a.n = Math.min(nivelMax(id), entero(a.n) + 1);
  return true;
}
// «Sube el tope de 40 a 70 · 12 tablas y 4 troncos y $3.500» (para la confirmación)
export function textoAmpliacion(id, a) {
  const s = proximaAmpliacion(id, a);
  if (!s) return '';
  const mats = Object.entries(s.pide).map(([k, n]) => cuantosDe(n, k)).join(', ');
  const unidad = ALMACENES[id].unidad || '';
  return `Sube el tope de ${s.topeActual} a ${s.tope}${unidad ? ` ${unidad}` : ''} · cuesta ${mats} y ${formatoPesos(s.pesos)}`;
}

// ---------------------------------------------------------------- la ficha del plano
// La parte del texto del plano que habla de la capacidad («Guarda hasta 30 piedras. Se amplía dos veces: …»)
export function textoCapacidad(id) {
  const A = ALMACENES[id];
  if (!A) return '';
  const t = A.topes;
  const que = A.tipo === 'herramienta' ? `${t[0]} herramientas` : A.modo === 'clase' ? (A.guarda.length === 1 ? `${t[0]} ${nombreDe(A.guarda[0])}` : `${t[0]} de cada material (${A.guarda.filter((k) => !SOLO_SI_HAY.has(k)).map((k) => nombreDe(k)).join(', ')}${A.guarda.some((k) => SOLO_SI_HAY.has(k)) ? ', y los de zona: junco, hierbas, arcilla, cuero y piedra de cantera' : ''})`) : `${t[0]} de cosecha`;
  const base = `Guarda hasta ${que}.`;
  if (A.ampliaciones.length === 0) return `${base} No se amplía: para más, el depósito techado.`;
  const pasos = A.ampliaciones.map((x, i) => `${t[i + 1]} por ${formatoPesos(x.pesos)}`);
  return `${base} Se amplía ${A.ampliaciones.length === 1 ? 'una vez' : A.ampliaciones.length === 2 ? 'dos veces' : 'tres veces'} manteniendo E, pagando pesos y materiales: ${pasos.join(', ')}.`;
}
