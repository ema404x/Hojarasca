// 3.7.5 (fiestas): el truco de verdad (truco.js), sin Electron: el mazo español, la jerarquía, el envido, el truco con
// sus subidas, las bazas y las pardas, irse al mazo, el partido a 15, y el rival (que nunca hace trampa ni se traba).
import assert from 'node:assert/strict';

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const T = await import('../src/truco.js');
const c = (n2, palo) => ({ n: n2, palo });

// ============================================================ 1. el mazo y la jerarquía
{
  const m = T.mazoEspanol();
  ok(m.length === 40 && new Set(m.map((x) => `${x.n}${x.palo}`)).size === 40 && !m.some((x) => x.n === 8 || x.n === 9), 'el mazo español de 40 (sin 8 ni 9)');
  const orden = [c(1, 'espada'), c(1, 'basto'), c(7, 'espada'), c(7, 'oro'), c(3, 'copa'), c(2, 'oro'), c(1, 'copa'), c(12, 'basto'), c(11, 'oro'), c(10, 'copa'), c(7, 'copa'), c(6, 'espada'), c(5, 'oro'), c(4, 'basto')];
  for (let i = 1; i < orden.length; i++) ok(T.valorTruco(orden[i - 1]) > T.valorTruco(orden[i]), `${T.nombreCarta(orden[i - 1])} le gana al ${T.nombreCarta(orden[i])}`);
  ok(T.valorTruco(c(3, 'oro')) === T.valorTruco(c(3, 'basto')) && T.valorTruco(c(1, 'copa')) === T.valorTruco(c(1, 'oro')) && T.valorTruco(c(7, 'basto')) === T.valorTruco(c(7, 'copa')), 'los iguales empatan (parda)');
  // el envido
  eq(T.envidoDe([c(7, 'oro'), c(6, 'oro'), c(1, 'espada')]), 33, '7 y 6 de oro: 33');
  eq(T.envidoDe([c(12, 'oro'), c(11, 'oro'), c(1, 'espada')]), 20, 'dos figuras del mismo palo: 20');
  eq(T.envidoDe([c(12, 'copa'), c(5, 'oro'), c(4, 'espada')]), 5, 'sin palo repetido: la más alta (5)');
  eq(T.envidoDe([c(10, 'copa'), c(11, 'oro'), c(12, 'espada')]), 0, 'tres figuras de distinto palo: 0');
  eq(T.envidoDe([c(7, 'basto'), c(2, 'basto'), c(5, 'basto')]), 32, 'tres del mismo palo (sin flor): las dos más altas, 32');
}

// un partido con las manos que queremos (mano: 0)
function armar(mias, suyas, mano = 0, puntos = [0, 0]) {
  const p = T.partidoNuevo({ semilla: 1, empieza: mano });
  p.ronda.cartas = [mias.map((x) => ({ ...x })), suyas.map((x) => ({ ...x }))];
  p.ronda.mano = mano; p.ronda.turno = mano; p.mano = mano;
  p.puntos = [...puntos];
  return p;
}
const hacer = (p, j, a) => { const r = T.actuar(p, j, a); assert.ok(r.ok, `${a} (${j}): ${r.motivo}`); n++; return r; };

