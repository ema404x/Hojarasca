// 3.8.8 · Economía, Fase 2: el mercado de cada puesto (src/mercado.js).
//   · determinista y día a día; existencias y caja con tope; el precio sube con la escasez y baja con la sobra;
//   · comprar y vender mueven existencias y caja; sin caja no te compra, sin existencias no te vende;
//   · el guardado se sanea; una parada que cambia de nombre se lleva su mercado; el arbitraje no se dispara.
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const M = await import('../src/mercado.js');
const C = await import('../src/comercio.js');
const E = await import('../src/economia.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const P1 = 'Estación del Valle', P2 = 'Parada Alta';

// ---------------------------------------------------------------- 1. determinismo y avance
{
  const a = C.comercioNuevo(), b = C.comercioNuevo();
  eq(M.tienda(a, P1, 5), M.tienda(b, P1, 5), 'dos partidas ven el mismo puesto el mismo día');
  for (let d = 5; d <= 40; d++) { M.tienda(a, P1, d); }
  M.tienda(b, P1, 40);
  eq(a.mercado[P1], b.mercado[P1], 'día a día o de un salto (hasta un año): igual');
  const t = a.mercado[P1];
  ok(t.dia === 40, 'el puesto queda al día');
  for (const x of C.bienesDe(P1)) ok(M.existencias(t, x) >= 0 && M.existencias(t, x) <= M.MERCADO.stockMax, `existencias de ${x} dentro del tope`);
  ok(t.caja >= 0 && t.caja <= M.cajaMaxima(P1), 'la caja, dentro del tope');
  ok(M.cajaMaxima(P1) >= 4000 && M.cajaMaxima(P1) <= 8000, 'la caja máxima es de $4.000 a $8.000');
  // mucho tiempo sin venir: se simula a lo sumo un año
  const c = C.comercioNuevo(); M.tienda(c, P1, 2); const t2 = M.tienda(c, P1, 5000);
  ok(t2.dia === 5000 && t2.caja <= M.cajaMaxima(P1), 'volver después de mucho no se cuelga ni se pasa de tope');
  ok(M.tienda(null, P1, 1) === null, 'sin comercio, nada');
}

// ---------------------------------------------------------------- 2. el factor de precio
{
  const c = C.comercioNuevo(); const t = M.tienda(c, P1, 5);
  const bien = C.bienesDe(P1)[0], base = M.nivelBase(P1, bien);
  let ant = Infinity;
  for (let s = 0; s <= M.MERCADO.stockMax; s++) {
    t.stock[bien] = s;
    const f = M.factorDe(t, P1, bien);
    ok(f <= ant + 1e-9 && f >= M.MERCADO.factorMin - 1e-9 && f <= M.MERCADO.factorMax + 1e-9, `con ${s} lotes el factor ${f.toFixed(2)} baja y queda en rango`);
    ant = f;
  }
  t.stock[bien] = base;
  ok(Math.abs(M.factorDe(t, P1, bien) - 1) < 1e-9, 'con el nivel de siempre, el precio de siempre');
  t.stock[bien] = 0; ok(M.nivelDe(t, P1, bien) === 'agotado' && M.factorDe(t, P1, bien) > 1.1, 'agotado: sube');
  t.stock[bien] = M.MERCADO.stockMax; ok(M.nivelDe(t, P1, bien) === 'abunda' && M.factorDe(t, P1, bien) < 1, 'de sobra: baja');
  ok(M.factorDe(null, P1, bien) === 1 && M.factorDe(t, P1, 'nada') === 1, 'sin puesto o sin bien: 1');
  t.stock[bien] = 0; ok(M.destacados(t, P1).includes(bien), 'lo que falta aparece en el cartel');
  t.stock[bien] = base; ok(!M.destacados(t, P1).includes(bien), 'lo normal no');
  ok(M.nombreDelBien(bien).length > 0 && M.nombreDelBien('zzz') === 'zzz', 'nombre del bien');
}

// ---------------------------------------------------------------- 3. comprar y vender mueven el puesto
{
  const c = C.comercioNuevo(); const t = M.tienda(c, P1, 5);
  const bien = C.bienesDe(P1)[0];
  t.stock[bien] = 3; t.caja = 1000;
  M.registrarCompra(t, P1, bien, 400);
  ok(M.existencias(t, bien) === 2 && t.caja === 1400, 'le comprás: un lote menos, más plata en la caja');
  M.registrarVenta(t, bien, 300);
  ok(M.existencias(t, bien) === 3 && t.caja === 1100, 'le vendés: un lote más, menos plata');
  t.stock[bien] = 0; ok(!M.puedeVenderte(t, bien), 'sin existencias no te vende');
  t.stock[bien] = 1; ok(M.puedeVenderte(t, bien), 'con una, sí');
  t.caja = 299; ok(M.puedeComprarte(t, bien, 300).motivo === 'caja', 'sin caja no te compra');
  t.caja = 300; ok(M.puedeComprarte(t, bien, 300).ok, 'con la caja justa, sí');
  t.stock[bien] = M.MERCADO.stockMax; ok(M.puedeComprarte(t, bien, 1).motivo === 'lleno', 'lleno no te compra');
  t.stock[bien] = 0; M.registrarCompra(t, P1, bien, 1); ok(M.existencias(t, bien) === 0, 'nunca en negativo');
  t.caja = 100; M.registrarVenta(t, bien, 9999); ok(t.caja === 0, 'la caja nunca en negativo');
  t.caja = M.cajaMaxima(P1); M.registrarCompra(t, P1, bien, 5000); ok(t.caja === M.cajaMaxima(P1), 'la caja, con tope');
  ok(M.puedeComprarte(null, bien, 100).ok, 'sin puesto, no se frena');
}

// ---------------------------------------------------------------- 4. los precios usan el factor
{
  const c = C.comercioNuevo();
  const bien = C.bienesDe(P1)[0];
  const normal = C.precios(c, P1, bien, 5, 'verano', 1), caro = C.precios(c, P1, bien, 5, 'verano', 1.3), barato = C.precios(c, P1, bien, 5, 'verano', 0.85);
  ok(caro.venta >= normal.venta && barato.venta <= normal.venta && caro.compra >= normal.compra && barato.compra <= normal.compra, 'el factor mueve los dos precios');
  ok(C.precios(c, P1, bien, 5, 'verano').compra === normal.compra, 'sin factor, igual que antes');
  ok(C.precios(c, P1, bien, 5, 'verano', NaN).compra === normal.compra && C.precios(c, P1, bien, 5, 'verano', -3).compra === normal.compra, 'un factor roto no se usa');
  ok(caro.compra > caro.venta, 'comprar y vender en el mismo puesto sigue perdiendo');
}

// ---------------------------------------------------------------- 5. guardado y renombre
{
  const rota = C.sanearComercio({ mercado: { [P1]: { dia: 9, caja: 1e12, stock: { [C.bienesDe(P1)[0]]: 999, zzz: 5 } }, '': { dia: 1 }, x: 7, [P2]: [] } });
  const t = rota.mercado[P1];
  ok(t && t.caja <= 1e7 && !('zzz' in t.stock) && Object.values(t.stock).every((v) => v <= 30), 'el guardado roto se sanea');
  ok(!('' in rota.mercado) && !('x' in rota.mercado), 'basura afuera');
  ok(Object.keys(C.sanearComercio(null).mercado).length === 0 && Object.keys(C.sanearComercio({}).mercado).length === 0, 'sin mercado guardado: vacío');
  const c = C.comercioNuevo(); M.tienda(c, P1, 3);
  const guardado = C.sanearComercio(JSON.parse(JSON.stringify(c)));
  eq(guardado.mercado[P1], c.mercado[P1], 'ida y vuelta por el guardado');
  const viejo = c.mercado[P1];
  ok(C.renombrarParada(c, P1, 'Aldea Nueva') >= 1 && c.mercado['Aldea Nueva'] === viejo && !(P1 in c.mercado), 'una parada que cambia de nombre se lleva su mercado');
  // un puesto viejo con un bien que falta se completa
  const d = C.comercioNuevo(); const td = M.tienda(d, P1, 3); const b0 = C.bienesDe(P1)[0]; delete td.stock[b0];
  ok(Number.isFinite(M.existencias(M.tienda(d, P1, 3), b0)) && b0 in d.mercado[P1].stock, 'el bien que falta se completa');
}

// ---------------------------------------------------------------- 6. el arbitraje no se dispara
// Un comerciante goloso: cada día, una sola ruta (comprar en un puesto, vender en el otro), hasta 6 operaciones.
{
  const c = C.comercioNuevo();
  const peso = (bien, a, b, d, temp) => {
    const ta = M.tienda(c, a, d), tb = M.tienda(c, b, d);
    const pa = C.precios(c, a, bien, d, temp, M.factorDe(ta, a, bien)), pb = C.precios(c, b, bien, d, temp, M.factorDe(tb, b, bien));
    return { ganancia: (pb.venta - pa.compra) * 100, pa, pb, ta, tb };
  };
  let total = 0, maxDia = 0; const DIAS = 36;
  for (let d = 1; d <= DIAS; d++) {
    const temp = ['verano', 'otono', 'invierno'][Math.floor((d - 1) / 4) % 3];
    c.hoy = { dia: d, vendidos: {}, comprados: {}, tomados: [] };
    const comunes = C.bienesDe(P1).filter((x) => C.bienesDe(P2).includes(x));
    let dia = 0;
    for (let k = 0; k < 6; k++) {
      const ops = comunes.map((x) => ({ x, ...peso(x, P1, P2, d, temp) })).concat(comunes.map((x) => ({ x, ...peso(x, P2, P1, d, temp), inv: true }))).sort((p, q) => q.ganancia - p.ganancia);
      const m = ops[0];
      if (!m || m.ganancia <= 0) break;
      const [de, a] = m.inv ? [P2, P1] : [P1, P2];
      const rc = C.comprar(c, de, m.x, d, temp, 1e6, M.factorDe(m.ta, de, m.x));
      if (!rc.ok || !M.puedeVenderte(M.tienda(c, de, d), m.x)) break;
      const tb = M.tienda(c, a, d);
      if (!M.puedeComprarte(tb, m.x, m.pb.venta * 100).ok) break;
      M.registrarCompra(M.tienda(c, de, d), de, m.x, rc.precio * 100);
      const rv = C.vender(c, a, m.x, d, temp, 1e6, M.factorDe(tb, a, m.x));
      if (!rv.ok) break;
      M.registrarVenta(tb, m.x, rv.precio * 100);
      dia += (rv.precio - rc.precio) * 100;
    }
    total += dia; maxDia = Math.max(maxDia, dia);
  }
  const prom = total / DIAS;
  ok(prom <= 1500, `revender de oficio rinde menos que un jornal ($${Math.round(prom)} por día de media)`);
  ok(maxDia <= 4000, `y el mejor día no se dispara ($${maxDia})`);
}

console.log(`verificar-3-8-8-mercado: ${n} verificaciones ok`);
