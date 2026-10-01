import { nivelRc } from './version.mjs';
import fs from 'fs';
import assert from 'assert/strict';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const main = leer('../src/main.js');
const jugador = leer('../src/jugador.js');
const pkg = JSON.parse(leer('../package.json'));

// Reiniciar partida nunca debe reutilizar la posición del jugador viejo.
assert.match(main, /let reiniciandoPartida = false/);
assert.match(main, /reiniciandoPartida = true;[\s\S]*cancelarGuardadoSuave\(\);[\s\S]*borrarProgreso\(\);[\s\S]*progreso = progresoNuevo\(\);[\s\S]*guardarProgreso\(progreso\);[\s\S]*location\.reload\(\)/);
assert.match(main, /function guardar\(\) \{\s*if \(reiniciandoPartida \|\| !jugador\) return false;/);
const bloqueNuevo = main.match(/\$\('btn-nuevo'\)\.addEventListener\('click',[\s\S]*?\n\}\);/)?.[0] || '';
assert.ok(bloqueNuevo, 'no se encontró handler de btn-nuevo');
assert.doesNotMatch(bloqueNuevo, /\bguardar\(\);/, 'btn-nuevo no debe guardar desde la posición vieja');

// Perder foco debe liberar estados continuos del jugador.
assert.match(jugador, /window\.addEventListener\('blur',[\s\S]*teclas\.clear\(\);[\s\S]*estado\.zoom = false;[\s\S]*estado\.saltoPedido = 0;[\s\S]*arrastrando = false/);

// La pesca debe recibir la liberación aunque el usuario haya abierto un modal.
assert.match(main, /if \(e\.code === 'KeyX' && pesca\) pesca\.clic\(false, mundoPesca\(\)\)/);
assert.match(main, /if \(e\.button === 0 && pesca\) pesca\.clic\(false, mundoPesca\(\)\)/);
assert.doesNotMatch(main, /e\.code === 'KeyX' && modo === 'jugando' && pesca/);
assert.doesNotMatch(main, /e\.button === 0 && modo === 'jugando' && pesca\) pesca\.clic\(false/);

// Una foto preparada desde pausa se cancela al volver a abrir un menú.
assert.match(main, /let idFotoPendiente = 0/);
assert.match(main, /if \(cual !== 'jugando'\) \{[\s\S]*pedirFoto = false;[\s\S]*clearTimeout\(idFotoPendiente\)/);
assert.match(main, /idFotoPendiente = setTimeout\([\s\S]*if \(modo === 'jugando'\) pedirFoto = true/);

const rc = nivelRc(pkg.version);
assert.ok(rc >= 25, `la regresión RC25 requiere RC25 o posterior; versión actual: ${pkg.version}`);
console.log('OK Estabilidad RC25 · nuevo recorrido limpio · foco libera zoom/arrastre · pesca no queda recogiendo · foto pendiente cancelable');
