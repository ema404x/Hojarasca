// 4.11.2 · GENTE, DIARIO Y ECONOMÍA (rama v4112-b). Un caso por cada cosa, ejecutando la conducta (con mundos de mentira):
//   A14  el diario anota «Conocí a …»; un encargo del Puesto Alto en el tablón; el botón (y Retroceso + número) para soltar un papel tomado
//   D1   Fermín, Belisario y Tobías, si no hubo lugar al armarse, reintentan cada tanto (con tope)
//   R10  contratar al compadre que está de visita en tu mesa corta la visita
//   D3   el empleado que sale de turno reaparece a la salida del local y camina desde ahí (sin quedar en dos lugares)
//   S2-7 la panadera: tres panes por $600     S2 la demanda de la Casa de Té sigue el calendario     S6 «entre las 19 y las 22»
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { A, G, V, M, J, N, PN, crearMundo, mover, vec } from './ayuda-npc-mundo.mjs';
import { derechaDe, funcion, enUnaLinea } from './ayuda-codigo.mjs';

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js');
const TB = await import('../src/tablon.js');
const GC = await import('../src/gente-campo.js');
const { crearGenteCampoJuego } = await import('../src/gente-campo-juego.js');
const { crearDiario } = await import('../src/diario.js');
const { economiaNueva, pesosDe } = await import('../src/economia.js');
const { BIENES } = await import('../src/comercio.js');
const { crearTablonMundo } = await import('../src/tablon-mundo.js');
const { crearGenteCampoMundo } = await import('../src/gente-campo-mundo.js');
const { ENCARGOS } = await import('../src/encargos.js');
const { temporadaDelDia } = await import('../src/negocios-fx.js');

// ---------------------------------------------------------------- A14 (a) · «conociste a …» en el diario
{
  const d = crearDiario();
  d.anotar('campo-conocido', 'Fermín Catrileo');
  const uno = d.cerrar(3, 'verano', () => 0).texto;
  ok(/Conocí a Fermín Catrileo, de los que viven lejos del pueblo\./.test(uno), `una persona: «${uno.slice(0, 120)}»`);
  d.anotar('campo-conocido', 'Belisario Paredes'); d.anotar('campo-conocido', 'Tobías Hughes');
  const dos = d.cerrar(4, 'verano', () => 0).texto;
  ok(/Conocí a Belisario Paredes y Tobías Hughes\./.test(dos), `dos personas: «${dos.slice(0, 140)}»`);
  ok(!/Conocí a/.test(d.cerrar(5, 'verano', () => 0).texto), 'al día siguiente ya no');
  // se guarda con la página del día y vuelve al cargar
  const g = crearDiario(); g.anotar('campo-conocido', 'Tobías Hughes');
  const h = crearDiario(); h.cargarHoy(JSON.parse(JSON.stringify(g.paraGuardar(7))), 7);
  ok(/Conocí a Tobías Hughes/.test(h.cerrar(7, 'verano', () => 0).texto), 'la anotación viaja en la partida guardada');
  // el enganche con la charla: la primera vez que hablás con cada uno, una sola vez
  const anotado = [];
  const P = { modo: 'relax', dia: 4, horas: 10, economia: economiaNueva(), genteCampo: GC.genteCampoNueva ? GC.genteCampoNueva() : undefined };
  const base = { progreso: () => P, desafio: () => false, dia: () => 4, horas: () => 10, anotarDiario: (t, x) => anotado.push([t, x]) };
  if (!P.genteCampo) P.genteCampo = GC.genteCampoDe(P);
  const GJ = crearGenteCampoJuego(base);
  GJ.sesion({ clave: 'fermin' }); GJ.sesion({ clave: 'fermin' }); GJ.sesion({ clave: 'tobias' });
  eq(anotado, [['campo-conocido', 'Fermín Catrileo'], ['campo-conocido', 'Tobías Hughes']], 'se anota al primer encuentro de cada uno, y una sola vez');
  ok(enUnaLinea(main, ['anotarDiario: (tipo, dato) => diario.anotar(tipo, dato)']), 'main.js le da a la gente del campo el diario');
}

