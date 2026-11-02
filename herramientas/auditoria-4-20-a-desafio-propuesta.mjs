// 4.20.0 (A): la curva del Desafío con los números nuevos, sobre una COPIA de src/ en una carpeta temporal (no se toca el juego).
//   node herramientas/auditoria-4-20-a-desafio-propuesta.mjs
// Cambia tres cosas de desafio-reglas.js y desafio-vuelta.js y vuelve a medir la presión por noche (los mismos números que auditoria-4-20-a-desafio.mjs):
//   1. la cantidad de la oleada sigue creciendo después de la noche 9 (hoy se queda en 18 hasta la 20): +1 cada dos noches, hasta 23;
//   2. la dureza de la noche (vida y daño) crece un 10 % por noche desde la 11 (hoy 8 % parejo);
//   3. cada vuelta (Otra vuelta) suma menos de vida y de daño y algo menos de cantidad: así la cantidad no choca con el tope de 24 en la vuelta 3.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const aqui = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const raiz = path.resolve(aqui, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-a420-'));
fs.cpSync(path.join(raiz, 'src'), path.join(tmp, 'src'), { recursive: true, filter: (s) => !/idioma-en/.test(s) });
fs.copyFileSync(path.join(raiz, 'package.json'), path.join(tmp, 'package.json'));

function parchar(archivo, de, a) {
  const p = path.join(tmp, 'src', archivo);
  const t = fs.readFileSync(p, 'utf8');
  if (!t.includes(de)) throw new Error(`no está el fragmento en ${archivo}: ${de}`);
  fs.writeFileSync(p, t.replace(de, a));
}
parchar('desafio-reglas.js', 'Math.min(18, 3 + (noche - 1) * 2)', 'Math.min(18 + Math.max(0, Math.floor((noche - 9) / 2)), 3 + (noche - 1) * 2)');
parchar('desafio-reglas.js', 'export function multiplicadorNoche(n) { return 1 + Math.max(0, Math.floor(n) - 1) * 0.08; }', 'export function multiplicadorNoche(n) { const k = Math.max(0, Math.floor(n) - 1); return 1 + Math.min(k, 9) * 0.08 + Math.max(0, k - 9) * 0.10; }');
parchar('desafio-vuelta.js', 'return { cantidad: 1 + v * 0.2, vida: 1 + v * 0.25, dano: 1 + v * 0.15 };', 'return { cantidad: 1 + v * 0.12, vida: 1 + v * 0.15, dano: 1 + v * 0.10 };');

const imp = (base, f) => import(pathToFileURL(path.join(base, 'src', f)).href);
const medir = async (base) => {
  const R = await imp(base, 'desafio-reglas.js'), V = await imp(base, 'desafio-vuelta.js');
  const oleada = (n, dif, vuelta = 0) => {
    R.fijarPartidaMeta(null);
    const lista = R.composicionOleada(n, dif, vuelta), mult = R.multiplicadorNoche(n), mv = V.multiplicadorVuelta(vuelta), d = R.dificultad(dif);
    let vida = 0, dano = 0;
    for (const t of lista) { const def = R.TIPOS_ALIEN[t]; vida += def.vida * mult * mv.vida * d.vida; dano += ((def.dano || 0) * mult * mv.dano * d.dano) / Math.max(0.5, def.cadencia || 1); }
    return { cantidad: lista.length, vida: Math.round(vida), dano: Math.round(dano) };
  };
  return { oleada };
};
const hoy = await medir(raiz), nuevo = await medir(tmp);

console.log('# Presión por noche: hoy contra la propuesta (campaña, normal, vuelta 1)\n');
const f = [];
for (let n = 6; n <= 20; n++) { const a = hoy.oleada(n, 'normal'), b = nuevo.oleada(n, 'normal'); f.push({ noche: n, hoy: `${a.cantidad} duendes / vida ${a.vida} / daño a vos ${a.dano}/s`, propuesta: `${b.cantidad} / ${b.vida} / ${b.dano}/s`, cambio: `${Math.round((b.vida / a.vida - 1) * 100)}%` }); }
console.table(f);
const sinJefe = [11, 12, 13, 14, 16, 17, 18, 19];
const crece = (m) => { const a = m.oleada(11, 'normal').vida, b = m.oleada(19, 'normal').vida; return `${Math.round((Math.pow(b / a, 1 / 8) - 1) * 1000) / 10} % por noche`; };
console.log(`Crecimiento de la vida total entre la noche 11 y la 19 (sin jefes): hoy ${crece(hoy)} · propuesta ${crece(nuevo)}`);

console.log('\n# Las vueltas: noche 20, normal\n');
const g = [];
for (const v of [0, 1, 2, 3, 5, 9]) { const a = hoy.oleada(20, 'normal', v), b = nuevo.oleada(20, 'normal', v); g.push({ vuelta: v + 1, hoy: `${a.cantidad} / ${a.vida} / ${a.dano}/s`, propuesta: `${b.cantidad} / ${b.vida} / ${b.dano}/s` }); }
console.table(g);
console.log('(cada celda: duendes / vida total de la oleada / daño por segundo a vos si pegan todos)');
fs.rmSync(tmp, { recursive: true, force: true });
