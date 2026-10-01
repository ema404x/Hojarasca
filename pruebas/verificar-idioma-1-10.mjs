// 1.10 — todo lo nuevo también en inglés. El juego se juega en inglés desde la 1.8: si
// lo de la 1.10 saliera en castellano, sería un paso atrás para el que juega así.
import assert from 'node:assert/strict';
import { EN } from '../src/idioma-en.js';
import { EN_M as EN_K } from '../src/idioma-en-m.js';
import { crearTraductor } from '../src/idioma.js';
import { ENTRADA, SECCIONES } from '../src/cuaderno.js';
import { CARTAS, partesDeCarta } from '../src/correo.js';
import { ENCARGO } from '../src/encargos.js';
import { TRUEQUE } from '../src/trueque.js';
import { LOGROS_RELAX } from '../src/logros-relax.js';
import { CULTIVOS } from '../src/huerta.js';
import { textoOveja, majadaNueva, esquilar } from '../src/majada.js';
import { sembrar, textoCantero } from '../src/huerta.js';
import { rumboTexto } from '../src/tormenta.js';
import { htmlAlbum } from '../src/album.js';

const t = crearTraductor(EN, 'en').t;
const falta = [];
const traducido = (texto, donde) => { if (texto && t(texto) === texto) falta.push(`${donde}: «${texto}»`); };
// un nombre en latín (Vicia faba) se deja como está, como en el resto del cuaderno
const esLatin = (s) => /^[A-Z][a-z]+ [a-z.]+$/.test(s || '');

// ---------------------------------------------------------------- los datos nuevos
for (const id of ['huerta', 'cartas']) traducido(SECCIONES.find((s) => s.id === id)?.nombre, `sección ${id}`);
const ENTRADAS_NUEVAS = ['haba', 'papa', 'frutilla-huerta', 'vellon', 'oveja', 'papas-rescoldo', 'habas-salteadas', 'semillas-habas', 'semillas-papa', 'tijera', 'rayo', 'caballo',
  'e-caballo', 'e-correo', 'e-verdura', 'e-lana', ...CARTAS.map((c) => c.id)];
for (const id of ENTRADAS_NUEVAS) {
  const e = ENTRADA[id];
  assert.ok(e, `falta la entrada ${id}`);
  for (const campo of ['nombre', 'pista', 'texto']) traducido(e[campo], `cuaderno ${id}.${campo}`);
  if (!esLatin(e.cientifico)) traducido(e.cientifico, `cuaderno ${id}.cientifico`);
}
for (const c of CARTAS) {
  traducido(c.de, `carta ${c.id}`);
  for (const p of partesDeCarta(c)) traducido(p, `carta ${c.id}`);
}
for (const id of ['e-caballo', 'e-correo', 'e-verdura', 'e-lana']) {
  const e = ENCARGO[id];
  for (const campo of ['titulo', 'pedido', 'resumen', 'listo']) traducido(e[campo], `encargo ${id}.${campo}`);
  traducido(e.premio?.texto, `encargo ${id}.premio`);
}
for (const id of ['semillas-habas', 'semillas-papa', 'tijera']) {
  for (const campo of ['nombre', 'texto', 'efecto']) traducido(TRUEQUE[id][campo], `almacén ${id}.${campo}`);
}
for (const l of LOGROS_RELAX) { traducido(l.nombre, `logro ${l.id}`); traducido(l.texto, `logro ${l.id}`); traducido(`Logro: ${l.nombre}`, `aviso del logro ${l.id}`); }

// ---------------------------------------------------------------- lo que se arma en el momento
for (const [id, c] of Object.entries(CULTIVOS)) {
  traducido(`Sembrar ${c.nombre}`, 'aviso');
  traducido(`Sembraste ${c.nombre}`, 'nota');
  traducido(`Cosechar ${c.nombre}`, 'aviso');
  traducido(`Cosechaste ${c.cosecha} de ${c.nombre}`, 'nota');
  const h = {}; sembrar(h, '0:0', id, 1);
  for (let dia = 1; dia <= c.dias; dia++) traducido(textoCantero(h['0:0'], dia), `cantero ${id} día ${dia}`);
}
const m = majadaNueva(); esquilar(m, 0, 1, true);
for (let dia = 1; dia <= 7; dia++) traducido(textoOveja(m, 0, dia, true), `oveja día ${dia}`);
traducido(textoOveja(majadaNueva(), 1, 1, false), 'oveja sin tijera');
for (const especie of ['coihue', 'lenga', 'ciprés', 'arrayán', 'ñire', 'árbol']) {
  for (const [dx, dz] of [[0, -80], [60, 60], [-90, 0], [0, 120]]) traducido(`Un rayo partió un ${especie} ${rumboTexto({ x: 0, z: 0 }, { x: dx, z: dz })}`, 'nota del rayo');
}
for (const c of CARTAS) traducido(`De ${c.de.charAt(0).toLowerCase()}${c.de.slice(1)}. La tiene Ercilia en el almacén`, `aviso de la carta ${c.id}`);
for (const texto of ['Subir al zaino', 'Bajarte del zaino', 'Tapar el pozo (2 piedras)', 'Cantero vacío: faltan semillas', 'Esquilar la oveja',
  'Otra vuelta, más difícil', 'Otra vuelta al Desafío', 'Llevarte el cuaderno', 'Vuelta 2', 'La huerta está para cosechar', '3 canteros listos',
  'El arroyo viene crecido', '¡Un excavador pasó por debajo!', 'Pozo tapado', 'Llegó carta con el tren', 'Cuaderno guardado']) traducido(texto, 'pantalla');

assert.deepEqual(falta, [], `quedó en castellano:\n  ${falta.join('\n  ')}`);

// ---------------------------------------------------------------- el cuaderno para compartir, en inglés
const pagina = htmlAlbum({ dia: 4, fotos: [], diario: [], anotado: [{ nombre: 'Del campo', items: ['Habas'] }], anotaciones: 1 }, { t });
assert.match(pagina, /Field notebook/);
assert.match(pagina, /Day 4 in the valley · 1 note · 0 photos/);
assert.match(pagina, /From the land/);
assert.match(pagina, /Broad beans/);

// ---------------------------------------------------------------- consistencia
for (const [clave, valor] of Object.entries(EN_K)) {
  assert.equal(EN[clave], valor, `«${clave}» no llegó al diccionario`);
  assert.ok(!/\bhuts?\b/i.test(valor) && !/stockpile/i.test(valor) && !/little train/i.test(valor), `«${valor}» usa una palabra que el resto del juego no usa`);
}

console.log('idioma 1.10: ok ·', Object.keys(EN_K).length, 'textos nuevos en inglés · nada de lo nuevo queda en castellano');
