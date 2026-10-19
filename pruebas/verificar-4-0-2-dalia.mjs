// 4.0.2 (detalles de Dalia): el taco del zapato se mete en el contrafuerte (antes quedaba un hueco: el taco «flotaba»), el paso de baile más corto
// para quien lleva la falda ceñida con tajo (la falda no se abría como un pantalón) y el ribete del escote que se afina donde entra el lóbulo.
// Se arma en una VM sin DOM, como verificar-3-9-moza.mjs.
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

// ---------------------------------------------------------------- 1. el taco
const cuerpo = leer('src/gente-cuerpo.js'), gente = leer('src/gente.js');
ok(!cuerpo.includes('\r') && !gente.includes('\r'), 'fines de línea LF');
ok(/\/\/ 4\.0\.2:/.test(cuerpo) && /4\.0\.2:/.test(gente), 'los comentarios llevan la versión');
// (4.0.5: las piezas del zapato van por `pit(y, z)`, el giro del pie alrededor del tobillo: acá se miden en el pie recto, como antes)
const tacoM = cuerpo.match(/tobillo\.add\(tubo\(matiz\(zap, 0\.8\), ([\d.]+), ([\d.]+), ([\d.]+), pit\((-[\d.]+), (-[\d.]+)\)/);
const contraM = cuerpo.match(/tobillo\.add\(bola\(zap, \[0\.036, 0\.034, 0\.05\], pit\((-[\d.]+), (-[\d.]+)\)/);
ok(tacoM && contraM, 'se leen el taco y el contrafuerte del zapato de taco');
const [alto, yTaco] = [Number(tacoM[3]), Number(tacoM[4])];
const arriba = yTaco + alto / 2, abajo = yTaco - alto / 2, bajoContra = Number(contraM[1]) - 0.034;
ok(arriba > bajoContra + 0.015, `el taco entra ${((arriba - bajoContra) * 100).toFixed(1)} cm en el contrafuerte (arriba ${arriba.toFixed(3)}, contrafuerte desde ${bajoContra.toFixed(3)})`);
cerca(abajo, -0.127, 0.002, 'y la base del taco sigue donde estaba (el zapato apoya igual: no sube ni baja)');

// ---------------------------------------------------------------- 2. el paso de baile
const D = armar('aldea-bailarina'), M = armar('aldea-moza');
cerca(D.pasoCorto, 0.72, 1e-9, 'Dalia (falda ceñida con tajo): paso de baile al 72 %');
ok(M.pasoCorto === 1 && armar('poblador-herbolaria').pasoCorto === 1, 'las demás, con el paso entero');
function amplitud(p, pose, tmax) {
  p.pos = p.g.position; p.fase = 0; p.pose = pose;
  let mx = 0;
  for (let i = 0; i < 400; i++) {
    p.fase = i * 0.02;
    p.patas.forEach((pt) => { pt.rotation.x = 0; pt.rotation.z = 0; });
    p.alPosar(p, 1 / 60, null, false, false);
    for (const pt of p.patas) mx = Math.max(mx, Math.abs(pt.rotation.x));
  }
  return mx;
}
const aD = amplitud(D, 'tango'), aM = amplitud(M, 'tango');
ok(aD < aM * 0.8 && aD > 0.1, `tango: el paso de Dalia (${aD.toFixed(3)}) es más corto que el de otra (${aM.toFixed(3)}) y no se queda quieto`);
const sD = amplitud(D, 'chamame-solo'), sM = amplitud(M, 'chamame-solo');
ok(sD < sM * 0.8 && sD > 0.1, `chamamé solo: ${sD.toFixed(3)} contra ${sM.toFixed(3)}`);
ok(/g\.pasoCorto/.test(gente), 'gente.js: el chamamé de a dos también usa el paso corto');

// ---------------------------------------------------------------- 3. el escote
ok(/ys\.map\(\(y\) => \(curvas \? 0\.0042 \* Math\.max\(0\.12, sv\(0\.4, 0\.47, y\)\) : 0\.0042\)\)/.test(cuerpo), 'el ribete de la V con curvas se afina hacia abajo (las otras, igual que siempre)');
const tri = (n) => { let t = 0; armar(n).g.traverse((o) => { if (o.isSkinnedMesh) t = o.geometry.index.count / 3; }); return t; };
ok(tri('aldea-bailarina') > 9000 && tri('aldea-bailarina') < 21000, `Dalia: ${Math.round(tri('aldea-bailarina'))} triángulos (sin cambio notable)`);

console.log(`OK 4.0.2 Dalia · ${pasos} verificaciones · taco unido al zapato, paso de baile corto y ribete afinado`);
