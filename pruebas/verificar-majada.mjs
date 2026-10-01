// 1.10 — la majada: las ovejas del galpón de esquila, la tijera y la lana.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  OVEJAS, DIAS_LANA, VELLONES_POR_OVEJA, majadaNueva, sanearMajada, lanaDe, diasParaLana,
  esquilar, resumenMajada, textoOveja, rumboOveja,
} from '../src/majada.js';
import { TRUEQUE, TRUEQUES, tieneYa } from '../src/trueque.js';
import { ENTRADA, SECCIONES } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- la lana
const m = majadaNueva();
assert.equal(m.esquilada.length, OVEJAS);
for (let i = 0; i < OVEJAS; i++) assert.equal(lanaDe(m, i, 1), 1, 'llegan con el vellón entero');
assert.deepEqual(resumenMajada(m, 1), { total: OVEJAS, conLana: OVEJAS });

assert.deepEqual(esquilar(m, 0, 4, false), { ok: false, motivo: 'tijera' }, 'sin tijera no se esquila');
assert.deepEqual(esquilar(m, 0, 4, true), { ok: true, vellones: VELLONES_POR_OVEJA });
assert.equal(lanaDe(m, 0, 4), 0, 'recién esquilada');
assert.equal(esquilar(m, 0, 5, true).motivo, 'corta', 'no se esquila dos veces seguidas');
assert.equal(esquilar(m, 0, 5, true).faltan, DIAS_LANA - 1);
assert.equal(diasParaLana(m, 0, 4), DIAS_LANA);
assert.ok(lanaDe(m, 0, 4 + DIAS_LANA / 2) > 0.4 && lanaDe(m, 0, 4 + DIAS_LANA / 2) < 0.6, 'la lana crece de a poco');
assert.equal(lanaDe(m, 0, 4 + DIAS_LANA), 1, `a los ${DIAS_LANA} días vuelve a estar entera`);
assert.equal(esquilar(m, 0, 4 + DIAS_LANA, true).ok, true);
assert.equal(esquilar(m, 99, 4, true).motivo, 'oveja', 'no hay oveja 99');
assert.equal(esquilar(m, 1.5, 4, true).motivo, 'oveja');
assert.equal(resumenMajada(m, 4 + DIAS_LANA).conLana, OVEJAS - 1);

assert.match(textoOveja(majadaNueva(), 0, 1, true), /Esquilar/);
assert.match(textoOveja(majadaNueva(), 0, 1, false), /vellón entero/);
const recien = majadaNueva(); esquilar(recien, 2, 10, true);
assert.equal(textoOveja(recien, 2, 10 + DIAS_LANA - 1, true), 'Recién esquilada · le falta un día');

// ---------------------------------------------------------------- saneo
assert.equal(sanearMajada(null).esquilada.length, OVEJAS);
const s = sanearMajada({ esquilada: [3, 'x', null, -2, 7.9, 1, 1, 1, 1, 1, 1, 1] });
assert.deepEqual(s.esquilada, [3, null, null, -2, 7, 1, 1, 1], 'siempre las mismas ovejas, basura como nunca esquilada');

// ---------------------------------------------------------------- el perro las junta
const centro = { x: 0, z: 0 };
assert.equal(rumboOveja({ x: 2, z: 0 }, centro, []), null, 'tranquila y cerca de las otras, pasta');
const huye = rumboOveja({ x: 2, z: 0 }, centro, [{ x: 4, z: 0, radio: 7, peso: 1 }]);
assert.ok(huye && huye.presion > 0, 'el perro cerca la mueve');
assert.ok(Math.sin(huye.rumbo) < 0, 'se aparta del perro, hacia el lado contrario');
const lejos = rumboOveja({ x: 14, z: 0 }, centro, []);
assert.ok(lejos && Math.sin(lejos.rumbo) < 0, 'la que quedó lejos vuelve con las otras');
const perroLejos = rumboOveja({ x: 2, z: 0 }, centro, [{ x: 30, z: 0, radio: 7 }]);
assert.equal(perroLejos, null, 'al perro lejos no le dan bola');

// ---------------------------------------------------------------- la tijera y la lana en el juego
assert.ok(TRUEQUE.tijera, 'la tijera está en el almacén');
assert.equal(TRUEQUE.tijera.repetible, undefined, 'la tijera no se gasta');
assert.equal(tieneYa(TRUEQUE.tijera, { tijera: 1 }), true);
assert.ok(TRUEQUES.length > 0);
for (const id of ['oveja', 'vellon', 'tijera']) assert.ok(ENTRADA[id], `falta ${id} en el cuaderno`);
assert.equal(ENTRADA.oveja.seccion, 'fauna');
assert.equal(SECCIONES.find((x) => x.id === 'huerta').nombre, 'Del campo', 'la sección abarca huerta y majada');

const cons = leer('src/construccion.js');
assert.match(cons, /lana: \{ nombre: 'vellones de lana'/, 'la lana es un material de construcción');
const alfombra = cons.slice(cons.indexOf("id: 'alfombra-lana'"), cons.indexOf("id: 'alfombra-lana'") + 700);
assert.match(alfombra, /pide: \{ lana: 2 \}/, 'la alfombra de lana, por fin, lleva lana');
assert.ok(!/pide: \{ tabla: 1 \}/.test(alfombra), 'y no una tabla');

const main = leer('src/main.js');
assert.match(main, /const CLAVES_MATERIAL = \['tronco', 'tabla', 'piedra', 'cristal', 'lana'\];/, 'el acopio guarda lana');
assert.match(main, /majadaMundo = crearMajada\(T, escena\);/);
assert.match(main, /if \(!js\.enTren && !js\.enKayak && !objetivo && ovejaCercana\) \{ esquilarOveja\(ovejaCercana\); break; \}/, 'E esquila');
assert.match(main, /majadaMundo\.actualizar\(dt, js, perro\?\.est\?\.pos \|\| null, ocultas\)/, 'el perro entra en la cuenta');
assert.match(main, /const ocultas = !!desafio && \(progreso\.horas >= 20\.5 \|\| progreso\.horas < 6\);/, 'en el Desafío, de noche, la majada se encierra');
assert.match(leer('src/guardado.js'), /majada: sanearMajada\(p\.majada\)/);
assert.match(leer('src/parte.js'), /lana: 'Vellones de lana'/);
const mundo = leer('src/majada-mundo.js');
// 3.0.1: el corral se corrió 2,6 m para despejar el portón del galpón (lz −13 → −15,6)
assert.match(mundo, /const CORRAL = \{ lx: -2, lz: -15\.6, radio: 9 \};/, 'la majada usa el corral grande que ya existía');
assert.match(mundo, /RADIO_PASTO = 7\.4/, 'y no pasa el alambrado');
assert.match(leer('src/estructuras.js'), /corral\(-2, -15\.6, 9, 9\);/, 'el corral del galpón sigue donde la majada lo busca');
assert.match(leer('src/mochila.js'), /lana\(\) \{/, 'la lana tiene su ícono');

console.log('majada:', OVEJAS, 'ovejas ·', VELLONES_POR_OVEJA, 'vellones cada una · la lana vuelve en', DIAS_LANA, 'días · la alfombra lleva lana');
