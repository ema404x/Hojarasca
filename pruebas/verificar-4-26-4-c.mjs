// 4.26.4 (C): el puesto de troncos entra a la regla de interiores (no dibujar el exterior desde adentro).
// La equivalencia de imagen (4.26.3) mostraba pasto asomando por el piso del puesto. No era el terreno ni una rendija: el mapa de pisos sin pasto (`marcarPisos`, main.js)
// es de 2 m por celda con filtro lineal, y junto a las paredes la marca quedaba por debajo del umbral del pasto. Se arregló sin tocar la malla ni la altura del piso (0,58 m):
// la marca del puesto es 20 cm más ancha por lado y suma un círculo de 0,7 m en cada esquina (sólo la marca, no se pisa).
//   1. interior-visible.js (el de verdad): el puesto está en CASAS_CERRADAS y tiene su caja (puerta al frente).
//   2. main.js, canterosParaPisos y marcarPisos (el código de verdad, con un mundo de mentira): el puesto aporta su marca desde que tiene piso (etapa 2); con la marca real,
//      en 24 posiciones y giros contra la grilla de 2 m, TODO punto del piso (hasta 2 cm de las paredes) queda con valor lineal >= 0,5 (el umbral del pasto es 0,4); y la marca no
//      es de más: a 3 m de la pared ya no hay. Los canteros y lo demás siguen igual.
//   3. La geometría del puesto no cambió: el piso sigue a 0,58 m (plataforma) y el escalón a 0,36 m.
// Cada mutación es una copia de src/ con otro nombre y corre en su propio proceso (la caché de ESM sólo mide la primera): tiene que hacer fallar algo.
// Uso: node pruebas/verificar-4-26-4-c.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { funcion } from './ayuda-codigo.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.C4264_SRC || path.join(raiz, 'src');
const yo = fileURLToPath(import.meta.url);

