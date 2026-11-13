// 4.27.0 (A): panales silvestres. Ocho panales de miel en los árboles grandes del bosque (siempre los mismos para una partida), con abejas de día y con
// sol, un frasco por panal que se recarga en cinco días de sol, la colmena de la Historia que aparece al sacar miel de un panal por primera vez,
// el guardado y el cuaderno. Corre el código de verdad: panales.js (reglas puras), bichos.js (la malla única y la nube de abejas, con el terreno y el
// bosque de verdad en la vm del arnés), guardado.js, y la conducta de las funciones de main.js (con un entorno de mentira).
// Cada regla tiene su mutación: una copia con otro nombre que rompe la regla y la prueba tiene que fallar.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';
import { cargarModulos } from './ayuda-4-0-3-valle.mjs';
import { expresion, funcion } from './ayuda-codigo.mjs';
import { que, antes } from './ayuda-interacciones.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// ---------------------------------------------------------------- 1. las reglas puras de panales.js (con un bosque de mentira)
// Una grilla de árboles grandes (algunos chicos, secos o de otra especie) en todo el valle.
function bosqueDeMentira() {
  const arboles = [];
  for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) {
    const k = i * 40 + j;
    arboles.push({ x: -460 + i * 23.5 + (k % 7), z: -460 + j * 23.5 + (k % 5), y: 10, r: 0.9, esc: 0.8 + (k % 9) * 0.07, especie: ['coihue', 'lenga', 'nire', 'cipres', 'arrayan', 'seco'][k % 6], sacado: false });
  }
  return arboles;
}
function bateriaPura(P, etiqueta = '') {
  const { PANALES, centroDeCelda, CELDAS_POR_LADO, elegirPanales, sanearPanales, panalConMiel, avanzarPanales, usarPanal, panalAlAlcance, hayAbejasPanal, colmenaDisponible, sirveParaPanal } = P;
  const m = (t) => `${etiqueta}${t}`;
  const arboles = bosqueDeMentira();
  const lejos = { camino: () => 999, aldea: () => 999, agua: () => false, altura: () => 10 };
  const a = elegirPanales(arboles, lejos), b = elegirPanales(arboles, lejos);
  assert.equal(a.length, 8, m('ocho panales en todo el valle'));
  assert.deepEqual(a.map((s) => [s.id, s.i]), b.map((s) => [s.id, s.i]), m('siempre en los mismos árboles'));
  assert.equal(new Set(a.map((s) => s.id)).size, 8, m('ocho celdas distintas'));
  assert.equal(new Set(a.map((s) => s.i)).size, 8, m('uno por árbol'));
  for (const s of a) {
    assert.ok(arboles[s.i] === s.arbol && PANALES.especies.includes(s.arbol.especie) && s.arbol.esc >= PANALES.escMin, m('en un árbol grande de bosque'));
    const alto = s.pos.y - 10;
    assert.ok(alto >= 2.2 - 1e-9 && alto <= 3 + 1e-9, m(`a ${alto.toFixed(2)} m del suelo: entre 2,2 y 3`));
    assert.ok(Math.hypot(s.pos.x - s.arbol.x, s.pos.z - s.arbol.z) > 0.5, m('colgado de una rama, fuera del tronco'));
  }
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) assert.ok(Math.hypot(a[i].arbol.x - a[j].arbol.x, a[i].arbol.z - a[j].arbol.z) >= 150, m('separados por 150 m o más'));
  // dos celdas vecinas con un único árbol bueno cada una, cada uno corrido hacia el otro: si quedan a menos de 150 m, sólo se elige uno
  {
    const n = CELDAS_POR_LADO; let mejor = null;
    for (let id = 0; id < n * n; id++) for (const v of [id + 1 < n * n && id % n < n - 1 ? id + 1 : -1, id + n < n * n ? id + n : -1]) {
      if (v < 0) continue;
      const A = centroDeCelda(id), B = centroDeCelda(v), d = Math.hypot(B.x - A.x, B.z - A.z);
      if (!mejor || d < mejor.d) mejor = { A, B, d };
    }
    const u = { x: (mejor.B.x - mejor.A.x) / mejor.d, z: (mejor.B.z - mejor.A.z) / mejor.d }, r = PANALES.alcanceBusqueda - 1;
    const par = [{ x: mejor.A.x + u.x * r, z: mejor.A.z + u.z * r, y: 10, r: 0.9, esc: 1.3, especie: 'coihue' }, { x: mejor.B.x - u.x * r, z: mejor.B.z - u.z * r, y: 10, r: 0.9, esc: 1.3, especie: 'coihue' }];
    const entre = Math.hypot(par[0].x - par[1].x, par[0].z - par[1].z);
    assert.ok(entre < 150, m(`el par de prueba quedó a ${entre.toFixed(0)} m (menos de 150)`));
    assert.equal(elegirPanales(par, lejos).length, 1, m('dos árboles a menos de 150 m: sólo un panal'));
  }
  // los árboles que no sirven: nunca se eligen
  const sirve = (s) => sirveParaPanal(s.arbol, lejos);
  assert.ok(a.every(sirve), m('todos sirven'));
  assert.equal(elegirPanales(arboles, { ...lejos, camino: () => 20 }).length, 0, m('a menos de 40 m de un camino: ninguno'));
  assert.ok(elegirPanales(arboles, { ...lejos, camino: () => 41 }).length === 8, m('a más de 40 m del camino: sí'));
  assert.equal(elegirPanales(arboles, { ...lejos, aldea: () => 10 }).length, 0, m('en la aldea: ninguno'));
  assert.equal(elegirPanales(arboles, { ...lejos, agua: () => true }).length, 0, m('en el agua: ninguno'));
  const media = elegirPanales(arboles, { ...lejos, camino: (x, z) => (x < 0 ? 5 : 999) });
  assert.ok(media.length > 0 && media.every((s) => s.arbol.x >= 0), m('sólo los que están lejos del camino'));
  const talados = arboles.map((t) => ({ ...t, sacado: true }));
  assert.equal(elegirPanales(talados, lejos).length, 0, m('un árbol talado no lleva panal'));
  assert.equal(elegirPanales(arboles.map((t) => ({ ...t, esc: 0.9 })), lejos).length, 0, m('un árbol chico no lleva panal'));
  assert.equal(elegirPanales(arboles.map((t) => ({ ...t, especie: 'arrayan' })), lejos).length, 0, m('un arrayán no lleva panal'));
  assert.deepEqual(elegirPanales([], lejos), [], m('sin bosque, sin panales'));
  // en una ladera la rama sale del lado donde el suelo cambia menos
  const ladera = elegirPanales(arboles, { ...lejos, altura: (x) => 10 + (x - 0) * 0.3 });
  for (const s of ladera) assert.ok(s.pos.y - (10 + s.pos.x * 0.3) >= 2.2 - 1e-9 && s.pos.y - (10 + s.pos.x * 0.3) <= 3 + 1e-9, m('en la ladera, a 2,2 a 3 m del suelo que tiene abajo'));

  // lo que se guarda: sólo los sacados; una partida vieja no trae nada
  assert.deepEqual(sanearPanales(undefined), {}, m('una partida vieja: ningún panal sacado'));
  assert.deepEqual(sanearPanales(null), {}); assert.deepEqual(sanearPanales('x'), {}); assert.deepEqual(sanearPanales([1, 2]), {});
  assert.deepEqual(sanearPanales({ 3: 10, x: 4, 99: 1, 5: 'a', 6: -4, 7: 9999 }), { 3: 10, 6: 0, 7: PANALES.horasRecarga - 0.001 }, m('saneado: ids válidos y horas dentro de la recarga'));
  assert.ok(panalConMiel({}, 4) && panalConMiel(undefined, 4), m('un panal que no figura tiene su frasco'));

  // sacar miel: un frasco, y vacío hasta que pasen cinco días de sol
  const est = {};
  const r1 = usarPanal(est, 4);
  assert.deepEqual(r1, { accion: 'sacar', frascos: 1 }, m('E: un frasco'));
  assert.ok(!panalConMiel(est, 4), m('queda vacío'));
  assert.deepEqual(usarPanal(est, 4), { accion: 'vacio' }, m('vacío: no da otro'));
  assert.ok(panalConMiel(est, 5), m('los otros siguen con su miel'));
  assert.equal(PANALES.frascos, 1, m('guarda 1 frasco como mucho'));
  const sol = { noche: 0, invierno: 0, lluvia: 0 };
  assert.equal(avanzarPanales(est, 54, sol), 0, m('54 h de sol: todavía no'));
  assert.ok(!panalConMiel(est, 4));
  assert.equal(avanzarPanales(est, 1, sol), 1, m('55 h de sol (cinco días de 11 h): recargado'));
  assert.ok(panalConMiel(est, 4), m('y vuelve a tener su frasco'));
  usarPanal(est, 4);
  assert.equal(avanzarPanales(est, 500, { ...sol, invierno: 1 }), 0, m('en invierno no se recarga'));
  assert.equal(avanzarPanales(est, 500, { ...sol, noche: 1 }), 0, m('de noche no se recarga'));
  assert.ok(!panalConMiel(est, 4));
  assert.equal(avanzarPanales(est, 100, { ...sol, lluvia: 0.9 }), 0, m('con lluvia fuerte va lentísimo (100 h no alcanzan)'));
  assert.equal(avanzarPanales(est, 100, { ...sol, lluvia: 0.3 }), 1, m('con llovizna, más lento pero llega'));
  assert.equal(avanzarPanales(null, 5, sol), 0); assert.equal(avanzarPanales({}, 5, sol), 0);
  assert.equal(avanzarPanales(est, 0, sol), 0); assert.equal(avanzarPanales(est, -3, sol), 0);

  // a mano: a 2,5 m o menos y mirándolo
  const s0 = { id: 1, pos: { x: 10, y: 1.7, z: 0 }, arbol: { sacado: false } };
  const mira = { x: 1, y: 0, z: 0 };
  assert.equal(panalAlAlcance([s0], { x: 7.9, y: 1.7, z: 0 }, mira)?.sitio, s0, m('a 2,1 m y mirándolo'));
  assert.equal(panalAlAlcance([s0], { x: 6, y: 1.7, z: 0 }, mira), null, m('a 4 m: lejos'));
  assert.equal(panalAlAlcance([s0], { x: 8, y: 1.7, z: 0 }, { x: -1, y: 0, z: 0 }), null, m('de espaldas: no'));
  assert.equal(panalAlAlcance([s0], { x: 8, y: 1.7, z: 0 }, { x: 0, y: 0, z: 1 }), null, m('mirando para el costado: no'));
  assert.equal(panalAlAlcance([{ ...s0, arbol: { sacado: true } }], { x: 8, y: 1.7, z: 0 }, mira), null, m('con el árbol talado, nada'));
  assert.ok(panalAlAlcance([s0], { x: 7.5, y: 1.7, z: 0 }, mira), m('a 2,5 m justos'));
  assert.equal(panalAlAlcance([], { x: 0, y: 0, z: 0 }, mira), null);

  // las abejas: de día, con sol y fuera del invierno
  assert.ok(hayAbejasPanal({ dia: 1, lluvia: 0, invierno: 0 }), m('de día, con sol'));
  assert.ok(!hayAbejasPanal({ dia: 0, lluvia: 0, invierno: 0 }), m('de noche, no'));
  assert.ok(!hayAbejasPanal({ dia: 1, lluvia: 0.8, invierno: 0 }), m('con lluvia, no'));
  assert.ok(!hayAbejasPanal({ dia: 1, lluvia: 0, invierno: 1 }), m('en invierno, no'));
  assert.ok(!hayAbejasPanal({ dia: 0.3, lluvia: 0, invierno: 0 }), m('al caer la tarde, no'));
  assert.ok(!hayAbejasPanal({}), m('sin datos, no'));

  // la colmena: Relax como siempre, Desafío sin cambios, Historia después del primer panal
  assert.equal(colmenaDisponible({ desafio: false, historia: false, sacoMiel: false }), true, m('Relax: siempre'));
  assert.equal(colmenaDisponible({ desafio: true, historia: false, sacoMiel: true }), false, m('Desafío: nunca'));
  assert.equal(colmenaDisponible({ desafio: false, historia: true, sacoMiel: false }), false, m('Historia: antes del primer panal, no'));
  assert.equal(colmenaDisponible({ desafio: false, historia: true, sacoMiel: true }), true, m('Historia: después, sí'));
}

