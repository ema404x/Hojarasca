// 4.0.3: arnés de Node con el VALLE de verdad (terreno, colisiones, puertas, estructuras, trochita y, si se pide, la aldea)
// cargado en una vm con el three local. Lo usan las pruebas verificar-4-0-3-*. Adaptado de los arneses de la zona F de la 2.ª ronda de bugs.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);

export function cargarModulos(entradas) {
  const info = new Map(), orden = [], visto = new Set();
  const visitar = (f) => {
    f = path.resolve(f); if (visto.has(f)) return; visto.add(f);
    const texto = fs.readFileSync(f, 'utf8');
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
    info.set(f, texto); orden.push(f);
  };
  for (const e of entradas) visitar(path.join(src, e));
  const transformar = (f, t) => {
    const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
      `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); }).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '').replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');
    return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += '\n;globalThis.THREE = THREE; globalThis.M = {' + orden.map((f) => `${path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_')}: ${idModulo(f)}`).join(',') + '};\n';
  const noop = () => {};
  const fakeCtx = new Proxy({ measureText(t) { return { width: String(t).length * 20 }; }, createLinearGradient() { return { addColorStop: noop }; }, createRadialGradient() { return { addColorStop: noop }; } }, { get(t, p) { if (p in t) return t[p]; return noop; }, set(t, p, v) { t[p] = v; return true; } });
  const ctx = { console, Math, Date, JSON, Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Error, Promise, structuredClone, setTimeout, clearTimeout,
    performance: { now: () => performance.now() }, document: { createElement(tag) { if (tag === 'canvas') return { width: 1, height: 1, getContext: () => fakeCtx, style: {} }; return { style: {} }; } } };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { timeout: 240000 });
  return { THREE: ctx.THREE, M: ctx.M, ctx };
}

// una vegetación de mentira pero con árboles
export function vegetacionFalsa(semilla = 7) {
  let s = semilla;
  const r = () => { s = (Math.imul(s ^ (s >>> 15), 2246822519) + 3266489917) | 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; };
  const arboles = [];
  for (let i = 0; i < 2600; i++) arboles.push({ x: (r() * 2 - 1) * 480, z: (r() * 2 - 1) * 480, r: 0.4, sacado: false, ref: {} });
  const despejadas = [];
  return {
    arboles, colisiones: [], despejadas,
    arbolesCerca: (x, z, radio) => arboles.filter((a) => Math.abs(a.x - x) < radio + 1 && Math.abs(a.z - z) < radio + 1),
    despejar(x, z, radio) { despejadas.push({ x, z, radio }); let n = 0; for (const a of arboles) if (!a.sacado && Math.hypot(a.x - x, a.z - z) < radio + a.r) { a.sacado = true; n++; } return n; },
  };
}

export function cargarValle(extra = []) {
  const { THREE, M } = cargarModulos(['terreno.js', 'cache-carga.js', 'colisiones.js', 'puertas.js', 'estructuras.js', 'trochita.js', 'aldea.js', 'aldea-mundo.js', 'comercio.js', ...extra]);
  const sonido = new Proxy({}, { get: () => () => {} });
  const { terreno: Te, colisiones: C, puertas: P, estructuras: E, trochita: TR, aldea: A, aldea_mundo: AM } = M;
  function valle({ aldea = false, veg = vegetacionFalsa() } = {}) {
    const T = Te.generarTerreno();
    const escena = new THREE.Scene();
    const col = C.crearColisiones();
    const puertas = P.crearPuertas(T, escena, col, null);
    let am = null, op;
    const progreso = { aldea: A.aldeaNueva() };
    if (aldea) {
      am = AM.crearAldeaMundo({ T, escena, veg, progreso: () => progreso, brilloVentana: () => {} });
      op = { aldea: am.sitiosValle(), sorteo: am.emparejar() };
    }
    const est = E.crearEstructuras(T, escena, col, veg, puertas, op);
    if (am) { am.despejar(); am.montar({ est, col, puertas }); }
    const tren = TR.crearTrochita(T, escena, col, sonido, { cartel: () => {}, sentaderos: [], aldea: aldea ? { indice: A.PARADA_ALDEA.indice, nombre: A.NOMBRE_ALDEA } : null, lugaresAntes: est.lugaresSorteo || null });
    if (am) am.estacion(tren.paradas.find((p) => p.aldea));
    return { T, escena, col, puertas, est, tren, am, veg, progreso };
  }
  return { THREE, M, valle, sonido };
}
