// 4.4 · EMPLEADOS EN TU NEGOCIO PROPIO: reglas (módulo puro, se prueba en Node). Lo que toca el juego (el vecino detrás del mostrador, el panel, los
// avisos) está en empleados-negocio-juego.js. Nada de acá corre por cuadro: son cuentas que se hacen cada tanto (una vez por segundo) o al contratar.
//
// Cómo anda:
//   · podés contratar hasta 2 vecinos de la aldea a sueldo DIARIO (de lunes a sábado; el domingo descansan). Cada uno tiene su turno (el primero de 8:30 a 19,
//     el segundo de 11 a 21; el domingo descansan) y en ese rato deja lo que hacía en la aldea (su horario cambia: lo fija `rutinaAldea`);
//   · quién acepta lo decide la amistad (puntos de vecindad.js): con menos de 25 ni te conoce; de 25 a 49 acepta de mala gana y pide un 20 % más; de amigo
//     (50) acepta; de compadre (140) acepta con gusto, cobra un 10 % menos y rinde un poco más. Los que tienen un local propio con servicio (la panadera,
//     el carpintero, el herrero…) sólo aceptan si sos amigo, y cobran un 10 % más: dejan su local cerrado durante el turno. Los que sostienen un servicio
//     de todos (el jefe de estación, el banco, la maestra, la enfermera, la casa de té, el almacén de Ercilia…) no se contratan;
//   · VENDEN AUNQUE NO ESTÉS: con vos lejos del local (más de 35 m) las ventas se simulan por hora con las mismas reglas del local (los mismos clientes,
//     los mismos precios, el stock de los estantes, la caja con su tope y la fama), pero con un rendimiento: su `rendimiento` es la fracción de lo que
//     atenderías vos en esa hora. Arranca entre 55 % y 60 % y crece con los días de trabajo hasta un tope de entre 77 % y 85 % (más cuanto más hábil y
//     cuanto mejor amigo). Con los dos de turno a la vez (de 11 a 19) se suman: 1 − (1 − a)(1 − b);
//   · cuando estás, atendés vos (E) y ellos ayudan: al cliente que ya esperó unos segundos lo despachan ellos (menos gente que se cansa, mejor fama);
//   · el sueldo se paga al cerrar el turno de cada día: primero de la caja del local y, si no alcanza, de tu billetera. Si no hay con qué, se anota el impago;
//     al segundo impago seguido, se van (y la amistad cae). Si pasan más de 5 días sin que pases por el local, se van también (tope de lo que se acumula);
//   · lo vendido sin vos queda en la caja (tope de $12.000: con la caja llena no se vende) y al volver el juego te cuenta qué vendió cada uno.
// Sólo en el Relax. Una partida de antes no trae el campo: sale vacío (nadie contratado) y lo demás queda como estaba.
import { tasaPorHora, armarCliente, despachar, ponerAlDia, HORA_ABRE, HORA_CIERRA, CAJA_MAX as N_CAJA_MAX } from './negocio-propio.js';
import { formatoPesos, hayEconomia, pagar, pesosDe } from './economia.js';
import { esCumpleanos, HORA_FIESTA } from './aldea.js';

const entero = (v, max = 1e7) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };
const real = (v, a, b, d = a) => { const n = Number(v); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : d; };
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const redondear = (v, paso = 50) => Math.round(v / paso) * paso;

// ---------------------------------------------------------------- las reglas (todo en una tabla, para afinar el equilibrio en un solo lugar)
export const MAX_EMPLEADOS = 2;
export const TURNOS = [{ desde: 8.5, hasta: 19 }, { desde: 11, hasta: 21 }];   // de lunes a sábado; el domingo descansan
export const AUSENCIA_MAX_DIAS = 5;              // más días que éstos sin pasar por el local: se van
export const IMPAGOS_MAX = 2;                    // a los dos impagos seguidos, renuncia
export const SIM_MAX_HORAS = (AUSENCIA_MAX_DIAS + 1) * 24;
export const UMBRAL = { acepta: 25, amigo: 50, compadre: 140 };   // puntos de amistad (los de vecindad.js: AMISTAD.umbral)
export const RENDIMIENTO = { inicioBase: 0.50, inicioHab: 0.10, topeBase: 0.70, topeHab: 0.15, tau: 6, amigo: 0.03, compadre: 0.05, max: 0.9 };
export const SUELDO = { min: 600, max: 1200, habMin: 0.5, porHab: 1200, dueno: 1.1, desgana: 1.2, gusto: 0.9, redondeo: 50 };
// 4.4 (ajuste): con empleados el local está siempre atendido y se corre la voz: llegan más clientes de los que traería el local con vos lejos (por la cantidad de contratados), y el
// empleado ofrece algo más en cada venta (`propina`: un % extra sobre lo cobrado). Atendiendo vos nada de esto cambia.
export const EMP_LOCAL = { demanda: [1, 1.12, 1.35], propina: [0, 0.10, 0.20] };
export const AYUDA = { esperaBase: 22, esperaRend: 12, atencionBase: 7, atencionRend: 3 };   // segundos: cuándo ayuda y cuánto tarda en despachar
export const AMISTAD_EMP = { cadaDias: 4, suma: 2, despedido: -6, impago: -10, ausencia: -4 };

