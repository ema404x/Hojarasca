// 4.21.0 · A · Mutaciones de `verificar-4-21-0-a.mjs`: cada una deshace UN cambio de la plata pareja en una copia de `src/` y la prueba
// tiene que fallar. Un proceso y una carpeta por mutación (los módulos ESM quedan en caché: con otra copia cada una se mide limpia).
//   node pruebas/mutaciones-4-21-0-a.mjs            (todas)    ·    node pruebas/mutaciones-4-21-0-a.mjs fletes   (las que digan «fletes»)
// No está en `verify`: tarda unos 5 s por mutación. La copia sin mutar tiene que pasar (si no, no se mide nada).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const filtro = process.argv[2] || '';
// [nombre, archivo, texto que está, texto que lo deshace]
const MUTACIONES = [
  ['fletes: carga vuelve a 3 + 3·t en yerba', 'src/comercio.js', 'premio: { pesos: (1 + t) * COMERCIO.fletePaso }', 'premio: { pesos: (3 + 3 * t) * COMERCIO.fletePaso }'],
  ['fletes: pasajeros vuelve a 2 + ⌈0,8·c⌉ + 2·t', 'src/comercio.js', 'pesos: (1 + Math.ceil(cuantos * 0.4) + t) * COMERCIO.fletePaso', 'pesos: (2 + Math.ceil(cuantos * 0.8) + t * 2) * COMERCIO.fletePaso'],
  ['fletes: pasajeros con 0,5 en vez de 0,4', 'src/comercio.js', 'Math.ceil(cuantos * 0.4)', 'Math.ceil(cuantos * 0.5)'],
  ['fletes: el escalón vale $300', 'src/comercio.js', 'fletePaso: 100,', 'fletePaso: 300,'],
  ['fletes: el premio vuelve a la clave yerba', 'src/comercio.js', 'premio: { pesos: (1 + t) * COMERCIO.fletePaso }', 'premio: { yerba: 1 + t }'],
  ['fletes guardados: se pierde la migración de la clave vieja', 'src/comercio.js', 'entero(f.premio?.pesos ?? (Number(f.premio?.yerba) || 0) * COMERCIO.fletePaso, 9900)', 'entero(f.premio?.pesos, 9900)'],
  ['fletes guardados: la yerba vieja se paga a $1', 'src/comercio.js', '(Number(f.premio?.yerba) || 0) * COMERCIO.fletePaso, 9900)', '(Number(f.premio?.yerba) || 0), 9900)'],
  ['fletes guardados: el texto no traduce la clave vieja', 'src/comercio.js', ': Math.max(0, Number(f?.premio?.yerba) || 0) * COMERCIO.fletePaso);', ': 0);'],
  ['fletes: el texto vuelve a decir «de yerba»', 'src/comercio.js', 'paga: `${pesosDeFlete(f)} pesos${extra}`', 'paga: `${pesosDeFlete(f)} de yerba${extra}`'],
  ['fletes: al llegar se vuelve a cobrar yerba × 100', 'src/comercio-mundo.js', 'cobrarPesos(P(), textoFlete(f).pesos,', 'cobrarPesos(P(), aPesos(f.premio?.yerba || 0),'],
  ['mercado: la caja vuelve a $700 por día', 'src/mercado.js', 'cajaDia: 450,', 'cajaDia: 700,'],
  ['mercado: la caja baja a $300', 'src/mercado.js', 'cajaDia: 450,', 'cajaDia: 300,'],
  ['empleo: el almacén vuelve a 1600/2100/2700', 'src/empleo.js', 'sueldos: [2000, 2650, 3400]', 'sueldos: [1600, 2100, 2700]'],
  ['empleo: la casa de té vuelve a 1600/2000/2600', 'src/empleo.js', 'sueldos: [2000, 2500, 3250]', 'sueldos: [1600, 2000, 2600]'],
  ['empleo: el taller vuelve a 1800/2300/2800', 'src/empleo.js', 'sueldos: [2250, 2900, 3500]', 'sueldos: [1800, 2300, 2800]'],
  ['empleo: el banco vuelve a 1700/2200/2800', 'src/empleo.js', 'sueldos: [2150, 2750, 3500]', 'sueldos: [1700, 2200, 2800]'],
  ['empleo: el banco con × 1,5 en vez de × 1,25', 'src/empleo.js', 'sueldos: [2150, 2750, 3500]', 'sueldos: [2550, 3300, 4200]'],
  ['tablón: los tramos vuelven a ×1,5 / ×2 / ×2,5', 'src/tablon.js', 'tramos: [[350, 1.3], [550, 1.6], [Infinity, 2]],', 'tramos: [[350, 1.5], [550, 2], [Infinity, 2.5]],'],
  ['tablón: sólo el tramo lejano vuelve a ×2,5', 'src/tablon.js', '[550, 1.6], [Infinity, 2]]', '[550, 1.6], [Infinity, 2.5]]'],
  ['poncho: el invierno vuelve a ×1,45', 'src/comercio.js', 'poncho: 1.25, frutilla: 1.7', 'poncho: 1.45, frutilla: 1.7'],
  ['remo: XP.remo vuelve a 1', 'src/oficios.js', 'remo: 4, ', 'remo: 1, '],
  ['remo: XP.remo en 2', 'src/oficios.js', 'remo: 4, ', 'remo: 2, '],
];

