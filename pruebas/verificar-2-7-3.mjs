// 2.7.3: que Hojarasca ande sin placa de video aparte. La primera vez elige la calidad
// según la placa (integrada → baja), y si el 3D no arranca prueba otras formas antes de
// rendirse.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { calidadParaEquipo, esSinAceleracion, nombrePlaca } from '../src/calidad-equipo.js';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// placas de verdad, como las nombra WebGL en Windows
const casos = {
  'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)': 'baja',
  'ANGLE (Intel, Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0, D3D11)': 'baja',
  'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)': 'baja',
  'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)': 'baja',
  'ANGLE (AMD, AMD Radeon(TM) Vega 8 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)': 'baja',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)': 'media',
  'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)': 'media',
  'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)': 'muybaja',
  'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)': 'muybaja',
  '': 'baja',
};
for (const [placa, calidad] of Object.entries(casos)) assert.equal(calidadParaEquipo(placa), calidad, placa || '(sin nombre)');
assert.equal(esSinAceleracion('Microsoft Basic Render Driver'), true);
assert.equal(esSinAceleracion('Intel(R) UHD Graphics 620'), false);
// sin WebGL no rompe: devuelve ''
assert.equal(nombrePlaca({ createElement: () => ({ getContext: () => null }) }), '');
assert.equal(nombrePlaca({ createElement: () => { throw new Error('sin DOM'); } }), '');

// enganchado: sólo la primera vez, y sin pisar lo que eligió el jugador
const main = leer('src/main.js');
assert.match(main, /const primeraVez = \(\(\) => \{ try \{ return localStorage\.getItem\('hojarasca-ajustes-v1'\) === null;/);
assert.match(main, /if \(primeraVez\) \{ ajustes\.calidad = calidadParaEquipo\(nombrePlaca\(\)\); guardarAjustes\(ajustes\); \}/);
assert.ok(main.indexOf('if (primeraVez)') < main.indexOf('const calidadInicial = ajustes.calidad;'), 'antes de fijar la calidad inicial');
assert.match(main, /window\.hojarasca\?\.fallaronGraficos\?\.\(\)/, 'si el 3D no arranca, pide reintentar');
// el proceso principal: la cadena de intentos, guardada, y reiniciar
const pm = leer('main.cjs');
assert.match(pm, /'ignore-gpu-blocklist': true, 'use-angle': 'd3d9'/);
assert.match(pm, /ipcMain\.handle\('graficos-fallaron'/);
assert.match(pm, /app\.relaunch\(\); app\.exit\(0\);/);
assert.match(leer('preload.cjs'), /fallaronGraficos: \(\) => ipcRenderer\.invoke\('graficos-fallaron'\)/);
// el paquete sólo lleva los idiomas de Chromium que usa el juego
assert.deepEqual(JSON.parse(leer('package.json')).build.electronLanguages, ['es', 'es-419', 'en-US']);

console.log(`2.7.3: sin placa aparte · ${Object.keys(casos).length} placas reconocidas · 4 formas de iniciar el 3D`);
