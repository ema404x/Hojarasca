// 2.9 "Vehículos y construcción en grande": manejar la trochita y el comercio entre pueblos.
//  · comercio.js: los bienes, los precios por parada, estación y día (con semilla), el
//    margen que impide ganar en el mismo andén, el cupo del día, los fletes y el saneo;
//  · maquinista.js: el regulador, la presión, los frenos y la inercia de la cabina;
//  · guardado.js: una partida vieja carga sin comercio y lo roto se sanea;
//  · trochita.js, comercio-mundo.js, main.js y la plantilla: los enganches.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as C from '../src/comercio.js';
import * as M from '../src/maquinista.js';
import { ENTRADAS } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ============================================================ 1. los bienes y los pueblos
const MATERIALES = ['tronco', 'tabla', 'piedra', 'cristal', 'lana'];
const idsEntradas = new Set(ENTRADAS.map((e) => e.id));
for (const [id, b] of Object.entries(C.BIENES)) {
  assert.ok(['material', 'entrada', 'cosa'].includes(b.donde), `${id}: de dónde sale`);
  if (b.donde === 'material') assert.ok(MATERIALES.includes(id), `${id} es un material del juego`);
  if (b.donde === 'entrada') assert.ok(idsEntradas.has(id), `${id} está en el cuaderno`);
  assert.ok(Number.isInteger(b.lote) && b.lote >= 1 && b.valor > 0, `${id}: lote y valor`);
  assert.ok(!/ñ/.test(id), `${id}: sin eñe`);
}
for (const k of ['tronco', 'tabla', 'piedra', 'cristal', 'lana', 'trucha-ahumada', 'miel', 'frasco-frutilla', 'huevo', 'poncho']) assert.ok(C.esBien(k), `se comercia ${k}`);
assert.ok(!C.esBien('yerba'), 'la yerba es con lo que se paga, no una carga');
assert.ok(!C.esBien('__proto__') && !C.esBien('constructor') && !C.esBien(undefined));
for (const k of Object.keys(C)) assert.ok(!/ñ/.test(k), `export sin eñe: ${k}`);

const PARADAS = ['Estación del Valle', 'Parada del Mallín', 'Apeadero del Faro', 'Parada Arrayanes', 'Parada Alta', 'Parada del Molino',
  'Apeadero de la Casa de Té', 'Parada del Mirador', 'Apeadero del Pescador', 'Parada del Bosque'];
// los nombres son los que pone trochita.js
const troch = leer('src/trochita.js');
for (const n of PARADAS) assert.ok(troch.includes(`'${n}'`), `trochita.js conoce ${n}`);
for (const n of [...PARADAS, 'Parada Inventada', '__proto__', '']) {
  const b = C.bienesDe(n);
  assert.ok(b.length >= 4 && b.length <= 9, `${n}: entre 4 y 9 cosas (${b.length})`);
  assert.ok(b.every(C.esBien), `${n}: todo se comercia`);
  assert.equal(new Set(b).size, b.length);
  assert.deepEqual(C.bienesDe(n), b, 'siempre las mismas');
  assert.equal(typeof C.perfilDe(n).quien, 'string');
}