// ---------------------------------------------------------------- a quién se puede contratar
// `hab`: habilidad para atender público (0 a 1); `afin`: lo que suma en cada tipo de local (se ve en lo que sabe: la panadera con el pan);
// `dueno`: tiene un local propio con servicio, que queda cerrado durante el turno. Los que no están acá no se contratan.
export const CANDIDATOS = {
  madre: { hab: 0.80, afin: { panaderia: 0.10, almacen: 0.05 }, dueno: false },
  padre: { hab: 0.55, afin: { almacen: 0.05 }, dueno: false },
  modista: { hab: 0.75, afin: { almacen: 0.05 }, dueno: false },
  fotografa: { hab: 0.65, afin: {}, dueno: false },
  ceramista: { hab: 0.70, afin: {}, dueno: false },
  pintora: { hab: 0.50, afin: {}, dueno: false },
  andinista: { hab: 0.60, afin: {}, dueno: false },
  guardaparque: { hab: 0.60, afin: {}, dueno: false },
  panadera: { hab: 0.90, afin: { panaderia: 0.10, almacen: 0.05 }, dueno: true },
  tejedora: { hab: 0.75, afin: { almacen: 0.05 }, dueno: true },
  veterinaria: { hab: 0.70, afin: {}, dueno: true },
  herbolaria: { hab: 0.70, afin: { panaderia: 0.05 }, dueno: true },
  carpintero: { hab: 0.65, afin: { almacen: 0.10 }, dueno: true },
  herrero: { hab: 0.60, afin: {}, dueno: true },
  pescador: { hab: 0.55, afin: { almacen: 0.05 }, dueno: true },
  apicultor: { hab: 0.60, afin: { almacen: 0.05, panaderia: 0.05 }, dueno: true },
};
export const IDS_CANDIDATOS = Object.keys(CANDIDATOS);
export const esCandidato = (k) => typeof k === 'string' && Object.hasOwn(CANDIDATOS, k);
export const habilidadDe = (k, tipo) => (esCandidato(k) ? limitar(CANDIDATOS[k].hab + (CANDIDATOS[k].afin[tipo] || 0), 0.2, 1) : 0);

const TRATOS = { gusto: 'Acepta con gusto', normal: 'Acepta', desgana: 'Acepta de mala gana: pide más', rechaza: 'Todavía no te conoce lo bastante' };
export const textoTrato = (t) => TRATOS[t] || TRATOS.rechaza;
export const tratoPorPuntos = (puntos) => { const p = Number(puntos) || 0; return p >= UMBRAL.compadre ? 'gusto' : p >= UMBRAL.amigo ? 'normal' : p >= UMBRAL.acepta ? 'desgana' : 'rechaza'; };
export const nivelPorPuntos = (puntos) => { const p = Number(puntos) || 0; return p >= UMBRAL.compadre ? 2 : p >= UMBRAL.amigo ? 1 : 0; };

