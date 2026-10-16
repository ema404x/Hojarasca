// 4.1 (F3): el guardarropa de Bruno (src/creador-guardarropa.js, la fila «Guardarropa» de «Tu personaje» en src/personal-personaje.js).
//  · los conjuntos se arman con piezas que el juego YA tiene y con los desbloqueos de siempre: sin poncho o sin botas de goma, el conjunto está bloqueado y dice qué falta;
//  · ponerse un conjunto cambia las prendas y las botas, no los colores ni la campera; un conjunto bloqueado o inexistente no cambia nada (nunca regala una pieza);
//  · los puntos de abrigo de cada conjunto salen de la tabla de prendas del juego, y el panel suma los rasgos de Bruno (±1 punto) al decir cuánto abrigás;
//  · la ropa de fiesta de la peña NO existe todavía: queda registrada como pendiente y no es elegible.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const G = await imp('creador-guardarropa.js'), P = await imp('personal-personaje.js'), E = await imp('creador-efectos.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const sin = (q) => P.desbloqueado({}, q);   // partida recién empezada
const tienePoncho = (q) => P.desbloqueado({ cosas: { poncho: 1 } }, q);
const todo = (q) => P.desbloqueado({ cosas: { poncho: 1, botas: 1 } }, q);
const conj = (id) => G.CONJUNTOS.find((c) => c.id === id);

// ---------------------------------------------------------------- 1. los conjuntos usan lo que el juego tiene
ok(G.CONJUNTOS.length >= 4 && new Set(G.CONJUNTOS.map((c) => c.id)).size === G.CONJUNTOS.length, 'hay varios conjuntos, con ids distintos');
ok(G.CONJUNTOS.every((c) => Object.keys(c.pone).every((k) => Object.hasOwn(P.PRENDAS, k)) && P.BOTAS.some((b) => b.id === c.botas)), 'cada conjunto usa prendas y botas que existen en «Tu personaje»');
ok(G.CONJUNTOS.every((c) => c.pide.every((q) => Object.hasOwn(P.PRENDAS, q) || (q.startsWith('botas:') && P.BOTAS.some((b) => b.id === q.slice(6))))), 'y lo que piden para desbloquearse también existe');
ok(G.CONJUNTOS.every((c) => (c.pone.poncho ? c.pide.includes('poncho') : true) && (c.botas === 'goma' ? c.pide.includes('botas:goma') : true)), 'cada conjunto pide todo lo que usa que no viene de regalo (poncho, botas de goma)');
ok(G.CONJUNTO_PENDIENTE.id === 'fiesta' && !G.CONJUNTOS.some((c) => c.id === 'fiesta'), 'la ropa de fiesta de la peña está registrada como pendiente y no se puede elegir');

// ---------------------------------------------------------------- 2. los desbloqueos de siempre
ok(['diario', 'liviano'].every((id) => G.estadoDeConjunto(conj(id), sin).ok), 'de todos los días y el liviano están desde el principio');
let e = G.estadoDeConjunto(conj('invierno'), sin);
ok(!e.ok && e.falta.join() === 'poncho', 'sin poncho, el abrigo de invierno está bloqueado y dice que falta el poncho');
ok(G.estadoDeConjunto(conj('invierno'), tienePoncho).ok, 'con el poncho (tejido en el telar) se desbloquea');
e = G.estadoDeConjunto(conj('lluvia'), tienePoncho);
ok(!e.ok && e.falta.join() === 'botas:goma', 'con poncho pero sin botas de goma, el de lluvia sigue bloqueado y pide las botas');
ok(G.estadoDeConjunto(conj('lluvia'), todo).ok && G.estadoDeConjunto(conj('invierno-pleno'), todo).ok, 'con poncho y botas, se desbloquean todos');
ok(!G.estadoDeConjunto(null, todo).ok && !G.estadoDeConjunto(undefined, todo).ok, 'un conjunto inexistente nunca está disponible');

