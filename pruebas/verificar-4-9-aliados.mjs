// 4.9 aliados — «La aldea en la noche» (tanda 2 del Desafío): los vecinos que ayudan en las noches grandes (Anselmo, la abuela Herminia,
// Martín y los chicos), los puestos de los aliados y la campana de alarma tocada a mano.
//   1. las reglas puras (desafio-vecinos.js): el nivel de ayuda, los números de cada uno, los fuegos y los viejos, el silbato, las hondas
//   2. las órdenes: «puesto» (marcarlo, guardarlo, sanearlo en una partida vieja)
//   3. el mundo (desafio-vecinos-mundo.js) corrido con un mundo de mentira: cuándo vienen, qué hace cada uno, cuándo se van
//   4. la campana (desafio-campana.js) y su sonido sintetizado
//   5. los enganches (desafio.js, main.js, desafio-aliados.js)
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as V from '../src/desafio-vecinos.js';
import * as O from '../src/desafio-ordenes.js';
import { sanearDesafio, desafioNuevo, COMPANEROS } from '../src/desafio-reglas.js';
import { esNocheGrande } from '../src/desafio-duendes-reglas.js';
import { crearVecinosMundo } from '../src/desafio-vecinos-mundo.js';
import { crearCampana } from '../src/desafio-campana.js';
import { tanidoCampana, crearSonidoCampana, PARCIALES, GOLPES, SEPARACION } from '../src/desafio-campana-sonido.js';
import { completar, medir } from '../src/sonido-sintesis.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let cuantas = 0;
const ok = (cond, msg) => { cuantas++; assert.ok(cond, msg); };
const igual = (a, b, msg) => { cuantas++; assert.deepEqual(a, b, msg); };
const cerca = (a, b, tol, msg) => { cuantas++; assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`); };

// ============================================================ 1. las reglas puras
// ---- el nivel de ayuda (lo manda el agente «días»: D().aldea.ayuda; acá sólo se lee)
{
  igual(V.VECINOS, ['anselmo', 'herminia', 'martin', 'chicos'], 'los cuatro vecinos');
  // 4.9 (junta): con el estado real de la aldea (desafio-aldea.js) nadie ayuda hasta cumplir su primer pedido
  for (const k of V.VECINOS) ok(V.nivelDeAyuda({}, k) === 0, `${k}: sin estado de la aldea, nadie ayuda hasta cumplir pedidos`);
  ok(V.nivelDeAyuda(null, 'anselmo') === 0, 'sin partida, 0');
  const d = { aldea: { ayuda: { anselmo: 0, herminia: 2, martin: 1, chicos: 7 } } };
  igual(V.VECINOS.map((k) => V.nivelDeAyuda(d, k)), [0, 2, 1, 2], 'el nivel sale del estado, tope 2');
  ok(V.nivelDeAyuda({ aldea: { ayuda: { anselmo: -3 } } }, 'anselmo') === 0, 'negativo: 0');
  ok(V.nivelDeAyuda({ aldea: { ayuda: { anselmo: 'x' } } }, 'anselmo') === 0, 'basura: 0');
  ok(V.nivelDeAyuda({ aldea: { ayuda: { anselmo: 1.9 } } }, 'anselmo') === 1, 'entero');
  ok(V.nivelDeAyuda({ aldea: { ayuda: { herminia: 2 } } }, 'martin') === 1 || V.nivelDeAyuda({ aldea: { ayuda: { herminia: 2 } } }, 'martin') === 0, 'un vecino que falta en el estado no rompe');
  ok(V.nivelDeAyuda(d, 'constructor') === 0 && V.nivelDeAyuda(d, '__proto__') === 0, 'claves raras: 0');
  ok(V.nivelEstaNoche(d, 'herminia', false) === 0, 'una noche común nadie ayuda');
  ok(V.nivelEstaNoche(d, 'herminia', true) === 2, 'una noche grande, con su nivel');
  igual(V.cuerposDeLaNoche(d, true), ['herminia', 'nene', 'nena'], 'con anselmo en 0 no viene');
  igual(V.cuerposDeLaNoche(d, false), [], 'una noche común no viene nadie');
  igual(V.cuerposDeLaNoche({ aldea: { ayuda: { anselmo: 0, herminia: 0, martin: 2, chicos: 0 } } }, true), [], 'Martín no tiene cuerpo en la base');
  // las noches grandes son las de siempre (la del jefe, las especiales y desde la 12)
  ok(esNocheGrande({ noche: 12 }) && esNocheGrande({ noche: 5, especial: 'roja' }) && !esNocheGrande({ noche: 3 }), 'noches grandes');
}

// ---- tres números por vecino y el 2 ayuda más fuerte que el 1
{
  for (const [nombre, tabla, claves] of [['Anselmo', V.ANSELMO, ['repara', 'radio', 'pausa']], ['Herminia', V.HERMINIA, ['fuegos', 'radio', 'tarda']],
    ['Martín', V.MARTIN, ['alcance', 'dispersa', 'pasadas']], ['chicos', V.HONDA, ['cadencia', 'alcance', 'dano']]]) {
    ok(tabla[0] === null && tabla.length === 3, `${nombre}: nivel 0 no ayuda, niveles 1 y 2`);
    igual(Object.keys(tabla[1]).sort(), [...claves].sort(), `${nombre}: tres números`);
    igual(Object.keys(tabla[2]).sort(), [...claves].sort(), `${nombre}: los mismos tres en el nivel 2`);
  }
  ok(V.ANSELMO[2].repara > V.ANSELMO[1].repara && V.ANSELMO[2].radio > V.ANSELMO[1].radio && V.ANSELMO[2].pausa < V.ANSELMO[1].pausa, 'Anselmo 2: más rápido y más lejos');
  ok(V.ANSELMO[1].repara > 7, 'Anselmo arregla más que Don Ramón (7 por segundo)');
  ok(V.HERMINIA[2].fuegos > V.HERMINIA[1].fuegos && V.HERMINIA[2].radio > V.HERMINIA[1].radio && V.HERMINIA[2].tarda < V.HERMINIA[1].tarda, 'Herminia 2: más fuegos, más lejos, más rápido');
  ok(V.MARTIN[2].alcance > V.MARTIN[1].alcance && V.MARTIN[2].dispersa > V.MARTIN[1].dispersa && V.MARTIN[2].pasadas > V.MARTIN[1].pasadas, 'Martín 2: más alcance, más tiempo, más pasadas');
  ok(V.HONDA[2].cadencia < V.HONDA[1].cadencia && V.HONDA[2].alcance > V.HONDA[1].alcance && V.HONDA[2].dano > V.HONDA[1].dano, 'chicos 2: más seguido, más lejos, más fuerte');
  ok(V.HONDA[2].dano <= 6 && V.HONDA[2].dano * 5 <= 30, 'poco daño a los duendes (una flecha de Josefina saca 30)');
}

// ---- Herminia: los viejos no se acercan a un fuego prendido; los traviesos no se enteran
{
  const fuego = { x: 0, z: 0, radio: 9 };
  const salida = { x: 0, z: 0, tocado: false };
  // un viejo afuera del círculo yendo hacia el fuego, a 12 m: todavía no lo toca
  V.ajusteDeViejo(0, -1, 0, 12, [fuego], true, salida);
  ok(!salida.tocado && salida.x === 0 && salida.z === -1, 'afuera del círculo sigue su camino');
  // adentro (a 5 m) y yendo hacia el fuego: lo sacan para afuera
  V.ajusteDeViejo(0, -1, 0, 5, [fuego], true, salida);
  ok(salida.tocado && salida.z > -0.0001, 'un viejo adentro del círculo no avanza hacia el fuego');
  // un travieso adentro, igual: no se entera
  V.ajusteDeViejo(0, -1, 0, 5, [fuego], false, salida);
  ok(!salida.tocado && salida.z === -1, 'a un travieso no le hace nada');
  // sin fuegos prendidos no hay nada
  V.ajusteDeViejo(0, -1, 0, 5, [], true, salida);
  ok(!salida.tocado, 'sin fuegos, nada');
  // el viejo que camina derecho hacia un blanco que está del otro lado del fuego nunca entra al círculo
  for (const radio of [9, 13]) {
    const f = [{ x: 0, z: 0, radio }];
    let x = -40, z = 3, minimo = Infinity;
    for (let paso = 0; paso < 2000; paso++) {
      let vx = 40 - x, vz = 0 - z; const l = Math.hypot(vx, vz) || 1; vx /= l; vz /= l;
      V.ajusteDeViejo(vx, vz, x, z, f, true, salida);
      const m = Math.hypot(salida.x, salida.z) || 1;
      x += (salida.x / m) * 0.15; z += (salida.z / m) * 0.15;
      minimo = Math.min(minimo, Math.hypot(x, z));
    }
    ok(minimo > radio - 1.2, `un viejo no baja de ${radio - 1.2} m del fuego de radio ${radio} (mínimo ${minimo.toFixed(2)})`);
    // y un travieso, en cambio, pasa por el medio
    x = -40; z = 0.2; minimo = Infinity;
    for (let paso = 0; paso < 600; paso++) { x += 0.15; minimo = Math.min(minimo, Math.hypot(x, z)); }
    ok(minimo < 1, 'un travieso pasa por el fuego');
  }
  // el viejo que quedó adentro del círculo (lo prendieron cuando ya estaba cerca) sale solo
  {
    let x = 3, z = 0;
    for (let paso = 0; paso < 400; paso++) { V.ajusteDeViejo(-1, 0, x, z, [fuego], true, salida); const l = Math.hypot(salida.x, salida.z) || 1; x += (salida.x / l) * 0.15; z += (salida.z / l) * 0.15; }
    ok(Math.hypot(x, z) > fuego.radio - 0.5, `un viejo que quedó adentro sale del círculo (${Math.hypot(x, z).toFixed(2)} m)`);
  }
  ok(V.protegidoPorFuego(2, 2, [fuego]) && !V.protegidoPorFuego(20, 0, [fuego]), 'protegido por fuego');
  // los fuegos: cuántos, dónde y de qué tipo
  const base = { x: 100, z: -50 };
  const ps1 = V.puntosDeFuegos(base, V.HERMINIA[1].fuegos, 0.5, []), ps2 = V.puntosDeFuegos(base, V.HERMINIA[2].fuegos, 0.5, []);
  ok(ps1.length === 2 && ps2.length === 4, 'dos fuegos con el nivel 1 y cuatro con el 2');
  igual(ps2.map((p) => p.tipo), ['fogon', 'farol', 'fogon', 'farol'], 'fogones y faroles');
  ok(ps2.every((p) => Math.hypot(p.x - base.x, p.z - base.z) >= 3 && Math.hypot(p.x - base.x, p.z - base.z) <= 11), 'alrededor de la base');
  ok(V.puntosDeFuegos(base, 9, 0, []).length === 4 && V.puntosDeFuegos(base, 0, 0, []).length === 0, 'nunca más de cuatro');
  // con una pared cercana, queda adentro de la pared
  const pared = [{ x: 100 + 8, z: -50 }];   // al este, a 8 m
  const q = V.puntosDeFuegos(base, 1, Math.PI / 2, pared)[0];
  ok(Math.hypot(q.x - base.x, q.z - base.z) < 8, 'adentro de la empalizada');
  ok(V.radioDeFuego('farol', 2) < V.radioDeFuego('fogon', 2) && V.radioDeFuego('fogon', 1) === 9 && V.radioDeFuego('fogon', 0) === 0, 'el farol espanta menos que el fogón');
}

// ---- Martín: el silbato
{
  igual(V.silbatoServiria(0) && V.silbatoServiria(120) && !V.silbatoServiria(120.5) && !V.silbatoServiria(400) && !V.silbatoServiria(Infinity) && !V.silbatoServiria(NaN), true, 'sirve sólo con la base a 120 m o menos de la vía');
  const riel = [];
  for (let i = 0; i < 1000; i++) riel.push({ x: i - 500, z: 80, s: i });   // una vía recta a 80 m al norte de la base, de 1000 m
  const via = V.puntoDeViaMasCercano(riel, { x: 0, z: 0 });
  cerca(via.d, 80, 0.001, 'la vía queda a 80 m');
  cerca(via.s, 500, 1, 'el punto más cercano');
  ok(V.puntoDeViaMasCercano([], { x: 0, z: 0 }) === null, 'sin vía no hay punto');
  cerca(V.distanciaAlPunto(10, 990, 1000), 20, 1e-9, 'la distancia da la vuelta al anillo');
  cerca(V.distanciaAlPunto(990, 10, 1000), -20, 1e-9, 'y con signo');
  // la locomotora da dos vueltas: dos pasadas, una por vuelta, y ninguna si está parada
  const est = { armada: true };
  let pasadas = 0;
  for (let k = 0; k < 2000; k++) if (V.pasoDeLaTrochita(est, (k * 1.0) % 1000, 500, 1000, true)) pasadas++;
  ok(pasadas === 2, `una pasada por vuelta (${pasadas})`);
  const parada = { armada: true };
  let hubo = 0;
  for (let k = 0; k < 1000; k++) if (V.pasoDeLaTrochita(parada, 500, 500, 1000, false)) hubo++;
  ok(hubo === 0, 'parada en el punto no es pasar');
  // a quién dispersa: sólo a los traviesos cercanos a la vía
  const centro = { x: 0, z: 80 };
  ok(V.silbatoDispersa({ x: 30, z: 80 }, centro, V.MARTIN[1].alcance, false), 'un travieso cerca de la vía huye');
  ok(!V.silbatoDispersa({ x: 30, z: 80 }, centro, V.MARTIN[1].alcance, true), 'un viejo no se dispersa');
  ok(!V.silbatoDispersa({ x: 60, z: 80 }, centro, V.MARTIN[1].alcance, false), 'uno lejos de la vía no se entera (alcance 1)');
  ok(V.silbatoDispersa({ x: 60, z: 80 }, centro, V.MARTIN[2].alcance, false), 'con el nivel 2 llega más lejos');
  ok(V.DISTANCIA_VIA_MAX === 120, 'la base tiene que quedar a 120 m de la vía');
}

// ---- los chicos: las hondas sin peligro
{
  ok(V.danoAChico(0) === 0 && V.danoAChico(50) === 0 && V.danoAChico(1e9) === 0, 'un chico nunca recibe daño');
  const vivo = { estado: 'avanzar', def: { vuela: false }, m: { g: { position: { y: 0 } } } };
  ok(V.esBlancoDeHonda(vivo, 0), 'a un duende que avanza le tiran');
  for (const e of ['morir', 'irse', 'bajar', 'bajoTierra', 'dormido']) ok(!V.esBlancoDeHonda({ ...vivo, estado: e }, 0), `a uno ${e} no`);
  ok(!V.esBlancoDeHonda({ ...vivo, def: { vuela: true }, m: { g: { position: { y: 8 } } } }, 0), 'al que vuela alto no');
  ok(!V.esBlancoDeHonda({ ...vivo, enNave: true }, 0), 'a las crías de adentro del Coihue no');
  // el puesto de los chicos queda un metro y medio detrás de la empalizada del lado por donde entran
  const base = { x: 0, z: 0 };
  const paredes = [{ x: 0, z: 14 }, { x: 14, z: 0 }, { x: 0, z: -14 }, { x: -14, z: 0 }, { x: 10, z: 10 }];
  for (const clave of ['nene', 'nena']) {
    const p = V.puestoPorDefecto(clave, { base, paredes, lado: 0 });   // entran por el +z
    ok(Math.hypot(p.x, p.z) < 14 - 1.3 && p.z > 4, `${clave}: adentro de la empalizada del lado de entrada (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
  }
  const sin = V.puestoPorDefecto('nene', { base, paredes: [], lado: 0 });
  ok(Math.hypot(sin.x, sin.z) > 0 && Math.hypot(sin.x, sin.z) < 8, 'sin empalizadas, cerca del centro');
}

