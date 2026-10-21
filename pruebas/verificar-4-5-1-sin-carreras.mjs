// 4.5.1: se sacaron las carreras contrarreloj (postes de largada con banderín, carteles, puertas, columna de luz, fantasma) y el
// torneo de la semana (pesca, carrera y defensa, con la tabla entre compus y el código para amigos). Se prueba en Node:
//   1. los módulos ya no existen y nada los importa (src, la plantilla, Electron y el index.html armado);
//   2. lo que queda (el desafío del día) no pide correr: sólo pesca, obra y trochita, para cualquier fecha;
//   3. el código de la semana del Desafío (semilla.js) sigue, y lo siguen usando el Desafío y el desafío del día;
//   4. una partida vieja con récords de carreras, un desafío del día de carrera y el torneo en el localStorage carga sin
//      errores, descarta los récords y no toca lo del torneo (se ignora, no se borra);
//   5. Electron: sin los canales del torneo; los hojarasca-torneo-<pc>.json de la carpeta sincronizada no se leen ni se borran;
//   6. el gate ya no corre la prueba de las carreras.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

// localStorage de mentira (guardado.js lo usa)
const almacen = new Map();
globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), clear: () => almacen.clear(), key: (i) => [...almacen.keys()][i] ?? null, get length() { return almacen.size; } };

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const existe = (f) => fs.existsSync(path.join(raiz, f));
const requerir = createRequire(import.meta.url);
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

// ---------------------------------------------------------------- 1. no queda nada
const BORRADOS = ['src/carreras.js', 'src/carreras-mundo.js', 'src/torneo.js', 'src/torneo-sync.js', 'pruebas/verificar-3-1-carreras.mjs', 'pruebas/humo-3-1-carreras.cjs'];
for (const f of BORRADOS) ok(!existe(f), `${f} ya no existe`);

