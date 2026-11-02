// 4.18.4 (A): la Historia por dentro. Búsqueda de bugs con barridos y un jugador de mentira (ayuda-4-18-4-historia.mjs):
//   1. referencias: toda condición, efecto, escena, lugar y objeto que las escenas, los disparadores y los objetivos nombran existe y alguien lo registra
//   2. alcanzabilidad: cada escena que pide un objetivo existe y tiene por dónde dispararse en su capítulo; el jugador de mentira llega al final de los
//      trece capítulos por caminos distintos (decisiones, trato y pelea, pareja, perro) con las cosas del mundo en cualquier orden
//   3. todas las rutas de elección de cada escena, saltándola o no, sobre estados al azar: termina, queda vista, no rompe lazos ni decisiones
//   4. el saneado de lo guardado con basura: no tira, es idempotente y deja todo en rango
//   5. los arreglos de la 4.18.4: A-01 (una historia terminada no se pausa al entrar en «Libre»), A-02 (la deuda del trato se paga con lo que la escena
//      cobra) y A-03 (el arco: «o, si talaste el coihue, llevale a Tito dos tablas» contaba)
// Al final, mutaciones: cada una en un proceso aparte sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { efectosDe } from '../src/historia-escenas-util.js';
import { H, D, E, ES, O, A3D, ESC, TODOS_EF, rng, nuevaPartida, crear, correrEscena, jugar, crearJuego, lugaresPedidos } from './ayuda-4-18-4-historia.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
const HIJO = !!process.env.A4184_SRC;
const SEC = process.env.A4184_SECCIONES ? new Set(process.env.A4184_SECCIONES.split(',')) : null;   // (un hijo de mutación corre sólo las secciones que esa mutación puede romper)
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4184_CALLADO) console.log('FALLA ' + t); } };
const igual = (a, b, t) => ok(JSON.stringify(a) === JSON.stringify(b), `${t} (${JSON.stringify(a)} ≠ ${JSON.stringify(b)})`);

// las escenas que no tienen disparador porque las dispara otra cosa (el cuaderno de la mesa, la noche, la costumbre del trato)
const SIN_DISPARADOR = ['cuaderno-1', 'cuaderno-2', 'cuaderno-3', 'noche-entre-1', 'noche-entre-2', 'noche-tras-ganar', 'noche-tras-perder', 'costumbre-dejar', 'costumbre-regalito'];
// las mecánicas que no tienen escena escrita: se dan por vistas (historia-ui.js, lanzarEscena)
const SIN_GUION = ['ramon-sanitario', 'harina-ercilia-c'];

