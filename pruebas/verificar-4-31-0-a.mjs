// 4.31.0 (A): Hojarasca detallista, adentro (src/casa-detalles.js, casa-detalles-mundo.js y casa-detalles-juego.js).
//  1. Las reglas: lo que se guarda (y una partida vieja o rota), cuánta luz da lo prendido (con las luces de siempre), a qué apuntás (de frente
//     y a mano gana), la pava, las campanadas del reloj y los avisos.
//  2. El juego: con un mundo de mentira, la E de verdad hace lo que dice el aviso (prende, abre, sienta, lee, da agua) y guarda; el reloj suena
//     a la hora en punto; la radio y el fuego suenan sólo cerca.
//  3. Lo que se ve: el refugio con sus piezas (three local): lo prendido se ve, la hoja de la ventana abierta reemplaza al vidrio, sólo dos
//     clases de material (los de siempre: ningún programa nuevo).
//  4. El enganche: la entrada `casa` de la tabla de la E, la luz del refugio en main.js, el humo, el sonido con la ventana abierta y el guardado.
// Mutaciones: cada una es una copia del archivo con otro nombre, probada en su propio proceso; tiene que hacer fallar su comprobación.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';
import { que, antes, IDS } from './ayuda-interacciones.mjs';

registrarThree();
const THREE = await import('three');
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const R = process.env.HX_CASA || path.join(raiz, 'src/casa-detalles.js');
const J = process.env.HX_JUEGO || path.join(raiz, 'src/casa-detalles-juego.js');
const MU = process.env.HX_MUNDO || path.join(raiz, 'src/casa-detalles-mundo.js');
const SOLO = process.env.HX_SOLO || '';
const C = await import(pathToFileURL(R).href);