// ============================================================ 2. los precios
const TEMP = ['verano', 'otono', 'invierno'];
const vacio = () => C.comercioDeHoy(C.comercioNuevo(), 1);
{
  const c = vacio();
  // deterministas
  assert.deepEqual(C.precios(c, 'Parada Alta', 'piedra', 7, 'verano'), C.precios(vacio(), 'Parada Alta', 'piedra', 7, 'verano'), 'la misma fecha, los mismos precios');
  // lo que se hace en el pueblo, barato; lo que pide, caro
  let barato = 0, caro = 0;
  for (let d = 1; d <= 30; d++) {
    barato += C.valorDe('Parada Alta', 'piedra', d, 'verano');
    caro += C.valorDe('Parada Arrayanes', 'piedra', d, 'verano');
  }
  assert.ok(caro > barato * 1.8, `la piedra de la cantera vale menos que en los arrayanes (${barato.toFixed(1)} vs ${caro.toFixed(1)})`);
  // con la estación
  let inv = 0, ver = 0;
  for (let d = 1; d <= 30; d++) { inv += C.valorDe('Parada del Bosque', 'tronco', d, 'invierno'); ver += C.valorDe('Parada del Bosque', 'tronco', d, 'verano'); }
  assert.ok(inv > ver * 1.4, 'en invierno la leña vale más');
  // con el día: no todos los días igual
  const dias = new Set(); for (let d = 1; d <= 20; d++) dias.add(C.valorDe('Estación del Valle', 'poncho', d, 'verano').toFixed(3));
  assert.ok(dias.size > 10, 'cambia con el día');
  assert.equal(C.valorDe('Estación del Valle', 'poncho', 5, 'primavera'), C.valorDe('Estación del Valle', 'poncho', 5, 'verano'), 'una estación rara cuenta como verano');
  assert.equal(C.precios(c, 'Estación del Valle', 'yerba', 1, 'verano'), null);
}
// comprar y vender en el mismo andén siempre pierde, en todas partes, todo el año
{
  let rutas = 0;
  for (const n of PARADAS) for (const t of TEMP) for (let d = 1; d <= 40; d++) {
    const c = C.comercioDeHoy(C.comercioNuevo(), d);
    for (const b of C.bienesDe(n)) {
      const p = C.precios(c, n, b, d, t);
      assert.ok(Number.isInteger(p.compra) && Number.isInteger(p.venta) && p.venta >= 1, `${n}/${b}: precios enteros`);
      assert.ok(p.compra > p.venta, `${n}/${b}/${t}/${d}: el puesto cobra más de lo que paga (${p.compra} > ${p.venta})`);
    }
  }
  // y llevar de un pueblo a otro sí rinde
  for (const t of TEMP) for (const a of PARADAS) for (const b of PARADAS) {
    if (a === b) continue;
    for (const bien of C.bienesDe(a)) {
      if (!C.bienesDe(b).includes(bien)) continue;
      const pa = C.precios(vacio(), a, bien, 3, t), pb = C.precios(vacio(), b, bien, 3, t);
      if (pb.venta > pa.compra) rutas++;
    }
  }
  assert.ok(rutas >= 20, `hay rutas que dejan ganancia (${rutas})`);
}
// el cupo del día y el corrimiento del precio
{
  const c = vacio();
  const p0 = C.precios(c, 'Parada Alta', 'piedra', 1, 'verano');
  let pagado = 0;
  for (let i = 0; i < C.COMERCIO.lotesPorDia; i++) {
    const r = C.comprar(c, 'Parada Alta', 'piedra', 1, 'verano', 9999);
    assert.ok(r.ok && r.cantidad === C.BIENES.piedra.lote, `lote ${i + 1}`);
    pagado += r.precio;
  }
  assert.ok(pagado > p0.compra * C.COMERCIO.lotesPorDia, 'cada lote sale un poco más caro');
  assert.equal(C.comprar(c, 'Parada Alta', 'piedra', 1, 'verano', 9999).motivo, 'agotado');
  assert.equal(C.comprar(vacio(), 'Parada Alta', 'piedra', 1, 'verano', 0).motivo, 'yerba', 'sin yerba no se compra');
  assert.equal(C.comprar(vacio(), 'Parada Alta', 'poncho', 1, 'verano', 999).motivo, C.bienesDe('Parada Alta').includes('poncho') ? undefined : 'no hay', 'sólo lo que se comercia ahí');
  const v = vacio();
  assert.equal(C.vender(v, 'Parada Arrayanes', 'piedra', 1, 'verano', 3).motivo, 'falta', 'de a lotes');
  const r1 = C.vender(v, 'Parada Arrayanes', 'piedra', 1, 'verano', 40), r2 = C.vender(v, 'Parada Arrayanes', 'piedra', 1, 'verano', 36);
  assert.ok(r1.ok && r2.ok && r2.precio <= r1.precio, 'vender mucho de lo mismo lo abarata');
  assert.equal(v.ganado, r1.precio + r2.precio);
  // otro día, las cuentas del puesto vuelven a cero
  const otro = C.comercioDeHoy(c, 2);
  assert.equal(otro.hoy.dia, 2);
  assert.deepEqual(otro.hoy.comprados, {});
  assert.ok(C.comprar(otro, 'Parada Alta', 'piedra', 2, 'verano', 9999).ok);
}