// ---------------------------------------------------------------- 1. referencias
if (va('ref')) {
  const condsReg = new Set(), efReg = new Set();
  const reg = { registrarEfecto: (x) => efReg.add(x), registrarCondicion: (x) => condsReg.add(x) };
  E.registrarEfectosHistoria(reg, { historia: () => null, dia: () => 1, estado: () => null });
  E.registrarEfectosActo1(reg, { historia: () => null, dia: () => 1 }, TODOS_EF);
  ok(condsReg.size >= 15 && efReg.size >= 100, 'se registran las condiciones y los efectos');
  let cant = 0;
  const recorrer = (e, f) => { const paso = (p) => { f(p); if (p.tipo === 'fundido') for (const q of p.alMedio || []) paso(q); }; e.pasos.forEach(paso); };
  for (const [id, e] of Object.entries(ESC)) {
    ok(e.id === id, `${id}: la clave y el id coinciden`);
    const v = ES.validarEscena(e);
    ok(v.ok, `${id}: escena válida (${v.errores.join('; ')})`);
    recorrer(e, (p) => {
      cant++;
      if (p.si?.cond) ok(condsReg.has(p.si.cond), `${id}: la condición «${p.si.cond}» está registrada (si no, da false en silencio)`);
      if (p.si?.vista) ok(Object.hasOwn(ESC, p.si.vista), `${id}: «si.vista» nombra una escena que existe (${p.si.vista})`);
      if (p.tipo === 'efecto') ok(efReg.has(p.nombre), `${id}: el efecto «${p.nombre}» está registrado`);
      if (p.tipo === 'eleccion') for (const o of p.opciones) if (o.efecto) ok(efReg.has(o.efecto), `${id}: el efecto de opción «${o.efecto}» está registrado`);
      if (p.tipo === 'fundido') ok(!p.alMedio, `${id}: sin fundido cruzado con pasos adentro (saltarla los descarta: se usa apagon)`);
    });
    for (const x of e.disparador?.requiere || []) ok(Object.hasOwn(ESC, x), `${id}: «disparador.requiere» nombra una escena que existe`);
    if (e.disparador?.cond) ok(condsReg.has(e.disparador.cond), `${id}: la condición del disparador está registrada`);
  }
  ok(cant > 1500, 'se miraron todos los pasos (' + cant + ')');
  // los disparadores
  for (const [k, d] of Object.entries(D.DISPARADORES)) {
    const id = d.escena || k;
    ok(Object.hasOwn(ESC, id) || SIN_GUION.includes(id), `disparador ${k}: la escena ${id} existe (o es una mecánica sin guion conocida)`);
    for (const c of [].concat(d.cap)) ok(Object.hasOwn(H.CAPITULO, c), `disparador ${k}: el capítulo ${c} existe`);
    for (const x of [...(d.requiere || []), ...(d.no || [])]) ok(Object.hasOwn(ESC, x) || SIN_GUION.includes(x), `disparador ${k}: ${x} existe`);
    ok(['auto', 'hablar', 'interaccion'].includes(d.modo), `disparador ${k}: modo conocido`);
    if (d.modo !== 'auto') ok(typeof d.clave === 'string' && d.clave, `disparador ${k}: tiene clave`);
  }
  const conDisparador = new Set(Object.entries(D.DISPARADORES).map(([k, d]) => d.escena || k));
  const huerfanas = Object.keys(ESC).filter((id) => !conDisparador.has(id));
  igual(huerfanas.sort(), [...SIN_DISPARADOR].sort(), 'las únicas escenas sin disparador son las que dispara otra cosa');
  // las interacciones: cada clave es un objeto del mundo (o la puerta del refugio) y cada objeto con escena tiene su disparador
  for (const [k, d] of Object.entries(D.DISPARADORES)) if (d.modo === 'interaccion') ok(Object.hasOwn(D.OBJETOS, d.clave) || d.clave === 'puerta-refugio', `disparador ${k}: la clave ${d.clave} es un objeto del mundo`);
  for (const [k, o] of Object.entries(D.OBJETOS)) if (o.escena) ok(Object.values(D.DISPARADORES).some((d) => d.modo === 'interaccion' && d.clave === k) && (Object.hasOwn(ESC, o.escena) || SIN_GUION.includes(o.escena)), `objeto ${k}: su escena ${o.escena} existe y tiene disparador`);
  // los lugares con nombre que alguien pide los arma main.js (puntosDeHistoria)
  const main = leer('src/main.js');
  const i0 = main.indexOf('function puntosDeHistoria()'), i1 = main.indexOf('\nfunction cumpleDeHoyHistoria') > 0 ? main.indexOf('// 4.18.0: el cumpleaños de hoy en la aldea') : i0 + 9000;
  const cuerpo = main.slice(i0, i1);
  const armados = new Set([...cuerpo.matchAll(/'([a-z][a-z0-9]*(?:-[a-z0-9]+)*)'/g)].map((m) => m[1]));
  for (const k of ['cumple', 'predio']) armados.add(k);
  for (const l of lugaresPedidos()) ok(armados.has(l), `main.js arma el lugar «${l}» (si no, la distancia queda en NaN y nada que lo pida se cumple)`);
  // ningun disparador pide una escena de una optativa (las optativas no se hacen siempre: lo que las pide queda imposible para quien no las hizo)
  const deOptativas = new Set(O.OPTATIVAS.flatMap((o) => o.escenas || []));
  for (const [k, d] of Object.entries(D.DISPARADORES)) for (const x of [...(d.requiere || [])]) ok(!deOptativas.has(x), `disparador ${k}: pide la escena ${x}, que es de una optativa (nunca traba un capítulo)`);
  // las marcas de lo guardado tienen tope (TOPE_MARCAS = 200 por grupo: al cargar, lo que pasa del tope se pierde y los efectos se aplican de nuevo):
  // lo que las escenas pueden anotar cabe con margen
  const unaVez = new Set();
  for (const [id, e] of Object.entries(ESC)) for (const nom of efectosDe(e)) { const tp = nom.split(':')[0]; if (['lazo', 'ramal', 'dar', 'quitar'].includes(tp) || nom === 'duendes:trato-fuerte' || nom.startsWith('duendes:deuda') || nom === 'duendes:vistos') unaVez.add(`e:${id}:${nom}`.slice(0, 63)); }
  const porEscena = Object.keys(D.EFECTOS_ESCENA).length;
  ok(unaVez.size + porEscena + 4 <= H.TOPE_MARCAS - 4, `las marcas «aplicadas» posibles (${unaVez.size + porEscena + 4}) caben en el tope de ${H.TOPE_MARCAS} con margen`);   // 4.19.0: el tope subió de 200 a 400 (ver H.TOPE_MARCAS)
  // (los temas: todas las escenas, con cuatro rutas distintas, sobre una misma historia; más lo que anotan el arreo, la majada y el cuaderno)
  const Sm = crear({ semilla: 9 }), hm = Sm.hist();
  for (const pas of [0, 1, 2, 3]) for (const id of Object.keys(ESC)) { delete hm.escenas.vistas[id]; correrEscena(Sm, id, { forzar: true, saltar: false, elige: (m) => Math.min(pas, m - 1) }); }
  ok(Sm.errores.length === 0, 'todas las escenas corren seguidas sobre una misma historia');
  ok(Object.keys(hm.temas).length + 12 <= H.TOPE_MARCAS - 20, `los «temas» posibles (${Object.keys(hm.temas).length + 12}) caben en el tope de ${H.TOPE_MARCAS} con margen`);   // 4.19.0
  // los personajes de las escenas existen en la tabla del director o en los de la escena
  ok(Object.keys(ES.PERSONAJES_BASE).length >= 8, 'hay personajes base');
}

