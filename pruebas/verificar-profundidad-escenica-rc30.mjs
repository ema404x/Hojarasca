import { nivelRc } from './version.mjs';
import fs from 'fs';
import assert from 'assert/strict';
import { factorLuzRasante, factorPerspectivaAerea, contrasteEscenico } from '../src/profundidad.js';

const casiHorizonte = factorLuzRasante(0.08, 0.05);
const solAlto = factorLuzRasante(0.72, 0.05);
const cubierto = factorLuzRasante(0.08, 0.95);
assert.ok(casiHorizonte > solAlto * 4, 'La luz rasante debe concentrarse cuando el sol está bajo');
assert.ok(cubierto < casiHorizonte * 0.5, 'La nubosidad debe amortiguar la luz rasante');

const cerca = factorPerspectivaAerea(35, 0, 0.2);
const medio = factorPerspectivaAerea(180, 0, 0.2);
const lejos = factorPerspectivaAerea(360, 0, 0.2);
assert.ok(cerca < medio && medio < lejos, 'La perspectiva aérea debe crecer con la distancia');
const valleHumedo = factorPerspectivaAerea(260, 15, 0.95);
const crestaSeca = factorPerspectivaAerea(260, 420, 0.05);
assert.ok(valleHumedo > crestaSeca * 1.25, 'El aire debe acumularse más en valles húmedos que en crestas secas');
assert.ok(contrasteEscenico(320, 0.9) < contrasteEscenico(40, 0.1), 'El contraste debe caer a distancia');

const cielo = fs.readFileSync(new URL('../src/cielo.js', import.meta.url), 'utf8');
const mats = fs.readFileSync(new URL('../src/materiales.js', import.meta.url), 'utf8');
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.ok(nivelRc(pkg.version) >= 30, 'RC30 o superior requerido');
assert.match(cielo, /factorLuzRasante/);
assert.match(cielo, /uHumedadAire/);
assert.match(cielo, /uAlturaCam/);
assert.match(cielo, /aireValle/);
assert.match(cielo, /colorAire/);
assert.match(cielo, /cresta/);
assert.match(mats, /dAireVeg/);
assert.match(mats, /aireVeg/);
assert.match(mats, /rasanteVeg/);
assert.match(mats, /dAireSuelo/);
assert.match(mats, /aireSuelo/);
assert.match(main, /luz\?\.rasante/);

// RC30 no debe añadir buffers/pases caros para lograr el efecto.
assert.doesNotMatch(cielo, /WebGLRenderTarget|DepthTexture|EffectComposer/);
assert.doesNotMatch(mats, /WebGLRenderTarget|DepthTexture/);

console.log('OK Profundidad Escénica RC30 · perspectiva aérea por distancia/altura/humedad · luz rasante · bosque medio · terreno por capas · 0 pases extra');
