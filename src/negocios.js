// 3.8.8 · Economía, Fases 3 a 6: el estado de los negocios de la partida (progreso.negocios). Módulo puro, sin imports de
// dibujo ni de la aldea (lo usan trabajos.js, pedidos.js, aldea-viva.js, prestamos.js y propiedad.js). Sólo en el Relax: sin
// economía (el Desafío) no hay negocios.
//   oficio    { local: jornales hechos }        → la habilidad: sube el sueldo
//   jornal    { local: día }                    → el último jornal que hiciste ahí (uno por local por día)
//   hoy       { dia, jornales, pedidos }        → cuántos jornales y pedidos llevás hoy (hay un cupo por día)
//   rep       { local: puntos }                 → la reputación con cada local (pedidos cumplidos)
//   pedidos   { local: { id, dia } }            → el último pedido que le entregaste a cada vecino (ver pedidos.js)
//   cajas     { local: pesos }                  → la caja de cada local de la aldea (ver aldea-viva.js)
//   cierre    día                               → hasta qué día se cerraron las cuentas de la aldea
//   banco     { ... }                           → el banco del pueblo (ver prestamos.js)
//   casas     { poseidas, alquiladas, cobrado, puesto } → las casas que levantaste, las que alquilás y tu puesto (ver propiedad.js)
import { hayEconomia } from './economia.js';
import { esBien } from './comercio.js';

export const TOPE_CAJA = 12000;
export const CAJA_INICIAL = 3000;
const entero = (v, max = 1e7) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0));
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const claveOk = (k) => typeof k === 'string' && k.length > 0 && k.length <= 40;

export function negociosNuevo() {
  return {
    oficio: {}, jornal: {}, hoy: { dia: 0, jornales: 0, pedidos: 0 }, rep: {}, pedidos: {}, cajas: {}, cierre: 0,
    banco: { prestamo: null, rep: 0, cuotas: 0, hechos: 0, atrasos: 0, sinConfianza: false, abastoDia: 0, abastecidos: 0 },
    casas: { poseidas: {}, alquiladas: {}, cobrado: 0, puesto: null },
  };
}
// Sólo cuenta si la partida tiene economía
export const hayNegocios = (p) => hayEconomia(p) && objeto(p?.negocios);
export function negociosDe(p) {
  if (!hayEconomia(p)) return null;
  if (!objeto(p.negocios)) p.negocios = negociosNuevo();
  return p.negocios;
}

const mapa = (v, f, max = 60) => {
  const r = {};
  if (!objeto(v)) return r;
  for (const [k, x] of Object.entries(v)) {
    if (!claveOk(k) || Object.keys(r).length >= max) continue;
    const y = f(x, k);
    if (y !== null && y !== undefined) r[k] = y;
  }
  return r;
};
export function sanearPedido(v, hoy) {
  if (!objeto(v) || typeof v.id !== 'string' || v.id.length > 60) return null;
  const k = typeof v.k === 'string' && v.k.length <= 30 ? v.k : null;
  if (!k) return null;
  return {
    id: v.id, tipo: v.tipo === 'bien' ? 'bien' : 'material', k, n: Math.max(1, entero(v.n, 40)), premio: entero(v.premio, 1e6),
    dia: Math.min(hoy, Math.max(1, entero(v.dia, 1e6))), limite: Math.max(1, entero(v.limite, 1e6)), prima: v.prima === true,
  };
}
export function sanearPrestamoGuardado(v, hoy) {
  if (!objeto(v)) return null;
  const monto = entero(v.monto, 1e6), debe = entero(v.debe, 1e7);
  if (monto <= 0 || debe <= 0) return null;
  return { monto, debe, dia: Math.min(hoy, Math.max(1, entero(v.dia, 1e6))), hasta: Math.max(1, entero(v.hasta, 1e6)), tasa: Math.max(0, Math.min(0.2, Number(v.tasa) || 0)), cuotaDia: entero(v.cuotaDia, 1e6), pagoHasta: entero(v.pagoHasta, 1e6) };
}
export function sanearNegocios(v, hoy = 1e6) {
  const base = negociosNuevo();
  if (!objeto(v)) return base;
  const dia = Math.max(1, entero(hoy, 1e6));
  const b = objeto(v.banco) ? v.banco : {};
  const c = objeto(v.casas) ? v.casas : {};
  const puesto = objeto(c.puesto) ? { desde: Math.min(dia, Math.max(1, entero(c.puesto.desde, 1e6))), caja: entero(c.puesto.caja, 1e6), stock: mapa(c.puesto.stock, (n, b) => (esBien(b) && entero(n, 30) > 0 ? entero(n, 30) : null), 8), dia: Math.min(dia, entero(c.puesto.dia, 1e6)) } : null;
  return {
    oficio: mapa(v.oficio, (n) => entero(n, 1e5) || null),
    jornal: mapa(v.jornal, (d) => Math.min(dia, entero(d, 1e6))),
    hoy: objeto(v.hoy) ? { dia: Math.min(dia, entero(v.hoy.dia, 1e6)), jornales: entero(v.hoy.jornales, 20), pedidos: entero(v.hoy.pedidos, 20) } : base.hoy,
    rep: mapa(v.rep, (n) => entero(n, 1e5) || null),
    pedidos: mapa(v.pedidos, (x) => (objeto(x) && typeof x.id === 'string' && x.id.length <= 60 ? { id: x.id, dia: Math.min(dia, entero(x.dia, 1e6)) } : null)),
    cajas: mapa(v.cajas, (n) => entero(n, TOPE_CAJA)),
    cierre: Math.min(dia, entero(v.cierre, 1e6)),
    banco: {
      prestamo: sanearPrestamoGuardado(b.prestamo, dia), rep: entero(b.rep, 1e5), cuotas: entero(b.cuotas, 1e6), hechos: entero(b.hechos, 1e6),
      atrasos: entero(b.atrasos, 1e5), sinConfianza: b.sinConfianza === true, abastoDia: entero(b.abastoDia, 1e6), abastecidos: entero(b.abastecidos, 1e6),
    },
    casas: {
      poseidas: mapa(c.poseidas, (n) => (entero(n, 20) > 0 ? entero(n, 20) : null), 20),
      alquiladas: mapa(c.alquiladas, (x) => (objeto(x) && claveOk(x.inquilino) ? { inquilino: x.inquilino, desde: Math.min(dia, Math.max(1, entero(x.desde, 1e6))), renta: entero(x.renta, 1e5), cuantas: Math.max(1, entero(x.cuantas, 20)) } : null), 20),
      cobrado: entero(c.cobrado, 1e8),
      puesto,
    },
  };
}
// La reputación con un local y el nivel que da (0 a 3): 0 recién llegado, 3 de confianza
export const NIVELES_REP = [0, 3, 8, 16];
export function nivelRep(p, k) {
  const r = negociosDe(p)?.rep?.[k] || 0;
  let n = 0;
  for (let i = 1; i < NIVELES_REP.length; i++) if (r >= NIVELES_REP[i]) n = i;
  return n;
}
export const caja = (p, k) => negociosDe(p)?.cajas?.[k] ?? CAJA_INICIAL;
