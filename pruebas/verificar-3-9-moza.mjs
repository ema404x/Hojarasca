// 3.9.0 (cantina): el cuerpo y la ropa de la moza de la cantina ('aldea-moza') y sus poses.
//  · gente-ropa.js: su aspecto (32 años, vestido bordó ceñido con escote en V y tajo, delantal corto, labios rojos, flor);
//  · gente-cuerpo.js: la bandeja con sus vasos ({ visible(b), vasos(n), estado() }), siempre horizontal, y las poses
//    'bandeja' (también caminando), 'barra' y 'dejar' que se piden con `npc.pose`;
//  · gente.js: la ropa de la estación le conserva la bandeja; nada nuevo en el peso de la figura.
// Se arma en una VM sin DOM, como verificar-3-7-0-personajes.mjs.
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
const cerca = (a, b, e, t) => ok(Math.abs(a - b) <= e, `${t} (${a.toFixed(3)} vs ${b.toFixed(3)})`);

// ---------------------------------------------------------------- 1. los datos
const cuerpo = leer('src/gente-cuerpo.js'), ropa = leer('src/gente-ropa.js'), gente = leer('src/gente.js');
for (const [n, t] of [['gente-cuerpo.js', cuerpo], ['gente-ropa.js', ropa], ['gente.js', gente]]) {
  ok(!t.includes('\r'), `${n}: fines de línea LF`);
  ok(!/^export\s+(?:const|let|function|class)\s+\S*ñ/m.test(t), `${n}: lo exportado, sin ñ`);
}
ok(/'aldea-moza': \{ piel: '#c4936a'/.test(gente), "gente.js: la clave 'aldea-moza' en ROPA");
ok(gente.includes("export const IDS_POSES_CANTINA = ['bandeja', 'barra', 'dejar'];") && gente.includes("case 'bandeja': case 'barra': case 'dejar': break;"), 'gente.js: los ids de las poses de la cantina');
ok(gente.includes('bandeja: m.bandeja') && gente.includes('bandejaAntes'), 'gente.js: la ropa de la estación conserva la bandeja y sus vasos');
ok(!/new THREE\.(ShapeGeometry|Shape|OctahedronGeometry|Vector4|Frustum)\b/.test(cuerpo), 'nada de lo que el three local no trae');
ok(!/^import\s+'/m.test(cuerpo) && !/^export\s+(?:async\s+function|function\*|\{)/m.test(cuerpo), 'armar.mjs entiende los imports y exports');
ok(/\/\/ 3\.9:/.test(cuerpo) && /\/\/ 3\.9:/.test(ropa), 'los comentarios llevan la versión');
const R = await import(pathToFileURL(path.join(src, 'gente-ropa.js')).href);
const d = R.ASPECTO['aldea-moza'];
ok(d && d.mujer && d.edad === 32, 'la moza: mujer de 32');
ok(d.cara.rouge && d.R.pollera && d.R.talle && d.R.escote && d.R.tajo && d.R.delantalCorto && d.R.florPelo && d.R.bandeja, 'vestido ceñido, escote, tajo, delantal corto, flor, labios y bandeja');
ok(d.guardas.pollera && d.poses.length && d.abrigo.colores, 'con guarda, poses de quietud y ropa de abrigo');
const inv = R.aspectoGente('aldea-moza', {}, {}, { invierno: true });
ok(inv.invierno && inv.colores.bufanda && inv.colores.gorro && inv.colores.poncho, 'en invierno: poncho, gorro y bufanda');

// ---------------------------------------------------------------- 2. armarla (VM sin DOM)
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
visitar(path.join(src, 'gente-cuerpo.js'));
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
code += '\n;globalThis.__C = __mod_gente_cuerpo; globalThis.__THREE = THREE;';
const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Uint16Array, Uint32Array, Int32Array, Uint8Array, Uint8ClampedArray, Error, Symbol, globalThis: null };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'gente-cuerpo-vm.js' });
const C = ctx.__C, THREE = ctx.__THREE;
const armar = (clave, o = {}) => C.crearPersona({}, clave, false, {}, o);

