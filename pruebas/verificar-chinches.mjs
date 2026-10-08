// 1.6: el mapa vivo — chinches propias, rumbo en la brújula y marcas automáticas.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { sanearChinches, nombreLibre, ponerChinche, chincheCerca, sacarChinche, rumboHacia, textoDistancia, marcasAutomaticas, MAX_CHINCHES, RADIO_CHINCHE } from '../src/chinches.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// saneo
assert.deepEqual(sanearChinches(null), []);
assert.deepEqual(sanearChinches([{ x: 1, z: 2, nombre: '  El pedrero  ' }]), [{ x: 1, z: 2, nombre: 'El pedrero' }]);
assert.deepEqual(sanearChinches([{ x: 'a', z: 2 }, { x: 99999, z: 0 }]), [], 'descarta basura y lo que está fuera del valle');
assert.equal(sanearChinches([{ x: 0, z: 0 }])[0].nombre, 'Chinche');
assert.equal(sanearChinches(Array.from({ length: 40 }, (_, i) => ({ x: i, z: 0 }))).length, MAX_CHINCHES, 'no entran más que las que aguanta el mapa');

// poner, elegir y sacar
let lista = [];
assert.equal(nombreLibre(lista), 'Chinche 1');
let r = ponerChinche(lista, 10, 20);
lista = r.lista;
assert.equal(r.estado, 'puesta');
assert.equal(lista[0].nombre, 'Chinche 1');
assert.equal(nombreLibre(lista), 'Chinche 2');
r = ponerChinche(lista, 300, 300, 'El pedrero');
lista = r.lista;
assert.equal(lista[1].nombre, 'El pedrero');
assert.equal(chincheCerca(lista, 12, 22)?.nombre, 'Chinche 1', 'se agarra la de al lado');
assert.equal(chincheCerca(lista, 12 + RADIO_CHINCHE * 2, 22), null, 'lejos no agarra ninguna');
lista = sacarChinche(lista, lista[0]);
assert.deepEqual(lista.map((c) => c.nombre), ['El pedrero']);
const llena = ponerChinche(Array.from({ length: MAX_CHINCHES }, (_, i) => ({ x: i, z: 0, nombre: 'c' + i })), 0, 0);
assert.equal(llena.estado, 'llena');

// rumbo: mirando al norte, algo al norte queda al frente; al sur, atrás
const pos = { x: 0, z: 0 };
const norte = rumboHacia(pos, { x: 0, z: -100 }, 0);
assert.ok(Math.abs(norte.ang) < 0.01 && !norte.atras, 'lo que está al frente se marca al frente');
assert.equal(Math.round(norte.dist), 100);
assert.ok(rumboHacia(pos, { x: 0, z: 100 }, 0).atras, 'lo que quedó atrás se avisa');
assert.equal(rumboHacia(pos, null, 0), null);
assert.equal(textoDistancia(432), '432 m');
assert.equal(textoDistancia(1500), '1.5 km');

// marcas que pone el juego solo
const marcas = marcasAutomaticas({ desafio: { caja: { x: 5, z: 6 }, capsula: { x: 7, z: 8 }, restos: null }, lugares: { galpon: { x: 1, z: 2 } } });
assert.deepEqual(marcas.map((m) => m.nombre), ['cofre del alba', 'cofre de los duendes', 'galpón de esquila']);   // 3.8.0: la cápsula es el cofre de los duendes
assert.deepEqual(marcasAutomaticas({}), []);

// cableado
const main = leer('src/main.js'), mapaJs = leer('src/mapa.js'), plantilla = leer('src/plantilla.html');
assert.match(mapaJs, /const aMundo = \(px, py, W, H\)/, 'el mapa sabe pasar de un clic a coordenadas');
assert.match(mapaJs, /chinches = \[\], activa = null, automaticas = \[\]/);
assert.match(main, /\$\('lienzo-mapa'\)\.addEventListener\('click', tocarMapa\)/);
assert.match(main, /addEventListener\('contextmenu', sacarDelMapa\)/);
assert.match(main, /marcaRumbo/, 'la brújula muestra el rumbo elegido');
// El guardado las pasa por su propio saneador, no por un `arr()` pelado: una lista
// con coordenadas rotas o con más de las que entran tiene que volver limpia.
assert.match(leer('src/guardado.js'), /chinches: sanearChinches\(p\.chinches\)/);
assert.match(plantilla, /brujula b\.rumbo/);
console.log('chinches: ok ·', MAX_CHINCHES, 'marcas propias y rumbo en la brújula');
