// 4.4.2 · ARREGLOS de la ronda de revisión de la 4.4.1 (frente: negocio propio, empleados, compra/sociedad y economía). Un caso por cada bug (zona-A.md y zona-D.md):
//   A1/D3  el guardado síncrono una vez por segundo con empleados y el jugador lejos        · A2   mover el local con un segundo local de otro tipo lo cerraba
//   A3     desarmar OTRO local cerraba la cuenta del activo y despedía sin pagar             · A4   despedir y recontratar antes del turno = sueldo gratis (día de prueba una vez)
//   A5     un empleado guardado sin `pagadoDia` cobraba todos los días de golpe              · A6   mientras movés el local se congelaban gastos y sueldos
//   A7     el vecino que «se va» ignoraba la fiesta de cumpleaños y el baile                 · A8   «hora de tu reloj» + dormir: vender dos veces el mismo día
//   A9     un turno del empleo fijo seguía después de comprarle el local al jefe             · A11  el cliente/empleado más cercano tapaba a cualquier vecino
//   (a)    lo comprado al proveedor no se puede sacar del estante (no es una tienda de materiales)
//   D4     el aviso de la E con el panel del local abierto · D7 modo foto · D8 la secuencia de guardado se filtraba entre ranuras
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';
import { que } from './ayuda-interacciones.mjs';