// ============================================================ 2. el envido
{
  let p = armar([c(7, 'oro'), c(6, 'oro'), c(4, 'copa')], [c(1, 'espada'), c(2, 'basto'), c(3, 'basto')]);
  ok(T.accionesDe(p, 0).includes('envido') && T.accionesDe(p, 1).length === 0, 'el mano canta; el otro espera');
  hacer(p, 0, 'envido');
  eq(T.turnoDe(p), 1, 'contesta el otro');
  ok(T.accionesDe(p, 1).includes('quiero') && T.accionesDe(p, 1).includes('real') && !T.accionesDe(p, 1).some((a) => a.startsWith('carta:')), 'quiero, no quiero o subir (no se tira carta)');
  let r = hacer(p, 1, 'quiero');
  const e = r.eventos.find((x) => x.tipo === 'envido');
  ok(e && e.tantos[0] === 33 && e.tantos[1] === 25 && e.gana === 0 && e.puntos === 2, 'envido querido: 33 a 25, dos puntos');
  eq(p.puntos, [2, 0], 'anotados');
  ok(!T.accionesDe(p, 0).includes('envido'), 'el envido, una vez por mano');
  // no querido: uno
  p = armar([c(7, 'oro'), c(6, 'oro'), c(4, 'copa')], [c(1, 'espada'), c(2, 'basto'), c(3, 'basto')]);
  hacer(p, 0, 'envido'); hacer(p, 1, 'noquiero');
  eq(p.puntos, [1, 0], 'envido no querido: uno');
  // envido envido real, querido: 7; no querido: 4
  p = armar([c(7, 'oro'), c(6, 'oro'), c(4, 'copa')], [c(1, 'espada'), c(2, 'basto'), c(3, 'basto')]);
  hacer(p, 0, 'envido'); hacer(p, 1, 'envido');
  ok(!T.accionesDe(p, 0).includes('envido') && T.accionesDe(p, 0).includes('real') && T.accionesDe(p, 0).includes('falta'), 'envido envido: después, real o falta');
  hacer(p, 0, 'real'); hacer(p, 1, 'quiero');
  eq(p.puntos, [7, 0], 'envido, envido y real envido querido: 7');
  p = armar([c(7, 'oro'), c(6, 'oro'), c(4, 'copa')], [c(1, 'espada'), c(2, 'basto'), c(3, 'basto')]);
  hacer(p, 0, 'envido'); hacer(p, 1, 'envido'); hacer(p, 0, 'real'); hacer(p, 1, 'noquiero');
  eq(p.puntos, [4, 0], 'no querido: lo de antes (4)');
  // la falta envido: lo que le falta al que va ganando
  p = armar([c(7, 'oro'), c(6, 'oro'), c(4, 'copa')], [c(1, 'espada'), c(2, 'basto'), c(3, 'basto')], 0, [3, 9]);
  hacer(p, 0, 'falta'); hacer(p, 1, 'quiero');
  ok(p.puntos[0] === 3 + 6 && T.valorFalta({ aPuntos: 15, puntos: [3, 9] }) === 6, 'la falta envido: lo que le falta al que va ganando (6)');
  // empate: gana el mano
  p = armar([c(5, 'oro'), c(1, 'oro'), c(12, 'copa')], [c(5, 'basto'), c(1, 'basto'), c(11, 'copa')], 1);
  hacer(p, 1, 'envido'); hacer(p, 0, 'quiero');
  eq(p.puntos, [0, 2], 'empatados en 26: gana el mano');
  // el pie puede cantar después de que el mano tiró; el mano, después de tirar, ya no
  p = armar([c(7, 'oro'), c(6, 'oro'), c(4, 'copa')], [c(1, 'espada'), c(2, 'basto'), c(3, 'basto')]);
  hacer(p, 0, 'carta:2');
  ok(T.accionesDe(p, 1).includes('envido'), 'el pie canta envido después de la primera carta del mano');
  hacer(p, 1, 'carta:1');
  ok(!T.accionesDe(p, 0).includes('envido'), 'en la segunda baza, ya no hay envido');
  // el envido está primero
  p = armar([c(7, 'oro'), c(6, 'oro'), c(4, 'copa')], [c(1, 'espada'), c(2, 'basto'), c(3, 'basto')], 1);
  hacer(p, 1, 'truco');
  ok(T.accionesDe(p, 0).includes('envido'), 'te cantan truco en la primera: podés contestar con el envido');
  hacer(p, 0, 'envido'); hacer(p, 1, 'quiero');
  eq(p.puntos, [2, 0], 'el envido se resuelve primero');
  ok(T.turnoDe(p) === 0 && T.accionesDe(p, 0).includes('quiero') && !T.accionesDe(p, 0).includes('envido'), 'y después hay que contestar el truco');
}

