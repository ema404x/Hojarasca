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

// ---------------------------------------------------------------- 2. otra vuelta: la forja también se lleva
// «con tus armas, las mejoras y los planos»: la lanza de hielo, las flechas de rayo y la honda de empuje
// (la forja de la 2.1, que se paga con semillas doradas) quedaban afuera de SE_LLEVA y se perdían.
{
  const { SE_LLEVA, nuevaVuelta } = await import('../src/desafio-vuelta.js');
  const { FORJA } = await import('../src/desafio-valle.js');
  const { RECETAS } = await import('../src/desafio-reglas.js');
  for (const k of Object.keys(FORJA)) assert.ok(SE_LLEVA.includes(k), `la forja ${k} se lleva a la otra vuelta`);
  for (const r of RECETAS.filter((x) => x.unica && x.da?.cosa)) assert.ok(SE_LLEVA.includes(r.da.cosa), `la mejora única ${r.da.cosa} se lleva`);
  const nueva = nuevaVuelta({ cosas: { lanza: 1, lanzaHielo: 1, arco: 1, arcoRayo: 1 }, desafio: { victoria: true, nido: { caido: true } } }, { cosas: {}, desafio: {} });
  assert.equal(nueva.cosas.lanzaHielo, 1);
  assert.equal(nueva.cosas.arcoRayo, 1);
}

// ---------------------------------------------------------------- 3. guardar y abrir en una noche de mandamás
// Al abrir a mitad de noche vuelven `d.vivos` duendes cortando la lista de la noche; el mandamás va último, así
// que el que seguía vivo no volvía (y, con los que llama contados, volvía uno ya abatido).
{
  const { composicionOleada, sinJefe, sanearDesafio, desafioNuevo } = await import('../src/desafio-reglas.js');
  const i = des.indexOf('// se cargó una partida guardada en medio del ataque');
  const bloque = des.slice(i, des.indexOf('if (d.nodriza && !d.victoria) eventos.iniciarNodriza();', i));
  const linea = bloque.slice(bloque.indexOf('const conJefe'));
  const retomar = (d, n) => {
    let lista = null;
    const ctx = { d, n, tipos: composicionOleada(d.oleadas), sinJefe, empezarOleada: (l) => { lista = l; } };
    vm.createContext(ctx);
    vm.runInContext(linea, ctx);
    return lista;
  };
  const vivo = retomar({ oleadas: 5, jefeCaido: -1 }, 3);
  assert.equal(vivo.length, 3, 'vuelven los que quedaban');
  assert.equal(vivo.filter((t) => t === 'jefe').length, 1, 'con el mandamás que seguía vivo');
  const caido = retomar({ oleadas: 10, jefeCaido: 10 }, 30);
  assert.ok(!caido.includes('jefe'), 'el mandamás ya abatido no vuelve');
  assert.ok(!retomar({ oleadas: 4, jefeCaido: -1 }, 30).includes('jefe'), 'una noche sin mandamás, sin mandamás');
  assert.match(des, /ctx\.nota\('Cayó el mandamás', [^\n]*\n\s*d\.jefeCaido = d\.oleadas;/, 'al caer el mandamás queda anotada la noche');
  assert.equal(desafioNuevo().jefeCaido, -1);
  assert.equal(sanearDesafio({ jefeCaido: 10 }).jefeCaido, 10, 'se guarda');
  assert.equal(sanearDesafio({}).jefeCaido, -1, 'una partida vieja arranca sin jefe anotado');
}

console.log('verificar-3-8-3-combate: ok');
