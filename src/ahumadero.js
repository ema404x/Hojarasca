// 2.3: el ahumadero. Hasta ahora todo lo que se pescaba volvía al agua. Con un ahumadero
// terminado te quedás con dos truchas por día —como pide el permiso de pesca de la
// zona— y el resto se devuelve igual. Las truchas se cuelgan con un tronco de leña y en
// medio día salen ahumadas: se comen en invierno, se cambian en la feria o se mandan.
// Puro, sin THREE.
export const AHUMADERO = {
  horas: 12,          // medio día de humo
  capacidad: 4,       // truchas por tanda
  lena: 1,            // troncos por tanda
  porDia: 2,          // truchas que te podés quedar por día
};
// Sólo las truchas se ahuman: la perca y el pejerrey son nativos y vuelven siempre.
export const TRUCHAS = ['arcoiris', 'marron', 'fontinalis'];

export function ahumaderoVacio() { return { truchas: 0, horas: 0, listas: 0 }; }
export function sanearAhumadero(a) {
  const x = a && typeof a === 'object' ? a : {};
  const ent = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  const truchas = ent(x.truchas, AHUMADERO.capacidad);
  const listas = truchas ? 0 : ent(x.listas, AHUMADERO.capacidad);
  const horas = truchas ? Math.max(0, Math.min(AHUMADERO.horas, Number(x.horas) || 0)) : 0;
  return { truchas, horas, listas };
}

// ¿Esta trucha te la quedás? `hoy`: cuántas te quedaste en el día.
export function teLaQuedas(pezId, hayAhumadero, hoy) {
  return !!hayAhumadero && TRUCHAS.includes(pezId) && (hoy || 0) < AHUMADERO.porDia;
}

// El humo corre aunque no estés, de día y de noche, y el techo lo cubre de la lluvia.
export function avanzarAhumado(a, horas) {
  if (!a || !a.truchas || !(horas > 0)) return false;
  a.horas += horas;
  if (a.horas < AHUMADERO.horas) return false;
  a.listas = a.truchas; a.truchas = 0; a.horas = 0;
  return true;
}

// E junto al ahumadero. `frescas`: truchas en la mochila; `lena`: troncos a mano.
export function usarAhumadero(a, frescas, lena) {
  if (!a) return { accion: 'nada' };
  if (a.listas > 0) { const n = a.listas; a.listas = 0; return { accion: 'sacar', ahumadas: n }; }
  if (a.truchas > 0) return { accion: 'ahumando', faltan: Math.max(1, Math.ceil(AHUMADERO.horas - a.horas)) };
  if (!(frescas > 0)) return { accion: 'sinTruchas' };
  if (!((lena || 0) >= AHUMADERO.lena)) return { accion: 'sinLena' };
  const n = Math.min(AHUMADERO.capacidad, frescas);
  a.truchas = n; a.horas = 0;
  return { accion: 'colgar', truchas: n, lena: AHUMADERO.lena };
}

export function avisoAhumadero(a, frescas, lena) {
  if (!a) return null;
  if (a.listas > 0) return `Sacar las truchas ahumadas (${a.listas})`;
  if (a.truchas > 0) return `Ahumando: faltan unas ${Math.max(1, Math.ceil(AHUMADERO.horas - a.horas))} horas`;
  if (frescas > 0) return lena >= AHUMADERO.lena ? `Colgar ${Math.min(AHUMADERO.capacidad, frescas)} ${frescas === 1 ? 'trucha' : 'truchas'} al humo` : 'Falta un tronco para el fuego';
  return 'Ahumadero vacío';
}
