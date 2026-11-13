// 4.26.5 (A): la gente del pueblo.
//   1. El vecino de la aldea que camina se frena a mirarte (`cerquita`: vos a menos de 7 m) sólo PARADA_MIRAR_S segundos; después sigue su camino hasta que te alejás.
//      Antes, parado vos a menos de 7 m de su calle, no se movía más (y el aviso de «trabado» de la aldea no cuenta a los que tenés a menos de 7,5 m).
//   2. Los puntos de pie de la casa y del trabajo que caían a 0,3 m adentro de un muro o un mueble se corren al lugar libre más cercano al armar los destinos (aldea-gente.js
//      `despejarDestino`, una vez por punto), y `ctx.col` llega desde main.js.
// Prueba de lectura del código de gente.js con una mutación por proceso (la caché de ESM sólo mide la primera).
// Uso: node pruebas/verificar-4-26-5-a.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FUENTE = process.env.A4265_FUENTE || path.join(raiz, 'src', 'gente.js');
const yo = fileURLToPath(import.meta.url);
const AG = process.env.A4265_AG || path.join(raiz, 'src', 'aldea-gente.js');
const ag = fs.readFileSync(AG, 'utf8');
const main = fs.readFileSync(path.join(raiz, 'src', 'main.js'), 'utf8');
const texto = fs.readFileSync(FUENTE, 'utf8');
const R = [];
const ok = (n, v) => R.push([n, !!v]);

ok('PARADA_MIRAR_S exportada, entre 3 y 15 s', (() => { const m = /export const PARADA_MIRAR_S = (\d+(?:\.\d+)?);/.exec(texto); return m && Number(m[1]) >= 3 && Number(m[1]) <= 15; })());
ok('cuenta el tiempo del que camina con vos cerca', /if \(!\(d < 7\) \|\| !g\.camino\?\.length\) g\.__miraT = 0;/.test(texto));
ok('pasado el tope deja de estar «cerquita»', /else if \(cerquita\) \{ g\.__miraT = \(g\.__miraT \|\| 0\) \+ dt; if \(g\.__miraT > PARADA_MIRAR_S\) cerquita = false; \}/.test(texto));
ok('la regla va antes de usar cerquita para caminar', texto.indexOf('g.__miraT > PARADA_MIRAR_S') > 0 && texto.indexOf('g.__miraT > PARADA_MIRAR_S') < texto.indexOf('if (g.camino && !charlando && !cerquita) {'));
ok('despejarDestino: sólo de pie (no sentados, escaleras, lejanos ni del amor)', ag.includes('if (!d || d.sentado || d.arriba || d.lejano || d.amor || Number.isFinite(d.y)'));
ok('despejarDestino: los puntos adentro, trabajo y cliente', ag.includes("PUNTOS_DE_PIE = new Set(['adentro', 'trabajo', 'cliente'])"));
ok('despejarDestino: radio 0,22, hasta 1,2 m, sin salir del edificio', ag.includes('col.resolver(sonda, 0.22, 1.65)') && ag.includes('rad <= 1.2') && ag.includes('!!edificioEn(l.lx, l.lz) === dentro'));
ok('despejarDestino: una vez por punto y sólo con los obstáculos armados', ag.includes('despejados.set(clave, r)') && ag.includes('if (!col.cercanos(d.x, d.z).length) return false;'));
ok('se aplica a los destinos de cada vuelta y corre al que ya estaba parado', ag.includes('if (!despejarDestino(d)) continue;') && ag.includes('n.pos.x = d.x; n.pos.z = d.z;'));
ok('main.js le pasa col a la aldea', main.includes('col: () => col,   // 4.26.5'));
// conducta: la misma lógica evaluada en un cuadro a cuadro de mentira
const PARADA = Number(/PARADA_MIRAR_S = (\d+)/.exec(texto)[1]);
{
  const g = { camino: [1] };
  let movio = 0;
  for (let i = 0; i < 20 * 60; i++) {
    const d = 5, dt = 1 / 60;
    let cerquita = d < 7;
    if (!(d < 7) || !g.camino?.length) g.__miraT = 0;
    else if (cerquita) { g.__miraT = (g.__miraT || 0) + dt; if (g.__miraT > PARADA) cerquita = false; }
    if (!cerquita) movio++;
  }
  ok('con vos quieto a 5 m, a los PARADA_MIRAR_S segundos sigue caminando', movio > 0 && movio < 20 * 60);
}

{
  // la búsqueda del lugar libre con un muro de verdad (en 2D): a 0,05 m del muro, el punto libre más cercano a >= 0,22 m
  const libre = (x) => Math.abs(x - 10) >= 0.22 + 1e-9;
  let r = null;
  for (let rad = 0.2; rad <= 1.2 && !r; rad += 0.2) { const k = Math.max(8, Math.round(rad * 14)); for (let i = 0; i < k; i++) { const a = (i / k) * Math.PI * 2, qx = 10.05 + Math.cos(a) * rad; if (libre(qx)) { r = qx; break; } } }
  ok('el punto a 0,05 m de un muro se corre a un lugar libre a menos de 0,6 m', r !== null && Math.abs(r - 10.05) < 0.6);
}
if (process.argv[2] === 'comprobar') { for (const [n, v] of R) console.log(`${v ? '✓' : '✗'} ${n}`); process.exit(R.every(([, v]) => v) ? 0 : 1); }
if (process.env.A4265_FUENTE || process.env.A4265_AG) { process.exit(R.every(([, v]) => v) ? 0 : 1); }
for (const [n, v] of R) console.log(`${v ? '✓' : '✗'} ${n}`);
let fallas = R.filter(([, v]) => !v).length;
const mutaciones = [
  ['sin tope de tiempo', (t) => t.replace('if (g.__miraT > PARADA_MIRAR_S) cerquita = false;', '')],
  ['sin la cuenta', (t) => t.replace('else if (cerquita) { g.__miraT = (g.__miraT || 0) + dt; if (g.__miraT > PARADA_MIRAR_S) cerquita = false; }', '')],
  ['sin correr los puntos', (t) => t, (a) => a.replace('if (!despejarDestino(d)) continue;', 'continue;')],
  ['sin la búsqueda cercana', (t) => t, (a) => a.replace('rad <= 1.2', 'rad <= 0')],
  ['también los sentados', (t) => t, (a) => a.replace('if (!d || d.sentado || d.arriba', 'if (!d || d.arriba')],
  ['tope enorme', (t) => t.replace('PARADA_MIRAR_S = 8;', 'PARADA_MIRAR_S = 800;')],
];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'm4265a-'));
mutaciones.forEach(([nombre, f, fa], i) => {
  const arch = path.join(tmp, `gente-${i}.js`), archA = path.join(tmp, `aldea-${i}.js`);
  const t = f(texto), a = fa ? fa(ag) : ag;
  fs.writeFileSync(arch, t); fs.writeFileSync(archA, a);
  const r = spawnSync(process.execPath, [yo], { env: { ...process.env, A4265_FUENTE: arch, A4265_AG: archA }, encoding: 'utf8' });
  const atrapada = r.status !== 0 && (t !== texto || a !== ag);
  console.log(`${atrapada ? '✓' : '✗'} mutación atrapada: ${nombre}`);
  if (!atrapada) fallas++;
});
fs.rmSync(tmp, { recursive: true, force: true });
console.log(fallas ? `FALLAS: ${fallas}` : `OK (${R.length} comprobaciones, ${mutaciones.length} mutaciones)`);
process.exit(fallas ? 1 : 0);
