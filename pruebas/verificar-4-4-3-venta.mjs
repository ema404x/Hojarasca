// 4.4.3: vender de vuelta un negocio comprado y sumar plata a una sociedad ya hecha (src/negocios-vecinos.js, negocios-vecinos-voces.js,
// negocios-vecinos-juego.js), en Node:
//   · el precio de venta: un porcentaje de lo que pagaste, siempre entre el 50 y el 85 %, que sube con los días y la amistad y baja si lo descuidaste;
//   · la reacción del vecino (ofendido, regatea, acepta, emocionado) con su voz y sin textos rotos;
//   · vender: se cobra la caja y el negocio por la puerta de la economía, el negocio vuelve a ser del vecino, sin pesos de la nada; comprar y vender de
//     inmediato siempre pierde; recomprar pronto cuesta un 10 % más;
//   · el aporte adicional a una sociedad: sube el porcentaje (hasta el 40 % del precio), rinde desde el día siguiente, el retiro devuelve cada aporte
//     según sus propios días; el vecino se niega si ya estás en el tope o la amistad bajó;
//   · el guardado (campos nuevos con valor por defecto, partidas de la 4.4.2, lo roto) y el Desafío sin nada de esto;
//   · el juego con un contexto de mentira: los menús, el cálculo a la vista, el cartel que se va, el cuaderno;
//   · lo enganchado en main.js, la guía y que no hay inglés ni mando en lo nuevo.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const N = await import('../src/negocios-vecinos.js');
const { VOCES_VENTA, VOCES_APORTE, VOCES_NEGOCIO } = await import('../src/negocios-vecinos-voces.js');
const { economiaNueva, pesosDe, formatoPesos, ultimosMovimientos, MAX_PESOS } = await import('../src/economia.js');
const A = await import('../src/aldea.js');
const V = await import('../src/vecindad.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const cerca = (a, b, tol, m) => { assert.ok(Math.abs(a - b) <= tol, `${m} (${a} vs ${b})`); n++; };

const relax = (pesos = 0, dia = 1, horas = 12) => {
  const p = { modo: 'relax', dia, horas, economia: { ...economiaNueva(), pesos }, negociosVecinos: N.negociosVecinosNuevo(), aldea: { pobladores: [], locales: {} } };
  for (const id of N.IDS_NEGOCIOS) { const c = N.NEGOCIOS[id].vecino; if (A.esPobladorAldea(c)) { p.aldea.pobladores.push({ clave: c }); p.aldea.locales[A.LOTE_DE[c]] = 1; } }
  return p;
};
const amistad = (p, clave, puntos, hist = 0) => { V.cambiarAmistad(p, clave, 0, 1); const f = p.vecindad.personas[clave]; f.p = puntos; f.max = Math.max(f.max, puntos >= 140 ? 2 : puntos >= 50 ? 1 : 0); f.hist = hist; return f; };
const ctxDe = (puntos, hist = 0, extra = {}) => ({ puntos, hist, histTotal: 3, etapa: '', ...extra });
const sinRotos = (v, ruta = '') => {
  if (typeof v === 'number') ok(Number.isFinite(v), `${ruta}: número finito (${v})`);
  else if (typeof v === 'string') ok(!/undefined|NaN/.test(v), `${ruta}: sin undefined ni NaN («${v.slice(0, 60)}»)`);
  else if (Array.isArray(v)) v.forEach((x, i) => sinRotos(x, `${ruta}[${i}]`));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) sinRotos(v[k], `${ruta}.${k}`);
};
// avanza los días de una partida (como el juego: cada día se liquida) y pasa a verlo cada `visita` días (0: nunca)
const avanzar = (p, hasta, id = null, visita = 5) => {
  for (let d = p.dia + 1; d <= hasta; d++) { p.dia = d; N.pasarDia(p, d); if (id && visita > 0 && d % visita === 0) N.retirarCaja(p, id, d); }
};

// ---------------------------------------------------------------- 1. el precio de venta
{
  ok(N.VENTA.piso === 0.5 && N.VENTA.techo === 0.85, 'el precio de venta va del 50 al 85 % de lo que pagaste');
  const n0 = { desde: 1, pagado: 100000, destino: 'queda', mala: 0, perdido: 0, total: 0, caja: 0 };
  // barrido: negocio × amistad × días × descuido
  let minF = 9, maxF = 0;
  for (const puntos of [0, 10, 30, 49, 50, 60, 95, 100, 140, 180, 200]) for (const dias of [0, 1, 6, 7, 8, 15, 30, 60, 61, 120, 900]) for (const mala of [0, 0.5, 1]) for (const perdido of [0, 5000, 90000]) {
    const x = { ...n0, mala: Math.round(mala * dias), perdido, total: 10000 };
    const f = N.fraccionVenta(x, { puntos, dia: 1 + dias });
    ok(Number.isFinite(f.fraccion) && f.fraccion >= 0.5 - 1e-12 && f.fraccion <= 0.85 + 1e-12, `fracción en rango (amistad ${puntos}, ${dias} días, mala ${mala}, perdido ${perdido}): ${f.fraccion}`);
    minF = Math.min(minF, f.fraccion); maxF = Math.max(maxF, f.fraccion);
  }
  ok(minF === 0.5 && Math.abs(maxF - 0.85) < 1e-9, `el piso (50 %) y el techo (85 %) se alcanzan (${minF}, ${maxF})`);
  // sube con los días y con la amistad
  const f = (puntos, dias, x = {}) => N.fraccionVenta({ ...n0, ...x }, { puntos, dia: 1 + dias }).fraccion;
  ok(f(100, 10) < f(100, 20) && f(100, 20) < f(100, 40) && f(100, 60) === f(100, 200), 'sube con los días que lo tuviste y se detiene a los 60');
  ok(f(60, 20) < f(100, 20) && f(100, 20) < f(150, 20) && f(180, 20) === f(200, 20), 'sube con la amistad (de 50 a 180 puntos)');
  eq(f(10, 20), f(49, 20), 'con menos de 50 puntos la amistad no suma');
  // baja si lo descuidaste
  ok(f(100, 40, { mala: 30 }) < f(100, 40), 'baja si pasaron días sin pasar a verlo');
  ok(f(100, 40, { perdido: 20000, total: 10000 }) < f(100, 40), 'baja si la caja se llenó y se perdió ganancia');
  ok(f(100, 40, { mala: 40, perdido: 90000, total: 1000 }) >= f(100, 40) - 0.15 - 1e-12, 'pero el descuido no resta más de 15 puntos');
  cerca(N.fraccionVenta({ ...n0 }, { puntos: 100, dia: 41 }).porDias, 0.1, 1e-9, '40 días suman 10 puntos (0,25 por día)');

  // la reacción
  const rv = (x, puntos, dia, id = 'panaderia') => N.reaccionVenta(id, { ...n0, ...x }, { puntos, dia });
  eq([rv({}, 100, 4).tipo, rv({}, 100, 7).tipo, rv({}, 100, 8).tipo], ['ofendido', 'ofendido', 'acepta'], 'lo vendés a los 3 o 6 días: se ofende; a los 7, acepta');
  eq(rv({}, 100, 4).amistad, -2, 'el ofendido te tiene −2 de confianza');
  eq(rv({}, 30, 40).tipo, 'regatea', 'con menos de 50 puntos regatea');
  eq(rv({ destino: 'se-va' }, 100, 40).tipo, 'emocionado', 'si se había ido a otra cosa y vuelve a su local, se emociona');
  eq(rv({}, 100, 40, 'almacen').tipo, 'emocionado', 'Ercilia (apego fuerte) con 100 puntos se emociona');
  eq(rv({}, 94, 40, 'almacen').tipo, 'acepta', 'con 94 sólo acepta');
  eq(rv({}, 100, 40).tipo, 'acepta', 'Rosa (apego normal) con 100 puntos: acepta');
  eq(rv({}, 100, 40, 'cantina').tipo, 'emocionado', 'los de apego fuerte (Lucrecia) con 95 puntos o más se emocionan');
  eq(rv({}, 94, 40, 'cantina').tipo, 'acepta', 'con 94 todavía no');
  ok(rv({}, 100, 40, 'cantina').fraccion > rv({}, 100, 40, 'panaderia').fraccion, 'la emoción paga un poco más');
  ok(rv({}, 100, 4).fraccion < rv({}, 100, 8).fraccion, 'y el ofendido, un poco menos');
  ok(rv({}, 30, 40).fraccion < rv({}, 60, 40).fraccion, 'el que regatea paga menos que el que acepta');
  const r0 = rv({}, 100, 40);
  ok(r0.precio === Math.round(100000 * r0.fraccion / 50) * 50, 'el precio es el porcentaje de lo que pagaste, redondeado a $50');
  eq(N.reaccionVenta('nada', n0, {}).precio, 0, 'negocio que no existe: nada');
  sinRotos(r0, 'reacción');
}

