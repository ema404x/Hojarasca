// 3.8.8 · Economía, Fase 1: el peso (src/economia.js) y su lugar en el guardado.
//   · cobrar y pagar: enteros, techo, nunca en negativo, el libro con los últimos movimientos;
//   · sólo en el Relax;
//   · la yerba de una partida de antes se convierte a pesos, una sola vez, a $100 cada una;
//   · el guardado: una partida nueva trae su economía; una vieja arranca en cero y convierte; una rota se sanea; el Desafío, nada.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const E = await import('../src/economia.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const partida = (extra = {}) => ({ modo: 'relax', dia: 4, cosas: {}, economia: E.economiaNueva(), ...extra });

// ---------------------------------------------------------------- 1. cobrar y pagar
{
  const p = partida();
  eq([E.pesosDe(p), E.hayEconomia(p)], [0, true], 'una partida nueva: en cero y con economía');
  const r = E.cobrar(p, 1500, 'Un mandado', 'Rosa');
  ok(r.ok && r.monto === 1500 && r.saldo === 1500 && E.pesosDe(p) === 1500, 'cobrar suma');
  ok(E.puedePagar(p, 1500) && !E.puedePagar(p, 1501) && !E.puedePagar(p, 0) && !E.puedePagar(p, -5), 'puedePagar');
  const r2 = E.pagar(p, 400, 'Pan casero', 'Rosa');
  ok(r2.ok && r2.saldo === 1100 && p.economia.gastado === 400 && p.economia.ganado === 1500, 'pagar resta y lleva las cuentas');
  const r3 = E.pagar(p, 5000, 'Una casa', 'Banco');
  ok(!r3.ok && r3.faltan === 3900 && E.pesosDe(p) === 1100, 'no deja el saldo en negativo: dice cuánto falta y no mueve nada');
  // montos raros
  for (const raro of [0, -3, NaN, Infinity, 'abc', null, undefined, 0.4]) { const a = E.pesosDe(p); ok(!E.cobrar(p, raro).ok && !E.pagar(p, raro).ok && E.pesosDe(p) === a, `ignora el monto ${String(raro)}`); }
  eq([E.cobrar(p, 12.9).monto, E.pesosDe(p)], [12, 1112], 'los pesos son enteros (se corta lo de abajo)');
  // el techo
  const q = partida(); q.economia.pesos = E.MAX_PESOS - 5;
  const t = E.cobrar(q, 100, 'Mucho', 'x');
  ok(t.monto === 5 && E.pesosDe(q) === E.MAX_PESOS, 'el saldo tiene techo: entra hasta el techo');
  ok(!E.cobrar(q, 1, 'y', 'x').ok, 'y después no entra más');
}
// ---------------------------------------------------------------- 2. el libro
{
  const p = partida();
  for (let i = 1; i <= E.LIBRO_MAX + 30; i++) { p.dia = i; E.cobrar(p, i, `Movimiento ${i}`, 'Alguien'); }
  ok(p.economia.libro.length === E.LIBRO_MAX, `el libro guarda los últimos ${E.LIBRO_MAX}`);
  const u = E.ultimosMovimientos(p, 3);
  eq(u.map((m) => m.monto), [E.LIBRO_MAX + 30, E.LIBRO_MAX + 29, E.LIBRO_MAX + 28], 'los últimos, del más nuevo al más viejo');
  ok(u[0].dia === E.LIBRO_MAX + 30 && u[0].con === 'Alguien' && /Movimiento/.test(u[0].motivo), 'con fecha, motivo y de quién');
  E.pagar(p, 10, 'Compra', 'Almacén');
  ok(E.ultimosMovimientos(p, 1)[0].monto === -10, 'un pago anota un movimiento negativo');
  ok(E.ultimosMovimientos({ modo: 'desafio' }, 5).length === 0, 'sin economía, no hay libro');
}
// ---------------------------------------------------------------- 3. formato
{
  eq([E.formatoPesos(0), E.formatoPesos(999), E.formatoPesos(1000), E.formatoPesos(1234567), E.formatoPesos(-2500)], ['$0', '$999', '$1.000', '$1.234.567', '−$2.500'], 'con punto de miles y el signo');
  eq([E.formatoPesos('x'), E.formatoPesos(undefined)], ['$0', '$0'], 'lo que no es número es cero');
}
// ---------------------------------------------------------------- 4. sólo en el Relax
{
  const d = { modo: 'desafio', dia: 2, cosas: { yerba: 5 }, economia: E.economiaNueva() };
  ok(!E.hayEconomia(d) && E.pesosDe(d) === 0 && !E.cobrar(d, 100).ok && !E.pagar(d, 1).ok, 'en el Desafío no hay economía, aunque el objeto exista');
  ok(E.convertirYerba(d) === 0 && d.cosas.yerba === 5, 'ni se convierte la yerba del Desafío');
  ok(!E.hayEconomia({ modo: 'relax' }) && !E.hayEconomia(null), 'y sin objeto de economía, tampoco');
}
// ---------------------------------------------------------------- 5. la conversión de la yerba
{
  const p = partida({ cosas: { yerba: 7, harina: 2 }, economia: E.sanearEconomia(null) });
  ok(p.economia.migrada === false, 'una partida de antes arranca sin migrar');
  const m = E.convertirYerba(p);
  ok(m === 700 && E.pesosDe(p) === 700 && !('yerba' in p.cosas) && p.cosas.harina === 2, 'la yerba pasa a $100 cada una y lo demás no se toca');
  ok(p.economia.migrada === true && E.ultimosMovimientos(p, 1)[0].motivo === 'Tu yerba pasó a pesos', 'queda anotada en el libro');
  p.cosas.yerba = 3;
  ok(E.convertirYerba(p) === 0 && p.cosas.yerba === 3 && E.pesosDe(p) === 700, 'una sola vez: la yerba que se consiga después es mercadería');
  const sin = partida({ economia: E.sanearEconomia(null) });
  ok(E.convertirYerba(sin) === 0 && sin.economia.migrada === true && E.ultimosMovimientos(sin).length === 0, 'sin yerba no hay nada que anotar');
  ok(E.yerbaEnPesos(8) === 800 && E.yerbaEnPesos(-3) === 0 && E.yerbaEnPesos('x') === 0 && E.PESOS_POR_YERBA === 100, '$100 por yerba');
}
// ---------------------------------------------------------------- 6. el saneador
{
  const s = E.sanearEconomia({ pesos: -50, libro: [{ dia: 2, monto: 100, motivo: 'a'.repeat(300), con: 'b' }, { monto: 0 }, null, 'x', { dia: 1, monto: NaN }, { dia: 5, monto: -30, motivo: 'ok', con: 'c' }], migrada: 'sí', ganado: 'x', gastado: 1e30 });
  ok(s.pesos === 0 && s.migrada === false && s.ganado === 0 && s.gastado === 1e12, 'números sanos y `migrada` sólo si es verdadera');
  ok(s.libro.length === 2 && s.libro[0].motivo.length === 80 && s.libro[1].monto === -30, 'el libro, sólo con movimientos bien formados y motivos cortos');
  const g = E.sanearEconomia({ pesos: 5, libro: Array.from({ length: 500 }, (_, i) => ({ dia: i + 1, monto: 1 })), migrada: true });
  ok(g.libro.length === E.LIBRO_MAX && g.libro[g.libro.length - 1].dia === 500, 'un libro enorme se recorta a lo último');
  for (const raro of [null, undefined, 3, 'x', [], true]) { const r = E.sanearEconomia(raro); ok(r.pesos === 0 && r.migrada === false && Array.isArray(r.libro), `una economía rota (${JSON.stringify(raro)}) arranca vacía y sin migrar`); }
}
// ---------------------------------------------------------------- 7. el guardado
{
  const almacen = new Map();
  globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), key: () => null, length: 0 };
  const G = await import('../src/guardado.js');
  G.usarModoGuardado('relax', 1);
  const nuevo = G.progresoNuevo();
  ok(nuevo.economia && nuevo.economia.pesos === 0 && nuevo.economia.migrada === true && nuevo.economia.libro.length === 0, 'una partida nueva del Relax trae su economía en cero');
  // una partida vieja (sin economía y con yerba)
  const vieja = JSON.parse(JSON.stringify(nuevo)); delete vieja.economia; vieja.cosas = { yerba: 12, harina: 1 };
  G.escribirPartida('relax', 1, vieja);
  const cargada = G.leerPartida('relax', 1);
  const pr = cargada?.progreso || cargada;
  ok(pr.economia.pesos === 1200 && pr.economia.migrada === true && !('yerba' in pr.cosas) && pr.cosas.harina === 1, 'una partida de antes convierte su yerba al cargar (12 → $1.200)');
  G.escribirPartida('relax', 1, pr);
  const otra = G.leerPartida('relax', 1); const po = otra?.progreso || otra;
  ok(po.economia.pesos === 1200 && po.economia.libro.length === 1, 'y al volver a cargar no se convierte de nuevo');
  // una rota
  const rota = JSON.parse(JSON.stringify(nuevo)); rota.economia = { pesos: 'mucho', libro: 'x' }; rota.cosas = { yerba: 2 };
  G.escribirPartida('relax', 1, rota);
  const rr = G.leerPartida('relax', 1); const pq = rr?.progreso || rr;
  ok(pq.economia.pesos === 200 && pq.economia.migrada === true, 'una economía rota se sanea y la yerba se convierte');
  // el Desafío no tiene
  G.usarModoGuardado('desafio', 1);
  const des = G.progresoNuevo();
  ok(des.economia === undefined, 'el Desafío no trae economía');
  const guard = leer('src/guardado.js');
  ok(guard.includes("import { economiaNueva, sanearEconomia, convertirYerba } from './economia.js';") && guard.includes('convertirYerba(limpio)'), 'guardado.js la usa');
}
// ---------------------------------------------------------------- 8. los pagos del valle, en pesos
{
  const { crearPuestoDeCargas } = await import('../src/comercio-mundo.js');
  const C = await import('../src/comercio.js');
  const F = await import('../src/feria.js');
  const CO = await import('../src/concursos.js');
  const CR = await import('../src/correo.js');
  const A = await import('../src/aldea.js');
  // el puesto de cargas: se compra y se vende en pesos (los precios de comercio.js, a $100 cada unidad)
  const p = partida({ dia: 5, materiales: { tabla: 8, piedra: 0 }, entradas: {}, cosas: {}, comercio: C.comercioNuevo() });
  const notas = [];
  const parada = { nombre: 'Estación del Valle' };
  const ctx = { progreso: () => p, dia: () => 5, temporada: () => 'verano', tren: { paradas: [parada] }, nota: (t, sub) => notas.push([t, sub]), guardar() {}, refrescar() {}, sonido: null };
  const puesto = crearPuestoDeCargas(ctx);
  puesto.abrir(parada, 'vender');
  const pv = C.precios(p.comercio, parada.nombre, 'tabla', 5, 'verano');
  ok(puesto.venderBien('tabla'), 'se vende un lote de tablas');
  ok(E.pesosDe(p) === pv.venta * 100 && p.materiales.tabla === 8 - pv.lote, `se cobra en pesos: $${pv.venta * 100} por el lote (hoy ${E.pesosDe(p)})`);
  ok(!('yerba' in p.cosas), 'y ya no aparece yerba');
  const mov = E.ultimosMovimientos(p, 1)[0];
  ok(mov.monto === pv.venta * 100 && /^Venta: /.test(mov.motivo) && /aurelio/i.test(mov.con), `el libro dice qué y a quién (${mov.motivo} · ${mov.con})`);
  // comprar: alcanza o no alcanza, en pesos
  puesto.abrir(parada, 'comprar');
  const pc = C.precios(p.comercio, parada.nombre, 'piedra', 5, 'verano');
  p.economia.pesos = pc.compra * 100 - 1;
  ok(!puesto.comprarBien('piedra') && p.materiales.piedra === 0 && notas.at(-1)[0] === 'No te alcanza la plata', 'con un peso de menos no alcanza: no se mueve nada y lo dice');
  p.economia.pesos = pc.compra * 100;
  ok(puesto.comprarBien('piedra') && E.pesosDe(p) === 0 && p.materiales.piedra === pc.lote, `con lo justo se compra: $${pc.compra * 100} por ${pc.lote} piedras`);
  ok(E.ultimosMovimientos(p, 1)[0].monto === -pc.compra * 100, 'y el pago queda anotado');
  // los fletes se cobran en pesos al llegar (el flete guardado sigue en yerba: se pasa)
  p.comercio.fletes.push({ id: 'f1', tipo: 'carga', desde: 'Parada Alta', hasta: parada.nombre, cuantos: 4, que: 'cajones', premio: { yerba: 5 }, dia: 5 });
  const antes = E.pesosDe(p);
  puesto.llegar(parada);
  ok(E.pesosDe(p) === antes + 500, 'un flete de 5 de yerba paga $500');
  ok(/Flete entregado/.test(E.ultimosMovimientos(p, 1)[0].motivo), 'con su renglón');
  // la feria
  ok(F.OFERTAS.every((o) => !(o.da.cuenta && Object.hasOwn(o.da.cuenta, 'yerba'))), 'la feria ya no paga en yerba');
  const conPesos = F.OFERTAS.filter((o) => o.da.pesos);
  ok(conPesos.length === 3 && conPesos.every((o) => Number.isInteger(o.da.pesos) && o.da.pesos % 100 === 0), 'tres ofertas pagan pesos (los mismos montos de antes, a $100 por yerba)');
  eq(conPesos.map((o) => [o.id, o.da.pesos]).sort(), [['huevos-habas-guiso', 800], ['pan-yerba', 1000], ['poncho-yerba', 1600]], 'poncho 1.600, guiso 800, pan 1.000');
  ok(/^1\.600 pesos$/.test(F.textoOferta(F.OFERTAS.find((o) => o.id === 'poncho-yerba')).da), 'y el cartel de la feria dice el monto (1.600 pesos)');
  // los concursos y la revista
  for (const c of Object.values(CO.CONCURSOS)) for (const g of Object.values(c.regalos)) ok(!g.cuenta || !Object.hasOwn(g.cuenta, 'yerba'), `${c.id}: el regalo ya no es yerba`);
  eq([CO.CONCURSOS.trucha.regalos[1].pesos, CO.CONCURSOS.foto.regalos[1].pesos, CO.CONCURSOS.foto.regalos[3].pesos], [400, 400, 100], 'los premios en pesos (a $100 por yerba)');
  ok(CR.CARTAS.find((c) => c.id === 'c-revista').premio.pesos === 1600, 'la revista paga $1.600 (eran dos kilos: 16 de yerba)');
  // los vecinos de la aldea: pagan y cobran por la puerta de la economía
  const pa = partida({ aldea: A.aldeaNueva(), economia: { ...E.economiaNueva(), pesos: 1000 } });
  const efectos = [{ tipo: 'pesos', n: -200, motivo: 'Pan casero', con: 'Rosa' }, { tipo: 'pesos', n: 400, motivo: 'Mandado cumplido', con: 'Delia' }];
  A.aplicarEfectos(pa, efectos, 5);
  ok(E.pesosDe(pa) === 1200 && E.ultimosMovimientos(pa, 2).map((m) => m.monto).join() === '400,-200', 'los efectos `pesos` de la aldea mueven el saldo y el libro');
  ok(A.SERVICIO.pesosPorPan === 200 && A.SERVICIO.pesosMandado === 400 && A.SERVICIO.pesosPorAvistaje === 100 && A.SERVICIO.pesosPorFrutos === 100 && !('yerbaMandado' in A.SERVICIO), 'los precios de la aldea, en pesos');
}
// ---------------------------------------------------------------- 9. la billetera en pantalla
{
  const main = leer('src/main.js'), html = leer('src/plantilla.html');
  ok(html.includes('id="billetera-hud"') && html.includes('id="billetera"') && html.includes('id="btn-billetera"') && html.includes('.billetera-hud'), 'la plantilla trae el HUD, el panel y el botón de la pausa');
  ok(main.includes('function actualizarBilleteraHud') && main.includes('actualizarBilleteraHud(dt);') && main.includes('function abrirBilletera') && main.includes("codigo === 'Escape' && !$('billetera').classList.contains('oculto')"), 'main.js: el HUD, el panel y Escape');
  ok(/if \(!esDesafio\) \$\('btn-billetera'\)/.test(main) && /const hay = !esDesafio && modo === 'jugando' && hayEconomia\(progreso\)/.test(main), 'sólo en el Relax');
  const R = E.resumenBilletera(partida(), 3);
  ok(R.hay && R.saldo === 0 && R.movimientos.length === 0, 'el resumen de una billetera vacía');
  const q = partida(); E.cobrar(q, 700, 'a', 'b'); E.pagar(q, 200, 'c', 'd');
  const Rq = E.resumenBilletera(q, 5);
  ok(Rq.saldo === 500 && Rq.ganado === 700 && Rq.gastado === 200 && Rq.movimientos.length === 2, 'con saldo, ganado, gastado y movimientos');
  ok(!E.resumenBilletera({ modo: 'desafio' }).hay, 'en el Desafío no hay billetera');
  eq([E.textoDiferencia(100, 500), E.textoDiferencia(500, 300), E.textoDiferencia(7, 7), E.textoDiferencia(0, 1500)], ['+$400', '−$200', '', '+$1.500'], 'el aviso del HUD: +$400, −$200');
}
// ---------------------------------------------------------------- 10. el código
{
  const src = leer('src/economia.js');
  for (const m of src.matchAll(/^import .*$/gm)) ok(false, `economia.js no importa nada: ${m[0]}`);
  for (const m of src.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) ok(!/ñ/i.test(m[1]), `exportado sin ñ: ${m[1]}`);
  ok(!/\bdocument\b|\bwindow\b|from 'three'/.test(src), 'sin DOM ni three');
}
console.log(`verificar-3-8-8-economia: ${n} verificaciones ok`);