// ============================================================ 3. los fletes
{
  const est = ['Estación del Valle', 'Parada del Mallín', 'Parada Alta', 'Apeadero del Faro'];
  const f1 = C.fletesDelDia(4, est, 'Parada del Mallín');
  assert.equal(f1.length, 2);
  assert.deepEqual(C.fletesDelDia(4, est, 'Parada del Mallín'), f1, 'los mismos para el mismo día');
  assert.deepEqual(f1.map((f) => f.tipo), ['pasajeros', 'carga']);
  for (const f of f1) {
    assert.ok(f.hasta !== f.desde && est.includes(f.hasta), 'a otra parada');
    assert.ok(f.premio.yerba >= 3, 'paga algo');
    assert.ok(f.cuantos >= 1);
  }
  assert.deepEqual(C.fletesDelDia(4, ['Sola'], 'Sola'), [], 'con una sola parada no hay fletes');
  assert.deepEqual(C.fletesDelDia(4, est, 'Otra'), []);
  assert.equal(C.tramos(est, 'Estación del Valle', 'Parada Alta'), 2);
  assert.equal(C.tramos(est, 'Apeadero del Faro', 'Estación del Valle'), 1, 'siempre para adelante, dando la vuelta');
  // más lejos, más paga
  const lejos = []; for (let d = 1; d < 60; d++) for (const f of C.fletesDelDia(d, est, 'Estación del Valle')) if (f.tipo === 'carga') lejos[C.tramos(est, f.desde, f.hasta)] = f.premio.yerba;
  assert.ok(lejos[3] > lejos[1], 'un flete más largo paga más');

  const c = vacio();
  assert.ok(C.tomarFlete(c, f1[0]).ok);
  assert.equal(C.tomarFlete(c, f1[0]).motivo, 'tomado', 'no dos veces');
  assert.ok(C.tomarFlete(c, f1[1]).ok);
  const otros = C.fletesDelDia(5, est, 'Estación del Valle');
  assert.ok(C.tomarFlete(c, otros[0]).ok);
  assert.equal(C.tomarFlete(c, otros[1]).motivo, 'lleno', `hasta ${C.COMERCIO.fletesALaVez} a la vez`);
  assert.equal(C.tomarFlete(c, { tipo: 'avion' }).motivo, 'no hay');
  const destino = f1[0].hasta;
  const antes = c.fletes.length;
  const listos = C.entregarFletes(c, destino);
  assert.ok(listos.length >= 1 && listos.every((f) => f.hasta === destino), 'se entregan los que iban ahí');
  assert.equal(c.fletes.length, antes - listos.length);
  assert.equal(c.entregas, listos.length);
  assert.deepEqual(C.entregarFletes(c, destino), [], 'y no dos veces');
  assert.ok(C.soltarFlete(c, c.fletes[0].id) && !C.soltarFlete(c, 'nada'));
  // otro día los fletes que llevás siguen, los tomados de hoy no
  const c2 = vacio(); C.tomarFlete(c2, f1[0]);
  const c3 = C.comercioDeHoy(c2, 9);
  assert.equal(c3.fletes.length, 1);
  assert.deepEqual(c3.hoy.tomados, []);
  const t = C.textoFlete(f1[1]);
  assert.ok(t.quien && t.hasta === f1[1].hasta && /yerba/.test(t.paga));
}

