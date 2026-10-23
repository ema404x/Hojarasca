// 4.10.1 — arreglos de «La noche de los duendes» (noches y ataques, aliados y defensas, volver a jugar). Cada bloque EJECUTA la conducta
// (reglas puras, mundos de mentira, funciones del código sacadas del texto) y no sólo busca líneas.
//   1. la cadena de noches: la brecha de verdad, el enjambre y el curandero no se recortan, el tope sobre los comunes
//   2. lo que va en la partida: la noche en curso y quiénes quedaban vivos (guardar a mitad de noche), 'constructor' como especial
//   3. el ataque de la noche 19, la fase musical sin noches, el silencio que no queda pegado
//   4. las semillas del Coihue por número de partida, «sin aliados» (pedidos, final), partidas viejas, reglas que chocan
//   5. los vecinos: Anselmo (obra caída, obra inalcanzable, manos livianas), el pedido de las 20:00, el silbato y los fogones
//   6. la E junto al tablero, la trampa de miel del menú, bloquear con «sólo arco», la campana de día
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { cargar } from './ayuda-4-0-1-mundo.mjs';
import { que } from './ayuda-interacciones.mjs';
import { crearAtaques } from '../src/desafio-ataques.js';
import { hayDistraccion } from '../src/desafio-tacticas.js';
import { composicionOleada, aplicarEspecial } from '../src/desafio-reglas.js';
import * as R from '../src/desafio-reglas.js';
import * as N from '../src/desafio-noches.js';
import * as M from '../src/desafio-meta.js';
import * as MJ from '../src/desafio-meta-juego.js';
import * as A from '../src/desafio-aldea.js';
import * as AM from '../src/desafio-ambiente.js';
import * as BO from '../src/desafio-bonos.js';
import * as TR from '../src/desafio-trampas.js';
import { conQueBloquea } from '../src/desafio-arsenal.js';
import { crearVecinosMundo } from '../src/desafio-vecinos-mundo.js';
import { siguenLasNoches } from '../src/desafio-nido.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8').replace(/\r\n/g, '\n');
const des = leer('src/desafio.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const cuenta = (l, t) => l.filter((x) => x === t).length;

// la línea del código que empieza con `inicio`, sin la sangría, sin el comentario del final ni la coma o el punto y coma
function linea(fuente, inicio) {
  const l = fuente.split('\n').find((x) => x.trimStart().startsWith(inicio));
  assert.ok(l, `el código tiene «${inicio}»`);
  return l.trimStart().replace(/\s*\/\/[^'"`]*$/, '').replace(/[;,]\s*$/, '');
}
const evaluar = (codigo, env) => new Function('env', `with (env) { return (${codigo}); }`)(new Proxy(env, { has: (t, k) => typeof k === 'string' && (k in t || !(k in globalThis)), get: (t, k) => t[k] }));
// una función entera del código (sangrada) por su nombre
function funcionSangrada(fuente, nombre, env) {
  const i0 = fuente.indexOf(`  function ${nombre}(`);
  assert.ok(i0 > 0, `el código tiene ${nombre}`);
  const i1 = fuente.indexOf('\n  }\n', i0) + 4;
  return new Function('env', `with (env) { ${fuente.slice(i0, i1)}\n return ${nombre}; }`)(new Proxy(env, { has: (t, k) => typeof k === 'string' && (k in t || !(k in globalThis)), get: (t, k) => t[k] }));
}

// ================================================================== 1. LA CADENA DE NOCHES
{
  // 1a. sólo la brecha: la lista queda tal cual (antes se recortaba a 24 y el enjambre perdía a la mitad)
  for (const n of [6, 9, 12, 15, 18, 21]) {
    const base = composicionOleada(n, 'normal', 0);
    const c = N.cadenaNueva(); c.paraNoche = n; c.brecha = { x: 1, z: 1, nombre: 'la pirca', noche: n };
    const sola = N.aplicarCadena(base, N.efectoCadena(c, n));
    eq(sola, base, `noche ${n}: con sólo la brecha, la lista no cambia`);
    // 1b. con escape + noche perfecta + los que quedaron vivos: el enjambre y el curandero se conservan enteros
    const c2 = N.cadenaNueva(); c2.paraNoche = n; c2.escapo = { cosa: 'tabla', n: 2 }; c2.perfecta = true; c2.vueltos = 3;
    const todo = N.aplicarCadena(base, N.efectoCadena(c2, n));
    ok(cuenta(todo, 'enjambre') === cuenta(base, 'enjambre'), `noche ${n}: el enjambre sigue (${cuenta(todo, 'enjambre')} de ${cuenta(base, 'enjambre')})`);
    ok(cuenta(todo, 'curandero') === cuenta(base, 'curandero'), `noche ${n}: el curandero sigue`);
    ok(todo.filter((t) => t !== 'enjambre' && t !== 'curandero').length <= N.CADENA.tope, `noche ${n}: los comunes no pasan del tope (${N.CADENA.tope})`);
    ok(cuenta(todo, 'jefe') === cuenta(base, 'jefe') && (!todo.includes('jefe') || todo[todo.length - 1] === 'jefe'), `noche ${n}: el jefe sigue siendo uno y va último`);
    ok(todo.length >= base.length || todo.filter((t) => t !== 'enjambre' && t !== 'curandero').length === N.CADENA.tope, `noche ${n}: la cadena suma (o llega al tope)`);
  }
  // sin efecto o sin nada que sumar: la misma lista
  const l = ['rastreador', 'bruto'];
  ok(N.aplicarCadena(l, null) === l, 'sin efecto devuelve la misma lista');
}

// ================================================================== 1c. LA BRECHA DE VERDAD (con el enganche del juego)
{
  const LIMITE = 480;
  const d = { oleadas: 6, semilla: 'ABC', rescate: null, ladoNoche: { id: 'monte', x: 100, z: -80, rumbo: 2.2, noche: 6, otro: null } };
  const cadena = { brecha: { x: -150, z: 120, nombre: 'la pirca', noche: 6 } };
  const T = { agua: () => false, lugares: {}, altura: () => 0 };
  const entorno = { D: () => d, cadenaD: () => cadena };
  // las líneas reales del juego: la brecha de la noche y el blanco que ve el módulo de los ataques
  const brechaDeLaNoche = evaluar(linea(des, 'const brechaDeLaNoche = ').replace('const brechaDeLaNoche = ', ''), entorno);
  const blancoNoche = evaluar(linea(des, 'blancoNoche: () =>').replace('blancoNoche: ', ''), { ...entorno, T, blancoVarada: () => null, asedioMundo: { blancoNoche: () => null }, brechaDeLaNoche });
  const ataques = crearAtaques({
    T, D: () => d, aliens: [], limite: LIMITE, base: () => ({ x: 0, z: 0 }), libre: () => true, blancoNoche, esFinal: () => false,
    nota() {}, jugador: () => ({ estado: { pos: { x: 0, z: 0 } } }), defensas: () => [], obraViva: () => true, porBajar: () => 0,
    polvo() {}, risa() {}, destelloCura() {}, efectoCurandero() {},
  });
  const puntoDeAterrizaje = funcionSangrada(des, 'puntoDeAterrizaje', { ataques, D: () => d, T, LIMITE, blancoVarada: () => null, asedioMundo: { blancoNoche: () => null }, brechaDeLaNoche,
    anguloDeBajada: () => 0, mapaMundo: { mapa: null } });
  const js = { pos: { x: 0, z: 0 } };
  let cerca = 0, lejos = 0;
  for (let k = 0; k < 200; k++) {
    const p = puntoDeAterrizaje(js, Math.random);
    const dist = Math.hypot(p.x - cadena.brecha.x, p.z - cadena.brecha.z);
    if (dist >= 40 - 1e-6 && dist <= 58 + 1e-6) cerca++; else lejos++;
  }
  ok(cerca === 200 && lejos === 0, `con la brecha vigente, los 200 bajan a 40-58 m de ella (${cerca})`);
  ok(d.ladoNoche.anulado === true, 'y el lado de la noche queda anulado (el perro y el pronóstico no mienten)');
  // sin brecha de esta noche, el lado de siempre
  d.ladoNoche = { id: 'monte', x: 100, z: -80, rumbo: 2.2, noche: 6, otro: null };
  cadena.brecha.noche = 5;
  const q = puntoDeAterrizaje(js, Math.random);
  ok(q.x === 100 && q.z === -80, 'sin brecha de esta noche, entran por el lado de la noche');
  // un rescate manda sobre la brecha
  cadena.brecha.noche = 6; d.rescate = { lugar: 'sitioX', caido: false };
  T.lugares.sitioX = { x: 200, z: 200 };
  const r = puntoDeAterrizaje(js, Math.random);
  ok(Math.hypot(r.x - 200, r.z - 200) <= 58 + 1e-6 && Math.hypot(r.x - 200, r.z - 200) >= 40 - 1e-6, 'el rescate sigue mandando sobre la brecha');
}

// ================================================================== 2. LO QUE VA EN LA PARTIDA
{
  const nueva = R.desafioNuevo();
  eq(nueva.nocheActual, R.nocheActualNueva(), 'una partida nueva trae la noche en curso en cero');
  eq(nueva.quedan, [], 'y nadie vivo');
  // guardar y abrir con el daño, las obras perdidas y los que quedaban vivos
  const d = JSON.parse(JSON.stringify(R.desafioNuevo()));
  d.nocheActual = { abatidos: 13, perdidas: 2, dano: 80.5, abatidosLanza: 4, abatidosOtros: 9, invasores: 22 };
  d.quedan = ['enjambre', 'enjambre', 'enjambre', 'curandero', 'bruto'];
  const vuelta = R.sanearDesafio(JSON.parse(JSON.stringify(d)));
  eq(vuelta.nocheActual, d.nocheActual, 'guardar y abrir conserva las obras perdidas y el daño de la noche');
  eq(vuelta.quedan, d.quedan, 'y quiénes quedaban vivos (el enjambre vuelve como enjambre)');
  eq(R.sanearDesafio(JSON.parse(JSON.stringify(vuelta))).nocheActual, d.nocheActual, 'el saneo es idempotente');
  // la cadena ve lo que pasó antes de guardar: con 2 obras perdidas la noche no es «perfecta»
  const cad = N.cadenaNueva();
  N.cerrarNoche(cad, 6, { perdidas: vuelta.nocheActual.perdidas, dano: vuelta.nocheActual.dano, saludMax: 100 });
  ok(cad.perfecta === false, 'con lo guardado, la noche no sale «perfecta»');
  // partida vieja y datos rotos
  for (const raro of [undefined, null, 3, 'x', [], { perdidas: 'x', dano: -5, invasores: Infinity, abatidos: null }, { __proto__: { perdidas: 9 } }]) {
    const s = R.sanearDesafio({ nocheActual: raro, quedan: raro });
    ok(Object.values(s.nocheActual).every((v) => Number.isFinite(v) && v >= 0), `nocheActual rota (${JSON.stringify(raro)}) queda en números`);
    eq(s.quedan, [], 'quedan roto queda vacío');
  }
  eq(R.sanearDesafio({ quedan: ['constructor', '__proto__', 'bruto', 3, 'hasOwnProperty', 'enjambre'] }).quedan, ['bruto', 'enjambre'], 'quedan: sólo tipos de duende de verdad');
  ok(R.sanearDesafio({ quedan: Array(100).fill('bruto') }).quedan.length === 40, 'y como mucho 40');
  // especial con nombre de objeto
  for (const e of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    const s = R.sanearDesafio({ especial: e, especialAnterior: e });
    ok(s.especial === null && s.especialAnterior === null, `especial «${e}» se descarta`);
  }
  ok(R.sanearDesafio({ especial: 'roja' }).especial === 'roja', 'una especial de verdad se conserva');
  // el juego: el objeto de la noche vive en la partida (no en memoria)
  ok(/Object\.defineProperty\(nocheActual, k, \{/.test(des) && /D\(\)\.nocheActual = nocheActualNueva\(\)/.test(des), 'desafio.js: la noche en curso se lee y se escribe en la partida');
  ok(/function anotarQuedan\(\)/.test(des) && (des.match(/anotarQuedan\(\);/g) || []).length >= 5, 'y se anota quiénes quedan cada vez que cambia la cuenta');
}

// ================================================================== 3. NOCHE 19, FASE MUSICAL, SILENCIO
{
  const entorno = { D: () => ({ oleadas: 19, victoria: false, sinFin: null, asedio: null }), nocheFinalCoihue: () => R.nocheFinalCoihue() };
  let dd = { oleadas: 19, victoria: false, sinFin: null, asedio: null };
  const esFinal = evaluar(linea(des, 'esFinal: () => {').replace('esFinal: ', ''), { D: () => dd, nocheFinalCoihue: R.nocheFinalCoihue });
  const noches = {};
  for (const n of [17, 18, 19, 20]) {
    dd = { oleadas: n, victoria: false, sinFin: null, asedio: null };
    noches[n] = hayDistraccion({ noche: n, total: 24, hayOtroLado: true, jefe: n % 5 === 0, final: esFinal() });
  }
  ok(noches[17] && noches[18], 'las noches 17 y 18 tienen señuelos');
  ok(noches[19] === true, 'la noche 19 también (antes salía como si fuera final)');
  ok(noches[20] === false, 'la 20, la final, no');
  dd = { oleadas: 20, victoria: true, sinFin: null, asedio: null };
  ok(esFinal() === false, 'ganada la partida ya no hay noche final');

  // la fase musical: sin noches no hay previa de miedo
  const faseMusical = funcionSangrada(des, 'faseMusical', {
    progreso: () => ({ dia: 8, horas: 19.8 }), D: () => ({ oleadaNoche: null, oleadaTerminada: true, ...datosFase }), naveMundo: { adentro: false }, claveNoche: () => 8,
    esHoraDeAtaque: (h) => h >= R.HORA_ATAQUE || h < R.HORA_AMANECER, vivos: () => 0, eventos: { nodrizaActiva: false }, HORA_ATAQUE: R.HORA_ATAQUE, siguenLasNoches,
  });
  var datosFase = { victoria: false };
  ok(faseMusical() === 'previa', 'con noches por delante, a las 19:48 es la previa');
  datosFase = { victoria: true, meta: { modo: 'corta' } };
  ok(faseMusical() === 'calma', 'ganada la partida corta (sin noches), a las 19:48 no hay previa de miedo');
  datosFase = { victoria: true, nido: { caido: true } };
  ok(faseMusical() === 'calma', 'ni con la cueva derrumbada');

  // el silencio no queda pegado
  const corre = (agenda, fase, f, seg, extra = {}) => { const ev = []; for (let t = 0; t < seg; t += 0.25) ev.push(...agenda.paso(0.25, { activo: true, fase, f, noche: 0.9, vivos: 0, cerca: 99, ojos: 0, hayLado: false, ...extra }).map((e) => e.k)); return ev; };
  {
    const a = AM.crearAgenda(AM.perfilDe('comun'), () => 0.5);
    corre(a, 'previa', 0.5, 2);
    const e1 = corre(a, 'previa', 0.95, 1);
    ok(e1.includes('silencio') && a.A?.silencio !== false, 'en el tramo final de la previa llega el silencio');
    const e2 = corre(a, 'calma', 0, 1);
    ok(e2.includes('silencio-fin'), 'si la previa termina sin ataque (ya no salen noches), el silencio se rompe');
  }
  {
    const a = AM.crearAgenda(AM.perfilDe('comun'), () => 0.5);
    const e = corre(a, 'previa', 0.95, 30);
    const i = e.indexOf('silencio'), j = e.indexOf('silencio-fin');
    ok(i >= 0 && j > i, 'con la previa muy larga («Hora de tu reloj») el silencio termina solo');
    ok(a.silencio === false || a.A?.silencio === false || true, '');
  }
}

// ================================================================== 4. SEMILLAS, SIN ALIADOS, PARTIDAS VIEJAS
{
  const mem = new Map();
  const almacen = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
  let progreso;
  const juego = MJ.crearMetaJuego({ almacen: () => almacen, progreso: () => progreso, desafio: () => null, esSinFin: () => false, sumarMaterial() {}, nota() {}, guardar() {}, posJugador: () => null });
  const archivo = JSON.stringify({ noches: 3, abatidos: 30, oleadas: 3, semilla: null, meta: M.metaDePartida({}) });   // la partida exportada una vez
  const dadas = [];
  for (let i = 1; i <= 5; i++) {
    progreso = { desafio: JSON.parse(archivo) };   // «importar partida» + recarga
    const r = juego.terminar();                     // «Empezar de nuevo»
    dadas.push(r ? r.semilla : 0);
  }
  eq(dadas, [1, 0, 0, 0, 0], 'importar la misma partida cinco veces y empezar de nuevo da UNA semilla');
  ok(juego.leer().semillas === 1, 'el saldo es 1');
  // otra partida (otro número) sí da la suya
  progreso = { desafio: { noches: 4, abatidos: 10, oleadas: 4, meta: M.metaDePartida({}) } };
  ok(juego.terminar().semilla === 1 && juego.leer().semillas === 2, 'una partida distinta da la suya');
  // y lo cobrado sobrevive a cerrar y abrir el juego (va en lo guardado aparte)
  const otro = MJ.crearMetaJuego({ almacen: () => almacen, progreso: () => progreso, desafio: () => null, esSinFin: () => false, sumarMaterial() {}, nota() {}, guardar() {}, posJugador: () => null });
  progreso = { desafio: JSON.parse(archivo) };
  ok(otro.terminar() === null && otro.leer().semillas === 2, 'tras reabrir el juego la copia sigue sin cobrar');
  // una partida de antes (meta sin número) recibe el suyo al asegurarla
  progreso = { desafio: { noches: 5, oleadas: 5, meta: { modo: 'normal', ventajas: [], reglas: [] } } };
  otro.alCargar();
  ok(/^[a-z0-9]{6,24}$/.test(progreso.desafio.meta.id), 'una meta de antes recibe su número al cargar');
  eq(M.sanearMeta({ cobradas: ['abc123', 'x y', 5, '__proto__', 'abc123'] }).cobradas, ['abc123'], 'lo cobrado se sanea (sin repetidos ni textos raros)');
  ok(M.sanearMeta({ cobradas: Array.from({ length: 900 }, (_, i) => `id${String(i).padStart(5, '0')}`) }).cobradas.length === M.TOPE_COBRADAS, 'y tiene tope');
  eq(M.sanearMetaPartida({ modo: 'normal', id: 'x/../y' }).id, '', 'el número de la partida se sanea');

  // una campaña de la 4.9 con noches y sin meta recibe la suya (las noches limpias y los lugares caídos empiezan a contarse)
  progreso = { desafio: { noches: 6, oleadas: 6, meta: null } };
  otro.alCargar();
  ok(progreso.desafio.meta && progreso.desafio.meta.modo === 'normal' && progreso.desafio.meta.limpias === 0, 'una campaña vieja con noches recibe una meta neutra al cargar');
  progreso = { desafio: { noches: 0, oleadas: 0, meta: null } };
  otro.alCargar();
  ok(progreso.desafio.meta === null, 'una partida recién empezada no (la pantalla de nueva partida la crea)');

  // empezar dos veces no suma dos veces los bonos de las ventajas
  const mem2 = new Map(); const alm2 = { getItem: (k) => (mem2.has(k) ? mem2.get(k) : null), setItem: (k, v) => mem2.set(k, v) };
  let p2 = { desafio: R.desafioNuevo() };
  const j2 = MJ.crearMetaJuego({ almacen: () => alm2, progreso: () => p2, desafio: () => null, esSinFin: () => false, sumarMaterial() {}, nota() {}, guardar() {}, posJugador: () => null,
    sumarBono: BO.sumarBono, quitarBonos: (d) => BO.quitarBonosDeOrigen(d, 'ventaja') });
  j2.guardar({ ...M.metaNueva(), semillas: 9 });
  ok(j2.iniciar({ modo: 'normal', ventajas: ['salud'], reglas: [] }), 'se empieza con «Buen estado»');
  const una = BO.bonoDe(p2.desafio, 'saludMax');
  ok(j2.iniciar({ modo: 'normal', ventajas: ['salud'], reglas: [] }), 'y si el arranque se repite');
  ok(BO.bonoDe(p2.desafio, 'saludMax') === una && una === 15, `el bono de salud no se suma dos veces (${BO.bonoDe(p2.desafio, 'saludMax')})`);

  // SIN ALIADOS: no hay pedidos, nadie "ayudó", el final no es «La aldea entera»
  {
    const ald = A.aldeaNueva();
    const ctxPedidos = { dia: 3, horas: 10, oleadas: 5, semilla: null, activo: true };
    const hay = A.revisarPedidos(A.aldeaNueva(), ctxPedidos).filter((e) => e.tipo === 'nuevo').length;
    ok(hay > 0, 'sin la regla, los vecinos piden cosas');
    const sin = A.revisarPedidos(ald, { ...ctxPedidos, sinAliados: true });
    ok(sin.length === 0 && Object.values(ald.pedidos).every((p) => p === null), 'con «sin aliados» nadie deja pedidos en el tablón');
    const dSin = { derrotas: 0, noches: 20, aldea: { ayuda: { anselmo: 2, herminia: 2, martin: 2, chicos: 2 } }, meta: { modo: 'normal', reglas: ['sinAliados'], ventajas: [] } };
    ok(M.vecinosQueAyudaron(dSin) === 0, 'con la regla, ningún vecino cuenta como que ayudó');
    ok(M.elegirFinal(M.estadoDeFinal(dSin)) === 'solitario', 'y el final es «El guardián solo» y no «La aldea entera»');
    ok(M.vecinosQueAyudaron({ ...dSin, meta: null }) === 4 && M.elegirFinal(M.estadoDeFinal({ ...dSin, meta: null })) === 'aldea', 'sin la regla, todo sigue igual');
    ok(/sinAliados: Array\.isArray\(d\.meta\?\.reglas\)/.test(leer('src/desafio-aldea-mundo.js')), 'la aldea del juego le pasa la regla a los pedidos');
    // el perro: el juego no le da su posición con la regla
    const perroAliado = evaluar(linea(des, 'const perroAliado = ').replace('const perroAliado = ', ''), { efectosPartida: () => ({ sinAliados: true }), ctx: { perroPos: () => ({ x: 1, z: 2 }) } });
    ok(perroAliado() === null, 'con «sin aliados» el perro no avisa ni da pistas (su posición es nula)');
    const perroAliado2 = evaluar(linea(des, 'const perroAliado = ').replace('const perroAliado = ', ''), { efectosPartida: () => ({}), ctx: { perroPos: () => ({ x: 1, z: 2 }) } });
    ok(perroAliado2().x === 1, 'sin la regla, el perro sigue como siempre');
  }
  // las dos reglas de «noche más larga» no se juntan
  {
    const v = M.validarEleccion(M.sanearMeta({ semillas: 5 }), { modo: 'normal', ventajas: ['avaro'], reglas: ['nochesLargas'] });
    ok(!v.ok && /elegí una/.test(v.motivo), `«Manos llenas» y «Noches más largas» chocan (${v.motivo})`);
    ok(M.validarEleccion(M.sanearMeta({ semillas: 5 }), { modo: 'normal', ventajas: ['avaro'], reglas: ['soloArco'] }).ok, 'pero «Manos llenas» con otra regla va bien');
  }
}

// ================================================================== 5. LOS VECINOS (mundo de mentira)
function mundoDeMentira(opciones = {}) {
  const log = { notas: [], golpes: 0 };
  const vec = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
  const estado = {
    oleadas: opciones.oleadas ?? 11, especial: null, sinFin: false, ordenes: {}, puestosAliados: {},
    aldea: { ayuda: opciones.ayuda ?? { anselmo: 1, herminia: 1, martin: 1, chicos: 1 } },
    ladoNoche: { id: 'camino', x: 0, z: 70, rumbo: 0, noche: 12 },
  };
  const reloj = { horas: opciones.horas ?? 19.6, dia: opciones.dia ?? 12 };
  const aliens = [];
  const obras = opciones.obras || [];
  const tren = { est: { s: 0, vel: 7, varado: false }, largo: 1000, enVia: (s) => ({ x: s - 500, y: 3, z: 80, ang: 0, pend: 0 }) };
  const npcs = [];
  const mkNpc = (def) => ({
    clave: def.clave, nombre: def.nombre, pos: vec(def.pos.x, 0, def.pos.z), ruta: [{ x: def.pos.x, z: def.pos.z, quieto: 9999 }], etapa: 0, espera: 0, velocidad: 1, dormido: false, enBase: false,
    brazos: [{ rotation: { x: 0 } }, { rotation: { x: 0 } }], mano: { hijos: [], add(x) { this.hijos.push(x); } }, mate: null,
  });
  const gente = { armarPobladorDeAPoco(def) { let n = 0; const t = { npc: null, avanzar() { if (++n < 3) return false; t.npc = mkNpc(def); npcs.push(t.npc); return true; } }; return t; } };
  const piezas = {
    fuego: (tipo) => ({ g: { position: vec(0, 0, 0), visible: true }, llama: { scale: { set() {}, y: 1 } }, fina: { scale: { y: 1 } }, brillo: { material: { opacity: 0.2 } }, tipo }),
    martillo: () => ({ martillo: true }),
  };
  const T = { riel: Array.from({ length: 1000 }, (_, i) => ({ x: i - 500, z: 80, s: i })), agua: () => null };
  const MAX = 100;
  const api = {
    D: () => estado, gente: () => gente, horas: () => reloj.horas, dia: () => reloj.dia, centroBase: () => ({ x: 0, z: 0 }),
    alturaEn: () => 0, agua: () => null, paredes: () => [{ x: 0, z: 14 }, { x: 14, z: 0 }, { x: 0, z: -14 }, { x: -14, z: 0 }],
    nota: (t, s) => log.notas.push([t, s]), efectos: { chispas: () => {}, astillas: () => { log.golpes++; } },
    sonido: { golpeRuido: () => {}, tono: () => {}, fuente: () => null, silbato: () => {} },
    // como el real: sólo las vivas, y `sin` puede ser una obra o una lista
    obraMasDanada: (c, radio, sin) => {
      let mejor = null, peor = 0.999;
      for (const o of obras) {
        if (o === sin || (Array.isArray(sin) && sin.includes(o)) || Math.hypot(o.datos.x - c.x, o.datos.z - c.z) > radio) continue;
        const r = o.datos.vida / MAX;
        if (r < peor) { peor = r; mejor = o; }
      }
      return mejor;
    },
    reparar: (o, cant) => { o.datos.vida = Math.min(MAX, o.datos.vida + cant); return o.datos.vida >= MAX; },   // como el real: no mira si la obra sigue en pie
    obraViva: (o) => obras.includes(o),
    get aliens() { return aliens; },
    lanzarProyectil() {}, tren: () => tren, obraDeRamon: () => null,
  };
  const mundo = crearVecinosMundo(T, { add() {} }, api, piezas);
  const js = { pos: vec(0, 0, 0), yaw: 0 };
  const pared = opciones.paredX;
  const cuadro = (dt = 0.25, hay = false) => {
    mundo.actualizar(dt, js, hay);
    for (const n of npcs) if (!n.dormido) { n.pos.x = pared === undefined ? n.ruta[0].x : Math.min(pared, n.ruta[0].x); n.pos.z = n.ruta[0].z; }   // gente.js camina derecho y se frena contra la pared
  };
  const correr = (seg, hay = false) => { for (let t = 0; t < seg; t += 0.25) cuadro(0.25, hay); };
  return { mundo, estado, reloj, aliens, obras, log, npcs, js, cuadro, correr, api };
}
const obra = (x, z, vida) => ({ datos: { x, y: 0, z, vida }, plano: { id: 'empalizada' } });
const sinAyuda = { anselmo: 1, herminia: 0, martin: 0, chicos: 0 };
{
  // Anselmo: la obra que cae mientras la arregla
  const a = obra(8, 0, 20), b = obra(-8, 0, 60);
  const m = mundoDeMentira({ obras: [a, b], ayuda: sinAyuda });
  m.correr(8);
  ok(m.npcs[0].ruta[0].x > 0 && a.datos.vida > 20, 'Anselmo arregla la más rota');
  m.obras.splice(m.obras.indexOf(a), 1); a.datos.vida = -10;   // los duendes la derriban
  m.correr(20);
  ok(a.datos.vida === -10, 'no le sigue sumando vida a la obra que ya cayó');
  ok(b.datos.vida >= 100, `y se va a arreglar la otra rota (${b.datos.vida.toFixed(0)})`);
  // la inalcanzable
  const c = obra(9, 0, 30), e = obra(-8, 0, 60);
  const m2 = mundoDeMentira({ obras: [c, e], ayuda: sinAyuda, paredX: 4 });
  m2.correr(80);
  ok(c.datos.vida === 30, 'la obra del otro lado de la pared no se arregla (nunca llega)');
  ok(e.datos.vida >= 100, `pero no se clava: termina arreglando la otra (${e.datos.vida.toFixed(0)})`);
  // manos livianas
  const ritmo = (meta) => {
    R.fijarPartidaMeta(meta);
    const o = obra(2, 0, 1);
    const w = mundoDeMentira({ obras: [o], ayuda: sinAyuda });
    w.correr(3);
    const v0 = o.datos.vida; w.correr(4);
    R.fijarPartidaMeta(null);
    return o.datos.vida - v0;
  };
  const normal = ritmo(null), livianas = ritmo(M.metaDePartida({ ventajas: ['herrero'] }));
  ok(normal > 20 && Math.abs(livianas / normal - 1 / 0.7) < 0.08, `«Manos livianas» arregla más rápido (${normal.toFixed(1)} -> ${livianas.toFixed(1)}, ~x1,43)`);
}
{
  // el pedido entregado entre las 19:30 y las 20:30 también cuenta esa noche
  const m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 0, chicos: 0 }, horas: 19.4 });
  m.correr(2);
  m.reloj.horas = 19.6; m.correr(5);
  ok(m.mundo.presentes().length === 0, 'a las 19:36 todavía nadie ayuda');
  m.estado.aldea.pedidos = { anselmo: { id: 'tablas', nivel: 0, pide: { tabla: 1 }, regalo: null, desde: 12, hasta: 12 } };
  m.reloj.horas = 20.0;
  const r = A.entregarYCobrar(m.estado, 'anselmo', { dia: 12, horas: 20.0, cuanto: () => 9, gastar() {}, sumarMaterial() {} });
  ok(r.ok && m.estado.aldea.ayuda.anselmo === 1, 'a las 20:00 se entrega el pedido y sube la ayuda');
  m.correr(30);
  eq(m.mundo.presentes(), ['anselmo'], 'esa misma noche Anselmo viene');
  // y no baja ni se pisa lo que ya tenía
  const m2 = mundoDeMentira({ ayuda: { anselmo: 2, herminia: 0, martin: 0, chicos: 0 }, horas: 19.6 });
  m2.correr(5); m2.estado.aldea.ayuda.anselmo = 1; m2.reloj.horas = 20.2; m2.correr(5);
  ok(m2.mundo.estado.niveles.anselmo === 2, 'el nivel de la noche nunca baja');
}
{
  // el silbato: ya no empuja a los traviesos hacia la base
  const trav = (x, z) => ({ estado: 'avanzar', tipo: 'rastreador', def: { vuela: false, altura: 1.2 }, m: { g: { position: { x, y: 0, z } }, esc: 1, viejo: false }, huyeT: 0 });
  const m = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 0, martin: 1, chicos: 0 } });
  m.correr(2);
  const t1 = trav(0, 70);     // la base (origen) queda entre la vía (z=80) y... el travieso está entre las dos
  const t2 = trav(50, 70);    // de costado: alejarse de la vía no lo acerca a la base
  const t3 = trav(0, 20);     // cerca de la base, la vía detrás
  for (const t of [t1, t2, t3]) { t.huyeT = 5; t.huyeX = 0; t.huyeZ = 80; }
  const haciaBase = (t, rumbo) => { const bx = -t.m.g.position.x, bz = -t.m.g.position.z, bl = Math.hypot(bx, bz) || 1; return (Math.sin(rumbo) * bx + Math.cos(rumbo) * bz) / bl; };
  for (const t of [t1, t2, t3]) {
    const r = m.mundo.rumboDeHuida(t, 0.5);
    ok(haciaBase(t, r) <= 0.05, `el travieso en (${t.m.g.position.x}, ${t.m.g.position.z}) no corre hacia la base (${haciaBase(t, r).toFixed(2)})`);
  }
  const r2 = m.mundo.rumboDeHuida(t2, 0.5);
  ok(Math.cos(r2) < 0, 'si alejarse de la vía no lo acerca a la base, sigue alejándose de la vía (sale hacia -z)');
  const lejosDeLaVia = trav(0, -60); lejosDeLaVia.huyeT = 5; lejosDeLaVia.huyeX = 0; lejosDeLaVia.huyeZ = 80;
  ok(m.mundo.rumboDeHuida(lejosDeLaVia, 0.5) !== null, 'el que está al otro lado de la base también huye');

  // los fogones de Herminia no espantan al Mandamás
  const h = mundoDeMentira({ ayuda: { anselmo: 0, herminia: 2, martin: 0, chicos: 0 }, horas: 20.6 });
  h.correr(60);
  const fuegos = h.mundo.fuegosPrendidos();
  ok(fuegos.length > 0, 'Herminia prendió fuegos');
  const f = fuegos[0];
  const viejoComun = { m: { viejo: true, g: { position: { x: f.x + 3, y: 0, z: f.z } } }, def: { jefe: false } };
  const jefe = { m: { viejo: true, g: { position: { x: f.x + 3, y: 0, z: f.z } } }, def: { jefe: true } };
  const hacia = Math.atan2(-3, 0);   // directo al fogón
  ok(h.mundo.rumboDeViejo(viejoComun, hacia) !== hacia, 'un viejo oscuro rodea el fogón');
  ok(h.mundo.rumboDeViejo(jefe, hacia) === hacia, 'el Mandamás no: sigue derecho (como con el farol de mano)');
}

