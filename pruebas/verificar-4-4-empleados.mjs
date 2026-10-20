// 4.4: los empleados del negocio propio (empleados-negocio.js, empleados-negocio-juego.js y sus enganches), en Node:
//   · a quién se puede contratar: la tabla, la amistad (rechaza / de mala gana / acepta / con gusto), los que tienen local propio, los que no se contratan;
//   · el sueldo (de $900 a $1.800 según la habilidad) y el rendimiento (de ~55-60 % a ~77-87 % con los días, la habilidad y la amistad);
//   · los turnos (lunes a sábado, dos que se pisan), la cobertura de los dos juntos;
//   · contratar y despedir (hasta 2, el primer día de prueba, pagar lo de hoy al despedir);
//   · las ventas sin vos: sólo en turno, con el local abierto, con stock, con el tope de la caja; qué fracción de lo que harías vos; que crezca con los días;
//   · el sueldo (de la caja y, si no alcanza, de la billetera), el impago, la renuncia por dos impagos y por no pasar en 5 días; el resumen al volver;
//   · cuando estás: ayudan al que ya esperó;
//   · el guardado (el campo nuevo, partidas viejas, basura, el Desafío);
//   · el juego completo con un contexto de mentira: el enganche con la aldea (el vecino deja la aldea en su turno), la figura detrás del mostrador, los avisos;
//   · el cableado de aldea.js, main.js, guardado.js y negocio-propio-juego.js (sin mando ni textos en otro idioma).
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const N = await import('../src/negocio-propio.js');
const M = await import('../src/empleados-negocio.js');
const J = await import('../src/empleados-negocio-juego.js');
const A = await import('../src/aldea.js');
const V = await import('../src/vecindad.js');
const PN = await import('../src/planos-negocio.js');
const E = await import('../src/economia.js');
const { COMERCIO } = await import('../src/comercio.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; if (process.env.VERBOSO) console.log('  ' + m); };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const cerca = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m} (${a} vs ${b})`);

const PROD = { 'pan-casero': 8, huevo: 12, miel: 3, 'frasco-frutilla': 3, 'calafate-seco': 2, poncho: 1, 'hongos-secos': 2, 'trucha-ahumada': 2, tronco: 6, tabla: 4, piedra: 4, harina: 4, papa: 6, lana: 2 };
const ilimitado = { tengo: () => 1e5, quitar: () => {} };
const nuevoLocal = (tipo = 'almacen') => { const est = N.negocioPropioNuevo(); est.tipo = tipo; est.abierto = true; return est; };
const surtidoBueno = (est) => { for (const [k, c] of Object.entries(PROD)) if (N.catalogo(est.tipo).includes(k)) N.surtir(est, k, c, ilimitado); };
const PUNTOS = { conocido: 30, amigo: 60, compadre: 150 };

// ---------------------------------------------------------------- 1. a quién se puede contratar
{
  eq(M.MAX_EMPLEADOS, 2, 'hasta 2 empleados');
  // los candidatos existen en la aldea y no son de los que sostienen un servicio de todos
  const ESENCIALES = ['jefe', 'nelida', 'abuela', 'nene', 'nena', 'galesa', 'ercilia', 'maestra', 'enfermera', 'telegrafista', 'musico', 'botera', 'astronoma', 'martin', 'gerente', 'moza', 'bailarina'];
  for (const k of M.IDS_CANDIDATOS) {
    ok(A.esPersonaAldea(k) && !!A.personaAldea(k)?.colores, `${k}: es alguien de la aldea, con su ropa`);
    ok(!ESENCIALES.includes(k), `${k}: no es de los que sostienen un servicio de todos`);
    ok(V.esPersonaVecindad(k), `${k}: tiene amistad en la vecindad`);
  }
  for (const k of ESENCIALES) ok(!M.esCandidato(k), `${k}: no se contrata`);
  ok(M.IDS_CANDIDATOS.length >= 12, 'hay dónde elegir');
  ok(!M.esCandidato('__proto__') && !M.esCandidato('toString') && !M.esCandidato(null), 'nombres raros no son candidatos');
  eq(M.UMBRAL.amigo, V.AMISTAD.umbral.amigo, 'el umbral de amigo es el de la vecindad');
  eq(M.UMBRAL.compadre, V.AMISTAD.umbral.compadre, 'el de compadre, también');
  // la amistad decide
  eq(M.tratoPorPuntos(0), 'rechaza', '0 puntos: rechaza'); eq(M.tratoPorPuntos(24), 'rechaza', '24: rechaza'); eq(M.tratoPorPuntos(25), 'desgana', '25: de mala gana');
  eq(M.tratoPorPuntos(49), 'desgana', '49: de mala gana'); eq(M.tratoPorPuntos(50), 'normal', '50 (amigo): acepta'); eq(M.tratoPorPuntos(139), 'normal', '139: acepta');
  eq(M.tratoPorPuntos(140), 'gusto', '140 (compadre): con gusto'); eq(M.tratoPorPuntos(200), 'gusto', '200: con gusto');
  ok(M.textoTrato('gusto') !== M.textoTrato('rechaza') && M.textoTrato('desgana').length > 5, 'y cada trato se explica');
  for (const tipo of N.IDS_TIPOS) {
    for (const k of M.IDS_CANDIDATOS) {
      const dueno = M.CANDIDATOS[k].dueno;
      eq(M.ofertaDe(k, tipo, 10).ok, false, `${k}: con poca amistad no acepta`);
      eq(M.ofertaDe(k, tipo, 10).motivo, 'amistad', `… por la amistad`);
      const d = M.ofertaDe(k, tipo, 30), a = M.ofertaDe(k, tipo, PUNTOS.amigo), c = M.ofertaDe(k, tipo, PUNTOS.compadre);
      if (dueno) { eq([d.ok, d.motivo], [false, 'dueno'], `${k} (con local propio): de conocido no deja su local`); } else ok(d.ok && d.trato === 'desgana', `${k}: de conocido acepta de mala gana`);
      ok(a.ok && a.trato === 'normal' && c.ok && c.trato === 'gusto', `${k}: de amigo acepta, de compadre con gusto`);
      ok(c.sueldo < a.sueldo || a.sueldo === M.SUELDO.min || a.sueldo >= M.SUELDO.max - 100, `${k}/${tipo}: el compadre cobra menos que el amigo (${c.sueldo} vs ${a.sueldo}), salvo contra el techo`);
      if (!dueno) ok(d.sueldo > a.sueldo || a.sueldo * 1.2 > M.SUELDO.max, `${k}/${tipo}: de mala gana pide más ($${d.sueldo} vs $${a.sueldo})`);
      for (const o of [d, a, c]) ok(o.sueldo >= M.SUELDO.min && o.sueldo <= M.SUELDO.max && o.sueldo % 50 === 0, `${k}/${tipo}: el sueldo ($${o.sueldo}) entre $600 y $1.200, redondo`);
      ok(a.inicio >= 0.5 && a.inicio <= 0.66 && a.tope >= 0.75 && a.tope <= 0.9 && a.tope > a.inicio + 0.15, `${k}/${tipo}: rinde de ${a.inicio} a ${a.tope}`);
      ok(c.inicio > a.inicio && c.tope >= a.tope, `${k}/${tipo}: de compadre rinde un poco más`);
    }
  }
  // más hábil, más sueldo (y más rendimiento)
  ok(M.sueldoPara('panadera', 'panaderia', 'normal') >= M.sueldoPara('pintora', 'panaderia', 'normal') + 400, 'la panadera pide bastante más que la pintora');
  ok(M.habilidadDe('panadera', 'panaderia') > M.habilidadDe('panadera', 'almacen') && M.habilidadDe('madre', 'panaderia') > M.habilidadDe('madre', 'almacen'), 'cada uno sabe más de lo suyo (la panadería)');
  ok(M.rendimientoPara('panadera', 'almacen', 0, 1) > M.rendimientoPara('pintora', 'almacen', 0, 1), 'y rinde más');
  const sueldos = M.IDS_CANDIDATOS.map((k) => M.sueldoPara(k, 'almacen', 'normal'));
  ok(Math.min(...sueldos) === 600 && Math.max(...sueldos) >= 1000 && Math.max(...sueldos) <= 1200, `los sueldos van de $${Math.min(...sueldos)} a $${Math.max(...sueldos)} por día`);
  // el rendimiento crece con los días, sin pasarse
  let prev = 0;
  for (const dias of [0, 1, 3, 6, 12, 24, 60, 1000]) { const r = M.rendimientoPara('madre', 'almacen', dias, 1); ok(r >= prev && r <= M.RENDIMIENTO.max, `madre a los ${dias} días: ${r}`); prev = r; }
  cerca(M.rendimientoPara('madre', 'almacen', 0, 0), 0.50 + 0.10 * 0.85, 0.001, 'el primer día rinde lo del inicio');
  ok(M.rendimientoPara('madre', 'almacen', 12, 0) > M.rendimientoPara('madre', 'almacen', 0, 0) + 0.1, 'en un año del juego (12 días) mejora más de 10 puntos');
  cerca(M.rendimientoPara('madre', 'almacen', 0, 2) - M.rendimientoPara('madre', 'almacen', 0, 0), M.RENDIMIENTO.compadre, 0.002, 'la amistad suma lo suyo');
  eq(M.rendimientoPara('jefe', 'almacen', 10, 2), 0, 'quien no se contrata, no rinde');
  eq(M.sueldoPara('jefe', 'almacen'), 0, '… ni cobra');
}

// ---------------------------------------------------------------- 2. los turnos
{
  eq(M.ventanaDeTurno(0, 0), [8.5, 19], 'el primer turno: de 8:30 a 19'); eq(M.ventanaDeTurno(1, 3), [11, 21], 'el segundo: de 11 a 21');
  eq(M.ventanaDeTurno(0, 6), null, 'el domingo descansan'); eq(M.ventanaDeTurno(1, 6), null, '… los dos');
  for (let ds = 0; ds < 6; ds++) ok(M.ventanaDeTurno(0, ds) && M.ventanaDeTurno(1, ds), `día ${ds}: trabajan`);
  eq(M.textoTurno(0), 'de 8:30 a 19 h', 'cómo se dice el turno'); eq(M.textoTurno(1), 'de 11 a 21 h', '… el otro');
  eq([M.diaSemana(1), M.diaSemana(6), M.diaSemana(7), M.diaSemana(8)], [0, 5, 6, 0], 'el día 1 es lunes (como la aldea)');
  // dos que se pisan: 1 − (1 − a)(1 − b)
  const l = [{ k: 'madre', turno: 0, alta: 0, dias: 12 }, { k: 'padre', turno: 1, alta: 0, dias: 12 }];
  const abs = (dia, h) => dia * 24 + h;
  eq(M.cobertura(l, 'almacen', abs(2, 7), () => 1).activos.length, 0, 'a las 7 no hay nadie');
  eq(M.cobertura(l, 'almacen', abs(2, 9), () => 1).activos.length, 1, 'a las 9 sólo el primero');
  eq(M.cobertura(l, 'almacen', abs(2, 15), () => 1).activos.length, 2, 'a las 15 los dos');
  eq(M.cobertura(l, 'almacen', abs(2, 20), () => 1).activos.length, 1, 'a las 20 sólo el segundo');
  eq(M.cobertura(l, 'almacen', abs(2, 21.5), () => 1).activos.length, 0, 'a las 21:30 nadie');
  eq(M.cobertura(l, 'almacen', abs(7, 15), () => 1).activos.length, 0, 'el domingo, nadie');
  const dos = M.cobertura(l, 'almacen', abs(2, 15), () => 1), una = M.cobertura(l, 'almacen', abs(2, 9), () => 1);
  const [a, b] = dos.activos.map((x) => x.r);
  cerca(dos.e, 1 - (1 - a) * (1 - b), 1e-9, 'juntos rinden 1 − (1 − a)(1 − b)');
  ok(dos.e > una.e && dos.e < 1, `y se nota: ${una.e.toFixed(2)} → ${dos.e.toFixed(2)} (nunca el 100 %)`);
  ok(!M.enTurno({ ...l[0], alta: abs(2, 12) }, abs(2, 10)) && M.enTurno({ ...l[0], alta: abs(2, 12) }, abs(2, 13)), 'no trabaja antes de que lo contrates');
}

// ---------------------------------------------------------------- 3. contratar y despedir
{
  const Em = M.empleadosNuevo();
  const base = { tipo: 'almacen', dia: 3, abs: 3 * 24 + 10 };
  eq(M.contratar(Em, 'madre', { ...base, tipo: null, puntos: 60 }).motivo, 'sin-local', 'sin local no se contrata');
  eq(M.contratar(Em, 'jefe', { ...base, puntos: 200 }).motivo, 'no-contrata', 'el jefe de estación, no');
  eq(M.contratar(Em, 'madre', { ...base, puntos: 10 }).motivo, 'amistad', 'sin amistad, no');
  eq(M.contratar(Em, 'panadera', { ...base, puntos: 40 }).motivo, 'dueno', 'la dueña de un local, sólo de amiga');
  eq(M.cuantosEmpleados(Em), 0, 'y no se anotó nada');
  const r1 = M.contratar(Em, 'madre', { ...base, puntos: 60 });
  ok(r1.ok && r1.emp.turno === 0 && r1.emp.sueldo === M.sueldoPara('madre', 'almacen', 'normal') && r1.emp.dias === 0 && r1.emp.pagadoDia === 3 && r1.emp.impagos === 0, 'el primero: turno 0, su sueldo, el día de hoy ya cuenta como pagado (de prueba)');
  eq(M.contratar(Em, 'madre', { ...base, puntos: 60 }).motivo, 'ya', 'al mismo no se lo contrata dos veces');
  const r2 = M.contratar(Em, 'padre', { ...base, puntos: 35 });
  ok(r2.ok && r2.emp.turno === 1 && r2.oferta.trato === 'desgana', 'el segundo: turno 1, y de mala gana si es conocido');
  eq(M.contratar(Em, 'modista', { ...base, puntos: 100 }).motivo, 'lleno', 'un tercero, no');
  eq(Em.total.contratados, 2, 'se cuentan los contratados');
  eq(Em.visita, 3, 'y hoy pasaste por el local');
  // despedir al primero y contratar a otro: ocupa el turno que quedó libre
  const p = { modo: 'relax', dia: 3, horas: 10, economia: { ...E.economiaNueva(), pesos: 5000 } };
  const est = nuevoLocal();
  let cambio = null;
  const d1 = M.despedir(p, est, Em, 'madre', { abs: 3 * 24 + 12, nombre: (k) => k, cambiarAmistad: (k, q) => { cambio = [k, q]; } });
  ok(d1.ok && M.cuantosEmpleados(Em) === 1 && !M.empleadoDe(Em, 'madre') && d1.pago === null, 'despedir: se va (el primer día no se le paga: es de prueba)');
  eq(cambio, ['madre', M.AMISTAD_EMP.despedido], 'y se lo toma mal (la amistad baja)');
  eq(M.despedir(p, est, Em, 'madre', {}).motivo, 'no-esta', 'despedir a quien no está, no hace nada');
  const r3 = M.contratar(Em, 'modista', { ...base, puntos: 100 });
  ok(r3.ok && r3.emp.turno === 0, 'el que viene toma el turno que quedó libre');
  // despedir a mitad de la semana, con el turno empezado: se le paga el día de hoy
  const Ed = M.empleadosNuevo();
  const rd = M.contratar(Ed, 'madre', { tipo: 'almacen', dia: 2, abs: 2 * 24 + 9, puntos: 60 });
  const p2 = { modo: 'relax', dia: 4, horas: 12, economia: { ...E.economiaNueva(), pesos: 10000 } }, est2 = nuevoLocal(); est2.caja = 300;
  const d2 = M.despedir(p2, est2, Ed, 'madre', { abs: 4 * 24 + 12 });
  ok(d2.pago?.ok && d2.pago.monto === rd.emp.sueldo && rd.emp.dias === 1, `si hoy ya trabajó (y no es su primer día) se le paga el día al despedirlo: $${d2.pago?.monto}`);
}

// ---------------------------------------------------------------- 4. las ventas sin vos
// El mismo jugador de siempre (negocio-propio), atendiendo todo el día, contra los vecinos solos.
function conVos(tipo = 'almacen', dias = 24, atiende = 8) {
  const est = nuevoLocal(tipo), cola = N.colaNueva(); let ventas = 0, costo = 0;
  for (let d = 1; d <= dias; d++) {
    N.ponerAlDia(est, d); surtidoBueno(est);
    for (let h = N.HORA_ABRE; h < N.HORA_CIERRA; h++) for (let s = 0; s < 75; s++) {
      N.avanzarCola(cola, est, tipo, 1, 1 / 75, { hora: h + s / 75, dia: d, presente: true });
      for (const c of cola.clientes) if (!c.listo && c.edad >= 8) c.listo = true;
      const c = N.primeroEnLaCola(cola);
      if (c && c.espera >= atiende) { const r = N.despachar(est, c); cola.clientes.splice(cola.clientes.indexOf(c), 1); if (r.ok) { ventas += r.total; for (const v of r.vendidos) costo += N.precioPlaza(v.k) * (1 - COMERCIO.margen) * v.n; } }
    }
    est.caja = 0;
  }
  return { ventas: ventas / dias, rep: est.rep, sobre: (ventas - costo) / dias };
}
function sinVos({ tipo = 'almacen', claves = ['madre'], dias = 24, dias0 = 0, amistad = 'amigo', dia0 = 1, abierto = true, surtir = true, p = null } = {}) {
  const est = nuevoLocal(tipo); est.abierto = abierto;
  const Em = M.empleadosNuevo();
  const pp = p || { modo: 'relax', dia: 1, horas: 0, economia: { ...E.economiaNueva(), pesos: 1e8 } };
  for (const k of claves) { const r = M.contratar(Em, k, { tipo, dia: dia0, abs: dia0 * 24, puntos: PUNTOS[amistad] }); r.emp.dias = dias0; }
  let ventas = 0, sueldos = 0, trabajados = 0, eventos = [], costo = 0;
  for (let d = dia0; d < dia0 + dias; d++) {
    pp.dia = d;
    N.ponerAlDia(est, d); if (surtir) surtidoBueno(est);
    const v0 = est.total.ventas, antes = { ...est.stock };
    const ev = M.avanzarEmpleados(pp, est, tipo, Em, { abs: (d + 1) * 24, presente: false, nivel: () => M.nivelPorPuntos(PUNTOS[amistad]), nombre: (k) => k });
    eventos.push(...ev);
    ventas += est.total.ventas - v0;
    for (const k of Object.keys(antes)) costo += N.precioPlaza(k) * (1 - COMERCIO.margen) * Math.max(0, antes[k] - (est.stock[k] || 0));
    for (const e of ev) if (e.tipo === 'sueldo') sueldos += e.monto;
    if (M.diaSemana(d) !== 6) trabajados++;
    est.caja = 0; Em.visita = d + 1;
  }
  return { sobreMercado: (ventas - costo - sueldos) / dias, ventas: ventas / dias, porDiaTrabajado: ventas / Math.max(1, trabajados), sueldos: sueldos / dias, est, Em, eventos, p: pp, cuantos: Em.lista.length };
}
{
  // sin empleados, con vos lejos: no se vende nada (como siempre)
  const est = nuevoLocal(); surtidoBueno(est);
  const Em = M.empleadosNuevo();
  const r0 = M.simularTramo(est, 'almacen', Em, 2 * 24, 3 * 24, {});
  ok(r0.ventas === 0 && r0.clientes === 0 && est.total.ventas === 0, 'sin empleados no se vende solo');
  // con uno: sólo en turno
  const p = { modo: 'relax', dia: 2, horas: 0, economia: { ...E.economiaNueva(), pesos: 5000 } };
  M.contratar(Em, 'madre', { tipo: 'almacen', dia: 2, abs: 2 * 24, puntos: 60 });
  const antes = M.simularTramo(est, 'almacen', Em, 2 * 24 + 0, 2 * 24 + 8.5, {});
  ok(antes.ventas === 0, 'de 0 a 8:30, antes del turno, no se vende');
  const en = M.simularTramo(est, 'almacen', Em, 2 * 24 + 8.5, 2 * 24 + 19, {});
  ok(en.ventas > 0 && en.clientes > 0 && en.porEmp.madre.ventas === en.ventas, `en el turno vende ($${en.ventas}) y lo anota a su nombre`);
  ok(est.caja === en.ventas, 'lo vendido está en la caja');
  const despues = M.simularTramo(est, 'almacen', Em, 2 * 24 + 19, 2 * 24 + 24, {});
  ok(despues.ventas === 0, 'después del turno, no');
  const dom = M.simularTramo(est, 'almacen', Em, 7 * 24, 8 * 24, {});
  ok(dom.ventas === 0, 'el domingo no hay turno: no se vende');
  // el stock baja de verdad
  ok(N.unidadesEnEstantes(est) < Object.values(PROD).reduce((s, c) => s + c, 0), 'el stock de los estantes bajó (no hay venta de la nada)');
  // cerrado: no vende
  const cerrado = nuevoLocal(); surtidoBueno(cerrado); cerrado.abierto = false;
  const Ec = M.empleadosNuevo(); M.contratar(Ec, 'madre', { tipo: 'almacen', dia: 2, abs: 2 * 24, puntos: 60 });
  eq(M.simularTramo(cerrado, 'almacen', Ec, 2 * 24, 3 * 24, {}).ventas, 0, 'con el local cerrado no se vende');
  // sin nada en los estantes: no vende
  const vacio = nuevoLocal();
  eq(M.simularTramo(vacio, 'almacen', Ec, 2 * 24, 3 * 24, {}).ventas, 0, 'sin mercadería no se vende');
  // la caja con tope
  const lleno = nuevoLocal(); surtidoBueno(lleno); lleno.caja = N.CAJA_MAX - 50;
  const Ell = M.empleadosNuevo(); M.contratar(Ell, 'madre', { tipo: 'almacen', dia: 2, abs: 2 * 24, puntos: 60 });
  const rl = M.simularTramo(lleno, 'almacen', Ell, 2 * 24, 3 * 24, {});
  ok(lleno.caja <= N.CAJA_MAX && rl.cajaLlena, 'con la caja casi llena no entra más de $12.000 y avisa que se llenó');
  // la lluvia, el tipo equivocado
  const otro = nuevoLocal('panaderia'); surtidoBueno(otro);
  eq(M.simularTramo(otro, 'almacen', Ec, 2 * 24, 3 * 24, {}).ventas, 0, 'si el local es de otro tipo que el que se mira, no se mezcla');
  // determinista
  const a = sinVos({ dias: 12 }), b = sinVos({ dias: 12 });
  eq(a.ventas, b.ventas, 'la misma cuenta da lo mismo (no hay azar suelto)');
  ok(!/Math\.random/.test(leer('src/empleados-negocio.js')), 'las reglas no usan azar suelto');

  // el equilibrio: qué fracción de lo que harías vos, por día de trabajo
  const vos = conVos();
  const uno0 = sinVos({ dias0: 0 }), uno12 = sinVos({ dias0: 12 }), uno40 = sinVos({ dias0: 40 });
  const frac = (x) => x.porDiaTrabajado / vos.ventas;
  ok(frac(uno0) >= 0.35 && frac(uno0) <= 0.65, `un empleado recién llegado vende ${(frac(uno0) * 100).toFixed(0)} % de lo que vendés vos por día de trabajo (35 a 65 %)`);
  ok(frac(uno12) > frac(uno0) && frac(uno40) >= frac(uno12) - 0.02, `con los días mejora: ${(frac(uno0) * 100).toFixed(0)} % → ${(frac(uno12) * 100).toFixed(0)} % → ${(frac(uno40) * 100).toFixed(0)} %`);
  ok(frac(uno40) <= 0.85, 'y no pasa del 85 %: nunca vende más que vos');
  const dos = sinVos({ claves: ['madre', 'padre'], dias0: 12 });
  ok(dos.ventas > uno12.ventas && dos.porDiaTrabajado / vos.ventas <= 1.3, `dos empleados venden más (${(dos.porDiaTrabajado / vos.ventas * 100).toFixed(0)} % de lo tuyo por día de trabajo: el local atendido todo el día y con fama sube la demanda) sin pasarse de 1,3 veces`);
  // los sueldos y la ganancia neta de caja (ventas − sueldos)
  ok(uno12.sueldos > 0 && uno12.sueldos < uno12.ventas, `un empleado se paga con lo que vende (sueldo $${Math.round(uno12.sueldos)}/día contra ventas $${Math.round(uno12.ventas)}/día)`);
  const netoUno = uno12.ventas - uno12.sueldos, netoDos = dos.ventas - dos.sueldos;
  ok(netoUno >= 1500 && netoUno < vos.ventas * 0.6, `neto de caja con uno: $${Math.round(netoUno)}/día (menos que los $${Math.round(vos.ventas)} que hacés vos)`);
  ok(netoDos < vos.ventas, `con dos: $${Math.round(netoDos)}/día, menos que atendiendo vos ($${Math.round(vos.ventas)})`);
  // el ajuste: contra vender lo mismo al mercado, un empleado de 12 días gana; el segundo suma de verdad
  ok(uno12.sobreMercado >= 200 && uno12.sobreMercado <= 800, `un empleado (12 días) gana $${Math.round(uno12.sobreMercado)}/día sobre venderlo al mercado (de $200 a $800, ya pagado el sueldo)`);
  ok(uno0.sobreMercado > 0, `y el recién llegado también: $${Math.round(uno0.sobreMercado)}/día`);
  const dos40 = sinVos({ claves: ['madre', 'padre'], dias0: 40 }), uno40b = sinVos({ claves: ['padre'], dias0: 40 });
  ok(dos40.sobreMercado - uno40b.sobreMercado >= 350 && dos40.sobreMercado - uno40b.sobreMercado <= 800, `el segundo suma $${Math.round(dos40.sobreMercado - uno40b.sobreMercado)}/día más (de $350 a $800): $${Math.round(uno40b.sobreMercado)} con uno, $${Math.round(dos40.sobreMercado)} con dos`);
  ok(dos40.sobreMercado < vos.sobre, `y con dos sigue por debajo de lo que ganás vos atendiendo ($${Math.round(dos40.sobreMercado)} vs $${Math.round(vos.sobre)})`);
  // con poca mercadería el empleado no se paga: hay que surtir
  const chico = sinVos({ dias0: 12 });
  const pobre = (() => { const est = nuevoLocal(); const Em = M.empleadosNuevo(); M.contratar(Em, 'madre', { tipo: 'almacen', dia: 1, abs: 24, puntos: 60 }); Em.lista[0].dias = 12; let v = 0, s = 0; const pp = { modo: 'relax', dia: 1, horas: 0, economia: { ...E.economiaNueva(), pesos: 1e8 } }; for (let d = 1; d <= 24; d++) { pp.dia = d; N.ponerAlDia(est, d); for (const [k, c] of Object.entries({ huevo: 6, papa: 4, miel: 2, tronco: 4 })) N.surtir(est, k, c, ilimitado); const v0 = est.total.ventas; const ev = M.avanzarEmpleados(pp, est, 'almacen', Em, { abs: (d + 1) * 24, presente: false, nivel: () => 1, nombre: (k) => k }); v += est.total.ventas - v0; for (const e of ev) if (e.tipo === 'sueldo') s += e.monto; est.caja = 0; Em.visita = d + 1; } return { ventas: v / 24, sueldos: s / 24 }; })();
  ok(pobre.ventas - pobre.sueldos < chico.ventas - chico.sueldos - 500, `con un surtido chico rinde mucho menos neto ($${Math.round(pobre.ventas - pobre.sueldos)} vs $${Math.round(chico.ventas - chico.sueldos)}/día): hay que surtir`);
  // la fama: se mueve como con cualquier venta
  ok(uno12.est.rep > N.REP_INICIAL - 1, 'la fama no baja por vender sin vos (sube un poco con la atención)');
  // la caja se llena y deja de vender: no se acumula sin tope
  const sinRetirar = (() => { const est = nuevoLocal(); const Em = M.empleadosNuevo(); M.contratar(Em, 'madre', { tipo: 'almacen', dia: 1, abs: 24, puntos: 60 }); const pp = { modo: 'relax', dia: 1, horas: 0, economia: { ...E.economiaNueva(), pesos: 1e8 } }; for (let d = 1; d <= 5; d++) { pp.dia = d; N.ponerAlDia(est, d); for (const [k] of Object.entries(PROD)) N.surtir(est, k, 1e5, ilimitado); M.avanzarEmpleados(pp, est, 'almacen', Em, { abs: (d + 1) * 24, presente: false, nivel: () => 1, nombre: (k) => k }); Em.visita = d + 1; } return est; })();
  ok(sinRetirar.caja <= N.CAJA_MAX, 'sin retirar la caja nunca pasa del tope');
}

// ---------------------------------------------------------------- 5. sueldos, impagos, renuncias y el resumen
{
  const mk = (pesos, caja = 0) => {
    const est = nuevoLocal(); est.caja = caja;
    const Em = M.empleadosNuevo(); const r = M.contratar(Em, 'madre', { tipo: 'almacen', dia: 1, abs: 1 * 24 + 9, puntos: 60 });
    const p = { modo: 'relax', dia: 1, horas: 0, economia: { ...E.economiaNueva(), pesos } };
    return { est, Em, emp: r.emp, p };
  };
  const env = (abs, extra = {}) => ({ abs, presente: true, nivel: () => 1, nombre: (k) => k, cambiarAmistad: (k, q) => { env.amistad.push([k, q]); }, ...extra });
  env.amistad = [];
  // el primer día es de prueba: no se paga
  let { est, Em, emp, p } = mk(5000, 3000);
  let ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(1 * 24 + 20));
  eq(ev.filter((e) => e.tipo === 'sueldo').length, 0, 'el día en que lo contratás es de prueba: sin sueldo');
  // el 2.º día (martes) se paga al cerrar el turno, no antes
  ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(2 * 24 + 18));
  eq(ev.filter((e) => e.tipo === 'sueldo').length, 0, 'antes de que cierre el turno (19), no se cobra');
  ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(2 * 24 + 19.1));
  const s1 = ev.find((e) => e.tipo === 'sueldo');
  ok(s1 && s1.monto === emp.sueldo && s1.deCaja === emp.sueldo && s1.deBilletera === 0, `al cerrar el turno cobra $${emp.sueldo}, de la caja del local`);
  eq(est.caja, 3000 - emp.sueldo, 'la caja bajó lo que se pagó');
  eq(E.pesosDe(p), 5000, 'y la billetera no se tocó');
  eq(emp.dias, 1, 'y suma un día de trabajo');
  eq(Em.total.sueldos, emp.sueldo, 'se cuenta lo pagado');
  // la caja no alcanza: completa la billetera
  ({ est, Em, emp, p } = mk(5000, 400));
  M.avanzarEmpleados(p, est, 'almacen', Em, env(1 * 24 + 20));
  ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(2 * 24 + 19.5));
  const s2 = ev.find((e) => e.tipo === 'sueldo');
  ok(s2 && s2.deCaja === 400 && s2.deBilletera === emp.sueldo - 400 && est.caja === 0 && E.pesosDe(p) === 5000 - (emp.sueldo - 400), 'si la caja no alcanza, el resto sale de tu billetera');
  ok(p.economia.libro.at(-1).monto === -(emp.sueldo - 400) && /Sueldo/.test(p.economia.libro.at(-1).motivo), 'y queda en el libro de la billetera como «Sueldo: …»');
  // el domingo no se paga ni se cuenta
  ({ est, Em, emp, p } = mk(50000, 5000));
  emp.pagadoDia = 6;   // el sábado (día 6) ya está pagado
  ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(7 * 24 + 21));
  eq(ev.filter((e) => e.tipo === 'sueldo').length, 0, 'el domingo (día 7) no cobra');
  eq(emp.pagadoDia, 7, '… y queda saldado');
  // varios días de golpe (dormiste de largo, o estuviste lejos): se pagan todos los que corresponden
  ({ est, Em, emp, p } = mk(50000, 0));
  ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(5 * 24 + 20, { presente: true }));
  eq(ev.filter((e) => e.tipo === 'sueldo').length, 4, 'si pasan 4 días de trabajo de golpe se pagan los 4 (martes a viernes)');
  eq(E.pesosDe(p), 50000 - 4 * emp.sueldo, '… de la billetera');
  // el impago
  ({ est, Em, emp, p } = mk(100, 0));
  env.amistad.length = 0;
  ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(2 * 24 + 20));
  ok(ev.some((e) => e.tipo === 'impago' && e.debe === emp.sueldo) && emp.impagos === 1 && M.cuantosEmpleados(Em) === 1, 'sin con qué pagar: se anota el impago y se queda');
  eq(E.pesosDe(p), 100, 'y no se descuenta nada');
  // si juntás la plata, se paga lo de los dos días de una
  p.economia.pesos = 20000;
  ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(3 * 24 + 20));
  const sd = ev.find((e) => e.tipo === 'sueldo');
  ok(sd && sd.monto === emp.sueldo * 2 && emp.impagos === 0, 'si al otro día podés, se le paga lo que se debía más lo de hoy');
  // dos impagos seguidos: renuncia
  ({ est, Em, emp, p } = mk(100, 0));
  env.amistad.length = 0;
  M.avanzarEmpleados(p, est, 'almacen', Em, env(2 * 24 + 20));
  ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(3 * 24 + 20));
  ok(ev.some((e) => e.tipo === 'renuncia' && e.motivo === 'impago') && M.cuantosEmpleados(Em) === 0 && Em.total.renuncias === 1, 'dos impagos seguidos: renuncia');
  ok(env.amistad.some(([k, q]) => k === 'madre' && q === M.AMISTAD_EMP.impago), 'y la amistad cae');
  // no pasás por el local: a los 5 días se van
  ({ est, Em, emp, p } = mk(100000, 0));
  env.amistad.length = 0;
  ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(5 * 24 + 12, { presente: false }));
  eq(M.cuantosEmpleados(Em), 1, 'a los 4 días sin pasar siguen');
  ev = M.avanzarEmpleados(p, est, 'almacen', Em, env(7 * 24 + 12, { presente: false }));
  ok(ev.some((e) => e.tipo === 'renuncia' && e.motivo === 'ausencia') && M.cuantosEmpleados(Em) === 0, 'a los 6 días sin que pases, renuncian (el tope de lo que se acumula)');
  ok(env.amistad.some(([k, q]) => q === M.AMISTAD_EMP.ausencia), 'con un poco de enojo');
  // pasando por el local, no
  ({ est, Em, emp, p } = mk(100000, 0));
  for (let d = 2; d <= 14; d++) M.avanzarEmpleados(p, est, 'almacen', Em, env(d * 24 + 12, { presente: true }));
  eq(M.cuantosEmpleados(Em), 1, 'pasando por el local no se van');
  // la amistad sube con los días pagos
  env.amistad.length = 0;
  ({ est, Em, emp, p } = mk(100000, 0));
  for (let d = 2; d <= 14; d++) M.avanzarEmpleados(p, est, 'almacen', Em, env(d * 24 + 20, { presente: true }));
  ok(env.amistad.filter(([, q]) => q === M.AMISTAD_EMP.suma).length >= 2, 'cada 4 días pagados la amistad suma un poco');
  // lo vendido sin vos se acumula en lo pendiente y se cuenta al volver
  ({ est, Em, emp, p } = mk(100000, 0));
  surtidoBueno(est);
  for (let d = 2; d <= 5; d++) { N.ponerAlDia(est, d); M.avanzarEmpleados(p, est, 'almacen', Em, env(d * 24 + 22, { presente: false })); Em.visita = d; }
  ok(Em.pend.ventas > 0 && Em.pend.clientes > 0 && Em.pend.porEmp.madre.ventas === Em.pend.ventas && Em.pend.sueldos > 0, `lo pendiente: vendió $${Em.pend.ventas} (${Em.pend.clientes} clientes) y se pagaron $${Em.pend.sueldos} de sueldo`);
  ok(M.hayPendiente(Em), 'hay algo para contar');
  const res = M.resumenAlVolver(Em, (k) => (k === 'madre' ? 'Gladys' : k));
  ok(/^Mientras no estabas, se vendió \$/.test(res.titulo) && /Gladys vendió \$[\d.]+ \(\d+ clientes?\)/.test(res.sub) && /Sueldos pagados/.test(res.sub), `el resumen: «${res.titulo}» · «${res.sub}»`);
  M.limpiarPendiente(Em);
  ok(!M.hayPendiente(Em) && M.resumenAlVolver(Em) === null, 'y se limpia');
  // con vos presente no se simula nada (atendés vos)
  const e2 = nuevoLocal(); surtidoBueno(e2);
  const E2 = M.empleadosNuevo(); M.contratar(E2, 'madre', { tipo: 'almacen', dia: 1, abs: 24, puntos: 60 });
  M.avanzarEmpleados({ modo: 'relax', dia: 3, economia: { ...E.economiaNueva(), pesos: 1e5 } }, e2, 'almacen', E2, env(3 * 24 + 18, { presente: true }));
  eq(e2.total.ventas, 0, 'con vos presente, el paso del tiempo no vende nada por su cuenta');
  // un tope de horas simuladas: ausencia larga
  const e3 = nuevoLocal(); surtidoBueno(e3); const E3 = M.empleadosNuevo(); M.contratar(E3, 'madre', { tipo: 'almacen', dia: 1, abs: 24, puntos: 60 });
  E3.visita = 100;   // (como si pasaras seguido)
  const t0 = Date.now();
  M.avanzarEmpleados({ modo: 'relax', dia: 90, economia: { ...E.economiaNueva(), pesos: 1e6 } }, e3, 'almacen', E3, env(90 * 24 + 12, { presente: false }));
  ok(Date.now() - t0 < 5000, 'una ausencia larga se cuenta rápido (la cuenta tiene tope de horas; el margen aguanta una PC cargada)');
  ok(e3.total.ventas < 16000, `y tiene tope en lo que se vende: $${e3.total.ventas}`);
}

