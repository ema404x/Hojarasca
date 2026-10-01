// 1.6: el Relax con rumbo — primer día guiado y encargos nuevos con recompensa.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { PASOS_RELAX, PREMIO_RELAX, avanzarRelax } from '../src/relax-tutorial.js';
import { ENCARGOS, ENCARGO } from '../src/encargos.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---- el primer día
assert.equal(PASOS_RELAX.length, 6);
for (const p of PASOS_RELAX) assert.ok(p.id && p.texto && p.tecla && typeof p.hecho === 'function', `paso mal armado: ${p.id}`);
const vacio = { ramitas: 0, fuego: false, anotaciones: 0, troncos: 0, tablas: 0, obras: 0 };
assert.deepEqual(avanzarRelax(0, vacio).hechos, [], 'al empezar no hay nada tildado');
assert.deepEqual(avanzarRelax(0, { ...vacio, ramitas: 3 }).hechos, ['ramitas']);
const casi = { ramitas: 3, fuego: true, anotaciones: 2, troncos: 4, tablas: 2, obras: 0 };
assert.deepEqual(avanzarRelax(0, casi).hechos, ['ramitas', 'fuego', 'anotar', 'madera', 'tablas']);
assert.equal(avanzarRelax(0, casi).terminado, false);
const todo = { ...casi, obras: 1 };
assert.equal(avanzarRelax(0, todo).terminado, true);
assert.equal(avanzarRelax(PASOS_RELAX.length, vacio).terminado, true, 'una vez terminado no vuelve atrás');
assert.ok(PREMIO_RELAX.ramitas > 0 && PREMIO_RELAX.materiales.tabla > 0);

// ---- encargos nuevos
const nuevos = ['e-madera', 'e-banco', 'e-acopio', 'e-renovales', 'e-chinches', 'e-nocheagua'];
for (const id of nuevos) {
  const e = ENCARGO[id];
  assert.ok(e, `falta el encargo ${id}`);
  assert.ok(e.pedido && e.resumen && e.listo && typeof e.cumplido === 'function', `${id} incompleto`);
  assert.ok(e.premio && (e.premio.materiales || e.premio.ramitas || e.premio.cosa), `${id} no deja nada a cambio`);
  assert.ok(e.premio.texto, `${id} no dice qué te dejaron`);
  assert.ok(['ema', 'ramon', 'nicanor', 'guarda'].includes(e.quien), `${id} no tiene quién lo pida`);
}
// 17 de la 1.6, el cierre de la 1.7, y en la 1.10 los tres de Ercilia y el zaino de Ramón.
assert.equal(ENCARGOS.length, 22);
assert.equal(ENCARGOS.filter((e) => e.cierre).length, 1);
// cada uno se cumple con lo que corresponde, y no antes
const base = { materiales: {}, acopio: {}, obras: [], renovales: [], chinches: [], peces: {}, entradas: {}, pescaTarde: 0 };
assert.equal(ENCARGO['e-madera'].cumplido(base), false);
assert.equal(ENCARGO['e-madera'].cumplido({ ...base, materiales: { tabla: 8 }, acopio: { tabla: 4 } }), true, 'las tablas del acopio también cuentan');
assert.equal(ENCARGO['e-banco'].cumplido({ ...base, obras: [{ plano: 'banco-trabajo', etapas: 1 }] }), true);
assert.equal(ENCARGO['e-acopio'].cumplido({ ...base, obras: [{ plano: 'acopio', etapas: 1 }], acopio: { tronco: 10, piedra: 10 } }), true);
assert.equal(ENCARGO['e-acopio'].cumplido({ ...base, obras: [{ plano: 'acopio', etapas: 1 }], acopio: { tronco: 4 } }), false);
assert.equal(ENCARGO['e-renovales'].cumplido({ ...base, renovales: [1, 2, 3] }), true);
assert.equal(ENCARGO['e-chinches'].cumplido({ ...base, chinches: [1, 2, 3] }), true);
assert.equal(ENCARGO['e-nocheagua'].cumplido({ ...base, pescaTarde: 2 }), true);

// ---- cableado
const main = leer('src/main.js'), cuaderno = leer('src/cuaderno.js'), guardado = leer('src/guardado.js');
for (const id of nuevos) assert.ok(cuaderno.includes(`id: '${id}', seccion: 'encargos'`), `el encargo ${id} no está en el cuaderno`);
assert.match(main, /function cobrarPremio\(e\)/, 'los encargos tienen que pagar el premio');
assert.match(main, /registrar\(e\.id\); cobrarPremio\(e\);/);
assert.match(main, /revisarGuiaRelax\(dt\)/);
assert.match(main, /progreso\.pescaTarde = \(progreso\.pescaTarde \|\| 0\) \+ 1/);
assert.match(guardado, /guiaDia: Math\.max\(0, Math\.floor\(finito\(p\.guiaDia, 0\)\)\)/);
assert.match(guardado, /guiaPrimerDia: typeof x\.guiaPrimerDia === 'boolean'/);
assert.match(leer('src/plantilla.html'), /data-ajuste="guiaPrimerDia"/);
console.log('relax: ok ·', PASOS_RELAX.length, 'pasos del primer día y', nuevos.length, 'encargos nuevos');
