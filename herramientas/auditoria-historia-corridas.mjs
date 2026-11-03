// 4.20.0 (auditoría B): corre la Historia entera N veces con el jugador de mentira de `pruebas/ayuda-4-18-4-historia.mjs` (los módulos reales, elecciones y decisiones al azar)
// y guarda lo que quedó en cada partida (decisiones, lazos, ramal, noche, aliados, optativas, lo raro). Sirve para ver qué combinaciones de decisiones existen de verdad y
// cuántas veces se cumple cada condición del final y de la noche. No cambia el juego.
// Uso: node herramientas/auditoria-historia-corridas.mjs <cuántas> <semilla inicial> <archivo de salida.json>
import fs from 'node:fs';
import { jugar, H } from '../pruebas/ayuda-4-18-4-historia.mjs';
import { aliadosDe } from '../src/historia-noche.js';

const N = Number(process.argv[2] || 20), desde = Number(process.argv[3] || 1);
const salida = process.argv[4] || 'corridas.json';
const out = [];
const t0 = Date.now();
for (let s = desde; s < desde + N; s++) {
  const r = jugar(s);
  const h = r.S.hist();
  out.push({
    sem: s, fin: !!r.fin, atascado: r.atascado, errores: r.errores.length, dec: { ...h.decisiones }, lazos: { ...h.lazos }, ramal: h.ramal, estadoRamal: H.estadoRamal(h),
    noche: h.duendes.noche, trato: h.duendes.trato, intentos: h.duendes.intentos, convidado: h.duendes.convidado, deuda: h.duendes.deuda,
    escenas: Object.keys(h.escenas.vistas).length, optativas: Object.keys(h.optativas || {}).length, raros: (h.raro || []).length,
    aliados: aliadosDe({ lazos: h.lazos, decisiones: h.decisiones, perro: false }), perdon: !!h.duendes.perdon, armas: { ...h.duendes.armas }, prestado: { ...h.prestado },
    vistas: Object.keys(h.escenas.vistas), optHechas: Object.keys(h.optativas || {}),
  });
}
fs.writeFileSync(salida, JSON.stringify(out));
console.log(`${N} corridas en ${Date.now() - t0} ms`);
