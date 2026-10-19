// 4.3: cuánto rinde el local propio con las reglas de verdad (negocio-propio.js): un jugador que atiende cada cliente en unos segundos y surte
// cada mañana con lo que produce. Compara contra vender lo mismo de una a la consigna del puesto de la feria (lo que se cobraría sin local).
//   node herramientas/simulador-negocio-propio.mjs [días]
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const N = await import('../src/negocio-propio.js');
const E = await import('../src/economia.js');
const C = await import('../src/comercio.js');
const R = await import('../src/propiedad.js');

const DIAS = Number(process.argv[2]) || 60;
const $ = (v) => '$' + Math.round(v).toLocaleString('es-AR');
// Un día de juego son 30 minutos reales (el valor por defecto): una hora de juego, 75 s
const SEG_HORA = 75;

// Lo que produce y junta un jugador por día para surtir (unidades). `bueno` tiene los edificios de oficio de la 4.2; `chico` es sólo huerta y recolección.
const PRODUCCION = {
  almacen: {
    bueno: { 'pan-casero': 8, huevo: 12, miel: 3, 'frasco-frutilla': 3, 'calafate-seco': 2, poncho: 1, 'hongos-secos': 2, 'trucha-ahumada': 2, tronco: 6, tabla: 4, piedra: 4, harina: 4, papa: 6, lana: 2 },
    chico: { huevo: 6, papa: 4, miel: 2, tronco: 4, 'calafate-seco': 2, 'pan-casero': 3 },
  },
  panaderia: {
    bueno: { 'pan-casero': 8, empanadas: 8, miel: 3, 'frasco-frutilla': 3, huevo: 8, harina: 4, 'calafate-seco': 2 },
    chico: { 'pan-casero': 4, empanadas: 3, huevo: 4, miel: 2 },
  },
};
// lo que se cobraría sin local: el precio de plaza menos el margen del puesto del mercado (12 %), que es lo que paga el almacén de Ercilia o el puesto de cargas
const consigna = (k) => N.precioPlaza(k) * (1 - C.COMERCIO.margen);
const consignaFeria = (k) => R.precioDeConsigna(k) / C.BIENES[k].lote;   // y lo que pagaría la consigna de la feria (la más baja)

function jugar({ tipo = 'almacen', prod = 'bueno', nivel = 1, rep0 = N.REP_INICIAL, atiende = [4, 14], dias = DIAS, lluvia = 0, siempreStock = false } = {}) {
  const est = N.negocioPropioNuevo();
  est.tipo = tipo; est.abierto = true; est.rep = rep0;
  if (nivel !== 1) for (const k of N.catalogo(tipo)) est.precios[k] = nivel;
  const cola = N.colaNueva();
  const p = { modo: 'relax', economia: E.economiaNueva() };
  let ventas = 0, costoConsigna = 0, clientes = 0, atendidos = 0, perdidos = 0, repFin = 0, sinStock = 0;
  const semilla = Math.floor(Math.random() * 1e6);
  for (let d = 1; d <= dias; d++) {
    N.ponerAlDia(est, d);
    // se surte con lo que se produjo ese día (hasta el tope de cada cosa)
    for (const [k, n] of Object.entries(PRODUCCION[tipo][prod])) N.surtir(est, k, siempreStock ? 1e5 : n, { tengo: () => 1e5, quitar: () => {} });
    for (let h = N.HORA_ABRE; h < N.HORA_CIERRA; h++) {
      for (let s = 0; s < SEG_HORA; s++) {
        const hora = h + s / SEG_HORA;
        const ev = N.avanzarCola(cola, est, tipo, 1, 1 / SEG_HORA, { hora, dia: d + semilla, presente: true, lluvia });
        for (const e of ev) { if (e.tipo === 'llega') clientes++; if (e.tipo === 'se-cansa') perdidos++; }
        for (const c of cola.clientes) { if (!c.listo && c.edad >= 8) c.listo = true; }
        // el jugador atiende al primero a los pocos segundos de que llega al mostrador
        const c = N.primeroEnLaCola(cola);
        if (c && (c.espera >= (c.demora ??= atiende[0] + Math.random() * (atiende[1] - atiende[0])))) {
          const r = N.despachar(est, c);
          cola.clientes.splice(cola.clientes.indexOf(c), 1);
          if (r.ok) { atendidos++; ventas += r.total; for (const v of r.vendidos) costoConsigna += consigna(v.k) * v.n; if (r.faltan.length) sinStock++; }
        }
      }
    }
    if (est.caja > 0) { E.cobrar(p, est.caja, 'x'); est.caja = 0; }
  }
  repFin = est.rep;
  return { ventas: ventas / dias, costo: costoConsigna / dias, margen: (ventas - costoConsigna) / dias, clientes: clientes / dias, atendidos: atendidos / dias, perdidos: perdidos / dias, sinStock: sinStock / dias, rep: repFin };
}
const fila = (nombre, r) => console.log(`- ${nombre}: ${r.clientes.toFixed(1)} clientes/día (${r.atendidos.toFixed(1)} atendidos, ${r.perdidos.toFixed(1)} perdidos, ${r.sinStock.toFixed(1)} con faltante) · ventas ${$(r.ventas)}/día · vendido al mercado ${$(r.costo)} · GANANCIA sobre venderlo al mercado ${$(r.margen)}/día · reputación al final ${r.rep.toFixed(0)}`);
const promedio = (f, veces = 6) => { const rs = Array.from({ length: veces }, f); const m = {}; for (const k of Object.keys(rs[0])) m[k] = rs.reduce((s, r) => s + r[k], 0) / veces; return m; };

