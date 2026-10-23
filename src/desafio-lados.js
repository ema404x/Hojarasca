// 4.8: por dónde entran los duendes cada noche (módulo puro: sin THREE ni DOM; se prueba en Node).
//
// Hasta la 4.7 los duendes salían siempre de un punto a 70-100 m de donde estabas parado, y con código
// de partida siempre del mismo lado del valle (±45°): las noches se sentían iguales. Ahora cada noche
// entran por uno de tres lados de la base: el río, el monte o el camino.
//
//   · Cada base (la del mapa de la partida) tiene su PLAN de lados: para cada uno, hacia dónde queda
//     (un rumbo) y unos puntos de entrada buscados sobre el terreno real (en tierra, planos, con el
//     camino hasta la base sin lago de por medio). Sólo depende del terreno y de la base: no cambia
//     con lo que construyas ni con la noche.
//   · El lado de cada noche sale de la semilla de la partida y del número de noche: mismo código, misma
//     secuencia; nunca el mismo lado más de dos noches seguidas.
//   · El río no queda cerca de todas las bases (muchas están a más de 200 m): ahí «el río» es el rumbo
//     hacia donde corre el agua y la entrada cae sobre la orilla si hay una a menos de 170 m, y si no,
//     en el valle, mirando hacia el río. Una base sin río en 330 m juega con dos lados.
//
// El rumbo es el de siempre del juego: atan2(dx, dz) desde la base hacia el punto.
import { hashTexto, generador } from './semilla.js';

export const LADOS = ['rio', 'monte', 'camino'];
export const NOMBRE_LADO = { rio: 'el río', monte: 'el monte', camino: 'el camino' };
// para decir «del lado del río» / «del lado del monte»
export const LADO_DE = { rio: 'del lado del río', monte: 'del lado del monte', camino: 'del lado del camino' };
export const MAX_SEGUIDAS = 2;                 // nunca el mismo lado más de dos noches seguidas

export const SECTORES = 24;                    // el círculo en tajadas de 15°
export const SEPARACION_LADOS = 1.1;           // rad (~63°): dos lados de una misma base se distinguen
export const ANILLO = { desde: 62, hasta: 104, pasos: 4, hastaRio: 170, buscaRio: 330 };
export const MIN_PUNTOS = 3;                   // un lado necesita al menos tantos puntos buenos
export const MAX_PUNTOS = 12;
const TAU = Math.PI * 2;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const rumboDe = (desde, hacia) => Math.atan2(hacia.x - desde.x, hacia.z - desde.z);
const difAng = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// ---------------------------------------------------------------- el lado de cada noche
// Una pasada por las noches desde la primera: así cada noche depende de las anteriores (para que no se
// repita tres veces) y sigue siendo una función de (semilla, noche, lados disponibles).
export function ladoDeLaNoche(semilla, noche, disponibles = LADOS) {
  const lados = LADOS.filter((l) => disponibles.includes(l));
  if (!lados.length) return null;
  if (lados.length === 1) return lados[0];
  const n = clamp(Math.floor(Number(noche) || 1), 1, 5000);
  const clave = semilla || 'HOJARASCA-DE-SIEMPRE';
  const hechos = [];
  for (let k = 1; k <= n; k++) {
    const azar = generador(hashTexto(`${clave}|lado|${k}`));
    const ult = hechos[hechos.length - 1], ant = hechos[hechos.length - 2];
    // el lado de anoche pesa menos (rara vez se repite) y el de dos noches seguidas queda afuera
    const pesos = lados.map((l) => (ant && ult === ant && l === ult ? 0 : l === ult ? 0.35 : 1));
    const total = pesos.reduce((a, b) => a + b, 0);
    let t = azar() * total, e = lados[0];
    for (let i = 0; i < lados.length; i++) { t -= pesos[i]; if (t <= 0 && pesos[i] > 0) { e = lados[i]; break; } }
    hechos.push(e);
  }
  return hechos[hechos.length - 1];
}
// La secuencia de las primeras `n` noches (para las pruebas y el diagnóstico).
export function secuenciaDeLados(semilla, n, disponibles = LADOS) {
  const s = [];
  for (let k = 1; k <= n; k++) s.push(ladoDeLaNoche(semilla, k, disponibles));
  return s;
}
// El lado con el que algunos distraen mientras los demás entran por el principal: otro lado, elegido por
// la semilla (con dos lados disponibles no hay duda; con uno solo, no hay distracción).
export function ladoDeDistraccion(semilla, noche, principal, disponibles = LADOS) {
  const otros = LADOS.filter((l) => disponibles.includes(l) && l !== principal);
  if (!otros.length) return null;
  const azar = generador(hashTexto(`${semilla || 'HOJARASCA-DE-SIEMPRE'}|distrae|${Math.floor(Number(noche) || 1)}`));
  return otros[Math.min(otros.length - 1, Math.floor(azar() * otros.length))];
}

