// 4.4 (y 4.4.3: vender de vuelta y aporte adicional, secciones 6 y 7): simulador de los negocios comprados y las sociedades (src/negocios-vecinos.js). Corre las reglas de verdad, día por día.
// Uso: node herramientas/simulador-compra.mjs [dias=240] [jornal=3200]
//   · la tabla de los ocho negocios: precio de lista, ganancia por día, días para pagarse y tope de la caja;
//   · cuánto cuesta cada uno según la amistad (de mala a compadre) y cuánto tarda en pagarse a ese precio;
//   · un jugador que ahorra sus jornales ($3.200 por día) y compra de a uno, de lo más barato a lo más caro, reinvirtiendo lo que rinden: cuándo compra
//     cada uno, y cuánto gana por día con cada cantidad de negocios, según cada cuánto pase a verlos (cada 2, 5 o 10 días, o nunca);
//   · la sociedad: lo que da cada aporte mínimo, medio y máximo, y cuánto tarda en volver (con la devolución según los días).
import { NEGOCIOS, IDS_NEGOCIOS, FACTORES_CARTERA, COMPRA, SOCIEDAD, gananciaBase, gananciaEstimada, diasParaPagarse, topeDeCaja, reaccionCompra, rangoDeAporte, montosDeAporte, porcentajeDe, devolucionPorDias, negociosVecinosNuevo, comprar, pasarDia, retirarCaja, entrarSocio, cajasTotal, tusNegocios, vender, VENTA, sumarAporte, restoDeAporte, devolucionDe } from '../src/negocios-vecinos.js';
import { economiaNueva } from '../src/economia.js';
import { esPobladorAldea, LOTE_DE } from '../src/aldea.js';

// una partida del Relax con los pobladores instalados y sus locales abiertos
function partida(pesos = 0) {
  const p = { modo: 'relax', dia: 1, horas: 12, economia: { ...economiaNueva(), pesos }, negociosVecinos: negociosVecinosNuevo(), aldea: { pobladores: [], locales: {} } };
  for (const id of IDS_NEGOCIOS) { const c = NEGOCIOS[id].vecino; if (esPobladorAldea(c)) { p.aldea.pobladores.push({ clave: c }); p.aldea.locales[LOTE_DE[c]] = 1; } }
  return p;
}

