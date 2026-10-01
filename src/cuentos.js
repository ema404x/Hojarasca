// 2.3: el fogón de cuentos. Si el vecino que vino de visita encuentra un fuego prendido
// cerca de la mesa, no se va a las ocho: se queda al fuego hasta tarde y, cuando le
// hablás, cuenta un cuento de los que se cuentan de noche. Uno por visitante, en orden.
// Y de vez en cuando, una noche clara, en el lago asoma algo. Puro, sin THREE.
export const FOGON = {
  radio: 10,        // un fuego a esta distancia de la mesa hace que la visita se quede
  seVa: 23,         // hasta qué hora se queda al fuego
  desde: 20,        // desde qué hora cuenta cuentos en vez de charlar
};

export const CUENTOS = [
  { id: 'c-luz-mala', quien: 'ramon', titulo: 'La luz mala',
    partes: [
      'Esto me lo contó mi abuelo, que era arriero, y a él el suyo. En el campo abierto, en noches sin luna, a veces se ve una luz que va y viene, bajita, a la altura de un caballo.',
      'No es un farol ni una estrella. Si la seguís, se aleja; si te quedás quieto, se acerca. Los viejos decían que era un alma que no encontraba el camino, o que marcaba un lugar donde había algo enterrado.',
      'Yo la vi una sola vez, volviendo de la veranada. El caballo se plantó y no hubo forma. Esperamos hasta que se fue sola, para el lado del cerro. Al otro día no había nada ahí. Pero el caballo no quiso volver a pasar.',
    ] },
  { id: 'c-cuero', quien: 'nicanor', titulo: 'El cuero del lago',
    partes: [
      'En los lagos del sur se cuenta del cuero. Dicen que es como un cuero de vaca estirado, con el borde lleno de uñas, que flota bajo el agua quieta.',
      'Los que lo cuentan dicen que se lleva a los que se meten al agua en los días de calor, en las pozas hondas donde el agua cambia de color. Por eso los chicos no se bañaban solos.',
      'Yo creo que es una manera de decir que el agua fría y honda no perdona. Pero cuando paso con el bote por una poza oscura, igual remo un poco más rápido.',
    ] },
  { id: 'c-huemul-blanco', quien: 'ema', titulo: 'El huemul blanco',
    partes: [
      'Entre los guardaparques corre una historia que nadie firma. Que en lo más alto del bosque anda un huemul blanco, entero blanco, como si la nieve se hubiera puesto a caminar.',
      'Dicen que se deja ver sólo por los que andan sin apuro y sin ruido, y que mira un rato largo antes de irse. Y que el año que alguien lo ve, nacen más cervatillos.',
      'Yo no lo vi. Pero cada vez que cuento huemules en el censo, me fijo dos veces en los que están quietos contra la nieve. Por las dudas.',
    ] },
  { id: 'c-tren-medianoche', quien: 'ercilia', titulo: 'El tren de medianoche',
    partes: [
      'Cuando yo era chica, el tren no andaba de noche. Pero mi madre juraba que una noche de invierno oyó el silbato a las doce en punto, largo, como cuando llega a la estación.',
      'Salió con el farol. La vía estaba nevada y no había una huella. Al otro día le contaron que esa misma noche, lejos, en la vía de la meseta, un tren había quedado parado en la nieve con toda la gente adentro, y que a medianoche los sacaron sanos.',
      'Ella decía que el silbato era el tren avisando que estaban bien. Mi padre decía que era el viento en los cables. Yo no sé. Pero cuando nieva fuerte, a las doce, siempre escucho.',
    ] },
];
export const CUENTO = Object.fromEntries(CUENTOS.map((c) => [c.id, c]));

// ¿La visita se queda al fuego? Hace falta un fuego prendido cerca de la mesa.
export function seQuedaAlFuego(fuegoCerca, horas) {
  return !!fuegoCerca && horas < FOGON.seVa && horas >= 6;
}
// El cuento que le toca a este vecino: el primero suyo que todavía no contó.
export function cuentoPara(clave, contados = {}) {
  return CUENTOS.find((c) => c.quien === clave && !contados[c.id]) || null;
}
export function esHoraDeCuentos(horas) {
  return horas >= FOGON.desde || horas < 5;
}

// ---------------------------------------------------------------- lo que asoma en el lago
// Una noche clara, con luna, cerca de la orilla y mirando al agua: muy de vez en cuando
// asoma un lomo oscuro, se queda un momento y se hunde. Si le sacás una foto, queda.
export const LOMO = {
  cada: 3,            // noches, como mínimo, entre una vez y la otra
  chance: 0.35,       // por noche que se dan las condiciones
  orilla: 70,         // metros hasta la orilla, como mucho
  luna: 0.55,         // luna iluminada, como mínimo
  dist: [70, 150],    // a qué distancia de vos asoma, sobre el agua
  sube: 3, queda: 5, baja: 3,   // segundos
};
export const duracionLomo = () => LOMO.sube + LOMO.queda + LOMO.baja;

// ¿Esta noche puede asomar? Se decide una vez por noche. `ultimo`: día de la última vez.
export function nocheDeLomo({ dia, ultimo = -99, luna = 0, lluvia = 0, escucho = false, azar = Math.random } = {}) {
  if (!escucho) return false;                     // hace falta haber oído alguna historia del lago
  if (dia - ultimo < LOMO.cada) return false;
  if (luna < LOMO.luna || lluvia > 0.3) return false;
  return azar() < LOMO.chance;
}
// Cuánto asomó en el segundo `t` de la aparición (0 abajo, 1 arriba).
export function alturaLomo(t) {
  if (t < 0 || t > duracionLomo()) return 0;
  if (t < LOMO.sube) return t / LOMO.sube;
  if (t < LOMO.sube + LOMO.queda) return 1;
  return Math.max(0, 1 - (t - LOMO.sube - LOMO.queda) / LOMO.baja);
}
// Dónde asoma: sobre el agua, adelante tuyo, entre 70 y 150 m. `esLago(x, z)`.
export function dondeAsoma(pos, yaw, esLago, azar = Math.random) {
  for (let i = 0; i < 24; i++) {
    const ang = yaw + (azar() - 0.5) * 1.6;
    const d = LOMO.dist[0] + azar() * (LOMO.dist[1] - LOMO.dist[0]);
    const x = pos.x - Math.sin(ang) * d, z = pos.z - Math.cos(ang) * d;
    if (esLago(x, z)) return { x, z };
  }
  return null;
}