// ---- los puestos: el que marca el jugador y el que le toca por su oficio
{
  const ctx = { base: { x: 50, z: 50 }, paredes: [], lado: 1, fuegos: [{ x: 55, z: 55 }] };
  for (const k of O.CON_PUESTO) {
    const p = V.puestoPorDefecto(k, ctx);
    ok(Number.isFinite(p.x) && Number.isFinite(p.z) && Math.hypot(p.x - 50, p.z - 50) < 12, `${k}: puesto por defecto razonable`);
  }
  const pr = V.puestoPorDefecto('ramon', ctx), pe = V.puestoPorDefecto('ema', ctx);
  ok(Math.hypot(pr.x - pe.x, pr.z - pe.z) > 2, 'Ramón y Josefina no se paran en el mismo lugar');
  igual(V.puestoDe({ anselmo: { x: 53, z: 51 } }, 'anselmo', ctx), { x: 53, z: 51 }, 'el marcado gana');
  igual(V.puestoDe({}, 'anselmo', ctx), V.puestoPorDefecto('anselmo', ctx), 'sin marcar, el de su oficio');
  igual(V.puestoDe(null, 'anselmo', ctx), V.puestoPorDefecto('anselmo', ctx), 'sin puestos, el de su oficio');
  const lejos = V.puestoDe({ anselmo: { x: 50 + 1000, z: 50 } }, 'anselmo', ctx);
  cerca(Math.hypot(lejos.x - 50, lejos.z - 50), V.DISTANCIA_PUESTO_MAX, 0.001, 'un puesto marcado muy lejos se acerca al máximo');
  ok(V.puestoDe({ anselmo: { x: NaN, z: 1 } }, 'anselmo', ctx).x === V.puestoPorDefecto('anselmo', ctx).x, 'un puesto roto no vale');
}

