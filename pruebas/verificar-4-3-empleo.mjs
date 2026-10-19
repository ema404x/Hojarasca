// 4.3: el empleo fijo (src/empleo.js, empleo-juego.js, empleo-mundo.js), en Node:
//   · los cuatro puestos (almacén, casa de té, taller ferroviario y banco): turno, sueldo por escalón dentro de la escala de la economía,
//     cuatro tareas cada uno con sus lugares dentro del edificio;
//   · el turno: fichar (horarios, domingo, uno por día), las ocho tareas en un orden parejo, el cobro del sueldo completo, proporcional, con
//     multa si te vas antes y con el cierre solo por la hora o el día;
//   · los escalones: días cumplidos + nivel del oficio relacionado, el sueldo sube y nunca baja, el aviso de ascenso;
//   · el guardado: una partida vieja sin `empleo` queda como estaba, lo roto se sanea, el Desafío no lo tiene;
//   · el turno ocupa uno de los dos jornales del día (trabajos.js) y los jornales de antes siguen igual;
//   · el juego (empleo-juego.js) con un contexto de mentira: el cartel, la pregunta, la tarea con E, el reloj que corre, el cobro y el cuaderno;
//   · lo que se engancha en main.js, guardado.js, oficios-ui.js y trabajos.js, y que no hay inglés ni mando en lo nuevo.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const E = await import('../src/empleo.js');
const { economiaNueva, pesosDe, formatoPesos } = await import('../src/economia.js');
const { EDIFICIOS_ALDEA, diaSemanaDe } = await import('../src/aldea.js');
const { sumarXp, oficiosNuevos } = await import('../src/oficios.js');
const T = await import('../src/trabajos.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

const relax = (pesos = 0, dia = 1, horas = 12) => ({ modo: 'relax', dia, horas, economia: { ...economiaNueva(), pesos }, oficios: oficiosNuevos() });
const turnoCompleto = (p, k, dia, hora, motivo = 'completo') => { const f = E.fichar(p, k, dia, hora); if (!f.ok) return f; while (!E.hacerTarea(p).terminado); return E.cerrarTurno(p, motivo); };

// ---------------------------------------------------------------- 1. los puestos
{
  eq(E.IDS_PUESTOS, ['almacen', 'casa-te', 'taller-tren', 'banco-pueblo'], 'cuatro puestos: almacén, casa de té, taller ferroviario y banco');
  eq(E.ESCALONES.map((e) => e.id), ['aprendiz', 'empleado', 'encargado'], 'tres escalones');
  for (const k of E.IDS_PUESTOS) {
    const P = E.PUESTOS[k], ed = EDIFICIOS_ALDEA[k];
    ok(ed, `${k}: el local existe en el plano de la aldea`);
    ok(P.desde < P.hasta && P.hasta - P.desde === 4, `${k}: turno de cuatro horas (${P.desde} a ${P.hasta})`);
    ok(P.sueldos.length === 3 && P.sueldos[0] < P.sueldos[1] && P.sueldos[1] < P.sueldos[2], `${k}: el sueldo sube con cada escalón`);
    ok(P.sueldos[0] >= 1600 && P.sueldos[2] <= 2800, `${k}: sueldos en la escala de la economía ($1.600 a $2.800: ${P.sueldos.join(', ')})`);
    ok(P.sueldos.every((s) => s % 50 === 0), `${k}: sueldos redondos`);
    ok(P.cargos.length === 3 && new Set(P.cargos).size === 3 && P.jefe && P.saludos.length >= 2, `${k}: tres cargos, quien manda y sus saludos`);
    eq(P.tareas.length, 4, `${k}: cuatro tareas`);
    ok(new Set(P.tareas.map((t) => t.id)).size === 4, `${k}: tareas distintas`);
    for (const t of P.tareas) {
      ok(t.nombre && t.hecho && t.donde && t.seg >= 3 && t.seg <= 7, `${k}/${t.id}: se dice, se hace en pocos segundos (${t.seg})`);
      ok(Math.abs(t.x) <= ed.ancho / 2 + 5 && Math.abs(t.z) <= ed.fondo / 2 + 5, `${k}/${t.id}: el lugar está en el local o pegado (${t.x}, ${t.z})`);
      ok(Number.isFinite(t.dy) && t.dy >= 0 && t.dy < 1, `${k}/${t.id}: altura del piso`);
    }
    ok(Math.abs(P.ficha.x) <= ed.ancho / 2 + 4 && Math.abs(P.ficha.z) <= ed.fondo / 2 + 4, `${k}: el cartel de turnos está en el local`);
    for (const t of P.tareas) ok(Math.hypot(t.x - P.ficha.x, t.z - P.ficha.z) > 1.6, `${k}/${t.id}: no se pisa con el cartel (el radio de una tarea es 1,5)`);
    ok(E.hayPuesto(k), `${k}: hayPuesto`);
  }
  ok(!E.hayPuesto('cantina') && !E.hayPuesto('constructor') && !E.hayPuesto(null), 'lo que no es un puesto no lo es (ni «constructor», ni null)');
  // las horas de cada local, las que ya tenían los vecinos
  eq([E.PUESTOS.almacen.desde, E.PUESTOS.almacen.hasta], [16, 20], 'almacén de 16 a 20 (la tarde de Ercilia)');
  eq([E.PUESTOS['banco-pueblo'].desde, E.PUESTOS['banco-pueblo'].hasta], [8.5, 12.5], 'banco de 8:30 a 12:30 (la mañana del gerente)');
  eq(E.horaCorta(8.5), '8:30', 'hora corta con media');
  eq(E.horaCorta(16), '16', 'hora corta entera');
  eq(E.horaReloj(9.75), '9:45', 'hora de reloj');
}

// ---------------------------------------------------------------- 2. las tareas de un turno
{
  for (const k of E.IDS_PUESTOS) {
    const s = E.secuenciaDelTurno(k, 5), s2 = E.secuenciaDelTurno(k, 5), otra = E.secuenciaDelTurno(k, 6);
    eq(s.length, 8, `${k}: ocho tareas por turno`);
    eq(s, s2, `${k}: el mismo día es el mismo turno`);
    const cuenta = {};
    for (const id of s) cuenta[id] = (cuenta[id] || 0) + 1;
    ok(Object.values(cuenta).every((c) => c === 2) && Object.keys(cuenta).length === 4, `${k}: las cuatro tareas, dos veces cada una`);
    ok(s.every((id, i) => i === 0 || id !== s[i - 1]), `${k}: nunca la misma dos veces seguidas`);
    ok(s.every((id) => E.tareaDe(k, id)), `${k}: son tareas del puesto`);
    let distintos = 0;
    for (let d = 1; d <= 20; d++) if (E.secuenciaDelTurno(k, d).join() !== otra.join()) distintos++;
    ok(distintos >= 10, `${k}: cada día cambia el orden`);
  }
  eq(E.secuenciaDelTurno('nada', 3), [], 'sin puesto, sin secuencia');
}

// ---------------------------------------------------------------- 3. fichar
{
  const p = relax(0, 1, 15.9);
  // el día 1 es lunes; el 7, domingo
  eq(E.diaSemana(7), 6, 'el día 7 es domingo');
  eq(E.diaSemana(1), diaSemanaDe(1), 'mi cuenta del día de la semana es la de aldea.js');
  eq(E.diaSemana(10), diaSemanaDe(10), 'y en otro día también');
  eq(E.puedeFichar(p, 'almacen', 7, 16.5).motivo, 'domingo', 'el domingo no se trabaja');
  eq(E.puedeFichar(p, 'almacen', 1, 14).motivo, 'temprano', 'antes de la hora no se ficha');
  ok(E.puedeFichar(p, 'almacen', 1, 15.5).ok, 'desde media hora antes sí');
  ok(E.puedeFichar(p, 'almacen', 1, 18.5).ok, 'hasta una hora y media antes del cierre');
  eq(E.puedeFichar(p, 'almacen', 1, 18.6).motivo, 'tarde', 'después, tarde');
  eq(E.puedeFichar(p, 'almacen', 1, 21).motivo, 'tarde', 'a la noche, tarde');
  eq(E.puedeFichar(relax(0), 'cantina', 1, 12).motivo, 'nada', 'sin puesto, nada');
  eq(E.puedeFichar({ modo: 'desafio' }, 'almacen', 1, 16).motivo, 'nada', 'en el Desafío, nada (no hay economía)');
  const v = E.puedeFichar(p, 'almacen', 1, 16);
  eq([v.sueldo, v.escalon, v.cargo, v.posibles], [1600, 0, 'Ayudante de mostrador', 8], 'el primer día: aprendiz, $1.600 y las ocho tareas');
  eq(E.puedeFichar(p, 'almacen', 1, 18).posibles, 4, 'llegando a las 18 entran cuatro tareas');
  eq(E.tareasPosibles('almacen', 18.5), 3, 'a las 18:30, tres');
  // fichar
  const f = E.fichar(p, 'almacen', 1, 16);
  ok(f.ok && f.turno.local === 'almacen' && f.turno.hechas === 0 && f.turno.total === 8 && f.turno.sueldo === 1600, 'fichar arma el turno');
  eq(E.turnoActivo(p).seq.length, 8, 'con sus ocho tareas');
  ok(E.tareaActual(p) && E.tareaActual(p).id === f.turno.seq[0], 'la primera tarea es la primera de la secuencia');
  eq(E.fichar(p, 'casa-te', 1, 9).motivo, 'activo', 'no se ficha en dos lados a la vez');
  eq(E.turnosDelDia(p, 1), 1, 'el turno cuenta para hoy');
  eq(E.turnosDelDia(p, 2), 0, 'y no para mañana');
  eq(E.sueldoAcumulado(E.turnoActivo(p)), 0, 'sin tareas, nada acumulado');
  const t1 = E.hacerTarea(p);
  ok(t1.ok && t1.hechas === 1 && !t1.terminado && t1.tarea, 'una tarea hecha');
  eq(E.sueldoAcumulado(E.turnoActivo(p)), 200, 'un octavo del sueldo');
  while (!E.hacerTarea(p).terminado);
  eq(E.hacerTarea(p).ok, false, 'sin tareas pendientes no hay más que hacer');
  eq(E.tareaActual(p), null, 'ni tarea actual');
  const r = E.cerrarTurno(p, 'completo', 'Ercilia');
  ok(r.ok && r.monto === 1600 && r.multa === 0 && r.cumplido && r.hechas === 8, 'turno completo: $1.600 y día cumplido');
  eq(pesosDe(p), 1600, 'el sueldo entró a la billetera');
  ok(p.economia.libro.at(-1).motivo.startsWith('Sueldo: Ayudante de mostrador') && p.economia.libro.at(-1).con === 'Ercilia', 'con el motivo claro en el libro');
  eq(E.turnoActivo(p), null, 'sin turno en curso');
  eq(E.puedeFichar(p, 'almacen', 1, 16.2).motivo, 'hoy', 'un turno por día');
  ok(E.puedeFichar(p, 'casa-te', 2, 9).ok, 'mañana, otro');
  eq([p.empleo.locales.almacen.dias, p.empleo.total.turnos, p.empleo.total.cobrado], [1, 1, 1600], 'los días y los totales');
  eq(E.cerrarTurno(p).ok, false, 'sin turno no se cierra nada');
}

// ---------------------------------------------------------------- 4. el sueldo: proporcional, multa, cierre solo
{
  const sueldoDe = (k, hechas, motivo) => { const p = relax(0, 3, E.PUESTOS[k].desde); E.fichar(p, k, 3, E.PUESTOS[k].desde); for (let i = 0; i < hechas; i++) E.hacerTarea(p); const r = E.cerrarTurno(p, motivo); return { r, p }; };
  eq(sueldoDe('almacen', 4, 'tiempo').r.monto, 800, 'la mitad de las tareas, la mitad del sueldo');
  eq(sueldoDe('almacen', 3, 'tiempo').r.monto, 600, 'tres de ocho: $600 (redondeado)');
  const ab = sueldoDe('almacen', 4, 'abandono').r;
  eq([ab.monto, ab.multa], [600, 200], 'irte antes: lo hecho menos una cuarta parte');
  ok(!ab.cumplido, 'y no cuenta como día cumplido');
  eq(sueldoDe('almacen', 0, 'abandono').r.monto, 0, 'si no hiciste nada, no cobrás');
  { const z = sueldoDe('almacen', 0, 'abandono'); eq(E.turnosDelDia(z.p, 3), 0, 'y el día queda libre para volver a fichar'); eq(z.p.empleo.total.abandonos, 0, 'sin falta'); }
  { const a = sueldoDe('almacen', 5, 'abandono'); eq([a.p.empleo.locales.almacen.faltas, a.p.empleo.total.abandonos, a.p.empleo.locales.almacen.dias], [1, 1, 0], 'irte antes anota una falta y ningún día'); eq(E.turnosDelDia(a.p, 3), 1, 'y el día no se recupera'); }
  ok(sueldoDe('almacen', 6, 'tiempo').r.cumplido, '6 de 8 (75 %) cumple el día');
  ok(!sueldoDe('almacen', 5, 'tiempo').r.cumplido, '5 de 8 no');
  eq(sueldoDe('almacen', 6, 'dia').r.monto, 1200, 'si pasa el día cobrás lo hecho, sin multa');
  eq(sueldoDe('banco-pueblo', 8, 'completo').r.monto, 1700, 'el banco paga $1.700 el turno completo');
  eq(E.pagoDelTurno({ hechas: 8, total: 8, sueldo: 2700 }, true).multa, 0, 'un turno entero no lleva multa aunque se cierre como abandono');
  // el cierre solo
  const p = relax(0, 4, 16);
  E.fichar(p, 'almacen', 4, 16);
  eq(E.motivoDeCierre(p, 4, 19.5), null, 'durante el turno no se cierra');
  eq(E.motivoDeCierre(p, 4, 20.7), null, 'ni un rato después de la hora (la gracia)');
  eq(E.motivoDeCierre(p, 4, 20.8), 'tiempo', 'pasada la gracia, se cierra por el tiempo');
  eq(E.motivoDeCierre(p, 4, 20.8, true), null, 'con la hora de tu reloj no se cierra por la hora');
  eq(E.motivoDeCierre(p, 5, 7), 'dia', 'si pasó el día, se cierra por el día');
  eq(E.motivoDeCierre(relax(), 1, 12), null, 'sin turno, nada');
}

// ---------------------------------------------------------------- 5. los escalones
{
  const p = relax(0, 1, 9);
  eq(E.escalonDe(p, 'casa-te'), 0, 'al principio, aprendiz');
  let dia = 1;
  const turno = (k, motivo = 'completo') => { dia++; if (E.esDiaLibre(dia)) dia++; p.dia = dia; return turnoCompleto(p, k, dia, E.PUESTOS[k].desde, motivo); };
  for (let i = 0; i < 4; i++) turno('casa-te');
  eq(E.faltaParaAscender(p, 'casa-te').dias, 1, 'faltan días: uno');
  const cuarto = turno('casa-te');
  eq(E.escalonDe(p, 'casa-te'), 0, 'con cinco días pero sin oficio no se asciende (huertero nivel 1)');
  ok(!cuarto.ascendio, 'ni avisa');
  const f = E.faltaParaAscender(p, 'casa-te');
  eq([f.dias, f.oficio, f.nombre, f.oficioNombre], [0, 1, 'Empleado', 'huertero'], 'sólo falta el oficio');
  sumarXp(p.oficios, 'huertero', 40);
  eq(E.escalonDe(p, 'casa-te'), 1, 'con el nivel del oficio, empleado');
  // se ve el ascenso al cerrar un turno
  const q = relax(0, 1, 9);
  q.empleo = E.empleoNuevo(); q.empleo.locales['casa-te'] = { dias: 4, faltas: 0, escalon: 0, ultimo: 0, cobrado: 0 };
  sumarXp(q.oficios, 'huertero', 40);
  eq(E.escalonDe(q, 'casa-te'), 0, 'con cuatro días todavía aprendiz');
  const r = turnoCompleto(q, 'casa-te', 2, 9);
  ok(r.ascendio && r.ascendio.nombre === 'Empleado' && r.ascendio.cargo === 'Moza de té' && r.ascendio.sueldo === 2000, 'el quinto día asciende: moza de té, $2.000');
  eq(q.empleo.locales['casa-te'].escalon, 1, 'queda guardado');
  const r2 = turnoCompleto(q, 'casa-te', 3, 9);
  ok(r2.ok && !r2.ascendio && r2.monto === 2000, 'el turno siguiente ya paga $2.000 y no vuelve a avisar');
  // encargado
  q.empleo.locales['casa-te'].dias = 13;
  eq(E.escalonDe(q, 'casa-te'), 1, 'con 13 días, empleado');
  sumarXp(q.oficios, 'huertero', 80);
  const r3 = turnoCompleto(q, 'casa-te', 4, 9);
  ok(r3.ascendio && r3.ascendio.nombre === 'Encargado' && r3.ascendio.cargo === 'Encargada del salón' && r3.ascendio.sueldo === 2600, 'a los 14 días y con nivel 2, encargada: $2.600');
  eq(E.faltaParaAscender(q, 'casa-te').hay, false, 'no hay más escalones');
  // nunca baja
  q.empleo.locales['casa-te'].dias = 0;
  eq(E.escalonDe(q, 'casa-te'), 2, 'el escalón alcanzado no se pierde');
  // cada local es aparte
  eq(E.escalonDe(q, 'almacen'), 0, 'el almacén sigue en aprendiz');
  // los otros oficios
  eq(E.PUESTOS['taller-tren'].oficio, 'picapedrero', 'el taller cuenta el picapedrero');
  eq(E.PUESTOS['banco-pueblo'].oficio, 'obrero', 'el banco cuenta el constructor');
  // sueldo por escalón de cada local
  for (const k of E.IDS_PUESTOS) eq([0, 1, 2].map((e) => E.sueldoDe(k, e)), E.PUESTOS[k].sueldos, `${k}: sueldoDe por escalón`);
  eq(E.sueldoDe('cantina', 0), 0, 'sin puesto, $0');
  eq(E.cargoDe('almacen', 2), 'Encargado del almacén', 'cargo del escalón 2');
  eq(E.cargoDe('almacen', 9), 'Encargado del almacén', 'un escalón de más se queda en el último');
}

// ---------------------------------------------------------------- 6. el equilibrio (ECONOMIA_NUMEROS.md: ~$3.200 por día con los jornales)
{
  const medio = E.IDS_PUESTOS.map((k) => E.PUESTOS[k].sueldos);
  const jornal = Object.values(T.TRABAJOS).reduce((s, t) => s + t.base, 0) / Object.keys(T.TRABAJOS).length;
  ok(jornal >= 700 && jornal <= 1300, `el jornal medio ronda $${Math.round(jornal)}`);
  for (const [i, s] of medio.entries()) ok(s[0] >= 1.4 * 1000 && s[0] <= 2.8 * 1000 && s[2] <= 2.9 * jornal * 1.2, `${E.IDS_PUESTOS[i]}: el turno vale cerca de dos jornales (aprendiz $${s[0]}, encargado $${s[2]})`);
  // el mejor día posible con turno + el jornal que queda: sin pasarse mucho de los $3.200
  const mejorTurno = Math.max(...medio.map((s) => s[2])), mejorJornal = Math.max(...Object.values(T.TRABAJOS).map((t) => t.base)) * 1.5;
  ok(mejorTurno + mejorJornal <= 5200, `el mejor día (encargado + el mejor jornal con oficio) es de $${Math.round(mejorTurno + mejorJornal)}: sin romper la economía`);
  // el turno ocupa uno de los dos jornales del día
  const p = relax(10000, 3, 16);
  const claves = Object.keys(T.TRABAJOS);
  ok(T.puedeTrabajar(p, claves[0], 3).ok, 'sin turno, el jornal está');
  E.fichar(p, 'almacen', 3, 16);
  ok(T.puedeTrabajar(p, claves[0], 3).ok, 'con un turno hoy queda un jornal');
  T.cumplirJornal(p, claves[0], 3);
  const r = T.puedeTrabajar(p, claves[1], 3);
  ok(!r.ok && r.motivo === 'cupo', 'turno + un jornal agotan el día');
  ok(T.puedeTrabajar(p, claves[1], 4).ok, 'y mañana vuelve todo');
  // sin turno: dos jornales como siempre
  const q = relax(10000, 3, 16);
  ok(T.cumplirJornal(q, claves[0], 3).ok && T.cumplirJornal(q, claves[1], 3).ok && !T.puedeTrabajar(q, claves[2], 3).ok, 'sin turno, los dos jornales de siempre');
  ok(q.empleo === undefined, 'y mirar el cupo no crea nada en la partida');
}

// ---------------------------------------------------------------- 7. el guardado
{
  eq(E.sanearEmpleo(undefined), E.empleoNuevo(), 'una partida vieja (sin empleo) sale vacía');
  eq(E.sanearEmpleo('x'), E.empleoNuevo(), 'un valor roto sale vacío');
  const roto = E.sanearEmpleo({ locales: { almacen: { dias: 'muchos', faltas: -3, escalon: 99, ultimo: 9e9, cobrado: 1e99 }, cantina: { dias: 5 } }, turno: { local: 'almacen', total: 8, hechas: 99, seq: ['mostrador'] }, hoy: { dia: 99, turnos: 99 }, total: { turnos: -1 }, historial: [{ local: 'almacen' }, { local: 'x' }, 5] }, 10);
  eq(Object.keys(roto.locales), ['almacen'], 'sólo quedan los locales que existen');
  const l = roto.locales.almacen;
  ok(l.dias === 0 && l.faltas === 0 && l.escalon === 2 && l.ultimo === 10 && l.cobrado <= 1e9, 'los números rotos se acotan');
  eq(roto.turno, null, 'un turno sin sus tareas se descarta');
  ok(roto.hoy.dia <= 10 && roto.hoy.turnos <= 9, 'el día de hoy no es del futuro');
  eq(roto.total, { turnos: 0, cobrado: 0, abandonos: 0 }, 'totales en cero');
  eq(roto.historial.length, 1, 'del historial queda lo que es de un puesto');
  // un turno bueno viaja
  const p = relax(0, 5, 16);
  E.fichar(p, 'banco-pueblo', 5, 8.5); E.hacerTarea(p); E.hacerTarea(p);
  const ida = JSON.parse(JSON.stringify(E.sanearEmpleo(JSON.parse(JSON.stringify(p.empleo)), 5)));
  eq(ida.turno.hechas, 2, 'el turno a medias se guarda y se lee');
  eq(ida.turno.seq, p.empleo.turno.seq, 'con el mismo orden de tareas');
  eq([ida.turno.sueldo, ida.turno.desde, ida.turno.hasta], [1700, 8.5, 12.5], 'y con el sueldo y el horario del puesto');
  const futuro = E.sanearEmpleo({ turno: { ...p.empleo.turno, dia: 50 } }, 5);
  eq(futuro.turno.dia, 5, 'un turno de un día que no llegó se lleva a hoy');
  // el guardado de la partida
  const almacen = new Map();
  globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), key: () => null, length: 0 };
  const G = await import('../src/guardado.js');
  G.usarModoGuardado('relax', 1);
  const nuevo = G.progresoNuevo();
  eq(nuevo.empleo, E.empleoNuevo(), 'una partida nueva del Relax trae el empleo vacío');
  const vieja = JSON.parse(JSON.stringify(nuevo)); delete vieja.empleo; vieja.cosas = { yerba: 3, harina: 1 };
  G.escribirPartida('relax', 1, vieja);
  const c = G.leerPartida('relax', 1), pc = c?.progreso || c;
  eq(pc.empleo, E.empleoNuevo(), 'una partida de antes carga con el empleo vacío');
  ok(pc.economia.pesos === 0 && pc.cosas.harina === 1 && pc.cosas.yerba === 3, 'y lo demás (la economía, las cosas) queda como estaba');
  const con = JSON.parse(JSON.stringify(pc)); con.empleo = JSON.parse(JSON.stringify(p.empleo)); con.dia = 5;
  G.escribirPartida('relax', 1, con);
  const d = G.leerPartida('relax', 1), pd = d?.progreso || d;
  ok(pd.empleo.turno && pd.empleo.turno.local === 'banco-pueblo' && pd.empleo.turno.hechas === 2, 'el turno a medias sobrevive al guardado de la partida');
  G.escribirPartida('relax', 1, { ...con, empleo: { turno: 'roto', locales: 5 } });
  const e2 = G.leerPartida('relax', 1), pe = e2?.progreso || e2;
  eq(pe.empleo, E.empleoNuevo(), 'un empleo roto en la partida se sanea');
  G.usarModoGuardado('desafio', 1);
  ok(G.progresoNuevo().empleo === undefined, 'el Desafío no trae empleo');
  const guard = leer('src/guardado.js');
  ok(guard.includes("import { empleoNuevo, sanearEmpleo } from './empleo.js';") && guard.includes('sanearEmpleo(p.empleo'), 'guardado.js lo usa');
  ok(E.empleoDe({ modo: 'desafio' }) === null && E.empleoDe(relax()) !== null, 'sin economía no hay empleo');
}

