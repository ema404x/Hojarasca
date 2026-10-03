// 3.1 "Modos y progreso": rangos y oficios, y fundar un pueblo.
//  · oficios.js: los niveles, la experiencia, cada habilidad (chica y de verdad), lo que
//    sobra de las obras y rinde la huerta con arrastre de fracciones, el crédito de una
//    partida vieja (una sola vez y con tope) y el saneo;
//  · pueblo.js: cuándo llega alguien, aceptarlo y darle la casa, el nombre y el cartel,
//    la rutina, lo que ofrece cada uno, los avisos para la historia y el saneo. Y lo que
//    NO hay: nadie consume, pasa hambre ni se va;
//  · guardado.js: una partida vieja carga sin oficios ni pueblo, y todo vuelve igual;
//  · main.js, gente.js, pesca.js, kayak.js y desafio.js: los enganches.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as O from '../src/oficios.js';
import * as P from '../src/pueblo.js';
// 3.6: el progreso ya no guarda `pueblo`: guarda la aldea (ver verificar-3-6-aldea.mjs)
import * as A from '../src/aldea.js';
import { ENTRADAS } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ============================================================ 1. los oficios
{
  for (const m of [O, P]) for (const k of Object.keys(m)) assert.ok(!/ñ/.test(k), `export sin eñe: ${k}`);
  assert.deepEqual(O.ORDEN_OFICIOS, ['hachero', 'pescador', 'cazador', 'obrero', 'huertero', 'navegante']);
  assert.ok(!O.esOficio('constructor') && !O.esOficio('__proto__') && !O.esOficio('toString') && !O.esOficio(undefined), 'nada heredado es un oficio');
  for (const id of O.ORDEN_OFICIOS) {
    const o = O.OFICIOS[id];
    assert.equal(o.titulos.length, 5, `${id}: cinco títulos`);
    assert.equal(o.habilidades.length, 5, `${id}: una habilidad por nivel`);
    assert.ok(o.titulos.every((t) => t && t.length < 40) && o.habilidades.every((h) => h.length > 10));
  }
  assert.equal(O.NIVEL_MAX, 5);
  assert.deepEqual([0, 39, 40, 119, 120, 260, 479, 480, 799, 800, 5000].map(O.nivelDe), [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5]);
  assert.equal(O.nivelDe('abc'), 0);
  assert.equal(O.nivelDe(-50), 0);

  // subir de nivel talando
  const of = O.oficiosNuevos();
  assert.equal(of.acreditado, true, 'una partida nueva no tiene nada que acreditar');
  let r;
  for (let i = 0; i < 3; i++) { r = O.sumarXp(of, 'hachero', O.XP.tala); assert.ok(!r.subio); }
  r = O.sumarXp(of, 'hachero', O.XP.tala);
  assert.ok(r.subio && r.nivel === 1 && r.antes === 0, 'al cuarto árbol, aprendiz de hachero');
  assert.equal(r.titulo, 'Aprendiz de hachero');
  assert.match(r.habilidad, /tronco más/);
  assert.equal(O.sumarXp(of, 'nada', 50).subio, false);
  assert.equal(O.sumarXp(of, 'hachero', -30).nivel, 1, 'la experiencia no baja');
  assert.equal(O.sumarXp(of, 'hachero', 'mucho').nivel, 1);
  O.sumarXp(of, 'hachero', 1e9);
  assert.equal(O.nivelOficio(of, 'hachero'), 5, 'con tope, pero llega al máximo');
  assert.ok(O.xpDe(of, 'hachero') <= 99999);
  const e = O.estadoOficio(of, 'hachero');
  assert.equal(e.hasta, null); assert.equal(e.avance, 1); assert.ok(e.habilidades.every((h) => h.tiene));
  const e0 = O.estadoOficio(of, 'pescador');
  assert.equal(e0.nivel, 0); assert.equal(e0.falta, 40); assert.ok(e0.habilidades.every((h) => !h.tiene));
  assert.equal(O.rangoGeneral(of).titulo, 'Maestro hachero');
  assert.equal(O.rangoGeneral(O.oficiosNuevos()).titulo, 'Recién llegado');

  // las habilidades: reales y modestas
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => O.troncosAlTalar(4, n)), [4, 5, 5, 5, 5, 6]);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => O.tablasAMano(2, n)), [2, 2, 3, 3, 3, 3]);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => O.golpesParaTalar(3, n)), [3, 3, 3, 2, 2, 2]);
  assert.equal(O.golpesParaTalar(1, 5), 1, 'nunca menos de un hachazo');
  assert.deepEqual([0, 3, 4].map(O.extraDeMata), [0, 0, 1]);
  const piques = [0, 1, 2, 3, 4, 5].map(O.factorPique);
  assert.equal(piques[0], 1);
  for (let i = 1; i < 6; i++) assert.ok(piques[i] <= piques[i - 1] && piques[i] >= 0.75, 'el pique mejora de a poco, hasta un cuarto');
  assert.ok(O.segundosParaClavar(0) === 1.1 && O.segundosParaClavar(2) > 1.1 && O.segundosParaClavar(5) < 2);
  assert.ok(O.factorLinea(0) === 1 && O.factorLinea(4) < 1 && O.factorLinea(4) >= 0.85);
  const pulsos = [0, 1, 2, 3, 4, 5].map(O.factorPulso);
  assert.ok(pulsos[0] === 1 && pulsos[5] <= 1.25 && pulsos.every((p, i) => !i || p >= pulsos[i - 1]), 'el arco se tensa un poco más rápido, como mucho un cuarto');
  assert.ok(O.radioHuellas(1.8, 1) === 1.8 && O.radioHuellas(1.8, 2) > 1.8 && O.radioHuellas(1.8, 2) < 3);
  assert.ok(O.factorEsperaRastro(3) === 1 && O.factorEsperaRastro(4) === 0.75);
  assert.ok(O.factorRemo(0) === 1 && Math.abs(O.factorRemo(5) - 1.2) < 1e-9);
  assert.equal(O.factorPique(99), O.factorPique(5), 'un nivel imposible se acota');
  assert.equal(O.factorPique('x'), 1);

  // constructor: lo que sobra, con arrastre (un 5% de 4 tablas no se pierde)
  let resto = {}, sobra = 0;
  for (let i = 0; i < 10; i++) { const a = O.ahorroDeObra({ tabla: 4 }, 1, resto); resto = a.resto; sobra += a.devuelve.tabla || 0; }
  assert.equal(sobra, 2, '5% de 40 tablas: sobran dos');
  const grande = O.ahorroDeObra({ piedra: 8, tronco: 4 }, 5, {});
  assert.deepEqual(grande.devuelve, { piedra: 2, tronco: 1 });
  assert.deepEqual(O.ahorroDeObra({ tabla: 16 }, 0, {}).devuelve, {}, 'sin oficio no sobra nada');
  assert.deepEqual(O.ahorroDeObra({ tabla: 1 }, 5, { tabla: 0.99 }).devuelve, {}, 'nunca sobra todo lo pedido');
  assert.ok(O.porcentajeAhorro(5) <= 0.25);
  assert.equal(O.xpDeEtapa({ piedra: 8, tronco: 4 }), O.XP.etapa + 4);
  // huertero: rinde un poco más, también con arrastre
  let rc = 0, extra = 0;
  for (let i = 0; i < 4; i++) { const x = O.extraDeCosecha(3, 1, rc); rc = x.resto; extra += x.extra; }
  assert.equal(extra, 1, 'un 15% de doce: una más');
  assert.equal(O.extraDeCosecha(4, 5, 0).extra, 3);
  assert.equal(O.extraDeCosecha(4, 0, 0).extra, 0);

  // una partida vieja: se acredita lo hecho, una vez y con tope
  const vieja = { talados: Array.from({ length: 60 }, (_, i) => ({ i, dia: 1 })), peces: { arcoiris: { cantidad: 3, record: 40 }, marron: { cantidad: 'x' } },
    rastreos: 2, obras: [{ plano: 'puesto', etapas: 4 }, { plano: 'banco', etapas: 1 }], entradas: { haba: { cantidad: 5 } }, desafio: { abatidos: 10 } };
  const c = O.creditoInicial(vieja);
  assert.equal(c.hachero, O.TOPE_CREDITO, 'sesenta árboles: tope, nadie arranca de maestro');
  assert.equal(c.pescador, 30);
  assert.equal(c.cazador, 10 * O.XP.abatido + 2 * O.XP.rastreo);
  assert.ok(c.obrero > 0 && c.huertero > 0);
  assert.ok(!('navegante' in c));
  assert.deepEqual(O.creditoInicial(null), {});
  const sv = O.sanearOficios(undefined);
  assert.equal(sv.acreditado, false, 'una partida sin oficios se acredita');
  const dado = O.acreditarOficios(sv, vieja);
  assert.equal(O.nivelOficio(sv, 'hachero'), 3);
  assert.equal(O.nivelOficio(sv, 'pescador'), 0);
  assert.ok(sv.acreditado && Object.keys(dado).length > 0);
  assert.deepEqual(O.acreditarOficios(sv, vieja), {}, 'una sola vez');
  assert.equal(O.nivelOficio(sv, 'hachero'), 3);
  // el saneo
  const rotos = O.sanearOficios({ xp: { hachero: '50', pescador: -3, constructor: 900, __proto__: { cazador: 400 }, navegante: Infinity }, resto: { obra: { tabla: 7, oro: 0.5 }, cosecha: 'x' }, metros: 1e9, acreditado: 'si' });
  assert.deepEqual(rotos.xp, { hachero: 50 }, 'sólo oficios de verdad y números');
  assert.deepEqual(rotos.resto, { obra: { tabla: 0.999 }, cosecha: 0 });
  assert.equal(rotos.metros, O.METROS_REMO);
  assert.equal(rotos.acreditado, false);
  for (const basura of [null, 3, 'x', [], { xp: [] }]) assert.doesNotThrow(() => O.sanearOficios(basura));
  assert.deepEqual(O.sanearOficios(JSON.parse(JSON.stringify(of))).xp, of.xp, 'lo guardado vuelve igual');
}

