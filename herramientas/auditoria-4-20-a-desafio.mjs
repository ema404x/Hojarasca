// 4.20.0 (A): cómo escala «La noche de los duendes» (el Desafío), con las reglas reales de desafio-reglas.js.
//   node herramientas/auditoria-4-20-a-desafio.mjs
// Mide, noche por noche (1 a 20), por dificultad y por modo: cuántos duendes vienen, cuánta vida junta toda la oleada (con el multiplicador de la
// noche, de la dificultad y de la vuelta), cuánto daño a las obras puede hacer por segundo y cuántas semillas doradas (cristales) suelta. Y de
// la otra punta: cuánto cuestan en cristales todas las cosas que se pueden comprar (para ver cuándo sobran).
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const R = await import('../src/desafio-reglas.js');
const V = await import('../src/desafio-vuelta.js');
const ME = await import('../src/desafio-meta.js');
const C = await import('../src/construccion.js');

const f1 = (n) => Math.round(n * 10) / 10;
const prom = (a) => (a[0] + a[1]) / 2;

// ---------------------------------------------------------------- 1. la presión de cada noche
function oleada(n, dif, vuelta = 0, meta = null) {
  R.fijarPartidaMeta(meta);
  const lista = R.composicionOleada(n, dif, vuelta);
  const mult = R.multiplicadorNoche(n), mv = V.multiplicadorVuelta(vuelta), d = R.dificultad(dif);
  let vida = 0, danoObra = 0, cristales = 0, danoMano = 0;
  const por = {};
  for (const t of lista) {
    const def = R.TIPOS_ALIEN[t];
    por[t] = (por[t] || 0) + 1;
    vida += def.vida * mult * mv.vida * d.vida;
    // daño a obras por segundo si todos atacan a la vez (danoObra por golpe / cadencia en segundos)
    danoObra += ((def.danoObra || 0) * mult * mv.dano) / Math.max(0.5, def.cadencia || 1);
    danoMano += ((def.dano || 0) * mult * mv.dano * d.dano) / Math.max(0.5, def.cadencia || 1);
    cristales += prom(def.cristales || [0, 0]);
  }
  return { n, cantidad: lista.length, vida: Math.round(vida), danoObraPorSeg: Math.round(danoObra), danoAVosPorSeg: Math.round(danoMano), cristales: f1(cristales), por, jefe: lista.includes('jefe') };
}
console.log('# La presión por noche (campaña, dificultad normal)\n');
const filas = [];
let ant = null;
for (let n = 1; n <= 20; n++) {
  const o = oleada(n, 'normal');
  filas.push({ noche: n, duendes: o.cantidad, vidaTotal: o.vida, crecVida: ant ? `${Math.round((o.vida / ant.vida - 1) * 100)}%` : '-', danoObraSeg: o.danoObraPorSeg, danoAVosSeg: o.danoAVosPorSeg, cristalesEsp: o.cristales, mult: f1(R.multiplicadorNoche(n) * 100) / 100, tipos: Object.entries(o.por).map(([k, v]) => `${k[0]}${v}`).join(' '), jefe: o.jefe ? 'SÍ' : '' });
  ant = o;
}
console.table(filas);

console.log('\n# Noche 5, 10, 15 y 20 por dificultad y modo (vida total de la oleada)\n');
const f2 = [];
for (const [dif, meta] of [['tranquila', null], ['normal', null], ['implacable', null], ['normal', { modo: 'pesadilla', ventajas: [], reglas: [] }], ['implacable', { modo: 'pesadilla', ventajas: [], reglas: [] }], ['normal', { modo: 'corta', ventajas: [], reglas: [] }]]) {
  const fila = { dificultad: dif, modo: meta?.modo || 'campaña' };
  for (const n of [1, 3, 5, 7, 10, 15, 20]) { const o = oleada(n, dif, 0, meta); fila[`n${n}`] = `${o.cantidad}/${o.vida}`; }
  f2.push(fila);
}
R.fijarPartidaMeta(null);
console.table(f2);
console.log('(cada celda: duendes / vida total de la oleada)');

