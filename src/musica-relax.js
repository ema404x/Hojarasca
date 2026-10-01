// La música del Relax: un piano que aparece de a ratos. Hasta ahora tocaba siempre la
// misma escala; ahora la estación, la hora y la lluvia eligen el modo, el registro y
// cuánto silencio hay entre frase y frase. Módulo puro (se prueba en Node).

// Notas MIDI. Cada paleta es un modo distinto sobre la misma tónica (re), así que el
// bosque suena siempre al mismo lugar aunque cambie el ánimo.
export const PALETAS = {
  verano: { nombre: 'mayor abierta', grados: [62, 64, 66, 69, 71, 74, 76, 78, 81] },
  otono: { nombre: 'dórica', grados: [62, 64, 65, 69, 71, 72, 74, 76, 79] },
  invierno: { nombre: 'menor', grados: [62, 65, 67, 69, 70, 74, 77, 79, 82] },
  lluvia: { nombre: 'suspendida', grados: [62, 64, 67, 69, 72, 74, 76, 79, 84] },
};

export const MOMENTOS = [
  { id: 'madrugada', desde: 0, hasta: 5.5, octava: -12, vol: 0.62, espacio: [1.6, 3.4], duracion: [3.4, 6] },
  { id: 'amanecer', desde: 5.5, hasta: 9, octava: 0, vol: 1, espacio: [0.7, 1.8], duracion: [2.5, 4.5] },
  { id: 'dia', desde: 9, hasta: 17.5, octava: 0, vol: 0.86, espacio: [0.9, 2.2], duracion: [2.4, 4.2] },
  { id: 'atardecer', desde: 17.5, hasta: 21, octava: -0, vol: 1, espacio: [0.8, 2], duracion: [3, 5.2] },
  { id: 'noche', desde: 21, hasta: 24, octava: -12, vol: 0.7, espacio: [1.4, 3], duracion: [3.2, 5.6] },
];

export function momentoDelDia(horas) {
  const h = ((Number(horas) % 24) + 24) % 24;
  for (const m of MOMENTOS) if (h >= m.desde && h < m.hasta) return m;
  return MOMENTOS[MOMENTOS.length - 1];
}

// Qué toca ahora: la escala, el registro, el volumen y los silencios.
export function paletaMusical({ horas = 12, invierno = 0, otono = 0, lluvia = 0 } = {}) {
  const momento = momentoDelDia(horas);
  const clave = lluvia > 0.5 ? 'lluvia' : invierno > 0.5 ? 'invierno' : otono > 0.5 ? 'otono' : 'verano';
  const p = PALETAS[clave];
  return {
    clave,
    nombre: p.nombre,
    momento: momento.id,
    escala: p.grados.map((n) => n + momento.octava),
    // con lluvia o de noche, las frases se estiran y bajan el volumen
    vol: momento.vol * (lluvia > 0.5 ? 0.8 : 1) * (invierno > 0.5 ? 0.92 : 1),
    espacio: momento.espacio,
    duracion: momento.duracion,
    notas: momento.id === 'madrugada' || momento.id === 'noche' ? [3, 6] : [5, 10],
  };
}

// Cuánto silencio hasta la próxima frase. De noche y con lluvia, más.
export function esperaHastaFrase(paleta, azar = Math.random) {
  const base = paleta.momento === 'amanecer' || paleta.momento === 'atardecer' ? [55, 110] : [80, 170];
  const extra = paleta.clave === 'lluvia' ? 1.25 : 1;
  return (base[0] + azar() * (base[1] - base[0])) * extra;
}

// La mezcla: cuánto de cada cosa según la hora, además de lo que eligió el jugador.
export function mezclaPorHora({ horas = 12, lluvia = 0, adentro = 0 } = {}) {
  const m = momentoDelDia(horas);
  const noche = m.id === 'noche' || m.id === 'madrugada';
  return {
    // de noche el bosque baja un poco y se escucha más el silencio
    ambiente: (noche ? 0.82 : 1) * (1 - adentro * 0.35) * (1 + lluvia * 0.08),
    musica: noche ? 1.08 : 1,
    efectos: 1 - adentro * 0.12,
  };
}

export function escalaVolumen(v, defecto = 0.8) {
  const n = Number(v);
  if (!Number.isFinite(n)) return defecto;
  return Math.max(0, Math.min(1, n));
}
