// 4.12.3: reglas puras (sin three ni DOM) de las sombras que llegan más lejos.
// La luz del sol arma un mapa de sombras sobre una caja (±metros) alrededor tuyo; cuánto mide esa caja, a qué distancia pone la luz,
// y cómo se «encaja» la caja en la grilla de téxeles del mapa para que las sombras no parpadeen al caminar. Lo usa cielo.js.

// Antes de la 4.12.3 la caja era fija por tamaño de mapa: ±40 m con 1024 y ±55 m con 2048.
export function cajaDeSombra(tam, cajaConfig) {
  if (Number.isFinite(cajaConfig) && cajaConfig > 0) return cajaConfig;
  return tam >= 2048 ? 55 : 40;
}

// A qué distancia del blanco se pone la luz (metros a lo largo del rayo del sol). Con la caja de siempre queda en 150, como antes; con una
// caja más grande se aleja para que los árboles y edificios de más allá del borde (arriba, hacia el sol) no queden detrás de la luz.
export function distanciaLuz(caja) {
  return Math.max(150, Math.round(caja * 1.6));
}

// El rango de profundidad de la cámara de la luz (lejos). El sesgo de three es una fracción de ese rango: se escala para que valga los
// mismos metros que con el rango de siempre (400 m → -0,0006).
export function lejosDeLuz(caja) {
  return distanciaLuz(caja) + 250;
}
export function sesgoDeSombra(lejos) {
  return -0.0006 * 400 / lejos;
}

// Mueve el blanco de la luz (`t` = {x, y, z}) hasta el téxel más cercano del mapa, midiendo en el plano de la luz y no en el del mundo.
// El mapa es una grilla en las direcciones «derecha» y «arriba» de la cámara de la luz; si el blanco se corre a pasos de téxel en ESAS
// direcciones, las sombras de las cosas quietas caen siempre en los mismos téxeles (no «nadan» ni titilan al recalcular el mapa).
// Antes se redondeaba x y z del mundo, que no coinciden con esas direcciones cuando el sol está de costado.
// `dir` es la dirección unitaria hacia el sol; `paso` el tamaño de un téxel en metros (2 × caja / tamaño del mapa).
// Devuelve un objeto nuevo; con el sol casi en el cenit (sin «derecha» definida) devuelve el blanco tal cual.
export function encajarEnTexeles(t, dir, paso) {
  const zx = dir.x, zy = dir.y, zz = dir.z;
  const largo = Math.hypot(zz, zx);
  if (!(paso > 0) || largo < 1e-4) return { x: t.x, y: t.y, z: t.z };
  // los mismos ejes que arma lookAt con «arriba» = (0, 1, 0): x = arriba × z, y = z × x
  const xx = zz / largo, xz = -zx / largo;
  const yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
  const a = t.x * xx + t.z * xz;
  const b = t.x * yx + t.y * yy + t.z * yz;
  const da = Math.round(a / paso) * paso - a;
  const db = Math.round(b / paso) * paso - b;
  return { x: t.x + da * xx + db * yx, y: t.y + db * yy, z: t.z + da * xz + db * yz };
}

// El corrimiento por normal (en metros) que evita el acné. Con la caja de siempre (±40 con mapa de 1024, ±55 con 2048) vale lo mismo que
// antes de la 4.12.3: 0,06 + 0,035 × (radio − 1) × (2048 / tamaño); con una caja más grande el téxel mide más metros y el corrimiento crece igual.
export function sesgoNormal(radio, tam, caja) {
  const cajaAntes = tam >= 2048 ? 55 : 40;
  return 0.06 + 0.035 * (radio - 1) * (2048 / Math.max(512, tam)) * Math.max(1, caja / cajaAntes);
}

// Cuántos metros te podés alejar del centro del mapa de sombras antes de rehacerlo (main.js). Con las cajas de siempre (±40 y ±55) son 6 m
// (la caja siempre te cubre al menos 30 m más allá); con una caja grande se tolera más, así el mapa se rehace menos veces por segundo al caminar.
export function umbralDeRecentrado(caja) {
  return Math.min(16, Math.max(6, Math.round(caja * 0.15)));
}
