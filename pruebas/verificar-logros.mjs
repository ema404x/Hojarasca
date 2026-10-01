import assert from 'node:assert/strict';
import { LOGROS, evaluarNoche, evaluarEstado, crearLogros, sanearLogros, dibujarLogros, CSS_LOGROS, textoRecords } from '../src/desafio-logros.js';

function almacenFalso(inicial = {}) {
  const m = new Map(Object.entries(inicial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, _m: m };
}

// ---- ids únicos y requeridos
const ids = LOGROS.map((l) => l.id);
assert.equal(new Set(ids).size, ids.length, 'ids de logros repetidos');
for (const req of ['primera-noche', 'sin-rasguno', 'solo-lanza', 'inexpugnable', 'cazador', 'artesano', 'pistolero', 'superviviente',
  'implacable', 'vencedor', 'buena-compania', 'fiel', 'arquitecto', 'noche-roja', 'eclipse', 'explorador', 'inmortal']) {
  assert.ok(ids.includes(req), `falta el logro ${req}`);
}
for (const l of LOGROS) assert.ok(l.nombre && l.texto, `logro ${l.id} sin nombre/texto`);

// ---- desbloquear: persistencia e idempotencia
const alm = almacenFalso();
const a = crearLogros(alm, 'k');
assert.equal(a.tiene('primera-noche'), false);
assert.equal(a.desbloquear('primera-noche'), true);
assert.equal(a.desbloquear('primera-noche'), false, 'desbloquear dos veces no debe contar');
assert.equal(a.desbloquear('no-existe'), false);
const guardado = JSON.parse(alm.getItem('k'));
assert.equal(guardado.version, 1);
assert.ok(Number.isFinite(Date.parse(guardado.logros['primera-noche'])), 'fecha ISO');
const b = crearLogros(alm, 'k');
assert.equal(b.tiene('primera-noche'), true, 'persistió entre instancias');
assert.deepEqual(b.progreso(), { hechos: 1, total: LOGROS.length });
assert.equal(b.todos().find((l) => l.id === 'primera-noche').desbloqueado, true);
assert.equal(b.todos().find((l) => l.id === 'cazador').fecha, null);

// ---- saneo de basura
for (const basura of ['{no json', 'null', '[]', '42', JSON.stringify({ logros: 'x', records: [1] })]) {
  const s = crearLogros(almacenFalso({ k: basura }), 'k');
  assert.deepEqual(s.progreso(), { hechos: 0, total: LOGROS.length });
  assert.deepEqual(s.records('normal'), { noches: 0, racha: 0, abatidos: 0, victorias: 0 });
}
const sucio = sanearLogros({ logros: { 'cazador': '2026-01-02T00:00:00.000Z', 'inventado': '2026-01-02T00:00:00.000Z', 'fiel': 'ayer', 'eclipse': 7 },
  records: { normal: { noches: '7', racha: -3, abatidos: 'mucho', victorias: 1.9 }, legendaria: { noches: 99 } } });
assert.deepEqual(Object.keys(sucio.logros), ['cazador']);
assert.deepEqual(sucio.records.normal, { noches: 7, racha: 0, abatidos: 0, victorias: 1 });
assert.equal(sucio.records.legendaria, undefined);
// almacén que tira error: no rompe
const roto = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('lleno'); } };
const r0 = crearLogros(roto, 'k');
assert.equal(r0.desbloquear('cazador'), true);
assert.equal(r0.tiene('cazador'), true);
assert.equal(crearLogros(null, 'k').desbloquear('fiel'), true);

// ---- récords: sólo mejoran si son mejores
const alR = almacenFalso();
const rec = crearLogros(alR, 'r');
assert.deepEqual(rec.registrarRecord({ dificultad: 'implacable', noches: 3, racha: 2, abatidos: 40 }), ['noches', 'racha', 'abatidos']);
assert.deepEqual(rec.registrarRecord({ dificultad: 'implacable', noches: 3, racha: 1, abatidos: 50 }), ['abatidos']);
assert.deepEqual(rec.registrarRecord({ dificultad: 'implacable', noches: 2, racha: 2, abatidos: 10 }), []);
assert.deepEqual(rec.registrarRecord({ dificultad: 'implacable', noches: 4, victoria: true }), ['noches', 'victorias']);
assert.deepEqual(rec.records('implacable'), { noches: 4, racha: 2, abatidos: 50, victorias: 1 });
assert.deepEqual(rec.records('tranquila'), { noches: 0, racha: 0, abatidos: 0, victorias: 0 }, 'dificultades separadas');
assert.deepEqual(crearLogros(alR, 'r').records('implacable'), { noches: 4, racha: 2, abatidos: 50, victorias: 1 }, 'récords persistidos');
assert.equal(textoRecords(rec.records('implacable')), 'Mejor racha 2 noches · Más noches 4 · Abatidos 50 · Victorias 1');

