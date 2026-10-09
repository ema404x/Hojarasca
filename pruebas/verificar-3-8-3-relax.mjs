// 3.8.3 (relax): el pase de bugs del Relax base antes de Steam. Una comprobación por arreglo.
// 1. La barra de la mochila: lo que elegís para la casilla N va en la casilla N (antes se corría al principio).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const main = leer('src/main.js');
ok(!main.includes('\r'), 'main.js: fines de línea LF');
// Saca un trozo de main.js entre dos marcas (incluidas)
const trozo = (desde, hasta) => {
  const i = main.indexOf(desde);
  ok(i >= 0, `main.js tiene «${desde}»`);
  const j = main.indexOf(hasta, i);
  ok(j > i, `main.js tiene «${hasta}» después`);
  return main.slice(i, j + hasta.length);
};

// ---------------------------------------------------------------- 1. la barra de la mochila
{
  const codigo = trozo('const tomadas = new Set();', '\n  return salida;\n}');
  const asignar = trozo('function asignarRanura(id) {', '\n}');
  const ctx = { progreso: { barra: [] }, elegida: 0, guardar() {}, refrescarBarra() {}, nota() {} };
  vm.createContext(ctx);
  vm.runInContext(`${codigo}\n${asignar.replace(/function asignarRanura/, 'function asignarRanuraEn')}\nthis.ordenarBarra = ordenarBarra; this.asignarRanuraEn = asignarRanuraEn;`, ctx);
  const cosas = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({ id }));
  const ids = () => ctx.ordenarBarra(cosas).map((r) => r.id).join('');
  ok(ids() === 'abcdefg', 'sin nada elegido, la mochila en su orden');
  ctx.elegida = 4; ctx.asignarRanuraEn('f');
  ok(ids() === 'abcdfeg', `la «f» puesta en la casilla 5 queda en la 5 (${ids()})`);
  ctx.elegida = 0; ctx.asignarRanuraEn('g');
  ok(ids().indexOf('g') === 0 && ids().indexOf('f') === 4, `la «g» en la 1 y la «f» sigue en la 5 (${ids()})`);
  ctx.elegida = 2; ctx.asignarRanuraEn('f');
  ok(ids().indexOf('f') === 2 && ids().indexOf('g') === 0, `mover la «f» a la 3 (${ids()})`);
  ok(ids().length === cosas.length && new Set(ids()).size === cosas.length, 'no se pierde ni se repite nada');
  // lo elegido que ya no está en la mochila deja su casilla al resto; con ids repetidos va el último, como antes
  ctx.progreso.barra = [null, 'zz', 'c'];
  ok(ids() === 'abcdefg', `una casilla de algo que ya no tenés la ocupa el siguiente (${ids()})`);
  const repetidas = [{ id: 'x', n: 1 }, { id: 'y' }, { id: 'x', n: 2 }];
  ctx.progreso.barra = ['x'];
  const r = ctx.ordenarBarra(repetidas);
  ok(r.length === 2 && r[0].n === 2 && r[1].id === 'y', 'con ids repetidos, de cada id elegido va el último (como en la 2.7.3)');
}

console.log(`verificar-3-8-3-relax: ${pasos} comprobaciones OK`);