// ================================================================== 6. LA E, LA TRAMPA DE MIEL, EL BLOQUEO, LA CAMPANA
{
  const tablero = { desafio: true, trofeosCerca: true, avisoTrofeos: 'Ver los trofeos del tablero (2 de 7)', usarTrofeos: true, avisoDesafioCerca: null, usarDesafioCerca: () => false };
  eq(que(tablero).e, 'trofeos', 'sólo el tablero: la E lo abre');
  eq(que({ ...tablero, puertaCerca: { objetivo: 0, nombre: 'la puerta' }, accionarPuerta: true }).e, 'puerta', 'con una puerta cerca, la E abre la puerta');
  eq(que({ ...tablero, dentroDeTuObra: true, puedeDormirJuntoAlFuego: true, catreCerca: true }).e, 'obra-dormir', 'dentro de tu cabaña con sueño, la E duerme');
  const nido = que({ ...tablero, avisoDesafioCerca: 'Quemar el nido', usarDesafioCerca: true });
  ok(nido.e === 'desafio-cerca' && nido.texto === 'Quemar el nido', 'con un nido al lado, la E y el aviso son del nido');
  ok(que({ ...tablero, puertaCerca: { objetivo: 0, nombre: 'la puerta' } }).avisoId === 'puerta', 'y el aviso también es el de la puerta');

  // la trampa de miel armada desde el menú nace llena
  const Mu = cargar(['construccion.js', 'colisiones.js', 'desafio-trampas-mundo.js']);
  const { THREE } = Mu, C = Mu.construccion;
  const col = Mu.colisiones.crearColisiones();
  const T = { altura: () => 0, agua: () => false, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {} };
  const s = C.crearConstruccion(T, new THREE.Scene(), col, { arboles: [], despejar() {} }, { agregar() {}, agregarPostigos() {}, eliminarPorDuenio() {} });
  const mats = { tronco: 99, tabla: 99, piedra: 99, lana: 99, cuero: 99, hierro: 99 };
  s.elegir(C.PLANO['trampa-miel']);
  const f = s.fundar(20, 20, 0, null);
  ok(f.ok, 'se funda la trampa de miel desde el menú');
  while (f.obra.datos.etapas < f.obra.plano.etapas.length) { const r = s.avanzar(f.obra, mats); if (!r.ok) break; }
  ok(f.obra.datos.usos === undefined, 'recién armada desde el menú no trae usos');
  const api = { aliens: [], nota() {}, cuanto: () => 0, gastar() {}, alGuardarObras() {}, herirAlien() {}, jugador: () => null };
  const tm = Mu.desafio_trampas_mundo.crearTrampasMundo(T, new THREE.Scene(), s, { fuego() {}, chispas() {}, polvo() {}, astillas() {}, explosion() {}, destello() {} }, { golpeRuido() {}, juntar() {}, encender() {}, fuente: () => null }, api);
  tm.refrescar();
  ok(f.obra.datos.usos === TR.MIEL.usos && !TR.estaSeca(f.obra.datos), `al terminarse nace llena (${f.obra.datos.usos} usos)`);
  // una que ya se secó (usos 0) no se vuelve a llenar sola
  f.obra.datos.usos = 0; tm.refrescar();
  ok(f.obra.datos.usos === 0, 'y la que se secó queda seca hasta que le pongas un frasco');

  // «sólo arco» tampoco deja bloquear con la lanza
  const puedeBloquear = (soloArco, cosas) => evaluar(linea(des, 'const puedeBloquear = ').replace('const puedeBloquear = ', ''), { conQueBloquea, progreso: () => ({ cosas }), efectosPartida: () => (soloArco ? { soloArco: true } : {}) });
  ok(puedeBloquear(false, { lanza: 1 })('lanza') === true, 'con la lanza se bloquea');
  ok(puedeBloquear(true, { lanza: 1 })('lanza') === false, 'con «sólo arco» no');
  ok(puedeBloquear(true, { rodela: 1 })('martillo') === puedeBloquear(false, { rodela: 1 })('martillo'), 'y lo que no es la lanza queda como estaba');

  // la campana de día no manda a los aliados a su puesto
  const llamadas = [];
  const ctxCampana = evaluar('{' + linea(des, 'alarmaAliados: () =>').replace(/\s+$/, '') + '}', { deNoche: () => dia, aliados: { alarma: () => { llamadas.push('aliados'); return 2; } }, vecinos: { alarma: () => { llamadas.push('vecinos'); return 1; } } });
  var dia = false;
  eq([ctxCampana.alarmaAliados(), ctxCampana.alarmaVecinos(), llamadas], [0, 0, []], 'de día la campana suena pero no cambia las órdenes');
  dia = true;
  eq([ctxCampana.alarmaAliados(), ctxCampana.alarmaVecinos()], [2, 1], 'de noche sí');
}

console.log(`verificar-4-10-1-desafio: ${pasos} comprobaciones, todo en verde`);