registrarThree();
const P = await import('../src/panales.js');
bateriaPura(P); n++;

// ---------------------------------------------------------------- 2. el mundo de verdad: terreno y bosque en la vm del arnés
const { THREE: V3, M } = cargarModulos(['terreno.js', 'vegetacion.js', 'colisiones.js', 'bichos.js', 'panales.js', 'config.js', 'aldea-gente.js']);
const TT = M.terreno.generarTerreno();
const distanciaAldea = M.aldea_gente.distanciaAldea;
const sitioReal = {
  camino: (x, z) => Math.min(TT.val(TT.distSendero, x, z), TT.val(TT.distRiel, x, z)),
  aldea: (x, z) => distanciaAldea(x, z), agua: (x, z) => !!TT.agua(x, z), altura: (x, z) => TT.altura(x, z),
};
const porCalidad = {};
for (const q of ['baja', 'media', 'alta']) {
  const escena = new V3.Scene();
  const veg = M.vegetacion.generarVegetacion(TT, M.config.CALIDADES[q], escena);
  const p = M.panales.elegirPanales(veg.arboles, sitioReal);
  const otra = M.panales.elegirPanales(veg.arboles, sitioReal);
  ok(p.length === 8, `calidad ${q}: ocho panales en el valle real (${p.length})`);
  eq(p.map((s) => s.i), otra.map((s) => s.i), `calidad ${q}: siempre los mismos árboles`);
  porCalidad[q] = { p, veg };
  for (const s of p) {
    const a = s.arbol;
    ok(['coihue', 'lenga', 'cipres'].includes(a.especie) && a.esc >= 1, `${q}: id ${s.id} en un ${a.especie} de esc ${a.esc.toFixed(2)}`);
    ok(sitioReal.camino(a.x, a.z) >= 40, `${q}: id ${s.id} a ${sitioReal.camino(a.x, a.z).toFixed(0)} m del camino (40 o más)`);
    ok(sitioReal.aldea(a.x, a.z) >= 30, `${q}: id ${s.id} fuera de la aldea`);
    ok(!TT.agua(a.x, a.z) && !TT.agua(s.pos.x, s.pos.z), `${q}: id ${s.id} fuera del agua`);
    const alto = s.pos.y - TT.altura(s.pos.x, s.pos.z);
    ok(alto >= 2.2 - 1e-6 && alto <= 3 + 1e-6, `${q}: id ${s.id} a ${alto.toFixed(2)} m del suelo de abajo`);
    ok(Math.abs(a.x) < 468 && Math.abs(a.z) < 468, `${q}: id ${s.id} dentro de lo que se camina`);
  }
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) ok(Math.hypot(p[i].arbol.x - p[j].arbol.x, p[i].arbol.z - p[j].arbol.z) >= 150, `${q}: ${p[i].id} y ${p[j].id} a 150 m o más`);
}
eq(porCalidad.baja.p.map((s) => s.id), porCalidad.alta.p.map((s) => s.id), 'las mismas ocho celdas (los mismos ids de guardado) en Baja y en Alta');
eq(porCalidad.media.p.map((s) => s.id), porCalidad.alta.p.map((s) => s.id), 'y en Media');