// ---------------------------------------------------------------- 2. vender
{
  const p = relax(400000, 1);
  const c0 = pesosDe(p);
  const comp = N.comprar(p, 'panaderia', ctxDe(100, 2, { dia: 1 }));
  ok(comp.ok, 'compra la panadería');
  eq(N.evaluarVenta(p, 'herreria', ctxDe(100, 2)).motivo, 'no-tuyo', 'lo que no es tuyo no se vende');
  const desafio = { modo: 'desafio', dia: 1, economia: { ...economiaNueva(), pesos: 1000 } };
  eq(N.evaluarVenta(desafio, 'panaderia', ctxDe(100)).motivo, 'nada', 'en el Desafío no hay nada');
  eq(N.evaluarVenta(p, 'nada', ctxDe(100)).motivo, 'nada', 'un negocio que no existe no se vende');
  avanzar(p, 40, 'panaderia', 7);
  p.dia = 40;
  const antes = pesosDe(p), caja = N.cajaDe(p, 'panaderia');
  const ev = N.evaluarVenta(p, 'panaderia', ctxDe(100, 2, { dia: 40 }));
  ok(ev.ok && ev.precio > 0 && ev.total === ev.precio + ev.caja && ev.caja === caja && ev.pagado === comp.precio, `evalúa: ${formatoPesos(ev.precio)} + caja ${formatoPesos(ev.caja)}`);
  eq(pesosDe(p), antes, 'evaluar no mueve plata');
  ok(N.esTuyo(p, 'panaderia'), 'ni vende');
  const v = N.vender(p, 'panaderia', ctxDe(100, 2, { dia: 40 }));
  ok(v.ok && v.precio === ev.precio && v.caja === caja && v.total === ev.total, 'vende al precio evaluado y cobra la caja');
  eq(pesosDe(p), antes + ev.total, 'la billetera sube exactamente el precio más la caja (ni un peso de más)');
  ok(!N.esTuyo(p, 'panaderia') && !p.negociosVecinos.comprados.panaderia, 'el negocio ya no es tuyo');
  eq(N.tusNegocios(p), [], 'no figura en tus negocios');
  eq(N.cajaDe(p, 'panaderia'), 0, 'la caja quedó en cero (no queda plata atrapada)');
  const libro = ultimosMovimientos(p, 4);
  ok(libro.some((m) => /^Vendiste la panadería de Rosa/.test(m.motivo) && m.monto === v.precio), 'en el libro: «Vendiste la panadería de Rosa»');
  ok(libro.some((m) => /Caja de la panadería de Rosa, al venderlo/.test(m.motivo) && m.monto === caja), 'y la caja con su motivo');
  ok(p.negociosVecinos.vendidos.panaderia.dia === 40 && p.negociosVecinos.vendidos.panaderia.monto === v.precio, 'queda anotado cuándo y por cuánto la vendiste');
  eq(p.negociosVecinos.total.vendido, v.precio, 'el total vendido');
  const h = p.negociosVecinos.historial.at(-1);
  ok(h.tipo === 'venta' && h.local === 'panaderia' && h.monto === v.precio, 'y el historial');
  eq(N.vender(p, 'panaderia', ctxDe(100)).motivo, 'no-tuyo', 'no se vende dos veces');
  // la cuenta total: invertís $84.000, cobrás caja + venta + lo que fuiste retirando: nunca más de lo que ganó el negocio + lo que recuperás
  const ganado = p.negociosVecinos.total.cobrado + v.precio;
  ok(v.precio < comp.precio, `vendés por menos de lo que pagaste (${formatoPesos(v.precio)} < ${formatoPesos(comp.precio)})`);
  ok(pesosDe(p) - c0 === ganado - comp.precio, 'el saldo coincide con lo cobrado menos lo pagado');
  // el negocio ya no produce
  const antes2 = p.negociosVecinos.total.ganado; avanzar(p, 60); eq(p.negociosVecinos.total.ganado, antes2, 'tras vender, ya no rinde ganancia');

  // comprar y vender de inmediato: siempre pierde, en todas las combinaciones
  let peorRet = 0, mejorInmediato = 0;
  for (const id of N.IDS_NEGOCIOS) for (const puntos of [30, 60, 100, 150, 200]) for (const dias of [0, 3, 7, 20, 60, 120]) {
    const q = relax(1e6, 1), cc = N.comprar(q, id, ctxDe(puntos, 3, { dia: 1, compadre: puntos >= 140 }));
    if (!cc.ok) continue;
    const base = pesosDe(q);
    avanzar(q, 1 + dias, id, 2);
    const antesV = pesosDe(q);
    const vv = N.vender(q, id, ctxDe(puntos, 3, { dia: 1 + dias }));
    ok(vv.ok, `${id}/${puntos}/${dias}: vende`);
    ok(vv.precio < cc.precio, `${id}/${puntos}/${dias}: el precio de venta es menor que el de compra (${vv.precio} < ${cc.precio})`);
    ok(vv.precio >= Math.round(cc.precio * 0.5 / 50) * 50 - 50 && vv.precio <= cc.precio * 0.85 + 50, `${id}/${puntos}/${dias}: dentro de 50 a 85 %`);
    eq(pesosDe(q) - antesV, vv.total, `${id}/${puntos}/${dias}: el saldo sube lo que dice`);
    peorRet = Math.max(peorRet, vv.precio / cc.precio);
    if (dias === 0) mejorInmediato = Math.max(mejorInmediato, vv.precio / cc.precio);
    void base;
  }
  ok(peorRet <= 0.851, `ninguna venta pasa del 85 % de lo pagado (${peorRet.toFixed(3)})`);
  ok(mejorInmediato <= 0.66, `comprar y vender el mismo día devuelve hasta el ${(mejorInmediato * 100).toFixed(1)} %: pérdida de más de un tercio`);

  // vender con sociedad (una partida rara): se cierra y se cobra
  const w = relax(400000, 1); N.comprar(w, 'herreria', ctxDe(100, 2, { dia: 1 }));
  w.negociosVecinos.socios.herreria = { desde: 1, aporte: 20000, pct: 11.9, caja: 3000, total: 0, aviso: null, ultimo: null, extras: [], previo: null };
  avanzar(w, 20);
  const antesW = pesosDe(w);
  const vw = N.vender(w, 'herreria', ctxDe(100, 2, { dia: 20 }));
  ok(vw.ok && vw.sociedad?.ok && !w.negociosVecinos.socios.herreria, 'si había una sociedad, se cierra al vender');
  ok(pesosDe(w) > antesW + vw.total - 1, 'y te devuelven lo suyo');

  // la cartera: al vender uno, el otro rinde como primero
  const t = relax(1e6, 1); N.comprar(t, 'panaderia', ctxDe(100, 2, { dia: 1 })); N.comprar(t, 'pescaderia', ctxDe(100, 2, { dia: 1 }));
  eq(N.tusNegocios(t), ['panaderia', 'pescaderia'], 'dos negocios');
  avanzar(t, 15);
  N.vender(t, 'panaderia', ctxDe(100, 2, { dia: 15 }));
  eq(N.tusNegocios(t), ['pescaderia'], 'queda sólo el otro');
  eq(N.resumenNegociosVecinos(t, 15).propios[0].cartera, 1, 'que vuelve a rendir como el primero (cartera 100 %)');

  // el techo de la billetera: no se vende si no cabe
  const lleno = relax(MAX_PESOS - 100, 1); lleno.negociosVecinos.comprados.panaderia = { desde: 1, pagado: 84000, destino: 'queda', orden: 1, visita: 1, bono: 1, caja: 5000, total: 0, perdido: 0, mala: 0, ultimo: null };
  const evl = N.evaluarVenta(lleno, 'panaderia', ctxDe(100, 2, { dia: 30 }));
  ok(!evl.ok && evl.motivo === 'techo', 'si la billetera no aguanta tanta plata junta, no vende (y no se pierde nada)');
  eq(N.vender(lleno, 'panaderia', ctxDe(100, 2, { dia: 30 })).ok, false, 'tampoco por la vía directa');
  ok(N.esTuyo(lleno, 'panaderia') && pesosDe(lleno) === MAX_PESOS - 100, 'y todo sigue como estaba');

  // el descuido baja el precio de verdad
  const cuidado = relax(1e6, 1), descuidado = relax(1e6, 1);
  N.comprar(cuidado, 'almacen', ctxDe(100, 3, { dia: 1 })); N.comprar(descuidado, 'almacen', ctxDe(100, 3, { dia: 1 }));
  avanzar(cuidado, 60, 'almacen', 3); avanzar(descuidado, 60, 'almacen', 0);
  const pc = N.evaluarVenta(cuidado, 'almacen', ctxDe(100, 3, { dia: 60 })), pd = N.evaluarVenta(descuidado, 'almacen', ctxDe(100, 3, { dia: 60 }));
  ok(pd.reaccion.detalle.descuido > 0.1 && pc.reaccion.detalle.descuido === 0, `descuidado: resta ${pd.reaccion.detalle.descuido.toFixed(3)}; cuidado: nada`);
  ok(pd.precio < pc.precio, `y paga menos (${formatoPesos(pd.precio)} contra ${formatoPesos(pc.precio)})`);
  ok(pd.caja > 0 && pc.caja >= 0, 'la caja que quedó se cobra aparte');
}

