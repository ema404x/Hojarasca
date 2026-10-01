// 2.1: de la huerta a la mesa.
//
// En el campo lo del verano se guarda para el invierno: la fruta se hace dulce y se
// envasa, y lo que no se cocina se seca al sol. Tres conservas:
//   · el frasco de dulce de frutilla, al fuego (cuatro frutillas);
//   · los calafates secos, colgados en el tendal (cinco frutos);
//   · el llao llao seco, también en el tendal (tres hongos).
// Lo que se seca tarda medio día de sol, y la lluvia lo frena: no se pudre, espera.
// Las conservas se cambian en el almacén por cosas que no se consiguen de otra forma, y
// en invierno se abren junto al fuego.
//
// Puro. Lo usan `main.js` (fuego, tendal, almacén) y `guardado.js`.

export const CONSERVAS = {
  'frasco-frutilla': { nombre: 'frasco de dulce de frutilla', ingrediente: 'frutilla', cantidad: 4, donde: 'fuego' },
  'calafate-seco': { nombre: 'bolsita de calafates secos', ingrediente: 'calafate', cantidad: 5, donde: 'tendal' },
  'hongos-secos': { nombre: 'atado de llao llao seco', ingrediente: 'llaollao', cantidad: 3, donde: 'tendal' },
};
export const HORAS_SECADO = 12;

// ---------------------------------------------------------------- el tendal
export function tendalVacio() { return { colgado: null, horas: 0 }; }
export function sanearTendal(v) {
  if (!v || typeof v !== 'object' || !CONSERVAS[v.colgado] || CONSERVAS[v.colgado].donde !== 'tendal') return tendalVacio();
  return { colgado: v.colgado, horas: Math.max(0, Math.min(HORAS_SECADO, Number(v.horas) || 0)) };
}
// Qué se puede colgar con lo que llevás: lo primero de la lista que te alcance.
export function queColgar(entradas = {}) {
  for (const [id, c] of Object.entries(CONSERVAS)) {
    if (c.donde === 'tendal' && (entradas[c.ingrediente]?.cantidad || 0) >= c.cantidad) return id;
  }
  return null;
}
// Pasa el tiempo: se seca con sol o nublado, no con lluvia, y de noche mucho menos.
export function avanzarSecado(t, horas, { lluvia = 0, noche = 0 } = {}) {
  if (!t.colgado || !(horas > 0)) return t;
  if (lluvia > 0.3) return t;
  t.horas = Math.min(HORAS_SECADO, t.horas + horas * (noche > 0.5 ? 0.25 : 1));
  return t;
}
export function listo(t) { return !!t.colgado && t.horas >= HORAS_SECADO; }

// Lo que hace E en el tendal. Devuelve qué pasó. Al colgar se gasta lo que se cuelga;
// al descolgar, la conserva la suma el juego (que la anota en el cuaderno la primera vez).
export function usarTendal(t, entradas) {
  if (listo(t)) {
    const id = t.colgado;
    Object.assign(t, tendalVacio());
    return { accion: 'descolgar', conserva: id };
  }
  if (t.colgado) return { accion: 'secando', conserva: t.colgado, faltan: Math.ceil(HORAS_SECADO - t.horas) };
  const id = queColgar(entradas);
  if (!id) return { accion: 'nada' };
  const c = CONSERVAS[id];
  entradas[c.ingrediente].cantidad -= c.cantidad;
  t.colgado = id; t.horas = 0;
  return { accion: 'colgar', conserva: id };
}
export function avisoTendal(t, entradas) {
  if (listo(t)) return `Descolgar: ${CONSERVAS[t.colgado].nombre}`;
  if (t.colgado) return `Secándose: faltan unas ${Math.ceil(HORAS_SECADO - t.horas)} horas`;
  const id = queColgar(entradas);
  return id ? `Colgar a secar (${CONSERVAS[id].cantidad} ${CONSERVAS[id].ingrediente === 'llaollao' ? 'llao llao' : 'calafates'})` : null;
}

// ---------------------------------------------------------------- en invierno, junto al fuego
// Abrir una conserva: la que haya, empezando por el dulce.
// 2.3: la miel y las truchas ahumadas también se guardan para el invierno
const OTRAS_PARA_EL_INVIERNO = ['miel', 'trucha-ahumada'];
export function queAbrir(entradas = {}) {
  for (const id of [...Object.keys(CONSERVAS), ...OTRAS_PARA_EL_INVIERNO]) if ((entradas[id]?.cantidad || 0) > 0) return id;
  return null;
}
export const AL_ABRIR = {
  'frasco-frutilla': 'Abrí un frasco de dulce de frutilla. Sabe a enero.',
  'calafate-seco': 'Unos calafates secos con el mate. Dicen que el que come calafate vuelve.',
  'hongos-secos': 'Llao llao seco en la olla. El bosque de otoño, en invierno.',
  miel: 'Una cucharada de miel en el mate. El verano entero en un frasco.',
  'trucha-ahumada': 'Trucha ahumada junto al fuego. Afuera nieva y no importa.',
};