// Qué rinde un vecino en un tipo de local, a los `dias` de trabajo y con ese nivel de amistad (0 conocido, 1 amigo, 2 compadre): de 0,55 a 0,90
export function rendimientoPara(k, tipo, dias = 0, nivelAmistad = 0) {
  if (!esCandidato(k)) return 0;
  const R = RENDIMIENTO, hab = habilidadDe(k, tipo);
  const ini = R.inicioBase + R.inicioHab * hab, top = R.topeBase + R.topeHab * hab;
  const bono = nivelAmistad >= 2 ? R.compadre : nivelAmistad === 1 ? R.amigo : 0;
  return Math.round(limitar(ini + (top - ini) * (1 - Math.exp(-Math.max(0, Number(dias) || 0) / R.tau)) + bono, 0, R.max) * 1000) / 1000;
}
export const rendimientoDe = (emp, tipo, nivelAmistad = 0) => rendimientoPara(emp?.k, tipo, emp?.dias, nivelAmistad);
// El sueldo diario que pide, según su habilidad en ese local, si tiene local propio y cómo te trata
export function sueldoPara(k, tipo, trato = 'normal') {
  if (!esCandidato(k)) return 0;
  const S = SUELDO;
  let s = S.min + S.porHab * Math.max(0, habilidadDe(k, tipo) - S.habMin);
  if (CANDIDATOS[k].dueno) s *= S.dueno;
  if (trato === 'desgana') s *= S.desgana; else if (trato === 'gusto') s *= S.gusto;
  return redondear(limitar(s, S.min, S.max), S.redondeo);
}
// La oferta de un vecino, con los puntos de amistad que tenés: { ok, motivo?, trato, sueldo, inicio, tope, dueno }
export function ofertaDe(k, tipo, puntos) {
  if (!esCandidato(k)) return { ok: false, motivo: 'no-contrata', trato: 'rechaza', sueldo: 0 };
  const p = Number(puntos) || 0, trato = tratoPorPuntos(p), c = CANDIDATOS[k], nivel = nivelPorPuntos(p);
  const base = { trato, dueno: c.dueno, hab: habilidadDe(k, tipo), inicio: rendimientoPara(k, tipo, 0, nivel), tope: rendimientoPara(k, tipo, 1e3, nivel) };
  if (trato === 'rechaza') return { ...base, ok: false, motivo: 'amistad', sueldo: sueldoPara(k, tipo, 'desgana') };
  if (c.dueno && p < UMBRAL.amigo) return { ...base, ok: false, motivo: 'dueno', sueldo: sueldoPara(k, tipo, trato) };
  return { ...base, ok: true, sueldo: sueldoPara(k, tipo, trato) };
}

// ---------------------------------------------------------------- el tiempo: turnos y cobertura
export const diaSemana = (dia) => ((Math.max(1, Math.floor(Number(dia) || 1)) - 1) % 7 + 7) % 7;   // 0 lunes … 6 domingo (como la aldea)
// La ventana del turno ese día de la semana: [desde, hasta) o null si descansa (el domingo)
export function ventanaDeTurno(turno, ds) {
  if (ds === 6) return null;
  const t = TURNOS[turno === 1 ? 1 : 0];
  return [t.desde, t.hasta];
}
const partesDeAbs = (abs) => { const dia = Math.floor(abs / 24 + 1e-12); return { dia, hora: abs - dia * 24 }; };
// ¿Está de turno en esa hora absoluta (días*24 + hora)? No antes de que lo contrates, ni el domingo, ni en la fiesta de su cumpleaños (de 18 a 20: la aldea lo espera)
export function enTurno(emp, abs) {
  if (!emp || abs < emp.alta) return false;
  const { dia, hora } = partesDeAbs(abs), v = ventanaDeTurno(emp.turno, diaSemana(dia));
  if (!v || hora < v[0] || hora >= v[1]) return false;
  return !(hora >= HORA_FIESTA[0] && hora < HORA_FIESTA[1] && esCumpleanos(emp.k, dia));
}
// Con la lista de empleados, a esa hora: { e, activos: [{ emp, r }] }; `e` es la fracción de lo que atenderías vos (1 − Π(1 − r)).
// `ocupado(k)`: el que ahora está en otra cosa (la fiesta de la aldea, una cita) no atiende.
export function cobertura(lista, tipo, abs, nivelDe = () => 0, ocupado = null) {
  const activos = [];
  let falla = 1;
  for (const emp of lista || []) if (enTurno(emp, abs) && !(ocupado && ocupado(emp.k))) { const r = rendimientoDe(emp, tipo, nivelDe(emp.k)); activos.push({ emp, r }); falla *= 1 - r; }
  return { e: activos.length ? 1 - falla : 0, activos };
}
// Las horas del día (para el panel): «de 8:30 a 19 h»
const horaTxt = (h) => (Number.isInteger(h) ? String(h) : `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`);
export const textoTurno = (turno) => `de ${horaTxt(TURNOS[turno === 1 ? 1 : 0].desde)} a ${horaTxt(TURNOS[turno === 1 ? 1 : 0].hasta)} h`;

