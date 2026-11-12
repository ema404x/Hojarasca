// 4.26.2 (A): los puntos «adelante tuyo» (`{ frente, dist, lado }`) no caen adentro de lo que tenés enfrente.
// Conducta de `mundo.posicion` (escenas-mundo.js de verdad, con un mundo de mentira: paredes de caja):
//   1. pared adelante → el punto gira (el primer giro de la lista que vale: punto libre y tramo recto libre); también si el punto cae libre pero del otro lado de la pared
//   2. campo abierto → 0° (el punto de siempre, idéntico)
//   3. un solo giro por escena: todos los puntos de la escena (aunque a 0° valgan) usan el mismo
//   4. se borra al cambiar de escena
//   5. más de 12 m no gira
//   6. si un punto posterior no vale con el giro guardado, no se re-elige
// Cada mutación es una copia de src/ con otro nombre, corre en su propio proceso (la caché de ESM sólo mide la primera) y tiene que hacer fallar algo.
// Uso: node pruebas/verificar-4-26-2-a.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4262_SRC || path.join(raiz, 'src');
const yo = fileURLToPath(import.meta.url);

async function comprobar() {
  const { crearEscenasMundo } = await import(pathToFileURL(path.join(SRC, 'escenas-mundo.js')).href);
  const cajas = [];
  const col = {
    resolver(p, r) {
      for (const c of cajas) {
        if (p.x > c.x0 - r && p.x < c.x1 + r && p.z > c.z0 - r && p.z < c.z1 + r) {
          const d = [p.x - (c.x0 - r), c.x1 + r - p.x, p.z - (c.z0 - r), c.z1 + r - p.z], m = Math.min(...d), i = d.indexOf(m);
          if (i === 0) p.x = c.x0 - r; else if (i === 1) p.x = c.x1 + r; else if (i === 2) p.z = c.z0 - r; else p.z = c.z1 + r;
        }
      }
    },
  };
  const js = { pos: { x: 0, y: 0, z: 0 }, yaw: 0 };   // yaw 0 mira hacia -z
  const ctx = {
    jugador: () => ({ estado: js }), col, T: { altura: () => 0, agua: () => false, lugares: {} }, progreso: () => ({ horas: 12 }), camara: { position: { x: 0, y: 1.6, z: 0 }, rotation: { x: 0, y: 0 } },
    alturaDePie: () => 0, fallo(e) { throw e; },
  };
  const EM = crearEscenasMundo(ctx);
  let id = 'escena-a';
  EM.director.idActual = () => id;
  const pos = (o) => EM.mundo.posicion({ frente: 'jugador', ...o });
  const gira = (g, d, l = 0) => { const c = Math.cos(g), s = Math.sin(g), fx = s, fz = -c; return { x: fx * d + -fz * l, z: fz * d + fx * l }; };
  const cerca = (p, q) => !!p && Math.hypot(p.x - q.x, p.z - q.z) < 1e-6;
  const R = [];
  const ok = (nombre, v) => R.push([nombre, !!v]);
  const G60 = Math.PI / 3;
  const PARED = { x0: -20, x1: 20, z0: -6, z1: -4 };

  // 2. campo abierto
  ok('abierto: 0 grados idéntico', cerca(pos({ dist: 5 }), gira(0, 5)) && cerca(pos({ dist: 3, lado: 1.5 }), gira(0, 3, 1.5)));
  // 1. pared adelante
  cajas.push({ ...PARED });
  id = 'escena-b';
  ok('pared: el punto cae adentro, gira 60 grados', cerca(pos({ dist: 5 }), gira(G60, 5)));
  id = 'escena-c';
  ok('pared: el punto cae libre pero del otro lado (el tramo cruza), gira', cerca(pos({ dist: 8 }), gira(Math.PI / 2, 8)));
  id = 'escena-c2';
  ok('pared: el punto libre delante de la pared no gira', cerca(pos({ dist: 3 }), gira(0, 3)));
  // 3. un solo giro por escena
  id = 'escena-d';
  const p1 = pos({ dist: 5 }), p2 = pos({ dist: 2 }), p3 = pos({ dist: 3, lado: 1 });
  ok('escena: el primero elige', cerca(p1, gira(G60, 5)));
  ok('escena: el segundo (libre a 0 grados) usa el mismo giro', cerca(p2, gira(G60, 2)));
  ok('escena: con lado también', cerca(p3, gira(G60, 3, 1)));
  // 6. un punto posterior que no vale con el giro guardado no se re-elige
  cajas.push({ x0: 3, x1: 9, z0: -3.5, z1: -1.5 });
  ok('escena: no se re-elige si el punto posterior no vale', cerca(pos({ dist: 5 }), gira(G60, 5)));
  cajas.pop();
  // 4. se borra al cambiar de escena
  cajas.length = 0;
  id = 'escena-e';
  ok('otra escena en campo abierto: 0 grados', cerca(pos({ dist: 5 }), gira(0, 5)));
  cajas.push({ ...PARED });
  id = 'escena-f';
  const q1 = pos({ dist: 5 });
  cajas.length = 0;
  const q2 = pos({ dist: 5 });
  ok('misma escena: el giro sigue aunque se abra el campo', cerca(q1, gira(G60, 5)) && cerca(q2, gira(G60, 5)));
  id = 'escena-g';
  ok('al cambiar de escena el giro se borra', cerca(pos({ dist: 5 }), gira(0, 5)));
  // 5. lejos no gira
  cajas.push({ x0: -20, x1: 20, z0: -16, z1: -4 });
  id = 'escena-h';
  ok('13 m (más de 12) no gira', cerca(pos({ dist: 13 }), gira(0, 13)));
  ok('40 m no gira', cerca(pos({ dist: 40 }), gira(0, 40)));
  ok('12 m sí cuenta', !cerca(pos({ dist: 12 }), gira(0, 12)));
  // sin salida: el original
  cajas.length = 0; cajas.push({ x0: -30, x1: 30, z0: -30, z1: 30 });
  id = 'escena-i';
  ok('encerrado: el original', cerca(pos({ dist: 5 }), gira(0, 5)));
  return R;
}

