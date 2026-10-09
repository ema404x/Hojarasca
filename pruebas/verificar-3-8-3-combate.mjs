// 3.8.3 (duendes): pase de bugs de «La noche de los duendes» entero antes de Steam (progresión, arsenal,
// fortín, madrigueras, nido, supervivencia, mapa, aliados, eventos, caer y guardar a mitad de noche).
// Una comprobación por arreglo. Donde se puede, el código de verdad corre en una VM con lo mínimo alrededor.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const raiz = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
// el texto de una función interna (de `function nombre(` hasta la llave que la cierra, contando llaves)
function extraer(texto, nombre) {
  const i = texto.indexOf(`function ${nombre}(`);
  assert.ok(i >= 0, `no encontré ${nombre}`);
  let n = 0, j = texto.indexOf('{', i);
  for (; j < texto.length; j++) { if (texto[j] === '{') n++; else if (texto[j] === '}' && --n === 0) break; }
  return texto.slice(i, j + 1);
}
const des = leer('src/desafio.js');

// ---------------------------------------------------------------- 1. las semillas que suelta un duende se juntan
// Desde la 3.0 `c.t = ...; c.activo = true;` estaba adentro del comentario de la línea anterior: la semilla
// se veía pero nunca se activaba (no se juntaba nunca) y, como el pozo busca la primera inactiva, las del
// mandamás caían todas en la misma.
{
  const ctx = {
    cristales: [], escena: { add() {} }, THREE: { Mesh: function () { this.visible = false; this.position = { set() {} }; this.rotation = {}; } },
    geoCristal: null, matCristal: null, alturaSuelo: () => 10, Math,
  };
  vm.createContext(ctx);
  vm.runInContext(`${extraer(des, 'soltarCristales')}; this.soltarCristales = soltarCristales;`, ctx);
  ctx.soltarCristales({ x: 0, z: 0 }, 5);
  assert.equal(ctx.cristales.length, 5, 'cinco semillas, cinco en el suelo (antes: una sola, reusada)');
  assert.ok(ctx.cristales.every((c) => c.activo && c.mesh.visible && Number.isFinite(c.t)), 'cada semilla queda activa: se puede juntar');
  let sumadas = 0;
  const ctx2 = { cristales: ctx.cristales, ctx: { sumarMaterial: (k, n) => { if (k === 'cristal') sumadas += n; }, nota() {}, cuanto: () => sumadas }, sonido: { juntar() {} }, Math };
  vm.createContext(ctx2);
  vm.runInContext(`${extraer(des, 'actualizarCristales')}; this.actualizarCristales = actualizarCristales;`, ctx2);
  ctx2.actualizarCristales(0.05, { pos: { x: 0, y: 10, z: 0 } });
  assert.equal(sumadas, 5, 'pasando por encima se juntan las cinco');
}

console.log('verificar-3-8-3-combate: ok');
