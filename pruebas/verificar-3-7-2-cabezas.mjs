// 3.7.2 (cabezas): "a veces se les dobla el cuello, se les da vuelta la cabeza". La causa: la pose de quietud
// "acomodar el gorro" (gente-cuerpo.js, `quietud`) ladea la cabeza con `g.cabeza.rotation.z += ...` y la base de cada
// cuadro de gente.js ponía de nuevo la x y la y de la cabeza pero no la z: el ladeo se sumaba cuadro a cuadro (0,14 rad
// por cuadro con la pose entera) y la cabeza daba vueltas de costado; al terminar la pose quedaba doblada como estaba.
// Esta prueba arma la gente de verdad (gente.js + gente-cuerpo.js, en una VM sin DOM), pone a una persona con la pose
// del gorro y la pasa por todas las poses, los gestos del amor, dormida, charlando, de lejos (los huesos de a ratos) y
// con la cámara dando la vuelta alrededor (la mirada), y mide la cabeza en cada cuadro: sin NaN y dentro de lo que
// dobla un cuello (|x| <= 0,8, |y| <= 1,2, |z| <= 0,5 rad, sola y respecto del torso).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- 1. el código
const gente = leer('src/gente.js'), cuerpo = leer('src/gente-cuerpo.js');
for (const [n, t] of [['gente.js', gente], ['gente-cuerpo.js', cuerpo]]) ok(!t.includes('\r'), `${n}: fines de línea LF`);
ok(/g\.cabeza\.rotation\.z = 0;/.test(gente), 'gente.js: la base de cada cuadro pone también el ladeo de la cabeza (la z)');
ok(gente.includes('function limitarCabeza(g)') && gente.includes('limitarCabeza(g);'), 'gente.js: la cabeza, al final, dentro de lo que dobla un cuello y sin NaN');

