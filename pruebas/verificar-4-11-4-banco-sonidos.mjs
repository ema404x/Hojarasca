// 4.11.4: el banco de sonidos. EJECUTA el catálogo contra el motor real (sonido.js, el banco del Desafío, las tandas nuevas, la gramola, la radio)
// con el AudioContext de mentira (pruebas/ayuda-audio-falso.mjs) y lee el grafo de audio: nada de esto se oye, se mide por dónde sale cada sonido.
//   · el catálogo: ids y nombres sin repetir, grupos y buses válidos, variantes con defecto, y todo lo viejo y lo nuevo que hay que oír;
//   · cada entrada llama a las funciones del motor que dice (y esas funciones existen), crea fuentes de audio y las manda por el bus que dice;
//   · los bucles del ambiente (viento, lluvia, arroyo, fuego…) se fuerzan y se apagan con el mundo real de `actualizar`;
//   · «Detener todo» corta lo que suena (fuentes, gramola, radio, bucles, silencios) y la salida vuelve a su volumen;
//   · abrir y cerrar dejan el motor como estaba (el flag del Relax, `actualizar`, el contexto);
//   · no toca la partida: ni guarda, ni lee el progreso, ni toca el almacenamiento;
//   · los sonidos «en línea» siguen escritos igual en el juego; la pantalla (lista, teclas, variantes) con un DOM mínimo.
import fs from 'node:fs';
import { FakeCtx, nodos } from './ayuda-audio-falso.mjs';

globalThis.window = globalThis;
globalThis.addEventListener = () => {};
// el almacenamiento del navegador es una trampa: si el banco lo toca, se nota
const toques = [];
const trampa = new Proxy({}, { get: (_t, k) => { toques.push(String(k)); return () => null; }, set: (_t, k) => { toques.push('set ' + String(k)); return true; } });
globalThis.localStorage = trampa; globalThis.sessionStorage = trampa;
const ctx = new FakeCtx();
globalThis.AudioContext = function () { return ctx; };
const { Sonido } = await import('../src/sonido.js');
const B = await import('../src/banco-sonidos.js');
const { crearPanelBancoSonidos } = await import('../src/banco-sonidos-panel.js');
const { alternarGramola, detenerGramola, temaDeGramola, gramolaSuena, TEMAS } = await import('../src/gramola.js');

let fallas = 0, hechas = 0;
const ok = (c, t) => { hechas++; if (c) return; fallas++; console.log('✗ ' + t); };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const cerca = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

const s = new Sonido();
s.relax = true;          // como en el Relax: los sonidos del Desafío no suenan, y el banco los tiene que dejar sonar
s.iniciar();
const R0 = B.armarMotor(s);
// espías: se anota cada función que el catálogo llama de las piezas reales
const llamadas = [];
const espia = (nombre, obj) => new Proxy(obj, {
  get(t, k) {
    const v = Reflect.get(t, k, t);
    if (typeof v === 'function' && typeof k === 'string') return (...a) => { llamadas.push(nombre + '.' + k); return v.apply(t, a); };
    return v;
  },
});
const R = { ...R0, sonido: espia('sonido', s), banco: espia('banco', R0.banco), aro: espia('aro', R0.aro), brasas: espia('brasas', R0.brasas), campana: espia('campana', R0.campana), gramola: espia('gramola', R0.gramola), radio: espia('radio', R0.radio) };
const ban = B.crearBancoSonidos(R);
const CAT = ban.catalogo;

