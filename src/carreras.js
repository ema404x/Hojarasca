// 3.1: las carreras contrarreloj. Circuitos marcados sobre el terreno de verdad: un poste
// de largada (E para largar), puertas con banderas en tierra o boyas en el lago, y la
// llegada otra vez en el poste. Cuenta regresiva, reloj, parciales en cada puerta y el
// mejor tiempo de cada circuito, con un fantasma: el recorrido de tu mejor vuelta, que
// corre al lado tuyo la próxima vez.
//
// Puro (sin three ni DOM): las reglas se prueban en Node y los circuitos se validan contra
// el terreno real en `pruebas/verificar-3-1-carreras.mjs` (puertas alcanzables, en tierra
// firme las de tierra y en agua honda las del lago). El dibujo está en carreras-mundo.js.

// Cómo se corre cada circuito: el radio de la puerta (qué tan cerca hay que pasar) y del
// poste de largada, en metros.
export const MEDIOS = {
  pie: { nombre: 'a pie', radio: 5, poste: 4.5 },
  caballo: { nombre: 'a caballo', radio: 7, poste: 6 },
  kayak: { nombre: 'en kayak', radio: 8, poste: 7 },
  vela: { nombre: 'a vela', radio: 11, poste: 9 },
};

export const CARRERA = {
  cuenta: 3,            // segundos de cuenta regresiva
  salidaEnFalso: 9,     // metros que se puede alejar del poste durante la cuenta
  largoMax: 5,          // veces el tiempo de referencia: más que eso, la carrera se abandona
  pasoFantasma: 0.5,    // segundos entre puntos del fantasma
  puntosFantasma: 900,  // tope de puntos guardados (se ralea si la vuelta es más larga)
  puntosMax: 1600,      // techo de puntos de una carrera
};

// Los circuitos. `ref`: segundos de referencia (una vuelta limpia, sin apuro de más). Las
// coordenadas se eligieron con el mapa del valle y se validan en la prueba: la estepa del
// este es campo abierto (el zaino galopa sin árboles en el camino), el lago tiene fondo en
// todo el recorrido y las carreras a pie van por lomas peladas.
export const CIRCUITOS = [
  {
    id: 'estepa', nombre: 'La vuelta de la estepa', medio: 'caballo', ref: 78,
    texto: 'Campo abierto al este del valle: cuatro puertas y el viento en la cara.',
    salida: { x: 300, z: -60 }, puertas: [{ x: 400, z: -110 }, { x: 410, z: -250 }, { x: 300, z: -320 }, { x: 270, z: -190 }],
  },
  {
    id: 'pampa', nombre: 'La pampa del sur', medio: 'caballo', ref: 76,
    texto: 'Del galpón para el sur, por la pampa de coirón hasta el alambrado.',
    salida: { x: 395, z: 150 }, puertas: [{ x: 425, z: 260 }, { x: 410, z: 400 }, { x: 320, z: 420 }, { x: 330, z: 320 }],
  },
  {
    id: 'mirador', nombre: 'El cross del mirador', medio: 'pie', ref: 62,
    texto: 'Loma abajo desde el Mirador del Pehuén y de vuelta para arriba.',
    salida: { x: -262, z: 50 }, puertas: [{ x: -200, z: 80 }, { x: -140, z: 40 }, { x: -190, z: -10 }],
  },
  {
    id: 'faro', nombre: 'La loma del faro', medio: 'pie', ref: 55,
    texto: 'Detrás del faro, por el pastizal que baja al lago.',
    salida: { x: 195, z: -45 }, puertas: [{ x: 220, z: -100 }, { x: 290, z: -70 }, { x: 270, z: -20 }],
  },
  {
    id: 'lago', nombre: 'La vuelta del lago', medio: 'kayak', ref: 190,
    texto: 'Desde el muelle, cinco boyas alrededor del lago.',
    salida: { x: 75, z: 150 }, puertas: [{ x: 110, z: 40 }, { x: 200, z: 40 }, { x: 228, z: 120 }, { x: 190, z: 190 }, { x: 120, z: 212 }],
  },
  {
    id: 'regata', nombre: 'La regata del faro', medio: 'vela', ref: 150,
    texto: 'Un triángulo en el medio del lago: hay que bordear contra el viento.',
    salida: { x: 90, z: 120 }, puertas: [{ x: 210, z: 55 }, { x: 190, z: 175 }],
  },
];
export const CIRCUITO = Object.fromEntries(CIRCUITOS.map((c) => [c.id, c]));
export const circuitoDe = (id) => (typeof id === 'string' && Object.hasOwn(CIRCUITO, id) ? CIRCUITO[id] : null);

// Las vueltas "con algo distinto" (las usa el desafío del día): al revés, o dos vueltas.
export const GIROS = {
  invertido: { nombre: 'al revés', sufijo: '~inv' },
  doble: { nombre: 'dos vueltas', sufijo: '~x2' },
};
export const giroValido = (g) => (typeof g === 'string' && Object.hasOwn(GIROS, g) ? g : null);

