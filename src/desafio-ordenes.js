// Órdenes a los compañeros del Desafío. Hasta la 1.10 Don Ramón y Ema hacían siempre
// lo mismo: él emparchaba lo más roto de la base, ella tiraba flechas desde el centro.
// Ahora, mirándolos y con E, les cambiás la orden:
//
//   Don Ramón — arreglá lo roto (en la base) · vení conmigo · cuidá el portón
//   Ema       — quedate en la base · vení conmigo · cuidá el portón
//
// Con "vení conmigo" te siguen (Ramón arregla lo que se rompa cerca tuyo; Ema tira
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
};
// Lo que contestan.
export const RESPUESTAS = {
  ramon: { reparar: 'Dejá, que yo voy emparchando.', seguime: 'Vamos. Si algo se rompe en el camino, lo arreglo.', porton: 'Me planto en el portón. Por ahí no pasan.' },
  ema: { base: 'Me quedo acá, que desde el medio veo todo.', seguime: 'Voy detrás tuyo. Vos marcá el paso.', porton: 'Cubro el portón. Que se asomen.' },
};
// Hasta dónde buscan algo para arreglar alrededor de donde les toca estar.
export const RADIO_ARREGLO = { reparar: 18, seguime: 8, porton: 8, base: 0 };

export const ordenInicial = (clave) => ORDENES[clave]?.[0] || null;
export function ordenDe(ordenes, clave) {
  const o = ordenes?.[clave];
  return ORDENES[clave]?.includes(o) ? o : ordenInicial(clave);
}
export function siguienteOrden(clave, actual) {
  const l = ORDENES[clave];
  if (!l) return null;
  const i = l.indexOf(actual);
  return l[(i + 1) % l.length];
}
export function sanearOrdenes(v) {
  const r = {};
  for (const clave of Object.keys(ORDENES)) {
    const o = v && typeof v === 'object' ? v[clave] : null;
    if (ORDENES[clave].includes(o)) r[clave] = o;
  }
  return r;
}

// Dónde se para. `ctx`: { base, porton (o null), jugador: { pos, yaw }, puntoBase, i }.
// Siguiendo, van un poco atrás tuyo, cada uno de un lado.
export function puntoDeOrden(orden, ctx) {
  if (orden === 'seguime') {
    const { pos, yaw } = ctx.jugador;
    const lado = ctx.i === 0 ? 1.6 : -1.6, atras = 2.6;
    // adelante es (-sin, -cos): atrás es (sin, cos); el costado, (cos, -sin)
    return { x: pos.x + Math.sin(yaw) * atras + Math.cos(yaw) * lado, z: pos.z + Math.cos(yaw) * atras - Math.sin(yaw) * lado };
  }
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