// Lo que delataría una carrera o el torneo: los módulos, sus funciones, el HUD, los canales de Electron y los textos del juego.
// (La palabra «carrera» sola sigue en otras cosas: la carrera de los chicos de la aldea, la carrera de un ciervo.)
const PROHIBIDOS = [
  /carreras(-mundo)?\.js/, /torneo(-sync)?\.js/, /\bCIRCUITOS\b/, /crearCarrerasMundo/, /sanearCarreras/, /carrerasNuevo/, /pasoCarrera/, /posFantasma/,
  /torneoDeLaSemana/, /crearTorneoSync/, /anotarTorneo/, /codigoPuntaje/, /carrera-hud/, /torneoLeer|torneoEscribir|torneo-leer|torneo-escribir/,
  /NOMBRE_TORNEO|MAX_TORNEO/, /avisoCarrera/, /marcasMapa/, /modos\?\.accion\(/, /modos\?\.corriendo/, /Largar(:| de nuevo| el desafío)/,
  /poste de largada/i, /Carrera abandonada/, /Torneo de la semana/, /Carreras, desafío del día y torneo/,
];
// lo que sí puede nombrar el torneo o las carreras: los comentarios que dicen que se sacaron (con «4.5.1» en la línea)
const sinNotas = (t) => t.split('\n').filter((l) => !l.includes('4.5.1')).join('\n');
function revisar(nombre, texto) {
  const t = sinNotas(texto);
  for (const re of PROHIBIDOS) ok(!re.test(t), `${nombre}: no aparece ${re}`);
  ok(!/torneo/i.test(t), `${nombre}: no nombra el torneo`);
  ok(!/contrarreloj/i.test(t), `${nombre}: no nombra las carreras contrarreloj`);
}
const fuentes = [];
(function recorrer(dir) {
  for (const e of fs.readdirSync(path.join(raiz, dir), { withFileTypes: true })) {
    const f = `${dir}/${e.name}`;
    if (e.isDirectory()) { if (e.name !== 'fuentes') recorrer(f); } else if (/\.(js|html|css)$/.test(e.name)) fuentes.push(f);
  }
})('src');
ok(fuentes.length > 300, `se revisan todas las fuentes (${fuentes.length})`);
let todo = '';
for (const f of fuentes) todo += `\n/* ${f} */\n` + sinNotas(leer(f));
revisar('src', todo);
for (const f of ['preload.cjs', 'sincronia-main.cjs', 'ventana-main.cjs', 'main.cjs']) revisar(f, leer(f));
// el armado (armar.mjs corre antes, en el gate)
if (existe('index.html')) {
  const html = leer('index.html');
  revisar('index.html', html);
  ok(!/id="carrera-hud"/.test(html) && /id="btn-modos-inicio">Desafío del día</.test(html) && /id="btn-modos">Desafío del día</.test(html), 'index.html: sin el HUD de la carrera; los botones dicen «Desafío del día»');
} else ok(false, 'falta index.html: correr node armar.mjs');

// main.js: la E y el aviso, sin el poste (los dos lugares); el mapa sin largadas; la pausa no espera ninguna carrera
const main = leer('src/main.js');
ok(!main.includes('modos?.accion(') && !main.includes('avisoCarrera'), 'la tecla E y el aviso ya no ofrecen largar (en los dos lugares)');
ok(main.includes("modo === 'jugando') modos?.actualizar(dt); } catch (e) { fallaSistema('modos', e); }") && main.includes('modos?.pez?.(pez);') && main.includes('modos?.obraTerminada?.('), 'el desafío del día sigue enganchado (cada cuadro, el pez y la obra)');
ok(main.includes("modos = crearModos({ esDesafio, progreso: () => progreso,"), 'crearModos ya no recibe el mundo, el jugador ni la carpeta');
const pl = leer('src/plantilla.html');
ok(pl.includes('<h2>Desafío del día</h2>') && pl.includes('id="modos31-contenido"') && pl.includes('id="cerrar-modos31"') && pl.includes('id="diario-portada"'), 'el panel del desafío del día sigue');

// ---------------------------------------------------------------- 2. el desafío del día, sin carreras
const D = await import('../src/diarios.js');
ok(!D.TIPOS_DIARIO.includes('carrera') && D.TIPOS_DIARIO.join() === 'pesca,obra,tren', `los tipos: ${D.TIPOS_DIARIO.join(', ')}`);
ok(!Object.hasOwn(D, 'CIRCUITOS_DEL_DIA'), 'sin circuitos del día');
{
  const vistos = new Set();
  const f0 = Date.UTC(2026, 0, 1);
  for (let i = 0; i < 800; i++) {
    const d = new Date(f0 + i * 86400000);
    const fecha = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    const def = D.desafioDelDia(fecha);
    vistos.add(def.tipo);
    assert.ok(['pesca', 'obra', 'tren'].includes(def.tipo) && def.titulo && def.texto && def.puntos > 0 && !/poste|largada|corré/i.test(def.titulo + def.texto), `${fecha}: ${JSON.stringify(def)}`);
  }
  ok(vistos.size === 3, `800 días: salen los tres tipos y ninguno es carrera (${[...vistos].join(', ')})`);
  // un evento de carrera (de una versión vieja) no avanza nada ni rompe
  const dd = D.diariosNuevo();
  const def = D.desafioDelDia('2026-10-21');
  ok(D.avanzarDiario(dd, def, { tipo: 'carrera', circuito: 'mirador', giro: null, ms: 50000 }) === null && !dd.hoy.hecho, 'un evento «carrera» viejo no cuenta');
}

// ---------------------------------------------------------------- 3. el código de la semana del Desafío sigue
{
  ok(existe('src/semilla.js'), 'semilla.js sigue');
  const S = await import('../src/semilla.js');
  for (const k of ['codigoDeLaSemana', 'normalizarCodigo', 'azarDe', 'sanearRecordsSemilla', 'registrarSemilla']) ok(typeof S[k] === 'function', `semilla.js exporta ${k}`);
  const c1 = S.codigoDeLaSemana(new Date(2026, 9, 21)), c2 = S.codigoDeLaSemana(new Date(2026, 9, 22));
  ok(typeof c1 === 'string' && c1.length > 3 && c1 === c2, `el código de la semana: el mismo dos días de la misma semana (${c1})`);
  const usan = fuentes.filter((f) => leer(f).includes("from './semilla.js';"));
  ok(usan.includes('src/desafio.js') && usan.includes('src/diarios.js'), `lo usan el Desafío y el desafío del día (${usan.length} módulos)`);
}

// ---------------------------------------------------------------- 4. una partida vieja con carreras y torneo
{
  const G = await import('../src/guardado.js');
  // la clave de la partida: la que use guardado.js ahora
  almacen.clear();
  ok(G.guardarProgreso(G.progresoNuevo()), 'se guarda una partida nueva');
  const clave = [...almacen.keys()].find((k) => { try { return !!JSON.parse(almacen.get(k))?.versionGuardado; } catch { return false; } });
  ok(!!clave, `la clave de la partida (${clave})`);
  const vieja = JSON.parse(almacen.get(clave));
  ok(!Object.hasOwn(vieja, 'carreras'), 'una partida nueva no trae carreras');
  // lo que dejaba la 4.5.0: récords con fantasma, corridas, un desafío del día de carrera a medias y el torneo aparte
  vieja.carreras = {
    mejores: { mirador: { ms: 61234, parciales: [10000, 22000], fecha: '2026-10-01', fantasma: { paso: 0.5, pts: [1, 2, 3, 4] } }, 'lago:invertido': { ms: 90000, parciales: [] }, __proto__x: 3 },
    corridas: 12,
  };
  vieja.diarios = { racha: 3, mejorRacha: 5, ultimo: '2026-10-20', total: 640, hoy: { fecha: '2026-10-21', avance: 0, hecho: false, puntos: 0, base: null }, historial: { '2026-10-20': 150 } };
  almacen.set(clave, JSON.stringify(vieja));
  almacen.set('hojarasca-torneo-v1', JSON.stringify({ pc: 'abcd1234', nombre: 'José', propias: [{ semana: '2026-S43', nombre: 'José', pesca: 41, carreraMs: 61234, noches: 2, abatidos: 9, t: 1 }], amigos: [], carpeta: [] }));
  const torneoAntes = almacen.get('hojarasca-torneo-v1');
  let c = null;
  assert.doesNotThrow(() => { c = G.cargarProgreso(); }, 'cargar una partida vieja con carreras no tira');
  ok(c && typeof c === 'object', 'la partida vieja carga');
  ok(!Object.hasOwn(c, 'carreras'), 'los récords de las carreras se descartan al cargar');
  ok(c.diarios.racha === 3 && c.diarios.mejorRacha === 5 && c.diarios.total === 640 && c.diarios.historial['2026-10-20'] === 150, 'el desafío del día (racha, puntos, historial) se conserva');
  ok(G.guardarProgreso(c), 'y se vuelve a guardar');
  const guardada = JSON.parse(almacen.get(clave));
  ok(!Object.hasOwn(guardada, 'carreras'), 'guardada de nuevo, ya no trae las carreras');
  ok(almacen.get('hojarasca-torneo-v1') === torneoAntes, 'lo del torneo en el localStorage se ignora: no se lee, no se cambia, no se borra');
  // basura en el campo viejo: tampoco rompe
  for (const basura of [null, 'x', 3, [], [1, 2], { mejores: 'x' }, { mejores: { a: null } }, { toString: 1 }]) {
    const p = { ...guardada, carreras: basura };
    almacen.set(clave, JSON.stringify(p));
    let r = null;
    assert.doesNotThrow(() => { r = G.cargarProgreso(); }, `carreras = ${JSON.stringify(basura)} no tira`);
    ok(r && !Object.hasOwn(r, 'carreras'), `carreras = ${JSON.stringify(basura)}: carga y se descarta`);
  }
  const g = leer('src/guardado.js');
  ok(g.includes('const { pueblo: _pueblo31, carreras: _carreras31, ...resto } = p;') && !g.includes("from './carreras.js'"), 'guardado.js: el campo viejo se saca antes de copiar el resto');
}

// ---------------------------------------------------------------- 5. Electron
{
  const SM = requerir(path.join(raiz, 'sincronia-main.cjs'));
  ok(!('NOMBRE_TORNEO' in SM) && !('MAX_TORNEO' in SM), 'sincronia-main.cjs no exporta nada del torneo');
  ok(!SM.NOMBRE_SYNC.test('hojarasca-torneo-abcd1234.json'), 'un archivo del torneo no es una partida');
  const canales = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj451-'));
  try {
    // una carpeta sincronizada con un archivo del torneo de la 4.5.0
    const carpeta = path.join(tmp, 'sync'), dirHoj = path.join(carpeta, 'Hojarasca');
    fs.mkdirSync(dirHoj, { recursive: true });
    const archivoTorneo = path.join(dirHoj, 'hojarasca-torneo-abcd1234.json');
    fs.writeFileSync(archivoTorneo, '{"formato":"hojarasca-torneo","pc":"abcd1234","entradas":[]}');
    const datos = path.join(tmp, 'datos');
    fs.mkdirSync(datos, { recursive: true });
    fs.writeFileSync(path.join(datos, 'carpeta-sincronizada.json'), JSON.stringify({ carpeta }));
    const manejadores = {};
    const ipcMain = { handle: (k, fn) => { canales.push(k); manejadores[k] = fn; }, on: (k, fn) => { canales.push(k); manejadores[k] = fn; } };
    const api = SM.registrarSincronia({ ipcMain, dialog: {}, app: { getPath: () => datos }, ventana: () => null, alError: () => {} });
    ok(canales.length >= 5 && !canales.some((k) => /torneo/.test(k)), `sin canales del torneo (${canales.join(', ')})`);
    ok(!('escribirTorneo' in api) && !('leerTorneos' in api), 'ni funciones del torneo');
    ok(api.carpetaSync() === carpeta, 'la carpeta sincronizada de mentira está elegida');
    {
      const conf = await manejadores['sync-conflictos']({}, 'hojarasca-relax-p1.hojarasca.json');
      ok(Array.isArray(conf) && !conf.some((x) => /torneo/.test(x)), 'el archivo del torneo no es una copia en conflicto');
    }
    ok(fs.existsSync(archivoTorneo), 'el archivo del torneo de la carpeta sincronizada queda donde estaba (no se borra)');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  const pre = leer('preload.cjs');
  ok(!/torneo/i.test(pre) && pre.includes("conflictos: (nombre) => ipcRenderer.invoke('sync-conflictos'"), 'el preload: la carpeta sincronizada sigue, sin el torneo');
}

// ---------------------------------------------------------------- 6. el gate
{
  const pk = JSON.parse(leer('package.json'));
  const pasos = pk.scripts['verify:pasos'] || '';
  ok(!pasos.includes('verificar-3-1-carreras') && pasos.includes('verificar-4-5-1-sin-carreras.mjs'), 'el gate: sin la prueba de las carreras y con ésta');
  for (const m of pasos.matchAll(/node (pruebas\/[^\s&]+)/g)) ok(existe(m[1]), `el gate corre ${m[1]} y existe`);
}

console.log(`verificar-4-5-1-sin-carreras: ${n} comprobaciones OK`);
