// El gallinero: cuatro gallinas junto a la casa y huevos todos los días. Completa lo que
// empezó la 1.10 con la huerta y la majada: lo de todos los días en un campo.
//
// Cada gallinero trae sus gallinas. Ponen de día, un huevo cada una, y los huevos se
// juntan con E. Si no los juntás, se acumulan hasta llenar el nidal y ahí dejan de poner.
//
// Módulo puro (se prueba en Node); las gallinas se dibujan en gallinero-mundo.js.

export const GALLINAS = 4;
export const NIDAL = 10;                 // más huevos que esto no entran: dejan de poner
export const HORA_SALEN = 7, HORA_ENTRAN = 19.5;   // de noche duermen adentro

const ent = (v, def = 0) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : def);

export function claveGallinero(x, z) {
  return `${Math.round(Number(x) || 0)}:${Math.round(Number(z) || 0)}`;
}

// Un gallinero recién hecho: el primer día ya hay algo para juntar a la tarde.
export function gallineroNuevo(dia) {
  return { desde: ent(dia, 1), juntados: 0 };
}

export function sanearGallineros(v) {
  const salida = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return salida;
  let n = 0;
  for (const [clave, g] of Object.entries(v)) {
    if (!/^-?\d+:-?\d+$/.test(clave) || !g || typeof g !== 'object') continue;
    salida[clave] = { desde: ent(g.desde, 1), juntados: Math.max(0, ent(g.juntados, 0)) };
    if (++n >= 16) break;
  }
  return salida;
}

// Huevos esperando en el nidal: los días desde que lo pusiste, por gallina, menos los
// que ya juntaste, con el techo del nidal.
export function huevosEnNidal(g, dia) {
  if (!g) return 0;
  const puestos = Math.max(0, ent(dia, 1) - g.desde + 1) * GALLINAS;
  return Math.max(0, Math.min(NIDAL, puestos - g.juntados));
}

// Juntar: se lleva todo lo que hay. Lo que no entró en el nidal se perdió (los días
// llenos no pusieron), así que se vuelve a contar desde hoy.
export function juntarHuevos(g, dia) {
  const n = huevosEnNidal(g, dia);
  if (!n) return { ok: false, huevos: 0 };
  g.desde = ent(dia, 1) + 1;
  g.juntados = 0;
  return { ok: true, huevos: n };
}

export function afuera(horas) {
  const h = ((Number(horas) || 0) % 24 + 24) % 24;
  return h >= HORA_SALEN && h < HORA_ENTRAN;
}

export function textoGallinero(g, dia) {
  const n = huevosEnNidal(g, dia);
  if (!n) return 'Gallinero: el nidal está vacío';
  if (n >= NIDAL) return `Juntar huevos (${n}, el nidal está lleno)`;
  return n === 1 ? 'Juntar un huevo' : `Juntar huevos (${n})`;
}