// ============================================================ 3. el truco, las bazas y el mazo
{
  // truco querido y ganado en dos bazas: 2
  let p = armar([c(1, 'espada'), c(1, 'basto'), c(4, 'copa')], [c(3, 'oro'), c(2, 'basto'), c(5, 'espada')]);
  hacer(p, 0, 'truco');
  ok(T.accionesDe(p, 1).includes('retruco') && T.accionesDe(p, 1).includes('quiero'), 'al truco: quiero, no quiero o quiero retruco');
  hacer(p, 1, 'quiero');
  ok(!T.accionesDe(p, 0).includes('retruco') && !T.accionesDe(p, 0).includes('truco'), 'sube sólo el que tiene el quiero');
  hacer(p, 0, 'carta:0'); hacer(p, 1, 'carta:0');
  ok(T.accionesDe(p, 1).length === 0 && T.turnoDe(p) === 0, 'el que gana la baza sale');
  hacer(p, 0, 'carta:1');
  ok(T.accionesDe(p, 1).includes('retruco'), 'el que quiso puede subir después');
  hacer(p, 1, 'carta:1');
  ok(p.ronda.terminada && p.ronda.ganador === 0 && p.puntos[0] === 2, 'dos bazas ganadas: el truco vale 2');
  hacer(p, 0, 'seguir');
  ok(!p.ronda.terminada && p.mano === 1 && p.ronda.cartas[0].length === 3 && p.ronda.cartas[1].length === 3, 'otra mano: reparte el otro (el mano cambia)');
  // retruco no querido: 2; vale cuatro querido: 4
  p = armar([c(1, 'espada'), c(1, 'basto'), c(4, 'copa')], [c(3, 'oro'), c(2, 'basto'), c(5, 'espada')]);
  hacer(p, 0, 'truco'); hacer(p, 1, 'retruco');
  ok(T.accionesDe(p, 0).includes('vale4') && T.turnoDe(p) === 0, 'el retruco lo contesta el que cantó truco');
  hacer(p, 0, 'noquiero');
  eq(p.puntos, [0, 2], 'retruco no querido: 2 para el que lo cantó');
  p = armar([c(1, 'espada'), c(1, 'basto'), c(4, 'copa')], [c(3, 'oro'), c(2, 'basto'), c(5, 'espada')]);
  hacer(p, 0, 'truco'); hacer(p, 1, 'retruco'); hacer(p, 0, 'vale4');
  ok(!T.accionesDe(p, 1).some((a) => ['truco', 'retruco', 'vale4'].includes(a)), 'después del vale cuatro no se sube más');
  hacer(p, 1, 'quiero');
  hacer(p, 0, 'carta:0'); hacer(p, 1, 'carta:0'); hacer(p, 0, 'carta:1'); hacer(p, 1, 'carta:1');
  eq(p.puntos, [4, 0], 'vale cuatro querido: 4');
  // no querido el truco: 1
  p = armar([c(4, 'oro'), c(5, 'basto'), c(6, 'copa')], [c(3, 'oro'), c(2, 'basto'), c(5, 'espada')]);
  hacer(p, 0, 'truco'); hacer(p, 1, 'noquiero');
  eq(p.puntos, [1, 0], 'truco no querido: 1');
  // las pardas
  const r = (b, mano = 0) => T.ganadorDeRonda({ bazas: b, mano });
  ok(r([0, 0]) === 0 && r([1, 1]) === 1, 'dos bazas: gana');
  ok(r(['parda', 1]) === 1 && r(['parda', 0]) === 0, 'parda la primera: define la segunda');
  ok(r([0, 'parda']) === 0 && r([1, 'parda']) === 1, 'ganada la primera, parda la segunda: el de la primera');
  ok(r(['parda', 'parda', 1]) === 1, 'dos pardas: la tercera');
  ok(r(['parda', 'parda', 'parda'], 1) === 1 && r(['parda', 'parda', 'parda'], 0) === 0, 'todas pardas: el mano');
  ok(r([0, 1, 'parda']) === 0 && r([1, 0, 'parda']) === 1, 'parda la tercera: el de la primera');
  ok(r([0, 1, 1]) === 1 && r([0]) === null && r(['parda']) === null, 'la tercera define; con una sola, todavía no');
  // parda jugada de verdad
  p = armar([c(3, 'oro'), c(1, 'espada'), c(4, 'copa')], [c(3, 'basto'), c(5, 'oro'), c(6, 'copa')]);
  hacer(p, 0, 'carta:0'); hacer(p, 1, 'carta:0');
  ok(p.ronda.bazas[0] === 'parda' && T.turnoDe(p) === 0, 'parda en la primera: sale el mano');
  hacer(p, 0, 'carta:1'); hacer(p, 1, 'carta:1');
  ok(p.ronda.terminada && p.ronda.ganador === 0, 'y la segunda la define');
  // el mazo
  p = armar([c(4, 'oro'), c(5, 'basto'), c(6, 'copa')], [c(3, 'oro'), c(2, 'basto'), c(5, 'espada')]);
  hacer(p, 0, 'mazo');
  eq(p.puntos, [0, 2], 'al mazo en la primera, sin envido cantado: 2 para el otro');
  p = armar([c(4, 'oro'), c(5, 'basto'), c(6, 'copa')], [c(3, 'oro'), c(2, 'basto'), c(5, 'espada')]);
  hacer(p, 0, 'envido'); hacer(p, 1, 'noquiero'); hacer(p, 0, 'truco'); hacer(p, 1, 'quiero');
  hacer(p, 0, 'mazo');
  eq(p.puntos, [1, 2], 'al mazo con el truco querido: el truco (2)');
  // las cartas que no tenés, o fuera de turno
  p = armar([c(4, 'oro'), c(5, 'basto'), c(6, 'copa')], [c(3, 'oro'), c(2, 'basto'), c(5, 'espada')]);
  ok(!T.actuar(p, 1, 'carta:0').ok && !T.actuar(p, 0, 'quiero').ok && !T.actuar(p, 0, 'carta:5').ok && !T.actuar(p, 0, 'flor').ok, 'nada fuera de turno ni inventado');
}

