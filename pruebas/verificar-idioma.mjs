// 1.8: el juego en inglés. El motor (diccionario, moldes con huecos, recorrido del DOM)
// y la cobertura de las tandas traducidas.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { IDIOMAS, esIdioma, normalizar, crearTraductor, traducirDom } from '../src/idioma.js';
import { EN } from '../src/idioma-en.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const existe = (f) => fs.existsSync(new URL('../' + f, import.meta.url));

// ---------------- el motor
assert.deepEqual(IDIOMAS.map((i) => i.id), ['es', 'en']);
assert.ok(esIdioma('en') && !esIdioma('fr'));
assert.equal(normalizar('  hola   mundo \n '), 'hola mundo');

const dic = {
  'Buenas': 'Hello',
  'Talar el árbol ({0}/{1})': 'Fell the tree ({0}/{1})',
  '+{0} {1}': '+{0} {1}',
  'Llevás {0} tablas': 'You are carrying {0} planks',
  'Guardaste en el acopio': 'Stored in the supply pile',
};
const es = crearTraductor(dic, 'es');
assert.equal(es.t('Buenas'), 'Buenas', 'en castellano no se toca nada');

const en = crearTraductor(dic, 'en');
assert.equal(en.t('Buenas'), 'Hello');
assert.equal(en.t('  Buenas  '), '  Hello  ', 'se respetan los espacios de alrededor');
assert.equal(en.t('Buenas\n'), 'Hello\n');
assert.equal(en.t('Talar el árbol (2/3)'), 'Fell the tree (2/3)', 'los moldes reconocen lo que cambia');
assert.equal(en.t('Llevás 14 tablas'), 'You are carrying 14 planks');
assert.equal(en.t('+3 troncos'), '+3 troncos', 'el molde copia lo que no sabe traducir');
assert.equal(en.t('Algo que nadie tradujo'), 'Algo que nadie tradujo', 'lo que falta queda en castellano');
assert.equal(en.t(null), null);
assert.equal(en.t(''), '');
assert.ok(en.faltantes.some(([k]) => k === 'Algo que nadie tradujo'), 'lo que falta queda anotado para poder completarlo');
assert.equal(en.cuantos, Object.keys(dic).length);

// el molde más específico gana sobre el más general
const dic2 = crearTraductor({ '{0} de la base': '{0} of the base', 'El parte de la base': 'The base report' }, 'en');
assert.equal(dic2.t('El parte de la base'), 'The base report');
assert.equal(dic2.t('El estado de la base'), 'El estado of the base', 'lo que cae en el hueco y no está en el diccionario pasa tal cual');
// 2.0: pero si lo que cae en el hueco está en el diccionario, se traduce también
const dic3 = crearTraductor({ 'Se oye {0}, {1}, hacia el {2}.': 'You hear {0}, {1}, to the {2}.', 'un chucao': 'a chucao', 'lejos': 'far off', 'oeste': 'west', '{0}': 'nunca' }, 'en');
assert.equal(dic3.t('Se oye un chucao, lejos, hacia el oeste.'), 'You hear a chucao, far off, to the west.');
assert.equal(dic3.t('Se oye un zorzal, 12, hacia el oeste.'), 'You hear un zorzal, 12, to the west.', 'lo que no sabe y los números, tal cual');
assert.ok(!dic3.faltantes.some(([k]) => k === 'un zorzal'), 'un hueco sin traducir no se anota como faltante');

// traducirDom sin DOM no explota
assert.equal(traducirDom(null, en.t, null), 0);
assert.equal(traducirDom({}, en.t, {}), 0);

// ---------------- las tandas
const TANDAS = [
  ['a', 'interfaz'], ['b', 'cuaderno'], ['c', 'juego'],
  ['d', 'construccion'], ['e', 'gente'], ['f', 'desafio'],
];
let listas = 0, total = 0;
for (const [id, nombre] of TANDAS) {
  const modulo = `src/idioma-en-${id}.js`;
  const lista = `pruebas/salidas/textos-${id}-${nombre}.json`;
  if (!existe(modulo)) continue;
  listas++;
  // el módulo exporta lo que tiene que exportar
  assert.match(leer(modulo), new RegExp(`export const EN_${id.toUpperCase()} = \\{`), `${modulo} no exporta EN_${id.toUpperCase()}`);
  // La lista de textos es la herramienta con la que se armó la tanda; no viaja en el zip
  // de código fuente, así que si no está no es un error: se mira el módulo y listo.
  if (existe(lista)) total += JSON.parse(leer(lista)).length;
}
assert.ok(listas > 0, 'no hay ninguna tanda traducida todavía');

