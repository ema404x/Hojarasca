// 1.11 — visitas a tu casa.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { VISITA, VISITANTES, ORDEN, MESAS, ASIENTOS, visitasNuevas, sanearVisitas, mesaPuesta, quienViene, tocaVisita, empezarVisita, seVa, terminarVisita, charlaDeVisita, puntoDeLlegada, lugarEnLaMesa } from '../src/visitas.js';
import { ENTRADA } from '../src/cuaderno.js';
import { TRUEQUE } from '../src/trueque.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const planos = leer('src/construccion.js');
for (const id of [...MESAS, ...ASIENTOS]) assert.ok(planos.includes(`id: '${id}', nombre:`), `no existe el plano ${id}`);

// ---------------------------------------------------------------- la mesa puesta
assert.equal(mesaPuesta([]), null);
assert.equal(mesaPuesta([{ id: 'mesa-campo', x: 0, z: 0 }, { id: 'silla-campo', x: 1, z: 0 }]), null, 'con un asiento no alcanza');
assert.equal(mesaPuesta([{ id: 'mesa-campo', x: 0, z: 0 }, { id: 'silla-campo', x: 1, z: 0 }, { id: 'banco', x: 20, z: 0 }]), null, 'un banco lejos no cuenta');
const puesta = mesaPuesta([{ id: 'silla-campo', x: 1, z: 0 }, { id: 'mesa-campo', x: 0, z: 0 }, { id: 'banco', x: -1.5, z: 0 }]);
assert.deepEqual(puesta.mesa, { x: 0, z: 0 });
assert.equal(puesta.asientos.length, 2);
const lugar = lugarEnLaMesa(puesta);
assert.ok(lugar.x > 1, 'se para del lado de afuera del asiento');
const llega = puntoDeLlegada({ x: 0, z: 0 }, { x: -10, z: 0 });
assert.ok(llega.x > 25, 'llega del lado contrario a donde estás');

// ---------------------------------------------------------------- el calendario
const v = visitasNuevas();
assert.equal(tocaVisita(v, 1, 17, false), false, 'sin mesa no viene nadie');
assert.equal(tocaVisita(v, 1, 12, true), false, 'a la mañana no');
assert.equal(tocaVisita(v, 1, 16.5, true), true, 'la primera tarde con mesa, sí');
assert.equal(empezarVisita(v, 1).clave, ORDEN[0]);
assert.equal(tocaVisita(v, 1, 16.5, true), false, 'ya hay uno');
assert.equal(seVa(v, 1, 18), false);
assert.equal(seVa(v, 1, VISITA.seVa), true, 'a la noche se va');
assert.equal(seVa(v, 2, 9), true, 'si dormiste, ya se fue');
terminarVisita(v, 1);
assert.deepEqual([v.ultima, v.cuenta, v.activa], [1, 1, null]);
assert.equal(tocaVisita(v, 1 + VISITA.cada - 1, 17, true), false, 'no todos los días');
assert.equal(tocaVisita(v, 1 + VISITA.cada, 17, true), true);
assert.deepEqual(ORDEN.map((_, i) => quienViene(i)), ORDEN, 'se turnan');
assert.equal(quienViene(ORDEN.length), ORDEN[0]);

// ---------------------------------------------------------------- lo que dicen y lo que dejan
for (const k of ORDEN) {
  const def = VISITANTES[k];
  assert.ok(def.charlas.length >= 2 && def.charlas.every((c) => c.length >= 2), `${k}: charlas`);
  assert.ok(def.textoRegalo, `${k}: regalo sin texto`);
  for (const c of Object.keys(def.regalo.cuenta || {})) assert.ok(TRUEQUE[c], `${k}: ${c} no es algo del almacén`);
}
assert.notDeepEqual(charlaDeVisita('ramon', 0), charlaDeVisita('ramon', ORDEN.length), 'la segunda vez cuenta otra cosa');

// ---------------------------------------------------------------- guardado
assert.deepEqual(sanearVisitas(null), visitasNuevas());
assert.deepEqual(sanearVisitas({ ultima: '4', cuenta: -2, activa: { clave: 'nadie', dia: 3 } }), { ultima: 4, cuenta: 0, activa: null });
assert.deepEqual(sanearVisitas({ ultima: 4, cuenta: 2, activa: { clave: 'ema', dia: 7, charlo: 1 } }).activa, { clave: 'ema', dia: 7, charlo: true });
assert.match(leer('src/guardado.js'), /visitas: sanearVisitas\(p\.visitas\)/);

// ---------------------------------------------------------------- cableado
assert.equal(ENTRADA.visita?.seccion, 'historias');
const main = leer('src/main.js');
assert.match(main, /function actualizarVisitas\(dt\) \{\n\s+if \(desafio \|\| !gente\) return;/, 'sólo en el Relax');
// 2.3: entre la visita y la carta puede ir el cuento del fogón (que es de la misma visita)
assert.match(main, /if \(deVisita\) charla\.historia = \{ id: 'visita', partes: charlaDeVisita\(npc\.clave, visitas\(\)\.cuenta\), visita: true \};\n\s+(else if \(cuento\) charla\.historia = cuento;\n\s+)?else if \(carta\)/, 'la charla de la visita va primero');
assert.match(main, /if \(charla\.historia\?\.visita && charla\.parte === charla\.historia\.partes\.length\) regaloDeVisita\(charla\.npc\);/, 'y al terminarla, el regalo');
assert.match(main, /if \(!v\.activa \|\| v\.activa\.charlo\) return;/, 'un regalo por visita');
assert.match(leer('src/gente.js'), /!\(g\.deVisita && g\.espera <= 0\)/, 'no se frena a mitad de camino');

console.log('visitas:', ORDEN.length, 'vecinos se turnan · cada', VISITA.cada, 'días a las', VISITA.llega, 'h · mesa y', VISITA.asientos, 'asientos');
