// 3.8.0: los duendes del Desafío (los que eran los invasores). Las reglas nuevas (viejos de las noches
// grandes, crecer, el robo sin perder nada), el cableado con el juego (el reciclado, el robo, la
// lechuza, el nido y la madriguera) y los modelos armados de verdad (en una VM con el three local):
// cada vértice con su hueso, cuántos triángulos de cerca y de lejos, el botín y el punto débil.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { esNocheGrande, vieneDeViejo, etapaDe, ETAPAS, ROBO, puedeRobar, queSeLleva, SIEMPRE_VIEJOS, DUENDE_DE, NOCHES_GRANDES } from '../src/desafio-duendes-reglas.js';
import { TIPOS_ALIEN, sanearDesafio, PUNTO_DEBIL } from '../src/desafio-reglas.js';

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
        assert.ok(ymin < 1e9, 'el Viejo del Nido sin punto débil');
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
console.log(`OK duendes 3.8 · reglas, robo sin perder nada, cableado · modelos (tri cerca/lejos): ${reporte.join(', ')} · armar todo ${Math.round(msArmar)} ms`);
