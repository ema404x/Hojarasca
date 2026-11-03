// 4.21.0: lo que la Historia pide de los ajustes del juego («La Historia arranca bien»). Módulo PURO (sin three ni DOM; se prueba en Node).
//
// Dos cosas, las dos halladas en la auditoría 4.20.0 (B):
//   · LA ESTACIÓN PROPIA. La Historia (capítulos 5 a 13) se cuenta con otoño, helada y nevada, pero de fábrica el ajuste «Estación» está en
//     «Verano» y el clima de la historia sólo se aplicaba con «Que pasen solas»: del capítulo 5 al 13 se jugaba en un valle verde. Ahora, en una
//     Historia que empieza con la 4.21.0 (o después) las estaciones pasan solas, elija lo que elija el selector (que se apaga con el motivo).
//     Una Historia empezada antes conserva lo que el jugador había elegido a mano.
//   · LA HORA DE TU RELOJ. Con ese ajuste no hay siesta, se duerme una vez por noche, las escenas no cambian la hora y 27 objetivos sólo valen a
//     la hora real: la Historia no va con eso. El chip se apaga con el motivo y, al empezar o retomar la Historia, el día vuelve a durar lo de fábrica.
//
// `ajustes`: { modo, relaxTipo, estacion, duracion } · `h`: la historia guardada (progreso.historia) o null · `esDesafio`: la partida es La noche de los duendes.

export const DURACION_DE_FABRICA = 30;

export const MOTIVO_ESTACION = 'En la Historia las estaciones pasan solas: el otoño y la nevada son parte del cuento.';
export const MOTIVO_RELOJ = 'La Historia no va con la hora de tu reloj: hay cosas que pasan de noche y se esperan sentado (R).';

const n = (v) => { try { return Number(v) || 0; } catch { return 0; } };

// ¿Se está en la Historia (o por empezarla desde la portada) y todavía no terminó? Una terminada devuelve la libertad: «todo sigue abierto».
export function enLaHistoria(ajustes, h, esDesafio = false) {
  if (esDesafio || ajustes?.modo === 'desafio') return false;
  if (ajustes?.relaxTipo !== 'historia') return false;
  if (h && (h.fase === 'fin' || n(h.terminada) > 0)) return false;
  return true;
}

// ¿Rige la estación propia de la Historia? Sólo en una Historia nueva (por empezar o empezada con la bandera `arranqueNuevo`).
export function estacionPropiaRige(ajustes, h, esDesafio = false) {
  if (!enLaHistoria(ajustes, h, esDesafio)) return false;
  if (h && n(h.empezada) > 0) return h.arranqueNuevo === true;
  return true;
}

// El valor del ajuste de estación que usa el mundo: 'auto' cuando rige la de la Historia; si no, lo que eligió el jugador.
export function estacionEfectiva(ajustes, h, esDesafio = false) {
  return estacionPropiaRige(ajustes, h, esDesafio) ? 'auto' : ajustes?.estacion;
}

// ¿El chip «Hora de tu reloj» se apaga? En cualquier Historia en marcha (nueva o vieja): con ese ajuste no hay forma de jugarla bien.
export const relojApagado = (ajustes, h, esDesafio = false) => enLaHistoria(ajustes, h, esDesafio);

// Al empezar o retomar la Historia con la hora de tu reloj puesta: el día vuelve a durar lo de fábrica. Devuelve la duración nueva o null si no hay nada que cambiar.
export function duracionAlEntrar(ajustes, h, esDesafio = false) {
  return relojApagado(ajustes, h, esDesafio) && ajustes?.duracion === 'reloj' ? DURACION_DE_FABRICA : null;
}

// Lo que dicen los selectores de la portada y de los ajustes cuando se apagan: { estacion, reloj } (cada uno, el motivo o '')
export function avisosDeAjustes(ajustes, h, esDesafio = false) {
  return {
    estacion: estacionPropiaRige(ajustes, h, esDesafio) ? MOTIVO_ESTACION : '',
    reloj: relojApagado(ajustes, h, esDesafio) ? MOTIVO_RELOJ : '',
  };
}

// «Primeros pasos» (relax-tutorial.js) no se muestra con la Historia en marcha (el panel de objetivos del capítulo es el único) ni en una Historia
// empezada con la 4.21.0 aunque esté en pausa o terminada (el capítulo 1 enseña lo mismo y el premio de «Ya sabés lo básico» sería doble).
export function sinPrimerosPasos(h) {
  if (!h || typeof h !== 'object') return false;
  if (h.activa === true && h.fase !== 'fin') return true;
  return h.arranqueNuevo === true;
}
