// 4.10 base: lo que crece con las noches, guardado en la partida (`desafio.crece`): los trofeos ganados, las noches del perro y
// los bonos de la base. Reglas puras. Una partida vieja no lo trae y carga limpia.
import { sanearTrofeos } from './desafio-trofeos.js';
import { sanearPerro } from './desafio-perro-aprende.js';
import { sanearBonos } from './desafio-bonos-base.js';

export function creceNuevo() { return { trofeos: {}, perro: { noches: 0 }, bonos: {} }; }
export function sanearCrece(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  return { trofeos: sanearTrofeos(x.trofeos), perro: sanearPerro(x.perro), bonos: sanearBonos(x.bonos) };
}