// ---------------------------------------------------------------- el plan de lados de una base
// `muestra` (lo arma el juego con el terreno, ver `muestraDelTerreno`):
//   · valido(x, z)            en tierra, plano, dentro del valle, fuera de lo que no se pisa
//   · afinidad(lado, x, z)    0..1: cuánto se parece ese punto a «río», «camino» o «monte»
//   · caminable(a, b)         sin lago entre los dos puntos
//   · rioCerca(x, z, maxR)    { x, z, d } del agua más cercana en ese radio, o null
export function planDeLados(base, muestra) {
  const lados = {};
  const ocupados = [];   // los rumbos ya repartidos
  const sectorCentro = (s) => (s + 0.5) * (TAU / SECTORES);
  const puntosDelSector = (s, radios, ancho = 0.5) => {
    const pts = [], c = sectorCentro(s), paso = TAU / SECTORES;
    for (const r of radios) for (let i = -2; i <= 2; i++) {
      const a = c + i * (paso * ancho / 2);
      // (los puntos se redondean a 10 cm antes de revisarlos: lo que se guarda es lo que se revisó)
      const p = { x: Math.round((base.x + Math.sin(a) * r) * 10) / 10, z: Math.round((base.z + Math.cos(a) * r) * 10) / 10, r };
      if (muestra.valido(p.x, p.z) && muestra.caminable(p, base)) pts.push(p);
    }
    return pts;
  };
  const radios = [];
  for (let i = 0; i < ANILLO.pasos; i++) radios.push(ANILLO.desde + (ANILLO.hasta - ANILLO.desde) * (i / (ANILLO.pasos - 1)));
  const radiosLejos = [...radios, 124, 148, ANILLO.hastaRio];
  const desempate = (lado, s) => (hashTexto(`${Math.round(base.x)}|${Math.round(base.z)}|${lado}|${s}`) % 1000) / 1e6;

  for (const lado of ['rio', 'camino', 'monte']) {
    // la puntuación de cada tajada: lo parecido que es a ese lado (mitad promedio, mitad lo mejor)
    const ranking = [];
    for (let s = 0; s < SECTORES; s++) {
      const c = sectorCentro(s);
      if (ocupados.some((o) => difAng(o, c) < SEPARACION_LADOS)) continue;
      const pts = puntosDelSector(s, lado === 'rio' ? radiosLejos : radios);
      if (pts.length < MIN_PUNTOS) continue;
      let suma = 0, mejor = 0;
      for (const p of pts) {
        // el río: más cerca de la base pesa más (no es lo mismo la orilla a 70 m que a 170)
        const f = muestra.afinidad(lado, p.x, p.z) * (lado === 'rio' ? 1 - (p.r - ANILLO.desde) / 220 : 1);
        suma += f; mejor = Math.max(mejor, f);
      }
      ranking.push({ s, puntaje: 0.5 * (suma / pts.length) + 0.5 * mejor + desempate(lado, s), mejor });
    }
    ranking.sort((a, b) => b.puntaje - a.puntaje);
    let elegido = ranking[0] || null;
    // el río: si ninguna tajada tiene orilla a la vista, el rumbo hacia el agua más cercana
    if (lado === 'rio' && (!elegido || elegido.mejor < 0.12)) {
      const agua = muestra.rioCerca(base.x, base.z, ANILLO.buscaRio);
      elegido = null;
      if (agua) {
        const a = ((rumboDe(base, agua) % TAU) + TAU) % TAU, s0 = Math.floor(a / (TAU / SECTORES));
        for (const s of [s0, (s0 + 1) % SECTORES, (s0 + SECTORES - 1) % SECTORES, (s0 + 2) % SECTORES, (s0 + SECTORES - 2) % SECTORES]) {
          if (ocupados.some((o) => difAng(o, sectorCentro(s)) < SEPARACION_LADOS)) continue;
          if (puntosDelSector(s, radios).length >= MIN_PUNTOS) { elegido = { s, puntaje: 0, mejor: 0 }; break; }
        }
      }
    }
    if (!elegido) continue;
    // los puntos de entrada de ese lado: los más parecidos primero, separados entre sí
    const todos = puntosDelSector(elegido.s, lado === 'rio' ? radiosLejos : radios, 0.9);
    todos.sort((a, b) => muestra.afinidad(lado, b.x, b.z) - muestra.afinidad(lado, a.x, a.z) || a.r - b.r);
    const puntos = [];
    for (const p of todos) {
      if (puntos.length >= MAX_PUNTOS) break;
      if (puntos.every((q) => dist(q, p) >= 9)) puntos.push({ x: p.x, z: p.z });
    }
    if (puntos.length < MIN_PUNTOS) continue;
    const rumbo = rumboDe(base, { x: puntos.reduce((a, p) => a + p.x, 0) / puntos.length, z: puntos.reduce((a, p) => a + p.z, 0) / puntos.length });
    lados[lado] = { rumbo, puntos };
    ocupados.push(sectorCentro(elegido.s));
  }
  return { base: { x: base.x, z: base.z }, lados, disponibles: LADOS.filter((l) => lados[l]) };
}