// ---- evaluarNoche
const base = { sobrevivida: true, danoRecibido: 12, abatidos: 4, abatidosLanza: 2, abatidosOtros: 2, invasores: 4, obrasPerdidas: 0, especial: null, noche: 1, dificultad: 'normal' };
const totalVacio = { noches: 1, racha: 1, abatidos: 4, pistolaEncontrada: false, recetasHechas: [], recetasTotales: ['lanza', 'arco'], companeros: 0, abatidosPerro: 0, defensas: 0, planos: 0, victoria: false };
assert.deepEqual(evaluarNoche(base, totalVacio), ['primera-noche']);
assert.deepEqual(evaluarNoche({ ...base, sobrevivida: false, danoRecibido: 0 }, totalVacio), [], 'caer no da logros de noche');
assert.ok(evaluarNoche({ ...base, danoRecibido: 0 }, totalVacio).includes('sin-rasguno'));
assert.ok(evaluarNoche({ ...base, abatidos: 3, abatidosLanza: 3, abatidosOtros: 0 }, totalVacio).includes('solo-lanza'));
assert.ok(!evaluarNoche({ ...base, abatidos: 2, abatidosLanza: 2, abatidosOtros: 0 }, totalVacio).includes('solo-lanza'), 'solo-lanza pide ≥3');
assert.ok(!evaluarNoche({ ...base, abatidos: 4, abatidosLanza: 3, abatidosOtros: 1 }, totalVacio).includes('solo-lanza'));
assert.ok(!evaluarNoche({ ...base, invasores: 4 }, totalVacio).includes('inexpugnable'), 'inexpugnable pide ≥5 invasores');
assert.ok(evaluarNoche({ ...base, invasores: 5 }, totalVacio).includes('inexpugnable'));
assert.ok(!evaluarNoche({ ...base, invasores: 9, obrasPerdidas: 1 }, totalVacio).includes('inexpugnable'));
assert.ok(evaluarNoche({ ...base, especial: 'roja' }, totalVacio).includes('noche-roja'));
assert.ok(!evaluarNoche({ ...base, especial: 'roja', sobrevivida: false }, totalVacio).includes('noche-roja'));
assert.ok(evaluarNoche({ ...base, especial: 'eclipse' }, totalVacio).includes('eclipse'));
assert.ok(evaluarNoche({ ...base, noche: 5, dificultad: 'implacable' }, totalVacio).includes('implacable'));
assert.ok(!evaluarNoche({ ...base, noche: 5, dificultad: 'normal' }, totalVacio).includes('implacable'));
assert.ok(evaluarNoche(base, { ...totalVacio, racha: 5 }).includes('inmortal'), 'evaluarNoche suma los del estado');
assert.deepEqual(evaluarNoche(null, null), []);

// ---- evaluarEstado
assert.deepEqual(evaluarEstado(totalVacio), []);
assert.deepEqual(evaluarEstado({ abatidos: 100 }), ['cazador']);
assert.deepEqual(evaluarEstado({ abatidos: 99 }), []);
assert.ok(evaluarEstado({ recetasHechas: ['arco', 'lanza', 'extra'], recetasTotales: ['lanza', 'arco'] }).includes('artesano'));
assert.ok(!evaluarEstado({ recetasHechas: ['lanza'], recetasTotales: ['lanza', 'arco'] }).includes('artesano'));
assert.ok(!evaluarEstado({ recetasHechas: [], recetasTotales: [] }).includes('artesano'), 'sin recetas no hay artesano');
const lleno = evaluarEstado({ noches: 10, racha: 5, abatidos: 100, pistolaEncontrada: true, recetasHechas: ['a'], recetasTotales: ['a'], companeros: 2, abatidosPerro: 10, defensas: 20, planos: 3, victoria: true });
for (const id of ['cazador', 'artesano', 'pistolero', 'superviviente', 'vencedor', 'buena-compania', 'fiel', 'arquitecto', 'explorador', 'inmortal']) {
  assert.ok(lleno.includes(id), `evaluarEstado debería dar ${id}`);
}
assert.deepEqual(evaluarEstado({ companeros: 1, abatidosPerro: 9, defensas: 19, planos: 2, noches: 9, pistolaEncontrada: 'si' }), []);
for (const id of [...lleno, ...evaluarNoche({ ...base, danoRecibido: 0, invasores: 5, especial: 'silenciosa', noche: 5, dificultad: 'implacable' }, totalVacio)]) {
  assert.ok(ids.includes(id), `evaluar devolvió un id desconocido: ${id}`);
}

// ---- dibujarLogros con un DOM mínimo
function nodo(tag) {
  return { tagName: tag, className: '', children: [], _t: '',
    appendChild(c) { this.children.push(c); return c; },
    set textContent(v) { this._t = String(v); this.children = []; },
    get textContent() { return this._t + this.children.map((c) => c.textContent).join(''); } };
}
const docFalso = { createElement: nodo };
const cont = nodo('div'); cont.ownerDocument = docFalso;
cont.appendChild(nodo('p'));
const dib = crearLogros(almacenFalso(), 'd');
dib.desbloquear('vencedor');
dib.registrarRecord({ dificultad: 'normal', noches: 7, racha: 4, abatidos: 132, victoria: true });
dibujarLogros(cont, dib, 'normal');
const todo = [];
(function rec(n) { todo.push(n); n.children.forEach(rec); })(cont);
assert.ok(cont.textContent.includes('Mejor racha 4 noches · Más noches 7 · Abatidos 132 · Victorias 1'));
assert.ok(cont.textContent.includes(`1 de ${LOGROS.length} logros`));
assert.equal(todo.filter((n) => n.className === 'logro-item hecho').length, 1);
assert.equal(todo.filter((n) => n.className.startsWith('logro-item')).length, LOGROS.length);
assert.ok(cont.textContent.includes('Cielo limpio'), 'oculto desbloqueado se muestra');
assert.ok(cont.textContent.includes('???'), 'ocultos bloqueados como ???');
assert.ok(!cont.textContent.includes('Luna de sangre'));
assert.ok(!todo.some((n) => n.tagName === 'p'), 'limpia el contenedor');
assert.ok(CSS_LOGROS.includes('.logro-item.hecho') && CSS_LOGROS.includes('var(--musgo)'));

console.log(`OK Logros Desafío · ${LOGROS.length} logros, persistencia, saneo, récords, evaluación y dibujo verificados`);