// ---------------------------------------------------------------- 3. recomprar
{
  const p = relax(1e6, 1);
  const c1 = N.comprar(p, 'panaderia', ctxDe(100, 2, { dia: 1 }));
  avanzar(p, 20);
  const v = N.vender(p, 'panaderia', ctxDe(100, 2, { dia: 20 }));
  ok(v.ok, 'vendida el día 20');
  const rec = N.recargoDeRecompra(p, 'panaderia', 25);
  ok(rec && rec.recargo === 1.1 && rec.hasta === 50, 'recargo del 10 % hasta el día 50');
  const e1 = N.evaluarCompra(p, 'panaderia', ctxDe(100, 2, { dia: 25 }));
  const lista = N.reaccionCompra('panaderia', ctxDe(100, 2)).precio;
  ok(e1.ok && e1.precio === Math.round(lista * 1.1 / 500) * 500 && e1.recargo === 1.1 && e1.reaccion.precio === e1.precio, `antes de los 30 días: ${formatoPesos(lista)} + 10 % = ${formatoPesos(e1.precio)}`);
  const e2 = N.evaluarCompra(p, 'panaderia', ctxDe(100, 2, { dia: 49 }));
  eq(e2.precio, e1.precio, 'el día 49 todavía');
  const e3 = N.evaluarCompra(p, 'panaderia', ctxDe(100, 2, { dia: 50 }));
  ok(e3.precio === lista && e3.recargo === 1, 'a los 30 días justos, el precio de siempre');
  eq(N.recargoDeRecompra(p, 'panaderia', 50), null, 'ya no hay recargo');
  eq(N.evaluarCompra(p, 'pescaderia', ctxDe(100, 2, { dia: 25 })).recargo, 1, 'otro negocio, sin recargo');
  // recomprar
  const pesos0 = pesosDe(p);
  const c2 = N.comprar(p, 'panaderia', ctxDe(100, 2, { dia: 25 }));
  ok(c2.ok && c2.precio === e1.precio && c2.recargo === 1.1, 'se recompra con el recargo');
  eq(pesosDe(p), pesos0 - c2.precio, 'pagando por la economía');
  ok(!p.negociosVecinos.vendidos.panaderia, 'y deja de figurar como vendido');
  ok(N.esTuyo(p, 'panaderia'), 'vuelve a ser tuyo');
  // el ciclo comprar-vender-recomprar no regala plata
  let saldo = 1e6; const q = relax(saldo, 1);
  N.comprar(q, 'cantina', ctxDe(150, 3, { dia: 1, compadre: true }));
  for (let ciclo = 0; ciclo < 5; ciclo++) {
    const d0 = q.dia;
    avanzar(q, d0 + 31);
    N.vender(q, 'cantina', ctxDe(150, 3, { dia: q.dia }));
    N.comprar(q, 'cantina', ctxDe(150, 3, { dia: q.dia, compadre: true }));
  }
  const patrimonio = pesosDe(q) + (q.negociosVecinos.comprados.cantina?.pagado || 0);
  // contra quedarse con el negocio 160 días
  const r = relax(1e6, 1); N.comprar(r, 'cantina', ctxDe(150, 3, { dia: 1, compadre: true })); avanzar(r, q.dia, 'cantina');
  N.retirarCaja(r, 'cantina', r.dia);
  ok(pesosDe(r) > pesosDe(q), `quedarse con el negocio rinde más que girar comprando y vendiendo (${formatoPesos(pesosDe(r))} contra ${formatoPesos(pesosDe(q))})`);
  void patrimonio; void c1;
}

