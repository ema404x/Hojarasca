// 4.20.0 (A, auditoría de equilibrio y economía): tabla de valores y de conversiones, con los módulos reales del juego.
//   node herramientas/auditoria-4-20-a-valores.mjs
// No cambia el juego: sólo lee los módulos y dice cuánto vale lo que entra y lo que sale en cada cambio (a valor base del mercado:
// `BIENES[k].valor * 100 / lote` pesos la unidad). Un cambio con razón de 2 o más duplica el valor de lo que se pone.
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const CO = await import('../src/comercio.js');
const AL = await import('../src/aldea.js');
const OP = await import('../src/oficios-propios.js');
const CP = await import('../src/cocina-pasos.js');
const FE = await import('../src/feria.js');
const TR = await import('../src/trueque.js');
const TA = await import('../src/tablon.js');
const NP = await import('../src/negocio-propio.js');
const GR = await import('../src/granja.js');

const $ = (v) => '$' + Math.round(v).toLocaleString('es-AR');
const unidad = (k) => (CO.esBien(k) ? (CO.BIENES[k].valor * 100) / CO.BIENES[k].lote : null);
// valor base de varios (si alguno no tiene valor en el mercado, se anota)
const valor = (lista, faltantes) => lista.reduce((s, [k, n]) => { const u = unidad(k); if (u == null) { faltantes.add(k); return s; } return s + u * n; }, 0);

console.log('# Valores y conversiones (módulos reales, a valor base de mercado)\n');

// ---------------------------------------------------------------- 1. lo que cambian los vecinos (aldea.js: SERVICIO)
const S = AL.SERVICIO;
const filas = [];
const F = (quien, da, recibe, tope) => { const falta = new Set(); const e = valor(da, falta), s = valor(recibe, falta); filas.push({ quien, da: da.map(([k, n]) => `${n} ${k}`).join(' + '), recibe: recibe.map(([k, n]) => `${n} ${k}`).join(' + '), pone: Math.round(e), sale: Math.round(s), razon: e > 0 ? Math.round((s / e) * 100) / 100 : null, tope, sinValor: [...falta].join(',') }); };
F('Carpintero (aserrar)', [['tronco', S.troncosPorDia]], [['tabla', S.troncosPorDia * S.tablasPorTronco]], `${S.troncosPorDia} troncos por día`);
F('Pescador', [['tronco', S.troncosPorTruchas]], [['trucha-fresca', S.truchas]], '1 por día');
F('Tejedora (poncho)', [['lana', S.lanaPoncho]], [['poncho', 1]], '1 por día');
F('Apicultor', [['tabla', S.tablasMiel]], [['miel', S.miel]], '1 por día');
F('Panadera (compra)', [], [['pan-casero', S.panes]], '1 por día');
console.log('## 1. Los cambios de los vecinos de la aldea\n');
console.table(filas);
console.log(`Pan: cuesta ${$(S.pesosPorPan)} los ${S.panes} y valen ${$(valor([['pan-casero', S.panes]], new Set()))} a valor base.`);

// ---------------------------------------------------------------- 2. los talleres propios
console.log('\n## 2. Los talleres propios (oficios-propios.js)\n');
const tal = [];
for (const [id, t] of Object.entries(OP.TALLERES)) {
  const falta = new Set();
  const entra = t.entrada.reduce((s, e) => { const u = unidad(e.k); if (u == null) { falta.add(e.k); return s; } return s + u * e.n; }, 0);
  const sale = t.salida.pesos ? t.salida.pesos : (unidad(t.salida.k) || 0) * t.salida.n;
  tal.push({ id, entra: Math.round(entra), sale: Math.round(sale), gananciaPorTanda: Math.round(sale - entra), tandasMax: t.tope, sinValor: [...falta].join(',') });
}
console.table(tal);

// ---------------------------------------------------------------- 3. recetas del horno y del fuego
console.log('\n## 3. Recetas (cocina-pasos.js)\n');
const rec = [];
for (const r of CP.RECETAS_PASOS) {
  const falta = new Set();
  const lista = r.pide.map((p) => [p.k === 'azucar' ? 'azucar' : p.k, p.n]);
  const entra = valor(lista, falta);
  const salida = unidad(r.da.id);
  rec.push({ id: r.id, pide: r.pide.map((p) => `${p.n} ${p.k}`).join(' + '), da: `${r.da.n} ${r.da.id}`, entra: Math.round(entra), valeSalida: salida == null ? 'no se vende' : Math.round(salida * r.da.n), sinValor: [...falta].join(',') });
}
console.table(rec);

// ---------------------------------------------------------------- 4. las ofertas de la feria
console.log('\n## 4. Ofertas de la feria (feria.js): lo que das contra lo que te dan\n');
const fer = [];
for (const o of FE.OFERTAS) {
  const falta = new Set();
  const da = Object.entries(o.pide).map(([k, n]) => [k, n]);
  const entra = valor(da, falta);
  let sale = (o.da.pesos || 0);
  for (const [k, n] of Object.entries(o.da.materiales || {})) sale += (unidad(k) || 0) * n;
  const nocuenta = [...Object.keys(o.da.cuenta || {}), ...(o.da.cosa ? [o.da.cosa] : [])];
  fer.push({ id: o.id, das: da.map(([k, n]) => `${n} ${k}`).join(' + '), entra: Math.round(entra), recibes: sale ? Math.round(sale) : '(' + nocuenta.join(',') + ')', razon: sale && entra ? Math.round((sale / entra) * 100) / 100 : null, sinValor: [...falta].join(',') });
}
console.table(fer);

// ---------------------------------------------------------------- 5. el tablón
console.log('\n## 5. Tablón de encargos: lo que paga contra lo que vale lo pedido\n');
const tab = [];
for (const e of TA.ENCARGOS_TABLON) {
  const pago = TA.pagoDe(e.k, e.n, e.origen), vale = TA.valorUnidad(e.k) * e.n;
  tab.push({ id: e.id, pide: `${e.n} ${e.k}`, vale, pago, razon: Math.round((pago / vale) * 100) / 100, mult: TA.multiplicadorDe(e.origen), dist: TA.distanciaAPlaza(TA.ORIGENES[e.origen]) });
}
console.table(tab);

// ---------------------------------------------------------------- 6. cuánto vale cada bien por unidad, ordenado
console.log('\n## 6. Valor por unidad de cada bien del mercado\n');
console.table(CO.ID_BIENES.map((k) => ({ bien: k, donde: CO.BIENES[k].donde, lote: CO.BIENES[k].lote, porLote: CO.BIENES[k].valor * 100, porUnidad: Math.round(unidad(k)) })).sort((a, b) => b.porUnidad - a.porUnidad));

// ---------------------------------------------------------------- 7. el local propio: lo que se puede vender
console.log('\n## 7. Granja: lo que produce y no se puede vender\n');
console.log('Productos de la granja:', GR.PRODUCTOS_GRANJA.join(', '));
console.log('De ésos, con valor en el mercado (BIENES):', GR.PRODUCTOS_GRANJA.filter((k) => CO.esBien(k)).join(', ') || 'ninguno');
console.log('Mercadería de los dos locales propios:', Object.entries(NP.TIPOS).map(([k, t]) => `${k}: ${t.mercaderia.join(', ')}`).join(' | '));
