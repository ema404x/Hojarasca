// 4.25.0 (C): personajes. Manos con dedos, la nariz un poco más esculpida y más capas de color en la ropa, como geometría chica y color por vértice:
// ≤ +1000 triángulos por persona, 0 llamadas de dibujo nuevas, 0 shaders, 0 capas de pantalla completa, la pose sigue fusionada (una malla con piel) y los lejanos
// no pagan el detalle (todo lo nuevo es pieza fina, salvo la palma, que cuesta un puñado de triángulos).
//
// Se arma a TODA la gente en una VM (sin DOM, con el three local) con el código de `src/gente-cuerpo.js`, y se la mide: triángulos contra los de la 4.24.1 (tabla de
// abajo, medida con el código de esa versión), triángulos que se dibujan lejos, mallas por persona y los huesos. Después se mira la geometría armada (antes de fundirla en la
// malla con piel): que los dedos nazcan a lo ancho de la palma, que el mate esté agarrado por los cuatro dedos por delante y el pulgar por detrás, la nariz que sobresale un poco más que la de la 4.24.1,
// las capas de color del poncho, del puño y del gorro. Y se repite todo sobre copias MUTADAS del código (en memoria, cada una con su VM): cada una tiene que hacer
// fallar su comprobación.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- la 4.24.1 (triángulos totales y triángulos que se dibujan lejos, sin lo fino), por persona
// cuánto sobresale la punta de la nariz del plano de las mejillas (mm), con el código de la 4.24.1
const PROTRUSION_BASE = { 'ramon': 75.3, 'nicanor': 57.58, 'ema': 71.23, 'guarda': 70.71, 'aldea-nene': 51.96, 'poblador-panadera': 63.87, 'aldea-jefe': 81.27 };
const BASE = JSON.parse(fs.readFileSync(path.join(raiz, 'pruebas', 'datos-4-25-0-c-base.json'), 'utf8'));

// ---------------------------------------------------------------- el código, en una VM
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const GANCHO = ['  const malla = yield* continuoPasos(f);\n  g.scale.setScalar(f.escala);', '  globalThis.__ult = f; if (globalThis.__antes) globalThis.__antes(f);\n  const malla = yield* continuoPasos(f);\n  g.scale.setScalar(f.escala);'];
async function cargar(reemplazos = []) {
  const info = new Map(), orden = [], visto = new Set();
  const archivo = path.join(src, 'gente-cuerpo.js');
  const visitar = (f) => {
    f = path.resolve(f);
    if (visto.has(f)) return;
    visto.add(f);
    let texto = fs.readFileSync(f, 'utf8');
    if (f === archivo) for (const [a, b] of [GANCHO, ...reemplazos]) { assert.ok(texto.includes(a), `la mutación apunta a algo que existe: ${a.slice(0, 70)}`); texto = texto.replace(a, b); }
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
    info.set(f, texto); orden.push(f);
  };
  visitar(archivo);
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
  code += `\n;globalThis.__C = ${idModulo(archivo)}; globalThis.__THREE = THREE;`;
  const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Uint16Array, Uint32Array, Int32Array, Uint8Array, Uint8ClampedArray, Error, Symbol, globalThis: null };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'gente-cuerpo-vm.js' });
  const R = await import(pathToFileURL(path.join(src, 'gente-ropa.js')).href);
  const A = await import(pathToFileURL(path.join(src, 'aldea.js')).href);
  return { C: ctx.__C, THREE: ctx.__THREE, ctx, R, A };
}
const armar = (E, k, invierno = false) => {
  const def = k.startsWith('aldea-') ? E.A.VECINOS_ALDEA[k.slice(6)] : k.startsWith('poblador-') ? E.A.POBLADORES_ALDEA[k.slice(9)] : null;
  SNAP = []; PADRE = new WeakMap();
  E.ctx.__antes = (f) => { f.g.updateMatrixWorld(true); f.g.traverse((o) => { if (o.isMesh) { SNAP.push(o); PADRE.set(o, o.parent); } }); };
  const p = E.C.crearPersona(def?.colores || {}, k, def?.mano === 'mate' || k === 'ramon', {}, { talla: def?.talla, invierno });
  return { p, f: E.ctx.__ult };
};
const mallaPiel = (p) => { let m = null; p.g.traverse((o) => { if (o.isSkinnedMesh) m = o; }); return m; };
const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];

