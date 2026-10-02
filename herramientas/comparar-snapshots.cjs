// 3.5.4: compara dos heap snapshots (de soak-memoria.cjs o soak-largo.cjs con SNAP) y lista qué
// tipos de objeto crecieron entre uno y otro: cantidad y bytes propios por constructor (o por tipo
// de nodo: string, array, closure...). Lo que crece mucho entre dos momentos de juego parecidos es
// lo que se fuga. Uso: node --max-old-space-size=8192 herramientas/comparar-snapshots.cjs a.heapsnapshot b.heapsnapshot [N]
// Con CADENAS=1 agrega las cadenas más repetidas que aparecieron (sirve para ver qué texto se junta).
const fs = require('fs');
const [, , A, B, N = 30] = process.argv;
if (!A || !B) { console.log('uso: comparar-snapshots.cjs a.heapsnapshot b.heapsnapshot [N]'); process.exit(1); }

function leer(archivo) {
  const s = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const m = s.snapshot.meta, campos = m.node_fields, tipos = m.node_types[0];
  const nf = campos.length, iTipo = campos.indexOf('type'), iNombre = campos.indexOf('name'), iTam = campos.indexOf('self_size');
  const nodos = s.nodes, cadenas = s.strings;
  const grupos = new Map(), textos = new Map();
  for (let i = 0; i < nodos.length; i += nf) {
    const tipo = tipos[nodos[i + iTipo]];
    const nombre = cadenas[nodos[i + iNombre]];
    const clave = tipo === 'object' || tipo === 'closure' || tipo === 'native' ? `${tipo}:${nombre}` : tipo;
    let g = grupos.get(clave); if (!g) grupos.set(clave, g = { n: 0, b: 0 });
    g.n++; g.b += nodos[i + iTam];
    if (process.env.CADENAS && (tipo === 'string' || tipo === 'concatenated string')) { const k = String(nombre).slice(0, 80); textos.set(k, (textos.get(k) || 0) + 1); }
  }
  return { grupos, textos, total: [...grupos.values()].reduce((a, g) => a + g.b, 0) };
}
const a = leer(A), b = leer(B);
console.log(`total: ${(a.total / 1048576).toFixed(1)} MB → ${(b.total / 1048576).toFixed(1)} MB`);
const filas = [];
for (const [k, g] of b.grupos) { const v = a.grupos.get(k) || { n: 0, b: 0 }; filas.push({ k, dn: g.n - v.n, db: g.b - v.b, n: g.n, b: g.b }); }
filas.sort((x, y) => y.db - x.db);
console.log('crecimiento (bytes)        Δcant        Δbytes      cant final  tipo');
for (const f of filas.slice(0, Number(N))) console.log(`${String(f.dn).padStart(26)} ${String((f.db / 1024).toFixed(0) + ' KB').padStart(13)} ${String(f.n).padStart(14)}  ${f.k}`);
if (process.env.CADENAS) {
  const t = [];
  for (const [k, n] of b.textos) { const d = n - (a.textos.get(k) || 0); if (d > 20) t.push([d, k]); }
  t.sort((x, y) => y[0] - x[0]);
  console.log('\ncadenas que más aparecieron:');
  for (const [d, k] of t.slice(0, 25)) console.log(`${String(d).padStart(8)}  ${JSON.stringify(k)}`);
}