// ---------------------------------------------------------------- 2. los objetivos piden escenas que existen y se pueden disparar
if (va('obj')) {
  const { P, X } = nuevaPartida();
  const base = H.estadoHistoria(P, X);
  class Pedidas extends Set { constructor() { super(); this.pedidos = new Set(); } has(k) { this.pedidos.add(k); return false; } }
  const conDisp = (id, cap) => Object.entries(D.DISPARADORES).some(([k, d]) => (d.escena || k) === id && [].concat(d.cap).includes(cap));
  let miradas = 0;
  for (const c of H.CAPITULOS) for (const o of c.objetivos) {
    for (const dec of [null, 'a', 'b', 'c']) {
      const s = { ...base, escenas: new Pedidas(), decisiones: Object.fromEntries(H.DECISIONES.map((d) => [d, dec])), lazos: Object.fromEntries(H.LAZOS_TODOS.map((k) => [k, 0])) };
      try { o.hecho?.(s, {}); o.cuenta?.(s, {}); if (typeof o.texto === 'function') o.texto(s); if (typeof o.visible === 'function') o.visible(s); } catch { /* un estado que no es de este objetivo */ }
      for (const id of s.escenas.pedidos) {
        miradas++;
        ok(Object.hasOwn(ESC, id) || SIN_GUION.includes(id), `capítulo ${c.id}, objetivo ${o.id}: pide la escena ${id}, que no existe`);
        ok(SIN_DISPARADOR.includes(id) || conDisp(id, c.id) || id === 'noche-espera', `capítulo ${c.id}, objetivo ${o.id}: la escena ${id} no tiene disparador en este capítulo (no se puede cumplir)`);
      }
    }
  }
  ok(miradas > 60, `se miraron las escenas que piden los objetivos (${miradas})`);
}

