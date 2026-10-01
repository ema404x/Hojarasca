// 3.1: el desafío del día. Cada día de verdad (la fecha de la compu) hay un desafío, el
// mismo para todos los que jueguen ese día: sale de la fecha, como el código de la semana
// del Desafío sale de la semana (ver semilla.js). Pescar tantas truchas, correr un circuito
// al revés, terminar una obra antes de que caiga el sol, llevar un flete en la trochita.
// Cumplirlo da puntos y suma a la racha: días seguidos con el desafío hecho.
//
// Se juega en el Relax. Lo cumplido va en la partida (y viaja con la carpeta sincronizada).
// Puro, sin three ni DOM.
import { hashTexto, generador } from './semilla.js';
import { circuitoDe, refDe, puntosCarrera, formatoTiempo, GIROS } from './carreras.js';

const dos = (n) => String(n).padStart(2, '0');
const DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
// La fecha de la compu, en su huso: 'AAAA-MM-DD'
export function fechaTexto(f = new Date()) {
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
}
export function fechaValida(s) {
  const m = typeof s === 'string' ? DIA.exec(s) : null;
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}
// El día anterior (en calendario, sin husos: la fecha es texto)
export function diaAnterior(s) {
  if (!fechaValida(s)) return '';
  const m = DIA.exec(s);
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] - 1));
  return `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
}

// Lo que se puede pedir. Las obras son piezas que no piden nada desbloqueado (ver
// construccion.js); los circuitos, los que cualquiera puede correr (a pie o en el kayak
// del muelle: el zaino y el velero hay que ganárselos).
export const OBRAS_DEL_DIA = [
  ['banco', 'un banco de tronco'], ['fogon', 'un fogón de piedra'], ['tendal', 'un tendal'],
  ['lena', 'una pila de leña'], ['mesa-campo', 'una mesa de campo'], ['silla-campo', 'una silla de campo'], ['cerco', 'un tramo de cerco'],
];
export const CIRCUITOS_DEL_DIA = ['mirador', 'faro', 'lago'];
export const PECES_DEL_DIA = [['', 'peces'], ['arcoiris', 'truchas arcoíris'], ['perca', 'percas criollas'], ['pejerrey', 'pejerreyes']];
export const TIPOS_DIARIO = ['pesca', 'carrera', 'obra', 'tren'];
export const PUESTA_DEL_SOL = 19.5;

// El desafío de una fecha: siempre el mismo para la misma fecha.
export function desafioDelDia(fecha) {
  const f = fechaValida(fecha) ? fecha : fechaTexto();
  const r = generador(hashTexto(`hojarasca-dia-${f}`));
  const tipo = TIPOS_DIARIO[Math.floor(r() * TIPOS_DIARIO.length)];
  const d = { fecha: f, tipo };
  if (tipo === 'pesca') {
    const [pez, nombre] = PECES_DEL_DIA[Math.floor(r() * PECES_DEL_DIA.length)];
    // el tamaño mínimo, sólo si la especie llega (el pejerrey no pasa de 38 cm; ver pesca.js)
    const tope = { '': 40, arcoiris: 40, perca: 30, pejerrey: 0 }[pez];
    d.pez = pez; d.n = 2 + Math.floor(r() * 3);
    const conTamano = r() < 0.4, extra = Math.floor(r() * 3) * 5;
    d.cmMin = conTamano && tope ? Math.min(tope, 30 + extra) : 0;
    d.titulo = `Pescá ${d.n} ${nombre}${d.cmMin ? ` de ${d.cmMin} cm o más` : ''}`;
    d.texto = 'Con la caña (Q), en el lago o en el arroyo. Cuentan las que saques hoy.';
    d.puntos = 100 + d.n * 25 + (d.cmMin ? 60 : 0);
  } else if (tipo === 'carrera') {
    const c = circuitoDe(CIRCUITOS_DEL_DIA[Math.floor(r() * CIRCUITOS_DEL_DIA.length)]);
    const giros = ['invertido', 'doble', 'meta'];
    d.circuito = c.id; d.giro = giros[Math.floor(r() * giros.length)];
    // 'meta': la vuelta normal, pero por debajo de un tiempo
    d.limiteMs = d.giro === 'meta' ? Math.round(c.ref * 1000 * (0.9 + Math.floor(r() * 3) * 0.05)) : 0;
    const como = d.giro === 'meta' ? `en menos de ${formatoTiempo(d.limiteMs)}` : GIROS[d.giro].nombre;
    d.titulo = `Corré ${c.nombre.toLowerCase()} ${como}`;
    d.texto = `${c.medio === 'kayak' ? 'En kayak, desde la boya del muelle' : 'A pie'}: E en el poste de largada.`;
    d.puntos = 150;
  } else if (tipo === 'obra') {
    const [plano, nombre] = OBRAS_DEL_DIA[Math.floor(r() * OBRAS_DEL_DIA.length)];
    d.plano = plano; d.titulo = `Terminá ${nombre} antes de que caiga el sol`;
    d.texto = 'Con los planos (O). Cuenta la que termines hoy antes de las siete y media de la tarde.';
    d.puntos = 180;
  } else {
    d.n = 1 + Math.floor(r() * 2);
    d.titulo = d.n === 1 ? 'Entregá un flete con la trochita' : `Entregá ${d.n} fletes con la trochita`;
    d.texto = 'Manejando la locomotora: los fletes se toman en el puesto de cargas de cada andén (C).';
    d.puntos = 120 + d.n * 80;
  }
  return d;
}

// ---------------------------------------------------------------- lo cumplido (en la partida)
export function diariosNuevo() {
  return { racha: 0, mejorRacha: 0, ultimo: '', total: 0, hoy: { fecha: '', avance: 0, hecho: false, puntos: 0, base: null }, historial: {} };
}
const entero = (v, min, max, def = 0) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def; };
export function sanearDiarios(v) {
  const b = diariosNuevo();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return b;
  b.racha = entero(v.racha, 0, 100000);
  b.mejorRacha = Math.max(b.racha, entero(v.mejorRacha, 0, 100000));
  b.ultimo = fechaValida(v.ultimo) ? v.ultimo : '';
  b.total = entero(v.total, 0, 1e9);
  const h = v.hoy && typeof v.hoy === 'object' && !Array.isArray(v.hoy) ? v.hoy : {};
  if (fechaValida(h.fecha)) {
    b.hoy = { fecha: h.fecha, avance: entero(h.avance, 0, 1000), hecho: h.hecho === true, puntos: entero(h.puntos, 0, 100000), base: h.base === null || h.base === undefined ? null : entero(h.base, 0, 1e9, null) };
  }
  const hist = v.historial && typeof v.historial === 'object' && !Array.isArray(v.historial) ? v.historial : {};
  const fechas = Object.keys(hist).filter((k) => fechaValida(k) && Object.hasOwn(hist, k)).sort().slice(-60);
  for (const k of fechas) b.historial[k] = entero(hist[k], 0, 100000);
  return b;
}
// El estado de hoy: si cambió la fecha, empieza de cero (la racha se decide al cumplir)
export function hoyDe(d, fecha) {
  if (!d.hoy || d.hoy.fecha !== fecha) d.hoy = { fecha, avance: 0, hecho: false, puntos: 0, base: null };
  return d.hoy;
}
// La racha que vale hoy: si el último día cumplido fue hoy o ayer; si no, se cortó.
export function rachaVigente(d, fecha) {
  return d && (d.ultimo === fecha || d.ultimo === diaAnterior(fecha)) ? d.racha : 0;
}
function cumplir(d, def, puntos) {
  const h = hoyDe(d, def.fecha);
  if (h.hecho) return false;
  h.hecho = true; h.puntos = puntos;
  if (d.ultimo === def.fecha) { /* ya contado */ }
  else if (d.ultimo === diaAnterior(def.fecha)) d.racha += 1;
  else d.racha = 1;
  d.ultimo = def.fecha;
  d.mejorRacha = Math.max(d.mejorRacha, d.racha);
  d.total += puntos;
  d.historial[def.fecha] = puntos;
  const fechas = Object.keys(d.historial).sort();
  while (fechas.length > 60) delete d.historial[fechas.shift()];
  return true;
}
// Algo pasó en el juego: ¿avanza el desafío de hoy? Eventos:
//   { tipo: 'pez', id, cm } · { tipo: 'carrera', circuito, giro, ms } ·
//   { tipo: 'obra', plano, horas } · { tipo: 'entregas', valor } (el contador de fletes entregados)
// Devuelve { cumplido: true } la vez que se cumple, si no null.
export function avanzarDiario(d, def, ev) {
  if (!d || !def || !ev) return null;
  const h = hoyDe(d, def.fecha);
  if (h.hecho) return null;
  if (def.tipo === 'pesca' && ev.tipo === 'pez') {
    if (def.pez && ev.id !== def.pez) return null;
    if ((Number(ev.cm) || 0) < def.cmMin) return null;
    h.avance = Math.min(def.n, h.avance + 1);
    if (h.avance >= def.n) return cumplir(d, def, def.puntos) ? { cumplido: true, puntos: def.puntos } : null;
    return { avance: h.avance };
  }
  if (def.tipo === 'carrera' && ev.tipo === 'carrera') {
    if (ev.circuito !== def.circuito) return null;
    const giro = def.giro === 'meta' ? null : def.giro;
    if ((ev.giro || null) !== giro) return null;
    const ms = Number(ev.ms) || 0;
    if (def.giro === 'meta' && !(ms > 0 && ms <= def.limiteMs)) return { avance: 0, lento: true };
    const puntos = def.puntos + Math.round(puntosCarrera(ms, refDe(def.circuito, giro)) / 4);
    h.avance = 1;
    return cumplir(d, def, puntos) ? { cumplido: true, puntos } : null;
  }
  if (def.tipo === 'obra' && ev.tipo === 'obra') {
    if (ev.plano !== def.plano) return null;
    if (!((Number(ev.horas) || 0) < PUESTA_DEL_SOL && (Number(ev.horas) || 0) >= 5)) return { avance: 0, tarde: true };
    h.avance = 1;
    return cumplir(d, def, def.puntos) ? { cumplido: true, puntos: def.puntos } : null;
  }
  if (def.tipo === 'tren' && ev.tipo === 'entregas') {
    const v = Math.max(0, Math.floor(Number(ev.valor) || 0));
    if (h.base === null || v < h.base) { h.base = v; return null; }
    const antes = h.avance;
    h.avance = Math.min(def.n, v - h.base);
    if (h.avance >= def.n) return cumplir(d, def, def.puntos) ? { cumplido: true, puntos: def.puntos } : null;
    return h.avance !== antes ? { avance: h.avance } : null;
  }
  return null;
}
// Cuánto falta, en palabras (para la portada y el panel)
export function textoAvance(d, def) {
  const h = d?.hoy?.fecha === def.fecha ? d.hoy : { avance: 0, hecho: false };
  if (h.hecho) return `Hecho: ${h.puntos} puntos`;
  if (def.tipo === 'pesca') return `${h.avance} de ${def.n}`;
  if (def.tipo === 'tren') return `${h.avance} de ${def.n}`;
  return 'Todavía no';
}
