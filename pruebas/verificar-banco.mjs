// 1.8: el banco de pruebas (recorrido guionado, cuentas e informe) y llevarse la partida.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { RECORRIDO, CALENTAMIENTO, duracionBanco, estadisticas, crearCorrida, anotarCuadro, resumenCorrida, veredicto, informeBanco, nombreArchivoBanco } from '../src/banco.js';
import { empaquetar, leerPaquete, avisoImportar, nombreArchivoPartida, firmar, FORMATO } from '../src/transferir.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------- el recorrido
assert.ok(RECORRIDO.length >= 5, 'el recorrido tiene que tocar varios lugares distintos');
for (const t of RECORRIDO) {
  assert.ok(t.id && t.nombre && t.texto, `tramo sin nombre: ${t.id}`);
  assert.ok(t.dur > 0 && t.hora >= 0 && t.hora < 24, `tramo mal medido: ${t.id}`);
  assert.ok(t.desde?.lugar && t.hasta?.lugar, `tramo sin puntos: ${t.id}`);
}
assert.ok(new Set(RECORRIDO.map((t) => t.id)).size === RECORRIDO.length, 'ids repetidos');
assert.ok(RECORRIDO.some((t) => t.hora > 20 || t.hora < 5), 'falta un tramo de noche');
assert.ok(duracionBanco() > 60 && duracionBanco() < 240, `la corrida dura ${duracionBanco()} s`);

// ---------------- las cuentas
assert.deepEqual(estadisticas([]), { cuadros: 0, fps: 0, p1: 0, peorMs: 0, medioMs: 0 });
const a60 = new Array(100).fill(1 / 60);
const e60 = estadisticas(a60);
assert.equal(Math.round(e60.fps), 60);
assert.equal(Math.round(e60.p1), 60);
assert.equal(Math.round(e60.medioMs), 17);
// un cuadro lento entre cien no mueve el promedio pero sí el 1% peor
const conTiron = estadisticas([...new Array(99).fill(1 / 60), 0.2]);
assert.ok(conTiron.fps > 50, `el promedio aguanta (${conTiron.fps.toFixed(0)})`);
assert.ok(conTiron.p1 <= 10, `el 1% peor lo acusa (${conTiron.p1.toFixed(0)})`);
assert.equal(Math.round(conTiron.peorMs), 200);
// basura y parpadeos del sistema se descartan
assert.equal(estadisticas([NaN, -1, 0, 3, 1 / 60]).cuadros, 1, 'sólo cuentan los cuadros creíbles');

// ---------------- una corrida entera simulada a 60
const corrida = crearCorrida(RECORRIDO);
let pasos = 0, cambios = 0;
let r = { estado: 'calentando' };
while (r.estado !== 'fin' && pasos < 100000) {
  r = anotarCuadro(corrida, 1 / 60);
  if (r.estado === 'cambio') cambios++;
  pasos++;
}
assert.equal(r.estado, 'fin', 'la corrida termina sola');
assert.equal(cambios, RECORRIDO.length - 1, 'avisa cada cambio de tramo');
assert.equal(corrida.tramos.length, RECORRIDO.length, 'quedan medidos todos los tramos');
assert.ok(corrida.tramos.every((t) => Math.round(t.fps) === 60), 'a 60 estables, todos los tramos dan 60');
const res = resumenCorrida(corrida);
assert.equal(Math.round(res.fps), 60);
assert.ok(res.cuadros > 0 && res.peorTramo, 'el resumen dice cuál fue el tramo más pesado');
// el calentamiento no se mide: si midiera, el primer tramo tendría más cuadros de la cuenta
assert.ok(corrida.tramos[0].cuadros <= Math.ceil(RECORRIDO[0].dur * 60) + 1, 'el calentamiento no entra en la cuenta');
assert.ok(CALENTAMIENTO > 0);
// una corrida cortada por la mitad no rompe el informe
const corta = crearCorrida(RECORRIDO);
for (let i = 0; i < 60 * 20; i++) anotarCuadro(corta, 1 / 30);
assert.ok(informeBanco(corta, { calidad: 'media' }).includes('BANCO DE PRUEBAS'));

