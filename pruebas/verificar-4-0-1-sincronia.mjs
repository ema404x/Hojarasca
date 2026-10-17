// 4.0.1 · Sincronizar entre dos computadoras con los relojes desfasados (zona B, hallazgo 2) y la base de la carpeta (hallazgo 5).
// Se arman «dos computadoras» con dos almacenes y dos copias del módulo de guardado; la A tiene el reloj tres horas adelantado.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compararCopia } from '../src/sincronia.js';
import { empaquetar, leerPaquete } from '../src/transferir.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const almacen = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; }, clear: () => m.clear() }; };
const PC = { A: { ls: almacen(), mod: await import('../src/guardado.js?pcA'), desfase: 3 * 3600e3 }, B: { ls: almacen(), mod: await import('../src/guardado.js?pcB'), desfase: 0 } };
const realNow = Date.now.bind(Date);
function en(nombre, f) {
  const pc = PC[nombre];
  globalThis.localStorage = pc.ls;
  Date.now = () => realNow() + pc.desfase;
  try { return f(pc.mod); } finally { Date.now = realNow; }
}
const progresoDia = (mod, dia) => ({ ...mod.progresoNuevo(), dia });

// A (reloj +3 h) guarda el día 40 y lo exporta
const paqueteA = en('A', (G) => {
  assert.ok(G.guardarProgreso(progresoDia(G, 40)));
  const d = G.leerPartida('relax', 1);
  return leerPaquete(empaquetar({ progreso: d.progreso, fotos: d.fotos, modo: 'relax', ranura: 1 })).paquete;
});
assert.ok(paqueteA.progreso.secuencia >= 1, 'el paquete lleva la cuenta de guardados');
// B lo importa, carga y juega hasta el día 43 (varios guardados), y deja su copia en la carpeta
const paqueteB = en('B', (G) => {
  assert.ok(G.escribirPartida('relax', 1, paqueteA.progreso, paqueteA.fotos));
  let p = G.cargarProgreso();
  assert.equal(p.dia, 40, 'B cargó la partida de A');
  for (const dia of [41, 42, 43]) assert.ok(G.guardarProgreso({ ...p, dia }));
  const d = G.leerPartida('relax', 1);
  return leerPaquete(empaquetar({ progreso: d.progreso, fotos: d.fotos, modo: 'relax', ranura: 1 })).paquete;
});
assert.equal(paqueteB.progreso.dia, 43);
assert.ok(paqueteB.progreso.secuencia > paqueteA.progreso.secuencia, 'B siguió guardando sobre la cuenta de A');
// A vuelve a abrir: la de la carpeta es la misma partida seguida tres días en la otra computadora
const local = en('A', (G) => G.infoPartida('relax', 1));
assert.equal(local.dia, 40);
assert.ok(Math.abs(Number(paqueteB.progreso.guardadoEn) - Number(local.guardadoEn)) < 90e3, 'por el reloj, la diferencia no pasa el margen (el caso del hallazgo)');
assert.equal(compararCopia(local, paqueteB), 'ofrecer', 'aun así se ofrece: tiene más guardados');
// la de acá más nueva (se siguió jugando): no se ofrece
const sigue = en('A', (G) => { const p = G.cargarProgreso(); for (let i = 0; i < 8; i++) G.guardarProgreso({ ...p, dia: 44 + i }); return G.infoPartida('relax', 1); });
assert.equal(compararCopia(sigue, paqueteB), 'nada', 'si acá se guardó más, la carpeta no se ofrece');
// una partida de antes (sin cuenta) frente a una de la carpeta con cuenta y sello igual de nuevo
assert.equal(compararCopia({ hay: true, guardadoEn: 1000, dia: 3 }, { progreso: { guardadoEn: 1000, secuencia: 5, dia: 4 } }), 'ofrecer');
assert.equal(compararCopia({ hay: true, guardadoEn: 5000, secuencia: 9, dia: 3 }, { progreso: { guardadoEn: 1000, secuencia: 12, dia: 4 } }), 'nada', 'con el sello más viejo en la carpeta no se ofrece');

// la base de la carpeta se fija después de importar (si falla, no)
const main = leer('src/main.js');
assert.ok(main.includes("if (si) { const r2 = importarTexto(ranuraActual(), texto, false); if (r2?.ok === false) return; }\n  fijarBaseSync(enCarpeta);"), 'main.js: la base se fija recién cuando la importación anduvo');
// un álbum con una foto que no se pudo leer no se copia a la carpeta (la otra computadora lo importaría reemplazando y le borraría fotos)
{
  globalThis.localStorage = almacen();
  const G = await import('../src/guardado.js?pcC');
  assert.ok(G.guardarProgreso(G.progresoNuevo()));
  let incompleto = true;
  globalThis.hojarasca = { fotos: { leer: () => ({ fotos: { a: 'data:image/jpeg;base64,AAAA' }, sinLeer: incompleto ? 1 : 0 }), escribir: () => true, borrar() {} } };
  assert.equal(G.leerPartida('relax', 1).fotosIncompletas, true, 'se avisa que el álbum quedó incompleto');
  incompleto = false;
  assert.equal(G.leerPartida('relax', 1).fotosIncompletas, false, 'con todas las fotos leídas, no');
  delete globalThis.hojarasca;
}
assert.ok(main.includes('function textoParaExportar(ranura, paraCarpeta = false)') && main.includes('if (paraCarpeta && datos.fotosIncompletas) return null;') && main.includes('textoParaExportar(ranuraActual(), true)'), 'main.js: la copia a la carpeta se salta con el álbum incompleto');
console.log('4.0.1 sincronía: relojes desfasados y base de la carpeta ok');
