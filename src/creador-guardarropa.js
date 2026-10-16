// 4.1 (F3): el guardarropa de Bruno. Módulo puro (sin three ni DOM): se prueba en Node. No importa nada de «Tu personaje» (personal-personaje.js lo importa a él),
// así que las funciones reciben lo que necesitan de ahí (`desbloqueado`, `abrigoDeRopa`).
//
// Qué es: conjuntos de ropa por ocasión y estación armados SÓLO con piezas que el juego ya tiene (poncho, gorro, bufanda, guantes, botas de goma), con los
// desbloqueos de siempre: el poncho sale del telar (o de la carta de Amalia) y las botas de goma del almacén. Un conjunto no regala nada: si falta una pieza, el
// conjunto está bloqueado y dice cuál. Ponerse un conjunto cambia qué prendas están puestas (y las botas), NO los colores que el jugador eligió.
// Lo que NO hay (y queda como pregunta en CAMBIOS_4_1_F3.md): la ropa de fiesta de la peña, porque es una pieza nueva (modelo y desbloqueo) que no existe en el juego.
export const CONJUNTOS = [
  { id: 'diario', nombre: 'De todos los días', ocasion: 'diario', pone: { poncho: false, gorro: true, bufanda: true, guantes: false }, botas: 'cuero', pide: [] },
  { id: 'liviano', nombre: 'Liviano de verano', ocasion: 'verano', pone: { poncho: false, gorro: false, bufanda: false, guantes: false }, botas: 'cuero', pide: [] },
  { id: 'lluvia', nombre: 'Para la lluvia', ocasion: 'lluvia', pone: { poncho: true, gorro: false, bufanda: false, guantes: false }, botas: 'goma', pide: ['poncho', 'botas:goma'] },
  { id: 'invierno', nombre: 'Abrigo de invierno', ocasion: 'invierno', pone: { poncho: true, gorro: true, bufanda: true, guantes: false }, botas: 'cuero', pide: ['poncho'] },
  { id: 'invierno-pleno', nombre: 'Invierno de nieve', ocasion: 'invierno', pone: { poncho: true, gorro: true, bufanda: true, guantes: true }, botas: 'goma', pide: ['poncho', 'botas:goma'] },
];
export const CONJUNTO_PENDIENTE = { id: 'fiesta', nombre: 'Ropa de fiesta de la peña', motivo: 'todavía no existe esa ropa en el juego' };

const PRENDAS_DEL_CONJUNTO = ['poncho', 'gorro', 'bufanda', 'guantes'];

// ¿Se puede usar? `desbloqueado(que)` es el de «Tu personaje». Devuelve { ok, falta: [las piezas que faltan] }.
export function estadoDeConjunto(conjunto, desbloqueado) {
  const falta = (conjunto?.pide || []).filter((x) => !desbloqueado(x));
  return { ok: !!conjunto && falta.length === 0, falta };
}
// Ponerse un conjunto: devuelve el personaje con las prendas y las botas del conjunto (los colores no se tocan). Si el conjunto no existe o falta una pieza,
// devuelve el personaje tal cual (nunca regala una pieza que todavía no se consiguió).
export function ponerConjunto(personaje, id, desbloqueado) {
  const c = CONJUNTOS.find((x) => x.id === id);
  if (!c || !estadoDeConjunto(c, desbloqueado).ok) return personaje;
  const r = { ...personaje };
  for (const k of PRENDAS_DEL_CONJUNTO) r[k] = c.pone[k] === true;
  r.botas = c.botas;
  return r;
}
// ¿Cuál es el conjunto puesto? (el primero que coincide con las prendas y las botas; null si es una combinación propia)
export function conjuntoPuesto(personaje) {
  const p = personaje && typeof personaje === 'object' ? personaje : {};
  const c = CONJUNTOS.find((x) => x.botas === p.botas && PRENDAS_DEL_CONJUNTO.every((k) => (p[k] === true) === (x.pone[k] === true)));
  return c ? c.id : null;
}
// Los puntos de abrigo de un conjunto (con la tabla de prendas del juego) y si, con el extra de Bruno, templa la noche.
export function abrigoDeConjunto(conjunto, prendas, extra = 0, umbral = 4) {
  const puntos = PRENDAS_DEL_CONJUNTO.reduce((s, k) => s + (conjunto.pone[k] === true ? (prendas[k]?.abrigo || 0) : 0), 0);
  return { puntos, templa: puntos + (Number(extra) || 0) >= umbral };
}