const lista = MUTACIONES.filter((m) => m[0].includes(filtro));
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-mut-4210a-'));
const preparar = (id) => {
  const d = path.join(base, id);
  fs.mkdirSync(path.join(d, 'pruebas'), { recursive: true });
  fs.mkdirSync(path.join(d, 'herramientas'), { recursive: true });
  fs.cpSync(path.join(raiz, 'src'), path.join(d, 'src'), { recursive: true });
  fs.copyFileSync(path.join(raiz, 'three-r186-inline.js'), path.join(d, 'three-r186-inline.js'));
  for (const f of ['verificar-4-21-0-a.mjs', 'ayuda-three.mjs']) fs.copyFileSync(path.join(raiz, 'pruebas', f), path.join(d, 'pruebas', f));
  for (const f of fs.readdirSync(path.join(raiz, 'herramientas'))) if (f.startsWith('auditoria-4-20-a-')) fs.copyFileSync(path.join(raiz, 'herramientas', f), path.join(d, 'herramientas', f));
  return d;
};
const correr = (d) => spawnSync(process.execPath, ['pruebas/verificar-4-21-0-a.mjs'], { cwd: d, encoding: 'utf8', timeout: 180000 });
const primerError = (r) => ((r.stderr || '').split('\n').find((l) => /Error/.test(l)) || (r.stdout || '').split('\n').pop() || '').slice(0, 150);

let mal = 0;
{
  const d = preparar('sin-mutar');
  const r = correr(d);
  if (r.status !== 0) { console.error('La copia SIN mutar falla: no se puede medir nada.\n' + primerError(r)); process.exit(1); }
  console.log('sin mutar: pasa');
}
for (const [i, [nombre, archivo, esta, queda]] of lista.entries()) {
  const d = preparar(`m${i}`);
  const f = path.join(d, archivo);
  const txt = fs.readFileSync(f, 'utf8');
  if (!txt.includes(esta)) { console.log(`  ?? ${nombre}: no encuentro el texto a mutar en ${archivo}`); mal++; continue; }
  fs.writeFileSync(f, txt.replace(esta, () => queda));
  const r = correr(d);
  if (r.status === 0) { console.log(`  NO LA ATRAPA: ${nombre}`); mal++; } else console.log(`  atrapada: ${nombre}  →  ${primerError(r)}`);
}
fs.rmSync(base, { recursive: true, force: true });
console.log(mal === 0 ? `mutaciones-4-21-0-a: ${lista.length} de ${lista.length} atrapadas` : `mutaciones-4-21-0-a: ${mal} sin atrapar de ${lista.length}`);
process.exit(mal === 0 ? 0 : 1);