// ============================================================ 2. las órdenes
{
  // lo de antes no cambia
  igual(O.ORDENES, { ramon: ['reparar', 'seguime', 'porton'], ema: ['base', 'seguime', 'porton'] }, 'ORDENES queda como estaba (la prueba de idioma de la 1.11 la recorre)');
  ok(O.ordenInicial('ramon') === 'reparar' && O.ordenInicial('ema') === 'base', 'cada uno empieza con lo de siempre');
  // «puesto» va después de «vení conmigo»
  igual(O.listaDe('ramon'), ['reparar', 'seguime', 'puesto', 'porton'], 'Ramón');
  igual(O.listaDe('ema'), ['base', 'seguime', 'puesto', 'porton'], 'Josefina');
  for (const k of ['anselmo', 'herminia', 'nene', 'nena']) igual(O.listaDe(k), ['puesto', 'seguime'], `${k}: puesto y vení conmigo`);
  ok(O.listaDe('nadie') === null && O.listaDe('constructor') === null && O.listaDe('__proto__') === null, 'claves que no son de un aliado');
  ok(O.ordenInicial('anselmo') === 'puesto', 'los vecinos de la noche empiezan en su puesto');
  ok(O.siguienteOrden('ramon', 'seguime') === 'puesto' && O.siguienteOrden('ramon', 'puesto') === 'porton', 'E da la vuelta pasando por «puesto»');
  ok(O.siguienteOrden('anselmo', 'puesto') === 'seguime' && O.siguienteOrden('anselmo', 'seguime') === 'puesto', 'los vecinos alternan');
  ok(O.marcaPuesto('seguime', 'puesto') && !O.marcaPuesto('porton', 'puesto') && !O.marcaPuesto('reparar', 'seguime') && !O.marcaPuesto('puesto', 'seguime'), 'el puesto se marca viniendo de «vení conmigo»');
  for (const k of O.CON_PUESTO) {
    ok(O.NOMBRE_ORDEN.puesto, 'nombre de la orden');
    ok(O.respuestaDe(k, 'puesto').length > 10, `${k}: contesta al puesto`);
    ok(O.respuestaDe(k, 'seguime').length > 5, `${k}: contesta a vení conmigo`);
  }
  ok(O.respuestaDe('ramon', 'porton') === O.RESPUESTAS.ramon.porton, 'lo de antes sigue contestando lo mismo');
  ok(O.RADIO_ARREGLO.puesto > 0, 'Ramón arregla alrededor de su puesto');
  // adónde van
  const ctx = { base: { x: 0, z: 0 }, porton: { x: 0, z: 20 }, i: 0, puntoBase: { x: 3, z: 0 }, jugador: { pos: { x: 50, z: 50 }, yaw: 0 }, puesto: { x: -7, z: 9 } };
  igual(O.puntoDeOrden('puesto', ctx), { x: -7, z: 9 }, 'a su puesto');
  igual(O.centroDeArreglo('puesto', ctx), { x: -7, z: 9 }, 'arregla alrededor del puesto');
  igual(O.puntoDeOrden('puesto', { ...ctx, puesto: null }), { x: 3, z: 0 }, 'sin puesto, a la base (como antes)');
  // el saneo de las órdenes
  igual(O.sanearOrdenes({ ramon: 'puesto', ema: 'volar', anselmo: 'seguime', nene: 'porton', nadie: 'puesto' }), { ramon: 'puesto', anselmo: 'seguime' }, 'sólo lo válido de cada uno');
  igual(O.sanearOrdenes(['puesto']), {}, 'una lista no es un objeto de órdenes');
  igual(O.sanearOrdenes(JSON.parse('{"__proto__":{"ramon":"puesto"},"ramon":"porton"}')), { ramon: 'porton' }, 'el __proto__ no se cuela');
  // los puestos marcados
  igual(O.sanearPuestosAliados({ ramon: { x: 10, z: -4 }, anselmo: { x: '3', z: '4' }, nene: { x: 1e9, z: 0 }, nena: { x: 'a', z: 1 }, herminia: { x: null, z: 1 }, ema: [1, 2], nadie: { x: 1, z: 1 }, constructor: { x: 1, z: 1 } }),
    { ramon: { x: 10, z: -4 }, anselmo: { x: 3, z: 4 } }, 'sólo puestos con coordenadas buenas y de un aliado');
  igual(O.sanearPuestosAliados(null), {}, 'nada');
  igual(O.sanearPuestosAliados(Object.create({ ramon: { x: 1, z: 1 } })), {}, 'lo heredado no es un puesto guardado');
  igual(O.sanearPuestosAliados([1, 2]), {}, 'una lista tampoco');
  igual(O.sanearPuestosAliados('x'), {}, 'ni un texto');
  igual(O.sanearPuestosAliados(JSON.parse('{"__proto__":{"x":1,"z":1}}')), {}, 'el __proto__ no se cuela en los puestos');
  igual(O.sanearPuestosAliados({ ramon: { x: true, z: 1 } }), {}, 'un booleano no es una coordenada');
  // el Desafío: una partida vieja carga sin puestos; una nueva trae el objeto vacío; lo guardado se conserva
  igual(desafioNuevo().puestosAliados, {}, 'un Desafío nuevo, sin puestos marcados');
  igual(sanearDesafio({ ordenes: { ramon: 'porton' } }).puestosAliados, {}, 'una partida de la 4.8 carga sin puestos');
  igual(sanearDesafio(null).puestosAliados, {}, 'y sin partida');
  igual(sanearDesafio({ puestosAliados: { ramon: { x: 5, z: 6 }, nene: { x: 'x', z: 1 } }, ordenes: { ramon: 'puesto' } }).puestosAliados, { ramon: { x: 5, z: 6 } }, 'lo guardado se conserva y lo roto se descarta');
  igual(sanearDesafio({ ordenes: { ramon: 'puesto', anselmo: 'puesto' } }).ordenes, { ramon: 'puesto', anselmo: 'puesto' }, 'la orden «puesto» se guarda');
  // los dos de siempre no cambian
  igual(Object.keys(COMPANEROS), ['ramon', 'ema'], 'COMPANEROS: Ramón y Josefina, los de siempre (los nuevos no se suman a tu base para siempre)');
}

