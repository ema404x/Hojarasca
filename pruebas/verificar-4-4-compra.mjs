// 4.4 (parte 2): comprar el negocio de un vecino y ser su socio (src/negocios-vecinos.js, negocios-vecinos-voces.js, negocios-vecinos-juego.js,
// negocios-vecinos-mundo.js), en Node:
//   · los ocho negocios: dentro del plano de la aldea, precios de $80.000 a $200.000, ganancia por día y días para pagarse en la escala del simulador,
//     una voz por dueño con todas las reacciones escritas;
//   · la reacción del vecino según la amistad, la historia escuchada, el apego al local y (Lucrecia) el romance: ofendido, se niega, pide que antes sepas
//     de dónde viene, pide más, pone condiciones o acepta con gusto; el precio dentro de 0,80 a 1,45 de la lista; si se queda o se va;
//   · comprar: paga por la puerta de la economía, un negocio una vez, la espera tras un portazo, el local que todavía no abrió, el Desafío;
//   · la ganancia por día: ventas, insumos, sueldo y gastos, la gestión (sin pasar a verlo), la cartera (más negocios, menos atención cada uno), el tope de
//     la caja, los saltos de días largos; retirar la caja;
//   · la sociedad: mínimo y máximo, porcentaje según la amistad, tu parte por día, el retiro con aviso y su devolución según los días, comprar siendo socio;
//   · el guardado: una partida vieja queda como estaba, lo roto se sanea, el Desafío no lo tiene;
//   · el juego (negocios-vecinos-juego.js) con un contexto de mentira: el menú de la charla, las reacciones con voz, el trato, la sociedad, el aviso de cada
//     día, el vecino que se va a la plaza, el cuaderno y el gerente;
//   · lo que se engancha en main.js, vecindad-juego.js, social-rueda.js, aldea.js, guardado.js, empleo.js y guia.js, y que no hay inglés ni mando en lo nuevo.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const N = await import('../src/negocios-vecinos.js');
const { VOCES_NEGOCIO, VOZ_GERENTE } = await import('../src/negocios-vecinos-voces.js');
const { economiaNueva, pesosDe, formatoPesos, ultimosMovimientos } = await import('../src/economia.js');
const A = await import('../src/aldea.js');
const V = await import('../src/vecindad.js');
const { VOCES } = await import('../src/vecindad-voces.js');
const E = await import('../src/empleo.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// una partida del Relax con `pesos`, con los pobladores que hacen falta instalados y sus locales abiertos
const relax = (pesos = 0, dia = 1, horas = 12) => {
  const p = { modo: 'relax', dia, horas, economia: { ...economiaNueva(), pesos }, negociosVecinos: N.negociosVecinosNuevo(), aldea: { pobladores: [], locales: {} } };
  for (const id of N.IDS_NEGOCIOS) { const c = N.NEGOCIOS[id].vecino; if (A.esPobladorAldea(c)) { p.aldea.pobladores.push({ clave: c }); p.aldea.locales[A.LOTE_DE[c]] = 1; } }
  return p;
};
// la amistad con un vecino, en puntos, y cuántas partes de su historia ya te contó
const amistad = (p, clave, puntos, hist = 0) => { V.cambiarAmistad(p, clave, 0, 1); const f = p.vecindad.personas[clave]; f.p = puntos; f.max = Math.max(f.max, puntos >= 140 ? 2 : puntos >= 50 ? 1 : 0); f.hist = hist; return f; };
const ctxDe = (puntos, hist = 0, extra = {}) => ({ puntos, hist, histTotal: 3, etapa: '', ...extra });

// ---------------------------------------------------------------- 1. los ocho negocios
{
  eq(N.IDS_NEGOCIOS.slice().sort(), ['almacen', 'cantina', 'casa-te', 'herreria', 'hilanderia', 'panaderia', 'pescaderia', 'sala-miel'], 'ocho negocios: almacén, casa de té, cantina, panadería, herrería, pescadería, hilandería y sala de miel');
  const vecinos = new Set(), precios = [];
  for (const id of N.IDS_NEGOCIOS) {
    const X = N.NEGOCIOS[id], ed = A.EDIFICIOS_ALDEA[id];
    ok(ed, `${id}: el local existe en el plano de la aldea`);
    ok(A.esPersonaAldea(X.vecino) && V.esPersonaVecindad(X.vecino) && VOCES[X.vecino], `${id}: ${X.vecino} es un vecino de la aldea con voz`);
    ok(!vecinos.has(X.vecino), `${id}: un negocio por vecino`); vecinos.add(X.vecino);
    ok(A.esPobladorAldea(X.vecino) ? A.LOTE_DE[X.vecino] === id : true, `${id}: el poblador y su lote coinciden`);
    ok(X.precio >= 80000 && X.precio <= 200000 && X.precio % 5000 === 0, `${id}: precio de lista $80.000 a $200.000 y redondo (${formatoPesos(X.precio)})`);
    precios.push(X.precio);
    const media = X.semana.reduce((s, v) => s + v, 0) / 7;
    ok(X.semana.length === 7 && Math.abs(media - 1) < 1e-9, `${id}: la semana promedia 1 (${media.toFixed(3)})`);
    ok(X.apego >= 0 && X.apego <= 1 && X.insumos > 0 && X.insumos < 0.7 && X.sueldo >= 500 && X.gastos >= 100, `${id}: números en rango`);
    const base = N.gananciaBase(id), dias = N.diasParaPagarse(id);
    ok(base > 800 && base < 3000, `${id}: gana ${formatoPesos(base)} por día en un día corriente`);
    ok(dias >= 40 && dias <= 100, `${id}: se paga solo en ${dias} días de juego (40 a 100)`);
    ok(N.topeDeCaja(id) >= base * 9 && N.topeDeCaja(id) <= base * 11, `${id}: la caja guarda unos diez días (${formatoPesos(N.topeDeCaja(id))})`);
    const { min, max } = N.rangoDeAporte(id);
    ok(min >= 5000 && max > min && max <= X.precio * 0.41 && min % 500 === 0 && max % 500 === 0, `${id}: aporte de socio de ${formatoPesos(min)} a ${formatoPesos(max)}`);
    ok(N.montosDeAporte(id).every((m) => m >= min && m <= max) && N.montosDeAporte(id)[0] === min && N.montosDeAporte(id).at(-1) === max, `${id}: los montos que se ofrecen van del mínimo al máximo`);
    ok(X.minimoSocio >= 50 && X.minimoSocio <= 140, `${id}: para ser socio hace falta amistad (${X.minimoSocio} puntos)`);
    eq(N.negocioDeVecino(X.vecino), id, `${id}: se halla por su vecino`);
    // la voz
    const v = VOCES_NEGOCIO[X.vecino];
    ok(v, `${id}: tiene su voz`);
    for (const t of ['ofendido', 'se-niega', 'resiste', 'pide-mas', 'acepta-condiciones', 'acepta']) ok(typeof v.compra[t] === 'string' && v.compra[t].length > 40, `${id}: reacción «${t}»`);
    ok(Array.isArray(v.cierre.queda) && v.cierre.queda.length >= 2, `${id}: cierra el trato y se queda`);
    ok(!X.puedeIrse || (Array.isArray(v.cierre['se-va']) && v.cierre['se-va'].length >= 2), `${id}: si puede irse, dice cómo se va`);
    for (const k of ['rechaza', 'resiste', 'acepta']) ok(typeof v.socio[k] === 'string', `${id}: socio ${k}`);
    ok(v.socio.acepta.includes('{pct}') && Array.isArray(v.socio.cierre), `${id}: socio acepta con el porcentaje`);
    for (const k of ['aviso', 'sale', 'cancela']) ok(typeof v.retiro[k] === 'string', `${id}: retiro ${k}`);
    ok(v.retiro.sale.includes('{devuelto}'), `${id}: dice cuánto devuelve`);
    for (const k of ['cuentas', 'caja', 'vacia', 'espera', 'sinPlata', 'sinNada']) ok(typeof v[k] === 'string' && v[k].length > 10, `${id}: «${k}»`);
    ok(v.cuentas.includes('{ventas}') && v.cuentas.includes('{neto}') && v.caja.includes('{monto}') && v.sinPlata.includes('{faltan}'), `${id}: los números van en su lugar`);
    // las marcas válidas
    const todo = JSON.stringify(v);
    ok([...todo.matchAll(/\{(\w+)\}/g)].every((m) => ['precio', 'pct', 'aporte', 'devuelto', 'dia', 'ventas', 'neto', 'monto', 'faltan'].includes(m[1])), `${id}: sólo marcas conocidas`);
  }
  ok(Math.min(...precios) === 80000 && Math.max(...precios) === 200000, 'los precios van de $80.000 (panadería) a $200.000 (cantina)');
  eq(N.CONSEJERO, 'gerente', 'el gerente del banco lleva las cuentas');
  ok(VOCES_NEGOCIO.moza.romance && ['novios', 'comprometidos', 'casados', 'separados'].every((k) => typeof VOCES_NEGOCIO.moza.romance[k] === 'string'), 'Lucrecia tiene su respuesta según el romance');
  ok(!N.NEGOCIOS.cantina.puedeIrse && !N.NEGOCIOS.almacen.puedeIrse && !N.NEGOCIOS['casa-te'].puedeIrse, 'el almacén, la casa de té y la cantina no se pueden ir: siguen como hoy');
  ok(N.NEGOCIOS.cantina.apego >= 0.8 && N.NEGOCIOS.almacen.apego >= 0.8 && N.NEGOCIOS['casa-te'].apego >= 0.8, 'Lucrecia, Ercilia y Ceinwen tienen un lazo fuerte con su local');
  ok(VOZ_GERENTE.intro && VOZ_GERENTE.sinNada.includes('$80.000') && VOZ_GERENTE.sinNada.includes('$200.000'), 'el gerente dice el rango de precios');
}

// ---------------------------------------------------------------- 2. la reacción del vecino
{
  const r = (id, puntos, hist = 0, extra = {}) => N.reaccionCompra(id, ctxDe(puntos, hist, extra));
  // los que se emocionan (apego fuerte)
  eq(r('cantina', 10).tipo, 'ofendido', 'Lucrecia, con poca confianza, se ofende');
  eq(r('almacen', 10).tipo, 'ofendido', 'Ercilia, con poca confianza, se ofende');
  eq(r('casa-te', 19).tipo, 'ofendido', 'Ceinwen, con poca confianza, se ofende');
  eq(r('cantina', 30).tipo, 'se-niega', 'Lucrecia, de conocidos, se niega');
  eq(r('almacen', 60, 0).tipo, 'resiste', 'Ercilia, de amigos pero sin conocer su historia, antes quiere que la escuches');
  eq(r('almacen', 60, 1).tipo, 'resiste', 'con una sola parte, todavía no');
  eq(r('almacen', 60, 0).pide, 'historia', 'y lo que pide es oír «Tu historia»');
  eq(r('almacen', 60, 2).tipo, 'pide-mas', 'con dos partes, pide más');
  ok(Math.abs(r('almacen', 60, 2).mult - 1.2) < 1e-9, 'amigo: pide 20 % más');
  eq(r('almacen', 100, 2).tipo, 'acepta-condiciones', 'con más confianza acepta con condiciones');
  eq(r('almacen', 150, 2).tipo, 'acepta', 'de compadre acepta con gusto');
  eq(r('almacen', 100, 0).tipo, 'resiste', 'y sin su historia, aunque haya confianza, resiste');
  ok(r('almacen', 150, 3).mult < r('almacen', 150, 2).mult, 'con su historia entera, un precio más amable');
  // los que no se emocionan
  eq(r('panaderia', 5).tipo, 'se-niega', 'Rosa, con poca confianza, se niega (sin ofenderse)');
  eq(r('panaderia', 30).tipo, 'pide-mas', 'Rosa, de conocidos, pide un 40 % más');
  ok(Math.abs(r('panaderia', 30).mult - 1.4) < 1e-9, '×1,40');
  eq(r('panaderia', 60, 0).tipo, 'pide-mas', 'Rosa, de amigos, pide más aunque no sepa su historia (no es lo suyo)');
  eq(r('panaderia', 100).tipo, 'acepta-condiciones', 'Rosa, de buen amigo, pone condiciones');
  eq(r('panaderia', 150).tipo, 'acepta', 'Rosa, de compadre, acepta');
  eq(r('panaderia', 200).precio, 72000, 'el mejor precio es el 90 % (con la historia, algo menos)');
  eq(r('panaderia', 200, 3).precio, 69000, 'con toda su historia, el 86 % ($69.000)');
  // el precio siempre dentro de 0,80 a 1,45
  for (const id of N.IDS_NEGOCIOS) {
    for (const puntos of [0, 10, 19, 20, 35, 49, 50, 70, 94, 95, 120, 139, 140, 170, 179, 180, 200]) {
      for (const hist of [0, 1, 2, 3]) {
        for (const etapa of ['', 'conocidos', 'novios', 'casados', 'separados']) {
          const x = r(id, puntos, hist, { etapa });
          const vende = N.TIPOS_QUE_VENDEN.includes(x.tipo);
          if (vende) ok(x.precio >= N.NEGOCIOS[id].precio * 0.8 - 250 && x.precio <= N.NEGOCIOS[id].precio * 1.45 + 250 && x.precio % 500 === 0, `${id} ${puntos}/${hist}/${etapa}: precio dentro del 80 al 145 % (${x.precio})`);
          else ok(x.precio === 0, `${id} ${puntos}/${hist}: si no vende, sin precio`);
          ok(['ofendido', 'se-niega', 'resiste', 'pide-mas', 'acepta-condiciones', 'acepta'].includes(x.tipo), 'un tipo conocido');
          ok(vende === !!x.destino, 'destino sólo si vende');
        }
      }
    }
  }
  // más amistad nunca encarece (con la misma historia)
  for (const id of N.IDS_NEGOCIOS) {
    let ultimo = Infinity;
    for (const puntos of [20, 50, 95, 140, 180]) { const x = r(id, puntos, 3); if (N.TIPOS_QUE_VENDEN.includes(x.tipo)) { ok(x.precio <= ultimo, `${id}: a más amistad, no más caro (${puntos})`); ultimo = x.precio; } }
  }
  // quién se queda y quién se va
  for (const id of N.IDS_NEGOCIOS) { for (const puntos of [95, 150, 200]) eq(r(id, puntos, 3).destino, 'queda', `${id}: con ${puntos} puntos se queda de empleado`); }
  for (const id of ['almacen', 'casa-te', 'cantina']) eq(r(id, 60, 2).destino, 'queda', `${id}: aunque pida más, se queda (no se puede ir)`);
  for (const id of ['panaderia', 'herreria', 'pescaderia', 'hilanderia', 'sala-miel']) { eq(r(id, 60, 2).destino, 'se-va', `${id}: de amigos nomás, se va a otra cosa`); eq(r(id, 30, 2).destino, 'se-va', `${id}: de conocidos, también`); }
  // Lucrecia y el romance
  ok(r('cantina', 150, 3, { etapa: 'novios' }).precio < r('cantina', 150, 3, { etapa: 'conocidos' }).precio, 'si son novios, Lucrecia es más generosa');
  ok(r('cantina', 150, 3, { etapa: 'casados' }).precio < r('cantina', 150, 3, { etapa: 'novios' }).precio, 'y casados, más todavía');
  ok(r('cantina', 150, 3, { etapa: 'separados' }).precio > r('cantina', 150, 3, { etapa: 'conocidos' }).precio, 'y si se separaron, más cara');
  eq(r('cantina', 60, 0, { etapa: 'novios' }).tipo, 'pide-mas', 'siendo novios no hace falta que le escuches su historia: pide más y listo');
  ok(r('almacen', 150, 3, { etapa: 'novios' }).precio === r('almacen', 150, 3, { etapa: '' }).precio, 'el romance sólo importa en la cantina');
  // lo que no es un negocio
  eq(N.reaccionCompra('nada', {}).tipo, 'se-niega', 'un negocio que no existe se niega');
  eq(N.devolucionPorDias(0), 0.6, 'sociedad: recién entrado, 60 %');
  // los textos de cada reacción para cada vecino, llenos
  for (const id of N.IDS_NEGOCIOS) {
    const v = VOCES_NEGOCIO[N.NEGOCIOS[id].vecino];
    for (const t of Object.keys(v.compra)) ok(!/\{(?!precio)\w+\}/.test(v.compra[t]), `${id}/${t}: sólo {precio}`);
    ok(v.compra.acepta.includes('{precio}') && v.compra['acepta-condiciones'].includes('{precio}') && v.compra['pide-mas'].includes('{precio}'), `${id}: las que venden dicen el precio`);
  }
}

// ---------------------------------------------------------------- 3. comprar
{
  const p = relax(500000, 5);
  amistad(p, 'panadera', 200, 3);
  const e1 = N.evaluarCompra(p, 'panaderia', ctxDe(200, 3));
  ok(e1.ok && e1.reaccion.tipo === 'acepta' && e1.precio === 69000 && e1.credito === 0, 'Rosa, de compadre del alma y con su historia, te lo vende a $69.000');
  const antes = N.comprar(relax(1000, 5), 'panaderia', ctxDe(200, 3));
  ok(!antes.ok && antes.motivo === 'dinero' && antes.faltan === 68000, 'sin plata no se compra (te faltan $68.000)');
  const c = N.comprar(p, 'panaderia', ctxDe(200, 3, { compadre: true }));
  ok(c.ok && c.precio === 69000 && c.destino === 'queda', 'comprar: $69.000, y Rosa se queda');
  eq(pesosDe(p), 431000, 'se pagó exacto');
  eq(ultimosMovimientos(p, 1)[0].monto, -69000, 'queda en el libro');
  ok(/Compraste la panadería de Rosa/.test(ultimosMovimientos(p, 1)[0].motivo), 'con su motivo');
  ok(N.esTuyo(p, 'panaderia') && N.tusNegocios(p).length === 1, 'ahora es tuyo');
  eq(p.negociosVecinos.comprados.panaderia.bono, N.COMPRA.bonoCompadre, 'un compadre de empleado se esmera (+5 %)');
  const c2 = N.comprar(p, 'panaderia', ctxDe(200, 3));
  ok(!c2.ok && c2.motivo === 'tuyo', 'no se compra dos veces');
  eq(pesosDe(p), 431000, 'y no se cobra de nuevo');
  // el que se niega: hay que esperar
  const q = relax(500000, 10);
  const nega = N.evaluarCompra(q, 'cantina', ctxDe(10, 0));
  ok(!nega.ok && nega.motivo === 'ofendido', 'Lucrecia ofendida: no hay trato');
  eq(N.anotarRechazo(q, 'cantina', 'ofendido', 10), 4, 'tras ofenderse espera cuatro días');
  const nega2 = N.evaluarCompra(q, 'cantina', ctxDe(150, 3, { dia: 11 }));
  ok(!nega2.ok && nega2.motivo === 'espera' && nega2.hasta === 14, 'el día siguiente ni lo escucha (hasta el día 14)');
  ok(N.evaluarCompra(q, 'cantina', ctxDe(150, 3, { dia: 14 })).ok, 'pasados los días, se puede volver a hablar');
  eq(N.anotarRechazo(q, 'cantina', 'se-niega', 10), 1, 'si sólo se niega, espera un día');
  eq(N.anotarRechazo(q, 'cantina', 'resiste', 10), 0, 'si pide que antes la escuches, no hay espera');
  // un poblador que todavía no llegó
  const r0 = relax(500000, 5); r0.aldea = { pobladores: [], locales: {} };
  eq(N.evaluarCompra(r0, 'panaderia', ctxDe(150, 3)).motivo, 'no-esta', 'la panadería sin Rosa en la aldea no se vende');
  ok(N.evaluarCompra(r0, 'cantina', ctxDe(150, 3)).motivo !== 'no-esta' && N.negocioAbierto(r0, 'almacen') && N.negocioAbierto(r0, 'casa-te'), 'la cantina, el almacén y la casa de té están desde el primer día');
  r0.aldea = { pobladores: [{ clave: 'panadera' }], locales: {} };
  eq(N.evaluarCompra(r0, 'panaderia', ctxDe(150, 3)).motivo, 'no-esta', 'con Rosa pero el local sin abrir, tampoco');
  // el Desafío y la partida sin economía
  const d = { modo: 'desafio', dia: 5 };
  eq(N.evaluarCompra(d, 'almacen', ctxDe(150, 3)).motivo, 'nada', 'en el Desafío no hay nada de esto');
  eq(N.asegurarNegociosVecinos(d), null, 'ni el guardado');
  ok(N.comprar(d, 'almacen', ctxDe(200, 3)).ok === false, 'ni comprar');
  ok(!N.hayNegocios(d) && N.hayNegocios(relax()), 'sólo con economía');
  // si eras socio: el aporte descuenta
  const s = relax(500000, 10);
  const so = N.entrarSocio(s, 'herreria', 30000, ctxDe(100, 1));
  ok(so.ok && so.aporte === 30000, 'sos socio de la herrería con $30.000');
  s.negociosVecinos.socios.herreria.caja = 1500;
  const antes2 = pesosDe(s);
  const ev = N.evaluarCompra(s, 'herreria', ctxDe(150, 3, { dia: 50 }));
  eq(ev.credito, 30000, 'siendo socio hace 40 días, el aporte descuenta entero');
  const cc = N.comprar(s, 'herreria', ctxDe(150, 3, { dia: 50 }));
  ok(cc.ok && cc.precio === ev.precio && cc.credito === 30000 && cc.cajaSocio === 1500, 'comprar siendo socio: pagás de menos y te dan tu parte de la caja');
  eq(pesosDe(s), antes2 - cc.precio + 1500, 'la cuenta cierra');
  ok(!N.esSocio(s, 'herreria') && N.esTuyo(s, 'herreria'), 'y la sociedad se cierra');
  const rec = relax(500000, 10); N.entrarSocio(rec, 'herreria', 30000, ctxDe(100, 1, { dia: 10 }));
  eq(N.evaluarCompra(rec, 'herreria', ctxDe(150, 3, { dia: 12 })).credito, 18000, 'si apenas entraste, te devuelven el 60 % del aporte y eso descuenta ($18.000)');
}

// ---------------------------------------------------------------- 4. la ganancia por día
{
  // un día
  for (const id of N.IDS_NEGOCIOS) {
    for (let d = 1; d <= 30; d++) {
      const g = N.gananciaDelDia(id, d);
      ok(g.neto >= 0 && g.ventas > 0 && g.insumos > 0 && g.insumos < g.ventas, `${id} día ${d}: ventas, insumos y neto sensatos`);
      ok(g.bruto === g.ventas - g.insumos - g.sueldo - g.gastos, `${id} día ${d}: ventas − insumos − sueldo − gastos`);
      eq(g, N.gananciaDelDia(id, d), `${id} día ${d}: siempre lo mismo`);
    }
    let suma = 0; for (let d = 1; d <= 840; d++) suma += N.gananciaDelDia(id, d).neto;
    ok(Math.abs(suma / 840 - N.gananciaBase(id)) / N.gananciaBase(id) < 0.03, `${id}: el promedio de 840 días da la ganancia base (${Math.round(suma / 840)} vs ${N.gananciaBase(id)})`);
  }
  // la semana: el sábado vende más y el domingo menos
  ok(N.gananciaDelDia('cantina', 6).ventas > N.gananciaDelDia('cantina', 7).ventas && N.gananciaDelDia('cantina', 6).ventas > N.gananciaDelDia('cantina', 1).ventas * 1.5, 'la cantina vende el doble el sábado que el lunes');
  ok(A.diaSemanaDe(6) === 5 && A.diaSemanaDe(7) === 6, 'el día 6 es sábado');
  // la gestión
  eq([0, 1, 3].map(N.factorGestion), [1, 1, 1], 'hasta tres días sin pasar, rinde todo');
  ok(Math.abs(N.factorGestion(5) - 0.92) < 1e-9 && Math.abs(N.factorGestion(10) - 0.72) < 1e-9 && N.factorGestion(40) === 0.7, 'después baja 4 % por día hasta el 70 %');
  ok(N.gananciaDelDia('almacen', 10, { gestion: 0.7 }).neto < N.gananciaDelDia('almacen', 10).neto, 'sin pasar a verlo, rinde menos');
  ok(N.gananciaDelDia('panaderia', 10, { sinVecino: true }).neto < N.gananciaDelDia('panaderia', 10).neto, 'si el vecino se fue, vende un 12 % menos');
  eq([0, 1, 2, 7, 20].map(N.factorCartera), [1, 0.93, 0.86, 0.55, 0.55], 'la cartera: cada negocio de más, menos atención cada uno, con piso del 55 %');
  // el cálculo de varios días, de un negocio tuyo
  const p = relax(300000, 10);
  N.comprar(p, 'panaderia', ctxDe(200, 3));
  eq(p.negociosVecinos.ultimoDia, 10, 'el día de la compra arranca la cuenta');
  eq(N.pasarDia(p, 10), null, 'el mismo día, nada');
  const r1 = N.pasarDia(p, 11);
  ok(r1 && r1.propios.length === 0 && r1.total === 0, 'el día de la compra no rinde: se empieza al día siguiente');
  const r2 = N.pasarDia(p, 12);
  const esperado = N.gananciaDelDia('panaderia', 11, { gestion: N.factorGestion(1), cartera: 1, bono: 1 }).neto;
  ok(r2 && r2.dias === 1 && r2.total === esperado && N.cajaDe(p, 'panaderia') === esperado, `al otro día entra lo del día 11 (${formatoPesos(esperado)})`);
  eq(pesosDe(p), 300000 - 69000, 'la billetera todavía no se tocó: la plata está en la caja del negocio');
  // el tope
  for (let d = 13; d < 60; d++) N.pasarDia(p, d);
  ok(N.cajaDe(p, 'panaderia') === N.topeDeCaja('panaderia'), 'la caja se llena y ahí queda (tope de diez días)');
  ok(p.negociosVecinos.comprados.panaderia.perdido > 0, 'y lo que no entra se cuenta como perdido');
  const antes = pesosDe(p), caja = N.cajaDe(p, 'panaderia');
  const ret = N.retirarCaja(p, 'panaderia', 60);
  ok(ret.ok && ret.monto === caja && pesosDe(p) === antes + caja && N.cajaDe(p, 'panaderia') === 0, 'retirar la caja la pasa a la billetera');
  ok(/Caja de la panadería de Rosa/.test(ultimosMovimientos(p, 1)[0].motivo) && ultimosMovimientos(p, 1)[0].monto === caja, 'y queda en el libro');
  eq(N.retirarCaja(p, 'panaderia', 60).motivo, 'vacia', 'con la caja vacía no hay nada');
  eq(N.retirarCaja(p, 'almacen', 60).motivo, 'nada', 'de un negocio que no es tuyo, tampoco');
  // la gestión de verdad: sin pasar a verlo
  const g1 = relax(300000, 10), g2 = relax(300000, 10);
  for (const q of [g1, g2]) { N.comprar(q, 'almacen', ctxDe(200, 3)); }
  for (let d = 11; d <= 30; d++) { N.pasarDia(g1, d); N.retirarCaja(g1, 'almacen', d); N.pasarDia(g2, d); }
  ok(N.cajaDe(g1, 'almacen') + 0 >= 0 && g1.negociosVecinos.comprados.almacen.total > g2.negociosVecinos.comprados.almacen.total * 1.05, 'el que pasa a verlo todos los días junta más que el que no aparece');
  // días largos: sólo los últimos treinta
  const h = relax(300000, 10); N.comprar(h, 'cantina', ctxDe(200, 3));
  const rh = N.pasarDia(h, 500);
  ok(rh && rh.dias === 490, 'volver tras un año: se cuentan los días que pasaron');
  eq(N.cajaDe(h, 'cantina'), N.topeDeCaja('cantina'), 'pero sólo los últimos treinta (y la caja tiene tope)');
  ok(h.negociosVecinos.comprados.cantina.total <= N.topeDeCaja('cantina'), 'nada de millones por volver tarde');
  // el que se fue: vende menos
  const a = relax(500000, 10), b = relax(500000, 10);
  N.comprar(a, 'herreria', ctxDe(60, 2)); N.comprar(b, 'herreria', ctxDe(150, 3));
  eq(a.negociosVecinos.comprados.herreria.destino, 'se-va', 'Anselmo de amigo se va');
  eq(b.negociosVecinos.comprados.herreria.destino, 'queda', 'Anselmo de compadre se queda');
  eq(N.vecinosQueSeFueron(a), ['herrero'], 'el que se fue se anota para la aldea');
  eq(N.vecinosQueSeFueron(b), [], 'el que se queda, no');
  for (let d = 11; d <= 40; d++) { N.pasarDia(a, d); N.retirarCaja(a, 'herreria', d); N.pasarDia(b, d); N.retirarCaja(b, 'herreria', d); }
  ok(a.negociosVecinos.comprados.herreria.total < b.negociosVecinos.comprados.herreria.total, 'sin el vecino, el negocio rinde menos');
  // la cartera: el segundo rinde menos que solo
  const c1 = relax(900000, 10), c2 = relax(900000, 10);
  N.comprar(c1, 'panaderia', ctxDe(200, 3)); N.comprar(c1, 'pescaderia', ctxDe(200, 3)); N.comprar(c2, 'pescaderia', ctxDe(200, 3));
  for (let d = 11; d <= 40; d++) { N.pasarDia(c1, d); N.retirarCaja(c1, 'panaderia', d); N.retirarCaja(c1, 'pescaderia', d); N.pasarDia(c2, d); N.retirarCaja(c2, 'pescaderia', d); }
  ok(c1.negociosVecinos.comprados.pescaderia.total < c2.negociosVecinos.comprados.pescaderia.total, 'el mismo negocio rinde menos si tenés otro (tu atención se reparte)');
  // el resumen
  const res = N.resumenNegociosVecinos(c1, 41);
  ok(res.hay && res.propios.length === 2 && res.propios[0].id === 'panaderia' && res.propios[1].cartera === 0.93, 'el resumen: dos negocios, en orden de compra');
  ok(res.porDia > 0 && res.caja === N.cajasTotal(c1) && res.total.invertido === 69000 + 73500, 'con lo que rinden y lo que hay en las cajas');
}

// ---------------------------------------------------------------- 5. la sociedad
{
  const p = relax(400000, 10);
  // quién acepta
  eq(N.reaccionSocio('panaderia', { puntos: 30 }).tipo, 'rechaza', 'alguien que no te conoce no te acepta de socio');
  eq(N.reaccionSocio('panaderia', { puntos: 49 }).faltan, 1, 'te falta un punto para amigo');
  eq(N.reaccionSocio('panaderia', { puntos: 50 }).tipo, 'acepta', 'de amigo, la panadería sí');
  eq(N.reaccionSocio('panaderia', { puntos: 50 }).factor, 0.9, 'un amigo te da el 90 % de lo que corresponde');
  eq(N.reaccionSocio('panaderia', { puntos: 140 }).factor, 1, 'un compadre, todo');
  eq(N.reaccionSocio('cantina', { puntos: 100, hist: 3 }).tipo, 'rechaza', 'Lucrecia pide más confianza que Rosa (110 puntos)');
  eq(N.reaccionSocio('cantina', { puntos: 120, hist: 0 }).tipo, 'resiste', 'y la que se emociona pide antes oír su historia');
  eq(N.reaccionSocio('cantina', { puntos: 120, hist: 1 }).tipo, 'acepta', 'con una parte, acepta');
  // entrar
  const mal = N.entrarSocio(p, 'panaderia', 2000, { puntos: 150, hist: 3 });
  ok(!mal.ok && mal.motivo === 'monto', 'menos del mínimo, no');
  ok(!N.entrarSocio(p, 'panaderia', 99000, { puntos: 150, hist: 3 }).ok, 'más del máximo, no');
  ok(!N.entrarSocio(relax(100, 10), 'panaderia', 8000, { puntos: 150, hist: 3 }).ok, 'sin plata, no');
  const e = N.entrarSocio(p, 'panaderia', 20000, { puntos: 150, hist: 3 });
  ok(e.ok && e.aporte === 20000 && e.pct === 25 && e.porDia === Math.round((1250 * 25) / 100), 'poniendo $20.000 como compadre: el 25 % (1/4 del negocio): $312 por día');
  eq(pesosDe(p), 380000, 'se pagó el aporte');
  ok(/Aporte de socio en la panadería de Rosa/.test(ultimosMovimientos(p, 1)[0].motivo), 'queda en el libro');
  ok(N.esSocio(p, 'panaderia') && N.tusSociedades(p).length === 1, 'sos socio');
  ok(!N.entrarSocio(p, 'panaderia', 8000, { puntos: 150, hist: 3 }).ok, 'no se entra dos veces');
  eq(N.porcentajeDe('panaderia', 32000, 1), 40, 'el máximo es el 40 %');
  ok(N.porcentajeDe('panaderia', 32000, 1) <= N.SOCIEDAD.porcentajeMax, 'nunca pasa del 45 %');
  ok(N.porcentajeDe('panaderia', 8000, 0.9) === 9 && N.porcentajeDe('panaderia', 8000, 1) === 10, 'amigo: 9 %, compadre: 10 %');
  // lo que rinde
  N.pasarDia(p, 11);
  const r = N.pasarDia(p, 12);
  const parte = Math.round((N.gananciaDelDia('panaderia', 11).neto * 25) / 100 / 10) * 10;
  ok(r && r.socios.length === 1 && r.socios[0].parte === parte && N.cajaDe(p, 'panaderia') === parte, `al otro día entra tu parte del día 11 ($${parte})`);
  for (let d = 13; d <= 60; d++) N.pasarDia(p, d);
  ok(N.cajaDe(p, 'panaderia') === N.topeDeSocio('panaderia', 25), 'la caja de tu parte también tiene tope');
  const antes = pesosDe(p), caja = N.cajaDe(p, 'panaderia');
  ok(N.retirarCaja(p, 'panaderia', 60).ok && pesosDe(p) === antes + caja, 'retirás tu parte');
  ok(/Tu parte de la panadería de Rosa/.test(ultimosMovimientos(p, 1)[0].motivo), 'con su motivo');
  // el retiro con aviso
  const av = N.avisarRetiro(p, 'panaderia', 60);
  ok(av.ok && av.sale === 62 && av.devolucion === 20000, 'avisás el día 60: sale el 62 y, con 50 días de socio, te devuelven todo ($20.000)');
  ok(!N.avisarRetiro(p, 'panaderia', 60).ok, 'no se avisa dos veces');
  eq(N.devolucionHoy(p, 'panaderia', 60), 20000, 'antes de avisar se ve cuánto devolverían');
  const r61 = N.pasarDia(p, 61);
  ok(N.esSocio(p, 'panaderia') && r61.retiros.length === 0, 'hasta el día 62 seguís de socio');
  const antes3 = pesosDe(p), cajaS = N.cajaDe(p, 'panaderia');
  const r62 = N.pasarDia(p, 62);
  ok(r62.retiros.length === 1 && r62.retiros[0].devuelto === 20000, 'el día 62 se hace efectivo: devuelven $20.000');
  ok(!N.esSocio(p, 'panaderia') && pesosDe(p) === antes3 + 20000 + r62.retiros[0].caja && r62.retiros[0].caja >= cajaS, 'la sociedad se cierra y cobrás el aporte más lo que había');
  ok(/Te retiraste de la sociedad de la panadería de Rosa/.test(ultimosMovimientos(p, 1)[0].motivo), 'queda en el libro');
  // la devolución crece con los días
  eq([0, 5, 6, 17, 18, 35, 36, 80].map(N.devolucionPorDias), [0.6, 0.6, 0.8, 0.8, 0.92, 0.92, 1, 1], 'devolución: 60 % antes de 6 días, 80 % hasta 18, 92 % hasta 36, todo después');
  const t = relax(400000, 10); N.entrarSocio(t, 'pescaderia', 20000, { puntos: 70, hist: 1 });
  N.avisarRetiro(t, 'pescaderia', 10);
  const antes4 = pesosDe(t); N.pasarDia(t, 11); N.pasarDia(t, 12);
  ok(!N.esSocio(t, 'pescaderia') && pesosDe(t) >= antes4 + 12000 && pesosDe(t) <= antes4 + 12000 + 1000, 'si te retirás enseguida, te devuelven el 60 % ($12.000)');
  // cancelar
  const u = relax(400000, 10); N.entrarSocio(u, 'pescaderia', 20000, { puntos: 70, hist: 1 }); N.avisarRetiro(u, 'pescaderia', 10);
  ok(N.cancelarRetiro(u, 'pescaderia') && u.negociosVecinos.socios.pescaderia.aviso === null, 'se puede arrepentir antes del día');
  ok(!N.cancelarRetiro(u, 'pescaderia'), 'y sin aviso no hay nada que cancelar');
  N.pasarDia(u, 11); N.pasarDia(u, 20);
  ok(N.esSocio(u, 'pescaderia'), 'y sigue de socio');
  // el tope de sociedades y no con lo tuyo
  const w = relax(900000, 10);
  for (const id of ['panaderia', 'pescaderia', 'sala-miel']) ok(N.entrarSocio(w, id, N.rangoDeAporte(id).min, { puntos: 150, hist: 3 }).ok, `sociedad con ${id}`);
  const cuarta = N.entrarSocio(w, 'hilanderia', 11000, { puntos: 150, hist: 3 });
  ok(!cuarta.ok && cuarta.motivo === 'tope', 'tres sociedades a la vez, no más');
  const x = relax(900000, 10); N.comprar(x, 'almacen', ctxDe(200, 3));
  eq(N.entrarSocio(x, 'almacen', 20000, { puntos: 200, hist: 3 }).motivo, 'tuyo', 'no podés ser socio de lo que ya es tuyo');
}

// ---------------------------------------------------------------- 6. el guardado
{
  eq(N.sanearNegociosVecinos(undefined), N.negociosVecinosNuevo(), 'una partida vieja (sin el campo) sale vacía');
  eq(N.sanearNegociosVecinos('x'), N.negociosVecinosNuevo(), 'un valor roto sale vacío');
  const roto = N.sanearNegociosVecinos({ v: 1, ultimoDia: 9e9, comprados: { panaderia: { desde: -4, pagado: 1e99, destino: 'x', caja: 9e9, total: 'mucho', bono: 7 }, nada: { desde: 1 }, cantina: 5 }, socios: { herreria: { aporte: 1e9, pct: 99, caja: 1e9, aviso: { dia: 5, sale: 9 } }, panaderia: { aporte: 100 } }, rechazos: { cantina: 99, almacen: 1 }, historial: [{ local: 'cantina', tipo: 'compra', dia: 3, monto: -5 }, { local: 'x' }, 5], total: { ganado: -3 } }, 10);
  eq(Object.keys(roto.comprados), ['panaderia'], 'sólo quedan los negocios que existen');
  const c = roto.comprados.panaderia;
  ok(c.desde >= 1 && c.desde <= 10 && c.pagado <= 1e8 && c.caja === N.topeDeCaja('panaderia') && c.total === 0 && c.bono === 1 && c.destino === 'queda', 'los números rotos se acotan (un destino raro queda en «se queda»)');
  eq(Object.keys(roto.socios), ['herreria'], 'la sociedad con lo que ya es tuyo se descarta, y la de $100 también');
  ok(roto.socios.herreria.pct <= 45 && roto.socios.herreria.aporte <= 60000 && roto.socios.herreria.caja <= N.topeDeSocio('herreria', 45), 'el socio: porcentaje, aporte y caja acotados');
  ok(roto.socios.herreria.aviso && roto.socios.herreria.aviso.sale === 9, 'el aviso de retiro viaja');
  ok(roto.ultimoDia <= 10, 'el último día no es del futuro');
  eq(Object.keys(roto.rechazos), ['cantina'], 'de las esperas sólo queda la que todavía no pasó');
  eq(roto.historial.length, 1, 'del historial queda lo que es de un negocio');
  eq(roto.total.ganado, 0, 'totales en cero');
  // la partida
  const almacen = new Map();
  globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), key: () => null, length: 0 };
  const G = await import('../src/guardado.js');
  G.usarModoGuardado('relax', 1);
  const nuevo = G.progresoNuevo();
  eq(nuevo.negociosVecinos, N.negociosVecinosNuevo(), 'una partida nueva del Relax trae los negocios vacíos');
  const vieja = JSON.parse(JSON.stringify(nuevo)); delete vieja.negociosVecinos; vieja.cosas = { yerba: 3, harina: 1 };
  G.escribirPartida('relax', 1, vieja);
  const cv = G.leerPartida('relax', 1), pc = cv?.progreso || cv;
  eq(pc.negociosVecinos, N.negociosVecinosNuevo(), 'una partida de antes carga con los negocios vacíos');
  ok(pc.economia.pesos === 0 && pc.cosas.harina === 1 && pc.cosas.yerba === 3, 'y lo demás (la economía, las cosas) queda como estaba');
  ok(pc.empleo && pc.negocioPropio, 'y el empleo y el negocio propio de la 4.3 siguen');
  const q = relax(400000, 12); N.comprar(q, 'panaderia', ctxDe(150, 3)); N.entrarSocio(q, 'pescaderia', 20000, { puntos: 70, hist: 1 });
  const con = JSON.parse(JSON.stringify(pc)); con.negociosVecinos = JSON.parse(JSON.stringify(q.negociosVecinos)); con.dia = 12;
  G.escribirPartida('relax', 1, con);
  const d2 = G.leerPartida('relax', 1), pd = d2?.progreso || d2;
  ok(pd.negociosVecinos.comprados.panaderia && pd.negociosVecinos.socios.pescaderia && pd.negociosVecinos.socios.pescaderia.aporte === 20000, 'los negocios y las sociedades sobreviven al guardado de la partida');
  eq(pd.negociosVecinos.comprados.panaderia.pagado, 73000, 'con lo que pagaste');
  G.escribirPartida('relax', 1, { ...con, negociosVecinos: { comprados: 5, socios: 'roto' } });
  const e2 = G.leerPartida('relax', 1), pe = e2?.progreso || e2;
  eq(pe.negociosVecinos, N.negociosVecinosNuevo(), 'un campo roto en la partida se sanea');
  G.usarModoGuardado('desafio', 1);
  ok(G.progresoNuevo().negociosVecinos === undefined, 'el Desafío no trae negocios');
  const guard = leer('src/guardado.js');
  ok(guard.includes("import { negociosVecinosNuevo, sanearNegociosVecinos } from './negocios-vecinos.js';") && guard.includes('sanearNegociosVecinos(p.negociosVecinos'), 'guardado.js lo usa');
}

