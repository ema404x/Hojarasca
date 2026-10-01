// 1.7 — los encargos dejan de ser una lista suelta: cada uno puede pedir que antes
// hayas cerrado otros, y la tanda entera termina en un cierre.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ENCARGOS, ENCARGO, estadoEncargo, faltanPara, encargoDe, resumenEncargos, pistaTrabado } from '../src/encargos.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
// 1.10: Ercilia también pide, pero sólo después de que le llega la carta.
const QUIENES = ['ema', 'ramon', 'nicanor', 'guarda', 'ercilia'];

// ---------------------------------------------------------------- el grafo cierra
const ids = new Set(ENCARGOS.map((e) => e.id));
assert.equal(ids.size, ENCARGOS.length, 'no hay ids repetidos');
for (const e of ENCARGOS) {
  assert.ok(QUIENES.includes(e.quien), `${e.id} no tiene quién lo pida`);
  assert.ok(e.titulo && e.pedido && e.resumen && e.listo, `${e.id} incompleto`);
  for (const r of e.requiere || []) {
    assert.ok(ids.has(r), `${e.id} pide un encargo que no existe: ${r}`);
    assert.notEqual(r, e.id, `${e.id} no puede pedirse a sí mismo`);
  }
}

// Sin ciclos: por orden topológico. Si alguna vuelta no destraba nada, hay un nudo.
const hechos = new Set();
let vueltas = 0;
while (hechos.size < ENCARGOS.length) {
  const antes = hechos.size;
  for (const e of ENCARGOS) {
    if (hechos.has(e.id)) continue;
    if ((e.requiere || []).every((r) => hechos.has(r))) hechos.add(e.id);
  }
  assert.notEqual(hechos.size, antes, 'hay un ciclo: ningún encargo se destraba');
  assert.ok(++vueltas <= ENCARGOS.length, 'el grafo no converge');
}

// ---------------------------------------------------------------- estados
const vacio = { encargos: {} };
assert.equal(estadoEncargo(vacio, ENCARGO['e-arboles']), 'disponible', 'el primero de Ema arranca abierto');
assert.equal(estadoEncargo(vacio, ENCARGO['e-banco']), 'trabado', 'el banco espera a la madera');
assert.deepEqual(faltanPara(vacio, ENCARGO['e-banco']), ['e-madera']);
assert.equal(estadoEncargo({ encargos: { 'e-madera': 'hecho' } }, ENCARGO['e-banco']), 'disponible');
assert.equal(estadoEncargo({ encargos: { 'e-madera': 'pedido' } }, ENCARGO['e-banco']), 'trabado',
  'pedido no alcanza: hay que cerrarlo');
assert.equal(estadoEncargo({ encargos: { 'e-banco': 'pedido' } }, ENCARGO['e-banco']), 'pedido',
  'una vez pedido, el estado manda sobre los requisitos');
assert.equal(estadoEncargo({ encargos: { 'e-banco': 'hecho' } }, ENCARGO['e-banco']), 'hecho');

// la pista dice qué falta, y no se va de largo
assert.equal(pistaTrabado(vacio, ENCARGO['e-banco']), 'Antes hay que cerrar «Madera para el invierno».');
assert.match(pistaTrabado(vacio, ENCARGO['e-renovales']), /^Antes hay que cerrar «.+» y «.+»\.$/);
assert.equal(pistaTrabado(vacio, ENCARGO['e-valle']), `Antes hay que cerrar otros ${ENCARGOS.length - 1} encargos.`);
assert.match(pistaTrabado(vacio, ENCARGO['e-verdura']), /tiene que llegarte una carta/, 'lo de Ercilia espera la carta');
assert.equal(pistaTrabado(vacio, ENCARGO['e-arboles']), '', 'lo disponible no tiene nada que avisar');

// ---------------------------------------------------------------- cada vecino abre por donde debe
const abre = Object.fromEntries(QUIENES.filter((q) => q !== 'ercilia').map((q) => [q, encargoDe(vacio, q)?.e.id]));
assert.deepEqual(abre, { ema: 'e-arboles', ramon: 'e-madera', nicanor: 'e-pesca', guarda: 'e-chinches' },
  'Ramón abre enseñando a sacar madera, que es lo que dice su propio texto');
