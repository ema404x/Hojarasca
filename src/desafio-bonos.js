// 4.10 guardian: los BONOS del jugador en el Desafío (módulo puro: sin THREE ni DOM; se prueba en Node).
//
// Un solo lugar donde se suma todo lo que mejora al jugador, venga de donde venga. Cada bono tiene un ORIGEN
// (quién lo puso) y una CLAVE (qué mejora). El juego lee la suma de todos los orígenes (`bonoDe`) en los pocos
// puntos donde corresponde; quitar un origen (`quitarBonosDeOrigen`) saca sólo lo suyo.
//
//   claves:   saludMax  puntos de salud máxima de más (negativo: menos)
//             correr    fracción de velocidad al correr (0,1 = un 10 % más rápido)
//             recarga   fracción menos de espera entre ataques (0,1 = un 10 % menos de espera)
//             dano      fracción de daño de más en todas las armas (0,1 = un 10 % más)
//             reparar   fracción de reparación de más por golpe o por material (0,25 = un 25 % más rinde)
//             alcance   fracción de alcance de más (de las armas de golpe, de las de tiro y del rayo)
//   orígenes: 'habilidad' (desafio-habilidades.js), 'bestiario', 'ventaja' (las ventajas al empezar), 'trofeo' y
//             'defensa' (la base). Cualquier otro nombre sirve, mientras sea un texto corto.
//
// El estado vive en `D().bonos` = { [origen]: { [clave]: número } }; `sanearBonos` lo deja limpio al abrir la partida
// (una partida vieja no lo tiene: carga sin bonos).

export const BONOS_CLAVES = ['saludMax', 'correr', 'recarga', 'dano', 'reparar', 'alcance'];

// Los topes con los que el juego aplica cada bono (el estado guarda la suma tal cual; el tope se pone al usarlo,
// para que ningún origen pueda romper el juego sumando de más).
export const TOPES_BONO = {
  saludMax: [-60, 150],   // la salud máxima final nunca baja de 40 ni pasa de 250
  correr: [-0.3, 0.35],
  recarga: [-0.3, 0.5],
  dano: [-0.5, 1],
  reparar: [-0.5, 2],
  alcance: [-0.3, 0.5],
};

const MAX_ORIGENES = 16;
const MAX_LARGO_ORIGEN = 24;
const MAX_VALOR = 1000;

const finito = (v) => v !== null && v !== '' && typeof v !== 'boolean' && Number.isFinite(Number(v));
const origenValido = (o) => typeof o === 'string' && o.length > 0 && o.length <= MAX_LARGO_ORIGEN && o !== '__proto__';
const redondear = (n) => Math.round(n * 10000) / 10000;

export function bonosNuevos() { return { origen: {} }; }

// Suma `valor` a la clave de ese origen (acumula: sumar dos veces el mismo bono lo duplica; para reemplazar, primero
// `quitarBonosDeOrigen`). Devuelve true si lo sumó.
export function sumarBono(d, origen, clave, valor) {
  if (!d || typeof d !== 'object' || !origenValido(origen) || !BONOS_CLAVES.includes(clave) || !finito(valor)) return false;
  if (!d.bonos || typeof d.bonos !== 'object' || Array.isArray(d.bonos) || !d.bonos.origen || typeof d.bonos.origen !== 'object') d.bonos = bonosNuevos();
  const o = d.bonos.origen;
  if (!Object.hasOwn(o, origen)) {
    if (Object.keys(o).length >= MAX_ORIGENES) return false;
    o[origen] = {};
  }
  const antes = Object.hasOwn(o[origen], clave) ? o[origen][clave] : 0;
  o[origen][clave] = redondear(Math.max(-MAX_VALOR, Math.min(MAX_VALOR, antes + Number(valor))));
  return true;
}

// Saca todo lo que puso ese origen. Devuelve true si había algo.
export function quitarBonosDeOrigen(d, origen) {
  const o = d?.bonos?.origen;
  if (!o || typeof o !== 'object' || !Object.hasOwn(o, origen)) return false;
  delete o[origen];
  return true;
}

// La suma de todos los orígenes para esa clave (0 si no hay ninguno o la clave no existe).
export function bonoDe(d, clave) {
  const o = d?.bonos?.origen;
  if (!o || typeof o !== 'object' || !BONOS_CLAVES.includes(clave)) return 0;
  let s = 0;
  for (const origen of Object.keys(o)) {
    const b = o[origen];
    if (b && typeof b === 'object' && Object.hasOwn(b, clave) && finito(b[clave])) s += Number(b[clave]);
  }
  return redondear(s);
}
// La suma, con el tope con el que el juego la aplica.
export function bonoAplicado(d, clave) {
  const t = TOPES_BONO[clave];
  if (!t) return 0;
  return Math.max(t[0], Math.min(t[1], bonoDe(d, clave)));
}

// Lo guardado: sólo orígenes válidos con claves conocidas y números finitos.
export function sanearBonos(v) {
  const r = bonosNuevos();
  const o = v && typeof v === 'object' && !Array.isArray(v) && v.origen && typeof v.origen === 'object' && !Array.isArray(v.origen) ? v.origen : null;
  if (!o) return r;
  for (const origen of Object.keys(o)) {
    if (!origenValido(origen) || Object.keys(r.origen).length >= MAX_ORIGENES) continue;
    const b = o[origen];
    if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
    const limpio = {};
    for (const clave of BONOS_CLAVES) if (Object.hasOwn(b, clave) && finito(b[clave])) limpio[clave] = redondear(Math.max(-MAX_VALOR, Math.min(MAX_VALOR, Number(b[clave]))));
    if (Object.keys(limpio).length) r.origen[origen] = limpio;
  }
  return r;
}

// El arma tal como la tiene el jugador con los bonos puestos: más daño, menos espera, más alcance. Devuelve una copia
// (no toca la tabla de armas). Sin bonos devuelve el mismo objeto.
export function armaConBonos(arma, d) {
  if (!arma) return arma;
  const dano = bonoAplicado(d, 'dano'), recarga = bonoAplicado(d, 'recarga'), alcance = bonoAplicado(d, 'alcance');
  if (!dano && !recarga && !alcance) return arma;
  const a = { ...arma };
  if (dano && Number.isFinite(a.dano)) a.dano = redondear(a.dano * (1 + dano));
  if (recarga && Number.isFinite(a.cadencia)) a.cadencia = redondear(Math.max(0.12, a.cadencia * (1 - recarga)));
  if (alcance) {
    if (Number.isFinite(a.alcance)) a.alcance = redondear(a.alcance * (1 + alcance));
    if (Number.isFinite(a.vel)) a.vel = redondear(a.vel * (1 + alcance));
  }
  if (a.cargado && dano) a.cargado = { ...a.cargado, dano: redondear(a.cargado.dano * (1 + dano)) };
  return a;
}
// La salud máxima del jugador (la base más lo que sumen los bonos).
export function saludMaximaConBonos(base, d) {
  return Math.max(40, Math.round(base + bonoAplicado(d, 'saludMax')));
}
