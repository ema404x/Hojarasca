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
export const AO_ULTRA = { radio: 0.9, intensidad: 0.9, fuerza: 0.6, lejos: 70, muestras: 3 };

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

// ------------------------------------------------------------------ 4.29.0 (Ultra, A): agua y cielo
// Las nubes de Ultra andan a `alto` metros: su sombra cae sobre el valle siguiendo al sol (ver ultra-cielo.js), en manchas de unos `escala`
// metros que el viento arrastra a `vel` m/s (más con viento fuerte) en el rumbo `rumbo`. `sombra` es lo más que le quitan al sol directo.
export const NUBES_ULTRA = { alto: 1600, sombra: 0.5, escala: 480, vel: 4, rumbo: [0.92, 0.39] };
// Cuánto oscurecen las sombras de las nubes: de día y con nubes sueltas; con el cielo cubierto o lloviendo no hay manchas (todo está a la
// sombra), con el sol bajo se estiran y se borran, y de noche, nada.
export function sombraDeNubes({ dia = 1, nublado = 0, lluvia = 0, solY = 1 } = {}) {
  const nub = entre(Number(nublado) || 0, 0, 1), ll = entre(Number(lluvia) || 0, 0, 1);
  return NUBES_ULTRA.sombra * suave(0.15, 0.6, Number(dia) || 0) * suave(0.1, 0.35, Number(solY)) * (1 - suave(0.55, 0.92, nub)) * (1 - ll * 0.85);
}
// Cuánto corren las sombras de las nubes (m/s, x y z): despacio, más con viento
export function vientoNubes(viento = 0.4) {
  const v = NUBES_ULTRA.vel * (1 + 1.5 * entre(Number(viento) || 0, 0, 1.25));
  return { x: NUBES_ULTRA.rumbo[0] * v, z: NUBES_ULTRA.rumbo[1] * v };
}

// La humedad del aire de noche (el halo de la luna): con la niebla de los valles, las nubes sueltas y después de la lluvia; con el cielo
// cerrado la luna no se ve.
export function humedadLuna({ horas = 0, nublado = 0, lluvia = 0 } = {}) {
  const n = nieblaDeValle({ horas, lluvia, nublado });
  const nub = entre(Number(nublado) || 0, 0, 1);
  return entre((n.densidad - 0.0012) / 0.006 + nub * 0.8 + entre(Number(lluvia) || 0, 0, 1) * 0.4, 0, 1);
}

// El reflejo del lago (en pantalla, en la composición): hasta dónde se busca y cuántos pasos; `cerca` es a cuántos metros del lago tiene
// que estar la cámara para que se calcule (lejos no hay agua en pantalla y no cuesta nada); lo que está a más de `lejano` metros (los cerros,
// la cordillera, el cielo) se refleja sin buscarlo: se toma en la dirección del reflejo.
export const REFLEJO_LAGO = { pasos: 14, lejos: 280, cerca: 260, medioLado: 210, nivel: 0, lejano: 160 };
export function lagoCerca(cx, cy, cz, lago) {
  if (!(cy > REFLEJO_LAGO.nivel + 0.05)) return false;
  const dx = Math.max(0, Math.abs(cx - lago.x) - REFLEJO_LAGO.medioLado), dz = Math.max(0, Math.abs(cz - lago.z) - REFLEJO_LAGO.medioLado);
  return Math.hypot(dx, dz) < REFLEJO_LAGO.cerca;
}

// Los anillos de tus pasos en el agua: cada pisada en la orilla o en el agua baja (el piso entre `hondo` y `orilla` metros del nivel del
// lago) abre un anillo; uno cada `paso` metros caminados, los últimos `max`, cada uno vive `vida` segundos. `lista` va directo al uniforme
// (x, z, cuándo, fuerza).
export const PISADAS_AGUA = { max: 6, paso: 0.55, vida: 3, orilla: 0.12, hondo: -1.3 };
export function crearPisadasAgua(cfg = PISADAS_AGUA) {
  const lista = Array.from({ length: cfg.max }, () => ({ x: 0, z: 0, t: -99, f: 0 }));
  let ultima = null, siguiente = 0;
  return {
    lista,
    // devuelve true si abrió un anillo
    actualizar(x, z, piso, ahora, lago = null) {
      const enLago = !lago || (Math.abs(x - lago.x) <= REFLEJO_LAGO.medioLado && Math.abs(z - lago.z) <= REFLEJO_LAGO.medioLado);
      const enAgua = enLago && Number.isFinite(piso) && piso < cfg.orilla && piso > cfg.hondo;
      if (!enAgua) { ultima = null; return false; }
      if (ultima && Math.hypot(x - ultima.x, z - ultima.z) < cfg.paso) return false;
      const primera = !ultima;
      ultima = { x, z };
      if (primera) return false;   // pararse en el agua no abre anillos: caminar, sí
      const a = lista[siguiente];
      a.x = x; a.z = z; a.t = ahora; a.f = piso < 0 ? 1 : 0.6;   // en la orilla seca, más chico
      siguiente = (siguiente + 1) % cfg.max;
      return true;
    },
    vivos(ahora) { return lista.filter((a) => ahora - a.t >= 0 && ahora - a.t < cfg.vida).length; },
  };
}

// El relámpago de Ultra: cada destello nuevo cae en otro rumbo del cielo (y su rayo es otro). `v` es la luz del relámpago del juego (0..1+).
export function seguirRelampago(estado, v, azar = Math.random) {
  const luz = Math.max(0, Number(v) || 0);
  const nuevo = luz > 0.3 && !(estado.luz > 0.05);
  if (nuevo) {
    const az = azar() * Math.PI * 2, alto = 0.12 + azar() * 0.22;
    const c = Math.sqrt(1 - alto * alto);
    estado.dir = { x: Math.sin(az) * c, y: alto, z: Math.cos(az) * c };
    estado.semilla = Math.floor(azar() * 1000);
    estado.cuantos = (estado.cuantos || 0) + 1;
  }
  estado.luz = luz;
  if (!estado.dir) estado.dir = { x: 0, y: 0.2, z: 1 };
  return nuevo;
}