// ---------------------------------------------------------------- el estado guardado
export function empleadosNuevo() {
  return {
    v: 1, lista: [], sim: { ultima: 0, acum: 0, n: 0 }, visita: 0,
    pend: { ventas: 0, clientes: 0, sueldos: 0, cajaLlena: false, porEmp: {} },
    total: { contratados: 0, despedidos: 0, renuncias: 0, vendido: 0, sueldos: 0 },
  };
}
function sanearEmp(v, hoy, usados) {
  if (!objeto(v) || !esCandidato(v.k) || usados.has(v.k)) return null;
  const tope = hoy * 24 + 24;
  return {
    k: v.k, turno: v.turno === 1 ? 1 : 0, alta: real(v.alta, 0, tope, 0), dias: entero(v.dias, 1e5), sueldo: limitar(entero(v.sueldo, 1e5), SUELDO.min, SUELDO.max) || SUELDO.min,
    pagadoDia: Math.min(hoy, entero(v.pagadoDia, 1e6)), impagos: Math.min(IMPAGOS_MAX - 1, entero(v.impagos, 9)), vendido: entero(v.vendido, 1e10), clientes: entero(v.clientes, 1e7),
    amistadHasta: entero(v.amistadHasta, 1e6),
  };
}
// Lo guardado, saneado. `hoy`: el día de la partida (nada puede ser de un día que todavía no llegó).
export function sanearEmpleadosNegocio(v, hoy = 1e6) {
  const base = empleadosNuevo();
  if (!objeto(v)) return base;
  const dia = Math.max(1, entero(hoy, 1e6)), tope = dia * 24 + 24;
  const usados = new Set(), lista = [];
  for (const x of Array.isArray(v.lista) ? v.lista : []) {
    if (lista.length >= MAX_EMPLEADOS) break;
    const e = sanearEmp(x, dia, usados);
    if (!e) continue;
    if (lista.some((y) => y.turno === e.turno)) e.turno = e.turno === 1 ? 0 : 1;
    usados.add(e.k); lista.push(e);
  }
  const s = objeto(v.sim) ? v.sim : {}, p = objeto(v.pend) ? v.pend : {}, t = objeto(v.total) ? v.total : {};
  const porEmp = {};
  if (objeto(p.porEmp)) for (const k of IDS_CANDIDATOS) if (Object.hasOwn(p.porEmp, k) && objeto(p.porEmp[k])) porEmp[k] = { ventas: entero(p.porEmp[k].ventas, 1e8), clientes: entero(p.porEmp[k].clientes, 1e5) };
  return {
    v: 1, lista,
    sim: { ultima: real(s.ultima, 0, tope, 0), acum: real(s.acum, 0, 50, 0), n: entero(s.n, 1e9) },
    visita: Math.min(dia, entero(v.visita, 1e6)),
    pend: { ventas: entero(p.ventas, 1e8), clientes: entero(p.clientes, 1e5), sueldos: entero(p.sueldos, 1e8), cajaLlena: p.cajaLlena === true, porEmp },
    total: { contratados: entero(t.contratados, 1e5), despedidos: entero(t.despedidos, 1e5), renuncias: entero(t.renuncias, 1e5), vendido: entero(t.vendido, 1e10), sueldos: entero(t.sueldos, 1e10) },
  };
}
export const hayEmpleados = (p) => hayEconomia(p) && objeto(p?.empleadosNegocio);
export function empleadosDe(p) {
  if (!hayEconomia(p)) return null;
  if (!objeto(p.empleadosNegocio)) p.empleadosNegocio = empleadosNuevo();
  return p.empleadosNegocio;
}
export const empleadoDe = (E, k) => (E?.lista || []).find((x) => x.k === k) || null;
export const cuantosEmpleados = (E) => (E?.lista || []).length;

