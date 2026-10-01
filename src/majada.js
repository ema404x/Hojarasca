// La majada: las ovejas de Don Ramón, que pastan alrededor del galpón de esquila.
// El galpón estaba armado —molino australiano, corrales, bretes— y no tenía una sola
// oveja. Ahora las tiene, y la lana que dan es un material más: con ella se teje la
// alfombra, que hasta acá se hacía con una tabla porque no había lana en el juego.
//
// Cada oveja se esquila con la tijera cuando tiene el vellón entero y le vuelve a
// crecer en unos días. Módulo puro (se prueba en Node); las ovejas se dibujan y se
// mueven en majada-mundo.js.

export const OVEJAS = 8;
export const DIAS_LANA = 6;             // de recién esquilada a vellón entero
export const VELLONES_POR_OVEJA = 2;
export const RADIO_ESQUILA = 2.4;       // qué tan cerca hay que estar

export function majadaNueva() {
  // null: nunca se esquiló, llega con el vellón entero
  return { esquilada: new Array(OVEJAS).fill(null) };
}

export function sanearMajada(v) {
  const base = majadaNueva();
  const lista = Array.isArray(v?.esquilada) ? v.esquilada : [];
  base.esquilada = base.esquilada.map((_, i) => {
    const d = lista[i];
    return d === null || d === undefined || !Number.isFinite(Number(d)) ? null : Math.floor(Number(d));
  });
  return base;
}

// 0 recién esquilada · 1 vellón entero
export function lanaDe(majada, i, dia) {
  const d = majada?.esquilada?.[i];
  if (d === null || d === undefined) return 1;
  return Math.max(0, Math.min(1, (dia - d) / DIAS_LANA));
}
export function diasParaLana(majada, i, dia) {
  const d = majada?.esquilada?.[i];
  if (d === null || d === undefined) return 0;
  return Math.max(0, Math.ceil(DIAS_LANA - (dia - d)));
}

export function esquilar(majada, i, dia, tieneTijera) {
  if (!tieneTijera) return { ok: false, motivo: 'tijera' };
  if (!Number.isInteger(i) || i < 0 || i >= (majada?.esquilada?.length ?? OVEJAS)) return { ok: false, motivo: 'oveja' };
  if (lanaDe(majada, i, dia) < 1) return { ok: false, motivo: 'corta', faltan: diasParaLana(majada, i, dia) };
  majada.esquilada[i] = dia;
  return { ok: true, vellones: VELLONES_POR_OVEJA };
}

// 2.4: el corral propio tiene su propia lista (de dos): se cuenta la que tenga.
export function resumenMajada(majada, dia) {
  const total = Array.isArray(majada?.esquilada) ? majada.esquilada.length : OVEJAS;
  let conLana = 0;
  for (let i = 0; i < total; i++) if (lanaDe(majada, i, dia) >= 1) conLana++;
  return { total, conLana };
}

export function textoOveja(majada, i, dia, tieneTijera) {
  if (lanaDe(majada, i, dia) < 1) {
    const f = diasParaLana(majada, i, dia);
    return `Recién esquilada · ${f === 1 ? 'le falta un día' : `le faltan ${f} días`}`;
  }
  return tieneTijera ? 'Esquilar la oveja' : 'Oveja con el vellón entero';
}

// Cómo reacciona una oveja a lo que tiene cerca: se aparta del perro y del que corre,
// y se arrima al resto. Devuelve un rumbo deseado (radianes) o null si está tranquila.
// Es lo que hace que el perro "junte" la majada sin que haya que programarle el arreo.
export function rumboOveja(pos, centro, amenazas) {
  let fx = 0, fz = 0, presion = 0;
  for (const a of amenazas || []) {
    if (!a) continue;
    const dx = pos.x - a.x, dz = pos.z - a.z, d = Math.hypot(dx, dz);
    if (d > a.radio || d < 1e-3) continue;
    const k = (1 - d / a.radio) * (a.peso ?? 1);
    fx += (dx / d) * k; fz += (dz / d) * k; presion = Math.max(presion, k);
  }
  const dc = Math.hypot(centro.x - pos.x, centro.z - pos.z);
  if (dc > 0.5) {
    // cuanto más apretada está, más fuerte busca a las otras
    const k = Math.min(1, dc / 12) * (0.4 + presion);
    fx += ((centro.x - pos.x) / dc) * k; fz += ((centro.z - pos.z) / dc) * k;
  }
  if (presion <= 0 && dc < 9) return null;
  if (Math.hypot(fx, fz) < 1e-3) return null;
  return { rumbo: Math.atan2(fx, fz), presion };
}
