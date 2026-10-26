// 4.4 · EMPLEADOS EN TU NEGOCIO PROPIO, lo que toca el juego: la sección «Empleados» del panel del local (contratar y despedir), el vecino contratado trabajando
// detrás del mostrador durante su turno, la cuenta de lo que se vende cuando no estás (cada segundo, no por cuadro), el sueldo y los avisos («vendió», «cobra su
// sueldo», «renunció»). Las reglas (quién acepta, cuánto cobra, cuánto rinde, las ventas simuladas) están en empleados-negocio.js; el local, la cola de clientes y
// el panel son de negocio-propio-juego.js (acá sólo se usa lo que ése muestra).
//
// Cómo anda:
//   · `progreso.empleadosNegocio` guarda a los contratados, lo que llevan vendido y lo que quedó sin contarte; una partida de antes no lo trae y sale vacío;
//   · el vecino contratado deja la aldea durante su turno (`ocupacion`, el enganche que fija main.js en rutinaAldea) y su figura —armada de a poco como la de los
//     clientes— aparece detrás del mostrador de tu local (entra caminando si estás cerca y se va caminando al terminar el turno);
//   · con vos a menos de 35 m el local anda como siempre (clientes de a uno, E para atender) y los de turno ayudan: al que ya esperó unos segundos lo despachan ellos;
//     con vos lejos no hay figuras de clientes: las ventas se simulan por horas (empleados-negocio.js) y, al volver, el juego te cuenta qué vendió cada uno;
//   · el sueldo se paga solo al cerrar el turno de cada día (de la caja del local y, si no alcanza, de tu billetera).
import { hayEconomia, formatoPesos } from './economia.js';
import { esVecinoAldea, personaAldea, localAbierto, LOTE_DE, diaSemanaDe } from './aldea.js';
import { nombreCorto, puntosAmistad, cambiarAmistad } from './vecindad.js';
import { COLA, textoLista } from './negocio-propio.js';
import { negocioDeVecino, esTuyo } from './negocios-vecinos.js';
import { REPOSICION, aplicaReposicion, reponibles } from './negocio-propio-reposicion.js';
import { MOSTRADOR_Z } from './planos-negocio.js';
import {
  IDS_CANDIDATOS, MAX_EMPLEADOS, AUSENCIA_MAX_DIAS, esCandidato, empleadosDe, empleadoDe, cuantosEmpleados, contratar, despedir, ofertaDe, textoTrato, nivelPorPuntos,
  rendimientoDe, ventanaDeTurno, enTurno, textoTurno, elegirAyuda, avanzarEmpleados, hayPendiente, resumenAlVolver, limpiarPendiente,
} from './empleados-negocio.js';

const RADIO_FIGURAS = 110;      // a cuántos metros se arma la figura del empleado
const RADIO_VER = 60;           // a cuántos metros se lo ve entrar y salir caminando (más lejos, aparece o se va de una)
const PASO = 0.5;               // cada cuánto se mira (segundos): nada por cuadro
const CADA = 1;                 // cada cuánto se cuentan sueldos y ventas sin vos (segundos)