// lo que se mira de una persona armada (antes de fundirla): piezas por grupo
let SNAP = [], PADRE = new WeakMap();
const dentroDe = (m, grupo) => { for (let q = PADRE.get(m); q; q = q.parent) if (q === grupo) return true; return false; };
function piezasDe(grupo, filtro) { return SNAP.filter((m) => dentroDe(m, grupo) && filtro(m)); }
const cajaDe = (m, grupoRef) => {
  const P = m.geometry.attributes.position, v = new E_THREE.Vector3(), inv = new E_THREE.Matrix4().copy(grupoRef.matrixWorld).invert(), rel = new E_THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
  const b = { x: [1e9, -1e9], y: [1e9, -1e9], z: [1e9, -1e9] };
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(rel); for (const e of ['x', 'y', 'z']) { b[e][0] = Math.min(b[e][0], v[e]); b[e][1] = Math.max(b[e][1], v[e]); } }
  return b;
};
let E_THREE = null;
let chequeos = 0;
const triDe = (m) => (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;

// ---------------------------------------------------------------- las comprobaciones sobre una versión del código (la de verdad o una mutada)
// Devuelve la lista de lo que falla; con el código de verdad tiene que quedar vacía.
async function revisar(E, { completo = false } = {}) {
  const falla = [];
  const chequear = (c, t) => { chequeos++; if (!c) falla.push(t); };
  E_THREE = E.THREE;
  const C = E.C;
  const M = C.MANO_4_25, MM = C.MANO_MATE_4_25, N = C.NARIZ_4_25;
  chequear(M && MM && N, 'las medidas de la mano, de la mano del mate y de la nariz están exportadas');
  if (!(M && MM && N)) return falla;

  // --- la mano: medidas (a lo ancho de la palma, tres falanges, curva creciente, el largo de cada dedo)
  const anchoPalma = Math.max(...M.palma.map(([r]) => r));
  const dz = M.dedos.map((d) => d.dz), L = M.dedos.map((d) => d.L), curva = M.dedos.map((d) => d.curva);
  chequear(M.dedos.length === 4, 'cuatro dedos');
  chequear(Math.max(...dz) - Math.min(...dz) >= 0.036 && Math.max(...dz) + M.radios[0] <= anchoPalma * 1.03 && Math.min(...dz) - M.radios[0] >= -anchoPalma * 1.03, `los dedos nacen a lo ancho de la palma (de ${Math.min(...dz)} a ${Math.max(...dz)}, palma ${anchoPalma})`);
  chequear(L[1] > L[0] && L[1] > L[2] && L[3] < L[0] && L[3] < L[2], 'el medio es el dedo más largo y el meñique el más corto');
  chequear(curva.every((c, i) => i === 0 || c >= curva[i - 1]) && curva[3] > curva[0], 'del índice al meñique, cada vez más curvados');
  chequear(Math.abs(M.falanges.reduce((a, b) => a + b, 0) - 1) < 0.01 && M.falanges.length === 3 && M.giros.length === 3 && M.giros.every((g, i) => i === 0 || g > M.giros[i - 1]), 'tres falanges que suman el dedo y se doblan cada vez más');
  chequear(M.radios.every((r, i) => i === 0 || r < M.radios[i - 1]) && M.radios[0] >= 0.0065 && M.radios[0] <= 0.0095, 'el dedo se afina hacia la punta y mide como un dedo');
  const palma = M.palma;
  chequear(palma.length >= 8 && palma[2][0] >= anchoPalma * 0.82 && palma[6][0] >= anchoPalma * 0.72 && palma[6][0] < palma[2][0], 'la palma es una pala (ancha casi hasta los nudillos y más angosta en la muñeca), no una bola');
  chequear(M.tramos >= 5 && M.tramos <= 7 && M.lados >= 5 && M.lados <= 7 && M.ladosPalma >= 8 && M.ladosPalma <= 10, 'los dedos con pocos lados y tramos (geometría chica)');

  // --- la mano del mate: cuatro dedos por delante, el pulgar por atrás, sin pisarse y sobre la calabaza
  const dedosMate = MM.dedos, ys = dedosMate.map((d) => d.y).sort((a, b) => b - a);
  chequear(dedosMate.length === 4 && ys.every((y, i) => i === 0 || ys[i - 1] - y >= 1.7 * MM.radios[0]), 'los cuatro dedos del mate, uno sobre otro, sin pisarse');
  chequear(dedosMate.every((d) => d.a1 - d.a0 >= 70 && d.a1 >= 80 && d.a0 >= 0 && d.a0 <= 20), 'los dedos le dan la vuelta por delante de la calabaza (70 grados o más)');
  chequear(MM.pulgar.a1 < MM.pulgar.a0 && MM.pulgar.a1 <= -50 && MM.pulgar.y > Math.max(...dedosMate.map((d) => d.y)), 'el pulgar le da la vuelta por atrás y por arriba');
  chequear([...dedosMate.map((d) => d.y), MM.pulgar.y].every((y) => y > MM.perfil[1][0] && y < MM.perfil[MM.perfil.length - 1][0]), 'todo agarra la calabaza por el cuerpo');

  // --- la nariz: apenas más esculpida (que no cambie la cara de nadie)
  chequear(N.puente > 0.0085 && N.puente <= 0.0125 && N.punta > 0.0055 && N.punta <= 0.0085 && N.aletas > 0.0034 && N.aletas <= 0.0055 && N.fosas > 0 && N.fosas <= 0.0024, 'las medidas de la nariz esculpida suben un poco (hasta +45 %)');

  // --- el presupuesto, armando gente
  const claves = completo
    ? ['ramon', 'nicanor', 'ema', 'ercilia', 'guarda', 'fermin', ...E.A.ORDEN_VECINOS_ALDEA.map((k) => `aldea-${k}`), ...E.A.ORDEN_POBLADORES_ALDEA.map((k) => `poblador-${k}`)]
    : ['ramon', 'nicanor', 'aldea-nene', 'poblador-panadera'];
  const stats = [];
  for (const k of claves) for (const inv of completo ? [false, true] : [false]) {
    const clave = k + (inv ? '+inv' : '');
    if (!Object.hasOwn(BASE, clave)) continue;
    const { p, f } = armar(E, k, inv);
    const piel = mallaPiel(p), mallas = []; p.g.traverse((o) => { if (o.isMesh) mallas.push(o); });
    const tri = piel.geometry.index.count / 3, sin = piel.userData.indicesSinFino / 3;
    const [t0, s0] = BASE[clave];
    chequear(mallas.filter((o) => o.isSkinnedMesh).length === 1 && mallas.length === 2 + (p.bandeja ? 1 : 0) && p.cara && !p.cara.visible, `${clave}: una malla con piel y la cara aparte (0 llamadas nuevas)`);
    chequear(tri - t0 <= 1000, `${clave}: a lo sumo +1000 triángulos (hay ${tri - t0})`);
    chequear(tri - t0 >= 250, `${clave}: el detalle nuevo está (+${tri - t0})`);
    chequear(sin - s0 <= 120 && sin - s0 >= -260, `${clave}: lo que se dibuja de lejos casi no cambia (${sin - s0})`);
    chequear(piel.userData.indicesSinFino > 0 && piel.userData.indicesSinFino < piel.userData.indices, `${clave}: lejos se dibuja sin lo fino`);
    chequear(Number(p.cara.morphTargetInfluences.length) === 2, `${clave}: la cara con sus gestos`);
    stats.push({ clave, tri: tri - t0, sin: sin - s0 });
    // la geometría armada (sólo sin invierno: es la misma mano)
    if (!inv && f) {
      const g = f.g, brazos = f.brazos;
      const finos = (grupo) => piezasDe(grupo, (m) => m.userData.fino && m.userData.piel);
      const conMate = !!f.muneca;
      // la mano que no sostiene el mate (o las dos): 4 dedos + el pulgar + su base, todo fino, y la palma sin fino
      const codoIzq = brazos[0].userData.codo;
      if (codoIzq) {
        const piezas = piezasDe(codoIzq, (m) => !m.userData.rol);
        const dedos = piezas.filter((m) => m.userData.fino && triDe(m) >= 60 && triDe(m) <= 80);
        chequear(dedos.length >= 5, `${clave}: la mano tiene sus cinco dedos con tres falanges (${dedos.length})`);
        chequear(piezas.filter((m) => m.userData.fino && triDe(m) === 36).length === 1, `${clave}: el pulgar con su base carnosa`);
        const palmas = piezas.filter((m) => !m.userData.fino && triDe(m) >= 100 && triDe(m) <= 170);
        chequear(palmas.length === 1, `${clave}: y una palma que se dibuja siempre`);
        if (dedos.length >= 5 && palmas.length === 1) {
          const cp = cajaDe(palmas[0], g), anchoP = cp.z[1] - cp.z[0];
          const cs = dedos.slice(0, 4).map((m) => cajaDe(m, g)).sort((a, b) => a.z[0] - b.z[0]);
          const cubren = (cs[3].z[1] - cs[0].z[0]) / anchoP;
          chequear(cubren >= 0.9 && cubren <= 1.12, `${clave}: los cuatro dedos cubren el ancho de la palma (${cubren.toFixed(2)})`);
          chequear(cs.every((c, i) => i === 0 || c.z[0] >= cs[i - 1].z[0] - 1e-9), `${clave}: los dedos van de atrás para adelante`);
          const bajan = cs.map((c) => c.y[0]);
          chequear(Math.min(...bajan) < cp.y[0] - 0.035, `${clave}: los dedos cuelgan debajo de la palma`);
        }
      }
      if (conMate) {
        const dedosMano = piezasDe(f.muneca, (m) => m.userData.fino && m.userData.piel);
        chequear(dedosMano.length === 5, `${clave}: la mano del mate tiene cuatro dedos y el pulgar (${dedosMano.length})`);
        const mate = piezasDe(f.muneca, (m) => m.userData.mate);
        const calabaza = mate.sort((a, b) => triDe(b) - triDe(a))[0];
        if (calabaza && dedosMano.length === 5) {
          const cc = cajaDe(calabaza, g), centro = [(cc.x[0] + cc.x[1]) / 2, (cc.z[0] + cc.z[1]) / 2];
          const caja = dedosMano.map((m) => cajaDe(m, g));
          const delante = caja.slice(0, 4).filter((c) => (c.z[0] + c.z[1]) / 2 > centro[1] + 0.02).length;
          chequear(delante >= 3, `${clave}: los dedos pasan por delante de la calabaza (${delante} de 4)`);
          const pulgar = caja[4];
          chequear((pulgar.z[0] + pulgar.z[1]) / 2 < centro[1], `${clave}: el pulgar queda por atrás`);
          // ningún dedo se mete en la calabaza (que no la atraviese): cada vértice a más de 0,045 del eje
          let masCerca = 1e9;
          for (const m of dedosMano) { const P = m.geometry.attributes.position, v = new E.THREE.Vector3(); const inv = new E.THREE.Matrix4().copy(g.matrixWorld).invert(); const rel = new E.THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld); for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(rel); masCerca = Math.min(masCerca, Math.hypot(v.x - centro[0], v.z - centro[1])); } }
          chequear(masCerca > 0.047, `${clave}: los dedos apoyan en la calabaza sin atravesarla (${masCerca.toFixed(3)})`);
        }
      }
      // la nariz: cuánto sobresale la punta del plano de las mejillas, contra la 4.24.1 (la misma grilla del cráneo: 0 triángulos de más)
      if (Object.hasOwn(PROTRUSION_BASE, k)) {
        const cr = piezasDe(f.cabeza, (m) => m.userData.piel && !m.userData.fino && triDe(m) > 1500 && PADRE.get(m) === f.cabeza)[0], F = f.F;
        const P = cr.geometry.attributes.position;
        let zTip = -1e9, zPlano = 0, n = 0;
        for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i) - F.cy, z = P.getZ(i); if (Math.abs(x) < 0.006 && y > F.punta - 0.006 && y < F.punta + 0.004) zTip = Math.max(zTip, z); if (Math.abs(x) > 0.028 && Math.abs(x) < 0.042 && y > F.punta - 0.006 && y < F.punta + 0.004) { zPlano += z; n++; } }
        const mas = (zTip - zPlano / n) * 1000 - PROTRUSION_BASE[k];
        chequear(mas >= 1.5 && mas <= 8, `${clave}: la nariz sobresale ${mas.toFixed(1)} mm más que en la 4.24.1 (entre 1,5 y 8)`);
      }
      // las capas de color: el puño con costillas
      const puno = codoIzq ? piezasDe(codoIzq, (m) => m.userData.rol === 'puno')[0] : null;
      if (puno) {
        const C0 = puno.geometry.attributes.color, np = 4, col = new Map();
        for (let i = 0; i < C0.count; i++) { const c = Math.floor(i / np); col.set(c, (col.get(c) || 0) + lum([C0.getX(i), C0.getY(i), C0.getZ(i)])); }
        const v = [...col.values()].map((x) => x / np), mn = Math.min(...v), mx = Math.max(...v);
        chequear(mx / mn > 1.08, `${clave}: el puño con costillas (${(mx / mn).toFixed(3)})`);
      }
    }
    E.C.soltarPersona(p);
  }
  // el poncho con esclavina y con el forro del cuello (Ramón y quien lleva poncho)
  {
    const { p, f } = armar(E, 'ramon', true);
    const poncho = piezasDe(f.g, (m) => m.userData.rol === 'poncho')[0];
    chequear(!!poncho, 'ramon: tiene poncho');
    if (poncho) {
      const P = poncho.geometry.attributes.position, Cc = poncho.geometry.attributes.color;
      const filas = (a, b) => { let s = 0, n = 0; for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y >= a && y <= b) { s += lum([Cc.getX(i), Cc.getY(i), Cc.getZ(i)]); n++; } } return n ? s / n : 0; };
      const hombro = filas(0.47, 0.6), cuerpo = filas(0.1, 0.33);
      chequear(hombro < cuerpo * 0.96, `ramon: la esclavina es de un tono más hondo que el cuerpo del poncho (${(hombro / cuerpo).toFixed(3)})`);
    }
    const cuello = piezasDe(f.g, (m) => PADRE.get(m) === f.torso && m.geometry.type === 'LatheGeometry' && m.geometry.parameters.points.length === 3 && Math.abs(m.geometry.parameters.points[0].y - 0.578) < 1e-6)[0];
    chequear(!!cuello, 'ramon: el cuello del poncho');
    if (cuello && poncho) {
      const a = cuello.material.color, b = poncho.material.color;
      chequear(lum([a.r, a.g, a.b]) > lum([b.r, b.g, b.b]) * 1.04, 'ramon: el cuello del poncho lleva el forro más claro que el poncho');
    }
    E.C.soltarPersona(p);
  }
  // el gorro de lana con su franja (Nicanor, de invierno)
  {
    const { p, f } = armar(E, 'nicanor', true);
    const gorros = piezasDe(f.cabeza, (m) => m.geometry.type === 'LatheGeometry' && m.geometry.parameters.points.length === 8);
    chequear(gorros.length === 1, 'nicanor (invierno): el gorro de lana');
    if (gorros.length === 1) {
      const P = gorros[0].geometry.attributes.position, Cc = gorros[0].geometry.attributes.color, np = 8;
      const anillo = (j) => { let s = 0, n = 0; for (let i = j; i < P.count; i += np) { s += lum([Cc.getX(i), Cc.getY(i), Cc.getZ(i)]); n++; } return s / n; };
      chequear(anillo(4) > anillo(3) * 1.04 && anillo(4) > anillo(5) * 1.04, `nicanor (invierno): una franja clara en el gorro (${(anillo(4) / anillo(3)).toFixed(3)})`);
    }
    E.C.soltarPersona(p);
  }
  return falla;
}

