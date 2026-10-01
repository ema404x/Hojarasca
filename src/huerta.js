// La huerta: canteros junto a la casa donde se siembra, se espera y se cosecha.
// Hasta acá el valle daba lo que daba —frutillas al borde del sendero, piñones al pie
// del pehuén— y lo único que se plantaba eran renovales. Esto es lo primero que el
// jugador hace crecer para comer.
//
// Cada cantero lleva un cultivo por vez. Crece con los días y la lluvia lo adelanta:
// un día que llovió cuenta doble, una sola vez por día. Lo que se cosecha entra a la
// mochila como cualquier cosa juntada, y de ahí va al fuego.
//
// 2.2: las dos computadoras hicieron cada una su huerta (la 1.10 con habas, papas y
// frutillas; la 2.0 con frutillas y calafates que se riegan). Quedó una sola, esta, con
// los cuatro cultivos. Los canteros de las partidas de la 2.x se convierten al cargar
// (`desdeCanteroViejo`): lo que tenían sembrado sigue creciendo donde estaba.
//
// Módulo puro (se prueba en Node): el cantero es una obra de construccion.js y las
// matas se dibujan en huerta-malla.js.

export const CULTIVOS = {
  habas: {
    nombre: 'habas', dias: 5, cosecha: 6, ingrediente: 'haba',
    // se siembran con semilla del almacén
    semilla: 'semillas-habas',
    texto: 'Van en fila y se atan a una caña cuando crecen.',
  },
  papas: {
    nombre: 'papas', dias: 7, cosecha: 5, ingrediente: 'papa',
    semilla: 'semillas-papa',
    texto: 'Se entierra un pedazo con ojo y se aporca cuando asoma.',
  },
  frutillas: {
    nombre: 'frutillas', dias: 3, cosecha: 4, ingrediente: 'frutilla',
    // la frutilla se siembra de un estolón de las silvestres: se gasta una
    siembraConIngrediente: true,
    texto: 'De un estolón de las silvestres del sendero. Crecen más parejas en tierra removida.',
  },
  // 2.0 (la otra rama): el calafate también se siembra con uno que juntaste
  calafates: {
    nombre: 'calafates', dias: 3, cosecha: 5, ingrediente: 'calafate',
    siembraConIngrediente: true,
    texto: 'De un fruto que juntaste. En tierra negra y con frío brota enseguida: es de acá.',
  },
};
export const ORDEN_CULTIVOS = ['habas', 'papas', 'frutillas', 'calafates'];

// Los canteros de la 2.x guardaban su planta adentro de la obra: { planta, crecido 0..1, agua }.
const DE_LA_2 = { frutilla: 'frutillas', calafate: 'calafates' };
export function desdeCanteroViejo(h, dia) {
  // 2.6.1: Object.hasOwn: con `planta: "constructor"` salía una función y CULTIVOS[...]
  // tiraba al cargar la partida
  const cultivo = Object.hasOwn(DE_LA_2, String(h?.planta)) ? DE_LA_2[h.planta] : null;
  if (!cultivo) return null;
  const crecido = Math.min(1, Math.max(0, Number(h.crecido) || 0));
  return { cultivo, dia: Math.max(1, Math.floor(Number(dia) || 1)) - Math.round(crecido * CULTIVOS[cultivo].dias), lluvia: 0, ultimaLluvia: -1 };
}

// Etapas de una mata, de la siembra a la cosecha.
export const ETAPAS_HUERTA = [
  { desde: 0, nombre: 'recién sembrado' },
  { desde: 0.25, nombre: 'brotando' },
  { desde: 0.6, nombre: 'creciendo' },
  { desde: 1, nombre: 'para cosechar' },
];

// Un cantero se reconoce por dónde está: la obra no lleva un id estable entre partidas.
export function claveCantero(x, z) {
  return `${Math.round(Number(x) || 0)}:${Math.round(Number(z) || 0)}`;
}

const ent = (v, def = 0) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : def);

export function sanearHuerta(v) {
  const salida = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return salida;
  let n = 0;
  for (const [clave, p] of Object.entries(v)) {
    if (!/^-?\d+:-?\d+$/.test(clave)) continue;
    // 2.6.1: sólo cultivos propios (un "toString" heredado pasaba y daba NaN)
    if (!p || typeof p !== 'object' || !Object.hasOwn(CULTIVOS, String(p.cultivo))) continue;
    salida[clave] = {
      cultivo: p.cultivo,
      dia: ent(p.dia, 1),
      lluvia: Math.max(0, Math.min(30, ent(p.lluvia, 0))),
      ultimaLluvia: ent(p.ultimaLluvia, -1),
    };
    if (p.ultimaHelada !== undefined) salida[clave].ultimaHelada = ent(p.ultimaHelada, -1);
    if (++n >= 64) break;   // nadie tiene sesenta canteros; más que esto es basura
  }
  return salida;
}

