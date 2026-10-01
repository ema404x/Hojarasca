// 1.11 — el gallinero: gallinas junto a la casa y huevos para la cocina.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { GALLINAS, NIDAL, claveGallinero, gallineroNuevo, sanearGallineros, huevosEnNidal, juntarHuevos, afuera, textoGallinero } from '../src/gallinero.js';
import { ENTRADA } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

const g = gallineroNuevo(5);
assert.equal(huevosEnNidal(g, 5), GALLINAS, 'el mismo día ya hay algo que juntar');
assert.equal(huevosEnNidal(g, 6), GALLINAS * 2);
assert.equal(huevosEnNidal(g, 50), NIDAL, 'con el nidal lleno dejan de poner');
assert.deepEqual(juntarHuevos(g, 6), { ok: true, huevos: GALLINAS * 2 });
assert.equal(huevosEnNidal(g, 6), 0, 'juntados, el resto del día no hay más');
assert.deepEqual(juntarHuevos(g, 6), { ok: false, huevos: 0 });
assert.equal(huevosEnNidal(g, 7), GALLINAS, 'al otro día, de nuevo');
// lo que no entró en el nidal no se recupera juntando tarde
const lleno = gallineroNuevo(1);
assert.equal(juntarHuevos(lleno, 20).huevos, NIDAL);
assert.equal(huevosEnNidal(lleno, 21), GALLINAS, 'después de juntar, arranca de cero');

assert.equal(afuera(12), true);
assert.equal(afuera(22), false, 'de noche duermen adentro');
assert.equal(afuera(5), false);
assert.equal(textoGallinero(gallineroNuevo(1), 1), `Juntar huevos (${GALLINAS})`);
assert.equal(textoGallinero(gallineroNuevo(1), 30), `Juntar huevos (${NIDAL}, el nidal está lleno)`);
const vacio = gallineroNuevo(1); juntarHuevos(vacio, 1);
assert.equal(textoGallinero(vacio, 1), 'Gallinero: el nidal está vacío');

assert.equal(claveGallinero(3.4, -8.6), '3:-9');
assert.deepEqual(sanearGallineros({ '1:2': { desde: '4', juntados: -3 }, basura: {}, '3:3': null }), { '1:2': { desde: 4, juntados: 0 } });
assert.deepEqual(sanearGallineros(null), {});

for (const id of ['huevo', 'gallina']) assert.ok(ENTRADA[id], `falta ${id} en el cuaderno`);
assert.equal(ENTRADA.huevo.seccion, 'huerta');

const main = leer('src/main.js'), cons = leer('src/construccion.js');
assert.match(cons, /id: 'gallinero', nombre: 'Gallinero'/);
assert.match(cons, /gallinero: 'trabajo'/);
assert.match(main, /const g = gallineroCerca\(\); if \(g\) \{ usarGallinero\(g\); break; \}/, 'E junta los huevos');
assert.ok(main.indexOf('texto: textoGallinero(') < main.indexOf('const puertaCerca = !objetivo'), 'el aviso del gallinero va antes que el de la puerta, como en la tecla E');
assert.match(leer('src/gallinero-mundo.js'), /new THREE\.InstancedMesh\(geometriaGallina\(\)/, 'todas las gallinas en una sola llamada de dibujo');
assert.match(leer('src/guardado.js'), /gallineros: sanearGallineros\(p\.gallineros\)/);

console.log('gallinero: ok ·', GALLINAS, 'gallinas por gallinero · nidal de', NIDAL, '· de noche adentro');
