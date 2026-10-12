// Fase 0 de la economía (ver PLAN_ECONOMIA.md): números sobre lo que el juego YA tiene, sin tocar el juego.
//   node herramientas/simulador-economia.mjs            → imprime las tablas
//   node herramientas/simulador-economia.mjs --escribir → además las guarda en ECONOMIA_NUMEROS.md
// Usa el comercio.js de verdad (precios por parada, estación y día; margen; corrimiento por lote; lotes por día), así que lo que
// mide es lo que hoy hace el juego. La conversión yerba → pesos es el único supuesto: 1 yerba = $100.
import fs from 'node:fs';
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const C = await import('../src/comercio.js');
const { PLANOS_CASAS } = await import('../src/planos-casas.js');
const { PIEZAS_MUEBLES } = await import('../src/planos-muebles.js');
const { PIEZAS_MUEBLES_2 } = await import('../src/planos-muebles-2.js');
const { TRUEQUES } = await import('../src/trueque.js');
const { OFERTAS } = await import('../src/feria.js');

const PESOS_POR_YERBA = 100;
const $ = (v) => '$' + Math.round(v).toLocaleString('es-AR');
const out = [];
const L = (t = '') => { out.push(t); console.log(t); };
const tabla = (cab, filas) => { L('| ' + cab.join(' | ') + ' |'); L('|' + cab.map(() => '---').join('|') + '|'); for (const f of filas) L('| ' + f.join(' | ') + ' |'); L(); };

// ---------------------------------------------------------------- 1. lo que vale cada cosa
L('## 1. Valores base, en pesos (1 yerba = $100)\n');
const unidad = (b) => (C.BIENES[b].valor / C.BIENES[b].lote) * PESOS_POR_YERBA;
tabla(['Bien', 'De dónde sale', 'Lote', 'Valor del lote', 'Por unidad'],
  C.ID_BIENES.map((b) => [C.BIENES[b].nombre, C.BIENES[b].donde, C.BIENES[b].lote, $(C.BIENES[b].valor * PESOS_POR_YERBA), $(unidad(b))]));

// ---------------------------------------------------------------- 2. lo que cuestan las obras (sólo materiales, a valor base)
L('## 2. Materiales de las obras (a valor base, sin margen ni mano de obra)\n');
const costoMat = (pide) => Object.entries(pide).reduce((s, [k, n]) => s + (C.esBien(k) ? unidad(k) * n : 0), 0);
const casas = PLANOS_CASAS.map((p) => {
  const total = {}; for (const e of p.etapas) for (const [k, n] of Object.entries(e.pide || {})) total[k] = (total[k] || 0) + n;
  return { nombre: p.nombre, total, costo: costoMat(total) };
});
tabla(['Casa', 'Materiales', 'Costo en materiales'], casas.map((c) => [c.nombre, Object.entries(c.total).map(([k, n]) => `${n} ${k}`).join(', '), $(c.costo)]));
const muebles = [...PIEZAS_MUEBLES, ...PIEZAS_MUEBLES_2].map((p) => ({ nombre: p.nombre, costo: costoMat(p.pide) })).sort((a, b) => a.costo - b.costo);
L(`Los ${muebles.length} muebles nuevos cuestan entre ${$(muebles[0].costo)} (${muebles[0].nombre}) y ${$(muebles[muebles.length - 1].costo)} (${muebles[muebles.length - 1].nombre}); la mediana es ${$(muebles[Math.floor(muebles.length / 2)].costo)}.\n`);

// ---------------------------------------------------------------- 3. lo que ya se paga hoy en yerba (para migrar a pesos)
L('## 3. Lo que hoy se paga en yerba (ofertas de la feria y trueques)\n');
const feriaYerba = OFERTAS.filter((o) => o.da?.cuenta?.yerba).map((o) => [o.id, Object.entries(o.pide).map(([k, n]) => `${n} ${k}`).join(', '), `${o.da.cuenta.yerba} yerba = ${$(o.da.cuenta.yerba * PESOS_POR_YERBA)}`]);
tabla(['Oferta de feria', 'Da el jugador', 'Recibe'], feriaYerba);
tabla(['Trueque', 'Pide', 'Por'], TRUEQUES.map((t) => [t.nombre, t.pide.map(([k, n]) => `${n} ${k}`).join(', '), t.repetible ? `repetible (da ${t.da})` : 'una vez']));

