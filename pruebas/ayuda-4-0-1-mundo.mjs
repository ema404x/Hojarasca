// 4.0.1: arnés de Node para la construcción con el terreno que se le pase (carga src/ con el three local en una vm). Lo usan las pruebas verificar-4-0-1-*.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };

// ---------------------------------------------------------------- cargar src/ con el three local en una vm
function cargar(raices) {
  const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
  const info = new Map(), orden = [], visitando = new Set(), vistos = new Set();
  const visitar = (archivo) => {
    archivo = path.resolve(archivo);
    if (vistos.has(archivo) || visitando.has(archivo)) return;
    visitando.add(archivo);
    const texto = fs.readFileSync(archivo, 'utf8'), deps = [];
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(normalizar(archivo, m[2]));
    info.set(archivo, texto);
    for (const d of deps) visitar(d);
    visitando.delete(archivo); vistos.add(archivo); orden.push(archivo);
  };
  for (const r of raices) visitar(path.join(raiz, 'src', r));
  const transformar = (archivo, texto) => {
    const ex = [...texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t, nombres, spec) => {
      const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); });
      return `const { ${partes.join(', ')} } = ${idModulo(normalizar(archivo, spec))};`;
    });
    texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '').replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');
    return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = leer('three-r186-inline.js') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += `\n;globalThis.__M={THREE,${orden.map((f) => `${path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_')}:${idModulo(f)}`).join(',')}};\n`;
  const fakeCtx = new Proxy({ measureText: (t) => ({ width: String(t).length * 20 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, { get: (t, p) => (p in t ? t[p] : () => {}), set: (t, p, v) => { t[p] = v; return true; } });
  const ctx = { document: { createElement: (tag) => (tag === 'canvas' ? { width: 1, height: 1, getContext: () => fakeCtx } : {}) }, console, Math, Float32Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Date, performance: { now: () => 0 } };
  ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(code, ctx, { timeout: 30000 });
  return ctx.__M;
}
const M = cargar(['construccion.js', 'colisiones.js']);
const { THREE } = M; const C = M.construccion;
function mundo(extraT = {}, veg = { arboles: [], despejar() {} }) {
  const col = M.colisiones.crearColisiones();
  const T = { altura: () => 0, agua: () => false, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {}, ...extraT };
  const s = C.crearConstruccion(T, new THREE.Scene(), col, veg, { agregar() {}, agregarPostigos() {}, eliminarPorDuenio() {} });
  const mats = { tronco: 999, tabla: 999, piedra: 999, lana: 999, cuero: 999, hierro: 999 };
  const terminar = (id, x, z, yaw = 0, y = null) => {
    s.elegir(C.PLANO[id]);
    const f = s.fundar(x, z, yaw, y);
    if (!f.ok) return f;
    while (f.obra.datos.etapas < f.obra.plano.etapas.length) { const r = s.avanzar(f.obra, mats); if (!r.ok) return r; }
    return { ok: true, o: f.obra };
  };
  return { s, col, T, terminar, mats };
}

export { M, mundo, ok, eq, C, THREE, cargar };