// ---------------------------------------------------------------- 3. bichos.js: la malla única, la nube de abejas y el zumbido
const sonido = new Proxy({}, { get: () => () => {} });
function mundoConPanales(conMiel) {
  const escena = new V3.Scene();
  const col = M.colisiones.crearColisiones();
  const arb = [];
  for (let i = 0; i < 300; i++) arb.push({ x: (i % 20) * 40 - 400, z: Math.floor(i / 20) * 40 - 300, y: 0, r: 0.8, esc: 1.3, especie: i % 2 ? 'coihue' : 'lenga', sacado: false });
  const vegV = { arboles: arb, plantas: [], matas: [], colisiones: [] };
  const sitios = conMiel ? M.panales.elegirPanales(arb, { camino: () => 999, aldea: () => 999, agua: () => false, altura: () => 0 }) : [];
  const registrados = [];
  const b = M.bichos.crearBichos(TT, vegV, col, escena, sonido, (id) => registrados.push(id), { entradas: {} }, { items: [] }, sitios);
  return { escena, b, sitios, arb, registrados };
}
const dibujos = (escena) => { let c = 0; escena.traverse((o) => { if (o.isMesh || o.isPoints || o.isLine) c++; }); return c; };
const sin = mundoConPanales(false), con = mundoConPanales(true);
ok(con.sitios.length === 8, 'el mundo de prueba tiene ocho panales');
ok(dibujos(con.escena) === dibujos(sin.escena), `0 llamadas de dibujo nuevas: ${dibujos(sin.escena)} objetos con sólo el panal del tronco, ${dibujos(con.escena)} con los ocho de miel`);
{
  const grupo = con.escena.children.find((o) => o.name === 'panales');
  ok(!!grupo && grupo.children.filter((o) => o.isMesh).length === 2, 'los panales son un grupo con una malla fundida y el hueco del panal del tronco');
  ok(grupo.children.filter((o) => o.isMesh && o.material.vertexColors).length === 1, 'la malla fundida usa el material de la fauna (sin programas de shader nuevos)');
}
const nube = () => con.b._debug.nubePanales();
const clima = (extra = {}) => ({ escuchando: 0, dia: 1, noche: 0, lluvia: 0, otono: 0, invierno: 0, horas: 12, ...extra });
const jugadorEn = (x, z) => ({ estado: { pos: new V3.Vector3(x, 0, z), zoom: false, agachado: false, vel: new V3.Vector3() }, pos: new V3.Vector3(x, 0, z) });
const camaraEn = (x, z) => { const c = new V3.PerspectiveCamera(); c.position.set(x, 1.7, z); return c; };
const correr = (w, x, z, m, cuadros = 4) => { let r; for (let i = 0; i < cuadros; i++) r = w.b.actualizar(0.05, jugadorEn(x, z), camaraEn(x, z), m); return r; };
const s0 = con.sitios[0], s1 = con.sitios[1];
// lejos de todo (a más de 70 m de cualquier panal): nada se dibuja
{
  const lejosDeTodo = (() => { for (let x = -460; x < 460; x += 20) for (let z = -360; z < 460; z += 20) if (con.sitios.every((s) => Math.hypot(s.pos.x - x, s.pos.z - z) > 100) && Math.hypot(con.b._debug.panal.pos.x - x, con.b._debug.panal.pos.z - z) > 100) return { x, z }; return null; })();
  ok(!!lejosDeTodo, 'hay un lugar a más de 100 m de todos los panales');
  correr(con, lejosDeTodo.x, lejosDeTodo.z, clima());
  ok(nube().g.visible === false && nube().puntos.visible === false, 'lejos de los panales: ni la malla ni las abejas se dibujan');
}
// cerca de un panal de miel, de día
correr(con, s0.pos.x + 3, s0.pos.z, clima());
ok(nube().g.visible === true, 'a 3 m de un panal: la malla se dibuja');
ok(nube().puntos.visible === true, 'de día, con sol y fuera del invierno: la nube de abejas está afuera');
{
  const P3 = nube().puntos.geometry.attributes.position.array;
  let mejor = 1e9; for (let i = 0; i < 26; i++) mejor = Math.min(mejor, Math.hypot(P3[i * 3] - s0.pos.x, P3[i * 3 + 2] - s0.pos.z));
  ok(mejor < 3.5, `la nube anda alrededor del panal (la más cercana a ${mejor.toFixed(1)} m)`);
}
const r0 = correr(con, s0.pos.x + 3, s0.pos.z, clima());
ok(r0.panal && r0.panal.fuerza > 0 && Math.hypot(r0.panal.pos.x - s0.pos.x, r0.panal.pos.z - s0.pos.z) < 0.01, 'suena el zumbido del panal con abejas (el canal de siempre)');
// de noche, con lluvia y en invierno: las guardan
correr(con, s0.pos.x + 3, s0.pos.z, clima({ dia: 0 }));
ok(nube().puntos.visible === false && nube().g.visible === true, 'de noche: sin abejas, y el panal se sigue viendo');
{ const r = correr(con, s0.pos.x + 3, s0.pos.z, clima({ dia: 0 })); ok(!r.panal || Math.hypot(r.panal.pos.x - s0.pos.x, r.panal.pos.z - s0.pos.z) > 1, 'de noche el panal de miel no zumba'); }
correr(con, s0.pos.x + 3, s0.pos.z, clima({ lluvia: 0.9 }));
ok(nube().puntos.visible === false, 'con lluvia: sin abejas');
correr(con, s0.pos.x + 3, s0.pos.z, clima({ invierno: 1 }));
ok(nube().puntos.visible === false, 'en invierno: sin abejas');
// a 40 m (más de 25): el panal se ve, las abejas no
correr(con, s0.pos.x + 40, s0.pos.z, clima());
ok(nube().g.visible === true && nube().puntos.visible === false, 'a 40 m: se ve el panal y todavía no hay abejas');
// una sola nube que se va al panal más cercano
correr(con, s1.pos.x + 2, s1.pos.z, clima(), 6);
{
  const P3 = nube().puntos.geometry.attributes.position.array;
  let mejor = 1e9; for (let i = 0; i < 26; i++) mejor = Math.min(mejor, Math.hypot(P3[i * 3] - s1.pos.x, P3[i * 3 + 2] - s1.pos.z));
  ok(nube().puntos.visible && mejor < 3.5, `la misma nube se mueve al panal que tengas cerca (a ${mejor.toFixed(1)} m del segundo)`);
}
// el alboroto al sacar miel
{
  const c1 = con.b._debug.panalesMiel.find((c) => c.id === s1.id);
  ok(c1.enojo < 0.5, 'tranquilo antes de sacarle miel');
  con.b.alborotarPanal(s1.id);
  ok(c1.enojo === 1, 'alborotarPanal: las abejas salen alborotadas');
  ok(con.b.alborotarPanal(9999) === undefined, 'y un id que no existe no rompe nada');
  const r = correr(con, s1.pos.x + 2, s1.pos.z, clima(), 1);
  ok(r.panal && r.panal.fuerza > 1, 'alborotadas, zumban más fuerte');
}
// talado el árbol: el panal y sus abejas se van
{
  const P0 = () => con.escena.children.find((o) => o.name === 'panales').children.find((o) => o.isMesh && o.material.vertexColors).geometry.attributes.position;
  const [v0, v1] = con.b._debug.panalesMiel.find((c) => c.id === s0.id).rango;
  const alto0 = P0().getY(v0 + 3);
  ok(alto0 > -500, 'el panal está en su lugar');
  s0.arbol.sacado = true;
  correr(con, s0.pos.x + 3, s0.pos.z, clima());
  ok(P0().getY(v0 + 3) < -500 && P0().getY(v1 - 1) < -500, 'talado el árbol, el panal se va de la malla');
  ok(nube().puntos.visible === false, 'y se van las abejas');
  const otro = con.b._debug.panalesMiel.find((c) => c.id === s1.id);
  ok(P0().getY(otro.rango[0] + 3) > -500, 'los demás panales no se tocan');
  ok(panalAl(s0) === null, 'y ya no se puede sacar miel de ahí');
}
function panalAl(s) { return P.panalAlAlcance([s], { x: s.pos.x + 2, y: s.pos.y - 1, z: s.pos.z }, { x: -1, y: 0.3, z: 0 }); }
// un mundo sin panales de miel: el panal del tronco se comporta como siempre
{
  const p = sin.b._debug.panal;
  ok(!!p && sin.b._debug.panalesMiel.length === 0, 'sin panales de miel, sólo el del tronco');
  const a = p.arbol, w = sin;
  for (let i = 0; i < 4; i++) w.b.actualizar(0.05, jugadorEn(a.x + 8, a.z), camaraEn(a.x + 8, a.z), clima());
  ok(p.g.visible === true && p.puntos.visible === true, 'el del tronco: con sol se ve y salen sus abejas');
  a.sacado = true;
  for (let i = 0; i < 5; i++) w.b.actualizar(0.05, jugadorEn(a.x + 8, a.z), camaraEn(a.x + 8, a.z), clima());
  ok(p.talado === true && p.g.visible === false && p.puntos.visible === false, 'talado su árbol, se van el panal y sus abejas');
}

