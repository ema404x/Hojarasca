// 4.10 base: lo que crece con las noches, guardado en la partida (`desafio.crece`): los trofeos ganados y las noches del perro. Los
// bonos que dan van con los del guardián (`desafio.bonos`, origen 'trofeo' y 'defensa': ver desafio-bonos.js). Reglas puras. Una
// partida vieja no lo trae y carga limpia.
import { sanearTrofeos } from './desafio-trofeos.js';
import { sanearPerro } from './desafio-perro-aprende.js';

export function creceNuevo() { return { trofeos: {}, perro: { noches: 0 } }; }
export function sanearCrece(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  return { trofeos: sanearTrofeos(x.trofeos), perro: sanearPerro(x.perro) };
}