// ---------------------------------------------------------------- contratar y despedir
// `d`: { tipo, dia, abs, puntos } (la amistad la pone el juego). Vuelve { ok, motivo?, emp?, oferta }.
export function contratar(E, k, d) {
  if (!d.tipo) return { ok: false, motivo: 'sin-local' };
  if (!esCandidato(k)) return { ok: false, motivo: 'no-contrata' };
  if (empleadoDe(E, k)) return { ok: false, motivo: 'ya' };
  if (cuantosEmpleados(E) >= MAX_EMPLEADOS) return { ok: false, motivo: 'lleno' };
  const oferta = ofertaDe(k, d.tipo, d.puntos);
  if (!oferta.ok) return { ok: false, motivo: oferta.motivo, oferta };
  const turno = E.lista.some((x) => x.turno === 0) ? 1 : 0;
  const dia = Math.max(1, Math.floor(Number(d.dia) || 1));
  const emp = { k, turno, alta: Number(d.abs) || dia * 24, dias: 0, sueldo: oferta.sueldo, pagadoDia: dia, impagos: 0, vendido: 0, clientes: 0, amistadHasta: 0 };
  E.lista.push(emp);
  if (!E.sim.ultima || E.lista.length === 1) E.sim.ultima = emp.alta;
  E.visita = dia;
  E.total.contratados++;
  return { ok: true, emp, oferta };
}
function sacar(E, emp) { const i = E.lista.indexOf(emp); if (i >= 0) E.lista.splice(i, 1); delete E.pend.porEmp[emp.k]; }
// Pagar un día de sueldo (con lo que se debía): de la caja del local y, si no alcanza, de la billetera. Vuelve { ok, monto, deCaja, deBilletera }.
export function pagarJornada(p, est, emp, nombre = '') {
  const debe = emp.sueldo * (emp.impagos + 1);
  if (est.caja + pesosDe(p) < debe) return { ok: false, monto: 0, debe, deCaja: 0, deBilletera: 0 };
  const deCaja = Math.min(est.caja, debe), resto = debe - deCaja;
  if (resto > 0) { const r = pagar(p, resto, `Sueldo: ${nombre || emp.k}`, 'tu local'); if (!r.ok) return { ok: false, monto: 0, debe, deCaja: 0, deBilletera: 0 }; }
  est.caja -= deCaja;
  emp.impagos = 0;
  return { ok: true, monto: debe, deCaja, deBilletera: resto, debe };
}
// Despedir: se va. Si hoy ya trabajó (no es su primer día) y el sueldo de hoy no estaba pagado, se le paga ahora. `env`: { abs, nombre(k), cambiarAmistad(k, n) }
export function despedir(p, est, E, k, env = {}) {
  const emp = empleadoDe(E, k);
  if (!emp) return { ok: false, motivo: 'no-esta' };
  const abs = Number(env.abs) || emp.alta, { dia, hora } = partesDeAbs(abs), v = ventanaDeTurno(emp.turno, diaSemana(dia));
  let pago = null;
  if (v && hora >= v[0] && dia > emp.pagadoDia && dia > partesDeAbs(emp.alta).dia) {
    pago = pagarJornada(p, est, emp, env.nombre?.(k));
    if (pago.ok) { emp.pagadoDia = dia; emp.dias++; E.total.sueldos += pago.monto; }
  }
  sacar(E, emp);
  E.total.despedidos++;
  env.cambiarAmistad?.(k, AMISTAD_EMP.despedido);
  return { ok: true, emp, pago };
}