// ---------------------------------------------------------------- A14 (b) · un encargo del Puesto Alto
{
  const e = TB.ENCARGOS_TABLON.filter((x) => x.origen === 'puestoAlto');
  eq(e.length, 1, 'hay un encargo que sale del Puesto Alto');
  const pago = TB.pagoDe(e[0].k, e[0].n, 'puestoAlto');
  ok(pago >= 700 && pago <= 2200 && pago % 50 === 0 && TB.multiplicadorDe('puestoAlto') === 2.5, `paga $${pago} (×2,5, el tramo más lejano)`);
  ok(e[0].quien.length === 2 && e[0].para && TB.existeEnJuego(e[0].k) && TB.cuantoDe(1, e[0].k) === '1 puñado de llao llao seco', 'con quién lo pide, para qué y cómo se dice');
  const ctx = { existe: () => true, presente: () => true, estacion: 'verano' };
  let dias = 0;
  for (let d = 1; d <= 120; d++) if (TB.aLaVista(TB.tablonNuevo(), d, ctx).some((x) => x.tpl === e[0].id)) dias++;
  ok(dias >= 8, `sale a la vista en varios días (${dias} de 120)`);
  const v = TB.aLaVista(TB.tablonNuevo(), 1, ctx);
  ok(v.every((x) => !!x.firma && !!x.lugar), 'todos los papeles a la vista traen firma y lugar');
}

// ---------------------------------------------------------------- A14 (c) · soltar un papel tomado (el panel con un DOM de mentira)
{
  const hijo = (tag) => {
    const el = { tag, children: [], className: '', textContent: '', id: '', title: '', type: '', oyentes: {}, _html: '',
      classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } },
      append(...x) { el.children.push(...x); }, appendChild(x) { el.children.push(x); return x; },
      addEventListener(t, f) { (el.oyentes[t] ||= []).push(f); },
      querySelector(sel) { return el.hallados?.[sel] ?? null; } };
    Object.defineProperty(el, 'innerHTML', { get: () => el._html, set: (v) => { el._html = v; el.children.length = 0; if (v.includes('tablon-lista')) el.hallados = { '#tablon-intro': hijo('p'), '#tablon-lista': hijo('ul'), '#tablon-seguir': hijo('p') }; } });
    return el;
  };
  globalThis.document = { createElement: hijo, body: hijo('body') };
  const P = { modo: 'relax', dia: 5, horas: 10, economia: economiaNueva(), genteCampo: GC.genteCampoDe({ modo: 'relax' }), aldea: A.aldeaNueva() };
  const notas = [], sonidos = [];
  let guardados = 0;
  const clics = [];
  const T = { altura: () => 0 };
  const m = crearTablonMundo({ escena: { add() {} }, T, progreso: () => P, dia: () => P.dia, existe: () => true, presente: () => true, estacion: () => 'verano', tengo: () => 0, aplicar() {},
    sonido: { anotar: () => sonidos.push('anotar'), juntar() {} }, nota: (t, s) => notas.push([t, s]), guardar: () => { guardados++; }, refrescar() {},
    alClic: (el, fn) => clics.push({ el, fn }), hud: { appendChild() {} }, textoPropio: (x) => x });
  ok(!!m, 'el tablón se arma (con el mundo de mentira)');
  m.abrir();
  const lista = () => m.tablon?.() ;
  const botones = () => clics.filter((c) => c.el.className === 'soltar');
  eq(botones().length, 0, 'sin papeles tomados no hay botón «Soltar»');
  m.elegir(0); m.elegir(1);   // toma dos (la primera fila de la vista; después la tomada pasa arriba y la siguiente es la 2)
  eq(P.genteCampo.tablon.tomados.length, 2, 'dos papeles tomados');
  clics.length = 0; m.dibujar();
  const bs = botones();
  eq(bs.length, 2, 'cada papel tomado trae su botón «Soltar»');
  ok(bs.every((b) => b.el.textContent === 'Soltar'), 'dice «Soltar»');
  const idPrimero = P.genteCampo.tablon.tomados[0].id, idSegundo = P.genteCampo.tablon.tomados[1].id;
  const g0 = guardados;
  bs[0].fn();   // el clic en el botón de la primera fila
  eq(P.genteCampo.tablon.tomados.map((x) => x.id), [idSegundo], 'el clic suelta el papel de esa fila y deja el otro');
  ok(guardados > g0 && notas.some(([t]) => /Soltaste el encargo/.test(t)), 'se guarda y se avisa');
  ok(!TB.aLaVista(P.genteCampo.tablon, 5, { existe: () => true, presente: () => true, estacion: 'verano' }).some((x) => x.id === idPrimero), 'hoy el papel soltado no vuelve a la vista');
  const mañana = TB.aLaVista(P.genteCampo.tablon, 6, { existe: () => true, presente: () => true, estacion: 'verano' });
  ok(mañana.length === 3, 'mañana el tablón tiene sus papeles de siempre');
  // por teclado: Retroceso y el número (otro día, con papeles nuevos a la vista)
  P.dia = 6;
  clics.length = 0; m.dibujar();
  ok(m.tecla('Backspace'), 'Retroceso es del tablón mientras está abierto');
  const pie = () => (m.malla && null) || globalThis.__pie;
  ok(m.tecla('Digit1') === true && P.genteCampo.tablon.tomados.length === 0, 'Retroceso y el 1 sueltan el primer papel tomado');
  // sin papeles tomados Retroceso no hace nada raro, y un número después toma como siempre
  ok(m.tecla('Backspace') && m.tecla('Digit1') && P.genteCampo.tablon.tomados.length === 1, 'sin tomados, Retroceso no arma el modo soltar: el número toma');
  // en modo soltar, un número que no es de un papel tomado no toma nada
  m.tecla('Backspace');
  const antes = P.genteCampo.tablon.tomados.length;
  m.tecla('Digit3');
  eq(P.genteCampo.tablon.tomados.length, antes, 'en modo soltar un número de un papel que no tenés tomado no toma ni suelta nada');
  // Retroceso dos veces: vuelve a lo de siempre
  m.tecla('Backspace'); m.tecla('Backspace'); m.tecla('Digit3');
  ok(P.genteCampo.tablon.tomados.length === 2, 'Retroceso dos veces cancela: el número vuelve a tomar');
  m.cerrar(); void lista; void pie; void sonidos;
  delete globalThis.document;
  const src = leer('src/tablon-mundo.js');
  ok(/soltar/.test(src) && src.includes("className = 'soltar'"), 'el botón existe en el panel');
}

