// La guía del juego (F1) y los recursos más accesibles de la 1.5: talar árboles en pie,
// aserrar a mano, banco de carpintero sin tablas y kit inicial del Desafío.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { seccionesGuia, htmlGuia, SECCIONES_GUIA } from '../src/guia.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// contenido filtrado por modo
const relax = seccionesGuia('relax'), desafio = seccionesGuia('desafio');
assert.ok(relax.some((s) => s.id === 'vida') && !relax.some((s) => s.id === 'defensa'), 'el Relax no muestra armas');
assert.ok(desafio.some((s) => s.id === 'defensa') && !desafio.some((s) => s.id === 'vida'), 'el Desafío muestra armas y defensas');
const recursos = (secs) => secs.find((s) => s.id === 'recursos').items.map((i) => i[0]);
for (const r of ['Troncos', 'Tablas', 'Piedra', 'Ramitas', 'Frutas']) assert.ok(recursos(relax).includes(r) && recursos(desafio).includes(r), `la guía explica ${r}`);
assert.ok(recursos(desafio).includes('Semillas doradas') && !recursos(relax).includes('Semillas doradas'));
const tablas = desafio.find((s) => s.id === 'recursos').items.find((i) => i[0] === 'Tablas')[1];
assert.match(tablas, /Y/); assert.match(tablas, /2 tablas/); assert.match(tablas, /4/);
for (const s of SECCIONES_GUIA) for (const it of s.items) assert.ok(it[0] && it[1] && it[1].length < 260, `ítem de guía mal formado en ${s.id}`);
const html = htmlGuia('desafio', 'recursos');
assert.match(html, /data-guia="recursos" aria-pressed="true"/);
assert.ok(!/<script/i.test(html));
assert.match(htmlGuia('relax', 'no-existe'), /aria-pressed="true">Primeros pasos/);

// cableado: modal, botones en portada y pausa, F1, pistas
const plantilla = leer('src/plantilla.html'), main = leer('src/main.js');
for (const id of ['guia', 'guia-contenido', 'btn-guia', 'btn-guia-inicio', 'cerrar-guia']) assert.ok(plantilla.includes(`id="${id}"`), `falta #${id}`);
assert.match(main, /codigo === 'F1'/);
for (const p of ['p-guia', 'p-madera', 'p-tablas']) assert.ok(main.includes(`id: '${p}'`), `falta la pista ${p}`);
assert.ok(!main.includes('Con K mirás de cerca'), 'la pista de mirar hablaba de una tecla que no existe');

// recursos: talar, aserrar a mano, banco sin tablas, kit
assert.match(main, /const GOLPES_TALA = 3, TRONCOS_TALA = 4, TRONCOS_MATA = 3, PIEDRA_MATA = 4;/);
assert.match(main, /const TABLAS_A_MANO = 2, TABLAS_BANCO = 4;/);
assert.match(main, /arbol\.especie === 'pehuen'/, 'el pehuén no se tala');
assert.match(leer('src/vegetacion.js'), /function talar\(a, dir\)/);
const cons = leer('src/construccion.js');
assert.match(cons, /pide: \{ tronco: 4, piedra: 2 \}, funciones: \['aserrar'\]/, 'el banco de carpintero no debe pedir tablas');
assert.match(leer('src/guardado.js'), /materiales: desafio \? \{ tronco: 6, tabla: 6, piedra: 6 \}/);
console.log('guía y recursos: ok');