// ---------------------------------------------------------------- 4. guardado y cuaderno
{
  const almacen = new Map();
  globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => { almacen.set(k, String(v)); }, removeItem: (k) => { almacen.delete(k); }, key: (i) => [...almacen.keys()][i] ?? null, get length() { return almacen.size; } };
  const G = await import('../src/guardado.js');
  G.usarModoGuardado('relax', 1);
  const p = G.progresoNuevo();
  p.panales = { 4: 12.5, 6: 0 };
  ok(G.escribirPartida('relax', 1, p), 'se guarda una partida con dos panales sacados');
  const c = G.cargarProgreso();
  eq(c.panales, { 4: 12.5, 6: 0 }, 'cargada: los mismos panales siguen sacados, con lo que llevan de recarga');
  // una partida vieja (sin la clave) carga sin panales sacados
  const vieja = G.progresoNuevo(); delete vieja.panales;
  G.escribirPartida('relax', 2, vieja);
  G.usarModoGuardado('relax', 2);
  eq(G.cargarProgreso().panales, {}, 'una partida vieja carga sin panales sacados');
  // un guardado roto
  const rota = G.progresoNuevo(); rota.panales = { 4: 'x', 99: 5, uno: 1, 5: Infinity };
  G.escribirPartida('relax', 3, rota); G.usarModoGuardado('relax', 3);
  eq(G.cargarProgreso().panales, {}, 'un guardado roto: saneado');
}
{
  const { ENTRADA } = await import('../src/cuaderno.js');
  const e = ENTRADA['panal-miel'];
  ok(!!e && e.nombre === 'Panal silvestre' && e.seccion === ENTRADA.miel.seccion, 'cuaderno: «Panal silvestre» en la sección de la miel');
  ok(e.pista === 'En los árboles grandes del bosque, de día y con sol se oyen las abejas.', 'con la pista pedida');
  ok(ENTRADA.miel.nombre === 'Miel' && ENTRADA.miel.pista === 'Armá una colmena (O → Trabajo) cerca de la huerta y esperá unos días de sol.', 'la entrada «miel» de la colmena queda igual');
  ok(ENTRADA.panal.seccion === 'fauna' && ENTRADA.panal.id === 'panal', 'y el panal del tronco hueco, en la fauna, también');
}