// ---------------------------------------------------------------- 4. el aporte adicional
{
  const { min, max } = N.rangoDeAporte('almacen');
  eq([min, max], [17000, 68000], 'almacén: de $17.000 a $68.000 de aporte total');
  const p = relax(500000, 1);
  eq(N.evaluarAporteExtra(p, 'almacen', 10000, ctxDe(150, 3)).motivo, 'no-socio', 'sin ser socio, no hay aporte adicional');
  const e = N.entrarSocio(p, 'almacen', min, ctxDe(150, 3, { dia: 1 }));
  eq([e.pct, e.aporte], [10, 17000], 'entrás con el mínimo: 10 %');
  const s = p.negociosVecinos.socios.almacen;
  eq(s.extras, [], 'sin aportes adicionales todavía');
  eq(N.restoDeAporte('almacen', s), 51000, 'te quedan $51.000 para llegar al 40 % del precio');
  eq(N.minimoDeAporteExtra('almacen', s), 8500, 'lo mínimo que se suma: el 5 % del precio ($8.500)');
  eq(N.montosDeAporteExtra('almacen', s), [17000, 34000, 51000], 'se ofrecen un tercio, dos tercios y todo lo que falta');
  eq(N.puntosDeAporte('almacen', 17000, 1), 10, 'a un compadre, $17.000 suman 10 puntos');
  eq(N.puntosDeAporte('almacen', 17000, 0.9), 9, 'a un amigo, 9');
  // la reacción
  eq(N.reaccionAporteExtra('almacen', s, ctxDe(150, 3)), { tipo: 'acepta', factor: 1 }, 'compadre: acepta (factor 1)');
  eq(N.reaccionAporteExtra('almacen', s, ctxDe(100, 3)), { tipo: 'acepta', factor: 0.9 }, 'amigo (100 puntos, el almacén pide 95): acepta con factor 0,9');
  const rech = N.reaccionAporteExtra('almacen', s, ctxDe(90, 3));
  ok(rech.tipo === 'rechaza' && rech.faltan === 5, 'si la amistad bajó de 95: rechaza (faltan 5 puntos)');
  eq(N.reaccionAporteExtra('cantina', { aporte: 20000, extras: [], aviso: null }, ctxDe(150, 0)).tipo, 'resiste', 'Lucrecia sin su historia: resiste');
  // evaluar
  eq(N.evaluarAporteExtra(p, 'almacen', 1000, ctxDe(150, 3)).motivo, 'monto', 'menos del mínimo: no');
  eq(N.evaluarAporteExtra(p, 'almacen', 51500, ctxDe(150, 3)).motivo, 'monto', 'más de lo que falta: no');
  eq(N.evaluarAporteExtra(p, 'almacen', 17000, ctxDe(90, 3)).motivo, 'rechaza', 'sin amistad suficiente: rechaza');
  const pobre2 = relax(20000, 1); N.entrarSocio(pobre2, 'almacen', 17000, ctxDe(150, 3, { dia: 1 }));
  const ep = N.evaluarAporteExtra(pobre2, 'almacen', 17000, ctxDe(150, 3));
  ok(!ep.ok && ep.motivo === 'dinero' && ep.faltan === 14000, 'sin plata: te dice cuánto falta ($14.000)');
  eq(N.sumarAporte(pobre2, 'almacen', 17000, ctxDe(150, 3)).ok, false, 'y no mueve nada');
  eq(pesosDe(pobre2), 3000, 'la billetera igual');
  // sumar, el día 10 (el aporte rinde desde el día siguiente)
  avanzar(p, 10);
  const cajaAntes = p.negociosVecinos.socios.almacen.caja, saldo0 = pesosDe(p);
  const r1 = N.sumarAporte(p, 'almacen', 17000, ctxDe(150, 3, { dia: 10 }));
  ok(r1.ok && r1.aporte === 17000 && r1.aporteTotal === 34000 && r1.pct === 20 && r1.pctAntes === 10 && r1.resto === 34000, 'suma $17.000: de 10 % a 20 %, te quedan $34.000');
  eq(pesosDe(p), saldo0 - 17000, 'pagado por la economía');
  ok(ultimosMovimientos(p, 1)[0].motivo === 'Aporte adicional a tu sociedad en el almacén de Ercilia' && ultimosMovimientos(p, 1)[0].monto === -17000, 'con su motivo en el libro');
  eq(s.extras, [{ dia: 10, monto: 17000 }], 'queda anotado el aporte con su día');
  eq(s.previo, { dia: 10, pct: 10 }, 'y el porcentaje de antes rige hasta ese día');
  eq(s.caja, cajaAntes, 'la caja no se toca');
  ok(r1.porDia === Math.round((N.gananciaBase('almacen') * 20) / 100) && r1.tope === N.topeDeSocio('almacen', 20), 'el aviso trae lo que rinde por día y el tope de la caja');
  // pasar el tiempo: el día 10 se cobra al 10 %, desde el 11 al 20 %
  const parte = (d, pc) => Math.round((N.gananciaDelDia('almacen', d).neto * pc) / 100 / 10) * 10;
  const c10 = s.caja; p.dia = 11; N.pasarDia(p, 11);
  eq(s.caja - c10, parte(10, 10), 'el día del aporte todavía rinde al porcentaje de antes');
  const c11 = s.caja; p.dia = 12; N.pasarDia(p, 12);
  eq(s.caja - c11, parte(11, 20), 'el día siguiente, al nuevo');
  ok(parte(11, 20) > parte(11, 10), 'que es más');
  // un segundo aporte en el mismo día no pisa el «antes»; otro día, sí
  const r2 = N.sumarAporte(p, 'almacen', 17000, ctxDe(150, 3, { dia: 12 }));
  ok(r2.ok && r2.pct === 30 && s.previo.dia === 12 && s.previo.pct === 20, 'otro día: del 20 al 30 %, y el «antes» es el 20 %');
  const r3 = N.sumarAporte(p, 'almacen', 17000, ctxDe(150, 3, { dia: 12 }));
  ok(r3.ok && r3.pct === 40 && s.previo.pct === 20 && s.aporte === 68000, 'el mismo día: sigue el «antes» (20 %); llegás al 40 % con los $68.000');
  eq(N.restoDeAporte('almacen', s), 0, 'ya no falta nada');
  const t = N.reaccionAporteExtra('almacen', s, ctxDe(150, 3));
  eq(t.tipo, 'tope', 'ya estás en el tope: el vecino se niega');
  eq(N.evaluarAporteExtra(p, 'almacen', 8500, ctxDe(150, 3)).motivo, 'tope', 'y no se puede sumar más');
  eq(N.montosDeAporteExtra('almacen', s), [], 'ni se ofrecen montos');
  ok(s.pct <= N.SOCIEDAD.porcentajeMax, 'el porcentaje nunca pasa del tope');
  eq(s.extras.length, 3, 'tres aportes adicionales anotados');
  // el retiro: cada aporte cuenta sus propios días
  const ex = { desde: 1, aporte: 51000, extras: [{ dia: 41, monto: 34000 }] };
  cerca(N.devolucionDe(ex, 43), 17000 * 1 + 34000 * 0.6, 1e-6, 'el original (42 días) vuelve entero y el nuevo (2 días) al 60 %');
  cerca(N.devolucionDe(ex, 50), 17000 + 34000 * 0.8, 1e-6, 'a los 9 días del aporte, el 80 %');
  cerca(N.devolucionDe(ex, 70), 17000 + 34000 * 0.92, 1e-6, 'a los 29, el 92 %');
  cerca(N.devolucionDe(ex, 100), 51000, 1e-6, 'a los 59, todo');
  eq(N.devolucionDe({ desde: 1, aporte: 20000 }, 10), 20000 * N.devolucionPorDias(9), 'una sociedad de antes (sin aportes adicionales) devuelve como siempre');
  eq(N.devolucionDe(null, 5), 0, 'sin sociedad, nada');
  // el retiro de verdad
  const w = relax(500000, 1);
  N.entrarSocio(w, 'panaderia', 8000, ctxDe(150, 3, { dia: 1 }));
  avanzar(w, 41);
  N.sumarAporte(w, 'panaderia', 24000, ctxDe(150, 3, { dia: 41 }));
  const aw = N.avisarRetiro(w, 'panaderia', 41);
  eq(aw.devolucion, Math.round(8000 + 24000 * 0.6), 'el aviso dice cuánto vuelve: lo primero entero y lo nuevo al 60 %');
  eq(N.reaccionAporteExtra('panaderia', w.negociosVecinos.socios.panaderia, ctxDe(150, 3)).tipo, 'tope', 'con el aporte al máximo: tope');
  const w2 = relax(500000, 1);
  N.entrarSocio(w2, 'panaderia', 8000, ctxDe(150, 3, { dia: 1 }));
  avanzar(w2, 20);
  N.sumarAporte(w2, 'panaderia', 8000, ctxDe(150, 3, { dia: 20 }));
  N.avisarRetiro(w2, 'panaderia', 20);
  eq(N.reaccionAporteExtra('panaderia', w2.negociosVecinos.socios.panaderia, ctxDe(150, 3)).tipo, 'aviso', 'con el retiro avisado: no recibe más plata');
  eq(N.evaluarAporteExtra(w2, 'panaderia', 8000, ctxDe(150, 3)).motivo, 'aviso', 'ni por la vía directa');
  N.cancelarRetiro(w2, 'panaderia');
  eq(N.reaccionAporteExtra('panaderia', w2.negociosVecinos.socios.panaderia, ctxDe(150, 3)).tipo, 'acepta', 'si seguís de socio, vuelve a aceptar');
  N.avisarRetiro(w2, 'panaderia', 20);
  const saldoAntes = pesosDe(w2), caja2 = w2.negociosVecinos.socios.panaderia.caja;
  avanzar(w2, 23);
  ok(!w2.negociosVecinos.socios.panaderia, 'el día 22 se hace efectivo el retiro');
  const devuelto = Math.round(8000 * N.devolucionPorDias(22 - 1) + 8000 * N.devolucionPorDias(22 - 20));
  ok(pesosDe(w2) >= saldoAntes + devuelto, `se devolvió cada aporte según sus días: ${formatoPesos(devuelto)} (8000 al 92 % y 8000 al 60 %)`);
  void caja2;
  // el factor de la amistad se aplica al aporte nuevo (primero compadre, ahora amigo)
  const m = relax(500000, 1);
  N.entrarSocio(m, 'almacen', 17000, ctxDe(150, 3, { dia: 1 }));
  const rm = N.sumarAporte(m, 'almacen', 17000, ctxDe(100, 3, { dia: 5 }));
  ok(rm.ok && rm.pct === 19, 'compadre 10 % + un amigo de $17.000 (9 puntos) = 19 %');
  // comprar el negocio siendo socio con aportes adicionales: el crédito cuenta cada aporte por sus días
  const k = relax(900000, 1);
  N.entrarSocio(k, 'panaderia', 8000, ctxDe(150, 3, { dia: 1 }));
  avanzar(k, 40);
  N.sumarAporte(k, 'panaderia', 24000, ctxDe(150, 3, { dia: 40 }));
  const ek = N.evaluarCompra(k, 'panaderia', ctxDe(150, 3, { dia: 41 }));
  eq(ek.credito, Math.round((8000 * 1 + 24000 * 0.6) / 50) * 50, 'comprar siendo socio: el crédito del aporte nuevo vuelve al 60 %');
  ok(N.comprar(k, 'panaderia', ctxDe(150, 3, { dia: 41 })).ok && !k.negociosVecinos.socios.panaderia, 'y se compra, cerrando la sociedad');
  // sin números rotos ni negativos
  for (const id of N.IDS_NEGOCIOS) {
    const q = relax(1e6, 1); const { min } = N.rangoDeAporte(id);
    N.entrarSocio(q, id, min, ctxDe(200, 3, { dia: 1 }));
    for (const mo of N.montosDeAporteExtra(id, q.negociosVecinos.socios[id])) {
      const copia = JSON.parse(JSON.stringify(q));
      const r = N.sumarAporte(copia, id, mo, ctxDe(200, 3, { dia: 2 }));
      ok(r.ok, `${id}: suma ${mo}`);
      sinRotos(r, id);
      ok(copia.negociosVecinos.socios[id].aporte <= N.rangoDeAporte(id).max && copia.negociosVecinos.socios[id].pct <= 45, `${id}: aporte total y porcentaje dentro del tope`);
    }
  }
}