// ---------------------------------------------------------------- 3. ponerse un conjunto
const yo = { ...P.personajeDefecto(), campera: 'musgo', colorGorro: 'notro', colorPoncho: 'maqui', colorBufanda: 'negro' };
let r = G.ponerConjunto(yo, 'liviano', sin);
ok(!r.gorro && !r.bufanda && !r.poncho && !r.guantes && r.botas === 'cuero', 'el liviano se saca el gorro y la bufanda');
ok(r.campera === 'musgo' && r.colorGorro === 'notro' && r.colorPoncho === 'maqui' && r.colorBufanda === 'negro' && r.piel === yo.piel, 'y no toca ningún color ni lo demás');
r = G.ponerConjunto(yo, 'invierno', sin);
ok(r === yo, 'bloqueado: devuelve exactamente el mismo personaje (no regala el poncho)');
r = G.ponerConjunto(yo, 'invierno', tienePoncho);
ok(r.poncho && r.gorro && r.bufanda && !r.guantes && r.botas === 'cuero' && r.colorPoncho === 'maqui', 'desbloqueado, se pone poncho, gorro y bufanda con los colores que ya tenía');
r = G.ponerConjunto(yo, 'invierno-pleno', todo);
ok(r.poncho && r.guantes && r.botas === 'goma', 'el de nieve suma guantes y botas de goma');
ok(G.ponerConjunto(yo, 'no-existe', todo) === yo && G.ponerConjunto(yo, 'fiesta', todo) === yo && G.ponerConjunto(yo, undefined, todo) === yo, 'un conjunto inexistente (o el pendiente de la fiesta) no cambia nada');
ok(JSON.stringify(P.sanearPersonaje(G.ponerConjunto(yo, 'invierno-pleno', todo))) === JSON.stringify(G.ponerConjunto(yo, 'invierno-pleno', todo)), 'lo que sale del guardarropa ya es un personaje válido (el saneo no lo cambia)');
ok(G.conjuntoPuesto(P.personajeDefecto()) === 'diario', 'el personaje de arranque lleva el conjunto de todos los días');
ok(G.conjuntoPuesto(G.ponerConjunto(yo, 'invierno-pleno', todo)) === 'invierno-pleno' && G.conjuntoPuesto({ ...yo, guantes: true }) === null, 'se reconoce el conjunto puesto, y una combinación propia no es ninguno');
ok(G.conjuntoPuesto(null) === null && G.conjuntoPuesto('x') === null, 'con basura, ninguno');

// ---------------------------------------------------------------- 4. el abrigo de cada conjunto
const pts = (id, extra = 0) => G.abrigoDeConjunto(conj(id), P.PRENDAS, extra, P.ABRIGO_QUE_TEMPLA);
ok(pts('diario').puntos === 2 && !pts('diario').templa, 'de todos los días abriga 2 y no templa la noche (como hoy)');
ok(pts('liviano').puntos === 0 && pts('lluvia').puntos === 2 && pts('invierno').puntos === 4 && pts('invierno-pleno').puntos === 5, 'liviano 0, lluvia 2, invierno 4, nieve 5');
ok(pts('invierno').templa && pts('invierno-pleno').templa && !pts('lluvia').templa, 'el de invierno y el de nieve templan la noche; el de lluvia no');
ok(!pts('invierno', -1).templa && pts('invierno-pleno', -1).templa, 'con un Bruno friolero (-1) el de invierno ya no alcanza, el de nieve sí');
ok(pts('lluvia', 1).puntos === 2 && !pts('lluvia', 1).templa, 'un +1 no hace milagros: dos puntos de ropa más uno sigue sin templar');
for (const c of G.CONJUNTOS) ok(P.abrigoDeRopa(G.ponerConjunto(P.personajeDefecto(), c.id, todo)) === pts(c.id).puntos, `el abrigo del conjunto «${c.id}» coincide con el que calcula el juego`);

// ---------------------------------------------------------------- 5. el panel
const panel = leer('src/personal-personaje.js');
ok(panel.includes("import { CONJUNTOS, estadoDeConjunto, ponerConjunto, conjuntoPuesto } from './creador-guardarropa.js';") && panel.includes("import { abrigoExtra } from './creador-efectos.js';"), 'el panel importa el guardarropa y el abrigo extra en una línea');
ok(/fila\(cont, 'Guardarropa', segmentos\(CONJUNTOS\.map/.test(panel) && /ponerConjunto\(d, v, estaDesbloqueado\)/.test(panel), 'el panel tiene su fila «Guardarropa» y usa los desbloqueos del panel');
ok(/abrigoDeRopa\(d\) \+ abrigoExtra\(p\?\.personal\?\.bruno, !!api\.mundo\?\.esDesafio\)/.test(panel), 'el cartel de abrigo cuenta los rasgos de Bruno (y no en el Desafío)');
const modulo = leer('src/creador-guardarropa.js');
ok(!/from 'three'/.test(modulo) && !/^import /m.test(modulo), 'el módulo del guardarropa no importa nada (ni three)');
ok(E.abrigoExtra(null) === 0, 'el panel sigue andando sin Bruno (0 de extra)');

console.log(`verificar-4-1-guardarropa: ${pasos} verificaciones OK`);
