// 1.11 — la partida en una carpeta sincronizada.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { SINCRONIA, nombreSync, NOMBRE_SYNC_VALIDO, tocaCopiar, compararCopia, cuandoTexto, textoOferta } from '../src/sincronia.js';
import { empaquetar, leerPaquete } from '../src/transferir.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- el nombre
assert.equal(nombreSync('relax', 1), 'hojarasca-relax-p1.hojarasca.json');
assert.equal(nombreSync('desafio', 3), 'hojarasca-desafio-p3.hojarasca.json');
assert.equal(nombreSync('otro', 9), 'hojarasca-relax-p1.hojarasca.json', 'nada raro llega al disco');
for (const m of ['relax', 'desafio']) for (const r of [1, 2, 3]) assert.match(nombreSync(m, r), NOMBRE_SYNC_VALIDO);
for (const malo of ['../hojarasca-relax-p1.hojarasca.json', 'hojarasca-relax-p4.hojarasca.json', 'C:\\x\\hojarasca-relax-p1.hojarasca.json', 'hojarasca-relax-p1.hojarasca.json.exe']) {
  assert.doesNotMatch(malo, NOMBRE_SYNC_VALIDO, `${malo} no pasa`);
}
// Electron usa la misma regla (los manejadores están en sincronia-main.cjs)
const { NOMBRE_SYNC } = createRequire(import.meta.url)('../sincronia-main.cjs');
assert.equal(NOMBRE_SYNC.source, NOMBRE_SYNC_VALIDO.source, 'Electron valida el nombre igual');
const principal = leer('sincronia-main.cjs');
assert.match(leer('main.cjs'), /require\('\.\/sincronia-main\.cjs'\)\.registrarSincronia\(/);
assert.ok(JSON.parse(leer('package.json')).build.files.includes('sincronia-main.cjs'), 'viaja en el instalador');
assert.match(principal, /if \(!c \|\| !NOMBRE_SYNC\.test\(String\(nombre \|\| ''\)\)\) return null;/);
assert.match(principal, /path\.join\(c, 'Hojarasca'\)/, 'siempre adentro de <carpeta>/Hojarasca');

// ---------------------------------------------------------------- cuándo copiar
const ahora = 1_000_000_000;
assert.equal(tocaCopiar({ guardadoEn: 0, ahora }), false, 'sin nada guardado, nada');
assert.equal(tocaCopiar({ guardadoEn: 5, copiadoEn: 5, ahora, forzar: true }), false, 'si no cambió nada, ni forzando');
assert.equal(tocaCopiar({ guardadoEn: 9, copiadoEn: 5, ultimaCopia: ahora - 1000, ahora }), false, 'no más de una copia cada tanto');
assert.equal(tocaCopiar({ guardadoEn: 9, copiadoEn: 5, ultimaCopia: ahora - SINCRONIA.cada * 1000, ahora }), true);
assert.equal(tocaCopiar({ guardadoEn: 9, copiadoEn: 5, ultimaCopia: ahora - 1000, ahora, forzar: true }), true, 'al dormir o salir, sí');

// ---------------------------------------------------------------- qué ofrecer
const paquete = (guardadoEn, dia = 12) => leerPaquete(empaquetar({ progreso: { dia, guardadoEn, entradas: {} }, modo: 'relax' })).paquete;
const t0 = Date.UTC(2026, 8, 22, 18, 30);
assert.equal(compararCopia({ hay: true, guardadoEn: t0, dia: 10 }, paquete(t0 + 3600e3)), 'ofrecer', 'la de la carpeta es una hora más nueva');
assert.equal(compararCopia({ hay: true, guardadoEn: t0, dia: 10 }, paquete(t0 + 30e3)), 'nada', 'por unos segundos no se molesta');
assert.equal(compararCopia({ hay: true, guardadoEn: t0 + 3600e3, dia: 13 }, paquete(t0)), 'nada', 'la de acá es más nueva: se queda');
assert.equal(compararCopia({ hay: false }, paquete(t0)), 'ofrecer', 'en una máquina sin partida, se ofrece');
assert.equal(compararCopia({ hay: true, guardadoEn: t0 }, null), 'nada');
const oferta = textoOferta({ hay: true, guardadoEn: t0, dia: 10 }, paquete(t0 + 3600e3, 12));
assert.match(oferta, /día 12/);
assert.match(oferta, /La de esta computadora es del día 10/);
assert.match(cuandoTexto(t0), /^\d\d\/09 a las \d\d:30$/);

// ---------------------------------------------------------------- cableado
const preload = leer('preload.cjs');
assert.match(preload, /escribirYa: \(nombre, texto, base\) => ipcRenderer\.sendSync\('sync-escribir-ya'/, 'al cerrar, la copia es sincrónica');
const main = leer('src/main.js');
assert.match(main, /window\.addEventListener\('beforeunload', guardar\);\n\s+window\.addEventListener\('beforeunload', \(\) => copiarASync\(true, true\)\);/, 'se guarda y después se copia');
assert.match(main, /guardar\(\);\n\s+copiarASync\(true\);/, 'al dormir');
// 3.5.1: lo ya visto no se ofrece; lo que la otra escribió después sí, aunque la de acá sea igual de nueva
assert.match(main, /if \(enCarpeta <= baseSync \|\| \(local\?\.hay && Number\(local\.guardadoEn\) === enCarpeta\)\) \{ fijarBaseSync\(enCarpeta\); return; \}/,'una copia ya vista no se ofrece de nuevo (aunque los relojes no coincidan)');
assert.match(main, /localStorage\.setItem\(claveBaseSync\(\), String\(baseSync\)\)/, 'y eso se recuerda entre sesiones');
assert.match(main, /syncApi\.escribirYa\(nombre, texto, base\)/, 'cada copia dice qué versión de la carpeta conoce');

// ---------------------------------------------------------------- no pisar lo de la otra computadora
const { puedePisar, guardadoEnDe } = createRequire(import.meta.url)('../sincronia-main.cjs');
const archivo = (g) => empaquetar({ progreso: { dia: 3, guardadoEn: g }, modo: 'relax' });
assert.equal(guardadoEnDe(archivo(t0)), t0);
assert.equal(guardadoEnDe('basura'), 0);
assert.equal(puedePisar(archivo(t0), t0), true, 'la que escribí yo (o la que leí al abrir), sí');
assert.equal(puedePisar(archivo(t0 + 5000), t0), false, 'una más nueva que la que conozco la dejó la otra computadora: no');
assert.equal(puedePisar('basura', 0), true, 'un archivo roto se reemplaza');
assert.equal(puedePisar(archivo(t0), 0), false, 'si nunca miré la carpeta, no piso lo que hay');
assert.match(main, /if \(!r\?\.ok \|\| r\.paquete\.modo !== modoJuego\) return;/, 'la firma y el modo se revisan como al importar');

console.log('sincronía: una copia cada', SINCRONIA.cada, 's, al dormir y al salir · se ofrece si es', SINCRONIA.margen, 's más nueva');