// ============================================================ 4. el partido entero y el rival
{
  // se termina al llegar a 15 (aunque sea con el envido)
  const p = armar([c(7, 'oro'), c(6, 'oro'), c(4, 'copa')], [c(1, 'espada'), c(2, 'basto'), c(3, 'basto')], 0, [13, 4]);
  const r = hacer(p, 0, 'envido');
  hacer(p, 1, 'quiero');
  ok(p.terminado === 0 && p.puntos[0] === 15 && T.accionesDe(p, 0).length === 0 && T.turnoDe(p) === null, 'a 15: el envido termina el partido');
  void r;
  // IA contra IA y contra el azar, cientos de partidos: nunca una jugada ilegal, siempre termina
  let ilegales = 0, sinTerminar = 0;
  const gan = [0, 0];
  for (let s = 1; s <= 200; s++) {
    const q = T.partidoNuevo({ semilla: s, empieza: s % 2 });
    let k = 0;
    while (q.terminado === null && k++ < 3000) {
      const t = T.turnoDe(q);
      let a;
      if (q.ronda.terminada) a = 'seguir';
      else if (t === 1) a = T.decidirIA(q, 1, T.perfilTruco('jefe'), s * 31 + k);
      else { const acc = T.accionesDe(q, 0).filter((x) => x !== 'mazo'); a = acc[(s * 7 + k * 13) % acc.length]; }
      if (!T.actuar(q, t, a).ok) { ilegales++; break; }
    }
    if (q.terminado === null) sinTerminar++; else gan[q.terminado]++;
  }
  ok(ilegales === 0 && sinTerminar === 0, `200 partidos: ninguna jugada ilegal, todos terminan (${ilegales}, ${sinTerminar})`);
  ok(gan[1] > gan[0] * 2, `el rival le gana a uno que juega al azar (${gan[1]} a ${gan[0]})`);
  let ok2 = 0;
  for (let s = 1; s <= 120; s++) {
    const q = T.partidoNuevo({ semilla: s * 5, empieza: s % 2 });
    let k = 0;
    while (q.terminado === null && k++ < 3000) { const t = T.turnoDe(q); const a = q.ronda.terminada ? 'seguir' : T.decidirIA(q, t, t ? T.perfilTruco('herrero') : T.perfilTruco('carpintero'), s + k); if (!T.actuar(q, t, a).ok) break; }
    if (q.terminado !== null) ok2++;
  }
  eq(ok2, 120, 'IA contra IA (Anselmo, callado; Tito, mentiroso): todos terminan');
  // el rival no mira tus cartas: con las mismas suyas y lo mismo en la mesa, decide igual
  const a1 = armar([c(1, 'espada'), c(1, 'basto'), c(7, 'espada')], [c(4, 'oro'), c(5, 'basto'), c(6, 'copa')], 1);
  const a2 = armar([c(4, 'copa'), c(5, 'copa'), c(6, 'oro')], [c(4, 'oro'), c(5, 'basto'), c(6, 'copa')], 1);
  for (let s = 1; s <= 30; s++) eq(T.decidirIA(a1, 1, T.PERFIL_TRUCO, s), T.decidirIA(a2, 1, T.PERFIL_TRUCO, s), `el rival juega limpio (${s})`);
  ok(T.perfilTruco('nadie') === T.PERFIL_TRUCO && T.perfilTruco('herrero').miente < 0.1, 'cada vecino con su forma de jugar (Anselmo no miente)');
  ok(T.TRUCO.aPuntos === 15 && T.TRUCO.flor === false, 'a 15, sin flor (decisión para el usuario)');
}

console.log(`✓ 3.7.5 (truco): ${n} comprobaciones`);
