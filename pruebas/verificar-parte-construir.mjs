// 1.8: construir sin arrepentirse (deshacer y repetir), el parte de la partida y
// la guía del segundo acto.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { resumenPartida, htmlParte, textoParte, contarObras, NOMBRE_DIFICULTAD } from '../src/parte.js';
import { seccionesGuia } from '../src/guia.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------- contar lo construido
const PLANOS = {
  empalizada: { categoria: 'defensa', etapas: [{}] },
  puesto: { categoria: 'refugios', habitable: true, etapas: [{}, {}, {}, {}] },
  banco: { categoria: 'mobiliario', etapas: [{}] },
};
assert.deepEqual(contarObras([], PLANOS), { enPie: 0, defensas: 0, refugios: 0 });
assert.deepEqual(contarObras([
  { plano: 'empalizada', etapas: 1 },
  { plano: 'empalizada', etapas: 0 },      // una marca sin levantar no cuenta
  { plano: 'puesto', etapas: 4 },
  { plano: 'banco', etapas: 1 },
], PLANOS), { enPie: 3, defensas: 1, refugios: 1 });
assert.equal(contarObras([{ plano: 'puesto', etapas: 2 }], PLANOS).refugios, 0, 'un puesto a medio hacer no es refugio');
assert.equal(contarObras([{ plano: 'inventado', etapas: 1 }], PLANOS).enPie, 1, 'un plano desconocido no rompe la cuenta');

// ---------------- el parte
const desafio = { noches: 12, abatidos: 143, derrotas: 2, mejorRacha: 7, abatidosPerro: 4, recetasHechas: ['lanza', 'arco'], planos: ['faro'], companeros: ['ema', 'ramon'] };
const progreso = {
  dia: 21, fotos: 5, entradas: { coihue: 1, lenga: 1 }, renovales: [1, 2], talados: [{ i: 1, dia: 3 }],
  materiales: { tronco: 9, cristal: 4 }, acopio: { tronco: 5 }, obras: [{ plano: 'empalizada', etapas: 1 }, { plano: 'puesto', etapas: 4 }],
};
const r = resumenPartida({ desafio, progreso, planos: PLANOS, logros: { hechos: 9, total: 18 }, dificultad: 'implacable', final: true });
assert.equal(r.titulo, 'Se derrumbó la cueva');   // 3.8.0
const filas = Object.fromEntries(r.bloques.flatMap((b) => b.filas));
assert.equal(filas['Noches resistidas'], '12');
assert.equal(filas['Duendes abatidos'], '143');
assert.equal(filas['Abatidos por el perro'], '4');
assert.equal(filas['Mejor racha sin caer'], '7 noches');
assert.equal(filas['Dificultad'], 'Implacable');
assert.equal(filas['Piezas en pie'], '2');
assert.equal(filas['Defensas'], '1');
assert.equal(filas['Refugios terminados'], '1');
assert.equal(filas['Recetas fabricadas'], '2');
assert.equal(filas['Vecinos en la base'], '2');
assert.equal(filas['Renovales plantados'], '2');
assert.equal(filas['Troncos'], '14', 'lo de la mochila y lo del acopio se suman');
assert.equal(filas['Semillas doradas'], '4');
assert.equal(filas['Conseguidos'], '9 de 18');
assert.equal(NOMBRE_DIFICULTAD.tranquila, 'Tranquila');
// sin nada hecho, el parte sigue siendo legible y no inventa filas
const vacio = resumenPartida({ desafio: {}, progreso: {}, planos: {} });
assert.equal(vacio.titulo, 'Cayó el Coihue Viejo');
const filasVacio = Object.fromEntries(vacio.bloques.flatMap((b) => b.filas));
assert.equal(filasVacio['Noches resistidas'], '0');
assert.equal(filasVacio['Abatidos por el perro'], undefined, 'lo que no pasó no se muestra');
assert.equal(filasVacio['Troncos'], undefined);
assert.match(vacio.linea, /0 noches resistidas/);
// html y texto
const html = htmlParte(r);
assert.match(html, /La resistencia/);
assert.match(html, /<b>143<\/b>/);
assert.ok(!/<script/i.test(htmlParte(resumenPartida({ desafio: {}, progreso: { obras: [] }, planos: {}, dificultad: '<script>x</script>' }))));
const texto = textoParte(r);
assert.match(texto, /SE DERRUMBÓ LA CUEVA/);   // 3.8.0
assert.match(texto, /Noches resistidas\.+ 12/);

// ---------------- la guía cuenta el segundo acto
const desafioGuia = seccionesGuia('desafio').find((s) => s.id === 'defensa');
const titulos = desafioGuia.items.map((i) => i[0]);
for (const t of ['El Coihue Viejo', 'La cueva', 'Romper la cueva']) assert.ok(titulos.includes(t), `la guía no explica: ${t}`);
const nido = desafioGuia.items.find((i) => i[0] === 'La cueva')[1];   // 3.8.0
assert.match(nido, /DE DÍA/, 'lo más importante del nido es que se rompe de día');
assert.ok(!seccionesGuia('relax').some((s) => s.id === 'defensa'), 'nada de esto aparece en Relax');
const construir = seccionesGuia('relax').find((s) => s.id === 'construir').items.map((i) => i[0]);
assert.ok(construir.includes('Arrepentirse sale barato'), 'la guía tiene que contar cómo deshacer');

// ---------------- cableado
const cons = leer('src/construccion.js'), main = leer('src/main.js');
assert.match(cons, /function deshacerEtapa\(pos, radio = 6\)/);
assert.match(cons, /function copiarCerca\(pos, radio = 6\)/);
assert.match(cons, /deshacerEtapa, copiarCerca,/, 'las dos se exportan');
assert.match(cons, /recupera\[k\] = Math\.max\(1, Math\.floor\(n \* 0\.5\)\)/, 'deshacer devuelve la mitad');
assert.match(cons, /if \(deps\.length\) return \{ ok: false, motivo: `Tiene \$\{deps\.length === 1 \? 'una pieza apoyada'/);
assert.match(main, /case 'Backspace':/);
assert.match(main, /obras\.deshacerEtapa\(js\.pos, 6\)/);
assert.match(main, /obras\.copiarCerca\(js\.pos, 6\)/);
assert.match(main, /\$\('victoria-datos'\)\.innerHTML = htmlParte\(parteUltimo\)/);
assert.match(leer('src/plantilla.html'), /id="victoria-copiar"/);
for (const p of ['p-nido', 'p-cerco', 'p-nido-dia']) assert.ok(main.includes(`id: '${p}'`), `falta la pista ${p}`);
console.log('parte y construir: ok ·', r.bloques.length, 'bloques del parte · deshacer, repetir y las pistas del nido');