// ---------------------------------------------------------------- el catálogo
{
  const ids = CAT.map((e) => e.id);
  ok(new Set(ids).size === ids.length, `ids repetidos: ${ids.filter((x, i) => ids.indexOf(x) !== i).join(', ')}`);
  const nombres = CAT.map((e) => e.nombre);
  ok(new Set(nombres).size === nombres.length, `nombres repetidos: ${nombres.filter((x, i) => nombres.indexOf(x) !== i).join(', ')}`);
  ok(CAT.length >= 140, `el catálogo tiene ${CAT.length} sonidos (se esperan al menos 140)`);
  const grupos = B.GRUPOS.map((g) => g.id);
  ok(new Set(grupos).size === grupos.length, 'grupos repetidos');
  for (const g of grupos) ok(CAT.some((e) => e.grupo === g), `el grupo ${g} no tiene ningún sonido`);
  for (const e of CAT) {
    ok(/^[a-z0-9-]+$/.test(e.id), `id raro: ${e.id}`);
    ok(grupos.includes(e.grupo), `${e.id}: grupo desconocido ${e.grupo}`);
    ok(['ambiente', 'efectos', 'musica'].includes(e.bus), `${e.id}: bus desconocido ${e.bus}`);
    ok(typeof e.tocar === 'function', `${e.id}: sin tocar`);
    ok(e.nombre && e.nombre.length > 3 && e.como && e.como.length > 3, `${e.id}: sin nombre o sin «cómo se dispara»`);
    ok(Array.isArray(e.llama) && e.llama.length > 0, `${e.id}: no dice qué función llama`);
    ok([1, 2, 3].includes(e.prioridad) && (e.prioridad === 3 || /^\d+\.\d+\.\d+$/.test(e.nuevo || '')), `${e.id}: prioridad ${e.prioridad} sin versión (${e.nuevo})`);
    if (e.variantes) {
      const idsV = e.variantes.opciones.map((o) => o.id);
      ok(idsV.length >= 2 && new Set(idsV).size === idsV.length, `${e.id}: variantes repetidas o una sola`);
      ok(idsV.includes(e.variantes.defecto), `${e.id}: la variante por defecto no está entre las opciones`);
      ok(e.variantes.opciones.every((o) => o.nombre && o.nombre.length > 0), `${e.id}: variante sin nombre`);
    }
  }
  // lo que el usuario nunca escuchó, todo adentro
  const hay = (id) => ok(CAT.some((e) => e.id === id), `falta ${id}`);
  for (const id of ['coihue-camina', 'aro-brota', 'aro-crujir', 'aro-sale', 'aro-cierra', 'campana-tanido', 'martillo-anselmo', 'piedra-chicos', 'brasas-abanico', 'brasas-cargar', 'brasas-miel',
    'rama-cruje', 'tero-grita', 'vaca-muge', 'salen', 'silencio-raro', 'gramola', 'radio-tango', 'radio-morse', 'ave-zorzal', 'musica-guitarra', 'musica-quena', 'viento', 'lluvia', 'arroyo', 'ui-logro']) hay(id);
  ok(CAT.filter((e) => e.prioridad === 1).length >= 15, 'los sonidos nuevos desde la 4.8.0 tienen que estar marcados');
  // los dos buses pedidos están: los pájaros por El bosque, la gramola por Música
  ok(CAT.filter((e) => e.grupo === 'pajaros' && e.id.startsWith('ave-') && e.id !== 'ave-murcielago').every((e) => e.bus === 'ambiente'), 'los pájaros salen por El bosque');
  ok(CAT.find((e) => e.id === 'gramola').bus === 'musica', 'la gramola sale por Música');
  ok(B.DISTANCIAS.length === 3 && B.LADOS.length === 4 && B.FUERZAS.length === 3, 'hay distancias, lados y fuerzas para elegir');
  ok(B.DISTANCIAS.map((d) => d.metros).join() === '6,25,60' && B.LADOS.map((l) => l.grados).join() === '0,90,180,270', 'las distancias son 6, 25 y 60 m y los lados giran de a 90 grados');
}

// ---------------------------------------------------------------- las funciones reales
const resolver = (raiz, ruta) => ruta.split('.').reduce((o, k) => (o == null ? o : o[k]), raiz);
for (const e of CAT) for (const ruta of e.llama) ok(typeof resolver(R0, ruta) === 'function', `${e.id}: «${ruta}» no existe en el motor`);

// ---------------------------------------------------------------- tocar cada uno
const esFuente = (n) => n.tipo === 'bufsrc' || n.tipo === 'osc';
function llega(origen, meta, vistos = new Set()) {
  if (origen === meta) return true;
  if (vistos.has(origen)) return false;
  vistos.add(origen);
  for (const d of origen.sal) if (llega(d, meta, vistos)) return true;
  return false;
}
const busesDe = (b) => ({ ambiente: [s.bus.ambiente, s.bus.techo], efectos: [s.bus.efectos], musica: [s.bus.musica, s.bus.piano] })[b];
const TODOS = ['ambiente', 'efectos', 'musica'];
// un mundo de mentira para `actualizar`
const mundo = () => ({ cam: { x: 0, y: 1.7, z: 0 }, adelante: { x: 0, y: 0, z: -1 }, viento: 0.1, bosque: 0.5, arroyo: 0, orilla: 0, lluvia: 0, noche: 0, invierno: 0, otono: 0, fuego: null, bajoTecho: false, espacio: 'bosque', techo: null, panal: null, cascada: null, cercaMallin: false, puntoCercano: () => ({ x: 20, y: 1, z: 20 }) });
s.oyente = { x: 0, y: 1.7, z: 0 };
const final = (p) => { const e = p.eventos.filter((x) => x[0] === 'set' || x[0] === 'tgt' || x[0] === 'lin').at(-1); return e ? e[1] : p.value; };
const BUCLES = { viento: ['gViento', 'gHojas'], lluvia: ['gLluvia', 'gLluviaGrave'], arroyo: ['gArroyo', 'gArroyoMedio'], orilla: ['gOrilla'], cascada: ['gCascada'], fuego: ['gFuego', 'gFuegoMedio'], panal: ['gPanal', 'gPanalTono'], grillos: ['gGrillos'], 'techo-lluvia': ['gTechoCama'] };