// Días que lleva crecido: los que pasaron más los que regó la lluvia.
export function diasCrecido(parcela, dia) {
  if (!parcela) return 0;
  return Math.max(0, (dia - parcela.dia) + (parcela.lluvia || 0));
}
// 0 recién sembrado · 1 para cosechar
export function avance(parcela, dia) {
  const c = parcela && CULTIVOS[parcela.cultivo];
  if (!c) return 0;
  return Math.min(1, diasCrecido(parcela, dia) / c.dias);
}
export function etapa(parcela, dia) {
  const a = avance(parcela, dia);
  let nombre = ETAPAS_HUERTA[0].nombre;
  for (const e of ETAPAS_HUERTA) if (a >= e.desde) nombre = e.nombre;
  return nombre;
}
export function lista(parcela, dia) {
  return !!parcela && avance(parcela, dia) >= 1;
}
export function diasQueFaltan(parcela, dia) {
  const c = parcela && CULTIVOS[parcela.cultivo];
  if (!c) return 0;
  return Math.max(0, Math.ceil(c.dias - diasCrecido(parcela, dia)));
}

// Qué se puede sembrar con lo que tenés encima, en orden de preferencia.
// `tengo(cosa)` devuelve cuántas semillas o frutillas hay.
export function semillaParaSembrar(tengo) {
  for (const id of ORDEN_CULTIVOS) {
    const c = CULTIVOS[id];
    const clave = c.siembraConIngrediente ? c.ingrediente : c.semilla;
    if ((Number(tengo(clave)) || 0) >= 1) return { cultivo: id, gasta: clave, conIngrediente: !!c.siembraConIngrediente };
  }
  return null;
}

export function sembrar(huerta, clave, cultivo, dia) {
  if (!Object.hasOwn(CULTIVOS, String(cultivo))) return { ok: false, motivo: 'eso no se siembra' };
  if (huerta[clave]) return { ok: false, motivo: 'ocupado' };
  huerta[clave] = { cultivo, dia: ent(dia, 1), lluvia: 0, ultimaLluvia: -1 };
  return { ok: true, parcela: huerta[clave] };
}

// La lluvia riega: un día con lluvia cuenta doble, pero una sola vez por día y por
// cantero, llueva lo que llueva. Devuelve cuántos canteros se regaron.
export function regarConLluvia(huerta, dia) {
  let n = 0;
  for (const p of Object.values(huerta)) {
    if (p.ultimaLluvia === dia) continue;
    const c = CULTIVOS[p.cultivo];
    if (!c || diasCrecido(p, dia) >= c.dias) continue;   // lo que ya está no necesita agua
    p.lluvia = (p.lluvia || 0) + 1;
    p.ultimaLluvia = dia;
    n++;
  }
  return n;
}

// 2.4: la helada. En invierno, cada día, lo que está afuera no crece: la siembra se corre
// un día. Lo que está bajo un invernadero (`protegido(clave)`) sigue como si nada, y el
// calafate, que es de acá, aguanta el frío. Una vez por día y por cantero. Devuelve
// cuántos canteros se helaron.
export const RESISTE_HELADA = ['calafates'];
export function helarHuerta(huerta, dia, protegido = () => false) {
  let n = 0;
  for (const [clave, p] of Object.entries(huerta)) {
    if (p.ultimaHelada === dia) continue;
    const c = CULTIVOS[p.cultivo];
    if (!c || RESISTE_HELADA.includes(p.cultivo) || diasCrecido(p, dia) >= c.dias) continue;
    if (protegido(clave)) continue;
    p.dia = (p.dia || 0) + 1;
    p.ultimaHelada = dia;
    n++;
  }
  return n;
}

export function cosechar(huerta, clave, dia) {
  const p = huerta[clave];
  if (!p) return { ok: false, motivo: 'vacio' };
  if (!lista(p, dia)) return { ok: false, motivo: 'verde', faltan: diasQueFaltan(p, dia) };
  const c = CULTIVOS[p.cultivo];
  delete huerta[clave];
  return { ok: true, cultivo: p.cultivo, ingrediente: c.ingrediente, cantidad: c.cosecha };
}

// Lo que dice el aviso cuando estás parado al lado.
export function textoCantero(parcela, dia) {
  if (!parcela) return 'Sembrar en el cantero';
  const c = CULTIVOS[parcela.cultivo];
  if (lista(parcela, dia)) return `Cosechar ${c.nombre}`;
  const faltan = diasQueFaltan(parcela, dia);
  return `${c.nombre.charAt(0).toUpperCase()}${c.nombre.slice(1)}: ${etapa(parcela, dia)} · ${faltan === 1 ? 'falta un día' : `faltan ${faltan} días`}`;
}

export function resumenHuerta(huerta, dia) {
  const ps = Object.values(huerta || {});
  return { canteros: ps.length, listos: ps.filter((p) => lista(p, dia)).length };
}
