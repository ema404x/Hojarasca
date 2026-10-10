// 3.8.4: dónde amanece el kayak al cargar la partida. Módulo puro (se prueba en Node).
// El kayak guarda su lugar sólo si quedó amarrado en un embarcadero tuyo (`progreso.kayakAmarre`: el lugar de ese
// embarcadero); si lo dejaste en cualquier orilla, al cargar vuelve al muelle de siempre. Una partida de antes de la
// 3.8.4 no trae el dato (undefined): se amarra al embarcadero más cercano, como hacía siempre.

// { x, z } del embarcadero donde quedó amarrado, o null (suelto: vuelve al muelle)
export function sanearAmarre(v) {
  if (v === undefined) return undefined;   // (partida vieja: lo de siempre)
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const x = Number(v.x), z = Number(v.z);
  return Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) < 1e5 && Math.abs(z) < 1e5 ? { x, z } : null;
}
// Lo que se anota al amarrarlo en un embarcadero (`o`: la obra) y al soltarlo (subirte: null)
export const amarreDe = (o) => (o?.datos && Number.isFinite(o.datos.x) && Number.isFinite(o.datos.z) ? { x: o.datos.x, z: o.datos.z } : null);
// Al cargar: `lista`, los embarcaderos terminados. Devuelve
//   { donde: 'embarcadero', obra } → amarrarlo ahí;
//   { donde: 'cercano' }           → partida vieja: al más cercano, como siempre;
//   { donde: 'muelle' }            → suelto (o su embarcadero ya no está): al muelle.
export function dondeAmanece(amarre, lista = []) {
  if (amarre === undefined) return { donde: 'cercano' };
  const a = sanearAmarre(amarre);
  if (!a) return { donde: 'muelle' };
  let mejor = null, d0 = 1.5;
  for (const o of Array.isArray(lista) ? lista : []) {
    const d = Math.hypot((o?.datos?.x ?? Infinity) - a.x, (o?.datos?.z ?? Infinity) - a.z);
    if (d < d0) { d0 = d; mejor = o; }
  }
  return mejor ? { donde: 'embarcadero', obra: mejor } : { donde: 'muelle' };
}
