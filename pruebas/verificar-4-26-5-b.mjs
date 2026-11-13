// 4.26.5 (B): cacería de bugs en el pueblo construido. Arreglos con su prueba:
//   1. Casa de Té (Aldea): las lajas del camino quedaban horizontales y apoyadas por el centro; en la bajada hacia la calle (28 % medido en la partida real) una
//      punta colgaba hasta 24 cm sobre el pasto y la otra se hundía hasta 11 cm en el ripio (de lejos, lajas «en cuña»). Ahora cada laja se apoya en el plano de la
//      altura de sus cuatro lados (src/apoyo-plano.js, `apoyoEnPlano`) y se inclina con el terreno.
// Se prueba (a) la regla pura, (b) con la `matriz` de verdad (geometria.js, orden YXZ) que las cuatro esquinas del tope de la laja siguen un terreno inclinado en los dos
// sentidos y con la laja girada, y (c) el código de verdad de exteriorCasaTe (el lazo de las lajas de estructuras.js) con un terreno de mentira.
// Cada mutación es una copia de src/ con otro nombre y corre en su propio proceso (la caché de ESM sólo mide la primera): tiene que hacer fallar algo.
// Uso: node pruebas/verificar-4-26-5-b.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.B4265_SRC || path.join(raiz, 'src');
const yo = fileURLToPath(import.meta.url);

