// 4.31.0 (C): la naturaleza que se toca. Corre el código de verdad: las reglas puras (naturaleza-toque.js), lo visual con three
// (naturaleza-mundo.js: las partículas caen y se van, nada dibuja en reposo, el material de siempre), el juego con un mundo de mentira
// (naturaleza-juego.js: la E, la leña suelta, el sapito, las piedritas, el ripio, el mojado), la tabla de la E, el guardado y los
// enganches con main.js, vegetacion.js, bichos.js y el sonido. Cada regla tiene su mutación: una copia con otro nombre que rompe la
// regla y la prueba tiene que fallar (un proceso de import por copia).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';
import { que, antes, enganche } from './ayuda-interacciones.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// ---------------------------------------------------------------- 1. las reglas puras
function bateriaPura(Q, et = '') {
  const m = (t) => `${et}${t}`;
  const { NATURALEZA: N } = Q;
  // el guardado: una partida vieja no lo trae; uno roto se sanea
  assert.deepEqual(Q.sanearNaturaleza(undefined), { sapitoRecord: 0, sapitos: 0, lena: { dia: 0, tomadas: [] } }, m('una partida vieja: vacío'));
  assert.deepEqual(Q.sanearNaturaleza({ sapitoRecord: 99, sapitos: -3, lena: { dia: 4.7, tomadas: ['l1_2', 'x', 7, '__proto__', 'l-3_-4'] } }), { sapitoRecord: N.saltosMax, sapitos: 0, lena: { dia: 4, tomadas: ['l1_2', 'l-3_-4'] } }, m('roto: recortado y sin basura'));
  assert.equal(Q.sanearNaturaleza({ lena: { tomadas: Array.from({ length: 200 }, (_, i) => `l${i}_0`) } }).lena.tomadas.length, N.tomadasMax, m('la lista de leña tiene tope'));
  assert.deepEqual(Q.sanearNaturaleza([1, 2]), Q.naturalezaVacia(), m('un arreglo: vacío'));
  // la leña suelta: dos ramitas por pila, tope de doce, una vez por día; al otro día vuelve
  const e = Q.naturalezaVacia();
  assert.equal(Q.juntarLena(e, 'l1_1', 5, 0), 2, m('una pila da dos ramitas'));
  assert.equal(Q.juntarLena(e, 'l1_1', 5, 2), 0, m('la misma pila, el mismo día: nada'));
  assert.ok(Q.lenaTomada(e, 'l1_1', 5), m('queda anotada'));
  assert.equal(Q.juntarLena(e, 'l2_1', 5, 11), 1, m('con once ramitas entra una sola'));
  assert.equal(Q.juntarLena(e, 'l3_1', 5, 12), 0, m('con doce no entra nada'));
  assert.ok(!Q.lenaTomada(e, 'l3_1', 5), m('y la pila queda donde está'));
  assert.ok(!Q.lenaTomada(e, 'l1_1', 6), m('al otro día la pila volvió'));
  // las pilas: siempre las mismas, sólo donde el lugar sirve
  const pilas = [];
  for (let i = -20; i < 20; i++) for (let j = -20; j < 20; j++) { const p = Q.pilaDeLena(i, j, () => true); if (p) pilas.push(p); }
  const frac = pilas.length / 1600;
  assert.ok(frac > 0.27 && frac < 0.41, m(`una de cada tres celdas tiene leña (${frac.toFixed(2)})`));
  assert.deepEqual(Q.pilaDeLena(3, -4, () => true), Q.pilaDeLena(3, -4, () => true), m('la misma pila en cada partida'));
  assert.ok(pilas.every((p) => Math.floor(p.x / N.celdaLena) === Number(p.id.slice(1).split('_')[0])), m('cada pila adentro de su celda'));
  assert.equal(pilas.filter((p) => !Q.pilaDeLena(Number(p.id.slice(1).split('_')[0]), Number(p.id.split('_')[1]), () => false)).length, pilas.length, m('donde el lugar no sirve, no hay pila'));
  // las piedritas
  let cuantas = 0;
  for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) if (Q.piedritaDe(i, j, () => 'piedra')) cuantas++;
  assert.ok(cuantas > 400 && cuantas < 900, m(`piedritas en cerca de la mitad de las celdas (${cuantas})`));
  assert.equal(Q.piedritaDe(0, 0, () => null) === null && Q.piedritaDe(1, 1, () => null) === null, true, m('sin suelo para piedritas, ninguna'));
  // patear: cerca, andando y de frente
  assert.ok(Q.patea({ dx: 0.3, dz: 0, vx: 3, vz: 0 }), m('andando hacia ella, la pateás'));
  assert.equal(Q.patea({ dx: 0.3, dz: 0, vx: -3, vz: 0 }), null, m('de espaldas, no'));
  assert.equal(Q.patea({ dx: 0.3, dz: 0, vx: 0.3, vz: 0 }), null, m('casi quieto, no'));
  assert.equal(Q.patea({ dx: 1.5, dz: 0, vx: 3, vz: 0 }), null, m('lejos, no'));
  assert.ok(Q.patea({ dx: 0.3, dz: 0, vx: 6, vz: 0 }).vx > Q.patea({ dx: 0.3, dz: 0, vx: 2, vz: 0 }).vx, m('corriendo sale más lejos'));
  // el sapito
  const az = (v) => () => v;
  for (let k = 0; k < 200; k++) { const s = Q.saltosSapito(Math.random, { agachado: k % 2 === 0 }); assert.ok(s >= 0 && s <= N.saltosMax, m('los saltos, en su rango')); }
  assert.ok(Q.saltosSapito(az(0.5), { agachado: true }) > Q.saltosSapito(az(0.5)), m('agachado (rasante) da más saltos'));
  assert.ok(Q.saltosSapito(az(0.5), { corriendo: true }) < Q.saltosSapito(az(0.5)), m('corriendo, menos'));
  const pq = Q.piquesSapito(5, 4);
  assert.ok(pq.length === 5 && pq.every((d, i) => i === 0 || d - pq[i - 1] < (i > 1 ? pq[i - 1] - pq[i - 2] : pq[0])), m('cada salto, más corto que el anterior'));
  const r0 = Q.naturalezaVacia();
  assert.equal(Q.anotarSapito(r0, 3), true, m('el primero es récord'));
  assert.equal(Q.anotarSapito(r0, 2), false, m('uno peor, no'));
  assert.ok(r0.sapitoRecord === 3 && r0.sapitos === 2, m('el récord y la cuenta'));
  assert.equal(Q.textoSapito(0, 3, false).titulo, '¡Plof!', m('cero saltos: plof'));
  assert.equal(Q.textoSapito(1, 3, false).titulo, '1 salto', m('singular'));
  // las pisadas
  assert.equal(Q.superficiePaso('tierra', { distRiel: 1 }), 'ripio', m('sobre la vía: ripio'));
  assert.equal(Q.superficiePaso('hojarasca', { enCalle: true }), 'ripio', m('en la calle de la aldea: ripio'));
  assert.equal(Q.superficiePaso('tierra', { distRiel: 30 }), 'tierra', m('en el sendero, tierra'));
  for (const s of ['piedra', 'madera', 'agua', 'nieve', 'escarcha']) assert.equal(Q.superficiePaso(s, { distRiel: 0, enCalle: true }), s, m(`${s} no cambia`));
  assert.ok(Q.crujeRama('hojarasca', 0.9, 0.01), m('en el bosque cerrado cruje una ramita'));
  assert.ok(!Q.crujeRama('hojarasca', 0.2, 0.01), m('en el claro, no'));
  assert.ok(!Q.crujeRama('nieve', 0.9, 0.01), m('en la nieve, no'));
  assert.ok(!Q.crujeRama('hojarasca', 0.9, 0.99), m('no a cada paso'));
  // mojarse y secarse
  assert.equal(Q.mojarse(0, 0.1, { nadando: true }), 1, m('nadando, empapado'));
  assert.ok(Q.mojarse(0, 0.1, { prof: 0.3 }) >= 0.35, m('en el arroyo hasta la rodilla, mojado'));
  const seco = Q.mojarse(1, N.secarSeg / 2, {});
  assert.ok(seco > 0.4 && seco < 0.6, m(`al aire, a medio secar en ${N.secarSeg / 2} s (${seco.toFixed(2)})`));
  assert.ok(Q.mojarse(1, 10, { fuego: true }) < Q.mojarse(1, 10, {}), m('junto al fuego se seca más rápido'));
  assert.ok(Q.mojarse(0, 30, { lluvia: 1 }) > 0.2, m('con lluvia y sin techo te mojás'));
  assert.equal(Q.mojarse(0, 30, { lluvia: 1, bajoTecho: true }), 0, m('bajo techo, no'));
  assert.equal(Q.cadaGota(0), Infinity, m('seco no gotea'));
  assert.ok(Q.cadaGota(1) < Q.cadaGota(0.3), m('más mojado, más gotas'));
  // lo que cae
  eq(Q.loQueCae('calafate', { invierno: 0 }).fruto, 'calafate', m('el calafate da frutos fuera del invierno'));
  ok(Q.loQueCae('calafate', { invierno: 1 }).fruto === null && Q.loQueCae('calafate', { invierno: 1 }).nieve > 0, m('en invierno, nieve y nada de fruto'));
  ok(Q.loQueCae('chilco', {}).fruto === null && Q.loQueCae('chilco', {}).pajaros, m('el chilco no da frutos y espanta pájaros'));
  // la E: el orden y los textos
  assert.equal(Q.elegirToque({ arbusto: { tipo: 'chilco' }, lena: { pila: {} } }).id, 'lena', m('la leña le gana al arbusto'));
  assert.equal(Q.elegirToque({ sapito: { borde: 1 }, arbusto: { tipo: 'chilco' } }).id, 'sapito', m('el agua le gana'));
  assert.equal(Q.elegirToque({ pasto: {}, arbol: { especie: 'nire' } }).id, 'arbol', m('el árbol le gana al pasto'));
  assert.equal(Q.elegirToque({}), null, m('nada a mano: nada'));
  assert.equal(Q.textoToque('arbusto', { tipo: 'chilco' }), 'Sacudir el chilco', m('el texto del chilco'));
  assert.equal(Q.textoToque('arbol', { especie: 'nire' }), 'Sacudir el ñire', m('el texto del ñire'));
  assert.equal(Q.textoToque('arbusto', { tipo: 'constructor' }), 'Sacudir el arbusto', m('un tipo raro no rompe el texto'));
  assert.equal(Q.textoToque('pasto', { tipo: 'coiron' }), 'Arrancar un manojo de coirón', m('el coirón'));
  assert.equal(Q.textoToque('lena', { lleno: true }), 'Ya llevás doce ramitas', m('con doce ramitas, el aviso lo dice'));
  assert.ok(Q.mirando(0, 0, 1, 0, 2, 0) > 0.99 && Q.mirando(0, 0, 1, 0, -2, 0) < -0.99, m('mirar: de frente y de espaldas'));
}
const Q = await import('../src/naturaleza-toque.js');
bateriaPura(Q);
n += 60;
{
  const t = leer('src/naturaleza-toque.js');
  ok(!/from 'three'|document\.|window\./.test(t), 'naturaleza-toque.js: reglas puras (sin three ni DOM)');
  ok(!/[ñÑ]/.test((t.match(/export (?:const|function|class) [^\s(=]+/g) || []).join(' ')), 'identificadores exportados sin ñ');
}

// ---------------------------------------------------------------- 2. lo visual (con three de verdad)
registrarThree();
const { crearNaturalezaMundo } = await import('../src/naturaleza-mundo.js');
{
  const hijos = [];
  const escena = { add: (o) => hijos.push(o) };
  const T = { agua: (x) => (x > 50 ? { nivel: 0, prof: 2 } : null), altura: () => 0 };
  const M = crearNaturalezaMundo({ escena, T });
  ok(hijos.length === 10 && hijos.every((o) => o.isInstancedMesh), `una malla instanciada por forma (${hijos.length})`);
  const mats = new Set(hijos.map((o) => o.material));
  ok(mats.size === 1, 'todas con el mismo material');
  const mat = [...mats][0];
  ok(mat.type === 'MeshLambertMaterial' && mat.vertexColors && typeof mat.onBeforeCompile === 'function', 'el material de los objetos del valle (materialVegetal: el mismo programa)');
  ok(hijos.every((o) => !o.instanceColor), 'sin tinte por instancia (no arma una variante nueva del programa)');
  M.actualizar(0.016);
  ok(hijos.every((o) => !o.visible && o.count === 0), 'en reposo, nada dibuja');
  M.hojas(0, 0, 0, 10);
  M.actualizar(0.016);
  ok(hijos.find((o) => o.count === 10)?.visible, 'diez hojas: una sola malla dibujando');
  for (let k = 0; k < 600; k++) M.actualizar(1 / 60);
  ok(M.activas() === 0 && hijos.every((o) => !o.visible), 'las hojas caen, se posan y se van');
  M.salpicar(0, 0, 0, 12, 1);
  let alto = 0;
  for (let k = 0; k < 30; k++) { M.actualizar(1 / 60); alto = Math.max(alto, ...hijos.filter((o) => o.count).map((o) => { const a = o.instanceMatrix.array; return a[13]; })); }
  ok(alto > 0.1, `las gotas saltan (${alto.toFixed(2)} m)`);
  for (let k = 0; k < 200; k++) M.actualizar(1 / 60);
  ok(M.activas() === 0, 'y vuelven al suelo');
  M.anillo(60, 0, 0, { radio: 1 });
  M.actualizar(0.3);
  ok(M.pools.anillo.im.count === 1, 'una onda en el agua');
  for (let k = 0; k < 120; k++) M.actualizar(1 / 60);
  ok(M.pools.anillo.im.count === 0, 'la onda se abre y se borra');
  for (let k = 0; k < 400; k++) M.hojas(0, 0, 0, 1);
  M.actualizar(0.016);
  ok(M.activas() <= 220 && M.pools.hoja.im.count <= M.pools.hoja.cupo, 'las sueltas tienen tope (no crecen sin fin)');
  const src = leer('src/naturaleza-mundo.js');
  ok(!/ShaderMaterial|new THREE\.\w+Material|PointsMaterial|onBeforeCompile/.test(src), '0 programas nuevos: ni shaders ni materiales propios');
  ok(!/PointLight|SpotLight|DirectionalLight/.test(src), 'ni luces');
}

// ---------------------------------------------------------------- 3. el juego con un mundo de mentira
const { crearNaturalezaJuego } = await import('../src/naturaleza-juego.js');
function mundoJuego(crear = crearNaturalezaJuego) {
  const RES = 1;
  // un valle chato: bosque cerrado al oeste (x < 0), un lago al este (x > 40), la vía en z = 100
  const T = {
    altura: () => 0,
    agua: (x) => (x > 40 ? { nivel: 0, prof: x > 45 ? 3 : 0.3, lago: true } : null),
    indice: (x, z) => (x < 0 ? 0 : Math.abs(z - 100) < 1 ? 2 : 1),
    distSendero: [20, 20, 20], distRiel: [50, 50, 0.5], bosque: [0.9, 0.1, 0.1], pasto: [0, 0.9, 0], pendiente: [0, 0, 0],
  };
  const progreso = { dia: 3, horas: 12, ramitas: 0, entradas: {}, naturaleza: undefined };
  const notas = [], sonidos = [];
  const js = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, z: 0 }, yaw: 0, pitch: 0, enSuelo: true, nadando: false, sentado: false, agachado: false, superficie: 'hojarasca', velocidadActual: 0 };
  const sonido = new Proxy({}, { get: (t, k) => (...a) => { sonidos.push(String(k)); return k === 'fuente' ? {} : undefined; } });
  let guardado = 0;
  const ctx = {
    T, sonido, escena: { add() {} }, objetos: { items: [], arrancar: () => true },
    veg: { matasCerca: () => [], arbolesCerca: () => [], sacudirMata: () => true, sacudir: () => true },
    camara: () => null, jugador: () => ({ estado: js }), progreso: () => progreso,
    nota: (t, s) => notas.push(t), guardar: () => { guardado++; }, registrar: () => {}, cabeJuntar: () => true,
    ramitas: () => progreso.ramitas, sumarRamitas: (k) => { progreso.ramitas = Math.min(12, progreso.ramitas + k); },
    dia: () => progreso.dia, horas: () => progreso.horas, bajoTecho: () => false, cercaDelFuego: () => false,
    ambiente: () => ({ lluvia: 0, viento: 0, invierno: 0, otono: 0 }), distanciaAldea: () => 999, pelarPasto: () => () => {},
  };
  return { G: crear(ctx), T, js, progreso, notas, sonidos, guardado: () => guardado, ctx };
}
function bateriaJuego(crear, et = '') {
  const m = (t) => `${et}${t}`;
  const W = mundoJuego(crear);
  const { G, js, progreso } = W;
  // la leña: parado en el bosque, mirando una pila
  js.pos.x = -40; js.pos.z = -40;
  G.actualizar(0.016);
  const pila = G._debug.pilas[0];
  assert.ok(pila, m('en el bosque hay leña suelta a la vista'));
  js.pos.x = pila.x + 1.2; js.pos.z = pila.z; js.yaw = -Math.PI / 2;   // de espaldas a la pila: nada
  const b = G.accion(js);
  assert.ok(!b || b.id !== 'lena', m('de espaldas, la E no la junta'));
  js.yaw = Math.PI / 2;   // mirando hacia −x
  const a = G.accion(js);
  assert.equal(a?.id, 'lena', m(`mirando la pila, la E junta la leña (${a?.id})`));
  assert.equal(a.texto, 'Juntar la leña suelta', m('el aviso'));
  a.hacer();
  assert.equal(progreso.ramitas, 2, m('dos ramitas'));
  assert.ok(progreso.naturaleza.lena.tomadas.includes(pila.id) && W.guardado() > 0, m('anotada y guardada'));
  assert.ok(!G._debug.pilas.some((l) => l.id === pila.id), m('la pila ya no se dibuja'));
  // el sapito: en la orilla mirando al lago
  G.actualizar(0.5);   // (la E tiene un respiro de un tercio de segundo entre dos usos)
  js.pos.x = 39; js.pos.z = 0; js.yaw = -Math.PI / 2; js.pitch = 0;   // mirando hacia +x
  const s = G.accion(js);
  assert.equal(s?.id, 'sapito', m(`en la orilla mirando al agua: el sapito (${s?.id})`));
  s.hacer();
  for (let k = 0; k < 400; k++) G.actualizar(1 / 60);
  assert.equal(progreso.naturaleza.sapitos, 1, m('se anotó el tiro'));
  assert.ok(W.notas.some((t) => /salto|Plof/.test(t)), m('y la nota dice cuántos saltos'));
  // tocar el agua: agachado y mirando abajo
  js.agachado = true; js.pitch = -0.8; js.pos.x = 40;
  assert.equal(G.accion(js)?.id, 'tocarAgua', m('agachado en la orilla: tocar el agua'));
  js.agachado = false; js.pitch = 0;
  // de espaldas al lago, no hay sapito
  js.yaw = Math.PI / 2; js.pos.x = 39;
  assert.ok(G.accion(js)?.id !== 'sapito', m('de espaldas al lago, no'));
  // nadando, nada
  js.nadando = true; js.yaw = -Math.PI / 2;
  assert.equal(G.accion(js), null, m('nadando, la E no hace nada de esto'));
  // mojado: nadando se empapa; afuera gotea y se seca
  for (let k = 0; k < 10; k++) G.actualizar(0.1);
  assert.ok(G.mojado() > 0.99, m('nadando, empapado'));
  js.nadando = false; js.pos.x = 0;
  for (let k = 0; k < 30; k++) G.actualizar(0.1);
  assert.ok(G.mojado() > 0.9 && W.notas.includes('Quedaste empapado'), m('al salir, empapado y la nota'));
  // el ripio: sobre la vía
  js.pos.x = 10; js.pos.z = 100; js.superficie = 'tierra';
  assert.equal(G.alPaso(js, 0.6), 'ripio', m('sobre la vía, el paso suena a ripio'));
  js.pos.z = 0;
  assert.equal(G.alPaso(js, 0.6), 'tierra', m('en el campo, a tierra'));
  // la piedrita pateada rueda
  js.pos.x = 10; js.pos.z = 10;
  G.actualizar(0.016);
  const p = G._debug.piedras.find((q) => !q.mueve);
  if (p) {
    js.pos.x = p.x - 0.3; js.pos.z = p.z; js.vel.x = 4; js.vel.z = 0; js.enSuelo = true;
    const x0 = p.x;
    for (let k = 0; k < 30; k++) G.actualizar(1 / 60);
    assert.ok(p.x - x0 > 0.3, m(`la piedrita pateada rueda (${(p.x - x0).toFixed(2)} m)`));
    js.vel.x = 0;
  }
}
{
  // en este mundo de mentira el suelo de piedritas sale de la orilla y el sendero: la vía (z = 100) y el lago
  bateriaJuego(crearNaturalezaJuego);
  n += 25;
}

