// 2.1: rastros que se pueden seguir.
//
// Los baqueanos no buscan al animal: buscan lo que dejó. Una hilera de huellas en el
// barro que arranca cerca tuyo y termina donde está el bicho. La primera vez que ves
// las huellas de una especie, E las anota en el cuaderno —cada una tiene su forma: la
// pezuña partida del huemul, las cuatro almohadillas y las uñas del zorro, las patas
// largas de atrás de la liebre—; después, seguirlas te lleva hasta él.
//
// Puro: sin THREE. Las huellas se dibujan en `rastros-malla.js`.

export const RASTROS = {
  huemul: { forma: 'pezuna', paso: 0.95, escala: 1, nombre: 'huemul', entrada: 'rastro-huemul' },
  pudu: { forma: 'pezuna', paso: 0.42, escala: 0.5, nombre: 'pudú', entrada: 'rastro-pudu' },
  guanaco: { forma: 'pezuna', paso: 1.05, escala: 1.12, nombre: 'guanaco', entrada: 'rastro-guanaco' },
  zorro: { forma: 'pata', paso: 0.62, escala: 0.72, nombre: 'zorro', entrada: 'rastro-zorro' },
  liebre: { forma: 'liebre', paso: 0.9, escala: 0.62, nombre: 'liebre', entrada: 'rastro-liebre' },
};

export const DISTANCIA_RASTRO = [45, 190];   // a qué distancia tiene que estar el animal
export const LARGO_MAX = 150;                // metros de rastro, como mucho
export const CERCA_DEL_FINAL = 6;            // el rastro termina a unos pasos del animal

// Qué animal deja el rastro. Primero los que todavía no tienen su rastro anotado; entre
// los demás, cualquiera. `sujetos`: la lista de siempre ({ tipo, pos, id }).
export function elegirRastro(sujetos, jugador, entradas = {}, azar = Math.random) {
  const posibles = [];
  for (const s of sujetos || []) {
    const R = RASTROS[s?.tipo];
    if (!R || !s.pos) continue;
    const d = Math.hypot(s.pos.x - jugador.x, s.pos.z - jugador.z);
    if (d < DISTANCIA_RASTRO[0] || d > DISTANCIA_RASTRO[1]) continue;
    posibles.push({ s, d, peso: entradas[R.entrada] ? 1 : 4 });
  }
  if (!posibles.length) return null;
  const total = posibles.reduce((a, p) => a + p.peso, 0);
  let x = azar() * total;
  for (const p of posibles) { x -= p.peso; if (x <= 0) return p.s; }
  return posibles[posibles.length - 1].s;
}

// Las huellas, de un punto de arranque al animal. Van alternando de lado (izquierda,
// derecha) y serpentean un poco, como anda un animal que no tiene apuro. `tierra(x,z)`
// dice si ahí se puede pisar (no agua, no roca); donde no, la huella se saltea.
export function trazarRastro(desde, hasta, especie, { azar = Math.random, tierra = () => true } = {}) {
  const R = RASTROS[especie];
  if (!R) return [];
  const dx = hasta.x - desde.x, dz = hasta.z - desde.z;
  const largo = Math.min(LARGO_MAX, Math.max(0, Math.hypot(dx, dz) - CERCA_DEL_FINAL));
  if (largo < 4) return [];
  const ux = dx / Math.hypot(dx, dz), uz = dz / Math.hypot(dx, dz);
  const fase = azar() * 6.28, amplitud = 1.2 + azar() * 2.2, onda = 14 + azar() * 12;
  const huellas = [];
  let lado = 1;
  for (let t = 0; t <= largo; t += R.paso) {
    const serpenteo = Math.sin(t / onda * 6.28 + fase) * amplitud;
    // la tangente del serpenteo, para que cada huella apunte para donde va el animal
    const pendiente = Math.cos(t / onda * 6.28 + fase) * amplitud * 6.28 / onda;
    const rumbo = Math.atan2(ux - uz * pendiente, uz + ux * pendiente);
    const x = desde.x + ux * t - uz * serpenteo + Math.cos(rumbo) * 0.12 * lado * R.escala;
    const z = desde.z + uz * t + ux * serpenteo - Math.sin(rumbo) * 0.12 * lado * R.escala;
    lado = -lado;
    if (!tierra(x, z)) continue;
    huellas.push({ x, z, rumbo, t });
  }
  return huellas;
}

// Dónde arranca: entre vos y el animal, a unos pasos tuyos, para que lo encuentres.
export function arranque(jugador, animal, azar = Math.random) {
  const dx = animal.x - jugador.x, dz = animal.z - jugador.z;
  const d = Math.hypot(dx, dz) || 1;
  const k = (8 + azar() * 10) / d;
  const lateral = (azar() - 0.5) * 8;
  return { x: jugador.x + dx * k - (dz / d) * lateral, z: jugador.z + dz * k + (dx / d) * lateral };
}

// ¿Estás parado sobre el rastro? Devuelve la huella más cercana a menos de `radio`.
export function huellaCerca(huellas, pos, radio = 2.2) {
  let mejor = null, d0 = radio;
  for (const h of huellas || []) {
    const d = Math.hypot(h.x - pos.x, h.z - pos.z);
    if (d < d0) { d0 = d; mejor = h; }
  }
  return mejor;
}

// Hacia dónde va el rastro desde donde estás: el rumbo de la última huella.
export function haciaDondeVa(huellas) {
  if (!huellas?.length) return null;
  const a = huellas[0], b = huellas[huellas.length - 1];
  return { x: b.x - a.x, z: b.z - a.z };
}

// El animal se movió: si ya llegaste cerca del final y él se fue lejos, el rastro sigue.
export function hayQueAlargar(huellas, jugador, animal) {
  if (!huellas?.length || !animal) return false;
  const fin = huellas[huellas.length - 1];
  return Math.hypot(fin.x - jugador.x, fin.z - jugador.z) < 12 && Math.hypot(animal.x - fin.x, animal.z - fin.z) > 14;
}

// Un rastro dura un rato: la lluvia lo borra más rápido.
export const VIDA_RASTRO = 240;   // segundos de reloj
export function envejecer(edad, dt, lluvia = 0) { return edad + dt * (1 + lluvia * 3); }