console.log('\n# Las vueltas (Otra vuelta): noche 10 y 20, normal\n');
const f3 = [];
for (const v of [0, 1, 2, 3, 5, 9]) { const a = oleada(10, 'normal', v), b = oleada(20, 'normal', v); f3.push({ vuelta: v + 1, n10: `${a.cantidad} / ${a.vida}`, n20: `${b.cantidad} / ${b.vida}`, danoObraSeg_n20: b.danoObraPorSeg, danoAVosSeg_n20: b.danoAVosPorSeg }); }
console.table(f3);

// ---------------------------------------------------------------- 2. lo que se puede comprar con cristales
console.log('\n# Qué se compra con semillas doradas (cristal) y cuánto\n');
const todas = R.RECETAS.filter((r) => r.pide && r.pide.cristal);
let unicas = 0, repetibles = 0;
const lista = [];
for (const r of todas) { lista.push({ id: r.id, cat: r.cat, cristal: r.pide.cristal, unica: !!r.unica }); if (r.unica) unicas += r.pide.cristal; else repetibles += r.pide.cristal; }
console.table(lista);
console.log(`Recetas con cristal: ${todas.length} · únicas: ${unicas} cristales en total · repetibles (una vez cada una): ${repetibles}`);
const planosCristal = C.PLANOS.filter((p) => p.etapas?.some((e) => e.pide?.cristal));
let planoTotal = 0;
const lp = planosCristal.map((p) => { const c = p.etapas.reduce((s, e) => s + (e.pide?.cristal || 0), 0); planoTotal += c; return { plano: p.id, cristal: c }; });
console.table(lp);
console.log(`Planos con cristal: ${planosCristal.length} · ${planoTotal} cristales (cada uno se puede levantar más de una vez)`);

// la oferta: cuántos cristales sueltan las oleadas acumuladas (si matás a todos)
let acum = 0;
const f5 = [];
for (let n = 1; n <= 20; n++) { acum += oleada(n, 'normal').cristales; if ([1, 3, 5, 7, 10, 15, 20].includes(n)) f5.push({ nocheHasta: n, cristalesSueltosAcumulados: Math.round(acum) }); }
console.table(f5);
console.log(`Gasto de una vez de todo lo único: ${unicas} + ${repetibles}; la cuenta cierra hacia la noche donde lo acumulado pasa de ${unicas + repetibles}.`);

// ---------------------------------------------------------------- 3. las obras contra lo que les pega
console.log('\n# Cuánto aguanta cada defensa y en cuánto la rompe un grupo (daño a obras por segundo de la oleada de la noche 10, normal, 1/3 de los duendes pegándole)\n');
const o10 = oleada(10, 'normal');
const COSTO = { tronco: 150, tabla: 100, piedra: 100, cristal: 800 };
const f6 = [];
for (const id of ['estacas', 'empalizada', 'porton-empalizada', 'muro-piedra', 'pirca-campo', 'empalizada-reforzada', 'muro-almenado', 'torre-vigia', 'zanja-fuego', 'trampa-lazo']) {
  const p = C.PLANOS.find((x) => x.id === id);
  if (!p) continue;
  const vida = R.vidaMaxObra(p);
  const mat = p.etapas.reduce((s, e) => s + Object.entries(e.pide || {}).reduce((q, [k, n]) => q + (COSTO[k] || 0) * n, 0), 0);
  const seg = vida / Math.max(1, o10.danoObraPorSeg / 3);
  f6.push({ obra: id, vida, materialesPesos: mat, vidaPorMil: Math.round((vida / Math.max(1, mat)) * 1000), segundosQueAguanta: Math.round(seg) });
}
console.table(f6);
console.log('(la oleada de la noche 10 normal hace ' + o10.danoObraPorSeg + ' de daño a obras por segundo si pegan todos; acá se cuenta un tercio)');