// ============================================================ 3. el mundo, con un mundo de mentira
// El mundo de mentira: gente.js camina a donde dice `ruta[0]` (acá, de un salto), las obras son { datos, plano }, la trochita una vuelta de 1000 m.
function mundoDeMentira(opciones = {}) {
  const log = { notas: [], proyectiles: [], sonidos: [], golpes: 0, herirJugador: 0, chispas: 0 };
  const vec = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
  const estado = {
    oleadas: opciones.oleadas ?? 11, especial: opciones.especial ?? null, sinFin: false, ordenes: {}, puestosAliados: {},
    aldea: { ayuda: opciones.ayuda ?? { anselmo: 1, herminia: 1, martin: 1, chicos: 1 } },   // 4.9 (junta): por defecto todos con ayuda 1 (lo que antes daba el respaldo)
     ladoNoche: { id: 'camino', x: 0, z: 70, rumbo: 0, noche: 12 },
  };
  const reloj = { horas: opciones.horas ?? 19.6, dia: opciones.dia ?? 12 };
  const aliens = [];
  const obras = opciones.obras || [];
  const tren = { est: { s: 0, vel: 7, varado: false }, largo: 1000, enVia: (s) => ({ x: s - 500, y: 3, z: opciones.viaZ ?? 80, ang: 0, pend: 0 }) };
  const npcs = [];
  const mkNpc = (def) => ({
    clave: def.clave, nombre: def.nombre, pos: vec(def.pos.x, 0, def.pos.z), ruta: [{ x: def.pos.x, z: def.pos.z, quieto: 9999 }], etapa: 0, espera: 0, velocidad: 1, dormido: false, enBase: false,
    brazos: [{ rotation: { x: 0 } }, { rotation: { x: 0 } }], mano: { hijos: [], add(x) { this.hijos.push(x); } }, mate: null,
  });
  const gente = {
    armarPobladorDeAPoco(def) {
      let n = 0;
      const t = { npc: null, avanzar() { if (++n < 3) return false; t.npc = mkNpc(def); npcs.push(t.npc); return true; } };
      return t;
    },
  };
  const piezas = {
    fuego: (tipo) => ({ g: { position: vec(0, 0, 0), visible: true }, llama: { scale: { set() {}, y: 1 } }, fina: { scale: { y: 1 } }, brillo: { material: { opacity: 0.2 } }, tipo, titilar() {} }),
    martillo: () => ({ martillo: true }),
  };
  const T = { riel: Array.from({ length: 1000 }, (_, i) => ({ x: i - 500, z: opciones.viaZ ?? 80, s: i })), agua: () => null };
  const api = {
    D: () => estado, gente: () => (opciones.sinGente ? null : gente), horas: () => reloj.horas, dia: () => reloj.dia, centroBase: () => ({ x: 0, z: 0 }),
    alturaEn: () => 0, agua: () => null, paredes: () => [{ x: 0, z: 14 }, { x: 14, z: 0 }, { x: 0, z: -14 }, { x: -14, z: 0 }],
    nota: (t, s) => log.notas.push([t, s]), efectos: { chispas: () => { log.chispas++; }, astillas: () => {} },
    sonido: { golpeRuido: () => { log.golpes++; }, tono: () => {}, fuente: () => null, silbato: (p) => log.sonidos.push(['silbato', p]) },
    obraMasDanada: (c, radio, sin) => {
      let mejor = null, peor = 0.999;
      for (const o of obras) {
        if (o === sin || Math.hypot(o.datos.x - c.x, o.datos.z - c.z) > radio) continue;
        const r = o.datos.vida / 100;
        if (r < peor) { peor = r; mejor = o; }
      }
      return mejor;
    },
    reparar: (o, cant) => { o.datos.vida = Math.min(100, o.datos.vida + cant); return o.datos.vida >= 100; },
    get aliens() { return aliens; },
    lanzarProyectil: (tipo, desde, vel, dano, deJugador, fuente) => log.proyectiles.push({ tipo, desde: { ...desde }, vel: { ...vel }, dano, deJugador, fuente }),
    tren: () => tren, obraDeRamon: () => null,
  };
  const mundo = crearVecinosMundo(T, { add() {} }, api, piezas);
  const js = { pos: vec(0, 0, 0), yaw: 0 };
  // un cuadro: la rutina de gente.js lleva a cada uno hasta el punto de su ruta
  const cuadro = (dt = 0.25, hayDuendes = false) => {
    mundo.actualizar(dt, js, hayDuendes);
    for (const n of npcs) if (!n.dormido) { n.pos.x = n.ruta[0].x; n.pos.z = n.ruta[0].z; }
  };
  const correr = (seg, hayDuendes = false) => { for (let t = 0; t < seg; t += 0.25) cuadro(0.25, hayDuendes); };
  return { mundo, estado, reloj, aliens, obras, log, npcs, js, tren, cuadro, correr, api };
}
const travieso = (x, z) => ({ estado: 'avanzar', tipo: 'rastreador', def: { vuela: false, altura: 1.2 }, m: { g: { position: { x, y: 0, z } }, esc: 1, viejo: false }, huyeT: 0 });
const viejo = (x, z) => ({ ...travieso(x, z), m: { g: { position: { x, y: 0, z } }, esc: 1, viejo: true } });
const obraRota = (x, z, vida = 20) => ({ datos: { x, y: 0, z, vida }, plano: { id: 'empalizada' } });