// ---------------------------------------------------------------- 5. el guardado
{
  // una partida de la 4.4.2 (sin los campos nuevos) carga igual
  const vieja = { v: 1, ultimoDia: 30, orden: 1, comprados: { panaderia: { desde: 5, pagado: 84000, destino: 'queda', orden: 1, visita: 28, bono: 1, caja: 4000, total: 30000, perdido: 0, ultimo: { dia: 29, neto: 1200, ventas: 3500 } } },
    socios: { herreria: { desde: 3, aporte: 15000, pct: 11.9, caja: 2000, total: 9000, aviso: null, ultimo: { dia: 29, parte: 200 } } }, rechazos: {}, historial: [{ dia: 5, tipo: 'compra', local: 'panaderia', monto: -84000 }], total: { ganado: 40000, invertido: 99000, devuelto: 0, cobrado: 20000 } };
  const s = N.sanearNegociosVecinos(JSON.parse(JSON.stringify(vieja)), 30);
  eq(s.vendidos, {}, 'sin negocios vendidos');
  eq(s.comprados.panaderia.mala, 0, 'el negocio comprado trae «mala: 0»');
  eq(s.socios.herreria.extras, [], 'la sociedad trae «extras: []»');
  eq(s.socios.herreria.previo, null, 'y «previo: null»');
  eq(s.total.vendido, 0, 'el total vendido arranca en cero');
  ok(s.comprados.panaderia.pagado === 84000 && s.comprados.panaderia.caja === 4000 && s.socios.herreria.aporte === 15000 && s.socios.herreria.pct === 11.9 && s.total.ganado === 40000, 'y lo de antes queda igual');
  eq(N.negociosVecinosNuevo().vendidos, {}, 'lo nuevo empieza con valor por defecto');
  eq(N.devolucionDe(s.socios.herreria, 20), 15000 * N.devolucionPorDias(17), 'y la devolución de esa sociedad es la de siempre');
  // lo roto
  const roto = N.sanearNegociosVecinos({ v: 1, comprados: { cantina: { desde: 3, pagado: 200000, mala: -5, orden: 1 }, panaderia: { desde: 1, pagado: 80000, mala: 'mucho', orden: 2 } },
    socios: { herreria: { desde: 3, aporte: 20000, pct: 11.9, caja: 0, total: 0, extras: [{ dia: -4, monto: 15000 }, { dia: 9e9, monto: 99999 }, 'x', null, { dia: 5, monto: NaN }, { dia: 6, monto: -10 }], previo: { dia: 'a', pct: 'b' } },
      pescaderia: { desde: 3, aporte: 30000, pct: 10, extras: Array.from({ length: 30 }, (_, i) => ({ dia: i + 1, monto: 1000 })), previo: { dia: 7, pct: 999 } } },
    vendidos: { cantina: { dia: 5, monto: 1 }, herreria: { dia: -3, monto: 1e99, pagado: 'x' }, nada: { dia: 1 }, almacen: 7, 'sala-miel': { dia: 9e9, monto: 5000, pagado: 6000 } }, total: { vendido: -4, ganado: 'x' } }, 20);
  eq(Object.keys(roto.vendidos).sort(), ['herreria', 'sala-miel'], 'de lo vendido sólo quedan los negocios que existen, no comprados y con forma de objeto');
  ok(roto.vendidos.herreria.dia >= 1 && roto.vendidos.herreria.monto <= 1e8 && roto.vendidos.herreria.pagado === 0, 'lo vendido, acotado');
  ok(roto.vendidos['sala-miel'].dia <= 20, 'la venta no es del futuro');
  ok(roto.comprados.cantina.mala === 0 && roto.comprados.panaderia.mala === 0, 'la «mala» rota sale en cero');
  const ex = roto.socios.herreria.extras, suma = ex.reduce((a, q) => a + q.monto, 0);
  ok(ex.length === 2 && suma <= roto.socios.herreria.aporte && ex.every((q) => q.dia >= 1 && q.dia <= 20 && q.monto > 0), `los aportes adicionales rotos se acotan (${JSON.stringify(ex)})`);
  ok(roto.socios.herreria.previo === null, 'un «previo» roto se descarta');
  ok(roto.socios.pescaderia.extras.length <= N.APORTE_EXTRA.maxExtras && roto.socios.pescaderia.extras.reduce((a, q) => a + q.monto, 0) <= roto.socios.pescaderia.aporte, 'y no hay más de 8 ni suman más que el aporte');
  ok(roto.socios.pescaderia.previo.pct <= 45, 'el porcentaje de antes, acotado');
  eq(roto.total.vendido, 0, 'totales rotos en cero');
  sinRotos(roto, 'roto');
  const negativos = [];
  const mirar = (v, ruta) => { if (typeof v === 'number') { if (v < 0) negativos.push(ruta); } else if (v && typeof v === 'object') for (const k of Object.keys(v)) mirar(v[k], `${ruta}.${k}`); };
  mirar(roto.comprados, 'comprados'); mirar(roto.socios, 'socios'); mirar(roto.vendidos, 'vendidos'); mirar(roto.total, 'total');
  eq(negativos, [], 'ningún número negativo');
  // ida y vuelta por la partida
  const almacen = new Map();
  globalThis.localStorage = { getItem: (kk) => (almacen.has(kk) ? almacen.get(kk) : null), setItem: (kk, v) => almacen.set(kk, String(v)), removeItem: (kk) => almacen.delete(kk), key: () => null, length: 0 };
  const G = await import('../src/guardado.js');
  G.usarModoGuardado('relax', 1);
  const nuevo = G.progresoNuevo();
  const q = relax(900000, 1);
  N.comprar(q, 'panaderia', ctxDe(100, 2, { dia: 1 })); N.comprar(q, 'pescaderia', ctxDe(100, 2, { dia: 1 }));
  N.entrarSocio(q, 'herreria', 15000, ctxDe(150, 3, { dia: 1 }));
  avanzar(q, 30); N.sumarAporte(q, 'herreria', 15000, ctxDe(150, 3, { dia: 30 }));
  N.vender(q, 'pescaderia', ctxDe(100, 2, { dia: 30 }));
  const con = JSON.parse(JSON.stringify(nuevo)); con.negociosVecinos = JSON.parse(JSON.stringify(q.negociosVecinos)); con.dia = 30;
  G.escribirPartida('relax', 1, con);
  const leida = G.leerPartida('relax', 1), pl = leida?.progreso || leida;
  eq(pl.negociosVecinos.vendidos, q.negociosVecinos.vendidos, 'lo vendido sobrevive al guardado de la partida');
  eq(pl.negociosVecinos.socios.herreria.extras, q.negociosVecinos.socios.herreria.extras, 'y los aportes adicionales');
  eq(pl.negociosVecinos.socios.herreria.previo, q.negociosVecinos.socios.herreria.previo, 'y el porcentaje de antes');
  ok(pl.negociosVecinos.comprados.panaderia && !pl.negociosVecinos.comprados.pescaderia, 'la panadería sigue y la pescadería ya no');
  eq(pl.negociosVecinos.total.vendido, q.negociosVecinos.total.vendido, 'el total vendido');
  const v2 = JSON.parse(JSON.stringify(con)); delete v2.negociosVecinos.vendidos; for (const x of Object.values(v2.negociosVecinos.socios)) { delete x.extras; delete x.previo; }
  G.escribirPartida('relax', 1, v2);
  const l2 = G.leerPartida('relax', 1), p2 = l2?.progreso || l2;
  ok(p2.negociosVecinos.vendidos && Array.isArray(p2.negociosVecinos.socios.herreria.extras), 'una partida sin los campos nuevos carga con los valores por defecto');
  G.usarModoGuardado('desafio', 1);
  ok(G.progresoNuevo().negociosVecinos === undefined, 'el Desafío no trae negocios');
  const d = { modo: 'desafio', dia: 5, economia: { ...economiaNueva(), pesos: 5000 } };
  for (const f of [() => N.evaluarVenta(d, 'panaderia', ctxDe(100)), () => N.vender(d, 'panaderia', ctxDe(100)), () => N.evaluarAporteExtra(d, 'almacen', 17000, ctxDe(100)), () => N.sumarAporte(d, 'almacen', 17000, ctxDe(100))]) ok(f().ok === false, 'en el Desafío: nada');
  eq(d.economia.pesos, 5000, 'y la plata intacta');
}

