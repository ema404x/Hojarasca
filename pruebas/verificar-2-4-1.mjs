// 2.4.1: lo que encontró la caza de bugs. El guardado con basura (y las fotos al importar
// o sincronizar), y el aviso que tiene que decir lo mismo que hace la tecla.
import fs from 'node:fs';
import assert from 'node:assert/strict';

// un localStorage de mentira, para el guardado en Node
const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => { almacen.set(k, String(v)); },
  removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null,
  get length() { return almacen.size; },
};
const G = await import('../src/guardado.js');
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------- 1. las fotos que vienen de afuera
{
  const img = 'data:image/png;base64,AAAA';
  const p = { ...G.progresoNuevo(), dia: 4, desafios: { lago: { dia: 2, hora: 9 } } };
  // así las entrega leerPartida: { id: imagen }
  assert.equal(G.escribirPartida('relax', 2, p, { lago: img, basura: 5, otra: 'no es imagen' }), true);
  assert.deepEqual(JSON.parse(almacen.get('hojarasca-p2-fotos-v1')), { lago: img }, 'importar no borra las fotos');
  G.usarModoGuardado('relax', 2);
  assert.equal(G.cargarProgreso().desafios.lago.img, img, 'y vuelven a pegarse al cargar');
  // también sigue aceptando la forma de los desafíos ({ id: { img } })
  assert.equal(G.escribirPartida('relax', 3, p, { lago: { img } }), true);
  assert.deepEqual(JSON.parse(almacen.get('hojarasca-p3-fotos-v1')), { lago: img });
  // ida y vuelta completa, como la carpeta sincronizada
  const ida = G.leerPartida('relax', 2);
  assert.equal(G.escribirPartida('relax', 1, ida.progreso, ida.fotos), true);
  assert.deepEqual(JSON.parse(almacen.get('hojarasca-fotos-v1')), { lago: img }, 'de una ranura a otra, las fotos viajan');
  G.usarModoGuardado('relax', 1);
}

// ---------------------------------------------------------------- 2. basura en la partida
{
  const p = {
    ...G.progresoNuevo(), dia: 7, ramitas: 11,
    obras: [null, 5, 'pared', [1], { plano: 'cantero' }, { x: 1, z: 1 }, { plano: 'cantero', x: 'a', z: 1 },
      { plano: 'cantero', x: 3, z: 4, etapas: '2', rot: 'x', y: 'nada', tinte: 7 }, { plano: 'plano-del-futuro', x: 9, z: 9, etapas: 1, rot: 0 }],
    renovales: [null, { x: 'a', z: 1 }, { x: 5, z: 6, dia: 1 }],
    cosas: { manta: 'si', harina: -2, poncho: '5', yerba: 3.7 },
    entradas: { calafate: 3, miel: { cantidad: 'muchos' }, huevo: { dia: 1, cantidad: -4 }, pinon: { dia: 1, hora: 9, cantidad: 2 } },
    peces: { trucha: 5, perca: { cantidad: 1 } },
    diario: [null, 'hola', { dia: 1, texto: 'bien' }],
    carpa: {},
    desafio: { noche: 3 },
  };
  G.escribirPartida('relax', 2, p, {});
  G.usarModoGuardado('relax', 2);
  const c = G.cargarProgreso();
  G.usarModoGuardado('relax', 1);
  assert.equal(c.dia, 7); assert.equal(c.ramitas, 11);
  assert.deepEqual(c.obras.map((o) => o.plano), ['cantero', 'plano-del-futuro'], 'sólo las obras con plano y lugar; la del futuro se conserva');
  const k = c.obras[0];
  assert.deepEqual([k.x, k.z, k.etapas, k.rot, k.y, k.tinte], [3, 4, 2, 0, undefined, undefined]);
  assert.deepEqual(c.renovales, [{ x: 5, z: 6, dia: 1 }]);
  assert.deepEqual(c.cosas, { poncho: 5, yerba: 3 }, 'las cosas son números, como los materiales');
  assert.equal(c.entradas.calafate, undefined, 'una entrada que no es objeto se va');
  assert.equal(c.entradas.miel.cantidad, 0); assert.equal(c.entradas.huevo.cantidad, 0); assert.equal(c.entradas.pinon.cantidad, 2);
  assert.deepEqual(Object.keys(c.peces), ['perca']);
  assert.deepEqual(c.diario, [{ dia: 1, texto: 'bien' }]);
  assert.equal(c.carpa, null, 'una carpa sin lugar no se arma en NaN');
  assert.equal(c.desafio, undefined, 'en el Relax no viaja un desafío');
}