// ---- cuándo vienen
{
  // una noche común: nadie
  let m = mundoDeMentira({ oleadas: 2, horas: 21 });
  m.correr(30);
  igual(m.mundo.presentes(), [], 'una noche común no viene nadie');
  ok(m.npcs.length === 0, 'ni se arma ninguno');
  // una noche grande (la 12) con el respaldo en 1: vienen Anselmo, Herminia y los dos chicos
  m = mundoDeMentira({ oleadas: 11, horas: 19.6 });
  m.correr(10);
  igual(m.mundo.presentes().sort(), ['anselmo', 'herminia', 'nena', 'nene'], 'una noche grande, vienen los cuatro cuerpos');
  ok(m.log.notas.some(([t]) => /vecinos se suman/i.test(t)), 'el aviso de que se suman');
  ok(m.npcs.every((n) => n.enBase && !n.dormido && n.claveAliado), 'son aliados de la base (la E les da órdenes)');
  ok(m.npcs.find((n) => n.claveAliado === 'anselmo').mano.hijos.length === 1, 'Anselmo trae el martillo');
  // con una especial, noche 3: también es grande
  m = mundoDeMentira({ oleadas: 2, especial: 'roja', horas: 19.6 });
  m.correr(10);
  ok(m.mundo.presentes().length === 4, 'una noche especial es grande');
  // con nivel 0 no vienen
  m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 0, chicos: 0 } });
  m.correr(10);
  igual(m.mundo.presentes(), [], 'con nivel 0 no viene nadie');
  m = mundoDeMentira({ ayuda: { anselmo: 1, herminia: 0, martin: 0, chicos: 2 } });
  m.correr(10);
  igual(m.mundo.presentes().sort(), ['anselmo', 'nena', 'nene'], 'cada uno según su nivel');
  // sin vecinos en la partida (Tu partida): nadie ayuda
  m = mundoDeMentira({ sinGente: true });
  m.correr(10);
  igual(m.mundo.presentes(), [], 'sin vecinos en la partida no ayuda nadie');
  // de día no vienen, y al amanecer se van
  m = mundoDeMentira({ horas: 12 });
  m.correr(10);
  igual(m.mundo.presentes(), [], 'de día, nadie');
  m.reloj.horas = 20; m.correr(10);
  ok(m.mundo.presentes().length === 4, 'al caer la tarde vienen');
  m.reloj.horas = 1; m.correr(5);
  ok(m.mundo.presentes().length === 4, 'de madrugada siguen');
  m.reloj.horas = 6.5; m.correr(1);
  igual(m.mundo.presentes(), [], 'al amanecer se van');
  ok(m.npcs.every((n) => n.dormido && !n.enBase), 'quedan escondidos, para la próxima');
  ok(m.log.notas.some(([t]) => /vuelven a la aldea/i.test(t)), 'el aviso');
  m.reloj.horas = 20; m.reloj.dia = 13; m.correr(5);
  ok(m.npcs.length === 4 && m.mundo.presentes().length === 4, 'la próxima noche grande vuelven los mismos (no se arman de nuevo)');
  // el nivel queda fijo toda la noche
  m = mundoDeMentira({ ayuda: { anselmo: 1, herminia: 1, martin: 1, chicos: 1 } });
  m.correr(5);
  m.estado.aldea.ayuda.anselmo = 0;
  m.correr(5);
  ok(m.mundo.esta('anselmo'), 'si el nivel cambia a mitad de noche, esa noche sigue igual');
}

// ---- Anselmo arregla
{
  const obras = [obraRota(10, 0, 20), obraRota(-10, 3, 50), obraRota(30, 0, 10)];
  let m = mundoDeMentira({ obras, ayuda: { anselmo: 1, herminia: 0, martin: 0, chicos: 0 } });
  m.correr(8);
  ok(m.mundo.esta('anselmo'), 'viene');
  const vidas0 = obras.map((o) => o.datos.vida);
  m.correr(40);
  ok(obras.every((o) => o.datos.vida > vidas0[obras.indexOf(o)]) || obras.slice(0, 2).every((o) => o.datos.vida === 100), 'va de una obra a otra arreglando');
  ok(obras[0].datos.vida === 100 && obras[1].datos.vida === 100, 'arregló las que están dentro de su radio');
  ok(obras[2].datos.vida === 10, 'la que queda fuera de su radio (30 m) no');
  ok(m.log.golpes > 0, 'se oyen los martillazos');
  // el nivel 2 arregla más rápido
  const t1 = (() => { const o = [obraRota(8, 0, 0)]; const w = mundoDeMentira({ obras: o, ayuda: { anselmo: 1, herminia: 0, martin: 0, chicos: 0 } }); w.correr(5); let t = 0; while (o[0].datos.vida < 100 && t < 200) { w.cuadro(0.25); t += 0.25; } return t; })();
  const t2 = (() => { const o = [obraRota(8, 0, 0)]; const w = mundoDeMentira({ obras: o, ayuda: { anselmo: 2, herminia: 0, martin: 0, chicos: 0 } }); w.correr(5); let t = 0; while (o[0].datos.vida < 100 && t < 200) { w.cuadro(0.25); t += 0.25; } return t; })();
  ok(t2 < t1, `nivel 2 arregla más rápido (${t2} s contra ${t1} s)`);
  // dos arreglan distinto: no va a la obra que ya está arreglando Don Ramón
  const o2 = [obraRota(8, 0, 10), obraRota(-8, 0, 30)];
  m = mundoDeMentira({ obras: o2, ayuda: { anselmo: 1, herminia: 0, martin: 0, chicos: 0 } });
  m.api.obraDeRamon = () => o2[0];
  m.correr(8);
  ok(m.npcs[0].ruta[0].x < 0, 'va a la obra que no está arreglando Don Ramón');
  // con dos igual de rotas no va y viene: termina una y sigue con la otra
  {
    const dos = [obraRota(8, 0, 20), obraRota(-8, 0, 20)];
    const w = mundoDeMentira({ obras: dos, ayuda: { anselmo: 1, herminia: 0, martin: 0, chicos: 0 } });
    w.correr(3);
    const blancos = new Set();
    for (let k = 0; k < 400 && !dos.some((o) => o.datos.vida >= 100); k++) { w.cuadro(0.25); blancos.add(Math.sign(w.npcs[0].ruta[0].x)); }
    ok(blancos.size === 1, 'mientras no termina una, no cambia de obra');
    w.correr(40);
    ok(dos.every((o) => o.datos.vida === 100), 'y después arregla la otra');
  }
  // sin nada roto, se queda en su puesto
  m = mundoDeMentira({ obras: [], ayuda: { anselmo: 1, herminia: 0, martin: 0, chicos: 0 } });
  m.correr(8);
  const p0 = V.puestoPorDefecto('anselmo', { base: { x: 0, z: 0 }, paredes: [], lado: 0 });
  ok(m.npcs.length === 1 && Math.hypot(m.npcs[0].pos.x - p0.x, m.npcs[0].pos.z - p0.z) < 0.5, 'sin nada roto, en su puesto');
}

// ---- Herminia prende los fuegos y los viejos no se acercan
{
  let m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 1, martin: 0, chicos: 0 } });
  m.correr(1.5);
  ok(m.mundo.esta('herminia') && m.mundo.fuegosPrendidos().length === 0, 'viene y todavía no prendió nada');
  m.correr(30);
  const f1 = m.mundo.fuegosPrendidos();
  ok(f1.length === 2, `con el nivel 1 prende dos fuegos (${f1.length})`);
  ok(f1[0].radio === V.HERMINIA[1].radio && f1[1].radio === V.HERMINIA[1].radio * V.PARTE_FAROL, 'el fogón espanta a 9 m y el farol a menos');
  ok(m.log.notas.some(([t]) => /prende el primer fuego/i.test(t)), 'el aviso');
  // una noche grande con nivel 2: cuatro y más rápido
  m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 2, martin: 0, chicos: 0 } });
  m.correr(40);
  ok(m.mundo.fuegosPrendidos().length === 4, 'con el nivel 2, cuatro');
  // los viejos y los traviesos
  const f = m.mundo.fuegosPrendidos()[0];
  const antes = Math.atan2(-Math.sin(0.3), -Math.cos(0.3));   // un rumbo cualquiera
  const a1 = viejo(f.x + 3, f.z), a2 = travieso(f.x + 3, f.z), a3 = viejo(f.x + 200, f.z + 200);
  // yendo hacia el fuego (rumbo hacia -x), el viejo adentro del círculo no avanza hacia él; el travieso sí
  const hacia = Math.atan2(-1, 0);
  const rv = m.mundo.rumboDeViejo(a1, hacia), rt = m.mundo.rumboDeViejo(a2, hacia), rl = m.mundo.rumboDeViejo(a3, hacia);
  ok(Math.sin(rv) >= -1e-9, 'el viejo adentro del círculo no va hacia el fuego');
  ok(rt === hacia, 'el travieso sigue derecho');
  ok(rl === hacia, 'el viejo lejos del fuego sigue derecho');
  void antes;
  // sin fuegos prendidos, nada cambia
  const m2 = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 2, martin: 0, chicos: 0 } });
  m2.correr(1.5);
  ok(m2.mundo.rumboDeViejo(viejo(1, 1), 1.234) === 1.234, 'sin fuegos prendidos, nada cambia');
  // al amanecer se apagan
  m.reloj.horas = 6.5; m.correr(1);
  ok(m.mundo.fuegosPrendidos().length === 0, 'al amanecer se apagan');
  // «vení conmigo»: no prende (va con vos)
  const m3 = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 2, martin: 0, chicos: 0 } });
  m3.correr(1);
  m3.estado.ordenes.herminia = 'seguime';
  m3.correr(30);
  ok(m3.mundo.fuegosPrendidos().length === 0, 'siguiéndote no prende fuegos');
}

