// 4.8.1: ayuda para las pruebas que arman módulos del juego (con three) adentro de una VM, con el three local
// (three-r186-inline.js), como hacen las de los duendes: `cargarVM(raiz, ['duendes-modelo.js'])` devuelve
// `{ M, THREE }`: `M['duendes-modelo']` son las exportaciones de ese módulo y de lo que importa.
// Sólo entiende lo que entiende armar.mjs (imports en una línea, exports de `const`/`function`/`class`).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function cargarVM(raiz, entradas, extra = {}) {
  const src = path.join(raiz, 'src');
  const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const info = new Map(), orden = [], visto = new Set();
  const visitar = (f) => {
    f = path.resolve(f);
    if (visto.has(f)) return;
    visto.add(f);
    const texto = fs.readFileSync(f, 'utf8');
    info.set(f, texto);
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(path.resolve(path.dirname(f), m[2]));
    orden.push(f);
  };
  for (const e of entradas) visitar(path.join(src, e));
  const transformar = (f, t) => {
    const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) => `const { ${n.split(',').map((x) => x.trim().replace(/\s+as\s+/, ': ')).filter(Boolean).join(', ')} } = ${idModulo(path.resolve(path.dirname(f), spec))};`);
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += `;globalThis.__THREE = THREE; globalThis.__M = {${entradas.map((e) => `'${e.replace(/\.js$/, '')}': ${idModulo(e)}`).join(',')}};`;
  const ctx = { console, Math, performance, globalThis: null, ...extra };
  ctx.globalThis = ctx;
  vm.runInNewContext(code, ctx);
  return { M: ctx.__M, THREE: ctx.__THREE, ctx };
}
