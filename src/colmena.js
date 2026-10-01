// 2.3: la colmena. Un cajón de abejas cerca de la huerta: los canteros que tiene al
// alcance rinden uno más por cosecha (las abejas polinizan), y cada tanto hay miel.
// Las abejas trabajan de día, con sol y fuera del invierno; la lluvia las frena. Si
// pasás corriendo al lado se alborotan, pero no pican: te avisan. Todo puro, sin
// THREE, para poder probarlo en Node.
export const COLMENA = {
  horasMiel: 40,      // horas de trabajo por cada frasco de miel (unos tres días de sol)
  tope: 3,            // frascos que junta antes de que haya que sacarlos
  radio: 18,          // hasta dónde vuelan a la huerta
  extraCosecha: 1,    // lo que suma a cada cosecha de un cantero al alcance
  alboroto: 3.2,      // metros: más cerca, corriendo, se alborotan
};

export function colmenaNueva() { return { miel: 0, horas: 0 }; }
export function sanearColmena(c) {
  const x = c && typeof c === 'object' ? c : {};
  const miel = Math.max(0, Math.min(COLMENA.tope, Math.floor(Number(x.miel) || 0)));
  const horas = Math.max(0, Math.min(COLMENA.horasMiel, Number(x.horas) || 0));
  return { miel, horas: miel >= COLMENA.tope ? 0 : horas };
}

// Cuánto trabajan en esta hora: nada de noche ni en invierno, poco con lluvia. Con
// canteros sembrados al alcance tienen más flores y trabajan un poco más.
export function ritmo({ noche = 0, invierno = 0, lluvia = 0, canteros = 0 } = {}) {
  if (invierno > 0.5 || noche > 0.55) return 0;
  const clima = lluvia > 0.5 ? 0.15 : lluvia > 0.15 ? 0.55 : 1;
  const flores = 1 + Math.min(2, canteros) * 0.25;
  return clima * flores;
}

// Avanza la colmena `horas` de juego. Devuelve cuántos frascos nuevos hubo.
export function avanzarColmena(c, horas, estado = {}) {
  if (!c || !(horas > 0) || c.miel >= COLMENA.tope) return 0;
  c.horas += horas * ritmo(estado);
  let nuevos = 0;
  while (c.horas >= COLMENA.horasMiel && c.miel < COLMENA.tope) { c.horas -= COLMENA.horasMiel; c.miel++; nuevos++; }
  if (c.miel >= COLMENA.tope) c.horas = 0;
  return nuevos;
}

// E junto a la colmena: saca la miel que haya, o dice cuánto falta.
export function usarColmena(c, estado = {}) {
  if (!c) return { accion: 'nada' };
  if (c.miel > 0) { const miel = c.miel; c.miel = 0; return { accion: 'cosechar', miel }; }
  if (estado.invierno > 0.5) return { accion: 'invierno' };
  const r = ritmo({ ...estado, noche: 0, lluvia: 0 }) || 1;
  const faltan = Math.max(1, Math.ceil((COLMENA.horasMiel - c.horas) / r / 11));   // ~11 h de sol por día
  return { accion: 'esperar', dias: faltan };
}

export function avisoColmena(c, estado = {}) {
  if (!c) return null;
  if (c.miel > 0) return `Sacar la miel (${c.miel} ${c.miel === 1 ? 'frasco' : 'frascos'})`;
  if (estado.invierno > 0.5) return 'La colmena en invierno: las abejas no salen';
  return 'Mirar la colmena';
}

// ¿Este cantero tiene una colmena al alcance? `colmenas`: [{x, z}]
export function polinizado(cantero, colmenas) {
  return (colmenas || []).some((c) => Math.hypot(c.x - cantero.x, c.z - cantero.z) <= COLMENA.radio);
}
export function cosechaConAbejas(cantidad, cantero, colmenas) {
  return cantidad + (polinizado(cantero, colmenas) ? COLMENA.extraCosecha : 0);
}

// Pasar corriendo al lado: se alborotan. Una vez cada tanto, para no llenar de avisos.
export function seAlborotan(distancia, corriendo, tDesdeElUltimo) {
  return corriendo && distancia < COLMENA.alboroto && tDesdeElUltimo > 25;
}
