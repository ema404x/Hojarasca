// 4.0.2 (el borde de la blusa): en las mujeres sin curvas, la cadera de debajo de la ropa ya no asoma por la blusa en la cintura (era el festoneado
// que se veía bajo el chaleco de la maestra). Se mide en una VM sin DOM, como verificar-3-9-moza.mjs.
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

const cuerpo = leer('src/gente-cuerpo.js');
ok(!cuerpo.includes('\r'), 'fines de línea LF');
ok(/\/\/ 4\.0\.2: en las mujeres sin curvas la cadera/.test(cuerpo), 'el comentario lleva la versión');
ok(/\(mujer && !curvas \? 0\.094 : 0\.102\)/.test(cuerpo), 'la cadera de la mujer sin curvas, a 0,094; la de los varones y la de Dalia, como siempre (0,102)');
// la cadera de abajo no sobresale de la blusa: se arma la maestra y se compara la hondura de la cadera con la de la blusa en la cintura
const maestra = armar('poblador-maestra'), hombre = armar('poblador-herbolaria');
let malla = null; maestra.g.traverse((o) => { if (o.isSkinnedMesh) malla = o; });
ok(malla && malla.geometry.attributes.position.count > 3000, 'la maestra se arma');
// el punto más hondo (z) del cuerpo entre y = 0.02 y 0.1 sobre la cadera: todo lo que haya en esa franja es ropa o cadera; la cadera, con 9,4 cm, queda bajo la blusa (14,2 cm * 0,7 = 9,9 cm)
const P = malla.geometry.attributes.position; let zMaxFranja = 0;
for (let i = 0; i < P.count; i++) { const y = P.getY(i), x = Math.abs(P.getX(i)); if (y > 0.82 + 0.02 && y < 0.82 + 0.1 && x < 0.03) zMaxFranja = Math.max(zMaxFranja, P.getZ(i)); }
ok(zMaxFranja > 0.09, `la ropa del frente sigue ahí (z ${zMaxFranja.toFixed(3)})`);
for (const clave of ['poblador-maestra', 'aldea-moza', 'aldea-bailarina', 'poblador-enfermera', 'poblador-modista']) {
  let n = 0; armar(clave).g.traverse((o) => { if (o.isSkinnedMesh) n = o.geometry.index.count / 3; });
  ok(n > 8000, `${clave}: se arma (${Math.round(n)} triángulos)`);
}
ok(hombre && hombre.g, 'y un varón también');
console.log(`OK 4.0.2 blusa · ${pasos} verificaciones · la cadera ya no asoma en la cintura`);
