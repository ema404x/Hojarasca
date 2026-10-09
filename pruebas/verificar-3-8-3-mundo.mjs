// 3.8.3 (mundo) — pase de bugs de vehículos, cocina y mundo antes de Steam. Una comprobación por arreglo.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
// el cuerpo de una función de main.js (hasta la llave que la cierra en la columna 0)
function cuerpo(nombre) {
  const i = main.indexOf(`function ${nombre}(`);
  assert.ok(i >= 0, `no encontré ${nombre}`);
  const f = main.indexOf('\n}\n', i);
  return main.slice(main.indexOf('{', i) + 1, f);
}

// ---------------------------------------------------------------- 1. bajarse del zaino al lado de una pared
// Antes se bajaba siempre 1,1 m a la izquierda, sin mirar: pegado a una pared o una cerca, quedabas del otro lado.
{
  const src = cuerpo('desmontar');
  const correr = (pared) => {
    const js = { pos: { x: 0, y: 0, z: 0 }, yaw: 0, montado: {} };
    const c = {};
    const col = { paredEntre: (ax, az, bx, bz) => pared(bx, bz) };
    new Function('jugador', 'caballo', 'yawCaballo', 'nota', 'guardar', 'col', src)({ estado: js }, () => c, (y) => y + Math.PI, () => {}, () => {}, col);
    return { js, c };
  };
  // sin paredes: a la izquierda (yaw 0 mira a -z: la izquierda es -x), como siempre
  let r = correr(() => false);
  ok(r.js.pos.x < -1 && !r.js.montado && r.c.x === 0, 'sin paredes, se baja por la izquierda y el zaino queda donde estaba');
  // pared a la izquierda: por la derecha
  r = correr((x) => x < 0);
  ok(r.js.pos.x > 1, 'con una pared a la izquierda, se baja por la derecha');
  // paredes de los dos lados: al lado del zaino, sin cruzar ninguna
  r = correr(() => true);
  ok(r.js.pos.x === 0 && r.js.pos.z === 0, 'con paredes de los dos lados, no se cruza ninguna');
}

// ---------------------------------------------------------------- 2. el caballo con nombre, a la jaula
// Con nombre propio el aviso decía «Subiste Tormenta a la jaula».
{
  const src = cuerpo('subirCaballoAlTren');
  const notas = [];
  const correr = (nombre) => {
    notas.length = 0;
    const js = { montado: {} };
    const sin = () => {};
    new Function('jugador', 'viajeTren', 'tren', 'caballoMundo', 'diario', 'registrar', 'sonido', 'nota', 'guardar', src)(
      { estado: js }, () => ({}), { tren: { ponerCaballo: sin, subirCaballo: sin }, subir: sin }, { apariencia: () => null, nombre: () => nombre },
      { anotar: sin }, sin, { casco: sin }, (t) => notas.push(t), sin);
    return notas[0];
  };
  ok(correr('Tormenta') === 'Subiste a Tormenta a la jaula', `con nombre: «${correr('Tormenta')}»`);
  ok(correr('') === 'Subiste al zaino a la jaula', `sin nombre: «${correr('')}»`);
}

console.log(`verificar-3-8-3-mundo: ${n} comprobaciones OK`);