// ---------------------------------------------------------------- las ventas sin vos
// Simula las horas de `desde` a `hasta` (horas absolutas) con el local como está: por tramos de media hora, entran los clientes que traería la demanda del local
// (negocio-propio.js) por la fracción `e` que atienden los de turno, cada uno pide, se le despacha y se cobra a la caja; el stock, los precios, la fama y el
// tope de la caja son los de verdad. Vuelve { ventas, clientes, porEmp: { k: { ventas, clientes } }, cajaLlena }.
export function simularTramo(est, tipo, E, desde, hasta, env = {}) {
  const res = { ventas: 0, clientes: 0, porEmp: {}, cajaLlena: false };
  const nivel = env.nivel || (() => 0);
  let t = Number(desde) || 0;
  const fin = Number(hasta) || 0;
  while (t < fin - 1e-9) {
    const sigue = Math.min(fin, Math.floor(t * 2 + 1e-9) / 2 + 0.5), dt = sigue - t, mid = t + dt / 2;
    t = sigue;
    const { dia, hora } = partesDeAbs(mid);
    if (!est.abierto || est.tipo !== tipo || hora < HORA_ABRE || hora >= HORA_CIERRA) { E.sim.acum = 0; continue; }
    const cob = cobertura(E.lista, tipo, mid, nivel, env.ocupado);
    if (!cob.activos.length) { E.sim.acum = 0; continue; }
    if (dia > est.hoy.dia) ponerAlDia(est, dia);
    E.sim.acum = Math.min(50, E.sim.acum + tasaPorHora(est, tipo, hora, { lluvia: env.lluvia || 0 }) * cob.e * dt * (EMP_LOCAL.demanda[Math.min(2, E.lista.length)] || 1));
    while (E.sim.acum >= 1) {
      E.sim.acum -= 1; E.sim.n++;
      const c = armarCliente(est, tipo, `emp|${E.sim.n}`, hora);
      if (!c) { E.sim.acum = 0; break; }
      c.espera = Math.round(36 - 22 * cob.e);
      est.hoy.clientes++; est.total.clientes++;
      const r = despachar(est, c);
      if (!r.ok) { est.hoy.clientes--; est.total.clientes--; res.cajaLlena = true; E.sim.acum = 0; break; }
      if (!r.nada) {   // la propina del que ofrece más (con el tope de la caja)
        const extra = Math.min(Math.floor(r.total * EMP_LOCAL.propina[Math.min(2, E.lista.length)]), N_CAJA_MAX - est.caja);
        if (extra > 0) { est.caja += extra; est.hoy.ventas += extra; est.total.ventas += extra; r.total += extra; }
      }
      // lo atendió uno de los de turno (más seguido el que rinde más)
      let x = ((E.sim.n * 0.6180339887) % 1) * cob.activos.reduce((s, a) => s + a.r, 0), quien = cob.activos[cob.activos.length - 1];
      for (const a of cob.activos) { x -= a.r; if (x <= 0) { quien = a; break; } }
      res.clientes++;
      const pe = (res.porEmp[quien.emp.k] ||= { ventas: 0, clientes: 0 });
      pe.clientes++; quien.emp.clientes++;
      if (!r.nada) { res.ventas += r.total; pe.ventas += r.total; quien.emp.vendido += r.total; }
    }
  }
  return res;
}

// ---------------------------------------------------------------- cuando estás: ayudan
// De los que están de turno, el que esté libre despacha al cliente que ya esperó lo suyo. Vuelve [{ c, emp, r }] (el que llama los despacha).
export function elegirAyuda(cola, E, tipo, abs, nivelDe, dt = 1, ocupado = null) {
  const cob = cobertura(E.lista, tipo, abs, nivelDe, ocupado), out = [];
  for (const a of cob.activos) a.emp._cd = Math.max(0, (a.emp._cd || 0) - dt);
  for (const a of cob.activos) {
    if ((a.emp._cd || 0) > 0) continue;
    const c = cola.clientes.find((x) => x.listo && !x._ayuda && x.espera >= AYUDA.esperaBase - AYUDA.esperaRend * a.r);
    if (!c) continue;
    c._ayuda = true; a.emp._cd = AYUDA.atencionBase - AYUDA.atencionRend * a.r;
    out.push({ c, emp: a.emp, r: a.r });
  }
  return out;
}