// ============================================================ 2. el pueblo
{
  const dia = 10;
  const entradas = Object.fromEntries(ENTRADAS.slice(0, 12).map((e) => [e.id, { dia: 1, hora: 9, cantidad: 0 }]));
  const partida = () => ({ modo: 'relax', dia, horas: 10, entradas: { ...entradas }, materiales: { tronco: 9 }, cosas: { yerba: 5 }, pueblo: P.puebloNuevo(), personal: {} });
  const casa = (id, x = 10, z = 20) => ({ id: P.claveCasa('puesto', x, z), plano: 'puesto', nombre: id, x, z, rot: 0 });
  assert.equal(P.claveCasa('puesto', 10.04, -3), 'puesto@10.0,-3.0');

  // cuándo puede llegar alguien
  let p = partida();
  let r = P.puedeLlegarPoblador(p, 1);
  assert.ok(r.ok, `con casa y el valle anotado llega alguien (${r.motivo})`);
  assert.equal(r.quien, 'carpintero', 'el primero es el carpintero');
  assert.ok(!P.puedeLlegarPoblador(p, 0).ok && /casa/.test(P.puedeLlegarPoblador(p, 0).motivo), 'sin casa libre no llega nadie');
  assert.ok(!P.puedeLlegarPoblador({ ...p, modo: 'desafio' }, 1).ok, 'en el Desafío no');
  assert.ok(!P.puedeLlegarPoblador(null).ok);
  const pocas = { ...p, entradas: {} };
  r = P.puedeLlegarPoblador(pocas, 1);
  assert.ok(!r.ok && r.faltan === 12, 'con el valle sin anotar todavía no');
  assert.ok(P.llamarPoblador(pocas.pueblo) && P.puedeLlegarPoblador(pocas, 1).ok, 'la historia puede llamar al próximo');
  const sinVecinos = { ...partida(), personal: { partida: { actual: { vecinos: false } } } };
  // (la receta de la partida decide si hay vecinos; con los de fábrica sí hay)
  assert.equal(typeof P.puedeLlegarPoblador(sinVecinos, 1).ok, 'boolean');

  // los avisos para la historia
  const avisos = [];
  const dejar = P.escucharPueblo((a) => avisos.push(a.tipo));
  P.escucharPueblo(() => { throw new Error('un oyente roto'); });
  // llega, se acepta y se queda
  p = partida();
  assert.ok(P.empezarLlegada(p.pueblo, 'carpintero', dia));
  assert.equal(P.empezarLlegada(p.pueblo, 'panadera', dia), null, 'de a uno');
  assert.ok(!P.puedeLlegarPoblador(p, 3).ok, 'con alguien esperando no llega otro');
  const c1 = casa('el puesto');
  const nuevo = P.aceptarPoblador(p.pueblo, c1, dia);
  assert.ok(nuevo && nuevo.clave === 'carpintero' && nuevo.casa.id === c1.id);
  assert.equal(p.pueblo.llegando, null);
  assert.equal(P.aceptarPoblador(p.pueblo, casa('otra', 50, 50), dia), null, 'sin nadie esperando no hay a quién aceptar');
  assert.deepEqual(P.casasLibres([c1, casa('b', 40, 40)], p.pueblo).map((c) => c.nombre), ['b'], 'la casa dada ya no está libre');
  assert.deepEqual(P.casasLibres([{ ...casa('movida', 11.5, 21), id: 'casilla@11.5,21.0' }], p.pueblo), [], 'una casa movida un poco (otra clave) sigue siendo de su dueño');
  assert.ok(!P.puedeLlegarPoblador(p, 1).ok, 'el próximo no llega enseguida');
  assert.ok(!P.puedeLlegarPoblador({ ...p, dia: dia + 2 }, 1).ok, 'y pide más anotaciones');
  const conMas = { ...p, dia: dia + 2, entradas: Object.fromEntries(ENTRADAS.slice(0, 18).map((e) => [e.id, { dia: 1 }])) };
  r = P.puedeLlegarPoblador(conMas, 1);
  assert.ok(r.ok && r.quien === 'panadera', 'después, la panadera');
  P.empezarLlegada(p.pueblo, 'panadera', dia);
  assert.equal(P.aceptarPoblador(p.pueblo, c1, dia), null, 'no se le da una casa ocupada');
  assert.deepEqual(avisos, ['llego', 'asentado', 'llego'], 'la historia se entera de todo (y un oyente roto no frena nada)');
  dejar();

  // el nombre y el cartel
  assert.ok(!P.nombrarPueblo(P.puebloNuevo(), 'Sin gente'), 'sin pobladores no hay pueblo que nombrar');
  assert.ok(!P.nombrarPueblo(p.pueblo, '   '));
  assert.ok(P.nombrarPueblo(p.pueblo, '  Villa   <b>Lenga</b>\u0007 del Sur, un nombre larguísimo ', { x: 1, z: 2, rot: 0.5 }));
  assert.equal(p.pueblo.nombre, 'Villa bLenga/b del Sur, un n');
  assert.deepEqual(p.pueblo.cartel, { x: 1, z: 2, rot: 0.5 });
  const lugar = P.lugarDelCartel([{ x: 0, z: 0 }, { x: 10, z: 0 }], { x: 5, z: 100 });
  assert.ok(Math.abs(lugar.x - 5) < 1e-9 && Math.abs(lugar.z - 9) < 1e-9, 'a la entrada, del lado de la estación');
  assert.equal(P.lugarDelCartel([]), null);

  // la rutina
  assert.deepEqual([3, 6.9, 7, 11, 12.5, 15, 19.5, 22, 23.9].map(P.rutinaPoblador), ['adentro', 'adentro', 'trabajo', 'trabajo', 'plaza', 'trabajo', 'puerta', 'adentro', 'adentro']);
  assert.equal(P.rutinaPoblador(-1), 'adentro');

  // lo que ofrece cada uno
  const q = partida();
  q.pueblo.pobladores = P.ORDEN_POBLADORES.map((k, i) => ({ clave: k, casa: casa(k, i * 10, 0), dia: 1 }));
  let s = P.servicioDe('carpintero', q, dia);
  assert.ok(s.efectos && s.seguir, 'el carpintero ofrece aserrar');
  P.aplicarEfectos(q, s.efectos, dia);
  assert.equal(q.materiales.tronco, 3); assert.equal(q.materiales.tabla, 30, 'seis troncos, treinta tablas');
  assert.ok(!P.servicioDe('carpintero', q, dia).efectos, 'una vez por día');
  assert.ok(P.servicioDe('carpintero', q, dia + 1).efectos, 'al otro día, otra vez');
  s = P.servicioDe('panadera', q, dia);
  P.aplicarEfectos(q, s.efectos, dia);
  assert.equal(q.cosas.yerba, 3); assert.equal(q.entradas['pan-casero'].cantidad, 3);
  q.cosas.yerba = 1;
  assert.ok(!P.servicioDe('panadera', q, dia + 1).efectos, 'sin yerba no hay trato');
  // el herrero: sin hacha, la forja con cantos; después afila
  assert.ok(!P.servicioDe('herrero', q, dia).efectos, 'sin cantos no forja');
  q.entradas.canto = { dia: 1, cantidad: 5 };
  s = P.servicioDe('herrero', q, dia);
  P.aplicarEfectos(q, s.efectos, dia);
  assert.equal(q.cosas.hacha, 1); assert.equal(q.entradas.canto.cantidad, 2);
  s = P.servicioDe('herrero', q, dia);
  P.aplicarEfectos(q, s.efectos, dia);
  assert.equal(q.cosas.tijera, 1, 'después la tijera');
  s = P.servicioDe('herrero', q, dia);
  P.aplicarEfectos(q, s.efectos, dia);
  assert.equal(q.pueblo.afilado, P.SERVICIO.filo, 'y afila el hacha');
  assert.equal(P.golpesConFilo(3, q.pueblo), 2);
  for (let i = 0; i < P.SERVICIO.filo; i++) assert.ok(P.gastarFilo(q.pueblo));
  assert.ok(!P.gastarFilo(q.pueblo)); assert.equal(P.golpesConFilo(3, q.pueblo), 3, 'el filo se gasta');
  // el pescador
  s = P.servicioDe('pescador', q, dia);
  P.aplicarEfectos(q, s.efectos, dia);
  assert.equal(q.materiales.tronco, 1); assert.equal(q.entradas['trucha-fresca'].cantidad, 2);
  // la maestra: lee el cuaderno, da un mandado y lo premia
  s = P.servicioDe('maestra', q, dia);
  P.aplicarEfectos(q, s.efectos, dia);
  const m = q.pueblo.mandado;
  assert.ok(m && !Object.hasOwn(q.entradas, m.id) && P.pendientesDelCuaderno(entradas).some((x) => x.id === m.id), 'manda a buscar algo que falta');
  assert.ok(!P.servicioDe('maestra', q, dia).efectos, 'sin anotarlo, sólo recuerda');
  q.entradas[m.id] = { dia, cantidad: 0 };
  const yerba = q.cosas.yerba;
  s = P.servicioDe('maestra', q, dia);
  P.aplicarEfectos(q, s.efectos, dia);
  assert.equal(q.cosas.yerba, yerba + P.SERVICIO.yerbaMandado); assert.equal(q.pueblo.mandado, null); assert.equal(q.pueblo.mandados, 1);
  assert.deepEqual(P.servicioDe('nadie', q, dia), { partes: [] });

  // nadie consume, pasa hambre ni se va: pasan los días y siguen todos
  for (let d = dia; d < dia + 60; d++) for (const k of P.ORDEN_POBLADORES) { const x = P.servicioDe(k, q, d); if (x.efectos) P.aplicarEfectos(q, x.efectos, d); }
  assert.equal(q.pueblo.pobladores.length, 5, 'el pueblo sólo crece');
  for (const k of Object.keys(P)) assert.ok(!/hambre|irse|seVa|consum|necesidad|abandon/i.test(k), `sin economía de necesidades: ${k}`);
  const fuente = leer('src/pueblo.js') + leer('src/pueblo-mundo.js');
  assert.ok(!/pobladores\.(splice|pop|shift)|pobladores = pobladores\.filter/.test(fuente), 'ningún poblador se saca de la lista');

  // el saneo
  const roto = P.sanearPueblo({ nombre: 42, pobladores: [{ clave: 'carpintero', casa: { id: 'a', x: 1, z: 2 } }, { clave: 'carpintero', casa: { id: 'b', x: 1, z: 2 } }, { clave: '__proto__', casa: { id: 'c', x: 0, z: 0 } }, { clave: 'herrero', casa: { x: 'x' } }, null],
    llegando: { clave: 'carpintero' }, usos: { panadera: 3, toString: 9 }, afilado: 99, mandado: { id: 'no-existe' }, cartel: { x: 5, z: 5 }, ultimaLlegada: -4 });
  assert.equal(roto.pobladores.length, 1, 'uno por oficio y con casa de verdad');
  assert.equal(roto.llegando, null, 'el que ya vive no vuelve a llegar');
  assert.deepEqual(roto.usos, { panadera: 3 });
  assert.equal(roto.afilado, P.SERVICIO.filo); assert.equal(roto.mandado, null); assert.equal(roto.cartel, null, 'sin nombre no hay cartel'); assert.equal(roto.ultimaLlegada, 0);
  for (const basura of [null, 3, 'x', [], { pobladores: 'x' }]) assert.deepEqual(P.sanearPueblo(basura), P.puebloNuevo());
  assert.deepEqual(P.sanearPueblo(JSON.parse(JSON.stringify(q.pueblo))), P.sanearPueblo(q.pueblo), 'lo guardado vuelve igual');
  assert.equal(P.quienLlega(q.pueblo), null, 'ya vinieron todos');
  assert.ok(!P.puedeLlegarPoblador(q, 3).ok);
}