// ---------------------------------------------------------------- el punto de la noche
// Entre los puntos del lado se elige uno por la semilla y la noche; si ahora hay algo encima
// (`libreAhora`: una obra, un lugar), se sigue con el siguiente. Sin ninguno libre, el primero.
export function puntoDeLaNoche(plan, lado, semilla, noche, libreAhora = () => true) {
  const L = plan?.lados?.[lado];
  if (!L?.puntos?.length) return null;
  const azar = generador(hashTexto(`${semilla || 'HOJARASCA-DE-SIEMPRE'}|punto|${lado}|${Math.floor(Number(noche) || 1)}`));
  const n = L.puntos.length, i0 = Math.floor(azar() * n);
  for (let k = 0; k < n; k++) {
    const p = L.puntos[(i0 + k) % n];
    if (libreAhora(p.x, p.z)) return { x: p.x, z: p.z };
  }
  return { x: L.puntos[i0].x, z: L.puntos[i0].z };
}
// Lo que se anota en `D().ladoNoche` (y lo que lee el ambiente: el perro, las huellas...).
export function ladoNocheNuevo(plan, semilla, noche, libreAhora = () => true) {
  const id = ladoDeLaNoche(semilla, noche, plan?.disponibles?.length ? plan.disponibles : LADOS);
  const p = id && puntoDeLaNoche(plan, id, semilla, noche, libreAhora);
  if (!p) return null;
  const secundario = ladoDeDistraccion(semilla, noche, id, plan.disponibles);
  const q = secundario && puntoDeLaNoche(plan, secundario, semilla, noche, libreAhora);
  return {
    id, x: p.x, z: p.z, rumbo: rumboDe(plan.base, p), noche: Math.floor(Number(noche) || 1),
    // el segundo lado, por si esa noche hay distracción (ver desafio-tacticas.js)
    otro: q ? { id: secundario, x: q.x, z: q.z, rumbo: rumboDe(plan.base, q) } : null,
  };
}
// Lo guardado en la partida: sólo un lado que existe, con números en el valle.
export function sanearLadoNoche(v, limite = 468) {
  const num = (n) => n !== null && n !== '' && typeof n !== 'boolean' && Number.isFinite(Number(n));
  const punto = (p) => p && typeof p === 'object' && Object.hasOwn(NOMBRE_LADO, p.id ?? '') && num(p.x) && num(p.z) && Math.abs(Number(p.x)) <= limite && Math.abs(Number(p.z)) <= limite;
  if (!punto(v) || !num(v.noche)) return null;
  const r = { id: v.id, x: Number(v.x), z: Number(v.z), rumbo: num(v.rumbo) ? Number(v.rumbo) : 0, noche: Math.floor(Number(v.noche)), otro: null };
  if (punto(v.otro) && v.otro.id !== v.id) r.otro = { id: v.otro.id, x: Number(v.otro.x), z: Number(v.otro.z), rumbo: num(v.otro.rumbo) ? Number(v.otro.rumbo) : 0 };
  if (v.anulado === true) r.anulado = true;
  return r;
}

