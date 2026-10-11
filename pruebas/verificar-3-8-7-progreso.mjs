// 3.8.7 (progreso): el pase de bugs de la historia, los eventos del valle, las carreras, los oficios, los logros, el
// cuaderno, la pesca, el clima y Personalizar. Una comprobación por arreglo.
// 1. El temporal del capítulo 8: contestada la tarjeta, no vuelve (se tilda al otro día y el «lanzado pero perdido» la
//    volvía a pedir cada medio segundo hasta la medianoche, cobrando cada vez); un temporal del mismo capítulo no trae otro.
//    Y se tilda a la mañana (las 7, cuando termina la tormenta forzada), no a la medianoche en plena tormenta.
// 2. El diario: «una lenga» (plantada o partida por un rayo, también en la nota), tres historias no son «dos», y varios
//    encargos van en plural.
// 3. El pronóstico de la estación sigue el programa que sigue el clima (con la noche del temporal y la gran nevada
//    forzadas encima): antes anunciaba la semilla sola y esos días no se cumplía. Con el clima fijo despejado, nada se fuerza.
// 4. La nevada no es tormenta ni hace crecer el arroyo: caían rayos y el diario decía «Tormenta» en un día de «Nevada», y
//    el arroyo venía turbio con cada nevada (no picaba nada en el arroyo en todo el invierno).
// 5. Las tarjetas de la historia y del valle no salen con un panel del HUD abierto (la cocina, el taller del tren, las
//    fiestas); «Largar de nuevo» esconde el fantasma de la vuelta anterior.
// 6. La visita que trae un evento del valle (Nicanor ya camina, Ercilia vuelve de Esquel) cuenta como recibida al llegar
//    (el capítulo 8 no la tomaba) y al irse no le quita el turno al que le tocaba.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const HI = await import('../src/historia.js');
const EV = await import('../src/eventos-valle.js');
const DI = await import('../src/diario.js');
const ME = await import('../src/meteo.js');
const VI = await import('../src/visitas.js');

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };

// ---------------------------------------------------------------- 1. el temporal del capítulo 8
{
  const p = { dia: 20, horas: 12, entradas: {}, visitas: { cuenta: 0 }, eventosValle: EV.eventosValleNuevos(() => 0.5) };
  const h = HI.sanearHistoria({ activa: true, capitulo: 7, fase: 'jugando', empezada: 1, hechos: { 'temporal:visita': 20, 'temporal:cuento': 20 }, base: { dia: 20 } });
  let s = HI.estadoHistoria(p, {});
  eq(HI.momentoPendiente(h, s), 'temporal', 'con lo demás hecho, llega el temporal');
  ok(EV.forzarEvento(p.eventosValle, 'temporal', 20), 'se fuerza la tarjeta');
  HI.momentoLanzado(h);
  ok(EV.elegirOpcion(p.eventosValle, 'lena', 20).ok, 'se contesta');
  s = HI.estadoHistoria(p, {});
  eq([HI.momentoPendiente(h, s), HI.momentoPerdido(h, s)], [null, null], 'contestada, no se vuelve a pedir (el objetivo se tilda al otro día)');
  eq(HI.revisarHistoria(h, s).completo, false, 'el mismo día todavía no se tilda');
  p.dia = 21; p.horas = 0.5;
  eq(HI.revisarHistoria(HI.sanearHistoria(h), HI.estadoHistoria(p, {})).completo, false, 'a la medianoche, en plena tormenta, todavía no');
  p.horas = HI.FIN_TEMPORAL;
  eq(HI.revisarHistoria(HI.sanearHistoria(h), HI.estadoHistoria(p, {})).completo, true, 'a la mañana, sí');
  p.dia = 23; p.horas = 2;
  eq(HI.revisarHistoria(HI.sanearHistoria(h), HI.estadoHistoria(p, {})).completo, true, 'días después, sí');
  ok(leer('src/main.js').includes('hasta = horaAbsoluta(d + 1, FIN_TEMPORAL);'), 'la tormenta forzada termina a la misma hora');
  // lanzado pero perdido de verdad (la tarjeta no llegó a contestarse y se perdió): se vuelve a pedir
  const h2 = HI.sanearHistoria({ activa: true, capitulo: 7, fase: 'jugando', empezada: 1, hechos: {}, base: { dia: 20 }, momentos: { temporal: 'lanzado' } });
  eq(HI.momentoPerdido(h2, HI.estadoHistoria({ dia: 20, eventosValle: { hechos: {} } }, {})), 'temporal', 'perdido de verdad, vuelve');
  eq(HI.momentoPerdido(h2, HI.estadoHistoria({ dia: 20, eventosValle: { hechos: { temporal: { dia: 12 } } } }, {})), 'temporal', 'un temporal de antes del capítulo no cuenta');
  // un temporal al azar del mismo capítulo: no trae otro el mismo día
  const h3 = HI.sanearHistoria({ activa: true, capitulo: 7, fase: 'jugando', empezada: 1, hechos: { 'temporal:visita': 20, 'temporal:cuento': 20 }, base: { dia: 19 } });
  eq(HI.momentoPendiente(h3, HI.estadoHistoria({ dia: 20, eventosValle: { hechos: { temporal: { dia: 20, opcion: 'atar' } } } }, {})), null, 'un temporal al azar en el capítulo no trae otro');
  ok(leer('src/historia-ui.js').includes('else if (!m && momentoPerdido(h, s) && !eventos.ev().activo) eventos.forzar(def.evento);'), 'la historia en pantalla usa momentoPerdido');
}

