// 3.8.0: los duendes del Desafío (los que eran los invasores). Las reglas nuevas (viejos de las noches
// grandes, crecer, el robo sin perder nada), el cableado con el juego (el reciclado, el robo, la
// lechuza, el nido y la madriguera) y los modelos armados de verdad (en una VM con el three local):
// cada vértice con su hueso, cuántos triángulos de cerca y de lejos, el botín y el punto débil.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { esNocheGrande, vieneDeViejo, etapaDe, ETAPAS, ROBO, puedeRobar, queSeLleva, SIEMPRE_VIEJOS, DUENDE_DE, NOCHES_GRANDES } from '../src/desafio-duendes-reglas.js';
import { TIPOS_ALIEN, sanearDesafio, PUNTO_DEBIL, suministrosDelAlba, golpePorDetras, sumarContenidoCaja } from '../src/desafio-reglas.js';

const raiz = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

// ---------------------------------------------------------------- las reglas
for (const t of Object.keys(TIPOS_ALIEN)) assert.ok(DUENDE_DE[t], `el tipo ${t} no tiene duende`);
assert.ok(esNocheGrande({ noche: 5 }) && esNocheGrande({ noche: 10 }), 'la noche del jefe es grande');
assert.ok(!esNocheGrande({ noche: 3 }) && !esNocheGrande({ noche: 7 }), 'una noche común no es grande');
assert.ok(esNocheGrande({ noche: 7, especial: 'roja' }), 'una especial es grande');
assert.ok(esNocheGrande({ noche: NOCHES_GRANDES.desde }), 'desde la noche 12 todas son grandes');
assert.equal(vieneDeViejo('rastreador', { grande: false, azar: 0 }), false, 'al anochecer, traviesos');
assert.equal(vieneDeViejo('rastreador', { grande: true, azar: 0.1 }), true, 'en las grandes, viejos');
assert.equal(vieneDeViejo('rastreador', { grande: true, azar: 0.99 }), false, 'no todos');
assert.equal(vieneDeViejo('rastreador', { mutado: true }), true, 'los mutados son viejos');
for (const t of SIEMPRE_VIEJOS) assert.equal(vieneDeViejo(t, {}), true);
assert.equal(etapaDe({ noche: 1 }), 0, 'las primeras noches, chiquitos');
assert.equal(etapaDe({ noche: 5 }), 1);
assert.equal(etapaDe({ noche: 2, viejo: true }), ETAPAS.length - 1, 'el viejo, grandote');
assert.equal(etapaDe({ noche: 1, nivelAdaptado: 2 }), 1, 'el que aprendió crece una');
assert.ok(ETAPAS.every((e, i) => !i || e.escala > ETAPAS[i - 1].escala), 'crecen de chiquitos a grandotes');
// el robo
assert.ok(puedeRobar('rastreador', {}) && puedeRobar('saltador', {}));
assert.ok(!puedeRobar('bruto', {}) && !puedeRobar('jefe', {}) && !puedeRobar('volador', {}), 'sólo los pillos y los saltarines');
assert.ok(!puedeRobar('rastreador', { viejo: true }), 'los viejos no roban: dan miedo');
assert.ok(!puedeRobar('rastreador', { roboEnCurso: true }), 'uno solo a la vez');
assert.ok(!puedeRobar('rastreador', { robosNoche: ROBO.porNoche }), 'con tope por noche');
assert.deepEqual(queSeLleva((k) => ({ cristal: 0, ramita: 3 })[k] || 0), { cosa: 'ramita', n: 1 }, 'lo primero que tengas');
assert.deepEqual(queSeLleva((k) => ({ cristal: 5 })[k] || 0), { cosa: 'cristal', n: 1 }, 'una semilla');
assert.equal(queSeLleva(() => 0), null, 'si no tenés nada, nada');
assert.ok(ROBO.cosas.every((k) => ['cristal', 'ramita', 'tabla', 'piedra'].includes(k)), 'sólo cosas chicas: nunca lo construido');
// lo robado queda en la partida guardada (al abrir vuelve)
assert.deepEqual(sanearDesafio({ robados: { ramita: 2, tabla: -1, casa: 3, cristal: 'x' } }).robados, { ramita: 2 });
assert.deepEqual(sanearDesafio(null).robados, {});