// ---------------- veredicto e informe
assert.match(veredicto(90, 60), /holgado/);
assert.match(veredicto(60, 40), /bien/);
assert.match(veredicto(45, 28), /justo/);
assert.match(veredicto(20, 12), /No llega/);
assert.match(veredicto(0, 0), /No se llegó/);
const informe = informeBanco(corrida, { version: '1.8.0', calidad: 'alta', modo: 'Relax', resolucion: '1920×1080', gpu: 'Placa de prueba', escena: '400 llamadas' });
assert.match(informe, /Versión 1\.8\.0 · calidad alta · modo Relax/);
assert.match(informe, /Placa de prueba/);
assert.match(informe, /TODO EL RECORRIDO/);
for (const t of RECORRIDO) assert.ok(informe.includes(t.nombre), `el informe no muestra ${t.nombre}`);
assert.match(nombreArchivoBanco({ calidad: 'media' }, new Date(2026, 0, 2, 3, 4)), /^hojarasca-banco-media-20260102-0304\.txt$/);

// ---------------- llevarse la partida
const progreso = { dia: 7, horas: 9.5, materiales: { tronco: 3 }, entradas: {}, modo: 'relax' };
const paquete = empaquetar({ progreso, fotos: { 'f-x': 'data:image/jpeg;base64,zz' }, modo: 'relax', ranura: 2, version: '1.8.0' });
const vuelta = leerPaquete(paquete);
assert.ok(vuelta.ok, vuelta.motivo);
assert.deepEqual(vuelta.paquete.progreso, progreso, 'la partida vuelve igual');
assert.equal(vuelta.paquete.fotos['f-x'], 'data:image/jpeg;base64,zz', 'el álbum viaja con la partida');
assert.equal(vuelta.paquete.modo, 'relax');
assert.equal(vuelta.paquete.dia, 7);
assert.equal(JSON.parse(paquete).formato, FORMATO);
// lo que tiene que rechazar, con un motivo que se entienda
assert.match(leerPaquete('').motivo, /vacío/);
assert.match(leerPaquete('{"a":1}').motivo, /no es una partida/);
assert.match(leerPaquete('no soy json').motivo, /no es una partida/);
assert.match(leerPaquete(JSON.stringify({ formato: FORMATO, versionPaquete: 99, cuerpo: { progreso } })).motivo, /versión más nueva/);
assert.match(leerPaquete(JSON.stringify({ formato: FORMATO, versionPaquete: 1, cuerpo: {} })).motivo, /no tiene ninguna partida/);
const roto = paquete.replace('"dia": 7', '"dia": 8').replace('"horas": 9.5', '"horas": 22');
assert.match(leerPaquete(roto).motivo, /cortado o modificado/, 'la firma detecta el retoque');
assert.equal(firmar('a'), firmar('a'));
assert.notEqual(firmar('a'), firmar('b'));
// el aviso antes de pisar algo
assert.match(avisoImportar(vuelta.paquete, { ranura: 1, hay: true, dia: 3 }), /pisa la partida 1 \(día 3\)/);
assert.match(avisoImportar(vuelta.paquete, { ranura: 3, hay: false }), /está vacía/);
assert.match(nombreArchivoPartida('desafio', progreso, new Date(2026, 8, 23)), /^hojarasca-desafio-dia7-20260923\.hojarasca\.json$/);

// ---------------- cableado
const main = leer('src/main.js'), plantilla = leer('src/plantilla.html'), guardado = leer('src/guardado.js');
for (const id of ['banco', 'banco-informe', 'banco-corriendo', 'banco-tramo', 'banco-barra', 'btn-banco', 'btn-banco-inicio', 'banco-copiar', 'banco-guardar', 'cerrar-banco']) {
  assert.ok(plantilla.includes(`id="${id}"`), `falta #${id}`);
}
assert.match(main, /if \(banco\.activa\) actualizarBanco\(dtReal\)/, 'el bucle mueve la cámara del banco');
assert.match(main, /banco\.activa && codigo === 'Escape'/, 'Esc corta la medición');
assert.match(main, /medidor\.visible \|\| HOJARASCA_DEBUG \|\| banco\.activa/, 'durante el banco se miden dibujo y perfil');
assert.match(main, /ajustes\.autoCalidad = false;   \/\/ el banco mide una calidad fija/);
assert.match(main, /function exportarPartida\(ranura\)/);
assert.match(main, /function importarPartida\(ranura\)/);
assert.match(main, /data-partida-exportar/);
assert.match(main, /data-partida-importar/);
assert.match(guardado, /export function leerPartida\(modo, ranura\)/);
assert.match(guardado, /export function escribirPartida\(modo, ranura, progreso/);
assert.match(guardado, /finally \{ usarModoGuardado\(modoAnterior, ranuraAnterior\); \}/, 'importar no puede dejar el guardado apuntando a otra ranura');
console.log('banco y transferir: ok ·', RECORRIDO.length, 'tramos ·', Math.round(duracionBanco()), 's de corrida');
