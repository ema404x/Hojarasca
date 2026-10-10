// 3.7.5 (fiestas): los otros juegos de la fiesta (juegos-mesa.js), sin Electron: el chinchón (el mazo de 50, los
// juegos, ligar, cortar, el −10 y el chinchón), las damas (como se juegan acá: comer obligatorio y la mayor cantidad,
// la dama que vuela) y la taba.
import assert from 'node:assert/strict';

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const J = await import('../src/juegos-mesa.js');
const c = (n2, palo) => ({ n: n2, palo });
const C = { n: 0, palo: 'comodin' };

// ============================================================ 1. chinchón
{
  const m = J.mazoChinchon();
  ok(m.length === 50 && m.filter(J.esComodin).length === 2 && new Set(m.filter((x) => !J.esComodin(x)).map((x) => `${x.n}${x.palo}`)).size === 48, 'el mazo de 50: del 1 al 12 de los cuatro palos y dos comodines');
  ok(J.esJuego([c(3, 'oro'), c(4, 'oro'), c(5, 'oro')]) && J.esJuego([c(7, 'oro'), c(7, 'copa'), c(7, 'basto'), c(7, 'espada')]), 'escalera y pierna');
  ok(J.esJuego([c(3, 'oro'), C, c(5, 'oro')]) && J.esJuego([c(9, 'copa'), c(9, 'oro'), C]), 'el comodín cubre lo que falta');
  ok(!J.esJuego([c(3, 'oro'), c(4, 'copa'), c(5, 'oro')]) && !J.esJuego([c(3, 'oro'), c(5, 'oro'), c(7, 'oro')]) && !J.esJuego([c(3, 'oro'), c(3, 'oro'), c(4, 'oro')]) && !J.esJuego([c(1, 'oro'), c(2, 'oro')]), 'lo que no es juego');
  ok(J.esJuego([c(7, 'basto'), c(8, 'basto'), c(9, 'basto'), c(10, 'basto')]), 'con el 8 y el 9 (el mazo de 50)');
  const l = J.mejorLigado([c(1, 'oro'), c(2, 'oro'), c(3, 'oro'), c(7, 'copa'), c(7, 'oro'), c(7, 'basto'), c(4, 'espada')]);
  ok(l.resto === 4 && l.juegos.length === 2 && l.sueltas.length === 1, 'ligar: escalera de oro, pierna de sietes, suelto el 4 (resto 4)');
  ok(J.mejorLigado([c(5, 'copa'), c(6, 'copa'), c(7, 'copa'), c(7, 'oro'), c(7, 'basto')]).resto === 11, 'el 7 de copa va donde más conviene (la pierna: quedan 5 y 6)');
  ok(J.esChinchon([c(3, 'oro'), c(4, 'oro'), c(5, 'oro'), c(6, 'oro'), c(7, 'oro'), c(8, 'oro'), c(9, 'oro')]) && !J.esChinchon([c(3, 'oro'), c(4, 'oro'), c(5, 'oro'), C, c(7, 'oro'), c(8, 'oro'), c(9, 'oro')]), 'chinchón: siete seguidas del mismo palo, sin comodín');
  // cortar: con 5 o menos suelto
  ok(J.puedeCortar([c(1, 'oro'), c(2, 'oro'), c(3, 'oro'), c(7, 'copa'), c(7, 'oro'), c(7, 'basto'), c(4, 'espada'), c(12, 'copa')], 7), 'se corta con 4 suelto');
  ok(!J.puedeCortar([c(1, 'oro'), c(2, 'oro'), c(3, 'oro'), c(7, 'copa'), c(7, 'oro'), c(7, 'basto'), c(9, 'espada'), c(12, 'copa')], 7), 'con 9 suelto, no');
  // una mano armada: robar, tirar, cortar
  const p = J.chinchonNuevo({ semilla: 3, empieza: 0 });
  ok(p.ronda.cartas[0].length === 7 && p.ronda.cartas[1].length === 7 && p.ronda.pozo.length === 1 && p.ronda.mazo.length === 35, 'el reparto: 7 y 7, una al pozo');
  eq(J.accionesChinchon(p, 0), ['mazo', 'pozo'], 'primero se levanta');
  J.actuarChinchon(p, 0, 'mazo');
  ok(p.ronda.cartas[0].length === 8 && J.accionesChinchon(p, 0).filter((a) => a.startsWith('tirar:')).length === 8, 'con 8, se tira una');
  J.actuarChinchon(p, 0, 'tirar:0');
  ok(p.ronda.turno === 1 && J.accionesChinchon(p, 0).length === 0, 'le toca al otro');
  // cortar todo ligado: −10
  const q = J.chinchonNuevo({ semilla: 4 });
  q.ronda.cartas[0] = [c(1, 'oro'), c(2, 'oro'), c(3, 'oro'), c(7, 'copa'), c(7, 'oro'), c(7, 'basto'), c(12, 'copa')];
  q.ronda.cartas[1] = [c(12, 'espada'), c(11, 'oro'), c(10, 'basto'), c(4, 'copa'), c(5, 'oro'), c(1, 'basto'), c(2, 'copa')];
  q.ronda.turno = 0; q.ronda.fase = 'robar'; q.ronda.mazo.push(c(4, 'oro'));
  J.actuarChinchon(q, 0, 'mazo');
  const i12 = q.ronda.cartas[0].findIndex((x) => x.n === 12);
  ok(J.accionesChinchon(q, 0).includes(`cortar:${i12}`), 'tirando el 12 queda todo ligado: se puede cortar');
  J.actuarChinchon(q, 0, `cortar:${i12}`);
  ok(q.ronda.terminada && q.puntos[0] === J.CHINCHON.todoLigado && q.puntos[1] === 40, 'todo ligado: −10; el otro se anota lo suyo (45, menos el 5 de oro que acomoda en la escalera: 3.8.4)');
  // el rival: nunca hace algo que no puede; los partidos terminan
  let ilegales = 0, terminados = 0;
  for (let s = 1; s <= 40; s++) {
    const g = J.chinchonNuevo({ semilla: s, empieza: s % 2 });
    let k = 0;
    while (g.terminado === null && k++ < 6000) { const t = J.turnoChinchon(g); const a = g.ronda.terminada ? 'seguir' : J.decidirChinchon(g, t); if (!J.actuarChinchon(g, t, a).ok) { ilegales++; break; } }
    if (g.terminado !== null) terminados++;
  }
  ok(ilegales === 0 && terminados === 40, `40 partidos de chinchón: sin jugadas ilegales, todos terminan (${terminados})`);
}