// ---------------------------------------------------------------- 4. la tabla de la E
{
  antes('recursos', 'naturaleza');
  antes('fuego', 'naturaleza');
  antes('semilla', 'naturaleza');
  antes('naturaleza', 'objetivo');
  n += 4;
  const A = { naturaleza: { texto: 'Sacudir el chilco' } };
  const r = que({ acciones: A });
  ok(r.e === 'naturaleza' && r.texto === 'Sacudir el chilco', `la E y el aviso: «${r.texto}»`);
  ok(que({ acciones: A, objetivo: { tipo: 'planta', texto: 'Anotar chilco' } }).e === 'objetivo', 'sin anotar, la E anota primero');
  ok(que({ acciones: A, js: { montado: true } }).e !== 'naturaleza', 'a caballo, no');
  ok(que({ acciones: A, js: { enKayak: true } }).e !== 'naturaleza', 'en el kayak, no');
  ok(que({ acciones: A, cercaDelFuego: true, puedeDormirJuntoAlFuego: true }).e === 'fuego', 'junto al fuego, dormir le gana');
  ok(que({ acciones: A, puertaCerca: { objetivo: 0, nombre: 'la puerta' } }).e === 'puerta', 'la puerta le gana');
}

// ---------------------------------------------------------------- 5. el guardado y los enganches
{
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
  const G = await import('../src/guardado.js');
  ok(G.escribirPartida('relax', 1, { modo: 'relax', dia: 5, horas: 10 }), 'una partida vieja se guarda');
  eq(G.leerPartida('relax', 1).progreso.naturaleza, { sapitoRecord: 0, sapitos: 0, lena: { dia: 0, tomadas: [] } }, 'una partida vieja carga con la naturaleza vacía');
  ok(G.escribirPartida('relax', 2, { modo: 'relax', dia: 5, horas: 10, naturaleza: { sapitoRecord: 6, sapitos: 9, lena: { dia: 5, tomadas: ['l1_2', '<script>'] } } }), 'una con récord');
  eq(G.leerPartida('relax', 2).progreso.naturaleza, { sapitoRecord: 6, sapitos: 9, lena: { dia: 5, tomadas: ['l1_2'] } }, 'el récord y la leña vuelven (saneados)');
  const main = leer('src/main.js');
  ok(main.includes("case 'naturaleza': return enE ? naturalezaJuego?.accion(js) : cacheNaturaleza;"), 'la E pide fresco y el aviso usa lo buscado');
  ok(main.includes("case 'naturaleza': cacheNaturaleza = null; break;"), 'después de la E se vuelve a buscar');
  ok(/cacheNaturaleza = naturalezaJuego && !objetivo \? naturalezaJuego\.accion\(js\) : null;/.test(main), 'se busca con lo demás de al lado');
  ok(/naturalezaJuego\?\.actualizar\(dt\); \} catch \(e\) \{ fallaSistema\('naturaleza', e\); \}/.test(main), 'cada cuadro, con su red');
  ok(/sonido\.paso\(naturalezaJuego\?\.alPaso\(js, f\) \|\| js\.superficie, f, js\.corriendo\)/.test(main), 'el paso pasa por la naturaleza (ripio, salpicar, ramitas)');
  ok(/naturalezaJuego\?\.alChapuzon\(js\)/.test(main), 'el chapuzón salpica');
  ok(/if \(!esDesafio\) naturalezaJuego = crearNaturalezaJuego\(/.test(main), 'sólo en el Relax y la Historia');
  const veg = leer('src/vegetacion.js');
  ok(/function sacudirMata\(m, fuerza = 1, desde = null\)/.test(veg) && /sacudir, sacudirMata, crecer/.test(veg), 'vegetacion.js: sacudir una mata');
  ok(/if \(an\.mata\) \{ if \(!an\.a\.sacado\) \{ for \(const m of mallasDe\(an\.a\.ref\)\)/.test(veg), 'la mata vuelve a su lugar sin rehacer los árboles');
  ok(/\(an\.amp \?\? 0\.038\)/.test(veg), 'el árbol se sigue sacudiendo como antes');
  const bi = leer('src/bichos.js');
  ok(/mp\.huye = 2\.6/.test(bi) && /< 2\.2\) \{/.test(bi), 'bichos.js: la mariposa que tenés encima se va');
  const { SUELOS } = await import('../src/sonido-sintesis.js');
  ok(!!SUELOS.ripio, 'hay pisada de ripio');
  ok(/case 'ripio': nivel = 0\.28; break;/.test(leer('src/sonido.js')), 'y su volumen');
  ok(/arrancar: \(it\) => quitar\(it\)/.test(leer('src/objetos.js')), 'objetos.js: arrancar un amancay');
  for (const f of ['naturaleza-juego.js', 'naturaleza-mundo.js', 'naturaleza-toque.js']) {
    const t = leer(`src/${f}`);
    ok(!/^import\s.*;\s*\/\//m.test(t) && !/^import\s+\{[^}]*\n/m.test(t), `${f}: imports de una línea (armar.mjs)`);
  }
  ok(enganche !== undefined, 'ayuda de interacciones');
}

// ---------------------------------------------------------------- 6. mutaciones
let mutaciones = 0;
async function mutar(nombre, archivoSrc, de, a, bateria) {
  const f = leer(`src/${archivoSrc}`);
  if (!f.includes(de)) throw new Error(`la mutación «${nombre}» no encuentra su texto: ${de}`);
  const archivo = path.join(raiz, 'src', `__mut_nat_${process.pid}_${mutaciones++}.js`);
  fs.writeFileSync(archivo, f.replace(de, a));
  try {
    const M = await import(pathToFileURL(archivo).href);
    let fallo = false;
    try { await bateria(M); } catch { fallo = true; }
    assert.ok(fallo, `la mutación «${nombre}» tendría que hacer fallar la prueba y pasó`);
    n++;
  } finally { fs.rmSync(archivo, { force: true }); }
}
const pura = (nombre, de, a) => mutar(nombre, 'naturaleza-toque.js', de, a, (M) => bateriaPura(M, `[${nombre}] `));
await pura('tres ramitas por pila', 'ramitasLena: 2,', 'ramitasLena: 3,');
await pura('sin tope de ramitas', 'topeRamitas: 12,', 'topeRamitas: 99,');
await pura('la pila se junta dos veces', '  if (l.tomadas.includes(id)) return 0;\n  const entra', '  const entra');
await pura('la leña no vuelve al otro día', 'if (!est.lena || est.lena.dia !== dia) est.lena = { dia, tomadas: [] };', 'if (!est.lena) est.lena = { dia, tomadas: [] };');
await pura('leña en todas las celdas', 'probLena: 0.34,', 'probLena: 1,');
await pura('el lugar no importa', '  if (lugar && !lugar(x, z)) return null;\n', '');
await pura('se patea de espaldas', 'if (d > 0.05 && (dx * vx + dz * vz) / (d * v) < 0.2) return null;', '');
await pura('se patea quieto', 'velPatada: 1.1,', 'velPatada: 0,');
await pura('agachado no ayuda', '  if (agachado) base += 1 + Math.floor(a() * 2);\n', '');
await pura('los saltos no se acortan', 'paso *= 0.72;', 'paso *= 1.1;');
await pura('sin ripio en la vía', '  if (distRiel < 1.7) return \'ripio\';\n', '');
await pura('sin ripio en la calle', "  if (enCalle) return 'ripio';", '');
await pura('la piedra se vuelve ripio', "if (sup !== 'tierra' && sup !== 'hojarasca' && sup !== 'pasto') return sup;", '');
await pura('cruje en la nieve', "if (!['hojarasca', 'hojas', 'tierra'].includes(sup)) return false;", '');
await pura('cruje en el claro', 'if (!(bosque >= NATURALEZA.bosqueCruje)) return false;', '');
await pura('nadando no moja', '  if (nadando || prof > 0.7) return 1;\n', '');
await pura('llueve bajo techo', 'if (lluvia > 0.15 && !bajoTecho)', 'if (lluvia > 0.15)');
await pura('el fuego no seca', 'fuego ? NATURALEZA.secarFuego : 1', '1');
await pura('fruto en invierno', "const fruto = tipo === 'calafate' && !nieve ? 'calafate' : null;", "const fruto = tipo === 'calafate' ? 'calafate' : null;");
await pura('el arbusto le gana a la leña', "export const ORDEN_TOQUES = ['tocarAgua', 'sapito', 'lena', 'flor', 'arbusto', 'arbol', 'pasto'];", "export const ORDEN_TOQUES = ['tocarAgua', 'sapito', 'arbusto', 'lena', 'flor', 'arbol', 'pasto'];");
await pura('sin tope en el guardado', '.slice(-NATURALEZA.tomadasMax);', ';');
await pura('el guardado no filtra', ".filter((s) => typeof s === 'string' && /^l-?\\d+_-?\\d+$/.test(s))", '');
await pura('récord sin tope', 'n.sapitoRecord = Math.max(0, Math.min(NATURALEZA.saltosMax, Math.floor(finito(v.sapitoRecord, 0))));', 'n.sapitoRecord = Math.max(0, Math.floor(finito(v.sapitoRecord, 0)));');
// el juego: copias de naturaleza-juego.js (importa las reglas de verdad)
const juego = (nombre, de, a) => mutar(nombre, 'naturaleza-juego.js', de, a, (M) => bateriaJuego(M.crearNaturalezaJuego, `[${nombre}] `));
await juego('la leña no suma', '        ctx.sumarRamitas(n);\n', '');
await juego('la leña no se guarda', "        revisarLugar(js.pos.x, js.pos.z);\n        ctx.guardar();", '        revisarLugar(js.pos.x, js.pos.z);');
await juego('la pila no se mira', 'if (dd < NATURALEZA.alcanceLena && mirando(px, pz, d.x, d.z, l.x, l.z) > NATURALEZA.mira)', 'if (dd < NATURALEZA.alcanceLena)');
await juego('el sapito no se anota', '    const nuevo = anotarSapito(e, saltos);', '    const nuevo = false;');
await juego('sin aviso de empapado', "ctx.nota('Quedaste empapado',", "(() => {})('Quedaste empapado',");
await juego('el paso no mira la vía', 'distRiel: T.distRiel[k],', 'distRiel: 99,');
await juego('la piedrita no rueda', '        p.vx = k.vx; p.vz = k.vz; p.vy = k.vy; p.mueve = true; p.rodar = 0;', '        p.mueve = false;');
await juego('nadando, la E igual', '    if (!js.enSuelo || js.nadando || js.sentado) return c;', '    if (!js.enSuelo || js.sentado) return c;');

console.log(`verificar-4-31-0-c: ${n} comprobaciones y ${mutaciones} mutaciones, todo bien`);
