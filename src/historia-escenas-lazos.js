// 4.18.2: la escena de la optativa nueva de Sofía (la fotógrafa), que es la que le da lazo, como DATOS. Módulo puro.
// ARCHIVO HUECO de A: lo reemplaza el de B (historia-escenas-lazos.js, CAMBIOS_4_18_2_B.md) con estos mismos nombres. La escena de acá es PROVISORIA
// y sólo existe para poder conectar y probar la mecánica antes de juntar (tiene la misma forma que la de B: id `foto-valle`, la elección `valle-luz`
// con `lazo:sofia:2` o `lazo:sofia:1` y el indicio `raro:foto-del-valle`); no se escribe nada de guion en ella.
//   · ESCENAS_LAZOS    id → escena        · IDS_LAZOS    los ids        · EFECTOS_LAZOS   los nombres de efecto que usan
//   · DISPARO_LAZOS    por escena: capítulo, dónde está parado el jugador, cuándo y qué optativa la cuenta como hecha
//   · POR_DEFECTO_LAZOS   vacío (no decide nada grande)
import { efectosDe, narra, efecto, opcion, eleccion } from './historia-escenas-util.js';
import { pj } from './historia-escenas-acto2-util.js';

const fotoValle = {
  id: 'foto-valle', titulo: 'La luz de las cinco', acto: 2, capitulo: 7,
  resumen: 'Provisoria: Sofía te saca una foto del valle.',
  personajes: pj('sofia', 'narra'),
  pasos: [
    narra('(escena provisoria)'),
    eleccion('valle-luz', '¿Qué hacés mientras la luz se decide?', [
      opcion('esperar', 'Quedarme quieto hasta que llegue la luz.', { efecto: 'lazo:sofia:2' }),
      opcion('apurar', 'Decirle que saque nomás.', { efecto: 'lazo:sofia:1' }),
    ], 1),
    efecto('raro:foto-del-valle'),
  ],
};

export const ESCENAS_LAZOS = {
  'foto-valle': fotoValle,
};
export const IDS_LAZOS = Object.keys(ESCENAS_LAZOS);
export const EFECTOS_LAZOS = [...new Set(Object.values(ESCENAS_LAZOS).flatMap((e) => efectosDe(e)))].sort();
export const POR_DEFECTO_LAZOS = {};
const d = (cap, jugadorEn, cuando, objetivo, ofrece) => ({ cap, jugadorEn, cuando, objetivo, ofrece });
export const DISPARO_LAZOS = {
  'foto-valle': d(7, 'frente a Sofía, en el estudio de fotos', 'provisorio', 'foto-valle', null),
};
