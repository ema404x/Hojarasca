// El telar: la lana de la majada, tejida. Hasta la 1.10 un vellón sólo servía para la
// alfombra y para dos encargos. En el telar (O → Trabajo) se teje la manta —la misma
// del almacén, la que deja dormir en cualquier lado— y ponchos, que no se gastan: se
// llevan a la feria de la estación.
//
// E en el telar teje lo que corresponda: la manta si todavía no la tenés, si no un
// poncho. La lana sale de la mochila y, si hay un acopio cerca, también de ahí.
//
// Módulo puro (se prueba en Node).

export const TEJIDOS = {
  manta: { nombre: 'una manta', lana: 4, unica: true },
  poncho: { nombre: 'un poncho', lana: 3 },
};

// Qué toca tejer con esta lana y estas cosas. null si no alcanza para nada.
export function queTejer(lana, cosas = {}) {
  const l = Number(lana) || 0;
  if (!cosas.manta && l >= TEJIDOS.manta.lana) return 'manta';
  if (l >= TEJIDOS.poncho.lana) return 'poncho';
  return null;
}

export function textoTelar(lana, cosas = {}) {
  const id = queTejer(lana, cosas);
  if (id) return `Tejer ${TEJIDOS[id].nombre} (${TEJIDOS[id].lana} vellones)`;
  const l = Number(lana) || 0;
  return `Telar: hacen falta ${TEJIDOS.poncho.lana} vellones para un poncho (tenés ${l})`;
}
