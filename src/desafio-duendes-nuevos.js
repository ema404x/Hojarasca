// 4.8: los dos duendes nuevos del Desafío, el curandero y el enjambre (módulo puro: sin THREE ni DOM).
//
//   · el curandero: chiquito, de poca vida. Se queda atrás del grupo y, cada pocos segundos, cura a los
//     heridos que tiene cerca (con límite: no los deja sanos, sólo los sostiene, y se cansa). Si lo
//     alcanzás, huye. Conviene ir a buscarlo primero. Si se queda solo, se asusta y se va.
//   · el enjambre: una docena de duendecitos de 30 cm que vienen en montón. De a uno no son nada (casi
//     sin vida ni daño); juntos te tapan. Cuestan poco: un solo modelo instanciado.
//
// Acá están los números de cada uno (`CURANDERO` y `ENJAMBRE`, que `TIPOS_ALIEN` suma), cuántos vienen en
// cada noche y las cuentas de curar y de moverse. El juego que los usa está en desafio-ataques.js.

// ---------------------------------------------------------------- los tipos (los suma TIPOS_ALIEN)
// Mismos campos que los demás invasores (ver TIPOS_ALIEN en desafio-reglas.js). `cura` y `enjambre` son
// las marcas que leen el juego y las pruebas.
export const CURANDERO = {
  nombre: 'curandero', vida: 34, vel: 2.9, dano: 3, cadencia: 2.2, alcance: 1.4, danoObra: 3,
  radio: 0.38, altura: 0.7, cristales: [1, 2], retroceso: 1.2, cura: true,
};
export const ENJAMBRE = {
  nombre: 'enjambre', vida: 7, vel: 4.1, dano: 1.1, cadencia: 1.0, alcance: 1.0, danoObra: 0.6,
  radio: 0.2, altura: 0.3, cristales: [0, 0], retroceso: 2.2, enjambre: true,
};

// ---------------------------------------------------------------- cuántos vienen
// El curandero: desde la noche 4, uno; desde la 12, dos; desde la 20, tres. Nunca con el jefe.
export const CURANDEROS = { desde: 4, segundo: 12, tercero: 20 };
export function curanderosEnLaNoche(n, conJefe = false) {
  const noche = Math.max(1, Math.floor(Number(n) || 1));
  if (conJefe || noche < CURANDEROS.desde) return 0;
  return 1 + (noche >= CURANDEROS.segundo ? 1 : 0) + (noche >= CURANDEROS.tercero ? 1 : 0);
}
// El enjambre: una noche de cada tres desde la 6 (la 6, la 9, la 12...), nunca con el jefe. Vienen de
// 8 a 12 (más cuanto más avanzada la noche) y la dificultad los mueve (tranquila menos, implacable más),
// con un techo (MAX_ENJAMBRE: el juego los deja pasar del tope de invasores, porque cuestan poco).
export const ENJAMBRES = { desde: 6, cada: 3, base: 8, maximo: 12 };
export const MAX_ENJAMBRE = 14;
export function enjambreEnLaNoche(n, conJefe = false, cantidad = 1) {
  const noche = Math.max(1, Math.floor(Number(n) || 1));
  if (conJefe || noche < ENJAMBRES.desde || (noche - ENJAMBRES.desde) % ENJAMBRES.cada !== 0) return 0;
  const k = Math.min(ENJAMBRES.maximo, ENJAMBRES.base + Math.floor((noche - ENJAMBRES.desde) / 2));
  return Math.max(4, Math.min(MAX_ENJAMBRE, Math.round(k * (Number(cantidad) > 0 ? Number(cantidad) : 1))));
}