const m = armar('aldea-moza');
const mallas = []; m.g.traverse((o) => { if (o.isMesh) mallas.push(o); });
const piel = mallas.filter((o) => o.isSkinnedMesh);
const tri = piel[0].geometry.index.count / 3;
ok(piel.length === 1 && mallas.length === 3, 'la moza: una malla con piel por huesos, la cara y la bandeja');
ok(tri > 9000 && tri < 19000, `${Math.round(tri)} triángulos (como cualquier vecina)`);
const otra = armar('poblador-herbolaria').g; let triO = 0; otra.traverse((o) => { if (o.isSkinnedMesh) triO = o.geometry.index.count / 3; });
ok(tri < triO * 1.12, `no pesa más que la herbolaria (${Math.round(tri)} contra ${Math.round(triO)})`);
ok(C.POSES_CANTINA && ['bandeja', 'barra', 'dejar'].every((k) => C.POSES_CANTINA[k]), 'las poses bandeja, barra y dejar');
ok(armar('aldea-gerente').bandeja === undefined && armar('poblador-modista').bandeja === undefined, 'sólo la moza tiene bandeja');

// ---------------------------------------------------------------- 3. la bandeja
const B = m.bandeja;
ok(B && typeof B.visible === 'function' && typeof B.vasos === 'function' && typeof B.estado === 'function', 'bandeja: visible(b), vasos(n), estado()');
ok(!B.esta && !B.g.visible && B.estado().visible === false, 'arranca guardada');
B.visible(true); ok(B.g.visible && B.estado().visible, 'visible(true) la muestra');
for (let n = 0; n <= 5; n++) { B.vasos(n); ok(B.estado().vasos === n, `vasos(${n})`); }
B.vasos(9); ok(B.estado().vasos === 5, 'vasos(9) queda en 5'); B.vasos(-3); ok(B.estado().vasos === 0, 'vasos(-3) queda en 0'); B.vasos(3);
const mat = B.malla.material; B.vasos(2); ok(B.malla.material === mat, 'un solo material, siempre el mismo');
const m2 = armar('aldea-moza'); ok(m2.bandeja.malla.material === mat, 'y el mismo en todas las bandejas');
B.visible(false); ok(!B.g.visible, 'visible(false) la guarda'); B.visible(true);

