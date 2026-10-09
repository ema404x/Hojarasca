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

// ---------------------------------------------------------------- 4. las hachuelas y jabalinas tiradas no se pierden
// Lo que quedaba en el suelo vivía sólo en memoria: guardar y abrir, o caer, lo borraba para siempre; un tiro
// errado adentro del Coihue quedaba bajo el mundo; con el tope lleno, levantarla la hacía desaparecer.
{
  const mundo = leer('src/desafio-arsenal-mundo.js');
  const { RECUPERABLES } = await import('../src/desafio-arsenal.js');
  const { sanearDesafio } = await import('../src/desafio-reglas.js');
  const D = sanearDesafio(null);
  let piso = 0;
  const Malla = function () { this.visible = false; this.position = { set() {} }; this.rotation = { set() {} }; };
  const ctx = {
    enElSuelo: [], MALLAS: { hachuela: {}, jabalina: {} }, RECUPERABLES, THREE: { Mesh: Malla }, escena: { add() {} },
    T: { altura: () => 0 }, api: { D: () => D, alturaSuelo: () => piso }, sonido: {}, Math, Number, Object,
  };
  vm.createContext(ctx);
  const tope = mundo.match(/const TOPE_SUELTAS = \d+;/)[0];
  vm.runInContext(`${tope}\n${['anotarTirada', 'volverATusCosas', 'devolverTiradas', 'dejarEnElSuelo', 'levantar'].map((n) => extraer(mundo, n)).join('\n')}
    this.f = { dejarEnElSuelo, levantar, devolverTiradas };`, ctx);
  D.hachuelas = 0;
  ctx.f.dejarEnElSuelo('hachuela', { x: 10, z: 0 });
  ctx.f.dejarEnElSuelo('hachuela', { x: 20, z: 0 });
  assert.equal(D.armasTiradas.hachuelas, 2, 'las dos tiradas quedan anotadas en la partida');
  const guardada = sanearDesafio(JSON.parse(JSON.stringify(D)));
  assert.equal(guardada.armasTiradas.hachuelas, 2, 'y sobreviven al guardado');
  ctx.f.levantar({ pos: { x: 10, z: 0 } });
  assert.equal(D.hachuelas, 1, 'levantar una suma una');
  assert.equal(D.armasTiradas.hachuelas, 1, 'y la saca de las tiradas');
  ctx.f.devolverTiradas();   // al abrir la partida (o al caer)
  assert.equal(D.hachuelas, 2, 'la que quedó en el suelo vuelve a tus cosas');
  assert.equal(Object.keys(D.armasTiradas).length, 0, 'y no queda nada anotado');
  piso = -1e9;   // adentro del Coihue, fuera de la arena
  ctx.f.dejarEnElSuelo('jabalina', { x: 90, z: 0 });
  assert.equal(D.jabalinas, 1, 'un tiro fuera del piso vuelve directo');
  piso = 0; D.hachuelas = 99;
  ctx.f.dejarEnElSuelo('hachuela', { x: 0, z: 0 });
  ctx.f.levantar({ pos: { x: 0, z: 0 } });
  assert.equal(ctx.enElSuelo.filter((r) => r.activo && r.x === 0).length, 1, 'con el tope lleno queda en el suelo');
  assert.match(des, /arsenal\.devolverTiradas\(\);/, 'al abrir la partida vuelven');
  assert.match(mundo, /function limpiar\(\) \{\n[^\n]*\n\s*devolverTiradas\(\);/, 'al caer vuelven');
  assert.match(des, /if \(RECUPERABLES\[proyectiles\[i\]\.tipo\] && !proyectiles\[i\]\.terminado\) arsenal\.alTerminar\(proyectiles\[i\], 'vida'\);/, 'y las que iban en el aire');
}

// ---------------------------------------------------------------- 5. el fortín: lo ya roto, la zanja guardada, el pasto, la rampa
{
  const fm = leer('src/desafio-fortin-mundo.js');
  // las listas del fortín se rehacen una vez por segundo: E juntaba dos veces los mismos abrojos (devolvían lo que
  // cuestan dos veces) o cargaba piedras en una catapulta ya rota. Sólo cuenta lo que sigue en pie.
  const inter = extraer(fm, 'interaccionCerca');
  assert.match(inter, /&& obras\.obras\.includes\(o\)\) \{ d0 = d; mejor = \{ o, tipo \}; \}/, 'E y el aviso sólo con obras en pie');
  {
    const o = { datos: { x: 0, z: 0, vida: 10 }, plano: { radio: 1, vida: 10 } };
    const ctx = {
      L: { catapulta: [], troncos: [], puente: [], lazo: [], abrojos: [o], rampa: [], armero: [] }, conResina: [], paredes: [], obras: { obras: [] },
      base: () => 0, Math, HELABLES: [], invierno: () => 0, avisoResina: () => null, recargaArmero: () => ({}), api: {}, FORTIN: { catapulta: { piedras: 4 } },
    };
    vm.createContext(ctx);
    vm.runInContext(`${inter}; this.f = interaccionCerca;`, ctx);
    assert.equal(ctx.f({ x: 0, y: 0, z: 0 }, false), null, 'los abrojos ya juntados (todavía en la lista vieja) no se juntan otra vez');
    ctx.obras.obras.push(o);
    assert.equal(ctx.f({ x: 0, y: 0, z: 0 }, false)?.tipo, 'abrojos', 'los que siguen en pie, sí');
  }
  // la zanja guardada ardiendo vuelve apagada (sanearZanja), pero el fuego seguía hasta que te acercabas
  const zanjas = extraer(des, 'actualizarZanjas');
  assert.match(zanjas, /const ardiendo = zanjas\.filter\(\(o\) => \(datosZanja\(o\)\.ardiendo \|\| 0\) > 0\);/, 'el fuego de la zanja pasa por datosZanja');
  // el fuego del pasto quema la madera sana (no sólo la ya golpeada, que era la única con `vida` anotada)
  assert.match(zanjas, /if \(completa\(o\) && !esPiedra\(o\)\) danarObra\(o, ESCAPE\.danoObra \* 0\.5\);/, 'el pasto quema la madera');
  // los troncos de la rampa pasan por encima de lo que está a ras del suelo
  assert.match(extraer(fm, 'chocaTronco'), /if \(o && \(o\.plano\.alto \|\| 1\) > 0\.5\) return true;/, 'la rampa pasa por encima de abrojos y pozos');
}

console.log('verificar-3-8-3-combate: ok');