// ---------------------------------------------------------------- 8. el juego, con un contexto de mentira
{
  const { crearEmpleoJuego } = await import('../src/empleo-juego.js');
  const { edificioEnMundo } = await import('../src/aldea.js');
  const p = relax(0, 2, 15.8);
  const notas = [], sonidos = [], guardados = [];
  let desafio = false, respuesta = true, preguntas = [], reloj = false, saltos = 0, visible = true;
  const js = { pos: { x: 0, y: 0, z: 0 } };
  const ctx = {
    progreso: () => p, jugador: () => ({ estado: js }), escena: () => null, desafio: () => desafio,
    nota: (t, sub) => notas.push([t, sub || '']), guardar: () => guardados.push(1),
    sonido: () => ({ juntar: () => sonidos.push('juntar'), anotar: () => sonidos.push('anotar'), paso: () => sonidos.push('paso') }),
    confirmar: async (texto, extra) => { preguntas.push([texto, extra]); return respuesta; },
    avanzarHoras: (h) => { if (reloj) return false; p.horas += h; saltos++; if (p.horas >= 24) { p.horas -= 24; p.dia++; } return true; }, reloj: () => reloj, ver: () => visible, azar: () => 0,
  };
  const J = crearEmpleoJuego(ctx);
  const ponerEn = (k, id, dx = 0, dz = 0) => { const l = J.lugar(k, id); js.pos.x = l.x + dx; js.pos.z = l.z + dz; js.pos.y = l.y; return l; };
  // lejos de todo, nada
  js.pos.x = 5000; js.pos.z = 5000; js.pos.y = 0;
  eq(J.accion(js), null, 'lejos de los locales no hay nada que hacer');
  // en el cartel del almacén, con el turno todavía lejano
  p.horas = 12;
  ponerEn('almacen', 'ficha');
  let a = J.accion(js);
  ok(a && a.tipo === 'info' && /Cartel de turnos/.test(a.texto), 'a las 12 el cartel sólo informa');
  a.hacer();
  ok(/Se ficha desde las 15:30/.test(notas.at(-1)[1]) && notas.at(-1)[1].includes('turno de 16 a 20'), 'y dice cuándo se ficha');
  eq(J.tapaVecino(js), false, 'un cartel que informa no le saca la E al vecino');
  // a las 15:50, se puede
  p.horas = 15.8;
  a = J.accion(js);
  ok(a.tipo === 'ficha' && a.texto === 'Tomar el puesto: Ayudante de mostrador · turno de 16 a 20 · $1.600', 'a las 15:50: «Tomar el puesto: Ayudante de mostrador · turno de 16 a 20 · $1.600»');
  eq(J.tapaVecino(js), true, 'y ahí la E es del cartel');
  // la pregunta: no
  respuesta = false;
  await a.hacer();
  ok(preguntas.length === 1 && preguntas[0][0].startsWith('¿Querés trabajar acá? Ayudante de mostrador en el almacén: turno de 16 a 20, $1.600.'), 'la pregunta: «¿Querés trabajar acá? … turno de 16 a 20, $1.600»');
  eq([preguntas[0][1].si, preguntas[0][1].no], ['Tomar el puesto', 'Ahora no'], 'con sus botones');
  eq(J.turno(), null, 'si decís que no, no ficha');
  respuesta = true;
  await J.accion(js).hacer();
  ok(J.turno() && J.turno().local === 'almacen' && J.turno().hechas === 0, 'si decís que sí, fichás');
  ok(/Fichaste en el almacén/.test(notas.at(-1)[0]) && notas.at(-1)[1].includes('Ercilia') && /Primera tarea/.test(notas.at(-1)[1]), 'con el aviso y la primera tarea');
  ok(guardados.length >= 1, 'y se guarda');
  // en el cartel, ya en turno: irte
  let b = J.accion(js);
  ok(b.tipo === 'salir' && /Irte del turno antes de tiempo/.test(b.texto), 'en el cartel, con el turno en marcha, se puede irse');
  // la tarea: lejos del lugar, nada; en el lugar, la E
  const t0 = E.tareaActual(p), lt = J.lugar('almacen', t0.id);
  js.pos.x = lt.x + 6; js.pos.z = lt.z + 6;
  eq(J.accion(js), null, 'lejos de la tarea no hay E');
  ponerEn('almacen', t0.id, 0.5, 0);
  a = J.accion(js);
  ok(a.tipo === 'tarea' && a.texto === `${t0.nombre} (1 de 8)`, `en el lugar: «${t0.nombre} (1 de 8)»`);
  eq(J.tapaVecino(js), true, 'y el vecino mirado no se come la E');
  // otro piso: no
  js.pos.y += 5;
  eq(J.accion(js), null, 'en otro piso no cuenta');
  js.pos.y -= 5;
  // empezar
  a.hacer();
  ok(J.haciendo(), 'E empieza la tarea');
  eq(J.accion(js).tipo, 'ocupado', 'mientras se hace, la E no hace otra cosa');
  J.actualizar(t0.seg * 0.5);
  ok(J.haciendo() && J.turno().hechas === 0, 'a la mitad todavía no está');
  js.pos.x += 3;   // te alejás
  J.actualizar(0.1);
  ok(!J.haciendo() && J.turno().hechas === 0, 'si te alejás, se corta y no cuenta');
  ok(/Quedó sin hacer/.test(notas.at(-1)[0]), 'con su aviso');
  // la tarea entera: 8 veces
  const horas0 = p.horas;
  let ult = null;
  for (let i = 0; i < 8; i++) {
    const t = E.tareaActual(p);
    ponerEn('almacen', t.id);
    J.accion(js).hacer();
    J.actualizar(t.seg + 0.05);
    ult = notas.at(-1);
    if (i < 7) ok(J.turno().hechas === i + 1 && ult[0] === t.hecho && ult[1].startsWith(`${i + 1} de 8`), `tarea ${i + 1}: «${t.hecho}»`);
  }
  eq(saltos, 8, 'el reloj saltó una vez por tarea');
  ok(Math.abs(p.horas - (horas0 + 8 * 0.4)) < 1e-9, `y corrió 8 × 0,4 h (de ${horas0.toFixed(2)} a ${p.horas.toFixed(2)})`);
  eq(J.turno(), null, 'al terminar la octava, el turno se cierra');
  eq(pesosDe(p), 1600, 'y se cobra el sueldo');
  ok(/Terminó el turno en el almacén/.test(ult[0]) && ult[1].startsWith('Cobraste $1.600'), `el aviso: «${ult[0]}» · «${ult[1]}»`);
  ok(sonidos.includes('anotar'), 'con su sonido');
  eq(E.turnosDelDia(p, 2), 1, 'y hoy no hay otro turno');
  b = null; ponerEn('almacen', 'ficha');
  a = J.accion(js);
  ok(a.tipo === 'info' && /Ya hiciste tu turno de hoy/.test((a.hacer(), notas.at(-1)[1])), 'el cartel dice que ya hiciste el de hoy');

  // irse antes (con la pregunta)
  p.dia = 3; p.horas = 8.4;
  ponerEn('banco-pueblo', 'ficha');
  respuesta = true;
  await J.accion(js).hacer();
  eq(J.turno().local, 'banco-pueblo', 'en el banco: fichás con el cartel del banco');
  ok(/turno de 8:30 a 12:30, \$1\.700/.test(preguntas.at(-1)[0]), 'la pregunta dice 8:30 a 12:30 y $1.700');
  { const t = E.tareaActual(p); ponerEn('banco-pueblo', t.id); J.accion(js).hacer(); J.actualizar(t.seg + 0.1); }
  eq(J.turno().hechas, 1, 'una tarea en el banco');
  ponerEn('banco-pueblo', 'ficha');
  respuesta = false;
  await J.accion(js).hacer();
  ok(J.turno() && /cobrás \$150 \(menos \$50 por irte antes\)/.test(preguntas.at(-1)[0]), 'irte pregunta lo que cobrás con la multa y si decís que no seguís');
  respuesta = true;
  await J.accion(js).hacer();
  eq(J.turno(), null, 'si decís que sí, te vas');
  ok(notas.at(-1)[0] === 'Te fuiste del banco' && /menos \$50/.test(notas.at(-1)[1]), 'el aviso cuenta la multa');
  eq(pesosDe(p), 1750, 'cobraste $150');
  eq(p.empleo.locales['banco-pueblo'].faltas, 1, 'y quedó la falta');

  // alejarte del local lo cierra solo
  p.dia = 4; p.horas = 9;
  ponerEn('casa-te', 'ficha');
  await J.accion(js).hacer();
  eq(J.turno().local, 'casa-te', 'casa de té: ficha');
  { const t = E.tareaActual(p); ponerEn('casa-te', t.id); J.accion(js).hacer(); J.actualizar(t.seg + 0.1); }
  js.pos.x += 30;
  J.actualizar(0.6);
  ok(J.turno() !== null, 'a 30 m todavía es tu turno (se avisa)');
  ok(/Estás lejos del trabajo/.test(notas.at(-1)[0]) && notas.at(-1)[1].startsWith('Volvé a la casa de té'), 'te avisa que estás lejos');
  eq([E.deNombre('el taller ferroviario'), E.aNombre('el taller ferroviario'), E.deNombre('la casa de té'), E.aNombre('la casa de té')], ['del taller ferroviario', 'al taller ferroviario', 'de la casa de té', 'a la casa de té'], 'del, al, de la y a la');
  js.pos.x += 40;
  J.actualizar(0.6);
  eq(J.turno(), null, 'a más de 45 m se cierra el turno');
  eq(p.empleo.locales['casa-te'].faltas, 1, 'con falta');

  // la hora y el día
  p.dia = 5; p.horas = 8;
  ponerEn('taller-tren', 'ficha');
  await J.accion(js).hacer();
  eq(J.turno().local, 'taller-tren', 'taller ferroviario: ficha a las 8');
  { const t = E.tareaActual(p); ponerEn('taller-tren', t.id); J.accion(js).hacer(); J.actualizar(t.seg + 0.1); }
  p.horas = 13;
  J.actualizar(0.6);
  eq(J.turno(), null, 'pasada la hora de cierre (12 + gracia), se cierra solo');
  ok(/Se cerró el turno/.test(notas.at(-1)[0]), 'y lo dice');
  p.dia = 6; p.horas = 8;
  ponerEn('taller-tren', 'ficha');
  await J.accion(js).hacer();
  p.dia = 7; p.horas = 7;
  J.actualizar(0.6);
  eq(J.turno(), null, 'si pasa el día (dormiste), se cierra solo');
  ok(/Pasó el día/.test(notas.at(-1)[0]), 'y lo dice');

  // con la hora de tu reloj no se salta
  reloj = true; saltos = 0; p.dia = 8; p.horas = 9;
  ponerEn('casa-te', 'ficha');
  await J.accion(js).hacer();
  { const t = E.tareaActual(p); ponerEn('casa-te', t.id); J.accion(js).hacer(); J.actualizar(t.seg + 0.1); }
  eq([saltos, p.horas], [0, 9], 'con la hora de tu reloj el reloj no salta');
  eq(J.turno().hechas, 1, 'pero la tarea cuenta');
  reloj = false;
  J.cerrar('tiempo');

  // el Desafío no tiene nada de esto
  desafio = true;
  ponerEn('almacen', 'ficha');
  eq(J.accion(js), null, 'en el Desafío no hay cartel');

  // el cuaderno
  desafio = false;
  const pag = J.paginaCuaderno();
  eq([pag.id, pag.nombre], ['empleo', 'Trabajo en la aldea'], 'la página del cuaderno');
  ok(pag.marca.includes('turnos') && !pag.pendiente, 'con sus turnos hechos');
  const hijos = [];
  const el = (tag, cls, txt) => { const o = { tag, cls, txt: txt || '', hijos: [], appendChild(h) { this.hijos.push(h); return h; } }; return o; };
  const ficha = el('div'), textos = [];
  pag.dibujar(ficha, (...a2) => { const o = el(...a2); hijos.push(o); return o; });
  const todo = (o) => [o.txt, ...(o.hijos || []).flatMap(todo)].filter(Boolean);
  const lineas = todo(ficha);
  ok(lineas.some((t) => t === 'Trabajo en la aldea'), 'tiene su título');
  ok(lineas.some((t) => /turnos? hechos?/.test(t) && t.includes('cobrados')), 'cuenta turnos y cobrado');
  ok(lineas.some((t) => t.includes('Almacén de Ramos Generales') && t.includes('Ayudante de mostrador')), 'el historial por local: el almacén con su cargo');
  ok(lineas.some((t) => /Aprendiz · 1 día cumplido/.test(t)), 'los días cumplidos');
  ok(lineas.some((t) => t.startsWith('Para ser empleado:') && t.includes('huertero de nivel 1')), 'lo que falta para ascender');
  ok(lineas.some((t) => t === 'Últimos turnos') && lineas.some((t) => t.startsWith('Día 2 · Almacén de Ramos Generales: 8 de 8 tareas, $1.600')), 'y los últimos turnos');
  const vacia = crearEmpleoJuego({ ...ctx, progreso: () => relax() }).paginaCuaderno();
  ok(vacia.pendiente && vacia.marca === 'sin puesto', 'sin turnos, la página dice «sin puesto»');
}