async function comprobar() {
  registrarThree();
  const { apoyoEnPlano } = await import(pathToFileURL(path.join(SRC, 'apoyo-plano.js')).href);
  const { matriz } = await import(pathToFileURL(path.join(SRC, 'geometria.js')).href);
  const THREE = await import('three');
  const fuente = fs.readFileSync(path.join(SRC, 'estructuras.js'), 'utf8');
  const R = [];
  const ok = (nombre, v) => R.push([nombre, !!v]);
  const cerca = (a, b, t) => Math.abs(a - b) <= t;

  // ---- (a) la regla pura
  const plano = (sx, sz, h0 = 10) => (a, b) => h0 + sx * a + sz * b;
  const p0 = apoyoEnPlano(plano(0, 0, 7), 0.7, 0.45);
  ok('terreno llano: la pieza queda horizontal a la altura del terreno', cerca(p0.y, 7, 1e-12) && p0.inclinaX === 0 && p0.inclinaZ === 0);
  const px = apoyoEnPlano(plano(0.3, 0, 10), 0.7, 0.45);
  ok('sube hacia +a (a lo largo): inclinaZ positiva, sin inclinaX, y en el centro', px.inclinaZ > 0.28 && px.inclinaZ < 0.31 && cerca(px.inclinaX, 0, 1e-12) && cerca(px.y, 10, 1e-12));
  const pz = apoyoEnPlano(plano(0, 0.3, 10), 0.7, 0.45);
  ok('sube hacia +b (a lo ancho): inclinaX negativa (el giro en X de three baja el lado +b), sin inclinaZ', pz.inclinaX < -0.28 && pz.inclinaX > -0.31 && cerca(pz.inclinaZ, 0, 1e-12));
  const pn = apoyoEnPlano(() => NaN, 0.7, 0.45);
  ok('con alturas que no son números: horizontal a 0 (no NaN)', pn.y === 0 && pn.inclinaX === 0 && pn.inclinaZ === 0);
  ok('sin medidas: horizontal a 0', apoyoEnPlano(plano(0.3, 0.3), 0, 0.4).inclinaZ === 0 && apoyoEnPlano(plano(0.3, 0.3), 0.7, -1).y === 0);

  // ---- (b) con la matriz de verdad: las cuatro esquinas del tope (0,025 sobre el centro) siguen el terreno, laja girada y terreno inclinado en los dos sentidos
  const esquinas = (lx, lz, w, d, giro, h) => {
    const cg = Math.cos(giro), sg = Math.sin(giro);
    const alturaA = (a, b) => h(lx + a * cg + b * sg, lz - a * sg + b * cg);
    const { y, inclinaX, inclinaZ } = apoyoEnPlano(alturaA, w, d);
    const M = matriz([lx, y + 0.015, lz], [inclinaX, giro, inclinaZ]);
    let peor = 0;
    for (const [sa, sb] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const v = new THREE.Vector3(sa * w / 2, 0.025, sb * d / 2).applyMatrix4(M);
      peor = Math.max(peor, Math.abs(v.y - (h(v.x, v.z) + 0.04)));
    }
    return peor;
  };
  const sup = (sx, sz) => (x, z) => 24 + sx * x + sz * z;
  ok('terreno inclinado 0,28 hacia +x y 0,12 hacia +z, laja sin girar: el tope sigue al terreno (±1,5 cm)', esquinas(3, 5, 0.75, 0.45, 0, sup(0.28, 0.12)) < 0.015);
  ok('lo mismo con la laja girada 0,5 rad', esquinas(3, 5, 0.75, 0.45, 0.5, sup(0.28, 0.12)) < 0.015);
  ok('lo mismo girada 0,6 rad y la pendiente al revés', esquinas(-2, 7, 0.8, 0.5, 0.6, sup(-0.25, -0.2)) < 0.015);
  ok('la pendiente de la bajada hacia la calle (0,28 por lz) con la laja girada 0,3', esquinas(0.1, 8, 0.7, 0.45, 0.3, sup(0, -0.28)) < 0.015);

  // ---- (c) el lazo de las lajas de exteriorCasaTe (el código de verdad) con un terreno de mentira
  const i0 = fuente.indexOf('  for (let k = 0; k < 9; k++) {\n    const lz = D / 2 + 3.5 + k * 0.5');
  const i1 = fuente.indexOf('  // ---- la pizarra con la carta del día', i0);
  ok('el lazo del camino de lajas está en estructuras.js', i0 > 0 && i1 > i0);
  const lazo = fuente.slice(i0, i1);
  const hs = (k) => { const v = Math.sin(k * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const correr = (h) => {
    const piezas = [], c = { agregar: (geo, o) => piezas.push({ w: geo.parameters.width, d: geo.parameters.depth, h: geo.parameters.height, M: o.matriz, o }) };
    new Function('D', 'hs', 'suelo', 'c', 'THREE', 'matriz', 'apoyoEnPlano', lazo)(5.2, hs, h, c, THREE, matriz, apoyoEnPlano);
    return piezas;
  };
  const desvio = (piezas, h) => {
    let peor = 0;
    for (const p of piezas) for (const [sa, sb] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const v = new THREE.Vector3(sa * p.w / 2, p.h / 2, sb * p.d / 2).applyMatrix4(p.M);
      peor = Math.max(peor, Math.abs(v.y - (h(v.x, v.z) + 0.04)));
    }
    return peor;
  };
  const llano = correr(() => 0.3);
  ok('el lazo arma las 9 lajas', llano.length === 9 && llano.every((p) => p.h === 0.05));
  ok('terreno llano: las lajas quedan a ras (tope 4 cm sobre el suelo) y horizontales', desvio(llano, () => 0.3) < 1e-6);
  const cuesta = (x, z) => 0.28 * z - 0.1 * x;
  ok('bajada de 28 % con 10 % de costado: las cuatro esquinas de las 9 lajas siguen el terreno (±2 cm)', desvio(correr(cuesta), cuesta) < 0.02);
  const cuesta2 = (x, z) => -0.2 * z + 0.25 * x;
  ok('bajada al otro lado: lo mismo', desvio(correr(cuesta2), cuesta2) < 0.02);
  ok('las lajas siguen siendo de 0,05 de alto, de 0,62 a 0,82 de largo y de 0,40 a 0,52 de ancho', llano.every((p) => p.w >= 0.62 && p.w <= 0.82 && p.d >= 0.4 && p.d <= 0.52));
  ok('lo que usa el lazo: apoyoEnPlano importado en estructuras.js', /^import \{ apoyoEnPlano \} from '\.\/apoyo-plano\.js';$/m.test(fuente));
  ok('el comentario del camino de lajas de la 3.8.8 sigue en su lugar', fuente.includes('// ---- el camino de lajas, del escalón hacia el sendero'));
  return R;
}

if (process.argv.includes('--hijo')) {
  const R = await comprobar();
  console.log(JSON.stringify(R));
  process.exit(0);
}

let malas = 0;
const hijo = (src) => {
  const r = spawnSync(process.execPath, [yo, '--hijo'], { env: { ...process.env, B4265_SRC: src }, encoding: 'utf8' });
  try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return null; }
};
const base = hijo(SRC);
if (!base) { console.error('no corrió la comprobación'); process.exit(1); }
for (const [n, v] of base) { console.log((v ? 'ok   ' : 'MAL  ') + n); if (!v) malas++; }

// ---- mutaciones
const MUT = [
  ['apoyo-plano.js', 'inclinaZ con el signo al revés', 'inclinaZ: Math.atan2(hxb - hxa, largo)', 'inclinaZ: -Math.atan2(hxb - hxa, largo)'],
  ['apoyo-plano.js', 'inclinaX con el signo al revés', 'inclinaX: -Math.atan2(hzb - hza, ancho)', 'inclinaX: Math.atan2(hzb - hza, ancho)'],
  ['apoyo-plano.js', 'la altura es la de un solo lado', 'y: (hxa + hxb + hza + hzb) / 4', 'y: hxa'],
  ['apoyo-plano.js', 'la altura es la del lado de arriba', 'y: (hxa + hxb + hza + hzb) / 4', 'y: Math.max(hxa, hxb, hza, hzb)'],
  ['apoyo-plano.js', 'sin inclinación a lo largo', 'inclinaZ: Math.atan2(hxb - hxa, largo)', 'inclinaZ: 0'],
  ['apoyo-plano.js', 'sin inclinación a lo ancho', 'inclinaX: -Math.atan2(hzb - hza, ancho)', 'inclinaX: 0'],
  ['apoyo-plano.js', 'sin la guarda de alturas que no son números', '![hxa, hxb, hza, hzb].every(Number.isFinite) || ', ''],
  ['estructuras.js', 'las lajas vuelven a apoyarse por el centro', 'const { y, inclinaX, inclinaZ } = apoyoEnPlano(alturaA, w, d);', 'const y = suelo(lx, lz), inclinaX = 0, inclinaZ = 0;'],
  ['estructuras.js', 'las lajas se apoyan en el plano pero no se inclinan', 'matriz([lx, y + 0.015, lz], [inclinaX, giro, inclinaZ])', 'matriz([lx, y + 0.015, lz], [0, giro, 0])'],
  ['estructuras.js', 'las alturas se miden en el marco equivocado de la laja', 'lz - a * sg + b * cg);   // (a:', 'lz + a * sg + b * cg);   // (a:'],
  ['estructuras.js', 'las alturas se miden sin el giro de la laja', 'suelo(lx + a * cg + b * sg, lz - a * sg + b * cg)', 'suelo(lx + a, lz + b)'],
  ['estructuras.js', 'la laja deja de girar', '[inclinaX, giro, inclinaZ]', '[inclinaX, 0, inclinaZ]'],
];
for (const [archivo, nombre, de, a] of MUT) {
  const original = fs.readFileSync(path.join(SRC, archivo), 'utf8');
  if (!original.includes(de)) { console.log('MAL  mutación inaplicable: ' + nombre); malas++; continue; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut4265b-'));
  fs.cpSync(SRC, dir, { recursive: true });
  fs.writeFileSync(path.join(dir, archivo), original.replace(de, a));
  const r = hijo(dir);
  const falla = !r || r.some(([, v]) => !v);
  console.log((falla ? 'ok   ' : 'MAL  ') + 'la mutación «' + nombre + '» hace fallar');
  if (!falla) malas++;
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(malas ? `\n${malas} problema(s)` : '\ntodo en verde');
process.exit(malas ? 1 : 0);