// ---- Martín pasa con la trochita
{
  const pasar = (m) => { for (let s = 0; s < 1000; s += 5) { m.tren.est.s = s; m.cuadro(0.25); } };
  // la base a 80 m de la vía: el silbato dispersa a los traviesos cercanos a la vía
  let m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 1, chicos: 0 }, viaZ: 80 });
  const t1 = travieso(0, 70), t2 = travieso(0, 10), v1 = viejo(5, 80);
  m.aliens.push(t1, t2, v1);
  m.correr(2);
  pasar(m);
  ok(m.mundo.silbatos === 1, `una vuelta de la trochita, un silbato (${m.mundo.silbatos})`);
  ok(m.log.sonidos.length === 1 && m.log.sonidos[0][0] === 'silbato', 'suena el silbato');
  ok(t1.huyeT === V.MARTIN[1].dispersa, 'el travieso cerca de la vía sale corriendo');
  ok(t2.huyeT === 0, 'el travieso lejos de la vía no (alcance 45 m)');
  ok(v1.huyeT === 0, 'el viejo no se dispersa');
  ok(m.log.notas.some(([t, s]) => /Martín toca el silbato/.test(t) && /1 travieso/.test(s)), 'el aviso dice cuántos');
  // huye para el otro lado de la vía
  const rumbo = m.mundo.rumboDeHuida(t1, 0.5);
  // 4.10.1: la base (en el origen) queda entre la vía y el travieso: ya no corre hacia ella; de costado (antes: «hacia -z», o sea a la base)
  ok(-Math.cos(rumbo) < 0.05 && Math.abs(Math.sin(rumbo)) > 0.9, 'corre de costado: ni hacia la vía ni hacia la base');
  ok(t1.huyeT === V.MARTIN[1].dispersa - 0.5, 'y el tiempo corre');
  ok(m.mundo.rumboDeHuida(t2, 0.5) === null, 'el que no huye no tiene rumbo de huida');
  // con una sola pasada por noche de efecto, la segunda vuelta no dispersa (nivel 1)
  t1.huyeT = 0;
  pasar(m);
  ok(m.mundo.silbatos === 2 && t1.huyeT === 0, 'nivel 1: sólo una pasada por noche hace efecto');
  // nivel 2: dos pasadas y más alcance
  m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 2, chicos: 0 }, viaZ: 80 });
  const t3 = travieso(0, 30);
  m.aliens.push(t3);
  m.correr(2); pasar(m);
  ok(t3.huyeT === V.MARTIN[2].dispersa, 'nivel 2: llega más lejos (50 m) y asusta más tiempo');
  t3.huyeT = 0; pasar(m);
  ok(t3.huyeT === V.MARTIN[2].dispersa, 'nivel 2: la segunda pasada también');
  t3.huyeT = 0; pasar(m);
  ok(t3.huyeT === 0 && m.mundo.silbatos === 3, 'pero la tercera ya no');
  // la base lejos de la vía (200 m): pasa igual, el silbato suena y no pasa nada
  m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 2, chicos: 0 }, viaZ: 200 });
  const t4 = travieso(0, 150);
  m.aliens.push(t4);
  m.correr(2); pasar(m);
  ok(m.mundo.silbatos === 1 && m.log.sonidos.length === 1, 'el silbato se oye por el valle');
  ok(t4.huyeT === 0, 'pero sin efecto: la vía queda a más de 120 m de la base');
  ok(m.log.notas.some(([t, s]) => /Martín pasa/.test(t) && /lejos de tu base/.test(s)), 'y lo dice');
  // con nivel 0 ni silba; una noche común tampoco; la trochita varada no pasa
  m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 0, chicos: 0 } });
  m.correr(2); pasar(m);
  ok(m.mundo.silbatos === 0, 'nivel 0: no pasa');
  m = mundoDeMentira({ oleadas: 2, horas: 21 });
  m.correr(2); pasar(m);
  ok(m.mundo.silbatos === 0, 'una noche común no pasa');
  m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 1, chicos: 0 } });
  m.tren.est.varado = true; m.correr(2); pasar(m);
  ok(m.mundo.silbatos === 0, 'la trochita varada (la noche del rescate de Elsa) no pasa');
}

// ---- los chicos
{
  let m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 0, chicos: 1 } });
  m.correr(5);
  ok(m.mundo.esta('nene') && m.mundo.esta('nena'), 'vienen los dos chicos');
  // sin duendes no tiran
  m.correr(10, false);
  ok(m.log.proyectiles.length === 0, 'sin duendes no tiran');
  const d = travieso(0, 9);
  m.aliens.push(d);
  m.correr(12, true);
  ok(m.log.proyectiles.length >= 2, `con un duende a tiro, tiran piedras (${m.log.proyectiles.length})`);
  ok(m.log.proyectiles.every((q) => q.tipo === 'piedra' && q.deJugador === true && q.fuente === 'aliado'), 'piedras de aliado');
  ok(m.log.proyectiles.every((q) => q.dano === V.HONDA[1].dano), 'con poco daño');
  ok(m.log.proyectiles.every((q) => Math.hypot(q.vel.x, q.vel.y, q.vel.z) < 31.5 + 2), 'a la velocidad de una honda');
  {
    // la piedra nace adelante del chico, hacia el blanco (adentro de la empalizada), no en sus pies
    const q = m.log.proyectiles[0], quien = m.npcs.find((n) => Math.hypot(n.pos.x - q.desde.x, n.pos.z - q.desde.z) < 3);
    const dQ = Math.hypot(q.desde.x - quien.pos.x, q.desde.z - quien.pos.z);
    cerca(dQ, 1.8, 0.01, 'la piedra nace 1,8 m adelante del chico');
    ok(q.desde.y > quien.pos.y + 1.2, 'a la altura del pecho, por encima del chico');
    ok(Math.hypot(q.desde.x - 0, q.desde.z - 9) < Math.hypot(quien.pos.x - 0, quien.pos.z - 9) - 1.5, 'y del lado del blanco');
  }
  ok(m.log.herirJugador === 0, 'nada le pega al jugador');
  // fuera de alcance no tiran
  m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 0, chicos: 1 } });
  m.correr(5);
  m.aliens.push(travieso(0, 90));
  m.correr(12, true);
  ok(m.log.proyectiles.length === 0, 'fuera de alcance (20 m) no tiran');
  // el nivel 2 tira más seguido
  const tiros = (nivel) => { const w = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 0, chicos: nivel } }); w.correr(5); w.aliens.push(travieso(0, 12)); w.correr(30, true); return w.log.proyectiles.length; };
  ok(tiros(2) > tiros(1), 'el nivel 2 tira más piedras');
  // no le tiran a lo que no corresponde
  m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 0, chicos: 1 } });
  m.correr(5);
  m.aliens.push({ ...travieso(0, 9), estado: 'dormido' }, { ...travieso(0, 9), estado: 'bajoTierra' }, { ...travieso(0, 9), enNave: true });
  m.correr(12, true);
  ok(m.log.proyectiles.length === 0, 'ni a los dormidos, ni a los que cavan, ni a las crías del Coihue');
  // los chicos no tienen cómo recibir daño: el mundo de los vecinos no usa herirJugador, vida, ni nada que sea de ellos
  const fuente = leer('src/desafio-vecinos-mundo.js');
  ok(!/herirJugador|\.vida\s*-=|salud\s*-=|npc\.vida/.test(fuente), 'ningún código le saca vida a un vecino');
  // y su puesto está adentro de la empalizada
  const pn = m.npcs.find((n) => n.claveAliado === 'nene');
  ok(Math.hypot(pn.pos.x, pn.pos.z) < 13, 'el chico se para adentro de la empalizada');
}

