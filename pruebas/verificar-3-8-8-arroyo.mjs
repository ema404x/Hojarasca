// 3.8.8: el arroyo y la cascada. El usuario los veía «bugueados o entrecortados». Eran tres cosas, cada una probada acá:
//  1. la cinta del agua era una sola tira: en las vueltas cerradas del cauce (16 puntos) se cruzaba y los triángulos quedaban de
//     espaldas; ahora cada tramo es su rectángulo y las vueltas llevan un abanico (src/cinta-arroyo.js, sin THREE);
//  2. el terraplén de la vía rellenaba el lecho del arroyo aguas abajo del puente y lo dejaba SECO 14 m (el agua, a 4,5 m bajo el
//     suelo): el terreno no sube sobre el cauce (src/terreno.js; se arma el valle de verdad);
//  3. en el salto de agua se salteaban dos tramos (quedaba seco el pie de la caída), la cortina era más angosta que el cauce y de
//     bloques: ahora hay poza hasta la base de la cortina, la cortina cubre el labio y los hilos de agua son suaves.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), src = path.join(raiz, 'src');
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
function cargarVM(mods) {
  const info = new Map(), orden = [], visto = new Set();
  const visitar = (f) => {
    f = path.resolve(f); if (visto.has(f)) return; visto.add(f);
    const texto = fs.readFileSync(f, 'utf8');
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
    info.set(f, texto); orden.push(f);
  };
  for (const m of mods) visitar(path.join(src, m));
  const transformar = (f, t) => {
    const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, nn, spec) =>
      `const { ${nn.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); }).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += '\n;globalThis.M = {' + orden.map((f) => `'${path.basename(f)}': ${idModulo(f)}`).join(',') + '};\n';
  const noop = () => {};
  const fake = new Proxy({ measureText(t) { return { width: String(t).length * 20 }; }, createLinearGradient() { return { addColorStop: noop }; }, createRadialGradient() { return { addColorStop: noop }; } }, { get(t, p) { if (p in t) return t[p]; return noop; }, set(t, p, v) { t[p] = v; return true; } });
  const ctx = { console, Math, Date, JSON, Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Error, Promise, structuredClone, setTimeout, clearTimeout,
    performance: { now: () => performance.now() }, document: { createElement(tag) { if (tag === 'canvas') return { width: 1, height: 1, getContext: () => fake, style: {} }; return { style: {} }; } } };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { timeout: 240000 });
  return ctx.M;
}



import assert from 'node:assert/strict';
import { construirCintaArroyo } from '../src/cinta-arroyo.js';
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

// ---------------------------------------------------------------- 1. la cinta, sin THREE
const recta = Array.from({ length: 20 }, (_, i) => ({ x: i * 2.5, z: 0, s: 10 - i * 0.05, w: 3 }));
const zigzag = Array.from({ length: 24 }, (_, i) => ({ x: i * 2.0, z: (i % 2 ? 3 : -3) + (i % 5), s: 10 - i * 0.02, w: 4.4 }));   // vueltas con radio menor que el ancho
const sano = (g, m) => {
  ok(g.pos.length % 3 === 0 && g.flujo.length === (g.pos.length / 3) * 2 && g.cauce.length === (g.pos.length / 3) * 2, `${m}: un flujo y un cauce por vértice`);
  ok([...g.pos, ...g.flujo, ...g.cauce].every(Number.isFinite), `${m}: sin números rotos`);
  ok(g.ind.length % 3 === 0 && g.ind.every((i) => Number.isInteger(i) && i >= 0 && i < g.pos.length / 3), `${m}: índices válidos`);
  // todo triángulo mira hacia arriba (si no, se descarta y queda un agujero)
  let abajo = 0;
  for (let t = 0; t < g.ind.length; t += 3) {
    const [a, b, c] = [0, 1, 2].map((k) => g.ind[t + k] * 3);
    const ux = g.pos[b] - g.pos[a], uy = g.pos[b + 1] - g.pos[a + 1], uz = g.pos[b + 2] - g.pos[a + 2], vx = g.pos[c] - g.pos[a], vy = g.pos[c + 1] - g.pos[a + 1], vz = g.pos[c + 2] - g.pos[a + 2];
    // el eje Y de la normal (en el plano) es el signo que cuenta: el agua se mira desde arriba
    if (uz * vx - ux * vz < -1e-9) abajo++;
  }
  ok(abajo === 0, `${m}: ningún triángulo de espaldas (${abajo})`);
};
function cubre(g, puntos) {
  let dentro = 0;
  for (const [x, z] of puntos) {
    let hit = false;
    for (let t = 0; t < g.ind.length && !hit; t += 3) {
      const P = [0, 1, 2].map((k) => [g.pos[g.ind[t + k] * 3], g.pos[g.ind[t + k] * 3 + 2]]);
      const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
      const d1 = s([x, z], P[0], P[1]), d2 = s([x, z], P[1], P[2]), d3 = s([x, z], P[2], P[0]);
      hit = !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    }
    if (hit) dentro++;
  }
  return dentro / puntos.length;
}
{
  const gr = construirCintaArroyo(recta, -1), gz = construirCintaArroyo(zigzag, -1);
  sano(gr, 'cauce recto'); sano(gz, 'cauce en zigzag');
  let rng = 3; const R = () => (rng = (rng * 16807) % 2147483647) / 2147483647;
  const pts = []; for (let k = 0; k < 400; k++) { const i = Math.floor(R() * (zigzag.length - 1)), t = R(), a = zigzag[i], b = zigzag[i + 1], ang = R() * 6.283, r = Math.sqrt(R()) * a.w * 0.9; pts.push([a.x + (b.x - a.x) * t + Math.cos(ang) * r, a.z + (b.z - a.z) * t + Math.sin(ang) * r]); }
  ok(cubre(gz, pts) >= 0.99, `el agua cubre el cauce aun en las vueltas cerradas (${(cubre(gz, pts) * 100).toFixed(1)} %)`);
  // el salto: se saltea sólo el escalón; hay poza al pie
  const rs = recta.map((p, i) => ({ ...p, s: i > 9 ? p.s - 5 : p.s }));
  const gs = construirCintaArroyo(rs, 9);
  sano(gs, 'con salto');
  const x9 = rs[9].x, x10 = rs[10].x;
  ok(cubre(gs, [[x9 + 1.5, 0], [x9 + 2.0, 1.5], [x10 + 1, 0]]) === 1, 'hay agua en la poza desde la base de la cortina (no un tramo seco)');
  ok(cubre(gs, [[x9 + 0.3, 0]]) === 0, 'y el escalón mismo no tiene cinta (lo hace la cortina)');
  const yPoza = []; for (let k = 0; k < gs.pos.length; k += 3) if (gs.pos[k] > x9 + 0.5 && gs.pos[k] < x10 + 0.1) yPoza.push(gs.pos[k + 1]);
  ok(yPoza.length > 0 && yPoza.every((y) => Math.abs(y - (rs[10].s - 0.08)) < 1e-9), 'la poza está al nivel de abajo');
}

// ---------------------------------------------------------------- 2. el valle de verdad: el arroyo no se seca

const MM = cargarVM(['terreno.js']);
const Tv = MM['terreno.js'].generarTerreno();
const rio = Tv.rio, sa = Tv.saltoAgua;
{
  ok(rio.length > 200 && sa, 'el arroyo y su salto');
  // el agua tiene que estar sobre el lecho en todo el eje (salvo la naciente, los primeros puntos, y el escalón del salto)
  const secos = [];
  for (let i = 12; i < rio.length; i++) { if (i === sa.i) continue; const prof = rio[i].s - 0.08 - Tv.altura(rio[i].x, rio[i].z); if (prof < 0.25) secos.push(`${i}:${prof.toFixed(2)}`); }
  ok(secos.length === 0, `el arroyo no se seca: puntos con el lecho sobre el agua = ${secos.join(' ')}`);
  // la vía no queda en el aire por esto: el terraplén sigue donde van los rieles
  let peor = 0; for (const p of Tv.riel) if (!p.sobrePuente) peor = Math.max(peor, p.h - Tv.altura(p.x, p.z));
  ok(peor < 1.0, `los rieles apoyan en el terreno (hasta ${peor.toFixed(2)} m de aire)`);
  // y la cinta del valle de verdad es sana
  const g = construirCintaArroyo(rio, sa.i);
  sano(g, 'el arroyo del valle');
}

// ---------------------------------------------------------------- 3. agua.js la usa
{
  const a = leer('src/agua.js');
  ok(a.includes("import { construirCintaArroyo } from './cinta-arroyo.js';") && a.includes('construirCintaArroyo(T.rio, T.saltoAgua ? T.saltoAgua.i : -1)'), 'agua.js arma el arroyo con la cinta nueva');
  ok(!/i === T\.saltoAgua\.i \+ 1/.test(a), 'ya no se saltea el tramo de la poza');
  ok(/W0 = s\.ancho \* 2\.0/.test(a) && a.includes('Math.sqrt(f)') && !a.includes('PlaneGeometry(anchoCortina'), 'la cortina cubre el labio y es curva (caída libre), no un plano');
  ok(a.includes('function rocasDelSalto') && a.includes('grupo.add(rocasDelSalto(T, s))'), 'el salto lleva sus rocas');
  for (const f of ['src/agua.js', 'src/cinta-arroyo.js']) for (const m of leer(f).matchAll(/^import .*$/gm)) ok(/^import (\* as THREE|\{ [^}]+ \}) from '[^']+';$/.test(m[0]), `import en una línea: ${m[0]}`);
  for (const m of leer('src/cinta-arroyo.js').matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) ok(!/ñ/i.test(m[1]), `exportado sin ñ: ${m[1]}`);
}
console.log(`verificar-3-8-8-arroyo: ${n} verificaciones ok`);