registrarThree();
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const N = await import('../src/negocio-propio.js');
const NJ = await import('../src/negocio-propio-juego.js');
const M = await import('../src/empleados-negocio.js');
const EJ = await import('../src/empleados-negocio-juego.js');
const R = await import('../src/negocio-propio-reposicion.js');
const EMPLEO = await import('../src/empleo.js');
const ALDEA = await import('../src/aldea.js');
const ECO = await import('../src/economia.js');
const NVm = await import('../src/negocios-vecinos.js');
const G = await import('../src/guardado.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const fallas = [];
function caso(nombre, fn) { try { fn(); } catch (e) { fallas.push(`${nombre}: ${e.message.split('\n')[0]}`); } }

const ilimitado = { tengo: () => 1e5, quitar: () => {} };
const progBase = (dia = 30, horas = 12, pesos = 50000) => ({ modo: 'relax', dia, horas, economia: { pesos, libro: [], migrada: true, ganado: 0, gastado: 0 }, materiales: {}, cosas: {}, entradas: {}, vecindad: { personas: {} } });
const envE = (abs, extra = {}) => ({ abs, presente: true, nivel: () => 1, nombre: (k) => k, cambiarAmistad: () => {}, ...extra });
// un juego del local con dos locales (A almacén, B panadería) y un jugador en `pos`
function juegoLocal(opc = {}) {
  const prog = opc.prog || progBase();
  const A = { plano: { id: 'local-almacen', etapas: [1] }, datos: { plano: 'local-almacen', etapas: 1, x: 0, z: 0, rot: 0 } };
  const B = { plano: { id: 'local-panaderia', etapas: [1] }, datos: { plano: 'local-panaderia', etapas: 1, x: 50, z: 0, rot: 0 } };
  const ob = { obras: opc.soloB ? [B] : [A, B], editando: null, rehacer() {} };
  const dados = [], notas = [], pos = opc.pos || { x: 0, z: 200 };
  let guardados = 0;
  const base = { progreso: () => prog, obras: () => ob, jugador: () => ({ estado: { pos } }), gente: () => null, sonido: () => null, nota: (t, s) => notas.push([t, s]), guardar() { guardados++; }, refrescarBarra() {}, lluvia: () => 0 };
  const J = NJ.crearNegocioJuego({ ...base, tengo: () => 0, quitar() {}, dar: (k, c) => dados.push([k, c]), panel: null, contenido: null });
  const X = EJ.crearEmpleadosNegocioJuego({ ...base, negocio: () => J, almacen: () => null, evento: () => null });
  return { prog, A, B, ob, dados, notas, pos, J, X, est: J.estado(), guardados: () => guardados };
}

// ---------------------------------------------------------------- A1 / D3 · el guardado una vez por segundo
caso('A1 guardado 1 Hz', () => {
  const t = juegoLocal({ prog: progBase(30, 22.5) });
  t.est.tipo = 'almacen'; t.est.abierto = true; t.est.stock = { huevo: 20 };
  t.J.actualizar(1);
  const E = M.empleadosDe(t.prog);
  M.contratar(E, 'madre', { tipo: 'almacen', dia: 29, abs: 29 * 24 + 9, puntos: 60 });
  E.lista[0].pagadoDia = 28;   // se le debe el día 29: se paga y queda pendiente de contar
  t.X.__tick(1);
  E.sim.n = 5;
  const g0 = t.guardados();
  for (let i = 0; i < 60; i++) t.X.__tick(1);
  ok(t.guardados() - g0 <= 2, `60 s sin vender nada: a lo sumo 2 guardados (hubo ${t.guardados() - g0})`);
  // vendiendo de verdad (n sube de a 5) sí guarda, una vez por cada múltiplo
  const g1 = t.guardados();
  E.sim.n = 10; t.X.__tick(1); E.sim.n = 10; t.X.__tick(1); E.sim.n = 15; t.X.__tick(1);
  ok(t.guardados() - g1 <= 2, `n=10, n=10, n=15: dos guardados como mucho (hubo ${t.guardados() - g1})`);
});

// ---------------------------------------------------------------- A2 · mover el local con un segundo local de otro tipo
caso('A2 mover el local', () => {
  const t = juegoLocal({ pos: { x: 0, z: 5 } });
  const { est, J, A, ob } = t;
  J.actualizar(1); J.abrirPanel(A); J.cerrarPanel();
  est.abierto = true; est.stock = { huevo: 30, harina: 10 }; est.caja = 3000;
  J.actualizar(1);
  ok(J.local() === A && est.tipo === 'almacen', 'el local activo es el almacén');
  const E = M.empleadosDe(t.prog); M.contratar(E, 'madre', { tipo: 'almacen', dia: 30, abs: 30 * 24 + 9, puntos: 60 });
  ob.editando = A;   // Shift+Y: lo estás moviendo
  J.actualizar(1.5); J.actualizar(1.5);
  eq(J.local(), null, 'mientras movés el activo no hay local activo (el otro no lo reemplaza)');
  ok(est.tipo === 'almacen' && est.abierto, 'sigue siendo el almacén y sigue abierto');
  eq(est.stock, { huevo: 30, harina: 10 }, 'el stock no se tocó');
  ok(est.caja === 3000, 'la caja no se tocó');
  eq(t.dados, [], 'nada volvió a la mochila');
  ok(est.fin.activa, 'la cuenta de gastos sigue activa');
  ob.editando = null;
  J.actualizar(1.5);
  ok(J.local() === A && est.tipo === 'almacen' && est.stock.huevo === 30, 'al soltarlo, todo como estaba');
  // moviendo el OTRO (el de adorno) tampoco cambia nada
  ob.editando = t.B; J.actualizar(1.5); J.actualizar(1.5);
  ok(J.local() === A && est.tipo === 'almacen' && est.stock.huevo === 30, 'mover el de adorno no toca el activo');
});

// ---------------------------------------------------------------- A3 · desarmar otro local
caso('A3 desarmar otro local', () => {
  const t = juegoLocal({ pos: { x: 0, z: 5 } });
  const { est, J, A, B } = t;
  est.tipo = 'almacen'; est.abierto = true; est.stock = { huevo: 30 }; est.caja = 2000; est.fin.activa = true; est.fin.ultimo = 29; est.fin.deuda = 100;
  const E = M.empleadosDe(t.prog); M.contratar(E, 'madre', { tipo: 'almacen', dia: 30, abs: 30 * 24 + 9, puntos: 60 });
  // el juego recién armado (la caché vacía): el desalojo de la aldea desarma el de adorno antes del primer cuadro
  eq(J.alDesarmar(B.datos), '', 'desarmar el de adorno no devuelve nada');
  ok(est.tipo === 'almacen' && est.stock.huevo === 30 && est.caja === 2000 && est.fin.deuda === 100, 'el almacén activo sigue con su mercadería, su caja y su deuda');
  J.actualizar(1); t.X.__tick(1);
  ok(M.empleadosDe(t.prog).lista.length === 1, 'el empleado no se despide');
  // con la caché ya armada, igual
  J.alDesarmar(B.datos);
  ok(est.tipo === 'almacen' && est.stock.huevo === 30, 'con la caché puesta, tampoco');
  // y desarmar el activo sí cierra la cuenta (control)
  J.alDesarmar(A.datos);
  ok(est.tipo === null && Object.keys(est.stock).length === 0, 'desarmar el activo cierra el local');
  ok(t.dados.some(([k, c]) => k === 'huevo' && c === 30), 'y devuelve la mercadería');
});
caso('A3 el activo desarmado por el desalojo (caché vacía, ya no está en las obras)', () => {
  const t = juegoLocal({ pos: { x: 0, z: 5 } });
  const { est, J, A, B, ob } = t;
  est.tipo = 'almacen'; est.abierto = true; est.stock = { huevo: 12 }; est.caja = 500;
  J.actualizar(1);                    // fija el sitio del local activo
  eq(est.sitio, { x: 0, z: 0 }, 'el estado se acuerda de dónde está el local');
  // partida recién cargada: la caché vacía y la obra A ya sacada de la lista (el desalojo arma las que quedan antes)
  const J2 = NJ.crearNegocioJuego({ progreso: () => t.prog, obras: () => ({ obras: [B], editando: null, rehacer() {} }), jugador: () => ({ estado: { pos: { x: 0, z: 5 } } }), gente: () => null, nota() {}, guardar() {}, refrescarBarra() {}, tengo: () => 0, quitar() {}, dar: (k, c) => t.dados.push([k, c]) });
  J2.alDesarmar(A.datos);
  ok(est.tipo === null && t.dados.some(([k]) => k === 'huevo'), 'el activo se reconoce por su lugar y cierra la cuenta');
});

// ---------------------------------------------------------------- A6 · los gastos y los sueldos siguen corriendo mientras movés el local
caso('A6 gastos y sueldos mientras movés', () => {
  const t = juegoLocal({ pos: { x: 0, z: 5 } });
  const { est, J, A, ob, prog } = t;
  est.tipo = 'almacen'; est.abierto = true; est.stock = { huevo: 20 }; est.caja = 9000; est.fin.activa = true; est.fin.ultimo = 30;
  J.actualizar(1);
  const E = M.empleadosDe(prog); M.contratar(E, 'madre', { tipo: 'almacen', dia: 30, abs: 30 * 24 + 9, puntos: 60 });
  ob.editando = A;
  prog.dia = 32; prog.horas = 22;
  J.actualizar(1); t.X.__tick(1);
  ok(est.fin.ultimo === 32, `los gastos se cobraron con el local en movimiento (fin.ultimo ${est.fin.ultimo})`);
  ok(E.lista.length === 1 && E.lista[0].pagadoDia >= 31, `y el sueldo del día 31 también (pagadoDia ${E.lista[0]?.pagadoDia})`);
});

// ---------------------------------------------------------------- A4 / (b) · despedir y recontratar no es sueldo gratis
caso('A4 despedir y recontratar', () => {
  const mk = () => { const p = progBase(10, 9, 200000); const est = N.negocioPropioDe(p); est.tipo = 'almacen'; est.abierto = true; est.stock = { huevo: 50, harina: 10, papa: 30, 'pan-casero': 20 }; return { p, est, Em: M.empleadosDe(p) }; };
  // control honesto: contratado el día 10 a las 9 (día de prueba), 10 días de trabajo
  const c = mk();
  M.contratar(c.Em, 'madre', { tipo: 'almacen', dia: 10, abs: 10 * 24 + 9, puntos: 60 });
  const g0 = c.p.economia.gastado;
  for (let d = 11; d <= 20; d++) M.avanzarEmpleados(c.p, c.est, 'almacen', c.Em, envE(d * 24 + 22));
  const honesto = c.p.economia.gastado - g0;
  // el truco: cada mañana a las 8:00 lo despide y lo recontrata
  const x = mk();
  M.contratar(x.Em, 'madre', { tipo: 'almacen', dia: 10, abs: 10 * 24 + 9, puntos: 60 });
  const g1 = x.p.economia.gastado;
  for (let d = 11; d <= 20; d++) {
    M.avanzarEmpleados(x.p, x.est, 'almacen', x.Em, envE(d * 24 + 8));
    M.despedir(x.p, x.est, x.Em, 'madre', envE(d * 24 + 8));
    M.contratar(x.Em, 'madre', { tipo: 'almacen', dia: d, abs: d * 24 + 8, puntos: 60 });
    M.avanzarEmpleados(x.p, x.est, 'almacen', x.Em, envE(d * 24 + 22));
  }
  const truco = x.p.economia.gastado - g1;
  ok(honesto > 0, `el control paga sueldos (${honesto})`);
  ok(truco >= honesto, `el ciclo despedir/recontratar paga lo mismo que el control (${truco} vs ${honesto})`);
  // la prueba sin sueldo es una sola vez por vecino: la primera contratación sí la tiene
  const y = mk();
  const r = M.contratar(y.Em, 'madre', { tipo: 'almacen', dia: 10, abs: 10 * 24 + 9, puntos: 60 });
  ok(r.emp.pagadoDia === 10, 'la primera contratación: el día de hoy es de prueba (sin sueldo)');
  // despedir a mitad del turno paga el día y recontratarlo ese día NO lo cobra dos veces
  const z = mk();
  M.contratar(z.Em, 'madre', { tipo: 'almacen', dia: 10, abs: 10 * 24 + 9, puntos: 60 });
  M.avanzarEmpleados(z.p, z.est, 'almacen', z.Em, envE(11 * 24 + 8));
  const antes = z.p.economia.gastado;
  const d1 = M.despedir(z.p, z.est, z.Em, 'madre', envE(11 * 24 + 12));
  ok(d1.pago?.ok, 'despedido el día 11 a las 12: se le paga el día');
  M.contratar(z.Em, 'madre', { tipo: 'almacen', dia: 11, abs: 11 * 24 + 12.1, puntos: 60 });
  M.avanzarEmpleados(z.p, z.est, 'almacen', z.Em, envE(11 * 24 + 22));
  const sueldo = z.Em.lista[0].sueldo;
  ok(z.p.economia.gastado - antes <= sueldo * 1 && z.p.economia.gastado - antes >= sueldo, `ese día se pagó una sola vez (${z.p.economia.gastado - antes} vs ${sueldo})`);
  // recontratarlo después de cerrar el turno del día: ese día no se cobra (no trabajó)
  const w = mk();
  M.contratar(w.Em, 'madre', { tipo: 'almacen', dia: 10, abs: 10 * 24 + 9, puntos: 60 });
  M.despedir(w.p, w.est, w.Em, 'madre', envE(11 * 24 + 8));
  const g2 = w.p.economia.gastado;
  M.contratar(w.Em, 'madre', { tipo: 'almacen', dia: 11, abs: 11 * 24 + 21.5, puntos: 60 });
  M.avanzarEmpleados(w.p, w.est, 'almacen', w.Em, envE(11 * 24 + 23));
  ok(w.p.economia.gastado === g2, 'recontratado con el turno cerrado: ese día no se paga');
  // el registro de las pruebas ya usadas se guarda y se sanea
  const s = M.sanearEmpleadosNegocio({ lista: [], ficha: { madre: 9, noexiste: 3, padre: 'x' } }, 20);
  eq(s.ficha, { madre: 9 }, 'sanear: sólo los candidatos con un día válido');
  eq(M.sanearEmpleadosNegocio(undefined, 20).ficha, {}, 'una partida de antes sale sin fichas');
});
caso('A4 las fichas se borran con el local', () => {
  const t = juegoLocal({ pos: { x: 0, z: 5 } });
  const { est, J, A } = t;
  est.tipo = 'almacen'; est.abierto = true; est.stock = { huevo: 20 };
  J.actualizar(1);
  const E = M.empleadosDe(t.prog); M.contratar(E, 'madre', { tipo: 'almacen', dia: 30, abs: 30 * 24 + 9, puntos: 60 });
  E.ficha.madre = 29;
  J.alDesarmar(A.datos);
  t.X.__tick(1);
  ok(E.lista.length === 0 && Object.keys(E.ficha).length === 0, 'sin local, la lista y las fichas se borran (otro local: otra prueba)');
});

// ---------------------------------------------------------------- A5 · empleado sin pagadoDia
caso('A5 pagadoDia ausente', () => {
  const p = progBase(200, 22, 900000);
  const est = N.negocioPropioDe(p); est.tipo = 'almacen'; est.abierto = true;
  p.empleadosNegocio = M.sanearEmpleadosNegocio({ lista: [{ k: 'madre', sueldo: 1000 }], visita: 200 }, 200);
  eq(p.empleadosNegocio.lista[0].pagadoDia, 200, 'sin pagadoDia: arranca hoy (no desde el día 1)');
  const ev = M.avanzarEmpleados(p, est, 'almacen', p.empleadosNegocio, envE(200 * 24 + 22));
  ok(p.economia.gastado === 0 && !ev.some((e) => e.tipo === 'sueldo'), 'no cobra 172 días de golpe');
  // y aunque venga con un día viejo, no se pagan más días que los que se aguantan sin pasar
  const q = progBase(200, 22, 900000);
  const est2 = N.negocioPropioDe(q); est2.tipo = 'almacen'; est2.abierto = true; est2.caja = 0;
  q.empleadosNegocio = M.sanearEmpleadosNegocio({ lista: [{ k: 'madre', sueldo: 1000, pagadoDia: 3 }], visita: 200 }, 200);
  const ev2 = M.avanzarEmpleados(q, est2, 'almacen', q.empleadosNegocio, envE(200 * 24 + 22));
  const pagos = ev2.filter((e) => e.tipo === 'sueldo').length;
  ok(pagos <= M.AUSENCIA_MAX_DIAS + 1, `con un atraso enorme se pagan a lo sumo ${M.AUSENCIA_MAX_DIAS + 1} días (${pagos})`);
});

// ---------------------------------------------------------------- A8 · «hora de tu reloj»: no se vende dos veces el mismo día
caso('A8 reloj + dormir', () => {
  const p = progBase(5, 10, 500000);
  const est = N.negocioPropioDe(p); est.tipo = 'almacen'; est.abierto = true;
  for (const k of N.catalogo('almacen')) N.surtir(est, k, 1e5, ilimitado);
  est.fin.activa = true; est.fin.ultimo = 5;
  const Em = M.empleadosDe(p);
  M.contratar(Em, 'madre', { tipo: 'almacen', dia: 5, abs: 5 * 24 + 9, puntos: 60 });
  const paso = (dia, h) => { p.dia = dia; p.horas = h; return M.avanzarEmpleados(p, est, 'almacen', Em, envE(dia * 24 + h, { presente: false })); };
  for (let h = 10; h <= 22; h += 0.5) paso(5, h);
  paso(6, 22);   // dormiste antes de medianoche con la hora real: el día sube y la hora real vuelve a pisar
  const clientes = est.total.clientes;
  paso(6, 0);    // a medianoche la hora vuelve a 0 sin cambiar el día
  for (let h = 0.5; h <= 22; h += 0.5) paso(6, h);
  ok(est.total.clientes === clientes, `el día 6 no se simula dos veces (clientes ${est.total.clientes} vs ${clientes})`);
  paso(6, 22.5); paso(7, 9);
  ok(est.total.clientes >= clientes, 'y después, la vida sigue');
  ok(M.sanearEmpleadosNegocio(JSON.parse(JSON.stringify(Em)), 10).sim.tope >= 0, 'el tope de lo simulado se guarda saneado');
});

// ---------------------------------------------------------------- A9 · comprar el local con un turno en curso
caso('A9 turno del empleo + compra', () => {
  const p = progBase(10, 10, 100000);
  const k = EMPLEO.IDS_PUESTOS.find((x) => EMPLEO.puedeFichar(p, x, 10, 10).ok) || EMPLEO.IDS_PUESTOS[0];
  const f = EMPLEO.fichar(p, k, 10, 10);
  ok(f.ok, `ficha en ${k}`);
  eq(EMPLEO.motivoDeCierre(p, 10, 12, false), null, 'sin compra, el turno sigue');
  p.negociosVecinos = { comprados: { [k]: { desde: 10 } } };
  eq(EMPLEO.motivoDeCierre(p, 10, 12, false), 'tiempo', 'si le compraste el local al jefe, el turno se cierra solo');
  eq(EMPLEO.motivoDeCierre(p, 10, 12, true), 'tiempo', 'también con la hora de tu reloj');
  ok(/comprados/.test(leer('src/empleo.js').split('export function motivoDeCierre')[1] || ''), 'empleo.js lo decide en motivoDeCierre');
});

// ---------------------------------------------------------------- pregunta 9 · al que atiende el negocio que le compraste no se lo contrata además
caso('Q9 contratar al del negocio comprado', () => {
  const t = juegoLocal();
  const id = 'panaderia', k = NVm.NEGOCIOS[id].vecino;
  t.prog.aldea = { pobladores: [{ clave: k }], locales: { [ALDEA.LOTE_DE[k]]: {} } };
  ok(t.X.enLaAldea(k), 'antes de comprarle el negocio, se lo puede contratar');
  t.prog.negociosVecinos = { v: 1, comprados: { [id]: { desde: 1, pagado: 1, destino: 'se-va', caja: 0, total: 0, perdido: 0, ultimo: 1, orden: 1, visita: 1, bono: 1 } }, socios: {} };
  ok(NVm.esTuyo(t.prog, id) && !t.X.enLaAldea(k), 'comprado el negocio, ya no');
});
caso('Q9 cableado', () => {
  const j = leer('src/empleados-negocio-juego.js');
  ok(j.includes('suNegocioEsTuyo(k)') && /negocioDeVecino, esTuyo/.test(j), 'empleados-negocio-juego.js mira si el negocio es tuyo');
});

// ---------------------------------------------------------------- A7 · el que «se fue» y las fiestas
caso('A7 el que se fue y la fiesta', () => {
  const src = leer('src/negocios-vecinos-juego.js');
  const sec = src.split('const fijarRutina')[1].split('fijarRutina();')[0];
  ok(/esCumpleanos/.test(sec) && /HORA_FIESTA/.test(sec), 'fijarRutina respeta la fiesta de cumpleaños');
  ok(/ds === 5|sabado/.test(sec), 'y el baile del sábado');
  ok(/desvioRutina\(persona, h, ds, dia, t\)/.test(leer('src/aldea.js')), 'aldea.js le pasa el día y la hora corrida');
});

// ---------------------------------------------------------------- A11 · el cliente más cercano no tapa al vecino
caso('A11 gente.cerca con filtro', () => {
  const g = leer('src/gente.js'), m = leer('src/main.js');
  ok(/function cerca\(js, camara, deFrente = false, omitir = null\)/.test(g) && /omitir && omitir\(g\)/.test(g), 'gente.cerca acepta un filtro');
  ok(/gente\.cerca\(js, camara, false, \(g\) => g\.clienteNegocio \|\| g\.empleadoNegocio\)/.test(m), 'main.js salta a los clientes y empleados y pide el siguiente');
});

// ---------------------------------------------------------------- (a) · lo del proveedor no sale del estante
caso('(a) mercadería del proveedor', () => {
  const p = progBase(30, 12, 500000);
  const est = N.negocioPropioDe(p); est.tipo = 'almacen'; est.abierto = true;
  const r = R.pedirAlProveedor(p, est, 30);
  ok(r.ok, 'el pedido sale');
  const total = Object.values(est.stock).reduce((s, x) => s + x, 0);
  ok(total > 0, 'hay mercadería');
  ok(N.unidadesSacables(est) === 0, 'toda es del proveedor: no hay nada para sacar');
  for (const k of Object.keys(est.stock)) eq(N.sacarDelEstante(est, k), 0, `no se puede sacar ${k}`);
  eq(Object.values(est.stock).reduce((s, x) => s + x, 0), total, 'el estante quedó igual');
  // lo que ponés vos sí se saca, y sólo eso
  const k = Object.keys(est.stock)[0];
  const tope = N.topeEstante(k);
  est.stock[k] = 0; delete est.stock[k]; est.prov = {};
  N.surtir(est, k, 3, ilimitado);
  eq(N.sacarDelEstante(est, k), 3, 'lo propio sí se saca');
  // mezcla: 2 propios + lo del proveedor
  N.surtir(est, k, 2, ilimitado);
  const rp = R.pedirAlProveedor(p, est, 31);
  ok(rp.ok || rp.motivo, 'otro pedido');
  const hay = est.stock[k] || 0, prov = N.deProveedor(est, k);
  eq(N.sacarDelEstante(est, k), hay - prov, 'sólo se saca lo propio');
  eq(est.stock[k] || 0, prov, 'lo del proveedor queda en el estante');
  // las ventas gastan primero lo propio: lo que queda del proveedor no se vuelve «propio» por vender
  est.stock[k] = 10; est.prov = { [k]: 10 };
  est.stock[k] = 4;   // se vendieron 6
  N.surtir(est, k, 5, ilimitado);
  eq(N.sacarDelEstante(est, k), 5, 'después de vender, lo que surtís vos se saca; lo del proveedor que quedó (4) no');
  eq(est.stock[k], 4, 'quedan las 4 del proveedor');
  ok(tope > 0, 'tope válido');
  // cerrar el local no devuelve lo del proveedor
  const dados = [];
  N.cerrarLocal(p, est, (kk, c) => dados.push([kk, c]));
  ok(!dados.some(([kk]) => kk === k), 'al cerrar el local, lo del proveedor no vuelve a la mochila');
  eq(est.stock, {}, 'y el estante queda vacío');
  // reponer desde depósitos o surtir limpia la marca vieja
  const e2 = N.negocioPropioNuevo(); e2.tipo = 'almacen'; e2.stock = { huevo: 20 }; e2.prov = { huevo: 20 };
  e2.stock.huevo = 0; delete e2.stock.huevo;
  N.surtir(e2, 'huevo', 8, ilimitado);
  eq(N.sacarDelEstante(e2, 'huevo'), 8, 'sin stock, la marca vieja no cuenta');
  // guardado: el campo viaja saneado y una partida de antes sale limpia
  const sano = N.sanearNegocioPropio({ tipo: 'almacen', stock: { huevo: 10, harina: 4 }, prov: { huevo: 99, harina: 2, zzz: 5, papa: 'x' } }, 30);
  eq(sano.prov, { huevo: 10, harina: 2 }, 'sanear: la marca nunca pasa del stock ni de lo que se vende');
  eq(N.sanearNegocioPropio({ tipo: 'almacen' }, 30).prov, {}, 'una partida de antes: sin marcas');
  eq(N.sanearNegocioPropio({ tipo: 'almacen', sitio: { x: 5, z: -3 } }, 30).sitio, { x: 5, z: -3 }, 'sanear: el sitio del local');
  eq(N.sanearNegocioPropio({ tipo: 'almacen', sitio: { x: 'a' } }, 30).sitio, null, 'y un sitio roto sale vacío');
  const fuente = leer('src/negocio-propio-juego.js');
  ok(/unidadesSacables\(est\) > 0/.test(fuente), 'el botón «Sacar toda la mercadería» mira lo sacable');
});

// ---------------------------------------------------------------- D8 · la secuencia de guardado no se filtra entre ranuras
caso('D8 secuencia', () => {
  G.usarModoGuardado('relax', 1);
  const p = G.progresoNuevo(); p.dia = 5;
  for (let i = 0; i < 40; i++) G.guardarProgreso(p);
  const q = G.progresoNuevo(); q.dia = 9; q.secuencia = 7; q.guardadoEn = Date.now() - 3600e3;
  G.escribirPartida('relax', 2, q);
  eq(JSON.parse(store.get('hojarasca-p2-v1')).secuencia, 8, 'la partida importada sigue su propia cuenta (7 + 1)');
  G.usarModoGuardado('relax', 1);
});

// ---------------------------------------------------------------- el cableado de main.js (D4, D7, A11)
caso('D4 D7 main.js', () => {
  const m = leer('src/main.js');
  // (4.6.1: la E y el aviso salen de la misma tabla, src/interacciones.js: los paneles abiertos van primero y cortan todo)
  ok(m.includes('const aviso = avisoDe(ctxInteraccion);'), 'el aviso sale de la tabla');
  const loDeArriba = { js: { montado: true }, cercaDelFuego: true, puedeDormirJuntoAlFuego: true, hachaCerca: {}, tendalCerca: {} };
  const borra = (est) => que({ ...loDeArriba, ...est }).aviso === null;
  ok(borra({ panelAbierto: (x) => x === 'negocio' }) && borra({ panelAbierto: (x) => x === 'fiestas' }) && borra({ panelAbierto: (x) => x === 'cantina' }) && borra({ enElBanco: true }), 'el panel del local, las fiestas, la cantina y el banco borran el aviso al final');
  ok(que({ panelAbierto: (x) => x === 'negocio' }).hechos.join() === 'cerrarPanel' && /if \(nombre === 'negocio'\) negocioJuego\.cerrarPanel\(\);/.test(m), 'y la E cierra el panel del local');
  ok(/modo === 'jugando' && !desafio && !foto\.activo\) negocioJuego\?\.actualizar/.test(m), 'el modo foto no mueve el local');
  ok(/!foto\.activo\) empleadosNegocioJuego\?\.actualizar/.test(m), 'ni a los empleados');
  ok(/!foto\.activo\) negociosVecinosJuego\?\.actualizar/.test(m), 'ni a los negocios de los vecinos');
});

if (fallas.length) { console.error('FALLAS:\n  ' + fallas.join('\n  ')); process.exit(1); }
console.log(`verificar-4-4-2-negocio: ${n} comprobaciones OK`);