console.log(`# Negocio propio: rendimiento por día (${DIAS} días, un día = 30 min reales; el jornal de la economía anda en ~$3.200/día)\n`);
for (const tipo of N.IDS_TIPOS) {
  console.log(`## ${N.TIPOS[tipo].nombre}`);
  for (const [prod, etiqueta] of [['bueno', 'surtido bueno (edificios de oficio de la 4.2)'], ['chico', 'surtido chico (huerta y recolección)']]) {
    for (const [nivel, nombre] of [[0, 'precios baratos'], [1, 'precios normales'], [2, 'precios caros']]) fila(`${etiqueta}, ${nombre}`, promedio(() => jugar({ tipo, prod, nivel })));
  }
  console.log();
}
console.log('## Qué pasa según la reputación (almacén, surtido bueno, precios normales, sin límite de producción)');
for (const rep0 of [10, 25, 50, 75, 95]) fila(`arranca en ${rep0}`, promedio(() => jugar({ tipo: 'almacen', nivel: 1, rep0, siempreStock: true, dias: 12 })));
console.log('\n## Atención lenta y días de lluvia (almacén, surtido bueno, precios normales)');
fila('atiende en 4 a 14 s', promedio(() => jugar({ tipo: 'almacen' })));
fila('atiende en 30 a 55 s (lento)', promedio(() => jugar({ tipo: 'almacen', atiende: [30, 55] })));
fila('todos los días llueve', promedio(() => jugar({ tipo: 'almacen', lluvia: 1 })));
console.log('\n## Con un surtido de sólo 2 cosas (el almacén desabastecido)');
{
  const guardado = PRODUCCION.almacen.bueno;
  PRODUCCION.almacen.bueno = { 'pan-casero': 8, huevo: 12 };
  fila('sólo pan y huevos', promedio(() => jugar({ tipo: 'almacen' })));
  PRODUCCION.almacen.bueno = guardado;
}
console.log('\n## Cuándo se paga el local');
for (const [id, precio] of [['almacén de campo', 28000], ['panadería y cafetería', 36000]]) {
  const r = promedio(() => jugar({ tipo: id.startsWith('alm') ? 'almacen' : 'panaderia', nivel: 1 }));
  console.log(`- ${id}: ${$(precio)} de pesos (más materiales) → con ${$(r.margen)}/día de ganancia sobre venderlo al mercado se paga en ${(precio / r.margen).toFixed(0)} días (${(precio / r.margen / 12).toFixed(1)} años del juego)`);
}