// ---------------------------------------------------------------- D1 · reintentar armarse si no hubo lugar
{
  let hayLugar = false;
  const T = { agua: () => false, altura: () => 0, lugares: {}, riel: [] };
  const col = { resolver: (p) => { if (!hayLugar) { p.x += 5; } } };   // sin lugar: todo punto choca (resolver lo empuja)
  const armados = [];
  const gente = { armarPobladorDeAPoco: (def) => { const t = { npc: { g: { visible: true }, ruta: def.ruta, etapa: 0, espera: 0, vel: 0 }, avanzar: () => true }; armados.push(def.clave); return t; } };
  const W = crearGenteCampoMundo({ T, col, gente });
  const js = { pos: { x: GC.PUESTO_PASO.x, z: GC.PUESTO_PASO.z } };
  W.actualizar(0.05, js);
  eq(armados, [], 'sin lugar libre, nadie aparece (mejor que atravesado)');
  hayLugar = true;
  W.actualizar(5, js);
  eq(armados, [], 'antes de que pase el rato no se vuelve a intentar');
  W.actualizar(21, js);
  ok(armados.includes('belisario'), 'cuando pasa el rato y ya hay lugar, se arma');
  // el tope: si nunca hay lugar, deja de intentar (sin costo)
  hayLugar = false;
  const W2 = crearGenteCampoMundo({ T, col, gente: { armarPobladorDeAPoco: () => { throw new Error('no debería armarse'); } } });
  let intentos = 0;
  const colCuenta = { resolver: (p) => { intentos++; p.x += 5; } };
  const W3 = crearGenteCampoMundo({ T, col: colCuenta, gente });
  for (let i = 0; i < 200; i++) W3.actualizar(30, js);
  const despues = intentos;
  for (let i = 0; i < 50; i++) W3.actualizar(30, js);
  eq(intentos, despues, 'pasado el tope de intentos ya no vuelve a buscar');
  ok(despues > 0 && W3.__figuras.belisario.intentos === 8, `hizo sus ${W3.__figuras.belisario?.intentos} intentos y paró`);
  void W2;
  ok(/REINTENTO_S = 25/.test(leer('src/gente-campo-mundo.js')) && /TOPE_INTENTOS = 8/.test(leer('src/gente-campo-mundo.js')), 'cada 25 s de juego, con tope de 8 intentos');
}