async function comprobar() {
  const I = await import(pathToFileURL(path.join(SRC, 'interior-visible.js')).href);
  const fuente = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  const construccion = fs.readFileSync(path.join(SRC, 'construccion.js'), 'utf8');
  const R = [];
  const ok = (nombre, v) => R.push([nombre, !!v]);

  // ---- 1. la regla
  ok('el puesto de troncos está en CASAS_CERRADAS', I.CASAS_CERRADAS.has('puesto'));
  const pu = { id: 'puesto', x: 40, z: -70, y: 6, rot: 0.7, ancho: 5.2, fondo: 4.2, alto: 2.35 };
  const caja = I.cajaDeCasa(pu);
  ok('cajaDeCasa del puesto: las medidas del plano, paredes hasta alto + 0,25', !!caja && caja.id === 'obra-puesto' && caja.ancho === 5.2 && caja.fondo === 4.2 && Math.abs(caja.alto - 2.6) < 1e-9);
  ok('la puerta es el vano del frente (-z)', !!caja && caja.frente.length > 2 && caja.frente.every(([a, b]) => Math.abs(b + 2.1) < 1e-9 && Math.abs(a) <= 0.6 + 1e-9));
  const l = (a, b, y) => ({ x: pu.x + a * Math.cos(pu.rot) + b * Math.sin(pu.rot), y, z: pu.z - a * Math.sin(pu.rot) + b * Math.cos(pu.rot) });
  ok('adentro del puesto (ojos a 1,65 m del piso, a 0,58 del pie) la caja encuentra la cámara', !!caja && I.interiorDeCaja(l(0.3, 0.4, 6 + 0.58 + 1.65), caja, {})?.id === 'obra-puesto');
  ok('afuera del puesto no', !!caja && I.interiorDeCaja(l(0, 3.5, 6 + 1.65), caja, {}) === null);

  // ---- 2. la marca de pisos sin pasto
  const N = 512, datos = new Uint8Array(N * N * 4), tex = { needsUpdate: false };
  const T = { altura: () => 12 };
  const env = { texturaEstepa: { datos, n: N, tex }, T, aldeaMundo: null, fiestasMundo: null, firmaPisos: '', Math, Number, Object, Array, Set, Map };
  const puesto = (x, z, rot, etapas) => ({ plano: { id: 'puesto', ancho: 5.2, fondo: 4.2 }, datos: { x, z, rot, etapas } });
  const cantero = { plano: { id: 'cantero' }, datos: { x: -300, z: 300, rot: 0, etapas: 1 } };
  env.obras = { obras: [] };
  env.col = { plataformas: [] };
  env.canterosParaPisos = funcion(fuente, 'canterosParaPisos', env);
  const marcar = funcion(fuente, 'marcarPisos', env);
  const lista = (obras) => { env.obras.obras = obras; return env.canterosParaPisos(); };
  ok('puesto con piso (etapa 2): aporta su marca (el rectángulo y las 4 esquinas)', lista([puesto(40, 70, 0.3, 2)]).length === 5);
  ok('puesto sin piso todavía (etapa 1): sin marca', lista([puesto(40, 70, 0.3, 1)]).length === 0);
  const l4 = lista([puesto(40, 70, 0.3, 4)]), m4 = l4[0];
  ok('el rectángulo es 20 cm más ancho por lado (5,2 + 0,4 por 4,2 + 0,4) y gira como la obra', !!m4 && Math.abs(m4.largo - 5.6) < 1e-9 && Math.abs(m4.ancho - 4.6) < 1e-9 && Math.abs(m4.ang + 0.3) < 1e-9);
  const esq = l4.slice(1), cx = (lx, lz) => 40 + lx * Math.cos(0.3) + lz * Math.sin(0.3), cz = (lx, lz) => 70 - lx * Math.sin(0.3) + lz * Math.cos(0.3);
  ok('los círculos de 0,7 m están en las cuatro esquinas del piso', esq.length === 4 && [[-1, -1], [-1, 1], [1, -1], [1, 1]].every(([sx, sz]) => esq.some((q) => q.radio === 0.7 && Math.abs(q.x - cx(sx * 2.6, sz * 2.1)) < 1e-9 && Math.abs(q.z - cz(sx * 2.6, sz * 2.1)) < 1e-9)));
  const c0 = lista([cantero]);
  ok('el cantero sigue con su marca (2,1 × 1,18)', c0.length === 1 && c0[0].largo === 2.1 && c0[0].ancho === 1.18);

  const valorB = (x, z) => {   // el canal azul con filtro lineal, como lo lee el pasto
    const u = (x + 512) / 2, v = (z + 512) / 2, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    const g = (a, b) => datos[(b * N + a) * 4 + 2] / 255;
    return (g(i, j) * (1 - fu) + g(i + 1, j) * fu) * (1 - fv) + (g(i, j + 1) * (1 - fu) + g(i + 1, j + 1) * fu) * fv;
  };
  let peor = 9, masAfuera = 0;
  for (let k = 0; k < 24; k++) {
    const x = 40 + (k % 4) * 0.5 + 0.13, z = 70 + Math.floor(k / 4) * 0.33 + 0.07, rot = k * 0.27;
    datos.fill(0); env.firmaPisos = '';
    env.obras.obras = [puesto(x, z, rot, 4)];
    const W = 5.2, D = 4.2, cos = Math.cos(rot), sin = Math.sin(rot);
    env.col.plataformas = [{ x, z, ang: -rot, largo: W, ancho: D, alto: 12.58 }];
    marcar();
    for (let a = -W / 2 + 0.02; a <= W / 2 - 0.02 + 1e-9; a += 0.2) for (let b = -D / 2 + 0.02; b <= D / 2 - 0.02 + 1e-9; b += 0.2) {
      peor = Math.min(peor, valorB(x + a * cos + b * sin, z - a * sin + b * cos));
    }
    // a 3 m de la pared de atrás ya no hay marca (no es de más)
    masAfuera = Math.max(masAfuera, valorB(x + (-W / 2 - 3.0) * cos, z - (-W / 2 - 3.0) * sin));
  }
  ok(`todo el piso del puesto queda marcado con valor lineal >= 0,5 (el peor: ${peor.toFixed(2)}; el pasto se corta en 0,4)`, peor >= 0.5);
  ok(`la marca no se pasa: a 3 m de la pared ya no hay (como mucho ${masAfuera.toFixed(2)})`, masAfuera < 0.4);

  // ---- 3. la geometría no cambió
  ok('el piso del puesto sigue a 0,58 m (plataforma) y el escalón a 0,36 m', construccion.includes('alto: base + 0.58, espesor: 0.18 });') && construccion.includes('alto: base + 0.36, espesor: 0.14 });'));
  ok('las tablas del piso siguen a 0,54 m y el escalón a 0,28 m', construccion.includes('matriz: matriz([0, 0.54, z]) });') && construccion.includes('matriz: matriz([0, 0.28, -D / 2 - 0.35]) });'));
  return R;
}

