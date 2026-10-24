// 4.4.2 · Arreglos del empleo fijo tras la ronda de revisión de la 4.4.1 (zona B y lo que toca de la zona D). Un caso por cada arreglo, escrito para fallar sin él:
//   B1 el cupo de dos jornales vale en los dos sentidos · B3 el ascenso se avisa y se guarda aunque el oficio llegue después de los días · B4 no hay turno si el jefe
//   no está (fiesta, minga, baile, cumpleaños, cita) y el cartel dice por qué · B5 comprar el local con el turno en marcha lo cierra · B6 dormir antes de terminar
//   es irse antes · B7 con la hora de tu reloj el turno se cierra por la hora · B8 un solo aviso al irte lejos · B9 la tarea de las bandejas no cae sobre una silla y el
//   HUD del turno va dentro de #hud · B10 la cuenta del cartel coincide con el cierre · D6 la E del empleo no cae por un error · D7 el modo foto no cobra ni cierra.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const E = await import('../src/empleo.js');
const P = await import('../src/empleo-presencia.js');
const { economiaNueva, pesosDe } = await import('../src/economia.js');
const A = await import('../src/aldea.js');
const { sumarXp, oficiosNuevos } = await import('../src/oficios.js');
const T = await import('../src/trabajos.js');
const { planoCasaTe } = await import('../src/casa-te.js');
const { crearEmpleoJuego } = await import('../src/empleo-juego.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const relax = (pesos = 0, dia = 1, horas = 12) => ({ modo: 'relax', dia, horas, economia: { ...economiaNueva(), pesos }, oficios: oficiosNuevos() });

// ---------------------------------------------------------------- B1: el cupo de dos jornales, también al fichar
{
  const p = relax(10000, 3, 16);
  const claves = Object.keys(T.TRABAJOS);
  ok(T.cumplirJornal(p, claves[0], 3).ok && T.cumplirJornal(p, claves[1], 3).ok, 'dos jornales hechos hoy');
  const extra = { jornales: T.jornalesHoy(p, 3), porDia: T.JORNAL.porDia };
  eq(extra, { jornales: 2, porDia: 2 }, 'el juego cuenta los dos jornales');
  const v = E.puedeFichar(p, 'almacen', 3, 16, extra);
  ok(!v.ok && v.motivo === 'cupo', 'con los dos jornales hechos no se puede fichar el turno');
  ok(/dos jornales/.test(E.textoNoPodes(v, 'almacen')), 'y el cartel lo dice');
  ok(!E.fichar(p, 'almacen', 3, 16, extra).ok && E.turnoActivo(p) === null, 'fichar tampoco');
  const q = relax(10000, 3, 16);
  T.cumplirJornal(q, claves[0], 3);
  ok(E.puedeFichar(q, 'almacen', 3, 16, { jornales: T.jornalesHoy(q, 3), porDia: 2 }).ok, 'con un solo jornal hecho, el turno entra (turno + un jornal)');
  ok(E.puedeFichar(relax(0, 3, 16), 'almacen', 3, 16, { jornales: 0, porDia: 2 }).ok, 'sin jornales, claro que sí');
  // por el juego
  const { J, js, ponerEn, notas } = armarJuego(q, {});
  q.dia = 4; q.horas = 16;
  T.cumplirJornal(q, claves[0], 4); T.cumplirJornal(q, claves[1], 4);
  ponerEn('almacen', 'ficha');
  const a = J.accion(js);
  ok(a.tipo === 'info', 'en el cartel, con los dos jornales hechos, sólo informa');
  a.hacer();
  ok(/dos jornales/.test(notas.at(-1)[1]), 'y dice por qué');
}

// ---------------------------------------------------------------- B3: el ascenso se avisa aunque el oficio llegue después de los días
{
  const p = relax(0, 6, 16);
  E.empleoDe(p).locales.almacen = { dias: 5, faltas: 0, escalon: 0, ultimo: 5, cobrado: 0 };
  ok(E.escalonDe(p, 'almacen') === 0, 'con 5 días y sin oficio, sigue de aprendiz');
  sumarXp(p.oficios, 'huertero', 50);
  ok(E.escalonDe(p, 'almacen') === 1, 'el oficio llegó después: ahora te toca empleado');
  eq(E.puedeFichar(p, 'almacen', 6, 16).sueldo, 2100, 'el cartel ya ofrece $2.100');
  E.fichar(p, 'almacen', 6, 16);
  while (!E.hacerTarea(p).terminado);
  const r = E.cerrarTurno(p, 'completo');
  ok(r.ascendio && r.ascendio.nombre === 'Empleado' && r.ascendio.cargo === 'Despachante', 'al cerrar el turno se avisa «Ascendiste»');
  eq(p.empleo.locales.almacen.escalon, 1, 'y el escalón queda guardado');
  // y no se avisa dos veces
  p.dia = 7; E.empleoDe(p).hoy = { dia: 6, turnos: 1 };
  E.fichar(p, 'almacen', 8, 16);
  while (!E.hacerTarea(p).terminado);
  eq(E.cerrarTurno(p, 'completo').ascendio, null, 'el siguiente turno ya no repite el ascenso');
  // el orden de siempre sigue andando (el oficio primero, los días al final)
  const q = relax(0, 6, 16);
  sumarXp(q.oficios, 'huertero', 50);
  E.empleoDe(q).locales.almacen = { dias: 4, faltas: 0, escalon: 0, ultimo: 5, cobrado: 0 };
  E.fichar(q, 'almacen', 6, 16);
  while (!E.hacerTarea(q).terminado);
  ok(E.cerrarTurno(q, 'completo').ascendio?.nombre === 'Empleado', 'con el oficio primero y el día que faltaba al final, también avisa');
}

// ---------------------------------------------------------------- B4: sin el jefe en su local, hoy no hay turno
{
  const aldea = A.aldeaNueva(); aldea.locales.salon = {}; aldea.cercanos = ['ercilia'];
  const p = { ...relax(0, 1, 16), aldea };
  const donde = (fiesta) => (c, d, h) => P.dondeEstaElJefe(p, c, d, h, fiesta);
  // un lunes normal: todos en su lugar
  for (const k of E.IDS_PUESTOS) ok(E.puedeFichar(p, k, 1, E.PUESTOS[k].desde, { donde: donde(null) }).ok, `${k}: un lunes cualquiera hay turno`);
  // el sábado de baile con el salón abierto: Ercilia se va a las 16:15 y no vuelve
  const sab = E.puedeFichar(p, 'almacen', 6, 16, { donde: donde(null) });
  ok(!sab.ok && sab.motivo === 'ausente' && /baile/.test(sab.razon), 'el sábado de baile no hay turno en el almacén (Ercilia está en el baile)');
  ok(/Hoy no hay turno: Ercilia está en el baile del salón/.test(E.textoNoPodes(sab, 'almacen')), 'y el cartel dice que hoy no hay turno y por qué');
  ok(E.puedeFichar(p, 'casa-te', 6, 9, { donde: donde(null) }).ok && E.puedeFichar(p, 'banco-pueblo', 6, 8.5, { donde: donde(null) }).ok, 'pero la casa de té y el banco siguen abiertos ese sábado');
  // el cumpleaños de Ercilia (día 18, de 18 a 20) se lleva la mitad del turno
  const cum = E.puedeFichar(p, 'almacen', 18, 16, { donde: donde(null) });
  ok(!cum.ok && cum.motivo === 'ausente' && /cumpleaños/.test(cum.razon), 'el cumpleaños de Ercilia: hoy no hay turno en el almacén');
  // la minga (día 7 del año... domingo) y una fiesta: el jefe va al predio
  const minga = (c, d, h) => (c === 'galesa' && h >= 9 && h < 13 ? { tipo: 'minga' } : null);
  const m = E.puedeFichar(p, 'casa-te', 2, 9, { donde: donde(minga) });
  ok(!m.ok && m.motivo === 'ausente' && /minga/.test(E.textoNoPodes(m, 'casa-te')), 'el día de la minga Ceinwen no está: no hay turno en la casa de té');
  const mesa = (c, d, h) => (c === 'galesa' && h >= 12 && h < 13 ? { tipo: 'fiesta' } : null);
  ok(E.puedeFichar(p, 'casa-te', 2, 9, { donde: donde(mesa) }).ok, 'una hora de mesa larga de las cuatro del turno no alcanza para cancelarlo');
  const fiesta = (c, d, h) => (c === 'martin' && h >= 8 && h < 12 ? { tipo: 'fiesta' } : null);
  ok(/en la fiesta/.test(E.textoNoPodes(E.puedeFichar(p, 'taller-tren', 2, 8, { donde: donde(fiesta) }), 'taller-tren')), 'una fiesta que se lleva a Martín: «está en la fiesta»');
  // la cita y el casamiento de Ceinwen (la única de los cuatro jefes que es candidata al romance): la cita se la lleva un rato (hora y media) y el casamiento, casi todo el turno
  const unidos = { ...p, amor: { personas: {}, hijos: [], correo: [], radio: [], cita: { clave: 'galesa', lugar: 'mirador', dia: 2, desde: 9, hasta: 10.5, estado: 'acordada' }, boda: null } };
  eq(P.dondeEstaElJefe(unidos, 'galesa', 2, 9.5).razon, 'tiene una cita', 'con la cita, Ceinwen no está en la casa de té');
  ok(E.puedeFichar(unidos, 'casa-te', 2, 9, { donde: (c, d, h) => P.dondeEstaElJefe(unidos, c, d, h) }).ok, 'una cita de hora y media no cancela un turno de cuatro');
  unidos.amor.cita = null; unidos.amor.boda = { con: 'galesa', dia: 2, hora: 11 };
  const boda = E.puedeFichar(unidos, 'casa-te', 2, 9, { donde: (c, d, h) => P.dondeEstaElJefe(unidos, c, d, h) });
  ok(!boda.ok && boda.motivo === 'ausente' && /se casa/.test(E.textoNoPodes(boda, 'casa-te')), 'el día que Ceinwen se casa no hay turno en la casa de té');
  // sin el dato (o si falla), el jefe está: nada cambia
  ok(E.puedeFichar(p, 'almacen', 6, 16).ok, 'sin la mirada de presencia, se ficha como antes');
  ok(E.puedeFichar(p, 'almacen', 6, 16, { donde: () => { throw new Error('x'); } }).ok, 'y si la mirada falla, también');
  // lo demás no cambia: sueldos y horarios
  eq(E.IDS_PUESTOS.map((k) => [E.PUESTOS[k].desde, E.PUESTOS[k].hasta, E.PUESTOS[k].sueldos]), [[16, 20, [1600, 2100, 2700]], [9, 13, [1600, 2000, 2600]], [8, 12, [1800, 2300, 2800]], [8.5, 12.5, [1700, 2200, 2800]]], 'los horarios y los sueldos de los cuatro locales no cambian');
  // el juego usa la presencia real de la aldea (sin fiestas armadas)
  const { J, js, ponerEn, notas } = armarJuego({ ...relax(0, 6, 15.8), aldea }, {});
  ponerEn('almacen', 'ficha');
  const a = J.accion(js);
  ok(a.tipo === 'info', 'en el juego, el cartel del almacén el sábado de baile sólo informa');
  a.hacer();
  ok(/Hoy no hay turno: Ercilia está en el baile del salón/.test(notas.at(-1)[1]), 'y dice que hoy no hay turno y por qué');
}

// ---------------------------------------------------------------- B5: comprar el local con el turno en marcha
{
  const p = relax(0, 2, 16);
  const { J, js, ponerEn, notas } = armarJuego(p, {});
  ponerEn('almacen', 'ficha');
  E.fichar(p, 'almacen', 2, 16);
  for (let i = 0; i < 3; i++) E.hacerTarea(p);
  p.negociosVecinos = { v: 1, comprados: { almacen: { orden: 1 } } };
  J.actualizar(0.6);
  eq(J.turno(), null, 'al comprar el almacén con el turno en marcha, el turno se cierra solo');
  eq(pesosDe(p), 600, 'se cobra lo hecho hasta ahí (3 de 8), sin multa');
  eq([p.empleo.locales.almacen.dias, p.empleo.total.turnos], [0, 1], 'sin sumar el día cumplido');
  ok(/Ya es tuyo el almacén/.test(notas.at(-1)[0]), 'con su aviso');
  ok(!E.puedeFichar(p, 'almacen', 3, 16).ok && E.puedeFichar(p, 'almacen', 3, 16).motivo === 'tuyo', 'y desde que es tuyo no se ofrece turno ahí');
  const r = E.resumenEmpleo(p);
  ok(r.locales.find((l) => l.local === 'almacen').tuyo === true && r.locales.find((l) => l.local === 'casa-te').tuyo === false, 'el cuaderno sabe que es tuyo');
  // una compra que llega antes de hacer nada: cierra sin cobrar y deja el día libre
  const q = relax(0, 2, 16);
  const J2 = armarJuego(q, {});
  E.fichar(q, 'casa-te', 2, 9); q.horas = 9;
  q.negociosVecinos = { v: 1, comprados: { 'casa-te': { orden: 1 } } };
  J2.J.actualizar(0.6);
  eq([J2.J.turno(), pesosDe(q)], [null, 0], 'sin tareas hechas no se cobra nada');
}

// ---------------------------------------------------------------- B6: dormir sin terminar el turno es irse antes
{
  const p = relax(0, 2, 19.7);
  const { J, js, ponerEn, notas } = armarJuego(p, {});
  E.fichar(p, 'almacen', 2, 16);
  for (let i = 0; i < 3; i++) E.hacerTarea(p);
  J.actualizar(0.6);   // una pasada con el reloj a las 19:42
  p.dia = 3; p.horas = 7;   // dormiste
  J.actualizar(0.6);
  eq(J.turno(), null, 'al dormir se cierra el turno');
  eq(pesosDe(p), 450, 'con la multa del 25 % sobre lo hecho ($600 menos $150)');
  eq(p.empleo.locales.almacen.faltas, 1, 'y la falta');
  ok(/dormir/.test(notas.at(-1)[0]), 'el aviso dice que te fuiste a dormir');
  // una siesta que se pasa de la hora de cierre en el último tramo
  const q = relax(0, 2, 12.2);
  const J2 = armarJuego(q, {});
  E.fichar(q, 'casa-te', 2, 9);
  for (let i = 0; i < 4; i++) E.hacerTarea(q);
  J2.J.actualizar(0.6);
  q.horas = 14.5;   // la siesta de dos horas
  J2.J.actualizar(0.6);
  eq([pesosDe(q), q.empleo.locales['casa-te'].faltas], [600, 1], 'la siesta que cruza la hora de cierre también lleva multa y falta');
  // el turno que se pasa de hora trabajando de verdad se cierra como siempre, sin multa
  const r = relax(0, 2, 19.9);
  const J3 = armarJuego(r, {});
  E.fichar(r, 'almacen', 2, 16);
  for (let i = 0; i < 3; i++) E.hacerTarea(r);
  J3.J.actualizar(0.6);
  r.horas = 20.4; J3.J.actualizar(0.6);   // (el reloj corre de a poco: pasa la hora de cierre y sigue la gracia)
  r.horas = 20.8;
  J3.J.actualizar(0.6);
  eq([pesosDe(r), r.empleo.locales.almacen.faltas], [600, 0], 'pasada la hora de cierre trabajando, cobrás lo hecho, sin multa');
}

// ---------------------------------------------------------------- B7: con la hora de tu reloj el turno se cierra por la hora
{
  const p = relax(0, 4, 8);
  E.fichar(p, 'almacen', 4, 16);
  eq(E.motivoDeCierre(p, 4, 23.5, true), 'tiempo', 'a las 23:30 de tu reloj, el turno de 16 a 20 se cerró');
  eq(E.motivoDeCierre(p, 4, 20.5, true), null, 'dentro de la gracia, no');
  const { J } = armarJuego(p, { reloj: true });
  p.horas = 20.5; J.actualizar(0.6);
  p.horas = 23.5; J.actualizar(0.6);
  eq(J.turno(), null, 'y el juego lo cierra aunque el reloj no salte');
}

// ---------------------------------------------------------------- B8: un solo aviso al irte lejos
{
  const p = relax(0, 2, 16);
  const { J, js, ponerEn, notas } = armarJuego(p, {});
  ponerEn('almacen', 'ficha');
  E.fichar(p, 'almacen', 2, 16);
  E.hacerTarea(p);
  const antes = notas.length;
  js.pos.x += 60;
  J.actualizar(0.6);
  eq(J.turno(), null, 'a más de 45 m se cierra');
  eq(notas.length - antes, 1, 'con un solo aviso');
  ok(/Te fuiste del almacén/.test(notas.at(-1)[0]) && /ya descontados/.test(notas.at(-1)[1]), 'el del cierre, que dice lo que cobraste y la multa');
}

// ---------------------------------------------------------------- B9: la tarea de las bandejas y el HUD
{
  const plano = planoCasaTe(), t = E.PUESTOS['casa-te'].tareas.find((x) => x.id === 'bandejas');
  let minima = 99;
  for (const m of plano.mesas) for (const s of m.sillas) minima = Math.min(minima, Math.hypot(s.x - t.x, s.z - t.z));
  ok(minima >= 1.5, `la tarea de las bandejas queda a ${minima.toFixed(2)} m de la silla más cercana (no a 0,27)`);
  for (const k of E.IDS_PUESTOS) for (const u of E.PUESTOS[k].tareas) ok(Math.abs(u.x) <= A.EDIFICIOS_ALDEA[k].ancho / 2 + 5 && Math.abs(u.z) <= A.EDIFICIOS_ALDEA[k].fondo / 2 + 5, `${k}/${u.id}: sigue en el local`);
  const src = leer('src/empleo-juego.js');
  ok(src.includes("document.getElementById('hud')") && !/#turno-hud[^]*z-index/.test(src) && !/position:fixed;left:14px;top:96px/.test(src), 'el HUD del turno va dentro de #hud (debajo de la pausa y el cuaderno, escondido en el modo foto, con la letra grande)');
  ok(src.includes("setAttribute('aria-live', 'off')"), 'y no anuncia cada minuto del reloj');
}

// ---------------------------------------------------------------- B10: la cuenta del cartel coincide con el cierre real
{
  const P = E.PUESTOS.almacen, tarde = P.hasta - E.EMPLEO.horasMinimas;
  const posibles = E.tareasPosibles('almacen', tarde);
  const hastaElCierre = P.hasta + E.EMPLEO.gracia - tarde;
  ok(posibles === Math.floor(hastaElCierre / E.EMPLEO.horasPorTareaEstimada), `fichando a las ${tarde} entran ${posibles}: lo que cabe hasta el cierre real (con la gracia)`);
  eq(E.tareasPosibles('almacen', 12), 8, 'fichando a horario entran las ocho');
  const o = E.textoOferta('almacen', 0, posibles);
  ok(/entran unas \d+ tareas de 8/.test(o) && /el día no cuenta para el ascenso/.test(o), 'el cartel avisa cuando son tan pocas que el día no suma');
  ok(!/no cuenta/.test(E.textoOferta('almacen', 0, 7)), 'con siete o más no hace falta el aviso');
}

// ---------------------------------------------------------------- D6: la E y el aviso no caen por un error del empleo
{
  const p = relax(0, 2, 16);
  const caidas = [];
  const J = crearEmpleoJuego({
    progreso: () => { throw new Error('roto'); }, jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 } } }), escena: () => null, desafio: () => false,
    nota: () => {}, guardar: () => {}, sonido: () => ({}), confirmar: async () => true, avanzarHoras: () => true, reloj: () => false, ver: () => true, azar: () => 0, falla: (nom) => caidas.push(nom),
  });
  eq(J.accion({ pos: { x: 0, y: 0, z: 0 } }), null, 'un error adentro devuelve «nada que hacer»');
  eq(J.tapaVecino({ pos: { x: 0, y: 0, z: 0 } }), false, 'y no le saca la E al vecino');
  eq(caidas, ['empleo-accion', 'empleo-accion'], 'queda anotado como caída del sistema');
  void p;
}