// ---------------------------------------------------------------- la muestra del terreno real
// `T` es lo que devuelve `armarTerreno` (las grillas y las consultas). `lugares` son los puntos del valle
// que no se pisan (casas, el muelle): se deja un margen. `libre` es una función extra (las obras).
export function muestraDelTerreno(T, { limite = 468, pendienteMax = 0.32, lugares = [], margenLugar = 22 } = {}) {
  const k = (x, z) => T.indice(x, z);
  const orilla = (x, z) => { const i = k(x, z); return T.distRio[i] - T.anchoRio[i]; };   // < 0: adentro del cauce
  const valido = (x, z) => {
    if (Math.abs(x) > limite - 25 || Math.abs(z) > limite - 25) return false;
    if (T.agua(x, z)) return false;
    if ((T.pendiente?.[k(x, z)] ?? 0) > pendienteMax) return false;
    for (const l of lugares) if (Math.hypot(l.x - x, l.z - z) < margenLugar) return false;
    return true;
  };
  return {
    valido,
    afinidad(lado, x, z) {
      const i = k(x, z);
      if (lado === 'rio') { const o = orilla(x, z); return o < 0 ? 0 : clamp(1 - o / 60, 0, 1); }
      if (lado === 'camino') return orilla(x, z) > 6 ? clamp(1 - T.distSendero[i] / 14, 0, 1) : 0;
      // el monte: bosque cerrado, lejos del camino y del agua
      return orilla(x, z) > 10 && T.distSendero[i] > 8 ? clamp((T.bosque[i] - 0.3) / 0.7, 0, 1) : 0;
    },
    caminable(a, b) {
      const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / 6));
      for (let s = 1; s < n; s++) {
        const x = a.x + (b.x - a.x) * s / n, z = a.z + (b.z - a.z) * s / n;
        const w = T.agua(x, z);
        if (w && w.lago) return false;
      }
      return true;
    },
    rioCerca(x, z, maxR) {
      let mejor = null;
      for (let r = 30; r <= maxR; r += 6) for (let s = 0; s < 90; s++) {
        const a = (s / 90) * TAU, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
        if (Math.abs(px) > limite || Math.abs(pz) > limite) continue;
        const i = k(px, pz);
        if (T.distRio[i] < 999 && (!mejor || r < mejor.d)) mejor = { x: px, z: pz, d: r };
      }
      return mejor;
    },
  };
}
