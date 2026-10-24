// 4.10.1: la partida lleva la versión del juego con que se guardó (`versionJuego`), saneada. Una partida de antes la trae vacía y carga igual.
import assert from 'node:assert/strict';

const datos = new Map();
globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
const G = await import('../src/guardado.js?v4101=' + Date.now());
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

ok(G.sanearVersionJuego('4.10.1') === '4.10.1' && G.sanearVersionJuego(' 4.9.0 ') === '4.9.0', 'una versión de verdad se conserva');
for (const raro of [undefined, null, 4, {}, [], '', 'x', '4.10', '4.10.1.2', '4.10.1; drop', '<b>4.1.1</b>', '__proto__', '9999.1.1']) ok(G.sanearVersionJuego(raro) === '', `versión rara (${JSON.stringify(raro)}) queda vacía`);
ok(G.versionMasNueva('4.10.1', '4.10.0') && G.versionMasNueva('5.0.0', '4.99.99') && G.versionMasNueva('4.10.0', '4.9.9'), 'compara por números (4.10 es más nueva que 4.9)');
ok(!G.versionMasNueva('4.9.0', '4.10.0') && !G.versionMasNueva('4.10.0', '4.10.0') && !G.versionMasNueva('', '4.10.0') && !G.versionMasNueva('4.10.0', 'x'), 'y no avisa con la misma, una vieja, o si falta una');

// guardar y volver a abrir: la versión viaja; una rota se limpia; una partida de antes carga sin ella
const p = G.progresoNuevo();
p.dia = 7; p.versionJuego = '4.10.1';
ok(G.guardarProgreso(p) === true, 'se guarda');
ok(G.cargarProgreso().versionJuego === '4.10.1', 'al abrir, la partida trae la versión con que se guardó');
p.versionJuego = '<script>';
G.guardarProgreso(p);
ok(G.cargarProgreso().versionJuego === '', 'una versión rota se limpia al abrir');
const vieja = G.progresoNuevo(); delete vieja.versionJuego; vieja.dia = 9;
datos.set('hojarasca-v1', JSON.stringify(vieja));
const cargada = G.cargarProgreso();
ok(cargada && cargada.dia === 9 && cargada.versionJuego === '', 'una partida de antes (sin el campo) carga igual');

console.log(`verificar-4-10-1-version: ${pasos} comprobaciones, todo en verde`);