// ---------------------------------------------------------------- 1. las reglas
function pruebaReglas() {
  const nueva = C.casaNueva();
  eq(C.sanearCasa(undefined), nueva, 'una partida vieja (sin `casa`): el refugio como estaba');
  ok(nueva.lampara && nueva.farol && nueva.hogar && !nueva.velas && !nueva.radio, 'de fábrica: lámpara, farol y hogar prendidos (de noche se veían así), velas y radio apagadas');
  eq(nueva.ventanas, [0, 0], 'las ventanas, cerradas'); eq(nueva.cortinas, [0, 0], 'las cortinas, abiertas');
  const rota = C.sanearCasa({ lampara: 'si', farol: false, ventanas: [1, 'x', 1], cortinas: 'no', libro: -4, carta: 7.8, __proto__: { velas: true }, otra: 1 });
  ok(rota.lampara === true && rota.farol === false, 'lo que no es sí/no queda como de fábrica; lo que sí, se respeta');
  eq(rota.ventanas, [1, 0], 'las ventanas: dos, 0 o 1'); eq(rota.cortinas, [0, 0], 'las cortinas rotas: abiertas');
  ok(rota.libro === 0 && rota.carta === 7 && !('otra' in rota), 'los números enteros y sin negativos; nada que no exista');
  eq(C.sanearCasa([1, 2]), nueva, 'una lista no es una casa');
  // la luz
  const de = (o) => ({ ...C.casaNueva(), ...o });
  const b0 = C.brillosCasa(de({}), 1), bApag = C.brillosCasa(de({ lampara: false, hogar: false }), 1), bNada = C.brillosCasa(de({ lampara: false, hogar: false, velas: false }), 1);
  ok(Math.abs(b0.ventana - 1) < 1e-9 && Math.abs(b0.luz - 4 * 1.2) < 1e-9, `de noche con la lámpara y el hogar, la ventana brilla entera (${b0.ventana}) y la luz es la de antes o un poco más (${b0.luz})`);
  ok(bNada.ventana < 0.1 && bNada.luz === 0, `todo apagado: la ventana casi negra (${bNada.ventana}) y la luz cálida apagada`);
  ok(C.brillosCasa(de({ lampara: false, hogar: false, velas: true }), 1).ventana > bApag.ventana, 'las velas solas alumbran algo');
  const bCort = C.brillosCasa(de({ cortinas: [1, 1] }), 1);
  ok(bCort.ventana < b0.ventana * 0.5 && bCort.relleno < 0.6, `con las cortinas corridas la ventana se ve menos desde afuera (${bCort.ventana}) y entra menos día (${bCort.relleno})`);
  ok(C.brillosCasa(de({}), 0).luz > 0 && C.brillosCasa(de({ hogar: false }), 0).luz === 0, 'de día, el hogar prendido alumbra un poco (la misma luz de siempre); apagado, nada');
  ok(C.brillosCasa(de({}), 0).ventana === 0, 'de día la ventana no brilla (como antes)');
  ok(C.brillosCasa(de({ farol: false }), 1).farol === 0 && b0.farol === 1, 'el farol de la puerta: prendido o apagado');
  // a qué apuntás
  const ojo = { x: 0, y: 1.6, z: 0 }, dir = { x: 0, y: 0, z: -1 };
  const lista = [{ p: { x: 0, y: 1.6, z: -1.2 }, r: 0.2 }, { p: { x: 0.5, y: 1.6, z: -1 }, r: 0.2 }, { p: { x: 0, y: 1.6, z: -3 }, r: 0.4 }, { p: { x: 0, y: 1.6, z: 1 }, r: 0.4 }];
  ok(C.elegirMirado(lista, ojo, dir) === 0, 'gana lo que tenés de frente y a mano');
  ok(C.elegirMirado([lista[1]], ojo, dir) === -1, 'lo de al costado (a medio metro del rayo) no');
  ok(C.elegirMirado([lista[2]], ojo, dir) === -1, 'lo de más allá de la mano no');
  ok(C.elegirMirado([lista[3]], ojo, dir) === -1, 'lo de atrás no');
  ok(C.elegirMirado([{ p: { x: 0.05, y: 1.6, z: -1.6 }, r: 0.3 }, { p: { x: 0, y: 1.6, z: -0.9 }, r: 0.3 }], ojo, dir) === 1, 'de dos de frente, el más cercano');
  // la pava
  const p = C.pavaNueva();
  C.avanzarPava(p, 100, true); ok(p.estado === 'fria', 'la pava fría no se calienta sola');
  p.estado = 'calienta'; p.t = 0; C.avanzarPava(p, C.CASA.pavaHierve - 1, true); ok(p.estado === 'calienta', 'todavía no silba');
  C.avanzarPava(p, 1.5, true); ok(p.estado === 'silba', `a los ${C.CASA.pavaHierve} s silba`);
  p.estado = 'calienta'; p.t = 5; C.avanzarPava(p, 1, false); ok(p.estado === 'fria', 'con el hogar apagado, se enfría');
  p.estado = 'lista'; p.t = 0; C.avanzarPava(p, C.CASA.mateDura + 1, true); ok(p.estado === 'fria', 'el agua del mate se termina enfriando');
  // las campanadas
  ok(C.campanadas(22.99, 23.01) === 11 && C.campanadas(11.98, 12.0) === 12 && C.campanadas(23.99, 0.01) === 12 && C.campanadas(12.99, 13.02) === 1, 'a la hora en punto, las de esa hora (de 1 a 12; medianoche son 12)');
  ok(C.campanadas(10.2, 10.6) === 0 && C.campanadas(3, 9) === 0 && C.campanadas(NaN, 4) === 0, 'sin pasar una hora, no; durmiendo (un salto grande), tampoco');
  // los avisos y lo que se puede usar
  const e = C.casaNueva();
  ok(C.avisoCosa('lampara', e) === 'Apagar la lámpara' && C.avisoCosa('lampara', { ...e, lampara: false }) === 'Prender la lámpara', 'la lámpara: lo que va a hacer la E');
  ok(C.avisoCosa('ventana-1', { ...e, ventanas: [0, 1] }) === 'Cerrar la ventana' && C.avisoCosa('cortina-0', { ...e, cortinas: [1, 0] }) === 'Abrir la cortina', 'la ventana y la cortina de cada lado');
  ok(C.avisoCosa('pava', e, { pava: 'silba' }).includes('mate') && C.avisoCosa('bomba', e, { chorro: 1 }) !== C.avisoCosa('bomba', e, {}), 'la pava y la bomba según lo que pasa');
  const ventana0 = C.COSAS_REFUGIO.find((k) => k.id === 'ventana-0'), cortina0 = C.COSAS_REFUGIO.find((k) => k.id === 'cortina-0');
  ok(C.cosaDisponible(ventana0, e) && !C.cosaDisponible(ventana0, { ...e, cortinas: [1, 0] }), 'con la cortina corrida, la ventana no se abre (primero la cortina)');
  ok(C.puntosDeCosa(cortina0, { ...e, cortinas: [1, 0] }).length === 3 && C.puntosDeCosa(cortina0, e).length === 2, 'corrida, la cortina también se toca en el medio de la ventana');
  for (const k of C.COSAS_REFUGIO) ok(typeof C.avisoCosa(k.id, e, {}) === 'string', `«${k.id}» tiene aviso`);
  ok(C.COSAS_REFUGIO.length >= 17, `al menos 17 cosas en el refugio (${C.COSAS_REFUGIO.length})`);
  // los muebles de tus casas
  for (const id of Object.keys(C.MUEBLES_CASA)) ok(typeof C.avisoMueble(id) === 'string', `el mueble «${id}» tiene aviso`);
  ok(Math.abs(C.yawHacia(0, 0, -1)) < 1e-9 && Math.abs(Math.abs(C.yawHacia(Math.PI / 2, 0, -1)) - Math.PI / 2) < 1e-9, 'sentado, mirás al frente del mueble (su -z), girado con él');
  ok(C.textoAlacena(['dulce de calafate']).includes('dulce de calafate') && !C.textoAlacena([]).includes(':'), 'la alacena dice lo tuyo que tengas guardado');
}

