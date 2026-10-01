// Percepción ecológica RC16: señal acústica del jugador y detección aproximada bajo cobertura.
import { clamp } from './ruido.js';

const RUIDO_SUPERFICIE = {
  agua: 1.42,
  madera: 1.28,
  hojas: 1.22,
  hojarasca: 1.16,
  tierra: 0.92,
  nieve: 0.78,
  pasto: 0.68,
  // 2.0: el pasto helado cruje: se oye más que el pasto de siempre
  escarcha: 1.08,
};

export function firmaSonoraJugador(js, ambiente = {}) {
  const velocidad = clamp((js.velocidadActual || 0) / 5.5, 0, 1.25);
  // 2.1: con las botas de goma el agua no chapotea
  const superficie = js.botas && js.superficie === 'agua' ? RUIDO_SUPERFICIE.pasto : RUIDO_SUPERFICIE[js.superficie] || 0.9;
  const pisada = 0.12 + velocidad * 0.62 + (js.corriendo ? 0.58 : 0);
  const sigilo = js.agachado ? 0.38 : 1;
  const lluvia = 1 - clamp(ambiente.lluvia || 0, 0, 1) * 0.28;
  const tormenta = ambiente.tormenta ? 0.72 : 1;
  return clamp(pisada * superficie * sigilo * lluvia * tormenta, 0.035, 1.75);
}

// 1.8: lo que no es el jugador y también asusta —la nave que baja, los invasores,
// el nido—. Cada peligro es un punto con radio: cerca da 1, en el borde da 0.
export function riesgoDePeligros(pos, peligros) {
  if (!Array.isArray(peligros) || !peligros.length) return 0;
  let peor = 0;
  for (const p of peligros) {
    const radio = p?.radio || 0;
    if (!radio) continue;
    const d = Math.hypot(pos.x - p.x, pos.z - p.z);
    if (d >= radio) continue;
    const cerca = 1 - d / radio;
    peor = Math.max(peor, clamp(cerca * (p.fuerza ?? 1), 0, 1));
  }
  return peor;
}

// 2.0: la paciencia.
//
// El pudú y el huemul son los dos animales más difíciles de anotar: huyen antes de que
// los veas. En el campo, lo que funciona con los animales tímidos no es perseguirlos:
// es quedarse quieto hasta que dejan de tenerte en cuenta. Esto le da al juego esa
// misma regla. Cuanto más tiempo sin moverte —y más todavía sentado o agachado—, más
// calmo estás, y un jugador calmo casi no se ve ni se oye.
//
// La calma se mide en segundos de reloj real, no de juego: sentarse acelera el día,
// pero los animales se mueven a su velocidad de siempre.
export const POSTURAS_CALMA = {
  pie: { tope: 0.5, segundos: 40 },
  agachado: { tope: 0.8, segundos: 30 },
  sentado: { tope: 1, segundos: 20 },
};

export function posturaDe(js) {
  return js?.sentado ? 'sentado' : js?.agachado ? 'agachado' : 'pie';
}

// Avanza el reloj de la quietud y devuelve la calma, de 0 a 1. Moverse la corta de
// golpe: la paciencia no se acumula a los saltos.
//
// Pero moverse de verdad, no temblar. En una pendiente el cuerpo se asienta y la
// colisión lo empuja un poquito de vez en cuando: un solo cuadro con velocidad no es
// caminar. Hace falta moverse un tercio de segundo seguido para romper la quietud.
export const TOLERANCIA_MOVIMIENTO = 0.35;
export function avanzarCalma(js, dtReal) {
  if (!js) return 0;
  const dt = Math.max(0, dtReal || 0);
  const subido = js.nadando || js.enKayak || js.enTren;
  const moviendo = (js.velocidadActual || 0) > 0.3;
  js.movido = moviendo ? (js.movido || 0) + dt : 0;
  if (subido || js.movido > TOLERANCIA_MOVIMIENTO) js.quietud = 0;
  else if (!moviendo) js.quietud = (js.quietud || 0) + dt;
  return calmaDe(js);
}