// ============================================================ 3. el guardado
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const G = await import('../src/guardado.js?pueblo31=' + Date.now());
  const nuevo = G.progresoNuevo();
  assert.deepEqual(nuevo.oficios, O.oficiosNuevos(), 'una partida nueva: oficios en cero y ya acreditados');
  // 3.6: una partida nueva lleva la aldea y no el pueblo
  assert.ok(!('pueblo' in nuevo)); assert.deepEqual(nuevo.aldea, A.aldeaNueva());
  const vieja = G.progresoNuevo(); delete vieja.oficios; delete vieja.aldea; vieja.dia = 7;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  const cargada = G.cargarProgreso();
  assert.ok(cargada && cargada.dia === 7, 'una partida de antes de la 3.1 carga');
  assert.equal(cargada.oficios.acreditado, false, 'y se le acreditará lo hecho');
  assert.deepEqual(cargada.aldea, A.aldeaNueva());
  const con = G.progresoNuevo();
  O.sumarXp(con.oficios, 'hachero', 130);
  // 3.6: un pueblo de la 3.1 (sin aldea) se muda a la aldea al cargar
  delete con.aldea; con.pueblo = P.puebloNuevo();
  con.pueblo.pobladores.push({ clave: 'carpintero', casa: { id: 'puesto@1.0,2.0', plano: 'puesto', nombre: 'El Rincón', x: 1, z: 2, rot: 0 }, dia: 3 });
  con.pueblo.nombre = 'Villa Lenga'; con.pueblo.cartel = { x: 4, z: 5, rot: 1 };
  assert.ok(G.guardarProgreso(con));
  const vuelta = G.cargarProgreso();
  assert.equal(O.nivelOficio(vuelta.oficios, 'hachero'), 2, 'los oficios vuelven');
  assert.ok(!('pueblo' in vuelta) && A.localAbierto(vuelta.aldea, 'carpinteria'), 'el pueblo vuelve como aldea, con el local del carpintero abierto');
  const rota = G.progresoNuevo(); rota.oficios = 'x'; rota.aldea = [1, 2];
  datos.set('hojarasca-v1', JSON.stringify(rota));
  const r2 = G.cargarProgreso();
  assert.ok(r2 && r2.aldea.pobladores.length === 0 && typeof r2.oficios.xp === 'object', 'lo roto no rompe la partida');
  const g = leer('src/guardado.js');
  assert.ok(g.includes("import { sanearOficios, oficiosNuevos } from './oficios.js';") && g.includes("import { sanearAldea, aldeaNueva, migrarDesdePueblo } from './aldea.js';"));
  assert.ok(g.includes('oficios: sanearOficios(p.oficios),') && g.includes('aldea: p.aldea !== undefined ? sanearAldea(p.aldea)'));
}

