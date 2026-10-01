// 1.8: el modo foto y el valle que reacciona al Desafío.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { CONTROLES_FOTO, GUIAS, estadoFotoInicial, aplicarControl, textoControl, htmlPanelFoto, nombreArchivoFoto, relojCorto, AYUDA_FOTO } from '../src/foto-modo.js';
import { riesgoDePeligros } from '../src/percepcion.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------- modo foto
assert.ok(CONTROLES_FOTO.length >= 5, 'pocos controles para una foto');
for (const c of CONTROLES_FOTO) {
  assert.ok(c.id && c.etiqueta, `control sin nombre: ${c.id}`);
  assert.ok(c.min < c.max && c.paso > 0, `rango mal puesto en ${c.id}`);
}
const e0 = estadoFotoInicial({ hora: 9, fov: 70, bloom: 0.5 });
assert.equal(e0.activo, false);
assert.equal(e0.congelado, true, 'de entrada el mundo se queda quieto para encuadrar');
assert.equal(e0.guias, 'tercios');
assert.equal(e0.hora, 9);
// los valores se acotan solos
assert.equal(aplicarControl(e0, 'exposicion', 99).exposicion, 1.75);
assert.equal(aplicarControl(e0, 'exposicion', -5).exposicion, 0.55);
assert.equal(aplicarControl(e0, 'hora', 12.5).hora, 12.5);
assert.equal(aplicarControl(e0, 'fov', 'nada').fov, 70, 'un valor que no es número no rompe nada');
assert.equal(aplicarControl(e0, 'inventado', 5), e0, 'un control que no existe se ignora');
assert.equal(relojCorto(6.5), '06:30');
assert.equal(relojCorto(23.99), '23:59');
assert.equal(textoControl({ ...e0, hora: 20.25 }, 'hora'), '20:15');
assert.equal(textoControl({ ...e0, fov: 66.4 }, 'fov'), '66°');
assert.match(textoControl({ ...e0, vineta: 0.5 }, 'vineta'), /^0\.50$/);
const panel = htmlPanelFoto(e0);
for (const c of CONTROLES_FOTO) assert.ok(panel.includes(`data-foto="${c.id}"`), `el panel no trae ${c.id}`);
for (const g of GUIAS) assert.ok(panel.includes(`data-foto-guia="${g.id}"`), `falta la guía ${g.id}`);
assert.match(panel, /data-foto-guia="tercios" aria-pressed="true"/);
assert.match(panel, /data-foto-congelar="1" aria-pressed="true"/);
assert.match(nombreArchivoFoto(new Date(2026, 8, 23, 14, 5, 9)), /^hojarasca-20260923-140509\.png$/);
assert.match(AYUDA_FOTO, /F2/);

// ---------------- el valle se asusta
const pos = { x: 0, z: 0 };
assert.equal(riesgoDePeligros(pos, null), 0);
assert.equal(riesgoDePeligros(pos, []), 0);
assert.equal(riesgoDePeligros(pos, [{ x: 500, z: 500, radio: 40 }]), 0, 'lejos no asusta');
assert.equal(riesgoDePeligros(pos, [{ x: 0, z: 0, radio: 40 }]), 1, 'encima asusta del todo');
const medio = riesgoDePeligros(pos, [{ x: 20, z: 0, radio: 40 }]);
assert.ok(medio > 0.4 && medio < 0.6, `a mitad de camino asusta a medias (${medio})`);
assert.equal(riesgoDePeligros(pos, [{ x: 0, z: 0, radio: 40, fuerza: 0.5 }]), 0.5, 'la fuerza pesa');
// manda el peor de todos
assert.equal(riesgoDePeligros(pos, [{ x: 30, z: 0, radio: 40, fuerza: 0.5 }, { x: 2, z: 0, radio: 40 }]), riesgoDePeligros(pos, [{ x: 2, z: 0, radio: 40 }]));
assert.equal(riesgoDePeligros(pos, [{ x: 0, z: 0, radio: 0 }]), 0, 'un peligro sin radio no cuenta');

// ---------------- cableado
const main = leer('src/main.js'), plantilla = leer('src/plantilla.html'), veg = leer('src/vegetacion.js'), perc = leer('src/percepcion.js');
for (const id of ['foto-panel', 'foto-controles', 'foto-guias-capa', 'foto-guardar', 'foto-salir', 'btn-foto-modo']) {
  assert.ok(plantilla.includes(`id="${id}"`), `falta #${id}`);
}
assert.match(main, /e\.code === 'F2' && jugador/, 'F2 entra y sale del modo foto');
assert.match(main, /function abrirModoFoto\(encender\)/);
assert.match(main, /post\.uniforms\.uVineta\.value = foto\.vineta/, 'lo que se toca en el panel se ve en la foto');
assert.match(main, /lienzo\.toBlob\(/, 'la foto se guarda como archivo');
assert.match(main, /foto\.activo && foto\.congelado \? 0 : 1/, 'con el mundo congelado el tiempo no corre');
assert.match(main, /function actualizarPeligros\(dt\)/);
assert.match(main, /ctxMundoVivo\.peligros = scratchPeligros/);
assert.match(main, /veg\.pintarTocones\?\.\(U\.uInvierno\.value\)/);
assert.match(perc, /export function riesgoDePeligros/);
assert.match(perc, /Math\.max\(visual, audible \* 0\.94, ajeno\)/, 'el peligro ajeno entra en la cuenta del riesgo');
assert.match(veg, /function pintarTocones\(invierno\)/);
assert.match(veg, /colorToconNieve/);
console.log('foto y valle: ok ·', CONTROLES_FOTO.length, 'controles de foto · los animales huyen de la nave, los invasores y el nido');