// ============================================================ 4. el saneo
{
  const base = C.comercioNuevo();
  for (const basura of [null, undefined, 7, 'x', [], { hoy: 'x', fletes: 'y', ganado: -4, km: 'mucho' },
    { hoy: { dia: '3', vendidos: { 'Parada Alta|piedra': '4', 'Parada Alta|yerba': 3, '__proto__|piedra': 2, 'x|constructor': 1, sola: 3 }, comprados: [], tomados: [1, 'a', {}] },
      fletes: [{ id: 'a', tipo: 'carga', desde: 'A', hasta: 'B', cuantos: 999, premio: { yerba: 1e9, material: { k: 'huevo', n: 3 } } }, { id: 'a', tipo: 'carga', desde: 'A', hasta: 'B' }, { id: 'b', tipo: 'avion', desde: 'A', hasta: 'B' }, { id: 'c', tipo: 'pasajeros', desde: 'A', hasta: 'A' }, null, 'x'] }]) {
    const s = C.sanearComercio(basura);
    assert.equal(JSON.stringify(C.sanearComercio(JSON.parse(JSON.stringify(s)))), JSON.stringify(s), 'el saneo es estable');
    assert.ok(Array.isArray(s.fletes) && s.fletes.length <= C.COMERCIO.fletesALaVez);
    assert.ok(Number.isFinite(s.ganado) && s.ganado >= 0 && Number.isFinite(s.km));
    for (const k of Object.keys(s.hoy.vendidos)) assert.ok(C.esBien(k.split('|')[1]));
  }
  assert.deepEqual(C.sanearComercio(null), base);
  const s = C.sanearComercio({ hoy: { dia: 3, vendidos: { 'Parada Alta|piedra': '4', 'Parada Alta|yerba': 3 } }, fletes: [{ id: 'a', tipo: 'carga', desde: 'A', hasta: 'B', cuantos: 999, premio: { yerba: 1e9, material: { k: 'huevo', n: 3 } } }, { id: 'a', tipo: 'carga', desde: 'A', hasta: 'B' }] });
  assert.deepEqual(s.hoy.vendidos, { 'Parada Alta|piedra': 4 });
  assert.equal(s.fletes.length, 1, 'sin repetidos');
  assert.equal(s.fletes[0].premio.yerba, 99, 'con techo');
  assert.equal(s.fletes[0].premio.material, undefined, 'el premio en material sólo es material');
  assert.equal(s.fletes[0].cuantos, 30);
}

// ============================================================ 5. la cabina
{
  const c = M.cabinaNueva();
  assert.deepEqual(Object.keys(c).sort(), ['freno', 'presion', 'regulador', 'vel']);
  // quieto sin regulador: no se mueve, ni en bajada suave
  for (let i = 0; i < 100; i++) M.pasoCabina(c, 1 / 60, { pendiente: -0.01 });
  assert.equal(c.vel, 0, 'parado y sin vapor, quieto');
  // W: el regulador se abre de a poco y el tren arranca despacio
  M.pasoCabina(c, 0.5, { acelera: true });
  assert.ok(c.regulador > 0 && c.regulador < 0.5, 'el regulador se abre de a poco');
  let t = 0;
  while (c.vel < 6 && t < 60) { M.pasoCabina(c, 1 / 30, { acelera: true }); t += 1 / 30; }
  assert.ok(t > 5 && t < 30, `tarda en tomar velocidad (${t.toFixed(1)} s hasta 21 km/h)`);
  for (let i = 0; i < 3000; i++) M.pasoCabina(c, 1 / 30, { acelera: true });
  assert.ok(c.vel <= M.CABINA.vmax && c.vel > 7, `tiene techo (${c.vel.toFixed(2)} m/s)`);
  assert.ok(c.presion < 0.8, 'exigida, la caldera pierde presión');
  // soltando todo sigue rodando: la inercia
  for (let i = 0; i < 90; i++) M.pasoCabina(c, 1 / 30, {});
  assert.equal(c.regulador, 1, 'el regulador queda donde lo dejaste');
  const libre = { ...c, regulador: 0 }, v0 = libre.vel;
  for (let i = 0; i < 90; i++) M.pasoCabina(libre, 1 / 30, {});
  assert.ok(libre.vel > v0 * 0.6 && libre.vel < v0, `sin vapor sigue rodando (${v0.toFixed(1)} → ${libre.vel.toFixed(1)})`);
  // S: primero cierra, después frena
  M.pasoCabina(c, 0.3, { frena: true });
  assert.ok(c.regulador < 1 && c.regulador > 0 && c.freno === 0, 'S primero cierra el regulador');
  t = 0;
  while (c.vel > 0 && t < 30) { M.pasoCabina(c, 1 / 30, { frena: true }); t += 1 / 30; }
  assert.ok(c.vel === 0 && t < 12, `frena en unos segundos (${t.toFixed(1)} s)`);
  assert.ok(c.freno > 0.9);
  for (let i = 0; i < 60; i++) M.pasoCabina(c, 1 / 30, { frena: true });
  assert.equal(c.vel, 0, 'nunca para atrás');
  // la caldera junta presión parada
  for (let i = 0; i < 600; i++) M.pasoCabina(c, 1 / 30, {});
  assert.ok(c.presion > 0.9 && c.freno === 0, 'parada, la caldera junta presión y los frenos se sueltan');
  // en subida cuesta
  const plano = M.cabinaNueva(), cuesta = M.cabinaNueva();
  for (let i = 0; i < 600; i++) { M.pasoCabina(plano, 1 / 30, { acelera: true }); M.pasoCabina(cuesta, 1 / 30, { acelera: true, pendiente: 0.03 }); }
  assert.ok(cuesta.vel < plano.vel, 'en subida va más despacio');
  // lo raro no rompe
  const raro = { regulador: 'x', freno: NaN, presion: Infinity, vel: -4 };
  M.pasoCabina(raro, 'mucho', { acelera: true, pendiente: 9 });
  assert.ok([raro.regulador, raro.freno, raro.presion, raro.vel].every(Number.isFinite) && raro.vel >= 0);
  assert.equal(M.kmh(10), 36);
  assert.ok(M.enElAnden(0) && M.enElAnden(-M.CABINA.ventana) && !M.enElAnden(M.CABINA.ventana + 1) && !M.enElAnden(undefined));
}

