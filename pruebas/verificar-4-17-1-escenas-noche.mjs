// 4.17.1: los arreglos del motor de escenas (zona E1), la noche de la nevada (zona E3) y las escenas con apagón que atrasaban el reloj (E4-4).
// Sólo Node; casi todo corre el código de verdad (con un mundo de mentira):
//   1. el calendario: con «la hora de tu reloj» la noche de la nevada ya no suma un día por cuadro; el tope general de medianoches;
//   2. la hora de las escenas: la regla única del corte en seco (horaDeCorte), la guardia del molino y las del apagón (E4-4), y el reloj de la PC;
//   3. la elección con margen (un Enter de más no elige) y la escena tapada por la pausa (sin clics);
//   4. la noche: «Dejar la historia en pausa», los aliados que vuelven a su ruta, la variante Viejo, los hongos del lomo, la lucecita, el 1 y el 2;
//   5. los duendes que nacían después de la despedida, el modo foto, el orden de lanzarEscena y «El que vuela» en el kayak.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { funcion } from './ayuda-codigo.mjs';
import { registrarThree } from './ayuda-three.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
const url = (f) => pathToFileURL(join(raiz, f)).href;
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };
const main = leer('src/main.js');

// ---------------------------------------------------------------- 1. el calendario
{
  // el tope general, con el código real
  const topeMedianoche = { t: 0, ultima: -Infinity, avisada: false };
  const medianochePermitida = funcion(main, 'medianochePermitida', { topeMedianoche, console: { warn() {} } });
  const correr = ({ horaReal, noche, cuadros, horasAntes = 22.5, pisar = true }) => {
    const progreso = { horas: horasAntes, dia: 30, relojNoche: null };
    let activa = noche;
    class Reloj { getHours() { return Math.floor(horaReal); } getMinutes() { return Math.round((horaReal % 1) * 60); } getSeconds() { return 0; } }
    const env = { trucosJuego: null, jugador: { estado: {} }, foto: { activo: false }, ajustes: { duracion: 'reloj' }, banco: { activa: false }, progreso, Date: Reloj,
      claveNocheReloj: () => 'otra-noche', nota: () => {}, modo: 'jugando', topeMedianoche, medianochePermitida, nocheMundo: { activa: () => activa } };
    const actualizarTiempo = funcion(main, 'actualizarTiempo', env);
    // la noche pisa la hora en cada cuadro (historia-noche-mundo.js: 22 + 1,7·t/270) DESPUÉS de actualizarTiempo, como en el bucle
    for (let i = 0; i < cuadros; i++) { actualizarTiempo(1 / 60); if (pisar) progreso.horas = 22 + 1.7 * Math.min(1, i / cuadros); }
    activa = false;
    progreso.horas = horasAntes;   // alTerminar('abandono'): vuelve la hora de antes
    for (let i = 0; i < 120; i++) actualizarTiempo(1 / 60);
    return progreso;
  };
  topeMedianoche.t = 0; topeMedianoche.ultima = -Infinity;
  const p1 = correr({ horaReal: 0.5, noche: true, cuadros: 3600 });
  ok(p1.dia === 31, `con la hora de tu reloj, una noche de la nevada que sigue después de la medianoche real suma UN día, no uno por cuadro (día ${p1.dia})`);
  ok(Math.abs(p1.horas - 0.5) < 0.05, `y al terminar la noche manda otra vez la hora de la PC (${p1.horas.toFixed(2)})`);
  // la defensa general: sin la guarda de la noche (como si otra cosa pisara la hora en cada cuadro), el tope deja pasar uno cada 15 s de juego
  topeMedianoche.t = 0; topeMedianoche.ultima = -Infinity;
  const p2 = correr({ horaReal: 0.5, noche: false, cuadros: 3600 });
  ok(p2.dia - 30 <= 5 && p2.dia - 30 >= 1, `el tope general: un minuto de «22 → 0:30» en cada cuadro suma a lo sumo 4 o 5 días, no 3600 (sumó ${p2.dia - 30})`);
  // el modo normal, con el tope: un día de 20 minutos sentado ×40 dura 30 s (mayor que el tope): cada medianoche cuenta
  {
    const tope = { t: 0, ultima: -Infinity, avisada: false };
    const progreso = { horas: 23.99, dia: 1 };
    const env = { trucosJuego: null, jugador: { estado: { sentado: true } }, foto: { activo: false }, ajustes: { duracion: 20 }, banco: { activa: false }, progreso, nota: () => {},
      modo: 'jugando', durmiendo: false, desafio: null, charla: {}, valle: null, esDesafio: false, topeMedianoche: tope, medianochePermitida: funcion(main, 'medianochePermitida', { topeMedianoche: tope, console }) };
    const actualizarTiempo = funcion(main, 'actualizarTiempo', env);
    for (let i = 0; i < 20 * 3; i++) actualizarTiempo(0.05);   // 3 s de juego: pasa la primera medianoche
    const d1 = progreso.dia;
    for (let i = 0; i < 20 * 60; i++) actualizarTiempo(0.05);   // 60 s sentado ×40 con días de 20 minutos: dos días más
    ok(d1 === 2 && progreso.dia === 4, `el modo normal sigue igual: cada medianoche suma su día (${d1} → ${progreso.dia})`);
  }
}