// ---------------------------------------------------------------- 2. el juego, con un mundo de mentira
async function pruebaJuego() {
  const { crearCasaDetalles } = await import(pathToFileURL(J).href);
  const ref = { x: 100, y: 5, z: 50, rot: 0.7 };
  const aMundo = (lx, ly, lz) => ({ x: ref.x + lx * Math.cos(ref.rot) + lz * Math.sin(ref.rot), y: ref.y + ly, z: ref.z - lx * Math.sin(ref.rot) + lz * Math.cos(ref.rot) });
  const puntos = {};
  for (const k of C.COSAS_REFUGIO) puntos[k.id] = k.en.map(([x, y, z]) => aMundo(x, y, z));
  const M = { puntos, sentarse: { silla: { x: 1, y: 1, z: 1, mira: 0.3 }, sillon: { x: 2, y: 1, z: 2, mira: 1 } }, picoBomba: puntos.bomba[0], vistos: [], mostrar(si) { this.visible = si; }, actualizar(dt, e, x) { this.ultimo = x; } };
  const progreso = { horas: 10, dia: 2 };
  const hechos = [], sonidos = [];
  const sonido = { ctx: {}, ruido: {}, fuente: () => ({}), golpeRuido: (o) => sonidos.push('ruido'), tono: () => sonidos.push('tono'), encender: () => sonidos.push('encender'), bisagra: () => sonidos.push('bisagra'), juntar: () => sonidos.push('juntar'), silbido: () => sonidos.push('silbido'), chisporrotear: () => sonidos.push('fuego'), pulsar: () => sonidos.push('nota') };
  let dir = { x: 0, y: 0, z: -1 };
  const obras = [];
  const casa = crearCasaDetalles({ ref, mundo: M, sonido, col: null, progreso: () => progreso, adelante: () => dir, nota: (t, s) => hechos.push(`nota:${t}`), guardar: () => hechos.push('guardar'),
    leer: (l) => hechos.push(`leer:${l.quien}`), sentar: (q) => hechos.push(`sentar:${q.x.toFixed(1)}`), relojHora: () => ['Son las diez'], obrasCerca: () => obras, despensa: () => ['miel'] });
  // pararse a un metro de una cosa y mirarla de frente
  const mirar = (id, i = 0) => { const p = M.puntos[id][i]; const k = C.COSAS_REFUGIO.find((q) => q.id === id), h = Math.hypot(p.x - ref.x, p.z - ref.z) || 1, sg = k.afuera ? 1 : -1; const o = { x: p.x + sg * (p.x - ref.x) / h * 0.9, y: p.y + 0.15, z: p.z + sg * (p.z - ref.z) / h * 0.9 }; const d = Math.hypot(p.x - o.x, p.y - o.y, p.z - o.z); dir = { x: (p.x - o.x) / d, y: (p.y - o.y) / d, z: (p.z - o.z) / d }; return { js: { pos: { x: o.x, y: o.y - 1.6, z: o.z }, sentado: false }, cam: { position: o } }; };
  let m = mirar('lampara'), a = casa.accion(m.js, m.cam);
  ok(a && a.texto === 'Apagar la lámpara', `mirando la lámpara, el aviso: «${a?.texto}»`);
  a.hacer(); ok(progreso.casa.lampara === false && hechos.includes('guardar'), 'la E la apaga y se guarda');
  ok(casa.accion(m.js, m.cam).texto === 'Prender la lámpara', 'y el aviso ya dice prenderla');
  m = mirar('hogar'); casa.accion(m.js, m.cam).hacer();
  ok(progreso.casa.hogar === false && !casa.hogarPrendido(), 'el hogar se apaga (y la chimenea deja de humear: ver main.js)');
  m = mirar('pava'); casa.accion(m.js, m.cam).hacer();
  ok(hechos.includes('nota:El hogar está apagado') && casa.pava.estado === 'fria', 'sin fuego, la pava no se calienta');
  m = mirar('hogar'); casa.accion(m.js, m.cam).hacer();
  m = mirar('pava'); casa.accion(m.js, m.cam).hacer(); ok(casa.pava.estado === 'calienta', 'con el hogar prendido, la pava va al fuego');
  casa.actualizar(C.CASA.pavaHierve + 0.5, { pos: m.js.pos, horas: 10, viento: 0 });
  ok(casa.pava.estado === 'silba' && sonidos.includes('silbido'), 'a su tiempo silba (y se oye)');
  m = mirar('pava'); a = casa.accion(m.js, m.cam); ok(a.texto.includes('mate'), `el aviso: «${a.texto}»`); a.hacer();
  ok(casa.pava.estado === 'lista' && hechos.includes('nota:Te cebaste un mate'), 'te cebás un mate');
  m = mirar('silla'); casa.accion(m.js, m.cam).hacer(); ok(hechos.includes('sentar:1.0'), 'la silla te sienta');
  m = mirar('silla'); m.js.sentado = true; ok(casa.accion(m.js, m.cam)?.tipo !== 'silla', 'sentado no se ofrece sentarse otra vez');
  m = mirar('baul'); casa.accion(m.js, m.cam).hacer(); ok(progreso.casa.baul && hechos.includes('nota:En el baúl'), 'el baúl se abre y dice qué tiene');
  m = mirar('libro'); casa.accion(m.js, m.cam).hacer(); casa.accion(m.js, m.cam).hacer(); ok(progreso.casa.libro === 2 && hechos.filter((h) => h.startsWith('leer:Cuaderno')).length === 2, 'el libro se lee de a un capítulo');
  m = mirar('reloj'); casa.accion(m.js, m.cam).hacer(); ok(hechos.includes('leer:El reloj de pared'), 'el reloj de pared dice la hora');
  m = mirar('cortina-0', 1); casa.accion(m.js, m.cam).hacer(); ok(progreso.casa.cortinas[0] === 1, 'la cortina se corre');
  m = mirar('ventana-0'); a = casa.accion(m.js, m.cam); ok(a?.tipo === 'cortina-0' && a.texto === 'Abrir la cortina', `con la cortina corrida, mirando la ventana se abre la cortina (${a?.texto})`);
  a.hacer(); m = mirar('ventana-0'); casa.accion(m.js, m.cam).hacer(); ok(progreso.casa.ventanas[0] === 1 && casa.ventanaAbierta(), 'y después se abre la ventana');
  m = mirar('bomba'); casa.accion(m.js, m.cam).hacer(); ok(casa.estado().chorroBomba > 0 && sonidos.includes('ruido'), 'la bomba da agua (con su sonido)');
  // el reloj suena a la hora en punto, cerca; lejos, no
  const cerca = { x: ref.x, y: ref.y, z: ref.z };
  sonidos.length = 0; casa.actualizar(0.01, { pos: cerca, horas: 10.99, viento: 0 }); casa.actualizar(0.01, { pos: cerca, horas: 11.01, viento: 0 });
  ok(sonidos.filter((s) => s === 'tono').length === 22, `a las once, once campanadas (dos tonos cada una): ${sonidos.filter((s) => s === 'tono').length}`);
  sonidos.length = 0; const lejos = { x: ref.x + 60, y: ref.y, z: ref.z };
  casa.actualizar(0.01, { pos: lejos, horas: 11.99, viento: 0 }); casa.actualizar(0.01, { pos: lejos, horas: 12.01, viento: 0 });
  ok(!sonidos.includes('tono') && M.visible === false, 'lejos, ni campanadas ni nada a la vista');
  // la radio suena bajito, sólo cerca
  progreso.casa.radio = true; sonidos.length = 0; casa.actualizar(0.5, { pos: cerca, horas: 12.1, viento: 0 });
  ok(sonidos.includes('nota'), 'la radio prendida suena cerca');
  // los muebles de tus casas
  obras.push({ plano: { id: 'mesada' }, datos: { x: 0, y: 0, z: 0, rot: 0 } }, { plano: { id: 'sillon' }, datos: { x: 3, y: 0, z: 0, rot: 0 } });
  const mirarObra = (o) => { const [lx, ly, lz] = C.MUEBLES_CASA[o.plano.id].en; const p = { x: o.datos.x + lx, y: o.datos.y + ly, z: o.datos.z + lz }; const ojo = { x: p.x, y: p.y + 0.3, z: p.z - 1 }; const d = Math.hypot(0, 0.3, 1); dir = { x: 0, y: -0.3 / d, z: 1 / d }; return { js: { pos: { x: ojo.x, y: 0, z: ojo.z }, sentado: false }, cam: { position: ojo } }; };
  m = mirarObra(obras[0]); a = casa.accion(m.js, m.cam); ok(a?.texto === 'Abrir la canilla', `la canilla de la mesada: «${a?.texto}»`);
  a.hacer(); ok(casa.estado().chorroObra > 0, 'sale agua de la canilla');
  m = mirarObra(obras[1]); a = casa.accion(m.js, m.cam); ok(a?.texto === 'Sentarte en el sillón', `tu sillón: «${a?.texto}»`); a.hacer(); ok(hechos.includes('sentar:3.0'), 'y te sienta');
  // la luz con lo prendido
  const b = casa.brillos(1); ok(Number.isFinite(b.luz) && Number.isFinite(b.ventana), 'la luz de la casa sale de lo prendido');
}