// ---------------------------------------------------------------- 6. cuando estás: ayudan
{
  const Em = M.empleadosNuevo(); M.contratar(Em, 'madre', { tipo: 'almacen', dia: 1, abs: 24, puntos: 60 });
  Em.lista[0].dias = 12;
  const cola = N.colaNueva();
  const cl = (espera, listo = true) => ({ perfil: 'vecina', pide: [{ k: 'huevo', n: 2 }], paciencia: 60, espera, edad: 20, listo, frase: 0 });
  cola.clientes.push(cl(3), cl(5, false));
  const abs = 3 * 24 + 12;
  eq(M.elegirAyuda(cola, Em, 'almacen', abs, () => 1, 1), [], 'si recién llegó, no ayuda: atendés vos');
  cola.clientes[0].espera = 30;
  const a1 = M.elegirAyuda(cola, Em, 'almacen', abs, () => 1, 1);
  ok(a1.length === 1 && a1[0].c === cola.clientes[0] && a1[0].emp === Em.lista[0], 'el que ya esperó lo despacha el empleado');
  cola.clientes.push(cl(40));
  eq(M.elegirAyuda(cola, Em, 'almacen', abs, () => 1, 1), [], 'ocupado con uno, no toma otro enseguida');
  ok(M.elegirAyuda(cola, Em, 'almacen', abs, () => 1, 10).length === 1, 'pasados unos segundos, sí');
  const fuera = M.elegirAyuda(cola, Em, 'almacen', 3 * 24 + 22, () => 1, 99);
  eq(fuera, [], 'fuera de su turno no ayuda');
  const noListo = N.colaNueva(); noListo.clientes.push(cl(50, false));
  eq(M.elegirAyuda(noListo, Em, 'almacen', abs, () => 1, 99), [], 'al que todavía viene caminando no lo atiende');
  ok(M.AYUDA.esperaBase - M.AYUDA.esperaRend * 0.9 > 8, 'espera más que lo que tardás vos en promedio (8 s): atendés vos primero');
}

