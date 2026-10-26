// 4.4.2 (arreglo de bugs de la ronda de revisión de la 4.4.1): CONSTRUCCIÓN 4.2 y las teclas con Mayús.
// Un caso por hallazgo, y cada uno falla sin su arreglo:
//   · C1/D1/D5  Mayús es correr: ninguna orden de la E, Supr o Y depende de `shiftKey`; ampliar y el panel del local se piden manteniendo E;
//               desmontar es Supr (dos veces, con aviso); mover es M con los planos abiertos; Supr junto a un depósito saca todo (C7).
//   · C2        los galpones y locales cubren de la lluvia (cubiertasLluvia / bajoCubierta con la construcción real).
//   · C3        el desalojo al cargar devuelve los pesos pagados y las ampliaciones.
//   · C4        los pedreros picados se guardan (partidas viejas intactas).
//   · C5        la gramola no suelta las notas atrasadas juntas y es una sola global (la segunda pasa la música).
//   · C6        el herrero no tapa el afilado con la oferta del pico.
//   · C8        ningún nombre de plano repetido.
//   · C9        las piezas grandes no se fundan unas sobre otras (pero lo de adentro de una casa, sí).
//   · C10       con hacha y sin pico, H elige el árbol si la roca no se puede picar.
//   · D2        el aviso del acopio lleno no manda a un depósito que en el Desafío no existe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();

const almacenLS = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacenLS.has(k) ? almacenLS.get(k) : null),
  setItem: (k, v) => { almacenLS.set(k, String(v)); },
  removeItem: (k) => { almacenLS.delete(k); },
  key: (i) => [...almacenLS.keys()][i] ?? null,
  get length() { return almacenLS.size; },
};

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const fallas = [];
const ok = (c, m) => { n++; if (!c) fallas.push(m); };
const eq = (a, b, m) => { n++; try { assert.deepEqual(a, b); } catch { fallas.push(`${m} (${JSON.stringify(a)} ≠ ${JSON.stringify(b)})`); } };

const main = leer('src/main.js');
// el cuerpo de un `case` del manejador de teclas de main.js, hasta el siguiente `case` de su nivel
function cuerpoDeCase(texto, caso) {
  const i = texto.indexOf(`    case '${caso}':`);
  if (i < 0) return '';
  const j = texto.indexOf('\n    case \'', i + 10);
  return texto.slice(i, j < 0 ? i + 20000 : j);
}
function funcionDe(texto, nombre, hasta) {
  const i = texto.indexOf(`function ${nombre}(`);
  if (i < 0) return '';
  const j = texto.indexOf(hasta, i + 10);
  return texto.slice(i, j < 0 ? i + 8000 : j);
}

