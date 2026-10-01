// La escarcha de la mañana.
//
// La niebla que se acuesta sobre el lago y el mallín al amanecer ya estaba (RC18). Lo
// que faltaba es lo que queda en el suelo después de una noche fría y despejada: una
// capa blanca y fina sobre el pasto, que cruje al pisarla y que se va derritiendo
// cuando el sol pega, primero en lo abierto y después en lo que queda a la sombra.
//
// La escarcha se forma cuando el suelo pierde calor hacia un cielo limpio: las nubes
// hacen de manta y el viento revuelve el aire, así que con cualquiera de las dos no
// hay. La lluvia la lava. En la Patagonia hay escarcha hasta en verano en los bajos
// húmedos, pero poca; en otoño es común, y en invierno, casi todas las mañanas claras.
//
// Módulo puro: entra la hora y el tiempo, sale un número de 0 a 1.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const suave = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Cuánta escarcha puede haber, según la estación: 0 verano, 1 invierno.
export function fuerzaDeEstacion(invierno = 0, otono = 0) {
  return clamp(0.22 + otono * 0.48 + invierno * 0.78, 0, 1);
}

// La forma a lo largo del día: se arma de madrugada, está entera al amanecer y se
// derrite a media mañana. En invierno el sol pega más bajo y tarda más en irse.
export function formaDelDia(horas, invierno = 0) {
  const h = ((horas % 24) + 24) % 24;
  const seDerrite = 9.2 + invierno * 1.6;      // a esta hora ya no queda
  const forma = suave(1.0, 5.2, h);            // se va armando de madrugada
  const derrite = 1 - suave(7.0, seDerrite, h);
  return h < 12 ? forma * derrite : 0;
}

export function escarchaDe({ horas = 12, invierno = 0, otono = 0, nublado = 0, lluvia = 0, viento = 0 } = {}) {
  if (lluvia > 0.2) return 0;                  // la lluvia la lava
  const manta = 1 - clamp(nublado, 0, 1) * 0.85;
  const quieto = 1 - clamp(viento, 0, 1) * 0.65;
  return clamp(fuerzaDeEstacion(invierno, otono) * formaDelDia(horas, invierno) * manta * quieto, 0, 1);
}

// A partir de cuánto se nota al pisar.
export const CRUJE_DESDE = 0.35;
