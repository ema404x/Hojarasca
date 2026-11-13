// 4.26.5 (A): la gente del pueblo.
//   1. El vecino de la aldea que camina se frena a mirarte (`cerquita`: vos a menos de 7 m) sólo PARADA_MIRAR_S segundos; después sigue su camino hasta que te alejás.
//      Antes, parado vos a menos de 7 m de su calle, no se movía más (y el aviso de «trabado» de la aldea no cuenta a los que tenés a menos de 7,5 m).
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
const texto = fs.readFileSync(FUENTE, 'utf8');
const R = [];
const ok = (n, v) => R.push([n, !!v]);

ok('PARADA_MIRAR_S exportada, entre 3 y 15 s', (() => { const m = /export const PARADA_MIRAR_S = (\d+(?:\.\d+)?);/.exec(texto); return m && Number(m[1]) >= 3 && Number(m[1]) <= 15; })());
ok('cuenta el tiempo del que camina con vos cerca', /if \(!\(d < 7\) \|\| !g\.camino\?\.length\) g\.__miraT = 0;/.test(texto));
ok('pasado el tope deja de estar «cerquita»', /else if \(cerquita\) \{ g\.__miraT = \(g\.__miraT \|\| 0\) \+ dt; if \(g\.__miraT > PARADA_MIRAR_S\) cerquita = false; \}/.test(texto));
ok('la regla va antes de usar cerquita para caminar', texto.indexOf('g.__miraT > PARADA_MIRAR_S') > 0 && texto.indexOf('g.__miraT > PARADA_MIRAR_S') < texto.indexOf('if (g.camino && !charlando && !cerquita) {'));
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

if (process.argv[2] === 'comprobar') { for (const [n, v] of R) console.log(`${v ? '✓' : '✗'} ${n}`); process.exit(R.every(([, v]) => v) ? 0 : 1); }
if (process.env.A4265_FUENTE) { process.exit(R.every(([, v]) => v) ? 0 : 1); }
for (const [n, v] of R) console.log(`${v ? '✓' : '✗'} ${n}`);
let fallas = R.filter(([, v]) => !v).length;
const mutaciones = [
  ['sin tope de tiempo', (t) => t.replace('if (g.__miraT > PARADA_MIRAR_S) cerquita = false;', '')],
  ['sin la cuenta', (t) => t.replace('else if (cerquita) { g.__miraT = (g.__miraT || 0) + dt; if (g.__miraT > PARADA_MIRAR_S) cerquita = false; }', '')],
  ['tope enorme', (t) => t.replace('PARADA_MIRAR_S = 8;', 'PARADA_MIRAR_S = 800;')],
];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'm4265a-'));
mutaciones.forEach(([nombre, f], i) => {
  const arch = path.join(tmp, `gente-${i}.js`);
  const t = f(texto);
  fs.writeFileSync(arch, t);
  const r = spawnSync(process.execPath, [yo], { env: { ...process.env, A4265_FUENTE: arch }, encoding: 'utf8' });
  const atrapada = r.status !== 0 && t !== texto;
  console.log(`${atrapada ? '✓' : '✗'} mutación atrapada: ${nombre}`);
  if (!atrapada) fallas++;
});
fs.rmSync(tmp, { recursive: true, force: true });
console.log(fallas ? `FALLAS: ${fallas}` : `OK (${R.length} comprobaciones, ${mutaciones.length} mutaciones)`);
process.exit(fallas ? 1 : 0);
