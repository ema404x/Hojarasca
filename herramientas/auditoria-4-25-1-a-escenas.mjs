// 4.25.1 (A): recorre TODAS las escenas de la Historia con el director de verdad y la gente de verdad, con muchas semillas (la gente de partida en
// cualquier lado y estado, el jugador eligiendo al azar, algunas corridas saltadas con Esc Esc), y cuenta lo que se traba.
// Uso: node herramientas/auditoria-4-25-1-a-escenas.mjs [semillas por escena] [semilla inicial]
import { crearBanco, correrEscena } from '../pruebas/ayuda-4-25-1-a.mjs';
const N = Number(process.argv[2] || 6), desde = Number(process.argv[3] || 1);
const b = await crearBanco();
const ids = Object.keys(b.ESC);
const resumen = { escenas: ids.length, corridas: 0, noTermina: [], forzadas: {}, lentas: [], diferencias: {}, tareaFuera: {}, fallos: {}, pegadas: [] };
const t0 = Date.now();
for (const id of ids) {
  for (let s = desde; s < desde + N; s++) {
    const saltar = s % 3 === 0 ? 2 + (s % 7) * 4 : undefined;
    const r = correrEscena(b, id, { semilla: s * 131 + ids.indexOf(id), saltarEn: saltar });
    resumen.corridas++;
    if (!r.ok) { resumen.noTermina.push(`${id}: no se pudo disparar`); continue; }
    if (!r.termino) resumen.noTermina.push(`${id}#${s}: no termina (t=${Math.round(r.t)})`);
    for (const f of r.forzadas) { const k = `${id}/${f.k}${f.enAgua ? ' (meta en el agua)' : ''}`; (resumen.forzadas[k] ||= []).push(Math.round(f.resta)); }
    if (r.t > 150 && saltar === undefined) resumen.lentas.push(`${id}#${s}: ${Math.round(r.t)} s`);
    for (const d of r.diferencias) { const k = `${d.c}:${d.k}`; (resumen.diferencias[k] ||= new Set()).add(id); }
    for (const d of r.tareaFuera) { const k = `${d.k}`; (resumen.tareaFuera[k] ||= new Set()).add(id); }
    for (const f of r.fallos) (resumen.fallos[f] ||= new Set()).add(id);
    if (r.enEscenaPegada.length || r.quietudPegada.length || r.nanPos.length) resumen.pegadas.push(`${id}#${s}: enEscena=${r.enEscenaPegada} quietud=${r.quietudPegada} nan=${r.nanPos}`);
  }
}
const fmt = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v instanceof Set ? [...v] : v]));
console.log(JSON.stringify({ ...resumen, diferencias: fmt(resumen.diferencias), tareaFuera: fmt(resumen.tareaFuera), fallos: fmt(resumen.fallos), ms: Date.now() - t0 }, null, 1));
