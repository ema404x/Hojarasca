// 1.10 — el cuaderno para compartir: álbum, diario y lo anotado en una sola página.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { datosAlbum, htmlAlbum, nombreArchivoAlbum } from '../src/album.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const JPG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';

const desafios = [
  { id: 'f-pudu', nombre: 'Un pudú', texto: 'Fotografiá un pudú.' },
  { id: 'f-luna', nombre: 'La luna', texto: 'La luna sobre el lago.' },
  { id: 'f-faro', nombre: 'El faro', texto: 'El faro encendido.' },
];
const secciones = [{ id: 'flora', nombre: 'Árboles y plantas' }, { id: 'fauna', nombre: 'Fauna' }];
const entradas = [{ id: 'coihue', seccion: 'flora', nombre: 'Coihue' }, { id: 'lenga', seccion: 'flora', nombre: 'Lenga' }, { id: 'pudu', seccion: 'fauna', nombre: 'Pudú' }];
const progreso = {
  dia: 12,
  desafios: {
    'f-luna': { dia: 9, hora: 22.5, img: JPG },
    'f-pudu': { dia: 3, hora: 8.25, img: 'javascript:alert(1)' },   // una imagen trucha no entra
  },
  diario: [{ dia: 3, estacion: 'otoño', texto: 'Vi un pudú <script>alert(1)</script> & me quedé quieto.' }, { dia: 4, texto: 'Llovió.' }, null],
  entradas: { coihue: {}, pudu: {} },
};

const d = datosAlbum({ progreso, desafios, secciones, entradas });
assert.deepEqual(d.fotos.map((f) => f.id), ['f-pudu', 'f-luna'], 'sólo las fotos sacadas, por orden de día');
assert.equal(d.fotos[0].img, null, 'lo que no es una imagen no se mete en la página');
assert.equal(d.fotos[1].img, JPG);
assert.equal(d.diario.length, 2, 'las páginas rotas del diario se saltean');
assert.deepEqual(d.anotado, [{ nombre: 'Árboles y plantas', items: ['Coihue'] }, { nombre: 'Fauna', items: ['Pudú'] }], 'lo anotado, por sección y sin lo que no anotaste');
assert.equal(d.anotaciones, 2);

const html = htmlAlbum(d, { titulo: 'Cuaderno de campo', version: '1.10.0' });
assert.match(html, /^<!doctype html>/);
assert.match(html, /<meta charset="utf-8">/);
assert.ok(html.includes(`<img src="${JPG}"`), 'la foto va adentro del archivo');
assert.ok(!html.includes('<script>'), 'lo escrito se escapa: el diario no puede meter código en la página');
assert.ok(html.includes('&lt;script&gt;') && html.includes('&amp;'), 'y se ve tal cual lo escribiste');
assert.ok(!html.includes('javascript:'), 'ni una imagen trucha');
assert.ok(!/https?:\/\//.test(html), 'no depende de nada de afuera: se abre sin internet');
assert.match(html, /Día 12 en el valle · 2 anotaciones · 2 fotos/);
assert.match(html, /<h2>El álbum<\/h2>/);
assert.match(html, /<h2>El diario<\/h2>/);
assert.match(html, /Día 3 · <span>otoño<\/span>/);
assert.match(html, /Hojarasca 1\.10\.0/);
assert.match(html, /@media print/, 'se puede imprimir');

// una partida sin fotos no muestra un álbum vacío
const sinFotos = htmlAlbum(datosAlbum({ progreso: { dia: 1, entradas: { coihue: {} } }, desafios, secciones, entradas }));
assert.ok(!sinFotos.includes('El álbum') && !sinFotos.includes('El diario'));
assert.ok(sinFotos.includes('Lo anotado'));

assert.equal(nombreArchivoAlbum({ dia: 12 }), 'hojarasca-cuaderno-dia-12.html');
assert.equal(nombreArchivoAlbum(null), 'hojarasca-cuaderno-dia-1.html');

// cableado
const main = leer('src/main.js');
assert.match(leer('src/plantilla.html'), /<button id="btn-album">Llevarte el cuaderno<\/button>/);
assert.match(main, /const datos = datosAlbum\(\{ progreso, desafios: DESAFIOS, secciones: SECCIONES, entradas: ENTRADAS \}\);/);
assert.match(main, /new Blob\(\[texto\], \{ type: 'text\/html;charset=utf-8' \}\)/);
assert.match(main, /\$\('btn-album'\)\.addEventListener\('click', \(\) => exportarAlbum\(\)\);/);

console.log('álbum: ok · una sola página con fotos, diario y lo anotado · se abre sin internet y se escapa todo');
