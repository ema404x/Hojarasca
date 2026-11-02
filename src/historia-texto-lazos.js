// 4.18.2: los textos del lazo de los vecinos que no tenían (Rosa, Tobías, Tito, Belisario, Herminia, Nicanor y Sofía) como DATOS. Módulo puro.
// ARCHIVO HUECO de A: lo reemplaza el de B (historia-texto-lazos.js, CAMBIOS_4_18_2_B.md) con estos mismos nombres. Todo es opcional por vecino:
// la mecánica tolera lo que falte.
//   · guia[quien]    = { nombre, rol, frases: { <palabra del lazo>: frase } }   el oficio corto y una línea bajo la palabra del lazo en la guía
//   · final[quien]   = [{ id, min?, max?, texto }]                               una línea del final con lazo de la casa (min) y, si el guion lo justifica, una tirante (max)
//   · charlas[quien] = [{ id, cap, texto, cuando: { lazo: { min?, max? } } | { escena } }]   la charla nueva con lazo bueno, la tirante y la «de después» de Sofía
//   · tablon[id]     = { caps, quien, titulo, ofrecida, hecha }                   la entrada del tablón de la optativa nueva de Sofía
//   · raro[id]       = { titulo, texto, cap, donde }                              el cuaderno de lo raro (el indicio de la foto del valle)
export const VECINOS_LAZO = ['rosa', 'tobias', 'tito', 'belisario', 'herminia', 'nicanor', 'sofia'];
export const TEXTO_LAZOS = {
  guia: {},
  final: {},
  charlas: {},
  tablon: {
    // (provisorio: B lo reemplaza)
    'foto-valle': { caps: [7, 8], quien: 'sofia', titulo: 'La foto del valle', ofrecida: '(provisorio)', hecha: '(provisorio)' },
  },
  raro: {
    // (provisorio: B lo reemplaza)
    'foto-del-valle': { titulo: 'La foto del valle', texto: '(provisorio)', cap: 7, donde: 'estudio de fotos' },
  },
};
// ¿el valor del lazo está en el tramo { min?, max? }?
export function lazoCumple(c, v) {
  const x = Number(v) || 0, w = c && typeof c === 'object' ? c : {};
  return (w.min === undefined || w.min === null || x >= Number(w.min)) && (w.max === undefined || w.max === null || x <= Number(w.max));
}
// Las líneas del final que corresponden a estos lazos, en el orden fijo de VECINOS_LAZO. `lazoDe`: (quien) => valor del lazo.
export function finalDeLazos(lazoDe) {
  const r = [];
  for (const q of VECINOS_LAZO) for (const l of Array.isArray(TEXTO_LAZOS.final[q]) ? TEXTO_LAZOS.final[q] : []) if (l && typeof l.texto === 'string' && lazoCumple(l, lazoDe(q))) r.push(l.texto);
  return r;
}