// ---------------------------------------------------------------- 4. ¿hay plata gratis? comprar en una parada y vender en otra
L('## 4. Arbitraje entre paradas con el comercio de hoy\n');
const paradas = ['Estación del Valle', 'Parada del Mallín', 'Apeadero del Faro', 'Parada Arrayanes', 'Parada Alta', 'Parada del Molino', 'Apeadero de la Casa de Té', 'Parada del Mirador', 'Apeadero del Pescador', 'Parada del Bosque', 'Aldea de los Duendes'];
const TEMP = C.TEMPORADAS;
const lotes = C.COMERCIO.lotesPorDia;
// la mejor ganancia de llevar `bien` de A a B ese día: se compran k lotes en A (cada uno corre el precio) y se venden k en B
function mejorLlevada(a, b, bien, dia, temp) {
  const ca = C.comercioNuevo(), cb = C.comercioNuevo();
  ca.hoy.dia = dia; cb.hoy.dia = dia;
  if (!C.bienesDe(a).includes(bien) || !C.bienesDe(b).includes(bien)) return { k: 0, ganancia: 0 };
  let mejor = { k: 0, ganancia: 0 }, gasto = 0, ingreso = 0;
  const ta = { c: C.comercioNuevo() }, tb = { c: C.comercioNuevo() };
  for (let k = 1; k <= lotes; k++) {
    const pa = C.precios(ta.c, a, bien, dia, temp), pb = C.precios(tb.c, b, bien, dia, temp);
    if (pa.quedanCompra <= 0 || pb.quedanVenta <= 0) break;
    gasto += pa.compra; ingreso += pb.venta;
    ta.c.hoy.comprados[`${a}|${bien}`] = k; tb.c.hoy.vendidos[`${b}|${bien}`] = k;
    if (ingreso - gasto > mejor.ganancia) mejor = { k, ganancia: ingreso - gasto };
  }
  return mejor;
}
const rutas = [];
for (const a of paradas) for (const b of paradas) {
  if (a === b) continue;
  let total = 0, mejorDia = 0;
  for (let dia = 1; dia <= 12; dia++) {
    const temp = TEMP[(dia - 1) % 3];
    let dd = 0;
    for (const bien of C.ID_BIENES) dd += mejorLlevada(a, b, bien, dia, temp).ganancia;
    total += dd; mejorDia = Math.max(mejorDia, dd);
  }
  rutas.push({ a, b, media: total / 12, mejorDia });
}
rutas.sort((x, y) => y.media - x.media);
tabla(['Ruta (compra → vende)', 'Ganancia media por día', 'Mejor día'], rutas.slice(0, 8).map((r) => [`${r.a} → ${r.b}`, $(r.media * PESOS_POR_YERBA), $(r.mejorDia * PESOS_POR_YERBA)]));
const media = rutas.reduce((s, r) => s + r.media, 0) / rutas.length;
L(`Con la plata en yerba, la ganancia media de una ruta cualquiera es ${$(media * PESOS_POR_YERBA)} por día y la mejor, ${$(rutas[0].media * PESOS_POR_YERBA)}. (Se mide con TODOS los bienes y los 6 lotes diarios de cada uno, sin límite de carga ni de tiempo de viaje.)\n`);
// en el mismo andén comprar y vender nunca debe ganar
let malos = 0;
for (const p of paradas) for (const b of C.ID_BIENES) for (const dia of [1, 5, 9]) { const pr = C.precios(C.comercioNuevo(), p, b, dia, TEMP[dia % 3]); if (pr.venta >= pr.compra) malos++; }
L(`Comprar y vender en el mismo andén ${malos === 0 ? 'siempre pierde (bien)' : `gana en ${malos} casos (MAL)`}.\n`);

// ---------------------------------------------------------------- 5. cuánto tarda en comprarse una casa con distintos ingresos
L('## 5. Días de ingreso para pagar los materiales de cada casa\n');
const ingresos = [1500, 3000, 5000];
tabla(['Casa', ...ingresos.map((i) => `a ${$(i)}/día`)], casas.map((c) => [c.nombre, ...ingresos.map((i) => `${Math.ceil(c.costo / i)} días (${(Math.ceil(c.costo / i) / 12).toFixed(1)} años)`)]));
L('Un año del juego son 12 días.\n');
if (process.argv.includes('--escribir')) {
  fs.writeFileSync(new URL('../ECONOMIA_NUMEROS.md', import.meta.url), '# Números de la economía (Fase 0)\n\nGenerado por `herramientas/simulador-economia.mjs` con el comercio, la feria, los trueques y las casas del juego tal como están hoy.\n\n' + out.join('\n') + '\n');
  console.log('escrito: ECONOMIA_NUMEROS.md');
}
