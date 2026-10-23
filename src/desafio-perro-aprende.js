// 4.10 base: el perro aprende con las noches (reglas puras, se prueban en Node).
//
// Cuantas más noches pasa con vos, más curtido está: gruñe de más lejos (avisa antes de que se vea nada) y muerde más fuerte.
// Tres niveles. Se cuenta una noche cuando la aguantás con el perro a tu lado. Se guarda en la partida (`crece.perro`).
// Lo que cambia en `desafio-aliados.js` es un número: el alcance del gruñido (ya existía `alcancePerro`) y el daño de la mordida.

export const PERRO_NIVELES = {
  // las noches con vos que hacen falta para el nivel 1, 2 y 3 (el índice es el nivel)
  noches: [0, 3, 6, 10],
  // cuánto más lejos oye y gruñe (multiplica el alcance del aviso)
  alcance: [1, 1.15, 1.3, 1.5],
  // cuánto más fuerte muerde (multiplica la mordida de 9 por segundo)
  dano: [1, 1.15, 1.3, 1.5],
  maximo: 3,
  tope: 10,
};

export function nivelDelPerro(noches) {
  const c = Math.max(0, Math.floor(Number(noches)) || 0);
  let nivel = 0;
  for (let i = 1; i <= PERRO_NIVELES.maximo; i++) if (c >= PERRO_NIVELES.noches[i]) nivel = i;
  return nivel;
}
const tabla = (t, nivel) => t[Math.max(0, Math.min(PERRO_NIVELES.maximo, Math.floor(Number(nivel)) || 0))];
export const alcanceDelPerro = (nivel) => tabla(PERRO_NIVELES.alcance, nivel);
export const danoDelPerro = (nivel) => tabla(PERRO_NIVELES.dano, nivel);

// Lo guardado: { noches }. Una partida vieja no lo trae y empieza de cero.
export function sanearPerro(v) {
  const n = Number(v?.noches);
  return { noches: v && typeof v === 'object' && v.noches !== null && v.noches !== '' && typeof v.noches !== 'boolean' && Number.isFinite(n) ? Math.max(0, Math.min(PERRO_NIVELES.tope, Math.floor(n))) : 0 };
}
// Aguantó una noche con el perro: suma una. Devuelve el nivel de antes y el de ahora.
export function nocheConElPerro(perro) {
  const antes = nivelDelPerro(perro.noches);
  perro.noches = Math.min(PERRO_NIVELES.tope, (perro.noches || 0) + 1);
  return { antes, ahora: nivelDelPerro(perro.noches) };
}
export function nochesParaSubir(perro) {
  const nivel = nivelDelPerro(perro?.noches);
  return nivel >= PERRO_NIVELES.maximo ? 0 : PERRO_NIVELES.noches[nivel + 1] - (perro?.noches || 0);
}

const ADJETIVO = ['', 'más atento', 'más curtido', 'hecho un perro de guerra'];
export function textoPerro(nivel) {
  const n = Math.max(0, Math.min(PERRO_NIVELES.maximo, Math.floor(Number(nivel)) || 0));
  if (!n) return 'El perro todavía está aprendiendo de las noches';
  const lejos = Math.round((PERRO_NIVELES.alcance[n] - 1) * 100), fuerte = Math.round((PERRO_NIVELES.dano[n] - 1) * 100);
  return `El perro está ${ADJETIVO[n]} · nivel ${n}: gruñe de ${lejos}% más lejos y muerde ${fuerte}% más fuerte`;
}
export function textoSubidaPerro(nivel) {
  const n = Math.max(1, Math.min(PERRO_NIVELES.maximo, Math.floor(Number(nivel)) || 1));
  return { titulo: n === 1 ? 'El perro está más atento' : n === 2 ? 'El perro está más curtido' : 'El perro ya es un perro de guerra', texto: textoPerro(n).replace(/^El perro está [^·]+· /, '') };
}