const DIAS = Math.max(30, Number(process.argv[2]) || 240), JORNAL = Math.max(500, Number(process.argv[3]) || 3200);
const $ = (n) => `$${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const pad = (s, n) => String(s).padEnd(n), padL = (s, n) => String(s).padStart(n);

console.log('HOJARASCA 4.4 · NEGOCIOS COMPRADOS Y SOCIEDADES · simulador');
console.log('='.repeat(100));
console.log(`jornal de referencia ${$(JORNAL)} por día · tope de caja ${COMPRA.topeDias} días · gestión: ${COMPRA.gestion.gracia} días de gracia, −${COMPRA.gestion.porDia * 100} % por día, piso ${COMPRA.gestion.piso * 100} %`);
console.log(`cartera (lo que rinde cada negocio según cuántos tenés): ${FACTORES_CARTERA.map((f) => `${Math.round(f * 100)} %`).join(', ')}`);

console.log('\n1. LOS OCHO NEGOCIOS (día corriente, vecino atendiendo, pasando a verlos)');
console.log(`${pad('negocio', 26)}${padL('lista', 10)}${padL('ventas', 9)}${padL('insumos', 9)}${padL('sueldo', 8)}${padL('gastos', 8)}${padL('gana/día', 10)}${padL('se paga', 9)}${padL('tope caja', 11)}`);
for (const id of IDS_NEGOCIOS) {
  const N = NEGOCIOS[id];
  console.log(`${pad(N.nombre, 26)}${padL($(N.precio), 10)}${padL($(N.ventas), 9)}${padL($(N.ventas * N.insumos), 9)}${padL($(N.sueldo), 8)}${padL($(N.gastos), 8)}${padL($(gananciaBase(id)), 10)}${padL(`${diasParaPagarse(id)} d`, 9)}${padL($(topeDeCaja(id)), 11)}`);
}
const total = IDS_NEGOCIOS.reduce((s, id) => s + NEGOCIOS[id].precio, 0), todos = IDS_NEGOCIOS.reduce((s, id) => s + gananciaBase(id), 0);
console.log(`los ocho juntos: ${$(total)} de lista, ${$(todos)} por día sin descuentos (con la cartera: ${$(IDS_NEGOCIOS.map((id) => gananciaBase(id)).sort((a, b) => b - a).reduce((s, g, i) => s + g * FACTORES_CARTERA[i], 0))})`);

console.log('\n2. CUÁNTO CUESTA SEGÚN LA AMISTAD (puntos; historia: 0 o entera) y en cuántos días se paga ese precio');
const columnas = [[10, 0, 'poca'], [30, 0, 'conocido'], [60, 2, 'amigo'], [100, 2, 'buen amigo'], [150, 2, 'compadre'], [200, 3, 'compadre+hist']];
console.log(`${pad('negocio', 14)}${columnas.map(([, , n]) => padL(n, 17)).join('')}`);
for (const id of IDS_NEGOCIOS) {
  const celdas = columnas.map(([puntos, hist]) => {
    const r = reaccionCompra(id, { puntos, hist, histTotal: 3, etapa: '' });
    if (!r.precio) return { texto: r.tipo, dias: '' };
    return { texto: `${$(r.precio)}${r.destino === 'se-va' ? '*' : ''}`, dias: Math.ceil(r.precio / gananciaBase(id)) };
  });
  console.log(`${pad(id, 14)}${celdas.map((c) => padL(c.dias ? `${c.texto} ${c.dias}d` : c.texto, 17)).join('')}`);
}
console.log('(* si el vecino se va a otra cosa; «Nd»: días para pagarse a ese precio con la ganancia base; con * rinde algo menos)');

// 3. un jugador
function jugar({ visita, orden, dias = DIAS, puntos = 100, hist = 2 }) {
  const p = partida(0);
  const compras = [], porDia = [];
  let ultimaVisita = {};
  for (let d = 1; d <= dias; d++) {
    p.dia = d;
    p.economia.pesos += JORNAL;
    pasarDia(p, d);
    // pasa a verlos cada `visita` días (o nunca)
    if (visita > 0 && d % visita === 0) for (const id of tusNegocios(p)) retirarCaja(p, id, d);
    for (const id of orden) {
      if (p.negociosVecinos.comprados[id]) continue;
      const r = comprar(p, id, { puntos, hist, histTotal: 3, etapa: '', dia: d, compadre: puntos >= 140 });
      if (r.ok) compras.push({ id, dia: d, precio: r.precio });
      break;   // de a uno
    }
    porDia.push(tusNegocios(p).reduce((s, id) => s + (p.negociosVecinos.comprados[id].ultimo?.neto || 0), 0));
  }
  return { compras, porDia, p };
}
const ordenBarato = IDS_NEGOCIOS.slice().sort((a, b) => NEGOCIOS[a].precio - NEGOCIOS[b].precio);
console.log(`\n3. UN JUGADOR QUE AHORRA ${$(JORNAL)} POR DÍA Y COMPRA DE LO MÁS BARATO A LO MÁS CARO (amigo, 100 puntos y dos partes de su historia; ${DIAS} días)`);
for (const visita of [2, 5, 10, 0]) {
  const r = jugar({ visita, orden: ordenBarato });
  const cuando = r.compras.map((c) => `${NEGOCIOS[c.id].corto.replace(/^(el|la) /, '')} d${c.dia}`).join(' · ');
  const ult = r.porDia.slice(-14), media = ult.reduce((s, x) => s + x, 0) / ult.length;
  console.log(`  pasa a verlos ${visita ? `cada ${visita} días` : 'NUNCA (sólo cuando compra)'}: ${r.compras.length} negocios · ${cuando}`);
  console.log(`      al final rinden ${$(media)} por día (últimos 14 días) · ${$(r.p.economia.pesos)} en la billetera · ${$(cajasTotal(r.p))} en las cajas`);
}
console.log('\n   primer negocio (cuándo se compra, lo que cuesta, cuánto tarda en pagarse a su ganancia con visita cada 5 días):');
{
  const r = jugar({ visita: 5, orden: ordenBarato });
  for (const c of r.compras.slice(0, 4)) {
    const g = gananciaEstimada(c.id, { cartera: FACTORES_CARTERA[r.compras.indexOf(c)] });
    console.log(`      ${pad(NEGOCIOS[c.id].nombre, 26)} día ${padL(c.dia, 3)}  ${padL($(c.precio), 9)}  rinde ${padL($(g), 6)} por día → se paga en ${Math.ceil(c.precio / g)} días`);
  }
}
console.log('\n   ritmo de la economía: la primera compra llega al día', jugar({ visita: 5, orden: ordenBarato }).compras[0]?.dia, `(${$(NEGOCIOS.panaderia.precio)} a ${$(JORNAL)} por día = ${Math.ceil(NEGOCIOS.panaderia.precio / JORNAL)} días de ahorro)`);

console.log('\n4. LA SOCIEDAD (ponés plata, cobrás un porcentaje por día; sin gestión ni cartera)');
console.log(`${pad('negocio', 14)}${pad('aporte', 10)}${padL('% amigo', 9)}${padL('por día', 9)}${padL('vuelve en', 11)}${padL('% compadre', 12)}${padL('por día', 9)}${padL('vuelve en', 11)}`);
for (const id of IDS_NEGOCIOS) {
  for (const m of montosDeAporte(id)) {
    const pa = porcentajeDe(id, m, SOCIEDAD.factorAmigo), pc = porcentajeDe(id, m, 1);
    const da = (gananciaBase(id) * pa) / 100, dc = (gananciaBase(id) * pc) / 100;
    console.log(`${pad(id, 14)}${pad($(m), 10)}${padL(`${pa} %`, 9)}${padL($(da), 9)}${padL(`${Math.ceil(m / da)} d`, 11)}${padL(`${pc} %`, 12)}${padL($(dc), 9)}${padL(`${Math.ceil(m / dc)} d`, 11)}`);
  }
}
console.log('\n   retirarse con aviso (devuelve del aporte): ' + [0, 6, 18, 36].map((d) => `${d}+ días de socio → ${Math.round(devolucionPorDias(d) * 100)} %`).join(' · '));
{
  const p = partida(100000);
  const e = entrarSocio(p, 'almacen', 43000, { puntos: 150, hist: 3, dia: 1 });
  for (let d = 2; d <= 60; d++) { p.dia = d; pasarDia(p, d); retirarCaja(p, 'almacen', d); }
  console.log(`   ejemplo: ${$(43000)} en el almacén (compadre, ${e.pct} %): en 59 días cobrás ${$(p.negociosVecinos.socios.almacen.total)} de tu parte (${$(e.porDia)} por día, ${(p.negociosVecinos.socios.almacen.total / 43000 * 100).toFixed(0)} % del aporte) y el aporte vuelve entero.`);
}

// 6. 4.4.3 · VENDER DE VUELTA: comprar, tenerlo X días (pasando a verlo cada 5, o nunca) y vender. Todo con las reglas de verdad.
console.log('\n6. VENDER DE VUELTA (4.4.3): comprás con 100 puntos de amistad y dos partes de su historia, tenés el negocio X días y vendés');
console.log(`El precio de venta es un porcentaje de lo que pagaste: ${Math.round(VENTA.base * 100)} % de base + ${VENTA.porDia * 100} puntos por día (hasta ${VENTA.diasMax} días) + hasta ${VENTA.amistadMax * 100} por la amistad (${VENTA.amistadDesde} a ${VENTA.amistadHasta} puntos) − descuido (hasta ${VENTA.descuido.max * 100}); siempre entre ${VENTA.piso * 100} y ${VENTA.techo * 100} %.`);
function ida(id, dias, { visita = 5, puntos = 100 } = {}) {
  const p = partida(1e6), ctx = { puntos, hist: 2, histTotal: 3, etapa: '', dia: 1, compadre: puntos >= 140 };
  const c = comprar(p, id, ctx); if (!c.ok) return null;
  const antesDeComprar = 1e6;
  for (let d = 2; d <= 1 + dias; d++) { p.dia = d; pasarDia(p, d); if (visita > 0 && d % visita === 0) retirarCaja(p, id, d); }
  p.dia = 1 + dias;
  const v = vender(p, id, { ...ctx, dia: 1 + dias });
  return { c, v, neto: p.economia.pesos - antesDeComprar };   // (lo que tenés al final menos lo que tenías antes de comprar)
}
console.log(`${pad('negocio', 12)}${pad('pagaste', 10)}${[0, 7, 30, 60, 90].map((d) => padL(`vendés d${d}`, 15)).join('')}`);
for (const id of ordenBarato) {
  const celdas = [0, 7, 30, 60, 90].map((d) => { const r = ida(id, d); return padL(`${$(r.v.precio)} ${Math.round(r.v.fraccion * 100)}%`, 15); });
  console.log(`${pad(id, 12)}${pad($(ida(id, 0).c.precio), 10)}${celdas.join('')}`);
}
console.log('\n   resultado neto en pesos de comprar, tener y vender (todo lo cobrado, caja y venta, menos lo pagado), pasando a verlo cada 5 días | nunca:');
console.log(`   ${pad('negocio', 12)}${[0, 7, 30, 60, 90].map((d) => padL(`d${d}`, 24)).join('')}`);
for (const id of ordenBarato) {
  const cel = (d) => padL(`${$(ida(id, d, { visita: 5 }).neto)} | ${$(ida(id, d, { visita: 0 }).neto)}`, 24);
  console.log(`   ${pad(id, 12)}${[0, 7, 30, 60, 90].map(cel).join('')}`);
}
{
  // comprar y vender de inmediato, en todos los casos de amistad: siempre pierde
  let peor = Infinity, mejor = -Infinity, inmediato = -Infinity;
  for (const id of IDS_NEGOCIOS) for (const puntos of [30, 60, 100, 150, 200]) for (const dias of [0, 3, 7, 20, 60, 120]) {
    const r = ida(id, dias, { puntos, visita: 2 }); if (!r) continue;
    const ret = r.v.precio / r.c.precio; peor = Math.min(peor, ret); mejor = Math.max(mejor, ret);
    if (dias === 0) inmediato = Math.max(inmediato, ret);
  }
  console.log(`\n   el precio de venta, sobre lo que pagaste, va de ${(peor * 100).toFixed(1)} % a ${(mejor * 100).toFixed(1)} % en cualquier combinación de negocio, amistad (30 a 200 puntos) y días (0 a 120): nunca llega al 100 %.`);
  console.log(`   comprar y vender el mismo día devuelve como máximo el ${(inmediato * 100).toFixed(1)} % de lo pagado: se pierde al menos el ${((1 - inmediato) * 100).toFixed(1)} %. No hay manija de plata.`);
}
console.log('   recompra: lo que vendiste hace menos de 30 días cuesta un 10 % más; después, el precio de la reacción de siempre.');

// 7. 4.4.3 · APORTE ADICIONAL a una sociedad ya hecha
console.log('\n7. APORTE ADICIONAL A UNA SOCIEDAD (4.4.3): entrás con el mínimo (10 % del precio) y sumás hasta el 40 % (compadre, 150 puntos)');
console.log(`${pad('negocio', 12)}${padL('entrás', 9)}${padL('% inicial', 11)}${padL('sumás', 9)}${padL('% final', 9)}${padL('por día', 9)}${padL('vuelve en', 11)}`);
for (const id of IDS_NEGOCIOS) {
  const p = partida(1e6), ctx = { puntos: 150, hist: 3, histTotal: 3, etapa: '', dia: 1 };
  const { min } = rangoDeAporte(id);
  const e = entrarSocio(p, id, min, ctx);
  const s = p.negociosVecinos.socios[id];
  const monto = restoDeAporte(id, s);
  const r = sumarAporte(p, id, monto, ctx);
  console.log(`${pad(id, 12)}${padL($(min), 9)}${padL(`${e.pct} %`, 11)}${padL($(monto), 9)}${padL(`${r.pct} %`, 9)}${padL($(r.porDia), 9)}${padL(`${Math.ceil(r.aporteTotal / r.porDia)} d`, 11)}`);
}
{
  const p = partida(1e6), ctx = { puntos: 150, hist: 3, histTotal: 3, etapa: '', dia: 1 };
  entrarSocio(p, 'almacen', 17000, ctx);
  for (let d = 2; d <= 41; d++) { p.dia = d; pasarDia(p, d); }
  p.dia = 41; sumarAporte(p, 'almacen', 34000, { ...ctx, dia: 41 });
  const s = p.negociosVecinos.socios.almacen;
  console.log(`\n   retiro con aportes en tramos (almacén: ${$(17000)} el día 1 y ${$(34000)} el día 41): si avisás el día 41 (sale el 43) te devuelven ${$(devolucionDe(s, 43))} de ${$(s.aporte)} puestos (el primero al ${Math.round(devolucionPorDias(42) * 100)} %, el segundo al ${Math.round(devolucionPorDias(2) * 100)} %); el día 60: ${$(devolucionDe(s, 60))}; el día 100: ${$(devolucionDe(s, 100))} (todo).`);
}
console.log('\n5. LECTURA');
console.log('  · Un negocio comprado rinde 1,2 % a 1,6 % de su precio por día: se paga solo en 64 a 84 días de juego a precio de lista; a un compadre con su historia entera (−14 %), en 56 a 70 días; a un amigo (+20 %), en 77 a 100.');
console.log(`  · Pasando a verlos cada 5 días no se pierde casi nada; si no aparecés, el negocio rinde el ${COMPRA.gestion.piso * 100} % y la caja se llena a los ${COMPRA.topeDias} días.`);
{
  const suma = IDS_NEGOCIOS.map((id) => gananciaBase(id)).sort((a, b) => b - a), con = suma.reduce((s, g, i) => s + g * FACTORES_CARTERA[i], 0), sin = suma.reduce((s, g) => s + g, 0);
  console.log(`  · Cada negocio de más rinde menos (la cartera): los ocho juntos dan ${$(con)} por día, el ${Math.round((con / sin) * 100)} % de la suma de cada uno por separado (${$(sin)}). Contra ${$(JORNAL)} de jornales.`);
}
