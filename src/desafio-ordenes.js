// Órdenes a los compañeros del Desafío. Hasta la 1.10 Don Ramón y Josefina hacían siempre
// lo mismo: él emparchaba lo más roto de la base, ella tiraba flechas desde el centro.
// Ahora, mirándolos y con E, les cambiás la orden:
//
//   Don Ramón — arreglá lo roto (en la base) · vení conmigo · cuidá el portón
//   Josefina       — quedate en la base · vení conmigo · cuidá el portón
//
// Con "vení conmigo" te siguen (Ramón arregla lo que se rompa cerca tuyo; Josefina tira
// desde donde esté). Con "cuidá el portón" se paran adentro del portón más cercano a la
// base (Ramón arregla lo que haya ahí). Si no hay portón, se quedan en la base.
//
// Módulo puro (se prueba en Node). La orden se guarda en el Desafío.

export const ORDENES = {
  ramon: ['reparar', 'seguime', 'porton'],
  ema: ['base', 'seguime', 'porton'],
};
export const NOMBRE_ORDEN = {
  reparar: 'Arreglá lo que esté roto', base: 'Quedate en la base', seguime: 'Vení conmigo', porton: 'Cuidá el portón',
  puesto: 'Quedate acá, en tu puesto',   // 4.9 aliados
};
// Lo que contestan.
export const RESPUESTAS = {
  ramon: { reparar: 'Dejá, que yo voy emparchando.', seguime: 'Vamos. Si algo se rompe en el camino, lo arreglo.', porton: 'Me planto en el portón. Por ahí no pasan.' },
  ema: { base: 'Me quedo acá, que desde el medio veo todo.', seguime: 'Voy detrás tuyo. Vos marcá el paso.', porton: 'Cubro el portón. Que se asomen.' },
};
// Hasta dónde buscan algo para arreglar alrededor de donde les toca estar.
export const RADIO_ARREGLO = { reparar: 18, seguime: 8, porton: 8, base: 0, puesto: 10 };

// 4.9 aliados: LA ORDEN «PUESTO». El jugador elige dónde se para cada vecino: lo trae con «Vení conmigo», camina hasta el lugar,
// y con E la orden siguiente es «Quedate acá, en tu puesto»: el puesto es el lugar donde el vecino está en ese momento (se guarda
// en la partida, en `puestosAliados`). Sin puesto marcado se para en el que le toca por su oficio (ver `puestoPorDefecto` en
// desafio-vecinos.js). La orden va justo después de «Vení conmigo» (así se marca sin que el vecino se vaya al portón primero).
// ORDENES queda como estaba (la prueba de idioma de la 1.11 recorre esa tabla); la lista que se usa de verdad es `listaDe`.
export const PUESTO = 'puesto';
export const ORDENES_VECINOS = {
  anselmo: ['puesto', 'seguime'], herminia: ['puesto', 'seguime'], nene: ['puesto', 'seguime'], nena: ['puesto', 'seguime'],
};
export const RESPUESTAS_PUESTO = {
  ramon: 'Acá me quedo. Lo que se rompa en este rincón, lo arreglo yo.',
  ema: 'Desde acá se ve todo. Que vengan.',
  anselmo: 'Este es mi lugar. Con el martillo en la mano, de acá no me muevo.',
  herminia: 'Acá me siento a esperar, que el fuego ya está prendido.',
  nene: '¡Este es mi puesto! Las piedras me las tiro desde acá.',
  nena: 'Me quedo en mi puesto. Detrás de la empalizada no me pasa nada.',
};
export const RESPUESTAS_VECINOS = {
  anselmo: { puesto: RESPUESTAS_PUESTO.anselmo, seguime: 'Voy con vos, con el martillo a mano.' },
  herminia: { puesto: RESPUESTAS_PUESTO.herminia, seguime: 'Despacito, hijo, que ya no tengo las piernas de antes.' },
  nene: { puesto: RESPUESTAS_PUESTO.nene, seguime: '¡Voy, voy! Con la honda lista.' },
  nena: { puesto: RESPUESTAS_PUESTO.nena, seguime: 'Te sigo. Mirá que no me alejo de la empalizada.' },
};
// Los que se pueden parar en un puesto (los dos de siempre y los de la aldea que ayudan en las noches grandes).
export const CON_PUESTO = ['ramon', 'ema', 'anselmo', 'herminia', 'nene', 'nena'];

