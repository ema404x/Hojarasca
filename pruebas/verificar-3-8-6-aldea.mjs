// 3.8.6 (aldea): pase de bugs de la aldea, los vecinos, el amor y las tradiciones. Una comprobación por arreglo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as AM from '../src/amor.js';
import * as AL from '../src/aldea.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const sinCR = (f) => ok(!leer(f).includes('\r'), `${f}: fines de línea LF`);
const aldeaCompleta = () => { const a = AL.aldeaNueva(); a.pobladores = AL.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 })); a.locales = Object.fromEntries(AL.LOTES_ALDEA.map((l) => [l, 1])); return AL.sanearAldea(a); };

// ---------------------------------------------------------------- 1. amor: reconquistar con la vida rehecha
{
  const aldea = aldeaCompleta();
  const progreso = (dia, personas, extra = {}) => ({ dia, horas: 10, aldea, vecindad: {}, amor: AM.sanearAmor({ personas, ...extra }, dia) });
  const sep = { etapa: 'separados', afecto: 80, desde: 20, contacto: 30, reconquista: 2 };
  const k = AM.ORDEN_CANDIDATAS.filter((x) => x !== 'fotografa').find((x) => AM.puedeRomance(x, progreso(1, {})).ok);
  // de novio con otra (pasada la estación), volver con la ex: la novia se entera y corta (antes quedabas casado y de novio)
  const p = progreso(30, { fotografa: { ...sep }, [k]: { etapa: 'novios', afecto: 50, desde: 26, contacto: 30 } }, { conyuge: 'fotografa' });
  let r = null;
  for (let s = 0; s < 40 && !r?.si; s++) { p.amor.personas.fotografa.rechazo = 0; r = AM.reconquistar(p, 'fotografa', { semilla: s, lugar: 'mirador' }); }
  ok(r?.si && p.amor.personas.fotografa.etapa === 'casados', 'amor: con la vida rehecha, la reconquista sigue');
  ok(p.amor.personas[k].etapa === 'conocidos' && r.cortaron.includes(k), 'amor: la novia nueva se entera y corta (como al proponer)');
  ok(p.amor.conyuge === 'fotografa', 'amor: la que vuelve es la cónyuge');
  // comprometido con otra: no se puede volver con la ex
  const q = progreso(30, { fotografa: { ...sep }, [k]: { etapa: 'comprometidos', afecto: 70, desde: 27, contacto: 30 } }, { conyuge: 'fotografa', anillo: { pedido: 22, listo: 25, retirado: true, para: k }, boda: { con: k, dia: 31 } });
  const rq = AM.reconquistar(q, 'fotografa', { semilla: 1, lugar: 'mirador' });
  ok(!rq.ok && rq.motivo === 'tenes-pareja' && q.amor.personas.fotografa.etapa === 'separados', 'amor: comprometido con otra, la ex no vuelve (quedaban dos parejas)');
  // casado de nuevo y separado otra vez (recién): la primera tampoco vuelve; pasada la estación, sí, y es la cónyuge
  const w = progreso(40, { fotografa: { ...sep }, [k]: { etapa: 'separados', afecto: 20, desde: 38, contacto: 38 } }, { conyuge: k });
  ok(AM.reconquistar(w, 'fotografa', { semilla: 1 }).motivo === 'tenes-pareja', 'amor: recién separado de la segunda, la primera no vuelve todavía');
  w.dia = 43;
  let rw = null;
  for (let s = 0; s < 40 && !rw?.si; s++) { w.amor.personas.fotografa.rechazo = 0; rw = AM.reconquistar(w, 'fotografa', { semilla: s, lugar: 'mirador' }); }
  ok(rw?.si && w.amor.conyuge === 'fotografa' && Object.hasOwn(w.amor.habilidades, 'fotografa'), 'amor: la que vuelve pasa a ser la cónyuge (antes seguía la otra: sin habilidades ni hijos)');
  ok(leer('src/amor-juego.js').includes("for (const o of r.cortaron || []) avisar(`${nombre(o)} se enteró`, 'Ya no salen más');   // 3.8.6: como al proponer"), 'amor-juego: avisa a quién cortó');
  sinCR('src/amor.js');
}

console.log(`verificar-3-8-6-aldea: ${n} comprobaciones OK`);
