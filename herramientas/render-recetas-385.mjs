// 3.8.5: renderiza las recetas puras (la risa de los duendes y el piano de misterio) a WAV, sin Electron,
// para ir y venir rápido mientras se ajustan. Lo que suena en el juego (con la lejanía, el bus y la
// reverberación) lo renderiza `pruebas/render-sonidos.cjs`.
// Uso: node herramientas/render-recetas-385.mjs <carpeta> [risa|piano|todo]
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const { planRisa, sintetizarRisa, CLASES_RISA, VARIANTES_RISA, semillaRisa, TASA_RISA } = await imp('risa-duende.js');
const { completar } = await imp('sonido-sintesis.js');
let piano = null;
try { piano = await imp('piano-misterio.js'); } catch { piano = null; }

const [salidaArg, que = 'todo'] = process.argv.slice(2);
const salida = path.resolve(salidaArg || 'pruebas/salidas/recetas-385');
fs.mkdirSync(salida, { recursive: true });

function wav(canales, tasa) {
  const c = canales.length, n = canales[0].length, b = Buffer.alloc(44 + n * 2 * c);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2 * c, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(c, 22); b.writeUInt32LE(tasa, 24);
  b.writeUInt32LE(tasa * 2 * c, 28); b.writeUInt16LE(2 * c, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2 * c, 40);
  for (let i = 0; i < n; i++) for (let k = 0; k < c; k++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, canales[k][i])) * 32767), 44 + (i * c + k) * 2);
  return b;
}

if (que === 'risa' || que === 'todo') {
  for (const clase of Object.keys(CLASES_RISA)) {
    for (let k = 0; k < VARIANTES_RISA; k++) {
      const plan = planRisa(clase, semillaRisa(clase, k));
      const t0 = performance.now();
      const d = completar(sintetizarRisa(plan, TASA_RISA));
      const ms = performance.now() - t0;
      fs.writeFileSync(path.join(salida, `risa-${clase}-${k + 1}.wav`), wav([d], TASA_RISA));
      console.log(`risa-${clase}-${k + 1}: ${plan.dur.toFixed(2)} s, «${plan.vocal}», ${plan.silabas.length} sílabas${plan.gorjeo ? ' + gorjeo' : ''}${plan.resoplido ? ' + resoplido' : ''}, tono ${Math.round(plan.base)} Hz, ${ms.toFixed(0)} ms de cálculo`);
    }
  }
}
if (piano && (que === 'piano' || que === 'todo')) {
  for (let k = 0; k < piano.FRASES_PIANO.length; k++) {
    const t0 = performance.now();
    const plan = piano.planPiano(k);
    const [L, R] = completar(piano.sintetizarPiano(plan, piano.TASA_PIANO));
    fs.writeFileSync(path.join(salida, `piano-${piano.FRASES_PIANO[k].id}.wav`), wav([L, R], piano.TASA_PIANO));
    console.log(`piano-${piano.FRASES_PIANO[k].id}: ${plan.dur.toFixed(2)} s, ${plan.notas.length} notas, ${(performance.now() - t0).toFixed(0)} ms de cálculo`);
  }
}