// ---------------------------------------------------------------- 7. el juego, con un contexto de mentira
{
  const { crearNegociosVecinosJuego } = await import('../src/negocios-vecinos-juego.js');
  const p = relax(500000, 10, 12);
  const notas = [], sonidos = [], guardados = [];
  let desafio = false, barras = 0;
  const ctx = {
    progreso: () => p, desafio: () => desafio, escena: () => null, altura: () => 20, jugador: () => null,
    nota: (t, sub) => notas.push([t, sub || '']), guardar: () => guardados.push(1), refrescarBarra: () => { barras++; },
    sonido: () => ({ anotar: () => sonidos.push('anotar') }),
  };
  const J = crearNegociosVecinosJuego(ctx);
  const s = (clave) => ({ clave, vueltas: 0, sub: null });
  const elegir = (clave, id) => J.elegir(s(clave), id);
  // el menú
  eq(J.opciones('panadera'), [{ id: 'negocios', titulo: 'Hablar de su negocio' }], 'Rosa ofrece «Hablar de su negocio»');
  eq(J.opciones('gerente'), [{ id: 'negocios:resumen', titulo: 'Hablar de negocios' }], 'el gerente, «Hablar de negocios»');
  eq(J.opciones('jefe'), [], 'el jefe de estación, nada');
  eq(J.opciones('carpintero'), [], 'ni los pobladores sin negocio');
  p.aldea.pobladores = p.aldea.pobladores.filter((x) => x.clave !== 'panadera');
  eq(J.opciones('panadera'), [], 'si Rosa todavía no llegó, nada');
  p.aldea.pobladores.push({ clave: 'panadera' });
  desafio = true; eq(J.opciones('panadera'), [], 'en el Desafío, nada'); desafio = false;
  // el submenú principal
  let r = elegir('panadera', 'negocios');
  ok(r.tipo === 'menu' && r.sub.tipo === 'negocios' && r.sub.opciones.map((o) => o.id).join() === 'negocios:cuentas,negocios:socio,negocios:comprar,volver', 'el submenú: cómo le va, socio, comprar, mejor no');
  ok(/precio de lista \$80\.000/.test(r.sub.texto) && /de \$8\.000 a \$32\.000/.test(r.sub.texto), `el texto dice el precio de lista y lo que se puede poner (${r.sub.texto.slice(0, 80)}…)`);
  eq(r.sub.opciones.at(-1).id, 'volver', 'con su «Mejor no»');
  // con poca amistad: se niega, sin ofenderse (Rosa)
  amistad(p, 'panadera', 5, 0);
  r = elegir('panadera', 'negocios:comprar');
  ok(r.tipo === 'renglones' && r.reaccion === 'se-niega' && /no se vende/.test(r.renglones[0]), 'Rosa de desconocida: «no se vende»');
  eq(p.negociosVecinos.rechazos.panaderia, 11, 'y te pide esperar un día');
  r = elegir('panadera', 'negocios:comprar');
  ok(r.tipo === 'renglones' && /tanda en el horno/.test(r.renglones[0]), 'si insistís el mismo día, «tengo la tanda en el horno»');
  // Lucrecia ofendida: pierde confianza
  amistad(p, 'moza', 10, 0);
  const antesPuntos = V.puntosAmistad('moza', p);
  r = elegir('moza', 'negocios:comprar');
  ok(r.reaccion === 'ofendido' && /Me ofendiste/.test(r.renglones[0]), 'Lucrecia con poca confianza se ofende');
  eq(V.puntosAmistad('moza', p), antesPuntos - 3, 'y te tiene 3 puntos menos de confianza');
  eq(p.negociosVecinos.rechazos.cantina, 14, 'y no quiere hablar del tema cuatro días');
  // Ercilia pide la historia
  amistad(p, 'ercilia', 60, 0);
  r = elegir('ercilia', 'negocios:comprar');
  ok(r.reaccion === 'resiste' && /Tu historia/.test(r.renglones[0]), 'Ercilia de amiga: antes quiere que le pidas «Tu historia»');
  ok(!p.negociosVecinos.rechazos.almacen, 'sin esperar: podés volver cuando la escuches');
  // pide más: Aurelio de amigo
  amistad(p, 'pescador', 60, 0);
  r = elegir('pescador', 'negocios:comprar');
  ok(r.tipo === 'menu' && r.sub.opciones[0].id === 'negocios:cerrar' && r.sub.opciones[0].titulo === 'Cerrar el trato: $102.000', 'Aurelio de amigo pide un 20 % más: $102.000 para cerrar');
  ok(/\$102\.000/.test(r.sub.texto) && /otra orilla/.test(r.sub.texto), 'y dice el precio y que se iría a otra orilla');
  eq(r.sub.opciones.at(-1).id, 'volver', 'con «Pensarlo»');
  eq(pesosDe(p), 500000, 'todavía no se pagó nada');
  // sin plata
  const pobre = relax(5000, 10, 12); amistad(pobre, 'pescador', 60, 0);
  const Jp = crearNegociosVecinosJuego({ ...ctx, progreso: () => pobre });
  r = Jp.elegir(s('pescador'), 'negocios:comprar');
  ok(r.tipo === 'renglones' && /Te faltan \$97\.000/.test(r.renglones.at(-1)), 'sin plata: te dice cuánto te falta ($97.000)');
  // cerrar el trato
  const tuAmigo = amistad(p, 'pescador', 60, 0).p;
  r = elegir('pescador', 'negocios:cerrar');
  ok(r.tipo === 'renglones' && r.comprado === 'pescaderia' && r.renglones.length === 2 && /otra orilla/.test(r.renglones[0]), 'se cierra: se va a otra orilla');
  eq(pesosDe(p), 398000, 'se pagó $102.000');
  ok(N.esTuyo(p, 'pescaderia') && p.negociosVecinos.comprados.pescaderia.destino === 'se-va', 'es tuyo y Aurelio se fue');
  eq(J._idos(), ['pescador'], 'el juego sabe que Aurelio se fue');
  ok(V.puntosAmistad('pescador', p) === tuAmigo + 4, 'el trato suma amistad (+4)');
  ok(/La pescadería de Aurelio ahora es tuya/.test(notas.at(-1)[0]) && /\$102\.000/.test(notas.at(-1)[1]), 'avisa que es tuyo y cuánto pagaste');
  ok(sonidos.includes('anotar') && barras >= 1 && guardados.length >= 1, 'con su sonido, la barra al día y el guardado');
  r = elegir('pescador', 'negocios:comprar');
  ok(/Ya es tuya/.test(r.renglones[0]), 'si volvés a proponerlo: ya es tuya (la pescadería)');
  // el submenú de un negocio tuyo
  r = elegir('pescador', 'negocios');
  eq(r.sub.opciones.map((o) => o.id), ['negocios:cuentas', 'negocios:vender', 'volver'], 'sin caja todavía: «Cómo viene» y (4.4.3) «Venderle … de vuelta»');
  ok(/es tuya desde el día 10/.test(r.sub.texto) && r.sub.texto.includes(`Rinde unos ${formatoPesos(N.gananciaEstimada('pescaderia', { sinVecino: true }))} por día`), `el texto dice desde cuándo y cuánto rinde (${r.sub.texto.slice(0, 90)})`);
  ok(N.gananciaEstimada('pescaderia', { sinVecino: true }) < N.gananciaBase('pescaderia') && Math.abs(N.gananciaEstimada('almacen') - N.gananciaBase('almacen')) <= 30, 'la estimación: sin Aurelio rinde menos; sin cambios, la ganancia base');
  // los días: aviso y caja
  p.dia = 11; J.actualizar(2);
  const nBefore = notas.length;
  p.dia = 12; J.actualizar(2);
  ok(notas.length === nBefore + 1 && /rindió/.test(notas.at(-1)[0]) && /esperando en las cajas/.test(notas.at(-1)[1]), `un aviso al otro día («${notas.at(-1)[0]}»)`);
  const caja = N.cajaDe(p, 'pescaderia');
  ok(caja > 0, `y hay ${formatoPesos(caja)} en la caja`);
  r = elegir('pescador', 'negocios');
  ok(r.sub.opciones.some((o) => o.id === 'negocios:caja' && o.titulo === `Retirar la caja (${formatoPesos(caja)})`), 'el submenú ofrece retirar la caja con el monto');
  const antesC = pesosDe(p);
  r = elegir('pescador', 'negocios:caja');
  ok(r.tipo === 'renglones' && r.renglones[0].includes(formatoPesos(caja)) && pesosDe(p) === antesC + caja, 'retirar la caja: te la cuenta y la billetera sube');
  r = elegir('pescador', 'negocios:cuentas');
  ok(r.renglones.length >= 3 && /vendieron/.test(r.renglones[0]) && /se fue a otra cosa/.test(r.renglones.join(' ')), 'las cuentas: lo de ayer, el día corriente y que Aurelio se fue');
  // la plaza
  J._fijarRutina();   // (en el juego hay una sola; acá hay varias y la última es la que manda)
  const rutina = (h, ds = 2) => A.rutinaAldea('pescador', h, ds, p.aldea, 12);
  ok(rutina(14).lugar === 'plaza' && rutina(14).edificio === 'plaza' && /^estar-/.test(rutina(14).punto), 'a las 14 Aurelio está en la plaza');
  A.fijarDesvioRutina(null);
  const normal = (h, ds = 2) => A.rutinaAldea('pescador', h, ds, p.aldea, 12);
  const base = { 20: normal(20), 8.5: normal(8.5), 19: normal(19), 9: normal(9), dom: normal(14, 6) };
  J._fijarRutina();
  eq(rutina(20), base[20], 'de noche sigue con su rutina de siempre');
  eq(rutina(8.5), base[8.5], 'antes de las 9, también');
  eq(rutina(19), base[19], 'desde las 19, también');
  eq(rutina(14, 6), base.dom, 'el domingo, también');
  ok(base[9].lugar === 'local' && rutina(9).lugar === 'plaza' && rutina(11).lugar === 'plaza', 'desde las 9 va a la plaza (antes estaba en su local)');
  A.fijarDesvioRutina(null);
  eq(normal(14).lugar, 'trabajo', 'sin el desvío, a las 14 estaba trabajando en la pescadería');
  J._fijarRutina();
  eq(rutina(14).lugar, 'plaza', 'con el desvío, en la plaza');
  ok(A.rutinaAldea('panadera', 14, 2, p.aldea, 12).punto !== undefined, 'los demás siguen igual');
  // sociedad
  amistad(p, 'herrero', 70, 1);
  r = elegir('herrero', 'negocios:socio');
  ok(r.tipo === 'menu' && r.sub.opciones.length === 4 && /Poner \$15\.000 · 9 %/.test(r.sub.opciones[0].titulo), `socio: tres montos y «Pensarlo» (${r.sub.opciones[0].titulo})`);
  ok(/de \$15\.000 a \$60\.000/.test(r.sub.texto), 'con el mínimo y el máximo');
  const antesS = pesosDe(p);
  r = elegir('herrero', `negocios:socio:${N.montosDeAporte('herreria')[0]}`);
  ok(r.tipo === 'renglones' && r.socio === 'herreria' && /9 %/.test(r.renglones[0]) && pesosDe(p) === antesS - 15000, 'poner el mínimo: te dice el porcentaje y se paga');
  ok(/Sos socio de la herrería/.test(notas.at(-1)[0]), 'y avisa');
  r = elegir('herrero', 'negocios');
  ok(r.sub.opciones.map((o) => o.id).join() === 'negocios:cuentas,negocios:aporte,negocios:retiro,negocios:comprar,volver', 'siendo socio: cuentas, sumar plata (4.4.3), retirarte, comprar');
  r = elegir('herrero', 'negocios:retiro');
  ok(r.renglones.length === 2 && r.renglones[1].includes('efectivo el día ' + (p.dia + 2)), 'avisar el retiro: sale en dos días');
  r = elegir('herrero', 'negocios');
  ok(r.sub.opciones.some((o) => o.id === 'negocios:seguir'), 'y se puede seguir de socio');
  r = elegir('herrero', 'negocios:seguir'); ok(/Bueno/.test(r.renglones[0]), 'seguir: Anselmo dice «Bueno. Seguimos entonces.»');
  // socio rechazado
  amistad(p, 'tejedora', 20, 0);
  r = elegir('tejedora', 'negocios:socio');
  ok(r.tipo === 'renglones' && /Aún no nos conocemos/.test(r.renglones[0]), 'alguien que no te conoce no te acepta de socio');
  amistad(p, 'galesa', 90, 0);
  r = elegir('galesa', 'negocios:socio');
  ok(/Tu historia/.test(r.renglones[0]), 'Ceinwen, de amiga, antes quiere que oigas de dónde viene la casa');
  // los que no se pueden preguntar: de desconocido, no cuenta cuánto vende
  amistad(p, 'apicultor', 30, 0);
  r = elegir('apicultor', 'negocios:cuentas');
  ok(/amigos/.test(r.renglones[0]), 'a un desconocido no le cuenta cuánto vende');
  amistad(p, 'apicultor', 60, 0);
  r = elegir('apicultor', 'negocios:cuentas');
  ok(/vendieron/.test(r.renglones[0]), 'a un amigo, sí');
  // el almacén: Ercilia se queda de empleada
  amistad(p, 'ercilia', 160, 3);
  p.economia.pesos = 500000;
  r = elegir('ercilia', 'negocios:comprar');
  ok(r.tipo === 'menu' && r.sub.opciones[0].titulo === 'Cerrar el trato: $150.000', `Ercilia, de compadre con toda su historia (${r.sub.opciones[0].titulo})`);
  ok(/sos de la casa/.test(r.sub.texto) && /llave/.test(r.sub.texto), 'y dice «sos de la casa… ésta es la llave»');
  r = elegir('ercilia', 'negocios:cerrar');
  ok(r.comprado === 'almacen' && r.renglones.length === 2 && /delantal/.test(r.renglones[0]), 'se emociona y se queda de empleada');
  eq(p.negociosVecinos.comprados.almacen.destino, 'queda', 'queda');
  ok(!J._idos().includes('ercilia'), 'y no se va a la plaza');
  // el cartel de turnos del almacén deja de ofrecerse
  eq(E.puedeFichar(p, 'almacen', 3, 16).motivo, 'tuyo', 'ya no se toman turnos en el almacén que es tuyo');
  ok(E.textoNoPodes({ ok: false, motivo: 'tuyo' }, 'almacen').includes('ahora es tuyo'), 'con su explicación');
  ok(E.puedeFichar(p, 'banco-pueblo', 3, 8.6).ok, 'y el banco sigue igual');
  // Lucrecia con romance
  amistad(p, 'moza', 150, 3);
  p.amor = { v: 1 };
  // el gerente
  r = elegir('gerente', 'negocios:resumen');
  ok(r.tipo === 'renglones' && r.renglones[0] === VOZ_GERENTE.intro && r.renglones.some((x) => /sos socio \(/.test(x)) && r.renglones.some((x) => /tuyo, rinde|tuya, rinde/.test(x)), 'el gerente lleva las cuentas: lo tuyo y tus sociedades');
  ok(r.renglones.some((x) => /negocios con dueño/.test(x) && /desde \$/.test(x)), 'y dice cuáles se pueden comprar');
  const vacio = relax(0, 5);
  const Jv = crearNegociosVecinosJuego({ ...ctx, progreso: () => vacio });
  r = Jv.elegir(s('gerente'), 'negocios:resumen');
  ok(r.renglones.includes(VOZ_GERENTE.sinNada), 'sin nada, el gerente explica cómo empezar');
  // el cuaderno
  const pag = J.paginaCuaderno();
  ok(pag.id === 'negocios-vecinos' && pag.nombre === 'Negocios y sociedades' && /negocio/.test(pag.marca) && pag.pendiente === false && typeof pag.dibujar === 'function', 'la página del cuaderno: «Negocios y sociedades»');
  const hojas = [];
  const el = (tag, clase, texto) => { const o = { tag, clase, texto: texto || '', hijos: [], appendChild(x) { o.hijos.push(x); return x; } }; hojas.push(o); return o; };
  const ficha = el('div', '', '');
  pag.dibujar(ficha, el);
  const txt = hojas.map((o) => o.texto).join(' | ');
  ok(/Tuya desde el día 10/.test(txt) && /Socio de la herrería de Anselmo/.test(txt) && /Para comprar o asociarse/.test(txt) && /Últimos movimientos/.test(txt), 'el cuaderno cuenta lo tuyo, tus sociedades, los últimos movimientos y lo que se puede comprar');
  const Jv2 = crearNegociosVecinosJuego({ ...ctx, progreso: () => vacio });
  ok(Jv2.paginaCuaderno().pendiente === true && Jv2.paginaCuaderno().marca === 'sin negocios', 'sin nada, la página queda «pendiente» y explica cómo empezar');
  // el día largo
  p.dia = 100; notas.length = 0; J.actualizar(2);
  ok(notas.length >= 1 && /rindieron|rindió|llenas/.test(notas[0][0]), 'tras muchos días: un solo aviso, no una lluvia');
  ok(/LLENA/.test(notas[0][1]) || /Hay/.test(notas[0][1]), 'y avisa de las cajas llenas');
  // el Desafío
  desafio = true; notas.length = 0; p.dia = 120; J.actualizar(2); eq(notas.length, 0, 'en el Desafío no avisa nada');
  eq(J.elegir(s('panadera'), 'negocios'), { tipo: 'menu' }, 'ni responde');
}

// ---------------------------------------------------------------- 8. lo enganchado
{
  const main = leer('src/main.js');
  ok(main.includes("import { crearNegociosVecinosJuego } from './negocios-vecinos-juego.js';"), 'main.js lo importa');
  ok(/negociosVecinosJuego = crearNegociosVecinosJuego\(/.test(main) && /fallaSistema\('negocios-vecinos-armado'/.test(main), 'main.js lo crea aislado (si falla, la charla sigue)');
  ok(/negocios: negociosVecinosJuego/.test(main), 'se lo pasa a la charla');
  ok(/negociosVecinosJuego\?\.actualizar\(dt\)/.test(main) && /fallaSistema\('negocios-vecinos'/.test(main), 'actualiza con fallaSistema');
  ok(/negociosVecinosJuego\.paginaCuaderno\(\)/.test(main), 'la página del cuaderno');
  const vj = leer('src/vecindad-juego.js');
  ok(vj.includes('ctx.negocios?.opciones?.(s.clave)') && /\^negocios\(\?::\|\$\)/.test(vj) && vj.includes('ctx.negocios.elegir(s, String(id), npc)'), 'vecindad-juego.js: la opción y su elegir');
  const sr = leer('src/social-rueda.js');
  ok(/negocios/.test(sr) && sr.includes("return 'hacer'"), 'social-rueda.js: va en «Hacer juntos»');
  const al = leer('src/aldea.js');
  ok(al.includes('export function fijarDesvioRutina(fn)') && al.includes("desvioRutina(persona, h, ds, dia, t) === 'plaza'"), 'aldea.js: el desvío de la rutina');
  const gu = leer('src/guia.js');
  ok(gu.includes("'Comprar un negocio y ser socio'") && gu.includes('Hablar de su negocio') && gu.includes('$80.000 a $200.000'), 'la guía (F1) lo explica');
  // sin inglés ni mando en lo nuevo
  for (const f of ['src/negocios-vecinos.js', 'src/negocios-vecinos-voces.js', 'src/negocios-vecinos-juego.js', 'src/negocios-vecinos-mundo.js']) {
    const t = leer(f);
    ok(!/\b(the|and|with|your|please|of the)\b/.test(t.replace(/\/\/.*$/gm, '').replace(/'[^']*'/g, '')), `${f}: sin inglés fuera de los nombres`);
    ok(!/gamepad|navigator\.getGamepads|mando/i.test(t.replace(/\/\/.*$/gm, '')), `${f}: sin mando`);
    ok(!/\|\|\s*'escuela'/.test(t), `${f}: nada raro`);
  }
  // la trampa del empaquetador de un solo archivo: un `export const A = 1, B = 2;` sólo conoce el primer nombre
  for (const f of ['src/negocios-vecinos.js', 'src/negocios-vecinos-voces.js', 'src/negocios-vecinos-juego.js', 'src/negocios-vecinos-mundo.js']) {
    ok(!/^export\s+(?:const|let|var)\s+[^=\n]+=[^;\n]*,\s*[A-Za-z_$][\w$]*\s*=/m.test(leer(f).split('\n').filter((l) => /^export (const|let|var) /.test(l) && !/[({[]/.test(l.split('=')[1] || '')).join('\n')), `${f}: sin exports con dos nombres en una línea`);
  }
}

console.log(`verificar-4-4-compra: OK (${n} comprobaciones)`);
