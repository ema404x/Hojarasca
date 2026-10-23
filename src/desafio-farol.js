// 4.9 defensas: el farol de mano del Desafío (reglas puras, se prueban en Node).
//
// Un farol que se lleva en la mano izquierda, mientras la derecha sigue con el arma. Prendido, los viejos oscuros no se acercan a
// menos de `radio` metros de vos (retroceden); pero la luz te delata: los que tiran te ven de más lejos y apuntan antes. Se apaga
// con la lluvia fuerte, como las antorchas. No agrega luces: usa la luz de la linterna (la que va pegada a la cámara) con otro
// alcance y color ámbar, así que no hay shaders nuevos ni luces extra.
//
// Lo que se ve (el farol en la mano, la luz) y lo que se mueve vive en desafio-farol-mundo.js.

export const FAROL = {
  radio: 5.5,           // los viejos oscuros no se acercan a menos de esto
  velRetroceso: 0.85,   // qué tan rápido se alejan (por la velocidad de siempre)
  delata: 1.45,         // los tiradores te ven de lejos: su alcance se multiplica por esto
  lluvia: 0.55,         // con más lluvia que esto se apaga
  // la luz que se pone en el lugar de la linterna
  luz: { color: 0xffb25a, alcance: 24, angulo: 1.3, penumbra: 0.92, intensidad: 30, decaimiento: 1.4, x: -0.3, y: -0.13, z: 0 },
};

// ¿Es un viejo oscuro? (el jefe no cuenta: no se espanta con un farol)
export function esViejoOscuro(def, viejo) {
  return !!viejo && !!def && !def.jefe;
}
// Lo que le pasa a un duende por el farol. `dist`: metros hasta vos; `romper`: está rompiendo una obra (esa no la suelta).
// Devuelve null (nada) o { rumbo hacia afuera: true, vel }.
export function efectoFarol({ dist = 99, viejo = false, def = null, romper = false } = {}) {
  if (!esViejoOscuro(def, viejo) || romper) return null;
  if (dist >= FAROL.radio) return null;
  return { alejarse: true, vel: FAROL.velRetroceso };
}
// El rumbo (radianes, como `rot`: atan2(x, z)) para alejarse de un punto.
export function rumboAlejarse(desde, de) {
  return Math.atan2(desde.x - de.x, desde.z - de.z);
}
// El alcance de un tirador contra vos: más largo si llevás el farol prendido.
export const alcanceDelata = (alcance, prendido) => alcance * (prendido ? FAROL.delata : 1);

// ¿Se puede prender ahora?
export function sePuedePrender({ lluvia = 0, tiene = false, caido = false } = {}) {
  if (!tiene) return { ok: false, motivo: 'No tenés el farol de mano', sub: 'Se fabrica en el taller (K → Equipo)' };
  if (caido) return { ok: false, motivo: '', sub: '' };
  if (lluvia > FAROL.lluvia) return { ok: false, motivo: 'Con esta lluvia no prende', sub: 'Esperá a que afloje' };
  return { ok: true };
}
// El brillo con un titileo suave (la llama). `t` en segundos.
export const brilloFarol = (t) => 0.9 + Math.sin(t * 9.1) * 0.05 + Math.sin(t * 15.7 + 1.3) * 0.04;

// ---------------------------------------------------------------- el taller
export const RECETAS_FAROL = [
  { id: 'farol-mano', cat: 'equipo', nombre: 'Farol de mano', pide: { tabla: 1, cristal: 1, ramita: 2 }, da: { cosa: 'farolMano' }, unica: true,
    texto: `Un farol de vidrio ámbar para la mano izquierda: elegilo en la barra y apretá U o el clic derecho para prenderlo o apagarlo. Los viejos oscuros no se te acercan a menos de ${FAROL.radio} m, pero la luz te delata de lejos y los que tiran te apuntan antes. La lluvia fuerte lo apaga.` },
];