export function crearEmpleadosNegocioJuego(ctx) {
  const P = () => ctx.progreso();
  const negocio = () => ctx.negocio?.();
  const estadoE = () => (hayEconomia(P()) ? empleadosDe(P()) : null);
  const nombreDe = (k) => nombreCorto(k) || k;
  const nivelDe = (k) => nivelPorPuntos(puntosAmistad(k, P()));
  // los días de fiesta grande (la cosecha), una cita o el asado, la aldea lo lleva a otra parte: manda lo de la aldea y en el local no está (sigue cobrando)
  const ocupado = (k) => !!ctx.evento?.(k);
  const absAhora = () => (Number(P().dia) || 1) * 24 + (Number(P().horas) || 0);
  const figuras = new Map();   // clave del vecino → { k, npc, tarea, fase: 'libre' | 'entra' | 'puesto' | 'sale', t }
  let acum = 0, acumCuenta = 0, armando = null, sinLugar = 0, ultimoResumen = -99, relojResumen = 0, guardadoN = -1;
  const ui = { contratando: false, despedir: null };

  // ---------------------------------------------------------------- el enganche con la aldea
  // ¿Está `k` de turno a esa hora, ese día de la semana? (lo mira rutinaAldea cada vez que arma el día de alguien: tiene que ser barato)
  function ocupacion(k, h, ds, dia) {
    const p = P();
    const e = p?.empleadosNegocio;
    if (!e || !e.lista?.length || p.modo === 'desafio') return false;
    for (const x of e.lista) {
      if (x.k !== k) continue;
      if (dia !== null && dia !== undefined) return enTurno(x, dia * 24 + h);   // (no antes de la alta, ni el domingo, ni en la fiesta de su cumpleaños)
      const v = ventanaDeTurno(x.turno, ds);
      return !!v && h >= v[0] && h < v[1];
    }
    return false;
  }
  // 4.10.1: ¿`k` está AHORA detrás de tu mostrador (de turno y sin que la aldea se lo haya llevado a una fiesta o una cita)? Lo miran el club de lectura, la noche de
  // estrellas y las visitas a tu mesa: el vecino con turno activo no va, así no queda en dos lugares a la vez
  function deTurno(k) {
    const p = P();
    return ocupacion(k, Number(p?.horas) || 0, diaSemanaDe(p?.dia), Number(p?.dia) || 1) && !ocupado(k);
  }
  // 4.11.2 (D3): por dónde sale del local el empleado cuando termina el turno ({ x, z, saliendo }) o null si no es de acá. aldea-gente.js lo usa: su figura de la
  // aldea reaparece ahí (y no donde la rutina lo dejó, en su puerta) y camina desde el local; mientras la figura del mostrador se está yendo, espera
  function salidaDeTurno(k) {
    const E = estadoE(), N = negocio();
    const emp = E ? empleadoDe(E, k) : null, o = N?.local?.();
    if (!emp || !o) return null;
    const s = puesto(o, emp.turno), d0 = aMundo(o, lado(emp.turno) * 5, -s.D / 2 - 12);
    const fase = figuras.get(k)?.fase;   // (también 'entra' y 'puesto': si todavía no vio que terminó el turno, la figura sigue en el local)
    return { x: d0.x, z: d0.z, saliendo: fase === 'sale' || fase === 'entra' || fase === 'puesto' };
  }
  // los que se pueden contratar y están en la aldea (los pobladores, sólo con su local abierto)
  // 4.4.2: al que ya atiende el negocio que le compraste (su sueldo ya lo descuenta ese negocio) no se lo contrata además: cobraría dos veces
  const suNegocioEsTuyo = (k) => { const id = negocioDeVecino(k); return !!id && esTuyo(P(), id); };
  function enLaAldea(k) {
    if (!esCandidato(k) || suNegocioEsTuyo(k)) return false;
    if (esVecinoAldea(k)) return true;
    const a = P().aldea || {};
    return (a.pobladores || []).some((q) => q.clave === k) && localAbierto(a, LOTE_DE[k]);
  }

  // ---------------------------------------------------------------- la figura detrás del mostrador
  const aMundo = (o, lx, lz) => negocio().aMundo(o, lx, lz);
  const puesto = (o, turno) => { const D = negocio().medidas(o).D; return { lx: turno === 1 ? -0.7 : 0.7, lz: MOSTRADOR_Z(D) + 0.78, D }; };
  const lado = (turno) => (turno === 1 ? -1 : 1);
  function poner(f, x, z) { const n = f.npc; n.pos.set(x, ctx.alturaDePie ? ctx.alturaDePie(x, z, n.pos.y) : n.pos.y, z); }
  function mirarAlFrente(f, o, emp) {
    const s = puesto(o, emp.turno), yo = aMundo(o, s.lx, s.lz), al = aMundo(o, s.lx, -s.D / 2 - 4);
    f.npc.miraFinal = Math.atan2(al.x - yo.x, al.z - yo.z);
  }
  function figuraDe(k) {
    if (!figuras.has(k)) figuras.set(k, { k, npc: null, tarea: null, fase: 'libre', t: 0 });
    return figuras.get(k);
  }
  function soltar(f) {
    const g = ctx.gente?.();
    const n = f.npc || f.tarea?.npc;
    if (n) g?.quitar?.(n);
    figuras.delete(f.k);
    if (armando === f) armando = null;
  }
  function quitarFiguras() { for (const f of [...figuras.values()]) soltar(f); armando = null; }
  function defDe(k, o, emp) {
    const dp = personaAldea(k) || {};
    const s = puesto(o, emp.turno), p0 = aMundo(o, lado(emp.turno) * 5, -s.D / 2 - 12), al = aMundo(o, s.lx, s.lz);
    return { clave: `${esVecinoAldea(k) ? 'aldea' : 'poblador'}-${k}`, colores: dp.colores || {}, nombre: nombreDe(k), oficio: 'empleado', pos: { x: p0.x, z: p0.z }, mira: { x: al.x, z: al.z }, mano: null, velocidad: 1.0, camino: [], saludo: '', despedida: '', talla: dp.talla };
  }
  function avanzarArmado(o, emps) {
    const g = ctx.gente?.();
    if (!g?.armarPobladorDeAPoco) return;
    let ms = ctx.msFigura?.() ?? 3;
    if (!(ms > 0)) { sinLugar++; if (sinLugar < 20) return; ms = 3; }
    sinLugar = 0;
    if (!armando) { const emp = emps.find((e) => !figuraDe(e.k).npc); if (!emp) return; armando = figuraDe(emp.k); armando.emp = emp; }
    const f = armando, emp = f.emp;
    if (!emp || !empleadoDe(estadoE(), emp.k)) { soltar(f); armando = null; return; }
    if (!f.tarea) f.tarea = g.armarPobladorDeAPoco(defDe(f.k, o, emp));
    if (f.tarea.avanzar(ms)) {
      f.npc = f.tarea.npc; f.tarea = null; armando = null;
      if (f.npc) { f.npc.dormido = true; f.npc.sinFrenar = true; f.npc.empleadoNegocio = true; f.npc.camino = []; f.npc.velocidad = 1.0; f.fase = 'libre'; }
    }
  }
  // Entra al turno: si estás cerca, camina desde el frente del local, rodeando el mostrador por el costado; si no, ya está en su lugar
  function entrar(f, o, emp, cerca) {
    const s = puesto(o, emp.turno), n = f.npc, l = lado(emp.turno);
    n.dormido = false; n.enCita = false;
    if (cerca) {
      const d0 = aMundo(o, l * 5, -s.D / 2 - 12), a = aMundo(o, l * 1.9, -s.D / 2 - 1), b = aMundo(o, l * 1.9, -0.2), c = aMundo(o, s.lx, s.lz);
      poner(f, d0.x, d0.z);
      n.camino = [{ x: a.x, z: a.z, cerca: 0.5 }, { x: b.x, z: b.z, cerca: 0.4 }, { x: c.x, z: c.z, cerca: 0.25 }];
      f.fase = 'entra'; f.t = 0;
    } else {
      const c = aMundo(o, s.lx, s.lz);
      poner(f, c.x, c.z); n.camino = []; f.fase = 'puesto';
    }
    mirarAlFrente(f, o, emp);
  }
  function salir(f, o, emp, cerca) {
    const n = f.npc;
    if (!n) { f.fase = 'libre'; return; }
    if (!cerca || !o) { n.dormido = true; n.camino = []; f.fase = 'libre'; return; }
    const s = puesto(o, emp?.turno ?? 0), l = lado(emp?.turno ?? 0), b = aMundo(o, l * 1.9, -0.2), a = aMundo(o, l * 1.9, -s.D / 2 - 1), d0 = aMundo(o, l * 5, -s.D / 2 - 12);
    n.camino = [{ x: b.x, z: b.z, cerca: 0.4 }, { x: a.x, z: a.z, cerca: 0.5 }, { x: d0.x, z: d0.z, cerca: 1.2 }];
    f.fase = 'sale'; f.t = 0;
  }
  const alPuesto = (f, o, emp) => { const s = puesto(o, emp.turno), c = aMundo(o, s.lx, s.lz); return Math.hypot(f.npc.pos.x - c.x, f.npc.pos.z - c.z); };
  function moverFiguras(o, abs, dist, dt) {
    const E = estadoE();
    for (const f of figuras.values()) {
      const emp = empleadoDe(E, f.k);
      if (!f.npc) continue;
      const debe = !!emp && !!o && enTurno(emp, abs) && dist < RADIO_FIGURAS && !ocupado(emp.k);
      if (debe) {
        if (f.fase === 'libre') entrar(f, o, emp, dist < RADIO_VER);
        else if (f.fase === 'sale') { f.fase = 'entra'; }   // (volvió a empezar el turno antes de terminar de irse)
        if (f.fase === 'entra') {
          f.t += dt;
          if (alPuesto(f, o, emp) < 0.45 || f.t > 30) {
            if (alPuesto(f, o, emp) >= 0.45) { const s = puesto(o, emp.turno), c = aMundo(o, s.lx, s.lz); poner(f, c.x, c.z); }
            f.npc.camino = []; f.fase = 'puesto'; mirarAlFrente(f, o, emp);
          }
        } else if (f.fase === 'puesto') {
          // (el local pudo moverse o rehacerse: se queda donde corresponde)
          if (alPuesto(f, o, emp) > 1.2) { const s = puesto(o, emp.turno), c = aMundo(o, s.lx, s.lz); poner(f, c.x, c.z); mirarAlFrente(f, o, emp); }
        }
      } else if (f.fase === 'entra' || f.fase === 'puesto') {
        salir(f, o, emp, !!o && dist < RADIO_VER);
      } else if (f.fase === 'sale') {
        f.t += dt;
        if (!f.npc.camino?.length || f.t > 24) { f.npc.dormido = true; f.npc.camino = []; f.fase = 'libre'; }
      }
    }
  }

  // ---------------------------------------------------------------- los avisos
  const env = (presente) => ({
    abs: absAhora(), presente, nivel: nivelDe, nombre: nombreDe, lluvia: ctx.lluvia?.() || 0, ocupado, depositos: depositosDelLocal,
    cambiarAmistad: (k, n) => { cambiarAmistad(P(), k, n, P().dia); },
  });
  // 4.4.1: los depósitos con tope que tenés cerca del local (se arma sólo cuando un empleado va a reponer, no cada segundo)
  function depositosDelLocal() {
    const o = negocio()?.local?.(), A = ctx.almacen?.();
    return o && A ? A.depositosDe(o.datos.x, o.datos.z, REPOSICION.radio) : null;
  }
  function avisar(ev, presente) {
    const N = negocio();
    for (const e of ev) {
      if (e.tipo === 'sueldo') {
        if (presente) ctx.nota?.(`${nombreDe(e.k)} cobró su sueldo`, `${formatoPesos(e.monto)}${e.deBilletera > 0 ? ` (${e.deCaja > 0 ? `${formatoPesos(e.deCaja)} de la caja y ${formatoPesos(e.deBilletera)} de tu billetera` : 'de tu billetera'})` : ' (de la caja del local)'}`, true);
      } else if (e.tipo === 'impago') {
        ctx.nota?.(`No pudiste pagarle a ${nombreDe(e.k)}`, `Le debés ${formatoPesos(e.debe)} entre la caja del local y tu billetera. Si mañana tampoco, se va`, false);
      } else if (e.tipo === 'renuncia') {
        const f = figuras.get(e.k); if (f) { const n = f.npc; if (n) { n.dormido = true; } soltar(f); }
        ctx.nota?.(`${nombreDe(e.k)} renunció`, e.motivo === 'impago' ? 'Dos días sin cobrar: se fue y se lo tomó a mal' : `Hace más de ${AUSENCIA_MAX_DIAS} días que nadie pasa por el local: se cansó de esperarte`, false);
      }
    }
    if (ev.some((e) => e.tipo === 'renuncia')) N?.redibujar?.();
    if (ev.length) ctx.guardar?.();
  }
  // al volver (con vos a menos de 35 m): lo que se vendió sin vos
  function contarSiVolviste(E) {
    if (!hayPendiente(E) || relojResumen < ultimoResumen + 20) return;
    const r = resumenAlVolver(E, nombreDe);
    if (!r) return;
    ultimoResumen = relojResumen;
    ctx.nota?.(r.titulo, r.sub, true);
    limpiarPendiente(E);
    ctx.guardar?.();
  }

  // ---------------------------------------------------------------- avanzar (se llama cada cuadro; trabaja cada PASO)
  function actualizar(dt) {
    acum += dt;
    if (acum < PASO) return;
    const d = acum; acum = 0;
    relojResumen += d;
    const E = estadoE(), N = negocio();
    if (!E || !N) return;
    const est = N.estado();
    if (!est) return;
    if (!E.lista.length) { if (figuras.size) quitarFiguras(); return; }
    const o = N.local();
    // sin local (lo desarmaste): se van, sin culpa de nadie
    if (!est.tipo) {
      const nombres = E.lista.map((x) => nombreDe(x.k));
      E.lista.length = 0; E.ficha = {};   // (4.4.2: sin local se borran también las pruebas ya usadas: otro local, otra prueba)
      E.pend = { ventas: 0, clientes: 0, sueldos: 0, cajaLlena: false, porEmp: {}, repuesto: {} };
      quitarFiguras();
      ctx.nota?.(nombres.length > 1 ? 'Tus empleados volvieron a lo suyo' : `${nombres[0]} volvió a lo suyo`, 'Ya no tenés local: sin mostrador no hay trabajo', false);
      ctx.guardar?.();
      return;
    }
    // 4.4.2: lo estás moviendo (mover con M): no hay local activo, pero los sueldos y las ventas siguen contando (antes se congelaban y se ponían al día de golpe)
    const real = o || N.localReal?.();
    if (!real) return;
    const abs = absAhora();
    const dist = N.distancia(real);
    const presente = dist < (N.cola.clientes.length ? COLA.radioPartir : COLA.radioAtencion);
    // los sueldos y las ventas sin vos, una vez por segundo
    acumCuenta += d;
    if (acumCuenta >= CADA) {
      acumCuenta = 0;
      const ev = avanzarEmpleados(P(), est, est.tipo, E, env(presente));
      if (ev.length) avisar(ev, presente);
      if (presente) contarSiVolviste(E);
      // 4.4.2: «cada 5 ventas simuladas», una sola vez por cada múltiplo (antes, con `n` quieto en un múltiplo de 5, guardaba una vez por segundo)
      if (E.sim.n % 5 === 0 && E.sim.n !== guardadoN && !presente && hayPendiente(E)) { guardadoN = E.sim.n; ctx.guardar?.(); }
      if (!E.lista.length) { quitarFiguras(); return; }
    }
    if (!o) return;   // (lo estás moviendo: las figuras y la ayuda esperan)
    // cuando estás, ayudan: al que esperó lo suyo lo despachan ellos
    if (presente && N.cola.clientes.length && !N.panelAbierto()) {
      for (const a of elegirAyuda(N.cola, E, est.tipo, abs, nivelDe, d, ocupado)) {
        if (N.atender(a.c, nombreDe(a.emp.k)) === false) a.c._ayuda = false;
      }
    }
    // las figuras: las de los que están de turno se arman de a poco cuando estás cerca
    const deTurno = E.lista.filter((x) => enTurno(x, abs) && !ocupado(x.k));
    if (dist < RADIO_FIGURAS && deTurno.some((x) => !figuraDe(x.k).npc)) avanzarArmado(o, deTurno);
    for (const k of [...figuras.keys()]) if (!empleadoDe(E, k)) soltar(figuras.get(k));
    moverFiguras(o, abs, dist, d);
    // muy lejos: las figuras duermen (ni se dibujan ni se mueven)
    if (dist > RADIO_FIGURAS + 20) for (const f of figuras.values()) if (f.npc && f.fase !== 'libre') { f.npc.dormido = true; f.npc.camino = []; f.fase = 'libre'; }
  }

  // ---------------------------------------------------------------- el panel (la sección «Empleados» del panel del local)
  function el(tag, clase, texto) { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; }
  function boton(texto, alClic, { activo = true, clase = '', titulo = '' } = {}) {
    const b = el('button', clase, texto);
    b.type = 'button'; b.disabled = !activo;
    if (titulo) b.title = titulo;
    const accion = () => { if (!b.disabled) alClic(); };
    if (ctx.alClic) ctx.alClic(b, accion); else b.addEventListener('click', accion);
    b.addEventListener('keydown', (ev) => { if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); ev.stopPropagation(); accion(); } });
    return b;
  }
  const pct = (r) => `${Math.round(r * 100)} %`;
  const MOTIVOS = {
    amistad: (k) => `${nombreDe(k)} todavía no te conoce lo bastante para trabajar para vos. Charlá, regalale algo o dale una mano`,
    dueno: (k) => `${nombreDe(k)} tiene su propio local y sólo deja el mostrador por un amigo`,
    lleno: () => `Ya tenés ${MAX_EMPLEADOS} empleados. Despedí a uno para tomar a otro`,
    'sin-local': () => 'Primero armá y abrí el local',
    ya: (k) => `${nombreDe(k)} ya trabaja para vos`,
    'no-contrata': (k) => `${nombreDe(k)} no se puede contratar`,
  };
  function hacerContratar(k) {
    const N = negocio(), est = N?.estado();
    if (!est || !est.tipo) return;
    const E = estadoE();
    if (suNegocioEsTuyo(k)) { ctx.nota?.('No se pudo contratar', `${nombreDe(k)} ya trabaja en el negocio que le compraste: ese negocio le paga el sueldo`, false); return; }
    const r = contratar(E, k, { tipo: est.tipo, dia: P().dia, abs: absAhora(), puntos: puntosAmistad(k, P()) });
    if (!r.ok) { ctx.nota?.('No se pudo contratar', (MOTIVOS[r.motivo] || MOTIVOS['no-contrata'])(k), false); return; }
    ctx.alContratar?.(k);   // 4.11.2 (R10): si estaba de visita en tu mesa, la visita se corta (queda en un solo lugar)
    ctx.sonido?.()?.juntar?.();
    ctx.nota?.(`${nombreDe(k)} trabaja para vos`, `${formatoPesos(r.emp.sueldo)} por día, turno ${textoTurno(r.emp.turno)}, de lunes a sábado. En ese horario deja lo que hacía. El primer día es de prueba, sin sueldo`, true);
    ui.contratando = false;
    ctx.guardar?.(); ctx.refrescarBarra?.();
    N.redibujar();
  }
  function hacerDespedir(k, liberar = false) {
    const N = negocio(), est = N?.estado();
    if (!est) return;
    if (ui.despedir !== k && !liberar) { ui.despedir = k; N.redibujar(); return; }
    ui.despedir = null;
    ultimoResumen = -99; contarSiVolviste(estadoE());   // (lo que se vendió sin vos, antes de que se vaya)
    const ev = avanzarEmpleados(P(), est, est.tipo, estadoE(), env(true));   // (se saldan los turnos que ya cerraron antes de despedirlo)
    if (ev.length) avisar(ev, true);
    if (!empleadoDe(estadoE(), k)) { N.redibujar(); return; }
    const e = env(true);
    if (liberar) e.cambiarAmistad = null;   // 4.4.3: lo suelta porque le vendiste su negocio de vuelta: no es un despido, no le baja la amistad
    const r = despedir(P(), est, estadoE(), k, e);
    if (!r.ok) return;
    const f = figuras.get(k);
    if (f) { if (f.npc) f.npc.dormido = true; soltar(f); }
    ctx.nota?.(`${nombreDe(k)} ya no trabaja para vos`, `${liberar === 'compra' ? 'Le compraste su negocio: ya no atiende tu local. ' : liberar ? 'Volvió a su negocio. ' : ''}${r.pago?.ok ? `Le pagaste lo de hoy (${formatoPesos(r.pago.monto)}). Vuelve a lo suyo` : 'Vuelve a lo suyo'}`, false);
    ctx.guardar?.(); ctx.refrescarBarra?.();
    N.redibujar();
  }
  // 4.4.1: «Reposición automática desde tus depósitos: sí / no»
  function dibujarReposicion(raiz, est) {
    const caja = el('div', 'negocio-resumen');
    const aplica = aplicaReposicion(est.tipo), activa = aplica && est.fin?.reponer === true;
    const l1 = el('div', 'negocio-linea'); l1.append(el('span', '', 'Reposición automática desde tus depósitos'), el('b', '', aplica ? (activa ? 'sí' : 'no') : 'no aplica'));
    caja.append(l1);
    if (!aplica) caja.append(el('div', 'negocio-linea', 'Nada de lo que vende este local se guarda en los depósitos: surtí a mano o pedí al proveedor.'));
    else {
      let dep = null;
      try { dep = depositosDelLocal(); } catch (e) { dep = null; }
      const cosas = dep && dep.n ? reponibles(est.tipo).map((k) => ({ k, n: dep.hay(k) })).filter((x) => x.n > 0) : [];
      caja.append(el('div', 'negocio-linea', !dep || !dep.n ? `No hay depósitos a menos de ${REPOSICION.radio} m del local. La barraca, el silo y los depósitos de piedra que armes cerca alimentan los estantes.` : `${dep.n} ${dep.n === 1 ? 'depósito cerca' : 'depósitos cerca'}${cosas.length ? ` con ${textoLista(cosas)}` : ', vacíos'}. Al empezar el turno, el empleado repone lo que falta mientras no estás: sale del depósito.`));
      const acc = el('div', 'negocio-acciones');
      acc.append(boton(activa ? 'Apagar la reposición' : 'Activar la reposición', () => { est.fin.reponer = !est.fin.reponer; ctx.guardar?.(); negocio()?.redibujar?.(); }, { titulo: 'Que el empleado de turno reponga los estantes con lo de tus depósitos cuando no estás' }));
      caja.append(acc);
    }
    raiz.append(caja);
  }
  function dibujarPanel(raiz, est) {
    const E = estadoE();
    if (!E || !est?.tipo) return;
    const N = negocio();
    const caja = el('div', 'negocio-resumen');
    const titulo = el('div', 'negocio-linea'); titulo.append(el('span', '', 'Empleados'), el('b', '', `${cuantosEmpleados(E)} de ${MAX_EMPLEADOS}`));
    caja.append(titulo);
    if (!E.lista.length) caja.append(el('div', 'negocio-linea', 'Contratá a un vecino a sueldo diario: vende por vos aunque no estés (rinde menos que vos) y ayuda cuando estás.'));
    else caja.append(el('div', 'negocio-linea', 'El sueldo se paga al cerrar el turno: de la caja del local y, si no alcanza, de tu billetera. Sin pagar dos días, se van.'));
    raiz.append(caja);
    dibujarReposicion(raiz, est);
    const lista = el('div', 'negocio-lista');
    for (const emp of E.lista) {
      const dp = personaAldea(emp.k) || {};
      const fila = el('div', 'negocio-fila');
      const nom = el('span', 'negocio-nom'); nom.append(el('b', '', `${nombreDe(emp.k)} · ${dp.oficio || 'vecino'}`), el('i', '', `${textoTurno(emp.turno)} · ${emp.dias} ${emp.dias === 1 ? 'día' : 'días'} de trabajo · vendió ${formatoPesos(emp.vendido)}`));
      const rinde = el('span', 'negocio-cant', `rinde ${pct(rendimientoDe(emp, est.tipo, nivelDe(emp.k)))}`);
      const sueldo = el('span', 'negocio-cant', `${formatoPesos(emp.sueldo)}/día`);
      const conf = ui.despedir === emp.k;
      fila.append(nom, rinde, sueldo, boton(conf ? `¿Seguro? Despedir` : 'Despedir', () => hacerDespedir(emp.k), { clase: conf ? 'marcado' : '', titulo: 'Si hoy ya trabajó, se le paga el día' }));
      lista.append(fila);
    }
    raiz.append(lista);
    const acciones = el('div', 'negocio-acciones');
    acciones.append(boton(ui.contratando ? 'Ocultar la lista' : 'Contratar a un vecino…', () => { ui.contratando = !ui.contratando; ui.despedir = null; N.redibujar(); }, { activo: cuantosEmpleados(E) < MAX_EMPLEADOS || ui.contratando, titulo: cuantosEmpleados(E) < MAX_EMPLEADOS ? '' : `Ya tenés ${MAX_EMPLEADOS}` }));
    raiz.append(acciones);
    if (ui.contratando) {
      const cand = el('div', 'negocio-lista');
      const cab = el('div', 'negocio-fila negocio-cab'); cab.append(el('span', '', 'Vecino'), el('span', '', 'Rinde'), el('span', '', 'Sueldo por día'), el('span', '', ''));
      cand.append(cab);
      const filas = IDS_CANDIDATOS.filter((k) => enLaAldea(k) && !empleadoDe(E, k)).map((k) => ({ k, of: ofertaDe(k, est.tipo, puntosAmistad(k, P())) }))
        .sort((a, b) => (b.of.ok - a.of.ok) || (b.of.hab - a.of.hab));
      if (!filas.length) cand.append(el('div', 'negocio-fila', 'No hay a quién contratar todavía: se necesitan vecinos en la aldea'));
      for (const { k, of } of filas) {
        const dp = personaAldea(k) || {};
        const fila = el('div', 'negocio-fila' + (of.ok ? '' : ' vacio'));
        const nom = el('span', 'negocio-nom');
        nom.append(el('b', '', `${nombreDe(k)} · ${dp.oficio || 'vecino'}`), el('i', '', of.ok ? textoTrato(of.trato) : of.motivo === 'dueno' ? 'Tiene su local: sólo si sos amigo' : textoTrato('rechaza')));
        const rinde = el("span", "negocio-cant", `${Math.round(of.inicio * 100)}–${pct(of.tope)}`);
        const sueldo = el('span', 'negocio-cant', `${formatoPesos(of.sueldo)}`);
        fila.append(nom, rinde, sueldo, boton('Contratar', () => hacerContratar(k), { activo: of.ok, titulo: of.ok ? `${nombreDe(k)} deja ${of.dueno ? 'su local cerrado' : 'lo que hacía'} durante el turno` : 'No acepta' }));
        cand.append(fila);
      }
      raiz.append(cand);
      raiz.append(el('p', 'negocio-tip', `El que rinde menos arranca en 55–60 % de lo que atenderías vos y mejora con los días hasta 77–85 %. Cobran de lunes a sábado; el vecino deja la aldea durante su turno.`));
    }
  }

  return {
    actualizar, dibujarPanel, ocupacion, deTurno, salidaDeTurno, enLaAldea, quitarFiguras,
    ui, figuras,
    // para las pruebas: empujar el paso del tiempo sin esperar
    __tick: (n = 1) => { for (let i = 0; i < n; i++) { acum = PASO; acumCuenta = CADA; actualizar(0); } },
    // 4.4.3: si el vecino al que le vendés su negocio de vuelta trabajaba en tu local, se lo suelta con aviso (sin castigo de amistad); true si lo soltó
    liberar: (k, motivo) => { if (!empleadoDe(estadoE(), k)) return false; hacerDespedir(k, motivo || true); return !empleadoDe(estadoE(), k); },
    __contratar: hacerContratar, __despedir: (k) => { ui.despedir = k; hacerDespedir(k); },
    __armarTodo: () => { const N = negocio(), o = N?.local(); if (!o) return 0; for (let i = 0; i < 40; i++) { const E = estadoE(); if (!E.lista.some((x) => !figuras.get(x.k)?.npc)) break; avanzarArmado(o, E.lista); } return [...figuras.values()].filter((f) => f.npc).length; },
  };
}