assert.equal(encargoDe(vacio, 'ercilia'), null, 'Ercilia no pide nada hasta que la trochita trae la primera carta');
assert.equal(encargoDe({ encargos: {}, entradas: { 'c-casa': {} } }, 'ercilia').e.id, 'e-correo',
  'con la primera carta leída, abre por contestarla');

// cobrar lo cumplido va antes que ofrecer algo nuevo
const conDeuda = { encargos: { 'e-madera': 'pedido' }, materiales: { tabla: 12 }, acopio: {} };
const r = encargoDe(conDeuda, 'ramon');
assert.equal(r.modo, 'listo');
assert.equal(r.e.id, 'e-madera');

// ---------------------------------------------------------------- la tanda entera se puede terminar
// Se juega el hilo hasta el final: cada vuelta, cada vecino ofrece o cobra.
// Las cartas se dan por leídas: el correo tiene su propia prueba (verificar-correo).
const p = { encargos: {}, entradas: { 'c-casa': {}, 'c-esquel': {}, 'c-tejedora': {} } };
const cumplirTodo = new Set();
let pasos = 0;
for (;;) {
  let algo = false;
  for (const q of QUIENES) {
    const o = encargoDe({ ...p, encargos: p.encargos }, q);
    if (!o) continue;
    algo = true;
    if (o.modo === 'pedido') { p.encargos[o.e.id] = 'pedido'; cumplirTodo.add(o.e.id); }
  }
  // lo que está pedido se da por cumplido (acá no se juega, se prueba el hilo)
  for (const id of cumplirTodo) if (p.encargos[id] === 'pedido') p.encargos[id] = 'hecho';
  if (!algo) break;
  assert.ok(++pasos <= ENCARGOS.length * 3, 'el hilo no avanza');
}
const fin = resumenEncargos(p);
assert.equal(fin.hechos, ENCARGOS.length, 'se llega a cerrar todo');
assert.equal(fin.trabados, 0, 'no queda ninguno trabado para siempre');
assert.equal(fin.terminado, true);

// ---------------------------------------------------------------- el cierre
const cierres = ENCARGOS.filter((e) => e.cierre);
assert.equal(cierres.length, 1, 'un solo cierre');
const cierre = cierres[0];
assert.equal(cierre.id, 'e-valle');
assert.equal(cierre.quien, 'ema', 'Ema abrió la lista y la cierra');
assert.equal(cierre.requiere.length, ENCARGOS.length - 1, 'el cierre depende de todos los demás');
assert.ok(!cierre.requiere.includes(cierre.id));
assert.equal(cierre.cumplido({ encargos: {} }), false);
const todosMenosCierre = Object.fromEntries(ENCARGOS.filter((e) => !e.cierre).map((e) => [e.id, 'hecho']));
assert.equal(cierre.cumplido({ encargos: todosMenosCierre }), true, 'se cumple cuando no queda nada más');
assert.deepEqual(cierre.premio.cosas, ['mosca', 'farol', 'manta', 'yerba']);
assert.ok(cierre.premio.texto);

// ---------------------------------------------------------------- cableado
const main = leer('src/main.js'), cuaderno = leer('src/cuaderno.js');
assert.match(main, /import \{ ENCARGOS, ENCARGO, encargoDe, estadoEncargo, pistaTrabado, resumenEncargos \}/);
assert.match(main, /const suyo = encargoDe\(progreso, npc\.clave\)/, 'la charla sigue el hilo');
assert.ok(!/const pendiente = mios\.find\(\(e\) => !progreso\.encargos\[e\.id\]\)/.test(main),
  'ya no se ofrece el primero suelto sin mirar los requisitos');
assert.match(main, /for \(const c of premio\.cosas \|\| \[\]\) progreso\.cosas\[c\] = 1;/,
  'el cierre puede dejar varias cosas');
assert.match(main, /estadoEncargo\(progreso, enc\) === 'trabado'/, 'el cuaderno avisa qué falta antes');
assert.match(main, /\$\{enc\.hechos\} de \$\{enc\.total\} encargos/, 'la pausa muestra cuántos van');
assert.ok(cuaderno.includes("id: 'e-valle', seccion: 'encargos'"), 'el cierre tiene su ficha en el cuaderno');

console.log('encargos con hilo: ok ·', ENCARGOS.length, 'encargos ·',
  ENCARGOS.filter((e) => e.requiere?.length).length, 'encadenados · cierre en «' + cierre.titulo + '»');
