// 4.1 (F3): los efectos de los rasgos de Bruno sobre el juego. Módulo puro (sin three ni DOM): se prueba en Node.
//
// creador-personaje.js ya calcula cuánto aporta cada rasgo a cada sistema (`efectosAplicados`, con tope). Acá se traduce eso a lo que el juego necesita
// en cada sistema, y NADA más: main.js sólo llama a estas funciones en el momento del evento (dormir, lanzar la caña, sumar amistad, mirar el cielo).
// Lógica por evento: nada se calcula por cuadro (el resultado se memoiza por objeto de Bruno, que se reemplaza entero cada vez que cambia).
//
// REGLA GENERAL: los efectos valen sólo si Bruno ya fue creado (`creado === true`) y sólo en el Relax. En «La noche de los duendes» y en una partida
// que todavía no pasó por la creación, todo da neutro (0 puntos, factor 1). Así las pruebas viejas y las partidas viejas no cambian.
//
// Unidades: el paso (1 paso = 5 %, ver creador-catalogo.js). Cada sistema:
//   · abrigo   → PUNTOS de abrigo de la ropa (1 punto = 2 pasos). Tope ±1 punto. Ver `abrigoExtra`.
//   · afecto   → % extra (o menos) sobre lo que SUMA cada gesto con un vecino. Ver `ajustarGananciaAmistad`.
//   · pesca    → % menos (o más) de espera del pique.
//   · cuaderno → % más (o menos) de velocidad al anotar mirando (constelaciones y luna).
import { efectosAplicados, afectoConVecino, sanearGenoma } from './creador-personaje.js';
import { PASO_PORCENTAJE } from './creador-catalogo.js';

export const PASOS_POR_PUNTO_DE_ABRIGO = 2;

// ¿Valen los efectos? (Bruno creado y no estamos en el Desafío)
export const efectosVigentes = (bruno, desafio = false) => !desafio && !!bruno && typeof bruno === 'object' && bruno.creado === true;

const NEUTRO = Object.freeze({ vigente: false, abrigo: 0, afecto: 0, pesca: 0, cuaderno: 0 });
let memoBruno = null, memoDesafio = false, memoValor = NEUTRO;
// Los cuatro efectos ya aplicados con tope ({ abrigo en puntos, afecto/pesca/cuaderno en pasos }), memoizados por el objeto de Bruno.
export function efectosDeBruno(bruno, desafio = false) {
  if (bruno === memoBruno && !!desafio === memoDesafio) return memoValor;
  let v = NEUTRO;
  if (efectosVigentes(bruno, desafio)) {
    const a = efectosAplicados(sanearGenoma(bruno));
    v = Object.freeze({ vigente: true, abrigo: Math.trunc(a.abrigo / PASOS_POR_PUNTO_DE_ABRIGO), afecto: a.afecto, pesca: a.pesca, cuaderno: a.cuaderno });
  }
  memoBruno = bruno; memoDesafio = !!desafio; memoValor = v;
  return v;
}

// ---------------------------------------------------------------- 1. abrigo
// Cómo calcula hoy el juego el abrigo (leído de personal-personaje.js y main.js, 4.1 F3): cada prenda puesta suma puntos (poncho 2; gorro, bufanda y guantes 1);
// con 4 o más (ABRIGO_QUE_TEMPLA) la noche de invierno sin fuego mejora UN escalón (frío → fresco → normal). Es un umbral entero, no un porcentaje.
// Por eso el tope del abrigo es en PUNTOS y no en %: ±1 punto (decisión conservadora: ±2 puntos equivaldría a sacarle o regalarle un poncho entero).
// `abrigoExtra` son los puntos que suman o restan los rasgos de Bruno (-1, 0 o +1), que se agregan a los de la ropa.
export const abrigoExtra = (bruno, desafio = false) => efectosDeBruno(bruno, desafio).abrigo;

