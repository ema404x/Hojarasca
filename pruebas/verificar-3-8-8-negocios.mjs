// 3.8.8 · Economía, Fases 3 a 6 (módulos puros): jornales con sueldo, pedidos con reputación, cajas de la aldea y eventos,
// banco (préstamos y abastecimiento) y propiedad (precio de casas, alquiler, puesto propio). Además: el saneo del guardado,
// la conexión con los vecinos (servicioDe), y que nada de esto dé plata gratis (ciclos de ganancia acotados).
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const E = await import('../src/economia.js');
const N = await import('../src/negocios.js');
const T = await import('../src/trabajos.js');
const P = await import('../src/pedidos.js');
const V = await import('../src/aldea-viva.js');
const B = await import('../src/prestamos.js');
const R = await import('../src/propiedad.js');
const A = await import('../src/aldea.js');
const C = await import('../src/comercio.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const partida = (extra = {}) => ({ modo: 'relax', dia: 5, horas: 12, cosas: {}, materiales: {}, entradas: {}, economia: E.economiaNueva(), ...extra });
const conPlata = (p, pesos) => { p.economia.pesos = pesos; return p; };

// ---------------------------------------------------------------- 1. el estado y el guardado
{
  const p = partida();
  ok(N.negociosDe(p) && N.hayNegocios(p), 'una partida con economía tiene negocios');
  const d = { modo: 'desafio', dia: 3 };
  ok(N.negociosDe(d) === null && !N.hayNegocios(d), 'el Desafío no tiene');
  eq(N.sanearNegocios(null, 5), N.negociosNuevo(), 'sin guardado, vacío');
  const roto = N.sanearNegocios({ oficio: { carpintero: 1e12, '': 3, x: 'a' }, jornal: { herrero: 99 }, hoy: { dia: 99, jornales: 99 }, cajas: { panadera: 1e12 },
    pedidos: { herrero: { id: 'herrero|1', dia: 77 }, malo: 5 }, banco: { prestamo: { monto: 1000, debe: 5e12, dia: 90, hasta: -2, tasa: 5 }, rep: 1e12 },
    casas: { poseidas: { casona: 99, zzz: 'x' }, alquiladas: { casona: { inquilino: 'x', cuantas: 99, renta: 1e12 } }, puesto: { caja: 1e12, stock: { tabla: 99, nada: 3 } } } }, 10);
  ok(roto.oficio.carpintero <= 1e5 && !('' in roto.oficio) && !('x' in roto.oficio), 'oficio con tope y sin basura');
  ok(roto.jornal.herrero === 10 && roto.hoy.dia === 10 && roto.hoy.jornales <= 20, 'las fechas del futuro se traen a hoy');
  ok(roto.cajas.panadera <= N.TOPE_CAJA, 'caja con tope');
  ok(roto.pedidos.herrero.dia === 10 && !('malo' in roto.pedidos), 'pedidos saneados');
  ok(roto.banco.prestamo.debe <= 1e7 && roto.banco.prestamo.tasa <= 0.2 && roto.banco.prestamo.dia === 10 && roto.banco.rep <= 1e5, 'préstamo saneado');
  ok(roto.casas.poseidas.casona === 20 && !('zzz' in roto.casas.poseidas) && roto.casas.alquiladas.casona.cuantas === 20, 'casas saneadas');
  ok(roto.casas.puesto.caja <= 1e6 && roto.casas.puesto.stock.tabla === 30 && !('nada' in roto.casas.puesto.stock), 'puesto saneado');
  eq(N.sanearNegocios(JSON.parse(JSON.stringify(N.negociosNuevo())), 9), N.negociosNuevo(), 'ida y vuelta de un estado nuevo');
  const r = N.negociosNuevo(); r.rep.carpintero = 3; ok(N.nivelRep({ economia: E.economiaNueva(), negocios: r }, 'carpintero') === 1, 'la reputación da niveles');
}

// ---------------------------------------------------------------- 2. jornales
{
  const p = partida();
  ok(T.hayTrabajo('carpintero') && !T.hayTrabajo('jefe') && Object.keys(T.TRABAJOS).length === 20, 'los veinte pobladores tienen su jornal');
  for (const [k, t] of Object.entries(T.TRABAJOS)) ok(A.esPobladorAldea(k) && t.base >= 600 && t.base <= 1400 && t.tarea && t.pide, `${k}: tarea y base razonables`);
  const base = T.sueldoDe(p, 'carpintero');
  ok(base === 1100, `base del carpintero $${base}`);
  const r = T.cumplirJornal(p, 'carpintero', 5, 'Tito');
  ok(r.ok && r.sueldo === 1100 && E.pesosDe(p) === 1100, 'el jornal cobra');
  ok(E.ultimosMovimientos(p, 1)[0].motivo.startsWith('Jornal: ') && E.ultimosMovimientos(p, 1)[0].con === 'Tito', 'queda en el libro');
  ok(N.caja(p, 'carpintero') === N.CAJA_INICIAL - 1100, 'sale de la caja del local');
  eq(T.puedeTrabajar(p, 'carpintero', 5), { ok: false, motivo: 'ya' }, 'uno por local por día');
  ok(T.cumplirJornal(p, 'herrero', 5, 'Anselmo').ok, 'otro local, sí');
  eq(T.puedeTrabajar(p, 'pescador', 5).motivo, 'cupo', 'dos por día en total');
  ok(T.puedeTrabajar(p, 'pescador', 6).ok, 'mañana, de nuevo');
  // habilidad
  const q = partida();
  let sueldos = [];
  for (let d = 1; d <= 18; d++) { const x = T.cumplirJornal(q, 'carpintero', d, 'Tito'); sueldos.push(x.sueldo); N.negociosDe(q).cajas.carpintero = N.CAJA_INICIAL; }
  ok(sueldos[0] === 1100 && sueldos[3] === 1200 && sueldos.at(-1) === 1650, `la habilidad sube el sueldo hasta +50 % (${sueldos[0]} → ${sueldos.at(-1)})`);
  ok(T.nivelOficio(q, 'carpintero') === 5, 'nivel máximo 5');
  // la caja
  const z = partida(); N.negociosDe(z).cajas.herrero = 1000;
  eq(T.puedeTrabajar(z, 'herrero', 5).motivo, 'caja', 'sin caja no te paga');
  ok(/no tengo con qué pagarte/.test(T.ofertaDeJornal(z, 'herrero', 5, 'Anselmo').partes[0]), 'y lo dice');
  ok(T.sueldoDe(p, 'carpintero', 1.2) > T.sueldoDe(partida(), 'carpintero', 1), 'la demanda sube el sueldo');
  ok(T.sueldoDe(partida(), 'carpintero', NaN) === 1100, 'una demanda rota no se usa');
  const of = T.ofertaDeJornal(partida(), 'panadera', 5, 'Rosa', 1, 'E: dale');
  ok(of.efectos[0].tipo === 'jornal' && of.partes.length === 2 && /\$900/.test(of.partes[1]) && of.titulo.includes('$900'), 'la oferta dice cuánto');
  ok(T.ofertaDeJornal({ dia: 1 }, 'panadera', 1, 'x') === null, 'sin economía, nada');
}

// ---------------------------------------------------------------- 3. la aldea viva
{
  ok(V.EVENTOS.length === 5, 'cinco eventos');
  let con = 0; const vistos = new Set();
  for (let d = 1; d <= 400; d++) { const e = V.eventoDelDia(d); if (e) { con++; vistos.add(e.id); } }
  ok(con > 90 && con < 170 && vistos.size === 5, `eventos: ${con} de 400 días, de los cinco tipos`);
  ok(V.eventoDelDia(17) === V.eventoDelDia(17), 'el evento es del día');
  for (let d = 1; d <= 60; d++) for (const t of ['verano', 'otono', 'invierno']) {
    const dem = V.demandaDe(d, t);
    ok(dem >= 0.9 && dem <= 1.25, `demanda ${dem.toFixed(2)} en rango`);
    for (const b of Object.keys(C.BIENES)) { const f = V.factorEvento(d, t, b); if (f < 0.8 || f > 1.2) ok(false, `factor ${b} fuera de rango`); }
  }
  ok(V.factorEvento(1, 'invierno', 'tronco') >= V.factorEvento(1, 'verano', 'tronco'), 'el invierno encarece la leña');
  const ing = []; for (let d = 1; d <= 30; d++) ing.push(V.ingresoDe('carpintero', d, 1));
  ok(Math.min(...ing) >= 700 && Math.max(...ing) <= 1800 && new Set(ing).size > 5, 'ingreso diario del local, con variación');
  // el cierre
  const p = partida({ dia: 3 });
  const claves = ['carpintero', 'herrero'];
  let r = V.cerrarCuentas(p, 3, claves);
  ok(r.dias === 0 && p.negocios.cierre === 3 && p.negocios.cajas.carpintero === N.CAJA_INICIAL, 'el primer cierre sólo abre las cuentas');
  const antes = p.negocios.cajas.carpintero;
  r = V.cerrarCuentas(p, 4, claves);
  ok(r.dias === 1 && p.negocios.cajas.carpintero !== antes, 'un día cierra');
  r = V.cerrarCuentas(p, 4, claves); ok(r.dias === 0, 'el mismo día no cierra dos veces');
  r = V.cerrarCuentas(p, 5000, claves); ok(r.dias === 12 && p.negocios.cierre === 5000, 'volver después de mucho: hasta un año');
  ok(claves.every((k) => p.negocios.cajas[k] >= 0 && p.negocios.cajas[k] <= N.TOPE_CAJA), 'las cajas, con tope');
  // un local al que le exigís cada día se queda sin caja
  const q = partida(); V.cerrarCuentas(q, 1, ['carpintero']);
  let pagos = 0, sinCaja = 0;
  for (let d = 2; d <= 40; d++) { V.cerrarCuentas(q, d, ['carpintero']); const x = T.cumplirJornal(q, 'carpintero', d, 'Tito'); if (x.ok) pagos++; else if (x.motivo === 'caja') sinCaja++; }
  ok(sinCaja > 0 && pagos > 12 && pagos < 40, `a un local no se le puede pedir todos los días: ${pagos} jornales y ${sinCaja} días sin caja de 39`);
  ok(V.cerrarCuentas({ dia: 1 }, 3, claves) === null, 'sin economía no se cierra nada');
}

// ---------------------------------------------------------------- 4. pedidos
{
  const p = partida({ dia: 5 });
  ok(Object.keys(P.hayPedidos ? { a: 1 } : {}).length === 1, 'hay pedidos');
  for (const k of Object.keys(T.TRABAJOS)) { ok(P.hayPedidos(k), `${k} pide`); for (const b of ['uno']) void b; }
  const q = P.pedidoDe(p, 'carpintero', 5);
  ok(q && C.esBien(q.k) && q.n % C.BIENES[q.k].lote === 0 && q.premio >= 50 && q.limite >= 5, 'el pedido es de una cosa real, por lotes');
  ok(P.pedidoDe(p, 'carpintero', 5).id === q.id && P.pedidoDe(partida(), 'carpintero', 5).id === q.id, 'el mismo en todas las partidas');
  ok(P.ventanaDe(1) === 0 && P.ventanaDe(3) === 0 && P.ventanaDe(4) === 1, 'ventanas de tres días');
  const primero = P.ventanaDe(5) * 3 + 1;
  const rap = P.pedidoDe(p, 'carpintero', primero), tarde = P.pedidoDe(p, 'carpintero', primero + 1);
  ok(rap.rapido && !tarde.rapido && rap.premio >= tarde.premio, 'el primer día paga un extra');
  // el precio, comparado con lo que cuesta: nunca por debajo del valor
  for (const k of Object.keys(T.TRABAJOS)) for (let d = 1; d <= 30; d += 3) {
    const x = P.pedidoDe(partida(), k, d); if (!x) continue;
    const valor = (x.n / C.BIENES[x.k].lote) * C.BIENES[x.k].valor * 100;
    ok(x.premio >= valor * 1.05 && x.premio <= valor * 1.5 + 100, `${k} día ${d}: ${x.k} paga $${x.premio} (vale $${valor})`);
  }
  // entregar
  const tengo = (bien, cant) => { const b = C.BIENES[bien]; if (b.donde === 'material') p.materiales[bien] = cant; else if (b.donde === 'entrada') p.entradas[bien] = { dia: 1, hora: 1, cantidad: cant }; else p.cosas[bien] = cant; };
  eq(P.puedeEntregar(p, 'carpintero', 5).motivo, 'falta', 'sin lo pedido, falta');
  tengo(q.k, q.n);
  const of = P.ofertaDePedido(p, 'carpintero', 5, 'Tito', 'E');
  ok(of.efectos.length === 2 && of.efectos[0].n === -q.n && of.efectos[1].tipo === 'pedido', 'la oferta saca lo pedido y cobra');
  const r = A.aplicarEfectos(p, of.efectos, 5);
  ok(Array.isArray(r), 'se aplica con la puerta de la aldea');
  ok(E.pesosDe(p) === q.premio && P.tengoDe(p, q.k) === 0 && N.negociosDe(p).rep.carpintero === 1, 'cobra, entrega y suma reputación');
  ok(P.pedidoDe(p, 'carpintero', 5) === null, 'ya cumplido en esta ventana');
  ok(P.pedidoDe(p, 'carpintero', 8) !== null, 'en la ventana siguiente hay otro');
  ok(E.ultimosMovimientos(p, 1)[0].motivo.startsWith('Pedido: '), 'queda en el libro');
  // el cupo de dos por día
  const z = partida(); let cumplidos = 0;
  for (const k of ['carpintero', 'herrero', 'pescador', 'maestra']) { const x = P.pedidoDe(z, k, 5); const b = C.BIENES[x.k]; if (b.donde === 'material') z.materiales[x.k] = 99; else if (b.donde === 'entrada') z.entradas[x.k] = { dia: 1, hora: 1, cantidad: 99 }; else z.cosas[x.k] = 99; if (P.cerrarPedido(z, k, 5, 'x').ok) cumplidos++; }
  ok(cumplidos === 2, 'dos pedidos por día');
  // la reputación sube lo que pide y lo que paga
  const w = partida(); const r0 = P.pedidoDe(w, 'tejedora', 5); N.negociosDe(w).rep.tejedora = 16;
  const r3 = P.pedidoDe(w, 'tejedora', 5);
  ok(r3.n / C.BIENES[r3.k].lote > r0.n / C.BIENES[r0.k].lote && N.nivelRep(w, 'tejedora') === 3, 'más confianza, pedidos más grandes');
  ok(P.pedidoDe({ dia: 1 }, 'carpintero', 1) === null, 'sin economía, nada');
}

// ---------------------------------------------------------------- 5. el banco
{
  const p = partida({ dia: 5 });
  ok(B.nivelBanco(p) === 0 && B.topeDe(p) === 3000, 'el primer préstamo es chico: $3.000');
  eq(B.puedePedir(p, 5, 3500).motivo, 'tope', 'más del tope, no');
  eq(B.puedePedir(p, 5, 700).motivo, 'monto', 'montos de a $500');
  eq(B.puedePedir(p, 5, 2000, 2).motivo, 'monto', 'plazo de 3 a 12 días');
  const r = B.pedirPrestamo(p, 5, 3000, 12);
  ok(r.ok && E.pesosDe(p) === 3000 && B.prestamoDe(p).debe === 3000 && B.prestamoDe(p).hasta === 17, 'te presta y anota');
  eq(B.puedePedir(p, 6, 500).motivo, 'debe', 'uno a la vez');
  B.pasarDiaBanco(p, 6);
  ok(B.prestamoDe(p).debe === 3060, 'interés del 2 % por día');
  for (let d = 7; d <= 17; d++) B.pasarDiaBanco(p, d);
  ok(B.prestamoDe(p).debe === B.costoEstimado(3000, 12) && B.costoEstimado(3000, 12) < 3000 * 1.3, `al año el préstamo costó ${B.prestamoDe(p).debe}`);
  const pago = B.pagarPrestamo(p, 17, 1000);
  ok(pago.ok && pago.resta === B.prestamoDe(p).debe && !pago.saldado, 'pagar de a poco');
  eq(B.pagarPrestamo(p, 17, 0).motivo, 'monto', 'monto cero, no');
  conPlata(p, 10000);
  const fin = B.pagarPrestamo(p, 17, 1e6);
  ok(fin.saldado && B.prestamoDe(p) === null && N.negociosDe(p).banco.rep === 1, 'saldado a tiempo: más confianza');
  ok(E.pesosDe(p) === 10000 - fin.pagado, 'pagó sólo lo que debía');
  ok(B.nivelBanco(p) === 0, 'una sola vez no alcanza para el nivel 1 todavía');
  N.negociosDe(p).banco.rep = 2; ok(B.topeDe(p) === 6000, 'con confianza, presta más');
  // el atraso
  const q = partida({ dia: 5 }); B.pedirPrestamo(q, 5, 1000, 3);
  for (let d = 6; d <= 12; d++) B.pasarDiaBanco(q, d);
  ok(B.prestamoDe(q).tasa === 0.03 && N.negociosDe(q).banco.atrasos === 1 && N.negociosDe(q).banco.sinConfianza, 'pasado el plazo: interés 3 % y sin confianza');
  ok(B.prestamoDe(q).debe < 1000 * 1.2, `el atraso no arruina (debe ${B.prestamoDe(q).debe} de 1000)`);
  conPlata(q, 50000); const sal = B.pagarPrestamo(q, 12, 1e6);
  ok(sal.saldado && B.puedePedir(q, 12, 500).ok && N.negociosDe(q).banco.rep === 0, 'se salda y vuelve a prestar, pero sin ganar confianza');
  eq(B.pagarPrestamo(partida(), 5, 100).motivo, 'nada', 'sin préstamo no hay qué pagar');
  const pobre = partida({ dia: 5 }); B.pedirPrestamo(pobre, 5, 1000, 5); pobre.economia.pesos = 10;
  eq(B.pagarPrestamo(pobre, 6, 500).motivo, 'plata', 'sin plata no se paga');
  // abastecimiento
  const a = B.abastoDe(partida(), 5);
  ok(a && C.esBien(a.k) && !['poncho', 'cristal'].includes(a.k) && a.prima >= 1.25 && a.prima <= 1.4, 'el banco pide algo corriente, con prima');
  const valor = (a.n / C.BIENES[a.k].lote) * C.BIENES[a.k].valor * 100;
  ok(a.premio >= valor * 1.2 && a.premio <= valor * 1.45 + 100, `paga $${a.premio} por lo que vale $${valor}`);
  ok(B.abastoDe(partida(), 5).id === B.abastoDe(partida(), 6).id || B.abastoDe(partida(), 5).id !== B.abastoDe(partida(), 7).id, 'cambia cada dos días');
  const m = partida({ dia: 5 }); const x = B.abastoDe(m, 5);
  const bx = C.BIENES[x.k]; if (bx.donde === 'material') m.materiales[x.k] = x.n; else if (bx.donde === 'entrada') m.entradas[x.k] = { dia: 1, hora: 1, cantidad: x.n }; else m.cosas[x.k] = x.n;
  const efectos = B.efectosDeAbasto(x);
  const cu = B.cumplirAbasto(m, 5);
  ok(cu.ok && E.pesosDe(m) === x.premio && efectos[0].n === -x.n, 'cumplir cobra el premio');
  ok(B.abastoDe(m, 5) === null && B.cumplirAbasto(m, 5).ok === false, 'uno por ventana');
  ok(B.textoAbasto(x).includes(`día ${x.limite}`), 'el texto dice el plazo');
  const moroso = partida({ dia: 5 }); B.pedirPrestamo(moroso, 5, 500, 3); eq(B.puedeAbastecer(moroso, 20).motivo, 'atraso', 'con el préstamo vencido no te contrata');
  // el ciclo préstamo → abasto → pagar no es una máquina de plata
  let ganancia = 0; const c2 = partida({ dia: 1 });
  for (let d = 1; d <= 120; d += 2) {
    const a2 = B.abastoDe(c2, d); if (!a2) continue;
    const costo = Math.ceil((a2.n / C.BIENES[a2.k].lote) * C.BIENES[a2.k].valor * 1.5 * 100);   // comprando caro en el puesto
    const antes = E.pesosDe(c2); c2.economia.pesos = antes + costo;
    const bb = C.BIENES[a2.k]; if (bb.donde === 'material') c2.materiales[a2.k] = a2.n; else if (bb.donde === 'entrada') c2.entradas[a2.k] = { dia: 1, hora: 1, cantidad: a2.n }; else c2.cosas[a2.k] = a2.n;
    const w = B.cumplirAbasto(c2, d); if (w.ok) ganancia += w.premio - costo;
  }
  ok(ganancia / 120 < 600, `lo que da el abastecimiento, comprando caro: $${Math.round(ganancia / 120)} por día de media`);
}

// ---------------------------------------------------------------- 6. propiedad
{
  ok(R.precioCasa('cabana-piedra') === 24000 && R.precioCasa('casa-galeria') === 42000 && R.precioCasa('casona') === 70000 && R.precioCasa('casilla') === 0, 'precios de las casas');
  for (const id of Object.keys(R.PROPIEDAD.casas)) {
    let suma = 0; for (let i = 0; i < 4; i++) suma += R.precioDeEtapa(id, i);
    ok(suma === R.precioCasa(id), `${id}: las cuatro etapas suman el total`);
    ok(R.precioDeEtapa(id, 0) > R.precioDeEtapa(id, 1), `${id}: la primera lleva el terreno`);
    ok(R.precioDeEtapa(id, 4) === 0 && R.precioDeEtapa(id, -1) === 0, `${id}: fuera de las etapas, nada`);
  }
  const p = partida();
  eq(R.puedePagarEtapa(p, 'cabana-piedra', 0).ok, false, 'sin plata no se empieza');
  ok(R.puedePagarEtapa(p, 'cabana-piedra', 0).falta === 8400, 'y dice cuánto falta');
  ok(R.puedePagarEtapa({ dia: 1 }, 'cabana-piedra', 0).ok && R.puedePagarEtapa({ dia: 1 }, 'cabana-piedra', 0).precio === 0, 'sin economía no se cobra');
  conPlata(p, 9000);
  ok(R.pagarEtapa(p, 'cabana-piedra', 0).ok && E.pesosDe(p) === 600, 'se paga la primera etapa');
  eq(R.pagarEtapa(p, 'cabana-piedra', 1).ok, false, 'y la siguiente espera');
  ok(R.puedePagarEscritura(p).ok === false && R.puedePagarEscritura(conPlata(p, 8000)).ok, 'la escritura del lote');
  ok(R.pagarEscritura(p).ok && E.pesosDe(p) === 0, 'se paga');
  // alquiler
  ok(R.registrarCasa(p, 'cabana-piedra') === 1 && R.casasDe(p, 'cabana-piedra') === 1 && R.registrarCasa(p, 'cualquiera') === 0, 'registrar casas');
  const al = R.ponerEnAlquiler(p, 'cabana-piedra', 6);
  ok(al.ok && al.renta === 300 && al.inquilino, 'se alquila');
  eq(R.ponerEnAlquiler(p, 'cabana-piedra', 6).motivo, 'todas', 'no más que las que tenés');
  eq(R.ponerEnAlquiler(p, 'casona', 6).motivo, 'no hay', 'ni las que no tenés');
  let cobrado = 0; for (let d = 7; d <= 106; d++) cobrado += R.alquilerDelDia(p, d, 1);
  ok(cobrado >= 100 * 300 * 0.7 && cobrado <= 100 * 300 * 1.0 + 1, `cien días de alquiler: $${cobrado}`);
  ok(cobrado / 100 < 300, 'una cabaña rinde menos de $300 por día (se paga en más de 100 días)');
  ok(p.negocios.casas.cobrado === cobrado, 'queda anotado lo cobrado');
  ok(R.retirarDeAlquiler(p, 'cabana-piedra').ok && R.enAlquilerDe(p, 'cabana-piedra') === 0, 'se retira');
  // puesto
  const q = partida(); conPlata(q, 6000);
  eq(R.dejarEnPuesto(q, 'tabla', 1).motivo, 'sin puesto', 'sin puesto no hay consigna');
  ok(R.comprarPuesto(q, 5).ok && E.pesosDe(q) === 0 && R.tienePuesto(q), 'se compra el puesto');
  eq(R.comprarPuesto(q, 5).motivo, 'ya', 'uno solo');
  q.materiales.tabla = 20;
  eq(R.dejarEnPuesto(q, 'tabla', 6).motivo, 'falta', 'no podés dejar lo que no tenés (4 tablas por lote)');
  const d1 = R.dejarEnPuesto(q, 'tabla', 3);
  ok(d1.ok && d1.unidades === 12 && R.lotesEnPuesto(q, 'tabla') === 3, 'dejás tres lotes');
  q.materiales.tabla = 200; eq(R.dejarEnPuesto(q, 'tabla', 20).motivo, 'lleno', 'tope por cosa'); q.materiales.tabla = 8;
  ok(R.ventasDelPuesto(q, 6) === 2 && q.negocios.casas.puesto.caja === 2 * R.precioDeConsigna('tabla') && R.lotesEnPuesto(q, 'tabla') === 1, 'vende dos lotes por día');
  ok(R.precioDeConsigna('tabla') === 360, 'tabla: $400 el lote menos el 10 %');
  const rc = R.retirarCajaPuesto(q);
  ok(rc.ok && E.pesosDe(q) === 720 && q.negocios.casas.puesto.caja === 0 && !R.retirarCajaPuesto(q).ok, 'se retira la caja');
  ok(R.sacarDelPuesto(q, 'tabla', 1).ok && R.lotesEnPuesto(q, 'tabla') === 0 && !R.sacarDelPuesto(q, 'tabla', 1).ok, 'se retira la consigna');
  // el puesto nunca paga más que el puesto del tren
  const mejor = Math.max(...Object.keys(C.BIENES).map((b) => R.precioDeConsigna(b) / (C.BIENES[b].valor * 100)));
  ok(mejor <= 0.9 + 1e-9, 'la consigna paga como mucho el 90 % del valor');
  // los alquileres y el puesto, en el cierre diario
  const z = partida({ dia: 1 }); conPlata(z, 6000); R.comprarPuesto(z, 1); z.materiales.tabla = 8; R.dejarEnPuesto(z, 'tabla', 2); R.registrarCasa(z, 'casona'); R.ponerEnAlquiler(z, 'casona', 1);
  V.cerrarCuentas(z, 1, ['carpintero']); const cz = V.cerrarCuentas(z, 4, ['carpintero']);
  ok(cz.dias === 3 && cz.renta > 0 && R.lotesEnPuesto(z, 'tabla') === 0 && z.negocios.casas.puesto.caja > 0, 'el cierre diario cobra los alquileres y vende en el puesto');
}

// ---------------------------------------------------------------- 7. los vecinos: jornal, pedido y servicio de siempre
{
  const llena = () => {
    const p = partida({ dia: 10, horas: 12 });
    p.aldea = A.aldeaNueva();
    p.aldea.pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 }));
    p.aldea.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
    return p;
  };
  const p = llena();
  // un vecino con servicio: se ofrece primero el servicio de siempre
  p.materiales.tronco = 4;
  const s1 = A.servicioDe('carpintero', p, 10);
  ok(s1.efectos.some((f) => f.tipo === 'material'), 'primero su servicio (aserrar)');
  A.aplicarEfectos(p, s1.efectos, 10);
  const s2 = A.servicioDe('carpintero', p, 10);
  ok(s2.efectos?.[0]?.tipo === 'jornal' || s2.efectos?.[0]?.tipo === 'pedido' || s2.efectos?.[1]?.tipo === 'pedido', 'después, el jornal o el pedido');
  ok(s2.partes.length >= 2 && s2.partes.every((x) => typeof x === 'string' && x.length > 5 && !/undefined|null|\{|\}/.test(x)), 'con texto entero');
  // base sin economía: igual que antes
  const sin = llena(); delete sin.economia;
  ok(A.servicioDe('carpintero', sin, 10).efectos === A.servicioBase('carpintero', sin, 10).efectos || JSON.stringify(A.servicioDe('carpintero', sin, 10)) === JSON.stringify(A.servicioBase('carpintero', sin, 10)), 'sin economía, el servicio es el de siempre');
  // un jornal hecho a través de la aldea
  const w = llena(); const j = A.servicioDe('panadera', w, 10);
  const efJ = (j.efectos || []).find((f) => f.tipo === 'jornal');
  if (efJ) { A.aplicarEfectos(w, [efJ], 10); ok(E.pesosDe(w) >= 800, 'el jornal paga por la puerta de la aldea'); }
  // todos los pobladores tienen algo que decir con economía
  for (const k of A.ORDEN_POBLADORES_ALDEA) {
    const q = llena(); const s = A.servicioDe(k, q, 10, { hora: 12 });
    ok(s.partes.length > 0 && s.partes.every((x) => typeof x === 'string' && !/undefined|null/.test(x)), `${k}: dice algo`);
  }
  // el local sin abrir no ofrece nada de esto
  const nuevo = llena(); nuevo.aldea.locales = {};
  ok(!A.servicioDe('carpintero', nuevo, 10).efectos, 'sin local abierto, primero la obra');
}

console.log(`verificar-3-8-8-negocios: ${n} verificaciones ok`);
