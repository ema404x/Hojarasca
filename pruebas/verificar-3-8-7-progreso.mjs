// 3.8.7 (progreso): el pase de bugs de la historia, los eventos del valle, las carreras, los oficios, los logros, el
// cuaderno, la pesca, el clima y Personalizar. Una comprobación por arreglo.
// 1. El temporal del capítulo 8: contestada la tarjeta, no vuelve (se tilda al otro día y el «lanzado pero perdido» la
//    volvía a pedir cada medio segundo hasta la medianoche, cobrando cada vez); un temporal del mismo capítulo no trae otro.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const HI = await import('../src/historia.js');
const EV = await import('../src/eventos-valle.js');

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
  p.dia = 21;
  eq(HI.revisarHistoria(HI.sanearHistoria(h), HI.estadoHistoria(p, {})).completo, true, 'al otro día, sí');
  // lanzado pero perdido de verdad (la tarjeta no llegó a contestarse y se perdió): se vuelve a pedir
  const h2 = HI.sanearHistoria({ activa: true, capitulo: 7, fase: 'jugando', empezada: 1, hechos: {}, base: { dia: 20 }, momentos: { temporal: 'lanzado' } });
  eq(HI.momentoPerdido(h2, HI.estadoHistoria({ dia: 20, eventosValle: { hechos: {} } }, {})), 'temporal', 'perdido de verdad, vuelve');
  eq(HI.momentoPerdido(h2, HI.estadoHistoria({ dia: 20, eventosValle: { hechos: { temporal: { dia: 12 } } } }, {})), 'temporal', 'un temporal de antes del capítulo no cuenta');
  // un temporal al azar del mismo capítulo: no trae otro el mismo día
  const h3 = HI.sanearHistoria({ activa: true, capitulo: 7, fase: 'jugando', empezada: 1, hechos: { 'temporal:visita': 20, 'temporal:cuento': 20 }, base: { dia: 19 } });
  eq(HI.momentoPendiente(h3, HI.estadoHistoria({ dia: 20, eventosValle: { hechos: { temporal: { dia: 20, opcion: 'atar' } } } }, {})), null, 'un temporal al azar en el capítulo no trae otro');
  ok(leer('src/historia-ui.js').includes('else if (!m && momentoPerdido(h, s) && !eventos.ev().activo) eventos.forzar(def.evento);'), 'la historia en pantalla usa momentoPerdido');
}

console.log(`verificar-3-8-7-progreso: ${pasos} comprobaciones OK`);