// ---------------------------------------------------------------- 5. el enganche con el juego (main.js con un entorno de mentira)
function pruebaMain(main, etiqueta = '') {
  const m = (t) => `${etiqueta}${t}`;
  // la tecla E y el aviso: una entrada de la tabla, antes de las obras que trabajan
  const t1 = que({ cerca: { panal: { sitio: { id: 3 }, d: 2 } } });
  assert.equal(t1.e, 'panal', m('E: el panal'));
  assert.equal(t1.avisoId, 'panal', m('el aviso: el panal'));
  assert.equal(t1.texto, '<textoPanal>', m('el aviso lo dice el juego (textoPanal)'));
  assert.ok(t1.hechos.includes('sacarMielDelPanal'), m('E: saca la miel'));
  assert.notEqual(que({ cerca: { panal: { sitio: { id: 3 }, d: 2 } }, js: { enTren: true } }).e, 'panal', m('arriba del tren, no'));
  assert.notEqual(que({ cerca: { panal: { sitio: { id: 3 }, d: 2 } }, js: { enKayak: true } }).e, 'panal', m('en el kayak, no'));
  assert.equal(que({ cerca: { panal: { sitio: { id: 3 }, d: 2 } }, objetivo: { tipo: 'arbol', texto: 'Anotar lenga' } }).e, 'panal', m('el «Anotar lenga» del tronco no le gana'));
  assert.notEqual(que({ cerca: { panal: { sitio: { id: 3 }, d: 2 } }, objetivo: { tipo: 'item', texto: 'Juntar ramita' } }).e, 'panal', m('mirando algo para juntar, eso'));
  assert.equal(que({}).e === 'panal', false, m('sin panal cerca, nada'));
  antes('panal', 'obra-trabaja', m('el panal va antes que las obras que trabajan'));
  assert.ok(/panal: \(\) =>|case 'panal'/.test(main) && /textoPanal: \(h\) => textoPanal\(h\), sacarMielDelPanal: \(h\) => sacarMielDelPanal\(h\)/.test(main), m('main.js le da a la tabla textoPanal y sacarMielDelPanal'));
  assert.ok(/case 'panal': return enE \? panalCerca\(\) : cachePanal;/.test(main), m('la E mira fresco y el aviso usa lo buscado a 10 Hz'));
  assert.ok(/cachePanal = panalCerca\(\);/.test(main), m('y se busca con el resto de lo de al lado'));

  // sacar miel
  const mundo = (relaxTipo, mochila = true) => {
    const est = {}, notas = [], registrados = [], progreso = { entradas: {} }, alborotados = [];
    const env = {
      panalesEstado: () => est, panalConMiel: P.panalConMiel, usarPanal: P.usarPanal, PANALES: P.PANALES, TEXTO_PANAL: P.TEXTO_PANAL,
      cabeJuntar: () => mochila, progreso, ajustes: { relaxTipo }, modoObra: false, dibujarPanelObra: () => {}, refrescarBarra: () => {}, guardar: () => { env.guardados++; },
      sumarEntrada: (k, c) => { progreso.entradas[k] = progreso.entradas[k] || { cantidad: 0 }; progreso.entradas[k].cantidad += c; return progreso.entradas[k].cantidad; },
      registrar: (id) => { registrados.push(id); progreso.entradas[id] = progreso.entradas[id] || { cantidad: 0 }; },
      sonido: { juntar: () => {} }, bichos: { alborotarPanal: (id) => alborotados.push(id) }, nota: (t, s) => notas.push([t, s]), guardados: 0,
    };
    return { env, est, notas, registrados, progreso, alborotados, sacar: funcion(main, 'sacarMielDelPanal', env) };
  };
  {
    const w = mundo('historia');
    w.sacar({ sitio: { id: 4 } });
    assert.equal(w.progreso.entradas.miel.cantidad, 1, m('un frasco de miel en la mochila (el mismo objeto de la colmena)'));
    assert.ok(w.registrados.includes('panal-miel'), m('el cuaderno anota «Panal silvestre»'));
    assert.deepEqual(w.alborotados, [4], m('las abejas del panal se alborotan'));
    assert.ok(!P.panalConMiel(w.est, 4), m('el panal queda vacío'));
    assert.ok(w.notas.some(([t]) => t === 'Sacaste un frasco de miel'), m('aviso: sacaste un frasco'));
    assert.ok(w.notas.some(([t, s]) => t === 'Te llevás un puñado de abejas.' && s === 'Ya podés armar una colmena (O → Trabajo).'), m('Historia, la primera vez: «Te llevás un puñado de abejas. Ya podés armar una colmena (O → Trabajo).»'));
    assert.ok(w.env.guardados >= 1, m('y guarda'));
    w.notas.length = 0;
    w.sacar({ sitio: { id: 4 } });
    assert.equal(w.progreso.entradas.miel.cantidad, 1, m('vacío: no da otro frasco'));
    assert.deepEqual(w.notas, [['El panal está vacío.', 'Las abejas necesitan unos días de sol.']], m('vacío: «El panal está vacío. Las abejas necesitan unos días de sol.»'));
    w.notas.length = 0;
    w.sacar({ sitio: { id: 5 } });
    assert.ok(!w.notas.some(([t]) => /puñado/.test(t)), m('el segundo panal ya no repite lo de las abejas'));
    assert.equal(w.progreso.entradas.miel.cantidad, 2, m('otro panal, otro frasco'));
  }
  {
    const w = mundo('relax');
    w.sacar({ sitio: { id: 4 } });
    assert.equal(w.progreso.entradas.miel.cantidad, 1, m('Relax: también da el frasco'));
    assert.ok(!w.notas.some(([t]) => /puñado/.test(t)), m('Relax: sin el aviso de la colmena (ya la tenés en el menú)'));
  }
  {
    const w = mundo('historia', false);
    w.sacar({ sitio: { id: 4 } });
    assert.ok(P.panalConMiel(w.est, 4) && !w.progreso.entradas.miel, m('con la mochila llena, la miel queda en el panal'));
  }
  // la colmena en el menú
  const entorno = { esDesafio: false, ajustes: { relaxTipo: 'relax' }, progreso: { entradas: {} }, colmenaDisponible: P.colmenaDisponible };
  const vista = expresion(main, 'const colmenaALaVista = ', entorno);
  assert.equal(vista(), true, m('Relax: la colmena en el menú'));
  entorno.ajustes.relaxTipo = 'historia';
  assert.equal(vista(), false, m('Historia, antes del primer panal: no'));
  entorno.progreso.entradas['panal-miel'] = { dia: 1 };
  assert.equal(vista(), true, m('Historia, después: sí'));
  entorno.esDesafio = true;
  assert.equal(vista(), false, m('Desafío: no (sin cambios)'));
  const PL = [{ id: 'colmena', categoria: 'trabajo', nombre: 'Colmena' }, { id: 'cantero', categoria: 'trabajo' }, { id: 'tendal', categoria: 'trabajo' }];
  const lista = (relaxTipo, miel) => funcion(main, 'planosDeCategoria', { PLANOS_JUEGO: PL, categoriaObra: 'trabajo', progreso: { entradas: miel ? { 'panal-miel': {} } : {} }, colmenaALaVista: () => colmenaDisponible2(relaxTipo, miel) })('trabajo').map((p) => p.id);
  const colmenaDisponible2 = (relaxTipo, miel) => P.colmenaDisponible({ desafio: false, historia: relaxTipo === 'historia', sacoMiel: miel });
  assert.deepEqual(lista('historia', false), ['cantero', 'tendal'], m('Historia sin panal: el menú de Trabajo sin la colmena'));
  assert.deepEqual(lista('historia', true), ['colmena', 'cantero', 'tendal'], m('Historia con panal: con la colmena'));
  assert.deepEqual(lista('relax', false), ['colmena', 'cantero', 'tendal'], m('Relax: con la colmena'));
  // el aviso de alboroto y la recarga
  assert.ok(/function revisarPanales\(dt\)/.test(main) && /hayAbejasPanal\(/.test(main) && /seAlborotan\(Math\.hypot\(s\.pos\.x - js\.pos\.x, s\.pos\.z - js\.pos\.z\), true, alborotoPanal\)/.test(main), m('pasar corriendo al lado de un panal con abejas afuera las alborota'));
  assert.ok(/if \(!esDesafio && progreso\.panales\) avanzarPanales\(progreso\.panales, horas,/.test(main), m('la recarga corre con las horas del juego, estés donde estés'));
  assert.ok(/revisarPanales\(dtReal\);/.test(main), m('y se revisa cada cuadro'));
  assert.ok(/elegirPanales\(veg\.arboles, \{ camino: .*distSendero.*distRiel.*aldea: .*distanciaAldea.*agua:.*altura:/.test(main.replace(/\n/g, ' ')) && /esDesafio \? \[\] : elegirPanales/.test(main), m('main.js elige los panales con el camino, la aldea, el agua y el suelo de verdad (y sin panales en el Desafío)'));
  assert.ok(/crearBichos\(T, veg, col, escena, sonido, registrar, progreso, objetos, panalesSilvestres\)/.test(main), m('y se los pasa a bichos'));
}
const main = leer('src/main.js');
pruebaMain(main); n++;

// ---------------------------------------------------------------- 6. ni shaders ni dibujos nuevos
{
  const pan = leer('src/panales.js'), bi = leer('src/bichos.js');
  ok(!/ShaderMaterial|onBeforeCompile|RawShader|new THREE\./.test(pan), 'panales.js es puro: sin three ni shaders');
  const trozo = bi.slice(bi.indexOf('// 4.27.0: los panales (el del tronco hueco'), bi.indexOf('// ---------------------------------------------------------------- lógica'));
  ok(trozo.length > 500 && !/ShaderMaterial|onBeforeCompile|RawShader/.test(trozo), 'la malla de los panales no suma programas de shader');
  ok(/new THREE\.Mesh\(geo, MAT_FAUNA\)/.test(bi), 'la malla fundida usa MAT_FAUNA (el programa de la fauna)');
}

// ---------------------------------------------------------------- 7. mutaciones: cada regla rota tiene que hacer fallar su prueba
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mut-4270-'));
let mutaciones = 0;
async function mutarPanales(nombre, de, a) {
  const f = leer('src/panales.js');
  if (!f.includes(de)) throw new Error(`la mutación «${nombre}» no encuentra su texto: ${de}`);
  const archivo = path.join(raiz, 'src', `__mut_panales_${process.pid}_${mutaciones++}.js`);
  fs.writeFileSync(archivo, f.replace(de, a));
  try {
    const Q = await import(pathToFileURL(archivo).href);
    let fallo = false;
    try { bateriaPura(Q, `[${nombre}] `); } catch { fallo = true; }
    assert.ok(fallo, `la mutación «${nombre}» tendría que hacer fallar la prueba y pasó`);
    n++;
  } finally { fs.rmSync(archivo, { force: true }); }
}
function mutarMain(nombre, de, a) {
  if (!main.includes(de)) throw new Error(`la mutación «${nombre}» no encuentra su texto: ${de}`);
  let fallo = false;
  try { pruebaMain(main.replace(de, a), `[${nombre}] `); } catch { fallo = true; }
  assert.ok(fallo, `la mutación «${nombre}» tendría que hacer fallar la prueba y pasó`);
  n++;
}
await mutarPanales('siete panales', 'cantidad: 8,', 'cantidad: 7,');
await mutarPanales('sin separación', 'separacion: 150,', 'separacion: 5,');
await mutarPanales('camino a 0 m', 'caminoMin: 40,', 'caminoMin: 0,');
await mutarPanales('aldea a 0 m', 'aldeaMin: 30,', 'aldeaMin: 0,');
await mutarPanales('árboles chicos', 'escMin: 1.0,', 'escMin: 0,');
await mutarPanales('cualquier especie', "especies: ['coihue', 'lenga', 'cipres'],", "especies: ['coihue', 'lenga', 'cipres', 'arrayan', 'nire', 'seco'],");
await mutarPanales('panal a ras del suelo', 'alturaMin: 2.2,', 'alturaMin: 0.5,');
await mutarPanales('panal en las nubes', 'alturaMax: 3.0,', 'alturaMax: 6.0,');
await mutarPanales('recarga en un día', 'horasRecarga: 55,', 'horasRecarga: 11,');
await mutarPanales('dos frascos', 'frascos: 1,', 'frascos: 2,');
await mutarPanales('alcance de 6 m', 'alcance: 2.5,', 'alcance: 6,');
await mutarPanales('sin mirarlo', 'mira: 0.86,', 'mira: -1,');
await mutarPanales('se recarga con la noche', 'const r = ritmo({ noche: estado.noche, invierno: estado.invierno, lluvia: estado.lluvia });', 'const r = 1;');
await mutarPanales('se mira el agua', 'if (sitio.agua?.(a.x, a.z)) return false;', '');
await mutarPanales('talados sirven', 'if (!a || a.sacado || a.caido) return false;', 'if (!a) return false;');
await mutarPanales('abejas en invierno', '&& (m.invierno ?? 0) < A.invierno', '');
await mutarPanales('abejas con lluvia', '&& (m.lluvia ?? 0) < A.lluvia', '');
await mutarPanales('abejas de noche', "(m.dia ?? 0) > A.dia &&", '');
await mutarPanales('Historia con colmena siempre', 'return historia ? !!sacoMiel : true;', 'return true;');
await mutarPanales('Desafío con colmena', 'if (desafio) return false;', '');
await mutarPanales('Historia sin colmena', 'return historia ? !!sacoMiel : true;', 'return historia ? false : true;');
await mutarPanales('la partida vieja rompe', "if (!p || typeof p !== 'object' || Array.isArray(p)) return sal;", "if (!p) return null;");
await mutarPanales('el vacío da miel', 'if (panalConMiel(panales, id)) { panales[id] = 0;', 'if (true) { panales[id] = 0;');
await mutarPanales('el panal sacado no queda sacado', "panales[id] = 0; return { accion: 'sacar'", "return { accion: 'sacar'");
mutarMain('sin cuaderno', "registrar('panal-miel');", '');
mutarMain('sin alboroto', 'bichos?.alborotarPanal?.(h.sitio.id);', '');
mutarMain('sin chequeo de mochila', "if (panalConMiel(est, h.sitio.id) && !cabeJuntar('miel', PANALES.frascos)) return;", '');
mutarMain('el aviso de las abejas en el Relax', "if (primera && ajustes.relaxTipo === 'historia')", 'if (primera)');
mutarMain('Historia sin colmena en el menú', "(p.id !== 'colmena' || colmenaALaVista())", 'true');
mutarMain('la colmena de la Historia siempre', "historia: ajustes.relaxTipo === 'historia'", 'historia: false');
mutarMain('el desafío con panales', 'esDesafio ? [] : elegirPanales', 'elegirPanales');
mutarMain('sin recarga', 'if (!esDesafio && progreso.panales) avanzarPanales(progreso.panales, horas,', 'if (false) avanzarPanales(progreso.panales, horas,');
mutarMain('sin tabla del aviso', "case 'panal': return enE ? panalCerca() : cachePanal;", '');
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`OK 4.27.0 (A) · ${n} verificaciones · ocho panales de miel en el bosque, abejas de día y con sol, un frasco que se recarga en cinco días, la colmena de la Historia tras el primer panal`);
