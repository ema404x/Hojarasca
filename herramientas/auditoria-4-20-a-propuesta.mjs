// 4.21.0 (A): ojo: la variante «final» (caja 450, turno × 1,25, tablón) YA ESTÁ aplicada en el juego (src/mercado.js, empleo.js, tablon.js). La base de hoy es la «final» de la 4.20.0:
//   volver a correr `--variante=final` la aplicaría dos veces (turno × 1,5625). Las demás variantes (caja350, turno150, pedidos12, jornal2) sirven para probar lo que sigue.
// 4.20.0 (A): la tabla de valores nuevos, aplicada EN MEMORIA (no toca el juego) para volver a correr el simulador de ritmo.
//   node herramientas/auditoria-4-20-a-ritmo.mjs 36 --variante=nombre   (o --propuesta, que es «final»)
// Cada variante cambia sólo las constantes que nombra; los módulos reales hacen el resto de la cuenta.
export const VARIANTES = {
  base: () => {},
  // el mercado: lo que se repone la caja de cada puesto por día (hoy $700: el techo de lo que se vende sostenido es 11 puestos × $700)
  caja450: (m) => { m.M.MERCADO.cajaDia = 450; },
  caja350: (m) => { m.M.MERCADO.cajaDia = 350; },
  // el empleo: sueldos por escalón (hoy 1600/2100/2700 en el almacén, parecidos en los otros)
  turno125: (m) => { for (const k of m.EM.IDS_PUESTOS) m.EM.PUESTOS[k].sueldos = m.EM.PUESTOS[k].sueldos.map((s) => Math.round((s * 1.25) / 50) * 50); },
  turno150: (m) => { for (const k of m.EM.IDS_PUESTOS) m.EM.PUESTOS[k].sueldos = m.EM.PUESTOS[k].sueldos.map((s) => Math.round((s * 1.5) / 50) * 50); },
  // el tablón: lo que paga de más por la distancia (hoy ×1,5 / ×2 / ×2,5 sobre lo de un pedido)
  tablon: (m) => { m.TA.TABLON.tramos = [[350, 1.3], [550, 1.6], [Infinity, 2]]; },
  // los pedidos de los vecinos: lo que pagan sobre el valor (hoy ×1,1)
  pedidos12: (m) => { m.P.PEDIDOS.base = 1.2; },
  // lo que hace falta de jornales por nivel de habilidad (hoy 3: un local llega a su tope en 15 jornales)
  jornal2: (m) => { m.T.JORNAL.hechosPorNivel = 2; },
  // la propuesta completa (ver AUDITORIA_4_20_0_A.md): el mercado repone menos y el empleo paga más
  final: (m) => { VARIANTES.caja450(m); VARIANTES.turno125(m); VARIANTES.tablon(m); },
};
export function aplicar(m, nombre = 'final') {
  const v = VARIANTES[nombre];
  if (!v) throw new Error(`variante desconocida: ${nombre}`);
  v(m);
}