// Los puntos por pasar, en orden: las puertas y, al final, el poste (la llegada).
export function recorridoDe(circuito, giro = null) {
  const c = typeof circuito === 'string' ? circuitoDe(circuito) : circuito;
  if (!c) return [];
  const puertas = c.puertas.map((p) => ({ x: p.x, z: p.z }));
  const llegada = { x: c.salida.x, z: c.salida.z, meta: true };
  if (giroValido(giro) === 'invertido') return [...puertas.reverse(), llegada];
  if (giroValido(giro) === 'doble') return [...puertas, { ...llegada, meta: false }, ...puertas.map((p) => ({ ...p })), llegada];
  return [...puertas, llegada];
}
export function largoDe(circuito, giro = null) {
  const c = typeof circuito === 'string' ? circuitoDe(circuito) : circuito;
  if (!c) return 0;
  let prev = c.salida, total = 0;
  for (const p of recorridoDe(c, giro)) { total += Math.hypot(p.x - prev.x, p.z - prev.z); prev = p; }
  return total;
}
// El tiempo de referencia con el giro (dos vueltas: el doble)
export function refDe(circuito, giro = null) {
  const c = typeof circuito === 'string' ? circuitoDe(circuito) : circuito;
  if (!c) return 60;
  return c.ref * (giroValido(giro) === 'doble' ? 2 : 1);
}
export function claveRecord(id, giro = null) {
  const g = giroValido(giro);
  return g ? id + GIROS[g].sufijo : id;
}
// Qué se está usando ahora, a partir del estado del jugador (jugador.js)
export function medioDe(js) {
  if (!js) return 'otro';
  if (js.montado) return 'caballo';
  if (js.enVela) return 'vela';
  if (js.enKayak) return 'kayak';
  if (js.enTren || js.enCable) return 'otro';
  return 'pie';
}

