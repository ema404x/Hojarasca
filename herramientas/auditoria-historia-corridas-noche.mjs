// 4.20.0 (auditoría B): igual que auditoria-historia-corridas.mjs pero con una copia de src/ donde `revisarNoche` anota los lazos y las decisiones en el momento en que la noche
// queda pendiente (justo antes de la nevada): así se ve quién está de aliado de verdad esa noche y no al final del capítulo 13.
// Uso: A4184_SRC=<copia de src con la mutación> node herramientas/auditoria-historia-corridas-noche.mjs <cuántas> <semilla inicial> <salida.json>
import fs from 'node:fs';
import { jugar } from '../pruebas/ayuda-4-18-4-historia.mjs';
import { aliadosDe } from '../src/historia-noche.js';
const N = Number(process.argv[2] || 20), desde = Number(process.argv[3] || 1);
const out = [];
for (let s = desde; s < desde + N; s++) {
  globalThis.__snap = [];
  const r = jugar(s);
  const sn = globalThis.__snap[0];
  if (!sn) { out.push({ sem: s, sin: true, fin: !!r.fin }); continue; }
  out.push({ sem: s, fin: !!r.fin, dec: sn.decisiones, lazos: sn.lazos, aliados: aliadosDe({ lazos: sn.lazos, decisiones: sn.decisiones, perro: false }) });
}
fs.writeFileSync(process.argv[4] || 'corridas-noche.json', JSON.stringify(out));
console.log(`${N} corridas`);
