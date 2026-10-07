// 3.7.5 (rincones): tu casa en la aldea, en la calle de la Loma (PLAN_3_7.md: «casa propia en la calle de la loma»).
// Reglas puras (se prueban en Node). Cómo se consigue (propuesta, fácil de cambiar en CASA_PROPIA): queda un lote
// libre entre el estudio de fotos y la herboristería; con dos amigos en la aldea, la aldea te lo da y se levanta como
// las obras del pueblo: vos traés el material (de a poco, lo que tengas) y a la mañana siguiente de completarlo los
// vecinos ya la terminaron. La casa es como las de la aldea (la de Nélida, con su estufa, su cama y su mesa), sobre un
// zócalo de piedra que salva el desnivel del lote (el terreno no se toca).
import { marcoAldea, PARADA_ALDEA } from './aldea.js';

const PI = Math.PI;
export const CASA_PROPIA = {
  lote: { lx: -91.5, lz: 61.5, rot: PI },      // en el plano de la aldea: la puerta da a la calle de la Loma
  modelo: 'casa-nelida',                        // el edificio de aldea-arquitectura.js que se arma (6 × 5 m)
  obra: 'costureria',                           // y el de las etapas de obra (el mismo tamaño)
  ancho: 6, fondo: 5,
  pide: { tabla: 20, tronco: 12, piedra: 16 },  // lo que hay que traer
  amigos: 2,                                    // amigos (o compadres) en la aldea para que te den el lote
  horaLista: 7,                                 // a esta hora del día siguiente ya está
};
export const ESTADOS_CASA = ['libre', 'obra', 'lista'];
export const casaNueva = () => ({ estado: 'libre', aportes: { tabla: 0, tronco: 0, piedra: 0 }, desde: 0, lista: 0 });
export function sanearCasa(v, hoy = Infinity) {
  const b = casaNueva();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return b;
  const n = (x, tope = Infinity) => { const k = Math.floor(Number(x)); return Number.isFinite(k) && k > 0 ? Math.min(tope, k) : 0; };
  b.estado = ESTADOS_CASA.includes(v.estado) ? v.estado : 'libre';
  for (const k of Object.keys(b.aportes)) b.aportes[k] = n(v.aportes?.[k], CASA_PROPIA.pide[k]);
  b.desde = n(v.desde, hoy); b.lista = n(v.lista);
  if (b.estado === 'libre') { b.aportes = casaNueva().aportes; b.desde = 0; b.lista = 0; }
  if (b.estado === 'obra' && !b.desde) b.desde = Number.isFinite(hoy) ? hoy : 1;
  if (b.estado === 'lista' && !b.lista) b.lista = b.desde || 1;
  return b;
}
// Lo que falta traer: { tabla, tronco, piedra } (sólo lo que falta)
export function faltaCasa(c) {
  const f = {};
  for (const [k, n] of Object.entries(CASA_PROPIA.pide)) { const q = n - (c?.aportes?.[k] || 0); if (q > 0) f[k] = q; }
  return f;
}
export const materialCompleto = (c) => Object.keys(faltaCasa(c)).length === 0;
// ¿Está levantada? (a la hora de la mañana del día `lista`)
export const casaTerminada = (c, dia, hora = 12) => !!c && c.estado === 'lista' && (dia > c.lista || (dia === c.lista && hora >= CASA_PROPIA.horaLista));
// La etapa para el mundo: 0 el lote con estacas, 1..3 la obra (según lo aportado), 4 la casa
export function etapaCasa(c, dia, hora = 12) {
  if (!c || c.estado === 'libre') return 0;
  if (casaTerminada(c, dia, hora)) return 4;
  const pedido = Object.values(CASA_PROPIA.pide).reduce((a, b) => a + b, 0);
  const puesto = Object.values(c.aportes || {}).reduce((a, b) => a + b, 0);
  return Math.max(1, Math.min(3, 1 + Math.floor((puesto / pedido) * 3)));
}
// Pedir el lote: { ok, motivo }. `amigos`: cuántos amigos o compadres tenés en la aldea
export function pedirLote(c, amigos, dia) {
  if (!c) return { ok: false };
  if (c.estado !== 'libre') return { ok: false, motivo: 'ya' };
  if ((Number(amigos) || 0) < CASA_PROPIA.amigos) return { ok: false, motivo: 'amigos', faltan: CASA_PROPIA.amigos - (Number(amigos) || 0) };
  c.estado = 'obra'; c.desde = Math.max(1, Math.floor(Number(dia) || 1));
  return { ok: true };
}
// Aportar lo que tengas: `tengo(k)`: cuánto hay en la mochila. Devuelve { ok, puso: { k: n }, completa, efectos }
export function aportarCasa(c, tengo, dia) {
  if (!c || c.estado !== 'obra') return { ok: false };
  const puso = {}, efectos = [];
  for (const [k, n] of Object.entries(faltaCasa(c))) {
    const q = Math.min(n, Math.max(0, Math.floor(Number(tengo(k)) || 0)));
    if (q > 0) { c.aportes[k] += q; puso[k] = q; efectos.push({ tipo: 'material', k, n: -q }); }
  }
  const completa = materialCompleto(c);
  if (completa) { c.estado = 'lista'; c.lista = Math.max(1, Math.floor(Number(dia) || 1)) + 1; }
  return { ok: Object.keys(puso).length > 0 || completa, puso, completa, efectos };
}
const NOMBRES = { tabla: 'tablas', tronco: 'troncos', piedra: 'piedras' };
export const listaFalta = (f) => Object.entries(f).map(([k, n]) => `${n} ${NOMBRES[k] || k}`).join(', ');
// Lo que dice el aviso en el lote
export function textoCasa(c, dia, hora, amigos) {
  if (!c) return null;
  if (c.estado === 'libre') return (Number(amigos) || 0) >= CASA_PROPIA.amigos ? 'Pedir este lote para tu casa' : `Lote libre (con ${CASA_PROPIA.amigos} amigos en la aldea te lo dan)`;
  if (c.estado === 'obra') return `Traer material para tu casa (faltan ${listaFalta(faltaCasa(c))})`;
  if (!casaTerminada(c, dia, hora)) return 'Tu casa: mañana a la mañana está lista';
  return null;
}
// El lote en el mundo: { x, z, rot (el giro del edificio en el mundo) }
export function loteEnMundo(parada = PARADA_ALDEA) {
  const M = marcoAldea(parada), w = M.aMundo(CASA_PROPIA.lote.lx, CASA_PROPIA.lote.lz);
  return { x: w.x, z: w.z, rot: M.rotMundo(CASA_PROPIA.lote.rot) };
}
// ¿Estás adentro? (en el marco del edificio: la planta, con un margen chico)
export function adentroDeCasa(x, z, parada = PARADA_ALDEA, margen = -0.25) {
  const L = loteEnMundo(parada), c = Math.cos(L.rot), s = Math.sin(L.rot), dx = x - L.x, dz = z - L.z;
  const u = dx * c - dz * s, v = dx * s + dz * c;
  return Math.abs(u) < CASA_PROPIA.ancho / 2 + margen && Math.abs(v) < CASA_PROPIA.fondo / 2 + margen;
}
