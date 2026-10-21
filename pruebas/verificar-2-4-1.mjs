// 2.4.1: lo que encontró la caza de bugs. El guardado con basura (y las fotos al importar
// o sincronizar), y el aviso que tiene que decir lo mismo que hace la tecla.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { antes, que, IDS_OTRAS } from './ayuda-interacciones.mjs';

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
  // 3.8.4: se guarda aGuardar (la partida, o la ya despierta si se cae en el fundido: ver verificar-3-8-4-desafio)
  assert.match(main, /guardarProgreso\(obrasAjenas\.length \? \{ \.\.\.aGuardar, obras: \[\.\.\.\(aGuardar\.obras \|\| \[\]\), \.\.\.obrasAjenas\] \} : aGuardar\)/, 'y vuelven al guardar');
}

// ---------------------------------------------------------------- 4. el aviso dice lo que hace la tecla
{
  // 4.6.1: el aviso y la E salen de la misma tabla (src/interacciones.js): el orden es uno solo
  antes('mostrador', 'puerta', 'el mostrador antes que la puerta del almacén');
  antes('caballo', 'trochita', 'el caballo antes que el tren');
  antes('cantero', 'subir-kayak', 'el kayak después del cantero'); antes('acopio', 'subir-kayak', 'y del acopio');
  // las otras teclas, después de todo lo de E: con algo de E a mano, el aviso es el de E
  const otras = { fuegoPropio: { plano: { id: 'fogon' } }, hachaCerca: {}, aserrar: 'mano', semilla: { nombre: 'un ñire' }, puedeArmarCarpa: true };
  for (const [nombre, est] of [['Dormir junto al fuego', { cercaDelFuego: true, puedeDormirJuntoAlFuego: true }], ['Pedir algo en la casa de té', { enLaCasaDeTe: true }], ['el tendal', { tendalCerca: {} }], ['la semilla', { cerca: { semillaArbol: { arbol: {} } } }], ['Dormir en la carpa', { enLaCarpa: true, puedeDormirJuntoAlFuego: true }]]) {
    assert.equal(que({ ...otras, ...est }).tecla, 'E', `${nombre} va antes que F/H/Y/B/T`);
  }
  assert.ok(['fuego-propio', 'hacha', 'aserrar', 'plantar', 'armar-carpa', 'levantar-carpa'].every((id) => IDS_OTRAS.includes(id)), 'F, H, Y, B y T van en la lista de las otras teclas');
  for (const [est, t] of [[{ hachaCerca: {} }, 'H'], [{ aserrar: 'mano' }, 'Y'], [{ semilla: { nombre: 'x' } }, 'B'], [{ enLaCarpa: true }, 'T'], [{ cercaDelFuego: true }, 'G']]) {
    assert.equal(que(est).tecla, t);
    assert.equal(que({ ...est, modoObra: true }).aviso, null, `con los planos abiertos no se ofrece ${t}`);
  }
  { const r = que({ js: { montado: true }, charlaNpc: {} }); assert.equal(r.aviso, null, 'hablando arriba del caballo, el aviso no dice bajarse'); }
  { const r = que({ desafio: {}, avisoDesafioCerca: null, antorchaApagadaCerca: true }); assert.equal(r.tecla, 'F'); assert.equal(r.texto, 'Encender la antorcha', 'la antorcha apagada se avisa'); }
  assert.equal(que({ mirandoAlPerro: true }).aviso, null, 'el perro sólo si E puede');
  // en la tecla E: lo que mirás gana al tren y al mostrador, como en el aviso
  for (const est of [{ puedeSubirAlTren: true }, { cercaDelMostrador: true }]) { const r = que({ ...est, objetivo: { tipo: 'planta', texto: 'Anotar' } }); assert.equal(r.e, 'objetivo'); assert.equal(r.avisoId, 'objetivo'); }
}

console.log('2.4.1: fotos al importar, partidas con basura, obras de otra versión y el aviso en el orden de la tecla E');
