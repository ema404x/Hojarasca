// 4.28.0 (Ultra, A): reglas puras de la luz y el cielo del nivel Ultra (sin three ni DOM). Lo visual está en ultra-luz-mundo.js.
// Nada de esto corre con Ultra apagado: el juego pregunta `ultraPedido(ajustes, calidadActiva, hayPost)` y sólo con eso arma lo de Ultra.
import { esUltra } from './ultra.js';

const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const entre = (x, a, b) => Math.min(b, Math.max(a, x));

// ¿Corre Ultra? El ajuste (sólo con la calidad en Alta, ver ultra.js), la calidad con la que está armado el mundo (elegir Alta en el menú
// con el mundo en Media no lo prende hasta volver a cargar) y el postproceso (Ultra dibuja sobre él).
export function ultraPedido(ajustes, calidadActiva, hayPost) {
  return esUltra(ajustes) && calidadActiva === 'alta' && !!hayPost;
}

// El mapa de sombras de Ultra: el doble de grande que el de Alta (2048) y una caja apenas mayor (Alta: ±110 m), así cerca tuyo el téxel
// mide 6 cm en vez de 11 y la sombra llega 15 m más lejos; el borde suave (PCF con radio, en téxeles) se ensancha para que la penumbra
// mida lo mismo en metros que en Alta y no se vea el serrucho del mapa.
export const SOMBRA_ULTRA = { mapa: 4096, caja: 125, radio: 4.2 };

// La niebla volumétrica: hasta dónde se marcha el rayo (después, de un tirón), cuánto pesan la luz del aire (el color de la niebla de la escena),
// la del sol o la luna y la de las luces cercanas, y los bancos de niebla sobre el lago al amanecer (densidad por metro sobre el agua).
export const NIEBLA_VOLUMEN = { largo: 160, ambiente: 0.85, sol: 0.2, luces: 0.35, lago: 0.05 };

// La oclusión ambiental de pantalla (a media resolución): radio en metros, fuerza y hasta dónde llega (de lejos se apaga).
export const AO_ULTRA = { radio: 0.9, intensidad: 0.9, fuerza: 0.6, lejos: 70, muestras: 6 };

// La niebla de altura de los valles: se junta abajo (cerca del nivel del lago) y se adelgaza hacia arriba. Más espesa a la mañana
// (de las 5 a las 10) y con lluvia; algo de noche; casi nada a la siesta. `densidad` es por metro a la altura `base`; `alto` es cuánto
// sube (metros para que la densidad caiga a un tercio); `max` es lo más que tapa.
export function nieblaDeValle({ horas = 12, lluvia = 0, nublado = 0 } = {}) {
  const h = ((Number(horas) % 24) + 24) % 24;
  const manana = suave(4.5, 6.5, h) * (1 - suave(9, 11.5, h));
  const noche = 1 - suave(5, 7.5, h) + suave(20.5, 22.5, h);
  const ll = entre(Number(lluvia) || 0, 0, 1), nub = entre(Number(nublado) || 0, 0, 1);
  return {
    densidad: 0.0012 + manana * 0.005 + ll * 0.008 + nub * 0.0015 + entre(noche, 0, 1) * 0.002,
    // el polvo y la humedad del aire entre los árboles (lo que hace visibles los rayos de sol) y cuánto más espesa es la niebla en el bosque
    polvo: 0.004 + manana * 0.004 + ll * 0.002,
    bosque: 1.2 + manana,
    alto: 13 + manana * 5 + ll * 26,
    base: -2,
    max: 0.62 + ll * 0.2,
    manana,
  };
}

// Cuánto del cielo con dispersión entra (el resto es el pintado de siempre): de día y en el crepúsculo, menos con el cielo cubierto
// (las nubes de la lluvia son pintadas) y nada de noche cerrada (las estrellas, la luna y la noche azul quedan como están).
export function mezclaCielo(solY, nublado = 0) {
  return 0.9 * suave(-0.2, -0.04, solY) * (1 - 0.75 * entre(nublado, 0, 1));
}

// El mismo cielo con dispersión del shader (ultra-luz-mundo.js), en la CPU: para las pruebas y para mirar valores sin abrir el juego.
// `d` y `s` son direcciones unitarias {x, y, z} (la vista y el sol). Devuelve [r, g, b] lineales.
const TR = [0.0465 * 1.35, 0.108 * 1.35, 0.265 * 1.35], TM = 0.021, TO = [0.03, 0.09, 0.0039];
const masaAire = (c) => { c = Math.max(c, 0); const z = Math.acos(Math.min(1, c)) * 180 / Math.PI; return 1 / (c + 0.15 * Math.pow(Math.max(93.885 - z, 0.01), -1.253)); };
export function cieloFisico(d, s) {
  const mu = d.x * s.x + d.y * s.y + d.z * s.z;
  const mV = masaAire(d.y + 0.02), mS = masaAire(s.y + 0.035 + 0.2 * Math.sqrt(Math.max(d.y, 0))) * 0.9;
  const pR = 0.0597 * (1 + mu * mu), g = 0.76;
  const pM = (1 - g * g) / (12.566 * Math.pow(1 + g * g - 2 * g * mu, 1.5));
  const E = 10 * suave(-0.16, 0.02, s.y);
  const c = [0, 1, 2].map((i) => {
    const tau = TR[i] + TM + TO[i], trans = Math.exp(-(TR[i] + TM) * mV);
    return (TR[i] * pR + TM * pM * 0.35) / (TR[i] + TM) * (1 - trans) * Math.exp(-tau * mS) * E
      + TR[i] / (TR[i] + TM) * (1 - trans) * Math.exp(-tau * 3) * E * 0.03;
  });
  const lu = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  return c.map((v) => Math.max(0, lu + (v - lu) * 1.6));
}
