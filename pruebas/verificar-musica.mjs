// 1.8: la música del Relax cambia con la estación y la hora, y cada bus tiene su volumen.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { PALETAS, MOMENTOS, momentoDelDia, paletaMusical, esperaHastaFrase, mezclaPorHora, escalaVolumen } from '../src/musica-relax.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------- los momentos cubren el día entero, sin huecos ni solapes
let borde = 0;
for (const m of MOMENTOS) {
  assert.equal(m.desde, borde, `hueco o solape antes de ${m.id}`);
  assert.ok(m.hasta > m.desde, `momento al revés: ${m.id}`);
  borde = m.hasta;
}
assert.equal(borde, 24, 'los momentos tienen que llegar hasta las 24');
assert.equal(momentoDelDia(3).id, 'madrugada');
assert.equal(momentoDelDia(7).id, 'amanecer');
assert.equal(momentoDelDia(13).id, 'dia');
assert.equal(momentoDelDia(19).id, 'atardecer');
assert.equal(momentoDelDia(23).id, 'noche');
assert.equal(momentoDelDia(26).id, 'madrugada', 'las horas se dan vuelta solas');
assert.equal(momentoDelDia(-1).id, 'noche');

// ---------------- la paleta
for (const [k, p] of Object.entries(PALETAS)) {
  assert.ok(p.nombre && p.grados.length >= 7, `paleta pobre: ${k}`);
  assert.deepEqual(p.grados, [...p.grados].sort((a, b) => a - b), `la escala de ${k} tiene que ir de grave a agudo`);
}
const verano = paletaMusical({ horas: 13 });
assert.equal(verano.clave, 'verano');
assert.equal(verano.momento, 'dia');
const inv = paletaMusical({ horas: 13, invierno: 1 });
assert.equal(inv.clave, 'invierno');
assert.notDeepEqual(inv.escala, verano.escala, 'el invierno no suena igual que el verano');
assert.equal(paletaMusical({ horas: 13, otono: 1 }).clave, 'otono');
// la lluvia manda sobre la estación
assert.equal(paletaMusical({ horas: 13, invierno: 1, lluvia: 1 }).clave, 'lluvia');
// de noche baja una octava y toca menos notas
const noche = paletaMusical({ horas: 23 });
assert.equal(noche.escala[0], verano.escala[0] - 12, 'de noche el piano baja una octava');
assert.ok(noche.notas[1] < verano.notas[1], 'de noche son frases más cortas');
assert.ok(noche.espacio[0] > verano.espacio[0], 'y más espaciadas');
assert.ok(noche.vol < verano.vol || noche.vol <= 1);
// esperas: de noche se espera más que al amanecer
const azarFijo = () => 0.5;
assert.ok(esperaHastaFrase(paletaMusical({ horas: 23 }), azarFijo) > esperaHastaFrase(paletaMusical({ horas: 7 }), azarFijo),
  'de noche las frases tienen que espaciarse más');
assert.ok(esperaHastaFrase(paletaMusical({ horas: 13, lluvia: 1 }), azarFijo) > esperaHastaFrase(paletaMusical({ horas: 13 }), azarFijo),
  'con lluvia, todavía más');

// ---------------- la mezcla
const dia = mezclaPorHora({ horas: 13 });
assert.equal(dia.ambiente, 1);
assert.equal(dia.musica, 1);
const mNoche = mezclaPorHora({ horas: 23 });
assert.ok(mNoche.ambiente < dia.ambiente, 'de noche el bosque baja');
assert.ok(mNoche.musica > dia.musica, 'y la música sube un poco');
assert.ok(mezclaPorHora({ horas: 13, adentro: 1 }).ambiente < dia.ambiente, 'adentro entra menos bosque');
assert.equal(escalaVolumen(0.5), 0.5);
assert.equal(escalaVolumen(9), 1);
assert.equal(escalaVolumen('x', 0.7), 0.7);

// ---------------- cableado
const sonido = leer('src/sonido.js'), main = leer('src/main.js'), guardado = leer('src/guardado.js'), plantilla = leer('src/plantilla.html');
assert.match(sonido, /setMezcla\(\{ ambiente, efectos, musica \} = \{\}, hora = \{\}\)/);
assert.match(sonido, /frase\(noche, paleta = null\)/);
assert.match(sonido, /const escala = paleta\?\.escala \|\|/, 'la frase usa la paleta si hay');
assert.match(sonido, /this\.proxMusica = this\.paleta\?\.espera/);
assert.match(main, /function actualizarSonidoAmbiente\(dt\)/);
assert.match(main, /sonido\.paleta = paleta/);
assert.match(main, /mezclaPorHora\(\{ horas: progreso\.horas/);
for (const k of ['volumenAmbiente', 'volumenEfectos', 'volumenMusica']) {
  assert.ok(guardado.includes(`${k}: acotar(x.${k}, 0, 1, AJUSTES_BASE.${k})`), `el ajuste ${k} no se sanea`);
  assert.ok(plantilla.includes(`data-ajuste-rango="${k}"`), `falta la perilla de ${k}`);
}
console.log('música: ok ·', Object.keys(PALETAS).length, 'paletas ·', MOMENTOS.length, 'momentos del día · tres volúmenes aparte');
