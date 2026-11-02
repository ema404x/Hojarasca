// 4.18.2: los textos del lazo de los vecinos que no tenían (Rosa, Tobías, Tito, Belisario, Herminia, Nicanor y Sofía) como DATOS. Módulo puro.
// ARCHIVO HUECO de A: lo reemplaza el de B (historia-texto-lazos.js, CAMBIOS_4_18_2_B.md). Todo es opcional por vecino: la mecánica tolera lo que falte.
//   · guia[clave]    = 'la panadera'                    el oficio corto que va en la guía al lado del nombre
//   · final[clave]   = { casa, tirante }                una línea del final con lazo de la casa (>= 3) y, donde el guion lo justifique, una tirante (< 0)
//   · charlas[clave] = [{ id, cap, texto, cuando: { lazo: { min } | { max } } }]   la línea de charla nueva con lazo >= 2 y la tirante con lazo < 0
//   · tablon[id]     = { caps, quien, titulo, ofrecida, hecha }   la entrada del tablón de la optativa nueva de Sofía
export const TEXTO_LAZOS = {
  guia: {},
  final: {},
  charlas: {},
  tablon: {
    // (provisorio: B lo reemplaza)
    'foto-valle': { caps: [7, 8], quien: 'sofia', titulo: 'Una foto del valle', ofrecida: '(provisorio)', hecha: '(provisorio)' },
  },
};