// ---------------------------------------------------------------- 3. todas las rutas de cada escena
if (va('rutas')) {
  const caminos = new Map();
  const DEC_TRAS = Object.fromEntries(H.CAPITULOS.flatMap((c) => (c.decisiones || []).map((d) => [d.tras, d.id])));
  const alAzar = (S, rnd) => {
    const { P, X } = S; const h = S.hist(); const r = (k) => Math.floor(rnd() * k);
    for (const k of H.LAZOS_TODOS) h.lazos[k] = r(6) - 2;
    for (const d of H.DECISIONES) h.decisiones[d] = [null, 'a', 'b', 'c'][r(4)];
    h.duendes.trato = [null, 'trato', 'pelea'][r(3)]; h.duendes.noche = ['ninguna', 'pendiente', 'ganada', 'perdida'][r(4)]; h.duendes.deuda = r(3); h.duendes.perdon = rnd() < 0.3;
    h.ramal = r(14); X.amor = rnd() < 0.5; X.perro = rnd() < 0.5;
    P.aldea.pobladores = ['panadera', 'carpintero', 'herrero', 'tejedora', 'apicultor', 'fotografa'].filter(() => rnd() < 0.6).map((c) => ({ clave: c }));
    P.horas = r(24); P.dia = 5 + r(30);
  };
  const correr = (S, id, camino, saltarEn) => {
    const { dir } = S; const usados = []; let k = 0, t = 0;
    if (!dir.disparar(id, { forzar: true })) return null;
    for (let i = 0; i < 30000 && dir.activa(); i++) {
      dir.actualizar(0.1);
      const d = dir.datos();
      if (d?.eleccion && dir.corriendo()) { const m = d.eleccion.opciones.length; usados.push(m); const j = k < camino.length ? camino[k] % m : 0; k++; dir.elegir(j); continue; }
      if (d?.dialogo) { dir.acelerar(true); dir.avanzar(); }
      if (saltarEn >= 0 && ++t === saltarEn + 1) { dir.pedirSaltar(); dir.pedirSaltar(); }
    }
    return { usados, activa: dir.activa() };
  };
  let corridas = 0, malas = 0;
  for (const id of Object.keys(ESC)) {
    for (let v = 0; v < 4; v++) {
      const rnd = rng(1000 + v * 7 + id.length);
      const pila = [[]]; const vistos = new Set();
      while (pila.length) {
        const cam = pila.pop(); const clave = cam.join(',');
        if (vistos.has(clave) || cam.length > 6) continue; vistos.add(clave);
        for (const saltarEn of [-1, 3]) {
          const S = crear({ semilla: 5 + v }); alAzar(S, rnd);
          const h = S.hist();
          const res = correr(S, id, cam, saltarEn);
          corridas++;
          const mal = (m) => { malas++; ok(false, `escena ${id} (camino ${cam}, saltar ${saltarEn}): ${m}`); };
          if (!res) { mal('no se pudo disparar'); continue; }
          if (res.activa) mal('no terminó');
          for (const x of new Set(S.errores)) mal('error ' + x);
          if (!Object.hasOwn(h.escenas.vistas, id)) mal('no quedó vista');
          for (const dd of H.DECISIONES) if (![null, 'a', 'b', 'c'].includes(h.decisiones[dd])) mal('decisión inválida ' + dd);
          for (const q of H.LAZOS_TODOS) if (h.lazos[q] < -2 || h.lazos[q] > 3) mal('lazo fuera de rango ' + q);
          if (h.ramal < 0 || h.ramal > 99 || !Number.isFinite(h.duendes.deuda)) mal('ramal o deuda fuera de rango');
          if (DEC_TRAS[id] && h.decisiones[DEC_TRAS[id]] == null) mal(`la escena de la decisión ${DEC_TRAS[id]} no la dejó tomada`);
          res.usados.forEach((m, i) => { for (let j = 0; j < m; j++) { const c2 = cam.slice(0, i); for (let q = 0; q < i; q++) if (c2[q] === undefined) c2[q] = 0; c2[i] = j; pila.push(c2); } });
        }
      }
    }
  }
  ok(corridas > 3000 && malas === 0, `todas las rutas de las ${Object.keys(ESC).length} escenas (${corridas} corridas)`);
}

