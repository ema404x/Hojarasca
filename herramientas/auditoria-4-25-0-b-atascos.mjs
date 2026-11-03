// 4.25.0 (B): corre la Historia entera con el jugador de mentira en muchas semillas y cuenta atascos y errores.
// Uso: node herramientas/auditoria-4-25-0-b-atascos.mjs <cuántas> <semilla inicial> [tope de pasos por capítulo]   (PACIENTE=1: el jugador que va a donde la historia lo espera)
import { jugar } from '../pruebas/ayuda-4-18-4-historia.mjs';
const N = Number(process.argv[2] || 40), desde = Number(process.argv[3] || 1), tope = Number(process.argv[4] || 9000);
const t0 = Date.now();
let fin = 0, atascos = [], conErrores = [];
for (let s = desde; s < desde + N; s++) {
  const r = jugar(s, { tope, paciente: process.env.PACIENTE === '1' ? {} : undefined });
  if (r.fin) fin++;
  if (r.atascado) atascos.push({ semilla: s, ...r.atascado });
  if (r.errores.length) conErrores.push({ semilla: s, errores: [...new Set(r.errores)].slice(0, 5) });
}
console.log(JSON.stringify({ corridas: N, desde, fin, atascos, conErrores, ms: Date.now() - t0 }, null, 1));
