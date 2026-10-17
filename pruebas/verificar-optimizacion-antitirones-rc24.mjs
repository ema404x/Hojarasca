import fs from 'fs';
import assert from 'assert/strict';
import { crearPlanificadorAntitirones, crearRelojCadencia } from '../src/rendimiento.js';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const main = leer('../src/main.js');
const rendimiento = leer('../src/rendimiento.js');
const guardado = leer('../src/guardado.js');

// Frame pacing: 60 FPS sobre refrescos que no son múltiplos exactos (144/165 Hz)
// debe mantenerse cerca de 60 y no caer al patrón 48/55 de un umbral fijo.
for (const hz of [120, 144, 165, 240]) {
  const reloj = crearRelojCadencia(0);
  let renders = 0;
  for (let i = 1; i <= hz; i++) {
    const r = reloj.decidir(i * (1000 / hz), 60);
    if (r.dibujar) renders++;
  }
  assert.ok(renders >= 58 && renders <= 61, `60 FPS sobre ${hz} Hz debe quedar cerca de 60, dio ${renders}`);
}
const libre = crearRelojCadencia(0);
let rendersLibres = 0;
for (let i = 1; i <= 144; i++) if (libre.decidir(i * (1000 / 144), 0).dibujar) rendersLibres++;
assert.equal(rendersLibres, 144, 'modo libre debe dibujar cada requestAnimationFrame');

// Anti-spike: una sola tarea pesada por cuadro y ninguna pesada justo después
// de un frame claramente lento. Las tareas secundarias todavía pueden avanzar.
const plan = crearPlanificadorAntitirones({ objetivoMs: 16.7, maxPesadas: 1, maxSecundarias: 3 });
plan.comenzarCuadro(1 / 60, 0, 16.7);
assert.equal(plan.permitir('vegetacion', { pesada: true }), true);
assert.equal(plan.permitir('ambiente', { pesada: true }), false, 'dos tareas pesadas no deben coincidir');
assert.equal(plan.permitir('hud'), true, 'una tarea secundaria puede seguir avanzando');
plan.comenzarCuadro(0.05, 2, 16.7);
assert.equal(plan.permitir('sombras', { pesada: true }), false, 'tras un frame lento se difiere trabajo pesado');
assert.equal(plan.permitir('interaccion'), true, 'trabajo liviano no queda congelado');

// Integración en el loop: tareas pesadas comparten el planificador, no se
// resetea su acumulador si no obtienen turno, y el limitador usa reloj dedicado.
assert.match(main, /const relojCadencia = crearRelojCadencia\(inicioReloj\)/);
assert.match(main, /const cadencia = relojCadencia\.decidir\(ahora, fpsLimitado\)/);
assert.doesNotMatch(main, /1000 \/ Number\(ajustes\.limiteFps \|\| 60\) - 1\.5/);
assert.match(main, /planificadorAntitirones\.permitir\('vegetacion', \{ pesada: true \}\)/);
assert.match(main, /planificadorAntitirones\.permitir\('ambiente', \{ pesada: true \}\)/);
assert.match(main, /planificadorAntitirones\.permitir\('visibilidad', \{ pesada: true \}\)/);
assert.match(main, /planificadorAntitirones\.permitir\('sombras', \{ pesada: true \}\)/);

// Autosave periódico: nunca escribe localStorage directamente desde el cuadro.
assert.match(main, /acumuladoGuardado > 20\) \{ acumuladoGuardado = 0; programarGuardadoSuave\(\); \}/);
assert.match(main, /requestIdleCallback\(ejecutar, \{ timeout: 3500 \}\)/);
assert.match(main, /deadline\.timeRemaining\(\) < 8/);
assert.match(main, /visibilitychange/);
assert.match(main, /window\.addEventListener\('beforeunload', guardar\)/);
assert.match(guardado, /let ultimoPrincipalValidoTexto = null/);
assert.match(guardado, /ultimoPrincipalValidoTexto = nuevo/);
assert.doesNotMatch(guardado, /return !!parsear\(localStorage\.getItem\(CLAVE\)\)/);

// El helper debe mantener explícitamente la política de una tarea pesada/cuadro.
assert.match(rendimiento, /crearPlanificadorAntitirones/);
assert.match(rendimiento, /if \(pesadas >= max\) return false/);
assert.match(rendimiento, /crearRelojCadencia/);

console.log('OK Optimización Anti-tirones RC24 · frame pacing 60 correcto en 120/144/165/240 Hz · tareas pesadas escalonadas · sombras diferidas · autosave en idle');