// ---------------------------------------------------------------- 4. el saneado con basura
if (va('sanear')) {
  const rnd = rng(7); const r = (k) => Math.floor(rnd() * k);
  const RAROS = ['__proto__', 'constructor', 'a', '', 'x:y', 'a b', 'hasOwnProperty'];
  const BASURA = () => [null, undefined, NaN, Infinity, -Infinity, 1e999, -5, 0, 1, 2.7, 99999999999, '', 'a', 'b', 'ramon', '__proto__', true, false, [], {}, [1, 2], { a: 1 }, 'constructor'][r(23)];
  const gen = (prof = 0) => {
    const t = r(10);
    if (prof > 3 || t < 5) return BASURA();
    if (t < 7) return Array.from({ length: r(4) }, () => gen(prof + 1));
    const o = {};
    for (let i = 0, m = r(5); i < m; i++) Object.defineProperty(o, RAROS[r(RAROS.length)] + (rnd() < 0.3 ? r(3) : ''), { value: gen(prof + 1), enumerable: true, writable: true, configurable: true });
    return o;
  };
  const CLAVES = ['activa', 'capitulo', 'fase', 'hechos', 'base', 'empezada', 'terminada', 'hablados', 'momentos', 'cerrados', 'duendes', 'noche', 'escenas', 'version', 'lazos', 'decisiones', 'ramal', 'fletes', 'entregasVistas', 'molido', 'fletesHarina', 'fletesBase', 'prestado', 'perfil', 'blancos', 'raro', 'temas', 'objetos', 'entregados', 'reparaciones', 'acompanante', 'aplicadas', 'avisoReinicio', 'copiaPrevia', 'optativas', 'oidas', 'panRosa', 'flechasExtra', 'encargosLazo', 'costumbre'];
  let malos = 0;
  for (let i = 0; i < 4000; i++) {
    const x = {};
    for (const k of CLAVES) if (rnd() < 0.7) x[k] = gen();
    if (rnd() < 0.5) x.lazos = Object.fromEntries(H.LAZOS_TODOS.map((k) => [k, gen()]));
    if (rnd() < 0.5) x.duendes = { trato: gen(), vistos: gen(), regalos: gen(), armas: gen(), noche: gen(), final: gen(), intentos: gen(), deuda: gen(), perdon: gen(), convidado: gen() };
    let h;
    try {
      h = H.sanearHistoria(JSON.parse(JSON.stringify(x)));
      const bien = !!H.CAPITULOS[h.capitulo] && ['intro', 'jugando', 'outro', 'fin'].includes(h.fase)
        && H.LAZOS_TODOS.every((k) => Number.isInteger(h.lazos[k]) && h.lazos[k] >= -2 && h.lazos[k] <= 3) && H.DECISIONES.every((d) => [null, 'a', 'b', 'c'].includes(h.decisiones[d]))
        && Object.values(h.hechos).every((d) => Number.isInteger(d) && d >= 0) && Number.isInteger(h.ramal) && h.ramal <= 99 && h.fletes <= 8
        && ['trato', 'pelea', null].includes(h.duendes.trato) && (!h.terminada || (h.fase === 'fin' && h.capitulo === H.CAPITULOS.length - 1))
        && JSON.stringify(H.sanearHistoria(JSON.parse(JSON.stringify(h)))) === JSON.stringify(h);
      const s = H.estadoHistoria({ dia: 5, horas: 10, historia: h }, {});
      H.panelHistoria({ ...h, activa: true }, s); H.resumenHistoria(h); H.lazosEnPalabras(h); H.lineasCarta(H.capituloActual(h), h, 'outro'); D.escenaPendiente({ ...h, activa: true, fase: 'jugando' }, s, {});
      if (!bien) malos++;
    } catch { malos++; }
  }
  ok(malos === 0, `el saneado de la historia con basura (${malos} de 4000 mal)`);
}

// ---------------------------------------------------------------- 5. el jugador de mentira llega al final
if (va('jugador')) {
  const combos = [{ amor: false, perro: false }, { amor: true, perro: false }, { amor: false, perro: true }, { amor: true, perro: true }];
  const decididas = new Set();
  for (const [i, semilla] of [1, 3, 4, 7].entries()) {
    const r = jugar(semilla, combos[i]);
    ok(r.fin === true, `semilla ${semilla}: llega al final de los trece capítulos (${JSON.stringify(r.atascado)})`);
    ok(r.errores.length === 0, `semilla ${semilla}: ninguna escena rompe (${[...new Set(r.errores)].slice(0, 3).join('; ')})`);
    const h = r.S.hist();
    ok(h.fase === 'fin' && h.terminada > 0 && H.CAPITULOS.every((c) => h.cerrados[c.id] > 0), `semilla ${semilla}: los trece capítulos cerrados`);
    for (const d of H.DECISIONES) if (h.decisiones[d]) decididas.add(`${d}:${h.decisiones[d]}`);
    ok(H.LAZOS_TODOS.every((k) => h.lazos[k] >= -2 && h.lazos[k] <= 3) && h.ramal >= 0 && h.ramal <= 99, `semilla ${semilla}: lazos y ramal en rango`);
  }
  ok(decididas.size >= 8, `las semillas toman caminos distintos (${decididas.size} decisiones distintas)`);
}

