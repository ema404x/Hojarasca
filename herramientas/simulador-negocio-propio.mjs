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

function jugar({ tipo = 'almacen', prod = 'bueno', nivel = 1, rep0 = N.REP_INICIAL, atiende = [4, 14], dias = DIAS, lluvia = 0, siempreStock = false, surtidor = null, costoUnidad = consigna } = {}) {
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
    if (surtidor) surtidor(est, d, p); else for (const [k, n] of Object.entries(PRODUCCION[tipo][prod])) N.surtir(est, k, siempreStock ? 1e5 : n, { tengo: () => 1e5, quitar: () => {} });
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
          if (r.ok) { atendidos++; ventas += r.total; for (const v of r.vendidos) costoConsigna += costoUnidad(v.k) * v.n; if (r.faltan.length) sinStock++; }
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

// ================================================================ 4.4: con empleados (empleados-negocio.js)
// Lo mismo, pero SIN VOS en el local (estás en tus jornales, en la obra, de paseo): los vecinos contratados venden por su cuenta con las horas simuladas de
// empleados-negocio.js, se les paga de la caja (y, si no alcanza, de la billetera) y a la noche retirás lo que quedó. Se surte cada mañana con la misma producción.
const Emp = await import('../src/empleados-negocio.js');
if (process.env.EMP_LOCAL) Object.assign(Emp.EMP_LOCAL, JSON.parse(process.env.EMP_LOCAL));   // (para probar otros valores sin tocar el juego: EMP_LOCAL='{"propina":[0,0.15,0.25]}')
const PUNTOS = { conocido: 30, amigo: 60, compadre: 150 };
const nivelDe = (p) => Emp.nivelPorPuntos(p);

function conEmpleados({ tipo = 'almacen', prod = 'bueno', nivel = 1, claves = ['madre'], dias = DIAS, dias0 = 0, amistad = 'amigo', rep0 = N.REP_INICIAL, siempreStock = false, surtidor = null, costoUnidad = consigna } = {}) {
  const est = N.negocioPropioNuevo();
  est.tipo = tipo; est.abierto = true; est.rep = rep0;
  if (nivel !== 1) for (const k of N.catalogo(tipo)) est.precios[k] = nivel;
  const E = Emp.empleadosNuevo();
  const p = { modo: 'relax', dia: 1, economia: { ...E_economia() } };
  const puntos = PUNTOS[amistad];
  for (const k of claves) { const r = Emp.contratar(E, k, { tipo, dia: 1, abs: 24, puntos }); if (!r.ok) throw new Error(`no se pudo contratar a ${k}: ${r.motivo}`); r.emp.dias = dias0; }
  let ventas = 0, sueldos = 0, costo = 0, clientes = 0, unidades = 0;
  const unaVez = { tengo: () => 1e5, quitar: () => {} };
  for (let d = 1; d <= dias; d++) {
    p.dia = d;
    N.ponerAlDia(est, d);
    if (surtidor) surtidor(est, d, p); else for (const [k, n] of Object.entries(PRODUCCION[tipo][prod])) N.surtir(est, k, siempreStock ? 1e5 : n, unaVez);
    const antes = { ...est.stock }, v0 = est.total.ventas, c0 = est.total.clientes;
    const ev = Emp.avanzarEmpleados(p, est, tipo, E, { abs: (d + 1) * 24, presente: false, nivel: () => nivelDe(puntos), nombre: (k) => k, lluvia: 0 });
    ventas += est.total.ventas - v0; clientes += est.total.clientes - c0;
    for (const k of Object.keys({ ...antes, ...est.stock })) { const vendido = Math.max(0, (antes[k] || 0) - (est.stock[k] || 0)); costo += costoUnidad(k) * vendido; unidades += vendido; }
    for (const e of ev) if (e.tipo === 'sueldo') sueldos += e.monto;
    est.caja = 0;                                                       // a la noche retirás la caja (esa plata ya está contada en las ventas)
    E.visita = d + 1;                                                   // (pasás por el local cada tanto: no renuncian por ausencia)
  }
  return { ventas: ventas / dias, costo: costo / dias, sueldo: sueldos / dias, clientes: clientes / dias, neto: (ventas - sueldos) / dias, sobreMercado: (ventas - costo - sueldos) / dias, rep: est.rep, rend: Emp.rendimientoDe(E.lista[0] || { k: claves[0], dias: dias0 }, tipo, nivelDe(puntos)) };
}
function E_economia() { return { pesos: 1e9, libro: [], migrada: true, ganado: 0, gastado: 0 }; }
const filaE = (nombre, r) => console.log(`- ${nombre}: ${r.clientes.toFixed(1)} clientes/día · ventas ${$(r.ventas)}/día · sueldos ${$(r.sueldo)}/día · **neto de caja ${$(r.neto)}/día** · sobre venderlo al mercado ${$(r.sobreMercado)}/día · fama final ${r.rep.toFixed(0)}`);

console.log(`\n# Con empleados y SIN vos en el local (${DIAS} días; el sueldo sale de la caja y, si no alcanza, de la billetera)\n`);
const referencia = promedio(() => jugar({ tipo: 'almacen' }));
console.log(`Referencia, atendiendo vos todo el día (almacén, surtido bueno, normales): ventas ${$(referencia.ventas)}/día · ganancia sobre el mercado ${$(referencia.margen)}/día\n`);
for (const tipo of N.IDS_TIPOS) {
  console.log(`## ${N.TIPOS[tipo].nombre}: un empleado, de amigo, según quién es y cuántos días lleva`);
  for (const k of ['pintora', 'padre', 'modista', 'madre', 'panadera']) {
    const of = Emp.ofertaDe(k, tipo, PUNTOS.amigo);
    for (const dias0 of [0, 12, 40]) {
      const r = promedio(() => conEmpleados({ tipo, claves: [k], dias0, dias: 20 }));
      filaE(`${k} (sueldo ${$(of.sueldo)}, rinde ${(Emp.rendimientoPara(k, tipo, dias0, 1) * 100).toFixed(0)} %) con ${dias0} días`, r);
    }
  }
  console.log();
}
console.log('## Almacén: dos empleados (de amigos)');
for (const [claves, nombre] of [[['padre', 'madre'], 'padre y madre (baratos)'], [['madre', 'panadera'], 'madre y panadera (los mejores)']]) {
  for (const dias0 of [0, 40]) filaE(`${nombre} con ${dias0} días`, promedio(() => conEmpleados({ claves, dias0, dias: 20 })));
}
console.log('\n## Almacén, un empleado (madre, amiga, con 12 días): según el surtido y los precios');
filaE('surtido bueno, normales', promedio(() => conEmpleados({ claves: ['madre'], dias0: 12, dias: 20 })));
filaE('surtido bueno, baratos', promedio(() => conEmpleados({ claves: ['madre'], dias0: 12, dias: 20, nivel: 0 })));
filaE('surtido bueno, caros', promedio(() => conEmpleados({ claves: ['madre'], dias0: 12, dias: 20, nivel: 2 })));
filaE('surtido chico, normales', promedio(() => conEmpleados({ claves: ['madre'], dias0: 12, dias: 20, prod: 'chico' })));
console.log('\n## Almacén, un empleado (madre, con 12 días): según la amistad');
for (const am of ['conocido', 'amigo', 'compadre']) {
  const of = Emp.ofertaDe('madre', 'almacen', PUNTOS[am]);
  filaE(`${am} (sueldo ${$(of.sueldo)})`, promedio(() => conEmpleados({ claves: ['madre'], dias0: 12, dias: 20, amistad: am })));
}
console.log('\n## Sueldos y rendimiento de cada vecino contratable (almacén / panadería; amigo, con 0 y 40 días)');
for (const k of Emp.IDS_CANDIDATOS) {
  const a = Emp.ofertaDe(k, 'almacen', PUNTOS.amigo), b = Emp.ofertaDe(k, 'panaderia', PUNTOS.amigo);
  console.log(`- ${k}${a.dueno ? ' (con local propio)' : ''}: ${$(a.sueldo)} / ${$(b.sueldo)} por día · rinde ${(Emp.rendimientoPara(k, 'almacen', 0, 1) * 100).toFixed(0)} % → ${(Emp.rendimientoPara(k, 'almacen', 40, 1) * 100).toFixed(0)} %`);
}


// ================================================================ 4.4.1: gastos fijos del local propio y pedido al proveedor
// Todo lo anterior es SIN gastos (es el «antes» de la 4.4.1). Acá se restan los gastos fijos por día (negocio-propio-gastos.js) y se prueba el pedido al proveedor
// (negocio-propio-reposicion.js: precio de plaza + 20 %, hasta $3.000 por día y sin pasar de los estantes llenos).
const G = await import('../src/negocio-propio-gastos.js');
const Rp = await import('../src/negocio-propio-reposicion.js');
const gasto = (tipo) => G.gastoPorDia(tipo);
console.log(`\n\n# 4.4.1 · Con gastos fijos (${DIAS} días): almacén ${$(gasto('almacen'))}/día, panadería ${$(gasto('panaderia'))}/día
`);
console.log('## Atendiendo vos (precios normales): ganancia sobre venderlo al mercado, sin gastos y con gastos');
for (const tipo of N.IDS_TIPOS) for (const prod of ['bueno', 'chico']) {
  const r = promedio(() => jugar({ tipo, prod }));
  console.log(`- ${N.TIPOS[tipo].nombre}, surtido ${prod}: sin gastos ${$(r.margen)}/día → con gastos ${$(r.margen - gasto(tipo))}/día (gastos ${$(gasto(tipo))}) · se paga el local en ${r.margen - gasto(tipo) > 0 ? ((tipo === 'almacen' ? 28000 : 36000) / (r.margen - gasto(tipo))).toFixed(0) + ' días' : 'nunca'}`);
}
{
  const guardado = PRODUCCION.almacen.bueno;
  PRODUCCION.almacen.bueno = { 'pan-casero': 8, huevo: 12 };
  const r = promedio(() => jugar({ tipo: 'almacen' }));
  console.log(`- Almacén, surtido de sólo 2 cosas (pan y huevos): sin gastos ${$(r.margen)}/día → con gastos ${$(r.margen - gasto('almacen'))}/día`);
  PRODUCCION.almacen.bueno = guardado;
}
console.log('\n## Con un empleado, sin vos en el local (amigo, 12 días de trabajo): sobre el mercado, sin gastos y con gastos');
for (const tipo of N.IDS_TIPOS) for (const k of ['pintora', 'padre', 'madre']) {
  const r = promedio(() => conEmpleados({ tipo, claves: [k], dias0: 12, dias: 20 }));
  console.log(`- ${N.TIPOS[tipo].nombre}, ${k}: sin gastos ${$(r.sobreMercado)}/día → con gastos ${$(r.sobreMercado - gasto(tipo))}/día`);
}
console.log('\n## Con dos empleados (almacén, amigos, 40 días)');
for (const [claves, nombre] of [[['padre', 'madre'], 'padre y madre'], [['madre', 'panadera'], 'madre y panadera']]) {
  const r = promedio(() => conEmpleados({ claves, dias0: 40, dias: 20 }));
  console.log(`- ${nombre}: sin gastos ${$(r.sobreMercado)}/día → con gastos ${$(r.sobreMercado - gasto('almacen'))}/día`);
}

// El pedido al proveedor: cada mañana se pide lo que entra en el tope (el único surtido). Se cuenta lo que se paga por lo que se vende (plaza + 20 %), no la consigna.
const pedirCadaManana = (est, d, p) => { Rp.pedirAlProveedor(p, est, d); };
const pConPlata = () => ({ modo: 'relax', dia: 1, economia: { pesos: 1e9, libro: [], migrada: true, ganado: 0, gastado: 0 } });
console.log('\n## Si TODO el surtido viene del proveedor (precio de plaza + ' + Math.round(Rp.PROVEEDOR.recargo * 100) + ' %, tope ' + $(Rp.PROVEEDOR.topeDia) + ' por día)');
for (const tipo of N.IDS_TIPOS) {
  for (const [nivel, nombre] of [[1, 'precios normales'], [2, 'precios caros'], [0, 'precios baratos']]) {
    const r = promedio(() => {
      const p = pConPlata();
      return jugar({ tipo, nivel, surtidor: (est, d) => { p.dia = d; Rp.pedirAlProveedor(p, est, d); }, costoUnidad: Rp.precioProveedor });
    });
    console.log(`- ${N.TIPOS[tipo].nombre}, ${nombre}, atendiendo vos: ${r.clientes.toFixed(1)} clientes/día · ventas ${$(r.ventas)}/día · pagado al proveedor por lo vendido ${$(r.costo)}/día · margen ${$(r.margen)}/día → con gastos ${$(r.margen - gasto(tipo))}/día`);
  }
}
console.log('\n## Con un empleado (madre, amiga, 12 días) y todo del proveedor, almacén');
for (const [nivel, nombre] of [[1, 'precios normales'], [2, 'precios caros']]) {
  const r = promedio(() => {
    const p = pConPlata();
    return conEmpleados({ claves: ['madre'], dias0: 12, dias: 20, nivel, surtidor: (est, d) => { Rp.pedirAlProveedor(p, est, d); }, costoUnidad: Rp.precioProveedor });
  });
  console.log(`- ${nombre}: ventas ${$(r.ventas)}/día · sueldo ${$(r.sueldo)}/día · sobre lo pagado al proveedor ${$(r.sobreMercado)}/día → con gastos ${$(r.sobreMercado - gasto('almacen'))}/día`);
}
console.log('\n## Cuánto cabe en los estantes y cuánto sale llenarlos con el proveedor (estantes vacíos)');
for (const tipo of N.IDS_TIPOS) {
  const est = N.negocioPropioNuevo(); est.tipo = tipo; est.abierto = true;
  const todo = N.catalogo(tipo).reduce((s, k) => s + N.topeEstante(k) * Rp.precioProveedor(k), 0), plaza = N.catalogo(tipo).reduce((s, k) => s + N.topeEstante(k) * N.precioPlaza(k), 0);
  console.log(`- ${N.TIPOS[tipo].nombre}: llenar todo sale ${$(todo)} (${$(plaza)} de mercado); el tope de ${$(Rp.PROVEEDOR.topeDia)} por día alcanza para ${(Rp.PROVEEDOR.topeDia / todo * 100).toFixed(0)} % de eso`);
}
