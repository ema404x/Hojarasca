// 2.4: el corral propio (sólo en el Relax).
//
// Un bebedero con cuatro tramos de cerco alrededor es un corral. La primera vez que lo
// armás, Don Ramón te trae dos ovejas de su majada: pastan adentro, se esquilan con la
// misma tijera y el vellón les vuelve a crecer como a las del galpón.
//
// Puro, sin THREE. Las ovejas se dibujan con el mismo majada-mundo.js del galpón.

export const CORRAL = { cercos: 4, radioCercos: 7, ovejas: 2, radioMin: 2.2, radioMax: 5.2 };

// ¿Hay un corral armado? `obras`: [{ plano, x, z, terminada }]. Devuelve el centro y el
// radio donde pastan, o null.
export function buscarCorral(obras) {
  const lista = obras || [];
  for (const b of lista) {
    if (b.plano !== 'bebedero' || !b.terminada) continue;
    const cercos = lista.filter((o) => o.plano === 'cerco' && o.terminada && Math.hypot(o.x - b.x, o.z - b.z) <= CORRAL.radioCercos);
    if (cercos.length < CORRAL.cercos) continue;
    // el pasto llega hasta un poco antes del cerco más cercano
    const dMin = Math.min(...cercos.map((o) => Math.hypot(o.x - b.x, o.z - b.z)));
    const radio = Math.max(CORRAL.radioMin, Math.min(CORRAL.radioMax, dMin - 0.6));
    return { x: b.x, z: b.z, radio, cercos: cercos.length };
  }
  return null;
}

export function corralNuevo(lugar, dia) {
  return { x: Number(lugar.x) || 0, z: Number(lugar.z) || 0, radio: Number(lugar.radio) || CORRAL.radioMin, dia: Math.max(1, Math.floor(Number(dia) || 1)), esquilada: new Array(CORRAL.ovejas).fill(null) };
}

export function sanearCorral(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const n = (x, def = 0) => (Number.isFinite(Number(x)) ? Number(x) : def);
  const lista = Array.isArray(v.esquilada) ? v.esquilada : [];
  return {
    x: n(v.x), z: n(v.z),
    radio: Math.max(CORRAL.radioMin, Math.min(CORRAL.radioMax, n(v.radio, CORRAL.radioMin))),
    dia: Math.max(1, Math.floor(n(v.dia, 1))),
    esquilada: new Array(CORRAL.ovejas).fill(null).map((_, i) => {
      const d = lista[i];
      return d === null || d === undefined || !Number.isFinite(Number(d)) ? null : Math.floor(Number(d));
    }),
  };
}

// Si movés el corral (desarmás el bebedero y lo armás en otro lado), las ovejas se mudan.
export function mudarCorral(corral, lugar) {
  if (!corral || !lugar) return false;
  if (Math.hypot(corral.x - lugar.x, corral.z - lugar.z) < 0.5 && Math.abs(corral.radio - lugar.radio) < 0.1) return false;
  corral.x = lugar.x; corral.z = lugar.z; corral.radio = lugar.radio;
  return true;
}
