// 3.8.0 (arreglos): las dos partidas reales que fallaban siempre al cerrar la 3.7.5.
// 1. humo-3-5-4-caos: "objeto de la escena en NaN: Group<Scene". Era Elsa, la guarda del tren (gente.js): se arma
//    aparte de los demás (sin `rumboObjetivo`) y el giro suave de `actualizar` hacía atan2(sin(undefined - y), ...) =
//    NaN cuando viajaba a la vista y vos no estabas cerca ni le hablabas (en la cabina de la locomotora, a más de 7 m).
//    Una vez en NaN, el giro quedaba en NaN para siempre. Ahora tiene `rumboObjetivo` (y `vel` y `paso`), mira hacia
//    el rumbo que le pasa el tren (`ubicarGuarda`) y el giro nunca queda en NaN.
//    Se prueba con la gente de verdad (gente.js + gente-cuerpo.js, en una VM sin DOM, como verificar-3-7-2-cabezas).
// 2. humo-2-8-compas: "la trochita: pintura, nombre y silbato". El tren de la 3.7.3 sí aplica lo de "Personalizar"
//    (tren.js: `pinturaDe` y `nombreLoco`), pero es una sola malla con huesos: la prueba buscaba placas
//    'nombre-personal' y colores en mallas colgadas de la locomotora y del primer coche, que ya no existen. La partida
//    real ahora mira los vértices pintables de cada hueso y las letras del nombre que se dibujan.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- 1. el código
const gente = leer('src/gente.js'), tren = leer('src/tren.js'), compas = leer('pruebas/humo-2-8-compas.cjs');
ok(!gente.includes('\r') && !compas.includes('\r'), 'gente.js y la humo 2.8: fines de línea LF');
ok(/guarda = \{ \.\.\.m, clave: 'guarda', \.\.\.p, pos: m\.g\.position, rumbo: 0, rumboObjetivo: 0, vel: 0, paso: 0,/.test(gente), 'gente.js: la guarda nace con rumboObjetivo, vel y paso');
ok(gente.includes('if (Number.isFinite(rumbo)) guarda.rumbo = guarda.rumboObjetivo = rumbo;'), 'gente.js: ubicarGuarda le da el rumbo del tren como hacia dónde mirar');
ok(gente.includes('if (!Number.isFinite(g.rumboObjetivo)) g.rumboObjetivo ='), 'gente.js: el giro suave nunca parte de un rumbo en NaN');
ok(/\[TINTAS\.coches\]: elegido\(d\.coches,/.test(tren) && /\[TINTAS\.franjaCoches\]: elegido\(d\.franja,/.test(tren) && /p\.cuerpo \|\| elegido\(d\.cabina,/.test(tren), 'tren.js: el tren de la 3.7.3 pinta con lo de "Personalizar" (coches, franja y cabina)');
ok(tren.includes("const nombreLoco = () => estado.loco.nombre || (personal?.nombre ? String(personal.nombre).trim().slice(0, 18) : '');"), 'tren.js: y lleva el nombre de "Personalizar" si el taller no le puso otro');
ok(compas.includes('const tr = H.tren.tren, nuevo = !!tr.mallas?.estructura;') && compas.includes('m.skeleton.huesos.indexOf(vagon)') && compas.includes('tr.mallas.letras.geometry'), 'la humo 2.8 mira la trochita nueva (los huesos y las letras), no placas sueltas');

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

const T = { altura: () => 0, agua: () => false, radioLago: () => 60, lugares: { refugio: { x: 0, z: 0, rot: 0 } }, sendero: Array.from({ length: 12 }, (_, i) => ({ x: 40 + i * 3, z: 40 })) };
const col = { resolver() {}, plataformaEn: () => null };
const escena = new THREE.Scene();
const sistema = G.crearGente(T, escena, col, {}, {});
const elsa = sistema.guarda;
ok(!!elsa && sistema.gente.includes(elsa), 'Elsa, la guarda, está en la gente');
for (const g of sistema.gente) if (g !== elsa) g.dormido = true;

const js = { pos: new THREE.Vector3(), enTren: true };
const camara = new THREE.PerspectiveCamera();
const dt = 1 / 60;
let malos = [];
const finitos = () => { const o = elsa.g, q = o.quaternion, p = o.position; return [p.x, p.y, p.z, q.x, q.y, q.z, q.w, o.rotation.y].every(Number.isFinite); };
// el tren la lleva por la vía: cada cuadro la pone en su lugar con el rumbo del tren (como main.js con trochita.js)
const viajar = (seg, jugador, etiqueta, rumbo = (t) => 0.4 + t * 0.05) => {
  const n = Math.round(seg / dt);
  for (let i = 0; i < n; i++) {
    reloj += dt * 1000;
    const t = i * dt, x = 100 + t * 4, z = 50;
    sistema.ubicarGuarda({ x, y: 0.72, z }, rumbo(t), true);
    const pj = jugador(x, z);
    js.pos.set(pj.x, 1.6, pj.z);
    camara.position.set(js.pos.x, 1.6, js.pos.z);
    sistema.actualizar(dt, js, camara, null, 0);
    if (!finitos()) malos.push(`${etiqueta} cuadro ${i}`);
  }
};
const dif = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// a) vos en la cabina, a 12 m de ella (el caso del caos): se ve, viaja, mira hacia donde va el tren
viajar(4, (x, z) => ({ x: x + 12, z }), 'en la cabina');
ok(elsa.g.visible, 'con vos a 12 m y de viaje, Elsa se ve');
ok(!malos.length, `con vos en la cabina, Elsa nunca queda en NaN (${malos.length} cuadros mal; el primero: ${malos[0] || '-'})`);
ok(dif(elsa.g.rotation.y, 0.4 + 4 * 0.05) < 0.1, `y mira hacia el rumbo del tren (${elsa.g.rotation.y.toFixed(3)})`);
// b) vos al lado, en el pasillo: te mira; c) te vas a la cabina: vuelve al rumbo del tren
malos = [];
viajar(3, (x, z) => ({ x, z: z + 2 }), 'al lado');
const haciaVos = Math.atan2(0, 2);
ok(!malos.length && dif(elsa.g.rotation.y, haciaVos) < 0.15, `con vos al lado, te mira (${elsa.g.rotation.y.toFixed(3)} → ${haciaVos.toFixed(3)})`);
viajar(4, (x, z) => ({ x: x + 12, z }), 'de vuelta en la cabina', () => -2.5);
ok(!malos.length && dif(elsa.g.rotation.y, -2.5) < 0.1, `y al irte, vuelve a mirar hacia el rumbo del tren (${elsa.g.rotation.y.toFixed(3)})`);
// d) un rumbo roto (NaN) del tren no la rompe; y uno ya en NaN (de una partida de antes) se cura solo
viajar(1, (x, z) => ({ x: x + 12, z }), 'rumbo NaN', () => NaN);
ok(!malos.length, 'un rumbo en NaN del tren no la deja en NaN');
elsa.g.rotation.y = NaN; elsa.rumboObjetivo = undefined;
viajar(0.5, (x, z) => ({ x: x + 12, z }), 'ya en NaN', () => NaN);
ok(finitos(), 'un giro que ya estaba en NaN se cura en el cuadro siguiente');
ok(Number.isFinite(elsa.paso), 'el paso de Elsa es un número (antes: undefined + algo)');

console.log(`OK 3.8.0 (arreglos): la guarda sin NaN y la trochita personalizada en el tren nuevo · ${pasos} pasos`);