// La lista de órdenes de cada uno, con «puesto» después de «seguime» en los dos de siempre.
export function listaDe(clave) {
  const l = Object.hasOwn(ORDENES, clave) ? ORDENES[clave] : null;
  if (l) { const i = l.indexOf('seguime'); return i < 0 ? [...l, PUESTO] : [...l.slice(0, i + 1), PUESTO, ...l.slice(i + 1)]; }
  return Object.hasOwn(ORDENES_VECINOS, clave) ? ORDENES_VECINOS[clave] : null;
}
export const respuestaDe = (clave, orden) => (orden === PUESTO && Object.hasOwn(RESPUESTAS_PUESTO, clave) ? RESPUESTAS_PUESTO[clave]
  : (Object.hasOwn(RESPUESTAS, clave) && RESPUESTAS[clave][orden]) || (Object.hasOwn(RESPUESTAS_VECINOS, clave) && RESPUESTAS_VECINOS[clave][orden]) || '');

export const ordenInicial = (clave) => listaDe(clave)?.[0] || null;
export function ordenDe(ordenes, clave) {
  const o = ordenes?.[clave];
  return listaDe(clave)?.includes(o) ? o : ordenInicial(clave);
}
export function siguienteOrden(clave, actual) {
  const l = listaDe(clave);
  if (!l) return null;
  const i = l.indexOf(actual);
  return l[(i + 1) % l.length];
}
export function sanearOrdenes(v) {
  const r = {};
  for (const clave of CON_PUESTO) {
    const o = v && typeof v === 'object' && !Array.isArray(v) && Object.hasOwn(v, clave) ? v[clave] : null;
    if (listaDe(clave)?.includes(o)) r[clave] = o;
  }
  return r;
}
// 4.9 aliados: los puestos marcados (clave -> { x, z }) van en la partida. Una partida vieja no los tiene (queda vacío); lo que no
// es de un aliado, o no tiene coordenadas, o cae a más de `PUESTO_MAX` m del origen del mapa, se descarta.
export const PUESTO_LIMITE = 468;
export function sanearPuestosAliados(v) {
  const r = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return r;
  for (const clave of CON_PUESTO) {
    if (!Object.hasOwn(v, clave)) continue;
    const p = v[clave];
    const num = (n) => n !== null && n !== '' && typeof n !== 'boolean' && Number.isFinite(Number(n));
    if (p && typeof p === 'object' && num(p.x) && num(p.z) && Math.abs(Number(p.x)) <= PUESTO_LIMITE && Math.abs(Number(p.z)) <= PUESTO_LIMITE) r[clave] = { x: Number(p.x), z: Number(p.z) };
  }
  return r;
}
// ¿Esta orden nueva marca el puesto? Sí si viene de «Vení conmigo»: el puesto es donde el vecino está parado.
export const marcaPuesto = (anterior, nueva) => nueva === PUESTO && anterior === 'seguime';

// Dónde se para. `ctx`: { base, porton (o null), jugador: { pos, yaw }, puntoBase, i }.
// Siguiendo, van un poco atrás tuyo, cada uno de un lado.
export function puntoDeOrden(orden, ctx) {
  if (orden === 'seguime') {
    const { pos, yaw } = ctx.jugador;
    const lado = ctx.i === 0 ? 1.6 : -1.6, atras = 2.6;
    // adelante es (-sin, -cos): atrás es (sin, cos); el costado, (cos, -sin)
    return { x: pos.x + Math.sin(yaw) * atras + Math.cos(yaw) * lado, z: pos.z + Math.cos(yaw) * atras - Math.sin(yaw) * lado };
  }
  if (orden === PUESTO && ctx.puesto) return ctx.puesto;   // 4.9 aliados
  if (orden === 'porton' && ctx.porton) {
    // del lado de adentro: un par de metros desde el portón hacia la base
    const dx = ctx.base.x - ctx.porton.x, dz = ctx.base.z - ctx.porton.z, d = Math.hypot(dx, dz) || 1;
    const lado = ctx.i === 0 ? 0.9 : -0.9;
    return { x: ctx.porton.x + (dx / d) * 2.2 + (-dz / d) * lado, z: ctx.porton.z + (dz / d) * 2.2 + (dx / d) * lado };
  }
  return ctx.puntoBase;
}
// Alrededor de dónde buscan qué arreglar.
export function centroDeArreglo(orden, ctx) {
  if (orden === 'seguime') return ctx.jugador.pos;
  if (orden === PUESTO && ctx.puesto) return ctx.puesto;   // 4.9 aliados
  if (orden === 'porton' && ctx.porton) return ctx.porton;
  return ctx.base;
}

// El portón más cercano a la base, de una lista de { x, z }.
export function portonDeLaBase(portones, base) {
  let mejor = null, d0 = Infinity;
  for (const p of portones || []) {
    const d = Math.hypot(p.x - base.x, p.z - base.z);
    if (d < d0) { d0 = d; mejor = p; }
  }
  return mejor;
}

// Siguiendo, caminan más rápido si quedaron lejos; si te fuiste muy lejos, te alcanzan.
export function velocidadSiguiendo(d) { return d > 10 ? 5.2 : d > 4 ? 3.2 : 1.35; }
export const LEJOS_ALCANZA = 45;
