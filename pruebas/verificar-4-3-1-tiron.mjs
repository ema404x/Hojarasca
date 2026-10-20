// 4.3.1: la cola con presupuesto por cuadro (src/cola-presupuesto.js) y el análisis de la herramienta de caminata.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { crearColaPresupuesto } from '../src/cola-presupuesto.js';
const require = createRequire(import.meta.url);
const { resumir, atribuir, q } = require('../herramientas/caminata-analisis.cjs');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// reloj simulado: cada tarea cuesta lo que dice
let ahora = 0; const reloj = () => ahora;
const tarea = (ms, log, id) => () => { ahora += ms; log.push(id); };
{
  const c = crearColaPresupuesto({ presupuestoMs: 1.0, reloj }); const log = [];
  for (let i = 0; i < 6; i++) c.encolar('b' + i, i, tarea(0.4, log, i));
  let cuadros = 0; while (c.pendientes) { c.procesar(); cuadros++; }
  ok(cuadros === 2 && log.join() === '0,1,2,3,4,5', `reparte 6 tareas de 0,4 ms en 2 cuadros (tuvo ${cuadros}) y por orden de prioridad`);
  ok(c.stats.pico <= 1.2 + 1e-9, `ningún cuadro pasa del presupuesto más una tarea (pico ${c.stats.pico.toFixed(2)})`);
}
{
  const c = crearColaPresupuesto({ presupuestoMs: 0.1, reloj }); const log = [];
  c.encolar('a', 1, tarea(5, log, 'a')); c.encolar('b', 0, tarea(5, log, 'b'));
  ok(c.procesar() === 1 && log[0] === 'b', 'aunque la tarea sola exceda el presupuesto, siempre se hace una por cuadro y primero la de menor prioridad');
  ok(c.procesar() === 1 && c.pendientes === 0, 'y la otra en el cuadro siguiente: nada espera para siempre');
}
{
  const c = crearColaPresupuesto({ presupuestoMs: 1, reloj }); const log = [];
  c.encolar('x', 5, tarea(0.1, log, 'viejo')); c.encolar('x', 5, tarea(0.1, log, 'nuevo'));
  c.procesar();
  ok(log.join() === 'nuevo' && c.stats.reemplazadas === 1, 'pedir la misma clave reemplaza a la anterior (no apila trabajo viejo)');
  c.encolar('y', 1, tarea(0.1, log, 'y')); ok(c.cancelar('y') && c.procesar() === 0, 'cancelar saca la tarea');
}
{   // empate de prioridad: el que entró primero
  const c = crearColaPresupuesto({ presupuestoMs: 10, reloj }); const log = [];
  c.encolar('p', 1, tarea(0, log, 'p')); c.encolar('q', 1, tarea(0, log, 'q')); c.procesar();
  ok(log.join() === 'p,q', 'a igual prioridad, por orden de pedido');
}
// el análisis de la herramienta
{
  const N = 200, z = () => new Array(N).fill(0), d = { n: N, t: Array.from({ length: N }, (_, i) => i * 16.7), cpu: z().map(() => 5), int: z().map(() => 16.7), veg: z(), obj: z(), pasto: z(), soto: z(), amb: z(), cli: z(), fau: z(), npc: z(), des: z(), ren: z().map(() => 4), prog: z(), geo: z(), tex: z(), gc: z(), x: z(), z: z() };
  d.cpu[50] = 40; d.veg[50] = 30; d.cpu[90] = 60; d.ren[90] = 58; d.geo[90] = 6; d.cpu[120] = 30; d.soto[120] = 20; d.ren[120] = 24;
  const r = resumir(d); const a = atribuir(d, 25);
  ok(r.cpu.mas25 === 3 && r.cpu.mas50 === 1 && r.cpu.mas167 === 3, 'cuenta los cuadros que pasan de 16,7 / 25 / 50 ms');
  ok(a.por.vegetacion === 1 && a.por['bloques-soto'] === 1 && a.por['dibujo(resto)'] === 1, 'atribuye cada cuadro lento al sistema que más pesó');
  ok(a.lentos.find((l) => l.i === 90).geo === 6, 'anota las geometrías nuevas del cuadro lento');
  ok(q([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95) === 10, 'percentil');
}
console.log(`verificar-4-3-1-tiron: ${n} comprobaciones OK`);
