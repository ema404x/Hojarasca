import fs from 'fs';
import assert from 'assert/strict';
import { crearIndiceEspacial2D, pasoIAPorDistancia, consumirPresupuestoIA } from '../src/rendimiento.js';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const main = leer('../src/main.js');
const ecosistema = leer('../src/ecosistema.js');
const perro = leer('../src/perro.js');
const vida = leer('../src/vida.js');
const fauna = leer('../src/fauna.js');
const bichos = leer('../src/bichos.js');

// Índice espacial: sólo devuelve vecinos del radio y reutiliza la salida.
const indice = crearIndiceEspacial2D(10);
const a = { id:'a', x:1, z:1 }, b = { id:'b', x:18, z:1 }, c = { id:'c', x:-8, z:-7 };
indice.insertar(a); indice.insertar(b); indice.insertar(c);
const salida = [];
assert.deepEqual(indice.consultar(0, 0, 5, salida).map(x=>x.id), ['a']);
assert.strictEqual(indice.consultar(0, 0, 30, salida), salida, 'debe reutilizar el array de salida');
assert.equal(new Set(salida.map(x=>x.id)).size, 3);
indice.reconstruir([a, b], (x)=>x);
assert.equal(indice.consultar(-8, -7, 2, salida).length, 0, 'reconstruir debe limpiar celdas antiguas');

// Presupuesto IA: cerca/urgente inmediato; lejos escalonado y con dt acumulado.
assert.equal(pasoIAPorDistancia(10), 0);
assert.equal(pasoIAPorDistancia(200, true), 0);
assert.ok(pasoIAPorDistancia(120) >= 0.12);
assert.ok(pasoIAPorDistancia(200) >= 0.24);
const actor = {};
const primero = consumirPresupuestoIA(actor, 0.016, 180, false);
assert.ok(primero > 0, 'la primera evaluación no debe esperar');
let disparos = 0, acumulado = 0;
for (let i=0;i<20;i++) { const d = consumirPresupuestoIA(actor, 0.016, 180, false); if (d) { disparos++; acumulado += d; } }
assert.ok(disparos <= 2, 'IA lejana debe trabajar a baja frecuencia');
assert.ok(acumulado > 0.20, 'el dt escalonado debe conservar tiempo acumulado');

// Ecosistema: doble buffer + índice, sin crear Map nuevo por frame.
assert.match(ecosistema, /crearIndiceEspacial2D\(32\)/);
assert.match(ecosistema, /actual\.clear\(\)/);
assert.match(ecosistema, /indiceActual\.limpiar\(\)/);
assert.doesNotMatch(ecosistema, /export function iniciarFrameEcosistema\(\) \{\s*anterior = actual;\s*actual = new Map\(\)/);
assert.match(ecosistema, /indiceActual\.consultar/);
assert.match(ecosistema, /vistosConsulta\.clear\(\)/);

// Perro: consulta el índice local cuando está disponible.
assert.match(main, /const indiceSujetosPerro = crearIndiceEspacial2D\(32\)/);
assert.match(main, /indiceSujetosPerro\.reconstruir\(sujetosPerro/);
assert.match(main, /perro\.actualizar\(dt, jugador, camara, mundoPerro, indiceSujetosPerro\)/);
assert.match(perro, /sujetos\?\.consultar/);
assert.match(perro, /candidatosScan/);

// LOD de lógica integrado en mamíferos principales sin bajar la animación global.
assert.match(vida, /consumirPresupuestoIA\(a, dt, d/);
assert.match(vida, /consumirPresupuestoIA\(z, dt, d/);
assert.match(fauna, /consumirPresupuestoIA\(p, dt, d/);
assert.match(bichos, /consumirPresupuestoIA\(l, dt, d/);
assert.match(bichos, /consumirPresupuestoIA\(gu, dt, dG/);

// F3 ahora puede mostrar stutter y heap sin medir en segundo plano.
assert.match(main, /cuadrosLargos/);
assert.match(main, /performance\.memory/);
assert.match(main, />33ms/);
assert.match(main, /heap n\/d/);
assert.match(main, /if \(!medidor\.visible && !HOJARASCA_DEBUG\) return/);

console.log('OK Optimización Profunda RC21 · índice espacial · doble buffer ecológico · IA escalonada por distancia · perro local · telemetría de stutter/heap');