// ---------------------------------------------------------------- 6. A-01: una historia terminada no se pausa al entrar en «Libre»
if (va('a01')) {
  const terminada = (relax, activa = true) => {
    const J = crearJuego({ relaxTipo: relax });
    const h = J.P.historia;
    Object.assign(h, { activa, capitulo: 12, fase: 'fin', terminada: 90, empezada: 1 });
    h.duendes.trato = 'trato'; h.duendes.final = 'trato'; h.costumbre = { bolsa: 'vacia', cosechas: 0, regalos: 0, dia: 90 };
    J.P.dia = 100; J.P.cosas.harina = 3;
    return J;
  };
  const J = terminada('libre');
  ok(!!J.valle.accionObjeto('bolsa-umbral'), 'A-01: terminada con el trato, la E de la bolsa del umbral anda');
  J.valle.alEntrar();
  ok(J.P.historia.activa === true, 'A-01: entrar con «Libre» no deja en pausa la historia terminada');
  ok(!!J.valle.accionObjeto('bolsa-umbral') && D.hayEDespuesDelFinal(J.P.historia), 'A-01: la costumbre de la bolsa del umbral sigue andando');
  const K = terminada('libre', false);
  K.valle.alEntrar();
  ok(K.P.historia.activa === true && K.guardados.length > 0, 'A-01: la que una versión anterior dejó en pausa al terminar se retoma (y se guarda)');
  const L = terminada('historia', false);
  L.valle.alEntrar();
  ok(L.P.historia.activa === true, 'A-01: entrando con «Historia» también se retoma');
  // lo de siempre sigue igual con la historia en curso
  const M = crearJuego({ relaxTipo: 'libre' });
  Object.assign(M.P.historia, { activa: true, capitulo: 4, fase: 'jugando', empezada: 1 });
  M.valle.alEntrar();
  ok(M.P.historia.activa === false && M.P.historia.fase === 'jugando', 'A-01: en curso, entrar con «Libre» la pausa como siempre');
  M.ajustes.relaxTipo = 'historia'; M.valle.alEntrar();
  ok(M.P.historia.activa === true, 'A-01: y con «Historia» la retoma');
  // sin terminar (terminada = 0) la fase 'fin' sola no cuenta como terminada para retomar
  const N = crearJuego({ relaxTipo: 'libre' });
  Object.assign(N.P.historia, { activa: false, capitulo: 2, fase: 'jugando', empezada: 1 });
  N.valle.alEntrar();
  ok(N.P.historia.activa === false, 'A-01: una en pausa y sin terminar sigue en pausa en «Libre»');
}

// ---------------------------------------------------------------- 7. A-02: la deuda del trato se paga con lo que la escena cobra
if (va('a02')) {
  const s0 = (o = {}) => ({ decisiones: { bolsa: null, coihue: null, ...o.dec }, harina: 0, tablas: 0, tablasCoihue: 0, ...o.cosas });
  const puede = A3D.puedePagarLoQueSeDebe;
  ok(typeof puede === 'function', 'A-02: existe puedePagarLoQueSeDebe');
  ok(!puede(s0({ dec: { bolsa: 'b' }, cosas: { tablas: 10 } })), 'A-02: debés la bolsa (D1 = b) y sólo tenés tablas: no se ofrece pagar (la escena cobra harina)');
  ok(puede(s0({ dec: { bolsa: 'b' }, cosas: { harina: 1 } })), 'A-02: debés la bolsa y tenés harina');
  ok(!puede(s0({ dec: { coihue: 'b' }, cosas: { harina: 5 } })), 'A-02: debés las tablas (D2 = b) y sólo tenés harina: no se ofrece pagar');
  ok(puede(s0({ dec: { coihue: 'b' }, cosas: { tablas: 6 } })) && puede(s0({ dec: { coihue: 'b' }, cosas: { tablasCoihue: 6 } })), 'A-02: debés las tablas y tenés seis (comunes o de coihue)');
  ok(!puede(s0({ dec: { coihue: 'b' }, cosas: { tablas: 5, tablasCoihue: 5 } })), 'A-02: cinco tablas no alcanzan');
  ok(!puede(s0({ dec: { bolsa: 'b', coihue: 'b' }, cosas: { harina: 3 } })) && !puede(s0({ dec: { bolsa: 'b', coihue: 'b' }, cosas: { tablas: 6 } })) && puede(s0({ dec: { bolsa: 'b', coihue: 'b' }, cosas: { harina: 1, tablas: 6 } })), 'A-02: debés las dos cosas: hacen falta las dos');
  ok(puede(s0({ cosas: { harina: 1 } })) && puede(s0({ cosas: { tablas: 6 } })) && !puede(s0()), 'A-02: una deuda sin esas decisiones vale la regla de siempre (harina o tablas)');
  // el objeto del mundo y el disparador lo respetan
  const h = H.historiaNueva(); Object.assign(h, { activa: true, capitulo: 10, fase: 'jugando' }); h.decisiones.bolsa = 'b'; h.duendes.deuda = 1; h.duendes.trato = 'trato';
  const mk = (cosas) => { const p = { dia: 20, horas: 10, historia: h, entradas: {}, cosas: {}, materiales: {}, acopio: {}, ...cosas }; return H.estadoHistoria(p, { lugares: { 'molino-viejo': 3 } }); };
  const sinHarina = mk({ materiales: { tabla: 10 } }), conHarina = mk({ cosas: { harina: 2 } });
  ok(!D.objetosVisibles(h, sinHarina).includes('raiz-deuda') && D.escenaPendiente(h, sinHarina, { modo: 'interaccion', clave: 'raiz-deuda' }) === null, 'A-02: sin harina la raíz no ofrece pagar la bolsa (aunque sobren tablas)');
  ok(D.objetosVisibles(h, conHarina).includes('raiz-deuda') && D.escenaPendiente(h, conHarina, { modo: 'interaccion', clave: 'raiz-deuda' }) === 'deuda-pagada', 'A-02: con harina sí');
  // la escena cobra exactamente lo decidido
  const S = crear({ semilla: 3 }); const hs = S.hist(); hs.decisiones.bolsa = 'b'; hs.decisiones.coihue = 'a'; hs.duendes.deuda = 1;
  correrEscena(S, 'deuda-pagada', { forzar: true, saltar: false });
  igual(S.gastos, [['harina', 1]], 'A-02: la escena de la deuda cobra una harina cuando se debe la bolsa y nada más');
  ok(hs.duendes.deuda === 0, 'A-02: y la deuda queda pagada');
}