// ¿Está quieto de verdad? Con la misma tolerancia a los temblores.
export function quietoDeVerdad(js) {
  return !!js && !js.nadando && !js.enKayak && !js.enTren && (js.movido || 0) <= TOLERANCIA_MOVIMIENTO;
}

export function calmaDe(js) {
  const P = POSTURAS_CALMA[posturaDe(js)];
  // los primeros segundos no cuentan: pararse un momento no es esperar
  const q = Math.max(0, (js?.quietud || 0) - 3);
  return clamp(q / P.segundos, 0, 1) * P.tope;
}

// Un animal curioso, con el jugador calmo, a veces elige acercarse en vez de dar su
// vuelta de siempre. No viene hasta los pies: se queda a una distancia prudente —más
// que la que lo haría huir— y del lado donde ya estaba, así que se lo ve llegar.
export const CURIOSIDAD = { pudu: 0.9, huemul: 0.7 };
export function puntoDeCuriosidad(animal, jugador, calma, curiosidad, azar = Math.random) {
  if (!animal || !jugador || calma < 0.45 || !(curiosidad > 0)) return null;
  const dx = animal.x - jugador.x, dz = animal.z - jugador.z;
  const d = Math.hypot(dx, dz);
  if (d > 70) return null;                                 // no se entera
  // si ya está cerca y vos seguís quieto, se queda por ahí en vez de volverse
  if (d >= 12 && azar() > calma * curiosidad) return null;
  const distancia = 7 + azar() * 4;                        // entre 7 y 11 metros
  const a = Math.atan2(dx, dz) + (azar() - 0.5) * 0.9;     // de su lado, con un desvío
  return { x: jugador.x + Math.sin(a) * distancia, z: jugador.z + Math.cos(a) * distancia };
}

// Cuando un animal decide acercarse, queda anotado acá para que el juego lo cuente
// una vez («Un pudú se acerca»). Así el jugador aprende que quedarse quieto sirve.
export const acercamientos = [];
export function anotarAcercamiento(especie) {
  if (acercamientos.length < 8) acercamientos.push(especie);
}

export function percepcionMamifero(T, pos, js, ambiente = {}, baseVisual = 24, baseOido = 30) {
  const d = Math.hypot(pos.x - js.pos.x, pos.z - js.pos.z);
  const ka = T.indice(pos.x, pos.z), kj = T.indice(js.pos.x, js.pos.z);
  const bosqueA = clamp(T.bosque?.[ka] || 0, 0, 1), bosqueJ = clamp(T.bosque?.[kj] || 0, 0, 1);
  const pastoA = clamp(T.pasto?.[ka] || 0, 0, 1);
  const cobertura = clamp(bosqueA * 0.62 + bosqueJ * 0.28 + pastoA * 0.10, 0, 1);
  const firma = firmaSonoraJugador(js, ambiente);
  // un jugador calmo se vuelve parte del paisaje: se lo ve y se lo oye mucho menos
  const calma = calmaDe(js);
  const radioVisual = baseVisual * (1 - cobertura * 0.42) * (js.agachado ? 0.62 : 1) * (0.9 + clamp((js.velocidadActual || 0) / 5, 0, 1) * 0.18) * (1 - calma * 0.75);
  const radioOido = baseOido * (0.42 + firma * 0.78) * (1 - cobertura * 0.10) * (1 - calma * 0.6);
  const visual = clamp(1 - d / Math.max(0.1, radioVisual), 0, 1);
  const audible = clamp(1 - d / Math.max(0.1, radioOido), 0, 1) * clamp(0.42 + firma * 0.7, 0, 1.25);
  const ajeno = riesgoDePeligros(pos, ambiente.peligros);
  const riesgo = clamp(Math.max(visual, audible * 0.94, ajeno), 0, 1);
  return { d, cobertura, firma, radioVisual, radioOido, visual, audible, ajeno, riesgo };
}
