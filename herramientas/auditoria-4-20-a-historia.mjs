// 4.20.0 (A): lo que la Historia le pide a la economía (materiales y pesos de lo obligatorio) y cuánto cuesta en el mercado.
//   node herramientas/auditoria-4-20-a-historia.mjs
// Lee los capítulos de historia.js y los planos de construccion.js; las obras obligatorias salen de los objetivos («Armá…», «Construí…», «Levantá…»).
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const C = await import('../src/construccion.js');
const CO = await import('../src/comercio.js');
const H = await import('../src/historia.js');
const DA = await import('../src/historia-disparadores-acto3.js');
const OP = await import('../src/historia-optativas.js');

const v = (k) => CO.BIENES[k].valor * 100 / CO.BIENES[k].lote;
// las obras que piden los objetivos obligatorios (a mano, leyendo los textos de historia.js: banco de carpintero, mesa de campo con dos sillas, molino de agua, galpón, estufa)
const OBRAS = [['llave', 'alero (E en el alero: 4 tablas)', { tabla: 4 }], ['llave', 'fuego (ramitas)', {}],
  ['bolsa', 'hacha del almacén (trueque: 2 cantos y 8 ramitas)', {}], ['bolsa', 'banco-carpintero', null], ['bolsa', 'alero: cuatro tablas', { tabla: 4 }],
  ['mesa', 'mesa-campo', null], ['mesa', 'silla-campo x2', null], ['rueda', 'molino-agua', null], ['cosecha', 'galponcito', null],
  ['frios', 'leña: 6 troncos', { tronco: 6 }], ['frios', 'estufa-hierro', null], ['arco', 'tablas para Tito (si se taló el coihue)', { tabla: 2 }], ['arco', 'deuda del trato (6 tablas)', { tabla: 6 }]];
const tot = {};
const filas = [];
for (const [cap, que, extra] of OBRAS) {
  let mat = extra;
  if (mat === null) { const id = que.replace(/ x2$/, ''); const p = C.PLANOS.find((x) => x.id === id); mat = {}; for (const e of p.etapas) for (const [k, n] of Object.entries(e.pide || {})) mat[k] = (mat[k] || 0) + n * (/ x2$/.test(que) ? 2 : 1); }
  const valor = Object.entries(mat).reduce((s, [k, n]) => s + v(k) * n, 0);
  for (const [k, n] of Object.entries(mat)) tot[k] = (tot[k] || 0) + n;
  filas.push({ capitulo: cap, que, materiales: Object.entries(mat).map(([k, n]) => `${n} ${k}`).join(' + ') || '(nada)', valorBase: Math.round(valor) });
}
console.log('# Lo que piden los objetivos obligatorios de la Historia (materiales)\n');
console.table(filas);
const suma = Object.entries(tot).reduce((s, [k, n]) => s + v(k) * n, 0);
console.log('Total:', Object.entries(tot).map(([k, n]) => `${n} ${k}`).join(', '), '· a valor base:', Math.round(suma), 'pesos');
console.log('\n# Pesos que pide la Historia\n');
console.log('Puntas de flecha de Anselmo (Acto III):', DA.PRECIO_PUNTAS, '· Tito por las seis tablas (optativa, ENTRA plata):', OP.PRECIO_TABLAS_TITO, '· premio de la majada si se vende (D5 c): 3000 (entra)');
console.log('Pesos que entran por premios de la Historia: $3000 (majada, sólo si se elige c) + $900 (Tito)');
console.log('\n# Premios de los capítulos en materiales (el resto son cosas, yerba y cuenta)\n');
console.table(H.CAPITULOS.map((c) => ({ capitulo: c.id, premio: c.premio?.texto?.slice(0, 90) || '', materiales: JSON.stringify(c.premio?.materiales || {}), cuenta: JSON.stringify(c.premio?.cuenta || {}) })));