ban.abrir();
await ban.drenar(60000);   // lo que nace al terminar la cola de arranque (los bucles del ambiente) no es del banco
const MAL_BUS = [], SIN_FUENTE = [], SIN_LLAMAR = [];
for (const e of CAT) {
  llamadas.length = 0;
  const n0 = nodos.length;
  let r;
  try { r = await ban.tocar(e.id, { distancia: 'media', lado: 'derecha' }); } catch (err) { ok(false, `${e.id}: tiró ${err.message}`); continue; }
  ok(r.ok, `${e.id}: no sonó (${r.motivo})`);
  ok(r.bus === e.bus && r.busNombre === B.NOMBRE_BUS[e.bus], `${e.id}: el resultado no dice por qué bus sale`);
  const u = ban.estado().ultimo;
  ok(u && u.id === e.id && u.busNombre === B.NOMBRE_BUS[e.bus], `${e.id}: el estado no dice qué suena ni por qué bus`);
  // las fuentes que el banco anotó como suyas son justo las que nacieron de este sonido (para poder cortarlas)
  if (!e.bucle && !e.sinFuentes) {
    const creadas = nodos.slice(n0).filter(esFuente).length;
    ok(u.creadas === creadas && u.fuentes.length === creadas && u.fuentes.every((f) => nodos.indexOf(f) >= n0), `${e.id}: el banco anotó ${u.creadas} fuentes y nacieron ${creadas}`);
  }
  const llamadasPropias = e.bucle ? [] : e.llama;
  for (const ruta of llamadasPropias) if (!llamadas.includes(ruta)) SIN_LLAMAR.push(`${e.id} no llamó a ${ruta} (llamó a: ${[...new Set(llamadas)].join(', ')})`);
  if (e.bucle) {
    ok(ban.estado().bucles.includes(e.id), `${e.id}: el bucle no quedó prendido`);
  } else {
    const fuentes = nodos.slice(n0).filter(esFuente);
    if (!e.sinFuentes) { if (!fuentes.length) SIN_FUENTE.push(e.id); }
    for (const f of fuentes) {
      const propios = busesDe(e.bus);
      if (!propios.some((b) => llega(f, b))) MAL_BUS.push(`${e.id}: una fuente no llega al bus ${e.bus}`);
      for (const otro of TODOS.filter((x) => x !== e.bus)) if (busesDe(otro).some((b) => llega(f, b))) MAL_BUS.push(`${e.id}: una fuente llega también al bus ${otro}`);
      if (!llega(f, s.master)) MAL_BUS.push(`${e.id}: una fuente no llega a la salida`);
    }
  }
  ban.detenerTodo();
  ctx.avanzar(1);
}
ok(!SIN_LLAMAR.length, 'entradas que no llaman a lo que dicen: ' + SIN_LLAMAR.join(' | '));
ok(!SIN_FUENTE.length, 'entradas que no crearon ninguna fuente de audio: ' + SIN_FUENTE.join(', '));
ok(!MAL_BUS.length, 'buses: ' + MAL_BUS.slice(0, 8).join(' | '));

// cada variante de cada entrada también suena (las que cambian la llamada)
{
  const malas = [];
  for (const e of CAT.filter((x) => x.variantes && !x.bucle)) {
    for (const o of e.variantes.opciones) {
      const n0 = nodos.length;
      const r = await ban.tocar(e.id, { variante: o.id, distancia: 'lejos', lado: 'atras', fuerza: 'fuerte' });
      if (!r.ok) malas.push(`${e.id}/${o.id}: ${r.motivo}`);
      else if (!e.sinFuentes && !nodos.slice(n0).some(esFuente)) malas.push(`${e.id}/${o.id}: sin fuentes`);
      ban.detenerTodo(); ctx.avanzar(1);
    }
  }
  ok(!malas.length, 'variantes que no suenan: ' + malas.join(' | '));
}

// ---------------------------------------------------------------- los bucles del ambiente
{
  const malos = [];
  for (const e of CAT.filter((x) => x.bucle)) {
    const nombres = BUCLES[e.id];
    if (!nombres) { malos.push(`${e.id}: la prueba no conoce sus perillas`); continue; }
    // sin forzar: apagados
    for (let i = 0; i < 4; i++) { ctx.avanzar(0.25); s.actualizar(0.25, mundo()); }
    const antes = nombres.map((n) => final(s[n].gain));
    await ban.tocar(e.id, {});
    for (let i = 0; i < 4; i++) { ctx.avanzar(0.25); s.actualizar(0.25, mundo()); }
    const durante = nombres.map((n) => final(s[n].gain));
    if (!durante.some((v, i) => v > antes[i] + 0.004)) malos.push(`${e.id}: forzado no sube ninguna perilla (${antes.map((v) => v.toFixed(3))} → ${durante.map((v) => v.toFixed(3))})`);
    // Enter otra vez lo apaga
    const r2 = await ban.tocar(e.id, {});
    ok(r2.encendido === false && !ban.estado().bucles.includes(e.id), `${e.id}: el segundo Enter no lo apaga`);
    for (let i = 0; i < 4; i++) { ctx.avanzar(0.25); s.actualizar(0.25, mundo()); }
    const despues = nombres.map((n) => final(s[n].gain));
    if (!despues.every((v, i) => v <= antes[i] + 0.004)) malos.push(`${e.id}: apagado no vuelve a su valor (${despues.map((v) => v.toFixed(3))})`);
    ban.detenerTodo();
  }
  ok(!malos.length, 'bucles: ' + malos.join(' | '));
  // «Detener todo» también apaga los bucles prendidos
  await ban.tocar('lluvia', {}); await ban.tocar('arroyo', {});
  ok(ban.estado().bucles.length === 2 && ban.estado().sonando, 'dos bucles prendidos suman «sonando»');
  ban.detenerTodo();
  ok(ban.estado().bucles.length === 0 && !ban.estado().sonando, '«Detener todo» apaga los bucles');
}

