// 4.20.0 (A): cuánto plata puede sacar un jugador del mercado de los puestos por día, con las reglas reales (precios, corrimiento por lote,
// existencias, caja de cada puesto que se repone de a $700 por día, eventos y temporadas).
//   node herramientas/auditoria-4-20-a-mercado.mjs [días]
// Modelo: el jugador tiene de todo (mercadería infinita) y visita K puestos por día; en cada uno vende de lo más caro a lo más barato mientras
// el puesto tenga caja y lugar. Mide lo que entra por día. Después, la compra: cuánto cuesta una cosa en el puesto donde sale más barata.
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const CO = await import('../src/comercio.js');
const ME = await import('../src/mercado.js');
const NF = await import('../src/negocios-fx.js');
const AV = await import('../src/aldea-viva.js');

const DIAS = Number(process.argv[2]) || 60;
const $ = (v) => '$' + Math.round(v).toLocaleString('es-AR');
const PARADAS = ['Estación del Valle', 'Parada del Mallín', 'Apeadero del Faro', 'Parada Arrayanes', 'Parada Alta', 'Parada del Molino', 'Apeadero de la Casa de Té', 'Parada del Mirador', 'Apeadero del Pescador', 'Parada del Bosque', 'Aldea de los Duendes'];
const PUESTOS = ['Puesto de la Cantera', 'Puesto del Paso', 'Puesto de la Estepa', 'Puesto del Riel Sur'];

const aPesos = (u) => Math.round(u * 100);
function nuevoMundo() { return { c: CO.comercioNuevo() }; }
const factor = (W, nombre, bien, dia) => ME.factorDe(ME.tienda(W.c, nombre, dia), nombre, bien) * AV.factorEvento(dia, NF.temporadaDelDia(dia), bien);

// Vende en el puesto todo lo que puede (de lo más caro a lo más barato). `solo`: un conjunto de bienes (o null: todos). Devuelve pesos cobrados.
function venderTodo(W, nombre, dia, solo = null) {
  const temp = NF.temporadaDelDia(dia);
  W.c = CO.comercioDeHoy(W.c, dia);
  const m = ME.tienda(W.c, nombre, dia);
  let total = 0, lotes = 0;
  // el orden: lo que más paga primero
  const ids = CO.bienesDe(nombre).filter((b) => !solo || solo.includes(b));
  for (let vuelta = 0; vuelta < 200; vuelta++) {
    let mejor = null;
    for (const b of ids) {
      const p = CO.precios(W.c, nombre, b, dia, temp, factor(W, nombre, b, dia));
      if (p.quedanVenta <= 0) continue;
      const permiso = ME.puedeComprarte(m, b, aPesos(p.venta));
      if (!permiso.ok) continue;
      if (!mejor || p.venta > mejor.venta) mejor = { b, venta: p.venta };
    }
    if (!mejor) break;
    const r = CO.vender(W.c, nombre, mejor.b, dia, temp, 1e9, factor(W, nombre, mejor.b, dia));
    if (!r.ok) break;
    ME.registrarVenta(m, mejor.b, aPesos(r.precio));
    total += aPesos(r.precio); lotes++;
  }
  return { total, lotes };
}

console.log(`# El mercado de los puestos: cuánto se puede sacar por día (${DIAS} días, mercadería infinita)\n`);
const filas = [];
for (const K of [1, 2, 3, 5, 8, 11]) {
  const W = nuevoMundo();
  const porDia = [];
  for (let d = 1; d <= DIAS; d++) {
    let hoy = 0;
    for (let i = 0; i < K; i++) hoy += venderTodo(W, PARADAS[(d * 3 + i) % PARADAS.length], d).total;   // rota por los puestos
    porDia.push(hoy);
  }
  const prim = porDia.slice(0, 5).reduce((a, b) => a + b, 0) / 5, ult = porDia.slice(-30).reduce((a, b) => a + b, 0) / 30;
  filas.push({ puestosPorDia: K, primeros5dias: Math.round(prim), estable30: Math.round(ult), porPuestoEstable: Math.round(ult / K) });
}
console.table(filas);

// el mismo, pero sólo vendiendo ponchos y lana (lo que más rinde por unidad): ¿qué pasa si todo tu negocio es un bien?
console.log('\n## Vendiendo sólo ponchos (lo más caro por unidad)\n');
const f2 = [];
for (const K of [1, 3, 5, 11]) {
  const W = nuevoMundo();
  const porDia = [], lotesDia = [];
  for (let d = 1; d <= DIAS; d++) {
    let hoy = 0, l = 0;
    for (let i = 0; i < K; i++) { const r = venderTodo(W, PARADAS[(d * 3 + i) % PARADAS.length], d, ['poncho']); hoy += r.total; l += r.lotes; }
    porDia.push(hoy); lotesDia.push(l);
  }
  f2.push({ puestosPorDia: K, ponchosPorDia: +(lotesDia.slice(-30).reduce((a, b) => a + b, 0) / 30).toFixed(2), pesosPorDia: Math.round(porDia.slice(-30).reduce((a, b) => a + b, 0) / 30) });
}
console.table(f2);

// ---------------------------------------------------------------- lo que paga cada puesto por un poncho, un día cualquiera, con la caja llena
console.log('\n## Lo que dan por un poncho, por puesto (día 3, verano y día 10, invierno)\n');
const f3 = [];
for (const nombre of [...PARADAS, ...PUESTOS]) {
  const fila = { puesto: nombre, caja: ME.cajaMaxima(nombre) };
  for (const dia of [3, 10]) {
    const W = nuevoMundo(); W.c = CO.comercioDeHoy(W.c, dia);
    if (!CO.bienesDe(nombre).includes('poncho')) { fila[`poncho d${dia}`] = '-'; continue; }
    const p = CO.precios(W.c, nombre, 'poncho', dia, NF.temporadaDelDia(dia), factor(W, nombre, 'poncho', dia));
    fila[`poncho d${dia}`] = aPesos(p.venta);
  }
  f3.push(fila);
}
console.table(f3);

// ---------------------------------------------------------------- el costo de comprar: lo más barato que sale cada cosa en cualquier puesto (primer lote, día 3 y día 10)
console.log('\n## Cuánto cuesta un lote en el puesto más barato (primer lote) contra su valor base\n');
const f4 = [];
for (const b of CO.ID_BIENES) {
  const fila = { bien: b, valorLote: CO.BIENES[b].valor * 100 };
  for (const dia of [3, 10]) {
    let mejor = Infinity, donde = '';
    for (const nombre of [...PARADAS, ...PUESTOS]) {
      if (!CO.bienesDe(nombre).includes(b)) continue;
      const W = nuevoMundo(); W.c = CO.comercioDeHoy(W.c, dia);
      const p = CO.precios(W.c, nombre, b, dia, NF.temporadaDelDia(dia), factor(W, nombre, b, dia));
      if (aPesos(p.compra) < mejor) { mejor = aPesos(p.compra); donde = nombre; }
    }
    fila[`barato d${dia}`] = mejor === Infinity ? '-' : mejor;
    fila[`razon d${dia}`] = mejor === Infinity ? '-' : +(mejor / (CO.BIENES[b].valor * 100)).toFixed(2);
  }
  f4.push(fila);
}
console.table(f4);
