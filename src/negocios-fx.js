// 3.8.8 · Economía, Fases 3 y 4: los efectos de dinero de los vecinos con local (jornales, pedidos). Los aplican las dos
// puertas de la aldea (aldea.js `aplicarEfectos`, para las pruebas, y aldea-gente.js `usarServicio`, el mundo). Módulo puro.
import { cumplirJornal } from './trabajos.js';
import { cerrarPedido } from './pedidos.js';
import { demandaDe } from './aldea-viva.js';

export const DIAS_ESTACION = 4;   // sin cielo (las pruebas): un año de 12 días son tres estaciones de cuatro
export const temporadaDelDia = (dia) => ['verano', 'otono', 'invierno'][Math.floor((Math.max(1, Math.floor(Number(dia) || 1)) - 1) / DIAS_ESTACION) % 3];
export const temporadaDe = (dia, extra) => (typeof extra?.temporada === 'string' && ['verano', 'otono', 'invierno'].includes(extra.temporada) ? extra.temporada : temporadaDelDia(dia));
export const demandaHoy = (dia, extra) => demandaDe(dia, temporadaDe(dia, extra));
// Aplica un efecto de dinero (jornal o pedido) sobre la partida. Devuelve true si era de los suyos.
export function aplicarNegocio(p, f, dia, extra = null) {
  if (f?.tipo === 'jornal') { cumplirJornal(p, f.k, dia, f.con || '', demandaHoy(dia, extra)); return true; }
  if (f?.tipo === 'pedido') { cerrarPedido(p, f.k, dia, f.con || '', true); return true; }
  return false;
}