// ---------------------------------------------------------------- «Detener todo»
{
  const fuentesDe = (n0) => nodos.slice(n0).filter(esFuente);
  const cortan = async (id, o = {}) => {
    ban.detenerTodo(); ctx.avanzar(1);
    const n0 = nodos.length, t0 = ctx.currentTime;
    await ban.tocar(id, o);
    const vivas = fuentesDe(n0).filter((f) => !f.terminado && f.finEstimado() > t0 + 0.5);
    const antes = ban.estado();
    ban.detenerTodo();
    const t1 = ctx.currentTime;
    const sigue = fuentesDe(n0).filter((f) => f.finEstimado() > t1 + 0.1);
    return { vivas: vivas.length, sigue: sigue.length, antes, despues: ban.estado() };
  };
  for (const [id, o] of [['arbol-cae', { variante: '2.5' }], ['asedio-derrumbe', {}], ['campana-tanido', {}], ['musica-frase', {}], ['aro-cierra', {}], ['silbato', {}]]) {
    const r = await cortan(id, o);
    ok(r.vivas > 0, `${id}: la prueba esperaba fuentes largas`);
    ok(r.sigue === 0, `${id}: después de «Detener todo» siguen ${r.sigue} fuentes`);
    ok(!r.despues.sonando && r.despues.fuentesVivas === 0, `${id}: el estado sigue diciendo que suena`);
  }
  // la gramola
  ban.detenerTodo(); detenerGramola();
  await ban.tocar('gramola', { variante: 'polca' });
  ok(gramolaSuena() && temaDeGramola().id === 'polca' && ban.estado().gramola, 'la gramola suena con el tema elegido');
  ban.detenerTodo();
  ok(!gramolaSuena() && !ban.estado().gramola, '«Detener todo» para la gramola');
  // la radio
  const n0 = nodos.length;
  await ban.tocar('radio-tango', {});
  const salidaRadio = nodos.slice(n0).find((n) => n.tipo === 'gain' && n.sal.has(s.bus.efectos));
  ok(ban.estado().emisoras === 1 && salidaRadio && nodos.slice(n0).some((n) => n.tipo === 'bufsrc' && n.buffer?.sampleRate === 16000), 'la emisora de la radio suena por Efectos');
  ban.detenerTodo(); ctx.avanzar(1);
  ok(ban.estado().emisoras === 0 && !ban.estado().sonando, '«Detener todo» apaga la radio');
  ok(nodos.slice(n0).filter((n) => n.tipo === 'bufsrc' && n.buffer?.sampleRate === 16000).every((f) => f.finEstimado() <= ctx.currentTime), 'la fuente de la radio quedó parada');
  // el silencio raro y los pájaros callados
  await ban.tocar('silencio-raro', { variante: '14' });
  ok(s.avesCalladas, 'el silencio raro calla a los pájaros');
  ban.detenerTodo();
  ok(!s.avesCalladas && !s.grillosCallados, '«Detener todo» rompe el silencio');
  await ban.tocar('pajaros-callan', {});
  ok(s.avesCalladas, 'los pájaros se callan');
  ban.detenerTodo();
  ok(!s.avesCalladas, '«Detener todo» devuelve a los pájaros');
  // lo que nace después de cortar (o al terminar la cola, como los bucles del ambiente) no es del banco: «Detener todo» no lo toca
  {
    ban.detenerTodo(); ctx.avanzar(1);
    await ban.tocar('ui-juntar', {});
    let ajena = null;
    s.preparar('prueba-cola-4114', function* () { return new Float32Array(100); }, (buf) => { ajena = ctx.createBufferSource(); ajena.buffer = buf; ajena.loop = true; ajena.start(0); }, 16000);
    await ban.tocar('ui-juntar', {});   // drena la cola con una ventana abierta: la fuente de la cola nace ahí
    ok(ajena && !ban.estado().ultimo.fuentes.includes(ajena), 'las fuentes que nacen al terminar la cola no se anotan como del banco');
    ban.detenerTodo();
    const despuesDeCortar = ctx.createBufferSource(); despuesDeCortar.start(0);
    ok(ban.estado().fuentesVivas === 0, 'lo que nace después de «Detener todo» no se anota como del banco');
    ok(ajena && !ajena.parada, 'y «Detener todo» no corta lo que no es del banco (el bucle de la cola sigue)');
    ajena?.stop(ctx.currentTime); despuesDeCortar.stop(ctx.currentTime);
    ctx.avanzar(1);
  }
  // la salida general vuelve a su volumen (fundido corto para no hacer clic)
  await ban.tocar('arbol-cae', {});
  const e0 = s.master.gain.eventos.length;
  ban.detenerTodo();
  const ev = s.master.gain.eventos.slice(e0);
  ok(ev.some((x) => x[0] === 'lin' && x[1] < 0.001) && ev.at(-1)[0] === 'tgt' && cerca(ev.at(-1)[1], s.volumen), 'la salida general se funde un instante y vuelve a su volumen');
  // el tope de risas a la vez no se queda trabado después de cortar
  for (let i = 0; i < 4; i++) await ban.tocar('duende-risa', { variante: 'chico' });
  ban.detenerTodo();
  const n1 = nodos.length;
  await ban.tocar('duende-risa', { variante: 'chico' });
  ok(nodos.slice(n1).some(esFuente), 'después de cortar, la risa vuelve a sonar (el tope de tres a la vez se reinicia)');
  ban.detenerTodo();
}