// ============================================================ 6. el guardado
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const G = await import('../src/guardado.js?tren29=' + Date.now());
  const nuevo = G.progresoNuevo();
  assert.deepEqual(nuevo.comercio, C.comercioNuevo(), 'una partida nueva arranca sin comercio');
  // una partida de antes (sin `comercio`) carga
  const vieja = G.progresoNuevo(); delete vieja.comercio; vieja.dia = 9;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  const cargada = G.cargarProgreso();
  assert.ok(cargada && cargada.dia === 9);
  assert.deepEqual(cargada.comercio, C.comercioNuevo());
  // y lo que se guardó vuelve igual; lo roto se sanea
  const conCargas = G.progresoNuevo();
  const c = C.comercioDeHoy(conCargas.comercio, 3);
  C.comprar(c, 'Parada Alta', 'piedra', 3, 'verano', 99);
  C.tomarFlete(c, C.fletesDelDia(3, ['Parada Alta', 'Estación del Valle'], 'Parada Alta')[0]);
  c.km = 1.5;
  assert.ok(G.guardarProgreso(conCargas));
  const vuelta = G.cargarProgreso();
  assert.deepEqual(vuelta.comercio, C.sanearComercio(c), 'el comercio vuelve igual al recargar');
  assert.equal(vuelta.comercio.fletes.length, 1);
  const rota = G.progresoNuevo(); rota.comercio = { hoy: 5, fletes: [{ id: 1 }], ganado: 'mucho' };
  datos.set('hojarasca-v1', JSON.stringify(rota));
  assert.deepEqual(G.cargarProgreso().comercio, C.comercioNuevo(), 'un comercio roto no rompe la partida');
  const g = leer('src/guardado.js');
  assert.match(g, /^import \{ sanearComercio, comercioNuevo \} from '\.\/comercio\.js';$/m);
  assert.ok(g.includes('comercio: sanearComercio(p.comercio),'));
}