// ---------------------------------------------------------------- 4. las poses, cuadro a cuadro (como lo hace gente.js)
m.pos = m.g.position; m.fase = 0;
const euler = new THREE.Euler();
function cuadro(t, andando) {
  m.patas.forEach((p, i) => { const f = t + i * Math.PI; p.rotation.set(andando ? Math.sin(f) * 0.5 : 0, 0, 0); p.userData.rodilla.rotation.x = andando ? 0.1 + Math.max(0, -Math.cos(f)) * 0.75 : 0.03; });
  m.torso.rotation.set(andando ? 0.035 : 0, andando ? Math.sin(t) * 0.06 : 0, andando ? Math.cos(t) * 0.022 : 0);
  m.cabeza.rotation.set(0, 0, 0);
  m.brazos[0].rotation.set(andando ? Math.sin(t + Math.PI) * 0.3 : 0, 0, andando ? -0.07 : -0.035);
  m.brazos[1].rotation.set(andando ? Math.sin(t) * 0.3 : 0, 0, andando ? 0.07 : 0.035);
  m.alPosar(m, 1 / 60, null, false, andando);
}
const horizontal = () => {   // la bandeja, vista desde el grupo de la figura, queda con su arriba hacia arriba
  const q = m.brazos[1].quaternion.clone().multiply(m.brazos[1].userData.codo.quaternion).multiply(B.g.quaternion);
  const arriba = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
  return arriba.y;
};
// caminando con la bandeja: el brazo derecho se queda en alto, la bandeja horizontal, la otra mano se mece
m.pose = 'bandeja'; let minZ = 9, minH = 9, izqMin = 9, izqMax = -9;
for (let i = 0; i < 240; i++) {
  cuadro(i * 0.12, true);
  if (i > 60) { minZ = Math.min(minZ, m.brazos[1].rotation.z); minH = Math.min(minH, horizontal()); izqMin = Math.min(izqMin, m.brazos[0].rotation.x); izqMax = Math.max(izqMax, m.brazos[0].rotation.x); }
}
ok(minZ > 0.45, `bandeja caminando: el brazo derecho sostenido (z ${minZ.toFixed(2)})`);
ok(minH > 0.999, `bandeja caminando: la bandeja siempre horizontal (${minH.toFixed(4)})`);
ok(izqMax - izqMin > 0.4, 'bandeja caminando: el otro brazo se mece');
ok(m.brazos[1].userData.codo.rotation.x < -1.5, 'el codo doblado');
// quieta: la otra mano en la cintura
for (let i = 0; i < 90; i++) cuadro(0, false);
cerca(m.brazos[0].userData.codo.rotation.x, -1.6, 0.05, 'bandeja quieta: la otra mano en la cintura');
cerca(m.brazos[0].rotation.y, 1.4, 0.1, 'bandeja quieta: el hombro izquierdo girado');
// la barra
m.pose = 'barra'; for (let i = 0; i < 90; i++) cuadro(0, false);
cerca(m.brazos[0].rotation.z, -0.58, 0.04, 'barra: el codo izquierdo afuera, sobre la barra');
cerca(m.brazos[0].userData.codo.rotation.x, -1.45, 0.05, 'barra: el antebrazo sobre la tapa');
ok(m.torso.rotation.z > 0.05, 'barra: el cuerpo se inclina hacia la barra');
ok(m.patas[1].userData.rodilla.rotation.x > 0.25, 'barra: una pierna descansa con la rodilla doblada');
// del otro lado
m.ladoBarra = 1; for (let i = 0; i < 90; i++) cuadro(0, false);
cerca(m.brazos[1].rotation.z, 0.58, 0.04, 'barra a su derecha: el codo derecho sobre la barra');
ok(m.torso.rotation.z < -0.05, 'barra a su derecha: se inclina para el otro lado'); m.ladoBarra = 0;
// dejar
m.pose = 'dejar'; for (let i = 0; i < 90; i++) cuadro(0, false);
cerca(m.torso.rotation.x, 0.27, 0.03, 'dejar: se inclina hacia adelante');
ok(m.brazos[1].rotation.x < -0.45, 'dejar: el brazo derecho adelante');
ok(horizontal() > 0.999, 'dejar: la bandeja, horizontal');
// fuera de la pose: todo vuelve (el giro del hombro a cero)
m.pose = null; for (let i = 0; i < 120; i++) cuadro(0, false);
cerca(m.brazos[1].rotation.y, 0, 1e-6, 'sin pose: el giro del hombro derecho vuelve a cero'); cerca(m.brazos[0].rotation.y, 0, 1e-6, 'sin pose: y el del izquierdo');
cerca(m.torso.rotation.x, 0, 1e-6, 'sin pose: el torso derecho');
// una pose de otro (que no es de la cantina) no mueve nada
m.pose = 'leyendo'; for (let i = 0; i < 30; i++) cuadro(0, false); cerca(m.brazos[1].rotation.y, 0, 1e-6, "una pose ajena ('leyendo') no se toca");
// cambiar de una a otra sin saltos grandes
m.pose = 'bandeja'; for (let i = 0; i < 90; i++) cuadro(0, false);
const antes = m.brazos[1].rotation.x; m.pose = 'dejar'; cuadro(0, false); ok(Math.abs(m.brazos[1].rotation.x - antes) < 0.2, 'de una pose a otra, sin un salto de golpe');

console.log(`OK 3.9.0 moza · ${pasos} verificaciones · aspecto, bandeja con vasos, poses bandeja/barra/dejar (también caminando) y nada de más en el peso`);