// ---------------------------------------------------------------- abrir y cerrar
{
  ban.cerrar();
  ok(s.relax === true, 'al cerrar, el Relax vuelve a estar como estaba');
  ok(!Object.hasOwn(s, 'actualizar'), 'al cerrar, `actualizar` es el del motor');
  ok(!Object.hasOwn(ctx, 'createBufferSource') && !Object.hasOwn(ctx, 'createOscillator'), 'al cerrar, el contexto de audio es el de siempre');
  ok(R0.aro.brota({ x: 3, y: 0, z: 3 }) === 0, 'con el banco cerrado, en el Relax el sonido del Desafío no suena');
  ok(!ban.abierto && !ban.estado().sonando, 'cerrado no suena nada');
  const b2 = B.crearBancoSonidos(R);
  ok(b2.abrir() && s.relax === false && Object.hasOwn(s, 'actualizar'), 'abrir deja sonar al Desafío (relax apagado) y engancha `actualizar`');
  s.risasSonando = [];
  const n0 = nodos.length;
  await b2.tocar('aro-brota', {});
  ok(nodos.slice(n0).some(esFuente), 'abierto, en el Relax, suena el sonido del Desafío');
  b2.cerrar();
  ok(s.relax === true && !Object.hasOwn(s, 'actualizar'), 'cerrar otra vez lo restaura');
  // cerrar corta lo que suena
  const b3 = B.crearBancoSonidos(R);
  b3.abrir(); await b3.tocar('lluvia', {}); await b3.tocar('arbol-cae', {});
  b3.cerrar();
  ok(!b3.estado().sonando && b3.estado().bucles.length === 0, 'cerrar el banco corta lo que suena');
}

// ---------------------------------------------------------------- el lugar de cada sonido
{
  const Rl = { sonido: { oyente: { x: 10, y: 5, z: -4 } }, adelante: () => ({ x: 0, z: -1 }) };
  for (const d of B.DISTANCIAS) for (const l of B.LADOS) {
    const p = B.lugarDe(Rl, d.metros, l.grados, 0);
    ok(cerca(Math.hypot(p.x - 10, p.z + 4), d.metros, 1e-6), `${d.id}/${l.id}: a ${d.metros} m`);
  }
  const f = B.lugarDe(Rl, 10, 0), de = B.lugarDe(Rl, 10, 90), at = B.lugarDe(Rl, 10, 180), iz = B.lugarDe(Rl, 10, 270);
  ok(cerca(f.z, -14) && cerca(f.x, 10), 'al frente: hacia donde mira');
  ok(cerca(de.x, 20) && cerca(de.z, -4), 'a la derecha de quien mira hacia -z es +x');
  ok(cerca(at.z, 6) && cerca(iz.x, 0), 'atrás e izquierda');
  const mirandoX = B.lugarDe({ sonido: { oyente: { x: 0, y: 0, z: 0 } }, adelante: () => ({ x: 1, z: 0 }) }, 10, 90);
  ok(cerca(mirandoX.z, 10) && cerca(mirandoX.x, 0, 1e-9), 'mirando hacia +x, la derecha es +z');
  ok(cerca(B.lugarDe({ sonido: { oyente: { x: 0, y: 1.7, z: 0 } } }, 6, 0).z, -6), 'sin dirección de cámara mira hacia -z');
}

