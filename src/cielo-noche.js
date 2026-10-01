// 2.0: el cielo de noche cambia.
//
// Hasta la 1.9 todas las noches eran la misma noche: luna llena, las mismas estrellas.
// Ahora la luna tiene fases y un ciclo que se nota en una semana de juego, y en verano
// hay noches de lluvia de estrellas. Las dos cosas se anotan en el cuaderno.
//
// Dos detalles del sur que el juego respeta:
//
//   · En el hemisferio sur la luna no miente. En el norte se dice que es mentirosa
//     porque cuando dibuja una C está decreciendo; acá abajo, cuando dibuja una C está
//     Creciendo, con la parte iluminada a la izquierda.
//   · La lluvia de estrellas más fuerte del año, las Gemínidas, cae a mediados de
//     diciembre: en pleno verano patagónico. Desde el sur el radiante está bajo, hacia
//     el norte, así que las estrellas fugaces cruzan el cielo desde ese lado.
//
// Todo es puro; el cielo lo dibuja `cielo.js` y el juego lo anota en `main.js`.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Un mes lunar de juego dura ocho días: en una semana se ve la luna pasar de nueva a
// llena y volver. El día 1 empieza en creciente, para que la primera noche tenga luna.
export const DIAS_LUNA = 8;
export function faseLunar(dia, horas = 0) {
  const t = (dia - 1) + horas / 24 + DIAS_LUNA * 0.25;
  return (((t % DIAS_LUNA) + DIAS_LUNA) % DIAS_LUNA) / DIAS_LUNA;
}

// Cuánto de la cara se ve iluminada: 0 nueva, 1 llena.
export function iluminada(fase) {
  return (1 - Math.cos(fase * Math.PI * 2)) / 2;
}

export function creciente(fase) { return fase < 0.5; }

export function nombreFase(fase) {
  const f = ((fase % 1) + 1) % 1;
  if (f < 0.0625 || f >= 0.9375) return 'luna nueva';
  if (f < 0.1875) return 'luna creciente';
  if (f < 0.3125) return 'cuarto creciente';
  if (f < 0.4375) return 'gibosa creciente';
  if (f < 0.5625) return 'luna llena';
  if (f < 0.6875) return 'gibosa menguante';
  if (f < 0.8125) return 'cuarto menguante';
  return 'luna menguante';
}

// ¿Qué lado del disco está iluminado, visto desde el sur? `x` va de -1 (izquierda) a
// 1 (derecha) sobre el disco, `y` de -1 a 1. Devuelve 1 si ese punto recibe sol.
// En el sur, creciendo, la luz está a la izquierda: la C.
export function discoIluminado(fase, x, y) {
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const k = Math.cos(fase * Math.PI * 2) * r;           // dónde cae la línea de sombra
  return (creciente(fase) ? -x : x) > k ? 1 : 0;
}

// Lo que la luna le hace a la noche: con luna llena se ve el camino y se apagan las
// estrellas débiles; con luna nueva la noche es negra y aparece la Vía Láctea.
export function luzDeLuna(fase) {
  const i = iluminada(fase);
  return {
    luz: 0.22 + i * 0.78,            // multiplica la luz de la noche
    estrellas: 1.35 - i * 0.55,      // las débiles se ven más sin luna
    via: 1.6 - i * 1.3,              // y la Vía Láctea, mucho más
  };
}

// ---------------------------------------------------------------- estrellas fugaces
// La noche de la lluvia de estrellas: una vez cada seis días, si es verano.
export function nocheDeEstrellas(dia, verano) {
  return verano > 0.5 && ((dia % 6) + 6) % 6 === 3;
}

// Cuántas por minuto. Una noche común tiene alguna suelta; la noche de la lluvia, con
// el radiante alto —de madrugada—, llega a una cada pocos segundos.
export function fugacesPorMinuto({ horas, noche, nublado = 0, luna = 0, lluvia = false }) {
  if (noche < 0.6) return 0;
  const h = ((horas % 24) + 24) % 24;
  const madrugada = h >= 22 || h < 5 ? 1 : 0.4;
  const base = lluvia ? 9 * madrugada : 0.35;
  // la luna llena tapa las débiles, y con nubes no se ve nada
  return base * (1 - clamp(nublado, 0, 1) * 0.95) * (1 - luna * 0.4);
}

// El radiante de las Gemínidas visto desde la Patagonia: bajo, hacia el norte.
export const RADIANTE = { acimut: 8, altura: 18 };

// Una estrella fugaz: de dónde sale en el cielo (acimut y altura en grados), hacia
// dónde corre, cuánto mide y cuánto dura. Las de la lluvia salen del radiante; las
// sueltas, de cualquier lado.
export function fugaz(lluvia, azar = Math.random) {
  let acimut, altura, rumbo;
  if (lluvia) {
    // arranca a un costado del radiante y se aleja de él
    const lejos = 12 + azar() * 50;
    const giro = (azar() - 0.5) * 150;
    acimut = RADIANTE.acimut + Math.sin(giro * Math.PI / 180) * lejos;
    altura = clamp(RADIANTE.altura + Math.abs(Math.cos(giro * Math.PI / 180)) * lejos * 0.8, 14, 80);
    rumbo = Math.atan2(altura - RADIANTE.altura, acimut - RADIANTE.acimut);
  } else {
    acimut = azar() * 360;
    altura = 25 + azar() * 50;
    rumbo = azar() * Math.PI * 2;
  }
  const brillo = 0.45 + Math.pow(azar(), 2) * 0.55;
  return {
    acimut, altura, rumbo,
    largo: 6 + brillo * 16,           // grados de cielo que cruza
    dur: 0.35 + azar() * 0.5,          // segundos
    brillo,
  };
}

// ---------------------------------------------------------------- el cuaderno
// La luna llena se anota mirándola, como las constelaciones. La lluvia de estrellas,
// viendo tres fugaces en la noche de la lluvia.
export const FUGACES_PARA_ANOTAR = 3;
export function lunaAnotable(fase) { return nombreFase(fase) === 'luna llena'; }

// La línea de estado del cielo (para la pausa y el diario).
export function textoLuna(fase) {
  const n = nombreFase(fase);
  if (n === 'luna nueva') return 'Luna nueva: noche cerrada, se ve la Vía Láctea.';
  if (n === 'luna llena') return 'Luna llena: se ve el camino sin linterna.';
  return `${n[0].toUpperCase()}${n.slice(1)}.`;
}