// ---------------------------------------------------------------- 2. el diario
{
  const r = () => 0;
  const d = DI.crearDiario();
  d.anotar('renoval', 'lenga'); d.anotar('rayo', 'lenga');
  for (const x of ['el lago', 'el pehuén', 'la nevada']) d.anotar('historia', x);
  d.anotar('encargo', 'la leña de Ramón'); d.anotar('encargo', 'las moscas de Nicanor');
  const t = d.cerrar(3, 'otono', r).texto;
  ok(t.includes('Planté una lenga en un claro') && t.includes('Partió una lenga de arriba abajo'), `una lenga (${t})`);
  ok(t.includes('Escuché 3 historias: el lago, el pehuén y la nevada.'), 'tres historias');
  ok(t.includes('Terminé los encargos: la leña de Ramón y las moscas de Nicanor.'), 'los encargos en plural');
  d.anotar('renoval', 'coihue'); d.anotar('historia', 'a'); d.anotar('historia', 'b'); d.anotar('encargo', 'x');
  const t2 = d.cerrar(4, 'otono', r).texto;
  ok(t2.includes('Planté un coihue') && t2.includes('Escuché dos historias: a y b.') && t2.includes('Terminé el encargo: x.'), 'lo de siempre igual');
  ok(leer('src/main.js').includes('nota(`Un rayo partió ${unArbol(especie)} ${rumboDesde(js.pos, a)}`'), 'la nota del rayo también');
}

// ---------------------------------------------------------------- 3. el pronóstico que se cumple
{
  // un día de buen tiempo en la semilla, con la noche forzada a lluvia y viento fuerte
  let semilla = 1, dia = 5;
  while (ME.pronosticoDia(semilla, dia, { modo: 'despejado' }) && ME.caracterDelDia(semilla, dia) !== 'bueno') semilla++;
  const forzado = (k) => (k * 3 >= dia * 24 + 18 ? 'lluvia' : ME.tipoEnTramo(semilla, k));
  const sin = ME.pronosticoDia(semilla, dia, {});
  const con = ME.pronosticoDia(semilla, dia, { tipo: forzado, viento: (k) => (forzado(k) === 'lluvia' ? 0.42 : ME.vientoEnTramo(semilla, k)) });
  ok(!sin.lluvia && con.lluvia && con.tormenta && con.viento === 'fuerte' && /a la noche/.test(con.texto), `con el programa, la noche del temporal se anuncia (${sin.texto} → ${con.texto})`);
  eq(ME.pronostico(semilla, dia, 12, { tipo: forzado })[0].lluvia, true, 'y el pronóstico de varios días lo pasa');
  const main = leer('src/main.js');
  ok(main.includes('tipo: programaTramos.tipo, viento: programaTramos.viento });') && main.includes("fijo = () => ajustes.clima === 'despejado';"), 'main.js anuncia con el programa, y en despejado no fuerza');
}

