// 4.9 dias: la aldea de día (módulo puro: sin THREE ni DOM; se prueba en Node).
//
// Los vecinos aliados del Desafío piden cosas durante el día; cumplirles sube su nivel de ayuda (0, 1 o 2) y
// ese nivel es lo que lee el agente de los aliados para decidir cuánto ayuda cada uno en las noches grandes.
//
// CONTRATO (lo usa `desafio-aliados.js` y todo lo que quiera saber cuánto ayuda un vecino):
//   · `D().aldea = { ayuda: { anselmo, herminia, martin, chicos }, pedidos: {...}, ... }`
//   · `VECINOS_AYUDA`: las cuatro claves.
//   · `nivelAyuda(d, clave)`: 0, 1 o 2 (0 si el vecino no existe, si no hay `aldea` o si el dato es raro).
//   · `aldeaNueva()` y `sanearAldea(v)`: el estado de una partida nueva y el de una guardada (una partida
//     vieja, sin `aldea`, carga con todos en 0).
// Los pedidos, las entregas y los textos se suman en este mismo archivo (ver más abajo).

export const VECINOS_AYUDA = ['anselmo', 'herminia', 'martin', 'chicos'];
export const NIVEL_MAX = 2;

const ent = (v, def, min, max) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && v !== null && v !== '' && typeof v !== 'boolean' ? Math.max(min, Math.min(max, n)) : def;
};

// Cuánto ayuda `clave` según lo que cumpliste: 0 (nada), 1 (ayuda) o 2 (ayuda a pleno).
export function nivelAyuda(d, clave) {
  if (typeof clave !== 'string' || !VECINOS_AYUDA.includes(clave)) return 0;
  const a = d?.aldea?.ayuda;
  if (!a || typeof a !== 'object' || !Object.hasOwn(a, clave)) return 0;
  return ent(a[clave], 0, 0, NIVEL_MAX);
}

export function aldeaNueva() {
  return {
    ayuda: Object.fromEntries(VECINOS_AYUDA.map((k) => [k, 0])),
    pedidos: Object.fromEntries(VECINOS_AYUDA.map((k) => [k, null])),
  };
}

export function sanearAldea(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const n = aldeaNueva();
  for (const k of VECINOS_AYUDA) n.ayuda[k] = Object.hasOwn(x.ayuda ?? {}, k) ? ent(x.ayuda[k], 0, 0, NIVEL_MAX) : 0;
  return n;
}
