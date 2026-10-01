// 2.3: la trochita varada. Algunas noches el tren se queda sin presión lejos de la
// estación, con Elsa adentro, y hay que escoltarlo: avanza despacio sólo mientras
// estés cerca (si te alejás, Elsa frena y espera), y los invasores que no te tienen a
// tiro van por el tren. Si llega a la Estación del Valle, Elsa agradece; si lo rompen,
// no te habla por dos días y el tren tarda en volver. A diferencia de los rescates, lo
// que hay que defender se mueve. Puro, sin THREE.
export const VARADA = {
  desdeNoche: 5,
  chance: 0.2,
  vida: 300,
  vel: 1.7,           // m/s mientras lo escoltás
  escolta: 18,        // metros: más lejos, el tren frena
  distancia: [240, 380],   // cuánto le falta hasta la estación, por la vía
  golpe: 3.2,         // radio del tren para los que le pegan
  diasEnojo: 2,
};

// ¿Esta noche se vara el tren? Nunca la del jefe, ni una especial, ni la final, ni la de
// un rescate (una cosa por noche).
export function nocheDeVarada(n, { azar = Math.random, esJefe = false, especial = null, final = false, rescate = null } = {}) {
  if (n < VARADA.desdeNoche || esJefe || especial || final || rescate) return false;
  return azar() < VARADA.chance;
}

// Dónde queda parado: a lo largo de la vía, antes de la estación, en el sentido en que
// anda el tren. `largo`: largo total de la vía; `sEstacion`: dónde está la estación.
export function puntoDeVarada(largo, sEstacion, azar = Math.random) {
  const falta = VARADA.distancia[0] + azar() * (VARADA.distancia[1] - VARADA.distancia[0]);
  return { s: ((sEstacion - falta) % largo + largo) % largo, falta };
}

export function varadaNueva(s, falta) {
  return { s, falta, recorrido: 0, vida: VARADA.vida, llego: false, roto: false };
}
export function sanearVarada(v) {
  if (!v || typeof v !== 'object') return null;
  const n = (x, d = 0) => (Number.isFinite(Number(x)) ? Number(x) : d);
  const falta = Math.max(1, n(v.falta, VARADA.distancia[0]));
  return {
    s: n(v.s), falta, recorrido: Math.max(0, Math.min(falta, n(v.recorrido))),
    vida: Math.max(0, Math.min(VARADA.vida, n(v.vida, VARADA.vida))), llego: !!v.llego, roto: !!v.roto,
  };
}

// Un paso de la escolta: avanza si estás cerca. Devuelve cuántos metros avanzó.
export function avanzarVarada(v, dt, distJugador, largo) {
  if (!v || v.llego || v.roto || !(dt > 0)) return 0;
  if (!(distJugador <= VARADA.escolta)) return 0;
  const paso = Math.min(VARADA.vel * dt, v.falta - v.recorrido);
  v.recorrido += paso;
  v.s = ((v.s + paso) % largo + largo) % largo;
  if (v.recorrido >= v.falta - 0.01) v.llego = true;
  return paso;
}

export const quedaParaLlegar = (v) => Math.max(0, Math.round((v?.falta || 0) - (v?.recorrido || 0)));

// Lo que deja Elsa si el tren llega: cristales del depósito y material del galpón.
export function premioVarada(noche) {
  return { cristal: 3 + Math.min(4, Math.floor(noche / 5)), tabla: 6, piedra: 4 };
}