// ---------------------------------------------------------------- 2. la hora de las escenas
const E = await import(url('src/escenas.js'));
const { horaDeCorte, crearDirector } = E;
{
  ok(horaDeCorte(18, 7.5) === null && horaDeCorte(19, 11) === null && horaDeCorte(20.5, 16.5) === null, 'un corte a una hora que ya pasó hoy no atrasa el reloj (majada-vos, carpeta-celeste, mesa-guerra)');
  ok(horaDeCorte(1, 22.6) === null && horaDeCorte(0.5, 23.6) === null, 'de madrugada, un corte a la noche de hoy (la guardia, la masa) no se come un día');
  ok(horaDeCorte(10, 23.6) === 23.6 && horaDeCorte(23, 7) === 7 && horaDeCorte(4, 7.5) === 7.5, 'hacia adelante, como siempre (de las 10 a las 23:36; de las 23 a las 7 del otro día)');
  const { crearEscenasMundo } = await import(url('src/escenas-mundo.js'));
  const armarMundo = (p, duracion = 30) => crearEscenasMundo({ doc: null, progreso: () => p, ajustes: () => ({ duracion }), modo: () => 'jugando', T: { lugares: {} } }).mundo;
  const correrEscena = (esc, dia, horas, duracion = 30) => {
    const p = { dia, horas };
    const real = armarMundo(p, duracion);
    const mundo = new Proxy({ horaActual: real.horaActual, hora: real.hora, puedeEmpezar: () => true, posicion: () => ({ x: 0, y: 0, z: 0 }), suelo: () => 0, camaraJugador: () => ({ x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, fov: 70 }) },
      { get: (o, k) => (k in o ? o[k] : () => null) });
    const d = crearDirector({ mundo, estado: () => ({ vistas: {}, elecciones: {} }), dia: () => p.dia });
    const r = d.registrar(esc); if (!r.ok) return { mal: r.errores };
    for (const f of d.efectosFaltantes(esc.id)) d.registrarEfecto(f, () => {});
    d.disparar(esc.id, { forzar: true });
    for (let i = 0; i < 4000 && d.activa(); i++) { d.actualizar(0.1); if (d.datos()?.eleccion) d.elegir(0); else d.avanzar(); }
    return p;
  };
  const { ESCENAS_ACTO2 } = await import(url('src/historia-escenas-acto2.js'));
  const { ESCENAS_ACTO3 } = await import(url('src/historia-escenas-acto3.js'));
  const buscar = (id) => ESCENAS_ACTO2[id] || ESCENAS_ACTO3[id] || Object.values({ ...ESCENAS_ACTO2, ...ESCENAS_ACTO3 }).find((e) => e?.id === id);
  const g = correrEscena(buscar('guardia-molino'), 30, 1.0);
  ok(g.dia === 30, `«La guardia del molino» a la 1:00 del día 30 ya no se come un día (termina el día ${g.dia} a las ${g.horas?.toFixed(2)})`);
  for (const [id, h] of [['majada-vos', 18], ['carpeta-celeste', 19], ['mesa-guerra', 20.5], ['fiesta-nieve', 22.5]]) {
    const e = buscar(id);
    if (!e) { ok(false, `existe la escena ${id}`); continue; }
    const r = correrEscena(e, 10, h);
    ok(r.dia === 10 && r.horas >= h - 1e-6, `${id} a las ${h}: el reloj no vuelve para atrás ni se come un día (día ${r.dia}, ${r.horas.toFixed(2)} h)`);
  }
  // con «la hora de tu reloj», la escena no toca la hora (al cuadro siguiente la pisaba la PC y el salto sumaba un día)
  const pr = { dia: 5, horas: 1.0 };
  const mr = armarMundo(pr, 'reloj');
  mr.hora(22.6); mr.hora(7.2, { delta: 6 });
  ok(pr.dia === 5 && pr.horas === 1.0, 'con la hora de tu reloj, la hora de una escena no cambia ni la hora ni el día');
  // el mundo.hora: con delta, cruza hacia adelante; sin él, como siempre (baja más de 12 h)
  const pd = { dia: 3, horas: 15 };
  const md = armarMundo(pd);
  md.hora(7, { delta: 16 });
  ok(pd.dia === 4 && pd.horas === 7, `salteada, una hora con duración de las 15 a las 7 pasa al otro día (antes volvía a la mañana del mismo: día ${pd.dia})`);
  md.hora(23.9); md.hora(0.1);
  ok(pd.dia === 5, 'el paso a paso cruza la medianoche como siempre');
}

