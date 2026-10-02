// 3.5.3: "se crashea cuando me agacho". Agacharse también va con Ctrl (jugador.js) y el menú
// oculto que Electron pone por defecto tenía Ctrl+W = cerrar ventana, Ctrl+R = recargar y
// Ctrl+M = minimizar: agachado con Ctrl y caminando con W, el juego se cerraba sin dejar
// registro de caída. main.cjs saca ese menú antes de abrir la ventana; F11 sigue andando.
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const principal = leer('main.cjs');
const jugador = leer('src/jugador.js');

// Ctrl agacha (por eso importa): si algún día deja de agachar, esta prueba igual protege
assert.ok(/code === 'ControlLeft'/.test(jugador), 'Ctrl agacha en jugador.js');
assert.ok(/const \{[^}]*\bMenu\b[^}]*\} = require\('electron'\)/.test(principal), 'main.cjs importa Menu');
const listo = principal.slice(principal.indexOf('app.whenReady()'));
const sinMenu = listo.indexOf('Menu.setApplicationMenu(null)');
const ventana = listo.indexOf('crearVentana();');
assert.ok(sinMenu > 0 && ventana > sinMenu, 'main.cjs saca el menú (y sus atajos) antes de abrir la ventana');
assert.ok(!/setApplicationMenu\((?!null)/.test(principal), 'no se vuelve a poner un menú con atajos');
assert.ok(/tecla\.key === 'F11'/.test(principal), 'F11 (pantalla completa) sigue andando sin el menú');
console.log('OK 3.5.3 · sin menú oculto: Ctrl+W/Ctrl+R/Ctrl+M ya no cierran, recargan ni minimizan el juego');
