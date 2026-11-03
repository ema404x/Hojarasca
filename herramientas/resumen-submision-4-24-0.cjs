const fs = require('fs');
const med = (a) => { const o = a.filter(Number.isFinite).sort((x, y) => x - y); const m = Math.floor(o.length / 2); return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };
for (const pref of (process.argv[2] ? [process.argv[2] + '-cg', process.argv[2] + '-sg'] : ['sub-cg', 'sub-sg'])) {
  console.log('===', pref);
  const res = {};
  for (const d of fs.readdirSync('.').filter((x) => x.startsWith(pref + '-'))) {
    const m = /^.+-(base|nuevo)-r(\d+)$/.exec(d); if (!m) continue;
    const f = d + '/auditoria-verano.json'; if (!fs.existsSync(f)) continue;
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const [id, t] of Object.entries(j.tomas)) if (t && t.submision) ((res[id] ||= {})[m[1]] ||= {})[m[2]] = { sin: t.submision.sinSombras, con: t.submision.conSombras, pas: t.submision.pasadaDeSombras, ll: t.conteo.entero.llamadas, cs: t.conteo.conSombras.llamadas };
  }
  for (const id of Object.keys(res).sort()) {
    console.log(id);
    for (const c of ['sin', 'con', 'pas', 'll', 'cs']) {
      const rs = Object.keys({ ...res[id].base, ...res[id].nuevo }).sort();
      const a = rs.map((r) => res[id].base[r]?.[c]), b = rs.map((r) => res[id].nuevo[r]?.[c]);
      const dif = rs.map((r) => (res[id].nuevo[r]?.[c] ?? NaN) - (res[id].base[r]?.[c] ?? NaN)).filter(Number.isFinite);
      console.log(`  ${c.padEnd(4)} base ${a.join(' ')} → ${med(a).toFixed(2)} | nuevo ${b.join(' ')} → ${med(b).toFixed(2)} | dif ${dif.map((x) => (x >= 0 ? '+' : '') + x.toFixed(2)).join(' ')} → med ${med(dif).toFixed(2)} (rango ${Math.min(...dif).toFixed(2)} a ${Math.max(...dif).toFixed(2)})`);
    }
  }
}