// ---------------------------------------------------------------- 8. A-03: «o, si talaste el coihue, llevale a Tito dos tablas»
if (va('a03')) {
  const arco = H.CAPITULO.arco, lenga = arco.objetivos.find((o) => o.id === 'lenga');
  const cap = (dec, cosas) => {
    const h = H.historiaNueva(); Object.assign(h, { activa: true, capitulo: H.CAPITULOS.findIndex((c) => c.id === 'arco'), fase: 'jugando', base: H.baseDe({ talados: 4 }) });
    h.decisiones.coihue = dec;
    const p = { dia: 30, horas: 10, historia: h, entradas: {}, cosas: {}, materiales: {}, acopio: {}, taladosTotal: 4, ...cosas };
    return { h, s: H.estadoHistoria(p, {}) };
  };
  let x = cap('b', { cosas: { 'tabla-coihue': 12 } });
  ok(H.revisarHistoria(x.h, x.s).nuevos.some((o) => o.id === 'lenga'), 'A-03: con el coihue talado (D2 = b) y tablas de coihue, el objetivo de la madera se cumple');
  x = cap('b', { materiales: { tabla: 2 } });
  ok(lenga.hecho(x.s, x.h.base), 'A-03: con dos tablas comunes también (Tito las cobra igual)');
  x = cap('a', { cosas: { 'tabla-coihue': 12 }, materiales: { tabla: 9 } });
  ok(!lenga.hecho(x.s, x.h.base), 'A-03: sin haber talado el coihue (D2 = a) las tablas no cuentan: hay que talar un árbol');
  x = cap('b', {});
  ok(!lenga.hecho(x.s, x.h.base), 'A-03: con D2 = b pero sin tablas, todavía no');
  x = cap(null, { materiales: { tabla: 9 } });
  ok(!lenga.hecho(x.s, x.h.base), 'A-03: con la decisión sin tomar, no');
  const t = cap('a', { taladosTotal: 5 });
  ok(lenga.hecho(t.s, t.h.base), 'A-03: talar un árbol desde que empezó el capítulo sigue valiendo');
}

