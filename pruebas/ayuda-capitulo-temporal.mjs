// 4.15.0: el capítulo de «la noche del temporal» de la Historia vieja (3.1) ya no es un capítulo de la Historia nueva, pero lo que lo probaban sus
// pruebas (el momento «al final», que el temporal sea el del capítulo y no uno al azar, que se tilde pasada la noche, la visita que no pudo venir)
// es mecánica de `historia.js` que sigue en pie. Esta ayuda sube un capítulo igual al de antes AL FINAL de la lista (en el proceso de la prueba) para
// seguir probando esa mecánica. No toca el juego. Devuelve el número de capítulo (empieza en 0).
import { CUENTOS } from '../src/cuentos.js';

export function instalarCapituloTemporal(H) {
  const ya = H.CAPITULOS.findIndex((c) => c.id === 'temporal');
  if (ya >= 0) return ya;
  const desde = (s, b, k) => Math.max(0, (Number(s[k]) || 0) - (Number(b?.[k]) || 0));
  const pasoLaNoche = (s, d) => { const hoy = Number(s.dia) || 0; return hoy > d + 1 || (hoy === d + 1 && (Number(s.horas ?? H.FIN_TEMPORAL) || 0) >= H.FIN_TEMPORAL); };
  const cap = {
    id: 'temporal', titulo: 'La noche del temporal',
    intro: ['La radio del Cerro Negro lo repitió tres veces.'],
    objetivos: [
      { id: 'visita', tecla: '·', texto: 'Recibí una visita en tu mesa (vienen a la tarde)', vecinos: true, hecho: (s, b) => desde(s, b, 'visitas') >= 1 },
      { id: 'cuento', tecla: 'E', texto: 'Con un fuego prendido cerca de la mesa, que la visita se quede y cuente un cuento', vecinos: true, hecho: (s, b) => desde(s, b, 'cuentos') >= 1 || (s.cuentos >= CUENTOS.length && desde(s, b, 'visitas') >= 1) },
      { id: 'temporal', tecla: '·', delMomento: true, texto: 'Pasá la noche del temporal', hecho: (s, b) => s.eventos.has('temporal') && (s.eventosDia?.temporal ?? Infinity) >= (b?.dia || 1) && pasoLaNoche(s, s.eventosDia.temporal) },
    ],
    momento: { evento: 'temporal', cuando: 'resto' },
    outro: ['El temporal pasó de largo a la madrugada.'],
    premio: { cuenta: { poncho: 1 }, texto: 'Un poncho tejido por los vecinos' },
  };
  H.CAPITULOS.push(cap);
  H.CAPITULO.temporal = cap;
  return H.CAPITULOS.length - 1;
}