// ---------------------------------------------------------------- el local de mentira (como las pruebas del 4.4)
function armarLocal(W, { evento = () => null, alContratar = () => {} } = {}) {
  const { P, jug, gente } = W;
  const o = { plano: { id: 'local-almacen' }, datos: { x: W.c0.x + 20, z: W.c0.z + 70, rot: 0.5, etapas: 1 } };
  const est = N.negocioPropioNuevo(); est.tipo = 'almacen'; est.abierto = true; P.negocioPropio = est; P.empleadosNegocio = M.empleadosNuevo();
  const negocio = { estado: () => P.negocioPropio, cola: N.colaNueva(), local: () => o, distancia: (ob) => Math.hypot(ob.datos.x - jug.estado.pos.x, ob.datos.z - jug.estado.pos.z),
    aMundo: (ob, lx, lz) => { const r = ob.datos.rot || 0, c = Math.cos(r), s = Math.sin(r); return { x: ob.datos.x + lx * c + lz * s, z: ob.datos.z - lx * s + lz * c }; },
    medidas: (ob) => PN.MEDIDAS[ob.plano.id], panelAbierto: () => false, redibujar() {}, atender: () => false };
  const notas = [];
  const JE = J.crearEmpleadosNegocioJuego({ progreso: () => P, negocio: () => negocio, gente: () => gente, nota: (t, s) => notas.push(`${t} | ${s}`), guardar() {}, refrescarBarra() {}, sonido: () => ({ juntar() {} }),
    lluvia: () => 0, alturaDePie: () => 0, msFigura: () => 3, alClic() {}, evento, alContratar });
  A.fijarOcupacionExterna(JE.ocupacion);
  return { JE, notas, negocio, o };
}
const amigoDe = (P, k, puntos = 30) => { for (let i = 0; i < 40 && V.puntosAmistad(k, P) < puntos; i++) V.cambiarAmistad(P, k, 5, 1); };

// ---------------------------------------------------------------- R10 · contratar al compadre que está de visita en tu mesa
{
  const W = crearMundo({ amigos: false, hora: 16.5, dia: 3 });
  const { P } = W;
  const cortes = [];
  const L = armarLocal(W, { alContratar: (k) => cortes.push(k) });
  amigoDe(P, 'madre');
  L.JE.__contratar('madre');
  ok(M.empleadoDe(P.empleadosNegocio, 'madre'), 'Gladys quedó contratada');
  eq(cortes, ['madre'], 'al contratar, el local le avisa al juego (alContratar)');
  ok(enUnaLinea(main, ['alContratar: (k) => cortarVisitaDe(k)']), 'main.js lo engancha con cortarVisitaDe');
  // cortarVisitaDe de main.js, ejecutada: la visita en curso de esa persona se termina y vuelve a su rutina
  const npc = { clave: 'aldea-madre', claveAldea: 'madre', nombre: 'Gladys', pos: vec(1, 0, 2), deVisita: true, ruta: [{ x: 9, z: 9 }], etapa: 2, espera: 0, velocidad: 1.1, saludo: 'x', despedida: 'y', soloCerca: 0, camino: null };
  const v = { activa: { dia: 3, clave: 'madre', amistad: true }, cuenta: 4, ultima: 0 };
  const guardados = [];
  const env = {
    visitante: { npc, antes: { ruta: [{ x: 5, z: 5 }], etapa: 0, espera: 0, x: 40, z: 41, velocidad: 0.9, saludo: 'hola', despedida: 'chau', soloCerca: 0, camino: [] } },
    visitas: () => v, progreso: { dia: 3 }, guardar: () => guardados.push(1), T: {}, col: {}, alturaDePie: () => 0, charla: { npc: null }, cerrarCharla() {},
    terminarVisita: (vv, dia) => { vv.ultima = dia; vv.activa = null; },
  };
  const devolver = funcion(main, 'devolverVisita', env);
  env.devolverVisita = devolver;
  const cortar = funcion(main, 'cortarVisitaDe', env);
  eq(cortar('pescador'), false, 'la visita de otro no se toca');
  ok(env.visitante && v.activa, 'y sigue en pie');
  eq(cortar('madre'), true, 'la de ella, sí');
  ok(env.visitante === null && v.activa === null, 'ya no hay visita en curso');
  ok(npc.deVisita === false && npc.pos.x === 40 && npc.pos.z === 41 && npc.saludo === 'hola', 'vuelve a su rutina, donde estaba');
  ok(guardados.length === 1, 'se guarda');
  // y si le toca el turno estando de visita (se contrató antes), también se corta (rama del reloj de visitas)
  ok(enUnaLinea(main, ['empleadosNegocioJuego?.deTurno(v.activa.clave)', 'cortarVisitaDe(v.activa.clave)']), 'el reloj de visitas corta la visita del que entra de turno');
}

