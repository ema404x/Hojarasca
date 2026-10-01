// Escuchar con atención.
//
// El chucao se anota por el canto, no por verlo: vive escondido en el sotobosque y
// «es mucho más fácil oírlo que verlo». Hasta ahora el juego lo anotaba solo, si
// pasabas a menos de 38 metros justo cuando cantaba. Es decir, de casualidad.
//
// Esto le da al jugador una forma de buscarlo a propósito, que es como se busca en el
// campo: agacharse, quedarse quieto y escuchar. En esa postura el bosque baja, el oído
// llega más lejos y lo que canta y todavía no anotaste se hace notar —canta antes, y
// el juego te dice de qué lado viene—. No pide tecla nueva: es la postura del sigilo.
//
// Módulo puro: sin audio, sin DOM, sin three.

// Hasta dónde se anota un canto: de pasada, y escuchando con atención.
export const ALCANCE_OIDO = { pasando: 38, escuchando: 95 };

// Lo que se anota por el oído, con su nombre para el aviso.
export const QUE_SE_OYE = {
  chucao: 'un chucao',
  carpintero: 'un golpeteo doble',
  concon: 'un concón',
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Los ocho rumbos, en el sentido del juego: el norte es -z y el este +x.
const RUMBOS = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
export function rumboDe(desde, hacia) {
  const ang = Math.atan2(hacia.x - desde.x, -(hacia.z - desde.z));      // 0 = norte
  const i = Math.round(((ang + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return RUMBOS[i];
}

// De todo lo que se puede oír, lo más cercano que todavía no está en el cuaderno.
// `fuentes`: [{ especie, x, z }]. Devuelve null si no queda nada al alcance.
export function queCantaCerca(fuentes, pos, anotado, alcance = ALCANCE_OIDO.escuchando) {
  let mejor = null;
  for (const f of fuentes || []) {
    if (!f || anotado?.[f.especie]) continue;
    const d = Math.hypot(f.x - pos.x, f.z - pos.z);
    if (d > alcance) continue;
    if (!mejor || d < mejor.d) mejor = { ...f, d };
  }
  if (mejor) mejor.rumbo = rumboDe(pos, mejor);
  return mejor;
}

// Escuchar con atención pide estar quieto: caminar hace ruido y tapa lo demás. El
// oído se afina de a poco, en un par de segundos, y se pierde de golpe al moverse.
export function afinarOido(actual, escuchando, quieto, dt) {
  const quiere = escuchando && quieto ? 1 : 0;
  // Ojo con el caso de llegar: con el oído ya afinado, `quiere` es igual a `actual` y no
  // mayor, y si la bajada no se frena en `quiere`, se desploma y vuelve a subir en
  // diente de sierra. Pasó en la primera versión y se veía en la prueba de partida real.
  return quiere > actual ? Math.min(quiere, actual + dt / 1.6) : Math.max(quiere, actual - dt * 4);
}

// Cuánto se aparta el resto del bosque cuando escuchás: no se apaga, se corre.
export function mezclaAlEscuchar(afinado) {
  const a = clamp(afinado, 0, 1);
  return { ambiente: 1 - a * 0.62, musica: 1 - a * 0.8 };
}

export function textoEscucha(fuente) {
  if (!fuente) return 'Escuchás… nada que no tengas anotado.';
  const que = QUE_SE_OYE[fuente.especie] || 'algo';
  const cerca = fuente.d < 25 ? 'muy cerca' : fuente.d < 55 ? 'cerca' : 'lejos';
  return `Se oye ${que}, ${cerca}, hacia el ${fuente.rumbo}.`;
}