// ---------------------------------------------------------------- no toca la partida
{
  const fuente = leer('src/banco-sonidos.js') + '\n' + leer('src/banco-sonidos-panel.js');
  for (const prohibido of ['localStorage', 'sessionStorage', 'indexedDB', 'guardar', 'progreso', 'fetch(', 'XMLHttpRequest', 'navigator.', 'Blob(']) {
    ok(!fuente.includes(prohibido), `el banco de sonidos no puede tocar «${prohibido}»`);
  }
  ok(toques.length === 0, `el almacenamiento del navegador se tocó: ${toques.join(', ')}`);
  const main = leer('src/main.js');
  const i0 = main.indexOf('let bancoSonidos = null;'), i1 = main.indexOf("$('btn-banco-sonidos')");
  ok(i0 > 0 && i1 > i0, 'main.js engancha el banco de sonidos');
  const bloque = main.slice(i0, i1);
  for (const prohibido of ['guardar(', 'progreso', 'localStorage', 'desafio.', 'nota(', 'gastar']) ok(!bloque.includes(prohibido), `el enganche de main.js no puede usar «${prohibido}»`);
  ok(/btn-banco-sonidos/.test(leer('src/plantilla.html')) && /id="banco-sonidos"/.test(leer('src/plantilla.html')), 'la plantilla tiene el botón y el panel');
  // la pausa: el botón está en el menú de pausa, junto al banco de pruebas
  const pl = leer('src/plantilla.html');
  ok(pl.indexOf('id="btn-banco-sonidos"') > pl.indexOf('id="btn-banco"') && pl.indexOf('id="btn-banco-sonidos"') < pl.indexOf('id="btn-base"'), 'el botón está al lado del banco de pruebas, en el menú de pausa');
  // los volúmenes del panel son los de verdad (los mismos data-ajuste-rango que usa main.js)
  const panel = pl.slice(pl.indexOf('id="banco-sonidos"'), pl.indexOf('<section id="base"'));
  for (const k of ['volumen', 'volumenAmbiente', 'volumenEfectos', 'volumenMusica']) ok(panel.includes(`data-ajuste-rango="${k}"`), `el panel tiene el volumen ${k}`);
  // Escape lo cierra y vuelve a la pausa; y mientras está abierto las otras teclas no llegan al juego
  ok(/if \(bancoSonidosAbierto\(\)\) \{\s*if \(e\.code === 'Escape'\) \{ e\.preventDefault\(\); cerrarBancoSonidos\(\); \}/.test(main), 'Escape cierra el banco de sonidos');
  ok(/function cerrarBancoSonidos\(\) \{[^}]*bancoSonidos\.cerrar\(\);[^}]*if \(modo === 'pausa'\) \$\('pausa'\)\.classList\.remove\('oculto'\);/.test(main), 'al cerrarlo vuelve la pausa');
  ok(/function cerrarBancoSonidos\(\) \{[^}]*sincronizarAjustes\(\);/.test(main) && /function abrirBancoSonidos\(\) \{[\s\S]{0,400}sincronizarAjustes\(\);/.test(main), 'abrir y cerrar sincronizan los volúmenes del panel con los de la pausa');
  ok(/function abrir\(cual\) \{\s*if \(cual === 'pausa' && bancoSonidosAbierto\(\)\) return;/.test(main), 'perder el foco no pone la pausa encima del banco');
  ok(/function volverAlJuego\([^)]*\) \{[\s\S]{0,400}cerrarBancoSonidos\(\);/.test(main), 'volver al juego cierra el banco (y corta lo que suena)');
}

// ---------------------------------------------------------------- los sonidos «en línea» siguen escritos igual en el juego
{
  const archivos = {};
  for (const id of Object.keys(B.LINEA)) {
    const L = B.LINEA[id];
    archivos[L.archivo] ||= leer(L.archivo);
    for (const frag of B.fragmentoDe(id)) ok(archivos[L.archivo].includes(frag), `${id}: «${frag}» ya no está escrito así en ${L.archivo}`);
  }
  ok(Object.keys(B.LINEA).length >= 12, 'hay doce o más sonidos en línea');
  for (const id of Object.keys(B.LINEA)) ok(CAT.some((e) => e.id === id && e.enLinea), `${id}: está en LINEA pero no en el catálogo`);
  // los otros que el banco repite a mano, contra el juego
  const hj = leer('src/huevos-juego.js');
  ok(hj.includes('sintetizarTango(TASA_RADIO, 7)') && hj.includes('sintetizarMorse(r.mensaje, TASA_RADIO, 11 + i)') && hj.includes("`radio-mad-morse-${i}`") && hj.includes("'radio-mad-tango'"), 'la radio suena con las mismas recetas');
  ok(/const e = emitirEmisora\(son, buf\)/.test(hj), 'la radio del juego usa la misma salida que el banco');
  const main = leer('src/main.js');
  ok(main.includes("sonido.pulsar?.(76, { dur: 1.2, vol: 0.1, destino: sonido.bus?.efectos })") && main.includes("sonido.pulsar(83, { cuando: 0.12, dur: 1.4, vol: 0.09, destino: sonido.bus?.efectos })"), 'el logro suena con las mismas notas');
  ok(leer('src/desafio-vecinos-mundo.js').includes('api.sonido.silbato?.({ x: pos.x, y: pos.y + 3, z: pos.z })'), 'el silbato de Martín sigue siendo el del motor');
}

// ---------------------------------------------------------------- la gramola elige el tema sin mover el turno del juego
{
  detenerGramola();
  alternarGramola(s, () => true, null); const a = temaDeGramola().id; detenerGramola();
  alternarGramola(s, () => true, null, 'habanera'); const b = temaDeGramola().id; detenerGramola();
  alternarGramola(s, () => true, null); const c = temaDeGramola().id; detenerGramola();
  ok(b === 'habanera' && TEMAS[0].id !== 'habanera', 'el tema elegido es el que suena');
  ok(a === TEMAS[0].id || TEMAS.some((t) => t.id === a), 'el turno de la gramola sigue andando');
  ok(c === TEMAS[(TEMAS.findIndex((t) => t.id === a) + 1) % TEMAS.length].id, 'elegir un tema no mueve el turno de la gramola del juego');
}

// ---------------------------------------------------------------- la pantalla: lista, teclas, variantes (con un DOM mínimo)
{
  const registro = new Map();
  class El {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {}; this._texto = ''; this.escuchas = {}; this.clases = new Set(); this.hidden = false; this.value = ''; this.id = ''; this.parent = null; this.enfocado = false; }
    get className() { return [...this.clases].join(' '); } set className(v) { this.clases = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get classList() { const c = this.clases; return { add: (x) => c.add(x), remove: (x) => c.delete(x), toggle: (x, f) => { if (f === undefined ? !c.has(x) : f) c.add(x); else c.delete(x); }, contains: (x) => c.has(x) }; }
    set textContent(v) { this._texto = String(v); if (v === '') { this.children = []; } } get textContent() { return this._texto + this.children.map((x) => x.textContent).join(''); }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); } getAttribute(k) { return this.attrs[k]; }
    appendChild(h) { h.parent = this; this.children.push(h); return h; } append(...hs) { for (const h of hs) this.appendChild(typeof h === 'string' ? new TextoNodo(h) : h); }
    addEventListener(ev, f) { (this.escuchas[ev] ||= []).push(f); }
    disparar(ev, datos = {}) { for (const f of this.escuchas[ev] || []) f({ target: this, ...datos }); }
    focus() { this.enfocado = true; } scrollIntoView() {}
    todos() { return this.children.flatMap((c) => [c, ...(c.todos ? c.todos() : [])]); }
    coincide(sel) {
      return sel.split(',').some((parte) => {
        const m = /^([a-z]*)(?:#([\w-]+))?((?:\.[\w-]+)*)(?:\[([\w-]+)="([^"]*)"\])?$/.exec(parte.trim());
        if (!m) return false;
        const [, tag, id, clases, atr, val] = m;
        if (tag && this.tagName !== tag.toUpperCase()) return false;
        if (id && this.id !== id) return false;
        for (const c of (clases || '').split('.').filter(Boolean)) if (!this.clases.has(c)) return false;
        if (atr && this.attrs[atr] !== val) return false;
        return true;
      });
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    querySelectorAll(sel) { return this.todos().filter((x) => x.coincide && x.coincide(sel)); }
  }
  class TextoNodo { constructor(t) { this._texto = t; this.children = []; } get textContent() { return this._texto; } set textContent(v) { this._texto = v; } }
  const nuevo = (tag, id, hijos = []) => { const e = new El(tag); if (id) e.setAttribute('id', id); for (const h of hijos) e.appendChild(h); registro.set(id, e); return e; };
  const lista = nuevo('div', 'bs-lista'), sonando = nuevo('div', 'bs-sonando'), detalle = nuevo('div', 'bs-detalle');
  const sel = nuevo('select', 'bs-variante'), filaVar = nuevo('div', 'bs-fila-variante', [sel]);
  const raiz = nuevo('section', 'banco-sonidos', [lista, sonando, detalle, filaVar, nuevo('span', 'bs-rotulo-variante'),
    nuevo('div', 'bs-fila-distancia'), nuevo('div', 'bs-fila-lado'), nuevo('div', 'bs-fila-fuerza'),
    nuevo('div', 'bs-distancia'), nuevo('div', 'bs-lado'), nuevo('div', 'bs-fuerza'), nuevo('button', 'bs-oir'), nuevo('button', 'bs-parar'), nuevo('button', 'bs-volver')]);
  raiz.clases.add('oculto');
  globalThis.document = {
    createElement: (t) => new El(t), createTextNode: (t) => new TextoNodo(t), getElementById: (id) => registro.get(id) || raiz.todos().find((x) => x.id === id) || null,
    addEventListener: (ev, f) => { (document.escuchas[ev] ||= []).push(f); }, removeEventListener: (ev, f) => { document.escuchas[ev] = (document.escuchas[ev] || []).filter((x) => x !== f); }, escuchas: {},
  };
  globalThis.performance = globalThis.performance || { now: () => Date.now() };
  const ban2 = B.crearBancoSonidos(R);
  let volvio = 0;
  const P = crearPanelBancoSonidos({ raiz, banco: ban2 });
  P.abrir({ alVolverA: () => { volvio++; } });
  ok(!raiz.clases.has('oculto') && ban2.abierto, 'abrir muestra el panel y abre el banco');
  ok(document.escuchas.keydown?.length === 1, 'las teclas se escuchan mientras está abierto');
  ok(lista.querySelectorAll('.bs-item').length === CAT.length, `la lista muestra los ${CAT.length} sonidos`);
  ok(lista.querySelectorAll('.bs-grupo').length === B.GRUPOS.length, 'la lista muestra los grupos');
  ok(lista.enfocado, 'la lista toma el foco al abrir');
  const tecla = (code, target = lista) => { let prevenido = false; P.tecla({ code, target, preventDefault: () => { prevenido = true; } }); return prevenido; };
  const idActual = () => P.actual().id;
  const primero = idActual();
  ok(primero === P.orden[0].id && lista.querySelector('.bs-item[aria-selected="true"]')?.dataset.id === primero, 'empieza en el primer sonido, marcado');
  ok(tecla('ArrowDown') && idActual() === P.orden[1].id, 'la flecha de abajo baja');
  ok(tecla('ArrowUp') && idActual() === primero, 'la flecha de arriba sube');
  tecla('ArrowUp'); ok(idActual() === primero, 'no se pasa del principio');
  tecla('End'); ok(idActual() === P.orden.at(-1).id, 'Fin va al último');
  tecla('ArrowDown'); ok(idActual() === P.orden.at(-1).id, 'no se pasa del final');
  tecla('Home'); ok(idActual() === primero, 'Inicio va al primero');
  tecla('PageDown'); ok(P.actual().grupo === B.GRUPOS[1].id && P.orden.findIndex((e) => e.id === idActual()) === P.orden.findIndex((e) => e.grupo === B.GRUPOS[1].id), 'Av Pág salta al grupo siguiente');
  tecla('PageUp'); ok(idActual() === primero, 'Re Pág vuelve al principio del grupo anterior');
  // Enter lo dispara (llama al motor), y el cartel dice cuál y por qué bus
  P.elegir(P.orden.findIndex((e) => e.id === 'martillo-anselmo'));
  llamadas.length = 0;
  const n0 = nodos.length;
  const prev = tecla('Enter');
  await new Promise((r) => setTimeout(r, 30));
  ok(prev && nodos.slice(n0).some(esFuente) && llamadas.includes('sonido.golpeRuido'), 'Enter dispara el sonido elegido con la función del motor');
  P.pintarEstado();
  ok(/Anselmo/.test(sonando.textContent) && /Efectos/.test(sonando.textContent), `el cartel dice qué suena y por qué bus sale: «${sonando.textContent}»`);
  ok(/Sale por: Efectos/.test(detalle.textContent) && /golpeRuido/.test(detalle.textContent), 'el detalle dice el bus y cómo se dispara');
  // un click también
  const it = lista.querySelectorAll('.bs-item').find((x) => x.dataset.id === 'ave-zorzal');
  const nA = nodos.length;
  it.disparar('click'); await new Promise((r) => setTimeout(r, 30));
  ok(idActual() === 'ave-zorzal' && nodos.slice(nA).some(esFuente), 'un clic elige y dispara');
  P.pintarEstado();
  ok(/El bosque/.test(sonando.textContent), 'el cartel dice que el pájaro sale por El bosque');
  // variantes con ← →
  P.elegir(P.orden.findIndex((e) => e.id === 'hachazo'));
  ok(sel.value === '0.5' && !filaVar.hidden, 'el selector de variante muestra el defecto');
  tecla('ArrowRight'); ok(sel.value === '0.9', '→ pasa a la variante siguiente');
  tecla('ArrowRight'); ok(sel.value === '0.15', '→ da la vuelta');
  tecla('ArrowLeft'); ok(sel.value === '0.9', '← pasa a la anterior');
  llamadas.length = 0; const nH = nodos.length;
  const argsHachazo = []; const hach = s.hachazo; s.hachazo = function (p, h) { argsHachazo.push(h); return hach.call(this, p, h); };
  tecla('Enter'); await new Promise((r) => setTimeout(r, 30));
  s.hachazo = hach;
  ok(argsHachazo[0] === 0.9, `Enter usa la variante elegida (hondura ${argsHachazo[0]})`);
  P.elegir(P.orden.findIndex((e) => e.id === 'rey-voz')); ok(sel.value === 'llamado', 'cada sonido tiene su variante por defecto');
  P.elegir(P.orden.findIndex((e) => e.id === 'hachazo')); ok(sel.value === '0.9', 'cada sonido se acuerda de su variante');
  P.elegir(P.orden.findIndex((e) => e.id === 'coihue-camina')); ok(filaVar.hidden, 'sin variantes, el selector se esconde');
  // distancia, lado y fuerza
  ok(P.opciones.distancia === 'cerca' && P.opciones.lado === 'frente' && P.opciones.fuerza === 'normal', 'empieza cerca, al frente, normal');
  tecla('KeyD'); ok(P.opciones.distancia === 'media', 'D cambia la distancia'); tecla('KeyD'); tecla('KeyD'); ok(P.opciones.distancia === 'cerca', 'D da la vuelta');
  tecla('KeyL'); ok(P.opciones.lado === 'derecha', 'L cambia el lado'); tecla('KeyF'); ok(P.opciones.fuerza === 'fuerte', 'F cambia la fuerza');
  const posiciones = []; const bz = s.zumbido; s.zumbido = function (p, l) { posiciones.push(p); return bz.call(this, p, l); };
  P.poner('distancia', 'lejos'); P.poner('lado', 'frente');
  tecla('Enter'); await new Promise((r) => setTimeout(r, 30));
  s.zumbido = bz;
  ok(posiciones.length === 0, 'el Coihue no usa zumbido de bicho'); // (el Coihue camina llama a banco.zumbido, no a sonido.zumbido)
  // Espacio detiene todo
  P.elegir(P.orden.findIndex((e) => e.id === 'viento')); tecla('Enter'); await new Promise((r) => setTimeout(r, 30));
  ok(ban2.estado().bucles.includes('viento'), 'Enter prende el viento');
  const prevE = tecla('Space'); ok(prevE && ban2.estado().bucles.length === 0 && /detenido/i.test(sonando.textContent), 'Espacio detiene todo');
  // si el foco está en un control, las flechas y el Enter son del control
  const antes = idActual();
  ok(!tecla('ArrowDown', sel) && idActual() === antes, 'con el foco en un selector las flechas son del selector');
  ok(!tecla('Enter', raiz.querySelector('#bs-oir')) && !tecla('Space', raiz.querySelector('#bs-parar')), 'con el foco en un botón, Enter y Espacio son del botón');
  // los botones
  raiz.querySelector('#bs-parar').disparar('click'); ok(/detenido/i.test(sonando.textContent), 'el botón Detener todo');
  raiz.querySelector('#bs-volver').disparar('click'); ok(volvio === 1, 'el botón Volver avisa a la pausa');
  // cerrar
  P.cerrar();
  ok(raiz.clases.has('oculto') && !ban2.abierto && !document.escuchas.keydown?.length, 'cerrar esconde el panel, cierra el banco y suelta las teclas');
  ok(tecla('ArrowDown') === false, 'cerrado no escucha');
  ok(s.relax === true, 'cerrado, el Relax queda como estaba');
}

ban.cerrar();
console.log(fallas ? `\nFALLARON ${fallas} de ${hechas} comprobaciones` : `OK · ${hechas} comprobaciones · ${CAT.length} sonidos en el catálogo`);
process.exit(fallas ? 1 : 0);