// ============================================================ 7. los enganches
{
  // módulos puros: sin three ni DOM
  for (const f of ['src/comercio.js', 'src/maquinista.js']) {
    const t = leer(f);
    assert.ok(!/from 'three'|document\.|window\./.test(t), `${f} es puro`);
    assert.ok(!/^export (async function|function\*)|^export .* from /m.test(t), `${f}: exports que entiende armar.mjs`);
  }
  const mundo = leer('src/comercio-mundo.js');
  assert.ok(!/from 'three'/.test(mundo), 'el panel no usa three');
  assert.match(mundo, /^import \{ BIENES, bienesDe, perfilDe, precios, comprar, vender, comercioDeHoy, fletesDelDia, tomarFlete, soltarFlete, entregarFletes, textoFlete, COMERCIO \} from '\.\/comercio\.js';$/m);
  assert.ok(mundo.includes("BIENES[bien].donde !== 'entrada' || !!P().entradas?.[bien]"), 'lo del cuaderno se compra sólo si ya lo conocés');

  // trochita: la cabina, el puesto y el tren automático intacto
  assert.match(troch, /^import \{ cabinaNueva, pasoCabina, enElAnden, CABINA \} from '\.\/maquinista\.js';$/m);
  for (const k of ['puedeConducir, subirACabina, bajarDeCabina, silbar, puestoCerca, paradaEnVentana', "conduciendo: () => est.conduce", 'cargas: { ...w(puestoX, puestoZ), y: y + 0.6 }']) assert.ok(troch.includes(k), `trochita: ${k}`);
  assert.ok(troch.includes('if (est.conduce) manejar(dt, mundo, cabeza, visible);\n    // 2.3: varado') && troch.includes('    else if (est.varado) {'), 'manejando manda el jugador; si no, el tren de siempre');
  assert.ok(troch.includes('const objetivo = frenando ? Math.max(1.1, falta * 0.13) : est.objetivo;'), 'el tren automático sigue igual');
  assert.ok(troch.includes('if (d > 0 && d <= CABINA.ventana + 0.5) { est.proxima = parada; est.parado = 0; }'), 'al bajarte, el tren automático se arrima al poste y sigue');
  assert.ok(troch.includes('parado: () => est.parado > 0 || paradoEnCabina()'), 'parado en un andén manejando cuenta como parado (llega el correo)');

  // main: la tecla E y el aviso en el mismo orden
  const main = leer('src/main.js');
  assert.match(main, /^import \{ crearPuestoDeCargas \} from '\.\/comercio-mundo\.js';$/m);
  const iE = main.indexOf("case 'KeyE': {"), fE = main.indexOf("case 'Tab':", iE);
  const tecla = main.slice(iE, fE);
  const enE = (t) => { const i = tecla.indexOf(t); assert.ok(i >= 0, `falta en la tecla E: ${t}`); return i; };
  assert.ok(enE('if (enLasCargas()) { puestoCargas.cerrar(); break; }') < enE('if (vecino) { hablar(vecino); break; }'), 'E cierra el puesto antes que nada');
  assert.ok(enE('feriaCerca()) { abrirFeria(); break; }') < enE('puestoDeCargasCerca()) { cargas().abrir(puestoDeCargasCerca()); break; }'));
  assert.ok(enE('puestoDeCargasCerca()) { cargas().abrir') < enE('const c = canteroCerca()'), 'el puesto antes que el cantero');
  assert.ok(enE('if (js.enTren && tren.conduciendo()) { bajarDeLaCabina(); break; }') < enE("if (js.enTren && !tren.parado()) { nota('El tren está andando'"), 'en la cabina E baja antes que lo del pasajero');
  assert.ok(enE('tren.puedeConducir(js)) { subirALaCabina(); break; }') < enE('tren.puedeSubir(js)) { tren.subir(jugador);'), 'la cabina antes que el coche');
  const iA = main.indexOf("let aviso = objetivo ? { tecla: 'E'"), fA = main.indexOf('mostrarAviso(aviso);', iA);
  const aviso = main.slice(iA, fA);
  const enA = (t) => { const i = aviso.indexOf(t); assert.ok(i >= 0, `falta en el aviso: ${t}`); return i; };
  assert.ok(enA("texto: 'Ver la feria'") < enA("texto: 'Comerciar en el puesto de cargas'") && enA("texto: 'Comerciar en el puesto de cargas'") < enA('cacheCantero &&'), 'el aviso del puesto en el mismo lugar que la tecla');
  assert.ok(enA("texto: 'Subir a la cabina y manejar'") < enA("texto: 'Subir a la trochita'"), 'el aviso de la cabina antes que el del coche');
  assert.ok(enA("texto: 'Bajar de la cabina'") > enA("texto: 'Bajar del tren'"), 'en la cabina el aviso dice bajar de la cabina');
  assert.ok(aviso.includes('if (enLasCargas()) aviso = null;'));
  // las otras teclas
  assert.ok(main.includes("if (enLasCargas()) { e.preventDefault(); puestoCargas.pasarModo(e.shiftKey ? -1 : 1); break; }"), 'Tab cambia de modo');
  assert.equal(main.split('if (enLasCargas()) { puestoCargas.elegir(Number(codigo.slice(5)) - 1); break; }').length - 1, 2, 'los números eligen, del 1 al 9');
  assert.ok(main.includes('else if (enLasCargas()) puestoCargas.cerrar();'), 'Escape cierra');
  assert.ok(main.includes("case 'Space': if (js.enTren && tren.conduciendo()) tren.silbar(); break;"), 'Espacio silba en la cabina');
  assert.ok(main.includes("case 'KeyC':") && main.includes('else cargas().abrir(tren.paradaCabina());'), 'C abre el puesto desde la cabina');
  assert.ok(main.includes('if (js.enTren && !charla.npc && !tren.conduciendo()) {'), 'en la cabina W y S no cambian de asiento');
  // el bucle: W y S (o el stick, que aprieta las mismas teclas) al tren; la llegada, el tablero
  assert.ok(main.includes("ctxTren.acelera = modo === 'jugando' && js.enTren && (jugador.teclas.has('KeyW')"));
  assert.ok(main.includes("ctxTren.frena = modo === 'jugando' && js.enTren && (jugador.teclas.has('KeyS')"));
  // con la pausa, un menú o un panel, el tren que manejás se congela (y el automático no)
  assert.ok(main.includes("ctxTren.pausado = js.enTren && tren.conduciendo() && (modo !== 'jugando' || personalAbierto() || enLasCargas() || enElAlmacen || enLaFeria || mochilaAbierta || !!charla.npc || foto.activo);"), 'el tren que manejás se congela con la pausa y los paneles');
  assert.ok(main.includes('estadoTren = tren.actualizar(dt, jugador, camara, ctxTren);\n  actualizarCabina(ctxTren.pausado ? 0 : dt);'));
  assert.ok(troch.includes('    if (est.conduce && mundo?.pausado) dt = 0;\n    const js = jugador.estado;'), 'trochita: sin tiempo mientras está en pausa, sólo manejando');
  assert.ok(main.includes("sostenerTecla('KeyW', m.mov.z > 0.2); sostenerTecla('KeyS', m.mov.z < -0.2);") && main.includes("if (m.recien.saltar) golpeDeTecla('Space');"), 'el mando maneja con el stick y silba con A');
  assert.ok(main.includes("temporada: () => estacionDe({ invierno: U.uInvierno.value, otono: U.uOtono.value }),"), 'los precios con la estación que se ve');
  assert.ok(main.includes('function puestoDeCargasCerca() {\n  if (desafio ||'), 'el comercio sólo en el Relax');
  assert.ok(main.includes('__cargas: () => cargas(), __subirALaCabina: subirALaCabina'), 'la prueba de humo llega al puesto');

  // la plantilla: el panel (como el del almacén) y el tablero
  const html = leer('src/plantilla.html');
  assert.ok(html.includes('<div class="trueque oculto" id="cargas">') && html.includes('<ul id="cargas-lista"></ul>'), 'el panel del puesto');
  assert.ok(html.includes('<div class="cabina oculto" id="cabina"></div>') && html.includes('.cabina-aguja'), 'el tablero de la cabina');

  // la suite
  const pkg = JSON.parse(leer('package.json'));
  assert.ok(pkg.scripts.verify.includes('node pruebas/verificar-2-9-tren.mjs'), 'la prueba está en verify');
}

console.log('OK 2.9 tren: la trochita de maquinista, el comercio entre pueblos, los fletes y el guardado');
