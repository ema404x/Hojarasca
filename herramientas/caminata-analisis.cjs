// 4.3.1: el análisis de lo que anota medir-caminata.cjs (cuadros lentos, p95/p99 y qué sistema se los llevó).
function q(arr, f) { if (!arr.length) return 0; const o = Float64Array.from(arr).sort(); return +o[Math.min(o.length - 1, Math.floor(o.length * f))].toFixed(2); }
function resumir(d) {
  const n = d.n, cuenta = (arr, lim) => { let c = 0; for (let i = 1; i < arr.length; i++) if (arr[i] > lim) c++; return c; };
  const cpu = d.cpu.slice(1), it = d.int.slice(1);
  const m = Math.max(1, cpu.length);
  return {
    n,
    cpu: { mas167: cuenta(d.cpu, 16.7), mas25: cuenta(d.cpu, 25), mas50: cuenta(d.cpu, 50), pct167: +(100 * cuenta(d.cpu, 16.7) / m).toFixed(2), p50: q(cpu, 0.5), p95: q(cpu, 0.95), p99: q(cpu, 0.99), max: Math.max(...cpu) },
    int: { mas20: cuenta(d.int, 20), mas25: cuenta(d.int, 25), mas50: cuenta(d.int, 50), pct20: +(100 * cuenta(d.int, 20) / m).toFixed(2), p50: q(it, 0.5), p95: q(it, 0.95), p99: q(it, 0.99), max: Math.max(...it) },
  };
}
// ¿qué sistema concentra los cuadros lentos? (por el costo de CPU del cuadro; cada cuadro lento se atribuye al componente que más pesó)
function atribuir(d, lim = 25) {
  const comp = (i) => { const soto = d.soto[i], ren = Math.max(0, d.ren[i] - soto);
    const c = { vegetacion: d.veg[i], objetos: d.obj[i], pasto: d.pasto[i], 'bloques-soto': soto, 'dibujo(resto)': ren, ambiente: d.amb[i], clima: d.cli[i], fauna: d.fau[i], 'gente/perro': d.npc[i], desafio: d.des[i] };
    const suma = Object.values(c).reduce((s, v) => s + v, 0); c.otros = Math.max(0, d.cpu[i] - suma); return c; };
  const por = {}, lentos = [];
  for (let i = 1; i < d.n; i++) if (d.cpu[i] > lim) {
    const c = comp(i); let mk = 'otros', mv = -1; for (const k in c) if (c[k] > mv) { mv = c[k]; mk = k; }
    por[mk] = (por[mk] || 0) + 1;
    lentos.push({ i, seg: +((d.t[i] - d.t[0]) / 1000).toFixed(2), cpu: d.cpu[i], int: d.int[i], dom: mk, ms: +mv.toFixed(1), prog: d.prog[i], geo: d.geo[i], tex: d.tex[i], gc: d.gc[i], veg: d.veg[i], soto: d.soto[i], x: d.x[i], z: d.z[i] });
  }
  return { por, lentos };
}
function tabla(r) {
  const filas = [];
  const agr = {};
  for (const c of r.corridas) (agr[c.ruta] = agr[c.ruta] || []).push(c);
  filas.push('ruta           cuadros  cpu>16,7  >25  >50   cpu p50 p95  p99   max | intervalo>20  >25  >50   p95   p99 | sistema de los >25 ms');
  for (const id in agr) {
    const cs = agr[id]; const suma = (f) => cs.reduce((s, c) => s + f(resumir(c)), 0);
    const n = suma((s) => s.n), m167 = suma((s) => s.cpu.mas167), m25 = suma((s) => s.cpu.mas25), m50 = suma((s) => s.cpu.mas50), i20 = suma((s) => s.int.mas20), i25 = suma((s) => s.int.mas25), i50 = suma((s) => s.int.mas50);
    const sx = resumir(cs[0]); const por = {}; for (const c of cs) { const a = atribuir(c).por; for (const k in a) por[k] = (por[k] || 0) + a[k]; }
    const todos = cs.flatMap((c) => c.cpu.slice(1)), todosI = cs.flatMap((c) => c.int.slice(1));
    filas.push(`${id.padEnd(14)} ${String(n).padStart(6)}  ${String(m167).padStart(4)} (${(100 * m167 / Math.max(1, n)).toFixed(1)} %) ${String(m25).padStart(4)} ${String(m50).padStart(4)}   ${String(q(todos, 0.5)).padStart(5)} ${String(q(todos, 0.95)).padStart(5)} ${String(q(todos, 0.99)).padStart(5)} ${String(sx.cpu.max.toFixed(0)).padStart(5)} | ${String(i20).padStart(5)} (${(100 * i20 / Math.max(1, n)).toFixed(1)} %) ${String(i25).padStart(4)} ${String(i50).padStart(4)} ${String(q(todosI, 0.95)).padStart(5)} ${String(q(todosI, 0.99)).padStart(5)} | ${Object.entries(por).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', ') || '-'}`);
  }
  return filas.join('\n');
}
module.exports = { resumir, atribuir, tabla, q };
