// 4.8.1: el aro de hongos donde salen los duendes (antes: el platillo de una nave). Reglas puras (sin three ni
// DOM): cuánto dura cada fase, cuán abierto está el aro, qué tan fuerte es su luz y su columna de luciérnagas.
// Las fases y los tiempos son los de siempre (`llegando` 4 s, `bajando` mientras queden por salir,
// `vigilando` el resto de la noche, `yendo` 5 s); sólo cambió lo que se ve y lo que se oye. El mundo (la
// malla, la luz, el sonido) está en desafio-aro-mundo.js y la malla en duendes-modelo.js (`mallaAro`).

// Lo que dura cada fase del aro (s). `llegando` y `yendo` son los de la nave de antes.
export const FASES_ARO = { llegando: 4, yendo: 5 };
// Los duendes suben de abajo de la tierra (antes bajaban 16 m a 8 m/s: 2 s): de cuán abajo salen y a qué
// velocidad (m/s). `hondo / vel` es lo que tardan en salir y tiene que seguir siendo lo de antes (2 s).
export const SALIDA_DUENDE = { hondo: 2.6, vel: 1.3 };
export const TARDA_EN_SALIR = SALIDA_DUENDE.hondo / SALIDA_DUENDE.vel;
// La luz fija del aro (la que era la de la nave, 80 verde): ámbar tenue.
export const LUZ_ARO = { color: 0xffb060, intensidad: 3.2, distancia: 34, decaimiento: 1.6, altura: 1.8 };
// Cada cuánto suena el crujido de las raíces y el viento grave (la nave zumbaba cada 1,3 s).
export const CADA_CRUJIDO = [2.2, 3.4];

const acotar = (v, a, b) => (v < a ? a : v > b ? b : v);
export const suave = (t) => { t = acotar(t, 0, 1); return t * t * (3 - 2 * t); };

// Cuán afuera está el aro (0: bajo tierra, 1: del todo): brota al caer la noche, queda y se hunde al irse.
export function brotado(fase, t) {
  if (fase === 'llegando') return suave(t / FASES_ARO.llegando);
  if (fase === 'yendo') return 1 - suave(t / 2.6);
  if (fase === 'fuera') return 0;
  return 1;
}
// La tapa de tierra y hojas: se va cubriendo la boca mientras se hunde el aro y al final se hunde ella
// (0: bajo tierra, 1: a ras).
export function tapado(fase, t) {
  if (fase !== 'yendo') return 0;
  return suave((t - 1.2) / 1.6) * (1 - suave((t - 4.0) / 1.0));
}
// Cuán fuerte es la columna de luciérnagas y esporas que sube de la boca (0 a 1): crece al final de la
// llegada, está entera mientras salen y se apaga al empezar a irse.
export function columna(fase, t) {
  if (fase === 'llegando') return 0.35 * suave((t - 2.6) / 1.4);
  if (fase === 'bajando') return 1;
  if (fase === 'vigilando') return 0.22;
  if (fase === 'yendo') return 0.5 * (1 - suave(t / 1.5));
  return 0;
}
// La luz ámbar (multiplica `LUZ_ARO.intensidad`): sube con el aro, late despacio mientras acecha.
export function luz(fase, t, reloj = 0) {
  const k = brotado(fase, t);
  const late = fase === 'vigilando' ? 0.82 + 0.18 * Math.sin(reloj * 1.7) : fase === 'bajando' ? 1.1 : 1;
  return acotar(k * k * late, 0, 1.3);
}
// Cuánto brillan los hongos de luz (el material de los brillos y los halos): laten suave.
export function brilloDeHongos(fase, t, reloj = 0) {
  const k = brotado(fase, t);
  const late = fase === 'vigilando' ? 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(reloj * 1.3)) : 0.9 + 0.1 * Math.sin(reloj * 2.1);
  return k * late;
}
// ¿Cuánto falta para el próximo crujido? (azar en [0,1))
export function proximoCrujido(azar = Math.random()) {
  return CADA_CRUJIDO[0] + (CADA_CRUJIDO[1] - CADA_CRUJIDO[0]) * azar;
}
// La posición de una luciérnaga de la columna (local al aro): sube en espiral desde la boca, `i` de `n`,
// y vuelve a empezar. `t` en segundos. Devuelve { x, y, z, a } con `a` la intensidad (aparece y se apaga).
export function luciernaga(i, n, t, radioBoca = 3.9, alto = 5.5) {
  const fase = ((t * 0.16 + i / n + (i * 0.6180339887) % 1) % 1 + 1) % 1;
  const ang = i * 2.399963 + t * (0.35 + 0.1 * ((i * 7) % 3)) + fase * 2;
  const r = radioBoca * (0.2 + 0.7 * ((i * 0.7548776662) % 1)) * (1 - 0.45 * fase);
  return { x: Math.cos(ang) * r, y: 0.3 + fase * alto, z: Math.sin(ang) * r, a: Math.sin(Math.PI * fase) ** 0.8 };
}