// ---------------------------------------------------------------- 9. lo que se engancha
{
  const main = leer('src/main.js'), ui = leer('src/oficios-ui.js'), tr = leer('src/trabajos.js'), mundo = leer('src/empleo-mundo.js'), juego = leer('src/empleo-juego.js');
  ok(main.includes("import { crearEmpleoJuego } from './empleo-juego.js';") && main.includes('empleoJuego = crearEmpleoJuego({') && main.includes("fallaSistema('empleo-armado', e)"), 'main.js crea el empleo, aislado');
  ok(main.includes("fallaSistema('empleo', e)") && main.includes('empleoJuego?.actualizar(dt)'), 'y lo actualiza con fallaSistema');
  ok(main.includes('const a = empleoJuego.accion(js)') && main.includes('empleoJuego?.tapaVecino(js)') && main.includes('cacheEmpleo = empleoJuego ? empleoJuego.accion(js) : null'), 'la E, el aviso y el vecino mirado');
  ok(main.indexOf('const a = empleoJuego.accion(js)') < main.indexOf('cercaDelMostrador()) { abrirAlmacen()'), 'la E del puesto va antes que la del mostrador del almacén');
  ok(/extras: \(\) => \(empleoJuego && !esDesafio/.test(main) && ui.includes('ctx.extras?.()'), 'el cuaderno trae la página «Trabajo en la aldea»');
  ok(tr.includes("import { turnosDelDia } from './empleo.js';") && tr.includes('jornalesHoy(p, dia) + turnosDelDia(p, dia)'), 'trabajos.js cuenta el turno en el cupo');
  ok(/MAT_FAUNA/.test(mundo) && !/ShaderMaterial|MeshBasicMaterial|MeshStandardMaterial|CanvasTexture/.test(mundo), 'el mundo usa el material de la fauna: no compila nada nuevo');
  ok(!/requestAnimationFrame|setInterval/.test(juego + mundo), 'nada corre por cuadro ni por intervalo propio');
  for (const f of ['src/empleo.js', 'src/empleo-juego.js', 'src/empleo-mundo.js']) {
    const t = leer(f).replace(/\/\/.*$/gm, '');
    ok(!/gamepad|mando|rumble/i.test(t), `${f}: sin mando`);
    ok(!/export (const|function) w*ñ/i.test(t), `${f}: nombres exportados sin ñ`);
  }
  const textos = [leer('src/empleo.js'), leer('src/empleo-juego.js')].join('\n');
  ok(!/\b(Shift|Work|Boss|Salary|Welcome|Clock in|Hello)\b/.test(textos.replace(/Mayús/g, '')), 'sin textos en otro idioma');
  ok(!leer('src/idioma-en.js').includes('empleo') && !/empleo/i.test(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v'].map((x) => leer(`src/idioma-en-${x}.js`)).join('')), 'ni tablas de traducción nuevas');
  ok(leer('package.json').includes('verificar-4-3-empleo.mjs'), 'la prueba está en el gate');
  ok(JSON.parse(leer('package.json')).version === '4.2.0', 'la versión no se subió');
}

console.log(`verificar-4-3-empleo: ${n} verificaciones ok`);