// ---------------------------------------------------------------- el paso del tiempo (sueldos, ventas sin vos, renuncias)
// Eventos: { tipo: 'sueldo', k, monto, deCaja, deBilletera } · { tipo: 'impago', k, debe } · { tipo: 'renuncia', k, motivo: 'impago' | 'ausencia' }
//          { tipo: 'caja-llena' } · { tipo: 'vendieron', ventas, clientes }.
// `env`: { abs, presente, nivel(k), nombre(k), cambiarAmistad(k, n), lluvia, ocupado(k) }
export function avanzarEmpleados(p, est, tipo, E, env) {
  const ev = [];
  if (!E.lista.length) { E.sim.ultima = Number(env.abs) || 0; return ev; }
  const abs = Number(env.abs) || 0, dia = partesDeAbs(abs).dia;
  if (!(E.sim.ultima > 0) || E.sim.ultima > abs) E.sim.ultima = abs;
  if (env.presente) E.visita = dia;

  // 1. las ventas de las horas que pasaron sin vos
  if (!env.presente && est.tipo === tipo) {
    const r = simularTramo(est, tipo, E, Math.max(E.sim.ultima, abs - SIM_MAX_HORAS), abs, { nivel: env.nivel, lluvia: env.lluvia, ocupado: env.ocupado });
    if (r.clientes > 0 || r.ventas > 0) {
      E.pend.ventas += r.ventas; E.pend.clientes += r.clientes; E.total.vendido += r.ventas;
      for (const [k, x] of Object.entries(r.porEmp)) { const q = (E.pend.porEmp[k] ||= { ventas: 0, clientes: 0 }); q.ventas += x.ventas; q.clientes += x.clientes; }
    }
    if (r.cajaLlena) { E.pend.cajaLlena = true; ev.push({ tipo: 'caja-llena' }); }
  }
  E.sim.ultima = abs;

  // 2. los sueldos de los turnos que ya cerraron
  for (const emp of [...E.lista]) {
    for (let d = emp.pagadoDia + 1; d <= dia; d++) {
      const v = ventanaDeTurno(emp.turno, diaSemana(d));
      if (!v) { emp.pagadoDia = d; continue; }   // domingo: descansa
      if (abs < d * 24 + v[1]) break;            // el turno de ese día todavía no cerró
      // (el día en que lo contratás es de prueba: `contratar` lo deja como ya pagado, así que acá siempre es un día entero)
      const pago = pagarJornada(p, est, emp, env.nombre?.(emp.k));
      emp.pagadoDia = d;
      if (pago.ok) {
        emp.dias++; E.total.sueldos += pago.monto; E.pend.sueldos += pago.monto;
        ev.push({ tipo: 'sueldo', k: emp.k, monto: pago.monto, deCaja: pago.deCaja, deBilletera: pago.deBilletera });
        if (emp.dias - emp.amistadHasta >= AMISTAD_EMP.cadaDias) { emp.amistadHasta = emp.dias; env.cambiarAmistad?.(emp.k, AMISTAD_EMP.suma); }
      } else {
        emp.impagos++;
        if (emp.impagos >= IMPAGOS_MAX) {
          sacar(E, emp); E.total.renuncias++; env.cambiarAmistad?.(emp.k, AMISTAD_EMP.impago);
          ev.push({ tipo: 'renuncia', k: emp.k, motivo: 'impago' });
          break;
        }
        ev.push({ tipo: 'impago', k: emp.k, debe: pago.debe });
      }
    }
  }

  // 3. si pasan demasiados días sin que pases por el local, se van
  if (dia - E.visita > AUSENCIA_MAX_DIAS) {
    for (const emp of [...E.lista]) { sacar(E, emp); E.total.renuncias++; env.cambiarAmistad?.(emp.k, AMISTAD_EMP.ausencia); ev.push({ tipo: 'renuncia', k: emp.k, motivo: 'ausencia' }); }
  }
  return ev;
}

// ---------------------------------------------------------------- lo que cuenta el juego al volver
export const hayPendiente = (E) => !!E && (E.pend.ventas > 0 || E.pend.sueldos > 0 || E.pend.clientes > 0);
// [{ titulo, sub }] a mostrar al volver: quién vendió cuánto mientras no estabas (puro: se prueba)
export function resumenAlVolver(E, nombre = (k) => k) {
  if (!hayPendiente(E)) return null;
  const partes = Object.entries(E.pend.porEmp).filter(([, x]) => x.clientes > 0).map(([k, x]) => `${nombre(k)} vendió ${formatoPesos(x.ventas)} (${x.clientes} ${x.clientes === 1 ? 'cliente' : 'clientes'})`);
  const titulo = E.pend.ventas > 0 ? `Mientras no estabas, se vendió ${formatoPesos(E.pend.ventas)}` : 'Mientras no estabas, no se vendió nada';
  const sub = [partes.join('. '), E.pend.sueldos > 0 ? `Sueldos pagados: ${formatoPesos(E.pend.sueldos)}` : '', E.pend.cajaLlena ? 'La caja se llenó: retirá la plata para que sigan vendiendo' : ''].filter(Boolean).join('. ');
  return { titulo, sub };
}
export function limpiarPendiente(E) { E.pend = { ventas: 0, clientes: 0, sueldos: 0, cajaLlena: false, porEmp: {} }; }