// ---------------------------------------------------------------- 3. lo que se ve
async function pruebaMundo() {
  const { crearCasaDetallesMundo } = await import(pathToFileURL(MU).href);
  const escena = new THREE.Scene();
  const choques = [];
  const ref = { x: 10, y: 2, z: -4, rot: 0.4 };
  const T = { altura: () => 1.6 };
  const vidrioCasa = new THREE.MeshBasicMaterial({ color: 0x223344, side: THREE.DoubleSide });
  // el vidrio de siempre, fundido con el refugio: las dos ventanas (la del frente y la del costado) en una malla, en el marco del refugio
  const g0 = new THREE.PlaneGeometry(1.1, 0.8).translate(2.2, 1.45, 2.77), g1 = new THREE.PlaneGeometry(1.1, 0.8).rotateY(-Math.PI / 2).translate(-3.52, 1.45, 0);
  const pos = new Float32Array([...g0.toNonIndexed().attributes.position.array, ...g1.toNonIndexed().attributes.position.array]);
  const geoF = new THREE.BufferGeometry(); geoF.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const fundido = new THREE.Mesh(geoF, vidrioCasa); fundido.position.set(ref.x, ref.y, ref.z); fundido.rotation.y = ref.rot; escena.add(fundido);
  ref.vidrio = vidrioCasa;
  const antesF = Array.from(pos);
  const M = crearCasaDetallesMundo({ T, ref, escena, col: { agregar: (c) => choques.push(c) } });
  ok(fundido.visible && M.vidrioDe[0].length === 6 && M.vidrioDe[1].length === 6, `el vidrio fundido (con su material: el reflejo de Ultra) queda; se reconocen las dos ventanas (${M.vidrioDe[0].length} y ${M.vidrioDe[1].length} vértices)`);
  ok(Object.keys(M.puntos).length === C.COSAS_REFUGIO.length, 'cada cosa tiene sus puntos en el mundo');
  ok(choques.length >= 7, `el baúl, la alacena, la bomba y (4.31.1 B) las jambas del hogar frenan (${choques.length} círculos)`);
  const tipos = new Set();
  escena.traverse((o) => { if (o.isMesh) tipos.add(`${o.material.type}|${o.material.side}|${o.material.transparent}|${o.material.vertexColors}`); });
  ok([...tipos].every((t) => t === 'MeshLambertMaterial|0|false|true' || t === 'MeshBasicMaterial|2|false|false'), `sólo los materiales de siempre (ningún programa nuevo): ${[...tipos].join(' · ')}`);
  let mallas = 0; escena.traverse((o) => { if (o.isMesh) mallas++; });
  ok(mallas <= 25, `pocas mallas (${mallas}); se esconden lejos del refugio`);
  const e = { ...C.casaNueva(), velas: true, hogar: false, ventanas: [1, 0], cortinas: [0, 1], baul: true };
  for (let i = 0; i < 40; i++) M.actualizar(0.05, e, { t: i * 0.05, horas: 3.5, viento: 0.5 }, vidrioCasa);
  const P = M.partes;
  ok(P.llamasVelas.visible && !P.fuego.visible, 'las velas prendidas se ven; el hogar apagado no tiene llama');
  const area = (k) => { const a = geoF.attributes.position, v = (i) => new THREE.Vector3().fromBufferAttribute(a, i); return v(k + 1).sub(v(k)).cross(v(k + 2).sub(v(k))).length(); };
  ok(P.hojas[0].visible && !P.hojas[1].visible && area(0) < 1e-9 && area(3) < 1e-9 && area(6) > 0.1 && area(9) > 0.1, 'la ventana abierta: se ve la hoja y su vidrio fijo desaparece; la cerrada, con su vidrio de siempre');
  M.actualizar(0.05, { ...e, ventanas: [0, 0] }, { t: 2 }, vidrioCasa); for (let i = 0; i < 40; i++) M.actualizar(0.05, { ...e, ventanas: [0, 0] }, { t: 2 + i * 0.05 }, vidrioCasa);
  ok(Array.from(geoF.attributes.position.array).every((x, i) => x === antesF[i]), 'cerrada otra vez, el vidrio vuelve entero, igual que antes');
  for (let i = 0; i < 40; i++) M.actualizar(0.05, e, { t: 4 + i * 0.05 }, vidrioCasa);
  ok(Math.abs(P.hojas[0].rotation.y) > 1.2, `la hoja de la ventana gira hacia afuera (${P.hojas[0].rotation.y.toFixed(2)})`);
  ok(P.cortinas[1][0].scale.x > 0.95 && P.cortinas[0][0].scale.x < 0.35, 'la cortina corrida cubre la ventana; la abierta queda recogida');
  ok(P.tapaBaul.rotation.z < -1.3, `la tapa del baúl, levantada (${P.tapaBaul.rotation.z.toFixed(2)})`);
  // el chorro de una canilla de tus casas
  M.actualizar(0.05, e, { t: 3, chorroEn: { de: { x: 1, y: 2, z: 1 }, a: { x: 1, y: 1.1, z: 1 } } }, vidrioCasa);
  ok(P.chorro.visible && Math.abs(P.chorro.scale.y - 0.9) < 0.01, 'el chorro va del pico hasta la pileta');
  M.actualizar(0.05, e, { t: 3.1 }, vidrioCasa);
  ok(!P.chorro.visible, 'y se corta');
}

