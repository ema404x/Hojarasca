// 4.11.0 (desafío A): tres decisiones de diseño de «La noche de los duendes» (DECISIONES_DISENO_4_10.md).
//   1. Pesadilla con tope propio: la oleada topaba en 24 y en Implacable la pesadilla perdía su x1,3 de cantidad desde la noche ~7.
//      Ahora el tope es 31 sólo en la pesadilla (en la oleada, en la cadena de noches y en los que caben a la vez en la base).
//   2. Mandamás: sus estudios del bestiario son a 1, 2 y 4 caídas (ya estaba desde la 4.10.2; acá queda fijado con su premio).
//   3. «Noches más largas» y «Manos llenas» con la hora de tu reloj: apagadas en Nueva partida, con el motivo escrito debajo de
//      CADA chip bloqueado; una partida guardada con la combinación se carga sin pérdida.
// Cada bloque EJECUTA la conducta (módulos puros y la pantalla con un DOM de mentira); lo que sólo se ve en Electron
// (el dibujo del motivo debajo del chip, 31 duendes en pantalla) se mira en las partidas reales y se dice en el informe.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as M from '../src/desafio-meta.js';
import { crearMetaJuego } from '../src/desafio-meta-juego.js';
import { crearPantallaNuevaPartida } from '../src/desafio-meta-pantalla.js';
import * as R from '../src/desafio-reglas.js';
import * as B from '../src/desafio-bestiario-premia.js';
import { aplicarCadena } from '../src/desafio-noches.js';
import { crearAtaques } from '../src/desafio-ataques.js';
import { sanearDesafio } from '../src/desafio-reglas.js';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
let pasos = 0;
const ok = (c, m) => { assert.ok(c, m); pasos++; };
const igual = (a, b, m) => { assert.deepEqual(a, b, m); pasos++; };

const sinEnjambre = (l) => l.filter((t) => t !== 'enjambre');
const fijar = (modo) => R.fijarPartidaMeta(modo ? M.metaDePartida({ modo }) : null);