// ---------------------------------------------------------------- C1 / D1 / D5 · nada depende de Mayús (correr)
try {
  for (const caso of ['KeyE', 'Delete', 'KeyY', 'KeyM']) {
    const c = cuerpoDeCase(main, caso);
    ok(c.length > 100, `main.js tiene el caso ${caso}`);
    ok(!/shiftKey/.test(c), `el caso ${caso} no mira shiftKey (Mayús es correr)`);
  }
  ok(/armarMantenerE\(\)/.test(cuerpoDeCase(main, 'KeyE')), 'la E arma el «mantener E» (ampliar el depósito, panel del local)');
  ok(/MANTENER_E_MS\s*=\s*7\d\d/.test(main), 'se mantiene E unos 0,7 s');
  const alMantener = funcionDe(main, 'alMantenerE', '\n}\n');
  ok(/almacenJuego\.ampliar\(o\)/.test(alMantener) && /negocioJuego\.usar\(o, true\)/.test(alMantener), 'mantener E: ampliar el depósito / abrir el panel del local');
  ok(/panelDelHudAbierto\(\)/.test(alMantener) && /durmiendo/.test(alMantener) && /foto\.activo/.test(alMantener), 'mantener E no hace nada con un panel abierto, durmiendo ni en el modo foto');
  const armar = funcionDe(main, 'armarMantenerE', '\n}\n');
  ok(/panelDelHudAbierto\(\)\) return/.test(armar), 'con un panel abierto la E lo cierra y soltar no lo reabre');
  ok(/keyup[\s\S]{0,200}soltarMantenerE/.test(main), 'soltar E antes de tiempo lo cancela');
  ok(/pedirDesmontarPieza\(js\)/.test(cuerpoDeCase(main, 'Delete')) && /Supr otra vez para confirmar/.test(main), 'Supr sin marca pide confirmar el desmontaje (dos pasos)');
  const pedir = funcionDe(main, 'pedirDesmontarPieza', '\n}\n');
  ok(/DESMONTE_MIN_MS/.test(pedir) && /desmontePendiente\.obra === o/.test(pedir), 'el segundo Supr es sobre la misma pieza y no antes de 0,6 s');
  ok(/montoReintegroAlDesmontar/.test(pedir) && /recuperaDeObra/.test(pedir), 'el primer aviso dice el reintegro y los materiales');
  ok(/moverPiezaCerca\(js\)/.test(cuerpoDeCase(main, 'KeyM')) && /modoObra && obras/.test(cuerpoDeCase(main, 'KeyM')), 'M mueve la pieza con los planos abiertos');
  ok(/almacenJuego\.sacarTodo\(o\)/.test(cuerpoDeCase(main, 'Delete')), 'Supr junto a un depósito saca todo (C7)');
  ok(!/golpeDeTecla\([^)]*,\s*true\)/.test(main), 'el mando ya no manda órdenes con Mayús');

  // ningún texto del juego manda a Mayús para estas cosas (los idiomas no se miran)
  const textos = ['src/main.js', 'src/almacen-juego.js', 'src/almacen.js', 'src/planos-almacen.js', 'src/guia.js', 'src/plantilla.html', 'src/negocio-propio.js', 'src/negocio-propio-juego.js', 'src/cuaderno.js'];
  for (const f of textos) {
    const t = f === 'src/main.js' ? leer(f).replace(/^\s*\/\/.*$/mg, '').replace(/\s\/\/ .*$/mg, '') : leer(f);   // (de main.js, sólo el código: los comentarios de versiones viejas cuentan cómo era)
    const mal = t.match(/(Mayús|Shift) ?\+ ?(E|Supr|Y)\b/g);
    ok(!mal, `${f} todavía nombra ${mal ? mal.join(', ') : ''}`);
  }
  ok(/mantené E|Mantené E|mantener E|Mantener E/.test(leer('src/almacen-juego.js')), 'el aviso del depósito dice que se amplía manteniendo E');
  ok(/mantené E|Mantener E|mantener E/.test(leer('src/negocio-propio-juego.js')), 'el local dice que el panel se abre manteniendo E');
  ok(/<kbd>E<\/kbd> mantenida/.test(leer('src/plantilla.html')) && /<kbd>M<\/kbd> · <kbd>Supr<\/kbd>/.test(leer('src/plantilla.html')), 'la ayuda de teclas (Controles) trae las teclas nuevas');
  ok(/M mueve pieza/.test(leer('src/plantilla.html')) && /desmonta \(dos veces\)/.test(leer('src/plantilla.html')), 'el pie de los planos también');
  ok(/M la mueve/.test(leer('src/guia.js')), 'la guía F1 también');
} catch (e) { fallas.push("EXCEPCIÓN en «C1 / D1 / D5 · nada depende de Mayús (correr)»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- C2 · los galpones cubren de la lluvia
const { mundo, C } = await import('./ayuda-4-0-1-mundo.mjs');
try {
  const techados = ['herreria-propia', 'carpinteria', 'panaderia-horno', 'cerveceria', 'telar-grande', 'queseria', 'tienda-campo', 'canteria', 'local-almacen', 'local-panaderia', 'deposito-piedra', 'barraca', 'cobertizo-heno', 'establo-caballo'];
  let i = 0;
  for (const id of techados) {
    const w = mundo();
    const r = w.terminar(id, 0, 0, 0);
    ok(r.ok, `${id}: se arma (${r.motivo || ''})`);
    if (!r.ok) continue;
    const cub = w.s.cubiertasLluvia({ x: 0, z: 0 }, 10);
    ok(cub.length >= 1, `${id}: cubiertasLluvia da el techo (da ${cub.length})`);
    ok(!!w.s.bajoCubierta({ x: 0, y: 0.2, z: 0 }), `${id}: parado adentro no llueve (bajoCubierta)`);
    ok(cub.length === 0 || (cub[0].y > 1.5 && cub[0].y < C.PLANO[id].alto), `${id}: el techo está a una altura sensata`);
    i++;
  }
  // los que no tienen techo siguen sin cubrir (silo, pila, herramientero)
  for (const id of ['pila-piedra', 'herramientero']) {
    const w = mundo();
    const r = w.terminar(id, 0, 0, 0);
    if (r.ok) ok(w.s.cubiertasLluvia({ x: 0, z: 0 }, 10).length === 0, `${id}: no tiene techo y no cubre`);
  }
} catch (e) { fallas.push("EXCEPCIÓN en «C2 · los galpones cubren de la lluvia»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- C8 · nombres únicos
try {
  const nombres = new Map();
  for (const p of C.PLANOS) nombres.set(p.nombre, [...(nombres.get(p.nombre) || []), p.id]);
  const repetidos = [...nombres.entries()].filter(([, ids]) => ids.length > 1);
  ok(!repetidos.length, `nombres de plano repetidos: ${repetidos.map(([k, v]) => `${k} (${v.join(', ')})`).join(' | ')}`);
} catch (e) { fallas.push("EXCEPCIÓN en «C8 · nombres únicos»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- C9 · las piezas grandes no se funden unas con otras
try {
  const pares = [['barraca', 'deposito-piedra'], ['silo', 'barraca'], ['herreria-propia', 'canteria'], ['tienda-campo', 'local-almacen'], ['fuente-piedra', 'estatua-baqueano'], ['establo-caballo', 'cobertizo-heno'], ['canteria', 'silo']];
  for (const [a, b] of pares) {
    const w = mundo();
    const r1 = w.terminar(a, 0, 0, 0);
    ok(r1.ok, `${a}: se arma`);
    if (!r1.ok) continue;
    w.s.elegir(C.PLANO[b]);
    for (const dx of [0, 0.5, 1.0]) {
      const r = w.s.revisarSitio(dx, 0, C.PLANO[b], 0);
      ok(!r.ok && /superpone/i.test(r.motivo || ''), `${b} sobre ${a} (dx ${dx}) se rechaza (${r.ok ? 'OK' : r.motivo})`);
    }
    const lejos = w.s.revisarSitio(14, 0, C.PLANO[b], 0);
    ok(lejos.ok, `${b} lejos de ${a} se puede (${lejos.motivo || ''})`);
  }
  // lo de adentro de una casa y los muebles siguen igual: no es de las piezas grandes
  const w = mundo();
  const r1 = w.terminar('vitrina-roble', 0, 0, 0);
  if (r1.ok) { w.s.elegir(C.PLANO['armario-tallado']); ok(w.s.revisarSitio(3, 0, C.PLANO['armario-tallado'], 0).ok, 'los muebles no cambian'); }
  // y las propiedades están sólo en lo grande
  ok(['barraca', 'silo', 'herreria-propia', 'local-almacen', 'fuente-piedra'].every((id) => C.PLANO[id].ocupaSuelo), 'lo grande de la 4.2 declara que ocupa suelo');
  ok(!['vitrina-roble', 'armario-tallado', 'mesa-banquete', 'cama-dosel', 'gramola'].some((id) => C.PLANO[id].ocupaSuelo), 'lo de adentro de la casa no');
} catch (e) { fallas.push("EXCEPCIÓN en «C9 · las piezas grandes no se funden unas con otras»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- piezaADesmontar / reintegro previo = reintegro real
try {
  const O = await import('../src/obra-pesos.js');
  const { economiaNueva, pesosDe } = await import('../src/economia.js');
  await import('../src/construccion.js');   // (registra los precios en obra-pesos)
  const w = mundo();
  const r = w.terminar('barraca', 0, 0, 0);
  ok(r.ok, 'barraca para desmontar');
  const o = w.s.piezaADesmontar({ x: 1, y: 0, z: 0 }, 5);
  ok(o && o === r.o, 'piezaADesmontar da la pieza que desmontarCerca va a sacar');
  const antes = w.s.obras.length;
  ok(w.s.obras.length === antes && w.s.piezaADesmontar({ x: 1, y: 0, z: 0 }, 5) === r.o, 'preguntar no desmonta nada');
  const p = { modo: 'relax', dia: 3, economia: { ...economiaNueva(), pesos: 50000 } };
  const previo = O.montoReintegroAlDesmontar('barraca', 3, 3);
  const cobrado = O.reintegroAlDesmontar(p, 'barraca', 3, 3);
  ok(previo > 0 && previo === cobrado && pesosDe(p) === 50000 + cobrado, `el aviso previo (${previo}) es lo que después se devuelve (${cobrado})`);
  eq(O.montoReintegroAlDesmontar('barraca', 0, 0), 0, 'sin etapas pagadas no hay reintegro');
  eq(O.montoReintegroAlDesmontar('no-existe', 3, 3), 0, 'plano desconocido: cero');
  const w2 = mundo();
  w2.terminar('barraca', 0, 0, 0);
  const lejos = w2.s.piezaADesmontar({ x: 40, y: 0, z: 40 }, 5);
  ok(lejos === null, 'lejos no hay nada que desmontar');
} catch (e) { fallas.push("EXCEPCIÓN en «piezaADesmontar / reintegro previo = reintegro real»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- C7 · Supr saca todo, aunque lleves lo mismo
const { crearAlmacenJuego } = await import('../src/almacen-juego.js');
const ALM = await import('../src/almacen.js');
try {
  const mats = { tronco: 5, tabla: 7, piedra: 3, lana: 0 }, entradas = { haba: 40, papa: 30, 'frutilla-huerta': 0, calafate: 2 };
  const notas = [];
  const progreso = { modo: 'relax', dia: 3 };
  const obra = (id) => ({ plano: { id, etapas: [{}] }, datos: { plano: id, etapas: 1, x: 0, z: 0, almacen: null } });
  const d = {
    obras: () => ({ obrasCerca: () => [], editando: null }), jugador: () => ({ estado: { pos: { x: 0, z: 0 } } }), progreso: () => progreso,
    material: (k) => mats[k] || 0, cuantoHay: (k) => entradas[k] || 0,
    sumarMaterial: (k, c) => { mats[k] = (mats[k] || 0) + c; }, sumarEntrada: (k, c) => { entradas[k] = (entradas[k] || 0) + c; },
    nota: (t, s) => notas.push([t, s]), sonido: () => null, refrescarBarra() {}, guardar() {}, conMateriales() {}, materialesVisibles: () => mats,
  };
  const A = crearAlmacenJuego(d);
  const silo = obra('silo');
  // el silo lleno de habas (60/60) y vos con más habas, papas y calafates a mano
  const E = ALM.ALMACENES.silo;
  const est = A.estado(silo);
  ALM.guardar('silo', est, 'haba', 9999);
  const guardadas = ALM.guardadoDe(est, 'haba');
  ok(guardadas >= 40, `el silo tiene habas guardadas (${guardadas})`);
  // con E y la mochila llena de lo que guarda: no saca nada (guardar o «lleno»): es el problema que arregla Supr
  A.usar(silo);
  ok(ALM.guardadoDe(est, 'haba') === guardadas && entradas.haba === 40, 'E con habas a mano no saca (depositar o «lleno»)');
  const antesHabas = entradas.haba;
  ok(typeof A.sacarTodo === 'function', 'almacenJuego.sacarTodo existe');
  A.sacarTodo(silo);
  ok(ALM.guardadoDe(est, 'haba') === 0, 'Supr: saca todas las habas guardadas');
  ok(entradas.haba >= antesHabas + guardadas - 1 || entradas.haba >= guardadas, `y las pone a mano (${antesHabas} → ${entradas.haba})`);
  const barraca = obra('barraca');
  const eb = A.estado(barraca);
  ALM.guardar('barraca', eb, 'tabla', 30);
  const tablas = mats.tabla;
  A.sacarTodo(barraca);
  ok(ALM.guardadoDe(eb, 'tabla') === 0 && mats.tabla > tablas, 'en la barraca también, lleves lo que lleves');
  A.sacarTodo(barraca);
  ok(/vacía|vacío/.test(notas[notas.length - 1][0]), 'sin nada guardado avisa que está vacío y no hace nada raro');
  // el reintegro previo de ampliaciones coincide con el real
  const vieja = obra('barraca'); vieja.datos.almacen = { n: 0, g: {} };
  eq(A.reintegroPrevio(vieja.datos), 0, 'sin ampliaciones no hay reintegro previo');
  // C3: la devolución total (desalojo)
  const amp = obra('barraca'); amp.datos.almacen = { n: 2, g: {} };
  const t = A.devolucionTotal(amp.datos);
  const pideEsperado = {};
  for (let i = 0; i < 2; i++) for (const [k, c] of Object.entries(ALM.ALMACENES.barraca.ampliaciones[i].pide)) pideEsperado[k] = (pideEsperado[k] || 0) + c;
  eq(t.materiales, pideEsperado, 'el desalojo devuelve los materiales de las ampliaciones enteros');
  eq(A.devolucionTotal({ plano: 'cama' }), { pesos: 0, materiales: {} }, 'lo que no es depósito no devuelve nada de ampliaciones');
} catch (e) { fallas.push("EXCEPCIÓN en «C7 · Supr saca todo, aunque lleves lo mismo»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- C3 · el desalojo cuenta los pesos devueltos
try {
  const { textoDesalojo } = await import('../src/aldea-desalojo.js');
  const sin = textoDesalojo({ obras: { mudadas: 0, desarmadas: 1 }, renovales: { mudados: 0, devueltos: 0 }, carpa: null, materiales: { tronco: 10 } });
  const con = textoDesalojo({ obras: { mudadas: 0, desarmadas: 1 }, renovales: { mudados: 0, devueltos: 0 }, carpa: null, materiales: { tronco: 10 }, pesos: 39000 });
  ok(sin && !/devolvimos/.test(sin.sub), 'sin pesos pagados no habla de plata');
  ok(con && /devolvimos \$39\.000/.test(con.sub), `con pesos pagados lo dice (${con?.sub})`);
  const desalojo = funcionDe(main, 'desalojarObras', '\nfunction desalojarCarpa');
  ok(/devolverEtapasPagadas\(progreso, d\.plano/.test(desalojo) && /almacenJuego\.devolucionTotal\(d\)/.test(desalojo), 'main.js: al desarmar por falta de lugar vuelven los pesos pagados y las ampliaciones');
} catch (e) { fallas.push("EXCEPCIÓN en «C3 · el desalojo cuenta los pesos devueltos»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- C4 · los pedreros picados se recuerdan
try {
  const B = await import('../src/bosque.js');
  const G = await import('../src/guardado.js');
  eq(B.sanearPicados(undefined), [], 'partida vieja (sin el campo): vacío');
  eq(B.sanearPicados('basura'), [], 'basura: vacío');
  eq(B.sanearPicados([1.04, 2.06, 1.04, 2.06, NaN, 3, 'a', 'b', 4, Infinity, 9999999, 1, 5.5, -6.25]), [1, 2.1, 5.5, -6.2], 'redondea a un decimal, sin repetidos ni valores rotos');
  const lista = [];
  B.anotarPicadoEn(lista, 10.04, -3.26); B.anotarPicadoEn(lista, 10.04, -3.26); B.anotarPicadoEn(lista, 1, 1);
  eq(lista, [10, -3.3, 1, 1], 'anotar no repite');
  for (let i = 0; i < B.PICADOS_MAX + 50; i++) B.anotarPicadoEn(lista, i * 3, i * 5 % 997);
  ok(lista.length <= B.PICADOS_MAX * 2, `tiene tope (${lista.length / 2})`);
  ok(B.sanearPicados(lista).length === lista.length, 'lo que se anota se vuelve a leer igual');
  // por el guardado: ida y vuelta; y la partida vieja sin el campo carga con la lista vacía
  G.usarModoGuardado('relax', 1);
  const nueva = G.progresoNuevo();
  ok(Array.isArray(nueva.picados) && nueva.picados.length === 0, 'la partida nueva arranca con picados: []');
  nueva.picados = [12.5, -40, 3, 4];
  ok(G.escribirPartida('relax', 1, nueva), 'se escribe');
  eq(G.cargarProgreso().picados, [12.5, -40, 3, 4], 'los picados sobreviven a guardar y cargar');
  const vieja = G.progresoNuevo(); delete vieja.picados;
  G.escribirPartida('relax', 1, vieja);
  eq(G.cargarProgreso().picados, [], 'una partida vieja (sin el campo) queda intacta, con la lista vacía');
  const rota = G.progresoNuevo(); rota.picados = { a: 1 };
  G.escribirPartida('relax', 1, rota);
  eq(G.cargarProgreso().picados, [], 'un campo roto no tira la carga');
  // main.js: se anota al picar y se repone al cargar
  ok(/anotarPicadoEn\(picados\(\), o\.mata\.x, o\.mata\.z\)/.test(main), 'main.js anota la roca picada');
  ok(/sanearPicados\(progreso\.picados\)[\s\S]{0,200}veg\.despejar\(lp\[k\], lp\[k \+ 1\]/.test(main), 'main.js vuelve a sacar las rocas picadas al cargar');
} catch (e) { fallas.push("EXCEPCIÓN en «C4 · los pedreros picados se recuerdan»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- C5 · la gramola
try {
  let now = 10;
  const osc = [];
  const nodo = () => ({ connect() {}, disconnect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {}, value: 1 }, frequency: { value: 0 }, start(t) { osc.push(t); }, stop() {}, type: '', Q: { value: 0 } });
  const ctx = { get currentTime() { return now; }, state: 'running', sampleRate: 8000, createGain: nodo, createOscillator: nodo, createBiquadFilter: nodo, createBufferSource: nodo, createBuffer: () => ({ getChannelData: () => new Float32Array(10) }) };
  let timers = [];
  const si = globalThis.setInterval, ci = globalThis.clearInterval;
  globalThis.setInterval = (f, ms) => { const t = { f, ms }; timers.push(t); return t; };
  globalThis.clearInterval = (t) => { timers = timers.filter((x) => x !== t); };
  const G = await import('../src/gramola.js');
  const sonido = { ctx, bus: { efectos: nodo(), musica: nodo() }, bajaMusica: nodo() };
  const obraA = { id: 'A' }, obraB = { id: 'B' };
  const r = G.alternarGramola(sonido, () => true, obraA);
  ok(r.suena && !r.cambio, 'la gramola A arranca');
  for (let i = 0; i < 20; i++) { now += 0.5; timers[0].f(); }
  const antes = osc.length;
  now += 40; const t0 = now; timers[0].f();
  const juntas = osc.filter((t, i) => i >= antes && t <= t0 + 0.01).length;
  ok(juntas <= 3, `tras un tirón de 40 s no suenan juntas las notas atrasadas (suenan ${juntas})`);
  G.detenerGramola(); timers = [];
  G.alternarGramola(sonido, () => true, obraA);
  // dos gramolas: el aviso sabe de cuál se trata; E en la B pasa la música a la B (y no «para» la A sin decirlo)
  ok(G.gramolaSuenaEn(obraA) && !G.gramolaSuenaEn(obraB), 'el aviso de la B no dice «Parar» mientras suena la A');
  const r2 = G.alternarGramola(sonido, () => true, obraB);
  ok(r2.suena === true && r2.cambio === true, 'E en la B la pone a sonar y avisa que la otra se calló');
  ok(G.gramolaSuenaEn(obraB) && !G.gramolaSuenaEn(obraA), 'ahora suena la B');
  ok(timers.length === 1, `un solo temporizador (${timers.length})`);
  const r3 = G.alternarGramola(sonido, () => true, obraB);
  ok(r3.suena === false, 'E otra vez en la que suena la para');
  G.detenerGramola();
  globalThis.setInterval = si; globalThis.clearInterval = ci;
  ok(/gramolaSuenaEn\(o\)/.test(main) && /alternarGramola\([^\n]*, o\);/.test(main), 'main.js le pasa la obra a la gramola');
} catch (e) { fallas.push("EXCEPCIÓN en «C5 · la gramola»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- C6 · el herrero no tapa el afilado con la oferta del pico
try {
  const A = await import('../src/aldea.js');
  const { economiaNueva } = await import('../src/economia.js');
  const S = A.SERVICIO, dia = 10;
  const partida = () => {
    const p = { modo: 'relax', dia, horas: 10, materiales: {}, entradas: { canto: { dia: 1, hora: 9, cantidad: S.cantosPico + 2 } }, cosas: { hacha: 1, tijera: 1 }, economia: { ...economiaNueva(), pesos: S.pesosPico + 500 }, aldea: A.aldeaNueva() };
    p.aldea.pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => ({ clave: k, dia: 1 }));
    p.aldea.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
    return p;
  };
  const p = partida();
  let s = A.servicioBase('herrero', p, dia);
  ok(s.efectos?.some((f) => f.campo === 'afilado') && !s.efectos?.some((f) => f.k === 'pico'), 'con cantos y plata para el pico, la primera charla ofrece el afilado (no queda tapado)');
  ok(s.partes.some((l) => /pico/.test(l) && /hablame de nuevo/.test(l)), `y avisa que el pico se ofrece después (${s.partes.join(' / ')})`);
  A.aplicarEfectos(p, s.efectos, dia);
  s = A.servicioBase('herrero', p, dia);
  ok(s.efectos?.some((f) => f.tipo === 'cosa' && f.k === 'pico'), 'ya afilado, la charla siguiente ofrece el pico');
  // el que rechaza el pico no pierde nada: al otro día, vuelve a tener el afilado
  const p2 = partida(); p2.aldea.afilado = S.filo;
  s = A.servicioBase('herrero', p2, dia);
  ok(s.efectos?.some((f) => f.k === 'pico'), 'con el filo vigente el pico se ofrece directo');
  const p3 = partida(); p3.cosas.tijera = 0; p3.entradas.canto.cantidad = S.cantosTijera + S.cantosPico;
  s = A.servicioBase('herrero', p3, dia);
  ok(s.efectos?.some((f) => f.k === 'tijera'), 'la tijera tampoco queda tapada por el pico');
} catch (e) { fallas.push("EXCEPCIÓN en «C6 · el herrero no tapa el afilado con la oferta del pico»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- C10 · con hacha y sin pico, el árbol le gana a la roca
try {
  const i = main.indexOf('function objetivoHacha()');
  const j = main.indexOf('function textoHacha', i);
  ok(i > 0 && j > i, 'objetivoHacha está en main.js');
  const codigo = main.slice(i, j);
  const armar = (hacha, pico, mata, arboles) => {
    const f = new vm.Script(`(function (tieneHacha, tienePico, jugador, veg, scratchMatasHacha, scratchArbolesHacha, golpesPico, golpesTala) { ${codigo}; return objetivoHacha(); })`).runInThisContext();
    return f(() => hacha, () => pico, { estado: { pos: { x: 0, z: 0 } } }, { matasCerca: () => mata, arbolesCerca: () => arboles, matas: mata, arboles }, [], [], new WeakMap(), new WeakMap());
  };
  const roca = { tipo: 'roca', x: 1.5, z: 0 }, arbol = { x: 1.0, z: 1.0, r: 0.4, especie: 'coihue' };
  let o = armar(true, false, [roca], [arbol]);
  ok(o && o.tipo === 'tronco' && o.talar, `hacha sin pico, roca a 1,5 m y árbol a 1,4 m: H elige el árbol (${o?.tipo})`);
  o = armar(true, false, [roca], []);
  ok(o && o.tipo === 'piedra' && o.sinPico, 'sin árbol, la roca sigue diciendo que falta el pico');
  o = armar(true, true, [roca], [arbol]);
  ok(o && o.tipo === 'piedra' && !o.sinPico, 'con pico, la roca cercana manda como siempre');
  o = armar(false, true, [roca], [arbol]);
  ok(o && o.tipo === 'piedra', 'sólo pico: la roca');
  o = armar(false, false, [roca], [arbol]);
  ok(o === null, 'sin nada en la mano: nada');
} catch (e) { fallas.push("EXCEPCIÓN en «C10 · con hacha y sin pico, el árbol le gana a la roca»: " + (e && e.message || e)); n++; }

// ---------------------------------------------------------------- D2 · el acopio lleno no manda a un depósito que en el Desafío no existe
try {
  const f = funcionDe(main, 'usarAcopio', '\n}\n');
  ok(/El acopio está lleno', desafio \?/.test(f), 'el aviso cambia en el Desafío');
  const dentro = f.match(/desafio \? `([^`]*)`/);
  ok(dentro && !/dep[óo]sito/i.test(dentro[1]), 'y en el Desafío no habla de depósitos');
} catch (e) { fallas.push("EXCEPCIÓN en «D2 · el acopio lleno no manda a un depósito que en el Desafí»: " + (e && e.message || e)); n++; }

if (fallas.length) { console.error(`FALLARON ${fallas.length} de ${n}:\n - ${fallas.join('\n - ')}`); process.exit(1); }
console.log(`verificar-4-4-2-construccion: ${n} comprobaciones OK`);