if (process.argv[2] === '--hijo') {
  const R = await comprobar();
  console.log(JSON.stringify(R));
  process.exit(0);
}

let malas = 0;
const hijo = (src) => {
  const r = spawnSync(process.execPath, [yo, '--hijo'], { env: { ...process.env, C4264_SRC: src }, encoding: 'utf8' });
  try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return null; }
};
const base = hijo(SRC);
if (!base) { console.error('no corrió la comprobación'); process.exit(1); }
for (const [n, v] of base) { console.log((v ? 'ok   ' : 'MAL  ') + n); if (!v) malas++; }

// ---- mutaciones
const MUT = [
  ['interior-visible.js', 'el puesto sale de la regla', "'casilla', 'puesto', ", "'casilla', "],
  ['main.js', 'el puesto no aporta marca', 'if (d.etapas >= 2) {\n        lista.push({ x: d.x, z: d.z, ang, largo', 'if (false) {\n        lista.push({ x: d.x, z: d.z, ang, largo'],
  ['main.js', 'la marca del puesto desde la etapa 0', 'if (d.etapas >= 2) {\n        lista.push({ x: d.x, z: d.z, ang, largo', 'if (d.etapas >= 0) {\n        lista.push({ x: d.x, z: d.z, ang, largo'],
  ['main.js', 'la marca del puesto sin los 20 cm', 'largo: P.ancho + 0.4, ancho: P.fondo + 0.4', 'largo: P.ancho, ancho: P.fondo'],
  ['main.js', 'la marca del puesto de más (1,6 m)', 'largo: P.ancho + 0.4, ancho: P.fondo + 0.4', 'largo: P.ancho + 3.2, ancho: P.fondo + 3.2'],
  ['main.js', 'la marca del puesto con los lados cruzados', 'largo: P.ancho + 0.4, ancho: P.fondo + 0.4', 'largo: P.fondo + 0.4, ancho: P.ancho + 0.4'],
  ['main.js', 'sin los círculos de las esquinas', 'const rt = Number(d.rot) || 0;', 'const rt = Number(d.rot) || 0; if (rt !== null) return lista;'],
  ['main.js', 'los círculos de las esquinas muy chicos', 'radio: 0.7, alto });', 'radio: 0.1, alto });'],
  ['main.js', 'los círculos de las esquinas muy grandes', 'radio: 0.7, alto });', 'radio: 3.5, alto });'],
  ['main.js', 'el cantero pierde su marca', "else if (P.id === 'cantero') lista.push(", "else if (P.id === 'cantero-no') lista.push("],
  ['construccion.js', 'el piso del puesto sube', 'alto: base + 0.58, espesor: 0.18 });', 'alto: base + 0.64, espesor: 0.18 });'],
  ['construccion.js', 'las tablas del piso suben', 'matriz: matriz([0, 0.54, z]) });', 'matriz: matriz([0, 0.60, z]) });'],
];
for (const [archivo, nombre, de, a] of MUT) {
  const original = fs.readFileSync(path.join(SRC, archivo), 'utf8');
  if (!original.includes(de)) { console.log('MAL  mutación inaplicable: ' + nombre); malas++; continue; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut4264-'));
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