// ---------------------------------------------------------------- 1. el código de verdad
const textoCuerpo = fs.readFileSync(path.join(src, 'gente-cuerpo.js'), 'utf8');
ok(!textoCuerpo.includes('\r') && !/^export\s+(?:const|let|function|class)\s+\S*ñ/m.test(textoCuerpo), 'gente-cuerpo.js: LF y sin exportar nombres con ñ');
ok(!/ShaderMaterial|RawShaderMaterial|WebGLRenderTarget|ShaderPass|FullScreenQuad/.test(textoCuerpo), '0 shaders, 0 destinos de dibujo y 0 capas de pantalla completa en gente-cuerpo.js');
ok(textoCuerpo.includes('4.25.0:') && /^export const MANO_4_25 = \{/m.test(textoCuerpo) && /^export const MANO_MATE_4_25 = \{/m.test(textoCuerpo) && /^export const NARIZ_4_25 = \{/m.test(textoCuerpo), 'los comentarios llevan la versión y las medidas están exportadas, una por línea');
ok(!/new THREE\.(ShapeGeometry|Shape|OctahedronGeometry|Vector4|Frustum)\b/.test(textoCuerpo), 'nada de lo que el three local no trae');

const real = await cargar();
const fallas = await revisar(real, { completo: true });
for (const f of fallas) console.log('  FALLA:', f);
ok(fallas.length === 0, `la gente armada con el código de verdad cumple todo (${fallas.length} fallas)`);

// ---------------------------------------------------------------- 2. la gente sigue siendo la de siempre
{
  // la pose y los huesos: 24 por persona, los grupos de siempre, el mate se guarda como antes
  const { p } = armar(real, 'ramon');
  ok(p.brazos.length === 2 && p.patas.length === 2 && p.mano && p.torso && p.cabeza && p.muneca, 'los huesos de siempre (para las poses de gente.js)');
  const malla = mallaPiel(p);
  p.mateVisible.visible = false;
  ok(malla.geometry.drawRange.count === malla.userData.indicesSinMate, 'el mate guardado no se dibuja');
  p.mateVisible.visible = true;
  ok(malla.geometry.drawRange.count === Infinity, 'con el mate a la vista, todo');
  real.C.soltarPersona(p);
  const base = real.C.huesosEnUso();
  const a = armar(real, 'nicanor').p, b = armar(real, 'aldea-nena').p;
  ok(real.C.huesosEnUso() - base === 2, 'cada persona con su tramo de huesos (24 por persona, como antes)');
  real.C.soltarPersona(a); real.C.soltarPersona(b);
  ok(real.C.huesosEnUso() === base, 'al irse, los tramos quedan libres');
}

// ---------------------------------------------------------------- 3. mutaciones: copias del código con un defecto; cada una tiene que hacer fallar su comprobación
const MUTACIONES = [
  ['los cuatro dedos juntos en el medio de la palma (como antes)', [['dedos: [{ dz: 0.0215, L: 0.054, curva: 0.85 }, { dz: 0.0075, L: 0.06, curva: 1 }, { dz: -0.0065, L: 0.057, curva: 1.15 }, { dz: -0.02, L: 0.046, curva: 1.35 }]', 'dedos: [{ dz: 0.016, L: 0.054, curva: 0.85 }, { dz: 0.0055, L: 0.06, curva: 1 }, { dz: -0.005, L: 0.057, curva: 1.15 }, { dz: -0.015, L: 0.046, curva: 1.35 }]']]],
  ['la palma otra vez una bola', [['palma: [[0.0001, -0.043], [0.016, -0.041], [0.0255, -0.034], [0.029, -0.02], [0.0285, 0], [0.0265, 0.02], [0.0225, 0.034], [0.0165, 0.043], [0.0001, 0.046]]', 'palma: [[0.0001, -0.043], [0.012, -0.04], [0.02, -0.03], [0.026, -0.015], [0.029, 0], [0.026, 0.015], [0.02, 0.03], [0.012, 0.04], [0.0001, 0.043]]']]],
  ['dedos derechos (sin falanges que se doblen)', [['giros: [0.12, 0.5, 0.9]', 'giros: [0.0, 0.0, 0.0]']]],
  ['el meñique tan largo como el medio', [['{ dz: -0.02, L: 0.046, curva: 1.35 }', '{ dz: -0.02, L: 0.062, curva: 1.35 }']]],
  ['los dedos de la mano sin ser piezas finas (se dibujan de lejos)', [['grupo.add(fino(deMano(pintarPieza(d, (c, p, n) => {', 'grupo.add((deMano(pintarPieza(d, (c, p, n) => {']]],
  ['la mano con muchísimos triángulos (dedos con 14 tramos y 10 lados)', [['  lados: 6,\n  dedos:', '  lados: 10,\n  dedos:'], ['radios: [0.0078, 0.0075, 0.0071, 0.0067],\n  tramos: 6,', 'radios: [0.0078, 0.0075, 0.0071, 0.0067],\n  tramos: 14,']]],
  ['sin el pulgar en la mano', [['grupo.add(fino(deMano(pintarPieza(huso(colMano, pg, ', 'if (0) grupo.add(fino(deMano(pintarPieza(huso(colMano, pg, ']]],
  ['sin la base carnosa del pulgar', [['grupo.add(fino(deMano(bola(colMano, [0.0115 * kb, 0.021 * kb, 0.0125 * kb]', 'if (0) grupo.add(fino(deMano(bola(colMano, [0.0115 * kb, 0.021 * kb, 0.0125 * kb]']]],
  ['la mano del mate sin dedos (otra vez dos bolas)', [['for (const d of MANO_MATE_4_25.dedos) mano.push(', 'for (const d of []) mano.push(']]],
  ['los dedos del mate a la misma altura (se pisan)', [['dedos: [{ y: 0.0145, a0: 8, a1: 100 }, { y: 0.001, a0: 8, a1: 106 }, { y: -0.0125, a0: 8, a1: 98 }, { y: -0.026, a0: 8, a1: 82 }]', 'dedos: [{ y: 0.004, a0: 8, a1: 100 }, { y: 0.002, a0: 8, a1: 106 }, { y: 0, a0: 8, a1: 98 }, { y: -0.002, a0: 8, a1: 82 }]']]],
  ['el pulgar del mate del mismo lado que los dedos', [['pulgar: { y: 0.03, a0: -14, a1: -78 }', 'pulgar: { y: 0.03, a0: 14, a1: 78 }']]],
  ['los dedos del mate dan sólo un cuarto de vuelta', [['dedos: [{ y: 0.0145, a0: 8, a1: 100 }, { y: 0.001, a0: 8, a1: 106 }, { y: -0.0125, a0: 8, a1: 98 }, { y: -0.026, a0: 8, a1: 82 }]', 'dedos: [{ y: 0.013, a0: 8, a1: 40 }, { y: 0.001, a0: 8, a1: 40 }, { y: -0.011, a0: 8, a1: 40 }, { y: -0.023, a0: 8, a1: 40 }]']]],
  ['los dedos del mate adentro de la calabaza', [['r = rMate(y) + (0.0062 - 0.0018 * (i / 3)) * kb;', 'r = rMate(y) - 0.012 * kb;']]],
  ['la nariz como en la 4.24.1 (sin lo nuevo)', [['export const NARIZ_4_25 = { puente: 0.0098, punta: 0.0068, aletas: 0.0048, fosas: 0.0016 };', 'export const NARIZ_4_25 = { puente: 0.0085, punta: 0.0055, aletas: 0.0034, fosas: 0 };']]],
  ['la nariz exagerada', [['export const NARIZ_4_25 = { puente: 0.0098, punta: 0.0068, aletas: 0.0048, fosas: 0.0016 };', 'export const NARIZ_4_25 = { puente: 0.0125, punta: 0.0135, aletas: 0.0105, fosas: 0.0016 };']]],
  ['sin las fosas', [['export const NARIZ_4_25 = { puente: 0.0098, punta: 0.0068, aletas: 0.0048, fosas: 0.0016 };', 'export const NARIZ_4_25 = { puente: 0.0098, punta: 0.0068, aletas: 0.0048, fosas: 0 };']]],
  ['el poncho sin esclavina', [['if (v.y >= 0.425) c.lerp(colorDe(oscuroP), 0.3 * sv(0.425, 0.5, v.y));', '']]],
  ['el cuello del poncho sin forro claro', [["mezcla(colPoncho, '#d8c49c', 0.34)", 'matiz(colPoncho, 0.8)']]],
  ['el puño liso (sin costillas)', [['c.multiplyScalar(Math.floor(i / 4) % 2 ? 0.93 : 1.04); });', 'c.multiplyScalar(1); });']]],
  ['el gorro sin franja', [["tinta(c, mezcla(ropa, '#e8d8b0', 0.55), 0.5 * Math.exp(-(((q.y - 0.06) / 0.012) ** 2)));", '']]],
];
let mutadasQueFallan = 0;
for (const [nombre, reemp] of MUTACIONES) {
  let Em;
  try { Em = await cargar(reemp); } catch (e) { console.log(`  (la mutación «${nombre}» no se pudo armar: ${e.message})`); ok(false, `la mutación «${nombre}» arma`); }
  let f2;
  try { f2 = await revisar(Em, { completo: false }); } catch (e) { f2 = [`se rompió: ${e.message}`]; }
  ok(f2.length > 0, `la mutación «${nombre}» hace fallar alguna comprobación`);
  mutadasQueFallan++;
}
ok(mutadasQueFallan === MUTACIONES.length, `las ${MUTACIONES.length} mutaciones hacen fallar su comprobación`);
// la copia sin tocar, por el mismo camino, pasa
{
  const Esin = await cargar([]);
  const f3 = await revisar(Esin, { completo: false });
  ok(f3.length === 0, `la copia sin mutar pasa por el mismo camino (${f3.join(' | ')})`);
}

console.log(`verificar-4-25-0-c: ${pasos} comprobaciones (más ${chequeos} de la gente armada), ${MUTACIONES.length} mutaciones`);