// ---------------------------------------------------------------- 3. el armado del bosque no se cae por una obra
{
  const cons = leer('src/construccion.js');
  assert.match(cons, /if \(!d \|\| typeof d !== 'object' \|\| !Number\.isFinite\(d\.x\) \|\| !Number\.isFinite\(d\.z\)\) continue;/);
  assert.match(cons, /d\.etapas = Math\.max\(0, Math\.min\(p\.etapas\.length, Math\.floor\(Number\(d\.etapas\) \|\| 0\)\)\);/);
  const main = leer('src/main.js');
  assert.match(main, /obrasAjenas = \(progreso\.obras \|\| \[\]\)\.filter\(\(d\) => d && !PLANO\[d\.plano\]\);/, 'las obras de otra versión se apartan');
  assert.match(main, /guardarProgreso\(obrasAjenas\.length \? \{ \.\.\.progreso, obras: \[\.\.\.\(progreso\.obras \|\| \[\]\), \.\.\.obrasAjenas\] \} : progreso\)/, 'y vuelven al guardar');
}

// ---------------------------------------------------------------- 4. el aviso dice lo que hace la tecla
{
  const main = leer('src/main.js');
  const i0 = main.indexOf("let aviso = objetivo ? { tecla: 'E'");
  const i1 = main.indexOf('mostrarAviso(aviso);', i0);
  const cadena = main.slice(i0, i1);
  const en = (t) => { const i = cadena.indexOf(t); assert.ok(i >= 0, `falta en el aviso: ${t}`); return i; };
  // el mismo orden que la tecla E
  assert.ok(en("texto: 'Ver qué hay en el almacén'") < en("${puertaCerca.objetivo > 0.5 ? 'Cerrar' : 'Abrir'}"), 'el mostrador antes que la puerta del almacén');
  assert.ok(en("texto: 'Subir al zaino'") < en("texto: 'Subir a la trochita'"), 'el caballo antes que el tren');
  assert.ok(en('cacheCantero &&') < en("texto: 'Subir al kayak'") && en('cacheAcopio &&') < en("texto: 'Subir al kayak'"), 'el kayak después del cantero y el acopio');
  // las otras teclas, después de todo lo de E
  const primeraOtra = Math.min(en("tecla: 'F', texto: fuegoPropio"), en("tecla: 'H'"), en("tecla: 'Y'"), en("tecla: 'B'"), en("texto: 'Armar la carpa'"), en("texto: 'Levantar la carpa'"));
  for (const e of ["texto: 'Dormir junto al fuego'", "'Pedir algo en la casa de té'", "'Mirar el tendal'", 'Juntar semilla de', "texto: 'Dormir en la carpa'"]) assert.ok(en(e) < primeraOtra, `${e} va antes que F/H/Y/B/T`);
  assert.match(cadena, /if \(modoObra && aviso && \['H', 'T', 'Y', 'B', 'G'\]\.includes\(aviso\.tecla\)\) aviso = null;/, 'con los planos abiertos no se ofrecen H, T, Y, B ni G');
  assert.match(cadena, /if \(js\.montado && !charla\.npc\) aviso =/, 'hablando arriba del caballo, el aviso no dice bajarse');
  assert.match(cadena, /desafio\.antorchaApagadaCerca\?\.\(js\.pos\)\) aviso = \{ tecla: 'F', texto: 'Encender la antorcha' \}/, 'la antorcha apagada se avisa');
  assert.match(cadena, /mirandoAlPerro\(js, perro\.est\.pos\) && \(rastro \|\| puedoPedirRastro\(\)\)\)/, 'el perro sólo si E puede');
  // en la tecla E: lo que mirás gana al tren y al mostrador, como en el aviso
  assert.match(main, /if \(!js\.enKayak && !objetivo && tren\.puedeSubir\(js\)\) \{ tren\.subir\(jugador\);/);
  assert.match(main, /if \(!js\.enTren && !js\.enKayak && !objetivo && cercaDelMostrador\(\)\) \{ abrirAlmacen\(\); break; \}/);
}

console.log('2.4.1: fotos al importar, partidas con basura, obras de otra versión y el aviso en el orden de la tecla E');