if (process.argv[2] === '--hijo') {
  const R = await comprobar();
  console.log(JSON.stringify(R));
  process.exit(0);
}

let malas = 0;
const hijo = (src) => {
  const r = spawnSync(process.execPath, [yo, '--hijo'], { env: { ...process.env, A4262_SRC: src }, encoding: 'utf8' });
  try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return null; }
};
const base = hijo(SRC);
if (!base) { console.error('no corrió la comprobación'); process.exit(1); }
for (const [n, v] of base) { console.log((v ? 'ok   ' : 'MAL  ') + n); if (!v) malas++; }

// ---- mutaciones
const original = fs.readFileSync(path.join(SRC, 'escenas-mundo.js'), 'utf8');
const MUT = {
  'sin giro (siempre 0 grados)': ['for (const g of GIROS_FRENTE) if (g !== 0 &&', 'for (const g of []) if (g !== 0 &&'],
  'sin chequeo del tramo': ['for (let i = 1; i <= k; i++) {', 'for (let i = 1; i <= 0; i++) {'],
  'sin memoria del giro por escena': ['if (id !== null && girosEscena.giros.has(quien)) return girosEscena.giros.get(quien);', ''],
  'el giro no se borra al cambiar de escena': ['if (girosEscena.id !== id) girosEscena = { id, giros: new Map() };', ''],
  'sin tope de 12 m': ['if (d <= DIST_FRENTE_LIBRE)', 'if (true)'],
  'tope de 50 m': ['const DIST_FRENTE_LIBRE = 12;', 'const DIST_FRENTE_LIBRE = 50;'],
  'el giro no se guarda': ['if (id !== null) girosEscena.giros.set(quien, g); return g;', 'return g;'],
};
for (const [nombre, [de, a]] of Object.entries(MUT)) {
  if (!original.includes(de)) { console.log('MAL  mutación inaplicable: ' + nombre); malas++; continue; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut4262-'));
  fs.cpSync(SRC, dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'escenas-mundo.js'), original.replace(de, a));
  const r = hijo(dir);
  const falla = !r || r.some(([, v]) => !v);
  console.log((falla ? 'ok   ' : 'MAL  ') + 'la mutación «' + nombre + '» hace fallar');
  if (!falla) malas++;
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(malas ? `\n${malas} problema(s)` : '\ntodo en verde');
process.exit(malas ? 1 : 0);