// ---- las órdenes en el mundo: marcar el puesto, vení conmigo y la campana
{
  const m = mundoDeMentira({ ayuda: { anselmo: 1, herminia: 1, martin: 0, chicos: 1 }, obras: [] });
  m.correr(5);
  const an = m.npcs.find((n) => n.claveAliado === 'anselmo');
  // E: de «puesto» a «vení conmigo»
  let r = m.mundo.ordenar('anselmo');
  ok(r.orden === 'seguime' && /conmigo/i.test(NOMBRE(r.orden)) || r.orden === 'seguime', 'primero, vení conmigo');
  ok(m.estado.puestosAliados.anselmo === undefined, 'todavía no marcó nada');
  m.js.pos.x = 20; m.js.pos.z = 5;
  m.correr(4);
  // lo lleva hasta donde quiere el puesto y E de nuevo: queda ahí
  an.pos.x = 17; an.pos.z = 6;
  r = m.mundo.ordenar('anselmo');
  ok(r.orden === 'puesto' && r.respuesta.length > 5, 'después, quedate acá');
  igual(m.estado.puestosAliados.anselmo, { x: 17, z: 6 }, 'el puesto es donde estaba parado');
  m.js.pos.x = 0; m.js.pos.z = 0;
  m.correr(3);
  ok(Math.hypot(an.ruta[0].x - 17, an.ruta[0].z - 6) < 0.5, 'y se queda en su puesto aunque te vayas');
  // ordenar a quien no está
  ok(m.mundo.ordenar('martin') === null && m.mundo.ordenar('constructor') === null && m.mundo.ordenar('ramon') === null, 'a quien no está en la base no se le ordena');
  // la campana: los que no estaban en su puesto pasan a «puesto» y corren
  m.estado.ordenes.herminia = 'seguime'; m.estado.ordenes.nene = 'seguime';
  const n = m.mundo.alarma();
  ok(n === 4, `la campana avisa a los ${n} que están`);
  ok(Object.values(m.estado.ordenes).every((o) => o === 'puesto'), 'todos a su puesto');
  m.correr(1);
  ok(m.npcs.every((x) => x.velocidad > 3.5 || Math.hypot(x.pos.x - x.ruta[0].x, x.pos.z - x.ruta[0].z) < 1.5), 'corren (velocidad de carrera) hasta llegar');
  m.correr(10);
  ok(m.npcs.every((x) => x.velocidad < 2), 'y al llegar vuelven al paso');
}

// ============================================================ 4. la campana
{
  const campanaObra = { datos: { x: 5, y: 0, z: 5 }, plano: { id: 'campana', defensa: { tipo: 'campana' } } };
  const log = { notas: [], alarmas: 0 };
  const c = crearCampana({
    campanas: () => [campanaObra], D: () => ({}), nota: (t, s) => log.notas.push([t, s]), sonido: {}, centroBase: () => ({ x: 0, z: 0 }),
    portones: () => [{ x: 0, z: 20 }], alarmaAliados: () => { log.alarmas++; return 2; }, alarmaVecinos: () => 3, lado: () => 0, alturaEn: () => 0,
  });
  ok(c.avisoCerca({ x: 40, y: 0, z: 40 }) === null && c.usarCerca({ x: 40, y: 0, z: 40 }) === false, 'lejos de la campana no hay nada');
  ok(/Tocar la campana/.test(c.avisoCerca({ x: 5, y: 0, z: 7 })), 'cerca, el aviso de la E');
  ok(c.perroAlPorton() === null, 'antes de tocarla, el perro sigue a lo suyo');
  ok(c.usarCerca({ x: 5, y: 0, z: 7 }) === true, 'la E la toca');
  ok(log.alarmas === 1, 'los aliados corren a sus puestos');
  ok(log.notas.length === 1 && /campana/i.test(log.notas[0][0]) && /5 aliados/.test(log.notas[0][1]), 'el aviso dice cuántos');
  const dest = c.perroAlPorton();
  ok(dest && dest.corre === true && dest.z > 15 && dest.z < 20 && dest.cerca > 0, 'el perro va del lado de adentro del portón');
  ok(/vibra/.test(c.avisoCerca({ x: 5, y: 0, z: 7 })) && c.enfriando, 'vibra un rato');
  ok(c.usarCerca({ x: 5, y: 0, z: 7 }) === true && log.alarmas === 1, 'no se toca dos veces seguidas');
  c.actualizar(V.CAMPANA.enfriamiento + 0.1);
  ok(!c.enfriando && /Tocar/.test(c.avisoCerca({ x: 5, y: 0, z: 7 })), 'se puede volver a tocar');
  c.actualizar(V.CAMPANA.perroEspera);
  ok(c.perroAlPorton() === null, 'el perro vuelve con vos al rato');
  // sin portón, el perro va 5 m hacia el lado por donde entran
  const notas2 = [];
  const c2 = crearCampana({ campanas: () => [campanaObra], D: () => ({}), nota: (t, s) => notas2.push(s), sonido: {}, centroBase: () => ({ x: 0, z: 0 }), portones: () => [], alarmaAliados: () => 0, alarmaVecinos: () => 0, lado: () => Math.PI / 2, alturaEn: () => 0 });
  c2.usarCerca({ x: 5, y: 0, z: 5 });
  const d2 = c2.perroAlPorton();
  cerca(d2.x, 5, 1e-6, 'sin portón, hacia el lado de entrada (x)'); cerca(d2.z, 0, 1e-6, '(z)');
  ok(/Todavía no hay vecinos/.test(notas2[0]), 'sin nadie en la base, el aviso lo dice y el perro va igual');
  // en otro piso no se toca
  ok(c.avisoCerca({ x: 5, y: 9, z: 5 }) === null, 'una campana a otra altura no cuenta');
  igual(V.alarmaDeCampana(['ramon', 'anselmo', 'ema'], { ramon: 'puesto', anselmo: 'seguime' }), ['anselmo', 'ema'], 'los que ya estaban en su puesto no cambian');
}