// ---------------------------------------------------------------- D3 · el empleado que sale de turno sale caminando del local
{
  const W = crearMundo({ amigos: false, hora: 6, dia: 2 });
  const { P, jug, gente, lista } = W;
  const L = armarLocal(W);
  const { JE, o } = L;
  amigoDe(P, 'padre'); JE.__contratar('padre');
  const emp = M.empleadoDe(P.empleadosNegocio, 'padre');
  ok(!!emp, 'Mario quedó contratado');
  const AG = G.crearAldeaGente({ progreso: () => P, gente: () => gente, jugador: () => jug, tren: () => null, alturaDePie: () => 0, nota() {}, guardar() {}, registrar() {}, climaVecindad: () => 'sol',
    ambiente: () => ({ clima: 'sol', estacion: 'verano' }), hablandoCon: () => null, segundosPorHora: () => 75,
    deTurnoNegocio: (k) => JE.deTurno(k), salidaDeTurno: (k) => JE.salidaDeTurno(k) });
  // mira al local desde cerca (se lo ve entrar y salir caminando)
  const sale = JE.salidaDeTurno('padre');
  ok(sale && Number.isFinite(sale.x) && sale.saliendo === false, 'salidaDeTurno da el punto de salida del local');
  jug.estado.pos.x = o.datos.x; jug.estado.pos.z = o.datos.z - 12;
  const mios = () => lista.filter((x) => !x.quitado && (x.clave === 'aldea-padre' || x.clave === 'poblador-padre'));
  let finTurno = null, previo = null, primeraVisible = null, dobles = 0, hubo = false;
  const v = M.ventanaDeTurno(emp.turno, A.diaSemanaDe(2));
  for (let m = Math.floor((6) * 60); m <= (v[1] + 1.2) * 60; m++) {
    P.horas = m / 60;
    for (const x of lista) if (!x.dormido) mover(x, 1.25);
    AG.actualizar(1.25); JE.actualizar(1.25);
    const deTurno = JE.deTurno('padre');
    if (deTurno) { hubo = true; finTurno = null; primeraVisible = null; }
    if (hubo && !deTurno && finTurno === null) finTurno = P.horas;
    if (finTurno !== null) {
      const vecino = mios().find((x) => !x.empleadoNegocio), mostrador = mios().find((x) => x.empleadoNegocio);
      const verVecino = vecino && !vecino.dormido, verMostrador = mostrador && !mostrador.dormido && JE.figuras.get('padre')?.fase !== 'libre';
      if (verVecino && verMostrador) { dobles++; }
      if (verVecino && primeraVisible === null) primeraVisible = { x: vecino.pos.x, z: vecino.pos.z, h: P.horas };
    }
    previo = deTurno;
  }
  void previo;
  ok(hubo && finTurno !== null, `hubo turno y terminó (a las ${finTurno?.toFixed(2)})`);
  ok(primeraVisible, 'el vecino de la aldea vuelve a verse al terminar el turno');
  const d = Math.hypot(primeraVisible.x - sale.x, primeraVisible.z - sale.z);
  ok(d < 6, `reaparece a la salida del local (a ${d.toFixed(1)} m), no donde la rutina lo dejó`);
  eq(dobles, 0, 'nunca se ve a la vez su figura del mostrador y la de la aldea');
  ok(!JE.deTurno('padre'), 'terminado el turno');
  ok(enUnaLinea(main, ['deTurnoNegocio: (k) => !!empleadosNegocioJuego?.deTurno(k)', 'salidaDeTurno: (k) => empleadosNegocioJuego?.salidaDeTurno(k) || null']), 'main.js le da a la aldea los datos del turno');
  eq(JE.salidaDeTurno('pescador'), null, 'quien no es empleado no tiene salida');
}

