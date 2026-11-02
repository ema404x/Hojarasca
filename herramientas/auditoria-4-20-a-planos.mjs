// 4.20.0 (A): los precios de las obras contra su propia regla (PRECIOS_CONSTRUCCION.md: «pesos entre 1 y 4 veces lo que valen los materiales», nada barato lleva
// pesos, nada pasa de $80.000) y contra lo que rinden (los talleres). Lee los planos y sus precios reales (obra-pesos.js).
//   node herramientas/auditoria-4-20-a-planos.mjs
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const C = await import('../src/construccion.js');
const OP = await import('../src/obra-pesos.js');
const CO = await import('../src/comercio.js');
const PR = await import('../src/propiedad.js');
const v = (k) => CO.BIENES[k].valor * 100 / CO.BIENES[k].lote;
const filas = [];
for (const p of C.PLANOS) {
  const pesos = OP.preciosDePlano(p).reduce((a, b) => a + b, 0);
  const mat = p.etapas.reduce((s, e) => s + Object.entries(e.pide || {}).reduce((q, [k, n]) => q + v(k) * n, 0), 0);
  filas.push({ id: p.id, cat: p.categoria, pesos, mat: Math.round(mat), razon: pesos && mat ? +(pesos / mat).toFixed(1) : null });
}
const con = filas.filter((f) => f.pesos > 0);
console.log('# Obras con pesos que se pasan de 4 veces los materiales (la regla del documento)\n');
console.table(con.filter((f) => f.razon > 4).sort((a, b) => b.razon - a.razon));
console.log(`Sobre ${con.length} obras con pesos, ${con.filter((f) => f.razon > 4).length} pasan de 4 veces, ${con.filter((f) => f.razon < 1).length} están por debajo de 1 vez, la mediana es ${con.map((f) => f.razon).sort((a, b) => a - b)[Math.floor(con.length / 2)]}.`);
console.log('Con pesos de menos de $800 (regla 4: nada barato lleva pesos):', con.filter((f) => f.pesos < 800).map((f) => `${f.id} $${f.pesos}`).join(', ') || 'ninguna');
console.log('Las tres casas:', Object.entries(PR.PROPIEDAD.casas).map(([k, c]) => `${k} $${c.total}`).join(' · '), '· las obras con pesos más caras que la cabaña ($36.000):', con.filter((f) => f.pesos > 36000).map((f) => f.id).join(', '));
console.log('\n# Qué obras sin pesos hay (cuántas) por categoría\n');
const por = {};
for (const f of filas.filter((x) => !x.pesos)) por[f.cat] = (por[f.cat] || 0) + 1;
console.log(por);
console.log('\n# Valor de los materiales de las obras sin pesos más caras\n');
console.table(filas.filter((f) => !f.pesos).sort((a, b) => b.mat - a.mat).slice(0, 8));