// ---------------------------------------------------------------- 7. el guardado
{
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
  const G = await import('../src/guardado.js');
  G.usarModoGuardado('relax', 1);
  const nueva = G.progresoNuevo();
  eq(nueva.empleadosNegocio, M.empleadosNuevo(), 'una partida nueva del Relax arranca sin empleados');
  ok(nueva.empleadosNegocio.v === 1 && nueva.empleadosNegocio.lista.length === 0 && nueva.empleadosNegocio.sim.ultima === 0, '… con los valores por defecto');
  G.usarModoGuardado('desafio', 1);
  ok(G.progresoNuevo().empleadosNegocio === undefined, 'la del Desafío no tiene empleados');
  G.usarModoGuardado('relax', 1);
  // una partida de antes (sin el campo) se carga igual, con el campo nuevo vacío y todo lo demás intacto
  const neg = N.negocioPropioNuevo(); neg.tipo = 'almacen'; neg.abierto = true; neg.stock = { huevo: 12 }; neg.caja = 700;
  ok(G.escribirPartida('relax', 1, { modo: 'relax', dia: 12, horas: 10, economia: { ...E.economiaNueva(), pesos: 900 }, negocioPropio: neg }), 'se guarda una partida de antes de los empleados');
  let r = G.leerPartida('relax', 1).progreso;
  eq(r.empleadosNegocio, M.empleadosNuevo(), 'la partida vieja recibe un campo vacío');
  eq([r.economia.pesos, r.negocioPropio.caja, r.negocioPropio.stock], [900, 700, { huevo: 12 }], 'y no se toca nada más (ni la plata, ni tu local, ni los estantes)');
  // con empleados vuelve igual
  const Em = M.empleadosNuevo();
  M.contratar(Em, 'madre', { tipo: 'almacen', dia: 10, abs: 10 * 24 + 9, puntos: 60 }); M.contratar(Em, 'padre', { tipo: 'almacen', dia: 11, abs: 11 * 24 + 9, puntos: 150 });
  Em.lista[0].dias = 5; Em.lista[0].vendido = 4200; Em.lista[0].clientes = 9; Em.lista[0].impagos = 1; Em.lista[0].pagadoDia = 11; Em.visita = 11; Em.sim = { ultima: 11 * 24 + 12.5, acum: 0.4, n: 17 };
  Em.pend = { ventas: 1800, clientes: 4, sueldos: 1500, cajaLlena: true, porEmp: { madre: { ventas: 1800, clientes: 4 } }, repuesto: {} }; Em.total = { contratados: 3, despedidos: 1, renuncias: 0, vendido: 9000, sueldos: 6000 };
  G.escribirPartida('relax', 2, { modo: 'relax', dia: 12, horas: 10, economia: E.economiaNueva(), empleadosNegocio: Em });
  r = G.leerPartida('relax', 2).progreso;
  eq(r.empleadosNegocio, Em, 'los empleados vuelven igual (turnos, días, ventas, impagos, lo pendiente)');
  // el Desafío no lo trae aunque venga en el archivo
  G.escribirPartida('desafio', 1, { modo: 'desafio', dia: 3, horas: 10, empleadosNegocio: Em });
  ok(G.leerPartida('desafio', 1).progreso.empleadosNegocio === undefined, 'el Desafío no tiene empleados aunque el archivo lo traiga');
  // basura
  const basura = [null, 7, 'x', [], {}, { lista: 'x' }, { lista: [null, 3, { k: 'jefe' }, { k: 'madre', turno: 9, alta: 'x', dias: -4, sueldo: 1e9, pagadoDia: 1e9, impagos: 99, vendido: 'a' }, { k: 'madre' }, { k: 'padre', turno: 0 }, { k: 'modista' }] },
    { lista: [], sim: { ultima: 1e12, acum: -3, n: 'x' }, visita: 1e9, pend: { ventas: -5, porEmp: { jefe: { ventas: 5 }, madre: 'x' } }, total: 'x' }];
  for (const rota of basura) {
    const s = M.sanearEmpleadosNegocio(rota, 20);
    ok(s.v === 1 && Array.isArray(s.lista) && s.lista.length <= 2, `basura (${JSON.stringify(rota)?.slice(0, 30)}): un estado sano`);
    ok(s.lista.every((x) => M.esCandidato(x.k) && x.sueldo >= 600 && x.sueldo <= 1200 && x.dias >= 0 && x.pagadoDia <= 20 && x.impagos < M.IMPAGOS_MAX && (x.turno === 0 || x.turno === 1)), '… con los empleados en su rango');
    ok(new Set(s.lista.map((x) => x.k)).size === s.lista.length && new Set(s.lista.map((x) => x.turno)).size === s.lista.length, '… sin repetidos y cada uno en su turno');
    ok(s.sim.ultima <= 20 * 24 + 24 && s.sim.acum >= 0 && s.sim.acum <= 50 && s.visita <= 20 && s.pend.ventas >= 0 && Object.keys(s.pend.porEmp).every(M.esCandidato), '… el tiempo y lo pendiente en rango');
  }
}

