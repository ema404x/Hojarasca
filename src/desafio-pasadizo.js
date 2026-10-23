// 4.9 defensas: el pasadizo de escape del Desafío (reglas puras, se prueban en Node).
//
// Un túnel corto con dos bocas: la de adentro de la base (una tapa de tablas sobre un montículo) y la de afuera,
// disimulada (un tronco hueco tirado entre las ramas). Con E en una boca bajás y salís por la otra: para salir por
// atrás y volver a entrar cuando las defensas caen. Es una sola obra: el origen de la pieza es la boca de adentro y
// la de afuera queda `LARGO` metros adelante (hacia +z de la pieza, que se gira con R).
//
// Los duendes no lo usan ni lo ven (la obra no cuenta como defensa ni como pared: `defensa.oculta`), y no se daña.
// Lo que se ve y lo que se mueve vive en desafio-pasadizo-mundo.js.

export const PASADIZO = {
  largo: 9,            // metros entre las dos bocas (adentro y afuera del cerco)
  alcance: 2.3,        // a cuántos metros de una boca la E la usa
  llega: 1.9,          // a cuántos metros de la boca salís del otro lado
  baja: 0.55,          // segundos que tarda en cerrarse la vista al bajar
  sube: 0.6,           // y en abrirse del otro lado
  protege: 1.4,        // segundos sin que te pueda pegar nadie, justo al salir
  desnivelMax: 2.4,    // la boca de afuera no puede quedar más de esto arriba o abajo de la de adentro
  pendienteMax: 0.5,   // radianes de la boca de afuera
  enfria: 1.2,         // segundos entre un uso y el siguiente
};

// Dónde está la boca ('adentro' o 'afuera') en el mundo, para una obra en (x, z) girada `rot` (la convención de construccion.js).
export function bocaDe(datos, cual) {
  const rot = Number(datos?.rot) || 0, lz = cual === 'afuera' ? PASADIZO.largo : 0;
  return { x: Number(datos.x) + lz * Math.sin(rot), z: Number(datos.z) + lz * Math.cos(rot) };
}
// La otra.
export const otraBoca = (cual) => (cual === 'afuera' ? 'adentro' : 'afuera');

// ¿Estás en alcance de alguna boca? Devuelve 'adentro', 'afuera' o null (la más cercana si estás en las dos).
export function bocaCerca(datos, pos, alcance = PASADIZO.alcance) {
  let mejor = null, d0 = alcance;
  for (const cual of ['adentro', 'afuera']) {
    const b = bocaDe(datos, cual), d = Math.hypot(b.x - pos.x, b.z - pos.z);
    if (d < d0) { d0 = d; mejor = cual; }
  }
  return mejor;
}

// Lugares donde parar al salir de la boca `cual`: de más a menos cómodo. Primero hacia afuera del túnel (alejándose de la
// otra boca), después los costados y por último de atrás. El juego elige el primero libre.
export function salidasDe(datos, cual) {
  const b = bocaDe(datos, cual), rot = Number(datos?.rot) || 0;
  const hacia = cual === 'afuera' ? rot : rot + Math.PI;   // el rumbo que se aleja de la otra boca
  const pasos = [0, 0.7, -0.7, 1.4, -1.4, 2.2, -2.2, Math.PI];
  return pasos.map((d) => {
    const a = hacia + d;
    return { x: b.x + Math.sin(a) * PASADIZO.llega, z: b.z + Math.cos(a) * PASADIZO.llega, yaw: yawMirando(a) };
  });
}
// El yaw del jugador para mirar hacia el rumbo `a` (la cámara mira hacia -z con yaw 0 y gira: yaw = a + PI).
export const yawMirando = (a) => a + Math.PI;

// Qué dice el aviso de E.
export const avisoPasadizo = (cual) => (cual === 'afuera' ? 'Meterte en el pasadizo (salís adentro de la base)' : 'Bajar al pasadizo (salís por atrás de la base)');

// ---------------------------------------------------------------- la animación de bajar y subir
// `t` corre de 0 a baja + sube. Devuelve el negro de la pantalla (0 a 1) y en qué mitad está.
export function faseDeBajada(t) {
  const total = PASADIZO.baja + PASADIZO.sube;
  if (t < 0) return { negro: 0, parte: 'espera' };
  if (t >= total) return { negro: 0, parte: 'fin' };
  if (t < PASADIZO.baja) { const k = t / PASADIZO.baja; return { negro: k * k * (3 - 2 * k), parte: 'baja' }; }
  const k = (t - PASADIZO.baja) / PASADIZO.sube;
  return { negro: 1 - k * k * (3 - 2 * k), parte: 'sube' };
}