// ---------------------------------------------------------------- 3. la elección con margen y la escena tapada
{
  const mundo = { puedeEmpezar: () => true, horaActual: () => 12 };
  const d = crearDirector({ mundo });
  d.registrar({ id: 'q', pasos: [{ tipo: 'dialogo', quien: 'ramon', lineas: ['Hola.'] }, { tipo: 'eleccion', id: 'z', pregunta: '¿Y?', opciones: [{ id: 'a', texto: 'A' }, { id: 'b', texto: 'B' }] }] });
  d.disparar('q');
  for (let i = 0; i < 200 && !d.datos()?.eleccion; i++) { d.actualizar(0.05); d.avanzar(); }
  ok(!!d.datos()?.eleccion, 'la elección aparece');
  d.avanzar(); d.avanzar(); d.avanzar();
  ok(d.elecciones().z === undefined && !d.eleccionLista(), 'tres Enter de más apenas aparece la elección no eligen nada (el arnés del revisor elegía la marcada)');
  d.actualizar(0.25); d.avanzar();
  ok(d.elecciones().z === undefined, 'a los 0,25 s todavía no');
  d.actualizar(0.2);
  ok(d.eleccionLista() && d.avanzar() && d.elecciones().z === 'a', 'pasado el margen (0,4 s), Enter elige la marcada');
  const d2 = crearDirector({ mundo });
  d2.registrar({ id: 'n', pasos: [{ tipo: 'eleccion', id: 'z', opciones: [{ id: 'a', texto: 'A' }, { id: 'b', texto: 'B' }] }] });
  d2.disparar('n'); d2.actualizar(0.01);
  ok(d2.elegir(1) && d2.elecciones().z === 'b', 'los números eligen siempre (son a propósito)');

  // la capa de la escena con la pausa encima: un DOM de mentira
  const escuchas = new Map();
  const clases = new Set();
  const el = (id) => ({ id, className: '', style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, setAttribute() {}, appendChild() {}, querySelector: () => el('x'),
    addEventListener(t, f) { escuchas.set(`${this.id}:${t}`, f); }, set textContent(v) {}, set innerHTML(v) {} });
  const doc = { createElement: () => el(''), head: el('head'), body: Object.assign(el('body'), { classList: { add: (c) => clases.add(c), remove: (...cs) => cs.forEach((c) => clases.delete(c)), toggle: (c, si) => (si ? clases.add(c) : clases.delete(c)), contains: (c) => clases.has(c) } }) };
  let modo = 'jugando';
  const { crearEscenasMundo } = await import(url('src/escenas-mundo.js'));
  const p = { dia: 1, horas: 12, historia: null };
  const EM = crearEscenasMundo({ doc, progreso: () => p, ajustes: () => ({}), modo: () => modo, T: { lugares: {} }, jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 }, soltar() {} }), camara: { position: { x: 0, y: 1.6, z: 0 }, rotation: { x: 0, y: 0 } } });
  EM.registrar({ id: 'p', efimera: true, pasos: [{ tipo: 'dialogo', quien: 'ramon', lineas: ['Una.', 'Dos.'] }] });
  EM.director.mundo = undefined;
  ok(EM.disparar('p'), 'la escena de prueba arranca');
  try { EM.actualizar(0.05); } catch { /* sin cámara de verdad: el director igual corre */ }
  EM.director.actualizar(2);
  const capa = [...escuchas.keys()].find((k) => k.startsWith('escena-capa:click'));
  const antes = EM.director.datos()?.dialogo?.linea;
  modo = 'pausa'; EM.tapar(true);
  escuchas.get(capa)?.();
  ok(EM.director.datos()?.dialogo?.linea === antes, 'con la pausa abierta, un clic en la capa de la escena no avanza el diálogo');
  ok(clases.has('escena-tapada'), 'y la escena queda tapada (sin dibujarse encima de la pausa ni recibir clics)');
  modo = 'jugando'; EM.tapar(false);
  ok(!clases.has('escena-tapada'), 'al volver al juego, se destapa');
  const css = E && (await import(url('src/escenas-mundo.js'))).CSS_ESCENAS;
  ok(/body\.escena-tapada #escena-capa[^{]*\{[^}]*pointer-events: none/.test(css) && /body\.escena-tapada #escena-dialogo/.test(css), 'el estilo de la escena tapada no recibe clics');
  ok(main.includes("if (escenasMundo) escenasMundo.tapar(modo !== 'jugando');"), 'el bucle la tapa fuera del juego (la pausa, la guía, la portada)');
}

