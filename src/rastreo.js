// Rastrear con el perro. Hasta la 1.10 el perro sólo marcaba lo que ya estaba a menos
// de veinticinco metros. Ahora, mirándolo y con E, le pedís que rastree: olfatea, elige
// un rastro —primero el de un animal que todavía no anotaste— y va adelante, nariz al
// piso, sin alejarse tanto que lo pierdas. En la nieve se ven las pisadas que sigue.
// Cuando lo encuentra, lo marca como siempre: quieto, mirando, un ladrido.
//
// Sólo en el Relax: en el Desafío el perro tiene otro trabajo.
//
// Módulo puro (se prueba en Node). Los sujetos del mundo se reciclan cada cuadro, así
// que el rastro guarda el tipo y la última posición conocida, no el objeto.

export const RASTREO = {
  radio: 220,      // hasta dónde llega el olfato
  minimo: 26,      // más cerca que esto ya lo marca solo
  llega: 11,       // a esta distancia de la presa, el rastro terminó
  adelante: 6,     // cuánto se adelanta el perro en cada tramo
  espera: 14,      // si te quedás más atrás que esto, te espera
  pierde: 45,      // si la presa se movió más que esto entre dos olfateos, se perdió
  dura: 180,       // segundos hasta que el rastro se enfría
  frente: 0.8,     // cuánto tenés que estar mirando al perro (coseno)
  cerca: 3.2,      // y a qué distancia
};

// Los que dejan rastro en el piso. El resto vuela o nada.
export const RASTREABLES = ['pudu', 'huemul', 'zorro', 'guanaco', 'liebre'];
const NOMBRES = { pudu: 'un pudú', huemul: 'un huemul', zorro: 'un zorro', guanaco: 'un guanaco', liebre: 'una liebre' };
export const nombreRastro = (tipo) => NOMBRES[tipo] || 'algo';

// ¿Estás mirando al perro, cerca? `yaw` como la cámara: adelante es (-sin, -cos).
export function mirandoAlPerro(js, perro) {
  const dx = perro.x - js.pos.x, dz = perro.z - js.pos.z;
  const d = Math.hypot(dx, dz);
  if (d > RASTREO.cerca || d < 0.01) return false;
  return (-Math.sin(js.yaw) * dx - Math.cos(js.yaw) * dz) / d >= RASTREO.frente;
}

// Qué rastro sigue. Primero los animales que no anotaste en el cuaderno; entre ellos,
// el más cercano. `anotado(tipo)` dice si ya está en el cuaderno.
export function elegirPresa(sujetos, pos, anotado = () => false) {
  let mejor = null, mejorPuntos = Infinity;
  for (const s of sujetos || []) {
    if (!s || !RASTREABLES.includes(s.tipo)) continue;
    const d = Math.hypot(s.pos.x - pos.x, s.pos.z - pos.z);
    if (d < RASTREO.minimo || d > RASTREO.radio) continue;
    const puntos = d + (anotado(s.tipo) ? 1000 : 0);
    if (puntos < mejorPuntos) { mejorPuntos = puntos; mejor = s; }
  }
  return mejor ? { tipo: mejor.tipo, x: mejor.pos.x, z: mejor.pos.z, t: 0 } : null;
}

// Actualiza la última posición conocida: el del mismo tipo más cerca de donde estaba.
// Devuelve false si ya no hay rastro (se fue lejos o desapareció).
export function seguirPresa(rastro, sujetos) {
  let mejor = null, mejorD = RASTREO.pierde;
  for (const s of sujetos || []) {
    if (!s || s.tipo !== rastro.tipo) continue;
    const d = Math.hypot(s.pos.x - rastro.x, s.pos.z - rastro.z);
    if (d < mejorD) { mejorD = d; mejor = s; }
  }
  if (!mejor) return false;
  rastro.x = mejor.pos.x; rastro.z = mejor.pos.z;
  return true;
}

// Adónde va el perro: un tramo hacia la presa, salvo que te haya dejado atrás.
// Devuelve { x, z, esperar } — con esperar, el perro se queda mirándote.
export function destinoRastro(perro, jugador, rastro) {
  const lejosDeVos = Math.hypot(perro.x - jugador.x, perro.z - jugador.z);
  const dx = rastro.x - perro.x, dz = rastro.z - perro.z, d = Math.hypot(dx, dz) || 1;
  if (lejosDeVos > RASTREO.espera) return { x: perro.x, z: perro.z, esperar: true };
  const paso = Math.min(RASTREO.adelante, d);
  return { x: perro.x + (dx / d) * paso, z: perro.z + (dz / d) * paso, esperar: false };
}

// En qué quedó: 'sigue', 'encontrado', 'frio' (se pasó el tiempo) o 'perdido'.
export function estadoRastro(rastro, perro, hayRastro) {
  if (!hayRastro) return 'perdido';
  if (Math.hypot(rastro.x - perro.x, rastro.z - perro.z) <= RASTREO.llega) return 'encontrado';
  if (rastro.t > RASTREO.dura) return 'frio';
  return 'sigue';
}
