// Fase 7 de la economía (ver PLAN_ECONOMIA.md): cuánto rinde cada ingreso con las reglas de verdad (trabajos, pedidos, abastecimiento,
// alquiler, puesto, mercado) y cuántos días lleva comprar cada casa. Un jugador goloso hace TODO lo que el juego le deja cada día.
//   node herramientas/simulador-negocios.mjs [días]
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const E = await import('../src/economia.js');
const N = await import('../src/negocios.js');
const T = await import('../src/trabajos.js');
const P = await import('../src/pedidos.js');
const V = await import('../src/aldea-viva.js');
const B = await import('../src/prestamos.js');
const R = await import('../src/propiedad.js');
const C = await import('../src/comercio.js');
const NF = await import('../src/negocios-fx.js');

const DIAS = Number(process.argv[2]) || 240;
const $ = (v) => '$' + Math.round(v).toLocaleString('es-AR');
const claves = Object.keys(T.TRABAJOS);

function jugar({ jornales = true, pedidos = true, abasto = true, compraCaro = 1.05 } = {}) {
  const p = { modo: 'relax', dia: 1, horas: 12, cosas: {}, materiales: {}, entradas: {}, economia: E.economiaNueva() };
  const por = { jornales: 0, pedidos: 0, abasto: 0 };
  const dar = (bien, cant) => { const b = C.BIENES[bien]; if (b.donde === "material") p.materiales[bien] = cant; else if (b.donde === "entrada") p.entradas[bien] = { dia: 1, hora: 1, cantidad: cant }; else p.cosas[bien] = cant; };
  for (let d = 1; d <= DIAS; d++) {
    p.dia = d;
    const temp = NF.temporadaDelDia(d);
    V.cerrarCuentas(p, d, claves, temp);
    const dem = V.demandaDe(d, temp);
    const antes = () => E.pesosDe(p);
    if (pedidos) for (const k of claves) {
      const q = P.pedidoDe(p, k, d);
      if (!q) continue;
      const costo = Math.ceil((q.n / C.BIENES[q.k].lote) * C.BIENES[q.k].valor * compraCaro * 100);
      if (q.premio <= costo) continue;                       // sólo si conviene comprar la mercadería en un puesto
      const r = P.cerrarPedido(p, k, d, 'x', true);   // (la mercadería se compra en un puesto al `compraCaro` del valor: la ganancia es premio − costo)
      if (r.ok) por.pedidos += r.premio - costo;
    }
    if (abasto) {
      const a = B.abastoDe(p, d);
      if (a) { const costo = Math.ceil((a.n / C.BIENES[a.k].lote) * C.BIENES[a.k].valor * compraCaro * 100); if (a.premio > costo) { dar(a.k, a.n); const r = B.cumplirAbasto(p, d); if (r.ok) por.abasto += r.premio - costo; } }
    }
    if (jornales) for (const k of claves) { const a = antes(); const r = T.cumplirJornal(p, k, d, 'x', dem); if (r.ok) por.jornales += E.pesosDe(p) - a; }
  }
  return { p, por, total: por.jornales + por.pedidos + por.abasto };
}
console.log(`# Rendimiento de cada ingreso en ${DIAS} días (jugador goloso)\n`);
for (const [nombre, o] of [['sólo jornales', { pedidos: false, abasto: false }], ['sólo pedidos', { jornales: false, abasto: false }], ['sólo abastecimiento', { jornales: false, pedidos: false }], ['todo junto', {}]]) {
  const { por, total } = jugar(o);
  console.log(`- ${nombre}: ${$(total / DIAS)} por día (jornales ${$(por.jornales / DIAS)}, pedidos ${$(por.pedidos / DIAS)}, abastecimiento ${$(por.abasto / DIAS)})`);
}
const dia = jugar({}).total / DIAS;
console.log('\n# Días para comprar cada casa (precio por etapas + materiales) con ese ritmo\n');
const MATERIALES = { 'cabana-piedra': 11500, 'casa-galeria': 18150, casona: 27300 };
for (const id of Object.keys(R.PROPIEDAD.casas)) {
  const total = R.precioCasa(id) + MATERIALES[id];
  console.log(`- ${id}: ${$(R.precioCasa(id))} de terreno y mano de obra + ${$(MATERIALES[id])} de materiales = ${$(total)} → ${(total / dia).toFixed(0)} días (${(total / dia / 12).toFixed(1)} años del juego)`);
}
console.log('\n# Retorno del alquiler\n');
for (const id of Object.keys(R.PROPIEDAD.casas)) console.log(`- ${id}: ${$(R.rentaDe(id))} por día × ocupación ${R.PROPIEDAD.ocupacion} → se paga sola en ${(R.precioCasa(id) / (R.rentaDe(id) * R.PROPIEDAD.ocupacion)).toFixed(0)} días`);
console.log('\n# El préstamo máximo a un año (12 días) cuesta\n');
for (const t of B.BANCO.topes) console.log(`- ${$(t)} → devolvés ${$(B.costoEstimado(t, 12))} (${$(B.costoEstimado(t, 12) - t)} de interés)`);