// ============================================================ 4. los enganches
{
  const main = leer('src/main.js');
  for (const imp of ["import { crearOficiosUI } from './oficios-ui.js';", "import { crearPuebloMundo } from './pueblo-mundo.js';"]) assert.ok(main.includes(imp), imp);
  assert.ok(main.includes('armarOficiosYPueblo(esDesafio);'), 'se arman al cargar');
  assert.ok(main.includes("if (modo === 'jugando') actualizarPueblo(dt);"), 'y se actualizan en el bucle');
  // cada acción da su experiencia
  for (const [oficio, xp] of [['hachero', 'tala'], ['hachero', 'mata'], ['hachero', 'aserrar'], ['pescador', 'pez'], ['cazador', 'rastro'], ['cazador', 'rastreo'], ['huertero', 'siembra'], ['huertero', 'cosecha']]) {
    assert.ok(main.includes(`ganarOficio('${oficio}', XP.${xp})`), `${oficio} gana con ${xp}`);
  }
  assert.ok(main.includes("ganarOficio('obrero', xpDeEtapa(r.etapa.pide))"), 'constructor gana con cada etapa');
  assert.ok(main.includes("alAbatir: (a) => ganarOficio('cazador', a?.def?.jefe ? XP.jefe : XP.abatido)"), 'cazador gana en el Desafío');
  // y cada habilidad se aplica donde corresponde
  assert.ok(main.includes('const hacen = golpesParaTalarAhora();') && main.includes('if (golpes < hacen) {'), 'el hachazo menos');
  assert.ok(main.includes("troncosAlTalar(TRONCOS_TALA, nivelDe('hachero'))") && main.includes("tablasAMano(TABLAS_A_MANO, nivelDe('hachero'))") && main.includes("extraDeMata(nivelDe('hachero'))"));
  assert.ok(main.includes('ctxPesca.pique = factorPique(nPesca); ctxPesca.clavar = segundosParaClavar(nPesca); ctxPesca.linea = factorLinea(nPesca);'));
  assert.ok(main.includes('conMateriales((m) => conOficioDeObra(obras.avanzar(obra, m), m))') && main.includes('conMateriales((m) => conOficioDeObra(obras.avanzar(nueva, m), m))'), 'lo que sobra en las dos maneras de construir');
  assert.ok(main.includes("radioHuellas(1.8, nivelDe('cazador'))") && main.includes("factorEsperaRastro(nivelDe('cazador'))") && main.includes("pulso: () => factorPulso(nivelDe('cazador'))"));
  assert.ok(main.includes("kayak.est.brazo = factorRemo(nivelDe('navegante'))"));
  const pesca = leer('src/pesca.js'), kayak = leer('src/kayak.js'), des = leer('src/desafio.js'), gente = leer('src/gente.js');
  assert.ok(pesca.includes('if (mundo.pique) espera *= mundo.pique;') && pesca.includes('est.t > (mundo.clavar || 1.1)') && pesca.includes('* (mundo.linea || 1)'));
  assert.ok(kayak.includes('est.vel += empuje * dt * 1.6 * (est.brazo || 1);'));
  assert.ok(des.includes("factorTension(seg * (ctx.pulso?.() || 1))") && des.includes('ctx.alAbatir?.(a);'));
  // el pueblo usa la gente de siempre y la charla de siempre
  assert.ok(gente.includes('function agregarPoblador(def)') && gente.includes('return { gente, cerca, actualizar, guarda, ubicarGuarda, agregarPoblador };'));
  assert.ok(main.includes('const dePueblo = npc.poblador && pueblo ? pueblo.charla(npc) : null;'));
  assert.ok(main.includes('if (charla.historia?.alTerminar && charla.parte === charla.historia.partes.length) charla.historia.alTerminar();'));
  assert.ok(main.includes("pestanas.push(['oficios', desafio ? 'Oficios' : 'Oficios y pueblo']);"), 'la pestaña del cuaderno');
  // los módulos puros no importan three ni tocan el DOM
  for (const f of ['src/oficios.js', 'src/pueblo.js']) {
    const t = leer(f);
    assert.ok(!/from 'three'|document\.|window\./.test(t), `${f} es puro`);
  }
  assert.ok(!/from 'three'/.test(leer('src/oficios-ui.js')), 'oficios-ui.js no usa three');
  // armar.mjs: los imports en una línea, sin `export … from`
  for (const f of ['src/oficios.js', 'src/pueblo.js', 'src/oficios-ui.js', 'src/pueblo-mundo.js']) {
    const t = leer(f);
    assert.ok(!/^export\s+(async\s+function|function\*|\*|.*\sfrom\s)/m.test(t) && !/^import\s+'/m.test(t), `${f}: lo que entiende armar.mjs`);
  }
  // no es un modo aparte: es parte del Relax
  assert.ok(!/modo pueblo|modoPueblo/i.test(main + leer('src/pueblo-mundo.js')), 'no hay «modo pueblo»');
}

console.log('OK 3.1 pueblo: rangos y oficios (6 oficios, 5 niveles, habilidades modestas, crédito de partidas viejas) y fundar un pueblo (5 pobladores, llegada en tren, servicios, nombre y cartel)');
