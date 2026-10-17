// 4.0.3: obras (II-1 de la zona I). Pagás la primera etapa de una casa (terreno y mano de obra), deshacés la etapa y retirás la marca: los pesos vuelven.
// Ejecuta propiedad.js, economia.js y la construcción de verdad (el recorrido completo con el teclado está en el humo de las obras).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mundo, C } from './ayuda-4-0-3-caminante.mjs';
import { economiaNueva, pesosDe } from '../src/economia.js';
import { pagarEtapa, puedePagarEtapa, devolverEtapasPagadas, precioDeEtapa, PROPIEDAD } from '../src/propiedad.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const progresoNuevo = (pesos = 100000) => ({ modo: 'relax', dia: 3, horas: 9, economia: { ...economiaNueva(), pesos } });

for (const id of ['cabana-piedra', 'casa-galeria', 'casona']) {
  // el recorrido como lo hace main.js: fundar, pagar y levantar la 1.ª etapa, deshacerla y retirar la marca
  const w = mundo({});
  const p = progresoNuevo();
  w.s.elegir(C.PLANO[id]);
  const f = w.s.fundar(5, 5, 0, 0);
  ok(f.ok, `${id}: se funda la marca`);
  const obra = f.obra;
  const pago = puedePagarEtapa(p, id, obra.datos.etapas);
  ok(pago.ok && pago.precio > 0, `${id}: la primera etapa cuesta ${pago.precio}`);
  const r = w.s.avanzar(obra, { ...w.mats });
  ok(r.ok, `${id}: se levanta la primera etapa`);
  pagarEtapa(p, id, 0, 'Los albañiles de la aldea'); obra.datos.pagadas = 1;
  eq(pesosDe(p), 100000 - precioDeEtapa(id, 0), `${id}: se pagó el terreno y la mano de obra`);
  const d = w.s.deshacerEtapa({ x: 5, z: 5, y: 0 }, 6);
  ok(d.ok && d.quedaMarca !== false, `${id}: se deshace la etapa (queda la marca)`);
  ok(pesosDe(p) === 100000 - precioDeEtapa(id, 0), `${id}: deshacer devuelve materiales, no pesos (así estaba)`);
  const c = w.s.cancelarMarcada({ x: 5, z: 5, y: 0 }, 10, id);
  ok(c.ok && c.datos.pagadas === 1, `${id}: se retira la marca y recuerda lo pagado`);
  const devuelto = devolverEtapasPagadas(p, id, c.datos.pagadas);
  eq(devuelto, precioDeEtapa(id, 0), `${id}: devuelve lo de la primera etapa`);
  eq(pesosDe(p), 100000, `${id}: la billetera queda como estaba`);
}
{
  // dos etapas pagadas
  const p = progresoNuevo();
  pagarEtapa(p, 'casona', 0); pagarEtapa(p, 'casona', 1);
  eq(devolverEtapasPagadas(p, 'casona', 2), precioDeEtapa('casona', 0) + precioDeEtapa('casona', 1), 'dos etapas pagadas: vuelven las dos');
  eq(pesosDe(p), 100000, 'y la billetera queda entera');
  // sin nada pagado, o en el Desafío (sin economía), o con un id raro: nada
  eq(devolverEtapasPagadas(p, 'casona', 0), 0, 'sin etapas pagadas no devuelve');
  eq(devolverEtapasPagadas({ modo: 'desafio', economia: economiaNueva() }, 'casona', 2), 0, 'en el Desafío no hay pesos');
  eq(devolverEtapasPagadas(p, 'puesto', 2), 0, 'una casa sin precio no devuelve');
  eq(devolverEtapasPagadas(p, 'casona', 99), devolverEtapasPagadas(progresoNuevo(), 'casona', 4), 'un número de etapas exagerado se acota a las cuatro');
  eq(devolverEtapasPagadas(p, 'casona', -3), 0, 'ni negativas');
  // el libro anota la devolución
  const q = progresoNuevo(); pagarEtapa(q, 'cabana-piedra', 0); devolverEtapasPagadas(q, 'cabana-piedra', 1);
  ok(q.economia.libro.at(-1).monto > 0 && /Devolución/.test(q.economia.libro.at(-1).motivo), 'el libro de la billetera anota la devolución');
  ok(PROPIEDAD.casas.casona.total > 0, 'hay precios');
}
{
  const m = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  ok(m.includes('const devuelto = devolverEtapasPagadas(progreso, r.plano.id, r.datos?.pagadas || 0);'), 'main.js devuelve los pesos al retirar la marca');
  ok(m.indexOf('const devuelto = devolverEtapasPagadas') < m.indexOf("nota('Marca retirada'") && /devolverEtapasPagadas[^\n]*\n\s*progreso\.obras = obras\.obras\.map\(\(o\) => o\.datos\);\n\s*guardar\(\);/.test(m), 'y antes de guardar');
}
console.log(`OK 4.0.3 obras · ${n} verificaciones · los pesos pagados de una casa vuelven al retirar la marca`);
