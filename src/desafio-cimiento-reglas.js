// El cimiento de piedra (1.11, en la 2.2 junto al excavador de la 2.1). El excavador se
// mete bajo tierra cuando tiene una obra entre él y vos, y sale adentro de la base. Una
// zanja con piedras al pie de la madera —la empalizada, la reforzada, el portón— no se
// cava: ahí tiene que romper, como los demás. La piedra (la pirca, el muro) no lleva
// cimiento: contra el que sale adentro está la losa (O → Defensa).
//
// Se echa desde el taller (K → Base) sobre la madera más cercana. Módulo puro.

export const CIMENTABLES = ['empalizada', 'empalizada-reforzada', 'porton-empalizada'];
export const CIMIENTO = { pide: { piedra: 3 } };

export function admiteCimiento(plano, datos) {
  return !!plano && CIMENTABLES.includes(plano.id) && !datos?.cimiento;
}
// ¿El excavador puede meterse por debajo de esta obra?
export const frenaAlExcavador = (obra) => !!obra?.datos?.cimiento;