// ================================================================== 1. la pesadilla con tope propio
{
  fijar(null);
  ok(R.TOPE_OLEADA === 24 && R.TOPE_OLEADA_PESADILLA === 31, 'los topes: 24 de siempre y 31 en la pesadilla (24 x 1,3)');
  ok(R.topeOleada() === 24, 'sin partida, el tope es el de siempre');
  for (const modo of ['normal', 'corta', 'sinfin']) { fijar(modo); ok(R.topeOleada() === 24, `en el modo ${modo} el tope sigue en 24`); }
  fijar('pesadilla');
  ok(R.topeOleada() === 31, 'en la pesadilla sube a 31');
  fijar(null);
  ok(R.topeOleada() === 24, 'y al salir de la pesadilla vuelve a 24 (el estado no se queda pegado)');

  // la oleada: en Implacable, antes la pesadilla pasaba de x1,3 a x1,0 desde la noche 7 (los dos topaban en 24)
  const grilla = [];
  for (const dif of ['tranquila', 'normal', 'implacable']) for (let n = 1; n <= 20; n++) for (const v of [0, 1, 2]) grilla.push([dif, n, v]);
  const lista = (modo, dif, n, v) => { fijar(modo); return sinEnjambre(R.composicionOleada(n, dif, v)); };
  // las demás dificultades y modos no cambian: tope 24 (y la misma lista sin partida que con la partida normal)
  for (const [dif, n, v] of grilla) {
    const sin = lista(null, dif, n, v), normal = lista('normal', dif, n, v), corta = lista('corta', dif, n, v);   // (la corta trae x0,95: no es igual, pero topa en 24)
    igual(sin, normal, `normal igual que sin partida (${dif}, noche ${n}, vuelta ${v})`);
    ok(corta.length <= 25, `la corta tampoco pasa de 24 (${dif}, noche ${n}, vuelta ${v})`);
    ok(sin.length <= 24 + 1, `fuera de la pesadilla ninguna oleada pasa de 24 (${dif}, noche ${n}, vuelta ${v}: ${sin.length})`);
  }
  // Implacable: la pesadilla trae +30 % toda la partida desde que llega al techo (noche 7 en adelante), no sólo hasta la 6
  for (let n = 7; n <= 19; n++) {
    if (R.esNocheDeJefe(n)) continue;
    const imp = lista('normal', 'implacable', n, 0), pes = lista('pesadilla', 'implacable', n, 0);
    ok(imp.length >= 23 && imp.length <= 25, `Implacable normal topa en 24 (noche ${n}: ${imp.length})`);
    ok(pes.length >= 30 && pes.length <= 32, `Implacable en pesadilla topa en 31 (noche ${n}: ${pes.length})`);
    ok(pes.length / imp.length >= 1.25, `y conserva el +30 % (noche ${n}: ${pes.length} contra ${imp.length})`);
  }
  // el jefe sigue siendo uno y va último, también con el tope nuevo
  for (const n of [5, 10, 15, 20]) {
    const l = (fijar('pesadilla'), R.composicionOleada(n, 'implacable', 0));
    ok(l.filter((t) => t === 'jefe').length === 1 && l[l.length - 1] === 'jefe', `noche ${n} de jefe: uno solo y último`);
  }
  // Normal en pesadilla (18 x 1,3 = 23): no llega al techo, igual que antes
  fijar('pesadilla');
  ok(sinEnjambre(R.composicionOleada(10, 'normal', 0)).length === 23, 'Normal en pesadilla: 23, como antes (el tope nuevo sólo se nota donde antes se cortaba)');
  // la corrida sin fin no es pesadilla y sigue con su tope
  fijar(null);

  // la cadena de noches (los que se escaparon, la noche perfecta) también cabe hasta el tope del modo
  const base30 = Array(18).fill('rastreador');
  const efecto = { vueltos: 3, companias: 4, grande: true };
  ok(aplicarCadena(base30, efecto, 24).length === 24, 'la cadena corta en 24 con el tope de siempre');
  ok(aplicarCadena(base30, efecto, R.TOPE_OLEADA_PESADILLA).length === 25 || aplicarCadena(base30, efecto, 31).length > 24, 'y con 31 deja entrar más');

  // los que caben a la vez en la base (ataques.lleno): con 24 vivos, 24 está lleno y 31 no
  const aliens = Array.from({ length: 24 }, () => ({ def: {} }));
  const D = { oleadas: 1, semilla: 'COIHUE-4821', ladoNoche: null };
  const A = crearAtaques({ T: { lugares: {} }, D: () => D, aliens, limite: 400, base: () => ({ x: 0, z: 0 }), libre: () => true, blancoNoche: () => null, esFinal: () => false, nota() {}, jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 } } }), defensas: () => [], obraViva: () => true, porBajar: () => 0, polvo() {}, risa() {}, destelloCura() {}, efectoCurandero() {} });
  ok(A.lleno({}, 24) && !A.lleno({}, 31), 'con 24 vivos el tope de 24 está lleno y el de 31 todavía no');

  // el enganche: la oleada, la cadena y la bajada usan el tope del modo (no una constante)
  const des = leer('src/desafio.js'), reg = leer('src/desafio-reglas.js');
  ok(/ataques\.lleno\(def, topeOleada\(\)\)/.test(des), 'bajar un duende pregunta por el tope del modo');
  ok(/aplicarCadena\(tipos, efectoCadena\(cadenaD\(\), n\), topeOleada\(\)\)/.test(des), 'la cadena de noches usa el tope del modo');
  ok(!/MAX_ALIENS/.test(des.replace(/\/\/.*$/gm, '')), 'ya no queda la constante de 24 en el juego');
  ok(/Math\.min\(topeOleada\(\), Math\.round\(/.test(reg), 'la composición de la oleada topa en el tope del modo');
  ok(/modo === 'pesadilla' \? TOPE_OLEADA_PESADILLA : TOPE_OLEADA/.test(reg), 'y sólo la pesadilla tiene el tope alto');

  // el guardado: una partida de pesadilla guardada con la 4.10 carga igual (el tope no se guarda: sale del modo)
  const viejo = sanearDesafio({ ...R.desafioNuevo(), meta: M.metaDePartida({ modo: 'pesadilla' }) });
  ok(viejo.meta.modo === 'pesadilla', 'una partida de pesadilla guardada carga y sigue siendo pesadilla');
  fijar(null);
}

// ================================================================== 2. los estudios del Mandamás
{
  igual(B.umbralesDe('jefe'), [1, 2, 4], 'el Mandamás se estudia con 1, 2 y 4 caídas');
  igual(B.umbralesDe('bruto'), [5, 15, 40], 'el resto, igual');
  igual(B.umbralesDe('enjambre'), [20, 60, 160], 'el enjambre, igual');
  const mejor = (n) => ({ jefe: { abatidos: n } });
  igual([0, 1, 2, 3, 4].map((n) => B.nivelEstudio(mejor(n), 'jefe')), [0, 1, 2, 2, 3], 'los niveles con 0, 1, 2, 3 y 4 caídas');
  ok(B.subioEstudio('jefe', 0, 1) === 1 && B.subioEstudio('jefe', 1, 2) === 2 && B.subioEstudio('jefe', 3, 4) === 3, 'sube de nivel en la 1ª, la 2ª y la 4ª caída');
  ok(B.DANO_ESTUDIADO === 0.05, 'el premio del tercero sigue en +5 % de daño');
  ok(B.danoContraTipo(mejor(3), 'jefe') === 1 && B.danoContraTipo(mejor(4), 'jefe') === 1.05, 'y llega con la cuarta caída (la de la noche 20)');
  // lo que muestra el cuaderno sale de los mismos umbrales
  const r = B.renglonesEstudio(mejor(1), 'jefe');
  ok(r.length === 3 && /\b2\b/.test(r[1].falta || r[1].texto || JSON.stringify(r[1])) && /\b4\b/.test(JSON.stringify(r[2])), 'la ficha pide 2 y 4 para los otros dos estudios');
  ok(!/\b(15|40)\b/.test(JSON.stringify(r)), 'y no muestra 15 ni 40');
  const a = B.umbralesDe('jefe'); a.push(99);
  igual(B.umbralesDe('jefe'), [1, 2, 4], 'quien pida los umbrales no puede cambiarlos');
}

// ================================================================== 3. noches más largas y la hora de tu reloj
const META = (o = {}) => M.sanearMeta({ semillas: 5, ...o });
{
  const sinReloj = { relojReal: false }, conReloj = { relojReal: true };
  ok(M.ALARGAN_LA_NOCHE.includes('nochesLargas') && M.ALARGAN_LA_NOCHE.includes('avaro'), 'lo que alarga la noche: la regla y «Manos llenas»');
  ok(typeof M.MOTIVO_RELOJ === 'string' && /reloj/.test(M.MOTIVO_RELOJ) && /noches/.test(M.MOTIVO_RELOJ), 'el motivo habla del reloj y de las noches');
  // sin reloj (o sin decir nada) todo como antes
  ok(M.validarEleccion(META(), { reglas: ['nochesLargas'] }).ok && M.validarEleccion(META(), { reglas: ['nochesLargas'] }, sinReloj).ok, 'sin la hora del reloj, la regla vale');
  ok(M.validarEleccion(META(), { ventajas: ['avaro'] }, sinReloj).ok, 'y «Manos llenas» también');
  // con reloj: apagadas
  const a = M.validarEleccion(META(), { reglas: ['nochesLargas'] }, conReloj);
  ok(!a.ok && a.motivo === M.MOTIVO_RELOJ, 'con la hora de tu reloj, «Noches más largas» no vale y dice por qué');
  const b = M.validarEleccion(META(), { ventajas: ['avaro'] }, conReloj);
  ok(!b.ok && b.motivo === M.MOTIVO_RELOJ, 'con la hora de tu reloj, «Manos llenas» tampoco');
  ok(M.validarEleccion(META(), { reglas: ['soloArco', 'sinReparar'], ventajas: ['tablas', 'filo'] }, conReloj).ok, 'el resto de las reglas y ventajas siguen valiendo con el reloj');
  ok(M.validarEleccion(META(), {}, conReloj).ok, 'y una elección vacía');

  // empezar de verdad: no gasta ni deja nada
  const m = new Map();
  const al = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
  M.guardarMeta(al, META({ semillas: 3 }));
  const juego = { progreso: { desafio: { ...R.desafioNuevo() } } };
  const ctx = (reloj) => ({ almacen: () => al, progreso: () => juego.progreso, esSinFin: () => false, sumarMaterial() {}, nota() {}, guardar() {}, posJugador: () => ({ x: 0, z: 0 }), desafio: () => ({}), sumarBono() {}, relojReal: () => reloj });
  const mjReloj = crearMetaJuego(ctx(true));
  ok(mjReloj.iniciar({ modo: 'normal', reglas: ['nochesLargas'], ventajas: ['tablas'] }) === false && mjReloj.leer().semillas === 3 && juego.progreso.desafio.meta === null, 'con el reloj, empezar con noches más largas no gasta semillas ni deja nada');
  ok(mjReloj.iniciar({ modo: 'normal', reglas: ['soloArco'], ventajas: ['tablas'] }) === true && juego.progreso.desafio.meta.reglas[0] === 'soloArco', 'y otra elección empieza');
  fijar(null);

  // el guardado: una partida ya guardada con la combinación carga y conserva todo
  for (const [reglas, ventajas] of [[['nochesLargas'], []], [[], ['avaro']], [['nochesLargas', 'soloArco'], ['avaro']]]) {
    const guardada = { ...R.desafioNuevo(), meta: { ...M.metaDePartida({ modo: 'normal', reglas, ventajas }), id: 'abcdef123456' } };
    const cargada = JSON.parse(JSON.stringify(sanearDesafio(guardada)));
    igual(cargada.meta.reglas, M.sanearMetaPartida(guardada.meta).reglas, `la partida vieja conserva sus reglas (${reglas.join() || '-'} / ${ventajas.join() || '-'})`);
    igual(cargada.meta.ventajas, M.sanearMetaPartida(guardada.meta).ventajas, 'y sus ventajas');
    R.fijarPartidaMeta(cargada.meta);
    ok(R.efectosPartida().nochesLargas === true, 'y sus efectos: la noche larga sigue contando al cargarla');
    ok(cargada.meta.mult === M.multiplicadorDe(ventajas, reglas), 'y el multiplicador de puntos de la partida no cambia');
    fijar(null);
  }
  ok(M.INCOMPATIBLES.some(([x, y]) => x === 'nochesLargas' && y === 'avaro'), 'la incompatibilidad de siempre entre las dos sigue');

  // el enganche con el juego
  const main = leer('src/main.js');
  ok(/relojReal: \(\) => ajustes\.duracion === 'reloj'/.test(main) && (main.match(/relojReal: \(\) => ajustes\.duracion === 'reloj'/g) || []).length === 2, 'el juego le dice a la pantalla y a la meta si la partida va con la hora de tu reloj');
}

// ---------------------------------------------------------------- la pantalla con un DOM de mentira
class Nodo {
  constructor(tag) { this.tag = tag; this.className = ''; this.hijos = []; this.attrs = {}; this.dataset = {}; this.escuchas = {}; this.disabled = false; this.title = ''; this._texto = ''; this.padre = null;
    const clases = new Set(); this.classList = { add: (c) => clases.add(c), remove: (c) => clases.delete(c), contains: (c) => clases.has(c) }; }
  get textContent() { return this._texto + this.hijos.map((h) => h.textContent).join(''); }
  set textContent(t) { this._texto = String(t); this.hijos = []; }
  set innerHTML(_) { this.hijos = []; this._texto = ''; }
  appendChild(h) { h.padre = this; this.hijos.push(h); return h; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  addEventListener(e, f) { (this.escuchas[e] ||= []).push(f); }
  click() { if (!this.disabled) for (const f of this.escuchas.click || []) f(); }
  focus() {}
  get offsetParent() { return {}; }
  recorrer(f) { f(this); for (const h of this.hijos) h.recorrer(f); }
  buscar(pred) { const r = []; this.recorrer((n) => { if (pred(n)) r.push(n); }); return r; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  querySelectorAll(sel) {
    let m;
    if ((m = /^\[data-clave="(.+)"\]$/.exec(sel))) return this.buscar((n) => n.dataset.clave === m[1]);
    if ((m = /^\[data-modo="(.+)"\]$/.exec(sel))) return this.buscar((n) => n.dataset.modo === m[1]);
    if ((m = /^\.([\w-]+)$/.exec(sel))) return this.buscar((n) => n.className.split(' ').includes(m[1]));
    if (sel === 'button:not(:disabled)') return this.buscar((n) => n.tag === 'button' && !n.disabled);
    return [];
  }
}
function pantallaDeMentira({ reloj, semillas = 5, pesadilla = false }) {
  const velo = new Nodo('div'), cont = new Nodo('div');
  velo.classList.add('oculto');
  const antes = { document: globalThis.document };
  globalThis.document = { getElementById: (id) => (id === 'nueva-partida' ? velo : id === 'np-contenido' ? cont : null), createElement: (t) => new Nodo(t), addEventListener() {} };
  let meta = META({ semillas, desbloqueos: { pesadilla } });
  const p = crearPantallaNuevaPartida({ leerMeta: () => meta, esSinFin: () => false, modoInicial: () => 'normal', relojReal: () => reloj, traducir() {}, alEmpezar() {}, alVolver() {} });
  p.abrir();
  return { cont, p, restaurar() { globalThis.document = antes.document; } };
}
const chips = (cont) => cont.buscar((n) => n.tag === 'button' && n.className.includes('np-chip'));
const celdaDe = (b) => b.padre;
const motivoDe = (b) => celdaDe(b).hijos.find((h) => h.className === 'np-motivo')?.textContent || '';
{
  const P = pantallaDeMentira({ reloj: true });
  try {
    const todos = chips(P.cont);
    const larga = todos.find((b) => b.dataset.clave === 'nochesLargas'), avaro = todos.find((b) => b.dataset.clave === 'avaro');
    ok(larga && larga.disabled && avaro && avaro.disabled, 'con la hora de tu reloj los chips «Noches más largas» y «Manos llenas» están apagados');
    ok(motivoDe(larga) === M.MOTIVO_RELOJ && motivoDe(avaro) === M.MOTIVO_RELOJ, 'y el motivo está ESCRITO debajo de cada uno (no sólo en el title)');
    ok(larga.title === M.MOTIVO_RELOJ, 'el title del mouse sigue');
    ok(celdaDe(larga).className === 'np-celda' && celdaDe(larga).hijos[0] === larga && celdaDe(larga).hijos[1].tag === 'p', 'el motivo es un renglón debajo del botón, afuera de él (no se apaga con el chip)');
    ok(todos.filter((b) => !['nochesLargas', 'avaro'].includes(b.dataset.clave) && b.disabled).length === 0, 'los demás chips están prendidos (hay semillas y lugar)');
    ok(todos.every((b) => !b.disabled || motivoDe(b)), 'todo chip apagado tiene su motivo escrito');
    ok(todos.filter((b) => !b.disabled).every((b) => !motivoDe(b)), 'y ninguno prendido lo tiene');
    // el botón de empezar sigue andando
    larga.click();
    ok(!P.p.eleccion().reglas.includes('nochesLargas'), 'tocar el chip apagado no lo elige');
  } finally { P.restaurar(); }

  const Q = pantallaDeMentira({ reloj: false });
  try {
    const todos = chips(Q.cont);
    ok(todos.every((b) => !b.disabled), 'sin la hora del reloj, todos los chips están disponibles');
    const larga = todos.find((b) => b.dataset.clave === 'nochesLargas');
    larga.click();
    ok(Q.p.eleccion().reglas.includes('nochesLargas'), 'y «Noches más largas» se puede elegir');
    const t2 = chips(Q.cont);
    const avaro = t2.find((b) => b.dataset.clave === 'avaro');
    ok(avaro.disabled && motivoDe(avaro) === 'Las dos alargan la noche un tercio, pero no se suman: elegí una', 'y entonces «Manos llenas» queda apagada con el motivo escrito');
    // sin aliados -> perro y los demás aliados
    const sa = t2.find((b) => b.dataset.clave === 'sinAliados');
    sa.click();
    const t3 = chips(Q.cont);
    const perro = t3.find((b) => b.dataset.clave === 'perro');
    ok(perro.disabled && motivoDe(perro) === 'Sin aliados no hay perro', '«Sin aliados no hay perro» está escrito debajo del chip');
    ok(motivoDe(t3.find((b) => b.dataset.clave === 'vecino')) === 'Sin aliados no ayuda ningún vecino' && motivoDe(t3.find((b) => b.dataset.clave === 'chicos')) === 'Sin aliados no hay chicos', 'y los de los otros aliados');
    ok(t3.every((b) => !b.disabled || motivoDe(b)), 'todo chip apagado, por el motivo que sea, lo escribe');
    // el tope de dos ventajas
    t3.find((b) => b.dataset.clave === 'tablas').click();
    t3.length;
    const t4 = chips(Q.cont);
    t4.find((b) => b.dataset.clave === 'flechas').click();
    const t5 = chips(Q.cont);
    const filo = t5.find((b) => b.dataset.clave === 'filo');
    ok(filo.disabled && /Ya elegiste 2 ventajas/.test(motivoDe(filo)), '«Ya elegiste 2 ventajas» también se escribe');
    ok(t5.every((b) => !b.disabled || motivoDe(b) === b.title), 'y el renglón dice lo mismo que el title de cada chip');
  } finally { Q.restaurar(); }

  // el modo bloqueado
  const Z = pantallaDeMentira({ reloj: false, pesadilla: false });
  try {
    ok(Z.cont.buscar((n) => n.className === 'np-motivo').some((n) => /pesadilla se desbloquea/.test(n.textContent)), 'la pesadilla bloqueada dice por qué a la vista');
  } finally { Z.restaurar(); }
  const Y = pantallaDeMentira({ reloj: false, pesadilla: true });
  try {
    ok(!Y.cont.buscar((n) => n.className === 'np-motivo').some((n) => /pesadilla se desbloquea/.test(n.textContent)), 'y desbloqueada no dice nada');
  } finally { Y.restaurar(); }
}

// el estilo y los textos
{
  const plantilla = leer('src/plantilla.html');
  ok(/\.np-motivo\s*\{/.test(plantilla) && /\.np-celda\s*\{/.test(plantilla), 'la plantilla trae el estilo del motivo y de la celda');
  ok(!/[A-Za-z]{3,} (the|and|with|you) /.test(leer('src/desafio-meta.js').split('\n').filter((l) => /MOTIVO_RELOJ =/.test(l)).join('')), 'el texto nuevo está sólo en castellano');
}

console.log(`verificar-4-11-0-desafio-a: ${pasos} pasos OK`);
