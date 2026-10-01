import fs from 'fs';
import assert from 'assert/strict';
import { catalogoMicroconductas, elegirMicroconducta, actualizarMicroconducta, gestoMicroconducta } from '../src/microconductas.js';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const vida = leer('../src/vida.js');
const bichos = leer('../src/bichos.js');
const micro = leer('../src/microconductas.js');

for (const especie of ['huemul', 'guanaco', 'zorro', 'liebre', 'zorzal', 'bandurria']) {
  const cat = catalogoMicroconductas(especie);
  assert.ok(cat.length >= 3, `${especie} necesita repertorio de microconductas`);
  assert.ok(cat.every((x) => x[1] > 0 && x[2] > 0 && x[3] >= x[2]), `${especie}: pesos/duraciones inválidos`);
}
assert.equal(elegirMicroconducta('huemul', 0.5, { riesgo: 0.8 }), 'vigilar', 'el riesgo debe forzar vigilancia');
assert.equal(elegirMicroconducta('zorro', 0.5, { velocidad: 1.2 }), 'vigilar', 'un zorro en movimiento no debe entrar en acicalado');
assert.equal(elegirMicroconducta('huemul', 0.5, { estado: 'descansar' }), 'rumiar', 'huemul descansando debe poder rumiar');

const animal = {};
const secuencia = [0.02, 0.4, 0.8, 0.25, 0.6]; let qi = 0;
const azar = () => secuencia[(qi++) % secuencia.length];
const modo = actualizarMicroconducta(animal, 'guanaco', 0.016, { riesgo: 0, actividad: 0.8, velocidad: 0 }, azar);
assert.ok(modo && animal.microT > 0 && Number.isFinite(animal.microFase), 'estado microconductual debe tener modo, fase y duración');
const gesto = gestoMicroconducta('guanaco', modo, 1.25);
for (const [k, v] of Object.entries(gesto)) assert.ok(Number.isFinite(v), `gesto ${k} debe ser finito`);

// Pelaje y partes móviles: sin texturas nuevas ni mallas por frame.
assert.match(vida, /fibraPelo/);
assert.match(vida, /const orejas = \[\]/);
assert.match(vida, /actualizarMicroconducta\(a, prm\.especie/);
assert.match(vida, /actualizarMicroconducta\(z, 'zorro'/);
assert.match(vida, /z\.orejas/);
assert.match(bichos, /actualizarMicroconducta\(l, 'liebre'/);
assert.match(bichos, /actualizarMicroconducta\(gu, 'guanaco'/);
assert.match(bichos, /rascarHojarasca/);

// Aves: alternancia suelo/posadero derivada de árboles reales, sin utilería artificial.
assert.match(bichos, /const perchasZorzal = \[\]/);
assert.match(bichos, /veg\.arboles/);
assert.match(bichos, /buscarPerchaZorzal/);
assert.match(bichos, /enPercha/);
assert.match(bichos, /microPercha/);
assert.match(vida, /actualizarMicroconducta\(b, 'bandurria'/);
assert.match(vida, /microB === 'sondear'/);

// El módulo no debe crear objetos Three.js: sólo devuelve decisiones/gestos numéricos.
assert.doesNotMatch(micro, /new THREE\./);

console.log('OK Microconductas RC19 · forrajeo/rumia/acicalado/vigilancia · orejas y cola reactivas · pelaje multiescala · zorzales suelo/percha · bandurrias sondeando');