// ---------------------------------------------------------------- 8. el juego completo, con un contexto de mentira
// (un local, una cola, gente de mentira y un progreso: se empuja el tiempo con __tick)
function entorno({ puntos = 60, dia = 2, horas = 10, pesos = 20000, lejos = false } = {}) {
  const progreso = { modo: 'relax', dia, horas, economia: { ...E.economiaNueva(), pesos }, aldea: A.aldeaNueva(), vecindad: V.vecindadNueva() };
  const o = { plano: { id: 'local-almacen' }, datos: { x: 200, z: 300, rot: 0.5, etapas: 1 } };
  const est = N.negocioPropioNuevo(); est.tipo = 'almacen'; est.abierto = true; progreso.negocioPropio = est; surtidoBueno(est);
  progreso.empleadosNegocio = M.empleadosNuevo();
  const js = { estado: { pos: { x: o.datos.x, z: o.datos.z - 6 } } };
  if (lejos) js.estado.pos = { x: o.datos.x + 400, z: o.datos.z };
  const cola = N.colaNueva();
  const notas = [], guardados = [], quitados = [];
  let sinLocal = false;
  const negocio = {
    estado: () => progreso.negocioPropio, cola, local: () => (sinLocal ? null : o), distancia: (ob) => Math.hypot(ob.datos.x - js.estado.pos.x, ob.datos.z - js.estado.pos.z),
    aMundo: (ob, lx, lz) => { const r = ob.datos.rot || 0, c = Math.cos(r), s = Math.sin(r); return { x: ob.datos.x + lx * c + lz * s, z: ob.datos.z - lx * s + lz * c }; },
    medidas: (ob) => PN.MEDIDAS[ob.plano.id], panelAbierto: () => false, redibujar: () => { negocio.redibujos++; }, redibujos: 0,
    atender: (c, quien) => { const r = N.despachar(progreso.negocioPropio, c); if (!r.ok) return false; cola.clientes.splice(cola.clientes.indexOf(c), 1); negocio.atendidos.push([quien, r.total]); return true; }, atendidos: [],
  };
  const gente = { armarPobladorDeAPoco: (def) => { const npc = { clave: def.clave, nombre: def.nombre, pos: { x: def.pos.x, y: 0, z: def.pos.z, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, dormido: false, camino: [], def }; const t = { npc: null, avanzar: () => { t.npc = npc; return true; } }; return t; }, quitar: (npc) => quitados.push(npc) };
  const ctx = {
    progreso: () => progreso, negocio: () => negocio, gente: () => gente, nota: (t, s, nueva) => notas.push([t, s, nueva]), guardar: () => guardados.push(1), refrescarBarra: () => {},
    sonido: () => ({ juntar() {} }), lluvia: () => 0, alturaDePie: (x, z, y) => 0.3, msFigura: () => 3, alClic: (el, fn) => { el.onclick = fn; },
  };
  const juego = J.crearEmpleadosNegocioJuego(ctx);
  return { progreso, o, est, js, cola, notas, guardados, quitados, negocio, juego, gente, sinLocal: (v) => { sinLocal = v; } };
}
const dar = (progreso, k, pts) => { for (let i = 0; i < 12; i++) V.cambiarAmistad(progreso, k, Math.min(20, pts - V.puntosAmistad(k, progreso)), progreso.dia); };
{
  // contratar desde el panel (la función de la E)
  let X = entorno();
  X.juego.__contratar('madre');   // sin amistad
  eq(X.progreso.empleadosNegocio.lista.length, 0, 'sin amistad no se contrata');
  ok(X.notas.some(([t, s]) => /No se pudo contratar/.test(t) && /todavía no te conoce/.test(s)), `y el aviso lo explica: «${X.notas.at(-1)?.[1]}»`);
  dar(X.progreso, 'madre', 70);
  ok(V.puntosAmistad('madre', X.progreso) >= 50, 'se sube la amistad de la prueba');
  X.notas.length = 0;
  X.juego.__contratar('madre');
  const emp = X.progreso.empleadosNegocio.lista[0];
  ok(emp && emp.k === 'madre' && emp.alta === 2 * 24 + 10, 'con amistad se contrata (desde ahora)');
  ok(X.notas.some(([t, s]) => /Gladys trabaja para vos/.test(t) && /por día/.test(s) && /prueba/.test(s)), `el aviso: «${X.notas.at(-1)?.[0]}» · «${X.notas.at(-1)?.[1]}»`);
  ok(X.guardados.length >= 1 && X.negocio.redibujos >= 1, 'se guarda y se redibuja el panel');
  // un panadero / tercero
  dar(X.progreso, 'panadera', 30);
  X.juego.__contratar('panadera');
  eq(X.progreso.empleadosNegocio.lista.length, 1, 'la dueña de un local, de conocida, no deja su mostrador');
  ok(/tiene su propio local/.test(X.notas.at(-1)[1]), `… «${X.notas.at(-1)[1]}»`);

  // el enganche con la aldea: el vecino deja la aldea durante su turno
  A.fijarOcupacionExterna(X.juego.ocupacion);
  const ds = (dia) => A.diaSemanaDe(dia);
  const rut = (k, h, dia) => A.rutinaAldea(k, h, ds(dia), X.progreso.aldea, dia);
  A.fijarOcupacionExterna(null);
  const antes = [rut('madre', 10, 3), rut('madre', 7, 3), rut('padre', 10, 3)];
  A.fijarOcupacionExterna(X.juego.ocupacion);
  ok(antes[0].lugar !== null, 'sin el enganche, Gladys a las 10 está en la aldea');
  eq(rut('madre', 10, 3).lugar, null, 'de turno (martes 10 h): deja la aldea (queda como «fuera», igual que el chico que estudia afuera)');
  eq(rut('madre', 18.5, 4).lugar, null, 'hasta las 19 (un día sin fiesta)');
  eq(rut('madre', 7, 3), antes[1], 'a las 7, antes del turno, hace lo de siempre');
  eq(rut('madre', 19.5, 3).lugar !== null, true, 'después del turno, vuelve a su vida');
  eq(rut('madre', 10, 7), A.rutinaAldea('madre', 10, 6, X.progreso.aldea, 7), 'el domingo no trabaja');
  ok(rut('madre', 9, 2).lugar !== null, 'el día de la alta, antes de la hora en que la contrataste, sigue como siempre');
  eq(rut('padre', 10, 3), antes[2], 'los demás vecinos siguen igual');
  eq(rut('jefe', 10, 3), A.rutinaAldea('jefe', 10, 2, X.progreso.aldea, 3), 'el jefe de estación, también');
  // el día de su cumpleaños trabaja, pero a la tardecita (la fiesta, de 18 a 20) va a la aldea
  let cumple = 0; for (let d = 3; d < 500; d++) if (A.esCumpleanos('madre', d) && M.diaSemana(d) !== 6) { cumple = d; break; }
  ok(cumple > 0, 'hay un cumpleaños de Gladys en un día de semana');
  eq(X.juego.ocupacion('madre', 10, M.diaSemana(cumple), cumple), true, 'el día de su cumpleaños, a la mañana trabaja');
  eq(X.juego.ocupacion('madre', 18.5, M.diaSemana(cumple), cumple), false, '… y de 18 a 20 va a su fiesta');
  eq(M.enTurno(X.progreso.empleadosNegocio.lista[0], cumple * 24 + 18.5), false, 'y el local lo sabe: tampoco está detrás del mostrador ni vende');
  eq(X.juego.ocupacion('madre', 18.5, M.diaSemana(cumple === 3 ? 4 : 3), cumple === 3 ? 4 : 3), A.esCumpleanos('madre', cumple === 3 ? 4 : 3) ? false : true, 'otro día, a las 18:30 sigue en el local');
  eq(X.juego.ocupacion('madre', 10, 2, null), true, 'sin saber el día, por la hora alcanza');
  eq(X.juego.ocupacion('nadie', 10, 2, 5), false, 'quien no es empleado, no');
  // el Desafío: sin enganche
  const prev = X.progreso.modo; X.progreso.modo = 'desafio'; eq(X.juego.ocupacion('madre', 10, 2, 5), false, 'en el Desafío nadie trabaja ahí'); X.progreso.modo = prev;
  A.fijarOcupacionExterna(null);
  eq(rut('madre', 10, 3), antes[0], 'y soltando el enganche todo vuelve a la normalidad');

  // la figura detrás del mostrador: se arma, aparece en su lugar y entra caminando
  X.progreso.horas = 10; X.progreso.dia = 3;
  X.juego.__tick(2);
  const f = X.juego.figuras.get('madre');
  ok(f && f.npc && f.npc.empleadoNegocio === true && f.npc.sinFrenar === true, 'la figura se armó (marcada como empleada: no se charla)');
  eq(f.npc.def.clave, 'aldea-madre', 'con el cuerpo y la ropa de Gladys');
  ok(f.npc.def.colores && f.npc.def.colores.ropa, '… su ropa');
  X.juego.__tick(2);
  ok(f.fase === 'entra' || f.fase === 'puesto', `a las 10 está de turno y estás cerca: ${f.fase}`);
  ok(!f.npc.dormido, 'despierta (se ve)');
  const D = PN.MEDIDAS['local-almacen'].D, mundo = (lx, lz) => X.negocio.aMundo(X.o, lx, lz);
  const post = mundo(0.7, PN.MOSTRADOR_Z(D) + 0.78);
  // camina hasta el puesto (como lo hace gente.js: sigue el camino)
  for (let i = 0; i < 40 && f.fase === 'entra'; i++) { const w = f.npc.camino?.[0]; if (w) { f.npc.pos.x = w.x; f.npc.pos.z = w.z; f.npc.camino.shift(); } X.juego.__tick(1); }
  eq(f.fase, 'puesto', 'llega a su lugar detrás del mostrador');
  cerca(f.npc.pos.x, post.x, 0.6, 'en el lugar (x)'); cerca(f.npc.pos.z, post.z, 0.6, 'en el lugar (z)');
  // el mostrador está entre él y el frente: está del lado de adentro (más al fondo que el mostrador)
  const mostr = mundo(0.7, PN.MOSTRADOR_Z(D));
  ok(Math.hypot(post.x - mostr.x, post.z - mostr.z) > 0.6, 'a más de medio metro del mostrador, del lado de adentro');
  ok(Number.isFinite(f.npc.miraFinal), 'y mira hacia el frente');
  // pasa el turno: se va caminando
  X.progreso.horas = 19.5; X.juego.__tick(2);
  eq(f.fase, 'sale', 'terminado el turno (19:30) se va caminando');
  for (let i = 0; i < 30 && f.fase === 'sale'; i++) { f.npc.camino = []; X.juego.__tick(1); }
  ok(f.npc.dormido && f.fase === 'libre', 'y la figura queda dormida (ni se dibuja)');
  X.progreso.horas = 10; X.progreso.dia = 4; X.juego.__tick(2);
  ok(!f.npc.dormido && (f.fase === 'entra' || f.fase === 'puesto'), 'al otro día vuelve a su hora');
  // el domingo: no
  X.progreso.dia = 7; X.progreso.horas = 11; for (let i = 0; i < 5; i++) { f.npc.camino = []; X.juego.__tick(1); }
  ok(f.npc.dormido, 'el domingo no está');
  // lejos (más de 130 m): la figura duerme y no se arma otra
  X.progreso.dia = 4; X.progreso.horas = 11; X.js.estado.pos = { x: X.o.datos.x + 300, z: X.o.datos.z };
  for (let i = 0; i < 4; i++) X.juego.__tick(1);
  ok(f.npc.dormido && f.fase === 'libre', 'con vos lejos la figura duerme');

  // las ventas de las horas sin vos y lo que cuenta al volver
  X = entorno({ puntos: 70, dia: 3, horas: 8, lejos: true });
  dar(X.progreso, 'madre', 70);
  X.juego.__contratar('madre');
  const est = X.progreso.negocioPropio;
  const vendidoAntes = est.total.ventas;
  // pasan las horas con vos lejos (de a un segundo de reloj de juego cada tick: 0,1 h por paso)
  for (let h = 8; h <= 19.3; h += 0.2) { X.progreso.horas = h; X.juego.__tick(1); }
  ok(est.total.ventas > vendidoAntes && est.caja > 0, `con vos lejos, vendió solo: $${est.total.ventas - vendidoAntes} en la caja`);
  ok(X.progreso.empleadosNegocio.pend.ventas > 0 && X.notas.every(([t]) => !/Mientras no estabas/.test(t)), 'y no te avisa mientras no estás');
  ok(X.progreso.empleadosNegocio.lista[0].vendido > 0, 'queda anotado a su nombre');
  // volvés: te cuenta
  X.js.estado.pos = { x: X.o.datos.x, z: X.o.datos.z - 6 };
  X.juego.__tick(2);
  const aviso = X.notas.find(([t]) => /Mientras no estabas/.test(t));
  ok(aviso && /Gladys vendió \$/.test(aviso[1]), `al volver: «${aviso?.[0]}» · «${aviso?.[1]}»`);
  ok(!M.hayPendiente(X.progreso.empleadosNegocio), 'y se limpia lo pendiente');
  const cuantos = X.notas.filter(([t]) => /Mientras no estabas/.test(t)).length;
  X.juego.__tick(4);
  eq(X.notas.filter(([t]) => /Mientras no estabas/.test(t)).length, cuantos, 'no lo repite');

  // el sueldo: al cerrar el turno del día siguiente, de la caja; aviso sólo si estás
  X.progreso.dia = 4; X.progreso.horas = 19.5;
  const cajaAntes = est.caja, pesosAntes = E.pesosDe(X.progreso);
  X.notas.length = 0;
  X.juego.__tick(2);
  const sueldo = X.progreso.empleadosNegocio.lista[0].sueldo;
  ok(est.caja === Math.max(0, cajaAntes - sueldo) && E.pesosDe(X.progreso) === pesosAntes - Math.max(0, sueldo - cajaAntes), 'el sueldo del día salió de la caja (y de la billetera lo que faltó)');
  ok(X.notas.some(([t, s]) => /Gladys cobró su sueldo/.test(t)), `aviso con vos presente: «${X.notas.find(([t]) => /cobró/.test(t))?.[0]}»`);

  // ayuda: con vos presente, el cliente que esperó lo despacha ella
  X = entorno({ dia: 4, horas: 12 });
  dar(X.progreso, 'madre', 70); X.juego.__contratar('madre');
  X.progreso.empleadosNegocio.lista[0].dias = 12;
  const c = N.armarCliente(X.est, 'almacen', 'prueba', 12); c.listo = true; c.espera = 40; X.cola.clientes.push(c);
  X.juego.__tick(2);
  ok(X.negocio.atendidos.length === 1 && X.negocio.atendidos[0][0] === 'Gladys' && X.cola.clientes.length === 0, 'el cliente que esperó 40 s lo atendió Gladys');
  const c2 = N.armarCliente(X.est, 'almacen', 'prueba2', 12); c2.listo = true; c2.espera = 2; X.cola.clientes.push(c2);
  X.juego.__tick(1);
  eq(X.negocio.atendidos.length, 1, 'el que recién llegó espera por vos');

  // despedir: dos toques, y la figura se va
  X = entorno({ dia: 4, horas: 12 });
  dar(X.progreso, 'madre', 70); X.juego.__contratar('madre'); X.juego.__tick(2);
  X.juego.ui.despedir = null;
  const ui = X.juego.ui;
  const quedan = () => X.progreso.empleadosNegocio.lista.length;
  const redibujos = X.negocio.redibujos;
  eq(quedan(), 1, 'contratada');
  X.juego.__despedir('madre');
  eq(quedan(), 0, 'despedida');
  ok(X.notas.some(([t]) => /ya no trabaja para vos/.test(t)), 'avisa');
  ok(!X.juego.figuras.has('madre') && X.quitados.length >= 1, 'y su figura se retira');
  ok(V.puntosAmistad('madre', X.progreso) < 70, 'y se lo toma a mal (la amistad baja un poco)');

  // sin local (lo desarmaste): se van, sin multa
  X = entorno({ dia: 4, horas: 12 });
  dar(X.progreso, 'madre', 70); dar(X.progreso, 'padre', 70); X.juego.__contratar('madre'); X.juego.__contratar('padre');
  eq(X.progreso.empleadosNegocio.lista.length, 2, 'dos empleados');
  X.sinLocal(true); X.juego.__tick(1);
  eq(X.progreso.empleadosNegocio.lista.length, 2, 'mientras movés el local (sin obra a la vista) no se van');
  X.sinLocal(false); X.progreso.negocioPropio.tipo = null; X.juego.__tick(1);
  eq(X.progreso.empleadosNegocio.lista.length, 0, 'sin local (desarmado), se van');
  ok(X.notas.some(([t]) => /volvieron a lo suyo/.test(t)), 'avisa');

  // sin plata: el aviso de impago
  X = entorno({ dia: 3, horas: 8, pesos: 50, lejos: true });
  X.progreso.negocioPropio.stock = {};
  dar(X.progreso, 'madre', 70); X.juego.__contratar('madre');
  X.progreso.dia = 4; X.progreso.horas = 20; X.juego.__tick(1);
  ok(X.notas.some(([t, s]) => /No pudiste pagarle a Gladys/.test(t) && /se va/.test(s)), `impago: «${X.notas.at(-1)?.[0]}»`);
  X.progreso.dia = 5; X.progreso.horas = 20; X.juego.__tick(1);
  ok(X.notas.some(([t]) => /Gladys renunció/.test(t)) && X.progreso.empleadosNegocio.lista.length === 0, 'y al segundo, renuncia');
}

// ---------------------------------------------------------------- 9. el panel (con un DOM de mentira)
{
  const crear = (tag) => ({ tag, className: '', textContent: '', children: [], disabled: false, title: '', append(...x) { this.children.push(...x); }, addEventListener() {}, set type(v) {} });
  globalThis.document = { createElement: crear };
  const X = entorno({ dia: 4, horas: 12 });
  const raiz = crear('div');
  X.juego.dibujarPanel(raiz, X.progreso.negocioPropio);
  const textos = (e) => [e.textContent, ...(e.children || []).flatMap(textos)];
  let t = textos(raiz).join(' | ');
  ok(/Empleados/.test(t) && /0 de 2/.test(t) && /Contratar a un vecino/.test(t), `el panel muestra «Empleados · 0 de 2» y el botón de contratar`);
  X.juego.ui.contratando = true;
  const r2 = crear('div'); X.juego.dibujarPanel(r2, X.progreso.negocioPropio);
  t = textos(r2).join(' | ');
  ok(/Gladys · /.test(t) && /Mario · /.test(t) && /Todavía no te conoce lo bastante/.test(t), 'la lista muestra a los vecinos y por qué no aceptan');
  ok(!/Ernesto|Amadeo|Delia/.test(t), 'sin los que no se contratan (el jefe de estación, el gerente del banco, la maestra)');
  // los pobladores que no llegaron a la aldea no figuran
  ok(!/Rosa Quilodrán|Anselmo/.test(t) && !/Rosa|Anselmo/.test(t.replace(/Rosa Q/g, '')), 'y los que todavía no viven en la aldea, tampoco');
  const botones = (e) => [...(e.children || []).flatMap(botones), ...(e.tag === 'button' ? [e] : [])];
  ok(botones(r2).filter((b) => b.textContent === 'Contratar').every((b) => b.disabled), 'todos con «Contratar» apagado (sin amistad)');
  dar(X.progreso, 'madre', 90);
  const r3 = crear('div'); X.juego.dibujarPanel(r3, X.progreso.negocioPropio);
  const habilitados = botones(r3).filter((b) => b.textContent === 'Contratar' && !b.disabled);
  ok(habilitados.length === 1, 'con amistad, el de Gladys se habilita');
  habilitados[0].onclick();
  eq(X.progreso.empleadosNegocio.lista.map((x) => x.k), ['madre'], 'el botón contrata');
  const r4 = crear('div'); X.juego.dibujarPanel(r4, X.progreso.negocioPropio);
  t = textos(r4).join(' | ');
  ok(/Gladys · vecina, hace dulces/.test(t) && /rinde \d+ %/.test(t) && /\/día/.test(t) && /Despedir/.test(t) && /1 de 2/.test(t), `ya contratada: rendimiento, sueldo y «Despedir» a la vista`);
  const desp = botones(r4).find((b) => /Despedir/.test(b.textContent));
  desp.onclick();
  eq(X.progreso.empleadosNegocio.lista.length, 1, 'el primer toque en «Despedir» pide confirmación');
  const r5 = crear('div'); X.juego.dibujarPanel(r5, X.progreso.negocioPropio);
  ok(botones(r5).some((b) => /¿Seguro\? Despedir/.test(b.textContent)), 'y el botón cambia a «¿Seguro? Despedir»');
  botones(r5).find((b) => /¿Seguro/.test(b.textContent)).onclick();
  eq(X.progreso.empleadosNegocio.lista.length, 0, 'el segundo lo despide');
  // el panel no rompe sin local
  const vacio = crear('div'); X.juego.dibujarPanel(vacio, { ...X.progreso.negocioPropio, tipo: null }); eq(vacio.children.length, 0, 'sin tipo de local no dibuja nada');
  delete globalThis.document;
}

// ---------------------------------------------------------------- 10. el cableado
{
  const m = leer('src/main.js'), a = leer('src/aldea.js'), g = leer('src/guardado.js'), jn = leer('src/negocio-propio-juego.js'), jj = leer('src/empleados-negocio-juego.js'), rr = leer('src/empleados-negocio.js');
  const tiene = (src, t, msg) => ok(src.includes(t), msg);
  tiene(m, "import { crearEmpleadosNegocioJuego } from './empleados-negocio-juego.js';", 'main.js trae el juego de los empleados');
  tiene(m, 'empleadosNegocioJuego = crearEmpleadosNegocioJuego({', 'y lo arma');
  tiene(m, "fallaSistema('empleados-negocio-armado', e); empleadosNegocioJuego = null;", 'aislado en un try: si falla al armarse, el local sigue');
  tiene(m, 'fijarOcupacionExterna(empleadosNegocioJuego.ocupacion);', 'engancha la aldea con una línea');
  tiene(m, "try { if (modo === 'jugando' && !desafio) empleadosNegocioJuego?.actualizar(dt); } catch (e) { fallaSistema('empleados-negocio', e); }", 'el bucle lo avanza aislado con fallaSistema (sólo en el Relax)');
  tiene(m, 'extraPanel: (raiz, est) => { try { empleadosNegocioJuego?.dibujarPanel(raiz, est); } catch (e) { fallaSistema(', 'el panel de los empleados es aparte: si falla, el del local sigue');
  tiene(m, 'if (vecino?.empleadoNegocio) vecino = null;', 'los empleados detrás del mostrador no se charlan (E sigue siendo del local)');
  tiene(m, 'if (vecino?.clienteNegocio) vecino = null;', '… y lo de los clientes quedó como estaba');
  tiene(m, "planificadorAntitirones.permitir('empleados-negocio')", 'la figura se arma con el planificador antitirones');
  ok(a.includes('export function fijarOcupacionExterna(fn)') && a.includes('if (ocupacionExterna !== null && ocupacionExterna(persona, h, ds, dia)) return fuera;'), 'aldea.js: el enganche, una línea en rutinaAldea');
  ok(a.indexOf('ocupacionExterna(persona, h, ds, dia)') > a.indexOf('export function rutinaAldea') && a.indexOf('ocupacionExterna(persona, h, ds, dia)') < a.indexOf('const domingo = ds === 6'), '… antes de cualquier horario (y después de saber si es de la aldea)');
  ok(g.includes("import { empleadosNuevo, sanearEmpleadosNegocio } from './empleados-negocio.js';") && g.includes('empleadosNegocio: empleadosNuevo()') && g.includes('limpio.empleadosNegocio = modoPartida === \'desafio\' ? undefined : sanearEmpleadosNegocio(p.empleadosNegocio, limpio.dia);'), 'guardado.js: el campo nuevo, con valor por defecto y saneado');
  ok(jn.includes('ctx.extraPanel?.(raiz, est);') && jn.includes('function atender(c, quien = null)'), 'negocio-propio-juego.js: el hueco del panel y «quién atiende»');
  // el armado de un solo archivo: una constante exportada por declaración y los imports sin comentario atrás
  for (const [f, s] of [['src/empleados-negocio.js', rr], ['src/empleados-negocio-juego.js', jj]]) {
    ok(!/^export const [A-Za-z_]+ = [^;]*\b[0-9]+, [A-Za-z_]+ =/m.test(s), `${f}: una constante exportada por declaración`);
    ok(!/^import [^\n]*;\s+\/\//m.test(s), `${f}: ningún import con comentario atrás (el armado no lo entiende)`);
  }
  ok(!/^import [^\n]*;[ \t]+\/\//m.test(g) && !/^import [^\n]*;[ \t]+\/\//m.test(m.slice(0, 20000)), 'main.js y guardado.js: los imports nuevos, sin comentario atrás');
  // nada por cuadro, sin geometría ni luces
  ok(/const PASO = 0\.5;/.test(jj) && /if \(acum < PASO\) return;/.test(jj) && !/new THREE\.|PointLight|SpotLight|import \* as THREE/.test(jj), 'trabaja cada 0,5 s, sin geometría ni luces propias');
  ok(/armarPobladorDeAPoco/.test(jj) && /ctx\.msFigura/.test(jj) && /dormido = true/.test(jj), 'la figura se arma de a poco y duerme cuando no se usa');
  ok(!/gamepad|joystick|\bmando\b/i.test(jj + rr), 'sin mando');
  const ingles = /\b(hire|hired|fire|salary|wage|employee|shop|staff|worker|english|translation|i18n)\b/i;
  ok(!ingles.test(jj) && !ingles.test(rr.replace(/\/\/.*$/gm, '')), 'sin textos en otro idioma');
  // una partida del Desafío no corre nada de esto
  ok(/hayEconomia/.test(rr) && /modo === 'desafio'/.test(jj), 'sin economía (el Desafío) no hay empleados');
}

console.log(`verificar-4-4-empleados: ${n} comprobaciones OK`);