// ============================================================ 2. damas
{
  const e = J.damasNuevas();
  const cuenta = (x, de) => x.tablero.flat().filter((p) => p && p.de === de).length;
  ok(cuenta(e, 0) === 12 && cuenta(e, 1) === 12 && e.tablero.every((f, i) => f.every((p, k) => !p || (i + k) % 2 === 1)), '12 y 12, en las casillas oscuras');
  const js = J.jugadasDamas(e);
  ok(js.length === 7 && js.every((j) => j.camino[1][0] === j.camino[0][0] - 1 && j.comidas.length === 0), 'al empezar: 7 jugadas, todas para adelante');
  // comer es obligatorio (y la mayor cantidad)
  const t = J.damasNuevas();
  t.tablero = Array.from({ length: 8 }, () => Array(8).fill(null));
  t.tablero[5][2] = { de: 0, dama: false };
  t.tablero[4][3] = { de: 1, dama: false };
  t.tablero[2][5] = { de: 1, dama: false };
  t.tablero[5][6] = { de: 0, dama: false };
  t.tablero[4][7] = { de: 1, dama: false };
  t.tablero[0][1] = { de: 1, dama: false };
  t.turno = 0;
  const jj = J.jugadasDamas(t);
  ok(jj.length === 1 && jj[0].comidas.length === 2 && J.textoJugada(jj[0]) === 'c3×e5×g7', `hay que comer, y la que más come (${J.textoJugada(jj[0])})`);
  J.moverDamas(t, jj[0]);
  ok(!t.tablero[4][3] && !t.tablero[2][5] && t.tablero[1][6]?.de === 0, 'comidas las dos');
  // coronar y volar
  const k = J.damasNuevas();
  k.tablero = Array.from({ length: 8 }, () => Array(8).fill(null));
  k.tablero[1][2] = { de: 0, dama: false };
  k.tablero[7][0] = { de: 1, dama: false };
  k.turno = 0;
  J.moverDamas(k, J.jugadasDamas(k).find((j) => j.camino[1][0] === 0));
  ok(k.tablero[0].some((p) => p && p.de === 0 && p.dama), 'al llegar al fondo, dama');
  k.turno = 0;
  const vuela = J.jugadasDamas(k).filter((j) => k.tablero[j.camino[0][0]][j.camino[0][1]].dama);
  ok(vuela.some((j) => Math.abs(j.camino[1][0] - j.camino[0][0]) > 2), 'la dama vuela (más de una casilla)');
  ok(!J.moverDamas(k, { camino: [[0, 1], [5, 5]], comidas: [] }).ok, 'una jugada que no existe, no');
  // el rival juega legal y los partidos terminan
  let fin = 0;
  for (let s = 1; s <= 6; s++) {
    const g = J.damasNuevas({ empieza: s % 2 });
    let m = 0;
    while (g.terminado === null && m++ < 300) { const j = J.decidirDamas(g, s, 2); ok(J.moverDamas(g, j).ok, `la jugada del rival es legal (${s}, ${m})`); }
    if (g.terminado !== null) fin++;
  }
  ok(fin === 6, `6 partidos de damas terminan (gana uno o tablas: ${fin})`);
  const g = J.damasNuevas();
  ok(J.decidirDamas(g, 1, 3) && J.jugadasDamas(g).some((j) => J.textoJugada(j) === J.textoJugada(J.decidirDamas(g, 1, 3))), 'con profundidad 3, también');
}

// ============================================================ 3. la taba
{
  ok(J.tirarTaba(1, 0.1).resultado === 'corta' && J.tirarTaba(1, 0.1).gana === null, 'sin fuerza: no pasa la raya');
  ok(J.tirarTaba(1, 0.99).resultado === 'pasada' && J.tirarTaba(1, 0.99).gana === null, 'de más: se pasa');
  const cuenta = (f) => { const r = { suerte: 0, culo: 0, costado: 0 }; for (let s = 1; s <= 2000; s++) r[J.tirarTaba(s, f).resultado]++; return r; };
  const justa = cuenta(0.62), floja = cuenta(0.4);
  ok(justa.suerte > justa.culo && justa.suerte > 800, `con la fuerza justa, más suerte que culo (${justa.suerte} y ${justa.culo})`);
  ok(floja.suerte < justa.suerte && floja.culo > justa.culo, `floja, peor (${floja.suerte} y ${floja.culo})`);
  ok(justa.costado > 100, 'a veces cae de costado (se tira de nuevo)');
  ok(J.tirarTaba(5, 0.6).resultado === J.tirarTaba(5, 0.6).resultado, 'con semilla');
  ok(Object.keys(J.TEXTO_TABA).length === 5, 'lo que se dice de cada tiro');
}

console.log(`✓ 3.7.5 (juegos de mesa): ${n} comprobaciones`);