// ---------------------------------------------------------------- D7 y lo que se engancha en main.js
{
  const main = leer('src/main.js');
  ok(/!desafio && !foto\.activo\) negocioJuego\?\.actualizar\(dt\)/.test(main) && /!desafio && !foto\.activo\) empleadosNegocioJuego\?\.actualizar\(dt\)/.test(main) && /!desafio && !foto\.activo\) negociosVecinosJuego\?\.actualizar\(dt\)/.test(main),
    'con el modo foto la hora del deslizador no corre el local, los empleados ni los negocios comprados (no hay cobros ni cierres)');
  ok(/!desafio && !foto\.activo\) empleoJuego\?\.actualizar\(dt\)/.test(main), 'ni el turno del empleo');
  ok(main.includes('fiestaEn: (k, d, h) => fiestasJuego?.destinoEn?.(k, d, h)'), 'main.js le da al empleo la mirada de las fiestas');
  ok(leer('src/fiestas-juego.js').includes('function destinoEn(k, d, h)'), 'y fiestas-juego.js la tiene');
  const inglesEnLoNuevo = /\b(the|and|with|you|your)\b/i.test(leer('src/empleo-presencia.js'));
  ok(!inglesEnLoNuevo, 'sin inglés en lo nuevo');
}

console.log(`verificar-4-4-2-empleo: ${n} verificaciones ok`);

// ---------------------------------------------------------------- el juego con un contexto de mentira
function armarJuego(p, { reloj = false, fiestaEn = null } = {}) {
  const notas = [];
  const js = { pos: { x: 5000, y: 0, z: 5000 } };
  const ctx = {
    progreso: () => p, jugador: () => ({ estado: js }), escena: () => null, desafio: () => false,
    nota: (t, sub) => notas.push([t, sub || '']), guardar: () => {},
    sonido: () => ({ juntar: () => {}, anotar: () => {}, paso: () => {} }),
    confirmar: async () => true,
    avanzarHoras: (h) => { if (reloj) return false; p.horas += h; if (p.horas >= 24) { p.horas -= 24; p.dia++; } return true; }, reloj: () => reloj, ver: () => true, azar: () => 0,
    fiestaEn, falla: (nom, e) => { throw e; },
  };
  const J = crearEmpleoJuego(ctx);
  const ponerEn = (k, id, dx = 0, dz = 0) => { const l = J.lugar(k, id); js.pos.x = l.x + dx; js.pos.z = l.z + dz; js.pos.y = l.y; return l; };
  if (!p.oficios) p.oficios = oficiosNuevos();
  ponerEn('almacen', 'ficha');
  return { J, js, ponerEn, notas };
}