// ---------------------------------------------------------------- 6. lo que dice cada vecino
{
  const TIPOS = ['ofendido', 'regatea', 'acepta', 'emocionado'];
  eq(Object.keys(VOCES_VENTA).sort(), Object.keys(VOCES_NEGOCIO).sort(), 'una voz de venta por cada vecino con negocio');
  eq(Object.keys(VOCES_APORTE).sort(), Object.keys(VOCES_NEGOCIO).sort(), 'y una de aporte');
  for (const id of N.IDS_NEGOCIOS) {
    const NN = N.NEGOCIOS[id], v = VOCES_VENTA[NN.vecino], a = VOCES_APORTE[NN.vecino];
    ok(v && a, `${id}: tiene las dos voces`);
    for (const t of TIPOS) ok(typeof v[t] === 'string' && v[t].includes('{precio}') && v[t].length > 20, `${id}: venta «${t}» con el precio`);
    ok(Array.isArray(v.cierra) && v.cierra.length >= 1 && v.cierra.every((x) => typeof x === 'string' && x.length > 20), `${id}: cómo cierra`);
    if (NN.puedeIrse) ok(Array.isArray(v.vuelve) && v.vuelve.length >= 1, `${id}: puede irse, así que tiene cómo vuelve`);
    else ok(v.vuelve === undefined, `${id}: no se va, no tiene «vuelve»`);
    ok(a.acepta.includes('{aporte}') && a.acepta.includes('{pct}') && a.tope.length > 10 && a.rechaza.length > 10, `${id}: aporte (acepta, tope, rechaza)`);
    for (const t of [...TIPOS.map((x) => v[x]), a.acepta, a.tope, a.rechaza, ...v.cierra, ...(v.vuelve || [])]) ok(!/undefined|NaN|\[object/.test(t), `${id}: sin texto roto`);
  }
}

// ---------------------------------------------------------------- 7. el juego (con un contexto de mentira)
{
  const { crearNegociosVecinosJuego } = await import('../src/negocios-vecinos-juego.js');
  const p = relax(1500000, 10, 12);
  const notas = [], guardados = [], liberados = [];
  let desafio = false;
  const ctx = {
    progreso: () => p, desafio: () => desafio, escena: () => null, altura: () => 20, jugador: () => null,
    nota: (t, sub) => notas.push([t, sub || '']), guardar: () => guardados.push(1), refrescarBarra: () => {},
    sonido: () => ({ anotar: () => {} }), liberarEmpleado: (k) => { liberados.push(k); return k === 'panadera'; },
  };
  const J = crearNegociosVecinosJuego(ctx);
  const s = (clave) => ({ clave, vueltas: 0, sub: null });
  const elegir = (clave, id) => J.elegir(s(clave), id);
  const sub = (r) => (r.tipo === 'menu' && r.sub ? r.sub : null);
  const todo = (r) => (r.tipo === 'renglones' ? r.renglones.join(' ') : r.sub ? `${r.sub.texto} ${r.sub.opciones.map((o) => o.titulo).join(' ')}` : '');

  // Rosa: la comprás con 60 puntos (se va a la plaza), pasan los días y se la vendés de vuelta
  amistad(p, 'panadera', 60, 0);
  let r = elegir('panadera', 'negocios:comprar'); r = elegir('panadera', 'negocios:cerrar');
  ok(r.comprado === 'panaderia', 'compró la panadería');
  ok(J._idos().includes('panadera'), 'Rosa se fue a la plaza');
  r = elegir('panadera', 'negocios');
  eq(sub(r).opciones.map((o) => o.id), ['negocios:cuentas', 'negocios:vender', 'volver'], 'el submenú del negocio propio ofrece «Venderle … de vuelta»');
  eq(sub(r).opciones[1].titulo, 'Venderle la panadería de vuelta', 'con su título');
  eq(J.opciones('panadera'), [{ id: 'negocios', titulo: 'Hablar de su negocio' }], 'el título de arriba sigue siendo «Hablar de su negocio»');
  // enseguida: se ofende
  r = elegir('panadera', 'negocios:vender');
  ok(sub(r) && sub(r).opciones[0].id === 'negocios:vendido' && /^Venderlo: cobrás \$/.test(sub(r).opciones[0].titulo) && sub(r).opciones[1].id === 'volver', 'proponer: el menú con el monto y «Pensarlo»');
  ok(/lo vendés enseguida/.test(sub(r).texto) && /Pagaste \$/.test(sub(r).texto) && /nunca menos del 50 % ni más del 85 %/.test(sub(r).texto) && /recomprar/.test(sub(r).texto), 'el cálculo a la vista: lo que pagaste, el porcentaje, de dónde sale, los topes y la recompra');
  ok(/^¿A la semana/.test(sub(r).texto), 'y primero la voz de Rosa, ofendida');
  ok(!/undefined|NaN/.test(todo(r)), 'sin textos rotos');
  const antesAmistad = V.puntosAmistad('panadera', p);
  const pesosAntes = pesosDe(p);
  r = elegir('panadera', 'negocios:vendido');
  ok(r.tipo === 'renglones' && r.vendido === 'panaderia' && /plaza/.test(r.renglones[0]), 'se cierra: Rosa vuelve de la plaza');
  ok(pesosDe(p) > pesosAntes, 'cobraste');
  ok(!N.esTuyo(p, 'panaderia') && !J._idos().includes('panadera'), 'ya no es tuya y Rosa no está más en la plaza (vuelve a su rutina)');
  eq(V.puntosAmistad('panadera', p), antesAmistad - 2, 'el ofendido te tiene dos puntos menos');
  eq(liberados, ['panadera'], 'se avisó para soltar al empleado (si lo hubiera)');
  ok(notas.some((x) => /^Le vendiste la panadería a Rosa$/.test(x[0]) && /Cobraste \$/.test(x[1]) && /el cartel ya no dice tu nombre/.test(x[1]) && /dejó de trabajar en tu local/.test(x[1])), 'el aviso del HUD');
  ok(guardados.length > 0, 'se guardó');
  r = elegir('panadera', 'negocios');
  eq(sub(r).opciones.map((o) => o.id), ['negocios:cuentas', 'negocios:socio', 'negocios:comprar', 'volver'], 'y el menú de Rosa vuelve a ser el de antes de comprar');
  r = elegir('panadera', 'negocios:vender');
  ok(r.tipo === 'renglones' && /ya no es tuya/.test(r.renglones[0]), 'vender lo que ya vendiste: «ya no es tuya»');
  // recomprar pronto: recargo, con aviso en la charla
  amistad(p, 'panadera', 60, 0); p.dia = 12;
  r = elegir('panadera', 'negocios:comprar');
  ok(sub(r) && /recomprarlo cuesta un 10 % más \(hasta el día 40\)/.test(sub(r).texto), 'recomprar a los 2 días: «cuesta un 10 % más (hasta el día 40)»');
  // los 8 negocios, todos los tipos de reacción, sin textos rotos
  for (const id of N.IDS_NEGOCIOS) {
    const NN = N.NEGOCIOS[id];
    for (const [puntos, dias, destino] of [[100, 3, 'queda'], [30, 20, 'queda'], [100, 20, 'queda'], [150, 40, 'queda'], [60, 40, 'se-va']]) {
      const q = relax(2e6, 1); amistad(q, NN.vecino, puntos, 3);
      q.negociosVecinos.comprados[id] = { desde: 1, pagado: NN.precio, destino: NN.puedeIrse ? destino : 'queda', orden: 1, visita: 1, bono: 1, caja: 1500, total: 5000, perdido: 0, mala: 0, ultimo: null };
      q.dia = 1 + dias;
      const JJ = crearNegociosVecinosJuego({ ...ctx, progreso: () => q });
      const rr = JJ.elegir(s(NN.vecino), 'negocios:vender');
      ok(sub(rr) && !/undefined|NaN|\{|\}/.test(todo(rr)), `${id}/${puntos}/${dias}: propuesta sin textos rotos`);
      const cc = JJ.elegir(s(NN.vecino), 'negocios:vendido');
      ok(cc.vendido === id && !/undefined|NaN|\{|\}/.test(todo(cc)), `${id}/${puntos}/${dias}: cierre sin textos rotos`);
      ok(!N.esTuyo(q, id), `${id}/${puntos}/${dias}: vendido`);
    }
  }
  // sociedad: «Hablar de la sociedad» y «Sumar plata a la sociedad»
  amistad(p, 'ercilia', 150, 3);
  r = elegir('ercilia', 'negocios:socio'); r = elegir('ercilia', `negocios:socio:${N.rangoDeAporte('almacen').min}`);
  ok(r.socio === 'almacen', 'sos socio del almacén');
  eq(J.opciones('ercilia'), [{ id: 'negocios', titulo: 'Hablar de la sociedad' }], 'ahora el título es «Hablar de la sociedad»');
  r = elegir('ercilia', 'negocios');
  ok(sub(r).opciones.some((o) => o.id === 'negocios:aporte' && o.titulo === 'Sumar plata a la sociedad'), 'el submenú de la sociedad trae «Sumar plata a la sociedad»');
  const ids = sub(r).opciones.map((o) => o.id);
  eq(ids, ['negocios:cuentas', 'negocios:aporte', 'negocios:retiro', 'negocios:comprar', 'volver'], 'el submenú de la sociedad: cómo viene, sumar plata, retirarme, comprar, mejor no');
  ok(ids.indexOf('negocios:aporte') < ids.indexOf('negocios:retiro'), 'antes de «Avisar que me retiro»');
  r = elegir('ercilia', 'negocios:aporte');
  ok(sub(r) && sub(r).opciones.length === 4 && sub(r).opciones[3].id === 'volver', 'proponer: tres montos y «Pensarlo»');
  eq(sub(r).opciones.map((o) => o.titulo).slice(0, 3), ['Sumar $17.000 · del 10 % al 20 %', 'Sumar $34.000 · del 10 % al 30 %', 'Sumar $51.000 · del 10 % al 40 %'], 'cada monto dice cómo queda tu porcentaje');
  ok(/Tenés puestos \$17\.000 de los \$68\.000/.test(sub(r).texto) && /podés sumar hasta \$51\.000/.test(sub(r).texto) && /cada aporte cuenta sus propios días/.test(sub(r).texto) && /60 %/.test(sub(r).texto), 'el texto muestra lo puesto, lo que falta, y cómo se devuelve');
  ok(!/undefined|NaN/.test(todo(r)), 'sin textos rotos');
  const antesS = pesosDe(p); notas.length = 0;
  r = elegir('ercilia', 'negocios:aporte:34000');
  ok(r.socio === 'almacen' && /Más plata al cajón/.test(r.renglones[0]) && /\$34\.000/.test(r.renglones[0]) && /30 %/.test(r.renglones[0]), 'Ercilia acepta con su voz');
  ok(/pasó del 10 % al 30 %/.test(r.renglones[1]) && /Todavía podés sumar hasta \$17\.000/.test(r.renglones[2]), 'y dice cómo quedó tu parte y lo que falta');
  eq(pesosDe(p), antesS - 34000, 'se pagó');
  ok(notas.some((x) => /^Sumaste plata a tu sociedad en el almacén$/.test(x[0]) && /ahora te toca el 30 %/.test(x[1])), 'aviso del HUD');
  eq(p.negociosVecinos.socios.almacen.pct, 30, 'tu porcentaje, al 30 %');
  r = elegir('ercilia', 'negocios:aporte:17000');
  ok(r.socio === 'almacen' && /Con esto llegaste al máximo/.test(r.renglones[2]), 'el último pedazo: «llegaste al máximo»');
  r = elegir('ercilia', 'negocios:aporte');
  ok(r.tipo === 'renglones' && /ya pusiste todo lo que se puede/.test(r.renglones[0]) && /que es lo máximo: el 40 % del precio/.test(r.renglones[1]), 'en el tope: Ercilia se niega y lo dice');
  // la amistad bajó
  const bajo = relax(500000, 5); amistad(bajo, 'ercilia', 150, 3); N.entrarSocio(bajo, 'almacen', 17000, ctxDe(150, 3, { dia: 5 })); amistad(bajo, 'ercilia', 70, 3);
  const Jb = crearNegociosVecinosJuego({ ...ctx, progreso: () => bajo });
  r = Jb.elegir(s('ercilia'), 'negocios:aporte');
  ok(r.tipo === 'renglones' && /vení a tomar unos mates/.test(r.renglones[0]) && /llegue a 95 puntos \(hoy: 70\)/.test(r.renglones[1]), 'la amistad bajó: se niega y dice cuántos puntos hacen falta');
  eq(pesosDe(bajo), 500000 - 17000, 'y no se pagó nada');
  // sin plata
  const sinP = relax(20000, 5); amistad(sinP, 'ercilia', 150, 3); N.entrarSocio(sinP, 'almacen', 17000, ctxDe(150, 3, { dia: 5 }));
  const Js = crearNegociosVecinosJuego({ ...ctx, progreso: () => sinP });
  r = Js.elegir(s('ercilia'), 'negocios:aporte:34000');
  ok(r.tipo === 'renglones' && /te faltan \$31\.000/.test(r.renglones.at(-1)), 'sin plata: te dice cuánto te falta');
  // con el retiro avisado
  const av = relax(500000, 5); amistad(av, 'ercilia', 150, 3); N.entrarSocio(av, 'almacen', 17000, ctxDe(150, 3, { dia: 5 })); N.avisarRetiro(av, 'almacen', 5);
  const Ja = crearNegociosVecinosJuego({ ...ctx, progreso: () => av });
  r = Ja.elegir(s('ercilia'), 'negocios:aporte');
  ok(r.tipo === 'renglones' && /Seguir de socio/.test(r.renglones[0]), 'con el retiro avisado: primero «Seguir de socio»');
  // cuaderno y gerente
  const pag = J.paginaCuaderno();
  const hojas = [];
  const el = (tag, clase, texto) => { const o = { tag, clase, texto: texto || '', hijos: [], appendChild(x) { o.hijos.push(x); return x; } }; hojas.push(o); return o; };
  pag.dibujar(el('div', '', ''), el);
  const txt = hojas.map((o) => o.texto).join(' | ');
  ok(/Socio de el almacén de Ercilia|Socio de/.test(txt) && /sumaste 3 veces|sumaste 2 veces/.test(txt) && !/undefined|NaN/.test(txt), `el cuaderno cuenta los aportes sin textos rotos`);
  ok(/Para comprar o asociarse/.test(txt) && /lo vendiste hace poco|Para comprar/.test(txt), 'y la lista de lo que se puede comprar');
  // tuyo en el cuaderno
  const pt = relax(500000, 20); amistad(pt, 'herrero', 100, 2); N.comprar(pt, 'herreria', ctxDe(100, 2, { dia: 1 })); pt.dia = 30;
  const Jt = crearNegociosVecinosJuego({ ...ctx, progreso: () => pt });
  const h2 = []; const el2 = (tag, clase, texto) => { const o = { tag, clase, texto: texto || '', hijos: [], appendChild(x) { o.hijos.push(x); return x; } }; h2.push(o); return o; };
  Jt.paginaCuaderno().dibujar(el2('div', '', ''), el2);
  const t2 = h2.map((o) => o.texto).join(' | ');
  ok(/Para venderlo de vuelta, hablá con Anselmo: hoy te darían \$\d/.test(t2) && /y \$\d[\d.]* de la caja/.test(t2) && !/undefined|NaN/.test(t2), 'el cuaderno dice cuánto te darían por cada negocio');
  r = Jt.elegir(s('gerente'), 'negocios:resumen');
  ok(/hable con su dueño de siempre|hablá con su dueño de siempre/.test(r.renglones.join(' ')), 'y el gerente manda a hablar con el dueño de siempre para vender');
  // Desafío
  desafio = true;
  eq(J.elegir(s('panadera'), 'negocios:vender'), { tipo: 'menu' }, 'en el Desafío: nada');
  eq(J.elegir(s('ercilia'), 'negocios:aporte'), { tipo: 'menu' }, 'ni sumar plata');
  desafio = false;
}

// ---------------------------------------------------------------- 8. lo enganchado
{
  const main = leer('src/main.js');
  ok(/liberarEmpleado: \(k\) =>/.test(main) && main.includes('empleadosNegocioJuego?.liberar(k)') && main.includes("fallaSistema('negocios-vecinos-liberar'"), 'main.js: suelta al empleado con aislamiento');
  const en = leer('src/empleados-negocio-juego.js');
  ok(en.includes('liberar: (k) =>') && en.includes('e.cambiarAmistad = null'), 'empleados-negocio-juego.js: liberar sin castigo de amistad');
  const gu = leer('src/guia.js');
  ok(gu.includes("'Vender el negocio y sumar plata'") && gu.includes('Sumar plata a la sociedad') && gu.includes('50 al 85 %'), 'la guía (F1) lo explica');
  const jg = leer('src/negocios-vecinos-juego.js');
  ok(jg.includes('Sumar plata a la sociedad') && jg.includes('Hablar de la sociedad') && jg.includes('de vuelta'), 'el juego ofrece las dos cosas');
  ok(!/\|\|\s*'escuela'/.test(jg), 'nada raro');
  const sim = leer('herramientas/simulador-compra.mjs');
  ok(sim.includes('6. VENDER DE VUELTA') && sim.includes('7. APORTE ADICIONAL'), 'el simulador cubre la venta y el aporte');
  const cam = leer('CAMBIOS_4_4_3_VENTA.md');
  ok(/Decisiones/.test(cam) && /Equilibrio/.test(cam) && /no quedó/i.test(cam), 'el informe de cambios existe');
  // sin inglés ni mando en lo nuevo
  for (const f of ['src/negocios-vecinos.js', 'src/negocios-vecinos-voces.js', 'src/negocios-vecinos-juego.js']) {
    const t = leer(f);
    ok(!/\b(the|and|with|your|please|of the)\b/.test(t.replace(/\/\/.*$/gm, '').replace(/'[^']*'/g, '').replace(/`[^`]*`/g, '')), `${f}: sin inglés fuera de los nombres`);
    ok(!/gamepad|navigator\.getGamepads|mando/i.test(t.replace(/\/\/.*$/gm, '')), `${f}: sin mando`);
    ok(!/Shift|Mayús/.test(t.replace(/\/\/.*$/gm, '')), `${f}: sin teclas con Mayús`);
  }
}

console.log(`verificar-4-4-3-venta: OK (${n} comprobaciones)`);
