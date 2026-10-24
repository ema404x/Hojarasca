// 3.8.8 · Economía, Fase 6: la aldea viva. Cada local de la aldea tiene su caja y la aldea cierra las cuentas cada día:
// vende (según lo que el pueblo demande ese día), paga sus gastos y lo que sobra queda en la caja (con tope). De ahí salen los
// jornales (trabajos.js) y los pedidos (pedidos.js): un local que vendió poco, o al que le diste muchos jornales, se queda sin
// plata y no te puede pagar hasta que se recupere. También hay eventos que mueven la demanda y los precios del puesto: el tren
// demorado, la fiesta, la helada, la cosecha, la obra grande, y el invierno, que encarece la leña.
// Todo sale de la fecha y de la clave del local (dos partidas ven lo mismo). Módulo puro, sin imports de la aldea.
import { negociosDe, CAJA_INICIAL, TOPE_CAJA } from './negocios.js';
import { hashTexto, azarDe } from './comercio.js';
import { pasarDiaBanco } from './prestamos.js';
import { alquilerDelDia } from './propiedad.js';

export const VIVA = { ingresoMin: 900, ingresoMax: 1500, gasto: 700, diasMax: 12, probEvento: 0.32 };

export const EVENTOS = [
  { id: 'tren-demorado', titulo: 'El tren llegó demorado', texto: 'Lo que viene de afuera escasea: la harina y el pan se pagan más.', demanda: 0.95, bienes: { harina: 1.12, 'pan-casero': 1.1, empanadas: 1.08 } },
  { id: 'fiesta', titulo: 'Hay fiesta en el pueblo', texto: 'Se vende más y se compra más: las empanadas, el pan y la miel suben.', demanda: 1.15, bienes: { empanadas: 1.2, 'pan-casero': 1.15, miel: 1.1, 'frasco-frutilla': 1.1 } },
  { id: 'helada', titulo: 'Cayó una helada fuerte', texto: 'Se junta leña y abrigo: los troncos y la lana valen más.', demanda: 1.0, bienes: { tronco: 1.15, lana: 1.1, poncho: 1.08 } },
  { id: 'cosecha', titulo: 'Hubo buena cosecha', texto: 'Sobran papas, habas y frutillas: se pagan menos.', demanda: 1.0, bienes: { papa: 0.9, haba: 0.9, frutilla: 0.9 } },
  { id: 'obra', titulo: 'Se arma una obra grande', texto: 'Hace falta material: las tablas y las piedras valen más.', demanda: 1.05, bienes: { tabla: 1.15, piedra: 1.12 } },
];
const entero = (v, max = 1e9) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0));
const dia1 = (d) => Math.max(1, entero(d, 1e6));
const SEASON_DEMANDA = { verano: 1.0, otono: 1.03, invierno: 0.95 };

// El evento de un día (o null): el mismo para el mismo día en todas las partidas
export function eventoDelDia(dia) {
  const h = hashTexto(`evento|${dia1(dia)}`);
  const r = azarDe(h);
  if (r() >= VIVA.probEvento) return null;
  return EVENTOS[Math.floor(r() * EVENTOS.length) % EVENTOS.length];
}
// Cuánto cambia hoy el precio de una cosa por el evento y por la estación (1 = nada). Es un cambio chico: nunca más de ±20 %.
export function factorEvento(dia, temporada, bien) {
  let f = 1;
  const e = eventoDelDia(dia);
  if (e && Object.hasOwn(e.bienes, bien)) f *= e.bienes[bien];
  if (temporada === 'invierno' && bien === 'tronco') f *= 1.08;   // el invierno encarece la leña
  return Math.max(0.8, Math.min(1.2, f));
}
// La demanda del pueblo hoy: 0,9 a 1,25
export function demandaDe(dia, temporada) {
  const e = eventoDelDia(dia);
  const d = (SEASON_DEMANDA[temporada] ?? 1) * (e ? e.demanda : 1);
  return Math.max(0.9, Math.min(1.25, d));
}
// El ingreso base de un local por día: el mismo todos los días de ese local, un poco distinto cada día
export function ingresoDe(clave, dia, demanda = 1) {
  const base = VIVA.ingresoMin + (hashTexto(`${clave}|ingreso`) % (VIVA.ingresoMax - VIVA.ingresoMin + 1));
  const r = azarDe(hashTexto(`${clave}|${dia1(dia)}|venta`))();
  return Math.round((base * (0.85 + r * 0.3) * demanda) / 10) * 10;
}
// Un día de un local: vende, gasta y queda en la caja. Devuelve la caja nueva.
export function cierreDeLocal(cajaAntes, clave, dia, demanda = 1) {
  const c = entero(cajaAntes, TOPE_CAJA) + ingresoDe(clave, dia, demanda) - VIVA.gasto;
  return Math.max(0, Math.min(TOPE_CAJA, c));
}
// Cierra las cuentas hasta `dia` para los locales dados (las claves de los vecinos con local). Si pasaron días, se
// ponen al día de a uno, hasta un año. Devuelve { dias, renta, evento } (los días puestos al día, la renta cobrada y el evento de hoy) o null si no hay negocios.
export function cerrarCuentas(p, dia, claves, temporada = 'verano') {
  const n = negociosDe(p);
  if (!n) return null;
  const hoy = dia1(dia);
  for (const k of claves) if (!Object.hasOwn(n.cajas, k)) n.cajas[k] = CAJA_INICIAL;
  if (n.cierre === 0) { n.cierre = hoy; return { dias: 0, evento: eventoDelDia(hoy) }; }
  if (n.cierre >= hoy) return { dias: 0, evento: eventoDelDia(hoy) };
  const desde = Math.max(n.cierre, hoy - VIVA.diasMax);
  let dias = 0, renta = 0;
  const info = { aDeuda: 0 };   // 4.10.4 (S2-3)
  for (let d = desde + 1; d <= hoy; d++) {
    const dem = demandaDe(d, temporada);
    for (const k of claves) n.cajas[k] = cierreDeLocal(n.cajas[k], k, d, dem);
    pasarDiaBanco(p, d);
    renta += alquilerDelDia(p, d, dem, (b) => factorEvento(d, temporada, b), info);
    dias++;
  }
  n.cierre = hoy;
  return { dias, renta, aDeuda: info.aDeuda, evento: eventoDelDia(hoy) };
}