// ---------------------------------------------------------------- curar
export const CURA = {
  radio: 9,            // a quiénes alcanza (m)
  cada: 3.4,           // segundos entre una cura y la siguiente
  objetivos: 3,        // como mucho a tantos por vez
  porcentaje: 0.22,    // lo que le devuelve de su vida máxima
  techo: 0.85,         // nadie queda por encima de esto (lo sostiene, no lo deja sano)
  herido: 0.92,        // el que tiene más que esto de su vida no necesita cura
  veces: 8,            // cuántas curas da en su vida: después se cansa
  huye: 7.5,           // si te le acercás a menos de esto, sale corriendo
  distancia: 15,       // te mantiene esta distancia cuando puede
  detras: 8,           // cuánto se queda atrás del centro del grupo (m)
  velHuida: 1.35,      // corre más rápido cuando huye
  soloSeVa: 12,        // segundos solo (sin nadie a quien curar) y se va
};
// Cuánto vale esta cura: la vida nueva de `a`, sin pasarse del techo y sin bajar nunca.
export function vidaCurada(vida, vidaMax) {
  const techo = vidaMax * CURA.techo;
  if (vida >= techo) return vida;
  return Math.min(techo, vida + vidaMax * CURA.porcentaje);
}
// De los candidatos (`{ id, vida, vidaMax, distancia, jefe, cura }`), a quiénes cura: los heridos que
// están en el radio, los más lastimados primero, hasta CURA.objetivos. No cura a los que curan (los
// curanderos no se curan entre sí) ni al jefe.
export function elegirCurados(candidatos, radio = CURA.radio, cuantos = CURA.objetivos) {
  const lista = [];
  for (const c of candidatos) {
    if (!c || c.cura || c.jefe) continue;
    if (!(c.distancia <= radio) || !(c.vidaMax > 0) || !(c.vida > 0)) continue;
    const frac = c.vida / c.vidaMax;
    if (frac >= CURA.herido || c.vida >= c.vidaMax * CURA.techo) continue;
    lista.push({ c, frac });
  }
  lista.sort((a, b) => a.frac - b.frac);
  return lista.slice(0, cuantos).map((x) => x.c);
}
// ¿Le toca curar? `t` son los segundos que pasaron desde la última; `usadas` las curas que ya dio.
export const puedeCurar = (t, usadas) => t >= CURA.cada && usadas < CURA.veces;

// ---------------------------------------------------------------- dónde se para
// La retaguardia: un punto detrás del centro del grupo, del lado opuesto a vos (así el grupo queda entre
// él y vos). Si el grupo está encima tuyo, el punto cae a `detras` metros más allá.
export function puestoDeRetaguardia(centro, jugador, detras = CURA.detras) {
  let dx = centro.x - jugador.x, dz = centro.z - jugador.z;
  const l = Math.hypot(dx, dz);
  if (l < 1e-3) { dx = 0; dz = 1; } else { dx /= l; dz /= l; }
  return { x: centro.x + dx * detras, z: centro.z + dz * detras };
}
// Cómo se mueve el curandero. `dist`: distancia a vos; `aliados`: cuántos del grupo hay vivos; `quedan`: las
// curas que le faltan. Devuelve { modo: 'huir'|'volver'|'quedarse'|'ir', rumboHacia: {x,z}|null, vel: 0..1 }
// (la velocidad como parte de la suya: 'huir' es > 1).
export function movimientoCurandero({ dist, aliados, pos, retaguardia, jugador }) {
  if (dist < CURA.huye) return { modo: 'huir', rumboHacia: { x: pos.x + (pos.x - jugador.x), z: pos.z + (pos.z - jugador.z) }, vel: CURA.velHuida };
  if (!aliados) return { modo: dist < CURA.distancia ? 'huir' : 'quedarse', rumboHacia: dist < CURA.distancia ? { x: pos.x + (pos.x - jugador.x), z: pos.z + (pos.z - jugador.z) } : null, vel: dist < CURA.distancia ? 1 : 0 };
  const d = Math.hypot(retaguardia.x - pos.x, retaguardia.z - pos.z);
  if (d < 1.5) return { modo: 'quedarse', rumboHacia: null, vel: 0 };
  // si está más cerca tuyo que lo que le gusta, deja que el grupo avance y se queda
  if (dist < CURA.distancia && d > 3) return { modo: 'volver', rumboHacia: retaguardia, vel: 1 };
  return { modo: 'ir', rumboHacia: retaguardia, vel: d > 12 ? 1.3 : 1 };
}

// ---------------------------------------------------------------- el enjambre
// Cómo zumba: el rumbo se le corre un poco, cada uno a su ritmo (`k` = el número del bicho), así se ven
// como una nube y no como una fila.
export function zumbidoDelEnjambre(fase, k, ancho = 0.45) {
  return Math.sin(fase * 4.3 + k * 1.7) * ancho + Math.sin(fase * 9.1 + k * 0.9) * ancho * 0.35;
}
// De dónde salen: todos juntos, en una mancha de ~2 m (el montón).
export function manchaDelEnjambre(i, n, radio = 2.2) {
  const t = n > 1 ? i / n : 0, a = i * 2.399963, r = Math.sqrt(t) * radio;   // el ángulo áureo: parejo
  return { dx: Math.cos(a) * r, dz: Math.sin(a) * r };
}