// Las tandas de a mano: no salen de una lista, son lo que el extractor fue dejando
// afuera en cada pasada (etiquetas cortas, moldes con huecos, palabras sueltas).
for (const id of ['g', 'h', 'i', 'j', 'k', 'l']) {
  const modulo = `src/idioma-en-${id}.js`;
  assert.ok(existe(modulo), `falta la tanda ${id}`);
  assert.match(leer(modulo), new RegExp(`export const EN_${id.toUpperCase()} = \\{`), `${modulo} no exporta EN_${id.toUpperCase()}`);
  listas++;
}

// ---------------- el diccionario armado
if (Object.keys(EN).length) {
  for (const [clave, valor] of Object.entries(EN)) {
    assert.equal(typeof valor, 'string', `la traducción de «${clave}» no es un texto`);
    assert.ok(valor.length > 0, `«${clave}» quedó sin traducir`);
    // los huecos tienen que ser los mismos de un lado y del otro
    const huecosEs = (clave.match(/\{\d+\}/g) || []).sort();
    const huecosEn = (valor.match(/\{\d+\}/g) || []).sort();
    assert.deepEqual(huecosEn, huecosEs, `los huecos no coinciden en «${clave}»`);
  }
  // un puñado de textos que tienen que estar sí o sí
  const t = crearTraductor(EN, 'en');
  for (const texto of ['Entrar al bosque', 'Modo de juego', 'Guía del juego', 'Partidas guardadas',
    'Primeros pasos', 'Teclas', 'Ajustes', 'Volver', 'Cerrar']) {
    assert.notEqual(t.t(texto), texto, `falta traducir algo tan visible como «${texto}»`);
  }
}

// ---------------- una sola palabra para cada cosa
// Las tandas se tradujeron por separado y cada una bautizó lo suyo: el jugador juntaba
// «Pine nuts» y cocinaba «Toasted piñones», levantaba un «hut» que el cuaderno anotaba
// como «puesto». Esto no deja que vuelva a pasar. La herramienta que los busca es
// `pruebas/salidas/terminos.cjs`.
const PROHIBIDOS = [
  [/pine nuts?/i, 'piñones'],
  [/\bhuts?\b/i, 'puesto'],
  [/stockpile/i, 'supply pile'],
  [/little train/i, 'la trochita'],
  [/carpenter'?s bench/i, 'workbench'],
  [/magellanic/, 'Magellanic'],   // en minúscula: es un nombre propio
];
for (const [clave, valor] of Object.entries(EN)) {
  for (const [re, enSuLugar] of PROHIBIDOS) {
    assert.ok(!re.test(valor), `«${clave}» dice «${valor}»: acá va «${enSuLugar}»`);
  }
}

// ---------------- las fichas del cuaderno no se repiten a sí mismas
// Cada ficha muestra el nombre y abajo el científico. Si los dos caen en la misma
// traducción, la ficha queda diciendo dos veces lo mismo.
const cuaderno = leer('src/cuaderno.js');
for (const m of cuaderno.matchAll(/nombre: '([^']+)', cientifico: '([^']+)'/g)) {
  const arriba = EN[m[1]] || m[1], abajo = EN[m[2]] || m[2];
  assert.notEqual(arriba.toLowerCase(), abajo.toLowerCase(),
    `la ficha de «${m[1]}» queda diciendo «${arriba}» dos veces`);
}

// ---------------- cableado
const main = leer('src/main.js'), guardado = leer('src/guardado.js'), plantilla = leer('src/plantilla.html');
assert.match(main, /const traductor = crearTraductor\(ajustes\.idioma === 'en' \? EN : \{\}, ajustes\.idioma \|\| 'es'\)/);
assert.match(main, /texto = T_\(texto\); sub = sub \? T_\(sub\) : sub;/, 'los avisos pasan por el traductor');
assert.match(main, /a\.appendChild\(document\.createTextNode\(T_\(t\.texto\)\)\)/, 'el aviso de acción del HUD también');
assert.match(main, /traducirPanel\(document\.body\)/, 'al arrancar se traduce toda la pantalla');
assert.ok((main.match(/traducirPanel\(/g) || []).length >= 10, 'faltan paneles por traducir al dibujarse');
assert.match(main, /if \(clave === 'idioma' && v !== \(ajustes\.idioma \|\| 'es'\)\)/, 'cambiar de idioma rehace la pantalla');
assert.match(guardado, /idioma: opcion\(x\.idioma, \['es', 'en'\], AJUSTES_BASE\.idioma\)/);
assert.match(plantilla, /data-ajuste="idioma"/);
assert.match(plantilla, /Idioma · Language/);
console.log('idioma: ok ·', listas, 'tandas ·', Object.keys(EN).length, 'textos en el diccionario');
