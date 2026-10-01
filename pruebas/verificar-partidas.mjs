// 1.6: tres partidas guardadas por modo, con su menú.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { htmlPartidas, textoPartida, horaCorta, fechaCorta } from '../src/partidas.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

assert.equal(horaCorta(8.5), '08:30');
assert.equal(horaCorta(20.25), '20:15');
assert.equal(horaCorta(-1), '23:00');
assert.equal(textoPartida({ hay: false }), 'Vacía');
assert.equal(textoPartida({ hay: true, modo: 'relax', dia: 3, horas: 14, anotaciones: 1 }), 'Día 3 · 14:00 · 1 anotación');
assert.equal(textoPartida({ hay: true, modo: 'desafio', dia: 4, horas: 21.5, noches: 3 }), 'Día 4 · 21:30 · 3 noches');
const hoy = 1e12;
assert.equal(fechaCorta(hoy, hoy), 'hoy');
assert.equal(fechaCorta(hoy - 86400000, hoy), 'ayer');
assert.equal(fechaCorta(hoy - 5 * 86400000, hoy), 'hace 5 días');
assert.equal(fechaCorta(0, hoy), '');

const lista = [
  { ranura: 1, hay: true, modo: 'desafio', dia: 2, horas: 9, noches: 1, guardadoEn: hoy, vista: 'data:image/jpeg;base64,xx' },
  { ranura: 2, hay: false },
  { ranura: 3, hay: false },
];
const html = htmlPartidas(lista, 'desafio', 1, hoy);
assert.match(html, /Partida 1 · en uso/);
assert.match(html, /data-partida-jugar="2">Empezar acá/);
assert.match(html, /data-partida-borrar="1"/);
assert.ok(!/data-partida-borrar="2"/.test(html), 'una partida vacía no se puede borrar');
assert.match(html, /<img src="data:image\/jpeg;base64,xx"/);
assert.ok(!/<script/i.test(htmlPartidas([{ ranura: 1, hay: true, modo: 'relax', dia: 1, horas: 1, anotaciones: 0, vista: '"><script>x</script>' }], 'relax', 1, hoy)));

// guardado por ranura
const g = leer('src/guardado.js');
assert.match(g, /export const RANURAS = \[1, 2, 3\]/);
assert.match(g, /function sufijoDe\(modo, ranura\)/);
assert.match(g, /ranura: opcion\(Math\.floor\(finito\(x\.ranura, 1\)\), RANURAS, 1\)/, 'la ranura viaja en los ajustes');
assert.match(g, /guardadoEn: Date\.now\(\)/);
for (const f of ['export function listaPartidas', 'export function borrarPartida', 'export function guardarVista', 'export function ranuraActual']) assert.ok(g.includes(f), `falta ${f}`);
// la partida 1 conserva las claves de siempre
assert.match(g, /Number\(ranura\) > 1 \? `-p\$\{Math\.floor\(Number\(ranura\)\)\}` : ''/);

const main = leer('src/main.js'), plantilla = leer('src/plantilla.html');
assert.match(main, /usarModoGuardado\(ajustes\.modo, ajustes\.ranura\)/);
assert.match(main, /guardarVista\(fotos\.hacerMiniatura\(lienzo\)\)/, 'la pausa deja la miniatura de la partida');
for (const id of ['partidas', 'partidas-lista', 'btn-partidas', 'btn-partidas-inicio', 'cerrar-partidas']) assert.ok(plantilla.includes(`id="${id}"`), `falta #${id}`);
console.log('partidas: ok · 3 ranuras por modo');
