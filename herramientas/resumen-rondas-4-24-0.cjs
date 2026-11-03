// 4.24.0 (C): (suma las llamadas con la pasada de sombras, y la CPU del cuadro con las sombras rehechas en cada cuadro: AUD_SOMBRAS=1) junta las rondas alternadas de la auditoría (carpetas <prefijo>-base-r<n> y <prefijo>-nuevo-r<n>, cada una con auditoria-verano.json) y muestra, por encuadre, la CPU
// (sin lastre), la placa (con lastre), las llamadas de dibujo y los ms de gente (npc/perro) y de dibujo (render) de cada ronda, la mediana por versión y la diferencia
// nuevo − base ronda por ronda (con su rango: el ruido entre tandas es de ±2 ms, por eso se miran las rondas de a pares).
// Uso: node herramientas/resumen-rondas-4-24-0.cjs <carpeta> <prefijo> [versionA=base] [versionB=nuevo]
const fs = require('fs');
const path = require('path');
const [dir, prefijo, A = 'base', B = 'nuevo'] = process.argv.slice(2);
if (!dir || !prefijo) { console.log('uso: node herramientas/resumen-rondas-4-24-0.cjs <carpeta> <prefijo> [base] [nuevo]'); process.exit(1); }
const med = (a) => { const o = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y); if (!o.length) return NaN; const m = Math.floor(o.length / 2); return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '  - ');
const sub = (t, n) => (t.subsistemas || []).find((s) => s.nombre === n)?.ms;
const res = {};
for (const carpeta of fs.readdirSync(dir).filter((d) => d.startsWith(prefijo + '-')).sort()) {
  const m = /^.+-(.+)-r(\d+)$/.exec(carpeta);
  if (!m) continue;
  const [, v, r] = m;
  const archivo = path.join(dir, carpeta, 'auditoria-verano.json');
  if (!fs.existsSync(archivo)) continue;
  const j = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  for (const [id, t] of Object.entries(j.tomas)) {
    if (!t || !t.medidaLibre || !t.medida) continue;
    (((res[id] ||= {})[v] ||= {})[r] = { cpu: t.medidaLibre.cpu.p50, cpuMedia: t.medidaLibre.cpu.media, placa: t.medida.gpu.p50, llamadas: t.conteo.entero.llamadas, gente: sub(t, 'npc/perro'), fauna: sub(t, 'fauna'), render: sub(t, 'render'), conSombras: t.conteo.conSombras.llamadas, sombraCpu: t.sombrasCada && t.sombrasCada['rehacer-sombras'] ? t.sombrasCada['rehacer-sombras'].cpu - t.sombrasCada.completo.cpu : NaN, subSin: t.submision ? t.submision.sinSombras : NaN, subCon: t.submision ? t.submision.conSombras : NaN, subPasada: t.submision ? t.submision.pasadaDeSombras : NaN, cpuSinGente: t.medidaLibre.cpu.p50 - (sub(t, 'npc/perro') || 0), cpuRehecho: t.sombrasCada && t.sombrasCada['rehacer-sombras'] ? t.sombrasCada['rehacer-sombras'].cpu : NaN });
  }
}
for (const id of Object.keys(res).sort()) {
  console.log(id);
  for (const campo of ['cpu', 'cpuMedia', 'placa', 'llamadas', 'cpuSinGente', 'subSin', 'subCon', 'subPasada', 'conSombras', 'cpuRehecho', 'sombraCpu', 'gente', 'fauna', 'render']) {
    const a = res[id][A] || {}, b = res[id][B] || {};
    const rondas = Object.keys({ ...a, ...b }).sort();
    const da = rondas.map((r) => a[r]?.[campo]), db = rondas.map((r) => b[r]?.[campo]);
    const dif = rondas.map((r) => (b[r]?.[campo] ?? NaN) - (a[r]?.[campo] ?? NaN)).filter(Number.isFinite);
    console.log(`  ${campo.padEnd(8)} ${A}: ${da.map(f2).join(' ')} → med ${f2(med(da))} | ${B}: ${db.map(f2).join(' ')} → med ${f2(med(db))} | dif por ronda: ${dif.map((x) => (x >= 0 ? '+' : '') + x.toFixed(2)).join(' ')} → med ${f2(med(dif))} (rango ${f2(Math.min(...dif))} a ${f2(Math.max(...dif))})`);
  }
}
