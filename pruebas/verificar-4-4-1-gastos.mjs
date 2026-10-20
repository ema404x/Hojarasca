// 4.4.1: gastos fijos e impuestos del local propio, y reposición de los estantes (negocio-propio-gastos.js, negocio-propio-reposicion.js y sus enganches), en Node:
//   · los gastos por tipo de local (de $200 a $400 por día), el cobro diario adelantado (caja primero, billetera después, motivo en el libro), el día de gracia, varios días de golpe;
//   · la deuda: se acumula con tope, con dos días el local cierra solo (no vende, ni con empleados), se paga y vuelve; al desarmar se salda o se perdona;
//   · el balance del día y de la semana (ventas, sueldos, gastos, proveedor);
//   · el empleado repone los estantes desde los depósitos (qué productos, cuántos lotes según el rendimiento, el depósito se vacía de verdad, el más vacío primero, una vez por día);
//   · el pedido al proveedor (recargo del 20 %, tope diario, sin pasar de los estantes llenos, caja primero y billetera con motivo «Proveedor»);
//   · el guardado (partida vieja con valores por defecto, basura, ida y vuelta) y el juego con un contexto de mentira (cobro al cambiar el día, el panel);
//   · el cableado (main.js, almacen-juego.js, sin mando ni textos en otro idioma).
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const N = await import('../src/negocio-propio.js');
const G = await import('../src/negocio-propio-gastos.js');
const R = await import('../src/negocio-propio-reposicion.js');
const M = await import('../src/empleados-negocio.js');
const JE = await import('../src/empleados-negocio-juego.js');
const JN = await import('../src/negocio-propio-juego.js');
const JA = await import('../src/almacen-juego.js');
const AL = await import('../src/almacen.js');
const E = await import('../src/economia.js');
const A = await import('../src/aldea.js');
const V = await import('../src/vecindad.js');
const PN = await import('../src/planos-negocio.js');
const { PLANO } = await import('../src/construccion.js');
const { BIENES } = await import('../src/comercio.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; if (process.env.VERBOSO) console.log('  ' + m); };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

const ilimitado = { tengo: () => 1e5, quitar: () => {} };
const gA = G.gastoPorDia('almacen');
const pesos$ = (v) => '$' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const re$ = (v) => pesos$(v).replace(/[$.]/g, '\\$&');
const plata = (pesos, dia = 5) => ({ modo: 'relax', dia, horas: 10, economia: { ...E.economiaNueva(), pesos } });
const abierto = (tipo = 'almacen', dia = 5) => { const e = N.negocioPropioNuevo(); e.tipo = tipo; e.abierto = true; e.fin.activa = true; e.fin.ultimo = dia; N.ponerAlDia(e, dia); return e; };
const libro = (p, i = 1) => p.economia.libro.at(-i);

// ---------------------------------------------------------------- 1. los gastos por tipo de local
{
  eq(Object.keys(G.GASTOS_DIA).sort(), [...N.IDS_TIPOS].sort(), 'hay gastos para cada tipo de local');
  for (const tipo of N.IDS_TIPOS) {
    const g = G.gastoPorDia(tipo);
    ok(g >= 200 && g <= 400, `${tipo}: gastos de $${g} por día, entre $200 y $400`);
    eq(Object.keys(G.GASTOS_DIA[tipo]).sort(), ['alquiler', 'impuesto', 'luz'], `${tipo}: alquiler, impuesto y luz`);
    ok(Object.values(G.GASTOS_DIA[tipo]).every((v) => Number.isInteger(v) && v > 0), `${tipo}: cada concepto es un monto entero`);
    eq(G.topeDeuda(tipo), g * 5, `${tipo}: la deuda llega a 5 días de gastos y no más`);
    eq(G.deudaQueCierra(tipo), g * 2, `${tipo}: con dos días de deuda cierra solo`);
  }
  ok(G.gastoPorDia('almacen') !== G.gastoPorDia('panaderia'), 'cada tipo paga lo suyo');
  eq([G.gastoPorDia('x'), G.gastoPorDia(null), G.gastoPorDia('__proto__'), G.gastoPorDia('toString')], [0, 0, 0, 0], 'un tipo que no existe no paga nada (ni nombres raros)');
  eq(G.TEXTO_GASTOS, 'alquiler, impuesto y luz', 'el texto del panel');
  // lo que hace el local comprado a un vecino es parecido: el local propio queda en el mismo rango de los comprados ($200 a $350)
  const NV = await import('../src/negocios-vecinos.js');
  const comprados = Object.values(NV.NEGOCIOS || {}).map((x) => x.gastos).filter((x) => x > 0);
  if (comprados.length) ok(Math.min(...comprados) <= G.gastoPorDia('almacen') && G.gastoPorDia('almacen') <= Math.max(...comprados) + 100, `parecido al de los negocios comprados ($${Math.min(...comprados)} a $${Math.max(...comprados)})`);
}

// ---------------------------------------------------------------- 2. el estado guardado
{
  const f = G.finNuevo();
  eq([f.v, f.activa, f.ultimo, f.deuda, f.reponer, f.dias.length], [1, false, 0, 0, true, 0], 'un local nuevo: sin cuenta ni deuda, con la reposición prendida');
  eq(N.negocioPropioNuevo().fin, f, 'negocioPropioNuevo trae la cuenta');
  // una partida de antes: sin `fin`
  const v = { v: 1, tipo: 'almacen', abierto: true, stock: { huevo: 5 }, precios: {}, rep: 40, caja: 300, hoy: { dia: 8 }, total: {} };
  const s = N.sanearNegocioPropio(v, 10);
  eq([s.fin.activa, s.fin.ultimo, s.fin.deuda, s.fin.reponer], [true, 10, 0, false], 'partida vieja con el local abierto: sin deuda, paga desde mañana, con la reposición apagada');
  eq([s.caja, s.stock, s.rep], [300, { huevo: 5 }, 40], '… y lo demás queda como estaba');
  const s2 = N.sanearNegocioPropio({ ...v, abierto: false }, 10);
  eq([s2.fin.activa, s2.fin.ultimo], [false, 0], 'partida vieja con el local cerrado: todavía no paga nada');
  eq(N.sanearNegocioPropio(null, 4).fin, G.finNuevo(), 'sin nada guardado: el estado nuevo');
  // ida y vuelta
  const e = abierto('panaderia', 12);
  e.fin.deuda = 300; e.fin.reponer = false; e.fin.prov = { dia: 12, gastado: 900 }; e.fin.total.gastos = 5000;
  G.anotarFin(e, 11, 'gastos', 250); G.anotarFin(e, 12, 'sueldos', 800);
  eq(N.sanearNegocioPropio(JSON.parse(JSON.stringify(e)), 12).fin, e.fin, 'ida y vuelta: la cuenta vuelve igual');
  // basura
  const basura = [null, 7, 'x', [], {}, { activa: 'si', ultimo: 'x', deuda: 'x' }, { activa: true, ultimo: 1e12, deuda: 1e12, dias: 'x', prov: 5, total: 'x' },
    { activa: true, ultimo: 3, deuda: -50, dias: [null, 4, { dia: -1 }, { dia: 99999 }, { dia: 5, ventas: 'x', gastos: -3 }, { dia: 5, ventas: 9 }, { dia: 3, sueldos: 1e15 }], prov: { dia: 1e9, gastado: -2 } }];
  for (const rota of basura) {
    const t = N.sanearNegocioPropio({ v: 1, tipo: 'almacen', abierto: true, fin: rota }, 20).fin;
    ok(t.v === 1 && typeof t.activa === 'boolean' && t.ultimo >= 0 && t.ultimo <= 20, `basura (${JSON.stringify(rota)?.slice(0, 40)}): una cuenta sana`);
    ok(t.deuda >= 0 && t.deuda <= G.topeDeuda('almacen'), '… con la deuda en rango');
    ok(t.dias.length <= G.BALANCE_DIAS && t.dias.every((d, i) => d.dia >= 1 && d.dia <= 20 && d.ventas >= 0 && d.gastos >= 0 && d.ventas <= 1e8 && (i === 0 || t.dias[i - 1].dia < d.dia)), '… y el balance ordenado, sin días repetidos ni del futuro');
    ok(t.prov.dia <= 20 && t.prov.gastado >= 0 && typeof t.reponer === 'boolean', '… y el proveedor en rango');
  }
  eq(N.sanearNegocioPropio({ tipo: null, fin: { activa: true, deuda: 500 } }, 5).fin.deuda, 0, 'sin local no se debe nada');
  // negocioPropioDe completa un estado armado a mano
  const p = { modo: 'relax', dia: 3, economia: E.economiaNueva(), negocioPropio: { v: 1, tipo: 'almacen', abierto: true, stock: {}, precios: {}, rep: 25, caja: 0, hoy: { dia: 0 }, total: {} } };
  ok(N.negocioPropioDe(p).fin.activa === true, 'negocioPropioDe completa la cuenta de un local armado a mano');
  eq(N.negocioPropioDe({ modo: 'desafio', economia: E.economiaNueva() }), null, 'el Desafío no tiene negocio ni gastos');
}

// ---------------------------------------------------------------- 3. el cobro diario
{
  const g = G.gastoPorDia('almacen');
  // el día que abrís es de gracia
  const p = plata(5000, 5);
  const e = N.negocioPropioNuevo(); e.tipo = 'almacen'; e.abierto = true;
  eq(G.cobrarGastos(p, e, 5), null, 'el día que abrís no se cobra');
  eq([e.fin.activa, e.fin.ultimo], [true, 5], '… y arranca la cuenta');
  eq(G.cobrarGastos(p, e, 5), null, 'ni dos veces el mismo día');
  eq(E.pesosDe(p), 5000, 'la billetera está intacta');
  // el día siguiente se cobra, de la caja primero
  e.caja = 1000;
  const r = G.cobrarGastos(p, e, 6);
  ok(r && r.dias === 1 && r.gasto === g && r.pago.ok && r.pago.deCaja === g && r.pago.deBilletera === 0, `día 6: ${g} de la caja`);
  eq([e.caja, E.pesosDe(p), e.fin.deuda, e.fin.ultimo], [1000 - g, 5000, 0, 6], '… la caja baja, la billetera no, sin deuda');
  eq(p.economia.libro.length, 0, 'lo que sale de la caja no pasa por el libro de la billetera');
  eq(G.cobrarGastos(p, e, 6), null, 'otra vez el mismo día: nada');
  // la caja no alcanza: el resto sale de la billetera con motivo claro
  e.caja = 100;
  const r2 = G.cobrarGastos(p, e, 7);
  ok(r2.pago.ok && r2.pago.deCaja === 100 && r2.pago.deBilletera === g - 100, 'día 7: 100 de la caja y el resto de la billetera');
  eq([e.caja, E.pesosDe(p)], [0, 5000 - (g - 100)], '… cada uno baja lo suyo');
  ok(libro(p).monto === -(g - 100) && /Gastos del local/.test(libro(p).motivo) && /alquiler, impuesto y luz/.test(libro(p).motivo), `el libro lo dice: «${libro(p).motivo}» ${libro(p).monto}`);
  eq(p.economia.gastado, g - 100, 'y suma a lo gastado');
  eq(e.fin.total.gastos, 0 + g + g, 'el total de gastos pagados');
  // todo de la billetera
  const r3 = G.cobrarGastos(p, e, 8);
  ok(r3.pago.deCaja === 0 && r3.pago.deBilletera === g, 'día 8: todo de la billetera');
  // el balance anota el gasto de cada día
  eq(e.fin.dias.map((d) => [d.dia, d.gastos]), [[6, g], [7, g], [8, g]], 'el balance guarda el gasto de cada día');
  // varios días de golpe (cargaste la partida, dormiste): se cobran los que pasaron, hasta 7
  const q = plata(100000, 10), f = abierto('almacen', 10);
  const r4 = G.cobrarGastos(q, f, 13);
  ok(r4.dias === 3 && r4.gasto === 3 * g, 'tres días de golpe: se cobran los tres');
  const r5 = G.cobrarGastos(q, f, 500);
  ok(r5.dias === G.DIAS_ACUM_MAX && r5.gasto === G.DIAS_ACUM_MAX * g, `si pasan 487 días, se cobran sólo ${G.DIAS_ACUM_MAX}: no se acumula más`);
  eq(f.fin.ultimo, 500, '… y la cuenta queda al día');
  ok(f.fin.dias.length <= G.BALANCE_DIAS, 'el balance guarda pocos días');
  // un reloj que vuelve para atrás (cargaste una partida vieja) no cobra dos veces
  const h = abierto('almacen', 20);
  eq(G.cobrarGastos(plata(1e5, 12), h, 12), null, 'un día anterior no cobra nada');
  eq(h.fin.ultimo, 12, '… y la cuenta se acomoda al reloj');
  // cerrado (pero abierto alguna vez) también paga: el cartel no apaga la luz
  const c = abierto('almacen', 5); c.abierto = false;
  ok(G.cobrarGastos(plata(1e5, 6), c, 6)?.pago.ok === true, 'el local cerrado también paga sus gastos');
  // un local que nunca abrió no paga
  const z = N.negocioPropioNuevo(); z.tipo = 'almacen';
  eq(G.cobrarGastos(plata(1e5, 6), z, 6), null, 'un local que nunca abrió no paga');
  eq(G.cobrarGastos(plata(1e5, 7), z, 9), null, '… por más días que pasen');
  // sin economía (el Desafío) o sin tipo, nada
  eq(G.cobrarGastos({ modo: 'desafio' }, abierto(), 9), null, 'el Desafío no cobra');
  const s = abierto(); s.tipo = null;
  eq(G.cobrarGastos(plata(1e5, 9), s, 9), null, 'sin tipo de local no se cobra');
  // cada tipo paga lo suyo
  for (const tipo of N.IDS_TIPOS) {
    const pp = plata(1e5, 6), ee = abierto(tipo, 5), rr = G.cobrarGastos(pp, ee, 6);
    eq(rr.gasto, G.gastoPorDia(tipo), `${tipo}: paga ${G.gastoPorDia(tipo)}`);
    eq(1e5 - E.pesosDe(pp), G.gastoPorDia(tipo), `${tipo}: y es lo que baja de la billetera`);
  }
}

// ---------------------------------------------------------------- 4. la deuda
{
  const g = G.gastoPorDia('almacen');
  const p = plata(0, 5), e = abierto('almacen', 5);
  const r1 = G.cobrarGastos(p, e, 6);
  ok(!r1.pago.ok && r1.deuda === g && !r1.cerroAhora, 'sin plata: el primer día queda de deuda y el local sigue abierto');
  ok(G.hayDeuda(e) && !G.cerradoPorDeuda(e) && G.abiertoDeVerdad(e), '… con una deuda chica no cierra');
  eq(N.avisoDelLocal(e, 'almacen', N.colaNueva(), 12).includes('debés'), false, 'sin mercadería el aviso es el de siempre');
  e.stock = { huevo: 6 };
  ok(new RegExp('debés ' + re$(gA) + ' de gastos').test(N.avisoDelLocal(e, 'almacen', N.colaNueva(), 12)), `el aviso lo dice: «${N.avisoDelLocal(e, 'almacen', N.colaNueva(), 12)}»`);
  const r2 = G.cobrarGastos(p, e, 7);
  ok(r2.cerroAhora && r2.deuda === 2 * g && G.cerradoPorDeuda(e) && !G.abiertoDeVerdad(e), 'el segundo día cierra solo');
  ok(e.abierto === true, '… pero lo tuyo no se toca: la bandera de abierto sigue como la dejaste');
  ok(new RegExp('cerrado por una deuda de ' + re$(2 * gA)).test(N.avisoDelLocal(e, 'almacen', N.colaNueva(), 12)) && /mantené E/.test(N.avisoDelLocal(e, 'almacen', N.colaNueva(), 12)), `el cartel del local dice que hay deuda: «${N.avisoDelLocal(e, 'almacen', N.colaNueva(), 12)}»`);
  eq(N.vistaDelLocal(e).abierto, false, 'el cartel del edificio queda en «cerrado»');
  // cerrado: no entra nadie
  const cola = N.colaNueva();
  e.stock = {}; for (const k of N.catalogo('almacen')) N.surtir(e, k, 1e5, ilimitado);
  let llegan = 0;
  for (let i = 0; i < 400; i++) llegan += N.avanzarCola(cola, e, 'almacen', 1, 0.05, { hora: 12, dia: 7, presente: true, max: 3 }).filter((x) => x.tipo === 'llega').length;
  eq(llegan, 0, 'cerrado por deuda no llegan clientes');
  const abre = abierto('almacen', 7); abre.stock = { ...e.stock };
  const cola2 = N.colaNueva(); let llegan2 = 0;
  for (let i = 0; i < 400; i++) llegan2 += N.avanzarCola(cola2, abre, 'almacen', 1, 0.05, { hora: 12, dia: 7, presente: true, max: 3 }).filter((x) => x.tipo === 'llega').length;
  ok(llegan2 > 0, 'y con el mismo estante, sin deuda, sí llegan');
  // con empleados tampoco se vende
  const Em = M.empleadosNuevo();
  M.contratar(Em, 'madre', { tipo: 'almacen', dia: 3, abs: 3 * 24 + 8, puntos: 60 });
  const rs = M.simularTramo(e, 'almacen', Em, 8 * 24 + 9, 8 * 24 + 19, { nivel: () => 1 });
  eq([rs.ventas, rs.clientes], [0, 0], 'con el local cerrado por deuda ni los empleados venden');
  const ab = abierto('almacen', 8); ab.stock = { ...e.stock };
  const rs2 = M.simularTramo(ab, 'almacen', Em, 8 * 24 + 9, 8 * 24 + 19, { nivel: () => 1 });
  ok(rs2.ventas > 0, '… y sin deuda sí');
  // sigue acumulando hasta el tope
  for (let d = 8; d <= 20; d++) G.cobrarGastos(p, e, d);
  eq(e.fin.deuda, G.topeDeuda('almacen'), 'la deuda tiene tope (5 días)');
  // pagar a mano sin alcanzar
  const f1 = G.pagarDeudaAMano(p, e);
  ok(!f1.ok && f1.falta === G.topeDeuda('almacen') && f1.monto === 0, `sin plata no se paga: faltan $${f1.falta}`);
  eq(e.fin.deuda, G.topeDeuda('almacen'), '… y la deuda sigue igual');
  // la caja y la billetera juntas alcanzan
  e.caja = 1000; p.economia.pesos = 800;
  const f2 = G.pagarDeudaAMano(p, e);
  const T = G.topeDeuda('almacen');
  ok(f2.ok && f2.monto === T && f2.deCaja === 1000 && f2.deBilletera === T - 1000 && f2.abrioAhora, 'con la caja y la billetera se paga todo, y el local vuelve a abrir');
  eq([e.caja, E.pesosDe(p), e.fin.deuda], [0, 800 - (T - 1000), 0], '… cada uno puso lo suyo');
  ok(/Gastos del local/.test(libro(p).motivo) && libro(p).monto === -(T - 1000), 'el libro anota la parte de la billetera');
  ok(G.abiertoDeVerdad(e) && !G.cerradoPorDeuda(e), 'y vuelve a atender');
  eq(G.pagarDeudaAMano(p, e).monto, 0, 'sin deuda no hay nada que pagar');
  // pagar de golpe con el cobro del día (se paga lo atrasado junto con lo de hoy)
  const p2 = plata(0, 5), e2 = abierto('almacen', 5);
  G.cobrarGastos(p2, e2, 6); G.cobrarGastos(p2, e2, 7);
  ok(G.cerradoPorDeuda(e2), 'dos días sin plata: cerrado');
  p2.economia.pesos = 5000;
  const r3 = G.cobrarGastos(p2, e2, 8);
  ok(r3.pago.ok && r3.pago.monto === 3 * g && r3.abrioAhora && !G.cerradoPorDeuda(e2), 'con plata, el cobro del día paga lo atrasado y el local reabre');
  // al desarmar: se salda o se perdona
  const p3 = plata(0, 5), e3 = abierto('almacen', 5); e3.stock = { huevo: 5 }; e3.caja = 900;
  G.cobrarGastos(p3, e3, 6);
  eq(e3.fin.deuda, 0, 'con la caja llena, el cobro sale de la caja');
  e3.caja = 0; G.cobrarGastos(p3, e3, 7); ok(e3.fin.deuda === g, 'deuda de un día');
  e3.caja = 500;
  const devueltas = [], cierre = N.cerrarLocal(p3, e3, (k, c) => devueltas.push([k, c]));
  ok(cierre.deuda === g && cierre.deudaPagada === true, 'al desarmar se paga lo que se debía con la caja');
  eq([e3.fin.activa, e3.fin.deuda, e3.fin.ultimo, e3.tipo], [false, 0, 0, null], '… la cuenta se detiene');
  eq(E.pesosDe(p3), 500 - gA, '… lo que queda de la caja pasa a la billetera');
  const p4 = plata(0, 5), e4 = abierto('almacen', 5);
  G.cobrarGastos(p4, e4, 6); G.cobrarGastos(p4, e4, 7);
  const c4 = N.cerrarLocal(p4, e4, () => {});
  ok(c4.deuda === 2 * g && c4.deudaPagada === false && e4.fin.deuda === 0, 'y si no hay con qué pagarla, se perdona (pierde el local, no más)');
}

// ---------------------------------------------------------------- 5. el balance
{
  const g = G.gastoPorDia('almacen');
  const e = abierto('almacen', 10);
  e.hoy.ventas = 1800;
  eq(G.balanceDe(e, 10, 1), { ventas: 1800, sueldos: 0, gastos: 0, proveedor: 0, neto: 1800 }, 'hoy: lo vendido hasta ahora');
  G.anotarFin(e, 10, 'gastos', g); G.anotarFin(e, 10, 'sueldos', 600);
  eq(G.balanceDe(e, 10, 1).neto, 1800 - g - 600, 'hoy: ventas menos gastos y sueldos');
  // al cambiar el día, lo vendido pasa al balance
  N.ponerAlDia(e, 11);
  eq(e.fin.dias.find((d) => d.dia === 10).ventas, 1800, 'al cerrar el día lo vendido queda anotado');
  e.hoy.ventas = 500; G.anotarFin(e, 11, 'gastos', g);
  eq(G.balanceDe(e, 11, 1), { ventas: 500, sueldos: 0, gastos: g, proveedor: 0, neto: 500 - g }, 'el balance de hoy es sólo de hoy');
  eq(G.balanceDe(e, 11, 7), { ventas: 2300, sueldos: 600, gastos: 2 * g, proveedor: 0, neto: 2300 - 600 - 2 * g }, 'el de la semana suma los dos días');
  // la semana tiene 7 días y se guardan 8
  for (let d = 12; d <= 25; d++) { e.hoy.ventas = 100; N.ponerAlDia(e, d); G.anotarFin(e, d, 'gastos', g); }
  ok(e.fin.dias.length <= G.BALANCE_DIAS, `se guardan a lo sumo ${G.BALANCE_DIAS} días`);
  const sem = G.balanceDe(e, 25, 7);
  ok(sem.gastos === 7 * g && sem.ventas === 6 * 100, `la semana son 7 días (gastos ${sem.gastos}, ventas ${sem.ventas})`);
  ok(sem.gastos === 7 * gA && G.textoBalance(sem) === `ventas $600 · sueldos $0 · gastos ${pesos$(7 * gA)} = ${600 - 7 * gA < 0 ? '−' : '+'}${pesos$(Math.abs(600 - 7 * gA))}`, `el texto: «${G.textoBalance(sem)}»`);
  ok(/= \+\$100$/.test(G.textoBalance({ ventas: 300, sueldos: 100, gastos: 100, proveedor: 0, neto: 100 })), 'el neto positivo lleva su +');
  ok(/proveedor \$250/.test(G.textoBalance({ ventas: 0, sueldos: 0, gastos: 0, proveedor: 250, neto: -250 })), 'y el proveedor se muestra sólo si hubo');
  ok(!/proveedor/.test(G.textoBalance(sem)), '… y no se muestra si no hubo');
  // las líneas del panel
  const L = G.lineasFinanzas(e, 'almacen', 25);
  eq(L.map((l) => l.t), ['Gastos por día', 'Balance de hoy', 'Balance de la semana'], 'el panel: gastos por día y los dos balances');
  ok(L[0].v.startsWith(`${pesos$(gA)} (alquiler, impuesto y luz)`), `«Gastos por día: ${L[0].v}»`);
  e.fin.deuda = gA;
  const L2 = G.lineasFinanzas(e, 'almacen', 25);
  ok(L2.length === 4 && L2[3].alerta === true && L2[3].v.includes(pesos$(gA)), 'con deuda, una línea más, marcada como alerta');
  e.fin.deuda = 700;
  ok(/el local cerró solo/.test(G.lineasFinanzas(e, 'almacen', 25)[3].v), 'y si cerró, lo dice');
  const nuevo = N.negocioPropioNuevo(); nuevo.tipo = 'almacen';
  ok(/desde el día siguiente a abrir/.test(G.lineasFinanzas(nuevo, 'almacen', 3)[0].v), 'antes de abrir, avisa que se cobra desde el día siguiente');
  // los sueldos de los empleados van al balance
  const p = plata(1e5, 20), est = abierto('almacen', 20); est.caja = 5000;
  const Em = M.empleadosNuevo(); M.contratar(Em, 'madre', { tipo: 'almacen', dia: 18, abs: 18 * 24 + 9, puntos: 60 });
  const ev = M.avanzarEmpleados(p, est, 'almacen', Em, { abs: 20 * 24 + 22, presente: true, nivel: () => 1, nombre: (k) => k });
  const pagados = ev.filter((x) => x.tipo === 'sueldo').reduce((s, x) => s + x.monto, 0);
  ok(pagados > 0 && G.balanceDe(est, 20, 7).sueldos + G.balanceDe(est, 19, 7).sueldos >= pagados, `los sueldos pagados ($${pagados}) quedan en el balance`);
}

// ---------------------------------------------------------------- 6. el empleado repone desde los depósitos
{
  eq(R.reponibles('almacen').sort(), ['lana', 'papa', 'piedra', 'tabla', 'tronco'], 'en el almacén se reponen troncos, tablas, piedras, lana y papas');
  eq(R.reponibles('panaderia'), [], 'en la panadería nada se guarda en los depósitos: no aplica');
  ok(R.aplicaReposicion('almacen') && !R.aplicaReposicion('panaderia'), 'aplica sólo al almacén');
  eq(R.depositosPara('piedra').sort(), ['barraca', 'deposito-piedra', 'pila-piedra'], 'la piedra está en la pila, el depósito y la barraca');
  eq(R.depositosPara('papa'), ['silo'], 'las papas, en el silo');
  eq(R.depositosPara('tabla'), ['barraca'], 'las tablas, en la barraca');
  eq(R.depositosPara('huevo'), [], 'los huevos no se guardan en depósitos');
  ok(!R.depositosPara('hacha').length && !R.depositosPara('piedra').includes('herramientero'), 'el herramientero no es un depósito de mercadería');
  for (const k of R.reponibles('almacen')) ok(N.catalogo('almacen').includes(k) && BIENES[k], `${k} lo vende el local y existe en el mercado`);
  // cuántos lotes por turno según el rendimiento
  eq([R.lotesPorTurno(0.55), R.lotesPorTurno(0.62), R.lotesPorTurno(0.85), R.lotesPorTurno(0.9), R.lotesPorTurno(1)], [5, 5, 7, 7, 8], 'de 5 a 8 lotes por turno según lo que rinde');
  ok(R.lotesPorTurno(0) >= 1 && R.lotesPorTurno(NaN) >= 1 && R.lotesPorTurno(9) === R.lotesPorTurno(1), 'valores raros no rompen');
  ok(R.lotesPorTurno(0.85) > R.lotesPorTurno(0.58), 'el que rinde más repone más');
  // un depósito de mentira
  const mundo = (inv) => { const gastos = []; return { gastos, dep: { n: 1, hay: (k) => inv[k] || 0, sacar: (k, c) => { const t = Math.min(c, inv[k] || 0); inv[k] = (inv[k] || 0) - t; gastos.push([k, t]); return t; } } }; };
  const est = abierto('almacen', 5);
  const inv = { tronco: 100, tabla: 100, piedra: 100, lana: 100, papa: 100 };
  const w = mundo(inv);
  const r = R.reponerDesdeDepositos(est, 'almacen', 0.6, w.dep);
  eq(r.lotes, 5, 'rinde 60 %: repone 5 lotes');
  const total = r.puesto.reduce((s, x) => s + x.n, 0);
  eq(total, Object.keys(inv).reduce((s, k) => s + (100 - inv[k]), 0), 'lo que se puso en los estantes es exactamente lo que salió de los depósitos');
  eq(r.puesto.reduce((s, x) => ({ ...s, [x.k]: x.n }), {}), Object.fromEntries(R.reponibles('almacen').map((k) => [k, est.stock[k] || 0]).filter(([, c]) => c > 0)), 'y es lo que quedó en los estantes');
  ok(R.reponibles('almacen').every((k) => (est.stock[k] || 0) <= N.topeEstante(k)), 'sin pasar el tope de ningún estante');
  ok(Object.values(w.gastos).length >= 5, 'sacó lote a lote');
  // el más vacío primero, de a un lote, repartido
  const e2 = abierto('almacen', 5); e2.stock = { tabla: 20, piedra: 2 };
  const inv2 = { tronco: 50, tabla: 50, piedra: 50, lana: 50, papa: 50 };
  const r2 = R.reponerDesdeDepositos(e2, 'almacen', 0.6, mundo(inv2).dep);
  ok(e2.stock.tronco > 0 && e2.stock.lana > 0 && e2.stock.papa > 0 && e2.stock.piedra > 2, 'repone primero los estantes vacíos o casi vacíos');
  ok(!(e2.stock.tabla > 20), 'y no toca el que ya está lleno (por encima del 60 %)');
  eq(r2.lotes, 5, '… y gasta sus 5 lotes');
  // el depósito vacío no da nada y no rompe
  const e3 = abierto('almacen', 5);
  const r3 = R.reponerDesdeDepositos(e3, 'almacen', 0.9, mundo({}).dep);
  eq([r3.lotes, r3.puesto], [0, []], 'sin nada en los depósitos no repone');
  const r3b = R.reponerDesdeDepositos(e3, 'almacen', 0.9, { n: 0, hay: () => 0, sacar: () => 0 });
  eq(r3b.puesto, [], 'sin depósitos tampoco');
  eq(R.reponerDesdeDepositos(e3, 'almacen', 0.9, null).puesto, [], 'sin acceso a depósitos, nada');
  // sólo lo que hay
  const e4 = abierto('almacen', 5);
  const inv4 = { piedra: 3 };
  const r4 = R.reponerDesdeDepositos(e4, 'almacen', 0.9, mundo(inv4).dep);
  eq([e4.stock.piedra, inv4.piedra, r4.lotes], [3, 0, 1], 'si el depósito tiene 3 piedras, lleva 3 (no un lote entero)');
  // no pasa de los estantes llenos
  const e5 = abierto('almacen', 5);
  const inv5 = { tabla: 1000 };
  R.reponerDesdeDepositos(e5, 'almacen', 1, mundo(inv5).dep);
  ok(e5.stock.tabla <= N.topeEstante('tabla') && e5.stock.tabla === Math.min(N.topeEstante('tabla'), 8 * BIENES.tabla.lote), `con un solo producto, llena hasta ${e5.stock.tabla} (tope ${N.topeEstante('tabla')})`);
  // un local de otro tipo, o que no es el tuyo, no se repone
  const e6 = abierto('panaderia', 5);
  eq(R.reponerDesdeDepositos(e6, 'panaderia', 1, mundo({ tronco: 99 }).dep).puesto, [], 'la panadería no repone nada');
  eq(R.reponerDesdeDepositos(e6, 'almacen', 1, mundo({ tronco: 99 }).dep).puesto, [], 'ni un local que no es del tipo');
  // la llenura de arranque: los que están por encima del 60 % no se tocan
  const e7 = abierto('almacen', 5); e7.stock = { tronco: Math.ceil(N.topeEstante('tronco') * 0.7) };
  const inv7 = { tronco: 99 };
  R.reponerDesdeDepositos(e7, 'almacen', 1, mundo(inv7).dep);
  eq(inv7.tronco, 99, 'un estante al 70 % no se repone');
  // lo repuesto queda a la vista de la mercadería sumada
  const acum = {}; R.sumarRepuesto(acum, [{ k: 'tabla', n: 4 }]); R.sumarRepuesto(acum, [{ k: 'tabla', n: 4 }, { k: 'piedra', n: 2 }]);
  eq(acum, { tabla: 8, piedra: 2 }, 'se suma lo repuesto');
}

// ---------------------------------------------------------------- 7. la reposición dentro de las ventas sin vos
{
  const mundo = (inv) => { let llamadas = 0; return { llamadas: () => llamadas, dep: () => { llamadas++; return { n: 1, hay: (k) => inv[k] || 0, sacar: (k, c) => { const t = Math.min(c, inv[k] || 0); inv[k] = (inv[k] || 0) - t; return t; } }; } }; };
  const armar = (reponer = true) => {
    const est = abierto('almacen', 5); est.fin.reponer = reponer;
    for (const k of ['huevo', 'pan-casero', 'miel', 'harina', 'poncho']) N.surtir(est, k, 1e5, ilimitado);
    const Em = M.empleadosNuevo(); M.contratar(Em, 'madre', { tipo: 'almacen', dia: 3, abs: 3 * 24 + 8, puntos: 60 });
    Em.lista[0].dias = 30;
    return { est, Em };
  };
  const lunes = 8 * 24;   // día 8 (viernes): hay turno
  const { est, Em } = armar(true);
  const inv = { tronco: 200, tabla: 200, piedra: 200, lana: 200, papa: 200 }, w = mundo(inv);
  const antes = Object.values(inv).reduce((s, x) => s + x, 0);
  const r = M.simularTramo(est, 'almacen', Em, lunes + 8.5, lunes + 12, { nivel: () => 1, depositos: w.dep });
  const salio = antes - Object.values(inv).reduce((s, x) => s + x, 0);
  ok(salio > 0 && Object.values(r.repuesto).reduce((s, x) => s + x, 0) === salio, `repone al empezar el turno: ${salio} unidades, todas salidas del depósito`);
  eq(w.llamadas(), 1, 'arma el acceso a los depósitos una sola vez');
  eq(Em.lista[0].repuestoDia, 8, 'y anota que ese día ya repuso');
  const tras = Object.values(inv).reduce((s, x) => s + x, 0);
  M.simularTramo(est, 'almacen', Em, lunes + 12, lunes + 18, { nivel: () => 1, depositos: w.dep });
  eq(Object.values(inv).reduce((s, x) => s + x, 0), tras, 'una vez por día: a la tarde no repone de nuevo');
  eq(w.llamadas(), 1, '… ni siquiera mira los depósitos');
  M.simularTramo(est, 'almacen', Em, lunes + 24 + 8.5, lunes + 24 + 12, { nivel: () => 1, depositos: w.dep });
  ok(Em.lista[0].repuestoDia === 9, 'al día siguiente repone de nuevo');
  // apagado en el panel: no repone
  const off = armar(false), inv2 = { tronco: 200, tabla: 200, piedra: 200, lana: 200, papa: 200 }, w2 = mundo(inv2);
  M.simularTramo(off.est, 'almacen', off.Em, lunes + 8.5, lunes + 12, { nivel: () => 1, depositos: w2.dep });
  eq([Object.values(inv2).reduce((s, x) => s + x, 0), w2.llamadas()], [1000, 0], 'con la reposición apagada no toca los depósitos');
  // sin acceso a depósitos (el ctx no lo trae), igual vende
  const sin = armar(true);
  const rs = M.simularTramo(sin.est, 'almacen', sin.Em, lunes + 8.5, lunes + 19, { nivel: () => 1 });
  ok(rs.ventas > 0 && Object.keys(rs.repuesto).length === 0, 'sin depósitos disponibles el local vende igual');
  // fuera del turno, ni se mira
  const fuera = armar(true), w3 = mundo({ tronco: 99 });
  M.simularTramo(fuera.est, 'almacen', fuera.Em, lunes + 3, lunes + 7, { nivel: () => 1, depositos: w3.dep });
  eq(w3.llamadas(), 0, 'antes del turno no repone');
  // avanzarEmpleados lo cuenta para el resumen al volver
  const p = plata(1e5, 9), a = armar(true);
  a.Em.visita = 9;
  const inv4 = { tronco: 60, tabla: 60, piedra: 60, lana: 60, papa: 60 }, w4 = mundo(inv4);
  M.avanzarEmpleados(p, a.est, 'almacen', a.Em, { abs: 8 * 24 + 8.5, presente: true, nivel: () => 1, nombre: (k) => k, depositos: w4.dep });
  a.Em.visita = 8;
  M.avanzarEmpleados(p, a.est, 'almacen', a.Em, { abs: 8 * 24 + 13, presente: false, nivel: () => 1, nombre: (k) => k, depositos: w4.dep });
  const rep = a.Em.pend.repuesto;
  ok(Object.keys(rep).length > 0 && Object.values(rep).every((x) => x > 0), `lo repuesto queda en lo pendiente: ${JSON.stringify(rep)}`);
  ok(a.est.fin.total.reposicion === Object.values(rep).reduce((s, x) => s + x, 0), 'y en el total de la cuenta');
  ok(M.hayPendiente(a.Em), 'cuenta como algo para contarte al volver');
  const res = M.resumenAlVolver(a.Em, (k) => k);
  ok(/Repusieron los estantes con lo de tus depósitos: /.test(res.sub), `«${res.sub}»`);
  M.limpiarPendiente(a.Em);
  eq(a.Em.pend.repuesto, {}, 'al contarlo se limpia');
  // estando vos, no reponen (las horas con vos no se simulan)
  const presente = armar(true), w5 = mundo({ tronco: 99 });
  M.avanzarEmpleados(plata(1e5, 9), presente.est, 'almacen', presente.Em, { abs: 8 * 24 + 13, presente: true, nivel: () => 1, nombre: (k) => k, depositos: w5.dep });
  eq(w5.llamadas(), 0, 'con vos en el local no reponen (lo hacés vos o ayudan a atender)');
  // el guardado de los empleados trae el campo nuevo
  const viejo = { lista: [{ k: 'madre', turno: 0, alta: 100, dias: 3, sueldo: 900 }] };
  const sano = M.sanearEmpleadosNegocio(viejo, 20);
  eq([sano.lista[0].repuestoDia, sano.pend.repuesto], [0, {}], 'una partida de antes: el día de reposición en 0 y nada repuesto pendiente');
  const rota = M.sanearEmpleadosNegocio({ lista: [{ k: 'madre', repuestoDia: 1e9 }], pend: { repuesto: { tronco: -4, tabla: 7, jefe: 3, huevo: 5, piedra: 'x' } } }, 20);
  eq([rota.lista[0].repuestoDia, rota.pend.repuesto], [20, { tabla: 7 }], 'y lo roto se sanea (sólo lo reponible, positivo)');
  eq(M.sanearEmpleadosNegocio(JSON.parse(JSON.stringify(a.Em)), 20).lista[0].repuestoDia, a.Em.lista[0].repuestoDia, 'ida y vuelta del día de reposición');
}

// ---------------------------------------------------------------- 8. el pedido al proveedor
{
  const P = R.PROVEEDOR;
  eq([P.recargo, P.topeDia], [0.2, 3000], 'recargo del 20 % y tope de $3.000 por día');
  for (const k of N.catalogo('almacen')) {
    ok(R.precioProveedor(k) >= Math.round(N.precioPlaza(k) * 1.2) - 1 && R.precioProveedor(k) <= Math.round(N.precioPlaza(k) * 1.2) + 1, `${k}: plaza ${N.precioPlaza(k)} + 20 % = ${R.precioProveedor(k)}`);
    ok(R.precioProveedor(k) > N.precioUnidad(k, 0), `${k}: más caro que lo que vendés barato (no hay negocio en revender)`);
    ok(R.precioProveedor(k) > N.precioPlaza(k) * (1 - 0.12), `${k}: más caro de lo que paga el mercado si se lo devolvés`);
  }
  // en promedio, lo que cobrás a precio normal no cubre el recargo
  for (const tipo of N.IDS_TIPOS) {
    const cuesta = N.catalogo(tipo).reduce((s, k) => s + N.topeEstante(k) * R.precioProveedor(k), 0), vende = N.catalogo(tipo).reduce((s, k) => s + N.topeEstante(k) * N.precioUnidad(k, 1), 0);
    ok(cuesta > vende * 0.99, `${tipo}: llenar los estantes con el proveedor sale $${cuesta} y vendido a precio normal da $${vende}: no es negocio`);
  }
  // el presupuesto
  const p = plata(100000, 7), est = abierto('almacen', 7);
  const pr = R.presupuestoProveedor(est, p, 7);
  ok(pr.items.length > 5 && pr.total > 0 && pr.total <= P.topeDia, `con los estantes vacíos pide por $${pr.total} (tope $${P.topeDia})`);
  eq(pr.total, pr.items.reduce((s, x) => s + x.sub, 0), 'el total es la suma de lo pedido');
  ok(pr.items.every((x) => x.pu === R.precioProveedor(x.k) && x.sub === x.n * x.pu && x.n > 0 && x.n <= N.topeEstante(x.k)), 'cada renglón a su precio, sin pasar el tope del estante');
  eq(pr.recargo, pr.total - pr.plaza, 'recargo = total − precio de mercado');
  ok(pr.recargo > pr.plaza * 0.15 && pr.recargo < pr.plaza * 0.25, `el recargo ronda el 20 % ($${pr.recargo} sobre $${pr.plaza})`);
  eq(pr.limite, 'tope', 'lo frena el tope del día');
  ok(/de recargo \(20 %\)/.test(R.textoPedido(pr)) && /mercado/.test(R.textoPedido(pr)), `el texto: «${R.textoPedido(pr)}»`);
  // pedir: cuando sale de la caja
  est.caja = 5000;
  const r = R.pedirAlProveedor(p, est, 7);
  ok(r.ok && r.total === pr.total && r.deCaja === pr.total && r.deBilletera === 0, 'se paga de la caja primero');
  eq([est.caja, E.pesosDe(p)], [5000 - pr.total, 100000], '… la billetera ni se toca');
  eq(p.economia.libro.length, 0, 'lo de la caja no está en el libro de la billetera');
  eq(Object.fromEntries(r.items.map((x) => [x.k, x.n])), Object.fromEntries(Object.entries(est.stock)), 'los estantes recibieron exactamente lo pedido');
  eq(est.fin.prov, { dia: 7, gastado: r.total }, 'se anota lo gastado hoy');
  eq(G.balanceDe(est, 7, 1).proveedor, r.total, '… y el balance del día lo muestra');
  // el tope diario
  const otra = R.pedirAlProveedor(p, est, 7);
  const queda = P.topeDia - r.total;
  ok(queda <= 0 ? !otra.ok && otra.motivo === 'tope' : otra.ok && otra.total <= queda, `el segundo pedido del día respeta el tope (quedaban $${queda})`);
  ok(est.fin.prov.gastado <= P.topeDia, `y lo gastado hoy nunca pasa de $${P.topeDia} (van $${est.fin.prov.gastado})`);
  const tercera = R.pedirAlProveedor(p, est, 7);
  ok(!tercera.ok && tercera.motivo === 'tope', 'después del tope, no se puede más ese día');
  ok(/Hoy|ya pediste/i.test('Hoy ya pediste') && R.topeRestante(est, 7) < 60, 'ya casi no queda tope hoy');
  // mañana se puede de nuevo
  const man = R.presupuestoProveedor(est, p, 8);
  ok(man.items.length > 0 && man.hoyRestante === P.topeDia, 'al día siguiente el tope vuelve a empezar');
  // de la billetera, con el motivo «Proveedor»
  const p2 = plata(100000, 7), e2 = abierto('almacen', 7); e2.caja = 400;
  const r2 = R.pedirAlProveedor(p2, e2, 7);
  ok(r2.ok && r2.deCaja === 400 && r2.deBilletera === r2.total - 400, 'la caja pone lo que tiene y la billetera el resto');
  ok(libro(p2).motivo === 'Proveedor' && libro(p2).monto === -(r2.total - 400), `el libro: «${libro(p2).motivo}» ${libro(p2).monto}`);
  eq(e2.caja, 0, 'la caja queda en cero');
  // sin plata alcanza lo que alcanza; sin nada, no
  const p3 = plata(500, 7), e3 = abierto('almacen', 7);
  const pr3 = R.presupuestoProveedor(e3, p3, 7);
  ok(pr3.total <= 500 && pr3.total > 0 && pr3.limite === 'plata', `con $500 pide por $${pr3.total} y se frena por la plata`);
  const r3 = R.pedirAlProveedor(p3, e3, 7);
  ok(r3.ok && E.pesosDe(p3) === 500 - r3.total, 'y se paga');
  const p4 = plata(0, 7), e4 = abierto('almacen', 7);
  const r4 = R.pedirAlProveedor(p4, e4, 7);
  ok(!r4.ok && r4.motivo === 'plata' && Object.keys(e4.stock).length === 0, 'sin un peso no se pide y los estantes quedan igual');
  // estantes llenos
  const p5 = plata(1e6, 7), e5 = abierto('almacen', 7);
  for (const k of N.catalogo('almacen')) e5.stock[k] = N.topeEstante(k);
  const r5 = R.pedirAlProveedor(p5, e5, 7);
  ok(!r5.ok && r5.motivo === 'lleno' && E.pesosDe(p5) === 1e6, 'con los estantes llenos no se pide nada');
  eq(R.presupuestoProveedor(e5, p5, 7).limite, 'lleno', 'el presupuesto también lo dice');
  ok(!R.faltaSurtir(e5) && R.faltaSurtir(e4), 'faltaSurtir: sí con huecos, no con todo lleno');
  // llenar de a muchos días no pasa del estante
  const p6 = plata(1e7, 1), e6 = abierto('almacen', 1);
  for (let d = 1; d <= 40; d++) R.pedirAlProveedor(p6, e6, d);
  ok(N.catalogo('almacen').every((k) => (e6.stock[k] || 0) <= N.topeEstante(k)), 'tras 40 días de pedidos, ningún estante pasa del tope');
  ok(N.catalogo('almacen').every((k) => (e6.stock[k] || 0) === N.topeEstante(k)), '… y están todos llenos');
  ok(e6.fin.total.proveedor > 0, 'el total del proveedor queda anotado');
  // sin economía
  eq(R.pedirAlProveedor({ modo: 'desafio' }, abierto(), 3).ok, false, 'el Desafío no tiene proveedor');
  eq(R.pedirAlProveedor(plata(100, 3), N.negocioPropioNuevo(), 3).motivo, 'sin-local', 'sin local no se pide');
  // la panadería también
  const pp = plata(1e5, 7), ep = abierto('panaderia', 7), rp = R.pedirAlProveedor(pp, ep, 7);
  ok(rp.ok && Object.keys(ep.stock).every((k) => N.catalogo('panaderia').includes(k)), 'la panadería pide sólo lo suyo');
  // con la caja y el pedido las cuentas cierran (no se crea ni se pierde plata)
  const p7 = plata(10000, 7), e7 = abierto('almacen', 7); e7.caja = 700;
  const antes = E.pesosDe(p7) + e7.caja, r7 = R.pedirAlProveedor(p7, e7, 7);
  eq(E.pesosDe(p7) + e7.caja, antes - r7.total, 'caja + billetera bajan exactamente lo que cuesta el pedido');
}

// ---------------------------------------------------------------- 9. los depósitos del juego (almacen-juego.js)
{
  const progreso = { modo: 'relax', dia: 4, materiales: {}, entradas: {}, cosas: {}, economia: { ...E.economiaNueva(), pesos: 1000 } };
  const lista = [];
  const mundo = { obras: lista, editando: null, obrasCerca: () => lista, rehacer() {} };
  const pos = { x: 500, z: 500 };   // (vos, lejos: lo que cuenta es el local)
  const J = JA.crearAlmacenJuego({
    progreso: () => progreso, obras: () => mundo, jugador: () => ({ estado: { pos } }), sonido: () => ({ juntar() {} }), nota() {}, guardar() {}, refrescarBarra() {},
    material: (k) => progreso.materiales[k] || 0, cuantoHay: () => 0, sumarMaterial() {}, sumarEntrada() {}, conMateriales: (fn) => fn(progreso.materiales), materialesVisibles: () => progreso.materiales,
  });
  const poner = (id, x, z, g = {}, etapas = 1) => { const o = { plano: PLANO[id], datos: { plano: id, x, z, etapas, almacen: { n: 0, g } } }; lista.push(o); return o; };
  const barraca = poner('barraca', 10, 0, { tronco: 12, tabla: 8, piedra: 6 });
  const silo = poner('silo', 20, 0, { papa: 30, haba: 10 });
  poner('deposito-piedra', 30, 0, { piedra: 40 });
  poner('pila-piedra', 300, 0, { piedra: 20 });           // lejos del local
  poner('herramientero', 5, 0, { hacha: 1 });             // no es depósito de mercadería
  poner('barraca', 8, 3, { tronco: 99 }, 0);               // a medias
  const D = J.depositosDe(0, 0, R.REPOSICION.radio);
  eq(D.n, 3, 'cerca del local hay 3 depósitos terminados: la barraca, el silo y el depósito de piedra (no el lejano, ni el herramientero, ni el que está a medias)');
  eq([D.hay('tronco'), D.hay('tabla'), D.hay('piedra'), D.hay('papa'), D.hay('huevo')], [12, 8, 46, 30, 0], 'cuenta lo que hay en total (el silo también)');
  eq(J.cercaDe(0, 0, 45).map((o) => o.plano.id), ['barraca', 'silo', 'deposito-piedra'], 'el más cercano primero, medido desde el local');
  eq(J.cercaDe(300, 0, 45).map((o) => o.plano.id), ['pila-piedra'], 'medido desde otro punto, otros depósitos');
  eq(J.cerca(18).length, 0, 'lo de antes (los depósitos cerca de VOS) sigue igual: con vos lejos, ninguno');
  // se vacían de verdad
  eq(D.sacar('tabla', 5), 5, 'saca 5 tablas');
  eq(barraca.datos.almacen.g.tabla, 3, '… y la barraca tiene 3 (se vació de verdad)');
  eq(D.sacar('papa', 100), 30, 'pide 100 papas y salen las 30 que había');
  ok(silo.datos.almacen.g.papa === undefined && silo.datos.almacen.g.haba === 10, '… el silo se quedó sin papas y con sus habas');
  eq(D.sacar('piedra', 50), 46, 'la piedra sale de la barraca y del depósito, el más cercano primero');
  ok(barraca.datos.almacen.g.piedra === undefined && lista[2].datos.almacen.g.piedra === undefined, '… ambos quedaron en cero');
  eq(J.depositosDe(900, 900, 45).n, 0, 'sin depósitos cerca: n = 0');
  eq([J.depositosDe(900, 900, 45).hay('tronco'), J.depositosDe(900, 900, 45).sacar('tronco', 3)], [0, 0], '… y no da nada');
  eq(AL.IDS_ALMACEN.filter((id) => !AL.ALMACENES[id].guarda.length), [], 'todos los almacenes guardan algo');
}

// ---------------------------------------------------------------- 10. el juego con un contexto de mentira (el cobro al cambiar el día y el panel)
function entornoNegocio({ pesos = 20000, dia = 5, horas = 10, caja = 0, deposito = null } = {}) {
  const progreso = { modo: 'relax', dia, horas, economia: { ...E.economiaNueva(), pesos }, aldea: A.aldeaNueva(), vecindad: V.vecindadNueva() };
  const est = N.negocioPropioNuevo(); est.tipo = 'almacen'; est.abierto = true; est.caja = caja; progreso.negocioPropio = est;
  progreso.empleadosNegocio = M.empleadosNuevo();
  const o = { plano: { id: 'local-almacen', etapas: [1] }, datos: { plano: 'local-almacen', x: 200, z: 300, rot: 0.5, etapas: 1 } };
  const js = { estado: { pos: { x: o.datos.x, z: o.datos.z - 6 } } };
  const notas = [], guardados = [];
  const stock = { ...(deposito || {}) };
  const obras = { obras: [o], editando: null, rehacer() {} };
  const crear = (tag) => ({ tag, className: '', textContent: '', children: [], disabled: false, title: '', append(...x) { this.children.push(...x); }, addEventListener() {}, set type(v) {}, set innerHTML(v) { this.children = []; }, style: {} });
  const panel = { classList: { add() {}, remove() {} }, querySelector: () => null };
  const contenido = crear('div');
  globalThis.document = { createElement: crear };
  const ctx = {
    progreso: () => progreso, obras: () => obras, jugador: () => js, gente: () => null, sonido: () => ({ juntar() {} }), nota: (t, s, nueva) => notas.push([t, s, nueva]), guardar: () => guardados.push(1), refrescarBarra() {},
    tengo: (k) => stock[k] || 0, quitar: (k, c) => { stock[k] = (stock[k] || 0) - c; }, dar: (k, c) => { stock[k] = (stock[k] || 0) + c; }, lluvia: () => 0, agua: () => false, alturaDePie: () => 0, msFigura: () => 0,
    panel, contenido, alClic: (el, fn) => { el.onclick = fn; },
  };
  const juego = JN.crearNegocioJuego(ctx);
  const textos = (e) => [e.textContent, ...(e.children || []).flatMap(textos)];
  const botones = (e) => [...(e.children || []).flatMap(botones), ...(e.tag === 'button' ? [e] : [])];
  const dibujar = () => { contenido.children = []; juego.abrirPanel(o); return contenido; };
  return { progreso, est, o, juego, notas, guardados, stock, textos, botones, dibujar, contenido, avanzar: (s = 0.3) => juego.actualizar(s) };
}
{
  const g = G.gastoPorDia('almacen');
  // el primer día de apertura no paga; al cambiar el día, sí
  const X = entornoNegocio({ dia: 5, caja: 1000 });
  X.avanzar();
  eq([X.est.fin.activa, X.est.fin.ultimo, X.est.caja], [true, 5, 1000], 'el día que abre no se cobra');
  eq(X.notas.filter(([t]) => /Gastos del local/.test(t)).length, 0, '… ni hay aviso');
  X.progreso.dia = 6; X.progreso.horas = 0.2;
  X.avanzar();
  eq([X.est.caja, X.est.fin.ultimo], [1000 - g, 6], 'al empezar el día 6 se cobra de la caja, aunque estés lejos o cerca');
  const nota = X.notas.find(([t]) => /Gastos del local/.test(t));
  ok(nota && nota[0] === `Gastos del local: −$${g}` && /Alquiler, impuesto y luz/.test(nota[1]) && /de la caja del local/.test(nota[1]) && nota[2] === false, `aviso discreto, una sola vez: «${nota?.[0]}» · «${nota?.[1]}»`);
  X.avanzar(); X.avanzar(); X.avanzar();
  eq(X.notas.filter(([t]) => /Gastos del local/.test(t)).length, 1, 'y no se repite por cada vuelta del reloj');
  ok(X.guardados.length >= 1, 'se guarda');
  // lejos (a 400 m) también cobra
  X.js = null;
  const Y = entornoNegocio({ dia: 5, caja: 0, pesos: 5000 });
  Y.avanzar(); Y.progreso.dia = 6; Y.avanzar();
  eq(Y.progreso.economia.pesos, 5000 - g, 'sin caja, sale de la billetera');
  ok(/de tu billetera/.test(Y.notas.find(([t]) => /Gastos del local/.test(t))[1]), 'y el aviso lo dice');
  ok(/Gastos del local/.test(libro(Y.progreso).motivo), 'y queda en el libro');
  // sin plata: la deuda, el aviso y el cierre
  const Z = entornoNegocio({ dia: 5, caja: 0, pesos: 0 });
  Z.avanzar(); Z.progreso.dia = 6; Z.avanzar();
  ok(Z.notas.some(([t, s]) => /No pudiste pagar los gastos del local/.test(t) && s.includes('Debés ' + pesos$(gA)) && /Un día más sin pagar/.test(s)), `la primera vez: «${Z.notas.at(-1)[0]}» · «${Z.notas.at(-1)[1]}»`);
  Z.progreso.dia = 7; Z.avanzar();
  ok(G.cerradoPorDeuda(Z.est) && Z.notas.some(([t, s]) => /No pudiste/.test(t) && /cerró solo/.test(s)), 'la segunda vez avisa que cerró solo');
  eq(N.vistaDelLocal(Z.est).abierto, false, 'el edificio queda en «cerrado»');
  eq(Z.o.datos.local?.abierto, false, 'y la obra recibió el cartel cerrado');
  // el panel
  const t = Z.textos(Z.dibujar()).join(' | ');
  ok(/Gastos por día/.test(t) && t.includes(`${pesos$(gA)} (alquiler, impuesto y luz)`), `el panel dice «Gastos por día: ${pesos$(gA)} (alquiler, impuesto y luz)»`);
  ok(/Balance de hoy/.test(t) && /Balance de la semana/.test(t) && /ventas \$0/.test(t), 'el balance del día y de la semana');
  ok(/Deuda de gastos/.test(t) && t.includes(pesos$(2 * gA)) && /el local cerró solo/.test(t), 'y la deuda, a la vista');
  ok(/cerrado por la deuda de gastos: no entra nadie/.test(t), 'el panel dice que no entra nadie');
  const btn = Z.botones(Z.contenido);
  const pagar = btn.find((b) => b.textContent === `Pagar la deuda (${pesos$(2 * gA)})`);
  ok(pagar && pagar.disabled === true && pagar.className === 'principal', 'el botón «Pagar la deuda» existe, es el principal y está apagado sin plata');
  Z.progreso.economia.pesos = 2 * gA + 200; Z.contenido.children = []; Z.dibujar();
  const pagar2 = Z.botones(Z.contenido).find((b) => /Pagar la deuda/.test(b.textContent));
  ok(!pagar2.disabled, 'con plata se habilita');
  pagar2.onclick();
  eq([Z.est.fin.deuda, Z.progreso.economia.pesos], [0, 200], 'el botón paga la deuda de la billetera');
  ok(Z.notas.some(([t, s]) => t === `Pagaste la deuda: −${pesos$(2 * gA)}` && /vuelve a abrir/.test(s)), 'y avisa que el local vuelve a abrir');
  ok(!Z.botones(Z.contenido).some((b) => /Pagar la deuda/.test(b.textContent)), 'sin deuda, el botón desaparece');
  eq(N.vistaDelLocal(Z.est).abierto, true, 'el cartel vuelve a «abierto»');
  // el pedido al proveedor desde el panel
  const W = entornoNegocio({ dia: 5, pesos: 50000, caja: 0 });
  W.avanzar();
  const tp = W.textos(W.dibujar()).join(' | ');
  ok(/Proveedor/.test(tp) && /de recargo \(20 %\)/.test(tp) && /hoy podés pedir hasta \$3\.000/.test(tp), `el panel muestra el precio total y el recargo: «${tp.match(/Proveedor \|[^|]*/)?.[0]}»`);
  const pedir = W.botones(W.contenido).find((b) => /^Pedir al proveedor \(\$[\d.]+\)$/.test(b.textContent));
  ok(pedir && !pedir.disabled, `el botón: «${pedir?.textContent}»`);
  pedir.onclick();
  ok(Object.keys(W.est.stock).length > 5 && W.est.fin.prov.gastado > 0, 'el pedido llena estantes');
  ok(W.notas.some(([t, s]) => /^Pedido al proveedor: −\$/.test(t) && /de mercado/.test(s) && /de recargo/.test(s)), `el aviso: «${W.notas.at(-1)[0]}»`);
  ok(libro(W.progreso).motivo === 'Proveedor', 'el libro dice «Proveedor»');
  // el día de hoy se muestra en el balance
  ok(new RegExp(`proveedor \\$${W.est.fin.prov.gastado.toLocaleString('es-AR')}`).test(W.textos(W.contenido).join(' | ')), 'y el balance de hoy muestra lo del proveedor');
  // otra vez: queda lo que falte hasta el tope
  while (W.botones(W.contenido).find((b) => /^Pedir al proveedor \(/.test(b.textContent) && !b.disabled)) W.botones(W.contenido).find((b) => /^Pedir al proveedor \(/.test(b.textContent)).onclick();
  ok(W.est.fin.prov.gastado <= 3000, `repetir el botón nunca pasa del tope diario ($${W.est.fin.prov.gastado})`);
  ok(/ya pediste lo de hoy/.test(W.textos(W.contenido).join(' | ')), 'y el panel lo explica');
  const apagado = W.botones(W.contenido).find((b) => /^Pedir al proveedor$/.test(b.textContent));
  ok(apagado && apagado.disabled, 'con el tope gastado el botón queda apagado');
  // abrir el local avisa de los gastos
  const O = entornoNegocio({ dia: 5 }); O.est.abierto = false;
  O.dibujar();
  O.botones(O.contenido).find((b) => b.textContent === 'Abrir el local').onclick();
  ok(O.notas.some(([t, s]) => t === 'Abriste el local' && s.includes(`Desde mañana paga ${pesos$(gA)} por día de gastos fijos`)), `al abrir el aviso trae los gastos: «${O.notas.at(-1)[1]}»`);
  // desarmar con deuda
  const D = entornoNegocio({ dia: 5, pesos: 0 }); D.avanzar(); D.progreso.dia = 6; D.avanzar();
  D.progreso.economia.pesos = 1000;
  D.juego.alDesarmar(D.o.datos);
  ok(D.notas.some(([t, s]) => t === 'Cerró tu local' && s.includes(`Pagaste los ${pesos$(gA)} que debías de gastos`)), `al desarmar paga lo que debía: «${D.notas.at(-1)[1]}»`);
  delete globalThis.document;
}

// ---------------------------------------------------------------- 11. la reposición desde el panel de los empleados (con depósitos de mentira)
{
  const crear = (tag) => ({ tag, className: '', textContent: '', children: [], disabled: false, title: '', append(...x) { this.children.push(...x); }, addEventListener() {}, set type(v) {} });
  globalThis.document = { createElement: crear };
  const progreso = { modo: 'relax', dia: 8, horas: 10, economia: { ...E.economiaNueva(), pesos: 5000 }, aldea: A.aldeaNueva(), vecindad: V.vecindadNueva() };
  const est = N.negocioPropioNuevo(); est.tipo = 'almacen'; est.abierto = true; est.fin.activa = true; est.fin.ultimo = 8; est.fin.reponer = false; progreso.negocioPropio = est; progreso.empleadosNegocio = M.empleadosNuevo();
  const o = { plano: { id: 'local-almacen' }, datos: { x: 200, z: 300, rot: 0, etapas: 1 } };
  const inv = { tronco: 40, tabla: 25, piedra: 0, lana: 0, papa: 0 };
  let n = 1;
  const almacen = { depositosDe: () => ({ n, hay: (k) => inv[k] || 0, sacar: (k, c) => { const t = Math.min(c, inv[k] || 0); inv[k] -= t; return t; } }) };
  const negocio = { estado: () => est, cola: N.colaNueva(), local: () => o, distancia: () => 500, aMundo: (ob, x, z) => ({ x, z }), medidas: () => ({ D: 4 }), panelAbierto: () => false, redibujar() {}, atender: () => false };
  const notas = [];
  const ctx = { progreso: () => progreso, negocio: () => negocio, gente: () => null, nota: (t, s) => notas.push([t, s]), guardar() {}, refrescarBarra() {}, sonido: () => ({ juntar() {} }), lluvia: () => 0, msFigura: () => 0, alClic: (el, fn) => { el.onclick = fn; }, almacen: () => almacen };
  const juego = JE.crearEmpleadosNegocioJuego(ctx);
  const textos = (e) => [e.textContent, ...(e.children || []).flatMap(textos)];
  const botones = (e) => [...(e.children || []).flatMap(botones), ...(e.tag === 'button' ? [e] : [])];
  const pintar = () => { const r = crear('div'); juego.dibujarPanel(r, est); return r; };
  let r = pintar(), t = textos(r).join(' | ');
  ok(/Reposición automática desde tus depósitos \| no/.test(t), `el panel dice «Reposición automática desde tus depósitos: no» (con el local sin la bandera): ${t.match(/Reposición[^|]*\|[^|]*/)?.[0]}`);
  est.fin.reponer = true;
  r = pintar(); t = textos(r).join(' | ');
  ok(/Reposición automática desde tus depósitos \| sí/.test(t), 'prendida dice «sí»');
  ok(/1 depósito cerca con 40 troncos de leña y 25 tablas/.test(t), `cuenta lo que hay: «${t.match(/1 depósito[^|]*/)?.[0]}»`);
  const b = botones(r).find((x) => /Apagar la reposición/.test(x.textContent));
  ok(!!b, 'y ofrece apagarla');
  b.onclick();
  eq(est.fin.reponer, false, 'el botón la apaga');
  r = pintar(); botones(r).find((x) => /Activar la reposición/.test(x.textContent)).onclick();
  eq(est.fin.reponer, true, '… y la prende');
  n = 0; r = pintar(); t = textos(r).join(' | ');
  ok(/No hay depósitos a menos de 45 m del local/.test(t), 'sin depósitos cerca lo dice, con el radio');
  // la panadería: no aplica
  est.tipo = 'panaderia'; r = pintar(); t = textos(r).join(' | ');
  ok(/Reposición automática desde tus depósitos \| no aplica/.test(t) && /Nada de lo que vende este local se guarda en los depósitos/.test(t), 'en la panadería dice que no aplica y por qué');
  ok(!botones(r).some((x) => /la reposición/.test(x.textContent)), '… y no ofrece el botón');
  est.tipo = 'almacen';
  // el juego: con un empleado, lejos, al empezar el turno repone (se empuja el tiempo con __tick)
  n = 1; inv.tronco = 40; inv.tabla = 25;
  for (let i = 0; i < 12; i++) V.cambiarAmistad(progreso, 'madre', 20, progreso.dia);
  progreso.horas = 8;
  juego.__contratar('madre');
  progreso.empleadosNegocio.lista[0].dias = 20; progreso.empleadosNegocio.sim.ultima = 8 * 24 + 8;
  progreso.dia = 8; progreso.horas = 8.6;
  juego.__tick(1);
  progreso.horas = 9.5; juego.__tick(1);
  ok((est.stock.tronco || 0) > 0 && inv.tronco < 40, `el empleado, con vos lejos, repuso: ${est.stock.tronco} troncos en el estante, quedan ${inv.tronco} en el depósito`);
  ok(Object.keys(progreso.empleadosNegocio.pend.repuesto).length > 0, 'y quedó anotado para contártelo al volver');
  delete globalThis.document;
}

// ---------------------------------------------------------------- 12. el guardado completo
{
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
  const GU = await import('../src/guardado.js');
  GU.usarModoGuardado('relax', 1);
  const nueva = GU.progresoNuevo();
  eq(nueva.negocioPropio.fin, G.finNuevo(), 'una partida nueva arranca sin deuda y con la reposición prendida');
  // una partida de antes (4.4.0): con el local abierto y empleados, sin los campos nuevos
  const neg = N.negocioPropioNuevo(); delete neg.fin; neg.tipo = 'almacen'; neg.abierto = true; neg.stock = { huevo: 12 }; neg.caja = 700; neg.hoy.dia = 11;
  const Em = M.empleadosNuevo(); M.contratar(Em, 'madre', { tipo: 'almacen', dia: 10, abs: 10 * 24 + 9, puntos: 60 });
  delete Em.lista[0].repuestoDia; delete Em.pend.repuesto;
  ok(GU.escribirPartida('relax', 1, { modo: 'relax', dia: 12, horas: 10, economia: { ...E.economiaNueva(), pesos: 900 }, negocioPropio: neg, empleadosNegocio: Em }), 'se guarda una partida de antes de la 4.4.1');
  const r = GU.leerPartida('relax', 1).progreso;
  eq([r.economia.pesos, r.negocioPropio.caja, r.negocioPropio.stock, r.negocioPropio.abierto], [900, 700, { huevo: 12 }, true], 'se carga sin tocar la plata, la caja, los estantes ni que esté abierto');
  eq([r.negocioPropio.fin.deuda, r.negocioPropio.fin.activa, r.negocioPropio.fin.ultimo, r.negocioPropio.fin.reponer], [0, true, 12, false], '… con los campos nuevos por defecto: sin deuda, paga desde mañana, reposición apagada');
  eq([r.empleadosNegocio.lista[0].k, r.empleadosNegocio.lista[0].repuestoDia, r.empleadosNegocio.pend.repuesto], ['madre', 0, {}], '… y los empleados, con su campo nuevo en cero');
  // con todo cargado vuelve igual
  const e = abierto('almacen', 12); e.fin.deuda = gA; e.fin.reponer = true; e.fin.prov = { dia: 12, gastado: 1200 }; G.anotarFin(e, 12, 'proveedor', 1200); G.anotarFin(e, 11, 'gastos', gA);
  GU.escribirPartida('relax', 2, { modo: 'relax', dia: 12, horas: 10, economia: E.economiaNueva(), negocioPropio: e });
  eq(GU.leerPartida('relax', 2).progreso.negocioPropio.fin, e.fin, 'con deuda, balance y proveedor, vuelve igual');
  GU.usarModoGuardado('desafio', 1);
  ok(GU.progresoNuevo().negocioPropio === undefined, 'el Desafío no tiene local ni gastos');
  delete globalThis.localStorage;
}

// ---------------------------------------------------------------- 13. el cableado
{
  const m = leer('src/main.js'), jn = leer('src/negocio-propio-juego.js'), je = leer('src/empleados-negocio-juego.js'), aj = leer('src/almacen-juego.js');
  ok(m.includes('almacen: () => almacenJuego,'), 'main.js le pasa a los empleados los depósitos');
  ok(jn.includes('cobrarDia(est);') && jn.indexOf('ponerAlDia(est, P().dia);') < jn.indexOf('cobrarDia(est);') && jn.indexOf('cobrarDia(est);') < jn.indexOf('sincronizarVista(o, est);\n    const tipo'), 'el cobro corre cada 0,25 s después de poner al día y antes de dibujar el cartel (nada por cuadro)');
  ok(je.includes('depositos: depositosDelLocal,') && je.includes('A.depositosDe(o.datos.x, o.datos.z, REPOSICION.radio)'), 'los empleados reponen desde los depósitos del local (no de donde estés)');
  ok(aj.includes('function cercaDe(x, z, radio)') && aj.includes('D.tipo === \'herramienta\''), 'almacen-juego.js: los depósitos cerca de un punto');
  // el armado de un solo archivo: nada de comentarios detrás de un import, una constante exportada por declaración
  for (const f of ['src/negocio-propio-gastos.js', 'src/negocio-propio-reposicion.js', 'src/negocio-propio.js', 'src/empleados-negocio.js', 'src/empleados-negocio-juego.js', 'src/negocio-propio-juego.js', 'src/almacen-juego.js']) {
    const s = leer(f);
    ok(!/^import [^\n]*;\s+\/\//m.test(s), `${f}: ningún import con comentario atrás (el armado no lo entiende)`);
    ok(!/^export const [A-Za-z_]+ = [^;]*\b[0-9]+, [A-Za-z_]+ =/m.test(s), `${f}: una constante exportada por declaración`);
  }
  // nada por cuadro ni geometría nueva
  for (const f of ['src/negocio-propio-gastos.js', 'src/negocio-propio-reposicion.js']) {
    const s = leer(f);
    ok(!/new THREE\.|PointLight|SpotLight|requestAnimationFrame|document\.|window\./.test(s), `${f}: módulo puro (sin DOM, sin three, sin luces, sin cuadros)`);
    ok(!/gamepad|Gamepad|mando/i.test(s), `${f}: sin mando`);
  }
  // los textos nuevos, en castellano de acá (nada del otro idioma)
  const nuevos = [leer('src/negocio-propio-gastos.js'), leer('src/negocio-propio-reposicion.js')].join('\n');
  ok(!/\b(the|and|rent|tax|supplier|vendor|please|click)\b/i.test(nuevos.replace(/\/\/.*$/gm, '')), 'los textos están en castellano');
  // «|| 'escuela'» y demás: no aplica acá, pero ninguna cuenta se hace por cuadro: el cobro no usa Math.random ni fechas reales
  ok(!/Math\.random|Date\.now|new Date/.test(nuevos), 'las cuentas no usan azar ni fecha real (las pruebas y las partidas repiten)');
}

console.log(`verificar-4-4-1-gastos: ${n} comprobaciones OK`);