// ---------------------------------------------------------------- 9. mutaciones
const MUT = [
  ['historia-ui.js', "if (h.fase === 'fin' && h.terminada && !h.activa) { h.activa = true; ctx.guardar(); }", "", 'A-01: la historia terminada que quedó en pausa no se retoma', 'a01'],
  ['historia-ui.js', "} else if (!quiere && h.activa && h.fase !== 'fin') { pausarHistoria(h); ctx.guardar(); }", "} else if (!quiere && h.activa) { pausarHistoria(h); ctx.guardar(); }", 'A-01: entrar en «Libre» pausa la historia terminada', 'a01'],
  ['historia-disparadores-acto3.js', "return (!debeHarina || s.harina >= DEUDA_COSTO.harina) && (!debeTablas ||", "return true || (!debeHarina || s.harina >= DEUDA_COSTO.harina) && (!debeTablas ||", 'A-02: la deuda se paga con cualquier cosa', 'a02'],
  ['historia-disparadores-acto3.js', "visible: (s, h) => enCap(h, 'arco') && s.deuda > 0 && puedePagarLoQueSeDebe(s),", "visible: (s, h) => enCap(h, 'arco') && s.deuda > 0 && (s.harina >= 1 || s.tablas >= 6),", 'A-02: el objeto de la raíz ofrece pagar con harina o tablas a secas', 'a02'],
  ['historia-disparadores-acto3.js', "cond: (s) => s.deuda > 0 && puedePagarLoQueSeDebe(s) },", "cond: (s) => s.deuda > 0 },", 'A-02: el disparador de la deuda no mira lo que alcanza', 'a02'],
  ['historia.js', " || (s.decisiones.coihue === 'b' && (s.tablasCoihue >= 2 || s.tablas >= 2)) },", " },", 'A-03: las dos tablas para Tito no cuentan', 'a03'],
  ['historia.js', "(s.tablasCoihue >= 2 || s.tablas >= 2)) }", "true) }", 'A-03: la madera cuenta con cualquier decisión', 'a03'],
  ['historia-escenas-efectos.js', "reg.registrarCondicion('perdon',", "reg.registrarCondicion('perdon-x',", 'barrido: una condición sin registrar', 'ref'],
  ['historia-escenas-efectos.js', "reg.registrarCondicion('majada-sin-costo',", "reg.registrarCondicion('majada-sin-costo-x',", 'barrido: otra condición sin registrar', 'ref'],
  ['historia-disparadores-acto3.js', "'prestado-tobias': { cap: 'arco',", "'prestado-tobias-x': { cap: 'arco',", 'barrido: un disparador con una escena que no existe', 'ref'],
  ['historia-disparadores.js', "'alero': { forma: 'alero', lx: 2.6, lz: 3.3, visible: (s) => (s.reparaciones.alero || 0) < 4,", "'alero': { forma: 'alero', lx: 2.6, lz: 3.3, escena: 'alero-no-existe', visible: (s) => (s.reparaciones.alero || 0) < 4,", 'barrido: un objeto con una escena que no existe', 'ref'],
  ['historia.js', "h.capitulo = Math.min(CAPITULOS.length - 1, ent(v.capitulo, CAPITULOS.length));", "h.capitulo = ent(v.capitulo, 999);", 'saneado: el capítulo se pasa de rango', 'sanear'],
  ['historia.js', "for (const k of LAZOS_TODOS) h.lazos[k] = Math.max(LAZO_MIN, Math.min(LAZO_MAX, Math.trunc(aNum(obj(v.lazos)[k]) || 0)));", "for (const k of LAZOS_TODOS) h.lazos[k] = Math.trunc(aNum(obj(v.lazos)[k]) || 0);", 'saneado: los lazos se salen de rango', 'sanear'],
  ['historia-disparadores-acto2.js', "'perdidas-devueltas': { cap: 'perdido', modo: 'hablar', clave: 'ercilia',", "'perdidas-devueltas': { cap: 'perdido-x', modo: 'hablar', clave: 'ercilia',", 'alcanzabilidad: una escena del objetivo sin disparador en su capítulo', 'obj,jugador'],
  ['historia-disparadores-acto2.js', "'rueda-gira': { cap: 'rueda', modo: 'auto', requiere: ['tito-coihue'],", "'rueda-gira': { cap: 'rueda', modo: 'auto', requiere: ['tito-coihue', 'trigo-abuelo'],", 'alcanzabilidad: una escena que pide otra que no siempre se hace', 'ref,jugador'],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4184-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = leer(`src/${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4184_CALLADO: '1', A4184_SECCIONES: secc }, encoding: 'utf8', timeout: 240000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!HIJO) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.18.4 (A) la Historia por dentro · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