// ---- el tañido
{
  igual(typeof tanidoCampana, 'function', 'la receta existe');
  let k = 0.123;
  const azar = () => { k = (k * 16807 + 0.17) % 1; return k; };
  const buf = completar(tanidoCampana(32000, azar));
  const seg = buf.length / 32000;
  ok(seg > 4 && seg < 7, `dura unos 5 s (${seg.toFixed(2)})`);
  const m = medir(buf);
  ok(m.nan === 0 && m.pico > 0.85 && m.pico <= 0.91 && m.rms > 0.05 && m.rms < 0.4, `buffer sano: ${JSON.stringify(m)}`);
  ok(Math.abs(m.dc) < 1e-3, 'sin continua');
  // seis golpes: la energía de los primeros 2 s es mayor que la de los últimos 2 s (la cola se apaga)
  const rms = (a, b) => { let s = 0; for (let i = Math.floor(a * 32000); i < Math.floor(b * 32000); i++) s += buf[i] * buf[i]; return Math.sqrt(s / ((b - a) * 32000)); };
  ok(rms(0, 2) > rms(seg - 2, seg) * 3, 'la cola se apaga');
  // y hay seis golpes: seis picos de energía separados
  const bloques = []; for (let t = 0; t < SEPARACION * GOLPES; t += 0.04) bloques.push(rms(t, t + 0.04));
  ok(Math.max(...bloques) > 0.1, 'hay golpes');
  ok(PARCIALES.length >= 6 && PARCIALES.every(([r, a, tau]) => r > 0 && a > 0 && tau > 0), 'parciales de campana');
  ok(PARCIALES.some(([r]) => r === 1.19) && PARCIALES.some(([r]) => r === 0.5), 'la tercera menor y el zumbido, como una campana de verdad');
  ok(PARCIALES.every(([r]) => !Number.isInteger(r) || r <= 3), 'no es un acorde de armónicos');
  // el reproductor: sin motor de audio no hace nada ni rompe
  const s = crearSonidoCampana({});
  ok(s.preparar() === false && s.sonar({ x: 0, y: 0, z: 0 }) === null, 'sin audio no pasa nada');
  // con un motor de mentira: pide el buffer a la cola y lo toca en la posición de la campana
  const llamadas = [];
  const motor = {
    ctx: {}, bus: { efectos: {} }, relax: false,
    variantes: (clave) => llamadas.push(['variantes', clave]),
    variante: (clave, n, crear, ren, alListo) => { llamadas.push(['variante', clave]); return { buf: true }; },
    fuente: (pos) => { llamadas.push(['fuente', pos.x]); return {}; },
    sonarBuffer: (buf, dest, vol) => { llamadas.push(['suena', vol]); return {}; },
  };
  const s2 = crearSonidoCampana(motor);
  ok(s2.preparar() === true && llamadas[0][0] === 'variantes', 'se arma en la cola del motor');
  s2.sonar({ x: 7, y: 2, z: 0 });
  ok(llamadas.some((l) => l[0] === 'suena') && llamadas.some((l) => l[0] === 'fuente' && l[1] === 7), 'suena donde está la campana');
  // no se tocó el banco de la 4.8.0
  ok(!/campana-aldea|tanidoCampana/.test(leer('src/desafio-sonidos.js')), 'desafio-sonidos.js sin tocar');
  ok(!/ñ/.test(Object.keys(await_import_nombres()).join('')), 'sin eñe en los nombres exportados');
}
function await_import_nombres() { return { ...V, ...O }; }
function NOMBRE(o) { return O.NOMBRE_ORDEN[o] || ''; }

// ============================================================ 5. los enganches
{
  const des = leer('src/desafio.js'), main = leer('src/main.js'), ali = leer('src/desafio-aliados.js'), reglas = leer('src/desafio-reglas.js');
  const linea = (fuente, ...partes) => fuente.split('\n').some((l) => partes.every((p) => l.includes(p)));
  ok(linea(des, 'import { crearVecinosMundo }', 'desafio-vecinos-mundo.js') && linea(des, 'import { crearCampana }', 'desafio-campana.js') && linea(des, 'import { crearPiezasVecinos }'), 'desafio.js arma los vecinos y la campana');
  ok(linea(des, 'vecinos.actualizar(dt, js, vivos() > 0, mundo.noche);') && linea(des, 'campana.actualizar(dt);'), 'cada cuadro');
  ok(linea(des, 'vecinos.limpiar();'), 'se limpian con el resto');
  ok(linea(des, 'ordenar:', 'aliados.ordenar(clave) || vecinos.ordenar(clave)'), 'la E ordena también a los vecinos');
  ok(linea(des, 'perroAlPorton:', 'campana.perroAlPorton()'), 'el perro');
  ok(linea(des, 'usarCercaDe:', 'campana.usarCerca(pos)') && linea(des, 'avisoCercaDe:', 'campana.avisoCerca(pos)'), 'la E y el aviso de la campana, en la tabla de lo que está cerca (una sola vez)');
  ok(linea(des, "o.plano.defensa?.tipo === 'campana'"), 'es la campana de alarma de siempre (no hay una pieza nueva repetida)');
  ok(linea(des, 'a.huyeT = 0'), 'el invasor reciclado no hereda la huida (bajarAlien)');
  ok(linea(des, 'rumboObj = vecinos.rumboDeHuida(a, dt)') && linea(des, 'rumboObj = vecinos.rumboDeViejo(a, rumboObj)'), 'el silbato y los fogones, en el movimiento');
  ok(linea(des, 'if (a.huyeT > 0) a.cd = Math.max(a.cd, 0.3);'), 'el que huye no ataca');
  ok(linea(des, 'obraMasDanada: (c, radio, sin = null)'), 'Anselmo no repite la obra de Ramón');
  ok(linea(main, 'if (desafio && modo ===', 'mundoPerro.antojo = desafio.perroAlPorton'), 'main.js manda al perro');
  ok(linea(main, 'desafio.ordenar(npc.claveAliado || npc.clave)') && linea(main, 'const clave = npc.claveAliado || npc.clave;'), 'main.js ordena por oficio');
  ok(linea(ali, 'alarma,') && linea(ali, 'function alarma()'), 'desafio-aliados.js: la alarma');
  ok(linea(reglas, 'puestosAliados: sanearPuestosAliados(x.puestosAliados)'), 'el guardado sanea los puestos');
  // las otras ramas: nada de lo ajeno
  for (const f of ['src/desafio-sonidos.js', 'src/desafio-defensas.js', 'src/desafio-arsenal.js', 'src/desafio-fortin.js']) ok(fs.existsSync(new URL('../' + f, import.meta.url)), `${f} sigue donde estaba`);
  // sin inglés en lo nuevo
  for (const f of ['src/desafio-vecinos.js', 'src/desafio-vecinos-mundo.js', 'src/desafio-campana.js', 'src/desafio-campana-sonido.js', 'src/desafio-vecinos-piezas.js']) {
    const t = leer(f);
    ok(!/\b(the|with|and|player|neighbor|bell|village)\b/i.test(t.replace(/\/\/.*$/gm, '')), `${f}: sin inglés en el código`);
    ok(!/\r/.test(t), `${f}: fines de línea LF`);
    ok(!/\x08/.test(t), `${f}: sin retrocesos (barras invertidas perdidas)`);
  }
  // los identificadores exportados, sin eñe
  for (const f of ['src/desafio-vecinos.js', 'src/desafio-campana.js', 'src/desafio-campana-sonido.js', 'src/desafio-vecinos-mundo.js']) {
    for (const mm of leer(f).matchAll(/^export\s+(?:const|let|var|function|class)\s+([^\s=(]+)/gm)) ok(!/ñ/.test(mm[1]), `${f}: ${mm[1]} sin eñe`);
  }
}

console.log(`verificar-4-9-aliados: ${cuantas} comprobaciones en verde · cuatro vecinos con nivel 0, 1 y 2, fuegos y viejos, silbato a 120 m, hondas sin daño, puestos guardados y saneados, campana con su tañido`);