// ---------------------------------------------------------------- D2 · la novia empleada de turno no sale a caminar ni sigue el paseo
{
  const E = await import('../src/amor-escenas.js');
  const p = { amor: { personas: { herbolaria: { etapa: 'saliendo' } } }, aldea: A.aldeaNuevaSana ? A.aldeaNuevaSana() : A.aldeaNueva() };
  const libre = E.puedeCaminar(p, 'herbolaria', { dia: 3, hora: 8.5, aldea: p.aldea });
  const deTurno = E.puedeCaminar(p, 'herbolaria', { dia: 3, hora: 8.5, aldea: p.aldea, turno: true });
  ok(libre.ok === true, 'libre del turno, a las 8:30 se puede salir a caminar');
  eq(deTurno, { ok: false, motivo: 'trabaja' }, 'de turno detrás del mostrador de tu local, no (dice que está trabajando)');
  ok(/Ahora no puedo, estoy trabajando/.test(E.FRASES_JUNTOS.no.trabaja), 'con su frase de siempre');
  ok(/entrar al trabajo/.test(E.FRASES_JUNTOS.turno), 'y hay una frase para cuando le toca entrar en pleno paseo');
  const am = leer('src/amor-mundo.js');
  ok(enUnaLinea(am, ['ctx.deTurno?.(j.clave)', 'terminarJuntos(true, FRASES_JUNTOS.turno)']), 'el paseo se termina cuando le empieza el turno');
  ok(enUnaLinea(am, ['ctx.deTurno?.(clave)', 'return false']), 'y no empieza uno estando de turno');
  ok(enUnaLinea(main, ['deTurno: (k) => !!empleadosNegocioJuego?.deTurno(k)', 'D2']), 'main.js le da al mundo del amor el turno de los empleados');
}

// ---------------------------------------------------------------- S2-7 · la panadera
{
  eq(A.SERVICIO.pesosPorPan, 600, 'tres panes por $600');
  eq(A.SERVICIO.panes, 3, 'son tres panes');
  const b = BIENES['pan-casero'];
  eq((A.SERVICIO.pesosPorPan / A.SERVICIO.panes) * b.lote, b.valor * 100, 'cada pan sale lo que vale en el mercado (ya no hay ganancia comprando en la panadería y vendiendo en el puesto)');
  const q = { modo: 'relax', dia: 3, horas: 10, entradas: {}, materiales: {}, cosas: {}, economia: { ...economiaNueva(), pesos: 1000 }, aldea: A.sanearAldea({ ...A.aldeaNueva(), pobladores: [{ clave: 'panadera', dia: 1 }], locales: { panaderia: 1 }, descubierta: 1 }) };
  const s = A.servicioBase('panadera', q, 3);
  ok(/\$600/.test(s.partes[0]) && /3 panes/.test(s.partes[0]), `lo que dice: «${s.partes[0]}»`);
  A.aplicarEfectos(q, s.efectos, 3);
  eq(pesosDe(q), 400, 'se cobran $600');
  eq(q.entradas['pan-casero'].cantidad, 3, 'y entran los tres panes');
  const pobre = { ...q, economia: { ...economiaNueva(), pesos: 500 } };
  ok(/\$600/.test(A.servicioBase('panadera', { ...pobre, dia: 4 }, 4).partes[0]), 'sin plata, el aviso dice $600');
  const todo = leer('src/aldea.js');
  ok(/tres panes por \$600/.test(todo) && !/tres panes por \$200/.test(todo), 'el resumen de la ficha también dice $600');
}

// ---------------------------------------------------------------- S2 · la demanda de la Casa de Té sigue el calendario
{
  const linea = main.split('\n').find((l) => l.includes('3.8.8: la demanda del pueblo'));
  ok(linea && /temporada: \(\) => temporadaDelDia\(progreso\.dia\)/.test(linea), 'crearAldeaGente toma la estación del calendario');
  ok(!/estacionDe\(\{ invierno: U\.uInvierno\.value/.test(linea), 'y ya no la del cielo');
  eq([...new Set(Array.from({ length: 400 }, (_, i) => temporadaDelDia(i + 1)))], ['verano', 'otono', 'invierno'], 'el calendario: verano, otoño, invierno, por día de la partida');
}

// ---------------------------------------------------------------- S6 · la picada de la tarde: el texto
{
  const e = ENCARGOS.find((x) => x.id === 'e-nocheagua');
  ok(/entre las 19 y las 22/.test(e.pedido) && /entre las 19 y las 22/.test(e.resumen), `el encargo: «${e.resumen}»`);
  ok(!/después de las siete|después de las 19/i.test(e.pedido + e.resumen), 'ya no dice «después de las…»');
  ok(/Entre las 19 y las 22/.test(leer('src/cuaderno.js')), 'el cuaderno dice lo mismo');
  ok(/progreso\.horas >= 19 && progreso\.horas < 22/.test(main), 'el juego cuenta de 19 a 22 (no cambió)');
}

console.log(`verificar-4-11-2-gente: ${n} comprobaciones OK`);
