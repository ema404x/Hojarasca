// Tormentas y crecidas: el clima deja de ser sólo luz y sonido y toca el valle.
//
// - La crecida. Con horas de lluvia fuerte el arroyo sube; cuando para, baja despacio,
//   en casi un día. Con el agua turbia no pica nada en el arroyo, pero en el lago
//   comen mejor: la corriente les baja comida.
// - El rayo. En una tormenta, una vez por día como mucho, un rayo parte un árbol a
//   la vista. Queda tirado, y se hace leña con el hacha (H) como cualquier árbol caído.
//   Nunca un pehuén: es sagrado, y el juego ya lo respeta al talar.
//
// Módulo puro (se prueba en Node).

export const CRECIDA = {
  lluviaFuerte: 0.55,       // desde acá la lluvia hace crecer el arroyo
  horasParaLlenar: 6,       // seis horas de lluvia fuerte y está en lo más alto
  horasParaBajar: 20,       // y tarda casi un día en volver a su cauce
  subidaMaxima: 0.38,       // metros que sube el agua en lo más alto
  turbia: 0.4,              // desde acá el agua del arroyo es barro
};

export const RAYO = {
  distanciaMin: 35,         // lo bastante cerca para verlo, lo bastante lejos para no matarte
  distanciaMax: 140,
  chancePorSegundo: 1 / 45, // en tormenta, en promedio un rayo a la vista cada 45 s reales
  troncos: 6,               // un árbol partido da más que un tronco caído
};

export function tormentaNueva() {
  return { crecida: 0, rayo: null, diaRayo: -1 };
}

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export function sanearTormenta(v, cantidadArboles = Infinity) {
  const base = tormentaNueva();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return base;
  base.crecida = Math.max(0, Math.min(1, num(v.crecida)));
  base.diaRayo = Math.floor(num(v.diaRayo, -1));
  const r = v.rayo;
  if (r && Number.isInteger(r.i) && r.i >= 0 && r.i < cantidadArboles) {
    base.rayo = { i: r.i, dia: Math.floor(num(r.dia, 1)), dx: num(r.dx, 1), dz: num(r.dz, 0) };
  }
  return base;
}

// ---------------------------------------------------------------- la crecida
// `horas`: horas de juego que pasaron desde la última vez.
export function avanzarCrecida(crecida, lluvia, horas) {
  const h = Math.max(0, num(horas));
  let c = num(crecida);
  if (num(lluvia) >= CRECIDA.lluviaFuerte) c += h / CRECIDA.horasParaLlenar;
  else c -= h / CRECIDA.horasParaBajar;
  return Math.max(0, Math.min(1, c));
}
export function nivelArroyo(crecida) {
  const c = Math.max(0, Math.min(1, num(crecida)));
  // sube rápido al principio y se estanca arriba: el cauce se ensancha
  return CRECIDA.subidaMaxima * (1 - (1 - c) * (1 - c));
}
export function aguaTurbia(crecida) {
  return num(crecida) >= CRECIDA.turbia;
}
// Multiplica la espera del pique.
export function esperaPorCrecida(crecida, esLago) {
  if (!aguaTurbia(crecida)) return 1;
  return esLago ? 0.8 : 3;
}

// Horas de juego entre dos lecturas del reloj, contando la vuelta de medianoche.
export function horasEntre(antes, ahora) {
  const d = num(ahora) - num(antes);
  return d >= 0 ? d : d + 24;
}

// ---------------------------------------------------------------- el rayo
export function puedeCaerRayo({ tormenta, dia, diaRayo, rayoPendiente }) {
  return !!tormenta && dia !== diaRayo && !rayoPendiente;
}

// El árbol que parte el rayo: a la vista, en pie y nunca un pehuén. Entre los que
// quedan, los más altos tienen más chance. `azar` se inyecta.
export function elegirArbolRayo(arboles, pos, azar = Math.random) {
  const candidatos = [];
  for (let i = 0; i < arboles.length; i++) {
    const a = arboles[i];
    if (!a || a.sacado || a.caido || a.especie === 'pehuen' || a.especie === 'seco') continue;
    const d = Math.hypot(a.x - pos.x, a.z - pos.z);
    if (d < RAYO.distanciaMin || d > RAYO.distanciaMax) continue;
    candidatos.push({ i, peso: Math.max(0.2, num(a.esc, 1)) });
  }
  if (!candidatos.length) return null;
  let total = 0;
  for (const c of candidatos) total += c.peso;
  let x = azar() * total;
  for (const c of candidatos) { x -= c.peso; if (x <= 0) return c.i; }
  return candidatos[candidatos.length - 1].i;
}

// "a 80 m al noroeste": para el aviso.
const RUMBOS = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
export function rumboTexto(desde, hacia) {
  const dx = hacia.x - desde.x, dz = hacia.z - desde.z;
  // en el mapa el norte es -z
  const ang = Math.atan2(dx, -dz);
  const k = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
  return `a ${Math.round(Math.hypot(dx, dz) / 5) * 5} m al ${RUMBOS[k]}`;
}
