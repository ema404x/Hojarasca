// 4.18.2: la escena de la optativa nueva de Sofía (la fotógrafa), que es la que le da lazo, como DATOS. Módulo puro.
// ARCHIVO HUECO de A: lo reemplaza el de B (historia-escenas-lazos.js, CAMBIOS_4_18_2_B.md). La escena de acá es PROVISORIA y sólo existe para poder
// conectar y probar la mecánica antes de juntar; no se escribe nada de guion en ella.
//   · ESCENAS_LAZOS    id → escena        · IDS_LAZOS    los ids        · EFECTOS_LAZOS   los nombres de efecto que usan
//   · DISPARO_LAZOS    por escena: capítulo, dónde está parado el jugador, cuándo y qué optativa la cuenta como hecha
//   · OPTATIVA_SOFIA   el dato que necesita el registro de optativas (historia-optativas.js)
import { efectosDe, narra, efecto } from './historia-escenas-util.js';
import { pj } from './historia-escenas-acto2-util.js';

const fotoValleSofia = {
  id: 'foto-valle-sofia', titulo: 'La foto del valle', acto: 2, capitulo: 7,
  resumen: 'Provisoria: Sofía te muestra una foto del valle.',
  personajes: pj('sofia', 'narra'),
  pasos: [
    narra('(escena provisoria)'),
    efecto('lazo:sofia:1'),
  ],
};

export const ESCENAS_LAZOS = {
  'foto-valle-sofia': fotoValleSofia,
};
export const IDS_LAZOS = Object.keys(ESCENAS_LAZOS);
export const EFECTOS_LAZOS = [...new Set(Object.values(ESCENAS_LAZOS).flatMap((e) => efectosDe(e)))].sort();
export const POR_DEFECTO_LAZOS = {};
export const DISPARO_LAZOS = {
  'foto-valle-sofia': { cap: 7, jugadorEn: 'frente a Sofía, en el estudio de fotos', cuando: 'provisorio', objetivo: 'foto-valle', ofrece: null },
};
export const OPTATIVA_SOFIA = {
  id: 'foto-valle', escena: 'foto-valle-sofia', desde: 'cosecha', hasta: 'cuaderno',
  ofrece: { escenas: [], temas: [], trato: null },
  disparo: { modo: 'hablar', clave: 'fotografa' },
};