// ---------------------------------------------------------------- 2. la gente de verdad, en una VM sin DOM
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visto = new Set();
const visitar = (f) => {
  f = path.resolve(f);
  if (visto.has(f)) return;
  visto.add(f);
  const texto = fs.readFileSync(f, 'utf8');
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
  info.set(f, texto); orden.push(f);
};
visitar(path.join(src, 'gente.js'));
const transformar = (f, t) => {
  const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
    `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.replace(/\s+as\s+/, ': ')).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
  t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
};
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f)) + '\n';
code += '\n;globalThis.__G = __mod_gente; globalThis.__THREE = THREE;';
let reloj = 0;
const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, WeakSet, Float32Array, Float64Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint8ClampedArray, ArrayBuffer, DataView, Error, Symbol, performance: { now: () => reloj }, globalThis: null };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'gente-vm.js' });
const THREE = ctx.__THREE, G = ctx.__G;
const A = await import(pathToFileURL(path.join(src, 'aldea.js')).href);

// un mundo chato: sin agua, sin choques, el refugio en el origen
const T = { altura: () => 0, agua: () => false, radioLago: () => 60, lugares: { refugio: { x: 0, z: 0, rot: 0 } }, sendero: Array.from({ length: 12 }, (_, i) => ({ x: 40 + i * 3, z: 40 })) };
const col = { resolver() {}, plataformaEn: () => null };
const escena = new THREE.Scene();
const sistema = G.crearGente(T, escena, col, {}, {});
const vecinos = ['panadera', 'herrero', 'carpintero'].map((k) => {
  const def = { ...A.POBLADORES_ALDEA[k] };
  return sistema.agregarPoblador({ ...def, clave: `poblador-${k}`, pos: { x: 0, z: 0 }, camino: [] });
});
const nena = A.VECINOS_ALDEA.nena ? sistema.agregarPoblador({ ...A.VECINOS_ALDEA.nena, clave: 'aldea-nena', pos: { x: 1.2, z: 0.4 }, camino: [] }) : null;
const todos = [...vecinos, nena].filter(Boolean);
ok(todos.length >= 3, `la gente armada (${todos.map((g) => g.clave).join(', ')})`);
// los demás de crearGente (Ramón, Nicanor...) quedan lejos para no molestar
for (const g of sistema.gente) if (!todos.includes(g)) g.dormido = true;

const js = { pos: new THREE.Vector3(0, 0, 3) };
const camara = new THREE.PerspectiveCamera();
const LIM = { x: 0.8, y: 1.2, z: 0.5 };
let peor = { x: 0, y: 0, z: 0 }, fallas = [];
const medir = (g, etiqueta, cuadro) => {
  const c = g.cabeza.rotation, t = g.torso.rotation;
  for (const e of ['x', 'y', 'z']) {
    const v = c[e], rel = c[e] - t[e];
    if (!Number.isFinite(v)) { fallas.push(`${g.clave} ${etiqueta} cuadro ${cuadro}: NaN en ${e}`); continue; }
    peor[e] = Math.max(peor[e], Math.abs(v), Math.abs(rel));
    if (Math.abs(v) > LIM[e] + 1e-6 || Math.abs(rel) > LIM[e] + 1e-6) fallas.push(`${g.clave} ${etiqueta} cuadro ${cuadro}: cabeza ${e}=${v.toFixed(3)} (torso ${t[e].toFixed(3)})`);
  }
};
const dt = 1 / 60;
let cuadro = 0, hablando = null;
const correr = (seg, etiqueta, antes = null) => {
  const n = Math.round(seg / dt);
  for (let i = 0; i < n; i++) {
    reloj += dt * 1000; cuadro++;
    if (antes) antes(i * dt);
    camara.position.set(js.pos.x, 1.6, js.pos.z);
    sistema.actualizar(dt, js, camara, hablando, 0);
    for (const g of todos) if (g.g.visible) medir(g, etiqueta, cuadro);
  }
};
const reportar = (etiqueta) => {
  ok(fallas.length === 0, `${etiqueta}: la cabeza siempre derecha (${fallas.length} cuadros mal; el primero: ${fallas[0] || '-'})`);
  fallas = [];
};

// a) "acomodar el gorro" forzado un rato largo (el caso del bug) y después se suelta
for (const g of todos) g.__quietud = 'gorro';
correr(12, 'gorro');
reportar('acomodando el gorro 12 s');
for (const g of todos) delete g.__quietud;
correr(4, 'suelta el gorro');
reportar('al soltar el gorro');
for (const g of todos) ok(Math.abs(g.cabeza.rotation.z) < 0.141, `${g.clave}: después del gorro, la cabeza ladeada como mucho lo del gorro (0,14; z = ${g.cabeza.rotation.z.toFixed(3)})`);

// b) la quietud sola (las poses de cada uno, al azar) un buen rato
correr(60, 'quietud');
reportar('un minuto quieto, con las poses de quietud');

// c) todas las poses de gente.js, una tras otra (con charla y sin charla), y dormida que se levanta
const poses = ['sentado', 'leyendo', 'tornear', 'coser', 'palear', 'hachar', 'regar', 'mirar', 'jugar', 'bailar', 'tocar', 'izar', 'martillar', 'amasar', 'serruchar', 'telescopio', 'pintar', 'curar', 'calafatear', 'mortero', 'dormir', 'brindar'];
for (const p of poses) {
  for (const g of todos) { g.pose = p; g.__quietud = 'gorro'; }
  correr(1.5, `pose ${p}`);
  for (const g of todos) delete g.__quietud;
  correr(1.5, `pose ${p} (sin gorro)`);
  hablando = todos[0];   // charlando con el primero
  correr(1, `pose ${p} charlando`);
  hablando = null;
}
for (const g of todos) g.pose = null;
correr(3, 'se levanta');
reportar('todas las poses, dormida y levantándose');

// d) los gestos del amor (de la mano, del brazo, el bebé en brazos), quieto y caminando
for (const tipo of ['mano', 'brazo', 'acunar']) {
  for (const g of todos) { g.gestoAmor = { tipo, lado: 1 }; g.__quietud = 'gorro'; }
  correr(3, `amor ${tipo}`);
  for (const g of todos) { g.camino = [{ x: g.pos.x + 3, z: g.pos.z + 1 }]; delete g.__quietud; }
  correr(2, `amor ${tipo} caminando`);
}
for (const g of todos) g.gestoAmor = null;
reportar('los gestos del amor');

// e) la cámara da vueltas alrededor (la mirada pasa por detrás: el ángulo da el salto de ±π)
correr(20, 'vuelta', (s) => { const a = s * 1.3; js.pos.set(todos[0].pos.x + Math.sin(a) * 3, 0, todos[0].pos.z + Math.cos(a) * 3); });
reportar('la mirada con la cámara dando vueltas');

// f) de lejos (los huesos de a ratos) con la pose del gorro, y volver
for (const g of todos) g.__quietud = 'gorro';
js.pos.set(60, 0, 0);
correr(20, 'lejos');
js.pos.set(todos[0].pos.x, 0, todos[0].pos.z + 2.5);
correr(5, 'vuelve');
for (const g of todos) delete g.__quietud;
correr(5, 'vuelve suelto');
reportar('de lejos con los huesos de a ratos, y de vuelta');

// g) un NaN que se cuele (una cuenta rota en otro lado) no se queda en la cabeza
todos[0].cabeza.rotation.z = NaN; todos[0].cabeza.rotation.x = NaN;
correr(0.5, 'NaN');
reportar('un NaN no se queda');

// h) cada persona con su propia cabeza (huesos no compartidos)
const cabezas = new Set(todos.map((g) => g.cabeza));
ok(cabezas.size === todos.length, 'cada uno con su cabeza (sin huesos compartidos)');
todos[0].cabeza.rotation.z = 0.3;
ok(todos.slice(1).every((g) => g.cabeza.rotation.z !== 0.3 || g.cabeza === todos[0].cabeza) && todos.slice(1).every((g) => g.cabeza !== todos[0].cabeza), 'mover la cabeza de uno no mueve la de otro');

console.log(`OK 3.7.2 cabezas · ${pasos} verificaciones · ${cuadro} cuadros · lo más doblado: x ${peor.x.toFixed(2)}, y ${peor.y.toFixed(2)}, z ${peor.z.toFixed(2)} rad`);
