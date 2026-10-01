// 1.10 — los logros del Relax y el puente con Steam.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { LOGROS_RELAX, RECETAS_RELAX, sanearLogrosRelax, nuevosLogros, crearLogrosRelax } from '../src/logros-relax.js';
import { apiSteam, logrosParaSteam, crearSteam } from '../src/steam.js';
import { LOGROS } from '../src/desafio-logros.js';
import { ENTRADA } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- la lista
assert.ok(LOGROS_RELAX.length >= 15);
assert.equal(new Set(LOGROS_RELAX.map((l) => l.id)).size, LOGROS_RELAX.length);
for (const l of LOGROS_RELAX) assert.ok(l.nombre && l.texto && typeof l.cumple === 'function', `${l.id} mal armado`);
for (const r of RECETAS_RELAX) assert.ok(ENTRADA[r], `la receta ${r} no está en el cuaderno`);
const vacia = { entradas: {}, encargos: {}, obras: [], renovales: [], peces: {}, fotos: 0, vueltas: 0 };
assert.deepEqual(nuevosLogros(vacia, () => false), [], 'una partida nueva no gana nada');

// cada uno se gana con lo suyo
const con = (extra) => ({ ...vacia, ...extra });
const gana = (p, id) => nuevosLogros(p, () => false).includes(id);
assert.ok(gana(con({ entradas: Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`x${i}`, {}])) }), 'libreta'));
assert.ok(!gana(con({ entradas: Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`x${i}`, {}])) }), 'libreta'));
assert.ok(gana(con({ entradas: { haba: {} } }), 'manos-tierra'), 'la huerta tiene su logro');
assert.ok(gana(con({ entradas: { vellon: {} } }), 'vellon'), 'la majada también');
assert.ok(gana(con({ entradas: { caballo: {} } }), 'al-tranco'), 'y el zaino');
assert.ok(gana(con({ encargos: { 'e-correo': 'hecho' } }), 'correo'), 'y el correo');
assert.ok(gana(con({ entradas: { rayo: {} } }), 'rayo'), 'y el rayo');
assert.ok(gana(con({ entradas: Object.fromEntries(RECETAS_RELAX.map((r) => [r, {}])) }), 'mesa-completa'));
assert.ok(!gana(con({ entradas: Object.fromEntries(RECETAS_RELAX.slice(1).map((r) => [r, {}])) }), 'mesa-completa'), 'falta una receta: no');
assert.ok(gana(con({ obras: [{ plano: 'puesto', etapas: 4 }] }), 'constructor'));
assert.ok(!gana(con({ obras: [{ plano: 'puesto', etapas: 2 }] }), 'constructor'), 'a medio hacer, no');

// ---------------------------------------------------------------- guardar y no repetir
const memoria = new Map();
const almacen = { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) };
const L = crearLogrosRelax(almacen, 'prueba', () => '2026-09-23T10:00:00.000Z');
const p = con({ entradas: { haba: {}, vellon: {} } });
const primera = L.revisar(p);
assert.deepEqual(primera.map((l) => l.id).sort(), ['manos-tierra', 'vellon']);
assert.deepEqual(L.revisar(p), [], 'lo ganado no se anuncia dos veces');
assert.equal(L.progreso().hechos, 2);
const L2 = crearLogrosRelax(almacen, 'prueba');
assert.ok(L2.tiene('vellon'), 'queda guardado');
assert.deepEqual(L2.revisar(con({})), [], 'y no depende de la partida: ganado es ganado');
assert.ok(L2.todos().find((l) => l.id === 'rayo').oculto, 'los ocultos siguen ocultos hasta ganarlos');
assert.deepEqual(sanearLogrosRelax({ logros: { vellon: '2026-01-01T00:00:00Z', trucho: '2026-01-01T00:00:00Z', rayo: 'ayer' } }).logros, { vellon: '2026-01-01T00:00:00Z' });
const roto = crearLogrosRelax({ getItem: () => '{no es json', setItem: () => { throw new Error('lleno'); } }, 'x');
assert.equal(roto.progreso().hechos, 0, 'un guardado roto no rompe nada');
assert.equal(roto.revisar(con({ entradas: { rayo: {} } })).length, 1, 'y sin espacio para guardar, sigue andando en memoria');

// ---------------------------------------------------------------- Steam
assert.equal(apiSteam('relax', 'al-tranco'), 'RELAX_AL_TRANCO');
assert.equal(apiSteam('desafio', 'primera-noche'), 'DESAFIO_PRIMERA_NOCHE');
const todos = logrosParaSteam();
assert.equal(todos.length, LOGROS_RELAX.length + LOGROS.length, 'todos los logros del juego tienen nombre de API');
assert.equal(new Set(todos.map((l) => l.api)).size, todos.length, 'sin nombres repetidos');
for (const l of todos) assert.match(l.api, /^[A-Z0-9_]{3,64}$/, `${l.api} no es un nombre válido para Steam`);

const sin = crearSteam(null);
assert.equal(sin.conectado, false);
assert.equal(await sin.desbloquear('relax', 'vellon'), false, 'sin Steam no hace nada, y no rompe');
const pedidos = [];
const con2 = crearSteam({ activar: async (api) => { pedidos.push(api); return true; } });
assert.equal(con2.conectado, true);
assert.equal(await con2.desbloquear('relax', 'vellon'), true);
await con2.desbloquear('relax', 'vellon');
assert.deepEqual(pedidos, ['RELAX_VELLON'], 'no se le pide dos veces');
const falla = crearSteam({ activar: async () => { throw new Error('steam cerrado'); } });
assert.equal(await falla.desbloquear('relax', 'rayo'), false, 'si Steam falla, el juego sigue');

// ---------------------------------------------------------------- cableado
const main = leer('src/main.js'), electron = leer('main.cjs'), preload = leer('preload.cjs');
assert.match(main, /const logrosRelax = esDesafio \? null : crearLogrosRelax\(\);/);
assert.match(main, /const libreta = desafio \? desafio\.logros : logrosRelax;/, 'la libreta de logros abre en los dos modos');
assert.match(main, /steamPuente\.desbloquear\('relax', l\.id\);/);
assert.match(main, /alLogro: \(id\) => steamPuente\.desbloquear\('desafio', id\),/, 'los del Desafío también van a Steam');
assert.match(leer('src/desafio.js'), /ctx\.alLogro\?\.\(id\);/);
assert.match(electron, /require\('steamworks\.js'\)\.init\(appId\)/);
assert.match(electron, /\} catch \(e\) \{ steam = null;/, 'si steamworks.js no está, el juego arranca igual');
assert.match(electron, /\/\^\[A-Z0-9_\]\{3,64\}\$\/\.test\(api\)/, 'el proceso principal no le pasa a Steam cualquier cosa');
assert.match(preload, /activar: \(api\) => ipcRenderer\.invoke\('steam-logro'/);
assert.ok(!JSON.parse(leer('package.json')).dependencies?.['steamworks.js'], 'steamworks.js no es obligatorio: el juego se arma sin él');

console.log('logros del Relax:', LOGROS_RELAX.length, '· globales y guardados aparte · con nombre de API de Steam y puente opcional');