// ---------------------------------------------------------------- 2. afecto con los vecinos
// El afecto de un vecino son los puntos de amistad de vecindad.js (nunca se muestran; 50 = amigo, 140 = compadre). Los rasgos y los gustos compartidos
// (`afectoConVecino`: pasos de afecto con tope ±4, o sea ±20 %) cambian cuánto SUMA cada gesto bueno con ESE vecino: charlar, regalar, invitar, dar una mano,
// los chistes de la rueda social (el romance de amor.js tiene sus propios puntos y NO se toca). Decisiones conservadoras: (a) sólo se escalan las GANANCIAS (lo que resta una discusión queda igual: no se castiga dos veces);
// (b) el resultado nunca baja de 0 ni convierte una ganancia en pérdida; (c) los puntos son enteros, así que la fracción se reparte con un redondeo
// determinista (sin azar de verdad: mismo vecino, mismo día y mismos puntos dan siempre lo mismo, y en promedio sale justo el porcentaje).
export const porcentajeAfecto = (bruno, vecino, desafio = false) => (efectosVigentes(bruno, desafio) ? afectoConVecino(sanearGenoma(bruno), vecino) * PASO_PORCENTAJE / 100 : 0);

function hashSemilla(t) {
  let h = 2166136261;
  for (const ch of String(t)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
// `n`: lo que sumaría el gesto; `porcentaje`: -0.2 a +0.2; `semilla`: texto que fija el redondeo. Devuelve un entero >= 0 (y 0 si `n` no es una ganancia).
export function ajustarGananciaAmistad(n, porcentaje, semilla = '') {
  const base = Number.isFinite(n) ? n : 0;
  if (base <= 0) return base;
  const p = Number.isFinite(porcentaje) ? Math.max(-0.2, Math.min(0.2, porcentaje)) : 0;
  if (p === 0) return base;
  const x = base * (1 + p), piso = Math.floor(x), frac = x - piso;
  return Math.max(0, piso + ((hashSemilla(semilla) % 1000) / 1000 < frac ? 1 : 0));
}
// Lo que se le entrega a vecindad.js (`fijarModificadorAmistad`): (vecino, n, semilla) → n ajustado, mirando al Bruno de la partida en ese momento.
export const modificadorDeAmistad = (leerBruno, desafio = false) => (vecino, n, semilla) => ajustarGananciaAmistad(n, porcentajeAfecto(leerBruno(), vecino, desafio), `${vecino}|${semilla}`);

// ---------------------------------------------------------------- 3. pesca
// La pesca (pesca.js) sortea al lanzar cuánto tarda el pique (de 5 a 21 segundos, más corto al amanecer y al atardecer, con mosca, con lluvia, con el oficio de
// pescador...) como una cadena de factores. El de Bruno es uno más de esa cadena: 1 - 5 % por paso, o sea 0,8 con +4 pasos (pica un 20 % antes) y 1,2 con -4.
// Decisión conservadora: sólo cambia la ESPERA del pique. No toca el tiempo para clavar, la tensión de la línea ni qué pez sale (eso sería dificultad nueva).
export const factorPiqueBruno = (bruno, desafio = false) => 1 - efectosDeBruno(bruno, desafio).pesca * PASO_PORCENTAJE / 100;

// ---------------------------------------------------------------- 4. cuaderno
// Qué mide hoy el cuaderno de campo: entradas que se anotan de a una. Casi todas se anotan de un golpe (acercarse, mirar, E), sin tiempo que acortar. Las únicas que
// tienen un TIEMPO de observación son las del cielo: mirar una constelación (2,2 s de mirada) o la luna llena, que ya tienen un multiplicador de velocidad
// (el zoom y los «ojos de noche» de la pareja, amor.js). El de Bruno es uno más de esa cadena: 1 + 5 % por paso, o sea 1,2 con +4 pasos (anota un 20 % más rápido)
// y 0,8 con -4. Decisión conservadora: las demás entradas (fauna, plantas, lugares) NO cambian; tocarlas obligaría a cambiar la distancia o el ángulo con que
// se «ve» un animal en fauna.js, vida.js y bichos.js, y eso es dificultad nueva que se decide aparte (queda como pregunta en CAMBIOS_4_1_F3.md).
export const factorCuadernoBruno = (bruno, desafio = false) => 1 + efectosDeBruno(bruno, desafio).cuaderno * PASO_PORCENTAJE / 100;
