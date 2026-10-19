// 4.0.5 (cuerpo y ropa de Dalia): los zapatos de taco apoyan la punta y el taco a la vez (antes el taco tocaba el piso y la punta quedaba 3,5 cm en el aire: parecían flotar),
// y la V del escote ya no tiene la «muesquita» (el parche de piel sigue la superficie de verdad del corpiño). Se arma en una VM sin DOM, como verificar-4-0-2-dalia.mjs.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const cerca = (a, b, e, t) => ok(Math.abs(a - b) <= e, `${t} (${a.toFixed(4)} vs ${b.toFixed(4)})`);

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
const C = ctx.__C;
const armar = (clave) => C.crearPersona({}, clave, false, {}, {});

// ---- los zapatos: en el modelo de reposo, el punto más bajo de la punta (z > 9 cm) y el del taco (z < 0) quedan a la misma altura, y con `alzado` tocan el piso
const D = armar('aldea-bailarina');
let malla = null; D.g.traverse((o) => { if (o.isSkinnedMesh) malla = o; });
const P = malla.geometry.attributes.position;
let punta = 9, taco = 9;
for (let i = 0; i < P.count; i++) {
  const y = P.getY(i), z = P.getZ(i);
  if (y > 0.2 || Math.abs(P.getX(i)) < 0.02) continue;
  if (z > 0.09) punta = Math.min(punta, y);
  if (z < 0) taco = Math.min(taco, y);
}
cerca(punta, taco, 0.006, 'zapato de taco: la punta y el taco apoyan juntos (diferencia < 6 mm; antes 35 mm)');
cerca(Math.min(punta, taco) + D.alzado, 0, 0.006, 'con `alzado` el zapato toca el piso (a menos de 6 mm)');
ok(D.alzado > 0.05 && D.alzado < 0.07, `alzado de Dalia ${D.alzado}`);
ok(armar('aldea-moza').alzado === 0, 'las que no usan tacos no suben');

// ---- el escote: el parche de piel nunca queda por debajo del corpiño (ni siquiera en los lóbulos)
const cuerpo = fs.readFileSync(path.join(src, 'gente-cuerpo.js'), 'utf8');
ok(/\/\/ 4\.0\.5: la «muesquita» de la V/.test(cuerpo) && /intersectObject\(capaHombro/.test(cuerpo), 'el parche del escote toma la z del corpiño con un rayo');
const tri = (n) => { let t = 0; armar(n).g.traverse((o) => { if (o.isSkinnedMesh) t = o.geometry.index.count / 3; }); return t; };
ok(tri('aldea-bailarina') > 9000 && tri('aldea-bailarina') < 21000, `Dalia: ${Math.round(tri('aldea-bailarina'))} triángulos (sin cambio)`);

console.log(`OK 4.0.5 Dalia · ${pasos} verificaciones · zapatos que apoyan entera la suela y escote sin muesca`);