// ---------------------------------------------------------------- el cableado
const des = leer('src/desafio.js'), duendes = leer('src/desafio-duendes.js'), modelo = leer('src/duendes-modelo.js'), puestos = leer('src/desafio-puestos-mundo.js');
assert.ok(!/crearAlien|desafio-alien\.js/.test(des), 'el Desafío ya no arma invasores');
assert.match(des, /const m = crearDuende\(tipo\);/);
assert.match(des, /instalarDuendes\(escena\);\n  precalentarDuendes\(\);/, 'los modelos se arman en la carga');
assert.ok(des.indexOf('const delValle = new Set(escena.children);') < des.indexOf('instalarDuendes(escena);'), 'los duendes no son "del valle" (adentro del Coihue se ven)');
// reciclado: lo nuevo por duende se limpia al bajar (y el modelo, en reiniciar)
const bajar = des.slice(des.indexOf('function bajarAlien(tipo)'), des.indexOf('function terminarOleada'));
assert.match(bajar, /a\.robo = null;/, 'el robo de la vida anterior se limpia en bajarAlien');
assert.match(bajar, /a\.m\.vestir\?\.\(viejo, etapaDe\(/, 'cada vez se viste de travieso o de viejo');
assert.match(duendes, /reiniciar\(\) \{[\s\S]*?uMirada\.value = 0; u\.uSilueta\.value = 0; u\.uReflejo\.value = 0;[\s\S]*?d\.robando = false;/, 'reiniciar apaga los ojos y el robo');
// el robo: sin perder nada
assert.match(des, /else \{ herirJugador\(def\.dano \* a\.danoMult, p\); intentarRobo\(a\); \}/);
assert.match(des, /if \(a\.robo && \(delJugador \|\| fuente === 'perro' \|\| a\.vida <= 0\)\) soltarRobo\(a, true\);/, 'si le pegás o cae, lo recuperás');
assert.match(des, /devolverTodo\(true\);/, 'al amanecer se devuelve todo');
assert.match(des, /devolverTodo\(false\);/, 'al abrir la partida también');
assert.match(des, /!sinAtaque && !a\.robo/, 'el que huye con lo robado no ataca');
// la lechuza aletea con sus huesos (sin las membranas de antes)
assert.match(des, /if \(a\.m\.alasPropias\) return \(a\.m\.alas = \[\]\);/);
assert.match(des, /a\.m\.aletear\?\.\(a\.faseAla\);/);
// nido y madriguera
assert.match(des, /const nido = mallaNido\(\);/, 'el capullo es un nido de hongos y musgo');
assert.match(puestos, /const m = mallaMadriguera\(tipo\);/, 'los puestos son madrigueras');
// el dibujo: instanciado, un programa, los huesos en una textura, todo volcado antes de dibujar
assert.equal((duendes.match(/customProgramCacheKey/g) || []).length, 1, 'un solo programa para todos los duendes');
assert.match(duendes, /new THREE\.InstancedMesh\(g, materialDuendes\(\), cap\)/);
assert.match(duendes, /texelFetch\(uHuesos/);
assert.match(duendes, /escena\.onBeforeRender = function/);
assert.ok(!/\bfragmentShader[\s\S]*?\baHuesoParte\b[\s\S]*?customProgramCacheKey/.test(duendes), 'el atributo no se lee en el fragment shader');

// ---------------------------------------------------------------- 3.8.1: arreglos de los duendes
// el que se va con algo robado (la guardia del asedio, el reciclado) lo deja tirado; al caer, vuelve todo
assert.match(des, /function soltarAlien\(a\) \{[\s\S]{0,300}?if \(a\.robo\) soltarRobo\(a, false\);[\s\S]{0,80}?a\.m\.g\.visible = false;/, 'soltarAlien suelta lo robado antes de reciclar');
assert.match(des, /function limpiar\(\) \{[\s\S]{0,300}?devolverTodo\(false\);\s*for \(const a of aliens\) soltarAlien\(a\);/, 'limpiar devuelve lo robado y lo tirado');
// el margen de golpe no pega a través de paredes (flecha, boleadora, rayo) y el rayo y el hachazo no se saltean una empalizada
assert.match(des, /MARGEN_GOLPE\.arriba\)   \/\/ 3\.8\.0: duendes chiquitos\n\s*&& !margenTapado\(x, y, z, a, q\.ignorar\)\)/, 'el tiro mira que no haya pared entre el punto y el duende');
assert.match(des, /r \* r && !margenTapado\(origen\.x \+ dir\.x \* t, origen\.y \+ dir\.y \* t, origen\.z \+ dir\.z \* t, a, adentro\)\)/, 'el rayo también');
assert.match(des, /for \(let t = 0\.8; t < alcance; t \+= 0\.25\)/, 'el rayo de a 25 cm');
assert.match(des, /hayObraEntre\(_v, _w, 0\.2, obraEnPunto\(_v\.x, _v\.y, _v\.z\), true\)/, 'el hachazo de a 20 cm');
assert.match(des, /return !!hayObraEntre\(_mtA, _mtB, 0\.12, ignorar, true\);/);
// el cofre: ni en una pared, ni en un árbol, y si puede, parejo
assert.match(des, /obraEnPunto\(x, T\.altura\(x, z\) \+ 0\.5, z, 0\.6\)\) continue;\n\s*if \(cofreTrabado\(x, z\)\) \{ trabado \|\|= \{ x, z \}; continue; \}/, 'el cofre no brota en una pared ni en un árbol');
assert.match(des, /const p = parejo \|\| enPendiente \|\| trabado;/, 'el cofre prefiere lo parejo (y nunca se queda sin cofre por un árbol)');
// el cofre guardado: lo de adentro en números (un "3" de texto se pegaba a los materiales), y el de verdad pasa entero
assert.deepEqual(sanearDesafio({ caja: { x: 1, z: 2, contenido: { tronco: '3', tabla: -1, casa: 5, cristal: 1.7, flechas: 'x' } } }).caja.contenido, { tronco: 3, cristal: 1 });
for (const n of [1, 3, 9, 30]) { const c = suministrosDelAlba(n, true); assert.deepEqual(sanearDesafio({ caja: { x: 0, z: 0, contenido: c } }).caja.contenido, c, `el cofre de la noche ${n} pasa entero`); }
// el robo de verdad (el código del juego en una función, con el inventario de mentira): nunca se pierde
// ni se duplica nada, nunca se lleva lo que no tenés, y una partida de antes de la 3.8 no rompe
{
  const cuerpo = des.slice(des.indexOf('  function soltarAlien(a)'), des.indexOf('  // Precalentar')) +
    des.slice(des.indexOf('  const NOMBRE_ROBADO'), des.indexOf('  function terminarOleada'));
  const fab = new Function('D', 'ctx', 'ROBO', 'puedeRobar', 'queSeLleva', 'aliens', 'escena', 'T', 'mallaAtadito', 'registrarHalos', 'S', 'libres', 'progreso', 'Math', 'setTimeout',
    `let caido = false;\n${cuerpo}\nreturn { soltarAlien, intentarRobo, soltarRobo, devolverTodo, levantarTirados, tirados };`);
  const p = { materiales: { cristal: 0, tabla: 2, piedra: 0 }, ramitas: 1, desafio: { oleadas: 3 } };   // sin `robados`: de antes de la 3.8
  const ctxR = {
    cuanto: (k) => (k === 'ramita' ? p.ramitas : p.materiales[k] || 0),
    gastar: (k, n) => { if (k === 'ramita') p.ramitas = Math.max(0, p.ramitas - n); else p.materiales[k] = Math.max(0, (p.materiales[k] || 0) - n); },
    sumarMaterial: (k, n) => { p.materiales[k] = (p.materiales[k] || 0) + n; },
    nota() {},
  };
  const aliensR = [], libresR = { rastreador: [] };
  const pos = () => ({ x: 4, y: 0, z: 5, set(x, y, z) { this.x = x; this.y = y; this.z = z; } });
  const malla = () => ({ position: pos(), rotation: { y: 0 }, visible: false });
  const R = fab(() => p.desafio, ctxR, ROBO, puedeRobar, queSeLleva, aliensR, { add() {} }, { altura: () => 0 }, malla, () => {}, { risa() {} }, libresR, () => p, Object.assign(Object.create(Math), { random: () => 0 }), () => {});
  const total = () => p.ramitas + p.materiales.tabla + p.materiales.cristal + Object.values(p.desafio.robados || {}).reduce((s, n) => s + n, 0);
  const T0 = total();
  const pillo = () => ({ tipo: 'rastreador', robo: null, m: { viejo: false, robar() {}, g: { position: pos(), visible: true } } });
  // se lleva la ramita (lo primero que tenés), se va con ella (reciclado) y queda tirada; al amanecer vuelve una sola vez
  const a = pillo(); aliensR.push(a);
  R.intentarRobo(a);
  assert.deepEqual([a.robo?.cosa, p.ramitas, p.desafio.robados], ['ramita', 0, { ramita: 1 }], 'se llevó la ramita');
  assert.equal(total(), T0);
  aliensR.length = 0; R.soltarAlien(a);
  assert.equal(a.robo, null, 'reciclado sin lo robado');
  assert.equal(R.tirados.filter((t) => t.activo).length, 1, 'el que se fue lo dejó tirado');
  assert.equal(total(), T0);
  R.devolverTodo(false);
  assert.deepEqual([p.ramitas, p.desafio.robados, R.tirados.filter((t) => t.activo).length], [1, {}, 0], 'vuelve una sola vez');
  // el que huye y el que está tirado a la vez, más lo anotado: nada se duplica
  const b = pillo(), c = pillo(); aliensR.push(b, c);
  R.intentarRobo(b); R.intentarRobo(c);   // ramita, después tabla
  assert.deepEqual([b.robo?.cosa, c.robo?.cosa], ['ramita', 'tabla']);
  R.soltarRobo(c, false);
  R.devolverTodo(false);
  assert.equal(total(), T0); assert.deepEqual([p.ramitas, p.materiales.tabla, p.desafio.robados], [1, 2, {}], 'nada duplicado');
  // si no tenés nada, no se lleva nada
  p.ramitas = 0; p.materiales.tabla = 0;
  const d2 = pillo(); R.intentarRobo(d2);
  assert.equal(d2.robo, null, 'no se lleva lo que no tenés');
  // `robados` raro en la partida (lo que arregla sanearDesafio) no rompe
  p.desafio.robados = [3]; R.devolverTodo(false); assert.deepEqual(p.desafio.robados, {}); assert.ok(!('0' in p.materiales), 'un robados raro no suma un material "0"');
  p.desafio = { oleadas: 4, ...sanearDesafio({ robados: { piedra: 2, casa: 1 } }) }; R.devolverTodo(false);
  assert.deepEqual([p.materiales.piedra, p.desafio.robados], [2, {}], 'lo guardado vuelve al abrir');
}
// las reglas del código
for (const f of ['src/desafio-duendes.js', 'src/duendes-modelo.js', 'src/desafio-duendes-reglas.js']) {
  const t = leer(f);
  assert.ok(!/ShapeGeometry|new THREE\.Shape\b|OctahedronGeometry|Vector4|Frustum/.test(t), `${f}: usa algo que el three local no trae`);
  assert.ok(!/^export (async function|function\*)|^export .* from /m.test(t), `${f}: export que armar.mjs no entiende`);
  for (const m of t.matchAll(/^import .*$/gm)) assert.match(m[0], /^import (\* as THREE|\{[^}]+\}) from '[^']+';$/, `${f}: import en una línea`);
  for (const m of t.matchAll(/^export (?:const|let|function|class) ([^\s(=]+)/gm)) assert.ok(!/ñ/.test(m[1]), `${f}: exportado con ñ (${m[1]})`);
  assert.ok(!t.includes('\r'), `${f}: fines de línea CRLF`);
}

// ---------------------------------------------------------------- los modelos, armados en una VM
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const STUB = { 'gente-cuerpo.js': 'export const materialGente = () => new THREE.MeshLambertMaterial({ vertexColors: true });' };
const info = new Map(), orden = [], visto = new Set();
const visitar = (f) => {
  f = path.resolve(f);
  if (visto.has(f)) return;
  visto.add(f);
  const texto = STUB[path.basename(f)] ?? fs.readFileSync(f, 'utf8');
  info.set(f, texto);
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(path.resolve(path.dirname(f), m[2]));
  orden.push(f);
};
visitar(path.join(src, 'duendes-modelo.js'));
const transformar = (f, t) => {
  const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) => `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).join(', ')} } = ${idModulo(path.resolve(path.dirname(f), spec))};`);
  t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
};
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f)) + '\n';
code += `;globalThis.__M = __mod_duendes_modelo; globalThis.__THREE = THREE;`;
const ctx = { console, Math, performance, globalThis: null };
ctx.globalThis = ctx;
vm.runInNewContext(code, ctx);
const M = ctx.__M;
// los detalles de cerca y de lejos, los del juego
const DETALLES = (duendes.match(/export const DETALLE_CERCA = ([\d.]+), DETALLE_LEJOS = ([\d.]+);/) || []).slice(1).map(Number);
assert.equal(DETALLES.length, 2, 'faltan los detalles de cerca y de lejos');
const reporte = [];
const tiempo0 = performance.now();
for (const tipo of Object.keys(TIPOS_ALIEN)) {
  const spec = M.DUENDES[tipo](0);
  for (const viejo of [false, true]) {
    const P = viejo ? spec.viejo : spec.travieso;
    const tris = [];
    for (const det of DETALLES) {
      const r = tipo === 'volador' ? M.armarLechuza(P, 11, det) : M.armarDuende(P, 11, det);
      const g = r.geo, hp = g.attributes.aHuesoParte.array, pos = g.attributes.position.array;
      assert.equal(r.reposo.length, M.N_HUESOS);
      const usados = new Set(), partes = new Set();
      let malos = 0;
      for (let i = 0; i < hp.length; i++) {
        const parte = Math.floor(hp[i] / 32 + 0.001), h = hp[i] - parte * 32;
        if (!(h >= 0 && h < M.N_HUESOS && Number.isInteger(h)) || parte > 4) malos++;
        usados.add(h); partes.add(parte);
      }
      assert.equal(malos, 0, `${tipo}${viejo ? ' viejo' : ''}: vértices sin hueso válido`);
      for (const h of [M.HUESO.pelvis, M.HUESO.pecho, M.HUESO.cabeza, M.HUESO.musloI, M.HUESO.rodillaD, M.HUESO.codoD, M.HUESO.gorro]) assert.ok(usados.has(h), `${tipo}: nada cuelga del hueso ${h}`);
      if (tipo === 'volador') for (const h of [M.HUESO.alaI, M.HUESO.alaD, M.HUESO.montura]) assert.ok(usados.has(h), `la lechuza aletea con sus alas (${h})`);
      assert.ok(partes.has(M.PARTE.ojo), `${tipo}: sin ojos que brillen`);
      const conBotin = partes.has(M.PARTE.botin);
      assert.equal(conBotin, (tipo === 'rastreador' || tipo === 'saltador') && !viejo, `${tipo}${viejo ? ' viejo' : ''}: el botín sólo en los que roban`);
      if (tipo === 'jefe') {
        // el punto débil (los hongos de la joroba): atrás y del 60% de la altura para arriba (PUNTO_DEBIL)
        let ymin = 1e9, zmax = -1e9;
        for (let i = 0; i < hp.length; i++) if (Math.floor(hp[i] / 32 + 0.001) === M.PARTE.debil) { ymin = Math.min(ymin, pos[i * 3 + 1]); zmax = Math.max(zmax, pos[i * 3 + 2]); }
        assert.ok(ymin < 1e9, 'el Mandamás sin punto débil');
        assert.ok(ymin / r.alto >= PUNTO_DEBIL.desde - 0.12 && zmax < 0, `los hongos de luz en la espalda, arriba (${(ymin / r.alto).toFixed(2)} del alto, z ${zmax.toFixed(2)})`);
      }
      for (let i = 0; i < pos.length; i++) assert.ok(Number.isFinite(pos[i]), `${tipo}: posición inválida`);
      tris.push(Math.round((g.index ? g.index.count : pos.length / 3) / 3));
    }
    reporte.push(`${tipo}${viejo ? ' viejo' : ''} ${tris.join('/')}`);
    // el de cerca, con presupuesto; el de lejos, mucho más liviano
    const tope = tipo === 'volador' ? 16000 : tipo === 'jefe' || tipo === 'bruto' ? 12000 : 11000;
    assert.ok(tris[0] < tope, `${tipo}${viejo ? ' viejo' : ''}: demasiados triángulos de cerca (${tris[0]})`);
    assert.ok(tris[1] < tris[0] * 0.55, `${tipo}${viejo ? ' viejo' : ''}: el de lejos no es más liviano (${tris[1]} contra ${tris[0]})`);
  }
}
const msArmar = performance.now() - tiempo0;
// el nido y la madriguera se arman
const n = M.mallaNido(); assert.ok(n.children.length >= 2 && n.userData.halos.length > 0, 'el nido con sus hongos de luz');
for (const t of ['aguja', 'vaina', 'generador', 'suelo']) assert.ok(M.mallaMadriguera(t).children.length >= 1, `la madriguera: ${t}`);
// 3.8.2: el punto débil del Mandamás cuenta «por detrás» sólo si el golpe viene de atrás (rumbo contra
// dirección del golpe), no según dónde cae el punto de impacto
{
  // el jefe mira hacia +z (rumbo 0): de frente, el golpe viaja hacia -z
  assert.equal(golpePorDetras(0, 0, 5, 0.05, 0.3), false, 'de frente y alto: el punto cae casi en el centro, pero no es espalda');
  assert.equal(golpePorDetras(0, 0, 5, -0.05, -0.3), false, 'de frente, aunque el punto quede apenas detrás del centro');
  assert.equal(golpePorDetras(0, 0, -5, 0, -0.3), true, 'desde atrás, sí');
  assert.equal(golpePorDetras(0, 0.5, -5, 0.1, -0.2), true, 'desde atrás y un poco de costado, también');
  assert.equal(golpePorDetras(0, 5, 0, 0, 0), false, 'de costado no cuenta');
  assert.equal(golpePorDetras(Math.PI / 2, -5, 0, 0, 0), true, 'con otro rumbo: mira a +x, desde -x es la espalda');
  assert.equal(golpePorDetras(Math.PI / 2, 5, 0, 0, 0), false, 'con otro rumbo, de frente');
  assert.equal(golpePorDetras(0, 0, 0, 0, 0), false, 'un golpe que baja derecho no cuenta');
  // al azar, pegándole de frente y alto, nunca cuenta (antes ~la mitad de las veces)
  let espalda = 0;
  for (let i = 0; i < 500; i++) { const r = Math.random() * 6.28, ox = Math.sin(r) * 6, oz = Math.cos(r) * 6, jx = (Math.random() - 0.5) * 0.3, jz = (Math.random() - 0.5) * 0.3; if (golpePorDetras(r, ox, oz, jx, jz)) espalda++; }
  assert.equal(espalda, 0, `de frente contó como espalda ${espalda} de 500 veces`);
  const fuente = fs.readFileSync(path.join(src, 'desafio.js'), 'utf8');
  assert.ok(/_imp\.porDetras = golpePorDetras\(rumbo, desde\.x, desde\.z, x, z\)/.test(fuente), 'impactoEn usa de dónde viene el golpe');
  assert.equal((fuente.match(/impactoEn\([^)]*\)/g) || []).filter((s) => s.split(',').length < 5).length, 0, 'todas las llamadas a impactoEn pasan de dónde viene el golpe');
}
// 3.8.2: el cofre del alba se abre a su nivel (no desde arriba de una torre), con el margen de las semillas que se juntan
{
  const fuente = fs.readFileSync(path.join(src, 'desafio.js'), 'utf8');
  const margenSemillas = Number(fuente.match(/Math\.hypot\(js\.pos\.x - c\.x, js\.pos\.z - c\.z\) < 1\.7 && Math\.abs\(js\.pos\.y - c\.y\) < ([\d.]+)/)?.[1]);
  const margenCofre = Number(fuente.match(/Math\.hypot\(js\.pos\.x - c\.x, js\.pos\.z - c\.z\) > 1\.8 \|\| Math\.abs\(js\.pos\.y - suelo\) >= ([\d.]+)\) return;/)?.[1]);
  assert.ok(margenSemillas > 0 && margenCofre === margenSemillas, `el cofre mira la altura con el mismo margen (${margenCofre} contra ${margenSemillas})`);
}
// 3.8.2: el cofre sin abrir no se pierde al alba siguiente: lo suyo se suma al nuevo, saneado y con tope de 99
{
  const viejo = suministrosDelAlba(4, true), nuevo = suministrosDelAlba(5, true);
  const suma = sumarContenidoCaja(viejo, nuevo);
  for (const k of new Set([...Object.keys(viejo), ...Object.keys(nuevo)])) assert.equal(suma[k], (viejo[k] || 0) + (nuevo[k] || 0), `el cofre suma ${k}`);
  assert.deepEqual(sumarContenidoCaja({ tronco: 95, cristal: 2 }, { tronco: 9, tabla: 3 }), { tronco: 99, tabla: 3, cristal: 2 }, 'si se pasa de 99, queda en 99');
  assert.deepEqual(sumarContenidoCaja({ tronco: '3', casa: 5, piedra: -2 }, { tronco: 1 }), { tronco: 4 }, 'lo viejo pasa por el saneado');
  assert.deepEqual(sumarContenidoCaja(null, { piedra: 2 }), { piedra: 2 });
  // y se guarda bien: la partida lo vuelve a leer igual
  assert.deepEqual(sanearDesafio({ caja: { x: 1, z: 2, contenido: suma } }).caja.contenido, suma, 'el cofre sumado se guarda entero');
  const fuente = fs.readFileSync(path.join(src, 'desafio.js'), 'utf8');
  assert.ok(/const viejo = D\(\)\.caja\?\.contenido;\s*D\(\)\.caja = \{ x: p\.x, z: p\.z, contenido: viejo \? sumarContenidoCaja\(viejo, contenido\) : contenido, cayendo: true \};/.test(fuente), 'soltarCaja suma lo del cofre sin abrir (un solo cofre)');
}
console.log(`OK duendes 3.8 · reglas, robo sin perder nada, cableado · modelos (tri cerca/lejos): ${reporte.join(', ')} · armar todo ${Math.round(msArmar)} ms`);