// ---------------------------------------------------------------- 4. el enganche
function pruebaEnganche() {
  antes('panal', 'casa'); antes('casa', 'obra-trabaja'); antes('casa', 'puerta');
  ok(IDS.filter((x) => x === 'casa').length === 1, 'una sola entrada `casa` en la tabla de la E');
  const r = que({ acciones: { casa: true } });
  ok(r.e === 'casa' && r.hechos.includes('casa.hacer') && r.hechos.includes('limpiar(casa)') && r.avisoId === 'casa', 'la E hace lo que dice el aviso y vuelve a buscar');
  ok(que({ acciones: { casa: true }, desafio: {} }).e !== 'casa', 'en el Desafío, no');
  ok(que({ acciones: { casa: true }, objetivo: { tipo: 'item', texto: 'Juntar' } }).e !== 'casa', 'mirando algo para juntar, eso');
  ok(que({ acciones: { casa: true }, objetivo: { tipo: 'sentarse', s: { cama: true }, texto: 'Acostarte' } }).e === 'casa', 'con la cama al lado, lo que apuntás de frente gana');
  ok(que({ acciones: { casa: true }, js: { montado: true } }).e !== 'casa' && que({ acciones: { casa: true }, js: { enKayak: true } }).e !== 'casa', 'ni a caballo ni en el kayak');
  const main = leer('src/main.js');
  ok(main.includes("case 'casa': return enE ? casaDetalles?.accion(js, camara) : cacheCasa;") && main.includes("cacheCasa = casaDetalles ? casaDetalles.accion(js, camara) : null;"), 'main.js: la E mira fresco y el aviso lo buscado');
  ok(/ref\.luz\.intensity = \(brilloCasa \? brilloCasa\.luz : encendido \* 4\)/.test(main) && main.includes('brilloVentana(ref.vidrio, brilloCasa ? brilloCasa.ventana : encendido, diaInterior);'), 'main.js: la luz y la ventana del refugio salen de lo prendido (sin casa, como antes)');
  ok(main.includes('if (casaDetalles && !casaDetalles.hogarPrendido()) chimeneasTodas = chimeneasTodas.filter((c) => c !== T.lugares.refugio.chimenea);'), 'main.js: con el hogar apagado, la chimenea del refugio no humea');
  ok(main.includes("if (ctxSonido.espacio === 'adentro' && casaDetalles?.ventanaAbierta() && dentroDelRefugio(js.pos)) ctxSonido.espacio = 'alero';"), 'main.js: con la ventana abierta se oye lo de afuera');
  ok(/if \(!esDesafio\) \{\s+try \{\s+const dirCasa/.test(main), 'main.js: sólo en el Relax');
  ok(leer('src/guardado.js').includes("limpio.casa = modoPartida === 'desafio' ? undefined : sanearCasa(p.casa);"), 'guardado.js: la casa se guarda saneada (sólo en el Relax)');
}

if (!SOLO || SOLO === 'reglas') pruebaReglas();
if (!SOLO || SOLO === 'juego') await pruebaJuego();
if (!SOLO || SOLO === 'mundo') await pruebaMundo();
if (!SOLO || SOLO === 'enganche') pruebaEnganche();
if (process.env.HX_CASA || process.env.HX_JUEGO || process.env.HX_MUNDO || process.env.HX_TABLA) { console.log('mutación sin atrapar'); process.exit(0); }

// ---------------------------------------------------------------- mutaciones
const MUT = [
  ['src/casa-detalles.js', 'reglas', 'una partida vieja con la lámpara apagada', 'return { lampara: true, farol: true,', 'return { lampara: false, farol: true,'],
  ['src/casa-detalles.js', 'reglas', 'el saneo acepta cualquier cosa', "for (const k of SI_NO) if (typeof v[k] === 'boolean') n[k] = v[k];", 'for (const k of SI_NO) if (k in v) n[k] = v[k];'],
  ['src/casa-detalles.js', 'reglas', 'las cortinas no tapan la ventana', 'ventana: enc * Math.min(1, Math.max(0.06, fuentes)) * (1 - 0.32 * cerradas),', 'ventana: enc * Math.min(1, Math.max(0.06, fuentes)),'],
  ['src/casa-detalles.js', 'reglas', 'el hogar no alumbra de día', 'luz: enc * 4 * Math.min(1.2, fuentes) + (c.hogar ? 0.9 : 0) * (1 - enc),', 'luz: enc * 4 * Math.min(1.2, fuentes),'],
  ['src/casa-detalles.js', 'reglas', 'se elige lo de atrás', 'if (a <= 0) continue;', ''],
  ['src/casa-detalles.js', 'reglas', 'sin tope de la mano', 'if (d > alcance + r * 0.5 || d < 1e-6) continue;', 'if (d < 1e-6) continue;'],
  ['src/casa-detalles.js', 'reglas', 'la pava hierve sin fuego', "if (!hogar) { p.estado = 'fria'; p.t = 0; } else if", 'if'],
  ['src/casa-detalles.js', 'reglas', 'el reloj da las horas dormidas', 'if (d <= 0 || d > 0.5) return 0;', 'if (d <= 0) return 0;'],
  ['src/casa-detalles.js', 'reglas', 'medianoche da cero', 'return (h % 12) || 12;', 'return h % 12;'],
  ['src/casa-detalles.js', 'reglas', 'la ventana se abre con la cortina corrida', 'if (cosa.ventana !== undefined) return !e.cortinas[cosa.ventana];', ''],
  ['src/casa-detalles-juego.js', 'juego', 'la E no guarda', '    api.guardar();\n  }\n\n  function usarMueble', '  }\n\n  function usarMueble'],
  ['src/casa-detalles-juego.js', 'juego', 'la pava sin fuego igual', "if (!e.hogar) { api.nota('El hogar está apagado', 'Prendelo para calentar el agua'); return; }", ''],
  ['src/casa-detalles-juego.js', 'juego', 'el reloj suena lejos', 'const reloj = cerca(x.pos, CASA.oyeReloj) ? M.puntos.reloj[0] : api.relojCerca?.(x.pos, CASA.oyeReloj);', 'const reloj = M.puntos.reloj[0];'],
  ['src/casa-detalles-juego.js', 'juego', 'sentado se ofrece sentarse', 'if (k.sentarse && js.sentado) continue;', ''],
  ['src/casa-detalles-juego.js', 'juego', 'la canilla sin chorro', 'chorroEn = { de, a }; chorroObra = CASA.chorro;', 'chorroEn = { de, a };'],
  ['src/casa-detalles-mundo.js', 'mundo', 'el vidrio tapa la ventana abierta', 'taparVidrio(v, abierta > 0.01);', ''],
  ['src/casa-detalles-mundo.js', 'mundo', 'el vidrio no vuelve al cerrar', 'else q.A.setXYZ(q.i, q.x, q.y, q.z);', ''],
  ['src/casa-detalles-mundo.js', 'mundo', 'se lleva las dos ventanas', "const v = Math.abs(lz - 2.77) < 0.15 && Math.abs(lx - 2.2) < 0.7 ? 0 :", 'const v = 0 && 0 ? 0 :'],
  ['src/casa-detalles-mundo.js', 'mundo', 'la hoja se abre para adentro', "hojas[v].rotation.y = (v ? -Math.PI / 2 : 0) - abierta * 1.35;", "hojas[v].rotation.y = (v ? -Math.PI / 2 : 0) + abierta * 0.2;"],
  ['src/casa-detalles-mundo.js', 'mundo', 'el fuego no se apaga', 'fuego.visible = !!e.hogar;', 'fuego.visible = true;'],
  ['src/casa-detalles-mundo.js', 'mundo', 'un material transparente nuevo', 'const basico = (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });', 'const basico = (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true });'],
  ['src/casa-detalles-mundo.js', 'mundo', 'el baúl no frena', 'circulo(3.05, -0.78, 0.27, P - 0.1, P + 0.75); circulo(3.05, -0.32, 0.27, P - 0.1, P + 0.75);', ''],
  ['src/interacciones.js', 'enganche', 'la casa en el Desafío', "{ id: 'casa', ...delModulo('casa', (c) => !c.desafio && libre(c.js)", "{ id: 'casa', ...delModulo('casa', (c) => libre(c.js)"],
];
let atrapadas = 0;
for (const [archivo, solo, nombre, de, a] of MUT) {
  const texto = leer(archivo);
  assert.equal(texto.split(de).length, 2, `la mutación «${nombre}» encuentra su fragmento una sola vez en ${archivo}`);
  const esTabla = archivo.endsWith('interacciones.js');
  const copia = path.join(raiz, path.dirname(archivo), `__mut-4310a-${atrapadas}-${path.basename(archivo)}`);
  // la tabla de la E se prueba en su lugar (la importa la ayuda de las pruebas): se cambia el original y se devuelve después
  const destino = esTabla ? path.join(raiz, archivo) : copia;
  fs.writeFileSync(destino, texto.replace(de, a));
  try {
    const clave = archivo.endsWith('casa-detalles.js') ? 'HX_CASA' : archivo.endsWith('-juego.js') ? 'HX_JUEGO' : archivo.endsWith('-mundo.js') ? 'HX_MUNDO' : 'HX_TABLA';
    const envm = { ...process.env, HX_SOLO: solo, [clave]: esTabla ? '1' : copia };
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: envm, encoding: 'utf8' });
    assert.ok(r.status !== 0 && /AssertionError/.test(r.stderr || ''), `la mutación «${nombre}» no se atrapó (o se rompió por otra cosa): ${(r.stdout || '').slice(-200)} ${(r.stderr || '').slice(0, 300)}`);
    atrapadas++;
  } finally { if (esTabla) fs.writeFileSync(destino, texto); else fs.rmSync(copia, { force: true }); }
}
console.log(`verificar-4-31-0-a: ${n} comprobaciones OK · ${atrapadas} de ${MUT.length} mutaciones atrapadas`);
