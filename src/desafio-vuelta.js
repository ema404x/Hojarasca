// Nueva partida+: otra vuelta al Desafío, después del nido.
//
// Con el nido abajo el Desafío termina de verdad y no queda nada por hacer. La vuelta
// arranca de cero —día uno, sin base, sin materiales— pero con lo que te ganaste: las
// armas, las mejoras de cristal y los planos de la tecnología de los invasores. Y ellos
// también vuelven mejor: cada vuelta vienen más, aguantan más y pegan más fuerte.
//
// Módulo puro (se prueba en Node).

// Lo que se lleva de una vuelta a la otra: lo que se gana peleando, no lo que se junta.
export const SE_LLEVA = ['hacha', 'lanza', 'arco', 'honda', 'boleadoras', 'martillo', 'pistola', 'lanzaCristal', 'arcoReforzado', 'pistolaCargada',
  // 2.5: el arsenal (lo que se fabrica una vez y sus mejoras; la munición no)
  'ballesta', 'facon', 'maza', 'arpon', 'rodela', 'chaleco', 'carcaj', 'cuerno', 'hachuela', 'jabalina', 'granada', 'humo', 'bengala',
  'ballestaRepeticion', 'boleadorasCristal', 'placasCristal',
  // 3.8.3: y la forja (desafio-valle.js): la lanza de hielo, las flechas de rayo y la honda de empuje se perdían
  'lanzaHielo', 'arcoRayo', 'hondaEmpuje',
  // 4.9 defensas: el farol de mano y la pala de brasas (lo que se fabrica una vez; la miel y las brasas no)
  'farolMano', 'pala'];
export const VUELTA_MAXIMA = 9;

// Cuánto más difícil es cada vuelta. La primera (0) es la de siempre.
// 4.22.0: antes +20 % de cantidad, +25 % de vida y +15 % de daño por vuelta: la cantidad chocaba con el tope de 24 en la vuelta 3 y de ahí en más
// cada vuelta sólo sumaba vida y daño (en la vuelta 10 la noche 20 traía la misma cantidad que en la 3, con 3,7 veces la vida: una esponja).
// Ahora +12 / +15 / +10 %: el tope se alcanza después y la vuelta 10 queda en 17.239 de vida en vez de 22.088.
export const SUBE_POR_VUELTA = { cantidad: 0.12, vida: 0.15, dano: 0.10 };
export function multiplicadorVuelta(vuelta) {
  const v = Math.max(0, Math.min(VUELTA_MAXIMA, Math.floor(Number(vuelta) || 0)));
  return { cantidad: 1 + v * SUBE_POR_VUELTA.cantidad, vida: 1 + v * SUBE_POR_VUELTA.vida, dano: 1 + v * SUBE_POR_VUELTA.dano };
}

export function textoVuelta(vuelta) {
  const v = Math.floor(Number(vuelta) || 0);
  return v > 0 ? `Vuelta ${v + 1}` : '';
}

// ¿Se puede ofrecer? Sólo con el Desafío terminado del todo: nodriza y nido abajo.
export function puedeOtraVuelta(d) {
  return !!d?.victoria && !!d?.nido?.caido && (Number(d.vuelta) || 0) < VUELTA_MAXIMA;
}