// Distancia de un punto al segmento a→b (para no saltearse una puerta a galope con pocos cuadros)
function distSegmento(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

export function carreraNueva(circuito, giro = null) {
  const c = typeof circuito === 'string' ? circuitoDe(circuito) : circuito;
  if (!c) return null;
  return {
    id: c.id, giro: giroValido(giro), medio: c.medio, fase: 'cuenta', cuenta: CARRERA.cuenta, t: 0,
    puntos: recorridoDe(c, giro), sig: 0, parciales: [], ultimo: null,
    rastro: [], paso: CARRERA.pasoFantasma, acumulado: 0,
  };
}

// Avanza la carrera. `pos`: {x, z} del jugador; `medio`: medioDe(js). Devuelve lo que pasó
// en este paso (o null): largada, puerta, meta o abandono.
export function pasoCarrera(c, dt, pos, medio) {
  if (!c || c.fase === 'fin') return null;
  const circuito = circuitoDe(c.id);
  if (!circuito) { c.fase = 'fin'; return { tipo: 'abandono', motivo: 'Ese circuito ya no existe' }; }
  const x = Number(pos?.x), z = Number(pos?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  dt = Math.max(0, Math.min(0.25, Number(dt) || 0));
  if (medio !== c.medio) { c.fase = 'fin'; return { tipo: 'abandono', motivo: `La carrera es ${MEDIOS[c.medio].nombre}` }; }
  if (c.fase === 'cuenta') {
    if (Math.hypot(x - circuito.salida.x, z - circuito.salida.z) > MEDIOS[c.medio].poste + CARRERA.salidaEnFalso) {
      c.fase = 'fin';
      return { tipo: 'abandono', motivo: 'Largaste antes de tiempo' };
    }
    const antes = Math.ceil(c.cuenta);
    c.cuenta -= dt;
    if (c.cuenta > 0) return Math.ceil(c.cuenta) !== antes ? { tipo: 'cuenta', n: Math.ceil(c.cuenta) } : null;
    c.fase = 'corriendo'; c.t = 0; c.ultimo = { x, z };
    c.rastro.push(Math.round(x * 10), Math.round(z * 10));
    return { tipo: 'largada' };
  }
  c.t += dt;
  if (c.t > refDe(circuito, c.giro) * CARRERA.largoMax) { c.fase = 'fin'; return { tipo: 'abandono', motivo: 'Se hizo demasiado larga' }; }
  // el rastro para el fantasma
  c.acumulado += dt;
  while (c.acumulado >= c.paso) {
    c.acumulado -= c.paso;
    c.rastro.push(Math.round(x * 10), Math.round(z * 10));
    if (c.rastro.length / 2 > CARRERA.puntosFantasma) { c.rastro = ralear(c.rastro); c.paso *= 2; }
  }
  const p = c.puntos[c.sig];
  const u = c.ultimo || { x, z };
  const pasa = distSegmento(p.x, p.z, u.x, u.z, x, z) <= MEDIOS[c.medio].radio;
  c.ultimo = { x, z };
  if (!pasa) return null;
  const ms = Math.round(c.t * 1000);
  c.parciales.push(ms);
  c.sig++;
  if (c.sig >= c.puntos.length) {
    c.fase = 'fin';
    return { tipo: 'meta', ms, parciales: c.parciales.slice(0, -1) };
  }
  return { tipo: 'puerta', i: c.sig - 1, ms, quedan: c.puntos.length - c.sig };
}
function ralear(pts) {
  const r = [];
  for (let i = 0; i < pts.length; i += 4) r.push(pts[i], pts[i + 1]);
  return r;
}

// ---------------------------------------------------------------- los récords (en la partida)
const DIA = /^\d{4}-\d{2}-\d{2}$/;
const entero = (v, min, max) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null; };
const MS_MIN = 5000, MS_MAX = 3600000;
const clavesValidas = () => {
  const s = new Set();
  for (const c of CIRCUITOS) { s.add(c.id); for (const g of Object.keys(GIROS)) s.add(claveRecord(c.id, g)); }
  return s;
};
export function carrerasNuevo() { return { mejores: {}, corridas: 0 }; }
function sanearFantasma(f) {
  if (!f || typeof f !== 'object' || Array.isArray(f) || !Array.isArray(f.pts)) return null;
  const paso = Number(f.paso);
  if (!Number.isFinite(paso) || paso < 0.1 || paso > 30) return null;
  const pts = f.pts.slice(0, CARRERA.puntosFantasma * 2 + 2).map((n) => entero(n, -6000, 6000));
  if (pts.length < 4 || pts.length % 2 || pts.some((n) => n === null)) return null;
  return { paso, pts };
}
export function sanearCarreras(v) {
  const base = carrerasNuevo();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return base;
  base.corridas = entero(v.corridas, 0, 1e6) ?? 0;
  const validas = clavesValidas();
  const m = v.mejores && typeof v.mejores === 'object' && !Array.isArray(v.mejores) ? v.mejores : {};
  for (const k of Object.keys(m)) {
    if (!validas.has(k) || !Object.hasOwn(m, k)) continue;
    const r = m[k];
    if (!r || typeof r !== 'object') continue;
    const ms = entero(r.ms, 0, MS_MAX);
    if (ms === null || ms < MS_MIN) continue;
    const parciales = (Array.isArray(r.parciales) ? r.parciales : []).slice(0, 24).map((n) => entero(n, 0, MS_MAX)).filter((n) => n !== null);
    const limpio = { ms, parciales, fecha: typeof r.fecha === 'string' && DIA.test(r.fecha) ? r.fecha : '' };
    const f = sanearFantasma(r.fantasma);
    if (f) limpio.fantasma = f;
    base.mejores[k] = limpio;
  }
  return base;
}
// Anota una vuelta terminada. Devuelve { mejoro, antes } (antes: el récord anterior o null).
export function registrarTiempo(carreras, clave, { ms, parciales = [], fecha = '', rastro = null, paso = CARRERA.pasoFantasma } = {}) {
  if (!carreras || typeof carreras !== 'object') return { mejoro: false, antes: null };
  if (!carreras.mejores || typeof carreras.mejores !== 'object') carreras.mejores = {};
  carreras.corridas = (Number(carreras.corridas) || 0) + 1;
  const t = entero(ms, 0, MS_MAX);
  const antes = Object.hasOwn(carreras.mejores, clave) ? carreras.mejores[clave] : null;
  if (t === null || t < MS_MIN) return { mejoro: false, antes };
  if (antes && antes.ms <= t) return { mejoro: false, antes };
  const nuevo = { ms: t, parciales: parciales.slice(0, 24), fecha: DIA.test(fecha) ? fecha : '' };
  // el fantasma sólo para las vueltas normales: las del desafío del día no lo necesitan
  const f = !clave.includes('~') ? sanearFantasma({ paso, pts: rastro }) : null;
  if (f) nuevo.fantasma = f;
  carreras.mejores[clave] = nuevo;
  return { mejoro: true, antes };
}
// Dónde va el fantasma a los `t` segundos de la largada (null si ya llegó)
export function posFantasma(f, t) {
  if (!f || !Array.isArray(f.pts) || f.pts.length < 4) return null;
  const n = f.pts.length / 2;
  const k = Math.max(0, t) / f.paso;
  const i = Math.floor(k);
  if (i >= n - 1) return null;
  const a = k - i;
  return {
    x: (f.pts[i * 2] + (f.pts[i * 2 + 2] - f.pts[i * 2]) * a) / 10,
    z: (f.pts[i * 2 + 1] + (f.pts[i * 2 + 3] - f.pts[i * 2 + 1]) * a) / 10,
  };
}

export function formatoTiempo(ms) {
  const t = Math.max(0, Math.round(Number(ms) || 0));
  const m = Math.floor(t / 60000), s = Math.floor((t % 60000) / 1000), d = Math.floor((t % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${d}`;
}
export function diferenciaTexto(ms) {
  const n = Math.round(Number(ms) || 0);
  return `${n <= 0 ? '−' : '+'}${formatoTiempo(Math.abs(n))}`;
}
// Los puntos de una vuelta: 1000 en el tiempo de referencia, más si fue más rápida.
export function puntosCarrera(ms, ref) {
  const t = Number(ms), r = Number(ref);
  if (!(t > 0) || !(r > 0)) return 0;
  return Math.max(0, Math.min(CARRERA.puntosMax, Math.round(1000 * r * 1000 / t)));
}