// ---------------------------------------------------------------- 4. la nevada
{
  const cl = leer('src/clima.js');
  ok(cl.includes('estado.tormenta = estado.lluvia > 0.62 && estado.nublado > 0.7 && inviernoAhora < 0.5;') && cl.includes('inviernoAhora = Number(mundo?.invierno) || 0;'), 'en la nevada no hay tormenta');
  const main = leer('src/main.js');
  ok(main.includes('const nieva = U.uInvierno.value > 0.5;') && main.includes('st.crecida = avanzarCrecida(st.crecida, nieva ? 0 : clima.estado.lluvia, dh);'), 'la nieve no hace crecer el arroyo');
}

// ---------------------------------------------------------------- 5. las tarjetas y los paneles; el fantasma
{
  const main = leer('src/main.js');
  ok(main.includes('libre: () => !charla.npc && !panelDelHudAbierto() && !modoObra'), 'la tarjeta espera a que se cierre el panel');
  ok(/const panelDelHudAbierto = \(\) => enElAlmacen \|\| enLaFeria \|\| enLasCargas\(\) \|\| mochilaAbierta .*cocinaJuego\?\.panelAbierto\(\).*tallerTren\?\.panelAbierto\(\).*fiestasJuego\?\.panelAbierto\(\)/.test(main), 'y el panel abierto incluye la cocina, el taller y las fiestas');
  ok(leer('src/modos-juego.js').includes('mundo?.marcarSiguiente(0);\n    mundo?.ponerFantasma(null);'), 'largar esconde el fantasma');
}

// ---------------------------------------------------------------- 6. la visita de un evento
{
  const v = VI.sanearVisitas({ ultima: 1, cuenta: 2, recibidas: 2, activa: null });
  const p = { dia: 10, visitas: v, entradas: {}, eventosValle: { hechos: {} } };
  const h = HI.sanearHistoria({ activa: true, capitulo: 7, fase: 'jugando', empezada: 1, base: HI.baseDe(HI.estadoHistoria(p, {})) });
  VI.visitaFueraDeTurno(v, 'nicanor', 10);
  eq(VI.recibidas(v), 2, 'todavía no llegó: no cuenta');
  const g = VI.sanearVisitas(JSON.parse(JSON.stringify(v)));
  ok(g.activa.fueraDeTurno === true && g.activa.contada === false, 'se guarda fuera de turno');
  ok(VI.llegoVisita(v) && !VI.llegoVisita(v), 'al llegar cuenta, una sola vez');
  eq(VI.recibidas(v), 3, 'recibida');
  ok(HI.revisarHistoria(h, HI.estadoHistoria(p, {})).nuevos.some((o) => o.id === 'visita'), 'y el capítulo 8 la toma');
  VI.terminarVisita(v, 10);
  eq([v.cuenta, VI.quienViene(v.cuenta)], [2, 'ema'], 'el turno sigue en el que le tocaba');
  ok(leer('src/eventos-valle-ui.js').includes('visitaFueraDeTurno(v, f.quien, p.dia);') && leer('src/main.js').includes('else if (llegoVisita(v)) guardar();'), 'el evento y la llegada la usan');
}

console.log(`verificar-3-8-7-progreso: ${pasos} comprobaciones OK`);
