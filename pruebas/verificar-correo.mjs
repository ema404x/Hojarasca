// 1.10 — el correo: cartas que llegan con la trochita y los encargos de Ercilia.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { CARTAS, CARTA, correoNuevo, sanearCorreo, repartir, porRetirar, cartasLeidas, partesDeCarta } from '../src/correo.js';
import { ENCARGOS, ENCARGO, estadoEncargo, encargoDe, faltaCarta } from '../src/encargos.js';
import { ENTRADA, SECCIONES } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- las cartas
assert.ok(CARTAS.length >= 5);
assert.equal(new Set(CARTAS.map((c) => c.id)).size, CARTAS.length);
for (const c of CARTAS) {
  assert.ok(c.de && Array.isArray(c.texto) && c.texto.length >= 2 && typeof c.llega === 'function', `${c.id} mal armada`);
  assert.ok(ENTRADA[c.id] && ENTRADA[c.id].seccion === 'cartas', `${c.id} no queda en el cuaderno`);
}
assert.ok(SECCIONES.some((s) => s.id === 'cartas'));

// ---------------------------------------------------------------- el reparto
const p = { entradas: {}, obras: [], encargos: {}, vueltas: 0 };
const k = correoNuevo();
assert.equal(repartir(k, p, 1), null, 'el primer día no llega nada');
assert.equal(repartir(k, p, 2).id, 'c-casa', 'la primera carta es de casa');
assert.equal(repartir(k, p, 2), null, 'una carta por día, aunque el tren pare de nuevo');
assert.equal(repartir(k, p, 3), null, 'lo de Esquel no llega si no tenés dónde sembrar');
p.obras.push({ plano: 'cantero', etapas: 1 });
assert.equal(repartir(k, p, 3).id, 'c-esquel', 'con el cantero hecho, Rosa escribe');
p.entradas.oveja = {};
p.vueltas = 1;
assert.equal(repartir(k, p, 4).id, 'c-tejedora', 'viste la majada: escribe la tejedora');
assert.equal(repartir(k, p, 5).id, 'c-ramal', 'diste la vuelta: escribe el ramal');
assert.equal(repartir(k, p, 6), null, 'el naturalista espera a que el cuaderno sea un cuaderno');
assert.equal(repartir(k, p, 7), null, 'y la última, a que cierres la tanda');
assert.equal(repartir(k, p, 99), null, 'no se repiten');

// ---------------------------------------------------------------- retirarlas en el almacén
assert.deepEqual(porRetirar(k, p).map((c) => c.id), ['c-casa', 'c-esquel', 'c-tejedora', 'c-ramal'], 'Ercilia las guarda en orden');
p.entradas['c-casa'] = {};
assert.deepEqual(porRetirar(k, p).map((c) => c.id), ['c-esquel', 'c-tejedora', 'c-ramal'], 'leída, sale de la pila');
assert.equal(cartasLeidas(p), 1);
const partes = partesDeCarta(CARTA['c-esquel']);
assert.match(partes[0], /Llegó carta para vos con el tren\. Es de rosa, la hermana de Ercilia/, 'Ercilia te la da antes de que la leas');
assert.deepEqual(partes.slice(1), CARTA['c-esquel'].texto);

// ---------------------------------------------------------------- saneo
assert.deepEqual(sanearCorreo(null), correoNuevo());
const s = sanearCorreo({ llegadas: { 'c-casa': '3', 'c-falsa': 2, 'c-ramal': 'x' }, ultimoDia: 'no' });
assert.deepEqual(s.llegadas, { 'c-casa': 3 }, 'sólo cartas que existen y con día');
assert.equal(s.ultimoDia, -1);

// ---------------------------------------------------------------- los encargos de Ercilia
const deErcilia = ENCARGOS.filter((e) => e.quien === 'ercilia');
assert.deepEqual(deErcilia.map((e) => e.id), ['e-correo', 'e-verdura', 'e-lana']);
for (const e of deErcilia) {
  assert.ok(CARTA[e.carta], `${e.id} espera una carta que no existe`);
  assert.ok(e.premio?.texto, `${e.id} no dice qué te dan`);
  assert.ok(ENTRADA[e.id]?.seccion === 'encargos', `${e.id} no está en el cuaderno`);
  assert.equal(faltaCarta({ entradas: {} }, e), true);
  assert.equal(estadoEncargo({ entradas: {}, encargos: {} }, e), 'trabado', `${e.id} no se ofrece sin su carta`);
}
const conCartas = { encargos: {}, entradas: { 'c-casa': {}, 'c-esquel': {}, 'c-tejedora': {} } };
assert.equal(estadoEncargo(conCartas, ENCARGO['e-verdura']), 'disponible');
assert.equal(encargoDe(conCartas, 'ercilia').e.id, 'e-correo', 'primero, contestar');

// lo que piden sale de la huerta y de la majada
assert.equal(ENCARGO['e-verdura'].cumplido({ entradas: { haba: { cantidad: 6 }, papa: { cantidad: 3 } } }), false);
assert.equal(ENCARGO['e-verdura'].cumplido({ entradas: { haba: { cantidad: 6 }, papa: { cantidad: 4 } } }), true);
assert.equal(ENCARGO['e-lana'].cumplido({ materiales: { lana: 4 }, acopio: { lana: 2 } }), true, 'la lana del acopio también cuenta');
assert.equal(ENCARGO['e-lana'].cumplido({ materiales: { lana: 5 } }), false);
const cuatro = Object.fromEntries(['c-casa', 'c-esquel', 'c-tejedora', 'c-ramal'].map((id) => [id, {}]));
assert.equal(ENCARGO['e-correo'].cumplido({ entradas: cuatro }), true);
// el premio de semilla suma a lo que había
assert.deepEqual(ENCARGO['e-verdura'].premio.cuenta, { 'semillas-papa': 4 });

// el cierre de Ema sigue dependiendo de todos, incluidos los nuevos
assert.ok(ENCARGO['e-valle'].requiere.includes('e-lana'), 'el cierre también espera lo de Ercilia');

// ---------------------------------------------------------------- cableado
const main = leer('src/main.js');
// 2.4: el buzón de tu casa también las da
assert.match(main, /const correoAca = npc\.clave === 'ercilia' \|\| npc\.clave === 'buzon';\s+const carta = correoAca \? porRetirar\(correo\(\), progreso\)\[0\] : null;/, 'Ercilia (o tu buzón) da las cartas');
assert.match(main, /if \(carta\) \{ charla\.historia = \{ id: carta\.id, partes: partesDeCarta\(carta\) \}; \}/, 'la carta se lee como una historia y se registra al terminar');
assert.match(main, /if \(!aqui \|\| aqui\.nombre !== 'Estación del Valle'\) return;/, 'llega sólo a la estación principal');
assert.match(main, /if \(modo === 'jugando' && !desafio\) revisarCorreo\(\);/, 'el correo es del Relax');
assert.match(main, /for \(const \[k, n\] of Object\.entries\(premio\.cuenta \|\| \{\}\)\) progreso\.cosas\[k\] = \(progreso\.cosas\[k\] \|\| 0\) \+ n;/);
assert.match(leer('src/trochita.js'), /let nombre = sitio === principal \? 'Estación del Valle' : null;/, 'la estación principal sigue llamándose así');
assert.match(leer('src/guardado.js'), /correo: sanearCorreo\(p\.correo\)/);
assert.match(leer('src/diario.js'), /case 'carta':/);

console.log('correo:', CARTAS.length, 'cartas · una por día con la trochita ·', deErcilia.length, 'encargos de Ercilia');