// ---------------------------------------------------------------- 4. la noche
{
  const { crearNocheUi } = await import(url('src/historia-noche-ui.js'));
  const el = () => ({ classList: { toggle() {}, contains() { return true; }, add() {}, remove() {} }, style: {}, setAttribute() {}, appendChild() {} });
  const doc = { getElementById: () => null, createElement: el, body: el() };
  let activa = true, abandonos = 0;
  const mundo = { activa: () => activa, abandonar() { abandonos++; activa = false; }, actualizar() {}, hud: () => null };
  const ui = crearNocheUi({ documento: doc, noche: mundo, progreso: () => ({ horas: 22 }), guardar() {}, nota() {}, modo: () => 'jugando' }, { mostrar() {}, cerrar() {} }, { historia: () => ({ activa: true }) });
  let error = null;
  try { if (ui.activa()) ui.abandonar(); } catch (e) { error = e; }
  ok(!error && abandonos === 1 && !ui.activa(), `«Dejar la historia en pausa» en plena noche la deja (antes: TypeError) ${error ? error.message : ''}`);
  ui.abandonar();
  ok(abandonos === 1, 'sin noche, abandonar no hace nada');

  // los aliados vuelven a su ruta (el código real de main.js)
  const ramon = { ruta: [{ x: 1, z: 1 }], conVos: true, enCita: true, sinFrenar: true, dormido: false, camino: [] };
  const graciela = { conVos: true, camino: [] };
  const aliadosTomados = [{ n: ramon, g: { camino: undefined, velocidad: 0.8, conVos: false, enCita: false, sinFrenar: false, dormido: false } }, { n: graciela, g: { camino: undefined } }];
  funcion(main, 'soltarAliadosDeNoche', { aliadosTomados, Number })();
  ok(ramon.camino === undefined && ramon.conVos === false && ramon.velocidad === 0.8, 'al terminar la noche, Ramón (de ruta) vuelve a su ruta: sin `camino = []` que lo dejaba quieto');
  ok(Array.isArray(graciela.camino) && graciela.camino.length === 0, 'el que no tiene ruta queda quieto como antes');
  const acomp = leer('src/historia-acompanante.js');
  ok(acomp.includes('npc.camino = g.camino === undefined ? (Array.isArray(npc.ruta) ? undefined : []) : g.camino;'), 'el acompañante (Tobías, Ramón) también vuelve a su ruta');

  // el mundo de la noche con three: la variante Viejo, los hongos, la lucecita, las teclas
  registrarThree();
  globalThis.window = globalThis.window || { addEventListener() {} };
  const escuchasVentana = new Map();
  window.addEventListener = (t, f) => { escuchasVentana.set(t, f); };
  const nada = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : nada), apply: () => nada, set: () => true });
  globalThis.document = globalThis.document || { createElement: () => ({ width: 64, height: 64, getContext: () => nada, style: {} }) };
  globalThis.performance ??= { now: () => Date.now() };
  const THREE = await import('three');
  const { crearDuende } = await import(url('src/desafio-duendes.js'));
  const dv = crearDuende('rastreador', { viejo: true }); dv.reiniciar(); dv.vestir(true);
  ok(dv.viejo === true, 'un duende del pozo viejo, reiniciado y vestido, es Viejo');
  const jefe = crearDuende('jefe');
  ok(!jefe.u && !!jefe.uniformes().uDebil, 'el uniforme del lomo está en uniformes(), no en `u`');
  const NM = leer('src/historia-noche-mundo.js');
  ok(/m\.reiniciar\(\);\s*\n\s*if \(viejo\) m\.vestir\(true\);/.test(NM), 'tomar() viste de Viejo a los del cerro después de reiniciarlos');
  ok(NM.includes("m.uniformes?.()") && NM.includes("opciones?.deuda !== true") && !NM.includes('m.u?.uDebil'), 'la ayuda de los hongos usa uniformes() y no ayuda con deuda');

  const { crearNocheMundo } = await import(url('src/historia-noche-mundo.js'));
  const escena = new THREE.Scene();
  const js = { pos: new THREE.Vector3(0, 0, 0), pitch: 0 };
  const jugador = { estado: js, ubicar(x, z) { js.pos.set(x, 0, z); }, bloqueado: () => false };
  const sonido = { relax: true, impacto() {}, ctx: null };
  const T = { altura: () => 1, lugares: { refugio: { puerta: { x: 0, z: 0 } } }, indice: () => 0, distRio: [999], anchoRio: [0] };
  const prog = { horas: 22 };
  let fin = null;
  const M = crearNocheMundo({ T, escena, camara: new THREE.PerspectiveCamera(), col: { agregar() {}, eliminarPorDuenio() {}, resolver() {} }, sonido, jugador: () => jugador, progreso: () => prog, nota() {}, modo: () => 'jugando', puntoDe: () => null });
  M.preparar();
  M.iniciar({ modo: 'trato', centro: { x: 0, z: 0 }, lado: { dx: 1, dz: 0 }, defensas: { estacas: true }, aliados: {}, ayudas: true, fuerte: false, deuda: false, alTerminar: (r) => { fin = r; } });
  const sim = M.sim;
  const luces = () => escena.children.filter((o) => o.isMesh && o.visible && Math.abs(o.scale.x - 2.2) < 0.6);
  M.actualizar(0.05); sim.travesuras = -100; sim.t = 77.9;
  let vio = false;
  for (let i = 0; i < 400 && M.activa(); i++) { M.actualizar(0.05); if (!vio && luces().length && sim.preaviso) { vio = true; sim.travesuras = 7; } }
  ok(vio && !M.activa(), `se vio la lucecita del topo y la noche terminó (${fin && fin.motivo})`);
  ok(luces().length === 0, `al terminar la noche durante el aviso, la lucecita se apaga (quedaban ${luces().length})`);
  ok(sonido.relax === true, 'el sonido vuelve al Relax');
  // las teclas 1 y 2 durante una escena de entre olas
  M.iniciar({ modo: 'pelea', centro: { x: 0, z: 0 }, lado: { dx: 1, dz: 0 }, defensas: { estacas: true }, aliados: {}, alTerminar: () => {} });
  M.pausar(true);
  let cortada = false;
  escuchasVentana.get('keydown')?.({ code: 'Digit2', stopImmediatePropagation() { cortada = true; } });
  ok(!cortada, 'con la noche en pausa (una escena entre olas), el 2 llega a la escena: no cambia de arma');
  M.pausar(false);
  escuchasVentana.get('keydown')?.({ code: 'Digit2', stopImmediatePropagation() { cortada = true; } });
  ok(cortada, 'jugando la noche, el 2 sigue siendo la honda');
  M.abandonar();
}

