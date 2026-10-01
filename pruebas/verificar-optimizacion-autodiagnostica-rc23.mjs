import fs from 'fs';
import assert from 'assert/strict';
import { crearPerfiladorSubsistemas, factorEfectosPorPresupuesto } from '../src/rendimiento.js';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const main = leer('../src/main.js');
const flotantes = leer('../src/flotantes.js');
const aves = leer('../src/aves.js');
const gente = leer('../src/gente.js');
const objetos = leer('../src/objetos.js');
const construccion = leer('../src/construccion.js');

// Perfilador: no asigna por frame y mantiene EMA/pico por nombre.
let reloj = 10;
const perfil = crearPerfiladorSubsistemas(() => reloj);
let t = perfil.iniciar(true); reloj += 2.5; perfil.terminar('fauna', t, true);
t = perfil.iniciar(true); reloj += 1.0; perfil.terminar('ambiente', t, true);
assert.match(perfil.resumen(2), /fauna/);
assert.ok(perfil.stats.get('fauna').ema > perfil.stats.get('ambiente').ema);
const nAntes = perfil.stats.size;
perfil.terminar('no-debe', 0, false);
assert.equal(perfil.stats.size, nAntes, 'perfil apagado no debe registrar subsistemas');

// Presupuesto continuo de efectos secundarios.
assert.equal(factorEfectosPorPresupuesto(0), 1);
assert.ok(factorEfectosPorPresupuesto(2) < 1);
assert.ok(factorEfectosPorPresupuesto(99, 0.58) >= 0.58);

// Partículas/aves se degradan por shader, sin destruir contenido ni recrear buffers.
assert.match(flotantes, /uniform float uPresupuesto/);
assert.match(flotantes, /step\(aSemilla, clamp\(uPresupuesto/);
assert.match(flotantes, /factorPresupuesto = 1/);
assert.match(aves, /uniform float uPresupuesto/);
assert.match(aves, /factorPresupuesto = 1/);
assert.match(main, /factorEfectosPorPresupuesto\(presupuestoAdaptativo\.nivel\)/);
assert.match(main, /flotantes\.actualizar\([^\n]+factorEfectos\)/);
assert.match(main, /aves\.actualizar\([^\n]+factorEfectos/);

// NPCs lejanos conservan rutina/locomoción pero espacian sólo pose/gestos.
assert.match(gente, /presupuestoNivel = 0/);
assert.match(gente, /g\.__poseAcum/);
assert.match(gente, /const pasoPose = \(charlando \|\| d < 38\)/);
assert.match(main, /gente\.actualizar\(dt, js, camara, charla\.npc, presupuestoAdaptativo\.nivel\)/);

// Búsqueda de coleccionables sin arrays/vector nuevo por cada candidato.
assert.match(objetos, /const vecinosItems = \[\], vecinosPlantas = \[\], vecinosArboles = \[\]/);
assert.doesNotMatch(objetos, /const out = \[\];\s*const cx = Math\.floor\(x \/ 12\)/);
assert.match(objetos, /adelantePlano\.set\(adelante\.x, 0, adelante\.z\)\.normalize\(\)/);
assert.doesNotMatch(objetos, /const plano = new THREE\.Vector3\(adelante\.x/);

// Las construcciones dinámicas mantienen un índice local y lo reindexan sólo al mutar.
assert.match(construccion, /const indiceObras = crearIndiceEspacial2D\(8\)/);
assert.match(construccion, /const reindexarObras = \(\) => indiceObras\.reconstruir/);
assert.match(construccion, /obrasCerca\(pos, radio/);
assert.match(construccion, /obra\.x = t\.x; obra\.z = t\.z/);
assert.match(construccion, /if \(i >= 0\) \{ obras\.splice\(i, 1\); reindexarObras\(\); \}/);

// F3 ahora muestra el costo por subsistema, pero el camino normal sigue sin medir.
assert.match(main, /const perfilador = crearPerfiladorSubsistemas\(\)/);
assert.match(main, /perfil \$\{perfilador\.resumen\(4\)/);
assert.match(main, /perfilador\.terminar\('fauna'/);
assert.match(main, /perfilador\.terminar\('ambiente'/);
assert.match(main, /perfilador\.terminar\('npc\/perro'/);
assert.match(main, /perfilador\.terminar\('clima'/);
assert.match(main, /perfilador\.terminar\('render'/);

console.log('OK Optimización Autodiagnóstica RC23 · profiler por subsistema · partículas adaptativas · NPC pose LOD · coleccionables sin basura · obras indexadas');