// ---------------------------------------------------------------- 5. los duendes de la escena, el modo foto, lanzarEscena y el faro
{
  // los que nacen de a uno: si la escena se despide antes, ya no nacen
  const pendientes = new Map(); let id = 0;
  const env = { nacimientosDeEscena: new Set(), setTimeout: (f, ms) => { pendientes.set(++id, f); return id; }, clearTimeout: (t) => pendientes.delete(t) };
  env.nacerLuego = funcion(main, 'nacerLuego', env);
  env.cancelarNacimientos = funcion(main, 'cancelarNacimientos', env);
  let nacidos = 0;
  for (let i = 0; i < 5; i++) env.nacerLuego(() => { nacidos++; }, i * 700);
  const primero = [...pendientes.entries()][0]; pendientes.delete(primero[0]); primero[1]();
  const despedidos = [];
  funcion(main, 'despedirDuendesDeEscena', { duendesDeEscena: [{ huir: () => despedidos.push(1) }], cancelarNacimientos: env.cancelarNacimientos })();
  for (const f of pendientes.values()) f();
  ok(nacidos === 1 && pendientes.size === 0 && env.nacimientosDeEscena.size === 0 && despedidos.length === 1, `saltear la guardia cancela los duendes que faltaban nacer (nacieron ${nacidos} de 5)`);
  ok(/if \(id === 'enjambre-lago'\)[^\n]*nacerLuego\(/.test(main) && /siluetas-raiz' \|\| id === 'pillos-bellotas'\)[^\n]*nacerLuego\(/.test(main) && main.includes('const quitarTodos = () => { cancelarNacimientos();'), 'las siluetas, los pillos y el enjambre nacen con nacerLuego, y «Pararte de golpe» también los cancela');
  ok(main.includes('const puedeFoto = !escenasMundo?.activa() && fotoPosible('), 'F2 no prende el modo foto encima de una escena');
  const ui = leer('src/historia-ui.js');
  const i0 = ui.indexOf('function lanzarEscena('), i1 = ui.indexOf('\n  }\n', i0), cuerpo = ui.slice(i0, i1);
  ok(cuerpo.indexOf('ctx.puedeEscena(deSentado)') > 0 && cuerpo.indexOf('ctx.puedeEscena(deSentado)') < cuerpo.indexOf('ctx.colocar?.('), 'lanzarEscena pregunta si la escena puede empezar ANTES de mover al jugador');
  // la regla de puedeEmpezarEscena: sentado no puede, salvo la que te levanta
  const pe = (sentado, deSentado) => funcion(main, 'puedeEmpezarEscena', { jugador: { estado: { sentado } }, modo: 'jugando', durmiendo: false, foto: {}, banco: {}, creadorAbierto: null, modoObra: false, charla: {}, panelDelHudAbierto: () => false, panelFueraDelHudAbierto: () => false, escenaDesdeVehiculo: false })(deSentado);
  ok(pe(false) === true && pe(true) === false && pe(true, true) === true, 'sentado no empieza una escena (y no te mueve), salvo la guardia que te levanta');
  ok(/if \(ctx\.enVehiculo\(\)\) return !!\(ctx\.enAgua\?\.\(\)[^\n]*lanzarEscena\(h, s, \{ modo: 'auto', soloVehiculo: true \}\)/.test(ui) && cuerpo.includes('if (o.soloVehiculo && !ESCENAS_DESDE_VEHICULO.includes(id)) return false;'), '«El que vuela» puede empezar en el kayak o el velero (y ninguna otra en el agua)');
}

if (fallas) { console.log(`verificar-4-17-1-escenas-noche: ${fallas} de ${n} FALLAN`); process.exit(1); }
console.log(`verificar-4-17-1-escenas-noche: ${n} comprobaciones OK`);
